// Reality manager: every room has a state (PHYSICAL / INVERTED / ECHO), and
// the device's installed laws decide what each state *does*. Rooms may also
// carry scripted overrides (e.g. the antechamber's first, lawless zero-g).
//
// The state set is configurable (THE LAST VERSION OF EARTH runs on PAST /
// PRESENT / FUTURE / INVERTED): `states` lists them, `baseline` is the one a
// room is in until something changes it, `residue` is the one that shows
// memories (echo geometry), and `stateEffects` gives a state effects of its
// own without a law (PAST: echoes are visible and solid). Each room can also
// declare which of the states it has (`setAvailable`): cycling only visits
// those, and setting a state a room lacks is refused.

import { STATES, DEFAULT_LAWS, compileLaws, parseLaw } from './Laws.js';

export { STATES };

export class RealityEngine {
  constructor({ slots = 3, unlocked = 2, laws = DEFAULT_LAWS, states = STATES, baseline = states[0], residue = 'ECHO', stateEffects = {} } = {}) {
    this.rooms = {};
    this.locked = new Set();
    this.overrides = {};
    this.available = {}; // room -> the states it was authored with (missing: all)
    this.states = [...states];
    this.baseline = baseline;
    this.residue = this.states.includes(residue) ? residue : null;
    this.stateEffects = stateEffects; // state -> { effect: true }
    this.globalEffects = {}; // effect -> true, in every state (a causal anchor)
    this.slots = slots;
    this.unlocked = unlocked;
    this.laws = Array.from({ length: slots }, (_, i) => (laws[i] ? { ...laws[i] } : null));
    this.listeners = {};
    this.recompile();
  }

  on(evt, fn) {
    (this.listeners[evt] ||= []).push(fn);
  }

  emit(evt, data) {
    for (const fn of this.listeners[evt] || []) fn(data);
  }

  state(room) {
    return this.rooms[room] || this.baseline;
  }

  // the states a room can be in
  statesOf(room) {
    return this.available[room] || this.states;
  }

  setAvailable(room, list) {
    if (!list) delete this.available[room];
    else this.available[room] = list.filter((s) => this.states.includes(s));
  }

  setState(room, s, { force = false } = {}) {
    if (!this.states.includes(s)) throw new Error(`Unknown state ${s}`);
    if (!force && this.locked.has(room)) return false;
    if (!force && !this.statesOf(room).includes(s)) return false;
    const from = this.state(room);
    if (from === s) return false;
    this.rooms[room] = s;
    this.emit('shift', { room, from, to: s });
    return true;
  }

  cycle(room) {
    const list = this.statesOf(room);
    if (list.length < 2) return false;
    const s = this.state(room);
    const i = list.indexOf(s);
    return this.setState(room, list[(i + 1) % list.length]);
  }

  lock(room, v = true) {
    if (v) this.locked.add(room);
    else this.locked.delete(room);
  }

  setOverride(room, o) {
    if (o) this.overrides[room] = o;
    else delete this.overrides[room];
    this.emit('laws', this);
  }

  // an effect that holds in every state until it is cleared (HELD MATTER PERSISTS by deed, not by law)
  setGlobal(effect, on = true) {
    if (on) this.globalEffects[effect] = true;
    else delete this.globalEffects[effect];
    this.emit('laws', this);
  }

  // --- laws -------------------------------------------------------------
  setLaw(i, law) {
    if (i >= this.unlocked) return { ok: false, error: 'SLOT LOCKED' };
    const r = parseLaw(law);
    if (!r.ok) return r;
    this.laws[i] = law ? { ...law } : null;
    this.recompile();
    this.emit('laws', this);
    return r;
  }

  unlockSlot(n = this.unlocked + 1) {
    this.unlocked = Math.min(this.slots, Math.max(this.unlocked, n));
    this.emit('laws', this);
  }

  recompile() {
    const { effects, paradoxes } = compileLaws(this.laws.slice(0, this.unlocked));
    this.effects = effects;
    this.paradoxes = paradoxes;
  }

  has(effect, state) {
    if (this.globalEffects[effect]) return true;
    if (this.stateEffects[state]?.[effect]) return true;
    return this.effects[effect]?.has(state) || false;
  }

  hasIn(effect, room) {
    const o = this.overrides[room];
    if (o && effect in o) return !!o[effect];
    return this.has(effect, this.state(room));
  }

  // -1 = normal, +1 = reversed, 0 = weightless
  gravity(room) {
    if (!room) return -1;
    if (this.hasIn('zeroG', room)) return 0;
    if (this.hasIn('gravityFlip', room)) return 1;
    return -1;
  }

  serialize() {
    return { rooms: this.rooms, laws: this.laws, unlocked: this.unlocked, locked: [...this.locked], overrides: this.overrides, available: this.available, globalEffects: this.globalEffects };
  }

  restore(d) {
    this.rooms = { ...d.rooms };
    this.laws = Array.from({ length: this.slots }, (_, i) => d.laws[i] || null);
    this.unlocked = d.unlocked;
    this.locked = new Set(d.locked || []);
    this.overrides = { ...(d.overrides || {}) };
    this.available = { ...(d.available || {}) };
    this.globalEffects = { ...(d.globalEffects || {}) };
    this.recompile();
  }
}
