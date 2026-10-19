// AFTERZERO: THE LAST VERSION OF EARTH (v2.0) - the state engine, the edition layer, the
// people and the missions, without a browser:
//   - the reality engine on three years, PAST / PRESENT / FUTURE (authored states per room,
//     what each year does, causal anchors, save and restore, no laws, gravity that never changes)
//   - REVERSE (the bible's inversion as a local verb, Mission 11 on): every process record valid,
//     nothing reversible before Mission 11, Mission 11's lock and its clues, the v2.0 save migration,
//     moving colliders that never expire
//   - the edition's own storage namespace, speakers and voices
//   - the 23 missions of the bible in order, with their quoted lines, endings and choices
//   - every mission level solvable by construction: each obstacle has a state (or the anchor)
//     that gets past it, each generated route only uses states the room was authored with,
//     each beat has something that completes it, and every place can snap back to PRESENT
//   - the NPC state model, intents, barks and echoes
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { RealityEngine } from '../game/js/core/RealityEngine.js';
import { FactStore } from '../game/js/core/FactStore.js';
import { compileCondition } from '../game/js/core/conditions.js';
import { LV, allLines } from '../game/js/editions/lastversion/index.js';
import { LastVersion, MISSIONS, CHAPTERS, ORDER, HINTS, HINTS_REVERSE, PRIMES, migrateSave } from '../game/js/editions/lastversion/Runtime.js';
import { RULES, INV_LINES } from '../game/js/editions/lastversion/inversion.js';
import { checkRecord, makeRecord, colliderEntry, Process, MAX_PROCESSES, MAX_PARTS, WEIGHTS, KINDS } from '../game/js/editions/lastversion/processes.js';
import * as THREE from '../game/vendor/three.module.min.js';
import { ENDINGS, LOCK_ORDER } from '../game/js/editions/lastversion/acts.js';
import { NPCS, DIALOGUE, AMBIENT, npcState, JUN_HOOK, WATER_HOOK, MARA_HOOK, IVEN_HOOK } from '../game/js/editions/lastversion/npcs.js';

const INTENTS = ['challenge', 'comfort', 'investigate', 'withdraw'];
const engine = () => new RealityEngine(LV.engineOptions());

// --- the state engine -------------------------------------------------------------------------
test('the engine runs on three years, authored per room', () => {
  const e = engine();
  assert.equal(LV.states.length, 3, 'three years: REVERSE is a verb, not a fourth state');
  assert.deepEqual(e.states, ['PRESENT', 'PAST', 'FUTURE']);
  assert.equal(e.state('lab'), 'PRESENT', 'a room starts in the present');
  assert.equal(e.residue, 'PAST', 'the past shows what stood here');
  e.setAvailable('lab', ['PRESENT', 'FUTURE']);
  assert.equal(e.setState('lab', 'PAST'), false, 'a year the room was not authored with is refused');
  assert.equal(e.state('lab'), 'PRESENT');
  e.setAvailable('lab', ['PRESENT', 'PAST', 'FUTURE']);
  const seen = [];
  for (let i = 0; i < 4; i++) { e.cycle('lab'); seen.push(e.state('lab')); }
  assert.deepEqual(seen, ['PAST', 'FUTURE', 'PRESENT', 'PAST'], 'cycling visits only the authored states, in order');
  e.setAvailable('corridor', ['PRESENT']);
  assert.equal(e.cycle('corridor'), false, 'a one-state place does not switch');
  assert.throws(() => e.setState('lab', 'INVERTED'), /Unknown state/, 'there is no INVERTED state');
  assert.throws(() => e.setState('lab', 'ECHO'), /Unknown state/);
});

test('each year does what the bible says, with no laws and no gravity flip', () => {
  const e = engine();
  assert.equal(e.slots, 0, 'no law slots');
  assert.deepEqual(e.laws, [], 'no law-writing device in this edition');
  assert.deepEqual(LV.engineOptions().laws, []);
  assert.deepEqual(Object.keys(LV.engineOptions().stateEffects), ['PAST'], 'only the past has effects of its own');
  assert.ok(e.has('echoSolid', 'PAST') && e.has('echoVisible', 'PAST'), 'PAST: original structures stand and hold weight');
  for (const s of e.states) {
    e.setState('lab', s, { force: true });
    assert.ok(!e.has('gravityFlip', s) && !e.has('zeroG', s), `${s}: gravity never changes`);
    assert.equal(e.gravity('lab'), -1, `${s}: Kai's own gravity never changes`);
  }
  // a reversed ward runs selected motion backwards (an override, not a year) and still keeps gravity
  e.setOverride('ward', { timeReverse: true });
  assert.ok(e.hasIn('timeReverse', 'ward') && e.gravity('ward') === -1);
  for (const s of ['PRESENT', 'FUTURE']) assert.ok(!e.has('echoSolid', s), `${s} has no residue`);
  assert.ok(!e.has('heldPersists', 'PRESENT'), 'what you carry out of the past comes apart...');
  e.setGlobal('heldPersists');
  for (const s of e.states) assert.ok(e.has('heldPersists', s), `...unless anchored (${s})`);
  e.setGlobal('heldPersists', false);
  assert.ok(!e.has('heldPersists', 'PRESENT'), 'the anchor lets go');
});

test('rooms, authored states and anchors survive save and restore', () => {
  const e = engine();
  e.setAvailable('lab', ['PRESENT', 'FUTURE']);
  e.setState('lab', 'FUTURE');
  e.setGlobal('heldPersists');
  const d = JSON.parse(JSON.stringify(e.serialize()));
  const f = engine();
  f.restore(d);
  assert.equal(f.state('lab'), 'FUTURE');
  assert.deepEqual(f.statesOf('lab'), ['PRESENT', 'FUTURE']);
  assert.ok(f.has('heldPersists', 'PAST'));
});

test('a v2.0 save that stands in an INVERTED room migrates to three years', () => {
  // what a v2.0 save held: four states, a third law slot unlocked, rooms left INVERTED
  const v20 = {
    rooms: { d2s0r0: 'INVERTED', d2s0r1: 'PAST', d2s1r0: 'INVERTED' }, laws: [null, null, null], unlocked: 3, locked: [], overrides: { d2s0r0: { timeReverse: true } },
    available: { d2s0r0: ['INVERTED', 'PRESENT', 'PAST'], d2s0r1: ['PRESENT', 'PAST', 'FUTURE', 'INVERTED'] }, globalEffects: {},
  };
  const e = engine();
  e.restore(JSON.parse(JSON.stringify(v20)));
  const campaign = { lv: true, chapter: 'act2', deck: 2, sector: 0, flags: { beat_done: false }, stability: 0.8 };
  migrateSave(e, campaign, LV);
  assert.equal(e.state('d2s0r0'), 'PRESENT', 'an INVERTED room goes back to the baseline');
  assert.equal(e.state('d2s1r0'), 'PRESENT');
  assert.equal(e.state('d2s0r1'), 'PAST', 'a room in a year it still has keeps it');
  assert.deepEqual(e.statesOf('d2s0r0'), ['PRESENT', 'PAST'], 'INVERTED is stripped from what a room can be');
  assert.deepEqual(e.statesOf('d2s0r1'), ['PRESENT', 'PAST', 'FUTURE']);
  assert.deepEqual(e.overrides, {}, 'the reversed wards are re-applied by the level, not the save');
  assert.deepEqual(e.laws, []);
  assert.equal(e.unlocked, 0, 'no law slots');
  for (const rid of Object.keys(v20.rooms)) assert.equal(e.gravity(rid), -1, `${rid}: gravity is ordinary`);
  assert.deepEqual(campaign.inv, { cap: 8, charge: 8 }, 'REVERSE gets its charge');
  const kept = { lv: true, inv: { cap: 12, charge: 3 } };
  migrateSave(engine(), kept, LV);
  assert.deepEqual(kept.inv, { cap: 12, charge: 3 }, 'a charge already saved is kept');
});

test('conditions compare against strings (faction standing)', () => {
  const ctx = (facts) => ({ fact: (k) => facts[k] });
  assert.equal(compileCondition('faction == "unwritten"')(ctx({ faction: 'unwritten' })), true);
  assert.equal(compileCondition('faction == "unwritten"')(ctx({ faction: 'continuum' })), false);
  assert.equal(compileCondition("quest_iven != 'resolved' && @PRESENT")({ fact: () => 'active', state: 'PRESENT' }), true);
});

// --- the edition layer -------------------------------------------------------------------------
test('the edition keeps its own saves and settings, and the default edition is unchanged', async () => {
  const plain = await import('../game/js/core/Edition.js');
  assert.equal(plain.EDITION, null, 'no window: the Station Zero game');
  assert.equal(plain.NS, 'afterzero.');
  globalThis.window = { AZ_EDITION: 'lastversion', location: { search: '' } };
  try {
    const lv = await import('../game/js/core/Edition.js?lastversion');
    assert.equal(lv.EDITION, 'lastversion');
    assert.equal(lv.NS, 'afterzero.lv.', 'its own localStorage prefix');
  } finally {
    delete globalThis.window;
  }
  assert.equal(LV.title, 'AFTERZERO');
  assert.equal(LV.subtitle, 'THE LAST VERSION OF EARTH');
  assert.deepEqual(Object.values(LV.labels), ['2049', '2026', '2196']);
  const build = fs.readFileSync(new URL('../android/build-apk.sh', import.meta.url), 'utf8');
  for (const s of ['com.afterzero.lastversion', 'versionName="2.0.0"', 'AFTERZERO-LastVersion-v$VER.apk', 'AFTERZERO: Last Version', "window.AZ_EDITION='lastversion'"]) assert.ok(build.includes(s), `build-apk.sh: ${s}`);
});

test('every speaker has a name, a colour and its own voice', () => {
  const need = ['KAI', 'MIRA', 'WITNESS', 'ROOK', 'NIKO', 'SERA', 'ANJA', 'IVEN', 'JUN', 'TALA', 'MARA', 'ORREN', 'CHILD'];
  for (const k of need) assert.ok(LV.speakers[k]?.name && LV.speakers[k]?.color, k);
  const py = fs.readFileSync(new URL('../tools/voice-pack.py', import.meta.url), 'utf8');
  const voice = {};
  for (const m of py.matchAll(/'(\w+)': \('(\w+)', ([\d.]+), ([\d.]+)\)/g)) voice[m[1]] = m[2];
  for (const k of [...need, 'NONE']) assert.ok(voice[k], `tools/voice-pack.py VOICES has ${k}`);
  const ids = need.map((k) => voice[k]);
  assert.equal(new Set(ids).size, ids.length, `each speaker a distinct Kokoro voice: ${ids}`);
  assert.equal(voice.KAI[1], 'm', 'Kai is a male voice');
  const lines = allLines();
  assert.ok(lines.length > 500, `${lines.length} lines`);
  const who = new Set(lines.map(([w]) => w));
  for (const w of who) assert.ok(LV.speakers[w] || ['NONE', 'CREW_n', 'CREW_f', 'CREW_m', 'VOICE', 'YOU'].includes(w), `unknown speaker ${w}`);
});

// --- the missions --------------------------------------------------------------------------------
const BIBLE = [
  'THE LAST NORMAL DAY', 'HELIX GOES DARK', 'THE FIRST SWITCH', 'THE MAN FROM THE LAST DAY', 'THE VILLAGE THAT NEVER EXISTED', 'THE CLOCKMAKER\'S HOUSE',
  'THE BROKEN OBSERVATORY', 'THE FIRST DEATH', 'NINE MINUTES TO ZERO', 'ENEMIES WHO REMEMBER', 'THE INVERTED HOSPITAL', 'THE MAN BEHIND THE GLASS',
  'THE NINE-MINUTE WAR', 'WELCOME TO 2196', 'THE CITY THAT FORGOT TOMORROW', 'THE MUSEUM OF FAILED WORLDS', 'THE WITNESS\'S ARCHIVE', 'THE FRACTURE',
  'THE PLACE OUTSIDE TIME', 'MIRA\'S MEMORY', 'THE LAST BATTLE OF THE CONTINUUM', 'THE FIRST SECOND', 'AFTERZERO',
];
const main = ORDER.flatMap((ch) => MISSIONS[ch]);

test('the 23 missions of the bible, in order, in their acts', () => {
  assert.deepEqual(main.map((m) => m.n), BIBLE.map((_, i) => i + 1));
  assert.deepEqual(main.map((m) => m.name), BIBLE);
  assert.deepEqual(ORDER.map((ch) => MISSIONS[ch].length), [3, 5, 5, 5, 4, 1]);
  for (const ch of ORDER) assert.ok(CHAPTERS[ch].name && CHAPTERS[ch].question, ch);
  for (const m of main) assert.ok(m.outro?.length, `Mission ${m.n} has its mission ending`);
  assert.deepEqual(MISSIONS.cases.map((m) => m.n), ['B', 'C'], 'quest chains B and C are optional cases (A and D are in the Prologue)');
});

// every string a mission can show or say
function texts(o, out = [], seen = new Set()) {
  if (!o || typeof o !== 'object' || seen.has(o)) return out;
  seen.add(o);
  for (const v of Object.values(o)) {
    if (typeof v === 'string') out.push(v);
    else if (typeof v === 'object') texts(v, out, seen);
  }
  return out;
}
// (and the lines the missions' scripted moments speak from code)
const SRC = ['prologue.js', 'acts.js'].map((f) => fs.readFileSync(new URL(`../game/js/editions/lastversion/${f}`, import.meta.url), 'utf8').replace(/\\'/g, "'")).join('\n');
const ALL = [...texts(MISSIONS), ...texts(DIALOGUE), ...texts(NPCS), ...texts(AMBIENT), ...texts(ENDINGS), SRC].join('\n');

test('the bible\'s quoted lines are spoken verbatim', () => {
  const quotes = [
    'The event lasted one second.', 'What event?', 'That\'s the problem. Every recording says it hasn\'t happened yet.', 'Kai Varen. Do not build the machine.',
    'This drawing is twenty-three years old.', 'Then someone has been using your credentials.', 'I was twelve.', 'Which one is real?', 'All of them. That\'s why this is dangerous.',
    'You came before the first fire.', 'I\'ve never been here.', 'That is what the others said.', 'You keep changing the world.', 'I\'m trying to get home.', 'Then stop changing it.',
    'You ask what time it is. Wrong question.', 'What\'s the right one?', 'Which version of the question are you asking?', 'When the child returns, do not let him see the ninth minute.',
    'They didn\'t know when. They knew who.', 'Don\'t save me.', 'Because I am not the one who died.', 'VERSION 17', 'You have nine minutes.', 'To become me.',
    'In my time, your face is on every memorial.', 'For saving the world?', 'For ending it.', 'Temporal discontinuity.', 'The person you become when you refuse to let go.',
    'This is not the future.', 'The future that survives long enough to remember us.', 'We teach children your name before they learn the names of the dead.',
    'That depends on whether you count the worlds that never finished becoming worlds.', 'We had a thousand chances. We only needed one that was ours.',
    'You kept bringing her back.', 'I kept finding a world where she could exist.', 'And what happened to those worlds?', 'They became the price.',
    'I remember the first world.', 'The one before you tried to save me.', 'You\'ve been trying to reach the version of me that would forgive you.',
    'I remember being your sister.', 'That\'s not the same thing.', 'Would it be enough if I said it was?', 'I was trying to find a version of me that didn\'t have to.', 'And did you?',
    'You were trying to stop me from becoming you.', 'I thought the answer was to find the right world.', 'Now I think we kept asking the world to pay for our answer.',
    'For the first time, tomorrow belonged to tomorrow.', 'We had saved every possible tomorrow. None of them agreed on the future.', 'I finally found a second that belongs to nobody.',
    'Version one hundred and eighteen.',
    // the NPC supplement: quest chain samples and barks
    'The train keeps arriving. Nobody gets on. Nobody gets off. But I can hear them in the next carriage.', 'Then why do I keep apologizing to them?',
    'You ask where the river began. We ask who taught it to stay.', 'Then you have not listened long enough.', 'A clean history is usually a history someone has cleaned.',
    'Start with the question: true for whom?', 'My phone says 8:14. The station board says tomorrow.', 'You wear no dust, but the old story knows your face.',
    'The channel is running again. Nobody alive remembers who opened it.', 'You did that already. No - you\'re about to do it. I hate that I know the difference.',
    'Don\'t follow the footsteps. Follow what they refuse to step on.',
  ];
  const missing = quotes.filter((q) => !ALL.includes(q));
  assert.deepEqual(missing, []);
});

test('Mission 10 unlocks Echo Step, Mission 13 sets the faction, the Finale has the three endings', () => {
  const m10 = main.find((m) => m.n === 10), m13 = main.find((m) => m.n === 13), m23 = main.find((m) => m.n === 23);
  const echo = m10.scenes.prisoners.choices;
  assert.ok(echo.length >= 2 && echo.every((c) => c.set.echo_step === true), 'every choice in Mission 10 unlocks Echo Step');
  const factions = m13.scenes.stabilizer.choices.map((c) => c.set.faction).sort();
  assert.deepEqual(factions, ['continuum', 'unwritten'], 'destroy the stabilizer or redirect it');
  assert.deepEqual(m23.scenes.ending.choices.map((c) => c.ending), ['A', 'B', 'C']);
  assert.deepEqual(Object.keys(ENDINGS), ['A', 'B', 'C']);
  assert.deepEqual(Object.values(ENDINGS).map((e) => e.title), ['THE FIXED WORLD', 'THE INFINITE WAR', 'AFTERZERO']);
  // later support follows from earlier choices, and going alone always works
  const ally = main.find((m) => m.n === 21).scenes.ally.choices;
  assert.ok(ally.some((c) => !c.when && c.beatDone), 'an ally is never required');
});

test('every choice expresses an intent, every condition compiles, every scene a beat names exists', () => {
  const walk = (o, f, seen = new Set()) => {
    if (!o || typeof o !== 'object' || seen.has(o)) return;
    seen.add(o);
    f(o);
    for (const v of Object.values(o)) if (typeof v === 'object') walk(v, f, seen);
  };
  let choices = 0;
  walk([MISSIONS, DIALOGUE], (o) => {
    if (o.intent) { choices++; assert.ok(INTENTS.includes(o.intent), `intent ${o.intent}`); assert.ok(o.label, 'a choice has words'); }
    if (typeof o.when === 'string') compileCondition(o.when);
    if (typeof o.done === 'string') compileCondition(o.done);
  });
  assert.ok(choices > 60, `${choices} choices`);
  for (const ch of Object.keys(MISSIONS)) {
    for (const m of MISSIONS[ch]) {
      for (const b of m.beats || []) if (b.scene) assert.ok(m.scenes?.[b.scene], `${m.key}: scene ${b.scene}`);
    }
  }
});

// --- every mission is solvable ---------------------------------------------------------------------
// build every sector the way the runtime does (Runtime.buildLevel), with a stand-in game
function buildAll() {
  const out = [];
  for (const ch of Object.keys(MISSIONS)) {
    const game = { engine: engine(), facts: new FactStore(), story: null };
    const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
    game.story = rt.makeStory(ch);
    game.story.decks.forEach((deck, d) => {
      for (let s = 0; s < deck.sectors; s++) {
        const c = { lv: true, chapter: ch, deck: d, sector: s, flags: {} };
        const level = rt.buildLevel(c);
        out.push({ ch, deck, s, level, rt });
      }
    });
  }
  return out;
}
const LEVELS = buildAll();
const PRODUCE = (states) => new Set(['heldPersists', ...states.flatMap((s) => Object.keys(LV.engineOptions().stateEffects[s] || {}))]);

test('all the mission levels build', () => {
  const sectors = Object.values(MISSIONS).flat().reduce((a, m) => a + m.sectors, 0);
  assert.equal(LEVELS.length, sectors, `${LEVELS.length} levels`);
  assert.ok(sectors >= 60, `${sectors} sectors`);
  for (const { deck, level } of LEVELS) {
    assert.ok(level.exit && level.spawn && level.order.length, deck.mkey);
    assert.ok(level.checkpoints.length, `${deck.mkey}: somewhere to come back to`);
  }
});

test('every place can snap back to PRESENT, and every unstable place has somewhere else to go', () => {
  for (const ch of Object.keys(MISSIONS)) {
    for (const m of MISSIONS[ch]) {
      assert.ok(m.states.includes('PRESENT'), `${m.key} has PRESENT`);
      for (const s of m.states) assert.ok(LV.states.includes(s), `${m.key}: ${s}`);
      if (m.unstable) assert.ok(m.states.length > 1, `${m.key}`);
    }
  }
  assert.ok(main.slice(0, 2).every((m) => !m.unstable), 'no stability drain before the Chronolith');
});

test('every obstacle has a state (or the anchor) that gets past it', () => {
  let rooms = 0;
  for (const { deck, s, level } of LEVELS) {
    for (const rid of level.order) {
      const room = level.rooms[rid];
      const st = room.states || level.states || deck.states;
      const can = PRODUCE(st);
      for (const c of room.challenges || []) {
        rooms++;
        if (c.optional) continue;
        if (c.effect) assert.ok(can.has(c.effect), `${deck.mkey}/${s} ${rid}: ${c.key} needs ${c.effect}, the room has ${st}`);
        if (c.key === 'canal' || c.key === 'roof') assert.ok(can.has('echoSolid'), `${deck.mkey}/${s}: ${c.key} needs PAST, has ${st}`);
      }
    }
  }
  assert.ok(rooms > 150, `${rooms} challenges checked`);
});

test('every generated route only uses states its room was authored with', () => {
  let steps = 0;
  for (const { deck, s, level } of LEVELS) {
    for (const rid of level.order) {
      const room = level.rooms[rid];
      const st = room.states || level.states || deck.states;
      for (const w of room.route || []) {
        steps++;
        if (w.state) assert.ok(st.includes(w.state), `${deck.mkey}/${s} ${rid}: the route steps into ${w.state}, the room has ${st}`);
        if (w.act === 'take') assert.ok(level.items.some((i) => i.id === w.item), `${deck.mkey}: item ${w.item}`);
        if (w.act === 'use') assert.ok(level.interactables.some((i) => i.id === w.target), `${deck.mkey}: ${w.target}`);
      }
    }
  }
  assert.ok(steps > 200, `${steps} route steps`);
});

test('every beat has something that completes it', () => {
  for (const { deck, s, level } of LEVELS) {
    const beat = deck.beats?.[s] || { kind: 'custom' };
    const st = level.states || deck.states;
    const here = `${deck.mkey}/${s} (${beat.kind})`;
    const inter = level.interactables;
    if (beat.kind === 'arrival' || beat.kind === 'log') assert.ok(inter.some((i) => i.kind === 'terminal' && i.log === beat.log), here);
    else if (beat.kind === 'contradiction') {
      assert.ok(inter.some((i) => i.kind === 'plaque' && i.beat === beat), here);
      assert.ok(st.includes('PAST'), `${here}: the residue is read in the past`);
    } else if (beat.kind === 'encounter') assert.ok(level.npcs.some((n) => n.id.startsWith('npc_') && (n.lines?.length || n.choices)), here);
    else if (beat.kind === 'scene' || beat.kind === 'choice') {
      const sc = deck.scenes[beat.scene];
      assert.ok(inter.some((i) => i.kind === 'scene' && i.scene === beat.scene), here);
      for (const m of (sc.when || '').matchAll(/@([A-Z]+)/g)) assert.ok(st.includes(m[1]), `${here}: the scene needs ${m[1]}`);
      const ends = sc.beatDone || sc.choices?.length && sc.choices.every((c) => c.beatDone || c.ending);
      assert.ok(ends, `${here}: the scene (or every choice in it) completes the beat`);
    } else if (beat.kind === 'tasks') {
      assert.equal(inter.filter((i) => i.task !== undefined).length, beat.tasks.length, here);
      for (const t of beat.tasks) if (t.state) assert.ok(st.includes(t.state), `${here}: a task needs ${t.state}`);
    } else {
      assert.equal(beat.kind, 'custom', here);
      assert.ok(deck.done, `${here}: an authored mission says when it is done`);
    }
    // and the gate waits for it
    assert.ok(level.elements.some((e) => e.when === '!beat_done' && /^gate_/.test(e.id || '')) || level.zone, `${here}: a gate`);
  }
});

test('the prologue\'s facts can all be reached: every condition a scene or door waits on is set by something', () => {
  for (const m of MISSIONS.prologue) {
    const game = LEVELS.find((l) => l.deck.mkey === m.key);
    const lv = game.level;
    // (set by the runtime or a mission's own step: the clocks, the sockets, the unit, Mira, the hall)
    const set = new Set(['mira_gone', 'zero_second', 'after_zero', 'has_chronolith', 'cells_1', 'cells_2', 'cells_3', 'unit_down', 'crossed', 'open_control', 'beat_done', 'quest_jun', 'quest_iven']);
    const add = (o) => o && Object.keys(o).forEach((k) => set.add(k));
    texts(m); // (walk)
    const walk = (o, seen = new Set()) => {
      if (!o || typeof o !== 'object' || seen.has(o)) return;
      seen.add(o);
      if (o.set && typeof o.set === 'object') add(o.set);
      if (o.ev) set.add(`ev_${o.ev}`);
      for (const v of Object.values(o)) if (typeof v === 'object') walk(v, seen);
    };
    walk(m);
    walk(lv.triggers);
    walk(DIALOGUE);
    walk(lv.npcs);
    for (const i of lv.interactables) if (i.kind === 'socket' && i.only) set.add(`${i.needs}_connected`); // a socket from one year
    const need = new Set();
    const ids = (cond) => [...String(cond).matchAll(/(?<![@\w"'])([a-z_][a-z0-9_]*)/g)].map((x) => x[1]).filter((k) => !['true', 'false'].includes(k));
    for (const e of lv.elements) if (e.when && !e.dress) ids(e.when).forEach((k) => need.add(k));
    for (const i of lv.interactables) if (i.when) ids(i.when).forEach((k) => need.add(k));
    for (const sc of Object.values(m.scenes || {})) if (sc.when) ids(sc.when).forEach((k) => need.add(k));
    ids(m.done).forEach((k) => need.add(k));
    const missing = [...need].filter((k) => !set.has(k));
    assert.deepEqual(missing, [], `${m.key}: nothing sets ${missing}`);
  }
});

// --- the people ------------------------------------------------------------------------------------
test('the NPC roster, with the supplement\'s state model', () => {
  for (const id of ['mira', 'witness', 'sera', 'rook', 'niko', 'anja', 'iven', 'tala', 'jun', 'mara', 'orren', 'child']) {
    const n = NPCS[id];
    assert.ok(n?.want && n.fear && n.temporal?.length && n.barks?.length && n.voice, id);
  }
  const f = new FactStore();
  assert.deepEqual(npcState(f, 'jun'), { trust: 0, knowledge: 0, quest: '' });
  f.set('trust_jun', 1);
  f.set('know_jun', 2);
  f.set('quest_jun', 'active');
  assert.deepEqual(npcState(f, 'jun'), { trust: 1, knowledge: 2, quest: 'active' });
  for (const hook of [JUN_HOOK, WATER_HOOK, MARA_HOOK, IVEN_HOOK]) assert.equal(hook.length, 3);
  for (const a of Object.values(AMBIENT)) assert.ok(a.barks.length >= 3 && a.names.length >= 3);
});

test('quest chains A (Jun) and D (Iven) live in the Prologue, with both outcomes', () => {
  const [m1, , m3] = MISSIONS.prologue;
  const a = m1.scenes.relay_choice.choices;
  assert.deepEqual(a.map((c) => c.intent), ['comfort', 'investigate']);
  assert.ok(a[0].set.jun_line && a[1].set.ev_rook_log, 'save the passengers, or the evidence against Rook');
  assert.ok(m1.scenes.reroute && m1.scenes.relay, 'inspect the relay now, reroute it in the earlier state');
  const d = m3.scenes.iven_terminal.choices;
  assert.ok(d.some((c) => c.set.ev_raw_log) && d.some((c) => c.set.iven_team_saved), 'the raw log, or the trapped team');
  assert.ok(m3.scenes.service_panel && typeof m3.onShift === 'function', 'a past-state panel, a lock that resets on every switch');
  // the main story is completable either way: neither chain is in a done condition
  for (const m of MISSIONS.prologue) assert.ok(!/jun|iven/.test(m.done), m.key);
  // consequences: Jun's passengers clear the Finale's first street; Iven can be the Mission 21 ally
  assert.equal(typeof main.find((x) => x.n === 23).adjust, 'function');
  assert.ok(main.find((x) => x.n === 21).scenes.ally.choices.some((c) => c.set.ally === 'iven'));
});

test('someone absent from a state leaves an echo there', () => {
  const route = LEVELS.find((l) => l.deck.mkey === 'm03').level.npcs.find((n) => n.id === 'iven3');
  assert.deepEqual(route.temporal, ['PRESENT'], 'Iven exists in 2049; in 2026 and 2196 his echo stands in');
  const jun = LEVELS.find((l) => l.deck.mkey === 'm01').level.npcs.find((n) => n.id === 'jun');
  assert.deepEqual(jun.temporal, ['PRESENT'], 'at 8:13 the Jun in the booth is an echo');
  const sera = LEVELS.find((l) => l.deck.mkey === 'm10' && l.s === 1)?.level.npcs.find((n) => n.crew === 'sera');
  if (sera) assert.equal(sera.temporal, undefined, 'a person who is simply here is not an echo');
  for (const id of ['iven', 'jun', 'niko', 'tala', 'witness']) assert.ok(NPCS[id].echo?.length, `${id} has an echo`);
});

// --- three years and REVERSE (OVERHAUL.md §7) ---------------------------------------------------------
const CONDS = ['when', 'done', 'npcWhen', 'echoWhen', 'freeze', 'cond'];
// every object inside a mission (functions are skipped), with the key path that reached it
function walkObj(o, f, seen = new Set(), path = '') {
  if (!o || typeof o !== 'object' || seen.has(o)) return;
  seen.add(o);
  f(o, path);
  for (const [k, v] of Object.entries(o)) if (typeof v === 'object') walkObj(v, f, seen, `${path}.${k}`);
}

test('three years and nothing else: no INVERTED, no gravity, no ceiling in any mission or level', () => {
  assert.equal(LV.states.length, 3);
  assert.ok(!('INVERTED' in LV.labels) && !Object.values(LV.labels).includes('INVERTED'));
  for (const s of Object.keys(LV.engineOptions().stateEffects)) assert.ok(LV.states.includes(s));
  for (const m of Object.values(MISSIONS).flat()) {
    assert.ok(m.states.every((s) => LV.states.includes(s)), `${m.key} states ${m.states}`);
    for (const [k, v] of Object.entries(m.labels || {})) assert.ok(LV.states.includes(k) && !/INVERT/.test(v), `${m.key} label ${k}: ${v}`);
    assert.ok(!(m.mechs || []).includes('gravity'), `${m.key} mechs ${m.mechs}`);
    walkObj(m, (o, path) => {
      for (const k of CONDS) if (typeof o[k] === 'string') assert.ok(!/INVERTED|gravity|zeroG/.test(o[k]), `${m.key}${path}.${k}: ${o[k]}`);
      if (Array.isArray(o.states)) assert.ok(o.states.every((s) => LV.states.includes(s)), `${m.key}${path}.states`);
      if (Array.isArray(o.effects)) assert.ok(!o.effects.some((e) => /gravity|zeroG/.test(e)), `${m.key}${path}.effects`);
    });
  }
  for (const ch of Object.keys(MISSIONS)) {
    const rt = Object.assign(Object.create(LastVersion.prototype), { g: { engine: engine(), facts: new FactStore() }, def: LV });
    const story = rt.makeStory(ch);
    assert.ok(!story.mechs.includes('gravity'), `${ch}: the story's mechanics`);
    for (const d of story.decks) assert.ok(d.mechs.length && d.mechs.every((k) => ['echo', 'sentinel', 'time'].includes(k)), `${d.mkey}: ${d.mechs}`);
  }
  let checked = 0;
  for (const { deck, s, level } of LEVELS) {
    const here = `${deck.mkey}/${s}`;
    assert.ok(!(level.effects || []).some((e) => /gravity|zeroG/.test(e)), `${here}: effects ${level.effects}`);
    for (const list of [level.elements, level.texts, level.interactables, level.npcs, level.items, level.triggers]) {
      for (const x of list || []) for (const k of CONDS) if (typeof x[k] === 'string') assert.ok(!/INVERTED/.test(x[k]), `${here}: ${k} ${x[k]}`);
    }
    for (const rid of level.order) {
      const room = level.rooms[rid];
      for (const st of room.states || []) assert.ok(LV.states.includes(st), `${here} ${rid}: ${st}`);
      for (const c of room.challenges || []) {
        checked++;
        assert.ok(!/gravity|ceiling/.test(c.key), `${here} ${rid}: challenge ${c.key}`);
        assert.ok(!/gravity|zeroG/.test(c.effect || ''), `${here} ${rid}: ${c.key} needs ${c.effect}`);
        for (const t of c.hints || []) assert.ok(!/ceiling|dome|invert/i.test(t), `${here}: hint "${t}"`);
      }
      for (const w of [...(room.route || []), ...(room.keyRoute || [])]) if (w.state) assert.ok(LV.states.includes(w.state), `${here} ${rid}: route ${w.state}`);
    }
  }
  assert.ok(checked > 150, `${checked} challenges`);
});

test('no laws, no law tokens, no memory keys, and Kai thinks without ceilings or domes', () => {
  const e = engine();
  assert.equal(e.slots, 0);
  assert.equal(e.unlocked, 0);
  assert.deepEqual(e.laws, []);
  assert.deepEqual(LV.engineOptions().laws, []);
  for (const { deck, s, level } of LEVELS) {
    assert.deepEqual(level.tokens, [], `${deck.mkey}/${s}: law tokens`);
    for (const it of level.items) assert.ok(!/MEMORY KEY/i.test(it.label || ''), `${deck.mkey}/${s}: ${it.label}`);
    for (const it of level.items) if (/KEY/.test(it.label || '') && it.echo) assert.match(it.label, /\(\d{4}\)$/, 'a key from the past says its year');
  }
  // the hints come in two tiers of sets: before REVERSE, and once it is Kai's
  for (const set of [HINTS, HINTS_REVERSE]) {
    for (const [k, tiers] of Object.entries(set)) {
      assert.ok(!/gravity|ceiling/.test(k), `hint key ${k}`);
      assert.equal(tiers.length, 3, k);
      for (const t of tiers) assert.ok(!/ceiling|dome|invert/i.test(t), `${k}: "${t}"`);
    }
  }
  for (const k of Object.keys(HINTS_REVERSE)) assert.ok(HINTS[k], `${k} has a first-tier set too`);
  // nothing spoken tells the player to invert, flip gravity or walk the ceiling
  for (const [, t] of allLines()) assert.ok(!/switch to inverted|walk (on |across )?the ceiling|gravity flip|invert the district/i.test(t), t);
});

// a stand-in for DeckWorld: the edition's moving colliders go into its temps
const fakeEnv = () => ({ root: new THREE.Group(), deckWorld: { temps: [], refresh() { this.refreshed = (this.refreshed || 0) + 1; } } });
const run = (p, secs, ctx = { time: 0, player: null }) => {
  const ev = [];
  for (let t = 0; t < secs; t += 1 / 30) { ctx.time += 1 / 30; ev.push(...p.step(1 / 30, ctx)); }
  return ev;
};
const M11 = () => LEVELS.filter((l) => l.deck.mkey === 'm11');
const procOf = (id) => {
  for (const l of M11()) {
    const p = l.level.processes.find((x) => x.id === id);
    if (p) return { rec: p, level: l.level, s: l.s, deck: l.deck };
  }
  return null;
};

test('every REVERSE process record is valid', () => {
  let n = 0;
  for (const { deck, s, level } of LEVELS) {
    const here = `${deck.mkey}/${s}`;
    assert.ok(level.processes.length <= MAX_PROCESSES, `${here}: ${level.processes.length} processes`);
    assert.equal(new Set(level.processes.map((p) => p.id)).size, level.processes.length, `${here}: process ids are unique`);
    for (const rec of level.processes) {
      n++;
      assert.deepEqual(checkRecord(rec, level), [], `${here}: ${rec.id}`); // aim and origin boxes inside its room
      assert.ok(rec.reach > 0 && WEIGHTS.includes(rec.weight), `${here}: ${rec.id} reach ${rec.reach} weight ${rec.weight}`);
      assert.ok(rec.parts.length <= MAX_PARTS, `${here}: ${rec.id} parts`);
      assert.ok(KINDS[rec.kind], `${here}: ${rec.id} kind ${rec.kind}`);
      assert.equal(rec.fact, `rev_${rec.id}`);
      assert.equal(rec.done, `inv_${rec.id}_done`);
      assert.ok(['held', 'settled'].includes(rec.settle), `${rec.id}: settle ${rec.settle}`);
      if (rec.when) compileCondition(rec.when);
      if (rec.kind === 'refusal') assert.ok(['NOT A PROCESS', 'A MEMORY'].includes(rec.refuse) && rec.line, `${rec.id}: a refusal says why`);
      else assert.ok(rec.label && rec.hints?.length === 3, `${rec.id}: a label and three hints`);
      for (const p of rec.parts) for (const q of [p.rest.q, p.origin.q]) assert.ok(Math.abs(Math.hypot(...q) - 1) < 1e-3, `${rec.id}/${p.name}: a unit quaternion`);
    }
  }
  assert.ok(n >= 6, `${n} processes`);
  // the ten kinds of §7.6 (and the refusal), each builds, reverses, holds and lets go headlessly
  assert.deepEqual(Object.keys(KINDS).filter((k) => k !== 'refusal'), ['collapse', 'fall', 'flow', 'burn', 'lock', 'ink', 'recording', 'patrol', 'mechanism', 'projectile']);
  const level = { rooms: { r: { bounds: [[-10, -1, -30, 10, 10, 0]], spawn: [0, 0.86, -1.6, 0] } }, order: ['r'] };
  const anchor = { pos: [0, 0, -10], yaw: 0, room: 'r' };
  for (const kind of Object.keys(KINDS)) {
    const env = fakeEnv();
    const rec = makeRecord({ id: kind, kind, parts: [{ shape: 'box', size: [1, 0.3, 1], at: [0, 1.5, 0], rest: { at: [0.4, 0.15, 1], rot: [0.3, 0.2, 0] }, solid: true }], layers: ['NEW', 'OLD'], hints: ['a', 'b', 'c'] }, anchor, level);
    assert.deepEqual(checkRecord(rec, level), [], kind);
    const p = new Process(rec, env);
    p.reverse();
    run(p, 3);
    p.release();
    run(p, 4);
    p.dispose();
    assert.equal(env.deckWorld.temps.length, 0, `${kind}: nothing left in temps`);
  }
});

test('REVERSE is never required before Mission 11, and the menu primes it from Act III', () => {
  const late = /\b(rev_\w+|inv_\w+|has_inversion)\b/;
  for (const m of Object.values(MISSIONS).flat()) {
    const n = typeof m.n === 'number' ? m.n : 99; // the case files come after the Finale
    if (n >= 11) continue;
    assert.ok(!(m.processes || []).some((p) => p.required), `Mission ${m.n} requires a REVERSE`);
    walkObj(m, (o, path) => {
      for (const k of CONDS) if (typeof o[k] === 'string') assert.ok(!late.test(o[k]), `Mission ${m.n}${path}.${k} waits on REVERSE: ${o[k]}`);
      if (o.kind === 'invert') assert.fail(`Mission ${m.n}${path}: an invert thread before Mission 11`);
    });
  }
  for (const { deck, level } of LEVELS) if (deck.n < 11) assert.ok(!level.processes.some((p) => p.required), deck.mkey);
  // every required REVERSE use sits at Mission 11 or later
  for (const { deck, level } of LEVELS) for (const p of level.processes) if (p.required) assert.ok(typeof deck.n !== 'number' || deck.n >= 11, `${deck.mkey}: ${p.id}`);
  const primed = (ch) => ORDER.slice(0, ORDER.indexOf(ch) + 1).flatMap((c) => PRIMES[c]).some((k) => (Array.isArray(k) ? k[0] : k) === 'has_inversion');
  assert.deepEqual(ORDER.map(primed), [false, false, false, true, true, true], 'Act II reaches REVERSE by playing Mission 11');
  assert.ok(PRIMES.cases.includes('has_inversion'));
  const cap = (ch) => Math.max(0, ...ORDER.slice(0, ORDER.indexOf(ch) + 1).flatMap((c) => PRIMES[c]).filter((k) => Array.isArray(k) && k[0] === 'inv_cap').map((k) => k[1]));
  assert.deepEqual([cap('act3'), cap('act4'), cap('finale')], [10, 12, 12], 'the charge cap: 10 s after Mission 13, 12 s after Mission 18');
});

test('Mission 11 teaches REVERSE: three tutorial objects, the charred file, a refusal, and a lock with three clues', () => {
  const m11 = main.find((m) => m.n === 11);
  assert.deepEqual(m11.states, ['PRESENT', 'PAST'], 'the hospital has two years; its reversed wards are not a year');
  for (const l of M11()) assert.ok(l.level.reversedRooms.length >= 1, `sector ${l.s} has a reversed ward`);
  // the unlock comes in the records quarter, from the file that keeps un-burning
  const file = procOf('charredFile');
  assert.equal(file.s, 1, 'records');
  assert.ok(m11.rules.some((r) => r.then === 'unlock' && /!has_inversion/.test(r.when)) && typeof m11.fx.unlock === 'function');
  assert.ok(file.level.triggers.some((t) => t.set?.m11_saw_file && t.room === file.rec.room), 'watching the file catches the rhythm');
  for (const [id, kind] of [['tray', 'fall'], ['waterGlass', 'flow'], ['burntDoor', 'burn']]) {
    const p = procOf(id);
    assert.ok(p && p.rec.kind === kind && p.s === 1 && p.rec.room === file.rec.room, `the tutorial ${id} (${kind}) is in the records hall`);
  }
  // the file is readable only while it is held, and says who admitted her
  assert.equal(file.rec.kind, 'burn');
  assert.equal(file.rec.weight, 0.5);
  assert.ok(file.rec.required && file.rec.ambient, 'it un-burns on the ward\'s own rhythm, too short to read');
  assert.equal(m11.scenes.charredFile.when, 'rev_charredFile');
  assert.ok(m11.scenes.charredFile.lines.some((l) => l.text.includes('ADMITTED BY: K. VAREN')));
  assert.ok(file.level.interactables.some((i) => i.scene === 'charredFile'));
  assert.ok(file.level.elements.some((e) => e.id === 'door_m11records' && e.when === '!ev_admitted_by'), 'the way on waits for the file');
  // R6: the flatline monitor is not a process
  const mon = procOf('flatlineMonitor');
  assert.equal(mon.rec.refuse, 'NOT A PROCESS');
  assert.equal(mon.rec.line, 'Not a person. It won\'t take a person.');
  // the lock: four bolts fitted RING, BAR, STAR, CRESCENT; it opens Ward 32
  assert.deepEqual(LOCK_ORDER, ['RING', 'BAR', 'STAR', 'CRESCENT']);
  const lock = procOf('m11lock');
  assert.equal(lock.s, 2);
  assert.equal(lock.rec.kind, 'lock');
  assert.equal(lock.rec.settle, 'settled');
  assert.ok(lock.rec.required);
  assert.deepEqual([...lock.rec.parts].sort((a, b) => a.order - b.order).map((p) => p.name), LOCK_ORDER);
  assert.equal(m11.scenes.lock.when, 'inv_m11lock_done', 'the lock scene waits for the settled lock');
  assert.ok(lock.level.elements.some((e) => e.id === 'door_m11ward32' && e.when === '!inv_m11lock_done'), 'Ward 32\'s door opens when the lock is settled');
  // three clues, each listing the order: the 2026 tag and the chime as fitted, the twin lock as it comes apart
  assert.equal(m11.lockClues.length, 3);
  const bolts = (lines) => [...lines.map((l) => l.text).join(' ').matchAll(/\b(RING|BAR|STAR|CRESCENT)\b/g)].map((x) => x[1]);
  for (const c of m11.lockClues) {
    const sc = m11.scenes[c.scene];
    assert.ok(sc, c.scene);
    assert.deepEqual(bolts(sc.lines), c.order === 'fit' ? LOCK_ORDER : [...LOCK_ORDER].reverse(), `${c.scene} lists the order`);
    assert.ok(lock.level.interactables.some((i) => i.scene === c.scene), `${c.scene} can be found`);
  }
  assert.equal(m11.scenes.maintTag.when, '@PAST', 'the maintenance tag is readable in 2026');
  assert.ok(lock.level.texts.some((t) => t.when === '@PAST' && t.text === 'RING · BAR · STAR · CRESCENT'), 'and written on it');
});

test('a lock comes apart last-fitted first, jams otherwise, and a settled bolt survives a save', () => {
  const { rec } = procOf('m11lock');
  const env = fakeEnv();
  const p = new Process(rec, env);
  const idx = (name) => rec.parts.findIndex((x) => x.name === name);
  assert.equal(p.tryPart(idx('RING')), 'jam', 'the first bolt fitted will not come out first');
  const jam = run(p, 1);
  assert.ok(jam.some((e) => e.type === 'clack') && p.partOut.every((v) => v === false), 'it turns half back and snaps home');
  const order = [];
  for (const name of [...LOCK_ORDER].reverse()) {
    assert.equal(p.tryPart(idx(name)), 'out', `${name} is the last one still in`);
    for (const e of run(p, 1.5)) if (e.type === 'part') order.push(rec.parts[e.i].name);
    if (name === 'CRESCENT') assert.equal(p.tryPart(idx('CRESCENT')), 'none', 'nothing pushes a bolt back in');
  }
  assert.deepEqual(order, ['CRESCENT', 'STAR', 'BAR', 'RING']);
  assert.ok(p.settled);
  // the save keeps a bolt that is out (deckWorld.flags inv_m11lock_<NAME>), and the next one is STAR
  const q = new Process(rec, fakeEnv());
  q.restore({ inv_m11lock_CRESCENT: true });
  assert.deepEqual(q.partOut, rec.parts.map((x) => x.name === 'CRESCENT'));
  assert.equal(q.tryPart(idx('CRESCENT')), 'none');
  assert.equal(q.tryPart(idx('STAR')), 'out');
  const r = new Process(rec, fakeEnv());
  r.restore(Object.fromEntries(LOCK_ORDER.map((n) => [`inv_m11lock_${n}`, true])));
  assert.ok(r.settled, 'a lock saved apart stays apart');
  [p, q, r].forEach((x) => x.dispose());
});

test('moving colliders: the edition\'s temps entries never expire and the edition removes them', () => {
  const e = colliderEntry({ min: [0, 0, 0], max: [1, 1, 1] });
  assert.equal(e.t, Infinity, 'DeckWorld.update drops (and disposes) an entry only at t <= 0');
  assert.ok(e.mesh && !e.mesh.geometry, 'an empty Object3D: expiry would throw on it, so it must never come');
  let t = e.t;
  for (let i = 0; i < 1e5; i++) t -= 0.25;
  assert.ok(t > 0);
  // a held bridge: six pieces, six solid entries, all t: Infinity; let go, they leave with their pieces
  const level = { rooms: { r: { bounds: [[-10, -6, -30, 10, 10, 0]], spawn: [0, 0.86, -1.6, 0] } }, order: ['r'] };
  const env = fakeEnv();
  const bridge = new Process(makeRecord({ id: 'bridge', kind: 'collapse', span: { from: [-2, 2, -5], to: [-2, 2, -15], pieces: 6 }, hints: ['a', 'b', 'c'] }, { pos: [0, 0, -5], yaw: 0, room: 'r' }, level), env);
  assert.equal(env.deckWorld.temps.length, 0, 'rubble is not solid');
  // at rest it is one mesh with one material (DeckWorld.dispose reads material.map: never an array)
  for (const p of [bridge, new Process(procOf('tray').rec, fakeEnv())]) {
    assert.ok(p.merged && p.merged.visible, `${p.rec.id}: merged at rest`);
    p.group.traverse((o) => assert.ok(!Array.isArray(o.material), `${p.rec.id}: a single material`));
  }
  bridge.reverse();
  const ev = run(bridge, 2);
  assert.ok(ev.some((x) => x.type === 'origin'));
  assert.equal(env.deckWorld.temps.length, 6);
  assert.ok(env.deckWorld.temps.every((x) => x.t === Infinity && x.lvInv));
  bridge.release();
  run(bridge, 3);
  assert.equal(env.deckWorld.temps.length, 0, 'released, every piece falls and takes its collider');
  bridge.reverse();
  run(bridge, 2);
  bridge.dispose();
  assert.equal(env.deckWorld.temps.length, 0, 'unloaded, the edition takes its own entries out');
  // and the only thing the edition ever pushes into temps is a colliderEntry
  const src = ['processes.js', 'inversion.js'].map((f) => fs.readFileSync(new URL(`../game/js/editions/lastversion/${f}`, import.meta.url), 'utf8')).join('\n');
  const pushes = [...src.matchAll(/temps\.push\(([^)]*)\)/g)].map((m) => m[1]);
  assert.deepEqual(pushes, ['e'], 'one push, of the entry colliderEntry made');
  assert.ok(/e = this\.entries\[i\] = colliderEntry\(b\);\s*dw\.temps\.push\(e\)/.test(src));
  assert.ok(!/\.addTemp\(/.test(src), 'never DeckWorld.addTemp (its entries expire)');
});

test('the REVERSE rules, refusals and lines are the spec\'s, and recorded', () => {
  assert.deepEqual(RULES.map(([k]) => k), ['R1', 'R2', 'R3', 'R4', 'R5', 'R6']);
  assert.equal(RULES[0][1], 'One thing at a time.');
  assert.equal(RULES[5][1], 'Never a person, never a memory.');
  assert.equal(INV_LINES.refuse, 'Not now. The Chronolith can\'t hold anything back.');
  assert.equal(INV_LINES.unlock, 'The ward isn\'t broken. It\'s being held… I can hold one thing. Only one, and only for a while.');
  assert.equal(INV_LINES.bolt, 'Nothing pushes a bolt back in.');
  assert.equal(INV_LINES.intercom, 'Temporal discontinuity.');
  const lines = allLines();
  const has = (who, text) => lines.some(([w, t]) => w === who && t === text);
  assert.ok(has('KAI', INV_LINES.unlock) && has('KAI', INV_LINES.refuse) && has('NONE', INV_LINES.intercom) && has('NONE', INV_LINES.watch));
  for (const [, t] of RULES) assert.ok(has('NONE', t), t);
  for (const p of main.find((m) => m.n === 11).processes) for (const h of p.hints || []) assert.ok(has('KAI', h), h);
});
