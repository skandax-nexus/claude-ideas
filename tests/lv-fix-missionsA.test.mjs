// THE LAST VERSION OF EARTH v2.1 playtest fixes, Missions 1-8 (docs/lastversion/PLAYTEST-v2.1.md; unit missionsA):
// the gantry stair in Mission 2, the brass arm in Mission 6, the pursuit's start, the board, the map and the staff gate
// in Mission 1, Mission 6's clocks, and what each of them must keep doing. The browser checks of the same findings, by
// touch, are in docs/lastversion/STATUS.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../game/vendor/three.module.min.js';
import { RealityEngine } from '../game/js/core/RealityEngine.js';
import { FactStore } from '../game/js/core/FactStore.js';
import { compileCondition } from '../game/js/core/conditions.js';
import { LV } from '../game/js/editions/lastversion/index.js';
import { LastVersion } from '../game/js/editions/lastversion/Runtime.js';
import { M01 } from '../game/js/editions/lastversion/prologue.js';
import { M04, M06, M08 } from '../game/js/editions/lastversion/act1.js';
import { KIT_NAMES } from '../game/js/editions/lastversion/places/kits.js';
import { threadsOf } from '../game/js/editions/lastversion/Threads.js';
import { Player } from '../game/js/entities/Player.js';

// a mission's level, built the way the runtime builds it (Runtime.buildLevel with a stand-in game)
function build(ch, deck) {
  const game = { engine: new RealityEngine(LV.engineOptions()), facts: new FactStore(), story: null };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory(ch);
  return rt.buildLevel({ lv: true, chapter: ch, deck, sector: 0, flags: {} });
}
const M1 = build('prologue', 0), M2 = build('prologue', 1), M4L = build('act1', 0), M5L = build('act1', 1), M6L = build('act1', 2), M8L = build('act1', 4);

const solids = (level, state = 'PRESENT', facts = {}) => level.elements.filter((e) => e.solid && (!e.when || compileCondition(e.when)({ fact: (k) => facts[k], state })));
// Kai walks [x, z] waypoints with the game's own physics (entities/Player.js), as tests/lastversion.test.mjs walkRoute
function walk(level, start, route, facts = {}, state = 'PRESENT') {
  const cols = solids(level, state, facts).map((e) => ({ min: e.box.slice(0, 3), max: e.box.slice(3) }));
  const p = Object.assign(Object.create(Player.prototype), { pos: new THREE.Vector3(start[0], start[1] + 0.86, start[2]), vel: new THREE.Vector3(), H: new THREE.Vector3(0, 0, -1), U: new THREE.Vector3(0, 1, 0), gravity: -1, grounded: false, half: new THREE.Vector3(0.3, 0.85, 0.3), topSpeed: null, stepOff: 0, airT: 0, _canStep: false, comfort: true, pitch: 0, facing: new THREE.Vector3(0, 0, -1), colliders: [] });
  for (const [x, z] of route) {
    let best = 1e9, stuck = 0;
    for (let t = 0; t < 40; t += 1 / 30) {
      const dx = x - p.pos.x, dz = z - p.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.45) break;
      p.H.set(dx / d, 0, dz / d);
      p.update(1 / 30, { forward: 1, strafe: 0, run: false, jump: false, slow: false }, cols);
      if (d < best - 0.05) { best = d; stuck = 0; } else if ((stuck += 1 / 30) > 3) break;
    }
    if (Math.hypot(x - p.pos.x, z - p.pos.z) > 0.6) return { stuck: [x, z], at: p.pos.toArray().map((v) => +v.toFixed(2)) };
  }
  return { at: [+p.pos.x.toFixed(2), +(p.pos.y - 0.85).toFixed(2), +p.pos.z.toFixed(2)] };
}
const visIn = (level, year) => level.vis.filter((v) => !v.e || v.e.includes(year));
// is the segment a-b clear of the level's solid boxes (a slab test per box)?
function clear(level, a, b, facts = {}) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  for (const e of solids(level, 'PRESENT', facts)) {
    let t0 = 0, t1 = 1, hit = true;
    for (let k = 0; k < 3; k++) {
      const lo = e.box[k], hi = e.box[k + 3];
      if (Math.abs(d[k]) < 1e-9) { if (a[k] < lo || a[k] > hi) { hit = false; break; } continue; }
      let ta = (lo - a[k]) / d[k], tb = (hi - a[k]) / d[k];
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
      if (t0 > t1) { hit = false; break; }
    }
    if (hit) return false;
  }
  return true;
}
// a room's own frame (Build.js) to the world, as the bot's LVB.w
const w = (level, id, x, z) => {
  const [sx, , sz, th] = level.rooms[id].spawn;
  const c = Math.cos(th), s = Math.sin(th), X = sx + 1.6 * s, Z = sz + 1.6 * c;
  return [X + x * c + z * s, Z - x * s + z * c];
};

test('M2 (FT-02, VX-01, FT-13): the gantry stair climbs from the terrace floor to cell two, nothing walks under it, cell one is at chest height', () => {
  const floor = M2.rooms.power.spawn[1] - 0.86;
  const foot = w(M2, 'power', -4.5, -0.6), top = w(M2, 'power', -4.5, -6.6), cell = w(M2, 'power', -5.4, -10.4);
  const up = walk(M2, [foot[0], floor, foot[1]], [top, cell]);
  assert.ok(!up.stuck && Math.abs(up.at[1] - (floor + 2.6)) < 0.3, `up the stair onto the gantry: ${JSON.stringify(up)}`);
  // (its steps reach the floor: walking west at the height of its upper steps is walking into them)
  const by = w(M2, 'power', -2.6, -4.6), past = w(M2, 'power', -6.4, -4.6);
  assert.ok(walk(M2, [by[0], floor, by[1]], [past]).at[0] > w(M2, 'power', -3.9, -4.6)[0] - 0.4, 'the space under the stair is closed');
  const c1 = M2.items.find((i) => i.id === 'cell_1');
  assert.ok(c1.pos[1] - (M2.rooms.corridor.spawn[1] - 0.86) < 1.7, `cell one below Kai's eye (${c1.pos[1]})`);
});

test('M6 (F02, X02): the brass arm turns between the counter and the stair, clear of the cellar steps, Ezra, the counter, the gauge and the stairs', () => {
  const arm = M6L.hazards.find((h) => h.lvKit === 'brassArm');
  const [px, , pz] = arm.pivot, R = arm.radius;
  const reach = Math.hypot(R, 0.42) + 0.05; // (a hit: within the bar's length and 0.42 m of its line)
  const dist = (x, z) => Math.hypot(x - px, z - pz);
  assert.ok(arm.speed <= 1, 'it turns slower than 1 rad/s');
  // the cellar steps where Kai's body is at the bar's height (their top 3 m), and their head on the shop floor
  for (let x = 8.7; x <= 10.9; x += 0.2) for (let z = -22.8; z <= -16.5; z += 0.2) assert.ok(dist(x, z) > reach, `cellar steps (${x.toFixed(1)}, ${z.toFixed(1)})`);
  // the scissor stair's first steps (below 0.85 m) and the floor at their foot
  for (let x = 20.2; x <= 21.75; x += 0.1) for (let z = -21.3; z <= -18.3; z += 0.1) assert.ok(dist(x, z) > reach, `gallery stair (${x.toFixed(1)}, ${z.toFixed(1)})`);
  // Ezra (and his echo) with room to stand by him, the counter, the gauge, the return spot
  for (const n of M6L.npcs.filter((x) => /^ezra_shop/.test(x.id))) assert.ok(dist(n.pos[0], n.pos[2]) > reach + 1.6, `${n.id} at ${dist(n.pos[0], n.pos[2]).toFixed(2)} m`);
  for (const id of ['residue_ledger', 'gauge']) {
    const it = M6L.interactables.find((i) => i.id === id);
    assert.ok(dist(it.pos[0], it.pos[2]) > reach + 1.2, `${id} at ${dist(it.pos[0], it.pos[2]).toFixed(2)} m`);
  }
  const back = M6L.landmarks.shopReturn;
  assert.ok(back && dist(back[0], back[2]) > reach + 2, 'a hit puts Kai back out of its reach');
  // its reach spans the shop's front from the well's rail to the wall: the stair is reached across it, or not at all
  assert.ok(pz - R <= -21 + 0.15 + 0.3 && pz + R >= -16.225 - 0.3, `from the rail to the wall (${(pz - R).toFixed(2)} .. ${(pz + R).toFixed(2)})`);
  // the other ways round to the stair's foot are closed: behind the well, and down the strip beside the stair
  const north = walk(M6L, [12, 0, -22], [[12, -29.4], [18.6, -29.4], [20.2, -29.4]]);
  assert.ok(north.stuck, `no way round behind the well: ${JSON.stringify(north)}`);
  const strip = walk(M6L, [19.8, 0, -25], [[19.8, -19.5]]);
  assert.ok(strip.stuck, `the strip between the well and the stair is closed: ${JSON.stringify(strip)}`);
  // and the way across it is open floor (the arm is the challenge, not a wall)
  const across = walk(M6L, [14.6, 0, -17.6], [[20.8, -17.6], [21.1, -19.6], [21.1, -24]]);
  assert.ok(!across.stuck && across.at[1] > 1, `across the arm's floor and up the stair: ${JSON.stringify(across)}`);
  // its post is solid (nobody stands where the bar turns); a brass ring marks its reach; in 2196 it is rust
  assert.ok(M6L.elements.some((e) => e.solid && e.box[0] < px && e.box[3] > px && e.box[2] < pz && e.box[5] > pz && e.box[4] >= 0.9), 'its post');
  assert.equal(arm.stillIn, 'FUTURE');
});

test('M6 (F02): the first hit is explained, and the shop floor is where a hit puts Kai back (step)', () => {
  const said = [], toasts = [];
  const facts = new Map();
  const f = { get: (k) => facts.get(k), set: (k, v = true) => facts.set(k, v) };
  const arm = M6L.hazards.find((h) => h.lvKit === 'brassArm');
  const timers = [];
  const g = {
    facts: f, room: arm.room, catching: false, checkpoint: [9.8, -3.14, -30.6, Math.PI],
    deckWorld: { hazards: [{ hz: arm, angle: 0 }] },
    player: { pos: new THREE.Vector3(arm.pivot[0] - 1, 0.86, arm.pivot[2]), half: new THREE.Vector3(0.3, 0.85, 0.3), grounded: true },
    engine: { hasIn: () => false, statesOf: () => ['PRESENT', 'PAST', 'FUTURE'] },
    hud: { toast: (t) => toasts.push(t), say: (ls) => said.push(...ls.map((l) => l.text)) },
    audio: { zap() {} },
    after: (s, fn) => timers.push(fn),
  };
  const rt = { g, deck: M06, level: M6L };
  M06.step(rt, 1 / 30);
  assert.deepEqual(g.checkpoint.slice(0, 3), [M6L.landmarks.shopReturn[0], 0.86, M6L.landmarks.shopReturn[2]], 'on the shop floor its checkpoint is by the counter');
  g.catching = true; // (the hit's fade has begun)
  M06.step(rt, 1 / 30);
  timers.splice(0).forEach((fn) => fn());
  assert.ok(toasts.length === 1 && /BRASS ARM/.test(toasts[0]) && said.includes('Too soon. Let an end pass, count two, then follow it across.'), 'the first hit: what it was, and Kai\'s line');
  g.catching = false;
  for (let i = 0; i < 2; i++) { M06.step(rt, 1 / 30); g.catching = true; M06.step(rt, 1 / 30); timers.splice(0).forEach((fn) => fn()); g.catching = false; }
  assert.ok(toasts.some((t) => /2196/.test(t)), 'after the third, that in 2196 it has rusted still');
  // (Kai's line is among the mission's spoken lines, which the act1 pack records; and, as the toast, it says to count two:
  // playtest v2.1.1 L16)
  assert.ok(M06.spoken.armHit.some((l) => /count two/.test(l.text)));
});

test('M6 (F13): the escapement\'s lines come after the last clock\'s own; the boards give way to the deduction', () => {
  const rule = M06.rules.find((r) => r.id === 'clocks');
  assert.ok(!rule.say && rule.then === 'agree' && rule.set.clock_set, 'the rule sets clock_set and says nothing as it fires');
  assert.deepEqual(M06.spoken.agree.map((l) => l.text), ['Three clocks, three years. The escapement catches. Every clock agrees.', 'The house chimes: up, up, and a stop.']);
  // fx.agree waits for the lines the tap queued, then says them
  const said = [], timers = [];
  const g = { hud: { talking: true, say: (ls) => said.push(...ls.map((l) => l.text)) }, menu: null, facts: {}, after: (s, fn) => timers.push(fn), audio: null };
  const rt = { g, deck: M06 };
  M06.fx.agree(rt);
  for (let i = 0; i < 4; i++) timers.splice(0).forEach((fn) => fn());
  assert.equal(said.length, 0, 'not while the clock\'s lines play');
  g.hud.talking = false;
  timers.splice(0).forEach((fn) => fn());
  assert.equal(said[0], 'Three clocks, three years. The escapement catches. Every clock agrees.');
  const boards = threadsOf(M06).find((t) => t.id === 'boards');
  for (const s of boards.spots) assert.ok(/ev_boards_now && ev_boards_then/.test(s.when), `${s.id} goes once both are read`);
});

test('M1 (FT-05, VX-02): the woman with Mira\'s face is in sight of the wreck, and sets off only once Kai can see her', () => {
  const mira = M1.npcs.find((n) => n.id === 'mira');
  const head = [mira.pos[0], mira.pos[1] + 1.5, mira.pos[2]];
  const after = { zero_second: true, after_zero: true, voice_heard: true, rescued_a: true, rescued_b: true, checkpoint_passed: true, rook_message: true };
  for (const id of ['trapped_a', 'trapped_b']) {
    const n = M1.npcs.find((x) => x.id === id);
    assert.ok(clear(M1, [n.pos[0], n.pos[1] + 1.55, n.pos[2] + 0.8], head, after), `seen from where Kai pulls the ${id === 'trapped_a' ? 'woman' : 'man'} free`);
  }
  // the first of her way, down the barrow crossing, is in sight of where she sets off (12 m along the platform from her)
  const ch = threadsOf(M01).find((t) => t.id === 'chase');
  for (const p of ch.path.slice(0, 4)) assert.ok(clear(M1, [mira.pos[0] - 12, mira.pos[1] + 1.55, mira.pos[2] + 1], [p[0], p[1] + 1.2, p[2]], after), `the crossing she takes (${p})`);
  // M01.step: the leash is nothing while a wall stands between them, 14 m once he can see her
  const model = { visible: true, position: new THREE.Vector3(...mira.pos) };
  const npc = { n: { id: 'mira', chase: { leash: 14, started: false } }, model };
  let blocked = true;
  const g = {
    facts: { get: (k) => ({ voice_heard: true })[k] }, deckWorld: { npcs: [npc] },
    player: { pos: new THREE.Vector3(mira.pos[0] - 10, mira.pos[1] + 0.86, mira.pos[2]), rayDistance: (o, d, max) => (blocked ? 1 : max) },
    hud: {}, engine: { setState() {} }, minimap: null, campaign: {},
  };
  const rt = { g, level: M1, threads: {} };
  M01.step(rt, 0);
  assert.equal(npc.n.chase.leash, 0, 'out of sight she waits');
  blocked = false;
  M01.step(rt, 0);
  assert.equal(npc.n.chase.leash, 14, 'in sight, the 14 m leash');
  npc.n.chase.started = true;
  blocked = true;
  M01.step(rt, 0);
  assert.equal(npc.n.chase.leash, 14, 'once she has set off, the pursuit is the leash\'s as before');
});

test('M1 (FT-17, FT-08, FT-15): the board reads from the platform, the map shows the station, the staff gate is the last objective', () => {
  const [, by, bz] = M1.landmarks.boardSign;
  const yest = M1.texts.filter((t) => /ARRIVING YESTERDAY/.test(t.text));
  assert.ok(yest.some((t) => t.rotY === 0) && yest.some((t) => Math.abs(t.rotY - Math.PI) < 1e-6 && t.pos[2] < bz), 'lettered on its platform face too');
  assert.ok(yest.every((t) => t.when === 'checkpoint_passed'), 'the 41 arrives yesterday from the moment Kai reaches the station (Jun is asked why)');
  assert.ok(M1.texts.some((t) => /ON TIME/.test(t.text) && t.when === '!checkpoint_passed'));
  assert.ok(M1.map.blocks.some((b) => b[0] === -35 && b[1] === -166 && b[2] === 35 && b[3] === -146) && M1.map.blocks.some((b) => b[1] === -186), 'the platforms on the map');
  const gate = threadsOf(M01).find((t) => t.id === 'gate');
  assert.ok(gate && gate.after.includes('raincoat') && /staff gate/.test(gate.goal) && gate.because && gate.hints.length === 3);
  // (follow-up review: the raincoat opens the gate, M01.done, and the gate thread is the objective until Kai is through
  // it, gate.exit; its own arrival is beyond the gate, so taking the raincoat no longer finishes it: the bot's raincoat
  // spot, 1.0, -221.4, and the raincoat itself are outside it)
  assert.equal(M01.done, 'raincoat');
  assert.ok(gate.exit, 'the staff gate is the objective until Kai is through it');
  const trig = M1.triggers.find((t) => t.set?.t_m01_gate);
  assert.ok(trig && /raincoat/.test(trig.when), 'the gate counts once the raincoat is Kai\'s');
  const coat = M1.interactables.find((i) => i.id === 'raincoat');
  for (const [x, z] of [[1.0, -221.4], [coat.pos[0], coat.pos[2]]]) assert.ok(!(x >= trig.box[0] && x <= trig.box[3] && z >= trig.box[2] && z <= trig.box[5]), `${x}, ${z} outside the gate's arrival`);
  assert.ok(trig.box[5] < M1.exit.box[5] && trig.box[2] >= M1.exit.box[2] - 1, 'its arrival is through the gate, in the way out');
  assert.ok(coat.pos[2] > M1.exit.box[5], 'the raincoat lies outside the way out: taken, it does not end the mission');
  assert.ok(M1.texts.some((t) => t.text === 'STAFF ENTRANCE' && t.when === 'raincoat'));
  void by;
});

test('FT-21: the edition\'s page describes The Last Version of Earth, without the laws; Station Zero\'s keeps its own', () => {
  // (game/index.html is Station Zero's page and both builds start from it: the edition's build rewrites it)
  const html = fs.readFileSync(new URL('../game/index.html', import.meta.url), 'utf8');
  const d = html.match(/<meta name="description" content="([^"]*)">/)[1];
  assert.ok(/laws/i.test(d) && !/Last Version/.test(d), `Station Zero's page: ${d}`);
  const sh = fs.readFileSync(new URL('../android/build-apk.sh', import.meta.url), 'utf8');
  const m = sh.match(/if \(edition === 'lastversion'\) \{\s*html = html\.replace\(\/<meta name="description" content="\[\^"\]\*">\/, '<meta name="description" content="([^"]*)">'\)/);
  assert.ok(m && /Last Version of Earth/.test(m[1]) && !/laws/i.test(m[1]), 'the edition\'s build writes its own description');
  assert.match(sh, /node - "\$OUT" "\$FLAG" "\$EDITION" <<'JS'/);
});

test('M4 (F14): Kai starts at the door of the house he woke in, facing it, the blanket on its rail in view and in reach', () => {
  const sp = M4L.quarters[0].spawn;
  const wake = M4L.interactables.find((i) => i.id === 'wake');
  assert.ok(wake && wake.kit === 'blanket' && KIT_NAMES.includes('blanket'), 'the blanket is a thing of the place');
  const dx = wake.pos[0] - sp[0], dz = wake.pos[2] - sp[2], d = Math.hypot(dx, dz);
  const hx = -Math.sin(sp[3]), hz = -Math.cos(sp[3]);
  assert.ok(d < 4.2 && d > wake.r - 0.1, `the blanket ${d.toFixed(2)} m off: a step or two to its prompt`);
  assert.ok((hx * dx + hz * dz) / d > 0.85, 'Kai faces it as he starts');
  const [hxh, , hzh] = M4L.landmarks.blanketHouse;
  assert.ok(Math.hypot(hxh - sp[0], hzh - sp[2]) < 4.5, 'at the house\'s door');
  // the lit doorway: only this house's
  assert.ok(M4L.vis.some((v) => v.m === 'windowWarm' && Math.abs(v.x - hxh) < 0.1 && v.z < hzh), 'its doorway glows');
  // nothing stands between him and the door
  const up = walk(M4L, [sp[0], 0, sp[2]], [[wake.pos[0] + 0.4, wake.pos[2] - 1.2]]);
  assert.ok(!up.stuck, `he walks up to it: ${JSON.stringify(up)}`);
});

test('M5 (F17): the years differ across the channel from the start; the gate channel has a parapet and a stair out', () => {
  // from the weir, the far bank: a whole house in THRIVING, roofless in ABANDONED, the meadow under water in FLOODED
  const near = (v) => v.x > 74 && v.x < 86 && v.z > -18 && v.z < -6;
  const past = visIn(M5L, 'PAST').filter(near), now = visIn(M5L, 'PRESENT').filter(near), fut = visIn(M5L, 'FUTURE').filter(near);
  assert.ok(past.some((v) => v.r2 === 0 && v.m === 'reedThatch' && v.y >= 2), 'THRIVING: the farmstead\'s thatch');
  assert.ok(now.some((v) => v.open) && !now.some((v) => v.m === 'reedThatch'), 'ABANDONED: its walls open to the sky');
  assert.ok(visIn(M5L, 'FUTURE').some((v) => v.k === 'plane' && v.m === 'floodWater' && v.b[0] >= 62 && v.b[1] > -0.5), 'FLOODED: the far meadow under water');
  assert.ok(fut.some((v) => v.m === 'reedThatch' && v.y < 1.5), 'FLOODED: the house drowned to its thatch');
  const kinds = (y) => new Set(M5L.veg.filter((t) => (!t.e || t.e.includes(y)) && t.x > 62).map((t) => t.k));
  assert.ok(kinds('PAST').has('barley') && kinds('PRESENT').has('bareTree') && !kinds('PRESENT').has('barley'), 'barley in THRIVING, dead trees after');
  // the gate channel: the south bank walk does not drop Kai into it, and from its floor a stair climbs out
  const bank = walk(M5L, [-14, 0, 24], [[-24, 24]]);
  assert.ok(bank.stuck && bank.at[1] > -0.2, `the parapet stops him at the edge: ${JSON.stringify(bank)}`);
  const out = walk(M5L, [-23, -2.2, 18], [[-23, 27], [-23, 36]]);
  assert.ok(!out.stuck && Math.abs(out.at[1]) < 0.2, `up the stair out of it: ${JSON.stringify(out)}`);
});

test('M8 (F16): broad stepping stones to the island, Rook\'s office a room, the south drone off the stones\' bank, echoes with faces', () => {
  // the stones: from either bank to the island, even drifting half a metre either side of their line
  for (const sz of [1, -1]) {
    const across = walk(M8L, [0.2, 0.05, sz * 19], [[0.55, sz * 16.6], [-0.55, sz * 14.6], [0.5, sz * 13.0], [0, sz * 10.5]]);
    assert.ok(!across.stuck && across.at[1] > 0.3, `over the stones (${sz > 0 ? 'south' : 'north'}): ${JSON.stringify(across)}`);
  }
  const tops = M8L.vis.filter((v) => v.k === 'disc' && v.m === 'limestone');
  assert.equal(tops.length, 10, 'each stone has a pale top');
  // Rook's office: in at the door from the stair head, a wall and a roof round him
  const rook = M8L.npcs.find((n) => n.id === 'rook');
  const inside = walk(M8L, [40, 6, -15.2], [[40, -13], [rook.pos[0] - 0.9, rook.pos[2]]]);
  assert.ok(!inside.stuck, `through his door to him: ${JSON.stringify(inside)}`);
  const over = (e) => e.solid && e.box[0] < rook.pos[0] && e.box[3] > rook.pos[0] && e.box[2] < rook.pos[2] && e.box[5] > rook.pos[2] && e.box[1] > rook.pos[1] + 3;
  assert.ok(M8L.elements.some(over), 'a roof over him');
  assert.ok(M8L.texts.some((t) => /ROOK/.test(t.text) && /DIRECTOR/.test(t.text)), 'his name on the door');
  // the south court's drone keeps 8 m from where the stones leave the bank
  const south = M8L.sentinels.filter((s) => !s.when && s.path.every(([, z]) => z > 0));
  assert.ok(south.length && south.every((s) => Math.min(...s.path.map(([, z]) => z)) >= 26), JSON.stringify(south.map((s) => s.path)));
  // the echoes: Mission 8 and Mission 6 lend their holograms the textures of the people they are (echoes.js)
  assert.equal(typeof M08.step, 'function');
  assert.ok(/lendLooks/.test(M08.step.toString()) && /lendLooks/.test(M06.step.toString()));
  void M04;
});
