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
  const lines = (cur, subs = []) => { rt.g = { hud: { subT: cur ? 1 : 0, cur, subs } }; return rt.storyLines(); };
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
  const src = fs.readFileSync('game/js/editions/lastversion/Runtime.js', 'utf8');
  assert.match(src, /const staged = this\.opening \|\| this\.cinema\?\.active \|\| this\.storyLines\(\);\s+this\.graceT = staged \? 2 :/, 'the step keeps the watchers off while the lines play, and 2 s after');
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
  const rt = { g: { facts, fx: { burst: () => bursts++ }, audio: { land: () => thuds++ }, hud: { flash() {} } }, level: { landmarks: { arenaGap1: [0, 10, 0, 0], arenaGap2: [0, 10, 20, 1] } } };
  for (let t = 0; t < 20; t += 0.1) M21.step(rt, 0.1);
  assert.ok(thuds >= 2 && thuds <= 5 && bursts === thuds * 8, `${thuds} tremors, ${bursts} bursts in 20 s`);
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
