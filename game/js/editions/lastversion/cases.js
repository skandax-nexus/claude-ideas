// THE LAST VERSION OF EARTH: CASE FILES (OVERHAUL.md §5 "CASE FILES"; replaces the Cases chapter).
//
// The bible's ten optional missions and chains A-D live inside the missions now (their side stories). The CASE FILES
// screen (Runtime.caseFiles) lists the fourteen stories with their bible state: not started, active, resolved,
// consequence observed; it replays a story from its place, with the facts the player had (the story's own facts
// cleared, so it can happen again). The keys c_b and c_c stay replay entries at their old index (an old save loads
// into them): c_b replays chain B in Mission 5's gorge, c_c chain C in Mission 15's archive; the ten new keys replay a
// side story of the mission it lives in.
//
//   CASE_FILES   the fourteen entries: { id, name, where, key?, start, resolved, observed } (conditions)
//   CASES        the 'cases' chapter's missions: c_b, c_c, then one replay per new key
//   caseState    'open' | 'active' | 'resolved' | 'observed' for an entry, from a fact store
import { M01 } from './prologue.js';
import { M05, M06 } from './act1.js';
import { M13 } from './act2.js';
import { M14, M15, M16, M17, M18 } from './act3.js';
import { M20, M22 } from './act4.js';
import { doneCond } from './Threads.js';
import { PLACES } from './places/index.js';

// --- a side story, replayed from its place -------------------------------------------------------------------------
// The replay is the mission's place, its people and what the story itself uses (its processes, talks, scenes,
// deductions, and the rules that set what its threads wait for), with only the story's threads, from the quarter it
// lives in, each answering only once the threads before it are done (gateAfter, as in the missions). Its lines are the
// mission's own (voiceGroup: the replay speaks from the mission's pack; its people are that chapter's). The facts the
// story sets or waits for are cleared when it starts (clear), so it can happen again: what its threads wait for and
// set, what its own scenes set, what the conversation nodes that move it on set, what its processes and rules set, and
// what the mission's code keeps for it (o.clear: chain B's gate count). Everything else the player had stays true (a
// shared conversation's first meeting is not met again).
const IDENT = /\b[a-z_][a-z0-9_]*\b/gi;
const idents = (cond) => (typeof cond === 'string' ? cond.replace(/"[^"]*"/g, '').match(IDENT) || [] : []).filter((k) => !['true', 'false'].includes(k) && !/^[A-Z]+$/.test(k));
function replay(m, sideId, o) {
  // (o.threads: a story that lives on the main path, as chain C does in Mission 15: those threads of their quarter)
  const qi = o.threads ? m.quarters.findIndex((q) => (q.threads || []).some((t) => o.threads.includes(t.id)))
    : m.quarters.findIndex((q) => (q.sides || []).some((s) => s.id === sideId));
  const side = o.threads ? { id: sideId, name: o.name, done: o.done, minutes: o.minutes, threads: m.quarters[qi].threads.filter((t) => o.threads.includes(t.id)) }
    : m.quarters[qi].sides.find((s) => s.id === sideId);
  const ts = side.threads;
  const ids = new Set(ts.map((t) => t.id));
  const used = { proc: new Set(o.processes || []), talk: new Set(o.talks || []), scene: new Set(o.scenes || []), deduce: new Set(), rule: new Set(o.rules || []) };
  for (const t of ts) {
    if (t.kind === 'invert') used.proc.add(t.target);
    for (const k of t.of || []) if (k.startsWith('rev_')) used.proc.add(k.slice(4));
    for (const k of t.of || []) if (/^inv_.+_done$/.test(k)) used.proc.add(k.slice(4, -5));
    if (t.kind === 'talk') used.talk.add(t.npc);
    if (t.scene) used.scene.add(t.scene);
    for (const s of t.spots || []) used.scene.add(s.scene || s.id);
    if (t.deduction) used.deduce.add(t.deduction);
  }
  const pick = (obj, set) => Object.fromEntries(Object.entries(obj || {}).filter(([k]) => set.has(k) || set.has(k.replace(/_no$/, ''))));
  const talks = pick(m.talks, used.talk), scenes = pick(m.scenes, used.scene);
  // what the story waits for and sets (its threads' done, of, set and when, and its own end)
  const core = new Set([...idents(side.done), ...ts.flatMap((t) => [...idents(doneCond({ ...m, mkey: m.key }, t) || ''), ...(t.of || []), ...Object.keys(t.set || {}), ...idents(t.when)])]);
  // a mission rule that sets what a thread waits for is the story's (Mission 15's flaps: the board run forwards
  // says every line is blank, and that is what the train's thread waits for)
  for (const r of m.rules || []) if (Object.keys(r.set || {}).some((k) => core.has(k))) used.rule.add(r.id);
  const clear = new Set([...core, ...(o.clear || [])]);
  const keys = (n) => [...Object.keys(n?.set || {}), ...(n?.choices || []).flatMap((c) => Object.keys(c.set || {}))];
  // its own scenes' facts; of a conversation, only the nodes that move the story on (the clockmaker's first meeting,
  // ezra_met, is Mission 6's, not the debt's)
  Object.values(scenes).forEach((n) => keys(n).forEach((k) => clear.add(k)));
  for (const nodes of Object.values(talks)) for (const n of nodes) if (keys(n).some((k) => core.has(k))) keys(n).forEach((k) => clear.add(k));
  for (const p of (m.processes || []).filter((x) => used.proc.has(x.id))) { clear.add(`inv_${p.id}_done`); clear.add(`rev_${p.id}`); }
  const rules = (m.rules || []).filter((r) => used.rule.has(r.id));
  for (const r of rules) Object.keys(r.set || {}).forEach((k) => clear.add(k));
  return {
    key: o.key, n: o.n, chapter: 'cases', origin: m.key, voiceGroup: m.chapter, name: side.name, title: o.title, subtitle: o.subtitle,
    place: m.place, wing: m.wing, exitAt: PLACES[m.place]?.exits?.[m.key], sectors: 1, home: m.home, states: m.states, drones: m.quarters.map(() => 0), ambience: m.ambience, ambient: m.ambient,
    motto: o.motto || m.motto, gate: side.name, crew: m.crew, named: m.named,
    minutes: { main: side.minutes, optional: 0 }, autoExit: 1.2, gateAfter: true,
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
  // the two quest chains of v2.0 keep their keys (an old save loads into them): chain B is Mission 5's gorge, chain C
  // Mission 15's archive
  // (the gates' order is counted in gates_n by Mission 5's code: a replay starts it from nothing)
  b: replay(M05, 'water', { key: 'c_b', n: 'B', title: 'Tala, the Ancient Settlement', subtitle: 'A dry channel in the present was a river in the past.', motto: 'WHO TAUGHT IT TO STAY', clear: ['gates_n'] }),
  c: replay(M15, 'archive', { key: 'c_c', n: 'C', title: 'Mara Quill, the lock city', subtitle: 'Two archives name different first Chronolith operators.', motto: 'TRUE FOR WHOM',
    threads: ['mara', 'ink'], name: 'TWO RECORDS, ONE DISASTER', done: 'ev_dual_archive', minutes: 8 }),
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
export const CASES = [R.b, R.c, R.child, R.train, R.letter, R.house, R.signal, R.names, R.debt, R.ninth, R.garden, R.record];

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
// each replay's number in the CASE FILES (1-14): what its card, its spoken title and the menus call it ("Case
// fourteen", CASE 14 OF 14; its letter, n, read as a placeholder: v2.1 playtest F18). n stays the letter (old saves)
for (const d of CASES) d.no = CASE_FILES.findIndex((c) => c.key === d.key) + 1;
export const CASE_STATES = { open: 'NOT STARTED', active: 'ACTIVE', resolved: 'RESOLVED', observed: 'CONSEQUENCE OBSERVED' };
// facts: anything with test(cond)
export function caseState(facts, c) {
  if (facts.test(c.observed)) return 'observed';
  if (facts.test(c.resolved)) return 'resolved';
  if (facts.test(c.start)) return 'active';
  return 'open';
}
