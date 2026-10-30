// THE LAST VERSION OF EARTH: FREE ROAM (the closing pass on the player's point 2: "make it open world").
//
// The story keeps its order: twenty-three missions, one after another. Free roam is beside it. Once a mission is done,
// its place can be travelled to from the case board (TRAVEL) or the map, in any year the player opened there, and walked
// with no story gates: no exit to the next mission, no watchers, no cold open, no loop, no stability drain, nothing
// that ends anything. What it kept is still there: its people as the story left them, its side stories (still to play
// if they were walked past), its memory fragments (the ones not yet found), its REVERSE processes (free to hold, once
// REVERSE is Kai's), its records. Leaving (BACK TO THE STORY) returns to the story where it was: the same mission, the
// same checkpoint, the same rooms in the same years, with whatever the trip found (a side story played, a fragment
// read) kept. A trip saves like the story does, in the same slot: a save taken on a trip loads on the trip, and the
// story waits inside it (campaign.roam.back) until BACK TO THE STORY. After an ending the trip comes back to the CASE
// FILES instead (the finished campaign's save is put back as it was).
//
//   ROAM            one roam deck per story mission, in story order (never in MISSIONS: nothing walks them as the story)
//   roamDeck(m)     the mission as a place to walk: its place, people, side stories, fragments, processes, records;
//                   its main threads only as props (r 0: the record still lies on the table, it no longer answers)
//   reachedPlaces   the travel list: every mission done, with the years opened there
//   roamYears(m)    the years a mission opened: its home year before the Chronolith (Missions 1 and 2), else all of them
//   roamSave        a save that is a trip: from a story save (or a trip's), with the story kept inside it
//   storyFromRoam   the story save a trip returns to, with what the trip found
//   roamFree        whether a node may act on the world in free roam (a side story's: yes; the story's own: lines only)
import { PROLOGUE } from './prologue.js';
import { ACT1 } from './act1.js';
import { ACT2 } from './act2.js';
import { ACT3 } from './act3.js';
import { ACT4 } from './act4.js';
import { FINALE } from './finale.js';
import { PLACES } from './places/index.js';
import { doneCond, factOf, sideFact, sideState, condIds, isRewritten } from './Threads.js';

// the story's missions in order (the runtime's ORDER; roam.js cannot import Runtime.js, which imports it)
const STORY = [PROLOGUE, ACT1, ACT2, ACT3, ACT4, FINALE].flat();
// the year names the HUD uses (index.js labels), and a mission's own names for them (Mission 4's THE VILLAGE)
export const YEAR_NAMES = { PRESENT: '2049', PAST: '2026', FUTURE: '2196' };
export const yearName = (m, y) => m?.labels?.[y] || YEAR_NAMES[y] || y;
// facts a trip keeps for itself, never carried back to the story
export const ROAM_ONLY = ['lv_roam'];
// the mission whose first thread gives Kai the Chronolith (has_chronolith): before it, a place has only the year he was in
const CHRONOLITH_N = 3;

// what a fact condition names (no quoted strings, no years, no true/false)
const ids = (c) => condIds(c || '');
const setKeys = (n) => [...Object.keys(n?.set || {}), ...(n?.ev ? [`ev_${n.ev}`] : []), ...(n?.choices || []).flatMap((c) => [...Object.keys(c.set || {}), ...(c.ev ? [`ev_${c.ev}`] : [])])];
// a node that does something besides its lines: sets, chooses, runs code, ends, plays back
const acts = (n) => !!(n && (n.choices?.length || setKeys(n).length || n.then || n.trust || n.know || n.quest || n.log || n.beatDone || n.ending || n.playback));

// --- the roam deck --------------------------------------------------------------------------------------------------
// The facts a mission's side stories wait for and set, and the scenes and nodes they play: what may still act in free
// roam (Runtime.playNode: anything else plays its lines and changes nothing, so the story's own choices, deductions and
// moments cannot be made again).
function sideUse(m) {
  const deck = { ...m, mkey: m.key };
  const core = new Set();
  const scenes = new Set();
  const procs = new Set();
  const sides = (m.quarters || []).flatMap((q) => q.sides || []);
  for (const s of sides) {
    core.add(sideFact(deck, s));
    for (const k of [...ids(s.done), ...ids(s.start), ...ids(s.when)]) core.add(k);
    for (const t of s.threads || []) {
      core.add(factOf(deck, t));
      for (const k of [...ids(doneCond(deck, t)), ...(t.of || []), ...Object.keys(t.set || {}), ...ids(t.when), ...(t.ev ? [`ev_${t.ev}`] : [])]) core.add(k);
      if (t.scene) scenes.add(t.scene);
      for (const sp of t.spots || []) scenes.add(sp.scene || sp.id);
      if (t.spot) scenes.add(t.scene || t.id);
      if (t.kind === 'invert' && t.target) procs.add(t.target);
      if (t.kind === 'talk' && t.npc) scenes.add(`talk:${t.npc}`);
    }
  }
  for (const p of procs) core.add(`inv_${p}_done`).add(`rev_${p}`);
  // a scene a side thread plays acts; so does its "_no" twin (the refusal in the wrong year)
  const nodes = new Set();
  for (const k of scenes) {
    if (m.scenes?.[k]) nodes.add(m.scenes[k]);
    if (m.scenes?.[`${k}_no`]) nodes.add(m.scenes[`${k}_no`]);
  }
  // a conversation node that sets what a side story waits for, or is offered only on the side story's facts
  for (const list of Object.values(m.talks || {})) for (const n of list) if (setKeys(n).some((k) => core.has(k))) nodes.add(n);
  return { core, nodes, procs };
}

export function roamDeck(m) {
  const use = sideUse(m);
  const sideIds = new Set((m.quarters || []).flatMap((q) => (q.sides || []).flatMap((s) => (s.threads || []).map((t) => t.id))));
  const deck = { ...m };
  // nothing that tells the story: its opening, its ending, its moments a load plays again, its own frame code, its loop,
  // its watchers, its end
  for (const k of ['coldOpen', 'hook', 'outro', 'intro', 'resumes', 'step', 'loop', 'onLoop', 'watch', 'done', 'objectives', 'objectiveFor', 'exitAt', 'startQuarter']) delete deck[k];
  Object.assign(deck, {
    chapter: 'roam', voiceGroup: m.chapter, origin: m.key, roam: true,
    sectors: 1, gateAfter: true, autoExit: null, unstable: false,
    drones: (m.quarters || [{}]).map(() => 0),
    beats: [{ kind: 'custom', goal: '' }],
    // its side stories, each answering only on its own threads before it (the story's threads are done: a side thread
    // that came after one of them waits on nothing); its main threads stay as the props they stand for
    quarters: (m.quarters || []).map((q) => ({
      name: q.name, barks: q.barks, threads: [],
      sides: (q.sides || []).map((s) => ({ ...s, threads: (s.threads || []).map((t) => ({ ...t, after: (t.after || []).filter((a) => sideIds.has(a)) })) })),
      inert: (q.threads || []).map((t) => ({ ...t, inert: true })),
    })),
    // a rule or a zone stays only when it sets what a side story waits for (Mission 15's flaps for the train)
    rules: (m.rules || []).filter((r) => Object.keys(r.set || {}).some((k) => use.core.has(k))),
    zones: (m.zones || []).filter((z) => Object.keys(z.set || {}).some((k) => use.core.has(k))),
    roamCore: use.core, roamNodes: use.nodes,
  });
  return deck;
}

export const ROAM = STORY.map(roamDeck);
export const roamIndex = (key) => ROAM.findIndex((d) => d.key === key);

// --- where a trip can go --------------------------------------------------------------------------------------------
// the years a mission opened (the Chronolith is Mission 3's: Missions 1 and 2 were seen in one year)
export function roamYears(m) {
  const states = m.states || ['PRESENT'];
  if ((m.n ?? 99) >= CHRONOLITH_N) return [...states];
  const home = states.includes(m.home) ? m.home : states.includes('PRESENT') ? 'PRESENT' : states[0];
  return [home];
}

// the place's name as the travel list gives it (Helix has a wing per mission)
export function placeName(m) {
  const base = PLACES[m.place]?.name || String(m.place || '').toUpperCase();
  return m.wing ? `${base} · ${m.wing.toUpperCase()} WING` : base;
}

// a mission is reached once it is done (the Finale's road once an ending is reached); facts: anything with get(k)
export const reached = (facts, m) => !!(facts.get(`${m.key}_done`) || (m.key === 'm23' && facts.get('ending')));

// the travel list: every mission done, in story order, with its years, its side stories' states and its fragments
export function reachedPlaces(facts, log = []) {
  const out = [];
  for (const m of STORY) {
    if (!reached(facts, m)) continue;
    const mk = { ...m, mkey: m.key };
    const sides = isRewritten(m) ? (m.quarters || []).flatMap((q) => q.sides || []) : [];
    const states = sides.map((s) => sideState(facts, mk, s));
    const lore = (m.fragments?.[0] || []).filter(Boolean);
    const found = lore.filter((t) => fragmentFound(facts, log, null, t)).length;
    out.push({
      key: m.key, n: m.n, mission: m.name, place: m.place, placeName: placeName(m),
      years: roamYears(m), names: Object.fromEntries((m.states || []).map((y) => [y, yearName(m, y)])),
      sides: sides.length, open: states.filter((s) => s !== 'resolved').length, fragments: lore.length, found,
    });
  }
  return out;
}

// a memory fragment found before: its fact (fr_<id>, set when it is read since free roam), or its line in the case log
// (which every save has kept since v2.0)
export function fragmentFound(facts, log, id, text) {
  if (id && facts.get(`fr_${id}`)) return true;
  return !!text && (log || []).some((l) => typeof l === 'string' && l.endsWith(text) && l.includes('Memory fragment.'));
}

// --- what a node may do in free roam --------------------------------------------------------------------------------
// A side story's scenes and the conversation nodes that move it on act as they do in the mission; a node of the story's
// own (a record already read, a decision already made, a moment already played) is said again and changes nothing.
export function roamFree(deck, node) {
  if (!deck?.roam || !acts(node)) return true;
  if (deck.roamNodes?.has(node)) return true;
  return setKeys(node).some((k) => deck.roamCore?.has(k));
}

// --- saves: a trip, and the story it returns to ---------------------------------------------------------------------
// what a trip keeps of the story to return to: the save minus what the trip carries on (its facts, case log, timeline
// and play time come from the trip when it ends: what it found stays found)
const CARRIED = ['facts', 'log', 'timeline', 'playTime', 'meta'];
export function stashOf(data) {
  const out = { ...data };
  for (const k of CARRIED) delete out[k];
  return JSON.parse(JSON.stringify(out));
}

// the story a save stands in: the save itself, or (a trip's save) the story kept inside it
export const storyOf = (data) => (data?.campaign?.chapter === 'roam' ? data.campaign.roam?.back || null : data);
// (an ending still playing, cut before its card, is not finished yet: Runtime.endingAgain plays it again; v2.1.1 M19)
export const finished = (facts) => !!facts?.ending && !facts?.ending_playing;

// a trip to mission `key` in `year`, from a save (`base`: the story's, or a trip's) and its meta (where, chapter, run).
// Returns the save data and meta to write; its campaign starts the trip (Runtime.start('roam', campaign)).
export function roamSave(base, baseMeta, { key, year, format = 24 } = {}) {
  const di = roamIndex(key);
  if (di < 0) throw new Error(`no roam deck ${key}`);
  const m = STORY[di];
  const years = roamYears(m);
  const y = years.includes(year) ? year : years[0];
  const was = base.campaign?.chapter === 'roam' ? base.campaign.roam : null;
  const back = was ? was.back : stashOf(base);
  const meta = was ? was.meta : { where: baseMeta?.where || '', chapter: baseMeta?.chapter || '', run: baseMeta?.run || back.campaign?.chapter || 'prologue' };
  const campaign = {
    lv: true, chapter: 'roam', deck: di, sector: 0, quarter: 0, flags: {}, visited: [], stability: 1,
    inv: { cap: 8, charge: 8, ...(base.campaign?.inv || {}) }, lvFormat: format, room: null, pos: null, held: null, track: null,
    roam: { key, year: y, years, fresh: true, back, meta },
  };
  const data = { ...base, mode: 'deck', campaign };
  delete data.meta;
  return { data, meta: roamMeta(campaign, y) };
}

// how a trip's save is described on the title and in the slots (and which chapter's CONTINUE it is under: the story's)
export function roamMeta(campaign, year) {
  const r = campaign.roam;
  const m = STORY[campaign.deck];
  const at = r.meta?.where ? r.meta.where.replace(/^THE LAST VERSION · /, '') : '';
  // (after an ending no story waits: the slot says which ending the trip comes back to; v2.1.1 playtest P19)
  const over = /^ENDING [A-C]\b/.test(at); // (the story's slot names its ending once it is finished: Runtime.saveMeta)
  return { where: `FREE ROAM · ${placeName(m)}`, chapter: `${yearName(m, year || r.year)}${at ? ` · ${over ? 'after' : 'the story waits at'} ${at}` : ''}`, run: r.meta?.run || 'prologue' };
}

// the story save a trip returns to: the story as it was kept, with the trip's facts (but its own), case log, timeline
// and play time
export function storyFromRoam(data) {
  const r = data.campaign?.roam;
  if (!r?.back) throw new Error('not a trip');
  const back = JSON.parse(JSON.stringify(r.back));
  const facts = { ...(data.facts?.facts || {}) };
  for (const k of ROAM_ONLY) delete facts[k];
  if (back.campaign) facts.lv_chapter = back.campaign.chapter;
  const out = { ...back, facts: { facts, fired: data.facts?.fired || [] }, log: data.log || [], timeline: data.timeline || [], playTime: data.playTime || 0 };
  // (REVERSE's charge comes back with Kai)
  if (out.campaign && data.campaign.inv) out.campaign.inv = { ...(out.campaign.inv || {}), ...data.campaign.inv };
  return { data: out, meta: { ...(r.meta || {}) } };
}
