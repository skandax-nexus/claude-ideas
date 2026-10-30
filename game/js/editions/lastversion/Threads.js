// THE LAST VERSION OF EARTH: threads (OVERHAUL.md §3.3, §9.8). A rewritten mission is one map with soft quarters;
// each quarter holds main threads (the story's way through) and side stories. The objective is the first main
// thread not yet done, with its "because" line; THINK reads that thread's three hint tiers; a side story shows on
// the HUD only while it is tracked from the case board. A mission not yet rewritten runs through the shim: each
// legacy beat is one thread in quarter i (its objectives and hints stay the mission's own).
//
//   mission  { quarters: [{ name, threads, sides, barks }], talks: { npcId: [nodes] }, deductions: { id: { ... } },
//              coldOpen: { shots, lines, cue, first?, year?, cast?, stage?, title?: { shots, lines }, set?, then?, minutes? },
//              hook: { lines, cue, minutes? }, minutes: { main, optional } }
//   thread   { id, kind, goal, because, at, when?, trigWhen?, after?: [ids], until?, done?, set?, ev?, log?, say?: lines,
//              hints: [3 tiers], minutes, ...the kind's own fields }
//   side     { id, name, giver, start?, when?, done, case?, hook?: lines, threads, minutes? } (when: offered only while it holds)
//
// The kinds (and what placeThreads puts at their landmark):
//   go       reach a landmark: a trigger of radius r (4 m) at `at` (or over `box`, [x0, z0, x1, z1])
//   talk     finish a conversation with `npc` (the mission's talks); done names the fact the talk sets
//   clue     need `need` of the facts in `of`; `spots` are scenes placed at landmarks
//   residue  read a record that says one thing now and another in the past (`record: { official, echo, prompt }`)
//   deduce   answer from the evidence: mission.deductions[deduction] at `at` (a wrong answer can be tried again)
//   scene    an authored scene (`scene`, at `at` when `spot` is given; else the mission places it)
//   choice   a scene with choices by intent
//   tasks    several things, any order: all the facts in `of` (`spots` placed like a clue's)
//   stealth  cross unseen to `at` (the place's watchers walk Kai back to the last checkpoint, never a fail)
//   chase    `npc` walks `path` (landmarks or points), never more than `leash` (14 m) ahead: she waits for Kai,
//            and the chase never fails; done when she reaches the end
//   cinema   a staged moment: `lines` (and `shots`, `cue`) play once the thread is up (a mission's scripted moment
//            has no lines here: its own code plays it, and `done` names what it sets)
//   invert   REVERSE the process `target` (done: inv_<target>_done)
//   loop     the place resets (deck.loop: { period, variants }): done once `loops` resets (1) have happened while it
//            is the current thread; each reset moves the patrols to the next variant (Runtime.loopReset)
//   playback echoes re-enact what a place kept (`echoes`: people placed as holograms that show only while it plays,
//            `lines`): at `at`, a scene `playback:<id>`; with `entries` the recovered pieces are put in order first,
//            one a use (a wrong one is said and stays out), then the re-enactment plays and the thread is done; with
//            `shots` (cinema.js: an array, or a function of the runtime) it is staged, letterboxed, the camera on them
//   hold     defend for a time (U8: Mission 18's pylons): `secs` of progress while Kai stays within `r` (30 m) of `at`;
//            its `posts` (landmarks, each answering in its own `year`) drift out of phase one at a time, every `drift`
//            seconds, and a drifting post that is not re-anchored (a scene at the post, in its year) within `window`
//            seconds lapses: the progress waits until it is anchored again. Never a fail. `allies: { cond: postIndex }`
//            hold a post themselves (it never drifts); `slow: cond` gives every drift half as long again. Its progress
//            is kept in hold_<mkey>_<id> (seconds), so a save keeps it; `while: cond` instead counts while that holds
// A thread's fact is t_<mkey>_<id>; it is set the first time the thread counts as done once every thread it comes
// after has been (the story's order: a talk or a piece of evidence found early is paid when the story reaches it),
// with its `set`, `ev` and `log`, and its `say` lines are said (once: t_<mkey>_<id>_paid marks it, as kinds that
// complete themselves set the thread's fact directly). A thread whose `until` holds before it is done was walked
// past (a clue not found): it is no longer the objective.
import { compileCondition } from '../../core/conditions.js';
import { resolveAnchor, toWorld, spotModel } from './processes.js';

export const KINDS = ['go', 'talk', 'clue', 'residue', 'deduce', 'scene', 'choice', 'tasks', 'stealth', 'chase', 'cinema', 'invert', 'loop', 'playback', 'hold'];
// the length model's minutes when a thread does not give its own (§9.8)
export const MINUTES = { go: 2, talk: 2, clue: 1, residue: 3, deduce: 3, scene: 1, choice: 2, tasks: 3, stealth: 5, chase: 5, cinema: 2, invert: 5, loop: 4, playback: 5, hold: 6, side: 8, coldOpen: 2, hook: 1 };
// a legacy beat's kind as a thread
const SHIM_KIND = { arrival: 'scene', log: 'scene', contradiction: 'residue', encounter: 'talk', scene: 'scene', choice: 'choice', tasks: 'tasks', custom: 'scene' };
const SHIM_MIN = { arrival: 3, log: 3, contradiction: 4, encounter: 4, scene: 4, choice: 4, tasks: 6, custom: 8 };

export const isRewritten = (m) => Array.isArray(m?.quarters) && m.quarters.length > 0;
export const factOf = (m, t) => `t_${m.mkey || m.key}_${t.id}`;
export const sideFact = (m, s) => `side_${m.mkey || m.key}_${s.id}`;
// a playback's echoes show while this holds; its recovered pieces put in order so far
export const playFact = (m, t) => `pb_${m.mkey || m.key}_${t.id}`;
export const placedFact = (m, t) => `pb_${m.mkey || m.key}_${t.id}_n`;
// a hold's progress so far (seconds)
export const holdFact = (m, t) => `hold_${m.mkey || m.key}_${t.id}`;

// the years a condition that names only years holds in ('@FUTURE', '@PAST || @FUTURE'), else null
export function yearsOf(c) {
  if (typeof c !== 'string' || !/^\s*@[A-Z]+(\s*\|\|\s*@[A-Z]+)*\s*$/.test(c)) return null;
  return c.match(/@([A-Z]+)/g).map((y) => y.slice(1));
}
// the identifiers a condition reads (not its quoted strings, not true/false)
// (a fact may be camelCase after its prefix, inv_clockArm_done; a year, @FUTURE, is not a fact)
export const condIds = (c) => (typeof c === 'string' ? c.replace(/"[^"]*"/g, '').replace(/@[A-Z]+/g, '').match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g) || [] : []).filter((k) => k !== 'true' && k !== 'false');

// deck.gateAfter: what a thread's own interaction waits on: every thread it comes after, and every thread those come
// after in turn, each paid (its t_ fact) or walked past (its `until`). Null when nothing gates it.
export function chainGate(deck, t, byId) {
  if (!deck.gateAfter || !t.after?.length) return null;
  const seen = new Set();
  const walk = (x) => {
    for (const id of x.after || []) if (byId[id] && !seen.has(id)) walk(byId[id], seen.add(id));
  };
  walk(t);
  const need = [...seen].map((id) => (byId[id].until ? `(${factOf(deck, byId[id])} || (${byId[id].until}))` : factOf(deck, byId[id])));
  return need.length ? need.join(' && ') : null;
}

// a mission's quarters: its own, or the shim's (each legacy beat a thread in quarter i)
export function quartersOf(m) {
  if (isRewritten(m)) return m.quarters;
  const beats = m.beats || [{ kind: 'custom', goal: '' }];
  return beats.map((b, i) => ({
    name: `PART ${i + 1}`,
    threads: [{ id: `beat${i}`, kind: SHIM_KIND[b.kind] || 'scene', goal: b.goal || '', legacy: true, done: i === beats.length - 1 ? m.done || 'beat_done' : `${m.key}_s${i + 1}`, minutes: SHIM_MIN[b.kind] || 4 }],
    sides: [],
  }));
}

// every thread of a mission in order: { ...thread, q, side }
export function threadsOf(m) {
  const out = [];
  quartersOf(m).forEach((q, qi) => {
    for (const t of q.threads || []) out.push({ ...t, q: qi, side: null });
    for (const s of q.sides || []) for (const t of s.threads || []) out.push({ ...t, q: qi, side: s.id });
  });
  return out;
}
export const sidesOf = (m) => quartersOf(m).flatMap((q, qi) => (q.sides || []).map((s) => ({ ...s, q: qi })));

// the length model (§9.8): main = cold open + main threads + hook; optional = the side stories
export function estimate(m) {
  const qs = quartersOf(m);
  let main = 0, optional = 0;
  if (isRewritten(m)) {
    main += m.coldOpen ? m.coldOpen.minutes ?? MINUTES.coldOpen : 0;
    main += m.hook ? m.hook.minutes ?? MINUTES.hook : 0;
  } else main += 2; // (a legacy intro and outro)
  for (const q of qs) {
    for (const t of q.threads || []) main += t.minutes ?? MINUTES[t.kind] ?? 2;
    for (const s of q.sides || []) optional += s.minutes ?? ((s.threads || []).reduce((a, t) => a + (t.minutes ?? MINUTES[t.kind] ?? 2), 0) || MINUTES.side);
  }
  return { main, optional, total: main + optional };
}

// --- conditions -------------------------------------------------------------------------------------------------
export function doneCond(m, t) {
  if (t.done) return t.done;
  if (t.kind === 'invert') return `inv_${t.target}_done`;
  if ((t.kind === 'clue' || t.kind === 'tasks') && t.of) return null; // counted
  return factOf(m, t);
}
// facts: anything with get(k) and test(cond)
export function isDone(facts, m, t) {
  if (facts.get(factOf(m, t))) return true;
  const c = doneCond(m, t);
  if (c) return facts.test(c);
  return t.of.filter((k) => facts.get(k)).length >= (t.need ?? t.of.length);
}
export function sideState(facts, m, s) {
  if (s.done && facts.test(s.done)) return 'resolved';
  if (facts.get(sideFact(m, s)) || (s.start && facts.test(s.start)) || (s.threads || []).some((t) => isDone(facts, m, t))) return 'active';
  return 'open';
}

// --- placing a mission's threads in a built level (Runtime.buildLevel, after processes.placeAuthored) ----------------
// what each kind needs at its landmark: a trigger, scenes, a record, a deduction, the chase's path. Threads whose
// things the mission builds itself (its overlay or rooms) only name them.
export function placeThreads(deck, level) {
  if (!isRewritten(deck)) return;
  const anchor = (name) => (Array.isArray(name) ? { pos: name.slice(0, 3), yaw: name[3] || 0, room: roomAt(level, name) } : level.anchorsAt?.[name] ?? resolveAnchor(level, deck, name));
  // deck.gateAfter (every rewritten mission from Act I on): a thread's own interaction (its spot, its trigger, its
  // deduction, record or playback) answers only once every thread it comes after is done, and every thread those come
  // after in turn (a talk or an evidence spot is free, so a thread done early must not open the rest of the chain), so
  // nothing that ends a mission can be used before the story reaches it. A thread before it that a player may walk
  // past (`until`) counts as done once its `until` holds. The evidence a clue or tasks thread lists (`spots`) stays
  // free to find.
  const all = threadsOf(deck);
  const ids = Object.fromEntries(all.map((t) => [t.id, t]));
  const gate = (t, when) => {
    const need = chainGate(deck, t, ids);
    return need ? (when ? `(${when}) && ${need}` : need) : when;
  };
  // A talk the story has not reached yet is not offered either: the nodes of a talk thread's conversation that would
  // complete it wait on its chain (level.talkGates, read by Runtime.talk; a person with no node open says nothing and
  // is not offered as a talk, Threads.update), and a REVERSE thread's process answers only then (its `arm`, as Mission
  // 18's slabs: in plain sight, not yet the story's to reverse)
  level.talkGates = {};
  for (const t of all) {
    const need = chainGate(deck, t, ids);
    if (!need) continue;
    if (t.kind === 'talk' && t.npc) {
      const done = new Set(condIds(doneCond(deck, t) || ''));
      const sets = (x) => Object.keys(x?.set || {}).some((k) => done.has(k));
      // (the conversation Runtime.talk plays for that person: their own id's talks, else their crew's)
      const key = deck.talks?.[t.npc] ? t.npc : level.npcs.find((p) => p.id === t.npc && deck.talks?.[p.crew])?.crew;
      (deck.talks?.[key] || []).forEach((node, i) => {
        if (!sets(node) && !(node.choices || []).some(sets)) return;
        const k = `${key}:${i}`;
        level.talkGates[k] = level.talkGates[k] ? `(${level.talkGates[k]}) && ${need}` : need;
      });
    }
    if (t.kind === 'invert' && t.target) {
      for (const rec of level.processes || []) if (rec.id === t.target) rec.arm = rec.arm ? `(${rec.arm}) && ${need}` : need;
    }
  }

  const spot = (s, t) => {
    const a = anchor(s.at || t.at);
    if (!a) return;
    const pos = toWorld(a, s.offset || [0, 1.2, 0]);
    // (a kit stands whatever the story has reached, so a gated spot's prop is there before it answers; one that belongs
    // to a year, '@FUTURE', stands only in that year: places/mount.js, kitYears)
    const years = s.kitYears ?? yearsOf(s.when);
    level.interactables.push({ id: s.id, kind: 'scene', scene: s.scene || s.id, pos, yaw: a.yaw + (s.turn || 0), r: s.r ?? 2.4, prompt: s.prompt || 'LOOK', room: a.room,
      ...(s.model ? { model: typeof s.model === 'function' ? s.model : spotModel(s.model) } : {}), ...(s.kit ? { kit: s.kit, ...(years ? { kitYears: years } : {}) } : {}), when: s.when, color: s.color, ...(s.once ? { once: true } : {}) });
    for (const tx of s.texts || []) level.texts.push({ text: tx.text, pos: toWorld(a, tx.at || [0, 2, 0.05]), rotY: a.yaw + (tx.turn || 0), size: tx.size || 0.2, color: tx.color || '#ffe6c0', when: tx.when, room: a.room });
  };
  // (the thread's own interaction: gated on what it comes after; its prop keeps its own year)
  const own = (s, t) => spot({ ...s, when: gate(t, s.when), kitYears: yearsOf(s.when) }, t);
  for (const t of all) {
    // (a clue's evidence is free to find; a tasks thread with a done of its own is finished by what is done at its
    // spots, Mission 5's gorge gates, so they answer only once the story is there)
    for (const s of t.spots || []) (t.kind === 'tasks' && t.done ? own(s, t) : spot(s, t));
    if (t.spot) own({ id: t.scene || t.id, scene: t.scene, ...t.spot }, t);
    if ((t.kind === 'go' || t.kind === 'stealth') && t.at && !t.done) {
      const a = anchor(t.at);
      const r = t.r ?? 4;
      // (trigWhen: what the arrival itself asks, beyond the thread being up: Mission 10's crossing counts once Kai has
      // stepped ahead of himself, while the objective shows from the start)
      const when = [t.when, t.trigWhen].filter(Boolean).map((c) => `(${c})`).join(' && ') || undefined;
      // (box: [x0, z0, x1, z1], an area instead of a radius: a line across a whole avenue, the Finale's streets)
      const b = t.box ? [t.box[0], a?.pos[1] - 1.5, t.box[1], t.box[2], a?.pos[1] + 5, t.box[3]] : a && [a.pos[0] - r, a.pos[1] - 1.5, a.pos[2] - r, a.pos[0] + r, a.pos[1] + 5, a.pos[2] + r];
      // (a stealth crossing counts only unseen: not with a watcher on Kai's heels, Runtime's trigger step; v2.1 playtest
      // F03, Mission 13's crossing done while the sentry chased him)
      if (a) level.triggers.push({ box: b, set: { [factOf(deck, t)]: true }, when: gate(t, when), once: true, room: a.room, ...(t.kind === 'stealth' ? { unseen: true } : {}) });
    }
    if (t.kind === 'deduce' && t.at && deck.deductions?.[t.deduction]) own({ id: `deduce_${t.id}`, scene: `deduce:${t.deduction || t.id}`, prompt: t.prompt || 'PIECE IT TOGETHER', ...(t.spotOpts || {}) }, t);
    if (t.kind === 'residue' && t.at && t.record) {
      own({ id: `residue_${t.id}`, scene: `residue:${t.id}`, prompt: t.record.prompt || 'READ IT', kit: t.record.kit, model: t.record.model, offset: t.record.offset, when: t.record.when }, t);
    }
    if (t.kind === 'playback' && t.at) {
      own({ id: `playback_${t.id}`, scene: `playback:${t.id}`, prompt: t.prompt || 'WATCH WHAT IT KEPT', model: t.model, kit: t.kit, offset: t.offset, r: t.r, when: t.spotWhen }, t);
      // the echoes: holograms that stand (and walk) only while it plays (the fact pb_<mkey>_<id>)
      const a = anchor(t.at);
      for (const [k, e] of (t.echoes || []).entries()) {
        const p = e.at ? (Array.isArray(e.at) ? e.at.slice(0, 3) : (level.landmarks?.[e.at] || a?.pos || [0, 0, 0]).slice(0, 3)) : a ? toWorld(a, e.offset || [k * 1.2 - 1, 0, 2]) : [0, 0, 0];
        const path = (e.path || []).map((q) => (typeof q === 'string' ? (level.landmarks?.[q] || [0, 0, 0]).slice(0, 3) : q)).map((q) => [q[0], q[2] ?? q[1]]);
        level.npcs.push({ id: `pb_${t.id}_${k}`, crew: e.crew, first: e.first, ambient: !!e.ambient, pronoun: e.pronoun, variant: e.variant, height: e.height, pos: [p[0], e.y ?? p[1], p[2]], yaw: e.yaw ?? (a?.yaw || 0),
          hologram: true, silent: true, when: playFact(deck, t), ...(path.length > 1 ? { path, speed: e.speed ?? 0.9 } : {}), room: a?.room || roomAt(level, p) || level.outdoorRoom });
      }
    }
    // a hold's posts: a scene at each (re-anchor it, in its year)
    if (t.kind === 'hold') for (const [i, po] of (t.posts || []).entries()) spot({ id: `hold_${t.id}_${i}`, scene: `hold:${t.id}:${i}`, at: po.at, prompt: po.prompt || `RE-ANCHOR ${po.name}`, offset: po.offset || [0, 1.3, 1.4], r: po.r ?? 3, model: po.model, kit: po.kit }, t);
    if (t.kind === 'chase' && t.npc) {
      const n = level.npcs.find((x) => x.id === t.npc);
      if (n) {
        // DeckWorld walks her along the path (and animates her); the runtime sets her pace and her height
        const pts = (t.path || []).map((p) => (typeof p === 'string' ? (level.landmarks?.[p] || [0, 0, 0]).slice(0, 3) : p));
        n.chase = { path: [n.pos.slice(0, 3), ...pts], leash: t.leash ?? 14, ahead: t.ahead ?? 10, speed: t.speed ?? 1.7, fact: factOf(deck, t), thread: t.id };
        n.path = pts.map((p) => [p[0], p[2]]);
        n.speed = 1e-6; // (she waits until Kai comes within the leash)
        n.silent = true;
      }
    }
  }
  // free roam (roam.js): the story's own threads of a mission already done stand as the props they are, and answer
  // nothing (r 0, never offered): the appointment book still lies on the counter, the brass clocks still hang
  for (const t of quartersOf(deck).flatMap((q) => q.inert || [])) {
    const prop = (s) => spot({ ...s, r: 0, kitYears: yearsOf(s.when) }, t);
    for (const s of t.spots || []) if (s.kit || s.model) prop(s);
    if (t.spot && (t.spot.kit || t.spot.model)) prop({ id: t.scene || t.id, scene: t.scene, ...t.spot });
    if (t.kind === 'residue' && t.at && t.record && (t.record.kit || t.record.model)) prop({ id: `residue_${t.id}`, scene: `residue:${t.id}`, kit: t.record.kit, model: t.record.model, offset: t.record.offset, when: t.record.when });
    if (t.kind === 'playback' && t.at && (t.kit || t.model)) prop({ id: `playback_${t.id}`, scene: `playback:${t.id}`, model: t.model, kit: t.kit, offset: t.offset, when: t.spotWhen });
    if (t.kind === 'hold') for (const [i, po] of (t.posts || []).entries()) if (po.kit || po.model) prop({ id: `hold_${t.id}_${i}`, at: po.at, offset: po.offset || [0, 1.3, 1.4], model: po.model, kit: po.kit });
  }
  // the cold open's cast: people who stand in the shot only while the opening plays (coldOpen.cast: { crew, at,
  // off, turn, variant, hologram, ambient? (a person cast by who they are, crowds.js AMBIENT_CAST), seed? }; the fact
  // co_<mkey>, which the runtime holds for the opening and clears at a load)
  for (const [k, c] of (deck.coldOpen?.cast || []).entries()) {
    const a = anchor(c.at);
    if (!a) continue;
    const p = toWorld(a, c.off || [0, 0, 0]);
    level.npcs.push({ id: `co_${k}`, crew: c.crew, first: c.first, variant: c.variant, height: c.height, pos: [p[0], p[1], p[2]], yaw: a.yaw + (c.turn || 0),
      ...(c.ambient ? { ambient: true, seed: c.seed || 1 } : {}),
      hologram: !!c.hologram, silent: true, temporal: ['PRESENT', 'PAST', 'FUTURE'], when: coldFact(deck), room: a.room || roomAt(level, p) || level.outdoorRoom });
  }
  // the quarters: the room each one's spawn stands in (a quarter of rooms is reached by entering that room;
  // one of the open place by standing in its area)
  for (const q of level.quarters || []) q.room = roomAt(level, q.spawn) || level.outdoorRoom;
  // the people whose conversation waits on the story (Threads.update offers them as a talk once a node is open; a chase's
  // walker and the silent are never offered)
  const gatedTalks = new Set(Object.keys(level.talkGates).map((k) => k.slice(0, k.lastIndexOf(':'))));
  for (const n of level.npcs) if (!n.silent && (gatedTalks.has(n.id) || (!deck.talks?.[n.id] && gatedTalks.has(n.crew)))) n.gatedTalk = true;
}
// the cold open's people stand while this holds (Runtime.openMission)
export const coldFact = (m) => `co_${m.mkey || m.key}`;

// the choice panel's header (Runtime.playNode): the node's own `header` if it gives one (null: none), else the last of
// its lines that was said. A line whose `when` does not hold was not said (HUD.say skips it, by the same test), so it
// is never the header: the Finale's "Orren's record: released" to a player who never read Orren's record (v2.1
// playtest F02, X3)
export function choiceHeader(node, lines, facts) {
  if (node && node.header !== undefined) return node.header;
  for (let i = (lines?.length || 0) - 1; i >= 0; i--) {
    const l = lines[i];
    if (l && (!l.when || facts.test(l.when))) return l;
  }
  return null;
}

// the room a point stands in (DeckWorld.roomAt's rule: the first room in order whose bounds hold it)
export function roomAt(level, p) {
  const [x, y, z] = p;
  const yy = y + 0.86;
  for (const id of level.order || []) {
    for (const b of level.rooms[id].bounds || []) if (x >= b[0] && x < b[3] && yy >= b[1] && yy < b[4] && z >= b[2] && z < b[5]) return id;
  }
  return null;
}

// =================================================================================================================
// the runtime side: objective and because, hints, completion, quarters, the chase, staged moments, side tracking
// a placed piece in a playback's header: its time when it starts with one (05:33.), else its first sentence
export function shortLabel(label = '') {
  const t = label.match(/^\d{1,2}:\d{2}\.?/);
  if (t) return t[0].endsWith('.') ? t[0] : `${t[0]}.`;
  const first = label.match(/^.*?[.!?](?=\s|$)/);
  return first ? first[0] : label;
}

export class Threads {
  constructor(rt) {
    this.rt = rt;
    this.deck = null;
    this.list = [];
    this.byId = {};
    this.staged = new Set();
    this.tick = 0;
  }

  get g() {
    return this.rt.g;
  }

  get on() {
    return !!this.deck;
  }

  // a level of a mission is up (rewritten missions only; the shim's missions keep their own objectives)
  attach(deck, level) {
    this.deck = isRewritten(deck) ? deck : null;
    this.level = level;
    this.list = this.deck ? threadsOf(deck) : [];
    this.byId = Object.fromEntries(this.list.map((t) => [t.id, t]));
    this.sides = this.deck ? sidesOf(deck) : [];
    this.playing = null;
    this.chasers = null;
    this.room = null;
    this.here = null; // (the quarter Kai stands in: found again in this level, never the last mission's)
    // the staged moments already started in this load (kept here, not in the saved flags: a save taken while one
    // plays loads with its thread not done, and the moment plays again)
    this.staged = new Set();
    this.tick = 0;
    this.holds = {}; // (a hold's posts and progress, this load)
    this.hasHold = undefined;
    this.holdHud(null);
  }

  done(t) {
    return isDone(this.g.facts, this.deck, t);
  }

  // up now: its own condition holds and the story has reached it (every thread it comes after paid or walked past:
  // a staged moment, a loop, a hold or a chase never starts because something after it in the story was done early)
  available(t) {
    const f = this.g.facts;
    return (!t.when || f.test(t.when)) && this.ready(t);
  }

  passed(t) {
    return !!t.until && this.g.facts.test(t.until);
  }

  // the story has reached it: every thread it comes after is paid (its t_ fact) or walked past
  ready(t) {
    const f = this.g.facts;
    return (t.after || []).every((id) => {
      const a = this.byId[id];
      return a && (f.get(factOf(this.deck, a)) || this.passed(a));
    });
  }

  // a conversation's node is open: it waits on nothing, or on a chain the story has reached (placeThreads' talkGates)
  nodeOpen(talk, i) {
    const w = this.level?.talkGates?.[`${talk}:${i}`];
    return !w || this.g.facts.test(w);
  }

  // what a person would say now, by Runtime.talk's rule (their own id's talks first, then their crew's): the node and
  // its talk's key, or null
  talkNode(n) {
    const talks = this.deck?.talks;
    const key = talks?.[n.n.id] ? n.n.id : talks?.[n.crew?.id] ? n.crew.id : null;
    if (!key) return null;
    const f = this.g.facts;
    const node = talks[key].find((d, i) => f.test(d.when || 'true') && this.nodeOpen(key, i));
    return node ? { key, node } : null;
  }

  // the first main thread not yet done (and not walked past) that is up now
  current() {
    if (!this.on) return null;
    for (const t of this.list) if (!t.side && this.available(t) && !this.done(t) && !this.passed(t)) return t;
    return null;
  }

  // the tracked side story's next thread
  tracked() {
    const c = this.g.campaign;
    if (!this.on || !c?.track) return null;
    const [mk, id] = c.track.split(':');
    if (mk !== this.deck.mkey) return null;
    const s = this.sides.find((x) => x.id === id);
    const st = s && sideState(this.g.facts, this.deck, s);
    if (!s || st === 'resolved' || (st === 'open' && s.when && !this.g.facts.test(s.when))) return null;
    const t = (s.threads || []).find((x) => this.available(x) && !this.done(x) && !this.passed(x));
    return t ? { side: s, thread: t } : null;
  }

  // a fact changed: threads that are now done set their fact (once) with what they carry
  update() {
    if (!this.on) return;
    const g = this.g, f = g.facts;
    for (const t of this.list) {
      // (a kind that completes itself, a trigger, a chase's end, a staged moment, a deduction, a record, sets the
      // thread's fact directly: what the thread carries is paid out once, marked by <fact>_paid. A thread done before
      // the story reaches it, a talk or a piece of evidence found early, is paid once every thread before it is: its
      // lines are said in the story's order, and nothing gated on it opens early)
      const k = factOf(this.deck, t);
      if (f.get(`${k}_paid`) || !this.done(t) || !this.ready(t)) continue;
      f.set(`${k}_paid`, true);
      f.set(k, true);
      if (t.set) for (const [a, v] of Object.entries(t.set)) f.set(a, v);
      if (t.ev) f.set(`ev_${t.ev}`);
      if (t.log) g.log.push(t.log);
      if (t.say?.length) g.hud.say(t.say, f);
    }
    for (const s of this.sides) {
      const k = sideFact(this.deck, s);
      if (!f.get(k) && sideState(f, this.deck, s) !== 'open') f.set(k, true);
    }
    this.gateTalks();
  }

  // a person whose conversation waits on the story is not offered as a talk until a node of it is open (the level's own
  // person, which is DeckWorld's: the first step's update sets it, as every fact change does)
  gateTalks() {
    if (!this.level?.talkGates || !Object.keys(this.level.talkGates).length) return;
    for (const d of this.level.npcs || []) if (d.gatedTalk) d.silent = !this.talkNode({ n: d, crew: { id: d.crew } });
  }

  // THINK: the current thread's tiers (the tracked side's when every main thread is done or not up)
  hint() {
    const t = this.current() || this.tracked()?.thread;
    if (!t?.hints?.length) return null;
    return { key: `thr:${t.id}`, tiers: t.hints };
  }

  // --- each frame -------------------------------------------------------------------------------------------------
  step(dt) {
    if (!this.on) return;
    this.carry();
    this.quarters();
    this.chase(dt);
    this.stage();
    this.holdStep(dt);
    // (a thread whose done reads a count, or a condition no fact change re-tested; a fact change updates at once)
    if ((this.tick -= dt) <= 0) {
      this.tick = 0.25;
      this.update();
    }
  }

  // a year carries out of a room into the open place (deck.carryOut: the rooms whose year does): Mission 3's lab,
  // a frame in 2026, opens onto the court in 2026, not into 2049 behind Kai's back. Only outwards, and only from
  // those rooms (the court crosses the top of the chamber's corridor); a room keeps its own year.
  carry() {
    const g = this.g, lv = this.level;
    const from = this.room;
    this.room = g.room;
    const rooms = this.deck.carryOut;
    if (!rooms?.includes(from) || from === g.room || g.room !== lv?.outdoorRoom || g.transitioning) return;
    const s = g.engine.state(from);
    if (s && s !== g.engine.state(g.room) && g.engine.statesOf(g.room).includes(s)) g.engine.setState(g.room, s);
  }

  // the furthest quarter reached: an autosave (and its name on the HUD) at each new one
  quarters() {
    const g = this.g, c = g.campaign, lv = this.level;
    if (!lv?.quarters?.length || g.catching || g.transitioning) return;
    const p = g.player.pos;
    let at = -1;
    for (let i = lv.quarters.length - 1; i >= 0; i--) {
      const q = lv.quarters[i];
      // (a quarter that is floors of a house is its own box, cp: M6's galleries and clock room stand over the shop floor)
      const b = q.cp;
      const here = q.room && q.room !== lv.outdoorRoom ? g.room === q.room
        : g.room === lv.outdoorRoom && (b ? p.x >= b[0] && p.x < b[3] && p.y >= b[1] && p.y < b[4] && p.z >= b[2] && p.z < b[5]
          : p.x >= q.area[0] && p.x < q.area[2] && p.z >= q.area[1] && p.z < q.area[3]);
      if (here) { at = i; break; }
    }
    if (at < 0) return;
    this.here = at;
    if (at <= (c.quarter ?? 0)) return;
    // (a quarter is reached once the story is there: every main thread of the quarters before it done, walked past or
    // not up. Ground walked ahead of the story, or quarters that overlap in plan (a roof over a pit), never move the
    // save's quarter on: a save would load past the threads still to play)
    if (this.list.some((t) => !t.side && t.q < at && this.available(t) && !this.done(t) && !this.passed(t))) return;
    c.quarter = at;
    g.hud.toast(`<small>${this.deck.name}</small><br>${lv.quarters[at].name}`, 2400);
    g.after(0.4, () => g.campaign === c && g.saveTo('auto'));
  }

  // the chase: DeckWorld walks her along her path; here she keeps ahead of Kai, never more than the leash (beyond
  // it she waits for him), her height follows the path (a stair down from the platform), and at its end she is gone.
  // It never fails.
  chase(dt = 0) {
    const g = this.g;
    for (const n of g.deckWorld.npcs) {
      const ch = n.n.chase;
      if (!ch || !n.model.visible || !n.n.path) continue;
      const m = n.model;
      const d = Math.hypot(g.player.pos.x - m.position.x, g.player.pos.z - m.position.z);
      // (she waits where she stands until the story reaches the chase)
      const up = ch.started || !this.byId[ch.thread] || this.ready(this.byId[ch.thread]);
      const waits = !up || d > ch.leash;
      n.n.speed = waits ? 1e-6 : d < ch.ahead * 0.5 ? ch.speed * 2.2 : d < ch.ahead ? ch.speed * 1.35 : ch.speed;
      // waiting, she looks back at Kai (DeckWorld, which ran first, turned her to the path she is not yet walking: the
      // tour found Mission 1's woman with Mira's face showing her back to the close-up of her face). Walking, the path
      // turns her again from where she looks
      if (waits) {
        const want = Math.atan2(g.player.pos.x - m.position.x, g.player.pos.z - m.position.z);
        const from = ch.face ?? m.rotation.y;
        ch.face = from + Math.atan2(Math.sin(want - from), Math.cos(want - from)) * Math.min(1, dt * 3);
        m.rotation.y = ch.face;
        m.userData.lookAt?.((ch.eye ||= g.player.pos.clone()).copy(g.player.pos).setY(g.player.pos.y + 0.6));
      } else ch.face = null;
      if (!up) continue;
      if (n.wp > 0 || d <= ch.leash) ch.started = true;
      // DeckWorld wraps her to the path's start once she reaches its end: that is the end of the chase
      if (ch.started && n.wp === 0 && ch.last >= n.n.path.length - 1) {
        n.n.path = null;
        if (!g.facts.get(ch.fact)) {
          g.facts.set(ch.fact);
          this.update();
        }
        continue;
      }
      ch.last = n.wp;
      const w = ch.path[n.wp + 1], prev = ch.path[n.wp];
      const seg = Math.hypot(w[0] - prev[0], w[2] - prev[2]) || 1;
      const k = 1 - Math.min(1, Math.hypot(w[0] - m.position.x, w[2] - m.position.z) / seg);
      m.position.y = prev[1] + (w[1] - prev[1]) * k;
    }
  }

  // a thread's staged moment plays once, when it is up
  stage() {
    const g = this.g, rt = this.rt;
    if (rt.opening || rt.cinema?.active || g.hud.talking || g.menu) return;
    for (const t of this.list) {
      if (t.kind !== 'cinema' || !t.lines?.length || this.done(t) || !this.available(t) || this.passed(t)) continue;
      const k = factOf(this.deck, t);
      if (this.staged.has(t.id)) continue;
      this.staged.add(t.id);
      rt.cinema.play({ shots: t.shots || null, lines: t.lines, cue: t.cue || null, letterbox: t.letterbox !== false }, () => {
        g.facts.set(k);
        this.update();
      });
      return;
    }
  }

  // --- a hold: defend for a time (Mission 18's pylons) ---------------------------------------------------------------
  // the current thread's progress counts while Kai stays near and no post has lapsed; one post drifts at a time
  holdStep(dt) {
    if (this.hasHold === undefined) this.hasHold = this.list.some((x) => x.kind === 'hold');
    if (!this.hasHold) return; // (most missions have none: nothing to walk each frame)
    const g = this.g, f = g.facts, t = this.current();
    if (t?.kind !== 'hold' || this.done(t)) {
      if (this.holdShown) this.holdHud(null);
      return;
    }
    const rt = this.rt;
    if (rt.opening || rt.cinema?.active || g.hud?.talking || g.menu || g.catching) return;
    const k = holdFact(this.deck, t);
    const S = (this.holds[t.id] ||= { prog: f.get(k) || 0, posts: (t.posts || []).map(() => ({ st: 'ok', t: 0 })), next: (t.drift ?? 22) * 0.5, k: 0 });
    const slow = t.slow && f.test(t.slow) ? 1.5 : 1;
    const allied = new Set(Object.entries(t.allies || {}).filter(([c]) => f.test(c)).map(([, i]) => i));
    let lapsed = false;
    S.posts.forEach((p, i) => {
      if (allied.has(i)) {
        p.st = 'ok';
        return;
      }
      if (p.st === 'drift' && (p.t -= dt) <= 0) {
        p.st = 'lapsed';
        if (t.lapse?.length) g.hud.say(t.lapse, f);
      }
      if (p.st === 'lapsed') lapsed = true;
    });
    const lm = this.level?.landmarks?.[t.at];
    const pp = g.player?.pos;
    const near = !lm || !pp || Math.hypot(pp.x - lm[0], pp.z - lm[2]) <= (t.r ?? 30);
    if (t.while ? f.test(t.while) : near && !lapsed) S.prog += dt;
    // one post at a time drifts out of phase, every `drift` seconds while Kai is at the hold
    if (S.posts.length && near && (S.next -= dt) <= 0) {
      S.next = (t.drift ?? 22) * slow;
      const free = S.posts.map((q, i) => i).filter((i) => !allied.has(i));
      if (free.length && !S.posts.some((q) => q.st !== 'ok')) {
        const i = free[S.k++ % free.length];
        S.posts[i].st = 'drift';
        S.posts[i].t = (t.window ?? 18) * slow;
        g.audio?.deny?.();
        if (t.posts[i].drift?.length) g.hud.say(t.posts[i].drift, f);
      }
    }
    if (Math.floor(S.prog) !== (f.get(k) || 0)) f.set(k, Math.floor(S.prog));
    this.holdHud(t, S, allied);
    if (S.prog >= (t.secs || 60)) {
      f.set(factOf(this.deck, t));
      this.holdHud(null);
      this.update();
    }
  }

  // a post's scene: re-anchor it, in its year
  holdUse(id, i, state) {
    const t = this.byId[id], po = t?.posts?.[i];
    if (!po) return null;
    const p = this.holds[id]?.posts[i];
    if (!p || p.st === 'ok' || this.done(t)) return { lines: po.steady || t.steady || [] };
    if (po.year && state !== po.year) return { lines: po.wrongYear || [] };
    p.st = 'ok';
    this.g.audio?.chime?.();
    return { lines: po.anchor || [] };
  }

  // the hold's chip under the objective: the label and progress, and the post that needs Kai
  holdHud(t, S, allied) {
    if (typeof document === 'undefined') return;
    let el = document.querySelector('#lvHold');
    if (!t) {
      if (el) el.classList.remove('on');
      this.holdShown = false;
      this.holdKey = null;
      return;
    }
    if (!el) {
      const st = document.createElement('style');
      st.id = 'lvHoldCss';
      st.textContent = `body.lastversion #lvHold { position: absolute; left: 50%; top: 14px; transform: translateX(-50%); display: none; gap: 10px; align-items: center; padding: 7px 14px;
        border-radius: 999px; background: rgba(30, 24, 40, 0.5); color: #fff; font: 700 12px Inter, sans-serif; letter-spacing: 0.08em; pointer-events: none; white-space: nowrap; z-index: 8; }
        body.lastversion #lvHold.on { display: flex; }
        body.lastversion #lvHold i { display: block; width: 90px; height: 6px; border-radius: 3px; background: linear-gradient(90deg, #ffd27a var(--hp, 0%), rgba(255,255,255,0.25) 0); }
        body.lastversion #lvHold.alert { background: rgba(120, 30, 30, 0.6); }`;
      document.head.appendChild(st);
      el = document.createElement('div');
      el.id = 'lvHold';
      el.innerHTML = '<b></b><i></i><span></span>';
      (document.querySelector('#ui') || document.body).appendChild(el);
    }
    const pct = Math.min(100, Math.round((S.prog / (t.secs || 60)) * 100));
    let bi = -1;
    for (let i = 0; i < S.posts.length; i++) if (S.posts[i].st !== 'ok') { bi = i; break; }
    const bad = bi >= 0 ? S.posts[bi] : null;
    const label = `${t.label || 'HOLD'} ${pct}%`;
    const note = bad ? `${t.posts[bi].name} ${bad.st === 'lapsed' ? 'LAPSED' : `DRIFTING ${Math.ceil(bad.t)}`}` : allied?.size ? 'HELD WITH HELP' : 'HOLDING';
    // (the chip is written only when what it says changes: no style work in a frame that changes nothing)
    const key = `${label}|${note}`;
    if (this.holdShown && this.holdKey === key) return;
    this.holdKey = key;
    el.querySelector('b').textContent = label;
    el.style.setProperty('--hp', `${pct}%`);
    el.querySelector('span').textContent = note;
    el.classList.toggle('alert', !!bad);
    el.classList.add('on');
    this.holdShown = true;
  }

  // --- the scenes threads own: a deduction, a record with a residue --------------------------------------------------
  // a deduction: every answer is offered; one with its evidence (`needs`) and `correct` closes it; any other is said
  // and the question stays open
  deduction(id) {
    const d = this.deck?.deductions?.[id];
    if (!d) return null;
    const f = this.g.facts;
    const t = this.list.find((x) => x.kind === 'deduce' && (x.deduction || x.id) === id);
    const k = t ? factOf(this.deck, t) : `t_${this.deck.mkey}_${id}`;
    const choices = d.answers.map((a) => {
      const proven = a.correct && (!a.needs || f.test(a.needs));
      const lines = a.correct && !proven ? a.unproven || d.unproven || [] : a.lines || [];
      return { intent: a.intent || 'investigate', label: a.label, say: a.say, lines, ...(proven ? { set: { ...(d.set || {}), [k]: true }, log: d.log, consequence: !!d.reveal } : {}) };
    });
    return { lines: d.question || [], choices };
  }

  // --- loops: the place resets (Runtime.loopReset); the current thread, if it watches loops, counts the reset ------
  onLoop() {
    if (!this.on) return;
    const t = this.current();
    if (t?.kind !== 'loop') return;
    const f = this.g.facts, k = `${factOf(this.deck, t)}_n`;
    f.inc(k);
    if ((f.get(k) || 0) >= (t.loops || 1)) {
      f.set(factOf(this.deck, t));
      this.update();
    }
  }

  // --- playback: the recovered pieces in order (one a use), then the echoes re-enact it -------------------------------
  playback(id) {
    const t = this.byId[id];
    if (!t || t.kind !== 'playback') return null;
    const f = this.g.facts, entries = t.entries || [];
    const n = f.get(placedFact(this.deck, t)) || 0;
    if (n >= entries.length) return this.reenact(t);
    // every piece not yet placed is offered, in a fixed shuffle; the next one in order goes in, any other stays out.
    // One that goes in is seen to (play: a chime, the count) and the next pick is offered at once, its header the order
    // so far (v2.1 playtest F13: a right pick closed the panel without a sound, and the wall had to be tapped again)
    const rest = entries.map((e, i) => ({ e, i })).filter(({ i }) => i >= n).sort((a, b) => ((a.i * 5 + 2) % 7) - ((b.i * 5 + 2) % 7));
    return {
      lines: n ? t.next || [] : t.question || [],
      // (each placed one by its time, or its first sentence: Mission 8's long timestamped labels ran the header to 150
      // characters by the third pick)
      ...(n ? { header: { who: 'NONE', text: `In order so far: ${entries.slice(0, n).map((e) => shortLabel(e.label)).join(' ')} What comes next?` } } : {}),
      choices: rest.map(({ e, i }) => (i === n
        ? { intent: 'investigate', label: e.label, mute: true, lines: e.lines || [], set: { [placedFact(this.deck, t)]: n + 1 }, playback: id }
        : { intent: 'investigate', label: e.label, mute: true, lines: t.wrong || [] })),
    };
  }

  // (its log line is the thread's: update() pays it once, when the thread is first done, not at every replay)
  reenact(t) {
    const node = { lines: t.lines || [], show: playFact(this.deck, t), set: { [factOf(this.deck, t)]: true, ...(t.set || {}) } };
    // (playtest v2.1.1 L39: Mission 8's payoff played on the game's camera, its echoes small and walking away while the
    // narration told what they did. A playback with shots is staged: the echoes walk it in frame, letterboxed, the HUD
    // hidden; what it sets is set when it ends, as a node's would be after its lines)
    const cin = t.shots && this.rt?.cinema;
    if (!cin) return node;
    const g = this.g;
    g.facts.set(node.show, true);
    cin.play({ shots: t.shots, lines: node.lines }, () => {
      g.facts.set(node.show, false);
      this.rt.playNode({ set: node.set });
    });
    return { lines: [] };
  }

  // a piece went in (Runtime.applyAfter, after its lines): the next pick at once, or, the last one in, the re-enactment
  play(id) {
    const t = this.byId[id];
    if (t?.kind !== 'playback') return;
    const g = this.g, n = g.facts.get(placedFact(this.deck, t)) || 0, all = (t.entries || []).length;
    if (n < all) {
      g.audio?.chime?.();
      g.hud?.toast?.(`<small>${t.prompt || 'IN ORDER'}</small><br>${n} / ${all} in order`, 1800);
      this.rt.playNode(this.playback(id), null, `playback_${id}`);
      return;
    }
    if (all) g.audio?.chime?.();
    this.rt.playNode(this.reenact(t), null, `playback_${id}`);
  }

  // a record: what it says now; in the past, what it said first (the residue), and the thread is done
  residue(id, state) {
    const t = this.byId[id];
    if (!t?.record) return null;
    const r = t.record;
    if (state !== 'PAST') return { lines: [{ who: 'NONE', text: r.official }, ...(r.hint ? [{ who: 'KAI', text: r.hint }] : [])] };
    return { lines: [{ who: 'NONE', text: r.echo }, ...(r.after || [])], set: { [factOf(this.deck, t)]: true, ...(t.set || {}) }, log: r.log };
  }
}

export const conditionOk = (c) => {
  try {
    compileCondition(c);
    return true;
  } catch {
    return false;
  }
};
