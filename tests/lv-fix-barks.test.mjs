// v2.1 playtest fixes, unit "barks": crowd lines said in passing and the floating tap prompt.
//   FT-03 / F01 / X1: the bark's distance was read from a scratch vector the walk had overwritten (every walker barked
//     from anywhere, every 9 s); F03: tiny pools looped dozens of times; F20 / F16: a bark during a load or a fade, its
//     pack still on its way, was only a caption; FT-04 / SYS-07: a bark hid the prompt, the touch way to act;
//     FT-12: a story line waited behind a bark and a reload lost it; SYS-18: a walker's head filled the screen.
//   node --test tests/lv-fix-barks.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../game/vendor/three.module.min.js';
import { DeckWorld, BARK, CAMERA_CLEAR } from '../game/js/world/DeckWorld.js';
import { HUD } from '../game/js/ui/HUD.js';
import { FactStore } from '../game/js/core/FactStore.js';
import { RealityEngine } from '../game/js/core/RealityEngine.js';
import { compileCondition } from '../game/js/core/conditions.js';
import { LastVersion, MISSIONS } from '../game/js/editions/lastversion/Runtime.js';

// --- a place with people and no meshes: DeckWorld's own people code, a real HUD without the DOM ----------------------
const engine = { state: () => 'PRESENT', hasIn: () => false };
function person(id, { pos = [0, 0, 0], path = null, barks = [], speed = 1, seed = 0, ambient = true, silent = true, height = 1.7, barkEvery } = {}) {
  const model = new THREE.Group();
  model.add(new THREE.Group(), new THREE.Group()); // (a body and its shadow: what the camera rule hides)
  model.position.set(...pos);
  model.userData = { animate() {}, setTalking() {}, lookAt() {} };
  const n = { id, ambient, silent, crowd: ambient, barks, path, speed, seed, height, room: 'r', first: id, ...(barkEvery ? { barkEvery } : {}) };
  return { n, crew: { first: id, color: '#456', pronoun: { their: 'her' } }, model, body: model, talkT: 0, cond: () => true, freeze: compileCondition('false'), wp: 0, lastBark: -99 };
}
function place(people) {
  const w = Object.assign(Object.create(DeckWorld.prototype), { engine, facts: new FactStore(), flags: {}, npcs: people, barkHeard: new Map(), lastBarkText: null, barkFrom: null, storyT: -99 });
  const hud = Object.assign(Object.create(HUD.prototype), { subs: [], subT: 0, speakers: {}, el: { subs: { innerHTML: '' }, fade: { classList: { contains: () => false } } } });
  const said = [];
  const player = { pos: new THREE.Vector3(0, 0.86, 0) };
  hud.onLine = (who, l) => {
    const n = people.find((p) => p.n.barks.includes(l.text) && p.talkT > 2.4);
    said.push({ t: g.time, text: l.text, bark: !!l.bark, who: n?.n.id, d: n ? Math.hypot(n.model.position.x - player.pos.x, n.model.position.z - player.pos.z) : null });
  };
  const g = { player, hud, facts: new FactStore(), camera: { position: new THREE.Vector3(0, 2.2, 4) }, time: 0 };
  // a step: Kai moves (walk(t)), the people, then the subtitles
  const run = (secs, walk = null, dt = 0.25) => {
    for (let k = 0; k < secs / dt; k++) {
      g.time += dt;
      if (walk) walk(g.time, player.pos);
      w.updatePeople(dt, g.time, g);
      hud.update(dt);
    }
  };
  return { w, g, hud, said, run, player };
}
const barksOf = (said) => said.filter((s) => s.bark);
// every rule of BARK, over a list of barks said
function assertPassing(barks, label) {
  for (const b of barks) assert.ok(b.d !== null && b.d < BARK.near, `${label}: "${b.text}" from ${b.d?.toFixed(1)} m (a few metres at most)`);
  for (let i = 1; i < barks.length; i++) {
    assert.ok(barks[i].t - barks[i - 1].t >= BARK.gap - 1e-6, `${label}: ${barks[i].t - barks[i - 1].t} s between two barks`);
    assert.notEqual(barks[i].text, barks[i - 1].text, `${label}: the same line twice in a row`);
  }
  const last = new Map();
  for (const b of barks) {
    if (last.has(b.text)) assert.ok(b.t - last.get(b.text) >= BARK.lineRest - 1e-6, `${label}: "${b.text}" again after ${b.t - last.get(b.text)} s`);
    last.set(b.text, b.t);
  }
}

test('FT-03/F01/X1: a walker far off never barks (the distance is its own, not the walk\'s unit vector); one a few metres off does', () => {
  // a long loop 20-40 m off: the old code saw |d| = 1 for every walker and barked every 9 s
  const far = person('far', { pos: [20, 0, 0], path: [[20, 0], [40, 0], [40, 20], [20, 20]], barks: ['Far line one.', 'Far line two.'] });
  const P = place([far]);
  P.run(180);
  assert.equal(barksOf(P.said).length, 0, `a walker ${far.model.position.distanceTo(P.player.pos).toFixed(0)} m off said ${JSON.stringify(P.said)}`);
  assert.ok(far.model.position.x !== 20 || far.model.position.z !== 0, 'and still walked its loop');
  // a standing talker (the other branch also wrote the scratch vector: lookAt) far off, and one close by
  const talkerFar = person('tf', { pos: [0, 0, 30], ambient: false, silent: false, barks: ['A talker far away.'] });
  talkerFar.n.lines = [{ who: 'X', text: 'hi' }];
  const near = person('near', { pos: [2, 0, 1], path: [[2, 1], [3, 1], [3, 2], [2, 2]], barks: ['Near line one.', 'Near line two.'] });
  const Q = place([talkerFar, near]);
  Q.run(60);
  const b = barksOf(Q.said);
  assert.ok(b.length >= 1 && b.every((x) => x.who === 'near'), JSON.stringify(b));
  assertPassing(b, 'near walker');
});

test('F03: barks are rare and never loop: global and per-person cooldowns, no line twice in a row or within minutes, a person who said all theirs rests', () => {
  // three people circling Kai within 3 m for 15 minutes: one with a single line (M15's "Same bread as yesterday."),
  // one with two, one with five
  const ring = (r, a0) => Array.from({ length: 8 }, (_, i) => [Math.cos(a0 + i * Math.PI / 4) * r, Math.sin(a0 + i * Math.PI / 4) * r]);
  const one = person('one', { pos: [2, 0, 0], path: ring(2, 0), barks: ['Same bread as yesterday.'], speed: 0.6 });
  const two = person('two', { pos: [0, 0, 2.5], path: ring(2.5, 1), barks: ['Is it still the same minute out there?', 'Four seconds. Four seconds.'], seed: 1, speed: 0.7 });
  const five = person('five', { pos: [-3, 0, 0], path: ring(3, 2), barks: ['L1.', 'L2.', 'L3.', 'L4.', 'L5.'], seed: 2, speed: 0.8, barkEvery: 24 });
  const P = place([one, two, five]);
  P.run(900);
  const b = barksOf(P.said);
  assertPassing(b, '15 minutes in a ring of people');
  // (at most one every BARK.gap: 30 in 15 minutes; the rests make it far fewer)
  assert.ok(b.length >= 4 && b.length <= 900 / BARK.gap, `${b.length} barks in 15 minutes`);
  const count = (text) => b.filter((x) => x.text === text).length;
  assert.ok(count('Same bread as yesterday.') <= Math.ceil(900 / BARK.personRest) + 1, `the one-line pool said ${count('Same bread as yesterday.')} times in 15 minutes`);
  // a person says each of their lines before any again, and then rests
  const by = (id) => b.filter((x) => x.who === id);
  const f = by('five');
  assert.deepEqual(new Set(f.slice(0, 5).map((x) => x.text)).size, Math.min(5, f.length), 'five lines, each once, before any again');
  for (const id of ['one', 'two', 'five']) {
    const mine = by(id), n = P.w.npcs.find((p) => p.n.id === id).n.barks.length;
    for (let i = 1; i < mine.length; i++) assert.ok(mine[i].t - mine[i - 1].t >= BARK.person - 1e-6, `${id}: ${mine[i].t - mine[i - 1].t} s between their lines`);
    for (let i = n; i < mine.length; i += n) assert.ok(mine[i].t - mine[i - 1].t >= BARK.personRest - 1e-6, `${id} rests after all ${n} of their lines`);
  }
});

test('F20/F16/FT-04: no bark over a story line (nor just after one), a staged moment, a menu, a fade, a load or a pack still loading; none only a caption', () => {
  // settles: nothing in the first seconds of a place
  {
    const P = place([person('p', { pos: [1.5, 0, 0], barks: ['Mind the gap.'] })]);
    P.run(BARK.settle - 1);
    assert.equal(barksOf(P.said).length, 0, 'a place just built is quiet');
    P.run(2);
    assert.equal(barksOf(P.said).length, 1, 'then the person beside Kai speaks');
  }
  const held = [
    ['a menu', (g) => (g.menu = 'pause')],
    ['a transition', (g) => (g.transitioning = true)],
    ['a catch', (g) => (g.catching = true)],
    ['a staged moment', (g) => (g.edition = { cinema: { active: {} } })],
    ['an opening', (g) => (g.edition = { opening: {} })],
    ['a chapter\'s people loading', (g) => (g.edition = { castWaitFor: 'act2' })],
    ['the fade', (g) => (g.hud.el.fade.classList.contains = () => true)],
    ['a voice pack still loading', (g) => (g.voice = { edn: true, enabled: true, loading: 0.4, plan: () => [{}] })],
    ['a line the packs cannot say', (g) => (g.voice = { edn: true, enabled: true, loading: 1, plan: () => null })],
  ];
  for (const [what, set] of held) {
    const P = place([person('p', { pos: [1.5, 0, 0], barks: ['Mind the gap.', 'Second line.'] })]);
    P.w.barkFrom = 0; // (settled: only the hold keeps the person beside Kai quiet)
    set(P.g);
    P.run(60);
    assert.equal(barksOf(P.said).length, 0, `no bark during ${what}: ${JSON.stringify(P.said)}`);
  }
  // a pack that can say it: said, voiced
  {
    const P = place([person('p', { pos: [1.5, 0, 0], barks: ['Mind the gap.'] })]);
    P.g.voice = { edn: true, enabled: true, loading: 1, plan: (text, who, extra) => (who === 'CREW' && extra.gender === 'f' ? [{ key: text }] : null) };
    P.run(BARK.settle + 1);
    assert.equal(barksOf(P.said).length, 1, 'the voice can say it: it is said');
  }
  // a story line: none over it, none for a few seconds after it
  {
    const P = place([person('p', { pos: [1.5, 0, 0], barks: ['Mind the gap.'] })]);
    P.hud.say([{ who: 'ROOK', text: 'Kai. Where are you. Not the front entrance. Staff gate, past the station. Come in now.' }, { who: 'KAI', text: 'Tell you what didn\'t happen?' },
      { who: 'ROOK', text: 'Something happened in the chamber last night and I need you to tell me it didn\'t. Just come in.' }], P.g.facts);
    while (P.hud.storyTalking) P.run(0.25);
    const end = P.g.time;
    assert.ok(end > BARK.settle, 'Rook\'s line outlasts the settling');
    assert.equal(barksOf(P.said).length, 0, 'not over Rook');
    P.run(20);
    const b = barksOf(P.said)[0];
    assert.ok(b, 'said once the story is over');
    assert.ok(b.t - end >= BARK.storyQuiet - 0.25, `and not straight after it (${(b.t - end).toFixed(2)} s after)`);
  }
});

test('FT-04/SYS-07/FT-12: a bark never hides the prompt and gives way at once to a story line, which never waits behind it', () => {
  const hud = Object.assign(Object.create(HUD.prototype), { subs: [], subT: 0, speakers: {}, el: { subs: { innerHTML: '' } } });
  const said = [];
  let skips = 0;
  hud.onLine = (who, l) => said.push(l.text);
  hud.onSkip = () => skips++;
  const facts = new FactStore();
  hud.say([{ who: 'CREW', text: 'Third clock this morning. I stopped checking.', bark: true }], facts);
  assert.ok(hud.talking && !hud.storyTalking, 'a bark is up: talking, but not a story line (the prompt shows: main.js)');
  // a story line now: the bark is cut (its voice with it), the story line is up this very frame
  hud.say([{ who: 'ROOK', text: 'Kai. Where are you.' }, { who: 'KAI', text: 'Twelve minutes out.' }], facts, () => said.push('(done)'));
  assert.equal(said[1], 'Kai. Where are you.', 'Rook is said at once, not after the bark');
  assert.equal(skips, 1, 'the bark\'s voice is stopped');
  assert.ok(hud.storyTalking, 'and the story hides the prompt');
  // a bark said while the story is up waits behind nothing and is dropped when the story says more
  hud.subs.push({ who: 'CREW', text: 'A queued bark.', bark: true, dur: 2 });
  hud.say([{ who: 'KAI', text: 'Tell you what didn\'t happen?' }], facts);
  assert.ok(!hud.subs.some((s) => s.bark), 'no bark waits in the queue');
  // a menu closed over a bark lets it go (a story line is said again)
  const h2 = Object.assign(Object.create(HUD.prototype), { subs: [], subT: 0, speakers: {}, el: { subs: { innerHTML: '' } } });
  const s2 = [];
  h2.onLine = (who, l) => s2.push(l.text);
  h2.say([{ who: 'CREW', text: 'Bark.', bark: true }], facts);
  h2.replay();
  assert.ok(!h2.talking && s2.length === 1 && h2.el.subs.innerHTML === '', 'the bark is let go, its caption with it');
  // the game: the prompt is hidden only by a story line; a tap on it over a bark cuts the bark and is the tap
  const src = fs.readFileSync('game/js/main.js', 'utf8');
  assert.match(src, /const showFocus = this\.focus && !this\.hud\.storyTalking;/, 'main.js: only a story line hides the prompt');
  assert.match(src, /else if \(this\.hud\.talking && \(!f \|\| \(f\.id === this\.lastUse && this\.hud\.storyTalking\)\)\) return this\.hud\.skipSub\(\);\s*if \(!f\) return;\s*this\.hud\.hushBarks\?\.\(\);/, 'main.js: a tap over a bark is the tap');
});

test('FT-12: a rule\'s lines cut off by a reload are said again on load; once said to their end, never again', () => {
  const m01 = MISSIONS.prologue.find((m) => m.key === 'm01');
  const flags = {};
  const hud = Object.assign(Object.create(HUD.prototype), { subs: [], subT: 0, speakers: {}, el: { subs: { innerHTML: '' } } });
  const said = [];
  hud.onLine = (who, l) => said.push(`${who}: ${l.text}`);
  const facts = new FactStore();
  const g = { campaign: { lv: true, deck: 0 }, story: { decks: [m01] }, facts, hud, deckWorld: { flags, refresh() {} }, after() {} };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g, objective() {}, opening: null });
  Object.defineProperty(rt, 'threads', { value: { update() {} } });
  // a commuter is mid-remark when Kai walks into the trigger band
  hud.say([{ who: 'CREW', text: 'Third clock this morning. I stopped checking.', bark: true }], facts);
  facts.set('rook_message');
  rt.onFact();
  assert.ok(flags.rule_rook_call && flags.saying_rook_call, 'the rule has fired, its lines are being said');
  assert.equal(said[1], 'ROOK: Kai. Where are you.', 'Rook\'s call does not wait behind the remark');
  // the app is closed now: the saved flags carry the call; the load says it again
  const saved = JSON.parse(JSON.stringify(flags));
  const hud2 = Object.assign(Object.create(HUD.prototype), { subs: [], subT: 0, speakers: {}, el: { subs: { innerHTML: '' } } });
  const said2 = [];
  hud2.onLine = (who, l) => said2.push(`${who}: ${l.text}`);
  const g2 = { campaign: { lv: true, deck: 0 }, story: { decks: [m01] }, facts, hud: hud2, deckWorld: { flags: saved, refresh() {} } };
  const rt2 = Object.assign(Object.create(LastVersion.prototype), { g: g2 });
  rt2.afterResume(m01);
  assert.equal(said2[0], 'ROOK: Kai. Where are you.', 'after the reload Rook calls again');
  for (let i = 0; i < 400 && hud2.talking; i++) hud2.update(0.1);
  assert.ok(said2.includes('ROOK: Just come in.') && !saved.saying_rook_call, 'to the end; then the mark is gone');
  // heard to the end: a later load does not say it again
  said2.length = 0;
  rt2.afterResume(m01);
  assert.equal(said2.length, 0, 'never twice');
});

test('SYS-18: a passer-by the camera is inside of is not drawn until it is clear; it keeps walking and stays present', () => {
  const w = person('w', { pos: [0, 0, 6], path: [[0, 6], [0, -6]], barks: [], speed: 1 });
  const P = place([w]);
  P.g.camera.position.set(0, 1.6, 0); // the walker's path runs straight through the camera
  const seen = [];
  for (let i = 0; i < 44; i++) {
    P.run(0.25);
    const z = w.model.position.z;
    seen.push({ z, drawn: w.model.children.every((c) => c.visible), visible: w.model.visible });
  }
  for (const s of seen) {
    if (Math.abs(s.z) < CAMERA_CLEAR.near - 0.3) assert.ok(!s.drawn, `inside the camera at z=${s.z.toFixed(2)}: not drawn`);
    if (Math.abs(s.z) > CAMERA_CLEAR.far + 0.3) assert.ok(s.drawn, `clear of it at z=${s.z.toFixed(2)}: drawn`);
    assert.ok(s.visible, 'present all along');
  }
  assert.ok(seen.at(-1).z < -CAMERA_CLEAR.far, `walked on through (z=${seen.at(-1).z.toFixed(2)})`);
  // the camera a little above a passer-by's head (the playtest's shot: head and shoulders filling a corner)
  const u = person('u', { pos: [0.4, 0, 6], path: [[0.4, 6], [0.4, -6]], speed: 1, height: 1.75 });
  const U = place([u]);
  U.g.camera.position.set(0, 2.35, 0);
  let under = null;
  for (let i = 0; i < 44; i++) {
    U.run(0.25);
    if (Math.abs(u.model.position.z) < 0.3) under = u.model.children.every((c) => !c.visible);
  }
  assert.equal(under, true, 'a head passing just under the camera is not drawn');
  // a child that was hidden on its own stays hidden when the walker is drawn again
  const v = person('v', { pos: [0, 0, 0.5], path: [[0, 0.5], [0, 8]], speed: 1 });
  v.model.children[1].visible = false;
  const Q = place([v]);
  Q.g.camera.position.set(0, 1.6, 0);
  Q.run(0.25);
  assert.ok(!v.model.children[0].visible, 'hidden at the camera');
  Q.run(8);
  assert.ok(v.model.children[0].visible && !v.model.children[1].visible, 'drawn again as it was');
});

// --- the real places: Missions 1, 4, 13 and 15's crowds, as built; a minute standing, three minutes walking -------------
function buildMission(key) {
  for (const ch of Object.keys(MISSIONS)) {
    const d = MISSIONS[ch].findIndex((m) => m.key === key);
    if (d < 0) continue;
    const game = { engine: new RealityEngine({ slots: 0, unlocked: 0, laws: [], states: ['PRESENT', 'PAST', 'FUTURE'], baseline: 'PRESENT', residue: 'PAST', stateEffects: {} }), facts: new FactStore(), story: null };
    const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: { states: ['PRESENT', 'PAST', 'FUTURE'], labels: { PRESENT: '2049', PAST: '2026', FUTURE: '2196' } } });
    game.story = rt.makeStory(ch);
    return rt.buildLevel({ lv: true, chapter: ch, deck: d, sector: 0, flags: {} });
  }
  throw new Error(key);
}
for (const key of ['m01', 'm04', 'm13', 'm15']) {
  test(`${key}: its crowd, a minute standing among it and three minutes walking with it: only from a few metres, rarely, nothing looped`, (t) => {
    const level = buildMission(key);
    const talkers = level.npcs.filter((n) => n.barks?.length);
    assert.ok(talkers.length > 0, `${key} has people with barks`);
    const people = level.npcs.map((n) => {
      const p = person(n.id, { pos: n.pos, path: n.path || null, barks: n.barks || [], speed: n.speed || 1, seed: n.seed || 0, ambient: !!n.ambient, silent: !!n.silent, height: n.height, barkEvery: n.barkEvery });
      p.n.room = n.room;
      p.n.voiceExtra = n.voiceExtra;
      return p;
    });
    // stand where the crowd walks thickest: the barker whose path passes most others' starts
    const walkers = people.filter((p) => p.n.path && p.n.barks.length);
    const busiest = (walkers.length ? walkers : people.filter((p) => p.n.barks.length)).map((p) => {
      const at = p.n.path ? p.n.path[0] : [p.model.position.x, p.model.position.z];
      return { p, at, k: people.filter((q) => Math.hypot(q.model.position.x - at[0], q.model.position.z - at[1]) < 8).length };
    }).sort((a, b) => b.k - a.k)[0];
    const P = place(people);
    P.player.pos.set(busiest.at[0], busiest.p.model.position.y + 0.86, busiest.at[1]);
    P.run(60);
    const idle = barksOf(P.said);
    assertPassing(idle, `${key} standing`);
    assert.ok(idle.length <= 2, `${key}: ${idle.length} barks in a minute standing still`);
    // then walk with the crowd: Kai follows the busiest walker's route a little slower than it (they pass him)
    const route = busiest.p.n.path || [busiest.at, busiest.at];
    let wp = 0;
    const walk = (t, pos) => {
      const to = route[wp];
      const dx = to[0] - pos.x, dz = to[1] - pos.z, l = Math.hypot(dx, dz);
      if (l < 0.3) wp = (wp + 1) % route.length;
      else { pos.x += (dx / l) * Math.min(l, 0.8 * 0.25); pos.z += (dz / l) * Math.min(l, 0.8 * 0.25); }
    };
    P.said.length = 0;
    P.run(180, walk);
    const moving = barksOf(P.said);
    assertPassing(moving, `${key} walking`);
    assert.ok(moving.length <= 180 / BARK.gap, `${key}: ${moving.length} barks in three minutes walking`);
    const texts = moving.map((b) => b.text);
    assert.equal(new Set(texts).size, texts.length, `${key}: no line twice in three minutes: ${JSON.stringify(texts)}`);
    assert.ok(idle.length + moving.length >= 1, `${key}: the crowd still speaks in passing`);
    const fmt = (l) => l.map((b) => `${b.t.toFixed(1)}s ${b.d.toFixed(1)}m "${b.text.slice(0, 40)}"`).join('; ');
    t.diagnostic(`${key}: ${talkers.length} people with barks; standing 60 s: ${idle.length} [${fmt(idle)}]; walking 180 s: ${moving.length} [${fmt(moving)}]`);
  });
}
