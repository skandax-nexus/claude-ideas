// AFTERZERO soundtrack + sound effects, generated live (no audio files).
//
// Calm, melodic and warm: soft pads, a marimba-like pluck, bell tones and a
// round bass, playing a slow four-chord loop. Each reality state has its
// own key and colour; danger adds energy (faster plucks, brighter filter)
// rather than horror. The same engine can render offline (for trailers).

const MOODS = {
  // chords as MIDI notes; root is the lowest
  PHYSICAL: { name: 'Daylight', chords: [[48, 55, 64, 71, 74], [45, 52, 60, 67, 71], [41, 48, 57, 64, 69], [43, 50, 59, 64, 69]], cutoff: 2200, bell: 0.2 },
  INVERTED: { name: 'Upside Dream', chords: [[50, 57, 66, 69, 76], [47, 54, 62, 66, 73], [43, 50, 59, 66, 71], [45, 52, 61, 66, 73]], cutoff: 1800, bell: 0.35 },
  ECHO: { name: 'Memory', chords: [[51, 58, 67, 70, 74], [48, 55, 63, 67, 74], [44, 51, 60, 67, 72], [46, 53, 62, 65, 70]], cutoff: 2800, bell: 0.75 },
};
const BPM = 76;
const STEP = 60 / BPM / 2; // eighth notes

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class Synth {
  constructor(ctx = null) {
    this.ctx = ctx;
    this.muted = false;
    this.state = 'PHYSICAL';
    this.threat = 0;
    this.duck = 1;
    this.step = 0;
    this.seed = 1;
    if (ctx) this.build();
  }

  rand() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.build();
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(this.ctx.currentTime + 0.25), 50);
  }

  build() {
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = 0.7;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(c.destination);

    // a soft, roomy reverb from a generated impulse
    this.reverb = c.createConvolver();
    const len = Math.floor(c.sampleRate * 2.8);
    const ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (this.rand() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    this.reverb.buffer = ir;
    const wet = c.createGain();
    wet.gain.value = 0.45;
    this.reverb.connect(wet).connect(this.master);

    this.music = c.createGain();
    this.music.gain.value = 0.55;
    this.musicFilter = c.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 2200;
    this.music.connect(this.musicFilter);
    this.musicFilter.connect(this.master);
    this.musicFilter.connect(this.reverb);

    this.sfx = c.createGain();
    this.sfx.gain.value = 0.8;
    this.sfx.connect(this.master);
    this.sfx.connect(this.reverb);
  }

  // --- music -----------------------------------------------------------------
  schedule(until) {
    while (this.nextTime < until) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += STEP;
      this.step++;
    }
  }

  playStep(step, t) {
    const mood = MOODS[this.state] || MOODS.PHYSICAL;
    const bar = Math.floor(step / 8) % 4;
    const beat = step % 8;
    const chord = mood.chords[bar];
    const energy = Math.min(1, this.threat);

    if (beat === 0) {
      // pad: the whole chord, slow swell
      for (const n of chord.slice(1)) this.pad(mtof(n), t, STEP * 8.4, 0.022);
      this.bass(mtof(chord[0] - 12), t, STEP * 6, 0.09);
      this.musicFilter.frequency.setTargetAtTime(mood.cutoff + energy * 2500, t, 0.8);
    }
    if (beat === 4 && energy > 0.3) this.bass(mtof(chord[0] - 12), t, STEP * 3, 0.06);

    // pluck melody: pentatonic-ish from the chord, an octave up, sparse at rest
    const density = 0.32 + energy * 0.55;
    if (this.rand() < density || beat === 0) {
      const pool = chord.slice(1).concat(chord.slice(1).map((n) => n + 12));
      const n = pool[Math.floor(this.rand() * pool.length)] + 12;
      this.pluck(mtof(n), t + (beat % 2 ? STEP * 0.04 : 0), 0.06 * (beat === 0 ? 1.2 : 1));
    }
    // extra sixteenth when things get exciting
    if (energy > 0.5 && this.rand() < energy * 0.6) {
      const n = chord[1 + Math.floor(this.rand() * 4)] + 24;
      this.pluck(mtof(n), t + STEP / 2, 0.035);
    }
    // bells: more of them in ECHO
    if (beat === 6 && this.rand() < mood.bell) this.bell(mtof(chord[2] + 24), t, 0.05);
  }

  osc(type, f, t, dur, peak, attack, release, dest, detune = 0) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.setTargetAtTime(0.0001, t + Math.max(attack, dur - release), release / 3);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + release + 0.1);
    return o;
  }

  pad(f, t, dur, v) {
    this.osc('triangle', f, t, dur, v, 1.6, 2.2, this.music, -6);
    this.osc('sine', f, t, dur, v, 1.6, 2.2, this.music, 6);
  }

  bass(f, t, dur, v) {
    this.osc('sine', f, t, dur, v, 0.05, 0.8, this.music);
  }

  pluck(f, t, v, dest = this.music) {
    // marimba-ish: sine body + a quiet bright partial, quick decay
    this.osc('sine', f, t, 0.5, v, 0.004, 0.45, dest);
    this.osc('sine', f * 4, t, 0.08, v * 0.25, 0.002, 0.06, dest);
  }

  bell(f, t, v, dest = this.music) {
    this.osc('sine', f, t, 2.2, v, 0.005, 2.0, dest);
    this.osc('sine', f * 2.76, t, 1.2, v * 0.35, 0.005, 1.0, dest);
  }

  setState(state) {
    this.state = MOODS[state] ? state : 'PHYSICAL';
  }

  /** 0..1: how exciting things are right now (adds energy, never dread). */
  setThreat(v) {
    this.threat += (v - this.threat) * 0.05;
  }

  setDuck(on) {
    if (!this.ctx || this.ducked === on) return;
    this.ducked = on;
    this.music.gain.setTargetAtTime(on ? 0.3 : 0.55, this.ctx.currentTime, 0.3);
  }

  // --- sound effects ---------------------------------------------------------
  now(at) {
    return at ?? this.ctx.currentTime;
  }

  /** Harp glissando across the current mood. Up for entering a state, down for PHYSICAL. */
  sweep(up = true, at) {
    if (!this.ctx) return;
    const t = this.now(at);
    const chord = (MOODS[this.state] || MOODS.PHYSICAL).chords[0];
    const notes = [];
    for (let o = 0; o < 3; o++) for (const n of chord.slice(1)) notes.push(n + 12 * o);
    if (!up) notes.reverse();
    notes.slice(0, 10).forEach((n, i) => this.pluck(mtof(n), t + i * 0.035, 0.05, this.sfx));
  }

  chime(at) {
    if (!this.ctx) return;
    const t = this.now(at);
    [72, 76, 79, 84].forEach((n, i) => this.bell(mtof(n), t + i * 0.08, 0.06, this.sfx));
  }

  pickup(at) {
    if (!this.ctx) return;
    const t = this.now(at);
    [76, 83].forEach((n, i) => this.pluck(mtof(n), t + i * 0.07, 0.09, this.sfx));
  }

  deny(at) {
    if (!this.ctx) return;
    const t = this.now(at);
    this.pluck(mtof(57), t, 0.08, this.sfx);
    this.pluck(mtof(55), t + 0.12, 0.08, this.sfx);
  }

  /** Small UI tick, e.g. installing a law. */
  blip(freq = 660, dur = 0.12, _type, vol = 0.2, at) {
    if (!this.ctx) return;
    this.pluck(freq, this.now(at), Math.min(0.08, vol * 0.4), this.sfx);
  }

  alert(at) {
    if (!this.ctx) return;
    const t = this.now(at);
    [69, 73, 76].forEach((n, i) => this.pluck(mtof(n), t + i * 0.09, 0.07, this.sfx));
  }

  caught(at) {
    if (!this.ctx) return;
    const t = this.now(at);
    [76, 72, 69, 64].forEach((n, i) => this.bell(mtof(n), t + i * 0.14, 0.05, this.sfx));
  }

  step_(at) {
    if (!this.ctx) return;
    const c = this.ctx, t = this.now(at);
    const len = Math.floor(c.sampleRate * 0.05);
    const b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (this.rand() * 2 - 1) * Math.pow(1 - i / len, 3);
    const s = c.createBufferSource();
    s.buffer = b;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900 + this.rand() * 300;
    const g = c.createGain();
    g.gain.value = 0.12;
    s.connect(f).connect(g).connect(this.sfx);
    s.start(t);
  }

  footstep() {
    this.step_();
  }

  talk(who) {
    if (!this.ctx || who === 'NONE') return;
    const base = { JUNO: 74, TICK: 86, VARGA: 67, CUSTODIAN: 62, YOU: 71, OTHER: 79 }[who] ?? 72;
    this.pluck(mtof(base), this.ctx.currentTime, 0.03, this.sfx);
  }

  // --- interaction sounds (v0.3): every action you take has its own voice ---
  noise(t, dur, { type = 'bandpass', from = 800, to = 800, q = 1, vol = 0.1 } = {}) {
    const c = this.ctx;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (this.rand() * 2 - 1) * Math.sin((Math.PI * i) / len);
    const src = c.createBufferSource();
    src.buffer = b;
    const f = c.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.sfx);
    src.start(t);
  }
  // a terminal waking up: soft data chirps rising into a bell
  terminal(at) {
    if (!this.ctx) return;
    const t = this.now(at);
    [84, 88, 91, 86, 93].forEach((n, i) => this.osc('triangle', mtof(n), t + i * 0.045, 0.06, 0.025, 0.003, 0.05, this.sfx));
    this.bell(mtof(79), t + 0.25, 0.04, this.sfx);
  }
  // a door gliding open: an airy whoosh with a low hum underneath
  door(at) {
    if (!this.ctx) return;
    const t = this.now(at);
    this.noise(t, 0.9, { from: 300, to: 2400, q: 0.8, vol: 0.14 });
    this.osc('sine', mtof(43), t, 0.9, 0.05, 0.05, 0.6, this.sfx);
    this.pluck(mtof(79), t + 0.75, 0.05, this.sfx);
  }
  // a key turning or a core seating: click, then a warm two-note confirmation
  insert(at) {
    if (!this.ctx) return;
    const t = this.now(at);
    this.noise(t, 0.05, { type: 'highpass', from: 3000, to: 3000, vol: 0.12 });
    this.osc('sine', mtof(55), t + 0.05, 0.35, 0.08, 0.005, 0.3, this.sfx);
    [74, 81].forEach((n, i) => this.bell(mtof(n), t + 0.12 + i * 0.1, 0.045, this.sfx));
  }
  // a memory beacon saving: a slow shimmering arpeggio
  beacon(at) {
    if (!this.ctx) return;
    const t = this.now(at);
    [67, 74, 79, 83, 86, 91].forEach((n, i) => this.bell(mtof(n), t + i * 0.06, 0.03, this.sfx));
    this.noise(t, 1.2, { from: 5000, to: 9000, q: 4, vol: 0.03 });
  }
  // a law token: sparkles spiralling up
  token(at) {
    if (!this.ctx) return;
    const t = this.now(at);
    [79, 83, 86, 91, 95].forEach((n, i) => this.pluck(mtof(n), t + i * 0.05, 0.06, this.sfx));
    this.bell(mtof(98), t + 0.3, 0.03, this.sfx);
  }
  // someone notices you and says hello
  greet(who, at) {
    if (!this.ctx) return;
    const t = this.now(at);
    const base = { JUNO: 74, TICK: 86, CREW: 69 }[who] ?? 71;
    this.pluck(mtof(base), t, 0.06, this.sfx);
    this.pluck(mtof(base + 5), t + 0.12, 0.06, this.sfx);
  }
  // jump and land: soft cloth-and-boot thumps
  jump(at) {
    if (!this.ctx) return;
    this.noise(this.now(at), 0.12, { type: 'lowpass', from: 600, to: 1400, vol: 0.06 });
  }
  land(at) {
    if (!this.ctx) return;
    const t = this.now(at);
    this.noise(t, 0.1, { type: 'lowpass', from: 500, to: 200, vol: 0.12 });
    this.osc('sine', 70, t, 0.12, 0.08, 0.004, 0.1, this.sfx);
  }
  // menus: a tiny tick on hover, a soft pop on press
  ui(kind = 'press', at) {
    if (!this.ctx) return;
    const t = this.now(at);
    if (kind === 'hover') this.osc('sine', mtof(96), t, 0.03, 0.012, 0.002, 0.025, this.sfx);
    else this.osc('triangle', mtof(84), t, 0.06, 0.03, 0.002, 0.05, this.sfx);
  }
  // a time sweeper's beam passing close by
  zap(at) {
    if (!this.ctx) return;
    const t = this.now(at);
    this.noise(t, 0.25, { from: 4000, to: 600, q: 3, vol: 0.08 });
  }

  toggleMute() {
    if (!this.ctx) return;
    this.muted = !this.muted;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.7 * (this.volume ?? 1), this.ctx.currentTime, 0.05);
  }

  setVolume(v) {
    this.volume = v;
    if (this.ctx && !this.muted) this.master.gain.setTargetAtTime(0.7 * v, this.ctx.currentTime, 0.05);
  }

  /**
   * Render music + timed sound effects to a WAV (for trailers).
   * cues: [{ t, fx, args, state, threat }]
   */
  static async renderWav(duration, cues = [], sampleRate = 32000) {
    const ctx = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
    const s = new Synth(ctx);
    s.nextTime = 0.05;
    const sorted = [...cues].sort((a, b) => a.t - b.t);
    let ci = 0;
    while (s.nextTime < duration) {
      while (ci < sorted.length && sorted[ci].t <= s.nextTime) {
        const c = sorted[ci++];
        if (c.state) s.state = c.state;
        if (c.threat !== undefined) s.threat = c.threat;
        if (c.fx) s[c.fx](...(c.args || []), c.t);
      }
      s.playStep(s.step, s.nextTime);
      s.nextTime += STEP;
      s.step++;
    }
    for (; ci < sorted.length; ci++) if (sorted[ci].fx) s[sorted[ci].fx](...(sorted[ci].args || []), sorted[ci].t);
    const buf = await ctx.startRendering();
    return encodeWav(buf);
  }
}

function encodeWav(buf) {
  const ch = buf.numberOfChannels, n = buf.length, rate = buf.sampleRate;
  const out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
  out.setUint32(24, rate, true); out.setUint32(28, rate * ch * 2, true); out.setUint16(32, ch * 2, true);
  out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const data = [...Array(ch)].map((_, i) => buf.getChannelData(i));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
    const v = Math.max(-1, Math.min(1, data[c][i]));
    out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
    o += 2;
  }
  return out.buffer;
}
