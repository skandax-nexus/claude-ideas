// Smart renderer: keeps the game smooth on any device, offline. It watches the
// real frame rate while you play and trades resolution first, then effects,
// for smoothness - and gives them back when there is headroom.
//
//   1. render scale: 100% -> 60% of the device's pixels, in small steps
//   2. if that isn't enough, the next lower quality preset (HIGH -> MEDIUM -> LOW)
//   3. with steady headroom, scale (and the preset you chose) come back
//
// The quality preset in Settings is the ceiling; the smart renderer never goes
// above it. Toggle in Settings (on by default).
//
// A preset change rebuilds the lights, shadows and post chain and compiles a new
// shader set, which can stall a phone for a moment. So step 2 is only requested
// here; the game applies it (flush) at a safe moment: behind a menu that has
// already painted, during a sector load, or after 45 s if neither comes.
import { QUALITY } from '../ui/Settings.js';

const ORDER = ['low', 'medium', 'high'];
const TARGET = 50; // fps we try to stay above
const GOOD = 58; // fps that counts as headroom

export class SmartRenderer {
  constructor(game) {
    this.g = game;
    this.scale = 1;
    this.level = null; // the preset actually in use (<= the chosen one)
    this.acc = 0;
    this.frames = 0;
    this.slow = 0;
    this.fast = 0;
    this.note = '';
    this.pending = null; // a preset change waiting for a safe moment
    this.pendingAt = 0;
  }

  get chosen() {
    return this.g.settings.quality;
  }

  reset() {
    this.scale = 1;
    this.level = this.chosen;
    this.pending = null;
    this.acc = this.frames = 0;
    this.slow = this.fast = 0;
  }

  // called once per rendered frame with the frame's real duration (seconds)
  sample(dt) {
    const g = this.g;
    if (!g.settings.smart || g.capturing || !g.started || g.menu || g.paused || document.hidden) return;
    if (this.level === null) this.level = this.chosen;
    if (this.pending) return; // nothing else changes until the queued preset is in
    this.acc += dt;
    this.frames++;
    if (this.acc < 2) return; // judge every two seconds
    const fps = this.frames / this.acc;
    this.acc = 0;
    this.frames = 0;
    this.fps = fps;
    if (fps < TARGET) {
      this.fast = 0;
      if (++this.slow < 2) return; // two slow windows in a row before acting
      this.slow = 0;
      if (this.scale > 0.61) this.setScale(this.scale - 0.1);
      else {
        const i = ORDER.indexOf(this.level);
        if (i > 0) this.request(ORDER[i - 1]);
      }
    } else if (fps > GOOD) {
      this.slow = 0;
      if (++this.fast < 3) return; // six seconds of headroom
      this.fast = 0;
      const i = ORDER.indexOf(this.level);
      if (this.scale < 0.99) this.setScale(this.scale + 0.1);
      else if (i < ORDER.indexOf(this.chosen)) this.request(ORDER[i + 1]);
    } else this.slow = this.fast = 0;
  }

  setScale(s) {
    this.scale = Math.max(0.6, Math.min(1, +s.toFixed(2)));
    this.apply();
  }

  // queue a preset change; the game calls flush() when a stall will not be seen
  request(level) {
    this.pending = level;
    this.pendingAt = performance.now();
  }

  flush() {
    if (!this.pending) return;
    const l = this.pending;
    this.pending = null;
    this.setLevel(l);
  }

  // change the preset now (flush, and tests that drive the renderer directly)
  setLevel(level, note) {
    this.level = level;
    this.scale = Math.min(this.scale, 0.9);
    this.note = note || '';
    this.acc = this.frames = 0;
    this.slow = this.fast = 0;
    this.g.applyQuality();
  }

  // the preset to render with right now
  quality() {
    const lvl = this.g.settings.smart && this.level && ORDER.indexOf(this.level) < ORDER.indexOf(this.chosen) ? this.level : this.chosen;
    return QUALITY[lvl];
  }

  apply() {
    const q = this.quality();
    this.g.renderer.setPixelRatio(Math.min(window.devicePixelRatio, q.pixelRatio) * (this.g.settings.smart ? this.scale : 1));
    this.g.resize();
  }
}
