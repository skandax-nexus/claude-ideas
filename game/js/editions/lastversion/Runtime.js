// THE LAST VERSION OF EARTH: the runtime main.js hands the game to when the
// edition is on. It owns the chapters and missions, the objective layers, scenes
// and dialogue choices, Chronolith stability, Echo Step, causal anchors, REVERSE
// (inversion.js), the case board and the endings. The engine, the worlds and the
// HUD are the same as Station Zero's; this is the layer that tells them what
// Kai's verbs are. Three years switch (Q, 1 2 3); nothing flips gravity, and
// there are no laws.
import * as THREE from '../../../vendor/three.module.min.js';
import { setChapters, latestFor, describeSave, listSaves, latestSave } from '../../ui/Saves.js';
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
import { Threads, placeThreads, isRewritten, sidesOf, sideState, coldFact, threadsOf, factOf, playFact } from './Threads.js';
import { QUESTIONS, PREVIOUSLY, CHOSEN } from './ledger.js';

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
};
export const ORDER = ['prologue', 'act1', 'act2', 'act3', 'act4', 'finale'];
export const MISSIONS = { prologue: PROLOGUE, ...ACTS };

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

const _v = new THREE.Vector3();
// the facts a replay starts from, handed over the page reload (sessionStorage)
const CASE_FACTS = 'afterzero.lv.caseFacts';
// a CASE FILES replay saves in a slot of its own, never listed and never a campaign's (Saves.js keys it like slot N):
// it never writes over the finished campaign it was opened from, nor over the autosave a full set of slots falls back to
export const CASE_SLOT = 'case';
// whose people a chapter loads behind its card: a replay's are its own mission's chapter's (cases.js voiceGroup), not
// every replay's at once
export const castKeyOf = (chapter, di = 0) => (chapter === 'cases' && MISSIONS.cases[di]?.voiceGroup) || chapter;
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
    });
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
    $('#title .ver').textContent = 'v2.0 · The Last Version of Earth';
    $('#begin small').textContent = 'Choose a chapter: the Prologue, Acts I to IV, the Finale, or the Cases';
    const dim = $('#title p.dim');
    if (dim) dim.textContent = 'A temporal thriller about a machine that lets you stand in different years of the same place. Twenty-three missions, three years of one world, three endings.';
    const ctl = $('#title .controls.desktop-only');
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
    const vt = $('#verdict .dim');
    if (vt) vt.textContent = '';
    // the people of the chapter most likely to be played next start loading on the title screen, with its voices
    const latest = listSaves().filter((x) => x.data?.campaign?.lv).sort((a, b) => (b.data.meta?.savedAt || 0) - (a.data.meta?.savedAt || 0))[0];
    const likely = CHAPTERS[latest?.data.campaign.chapter] ? latest.data.campaign.chapter : 'prologue';
    loadCast(castKeyOf(likely, latest?.data.campaign.deck));
    this.g.voice?.usePacks?.(this.packsFor(likely, latest?.data.campaign.deck ?? 0));
    this.sound();
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
      const list = ms.map((m) => `${typeof m.n === 'number' ? m.n : 'Case ' + m.n}. ${m.name}`).join(' · ');
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
    const ms = MISSIONS[chapter];
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
    // a story replayed from the CASE FILES screen: 'cases/<key>' (cases.js), with the facts the player had
    const asked = chapter;
    let replay = null;
    if (typeof chapter === 'string' && chapter.startsWith('cases/')) {
      replay = chapter.slice(6);
      chapter = 'cases';
    }
    if (!CHAPTERS[chapter]) chapter = 'prologue';
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
    g.run = chapter;
    this.chapter = chapter;
    g.story = this.makeStory(chapter);
    g.facts.rulesEnabled = false;
    g.facts.set('has_tick'); // the THINK button
    g.facts.set('lv_chapter', chapter);
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
    const vg = MISSIONS[chapter]?.[di]?.voiceGroup;
    // (the cases pack has no recordings: every replay speaks from its own mission's pack, so it is not fetched)
    return [voicePack('common'), ...(chapter === 'cases' ? [] : [voicePack(chapter)]), ...(vg && vg !== chapter ? [voicePack(vg)] : [])];
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
    const rows = CASE_FILES.map((c) => {
      const st = caseState(f, c);
      return `<div class="caseFile" data-state="${st}"><b>${c.name}</b><small>${c.where} · ${CASE_STATES[st]}</small>${c.key ? `<button data-case="${c.key}">REPLAY</button>` : '<small class="dim">part of the main story</small>'}</div>`;
    }).join('');
    $('#ending .body').innerHTML = `<h2>CASE FILES</h2><p class="dim">The stories the main road walked past. A replay starts from its place, with the facts you had.</p>
      <div class="caseFiles">${rows}</div>
      <button id="lvTitle">BACK TO THE TITLE</button>`;
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
        g.begin(`lv:cases/${b.dataset.case}`, null, CASE_SLOT);
      };
    }
    $('#lvTitle').onclick = () => location.reload();
    if (g.campaign?.lv && g.started) g.saveTo('auto');
    g.openMenu('ending');
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
    this.start(campaign.chapter, campaign);
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
    story.after.dark = deck.dark || 0;
    let level;
    // every mission stands in an open place (OVERHAUL.md §4): sector i loads the whole map and activates quarter i
    // (the edition no longer runs gen/ZoneGen.js or gen/LevelGen.js)
    if (deck.place) level = buildPlace(deck.place, story, c.sector, this, { deck });
    else if (deck.build) level = deck.build(story, c.sector, this);
    else throw new Error(`mission ${deck.mkey} has no place`);
    level.deckName = deck.name;
    const states = level.states || deck.states || ['PRESENT'];
    for (const id of level.order) {
      const room = level.rooms[id];
      g.engine.setAvailable(id, (room.states || states).filter((s) => this.def.states.includes(s)));
      for (const ch of room.challenges || []) ch.hints = HINTS[ch.key] || ch.hints;
      // a room starts in the mission's home year until the player switches it (saves restore the rest)
      const home = (room.states || states).includes(deck.home) ? deck.home : g.engine.baseline;
      if (!c.flags || !Object.keys(c.flags).length || !this.def.states.includes(g.engine.state(id))) g.engine.setState(id, home, { force: true });
    }
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
    if (intro) {
      g.held = null;
      const kicker = `${chapter.name} · ${typeof deck.n === 'number' ? `MISSION ${deck.n}` : `CASE ${deck.n}`}${deck.sectors > 1 ? ` · ${c.sector + 1} OF ${deck.sectors}` : ''}`;
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
    const next = this.chapter === 'cases' ? null : ORDER[ORDER.indexOf(this.chapter) + 1];
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
    else if (resumed) this.previously();
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

  // a tap on SKIP: the whole opening (or the staged moment) ends; what it sets is still set
  skipOpening() {
    if (this.opening) this.opening.skipped = true;
    this.cinema.skipAll();
    return true;
  }

  // --- the opening of a mission: the chapter's card (when the chapter begins), the mission's card, the cold open
  // (OVERHAUL.md §8.9). The cards are said by the narrator and scored; the cold open waits for the voices.
  openMission(deck, kicker) {
    const g = this.g;
    const ch = CHAPTERS[this.chapter];
    const first = this.chapterStart && g.campaign.deck === 0;
    this.chapterStart = false;
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
      if (co?.year) toYear(null);
      if (co?.cast || staged) g.facts.set(coldFact(deck), false);
      if (co?.set) for (const [k, v] of Object.entries(co.set)) g.facts.set(k, v);
      if (co?.then) deck.fx?.[co.then]?.(this);
    };
    const next = (i) => {
      if (!alive()) return;
      if (i >= steps.length || token.skipped) return finish();
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
    if (this.threads.on) {
      if (g.deckWorld.flags.beat_done) return [deck.autoExit != null ? '' : LINES.next_open, ''];
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

  objectiveExtras(because, tr) {
    if (typeof document === 'undefined') return;
    const el = document.querySelector('#objective');
    if (!el) return;
    if (!document.querySelector('#lvObj')) {
      const st = document.createElement('style');
      st.id = 'lvObj';
      st.textContent = `body.lastversion #objective .lvwhy { font-size: 12px; font-weight: 400; font-style: italic; opacity: 0.86; margin-top: 3px; }
        body.lastversion #objective .lvside { font-size: 11.5px; font-weight: 500; margin-top: 7px; opacity: 0.92; }
        body.lastversion #objective .lvside small { display: block; font-size: 9.5px; letter-spacing: 0.16em; }
        body.lastversion #objective .lvwhy:empty, body.lastversion #objective .lvside:empty { display: none; }
        body.lastversion.touch #objective .lvwhy { font-size: 10.5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @media (orientation: portrait) { body.lastversion.touch #objective { top: calc(max(14px, env(safe-area-inset-top)) + 150px); } }`; // (upright, under the dock, as style.css puts it; its edition top of 90 px sat behind the dock)
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
      if (r.say) g.hud.say(r.say, g.facts);
      if (r.then) deck.fx?.[r.then]?.(this);
    }
    this.threads.update(); // (a thread that is now done sets its fact, once, with what it carries)
    if (deck.done && !flags.beat_done && g.facts.test(deck.done)) g.beatDone();
    if (!this.opening) this.autoExit();
    g.deckWorld.refresh?.();
    this.mounted?.refresh(); // pieces of the place that wait on a fact (the braced wall, the drained basin)
    this.objective();
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
  }

  // --- interactions --------------------------------------------------------------------------------
  useDeck(f) {
    const g = this.g;
    if (f.id.startsWith('dnpc:')) {
      this.talk(f.npc);
      return true;
    }
    if (!f.id.startsWith('deck:')) return false;
    const it = f.it;
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
    const lines = this.voiced(node.lines, n);
    if (node.show) g.facts.set(node.show, true);
    const after = () => {
      if (node.show) g.facts.set(node.show, false);
      if (node.choices) this.choose(node.choices, n, node, lines[lines.length - 1]);
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
    if (node.playback) this.threads.play(node.playback); // (the last piece is in: the echoes re-enact it)
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
    const th = this.threads.hint();
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
      const h = deck.thoughts.find((x) => (!x.at || this.level?.anchorsAt?.[x.at]?.room === g.room) && g.facts.test(x.when || 'true'));
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
    this.say(text);
  }

  line(key) {
    return LINES[key] || '';
  }

  // --- the gate -----------------------------------------------------------------------------------------
  exitReached() {
    const g = this.g;
    const c = g.campaign;
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
    const out = state !== this.home();
    const outdoors = this.deck?.stableOutdoors && g.room === this.level.outdoorRoom;
    const draining = out && this.unstable && !outdoors && !this.opening; // (a cold open shot in another year costs nothing)
    const holding = this.unstable && !!this.inv?.active && !this.inv.active.lock;
    if (draining) this.stability = Math.max(0, this.stability - dt * 0.045);
    else if (!out && !holding) this.stability = Math.min(1, this.stability + dt * 0.1);
    g.hud.setStability(this.stability, !!facts.get('has_chronolith') && (out || this.stability < 1), draining);
    if (draining && this.stability <= 0 && !g.catching) this.snapBack();
    g.campaign.stability = this.stability;
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
    // nobody until it is over (nothing walks Kai back to a checkpoint while the camera is not his)
    if (this.opening || this.cinema?.active) {
      for (const s of g.deckWorld.sentinels) {
        s.suspicion = 0;
        if (s.mode === 'chase') s.mode = 'patrol';
      }
    }
    this.deck.step?.(this, dt);
    this.threads.step(dt);
    this.inv?.step(dt);
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
    const g = this.g;
    g.catching = true;
    this.inv?.release('snap');
    g.hud.fade(true);
    g.audio.deny();
    setTimeout(() => {
      g.engine.setState(g.room, this.home(), { force: true });
      g.player.place(g.checkpoint);
      this.stability = 0.5;
      g.hud.fade(false);
      g.catching = false;
      g.deckWorld.refresh();
      this.say(LINES.snap);
    }, 700);
  }

  // the year a mission belongs to (its states' first, when it says so: deck.home): where it starts, where stability
  // comes back, where a snap back takes Kai (the engine's baseline, 2049, for every other mission)
  home() {
    const h = this.deck?.home, g = this.g;
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
    return night;
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
    const people = Object.values(NPCS).filter((n) => facts.get(`met_${n.id}`) && n.id !== 'kai').map((n) => {
      const st = npcState(facts, n.id);
      return `<li><span><b>${n.name}</b> <small>${n.role}</small></span><span class="st ${st.trust > 0 ? 'good' : st.trust < 0 ? 'bad' : ''}">${TRUST[st.trust].toUpperCase()} · ${KNOWLEDGE[st.knowledge].toUpperCase()}${st.quest ? ` · ${st.quest.toUpperCase()}` : ''}</span></li>`;
    }).join('') || '<li class="dim">Nobody yet.</li>';
    // ▶: a question, read by the narrator; a log line Kai can say from the packs, by Kai
    const can = (text, who) => !!game.voice?.plan?.(text, who);
    const play = (attr, i) => ` <button class="lvplay" data-${attr}="${i}" aria-label="Hear it">▶</button>`;
    // THE QUESTIONS: this chapter's and every earlier one's; the clues found under each; answered once its mission is done
    const upTo = this.chapter === 'cases' ? ORDER.length : ORDER.indexOf(this.chapter) + 1;
    const qs = QUESTIONS.filter((q) => ORDER.indexOf(q.chapter) >= 0 && ORDER.indexOf(q.chapter) < Math.max(1, upTo));
    const qHtml = qs.map((q, i) => {
      const answered = facts.get(`${q.answer}_done`);
      const partly = !answered && (q.partly || []).some((m) => facts.get(`${m}_done`));
      const found = q.clues.filter((k) => facts.get(`ev_${k}`)).map((k) => `<li><span class="ev">◆</span> ${label(k)}</li>`).join('');
      return `<li><b>${esc(q.text)}</b>${can(q.text, 'NONE') ? play('q', i) : ''} <small class="dim">${answered ? 'ANSWERED' : partly ? 'PARTLY ANSWERED' : 'OPEN'}</small>${found ? `<ul class="board">${found}</ul>` : ''}</li>`;
    }).join('');
    // SIDE STORIES: the chapter's so far, and this mission's, with a track button
    const missions = MISSIONS[this.chapter] || [];
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
    el.innerHTML = `
      <h3>WHERE YOU ARE</h3><p><b>${chapter.name} &middot; ${deck?.name || ''}</b><br><span class="dim">${deck?.title || ''}${quarter ? ` &middot; ${quarter}` : deck?.sectors > 1 ? ` &middot; part ${campaign.sector + 1} of ${deck.sectors}` : ''} &middot; stability ${Math.round(this.stability * 100)}%</span></p>
      <h3>THE QUESTIONS</h3><ul class="board questions">${qHtml}</ul>
      ${this.inv?.abilitiesHtml() || ''}
      <h3>SIDE STORIES</h3><ul class="board sides">${sideRows.join('') || '<li class="dim">None yet.</li>'}</ul>
      <h3>EVIDENCE</h3><ul class="board">${evs}</ul>
      <h3>PEOPLE</h3><ul class="board">${people}</ul>
      ${chose.length ? `<h3>WHAT YOU CHOSE</h3><ul class="board">${chose.join('')}</ul>` : ''}
      <h3>CASE LOG</h3><ul class="log">${logs}</ul>`;
    for (const b of el.querySelectorAll('.lvplay')) {
      b.onclick = (e) => {
        e.stopPropagation();
        if (b.dataset.q !== undefined) game.voice.speak(qs[+b.dataset.q].text, 'NONE');
        else game.voice.speak(rev[+b.dataset.log], 'KAI');
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

  saveMeta() {
    const d = this.deck;
    const q = this.threads.on ? this.level?.quarters?.[this.g.campaign.quarter || 0]?.name : null;
    return { where: `THE LAST VERSION · ${d?.name || ''}`, chapter: `${typeof d?.n === 'number' ? `Mission ${d.n}` : `Case ${d?.n}`}${q ? ` · ${q}` : d?.sectors > 1 ? ` · ${this.g.campaign.sector + 1}/${d.sectors}` : ''}` };
  }

  mapTitle() {
    const d = this.deck;
    return `${d?.name || 'THE LAST VERSION'}${d?.sectors > 1 ? ` · PART ${this.g.campaign.sector + 1}/${d.sectors}` : ''}`;
  }

  // --- the ending ---------------------------------------------------------------------------------------------
  ending(key) {
    const g = this.g;
    const e = ENDINGS[key];
    if (!e) return;
    g.facts.set('ending', key);
    const mins = Math.round(g.playTime / 60);
    const evs = Object.keys(g.facts.facts).filter((k) => k.startsWith('ev_') && g.facts.facts[k]).length;
    // each chapter's time, from the missions' own (time_<mkey>, stored as each one ended)
    const hm = (sec) => (sec >= 3600 ? `${Math.floor(sec / 3600)} h ${Math.round((sec % 3600) / 60)} min` : `${Math.max(1, Math.round(sec / 60))} min`);
    const times = ORDER.map((ch) => [ch, MISSIONS[ch].reduce((a, m) => a + (g.facts.get(`time_${m.key}`) || 0), 0)]).filter(([, t]) => t > 0)
      .map(([ch, t]) => `<span>${CHAPTERS[ch].name} ${hm(t)}</span>`).join('');
    const show = () => {
      const $ = (s) => document.querySelector(s);
      $('#ending .body').innerHTML = `
        <h2>ENDING ${key} — ${e.title}</h2>${e.text.map((p, i) => `<p${i === e.text.length - 1 ? ' class="dim"' : ''}>${i === e.text.length - 1 ? `“${p}”` : p}</p>`).join('')}
        <p class="dim">A post-credit clock begins ticking. A voice confirms: “Version one hundred and eighteen.”</p>
        <div class="stats"><span>${Math.floor(mins / 60)} h ${mins % 60} min</span><span>${evs} pieces of evidence</span><span>standing: ${g.facts.get('faction') || 'neutral'}</span><span>ally: ${g.facts.get('ally') || 'none'}</span></div>
        ${times ? `<div class="stats">${times}</div>` : ''}
        <button class="big" id="lvCases">THE CASES<small>The case files: fourteen stories, each replayed from its place</small></button>
        <button id="lvTitle">BACK TO THE TITLE</button>`;
      $('#lvCases').onclick = () => this.caseFiles();
      $('#lvTitle').onclick = () => location.reload();
      g.saveTo('auto');
      g.openMenu('ending');
    };
    // a flash, a second of silence, the ending's music; the bible's text, what the ending adds, Kai's quote
    // (C through the echo), the epilogue; four clock ticks; the voice in every speaker; the overlay
    g.hud.flash('rgba(255,255,255,0.9)');
    g.audio.silence(1.0);
    this.score.cue(`ending:${key}`);
    if (g.player?.model) g.player.model.visible = false; // (the staged camera leaves it so: Player.updateCamera)
    g.deckWorld?.refresh?.(); // (the ending's people: finale.js, when ending == key)
    // (staged: the ring, then each line the ending adds where it happens, then Kai's quote and the epilogue over the road;
    // Kai himself is not on screen: in C he was never born, and in A he stands under the 41's board in a body of his own)
    const lines = endingLines(key, g.facts);
    const dur = (l) => g.hud.durFn?.(l) || Math.max(2.2, l.text.length * 0.055);
    const plan = ENDING_SHOTS[key] || [];
    const n = 1 + (e.after?.length || 0);
    const shots = plan.map((s, i) => ({ ...s, t: Math.max(2.5, (i < n ? [lines[i]] : i === plan.length - 1 ? lines.slice(n) : []).reduce((a, l) => a + (l ? dur(l) : 0), 0)) }));
    g.after(1.2, () => this.cinema.play({ shots: shots.length ? shots : null, lines }, () => {
      this.score.cue('postcredit');
      g.after(4.2, () => g.hud.say(POSTCREDIT, g.facts, show));
    }));
  }
}
