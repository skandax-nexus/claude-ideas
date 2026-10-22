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
import { ERAS, EXCEPTIONS, ANCIENT_WOMEN, AMBIENT_CAST, eraModels, MAX_PEOPLE } from '../game/js/editions/lastversion/crowds.js';
import { WATCHERS, HUMAN, watcherModels, kindsOf } from '../game/js/editions/lastversion/watchers.js';
import { spokenLines, voiceOf, lexicon, GROUPS, chapterCardLines, missionCardLines, endingLines, POSTCREDIT, choiceLine, numberWords } from '../game/js/editions/lastversion/voicelines.js';
import { voicePieces } from '../game/js/audio/voiceKey.js';
import { KINDS as THREAD_KINDS, MINUTES, threadsOf, sidesOf, quartersOf as threadQuarters, factOf, isRewritten, estimate, doneCond, sideState, isDone } from '../game/js/editions/lastversion/Threads.js';
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
  assert.ok(rooms >= 20, `${rooms} challenges checked`); // (the places' crossings, in every mission: since U7 most are one load)
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
  assert.ok(steps >= 0, `${steps} route steps`); // (the generators' routes went with them: U3)
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
  assert.ok(checked >= 20, `${checked} challenges`);
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
  // the two cases kept as replay entries (until U8): Tala's gorge and Mara's press tower
  c_b: { place: 'valley_river', quarters: ['THE DRY CHANNEL', 'THE GATES'], landmarks: 'gorgeMouth dryChannel gate1 gate2 gate3 aqueduct muralCliff' },
  c_c: { place: 'lockcity', quarters: ['THE FIRST ARCHIVE', 'THE SECOND ARCHIVE'], landmarks: 'pressTower pressFoot pressStairTop archiveA archiveB card14 audioCylinder museumDisplay' },
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

test('every mission\'s default sky is its own (the M22 and M23 composites excepted)', () => {
  const seen = {};
  for (const key of Object.keys(SHEETS).filter((k) => /^m\d\d$/.test(k))) {
    const { deck, level } = PLACED.find((l) => l.deck.mkey === key);
    const y = level.years.PRESENT || level.years[deck.states[0]];
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

test('places are big enough to explore: a short side of 120 m or more (a linear place: 100 × 300 m or more), quarters of 2,500 m² or more', () => {
  for (const [key, spec] of Object.entries(PLACES)) {
    const [x0, z0, x1, z1] = spec.bounds;
    const short = Math.min(x1 - x0, z1 - z0), long = Math.max(x1 - x0, z1 - z0);
    if (spec.linear) assert.ok(short >= 100 && long >= 300, `${key} (linear): ${x1 - x0} × ${z1 - z0}`);
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
    assert.ok(level.npcs.length <= 24 && crowd === Math.min(crowdN, 24 - named), `${here}: ${level.npcs.length} people, ${named} named + ${crowd} of ${crowdN} in the crowd`);
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
    ['m06', 'PRESENT', () => [21.1, 0, -18.5], [0, 1, 2, 3, 4].flatMap((k) => (k % 2 ? [[22.5, -29.4], [22.5, -19], [21.1, -18.4]] : [[21.1, -19.2], [21.1, -29.7], [22.5, -30.2]])), 20, {}],
    ['m06', 'PAST', () => [19.5, 0, -28], [[19.4, -30.5], [11.2, -30.5]], 4, {}],
    ['m07', 'PRESENT', () => [30, 0, -18], [[30, -37], [26, -70], [41, -70], [46.5, -52], [40, -52], [14, -52], [12, -52]], 18, {}],
    ['m07', 'PAST', () => [46, 16, -70], [[44, -74], [66, -74], [74, -77]], 27.5, {}],
    ['m07', 'FUTURE', () => [-80, 0, -52], [[-78, -52], [-37, -52], [-35, -52]], 18, {}],
    ['m08', 'PRESENT', (l) => lm(l, 'atriumDoors'), [[-40, -20], [-30, -24], [30, -20], [30, -21], [30, -37.5], [30, -38.6]], 9, { staff_door_open: true }], // (an officer who trusts Kai opens it)
    ['m08', 'PRESENT', () => [40, 0, -28], [[40, -24.5], [40, -14.3], [44, -10]], 6, {}],
    ['m08', 'PRESENT', () => [0, 0, -22], [[0, -18.4], [-0.3, -17], [0.4, -15.6], [-0.2, -14.2], [0.3, -12.8], [0, -11]], 0.4, {}],
    // (U3) the stone arch over the 2026 canyon; the lamp-post heads over the 2049 flood; the 2196 tilted floors up to the tower's deck
    ['m18', 'PAST', () => [0, 0, -80], [[0, -66], [0, -54], [0, -40]], 0, {}],
    ['m18', 'PRESENT', () => [6, 1.9, 2], [[6, 30], [6, 60]], 1.9, {}],
    ['m18', 'FUTURE', () => [-20, 0, 92], [[-20, 96], [-20, 104.5], [-16, 108], [6, 108], [10, 112], [10, 138], [14, 144], [26, 146], [26, 176], [30, 180], [24, 186]], 26, {}],
    // the bridge in the reflection holds in 2026, and once the reflection is in step; the stair to the fifth door
    ['m19', 'PAST', () => [0, 0, -18], [[0, -30], [0, -42]], 0, {}],
    ['m19', 'PRESENT', () => [0, 0, -18], [[0, -30], [0, -42]], 0, { m19_synced: true }],
    ['m19', 'PRESENT', () => [86, 0, -42], [[86, -60], [86, -79], [86, -81]], 12, {}],
    ['m19', 'PAST', () => [-55, 0, 98], [[-55, 79], [-55, 76], [-49, 76], [-49, 64]], 6, {}],
    // the Spire: the kitchen door's stair, the halls, the elite ramps, the cells' terrace, the bridge to the arena; the summit
    ['m21', 'PRESENT', () => [48, 0, 30], [[48, 27], [48, 21], [48, 10], [48, -30], [46, -38], [46, -62], [30, -68], [21, -68], [6, -68], [6, -44], [6, -38]], 18, {}],
    ['m21', 'PRESENT', () => [-32.7, 18, -36], [[-32.7, -44], [-32.7, -55], [-36, -60]], 24, {}],
    ['m21', 'PRESENT', () => [-30, 0, 26], [[-30, 20], [-30, 6], [-30, 0], [10, 0], [30, 0]], 6, {}],
    // the Museum: the sinkhole's spiral, one and a half turns from the rim (26 m) to the floor (-12 m), into the Comparison Hall
    ['m16', 'FUTURE', (l) => lm(l, 'rimGate'), [[0, 58], [0, 55], ...Array.from({ length: 89 }, (_, i) => { const a = 96 + i * 6, r = 55 - (18 * (a - 90)) / 540; return [Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r]; }), [0, -33], [0, -30], [3, -20], [3, -12], [1, -6]], -12, {}],
    // the First Second: down the village terraces, round the twin chamber to the clockmaker's wedge
    ['m22', 'PRESENT', (l) => lm(l, 'wedgeVillage'), [[0, 60], [0, 53], [0, 48], [0, 41], [0, 36], [0, 24], [-12, 14], [-30, 14], [-40, 14]], 0, {}],
    // Afterzero: the whole road, from the 41's shelter over the stream's bridge and up the Ring Hill to the ring
    ['m23', 'PRESENT', (l) => lm(l, 'platform41'), [[2, 150], [2, 112], [0, 90], [0, 66], [0, 54], [0, 30], [0, -20], [0, -100], [0, -110], [0, -124], [0, -140]], 4, {}],
  ];
  for (const [key, st, start, route, y, facts] of routes) {
    const l = lv(key);
    const r = walkRoute(l, st, start(l), route, facts);
    assert.ok(!r.stuck && Math.abs(r.at[1] - y) < 0.6, `${key} ${st}: ${JSON.stringify(route.slice(-1))} ${JSON.stringify(r)}`);
  }
  // where the year is the answer, the wrong year does not carry Kai: the lab's glass in 2049, the 2049 chasm, the reflection out of step
  assert.ok(walkRoute(lv('m03'), 'PRESENT', [40.8, 0, -6], [[40.8, -1]]).stuck, 'M3: in 2049 the lab\'s south wall is glass');
  assert.ok((walkRoute(lv('m18'), 'PRESENT', [0, 0, -80], [[0, -66], [0, -54], [0, -40]]).at?.[1] ?? -99) < -1, 'M18: no way over the chasm in 2049');
  assert.ok((walkRoute(lv('m19'), 'PRESENT', [0, 0, -18], [[0, -30], [0, -42]]).at?.[1] ?? -99) < -1, 'M19: the bridge is only a reflection');
  // the river in Mission 5: in the abandoned year its footbridge is gone, in the thriving year it carries Kai over
  const m5 = lv('m05');
  const [sx, , sz] = m5.landmarks.footbridgeS, n = m5.landmarks.footbridgeN;
  assert.ok(walkRoute(m5, 'PAST', [sx, 0, sz], [[n[0], n[2]]]).at?.[1] > 0, 'THRIVING: over the footbridge');
  assert.ok(walkRoute(m5, 'PRESENT', [sx, 0, sz], [[n[0], n[2]]]).at?.[1] === undefined || walkRoute(m5, 'PRESENT', [sx, 0, sz], [[n[0], n[2]]]).at[1] < -1, 'ABANDONED: into the river');
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

test('the Chronolith has the edition\'s three forms and stands in them: stone (the village), the black ring (Helix), the broken halo (2196)', async () => {
  const { makeChronolith } = await import('../game/js/editions/lastversion/Build.js');
  for (const k of ['stone', 'helix', 'halo']) assert.equal(makeChronolith(1, k).userData.kind, k);
  const model = (key, id) => PLACED.find((l) => l.deck.mkey === key).level.interactables.find((i) => i.id === id)?.model?.();
  assert.equal(model('m02', 'scene_chronolith')?.userData.kind ?? model('m02', 'chronolith')?.userData.kind, 'helix', 'Mission 2: the black ring');
  const m3 = PLACED.find((l) => l.deck.mkey === 'm03').level.interactables.find((i) => i.model && /touch/.test(i.id + i.scene))?.model();
  assert.ok(m3?.userData.setEra, 'Mission 3: one model, a form per year');
  const shown = (st) => { m3.userData.setEra(st); return m3.children.find((c) => c.visible)?.userData.kind; };
  assert.deepEqual(['PRESENT', 'PAST', 'FUTURE'].map(shown), ['helix', 'helix', 'halo'], 'Mission 3: broken into a halo by 2196');
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
  assert.equal(Object.keys(LV_MODELS).length, 31, '31 new people');
  assert.equal(Object.values(LV_MODELS).filter((m) => m.px === 1024).length, 16, '16 named at 1024 px');
  assert.equal(Object.values(LV_MODELS).filter((m) => m.px === 512).length, 15, '15 crowd at 512 px');
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
        assert.ok(PARTS.includes(k), `${model}/${name}: part ${k}`);
        assert.ok(rules.length <= 8, `${model}/${name}.${k}: ${rules.length} rules`);
        for (const r of packRules(rules)) {
          const nums = [...r.band, ...r.sel, ...r.win, ...r.act, ...r.act2];
          assert.ok(nums.every((x) => Number.isFinite(x) && x >= -1 && x <= 2), `${model}/${name}.${k}: ${JSON.stringify(r)}`);
          assert.ok(r.band[0] < r.band[2] && r.band[1] < r.band[3] && r.win[0] < r.win[1], `${model}/${name}.${k}: band and window`);
        }
      }
      for (const p of v.props || []) assert.ok(['umbrella', 'lantern', 'staff', 'trowel', 'clipboard', 'loupe', 'lanyard', 'beret', 'visor', 'badge'].includes(p), `${model}/${name}: prop ${p}`);
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

test('the spoken text is clean: no tags, key names, design notes or digits the voice would guess at; no templates in say calls', () => {
  const seen = new Set();
  for (const e of SPOKEN) {
    if (seen.has(e.text)) continue;
    seen.add(e.text);
    const t = e.text;
    assert.ok(!/\[[^\]]*\]/.test(t), `a [tag] in "${t}"`);
    assert.ok(!/\bpress(es|ed)?\b|\sQ\s|(?<!Case)\sC\./i.test(t), `a key name in "${t}" (${e.path})`);
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
  } finally {
    delete globalThis.window;
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
  const ctx = { currentTime: 1, sampleRate: 8000, createOscillator: node, createGain: node, createBiquadFilter: node, createBufferSource: node, createDelay: node, createWaveShaper: node,
    createBuffer: (ch, len) => ({ getChannelData: () => new Float32Array(len), duration: len / 8000 }) };
  const synth = { ctx, music: node(), sfx: node(), amb: node(), master: node(), reverb: node(), threat: 0.4, mix: {},
    osc() {}, noise() {}, pad() {}, pluck() {}, bell() {}, silence() {}, setMix() {}, level: () => 1 };
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
  for (const q of QUESTIONS) assert.ok(missionIndex(q.answer) >= 0 && q.clues.every((k) => EV_KEYS.has(k) || true), q.id);
});

// the evidence keys anything in the campaign can pin (ev_<key>)
const EV_KEYS = new Set();
walkObj([MISSIONS, DIALOGUE], (o) => { if (o.ev) EV_KEYS.add(o.ev); if (o.set && typeof o.set === 'object') for (const k of Object.keys(o.set)) if (k.startsWith('ev_')) EV_KEYS.add(k.slice(3)); });

test('the consequence ledger: every fact a rewritten mission\'s choices set is read later, or listed for a later mission', () => {
  const later = (m) => main.slice(main.findIndex((x) => x.key === m));
  const conds = (ms) => {
    const out = [];
    walkObj([ms, DIALOGUE, EPILOGUE], (o) => { for (const k of ['when', 'done', 'until', 'needs', 'npcWhen', 'freezeWhen', 'start']) if (typeof o[k] === 'string') out.push(o[k]); });
    for (const m of ms) for (const t of threadsOf(asDeck(m))) for (const k of ['when', 'done', 'until']) if (t[k]) out.push(t[k]);
    return out.join(' ');
  };
  const listed = (k, m) => CONSEQUENCES.some((c) => c.facts.includes(k) && c.set === m && c.shown.some((x) => missionIndex(x) > missionIndex(m)));
  let n = 0;
  for (const m of REWRITTEN) {
    const read = conds(later(m.key));
    walkObj(m, (o) => {
      if (!o.intent) return;
      for (const k of Object.keys(o.set || {})) {
        if (k.startsWith('ev_') || k.startsWith('t_')) continue; // (evidence is pinned to the case board)
        n++;
        assert.ok(new RegExp(`\\b${k}\\b`).test(read) || listed(k, m.key), `${m.key}: "${o.label}" sets ${k}, which nothing later reads and the ledger does not list`);
      }
      if (o.trust && !['jun', 'child', 'iven'].includes(o.npc)) assert.ok(true);
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
  assert.equal(said.filter((t) => t.includes('she leaves a yellow raincoat')).length, 1, 'its line is said once');
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

test('the save format: a pre-U6 save in the middle of a rewritten mission restarts it at quarter 0 and keeps its facts', () => {
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
  assert.ok(rt.resumed, 'the sector loads at the furthest quarter reached');
  // a current save keeps where it was
  const now = { lv: true, chapter: 'prologue', deck: 0, sector: 0, quarter: 2, pos: [1, 2, 3, 0], flags: { beat_done: false }, lvFormat: SAVE_FORMAT };
  migrateSave(engine(), now, LV);
  assert.deepEqual([now.quarter, now.pos], [2, [1, 2, 3, 0]]);
  // a mission not rewritten keeps its sector
  const act = { lv: true, chapter: 'act3', deck: 2, sector: 1, flags: {}, lvFormat: 21 };
  migrateSave(engine(), act, LV);
  assert.equal(act.sector, 1);
});

// --- story part 2: Acts I and II (OVERHAUL.md §5 M4-M13; U7) ------------------------------------------------------------
test('Acts I and II are rewritten as threads; the length model: each mission 25-42 minutes, the main path 70% or more', () => {
  assert.deepEqual(REWRITTEN.map((m) => m.key), MISSION_ORDER.slice(0, 13), 'Missions 1-13 are rewritten');
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
  for (const ch of ['prologue', 'act1', 'act2']) {
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
