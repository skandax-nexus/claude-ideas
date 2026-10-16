// Narrative manager: persistent facts + authored rules.
//
// A rule is { id, when, then, once = true }. `then` is a list of effects:
//   { set: { fact: value, ... } }   change facts
//   { inc: 'fact' }                 add one
//   anything else                   forwarded to onEffect (say, log, token...)
// Rules are re-evaluated whenever a fact changes, until the world is stable.

import { compileCondition } from './conditions.js';

export class FactStore {
  constructor(initial = {}) {
    this.facts = { ...initial };
    this.rules = [];
    this.fired = new Set();
    this.listeners = [];
    this.onEffect = () => {};
    this._evaluating = false;
    this._dirty = false;
    this.rulesEnabled = true; // the prologue's authored rules; off out on the vessel
  }

  get(k) {
    return this.facts[k];
  }

  ctx(state = null) {
    return { fact: (k) => this.facts[k], state };
  }

  test(cond, state = null) {
    return !!compileCondition(cond)(this.ctx(state));
  }

  set(k, v = true) {
    if (this.facts[k] === v) return;
    const old = this.facts[k];
    this.facts[k] = v;
    for (const fn of this.listeners) fn(k, v, old);
    this._dirty = true;
    this.evaluateRules();
  }

  inc(k, n = 1) {
    this.set(k, (this.facts[k] || 0) + n);
  }

  onChange(fn) {
    this.listeners.push(fn);
  }

  addRules(rules) {
    for (const r of rules) this.rules.push({ once: true, ...r, _when: compileCondition(r.when) });
    this.evaluateRules();
  }

  apply(effects) {
    for (const e of effects || []) {
      if (e.set) for (const [k, v] of Object.entries(e.set)) this.set(k, v);
      else if (e.inc) this.inc(e.inc);
      else this.onEffect(e);
    }
  }

  evaluateRules() {
    if (this._evaluating || !this.rulesEnabled) return;
    this._evaluating = true;
    try {
      for (let pass = 0; pass < 16; pass++) {
        this._dirty = false;
        for (const r of this.rules) {
          if (r.once && this.fired.has(r.id)) continue;
          if (!r._when(this.ctx())) continue;
          this.fired.add(r.id);
          this.apply(r.then);
        }
        if (!this._dirty) break;
      }
    } finally {
      this._evaluating = false;
    }
  }

  serialize() {
    return { facts: this.facts, fired: [...this.fired] };
  }

  restore(data) {
    this.facts = { ...data.facts };
    this.fired = new Set(data.fired || []);
  }
}
