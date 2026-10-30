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

test('L42: Mission 3\'s lab differs by year from the door: open sky and a steel frame in 2026, fallen panels in 2196', () => {
  const lab = M3.rooms.cable;
  assert.ok(lab.sky, 'a roof that differs per year shows the sky where it is open');
  const els = M3.elements.filter((e) => e.room === 'cable');
  // the ceiling: solid in 2049 only
  const ceil = els.filter((e) => e.box[1] >= lab.H - 0.01 + (lab.spawn[1] - 0.86) && e.box[4] - e.box[1] < 0.6);
  assert.ok(ceil.length && ceil.every((e) => compileCondition(e.when || 'true')({ fact: () => false, state: 'PRESENT' }) && !compileCondition(e.when || 'true')({ fact: () => false, state: 'PAST' })), 'the ceiling stands in 2049 only');
  const texts = M3.texts.filter((t) => /STEEL FRAME - 2026/.test(t.text));
  assert.ok(texts.length && texts.every((t) => t.when === '@PAST'), 'a site board in 2026');
});

// --- the second half of the unit: staging, people and looks ----------------------------------------------------------
const [M1, , , M4L, , M6L, M7L] = MISSIONS;
const visAll = (level, m) => level.vis.filter((v) => v.m === m);

test('L42: the east wing\'s storeys stand over Mission 3\'s lab in 2049, the year its ceiling stands, and not in the roofless years', () => {
  const lab = M3.rooms.cable.bounds[0];
  const over = M3.vis.filter((v) => v.m === 'helixPanel' && v.b && v.b[1] > lab[4] - 0.5 && v.b[0] < lab[3] && v.b[3] > lab[0] && v.b[2] < lab[5] && v.b[5] > lab[2]);
  assert.ok(over.length, 'a storey over the lab');
  for (const v of over) {
    const e = [].concat(v.e || ['PRESENT', 'PAST', 'FUTURE']);
    assert.ok(e.includes('PRESENT') && !e.includes('FUTURE') && !e.includes('PAST'), `over the lab in 2049 only: ${JSON.stringify(v.e)}`);
  }
});

test('L38: Mission 7\'s astronomer is a staged conversation: letterboxed, his face in frame from over Kai\'s shoulder, then close', async () => {
  const { M07 } = await import('../game/js/editions/lastversion/act1.js');
  assert.equal(M07.scenes.astro.then, 'astroTalk');
  assert.ok(!M07.scenes.astro.lines, 'its lines are the staged moment\'s');
  let played = null;
  const npc = M7L.npcs.find((n) => n.id === 'm7_astro');
  const rt = { level: M7L, g: { player: { pos: new THREE.Vector3(npc.pos[0] - 1.2, npc.pos[1] + 0.86, npc.pos[2] + 1.6) } }, cinema: { play: (o) => (played = o) } };
  M07.fx.astroTalk(rt);
  assert.ok(played && played.lines.length >= 7 && played.letterbox !== false, 'a moment with his lines');
  const shots = played.shots(rt);
  assert.equal(shots.length, 2);
  for (const s of shots) {
    // the camera looks at him from in front of him or over Kai's shoulder, within 5 m, his head above the look point
    const d = Math.hypot(s.cam[0] - npc.pos[0], s.cam[2] - npc.pos[2]);
    assert.ok(d < 5, `within 5 m of him: ${d.toFixed(1)}`);
    assert.ok(Math.hypot(s.look[0] - npc.pos[0], s.look[2] - npc.pos[2]) < 0.1 && s.look[1] < npc.pos[1] + 1.55, 'looking at him, his face in the upper half');
  }
  assert.ok(shots[1].hide, 'close on him: Kai not drawn');
});

test('L33: Mission 7\'s cold open has a second shot, close on old Niko turned to the low sun', async () => {
  const { M07 } = await import('../game/js/editions/lastversion/act1.js');
  const co = M07.coldOpen;
  assert.equal(co.shots.length, 2);
  const ring = M7L.landmarks.horizonRing, [cx, , cz] = [ring[0] + -2.2 * Math.cos(ring[3]) + 2 * Math.sin(ring[3]), 0, ring[2] + 2.2 * Math.sin(ring[3]) + 2 * Math.cos(ring[3])];
  const s = co.shots[1];
  assert.ok(Math.hypot(s.cam[0] - cx, s.cam[2] - cz) < 4.5, `the second shot within 4.5 m of him: ${Math.hypot(s.cam[0] - cx, s.cam[2] - cz).toFixed(1)}`);
});

test('L32, L44: young Niko\'s tunic is cut to the knee and straight; Mission 7\'s blue hour is light enough to read at low quality', async () => {
  const { WARDROBE } = await import('../game/js/editions/lastversion/wardrobe.js');
  const sk = WARDROBE.rb_niko.niko.garb.skirt;
  assert.ok(sk.hem >= 0.45 && sk.flare <= 1.05, JSON.stringify(sk));
  const { default: obs } = await import('../game/js/editions/lastversion/places/specs/observatory.js');
  const y = obs.years.PRESENT;
  assert.ok(y.night <= 0.35 && y.hemi.k >= 1.5, JSON.stringify({ night: y.night, hemi: y.hemi }));
});

test('L39: Mission 8\'s reconstruction is staged: its echoes walk in frame, and what it sets is set when it ends', async () => {
  const { Threads, playFact, factOf } = await import('../game/js/editions/lastversion/Threads.js');
  const facts = new FactStore();
  let played = null, node = null;
  const rt = { g: { facts, hud: { say() {} }, audio: {}, player: { pos: new THREE.Vector3(-9.6, 1.26, -3.5) } }, cinema: { play: (o, then) => (played = { o, then }) }, playNode: (n) => (node = n) };
  const th = new Threads(rt);
  th.attach(M08, { npcs: [], talkGates: {} });
  const t = th.byId.reconstruct;
  assert.ok(t.shots, 'it has shots');
  const r = th.reenact(t);
  assert.deepEqual(r.lines, [], 'nothing said over the game camera');
  assert.ok(played && played.o.lines.length === t.lines.length, 'its lines are the staged moment\'s');
  assert.equal(facts.get(playFact(M08, t)), true, 'the echoes show while it plays');
  const shots = played.o.shots(rt);
  assert.equal(shots.length, 3);
  // the second shot looks at the console end of their walk from within 6 m
  assert.ok(Math.hypot(shots[1].cam[0] + 2, shots[1].cam[2] - 9.4) < 6 && Math.hypot(shots[1].look[0] + 2, shots[1].look[2] - 9.4) < 2);
  assert.ok(t.echoes.every((e) => e.speed >= 1.2), 'they walk at a walk');
  assert.ok(!facts.get(factOf(M08, t)));
  played.then();
  assert.equal(facts.get(playFact(M08, t)), false, 'gone when it ends');
  assert.ok(node.set[factOf(M08, t)] && node.set.ev_ninth_minute, 'the thread is done when it ends');
});

test('P3: before the Prologue\'s cold open the card is over the cold open\'s first view, Kai not drawn; after it, the game camera', async () => {
  const { M01 } = await import('../game/js/editions/lastversion/prologue.js');
  const facts = new FactStore();
  facts.set('co_m01', true);
  const model = { visible: true };
  const g = { facts, player: { pos: new THREE.Vector3(), cinema: null, model }, deckWorld: { npcs: [] }, hud: {} };
  const rt = { g, opening: {}, cinema: { active: { shots: null } }, level: {} };
  M01.step(rt, 1 / 30);
  assert.equal(model.visible, false);
  assert.deepEqual([g.player.cinema.pos.x, g.player.cinema.pos.y, g.player.cinema.pos.z], M01.coldOpen.shots[0].cam);
  rt.cinema.active = { shots: [{}] }; // (the cold open's own shots take the camera)
  M01.step(rt, 1 / 30);
  assert.ok(g.player.cinema, 'left to the cold open');
  facts.set('co_m01', false);
  rt.cinema.active = { shots: null }; // (the mission's card after it: the game camera, on Kai)
  rt.m01Card = true;
  M01.step(rt, 1 / 30);
  assert.equal(g.player.cinema, null);
  assert.equal(model.visible, true);
});

test('L43: Mission 1\'s fire escape has no 12 m iron sheet; its street side is an open frame that stops Kai and the camera', () => {
  assert.ok(!M1.vis.some((v) => v.m === 'ironDark' && v.b && v.b[4] - v.b[1] >= 11 && v.b[5] - v.b[2] > 20), 'no sheet');
  const col = M1.elements.find((e) => e.solid && e.box[0] <= 44.95 && e.box[3] >= 44.95 && e.box[2] <= -100 && e.box[5] >= -78 && e.box[4] >= 12);
  assert.ok(col, 'a collider along the frame');
});

test('P5: Mission 6\'s 2026 and 2049 clocks have a dial, hour marks and hands that hang loose until each is given its hour', () => {
  for (const [x, fact] of [[10, 'clk_26'], [16, 'clk_49']]) {
    const at = (v) => v.b && v.b[0] >= x - 0.8 && v.b[3] <= x + 0.8 && v.b[1] >= 16.9 && v.b[4] <= 18.3 && v.b[2] > -31.6;
    const marks = M6L.vis.filter((v) => v.m === 'ironDark' && at(v) && !v.when);
    assert.ok(marks.length >= 12, `${x}: ${marks.length} hour marks`);
    const loose = M6L.vis.filter((v) => at(v) && v.when === `!${fact}`), set = M6L.vis.filter((v) => at(v) && v.when === fact);
    assert.equal(loose.length, 2);
    assert.equal(set.length, 2);
    assert.ok(loose.every((v) => v.b[4] <= 17.61), 'loose hands hang down');
    assert.ok(set.some((v) => v.b[4] > 18), 'given its hour, the minute hand is up');
  }
});

test('P6: a lit fire pit is logs, embers and flames in two colours, not one cone', () => {
  const near = (v, x, z) => Math.hypot((v.x ?? 0) - x, (v.z ?? 0) - z) < 1.4;
  const cones = M4L.vis.filter((v) => v.k === 'cyl' && v.r2 === 0 && near(v, 4, 80));
  assert.ok(cones.filter((v) => v.m === 'fireGlow').length >= 4 && cones.some((v) => v.m === 'flameCore'), 'tongues and a core');
  assert.ok(M4L.vis.filter((v) => v.k === 'cyl' && v.m === 'timber' && near(v, 4, 80)).length >= 4, 'logs');
});

test('P8, P11: Mission 4\'s cistern stops Kai at its face and holds water under its lip; its fields end at a field wall', () => {
  const [cx, cz, R] = [-52, 50, 3.2];
  const cols = M4L.elements.filter((e) => e.solid && e.box[0] < cx && e.box[3] > cx && e.box[2] < cz && e.box[5] > cz && e.box[4] > 3.5 && e.box[1] < 3.5);
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
    const reach = Math.max(...cols.map((e) => {
      let r = 0;
      while (r < 4 && (() => { const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; return x >= e.box[0] && x <= e.box[3] && z >= e.box[2] && z <= e.box[5]; })()) r += 0.05;
      return r;
    }));
    assert.ok(reach >= R - 0.35, `at ${a.toFixed(2)} rad the drum stops Kai at ${reach.toFixed(2)} m`);
  }
  const water = M4L.vis.find((v) => v.k === 'disc' && v.m === 'water' && Math.hypot(v.x - cx, v.z - cz) < 0.1);
  const drum = M4L.vis.find((v) => v.k === 'cyl' && v.m === 'drystone' && Math.hypot(v.x - cx, v.z - cz) < 0.1 && v.r === R);
  assert.ok(water.y > drum.y + drum.h, 'the water above the drum\'s top');
  assert.ok(Math.hypot(M4L.landmarks.cistern[0] - cx, M4L.landmarks.cistern[2] - cz) > R + 0.8, 'its fragment by its foot, not on the water');
  for (const side of ['N', 'S', 'E', 'W']) {
    const w = M4L.elements.find((e) => e.solid && e.box[4] >= 1 && e.box[4] < 2 && (side === 'N' ? e.box[2] <= -99.3 && e.box[5] >= -99.3 && e.box[3] - e.box[0] > 150 : side === 'S' ? e.box[5] >= 99.3 && e.box[2] <= 99.3 && e.box[3] - e.box[0] > 150 : side === 'W' ? e.box[0] <= -99.3 && e.box[3] >= -99.3 && e.box[5] - e.box[2] > 150 : e.box[3] >= 99.3 && e.box[0] <= 99.3 && e.box[5] - e.box[2] > 150));
    assert.ok(w, `a field wall on the ${side}`);
  }
});
