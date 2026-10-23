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
import { ENDINGS, LOCK_ORDER, CASE_FILES, CASE_STATES, caseState } from '../game/js/editions/lastversion/acts.js';
import { hazardAt, musicGain } from '../game/js/editions/lastversion/act2.js';
import { NPCS, DIALOGUE, AMBIENT, npcState, JUN_HOOK, WATER_HOOK, MARA_HOOK, IVEN_HOOK } from '../game/js/editions/lastversion/npcs.js';
import { PLACES, signature, quartersOf } from '../game/js/editions/lastversion/places/index.js';
import { SKIES } from '../game/js/editions/lastversion/places/years.js';
import { MATS, SURFACES } from '../game/js/editions/lastversion/places/materials.js';
import { KIT_NAMES } from '../game/js/editions/lastversion/places/kits.js';
import { STYLES } from '../game/js/editions/lastversion/places/styles.js';
import { Player } from '../game/js/entities/Player.js';
import { LV_MODELS, SHARED_MODELS, MANIFEST, CHAPTER_CAST, COMMON, sexOf, isChild, castOf } from '../game/js/editions/lastversion/casting.js';
import { WARDROBE, hasVariant, packRules } from '../game/js/editions/lastversion/wardrobe.js';
import { ERAS, EXCEPTIONS, ANCIENT_WOMEN, AMBIENT_CAST, eraModels, MAX_PEOPLE, MET, CAP } from '../game/js/editions/lastversion/crowds.js';
import { M01 } from '../game/js/editions/lastversion/prologue.js';
import { WATCHERS, HUMAN, watcherModels, kindsOf } from '../game/js/editions/lastversion/watchers.js';
import { spokenLines, buildLevels, voiceOf, lexicon, GROUPS, chapterCardLines, missionCardLines, endingLines, POSTCREDIT, choiceLine, numberWords } from '../game/js/editions/lastversion/voicelines.js';
import { voicePieces } from '../game/js/audio/voiceKey.js';
import { KINDS as THREAD_KINDS, MINUTES, threadsOf, sidesOf, quartersOf as threadQuarters, factOf, isRewritten, estimate, doneCond, sideState, isDone, roomAt } from '../game/js/editions/lastversion/Threads.js';
import { QUESTIONS, CLUES, CONSEQUENCES, PREVIOUSLY, EPILOGUE, MISSION_ORDER, missionIndex } from '../game/js/editions/lastversion/ledger.js';
import { SAVE_FORMAT } from '../game/js/editions/lastversion/Runtime.js';

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

// tools/voice-pack.py's VOICES: { speaker: [spec, speed, pitch] } (a spec may blend voices: 'a*w+b*w')
const VOICES = () => {
  const py = fs.readFileSync(new URL('../tools/voice-pack.py', import.meta.url), 'utf8');
  const out = {};
  for (const m of py.matchAll(/'(\w+)': \('([\w*.+]+)', ([\d.]+), ([\d.]+)\)/g)) out[m[1]] = [m[2], +m[3], +m[4]];
  return out;
};
const baseOf = (spec) => spec.split('+').map((p) => p.split('*')).sort((a, b) => (+b[1] || 1) - (+a[1] || 1))[0][0];

test('every speaker has a name, a colour and its own voice', () => {
  const need = ['KAI', 'MIRA', 'WITNESS', 'ROOK', 'NIKO', 'SERA', 'ANJA', 'IVEN', 'JUN', 'TALA', 'MARA', 'ORREN', 'CHILD'];
  for (const k of need) assert.ok(LV.speakers[k]?.name && LV.speakers[k]?.color, k);
  const voice = VOICES();
  for (const k of [...need, 'NONE', 'PA']) assert.ok(voice[k], `tools/voice-pack.py VOICES has ${k}`);
  const ids = need.map((k) => voice[k].join('|'));
  assert.equal(new Set(ids).size, ids.length, `each speaker a distinct voice: ${ids}`);
  assert.ok(/^[ab]m_/.test(baseOf(voice.KAI[0])), 'Kai is a male voice');
  const lines = allLines();
  assert.ok(lines.length > 500, `${lines.length} lines`);
  const who = new Set(lines.map(([w]) => w));
  for (const w of who) assert.ok(LV.speakers[w] || ['NONE', 'CREW', 'VOICE', 'YOU'].includes(w), `unknown speaker ${w}`);
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
  // the case files: quest chains B and C kept at their old index (A and D are in the Prologue), then the ten replays
  assert.deepEqual(MISSIONS.cases.map((m) => m.key), ['c_b', 'c_c', 'c_child', 'c_train', 'c_letter', 'c_house', 'c_signal', 'c_names', 'c_debt', 'c_ninth', 'c_garden', 'c_record']);
  assert.deepEqual(MISSIONS.cases.slice(0, 2).map((m) => m.n), ['B', 'C']);
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
const SRC = ['prologue.js', 'acts.js', 'act1.js', 'act2.js'].map((f) => fs.readFileSync(new URL(`../game/js/editions/lastversion/${f}`, import.meta.url), 'utf8').replace(/\\'/g, "'")).join('\n');
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
  assert.ok(ally.some((c) => c.when === '!ally' && c.set?.ally === 'none'), 'an ally is never required: going alone is always offered');
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
  assert.ok(sectors >= main.length, `${sectors} sectors`); // (a mission rewritten as one map is one sector)
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
  assert.ok(rooms >= 25, `${rooms} challenges checked`); // (the places' crossings, in every mission: since U7 most are one load)
});

test('every level is a place, and any route a level carries only uses states its room was authored with', () => {
  let steps = 0;
  for (const { deck, s, level } of LEVELS) {
    assert.ok(level.place, `${deck.mkey}/${s}: built from its place spec, not a generator`);
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
  // (the generators' routes went with them in U3: a route a level still carries is checked above)
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
    const set = new Set(['mira_gone', 'zero_second', 'after_zero', 'has_chronolith', 'cells_1', 'cells_2', 'cells_3', 'unit_down', 'crossed', 'open_control', 'beat_done', 'quest_jun', 'quest_iven',
      'first_cycle', 'fracture_done', 'wrist_cut', 'voice_heard']);
    // (set by the thread engine: each thread's own fact, and what a scene shows while it plays)
    for (const t of threadsOf({ ...m, mkey: m.key })) set.add(factOf({ ...m, mkey: m.key }, t));
    const add = (o) => o && Object.keys(o).forEach((k) => set.add(k));
    texts(m); // (walk)
    const walk = (o, seen = new Set()) => {
      if (!o || typeof o !== 'object' || seen.has(o)) return;
      seen.add(o);
      if (o.set && typeof o.set === 'object') add(o.set);
      if (o.ev) set.add(`ev_${o.ev}`);
      if (typeof o.show === 'string') set.add(o.show);
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
  // (Mission 10 is one map now: Sera at her skiff, in 2049 and 2026 both, is simply here)
  const sera = LEVELS.find((l) => l.deck.mkey === 'm10').level.npcs.find((n) => n.crew === 'sera');
  assert.ok(sera, 'Sera waits at the skiff');
  assert.equal(sera.temporal, undefined, 'a person who is simply here is not an echo');
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
  assert.ok(checked >= 25, `${checked} challenges`);
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
// (since U7 Mission 11 is one map: a process belongs to the quarter whose area holds its landmark)
const inQuarter = (p, qi) => { const [x0, z0, x1, z1] = p.level.quarters[qi].area; const [x, , z] = p.rec.anchor.pos; return x >= x0 && x <= x1 && z >= z0 && z <= z1; };
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
      if (rec.arm) compileCondition(rec.arm); // (in sight, not yet the story's to reverse: M18's slabs)
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
  assert.ok(PRIMES.cases.some((k) => Array.isArray(k) && k[0] === 'inv_cap' && k[1] === 12), 'the case files come after the Finale: 12 s');
  const cap = (ch) => Math.max(0, ...ORDER.slice(0, ORDER.indexOf(ch) + 1).flatMap((c) => PRIMES[c]).filter((k) => Array.isArray(k) && k[0] === 'inv_cap').map((k) => k[1]));
  assert.deepEqual([cap('act3'), cap('act4'), cap('finale')], [10, 12, 12], 'the charge cap: 10 s after Mission 13, 12 s after Mission 18');
});

test('Mission 11 teaches REVERSE: three tutorial objects, the charred file, a refusal, and a lock with three clues', () => {
  const m11 = main.find((m) => m.n === 11);
  assert.deepEqual(m11.states, ['PRESENT', 'PAST'], 'the hospital has two years; its reversed wards are not a year');
  for (const l of M11()) assert.ok(l.level.reversedRooms.length >= 3, 'the colonnade, the annex and the twin ward run backwards');
  // the unlock comes in the records quarter, from the file that keeps un-burning
  const file = procOf('charredFile');
  assert.ok(inQuarter(file, 1), 'records');
  assert.ok(m11.rules.some((r) => r.then === 'unlock' && /!has_inversion/.test(r.when)) && typeof m11.fx.unlock === 'function');
  assert.ok(file.level.triggers.some((t) => t.set?.m11_saw_file && t.room === file.rec.room), 'watching the file catches the rhythm');
  for (const [id, kind] of [['tray', 'fall'], ['waterGlass', 'flow'], ['burntDoor', 'burn']]) {
    const p = procOf(id);
    assert.ok(p && p.rec.kind === kind && inQuarter(p, 1) && p.rec.room === file.rec.room, `the tutorial ${id} (${kind}) is in the records hall`);
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
  assert.ok(inQuarter(lock, 2), 'Ward 32');
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
  // a process out of its year (`when` false) is not stepped: nothing of it stays solid there, and a hold or a
  // release under way ends at once (no invisible bridge in the other years, no fall resumed on the way back)
  const yearBridge = () => {
    const e = fakeEnv();
    return [e, new Process(makeRecord({ id: 'yb', kind: 'collapse', when: '@FUTURE', span: { from: [-2, 2, -5], to: [-2, 2, -15], pieces: 6 }, hints: ['a', 'b', 'c'] }, { pos: [0, 0, -5], yaw: 0, room: 'r' }, level), e)];
  };
  for (const how of ['held', 'creaking']) {
    const [e, b] = yearBridge();
    b.reverse();
    run(b, 2);
    assert.equal(e.deckWorld.temps.length, 6, `${how}: seated`);
    if (how === 'creaking') {
      b.release();
      run(b, 0.2);
      assert.ok(b.creakT > 0 && e.deckWorld.temps.length === 6, 'the creak before the fall');
    }
    b.setVisible(false);
    assert.equal(e.deckWorld.temps.length, 0, `${how}: out of its year, nothing of it is solid`);
    assert.deepEqual([b.P, b.dir, b.creakT, b.hiddenByWhen, b.group.visible], [0, 0, 0, true, false], `${how}: it is back at rest`);
    b.setVisible(true);
    run(b, 1);
    assert.equal(e.deckWorld.temps.length, 0, `${how}: back in its year it is rubble`);
    b.reverse();
    run(b, 2);
    assert.equal(e.deckWorld.temps.length, 6, `${how}: and can be held again`);
    b.dispose();
  }
  // a lift car is solid all along its shaft, in its own year only
  {
    const e = fakeEnv();
    const car = new Process(makeRecord({ id: 'car', kind: 'fall', when: '@FUTURE', parts: [{ shape: 'box', size: [2, 0.3, 2], at: [0, 4, 0], rest: { at: [0, 0.15, 0] }, solid: true }], hints: ['a', 'b', 'c'] }, { pos: [0, 0, -10], yaw: 0, room: 'r' }, level), e);
    assert.equal(e.deckWorld.temps.length, 1);
    car.setVisible(false);
    car.setVisible(false);
    assert.equal(e.deckWorld.temps.length, 0, 'not in the other years');
    car.setVisible(true);
    run(car, 0.1);
    assert.equal(e.deckWorld.temps.length, 1, 'back in its year');
    car.dispose();
    assert.equal(e.deckWorld.temps.length, 0);
  }
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
  assert.ok(has('KAI', INV_LINES.unlock) && has('KAI', INV_LINES.refuse) && has('PA', INV_LINES.intercom) && has('NONE', INV_LINES.watch));
  for (const [, t] of RULES) assert.ok(has('NONE', t), t);
  for (const p of main.find((m) => m.n === 11).processes) for (const h of p.hints || []) assert.ok(has('KAI', h), h);
});

// --- open-sky places (OVERHAUL.md §4; U2: the Prologue and Act I; U3: Acts II-IV, the Finale and the two cases) -------
// what each mission sheet (§5) names: its place, its quarters and every landmark
const SHEETS = {
  m01: { place: 'rain_south', quarters: ['HOME & MARKET', 'TRANSIT PLAZA & CHECKPOINT', 'LINE 41'],
    landmarks: 'door4B photoByDoor marketLane toyChild floristStall noodleAlley laundromat pocketPark puddle pigeonLedge plazaClock tramStop photoBooth rookCall checkpointBooth checkpointQueue towpath fireEscape roofTerrace platform junBooth relay41B maintGate41B boardSign viaduct carriageDoor busDepot staffGate' },
  m02: { place: 'helix', quarters: ['SECURITY', 'THE DARK CORRIDOR', 'POWER', 'CONDUIT & ARCHIVE', 'THE CHAMBER'],
    landmarks: 'lobby lobbyIntercom sitePrint linPeg cameraRoom westGallery linDesk plantTerrace cellA cellB cellC ivenPost staffLounge skybridge conduit readingRoom passDrawer liftAtrium chamberDoor chamber' },
  m03: { place: 'helix', quarters: ['THE CHAMBER', 'TEMPORAL LAB', 'THE DIG', 'MACHINE HALL', 'CONTROL'],
    landmarks: 'chamber ringTouch temporalLab cableSocket powerPanel excavationHut excavationLog thermosER footprints polaroid machineHall lift2196 plaque2196 serviceYard controlRoom keycard controlPanel' },
  m04: { place: 'valley_upper', quarters: ['THE FIRST FIRE', 'THE WATER STEPS', 'THE RING'],
    landmarks: 'blanketHouse firePit granary lintelHouse pictoFire pictoWater pictoRing tellingStone waterSteps cistern stele grainStore ring elderSeat underStair underChamber panels card childRingCord' },
  m05: { place: 'valley_river', quarters: ['THE HEAD-STONE', 'THE RETAINING WALL', 'THE PRESSURE GATE', 'THE UPPER GORGE'],
    landmarks: 'weir millRace headStone waterMill wall80 wallBrace stiltHouses jetties tallyWall coldHearths muralWall gateTower basin buriedMachine cairnSite dryChannel gate1 gate2 gate3 aqueduct muralCliff' },
  m06: { place: 'oldtown', quarters: ['SHOP FLOOR & CANAL STREET', 'THE GALLERIES', 'THE CLOCK ROOM / ROOF'],
    landmarks: 'cellarStair shopFloor repeatArm canalBridge shopWindows lightWell galleries floorboards hiddenStair ezraBench clockRoom clock2026 clock2049 clock2196 recordingCase roofTerrace clockFace loopSpring' },
  m07: { place: 'observatory', quarters: ['THE LOWER RING', 'THE INSTRUMENT STAIR', 'THE OUTER RING'],
    landmarks: 'gnomon lowerRing astronomerRoofs nikoGuide rotatingPlatforms starTube datesRing scavengerCamp cache outerRingWalk horizonRing tinSpot' },
  m08: { place: 'helix_v17', quarters: ['STAFF RECORDS', 'THE CORRUPTED LOG', 'THE LAST TEN MINUTES'],
    landmarks: 'receptionDesk riverCourt printCase photoWall recordsTerminal linDesk staffDoor riverWall serverRoom2026 securityOffice rookOffice reconstruction containmentCube versionTerminal groupPhoto' },
  // (U3) Acts II-IV and the Finale
  m09: { place: 'northbank', quarters: ['START', 'CLOCK A — OBSERVATION', 'CLOCK B — THE ENEMY ROUTE', 'CLOCK C — THE LOOP TRIGGER', 'THE CONTROL TOWER'],
    landmarks: 'ferryQuay marketLoggia clockA funicularStation funicularTrack orderBoard clockB cathedralSteps clockC loopEdge transmitter towerBase towerTop skyways' },
  m10: { place: 'dam', quarters: ['THE DETENTION BLOCK', 'POWER SYSTEMS', 'THE TESTING CHAMBER', 'THE YARD'],
    landmarks: 'cell galleries guardPost intakeRecords switch2049 switch2026 crestYard directorOffice turbineHall projector loopCells spillwayTunnel gorgeFloor seraSkiff' },
  m11: { place: 'hospital', quarters: ['TRIAGE & THE QUIET COLONNADE', 'RECORDS', 'WARD 32'],
    landmarks: 'atrium triage discontinuityCourt quietColonnade gurneyRun glassWindow ivStand musicBox youngKaiBench recordsHall ledger2026 tray waterGlass burntDoor charredFile flatlineMonitor photoBoard intercomRoom odileStation twinLock maintTag ward32Door ward32 roofGarden' },
  m12: { place: 'helix', quarters: ['THE CHASE — 2049', 'THE CORRIDOR THAT WAS — 2026', 'THE RUIN — 2196', 'THE SECOND CHAMBER'],
    landmarks: 'northRoofs plantDecks skybridgeN glassPanes gangway2026 lunchRoom2026 bouquet collapsedStair sinkTerraces fallenBeam secondRing fractureExit' },
  m13: { place: 'warport', quarters: ['THE BATTLEFIELD', 'THE THREE DEVICES', 'THE STABILIZER'],
    landmarks: 'quayTrench containerCanyon fieldOrders shellZone batteryA batteryB listenersRoute deviceRail deviceCrane deviceCrater silos stabilizer frozenBlock rollCall burialSite' },
  m14: { place: 'drowned', quarters: ['THE OVERGROWN TOWERS', 'THE TRANSIT LINE', 'THE MEMORIAL'],
    landmarks: 'arrivalPlatform partsList bankTower liftCar roofGarden fallenTower viaduct transitBridge lowWaterPath antenna stackedStones unstableZones memorial flowers seraSchool seraSteps gardenChannel mossPrints kaiStatue' },
  m15: { place: 'lockcity', quarters: ['THE STATION', 'THE SCHOOL & MARKET', 'THE ARCHIVE / THE LOCK'],
    landmarks: 'northGate railHalt departureBoard evacTrain school register market floodLine pressTower archiveA archiveB card14 audioCylinder museumDisplay anjaDesk lockConsole lockHalo' },
  m16: { place: 'sinkhole', quarters: ['THE RIM & THE FIRST MEMORY', 'THE SPIRAL', 'THE COMPARISON HALL', 'THE PHOTOGRAPH'],
    landmarks: 'rimGate entranceHall alcove1 alcove2 alcove3 pontoons reel shatteredCase lensHall deductionBoard waterfall photoAlcove catacomb choiceCases' },
  m17: { place: 'array', quarters: ['THE SHIFTING CORRIDOR', 'THE RECORDINGS', 'THE EARLIER ROOMS', 'THE ORIGINAL EXPERIMENT'],
    landmarks: 'arrival cableTrenches drumRacks shelves mimicPatrol dish1 dish2 dish3 dish4 dish5 dish6 dish7 dish8 dish9 echoGate earlierRooms controlHall reconstruction letterDesk' },
  m18: { place: 'fracture', quarters: ['THE ANCHOR SETTLEMENT', 'THE CANYON', 'THE FLOODED HIGHWAY', 'THE COLLAPSING SKYSCRAPER'],
    landmarks: 'anchorMast houseA houseB houseC chronolithBench garden canyonArch waterShortcut highwaySign lampPosts surge slabs floorFragment pylon1 pylon2 pylon3 stabilizer towerDeck transmissionScreen pocket' },
  m19: { place: 'unwritten', quarters: ['THE LOOPING ROAD', 'THE BRIDGE IN THE REFLECTION', 'THE DOOR THAT IS EVERYWHERE'],
    landmarks: 'orrenRoad clockMarks observatoryPattern helixBadge mirrorBridge lagSite realDoor miraMeet door1 door2 door3 door4 door5' },
  m20: { place: 'memory', quarters: ['THE HOUSE', 'THE EXPERIMENT', 'THE WORLD WITHOUT KAI'],
    landmarks: 'kitchen fridgeDrawing yellowBoots nightBadge garden blueDoor whiteChamber childChair console seaGarden miraPlanting memorialNobody stop41 alignBoard houseNoOwner' },
  m21: { place: 'spire', quarters: ['THE ALLY / ARRIVAL', 'THE COMMAND STRUCTURE', 'THE ARENA', 'THE WITNESS'],
    landmarks: 'gliderDeck lightBridge serviceLift kitchenDoor stairsAlone commandHalls eliteRamps cells directorOffice arenaRing arenaBridges mast citadelRing witnessStand' },
  m22: { place: 'firstsecond', quarters: ["THE VILLAGE'S CHAIN", "THE CLOCKMAKER'S PATTERN & THE HOSPITAL'S LOCK", 'THE FINAL CHAMBER'],
    landmarks: 'wedgeVillage chainWall wedgeClock clockArm wedgeHospital twinChamber finalSeals evidenceTable memoryCards wedgeStation wedgeCourt' },
  m23: { place: 'afterzero', quarters: ['THE OPENING STREETS', 'THE SETTLEMENT, AGAIN', 'THE HELIX LAB', '2196', 'THE ORIGINAL CHRONOLITH'],
    landmarks: 'platform41 streetCollapse junPassengers tellingStone settlementBridge tala rookTransmission ivenStatement memorial2196 seraGarden anja originalRing miraStands endingChoice' },
  // the two v2.0 cases, replay entries since U8: Tala's gorge in Mission 5's place, Mara's press tower in Mission 15's
  c_b: { place: 'valley_river', quarters: ['THE HEAD-STONE', 'THE RETAINING WALL', 'THE PRESSURE GATE', 'THE UPPER GORGE'], landmarks: 'gorgeMouth dryChannel gate1 gate2 gate3 aqueduct muralCliff' },
  c_c: { place: 'lockcity', quarters: ['THE STATION', 'THE SCHOOL & MARKET', 'THE ARCHIVE / THE LOCK'], landmarks: 'pressTower pressFoot pressStairTop archiveA archiveB card14 audioCylinder museumDisplay' },
};
const PLACED = LEVELS.filter((l) => SHEETS[l.deck.mkey]);
const sameAs = (a, b) => a === b || [].concat(PLACES[a].sameAs || []).includes(b) || [].concat(PLACES[b].sameAs || []).includes(a);
// the horizontal extent of a visual piece, and its height
function extent(v) {
  if (v.b) return [v.b[0], v.b[2], v.b[3], v.b[5], v.b[4] - v.b[1], v.b[1]];
  const r = v.R ?? v.r ?? Math.max(v.w ?? 0, v.d ?? 0) / 2;
  const hw = v.w !== undefined ? Math.hypot(v.w, v.d ?? 0) / 2 : r;
  return [v.x - hw, v.z - hw, v.x + hw, v.z + hw, v.h ?? (v.R ? v.R * 2 : r * 2), v.y];
}

test('every mission stands in its own open place, with every quarter and every landmark of its sheet', () => {
  assert.equal(Object.keys(SHEETS).filter((k) => /^m\d\d$/.test(k)).length, 23, 'all twenty-three missions have a sheet');
  for (const [key, sheet] of Object.entries(SHEETS)) {
    const ls = PLACED.filter((l) => l.deck.mkey === key);
    assert.ok(ls.length, `${key} builds`);
    for (const { deck, s, level } of ls) {
      const here = `${key}/${s}`;
      assert.equal(level.place, sheet.place, `${here}: its place`);
      assert.deepEqual(level.quarters.map((q) => q.name), sheet.quarters, `${here}: its quarters`);
      const missing = sheet.landmarks.split(' ').filter((n) => !level.landmarks[n]);
      assert.deepEqual(missing, [], `${here}: landmarks the sheet names`);
      for (const [n, l] of Object.entries(level.landmarks)) assert.ok(l.length === 4 && l.every(Number.isFinite), `${here}: ${n}`);
      // D2 step 1: sector i spawns in quarter i (or, where a mission has fewer sectors than the place has quarters, in the
      // first quarter its sector spans: spec.sectors)
      const q = level.quarters[PLACES[level.place].sectors?.[deck.mkey]?.[s] ?? Math.min(s, level.quarters.length - 1)];
      if (deck.sectors > 1) assert.ok(Math.hypot(level.spawn[0] - q.spawn[0], level.spawn[2] - q.spawn[2]) < 0.01, `${here}: spawns at ${q.name}`);
      assert.ok(level.exit?.box && level.checkpoints.length >= level.quarters.length, `${here}: an exit, and a checkpoint per quarter`);
    }
  }
});

test('open sky: no dome, no ceiling over more than 15% of a place, and no tall wall on its bounds', () => {
  const COVER = new Set(['dome', 'ceil', 'roots', 'helixCeil']);
  const ROCK = new Set(['rock', 'cliffRock', 'rockGrass']);
  for (const { deck, s, level } of PLACED) {
    const here = `${deck.mkey}/${s}`;
    const [bx0, bz0, bx1, bz1] = level.bounds;
    const area = (bx1 - bx0) * (bz1 - bz0);
    let cover = 0;
    for (const v of level.vis) {
      if (!COVER.has(v.m)) continue;
      const [x0, z0, x1, z1] = extent(v);
      cover += (x1 - x0) * (z1 - z0);
    }
    for (const e of level.elements) if (!e.invisible && ['dome', 'ceil', 'roots'].includes(e.mat)) cover += (e.box[3] - e.box[0]) * (e.box[5] - e.box[2]);
    assert.ok(cover <= area * 0.15, `${here}: ${Math.round((cover / area) * 100)}% under a ceiling`);
    assert.ok(!level.elements.some((e) => !e.invisible && !e.ghost && e.mat === 'dome'), `${here}: no dome`);
    // the bounds are an invisible ring: what stands on them is never a wall taller than 6 m (cliffs excepted)
    for (const v of level.vis) {
      if (ROCK.has(v.m) || !['box', 'obox'].includes(v.k)) continue;
      const [x0, z0, x1, z1, h] = extent(v);
      // a wall that runs along an edge: thin across it, long along it, standing on the line
      const near = (a, b) => Math.abs(a - b) < 1.5;
      const alongX = z1 - z0 < 2 && x1 - x0 > 6 && (near(z0, bz0) || near(z1, bz0) || near(z0, bz1) || near(z1, bz1));
      const alongZ = x1 - x0 < 2 && z1 - z0 > 6 && (near(x0, bx0) || near(x1, bx0) || near(x0, bx1) || near(x1, bx1));
      assert.ok(!((alongX || alongZ) && h > 6), `${here}: a ${h} m ${v.m} wall on the bounds at ${[x0, z0, x1, z1]}`);
    }
    const ring = level.elements.filter((e) => e.invisible && (e.box[3] <= bx0 + 0.01 || e.box[0] >= bx1 - 0.01 || e.box[5] <= bz0 + 0.01 || e.box[2] >= bz1 - 0.01));
    assert.ok(ring.length >= 4, `${here}: an invisible ring at the bounds`);
  }
});

test('no generator and no Vessel look: every mission is built from its place spec', () => {
  for (const { deck, s, level } of PLACED) {
    const here = `${deck.mkey}/${s}`;
    assert.ok(level.place && !level.zone, `${here}: not a ZoneGen district`);
    assert.equal(level.palette.look, undefined, `${here}: no Vessel look`);
    assert.ok(!['rooms', 'zone'].includes(deck.kind) && !deck.deckKey && !deck.theme, `${here}: no LevelGen deck or ZoneGen theme (${deck.kind})`);
    assert.ok(!level.elements.some((e) => e.dress), `${here}: no dress.js decoration`);
    assert.ok(level.rooms[level.outdoorRoom]?.outdoor, `${here}: the place is an outdoor room`);
    for (const rid of level.order) assert.ok(!level.rooms[rid].look, `${here} ${rid}`);
  }
});

test('every year a mission is authored with has a sky, a light and an hour', () => {
  for (const { deck, s, level } of PLACED) {
    for (const st of deck.states) {
      const y = level.years[st];
      assert.ok(y, `${deck.mkey}/${s}: a year for ${st}`);
      assert.ok(SKIES[y.sky], `${deck.mkey} ${st}: sky preset ${y.sky}`);
      for (const k of ['hour', 'fog', 'density', 'night']) assert.ok(Number.isFinite(y[k]), `${deck.mkey} ${st}: ${k}`);
      assert.ok(Number.isFinite(y.sun?.elev) && Number.isFinite(y.sun?.az), `${deck.mkey} ${st}: the sun ${JSON.stringify(y.sun)}`);
      assert.ok(y.era, `${deck.mkey} ${st}: an era for the horizon`);
    }
  }
  for (const [k, p] of Object.entries(SKIES)) for (const f of ['zenith', 'horizon', 'ground', 'sun']) assert.ok(Number.isFinite(p[f]), `${k}.${f}`);
});

// Horizon.js paints the Notch opaque over the sky: a sunrise "in the Notch" below its V's floor is behind the mountain
test('a sun that rises in the Notch shows in its gap: above the painted V\'s floor, no higher than its peaks', async () => {
  const { notchFloor, NOTCH_FLOOR } = await import('../game/js/editions/lastversion/places/atlas.js');
  let n = 0;
  for (const [key, spec] of Object.entries(PLACES)) {
    const years = [spec.years || {}, ...Object.values(spec.variants || {}).map((v) => v.years || {})].flatMap((ys) => Object.entries(ys));
    for (const [st, y] of years) {
      if (y.sun?.az !== 'notch' || !(SKIES[y.sky]?.sunSize > 0)) continue;
      const floor = notchFloor(key, spec.backdrop), peak = floor / NOTCH_FLOOR;
      assert.ok(floor > 1 && y.sun.elev >= floor + 1 && y.sun.elev <= peak + 1, `${key} ${st}: the sun at ${y.sun.elev}°, the Notch's floor at ${floor.toFixed(1)}°, its peaks at ${peak.toFixed(1)}°`);
      n++;
    }
  }
  assert.ok(n >= 4, `${n} sunrises in the Notch (M3 2049, M7 THE FIRST SKY, M23 2026 and 2196)`);
});

test('no two missions look alike: the signature is unique unless the place is the same in another year', () => {
  const sig = {};
  for (const key of Object.keys(SHEETS)) {
    const { deck } = PLACED.find((l) => l.deck.mkey === key);
    const sg = signature(PLACES[deck.place], deck);
    for (const [other, o] of Object.entries(sig)) {
      if (o.sg !== sg) continue;
      assert.ok(sameAs(o.place, deck.place), `${key} looks like ${other}: ${sg}`);
    }
    sig[key] = { sg, place: deck.place };
  }
  assert.ok(sameAs('helix_v17', 'helix') && sameAs('helix', 'helix_v17'), 'Helix in VERSION 17 is Helix, declared both ways');
  // (the cases replay a mission's place in its own years, so only the missions are counted)
  const ms = Object.entries(sig).filter(([k]) => /^m\d\d$/.test(k));
  assert.equal(new Set(ms.map(([, o]) => o.sg)).size, ms.length, 'every signature differs');
});

// the signature only reads the default year: here every year of the Prologue and Act I, against every other mission's
// years in another place. The same light is the same kind of weather, a sun disc in both or neither, the zenith within
// 50 and the horizon within 70 (RGB distance), the sun within 12° of height, and its bearing within 35° (or under the
// horizon in both: one twilight looks like another)
test('no year of the Prologue or Act I shares its light with another mission\'s year: sky colours, sun, weather', () => {
  const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  const dist = (a, b) => Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i]));
  const FAMILY = { pollen: 'specks', motes: 'specks', stardust: 'specks', storm: 'rain' };
  const years = [];
  for (const { deck, level } of PLACED) {
    if (!/^m\d\d$/.test(deck.mkey) || years.some((y) => y.key === deck.mkey)) continue;
    for (const [st, y] of Object.entries(level.years)) years.push({ key: deck.mkey, n: deck.n, st, y, sky: SKIES[y.sky], place: deck.place });
  }
  let pairs = 0;
  for (const a of years) {
    if (a.n > 8) continue;
    for (const b of years) {
      if (b.place === a.place || sameAs(a.place, b.place) || (b.n <= 8 && b.n < a.n)) continue;
      pairs++;
      const twilight = a.y.sun.elev < 0 && b.y.sun.elev < 0;
      const az = Math.abs(((a.y.sun.az - b.y.sun.az + 540) % 360) - 180);
      const same = (FAMILY[a.y.weather] || a.y.weather || 'clear') === (FAMILY[b.y.weather] || b.y.weather || 'clear') && (a.sky.sunSize > 0) === (b.sky.sunSize > 0)
        && dist(a.sky.zenith, b.sky.zenith) < 50 && dist(a.sky.horizon, b.sky.horizon) < 70 && Math.abs(a.y.sun.elev - b.y.sun.elev) < 12 && (twilight || az < 35);
      assert.ok(!same, `${a.key} ${a.st} (${a.y.sky}) has the light of ${b.key} ${b.st} (${b.y.sky})`);
    }
  }
  assert.ok(pairs > 400, `${pairs} pairs of years`);
  // (the review's pairs: M4's village, M6's 2049 and M7's 2196 were one low golden western sun; M4's pre-dawn and M7's blue hour one twilight)
  const y = (k, st) => years.find((r) => r.key === k && r.st === st).y;
  assert.ok(y('m07', 'FUTURE').sun.elev - y('m04', 'PRESENT').sun.elev >= 12 && y('m06', 'PRESENT').hour - y('m04', 'PRESENT').hour >= 1);
  assert.ok(!SKIES[y('m04', 'PAST').sky].moon && SKIES[y('m07', 'PRESENT').sky].moon > 0, 'the moon is M7\'s alone');
});

test('every mission\'s default sky is its own (the M22 and M23 composites excepted)', () => {
  const seen = {};
  for (const key of Object.keys(SHEETS).filter((k) => /^m\d\d$/.test(k))) {
    const { deck, level } = PLACED.find((l) => l.deck.mkey === key);
    // (the year the mission opens in: its home year, 2196 for Missions 14-16 and 18 and 2026 for 20, else 2049)
    const y = level.years[deck.home || 'PRESENT'];
    assert.ok(SKIES[y.sky], `${key}: ${y.sky}`);
    if (['m22', 'm23'].includes(key)) continue;
    assert.ok(!seen[y.sky], `${key} shares its default sky ${y.sky} with ${seen[y.sky]}`);
    seen[y.sky] = key;
  }
  assert.ok(Object.keys(seen).length >= 21);
});

test('the edition no longer runs the generators: no edition file imports gen/ZoneGen.js or gen/LevelGen.js, and dress.js is gone', () => {
  const root = new URL('../game/js/editions/lastversion/', import.meta.url);
  const files = [];
  const walk = (u) => { for (const e of fs.readdirSync(u, { withFileTypes: true })) { const v = new URL(e.name + (e.isDirectory() ? '/' : ''), u); if (e.isDirectory()) walk(v); else if (e.name.endsWith('.js')) files.push(v); } };
  walk(root);
  assert.ok(files.length >= 30, `${files.length} edition files`);
  const GEN = /(?:from\s*|import\s*\(\s*)['"][^'"]*gen\/(?:ZoneGen|LevelGen)\.js['"]/;
  for (const f of files) assert.ok(!GEN.test(fs.readFileSync(f, 'utf8')), `${f.pathname.split('/editions/')[1]} imports a generator`);
  assert.ok(!fs.existsSync(new URL('dress.js', root)), 'dress.js is retired');
  for (const m of Object.values(MISSIONS).flat()) {
    assert.ok(m.place, `${m.key}: a place`);
    assert.ok(!['zone', 'rooms'].includes(m.kind) && !m.palette && !m.theme && !m.deckKey, `${m.key}: no generator setup (${m.kind})`);
  }
});

// (U3 review) a quarter is where it says: Threads.quarters() takes the last quarter whose room, height box (cp) or area
// holds Kai, so each quarter's spawn is its own (never a later quarter's: the save would jump ahead, and a setback there
// would carry Kai forward), and the threads of a quarter stand in it, at most at the next quarter's door
test('every quarter holds its own spawn, and its main threads stand in it (or at the next quarter\'s threshold)', () => {
  for (const { deck, level } of LEVELS) {
    const qs = level.quarters || [];
    if (!qs.length) continue;
    const claim = (p) => {
      const room = roomAt(level, p) || level.outdoorRoom;
      for (let i = qs.length - 1; i >= 0; i--) {
        const q = qs[i], b = q.cp, y = p[1] + 0.86;
        const here = q.room && q.room !== level.outdoorRoom ? room === q.room
          : room === level.outdoorRoom && (b ? p[0] >= b[0] && p[0] < b[3] && y >= b[1] && y < b[4] && p[2] >= b[2] && p[2] < b[5] : p[0] >= q.area[0] && p[0] < q.area[2] && p[2] >= q.area[1] && p[2] < q.area[3]);
        if (here) return i;
      }
      return -1;
    };
    qs.forEach((q, i) => assert.equal(claim(q.spawn), i, `${deck.mkey}: the spawn of ${q.name} (${q.spawn.map((v) => +(+v).toFixed(1))}) is in quarter ${claim(q.spawn)}`));
    for (const t of threadsOf(deck)) {
      const l = typeof t.at === 'string' && level.landmarks[t.at];
      if (!l || t.side) continue;
      // (ground no quarter claims, Mission 2's staff lounge off the court, changes nothing)
      const c = claim(l);
      assert.ok(c <= t.q + 1, `${deck.mkey}: ${t.id} (quarter ${t.q}) at ${t.at} stands in quarter ${c}`);
    }
  }
});

// (U3 review) a watcher patrols open ground: a path through a house is a guard walking through its walls, blind half
// its loop (its eye cannot see out of a box). Each path's samples, in the year that suits it best, are at most 15% in
// solids at body height (a post or a bench in passing), Mission 9's rounds after each reset as well
test('watchers patrol open ground, not through the places\' buildings', () => {
  for (const { deck, level } of LEVELS) {
    // (a watcher walks the floor its def gives, y, else the ground at 0: since U7's review the dam's chamber at -12 m)
    const paths = [...level.sentinels.map((sn) => [sn.path, sn.y || 0]), ...(deck.loop?.variants || []).flatMap((v) => (v.watch ? Object.values(v.watch).map((p) => [p, 0]) : []))];
    const solid = deck.states.map((st) => level.elements.filter((e) => e.solid && (!e.when || [false, true].every((v) => compileCondition(e.when)({ fact: () => v, state: st })))));
    for (const [path, y] of paths) {
      if (!path || path.length < 2) continue;
      const loop = path.length > 2 ? [...path, path[0]] : path, pts = [];
      for (let i = 0; i < loop.length - 1; i++) for (let k = 0; k < 10; k++) pts.push([loop[i][0] + ((loop[i + 1][0] - loop[i][0]) * k) / 10, loop[i][1] + ((loop[i + 1][1] - loop[i][1]) * k) / 10]);
      const inside = Math.min(...solid.map((sol) => pts.filter(([x, z]) => sol.some((e) => x > e.box[0] && x < e.box[3] && z > e.box[2] && z < e.box[5] && e.box[1] < y + 1.6 && e.box[4] > y + 0.3)).length));
      assert.ok(inside <= pts.length * 0.15, `${deck.mkey}: a watcher's path ${JSON.stringify(path)} is ${inside} of ${pts.length} samples inside solids`);
    }
  }
});

test('places are big enough to explore: a short side of 120 m or more (a linear place: 100-120 × 360-420 m), quarters of 2,500 m² or more', () => {
  for (const [key, spec] of Object.entries(PLACES)) {
    const [x0, z0, x1, z1] = spec.bounds;
    const short = Math.min(x1 - x0, z1 - z0), long = Math.max(x1 - x0, z1 - z0);
    if (spec.linear) assert.ok(short >= 100 && short <= 120 && long >= 360 && long <= 420, `${key} (linear, §4.7's 100-120 × 360-420 m): ${x1 - x0} × ${z1 - z0}`);
    else assert.ok(short >= 120, `${key}: ${x1 - x0} × ${z1 - z0}`);
  }
  assert.deepEqual(Object.keys(PLACES).filter((k) => PLACES[k].linear).sort(), ['afterzero', 'fracture'], 'the two traverses are the linear places');
  for (const { deck, level } of PLACED) {
    for (const q of level.quarters) {
      const [x0, z0, x1, z1] = q.area;
      assert.ok((x1 - x0) * (z1 - z0) >= 2500, `${deck.mkey}: ${q.name} is ${(x1 - x0) * (z1 - z0)} m²`);
    }
  }
});

test('the years of a place share one layout and differ by big pieces (20 or more per extra year)', () => {
  const big = (v) => { const [x0, z0, x1, z1, h] = extent(v); return Math.max(x1 - x0, z1 - z0, h) >= 2; };
  for (const key of Object.keys(SHEETS)) {
    const ls = PLACED.filter((l) => l.deck.mkey === key);
    const { deck, level } = ls[0];
    // the unconditioned pieces are the same in every sector of the mission (and so in every year)
    const plain = (lv) => JSON.stringify(lv.vis.filter((v) => !v.e && !v.when).map((v) => [v.k, v.m, v.b || [v.x, v.y, v.z]]));
    for (const l of ls.slice(1)) assert.equal(plain(l.level), plain(level), `${key}: one layout`);
    for (const st of deck.states) {
      if (st === 'PRESENT') continue;
      const n = level.vis.filter((v) => v.e && v.e.includes(st) && v.e.length < 3 && big(v)).length + level.veg.filter((t) => t.e && t.e.includes(st) && t.s >= 1).length;
      assert.ok(n >= 20, `${key}: ${n} big pieces only in ${st}`);
    }
  }
});

test('ancient years carry no lamp, neon, road or written sign', () => {
  let checked = 0;
  for (const { deck, s, level } of PLACED) {
    const ancient = PLACES[level.place].ancientYears || [];
    for (const st of deck.states.filter((x) => ancient.includes(x))) {
      checked++;
      const here = `${deck.mkey}/${s} ${st}`;
      for (const v of level.vis) {
        if (v.e && !v.e.includes(st)) continue;
        const tags = MATS[v.m]?.tags || [];
        assert.ok(!tags.includes('modern'), `${here}: ${v.m} (${tags})`);
      }
      for (const t of level.texts) {
        const shows = !t.when || compileCondition(t.when)({ fact: () => false, state: st });
        assert.ok(!shows, `${here}: the words "${t.text}"`);
      }
    }
  }
  assert.ok(checked >= 6, `${checked} ancient years checked`);
});

test('every traversal challenge names an answer in its room\'s years', () => {
  const WATCH = /drone|unit|sentinel|sweeper/;
  let n = 0;
  for (const { deck, s, level } of PLACED) {
    for (const rid of level.order) {
      const room = level.rooms[rid];
      const st = room.states || deck.states;
      for (const c of room.challenges || []) {
        if (WATCH.test(c.key)) continue;
        n++;
        assert.ok(c.answer?.length, `${deck.mkey}/${s} ${rid}: ${c.key} names its answer`);
        for (const a of c.answer) assert.ok(st.includes(a), `${deck.mkey}/${s} ${rid}: ${c.key} answers in ${a}, the room has ${st}`);
        assert.equal(c.hints?.length ?? HINTS[c.key]?.length, 3, `${deck.mkey}: ${c.key} has three hints`);
      }
    }
  }
  assert.ok(n >= 8, `${n} crossings`);
});

test('a place keeps to its budgets: colliders, texts, people, vegetation kinds, materials and kits', () => {
  for (const { deck, s, level } of PLACED) {
    const here = `${deck.mkey}/${s}`;
    assert.ok(level.elements.length <= 1500, `${here}: ${level.elements.length} colliders`);
    assert.ok(level.texts.length <= 60, `${here}: ${level.texts.length} texts`);
    // people: the named and tier-2 people plus the crowds cast along level.crowd (crowds.js), within §4.7's 24
    const crowdN = level.crowd.reduce((a, c) => a + c.n, 0);
    const named = level.npcs.filter((n) => !n.crowd).length;
    const crowd = level.npcs.filter((n) => n.crowd).length;
    // (U4 review: a crowd may come out smaller than its share, where its faces run out: crowds.js CAP)
    const share = Math.min(crowdN, 24 - named);
    assert.ok(level.npcs.length <= 24 && crowd <= share && crowd >= Math.floor(share * 0.6), `${here}: ${level.npcs.length} people, ${named} named + ${crowd} of ${crowdN} in the crowd`);
    const [bx0, bz0, bx1, bz1] = level.bounds;
    assert.ok(level.crowd.length, `${here}: crowd paths for U4`);
    for (const c of level.crowd) {
      assert.ok(['present', 'ancient', 'future'].includes(c.era) && c.region && c.role && c.n >= 1, `${here}: crowd ${JSON.stringify(c)}`);
      assert.ok(c.years?.length && c.years.every((y) => deck.states.includes(y)), `${here}: the ${c.role}s walk in this mission's years (${c.years})`);
      assert.ok(c.path.length >= 2 && c.path.every(([x, z]) => x > bx0 && x < bx1 && z > bz0 && z < bz1), `${here}: the ${c.role}s' path is inside the place`);
    }
    assert.ok(new Set(level.veg.map((t) => t.k)).size <= 6, `${here}: vegetation kinds`);
    for (const v of level.vis) assert.ok(MATS[v.m] && SURFACES[MATS[v.m].s], `${here}: material ${v.m}`);
    for (const it of level.interactables) if (it.kit) assert.ok(KIT_NAMES.includes(it.kit), `${here}: kit ${it.kit}`);
    for (const it of level.interactables) assert.ok(!['terminal', 'fragment', 'plaque'].includes(it.kind) || it.kit, `${here}: ${it.id} is a thing of its place, not a terminal or a crystal`);
  }
  for (const st of Object.values(STYLES)) assert.ok(st.veg.length <= 6 && st.palette.look === undefined);
});

// Kai walks a route through a place with the game's own physics (entities/Player.js: a 0.35 m step from the ground):
// [x, z] waypoints, steering only; it fails where a stair, ramp or bridge does not carry him
function walkRoute(level, state, start, route, facts = {}) {
  const cols = [];
  for (const e of level.elements) {
    if (!e.solid || (e.when && !compileCondition(e.when)({ fact: (k) => facts[k], state }))) continue;
    cols.push({ min: e.box.slice(0, 3), max: e.box.slice(3) });
  }
  const p = Object.assign(Object.create(Player.prototype), { pos: new THREE.Vector3(start[0], start[1] + 0.86, start[2]), vel: new THREE.Vector3(), H: new THREE.Vector3(0, 0, -1), U: new THREE.Vector3(0, 1, 0), gravity: -1, grounded: false, half: new THREE.Vector3(0.3, 0.85, 0.3), topSpeed: null, stepOff: 0, airT: 0, _canStep: false, comfort: true, pitch: 0, facing: new THREE.Vector3(0, 0, -1), colliders: [] });
  for (const [x, z, jump] of route) {
    let best = 1e9, stuck = 0;
    for (let t = 0; t < 40; t += 1 / 30) {
      const dx = x - p.pos.x, dz = z - p.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.45) break;
      p.H.set(dx / d, 0, dz / d);
      p.update(1 / 30, { forward: 1, strafe: 0, run: false, jump: !!jump && p.grounded, slow: false }, cols);
      if (d < best - 0.05) { best = d; stuck = 0; } else if ((stuck += 1 / 30) > 3) break;
    }
    const left = Math.hypot(x - p.pos.x, z - p.pos.z);
    if (left > 0.6) return { stuck: [x, z], at: p.pos.toArray().map((v) => +v.toFixed(2)) };
  }
  return { at: [+p.pos.x.toFixed(2), +(p.pos.y - 0.85).toFixed(2), +p.pos.z.toFixed(2)] };
}

test('the places can be walked: their stairs, terraces, ramps and bridges carry Kai (Player physics: the engine\'s 0.35 m step)', () => {
  const lv = (key, s = 0) => PLACED.find((l) => l.deck.mkey === key && l.s === s).level;
  const lm = (l, n) => l.landmarks[n];
  const routes = [
    ['m01', 'PRESENT', (l) => lm(l, 'door4B'), [[10.5, -4], [10.5, -66], [4, -84]], 0.15, {}],
    ['m01', 'PRESENT', (l) => [lm(l, 'fireEscape')[0], 0.15, lm(l, 'fireEscape')[2] + 1.5], [[46.9, -97.5], [46.9, -80.6], [46.2, -79], [45.6, -80.5], [45.6, -97.4], [46.2, -99.2], [46.9, -97.5], [46.9, -80.6], [46.2, -79], [45.6, -80.5], [45.6, -97.4], [46.2, -99.4], [48.6, -99.4], [60, -90]], 12.3, {}],
    ['m01', 'PRESENT', () => [0, 0.15, -100], [[0, -112], [0, -128], [0, -152]], 3.4, { checkpoint_passed: true }],
    ['m02', 'PRESENT', (l) => [l.rooms.security.spawn[0], 0, l.rooms.security.spawn[2]], [[-47.2, 32.4], [-47.2, 18.4]], 0, {}],
    // (U6) Mission 3: in 2026 the temporal lab's south wall is a frame: out across the court to Rook's dig, and back
    ['m03', 'PAST', () => [40.8, 0, -6], [[40.8, -1], [37, 0], [16, 14], [16, 31], [-5, 31]], 0, {}],
    ['m03', 'PAST', () => [-5, 0, 31], [[16, 31], [16, 14], [37, 0], [40.8, -1], [40.8, -6]], 0, {}],
    ['m04', 'PRESENT', (l) => lm(l, 'blanketHouse'), [[-10, 70], [0, 67], [0, 58], [-20, 40], [-20, 32], [0, 14], [0, 11], [0, 3], [2.8, -1], [2.8, -7.5], [0, -8.6], [0, -16]], 6, {}],
    ['m04', 'PAST', () => [55, 0, 75], [[55, 60], [55, 50]], 3, {}],
    ['m05', 'PRESENT', (l) => lm(l, 'weir'), [[30, -26], [16.5, -26], [8, -26]], 2, {}],
    ['m05', 'PRESENT', (l) => lm(l, 'southBank'), [[-16, 44.5], [-28, 44.5], [-28, 34.2], [-28.6, 30]], 7.4, {}],
    ['m06', 'PRESENT', (l) => lm(l, 'cellarStair'), [[9.8, -20.6], [12, -18.4]], 0, {}],
    // (Mission 6: the scissor stair climbs to the third floor; the clock room is up the servants' stair, there in 2026
    // only; from the clock room the scissor stair goes on to the roof)
    ['m06', 'PRESENT', () => [21.1, 0, -18.5], [0, 1, 2].flatMap((k) => (k % 2 ? [[22.5, -29.4], [22.5, -19], [21.1, -18.4]] : [[21.1, -19.2], [21.1, -29.7], [22.5, -30.2]])), 12, {}],
    ['m06', 'PAST', () => [19.5, 12, -28], [[19.4, -30.5], [11.2, -30.5], [11, -28], [11, -20], [20.5, -18.6], [21.1, -19.2], [21.1, -29.7]], 20, {}],
    ['m07', 'PRESENT', () => [30, 0, -18], [[30, -37], [26, -70], [41, -70], [46.5, -52], [40, -52], [14, -52], [12, -52]], 18, {}],
    ['m07', 'PAST', () => [46, 16, -70], [[44, -74], [66, -74], [74, -77]], 27.5, {}],
    ['m07', 'FUTURE', () => [-80, 0, -52], [[-78, -52], [-37, -52], [-35, -52]], 18, {}],
    ['m08', 'PRESENT', (l) => lm(l, 'atriumDoors'), [[-40, -20], [-30, -24], [30, -20], [30, -21], [30, -37.5], [30, -38.6]], 9, { staff_door_open: true }], // (an officer who trusts Kai opens it)
    ['m08', 'PRESENT', () => [40, 0, -28], [[40, -24.5], [40, -14.3], [44, -10]], 6, {}],
    ['m08', 'PRESENT', () => [0, 0, -22], [[0, -18.4], [-0.3, -17], [0.4, -15.6], [-0.2, -14.2], [0.3, -12.8], [0, -11]], 0.4, {}],
    // (U7 review) Mission 8 without anyone's trust: up the old river wall's nine ledges, a jump each, to the balcony
    ['m08', 'PRESENT', () => [0, 0, -36], [[0.4, -38.3], ...Array.from({ length: 9 }, (_, i) => [1.6 + i * 1.1, -38.3, true]), [11.5, -38.3, true], [14, -38.3], [22, -38.3]], 9, {}],
    // (U7 review) Mission 8: into the containment cube by its open door, to Lin; sealed (lin_gone), out through 2026's lens
    ['m08', 'PRESENT', () => [0, 0.4, 11.5], [[0, 9], [0, 6], [0, 4.6]], 0.4, {}],
    ['m08', 'PAST', () => [0, 0.4, 4.6], [[0, 10.6], [3.4, 11.2]], 0.4, { lin_gone: true }],
    // (U7 review) Mission 10: Kai wakes in his cell, on its floor, and walks out onto the gallery
    ['m10', 'PRESENT', () => [-24, 0, -19.5], [[-24, -17], [-24, -12], [-18, -10]], 0, {}],
    // (U3) the stone arch over the 2026 canyon; the lamp-post heads over the 2049 flood; the 2196 tilted floors up to the tower's deck
    ['m18', 'PAST', () => [0, 0, -80], [[0, -66], [0, -54], [0, -40]], 0, {}],
    ['m18', 'PRESENT', () => [0, 0, -8], [[6, -12], [6, -9.5], [6, 1], [6, 30], [6, 60]], 1.9, {}], // (from the sign, up the fallen lamp post onto the heads)
    // (U8: up onto the stump; from the slab stair's head at 9 m, the tilted floors to the tower's deck)
    ['m18', 'FUTURE', () => [-20, 0, 92], [[-20, 96], [-20, 104.5], [-16, 108]], 6, {}],
    ['m18', 'FUTURE', () => [-3.4, 9, 108], [[6, 108], [10, 112], [10, 138], [14, 144], [26, 146], [26, 176], [30, 180], [24, 186]], 26, {}],
    // the bridge in the reflection holds in 2026, and once the reflection is in step; the stair to the fifth door
    ['m19', 'PAST', () => [0, 0, -18], [[0, -30], [0, -42]], 0, {}],
    ['m19', 'PRESENT', () => [0, 0, -18], [[0, -30], [0, -42]], 0, { m19_synced: true }],
    ['m19', 'PRESENT', () => [86, 0, -42], [[86, -60], [86, -79], [86, -81]], 12, {}],
    ['m19', 'PAST', () => [-55, 0, 98], [[-55, 79], [-55, 76], [-49, 76], [-49, 64]], 6, {}],
    // the Spire: the kitchen door's stair, the halls, the elite ramps, the cells' terrace, the bridge to the arena; the summit
    ['m21', 'PRESENT', () => [48, 0, 30], [[48, 27], [48, 21], [48, 10], [48, -30], [46, -38], [46, -62], [30, -68], [21, -68], [6, -68], [6, -44], [6, -38]], 18, { warned_evacuees: true }], // (the kitchen door opens for the people who listened)
    ['m21', 'PRESENT', () => [-32.7, 18, -36], [[-32.7, -44], [-32.7, -55], [-36, -60]], 24, {}],
    ['m21', 'PRESENT', () => [-30, 0, 26], [[-30, 20], [-30, 6], [-30, 0], [10, 0], [30, 0]], 6, {}],
    // the Museum: the sinkhole's spiral, one and a half turns from the rim (26 m) to the floor (-12 m), into the Comparison Hall
    ['m16', 'FUTURE', (l) => lm(l, 'rimGate'), [[0, 58], [0, 55], ...Array.from({ length: 89 }, (_, i) => { const a = 96 + i * 6, r = 55 - (18 * (a - 90)) / 540; return [Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r]; }), [0, -33], [0, -30], [3, -20], [3, -12], [1, -6]], -12, {}],
    // the First Second: down the village terraces, round the twin chamber to the clockmaker's wedge
    ['m22', 'PRESENT', (l) => lm(l, 'wedgeVillage'), [[0, 60], [0, 53], [0, 48], [0, 41], [0, 36], [0, 24], [-12, 14], [-30, 14], [-40, 14]], 0, {}],
    // (U8) the Spire's arena once it has fallen: in 2196 the frozen girder spans the second gap
    ['m21', 'FUTURE', (l) => lm(l, 'arenaMid'), [[-15.1, -42.6], [-19.2, -41], [-23.2, -39.3], [-26.2, -37.3]], 18, { arena_fallen: true }],
    // Afterzero: from the 41's shelter to the fallen street; in 2026 its south half still stands
    ['m23', 'PRESENT', (l) => lm(l, 'platform41'), [[2, 150], [2, 140]], 0, {}],
    ['m23', 'PAST', () => [2, 0, 140], [[2, 134], [2, 129]], 0, {}],
    // past the street (the Witness holds it) to the stream; past the stream (Kai holds it) up the Ring Hill to the ring
    ['m23', 'PRESENT', () => [2, 0, 116], [[2, 112], [0, 90], [0, 68]], 0, {}],
    ['m23', 'PRESENT', () => [0, 0, 52], [[0, 30], [0, -20], [0, -100], [0, -110], [0, -124], [0, -140]], 4, {}],
  ];
  for (const [key, st, start, route, y, facts] of routes) {
    const l = lv(key);
    const r = walkRoute(l, st, start(l), route, facts);
    assert.ok(!r.stuck && Math.abs(r.at[1] - y) < 0.6, `${key} ${st}: ${JSON.stringify(route.slice(-1))} ${JSON.stringify(r)}`);
  }
  // Mission 6: in 2049 the third floor is as high as the stairs go (the old flight's lane is open air), and the
  // servants' stair is brick
  assert.ok((walkRoute(lv('m06'), 'PRESENT', [22.5, 12, -30.2], [[22.5, -29.4], [22.5, -19]]).at?.[1] ?? 0) < 12.6, 'M6: no scissor flight to the clock room');
  assert.ok(walkRoute(lv('m06'), 'PRESENT', [19.5, 12, -28], [[19.7, -30.5], [11.2, -30.5]]).stuck, 'M6: in 2049 the servants\' stair is bricked up');
  // where the year is the answer, the wrong year does not carry Kai: the lab's glass in 2049, the 2049 chasm, the reflection out of step
  assert.ok(walkRoute(lv('m03'), 'PRESENT', [40.8, 0, -6], [[40.8, -1]]).stuck, 'M3: in 2049 the lab\'s south wall is glass');
  assert.ok((walkRoute(lv('m18'), 'PRESENT', [0, 0, -80], [[0, -66], [0, -54], [0, -40]]).at?.[1] ?? -99) < -1, 'M18: no way over the chasm in 2049');
  assert.ok((walkRoute(lv('m18'), 'FUTURE', [-16, 6, 108], [[-6, 108]]).at?.[1] ?? -99) < 1, 'M18: from the stump the first tilted floor is out of reach (its slabs are in the street)');
  assert.ok((walkRoute(lv('m19'), 'PRESENT', [0, 0, -18], [[0, -30], [0, -42]]).at?.[1] ?? -99) < -1, 'M19: the bridge is only a reflection');
  // (U8) the kitchen door is shut to those who did not warn anyone; the arena's gaps, once fallen; the street, the stream
  assert.ok(walkRoute(lv('m21'), 'PRESENT', [48, 0, 30], [[48, 27], [48, 21]]).stuck, 'M21: the kitchen door is shut');
  assert.ok((walkRoute(lv('m21'), 'PRESENT', lv('m21').landmarks.arenaMid, [[-15.1, -42.6], [-19.2, -41], [-23.2, -39.3], [-26.2, -37.3]], { arena_fallen: true }).at?.[1] ?? -99) < 10, 'M21: in 2049 the second gap is open air');
  assert.ok((walkRoute(lv('m23'), 'PRESENT', [2, 0, 140], [[2, 134], [2, 129], [2, 118]]).at?.[1] ?? -99) < -3, 'M23: the street has fallen in 2049');
  assert.ok((walkRoute(lv('m23'), 'PAST', [2, 0, 140], [[2, 129], [2, 124], [2, 118]]).at?.[1] ?? -99) < -3, 'M23: in 2026 only its south half stands');
  assert.ok((walkRoute(lv('m23'), 'PRESENT', [0, 0, 68], [[0, 60], [0, 52]]).at?.[1] ?? -99) < -0.5, 'M23: the settlement bridge is in the stream');
  // the river in Mission 5: in the abandoned year its footbridge is gone, in the thriving year it carries Kai over
  const m5 = lv('m05');
  const [sx, , sz] = m5.landmarks.footbridgeS, n = m5.landmarks.footbridgeN;
  assert.ok(walkRoute(m5, 'PAST', [sx, 0, sz], [[n[0], n[2]]]).at?.[1] > 0, 'THRIVING: over the footbridge');
  assert.ok(walkRoute(m5, 'PRESENT', [sx, 0, sz], [[n[0], n[2]]]).at?.[1] === undefined || walkRoute(m5, 'PRESENT', [sx, 0, sz], [[n[0], n[2]]]).at[1] < -1, 'ABANDONED: into the river');
});

// a quarter's spawn is also where a setback and a load put Kai: never inside a stair or a wall (a step's rise is fine)
test('every quarter of the Prologue and Act I spawns Kai clear of colliders (M8\'s arcade was on the office stair)', () => {
  let n = 0;
  for (const { deck, level } of PLACED) {
    if (!(deck.n <= 8)) continue;
    for (const q of level.quarters) {
      const [x, y, z] = q.spawn;
      const hit = level.elements.filter((e) => e.solid !== false && !e.when && !e.e && e.box[0] < x + 0.35 && e.box[3] > x - 0.35 && e.box[2] < z + 0.35 && e.box[5] > z - 0.35 && e.box[4] > y + 0.4 && e.box[1] < y + 1.7);
      assert.equal(hit.length, 0, `${deck.mkey}: ${q.name}'s spawn ${JSON.stringify(q.spawn)} is inside ${JSON.stringify(hit.map((e) => e.box))}`);
      n++;
    }
  }
  assert.ok(n >= 25, `${n} spawns`);
});

// Helix's wings build round a mission's rooms: the storeys over a room stand on its roof, never over empty ground
test('Helix: no wing storey hangs in the air; every raised panel block stands on a room (Missions 2, 3 and 12)', () => {
  let n = 0;
  for (const key of ['m02', 'm03', 'm12']) {
    const l = PLACED.find((p) => p.deck.mkey === key).level;
    const rooms = l.order.filter((id) => id !== l.outdoorRoom).flatMap((id) => l.rooms[id].bounds);
    for (const v of l.vis.filter((x) => x.m === 'helixPanel' && x.b && x.b[1] > 3)) {
      const [x0, y0, z0, x1, , z1] = v.b;
      let tot = 0, held = 0;
      for (let x = x0 + 0.25; x < x1; x += 0.5) for (let z = z0 + 0.25; z < z1; z += 0.5) { tot++; if (rooms.some((r) => x >= r[0] && x <= r[3] && z >= r[2] && z <= r[5] && r[4] <= y0 + 0.5)) held++; }
      assert.ok(held / tot >= 0.9, `${key}: ${JSON.stringify(v.b)} stands on rooms for ${((100 * held) / tot).toFixed(0)}% of it`);
      n++;
    }
  }
  assert.ok(n >= 10, `${n} raised blocks`);
});

// Helix Court is the hub of Missions 2 and 3 (OVERHAUL.md §4.6): rooms with doors onto it, a terrace on a roof, a control
// room on the top floor, each raised room on the wing's own storeys; and the court never sends Kai back past a door
test('Helix: the court is the hub of Mission 2; the plant terrace is on a roof and the control room on the top floor', () => {
  const m2 = PLACED.find((p) => p.deck.mkey === 'm02').level, m3 = PLACED.find((p) => p.deck.mkey === 'm03').level;
  const ok = (l, st, start, route, y, facts = {}) => {
    const r = walkRoute(l, st, start, route, facts);
    assert.ok(!r.stuck && Math.abs(r.at[1] - y) < 0.6, `${JSON.stringify(route.slice(-1))} ${JSON.stringify(r)}`);
  };
  // M2: out of the lobby onto the court in the storm, along it into the dark gallery; from the court into the staff lounge
  ok(m2, 'PRESENT', [-48, 0, 38.4], [[-44.5, 32], [-40, 32], [-34, 32], [-34, 16.7], [-41, 16.7], [-45, 16.7]], 0);
  ok(m2, 'PRESENT', [-30, 0, -25], [[-40, -36], [-40, -42.3], [-46, -42.3]], 0);
  // up the gallery's stair to the plant terrace on the first-floor roof (4.5 m), and down to the lounge
  ok(m2, 'PRESENT', [-46, 0, 12], [[-46, 2], [-48, 0], [-48, -12]], 4.5);
  ok(m2, 'PRESENT', [-48, 4.5, -12], [[-49.5, -24], [-49.5, -27], [-48, -28.5], [-48, -36]], 0);
  assert.ok(Math.abs(m2.rooms.power.spawn[1] - 0.86 - 4.5) < 0.01 && m2.rooms.power.sky === 'open', 'the plant terrace: 4.5 m up, open to the storm');
  // M3: up the service yard's stair to the control room on the north wing's top floor (9 m)
  ok(m3, 'PRESENT', [41.3, 0, -41.6], [[30, -41.6], [21, -41.6], [12, -41.6], [8, -41.6]], 9);
  // and where there is no door the walls hold: the lobby's glass, the gallery's alcove, the conduit hall, the archive and
  // the lift (past the officer's door) from the court, the blocks the raised rooms stand on
  for (const [l, start, to] of [[m2, [-48, 0, 38.4], [[-44, 37], [-36, 37]]], [m2, [-34, 0, 9], [[-44, 9]]], [m2, [-25, 0, -30], [[-25, -45]]], [m2, [-2, 0, -30], [[-2, -45]]],
    [m2, [14, 0, -30], [[14, -45]]], [m2, [-35, 0, -18], [[-48, -18]]], [m3, [4, 0, -30], [[4, -45]]]]) assert.ok(walkRoute(l, 'PRESENT', start, to).stuck, `no way through from ${start} to ${JSON.stringify(to)}`);
  // each raised room stands on a solid block from the ground to its floor slab
  for (const [l, id] of [[m2, 'power'], [m3, 'control']]) {
    const [x0, z0, x1, z1] = l.rooms[id].rect, base = l.rooms[id].spawn[1] - 0.86;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    assert.ok(l.elements.some((e) => e.solid && !e.when && e.box[1] <= 0 && Math.abs(e.box[4] - (base - 0.4)) < 0.05 && cx > e.box[0] && cx < e.box[3] && cz > e.box[2] && cz < e.box[5]), `${id}: stands on the wing's storeys`);
  }
  // the court resolves to no room's checkpoint (main.js keeps the last one Kai stood in): never into the chamber, nor
  // past the officer's door into the conduit hall
  const inB = (b, p) => p[0] >= b[0] && p[0] < b[3] && p[1] >= b[1] && p[1] < b[4] && p[2] >= b[2] && p[2] < b[5];
  for (const p of [[0, 0.86, -25], [-25, 0.86, 0], [-30, 0.86, -25], [-36, 0.86, 30], [20, 0.86, -20], [-12, 0.86, -36]]) {
    const cps = m2.checkpoints.filter((c) => c.room === m2.outdoorRoom && inB(c.box, p));
    assert.deepEqual(cps.map((c) => c.spawn), [], `M2 court ${p}: no checkpoint`);
  }
  for (const p of [[0, 0.86, -25], [20, 0.86, -20], [-20, 0.86, 0]]) {
    const cps = m3.checkpoints.filter((c) => c.room === m3.outdoorRoom && inB(c.box, p));
    assert.deepEqual(cps.map((c) => c.spawn), [], `M3 court ${p}: no room's checkpoint`);
  }
  assert.ok(m3.checkpoints.some((c) => c.room === m3.outdoorRoom && inB(c.box, [0, 0.86, 30])), 'M3: the dig is a quarter of the court, with its checkpoint');
});

// Mission 7: the bible's "rooftops, rotating platforms and an exterior ring". The turntables turn, and their gangways
// bridge the gaps only while they point across them (places/turntables.js); at the first sky they turn, in 2049 they
// are seized pointing at nothing, by 2196 they have fallen. The roofs come down to the first one
test('Mission 7: the turntables turn; a gangway bridges its gap only while it points across, and only at the first sky', async () => {
  const { armAngle, bridging, armSteps } = await import('../game/js/editions/lastversion/places/turntables.js');
  const l = PLACED.find((p) => p.deck.mkey === 'm07').level;
  assert.equal(l.turntables.length, 2);
  for (const tt of l.turntables) {
    const on = (st) => { let n = 0; for (let t = 0; t < 20; t += 0.05) if (bridging(tt, st, t)) n++; return n * 0.05; };
    assert.ok(on('PAST') >= 5.9 && on('PAST') <= 7, `${tt.id}: at the first sky it bridges ${on('PAST').toFixed(1)} s in every 20`);
    assert.equal(on('PRESENT'), 0, `${tt.id}: seized in 2049, pointing at nothing`);
    assert.equal(on('FUTURE'), 0, `${tt.id}: fallen by 2196`);
    assert.equal(armAngle(tt, 'FUTURE', 3), null);
    const angles = new Set(); for (let t = 0; t < 20; t += 1) angles.add(Math.round(armAngle(tt, 'PAST', t) * 10)); assert.ok(angles.size > 8, `${tt.id}: it turns all the way round`);
  }
  // walked with the Player physics: with the gangway across, from each turntable up onto the next; without it, no way
  const steps = (i) => armSteps(l.turntables[i]).map((b) => ({ box: b, solid: true }));
  const withArm = (...i) => ({ ...l, elements: [...l.elements, ...i.flatMap(steps)] });
  const up1 = walkRoute(withArm(0), 'PAST', [-47, 2, -4], [[-44, -4], [-40, -4], [-38, -4]]);
  assert.ok(!up1.stuck && Math.abs(up1.at[1] - 4) < 0.3, `over the first gangway onto the second turntable: ${JSON.stringify(up1)}`);
  const up2 = walkRoute(withArm(1), 'PAST', [-33, 4, -4], [[-30, -4], [-26, -4], [-24, -4]]);
  assert.ok(!up2.stuck && Math.abs(up2.at[1] - 6) < 0.3, `over the second gangway onto the third: ${JSON.stringify(up2)}`);
  for (const st of ['PAST', 'PRESENT', 'FUTURE']) {
    const no = walkRoute(l, st, [-47, 2, -4], [[-44, -4], [-40, -4], [-38, -4]]);
    assert.ok(no.stuck || no.at[1] < 3, `${st}, no gangway across: not onto the second turntable (${JSON.stringify(no)})`);
  }
  // the second turntable is where the thread "over the roofs to the turning platforms" is done: not from the ground
  const go = l.triggers.find((t) => t.set?.t_m07_roofs);
  const inB = (b, p) => p[0] >= b[0] && p[0] < b[3] && p[1] >= b[1] && p[1] < b[4] && p[2] >= b[2] && p[2] < b[5];
  assert.ok(go && inB(go.box, [-36, 4.86, -4]) && !inB(go.box, [-36, 0.86, 3]) && !inB(go.box, [-50, 2.86, -4]), 'the platforms\' thread: on the second turntable, not under it or on the first');
  // over the astronomers' roofs: the highest roof comes down to the first turntable
  const roofs = walkRoute(l, 'PAST', [-50, 4.4, 22], [[-53, 20], [-53, 10], [-53, 1.5], [-50, -3]]);
  assert.ok(!roofs.stuck && Math.abs(roofs.at[1] - 2) < 0.3, `from the roofs down to the first turntable: ${JSON.stringify(roofs)}`);
});

// the Zero Second waits for Rook's call (checkpoint_passed && rook_message): no way into the plaza may miss the call
test('Mission 1: Rook\'s call spans the whole street between home and the plaza, wall to wall and up to the roofs', () => {
  const l = PLACED.find((p) => p.deck.mkey === 'm01').level;
  const [bx0, , bx1] = l.bounds;
  const call = l.triggers.find((t) => t.set?.rook_message);
  const [home, plaza] = l.quarters;
  assert.ok(call.box[0] <= bx0 && call.box[3] >= bx1, `x ${call.box[0]}..${call.box[3]} covers the place's ${bx0}..${bx1}`);
  assert.ok(call.box[1] <= 0 && call.box[4] >= 25, 'from the street up past the roofs');
  assert.ok(call.box[2] < home.area[1] && call.box[5] > home.area[1] && plaza.area[3] === home.area[1], 'on the line between the two quarters');
  assert.ok(l.triggers.find((t) => t.set?.zero_second).when.includes('rook_message'));
});

test('Mission 4: the pictograms are carved on standing stones, in both years; the carved lintel stands only in the village', () => {
  const l = PLACED.find((p) => p.deck.mkey === 'm04').level;
  for (const m of ['pictoFire', 'pictoWater', 'pictoRing']) {
    const g = l.vis.find((v) => v.m === m);
    const stone = l.vis.find((v) => v.k === 'obox' && v.m === 'drystone' && v.x === g.x && v.z === g.z);
    assert.ok(stone && stone.y <= 0 && stone.y + stone.h >= g.y && stone.w >= g.w && !stone.e && !g.e, `${m}: on a stone from the ground (${JSON.stringify(stone)})`);
    assert.ok(l.elements.some((e) => e.box[0] <= g.x && e.box[3] >= g.x && e.box[2] <= g.z && e.box[5] >= g.z && e.box[1] <= 0 && e.solid !== false), `${m}: its stone is solid`);
  }
  const lintel = l.vis.find((v) => v.m === 'glyphStone' && v.x === -46 && v.z === 69);
  assert.deepEqual(lintel?.e, ['PRESENT'], 'BEFORE THE FIRE nothing is built');
  assert.equal(l.interactables.find((i) => i.scene === 'frag_door').when, '@PRESENT', 'the lintel is read where it stands');
});

// main.js keeps the last checkpoint Kai stands in (stepDeck); Threads.quarters names the quarter he is in
test('every quarter is somewhere to come back to: at its spawn, its spawn is the checkpoint; M6\'s floors are quarters of their own', async () => {
  const { Threads } = await import('../game/js/editions/lastversion/Threads.js');
  const inB = (b, p) => p[0] >= b[0] && p[0] < b[3] && p[1] >= b[1] && p[1] < b[4] && p[2] >= b[2] && p[2] < b[5];
  const checkpoint = (level, p) => { let r = null; for (const c of level.checkpoints) if (c.room === level.outdoorRoom && inB(c.box, p)) r = c; return r?.spawn.slice(0, 3); };
  const quarter = (level, p) => {
    const t = Object.assign(new Threads({ g: { campaign: { quarter: 99 }, player: { pos: { x: p[0], y: p[1], z: p[2] } }, room: level.outdoorRoom } }), { level, deck: { name: 'M' } });
    t.quarters();
    return t.here;
  };
  for (const { deck, level } of PLACED) {
    for (const q of level.quarters) {
      const a = [q.spawn[0], q.spawn[1] + 0.86, q.spawn[2]];
      assert.deepEqual(checkpoint(level, a), a, `${deck.mkey}: standing at ${q.name}'s spawn`);
    }
  }
  // Mission 6: the shop floor, the galleries and the clock room stand one over another. The brass arm's setback on the
  // shop floor goes back to the cellar stair, not up to the clock room; reaching the shop floor is not reaching the roof
  const m6 = PLACED.find((l) => l.deck.mkey === 'm06').level;
  const at = (n) => [m6.landmarks[n][0], m6.landmarks[n][1] + 0.86, m6.landmarks[n][2]];
  const sp = m6.quarters.map((q) => [q.spawn[0], q.spawn[1] + 0.86, q.spawn[2]]);
  for (const [n, qi] of [['shopFloor', 0], ['shopWindows', 0], ['floorboards', 1], ['galleries', 1], ['ezraBench', 1], ['clockRoom', 2], ['roofTerrace', 2]]) {
    const p = n === 'shopWindows' ? [12, 0.86, -17] : at(n);
    assert.deepEqual(checkpoint(m6, p), sp[qi], `M6 ${n}: the checkpoint of quarter ${qi}`);
    assert.equal(quarter(m6, p), qi, `M6 ${n}: in quarter ${qi}`);
  }
  assert.equal(quarter(m6, [0, 0.86, 30]), 0, 'M6: the canal street is the first quarter');
});

// deep water takes Kai back to the last checkpoint (places/mount.js); one under the same water would take him back in
test('deep water never returns Kai into deep water: every checkpoint has a year of its mission that leaves it dry, the mission\'s own first in M5', async () => {
  const { underWater } = await import('../game/js/editions/lastversion/places/Place.js');
  let wet = 0;
  for (const { deck, level } of PLACED) {
    const drowns = (level.drowns || []).map((d) => ({ ...d, cond: d.when ? compileCondition(d.when) : null }));
    if (!drowns.length) continue;
    const facts = [...new Set(drowns.flatMap((d) => (d.when || '').match(/\b[a-z_][a-z0-9_]*\b/g) || []))];
    for (const all of [false, true]) {
      const fact = (k) => (facts.includes(k) ? all : undefined);
      for (const c of level.checkpoints.filter((k) => k.room === level.outdoorRoom)) {
        const wetIn = deck.states.filter((s) => underWater(drowns, c.spawn, { fact, state: s }));
        wet += wetIn.length;
        assert.ok(wetIn.length < deck.states.length, `${deck.mkey}: the checkpoint ${JSON.stringify(c.spawn)} is under water in every year`);
      }
    }
  }
  assert.ok(wet > 0, 'some checkpoints are under water in some year (M5 FLOODED)');
  // Mission 5: FLOODED covers the village gate (before the wall is braced) and the low bank (before the gate is released);
  // the drown setback takes the place back to ABANDONED there, the mission's own year
  const m5 = PLACED.find((l) => l.deck.mkey === 'm05').level;
  const drowns = m5.drowns.map((d) => ({ ...d, cond: d.when ? compileCondition(d.when) : null }));
  const gate = m5.quarters[1].spawn, bank = m5.quarters[2].spawn;
  for (const s of [gate, bank]) {
    const a = [s[0], s[1] + 0.86, s[2]];
    assert.ok(underWater(drowns, a, { fact: () => false, state: 'FUTURE' }), 'FLOODED: under water');
    assert.ok(!underWater(drowns, a, { fact: () => false, state: 'PRESENT' }), 'ABANDONED: dry');
  }
  assert.ok(!underWater(drowns, [gate[0], gate[1] + 0.86, gate[2]], { fact: (k) => k === 'wall_braced', state: 'FUTURE' }), 'the braced wall holds the flood off the gate');
  const src = fs.readFileSync('game/js/editions/lastversion/places/mount.js', 'utf8');
  assert.ok(/underWater\(drowns, cp, c\)/.test(src) && /rt\.home\(\)/.test(src), 'mount.js checks the checkpoint and goes back to a dry year');
});

// what main.js takes from a place's year: the light (edition.themeFor) and where the sun shines from (edition.sunDir)
test('every year of a place lights main.js: a full theme and a sun direction, the same objects every frame', async () => {
  const { themeFor, sunDir } = await import('../game/js/editions/lastversion/places/index.js');
  for (const { deck, s, level } of PLACED) {
    for (const st of deck.states) {
      const th = themeFor(level, st), sd = sunDir(level, st);
      for (const k of ['fog', 'sky', 'ground', 'hemi', 'sun', 'sunColor', 'density', 'device']) assert.ok(Number.isFinite(th[k]), `${deck.mkey}/${s} ${st}: theme.${k}`);
      assert.ok(sd.length === 3 && Math.abs(Math.hypot(...sd) - 26) < 1e-6 && sd[1] > 0, `${deck.mkey}/${s} ${st}: the sun above the horizon for the shadows`);
      assert.ok(themeFor(level, st) === th && sunDir(level, st) === sd, `${deck.mkey} ${st}: no new object per frame`);
    }
    assert.equal(themeFor(level, 'NOPE'), null);
  }
  assert.equal(themeFor({}, 'PRESENT'), null, 'outside a place, main.js keeps its own themes');
  // outside a place the edition hands main.js its own default sun back (main.js keeps the last offset it is given)
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: { room: null }, def: LV, level: null });
  assert.deepEqual([...rt.sunDir()], [6, 24, 9], 'no place: the default sun, not the last place\'s');
  rt.level = { place: 'x', years: {} };
  assert.deepEqual([...rt.sunDir()], [6, 24, 9], 'a level without years: the default sun');
  assert.ok(/this\._sunOff = new THREE\.Vector3\(6, 24, 9\)/.test(fs.readFileSync('game/js/main.js', 'utf8')), 'the same default as main.js');
});

// a 'tasks' beat stands each task at its landmark; a name the place does not have is an error, never a task at NaN
test('a tasks beat puts every task at a finite point, and a landmark the place lacks is an error', () => {
  const game = { engine: engine(), facts: new FactStore(), story: null };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory('prologue');
  const deck = game.story.decks[0];
  const tasks = (...at) => ({ ...deck, beats: [{ kind: 'tasks', tasks: at.map((a, i) => ({ at: a, prompt: `TASK ${i}` })) }] });
  game.story.decks[0] = tasks('door4B', 'tramStop', [3, -20]);
  const level = rt.buildLevel({ lv: true, chapter: 'prologue', deck: 0, sector: 0, flags: {} });
  const ts = level.interactables.filter((i) => i.task !== undefined);
  assert.equal(ts.length, 3);
  for (const t of ts) assert.ok(t.pos.every(Number.isFinite), `task ${t.task} at ${t.pos}`);
  game.story.decks[0] = tasks('door4B', 'tramStpo');
  assert.throws(() => rt.buildLevel({ lv: true, chapter: 'prologue', deck: 0, sector: 0, flags: {} }), /no landmark tramStpo/);
  game.story.decks[0] = deck;
});

// THINK (H): Kai answers from the mission's own thoughts, never ZoneGen's challenge-hint table
test('THINK answers in every mission of the Prologue and Act I, and in Mission 11 before and after REVERSE', () => {
  for (const ch of ['prologue', 'act1', 'act2']) {
    const game = { engine: engine(), facts: new FactStore(), story: null, campaign: { lv: true, chapter: ch, deck: 0, sector: 0, flags: {} } };
    const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
    game.story = rt.makeStory(ch);
    const said = [];
    Object.assign(game, { audio: { blip() {} }, hud: { say: (lines) => said.push(...lines.map((l) => l.text)) }, deckWorld: { flags: {} }, player: { pos: new THREE.Vector3() } });
    game.story.decks.forEach((deck, d) => {
      if (ch === 'act2' && deck.n !== 11) return;
      for (let s = 0; s < deck.sectors; s++) {
        Object.assign(game.campaign, { deck: d, sector: s });
        rt.level = rt.buildLevel(game.campaign);
        game.room = rt.level.outdoorRoom || rt.level.order[0];
        for (const inv of [false, true]) {
          game.facts.set('has_inversion', inv);
          const n = said.length;
          assert.doesNotThrow(() => rt.hint(), `${deck.mkey}/${s}`);
          assert.ok(said.length === n + 1 && said[n], `${deck.mkey}/${s}: a thought`);
        }
      }
      if (Array.isArray(MISSIONS[ch][d].hints)) assert.equal(game.story.decks[d].thoughts, MISSIONS[ch][d].hints, `${deck.mkey}: its own thoughts`);
    });
  }
});

test('the Chronolith has the edition\'s three forms and stands in them: stone (the village), the black ring (Helix), the broken halo (2196); in 2026 Helix\'s cradle waits for it', async () => {
  const { makeChronolith } = await import('../game/js/editions/lastversion/Build.js');
  for (const k of ['stone', 'helix', 'halo', 'cradle']) assert.equal(makeChronolith(1, k).userData.kind, k);
  assert.ok(!makeChronolith(1, 'cradle').userData.halo, 'an empty cradle has no light');
  const model = (key, id) => PLACED.find((l) => l.deck.mkey === key).level.interactables.find((i) => i.id === id)?.model?.();
  assert.equal(model('m02', 'scene_chronolith')?.userData.kind ?? model('m02', 'chronolith')?.userData.kind, 'helix', 'Mission 2: the black ring');
  const m3 = PLACED.find((l) => l.deck.mkey === 'm03').level.interactables.find((i) => i.model && /touch/.test(i.id + i.scene))?.model();
  assert.ok(m3?.userData.setEra, 'Mission 3: one model, a form per year');
  const shown = (st) => { m3.userData.setEra(st); return m3.children.find((c) => c.visible)?.userData.kind; };
  // (in 2026 the ring is still in the ground at the dig, where the excavation log says it was found: U6 review)
  assert.deepEqual(['PRESENT', 'PAST', 'FUTURE'].map(shown), ['helix', 'cradle', 'halo'], 'Mission 3: its empty cradle in 2026, broken into a halo by 2196');
  assert.equal(model('m04', 'chronolith_m04')?.userData.kind, 'stone', 'Mission 4: the ring as the village keeps it');
  for (const f of fs.readdirSync('game/js/editions/lastversion').filter((n) => n.endsWith('.js'))) assert.ok(!/makeMachineRing/.test(fs.readFileSync(`game/js/editions/lastversion/${f}`, 'utf8')), `${f}: no Station Zero lab ring`);
});

// --- casting, crowds and watchers (OVERHAUL.md §6) -------------------------------------------------------
const MODEL_OF = (key) => LV_MODELS[key] || SHARED_MODELS[key];
const SEX = { her: 'f', his: 'm' };
const allNamed = () => Object.values(NPCS).filter((n) => !n.resolve);

test('every NPC is cast: a model whose file exists, a defined variant, a height, a recorded-voice id and a walk', () => {
  for (const n of Object.values(NPCS)) {
    if (n.resolve) {
      // the Director of Continuity: whoever rook_fate made them, or an empty chair with a recorder
      for (const r of n.resolve) assert.ok(r.as ? NPCS[r.as] && hasVariant(NPCS[r.as].model, r.variant) : r.chair, `director: ${JSON.stringify(r)}`);
      continue;
    }
    const m = MODEL_OF(n.model);
    assert.ok(m, `${n.id}: model ${n.model}`);
    assert.ok(fs.existsSync(`game/assets/characters/${m.file}`), `${n.id}: ${m.file} exists`);
    assert.ok(hasVariant(n.model, n.variant), `${n.id}: ${n.model} has a variant ${n.variant}`);
    assert.ok(n.height >= 1.2 && n.height <= 1.9 && n.walk > 0.5 && n.walk < 1.2, `${n.id}: height ${n.height}, walk ${n.walk}`);
    assert.ok(n.vid === null || /^[A-Z0-9]+$/.test(n.vid), `${n.id}: vid ${n.vid}`);
  }
  for (const id of ['kai', 'mira', 'witness', 'sera', 'rook', 'niko', 'anja', 'iven', 'jun', 'tala', 'mara', 'orren', 'child', 'guard', 'odile', 'florist']) assert.ok(NPCS[id].vid, `${id} speaks with a recorded voice of their own`);
});

test('pronouns match the body: every NPC, every hand-placed passer-by, every person a level casts', () => {
  for (const n of allNamed()) if (sexOf(n.model) !== 'n') assert.equal(SEX[n.pronoun?.their], sexOf(n.model), `${n.id} (${n.pronoun?.their}) on ${n.model}`);
  for (const [id, a] of Object.entries(AMBIENT_CAST)) assert.equal(a.pronoun, sexOf(a.model), id);
  for (const { deck, s, level } of LEVELS) {
    for (const n of level.npcs) {
      const c = level.cast.find((x) => x.id === n.crew);
      assert.ok(c, `${deck.mkey}/${s}: ${n.id} is cast`);
      if (!c.model || sexOf(c.model) === 'n') continue;
      assert.equal(SEX[(n.pronoun || c.pronoun)?.their], sexOf(c.model), `${deck.mkey}/${s}: ${n.id} on ${c.model}`);
    }
  }
  // (U4 review) and what is said of them: Mission 1's toy child is a boy on screen, so the narrator says "his hand"
  const toy = M01.scenes.toy.lines.map((l) => l.text).join(' ');
  const [own, other] = AMBIENT_CAST.amb_child.pronoun === 'm' ? ['his', 'her'] : ['her', 'his'];
  assert.ok(new RegExp(`\\b${own}\\b`).test(toy) && !new RegExp(`\\b${other}\\b`).test(toy), `the toy scene says ${own}: ${toy}`);
});

test('the checkpoint officer is Officer Pryce on rb_security_f; the renames and the new people', () => {
  assert.equal(NPCS.guard.model, 'rb_security_f', 'the gatekeeper is a security officer, not a doctor');
  assert.equal(NPCS.guard.name, 'Officer Pryce');
  assert.equal(NPCS.pryce, NPCS.guard, 'pryce is kept as an alias of the same person');
  assert.match(NPCS.clockmaker.name, /Ezra Moll/);
  assert.equal(NPCS.clockmaker.model, 'rb_ezra');
  assert.equal(NPCS.soldier.name, 'Sergeant Brask');
  for (const id of ['odile', 'florist', 'receptionist', 'director', 'kai12', 'tomas']) assert.ok(NPCS[id], id);
  assert.ok(NPCS.patient.silent && NPCS.patient.hologram && NPCS.patient.model === 'rb_mira' && NPCS.patient.variant === 'gown', 'Ward 32: a silent figure of Mira in a gown');
  const m1 = LEVELS.find((l) => l.deck.mkey === 'm01').level;
  assert.equal(m1.cast.find((c) => c.id === 'guard').model, 'rb_security_f');
  assert.equal(m1.cast.find((c) => c.id === 'mira').variant, 'raincoat', 'M1: the woman in the rain');
  const m11 = LEVELS.find((l) => l.deck.mkey === 'm11' && l.level.npcs.some((n) => n.crew === 'patient')).level;
  assert.ok(m11.npcs.find((n) => n.crew === 'patient').silent && m11.npcs.some((n) => n.crew === 'odile' && !n.silent) && main.find((m) => m.n === 11).talks.odile.some((d) => d.lines.length >= 6),
    'M11: Odile speaks for Ward 32; its figure is silent');
  // (U4 review) the figure is in the ward, by its bed, once the lock is open, and in 2049 only (Mira was nine in 2026)
  const fig = m11.npcs.find((n) => n.crew === 'patient');
  const ward = m11.rooms.h_ward32.bounds[0];
  assert.ok(fig.room === 'h_ward32' && fig.pos[0] > ward[0] && fig.pos[0] < ward[3] && fig.pos[2] > ward[2] && fig.pos[2] < ward[5], `Ward 32's figure stands in the ward: ${fig.pos}`);
  const shows = (facts, st) => compileCondition(fig.when)({ fact: (k) => !!facts[k], state: st });
  assert.ok(!shows({}, 'PRESENT') && shows({ lock_open: true }, 'PRESENT') && !shows({ lock_open: true }, 'PAST'), `Ward 32's figure waits for the lock, in 2049: ${fig.when}`);
});

test('Lin and Mira share one mesh, in different wardrobes; the Witness wears Kai\'s', () => {
  assert.equal(NPCS.researcher.model, NPCS.mira.model);
  assert.notEqual(NPCS.researcher.variant, NPCS.mira.variant);
  assert.equal(NPCS.witness.model, NPCS.kai.model);
  assert.notEqual(NPCS.witness.variant, NPCS.kai.variant);
});

test('every child is a child: the named children, the crowds\' children, the toy child', () => {
  for (const id of ['child', 'kai12', 'tomas']) assert.ok(isChild(NPCS[id].model), id);
  assert.ok(isChild(AMBIENT_CAST.amb_child.model), 'M1\'s toy child');
  for (const era of Object.keys(ERAS)) for (const [m] of ERAS[era].child || []) assert.ok(isChild(m), `${era} children: ${m}`);
  let kids = 0;
  for (const { deck, s, level } of LEVELS) {
    for (const n of level.npcs.filter((x) => x.crowd)) {
      const c = level.cast.find((x) => x.id === n.crew);
      // a crowd's child role wears a child's body, and a child's body is only ever a child
      if (c.crowdRole === 'child' || /child/i.test(n.first)) assert.ok(isChild(c.model), `${deck.mkey}/${s}: ${n.id} (${c.crowdRole}) on ${c.model}`);
      if (isChild(c.model)) {
        kids++;
        assert.ok(c.height < 1.45, `${deck.mkey}/${s}: ${n.id} is a child of ${c.height} m`);
      }
    }
  }
  assert.ok(kids > 0, 'children walk somewhere');
});

test('the settlement\'s women wear the mesh of whichever named woman is absent from the mission (Tala in M4, the Elder in M5)', () => {
  const women = (mkey) => {
    const out = new Set();
    for (const { level } of LEVELS.filter((l) => l.deck.mkey === mkey)) for (const n of level.npcs.filter((x) => x.crowd)) {
      const c = level.cast.find((x) => x.id === n.crew);
      if (ANCIENT_WOMEN.includes(c.model)) out.add(c.model);
    }
    return [...out].sort();
  };
  assert.deepEqual(women('m04'), ['rb_tala'], 'M4: the Elder is here, so the women are on Tala\'s mesh');
  assert.deepEqual(women('m05'), ['rb_elder'], 'M5: Tala is met here, so the women are on the Elder\'s mesh');
  assert.ok(women('m07').length && women('m07').every((m) => ANCIENT_WOMEN.includes(m)), 'M7: neither is here, so either mesh');
  assert.ok(!women('m23').includes('rb_tala'), 'Afterzero: Tala may stand on the road');
  assert.ok(!women('c_b').includes('rb_tala'), 'the gorge: Tala leads the case');
});

test('named faces stay out of crowds (but for the listed exceptions), and crowd faces never cross eras', () => {
  const named = new Set(allNamed().map((n) => n.model));
  for (const era of Object.keys(ERAS)) for (const m of eraModels(era)) assert.ok(!named.has(m) || EXCEPTIONS.includes(m), `${era}: ${m} is a named face`);
  const [pr, an, fu] = ['present', 'ancient', 'future'].map(eraModels);
  for (const m of pr) assert.ok(!an.has(m) && (!fu.has(m) || m === 'rb_child_m2'), `present and other eras share ${m}`);
  for (const m of an) assert.ok(!fu.has(m), `ancient and 2196 share ${m}`);
  // the settlement's women: whichever named woman is not in the mission
  for (const { deck, s, level } of LEVELS) {
    const here = new Set(level.npcs.filter((n) => !n.crowd && NPCS[n.crew]).map((n) => level.cast.find((c) => c.id === n.crew)?.model));
    for (const n of level.npcs.filter((x) => x.crowd)) {
      const c = level.cast.find((x) => x.id === n.crew);
      // (the Place Outside Time's echoes are people Kai has met: their own faces, as holograms, by their names)
      if (c.met) {
        assert.ok(n.hologram && MET.includes(c.met) && c.model === NPCS[c.met].model && c.first === NPCS[c.met].first, `${deck.mkey}/${s}: ${n.id} is an echo of ${c.met}`);
        continue;
      }
      assert.ok(!here.has(c.model) || c.model === 'rb_child_m2' && c.era !== 'ancient', `${deck.mkey}/${s}: ${c.model} is in the crowd and among the named`);
      assert.ok(eraModels(c.era).has(c.model), `${deck.mkey}/${s}: ${c.model} is not of the ${c.era} era`);
    }
  }
});

test('crowds walk every mission\'s place: neighbours differ, heights and paces vary a little, within the budget', () => {
  const byMission = {};
  for (const { deck, s, level } of LEVELS) {
    const crowd = level.npcs.filter((n) => n.crowd);
    byMission[deck.mkey] = (byMission[deck.mkey] || 0) + crowd.length;
    assert.ok(level.npcs.length <= MAX_PEOPLE, `${deck.mkey}/${s}: ${level.npcs.length} people`);
    for (let i = 1; i < crowd.length; i++) {
      const a = level.cast.find((c) => c.id === crowd[i - 1].crew), b = level.cast.find((c) => c.id === crowd[i].crew);
      if (crowd[i - 1].when === crowd[i].when) assert.ok(a.model !== b.model || a.variant !== b.variant, `${deck.mkey}/${s}: neighbours ${a.id} and ${b.id} are both ${a.model}/${a.variant}`);
    }
    for (const n of crowd) {
      const c = level.cast.find((x) => x.id === n.crew);
      const base = MODEL_OF(c.model).height || 1.75;
      assert.ok(Math.abs(c.height / base - 1) <= 0.041 && c.walk > 0.7 && c.walk < 1.1, `${deck.mkey}/${s}: ${n.id} height ${c.height} (${base}), walk ${c.walk}`);
      assert.ok(hasVariant(c.model, c.variant), `${deck.mkey}/${s}: ${c.model}/${c.variant}`);
      if (n.path) assert.ok(n.path.length >= 2 && n.speed > 0, `${deck.mkey}/${s}: ${n.id} walks`);
    }
  }
  for (const [k, n] of Object.entries(byMission)) assert.ok(n > 0, `${k}: a crowd somewhere in the mission`);
  // Rain City in the rain: umbrellas, darker wet clothes
  const m1 = LEVELS.find((l) => l.deck.mkey === 'm01').level;
  const wet = m1.cast.filter((c) => c.crowd && c.dark);
  assert.ok(wet.length && wet.some((c) => c.props.includes('umbrella')), 'M1: umbrellas and wet clothes');
  assert.ok(m1.npcs.filter((n) => n.crowd).every((n) => n.freezeWhen === 'zero_second && !after_zero'), 'M1: the crowds stop with the clocks');
});

// (U4 review) DeckWorld walks a crowd in x and z only; Runtime.step sets each walker's height from the two waypoints it
// walks between (crowds.js groundOf). Walked here leg by leg, as the game walks them, in every year each one shows in.
// (U4 review) a crowd is not copies of a few faces: at most CAP of one face a year in a place (the helmeted troopers and
// holograms aside), and in 2026/2049 and 2196 no crowd wears the face of someone placed by hand in the same place
test('crowds are not clones: one face at most twice a year in a place, and never a hand-placed person\'s', () => {
  for (const { deck, s, level } of LEVELS) {
    const states = level.states || deck.states || ['PRESENT'];
    const placed = new Set(level.npcs.filter((n) => n.ambient && !n.crowd).map((n) => level.cast.find((c) => c.id === n.crew)?.model).filter((m) => m && !isChild(m)));
    const count = {};
    for (const n of level.npcs.filter((x) => x.crowd && !x.hologram)) {
      const c = level.cast.find((x) => x.id === n.crew);
      if (c.model === 'rb_trooper') continue;
      if (c.era !== 'ancient') assert.ok(!placed.has(c.model), `${deck.mkey}/${s}: ${n.id} wears ${c.model}, a face placed by hand here`);
      const ys = (n.when || '').match(/@(PRESENT|PAST|FUTURE)/g)?.map((y) => y.slice(1)) || states;
      for (const y of ys) {
        const k = `${c.model}@${y}`;
        count[k] = (count[k] || 0) + 1;
        assert.ok(count[k] <= CAP, `${deck.mkey}/${s}: ${count[k]} crowd people wear ${c.model} in ${y}`);
      }
    }
  }
  // the Place Outside Time's echoes are people Kai has met
  const m19 = LEVELS.find((l) => l.deck.mkey === 'm19').level;
  const echoes = m19.npcs.filter((n) => n.crowd).map((n) => m19.cast.find((c) => c.id === n.crew));
  assert.ok(echoes.length >= 3 && echoes.every((c) => c.met), `M19's echoes: ${echoes.map((c) => c.first)}`);
  // Mission 10's twelve prisoners in the loop cells, flickering, until Kai releases them
  const m10 = LEVELS.find((l) => l.deck.mkey === 'm10').level;
  const pris = m10.npcs.filter((n) => n.crowd && m10.cast.find((c) => c.id === n.crew).crowdRole === 'prisoner');
  const looping = pris.filter((n) => /!prisoners_freed/.test(n.when)), freed = pris.filter((n) => !/!prisoners_freed/.test(n.when));
  assert.ok(looping.length === 12 && looping.every((n) => n.flicker && n.pos[2] > 21 && n.pos[2] < 27), `M10: ${looping.length} prisoners in the cells`);
  // (U7 review) released, some walk out of the cells toward the yard door; held, they stay
  assert.ok(freed.length >= 3 && freed.every((n) => /prisoners_freed/.test(n.when) && !n.flicker && n.path?.length > 1), `M10: ${freed.length} walk out once freed`);
});

test('crowd walkers keep to the ground: no floating off a terrace, no sinking into a plaza, no walking through a wall', () => {
  const holds = (when, st, v) => !when || !!compileCondition(when)({ fact: () => v, state: st });
  let walkers = 0, metres = 0;
  for (const { deck, s, level } of LEVELS) {
    const crowd = level.npcs.filter((n) => n.crowd && n.path);
    if (!crowd.length) continue;
    const states = (level.states || deck.states || ['PRESENT']).filter((st) => !level.years || level.years[st]);
    const solids = level.elements.filter((e) => e.solid && e.box);
    const grid = new Map();
    solids.forEach((e, i) => {
      const b = e.box;
      for (let gx = Math.floor((b[0] - 0.5) / 2); gx <= Math.floor((b[3] + 0.5) / 2); gx++) for (let gz = Math.floor((b[2] - 0.5) / 2); gz <= Math.floor((b[5] + 0.5) / 2); gz++) {
        const k = `${gx},${gz}`;
        (grid.get(k) || grid.set(k, []).get(k)).push(e);
      }
    });
    const near = (x, z) => grid.get(`${Math.floor(x / 2)},${Math.floor(z / 2)}`) || [];
    for (const n of crowd) {
      walkers++;
      const P = n.path;
      assert.ok(P.length >= 2 && P.every((p) => p.length === 3 && Number.isFinite(p[2])), `${deck.mkey}/${s}: ${n.id}'s waypoints carry the ground's height`);
      let sts = states.filter((st) => holds(n.when, st, false) || holds(n.when, st, true));
      if (!sts.length) sts = states;
      // where it stands is on the leg it starts on (from the last waypoint to the first), at that leg's height there
      const a0 = P[P.length - 1], b0 = P[0];
      const L0 = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]);
      const f0 = L0 > 1e-3 ? 1 - Math.hypot(b0[0] - n.pos[0], b0[1] - n.pos[2]) / L0 : 1;
      assert.ok(Math.abs(n.pos[1] - (a0[2] + (b0[2] - a0[2]) * f0)) < 0.03, `${deck.mkey}/${s}: ${n.id} stands at ${n.pos[1]}, off its route's height`);
      for (const st of sts) {
        for (let i = 0; i < P.length; i++) {
          const a = P[(i + P.length - 1) % P.length], b = P[i];
          const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const dy = Math.abs(b[2] - a[2]);
          assert.ok(dy <= 0.41 && (dy < 0.03 || L < 0.6), `${deck.mkey}/${s}: ${n.id} climbs ${dy.toFixed(2)} m over ${L.toFixed(1)} m`);
          const steps = Math.max(1, Math.ceil(L / 0.25));
          for (let k = 0; k <= steps; k++) {
            const x = a[0] + ((b[0] - a[0]) * k) / steps, z = a[1] + ((b[1] - a[1]) * k) / steps, y = a[2] + ((b[2] - a[2]) * k) / steps;
            const here = near(x, z);
            // (a seam or a crack narrower than a foot between two surfaces is stepped over)
            const ground = here.some((e) => holds(e.when, st, false) && holds(e.when, st, true) && x >= e.box[0] - 0.12 && x <= e.box[3] + 0.12 && z >= e.box[2] - 0.12 && z <= e.box[5] + 0.12 && Math.abs(e.box[4] - y) <= Math.max(0.03, dy + 0.01));
            assert.ok(ground, `${deck.mkey}/${s} (${st}): ${n.id} leaves the ground at (${x.toFixed(1)}, ${y.toFixed(2)}, ${z.toFixed(1)})`);
            const wall = here.find((e) => (holds(e.when, st, false) || holds(e.when, st, true)) && x > e.box[0] - 0.25 && x < e.box[3] + 0.25 && z > e.box[2] - 0.25 && z < e.box[5] + 0.25 && e.box[1] < y + 1.6 && e.box[4] > y + 0.45);
            assert.ok(!wall, `${deck.mkey}/${s} (${st}): ${n.id} walks into [${wall?.box}] at (${x.toFixed(1)}, ${y.toFixed(2)}, ${z.toFixed(1)})`);
          }
          metres += L;
        }
      }
    }
  }
  assert.ok(walkers > 300 && metres > 30000, `${walkers} walkers, ${Math.round(metres)} m walked`);
});

test('the watchers: each mission\'s kind, people built from the edition\'s models, never the Observer', () => {
  for (const { deck, level } of LEVELS) {
    if (!level.sentinels.length) continue;
    assert.ok(WATCHERS[deck.mkey] || level.sentinels.every((s) => s.conduit), `${deck.mkey}: its watchers are cast`);
    for (const m of watcherModels(deck.mkey)) assert.ok(castOf(deck.chapter).includes(m), `${deck.mkey}: ${m} is loaded with ${deck.chapter}`);
  }
  assert.deepEqual(kindsOf('m10'), ['trooper']);
  assert.equal(HUMAN.trooper[0], 'rb_trooper');
  assert.deepEqual(kindsOf('m13'), ['trooper', 'unwritten'], 'M13: both factions');
  assert.equal(kindsOf('m17')[0], 'mimic');
  assert.equal(HUMAN.elite.join('/'), 'rb_trooper/elite');
  for (const [k, [m, v]] of Object.entries(HUMAN)) assert.ok(hasVariant(m, v), `${k}: ${m}/${v}`);
});

test('each chapter loads the people it casts; the edition offers Kai\'s look only', () => {
  for (const { ch, deck, s, level } of LEVELS) {
    const need = castOf(ch);
    for (const n of level.npcs) {
      const c = level.cast.find((x) => x.id === n.crew);
      if (c?.model) assert.ok(need.includes(c.model), `${ch} ${deck.mkey}/${s}: ${n.id} on ${c.model} is not in CHAPTER_CAST.${ch}`);
    }
  }
  for (const k of Object.keys(CHAPTER_CAST)) for (const m of CHAPTER_CAST[k]) assert.ok(MODEL_OF(m), `${k}: ${m}`);
  assert.ok(COMMON.includes('rb_ren_m') && COMMON.includes('xbot'));
  assert.deepEqual(LV.looks, ['real_m']);
});

test('the manifest carries only the edition\'s models, each with a credit and a conversion entry', () => {
  const lvFiles = Object.values(LV_MODELS).map((m) => m.file);
  assert.equal(Object.keys(LV_MODELS).length, 37, '37 new people');
  assert.equal(Object.values(LV_MODELS).filter((m) => m.px === 1024).length, 20, '20 named at 1024 px');
  assert.equal(Object.values(LV_MODELS).filter((m) => m.px === 512).length, 17, '17 crowd at 512 px');
  // (U4 review) no one in the edition wears a Station Zero character's face: Juno, Varga, Kade, Ren's FIELD JACKET, the
  // captain (Kai keeps Ren's SHIRTSLEEVES: he is the player)
  for (const f of ['rb_juno.glb', 'rb_office_f.glb', 'rb_engineer_m.glb', 'rb_ren_f.glb', 'rb_captain_m.glb']) assert.ok(!MANIFEST.includes(f), `${f} is a Station Zero face`);
  assert.deepEqual([...MANIFEST].sort(), [...new Set([...Object.values(SHARED_MODELS).map((m) => m.file), ...lvFiles])].sort());
  for (const f of MANIFEST) assert.ok(fs.existsSync(`game/assets/characters/${f}`), f);
  for (const f of ['Michelle.glb', 'Nova.glb', 'rb_pilot_f.glb', 'rb_gardener_m.glb']) assert.ok(!MANIFEST.includes(f), `${f} is Station Zero's`);
  assert.ok(!MANIFEST.some((f) => /^(men|women)_/.test(f)), 'no stylised looks');
  // every model a person, a crowd or a watcher can wear is in it
  const used = new Set([...allNamed().map((n) => n.model), ...Object.values(AMBIENT_CAST).map((a) => a.model), ...Object.values(HUMAN).map(([m]) => m)]);
  for (const era of Object.keys(ERAS)) for (const m of eraModels(era)) used.add(m);
  for (const m of used) assert.ok(MANIFEST.includes(MODEL_OF(m).file), `${m} is in the manifest`);
  // and nothing ships that nobody wears (Kai and the motion library aside)
  for (const f of MANIFEST) assert.ok(['Xbot.glb', 'rb_ren_m.glb'].includes(f) || [...used].some((m) => MODEL_OF(m).file === f), `${f} ships but nobody wears it`);
  const credits = fs.readFileSync('game/assets/characters/CREDITS.md', 'utf8');
  const conv = fs.readFileSync('tools/rocketbox-to-glb.mjs', 'utf8');
  for (const k of Object.keys(LV_MODELS)) {
    assert.ok(credits.includes(`| \`${k}.glb\` |`), `CREDITS.md: ${k}`);
    assert.ok(new RegExp(`\\b${k}: \\{ src: '`).test(conv), `tools/rocketbox-to-glb.mjs LV_AVATARS: ${k}`);
  }
  const apk = fs.readFileSync('android/build-apk.sh', 'utf8');
  assert.ok(/m\.MANIFEST/.test(apk) && /gltf-json\.py [^\n]*\$CHARS/.test(apk), 'build-apk.sh copies the manifest (the APK and the preview)');
});

test('every wardrobe variant is a valid recolour: at most 8 rules, numbers in range, real parts and props', () => {
  const PARTS = ['body', 'head', 'hair', 'hat', 'helmet', 'equipment', 'keffiyeh', 'stetoskop', 'tools', 'glasses'];
  for (const [model, vs] of Object.entries(WARDROBE)) {
    assert.ok(MODEL_OF(model), model);
    for (const [name, v] of Object.entries(vs)) {
      for (const [k, rules] of Object.entries(v)) {
        if (k === 'hide' || k === 'props') { assert.ok(Array.isArray(rules), `${model}/${name}.${k}`); continue; }
        if (k === 'holoProps') { assert.equal(rules, true, `${model}/${name}.holoProps`); assert.ok(v.props?.length, `${model}/${name}: holoProps with props`); continue; }
        assert.ok(PARTS.includes(k), `${model}/${name}: part ${k}`);
        assert.ok(rules.length <= 8, `${model}/${name}.${k}: ${rules.length} rules`);
        for (const r of packRules(rules)) {
          const nums = [...r.band, ...r.sel, ...r.win, ...r.act, ...r.act2];
          assert.ok(nums.every((x) => Number.isFinite(x) && x >= -1 && x <= 2), `${model}/${name}.${k}: ${JSON.stringify(r)}`);
          assert.ok(r.band[0] < r.band[2] && r.band[1] < r.band[3] && r.win[0] < r.win[1], `${model}/${name}.${k}: band and window`);
        }
      }
      for (const p of v.props || []) assert.ok(['umbrella', 'lantern', 'staff', 'trowel', 'clipboard', 'loupe', 'lanyard', 'beret', 'visor', 'badge', 'raincoatHood', 'raincoatChildHood', 'shadowHood', 'helmet', 'vest'].includes(p), `${model}/${name}: prop ${p}`);
    }
  }
});

// --- voice and score (OVERHAUL.md §8; U5) -------------------------------------------------------------------
const SPOKEN = spokenLines();
const PACKS = Object.fromEntries(GROUPS.map((g) => {
  const f = `game/assets/voice/lv/${g}/voice.json`;
  return [g, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null];
}));

test('every spoken line plans fully from the common pack and its own group\'s: no misses, never a CREW voice', () => {
  for (const g of GROUPS) assert.ok(PACKS[g], `game/assets/voice/lv/${g}/voice.json exists`);
  const miss = [];
  for (const e of SPOKEN) {
    const v = voiceOf(e.who, e.extra);
    assert.ok(!/^CREW/.test(v), `${e.path}: a CREW voice (${v}) for "${e.text}"`);
    for (const p of voicePieces(e.text, [])) {
      if (!p.key) continue;
      if (!PACKS.common?.[v]?.[p.key] && !PACKS[e.group]?.[v]?.[p.key]) miss.push(`${e.group} ${e.path} ${v}: ${p.key}`);
    }
  }
  assert.equal(miss.length, 0, `${miss.length} pieces not in the packs:\n${miss.slice(0, 20).join('\n')}`);
  // and every clip is inside its pack's file
  for (const g of GROUPS) {
    const size = fs.statSync(`game/assets/voice/lv/${g}/voice.ogg`).size;
    for (const lib of Object.values(PACKS[g])) for (const [off, len, dur] of Object.values(lib)) assert.ok(off >= 0 && off + len <= size && dur > 0, `${g}: a clip outside voice.ogg`);
  }
});

test('what a consequence adds to a place (a mission\'s adjust, after an earlier choice) is walked, so it is recorded (U5 review)', () => {
  // every mission with an adjust is built a second time, with every fact it could test granted
  const levels = buildLevels();
  const adjusts = Object.values(MISSIONS).flat().filter((m) => m.adjust);
  assert.ok(adjusts.length >= 3, 'Missions 10, 11 and 23 adjust their places');
  for (const m of adjusts) assert.ok(levels.some((x) => x.adjusted && x.deck.mkey === m.key), `${m.key}: built with its facts granted`);
  // a person an adjust adds only when a fact is set: their lines are walked (an empty fact store would miss them)
  const m23 = MISSIONS.finale.find((m) => m.key === 'm23');
  const own = m23.adjust;
  m23.adjust = function (level, rt) {
    own.call(this, level, rt);
    if (rt.g.facts.get('jun_line')) level.npcs.push({ id: 'probe_jun', crew: 'jun', pos: [0, 0, 0], lines: [{ who: 'JUN', text: 'A consequence line nobody recorded.' }] });
  };
  try {
    assert.ok(spokenLines().some((e) => e.text === 'A consequence line nobody recorded.' && e.group === 'finale'), 'a fact-gated line an adjust adds is walked');
  } finally {
    m23.adjust = own;
  }
  // and nobody's own words are read by the narrator: a record, a call or a statement is said in its speaker's voice
  const names = [...new Set(SPOKEN.map((e) => voiceOf(e.who, e.extra)))].filter((v) => !['NONE', 'KAI', 'PA'].includes(v) && /^[A-Z]+$/.test(v)).map((v) => v[0] + v.slice(1).toLowerCase());
  const read = SPOKEN.filter((e) => e.who === 'NONE' && names.some((n) => new RegExp(`^${n}[.,] `).test(e.text)));
  assert.deepEqual(read.map((e) => `${e.path}: ${e.text}`), [], 'a line in a speaker\'s own words, read by the narrator');
});

test('every line authored in the missions\' files is one spokenLines walks (a line said from code lives in its mission\'s spoken)', () => {
  const said = new Set(SPOKEN.map((l) => l.text));
  const S = "'((?:[^'\\\\]|\\\\.)*)'";
  const res = [new RegExp(`\\b(?:K|N|CREW|PUPIL|AMB\\('[A-Z_0-9]+'\\))\\(${S}`, 'g'), new RegExp(`\\bL\\('[A-Z0-9]+', ${S}`, 'g'), new RegExp(`\\bSAYS\\('[^']*', '[A-Z_0-9]+', ${S}`, 'g')];
  let n = 0;
  for (const f of ['prologue.js', 'act1.js', 'act2.js', 'act3.js', 'act4.js', 'finale.js']) {
    const src = fs.readFileSync(new URL(`../game/js/editions/lastversion/${f}`, import.meta.url), 'utf8');
    for (const re of res) for (const m of src.matchAll(re)) {
      const t = m[1].replace(/\\'/g, "'");
      n++;
      assert.ok(!t || said.has(t), `${f}: "${t}" is never walked, so it is never recorded`);
    }
  }
  assert.ok(n > 900, `${n} authored lines`);
});

test('the spoken text is clean: no tags, key names, design notes or digits the voice would guess at; no templates in say calls', () => {
  const seen = new Set();
  for (const e of SPOKEN) {
    if (seen.has(e.text)) continue;
    seen.add(e.text);
    const t = e.text;
    assert.ok(!/\[[^\]]*\]/.test(t), `a [tag] in "${t}"`);
    // (a key to press: "press E", "press the R key"; a press tower or "I pressed it" is not one)
    assert.ok(!/\b[Pp]ress(?:es)?\s+(?:the\s+)?(?:[A-Z]\b|[Ss]pace|[Ss]hift|[Ee]nter|[Ee]sc|[Tt]ab)|\sQ\s|(?<!Case)\sC\./.test(t), `a key name in "${t}" (${e.path})`);
    assert.ok(!/post-credit|the player|Mission \d+ ends|does not block|Access shortcut/i.test(t), `a design note in "${t}" (${e.path})`);
    assert.ok(!/\d/.test(lexicon(t)), `digits the lexicon does not read: "${t}" -> "${lexicon(t)}"`);
    assert.ok(!/\$\{/.test(t), `a template in "${t}"`);
  }
  // no say / hud.say call in the edition's code is built from a template string
  const dir = 'game/js/editions/lastversion';
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.js'))) {
    const src = fs.readFileSync(`${dir}/${f}`, 'utf8');
    for (const m of src.matchAll(/\b(?:hud\.)?say\(([^;]*?)\)\s*;/g)) assert.ok(!/`[^`]*\$\{/.test(m[1]), `${f}: a template in ${m[0].slice(0, 120)}`);
  }
  // the lexicon (§8.5): years, times, acts, names, the relay
  assert.equal(lexicon('Rain City, 2049.'), 'Rain City, twenty forty-nine.');
  assert.equal(lexicon('Test moved to 05:40.'), 'Test moved to oh five forty.');
  assert.equal(lexicon('8:14 and 16:02'), 'eight fourteen and sixteen oh two');
  assert.equal(lexicon('Act II'), 'Act Two');
  assert.equal(lexicon('Jun Park'), 'Joon Park');
  assert.equal(lexicon('Dr. Lin'), 'Doctor Lin');
  assert.equal(lexicon('Relay 41-B'), 'Relay forty-one B');
  assert.equal(lexicon('2196'), 'twenty-one ninety-six');
  assert.equal(numberWords(117), 'one hundred and seventeen');
});

test('each voice pack is under 12 MB and the edition under 22 MB; Station Zero\'s pack is unchanged', async () => {
  let total = 0;
  for (const g of GROUPS) {
    const s = fs.statSync(`game/assets/voice/lv/${g}/voice.ogg`).size + fs.statSync(`game/assets/voice/lv/${g}/voice.json`).size;
    assert.ok(s < 12e6, `${g}: ${(s / 1e6).toFixed(2)} MB`);
    total += s;
  }
  assert.ok(total < 22e6, `the edition's voices: ${(total / 1e6).toFixed(2)} MB`);
  const { createHash } = await import('node:crypto');
  const sha = (f) => createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  assert.equal(sha('game/assets/voice/voice.json'), '4654fc0b03d7d19eef14ee870550a6112137ff3cdc87217a56987ad07917685e', 'Station Zero voice.json');
  assert.equal(sha('game/assets/voice/voice.ogg'), '297c32d68b3c100c33ee8332db32fdf4084895f54830ef98fdf9f88788873f41', 'Station Zero voice.ogg');
});

test('every speaker has a voice of their own, and the same person shares a base voice', () => {
  const V = VOICES();
  const used = new Set(SPOKEN.map((e) => voiceOf(e.who, e.extra)));
  for (const v of used) assert.ok(V[v], `tools/voice-pack.py VOICES has ${v}`);
  const ed = [...new Set([...used, 'KAI', 'MIRA', 'WITNESS', 'CHILD', 'LIN', 'KAI12', 'PRYCE', 'DALE', 'HAIG', 'ELDER', 'CLOCKMAKER', 'RHEA', 'SERGEANT', 'ODILE', 'WARDEN', 'GARDENER', 'FLORIST', 'RECEPTIONIST', 'DIRECTOR', 'PA'])];
  const specs = ed.map((k) => V[k].join('|'));
  assert.equal(new Set(specs).size, specs.length, 'a distinct (spec, speed, pitch) per speaker');
  assert.ok(/^am_/.test(baseOf(V.KAI[0])), 'Kai is a man');
  for (const k of ['KAI', 'WITNESS', 'KAI12']) assert.equal(baseOf(V[k][0]), 'am_eric', `${k} is Kai's voice`);
  for (const k of ['MIRA', 'LIN', 'CHILD']) assert.equal(baseOf(V[k][0]), 'af_river', `${k} is Mira's voice`);
  assert.equal(voiceOf('VOICE', {}), 'WITNESS', 'the voice in every speaker is the Witness voice');
  // a person who speaks has a recorded voice of their own
  const speaking = new Set();
  for (const e of SPOKEN) if (e.who === 'CREW') speaking.add(e.extra.id);
  for (const n of Object.values(NPCS)) if (n.barks?.length || DIALOGUE[n.id]) assert.ok(n.vid, `${n.id} has a vid`);
  for (const id of speaking) assert.ok(id && V[id], `a CREW line in ${id}`);
});

test('in the edition the voice never touches the device\'s speech, waits for a loading pack, and records a miss', async () => {
  const touched = [];
  const win = new Proxy({ location: { search: '' } }, {
    get(t, k) { if (k === 'speechSynthesis' || k === 'AndroidTTS') touched.push(k); return t[k]; },
    has(t, k) { if (k === 'speechSynthesis' || k === 'AndroidTTS') touched.push(k); return k in t; },
  });
  globalThis.window = win;
  try {
    const { Voice } = await import('../game/js/audio/Voice.js?edition-test');
    const fakeAudio = { ctx: { currentTime: 0, decodeAudioData: () => Promise.reject(new Error('no')) }, master: {} };
    const v = new Voice(fakeAudio, { edition: 'lastversion' });
    assert.equal(v.available, true);
    v.speak('A line no pack has.', 'KAI', {});
    v.speak('Another.', 'CREW', { id: 'PRYCE', fx: 'pa' });
    v.speakDevice('Never.', 'KAI', {});
    v.stop();
    assert.deepEqual(touched, [], 'speechSynthesis and AndroidTTS are never read');
    assert.equal(win.__voiceMiss?.length, 2, 'each line it could not say is a miss');
    // a pack still loading: the line waits for it
    v.loading = 0.5;
    let release;
    v.whenReady = new Promise((r) => (release = r));
    v.speak('Wait for me.', 'KAI', {});
    assert.equal(win.__voiceMiss.length, 2, 'not yet a miss');
    release([]);
    v.loading = 1;
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(win.__voiceMiss.length, 3, 'a miss once the pack came without it');
    // a line waiting for its pack plays when the pack arrives with it (U5 review)
    const key = voicePieces('Here I am.', []).find((p) => p.key).key;
    const pack = { base: 'p/', index: { KAI: { [key]: [0, 10, 1.2] } }, vocab: [] };
    const played = [];
    v.playPlan = async (plan) => { played.push(plan.map((p) => p.key)); };
    v.loading = 0.5;
    v.packs = [];
    v.whenReady = new Promise((r) => (release = r));
    v.speak('Here I am.', 'KAI', {});
    assert.equal(played.length, 0, 'it waits');
    v.packs = [pack];
    v.loading = 1;
    release([pack]);
    await new Promise((r) => setTimeout(r, 20));
    assert.deepEqual(played, [[`KAI|${key}`]], 'it plays once its pack is here');
    assert.equal(win.__voiceMiss.length, 3, 'and is no miss');
    // a waiting line another line passes over is not said; if its pack cannot say it, it is still a miss
    v.loading = 0.5;
    v.whenReady = new Promise((r) => (release = r));
    v.speak('A line nobody recorded.', 'KAI', {});
    v.stop();
    v.loading = 1;
    release([pack]);
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(played.length, 1, 'the passed-over line is not said');
    assert.equal(win.__voiceMiss.length, 4, 'but its miss is recorded');
  } finally {
    delete globalThis.window;
  }
});

test('a voice pack a server sends compressed (more bytes than the length it announced) still loads (U5 review)', async () => {
  const { loadVoicePack } = await import('../game/js/audio/Voice.js');
  const bytes = Uint8Array.from({ length: 300 }, (_, i) => i & 255);
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (u) => (String(u).endsWith('voice.json') ? { ok: true, json: async () => ({ KAI: {} }) } : {
    ok: true,
    headers: { get: (k) => ({ 'content-length': '100', 'content-encoding': 'gzip' })[k] ?? null },
    body: { getReader() { let i = 0; return { read: async () => (i < 3 ? { done: false, value: bytes.subarray(i * 100, ++i * 100) } : { done: true }) }; } },
  });
  try {
    const seen = [];
    const pack = await loadVoicePack('test/compressed/', (f) => seen.push(f), []);
    assert.ok(pack, 'the pack loads');
    assert.equal(pack.bin.byteLength, 300, 'every byte the stream gave');
    assert.deepEqual([...new Uint8Array(pack.bin, 98, 4)], [98, 99, 100, 101], 'in order');
    assert.ok(seen.every((f) => f <= 1) && seen.at(-1) === 1, 'the progress never passes 1, and ends at 1');
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('the effect chains are the edition\'s (voicefx.js): pa, radio, recording and echo in the edition; Station Zero\'s voice plays a line dry', async () => {
  const { Voice } = await import('../game/js/audio/Voice.js');
  const { VoiceFx } = await import('../game/js/editions/lastversion/voicefx.js');
  const param = (v = 0) => ({ value: v, setValueAtTime() {}, setTargetAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {} });
  const made = [];
  const node = (kind) => () => {
    const n = { kind, to: [], gain: param(1), frequency: param(), Q: param(), delayTime: param(), playbackRate: param(1), curve: null, type: '', buffer: null,
      connect(x) { n.to.push(x); return x; }, start() {}, stop() {} };
    made.push(n);
    return n;
  };
  const ctx = { currentTime: 0, sampleRate: 8000, createGain: node('gain'), createBiquadFilter: node('filter'), createDelay: node('delay'), createWaveShaper: node('shaper'),
    createOscillator: node('osc'), createBufferSource: node('src'), createBuffer: (c, len) => ({ getChannelData: () => new Float32Array(len), duration: len / 8000 }) };
  const audio = { ctx, master: node('master')(), voiceBus: node('voiceBus')(), reverb: node('reverb')() };
  const buf = { duration: 1 };
  const plan = [{ key: 'KAI|x', ref: [0, 1, 1], pack: { base: 'p/' } }];
  // the edition: each fx has its own chain, built once, ending in the voice's output on the voice bus
  const v = new Voice(audio, { edition: 'lastversion' });
  v.effects = new VoiceFx(v);
  v.clip = async () => buf;
  const reaches = (from, to, seen = new Set()) => from === to || (!seen.has(from) && (seen.add(from), from.to.some((x) => reaches(x, to, seen))));
  for (const fx of ['pa', 'radio', 'recording', 'echo']) {
    const before = made.length;
    await v.playPlan(plan, { fx });
    const src = v.playing.find((x) => x.kind === 'src' && x.buffer === buf && made.indexOf(x) >= before);
    assert.ok(src && src.to[0] !== v.output() && reaches(src.to[0], audio.voiceBus), `${fx}: the line goes through its chain to the voice bus`);
    assert.equal(v.effects.input(fx, v.output()), src.to[0], `${fx}: one chain, built once`);
    if (fx === 'echo') assert.equal(src.playbackRate.value, 0.97, 'an echo is a little slower');
    if (fx === 'radio' || fx === 'recording') assert.ok(v.playing.some((x) => x.kind === 'src' && x.buffer !== buf && made.indexOf(x) >= before), `${fx}: a bed under the line`);
    if (fx === 'recording') assert.ok(made.slice(before).some((x) => x.kind === 'osc'), 'a record wanders (wow)');
  }
  // the reverb sends of pa and echo follow the Dialogue row (the reverb returns to the master): U5 review
  const bus = v.effects.sendBus;
  assert.ok(bus && reaches(bus, audio.reverb) && reaches(v.effects.input('pa', v.output()), bus) && reaches(v.effects.input('echo', v.output()), bus), 'pa and echo send through the dialogue-level send');
  audio.level = (b) => (b === 'voice' ? 0 : 1);
  await v.playPlan(plan, { fx: 'echo' });
  assert.equal(bus.gain.value, 0, 'Dialogue at 0: no reverb wash either');
  delete audio.level;
  await v.playPlan(plan, {});
  assert.equal(v.playing[v.playing.length - 1].to[0], v.output(), 'a line with no fx is dry');
  // Station Zero: no effects, whatever a line carries; it plays straight into the voice's output
  const warn = console.warn;
  console.warn = () => {};
  try {
    const sz = new Voice(audio, { edition: null });
    sz.effects = new VoiceFx(sz); // (even given chains, it never uses them)
    sz.clip = async () => buf;
    await sz.playPlan(plan, { fx: 'pa' });
    assert.equal(sz.playing[0].to[0], sz.output(), 'Station Zero plays dry');
    assert.equal(sz.playing.length, 1);
  } finally {
    console.warn = warn;
  }
});

test('the cinematic lines: chapter and mission cards, the choices Kai says, the ending sequence', () => {
  assert.deepEqual(chapterCardLines('act2').map((l) => l.text), ['Act Two. The Nine-Minute War.', CHAPTERS.act2.question]);
  const m4 = main.find((m) => m.n === 4);
  assert.equal(missionCardLines(m4)[0].text, 'Mission four. The Man from the Last Day.');
  assert.equal(missionCardLines(main.find((m) => m.n === 23))[0].text, 'Mission twenty-three. Afterzero.');
  assert.equal(missionCardLines(main.find((m) => m.n === 13))[0].text, 'Mission thirteen. The Nine-Minute War.', 'the mission\'s card names it as the chapter\'s does (U5 review)');
  assert.deepEqual(choiceLine({ intent: 'comfort', label: 'Run the line. Get them home.' }), { who: 'KAI', text: 'Run the line. Get them home.' });
  assert.equal(choiceLine({ label: 'x', mute: true }), null);
  for (const k of ['A', 'B', 'C']) {
    const L = endingLines(k);
    assert.equal(L[0].who, 'NONE');
    assert.equal(L[0].text, ENDINGS[k].text[0], `Ending ${k}: the bible's text first`);
    const q = L.find((l) => l.text === ENDINGS[k].text[1]);
    assert.equal(q?.who, 'KAI', `Ending ${k}: Kai says the quote`);
    if (k === 'C') assert.equal(q.voice?.fx, 'echo');
    assert.ok(!L.some((l) => /post-credit/i.test(l.text)), 'no stage direction is read');
  }
  assert.deepEqual(POSTCREDIT, [{ who: 'VOICE', text: 'Version one hundred and eighteen.', voice: { fx: 'pa' } }]);
  // everything spoken is recorded: the cards and the choices are in the walk
  const has = (who, text) => SPOKEN.some((e) => e.who === who && e.text === text);
  assert.ok(has('NONE', 'Mission four. The Man from the Last Day.') && has('NONE', 'Act Two. The Nine-Minute War.'));
  assert.ok(has('KAI', 'Run the line. Get them home.') && has('PA', 'The 8:14 service to Helix North is now arriving. Yesterday.'));
  // the groups: every line belongs to a pack group; the tables are common
  for (const e of SPOKEN) assert.ok(GROUPS.includes(e.group), `${e.path}: ${e.group}`);
  assert.ok(SPOKEN.filter((e) => e.path.startsWith('DIALOGUE.')).every((e) => e.group === 'common'));
});

test('the score: every region plays a minute in every year, and every cue plays, on a stand-in audio graph', async () => {
  const { Score, REGIONS, MISSION_REGION, BEDS } = await import('../game/js/editions/lastversion/score.js');
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  let nodes = 0;
  const node = () => { nodes++; const n = { gain: param(), frequency: param(), detune: param(), Q: param(), playbackRate: param(), connect: (x) => x || n, disconnect() {}, start() {}, stop() {}, type: '', buffer: null, loop: false, curve: null }; return n; };
  let buffers = 0;
  const ctx = { currentTime: 1, sampleRate: 8000, createOscillator: node, createGain: node, createBiquadFilter: node, createBufferSource: node, createDelay: node, createWaveShaper: node,
    createBuffer: (ch, len) => (buffers++, { getChannelData: () => new Float32Array(len), duration: len / 8000 }) };
  const synth = { ctx, music: node(), sfx: node(), amb: node(), master: node(), reverb: node(), threat: 0.4, mix: {},
    osc() {}, noise() { throw new Error('Synth.noise: the effects bus, and a buffer each time'); }, pad() {}, pluck() {}, bell() {}, silence() {}, setMix() {}, level: () => 1 };
  const facts = new FactStore();
  const rt = { g: { audio: synth, facts, voice: null }, inv: null, wallaLines: () => [] };
  const score = new Score(rt);
  for (const m of main) assert.ok(REGIONS[m.music || MISSION_REGION[m.key]], `${m.key} has a region`);
  for (const k of Object.keys(BEDS)) assert.ok(REGIONS[k], `beds for a known region: ${k}`);
  for (const [key, R] of Object.entries(REGIONS)) {
    for (const year of ['PRESENT', 'PAST', 'FUTURE']) {
      score.setRegion(key);
      score.setYear(year);
      let t = 1, n = 0;
      while (t < 61) {
        const len = score.step(synth, n++, t);
        assert.ok(len > 0.04 && len < 2, `${key}/${year}: a step of ${len}`);
        t += len;
      }
      assert.ok(R.tempo > 0 && R.layers.PRESENT, key);
    }
  }
  for (const c of ['title', 'chapter', 'card', 'reveal', 'consequence', 'cliff', 'zero', 'fracture', 'pin', 'echoStep', 'reverse', 'loopReset', 'pa', 'ending:A', 'ending:B', 'ending:C', 'postcredit']) score.cue(c);
  score.cut();
  assert.equal(score.heard.length, 17);
  assert.ok(nodes > 1000, `${nodes} nodes made`);
  // (U5 review) one noise buffer for every bed, hit and breath; the music cues at the Music row, the rest on Effects
  assert.equal(buffers, 1, 'one shared noise buffer');
  assert.ok(score.cues && score.cues.gain.value === 0.8, 'the music cues have a bus at the Music row (0.8 by default)');
  synth.mix.music = 0; // (what Synth.setMix does with the row)
  score.applyMix({ mix: { music: 0 } });
  assert.equal(score.cues.gain.value, 0, 'Music at 0: the chapter theme and the endings\' cadences are silent too');
});

// --- story part 1: threads, ledgers and the Prologue rewrite (OVERHAUL.md §3.3, §5 M1-M3, §9; U6) ----------------------
const REWRITTEN = main.filter(isRewritten);
const asDeck = (m) => ({ ...m, mkey: m.key });

test('the Prologue is rewritten as threads: one map each, soft quarters, a cold open and a hook', () => {
  assert.deepEqual(REWRITTEN.slice(0, 3).map((m) => m.key), ['m01', 'm02', 'm03'], 'Missions 1-3 are rewritten');
  for (const m of REWRITTEN) {
    const here = m.key;
    assert.equal(m.sectors, 1, `${here}: one load (D2)`);
    assert.ok(m.coldOpen?.lines?.length && m.hook?.lines?.length, `${here}: a cold open and a hook`);
    assert.deepEqual(m.outro, m.hook.lines, `${here}: the outro is the hook`);
    const level = LEVELS.find((l) => l.deck.mkey === here).level;
    assert.equal(m.quarters.length, level.quarters.length, `${here}: a thread quarter per quarter of the place`);
    const list = threadsOf(asDeck(m));
    const ids = list.map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length, `${here}: thread ids are unique`);
    const mains = list.filter((t) => !t.side);
    assert.ok(mains.length >= 6 && mains.length <= 12, `${here}: 6-10 main threads (${mains.length})`);
    assert.ok(sidesOf(m).length >= 1, `${here}: at least one side story`);
    for (const t of list) {
      const at = `${here}/${t.id}`;
      assert.ok(THREAD_KINDS.includes(t.kind), `${at}: kind ${t.kind}`);
      assert.ok(t.goal && t.because, `${at}: a goal and a because line`);
      assert.equal(t.hints?.length, 3, `${at}: three hint tiers`);
      for (const c of [t.when, t.until, t.done]) if (c) compileCondition(c);
      for (const a of t.after || []) assert.ok(ids.includes(a), `${at}: after ${a}`);
      if (t.at && typeof t.at === 'string') assert.ok(level.landmarks[t.at], `${at}: at ${t.at}, a landmark of the place`);
      for (const sp of t.spots || []) assert.ok(level.landmarks[sp.at] && level.interactables.some((i) => i.id === sp.id), `${at}: spot ${sp.id} at ${sp.at}`);
      if (t.kind === 'deduce' && t.deduction) assert.ok(m.deductions?.[t.deduction]?.answers.some((a) => a.correct), `${at}: a deduction with a right answer`);
      // (someone to talk to: in the level, and offered a talk: not silent, and a passer-by only with lines or a scene)
      if (t.kind === 'talk') assert.ok(level.npcs.some((n) => (n.crew === t.npc || n.id === t.npc) && !n.silent && (!n.ambient || n.lines || n.scene)), `${at}: ${t.npc} is in the level, and can be talked to`);
      if (t.kind === 'chase') {
        const n = level.npcs.find((x) => x.id === t.npc);
        assert.ok(n?.chase && n.path?.length >= 2 && n.chase.leash === 14, `${at}: the chase walks a path on a 14 m leash`);
      }
      if (t.kind === 'scene' && t.scene) assert.ok(m.scenes[t.scene], `${at}: scene ${t.scene}`);
      assert.ok(doneCond(asDeck(m), t) || t.of, `${at}: something completes it`);
    }
    for (const s of sidesOf(m)) assert.ok(s.name && s.done && s.threads?.length, `${here}/${s.id}: a side story with an outcome`);
    for (const [id, nodes] of Object.entries(m.talks || {})) assert.ok(nodes.length && nodes.every((n) => n.lines?.length), `${here}: talk ${id}`);
  }
});

test('the length model (§9.8): the Prologue is 75-100 minutes, each mission 25-42, the main path 70% or more', () => {
  let total = 0;
  for (const m of MISSIONS.prologue) {
    const e = estimate(m);
    total += e.total;
    assert.ok(e.total >= 25 && e.total <= 42, `${m.key}: ${e.total} min`);
    assert.ok(e.main / e.total >= 0.7, `${m.key}: main ${e.main} of ${e.total}`);
    assert.deepEqual([e.main, e.optional], [m.minutes.main, m.minutes.optional], `${m.key}: its declared minutes are the model's`);
  }
  assert.ok(total >= 75 && total <= 100, `the Prologue: ${total} min`);
  // a mission not yet rewritten runs through the shim: one thread per beat, in quarter i
  for (const m of main.filter((x) => !isRewritten(x))) {
    const qs = threadQuarters(m);
    assert.equal(qs.length, (m.beats || [1]).length, `${m.key}: a quarter per beat`);
    assert.ok(qs.every((q) => q.threads.length === 1 && q.threads[0].legacy), m.key);
    assert.ok(estimate(m).total > 0, m.key);
  }
  assert.ok(MINUTES.coldOpen && MINUTES.hook && MINUTES.side, 'the defaults of §9.8');
});

test('the clue ledger: every plant comes before its payoff, and a rewritten mission carries its plant', () => {
  assert.deepEqual(CLUES.map((c) => c.id), Array.from({ length: 12 }, (_, i) => `C${i + 1}`));
  const dataOf = (m) => JSON.stringify(MISSIONS[ORDER.find((ch) => MISSIONS[ch].some((x) => x.key === m))]?.find((x) => x.key === m), (k, v) => (typeof v === 'function' ? undefined : v)) || '';
  const facts = (m) => { const out = new Set(); walkObj(main.find((x) => x.key === m), (o) => { if (o.set && typeof o.set === 'object') Object.keys(o.set).forEach((k) => out.add(k)); if (o.ev) out.add(`ev_${o.ev}`); }); for (const t of threadsOf(asDeck(main.find((x) => x.key === m)))) { if (t.ev) out.add(`ev_${t.ev}`); Object.keys(t.set || {}).forEach((k) => out.add(k)); }
    // (and what the mission's scripted moments set: its fx and step)
    const mm = main.find((x) => x.key === m);
    for (const f of [...Object.values(mm.fx || {}), mm.step].filter(Boolean)) for (const x of String(f).matchAll(/\.set\('([a-z0-9_]+)'/g)) out.add(x[1]);
    return out; };
  for (const c of CLUES) {
    for (const st of [...c.plant, ...c.reinforce, ...c.payoff]) assert.ok(missionIndex(st.m) >= 0, `${c.id}: ${st.m}`);
    const lastPlant = Math.max(...c.plant.map((p) => missionIndex(p.m)));
    const firstPay = Math.min(...c.payoff.map((p) => missionIndex(p.m)));
    assert.ok(lastPlant < firstPay, `${c.id} ${c.name}: planted by ${MISSION_ORDER[lastPlant]}, paid off from ${MISSION_ORDER[firstPay]}`);
    assert.ok(Math.min(...c.reinforce.map((p) => missionIndex(p.m))) >= Math.min(...c.plant.map((p) => missionIndex(p.m))), `${c.id}: reinforced after it is planted`);
    for (const st of [...c.plant, ...c.reinforce, ...c.payoff]) {
      const m = main.find((x) => x.key === st.m);
      if (!isRewritten(m)) continue;
      if (st.fact) assert.ok(facts(st.m).has(st.fact) || st.fact.startsWith('ev_') && facts(st.m).has(st.fact), `${c.id}: ${st.m} sets ${st.fact}`);
      if (st.text) assert.ok(dataOf(st.m).replace(/\\'/g, "'").includes(st.text), `${c.id}: ${st.m} says "${st.text}"`);
    }
  }
  // the questions: each chapter's bible question verbatim, as its card shows it (D21)
  for (const ch of ORDER) assert.ok(QUESTIONS.some((q) => q.chapter === ch && q.bible && q.text === CHAPTERS[ch].question), `${ch}: the bible's question`);
  // (every clue a question pins is evidence something in the campaign sets: a key nothing sets would never show)
  for (const q of QUESTIONS) {
    assert.ok(missionIndex(q.answer) >= 0, q.id);
    for (const k of q.clues) assert.ok(EV_KEYS.has(k), `${q.id}: ev_${k} is set somewhere`);
  }
});

// the evidence keys anything in the campaign can pin (ev_<key>)
const EV_KEYS = new Set();
walkObj([MISSIONS, DIALOGUE], (o) => { if (o.ev) EV_KEYS.add(o.ev); if (o.set && typeof o.set === 'object') for (const k of Object.keys(o.set)) if (k.startsWith('ev_')) EV_KEYS.add(k.slice(3)); });

test('the consequence ledger (global since U8): every fact a choice sets is read later in the campaign', () => {
  const later = (m) => main.slice(main.findIndex((x) => x.key === m));
  const conds = (ms) => {
    const out = [];
    walkObj([ms, DIALOGUE, EPILOGUE], (o) => { for (const k of ['when', 'done', 'until', 'needs', 'npcWhen', 'freezeWhen', 'start']) if (typeof o[k] === 'string') out.push(o[k]); });
    for (const m of ms) for (const t of threadsOf(asDeck(m))) for (const k of ['when', 'done', 'until']) if (t[k]) out.push(t[k]);
    return out.join(' ');
  };
  let n = 0;
  for (const m of REWRITTEN) {
    const read = conds(later(m.key));
    walkObj(m, (o) => {
      if (!o.intent) return;
      for (const k of Object.keys(o.set || {})) {
        if (k.startsWith('ev_') || k.startsWith('t_')) continue; // (evidence is pinned to the case board)
        n++;
        assert.ok(new RegExp(`\\b${k}\\b`).test(read), `${m.key}: "${o.label}" sets ${k}, which nothing later reads`);
      }
    });
  }
  assert.ok(n >= 8, `${n} consequence facts checked`);
  // every listed consequence names missions in campaign order
  for (const c of CONSEQUENCES) assert.ok(missionIndex(c.set) >= 0 && c.shown.every((x) => missionIndex(x) >= missionIndex(c.set)), c.facts.join());
  // the Prologue's cross-mission facts are primed when Act I starts from the menu
  const primed = PRIMES.act1.map((k) => (Array.isArray(k) ? k[0] : k));
  for (const k of ['wrist_cut', 'wrist_mark', 'raincoat', 'trust_rook', 'ev_site_zero']) assert.ok(primed.includes(k), `PRIMES.act1 has ${k}`);
});

test('the bible\'s quoted exchanges are spoken verbatim by the bible\'s speakers (D16), and nothing says a design note', () => {
  const said = (who, text) => SPOKEN.some((e) => (e.who === who || voiceOf(e.who, e.extra) === who) && e.text === text);
  const pairs = [
    ['ROOK', 'The event lasted one second.'], ['KAI', 'What event?'], ['ROOK', 'That\'s the problem. Every recording says it hasn\'t happened yet.'],
    ['VOICE', 'Kai Varen. Do not build the machine.'],
    ['KAI', 'This drawing is twenty-three years old.'], ['ROOK', 'Then someone has been using your credentials.'], ['KAI', 'I was twelve.'],
    ['KAI', 'Which one is real?'], ['ROOK', 'All of them. That\'s why this is dangerous.'],
    // the Prologue's authored sheet lines (§5 M1-M3)
    ['PRYCE', 'Says here you badged into Chamber One at 05:40.'], ['KAI', 'At 05:40 I was asleep.'], ['FLORIST', 'Funny. You already came in. Ten minutes ago.'],
    ['LIN', 'Everybody asks me that this morning. I\'ve been here six weeks. Nobody remembers hiring me.'], ['ROOK', 'Go in, then. You were always going to.'],
    ['KAI', 'It sealed it.'], ['KAI', 'Remember what?'], ['KAI', 'She died twenty-three years ago. I was at the funeral. I was twelve.'],
    // D16 in the generic conversations
    ['KAI', 'You were trying to stop me from becoming you.'], ['WITNESS', 'I was trying to find a version of me that didn\'t have to.'],
    // (U8) Acts III-IV and the Finale: the bible's lines, its speakers; in Mission 22 the speakers are fixed (the Witness)
    ['ORREN', 'Don\'t follow the footsteps. Follow what they refuse to step on.'], ['MIRA', 'You\'ve been trying to reach the version of me that would forgive you.'],
    ['MIRA', 'Saving me is not the same as understanding me, Kai. You keep solving the wrong puzzle.'],
    ['MIRA', 'I remember being your sister.'], ['KAI', 'That\'s not the same thing.'], ['MIRA', 'Would it be enough if I said it was?'],
    ['MIRA', 'You let me. I asked, and you let me. I was nine, Kai, not nothing.'], ['WITNESS', 'No.'], ['KAI', 'And did you?'],
    ['WITNESS', 'Kai Varen. Do not build the machine.'], ['KAI', 'It turned before I pressed it. I was a second late.'], ['WITNESS', '…No. I was a second early.'],
    ['WITNESS', 'I will hold the route. Go to her.'], ['KAI', 'Why now?'], ['WITNESS', 'Because this is the version where I ask.'], ['WITNESS', 'And, Kai. For once, you are on time.'],
    ['MIRA', 'Ask me.'], ['KAI', 'I thought the answer was to find the right world.'], ['MIRA', 'And now?'], ['KAI', 'Now I think we kept asking the world to pay for our answer.'],
    ['VOICE', 'Version one hundred and eighteen.'],
  ];
  for (const [who, text] of pairs) assert.ok(said(who, text), `${who}: "${text}"`);
  // design-note words, in anything said or shown as an objective
  const NOTE = /mission ending|the player|does not block|later allies|post-credit|Mission \d+ ends/i;
  for (const e of SPOKEN) assert.ok(!NOTE.test(e.text), `${e.path}: "${e.text}"`);
  for (const m of REWRITTEN) for (const t of threadsOf(asDeck(m))) assert.ok(!NOTE.test(`${t.goal} ${t.because}`), `${m.key}/${t.id}`);
});

test('the speech budget (§8.10): the Prologue, common, the Finale and each Act mission within their words', async () => {
  const { wordsPerGroup } = await import('../game/js/editions/lastversion/voicelines.js');
  const w = wordsPerGroup(SPOKEN);
  assert.ok(w.prologue <= 4200, `the Prologue: ${w.prologue} words`);
  assert.ok(w.common <= 2500, `common: ${w.common} words`);
  assert.ok(w.finale <= 1800, `the Finale: ${w.finale} words`);
  // each Act mission (main and optional): 1,000 words
  const per = {};
  const seen = new Set();
  for (const e of SPOKEN) {
    if (!/^act/.test(e.group)) continue;
    const k = `${voiceOf(e.who, e.extra)}|${e.text}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const mk = e.path.slice(0, 3);
    per[mk] = (per[mk] || 0) + e.text.split(/\s+/).length;
  }
  for (const [mk, n] of Object.entries(per)) assert.ok(n <= 1000, `${mk}: ${n} words`);
});

test('PREVIOUSLY and THE QUESTIONS are said from the common pack', () => {
  for (const ch of [...ORDER, 'cases']) {
    assert.equal(PREVIOUSLY[ch]?.length, 3, `${ch}: three lines`);
    for (const t of PREVIOUSLY[ch]) assert.ok(SPOKEN.some((e) => e.group === 'common' && e.who === 'NONE' && e.text === t), `PREVIOUSLY ${ch}: ${t}`);
  }
  assert.deepEqual(PREVIOUSLY.act1, ['Kai Varen built a machine he was told not to build.', 'The ring under Helix knew his name.', 'He fell.'], 'Act I\'s, as the spec writes it');
  for (const q of QUESTIONS) assert.ok(SPOKEN.some((e) => e.group === 'common' && e.who === 'NONE' && e.text === q.text), q.text);
});

test('the thread engine: the objective is the first main thread not done, with its because; THINK reads its tiers; a side is tracked', () => {
  const game = { engine: engine(), facts: new FactStore(), story: null, campaign: { lv: true, chapter: 'prologue', deck: 0, sector: 0, flags: {}, quarter: 0 }, log: [], hud: { say() {} }, deckWorld: { flags: {}, npcs: [] } };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory('prologue');
  rt.level = rt.buildLevel(game.campaign);
  const th = rt.threads;
  assert.ok(th.on && th.deck.mkey === 'm01');
  const cur = () => th.current()?.id;
  assert.equal(cur(), 'photo');
  assert.deepEqual(rt.objectiveParts(), ['Look at the photo by the door.', 'It is the anniversary. It always starts at the door.']);
  assert.equal(th.hint().tiers.length, 3);
  game.facts.set('ev_mira_photo');
  th.update();
  assert.ok(game.facts.get('t_m01_photo'), 'a done thread sets its fact');
  assert.equal(cur(), 'anomalies');
  for (const k of ['ev_toy', 'ev_clock']) game.facts.set(k);
  th.update();
  assert.equal(cur(), 'anomalies', 'two of three is not done');
  game.facts.set('ev_pigeon');
  th.update();
  assert.equal(cur(), 'deduce', 'three of six: the deduction is up');
  // the deduction: the right answer, with its evidence, closes it; a wrong one is said and it stays open
  const d = th.deduction('minute');
  assert.equal(d.choices.length, 3);
  assert.ok(d.choices.find((c) => c.label.startsWith('They\'re all running backwards')).set?.t_m01_deduce, 'the proven answer closes the thread');
  assert.ok(!d.choices.find((c) => c.label.startsWith('Somebody hacked')).set, 'a wrong answer sets nothing');
  // walked past: once the checkpoint is passed, the avenue's clues are no longer the objective
  game.facts.set('rook_message');
  game.facts.set('checkpoint_passed');
  th.update();
  assert.equal(cur(), 'jun');
  // a side story: tracked, its next thread shows under the objective
  game.campaign.track = 'm01:florist';
  assert.equal(th.tracked()?.thread.id, 'florist');
  game.facts.set('ev_florist');
  assert.equal(th.tracked(), null, 'a resolved side is no longer tracked');
  assert.equal(sideState(game.facts, th.deck, th.sides.find((s) => s.id === 'florist')), 'resolved');
});

test('a thread is paid once, even when its kind sets its own fact (the chase); a year carries out into the open place', () => {
  const said = [];
  const game = { engine: engine(), facts: new FactStore(), story: null, campaign: { lv: true, chapter: 'prologue', deck: 0, sector: 0, flags: {}, quarter: 0 }, log: [], hud: { say: (l) => said.push(...l.map((x) => x.text)) }, deckWorld: { flags: {}, npcs: [] } };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory('prologue');
  rt.level = rt.buildLevel(game.campaign);
  const th = rt.threads;
  // the chase's end sets t_m01_chase itself: what the thread carries (mira_gone, her raincoat line) still follows, once
  game.facts.set('t_m01_chase');
  th.update();
  th.update();
  assert.ok(game.facts.get('mira_gone'), 'the chase\'s set is applied');
  assert.equal(said.filter((t) => t.includes('lies a yellow raincoat')).length, 1, 'its line is said once');
  // Mission 3 (carryOut): Kai walks out of the lab in 2026, and the court is 2026 behind him; walking back in keeps the lab's year
  game.campaign = { lv: true, chapter: 'prologue', deck: 2, sector: 0, flags: {}, quarter: 0 };
  rt.level = rt.buildLevel(game.campaign);
  const out = rt.level.outdoorRoom;
  assert.ok(rt.threads.deck.carryOut.includes('cable') && out);
  game.engine.setState('cable', 'PAST');
  game.room = 'cable';
  rt.threads.carry();
  assert.equal(game.engine.state(out), 'PRESENT');
  game.room = out;
  rt.threads.carry();
  assert.equal(game.engine.state(out), 'PAST', 'the court takes the lab\'s year');
  // the court crosses the top of the chamber's corridor: the chamber's year does not carry out
  game.room = 'chamber';
  rt.threads.carry();
  game.room = out;
  rt.threads.carry();
  assert.equal(game.engine.state(out), 'PAST', 'only the lab\'s year carries');
  game.engine.setState(out, 'FUTURE');
  game.room = 'cable';
  rt.threads.carry();
  assert.equal(game.engine.state('cable'), 'PAST', 'a room keeps its own year');
});

test('the save format: an older save in the middle of a rewritten mission restarts it at quarter 0 (the Prologue keeps its facts; from Act I the old mission\'s own are forgotten)', () => {
  const old = { lv: true, chapter: 'prologue', deck: 0, sector: 0, room: 'm01_rain_south', pos: [0, 4.26, -154, 0], flags: { beat_done: false, done_toy: true }, lvFormat: 21 };
  migrateSave(engine(), old, LV);
  assert.equal(old.lvFormat, SAVE_FORMAT);
  assert.ok(SAVE_FORMAT >= 22);
  assert.deepEqual([old.quarter, old.sector, old.pos, old.room, old.flags], [0, 0, null, null, {}], 'back to quarter 0');
  // its facts are kept, and the rules they already fired do not fire again
  const facts = new FactStore();
  for (const k of ['rook_message', 'zero_second', 'checkpoint_passed']) facts.set(k);
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: { facts, engine: engine() }, def: LV, start: (ch, c) => (rt.started = c) });
  const save = { lv: true, chapter: 'prologue', deck: 0, sector: 0, pos: [1, 2, 3, 0], flags: {}, lvFormat: 21 };
  rt.resume(save);
  assert.ok(rt.started.flags.rule_rook_call && rt.started.flags.rule_zero && !rt.started.flags.rule_rescued, 'Rook does not call again; the Zero Second does not happen twice');
  assert.ok(rt.resumed, 'the sector loads after a PREVIOUSLY card');
  // a current save keeps where it was
  const now = { lv: true, chapter: 'prologue', deck: 0, sector: 0, quarter: 2, pos: [1, 2, 3, 0], flags: { beat_done: false }, lvFormat: SAVE_FORMAT };
  migrateSave(engine(), now, LV);
  assert.deepEqual([now.quarter, now.pos], [2, [1, 2, 3, 0]]);
  // a v2.0 case (c_b, two sectors) is a replay of Mission 5's gorge now: it starts again where that story lives (format
  // 24); a U7 save in Act IV restarts its mission
  const cb = { lv: true, chapter: 'cases', deck: 0, sector: 1, flags: {}, lvFormat: 21 };
  migrateSave(engine(), cb, LV);
  assert.deepEqual([cb.sector, cb.quarter, cb.lvFormat], [0, MISSIONS.cases[0].startQuarter, 24]);
  assert.ok(MISSIONS.cases[0].startQuarter > 0 && MISSIONS.cases[0].origin === 'm05' && MISSIONS.cases[1].origin === 'm15');
  const act = { lv: true, chapter: 'act4', deck: 2, sector: 1, quarter: 1, pos: [1, 2, 3, 0], flags: { beat_done: false }, lvFormat: 23 };
  migrateSave(engine(), act, LV);
  assert.deepEqual([act.sector, act.quarter, act.pos, act.lvFormat], [0, 0, null, 24]);
  // U7 review: a format-22 save in the middle of the old Mission 5 (its divert set water_route; its wall and gate done)
  // restarts Mission 5 with what the old one set forgotten, and the earlier missions' facts kept
  const m5 = MISSIONS.act1.findIndex((m) => m.key === 'm05');
  const f5 = new FactStore();
  for (const k of ['card_found', 'elder_met', 'ev_found_not_built', 'river_diverted', 'water_route', 'wall_braced', 'gate_released', 'niko_follows']) f5.set(k);
  const s5 = { lv: true, chapter: 'act1', deck: m5, sector: 0, pos: [1, 2, 3, 0], flags: {}, lvFormat: 22 };
  migrateSave(engine(), s5, LV, f5);
  assert.ok(s5.restarted && ['card_found', 'elder_met', 'ev_found_not_built'].every((k) => f5.get(k)), 'Mission 4\'s facts are kept');
  assert.deepEqual(['river_diverted', 'water_route', 'wall_braced', 'gate_released', 'niko_follows'].filter((k) => f5.get(k)), [], 'the old Mission 5 is forgotten');
  // past Mission 5: water_route meant the old divert; it means Tala's gates now, so it stays only if her story was resolved
  const f7 = new FactStore();
  f7.set('water_route');
  migrateSave(engine(), { lv: true, chapter: 'act1', deck: m5 + 2, sector: 0, flags: {}, lvFormat: 22 }, LV, f7);
  assert.ok(!f7.get('water_route'), 'water_route without Tala\'s gates is the old divert');
  const g7 = new FactStore();
  g7.set('water_route');
  g7.set('quest_tala', 'resolved');
  migrateSave(engine(), { lv: true, chapter: 'act1', deck: m5 + 2, sector: 0, flags: {}, lvFormat: 22 }, LV, g7);
  assert.ok(g7.get('water_route'), 'chain B played to its end keeps it');
});

// U6 review: a Prologue mission played with every skippable thread left undone, step by step along its main path
test('a skipped early thread is walked past: the objective is always the next main beat (Missions 1-3)', () => {
  const walk = (deck, steps) => {
    const game = { engine: engine(), facts: new FactStore(), story: null, campaign: { lv: true, chapter: 'prologue', deck, sector: 0, flags: {}, quarter: 0 }, log: [], hud: { say() {} }, deckWorld: { flags: {}, npcs: [] } };
    const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
    game.story = rt.makeStory('prologue');
    rt.level = rt.buildLevel(game.campaign);
    const th = rt.threads;
    for (const [facts, want] of steps) {
      for (const k of facts) game.facts.set(k);
      th.update();
      assert.equal(th.current()?.id ?? null, want, `${th.deck.mkey} after ${facts.join(', ') || 'nothing'}`);
    }
    return rt;
  };
  // Mission 1: the photo never looked at (the avenue, the plaza, the checkpoint, the platform, the wreck, the pursuit)
  walk(0, [[[], 'photo'], [['ev_toy'], 'anomalies'], [['ev_clock', 'ev_camera'], 'deduce'], [['rook_message', 'checkpoint_passed'], 'jun'],
    [['zero_second'], 'zero'], [['after_zero'], 'rescue'], [['rescued_a', 'rescued_b', 'wrist_cut'], 'voice'], [['voice_heard'], 'chase'], [['mira_gone'], 'raincoat'], [['raincoat'], null]]);
  walk(0, [[['rook_message'], 'anomalies']]); // (Rook's call alone walks past the photo)
  // Mission 2: the intercom, the print and Dr. Lin all skipped; out into the court the lobby is behind him
  const m2 = walk(1, [[[], 'intercom'], [['left_lobby'], 'gallery'], [['cells_1'], 'cells']]);
  assert.ok(m2.level.triggers.some((t) => t.set?.left_lobby && t.room === m2.level.outdoorRoom), 'the court sets left_lobby');
  // Mission 3: the excavation office never read; once the cable is in, the objective is the cable, then the hall
  walk(2, [[['first_cycle'], 'lab'], [['t_m03_lab'], 'dig'], [['t_m03_dig'], 'office'], [['cable_connected'], 'cable'], [['power_on'], 'hall']]);
  // (and three of the four office things never pin SITE ZERO: only the excavation log does)
  const m3 = walk(2, [[['first_cycle', 't_m03_lab', 't_m03_dig', 'ev_thermos_er', 'ev_footprints', 'ev_polaroid'], 'cable']]);
  assert.ok(m3.g.facts.get('t_m03_office') && !m3.g.facts.get('ev_site_zero'), 'the office is done without the log, and SITE ZERO is not pinned');
});

// U6 review: a moment that sets its facts in callbacks, cut off by a save, plays again on load from what it has not set
test('a save inside a moment that runs in callbacks loads with it played again (the rescue, the Zero Second, the first cycle, a pre-U6 save)', () => {
  const make = (deck, set = []) => {
    const said = [];
    const game = { engine: engine(), facts: new FactStore(), story: null, campaign: { lv: true, chapter: 'prologue', deck, sector: 0, flags: {}, quarter: 0 }, log: [],
      hud: { say: (l, f, done) => { said.push(...l.filter((x) => !x.when || f.test(x.when)).map((x) => x.text)); done?.(); }, flash() {}, toast() {} },
      deckWorld: { flags: {}, npcs: [], refresh() {} }, after: (t, fn) => fn(), weather: { set() {} }, audio: { caught() {}, sweep() {}, silence() {} }, room: null };
    const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV, cinema: { play: (o, done) => { said.push(...(o.lines || []).map((x) => x.text)); done?.(); } } });
    game.story = rt.makeStory('prologue');
    rt.level = rt.buildLevel(game.campaign);
    for (const k of set) game.facts.set(k);
    return { rt, game, said, deck: game.story.decks[deck] };
  };
  // Mission 1: saved after the second rescue, the rule fired, before the wrist and the voice
  const a = make(0, ['rook_message', 'checkpoint_passed', 'zero_second', 'after_zero', 'rescued_a', 'rescued_b', 'rescued']);
  a.game.deckWorld.flags.rule_rescued = true;
  a.rt.afterResume(a.deck);
  assert.ok(a.game.facts.get('wrist_cut') && a.game.facts.get('voice_heard'), 'the wrist, then the voice in every speaker');
  assert.ok(a.said.includes('Kai Varen. Do not build the machine.'));
  // a moment already played to its end is not played again
  a.said.length = 0;
  a.rt.afterResume(a.deck);
  assert.equal(a.said.length, 0);
  // the Zero Second: saved in the three seconds before after_zero (the people frozen in the saved flags)
  const z = make(0, ['rook_message', 'checkpoint_passed', 'zero_second']);
  z.game.deckWorld.flags.freeze_people = true;
  z.rt.afterResume(z.deck);
  assert.ok(z.game.facts.get('after_zero') && !z.game.deckWorld.flags.freeze_people, 'the platform moves again');
  // a pre-U6 save past the pursuit (facts through mira_gone, no wrist_cut): it restarts Mission 1 with its facts, the
  // rescue's rule marked fired; on load the wrist is cut (and only that), and the objective is the raincoat
  const old = make(0, ['rook_message', 'checkpoint_passed', 'zero_second', 'after_zero', 'rescued_a', 'rescued_b', 'rescued', 'voice_heard', 'mira_gone']);
  old.rt.start = (ch, c) => (old.rt.started = c);
  old.rt.resume({ lv: true, chapter: 'prologue', deck: 0, sector: 0, room: 'm01_rain_south', pos: [0, 4.26, -154, 0], flags: { beat_done: false }, lvFormat: 21 });
  assert.ok(old.rt.started.flags.rule_rescued && old.rt.started.pos === null);
  old.game.deckWorld.flags = old.rt.started.flags;
  old.rt.afterResume(old.deck);
  assert.ok(old.game.facts.get('wrist_cut'), 'wrist_cut, the clue the later missions read');
  assert.ok(old.said.includes('Your wrist—') && !old.said.includes('Kai Varen. Do not build the machine.'), 'the wrist is said; the voice is not heard twice');
  old.rt.threads.update();
  assert.equal(old.rt.threads.current()?.id, 'raincoat');
  // Mission 3: saved during the first cycle (has_chronolith, no first_cycle), and during the fracture
  const c = make(2, ['has_chronolith', 'chronolith_touched', 'wrist_mark']);
  c.rt.afterResume(c.deck);
  assert.ok(c.game.facts.get('first_cycle'), 'the first cycle plays again and ends');
  assert.equal(c.rt.threads.current()?.id, 'lab');
  const f = make(2, ['has_chronolith', 'first_cycle', 'power_on', 'crossed', 'open_control', 'fractured']);
  f.game.engine.setState = () => {};
  f.rt.afterResume(f.deck);
  assert.ok(f.game.facts.get('fracture_done'), 'the fracture ends, and the mission with it');
  // Mission 12 (U7 review): saved while the Witness shows the stair (the zone and the rule fired, the quarter's autosave)
  const m12 = MISSIONS.act2.find((m) => m.key === 'm12');
  const w = { g: { facts: new FactStore(), hud: { say: (l, fct, done) => done?.() }, after: () => {} }, inv: null };
  for (const k of ['t_m12_route', 'm12_at_stair']) w.g.facts.set(k);
  for (const r of m12.resumes) if (w.g.facts.test(r.when) && !w.g.facts.test(r.until)) m12.fx[r.fx](w);
  assert.ok(w.g.facts.get('m12_stair_shown'), 'the stair is shown again, and the thread goes on');
});

// U6 review: a mission that ends on its own exits once a load, never from a flag kept in the save
test('a mission that ends on its own: the exit is marked on the runtime, never in the saved flags', () => {
  const calls = [];
  const game = { engine: engine(), facts: new FactStore(), story: null, campaign: { lv: true, chapter: 'prologue', deck: 1, sector: 0, flags: {}, quarter: 0 }, log: [], hud: { say() {} },
    deckWorld: { flags: {}, npcs: [] }, after: (t) => calls.push(t) };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory('prologue');
  rt.level = rt.buildLevel(game.campaign);
  assert.ok(rt.deck.autoExit != null);
  rt.autoExit();
  assert.equal(calls.length, 0, 'not before the mission has ended');
  game.deckWorld.flags.beat_done = true;
  rt.autoExit();
  rt.autoExit();
  assert.deepEqual(calls, [rt.deck.autoExit], 'once');
  assert.equal(game.deckWorld.flags.auto_exit, undefined, 'nothing in the saved flags');
  rt.autoExited = null; // (a load: onSectorLoaded)
  rt.autoExit();
  assert.equal(calls.length, 2, 'a save taken between the end and the exit exits after its load');
});

// U6 review: the Prologue's story fixes, as data
test('the Prologue reads fairly: the deduction names what Kai found, one ring in 2026, Pryce\'s two statements, the 05:40 cold open', () => {
  // the anomalies: the question names each only when it was found; the roof's view is a sight, not one of them
  const an = threadsOf(M01).find((t) => t.id === 'anomalies');
  const q = M01.deductions.minute.question;
  assert.ok(!an.of.includes('ev_helix_window'));
  for (const k of an.of) assert.ok(q.some((l) => l.when === k), `the question names ${k} when it was found`);
  assert.ok(q.every((l) => !l.when || an.of.includes(l.when)) && !q[q.length - 1].when, 'and asks, whatever was found');
  assert.ok(M01.deductions.minute.answers.find((x) => x.correct).lines.some((l) => l.text === 'There\'s a cause. There\'s always a cause.'), 'Kai\'s arc starts at control (§9.6)');
  // Mission 3: in 2026 the ring is in the ground at the dig; the chamber's cradle is empty
  const m3 = MISSIONS.prologue[2];
  assert.ok(!/half built/.test(m3.spoken.past[0].text));
  const src = fs.readFileSync(new URL('../game/js/editions/lastversion/prologue.js', import.meta.url), 'utf8');
  assert.ok(src.includes("eras: { PRESENT: 'helix', PAST: 'cradle', FUTURE: 'halo' }"));
  // Pryce: her 05:52 statement read the log the director's office had cleaned at 05:50; at 08:14 her badge record had the card
  const m2 = MISSIONS.prologue[1];
  assert.ok(/EDITED 05:50/.test(m2.scenes.door_log.lines[0].text));
  assert.ok(m2.scenes.rec_pryce.lines.some((l) => l.who === 'KAI' && /05:52/.test(l.text)), 'Kai notices the two statements');
  // the 05:40 cold open: the rain before dawn and one window pulsing in Helix's crescent, the streets empty, while it plays
  const co = M01.coldOpen;
  assert.ok(co.stage && co.first);
  const rs = PLACES.rain_south;
  const feats = rs.skyFeatures.m01;
  assert.ok(feats.some((f) => f.kind === 'preset' && f.when === 'co_m01' && SKIES[f.sky]) && feats.some((f) => f.kind === 'beacon' && f.when === 'co_m01'));
  for (const c of rs.crowd) assert.ok(/after_zero|!co_m01/.test(c.when || ''), `the ${c.role}s are not out at 05:40`);
  // the pursuit: about 180 m from the far platform to the staff gate, into the crowd there after the Zero Second
  const ch = threadsOf(M01).find((t) => t.id === 'chase');
  const len = ch.path.reduce((a, p, i) => a + (i ? Math.hypot(p[0] - ch.path[i - 1][0], p[2] - ch.path[i - 1][2]) : 0), 0);
  assert.ok(len >= 150 && len <= 220, `${len.toFixed(0)} m`);
  const end = ch.path[ch.path.length - 1];
  assert.ok(rs.crowd.some((c) => c.path.some(([x, z]) => Math.hypot(x - end[0], z - end[2]) < 10)), 'a crowd at the staff gate');
  // (and cast: Rain City's faces run out at 13 walkers, and the knot at the gate is cast first)
  const game = { engine: engine(), facts: new FactStore(), story: null, campaign: { lv: true, chapter: 'prologue', deck: 0, sector: 0, flags: {}, quarter: 0 }, log: [], hud: { say() {} }, deckWorld: { flags: {}, npcs: [] } };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory('prologue');
  const lv = rt.buildLevel(game.campaign);
  const crowd = lv.npcs.filter((n) => n.crowd);
  const atGate = crowd.filter((n) => Math.hypot(n.pos[0] - end[0], n.pos[2] - end[2]) < 12).length;
  assert.ok(atGate >= 3, `${atGate} people at the staff gate`);
  // (and the morning keeps its people: at least ten walk before the Zero Second, the bot's count at Kai's door)
  const morning = crowd.filter((n) => !/after_zero/.test(n.when || '')).length;
  assert.ok(morning >= 10, `${morning} walk the morning`);
  // a load in Missions 2 and 3 recaps its own mission, not the morning before the crash
  for (const k of ['m02', 'm03']) assert.equal(PREVIOUSLY[k]?.length, 3, k);
  assert.ok(!/Tuesday/.test(M01.subtitle), '14 March 2049 is a Sunday');
});

// a v2.0 save had no has_inversion (its inversion was the INVERTED year); chapter changes never apply PRIMES
test('a v2.0 save in Mission 11 restarts it where REVERSE is taught; one past Mission 11 has REVERSE and its cap', () => {
  const resume = (campaign, set = []) => {
    const facts = new FactStore();
    for (const k of set) facts.set(k);
    const rt = Object.assign(Object.create(LastVersion.prototype), { g: { facts, engine: engine() }, def: LV, start: (ch, c) => (rt.started = c) });
    rt.resume(campaign);
    return { c: rt.started, facts };
  };
  // Mission 11, in what was its lock sector: back to the first quarter, REVERSE still to learn from the charred file
  const m11 = MISSIONS.act2.findIndex((m) => m.n === 11);
  const { c, facts } = resume({ lv: true, chapter: 'act2', deck: m11, sector: 2, room: 'd2s2r1', pos: [1, 2, 3, 0], flags: { beat_done: false, rule_lock: true } }, ['m09_done', 'm10_done', 'lock_open']);
  assert.deepEqual([c.deck, c.sector, c.quarter, c.room, c.pos, c.flags], [m11, 0, 0, null, null, {}], 'Mission 11 starts again at its first quarter');
  assert.equal(facts.get('has_inversion'), undefined, 'REVERSE is learnt there, from the charred file');
  facts.set('m11_saw_file');
  const unlock = MISSIONS.act2[m11].rules.find((r) => r.then === 'unlock');
  assert.ok(facts.test(unlock.when) && !c.flags[`rule_${unlock.id}`], 'watching the file unlocks REVERSE, so Ward 32\'s lock can be taken apart');
  // past Mission 11: REVERSE, with the cap the place has earned (Missions 16, 17 and 22 have REVERSE threads on the main road)
  for (const [chapter, deck, cap] of [['act2', m11 + 1, 8], ['act2', m11 + 2, 8], ['act3', 2, 10], ['act3', 3, 10], ['act4', 3, 12], ['finale', 0, 12], ['cases', 0, 12]]) {
    const r = resume({ lv: true, chapter, deck, sector: 0, flags: {} });
    assert.ok(r.facts.get('has_inversion'), `${chapter}/${deck}: REVERSE`);
    assert.equal(r.facts.get('inv_cap'), cap, `${chapter}/${deck}: cap`);
  }
  // before Mission 11 nothing changes; a save that has REVERSE is left as it is
  for (const [chapter, deck] of [['prologue', 2], ['act1', 4], ['act2', 0], ['act2', 1]]) assert.equal(resume({ lv: true, chapter, deck, sector: 0, flags: {} }).facts.get('has_inversion'), undefined, `${chapter}/${deck}`);
  const kept = resume({ lv: true, chapter: 'act4', deck: 0, sector: 0, flags: {}, lvFormat: SAVE_FORMAT }, ['has_inversion']);
  assert.equal(kept.facts.get('inv_cap'), undefined);
});

// --- story part 2: Acts I and II (OVERHAUL.md §5 M4-M13; U7) ------------------------------------------------------------
test('Acts I and II are rewritten as threads; the length model: each mission 25-42 minutes, the main path 70% or more', () => {
  assert.deepEqual(REWRITTEN.map((m) => m.key), MISSION_ORDER, 'Missions 1-23 are rewritten (U8: Acts III-IV and the Finale)');
  for (const ch of ['act1', 'act2']) {
    for (const m of MISSIONS[ch]) {
      const e = estimate(m);
      assert.ok(e.total >= 25 && e.total <= 42, `${m.key}: ${e.total} min`);
      assert.ok(e.main / e.total >= 0.7, `${m.key}: main ${e.main} of ${e.total}`);
      assert.deepEqual([e.main, e.optional], [m.minutes.main, m.minutes.optional], `${m.key}: its declared minutes are the model's`);
      assert.ok(m.done && m.autoExit != null, `${m.key}: it ends on its last thread`);
      // every quarter of the place has something to do in it
      assert.ok(m.quarters.every((q) => (q.threads || []).length + (q.sides || []).length > 0), `${m.key}: no empty quarter`);
    }
  }
});

test('a rewritten mission starts with none of its threads done (a chapter started from the menu: its PRIMES, faction neutral)', () => {
  for (const ch of ['prologue', 'act1', 'act2', 'act3', 'act4', 'finale']) {
    const facts = new FactStore();
    for (const c of ORDER.slice(0, ORDER.indexOf(ch) + 1)) for (const k of PRIMES[c] || []) (Array.isArray(k) ? facts.set(k[0], k[1]) : facts.set(k));
    if (ch !== 'prologue') facts.set('faction', 'neutral');
    for (const m of MISSIONS[ch]) {
      const d = asDeck(m);
      for (const t of threadsOf(d)) assert.ok(!isDone(facts, d, t), `${m.key}/${t.id} is done before it is played (${doneCond(d, t)})`);
      assert.ok(!facts.test(m.done), `${m.key}: its end (${m.done}) holds at the start`);
    }
  }
});

test('a staged moment is kept in the load, not the save: a save taken while it plays loads with it still to come', () => {
  const game = { engine: engine(), facts: new FactStore(), story: null, campaign: { lv: true, chapter: 'act2', deck: 0, sector: 0, flags: {}, quarter: 0 }, log: [], hud: { say() {}, toast() {} }, deckWorld: { flags: {}, npcs: [] }, menu: null, after() {} };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory('act2');
  rt.level = rt.buildLevel(game.campaign);
  const played = [];
  rt.cinema = { active: null, play: (o, then) => played.push(then) };
  const th = rt.threads;
  for (const k of ['t_m09_loop1', 't_m09_loop2', 'clk_a', 't_m09_order', 'clk_b', 'clk_c', 'transmitter_cut', 'rhea_freed', 'ev_ninth_view']) game.facts.set(k, true);
  th.update();
  assert.equal(th.current()?.id, 'reset', 'Mission 9\'s last thread: the reset, a staged moment');
  th.stage();
  assert.equal(played.length, 1, 'it plays');
  th.stage();
  assert.equal(played.length, 1, 'once');
  assert.ok(!Object.keys(game.deckWorld.flags).some((k) => k.startsWith('staged_')), 'nothing about it is in the saved flags');
  // a load while it plays: the level comes back, and so does the moment (its thread is not done yet)
  th.attach(rt.deck, rt.level);
  th.stage();
  assert.equal(played.length, 2, 'after a load it plays again');
  played[1]();
  assert.ok(game.facts.get('t_m09_reset'), 'and when it ends, its thread is done');
});

test('Act I: the moments the sheets name, and the choices they keep (machine_buried, water_route, ezra_debt, mira_tape, rook_fate)', () => {
  const m = (k) => main.find((x) => x.key === k);
  const thr = (k, id) => threadsOf(asDeck(m(k))).find((t) => t.id === id);
  const lv = (k) => LEVELS.find((l) => l.deck.mkey === k).level;
  const sets = (o, k) => { const out = []; walkObj(o, (x) => { if (x.set && k in x.set) out.push(x.set[k]); }); return out; };
  // M4: three pictograms, the meal at the first fire (the grey one), the panels read from the ash, the card
  assert.deepEqual(thr('m04', 'picto').of, ['ev_picto_fire', 'ev_picto_water', 'ev_picto_ring']);
  assert.ok(m('m04').scenes.meal.lines.some((l) => l.text === 'One came grey, and would not speak, and sat by the ring until it took him.'));
  assert.ok(m('m04').deductions.panels.answers.some((a) => a.correct && a.needs === 'ev_ash_layers'));
  assert.ok(m('m04').scenes.card.set.card_found && m('m04').done === 'card_found');
  // M5: divert -> the abandoned village investigated -> the gate -> the machine buried or left; chain B in the gorge
  assert.deepEqual([...thr('m05', 'gate').after].sort(), ['leave', 'mural', 'wall'], 'the gate waits for why they left: the hearths\' echoes and the mural');
  assert.deepEqual([thr('m05', 'why').after, thr('m05', 'machine').after, thr('m05', 'bury').after], [['divert'], ['gate'], ['machine']]);
  assert.deepEqual(sets(m('m05').talks, 'machine_buried').sort(), ['cairn', 'clay']);
  assert.equal(thr('m05', 'leave').kind, 'playback', 'the villagers\' leaving, played back by its echoes');
  assert.ok(lv('m05').npcs.filter((n) => /^pb_leave_/.test(n.id)).length >= 2 && lv('m05').npcs.every((n) => !/^pb_/.test(n.id) || n.hologram), 'its echoes are cast, as holograms');
  assert.ok(['gate1', 'gate2', 'gate3'].every((k) => typeof m('m05').fx[k] === 'function') && thr('m05', 'gates').done === 'water_route', 'the gorge gates open the water route');
  // M6: Ezra Moll, the hidden stair, the escapement, the Clockmaker's Debt
  assert.ok(m('m06').deductions.stair && thr('m06', 'clocks').done === 'clock_set');
  assert.deepEqual(sets(m('m06').talks, 'ezra_debt').sort(), ['finish', 'release']);
  // M7: the instruments, the scavengers' stones that come back, Mira's tape
  assert.ok(m('m07').processes.some((p) => p.kind === 'projectile' && !p.required), 'a thrown stone snaps back (never required before M11)');
  assert.deepEqual(sets(m('m07').scenes, 'mira_tape').sort(), ['kept', 'left']);
  // M8: the confrontation sets rook_fate; the boot print; the last ten minutes played back; VERSION 17
  assert.deepEqual(sets(m('m08').talks.rook, 'rook_fate').sort(), ['expose', 'persuade', 'record']);
  assert.equal(thr('m08', 'reconstruct').entries.length, 4);
  assert.ok(m('m08').scenes.version.set.version_17 && m('m08').done === 'version_17');
  assert.ok(m('m08').talks.rook[0].lines.some((l) => l.text.includes('boot prints in the clay') && /machine_buried/.test(l.when || '')), 'Rook\'s words follow machine_buried');
});

test('Act II: the loop, the Director, the hospital\'s sound and hazards, the chase, the shells, the charge cap', () => {
  const m = (k) => main.find((x) => x.key === k);
  const thr = (k, id) => threadsOf(asDeck(m(k))).find((t) => t.id === id);
  const lv = (k) => LEVELS.find((l) => l.deck.mkey === k).level;
  // M9: two loops, each reset moving the patrols to another round, rain upward; then the transmitter, Rhea, the tower
  const m9 = m('m09');
  assert.deepEqual([thr('m09', 'loop1').kind, thr('m09', 'loop2').kind], ['loop', 'loop']);
  assert.ok(m9.loop.upward && m9.loop.period > 0 && m9.loop.until === 'transmitter_cut');
  const v = m9.loop.variants.map((x) => JSON.stringify(x.watch.q1s0) + JSON.stringify(x.watch.q2s0));
  assert.equal(new Set(v).size, v.length, 'every loop walks its own patrols');
  const ids = lv('m09').sentinels.map((s) => s.id);
  assert.ok(['q1s0', 'q2s0'].every((k) => ids.some((id) => id.endsWith(`_${k}`))), `the patrols a reset moves are in the level: ${ids}`);
  assert.deepEqual(['transmitter', 'rhea', 'tower'].map((id) => thr('m09', id).after[0]), ['clockC', 'transmitter', 'rhea']);
  assert.ok(m9.scenes.tower.lines.some((l) => l.who === 'WITNESS' && l.text === 'To become me.'));
  // M10: the Director is whoever rook_fate made them; the captured projector teaches Echo Step
  assert.equal(m('m10').coldOpen.lines.filter((l) => /rook_fate/.test(l.when || '')).length, 3);
  assert.ok(m('m10').scenes.projector.set.echo_step && thr('m10', 'projector').done === 'echo_step');
  // M11: the music box is quieter the nearer you are; three hazards go back where they were, and hit only then
  assert.ok(musicGain(2) < musicGain(12) && musicGain(12) < musicGain(30) && musicGain(30) === 1);
  const lm = [0, 0, 0, 0];
  const h = { origin: [0, 0, -10], rest: [0, 0, 8], period: 7, phase: 0 };
  const a = hazardAt(h, lm, 0.2), b = hazardAt(h, lm, 3), c = hazardAt(h, lm, 6);
  assert.ok(a.returning && !b.returning && !c.returning && b.pos[2] === -10 && c.pos[2] > b.pos[2], 'it returns fast, holds, then drifts out again');
  assert.ok(lv('m11').landmarks.musicBox && ['gurneyRun', 'ivStand', 'glassWindow'].every((k) => lv('m11').landmarks[k]));
  assert.equal(typeof m('m11').step, 'function');
  assert.ok(m('m11').talks.odile[0].choices.every((c) => 'odile_released' in c.set));
  // M12: the chase never fails (a leash, no fail state); the Witness holds the stair first, then Kai follows by REVERSE
  assert.equal(thr('m12', 'chase').kind, 'chase');
  assert.deepEqual([thr('m12', 'stair').after, thr('m12', 'stair').of], [['witnessStair'], ['rev_collapsedStair']]);
  assert.ok(lv('m12').processes.some((p) => p.id === 'collapsedStair' && p.kind === 'collapse'));
  assert.ok(m('m12').rules.some((r) => r.then === 'witnessStair') && typeof m('m12').fx.witnessStair === 'function');
  // M13: a shell from each side, reversed, pins ev_both_sides; the stabilizer sets the faction; the charge cap rises to 10 s
  assert.deepEqual(thr('m13', 'shells').of, ['inv_shellA_done', 'inv_shellB_done']);
  assert.ok(thr('m13', 'shells').set.ev_both_sides);
  assert.deepEqual(lv('m13').processes.filter((p) => p.kind === 'projectile').map((p) => p.id).sort(), ['shellA', 'shellB']);
  assert.ok(m('m13').scenes.stabilizer.choices.every((c) => c.set.inv_cap === 10 && c.set.faction));
});

// --- story part 3: Acts III and IV, the Finale, the CASE FILES (OVERHAUL.md §5 M14-M23; U8) ----------------------------
// the facts a mission can set (its talks, scenes, choices, threads, rules, scripted moments, processes)
function factsSetBy(mm, { sides = true } = {}) {
  const out = new Set();
  const d = asDeck(mm);
  let obj = mm;
  if (!sides) {
    // (without its side stories, and the scenes and talks only they use)
    const sideList = sidesOf(mm);
    const only = new Set(sideList.flatMap((sd) => sd.threads.flatMap((t) => [t.scene, t.npc, ...(t.spots || []).map((x) => x.scene || x.id)]).filter(Boolean)));
    const mainUse = new Set(threadsOf(d).filter((t) => !t.side).flatMap((t) => [t.scene, t.npc, ...(t.spots || []).map((x) => x.scene || x.id)]).filter(Boolean));
    const keep = (o) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => !only.has(k.replace(/_no$/, '')) || mainUse.has(k.replace(/_no$/, ''))));
    obj = { ...mm, quarters: mm.quarters.map((q) => ({ ...q, sides: [] })), talks: keep(mm.talks), scenes: keep(mm.scenes) };
  }
  walkObj(obj, (o) => {
    if (o.set && typeof o.set === 'object') Object.keys(o.set).forEach((k) => out.add(k));
    if (typeof o.ev === 'string') out.add(`ev_${o.ev}`);
  });
  for (const t of threadsOf({ ...obj, mkey: mm.key })) out.add(factOf(d, t));
  for (const p of mm.processes || []) { out.add(`inv_${p.id}_done`); out.add(`rev_${p.id}`); out.add(`stuck_${p.id}`); }
  for (const f of [...Object.values(mm.fx || {}), mm.step, mm.onEcho, ...Object.values(mm.nodes || {})].filter(Boolean)) for (const x of String(f).matchAll(/\.set\('([a-z0-9_]+)'/g)) out.add(x[1]);
  if (mm.nodes?.align) for (const id of ['h1', 'h2', 'e1', 'e2', 'w1', 'w2', 'aligned', 'tidy']) out.add(`m20_${id}`);
  for (const z of mm.zones || []) Object.keys(z.set || {}).forEach((k) => out.add(k));
  for (const r of mm.rules || []) Object.keys(r.set || {}).forEach((k) => out.add(k));
  out.add(`${mm.key}_done`);
  return out;
}
const IDS = (c) => (typeof c === 'string' ? c.replace(/"[^"]*"/g, '').match(/\b[a-z_][a-z0-9_]*\b/g) || [] : []).filter((k) => !['true', 'false'].includes(k));

test('Acts III and IV and the Finale are rewritten as threads; the length model: each Act mission 25-42 minutes, the Finale 90 or less', () => {
  for (const ch of ['act3', 'act4', 'finale']) {
    for (const m of MISSIONS[ch]) {
      const e = estimate(m);
      if (ch === 'finale') assert.ok(e.total <= 90 && e.total >= 40, `${m.key}: ${e.total} min (the Finale is 90 or less)`);
      else assert.ok(e.total >= 25 && e.total <= 42, `${m.key}: ${e.total} min`);
      assert.ok(e.main / e.total >= 0.7, `${m.key}: main ${e.main} of ${e.total}`);
      assert.deepEqual([e.main, e.optional], [m.minutes.main, m.minutes.optional], `${m.key}: its declared minutes are the model's`);
      assert.ok(m.done && (m.autoExit != null || ch === 'finale'), `${m.key}: it ends on its last thread (the Finale on its ending)`);
      assert.ok(m.quarters.every((q) => (q.threads || []).length + (q.sides || []).length > 0), `${m.key}: no empty quarter`);
    }
  }
  const total = (ch) => MISSIONS[ch].reduce((a, m) => a + estimate(m).total, 0);
  assert.ok(total('act3') >= 170 && total('act3') <= 210, `Act III: ${total('act3')} min`);
  assert.ok(total('act4') >= 140 && total('act4') <= 175, `Act IV: ${total('act4')} min`);
});

test('the global ledgers: every question is answered in its mission, a deduction\'s evidence can be had before it, no main thread waits on a side story', () => {
  const idx = (k) => main.findIndex((x) => x.key === k);
  const SET = main.map((mm) => factsSetBy(mm));
  const MAIN = main.map((mm) => factsSetBy(mm, { sides: false }));
  const setBy = (k, upTo) => SET.slice(0, upTo + 1).some((f) => f.has(k));
  // every question: its answer is a rewritten mission, and some of the evidence pinned under it can be found by then
  for (const q of QUESTIONS) {
    const a = idx(q.answer);
    assert.ok(a >= 0 && isRewritten(main[a]), `${q.id}: answered in ${q.answer}`);
    for (const p of q.partly || []) assert.ok(idx(p) >= 0 && idx(p) <= a, `${q.id}: partly in ${p}`);
    if (q.clues.length) assert.ok(q.clues.some((k) => setBy(`ev_${k}`, a)), `${q.id}: none of its evidence (${q.clues}) can be found by ${q.answer}`);
    for (const k of q.clues) assert.ok(EV_KEYS.has(k), `${q.id}: ev_${k} is set somewhere`);
  }
  // a deduction's right answer needs only what can be had before it: in an earlier mission, or this one's own threads
  let ded = 0;
  for (const [i, mm] of main.entries()) {
    for (const [id, d] of Object.entries(mm.deductions || {})) {
      const right = d.answers.find((x) => x.correct);
      for (const k of IDS(right.needs)) {
        ded++;
        assert.ok(MAIN[i].has(k) || SET.slice(0, i).some((f) => f.has(k)), `${mm.key}/${id}: needs ${k}, which nothing before it sets on the main path`);
      }
    }
  }
  assert.ok(ded >= 20, `${ded} pieces of evidence checked`);
  // no main thread waits on something only a side story sets (in its own mission)
  for (const [i, mm] of main.entries()) {
    const sideOnly = new Set([...SET[i]].filter((k) => !MAIN[i].has(k) && !SET.slice(0, i).some((f) => f.has(k))));
    for (const t of threadsOf(asDeck(mm)).filter((x) => !x.side)) {
      for (const k of [...IDS(t.when), ...IDS(t.done), ...(t.of || [])]) assert.ok(!sideOnly.has(k), `${mm.key}/${t.id} waits on ${k}, which only a side story sets`);
      for (const a of t.after || []) assert.ok(!threadsOf(asDeck(mm)).find((x) => x.id === a)?.side, `${mm.key}/${t.id} comes after a side thread (${a})`);
    }
    for (const k of IDS(mm.done)) assert.ok(!sideOnly.has(k), `${mm.key}: its end waits on ${k}, a side story's`);
  }
});

test('Acts I to IV and the Finale: nothing that ends a mission answers before the story reaches it (gateAfter)', () => {
  let n = 0;
  for (const ch of ['act1', 'act2', 'act3', 'act4', 'finale']) {
    for (const m of MISSIONS[ch]) {
      assert.ok(m.gateAfter, `${m.key}: its threads' own interactions wait on what they come after`);
      const { level } = LEVELS.find((l) => l.deck.mkey === m.key);
      const deck = asDeck(m);
      const thr = threadsOf(deck);
      const byId = Object.fromEntries(thr.map((t) => [t.id, t]));
      const chain = (t, seen = new Set()) => { for (const a of t.after || []) if (!seen.has(a)) chain(byId[a], seen.add(a)); return seen; };
      // a thread's own spot, trigger, deduction, record or playback names every thread it comes after, and every thread
      // those come after (a talk or an evidence spot is free: a thread done early must not open the rest of the chain)
      for (const t of thr.filter((x) => x.after?.length)) {
        const mine = level.interactables.filter((it) => it.id === (t.scene || t.id) && t.spot || [`deduce_${t.id}`, `residue_${t.id}`, `playback_${t.id}`].includes(it.id));
        if ((t.kind === 'go' || t.kind === 'stealth') && t.at && !t.done) mine.push(...level.triggers.filter((tr) => Object.keys(tr.set || {}).includes(`t_${m.key}_${t.id}`)));
        for (const it of mine) for (const a of chain(t)) { n++; assert.ok(new RegExp(`\\bt_${m.key}_${a}\\b`).test(it.when || ''), `${m.key}/${t.id}: ${it.id || 'its trigger'} waits on ${a}`); }
      }
      // as a chapter starts (its PRIMES, faction neutral), nothing that sets what the mission ends on answers, in any year
      const f = new FactStore();
      for (const c of ORDER.slice(0, ORDER.indexOf(ch) + 1)) for (const k of PRIMES[c] || []) (Array.isArray(k) ? f.set(k[0], k[1]) : f.set(k));
      f.set('faction', 'neutral');
      // (what the mission ends on, and what ends it in turn: a staged moment plays by itself once what it comes after is done)
      const ends = new Set(IDS(m.done));
      for (let more = true; more;) {
        more = false;
        for (const t of thr) {
          if (!ends.has(`t_${m.key}_${t.id}`)) continue;
          const add = [...IDS(doneCond(deck, t) || ''), ...(t.kind === 'cinema' && t.lines?.length ? (t.after || []).map((a) => `t_${m.key}_${a}`) : [])];
          for (const k of add) if (!ends.has(k)) { ends.add(k); more = true; }
        }
      }
      const setsEnd = (node) => [node, ...(node?.choices || [])].some((x) => Object.keys(x?.set || {}).some((k) => ends.has(k)));
      // (open in some year: the thing's own condition and the node's, together)
      const open = (...whens) => ['PRESENT', 'PAST', 'FUTURE'].some((st) => whens.every((w) => f.test(w || 'true', st)));
      for (const it of level.interactables) {
        const node = m.scenes?.[it.scene];
        if (node && setsEnd(node)) { n++; assert.ok(!open(it.when, node.when), `${m.key}: ${it.id} ends the mission from its start`); }
      }
      for (const tr of level.triggers) if (Object.keys(tr.set || {}).some((k) => ends.has(k))) { n++; assert.ok(!open(tr.when), `${m.key}: a trigger ends the mission from its start`); }
      for (const p of level.npcs.filter((x) => !x.silent)) { // (DeckWorld offers no talk to a silent one)
        const talk = m.talks?.[p.id] || m.talks?.[p.crew];
        for (const node of (talk || []).filter(setsEnd)) { n++; assert.ok(!open(p.when, node.when), `${m.key}: ${p.id} ends the mission from its start`); }
      }
    }
  }
  assert.ok(n >= 300, `${n} gates checked`);
});

test('Acts I and II: the people a main conversation needs are met in person, not as echoes (U7 review: Sera, Niko)', () => {
  // (who is met in one year only, by the story's choice, and where: an echo elsewhere says so)
  const ONE_YEAR = { 'm08/rook': ['PRESENT'], 'm13/sera': ['PRESENT'] };
  let n = 0;
  for (const m of [...MISSIONS.act1, ...MISSIONS.act2]) {
    const { level } = LEVELS.find((l) => l.deck.mkey === m.key);
    for (const t of threadsOf(asDeck(m)).filter((x) => x.kind === 'talk' && !x.side)) {
      const people = level.npcs.filter((p) => (p.id === t.npc || p.crew === t.npc) && !p.silent);
      assert.ok(people.length, `${m.key}/${t.id}: ${t.npc} is placed`);
      for (const p of people) {
        n++;
        const key = `${m.key}/${p.id}`;
        if (ONE_YEAR[key]) assert.deepEqual(p.temporal, ONE_YEAR[key], `${key}: in person in ${ONE_YEAR[key]}`);
        else assert.ok(!p.temporal, `${key}: an echo in some of ${m.states} (${p.temporal}), yet ${t.id} needs them`);
      }
    }
  }
  assert.ok(n >= 15, `${n} people`);
  // Sera's echo at the war's gate says where she is; Brask stands only in the war's year
  const m13 = LEVELS.find((l) => l.deck.mkey === 'm13').level;
  assert.ok(m13.npcs.find((p) => p.id === 'sera').echoLines?.some((l) => l.who === 'SERA'));
  assert.equal(m13.npcs.find((p) => p.id === 'brask').when, '@PRESENT');
});

// U7 review: a crowd says its own lines, not another mission's (Brask's loop bark in a 2026 port, a lockdown in V17)
test('Acts I and II: crowds say their own lines, never another mission\'s pool (Rain City South\'s, Helix\'s storm night, Loop City\'s)', () => {
  const HOME = { rain: ['m01'], helix: ['m02', 'm03'], loop: ['m09'] };
  let n = 0;
  for (const m of [...MISSIONS.act1, ...MISSIONS.act2, MISSIONS.act3[0]]) {
    const { level } = LEVELS.find((l) => l.deck.mkey === m.key);
    for (const p of level.npcs.filter((x) => x.crowd && x.barks?.length)) {
      for (const [pool, homes] of Object.entries(HOME)) {
        if (homes.includes(m.key)) continue;
        n++;
        const theirs = p.barks.filter((b) => AMBIENT[pool].barks.includes(b));
        assert.deepEqual(theirs, [], `${m.key}: ${p.id} says ${pool}'s lines`);
      }
    }
  }
  assert.ok(n >= 60, `${n} crowd voices checked`);
});

// U7 review: the set pieces the review found built as one press or an empty walk, and the clues that disagreed
test('Acts I and II (U7 review): the escapement, the morning that agrees, the chamber\'s troopers, the lockdown, the district\'s choice, the cold opens', () => {
  const m = (k) => main.find((x) => x.key === k);
  const lv = (k) => LEVELS.find((l) => l.deck.mkey === k).level;
  const thr = (k, id) => threadsOf(asDeck(m(k))).find((t) => t.id === id);
  // M6: neutral clocks; each takes only its window hour, in its year, once the window is read
  const m6 = m('m06');
  assert.ok(thr('m06', 'clocks').spots.every((sp) => sp.prompt === 'THE BRASS CLOCK') && thr('m06', 'clocks').after.includes('windows') && !thr('m06', 'windows').until);
  for (const [id, year, hour, fact] of [['clock26', 'PAST', 'Morning.', 'clk_26'], ['clock49', 'PRESENT', 'Evening.', 'clk_49'], ['clock96', 'FUTURE', 'Noon.', 'clk_96']]) {
    const node = m6.scenes[id];
    assert.ok(node.when.includes(`@${year}`) && node.when.includes('ev_window_faces'), `${id}: its year, after the window`);
    assert.deepEqual(node.choices.filter((c) => c.set?.[fact]).map((c) => c.label), [hour], `${id}: only ${hour}`);
  }
  // M8: the reconstruction agrees with the Prologue (05:40 the card; 08:13 the ring; 08:14 the missing second)
  const labels = thr('m08', 'reconstruct').entries.map((e) => e.label).join(' ');
  assert.ok(/05:40\. Chamber One opens on Varen's card/.test(labels) && /08:13\. The ring turns\. At 08:14/.test(labels) && !/05:30|05:39/.test(labels), labels);
  assert.equal(thr('m08', 'reconstruct').echoes.find((e) => e.crew === 'witness').variant, 'hooded', 'the man at the console keeps his face out of the light');
  // M8: at the lockdown the island has a drone of its own, and the court's last quarter hunts further and faster
  const isl = lv('m08').sentinels.filter((sn) => /_q2s\d+$/.test(sn.id));
  assert.ok(isl.length === 2 && isl.some((sn) => /lin_gone/.test(sn.when || '') && sn.y === 0.4), JSON.stringify(isl.map((sn) => [sn.id, sn.when])));
  // (and the breach seals the cube round Kai: in 2049 its door holds; Lin is spoken to inside it; the terminal is 2049's)
  const sealed = walkRoute(lv('m08'), 'PRESENT', [0, 0.4, 4.6], [[0, 10]], { lin_gone: true });
  assert.ok(sealed.stuck, `sealed in 2049: ${JSON.stringify(sealed)}`);
  const lin = lv('m08').npcs.find((n) => n.id === 'lin_cube');
  assert.ok(Math.abs(lin.pos[0]) < 7.8 - 3.2 && Math.abs(lin.pos[2]) < 7.8 - 3.2 && /@PRESENT/.test(lin.when), `Lin is spoken to from inside the cube: ${JSON.stringify(lin.pos)}`);
  assert.ok(m('m08').scenes.version.when === '@PRESENT' && m('m08').scenes.version_no && /@PRESENT/.test(isl.find((sn) => sn.when).when));
  const defs = isl.map((sn) => ({ ...sn }));
  const f8 = new FactStore();
  f8.set('lin_gone');
  m('m08').adjust({ sentinels: defs }, { g: { facts: f8 } });
  assert.ok(defs.every((d, i) => d.range === isl[i].range + 4 && d.speed > isl[i].speed), 'a load in the lockdown keeps them hunting');
  // M10: troopers on the testing chamber's floor and by the skiff; the crossing waits on an Echo Step; the lamps the cut
  // blinds are the gallery's and the crown's only
  const dam = lv('m10').sentinels;
  assert.ok(dam.filter((sn) => sn.y === -12).length === 3, JSON.stringify(dam.map((sn) => [sn.id, sn.y])));
  // (the arrival asks for the step; the objective shows from the start)
  assert.ok(thr('m10', 'cross').kind === 'stealth' && !thr('m10', 'cross').when && thr('m10', 'yard').kind === 'stealth');
  assert.ok(lv('m10').triggers.some((tr) => tr.set.t_m10_cross && /echo_steps >= 1/.test(tr.when) && /t_m10_projector/.test(tr.when)));
  const lamps = dam.map((sn) => ({ ...sn }));
  const f10 = new FactStore();
  f10.set('power_cut');
  m('m10').adjust({ sentinels: lamps }, { g: { facts: f10 } });
  assert.ok(lamps.every((sn) => (sn.y === -12 ? sn.range === 9 : sn.range === 3.5)), 'the chamber\'s floodlights are its own');
  // M13: the choice and the district agree, the district is shot at the block, and the block changes with the choice
  const st = m('m13').scenes.stabilizer.choices, dist = thr('m13', 'district');
  assert.ok(!st.some((c) => c.lines.some((l) => /war does not|walk out/.test(l.text))) && dist.shots?.length && dist.lines.length === 2);
  const w = lv('m13');
  assert.ok(w.crowd.some((c) => c.when === 'civilians_freed' && c.role === 'trapped') && w.crowd.some((c) => c.freezeWhen === 'stabilizer_destroyed'));
  assert.ok(m('m13').fx.listenersRoute && m('m13').talks.m13_listener[0].then === 'listenersRoute', 'the people who listened draw the patrol off');
  // the cold opens: their years and their people
  assert.deepEqual(['m06', 'm07', 'm11', 'm12'].map((k) => m(k).coldOpen.year), ['PAST', 'PAST', 'PAST', 'FUTURE']);
  for (const k of ['m04', 'm06', 'm07', 'm09', 'm12']) assert.ok(m(k).coldOpen.cast?.length && lv(k).npcs.some((n) => n.id === 'co_0'), `${k}: its cold open stages its people`);
  // nits: the ash says they left; Tala's echo keeps the cliff's order to itself
  assert.ok(m('m04').deductions.panels.answers.find((a) => a.correct).lines[0].text.includes('They left.'));
  assert.ok(!NPCS.tala.echo.some((l) => /Left, right/.test(l.text)));
});

// U7 review: a cold open is shot in its own year (Mission 12's 2196), with its own people, and the place gets its year back
test('a cold open is shot in its own year, with its people, and the place\'s year comes back after it', () => {
  const m12 = MISSIONS.act2.find((m) => m.key === 'm12');
  const { level } = LEVELS.find((l) => l.deck.mkey === 'm12');
  const e = engine();
  for (const r of level.order) { e.setAvailable(r, level.rooms[r].states || m12.states); e.setState(r, 'PRESENT', { force: true }); }
  const seen = [];
  const facts = new FactStore();
  const game = { engine: e, facts, campaign: { lv: true, deck: 3 }, story: { decks: MISSIONS.act2 }, hud: { card() {} }, deckWorld: { refresh() {} } };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV, level, chapter: 'act2', chapterStart: false,
    whenVoices: (then) => then(), hideCard() {}, cinema: { play: (o, done) => { seen.push([o.shots ? 'shot' : 'card', e.state(level.outdoorRoom), facts.get('co_m12')]); done(); } } });
  rt.openMission(m12, 'MISSION 12');
  assert.deepEqual(seen[0], ['shot', 'FUTURE', true], 'the cold open: 2196, the Witness in the shot');
  assert.ok(seen.slice(1).every(([k, y]) => k === 'card' && y === 'PRESENT'), JSON.stringify(seen));
  assert.equal(e.state(level.outdoorRoom), 'PRESENT', 'the place is back in its own year');
  assert.ok(!facts.get('co_m12'), 'and its cast has left');
});

test('the hold (Mission 18): posts at the place\'s landmarks, each re-anchored in its own year; allies and the lock city change it', () => {
  const m18 = main.find((x) => x.key === 'm18');
  const t = threadsOf(asDeck(m18)).find((x) => x.kind === 'hold');
  const level = LEVELS.find((l) => l.deck.mkey === 'm18').level;
  assert.ok(THREAD_KINDS.includes('hold') && MINUTES.hold > 0);
  assert.ok(t && t.secs >= 60 && t.posts.length === 3, 'two minutes, three pylons');
  assert.deepEqual(t.posts.map((p) => p.year).sort(), ['FUTURE', 'PAST', 'PRESENT'], 'one pylon in each year');
  for (const [i, p] of t.posts.entries()) assert.ok(level.landmarks[p.at] && level.interactables.some((x) => x.scene === `hold:${t.id}:${i}`), `a post at ${p.at}`);
  assert.ok(Object.keys(t.allies).some((c) => /unwritten/.test(c)) && /city_freed/.test(t.slow), 'the Unwritten hold a pylon; the freed city slows the drift');
  assert.equal(t.set.inv_cap, 12, 'the repaired Chronolith holds twelve seconds');
  // the slab stair is the way up, and only after the hold
  assert.deepEqual(threadsOf(asDeck(m18)).find((x) => x.id === 'slabStair').after, ['hold']);
});

test('Act III: the lift ride, the dual archive, the museum\'s memories, the archive\'s confession, the slab stair', () => {
  const m = (k) => main.find((x) => x.key === k);
  const sets = (o, k) => { const out = []; walkObj(o, (x) => { if (x.set && k in x.set) out.push(x.set[k]); }); return out; };
  const thr = (k, id) => threadsOf(asDeck(m(k))).find((t) => t.id === id);
  const proc = (k, id) => m(k).processes.find((p) => p.id === id);
  assert.ok(proc('m14', 'liftCar').kind === 'fall' && proc('m14', 'transitBridge').kind === 'collapse', 'M14: a lift car that rises, a span that comes back');
  assert.deepEqual(sets(m('m14').talks, 'trust_sera').sort(), ['accept', 'ask', 'deny']);
  assert.deepEqual(thr('m15', 'ink').of, ['inv_card14_done', 'inv_archiveA_done', 'inv_archiveB_done']);
  assert.ok(thr('m15', 'ink').set.ev_dual_archive && thr('m15', 'ink').set.quest_mara === 'resolved', 'chain C resolves on the main path');
  assert.deepEqual(m('m15').scenes.lock.choices.map((c) => Object.keys(c.set)[0]).sort(), ['city_freed', 'city_stabilized'], 'Anja\'s two facts');
  assert.ok(m('m16').deductions.museum.answers.find((a) => a.correct).needs.includes('ev_memory_three'));
  assert.deepEqual(sets(m('m16').scenes, 'photo_taken').sort(), [false, true]);
  assert.ok(thr('m17', 'memory').set.ev_i_pressed && thr('m17', 'reconstruct').of.includes('ev_two_logs'));
  assert.ok(proc('m18', 'slabs').span.pieces >= 8 && thr('m18', 'slabStair').of[0] === 'rev_slabs', 'M18: the slab stair is REVERSE, last fallen first');
});

test('Act IV: the shadowless door, the memories that refuse, the elites\' rewind and the arena, the first second', () => {
  const m = (k) => main.find((x) => x.key === k);
  const thr = (k, id) => threadsOf(asDeck(m(k))).find((t) => t.id === id);
  // M19: the bridge in the reflection; the real door has no shadow (C9); who leads into Mira's memory
  assert.ok(m('m19').rules.some((r) => r.when === 'inv_reflectionLag_done' && r.set.m19_synced), 'the lag, reversed, brings the bridge into step');
  assert.ok(m('m19').deductions.door.answers.find((a) => a.correct).label.includes('no shadow'));
  assert.deepEqual(m('m19').talks.mira19[0].choices.map((c) => c.set.m20_lead).sort(), ['kai', 'mira']);
  // M20: every target refuses (A MEMORY), Mira answers the first try; the alignment keeps each memory's own order
  assert.ok(m('m20').processes.every((p) => p.kind === 'refusal' && p.refuse === 'A MEMORY' && p.lineWho === 'MIRA'));
  const facts = new FactStore();
  facts.set('m20_lead', 'kai');
  const rt = { g: { facts } };
  const node = () => m('m20').nodes.align(rt);
  const pick = (label) => { const c = node().choices.find((x) => x.label === label); for (const [k, v] of Object.entries(c.set || {})) facts.set(k, v); return c; };
  assert.ok(pick('One line. Mine first.').lines.some((l) => l.who === 'MIRA'), 'Kai leading: his tidy version is refused');
  assert.ok(!pick('The ring turns.').set, 'a moment before its own memory\'s first is refused');
  for (const label of ['She asks to see the ring turn.', 'The 41 is late.', 'The drawing goes on the fridge.', 'The ring turns.', 'She plants the garden.']) pick(label);
  assert.ok(!facts.get('m20_aligned'));
  pick('The song, in the kitchen.');
  assert.ok(facts.get('m20_aligned'), 'an interleaving that keeps each memory\'s order is hers');
  assert.ok(m('m20').scenes.align && m('m20').spoken.align.length >= 5, 'the board\'s lines are walked for the voice');
  // M21: elites rewind (Echo Step snaps them back; REVERSE leaves them stuck); the arena's gaps; going alone works
  assert.ok(m('m21').processes.filter((p) => p.mode === 'rewind').every((p) => p.stuck === 6 && /_q0s\d$/.test(p.target)));
  assert.equal(typeof m('m21').onEcho, 'function');
  assert.ok(['arenaGap1', 'arenaGap2'].every((id) => m('m21').processes.find((p) => p.id === id)?.when === 'arena_fallen'));
  assert.ok(thr('m21', 'arena').set.arena_fallen && thr('m21', 'prisoners').when === 'prisoners_held');
  // M22: the seals come out in reverse causal order; the logs are evidence, the memory cards refuse
  assert.deepEqual(m('m22').processes.find((p) => p.id === 'finalSeals').bolts, ['RIVER', 'WALL', 'GATE', 'MACHINE']);
  assert.ok(m('m22').processes.find((p) => p.id === 'clockArm').beat, 'the arm answers on its counted beat');
  assert.equal(m('m22').processes.find((p) => p.id === 'memoryCards').refuse, 'A MEMORY');
  const ev = m('m22').deductions.evidence.answers.find((a) => a.correct);
  assert.ok(/inv_twoLogs_done/.test(ev.needs) && ev.lines.some((l) => l.who === 'WITNESS' && l.text === '…No. I was a second early.'));
  assert.equal(lexicon('RING: 16:02:00. CONSOLE BUTTON: 16:02:01.'), 'Ring: sixteen oh two exactly. Console Button: sixteen oh two and one second.');
});

test('the Finale: two holds at once, Mira asks, the three endings with what they add, the epilogue and the voice in every speaker', () => {
  const m23 = main.find((x) => x.key === 'm23');
  assert.deepEqual(m23.processes.map((p) => p.id).sort(), ['settlementBridge', 'streetCollapse'], 'the street he holds, the bridge Kai holds');
  assert.ok(/heldBy/.test(String(m23.step)) && /rev_settlementBridge/.test(String(m23.step)));
  assert.ok(m23.talks.mira23[0].lines.some((l) => l.who === 'MIRA' && l.text === 'Ask me.'));
  const f = new FactStore();
  for (const [k, v] of [['ending', 'C'], ['ev_no_owner', true], ['jun_line', true], ['city_freed', true]]) f.set(k, v);
  const c = endingLines('C', f);
  const texts = c.map((l) => l.text);
  assert.ok(texts.includes('Rain City, a Tuesday. The 41 is late.') && texts.includes('A woman plants something in a window box and hums three notes: up, up, and then down.'));
  assert.ok(c.some((l) => l.who === 'KAI' && l.text === 'Live.' && l.voice?.fx === 'echo'), 'C: Kai, faintly, through the echo');
  assert.ok(texts.includes('There\'s a letter in my desk to a brother I never had. I keep meaning to send it.'), 'C: the house with no owner');
  assert.ok(texts.includes('They all got off. I stopped apologizing.') && texts.includes('We planted things.'), 'one epilogue line per fact set');
  f.set('ending', 'A');
  assert.ok(!endingLines('A', f).some((l) => l.text.startsWith('There\'s a letter')), 'the letter is Ending C\'s');
  assert.deepEqual([POSTCREDIT[0].who, POSTCREDIT[0].text, POSTCREDIT[0].voice.fx], ['VOICE', 'Version one hundred and eighteen.', 'pa']);
  assert.ok(EPILOGUE.length >= 18 && EPILOGUE.every((l) => { compileCondition(l.when); return true; }));
});

test('CASE FILES: fourteen stories with their bible state; twelve replays, each a side story from its place with the facts the player had', () => {
  assert.equal(CASE_FILES.length, 14);
  const keys = CASE_FILES.map((c) => c.key).filter(Boolean);
  assert.deepEqual(keys.sort(), MISSIONS.cases.map((m) => m.key).sort(), 'every replay key is an entry');
  assert.equal(new Set(CASE_FILES.map((c) => c.id)).size, 14);
  for (const c of CASE_FILES) for (const k of ['start', 'resolved', 'observed']) compileCondition(c[k]);
  const empty = new FactStore();
  assert.ok(CASE_FILES.every((c) => caseState(empty, c) === 'open') && Object.keys(CASE_STATES).length === 4);
  const done = new FactStore();
  for (const k of ['quest_tala', 'water_route']) done.set(k);
  assert.equal(caseState(done, CASE_FILES.find((c) => c.id === 'chainB')), 'resolved');
  done.set('ev_tala23');
  assert.equal(caseState(done, CASE_FILES.find((c) => c.id === 'chainB')), 'observed');
  for (const r of MISSIONS.cases) {
    const origin = main.find((x) => x.key === r.origin);
    assert.ok(origin && isRewritten(origin) && r.voiceGroup === origin.chapter, `${r.key}: from ${r.origin}, in its voice`);
    const q = r.quarters[r.startQuarter];
    assert.ok(q.threads.length && r.quarters.every((x, i) => i === r.startQuarter || !x.threads.length), `${r.key}: its threads, in the quarter it lives in`);
    assert.ok(r.clear.length && IDS(r.done).every((k) => r.clear.includes(k)), `${r.key}: what it waits for is cleared`);
    const level = LEVELS.find((l) => l.deck.mkey === r.key)?.level;
    assert.ok(level?.exit && level.quarters[r.startQuarter]?.spawn, `${r.key}: it builds, with a spawn where its story lives`);
    // after a whole game, with the story's own facts cleared, nothing of it is done yet
    const f = new FactStore();
    for (const k of factsSetBy(origin)) f.set(k, true);
    for (const k of r.clear) f.set(k, false);
    for (const t of threadsOf(asDeck(r))) assert.ok(!isDone(f, asDeck(r), t), `${r.key}/${t.id} is done before it is replayed`);
    assert.ok(!f.test(r.done), `${r.key}: its end holds before it is replayed`);
  }
  // the old saves' cases load where they were
  assert.deepEqual([MISSIONS.cases[0].key, MISSIONS.cases[1].key], ['c_b', 'c_c']);
  assert.ok(CHAPTERS.cases.name === 'CASE FILES');
});
