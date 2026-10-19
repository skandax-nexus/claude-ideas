// AFTERZERO: THE LAST VERSION OF EARTH (v2.0) - the state engine, the edition layer, the
// people and the missions, without a browser:
//   - the reality engine on PAST / PRESENT / FUTURE / INVERTED (authored states per room,
//     what each state does, causal anchors, save and restore)
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
import { LastVersion, MISSIONS, CHAPTERS, ORDER } from '../game/js/editions/lastversion/Runtime.js';
import { ENDINGS } from '../game/js/editions/lastversion/acts.js';
import { NPCS, DIALOGUE, AMBIENT, npcState, JUN_HOOK, WATER_HOOK, MARA_HOOK, IVEN_HOOK } from '../game/js/editions/lastversion/npcs.js';

const INTENTS = ['challenge', 'comfort', 'investigate', 'withdraw'];
const engine = () => new RealityEngine(LV.engineOptions());

// --- the state engine -------------------------------------------------------------------------
test('the engine runs on the four temporal states, authored per room', () => {
  const e = engine();
  assert.deepEqual(e.states, ['PRESENT', 'PAST', 'FUTURE', 'INVERTED']);
  assert.equal(e.state('lab'), 'PRESENT', 'a room starts in the present');
  assert.equal(e.residue, 'PAST', 'the past shows what stood here');
  e.setAvailable('lab', ['PRESENT', 'PAST', 'FUTURE']);
  assert.equal(e.setState('lab', 'INVERTED'), false, 'a state the room was not authored with is refused');
  assert.equal(e.state('lab'), 'PRESENT');
  const seen = [];
  for (let i = 0; i < 4; i++) { e.cycle('lab'); seen.push(e.state('lab')); }
  assert.deepEqual(seen, ['PAST', 'FUTURE', 'PRESENT', 'PAST'], 'cycling visits only the authored states, in order');
  assert.equal(e.setState('lab', 'INVERTED', { force: true }), true, 'the story can still force a state');
  e.setAvailable('corridor', ['PRESENT']);
  assert.equal(e.cycle('corridor'), false, 'a one-state place does not switch');
  assert.throws(() => e.setState('lab', 'ECHO'), /Unknown state/);
});

test('each state does what the bible says, with no laws written', () => {
  const e = engine();
  assert.deepEqual(e.laws, [null, null, null], 'no law-writing device in this edition');
  assert.ok(e.has('echoSolid', 'PAST') && e.has('echoVisible', 'PAST'), 'PAST: original structures stand and hold weight');
  assert.ok(e.has('gravityFlip', 'INVERTED') && e.has('timeReverse', 'INVERTED'), 'INVERTED: reverses selected processes');
  for (const s of ['PRESENT', 'FUTURE']) assert.ok(!e.has('echoSolid', s) && !e.has('gravityFlip', s), `${s} has neither`);
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
  assert.deepEqual(Object.values(LV.labels), ['2049', '2026', '2196', 'INVERTED']);
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
        if (c.key === 'canal' || c.key === 'roof') assert.ok(can.has('echoSolid') || can.has('gravityFlip'), `${deck.mkey}/${s}: ${c.key} needs PAST or INVERTED, has ${st}`);
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
