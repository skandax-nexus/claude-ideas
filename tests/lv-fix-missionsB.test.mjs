// THE LAST VERSION OF EARTH v2.1 playtest fixes, Act II to the Finale (docs/lastversion/PLAYTEST-v2.1.md; unit
// missionsB): choice headers that honour their line's condition (every choice node of the campaign), the watchers kept
// off a scene while its lines play, Mission 13's crossing, frozen block, trench gap and bridges, Mission 9's spawn,
// Mission 14's way to the bank's roof, the chain wall's picks, the Finale's sky, the last battle's tremors and THINK's
// tiers. The browser checks of the same findings, by touch, are in docs/lastversion/STATUS.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../game/vendor/three.module.min.js';
import { RealityEngine } from '../game/js/core/RealityEngine.js';
import { FactStore } from '../game/js/core/FactStore.js';
import { compileCondition } from '../game/js/core/conditions.js';
import { LV } from '../game/js/editions/lastversion/index.js';
import { LastVersion, MISSIONS } from '../game/js/editions/lastversion/Runtime.js';
import { Threads, threadsOf, choiceHeader, placedFact, factOf } from '../game/js/editions/lastversion/Threads.js';
import { DIALOGUE } from '../game/js/editions/lastversion/npcs.js';
import { ACT2 } from '../game/js/editions/lastversion/act2.js';
import { M21, M22 } from '../game/js/editions/lastversion/act4.js';
import { M23 } from '../game/js/editions/lastversion/finale.js';
import { horizonFor } from '../game/js/editions/lastversion/places/atlas.js';
import { underWater } from '../game/js/editions/lastversion/places/Place.js';
import { Player } from '../game/js/entities/Player.js';
import { Sentinel } from '../game/js/world/DeckWorld.js';

// a mission's level, built the way the runtime builds it (Runtime.buildLevel with a stand-in game)
function build(ch, deck) {
  const game = { engine: new RealityEngine(LV.engineOptions()), facts: new FactStore(), story: null };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory(ch);
  return rt.buildLevel({ lv: true, chapter: ch, deck, sector: 0, flags: {} });
}
const solids = (level, state = 'PRESENT', facts = {}) => level.elements.filter((e) => e.solid && (!e.when || compileCondition(e.when)({ fact: (k) => facts[k], state })));
// Kai walks [x, z] waypoints with the game's own physics (entities/Player.js), as tests/lastversion.test.mjs walkRoute;
// the trace keeps every point he stood on
function walk(level, start, route, facts = {}, state = 'PRESENT', extra = []) {
  const cols = [...solids(level, state, facts).map((e) => ({ min: e.box.slice(0, 3), max: e.box.slice(3) })), ...extra];
  const p = Object.assign(Object.create(Player.prototype), { pos: new THREE.Vector3(start[0], start[1] + 0.86, start[2]), vel: new THREE.Vector3(), H: new THREE.Vector3(0, 0, -1), U: new THREE.Vector3(0, 1, 0), gravity: -1, grounded: false, half: new THREE.Vector3(0.3, 0.85, 0.3), topSpeed: null, stepOff: 0, airT: 0, _canStep: false, comfort: true, pitch: 0, facing: new THREE.Vector3(0, 0, -1), colliders: [] });
  const trace = [];
  for (const [x, z] of route) {
    let best = 1e9, stuck = 0;
    for (let t = 0; t < 60; t += 1 / 30) {
      const dx = x - p.pos.x, dz = z - p.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.45) break;
      p.H.set(dx / d, 0, dz / d);
      p.update(1 / 30, { forward: 1, strafe: 0, run: false, jump: false, slow: false }, cols);
      trace.push([p.pos.x, p.pos.y, p.pos.z]);
      if (d < best - 0.05) { best = d; stuck = 0; } else if ((stuck += 1 / 30) > 3) break;
    }
    if (Math.hypot(x - p.pos.x, z - p.pos.z) > 0.6) return { stuck: [x, z], at: p.pos.toArray().map((v) => +v.toFixed(2)), trace };
  }
  return { at: [+p.pos.x.toFixed(2), +(p.pos.y - 0.86).toFixed(2), +p.pos.z.toFixed(2)], trace };
}
const segDist = ([px, pz], [ax, az], [bx, bz]) => {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
};
const pathDist = (pt, path) => Math.min(...path.map((a, i) => segDist(pt, a, path[(i + 1) % path.length])));
const M13L = build('act2', 4), M09L = build('act2', 0), M14L = build('act3', 0);

// --- F02, X3: a choice's header is the last line that was said --------------------------------------------------------
// every node with choices in the campaign: the missions' scenes, talks, beats and deductions, the shared conversations
function choiceNodes() {
  const out = [];
  const add = (where, n) => n && Array.isArray(n.choices) && n.choices.length && out.push({ where, node: { lines: n.lines || n.question || [], choices: n.choices, ...(n.header !== undefined ? { header: n.header } : {}) } });
  for (const [ch, ms] of Object.entries(MISSIONS)) for (const m of ms) {
    for (const [k, sc] of Object.entries(m.scenes || {})) add(`${ch}/${m.key}.scenes.${k}`, sc);
    for (const [k, nodes] of Object.entries(m.talks || {})) (nodes || []).forEach((n, i) => add(`${ch}/${m.key}.talks.${k}[${i}]`, n));
    (m.beats || []).forEach((b, i) => add(`${ch}/${m.key}.beats[${i}]`, b));
    for (const [k, d] of Object.entries(m.deductions || {})) add(`${ch}/${m.key}.deductions.${k}`, { lines: d.question, choices: d.answers });
  }
  for (const [k, nodes] of Object.entries(DIALOGUE)) (nodes || []).forEach((n, i) => add(`DIALOGUE.${k}[${i}]`, n));
  return out;
}
// the header Runtime.playNode hands the choice panel, through its own code
function headerOf(node, facts) {
  let got = 'none';
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: { facts, hud: { say: (lines, f, done) => done?.() } } });
  rt.choose = (choices, n, nd, header) => { got = header; };
  rt.playNode(node);
  return got;
}
// the facts a condition reads, every combination of them set and unset (or to the strings it compares with)
function factWorlds(conds) {
  const ids = new Map();
  for (const c of conds) {
    for (const m of c.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*==\s*"([^"]*)"/g)) (ids.get(m[1]) || ids.set(m[1], new Set()).get(m[1])).add(m[2]);
    for (const m of c.replace(/"[^"]*"/g, '').matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)) if (!['true', 'false'].includes(m[1]) && !ids.has(m[1])) ids.set(m[1], new Set());
  }
  const keys = [...ids.keys()].slice(0, 6);
  const worlds = [];
  const values = (k) => [undefined, ...(ids.get(k).size ? [...ids.get(k)] : [true])];
  const walkK = (i, acc) => {
    if (i === keys.length) return worlds.push({ ...acc });
    for (const v of values(keys[i])) walkK(i + 1, v === undefined ? acc : { ...acc, [keys[i]]: v });
  };
  walkK(0, {});
  return worlds;
}

test('F02, X3: every choice node of the campaign heads its choices with the last line said, never one whose condition failed', () => {
  const nodes = choiceNodes();
  assert.ok(nodes.length >= 60, `${nodes.length} choice nodes`);
  let checked = 0;
  for (const { where, node } of nodes) {
    const conds = node.lines.map((l) => l.when).filter(Boolean);
    for (const w of factWorlds(conds)) {
      const facts = new FactStore();
      for (const [k, v] of Object.entries(w)) facts.set(k, v);
      const said = node.lines.filter((l) => !l.when || facts.test(l.when)); // (what HUD.say says)
      const want = said.length ? said[said.length - 1] : null;
      const got = headerOf(node, facts);
      assert.equal(got, want, `${where} with ${JSON.stringify(w)}: header ${JSON.stringify(got?.text)}, last said ${JSON.stringify(want?.text)}`);
      assert.ok(!got?.when || facts.test(got.when), `${where}: the header's own condition holds`);
      checked++;
    }
  }
  assert.ok(checked >= nodes.length, `${checked} headers checked`);
});

test('F02, X3: the three nodes the playtest named', () => {
  const f = (o = {}) => { const s = new FactStore(); for (const [k, v] of Object.entries(o)) s.set(k, v); return s; };
  // the Finale: Orren's record only to a player who read it
  const end = M23.scenes.ending;
  assert.equal(headerOf(end, f()).text, 'Three things the ring can do, and only one of them.');
  assert.match(headerOf(end, f({ ev_unwritten_record: true })).text, /^Orren's record/);
  // Mission 10's prisoners: Rook only once he was exposed; Mission 21's soldier: the freed district only if it was
  const pris = ACT2[1].scenes.prisoners, last = pris.lines[pris.lines.length - 1];
  assert.notEqual(headerOf(pris, f()), last);
  assert.equal(headerOf(pris, f({ rook_fate: 'expose' })), last);
  const sol = M21.talks.soldier[0], slast = sol.lines[sol.lines.length - 1];
  assert.notEqual(headerOf(sol, f()), slast);
  assert.equal(headerOf(sol, f({ faction: 'unwritten' })), slast);
  // a node's own header wins, and null means none
  assert.equal(choiceHeader({ header: null }, [{ who: 'NONE', text: 'x' }], f()), null);
});

// --- F13: the chain wall: a right pick is acknowledged and the next pick offered at once ---------------------------
test('F13: a playback piece that goes in is acknowledged (a chime, the count) and the next pick is offered at once, its order in the header', () => {
  const facts = new FactStore();
  const toasts = [], played = [];
  let chimes = 0;
  const rt = { g: { facts, hud: { toast: (t) => toasts.push(t), say() {} }, audio: { chime: () => chimes++ } }, playNode: (n) => played.push(n) };
  const th = new Threads(rt);
  th.attach(M22, { npcs: [], talkGates: {} });
  const t = th.byId.chain;
  let node = th.playback('chain');
  assert.equal(node.header, undefined, 'the first pick is headed by its question');
  for (let n = 0; n < t.entries.length; n++) {
    const right = node.choices.filter((c) => c.playback === 'chain');
    assert.equal(right.length, 1, 'one right pick, and it carries the playback on');
    assert.ok(node.choices.filter((c) => c !== right[0]).every((c) => !c.playback && c.lines === t.wrong), 'a wrong pick is said and stays out');
    assert.equal(right[0].label, t.entries[n].label);
    for (const [k, v] of Object.entries(right[0].set)) facts.set(k, v);
    th.play('chain'); // (Runtime.applyAfter, once the pick's own lines are said)
    node = played[played.length - 1];
    if (n + 1 < t.entries.length) {
      assert.equal(node.choices.length, t.entries.length - n - 1, 'the rest offered at once');
      assert.ok(t.entries.slice(0, n + 1).every((e) => node.header.text.includes(e.label)), `the header says the order so far: ${node.header.text}`);
      assert.match(toasts[toasts.length - 1], new RegExp(`${n + 1} / ${t.entries.length}`));
    }
  }
  assert.equal(facts.get(placedFact(M22, t)), t.entries.length);
  assert.ok(node.show && node.set?.[factOf(M22, t)], 'the last one in: the re-enactment');
  assert.equal(chimes, t.entries.length, 'each piece in is heard');
});

// --- F04: the watchers are not the business of a scene's lines ------------------------------------------------------
test('F04: while the story\'s lines play (not a bark, not a THINK hint) the watchers see nobody, and for a breath after', () => {
  const rt = Object.create(LastVersion.prototype);
  const lines = (cur, subs = []) => { rt.g = { time: 10, hud: { subT: cur ? 1 : 0, cur, subs } }; return rt.storyLines(); };
  assert.equal(lines({ who: 'NONE', text: 'Behind the frozen glass...' }), true);
  assert.equal(lines(null, [{ who: 'SERA', text: 'Third floor.' }, { done() {} }]), true);
  assert.equal(lines({ who: 'CREW', text: 'Is it still the same minute out there?', bark: true }), false);
  assert.equal(lines({ who: 'KAI', text: 'A hint.', hint: true }), false);
  assert.equal(lines(null, [{ done() {} }]), false);
  // THINK says its line marked as a hint (asked for, it must not hide Kai)
  const said = [];
  const h = Object.assign(Object.create(LastVersion.prototype), { g: { facts: new FactStore(), audio: { blip() {} }, hud: { say: (l) => said.push(...l) } }, _threads: { hint: () => ({ key: 'k', tiers: ['One.', 'Two.', 'Three.'] }) } });
  h.hint();
  assert.deepEqual(said, [{ who: 'KAI', text: 'One.', hint: true }]);
  // only while Kai stays where the lines began: walking on while they play, the watchers see him again
  const at = (x, z) => ({ x, z });
  lines({ who: 'NONE', text: 'Behind the frozen glass...' });
  // (follow-up review: only lines the player started at a spot, a scene or a talk tapped: the story's own narration as
  // Kai walks is no cloak)
  assert.equal(rt.storyHolds(at(70, -57.3)), false, 'narration nobody tapped for: no cloak');
  rt.spotT = 9.6; // (THE FROZEN BLOCK tapped: useDeck)
  assert.equal(rt.storyHolds(at(70, -57.3)), true, 'standing at the scene');
  assert.equal(rt.storyHolds(at(71.5, -55)), true, 'shuffling about it');
  assert.equal(rt.storyHolds(at(70, -52)), false, 'walked 5 m off: no cloak');
  assert.equal(rt.storyHolds(at(70, -57.3)), true, 'back at the scene while it plays');
  lines(null, []);
  assert.equal(rt.storyHolds(at(70, -52)), false, 'the lines over');
  assert.equal(rt.linesAt, null, 'and where they began forgotten');
  lines({ who: 'SERA', text: 'Third floor.' });
  assert.equal(rt.storyHolds(at(70, -52)), true, 'the next lines begin where Kai stands now');
  const src = fs.readFileSync('game/js/editions/lastversion/Runtime.js', 'utf8');
  assert.match(src, /const held = this\.storyHolds\(p\);\s+const staged = this\.opening \|\| this\.cinema\?\.active;\s+this\.stagedT = staged \? 2 :[^\n]*\n\s+this\.graceT = staged \|\| held \? 2 :/, 'the step keeps the watchers off while the lines play, and 2 s after');
});

// --- Mission 13 -----------------------------------------------------------------------------------------------------------
test('X01: Mission 13\'s trapped people pace in the frozen block\'s lobby, behind its solid glass', () => {
  const glass = M13L.elements.find((e) => e.solid && e.box[2] === -62.4 && e.box[5] === -62.2);
  assert.ok(glass && /!civilians_freed/.test(glass.when) && /@PRESENT/.test(glass.when), 'the frozen glass is solid while they are trapped, in 2049');
  const trapped = M13L.npcs.filter((n) => n.crowd && n.when && /!civilians_freed/.test(n.when));
  assert.ok(trapped.length >= 4, `${trapped.length} trapped people`);
  for (const n of trapped) {
    assert.ok(n.pos[2] < -62.6 && n.pos[2] > -65.6, `${n.id} stands behind the glass, in the lobby: z ${n.pos[2]}`);
    for (const p of n.path || []) assert.ok(p[1] < -62.6 && p[1] > -65.6, `${n.id} walks behind the glass: ${p}`);
  }
  // from the street Kai cannot walk in; once they are freed the glass is gone
  const st = walk(M13L, [70, 0, -58], [[70, -64]]);
  assert.ok(st.stuck && st.at[2] > -62.4, `the glass stops Kai on the street: ${JSON.stringify(st.at)}`);
  assert.ok(!walk(M13L, [70, 0, -58], [[70, -64]], { civilians_freed: true }).stuck, 'freed, the lobby is open');
  // the district's patrol keeps to the channel side of the street: never through the spot Kai looks in from, nor the
  // roll-call wall (fallen, its slabs reach z -57.4); standing at the block's spot Kai is outside its cone (fov 0.75:
  // 0.45 rad either side of its heading), so the scene there is not walked through
  const pat = M13L.sentinels.find((x) => x.id.endsWith('_q2s1'));
  const blockSpot = [M13L.landmarks.frozenBlock[0] + 10, M13L.landmarks.frozenBlock[2] + 18.5];
  for (const [what, pt] of [['the frozen block\'s spot', blockSpot], ['the roll-call wall', [40, -57.4]]]) {
    const d = pathDist(pt, pat.path);
    assert.ok(d > 2.5, `${what}: ${d.toFixed(1)} m from the patrol's line`);
  }
  const off = Math.asin(Math.min(1, pathDist(blockSpot, pat.path) / pat.range)); // (nearest within its range: the angle off its heading)
  assert.ok(off > pat.fov * 0.6, `the block's spot: within its range ${(off * 57.3).toFixed(0)} deg off its heading, outside its cone`);
});

test('F03: Mission 13\'s crossing: a sandbag line closes the field before the canyon gate but for one gap, which a sentry paces', () => {
  const shells = [56, 0, 48], gate = [22, 10];
  // heading straight for the gate, Kai meets the line and is led along it to its gap: he crosses it there and nowhere else
  const straight = walk(M13L, shells, [gate]);
  const crossing = straight.trace.find((p, i) => i && p[2] < 24 && straight.trace[i - 1][2] >= 24);
  assert.ok(!straight.stuck && crossing && crossing[0] > 19.5 && crossing[0] < 26.2, `crossed the line at ${crossing?.map((v) => v.toFixed(1))}`);
  // (no way through it anywhere else, east to the map's edge)
  for (const x of [30, 60, 90, 116]) assert.ok(walk(M13L, [x, 0, 32], [[x, 16]]).stuck, `no way through the line at x ${x}`);
  assert.ok(!walk(M13L, shells, [[23, 32], [23, 16], gate]).stuck, 'through the gap by the containers');
  // the sentry: its beat runs along the line, its west end within its sight of the gap, its east end out of sight of the
  // shell zone; the patrol the playtest found nowhere near the way is gone
  const s = M13L.sentinels.find((x) => x.id.endsWith('_q0s1'));
  assert.ok(s, 'the sentry');
  assert.ok(pathDist([23, 24], s.path) < s.range, `the gap is in its range: ${pathDist([23, 24], s.path).toFixed(1)} m`);
  assert.ok(pathDist([60, 38], s.path) > s.range, 'doing the shells, Kai is out of its range');
  assert.ok(pathDist(gate, s.path) > s.range, 'and at the gate (the next quarter\'s spawn)');
  // somewhere to wait and watch it from, out of its range
  const cover = M13L.elements.filter((e) => e.solid && e.box[4] >= 2 && e.box[0] > 24 && e.box[3] < 56 && e.box[2] > 30 && e.box[5] < 44);
  assert.ok(cover.length >= 2, `${cover.length} burnt trucks to wait behind`);
  // caught at the line, Kai is walked back to the shell zone (out of the sentry's range, facing the gap), not all the
  // way to the quay: main.js keeps the last checkpoint whose box he stood in, the last one listed winning
  const cpAt = (pt, prev = null) => {
    let cp = prev;
    for (const c of M13L.checkpoints) if (pt[0] >= c.box[0] && pt[0] < c.box[3] && pt[1] >= c.box[1] && pt[1] < c.box[4] && pt[2] >= c.box[2] && pt[2] < c.box[5]) cp = c.spawn;
    return cp;
  };
  const quay = cpAt([0, 0.86, 80]);
  assert.deepEqual(quay.slice(0, 3), M13L.landmarks.quayTrench.slice(0, 3).map((v, i) => (i === 1 ? v + 0.86 : v)), 'on the quay: the quay');
  const field = cpAt([60, 0.86, 44], quay);
  assert.ok(field !== quay && Math.hypot(field[0] - 60, field[2] - 44) < 6, `by the shells: ${field}`);
  assert.equal(cpAt([40, 0.86, 25.5], field), field, 'at the sandbag line it stays the shell zone\'s');
  assert.ok(pathDist([field[0], field[2]], s.path) > s.range + 2, 'out of the sentry\'s range');
  const H = [-Math.sin(field[3]), -Math.cos(field[3])];
  assert.ok(H[0] < -0.5 && H[1] < -0.5, `facing the gap (south-west): ${H.map((v) => v.toFixed(2))}`);
  assert.ok(!walk(M13L, [field[0], 0, field[2]], [[23, 32], [23, 16], gate]).stuck, 'and from there to the gate, through the gap');
});

// the crossing played with the game's own Sentinel and Player, from the shell zone, at 25 phases of the sentry's beat:
// straight at the gate (the playtest's walk), or as THINK says (wait clear of the line; as soon as it turns east, go)
function crossing(strategy, phase) {
  const cols = solids(M13L).map((e) => ({ min: e.box.slice(0, 3), max: e.box.slice(3) }));
  const model = { position: new THREE.Vector3(), rotation: { y: 0 }, userData: { eyeMat: { color: { setHex() {} } }, coneMat: { color: { setHex() {} }, opacity: 0 } } };
  const s = new Sentinel(M13L.sentinels.find((x) => x.id.endsWith('_q0s1')), model);
  const away = { pos: new THREE.Vector3(999, 0.86, 999), running: false, rayDistance: () => 0 };
  const dt = 1 / 30;
  for (let t = 0; t < phase; t += dt) s.update(dt, t, { player: away, here: true });
  const p = Object.assign(Object.create(Player.prototype), { pos: new THREE.Vector3(60, 0.86, 44), vel: new THREE.Vector3(), H: new THREE.Vector3(0, 0, -1), U: new THREE.Vector3(0, 1, 0), gravity: -1, grounded: false, half: new THREE.Vector3(0.3, 0.85, 0.3), topSpeed: null, stepOff: 0, airT: 0, _canStep: false, comfort: true, pitch: 0, facing: new THREE.Vector3(0, 0, -1), colliders: cols, running: false });
  const route = strategy === 'straight' ? [[22, 10]] : [[46, 45], 'wait', [23.5, 30], [23, 17], [22, 10]];
  let wi = 0, seen = 0;
  for (let t = 0; t < 120; t += dt) {
    const w = route[wi];
    if (w === 'wait' && s.dir.x > 0.5 && s.pos.x < 34) { wi++; continue; } // (it has turned east, away from the gap)
    // (at the gate: it counts once no watcher is on Kai's heels, Runtime's `unseen` trigger; else he stands there)
    if (wi >= route.length) { if (s.mode !== 'chase') return { through: true, seen }; }
    else if (w !== 'wait') {
      const dx = w[0] - p.pos.x, dz = w[1] - p.pos.z, d = Math.hypot(dx, dz);
      if (d < (wi === route.length - 1 ? 4 : 0.6)) { wi++; continue; }
      p.H.set(dx / d, 0, dz / d);
    }
    p.update(dt, { forward: w === 'wait' || wi >= route.length ? 0 : 1, strafe: 0, run: false, jump: false, slow: false }, cols);
    if (s.update(dt, t, { player: p, here: true }) === 'caught') return { caught: true, seen };
    seen = Math.max(seen, s.suspicion);
  }
  return { stuck: true };
}

test('F03: the crossing is a stealth beat: walked straight at the gate, the sentry catches Kai more often than not; timed as THINK says, he gets through', () => {
  const phases = [...Array(25).keys()].map((i) => (i * 26) / 25);
  const straight = phases.map((ph) => crossing('straight', ph)), timed = phases.map((ph) => crossing('timed', ph));
  const caught = straight.filter((r) => r.caught).length;
  assert.ok(straight.every((r) => r.caught || r.through), 'every walk ends at the gate or caught');
  assert.ok(caught >= 12, `straight at the gate: caught ${caught} times in 25`);
  assert.ok(caught <= 20, `but not a wall: ${25 - caught} of 25 walks get through on the sentry's back`);
  const ok = timed.filter((r) => r.through && r.seen < 1).length;
  // (a stealth thread's arrival counts unseen: its trigger says so, and Runtime's trigger step holds it while a watcher chases)
  const trig = M13L.triggers.find((t) => Object.keys(t.set).includes('t_m13_cross'));
  assert.equal(trig?.unseen, true, 'the crossing\'s arrival is an unseen one');
  assert.match(fs.readFileSync('game/js/editions/lastversion/Runtime.js', 'utf8'), /if \(t\.unseen && g\.deckWorld\.sentinels\.some\(\(s\) => s\.mode === 'chase' && s\.def\.room === g\.room\)\) return;/);
  assert.ok(ok >= 24, `timed: through ${ok} times in 25: ${JSON.stringify(timed.map((r, i) => [phases[i].toFixed(1), r]).filter(([, r]) => !(r.through && r.seen < 1)))}`);
});

test('F18: Mission 13\'s trench gap is clear and lit, the channel railed but for its bridges, the rail bridge signed', () => {
  // from the spawn straight south through the gap (no post in front of it any more)
  const spawn = M13L.landmarks.quayTrench;
  const thru = walk(M13L, spawn.slice(0, 3), [[0, 66]]);
  assert.ok(!thru.stuck, `straight through the trench gap: ${JSON.stringify(thru.at)}`);
  assert.ok(M13L.glows.filter(([x, , z]) => Math.abs(Math.abs(x) - 4.6) < 0.1 && z > 69 && z < 73).length >= 4, 'flares either side of the gap');
  // heading for the frozen block from the crater field: the railing, not the channel
  const into = walk(M13L, [62, 0, -30], [[62, -56]]);
  assert.ok(into.stuck && into.at[2] > -40, `the north quay's railing stops Kai: ${JSON.stringify(into.at)}`);
  assert.ok(!walk(M13L, [70, 0, -30], [[70, -56]]).stuck, 'the rail bridge is the way across');
  assert.ok(M13L.texts.some((t) => t.text === 'RAIL BRIDGE') && M13L.texts.some((t) => /RAIL BRIDGE EAST/.test(t.text)), 'signed, and the raised bridge points to it');
  // in 2049 the raised lifting bridge is barred; in 2026 it is down and open
  assert.ok(walk(M13L, [-20, 0, -34], [[-20, -54]]).stuck, 'the raised bridge, barred');
  assert.ok(!walk(M13L, [-20, 0, -34], [[-20, -54]], {}, 'PAST').stuck, 'the bridge down in 2026');
});

// --- Mission 9 ------------------------------------------------------------------------------------------------------------
test('F15: Mission 9\'s quay patrol keeps out of sight of the spawn, where the objective has Kai watch the street', () => {
  const s = M09L.sentinels.find((x) => x.id.endsWith('_q0s0'));
  const spawn = M09L.quarters[0].spawn;
  assert.ok(s && pathDist([spawn[0], spawn[2]], s.path) > s.range + 2, `the patrol is ${pathDist([spawn[0], spawn[2]], s.path).toFixed(1)} m from the spawn at its nearest`);
});

// --- Mission 14 -----------------------------------------------------------------------------------------------------------
test('F09, X4: in 2196 Kai walks from the viaduct to the bank\'s fallen lift car, over the poled crossing, and into the car', () => {
  const drowns = (M14L.drowns || []).map((d) => ({ ...d, cond: d.when ? compileCondition(d.when) : null }));
  const ctx = { fact: () => undefined, state: 'FUTURE' };
  const car = M14L.landmarks.liftCar;
  const r = walk(M14L, [26, 0, 88], [[26, 74], [12, 69.2], [-8, 69.2], [car[0] + 2.6, car[2]]], {}, 'FUTURE');
  assert.ok(!r.stuck, `the walk: ${JSON.stringify(r.at)}`);
  const wet = r.trace.find((p) => underWater(drowns, [p[0], p[1] - 0.25, p[2]], ctx));
  assert.ok(!wet, `never in deep water: ${wet && wet.map((v) => v.toFixed(1))}`);
  // the car itself, as it lies: a step up from the sidewalk (Player's STEP is 0.35 m), and Kai walks into it
  const base = M14L.processes.find((x) => x.id === 'liftCar').parts.find((x) => x.solid);
  const q = new THREE.Quaternion(...base.rest.q), c = new THREE.Vector3(...base.rest.p), bb = new THREE.Box3();
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) bb.expandByPoint(new THREE.Vector3(sx * base.size[0] / 2, sy * base.size[1] / 2, sz * base.size[2] / 2).applyQuaternion(q).add(c));
  assert.ok(bb.max.y - 0.15 <= 0.3, `its floor ${(bb.max.y - 0.15).toFixed(2)} m over the sidewalk`);
  const into = walk(M14L, [car[0] + 2.8, 0.15, car[2]], [[car[0], car[2]]], {}, 'FUTURE', [{ min: bb.min.toArray(), max: bb.max.toArray() }]);
  assert.ok(!into.stuck && into.at[1] > bb.max.y - 0.1, `walked into the car: ${JSON.stringify(into.at)}`);
  // the hint says how
  const lift = threadsOf(MISSIONS.act3.find((m) => m.key === 'm14')).find((t) => t.id === 'lift');
  assert.match(lift.hints.join(' '), /crossing/);
  assert.match(lift.hints[2], /REVERSE/);
});

// --- F17: the Finale's sky ------------------------------------------------------------------------------------------------
test('F17: from the Finale\'s road the horizon paints no second Ring Hill and no crown floating over the real one', () => {
  for (const era of ['2026', '2049', '2196']) {
    const f = horizonFor('afterzero', era, { notch: 'clear' });
    assert.ok(!f.some((x) => x.kind === 'crown' || x.kind === 'hill'), `${era}: ${f.map((x) => x.kind).join(' ')}`);
  }
  assert.ok(horizonFor('rain_south', '2049').some((x) => x.kind === 'crown'), 'elsewhere the Ring Hill keeps its crown');
});

// --- F19: the last battle's danger, seen ---------------------------------------------------------------------------------
test('F19: while the arena falls the Spire shakes every few seconds, dust off both gaps; never once the summit stair is reached', () => {
  const facts = new FactStore();
  facts.set('arena_fallen', true);
  let bursts = 0, thuds = 0;
  const rt = { g: { facts, fx: { burst: () => bursts++ }, audio: { land: () => thuds++ }, hud: { flash() {} }, player: { pos: { x: 0, y: 12.9, z: -68 } } }, level: { landmarks: { arenaGap1: [0, 10, 0, 0], arenaGap2: [0, 10, 20, 1] } } };
  for (let t = 0; t < 20; t += 0.1) M21.step(rt, 0.1);
  assert.ok(thuds >= 2 && thuds <= 5 && bursts === thuds * 11, `${thuds} tremors, ${bursts} bursts in 20 s (8 at the gaps, 3 at Kai's feet)`);
  facts.set('t_m21_gapTwo', true);
  const n = thuds;
  for (let t = 0; t < 20; t += 0.1) M21.step(rt, 0.1);
  assert.equal(thuds, n, 'over once the gaps are crossed');
});

// --- SYS-16: THINK's tiers help -------------------------------------------------------------------------------------------
test('SYS-16: THINK\'s tiers are sentences that help: none of one word from Mission 4 on, and Missions 5, 8, 11-14 rewritten', () => {
  const words = (s) => s.split(/\s+/).filter(Boolean).length;
  const all = Object.values(MISSIONS).flat().filter((m) => !['m01', 'm02', 'm03'].includes(m.key));
  for (const m of all) for (const t of threadsOf(m)) for (const h of t.hints || []) assert.ok(words(h) >= 2, `${m.key} ${t.id}: "${h}"`);
  for (const k of ['m05', 'm08', 'm11', 'm12', 'm13', 'm14']) {
    const m = all.find((x) => x.key === k);
    for (const t of threadsOf(m)) {
      const hs = t.hints || [];
      assert.equal(hs.length, 3, `${k} ${t.id}: three tiers`);
      assert.equal(new Set(hs).size, 3, `${k} ${t.id}: three different tiers`);
      for (const h of hs) assert.ok(words(h) >= 4 && /[.?!]$/.test(h), `${k} ${t.id}: "${h}" is a sentence`);
    }
  }
  // the ones the playtest quoted
  const hint = (k, id) => threadsOf(all.find((x) => x.key === k)).find((t) => t.id === id).hints;
  assert.notDeepEqual(hint('m11', 'arrive'), ['The intercom.', 'Past the atrium.', 'Go in to triage.']);
  assert.notDeepEqual(hint('m12', 'chase'), ['He is on the roof.', 'He waits at the glass.', 'Keep after him.']);
  assert.notDeepEqual(hint('m14', 'parts'), ['The list.', 'On the platform.', 'Read it.']);
});

// --- the watchers' about-turn (world/DeckWorld.js Sentinel.turnTo) ----------------------------------------------------------
test('F03, F19: a watcher on a two-point beat turns round at its ends and faces the way it walks (it walked back facing where it came from)', () => {
  const model = { position: new THREE.Vector3(), rotation: { y: 0 }, userData: { eyeMat: { color: { setHex() {} } }, coneMat: { color: { setHex() {} }, opacity: 0 } } };
  const s = new Sentinel({ path: [[0, 0], [10, 0]], speed: 2, range: 9, fov: 0.75 }, model);
  const away = { pos: new THREE.Vector3(999, 0.86, 999), running: false, rayDistance: () => 0 };
  const facing = [];
  let x0 = s.pos.x;
  for (let t = 0; t < 22; t += 1 / 30) {
    s.update(1 / 30, t, { player: away, here: true });
    const vx = s.pos.x - x0;
    x0 = s.pos.x;
    if (Math.abs(vx) > 1e-4 && s.pos.x > 1.5 && s.pos.x < 8.5) facing.push(Math.sign(vx) === Math.sign(s.dir.x) && Math.abs(s.dir.x) > 0.95);
  }
  const off = facing.filter((f) => !f).length;
  assert.ok(facing.length > 200 && off <= facing.length * 0.03, `faces the way it walks, both ways (but for the half second of a turn): ${off} of ${facing.length} steps not`);
  // and in Mission 13 the sentry at the gap, walking east, looks east (away from the gap)
  const m = { ...model, userData: { ...model.userData } };
  const q = new Sentinel(M13L.sentinels.find((x) => x.id.endsWith('_q0s1')), m);
  for (let t = 0; t < 26 + 2; t += 1 / 30) q.update(1 / 30, t, { player: away, here: true });
  const before = q.pos.x;
  q.update(1 / 30, 28, { player: away, here: true });
  assert.ok(Math.sign(q.pos.x - before) === Math.sign(q.dir.x), 'the sentry, a beat and more later, still faces its way');
});
