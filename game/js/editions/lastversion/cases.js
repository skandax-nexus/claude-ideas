// THE LAST VERSION OF EARTH: CASE FILES (OVERHAUL.md §5 "CASE FILES"; replaces the Cases chapter).
//
// The bible's ten optional missions and chains A-D live inside the missions now (their side stories). The CASE FILES
// screen (Runtime.caseFiles) lists the fourteen stories with their bible state: not started, active, resolved,
// consequence observed; it replays a story from its place, with the facts the player had (the story's own facts
// cleared, so it can happen again). The keys c_b and c_c stay replay entries (old saves load into them, at their
// old index); the ten new keys replay a side story of the mission it lives in.
//
//   CASE_FILES   the fourteen entries: { id, name, where, key?, start, resolved, observed } (conditions)
//   CASES        the 'cases' chapter's missions: c_b, c_c, then one replay per new key
//   caseState    'open' | 'active' | 'resolved' | 'observed' for an entry, from a fact store
import { CAST, WATER_HOOK, MARA_HOOK, intent } from './npcs.js';
import { M01 } from './prologue.js';
import { M06 } from './act1.js';
import { M13 } from './act2.js';
import { M14, M15, M16, M17, M18 } from './act3.js';
import { M20, M22 } from './act4.js';
import { doneCond } from './Threads.js';
import { PLACES } from './places/index.js';

const L = (who, text, when) => (when ? { who, text, when } : { who, text });
const C = (id) => CAST.findIndex((c) => c.id === id);
const says = (id, texts) => texts.map((text) => ({ who: CAST[C(id)].voice, name: CAST[C(id)].name.toUpperCase(), color: CAST[C(id)].color, text, ...(CAST[C(id)].voice === 'CREW' ? { voice: { id: CAST[C(id)].vid } } : {}) }));
const place = (o) => ({ kind: 'place', sectors: o.beats.length, ...o });
const E = (id, lines, extra = {}) => ({ kind: 'encounter', crew: C(id), lines: says(id, lines), ...extra });
const encounterQ = (id, lines, choices, extra = {}) => E(id, lines, { choices, ...extra });

// --- the two quest chains kept as replay entries (their saves load here) -----------------------------------------
export const C_B = place({
  key: 'c_b', n: 'B', chapter: 'cases', name: 'THE WATER THAT REMEMBERS', title: 'Tala and Niko, the Ancient Settlement', subtitle: 'A dry channel in the present was a river in the past.',
  place: 'valley_river', states: ['PRESENT', 'PAST', 'FUTURE'], drones: [0, 0], ambience: 'water', ambient: 'settlement',
  motto: 'WHO TAUGHT IT TO STAY', gate: 'THE RUINS',
  crew: C('tala'),
  intro: WATER_HOOK,
  beats: [
    { kind: 'contradiction', goal: 'Follow the water marks. Read the mural, and what it was painted over.', official: 'THE RIVER WAS A GIFT OF THE SKY', echo: 'THE RIVER WAS TAUGHT TO STAY BY THE ONE WITH NO DUST', clue: 'cleared', crew: C('tala'), toast: 'MURAL READ', log: 'The mural says the river was a gift. Under it: the river was taught to stay by the one with no dust.' },
    { kind: 'scene', goal: 'Find the three stone gates and align the flow without flooding the houses.', scene: 'gates', prompt: 'THE THREE GATES', npc: 'tala', lines: says('tala', ['Three gates. Stone does not argue, it only waits.']) },
  ],
  scenes: {
    gates: { when: '@PAST', lines: [L('NONE', 'Left, right, centre. The water takes the channel and leaves the houses. In 2196 the ruins now have a way through.')], set: { water_route: true, quest_tala: 'resolved' }, beatDone: true, log: 'The water route through the settlement is open in every year, including the ruins.' },
    gates_no: { lines: [L('KAI', 'The gates only move in the year the river was alive.')] },
  },
  outro: [L('TALA', 'The river knows the way now. So do you.'), L('NIKO', 'The observatory was built by people who watched water. Remember that, when you go up there.')],
});
export const C_C = place({
  key: 'c_c', n: 'C', chapter: 'cases', name: 'TWO RECORDS, ONE DISASTER', title: 'Mara Quill, the 2196 city', subtitle: 'Two archives name different first Chronolith operators.',
  place: 'lockcity', states: ['FUTURE', 'PAST', 'PRESENT'], drones: [0, 0], ambience: 'wind', ambient: 'future',
  motto: 'TRUE FOR WHOM', gate: 'THE MUSEUM DISPLAY',
  crew: C('mara'),
  intro: MARA_HOOK,
  beats: [
    { kind: 'contradiction', goal: 'Compare the timestamps. Recover the damaged audio cylinder.', official: 'FIRST OPERATOR: E. ROOK - 05:40', echo: 'FIRST OPERATOR: K. VAREN - 05:40', clue: 'cleared', crew: C('mara'), toast: 'BOTH TRUE', log: 'Both records are accurate for different branches. Rook in one. Me in the other. Same minute.' },
    encounterQ('mara', ['Both records are true. Which branch do you want to live in?'], [
      intent('investigate', 'Neither. I want the museum display.', { lines: says('mara', ['Then go and look at it in another year. Displays are honest in the year they were made.']), set: { quest_mara: 'resolved', ev_dual_archive: true }, beatDone: true }),
      intent('comfort', 'I\'m not calling anyone a liar.', { lines: says('mara', ['Good. That is the whole job. Go and look at the display in another year.']), set: { quest_mara: 'resolved', ev_dual_archive: true }, trust: 1, beatDone: true }),
    ], { goal: 'Inspect the museum display in another era.' }),
  ],
  outro: [L('MARA', 'Incomplete is not the same as false. Write that over the door, and nobody has to be a liar.')],
});

// --- a side story, replayed from its place -------------------------------------------------------------------------
// The replay is the mission's place, its people and what the story itself uses (its processes, talks, scenes,
// deductions, rules), with only the story's threads, from the quarter it lives in. Its lines are the mission's own
// (voiceGroup: the replay speaks from the mission's pack). The facts the story sets or waits for are cleared when it
// starts (clear), so it can happen again; everything else the player had stays true.
const IDENT = /\b[a-z_][a-z0-9_]*\b/gi;
const idents = (cond) => (typeof cond === 'string' ? cond.replace(/"[^"]*"/g, '').match(IDENT) || [] : []).filter((k) => !['true', 'false'].includes(k) && !/^[A-Z]+$/.test(k));
function replay(m, sideId, o) {
  const qi = m.quarters.findIndex((q) => (q.sides || []).some((s) => s.id === sideId));
  const side = m.quarters[qi].sides.find((s) => s.id === sideId);
  const ts = side.threads;
  const ids = new Set(ts.map((t) => t.id));
  const used = { proc: new Set(o.processes || []), talk: new Set(o.talks || []), scene: new Set(o.scenes || []), deduce: new Set(), rule: new Set(o.rules || []) };
  for (const t of ts) {
    if (t.kind === 'invert') used.proc.add(t.target);
    for (const k of t.of || []) if (k.startsWith('rev_')) used.proc.add(k.slice(4));
    if (t.kind === 'talk') used.talk.add(t.npc);
    if (t.scene) used.scene.add(t.scene);
    for (const s of t.spots || []) used.scene.add(s.scene || s.id);
    if (t.deduction) used.deduce.add(t.deduction);
  }
  const pick = (obj, set) => Object.fromEntries(Object.entries(obj || {}).filter(([k]) => set.has(k) || set.has(k.replace(/_no$/, ''))));
  const talks = pick(m.talks, used.talk), scenes = pick(m.scenes, used.scene);
  // what to clear: what the story waits for, and what its own talks, scenes and rules set
  const clear = new Set([...idents(side.done), ...ts.flatMap((t) => [...idents(doneCond({ ...m, mkey: m.key }, t) || ''), ...(t.of || []), ...Object.keys(t.set || {})])]);
  const sets = (n) => { for (const k of Object.keys(n?.set || {})) clear.add(k); for (const c of n?.choices || []) for (const k of Object.keys(c.set || {})) clear.add(k); };
  for (const nodes of Object.values(talks)) nodes.forEach(sets);
  Object.values(scenes).forEach(sets);
  for (const p of (m.processes || []).filter((x) => used.proc.has(x.id))) { clear.add(`inv_${p.id}_done`); clear.add(`rev_${p.id}`); }
  const rules = (m.rules || []).filter((r) => used.rule.has(r.id));
  for (const r of rules) Object.keys(r.set || {}).forEach((k) => clear.add(k));
  return {
    key: o.key, n: o.n, chapter: 'cases', origin: m.key, voiceGroup: m.chapter, name: side.name, title: o.title, subtitle: o.subtitle,
    place: m.place, wing: m.wing, exitAt: PLACES[m.place]?.exits?.[m.key], sectors: 1, home: m.home, states: m.states, drones: m.quarters.map(() => 0), ambience: m.ambience, ambient: m.ambient,
    motto: o.motto || m.motto, gate: side.name, crew: m.crew, named: m.named,
    minutes: { main: side.minutes, optional: 0 }, autoExit: 1.2,
    processes: (m.processes || []).filter((p) => used.proc.has(p.id)), spots: o.spots ? m.spots : undefined, zones: m.zones,
    beats: [{ kind: 'custom', goal: side.name }],
    quarters: m.quarters.map((q, i) => ({ name: q.name, threads: i === qi ? ts.map((t) => ({ ...t, after: (t.after || []).filter((a) => ids.has(a)) })) : [], sides: [] })),
    startQuarter: qi,
    talks, scenes, deductions: pick(m.deductions, used.deduce), rules, fx: m.fx, overlay: m.overlay,
    clear: [...clear].filter((k) => !k.startsWith('t_')).sort(),
    done: side.done,
  };
}

const R = {
  child: replay(M01, 'booth', { key: 'c_child', n: 'E', title: 'Rain City, the first morning', subtitle: 'A photo booth that printed with nobody in it.' }),
  train: replay(M15, 'train', { key: 'c_train', n: 'F', title: 'The lock city', subtitle: 'An evacuation train that arrives yesterday.' }),
  letter: replay(M17, 'letter', { key: 'c_letter', n: 'G', title: 'The Witness\'s archive', subtitle: 'An envelope in Mira\'s handwriting.' }),
  house: replay(M20, 'house', { key: 'c_house', n: 'H', title: 'Mira\'s memory', subtitle: 'A house that belongs to nobody on record.' }),
  signal: replay(M18, 'signal', { key: 'c_signal', n: 'I', title: 'The fracture', subtitle: 'A signal from a pocket of time.' }),
  names: replay(M16, 'names', { key: 'c_names', n: 'J', title: 'The museum of failed worlds', subtitle: 'The names no world kept.' }),
  debt: replay(M06, 'debt', { key: 'c_debt', n: 'K', title: 'The clockmaker\'s house', subtitle: 'An arm that has turned for fifty years.' }),
  ninth: replay(M13, 'evidence', { key: 'c_ninth', n: 'L', title: 'The nine-minute war', subtitle: 'Who buried the first device?' }),
  garden: replay(M14, 'garden', { key: 'c_garden', n: 'M', title: 'The 2196 city', subtitle: 'A garden by a dry channel.' }),
  record: replay(M22, 'record', { key: 'c_record', n: 'N', title: 'The first second', subtitle: 'What each ending costs.' }),
};

// the cases chapter: c_b and c_c first (old saves point at their index), then the replays
export const CASES = [C_B, C_C, R.child, R.train, R.letter, R.house, R.signal, R.names, R.debt, R.ninth, R.garden, R.record];

// --- the fourteen case files ---------------------------------------------------------------------------------------
// start: the story has begun; resolved: its outcome is set; observed: its consequence has been seen later on
export const CASE_FILES = [
  { id: 'chainA', name: 'LAST TRAIN HOME', where: 'Missions 1 and 15', key: null, start: 'quest_jun || jun_board', resolved: 'jun_line || jun_evidence', observed: 'quest_jun == "observed" || ev_gal_jun' },
  { id: 'chainD', name: 'THE TECHNICIAN\'S KEY', where: 'Missions 2, 3, 8, 18 and 21', key: null, start: 'quest_iven', resolved: 'quest_iven == "resolved"', observed: 'last_signal || ally == "iven" || ev_iven_signed' },
  { id: 'chainB', name: 'THE WATER THAT REMEMBERS', where: 'Mission 5', key: 'c_b', start: 'quest_tala', resolved: 'water_route', observed: 'water_route && (garden_restored || ev_tala23)' },
  { id: 'chainC', name: 'TWO RECORDS, ONE DISASTER', where: 'Missions 15 and 16', key: 'c_c', start: 'quest_mara', resolved: 'quest_mara == "resolved" || ev_dual_archive', observed: 'ev_dual_archive && (ev_mara_radio || ev_museum_his)' },
  { id: 'child', name: 'THE CHILD IN THREE PHOTOGRAPHS', where: 'Missions 1, 9, 11 and 20', key: 'c_child', start: 'ev_three_notes || ev_three_photos', resolved: 'child_resolved', observed: 'child_resolved && ev_three_photos' },
  { id: 'train', name: 'THE TRAIN THAT ARRIVES YESTERDAY', where: 'Mission 15', key: 'c_train', start: 'm15_jun', resolved: 'quest_jun == "observed"', observed: 'quest_jun == "observed" && ev_gal_jun' },
  { id: 'letter', name: 'THE UNSENT LETTER', where: 'Mission 17', key: 'c_letter', start: 't_m17_reconstruct', resolved: 'letter', observed: 'letter == "delivered" && m21_wrists' },
  { id: 'house', name: 'THE HOUSE WITH NO OWNER', where: 'Mission 20', key: 'c_house', start: 'ev_no_owner_door', resolved: 'ev_no_owner', observed: 'ev_no_owner && ending == "C"' },
  { id: 'signal', name: 'THE LAST SIGNAL', where: 'Mission 18', key: 'c_signal', start: 'side_m18_signal', resolved: 'last_signal', observed: 'last_signal && ally == "iven"' },
  { id: 'names', name: 'THE NAMES BENEATH THE CITY', where: 'Mission 16', key: 'c_names', start: 'side_m16_names', resolved: 'ev_erased', observed: 'ev_erased && quest_jun == "observed"' },
  { id: 'debt', name: 'THE CLOCKMAKER\'S DEBT', where: 'Mission 6', key: 'c_debt', start: 'side_m06_debt || has_spring', resolved: 'ezra_debt', observed: 'ezra_debt && (ev_ezra_mark || ev_gal_ezra)' },
  { id: 'ninth', name: 'THE NINTH MINUTE: EVIDENCE', where: 'Mission 13', key: 'c_ninth', start: 'side_m13_evidence', resolved: 'ev_witness_cause', observed: 'ev_witness_cause && ev_second_early' },
  { id: 'garden', name: 'THE SURVIVOR\'S GARDEN', where: 'Mission 14', key: 'c_garden', start: 'side_m14_garden', resolved: 'garden_restored', observed: 'garden_restored && (m18_evacuated || ev_sera23)' },
  { id: 'record', name: 'THE UNWRITTEN RECORD', where: 'Mission 22', key: 'c_record', start: 'side_m22_record', resolved: 'ev_unwritten_record', observed: 'ev_unwritten_record && ending' },
];
export const CASE_STATES = { open: 'NOT STARTED', active: 'ACTIVE', resolved: 'RESOLVED', observed: 'CONSEQUENCE OBSERVED' };
// facts: anything with test(cond)
export function caseState(facts, c) {
  if (facts.test(c.observed)) return 'observed';
  if (facts.test(c.resolved)) return 'resolved';
  if (facts.test(c.start)) return 'active';
  return 'open';
}
