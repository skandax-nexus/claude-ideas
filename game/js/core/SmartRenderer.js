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
// already painted, during a sector load, or after 45 s of play if neither comes.
// While one waits it keeps watching: a step up that the frames no longer have
// room for is dropped.
//
// Every change costs something (a resolution pop and new render targets, or a
// recompile), so it remembers: a state it had to leave is not tried again for a
// minute (a preset: two), twice as long each time it fails again, up to ten
// minutes. It steps down after 4 s of slow frames and up only after 10 s of
// headroom, and it counts frames that missed the screen's refresh, so steady judder
// (more than one frame in eight late, around 52 fps on a 60 Hz screen) counts as
// slow even when the average looks fine.
//
// A frame over 250 ms (a load, a compile, a return from the background) stays out
// of the averages, but three in one window are the device's real rate, and that
// window is slow.
//
// Once a state has held for 20 s it is stored on the device (the lowest state even
// when it is still slow: there is nowhere lower to go), so the next page load (a
// new game, a load and QUIT all reload the page) starts there instead of stepping
// down from full again, and compiles one shader set instead of two.
import { QUALITY } from '../ui/Settings.js';
import { NS } from './Edition.js';

const ORDER = ['low', 'medium', 'high'];
// TARGET and GOOD are shares of the frame rate the screen allows (1 / vsync): 50 and 58 fps at
// 60 Hz, and on a 90/120 Hz phone that the game caps at 45/60 fps, the same shares of the cap,
// so a capped 60 is not read as missing 120 and an uncapped 90 is not read as headroom.
const TARGET = 5 / 6; // what we try to stay above
const GOOD = 29 / 30; // what counts as headroom
const LATE = 1.5; // a frame later than its slot by half a refresh missed the screen (1.5 intervals at 60 Hz)
const BAN_MAX = 600; // s: the longest a state that failed is kept out
const SKEY = `${NS}smart.v1`; // the settled state, per edition
const KEEP = 864e5; // ms: a stored state older than a day is ignored
const LONG = 0.25; // s: a frame this long is a stall, not the steady rate
const WAIT = 45; // s of play a queued preset change waits for a menu or a sector load

export class SmartRenderer {
  constructor(game) {
    this.g = game;
    this.scale = 1;
    this.level = null; // the preset actually in use (<= the chosen one)
    this.acc = 0;
    this.frames = 0;
    this.late = 0; // frames in this window that missed the refresh
    this.long = 0; // frames in this window over LONG (left out of acc and frames)
    this.slow = 0;
    this.fast = 0;
    this.note = '';
    this.pending = null; // a preset change waiting for a safe moment
    this.pendingAt = 0; // clock time it was queued
    this.vsync = 1 / 60; // the interval between frames the screen allows (s): its refresh, or the game's cap (main.js setRefresh)
    this.panel = 1 / 60; // the screen's refresh interval (s)
    this.clock = 0; // seconds of play watched (a stall counts LONG at most), for the bans and WAIT
    this.ban = {}; // state -> clock time until which it is not tried again
    this.fails = {}; // state -> how often it had to be left
    this.held = 0; // judged windows the current state has lasted
    this.stored = ''; // the state this page last stored
  }

  get chosen() {
    return this.g.settings.quality;
  }

  reset() {
    this.scale = 1;
    this.level = this.chosen;
    this.pending = null;
    this.clock = 0;
    this.ban = {};
    this.fails = {};
    this.held = 0;
    this.restart();
    // the first reset of the page (the constructor's applySettings) starts where the
    // last visit settled; later ones (a new quality setting) start from the top
    if (!this.restored) {
      this.restored = true;
      this.restore();
    }
  }

  restore() {
    try {
      const s = JSON.parse(localStorage.getItem(SKEY) || 'null');
      const i = ORDER.indexOf(s?.level);
      if (s && s.chosen === this.chosen && Date.now() - s.at < KEEP && i >= 0 && i <= ORDER.indexOf(this.chosen)) {
        this.level = s.level;
        this.scale = Math.max(0.6, Math.min(1, +s.scale || 1));
        // what lay just above it did not hold last time: it waits the usual ban
        if (i < ORDER.indexOf(this.chosen)) this.forbid(`level:${ORDER[i + 1]}`, 120);
        if (this.scale < 0.99) this.forbid(this.key(this.level, this.scale + 0.1), 60);
      }
    } catch {
      /* storage blocked: start from the top */
    }
  }

  remember() {
    const k = `${this.chosen}:${this.level}@${this.scale}`;
    if (k === this.stored) return;
    this.stored = k;
    try {
      localStorage.setItem(SKEY, JSON.stringify({ chosen: this.chosen, level: this.level, scale: this.scale, at: Date.now() }));
    } catch {
      /* not stored */
    }
  }

  // start a new judging window (and the counts of slow and good windows)
  restart(counts = true) {
    this.acc = this.frames = this.late = this.long = 0;
    if (counts) this.slow = this.fast = 0;
  }

  // called once per rendered frame with the frame's real duration (seconds)
  sample(dt) {
    const g = this.g;
    // a window never spans a menu, a pause or a hidden tab
    if (!g.settings.smart || g.capturing || !g.started || g.menu || g.paused || document.hidden) return this.restart(false);
    if (this.level === null) this.level = this.chosen;
    // play time: the first frame back from the background spans the whole time away
    this.clock += Math.min(dt, LONG);
    if (dt > LONG) {
      // a load, a compile or a resume: not the steady rate, so it stays out of the window. Three
      // in one window are the rate (a device this slow, or one that stalls this often): judge now
      if (++this.long < 3) return;
    } else {
      this.acc += dt;
      this.frames++;
      if (dt > this.vsync + (LATE - 1) * this.panel) this.late++;
      if (this.acc < 2) return; // judge every two seconds
    }
    const fps = this.acc ? this.frames / this.acc : 0;
    const late = this.frames ? this.late / this.frames : 1;
    const hz = 1 / this.vsync;
    const slow = this.long >= 3 || fps < TARGET * hz || late > 0.12;
    this.restart(false);
    this.fps = fps;
    if (this.pending) {
      // nothing else changes until a queued preset is in, but a step up that the frames no longer
      // have room for is dropped, and that preset waits like one that failed. A step down stands.
      if (slow && ORDER.indexOf(this.pending) > ORDER.indexOf(this.level)) {
        this.forbid(`level:${this.pending}`, 120);
        this.pending = null;
        this.restart();
      }
      return;
    }
    // settled: 20 s in this state, and the lowest state is stored even while it is slow
    if (++this.held >= 10 && (!slow || (ORDER.indexOf(this.level) === 0 && this.scale < 0.61))) this.remember();
    if (slow) {
      this.fast = 0;
      if (++this.slow < 2) return; // two slow windows in a row before acting
      this.slow = 0;
      const i = ORDER.indexOf(this.level);
      if (this.scale > 0.61) {
        this.forbid(this.key(this.level, this.scale), 60);
        this.setScale(this.scale - 0.1);
      } else if (i > 0) {
        this.forbid(this.key(this.level, this.scale), 60);
        this.forbid(`level:${this.level}`, 120);
        this.request(ORDER[i - 1]);
      }
    } else if (fps > GOOD * hz && late < 0.03) {
      this.slow = 0;
      if (++this.fast < 5) return; // ten seconds of headroom
      this.fast = 0;
      const i = ORDER.indexOf(this.level);
      if (this.scale < 0.99) {
        const to = +(this.scale + 0.1).toFixed(2);
        if (this.allowed(this.key(this.level, to))) this.setScale(to);
      } else if (i < ORDER.indexOf(this.chosen) && this.allowed(`level:${ORDER[i + 1]}`)) this.request(ORDER[i + 1]);
    } else this.slow = this.fast = 0;
  }

  key(level, scale) {
    return `${level}@${scale.toFixed(1)}`;
  }

  // keep a state that just failed out for a while: base seconds, doubling each time
  forbid(k, base) {
    this.fails[k] = (this.fails[k] || 0) + 1;
    this.ban[k] = this.clock + Math.min(BAN_MAX, base * 2 ** (this.fails[k] - 1));
  }

  allowed(k) {
    return !(this.ban[k] > this.clock);
  }

  setScale(s) {
    this.scale = Math.max(0.6, Math.min(1, +s.toFixed(2)));
    this.held = 0;
    this.restart();
    this.apply();
  }

  // queue a preset change; the game calls flush() when a stall will not be seen
  request(level) {
    this.pending = level;
    this.pendingAt = this.clock;
    this.restart();
  }

  // a queued change that no menu or sector load has taken in WAIT seconds of play
  get overdue() {
    return !!this.pending && this.clock - this.pendingAt > WAIT;
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
    this.held = 0;
    this.restart();
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
