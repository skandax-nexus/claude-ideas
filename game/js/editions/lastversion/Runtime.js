// THE LAST VERSION OF EARTH: the runtime main.js hands the game to when the
// edition is on. It owns the chapters and missions, the objective layers, scenes
// and dialogue choices, Chronolith stability, Echo Step, causal anchors, REVERSE
// (inversion.js), the case board and the endings. The engine, the worlds and the
// HUD are the same as Station Zero's; this is the layer that tells them what
// Kai's verbs are. Three years switch (Q, 1 2 3); nothing flips gravity, and
// there are no laws.
import * as THREE from '../../../vendor/three.module.min.js';
import { setChapters, latestFor, describeSave, listSaves, latestSave, writeSave } from '../../ui/Saves.js';
import { makeCastModel, setCrewDresser } from '../../world/People.js';
import { PROLOGUE } from './prologue.js';
import { ACTS, ENDINGS, CASE_FILES, CASE_STATES, caseState } from './acts.js';
import { ENDING_SHOTS } from './finale.js';
import { CAST, DIALOGUE, NPCS, TRUST, KNOWLEDGE, AMBIENT, npcState } from './npcs.js';
import { Inversion } from './inversion.js';
import { placeAuthored } from './processes.js';
import { buildPlace, themeFor as placeTheme, sunDir as placeSun } from './places/index.js';
import { registerModels, makeDresser, loadCast, castReady, lodUpdate } from './casting.js';
import { castLevel } from './crowds.js';
import { Watchers } from './watchers.js';
import { Score } from './score.js';
import { Cinema } from './cinema.js';
import { VoiceFx } from './voicefx.js';
import { choiceLine, chapterCardLines, missionCardLines, endingLines, POSTCREDIT } from './voicelines.js';
import { Threads, placeThreads, isRewritten, sidesOf, sideState, coldFact, threadsOf, factOf, playFact, choiceHeader, condIds } from './Threads.js';
import { QUESTIONS, PREVIOUSLY, CHOSEN } from './ledger.js';
import { ROAM, reachedPlaces, roamSave, roamMeta, storyFromRoam, finished, roamFree, fragmentFound, placeName, yearName, ROAM_ONLY } from './roam.js';

// text into a page's HTML
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// the edition's voice packs: common to every chapter, then one per chapter (OVERHAUL.md §8.3)
export const voicePack = (group) => `assets/voice/lv/${group}/`;

export const CHAPTERS = {
  prologue: { name: 'PROLOGUE', sub: 'The Zero Second: Rain City, Helix, the first switch', question: 'What happened, and why does the voice know Kai?', say: 'The Prologue. The Zero Second.' },
  act1: { name: 'ACT I', sub: 'The World That Remembers', question: 'How can the machine predate its inventors?', say: 'Act One. The World That Remembers.' },
  act2: { name: 'ACT II', sub: 'The Nine-Minute War', question: 'Is the Witness protecting Kai or controlling him?', say: 'Act Two. The Nine-Minute War.' },
  act3: { name: 'ACT III', sub: 'The Last Version of Earth', question: 'What did the previous attempts cost?', say: 'Act Three. The Last Version of Earth.' },
  act4: { name: 'ACT IV', sub: 'The Unwritten Second', question: 'Can Mira be saved without repeating the catastrophe?', say: 'Act Four. The Unwritten Second.' },
  finale: { name: 'FINALE', sub: 'Afterzero', question: 'What must be accepted rather than fixed?', say: 'The Finale. Afterzero.' },
  cases: { name: 'CASE FILES', sub: 'The stories the main road walked past, replayed from their places', question: 'Whose record do you believe, and what does it cost them?', say: 'The Case Files. The stories the main road walked past.' },
  // a trip, beside the story (roam.js): never in the chapter list; a trip's save is under its story's chapter
  roam: { name: 'FREE ROAM', sub: 'The places you have reached, in the years you opened there', question: 'What else did these places keep?', say: '' },
};
export const ORDER = ['prologue', 'act1', 'act2', 'act3', 'act4', 'finale'];
export const MISSIONS = { prologue: PROLOGUE, ...ACTS };

// the facts that hold only while a moment plays: every scene's `show` (Runtime.playNode sets it for its lines) and the
// ending choice's m23_beat (finale.js beat); never loaded from a save (Runtime.resume)
let MOMENT_FACTS = null;
export function momentFacts() {
  if (MOMENT_FACTS) return MOMENT_FACTS;
  const out = new Set(['m23_beat']);
  const walk = (o, depth = 0) => {
    if (!o || typeof o !== 'object' || depth > 6) return;
    if (Array.isArray(o)) return o.forEach((x) => walk(x, depth + 1));
    if (typeof o.show === 'string' && (o.lines || o.choices)) out.add(o.show);
    for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v, depth + 1);
  };
  for (const ms of Object.values(MISSIONS)) for (const m of ms) walk(m.scenes);
  return (MOMENT_FACTS = out);
}
// a chapter's missions: the story's, the CASE FILES', or a trip's (free roam: one roam deck per story mission, roam.js,
// kept out of MISSIONS so that nothing walks them as the story)
export const missionsOf = (ch) => (ch === 'roam' ? ROAM : MISSIONS[ch]);

// main.js's own sun offset (main.js _sunOff): the shadows' sun outside a place
const DEFAULT_SUN = Object.freeze([6, 24, 9]);

// what the generators may build in this edition: residue bridges and stairs, watchers, sweepers
export const MECHS = ['echo', 'sentinel', 'time'];
const EFFECTS = ['echoSolid', 'echoVisible', 'heldPersists', 'timeStop', 'observerFrozen']; // what a level here can ask for
function mechsFor(m, fits) {
  const list = (m.mechs || MECHS).filter(fits);
  return list.length ? list : ['sentinel', 'time']; // never an empty list (the generator would fall back to gravity)
}

// the save format (campaign.lvFormat): 21 = three years and REVERSE (U1); 22 = missions as one map with soft quarters (U6:
// the Prologue); 23 = Acts I and II as one map each (U7); 24 = Acts III, IV and the Finale too, and the CASE FILES (U8)
export const SAVE_FORMAT = 24;
// the format in which each chapter's missions became one map: a save from before it restarts that mission
// (the cases' c_b and c_c became replays of Missions 5 and 15 in 24: an older save in one starts it again, where its story lives)
export const REWRITTEN_IN = { prologue: 22, act1: 23, act2: 23, act3: 24, act4: 24, finale: 24, cases: 24 };

// v2.0 saves came from a four-state engine (INVERTED flipped gravity): the room states it no longer
// has go back to the baseline, rooms lose a state they cannot have, and REVERSE gets its charge. A save
// from before U6 that stands in the middle of a mission since rewritten (one map, soft quarters) restarts
// that mission at its first quarter and keeps its facts (Runtime.resume marks the rules already fired)
export function migrateSave(engine, campaign, def, facts = null) {
  const ok = (s) => def.states.includes(s);
  for (const [rid, s] of Object.entries(engine.rooms)) if (!ok(s)) engine.rooms[rid] = engine.baseline;
  for (const [rid, list] of Object.entries(engine.available)) engine.available[rid] = list.filter(ok);
  for (const k of Object.keys(engine.overrides)) delete engine.overrides[k]; // the reversed wards are re-applied on load
  engine.laws = [];
  engine.unlocked = Math.min(engine.unlocked, engine.slots); // no law slots (a v2.0 save unlocked a third)
  engine.recompile();
  if (campaign) {
    campaign.inv = { cap: 8, charge: 8, ...(campaign.inv || {}) };
    const deck = MISSIONS[campaign.chapter]?.[campaign.deck ?? 0];
    const from = campaign.lvFormat ?? 20;
    if (from < (REWRITTEN_IN[campaign.chapter] ?? 22) && isRewritten(deck)) {
      Object.assign(campaign, { sector: 0, quarter: deck.startQuarter || 0, room: null, pos: null, flags: {}, visited: [], restarted: true });
      // (from Act I on, what the old version of this mission had set, and nothing before it sets, goes: those missions
      // were reshaped, so the rewritten one plays from its start, not with its threads done and its investigation walked
      // past (U7 review: Mission 5's old divert, wall and gate). The facts earlier missions set stay. The Prologue's
      // rewrite kept its beats' events, and keeps their facts: the Zero Second does not happen twice)
      if (facts && (REWRITTEN_IN[campaign.chapter] ?? 22) >= 23 && campaign.chapter !== 'cases') for (const k of ownFacts(campaign.chapter, campaign.deck ?? 0)) delete facts.facts[k];
    }
    // water_route: before U7 Mission 5's own divert set it; since, it means side story B played to its end (Tala's gates)
    if (facts && from < 23 && facts.get('water_route') && facts.get('quest_tala') !== 'resolved') delete facts.facts.water_route;
    campaign.quarter ??= 0;
    campaign.lvFormat = SAVE_FORMAT;
  }
  return campaign;
}

// the facts a mission sets (its scenes', talks', rules', zones' and threads' own, and what its code sets) that no mission
// before it in the campaign sets: what an old save restarting it forgets (migrateSave)
function factsOf(m) {
  const out = new Set();
  const seen = new Set();
  const walk = (o) => {
    if (!o || typeof o !== 'object' || seen.has(o)) return;
    seen.add(o);
    if (o.set && typeof o.set === 'object' && !Array.isArray(o.set)) Object.keys(o.set).forEach((k) => out.add(k));
    if (typeof o.ev === 'string') out.add(`ev_${o.ev}`);
    for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v);
  };
  walk({ scenes: m.scenes, talks: m.talks, rules: m.rules, zones: m.zones, deductions: m.deductions, quarters: m.quarters, coldOpen: m.coldOpen });
  if (isRewritten(m)) for (const t of threadsOf(m)) for (const k of ['', '_paid', '_n']) out.add(`${factOf(m, t)}${k}`);
  for (const p of m.processes || []) out.add(`inv_${p.id}_done`).add(`rev_${p.id}`);
  for (const f of [...Object.values(m.fx || {}), m.step].filter(Boolean)) for (const x of String(f).matchAll(/\.set\('([a-z0-9_]+)'/g)) out.add(x[1]);
  return out;
}
function ownFacts(chapter, d) {
  const before = [];
  for (const ch of ORDER) {
    if (ch === chapter) { before.push(...MISSIONS[ch].slice(0, d)); break; }
    before.push(...MISSIONS[ch]);
  }
  const earlier = new Set(before.flatMap((m) => [...factsOf(m)]));
  const m = MISSIONS[chapter][d];
  return [...factsOf(m)].filter((k) => !earlier.has(k));
}

// REVERSE is learnt in Mission 11 (has_inversion) and holds longer after Missions 13 and 18. A v2.0 save never
// had it (its inversion was the INVERTED year), and a chapter change does not apply PRIMES, so a save that stands
// past Mission 11 without it gets it on load, with the cap its place has earned: 0 before Mission 12 (Mission 11
// teaches it), else the cap in seconds. (Without it the REVERSE threads of Missions 16, 17 and 22 could never be done.)
export function reverseEarned(campaign) {
  const ch = campaign?.chapter;
  if (ch === 'cases') return 12; // (the case files come after the Finale)
  if (ch === 'roam') return reverseEarned(campaign.roam?.back?.campaign); // (a trip: what its story has earned)
  const i = ORDER.indexOf(ch), act2 = ORDER.indexOf('act2');
  if (i < act2) return 0;
  if (i === act2) return (campaign.deck ?? 0) > MISSIONS.act2.findIndex((m) => m.n === 11) ? 8 : 0;
  return ch === 'act3' ? 10 : 12;
}

// facts a chapter started from the menu counts as already true ([fact, value] for a value)
export const PRIMES = {
  prologue: [],
  // (the Prologue's cross-mission facts, as a player who walked its main threads would have them)
  act1: ['has_chronolith', 'chronolith_seen', 'drawing_seen', 'fractured', 'mira_gone', 'wrist_cut', 'wrist_mark', 'raincoat', ['trust_rook', 0], 'ev_site_zero_print', 'ev_site_zero', 'lin_met'],
  act2: ['version_17', 'ev_witness_recording', 'found_not_built', ['rook_fate', 'record'], ['machine_buried', 'clay'], ['mira_tape', 'kept'], 'ev_ninth_minute'], // Act II reaches REVERSE by playing Mission 11
  act3: ['echo_step', 'ev_prisoners', 'ev_stabilizer', 'has_inversion', ['inv_cap', 10]],
  // (Act III's main choices, as a player who walked them would have them: Sera trusted, the city freed, the photograph left)
  act4: ['ev_memorial', 'ev_anja_lock', 'ev_version17', ['inv_cap', 12], ['trust_sera', 'accept'], 'city_freed', ['photo_taken', false], 'ev_dual_archive', 'ev_i_pressed', 'ev_mira_message', 'm18_done'],
  finale: [['ally', 'none'], ['m20_lead', 'mira'], 'child_resolved', 'ev_second_early', 'm22_done'],
  cases: ['has_chronolith', 'echo_step', 'zero_second', 'after_zero', 'has_inversion', ['inv_cap', 12]], // (after the Finale: its 12 s)
};

// the generators' challenge hints, said in Kai's voice and in the edition's verbs: three tiers each,
// and a second set once REVERSE is his (Runtime.hint picks by has_inversion)
export const HINTS = {
  roof: ['The scene is on a roof.', 'In the past the old stairs still stand, and the past holds weight.', 'Switch to the past and climb the remembered stairs.'],
  canal: ['The water cuts the district in two.', 'A bridge used to be here. In the past it still does.', 'Switch to the past and cross the old bridge.'],
  drones: ['The watchers look along the street. Only the street.', 'Stay behind buildings and use the alleys. An Echo Step draws them off.', 'Wait for the patrol to pass, then cross behind it. Echo Step if I have it.'],
  gate: ['The way on is closed.', 'It opens when this place has told me what it is for.', 'Finish the scene here. Then walk to the gate.'],
  'pit:echo': ['Something was built here once.', 'In the past the bridge still stands, and the past holds weight.', 'Switch to the past and walk the old bridge.'],
  'ledge:echo': ['There were stairs here once.', 'In the past there still are.', 'Switch to the past and climb.'],
  'exit:key': ['The lock wants a key. There is one, somewhere else in time.', 'The key exists in the past. The lock works now. What I carry out of the past comes apart unless I anchor it.', 'Take the key in the past, anchor it, switch back, use the lock.'],
  'exit:core:echo': ['The core is on a high shelf. A stair used to lead there.', 'The stair stands in the past.', 'Switch to the past, climb, take the core, carry it to the socket.'],
  sweepers: ['The beams sweep on a rhythm. Watch it twice.', 'Learn the loop, then cross between sweeps.', 'Wait for the beam to pass, then walk through behind it.'],
  sentinel: ['It watches the floor in front of it.', 'Stay behind the pillars. Move when it turns.', 'Wait behind a pillar until it walks away, then cross behind it.'],
  'exit:open': ['The door is open.', 'Just walk.', 'Walk through the door.'],
  // the open places' own crossings (places/specs)
  ice: ['The canal is between me and the other side.', 'In 2196 the canal is frozen over, and ice holds a man.', 'Switch to 2196 and walk across the ice, or take a bridge.'],
  hiddenStair: ['The floorboards are worn where nobody walks any more.', 'In 2026 a stair ran up the north wall. Later somebody bricked it up.', 'Switch to 2026 and take the old stair up from the shop floor.'],
};
export const HINTS_REVERSE = {
  roof: ['The scene is on a roof.', 'In the past the old stairs still stand. If something here glints silver, it fell from somewhere, and it can go back.', 'Switch to the past and climb the remembered stairs.'],
  canal: ['The water cuts the district in two.', 'A bridge used to be here. In the past it still does. Anything that glints silver will run backwards for me, for a while.', 'Switch to the past and cross the old bridge.'],
  drones: ['The watchers look along the street. Only the street.', 'Stay behind buildings. A watcher that glints silver will walk its last few seconds backwards and forget it saw me.', 'Wait for the patrol to pass and use the alleys, or Echo Step. One thing at a time.'],
  sweepers: ['The beams sweep on a rhythm. Watch it twice.', 'Learn the loop. In a ward that runs backwards the beams turn the other way.', 'Wait for the beam to pass, then walk through behind it.'],
  sentinel: ['It watches the floor in front of it.', 'Stay behind the pillars. If it glints silver I can walk it back through its own steps.', 'Wait behind a pillar until it walks away, then cross behind it.'],
};

// the system lines TICK says in Station Zero, in this edition's voice, and every other line the runtime says
// itself (Kai's, unless LINE_SPEAKERS names someone else; voicelines.js walks them for the voice packs).
// No template strings: a line that depends on the year is authored once per year.
export const LINES = {
  lock_state: 'The lock reads the present. The room is somewhere else right now.',
  lock_key: 'It wants a key. I saw one in another year.',
  socket_empty: 'An empty socket. There is a cell for it somewhere near.',
  socket_year: 'The socket belongs to another year. It is not here now.',
  key_dissolve: 'It came apart when the year changed. Next time, anchor it first.',
  caught: 'It walked me back to the last anchor. It only watches the floor in front of it.',
  plaque: 'Records have a residue. Read it in the past.',
  no_chronolith: 'I can\'t change the year. Not yet.',
  hold: 'Hold on.',
  snap: 'The Chronolith let go of me. Back to the present, back to the last anchor.',
  empty_hands: 'Nothing in my hands to hold on to.',
  scene_no: 'Not like this. Not now.',
  gate_custom: 'Not yet. Something here is unfinished.',
  gate_scene: 'The gate waits for the scene. Finish it first.',
  next_open: 'The next door is open. Keep going.',
  read_record: 'Read the record on the wall. Then read it again in the past.',
  look_around: 'Look around. Someone left something for me.',
  tasks_around: 'There are things to do along the avenue. Some of them only answer in their own year.',
  // a task that only answers in its own year (a mission may author its own `no`)
  task_PRESENT: 'Not in this year. It only answers in 2049.',
  task_PAST: 'Not in this year. It only answers in 2026.',
  task_FUTURE: 'Not in this year. It only answers in 2196.',
  // someone who is not here in this year, when they have no echo of their own (the narrator)
  echo: 'Not in this year. What stands here is an echo: a few seconds of somebody\'s day, repeating.',
};
export const LINE_SPEAKERS = { echo: 'NONE' };
// shown, never spoken
const TOASTS = { no_state: 'This place does not have that year.' };

const EV_LABELS = {
  admitted_by: 'ADMITTED BY: K. VAREN, in an older hand', lock_order: 'The Ward 32 lock went in RING, BAR, STAR, CRESCENT',
  toy: 'A toy that un-fell', clock: 'A clock running backward', camera: 'A camera showing tomorrow', stopped_clock: 'Every clock stopped at 8:14',
  rook_log: 'Rook moved the test to 05:40', rook_evasion: 'Rook denies anything before Helix', dale: 'Dale told the truth about the chamber', drawing: 'Kai and Mira drawn beside the machine, 23 years ago',
  mira_archive: 'Mira in the junior programme, 2026', others_before: 'Others came before the first fire', found_not_built: 'Helix found the machine', clock_question: 'Which version of the question',
  witness_recording: 'A recording in my own older voice', version17: 'This is VERSION 17', sera_doubt: 'Sera doubts the official record', prisoners: 'The prisoners in the loops',
  stabilizer: 'The stabilizer: the district or the people', memorial: 'The memorial carries my name', anja_lock: 'Anja\'s lock holds a city at one day', dual_archive: 'Two archives, both true',
  mira_memory: 'Mira remembers more than one life', gate_resets: 'Jun\'s gate resets itself', water_gates: 'Three stone gates on the channel', iven_testimony: 'Iven refused to sign', raw_log: 'The raw experiment log',
  three_notes: 'The three-note song', three_photos: 'A child in three photographs', water_route: 'The water route through the ruins',
  // the Prologue (U6)
  mira_photo: 'Mira at nine, in yellow boots', minute_814: 'Everything odd runs backwards toward 8:14', card_0540: 'My card opened Chamber One at 05:40, while I slept',
  florist: 'A receipt for 08:04: an older me, with a scar', puddle: 'A ripple before the drop', pigeon: 'A pigeon that landed backwards', helix_window: 'One window pulsing in Helix',
  relay: 'Relay 41-B: dead now, live at 8:13', rook_terminal: 'Rook\'s order, timestamped before the Zero Second', site_zero_print: 'The Site Zero print: a boot print, c. 1077 BC',
  lin_peg: 'Lin\'s peg: empty, and dripping', lin_badge: 'Lin\'s badge: PHOTO PENDING SINCE 2026', empty_corridor: 'At 05:40 the chamber door opened on an empty corridor',
  door_log: 'The door log: my card at 05:40, edited at 05:50', junior_pass: 'My junior pass: OVERRIDE 14-03-2026 16:02', site_zero: 'Site Zero: the ring was found, not built',
  thermos_er: 'A thermos marked E.R. at the 2026 dig', footprints: 'Two children\'s footprints at the dig, one with a star tread', polaroid: 'The ring, half dug out of the clay',
  plaque2196: 'HELIX. WHERE THE FRACTURE BEGAN. WE REMEMBER.',
  // Acts I and II (U7)
  he_is_early: 'HE IS NOT LYING. HE IS EARLY.', village_mark: 'My mark is cut over every door', ash_layers: 'The ash: cooking, feasting, nothing, cooking',
  card_ancient: 'My Helix card, three thousand years old', ring_took: 'They left because the ring kept taking people', arm_count: 'The arm has turned 2,609 times',
  rook_gauge: 'Ezra mended a gauge for Dr. Rook', ninth_minute: 'At the ninth minute a man turns the ring', rook_confession: 'Rook moved the test, and signed "fever"',
  river_court: 'Helix was rebuilt round my river', v17_records: 'VAREN, M.: deceased 2026', boot_mine: 'The Site Zero print is my boot', second_late: 'Iven: the ring turned a second early',
  order_cancelled: 'The tower order was cancelled at 08:09', ninth_view: 'From the tower: a man at the console, looking at me', intakes: 'Four earlier intakes of Varen, one grey',
  echo_step: 'Echo Step: an afterimage a step ahead', missing_patient: 'VAREN, M., 9, admitted to Ward 32 in 2026', young_kai: 'Me at twelve, on the bench',
  steps: 'His route: every pane of glass', both_sides: 'Both sides fire at their own last attack', witness_cause: 'A scarred wrist buried the first device',
  field_orders: 'The field orders answer each other', nobody_first: 'Nobody fired first: each side answers its own last attack', casing: 'HELIX. PROPERTY OF K. VAREN', corridor_b: 'Corridor B, in 2026', junior_tour: 'SITE ZERO JUNIOR TOUR, 14 MARCH',
  // Acts III and IV, the Finale (U8)
  fresh_flowers: 'Fresh white chrysanthemums at my memorial', receipt_0804: 'The flowers came out of the air, at 08:04', river_14: 'The fourteenth was a flood', memory_one: 'Memory one: me at the console',
  memory_two: 'Memory two: Mira at the console', memory_three: 'Memory three: nobody at the console', museum_his: 'The museum is the Witness\'s', erased: 'The names no world kept',
  two_logs: 'Two sealed logs: the ring, the button', i_pressed: 'I pressed it. I was twelve.', mira_message: 'Mira: the one before you tried to save me', fall_order: 'Floors numbered in the order they fell',
  real_door: 'The real door casts no shadow', her_side: 'She asked. I let her.', no_owner: 'A letter to a brother she never had', chain: 'River, wall, gate, machine: every cause was me',
  iven_statement: 'Iven: the ring turned before the button', memory_card: 'Memory three, filed SUBJECTIVE', second_early: 'He turned it a second early', unwritten_record: 'What each ending costs',
};

const _v = new THREE.Vector3(), _w1 = new THREE.Vector3(), _w2 = new THREE.Vector3();
const _fogC = new THREE.Color(), _nightC = new THREE.Color(0x101828); // (a night cold open's air: stateNight)
// the facts a replay starts from, handed over the page reload (sessionStorage)
const CASE_FACTS = 'afterzero.lv.caseFacts';
// after an ending, BACK TO THE STORY on a trip comes back to the CASE FILES (the title opens them once: sessionStorage)
const OPEN_CASES = 'afterzero.lv.openCases';
// a CASE FILES replay saves in a slot of its own, never listed and never a campaign's (Saves.js keys it like slot N):
// it never writes over the finished campaign it was opened from, nor over the autosave a full set of slots falls back to
export const CASE_SLOT = 'case';
// whose people a chapter loads behind its card: a replay's are its own mission's chapter's (cases.js voiceGroup), not
// every replay's at once
// (and a trip's are its mission's chapter's)
export const castKeyOf = (chapter, di = 0) => (chapter === 'cases' && MISSIONS.cases[di]?.voiceGroup) || (chapter === 'roam' && ROAM[di]?.voiceGroup) || chapter;
// how long a chapter waits behind its card for its people before it starts with what arrived (Runtime.waitForCast)
export const CAST_WAIT_MS = 90000;
// how long the station chime (score.js 'pa': two tones 0.42 s apart) sounds before an announcement is said
const PA_LEAD = 0.9;

export class LastVersion {
  constructor(game, def) {
    this.g = game;
    this.def = def;
    game.edition = this;
    this.stability = 1;
    this.echoCd = 0;
    this.anchored = null;
    this.loopT = 0;
    this.hintTier = 0;
    this.hintKey = null;
    setChapters(CHAPTERS);
    const hud = game.hud;
    hud.states = def.states.map((key) => ({ key, label: def.labels[key] }));
    hud.speakers = def.speakers;
    hud.stabilityBar = true;
    this.inv = new Inversion(this); // REVERSE (Mission 11 on)
    // the edition's people (casting.js): their models are registered now and load per chapter, behind its
    // card; everyone the edition builds is dressed (wardrobe.js) and posed within the animation budget
    registerModels();
    setCrewDresser(makeDresser(() => game.renderer));
    this.watchers = new Watchers(this); // Helix drones, Continuum troopers, scavengers (watchers.js)
    this.mounted = null; // the open place in the browser: scenery, sky, horizon (places/mount.js)
    this.score = new Score(this); // the music, the cues, the beds, the mix (score.js)
    this.cinema = new Cinema(this); // cold opens, outros, the endings (cinema.js)
    game.facts.onChange(() => this.onFact());
    // a piece of evidence pinned to the case board: a two-note bell and a toast
    game.facts.onChange((k, v) => {
      if (v && k.startsWith('ev_') && game.campaign?.lv && !this.quietPins) this.pin(k.slice(3));
      // where Kai stood when the story moved (a thread done, evidence found, a fragment read): a load resumes there
      // (Runtime.markAnchor; v2.1 playtest FT-11, SYS-06)
      if (v && /^(t_|ev_|fr_)/.test(k) && !k.endsWith('_paid')) this.markAnchor();
    });
    // REVERSE is the story's to give: it waits for the thread that teaches it (Runtime.reverseOpen; v2.1 playtest
    // SYS-09: the records annex reached before the boy on the bench gave it out of order)
    const unlock = this.inv.unlock.bind(this.inv);
    this.inv.unlock = () => {
      if (!this.reverseOpen()) {
        this.reverseHeld = true;
        return;
      }
      unlock();
    };
    // the app sent to the background (the home button, a call): the game saves where it stands, its play time with it
    // (not as the page unloads: a reload is a load, a quick load or a CLEAR, and what it asks for must not be written
    // over; v2.1 playtest SYS-06)
    if (typeof window !== 'undefined') {
      // (a page that did not go after all, an unload let go or the page back from the back-forward cache, saves again)
      window.addEventListener('beforeunload', () => {
        this.unloading = true;
        setTimeout(() => { this.unloading = false; }, 1500);
      });
      window.addEventListener('pageshow', () => { this.unloading = false; });
      document.addEventListener('visibilitychange', () => document.hidden && this.saveOnHide());
    }
    // a device that cannot decode the recorded voices (an older WebKit without Opus): say so once
    if (game.voice) {
      game.voice.effects = new VoiceFx(game.voice); // what a line sounds like through: pa, radio, recording, echo
      game.voice.onDecodeFail = () => {
        if (this.decodeSaid) return;
        this.decodeSaid = true;
        game.hud.toast('<small>VOICES</small><br>This device cannot play the recorded voices. The subtitles carry every line.', 6000);
      };
    }
    // a watcher that rewinds its own damage, lured into a live conduit, stays down
    game.deckWorld.onSentinelDown = (s) => {
      if (!game.campaign?.lv) return;
      game.fx.burst([s.pos.x, 1.2, s.pos.z], 0xffb36b, 50, 2.2);
      game.audio.door?.();
      game.facts.set(s.def.downSets || 'unit_down');
    };
  }

  engineOptions() {
    return this.def.engineOptions();
  }

  // a rewritten mission's threads: objective and because, hints, quarters, the chase, staged moments (Threads.js)
  get threads() {
    return (this._threads ||= new Threads(this));
  }

  // --- the title and the menus --------------------------------------------------------------
  title() {
    const $ = (s) => document.querySelector(s);
    document.body.classList.add('lastversion');
    $('#title h1').innerHTML = 'AFTER<span>ZERO</span>';
    let sub = $('#title .sub');
    if (!sub) {
      sub = document.createElement('p');
      sub.className = 'sub';
      $('#title h1').after(sub);
    }
    sub.textContent = this.def.subtitle;
    $('#title .tag').textContent = this.def.tagline;
    $('#title .ver').textContent = 'v2.1.1 · The Last Version of Earth';
    // the menus opened from the title (the chapters, the saves, the settings, the CASE FILES) stand in front of the
    // title's own backdrop, not of Station Zero's antechamber, which the 3D view keeps drifting round behind the title
    if (!$('#lvTitleMenus')) {
      const st = document.createElement('style');
      st.id = 'lvTitleMenus';
      st.textContent = `body.lastversion:not(.playing) #chapters.overlay, body.lastversion:not(.playing) #saves.overlay,
        body.lastversion:not(.playing) #settings.overlay, body.lastversion:not(.playing) #ending.overlay {
        background: radial-gradient(circle at 70% 47%, rgba(80, 140, 225, 0.28) 0 22vmin, transparent 46vmin),
          repeating-linear-gradient(104deg, rgba(210, 225, 255, 0.07) 0 1px, transparent 1px 11px),
          radial-gradient(ellipse at 62% 112%, rgba(255, 186, 104, 0.42), transparent 58%),
          linear-gradient(180deg, #0b111c 0%, #182434 58%, #2b2c34 100%); backdrop-filter: none; }`;
      document.head.appendChild(st);
    }
    $('#begin small').textContent = 'Choose a chapter: the Prologue, Acts I to IV, the Finale, or the Cases';
    const dim = $('#title p.dim');
    if (dim) dim.textContent = 'A temporal thriller about a machine that lets you stand in different years of the same place. Twenty-three missions, three years of one world, three endings.';
    const ctl = $('#title .controls.desktop-only');
    // (on a phone: what the thumbs do, and what the buttons are, before the first mission says it)
    const tctl = $('#title .controls.touch-only');
    if (tctl) tctl.innerHTML = '<span><b>Left thumb</b> move</span><span><b>Right side</b> look</span><span><b>Tap a prompt</b> use</span><span><b>YEAR</b> switch year</span><span><b>THINK</b> when stuck</span><span><b>CASE</b> your case board</span>';
    if (ctl) ctl.innerHTML = '<span><b>WASD</b> move</span><span><b>MOUSE</b> look</span><span><b>SPACE</b> jump</span><span><b>Z</b> walk / run</span><span><b>E</b> / click use</span><span><b>Q</b> switch year</span><span><b>1 2 3</b> choose a year</span><span><b>R</b> reverse</span><span><b>C</b> anchor what you carry</span><span><b>X</b> Echo Step</span><span><b>H</b> think</span><span><b>J</b> / <b>L</b> case board</span><span><b>M</b> map</span><span><b>F5</b> quick save</span><span><b>ESC</b> pause</span>';
    // you are Kai Varen, in his one look: no CHARACTER screen (Station Zero's, which calls you Ren) on the title or
    // in the pause menu
    for (const sel of ['#heroBtn', '#heroBtn2']) {
      const b = $(sel);
      if (b) b.style.display = 'none';
    }
    // no law device, no TICK, no SHIFT: the dock and the touch buttons say what they do here
    for (const [sel, text] of [['#dock .hint span', 'THINK'], ['#dock .combo span', 'ECHO STEP'], ['#buttons .combo span', 'ECHO'], ['#dock .journal span', 'CASE'], ['#buttons .shift span', 'YEAR'], ['#journal header h2', 'CASE BOARD']]) {
      const el = $(sel);
      if (el) el.textContent = text;
    }
    for (const [sel, label] of [['#dock .hint', 'Think'], ['#dock .combo', 'Echo Step'], ['#buttons .combo', 'Echo Step'], ['#buttons .shift', 'Switch year'], ['#dock .journal', 'Case board'], ['#dock .laws', 'Case board']]) {
      for (const el of document.querySelectorAll(sel)) el.setAttribute('aria-label', label);
    }
    const mapLegend = $('#map .legend .npc');
    if (mapLegend) mapLegend.textContent = 'People';
    // (no law tokens and no save beacons here, and the watchers are people and drones: the map's key says so)
    const watcherKey = $('#map .legend .sentinel');
    if (watcherKey) watcherKey.textContent = 'Watcher';
    for (const sel of ['#map .legend .token', '#map .legend .beacon']) {
      const el = $(sel);
      if (el) el.style.display = 'none';
    }
    // (the big map's ring where the objective is, and the diamond of someone Kai follows: the key names them)
    const legend = $('#map .legend');
    if (legend && !legend.querySelector('.lvobj')) legend.insertAdjacentHTML('beforeend', '<span class="lg lvobj">Objective</span><span class="lg lvquarry">Followed</span>');
    const vt = $('#verdict .dim');
    if (vt) vt.textContent = '';
    // the people of the chapter most likely to be played next start loading on the title screen, with its voices
    const latest = listSaves().filter((x) => x.data?.campaign?.lv).sort((a, b) => (b.data.meta?.savedAt || 0) - (a.data.meta?.savedAt || 0))[0];
    const likely = CHAPTERS[latest?.data.campaign.chapter] ? latest.data.campaign.chapter : 'prologue';
    loadCast(castKeyOf(likely, latest?.data.campaign.deck));
    this.g.voice?.usePacks?.(this.packsFor(likely, latest?.data.campaign.deck ?? 0));
    this.sound();
    // back from a trip taken after an ending: the CASE FILES, as THE CASES opened them (after main.js shows the title)
    let cases = false;
    try {
      cases = window.sessionStorage.getItem(OPEN_CASES) === '1';
      window.sessionStorage.removeItem(OPEN_CASES);
    } catch { /* storage blocked: the title */ }
    if (cases) setTimeout(() => !this.g.started && this.caseFiles(), 0);
    // a start asked for before the page reloaded waits on the title's first button (main.js: "CONTINUE · Tap to
    // enter"): it says what it starts (v2.1 playtest F18: a case replayed from the ending card)
    setTimeout(() => this.bootLabel(), 0);
  }

  // the title's first button, when it runs a start asked for before the reload (g.pendingBoot)
  bootLabel() {
    const g = this.g, boot = g.pendingBoot, b = typeof document !== 'undefined' && document.querySelector('#continue');
    if (!boot || !b || g.started) return null;
    const action = String(boot.action || '');
    let head = null, info = null;
    if (action.startsWith('lv:cases/')) {
      const d = MISSIONS.cases.find((m) => m.key === action.slice(9));
      head = 'REPLAY';
      info = d ? `Case ${d.no} of ${CASE_FILES.length} · ${d.name}` : 'A case file';
    } else if (action.startsWith('lv:') && CHAPTERS[action.slice(3)]) {
      head = 'NEW GAME';
      info = CHAPTERS[action.slice(3)].name;
    } else if (action === 'load') {
      const s = listSaves().find((x) => x.slot === boot.slot);
      if (s?.data) {
        const d = describeSave(s.data);
        head = 'CONTINUE';
        info = `${d.title} · ${d.sub}`;
      }
    }
    if (!head) return null;
    const text = `${head}<small id="continueInfo">${esc(info)} · Tap to start</small>`;
    b.innerHTML = text;
    return text;
  }

  // --- sound: the score, the first tap, the mix, what each line sounds like (OVERHAUL.md §8.7, §8.9) -----------
  sound() {
    const g = this.g;
    if (this.soundWired) return;
    this.soundWired = true;
    this.score.attach();
    this.score.applyMix(g.settings);
    // the first tap wakes the sound (Chromium does not count a touch's pointerdown; touch controls swallow
    // touchstart), and any later tap brings it back if the system suspended it
    const tap = () => {
      const a = g.audio;
      if (a.ctx?.state === 'running') return this.soundOn();
      if (document.hidden) return;
      const now = a.unlock();
      this.levels();
      if (now) return this.soundOn();
      a.ctx?.resume?.().then(() => (a.ctx.state === 'running' ? this.soundOn() : this.score.setBanner(true))).catch(() => this.score.setBanner(true));
      setTimeout(() => {
        if (g.audio.ctx?.state !== 'running' && !document.hidden) this.score.setBanner(true);
      }, 700);
    };
    for (const e of ['pointerup', 'touchend', 'mousedown', 'keydown', 'click']) window.addEventListener(e, tap, true);
    if (this.score.banner) this.score.banner.onclick = tap;
    // every line: its effect chain (station speakers, records), and the cue it carries
    const on = g.hud.onLine;
    g.hud.onLine = (who, line) => {
      if (line) {
        const fx = this.fxFor(who, line);
        if (fx && !line.voice?.fx) line.voice = { ...(line.voice || {}), fx };
        if (line.voice?.cue) this.score.cue(line.voice.cue);
        // the station's two-tone chime comes before the announcement, not over its first words: the line is said
        // when the chime has sounded (and stays up that much longer); a line skipped meanwhile is not said
        if (line.voice?.cue === 'pa' && this.score.ready()) {
          line.dur = (line.dur || 0) + PA_LEAD;
          clearTimeout(this.paT);
          this.paT = setTimeout(() => g.hud.cur === line && !g.menu && on?.(who, line), PA_LEAD * 1000);
          return;
        }
      }
      on?.(who, line);
    };
    // the mix rows under SOUND (Dialogue, Music, Effects, Ambience, Sound captions)
    const open = g.openSettings.bind(g);
    g.openSettings = (from) => {
      open(from);
      this.score.mixRows(g);
    };
    const apply = g.applySettings.bind(g);
    g.applySettings = () => {
      apply();
      this.score.applyMix(g.settings);
    };
  }

  // the player's volume and SOUND OFF hold from the first tap on, the title theme included (begin() applies
  // them again; before the first tap there was no context for main.js to apply them to)
  levels() {
    const g = this.g, a = g.audio;
    if (!a.ctx || this.levelsSet) return;
    this.levelsSet = true;
    a.setVolume?.(g.settings.volume);
    if (g.settings.muted && !a.muted) a.toggleMute();
    g.muteLabel?.();
  }

  // the sound is running: the banner goes, the title theme plays (until a chapter starts)
  soundOn() {
    this.score.setBanner(false);
    this.levels();
    if (this.soundStarted) return;
    this.soundStarted = true;
    this.score.applyMix(this.g.settings);
    if (!this.g.started) this.score.cue('title');
    else if (this.deck) this.score.enter(this.deck, this.placeYear || 'PRESENT', this.level);
  }

  // a line's effect chain when it does not name one: the voice in every speaker and the station's speakers
  // through the PA, the records through a recording, the unseen Director through a radio
  fxFor(who, line) {
    if (who === 'VOICE' || who === 'PA') return 'pa';
    if (line.voice?.id === 'DIRECTOR') return 'radio';
    if (line.name && this.recordTexts?.has(line.text)) return 'recording';
    return null;
  }

  // a piece of evidence pinned to the case board
  pin(key) {
    this.score.cue('pin');
    if (EV_LABELS[key]) this.g.hud.toast(`<small>PINNED TO THE CASE BOARD</small><br>${EV_LABELS[key]}`, 2600);
  }

  // a line said in passing (a crowd's or a person's bark) gives way to a staged moment: the one being said is cut and
  // none waits in the queue (a conversation's lines, and what waits on their end, are left to run). Every bark carries
  // the flag (DeckWorld.bark), so the HUD's own rule is the one rule
  hushBarks() {
    this.g.hud?.hushBarks?.();
  }

  // the crowd's own barks, for the walla under a place (score.js)
  wallaLines() {
    if (!this.level) return [];
    if (this.walla?.level !== this.level) {
      const list = [];
      for (const n of this.level.npcs) if (n.crowd && n.barks?.length && n.voiceExtra?.id) for (const b of n.barks) list.push([b, n.voiceExtra.id]);
      this.walla = { level: this.level, list };
    }
    return this.walla.list;
  }

  openChapters(from) {
    const g = this.g;
    g.menuBack = from;
    g.menu = 'chapters';
    g.input.release();
    const html = [...ORDER, 'cases'].map((ch) => {
      const c = CHAPTERS[ch];
      const last = latestFor(ch);
      const d = last && describeSave(last.data);
      const ms = MISSIONS[ch];
      const list = ms.map((m) => `${typeof m.n === 'number' ? m.n : 'Case ' + (m.no ?? m.n)}. ${m.name}`).join(' · ');
      return `<div class="chapcard"><h3>${c.name}</h3><p>${c.sub}</p><p class="dim" style="font-size:11px">${ch === 'cases' ? `${CASE_FILES.length} stories` : list}</p><div class="acts">
        ${last ? `<button class="cont" data-cont="${last.slot}">CONTINUE<small>${d.title} · ${d.sub}</small></button>` : ''}
        ${ch === 'cases' ? '<button data-casefiles="1">CASE FILES</button>' : `<button data-newch="${ch}">NEW GAME</button>`}</div></div>`;
    }).join('');
    document.querySelector('#chapters .body').innerHTML = html;
    for (const b of document.querySelectorAll('#chapters [data-cont]')) {
      b.onclick = () => {
        g.menu = null;
        g.begin('load', b.dataset.cont === 'auto' ? 'auto' : +b.dataset.cont);
      };
    }
    for (const b of document.querySelectorAll('#chapters [data-newch]')) b.onclick = () => g.openSaves('new', 'chapters', { action: `lv:${b.dataset.newch}` });
    for (const b of document.querySelectorAll('#chapters [data-casefiles]')) b.onclick = () => this.caseFiles();
    g.hud.show('chapters');
  }

  // --- starting and resuming ------------------------------------------------------------------
  makeStory(chapter) {
    const ms = missionsOf(chapter);
    // a generated puzzle may only use what this place's years can do: PAST holds the residue
    // (no gravity, ceilings or zero-g: those were Station Zero's laws)
    const fits = (m) => (k) => MECHS.includes(k) && (k !== 'echo' || m.states.includes('PAST'));
    const decks = ms.map((m, i) => ({
      ...m, index: i, mkey: m.key, mechs: mechsFor(m, fits(m)), key: m.key, crew: m.crew ?? 0,
      hints: { roof: HINTS.roof, canal: HINTS.canal, drones: HINTS.drones, gate: HINTS.gate }, // (the places' challenge hints)
      thoughts: Array.isArray(m.hints) ? m.hints : null, // the mission's own thoughts (THINK)
    }));
    return {
      zones: true, lv: true, chapter, seed: `lv-${chapter}`, residue: 'PAST', label: 'THE LAST VERSION', // each chapter its own places
      question: CHAPTERS[chapter].question,
      cast: CAST, captain: CAST[0], truth: {}, decks,
      fragments: decks.map((d) => d.fragments?.[0] || []),
      after: { key: 'NONE', sentinels: 'hunt', dark: 0 },
      mechs: MECHS, mechDeck: 4,
    };
  }

  start(chapter, saved = null, waited = false) {
    const g = this.g;
    // (a chapter started from a menu the title had open, the CASE FILES or the chapters, starts with it closed: the game
    // steps only with no menu open, v2.1 playtest F01)
    if (!waited && (g.menu === 'ending' || g.menu === 'chapters')) g.menu = null;
    // a story replayed from the CASE FILES screen: 'cases/<key>' (cases.js), with the facts the player had
    const asked = chapter;
    let replay = null;
    if (typeof chapter === 'string' && chapter.startsWith('cases/')) {
      replay = chapter.slice(6);
      chapter = 'cases';
    }
    // (a trip is only ever a saved campaign: roam.js roamSave)
    if (!CHAPTERS[chapter] || (chapter === 'roam' && !saved?.roam?.back)) chapter = 'prologue';
    const di = replay ? Math.max(0, MISSIONS.cases.findIndex((m) => m.key === replay)) : saved?.deck ?? 0;
    this.ownLook();
    // the chapter's voices load with its people (a new game opens on the chapter's card)
    if (!waited) {
      g.voice?.usePacks?.(this.packsFor(chapter, di));
      this.chapterStart = !saved;
    }
    this.quietPins = true; // (what a chapter counts as already found is not news)
    // the chapter's people load behind its card first (one model at a time); then the chapter starts.
    // (Once waited for, it starts whatever arrived: a model that could not load has a stand-in.)
    const castKey = castKeyOf(chapter, di);
    if (!waited && !castReady(castKey)) return this.waitForCast(chapter, () => this.start(asked, saved, true), castKey);
    // (a replay saves in its own slot: a new one always; a saved one loaded from it, which main.js leaves slotless)
    if (chapter === 'cases' && (replay || g.slot == null)) g.slot = CASE_SLOT;
    g.mode = 'deck';
    // (a trip's save is under its story's chapter: CONTINUE on that chapter's card takes the player back on the trip)
    g.run = chapter === 'roam' ? saved.roam.meta?.run || g.run : chapter;
    this.chapter = chapter;
    g.story = this.makeStory(chapter);
    g.facts.rulesEnabled = false;
    g.facts.set('has_tick'); // the THINK button
    g.facts.set('lv_chapter', chapter);
    // (on a trip, where: roam.js ROAM_ONLY, never carried back to the story)
    if (chapter === 'roam') g.facts.set('lv_roam', saved.roam.key);
    else for (const k of ROAM_ONLY) delete g.facts.facts[k];
    if (!saved) {
      // everything before this chapter counts as played
      const upTo = chapter === 'cases' ? ['cases'] : ORDER.slice(0, ORDER.indexOf(chapter) + 1);
      for (const c of upTo) for (const k of PRIMES[c] || []) (Array.isArray(k) ? g.facts.set(k[0], k[1]) : g.facts.set(k));
      if (replay) this.replayFacts(MISSIONS.cases[di]);
    }
    if (!saved && chapter !== 'prologue' && !g.facts.get('faction')) g.facts.set('faction', 'neutral');
    g.world.root.visible = false;
    g.observer.mesh.visible = false;
    g.npcs.juno.visible = false;
    g.campaign = saved || { lv: true, chapter, deck: di, sector: 0, quarter: 0, flags: {}, visited: [], stability: 1, inv: { cap: 8, charge: 8 }, lvFormat: SAVE_FORMAT };
    g.campaign.lv = true;
    g.campaign.quarter ??= 0;
    g.campaign.inv ||= { cap: 8, charge: 8 };
    this.stability = g.campaign.stability ?? 1;
    g.held = saved ? saved.held || null : null;
    this.anchored = null;
    g.engine.setGlobal('heldPersists', false);
    g.loadSector(!saved, saved?.room, saved?.pos);
  }

  // the voice packs a mission speaks from: the common pack, its chapter's, and for a case file that replays a
  // side story, the pack of the mission it lives in (voiceGroup)
  packsFor(chapter, di = 0) {
    const vg = missionsOf(chapter)?.[di]?.voiceGroup;
    // (the cases pack has no recordings: every replay speaks from its own mission's pack, so it is not fetched; nor has
    // a trip a pack: it speaks from its mission's)
    return [voicePack('common'), ...(chapter === 'cases' || chapter === 'roam' ? [] : [voicePack(chapter)]), ...(vg && vg !== chapter ? [voicePack(vg)] : [])];
  }

  // a replay starts from the facts the player had (the CASE FILES screen hands them over; else the latest save's),
  // with the story's own facts cleared (cases.js), so that it can happen again
  replayFacts(deck) {
    const g = this.g;
    let facts = null;
    try {
      facts = JSON.parse(window.sessionStorage.getItem(CASE_FACTS) || 'null');
      window.sessionStorage.removeItem(CASE_FACTS);
    } catch { /* storage blocked: the latest save, then */ }
    if (!facts) facts = latestSave()?.data?.facts?.facts || null;
    if (facts) for (const [k, v] of Object.entries(facts)) g.facts.set(k, v);
    for (const k of Object.keys(g.facts.facts)) if (k.startsWith(`t_${deck.key}_`) || k.startsWith(`side_${deck.key}_`) || k === `${deck.key}_done`) g.facts.set(k, false);
    for (const k of deck.clear || []) g.facts.set(k, false);
    g.facts.set('lv_replay', deck.key);
  }

  // --- CASE FILES (cases.js): the fourteen stories, their state, a replay of each from its place ------------------
  caseFiles(facts = null) {
    const g = this.g;
    const $ = (sel) => document.querySelector(sel);
    // (in a game, its facts; from the title, the latest save's)
    let f = facts || (g.campaign?.lv ? g.facts : null);
    if (!f) {
      const d = latestSave()?.data?.facts?.facts || {};
      f = new g.facts.constructor();
      f.facts = { ...d };
    }
    // (numbered as a replay's card names it: CASE 14 OF 14, v2.1 playtest F18)
    const rows = CASE_FILES.map((c, i) => {
      const st = caseState(f, c);
      return `<div class="caseFile" data-state="${st}"><b>${i + 1}. ${c.name}</b><small>${c.where} · ${CASE_STATES[st]}</small>${c.key ? `<button data-case="${c.key}">REPLAY</button>` : '<small class="dim">part of the main story</small>'}</div>`;
    }).join('');
    // FREE ROAM: the places reached (in a game, its own; from the title, the latest save's), each year a trip
    const log = g.campaign?.lv ? g.log : latestSave()?.data?.log || [];
    const trips = reachedPlaces(f, log);
    this.travelCss();
    const tabs = trips.length ? `<div class="lvtabs"><button class="on" data-tab="cases">CASE FILES</button><button data-tab="roam">FREE ROAM · ${trips.length} PLACES</button></div>` : '';
    const roam = trips.length ? `<div class="lvtab" data-of="roam" hidden><p class="dim">Walk a place you have reached, in a year you opened there: no story gates, its side stories and fragments still there.</p>
      <div class="caseFiles">${this.travelRows(trips, (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'), null, 'div')}</div></div>` : '';
    $('#ending .body').innerHTML = `<h2>CASE FILES</h2>${tabs}
      <div class="lvtab" data-of="cases"><p class="dim">The stories the main road walked past. A replay starts from its place, with the facts you had.</p>
      <div class="caseFiles">${rows}</div></div>
      ${roam}
      <button id="lvTitle">BACK TO THE TITLE</button>`;
    for (const b of document.querySelectorAll('#ending [data-tab]')) {
      b.onclick = () => {
        for (const x of document.querySelectorAll('#ending [data-tab]')) x.classList.toggle('on', x === b);
        for (const t of document.querySelectorAll('#ending .lvtab')) t.hidden = t.dataset.of !== b.dataset.tab;
      };
    }
    if (!$('#lvCaseCss')) {
      const st = document.createElement('style');
      st.id = 'lvCaseCss';
      st.textContent = '.caseFiles{display:grid;gap:6px;margin:10px 0;max-height:52vh;overflow:auto}.caseFile{display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center;padding:6px 8px;border:1px solid rgba(255,255,255,.12);border-radius:6px;text-align:left}.caseFile b{font-size:13px}.caseFile small{grid-column:1;font-size:11px;opacity:.75}.caseFile button{grid-row:1/span 2;grid-column:2;margin:0;padding:6px 10px;font-size:12px}.caseFile[data-state=open]{opacity:.7}';
      document.head.appendChild(st);
    }
    for (const b of document.querySelectorAll('#ending [data-case]')) {
      b.onclick = () => {
        try {
          window.sessionStorage.setItem(CASE_FACTS, JSON.stringify(f.facts || {}));
        } catch { /* storage blocked: the replay reads the latest save */ }
        // (from the title the replay starts in this page, and these CASE FILES are the menu open: it closes first, as
        // CONTINUE's does, or the game never steps (main.frame steps only with no menu) and the case's opening never
        // ends: v2.1 playtest F01. In a game, begin() reloads the page first.)
        if (!g.started) g.menu = null;
        g.begin(`lv:cases/${b.dataset.case}`, null, CASE_SLOT);
      };
    }
    for (const b of document.querySelectorAll('#ending [data-travel]')) {
      b.onclick = () => (g.started && g.campaign?.lv ? this.travel(b.dataset.travel, b.dataset.year) : this.travelFromTitle(b.dataset.travel, b.dataset.year));
    }
    $('#lvTitle').onclick = () => location.reload();
    if (g.campaign?.lv && g.started) g.saveTo('auto');
    g.openMenu('ending');
  }

  // a trip from the title (the CASE FILES opened there): the latest save becomes a trip, in its own slot, and loads
  travelFromTitle(key, year) {
    const g = this.g;
    const latest = latestSave();
    if (!latest?.data?.campaign?.lv) return false;
    const { data, meta } = roamSave(latest.data, latest.data.meta, { key, year, format: SAVE_FORMAT });
    if (!writeSave(latest.slot, data, meta)) return false;
    g.menu = null; // (the CASE FILES close as the trip starts in this page: v2.1 playtest F01)
    g.begin('load', latest.slot);
    return true;
  }

  // the edition offers Kai's own look only (LV.looks): an older save's look is put back to his
  ownLook() {
    const g = this.g;
    if (!g.settings || this.def.looks.includes(g.settings.hero?.id)) return;
    g.changeSetting('hero', { id: this.def.looks[0] });
    g.player.setModel(g.settings.hero);
    if (g.voice) g.voice.youMale = true;
  }

  // Load a chapter's cast (casting.js) behind its card, the game held still meanwhile (begin() unpauses
  // after start() returns: held again once it has). Without its models the chapter would start with
  // stand-ins that change face when the real ones arrive.
  waitForCast(chapter, then, castKey = chapter) {
    const g = this.g;
    const c = CHAPTERS[chapter];
    if (g.mode !== 'deck') g.mode = 'lvwait'; // (neither a deck nor Station Zero: nothing steps or draws a place)
    g.world.root.visible = false;
    const hold = () => { g.paused = true; };
    hold();
    queueMicrotask(hold);
    // only the card while they come: no map, dock or buttons over an empty scene
    if (!document.querySelector('#lvCast')) {
      const st = document.createElement('style');
      st.id = 'lvCast';
      // (and the card over the fade: between two chapters the wait starts behind it)
      st.textContent = 'body.lastversion.lvwait #minimap, body.lastversion.lvwait #dock, body.lastversion.lvwait #buttons { visibility: hidden; } body.lastversion.lvwait #card { z-index: 31; }';
      document.head.appendChild(st);
    }
    document.body.classList.add('lvwait');
    g.hud.card(c.name, c.sub, 'The people of this chapter are on their way.', 600000);
    const token = (this.castWaitFor = castKey);
    // a model that never comes (a stalled fetch) does not hold the chapter for ever: after CAST_WAIT_MS it starts
    // with what arrived (whoever's model is missing is a hologram stand-in: casting.js makeDresser), and the rest
    // keeps loading
    const timeout = new Promise((resolve) => setTimeout(resolve, CAST_WAIT_MS));
    Promise.race([loadCast(castKey), timeout]).then(() => {
      if (this.castWaitFor !== token) return;
      this.castWaitFor = null;
      document.body.classList.remove('lvwait');
      // the waiting card goes; what comes next shows its own (a mission's card, PREVIOUSLY after a load)
      this.hideCard();
      g.paused = false;
      then();
    });
  }

  // the chapter's models, for a caller that wants them before it starts the chapter (the bots, a preload)
  loadCast(chapter) {
    return loadCast(chapter);
  }

  resume(campaign) {
    migrateSave(this.g.engine, campaign, this.def, this.g.facts); // a v2.0 save may stand in an INVERTED room; a pre-U6 one mid-mission restarts it
    // what holds only while a moment plays (a scene's show fact, cinema.watchShow and the recordings' holograms; the
    // ending choice's m23_beat): a save taken inside one kept it set, so the scene's next showing had no camera of its
    // own, and the Finale's hilltop the sky from before the ending (v2.1 playtest review)
    for (const k of momentFacts()) if (this.g.facts.facts[k]) delete this.g.facts.facts[k];
    if (campaign.restarted) {
      // (its facts stay: what already happened does not happen again)
      const deck = MISSIONS[campaign.chapter]?.[campaign.deck ?? 0];
      for (const r of deck?.rules || []) if (this.g.facts.test(r.when)) campaign.flags[`rule_${r.id}`] = true;
      delete campaign.restarted;
    }
    // (after the rules above: a rule that waits on REVERSE has not happened yet, and fires as it would have)
    const cap = reverseEarned(campaign);
    if (cap && !this.g.facts.get('has_inversion')) {
      this.g.facts.set('has_inversion');
      if ((this.g.facts.get('inv_cap') || 0) < cap) this.g.facts.set('inv_cap', cap);
    }
    this.resumed = true; // (the sector loads where the save was taken, after a PREVIOUSLY card: onSectorLoaded)
    // (a finished campaign, its ending reached, loads to its ending's card: postGame. Not a case replay's save, nor a
    // trip's, which come after an ending and go on as they were; and only the Finale's: the ending is reached there, and a
    // save of another chapter carrying it is not a finished campaign, it plays on with its PREVIOUSLY card. v2.1.1
    // release check: the bot's Act II save, made from a finished one, loaded to the ending card)
    this.finishedLoad = campaign.chapter === 'finale' && !!this.g.facts.get('ending');
    this.start(campaign.chapter, campaign);
  }

  // --- where a load puts Kai (v2.1 playtest FT-11, SYS-06) --------------------------------------------------------
  // A save keeps Kai's checkpoint (main.snapshot: the spawn of the quarter area he reached), which can be a long walk
  // back. So each time the story moves (a thread done, evidence found, a fragment read) the place he stands is kept as
  // well, with the room, its year and the checkpoint it was reached from: a load puts him there when the checkpoint is
  // still that one and the room is in that year again. Only where he stood on the ground, out of any moment that holds
  // him; and a load that finds him falling from it (a held platform that is down again) puts him at the checkpoint.
  markAnchor() {
    const g = this.g, c = g.campaign, pl = g.player;
    if (!c?.lv || !this.level || !pl?.pos || !g.room || !Array.isArray(g.checkpoint) || g.restoring || g.transitioning || g.catching || this.opening || this.castWaitFor) return;
    if (!pl.grounded || pl.gravity === 0) return;
    const p = pl.pos, h = pl.H;
    c.anchor = {
      mkey: this.deck?.mkey, sector: c.sector, room: g.room, year: g.engine.state(g.room),
      pos: [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), h ? +Math.atan2(-h.x, -h.z).toFixed(3) : 0],
      cp: g.checkpoint.slice(0, 3).map((v) => +(+v).toFixed(2)),
    };
  }

  // a load: Kai at his anchor, when it still holds (markAnchor)
  toAnchor() {
    const g = this.g, c = g.campaign, a = c?.anchor;
    this.anchorWatch = null;
    if (!a || a.mkey !== this.deck?.mkey || a.sector !== c.sector || a.room !== g.room || !Array.isArray(a.pos)) return false;
    const cp = Array.isArray(c.pos) ? c.pos : g.checkpoint;
    if (!Array.isArray(cp) || a.cp.some((v, i) => Math.abs(v - cp[i]) > 0.05)) return false;
    if (g.engine.state(a.room) !== a.year) return false;
    // (a chase starts again from its start: Kai waits for it where the story left him, at the checkpoint)
    if (this.threads.current()?.kind === 'chase') return false;
    g.player.place(a.pos);
    this.anchorWatch = { y: a.pos[1], t: 3 };
    return true;
  }

  // a load at an anchor that is not there any more (a held platform down again, a moving one gone): the checkpoint.
  // Watched for 3 s of play once the load's card is over (Kai is held, not frozen, under it: a fall shows at once)
  anchorStep(dt) {
    const g = this.g, w = this.anchorWatch;
    if (!w) return;
    if (g.player.pos.y < w.y - 1.5 && !g.catching) {
      g.player.place(g.checkpoint);
      this.anchorWatch = null;
    } else if (!this.opening && !this.cinema?.active && (w.t -= dt) <= 0) this.anchorWatch = null;
  }

  // the app sent to the background: save now (not while the page unloads, nor between two places)
  saveOnHide() {
    const g = this.g;
    if (this.unloading || !g.started || !g.campaign?.lv || !this.level || g.transitioning || g.catching || this.castWaitFor || g.restoring) return false;
    return g.saveTo('auto');
  }

  // --- REVERSE, given when the story reaches it (v2.1 playtest SYS-09, acts-1-2 F06) -------------------------------
  // the thread that teaches it: done when Kai has it (Mission 11's "Watch the file that keeps un-burning")
  reverseThread() {
    const th = this.threads;
    if (!th.on) return null;
    if (this.revThread?.list !== th.list) this.revThread = { list: th.list, t: th.list.find((t) => !t.side && t.done === 'has_inversion') || null };
    return this.revThread.t;
  }

  // REVERSE may be given now: no thread teaches it here, or the story has reached that thread
  reverseOpen() {
    if (this.g.facts.get('has_inversion')) return true;
    const t = this.reverseThread();
    return !t || this.threads.ready(t);
  }

  // watching the thing that teaches REVERSE counts, from where it can be seen: within 8 m of its landmark, in its room,
  // looking at it for 4 s (the zone around it asked Kai to walk to within 1.7 m: v2.1 playtest acts-1-2 F06). What the
  // zone sets is then set, as if he had stepped into it
  watchStep(dt) {
    const g = this.g;
    const t = this.reverseThread();
    const lm = t && typeof t.at === 'string' ? this.level.landmarks?.[t.at] : null;
    if (!lm || g.facts.get('has_inversion') || !this.threads.ready(t)) {
      this.watchT = 0;
      return;
    }
    // (the story is there: a zone spent early, unfire, is armed again)
    const flags = g.deckWorld.flags;
    for (const k in flags) {
      if (!k.startsWith('rearm_')) continue;
      delete flags[`trig_${k.slice(6)}`];
      delete flags[k];
    }
    if (this.opening || this.cinema?.active || g.catching) {
      this.watchT = 0;
      return;
    }
    const p = g.player.pos;
    const i = (this.level.triggers || []).findIndex((z) => z.set && z.once && (!z.room || z.room === g.room) && lm[0] >= z.box[0] && lm[0] < z.box[3] && lm[2] >= z.box[2] && lm[2] < z.box[5]);
    const z = this.level.triggers?.[i];
    if (!z || g.deckWorld.flags[`trig_${i}`] || (z.when && !g.facts.test(z.when, g.engine.state(g.room))) || Math.hypot(p.x - lm[0], p.z - lm[2]) > 8) {
      this.watchT = 0;
      return;
    }
    const cam = g.camera.position;
    g.camera.getWorldDirection(_v);
    const dx = lm[0] - cam.x, dy = (lm[1] || 0) + 1 - cam.y, dz = lm[2] - cam.z, d = Math.hypot(dx, dy, dz) || 1;
    // (looked at, and seen: not through a wall of the room it is in, from Kai's eyes)
    const seen = () => {
      if (!g.player.rayDistance) return true;
      const eye = _w1.set(p.x, p.y + 0.7, p.z), to = _w2.set(lm[0], (lm[1] || 0) + 1, lm[2]).sub(eye);
      const dv = to.length() || 1;
      return g.player.rayDistance(eye, to.divideScalar(dv), dv) >= dv - 1.2; // (what it lies on stands round it)
    };
    if ((_v.x * dx + _v.y * dy + _v.z * dz) / d < 0.75 || !seen()) {
      this.watchT = Math.max(0, (this.watchT || 0) - dt);
      return;
    }
    this.watchT = (this.watchT || 0) + dt;
    if (this.watchT < 4) return;
    this.watchT = 0;
    g.deckWorld.flags[`trig_${i}`] = true;
    for (const [k, v] of Object.entries(z.set)) g.facts.set(k, v);
  }

  get deck() {
    return this.g.story?.decks[this.g.campaign?.deck ?? 0];
  }

  get beat() {
    const d = this.deck;
    return d?.beats?.[this.g.campaign.sector] || { kind: 'custom' };
  }

  // the level for the current mission and sector
  buildLevel(c) {
    const g = this.g;
    this.inv?.unload(); // the outgoing level's REVERSE processes leave before DeckWorld disposes of it
    this.mounted?.dispose();
    this.mounted = null;
    const story = g.story;
    const deck = story.decks[c.deck];
    // a trip (free roam, roam.js): the place in the years opened there, nobody watching, no way on, no gate
    const roam = deck.roam ? c.roam || { year: deck.home || 'PRESENT', years: deck.states, fresh: true } : null;
    story.after.dark = deck.dark || 0;
    let level;
    // every mission stands in an open place (OVERHAUL.md §4): sector i loads the whole map and activates quarter i
    // (the edition no longer runs gen/ZoneGen.js or gen/LevelGen.js)
    if (deck.place) level = buildPlace(deck.place, story, c.sector, this, { deck });
    else if (deck.build) level = deck.build(story, c.sector, this);
    else throw new Error(`mission ${deck.mkey} has no place`);
    level.deckName = deck.name;
    if (roam) {
      level.exit = null;
      level.elements = level.elements.filter((e) => !/^gate_/.test(e.id || ''));
      if (level.map) level.map.gate = undefined;
    }
    const states = level.states || deck.states || ['PRESENT'];
    for (const id of level.order) {
      const room = level.rooms[id];
      const own = (room.states || states).filter((s) => this.def.states.includes(s));
      // (on a trip only the years opened there: a room that has none of them keeps its first)
      const opened = roam ? own.filter((s) => roam.years.includes(s)) : own;
      const avail = opened.length ? opened : own.slice(0, 1);
      g.engine.setAvailable(id, avail);
      for (const ch of room.challenges || []) ch.hints = HINTS[ch.key] || ch.hints;
      // a room starts in the mission's home year until the player switches it (saves restore the rest); a trip arrives
      // in the year it was taken to, and a trip's save keeps the year Kai switched to
      if (roam) {
        if (roam.fresh || !avail.includes(g.engine.state(id))) g.engine.setState(id, avail.includes(roam.year) ? roam.year : avail[0], { force: true });
        continue;
      }
      const home = (room.states || states).includes(deck.home) ? deck.home : g.engine.baseline;
      if (!c.flags || !Object.keys(c.flags).length || !this.def.states.includes(g.engine.state(id))) g.engine.setState(id, home, { force: true });
    }
    if (roam) roam.fresh = false;
    // nothing of Station Zero: no law tokens, no gravity effects
    level.tokens = [];
    level.effects = (level.effects || []).filter((e) => EFFECTS.includes(e));
    // a 'tasks' beat: things to do along the avenue, each perhaps in its own state; the last one opens the gate
    const beat = deck.beats?.[c.sector];
    if (beat?.kind === 'tasks') {
      const rid = level.outdoorRoom || level.order[0];
      const spots = [[-3.6, -18], [3.6, -34], [-3.6, -68]];
      // (in a place, a task stands at its landmark: `at: 'landmarkName'`; a name the place does not have is an error, as
      // in Place.at(), never a task at NaN that nobody can reach)
      const where = (at, i) => {
        if (typeof at === 'string') {
          if (!level.landmarks?.[at]) throw new Error(`${deck.mkey}: no landmark ${at} for a task`);
          return level.landmarks[at];
        }
        return at ? [at[0], 0, at[1]] : [spots[i % spots.length][0], 0, spots[i % spots.length][1]];
      };
      beat.tasks.forEach((t, i) => {
        const [x, y, z] = where(t.at, i);
        level.elements.push({ box: [x - 0.5, y, z - 0.4, x + 0.5, y + 1.0, z + 0.4], mat: 'prop', solid: true, room: rid, ...(level.place ? { invisible: true } : {}) });
        level.interactables.push({ id: `task_${i}`, kind: 'scene', scene: `task_${i}`, task: i, pos: [x, y + 1.3, z], r: 2.8, prompt: t.prompt, color: t.state ? { PAST: 0xffc07a, PRESENT: 0x9fd8ff, FUTURE: 0x9fffb0 }[t.state] : 0xffc04a, room: rid, ...(level.place ? { kit: t.kit || 'crate' } : {}) });
        level.texts.push({ text: t.prompt, pos: [x, y + 2.4, z], rotY: 0, size: 0.3, color: '#ffe6c0', room: rid });
      });
      const [nx, ny, nz] = beat.npcAt && level.landmarks?.[beat.npcAt] ? level.landmarks[beat.npcAt] : [1.8, 0, -8];
      if (beat.npc) level.npcs.push({ id: `npc_${rid}`, crew: beat.npc, pos: [nx, ny, nz], yaw: Math.PI, room: rid, lines: beat.lines || [], hologram: !!beat.hologram });
    }
    // people who only exist in some of this place's states leave an echo in the others (NPC failure handling)
    for (const n of level.npcs) {
      const def = NPCS[n.crew];
      // (inPerson: someone who travels with Kai through the years, as Niko does, is met in person in every year)
      if (n.temporal || n.inPerson || !def?.temporal || n.hologram) continue;
      if (beat?.kind === 'encounter' && n.id.startsWith('npc_')) continue; // the person a beat is about is always met in person
      const real = def.temporal.filter((s) => this.def.states.includes(s));
      const here = level.rooms[n.room]?.states || states;
      if (real.length && here.some((s) => real.includes(s)) && here.some((s) => !real.includes(s))) n.temporal = real;
    }
    deck.adjust?.(level, this); // a consequence of an earlier choice can change the place
    if (roam) level.sentinels = []; // (nobody watches a trip: no drone, trooper, scavenger or mimic)
    // REVERSE processes, scenes, doors and reversed wards at the mission's landmarks (§5); a rewritten mission's
    // threads: their triggers, scenes, records, deductions, a playback's echoes and the chase's path (Threads.js)
    // (before the casting, so the people they place are cast with everyone else)
    placeAuthored(deck, level);
    placeThreads(deck, level);
    // the people: the named cast in this mission's wardrobe, the hand-placed passers-by cast by role, and
    // the crowds that walk the place's paths (crowds.js; story.cast = CAST's copies, then the level's own)
    story.cast = level.cast = castLevel(level, deck, { facts: g.facts });
    // every person speaks in a recorded voice of their own: the named cast's vid, else the place's crowd voices by
    // sex and age (DeckWorld's barks pass voiceExtra on; Runtime.voiced gives it to their conversation lines)
    const pool = AMBIENT[deck.ambient]?.voices || AMBIENT.rain.voices;
    for (const n of level.npcs) {
      if (n.voiceExtra?.id) continue;
      const def = NPCS[n.crew];
      const gender = { her: 'f', his: 'm' }[(n.pronoun || def?.pronoun)?.their] || 'n';
      const id = def?.vid ?? ((n.height || 1.7) < 1.4 ? pool.child?.[0] : pool[gender === 'f' ? 'f' : 'm']?.[0]) ?? null;
      n.voiceExtra = { ...(n.voiceExtra || {}), id, gender };
    }
    // the records (said through the recording chain)
    this.recordTexts = new Set(level.interactables.filter((i) => i.kind === 'terminal' && i.log?.text).map((i) => i.log.text));
    // a trip: a rule that has already happened does not happen again, and a fragment already read is not laid again
    if (roam) {
      c.flags ||= {};
      for (const r of deck.rules || []) if (g.facts.test(r.when)) c.flags[`rule_${r.id}`] = true;
      for (const it of level.interactables) if (it.kind === 'fragment' && fragmentFound(g.facts, g.log, it.id, it.text)) c.flags[`done_${it.id}`] = true;
    }
    this.threads.attach(deck, level);
    for (const k of Object.keys(g.engine.overrides)) g.engine.setOverride(k, null);
    for (const rid of level.reversedRooms) g.engine.setOverride(rid, { timeReverse: true });
    this.level = level;
    this.unstable = !!(level.unstable || deck.unstable);
    return level;
  }

  onSectorLoaded(intro, start) {
    const g = this.g;
    const c = g.campaign;
    const deck = this.deck;
    const chapter = CHAPTERS[this.chapter];
    g.audio.setAmbience(null); // (the score's beds, per place and year)
    // an opening still running for the place left behind ends with it, and its card with it; a moment it drops
    // (an outro whose go() never comes) leaves no gate shut behind it (every in-game load reloads the page
    // first; these hold for a load in the page as well, the bots')
    if (this.opening) this.hideCard();
    this.opening = null;
    this.cinema.end(true);
    g.transitioning = false;
    g.hud.states = this.def.states.map((key) => ({ key, label: this.label(key) }));
    this.weatherState = null;
    this.loopT = this.loopPeriod();
    this.loopVariant(); // (a loop's patrols walk where its current reset put them)
    this.hintKey = null;
    this.anchored = null;
    g.engine.setGlobal('heldPersists', false);
    let opening = false;
    // (a case file by its number in the CASE FILES, not its letter: "CASE N" read as a placeholder, v2.1 playtest F18)
    const kicker = `${chapter.name} · ${typeof deck.n === 'number' ? `MISSION ${deck.n}` : `CASE ${deck.no ?? deck.n}${deck.no ? ` OF ${CASE_FILES.length}` : ''}`}${deck.sectors > 1 ? ` · ${c.sector + 1} OF ${deck.sectors}` : ''}`;
    if (intro) {
      g.held = null;
      delete c.opening;
      delete c.anchor;
      if (c.sector === 0) {
        opening = kicker;
        c.mStart = g.playTime || 0; // (time_<mkey>: how long the mission took, stored when it ends)
        c.quarter = 0;
        // (a case file starts where its story lives: that quarter's spawn)
        const sq = deck.startQuarter ? this.level.quarters?.[deck.startQuarter] : null;
        if (sq?.spawn) {
          c.quarter = deck.startQuarter;
          const sp = [sq.spawn[0], sq.spawn[1] + 0.86, sq.spawn[2], sq.spawn[3] || 0];
          if (sq.room && sq.room !== g.room) g.enterRoom(sq.room, true);
          g.player.place(sp);
          g.checkpoint = sp;
        }
      } else g.hud.card(kicker, this.level.rooms[start].name, deck.subtitle || '', 2600);
    }
    c.mStart ??= g.playTime || 0;
    // a save loads in a rewritten mission where Kai last stood safely, after a PREVIOUSLY card: its checkpoint, in its
    // room (main.loadSector put him there: the spawn of the quarter or the room he saved in). Only a save with none, a
    // mission the save format restarted, starts at the spawn of the furthest quarter reached (D2). (The furthest
    // quarter's spawn alone can be somewhere the rooms' years shut him out of: U6 review, Mission 3's dig with the lab
    // switched to 2049 and its 2026 frame closed behind it)
    const resumed = !intro && this.resumed;
    this.resumed = false;
    // (what a load picks up once its card is over: the moments a save cut off, a mission's own end; Runtime.step)
    this.pendingResume = resumed ? deck : null;
    this.autoExited = null;
    delete g.deckWorld.flags.auto_exit; // (saved in the flags before the U6 review; no longer read)
    if (resumed && this.threads.on && !Array.isArray(c.pos)) {
      const q = this.level.quarters?.[c.quarter || 0];
      if (q?.spawn) {
        const sp = [q.spawn[0], q.spawn[1] + 0.86, q.spawn[2], q.spawn[3] || 0];
        if (q.room && q.room !== g.room) g.enterRoom(q.room, true);
        g.player.place(sp);
        g.checkpoint = sp;
      }
    }
    // a save taken while the mission's opening played (the app sent to the background during a cold open: pause, QUIT)
    // loads with the opening played again, every room back in its own year first: Mission 12's cold open is shot in
    // 2196, and a save inside it loaded the chase in 2196 with the Chronolith draining (v2.1 playtest acts-1-2 F05)
    const cut = resumed && c.opening?.mkey === deck.mkey && !this.finishedLoad ? c.opening : null;
    delete c.opening;
    if (cut) {
      for (const [r, y] of Object.entries(cut.home || {})) if (this.level.rooms[r] && g.engine.statesOf(r).includes(y)) g.engine.setState(r, y, { force: true });
      g.deckWorld.refresh?.();
      opening = kicker;
      this.pendingResume = null;
    }
    // else a load puts Kai where he last did something since he reached his checkpoint (markAnchor), when that place
    // stands as it did then; else at the checkpoint (v2.1 playtest FT-11, SYS-06)
    else if (resumed && !this.finishedLoad) this.toAnchor();
    // (and the Chronolith gives a load a moment: a save taken low in another year let go of Kai seconds after loading,
    // v2.1 playtest F06)
    if (resumed && !deck.roam) this.stability = c.stability = Math.max(this.stability, 0.6);
    // an open place: its scenery, sky and horizon, in the room's year (instantly: no easing at a load)
    if (this.level.place) {
      this.mounted = this.level.scenery?.(g.deckWorld.root, this) || null;
      this.placeYear = g.engine.state(this.level.outdoorRoom);
      this.mounted?.setYear(this.placeYear, true);
      this.weatherState = null;
    }
    this.score.enter(deck, this.placeYear || g.engine.state(start) || 'PRESENT', this.level);
    this.inv?.load(this.level);
    // the next chapter's people start loading in this chapter's last mission, so its card does not wait
    const next = this.chapter === 'cases' || this.chapter === 'roam' ? null : ORDER[ORDER.indexOf(this.chapter) + 1];
    if (next && c.deck === g.story.decks.length - 1) {
      loadCast(next);
      g.voice?.usePacks?.([voicePack('common'), voicePack(this.chapter)], [voicePack(next)]); // and its voices
    }
    // the watchers: the Observer inside each sentinel becomes this mission's (watchers.js)
    this.watchers.mount(g.deckWorld, deck.mkey, { renderer: g.renderer, hero: g.settings.hero, stateOf: (rid) => g.engine.state(rid) });
    this.objective(true);
    this.quietPins = false;
    // (the cold open's people, and the place as it stages it, only while it plays: a save taken during it loads without)
    if (deck.coldOpen?.cast || deck.coldOpen?.stage) g.facts.set(coldFact(deck), false);
    // (and a playback's echoes, which stand only while it plays: a save taken during one loads without them)
    if (isRewritten(deck)) for (const t of threadsOf(deck)) if (t.kind === 'playback' && g.facts.get(playFact(deck, t))) g.facts.set(playFact(deck, t), false);
    if (opening) this.openMission(deck, opening);
    else if (deck.roam) this.roamCard(); // (a trip has no opening and no PREVIOUSLY: where it is, and that the story waits)
    else if (resumed && this.backFromRoam) this.backCard();
    else if (resumed && this.finishedLoad) this.postGame();
    else if (resumed) this.previously();
    this.backFromRoam = false;
    this.finishedLoad = false;
    // (a trip's fade, travelled to or back from in the page: the new place is up)
    if (this.travelFade) {
      this.travelFade = false;
      g.hud.fade(false);
    }
  }

  // --- free roam (roam.js): a trip to a place already reached, beside the story -------------------------------------
  get roaming() {
    return !!this.deck?.roam && this.g.campaign?.chapter === 'roam';
  }

  // the card a trip arrives under (shown, not said: a trip is not a cinematic)
  roamCard() {
    const g = this.g, deck = this.deck;
    g.hud.card('FREE ROAM', placeName(deck), `${yearName(deck, g.engine.state(this.level.outdoorRoom) || g.campaign.roam?.year)} · no story gates · the story waits where you left it`, 4200);
  }

  backCard() {
    const d = this.deck;
    this.g.hud.card('BACK TO THE STORY', d?.name || '', `${typeof d?.n === 'number' ? `Mission ${d.n}` : ''}`, 3000);
  }

  // where a trip can go now: the missions done, with the years opened there (none in a CASE FILES replay, or while a
  // staged moment, a transition or a catch holds the game)
  travelList() {
    const g = this.g;
    if (!g.campaign?.lv || g.campaign.chapter === 'cases') return [];
    return reachedPlaces(g.facts, g.log);
  }

  canTravel() {
    const g = this.g;
    return !!g.campaign?.lv && g.campaign.chapter !== 'cases' && !this.opening && !this.cinema?.active && !g.transitioning && !g.catching && !this.castWaitFor;
  }

  // TRAVEL: to mission `key`'s place in `year`, in the page (a fade, the place's people if they are not here yet, the
  // place). The trip's campaign carries the story to come back to (roam.js roamSave); the slot it saves in is the
  // story's own, so a save taken on the trip loads on it
  travel(key, year) {
    const g = this.g;
    const entry = this.travelList().find((e) => e.key === key);
    if (!entry || !entry.years.includes(year) || !this.canTravel()) {
      g.audio?.deny?.();
      if (entry && !this.canTravel()) g.hud.toast('<small>TRAVEL</small><br>Not now.', 1600);
      return false;
    }
    const { data } = roamSave(g.snapshot(), { ...g.saveMeta(), run: g.run }, { key, year, format: SAVE_FORMAT });
    this.inv?.release?.('travel');
    g.log.push(`I went back to ${entry.placeName}, ${entry.names[year] || year}. The story would wait.`);
    this.go(data.campaign);
    return true;
  }

  // BACK TO THE STORY: the story as it was kept, with what the trip found; after an ending, the CASE FILES
  leaveRoam() {
    const g = this.g;
    if (!this.roaming) return false;
    if (!this.canTravel()) {
      g.audio?.deny?.();
      g.hud.toast('<small>BACK TO THE STORY</small><br>Not now.', 1600);
      return false;
    }
    const { data, meta } = storyFromRoam(g.snapshot());
    for (const k of ROAM_ONLY) delete g.facts.facts[k];
    if (finished(data.facts.facts)) {
      // (the finished campaign's save, as the ending left it but for what the trip found; then the CASE FILES, on the
      // title, as THE CASES opens them)
      writeSave(g.slot == null ? 'auto' : g.slot, data, meta);
      try { window.sessionStorage.setItem(OPEN_CASES, '1'); } catch { /* the title, then */ }
      location.reload();
      return true;
    }
    this.inv?.release?.('travel');
    this.backFromRoam = true;
    this.go(data.campaign, data.engine);
    return true;
  }

  // in the page, behind a fade: a saved campaign started where it stands (a trip, or the story back from one), as a load
  // starts it (Runtime.resume), with the engine's rooms as they were kept when it is the story's
  go(campaign, engine = null) {
    const g = this.g;
    // (what the place left behind was saying ends with it, its end callbacks still run; and the menu closing over it
    // does not say it again)
    g.hud.skipAll?.();
    g.hud.cur = null;
    g.voice?.stop?.();
    // (nor does what it put up: a fragment's count read just before TRAVEL waited under the menu and came up over the
    // next place's arrival, 'MEMORY FRAGMENT 1 / 4 · THE BROKEN OBSERVATORY' in Rain City; and a line's text that
    // has stopped is not left on screen)
    g.hud.toastT = 0;
    g.hud.el?.toast?.classList.remove('on');
    if (!g.hud.talking && g.hud.el?.subs) g.hud.el.subs.innerHTML = '';
    g.closeMenu?.();
    this.cinema.end(true);
    g.transitioning = true;
    g.hud.fade(true);
    this.score.cut();
    g.audio?.chime?.();
    setTimeout(() => {
      try {
        g.hud.skipAll?.();
        if (engine) g.engine.restore(engine);
        g.held = campaign.held || null;
        this.travelFade = true;
        this.resume(campaign);
      } catch (e) {
        // (never a black screen: the fade lifts on whatever stands)
        console.warn('travel failed', e);
        this.travelFade = false;
        g.transitioning = false;
        g.hud.fade(false);
      }
    }, 900);
  }

  // the PREVIOUSLY card (ledger.PREVIOUSLY): three lines when a chapter starts or a save loads (a load in a mission
  // that has its own, `key`, says those: Mission 3's is not the morning before the crash)
  previouslySteps(chapter, key = null) {
    const lines = PREVIOUSLY[key || chapter];
    if (!lines) return [];
    return [{ card: ['PREVIOUSLY', CHAPTERS[chapter]?.name || '', ''], lines: lines.map((text) => ({ who: 'NONE', text })) }];
  }

  previously() {
    const g = this.g;
    const mk = this.deck?.mkey;
    const [k] = this.previouslySteps(this.chapter, PREVIOUSLY[mk] ? mk : null);
    if (!k) return;
    const token = (this.opening = { deck: this.deck, previously: true });
    g.hud.card(k.card[0], k.card[1], k.card[2], 600000);
    this.whenVoices(() => {
      if (this.opening !== token) return;
      this.cinema.play({ shots: null, lines: k.lines }, () => {
        if (this.opening !== token) return;
        this.hideCard();
        this.opening = null;
      });
    }, () => {});
  }

  // a tap on SKIP (or Enter): the line being said, and the shot it is in, ends, and only that (Cinema.skip). An
  // opening is its parts in turn (the PREVIOUSLY card, the chapter's card, the mission's card, the cold open, the
  // title's shots), each part its lines: one tap never ends a part, let alone the opening, so a player who taps SKIP
  // to pass a line of a cold open still hears the rest of it and the mission's card. What a skipped line sets is set
  skipOpening() {
    this.cinema.skip();
    return true;
  }

  // --- the opening of a mission: the chapter's card (when the chapter begins), the mission's card, the cold open
  // (OVERHAUL.md §8.9). The cards are said by the narrator and scored; the cold open waits for the voices.
  openMission(deck, kicker) {
    const g = this.g;
    const ch = CHAPTERS[this.chapter];
    const first = this.chapterStart && g.campaign.deck === 0;
    this.chapterStart = false;
    // (a bark from the place left behind, still being said as this one loads, does not run over its cards: a line said
    // in passing, with nothing waiting on its end, is dropped. The tour found the village's 'We cook at the first fire'
    // over Mission 6's card)
    // (nor do a rule's lines, as before they were marked for a reload: Runtime.sayRule; their mark goes with them)
    if (g.hud.talking && !(g.hud.subs || []).some((s) => s.done && !s.done.rule)) g.hud.skipAll();
    const token = (this.opening = { deck });
    const alive = () => this.opening === token && this.deck === deck && g.campaign?.lv;
    const steps = [];
    // a chapter's start: what came before (not for a new game), then the chapter's card
    if (first && this.chapter !== 'prologue') steps.push(...this.previouslySteps(this.chapter));
    if (first) steps.push({ card: [ch.name, ch.sub.split(':')[0], ch.question], cue: 'chapter', lines: chapterCardLines(this.chapter) });
    const co = deck.coldOpen;
    const cold = co?.lines || deck.intro || [];
    const card = { card: [kicker, deck.name, deck.title || deck.subtitle], cue: 'card', lines: missionCardLines(deck) };
    // a cold open the place stages (co.stage: what waits on co_<mkey> in the place, Mission 1's 05:40 sky, its
    // pulsing window, its streets before the people are out) holds from the start until the cold open is over
    const staged = !!co?.stage && cold.length > 0;
    if (staged) g.facts.set(coldFact(deck), true);
    // the year the cold open is shot in (co.year: Mission 12's 2196, Mission 11's 2026), every room of the level in it
    // that has it, each room's own put back after it
    const rooms = co?.year ? (this.level?.order || []).filter((r) => g.engine.statesOf(r).includes(co.year)) : [];
    const home = Object.fromEntries(rooms.map((r) => [r, g.engine.state(r)]));
    // (marked in the save until it is over: a save taken inside it loads with its rooms in their own years and the
    // opening played again, onSectorLoaded; v2.1 playtest acts-1-2 F05)
    const camp = g.campaign;
    camp.opening = { mkey: deck.mkey, home };
    const toYear = (y) => {
      let moved = false;
      for (const r of rooms) {
        const want = y || home[r];
        if (want && g.engine.state(r) !== want) { g.engine.setState(r, want, { force: true }); moved = true; }
      }
      if (!moved) return;
      this.weatherState = null; // (the place's sky, light and weather change at once, not eased)
      g.deckWorld.refresh?.();
    };
    // a cold open may come before the title (co.first: it plays, then the mission's card, then what follows the title)
    if (co?.first) {
      if (cold.length) steps.push({ shots: co.shots || 'default', lines: cold, cue: co.cue || null, cast: !!co.cast, year: co.year });
      steps.push(staged ? { ...card, unstage: true } : card);
      if (co.title?.lines?.length) steps.push({ shots: co.title.shots || 'default', lines: co.title.lines, cue: co.title.cue || null });
    } else {
      steps.push(card);
      if (cold.length) steps.push({ shots: co?.shots || 'default', lines: cold, cue: co?.cue || null, cast: !!co?.cast, year: co?.year });
    }
    // the opening is over (played or skipped): what the cold open sets is set, and what it starts starts
    const finish = () => {
      this.hideCard();
      this.opening = null;
      delete camp.opening;
      if (co?.year) toYear(null);
      if (co?.cast || staged) g.facts.set(coldFact(deck), false);
      if (co?.set) for (const [k, v] of Object.entries(co.set)) g.facts.set(k, v);
      if (co?.then) deck.fx?.[co.then]?.(this);
    };
    const next = (i) => {
      if (!alive()) return;
      if (i >= steps.length) return finish();
      const k = steps[i];
      if (co?.year) toYear(k.year || null); // (the cold open in its year; the cards and what follows in the place's own)
      if (k.card) {
        g.hud.card(k.card[0], k.card[1], k.card[2], 600000);
        if (k.unstage) g.facts.set(coldFact(deck), false); // (behind the title card, the place comes back to its hour)
        this.cinema.play({ shots: null, lines: k.lines, cue: k.cue }, () => next(i + 1));
      } else {
        this.hideCard();
        if (k.cast) g.facts.set(coldFact(deck), true); // (the cold open's people step into the shot)
        this.cinema.play({ shots: k.shots, lines: k.lines, cue: k.cue }, () => next(i + 1));
      }
    };
    // the voices first: the card counts them in (LOADING VOICES nn%)
    const k0 = steps.find((x) => x.card) || card;
    g.hud.card(k0.card[0], k0.card[1], k0.card[2], 600000);
    this.whenVoices(() => next(0), (pct) => alive() && g.hud.card(k0.card[0], k0.card[1], `LOADING VOICES ${pct}%`, 600000));
  }

  // then() once the chapter's voices are here; progress(nn) meanwhile
  whenVoices(then, progress) {
    const v = this.g.voice;
    if (!v?.usePacks || v.loading >= 1) return then();
    const iv = setInterval(() => progress(Math.round((v.loading || 0) * 100)), 200);
    v.ready().then(() => {
      clearInterval(iv);
      then();
    });
  }

  hideCard() {
    const el = typeof document !== 'undefined' && document.querySelector('#card');
    if (!el) return;
    clearTimeout(this.g.hud._cardT);
    el.classList.remove('on');
  }

  // what a state is called here: a year by default, or what the mission calls it (the village: thriving, abandoned, flooded)
  label(state) {
    return this.deck?.labels?.[state] || this.def.labels[state];
  }

  // --- objectives ------------------------------------------------------------------------------
  // [what to do, why]: a rewritten mission's first main thread not yet done, with its because line (Threads.js);
  // else the mission's objective layers, its own understanding, or its beat
  objectiveParts() {
    const g = this.g;
    const deck = this.deck;
    if (!deck) return ['', ''];
    if (this.roaming) return this.roamObjective();
    if (this.threads.on) {
      if (g.deckWorld.flags.beat_done) {
        // (a thread that is the way out itself, Mission 1's staff gate, is the objective until Kai is through it)
        const out = this.threads.current();
        if (out?.exit) return [out.goal || '', out.because || ''];
        return [deck.autoExit != null ? '' : LINES.next_open, ''];
      }
      const t = this.threads.current();
      return t ? [t.goal || '', t.because || ''] : ['', ''];
    }
    if (deck.objectives) {
      let o = null;
      for (const l of deck.objectives) if (g.facts.test(l.when)) o = l;
      return [o?.text || '', o?.because || ''];
    }
    const own = deck.objectiveFor?.(this); // a mission's own understanding, step by step
    if (own) return [own, ''];
    const done = g.deckWorld.flags.beat_done;
    const beat = this.beat;
    if (done) return ['The way on is open. Walk to the gate.', ''];
    return [beat.goal || 'Look around. Someone left something here.', ''];
  }

  // a trip's objective: where Kai is, what is still open here, and the way back (shown, never said)
  roamObjective() {
    const g = this.g, deck = this.deck, f = g.facts;
    const year = yearName(deck, g.engine.state(g.room) || g.campaign.roam?.year);
    const open = (this.threads.sides || []).filter((s) => {
      const st = sideState(f, deck, s);
      return st === 'active' || (st === 'open' && (!s.when || f.test(s.when)));
    }).length;
    const frags = (this.level?.interactables || []).filter((i) => i.kind === 'fragment');
    const found = frags.filter((i) => g.deckWorld.flags[`done_${i.id}`]).length;
    const what = [open ? `${open} side ${open === 1 ? 'story' : 'stories'} still open here` : 'No side story left open here', frags.length ? `${found} of ${frags.length} fragments found` : ''].filter(Boolean).join(' · ');
    return [`Free roam: ${placeName(deck)}, ${year}.`, `${what}. The story waits where you left it: BACK TO THE STORY on the case board.`];
  }

  objectiveText() {
    return this.objectiveParts()[0];
  }

  objective(force = false) {
    const [text, because] = this.objectiveParts();
    if (force || text !== this.lastObjective) {
      const animate = !force && !!this.lastObjective;
      this.lastObjective = text;
      this.g.hud.objective(text, animate);
      if (animate) this.g.audio.blip(330, 0.4, 'triangle', 0.15);
    }
    // the because line, and the tracked side story's next step, under the objective (shown, never spoken)
    const tr = this.threads.tracked();
    const side = tr ? `${tr.side.name}|${tr.thread.goal}` : '';
    if (force || because !== this.lastBecause || side !== this.lastSide) {
      this.lastBecause = because;
      this.lastSide = side;
      this.objectiveExtras(because, tr);
    }
  }

  // the place name on the HUD's year card: the quarter Kai is in, as its toast names it (an open place is one room,
  // named for its first quarter; a quarter that is a room of its own is that room); else the room's own name
  placeLabel(room) {
    const lv = this.level, qs = lv?.quarters, g = this.g;
    if (!qs?.length || !this.threads?.on) return room?.name;
    if (g.room !== lv.outdoorRoom) return qs.find((q) => q.room === g.room)?.name || room?.name;
    return qs[this.threads.here ?? g.campaign?.quarter ?? 0]?.name || room?.name;
  }

  objectiveExtras(because, tr) {
    if (typeof document === 'undefined') return;
    const el = document.querySelector('#objective');
    if (!el) return;
    if (!document.querySelector('#lvObj')) {
      const st = document.createElement('style');
      st.id = 'lvObj';
      // (the because line and the side story are light text with the goal's dark halo, on the objective's dark plate,
      // style.css: in dark ink with no shadow they vanished over lit windows, dark walls, water and the salt plain)
      st.textContent = `body.lastversion #objective .lvwhy { font-size: 12px; font-weight: 500; font-style: italic; color: #e8eef5; text-shadow: var(--halo); margin-top: 3px; }
        body.lastversion #objective .lvside { font-size: 11.5px; font-weight: 500; margin-top: 7px; color: #fff; text-shadow: var(--halo); }
        body.lastversion #objective .lvside small { display: block; font-size: 9.5px; letter-spacing: 0.16em; color: #ffd27a; }
        body.lastversion #objective .lvwhy:empty, body.lastversion #objective .lvside:empty { display: none; }
        body.lastversion.touch #objective .lvwhy { font-size: 11.5px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @media (orientation: portrait) { body.lastversion.touch #objective { top: calc(max(14px, env(safe-area-inset-top)) + 88px); } }`; // (upright, under the year card: the dock is by the right thumb now, style.css)
      document.head.appendChild(st);
    }
    const part = (cls) => el.querySelector(`.${cls}`) || el.appendChild(Object.assign(document.createElement('div'), { className: cls }));
    part('lvwhy').textContent = because || '';
    const side = part('lvside');
    side.innerHTML = '';
    if (tr) {
      const s = document.createElement('small');
      s.textContent = `SIDE STORY · ${tr.side.name}`;
      side.append(s, document.createTextNode(tr.thread.goal || ''));
    }
  }

  // --- facts, rules, the mission's end ------------------------------------------------------------
  onFact() {
    const g = this.g;
    if (!g.campaign?.lv || !this.deck) return;
    const deck = this.deck;
    const flags = g.deckWorld.flags;
    for (const r of deck.rules || []) {
      if (flags[`rule_${r.id}`]) continue;
      if (!g.facts.test(r.when)) continue;
      flags[`rule_${r.id}`] = true;
      if (r.set) for (const [k, v] of Object.entries(r.set)) g.facts.set(k, v);
      if (r.say) this.sayRule(r);
      this.reverseHeld = false;
      if (r.then) deck.fx?.[r.then]?.(this);
      if (this.reverseHeld) this.unfire(r);
    }
    this.threads.update(); // (a thread that is now done sets its fact, once, with what it carries)
    if (deck.done && !flags.beat_done && g.facts.test(deck.done)) g.beatDone();
    if (!this.opening) this.autoExit();
    g.deckWorld.refresh?.();
    this.mounted?.refresh(); // pieces of the place that wait on a fact (the braced wall, the drained basin)
    this.objective();
  }

  // a rule that gave REVERSE before the story reached it (inv.unlock, wrapped in the constructor) has not happened: it
  // waits to fire again, and what a zone set for it (Kai at the charred file early) is unset. The zone stays spent
  // while Kai stands in it (or it would fire every step) and is armed again, in the saved flags, once the story is
  // there (watchStep): then stepping into it, or watching the thing, sets it again (v2.1 playtest SYS-09)
  unfire(r) {
    const g = this.g, flags = g.deckWorld.flags;
    this.reverseHeld = false;
    delete flags[`rule_${r.id}`];
    const ids = new Set(condIds(r.when));
    (this.level?.triggers || []).forEach((z, i) => {
      const keys = Object.keys(z.set || {}).filter((k) => ids.has(k));
      if (!keys.length) return;
      flags[`trig_${i}`] = true;
      flags[`rearm_${i}`] = true;
      for (const k of keys) g.facts.set(k, false);
    });
  }

  // a mission whose last thread is its end (Helix's chamber, the fracture) goes on without a walk to the gate: once a
  // load (marked on the runtime, never in the saved flags: a save taken between the end and the exit loads with the
  // exit still to come, once its PREVIOUSLY card is over; Runtime.step)
  autoExit() {
    const g = this.g, deck = this.deck;
    if (deck?.autoExit == null || !g.deckWorld.flags.beat_done || this.autoExited === deck || !g.after) return;
    this.autoExited = deck;
    g.after(deck.autoExit, () => this.deck === deck && this.exitReached());
  }

  // a load, once its card is over: a moment that runs in callbacks (lines that set their facts as each ends; the
  // mission's `resumes`, { when, until, fx }) and that the save cut off plays again (its fx skips what is already
  // set). Else a save taken inside one loads with its rule fired and its last fact never set (U6 review: Mission 1's
  // rescue, then no voice in the speakers and no Mira; Mission 3's first cycle, its objective held for good)
  afterResume(deck) {
    const f = this.g.facts;
    for (const r of deck.resumes || []) if (f.test(r.when) && !f.test(r.until)) deck.fx?.[r.fx]?.(this);
    // a rule's lines the save cut off are said again (v2.1 playtest: Rook's call, its fact saved, lost to a reload)
    for (const r of deck.rules || []) if (r.say && this.g.deckWorld.flags[`saying_${r.id}`]) this.sayRule(r);
  }

  // a rule's lines, marked in the saved flags until their last one is over (or cut: a skip, a staged moment, the next
  // mission's card) (v2.1 playtest FT-12)
  sayRule(r) {
    const g = this.g, flags = g.deckWorld.flags, k = `saying_${r.id}`;
    flags[k] = true;
    const done = () => {
      delete flags[k];
      g.dirty = true;
    };
    done.rule = r.id; // (openMission: not a conversation that waits on its end)
    g.hud.say(r.say, g.facts, done);
  }

  // --- interactions --------------------------------------------------------------------------------
  useDeck(f) {
    const g = this.g;
    // a watcher on Kai's heels: no story moment now. A staged scene ends every chase (Runtime.step) and a talk stands
    // him still in its eyes, so a prompt by a patrol was a way out of being caught (v2.1 follow-up, F04 review: THE
    // FROZEN BLOCK tapped mid-chase, and the patrol walked past). Lose them first.
    if ((f.id.startsWith('dnpc:') || f.it?.kind === 'scene') && this.chased()) {
      g.audio.deny?.();
      g.hud.toast('<small>NOT NOW</small><br>Someone is after Kai. Lose them first.', 2200);
      return true;
    }
    this.spotT = g.time; // (what it says next was started at a spot: storyHolds)
    if (f.id.startsWith('dnpc:')) {
      this.talk(f.npc);
      return true;
    }
    if (!f.id.startsWith('deck:')) return false;
    const it = f.it;
    // a memory fragment read stays read (main.js reads it out; a trip lays only those not yet found: roam.js)
    if (it.kind === 'fragment') {
      if (!g.deckWorld.flags[`done_${it.id}`]) g.facts.set(`fr_${it.id}`, true);
      return false;
    }
    if (it.kind === 'scene') {
      this.scene(it);
      return true;
    }
    if (it.kind === 'socket' && (it.any || it.only)) {
      const held = g.held;
      const state = g.engine.state(g.room);
      if (it.only && state !== it.only) {
        g.audio.deny();
        this.say(it.no || LINES.socket_year);
        return true;
      }
      if (!held || !(it.any ? held.startsWith(it.needs) : held === it.needs)) {
        g.audio.deny();
        this.say(LINES.socket_empty);
        return true;
      }
      g.deckWorld.flags[`used_${held}`] = true;
      g.deckWorld.flags[`filled_${it.id}`] = true;
      g.held = null;
      g.audio.insert();
      g.fx.burst(it.pos, 0x7fe0a8, 30, 1.8);
      if (it.any) {
        const n = (g.facts.get('cells_in') || 0) + 1;
        g.facts.set('cells_in', n);
        g.facts.set(`cells_${n}`);
        g.hud.toast(`<small>LIFT POWER</small><br>${n} / 3`);
      } else {
        g.facts.set(`${it.needs}_connected`);
        g.hud.toast('Connected.');
      }
      g.campaign.flags = { ...g.deckWorld.flags };
      g.deckWorld.refresh();
      return true;
    }
    return false;
  }

  say(text, who = 'KAI') {
    this.g.hud.say([{ who, text }], this.g.facts);
  }

  // an NPC: a conversation with intent, or the beat's lines
  talk(n) {
    const g = this.g;
    const def = NPCS[n.crew.id];
    n.talkT = 6;
    n.model.userData.wave?.();
    const p = n.model.position;
    g.talkWith = [p.x, p.y + 1.55, p.z];
    g.audio.greet('CREW');
    if (n.isEcho) {
      // not here in this year: their echo plays what the year kept of them
      const year = this.label(g.engine.state(g.room));
      const name = def?.name || n.crew.name;
      const lines = n.n.echoLines || def?.echo || [{ who: 'NONE', text: LINES.echo }, ...(def?.barks?.length ? [{ who: def.voice, text: def.barks[0] }] : [])];
      g.facts.set(`echo_${n.crew.id}`);
      if (!g.deckWorld.flags[`echo_${n.n.id}`]) {
        g.deckWorld.flags[`echo_${n.n.id}`] = true;
        g.log.push(`${name} is not in ${year}. An echo stood in: <i>${(lines[lines.length - 1] || {}).text || ''}</i>`);
      }
      // (an echo is heard as one: through the echo chain, in their own recorded voice)
      this.playNode({ lines: lines.map((l) => (l.who === 'NONE' ? l : { ...l, ...(l.who === def?.voice ? { name: `${(def.first || name).toUpperCase()} (ECHO)` } : {}), voice: { fx: 'echo', ...(l.voice || {}) } })) }, n);
      return;
    }
    g.facts.set(`met_${n.crew.id}`);
    if (n.n.scene) {
      const sc = this.deck.scenes?.[n.n.scene];
      if (sc) this.playNode(sc, n, `npc_${n.n.id}`);
      return;
    }
    // (a mission's talks by the person's own id first: one person in several places, Orren's three, Sera at the anchor)
    // (a node that would complete a talk thread the story has not reached yet waits: Threads.talkNode)
    const dialogue = this.deck?.talks?.[n.n.id] || this.deck?.talks?.[n.crew.id] || n.n.dialogue || (n.n.lines?.length ? null : DIALOGUE[n.crew.id]);
    if (dialogue) {
      const mine = this.threads.on && (this.deck.talks?.[n.n.id] || this.deck.talks?.[n.crew.id]);
      const node = mine ? this.threads.talkNode(n)?.node : dialogue.find((d) => g.facts.test(d.when || 'true'));
      if (node) {
        this.playNode(node, n);
        return;
      }
    }
    const lines = n.n.lines || [{ who: 'NONE', text: '...' }];
    const beat = this.beat;
    const isBeat = beat.kind === 'encounter' && n.n.id.startsWith('npc_'); // a 'tasks' beat's person only talks
    this.playNode({ lines, choices: n.n.choices, after: n.n.after, beatDone: isBeat }, n);
    if (isBeat) g.log.push(`Met ${n.crew.name}${n.n.hologram ? ' - only an echo' : ''}.`);
  }

  // a scene: something to inspect
  scene(it) {
    const g = this.g;
    const deck = this.deck;
    if (it.task !== undefined) return this.task(it);
    const own = it.scene?.startsWith('deduce:') ? this.threads.deduction(it.scene.slice(7))
      : it.scene?.startsWith('residue:') ? this.threads.residue(it.scene.slice(8), g.engine.state(g.room))
        : it.scene?.startsWith('playback:') ? this.threads.playback(it.scene.slice(9))
          : it.scene?.startsWith('hold:') ? this.threads.holdUse(...((a) => [a[1], +a[2]])(it.scene.split(':')), g.engine.state(g.room))
            : deck.nodes?.[it.scene] ? deck.nodes[it.scene](this) : null; // (a mission's own node, built when used: M20's alignment)
    if (own) {
      g.audio.terminal();
      g.fx.burst(it.pos, it.color ?? 0xffc04a, 24, 1.4);
      this.playNode(own, null, it.id);
      return;
    }
    const sc = deck.scenes?.[it.scene];
    if (!sc) return;
    if (sc.when && !g.facts.test(sc.when, g.engine.state(g.room))) {
      const no = deck.scenes[`${it.scene}_no`];
      g.audio.deny();
      if (no) this.playNode(no);
      else this.say(LINES.scene_no);
      return;
    }
    g.audio.terminal();
    g.fx.burst(it.pos, it.color ?? 0xffc04a, 24, 1.4);
    if (it.once) {
      g.deckWorld.flags[`done_${it.id}`] = true;
      g.campaign.flags = { ...g.deckWorld.flags };
    }
    this.playNode(sc, null, it.id);
  }

  // one of a 'tasks' beat's things to do
  task(it) {
    const g = this.g;
    const beat = this.beat;
    const t = beat.tasks?.[it.task];
    if (!t) return;
    const flags = g.deckWorld.flags;
    if (flags[`done_${it.id}`]) return;
    if (t.state && g.engine.state(g.room) !== t.state) {
      g.audio.deny();
      this.say(t.no || LINES['task_' + t.state]);
      return;
    }
    flags[`done_${it.id}`] = true;
    g.campaign.flags = { ...flags };
    g.audio.terminal();
    g.fx.burst(it.pos, it.color ?? 0xffc04a, 30, 1.6);
    const done = beat.tasks.filter((_, i) => flags[`done_task_${i}`]).length;
    g.hud.toast(`<small>${beat.goal.split(':')[0].split('.')[0].toUpperCase()}</small><br>${done} / ${beat.tasks.length}`, 2000);
    const all = done === beat.tasks.length;
    g.hud.say(t.lines || [], g.facts, () => {
      if (!all) return;
      if (beat.after?.length) g.hud.say(beat.after, g.facts, () => g.beatDone());
      else g.beatDone();
    });
    g.deckWorld.refresh();
  }

  // a person without a speaker of their own (CREW) speaks with their name, colour and recorded voice
  // (OVERHAUL.md §8.4: NPCS vid, or the crowd voice the level gave them)
  voiced(lines, n) {
    if (!lines || !n) return lines || [];
    const gender = { her: 'f', his: 'm' }[(n.n.pronoun || n.crew.pronoun)?.their] || 'n';
    const id = NPCS[n.crew.id]?.vid ?? n.n.voiceExtra?.id ?? null;
    return lines.map((l) => (l.who === 'CREW' ? { ...l, name: l.name || (n.n.first || n.crew.name).toUpperCase(), color: l.color || n.crew.color, voice: { gender, ...(id ? { id } : {}), ...(l.voice || {}) } } : l));
  }

  // lines, then (maybe) a choice, then what follows
  playNode(node, n = null, id = null) {
    const g = this.g;
    // on a trip, the story's own scenes and conversations are said again and change nothing (roam.js roamFree): a
    // decision is not made twice, a moment not played twice. A side story's act as they do in the mission
    if (this.deck?.roam && !roamFree(this.deck, node)) node = { lines: node.lines, after: node.after, show: node.show };
    const lines = this.voiced(node.lines, n);
    if (node.show) g.facts.set(node.show, true);
    const after = () => {
      if (node.show) g.facts.set(node.show, false);
      if (node.choices) this.choose(node.choices, n, node, choiceHeader(node, lines, g.facts)); // (the last line said: F02)
      else {
        this.apply(node, n);
        if (node.after?.length) g.hud.say(this.voiced(node.after, n), g.facts, () => this.applyAfter(node));
        else this.applyAfter(node);
      }
    };
    if (lines.length) g.hud.say(lines, g.facts, after);
    else after();
  }

  applyAfter(node) {
    if (node.beatDone) {
      // a scene or choice beat's own closing lines (an encounter's person says theirs)
      const b = this.beat;
      if (b.after?.length && !b.npc && (b.kind === 'scene' || b.kind === 'choice') && !this.g.deckWorld.flags.beat_done) this.g.hud.say(b.after, this.g.facts, () => this.g.beatDone());
      else this.g.beatDone();
    }
    if (node.ending) this.ending(node.ending);
    if (node.playback) this.threads.play(node.playback); // (a piece is in: the next pick, or with the last the echoes re-enact it)
  }

  apply(node, n) {
    const g = this.g;
    const id = node.npc || n?.crew?.id;
    if (node.set) for (const [k, v] of Object.entries(node.set)) g.facts.set(k, v);
    if (node.ev) g.facts.set(`ev_${node.ev}`);
    if (id && node.trust) g.facts.set(`trust_${id}`, Math.max(-1, Math.min(1, (g.facts.get(`trust_${id}`) ?? 0) + node.trust)));
    if (id && node.know) g.facts.set(`know_${id}`, Math.max(g.facts.get(`know_${id}`) ?? 0, node.know));
    if (id && node.quest) g.facts.set(`quest_${id}`, node.quest);
    if (node.log) g.log.push(node.log);
    if (node.then) this.deck.fx?.[node.then]?.(this);
  }

  choose(choices, n, node, lastLine) {
    const g = this.g;
    const opts = choices.filter((c) => !c.when || g.facts.test(c.when));
    const $ = (s) => document.querySelector(s);
    const sp = lastLine ? (g.hud.speakers[lastLine.who] || {}).name || lastLine.name || '' : '';
    $('#choice .line').innerHTML = lastLine ? `${sp ? `<b>${sp}</b> ` : ''}${lastLine.text}` : '';
    $('#choice .body').innerHTML = opts.map((c, i) => `<button data-choice="${i}" class="${c.intent}"><small>${c.intent.toUpperCase()}</small>${c.label}</button>`).join('');
    for (const b of document.querySelectorAll('#choice [data-choice]')) {
      b.onclick = () => {
        const c = opts[+b.dataset.choice];
        g.closeMenu();
        g.audio.ui('press');
        this.apply(node, n);
        this.apply(c, n);
        g.log.push(`<i>${c.intent}:</i> "${c.label}"${n ? ` (${n.crew.name})` : ''}`);
        const done = () => {
          if (c.after?.length || node.after?.length) g.hud.say(this.voiced([...(c.after || []), ...(node.after || [])], n), g.facts, () => { this.applyAfter(c); this.applyAfter(node); });
          else {
            this.applyAfter(c);
            this.applyAfter(node);
          }
        };
        // Kai says what you chose (OVERHAUL.md §8.9), then the choice plays; a choice with consequences is scored
        const said = choiceLine(c);
        if (c.consequence) this.score?.cue('consequence');
        else if (c.cue) this.score?.cue(c.cue);
        const lines = [...(said ? [said] : []), ...this.voiced(c.lines, n)];
        if (lines.length) g.hud.say(lines, g.facts, done);
        else done();
      };
    }
    g.voice.stop();
    g.openMenu('choice');
  }

  // --- hints: Kai thinking --------------------------------------------------------------------------
  hint() {
    const g = this.g;
    const deck = this.deck;
    let text;
    let key;
    // (a mission's thought marked `over` comes first: where Kai stands, the current thread's tiers would mislead him)
    const over = deck?.thoughts?.find((x) => x.over && g.facts.test(x.when || 'true') && (!x.test || x.test(this)));
    const th = over ? { key: `over:${over.when}`, tiers: over.tiers } : this.threads.hint();
    if (th) {
      key = th.key;
      if (this.hintKey !== key) {
        this.hintKey = key;
        this.hintTier = 0;
      }
      text = th.tiers[Math.min(this.hintTier, th.tiers.length - 1)];
      this.hintTier++;
    }
    if (!text && deck.thoughts) {
      // a mission's own thoughts, some only in the room of their landmark
      const h = deck.thoughts.find((x) => !x.over && (!x.at || this.level?.anchorsAt?.[x.at]?.room === g.room) && g.facts.test(x.when || 'true'));
      if (h) {
        key = h.when;
        if (this.hintKey !== key) {
          this.hintKey = key;
          this.hintTier = 0;
        }
        text = h.tiers[Math.min(this.hintTier, h.tiers.length - 1)];
        this.hintTier++;
      }
    }
    if (!text) {
      // the nearest thing that will run backwards, once REVERSE is his
      const ph = this.inv?.hintFor();
      if (ph) {
        key = ph.key;
        if (this.hintKey !== key) {
          this.hintKey = key;
          this.hintTier = 0;
        }
        text = ph.tiers[Math.min(this.hintTier, ph.tiers.length - 1)];
        this.hintTier++;
      }
    }
    if (!text) {
      const r = this.level.rooms[g.room];
      const p = g.player.pos;
      const inside = (b) => p.x >= b[0] && p.x < b[3] && p.z >= b[2] && p.z < b[5];
      // (only the crossing Kai stands in: a place's challenges span the whole map, and the first of them is rarely here)
      const ch = r.challenges?.find((c) => inside(c.box)) || (this.level.place ? null : r.challenges?.[0]);
      const tiers = ch && ((g.facts.get('has_inversion') && HINTS_REVERSE[ch.key]) || HINTS[ch.key] || ch.hints);
      if (tiers) {
        key = ch.key + g.room;
        if (this.hintKey !== key) {
          this.hintKey = key;
          this.hintTier = 0;
        }
        text = tiers[Math.min(this.hintTier, 2)];
        this.hintTier++;
      } else text = LINES[g.deckWorld.flags.beat_done ? 'next_open' : this.beat.kind === 'contradiction' ? 'read_record' : this.beat.kind === 'tasks' ? 'tasks_around' : 'look_around'];
    }
    g.facts.inc('hints_used');
    g.audio.blip(988, 0.1);
    g.hud.say([{ who: 'KAI', text, hint: true }], g.facts); // (marked: a hint does not hide Kai from the watchers)
  }

  line(key) {
    return LINES[key] || '';
  }

  // --- the gate -----------------------------------------------------------------------------------------
  exitReached() {
    const g = this.g;
    const c = g.campaign;
    if (this.roaming) return; // (a trip has no way on: BACK TO THE STORY)
    if (!g.deckWorld.flags.beat_done) {
      if (!this.gateWarned) this.say(LINES[this.beat.kind === 'custom' ? 'gate_custom' : 'gate_scene']);
      this.gateWarned = true;
      return;
    }
    if (g.transitioning) return; // (a mission that ends on its own, and Kai at its gate as well: once)
    g.transitioning = true;
    const deck = this.deck;
    const last = c.sector >= deck.sectors - 1;
    const go = () => {
      g.hud.fade(true);
      this.score.cut();
      g.audio.chime();
      setTimeout(() => {
        if (!last) {
          c.sector++;
        } else {
          g.facts.set(`${deck.mkey}_done`);
          // telemetry (§9.8): how long the mission took, shown in the ending's stats
          if (c.mStart != null) g.facts.set(`time_${deck.mkey}`, Math.max(0, Math.round((g.playTime || 0) - c.mStart)));
          c.mStart = null;
          c.quarter = 0;
          c.track = null;
          c.sector = 0;
          if (c.deck + 1 < g.story.decks.length && this.chapter !== 'cases') c.deck++;
          else {
            // the chapter is done
            const next = ORDER[ORDER.indexOf(this.chapter) + 1];
            if (this.chapter === 'cases' || !next) {
              g.hud.fade(false);
              g.transitioning = false;
              this.casesDone();
              return;
            }
            c.chapter = next;
            this.chapter = next;
            g.run = next;
            g.story = this.makeStory(next);
            g.facts.set('lv_chapter', next);
            c.deck = 0;
            this.chapterStart = true; // the new chapter opens on its card, with its voices
            g.voice?.usePacks?.([voicePack('common'), voicePack(next)]);
          }
        }
        c.flags = {};
        c.visited = [];
        this.gateWarned = false;
        const arrive = () => {
          g.loadSector(true);
          g.hud.fade(false);
          g.transitioning = false;
        };
        // a new chapter's people may still be on their way (they started loading in its last mission)
        if (!castReady(this.chapter)) return this.waitForCast(this.chapter, arrive);
        arrive();
      }, 900);
    };
    if (last && deck.outro?.length) {
      this.score.cue(deck.hook?.cue || 'cliff');
      this.cinema.play({ shots: deck.hook?.shots || null, lines: deck.outro }, go);
    } else go();
  }

  // a case is closed: back to the CASE FILES, with what it changed
  casesDone() {
    this.caseFiles();
  }

  // --- each frame ----------------------------------------------------------------------------------------
  step(dt) {
    const g = this.g;
    if (!g.campaign?.lv || !this.level) return;
    this.cinema.step(dt);
    this.mounted?.step?.(dt); // (what moves in a place and carries Kai, Mission 7's gangways: every step, drawn or not)
    const facts = g.facts;
    const flags = g.deckWorld.flags;
    const p = g.player.pos;
    // the people: the watchers' bodies and walks, the animation budget, Ward 32's flickering figure
    this.watchers.update(dt);
    lodUpdate(g.deckWorld.npcs, g.camera.position); // (the watchers' people pose every frame: watchers.update)
    for (const n of g.deckWorld.npcs) {
      if (!n.model.visible) continue;
      if (n.n.flicker) n.model.userData.setOpacity?.(0.45 + 0.55 * Math.abs(Math.sin(g.time * 7.3) * Math.sin(g.time * 2.9 + n.n.seed)));
      // a crowd's walker keeps to the ground: its height from the two waypoints it walks between (crowds.js groundOf)
      const P = n.n.crowd && n.n.path;
      if (P && P[0].length > 2) {
        const to = P[n.wp], from = P[(n.wp - 1 + P.length) % P.length], m = n.model.position;
        const L = Math.hypot(to[0] - from[0], to[1] - from[1]);
        const f = L > 1e-3 ? 1 - Math.min(1, Math.hypot(to[0] - m.x, to[1] - m.z) / L) : 1;
        m.y = from[2] + (to[2] - from[2]) * f;
      }
    }
    // authored triggers
    (this.level.triggers || []).forEach((t, i) => {
      if (t.once && flags[`trig_${i}`]) return;
      if (t.room && t.room !== g.room) return;
      if (t.when && !facts.test(t.when, g.engine.state(g.room))) return; // (a trigger may ask for a year: @FUTURE)
      if (t.unseen && g.deckWorld.sentinels.some((s) => s.mode === 'chase' && s.def.room === g.room)) return; // (a stealth thread's: lose them first)
      // (nor while being caught: the catch drops the chase at once, and the walk back comes 700 ms later, main.js
      // deckSetback; in between Kai still stands in the arrival box, and the crossing counted, v2.1 playtest review F03)
      if (t.unseen && g.catching) return;
      const b = t.box;
      if (p.x >= b[0] && p.x < b[3] && p.y >= b[1] && p.y < b[4] && p.z >= b[2] && p.z < b[5]) {
        // an edge that wraps (M19's plain: walk off one side and come back from the other), seamlessly
        if (t.wrap) {
          const [dx, dz] = t.wrap;
          p.x += dx;
          p.z += dz;
          g.player.camPos?.add?.({ x: dx, y: 0, z: dz });
          g.camera.position.x += dx;
          g.camera.position.z += dz;
          return;
        }
        flags[`trig_${i}`] = true;
        for (const [k, v] of Object.entries(t.set)) facts.set(k, v);
        // a trigger that carries Kai somewhere (Helix's glass lift down into the chamber): a short fade, then there
        if (t.to && !g.catching) {
          g.catching = true;
          g.hud.fade(true);
          g.after(0.35, () => { g.player.place(t.to); g.hud.fade(false); g.catching = false; });
        }
      }
    });
    // Chronolith stability: drains in unstable places outside the mission's home year (the present, but for the
    // missions that belong to another year: 2196's city, Mira's memory), comes back in it; but not while a REVERSE hold
    // in an unstable place is draining it (inversion.js, OVERHAUL.md §7.5), or the hold would gain stability on balance
    const state = g.engine.state(g.room);
    const out = !this.roaming && state !== this.home(); // (a trip costs the Chronolith nothing)
    const outdoors = this.deck?.stableOutdoors && g.room === this.level.outdoorRoom;
    // (a cold open shot in another year costs nothing; nor does a staged moment, a mission's outro, or the way to the
    // next place: the Chronolith let go of Kai inside the Act I card after Mission 3's outro, v2.1 playtest FT-14; nor
    // the second or so between a mission's end and the exit it takes on its own, autoExit: Mission 3's fracture leaves
    // the control room in 2026 for 1.6 s before its outro)
    const ending = this.deck?.autoExit != null && !!g.deckWorld.flags.beat_done;
    const draining = out && this.unstable && !outdoors && !this.opening && !this.cinema?.active && !g.transitioning && !ending;
    const holding = this.unstable && !!this.inv?.active && !this.inv.active.lock;
    if (draining) this.stability = Math.max(0, this.stability - dt * 0.045);
    else if (!out && !holding) this.stability = Math.min(1, this.stability + dt * 0.1);
    g.hud.setStability(this.stability, !!facts.get('has_chronolith') && (out || this.stability < 1), draining);
    if (draining && this.stability <= 0 && !g.catching) this.snapBack();
    g.campaign.stability = this.stability;
    // a checkpoint reached is saved (main.stepDeck moves it without a save: a reload went back to the one before,
    // and the play time with it, v2.1 playtest SYS-06)
    if (g.checkpoint !== this.cpSeen) {
      if (this.cpSeen !== undefined && !g.catching && !g.transitioning) g.dirty = true;
      this.cpSeen = g.checkpoint;
    }
    this.anchorStep(dt);
    this.watchStep(dt);
    // Echo Step cooldown, the afterimage
    this.echoCd = Math.max(0, this.echoCd - dt);
    if (this.ghost && (this.ghostT -= dt) <= 0) this.ghost.visible = false;
    // an anchor holds only while the thing is in your hands
    if (this.anchored && g.held !== this.anchored) {
      this.anchored = null;
      g.engine.setGlobal('heldPersists', false);
    }
    // a load, once its card is over: the moments its save cut off play again; a mission that has ended goes on
    if (!this.opening && !g.transitioning) {
      if (this.pendingResume && !this.cinema.active && !g.hud.talking) {
        const deck = this.pendingResume;
        this.pendingResume = null;
        if (deck === this.deck) this.afterResume(deck);
      }
      this.autoExit();
    }
    // local loops: the city resets every so often; the watchers go back to their rounds
    if (this.loopT > 0 && !this.opening && !this.cinema.active) {
      this.loopT -= dt;
      if (this.loopT <= 0) this.loopReset();
    }
    // a staged moment (an opening, a cold open, a hook) is not the watchers' business: they walk their rounds, and see
    // nobody until it is over (nothing walks Kai back to a checkpoint while the camera is not his). Nor is a scene or a
    // conversation while its lines play (v2.1 playtest F04: M13's frozen block, caught mid-line on a patrol's street);
    // a THINK hint or a line said in passing is not one (a hint asked for would hide Kai). Only while Kai stays where
    // the lines began, though: walking on while they play is walking on, the watchers' business again (a scene tapped
    // is not a cloak to cross a patrol's street in)
    // (and for a breath after: a patrol that walked up during the lines does not catch Kai the moment they end)
    // (a staged moment ends any chase; lines Kai started at a spot only keep new eyes off him: a chase already under way
    // when they began goes on, or a story prompt by a patrol was a way out of being chased; v2.1 playtest review)
    const held = this.storyHolds(p);
    const staged = this.opening || this.cinema?.active;
    this.stagedT = staged ? 2 : Math.max(0, (this.stagedT || 0) - dt);
    this.graceT = staged || held ? 2 : Math.max(0, (this.graceT || 0) - dt);
    if (this.stagedT > 0 || this.graceT > 0) {
      const all = this.stagedT > 0;
      for (const s of g.deckWorld.sentinels) {
        if (!all && s.mode === 'chase') continue;
        s.suspicion = 0;
        if (s.mode === 'chase') s.mode = 'patrol';
      }
    }
    this.deck.step?.(this, dt);
    this.threads.step(dt);
    this.inv?.step(dt);
    // the watchers' meter: an open place is one room, so the shared rule (a watcher in the room) showed it empty all
    // mission long; here it shows only with a watcher within 30 m, or one that has noticed Kai
    let eye = false;
    for (const s of g.deckWorld.sentinels) {
      if (s.dead || s.def.room !== g.room || s.model?.visible === false) continue;
      if (s.suspicion > 0 || s.mode === 'chase' || Math.hypot(s.pos.x - p.x, s.pos.z - p.z) < 30) { eye = true; break; }
    }
    if (eye !== this.eyeShown && typeof document !== 'undefined') {
      this.eyeShown = eye;
      document.body.classList.toggle('lvnoeye', !eye);
    }
    // the YEAR button wears the colour of the year it will switch to
    if (typeof document !== 'undefined') {
      const list = g.engine.statesOf(g.room);
      const next = list.length > 1 ? list[(list.indexOf(state) + 1) % list.length] : state;
      if (next !== this.nextYear) {
        this.nextYear = next;
        document.body.style.setProperty('--lv-next', `var(--${String(next).toLowerCase()})`);
      }
    }
  }

  // the story's own lines are up or waiting: not a bark, not a place's ambient line (a PA), not a THINK hint (Runtime.hint
  // marks its line)
  storyLines() {
    const h = this.g.hud;
    if (h.subT > 0 && h.cur && !h.cur.done && !h.cur.bark && !h.cur.ambient && !h.cur.hint) return true;
    return h.subs.some((s) => !s.done && !s.bark && !s.ambient && !s.hint);
  }

  // a watcher of this room chasing Kai
  chased() {
    const g = this.g;
    return !!g.deckWorld?.sentinels?.some((s) => !s.dead && s.mode === 'chase' && s.def.room === g.room);
  }

  // the story's lines play and Kai stands where they began (within 4 m): the watchers keep off him (F04). Called every
  // step, so where the lines began is forgotten as soon as they are over
  storyHolds(p) {
    if (!this.storyLines()) {
      this.linesAt = null;
      return false;
    }
    // (only lines the player started at a spot, a scene or a talk tapped (useDeck: spotT): the story's own narration as
    // Kai walks, a thread's lines or a rule's, is no cloak; v2.1 playtest review)
    if (!this.linesAt) {
      if (!(this.g.time - (this.spotT ?? -1e9) < 1.5)) return false;
      this.linesAt = [p.x, p.z];
    }
    return Math.hypot(p.x - this.linesAt[0], p.z - this.linesAt[1]) < 4;
  }

  // --- loops (M9's nine minutes, M15's one day) ------------------------------------------------------------------
  // deck.loop: seconds, or { period, variants: [{ watch: { 'q0s0': path, ... } }], upward, until } (each reset moves the
  // patrols to the next variant; with upward, the rain falls upward for a second as the place jumps back; once `until`
  // holds, the loop is broken and resets no more)
  loopPeriod() {
    const l = this.deck?.loop;
    if (l?.until && this.g.facts.test(l.until)) return 0; // (the loop is broken: M9's carrier cut)
    return (typeof l === 'object' && l ? l.period : l) || 0;
  }

  loopReset() {
    const g = this.g, deck = this.deck, L = deck.loop;
    if (L?.until && g.facts.test(L.until)) return (this.loopT = 0); // (a broken loop resets no more)
    this.loopT = this.loopPeriod();
    g.facts.inc('loops_seen');
    g.facts.inc(`loops_${deck.mkey}`);
    this.loopVariant();
    for (const s of g.deckWorld.sentinels) {
      s.pos.copy(s.home);
      s.reset();
    }
    // the civilians go back to 08:05 as well, each a little further along its route than the time before (the loop
    // drifts: a loop with variants nudges its crowds' routes)
    if (L?.variants?.length) {
      const k = g.facts.get(`loops_${deck.mkey}`) || 0;
      g.deckWorld.npcs.forEach((n, i) => {
        const path = n.n.crowd && n.n.path;
        if (!path || path.length < 2) return;
        const j = (i + k * 2) % path.length;
        n.model.position.x = path[j][0];
        n.model.position.z = path[j][1];
        n.wp = (j + 1) % path.length;
      });
    }
    g.audio.sweep(false);
    this.score.cue('loopReset');
    g.hud.toast('<small>LOCAL LOOP</small><br>The street resets. You do not.', 2600);
    if (L?.upward && g.weather) {
      // the rain falls upward for a second (Weather's own particles, run the other way)
      const w = g.weather, was = w.kind;
      w.set('rain');
      w.k = { ...w.k, fall: -14, H: 8 };
      this.upward = true;
      g.after(1.1, () => {
        this.upward = false;
        // (the weather of the year Kai is in now: a switch during the second has set that year's already)
        const y = this.level?.place && this.level.years?.[this.weatherState];
        if (this.deck === deck) w.set(y ? y.weather || null : was);
      });
    }
    this.threads.onLoop();
    deck.onLoop?.(this, g.facts.get(`loops_${deck.mkey}`));
    g.deckWorld.refresh?.();
    this.mounted?.refresh();
  }

  // the patrols of the loop the place is in now
  loopVariant() {
    const L = this.deck?.loop, g = this.g;
    if (!L?.variants?.length || !g.deckWorld?.sentinels) return;
    const v = L.variants[(g.facts.get(`loops_${this.deck.mkey}`) || 0) % L.variants.length];
    for (const s of g.deckWorld.sentinels) {
      const key = Object.keys(v.watch || {}).find((k) => s.def.id?.endsWith(`_${k}`));
      const p = key && v.watch[key];
      if (!p?.length) continue;
      s.def.path = p;
      s.home.set(p[0][0], 0, p[0][1]);
      s.pos.copy(s.home);
      s.wp = 1 % p.length;
    }
  }

  snapBack() {
    const g = this.g, deck = this.deck;
    g.catching = true;
    this.inv?.release('snap');
    g.hud.fade(true);
    g.audio.deny();
    setTimeout(() => {
      // (the mission ended meanwhile, or the way to the next place began: that has its own fade, and the next card is
      // not the place for "The Chronolith let go of me", v2.1 playtest FT-14)
      if (this.deck !== deck || g.transitioning || !g.campaign?.lv) {
        g.catching = false;
        return;
      }
      g.engine.setState(g.room, this.home(), { force: true });
      g.player.place(g.checkpoint);
      this.stability = 0.5;
      g.hud.fade(false);
      g.catching = false;
      g.deckWorld.refresh();
      if (!this.opening && !this.cinema?.active) this.say(LINES.snap);
    }, 700);
  }

  // the year a mission belongs to (its states' first, when it says so: deck.home): where it starts, where stability
  // comes back, where a snap back takes Kai (the engine's baseline, 2049, for every other mission)
  home() {
    const g = this.g;
    const h = this.roaming ? g.campaign.roam?.year : this.deck?.home; // (a trip's home is the year it went to)
    return h && (!g.room || g.engine.statesOf(g.room).includes(h)) ? h : g.engine.baseline;
  }

  // --- the verbs -----------------------------------------------------------------------------------------
  shift(to) {
    const g = this.g;
    const { engine, facts } = g;
    // 4 is REVERSE now, not a fourth year
    if (to === '4') return this.inv?.trigger();
    if (!facts.get('has_chronolith')) {
      g.audio.deny();
      if (!this.noChronoSaid) {
        this.noChronoSaid = true;
        this.say(LINES.no_chronolith);
      }
      return;
    }
    if (engine.locked.has(g.room)) return g.audio.deny();
    if (to) {
      if (/^\d$/.test(to)) to = engine.states[+to - 1];
      else if (!engine.states.includes(to)) to = { PHYSICAL: 'PRESENT', ECHO: 'PAST' }[to];
      if (!to) return g.audio.deny();
      if (!engine.statesOf(g.room).includes(to)) {
        g.audio.deny();
        g.hud.toast(`<small>${this.label(to)}</small><br>${TOASTS.no_state}`, 1800);
        return;
      }
    }
    const ok = to ? engine.setState(g.room, to) : engine.cycle(g.room);
    if (!ok) return g.audio.deny();
    const s = engine.state(g.room);
    this.inv?.release('year'); // a process belongs to its year
    g.audio.sweep(s !== this.home());
    if (!g.settings.comfort) g.hud.flash({ PAST: 'rgba(255,200,120,0.35)', FUTURE: 'rgba(120,230,170,0.35)' }[s] || 'rgba(255,255,255,0.3)');
    facts.inc('switches');
    this.deck?.onShift?.(this, s);
    if (!facts.get('first_switch')) {
      facts.set('first_switch');
      g.log.push(`I switched the room to ${this.label(s)}. The place stayed. The year did not.`);
    }
  }

  echoStep() {
    const g = this.g;
    if (!g.facts.get('echo_step')) {
      g.audio.deny();
      g.hud.toast('<small>ECHO STEP</small><br>Not yet. Something in Act II comes loose.', 1800);
      return;
    }
    if (this.echoCd > 0) {
      g.audio.deny();
      g.hud.toast(`<small>ECHO STEP</small><br>${Math.ceil(this.echoCd)} s`, 1200);
      return;
    }
    if (this.stability < 0.3) {
      g.audio.deny();
      g.hud.toast('<small>ECHO STEP</small><br>Not enough stability.', 1600);
      return;
    }
    this.echoCd = 8;
    this.stability -= 0.25;
    const p = g.player.pos.clone();
    // the afterimage stays where you were; the watchers follow it
    if (!this.ghost) {
      this.ghost = makeCastModel('other', g.settings.hero);
      g.scene.add(this.ghost);
    }
    this.ghost.visible = true;
    this.ghost.position.set(p.x, p.y - g.player.half.y, p.z);
    this.ghost.rotation.y = Math.atan2(g.player.H.x, g.player.H.z);
    this.ghost.userData.setOpacity?.(0.55);
    this.ghostT = 4;
    g.deckWorld.setDecoy(p, 4);
    this.deck?.onEcho?.(this, p); // (a mission whose watchers answer an afterimage: M21's elites snap back)
    // and you step: forward, up to five metres, as far as the air is clear and the ground will take you
    const eye = g.player.eye(new THREE.Vector3());
    const fwd = g.player.forward(new THREE.Vector3()).setY(0).normalize();
    const clear = Math.min(5, g.player.rayDistance(eye, fwd, 5.4) - 0.4);
    let best = 0;
    for (let d = 0.5; d <= clear; d += 0.5) {
      const from = _v.copy(p).addScaledVector(fwd, d).setY(p.y + 0.3);
      if (g.player.rayDistance(from, new THREE.Vector3(0, -1, 0), 3) < 3) best = d;
    }
    if (best > 0) g.player.place([p.x + fwd.x * best, p.y, p.z + fwd.z * best, Math.atan2(g.player.H.x, g.player.H.z)]);
    g.audio.sweep(true);
    this.score.cue('echoStep');
    g.fx.burst(p.toArray(), 0x8ff4ff, 40, 2.4);
    if (!g.settings.comfort) g.hud.flash('rgba(140,240,255,0.3)');
    g.facts.inc('echo_steps');
  }

  anchor() {
    const g = this.g;
    if (!g.facts.get('has_chronolith')) return;
    const it = g.heldItem();
    if (!it) {
      g.audio.deny();
      this.say(LINES.empty_hands);
      return;
    }
    if (this.anchored === it.id) {
      g.hud.toast(`<small>ANCHORED</small><br>${it.label} already persists.`, 1400);
      return;
    }
    this.anchored = it.id;
    g.engine.setGlobal('heldPersists', true);
    this.stability = Math.max(0, this.stability - 0.15);
    g.audio.chime();
    g.fx.burst([g.player.pos.x, g.player.pos.y, g.player.pos.z], 0xffd27a, 30, 1.6);
    g.hud.toast(`<small>CAUSAL ANCHOR</small><br>${it.label} will survive the switch.`, 2400);
    g.facts.set('anchored_once');
    g.log.push(`I anchored the ${it.label.toLowerCase()}. It comes with me through the years now.`);
  }

  // what main.js's lights take from the place's year (places/years.js), or the edition's default themes
  themeFor(state) {
    return this.level?.place ? placeTheme(this.level, this.yearOf(state)) : null;
  }

  // where the sun shines from, for the shadows (a low sun throws long ones); outside a place main.js's own default
  // offset, given back (main.js keeps the last offset it was handed, so a null would leave the last place's sun)
  sunDir() {
    return (this.level?.place && placeSun(this.level, this.yearOf(this.g.room ? this.g.engine.state(this.g.room) : 'PRESENT'))) || DEFAULT_SUN;
  }

  // a place's year for a state (a room of the mission's own (Helix's rooms) shares the place's years)
  yearOf(state) {
    const ys = this.level?.years || {};
    return ys[state] ? state : Object.keys(ys)[0];
  }

  // each year of a place sets its own hour, air and density (its year, through themeFor); these hooks hand
  // main.js the place's own values
  stateNight(state, night) {
    // (a cold open staged at night, Mission 4's by the ring: night while it plays, co_<mkey>, whatever the year's hour)
    const co = this.deck?.coldOpen;
    return co?.night && this.g.facts?.get(coldFact(this.deck)) ? Math.max(night, co.night) : night;
  }

  stateFog() {
    return this.level?.place ? 0 : undefined; // the year's own fog colour, all of it
  }

  stateDensity() {
    return 1;
  }

  // each state tints the place
  theme(dt, state) {
    const g = this.g;
    if (g.mode !== 'deck') return;
    if (this.level?.place) return this.placeTheme(dt, state);
    g.deckWorld.setLook(state, Math.min(1, dt * 2));
  }

  // an open place: the year drives the fog, the night, the weather, the grade, the light probe, the sky,
  // the horizon and which of the place's pieces stand (OVERHAUL.md §4.5); no shared change
  placeTheme(dt, state) {
    const g = this.g;
    const lv = this.level;
    const s = this.yearOf(state);
    const y = lv.years[s];
    if (!y) return;
    const pal = lv.palette;
    pal.fog = y.fog;
    pal.density = 1;
    pal.night = y.night ?? 0;
    // (a cold open staged at night, stateNight: the air darkens with it, or the far ground and the sky's foot stayed the
    // afternoon's pale fog under the stars)
    const co = this.deck?.coldOpen, coNight = co?.night && g.facts.get(coldFact(this.deck)) ? co.night : 0;
    if (coNight) pal.fog = _fogC.setHex(y.fog).lerp(_nightC, Math.min(1, coNight * 1.2)).getHex();
    if (s !== this.weatherState) {
      const first = this.weatherState === null;
      this.weatherState = s;
      this.mounted?.setYear(s, first);
      this.placeYear = s;
      this.score.setYear(s, first);
      g.postfx.setGrade({ shadowTint: 0x2a4a66, highlightTint: 0xfff0dc, toning: 0.08, contrast: 1.1, saturation: 1, ...(y.grade || {}) });
      g.postfx.setEnvironment(y.ibl || null);
      const w = y.weather || null;
      if (w !== g.weather.kind) g.weather.set(w);
    }
    // (a cold open staged at night, stateNight: the horizon's band, painted in the year's own light, dims with it)
    const band = this.mounted?.horizon?.mat?.color;
    if (band) {
      const want = Math.max(0.05, 1 - coNight * 1.15);
      if (Math.abs(band.r - want) > 1e-3) band.setScalar(band.r + (want - band.r) * Math.min(1, dt * 2));
    }
    this.mounted?.update(dt);
  }

  roomEntered() {}

  // --- the case board (the journal) ------------------------------------------------------------------------
  // WHERE YOU ARE, THE QUESTIONS (each chapter's, with the evidence pinned under it, never the answer), ABILITIES,
  // SIDE STORIES (with a TRACK button), EVIDENCE, PEOPLE, WHAT YOU CHOSE, the CASE LOG
  renderJournal(game, el) {
    const { facts, campaign } = game;
    const deck = this.deck;
    const chapter = CHAPTERS[this.chapter] || CHAPTERS.prologue;
    const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const label = (k) => EV_LABELS[k] || k.replace(/_/g, ' ');
    const evs = Object.keys(facts.facts).filter((k) => k.startsWith('ev_') && facts.facts[k]).map((k) => `<li><span class="ev">◆</span> ${label(k.slice(3))}</li>`).join('') || '<li class="dim">Nothing pinned yet.</li>';
    // (a standing may be a word, not a number: Mission 14's trust_sera is what Kai told Sera at the memorial, 'accept',
    // 'deny' or 'ask'; from there on TRUST['accept'] had thrown and the case board, TRAVEL with it, would not open)
    const trustOf = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(-1, Math.min(1, Math.round(v))) : v === 'accept' ? 1 : 0);
    const knowOf = (v) => Math.max(0, Math.min(KNOWLEDGE.length - 1, Math.round(+v || 0)));
    const people = Object.values(NPCS).filter((n) => facts.get(`met_${n.id}`) && n.id !== 'kai').map((n) => {
      const st = npcState(facts, n.id);
      const tv = trustOf(st.trust);
      return `<li><span><b>${n.name}</b> <small>${n.role}</small></span><span class="st ${tv > 0 ? 'good' : tv < 0 ? 'bad' : ''}">${TRUST[tv].toUpperCase()} · ${KNOWLEDGE[knowOf(st.knowledge)].toUpperCase()}${st.quest ? ` · ${String(st.quest).toUpperCase()}` : ''}</span></li>`;
    }).join('') || '<li class="dim">Nobody yet.</li>';
    // ▶: a question, read by the narrator; a log line Kai can say from the packs, by Kai
    const can = (text, who) => !!game.voice?.plan?.(text, who);
    const play = (attr, i) => ` <button class="lvplay" data-${attr}="${i}" aria-label="Hear it">▶</button>`;
    // THE QUESTIONS: this chapter's and every earlier one's; the clues found under each; answered once its mission is done
    // (on a trip, the story's chapter: the questions are the story's)
    const storyCh = this.roaming ? campaign.roam?.back?.campaign?.chapter || game.run : this.chapter;
    const upTo = storyCh === 'cases' ? ORDER.length : ORDER.indexOf(storyCh) + 1;
    const qs = QUESTIONS.filter((q) => ORDER.indexOf(q.chapter) >= 0 && ORDER.indexOf(q.chapter) < Math.max(1, upTo));
    const qHtml = qs.map((q, i) => {
      const answered = facts.get(`${q.answer}_done`);
      const partly = !answered && (q.partly || []).some((m) => facts.get(`${m}_done`));
      const found = q.clues.filter((k) => facts.get(`ev_${k}`)).map((k) => `<li><span class="ev">◆</span> ${label(k)}</li>`).join('');
      return `<li><b>${esc(q.text)}</b>${can(q.text, 'NONE') ? play('q', i) : ''} <small class="dim">${answered ? 'ANSWERED' : partly ? 'PARTLY ANSWERED' : 'OPEN'}</small>${found ? `<ul class="board">${found}</ul>` : ''}</li>`;
    }).join('');
    // SIDE STORIES: the chapter's so far, and this mission's, with a track button
    // (on a trip, the side stories of the place Kai is in)
    const missions = this.roaming ? [deck] : missionsOf(this.chapter) || [];
    const here = deck ? missions.findIndex((m) => m.key === deck.key) : -1; // (this.deck is the story's copy of its mission)
    const sideRows = [];
    missions.forEach((m, mi) => {
      if (mi > here) return;
      const mk = { ...m, mkey: m.key };
      for (const sd of sidesOf(mk)) {
        const st = sideState(facts, mk, sd);
        if (mi < here && st === 'open') continue;
        if (st === 'open' && sd.when && !facts.test(sd.when)) continue; // (a side story offered only when it can be played)
        const key = `${m.key}:${sd.id}`;
        const tracked = campaign?.track === key;
        const btn = mi === here && st !== 'resolved' ? ` <button class="lvtrack" data-track="${key}">${tracked ? 'UNTRACK' : 'TRACK'}</button>` : '';
        sideRows.push(`<li><span><b>${esc(sd.name)}</b>${sd.case ? ' <small>CASE FILE</small>' : ''}</span><span class="st ${st === 'resolved' ? 'good' : ''}">${{ open: 'NOT STARTED', active: tracked ? 'TRACKED' : 'ACTIVE', resolved: 'RESOLVED' }[st]}</span>${btn}</li>`);
      }
    });
    // WHAT YOU CHOSE: the consequence ledger's facts, said plainly, then the other standings
    const chose = [];
    for (const [k, v] of Object.entries(CHOSEN)) {
      const val = facts.get(k);
      if (val === undefined || val === false || val === null || val === '') continue;
      const t = typeof v === 'string' ? (val === true ? v : `${v} <b>${String(val).toUpperCase()}</b>`) : v[val];
      if (t) chose.push(`<li>${t}</li>`);
    }
    for (const [k, l] of [['stabilizer_destroyed', 'Stabilizer destroyed'], ['civilians_freed', 'Civilians freed']]) if (facts.get(k)) chose.push(`<li>${l}: <b>${String(facts.get(k)).toUpperCase()}</b></li>`);
    const rev = game.log.slice().reverse();
    const logs = rev.map((l, i) => `<li>${l}${!/[<>]/.test(l) && can(l, 'KAI') ? play('log', i) : ''}</li>`).join('') || '<li class="dim">Nothing yet.</li>';
    const quarter = this.threads.on ? this.level?.quarters?.[this.threads.here ?? campaign.quarter ?? 0]?.name : null;
    // (the clues pinned under a question go on a line of their own: the board's rows are flex rows, and on a phone the
    // tour found them squeezed into a third column beside the question and its OPEN)
    if (typeof document !== 'undefined' && !document.querySelector('#lvBoardCss')) {
      const st = document.createElement('style');
      st.id = 'lvBoardCss';
      st.textContent = 'body.lastversion .board.questions > li { flex-wrap: wrap; align-items: baseline; } body.lastversion .board.questions > li > b { flex: 1 1 60%; }'
        + ' body.lastversion .board.questions > li > ul.board { flex: 1 0 100%; margin: 2px 0 0 12px; padding: 0; }'
        + ' body.lastversion .board.questions > li > ul.board li { border-bottom: 0; padding: 2px 0; justify-content: flex-start; gap: 6px; }';
      document.head.appendChild(st);
    }
    const where = this.roaming
      ? `<h3>WHERE YOU ARE</h3><p><b>FREE ROAM &middot; ${esc(placeName(deck))}</b><br><span class="dim">${esc(yearName(deck, game.engine.state(game.room)))} &middot; as Mission ${deck.n} left it${quarter ? ` &middot; ${esc(quarter)}` : ''}</span><br><span class="dim">The story waits at ${esc(String(campaign.roam?.meta?.where || '').replace(/^THE LAST VERSION · /, '') || 'its checkpoint')}.</span></p>
        <button class="lvback" id="lvBack">BACK TO THE STORY</button>`
      : `<h3>WHERE YOU ARE</h3><p><b>${chapter.name} &middot; ${deck?.name || ''}</b><br><span class="dim">${deck?.title || ''}${quarter ? ` &middot; ${quarter}` : deck?.sectors > 1 ? ` &middot; part ${campaign.sector + 1} of ${deck.sectors}` : ''} &middot; stability ${Math.round(this.stability * 100)}%</span></p>`;
    // (the questions and what is pinned under them first: on a phone the board opened on free roam's paragraph, about
    // a TRAVEL that Mission 1 cannot use yet. On a trip, TRAVEL stays near the top: it is what a trip is for)
    el.innerHTML = `
      ${where}
      ${this.roaming ? this.travelHtml(esc) : ''}
      <h3>THE QUESTIONS</h3><ul class="board questions">${qHtml}</ul>
      <h3>EVIDENCE</h3><ul class="board">${evs}</ul>
      ${this.inv?.abilitiesHtml() || ''}
      <h3>SIDE STORIES</h3><ul class="board sides">${sideRows.join('') || '<li class="dim">None yet.</li>'}</ul>
      <h3>PEOPLE</h3><ul class="board">${people}</ul>
      ${chose.length ? `<h3>WHAT YOU CHOSE</h3><ul class="board">${chose.join('')}</ul>` : ''}
      ${this.roaming ? '' : this.travelHtml(esc)}
      <h3>CASE LOG</h3><ul class="log">${logs}</ul>`;
    for (const b of el.querySelectorAll('.lvplay')) {
      b.onclick = (e) => {
        e.stopPropagation();
        if (b.dataset.q !== undefined) game.voice.speak(qs[+b.dataset.q].text, 'NONE');
        else game.voice.speak(rev[+b.dataset.log], 'KAI');
      };
    }
    for (const b of el.querySelectorAll('[data-travel]')) {
      b.onclick = (e) => {
        e.stopPropagation();
        this.travel(b.dataset.travel, b.dataset.year);
      };
    }
    const back = el.querySelector('#lvBack');
    if (back) {
      back.onclick = (e) => {
        e.stopPropagation();
        this.leaveRoam();
      };
    }
    for (const b of el.querySelectorAll('.lvtrack')) {
      b.onclick = (e) => {
        e.stopPropagation();
        campaign.track = campaign.track === b.dataset.track ? null : b.dataset.track;
        this.objective(true);
        this.renderJournal(game, el);
      };
    }
  }

  // TRAVEL on the case board: every place reached, the years opened there, what is still open in each (free roam)
  travelHtml(esc = (t) => String(t)) {
    this.travelCss();
    const g = this.g;
    if (!g.campaign?.lv || g.campaign.chapter === 'cases') return '';
    const list = this.travelList();
    const intro = 'Free roam: walk a place you have reached, in a year you opened there. No story gates; its side stories and fragments are still there. The story waits where you left it.';
    if (!list.length) return '<h3 id="lvTravel">TRAVEL</h3><p class="dim">Free roam opens once a mission is done: then you can walk back to its place.</p>';
    const here = this.roaming ? this.deck.key : null;
    return `<h3 id="lvTravel">TRAVEL</h3><p class="dim">${intro}</p><ul class="board travel">${this.travelRows(list, esc, here, 'li')}</ul>`;
  }

  // the travel list's rows (the case board's list items; the CASE FILES' cards, which are not case files: roamFile)
  travelRows(list, esc = (t) => String(t), here = null, tag = 'li') {
    return list.map((e) => `<${tag} class="${tag === 'li' ? '' : 'roamFile '}${e.key === here ? 'here' : ''}"><span><b>${esc(e.placeName)}</b> <small>Mission ${e.n} &middot; ${esc(e.mission)}${e.sides ? ` &middot; ${e.open ? `${e.open} side ${e.open === 1 ? 'story' : 'stories'} open` : 'side stories resolved'}` : ''}${e.fragments ? ` &middot; fragments ${e.found}/${e.fragments}` : ''}</small></span>`
      + `<span class="yrs">${e.years.map((y) => `<button class="lvgo" data-travel="${e.key}" data-year="${y}">${esc(e.names[y] || y)}</button>`).join('')}</span></${tag}>`).join('');
  }

  travelCss() {
    if (typeof document !== 'undefined' && !document.querySelector('#lvTravelCss')) {
      const st = document.createElement('style');
      st.id = 'lvTravelCss';
      st.textContent = 'body.lastversion .board.travel > li { flex-wrap: wrap; gap: 4px 8px; } body.lastversion .board.travel .yrs { display: flex; flex-wrap: wrap; gap: 4px; flex: 1 0 100%; }'
        + ' body.lastversion .board.travel button, body.lastversion .lvback { margin: 0; padding: 4px 9px; font-size: 11.5px; } body.lastversion .lvback { margin: 2px 0 6px; }'
        + ' body.lastversion .board.travel li.here b::after { content: " · YOU ARE HERE"; font-size: 10px; letter-spacing: .12em; opacity: .7; }'
        + ' body.lastversion #map header .lvmaptravel { margin-left: auto; margin-right: 8px; padding: 4px 10px; font-size: 12px; }'
        + ' body.lastversion .roamFile { padding: 6px 8px; border: 1px solid rgba(255,255,255,.12); border-radius: 6px; text-align: left; }'
        + ' body.lastversion .roamFile b { font-size: 13px; } body.lastversion .roamFile small { font-size: 11px; opacity: .75; }'
        + ' body.lastversion .roamFile .yrs { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; } body.lastversion .roamFile .yrs button { margin: 0; padding: 4px 9px; font-size: 11.5px; }'
        + ' body.lastversion .lvtabs { display: flex; gap: 6px; margin: 4px 0 2px; } body.lastversion .lvtabs button { margin: 0; padding: 6px 12px; font-size: 12px; opacity: .6; } body.lastversion .lvtabs button.on { opacity: 1; }';
      document.head.appendChild(st);
    }
  }

  // the map's TRAVEL button: to the case board's TRAVEL (shown once a mission is done)
  travelButton() {
    if (typeof document === 'undefined') return;
    this.travelCss();
    const head = document.querySelector('#map header');
    if (!head) return;
    let b = head.querySelector('.lvmaptravel');
    if (!b) {
      b = document.createElement('button');
      b.className = 'lvmaptravel';
      b.textContent = 'TRAVEL';
      b.setAttribute('aria-label', 'Travel to a place you have reached');
      head.insertBefore(b, head.querySelector('[data-close]'));
      b.onclick = (e) => {
        e.stopPropagation();
        this.g.openMenu('journal');
        document.querySelector('#lvTravel')?.scrollIntoView?.({ block: 'start' });
      };
    }
    b.style.display = this.travelList().length ? '' : 'none';
  }

  saveMeta() {
    const d = this.deck;
    if (this.roaming) {
      const m = roamMeta(this.g.campaign, this.g.engine.state(this.level?.outdoorRoom) || this.g.campaign.roam.year);
      return { where: m.where, chapter: m.chapter };
    }
    // (a finished campaign is its ending: CONTINUE opens its card, postGame)
    const end = this.chapter === 'finale' && this.g.facts.get('ending'); // (as resume's finishedLoad)
    if (end && ENDINGS[end]) return { where: `THE LAST VERSION · ENDING ${end}: ${ENDINGS[end].title}`, chapter: 'The case files and free roam' };
    const q = this.threads.on ? this.level?.quarters?.[this.g.campaign.quarter || 0]?.name : null;
    return { where: `THE LAST VERSION · ${d?.name || ''}`, chapter: `${typeof d?.n === 'number' ? `Mission ${d.n}` : `Case ${d?.no ?? d?.n}`}${q ? ` · ${q}` : d?.sectors > 1 ? ` · ${this.g.campaign.sector + 1}/${d.sectors}` : ''}` };
  }

  // the full map's own marks (playtest v2.1 FT-08): a ring where the current objective is, and in a pursuit the one Kai
  // is after (main.mapMarkers; MiniMap draws them on the full map only, the corner map stays as it was)
  mapMarkers() {
    const out = [], g = this.g, lv = this.level;
    if (!lv || !this.threads?.on || this.roaming || !g.deckWorld) return out;
    const t = this.threads.current();
    if (!t) return out;
    if (t.kind === 'chase') {
      for (const n of g.deckWorld.npcs) if (n.n.chase && n.model.visible) out.push({ x: n.model.position.x, z: n.model.position.z, kind: 'quarry' });
      return out;
    }
    const at = this.threadWhere(t);
    if (at) out.push({ x: at[0], z: at[2], kind: 'objective' });
    return out;
  }

  // where a thread is: its area's middle, the person it is with, else its landmark (or its first spot's)
  threadWhere(t) {
    const lv = this.level, g = this.g;
    if (Array.isArray(t.box)) return [(t.box[0] + t.box[2]) / 2, 0, (t.box[1] + t.box[3]) / 2];
    if (t.npc) {
      const n = g.deckWorld.npcs.find((x) => x.n.id === t.npc && x.model.visible);
      if (n) return [n.model.position.x, n.model.position.y, n.model.position.z];
    }
    const at = t.at ?? t.spots?.[0]?.at ?? t.spot?.at;
    if (Array.isArray(at)) return at;
    return (typeof at === 'string' && (lv.anchorsAt?.[at]?.pos || lv.landmarks?.[at])) || null;
  }

  mapTitle() {
    const d = this.deck;
    this.travelButton();
    if (this.roaming) return `FREE ROAM · ${placeName(d)}`;
    return `${d?.name || 'THE LAST VERSION'}${d?.sectors > 1 ? ` · PART ${this.g.campaign.sector + 1}/${d.sectors}` : ''}`;
  }

  // --- the ending ---------------------------------------------------------------------------------------------
  // the ending's card: what it was, the stats, THE CASES (the case files and free roam) and the title. Shown at the end
  // of the ending's sequence, and again when a finished campaign is loaded (postGame)
  endingCard(key, again = false) {
    const g = this.g;
    const e = ENDINGS[key];
    if (!e || typeof document === 'undefined') return false;
    const mins = Math.round(g.playTime / 60);
    const evs = Object.keys(g.facts.facts).filter((k) => k.startsWith('ev_') && g.facts.facts[k]).length;
    // each chapter's time, from the missions' own (time_<mkey>, stored as each one ended)
    const hm = (sec) => (sec >= 3600 ? `${Math.floor(sec / 3600)} h ${Math.round((sec % 3600) / 60)} min` : `${Math.max(1, Math.round(sec / 60))} min`);
    const times = ORDER.map((ch) => [ch, MISSIONS[ch].reduce((a, m) => a + (g.facts.get(`time_${m.key}`) || 0), 0)]).filter(([, t]) => t > 0)
      .map(([ch, t]) => `<span>${CHAPTERS[ch].name} ${hm(t)}</span>`).join('');
    const $ = (s) => document.querySelector(s);
    $('#ending .body').innerHTML = `
      <h2>ENDING ${key} — ${e.title}</h2>${again ? '<p class="dim">The story is over. The cases it walked past, and the places it reached, are still open.</p>' : ''}${e.text.map((p, i) => `<p${i === e.text.length - 1 ? ' class="dim"' : ''}>${i === e.text.length - 1 ? `“${p}”` : p}</p>`).join('')}
      ${again ? '' : '<p class="dim">A post-credit clock begins ticking. A voice confirms: “Version one hundred and eighteen.”</p>'}
      <div class="stats"><span>${Math.floor(mins / 60)} h ${mins % 60} min</span><span>${evs} pieces of evidence</span><span>standing: ${g.facts.get('faction') || 'neutral'}</span><span>ally: ${g.facts.get('ally') || 'none'}</span></div>
      ${times ? `<div class="stats">${times}</div>` : ''}
      <button class="big" id="lvCases">THE CASES<small>The case files: fourteen stories, each replayed from its place, and free roam</small></button>
      <button id="lvTitle">BACK TO THE TITLE</button>`;
    $('#lvCases').onclick = () => this.caseFiles();
    $('#lvTitle').onclick = () => location.reload();
    g.saveTo('auto');
    g.openMenu('ending');
    return true;
  }

  // a finished campaign loaded (CONTINUE, LOAD GAME or a chapter's CONTINUE on the save its ending wrote): its ending's
  // card again, with THE CASES and free roam behind it, never the Finale's hilltop with nothing left to do and "The
  // next door is open" (v2.1 playtest X2). The card opens once begin() is done: a load in this page runs inside it,
  // and begin() closes every panel when it returns (a card opened before that hid with the game still held under it,
  // v2.1 playtest F01's softlock)
  postGame() {
    const g = this.g, deck = this.deck;
    this.pendingResume = null;
    this.hideCard();
    const open = () => {
      if (!g.campaign?.lv || this.deck !== deck) return;
      g.hud.skipAll?.();
      this.score.cue('title');
      if (!this.endingCard(g.facts.get('ending'), true)) this.caseFiles();
    };
    if (typeof queueMicrotask === 'function') queueMicrotask(open);
    else Promise.resolve().then(open);
  }

  ending(key) {
    const g = this.g;
    const e = ENDINGS[key];
    if (!e) return;
    g.facts.set('ending', key);
    const show = () => this.endingCard(key);
    // a flash, a second of silence, the ending's music; the bible's text, what the ending adds, Kai's quote
    // (C through the echo), the epilogue; four clock ticks; the voice in every speaker; the overlay
    g.hud.flash('rgba(255,255,255,0.9)');
    g.audio.silence(1.0);
    this.score.cue(`ending:${key}`);
    // (nobody in the crowd says a line in passing over the flash and the silence before the ending's first shot: the
    // closing bot heard "The 41 is on time. I don't trust it." there, in every ending; the shots then hold them off)
    this.hushBarks();
    if (g.deckWorld) g.deckWorld.lastBarkT = g.time;
    g.deckWorld?.refresh?.(); // (the ending's people: finale.js, when ending == key)
    // (staged: the ring, then each line the ending adds where it happens, then Kai's quote and the epilogue over the road;
    // Kai himself is not on screen, hidePlayer: in C he was never born, and in A he stands under the 41's board in a body
    // of his own. The road's last shot is held over the clock's ticks and the voice, so the game camera never comes back
    // to him before the overlay)
    const lines = endingLines(key, g.facts);
    const dur = (l) => g.hud.durFn?.(l) || Math.max(2.2, l.text.length * 0.055);
    const plan = ENDING_SHOTS[key] || [];
    const n = 1 + (e.after?.length || 0);
    const shots = plan.map((s, i) => ({ ...s, t: Math.max(2.5, (i < n ? [lines[i]] : i === plan.length - 1 ? lines.slice(n) : []).reduce((a, l) => a + (l ? dur(l) : 0), 0)) }));
    const last = plan[plan.length - 1];
    const hold = last ? [{ cam: last.to || last.cam, to: last.to || last.cam, look: last.look }] : null;
    g.after(1.2, () => this.cinema.play({ shots: shots.length ? shots : null, lines, hidePlayer: true }, () => {
      this.score.cue('postcredit');
      this.cinema.play({ shots: hold, lines: [], total: 4.2, hidePlayer: true }, () => this.cinema.play({ shots: hold, lines: POSTCREDIT, hidePlayer: true }, show));
    }));
  }
}
