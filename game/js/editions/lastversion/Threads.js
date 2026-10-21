// THE LAST VERSION OF EARTH: threads (OVERHAUL.md §3.3, §9.8). A rewritten mission is one map with soft quarters;
// each quarter holds main threads (the story's way through) and side stories. The objective is the first main
// thread not yet done, with its "because" line; THINK reads that thread's three hint tiers; a side story shows on
// the HUD only while it is tracked from the case board. A mission not yet rewritten runs through the shim: each
// legacy beat is one thread in quarter i (its objectives and hints stay the mission's own).
//
//   mission  { quarters: [{ name, threads, sides, barks }], talks: { npcId: [nodes] }, deductions: { id: { ... } },
//              coldOpen: { shots, lines, cue, first?, title?: { shots, lines }, set?, then?, minutes? },
//              hook: { lines, cue, minutes? }, minutes: { main, optional } }
//   thread   { id, kind, goal, because, at, when?, after?: [ids], until?, done?, set?, ev?, log?, say?: lines,
//              hints: [3 tiers], minutes, ...the kind's own fields }
//   side     { id, name, giver, start?, done, case?, hook?: lines, threads, minutes? }
//
// The kinds (and what placeThreads puts at their landmark):
//   go       reach a landmark: a trigger of radius r (4 m) at `at`
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
// A thread's fact is t_<mkey>_<id>; it is set the first time the thread counts as done, with its `set`, `ev`
// and `log`, and its `say` lines are said (once: t_<mkey>_<id>_paid marks it, as kinds that complete themselves
// set the thread's fact directly). A thread whose `until` holds before it is done was walked past (a
// clue not found): it is no longer the objective.
import { compileCondition } from '../../core/conditions.js';
import { resolveAnchor, toWorld, spotModel } from './processes.js';

export const KINDS = ['go', 'talk', 'clue', 'residue', 'deduce', 'scene', 'choice', 'tasks', 'stealth', 'chase', 'cinema', 'invert'];
// the length model's minutes when a thread does not give its own (§9.8)
export const MINUTES = { go: 2, talk: 2, clue: 1, residue: 3, deduce: 3, scene: 1, choice: 2, tasks: 3, stealth: 5, chase: 5, cinema: 2, invert: 5, side: 8, coldOpen: 2, hook: 1 };
// a legacy beat's kind as a thread
const SHIM_KIND = { arrival: 'scene', log: 'scene', contradiction: 'residue', encounter: 'talk', scene: 'scene', choice: 'choice', tasks: 'tasks', custom: 'scene' };
const SHIM_MIN = { arrival: 3, log: 3, contradiction: 4, encounter: 4, scene: 4, choice: 4, tasks: 6, custom: 8 };

export const isRewritten = (m) => Array.isArray(m?.quarters) && m.quarters.length > 0;
export const factOf = (m, t) => `t_${m.mkey || m.key}_${t.id}`;
export const sideFact = (m, s) => `side_${m.mkey || m.key}_${s.id}`;

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
  const spot = (s, t) => {
    const a = anchor(s.at || t.at);
    if (!a) return;
    const pos = toWorld(a, s.offset || [0, 1.2, 0]);
    level.interactables.push({ id: s.id, kind: 'scene', scene: s.scene || s.id, pos, yaw: a.yaw + (s.turn || 0), r: s.r ?? 2.4, prompt: s.prompt || 'LOOK', room: a.room,
      ...(s.model ? { model: typeof s.model === 'function' ? s.model : spotModel(s.model) } : {}), ...(s.kit ? { kit: s.kit } : {}), when: s.when, color: s.color, ...(s.once ? { once: true } : {}) });
    for (const tx of s.texts || []) level.texts.push({ text: tx.text, pos: toWorld(a, tx.at || [0, 2, 0.05]), rotY: a.yaw + (tx.turn || 0), size: tx.size || 0.2, color: tx.color || '#ffe6c0', when: tx.when, room: a.room });
  };
  for (const t of threadsOf(deck)) {
    for (const s of t.spots || []) spot(s, t);
    if (t.spot) spot({ id: t.scene || t.id, scene: t.scene, ...t.spot }, t);
    if ((t.kind === 'go' || t.kind === 'stealth') && t.at && !t.done) {
      const a = anchor(t.at);
      const r = t.r ?? 4;
      if (a) level.triggers.push({ box: [a.pos[0] - r, a.pos[1] - 1.5, a.pos[2] - r, a.pos[0] + r, a.pos[1] + 5, a.pos[2] + r], set: { [factOf(deck, t)]: true }, when: t.when, once: true, room: a.room });
    }
    if (t.kind === 'deduce' && t.at && deck.deductions?.[t.deduction]) spot({ id: `deduce_${t.id}`, scene: `deduce:${t.deduction || t.id}`, prompt: t.prompt || 'PIECE IT TOGETHER', ...(t.spotOpts || {}) }, t);
    if (t.kind === 'residue' && t.at && t.record) {
      spot({ id: `residue_${t.id}`, scene: `residue:${t.id}`, prompt: t.record.prompt || 'READ IT', kit: t.record.kit, offset: t.record.offset }, t);
    }
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
  // the quarters: the room each one's spawn stands in (a quarter of rooms is reached by entering that room;
  // one of the open place by standing in its area)
  for (const q of level.quarters || []) q.room = roomAt(level, q.spawn) || level.outdoorRoom;
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
export class Threads {
  constructor(rt) {
    this.rt = rt;
    this.deck = null;
    this.list = [];
    this.byId = {};
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
  }

  done(t) {
    return isDone(this.g.facts, this.deck, t);
  }

  available(t) {
    const f = this.g.facts;
    return (!t.when || f.test(t.when)) && (t.after || []).every((id) => this.byId[id] && this.done(this.byId[id]));
  }

  passed(t) {
    return !!t.until && this.g.facts.test(t.until);
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
    if (!s || sideState(this.g.facts, this.deck, s) === 'resolved') return null;
    const t = (s.threads || []).find((x) => this.available(x) && !this.done(x) && !this.passed(x));
    return t ? { side: s, thread: t } : null;
  }

  // a fact changed: threads that are now done set their fact (once) with what they carry
  update() {
    if (!this.on) return;
    const g = this.g, f = g.facts;
    for (const t of this.list) {
      // (a kind that completes itself, a trigger, a chase's end, a staged moment, a deduction, a record, sets the
      // thread's fact directly: what the thread carries is paid out once, marked by <fact>_paid)
      const k = factOf(this.deck, t);
      if (f.get(`${k}_paid`) || !this.done(t)) continue;
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
    this.update(); // (a thread whose done reads a count, or a condition no fact change re-tested)
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
      const here = q.room && q.room !== lv.outdoorRoom ? g.room === q.room
        : g.room === lv.outdoorRoom && p.x >= q.area[0] && p.x < q.area[2] && p.z >= q.area[1] && p.z < q.area[3];
      if (here) { at = i; break; }
    }
    if (at < 0) return;
    this.here = at;
    if (at <= (c.quarter ?? 0)) return;
    c.quarter = at;
    g.hud.toast(`<small>${this.deck.name}</small><br>${lv.quarters[at].name}`, 2400);
    g.after(0.4, () => g.campaign === c && g.saveTo('auto'));
  }

  // the chase: DeckWorld walks her along her path; here she keeps ahead of Kai, never more than the leash (beyond
  // it she waits for him), her height follows the path (a stair down from the platform), and at its end she is gone.
  // It never fails.
  chase() {
    const g = this.g;
    for (const n of g.deckWorld.npcs) {
      const ch = n.n.chase;
      if (!ch || !n.model.visible || !n.n.path) continue;
      const m = n.model;
      const d = Math.hypot(g.player.pos.x - m.position.x, g.player.pos.z - m.position.z);
      n.n.speed = d > ch.leash ? 1e-6 : d < ch.ahead * 0.5 ? ch.speed * 2.2 : d < ch.ahead ? ch.speed * 1.35 : ch.speed;
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
      if (g.deckWorld.flags[`staged_${t.id}`]) continue;
      g.deckWorld.flags[`staged_${t.id}`] = true;
      rt.cinema.play({ shots: t.shots || null, lines: t.lines, cue: t.cue || null, letterbox: t.letterbox !== false }, () => {
        g.facts.set(k);
        this.update();
      });
      return;
    }
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
