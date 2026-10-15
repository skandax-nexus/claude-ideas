// Procedural audio (no files): a drone that changes per reality state, a
// shift sweep, pickup chimes, and the Observer's proximity pulse.

const STATE_TONES = { PHYSICAL: [55, 82.4], INVERTED: [46.2, 69.3], ECHO: [65.4, 98] };

export class Synth {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  start() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = (this.ctx = new AC());
    this.master = c.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(c.destination);

    this.droneGain = c.createGain();
    this.droneGain.gain.value = 0.0;
    this.filter = c.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 380;
    this.filter.connect(this.droneGain).connect(this.master);
    this.oscs = [0, 1, 2].map((i) => {
      const o = c.createOscillator();
      o.type = i === 2 ? 'triangle' : 'sawtooth';
      o.frequency.value = 55 * (i + 1);
      o.detune.value = (i - 1) * 7;
      const g = c.createGain();
      g.gain.value = i === 2 ? 0.05 : 0.09;
      o.connect(g).connect(this.filter);
      o.start();
      return o;
    });
    this.droneGain.gain.linearRampToValueAtTime(0.35, c.currentTime + 3);

    this.pulseGain = c.createGain();
    this.pulseGain.gain.value = 0;
    const p = c.createOscillator();
    p.type = 'sine';
    p.frequency.value = 38;
    p.connect(this.pulseGain).connect(this.master);
    p.start();
  }

  setState(state) {
    if (!this.ctx) return;
    const [a, b] = STATE_TONES[state] || STATE_TONES.PHYSICAL;
    const t = this.ctx.currentTime;
    this.oscs[0].frequency.setTargetAtTime(a, t, 0.4);
    this.oscs[1].frequency.setTargetAtTime(b, t, 0.4);
    this.oscs[2].frequency.setTargetAtTime(a * 4, t, 0.4);
    this.filter.frequency.setTargetAtTime(state === 'ECHO' ? 900 : state === 'INVERTED' ? 260 : 380, t, 0.3);
  }

  blip(freq = 660, dur = 0.12, type = 'sine', vol = 0.2) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  sweep(up = true) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(up ? 80 : 900, t);
    o.frequency.exponentialRampToValueAtTime(up ? 900 : 60, t + 0.45);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.55);
  }

  chime() {
    [880, 1320, 1760].forEach((f, i) => setTimeout(() => this.blip(f, 0.25, 'triangle', 0.12), i * 70));
  }

  deny() {
    this.blip(140, 0.25, 'square', 0.1);
  }

  // 0..1 - how close/alert the Observer is
  setThreat(v) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const beat = (Math.sin(t * (4 + v * 8)) > 0.6 ? 1 : 0) * v * 0.5;
    this.pulseGain.gain.setTargetAtTime(beat, t, 0.03);
  }

  toggleMute() {
    if (!this.ctx) return;
    this.muted = !this.muted;
    this.master.gain.value = this.muted ? 0 : 0.5;
  }
}
