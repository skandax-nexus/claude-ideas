// THE LAST VERSION OF EARTH v2.1.1 playtest fixes, Missions 1-8 (docs/lastversion/PLAYTEST-v2.1.1.md; unit lv-early):
// the stairs and pits that threw Kai back or out of the world (H5, M4, M5), what counts as crossing Mission 3's hall
// (L14), and the lines, prompts, people and staging of Missions 1-8 that the playtest found wrong. The browser checks
// of the same items, by touch, are in docs/lastversion/STATUS.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../game/vendor/three.module.min.js';
import { RealityEngine } from '../game/js/core/RealityEngine.js';
import { FactStore } from '../game/js/core/FactStore.js';
import { compileCondition } from '../game/js/core/conditions.js';
import { LV } from '../game/js/editions/lastversion/index.js';
import { LastVersion } from '../game/js/editions/lastversion/Runtime.js';
import { M03 } from '../game/js/editions/lastversion/prologue.js';
import { M04, M06, M08 } from '../game/js/editions/lastversion/act1.js';
import { threadsOf } from '../game/js/editions/lastversion/Threads.js';
import { Player } from '../game/js/entities/Player.js';

// a mission's level, built the way the runtime builds it (Runtime.buildLevel with a stand-in game)
function build(ch, deck) {
  const game = { engine: new RealityEngine(LV.engineOptions()), facts: new FactStore(), story: null };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory(ch);
  const level = rt.buildLevel({ lv: true, chapter: ch, deck, sector: 0, flags: {} });
  level.deckDef = game.story.decks[deck];
  return level;
}
const MISSIONS = [['prologue', 0], ['prologue', 1], ['prologue', 2], ['act1', 0], ['act1', 1], ['act1', 2], ['act1', 3], ['act1', 4]].map(([ch, d]) => build(ch, d));
const [, M2, M3, , M5, , , M8] = MISSIONS;

const conds = new Map();
const holds = (when, state, facts) => {
  if (!when) return true;
  let f = conds.get(when);
  if (!f) conds.set(when, (f = compileCondition(when)));
  return !!f({ fact: typeof facts === 'function' ? facts : (k) => facts[k], state });
};
const solids = (level, state = 'PRESENT', facts = {}) => level.elements.filter((e) => e.solid && holds(e.when, state, facts));
// the room the runtime puts Kai in at a point (DeckWorld.roomAt: the first in the level's order whose bounds hold it)
function roomAt(level, x, y, z, fallback = null) {
  for (const id of level.order) for (const b of level.rooms[id].bounds) if (x >= b[0] && x < b[3] && y >= b[1] && y < b[4] && z >= b[2] && z < b[5]) return id;
  return fallback;
}
// Kai walks [x, z] waypoints with the game's own physics (entities/Player.js), as tests/lastversion.test.mjs walkRoute;
// it also watches what main.js step watches: the room he is in and its fall height (a setback below it)
function walk(level, start, route, { facts = {}, state = 'PRESENT' } = {}) {
  const cols = solids(level, state, facts).map((e) => ({ min: e.box.slice(0, 3), max: e.box.slice(3) }));
  const p = Object.assign(Object.create(Player.prototype), { pos: new THREE.Vector3(start[0], start[1] + 0.86, start[2]), vel: new THREE.Vector3(), H: new THREE.Vector3(0, 0, -1), U: new THREE.Vector3(0, 1, 0), gravity: -1, grounded: false, half: new THREE.Vector3(0.3, 0.85, 0.3), topSpeed: null, stepOff: 0, airT: 0, _canStep: false, comfort: true, pitch: 0, facing: new THREE.Vector3(0, 0, -1), colliders: [] });
  let room = roomAt(level, p.pos.x, p.pos.y, p.pos.z), setback = null;
  const at = () => [+p.pos.x.toFixed(2), +(p.pos.y - 0.86).toFixed(2), +p.pos.z.toFixed(2)];
  for (const [x, z] of route) {
    let best = 1e9, stuck = 0;
    for (let t = 0; t < 40; t += 1 / 30) {
      const dx = x - p.pos.x, dz = z - p.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.45) break;
      p.H.set(dx / d, 0, dz / d);
      p.update(1 / 30, { forward: 1, strafe: 0, run: false, jump: false, slow: false }, cols);
      room = roomAt(level, p.pos.x, p.pos.y, p.pos.z, room);
      const kill = level.rooms[room].killY;
      if (!setback && ((kill !== undefined && p.pos.y < kill) || p.pos.y < -14)) setback = { at: at(), room, killY: kill };
      if (setback) return { setback, at: at() };
      if (d < best - 0.05) { best = d; stuck = 0; } else if ((stuck += 1 / 30) > 3) break;
    }
    if (Math.hypot(x - p.pos.x, z - p.pos.z) > 0.6) return { stuck: [x, z], at: at(), room };
  }
  return { at: at(), room };
}

// every standing height in a level, on a grid, where a step (0.35 m) walks from ground above its room's fall height to
// ground under it (main.js step: a setback) -- a stair whose foot is in a room whose fall height is set by its top
function stepsUnderTheFall(level, C = 0.2) {
  const out = [];
  const [bx0, bz0, bx1, bz1] = level.bounds;
  const nx = Math.ceil((bx1 - bx0) / C), nz = Math.ceil((bz1 - bz0) / C);
  const maxKill = Math.max(...Object.values(level.rooms).map((r) => r.killY ?? -3));
  const xOf = (i) => bx0 + (i + 0.5) * C, zOf = (j) => bz0 + (j + 0.5) * C;
  const killAt = (i, j, t) => {
    const r = roomAt(level, xOf(i), t + 0.86, zOf(j));
    return r ? Math.max(level.rooms[r].killY ?? -3, -14) : -14;
  };
  for (const state of level.deckDef.states || ['PRESENT']) {
    // (a collider that waits on a fact counts if it stands with every fact unset or with every fact set)
    const els = level.elements.filter((e) => e.solid && (holds(e.when, state, () => false) || holds(e.when, state, () => true)));
    const always = els.filter((e) => holds(e.when, state, () => false) && holds(e.when, state, () => true));
    // only ground low enough to matter: under the highest fall height, or a step from it
    const tops = new Map();
    for (const e of els) {
      const b = e.box;
      if (b[4] + 0.86 >= maxKill + 0.36) continue;
      for (let i = Math.max(0, Math.ceil((b[0] - bx0) / C - 0.5)); i <= Math.min(nx - 1, Math.floor((b[3] - bx0) / C - 0.5)); i++) {
        for (let j = Math.max(0, Math.ceil((b[2] - bz0) / C - 0.5)); j <= Math.min(nz - 1, Math.floor((b[5] - bz0) / C - 0.5)); j++) {
          const k = i * nz + j;
          if (!tops.has(k)) tops.set(k, new Set());
          tops.get(k).add(b[4]);
        }
      }
    }
    // the body (0.6 m wide, 1.7 m tall) stands clear at a height in a cell
    const clear = (i, j, t) => {
      const x0 = xOf(i) - C / 2, x1 = x0 + C, z0 = zOf(j) - C / 2, z1 = z0 + C;
      return !always.some(({ box: b }) => b[0] < x1 && b[3] > x0 && b[2] < z1 && b[5] > z0 && b[1] < t + 1.7 && b[4] > t + 0.02);
    };
    for (const [k, ts] of tops) {
      const i = Math.floor(k / nz), j = k % nz;
      for (const t of ts) {
        if (t + 0.86 >= killAt(i, j, t) || !clear(i, j, t)) continue;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ii = i + di, jj = j + dj;
          const safe = [...(tops.get(ii * nz + jj) || [])].find((t2) => Math.abs(t2 - t) <= 0.351 && t2 + 0.86 >= killAt(ii, jj, t2) && clear(ii, jj, t2));
          if (safe === undefined) continue;
          out.push({ state, at: [+xOf(i).toFixed(1), +t.toFixed(2), +zOf(j).toFixed(1)], room: roomAt(level, xOf(i), t + 0.86, zOf(j)), from: [+xOf(ii).toFixed(1), +safe.toFixed(2), +zOf(jj).toFixed(1)] });
          break;
        }
      }
    }
  }
  return out;
}

test('H5: Mission 2\'s stair from the plant terrace to the staff lounge is walked down and up with no setback', () => {
  const lounge = M2.rooms.records.spawn[1] - 0.86, terrace = M2.rooms.power.spawn[1] - 0.86;
  assert.ok(terrace - lounge > 4, 'the terrace stands over the lounge');
  assert.ok(M2.rooms.power.killY < lounge - 2.5, `the terrace's fall height (${M2.rooms.power.killY}) is under the lounge's floor`);
  // (the tester's walk: from the terrace's south end, south down the stair into the lounge, and back up)
  const down = walk(M2, [-48, terrace, -27], [[-48, -34], [-48, -38], [-47, -44]]);
  assert.ok(!down.setback && !down.stuck && down.room === 'records' && Math.abs(down.at[1] - lounge) < 0.1, `down: ${JSON.stringify(down)}`);
  const up = walk(M2, [-47, lounge, -44], [[-46.6, -41], [-48, -36], [-48, -34], [-48, -27]]); // (round the recorder's console)
  assert.ok(!up.setback && !up.stuck && up.room === 'power' && Math.abs(up.at[1] - terrace) < 0.1, `up: ${JSON.stringify(up)}`);
  // and the court beside the stair's outer walls is not the terrace's to fall from
  const court = walk(M2, [-50.2, 0, -33.4], [[-50.2, -28.6]]);
  assert.ok(!court.setback, `along the court by the stair: ${JSON.stringify(court)}`);
});

test('H5: in Missions 1-8 no room\'s fall height lies above a walkable stair or floor it holds', () => {
  for (const level of MISSIONS) {
    const bad = stepsUnderTheFall(level);
    assert.deepEqual(bad.slice(0, 3), [], `${level.deckDef.mkey}: ${bad.length} spots a step from safe ground under the fall height`);
  }
});

test('M4: Mission 3\'s 2026 dig is walled on every side; its timber steps lead out, and Kai can still drop in from the court', () => {
  const floor = -3, from = [4.2, floor, 21.5];
  for (const [name, to] of [['east', [18.2, 24]], ['west', [-10, 21.5]], ['north', [4, 6]], ['north-east', [13, 6]], ['south', [8, 34]]]) {
    const r = walk(M3, from, [to], { state: 'PAST' });
    assert.ok(!r.setback && Math.abs(r.at[1] - floor) < 0.1, `${name}: ${JSON.stringify(r)}`);
  }
  const out = walk(M3, [-5.5, floor, 24], [[-5.4, 27], [-0.4, 27], [-0.4, 31], [-6, 34]], { state: 'PAST' });
  assert.ok(!out.setback && !out.stuck && Math.abs(out.at[1]) < 0.1, `up the timber steps onto the court: ${JSON.stringify(out)}`);
  const into = walk(M3, [16.6, 0, 30.3], [[4.85, 22]], { state: 'PAST' });
  assert.ok(!into.setback && Math.abs(into.at[1] - floor) < 0.1, `into the dig from the court: ${JSON.stringify(into)}`);
});

test('M5: the drained basin\'s rims are solid on every side and corner; its stair is walked down and up, in every year', () => {
  for (const state of ['PRESENT', 'PAST', 'FUTURE']) {
    for (const [name, from, to] of [['north', [-60, 40], [-60, 30]], ['north-east corner', [-54.3, 49.1], [-30.1, 32]], ['south', [-60, 50], [-60, 66]], ['east', [-40, 50], [-26, 50]], ['west', [-60, 50], [-84, 50]], ['north-west corner', [-70, 40], [-84, 30]]]) {
      const r = walk(M5, [from[0], -2.5, from[1]], [to], { state, facts: { gate_released: true } });
      assert.ok(!r.setback && Math.abs(r.at[1] + 2.5) < 0.1, `${state} ${name}: ${JSON.stringify(r)}`);
    }
    const down = walk(M5, [-46, 0, 29], [[-46, 36], [-46, 40]], { state, facts: { gate_released: true } });
    assert.ok(!down.setback && !down.stuck && Math.abs(down.at[1] + 2.5) < 0.1, `${state} down: ${JSON.stringify(down)}`);
    const up = walk(M5, [-46, -2.5, 40], [[-46, 36], [-46, 30], [-50, 27]], { state, facts: { gate_released: true } });
    assert.ok(!up.setback && !up.stuck && Math.abs(up.at[1]) < 0.1, `${state} up, without a jump: ${JSON.stringify(up)}`);
  }
});

test('L14: Mission 3\'s hall is crossed on the lift or the far floor, not by landing on the debris in its pit', () => {
  const hall = M3.rooms.collapse, floor = hall.spawn[1] - 0.86;
  const zLine = hall.bounds[0][2] + 8 + 4 - 0.5; // (past the crossing line)
  const debris = M3.elements.filter((e) => e.solid && e.room === 'collapse' && e.box[4] < floor - 1 && e.box[4] > hall.killY && e.box[2] < zLine && e.box[5] > zLine - 4);
  assert.ok(debris.length, 'there is debris above the fall height past the line');
  const crossed = (y) => {
    const facts = new Map();
    const g = { room: 'collapse', level: M3, facts: { get: (k) => facts.get(k), set: (k, v = true) => facts.set(k, v) }, player: { pos: new THREE.Vector3(-2, y + 0.86, zLine), grounded: true } };
    M03.step({ g });
    return !!facts.get('crossed');
  };
  for (const e of debris) assert.equal(crossed(e.box[4]), false, `standing on debris at ${e.box[4]}`);
  assert.equal(crossed(floor), true, 'on the lift, at the hall\'s floor level');
});

test('P4: Mission 4\'s THINK tiers are full sentences: why, where, what to do', () => {
  for (const t of threadsOf(M04)) {
    if (!t.hints) continue;
    assert.equal(t.hints.length, 3, t.id);
    for (const h of t.hints) assert.ok(h.split(/\s+/).length >= 6 && /[.!?]$/.test(h) && /^[A-Z]/.test(h), `${t.id}: "${h}"`);
  }
});

test('L16: Mission 6\'s THINK and Kai\'s line after a hit give the toast\'s advice (count two), never "go when it has passed"', () => {
  const cross = threadsOf(M06).find((t) => t.id === 'cross');
  assert.ok(!cross.hints.some((h) => /when it has passed|behind the arm/i.test(h)), JSON.stringify(cross.hints));
  assert.ok(cross.hints.slice(1).every((h) => /count two/.test(h)), 'the second and third tiers say to count two');
  assert.ok(M06.spoken.armHit.every((l) => /count two/.test(l.text) && !/when it has passed/i.test(l.text)), JSON.stringify(M06.spoken.armHit));
});

test('L20, L34: Mission 8\'s terminal is offered in 2049 only, and the escape counts only after a moment back in 2049', () => {
  const term = M8.interactables.find((i) => i.scene === 'version');
  assert.ok(term && /@PRESENT/.test(term.when) && !compileCondition(term.when)({ fact: () => true, state: 'PAST' }), `the terminal's prompt: ${term?.when}`);
  const trig = M8.triggers.find((t) => Object.keys(t.set || {}).some((k) => /escape/.test(k)));
  const can = (state, facts) => !!compileCondition(trig.when)({ fact: (k) => facts[k] ?? (k.startsWith('t_m08_') ? true : undefined), state });
  assert.ok(trig.unseen, 'it is a stealth crossing');
  assert.equal(can('PAST', { lin_gone: true, m08_back49: true }), false, 'not in 2026');
  assert.equal(can('PRESENT', { lin_gone: true }), false, 'not the moment Kai is back in 2049');
  assert.equal(can('PRESENT', { lin_gone: true, m08_back49: true }), true, 'in 2049, after a moment there');
  // the step: two seconds back in 2049 (not being caught) set it; 2026 clears it; at the terminal's spot in 2026 Kai
  // says, once a visit, that it is not built yet (a line already in the pack)
  const facts = new Map([['lin_gone', true]]), said = [];
  const t = M8.landmarks.versionTerminal;
  const g = { facts: { get: (k) => facts.get(k), set: (k, v = true) => facts.set(k, v) }, room: 'r', catching: false, engine: { state: () => year },
    player: { pos: new THREE.Vector3(t[0], 1.26, t[2]) }, hud: { say: (ls) => said.push(...ls.map((l) => l.text)) } };
  let year = 'PAST';
  const rt = { g, level: M8 };
  for (let i = 0; i < 90; i++) M08.step(rt, 1 / 30);
  assert.deepEqual(said, ['Not built yet, in 2026.'], 'said once in 2026 at the spot');
  assert.ok(!facts.get('m08_back49'));
  year = 'PRESENT';
  for (let i = 0; i < 45; i++) M08.step(rt, 1 / 30);
  assert.ok(!facts.get('m08_back49'), 'not after 1.5 s');
  g.catching = true;
  M08.step(rt, 1 / 30);
  g.catching = false;
  for (let i = 0; i < 45; i++) M08.step(rt, 1 / 30);
  assert.ok(!facts.get('m08_back49'), 'a catch starts the count again');
  for (let i = 0; i < 20; i++) M08.step(rt, 1 / 30);
  assert.ok(facts.get('m08_back49'), 'after 2 s back in 2049');
  year = 'PAST';
  M08.step(rt, 1 / 30);
  assert.ok(!facts.get('m08_back49'), 'cleared in 2026');
});
