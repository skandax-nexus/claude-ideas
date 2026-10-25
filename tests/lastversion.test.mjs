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
import zlib from 'node:zlib';
import { RealityEngine } from '../game/js/core/RealityEngine.js';
import { FactStore } from '../game/js/core/FactStore.js';
import { compileCondition } from '../game/js/core/conditions.js';
import { LV, allLines } from '../game/js/editions/lastversion/index.js';
import { LastVersion, MISSIONS, CHAPTERS, ORDER, HINTS, HINTS_REVERSE, PRIMES, migrateSave } from '../game/js/editions/lastversion/Runtime.js';
import { RULES, INV_LINES } from '../game/js/editions/lastversion/inversion.js';
import { checkRecord, makeRecord, colliderEntry, Process, MAX_PROCESSES, MAX_PARTS, WEIGHTS, KINDS } from '../game/js/editions/lastversion/processes.js';
import * as THREE from '../game/vendor/three.module.min.js';
import { ENDINGS, LOCK_ORDER, CASE_FILES, CASE_STATES, caseState } from '../game/js/editions/lastversion/acts.js';
import { ENDING_SHOTS } from '../game/js/editions/lastversion/finale.js';
import { Cinema } from '../game/js/editions/lastversion/cinema.js';
import { HUD } from '../game/js/ui/HUD.js';
import { hazardAt, musicGain } from '../game/js/editions/lastversion/act2.js';
import { NPCS, DIALOGUE, AMBIENT, npcState, JUN_HOOK, WATER_HOOK, MARA_HOOK, IVEN_HOOK } from '../game/js/editions/lastversion/npcs.js';
import { PLACES, signature, quartersOf } from '../game/js/editions/lastversion/places/index.js';
import { SKIES } from '../game/js/editions/lastversion/places/years.js';
import { MATS, SURFACES } from '../game/js/editions/lastversion/places/materials.js';
import { KIT_NAMES } from '../game/js/editions/lastversion/places/kits.js';
import { STYLES } from '../game/js/editions/lastversion/places/styles.js';
import { Player } from '../game/js/entities/Player.js';
import { LV_MODELS, SHARED_MODELS, MANIFEST, CHAPTER_CAST, COMMON, sexOf, isChild, castOf } from '../game/js/editions/lastversion/casting.js';
import { WARDROBE, hasVariant, packRules, SETTLEMENT, PRESENT_PALETTES, holoDepth, recoloured, redye, dyeRule, LEATHER, DYE, KID_LIGHT, kidOutfit } from '../game/js/editions/lastversion/wardrobe.js';
import { Fx } from '../game/js/world/Fx.js';
import { ERAS, EXCEPTIONS, AMBIENT_CAST, eraModels, MAX_PEOPLE, MET, CAP, OLD, PALETTE, PALETTE_ROLES, ROLE_NAMES } from '../game/js/editions/lastversion/crowds.js';
import { PIECES, MASS_DEFAULT, clothe, _dbg as GARMENT_DBG } from '../game/js/editions/lastversion/garments.js';
import { M21 } from '../game/js/editions/lastversion/act4.js';
import { MISSION_BARKS } from '../game/js/editions/lastversion/barks.js';
import { M01, m01Shots } from '../game/js/editions/lastversion/prologue.js';
import { WATCHERS, HUMAN, watcherModels, kindsOf } from '../game/js/editions/lastversion/watchers.js';
import { spokenLines, buildLevels, voiceOf, lexicon, GROUPS, chapterCardLines, missionCardLines, endingLines, POSTCREDIT, choiceLine, numberWords } from '../game/js/editions/lastversion/voicelines.js';
import { voicePieces } from '../game/js/audio/voiceKey.js';
import { KINDS as THREAD_KINDS, MINUTES, threadsOf, sidesOf, quartersOf as threadQuarters, factOf, isRewritten, estimate, doneCond, sideState, isDone, roomAt, Threads, placedFact, playFact } from '../game/js/editions/lastversion/Threads.js';
import { QUESTIONS, CLUES, CONSEQUENCES, PREVIOUSLY, EPILOGUE, MISSION_ORDER, missionIndex } from '../game/js/editions/lastversion/ledger.js';
import { SAVE_FORMAT } from '../game/js/editions/lastversion/Runtime.js';
import { reverseEarned } from '../game/js/editions/lastversion/Runtime.js';
import { ROAM, roamIndex, reachedPlaces, roamYears, roamSave, storyFromRoam, roamFree, finished, placeName, ROAM_ONLY } from '../game/js/editions/lastversion/roam.js';

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
  for (const s of ['com.afterzero.lastversion.v2_1', 'versionName="2.1.0"', 'versionCode="210"', 'AFTERZERO-LastVersion-v$VER.apk', 'AFTERZERO: Last Version 2.1', "window.AZ_EDITION='lastversion'"]) assert.ok(build.includes(s), `build-apk.sh: ${s}`);
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

test('REVERSE reads as the one held process running backwards: a fallen piece rises to where it was and stays while held, then falls again; water drains back; a settled kind stays', () => {
  // (the bible: "reverse selected motion or mechanism - local and readable"; nothing about it is gravity)
  const level = { rooms: { r: { bounds: [[-10, -1, -30, 10, 10, 0]], spawn: [0, 0.86, -1.6, 0] } }, order: ['r'] };
  const anchor = { pos: [0, 0, -10], yaw: 0, room: 'r' };
  const at = (mesh, p) => mesh.position.distanceTo(new THREE.Vector3(...p)) < 1e-3;
  for (const kind of ['collapse', 'fall', 'burn', 'projectile']) {
    const env = fakeEnv();
    const rec = makeRecord({ id: kind, kind, parts: [{ shape: 'box', size: [1, 0.3, 1], at: [0, 1.5, 0], rest: { at: [0.4, 0.15, 1], rot: [0.3, 0.2, 0] }, solid: true }], hints: ['a', 'b', 'c'] }, anchor, level);
    const p = new Process(rec, env);
    const mesh = p.meshes[0], part = rec.parts[0];
    assert.ok(at(mesh, part.rest.p), `${kind}: it lies where it fell`);
    p.reverse();
    run(p, 0.25);
    assert.ok(p.P > 0 && p.P < 1 && !at(mesh, part.rest.p) && !at(mesh, part.origin.p), `${kind}: a quarter second in, it is on its way back (P ${p.P.toFixed(2)})`);
    const ev = run(p, 4);
    assert.ok(p.P === 1 && at(mesh, part.origin.p), `${kind}: held, it is back where it was`);
    assert.ok(ev.some((e) => e.type === 'origin' || e.type === 'settled'), `${kind}: it says it got there`);
    assert.equal(env.deckWorld.temps.length, 1, `${kind}: seated, it is solid (a stair or a bridge carries Kai)`);
    p.release();
    run(p, 4);
    if (rec.settle === 'held') {
      assert.ok(p.P === 0 && at(mesh, part.rest.p), `${kind}: let go, it goes forward again to where it fell`);
      if (kind !== 'fall') assert.equal(env.deckWorld.temps.length, 0, `${kind}: fallen, nothing of it is solid`); // (a lift car is solid all along)
    } else assert.ok(p.settled && at(mesh, part.origin.p), `${kind}: a settled kind stays where REVERSE left it`);
    p.dispose();
  }
  // water: held, the flood drains back out of the hall; let go, it comes in again
  const flood = new Process(makeRecord({ id: 'flood', kind: 'flow', parts: [{ shape: 'box', size: [6, 1.2, 6], at: [0, 0.6, 0], mat: 'water' }], hints: ['a', 'b', 'c'] }, anchor, level), fakeEnv());
  const h0 = flood.meshes[0].scale.y;
  flood.reverse();
  run(flood, 3);
  assert.ok(h0 > 0.9 && flood.meshes[0].scale.y < 0.05, `the water drains while held (${h0} -> ${flood.meshes[0].scale.y.toFixed(2)})`);
  flood.release();
  run(flood, 3);
  assert.ok(flood.meshes[0].scale.y > 0.9, 'and floods again when let go');
  flood.dispose();
  // a mechanism turns in place, and backwards at its own speed while held
  const mech = new Process(makeRecord({ id: 'gear', kind: 'mechanism', spin: [0, 0, 1, 2], parts: [{ shape: 'box', size: [1, 1, 0.2], at: [0, 1.5, 0] }], hints: ['a', 'b', 'c'] }, anchor, level), fakeEnv());
  const q0 = mech.meshes[0].quaternion.clone();
  run(mech, 0.5);
  const fwd = mech.meshes[0].quaternion.clone();
  mech.reverse();
  run(mech, 0.6);
  assert.ok(q0.angleTo(fwd) > 0.9 && at(mech.meshes[0], mech.rec.parts[0].origin.p), 'a mechanism turns in place');
  const qa = mech.meshes[0].quaternion.clone();
  run(mech, 0.5);
  assert.ok(Math.abs(qa.angleTo(mech.meshes[0].quaternion) - q0.angleTo(fwd)) < 0.05 && mech.P === 1, 'held, it turns at its own speed');
  assert.ok(q0.angleTo(mech.meshes[0].quaternion) < q0.angleTo(qa) - 0.2, 'and backwards, toward where it started');
  mech.dispose();
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
    // people: the named and tier-2 people plus the crowds cast along level.crowd (crowds.js), within §4.7's 24 (the one
    // place the bible calls crowded, Mission 1's checkpoint, within its own 30)
    const crowdN = level.crowd.reduce((a, c) => a + c.n, 0);
    const named = level.npcs.filter((n) => !n.crowd).length;
    const crowd = level.npcs.filter((n) => n.crowd).length;
    const max = level.people || 24;
    // (closing: the Finale's road, whose Witness and Mira stand in five places each, one at a time, within its 34)
    assert.ok(max === 24 || (deck.mkey === 'm01' || deck.origin === 'm01') && max <= 30 || deck.mkey === 'm23' && max <= 34, `${here}: ${max} people allowed`);
    // (U4 review: a crowd may come out smaller than its share, where its faces run out: crowds.js CAP)
    const share = Math.min(crowdN, max - named);
    assert.ok(level.npcs.length <= max && crowd <= share && crowd >= Math.floor(share * 0.6), `${here}: ${level.npcs.length} people, ${named} named + ${crowd} of ${crowdN} in the crowd`);
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

// (closing: visuals) the shop Mission 1's story uses is walked into, the other shops are rooms behind glass; the plain
// finishes carry wear; Mission 11's rain moves; Mission 20's first experiment is a chamber, not Mission 19's white void;
// Mission 22's sky has no seam and each year lights its own wedges
test('the visual closing pass: the laundromat entered, shops behind glass, worn finishes, moving rain, the chamber, a seamless sky', () => {
  const lv = (key) => PLACED.find((l) => l.deck.mkey === key && l.s === 0).level;
  const m01 = lv('m01');
  const feed = m01.interactables.find((i) => i.id === 'camera');
  const inside = walkRoute(m01, 'PRESENT', [10, 0.15, -41.5], [[13.2, -41.5], [15.4, -41.5]]);
  assert.ok(!inside.stuck, `M1: through the laundromat's open door (${JSON.stringify(inside)})`);
  assert.ok(Math.hypot(inside.at[0] - feed.pos[0], inside.at[2] - feed.pos[2]) <= feed.r, 'M1: the shop camera\'s feed is watched from inside the shop');
  assert.ok(walkRoute(m01, 'PRESENT', [10.5, 0.15, -10], [[15.5, -10]]).stuck, 'M1: the corner shop is seen through its glass, not walked into');
  // (open world closing) the pharmacy, the café and the plaza's grocer are walked into by their doors, not through glass
  for (const [name, start, route, glass] of [
    ['the 24-hour pharmacy', [-11, 0.15, -6.5], [[-13.2, -6.5], [-15.4, -6.5]], [-11, 0.15, -9]],
    ['the café', [-11, 0.15, -37.35], [[-13.2, -37.35], [-15, -37.35]], [-11, 0.15, -40.3]],
    ['the grocer on the plaza', [-44, 0.15, -89.1], [[-46.5, -89.1], [-49.6, -89.1]], [-44, 0.15, -95]],
  ]) {
    const w = walkRoute(m01, 'PRESENT', start, route);
    assert.ok(!w.stuck, `M1: into ${name} by its door (${JSON.stringify(w)})`);
    assert.ok(walkRoute(m01, 'PRESENT', glass, [[route[route.length - 1][0], glass[2]]]).stuck, `M1: ${name}'s glass beside the door is glass`);
  }
  assert.ok(m01.vis.filter((v) => v.m === 'shopShelves').length >= 8 && m01.vis.some((v) => v.m === 'washerFront'), 'M1: the shops have their rooms, the laundromat its machines');
  for (const s of ['matte', 'satin', 'metal', 'cloth']) assert.ok(SURFACES[s].paint, `the ${s} finish carries its wear`);
  assert.ok(SURFACES.rainDown.scroll[1] > 0 && SURFACES.rainUp.scroll[1] < 0, 'M11: the rain falls in the west and rises in the east');
  const m11 = lv('m11');
  assert.ok(m11.vis.some((v) => v.m === 'rainDown') && m11.vis.some((v) => v.m === 'rainUp'), 'M11: the court\'s rain is the moving surfaces');
  const m20 = lv('m20');
  const now = m20.vis.filter((v) => v.e?.includes('PRESENT') && v.e.length === 1);
  assert.ok(!now.some((v) => v.m === 'voidWhite') && ['chamberPanel', 'chamberGrid', 'chamberLights', 'pencil'].every((m) => now.some((v) => v.m === m)), 'M20: 2049 is Chamber One, panelled, lit, gridded, the street in pencil');
  const wedges = PLACES.firstsecond.skyFeatures.all.filter((f) => f.kind === 'wedges');
  assert.equal(wedges.length, 3, 'M22: a sky of wedges for each year');
  assert.ok(wedges.every((f) => f.soft === 1), 'M22: the wedges run into each other (no seam)');
  assert.equal(new Set(wedges.map((f) => f.cols.join())).size, 3, 'M22: each year lights its own wedges');
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
  for (const [id, a] of Object.entries(AMBIENT_CAST)) assert.equal(a.pronoun, sexOf(a.model, a.variant), id);
  for (const { deck, s, level } of LEVELS) {
    for (const n of level.npcs) {
      const c = level.cast.find((x) => x.id === n.crew);
      assert.ok(c, `${deck.mkey}/${s}: ${n.id} is cast`);
      if (!c.model || sexOf(c.model, c.variant) === 'n') continue;
      assert.equal(SEX[(n.pronoun || c.pronoun)?.their], sexOf(c.model, c.variant), `${deck.mkey}/${s}: ${n.id} on ${c.model}/${c.variant}`);
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

// (closing) the Ancient Settlement three thousand years ago: wool and linen tunics, mantles, cloaks, sashes and belts made
// for each body (garments.js), its own faces (none a named one), its elders and storyteller old men, never Rocketbox's
// robe, kurta, hijab, abaya or head-cloth avatars; each of its places in its own palette
const SETTLEMENT_MISSIONS = ['m04', 'm05', 'm07', 'm22', 'm23', 'c_b'];
test('the settlement\'s people are dressed as people of three thousand years ago, in their own faces', () => {
  const conv = fs.readFileSync('tools/rocketbox-to-glb.mjs', 'utf8');
  const srcOf = (m) => new RegExp(`\\b${m}: \\{ src: '([^']+)'`).exec(conv)?.[1];
  // the avatars that wear today's Gulf and Islamic dress (a ghutra and thobe, a kurta and taqiyah, a lace-fringed hijab,
  // a khimar and abaya, a burqa) are gone from the edition; the girl in a head scarf is a child of 2196 only
  for (const gone of ['Adults/Male_Adult_15', 'Adults/Male_Adult_19', 'Adults/Male_Adult_21', 'Adults/Female_Adult_06', 'Adults/Female_Adult_10', 'Adults/Female_Adult_16']) {
    assert.ok(!Object.keys(LV_MODELS).some((m) => srcOf(m) === gone), `${gone} is not converted for the edition`);
  }
  assert.ok(!eraModels('ancient').has('rb_child_f2') && !Object.entries(AMBIENT_CAST).some(([id, a]) => a.model === 'rb_child_f2' && /^m[4-7]_/.test(id)), 'no head scarf in the settlement');
  // everyone of the settlement wears a tunic (a skirt at least), whoever they are
  const garbOf = (m, v) => WARDROBE[m]?.[v]?.garb;
  for (const id of ['niko', 'tala', 'elder']) {
    const n = NPCS[id];
    const g = garbOf(n.model, n.variant);
    assert.ok(g?.skirt && (g.mantle || g.cloak || g.sash) && g.belt, `${id} wears a tunic, a mantle or cloak and a belt: ${JSON.stringify(g)}`);
  }
  assert.ok(garbOf('rb_niko_old', 'older')?.skirt, 'Niko, older');
  let people = 0;
  for (const { deck, s, level } of LEVELS.filter((l) => SETTLEMENT_MISSIONS.includes(l.deck.origin || l.deck.mkey))) {
    for (const n of level.npcs) {
      const c = level.cast.find((x) => x.id === n.crew);
      if (!c?.model) continue;
      const ancient = c.era === 'ancient' || /^m[457]_/.test(n.crew) || ['niko', 'tala', 'elder'].includes(n.crew);
      if (!ancient) continue;
      people++;
      const g = garbOf(c.model, n.variant || c.variant);
      assert.ok(g?.skirt, `${deck.mkey}/${s}: ${n.id} (${c.model}/${n.variant || c.variant}) wears a tunic`);
      for (const k of Object.keys(g)) assert.ok(PIECES.includes(k), `${deck.mkey}/${s}: ${k} is a garment`);
    }
  }
  assert.ok(people >= 40, `${people} people of the settlement checked`);
  // an old man is an old man: the storyteller, the elders, the astronomer
  assert.ok(OLD.includes(AMBIENT_CAST.m4_teller.model) && OLD.includes(AMBIENT_CAST.m7_astro.model), 'the storyteller and the astronomer are old men');
  assert.ok(ERAS.ancient.elder.every(([m]) => OLD.includes(m)) && ERAS.ancient.storyteller.every(([m]) => OLD.includes(m)), 'the elders are old men');
  for (const m of OLD) assert.ok(['Adults/Male_Adult_05', 'Professions/Business_Male_07'].includes(srcOf(m)), `${m}: an old man (${srcOf(m)})`);
  // the girls of the settlement wear a woman's hair (a woman of the settlement, loaded with them); M4's girl is a girl
  const girls = Object.entries(WARDROBE.rb_child_m2).filter(([, v]) => v.sex === 'f');
  assert.ok(girls.length >= 6 && girls.every(([, v]) => ['rb_vill_f', 'rb_vill_f2'].includes(v.hairdo?.from)), 'the settlement\'s girls have hair, not a head cloth');
  assert.equal(sexOf(AMBIENT_CAST.m4_girl.model, AMBIENT_CAST.m4_girl.variant), 'f');
  // each place of the settlement in its own palette, and no two alike
  const dyes = (mkey) => {
    const out = new Set();
    for (const { level } of LEVELS.filter((l) => l.deck.mkey === mkey)) for (const n of level.npcs.filter((x) => x.crowd)) {
      const c = level.cast.find((x) => x.id === n.crew);
      if (c.era === 'ancient') out.add(c.variant.replace(/_?(boy|girl)?\d$/, ''));
    }
    return [...out];
  };
  assert.deepEqual(dyes('m04'), ['fire']);
  assert.deepEqual(dyes('m05'), ['water']);
  assert.deepEqual(dyes('m07'), ['sky']);
  assert.deepEqual(dyes('m23'), ['fest']);
  for (const [pal, outfits] of Object.entries(SETTLEMENT)) assert.ok(outfits.length >= 5 && outfits.flat().every((d) => /^[a-z]+$/.test(d)), pal);
});

// (closing) every generic role on a body that looks the part, and named for what it is; Tomas's own body; a crowded
// checkpoint that reads as crowded; each mission's casual crowd in its own colours
test('casting: generic roles look and are named the part, Tomas has a body of his own, the checkpoint is crowded, crowds dress by place', () => {
  const labels = new Set([...Object.values(ROLE_NAMES), ...Object.values(AMBIENT).flatMap((p) => Object.values(p.roles || {}))]);
  for (const { deck, s, level } of LEVELS) {
    for (const n of level.npcs.filter((x) => x.crowd)) {
      const c = level.cast.find((x) => x.id === n.crew);
      if (c.met) continue;
      // (a construction worker was 'Nurse', a doctor 'Student', a scavenger 'Medic': another region's names in turn)
      assert.ok(labels.has(c.first) && c.first === (AMBIENT[Object.keys(AMBIENT).find((k) => AMBIENT[k].roles?.[c.crowdRole] === c.first)]?.roles?.[c.crowdRole] || ROLE_NAMES[c.crowdRole]), `${deck.mkey}/${s}: a ${c.crowdRole} called ${c.first}`);
      // a paramedic is on the paramedic's body; a technician or a researcher in a uniform or a lab coat, never a T-shirt
      if (c.crowdRole === 'ems') assert.equal(c.model, 'rb_medic_f', `${deck.mkey}/${s}: a paramedic on ${c.model}`);
      if (['technician', 'researcher', 'surveyor'].includes(c.crowdRole)) assert.ok(c.model === 'rb_doctor_m' || ['helix slate', 'helix tech', 'labcoat', 'overall'].includes(c.variant), `${deck.mkey}/${s}: a ${c.crowdRole} as ${c.model}/${c.variant}`);
    }
  }
  assert.ok(AMBIENT_CAST.tech_1.variant === 'helix tech' && WARDROBE.rb_civ_f2.cook.garb.apron, 'M3\'s technician in a work uniform; M21\'s cook in an apron');
  // Tomas: his own body, no one else's, a boy's height
  assert.equal(NPCS.tomas.model, 'rb_tomas');
  assert.ok(isChild('rb_tomas') && NPCS.tomas.height < 1.6);
  for (const { deck, level } of LEVELS) for (const c of level.cast) if (c.id !== 'tomas' && level.npcs.some((n) => n.crew === c.id)) assert.notEqual(c.model, 'rb_tomas', `${deck.mkey}: ${c.id} wears Tomas's body`);
  for (const a of Object.values(AMBIENT_CAST)) assert.notEqual(a.model, 'rb_tomas');
  // Mission 1's "crowded security checkpoint": people queue between the tapes, Officer Pryce at the booth
  const m1 = LEVELS.find((l) => l.deck.mkey === 'm01').level;
  const queue = m1.npcs.filter((n) => n.crowd && !n.path && n.pos[0] > -1.2 && n.pos[0] < 4.2 && n.pos[2] > -106 && n.pos[2] < -94);
  assert.ok(queue.length >= 6, `M1: ${queue.length} people queue at the checkpoint`);
  assert.ok(m1.npcs.length > 24 && m1.npcs.length <= 30, `M1: ${m1.npcs.length} people in the place`);
  // the casual crowds of today: each mission with a palette dresses them in it, and no two missions share one
  const pals = Object.values(PALETTE.present);
  assert.equal(new Set(pals).size, pals.length, 'a palette per mission');
  for (const [mkey, pal] of Object.entries(PALETTE.present)) {
    assert.ok(PRESENT_PALETTES[pal]?.length >= 6, pal);
    const level = LEVELS.find((l) => l.deck.mkey === mkey)?.level;
    const casual = level.npcs.filter((n) => n.crowd).map((n) => level.cast.find((c) => c.id === n.crew)).filter((c) => c.era === 'present' && PALETTE_ROLES.includes(c.crowdRole));
    assert.ok(casual.length && casual.every((c) => c.variant.startsWith(pal)), `${mkey}: its casual crowd in ${pal}: ${casual.map((c) => c.variant)}`);
  }
  const anc = Object.values(PALETTE.ancient);
  assert.equal(new Set(anc).size, anc.length, 'a settlement palette per mission');
});

// (castfix) a converted model's materials, and its hair cards' texels by colour (the PNG decoded: one palette index a
// texel, its rows unfiltered)
const glbOf = (key) => {
  const b = fs.readFileSync(`game/assets/characters/${MODEL_OF(key).file}`);
  const n = b.readUInt32LE(12);
  return { b, n, j: JSON.parse(b.subarray(20, 20 + n).toString('utf8')) };
};
const matsOf = (key) => glbOf(key).j.materials.map((m) => m.name);
function hairTexels(key) {
  const { b, n, j } = glbOf(key);
  const mat = j.materials.find((m) => m.name === 'hair');
  const bv = j.bufferViews[j.images[j.textures[mat.pbrMetallicRoughness.baseColorTexture.index].source].bufferView];
  const at = 20 + n + 8 + (bv.byteOffset || 0);
  const png = b.subarray(at, at + bv.byteLength);
  let p = 8, ihdr = null, plte = null, trns = null;
  const idat = [];
  while (p < png.length) {
    const len = png.readUInt32BE(p), type = png.toString('latin1', p + 4, p + 8), data = png.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') ihdr = data; else if (type === 'PLTE') plte = data; else if (type === 'tRNS') trns = data; else if (type === 'IDAT') idat.push(data);
    p += 12 + len;
  }
  const w = ihdr.readUInt32BE(0), h = ihdr.readUInt32BE(4);
  assert.ok(ihdr[8] === 8 && ihdr[9] === 3 && plte && trns, `${key}: hair cards in an 8-bit palette with alpha`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const paeth = (a, b2, c) => { const q = a + b2 - c, pa = Math.abs(q - a), pb = Math.abs(q - b2), pc = Math.abs(q - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b2 : c; };
  const count = new Array(256).fill(0);
  let prev = new Uint8Array(w);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (w + 1)], line = raw.subarray(y * (w + 1) + 1, (y + 1) * (w + 1)), cur = new Uint8Array(w);
    for (let x = 0; x < w; x++) {
      const a = x ? cur[x - 1] : 0, up = prev[x], c = x ? prev[x - 1] : 0;
      cur[x] = (line[x] + (f === 1 ? a : f === 2 ? up : f === 3 ? (a + up) >> 1 : f === 4 ? paeth(a, up, c) : 0)) & 255;
      count[cur[x]]++;
    }
    prev = cur;
  }
  // the opaque texels' share by colour: { silver, all }
  let silver = 0, all = 0;
  for (let i = 0; i < count.length; i++) {
    if (!count[i] || (i < trns.length ? trns[i] : 255) < 128) continue;
    const hsl = {};
    new THREE.Color(plte[i * 3] / 255, plte[i * 3 + 1] / 255, plte[i * 3 + 2] / 255).getHSL(hsl);
    all += count[i];
    if (hsl.s < 0.16 && hsl.l > 0.42) silver += count[i];
  }
  return { silver, all };
}

// (castfix) the player's "every NPC must look like who they are": no one of the settlement wears a cap or a head cloth
// (Niko's woven prayer cap was dyed as hair and read as a cap); Tomas is a boy on a child's body; the people who come
// back (the glazier, the ticket keeper, the named) are dressed as no crowd is; the Elder is old in her face and hair
test('castfix: no cap or head cloth in the settlement, Tomas on a child\'s body, the returning dressed as no crowd, the Elder old', () => {
  const conv = fs.readFileSync('tools/rocketbox-to-glb.mjs', 'utf8');
  const srcOf = (m) => new RegExp(`\\b${m}: \\{ src: '([^']+)'`).exec(conv)?.[1];
  // the avatars whose cap, hat or head cloth is modelled into the head (a taqiyah, a baseball cap, a ghutra, a hijab, a
  // khimar, a burqa, a girl's head scarf, a beanie, a chef's toque, an officer's cap): no person of the settlement is one
  const HEAD_COVERED = ['Adults/Male_Adult_15', 'Adults/Male_Adult_17', 'Adults/Male_Adult_19', 'Adults/Male_Adult_21', 'Adults/Female_Adult_06', 'Adults/Female_Adult_10',
    'Adults/Female_Adult_16', 'Children/Female_Child_02', 'Professions/Delivery_Male_01', 'Professions/Chef_Female_01', 'Professions/Pilot_Female_02', 'Professions/Security_Female_01'];
  const HEAD_PROPS = ['beret', 'visor', 'helmet', 'raincoatHood', 'raincoatChildHood', 'shadowHood'];
  const settled = new Set();
  for (const { deck, s, level } of LEVELS) {
    for (const n of level.npcs) {
      const c = level.cast.find((x) => x.id === n.crew);
      if (!c?.model) continue;
      if (!(c.era === 'ancient' || ['niko', 'tala', 'elder'].includes(c.met || n.crew) || /^m[457]_/.test(n.crew))) continue;
      const v = WARDROBE[c.model]?.[n.variant || c.variant] || {};
      const where = `${deck.mkey}/${s}: ${n.id} (${c.model}/${n.variant || c.variant})`;
      assert.ok(!HEAD_COVERED.includes(srcOf(c.model)), `${where} is ${srcOf(c.model)}, whose head is covered`);
      assert.ok(!matsOf(c.model).some((m) => /hat|helmet|cap|keffiyeh|scarf/i.test(m)), `${where} wears a ${matsOf(c.model)}`);
      assert.ok(![...(v.props || []), ...(c.props || [])].some((x) => HEAD_PROPS.includes(x)), `${where} carries something on the head`);
      settled.add(c.model);
    }
  }
  assert.ok(settled.has('rb_niko') && settled.has('rb_elder') && settled.has('rb_tala') && settled.size >= 9, [...settled].join());
  // Niko: real hair (its own cards), not a cap dyed dark; his look in every mission and the cases is the one man's
  assert.equal(srcOf('rb_niko'), 'Adults/Male_Adult_09');
  assert.ok(matsOf('rb_niko').includes('hair') && !WARDROBE.rb_niko.niko.head, 'Niko\'s hair is hair');
  // Tomas, thirteen: a child's body (Rocketbox's four children are the only ones), a slight boy's height, in a look no
  // crowd wears anywhere and on a body no crowd child has; his echo wears a coat, which neither young Kai nor any crowd
  // child of 2196 does
  assert.ok(srcOf('rb_tomas').startsWith('Children/') && isChild('rb_tomas'), srcOf('rb_tomas'));
  assert.ok(NPCS.tomas.height >= 1.45 && NPCS.tomas.height <= 1.6 && LV_MODELS.rb_tomas.height === NPCS.tomas.height, `Tomas at ${NPCS.tomas.height} m`);
  assert.ok(WARDROBE.rb_tomas.school.garb?.cloak && !WARDROBE.rb_child_m.kai12.garb, 'Tomas\'s coat');
  // the people who come back: whoever is met in two missions or more (a replay counting as its mission) wears looks
  // (model and clothes) no crowd anywhere in the campaign or the cases wears (the Place Outside Time's echoes are the
  // people themselves), and someone placed by hand comes back the same
  const crowdLooks = new Map(), people = new Map();
  for (const { deck, level } of LEVELS) {
    for (const n of level.npcs) {
      const c = level.cast.find((x) => x.id === n.crew);
      if (!c?.model) continue;
      const look = `${c.model}/${n.variant || c.variant || 'default'}`;
      if (n.crowd && !c.met) { if (!crowdLooks.has(look)) crowdLooks.set(look, new Set()); crowdLooks.get(look).add(deck.mkey); continue; }
      const id = c.met || n.crew;
      if (!people.has(id)) people.set(id, { looks: new Set(), missions: new Set(), ambient: !!c.ambient });
      people.get(id).looks.add(look);
      people.get(id).missions.add(deck.origin || deck.mkey);
    }
  }
  let back = 0;
  for (const [id, p] of people) {
    if (p.missions.size < 2) continue;
    back++;
    for (const look of p.looks) assert.ok(!crowdLooks.has(look), `${id} (back in ${[...p.missions]}) as ${look}, which a crowd wears in ${[...(crowdLooks.get(look) || [])]}`);
    if (p.ambient) assert.equal(p.looks.size, 1, `${id} comes back in one look: ${[...p.looks]}`);
  }
  assert.ok(back >= 15, `${back} people come back`);
  // the glazier (M12, M21, M23): her own face, worn by no one else, the technicians' paramedic body no longer
  const glazier = people.get('m12_glazier');
  assert.deepEqual([...glazier.missions].sort(), ['m12', 'm21', 'm23']);
  assert.deepEqual([...glazier.looks], ['rb_glazier/glazier']);
  assert.ok(![...crowdLooks.keys()].some((l) => l.startsWith('rb_glazier/')) && Object.entries(AMBIENT_CAST).every(([id, a]) => a.model !== 'rb_glazier' || id === 'm12_glazier'), 'the glazier\'s body is hers');
  assert.ok(allNamed().every((n2) => n2.model !== 'rb_glazier') && !Object.values(ERAS).some((era) => Object.values(era).some((t) => t.some(([m]) => m === 'rb_glazier'))));
  assert.ok(WARDROBE.rb_glazier.glazier.garb.apron && WARDROBE.rb_glazier.glazier.props.includes('glassLifter'), 'a glazier\'s apron and lifter');
  // the Elder: her face aged and her hair silvered in her model's maps, kept silver by her wardrobe; a stoop, a staff
  // (in her echoes too) and a slow walk
  assert.ok(/\brb_elder: \{ src: 'Adults\/Female_Adult_09', px: 1024, edit: 'age' \}/.test(conv), 'the Elder\'s maps are aged');
  const hair = WARDROBE.rb_elder.elder.hair;
  assert.ok(hair?.length && hair.every((r) => r.sset <= 0.06 && r.skin === false), 'her wardrobe greys her hair');
  const { silver, all } = hairTexels('rb_elder');
  assert.ok(all > 1000 && silver / all > 0.85, `the Elder's hair cards: ${((100 * silver) / all).toFixed(1)}% silver`);
  const young = hairTexels('rb_tala');
  assert.ok(young.silver / young.all < 0.2, `Tala's hair is not silver (${((100 * young.silver) / young.all).toFixed(1)}%)`);
  const elder = WARDROBE.rb_elder.elder;
  assert.ok(elder.stoop > 0.1 && elder.props.includes('staff') && elder.holoProps && NPCS.elder.walk < 1, 'a stoop, a staff and a slow walk');
});

// (castfix round 2) what the follow-up check found: Tomas's echo had young Kai's face and a bald head (one body,
// Children/Male_Child_01, whose hair is only painted, and an echo shows none of its maps); every echo showed the inside of
// its mouth and the backs of its eyes; the Elder's aged head map had silvered a corner of her breastbone (a white patch in
// her robe's neck) and her paler skin left her cardigan's dye in squares; Niko as an old man was a young face, grey-haired
test('castfix round 2: the two boys of one body are two boys as echoes, echoes show only their nearest surface, the Elder clean, Niko old', () => {
  const conv = fs.readFileSync('tools/rocketbox-to-glb.mjs', 'utf8');
  const tex = fs.readFileSync('tools/rocketbox-textures.py', 'utf8');
  const srcOf = (m) => new RegExp(`\\b${m}: \\{ src: '([^']+)'`).exec(conv)?.[1];
  // Tomas and young Kai: the one body, its hair painted (no cards); each boy's echo wears a head of hair of his own
  // (garments.js hairMass), and not the same: Tomas a mop over his brow and his ears, Kai a short crop, his brow clear
  assert.equal(srcOf('rb_tomas'), srcOf('rb_child_m'));
  assert.ok(!matsOf('rb_tomas').includes('hair') && !matsOf('rb_child_m').includes('hair'), 'the boy\'s hair is only painted');
  for (const [m, vs] of [['rb_tomas', WARDROBE.rb_tomas], ['rb_child_m', WARDROBE.rb_child_m]]) {
    for (const [name, v] of Object.entries(vs)) assert.ok(v.hairMass && !v.hairMass.holoOnly === (m === 'rb_tomas'), `${m}/${name}: hair of its own on an echo`);
  }
  const tomas = { ...MASS_DEFAULT, ...WARDROBE.rb_tomas.school.hairMass }, kai = { ...MASS_DEFAULT, ...WARDROBE.rb_child_m.kai12.hairMass };
  assert.ok(tomas.fringe - kai.fringe >= 0.3 && tomas.side - kai.side >= 0.25 && tomas.nape > kai.nape, 'a mop to the brow and over the ears; a crop');
  assert.ok(tomas.lift >= 2 * kai.lift && tomas.locks >= 2 * kai.locks, 'the mop thicker, its locks longer');
  assert.ok(NPCS.tomas.hologram && Math.abs(NPCS.tomas.height - NPCS.kai12.height) >= 0.08, 'Tomas the taller');
  // an echo is drawn as its nearest surface: each of its skinned parts first into the depth buffer alone, after everything
  // solid (renderOrder 1, colour off), then in its light (2); cut-out hair and its props are drawn in its light only
  const bone = new THREE.Bone();
  const skinned = (mat) => {
    const g = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const n = g.attributes.position.count;
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(n * 4), 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(new Float32Array(n * 4).map((_, i) => (i % 4 ? 0 : 1)), 4));
    const m = new THREE.SkinnedMesh(g, mat);
    m.bind(new THREE.Skeleton([bone]));
    return m;
  };
  const light = () => new THREE.MeshStandardMaterial({ color: 0x8fe0ff, transparent: true, opacity: 0.55, depthWrite: false });
  const body = skinned(light()), head = skinned(light()), cards = skinned(Object.assign(light(), { alphaTest: 0.35 }));
  const prop = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.6, 0.02), light());
  const actor = new THREE.Group(), root = new THREE.Group();
  actor.add(root);
  root.add(bone, body, head, cards, prop);
  assert.equal(holoDepth(actor), 2, 'the body and the head have depth passes; the hair cards do not');
  const depth = [];
  actor.traverse((o) => { if (o.name === 'holodepth') depth.push(o); });
  assert.equal(depth.length, 2);
  for (const d of depth) {
    assert.ok(d.isSkinnedMesh && [body, head].some((o) => o.geometry === d.geometry && o.skeleton === d.skeleton), 'the part\'s own geometry and skeleton');
    assert.ok(d.material.colorWrite === false && d.material.depthWrite && d.material.transparent && d.renderOrder === 1 && !d.castShadow, 'depth only, after the solid scene');
  }
  for (const o of [body, head, cards, prop]) assert.equal(o.renderOrder, 2, 'the light after the depth');
  // (seen once, not through its own layers, the surface is denser; a material is thickened once, however many share it)
  assert.ok(Math.abs(body.material.opacity - 0.72) < 1e-6 && cards.material.opacity === 0.55, `the echo's surface at ${body.material.opacity}`);
  holoDepth(new THREE.Group().add(new THREE.Group().add(Object.assign(skinned(body.material), {}))));
  assert.ok(Math.abs(body.material.opacity - 0.72) < 1e-6, 'thickened once');
  assert.ok(/if \(holo\) holoDepth\(actor\)/.test(fs.readFileSync('game/js/editions/lastversion/wardrobe.js', 'utf8')), 'every echo is dressed with it');
  // the Elder: the 'age' edit's bun silvers only its own islands of the head map (found off the face's piece), not the
  // neck's and chest's piece under its box; her cardigan and shirt are dyed as cloth everywhere but her hands' corners
  assert.ok(/'bun': \[\(1080, 1470, 2048, 2048\)\], 'seed': \(1025, 700\)/.test(tex) && /off_face = 1 - _main_piece/.test(tex), 'the Elder\'s bun is its own islands');
  const eb = WARDROBE.rb_elder.elder.body;
  assert.ok(eb.some((r) => r.skin === false && r.band?.[0] <= 0.25 && r.band?.[2] >= 0.75 && r.band?.[1] === 0 && r.band?.[3] === 1), 'her cardigan dyed as cloth');
  assert.ok(eb.filter((r) => r.skin !== false).every((r) => r.band && (r.band[2] <= 0.25 || r.band[0] >= 0.75) && r.band[3] <= 0.3), 'skin kept only at her hands');
  // Niko as an old man (Mission 7's cold open): Niko's own face (the same avatar), aged in its maps (salt-and-pepper hair,
  // lines, a short grey beard), his hair cards grey, the young Niko's black
  assert.equal(srcOf('rb_niko_old'), srcOf('rb_niko'));
  assert.ok(/\brb_niko_old: \{ src: 'Adults\/Male_Adult_09', px: 1024, edit: 'age_m' \}/.test(conv), 'old Niko\'s maps are aged');
  assert.ok(/'age_m': \{'m017_head_color': \(age_head, M017\)/.test(tex) && /'beard': \[/.test(tex), 'lines and a beard on his face');
  assert.equal(AMBIENT_CAST.m7_oldniko.model, 'rb_niko_old');
  assert.ok(!WARDROBE.rb_niko.older && WARDROBE.rb_niko_old.older.props.includes('staff'));
  const old = hairTexels('rb_niko_old'), young = hairTexels('rb_niko');
  assert.ok(old.silver / old.all > 0.6, `old Niko's hair cards: ${((100 * old.silver) / old.all).toFixed(1)}% grey`);
  assert.ok(young.silver / young.all < 0.1, `young Niko's hair is black (${((100 * young.silver) / young.all).toFixed(1)}% grey)`);
});

// (castfix round 3) what the follow-up check found: the glazier's bib apron was a stiff board with no neck strap, standing
// out at the throat and off the chest below the bust; the Elder's cloak stood off her shoulders and back like a shell, and
// did not follow her stoop (clothes were cut round the bind pose, the arms out at 43 degrees, and worn with them down); a
// lost and restored WebGL context left every dyed map black (Niko's arms, the glazier's head); the glazier, chosen as
// Mission 21's ally, stood at the glider deck and the arena's gap at once
// a body of rings for garments.js, each ring wholly on its bone: its bind pose has the arms out at 43 degrees below the
// shoulders, as the converted models' has, and it stands with them down at 71.5, as they do (a bust 5 cm out at the chest)
function ringBody() {
  const P = { Bip01: [0, 0.95, 0], Bip01_Pelvis: [0, 0.95, 0], Bip01_Spine: [0, 1.0, 0], Bip01_Spine1: [0, 1.1, 0], Bip01_Spine2: [0, 1.24, 0], Bip01_Neck: [0, 1.45, -0.01], Bip01_Head: [0, 1.54, 0] };
  const up = { Bip01_Pelvis: 'Bip01', Bip01_Spine: 'Bip01_Pelvis', Bip01_Spine1: 'Bip01_Spine', Bip01_Spine2: 'Bip01_Spine1', Bip01_Neck: 'Bip01_Spine2', Bip01_Head: 'Bip01_Neck' };
  const dir = [Math.cos((43 * Math.PI) / 180), -Math.sin((43 * Math.PI) / 180)];
  for (const [s, sx] of [['L', 1], ['R', -1]]) {
    Object.assign(P, { [`Bip01_${s}_Clavicle`]: [0.03 * sx, 1.41, 0], [`Bip01_${s}_UpperArm`]: [0.18 * sx, 1.38, 0], [`Bip01_${s}_Forearm`]: [(0.18 + 0.28 * dir[0]) * sx, 1.38 + 0.28 * dir[1], 0],
      [`Bip01_${s}_Thigh`]: [0.095 * sx, 0.92, 0], [`Bip01_${s}_Calf`]: [0.095 * sx, 0.5, 0] });
    Object.assign(up, { [`Bip01_${s}_Clavicle`]: 'Bip01_Spine2', [`Bip01_${s}_UpperArm`]: `Bip01_${s}_Clavicle`, [`Bip01_${s}_Forearm`]: `Bip01_${s}_UpperArm`, [`Bip01_${s}_Thigh`]: 'Bip01_Pelvis', [`Bip01_${s}_Calf`]: `Bip01_${s}_Thigh` });
  }
  const names = Object.keys(P), bones = {};
  for (const n of names) { bones[n] = new THREE.Bone(); bones[n].name = n; }
  for (const n of names) {
    const pw = up[n] ? P[up[n]] : [0, 0, 0];
    bones[n].position.set(P[n][0] - pw[0], P[n][1] - pw[1], P[n][2] - pw[2]);
    if (up[n]) bones[up[n]].add(bones[n]);
  }
  const pos = [], skin = [];
  const ring = (x, y, z, w, f, b, bone, n = 40) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      pos.push(x + Math.sin(a) * w, y, z + Math.cos(a) * (Math.cos(a) >= 0 ? f : b));
      skin.push(names.indexOf(typeof bone === 'function' ? bone(Math.sin(a)) : bone));
    }
  };
  for (let y = 0.04; y <= 0.9; y += 0.01) for (const sx of [1, -1]) { const r = y < 0.5 ? 0.055 : 0.075; ring(0.095 * sx, y, 0, r, r, r, `Bip01_${sx > 0 ? 'L' : 'R'}_${y < 0.5 ? 'Calf' : 'Thigh'}`); }
  for (let y = 0.88; y < 1.0; y += 0.01) ring(0, y, 0, 0.17, 0.11, 0.13, y < 0.95 ? 'Bip01_Pelvis' : 'Bip01_Spine');
  for (let y = 1.0; y < 1.18; y += 0.01) ring(0, y, 0, 0.135 + 0.03 * Math.abs(y - 1.07), 0.1, 0.1, 'Bip01_Spine1');
  for (let y = 1.18; y < 1.37; y += 0.01) ring(0, y, 0, 0.15 + 0.1 * (y - 1.18), 0.1 + 0.05 * Math.max(0, 1 - Math.abs(y - 1.26) / 0.07), 0.1, 'Bip01_Spine2');
  for (let y = 1.37; y < 1.435; y += 0.01) ring(0, y, -0.005, 0.19 - (y - 1.37), 0.08, 0.085, (s) => (s >= 0 ? 'Bip01_L_Clavicle' : 'Bip01_R_Clavicle'));
  for (let y = 1.435; y < 1.55; y += 0.01) ring(0, y, -0.01, 0.052, 0.05, 0.05, 'Bip01_Neck');
  for (let e = 0.15; e < Math.PI; e += 0.15) ring(0, 1.64 - 0.1 * Math.cos(e), 0.005, 0.095 * Math.sin(e), 0.105 * Math.sin(e), 0.095 * Math.sin(e), 'Bip01_Head', 24);
  for (const [s, sx] of [['L', 1], ['R', -1]]) {
    for (let t = 0.02; t <= 0.53; t += 0.012) {
      const cx = (0.18 + t * dir[0]) * sx, cy = 1.38 + t * dir[1], r = t < 0.28 ? 0.045 : 0.037;
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        pos.push(cx - r * Math.cos(a) * dir[1] * sx, cy + r * Math.cos(a) * dir[0], r * Math.sin(a));
        skin.push(names.indexOf(`Bip01_${s}_${t < 0.28 ? 'UpperArm' : 'Forearm'}`));
      }
    }
  }
  const n = pos.length / 3;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(Array.from({ length: n * 4 }, (_, i) => (i % 4 ? 0 : skin[i >> 2])), 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(Array.from({ length: n * 4 }, (_, i) => (i % 4 ? 0 : 1)), 4));
  const mesh = new THREE.SkinnedMesh(g, new THREE.MeshBasicMaterial());
  const root = new THREE.Group();
  root.add(bones.Bip01, mesh);
  root.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(names.map((k) => bones[k])), new THREE.Matrix4());
  const down = ((71.5 - 43) * Math.PI) / 180;
  bones.Bip01_L_UpperArm.rotation.z = -down;
  bones.Bip01_R_UpperArm.rotation.z = down;
  root.updateMatrixWorld(true);
  return { root, mesh, P };
}
// an outfit cut round the standing body (as garments.js cuts every one but a fitted coat) and worn by it: each of its
// points as posed, its piece, and its distance from the posed body's nearest point
function wornOn(garb) {
  const B = ringBody();
  const { g, paint } = GARMENT_DBG.build(GARMENT_DBG.restFrom(B.mesh, B.root), garb);
  const v = new THREE.Vector3(), body = [];
  const bp = B.mesh.geometry.attributes.position;
  for (let i = 0; i < bp.count; i++) { B.mesh.applyBoneTransform(i, v.fromBufferAttribute(bp, i)); body.push(v.x, v.y, v.z); }
  const m = new THREE.SkinnedMesh(g, new THREE.MeshBasicMaterial());
  B.root.add(m);
  m.bind(B.mesh.skeleton, B.mesh.bindMatrix);
  B.root.updateMatrixWorld(true);
  const pts = [];
  for (let i = 0; i < g.attributes.position.count; i++) {
    m.applyBoneTransform(i, v.fromBufferAttribute(g.attributes.position, i));
    let d = Infinity;
    for (let k = 0; k < body.length; k += 3) d = Math.min(d, (body[k] - v.x) ** 2 + (body[k + 1] - v.y) ** 2 + (body[k + 2] - v.z) ** 2);
    pts.push({ x: v.x, y: v.y, z: v.z, d: Math.sqrt(d), piece: PIECES[paint[i] >> 1] });
  }
  return { B, pts };
}
test('castfix round 3: clothes cut round the body as it stands, the bib on the chest and strapped, dyes that survive a lost context, one glazier', () => {
  // the way back from the standing body to the bind pose is the skinning's inverse, under any weights
  const B = ringBody();
  const info = GARMENT_DBG.restFrom(B.mesh, B.root);
  const sk = B.mesh.skeleton, bi = (n) => sk.bones.findIndex((b) => b.name === n);
  const v = new THREE.Vector3();
  for (const [ji, wi] of [[[bi('Bip01_L_UpperArm'), bi('Bip01_Spine2'), 0, 0], [0.6, 0.4, 0, 0]], [[bi('Bip01_R_Clavicle'), bi('Bip01_R_UpperArm'), bi('Bip01_Neck'), 0], [0.3, 0.5, 0.2, 0]], [[bi('Bip01_Pelvis'), 0, 0, 0], [1, 0, 0, 0]]]) {
    const p = new THREE.Vector3(0.21, 1.33, 0.04);
    const back = info.unskin(p.clone(), ji, wi);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([back.x, back.y, back.z], 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(ji, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(wi, 4));
    const m = new THREE.SkinnedMesh(g, new THREE.MeshBasicMaterial());
    B.root.add(m);
    m.bind(sk, B.mesh.bindMatrix);
    B.root.updateMatrixWorld(true);
    assert.ok(m.applyBoneTransform(0, v.fromBufferAttribute(g.attributes.position, 0)).distanceTo(p) < 1e-4, 'a point cut round the standing body comes back to it worn');
  }
  const yArm = 1.38, neckZ = -0.01, yWaist = 0.95 + 0.29 * 0.32;
  // the glazier's bib: its top edge on the chest at the shoulders' height (not out in front of the throat), lying on the
  // chest and spanning only its hollows down to the waist, held by a strap that goes round the back of the neck, close
  const glazier = wornOn(WARDROBE.rb_glazier.glazier.garb).pts.filter((q) => q.piece === 'apron');
  const top = glazier.filter((q) => Math.abs(q.x) < 0.03 && q.z > 0 && q.y > yWaist + 0.05).sort((a, b) => b.y - a.y)[0];
  assert.ok(top.y <= yArm + 0.01 && top.d <= 0.025, `the bib's top edge at ${top.y.toFixed(3)} m, ${(100 * top.d).toFixed(1)} cm off the chest`);
  const bib = glazier.filter((q) => q.z > 0 && q.y > yWaist + 0.05 && q.y < yArm - 0.04);
  assert.ok(bib.length > 50 && bib.every((q) => q.d <= 0.045), `the bib at most ${(100 * Math.max(...bib.map((q) => q.d))).toFixed(1)} cm off the body`);
  const strap = glazier.filter((q) => q.z < neckZ - 0.03 && q.y > yArm);
  assert.ok(strap.length >= 6 && strap.every((q) => q.d <= 0.025), `a neck strap behind the neck (${strap.length} points), at most ${(100 * Math.max(0, ...strap.map((q) => q.d))).toFixed(1)} cm off it`);
  assert.ok(/strap\(out, 'apron'/.test(fs.readFileSync('game/js/editions/lastversion/garments.js', 'utf8')) && WARDROBE.rb_glazier.glazier.garb.apron.bib >= 0, 'the bib below the shoulders, strapped');
  // a cloak's cape and a mantle: gathered round the neck and lying on the shoulders, wherever the arms hang
  for (const [who, garb, piece] of [['the Elder', WARDROBE.rb_elder.elder.garb, 'cloak'], ['Niko', WARDROBE.rb_niko.niko.garb, 'mantle'], ['Tala', WARDROBE.rb_tala.tala.garb, 'mantle']]) {
    const pts = wornOn(garb).pts.filter((q) => q.piece === piece);
    const high = pts.filter((q) => q.y > yArm + 0.02);
    assert.ok(high.length > 20 && high.every((q) => q.d <= 0.035), `${who}'s ${piece} on the shoulders: at most ${(100 * Math.max(...high.map((q) => q.d))).toFixed(1)} cm off them`);
    const sides = pts.filter((q) => q.y > yArm - 0.12 && q.y < yArm - 0.02 && Math.abs(q.x) > 0.2);
    assert.ok(sides.length && sides.every((q) => q.d <= 0.08), `${who}'s ${piece} over the tops of the arms as they hang: at most ${(100 * Math.max(...sides.map((q) => q.d))).toFixed(1)} cm off them`);
  }
  // a dyed map is drawn on the GPU alone; on the context's return every one in use is drawn again
  const el = new EventTarget(), draws = [];
  let target = null;
  const renderer = { domElement: el, getRenderTarget: () => target, setRenderTarget: (t) => { target = t; }, render: () => draws.push(target) };
  const src = new THREE.Texture({ width: 64, height: 64 });
  const dyed = recoloured(renderer, src, 'test|r3|body', [dyeRule('madder')], [0.8, 0.6, 0.5], 64);
  assert.ok(dyed.isRenderTargetTexture && draws.length === 1 && draws[0].texture === dyed && target === null, 'dyed once');
  el.dispatchEvent(new Event('webglcontextrestored'));
  assert.ok(draws.length >= 2 && draws.at(-1).texture === dyed && target === null, 'dyed again when the context comes back');
  dyed.dispose();
  const n = draws.length;
  el.dispatchEvent(new Event('webglcontextrestored'));
  assert.ok(!draws.slice(n).some((t) => t.texture === dyed), 'not once its wearers have gone');
  assert.equal(redye(null), 0);
  // Mission 21: an ally holding the arena's gap is no longer where Kai met them (the glazier at the glider deck, Rook in
  // the director's office)
  const m21 = LEVELS.filter(({ deck }) => deck.mkey === 'm21');
  assert.ok(m21.length);
  for (const { level } of m21) {
    for (const holder of level.npcs.filter((x) => /ally == "(\w+)"/.test(x.when || '') && !/!\(ally ==/.test(x.when))) {
      const who = /ally == "(\w+)"/.exec(holder.when)[1];
      for (const other of level.npcs.filter((x) => x !== holder && x.crew === holder.crew)) {
        assert.ok((other.when || '').includes(`!(ally == "${who}")`), `${other.id} (${other.when}) stands somewhere else while ${holder.id} holds the gap`);
      }
    }
    assert.ok(level.npcs.some((x) => x.id === 'm21_glazier') && level.npcs.some((x) => x.id === 'm21_glazier_gap'));
  }
});

// (castfin round 1) what the round-3 check found: cut round the body as it stands, a child's tunic came apart at the knees
// (the ellipse through the legs' four widest points passed inside them between, and the grey shorts showed through in
// shards standing still), and every tunic let a stride's knee through (jeans, shorts); the settlement walked in Rocketbox's
// trainers; the Helix technicians wore PARAMEDIC across the back; the glazier's jacket was open to the breastbone; in
// Mission 21 a persuaded Rook chosen to hold the gap left his office with nobody in it and nothing to say so.
// A converted model's body as glTF holds it (its nodes, its skeleton, the body's own primitive), without textures: what
// garments.js cuts round in the game, without a browser
function glbBody(file) {
  const b = fs.readFileSync(file);
  const jl = b.readUInt32LE(12), J = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
  const bin = b.subarray(28 + jl);
  const acc = (i) => {
    const a = J.accessors[i], bv = J.bufferViews[a.bufferView];
    const T = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array }[a.componentType];
    const n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[a.type];
    const off = bin.byteOffset + (bv.byteOffset || 0) + (a.byteOffset || 0);
    const arr = new T(b.buffer.slice(off, off + a.count * n * T.BYTES_PER_ELEMENT));
    return a.normalized ? Float32Array.from(arr, (x) => x / (T === Uint8Array ? 255 : 65535)) : arr;
  };
  const skin = J.skins[0];
  const nodes = J.nodes.map((nd, i) => {
    const o = skin.joints.includes(i) ? new THREE.Bone() : new THREE.Group();
    o.name = nd.name || '';
    if (nd.matrix) new THREE.Matrix4().fromArray(nd.matrix).decompose(o.position, o.quaternion, o.scale);
    if (nd.translation) o.position.fromArray(nd.translation);
    if (nd.rotation) o.quaternion.fromArray(nd.rotation);
    if (nd.scale) o.scale.fromArray(nd.scale);
    return o;
  });
  J.nodes.forEach((nd, i) => (nd.children || []).forEach((c) => nodes[i].add(nodes[c])));
  const root = new THREE.Group();
  for (const i of J.scenes[J.scene || 0].nodes) root.add(nodes[i]);
  const at = J.nodes.findIndex((nd) => nd.mesh != null);
  const prim = J.meshes[J.nodes[at].mesh].primitives.find((p) => J.materials[p.material].name === 'body');
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(acc(prim.attributes.POSITION), 3));
  g.setAttribute('skinIndex', new THREE.BufferAttribute(Uint16Array.from(acc(prim.attributes.JOINTS_0)), 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(acc(prim.attributes.WEIGHTS_0), 4));
  g.setIndex(new THREE.BufferAttribute(Uint32Array.from(acc(prim.indices)), 1));
  const mat = new THREE.MeshBasicMaterial();
  mat.name = 'body';
  const mesh = new THREE.SkinnedMesh(g, mat);
  nodes[at].add(mesh);
  root.updateMatrixWorld(true);
  const ib = acc(skin.inverseBindMatrices);
  // (bound as GLTFLoader binds it, before the scene's matrices are worked out: the bind matrix the identity, the mesh
  // node's own turn ignored, as glTF's skins do)
  mesh.bind(new THREE.Skeleton(skin.joints.map((j) => nodes[j]), skin.joints.map((_, k) => new THREE.Matrix4().fromArray(ib, k * 16))), new THREE.Matrix4());
  return { root, mesh };
}
// the bones as the game poses them (tests/fixtures/garment-poses.json, written by tests/lastversion-garments.mjs)
const POSES = JSON.parse(fs.readFileSync('tests/fixtures/garment-poses.json', 'utf8'));
function posed(B, pose) {
  for (const bn of B.mesh.skeleton.bones) {
    const p = pose[bn.name];
    if (p) { bn.quaternion.fromArray(p, 0); bn.position.fromArray(p, 4); }
  }
  B.root.updateMatrixWorld(true);
}
// a skirt (its geometry in the bind pose, skinned) worn on a posed body: the body's leg points between the skirt's top and
// 5 cm above its hem there that lie outside it (a ray from the hips' axis crossing it an odd number of times) and have it
// under them (through it, not a foot stepping out from under the hem): how many of how many, and the deepest
function legsThrough(B, g, only = null) {
  const m = new THREE.SkinnedMesh(g, new THREE.MeshBasicMaterial());
  B.mesh.parent.add(m);
  m.bind(B.mesh.skeleton, B.mesh.bindMatrix);
  B.root.updateMatrixWorld(true);
  const v = new THREE.Vector3(), gp = g.attributes.position, P = new Float32Array(gp.count * 3);
  let top = -Infinity;
  for (let i = 0; i < gp.count; i++) { m.applyBoneTransform(i, v.fromBufferAttribute(gp, i)).applyMatrix4(m.matrixWorld); P.set([v.x, v.y, v.z], i * 3); top = Math.max(top, v.y); }
  m.removeFromParent();
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(P, 3));
  sg.setIndex(g.index);
  sg.computeBoundingSphere();
  const skirt = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  skirt.updateMatrixWorld(true);
  const sk = B.mesh.skeleton, names = sk.bones.map((x) => x.name), pc = sk.bones[names.indexOf('Bip01_Pelvis')].getWorldPosition(new THREE.Vector3());
  const bin = (x, z) => ((Math.floor(((Math.atan2(x - pc.x, z - pc.z) + Math.PI) / (2 * Math.PI)) * 16) % 16) + 16) % 16;
  const hem = new Float32Array(16).fill(Infinity);
  for (let i = 0; i < gp.count; i++) { const k = bin(P[i * 3], P[i * 3 + 2]); hem[k] = Math.min(hem[k], P[i * 3 + 1]); }
  const bg = B.mesh.geometry, si = bg.attributes.skinIndex, sw = bg.attributes.skinWeight, bp = bg.attributes.position;
  const rc = new THREE.Raycaster(), o = new THREE.Vector3(), down = new THREE.Vector3(0, -1, 0);
  let n = 0, out = 0, deep = 0;
  for (let i = 0; i < bp.count; i++) {
    if (only && !only[i]) continue;
    let best = 0;
    for (let c = 1; c < 4; c++) if (sw.getComponent(i, c) > sw.getComponent(i, best)) best = c;
    if (!/^Bip01_(Pelvis|[LR]_(Thigh|Calf))$/.test(names[si.getComponent(i, best)])) continue;
    B.mesh.applyBoneTransform(i, v.fromBufferAttribute(bp, i)).applyMatrix4(B.mesh.matrixWorld);
    const k = bin(v.x, v.z);
    if (v.y > top - 0.04 || v.y < Math.max(...[hem[k], hem[(k + 1) % 16], hem[(k + 15) % 16]].filter(Number.isFinite), -1) + 0.05) continue;
    n++;
    const d = new THREE.Vector3(v.x - pc.x, 0, v.z - pc.z), L = d.length();
    rc.set(o.set(pc.x, v.y, pc.z), d.normalize());
    rc.far = L;
    const hits = rc.intersectObject(skirt, false);
    if (!(hits.length % 2)) continue;
    rc.set(o.copy(v), down);
    rc.far = 2;
    if (!rc.intersectObject(skirt, false).length) continue;
    out++;
    deep = Math.max(deep, L - hits[hits.length - 1].distance);
  }
  return { n, out, deep };
}
test('castfin round 1: tunics on real bodies, a child\'s among them: whole standing, the legs they cover undrawn, leather at the feet, no paramedic technicians', () => {
  const W = (m, v) => WARDROBE[m][v].garb;
  for (const [model, variant] of [['rb_child_m2', 'fire_girl1'], ['rb_child_m2', 'fire_boy2'], ['rb_child_m2', 'girl_m4'], ['rb_vill_f', 'fire1'], ['rb_vill_m', 'fire1'], ['rb_vill_m', 'potter']]) {
    const pose = POSES.poses[model];
    assert.ok(pose?.stand && Object.keys(pose).length >= 4, `tests/fixtures/garment-poses.json: ${model}`);
    const B = glbBody(`game/assets/characters/${model}.glb`);
    posed(B, pose.stand);
    // cut round the body as the game stands it (restInfo's own way back to the bind pose)
    const info = GARMENT_DBG.restFrom(B.mesh, B.root);
    const base = GARMENT_DBG.build(info, { skirt: W(model, variant).skirt });
    const who = `${model}/${variant}`;
    // standing: every leg point inside the skirt, whatever the body still draws (the cut itself)
    const stand = legsThrough(B, base.g);
    assert.ok(stand.n > 30 && stand.out === 0, `${who} standing: ${stand.out} of ${stand.n} leg points through the skirt (${(100 * stand.deep).toFixed(1)} cm)`);
    // the legs it covers are left out of the body, its buffers its own model's; the feet and ankles are kept
    const bare = GARMENT_DBG.covered(base.cover, B.mesh.geometry);
    assert.ok(bare && bare.attributes.position === B.mesh.geometry.attributes.position && bare.userData.covered > 100, `${who}: ${bare?.userData.covered} triangles covered`);
    const drawn = new Uint8Array(B.mesh.geometry.attributes.position.count);
    for (let k = 0; k < bare.index.count; k++) drawn[bare.index.getX(k)] = 1;
    const ix = B.mesh.geometry.index, q = info.q, low = (i) => q[i * 3 + 1] < base.cover.lo - 1e-6;
    for (let k = 0; k < ix.count; k += 3) if (low(ix.getX(k)) && low(ix.getX(k + 1)) && low(ix.getX(k + 2))) assert.ok(drawn[ix.getX(k)] && drawn[ix.getX(k + 1)] && drawn[ix.getX(k + 2)], `${who}: a triangle under the hem is drawn`);
    // a stride (three phases of the game's walk): what the body draws stays inside, but for a little at the hem
    for (const [k, p] of Object.entries(pose).filter(([k]) => k.startsWith('stride'))) {
      posed(B, p);
      const w = legsThrough(B, base.g, drawn);
      assert.ok(w.out <= Math.max(2, 0.15 * w.n) && w.deep <= 0.16, `${who} ${k}: ${w.out} of ${w.n} drawn leg points through the skirt (${(100 * w.deep).toFixed(1)} cm)`);
    }
  }
  // dressed by clothe (here, with no actor's own pose to stand in, round the bind pose): the body drawn without its legs
  {
    const B = glbBody('game/assets/characters/rb_child_m2.glb');
    const actor = new THREE.Group();
    actor.add(B.root);
    actor.userData.model = B.root;
    // (the woven map is drawn on a canvas: a stand-in for one, for this call alone)
    const had = globalThis.document;
    globalThis.document ??= { createElement: () => ({ getContext: () => ({ createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {} }) }) };
    let m = null;
    const own = B.mesh.geometry;
    try { m = clothe(actor, 'rb_child_m2', W('rb_child_m2', 'fire_girl1')); } finally { if (!had) delete globalThis.document; }
    assert.ok(m?.isSkinnedMesh && m.skeleton === B.mesh.skeleton && actor.userData.garment === m, 'clothed');
    assert.ok(B.mesh.geometry !== own && B.mesh.geometry.userData.covered > 100 && B.mesh.geometry.attributes.position === own.attributes.position, 'the body drawn without the legs the skirt covers');
  }
  // the settlement's feet: everyone in a tunic's skirt (and no one else) dyed dark leather over their feet, after all else
  let n = 0;
  for (const [model, vs] of Object.entries(WARDROBE)) for (const [name, v] of Object.entries(vs)) {
    const has = !!v.body?.includes(LEATHER);
    assert.equal(has, !!v.garb?.skirt, `${model}/${name}: leather at the feet ${has}`);
    if (has) { assert.equal(v.body.at(-1), LEATHER, `${model}/${name}: the leather last`); n++; }
  }
  assert.ok(n > 100 && LEATHER.feet && LEATHER.skin === false && LEATHER.lrange[1] <= 0.25 && packRules([LEATHER])[0].win[2] === 1, `${n} variants in leather`);
  assert.ok(/feetOf\(model, actor\)/.test(fs.readFileSync('game/js/editions/lastversion/wardrobe.js', 'utf8')), 'the dresser hands the feet mask to the recolour');
  // the technicians: the paramedic's back patch (and the badges) slate, flat; the paramedics keep theirs
  const tech = WARDROBE.rb_medic_f['helix tech'].body;
  const patch = tech.find((r) => r.band && r.band[0] <= 0.4 && r.band[2] >= 0.594 && r.band[1] <= 0.285 && r.band[3] >= 0.333);
  assert.ok(patch && patch.lset != null && patch.skin === false && patch.lmin < 0, 'PARAMEDIC across the back dyed out, its black letters too');
  assert.equal(tech.filter((r) => r.lset != null).length, 3, 'the patch and the two badges');
  for (const v of ['default', 'dust', 'night']) assert.ok(!WARDROBE.rb_medic_f[v].body?.some((r) => r.lset != null), `the paramedics (${v}) keep their lettering`);
  // the glazier: a work top under the jacket (the open neckline dyed as cloth on her head map and her body map)
  const gz = WARDROBE.rb_glazier.glazier;
  assert.ok(gz.head.some((r) => r.band[1] >= 0.6 && r.band[1] <= 0.7 && r.band[3] <= 0.85 && r.band[2] <= 0.75 && r.skin === false), 'her chest under the collarbones cloth, not the ponytail beside it');
  assert.ok(gz.body.some((r) => r.band[0] <= 0.45 && r.band[2] >= 0.55 && r.lmin >= 0.4 && r.skin === false), 'the skin inside the lapels cloth, the lapels kept');
  // the tan whorl on the top of the Elder's scalp silvered in her maps' edit (tools/rocketbox-textures.py F009 crown)
  assert.ok(/'crown': \[\('e', 7\d\d, 1\d\d,/.test(fs.readFileSync('tools/rocketbox-textures.py', 'utf8')), 'the whorl on her scalp silvered');
  // Mission 21: the office empty, and said to be, when the persuaded Rook holds the gap
  const office = M21.scenes.office.lines, say = (facts) => office.filter((l) => !l.when || compileCondition(l.when)({ fact: (k) => facts[k] ?? null, state: 'PRESENT' })).map((l) => l.text);
  const empty = 'An empty chair, and a recorder on the desk, still running.';
  assert.ok(say({ rook_fate: 'persuade', ally: 'rook' }).includes(empty) && !say({ rook_fate: 'persuade', ally: 'rook' }).some((t) => t.startsWith('They gave me')), 'Rook at the gap: the chair empty');
  assert.ok(say({ rook_fate: 'persuade', ally: 'sera' }).some((t) => t.startsWith('They gave me the chair')) && !say({ rook_fate: 'persuade', ally: 'sera' }).includes(empty), 'Rook in his chair');
  assert.ok(say({ rook_fate: 'expose' }).some((t) => t.includes('check badges')) && !say({ rook_fate: 'expose' }).includes(empty), 'Pryce in his chair');
  assert.ok(say({}).includes(empty), 'nobody in it');
});

// (castfin round 2) What the round-1 check found: the "tan diamond" on the back of the Elder's head was no map at all but the
// focus marker's glow, a sprite at head height through the person it marks, whitening what lay behind its plane and leaving
// what came forward of it (her crown, the hump of her cloak) a hard-edged patch; walking, the tunic still came through the
// backs of the cloaks and the fronts of the aprons; a child in a dark tunic wore round 1's light shirt over it, a T-shirt and
// a skirt rather than a tunic.
// the skirt's points (over its drawn triangles) that lie outside the piece worn over it (a cloak's length, an apron) in a
// posed body, 10 cm or more above that piece's hem as it hangs there (below it the skirt is longer, and shows): how many, of
// how many, and the deepest
function throughOver(B, base, over) {
  const g = base.g, gp = g.attributes.position, P = PIECES;
  const m = new THREE.SkinnedMesh(g, new THREE.MeshBasicMaterial());
  B.mesh.parent.add(m);
  m.bind(B.mesh.skeleton, B.mesh.bindMatrix);
  B.root.updateMatrixWorld(true);
  const v = new THREE.Vector3(), Q = new Float32Array(gp.count * 3);
  for (let i = 0; i < gp.count; i++) { m.applyBoneTransform(i, v.fromBufferAttribute(gp, i)).applyMatrix4(m.matrixWorld); Q.set([v.x, v.y, v.z], i * 3); }
  m.removeFromParent();
  const ix = g.index, oi = [], tris = [];
  for (let t = 0; t < ix.count; t += 3) {
    const piece = P[base.paint[ix.getX(t)] >> 1];
    if (piece === over) oi.push(ix.getX(t), ix.getX(t + 1), ix.getX(t + 2));
    if (piece === 'skirt') tris.push([ix.getX(t), ix.getX(t + 1), ix.getX(t + 2)]);
  }
  const og = new THREE.BufferGeometry();
  og.setAttribute('position', new THREE.BufferAttribute(Q, 3));
  og.setIndex(oi);
  og.computeBoundingSphere();
  const om = new THREE.Mesh(og, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  om.updateMatrixWorld(true);
  const pc = B.mesh.skeleton.bones.find((b) => b.name === 'Bip01_Pelvis').getWorldPosition(new THREE.Vector3());
  const bin = (x, z) => ((Math.floor(((Math.atan2(x - pc.x, z - pc.z) + Math.PI) / (2 * Math.PI)) * 24) % 24) + 24) % 24;
  const hem = new Float32Array(24).fill(Infinity);
  for (const i of new Set(oi)) { const b = bin(Q[i * 3], Q[i * 3 + 2]); hem[b] = Math.min(hem[b], Q[i * 3 + 1]); }
  const W3 = [[1, 0, 0], [0.5, 0.5, 0], [1 / 3, 1 / 3, 1 / 3], [0.5, 0, 0.5], [0, 0.5, 0.5], [0.66, 0.17, 0.17], [0.17, 0.66, 0.17], [0.17, 0.17, 0.66]];
  const pts = [];
  for (const [a, b, c] of tris) for (const [u, w, x] of W3) pts.push([0, 1, 2].map((k) => Q[a * 3 + k] * u + Q[b * 3 + k] * w + Q[c * 3 + k] * x));
  const top = Math.max(...pts.map((p) => p[1]));
  const rc = new THREE.Raycaster(), o = new THREE.Vector3();
  let n = 0, out = 0, deep = 0;
  for (const [x, y, z] of pts) {
    if (y > top - 0.04) continue; // (under the belt)
    const d = new THREE.Vector3(x - pc.x, 0, z - pc.z), L = d.length();
    rc.set(o.set(pc.x, y, pc.z), d.normalize());
    rc.far = L + 0.5;
    const hits = rc.intersectObject(om, false);
    if (!hits.length) continue; // (not under it: its opening at the front, beside an apron)
    const b = bin(x, z);
    if (y < Math.max(...[hem[b], hem[(b + 1) % 24], hem[(b + 23) % 24]].filter(Number.isFinite), -1) + 0.1) continue;
    n++;
    const h = hits[hits.length - 1].distance; // (its outermost layer that way)
    if (L > h + 0.002) { out++; deep = Math.max(deep, L - h); }
  }
  return { n, out, deep };
}
test('castfin round 2: the focus glow behind a person, cloaks and aprons moving as the tunic under them, a child\'s tunic one colour', () => {
  // the focus marker: its glow set back from the point, away from the camera, for a person (the ring stays round the point)
  const had = globalThis.document;
  globalThis.document ??= { createElement: () => ({ getContext: () => ({ createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} }) }) };
  let fx;
  try { fx = new Fx(new THREE.Scene()); } finally { if (!had) delete globalThis.document; }
  const cam = new THREE.PerspectiveCamera(62, 2, 0.05, 100);
  cam.position.set(1.2, 2.1, 1.6);
  cam.lookAt(0, 1.5, 0);
  cam.updateMatrixWorld(true);
  const glowAt = () => { fx.marker.updateMatrixWorld(true); return fx.glow.getWorldPosition(new THREE.Vector3()); };
  fx.focus([0, 1.5, 0], 0xffffff, 0, cam, 0.5);
  const p = new THREE.Vector3(0, 1.5, 0), g = glowAt();
  assert.ok(Math.abs(g.distanceTo(cam.position) - p.distanceTo(cam.position) - 0.5) < 0.02 && g.distanceTo(p) > 0.49 && g.distanceTo(p) < 0.51, `a person's glow 0.5 m behind them (${g.distanceTo(p).toFixed(3)})`);
  assert.ok(fx.ring.getWorldPosition(new THREE.Vector3()).distanceTo(p) < 1e-6, 'the ring at the point');
  fx.focus([2, 1, 0], 0xffffff, 0, cam);
  assert.ok(glowAt().distanceTo(new THREE.Vector3(2, 1, 0)) < 1e-6, 'anything else: the glow at the point');
  fx.focus(null);
  assert.equal(fx.marker.visible, false);
  // a person is marked as one, in both editions (DeckWorld's people, Station Zero's Juno), and the game hands that on
  assert.ok(/npc: n, person: true \}/.test(fs.readFileSync('game/js/world/DeckWorld.js', 'utf8')), 'DeckWorld: a person');
  assert.ok(/prompt: 'TALK TO JUNO', person: true \}/.test(fs.readFileSync('game/js/world/Npcs.js', 'utf8')), 'Juno: a person');
  const main = fs.readFileSync('game/js/main.js', 'utf8');
  assert.ok(/this\.promptPerson = !!\(showFocus && this\.focus\.person\)/.test(main) && /this\.fx\.focus\(pos, 0xffffff, this\.time, this\.camera, person \? 0\.5 : 0\)/.test(main), 'main.js sets a person\'s glow behind them');
  // cloaks and aprons over a tunic, on the real bodies in the game's own poses (tests/fixtures/garment-poses.json)
  const W = (m, v) => WARDROBE[m][v].garb;
  for (const [model, variant, over] of [['rb_vill_m', 'fire1', 'cloak'], ['rb_elder', 'elder', 'cloak'], ['rb_elder_m', 'fire1', 'cloak'], ['rb_niko_old', 'older', 'cloak'], ['rb_vill_m', 'potter', 'apron'], ['rb_vill_f2', 'craft', 'apron']]) {
    const pose = POSES.poses[model];
    assert.ok(pose?.stand && Object.keys(pose).length >= 4, `tests/fixtures/garment-poses.json: ${model}`);
    const B = glbBody(`game/assets/characters/${model}.glb`);
    posed(B, pose.stand);
    const info = GARMENT_DBG.restFrom(B.mesh, B.root);
    const garb = W(model, variant), who = `${model}/${variant}`;
    const base = GARMENT_DBG.build(info, garb);
    // the skirt under the piece is not drawn (its own skirt alone has every triangle)
    const alone = GARMENT_DBG.build(info, { skirt: garb.skirt });
    assert.ok(base.under > 80 && alone.under === 0, `${who}: ${base.under} of the skirt's triangles under the ${over} left out`);
    // the piece from 10 cm under the skirt's top down takes the skin of the skirt straight in under it: no bone the skirt
    // has not (its rings, as the body stood when they were cut)
    const gp = base.g.attributes.position, si = base.g.attributes.skinIndex, sw = base.g.attributes.skinWeight;
    const skirtBones = new Set();
    let skirtTop = -Infinity;
    const m = new THREE.SkinnedMesh(base.g, new THREE.MeshBasicMaterial());
    B.mesh.parent.add(m);
    m.bind(B.mesh.skeleton, B.mesh.bindMatrix);
    B.root.updateMatrixWorld(true);
    const v = new THREE.Vector3(), Y = new Float32Array(gp.count);
    for (let i = 0; i < gp.count; i++) Y[i] = m.applyBoneTransform(i, v.fromBufferAttribute(gp, i)).applyMatrix4(m.matrixWorld).y;
    m.removeFromParent();
    for (let i = 0; i < gp.count; i++) {
      if (PIECES[base.paint[i] >> 1] !== 'skirt') continue;
      skirtTop = Math.max(skirtTop, Y[i]);
      for (let c = 0; c < 4; c++) if (sw.getComponent(i, c) > 0) skirtBones.add(si.getComponent(i, c));
    }
    let low = 0, foreign = 0;
    for (let i = 0; i < gp.count; i++) {
      if (PIECES[base.paint[i] >> 1] !== over || Y[i] > skirtTop - 0.11) continue;
      low++;
      for (let c = 0; c < 4; c++) if (sw.getComponent(i, c) > 1e-3 && !skirtBones.has(si.getComponent(i, c))) foreign++;
    }
    assert.ok(low > 50 && foreign === 0, `${who}: ${low} points of the ${over} below the waist, ${foreign} bones the skirt has not`);
    // standing, and three phases of the stride: no point of the skirt 10 cm or more above the piece's hem lies outside it
    for (const [k, ps] of Object.entries(pose)) {
      posed(B, ps);
      const r = throughOver(B, base, over);
      const limit = k === 'stand' ? 0 : 20;
      assert.ok(r.n > 100 && r.out <= limit && r.deep <= 0.13, `${who} ${k}: ${r.out} of ${r.n} points of the skirt through the ${over} (${(100 * r.deep).toFixed(1)} cm)`);
    }
  }
  // a settlement child's tunic: the top (the body's jersey) and the skirt one dye, light enough to read as cloth on the
  // body's dark skin; the outfit's colours swapped, not lost
  let kids = 0;
  for (const [name, x] of Object.entries(WARDROBE.rb_child_m2)) {
    if (!/^(fire|water|sky|fest|ash)_(boy|girl)\d$/.test(name)) continue;
    kids++;
    const dye = Object.keys(DYE).find((d) => DYE[d] === x.garb.skirt.dye);
    const rule = dyeRule(dye), jersey = x.body[0];
    assert.ok(dye && jersey.to === rule.to && jersey.sset === rule.sset && jersey.lrange[0] === rule.lrange[0], `${name}: the top the skirt's ${dye}`);
    const h = {};
    new THREE.Color(DYE[dye]).getHSL(h, THREE.SRGBColorSpace);
    assert.ok(h.l >= KID_LIGHT, `${name}: ${dye} light enough (${h.l.toFixed(2)})`);
    if (x.garb.sash) assert.notEqual(x.garb.sash.dye, x.garb.skirt.dye, `${name}: the sash not the tunic's colour`);
    if (x.garb.belt) assert.notEqual(x.garb.belt.dye, x.garb.skirt.dye, `${name}: the belt not the tunic's colour`);
    if (x.garb.skirt.stripe) assert.notEqual(x.garb.skirt.stripe, x.garb.skirt.dye, `${name}: the stripe not the tunic's colour`);
  }
  assert.equal(kids, 50, 'every palette\'s five boys and five girls');
  assert.deepEqual(kidOutfit('black', 'madder', 'weld'), ['weld', 'madder', 'black'], 'a dark tunic swapped with the outfit\'s first light dye');
  assert.deepEqual(kidOutfit('ochre', 'madder', 'walnut'), ['ochre', 'madder', 'walnut'], 'a light tunic kept');
  assert.deepEqual(kidOutfit('walnut', 'brown', 'black'), ['oat', 'brown', 'black'], 'no light dye in the outfit: oat');
});

test('named faces stay out of crowds (but for the listed exceptions), and crowd faces never cross eras', () => {
  const named = new Set(allNamed().map((n) => n.model));
  for (const era of Object.keys(ERAS)) for (const m of eraModels(era)) assert.ok(!named.has(m) || EXCEPTIONS.includes(m), `${era}: ${m} is a named face`);
  const [pr, an, fu] = ['present', 'ancient', 'future'].map(eraModels);
  for (const m of pr) assert.ok((!an.has(m) && !fu.has(m)) || m === 'rb_child_m2', `present and other eras share ${m}`);
  for (const m of an) assert.ok(!fu.has(m) || m === 'rb_child_m2', `ancient and 2196 share ${m}`);
  // (closing) never a named face in a crowd, or placed by hand as somebody else, before or after that person appears
  assert.equal(EXCEPTIONS.length, 0);
  for (const a of Object.values(AMBIENT_CAST)) {
    const owner = allNamed().find((n) => n.model === a.model);
    // (Ezra's and Niko's own echoes, and Sera in her disguise, are those people)
    assert.ok(!owner || ['rb_ezra', 'rb_niko', 'rb_sera'].includes(a.model), `${a.model}/${a.variant} is ${owner?.id}'s face`);
  }
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
      assert.ok(!here.has(c.model) && !allNamed().some((x) => x.model === c.model), `${deck.mkey}/${s}: ${c.model} is in the crowd and a named face`);
      assert.ok(eraModels(c.era).has(c.model), `${deck.mkey}/${s}: ${c.model} is not of the ${c.era} era`);
    }
  }
});

test('crowds walk every mission\'s place: neighbours differ, heights and paces vary a little, within the budget', () => {
  const byMission = {};
  for (const { deck, s, level } of LEVELS) {
    const crowd = level.npcs.filter((n) => n.crowd);
    byMission[deck.mkey] = (byMission[deck.mkey] || 0) + crowd.length;
    assert.ok(level.npcs.length <= (level.people || MAX_PEOPLE), `${deck.mkey}/${s}: ${level.npcs.length} people`);
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
test('tour: people placed by hand stand on the ground, in no wall, seat or counter; the crowd never wears their face and clothes', () => {
  let people = 0;
  for (const { deck, s, level } of LEVELS) {
    const states = level.states || deck.states || ['PRESENT'];
    for (const n of level.npcs) {
      if (n.crowd || n.path) continue;
      const [x, y, z] = n.pos;
      for (const st of states) {
        // (a person whose condition names a year stands only in it)
        if (n.when && /@(PRESENT|PAST|FUTURE)/.test(n.when) && (!new RegExp(`@${st}`).test(n.when) || new RegExp(`!@${st}`).test(n.when))) continue;
        const live = (e) => {
          if (!e.solid || !e.box) return false;
          if (!e.when) return true;
          try { return !!compileCondition(e.when)({ fact: () => false, state: st }); } catch { return true; }
        };
        const under = (level.elements || []).filter((e) => live(e) && x >= e.box[0] - 0.05 && x <= e.box[3] + 0.05 && z >= e.box[2] - 0.05 && z <= e.box[5] + 0.05);
        const inside = under.find((e) => y + 0.3 > e.box[1] && y + 0.3 < e.box[4]);
        assert.ok(!inside, `${deck.mkey}/${s} ${st}: ${n.id} stands inside ${JSON.stringify(inside?.box)}`);
        const ground = Math.max(under.filter((e) => e.box[4] <= y + 0.36).reduce((a, e) => Math.max(a, e.box[4]), -Infinity), level.heightAt ? level.heightAt(x, z) : -Infinity);
        assert.ok(!Number.isFinite(ground) || y - ground <= 0.3, `${deck.mkey}/${s} ${st}: ${n.id} floats ${(y - ground).toFixed(2)} m`);
        people++;
      }
    }
    // (Mission 4's storyteller, craftswoman and girl walked twice: in their places and again in the crowd)
    const placed = new Set(level.npcs.filter((n) => n.ambient && !n.crowd).map((n) => level.cast.find((c) => c.id === n.crew)).filter(Boolean).map((c) => `${c.model}/${c.variant || 'default'}`));
    for (const n of level.npcs.filter((x) => x.crowd && !x.hologram)) {
      const c = level.cast.find((x) => x.id === n.crew);
      assert.ok(!placed.has(`${c.model}/${c.variant || 'default'}`), `${deck.mkey}/${s}: ${n.id} wears ${c.model}/${c.variant}, as someone placed by hand here does`);
    }
  }
  assert.ok(people > 300, `${people} placings checked`);
});

test('crowds are not clones: one face at most CAP times a year in a place, each time in other clothes, and never a hand-placed person\'s', () => {
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
        // (closing) and each of them in other clothes (a uniform aside: the loop cells' prisoners)
        if (c.crowdRole === 'prisoner') continue;
        const kv = `${c.model}/${c.variant}@${y}`;
        count[kv] = (count[kv] || 0) + 1;
        assert.ok(count[kv] === 1, `${deck.mkey}/${s}: two crowd people wear ${c.model}/${c.variant} in ${y}`);
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

// (closing: the player's "don't repeat the same ... again and again": the settlement's 'We cook at the first fire' was
// said in five missions, Rain City's 'The 41 is late' in three, 2196's 'The memorial has your face' in four)
test('every mission\'s crowd says its own lines: no line said in passing is heard in two missions (a case replays its own)', () => {
  const by = new Map();
  let crowds = 0;
  for (const { deck, level } of LEVELS) {
    const mk = deck.origin || deck.mkey;
    for (const n of level.npcs) {
      if (!n.crowd || !n.barks?.length) continue;
      crowds++;
      for (const b of n.barks) {
        if (!by.has(b)) by.set(b, new Set());
        by.get(b).add(mk);
      }
    }
  }
  const twice = [...by].filter(([, ms]) => ms.size > 1).map(([b, ms]) => `${[...ms].join(', ')}: ${b}`);
  assert.deepEqual(twice, [], 'a crowd line heard in more than one mission');
  assert.ok(crowds > 150 && by.size > 80, `${crowds} people of the crowds say ${by.size} lines`);
  // each pool a mission has of its own replaces a region's pool another mission says, and is said
  for (const [mk, pools] of Object.entries(MISSION_BARKS)) {
    for (const [pool, lines] of Object.entries(pools)) {
      assert.ok(AMBIENT[pool] && lines.length >= 4, `${mk}: its ${pool} pool`);
      assert.ok(lines.every((t) => !AMBIENT[pool].barks.includes(t)), `${mk}: not the region's lines`);
      assert.ok(lines.some((t) => by.get(t)?.has(mk)), `${mk}: its ${pool} lines are said`);
    }
  }
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
    // (a replay loads its own mission's chapter's people, not every replay's: Runtime.castKeyOf)
    const need = castOf(ch === 'cases' && deck.voiceGroup ? deck.voiceGroup : ch);
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
  // (closing: the settlement's own six, Tomas, the receptionist and Officer Haig with faces of their own; the robe, hijab,
  // abaya and the second robe gone)
  // (castfix: the glazier; round 2: Niko as an old man, his face aged in its own maps)
  assert.equal(Object.keys(LV_MODELS).length, 47, '47 new people');
  assert.equal(Object.values(LV_MODELS).filter((m) => m.px === 1024).length, 23, '23 named at 1024 px');
  assert.deepEqual(Object.entries(LV_MODELS).filter(([, m]) => m.px === 512 && !m.crowd).map(([k]) => k).sort(), ['rb_haig', 'rb_tomas'], 'two named only ever seen as light, at 512 px');
  assert.equal(Object.values(LV_MODELS).filter((m) => m.crowd).length, 22, '22 crowd at 512 px');
  for (const m of Object.values(LV_MODELS).filter((x) => x.crowd)) assert.equal(m.px, 512);
  // (closing) mind the APK: the edition's people within 31 MB (30 until castfix round 2 gave old Niko his own aged face,
  // 0.7 MB; the APK stays within its 50 MB: android/build-apk.sh), and no FBXLoader extras in the edition's own files
  const bytes = MANIFEST.reduce((a, f) => a + fs.statSync(`game/assets/characters/${f}`).size, 0);
  assert.ok(bytes < 31e6, `the edition's people: ${(bytes / 1e6).toFixed(2)} MB`);
  for (const f of lvFiles) {
    const b = fs.readFileSync(`game/assets/characters/${f}`);
    assert.ok(!b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8').includes('"extras"'), `${f} carries node extras`);
  }
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
  const PARTS = ['body', 'head', 'hair', 'hat', 'helmet', 'equipment', 'keffiyeh', 'stetoskop', 'tools', 'glasses', 'protection'];
  const DYE_RE = /^#[0-9a-f]{6}$/i;
  for (const [model, vs] of Object.entries(WARDROBE)) {
    assert.ok(MODEL_OF(model), model);
    for (const [name, v] of Object.entries(vs)) {
      for (const [k, rules] of Object.entries(v)) {
        if (k === 'hide' || k === 'props') { assert.ok(Array.isArray(rules), `${model}/${name}.${k}`); continue; }
        // (closing) clothes made for the body, another's hair, whose a variant is
        if (k === 'garb') {
          for (const [piece, g] of Object.entries(rules)) {
            assert.ok(PIECES.includes(piece), `${model}/${name}: garment ${piece}`);
            assert.ok(DYE_RE.test(g.dye) && (g.stripe === undefined || DYE_RE.test(g.stripe)), `${model}/${name}.${piece}: dyes ${g.dye} ${g.stripe}`);
            for (const x of ['hem', 'front', 'back', 'reach', 'w', 'top', 'ease', 'open', 'wide', 'bibWide']) if (g[x] !== undefined) assert.ok(g[x] >= 0 && g[x] <= 1.6, `${model}/${name}.${piece}.${x}`);
            if (g.bib !== undefined) assert.ok(g.bib >= -0.15 && g.bib <= 0.6, `${model}/${name}.${piece}.bib`); // (m below the shoulders: a little above them, a high bib)
            if (g.flare !== undefined) assert.ok(g.flare >= 1 && g.flare <= 1.6, `${model}/${name}.${piece}.flare`);
          }
          continue;
        }
        if (k === 'hairdo') { assert.ok(LV_MODELS[rules.from] && !LV_MODELS[rules.from].child, `${model}/${name}: hair from ${rules.from}`); continue; }
        // (castfix round 2) a head of hair of its own (garments.js hairMass): its dye, its hairline and its thickness
        if (k === 'hairMass') {
          const s = { ...MASS_DEFAULT, ...rules };
          assert.ok(DYE_RE.test(s.dye), `${model}/${name}.hairMass: dye ${s.dye}`);
          assert.ok(s.fringe > 0.5 && s.fringe < s.side && s.side < s.nape && s.nape < 2.6, `${model}/${name}.hairMass: the hairline, brow to nape`);
          assert.ok(s.lift > 0 && s.lift < 0.04 && s.locks >= 0 && s.locks < 0.5, `${model}/${name}.hairMass: lift and locks`);
          assert.ok(Object.keys(rules).every((x) => ['dye', 'fringe', 'side', 'nape', 'lift', 'locks', 'seed', 'holoOnly'].includes(x)), `${model}/${name}.hairMass: ${Object.keys(rules)}`);
          continue;
        }
        if (k === 'sex') { assert.ok(['f', 'm'].includes(rules), `${model}/${name}: sex ${rules}`); continue; }
        if (k === 'holoProps') { assert.equal(rules, true, `${model}/${name}.holoProps`); assert.ok(v.props?.length, `${model}/${name}: holoProps with props`); continue; }
        // (castfix) an old back's bend, in radians
        if (k === 'stoop') { assert.ok(rules > 0 && rules < 0.5, `${model}/${name}.stoop ${rules}`); continue; }
        assert.ok(PARTS.includes(k), `${model}/${name}: part ${k}`);
        assert.ok(rules.length <= 8, `${model}/${name}.${k}: ${rules.length} rules`);
        for (const r of packRules(rules)) {
          const nums = [...r.band, ...r.sel, ...r.win, ...r.act, ...r.act2];
          assert.ok(nums.every((x) => Number.isFinite(x) && x >= -1 && x <= 2), `${model}/${name}.${k}: ${JSON.stringify(r)}`);
          assert.ok(r.band[0] < r.band[2] && r.band[1] < r.band[3] && r.win[0] < r.win[1], `${model}/${name}.${k}: band and window`);
        }
      }
      for (const p of v.props || []) assert.ok(['umbrella', 'lantern', 'staff', 'trowel', 'clipboard', 'loupe', 'lanyard', 'beret', 'visor', 'badge', 'raincoatHood', 'raincoatChildHood', 'shadowHood', 'helmet', 'vest', 'glassLifter'].includes(p), `${model}/${name}: prop ${p}`);
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

test('no chapter is short (the player\'s "make each chapter a little longer"): every mission has its own words, recorded speech, place and threads', () => {
  // (v2.0, the build the player found short, averaged about 10 lines and 140 words a mission in generated rooms;
  // these floors are what every v2.1 mission keeps above, measured from what it says and where it stands)
  const words = (t) => t.split(/\s+/).filter(Boolean).length;
  const secs = (e) => {
    const v = voiceOf(e.who, e.extra);
    return voicePieces(e.text, []).reduce((a, p) => a + (p.pause || ((PACKS.common?.[v]?.[p.key] || PACKS[e.group]?.[v]?.[p.key])?.[2] ?? 0)), 0);
  };
  const per = [];
  for (const m of main) {
    const own = SPOKEN.filter((e) => (e.path.startsWith(`${m.key}.`) || e.path.startsWith(`${m.key}#`) || e.path.startsWith(`card:${m.key}`)) && !/hint|bark/.test(e.path));
    const level = LEVELS.find((l) => l.deck.mkey === m.key).level;
    const [x0, z0, x1, z1] = level.bounds;
    const mains = threadsOf(asDeck(m)).filter((t) => !t.side);
    const r = { key: m.key, lines: own.length, words: own.reduce((a, e) => a + words(e.text), 0), speech: own.reduce((a, e) => a + secs(e), 0) / 60, area: (x1 - x0) * (z1 - z0), mains: mains.length, sides: sidesOf(m).length };
    per.push(r);
    const at = `${m.key}: ${JSON.stringify(r)}`;
    assert.ok(r.lines >= 40 && r.words >= 400, `${at}: 40 lines and 400 words of its own or more`);
    assert.ok(r.speech >= 2.5, `${at}: two and a half minutes of recorded speech or more`);
    assert.ok(r.area >= 15000, `${at}: a place of 1.5 ha or more`);
    assert.ok(r.mains >= 6 && r.sides >= 1 && m.coldOpen && m.hook, `${at}: six main threads or more (§9.8), a side story, a cold open and a hook`);
  }
  const total = per.reduce((a, r) => a + r.words, 0);
  assert.ok(total >= 15000, `the 23 missions say ${total} words of their own`);
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
  assert.equal(lexicon('8:14 and 16:02'), 'eight four-teen and six-teen oh two');
  assert.equal(lexicon('Act II'), 'Act Two');
  assert.equal(lexicon('Jun Park'), 'Joon Park');
  assert.equal(lexicon('Dr. Lin'), 'Doctor Lin');
  assert.equal(lexicon('Relay 41-B'), 'Relay forty-one B');
  assert.equal(lexicon('2196'), 'twenty-one ninety-six');
  // (the closing ear check) a -teen number is said with its stress on the -teen, never close to seventy; names the voice
  // model reads wrong are spelled as said
  assert.equal(lexicon('This is VERSION 17. V.117.'), 'This is Version seven-teen. Version one hundred and seven-teen.');
  assert.equal(lexicon('the 13th, 14 halls, Seventeen, nineteen'), 'the thir-teenth, four-teen halls, Seven-teen, nine-teen');
  assert.equal(lexicon('seventy, seven, teenage'), 'seventy, seven, teenage');
  assert.equal(lexicon('Rhea and Nurse Odile'), 'Reeya and Nurse Oh-deel');
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
  // (U8 review: an empty pack, the cases', is neither fetched, Runtime.packsFor, nor shipped in the APK or the preview)
  assert.ok(fs.readFileSync('android/build-apk.sh', 'utf8').includes('[ -s "$d/voice.ogg" ] || continue'), 'build-apk.sh skips an empty pack');
  // (release check: the edition's APK deflates its models, 52.6 MB stored, 45.3 MB deflated, within §10.2's 50 MB;
  // Station Zero's build stores them as it always has)
  const apk = fs.readFileSync('android/build-apk.sh', 'utf8');
  assert.ok(/STORED=\(-0 glb -0 ogg\)\nif \[ "\$EDITION" = "lastversion" \]/.test(apk) && /\n  STORED=\(-0 ogg\)\nelif/.test(apk) && apk.includes('aapt package -f "${STORED[@]}"'), 'build-apk.sh deflates the edition\'s models only');
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
  // (the closing ear check) a voice raised by resampling speaks faster by the same factor: its speed is set back by it,
  // so the children are not 25-40% faster than the adults round them
  for (const [k, [, speed, pf]] of Object.entries(V)) if (pf > 1.05 && ed.includes(k)) assert.ok(speed * pf <= 1.08, `${k}: speaks at ${(speed * pf).toFixed(2)} of its voice's pace`);
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

// closing (the player's point 1, the score): the music is written, not drawn at random. Every theme the bible names is
// in themes.js as notes; each act has its own; every theme states the motif; the composer plays the tune note for
// note in each mission's key and instruments, the same each time round and in every year; the cues quote the themes
test('the score is written music: a theme per act, the motif in each, the tune played note for note, the cues quoting it', async () => {
  const { THEMES, ACT_THEME, CHARACTER_THEME, MUSEUM, missionTheme, actOf, section, melodyPitches, head, ENDING_A, MOTIF: M } = await import('../game/js/editions/lastversion/themes.js');
  const { Score, REGIONS, MISSION_REGION } = await import('../game/js/editions/lastversion/score.js');
  assert.deepEqual(M, [0, 5, 10], 'the motif: up a fourth, up a fourth');
  // a theme for every act and for the bible's named cues (Main, Kai, Mira, the Witness, the Past, 2196, the war, the
  // Unwritten Second, the Final Choice), each with its own tune
  for (const ch of ORDER) assert.ok(THEMES[ACT_THEME[ch]], `${ch} has a theme`);
  assert.ok(THEMES[ACT_THEME.cases]);
  assert.equal(new Set(ORDER.map((ch) => ACT_THEME[ch])).size, ORDER.length, 'each act its own theme');
  for (const k of ['main', 'kai', 'mira', 'witness', 'past', 'c2196', 'war', 'unwritten', 'final']) assert.ok(THEMES[k], k);
  const tunes = new Set();
  for (const [k, th] of Object.entries(THEMES)) {
    assert.ok(th.name && th.tempo >= 40 && th.tempo <= 130 && th.home > 30, k);
    let ps = [];
    for (const x of new Set(th.form)) {
      const sec = section(k, x);
      assert.ok(sec, `${k}/${x}`);
      for (const [i, b] of sec.bars.entries()) assert.equal(b.total, b.len, `${k}/${x} bar ${i + 1}: its notes fill its ${b.len} eighths`);
      ps = ps.concat(melodyPitches(k, x));
    }
    let motif = false;
    for (let i = 0; i + 2 < ps.length; i++) if (ps[i + 1] - ps[i] === 5 && ps[i + 2] - ps[i + 1] === 5) motif = true;
    assert.ok(motif, `${k} states the motif (up a fourth, up a fourth)`);
    if (!th.of) { assert.ok(!tunes.has(ps.join()), `${k}: a tune of its own`); tunes.add(ps.join()); }
  }
  // every mission plays its act's theme, or a character's (Mira, the Witness), or the museum's, or Helix's own again
  const allowed = new Set(['mira', 'witness', 'museum', 'kai']);
  for (const m of main) {
    const th = missionTheme(m.key);
    assert.ok(th === ACT_THEME[actOf(m.key)] || (allowed.has(th) && (CHARACTER_THEME[m.key] || m.key === 'm08')), `${m.key}: ${th}`);
  }
  assert.ok(['m11', 'm20'].every((k) => missionTheme(k) === 'mira') && ['m12', 'm17', 'm21'].every((k) => missionTheme(k) === 'witness'));
  assert.ok(MUSEUM.every((k) => THEMES[k]) && missionTheme('m16') === 'museum');
  // the composer, on a stand-in audio graph: the tune note for note, in order, round the form
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const node = () => { const n = { gain: param(), frequency: param(), detune: param(), Q: param(), playbackRate: param(), connect: (x) => x || n, disconnect() {}, start() {}, stop() {}, type: '', buffer: null }; return n; };
  const ctx = { currentTime: 1, sampleRate: 8000, createOscillator: node, createGain: node, createBiquadFilter: node, createBufferSource: node, createBuffer: (ch, len) => ({ getChannelData: () => new Float32Array(len) }) };
  const synth = { ctx, music: node(), sfx: node(), amb: node(), master: node(), reverb: node(), threat: 0, mix: {}, osc() {}, pad() {}, pluck() {}, bell() {}, silence() {}, setMix() {}, level: () => 1 };
  const facts = new FactStore();
  const score = new Score({ g: { audio: synth, facts, voice: null }, inv: null, wallaLines: () => [], chapter: 'act2' });
  const play = (deck, year = 'PRESENT', eighths = null) => {
    score.enter(deck, year, null);
    score.played.length = 0;
    const th = score.themeKey;
    const plan = score.planFor(score.region);
    const total = eighths ?? plan.reduce((a, x) => a + x.bars.reduce((b, y) => b + y.len, 0), 0);
    let t = 1;
    for (let n = 0; n < total; n++) t += score.step(synth, n, t);
    return { th, plan, notes: score.played.filter((x) => !x.cue) };
  };
  for (const m of [...main, { key: 'c_b' }, { key: 'c_c' }]) {
    const deck = { ...m, mkey: m.key };
    const { th, plan, notes } = play(deck);
    const want = plan.flatMap((x) => x.bars.flatMap((b) => b.notes.map((nt) => nt.p)));
    assert.deepEqual(notes.map((x) => x.p), want, `${m.key} (${th}, ${MISSION_REGION[m.key]}): the tune, note for note, once round its form`);
    assert.ok(notes.length >= 10, `${m.key}: ${notes.length} notes`);
    // the same again the next time round (nothing drawn at random)
    const again = play(deck);
    assert.deepEqual(again.notes.map((x) => x.midi), notes.map((x) => x.midi), `${m.key}: the same tune the second time`);
  }
  // a place keeps its tune in every year, on other instruments (Rain City: piano in 2049, plucked in 2026, strings in 2196)
  const m01 = { ...main.find((m) => m.key === 'm01'), mkey: 'm01' };
  const byYear = Object.fromEntries(['PRESENT', 'PAST', 'FUTURE'].map((y) => [y, play(m01, y).notes]));
  assert.deepEqual(byYear.PAST.map((x) => x.p), byYear.PRESENT.map((x) => x.p));
  assert.deepEqual(byYear.FUTURE.map((x) => x.p), byYear.PRESENT.map((x) => x.p));
  assert.deepEqual(['PRESENT', 'PAST', 'FUTURE'].map((y) => byYear[y][0].ins), ['piano', 'pluck', 'strings']);
  assert.ok(Object.values(REGIONS).every((R) => R.lead?.PRESENT), 'every region names the instrument that carries its tune');
  // the locked city (Mission 15) plays its first four bars over and over until tomorrow is let in; then the theme goes on
  const m15 = { ...main.find((m) => m.key === 'm15'), mkey: 'm15' };
  const four = section('c2196', 'A').bars.slice(0, 4).flatMap((b) => b.notes.map((nt) => nt.p));
  assert.deepEqual(play(m15, 'PRESENT', 64).notes.map((x) => x.p), [...four, ...four], 'the locked city: four bars, twice, the same');
  facts.set('city_freed', true);
  assert.deepEqual(play(m15, 'PRESENT', 64).notes.map((x) => x.p), section('c2196', 'A').bars.flatMap((b) => b.notes.map((nt) => nt.p)), 'freed: the phrase goes on');
  // the museum (Mission 16): the other themes' first phrases, exhibit by exhibit
  const m16 = play({ ...main.find((m) => m.key === 'm16'), mkey: 'm16' });
  assert.deepEqual([...new Set(m16.notes.map((x) => x.theme))], MUSEUM, 'the museum plays the other themes in its own order');
  // the cues quote the themes: each act's card its act's theme; a mission's card its own; the endings theirs
  for (const ch of ORDER) { score.quotes.length = 0; score.cue('chapter', { chapter: ch }); assert.deepEqual(score.quotes, [{ cue: 'chapter', theme: ACT_THEME[ch] }], ch); }
  score.enter({ mkey: 'm11' }, 'PRESENT');
  score.quotes.length = 0;
  score.played.length = 0; // (the chapter cues above played their notes too)
  score.cue('card');
  assert.deepEqual(score.quotes, [{ cue: 'card', theme: 'mira' }], 'Mission 11\'s card quotes Mira\'s theme');
  const cardNotes = score.played.filter((x) => x.cue).map((x) => x.p);
  assert.deepEqual(cardNotes, head('mira', 1).bars[0].notes.map((nt) => nt.p), 'its first bar, note for note');
  // Ending A is the only full major cadence: its last chord is A major with the tonic on top; no theme ends on one
  const last = ENDING_A[ENDING_A.length - 1];
  assert.ok(last.chord[0] === 0 && last.chord.includes(4) && last.notes[last.notes.length - 1].p % 12 === 0, 'Ending A comes home to A major');
  for (const [k, th] of Object.entries(THEMES)) {
    for (const x of new Set(th.form)) {
      const bars = section(k, x).bars.filter((b) => b.chord);
      const end = bars[bars.length - 1];
      if (end) assert.ok(!(end.chord[0] % 12 === 0 && end.chord.some((v) => ((v % 12) + 12) % 12 === 4)), `${k}/${x} does not end on a major tonic`);
    }
  }
  for (const k of ['A', 'B', 'C']) { score.quotes.length = 0; score.cue(`ending:${k}`); assert.equal(score.quotes.length, 1, `ending ${k} quotes its theme`); }
  assert.equal(score.quotes[0].theme, 'final', 'Ending C is the Final Choice');
  assert.ok(score.silentUntil > ctx.currentTime + 8, 'and it keeps a breath of silence before its one note');
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
    // (§9.8 asked for 6-10; the closing pass lengthened the short missions with played threads, up to 20)
    assert.ok(mains.length >= 6 && mains.length <= 20, `${here}: 6-20 main threads (${mains.length})`);
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

// (closing: the length model of §9.8, each thread's minutes as its author set them, overstated a player's time about five
// times over against the bot's measured walks, and is no longer a length claim: what a mission says and where it stands is
// measured instead, 'no chapter is short' below, and the bot measures its time)
test('a mission not yet rewritten would run through the shim: one thread per beat, in quarter i', () => {
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
      for (const [k, v] of Object.entries(o.set || {})) {
        if (k.startsWith('ev_') || k.startsWith('t_')) continue; // (evidence is pinned to the case board)
        n++;
        assert.ok(new RegExp(`\\b${k}\\b`).test(read), `${m.key}: "${o.label}" sets ${k}, which nothing later reads`);
        // (U8 review) each value of a choice with several is read for itself: keeping the letter is a choice too. (A
        // default branch, read as "neither of the others", and a value read by a mission's code are named here.)
        const READ_ELSE = { quest_jun: ['resolved'], machine_buried: ['clay'], rook_fate: ['record'], m20_lead: ['kai'] };
        if (o.consequence && typeof v === 'string' && !READ_ELSE[k]?.includes(v)) assert.ok(new RegExp(`\\b${k}\\s*[!=]=\\s*"${v}"`).test(read), `${m.key}: "${o.label}" sets ${k} = "${v}", which nothing later reads`);
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
  // (the Finale: 2,600 since the closing pass made it a climax in scenes, with three endings, the epilogue and the
  // post-credit among its words; its pack is 1.2 MB)
  assert.ok(w.finale <= 2600, `the Finale: ${w.finale} words`);
  // each Act mission (main and optional): 1,600 words (closing: §8.10's 1,000 was set for the build the player found short;
  // what bounds the speech now is each pack's file, under the preview's 15 MB, and the edition's APK, checked where they
  // are built)
  const per = {};
  const seen = new Set();
  for (const e of SPOKEN) {
    if (!/^act/.test(e.group)) continue;
    // (a crowd line is counted once, however many of the crowd's voices say it: closing, the missions' own bark pools)
    const k = /\.bark\d/.test(e.path) ? `bark|${e.text}` : `${voiceOf(e.who, e.extra)}|${e.text}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const mk = e.path.slice(0, 3);
    per[mk] = (per[mk] || 0) + e.text.split(/\s+/).length;
  }
  for (const [mk, n] of Object.entries(per)) assert.ok(n <= 1600, `${mk}: ${n} words`);
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
  // the chase's end sets t_m01_chase itself: what the thread carries (mira_gone, her raincoat line) still follows, once,
  // and only when the story has reached it (every thread it comes after paid)
  game.facts.set('t_m01_chase');
  th.update();
  assert.ok(!game.facts.get('mira_gone'), 'not before the threads it comes after');
  const chain = new Set();
  const walk = (t) => { for (const a of t.after || []) if (!chain.has(a)) { chain.add(a); walk(th.byId[a]); } };
  walk(th.byId.chase);
  assert.ok(chain.size > 0);
  for (const a of chain) game.facts.set(`t_m01_${a}`);
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
  c.rt.threads.update(); // (as each fact change does in the game: the threads before it are paid, in order)
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
test('Acts I and II are rewritten as threads: each ends on its last thread, no quarter is empty', () => {
  assert.deepEqual(REWRITTEN.map((m) => m.key), MISSION_ORDER, 'Missions 1-23 are rewritten (U8: Acts III-IV and the Finale)');
  for (const ch of ['act1', 'act2']) {
    for (const m of MISSIONS[ch]) {
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
  for (const k of ['t_m09_loop1', 't_m09_loop2', 'clk_a', 't_m09_order', 'm09_brask', 'clk_b', 'clk_c', 'transmitter_cut', 'rhea_freed', 'ev_ninth_view']) game.facts.set(k, true);
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
// (a fact may be camelCase after its prefix, inv_clockArm_done, t_m22_courtGo; a year, @FUTURE, is not a fact)
const IDS = (c) => (typeof c === 'string' ? c.replace(/"[^"]*"/g, '').replace(/@[A-Z]+/g, '').match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) || [] : []).filter((k) => !['true', 'false'].includes(k));

test('Acts III and IV and the Finale are rewritten as threads: each ends on its last thread (the Finale on its ending), no quarter is empty', () => {
  for (const ch of ['act3', 'act4', 'finale']) {
    for (const m of MISSIONS[ch]) {
      assert.ok(m.done && (m.autoExit != null || ch === 'finale'), `${m.key}: it ends on its last thread (the Finale on its ending)`);
      assert.ok(m.quarters.every((q) => (q.threads || []).length + (q.sides || []).length > 0), `${m.key}: no empty quarter`);
    }
  }
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

// U8 review: a player who does everything open to them, in any order and any year, but one thing. Every interaction
// the level offers (spots, deductions, records, playbacks, triggers, every conversation node a person would say,
// every REVERSE that answers, the mission's rules, its staged moments, loops, holds and chases) is done as soon as it
// answers, until nothing new happens. Withholding what completes one main thread must leave the mission unfinished: no
// interaction done out of order, and no thread paid out of order, opens what ends it.
const YEARS3 = ['PRESENT', 'PAST', 'FUTURE'];
// (opts.guard: whether a node may act, Runtime.playNode's rule on a trip: roam.js roamFree; a node it refuses is only said)
function freePlay(m, level0, facts0, withhold = null, opts = {}) {
  const deck = { ...m, mkey: m.key };
  const f = new FactStore({ ...facts0 });
  const game = { facts: f, hud: { say() {}, toast() {} }, log: [], deckWorld: { flags: {}, npcs: [] }, campaign: {} };
  const th = new Threads({ g: game });
  // (the level's people copied: who is offered as a talk changes with the story, Threads.gateTalks)
  const level = { ...level0, npcs: level0.npcs.map((p) => ({ ...p })) };
  th.attach(deck, level);
  const people = level.npcs.map((p) => ({ n: p, crew: { id: p.crew } }));
  game.deckWorld.npcs = people;
  // what the withheld thread's completion would set: the player never does anything that sets it
  const held = withhold ? new Set([factOf(deck, withhold), ...IDS(doneCond(deck, withhold) || ''), ...(withhold.of || [])]) : new Set();
  const open = (...ws) => YEARS3.some((st) => ws.every((w) => f.test(w || 'true', st)));
  const apply = (set) => {
    if (!set || Object.keys(set).some((k) => held.has(k))) return false;
    for (const [k, v] of Object.entries(set)) f.set(k, v);
    return true;
  };
  // a node, its first choice that answers (choices are alternatives: the first one the player is offered)
  const node = (x) => {
    if (!x || (opts.guard && !opts.guard(x))) return;
    if (x.set && !apply(x.set)) return;
    const c = (x.choices || []).find((ch) => open(ch.when) && !Object.keys(ch.set || {}).some((k) => held.has(k)));
    if (c?.set) apply(c.set);
    if (x.then) fx(x.then);
    if (c?.then) fx(c.then);
  };
  const fired = new Set();
  // a node's code (then: the mission's fx), with a stand-in runtime in the year it is used in; what it sets that the
  // withheld thread needs is undone (the player never did it)
  let year = 'PRESENT';
  const rt = { g: { facts: f, engine: { state: () => year }, room: 'r', hud: { say: (l, ff, done) => done?.(), toast() {} }, audio: {}, log: [], deckWorld: { flags: {}, npcs: [] }, after() {} }, inv: null, deck, level, score: null };
  const fx = (name) => {
    const fn = deck.fx?.[name];
    if (!fn) return;
    const snap = { ...f.facts };
    try { fn(rt); } catch { /* code that needs the browser: what it set so far stays */ }
    if ([...held].some((k) => f.facts[k] !== snap[k])) f.facts = snap;
  };
  for (let round = 0; round < 60; round++) {
    const before = JSON.stringify(f.facts);
    for (const it of level.interactables) {
      // (r 0: a prop, never offered, DeckWorld.focusCandidates)
      if (it.kind !== 'scene' || it.r === 0 || !open(it.when)) continue;
      const sc = it.scene || '';
      if (sc.startsWith('deduce:')) {
        const d = deck.deductions?.[sc.slice(7)];
        const t = th.list.find((x) => x.kind === 'deduce' && (x.deduction || x.id) === sc.slice(7));
        const a = d?.answers.find((x) => x.correct && (!x.needs || f.test(x.needs)));
        if (a && t) apply({ ...(d.set || {}), [factOf(deck, t)]: true });
      } else if (sc.startsWith('residue:')) {
        const t = th.byId[sc.slice(8)];
        if (t && f.test(it.when || 'true', 'PAST')) apply({ [factOf(deck, t)]: true, ...(t.set || {}) });
      } else if (sc.startsWith('playback:')) {
        const t = th.byId[sc.slice(9)];
        if (t) apply({ [placedFact(deck, t)]: (t.entries || []).length, [factOf(deck, t)]: true, ...(t.set || {}) });
      } else if (!sc.startsWith('hold:') && !deck.nodes?.[sc]) {
        const x = deck.scenes?.[sc];
        // (in each year it answers in: its code may care which, Mission 5's gates take only 2026)
        for (const st of YEARS3) {
          if (!x || !f.test(it.when || 'true', st) || !f.test(x.when || 'true', st)) continue;
          year = st;
          node(x);
        }
      }
    }
    for (const tr of level.triggers) if (open(tr.when)) apply(tr.set);
    th.update();
    for (const p of people) {
      if (p.n.silent || !open(p.n.when)) continue;
      const at = th.talkNode(p);
      if (at) node(at.node);
    }
    for (const rec of level.processes || []) {
      if (rec.kind === 'refusal' || (rec.arm && !f.test(rec.arm)) || !open(rec.when)) continue;
      apply({ [`inv_${rec.id}_done`]: true, [`rev_${rec.id}`]: true });
    }
    for (const r of deck.rules || []) {
      if (fired.has(r.id) || !f.test(r.when) || !apply(r.set || {})) continue;
      fired.add(r.id);
      if (r.then) fx(r.then);
    }
    for (const t of th.list) {
      const self = (t.kind === 'cinema' && t.lines?.length) || t.kind === 'chase' || ((t.kind === 'loop' || t.kind === 'hold') && th.current() === t);
      if (self && th.available(t) && !th.done(t)) apply({ [factOf(deck, t)]: true, ...(t.kind === 'cinema' ? t.set || {} : {}) });
    }
    th.update();
    if (JSON.stringify(f.facts) === before) break;
  }
  return f;
}

test('Acts I to IV and the Finale: nothing done out of order skips a main thread (a free player withholding one thread never ends the mission)', () => {
  let checked = 0, finished = 0;
  for (const ch of ['act1', 'act2', 'act3', 'act4', 'finale']) {
    const f0 = new FactStore();
    for (const c of ORDER.slice(0, ORDER.indexOf(ch) + 1)) for (const k of PRIMES[c] || []) (Array.isArray(k) ? f0.set(k[0], k[1]) : f0.set(k));
    f0.set('faction', 'neutral');
    for (const m of MISSIONS[ch]) {
      const { level } = LEVELS.find((l) => l.deck.mkey === m.key && !l.adjusted);
      const deck = { ...m, mkey: m.key };
      // (everything open, nothing withheld: how far a player who does everything gets without the mission's code)
      const all = freePlay(m, level, f0.facts);
      if (all.test(m.done)) finished++;
      const ends = new Set(IDS(m.done));
      for (const t of threadsOf(deck).filter((x) => !x.side && !x.until)) {
        // (the thread whose completion is the end itself is not a thread before it)
        if (ends.has(factOf(deck, t)) || IDS(doneCond(deck, t) || '').some((k) => ends.has(k))) continue;
        checked++;
        const f = freePlay(m, level, f0.facts, t);
        assert.ok(!f.test(m.done), `${m.key}: ${t.id} withheld, yet the mission ends (${m.done})`);
      }
    }
  }
  assert.ok(checked >= 120, `${checked} threads withheld`);
  assert.ok(finished >= 12, `${finished} missions a free player can finish (the check is not vacuous)`);
});

// U8 review: the CASE FILES replays are played to their end by the same free player, from a finished campaign's facts
// with each replay's own cleared (Runtime.replayFacts); and none ends before its story gets there
test('CASE FILES: every replay can be finished from its own deck, and none ends early (the free player)', () => {
  const f0 = new FactStore();
  for (const c of [...ORDER, 'cases']) for (const k of PRIMES[c] || []) (Array.isArray(k) ? f0.set(k[0], k[1]) : f0.set(k));
  f0.set('faction', 'neutral');
  // (a campaign that played the stories once already: their facts as the missions left them)
  for (const [k, v] of Object.entries({ water_route: true, quest_tala: 'resolved', gate_low: true, gate_high: true, gate_mid: true, gates_n: 3, garden_restored: true, m14_culvert_asked: true,
    quest_jun: 'observed', m15_jun: true, ev_blank_tomorrow: true, inv_departureBoard_done: true, ezra_met: true, ezra_debt: 'release', has_spring: true, letter: 'kept', ev_unwritten_record: true, m22_orren: true })) f0.set(k, v);
  let finished = 0, withheld = 0;
  for (const c of MISSIONS.cases) {
    assert.ok(c.gateAfter, `${c.key}: its threads wait on the threads before them`);
    const { level } = LEVELS.find((l) => l.deck.mkey === c.key);
    const start = { ...f0.facts };
    for (const k of c.clear) start[k] = false;
    const f = freePlay(c, level, start);
    assert.ok(f.test(c.done), `${c.key}: a player who does everything the replay offers finishes it (${c.done})`);
    finished++;
    const deck = { ...c, mkey: c.key };
    for (const t of threadsOf(deck)) {
      if (IDS(c.done).includes(factOf(deck, t)) || IDS(doneCond(deck, t) || '').some((k) => IDS(c.done).includes(k))) continue;
      withheld++;
      assert.ok(!freePlay(c, level, start, t).test(c.done), `${c.key}: ${t.id} withheld, yet the replay ends`);
    }
  }
  assert.equal(finished, MISSIONS.cases.length);
  assert.ok(withheld >= 10, `${withheld} replay threads withheld`);
});

test('CASE FILES (U8 review): chain B takes the low gate first; the train\'s board says its blank line; the clockmaker is not met again', () => {
  const byKey = (k) => MISSIONS.cases.find((c) => c.key === k);
  // chain B, after Mission 5 left gates_n at 3: the replay clears it, and the low gate is taken first
  const cb = byKey('c_b');
  assert.ok(cb.clear.includes('gates_n'));
  const said = [];
  const f = new FactStore({ water_route: true, quest_tala: 'resolved', gate_low: true, gate_high: true, gate_mid: true, gates_n: 3 });
  for (const k of cb.clear) f.set(k, false);
  f.set('quest_tala', 'active');
  const rt = { g: { facts: f, engine: { state: () => 'PAST' }, room: 'r', hud: { say: (l, ff, done) => { said.push(...l.map((x) => x.text)); done?.(); } }, audio: {}, log: [] } };
  cb.fx.gate1(rt);
  assert.ok(f.get('gate_low') && f.get('gates_n') === 1, 'the low gate holds');
  // and even with a count an earlier run left behind, no gate up is the start (gorgeGate)
  f.set('gate_low', false);
  f.set('gates_n', 3);
  cb.fx.gate1(rt);
  assert.ok(f.get('gate_low') && f.get('gates_n') === 1);
  assert.ok(!said.some((t) => /Stone does not argue/.test(t)), 'no gate is refused');
  // the train: the board's rule comes with it
  const ct = byKey('c_train');
  assert.deepEqual(ct.rules.map((r) => r.id), ['flaps']);
  // the debt: Ezra's first meeting is Mission 6's, not the debt's
  const cd = byKey('c_debt');
  assert.ok(!cd.clear.includes('ezra_met') && cd.clear.includes('ezra_debt') && cd.clear.includes('has_spring'), cd.clear.join(' '));
});

test('U8 review: the timeline, the years, the letter, the plant in Mira\'s memory, the endings, the Finale\'s street, the pylons, the casting', () => {
  const lv = (k) => LEVELS.find((l) => l.deck.mkey === k && !l.adjusted).level;
  const mm = (k) => main.find((x) => x.key === k);
  const thr = (k, id) => threadsOf(asDeck(mm(k))).find((t) => t.id === id);
  // Mira's body did not survive the week (M8's fever, M11's ward, M20's bench), not "that afternoon"
  assert.ok(!SPOKEN.some((e) => /died that afternoon/.test(e.text)) && mm('m17').hook.lines.some((l) => /did not survive the week/.test(l.text)));
  // M14: the memorial's core and the fragments of 2196 stand in 2196 only
  assert.deepEqual(lv('m14').interactables.find((i) => i.id === 'memorialCore').kitYears, ['FUTURE']);
  assert.ok(lv('m14').interactables.filter((i) => i.kind === 'fragment').every((i) => i.when === '@FUTURE' && i.kitYears?.[0] === 'FUTURE'));
  // the kept letter is asked about in the Finale
  assert.ok(mm('m23').talks.mira23[0].lines.some((l) => l.who === 'MIRA' && l.when === 'letter == "kept"' && /my letter/.test(l.text)));
  // Mira's side of the experiment has the old man by the ring in it
  const exp = thr('m20', 'experiment');
  assert.ok(exp.echoes.some((e) => e.crew === 'witness') && exp.lines.some((l) => l.who === 'MIRA9' && /old man by the ring/.test(l.text)));
  assert.ok(lv('m20').npcs.some((n) => n.id === 'pb_experiment_2' && n.crew === 'witness' && n.hologram));
  // Ending C: Mira's own line, then the frame, then the worlds he passed through
  const f = new FactStore({ ending: 'C', trust_sera: 'accept', ev_no_owner: true, jun_line: true });
  const C = endingLines('C', f).map((l) => l.text);
  const iFrame = C.findIndex((t) => /worlds he passed through/.test(t));
  assert.ok(iFrame > C.findIndex((t) => /brother I never had/.test(t)) && iFrame < C.findIndex((t) => /AND HE CAME BACK/.test(t)), C.join(' | '));
  assert.ok(!endingLines('A', new FactStore({ ending: 'A', jun_line: true })).some((l) => /worlds he passed through/.test(l.text)));
  // the endings are staged: a shot for the text, one per added line, one for the quote and the epilogue; their people
  for (const k of ['A', 'B', 'C']) assert.equal(ENDING_SHOTS[k].length, 2 + ENDINGS[k].after.length, k);
  const m23 = lv('m23');
  for (const [id, k] of [['kai_end', 'A'], ['sera_end', 'B'], ['m23_guard', 'B'], ['mira_end', 'C']]) assert.equal(m23.npcs.find((n) => n.id === id)?.when, `ending == "${k}"`, id);
  assert.ok(m23.landmarks.windowBox && m23.landmarks.board41);
  // the Finale's streets: the Witness takes the street whichever way Kai comes (the trigger spans the avenue, pavements
  // and all); the strips beside the pit are closed; the street answers Kai only once the Witness has it
  const trig = (id) => m23.triggers.find((t) => Object.keys(t.set || {}).includes(`t_m23_${id}`));
  for (const id of ['streets', 'street']) assert.ok(trig(id).box[0] <= -50 && trig(id).box[3] >= 50, `${id}: ${trig(id).box}`);
  const solidAt = (x, z) => m23.elements.some((e) => e.solid && x > e.box[0] && x < e.box[3] && z > e.box[2] && z < e.box[5] && e.box[1] < 1 && e.box[4] > 1.5);
  assert.ok(solidAt(-45, 127) && solidAt(48, 127), 'the strips beside the pit are closed');
  assert.equal(m23.processes.find((p) => p.id === 'streetCollapse').arm, 't_m23_streets');
  // M18: no scavenger walks within 12 m of a pylon Kai must re-anchor
  const m18 = lv('m18');
  for (const sn of m18.sentinels) for (const po of ['pylon1', 'pylon2', 'pylon3']) {
    const [px, , pz] = m18.landmarks[po];
    const d = Math.min(...sn.path.slice(0, -1).map((a, i) => { const b = sn.path[i + 1]; const vx = b[0] - a[0], vz = b[1] - a[1], L = vx * vx + vz * vz || 1; const u = Math.max(0, Math.min(1, ((px - a[0]) * vx + (pz - a[1]) * vz) / L)); return Math.hypot(a[0] + u * vx - px, a[1] + u * vz - pz); }));
    assert.ok(d >= 12, `${sn.id} passes ${d.toFixed(1)} m from ${po}`);
  }
  // M16: Mara says what the photograph thread says she said
  assert.ok(mm('m16').talks.mara[0].lines.some((l) => /photograph/.test(l.text)));
  // M14's three pupils are not one boy three times; M15's crowd children never wear Tomas's look
  const pupils = lv('m14').cast.filter((c) => /^m14_pupil/.test(c.id)).map((c) => c.model);
  assert.ok(new Set(pupils).size >= 2, pupils.join());
  const tomas = lv('m15').cast.find((c) => c.id === 'tomas');
  assert.ok(!lv('m15').cast.some((c) => c.crowd && c.model === tomas.model && c.variant === tomas.variant), 'Tomas\'s look is his own');
});

// (U8 review, the bot's per-step sample: the game camera shows Kai again by its distance in the 1.2 s before the ending's
// moment, and a shot never runs it, so he stood in every shot of Ending C; the clock and the voice were over his back)
test('U8 review: the endings keep Kai off screen from the first shot to the overlay (cinema hidePlayer)', () => {
  const model = { visible: true };
  const done = [];
  const g = {
    player: { pos: new THREE.Vector3(0, 0, 0), H: { x: 0, z: 1 }, model, cinema: null, rayDistance: (o, d, m) => m },
    input: { keys: new Set(), state: {} }, facts: new FactStore(),
    hud: { say: (l, f, then) => done.push(then) }, after: (s, fn) => done.push(fn),
  };
  const c = new Cinema({ g, level: { landmarks: {} } });
  c.play({ shots: [{ cam: [0, 5, 5], look: [0, 0, 0] }], lines: [{ who: 'NARRATOR', text: 'Mira wakes.' }], hidePlayer: true }, () => {
    c.play({ shots: [{ cam: [0, 9, 9], look: [0, 0, 0] }], lines: [], total: 4.2, hidePlayer: true });
  });
  assert.ok(!model.visible && g.player.cinema, 'hidden, and the first shot taken, at once');
  model.visible = true; // (as the game camera would leave him)
  c.step(0.1);
  assert.ok(!model.visible, 'and at every step of it');
  model.visible = true;
  done.shift()(); // (the lines end: the held shot follows with no frame of the game camera between)
  assert.ok(!model.visible && g.player.cinema?.pos.y === 9, JSON.stringify(g.player.cinema));
  // an ordinary moment does not touch him
  model.visible = true;
  c.play({ shots: [{ cam: [0, 5, 5], look: [0, 0, 0] }], lines: [{ who: 'NARRATOR', text: 'Rain.' }] });
  c.step(0.1);
  assert.ok(model.visible);
  // Runtime.ending plays all three of its moments (the ending, the clock's ticks, the voice) with him hidden
  const src = fs.readFileSync('game/js/editions/lastversion/Runtime.js', 'utf8');
  const end = src.slice(src.indexOf('  ending(key) {'));
  assert.equal((end.match(/hidePlayer: true/g) || []).length, 3);
});

test('tour: a shot whose camera stands where Kai stands is his point of view: he is not drawn round the lens', () => {
  const model = { visible: true };
  const g = {
    player: { pos: new THREE.Vector3(10, 0.86, 4), H: { x: 0, z: 1 }, model, cinema: null, rayDistance: (o, d, m) => m },
    input: { keys: new Set(), state: {} }, facts: new FactStore(),
    hud: { say: () => {} }, after: () => {},
  };
  const c = new Cinema({ g, level: { landmarks: { doors: [10, 0, 4, 0] } } });
  // (Mission 8's cold open stood its camera on the doors where Kai spawns: the inside of his head filled the frame)
  c.play({ shots: [{ cam: 'doors', look: [20, 1, 4], t: 2 }, { cam: [14, 2.4, 9], look: [10, 1, 4], t: 2 }], lines: [{ who: 'NARRATOR', text: 'The doors open.' }] });
  assert.ok(!model.visible, 'hidden at once, while the camera is in him');
  c.step(1);
  assert.ok(!model.visible);
  c.step(1.2);
  c.step(0.1); // (the next shot, from across the atrium)
  assert.ok(model.visible, 'seen again from a camera away from him');
});

test('U8 review: a talk the story has not reached is not offered, a REVERSE it has not reached does not answer, and a thread done early is paid in order', () => {
  const lv = (k) => LEVELS.find((l) => l.deck.mkey === k && !l.adjusted).level;
  // the conversations the review found answering from the cold open: each node that completes its thread waits on its chain
  for (const [k, key, ancestor] of [['m14', 'sera:0', 't_m14_memorial'], ['m15', 'anja:0', 't_m15_ink'], ['m15', 'mara:0', 't_m15_fourteenth'], ['m17', 'witness:0', 't_m17_reconstruct'], ['m12', 'witness:0', 't_m12_voicemail']]) {
    assert.ok(new RegExp(`\\b${ancestor}\\b`).test(lv(k).talkGates[key] || ''), `${k}: ${key} waits on ${ancestor}`);
  }
  for (const [k, id, ancestor] of [['m22', 'clockArm', 't_m22_chain'], ['m22', 'finalSeals', 't_m22_odile'], ['m22', 'twoLogs', 't_m22_table'], ['m16', 'reel', 't_m16_memory1'], ['m17', 'shredded', 't_m17_echoes']]) {
    assert.ok(new RegExp(`\\b${ancestor}\\b`).test(lv(k).processes.find((p) => p.id === id)?.arm || ''), `${k}: ${id} answers REVERSE only after ${ancestor}`);
  }
  assert.ok(lv('m14').npcs.find((p) => p.id === 'sera').gatedTalk, 'Sera is offered as a talk only once a node of hers is open');
  // M14: Sera talked to before the memorial is read; her thread is paid (and the beacon opens) only once the story is there
  const m = MISSIONS.act3.find((x) => x.key === 'm14');
  const deck = { ...m, mkey: 'm14' };
  const f = new FactStore();
  const said = [];
  const game = { facts: f, hud: { say: (l) => said.push(...l.map((x) => x.text)) }, log: [], deckWorld: { flags: {}, npcs: [] } };
  const th = new Threads({ g: game });
  const level = { ...lv('m14'), npcs: lv('m14').npcs.map((p) => ({ ...p })) };
  th.attach(deck, level);
  const sera = { n: level.npcs.find((p) => p.id === 'sera'), crew: { id: 'sera' } };
  game.deckWorld.npcs = [sera];
  th.update();
  assert.equal(th.talkNode(sera), null, 'nothing of hers is open at the start');
  assert.ok(sera.n.silent, 'so she is not offered as a talk');
  f.set('trust_sera', 'ask');
  th.update();
  assert.ok(!f.get('t_m14_sera'), 'a thread done before the story reaches it is not paid');
  for (const id of ['parts', 'lift', 'capacitor', 'stones', 'warning', 'antenna']) f.set(`t_m14_${id}`);
  for (const k of ['ev_memorial', 'ev_fresh_flowers', 'm14_core']) f.set(k);
  th.update();
  assert.ok(f.get('t_m14_memorial') && f.get('t_m14_sera'), 'then it is, in order');
  assert.ok(!sera.n.silent, 'and she can be talked to');
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
  assert.ok(!st.some((c) => c.lines.some((l) => /war does not|walk out/.test(l.text))) && dist.shots?.length && dist.lines.length === 4 && dist.lines.every((l) => /faction == /.test(l.when)), 'every line of the district answers the choice');
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

// closing: one tap of SKIP (or Enter) skips the line being said and the shot it is in, and nothing more: never the whole
// opening, never the mission's spoken card. Mission 12's cold open (it comes before the title) is tapped through line by
// line, its shots one at a time, and the mission's card is still said, line by line, before the mission starts
test('SKIP skips one line and its shot, never the whole opening: Mission 12 tapped through, and its card is still said', () => {
  const m12 = MISSIONS.act2.find((m) => m.key === 'm12');
  const { level } = LEVELS.find((l) => l.deck.mkey === 'm12');
  const e = engine();
  for (const r of level.order) { e.setAvailable(r, level.rooms[r].states || m12.states); e.setState(r, 'PRESENT', { force: true }); }
  // the game's own HUD (its subtitles' queue and skips; no DOM behind it) and the edition's own Cinema
  const hud = Object.assign(Object.create(HUD.prototype), { subs: [], subT: 0, speakers: {}, el: { subs: { innerHTML: '' } }, card() {} });
  const said = [];
  hud.onLine = (who, l) => said.push(l.text);
  const g = { engine: e, facts: new FactStore(), campaign: { lv: true, deck: 3 }, story: { decks: MISSIONS.act2 }, hud, deckWorld: { refresh() {} },
    player: { pos: new THREE.Vector3(0, 0.86, 0), H: { x: 0, z: 1 }, model: { visible: true }, cinema: null, rayDistance: (o, d, m) => m },
    input: { keys: new Set(), state: {} }, after: () => {} };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g, def: LV, level, chapter: 'act2', chapterStart: false, whenVoices: (then) => then(), hideCard() {} });
  rt.cinema = new Cinema(rt);
  const cold = m12.coldOpen.lines.map((l) => l.text);
  const card = missionCardLines({ ...m12, mkey: 'm12' }).map((l) => l.text);
  rt.openMission(m12, 'MISSION 12');
  assert.equal(said[0], cold[0], 'the cold open plays first (Mission 12 opens before its title)');
  const shot0 = rt.cinema.active.i;
  rt.skipOpening();
  hud.update(0.02);
  assert.equal(said[1], cold[1], 'one SKIP: the next line of the cold open is said');
  assert.equal(rt.cinema.active.i, shot0 + 1, 'and the next shot is taken');
  assert.ok(rt.opening && rt.cinema.active, 'the opening goes on');
  // tap through the rest of the cold open: one line a tap; then the card's first line, then its second
  for (let i = 2; i < cold.length; i++) { rt.skipOpening(); hud.update(0.02); assert.equal(said[i], cold[i], `tap ${i}: line ${i} of the cold open`); }
  rt.skipOpening();
  hud.update(0.02);
  assert.equal(said[cold.length], card[0], 'past the cold open\'s last line, the mission\'s card is said: ' + card[0]);
  assert.ok(rt.opening, 'still in the opening');
  rt.skipOpening();
  hud.update(0.02);
  assert.equal(said[cold.length + 1], card[1], 'one tap on the card skips its first line only: its logline is said');
  // and the opening ends with its last line, not before
  let taps = 0;
  while (rt.opening && taps < 20) { rt.skipOpening(); hud.update(0.02); taps++; }
  assert.ok(!rt.opening && !rt.cinema.active, 'the opening ends after its last line');
  assert.deepEqual(said.slice(0, cold.length + card.length), [...cold, ...card], 'every line of the cold open and the card was said, in order');
  // a moment with no lines (a timed, held shot) ends on a tap at its last shot
  rt.cinema.play({ shots: [{ cam: [4, 3, 4], look: [0, 1, 0], t: 3 }, { cam: [6, 3, 4], look: [0, 1, 0], t: 3 }], lines: [], total: 6 });
  rt.cinema.skip();
  assert.ok(rt.cinema.active && rt.cinema.active.i === 1, 'a tap on a timed moment takes its next shot');
  rt.cinema.skip();
  assert.ok(!rt.cinema.active, 'and at its last shot, ends it');
  // the SKIP button and Enter say the same: one line (the code that handles them)
  const src = fs.readFileSync('game/js/editions/lastversion/cinema.js', 'utf8');
  assert.ok(/SKIP_KEYS = \[[^\]]*'Enter'/.test(src) && /skipBtn\.onclick = \(e\) => \{\s*e\.stopPropagation\(\);\s*this\.skip\(\);/.test(src), 'Enter and the button skip a line');
});

// tour: a bark still being said in the place left behind is not said over the next mission's card; a conversation is
test('tour: a mission opens without the last place\'s bark over its card (a conversation with an end still runs out)', () => {
  const m12 = MISSIONS.act2.find((m) => m.key === 'm12');
  const { level } = LEVELS.find((l) => l.deck.mkey === 'm12');
  const e = engine();
  for (const r of level.order) { e.setAvailable(r, level.rooms[r].states || m12.states); e.setState(r, 'PRESENT', { force: true }); }
  const open = (subs) => {
    const hud = { card() {}, subs, skipped: 0, get talking() { return this.subs.length > 0; }, skipAll() { this.skipped++; this.subs = this.subs.filter((x) => x.done); } };
    const game = { engine: e, facts: new FactStore(), campaign: { lv: true, deck: 3 }, story: { decks: MISSIONS.act2 }, hud, deckWorld: { refresh() {} } };
    const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV, level, chapter: 'act2', chapterStart: false,
      whenVoices: (then) => then(), hideCard() {}, cinema: { play: (o, done) => done() } });
    rt.openMission(m12, 'MISSION 12');
    return hud;
  };
  const bark = open([{ who: 'CROWD_M', text: 'We cook at the first fire. Everyone. Nobody eats alone here.' }]);
  assert.ok(bark.skipped === 1 && !bark.subs.length, 'the bark is dropped');
  const talk = open([{ who: 'KAI', text: 'One more line.' }, { done() {} }]);
  assert.ok(talk.skipped === 0 && talk.subs.length === 2, 'a conversation waiting on its end is left to run out');
});

test('tour: a staged moment cuts a line said in passing and holds the crowd\'s off while it plays; a conversation is not cut', () => {
  const COMMUTER = 'Third clock this morning. I stopped checking.';
  const hud = { subT: 2, cur: { who: 'CROWD_M', text: COMMUTER }, subs: [{ who: 'CROWD_F', text: COMMUTER }], skipped: 0, said: [],
    get talking() { return this.subT > 0 || this.subs.length > 0; }, skipSub() { this.skipped++; this.subT = 0.01; }, say(lines) { this.said.push(...lines); } };
  const g = { player: { pos: new THREE.Vector3(0, 0.86, 0), H: { x: 0, z: 1 }, model: { visible: true }, cinema: null, rayDistance: (o, d, m) => m },
    input: { keys: new Set(), state: {} }, facts: new FactStore(), hud, after: () => {}, time: 40, deckWorld: { lastBarkT: 0 } };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g, level: { landmarks: {}, npcs: [{ id: 'crowd_1', crowd: true, barks: [COMMUTER] }] } });
  const c = new Cinema(rt);
  c.play({ shots: [{ cam: [4, 3, 4], look: [0, 1, 0], t: 3 }], lines: [{ who: 'NARRATOR', text: 'All the clocks stop.' }] });
  assert.ok(hud.skipped === 1 && !hud.subs.length && hud.said[0].text === 'All the clocks stop.', 'the bark is cut, the narration is next');
  g.time = 45;
  c.step(0.5);
  assert.equal(g.deckWorld.lastBarkT, 45, 'no new bark starts while the moment plays');
  const talk = { ...hud, subT: 2, cur: { who: 'KAI', text: 'Twelve minutes out.' }, subs: [{ who: 'ROOK', text: 'Just come in.' }, { done() {} }], skipped: 0 };
  Object.defineProperty(talk, 'talking', { get() { return this.subT > 0 || this.subs.length > 0; } });
  rt.g = { ...g, hud: talk };
  rt.hushBarks();
  assert.ok(talk.skipped === 0 && talk.subs.length === 2, 'a conversation runs out');
});

// tour: 'A woman in the crowd at the far end turns. For one second she has Mira's face' was a yellow dot thirty metres off,
// her back turned (the chase had turned her to her path), against a canopy post
test('tour: the woman with Mira\'s face is seen: she looks back at Kai while she waits, clear of the posts, distant and in rain', () => {
  const { level } = LEVELS.find((l) => l.deck.mkey === 'm01');
  const mira = level.npcs.find((n) => n.id === 'mira');
  const [x, y, z] = mira.pos;
  const posts = level.elements.filter((e) => e.solid && e.box && e.box[1] < y + 1.7 && e.box[4] > y + 0.3
    && Math.hypot(Math.max(e.box[0] - x, 0, x - e.box[3]), Math.max(e.box[2] - z, 0, z - e.box[5])) < 1.2);
  assert.deepEqual(posts.map((e) => e.box), [], 'nothing solid within 1.2 m of her');
  const shots = m01Shots({ level }, 'face');
  // (OVERHAUL §9.5: the glimpse stays distant and in rain; Dr. Lin wears this face in Mission 2, so a close-up here would
  // give away Mission 11's reveal. The closing engineer put back the distance a tour had closed to a close-up)
  const near = shots[shots.length - 1];
  for (const p of [near.cam, near.to]) {
    const d = Math.hypot(p[0] - x, p[2] - z);
    assert.ok(d > 8 && d < 16 && p[1] > y + 1.2 && p[1] < y + 2.2, `the last shot keeps its distance, at eye height: ${d.toFixed(1)} m`);
  }
  assert.ok(Math.abs(near.look[0] - x) < 0.1 && Math.abs(near.look[2] - z) < 0.1, 'and looks at her');
  // waiting (Kai beyond the leash), she turns from her path to look back at him; walking, the path has her again
  const model = { visible: true, position: new THREE.Vector3(x, y, z), rotation: { y: Math.PI }, userData: { lookAt(v) { this.at = v; } } };
  const npc = { n: { id: 'mira', chase: { path: [mira.pos, [x, y, z - 20]], leash: 14, ahead: 10, speed: 1.7, fact: 'mira_gone', thread: 'chase' }, path: [[x, z, y], [x, z - 20, y]] }, model, wp: 0 };
  const g = { player: { pos: new THREE.Vector3(x + 3, y + 0.86, z + 30) }, deckWorld: { npcs: [npc] }, facts: new FactStore() };
  const th = Object.assign(Object.create(Threads.prototype), { rt: { g }, byId: {} });
  for (let i = 0; i < 90; i++) th.chase(1 / 30);
  const want = Math.atan2(3, 30);
  assert.ok(Math.abs(Math.atan2(Math.sin(model.rotation.y - want), Math.cos(model.rotation.y - want))) < 0.05, `she faces Kai: ${model.rotation.y.toFixed(2)}`);
  assert.ok(npc.n.speed < 1e-3 && model.userData.at?.z > z + 20, 'stands, and looks at him');
  g.player.pos.set(x, y + 0.86, z + 8);
  th.chase(1 / 30);
  assert.ok(npc.n.speed > 1 && npc.n.chase.face === null, 'Kai near: she walks on, her path turning her');
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
  assert.ok(m('m21').processes.filter((p) => p.mode === 'rewind').every((p) => p.stuck === 6 && /_q[01]s\d$/.test(p.target)));
  // (U8 review) the command structure read before the arena (the wall, the orders, the Director's desk; what he is
  // building), and an elite at the cells' door whose rewind must be run forwards
  assert.deepEqual([thr('m21', 'plan').after, thr('m21', 'cellDoor').after, thr('m21', 'arena').after], [['orders'], ['plan'], ['cellDoor']]);
  assert.ok(m('m21').deductions.plan.answers.find((a) => a.correct).needs.includes('ev_requisition') && m('m21').processes.some((p) => p.id === 'eliteC' && p.target === 'm21_spire_q1s0'));
  assert.equal(typeof m('m21').onEcho, 'function');
  assert.ok(['arenaGap1', 'arenaGap2'].every((id) => m('m21').processes.find((p) => p.id === id)?.when === 'arena_fallen'));
  assert.ok(thr('m21', 'arena').set.arena_fallen && thr('m21', 'prisoners').when === 'prisoners_held');
  // M22: the seals come out in reverse causal order; the logs are evidence, the memory cards refuse
  assert.deepEqual(m('m22').processes.find((p) => p.id === 'finalSeals').bolts, ['RIVER', 'WALL', 'GATE', 'MACHINE']);
  assert.ok(m('m22').processes.find((p) => p.id === 'clockArm').beat, 'the arm answers on its counted beat');
  assert.equal(m('m22').processes.find((p) => p.id === 'memoryCards').refuse, 'A MEMORY');
  const ev = m('m22').deductions.evidence.answers.find((a) => a.correct);
  assert.ok(/inv_twoLogs_done/.test(ev.needs) && ev.lines.some((l) => l.who === 'WITNESS' && l.text === '…No. I was a second early.'));
  assert.equal(lexicon('RING: 16:02:00. CONSOLE BUTTON: 16:02:01.'), 'Ring: six-teen oh two exactly. Console Button: six-teen oh two and one second.');
});

test('the Finale: two holds at once, Mira asks, the three endings with what they add, the epilogue and the voice in every speaker', () => {
  const m23 = main.find((x) => x.key === 'm23');
  // (closing: and three storms on their ends, each a world of hers run forwards once, and the ring's arm she counts with Kai)
  assert.deepEqual(m23.processes.map((p) => p.id).sort(), ['pillarA', 'pillarB', 'pillarC', 'ringArm', 'settlementBridge', 'streetCollapse'], 'the street he holds, the bridge Kai holds');
  assert.ok(m23.processes.filter((p) => /^pillar/.test(p.id)).every((p) => p.kind === 'recording' && p.clip.who === 'MIRA'), 'her worlds, in her voice');
  const arm = m23.processes.find((p) => p.id === 'ringArm');
  assert.ok(arm.kind === 'mechanism' && arm.beat?.period === 3 && arm.settle === 'settled', 'the ring\'s second, counted on its beat');
  // (the choice shows itself: each ending's own lines, Mira's answer among them, play before the ending's sequence)
  const end = m23.scenes.ending.choices;
  assert.ok(end.length === 3 && end.every((c) => c.ending && c.set.ending === c.ending && c.lines.some((l) => l.who === 'MIRA')), 'each ending: Mira answers it');
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

// --- FREE ROAM (roam.js; the closing pass on the player's point 2, "make it open world") ---------------------------------
// After a mission is done its place can be travelled to (TRAVEL on the case board, the map, the CASE FILES), in any year
// opened there, and walked with no story gates; the story keeps its order and waits where it was left.
const roamGame = () => {
  const game = { engine: engine(), facts: new FactStore(), story: null, log: [] };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory('roam');
  return { game, rt };
};
// the facts a mission's side stories own: what playing them sets (cleared to have them still to play on a trip)
const sideOwn = (m) => {
  const deck = { ...m, mkey: m.key }, out = new Set();
  for (const s of sidesOf(deck)) {
    out.add(`side_${m.key}_${s.id}`);
    for (const t of s.threads || []) {
      for (const k of [factOf(deck, t), `${factOf(deck, t)}_paid`, ...Object.keys(t.set || {}), ...(t.ev ? [`ev_${t.ev}`] : []), ...(t.of || []), ...IDS(doneCond(deck, t) || '')]) out.add(k);
    }
    for (const k of IDS(s.done)) out.add(k);
  }
  const r = ROAM[roamIndex(m.key)];
  for (const n of r.roamNodes) for (const k of [...Object.keys(n.set || {}), ...(n.choices || []).flatMap((c) => Object.keys(c.set || {}))]) out.add(k);
  return out;
};

test('free roam: a roam deck for every story mission, beside the story (never in MISSIONS); nothing in it tells or ends the story', () => {
  assert.equal(ROAM.length, main.length);
  ROAM.forEach((r, i) => {
    const m = main[i];
    assert.equal(r.key, m.key);
    assert.ok(r.roam && r.chapter === 'roam' && r.voiceGroup === m.chapter && r.origin === m.key, m.key);
    assert.ok(r.place === m.place && r.wing === m.wing && r.fragments === m.fragments && r.overlay === m.overlay && r.talks === m.talks && r.processes === m.processes, `${m.key}: its place, people, fragments and processes`);
    for (const k of ['coldOpen', 'hook', 'outro', 'intro', 'resumes', 'step', 'loop', 'onLoop', 'watch', 'done']) assert.ok(!(k in r), `${m.key}: no ${k}`);
    assert.ok(r.autoExit === null && r.unstable === false && r.drones.every((n) => n === 0), `${m.key}: no way on, no drain, nobody watching`);
    assert.equal(r.quarters.length, m.quarters.length);
    r.quarters.forEach((q, qi) => {
      assert.deepEqual(q.threads, [], `${m.key}: no main thread to play`);
      assert.deepEqual(q.inert.map((t) => t.id), m.quarters[qi].threads.map((t) => t.id), `${m.key}: the story's threads stay as props`);
      assert.deepEqual(q.sides.map((s) => s.id), (m.quarters[qi].sides || []).map((s) => s.id), `${m.key}: its side stories`);
      const own = new Set(q.sides.flatMap((s) => s.threads.map((t) => t.id)));
      for (const s of q.sides) for (const t of s.threads) assert.ok((t.after || []).every((a) => own.has(a)), `${m.key}: ${t.id} waits only on its own side story`);
    });
    for (const x of [...r.rules, ...r.zones]) assert.ok(Object.keys(x.set || {}).some((k) => r.roamCore.has(k)), `${m.key}: a rule or zone kept only for a side story`);
  });
  assert.ok(!Object.values(MISSIONS).flat().some((m) => m.roam), 'no roam deck is walked as the story');
  assert.ok(CHAPTERS.roam && !ORDER.includes('roam'), 'FREE ROAM is a chapter of saves only, not of the chapter list');
});

test('free roam: TRAVEL lists every mission done, in story order, in the years opened there (one before the Chronolith)', () => {
  assert.deepEqual(reachedPlaces(new FactStore()), []);
  const f = new FactStore({ m01_done: true, m02_done: true, m03_done: true, m06_done: true });
  const list = reachedPlaces(f);
  assert.deepEqual(list.map((e) => e.key), ['m01', 'm02', 'm03', 'm06']);
  const by = Object.fromEntries(list.map((e) => [e.key, e]));
  assert.deepEqual(by.m01.years, ['PRESENT'], 'Rain City: the Zero Second came before the Chronolith');
  assert.deepEqual(by.m02.years, ['PRESENT']);
  assert.deepEqual(by.m03.years, ['PRESENT', 'PAST', 'FUTURE'], 'Mission 3 gives Kai the Chronolith');
  assert.deepEqual(by.m06.years, main.find((m) => m.key === 'm06').states);
  assert.ok(by.m02.placeName === 'HELIX · WEST WING' && by.m03.placeName === 'HELIX · EAST WING' && by.m06.placeName === 'OLD TOWN');
  assert.equal(placeName(main.find((m) => m.key === 'm20')), 'MIRA\'S MEMORY');
  // what is still there: side stories open, fragments found (the case log keeps every one read since v2.0)
  assert.ok(by.m06.sides === 2 && by.m06.open === 2 && by.m06.fragments === 2 && by.m06.found === 0, JSON.stringify(by.m06));
  f.set('ev_rook_gauge', true);
  const text = main.find((m) => m.key === 'm06').fragments[0][1];
  const again = reachedPlaces(f, [`<b>Memory fragment.</b> ${text}`]).find((e) => e.key === 'm06');
  assert.ok(again.open === 1 && again.found === 1, JSON.stringify(again));
  // the Finale's road once an ending is reached; for a mission, its own end
  assert.ok(!reachedPlaces(new FactStore({ m22_done: true })).some((e) => e.key === 'm23'));
  assert.deepEqual(reachedPlaces(new FactStore({ m22_done: true, ending: 'C' })).map((e) => e.key), ['m22', 'm23']);
  for (const m of main) assert.deepEqual(roamYears(m), m.n < 3 ? [m.states.includes(m.home) ? m.home : 'PRESENT'] : m.states, m.key);
});

test('free roam: every place on a trip, in every year opened there: no way on, no gate, nobody watching, the story\'s threads only props', () => {
  const { game, rt } = roamGame();
  let levels = 0;
  ROAM.forEach((r, di) => {
    const m = main[di];
    const years = roamYears(m);
    for (const y of years) {
      game.engine = engine();
      const c = { lv: true, chapter: 'roam', deck: di, sector: 0, quarter: 0, flags: {}, roam: { key: r.key, year: y, years, fresh: true } };
      const lv = rt.buildLevel(c);
      levels++;
      assert.ok(!lv.exit && !lv.elements.some((e) => /^gate_/.test(e.id || '')) && !lv.map?.gate, `${m.key} ${y}: no way on and no gate`);
      assert.equal(lv.sentinels.length, 0, `${m.key} ${y}: nobody watching`);
      assert.equal(c.roam.fresh, false);
      assert.equal(game.engine.state(lv.outdoorRoom), y, `${m.key}: arrives in ${y}`);
      for (const id of lv.order) {
        const av = game.engine.statesOf(id);
        assert.ok(av.length && (av.every((s) => years.includes(s)) || av.length === 1), `${m.key} ${id}: only the years opened there (${av})`);
      }
      // the story's own threads: their props stand (r 0), nothing of them answers; the side stories' threads are the trip's
      const inert = new Set();
      for (const q of r.quarters) for (const t of q.inert) {
        for (const sp of t.spots || []) inert.add(sp.id);
        if (t.spot) inert.add(t.scene || t.id);
        for (const k of ['residue', 'deduce', 'playback']) inert.add(`${k}_${t.id}`);
      }
      for (const it of lv.interactables) if (inert.has(it.id)) assert.equal(it.r, 0, `${m.key}: ${it.id} is a prop on a trip`);
      assert.ok(rt.threads.list.every((t) => t.side), `${m.key}: no main thread on a trip`);
      assert.ok(!lv.triggers.some((tr) => Object.keys(tr.set || {}).some((k) => k.startsWith(`t_${m.key}_`) && !rt.threads.byId[k.slice(`t_${m.key}_`.length)])), `${m.key}: no trigger of the story's`);
    }
  });
  assert.ok(levels >= 55, `${levels} places and years built`);
});

test('free roam: a free player on a trip plays the side stories the place still has, and changes nothing the story decided', () => {
  const { game, rt } = roamGame();
  let finishedSides = 0, offered = 0;
  for (const ch of ORDER) {
    const f0 = new FactStore();
    for (const c of ORDER.slice(0, ORDER.indexOf(ch) + 1)) for (const k of PRIMES[c] || []) (Array.isArray(k) ? f0.set(k[0], k[1]) : f0.set(k));
    f0.set('faction', 'neutral');
    for (const m of MISSIONS[ch]) {
      const { level } = LEVELS.find((l) => l.deck.mkey === m.key && !l.adjusted);
      // the mission played by a player who does everything it offers: its end, with the side stories it could finish
      const end = freePlay(m, level, f0.facts);
      const deck = { ...m, mkey: m.key };
      const could = sidesOf(deck).filter((s) => s.done && end.test(s.done));
      // the same end with the side stories still to play: the trip
      const own = sideOwn(m);
      const start = Object.fromEntries(Object.entries(end.facts).filter(([k]) => !own.has(k)));
      start[`${m.key}_done`] = true;
      const di = roamIndex(m.key), r = ROAM[di];
      game.engine = engine();
      game.facts = new FactStore({ ...start });
      const rl = rt.buildLevel({ lv: true, chapter: 'roam', deck: di, sector: 0, quarter: 0, flags: {}, roam: { key: m.key, year: roamYears(m)[0], years: roamYears(m), fresh: true } });
      const trip = freePlay(r, rl, start, null, { guard: (x) => roamFree(r, x) });
      for (const s of could) {
        offered++;
        if (trip.test(s.done)) finishedSides++;
        else assert.fail(`${m.key}: side story ${s.id} could be finished in the mission, not on a trip`);
      }
      // nothing the story decided changes: whatever the trip changed is a side story's, a fragment's or REVERSE's
      for (const [k, v] of Object.entries(trip.facts)) {
        if (start[k] === v || (start[k] === undefined && v === false)) continue;
        assert.ok(r.roamCore.has(k) || own.has(k) || /^(inv_|rev_|fr_|stuck_)/.test(k), `${m.key}: the trip changed ${k} (${JSON.stringify(start[k])} -> ${JSON.stringify(v)})`);
      }
      const paid = Object.keys(trip.facts).filter((k) => k.startsWith(`t_${m.key}_`) && !start[k] && trip.facts[k] && !r.roamCore.has(k.replace(/_paid$/, '')));
      assert.deepEqual(paid, [], `${m.key}: no story thread is paid on a trip`);
    }
  }
  console.log(`  (free roam: ${finishedSides} of ${offered} side stories a player can finish in their mission finished on trips)`);
  assert.ok(offered >= 25 && finishedSides === offered, `${finishedSides} of ${offered} side stories finished on trips`);
});

test('free roam: a story node on a trip is said and changes nothing; a side story\'s acts; read fragments and past rules are not laid again', () => {
  const { game, rt } = roamGame();
  const m06 = main.find((m) => m.key === 'm06'), r06 = ROAM[roamIndex('m06')];
  assert.equal(roamFree(r06, m06.scenes.arm), false, 'the arm\'s count is the story\'s');
  assert.equal(roamFree(r06, m06.scenes.spring), true, 'the spring is the debt\'s');
  assert.equal(roamFree(r06, m06.talks.clockmaker.find((n) => /has_spring/.test(n.when || ''))), true, 'the debt\'s conversation');
  assert.equal(roamFree(r06, m06.talks.clockmaker[0]), false, 'the first meeting is not made again');
  assert.equal(roamFree(r06, { lines: [{ who: 'KAI', text: 'x' }] }), true, 'lines alone');
  assert.equal(roamFree(m06, m06.scenes.arm), true, 'in the story, every node acts');
  // played through Runtime.playNode
  const said = [];
  game.campaign = { lv: true, chapter: 'roam', deck: roamIndex('m06'), sector: 0, flags: {}, roam: { key: 'm06', year: 'FUTURE', years: ['PRESENT', 'PAST', 'FUTURE'] } };
  game.hud = { say: (ls, f, done) => { said.push(...ls.map((l) => l.text)); done?.(); }, toast() {} };
  game.deckWorld = { flags: {} };
  rt.playNode(m06.scenes.arm);
  assert.ok(said.length >= 2 && !game.facts.get('ev_arm_count') && !game.log.length, 'said, not counted again');
  rt.playNode(m06.scenes.spring);
  assert.ok(game.facts.get('has_spring'), 'the spring is taken');
  // a trip's level: fragments read before (the case log, or fr_) are laid as read; a rule that has happened does not again
  game.facts = new FactStore({ inv_departureBoard_done: true });
  game.engine = engine();
  game.log = [`<b>Memory fragment.</b> ${m06.fragments[0][0]}`];
  const c = { lv: true, chapter: 'roam', deck: roamIndex('m06'), sector: 0, flags: {}, roam: { key: 'm06', year: 'PAST', years: ['PRESENT', 'PAST', 'FUTURE'], fresh: true } };
  const lv = rt.buildLevel(c);
  const fr = lv.interactables.filter((i) => i.kind === 'fragment');
  assert.ok(fr.length === 2 && c.flags[`done_${fr[0].id}`] && !c.flags[`done_${fr[1].id}`], 'the first read, the second still to find');
  game.facts.set(`fr_${fr[1].id}`, true);
  const c2 = { ...c, flags: {}, roam: { ...c.roam, fresh: false } };
  game.engine.setState(lv.outdoorRoom, 'FUTURE', { force: true });
  const lv2 = rt.buildLevel(c2);
  assert.ok(c2.flags[`done_${fr[1].id}`], 'a fragment read on a trip stays read');
  assert.equal(game.engine.state(lv2.outdoorRoom), 'FUTURE', 'a trip\'s save keeps the year switched to');
  const ci = roamIndex('m15');
  const c3 = { lv: true, chapter: 'roam', deck: ci, sector: 0, flags: {}, roam: { key: 'm15', year: 'FUTURE', years: ['FUTURE', 'PAST', 'PRESENT'], fresh: true } };
  rt.buildLevel(c3);
  assert.ok(c3.flags.rule_flaps, 'the board\'s flaps have run forwards already: the rule is not said again');
});

test('free roam: saves: a trip saves in the story\'s slot with the story inside it; a trip from a trip keeps it; BACK puts it back with what the trip found', () => {
  const eng = engine();
  eng.setAvailable('m16_sinkhole', ['FUTURE', 'PAST', 'PRESENT']);
  eng.setState('m16_sinkhole', 'PAST', { force: true });
  const story = {
    v: '2.0', edition: 'lastversion', mode: 'deck', facts: { facts: { m06_done: true, m07_done: true, lv_chapter: 'act3', faction: 'neutral' }, fired: [] }, engine: eng.serialize(), log: ['one'], timeline: [], playTime: 100,
    campaign: { lv: true, chapter: 'act3', deck: 2, sector: 0, quarter: 1, flags: { rule_x: true }, visited: [], room: 'm16_sinkhole', pos: [1, 2, 3, 0], held: null, inv: { cap: 10, charge: 4 }, lvFormat: SAVE_FORMAT, stability: 1 },
    meta: { where: 'THE LAST VERSION · THE MUSEUM OF FAILED WORLDS', chapter: 'Mission 16 · THE RIM', run: 'act3', savedAt: 1 },
  };
  const { data, meta } = roamSave(story, story.meta, { key: 'm06', year: 'PAST', format: SAVE_FORMAT });
  const c = data.campaign;
  assert.ok(c.chapter === 'roam' && c.deck === roamIndex('m06') && c.roam.year === 'PAST' && c.roam.fresh && c.lvFormat === SAVE_FORMAT && !c.pos && c.quarter === 0);
  assert.deepEqual(c.roam.years, main.find((m) => m.key === 'm06').states);
  assert.deepEqual(c.roam.back.campaign, story.campaign, 'the story to come back to, as it stood');
  assert.deepEqual(c.roam.back.engine, story.engine);
  for (const k of ['facts', 'log', 'playTime', 'meta', 'timeline']) assert.ok(!(k in c.roam.back), `the story kept without its ${k} (the trip carries them on)`);
  assert.deepEqual(data.facts, story.facts);
  assert.ok(meta.where === 'FREE ROAM · OLD TOWN' && meta.run === 'act3' && /2026/.test(meta.chapter) && /THE MUSEUM OF FAILED WORLDS/.test(meta.chapter), JSON.stringify(meta));
  assert.ok(!('meta' in data), 'the meta is written beside the data');
  assert.equal(roamSave(story, story.meta, { key: 'm01', year: 'PAST' }).data.campaign.roam.year, 'PRESENT', 'a year not opened there: the first that is');
  assert.throws(() => roamSave(story, story.meta, { key: 'nope' }));
  // through storage, and on: a trip from a trip keeps the story
  const stored = JSON.parse(JSON.stringify(data));
  stored.facts.facts = { ...stored.facts.facts, fr_frag_x: true, side_m06_debt: true, ezra_debt: 'release', lv_roam: true, lv_chapter: 'roam' };
  stored.log = ['one', 'two'];
  stored.playTime = 160;
  stored.campaign.inv = { cap: 10, charge: 9 };
  const on = roamSave(stored, meta, { key: 'm07', year: 'FUTURE' });
  assert.deepEqual(on.data.campaign.roam.back, stored.campaign.roam.back);
  assert.deepEqual(on.data.campaign.roam.meta, stored.campaign.roam.meta);
  assert.equal(on.meta.run, 'act3');
  // BACK TO THE STORY
  const back = storyFromRoam(on.data);
  assert.deepEqual(back.data.campaign, { ...story.campaign, inv: { cap: 10, charge: 9 } }, 'the same mission, checkpoint, quarter and flags');
  assert.deepEqual(back.data.engine, story.engine, 'the rooms in the years they were in');
  assert.ok(back.data.facts.facts.fr_frag_x && back.data.facts.facts.side_m06_debt && back.data.facts.facts.ezra_debt === 'release', 'what the trip found stays found');
  for (const k of ROAM_ONLY) assert.ok(!(k in back.data.facts.facts));
  assert.equal(back.data.facts.facts.lv_chapter, 'act3');
  assert.ok(back.data.log.join() === 'one,two' && back.data.playTime === 160);
  assert.deepEqual(back.meta, { where: story.meta.where, chapter: story.meta.chapter, run: 'act3' });
  assert.throws(() => storyFromRoam(story), 'a story save is not a trip');
  assert.ok(!finished(back.data.facts.facts) && finished({ ending: 'B' }));
  // a load: the format leaves a trip as it is; REVERSE is what its story has earned
  const camp = JSON.parse(JSON.stringify(on.data.campaign));
  migrateSave(engine(), camp, LV, new FactStore(on.data.facts.facts));
  assert.ok(camp.chapter === 'roam' && !camp.restarted && camp.lvFormat === SAVE_FORMAT && camp.roam.back);
  assert.equal(reverseEarned(camp), reverseEarned(story.campaign));
  assert.equal(reverseEarned(camp), 10);
});

// the full browser bot found it: Mission 14's trust_sera is a word ('accept', 'deny', 'ask'), and the case board's PEOPLE
// read it as a number (TRUST['accept'].toUpperCase() threw), so from Mission 14 on the case board, and TRAVEL on it, did
// not open. The board is rendered here after every mission of a campaign a free player walks, with everyone met, in the
// story and on a trip
test('the case board opens after every mission, with everyone met (TRAVEL on it), in the story and on a trip', () => {
  const f = new FactStore();
  for (const k of PRIMES.prologue) (Array.isArray(k) ? f.set(k[0], k[1]) : f.set(k));
  f.set('faction', 'neutral');
  for (const n of Object.values(NPCS)) f.set(`met_${n.id}`, true);
  const log = [];
  let boards = 0;
  for (const ch of ORDER) {
    const game = { engine: engine(), facts: f, story: null, log, run: ch, voice: null };
    const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
    game.story = rt.makeStory(ch);
    MISSIONS[ch].forEach((m, d) => {
      game.campaign = { lv: true, chapter: ch, deck: d, sector: 0, quarter: 0, flags: {} };
      game.deckWorld = { flags: {} };
      rt.chapter = ch;
      rt.level = rt.buildLevel(game.campaign);
      const el = { innerHTML: '', querySelectorAll: () => [], querySelector: () => null };
      rt.renderJournal(game, el);
      boards++;
      assert.ok(/<h3 id="lvTravel">TRAVEL<\/h3>/.test(el.innerHTML) && /PEOPLE/.test(el.innerHTML), `${m.key}: the case board, with TRAVEL`);
      if (d > 0 || ch !== 'prologue') assert.ok(el.innerHTML.includes('data-travel="m01"'), `${m.key}: Rain City is a trip`);
      // the mission played by a player who does everything it offers (its first choice each time), then done
      const { level } = LEVELS.find((l) => l.deck.mkey === m.key && !l.adjusted);
      const end = freePlay(m, level, f.facts);
      for (const [k, v] of Object.entries(end.facts)) f.set(k, v);
      f.set(`${m.key}_done`, true);
    });
  }
  assert.equal(typeof f.get('trust_sera'), 'string', 'the campaign walked sets Sera\'s standing as a word');
  // and on a trip, at the end of it all
  const game = { engine: engine(), facts: f, story: null, log, run: 'finale', voice: null };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory('roam');
  const di = roamIndex('m14');
  game.campaign = { lv: true, chapter: 'roam', deck: di, sector: 0, quarter: 0, flags: {}, roam: { key: 'm14', year: 'FUTURE', years: ['FUTURE', 'PRESENT', 'PAST'], fresh: true, back: { campaign: { chapter: 'finale', deck: 0 } }, meta: { where: 'THE LAST VERSION · AFTERZERO', run: 'finale' } } };
  game.deckWorld = { flags: {} };
  rt.chapter = 'roam';
  rt.level = rt.buildLevel(game.campaign);
  const el = { innerHTML: '', querySelectorAll: () => [], querySelector: () => null };
  rt.renderJournal(game, el);
  assert.ok(/FREE ROAM &middot; DOWNTOWN/.test(el.innerHTML) && /id="lvBack"/.test(el.innerHTML) && /class="here"/.test(el.innerHTML), 'on a trip: where it is, BACK TO THE STORY, and the place marked on TRAVEL');
  assert.ok(boards === main.length);
});
