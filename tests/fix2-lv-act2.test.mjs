// THE LAST VERSION OF EARTH v2.1.1 playtest fixes, Act II, Missions 9-13 (docs/lastversion/PLAYTEST-v2.1.1.md; unit
// lv-act2): Mission 12's court and its way back up to the roofs (H1, M7), Mission 10's hall stair, checkpoints and yard
// (H2, H3, M6), the watchers' reach up and down, through walls and after a catch (M8, L15, H3), and the lines, prompts,
// patrols and staging of Missions 9-13 the playtest found wrong. The browser checks of the same items, by touch, are in
// docs/lastversion/STATUS.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../game/vendor/three.module.min.js';
import { RealityEngine } from '../game/js/core/RealityEngine.js';
import { FactStore } from '../game/js/core/FactStore.js';
import { compileCondition } from '../game/js/core/conditions.js';
import { LV } from '../game/js/editions/lastversion/index.js';
import { LastVersion } from '../game/js/editions/lastversion/Runtime.js';
import { M09, M10, M11, M12, M13 } from '../game/js/editions/lastversion/act2.js';
import { threadsOf } from '../game/js/editions/lastversion/Threads.js';
import { Player } from '../game/js/entities/Player.js';
import { Sentinel } from '../game/js/world/DeckWorld.js';
import { limitWatcher, blocked, inSight, inReach, Watchers, GRACE } from '../game/js/editions/lastversion/watchers.js';

// a mission's level, built the way the runtime builds it (Runtime.buildLevel with a stand-in game)
function build(ch, deck) {
  const game = { engine: new RealityEngine(LV.engineOptions()), facts: new FactStore(), story: null };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory(ch);
  const level = rt.buildLevel({ lv: true, chapter: ch, deck, sector: 0, flags: {} });
  level.deckDef = game.story.decks[deck];
  return level;
}
const [L9, L10, , L12, L13] = [0, 1, 2, 3, 4].map((d) => build('act2', d));

const conds = new Map();
const holds = (when, state, facts) => {
  if (!when) return true;
  let f = conds.get(when);
  if (!f) conds.set(when, (f = compileCondition(when)));
  return !!f({ fact: typeof facts === 'function' ? facts : (k) => facts[k], state });
};
const solids = (level, state = 'PRESENT', facts = {}) => level.elements.filter((e) => e.solid && holds(e.when, state, facts));
const colsOf = (level, state, facts) => solids(level, state, facts).map((e) => ({ min: e.box.slice(0, 3), max: e.box.slice(3) }));
function roomAt(level, x, y, z, fallback = null) {
  for (const id of level.order) for (const b of level.rooms[id].bounds) if (x >= b[0] && x < b[3] && y >= b[1] && y < b[4] && z >= b[2] && z < b[5]) return id;
  return fallback;
}
// Kai walks [x, z] waypoints with the game's own physics (entities/Player.js), as tests/fix2-lv-early.test.mjs walk
function walk(level, start, route, { facts = {}, state = 'PRESENT', run = false } = {}) {
  const cols = colsOf(level, state, facts);
  const p = Object.assign(Object.create(Player.prototype), { pos: new THREE.Vector3(start[0], start[1] + 0.86, start[2]), vel: new THREE.Vector3(), H: new THREE.Vector3(0, 0, -1), U: new THREE.Vector3(0, 1, 0), gravity: -1, grounded: false, half: new THREE.Vector3(0.3, 0.85, 0.3), topSpeed: null, stepOff: 0, airT: 0, _canStep: false, comfort: true, pitch: 0, facing: new THREE.Vector3(0, 0, -1), colliders: [] });
  let room = roomAt(level, p.pos.x, p.pos.y, p.pos.z), setback = null, low = p.pos.y;
  const at = () => [+p.pos.x.toFixed(2), +(p.pos.y - 0.86).toFixed(2), +p.pos.z.toFixed(2)];
  for (const [x, z] of route) {
    let best = 1e9, stuck = 0;
    for (let t = 0; t < 60; t += 1 / 30) {
      const dx = x - p.pos.x, dz = z - p.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.45) break;
      p.H.set(dx / d, 0, dz / d);
      p.update(1 / 30, { forward: 1, strafe: 0, run, jump: false, slow: false }, cols);
      room = roomAt(level, p.pos.x, p.pos.y, p.pos.z, room);
      low = Math.min(low, p.pos.y);
      const kill = level.rooms[room]?.killY;
      if (!setback && ((kill !== undefined && p.pos.y < kill) || p.pos.y < level.killY + 0.86 || p.pos.y < -20)) setback = { at: at(), room, killY: kill };
      if (setback) return { setback, at: at() };
      if (d < best - 0.05) { best = d; stuck = 0; } else if ((stuck += 1 / 30) > 3) break;
    }
    if (Math.hypot(x - p.pos.x, z - p.pos.z) > 0.6) return { stuck: [x, z], at: at(), room, low: +(low - 0.86).toFixed(2) };
  }
  return { at: at(), room, low: +(low - 0.86).toFixed(2) };
}
// the checkpoint main.stepDeck sets standing at a point (the last box that holds it, in the level's order)
function checkpointAt(level, x, feet, z, cp = null) {
  const y = feet + 0.86;
  for (const c of level.checkpoints) {
    const b = c.box;
    if (x >= b[0] && x < b[3] && y >= b[1] && y < b[4] && z >= b[2] && z < b[5]) cp = c.spawn;
  }
  return cp;
}

// --- Mission 12: the court and the roofs -------------------------------------------------------------------------
test('H1: Mission 12\'s court is solid under its lens: walked north toward the objective, in every year, Kai never falls', () => {
  for (const state of ['PRESENT', 'PAST', 'FUTURE']) {
    // (the tester's walk: from the court's spawn, north along x 0, and across the court's middle east to west; in 2026
    // west of the dig, which is a real pit that year)
    for (const [from, to] of [[[0, 0, 26], [0, -30]], [[20, 0, 0], [-20, 0]], [[-9, 0, 26.5], [-9, -14]]]) {
      if (state === 'PAST' && from[0] === 0) continue;
      const r = walk(L12, from, [to], { state });
      // (in 2049 the lens stops him at its rim, solid: below)
      assert.ok(!r.setback && r.low > -0.2 && (!r.stuck || state === 'PRESENT'), `${state} from ${from} to ${to}: ${JSON.stringify(r)}`);
    }
  }
  // no ground under the court's middle is missing: a floor at 0 under every point of the old 24.8 m hole
  const cols = colsOf(L12, 'FUTURE');
  for (let x = -12; x <= 12; x += 2) for (let z = -12; z <= 12; z += 2) {
    assert.ok(cols.some((c) => c.min[0] <= x && c.max[0] >= x && c.min[2] <= z && c.max[2] >= z && Math.abs(c.max[1]) < 0.05), `ground at (${x}, ${z})`);
  }
});

test('H1: in 2049 the lens and its rim are solid: Kai walks round them, and is never inside the glass', () => {
  const r = walk(L12, [0, 0, 26], [[0, 0]], { state: 'PRESENT' });
  assert.ok(r.stuck && Math.hypot(r.at[0], r.at[2]) > 11.6 && Math.abs(r.at[1]) < 0.1, `stopped at the rim: ${JSON.stringify(r)}`);
  const round = walk(L12, [0, 0, 26], [[16, 16], [16, -16], [0, -24]], { state: 'PRESENT' });
  assert.ok(!round.setback && !round.stuck, `round it: ${JSON.stringify(round)}`);
  // (Missions 2 and 3 keep their chamber under the court: the hole there is theirs)
  const M3 = build('prologue', 2);
  assert.ok(!colsOf(M3, 'PRESENT').some((c) => c.min[0] <= 0 && c.max[0] >= 0 && c.min[2] <= 0 && c.max[2] >= 0 && Math.abs(c.max[1]) < 0.05), 'Mission 3\'s court still opens on its chamber');
});

test('M7: Mission 12\'s fire stair climbs from the court to the north roof in 2049 and 2026, walked both ways, signed at its foot', () => {
  for (const state of ['PRESENT', 'PAST']) {
    const up = walk(L12, [30, 0, -30], [[37, -36.6], [14.3, -36.6], [12.6, -37], [12.6, -40], [6, -40]], { state });
    assert.ok(!up.setback && !up.stuck && Math.abs(up.at[1] - 13.5) < 0.1, `${state} up: ${JSON.stringify(up)}`);
    const down = walk(L12, [6, 13.5, -40], [[12.6, -40], [12.6, -37], [14.3, -36.6], [37, -36.6], [30, -30]], { state });
    assert.ok(!down.setback && !down.stuck && Math.abs(down.at[1]) < 0.1, `${state} down: ${JSON.stringify(down)}`);
  }
  assert.ok(L12.texts.some((t) => /ROOF ACCESS/.test(t.text)), 'a sign at its foot');
  // THINK names the way up where the clues are on the roofs
  const t = Object.fromEntries(threadsOf(M12).map((x) => [x.id, x]));
  assert.ok(t.panes.hints.slice(1).some((h) => /fire stair/.test(h)), JSON.stringify(t.panes.hints));
});

test('M7, L8: on the 2026 gangway the checkpoint is the 2049 roof, never the court 13.5 m below; the court\'s holds the ground', () => {
  const roof = [-40, 13.5 + 0.86, -44];
  for (const z of [-30, 0, 25]) {
    const cp = checkpointAt(L12, 0, 13.5, z);
    assert.ok(cp && cp.slice(0, 3).every((v, i) => Math.abs(v - roof[i]) < 0.01), `gangway at z ${z}: ${JSON.stringify(cp)}`);
  }
  const court = checkpointAt(L12, 6, 0, 10);
  assert.ok(court && Math.abs(court[1] - 0.86) < 0.01 && Math.abs(court[2] - 26) < 0.01, `on the court: ${JSON.stringify(court)}`);
  // (and Kai at the court's checkpoint faces the court: north, not away from it)
  assert.ok(Math.abs(court[3]) < 0.01, `facing ${court[3]}`);
});

// --- Mission 10: the hall stair, the checkpoints, the yard ---------------------------------------------------------
test('H2: Mission 10\'s hall stair joins the gallery\'s floor, and is walked down and up', () => {
  const down = walk(L10, [-36, 0, -1.5], [[-36, 3], [-36, 22], [-36, 24]]);
  assert.ok(!down.setback && !down.stuck && Math.abs(down.at[1] + 12) < 0.1, `down: ${JSON.stringify(down)}`);
  assert.ok(down.low > -12.2, 'no fall on the way');
  const up = walk(L10, [-36, -12, 24], [[-36, 2], [-36, -1.5]]);
  assert.ok(!up.setback && !up.stuck && Math.abs(up.at[1]) < 0.1, `up, walking: ${JSON.stringify(up)}`);
});

test('M6: Mission 10\'s checkpoints hold their own floors: the flood-pole roof is the gallery\'s, the hall\'s north strip the hall\'s', () => {
  const cell = [-24, 0.86, -19.5];
  const same = (a, b) => a && a.slice(0, 3).every((v, i) => Math.abs(v - b[i]) < 0.01);
  assert.ok(same(checkpointAt(L10, 26, 0, 15), cell), `the roof by the flood pole: ${JSON.stringify(checkpointAt(L10, 26, 0, 15))}`);
  const hall = checkpointAt(L10, 10, -12, -2);
  assert.ok(hall && Math.abs(hall[1] + 11.14) < 0.01, `the hall's north strip: ${JSON.stringify(hall)}`);
  assert.ok(same(checkpointAt(L10, -10, 0, -8), cell), 'the gallery');
  const crown = checkpointAt(L10, -10, 12, -20);
  assert.ok(crown && Math.abs(crown[1] - 12.86) < 0.01, `the crown: ${JSON.stringify(crown)}`);
});

test('H3: Mission 10\'s yard checkpoint is out of the trooper\'s sight and reach, at every point of his round, at his widest look', () => {
  const yard = checkpointAt(L10, 10, -12, 38);
  const s = L10.sentinels.find((x) => /_q3s0$/.test(x.id));
  assert.ok(yard && s, JSON.stringify({ yard, s }));
  const [a, b] = s.path;
  const near = Math.min(...[0, 0.25, 0.5, 0.75, 1].map((f) => Math.hypot(a[0] + (b[0] - a[0]) * f - yard[0], a[1] + (b[1] - a[1]) * f - yard[2])));
  assert.ok(near > s.range + 3 + 2, `${near.toFixed(1)} m from his line, his look ${s.range} + 3 after catches`);
  // and he is never moved on to a point of his round in front of it after a catch ("they remember")
  const facts = new Map();
  const sent = { def: { id: s.id, path: s.path, range: 9 }, pos: new THREE.Vector3(14, -12, 34), wp: 0 };
  const g = { facts: { get: (k) => facts.get(k), set: (k, v = true) => facts.set(k, v), inc: (k) => facts.set(k, (facts.get(k) || 0) + 1) }, catching: true, checkpoint: yard, player: { pos: new THREE.Vector3(14.5, -11.14, 34) },
    deckWorld: { sentinels: [sent] }, hud: { say() {} } };
  const rt = { g, deck: M10 };
  for (let n = 0; n < 6; n++) {
    g.catching = true;
    g.player.pos.set(sent.pos.x + 0.5, -11.14, sent.pos.z);
    M10.step(rt, 1 / 30);
    g.catching = false;
    M10.step(rt, 1 / 30);
    assert.ok(Math.hypot(sent.pos.x - yard[0], sent.pos.z - yard[2]) > sent.def.range + 4, `catch ${n + 1}: moved to ${sent.pos.x},${sent.pos.z}`);
  }
});

// --- the watchers: up and down, walls, the grace after a catch -----------------------------------------------------
// a sentinel as DeckWorld makes it, with the edition's limits
function sentinel(def, cols = []) {
  const model = new THREE.Group();
  model.userData = { eyeMat: new THREE.MeshBasicMaterial(), coneMat: new THREE.MeshBasicMaterial() };
  return limitWatcher(new Sentinel({ speed: 2, range: 9, fov: 0.75, ...def }, model), () => cols);
}
const kai = (x, feet, z, cols = []) => {
  const pl = Object.assign(Object.create(Player.prototype), { pos: new THREE.Vector3(x, feet + 0.85, z), colliders: cols, running: false, gravity: -1 });
  return pl;
};
function run(s, pl, secs, opts = {}) {
  let caught = 0, seen = 0;
  for (let t = 0; t < secs; t += 1 / 30) {
    const r = s.update(1 / 30, t, { player: pl, here: true, frozen: false, hidden: false, ...opts });
    if (r === 'caught') caught++;
    if (s.suspicion > 0) seen++;
  }
  return { caught, seen, mode: s.mode };
}

test('M8: a watcher on the ground neither sees nor catches Kai 13.5 m over it; on its own floor it still does', () => {
  assert.ok(inSight(0) && inSight(3) && !inSight(13.5) && !inSight(-12) && inReach(0.3) && !inReach(3));
  // Mission 12's drone walks the court under the gangway: Kai on the gangway right over its line, in front of it
  const under = sentinel({ path: [[0, -20], [0, -32]] });
  const high = run(under, kai(0, 13.5, -24), 8);
  assert.deepEqual([high.caught, high.seen], [0, 0], JSON.stringify(high));
  // the same drone, Kai on the court in front of it: seen, chased, caught
  const low = run(sentinel({ path: [[0, -20], [0, -32]] }), kai(0, 0, -25), 8);
  assert.ok(low.seen > 0 && low.caught >= 1, JSON.stringify(low));
  // a step (3 m terrace) up is still in sight; a chase that comes under Kai there does not catch him from below
  const terrace = sentinel({ path: [[0, -20], [0, -32]] });
  const t = run(terrace, kai(0, 3, -26), 8);
  assert.ok(t.seen > 0 && t.caught === 0, JSON.stringify(t));
  // (a watcher with its own floor, def.y, keeps DeckWorld's own rule)
  const floor = sentinel({ y: -12, path: [[0, 0], [0, 10]] });
  assert.equal(floor.onFloor(kai(0, 0, 5)), false);
  assert.equal(floor.onFloor(kai(0, -12, 5)), true);
});

test('L15: in a chase a watcher does not walk through Mission 10\'s hall glass; it walks back the way it came and on with its round', () => {
  const cols = colsOf(L10, 'PRESENT');
  // the yard trooper outside the south windows, Kai inside along them
  assert.ok(blocked(cols, 20, 31, 20, 28.5, -12), 'through the glass');
  assert.ok(!blocked(cols, 0, 31, 0, 28.5, -12), 'through the door');
  assert.ok(!blocked(cols, -6, 34, 40, 34, -12), 'his round is open ground');
  // a chase begun outside the windows, Kai inside along them: the trooper stays outside the glass
  const out = sentinel({ y: -12, path: [[-6, 34], [40, 34]] }, cols);
  out.pos.set(12, -12, 31.5);
  out.mode = 'chase';
  out.suspicion = 1.2;
  const inside = kai(10, -12, 28.2, cols);
  let caughtIn = 0;
  for (let t = 0; t < 5; t += 1 / 30) {
    inside.pos.x = Math.min(30, 10 + t * 4);
    if (out.update(1 / 30, t, { player: inside, here: true, hidden: false }) === 'caught') caughtIn++;
    assert.ok(out.pos.z > 29.4, `outside the glass: ${out.pos.x}, ${out.pos.z}`);
  }
  assert.equal(caughtIn, 0, 'never caught through the glass');
  // a chase through the hall's door: he follows Kai in, and walks back out by the door
  const s = sentinel({ y: -12, path: [[-6, 34], [40, 34]] }, cols);
  s.pos.set(1, -12, 31.5);
  s.mode = 'chase';
  s.suspicion = 1.2;
  const pl = kai(1, -12, 28.2, cols);
  // Kai runs east inside, along the windows: the trooper follows outside, or through the door, never through the glass
  let through = false, caught = 0;
  for (let t = 0; t < 6; t += 1 / 30) {
    pl.pos.x = Math.min(24, 1 + t * 5);
    const z0 = s.pos.z, x0 = s.pos.x;
    if (s.update(1 / 30, t, { player: pl, here: true, hidden: false }) === 'caught') caught++;
    if (s.pos.z > 28.9 && s.pos.z < 30.1 && Math.abs(s.pos.x) > 4) through = true;
    void z0; void x0;
  }
  assert.ok(!through, `the trooper crossed the glass at ${s.pos.x}, ${s.pos.z}`);
  // he gives up behind the glass and walks back to his round, then on along it
  pl.pos.set(24, -11.15, 22);
  const back = [];
  for (let t = 0; t < 40; t += 1 / 30) { s.update(1 / 30, t, { player: pl, here: false, hidden: false }); back.push([s.pos.x, s.pos.z]); }
  assert.equal(s.mode, 'patrol');
  assert.ok(!back.some(([x, z]) => z > 28.9 && z < 30.1 && Math.abs(x) > 4), `never through the wall on the way back: ${JSON.stringify(back.filter((p, i) => i % 15 === 0).map(([x, z]) => [+x.toFixed(1), +z.toFixed(1)]))}`);
  assert.ok(Math.abs(s.pos.z - 34) < 0.5, `on his round again: ${s.pos.x}, ${s.pos.z}`);
  void caught;
});

test('H3: after a catch (and while Kai is walked back) no watcher sees him for a moment: a catch never chains into another', () => {
  const w = Object.create(Watchers.prototype);
  const s = sentinel({ path: [[0, -20], [0, -32]] });
  const g = { catching: false };
  Object.assign(w, { rt: { g }, list: [{ s, g: s.model, entries: [], current: null, last: new THREE.Vector3() }], grace: 0 });
  const pl = kai(0, 0, -23);
  const frame = (t) => { const r = s.update(1 / 30, t, { player: pl, here: true, hidden: false }); w.update(1 / 30); return r; };
  let t = 0;
  while (frame(t) !== 'caught' && t < 10) t += 1 / 30;
  assert.ok(t < 10, 'caught');
  g.catching = true;
  for (let i = 0; i < 21; i++) frame((t += 1 / 30));
  g.catching = false;
  let caught = 0, chased = 0;
  for (let i = 0; i < Math.floor(GRACE * 30) - 2; i++) { if (frame((t += 1 / 30)) === 'caught') caught++; if (s.mode === 'chase') chased++; }
  assert.deepEqual([caught, chased], [0, 0], 'nothing during the grace');
  let after = 0;
  for (let i = 0; i < 300; i++) if (frame((t += 1 / 30)) === 'caught') { after++; break; }
  assert.equal(after, 1, 'and seen again after it, standing in front of it');
});

void [L9, L13, M09, M11, M13];
