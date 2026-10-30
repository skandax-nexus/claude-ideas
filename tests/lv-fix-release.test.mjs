// THE LAST VERSION OF EARTH v2.1.1, the release check of the v2.1 playtest fixes (docs/lastversion/STATUS.md, "v2.1.1"):
//   - the labels: 2.1.1 is an update of 2.1, installed over it with its saves (same app id, APK name and app label; a
//     higher versionName and versionCode), and the title says v2.1.1
//   - Mission 6's brass arm (playtest acts-1-2 F02): what its first hit's toast tells the player works when followed,
//     walked with the game's own Player physics across the arm's floor and the game's own hit test (DeckWorld's sweeper)
//   node --test tests/lv-fix-release.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../game/vendor/three.module.min.js';
import { RealityEngine } from '../game/js/core/RealityEngine.js';
import { FactStore } from '../game/js/core/FactStore.js';
import { compileCondition } from '../game/js/core/conditions.js';
import { Player } from '../game/js/entities/Player.js';
import { LV } from '../game/js/editions/lastversion/index.js';
import { LastVersion } from '../game/js/editions/lastversion/Runtime.js';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');

test('v2.1.1: an update of 2.1 (same app, label and APK name; versionName 2.1.1, versionCode 211), and the title says so', () => {
  const build = read('../android/build-apk.sh');
  const lv = build.slice(build.indexOf('if [ "$EDITION" = "lastversion" ]'), build.indexOf('elif [ -n "$EDITION" ]'));
  assert.match(lv, /VER=2\.1\n/, 'the APK keeps its name, AFTERZERO-LastVersion-v2.1.apk');
  assert.match(lv, /APP_ID="com\.afterzero\.lastversion\.v2_1"/, 'the same app id: installed over 2.1, its saves kept');
  assert.match(lv, /android:versionCode="211"/);
  assert.match(lv, /android:versionName="2\.1\.1"/);
  assert.match(lv, /android:label="AFTERZERO: Last Version 2\.1"/, 'the same label on the phone');
  assert.ok(211 > 210, 'Android installs an update only over a lower versionCode (2.1 was 210)');
  const rt = read('../game/js/editions/lastversion/Runtime.js');
  assert.ok(rt.includes("$('#title .ver').textContent = 'v2.1.1 · The Last Version of Earth';"));
});

// Mission 6's level, built as the runtime builds it
function build(ch, deck) {
  const game = { engine: new RealityEngine(LV.engineOptions()), facts: new FactStore(), story: null };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory(ch);
  return rt.buildLevel({ lv: true, chapter: ch, deck, sector: 0, flags: {} });
}
const M6L = build('act1', 2);
const ARM = M6L.hazards.find((h) => h.lvKit === 'brassArm');

// Kai walks straight across the arm's floor at offset `side` (metres from the post, + toward the shop's front) in the
// direction `dir` (+1 east, toward the stair up; -1 west, back to the counter), starting 0.4 m outside the brass ring,
// `wait` seconds after an end of the bar swept past him there. The bar turns as DeckWorld turns it; a hit is DeckWorld's
// (Kai's height across the bar's, within its reach, 0.42 m from its line). Returns true when he gets across untouched.
function cross(side, dir, wait) {
  const cols = M6L.elements.filter((e) => e.solid && (!e.when || compileCondition(e.when)({ fact: () => false, state: 'PRESENT' })))
    .map((e) => ({ min: e.box.slice(0, 3), max: e.box.slice(3) }));
  const [px, py, pz] = ARM.pivot, R = ARM.radius;
  const half = Math.sqrt(R * R - side * side);
  const x0 = px - dir * (half + 0.4), x1 = px + dir * (half + 0.6), z = pz + side;
  const p = Object.assign(Object.create(Player.prototype), { pos: new THREE.Vector3(x0, 0.86, z), vel: new THREE.Vector3(), H: new THREE.Vector3(dir, 0, 0), U: new THREE.Vector3(0, 1, 0), gravity: -1, grounded: true, half: new THREE.Vector3(0.3, 0.85, 0.3), topSpeed: null, stepOff: 0, airT: 0, _canStep: false, comfort: true, pitch: 0, facing: new THREE.Vector3(dir, 0, 0), colliders: [] });
  // the end that just swept past him: the bar's line through his bearing (DeckWorld: direction (cos a, -sin a))
  let angle = Math.atan2(-(z - pz), x0 - px) + ARM.speed * wait;
  const dt = 1 / 60;
  for (let t = 0; t < 6; t += dt) {
    p.update(dt, { forward: 1, strafe: 0, run: false, jump: false, slow: false }, cols);
    angle += ARM.speed * dt;
    const feet = p.pos.y - p.half.y, head = p.pos.y + p.half.y;
    const dx = p.pos.x - px, dz = p.pos.z - pz, ax = Math.cos(angle), az = -Math.sin(angle);
    const along = dx * ax + dz * az;
    if (!(feet > py + 0.1 || head < py - 0.1) && Math.abs(along) <= R && Math.abs(dx * -az + dz * ax) < 0.42) return false;
    if ((p.pos.x - x1) * dir > 0) return true;
  }
  return false;
}

test('M6 (acts-1-2 F02, release check): the arm\'s toast works when followed: let an end pass, count two, then follow it the way it turns', () => {
  assert.ok(ARM && ARM.radius === 2.3 && ARM.speed === 0.9, JSON.stringify(ARM));
  const toast = read('../game/js/editions/lastversion/act1.js').match(/THE BRASS ARM<\/small><br>It knocked you back[^']*/)?.[0] || '';
  assert.match(toast, /let an end sweep past you, count two, then follow it across, the way it turns/, toast);
  assert.doesNotMatch(toast, /walk in behind it/, 'the advice the review found failing when followed');
  // the bar turns so that on the shop's front side of the post it moves east, toward the stair, and on the well's side
  // west, back to the counter: following it, "count two" (2.2 s, and a slower count, 2.6 s) gets Kai across, from beside
  // the post (0.6 m: the post's collider and Kai's half-width) to the well's railing (1.9 m), both ways; a quick count
  // (2 s) everywhere but brushing the post
  for (const wait of [2.2, 2.6]) {
    for (const off of [0.6, 0.7, 1.0, 1.5, 1.9]) {
      assert.ok(cross(off, 1, wait), `toward the stair on the front side, ${off} m from the post, after ${wait} s`);
      assert.ok(cross(-off, -1, wait), `back to the counter on the well's side, ${off} m from the post, after ${wait} s`);
    }
  }
  for (const off of [0.7, 1.0, 1.5, 1.9]) assert.ok(cross(off, 1, 2.0) && cross(-off, -1, 2.0), `a quick count, ${off} m from the post`);
  // what the first toast said, walking in at once behind it, is hit near the post (the review's 0.3, 0.7, 1.1 s)
  for (const wait of [0.3, 0.7, 1.1]) assert.equal(cross(1.0, 1, wait), false, `in at ${wait} s, 1 m from the post`);
  // and against its turn near the post nobody gets across: the bar's other half is half a turn behind
  for (const wait of [0, 1, 2, 3]) assert.equal(cross(-1.0, 1, wait), false, `against the turn, after ${wait} s`);
});

// a save is a finished campaign (CONTINUE opens its ending's card, the flow unit's X2) only in the Finale, where the ending
// is reached: a save of another chapter that carries the ending fact plays on with its PREVIOUSLY card (the full bot's
// Act II save, made from a finished one, loaded to the ending card in the release check)
test('X2 (release check): only a Finale save with its ending loads to the ending card; an Act II save carrying the fact does not', () => {
  const rt = (chapter) => {
    const game = { engine: new RealityEngine(LV.engineOptions()), facts: new FactStore(), story: null, deckWorld: { flags: {} } };
    const r = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
    game.story = r.makeStory(chapter);
    game.campaign = { lv: true, chapter, deck: 0, sector: 0, quarter: 0, flags: {} };
    r.start = () => {};
    game.facts.set('ending', 'C');
    return r;
  };
  const fin = rt('finale');
  fin.resume({ lv: true, chapter: 'finale', deck: 0, sector: 0, flags: {}, lvFormat: 24 });
  assert.equal(fin.finishedLoad, true);
  const a2 = rt('act2');
  a2.resume({ lv: true, chapter: 'act2', deck: 0, sector: 0, flags: {}, lvFormat: 24 });
  assert.equal(a2.finishedLoad, false, 'an Act II save plays on');
  const src = read('../game/js/editions/lastversion/Runtime.js');
  // (an ending still playing is not finished yet: v2.1.1 playtest M19)
  assert.ok(src.includes('const end = this.endingDone();') && src.includes("return chapter === 'finale' && !f.get('ending_playing') ? f.get('ending') || null : null;"), 'the slot\'s name says the same');
});

// Mission 11's lock close-up (the staging unit's F07) plays the first time Kai comes up to the lock; held back by a line
// or a menu as he came, it no longer breaks in after he has tried a bolt and takes the camera from his next (the full
// bot's second bolt found no target under it in the release check)
test('M11 (release check): the lock\'s close-up plays as Kai first comes up to it, never once he has tried a bolt', async () => {
  const { M11 } = await import('../game/js/editions/lastversion/act2.js');
  const run = (lock) => {
    const plays = [];
    const rt = {
      level: { landmarks: { ward32Door: [0, 0, 0, 0] } },
      threads: { current: () => ({ id: 'lock' }) },
      cinema: { active: null, play: (o) => plays.push(o), watchShow: () => {} },
      inv: { procs: [lock], active: null },
      g: { player: { pos: { x: 0, y: 0.86, z: 2.6 } }, hud: { talking: false }, menu: null, facts: new FactStore(), engine: { state: () => 'PRESENT' } },
    };
    try { M11.step(rt, 1 / 30); } catch { /* (what follows the close-up needs the browser's world) */ }
    return { plays: plays.length, seen: !!rt.m11LockSeen };
  };
  const fresh = { rec: { id: 'm11lock' }, jamPart: -1, partOut: [false, false, false, false] };
  assert.deepEqual(run(fresh), { plays: 1, seen: true }, 'first up to it: the close-up');
  const jammed = { rec: { id: 'm11lock' }, jamPart: 0, partOut: [false, false, false, false] };
  assert.deepEqual(run(jammed), { plays: 0, seen: true }, 'a bolt already tried (a jam): no close-up');
  const out = { rec: { id: 'm11lock' }, jamPart: -1, partOut: [false, false, false, 'moving'] };
  assert.deepEqual(run(out), { plays: 0, seen: true }, 'a bolt backing out: no close-up');
});

// the Finale past the street that fell: the follow-up made the seam the checkpoint there (acts-3 F06), and the place a
// load puts Kai (the flow unit's anchor, kept as the street's thread was done) held only with the checkpoint it was
// reached from, the platform's: a load past the street went to the seam, 11 m on (tests/lv-fix-flow.mjs street)
test('acts-3 F06 (release check): past the street, the anchor kept there holds with the seam as the checkpoint; one behind the pit does not', async () => {
  const { M23 } = await import('../game/js/editions/lastversion/finale.js');
  const facts = new FactStore();
  facts.set('t_m23_streets');
  facts.set('t_m23_street');
  const level = { outdoorRoom: 'road', landmarks: { seam41: [0, 0, 108, Math.PI] } };
  const mk = (z) => {
    const g = { facts, room: 'road', checkpoint: [-5, 0.86, 166, Math.PI], player: { pos: new THREE.Vector3(2, 0.86, 118.9), place() {} }, hud: { say() {} },
      campaign: { anchor: { mkey: 'm23', sector: 0, room: 'road', year: 'PAST', pos: [2, 0.85, z, 0], cp: [-5, 0.86, 166] } } };
    M23.step({ g, level, inv: { procs: [] }, deck: M23, pendingResume: null }, 0.1);
    return g;
  };
  const past = mk(118.96);
  assert.deepEqual(past.checkpoint, [0, 0.86, 108, Math.PI]);
  assert.deepEqual(past.campaign.anchor.cp, [0, 0.86, 108], 'reached from the seam: a load puts Kai where he stood');
  const behind = mk(130);
  assert.deepEqual(behind.campaign.anchor.cp, [-5, 0.86, 166], 'an anchor behind the pit is left as it was (the load goes to the seam)');
});
