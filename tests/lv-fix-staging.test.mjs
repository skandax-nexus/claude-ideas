// v2.1 playtest fixes, unit "staging": show, don't narrate (docs/lastversion/PLAYTEST-v2.1.md).
//   first-time FT-06: the Zero Second shows the 41 coming and the wreck, the woman pinned under a bench and the man caught
//     in a door, posed, before Kai pulls them free; FT-10: the cold open's "Kai Varen is asleep" shot no longer flies
//     through the block east of his door; FT-18: a conversation frames whoever speaks, the HUD stands back while it does,
//     the bars are the staged moments' black, Mission 2's ring reveal is its own shots;
//   acts-1-2 F07: Act II's payoffs on screen (Ward 32's bed, Lin's lanyard and file, the lock's bolts; a shell climbing
//     home; the frozen block's man and its hanging kitchen); acts-3 F04: the climax's places lit and readable; F05: the
//     ending choice and Endings A, B and C as staged moments with their effects.
// The browser checks of the same, by touch at 915x412 and 412x915, were run from the unit's scratch scripts (STATUS).
//   node --test tests/lv-fix-staging.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../game/vendor/three.module.min.js';
import { RealityEngine } from '../game/js/core/RealityEngine.js';
import { FactStore } from '../game/js/core/FactStore.js';
import { compileCondition } from '../game/js/core/conditions.js';
import { LV } from '../game/js/editions/lastversion/index.js';
import { LastVersion } from '../game/js/editions/lastversion/Runtime.js';
import { Cinema } from '../game/js/editions/lastversion/cinema.js';
import { M01, M02, m01Shots, m02Reveal } from '../game/js/editions/lastversion/prologue.js';
import { M11, M13 } from '../game/js/editions/lastversion/act2.js';
import { M23, ENDING_SHOTS } from '../game/js/editions/lastversion/finale.js';
import { ringsOfLight, skyPanes, paneDoor, anchorLight, goneLight, trainRush, shellHome, posePeople } from '../game/js/editions/lastversion/stagefx.js';
import afterzero from '../game/js/editions/lastversion/places/specs/afterzero.js';
import firstsecond from '../game/js/editions/lastversion/places/specs/firstsecond.js';
import spire from '../game/js/editions/lastversion/places/specs/spire.js';

const CINEMA_SRC = fs.readFileSync(new URL('../game/js/editions/lastversion/cinema.js', import.meta.url), 'utf8');

function build(ch, deck) {
  const game = { engine: new RealityEngine(LV.engineOptions()), facts: new FactStore(), story: null };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory(ch);
  return rt.buildLevel({ lv: true, chapter: ch, deck, sector: 0, flags: {} });
}
const holds = (e, facts, state) => !e.when || compileCondition(e.when)({ fact: (k) => facts[k], state });
const solids = (level, facts = {}, state = 'PRESENT') => level.elements.filter((e) => e.solid && holds(e, facts, state));
const inside = (p, b, pad = 0) => p[0] > b[0] - pad && p[0] < b[3] + pad && p[1] > b[1] - pad && p[1] < b[4] + pad && p[2] > b[2] - pad && p[2] < b[5] + pad;
const lerp = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
// (a 2D canvas for the place's painted textures, which the Zero Second's train wears: node has none)
function withCanvas(fn) {
  const had = globalThis.document;
  const ctx = new Proxy({}, {
    get: (t, k) => (k in t ? t[k] : k === 'createImageData' || k === 'getImageData' ? (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w | 0) * Math.max(1, h | 0) * 4) })
      : k === 'measureText' ? () => ({ width: 10 }) : () => ({ addColorStop() {} })),
    set: (t, k, v) => { t[k] = v; return true; },
  });
  globalThis.document ??= { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
  try { return fn(); } finally { if (!had) delete globalThis.document; }
}
// every object in a tree of the stage's data (a mission's scenes, choices, intents)
function* walkObj(o, seen = new Set()) {
  if (!o || typeof o !== 'object' || seen.has(o)) return;
  seen.add(o);
  yield o;
  for (const v of Object.values(o)) yield* walkObj(v, seen);
}

// a game with no browser for the staged moments: a player, a HUD whose lines the test says, facts, timers, a scene
function stage({ pos = [0, 0.86, 0], npcs = [] } = {}) {
  const facts = new FactStore();
  const timers = [];
  const player = { pos: new THREE.Vector3(...pos), vel: new THREE.Vector3(), facing: new THREE.Vector3(0, 0, -1), model: { visible: true }, cinema: null, talkTarget: null, rayDistance: (o, d, len) => len + 1 };
  const hud = { talking: false, subT: 0, cur: null, durFn: null, said: [], say(lines, f, done) { this.said.push(lines); this.done = done; }, flash() {}, skipSub() {}, skipAll() {} };
  const g = { facts, hud, player, input: {}, menu: null, time: 0, scene: { add(o) { (this.kids ||= []).push(o); } }, after(t, fn) { timers.push([t, fn]); }, deckWorld: { npcs, refresh() {} }, fx: { burst() {} } };
  const rt = { g, level: { landmarks: {} } };
  rt.cinema = new Cinema(rt);
  return { g, rt, timers, cinema: rt.cinema };
}

// ---------------------------------------------------------------------------------------------------------------------
test('FT-10: the cold open\'s third shot is taken from across the avenue, outside every building, and leaves Kai out', () => {
  const lv = build('prologue', 0);
  const shot = M01.coldOpen.shots[2];
  assert.equal(shot.hide, true, 'Kai is asleep upstairs: he is not drawn at his door');
  const cols = solids(lv, { co_m01: true });
  for (let i = 0; i <= 20; i++) {
    const p = lerp(shot.cam, shot.to, i / 20);
    const hit = cols.find((e) => inside(p, e.box, 0.25));
    assert.ok(!hit, `the camera at ${p.map((v) => v.toFixed(1))} is inside ${JSON.stringify(hit?.box)}`);
  }
  // (a passer-by's height, looking up at the building: its roofline on the sky)
  assert.ok(shot.cam[1] < 4 && shot.look[1] > shot.cam[1] + 4, JSON.stringify(shot));
  // (the cinema leaves him out for that shot only, and draws him again after it)
  const { g, cinema } = stage({ pos: [-4, 0.86, -12] });
  g.player.model.visible = true;
  cinema.play({ shots: [{ cam: [-8, 2.4, -17], look: [14, 10, -2.2], t: 1, hide: true }, { cam: [20, 4, 10], look: [-4, 1.6, -12], t: 1 }], lines: [], total: 2 });
  assert.equal(g.player.model.visible, false);
  cinema.step(1.05);
  cinema.step(0.1);
  assert.equal(g.player.model.visible, true);
});

test('FT-06: the Zero Second shows the 41 coming and the wreck; the two people are posed where they are trapped', () => {
  const lv = build('prologue', 0);
  const L = lv.landmarks;
  const shots = m01Shots({ level: lv }, 'zero');
  assert.equal(shots.length, 3);
  // (the clock, then down the track at the 41 for the impact at 2.9 s, then the wreck from high)
  assert.ok(Math.abs(shots[0].t + shots[1].t - 2.9) < 0.05, `${shots[0].t} + ${shots[1].t}`);
  assert.ok(shots[2].cam[1] - L.carriageDoor[1] > 4, 'the aftermath from high over the wreck');
  // the wreck stands after the Zero Second and not in the minute before it (PAST), and it is solid
  const wreck = lv.elements.filter((e) => e.solid && /after_zero/.test(e.when || ''));
  assert.ok(wreck.length >= 12, `${wreck.length} colliders of the wreck`);
  assert.equal(solids(lv, { after_zero: true }, 'PAST').filter((e) => /after_zero/.test(e.when || '')).length, 0, 'the wreck is not in 8:13');
  assert.equal(solids(lv, {}, 'PRESENT').filter((e) => /after_zero/.test(e.when || '')).length, 0, 'nor before the Zero Second');
  // the woman under the bench and the man in the door: posed, frozen, with a face for the conversation's camera
  const a = lv.npcs.find((n) => n.id === 'trapped_a'), b = lv.npcs.find((n) => n.id === 'trapped_b');
  assert.equal(a.pose, 'pinned');
  assert.equal(b.pose, 'caught');
  for (const n of [a, b]) {
    assert.ok(Array.isArray(n.talkAt) && n.talkAt.length === 3, n.id);
    assert.ok(n.freezeWhen, n.id);
    assert.match(n.when, /after_zero/);
  }
  assert.ok(a.talkAt[1] < 0.8, 'her face is low: she lies on her back');
  // the train is an effect that comes at the camera and stops at the impact
  const fx = withCanvas(() => trainRush({ from: [-60, 2, -170], dir: 1, speed: 34 }));
  const x0 = fx.obj.position.x;
  fx.update(0.5);
  assert.ok(fx.obj.position.x > x0 + 10, 'it comes in at full speed');
  fx.stop();
  let n = 0;
  while (fx.update(0.1) !== false && n++ < 200);
  assert.ok(n < 200, 'stopped, it is gone');
  fx.dispose();
});

test('FT-06 / F07: posePeople lays the pinned on their back, the caught and the kneeling low, and leaves the rest standing', () => {
  const mk = (pose, pos, yaw = 0) => ({ n: { pose, pos, yaw }, model: Object.assign(new THREE.Group(), { visible: true }) });
  const people = [mk('pinned', [1, 3.4, 2], 0.5), mk('caught', [4, 3.4, 2]), mk('kneel', [6, 0, 1]), mk(undefined, [9, 0, 0])];
  people[3].model.position.set(9, 0, 0);
  posePeople({ deckWorld: { npcs: people } });
  const [p, c, k, s] = people.map((x) => x.model);
  assert.ok(Math.abs(p.rotation.x + Math.PI / 2) < 1e-6 && Math.abs(p.rotation.y - 0.5) < 1e-6, 'on her back, her head the way she lies');
  assert.ok(p.position.y > 3.4 && p.position.y < 3.7);
  assert.ok(c.position.y < 3.0 && c.rotation.x > 0.1, 'on his knees, leaning');
  assert.ok(k.position.y < 0 && k.rotation.x > 0.3, 'on one knee, bent over his shoe');
  assert.equal(s.rotation.x, 0);
  assert.deepEqual(s.position.toArray(), [9, 0, 0]);
});

test('FT-18: a conversation frames whoever speaks, and lets the camera go when it ends', () => {
  const her = { n: { id: 'crew' }, model: { position: new THREE.Vector3(0, 0, -3), visible: true } };
  const { g, cinema } = stage({ pos: [0, 0.86, 0], npcs: [her] });
  g.player.talkTarget = [0, 1.62, -3];
  g.hud.talking = true;
  g.hud.subT = 1;
  g.hud.cur = { who: 'CREW', text: 'Then somebody\'s been sleepwalking with your card.' };
  cinema.step(1 / 30);
  const c = g.player.cinema;
  assert.ok(c?.talk, 'the conversation\'s camera');
  // (her, from beside Kai: the camera on his side of her, looking at her face)
  assert.ok(c.pos.z > -3 + 1 && Math.abs(c.target.z + 3) < 0.3 && Math.abs(c.target.y - 1.4) < 0.3, JSON.stringify(c));
  // Kai's own line: the reverse shot, from her side, looking at him (a cut: no easing across)
  g.hud.cur = { who: 'KAI', text: 'Who else came through at 05:40?' };
  cinema.step(1 / 30);
  const r = g.player.cinema;
  assert.ok(r.pos.z < -1.5 && Math.abs(r.target.z) < 0.3, JSON.stringify(r));
  // the conversation over: the game's camera again
  g.hud.talking = false;
  g.hud.subT = 0;
  cinema.step(1 / 30);
  assert.equal(g.player.cinema, null);
  // someone lying on the floor (talkAt) is seen from over her, the camera above the stones
  const lying = { n: { id: 'trapped_a', talkAt: [1.2, 0.3, 0] }, model: { position: new THREE.Vector3(4, 0, -2), visible: true } };
  const s2 = stage({ pos: [3, 0.86, 0.5], npcs: [lying] });
  s2.g.player.talkTarget = [4, 1.7, -2];
  Object.assign(s2.g.hud, { talking: true, subT: 1, cur: { who: 'WOMAN', text: 'My leg.' } });
  s2.cinema.step(1 / 30);
  const lc = s2.g.player.cinema;
  assert.ok(lc.pos.y > 1.5 && lc.target.y < 0.4, JSON.stringify(lc));
});

test('FT-18: while people talk the stick, the objective and the buttons stand back, and every bar is the same black', () => {
  for (const sel of ['#buttons', '#minimap', '#objective', '#lvTop', '#stickzone #stick']) assert.ok(new RegExp(`body\\.lastversion\\.talking ${sel.replace(/[#.]/g, (c) => `\\${c}`)}`).test(CINEMA_SRC), `${sel} hidden while talking`);
  assert.match(CINEMA_SRC, /body\.lastversion #letterbox i \{ background: #000; \}/);
  assert.match(CINEMA_SRC, /body\.lastversion\.talking #letterbox i \{ height: 9vh; \}/);
  assert.match(CINEMA_SRC, /lvcine #lvBars::after \{ height: 9vh; \}/);
});

test('FT-18: Mission 2\'s ring reveal is its own shots, built from where Kai stands, the ring over him and not Rook\'s head', () => {
  const lv = build('prologue', 1);
  const ring = lv.landmarks.chamber;
  assert.ok(ring, 'the chamber landmark');
  const p = [ring[0], ring[1] + 0.86, ring[2] + 7];
  const shots = m02Reveal({ level: lv, g: { player: { pos: new THREE.Vector3(...p) } } });
  assert.equal(shots.length, 3);
  assert.equal(typeof M02.hook.shots, 'function');
  // (first: low behind him, looking up at the ring's top; then from the ring's side back at his face)
  assert.ok(shots[0].look[1] > ring[1] + 3 && Math.hypot(shots[0].cam[0] - p[0], shots[0].cam[2] - p[2]) > 3);
  assert.ok(Math.hypot(shots[1].look[0] - p[0], shots[1].look[2] - p[2]) < 0.01 && shots[1].cam[2] < p[2]);
  for (const s of shots) for (const v of [...s.cam, ...s.to, ...s.look]) assert.ok(Number.isFinite(v));
  // (the cinema takes shots as a function of the runtime, built when the moment plays)
  const { rt, cinema } = stage({ pos: p });
  rt.level = lv;
  let called = 0;
  cinema.play({ shots: (r) => { called++; return m02Reveal(r); }, lines: [], total: 6 });
  assert.equal(called, 1);
  assert.equal(cinema.active.shots.length, 3);
});

// ---------------------------------------------------------------------------------------------------------------------
test('F07: Ward 32\'s bed carries Lin\'s lanyard and the file, its scene and the hook are shot close, the lock\'s bolts too', () => {
  const lv = build('act2', 2);
  const bed = lv.interactables.find((x) => x.id === 'ward32_things');
  assert.ok(bed && typeof bed.model === 'function' && bed.room === 'h_ward32', 'the bed\'s things');
  const things = bed.model();
  assert.ok(things.children.length >= 12, `${things.children.length} pieces: mattress, pillow, blanket, lanyard, file, photograph`);
  assert.equal(M11.scenes.ward32.show, 'm11_ward_view');
  assert.equal(typeof M11.hook.shots, 'function');
  const hook = M11.hook.shots({ level: lv });
  assert.equal(hook.length, 2);
  // (the file and its photograph from under a metre away: legible on a phone)
  const d = Math.hypot(...hook[0].cam.map((v, i) => v - hook[0].look[i]));
  assert.ok(d < 1.0, `the file shot from ${d.toFixed(2)} m`);
  assert.ok(M11.rules.some((r) => r.when === 'inv_m11lock_done' && r.then === 'lockOpen') && typeof M11.fx.lockOpen === 'function');
});

test('F07: a shell held in flight is seen climbing home into the gun that fired it', () => {
  for (const id of ['shellA', 'shellB']) {
    const r = M13.rules.find((x) => x.id === id);
    assert.ok(r && /^shellHome[AB]$/.test(r.then) && typeof M13.fx[r.then] === 'function', id);
  }
  const from = [57, 0.4, 40], to = [-100, 3, -84.5];
  const fx = shellHome({ from, to, apex: 30, dur: 3.4, delay: 0.3 });
  const start = fx.pos(0), top = fx.pos(0.3 + 1.7), end = fx.pos(fx.end);
  assert.ok(Math.hypot(...start.map((v, i) => v - from[i])) < 0.5, 'from where it fell');
  assert.ok(top[1] > 25, `it climbs (${top[1].toFixed(1)} m)`);
  assert.ok(Math.hypot(...end.map((v, i) => v - to[i])) < 0.5, 'into the gun');
  let n = 0;
  while (fx.update(0.1) !== false && n++ < 300);
  assert.ok(n < 300);
  fx.dispose();
});

test('F07: the frozen block\'s man tying his shoe and the woman at her stove stand where its scene says, frozen and on something', () => {
  const lv = build('act2', 4);
  const shoe = lv.npcs.find((n) => n.id === 'm13_shoe'), mother = lv.npcs.find((n) => n.id === 'm13_mother');
  assert.equal(shoe.pose, 'kneel');
  for (const n of [shoe, mother]) {
    assert.ok(n.freezeWhen && n.silent && n.ambient, n.id);
    assert.equal(n.when, '!civilians_freed && @PRESENT');
  }
  assert.equal(mother.crew, 'm13_mother', 'her own look, not a crowd\'s or another mission\'s person');
  // (she stands on the kitchen's floor, three floors up, while the block is frozen)
  const under = solids(lv, {}, 'PRESENT').filter((e) => inside([mother.pos[0], mother.pos[1] - 0.05, mother.pos[2]], e.box, 0.02));
  assert.ok(under.length, `nothing under her at ${mother.pos}`);
  assert.equal(solids(lv, { civilians_freed: true }, 'PRESENT').filter((e) => inside([mother.pos[0], mother.pos[1] - 0.05, mother.pos[2]], e.box, 0.02)).length, 0, 'freed, the kitchen is down');
  assert.equal(M13.scenes.block.show, 'm13_block_view');
});

test('F07: a scene\'s own camera plays while its show fact is up, and does not cut into a moment already playing', () => {
  const { g, cinema } = stage();
  const shots = [{ cam: [0, 2, 5], look: [0, 1, 0] }];
  cinema.watchShow('m13_block_view', shots);
  assert.equal(cinema.active, null);
  g.facts.set('m13_block_view', true);
  cinema.watchShow('m13_block_view', shots);
  assert.equal(cinema.active?.tag, 'show:m13_block_view');
  cinema.step(0.1);
  assert.ok(g.player.cinema);
  g.facts.set('m13_block_view', false);
  cinema.watchShow('m13_block_view', shots);
  assert.equal(cinema.active, null);
  assert.equal(g.player.cinema, null);
  // (a moment playing keeps the camera)
  cinema.play({ shots: [{ cam: [1, 2, 3], look: [0, 0, 0], t: 5 }], lines: [], total: 5 });
  const mine = cinema.active;
  g.facts.set('m11_ward_view', true);
  cinema.watchShow('m11_ward_view', shots);
  assert.equal(cinema.active, mine);
});

// ---------------------------------------------------------------------------------------------------------------------
test('F04: the summit, the first-second chamber and the original Chronolith are lit and stand clear of the hill\'s rocks', () => {
  assert.equal(afterzero.edges.N, 'slope', 'no rock slabs (the black shapes) behind the ring');
  for (const [name, spec, n] of [['afterzero', afterzero, 4], ['firstsecond', firstsecond, 4], ['spire', spire, 4]]) {
    assert.ok(spec.lights?.length >= n, `${name}: ${spec.lights?.length} lights`);
    for (const l of spec.lights) assert.ok(l[4] >= 1.2 && l[5] >= 10, `${name}: ${JSON.stringify(l)}`);
  }
  const lv = build('finale', 0);
  const glow = lv.vis.filter((v) => v.m === 'stormGlow');
  const fire = lv.vis.filter((v) => v.m === 'fireGlow');
  assert.ok(glow.length >= 4, `${glow.length} lit edges on the ring`);
  assert.ok(fire.length >= 4, `${fire.length} braziers`);
  // (the ring stands while the ending's moment plays, even Ending A's)
  assert.ok(glow.every((e) => !e.when || /m23_beat/.test(e.when)), glow.map((e) => e.when).join());
});

test('F05: the ending choice plays as its own moment: Endings A, B and C each stage their effects and Kai stays out of the gate', () => {
  assert.deepEqual(Object.fromEntries(Object.entries(ENDING_SHOTS).map(([k, v]) => [k, v.length])), { A: 4, B: 3, C: 5 });
  const RING = [0, 9.6, -152];
  for (const key of ['A', 'B', 'C']) {
    const choice = [...walkObj(M23)].find((o) => o.then === `beat${key}` && o.label);
    assert.ok(choice?.lines?.length, `the choice that plays beat${key}`);
    assert.equal(typeof M23.fx[`beat${key}`], 'function');
    const mira = { n: { id: 'mira23' }, model: { position: new THREE.Vector3(1.6, 4, -142.5), userData: { wave() {} } } };
    const witness = { n: { id: 'witness_gate' }, model: { position: new THREE.Vector3(-2.4, 0, -23.2), userData: {} } };
    const { g, rt, cinema } = stage({ pos: [0, 4.86, -141], npcs: [mira, witness] });
    const fxs = [];
    cinema.addFx = (f) => { fxs.push(f); return f; };
    M23.fx[`beat${key}`](rt);
    assert.ok(cinema.active?.rig, 'a rig of its own, its shots built line by line');
    assert.equal(g.facts.get('m23_beat'), true);
    const said = [{ who: 'KAI', text: choice.label }, ...choice.lines];
    let minGate = 1e9, frames = 0, hidden = 0;
    const run = (sec) => {
      for (let t = 0; t < sec; t += 1 / 30) {
        cinema.step(1 / 30);
        frames++;
        const c = g.player.cinema;
        assert.ok(c && [c.pos.x, c.pos.y, c.pos.z, c.target.x, c.target.y, c.target.z].every(Number.isFinite), `${key}: a camera every frame`);
        if (!g.player.model.visible) hidden++;
        minGate = Math.min(minGate, Math.max(Math.abs(g.player.pos.x - RING[0]), Math.abs(g.player.pos.z - RING[2])));
      }
    };
    for (const l of said) {
      Object.assign(g.hud, { talking: true, subT: 1, cur: l });
      run(Math.max(2.2, l.text.length * 0.055));
    }
    Object.assign(g.hud, { talking: false, subT: 0, cur: null });
    run(1);
    assert.equal(g.facts.get('m23_beat'), false, `${key}: the ending's sky once the lines are over`);
    // the ring's own gate (the mission's exit, 2 m round the ring's foot) is never walked into under the moment
    assert.ok(minGate > 2.05, `${key}: Kai came within ${minGate.toFixed(2)} m of the ring's gate`);
    if (key === 'A') {
      assert.ok(fxs.length >= 1 && g.facts.get('m23_mira_gone'), 'the rings of light, and then it is morning');
    } else if (key === 'B') {
      assert.ok(fxs.length >= 3 && g.facts.get('m23_mira_gone'), `the panes of sky, her door, her going (${fxs.length})`);
    } else {
      assert.ok(fxs.length >= 2 && g.facts.get('m23_gone') && hidden > 0, `the anchor's light, the man at the gate gone (${fxs.length}, ${hidden})`);
    }
  }
});

test('F05: every effect of the endings lives its time, draws nothing after, and lets go of what it made', () => {
  const made = [
    ringsOfLight({ center: [0, 9.6, -152], R: 5, n: 5, every: 0.3, life: 2 }),
    skyPanes({ center: [0, 4, -146], n: 6, life: 3 }),
    paneDoor({ at: [1, 4, -143], yaw: 0.4, life: 2 }),
    anchorLight({ center: [0, 9.6, -152], life: 3 }),
    goneLight({ at: [-2.4, 0, -23.2], life: 1.5 }),
  ];
  const { g, cinema } = stage();
  for (const f of made) {
    assert.ok(f.obj instanceof THREE.Object3D && typeof f.update === 'function', 'an effect');
    cinema.addFx(f);
  }
  assert.equal(g.scene.kids.length, made.length, 'added to the scene');
  let disposed = 0;
  for (const f of made) {
    const d = f.dispose;
    f.dispose = () => { disposed++; d?.(); };
  }
  for (let t = 0; t < 60 && cinema.fxs.length; t += 0.1) cinema.stepFx(0.1);
  assert.equal(cinema.fxs.length, 0, 'over');
  assert.equal(disposed, made.length, 'let go');
  // (a new place drops the effects of the last one at once)
  cinema.addFx(goneLight({ at: [0, 0, 0], life: 5 }));
  cinema.end(true);
  assert.equal(cinema.fxs.length, 0);
});

test('F05: a rig drives the camera and Kai\'s visibility, and the game\'s camera comes back when it ends', () => {
  const { g, cinema, timers } = stage();
  let ended = 0;
  cinema.play({ shots: null, lines: [], total: 2, rig: (dt, t) => ({ cam: [t, 2, 5], look: [0, 1, 0], hide: t > 0.5 }) }, () => ended++);
  cinema.step(0.25);
  assert.ok(Math.abs(g.player.cinema.pos.x - 0.25) < 1e-9 && g.player.model.visible);
  cinema.step(0.5);
  assert.equal(g.player.model.visible, false);
  timers.find(([t]) => t === 2)[1]();
  assert.equal(ended, 1);
  assert.equal(g.player.cinema, null);
  assert.equal(cinema.active, null);
});
