// System 5: the real objective is hidden. The player always sees the
// objective that best fits the evidence they have; when evidence changes,
// the objective is rewritten and the old one is kept, struck through, with
// the reason it stopped being true.

import { compileCondition } from './conditions.js';

export class Objectives {
  constructor(layers, facts) {
    this.layers = layers.map((l) => ({ ...l, _when: compileCondition(l.when) }));
    this.facts = facts;
    this.current = -1;
    this.history = [];
    this.onChange = () => {};
  }

  update(silent = false) {
    let idx = -1;
    this.layers.forEach((l, i) => {
      if (l._when(this.facts.ctx())) idx = i;
    });
    if (idx > this.current) {
      const prev = this.layers[this.current];
      for (let i = this.current + 1; i <= idx; i++) {
        const l = this.layers[i];
        if (l._when(this.facts.ctx())) this.history.push({ text: l.text, because: l.because || '' });
      }
      this.current = idx;
      if (!silent) this.onChange(this.layers[idx], prev);
    }
    return this.layers[this.current] || null;
  }

  get text() {
    return this.layers[this.current]?.text || '';
  }
}
