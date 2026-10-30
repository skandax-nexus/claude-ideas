// THE LAST VERSION OF EARTH: REVERSE, the bible's inversion as a local verb (OVERHAUL.md §7).
//
// "Inverted state: temporarily reverses selected processes, subject to energy and stability
// limits." "Inversion: reverse selected motion or mechanism; local and readable; no universal
// rewind of all consequences. Mission 11." (BIBLE.txt)
//
// Three years stay switchable (Q, 1 2 3). REVERSE is something Kai does, not a year: he aims at
// one process he can see and holds it running backwards while the Chronolith's charge lasts.
//   input      R (a capture-phase listener that also stops the shared KeyR → year switch), 4, the
//              ⟲ touch button left of YEAR, and the floating target label
//   targeting  processes in Kai's room and year, within reach, nearest the crosshair (10°, 16° on
//              touch), in line of sight; on touch the nearest within 8 m in front of him as well
//   lifecycle  one press starts, a second press releases (D5); it also lets go when the charge runs
//              out, when the year changes, at a snap back, or when Kai walks away
//   cost       0.5 s of charge and some stability to start, the process's weight per second held
//   rules      R1–R6 (RULES), taught in Mission 11 and listed on the case board
// The HUD pieces (the REVERSE chip beside the year card, the crosshair ring, the touch button and
// the label) are the edition's own DOM and CSS (<style id="lvInv">); HUD.js is not changed.
import * as THREE from '../../../vendor/three.module.min.js';
import { compileCondition } from '../../core/conditions.js';
import { Process, LockLoop, STAB_COST, REVERSE_COLOR } from './processes.js';

export const RULES = [
  ['R1', 'One thing at a time.'],
  ['R2', 'It holds only while charged, then goes forward again.'],
  ['R3', 'What you do while it holds stays done: crossed, read, taken, opened.'],
  ['R4', 'If nothing pushes it forward, it stays reversed.'],
  ['R5', 'Reversing something already running backwards runs it forwards.'],
  ['R6', 'Never a person, never a memory.'],
];

// every line REVERSE makes anyone say (index.js allLines walks them for the voice pack)
export const INV_LINES = {
  watch: 'In the annex the third file un-burns for three seconds in every ten. Then it is ash again. Too short to read.',
  unlock: 'The ward isn\'t broken. It\'s being held… I can hold one thing. Only one, and only for a while.',
  refuse: 'Not now. The Chronolith can\'t hold anything back.',
  person: 'Not a person. It won\'t take a person.',
  memory: 'Not a memory. It won\'t take a memory.',
  bolt: 'Nothing pushes a bolt back in.',
  jam: 'It turns back, and snaps home. Not that one. It went in earlier.',
  intercom: 'Temporal discontinuity.', // (bible) the ward intercom; inside a reversed ward it plays backwards
};
// who says each of them (Kai, unless named here)
export const INV_SPEAKERS = { watch: 'NONE', intercom: 'PA' }; // (the ward intercom is a station speaker)

const DEG = Math.PI / 180;
const _f = new THREE.Vector3(), _eye = new THREE.Vector3(), _to = new THREE.Vector3(), _p = new THREE.Vector3();
const ROOT = { PRESENT: 45, PAST: 43, FUTURE: 36 }; // the drone sits on the year's root
const TONES = { RING: 261.63, BAR: 329.63, STAR: 392.0, CRESCENT: 523.25 };

export class Inversion {
  constructor(rt) {
    this.rt = rt;
    this.g = rt.g;
    this.procs = [];
    this.displays = [];
    this.shimmers = [];
    this.wards = [];
    this.active = null;
    this.target = null;
    this.time = 0;
    this.idleT = 9;
    this.tickT = 0;
    this.histT = 0;
    this.hist = new Map(); // watcher id → poses, 10 a second for 8 s (patrols play them back)
    this.seenWatchers = new Set(); // watchers in a reversed ward that have already had their cue
    this.saidAt = {};
    this.snd = new ReverseSound(this.g);
    if (typeof document !== 'undefined' && document.querySelector('#ui')) {
      this.ui = new ReverseUI(this);
      this.fxs = new ReverseFx(this.g);
      window.addEventListener('keydown', (e) => {
        if (e.code !== 'KeyR') return;
        const tag = e.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.stopImmediatePropagation(); // Q switches the year; R is REVERSE
        if (!e.repeat) this.press();
      }, true);
    }
  }

  // --- charge ---------------------------------------------------------------------------------
  // 8 s from Mission 11, 10 s after Mission 13 (the stabilizer coil retune), 12 s after Mission 18
  get cap() {
    const f = this.g.facts;
    return Math.max(8, f.get('inv_cap') || 0, f.get('m13_done') ? 10 : 0, f.get('m18_done') ? 12 : 0);
  }

  get state() {
    const c = this.g.campaign;
    if (!c) return (this._st ||= { cap: 8, charge: 8 });
    c.inv ||= { cap: this.cap, charge: this.cap };
    return c.inv;
  }

  get unlocked() {
    return !!this.g.facts.get('has_inversion');
  }

  // --- a level arrives ------------------------------------------------------------------------
  load(level) {
    this.unload();
    const g = this.g, dw = g.deckWorld;
    this.level = level;
    // nothing is held across a load (a save made mid-hold comes back released)
    for (const [k, v] of Object.entries(g.facts.facts)) if (k.startsWith('rev_') && v) g.facts.set(k, false);
    if (!dw.root) return;
    const env = { root: dw.root, deckWorld: dw };
    for (const rec of level.processes || []) {
      try {
        const p = new Process(rec, env);
        p.cond = compileCondition(rec.when || 'true');
        p.seedT = (rec.aim[0] * 0.37 + rec.aim[2] * 0.61) % 4;
        p.restore(dw.flags);
        if (rec.kind === 'patrol') p.sentinel = dw.sentinels.find((s) => s.def.id === rec.target) || null;
        this.procs.push(p);
      } catch (e) {
        console.warn('REVERSE: could not build', rec.id, e);
      }
    }
    for (const d of level.displays || []) if (d.kind === 'lockLoop') this.displays.push(new LockLoop(d, dw.root));
    this.wards = level.reversedRooms || [];
    for (const rid of this.wards) this.shimmers.push(this.fxs?.shimmer(level.rooms[rid], dw.root));
    const st = this.state;
    st.cap = this.cap;
    st.charge = Math.min(st.charge ?? st.cap, st.cap);
    this.wardT = 0;
    this.lastRoom = null;
    this.ui?.update(true);
  }

  unload() {
    if (this.active) this.endActive();
    for (const p of this.procs) p.dispose();
    for (const d of this.displays) d.dispose();
    for (const s of this.shimmers) s?.parent?.remove(s);
    this.procs = [];
    this.displays = [];
    this.shimmers = [];
    this.target = null;
    this.hist.clear();
    this.seenWatchers.clear();
    this.snd.stopLoops();
  }

  // a mechanism on a counted beat (M22's clock arm), near and in Kai's room: a click at each count, and a bell as it
  // turns, the window REVERSE answers in (the arm's pose follows the same clock: Process.stepMechanism)
  stepBeat(p) {
    const g = this.g, b = p.rec.beat;
    if (p.settled || p.rec.room !== g.room || !g.player) return;
    const a = this.aimOf(p);
    if (Math.hypot(g.player.pos.x - a[0], g.player.pos.z - a[2]) > 18) return;
    const count = Math.floor(this.time / Math.min(1, b.period));
    if (p.beatCount === count) return;
    const first = p.beatCount === undefined;
    p.beatCount = count;
    if (first || this.active?.p === p) return;
    if ((this.time % b.period) < Math.min(1, b.period) * 0.5) {
      this.snd.settle();
      this.rt.score?.capText('the clock arm turns');
    } else {
      this.snd.click();
      this.rt.score?.capText('the clock arm counts');
    }
  }

  // --- each frame -----------------------------------------------------------------------------
  step(dt) {
    const g = this.g;
    if (!this.level || g.deckWorld.level !== this.level) return;
    this.time += dt;
    const st = this.state;
    st.cap = this.cap;
    this.recordHistory(dt);
    for (const p of this.procs) p.setVisible(!!p.cond(g.deckWorld.ctx(p.rec.room)));
    if (this.active?.p.hiddenByWhen) this.release('gone'); // (its fact changed: what is not here is not held)
    if (this.active) this.stepActive(dt);
    else {
      this.idleT += dt;
      if (this.idleT > 1) st.charge = Math.min(st.cap, st.charge + 1.25 * dt);
    }
    const prev = this.target;
    this.target = this.unlocked && !g.menu ? this.findTarget() : null;
    if (this.target && (!prev || prev.p !== this.target.p || prev.part !== this.target.part)) {
      this.snd.acquire();
      if (this.target.p.rec.kind === 'lock') this.snd.tone(this.target.p.rec.parts[this.target.part].name, 0.35);
    }
    const ctx = { time: this.time, player: g.player, deckWorld: g.deckWorld };
    for (const p of this.procs) {
      if (p.hiddenByWhen) continue;
      for (const e of p.step(dt, ctx)) this.onEvent(p, e);
      if (p.rec.beat) this.stepBeat(p);
    }
    for (const d of this.displays) {
      const name = d.step(this.time);
      if (name && g.room === d.d.room) this.snd.tone(name, 0.4);
    }
    this.stepWards(dt);
    this.stepGlint();
    this.fxs?.step(dt, g.camera, this.target, this.active);
    this.ui?.update();
  }

  // where every watcher was, 10 times a second for the last 8 seconds
  recordHistory(dt) {
    this.histT -= dt;
    if (this.histT > 0) return;
    this.histT = 0.1;
    for (const s of this.g.deckWorld.sentinels || []) {
      if (this.active?.p.sentinel === s) continue;
      let h = this.hist.get(s.def.id);
      if (!h) this.hist.set(s.def.id, (h = []));
      h.push([s.pos.x, s.pos.z, s.dir.x, s.dir.z]);
      if (h.length > 80) h.shift();
    }
  }

  // the process nearest the crosshair, in Kai's room and year, within reach and in sight
  findTarget() {
    const g = this.g;
    const cam = g.camera, player = g.player;
    if (!cam || !player) return null;
    const touch = !!g.input?.touch;
    const fwd = _f.set(0, 0, -1).applyQuaternion(cam.quaternion);
    const eye = player.eye(_eye);
    const lim = (touch ? 16 : 10) * DEG;
    const cands = [];
    for (const p of this.procs) {
      const r = p.rec;
      if (p.hiddenByWhen || r.room !== g.room || p.heldBy) continue; // (one someone else holds: the Witness, an ally)
      if (p.settled && r.kind !== 'recording') continue;
      if (r.arm && !g.facts.test(r.arm)) continue; // (in plain sight, but not yet the story's to reverse: M18's slabs)
      const pts = r.kind === 'lock' ? r.parts.map((pt, i) => (p.partOut[i] ? null : { pos: pt.rest.p, part: i })) : [{ pos: this.aimOf(p), part: -1 }];
      for (const pt of pts) {
        if (!pt) continue;
        _p.set(...pt.pos);
        const d = _p.distanceTo(eye);
        if (d > r.reach) continue;
        _to.copy(_p).sub(cam.position);
        const ang = _to.angleTo(fwd);
        cands.push({ p, part: pt.part, pos: pt.pos, ang, d });
      }
    }
    cands.sort((a, b) => a.ang - b.ang || a.d - b.d);
    const seen = (c) => {
      _p.set(...c.pos);
      _to.copy(_p).sub(eye);
      const d = _to.length();
      if (d < 0.6) return true;
      _to.divideScalar(d);
      return player.rayDistance(eye, _to, d) >= d - 0.75;
    };
    for (const c of cands.slice(0, 2)) if (c.ang <= lim && seen(c)) return c;
    if (touch) {
      // touch assist: the nearest within 8 m in the front half of the view
      const near = cands.filter((c) => c.d <= 8 && c.ang < Math.PI / 2).sort((a, b) => a.d - b.d);
      for (const c of near.slice(0, 2)) if (seen(c)) return c;
    }
    return null;
  }

  aimOf(p) {
    // (a watcher on a floor of its own, def.y, is aimed at on that floor: M21's elite on the cells' terrace, M10's chamber)
    if (p.rec.kind === 'patrol' && p.sentinel) return [p.sentinel.pos.x, (p.sentinel.pos.y || 0) + 1.2, p.sentinel.pos.z];
    return p.rec.aim;
  }

  // --- the verb -------------------------------------------------------------------------------
  // R, 4, the ⟲ button or the label: on a target it starts; while something is held it lets go
  press() {
    const g = this.g;
    if (!g.started || g.menu || g.paused || g.mode !== 'deck' || !g.campaign?.lv) return;
    if (this.rt.cinema?.active && !this.active) return; // (a staged moment holds Kai: cinema.js; a hold can still be let go)
    if (!this.unlocked) {
      g.audio.deny?.();
      if (this.once('locked', 30)) g.hud.toast('<small>REVERSE</small><br>Not yet. Something in Act II catches the rhythm.', 1800);
      return;
    }
    const t = this.findTarget();
    this.target = t;
    if (this.active) {
      const same = t && t.p === this.active.p && t.part === this.active.part;
      if (this.active.lock) return; // a bolt finishes backing out on its own
      if (this.active.t < 0.6 && (!t || same)) return; // the minimum hold
      this.release('press');
      if (!t || same) return;
    }
    if (!t) {
      this.snd.refuse();
      return;
    }
    this.start(t);
  }

  trigger() {
    this.press();
  }

  start(t) {
    const g = this.g, rt = this.rt;
    const p = t.p, rec = p.rec, st = this.state;
    if (rec.refuse) {
      // R6: never a person, never a memory
      this.snd.refuse();
      // (a refusal may be answered by someone else the first time: M20's memories, by Mira; `once` names the fact)
      const first = !rec.once || !g.facts.get(rec.once);
      if (this.once(`refuse_${rec.id}`, 6)) {
        if (rec.lineWho && first) g.hud.say([{ who: rec.lineWho, text: rec.line }], g.facts);
        else this.say(rec.lineWho ? (rec.refuse === 'A MEMORY' ? INV_LINES.memory : INV_LINES.person) : rec.line || (rec.refuse === 'A MEMORY' ? INV_LINES.memory : INV_LINES.person));
      }
      if (rec.once) g.facts.set(rec.once, true);
      g.facts.set('inv_refused');
      return;
    }
    if (rec.kind === 'lock' && p.partOut[t.part] === false) {
      const order = rec.parts.map((x, i) => [x.order, i]).filter(([, i]) => !p.partOut[i]).sort((a, b) => b[0] - a[0]);
      if (order.length && order[0][1] !== t.part) {
        // a jam: the bolt turns half back and snaps home; it costs charge and a little stability
        if (st.charge < 1 || rt.stability < 0.2) return this.refuseCharge();
        p.tryPart(t.part);
        st.charge = Math.max(0, st.charge - 1.5);
        rt.stability = Math.max(0, rt.stability - 0.03);
        this.idleT = 0;
        this.snd.jam();
        g.facts.inc('inv_jams');
        if (this.once('jam', 20)) this.say(INV_LINES.jam);
        return;
      }
    }
    // a mechanism with a beat (M22's clock arm) answers only on its counted beat; off it, it jams like a wrong bolt
    if (rec.beat && (this.time % rec.beat.period) > rec.beat.on) {
      if (st.charge < 1 || rt.stability < 0.2) return this.refuseCharge();
      st.charge = Math.max(0, st.charge - 1);
      this.idleT = 0;
      this.snd.jam();
      g.facts.inc('inv_jams');
      if (this.once('beat', 12) && rec.offBeat) this.g.hud.say([{ who: 'KAI', text: rec.offBeat }], g.facts);
      return;
    }
    if (st.charge < 1 || rt.stability < 0.2) return this.refuseCharge();
    st.charge -= 0.5;
    rt.stability = Math.max(0, rt.stability - (STAB_COST[rec.weight] ?? 0.06));
    this.idleT = 0;
    g.facts.set('inv_used');
    this.snd.start(rec.grain);
    this.rt.score?.cue('reverse'); // (the score's held layer: its envelopes run backwards while this holds)
    this.fxs?.started(t.pos);
    if (rec.kind === 'lock') {
      p.tryPart(t.part);
      this.snd.tone(rec.parts[t.part].name, 0.6);
      this.active = { p, part: t.part, t: 0, lock: true };
      return;
    }
    if (rec.kind === 'recording') {
      // R5: a recording running backwards runs forwards once, and says what it says
      this.snd.stopLoop(rec.id);
      this.active = { p, part: -1, t: 0, lock: true };
      g.hud.say([{ who: rec.clip?.who || 'NONE', ...(rec.clip?.name ? { name: rec.clip.name } : {}), text: rec.clip?.text || '', voice: { ...(rec.clip?.voice || {}), fx: 'recording' } }].filter((l) => l.text), g.facts, () => {
        this.settle(p);
        if (this.active?.p === p) this.active = null;
      });
      return;
    }
    // R5 on a watcher that rewinds itself (M21's elites): its rewind runs forwards, and it is stuck where it is for six seconds
    if (rec.kind === 'patrol' && rec.mode === 'rewind' && p.sentinel) {
      const s = p.sentinel;
      s.suspicion = 0;
      if (s.mode === 'chase') s.mode = 'patrol';
      this.active = { p, part: -1, t: 0, lock: true, stuck: rec.stuck ?? 6 };
      g.facts.set(rec.fact, true);
      g.facts.inc(`stuck_${rec.id}`);
      return;
    }
    p.reverse();
    if (rec.kind === 'patrol' && p.sentinel) {
      const h = this.hist.get(p.sentinel.def.id) || [];
      this.active = { p, part: -1, t: 0, hist: h, idx: h.length - 1, histT: 0 };
    } else this.active = { p, part: -1, t: 0 };
    g.facts.set(rec.fact, true);
    this.snd.drone(true, ROOT[g.engine.state(g.room)] || 45);
    this.snd.duck(true);
    if (!g.facts.get('inv_first_hold')) {
      g.facts.set('inv_first_hold');
      g.log.push('REVERSE held something for the first time. It went back to where it was, and stayed while the charge lasted.');
    }
  }

  refuseCharge() {
    this.snd.refuse();
    if (this.once('charge', 4)) this.say(INV_LINES.refuse);
  }

  stepActive(dt) {
    const g = this.g, a = this.active, rec = a.p.rec, st = this.state;
    a.t += dt;
    if (a.stuck) {
      // an elite's rewind, run forwards: it stands where it is, seeing nothing, for its seconds
      const s = a.p.sentinel;
      if (s) {
        s.stasisT = 0.25;
        s.suspicion = 0;
      }
      if (a.t > a.stuck) {
        this.active = null;
        g.facts.set(rec.fact, false);
      }
      return;
    }
    if (a.lock) {
      // a bolt or a recording: paid at the start, it finishes by itself
      st.charge = Math.max(0, st.charge - rec.weight * dt);
      if (a.t > 8) this.active = null;
      return;
    }
    st.charge = Math.max(0, st.charge - rec.weight * dt);
    if (this.rt.unstable) this.rt.stability = Math.max(0, this.rt.stability - dt * 0.045);
    a.left = Math.max(0, Math.min(st.charge / rec.weight, rec.max - a.t));
    this.tickT -= dt;
    if (this.tickT <= 0) {
      this.tickT = a.left < 1.5 ? 0.25 : 0.5;
      this.snd.tick();
    }
    if (rec.kind === 'patrol') this.stepPatrol(a, dt);
    if (a.left <= 0) return this.release('empty');
    _p.set(...this.aimOf(a.p));
    if (_p.distanceTo(g.player.pos) > rec.reach * 1.6) return this.release('far');
  }

  // a watcher held backwards: it moonwalks its last eight seconds, and un-sees Kai
  stepPatrol(a, dt) {
    const s = a.p.sentinel;
    if (!s) return;
    s.stasisT = 0.25;
    s.suspicion = 0;
    if (s.mode === 'chase') s.mode = 'patrol';
    a.histT -= dt;
    if (a.histT <= 0 && a.idx > 0) {
      a.histT = 0.1;
      a.idx--;
    }
    const h = a.hist[Math.max(0, a.idx)];
    if (h) {
      s.pos.set(h[0], s.pos.y, h[1]); // (on its own floor)
      s.dir.set(h[2], 0, h[3]).normalize();
    }
  }

  // let go: a held process goes forward again from where it is
  release(why = 'press') {
    const a = this.active;
    if (!a || a.lock) return;
    const rec = a.p.rec;
    a.p.release();
    if (rec.kind === 'patrol' && a.p.sentinel) {
      a.p.sentinel.stasisT = 0;
      a.hist.length = Math.max(0, a.idx); // it patrols on from there
    }
    this.endActive();
    this.snd.release(rec.grain, rec.creak);
    this.rt.score?.cue('reverse', { release: true });
    this.lastRelease = why;
  }

  endActive() {
    const a = this.active;
    this.active = null;
    this.idleT = 0;
    if (!a) return;
    if (a.p.rec.fact) this.g.facts.set(a.p.rec.fact, false);
    this.snd.drone(false);
    this.snd.duck(false);
  }

  // a settled process stays reversed (R4), and the save remembers it
  settle(p) {
    const g = this.g, rec = p.rec;
    p.settled = true;
    g.deckWorld.flags[rec.done] = true;
    if (g.campaign) g.campaign.flags = { ...g.deckWorld.flags };
    g.facts.set(rec.done, true);
  }

  onEvent(p, e) {
    const g = this.g, rec = p.rec, flags = g.deckWorld.flags;
    if (e.type === 'part') {
      const name = rec.parts[e.i].name;
      flags[`${rec.done.replace(/_done$/, '')}_${name}`] = true;
      if (g.campaign) g.campaign.flags = { ...flags };
      this.snd.click();
      if (this.active?.p === p) this.active = null;
      if (!g.facts.get('inv_bolt_said')) {
        g.facts.set('inv_bolt_said');
        this.say(INV_LINES.bolt);
      }
    } else if (e.type === 'settled') {
      if (this.active?.p === p) this.endActive();
      this.settle(p);
      this.snd.settle();
    } else if (e.type === 'layer') {
      flags[`${rec.done.replace(/_done$/, '')}_n`] = e.n;
      if (g.campaign) g.campaign.flags = { ...flags };
      if (this.active?.p === p && !p.settled) this.endActive();
    } else if (e.type === 'rest') {
      g.fx?.burst(rec.parts[0]?.rest.p || rec.aim, rec.kind === 'flow' ? 0x9fd8ff : rec.kind === 'burn' ? 0xffa060 : 0xd8d0c0, 18, 1.2);
    } else if (e.type === 'landed') {
      if (e.at) g.fx?.burst(e.at, 0xffb27a, 26, 2.6);
    } else if (e.type === 'clack') this.snd.clack();
    else if (e.type === 'drown' && !g.catching) g.deckSetback?.('fall');
  }

  // --- the world around it --------------------------------------------------------------------
  // reversed wards: the intercom says its two words backwards, and the doorway shimmers
  stepWards(dt) {
    const g = this.g;
    const inWard = this.wards.includes(g.room);
    if (g.room !== this.lastRoom) {
      this.lastRoom = g.room;
      if (inWard) this.wardT = 0.6;
    }
    if (inWard) {
      this.wardT -= dt;
      if (this.wardT <= 0) {
        this.wardT = 14;
        this.snd.intercom();
        this.rt.score?.capText('the intercom, backwards');
        g.hud.toast('<small>INTERCOM, BACKWARDS</small><br>…ytiunitnocsid laropmeT', 2400);
      }
    }
    for (const s of this.shimmers) if (s) s.material.opacity = 0.1 + 0.07 * Math.sin(this.time * 2.3);
    // a watcher walking backwards comes into view: the music drops out for a breath
    if (inWard && g.camera) {
      const fwd = _f.set(0, 0, -1).applyQuaternion(g.camera.quaternion);
      for (const s of g.deckWorld.sentinels || []) {
        if (s.def.room !== g.room || this.seenWatchers.has(s) || s.model?.visible === false) continue;
        _to.set(s.pos.x, 1.2, s.pos.z).sub(g.camera.position);
        if (_to.length() < 22 && _to.angleTo(fwd) < 0.6) {
          this.seenWatchers.add(s);
          this.snd.mute(0.4);
        }
      }
    }
  }

  // reversible things glint silver every few seconds once Kai can reverse them; aimed, they pulse
  stepGlint() {
    const g = this.g;
    const on = this.unlocked;
    const comfort = !!g.settings?.comfort;
    for (const p of this.procs) {
      if (p.hiddenByWhen || p.rec.refuse) {
        p.glint(0);
        continue;
      }
      let k = 0;
      if (this.active?.p === p) {
        const a = this.active;
        k = 0.45 + 0.2 * Math.sin(this.time * 8);
        if (!comfort && a.left !== undefined && a.left < 1.5) k *= 0.5 + 0.5 * Math.round(Math.random());
      } else if (on && this.target?.p === p) k = 0.4 + 0.2 * Math.sin(this.time * 6);
      else if (on && !p.settled && p.rec.room === g.room) {
        const ph = (this.time + p.seedT) % 4;
        _p.set(...p.rec.aim);
        if (ph < 0.7 && _p.distanceTo(g.player.pos) < 25) {
          k = Math.sin((ph / 0.7) * Math.PI) * 0.4;
          if (ph < 0.05) this.fxs?.tell(p.rec);
        }
      }
      p.glint(k);
    }
  }

  // Mission 11's intercom chime: the four bolts' tones, low to high, in the order they were fitted
  chime() {
    ['RING', 'BAR', 'STAR', 'CRESCENT'].forEach((n, i) => setTimeout(() => {
      this.snd.tone(n, 0.7);
      this.rt.score?.capText(`a tone, ${['the lowest', 'higher', 'higher again', 'the highest'][i]}`); // (Sound captions: the pulse)
    }, 300 + i * 520));
  }

  // Mission 11: the Chronolith catches the ward's rhythm
  unlock() {
    const g = this.g;
    if (this.unlocked || this.unlocking) return;
    this.unlocking = true;
    g.hud.say([{ who: 'NONE', text: INV_LINES.watch }], g.facts, () => {
      g.facts.set('has_inversion');
      this.state.charge = this.cap;
      this.snd.unlock();
      // (how, first: aim, the button or R, let go; then the two rules, and why a light thing outlasts the charge)
      const how = g.input?.touch ? 'Aim at something moving and tap ⟲ REVERSE: it runs backwards and holds. Tap RELEASE to let go.'
        : 'Aim at something moving and press R: it runs backwards and holds. R again lets go.';
      g.hud.toast(`<small>REVERSE</small><br>${how}<br><small>${RULES[0][0]} · ${RULES[1][0]}</small> ${RULES[0][1]} ${RULES[1][1]} Light things hold longer, heavy ones less.`, 9000);
      g.log.push('REVERSE: the Chronolith caught the ward\'s rhythm. One thing at a time, and only while it is charged.');
      g.hud.say([{ who: 'KAI', text: INV_LINES.unlock }], g.facts, () => (this.unlocking = false));
    });
  }

  // Kai thinking about the nearest thing that will run backwards
  hintFor() {
    const g = this.g;
    if (!this.unlocked) return null;
    let best = null, bd = Infinity;
    for (const p of this.procs) {
      if (p.hiddenByWhen || p.settled || !p.rec.hints || p.rec.room !== g.room || (p.rec.arm && !g.facts.test(p.rec.arm))) continue;
      _p.set(...p.rec.aim);
      const d = _p.distanceTo(g.player.pos);
      if (d < p.rec.reach && d < bd) {
        bd = d;
        best = p;
      }
    }
    return best ? { key: `rev:${best.rec.id}`, tiers: best.rec.hints } : null;
  }

  // the case board's ABILITIES block
  abilitiesHtml() {
    const f = this.g.facts;
    const li = [];
    if (f.get('has_chronolith')) {
      li.push('<li><b>YEAR</b> <small>Q · 1 2 3 · YEAR</small><br>Switch this place between the years it has. Out of the present, an unstable place drains the Chronolith.</li>');
      li.push('<li><b>ANCHOR</b> <small>C · ANCHOR</small><br>What you carry out of another year survives the switch while you hold it. The ANCHOR button (or the CARRYING label) shows while you carry one.</li>');
    }
    if (f.get('echo_step')) li.push('<li><b>ECHO STEP</b> <small>X</small><br>An afterimage the watchers follow, and a step forward. It costs stability.</li>');
    if (this.unlocked) li.push(`<li><b>REVERSE</b> <small>R · 4 · ⟲</small><br>Hold one process backwards while the charge lasts (${this.cap} s).<ul class="rules">${RULES.map(([k, t]) => `<li><b>${k}</b> ${t}</li>`).join('')}</ul></li>`);
    return li.length ? `<h3>ABILITIES</h3><ul class="board abilities">${li.join('')}</ul>` : '';
  }

  say(text) {
    const key = Object.keys(INV_LINES).find((k) => INV_LINES[k] === text);
    this.g.hud.say([{ who: INV_SPEAKERS[key] || 'KAI', text }], this.g.facts);
  }

  // true once per `secs` for each key (lines and toasts never repeat on every press)
  once(key, secs) {
    if (this.time - (this.saidAt[key] ?? -1e9) < secs) return false;
    this.saidAt[key] = this.time;
    return true;
  }

  // what the HUD shows: the chip's words, the label over the target, the hold seconds
  hudState() {
    const st = this.state, a = this.active, t = this.target;
    const name = (p, part) => (p.rec.kind === 'lock' && part >= 0 ? `${p.rec.label} · ${p.rec.parts[part].name}` : p.rec.label);
    const holdFor = (rec) => Math.floor(Math.min(st.charge / rec.weight, rec.max));
    // (the label says why its seconds are not the chip's: a light thing outlasts the charge, a heavy one does not)
    const heft = (rec) => (rec.weight < 1 ? 'LIGHT · ' : rec.weight > 1 ? 'HEAVY · ' : '');
    // the chip: what is held and its seconds left; a bolt backing out (or a recording playing) named until it is done;
    // else the charge (an upright phone leaves the name to the label)
    const chipName = a ? `${name(a.p, a.part)} ` : '';
    const chipNum = a && !a.lock ? (a.left ?? 0).toFixed(1) : `${Math.floor(st.charge)}s`;
    // the label: over what is held while it is held (never the next bolt while one is still backing out), else the target
    let label = '', pos = null;
    if (a && (a.lock || !t || t.p === a.p)) {
      label = `⟲ ${name(a.p, a.part)} · ${a.lock ? (a.part >= 0 ? 'BACKING OUT' : 'RUNNING') : 'HOLDING'}`;
      pos = a.part >= 0 && a.p.rec.parts?.[a.part]?.rest?.p ? a.p.rec.parts[a.part].rest.p : this.aimOf(a.p);
    } else if (t) {
      label = t.p.rec.refuse ? `✕ ${t.p.rec.refuse}` : `⟲ ${name(t.p, t.part)} · ${heft(t.p.rec)}${holdFor(t.p.rec)} s`;
      pos = t.pos;
    }
    return {
      on: this.unlocked,
      frac: Math.max(0, Math.min(1, st.charge / st.cap)),
      // (a bolt backing out has no count: '…'; upright the chip shows only this, and was blank)
      chip: `⟲ ${chipName}${a?.lock ? '' : chipNum}`, chipName, chipNum: a?.lock ? '…' : chipNum,
      hold: !!(a && !a.lock),
      warn: !!(a && !a.lock && a.left < 1.5),
      aim: !!t && !a?.lock,
      label,
      pos,
    };
  }
}

// =============================================================================================
// the HUD: the REVERSE chip beside the year card, the label, the crosshair ring, the touch button
const CSS = `
body.lastversion #lvTop { position: absolute; left: 16px; top: 14px; display: flex; gap: 8px; align-items: flex-start; pointer-events: none; }
body.lastversion #lvTop > #state { position: relative; left: 0; top: 0; }
body.lastversion.touch #lvTop { top: max(14px, env(safe-area-inset-top)); left: max(16px, env(safe-area-inset-left)); }
body.lastversion #lvReverse { display: none; position: relative; align-items: center; gap: 7px; padding: 8px 12px 8px 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.28);
  color: #fff; font: 700 12px Inter, sans-serif; letter-spacing: 0.06em; text-shadow: 0 1px 6px rgba(40, 30, 80, 0.55); transition: opacity 0.6s, background 0.3s; white-space: nowrap; }
body.lastversion #lvReverse.on { display: flex; }
body.lastversion #lvReverse u, body.lastversion #lvReverse em, body.lastversion #lvReverse b { font: inherit; text-decoration: none; }
/* upright on a phone the row keeps clear of the minimap, as #state does alone, and three years still fit on one
   line: the pips drop their key digits (a phone has no 1 2 3), the chip is its ring and its seconds, and the held
   thing's name is on its label over the target */
@media (orientation: portrait) {
  body.lastversion.touch #lvTop { max-width: calc(100vw - 130px); }
  body.lastversion.touch #lvTop > #state { max-width: none; }
  body.lastversion.touch #lvTop > #state .pip em { display: none; }
  body.lastversion.touch #lvReverse { flex: none; gap: 5px; padding: 6px 10px 6px 6px; }
  body.lastversion.touch #lvReverse u, body.lastversion.touch #lvReverse em { display: none; }
}
body.lastversion #lvReverse i { width: 22px; height: 22px; border-radius: 50%; flex: none;
  background: conic-gradient(#c9b8ff calc(var(--lvc, 1) * 360deg), rgba(255, 255, 255, 0.22) 0); -webkit-mask: radial-gradient(circle, transparent 7px, #000 8px); mask: radial-gradient(circle, transparent 7px, #000 8px); }
body.lastversion #lvReverse.aim { background: rgba(201, 184, 255, 0.45); }
body.lastversion #lvReverse.hold { background: rgba(120, 96, 220, 0.62); }
body.lastversion #lvReverse.warn i { animation: tickblink 0.5s ease-in-out infinite; }
body.lastversion.calm #lvReverse:not(.hold) { opacity: 0.38; }
body.lastversion #lvTarget { position: absolute; left: 0; top: 0; transform: translate(-50%, -150%); padding: 5px 11px; border-radius: 999px; background: rgba(40, 30, 80, 0.55);
  color: #ece6ff; font: 700 11px Inter, sans-serif; letter-spacing: 0.08em; white-space: nowrap; display: none; box-shadow: 0 0 0 1px rgba(201, 184, 255, 0.7); }
body.lastversion #lvTarget.on { display: block; }
body.lastversion #lvTarget.no { background: rgba(60, 40, 40, 0.55); box-shadow: 0 0 0 1px rgba(255, 160, 150, 0.7); color: #ffe0dc; }
body.lastversion.touch #lvTarget { pointer-events: auto; font-size: 12px; padding: 7px 13px; z-index: 3; } /* (above the look zone, which took its taps) */
/* (on a phone the label is a button too: it says so, as the prompt does; not while a hold or a bolt is under way) */
body.lastversion.touch #lvTarget:not(.no):not(.held)::before { content: "TAP · "; color: #c9b8ff; }
body.lastversion #crosshair.lvAim::after, body.lastversion #crosshair.lvHold::after { content: ""; position: absolute; left: 50%; top: 50%; width: 30px; height: 30px; margin: -15px; border-radius: 50%;
  background: conic-gradient(#c9b8ff calc(var(--lvc, 1) * 360deg), rgba(255, 255, 255, 0.2) 0); -webkit-mask: radial-gradient(circle, transparent 12px, #000 13px); mask: radial-gradient(circle, transparent 12px, #000 13px); }
body.lastversion #lvRevBtn { display: none; }
body.lastversion.touch #lvRevBtn { display: flex; position: absolute; left: -74px; bottom: 18px; width: 60px; height: 60px; border-radius: 50%; padding: 0; border: none; pointer-events: auto;
  flex-direction: column; align-items: center; justify-content: center; gap: 0; color: #fff; font: 800 8px Inter, sans-serif; letter-spacing: 0.08em;
  background: radial-gradient(circle at 50% 40%, rgba(255,255,255,0.3), transparent 62%), #7a62d8; box-shadow: 0 6px 18px rgba(60, 40, 120, 0.3); transition: opacity 0.4s, transform 0.1s; }
body.lastversion.touch #lvRevBtn b { font-size: 22px; line-height: 22px; }
body.lastversion.touch #lvRevBtn::before { content: ""; position: absolute; inset: -4px; border-radius: 50%; pointer-events: none;
  background: conic-gradient(#c9b8ff calc(var(--lvc, 1) * 360deg), rgba(255, 255, 255, 0.25) 0); -webkit-mask: radial-gradient(circle, transparent 31px, #000 32px); mask: radial-gradient(circle, transparent 31px, #000 32px); }
body.lastversion.touch #lvRevBtn.off { display: none; }
body.lastversion.touch #lvRevBtn.dim { opacity: 0.45; }
body.lastversion.touch #lvRevBtn.hold { background: radial-gradient(circle at 50% 40%, rgba(255,255,255,0.3), transparent 62%), #4f38b8; }
body.lastversion.touch #lvRevBtn.down { transform: scale(0.93); }
/* upright: above the YEAR button, clear of the left thumb's stick zone (beside YEAR it sat 6 px from the stick's ring) */
@media (orientation: portrait) { body.lastversion.touch #lvRevBtn { left: 16px; bottom: 162px; } }
body.lastversion.touch #buttons .b.shift { background: radial-gradient(circle at 50% 40%, rgba(255,255,255,0.35), transparent 60%), var(--lv-next, var(--past)); }
body.lastversion #buttons .b.shift { background: var(--lv-next, var(--past)); }
body.lastversion #lvVignette { position: fixed; inset: 0; pointer-events: none; z-index: 9; opacity: 0; transition: opacity 0.35s; box-shadow: inset 0 0 90px 18px rgba(150, 120, 255, 0.45); }
body.lastversion #lvVignette.on { opacity: 1; }
body.lastversion #lvVignette.warn { animation: tickblink 0.5s ease-in-out infinite; }
body.lastversion #journal .abilities li { margin-bottom: 6px; }
body.lastversion #journal .abilities small { color: var(--ink-soft); letter-spacing: 0.06em; }
body.lastversion #journal .rules { list-style: none; padding: 4px 0 0 0; margin: 0; font-size: 12px; }
body.lastversion #journal .rules b { color: #6a52c8; margin-right: 4px; }
`;

class ReverseUI {
  constructor(inv) {
    this.inv = inv;
    if (!document.querySelector('#lvInv')) {
      const s = document.createElement('style');
      s.id = 'lvInv';
      s.textContent = CSS;
      document.head.appendChild(s);
    }
    const ui = document.querySelector('#ui');
    const st = document.querySelector('#state');
    this.top = document.createElement('div');
    this.top.id = 'lvTop';
    if (st) {
      st.parentNode.insertBefore(this.top, st);
      this.top.appendChild(st); // moved, not copied: HUD.js keeps its reference
    } else ui.appendChild(this.top);
    this.chip = document.createElement('div');
    this.chip.id = 'lvReverse';
    this.chip.innerHTML = '<i></i><span><u>⟲ </u><em></em><b>8s</b></span>';
    this.chipName = this.chip.querySelector('em');
    this.chipNum = this.chip.querySelector('b');
    this.top.appendChild(this.chip);
    this.label = document.createElement('div');
    this.label.id = 'lvTarget';
    ui.appendChild(this.label);
    this.cross = document.querySelector('#crosshair');
    this.vig = document.createElement('div');
    this.vig.id = 'lvVignette';
    document.body.insertBefore(this.vig, ui);
    const press = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'click' && performance.now() - (this.touchedAt || 0) < 600) return;
      if (e.type === 'touchstart') this.touchedAt = performance.now();
      this.btn?.classList.add('down');
      setTimeout(() => this.btn?.classList.remove('down'), 140);
      navigator.vibrate?.(8);
      inv.press();
    };
    const buttons = document.querySelector('#buttons');
    if (buttons) {
      this.btn = document.createElement('button');
      this.btn.id = 'lvRevBtn';
      this.btn.className = 'off';
      this.btn.setAttribute('aria-label', 'Reverse');
      this.btn.innerHTML = '<b>⟲</b><span>REVERSE</span>';
      this.btnText = this.btn.querySelector('span');
      // Input binds [data-act] buttons only at startup, so this one binds its own touches: a tap presses it, and a drag
      // that starts on it (it sits where a right thumb starts to look round) turns the view instead
      this.bindTap(this.btn, press);
      this.btn.addEventListener('click', press);
      buttons.appendChild(this.btn);
    }
    this.bindTap(this.label, press);
    this.label.addEventListener('click', press);
    this.last = {};
  }

  // a tap on touchend (Input.tapOrLook); a page without the game's input (a test) presses on touchstart
  bindTap(el, press) {
    const input = this.inv.g?.input;
    if (input?.tapOrLook) input.tapOrLook(el, () => {
      this.touchedAt = performance.now();
      this.inv.press();
    });
    else el.addEventListener('touchstart', press, { passive: false });
  }

  set(key, v, fn) {
    if (this.last[key] === v) return;
    this.last[key] = v;
    fn(v);
  }

  update(force = false) {
    if (force) this.last = {};
    const inv = this.inv, g = inv.g;
    const lv = !!(g.started && g.campaign?.lv && g.mode === 'deck');
    const h = inv.hudState();
    const on = lv && h.on;
    this.set('on', on, (v) => this.chip.classList.toggle('on', v));
    this.set('btnOff', !on, (v) => this.btn?.classList.toggle('off', v));
    if (!on) {
      this.set('label', '', () => this.label.classList.remove('on'));
      this.set('cross', '', () => this.cross?.classList.remove('lvAim', 'lvHold'));
      this.set('vig', false, () => this.vig.classList.remove('on', 'warn'));
      return;
    }
    const frac = h.frac.toFixed(2);
    this.set('frac', frac, (v) => document.body.style.setProperty('--lvc', v));
    this.set('chip', h.chip, () => {
      this.chipName.textContent = h.chipName;
      this.chipNum.textContent = h.chipNum;
    });
    this.set('state', `${h.aim}|${h.hold}|${h.warn}`, () => {
      this.chip.classList.toggle('aim', h.aim);
      this.chip.classList.toggle('hold', h.hold);
      this.chip.classList.toggle('warn', h.warn);
      this.btn?.classList.toggle('dim', !h.aim && !h.hold);
      this.btn?.classList.toggle('hold', h.hold);
      if (this.btnText) this.btnText.textContent = h.hold ? 'RELEASE' : 'REVERSE';
      this.cross?.classList.toggle('lvAim', h.aim && !h.hold);
      this.cross?.classList.toggle('lvHold', h.hold);
      const comfort = !!g.settings?.comfort;
      this.vig.classList.toggle('on', h.hold && !comfort);
      this.vig.classList.toggle('warn', h.warn && !comfort);
    });
    this.set('label', h.label, (v) => {
      this.label.textContent = v;
      this.label.classList.toggle('on', !!v);
      this.label.classList.toggle('no', v.startsWith('✕'));
      this.label.classList.toggle('held', / · (HOLDING|BACKING OUT|RUNNING)$/.test(v));
      this.labelW = 0; // measured again below
    });
    if (h.pos && g.camera) {
      const v = _p.set(...h.pos).project(g.camera);
      const W = window.innerWidth, H = window.innerHeight;
      // (the whole label on screen: its centre clamped by half its width, as main.js does for the prompt)
      if (!this.labelW) {
        this.labelW = this.label.offsetWidth || 0;
        this.labelH = this.label.offsetHeight || 0;
      }
      const half = Math.min(W / 2, this.labelW / 2 + 8);
      const x = Math.round(Math.max(half, Math.min(W - half, ((v.x + 1) / 2) * W)));
      let y = Math.round(((1 - v.y) / 2) * H);
      // (and clear of the use prompt when the thing to use stands on the process, as M16's coat case on the reel: the
      // label goes just above the pill, or under its point when there is no room above; v2.1.1 playtest P12)
      const pr = g.hud?.el?.prompt;
      if (pr?.classList?.contains('on') && !pr.classList.contains('behind') && g._promptX != null) {
        const pw = g.hud.promptWidth?.() || 0, ph = 46, lh = this.labelH || 30;
        const px = g._promptX, py = g._promptY;
        const lTop = y - 1.5 * lh, lBot = y - 0.5 * lh; // (the label hangs at translate(-50%, -150%) from its point)
        if (Math.abs(x - px) < (this.labelW + pw) / 2 && lBot > py - ph && lTop < py) {
          y = py - ph - 6 + Math.round(0.5 * lh);
          if (y - 1.5 * lh < 8) y = Math.round(py + 6 + 1.5 * lh);
        }
      }
      this.set('lpos', `${x},${y},${v.z < 1}`, () => {
        this.label.style.left = `${x}px`;
        this.label.style.top = `${y}px`;
        this.label.style.visibility = v.z < 1 ? 'visible' : 'hidden';
      });
    }
  }
}

// =============================================================================================
// what it looks like: the ring at the target, motes drawn into the seams, tells, shimmering doorways
class ReverseFx {
  constructor(g) {
    this.g = g;
    this.N = 200;
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.N * 3);
    this.vel = new Float32Array(this.N * 3);
    this.life = new Float32Array(this.N);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({ color: REVERSE_COLOR, size: 0.07, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.points.frustumCulled = false;
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.3, 40), new THREE.MeshBasicMaterial({ color: 0xe8e2ff, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    this.ring.renderOrder = 5;
    this.ring.visible = false;
    this.next = 0;
    this.pulseT = 0;
    g.scene?.add(this.points, this.ring);
  }

  emit(at, n, inward) {
    for (let k = 0; k < n; k++) {
      const i = this.next;
      this.next = (this.next + 1) % this.N;
      const a = Math.random() * Math.PI * 2, e = Math.random() * 2 - 1, r = inward ? 0.9 + Math.random() * 0.6 : 0.2 * Math.random();
      const dx = Math.cos(a) * Math.sqrt(1 - e * e) * r, dy = e * r * 0.6, dz = Math.sin(a) * Math.sqrt(1 - e * e) * r;
      this.pos[i * 3] = at[0] + dx;
      this.pos[i * 3 + 1] = at[1] + dy;
      this.pos[i * 3 + 2] = at[2] + dz;
      const s = inward ? -1.6 : 0;
      this.vel[i * 3] = dx * s;
      this.vel[i * 3 + 1] = inward ? dy * s : 0.5 + Math.random() * 0.4;
      this.vel[i * 3 + 2] = dz * s;
      this.life[i] = inward ? 0.6 : 1.2;
    }
  }

  started(at) {
    this.emit(at, 40, true);
    this.pulseT = 0.5;
    this.pulseAt = at;
  }

  // a tell: dust falling up off rubble, a drip climbing, an ember sinking
  tell(rec) {
    this.emit(rec.parts[0]?.rest.p || rec.aim, 6, false);
  }

  shimmer(room, root) {
    if (!room) return null;
    const [sx, , sz, th = 0] = room.spawn;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), new THREE.MeshBasicMaterial({ color: REVERSE_COLOR, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    // the entry doorway: 1.6 m behind the spawn, along the room's heading
    m.position.set(sx + 1.6 * Math.sin(th), 2, sz + 1.6 * Math.cos(th));
    m.rotation.y = th;
    root.add(m);
    return m;
  }

  step(dt, camera, target, active) {
    for (let i = 0; i < this.N; i++) {
      if (this.life[i] <= 0) {
        this.pos[i * 3 + 1] = -999;
        continue;
      }
      this.life[i] -= dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    if (active && !active.lock && Math.random() < dt * 12) this.emit(active.p.rec.aim, 2, true);
    const at = this.pulseT > 0 ? this.pulseAt : target ? target.pos : null;
    this.ring.visible = !!at && !!camera;
    if (at && camera) {
      this.ring.position.set(...at);
      this.ring.quaternion.copy(camera.quaternion);
      if (this.pulseT > 0) {
        this.pulseT -= dt;
        this.ring.scale.setScalar(0.3 + (this.pulseT / 0.5) * 2.7); // it contracts onto the target
      } else this.ring.scale.setScalar(1 + Math.sin(performance.now() / 300) * 0.06);
    }
  }
}

// =============================================================================================
// what it sounds like (procedural: the game's own mixer, no files)
class ReverseSound {
  constructor(g) {
    this.g = g;
    this.loops = new Map();
  }

  get a() {
    return this.g.audio;
  }

  ready() {
    return !!this.a?.ctx && !!this.a.sfx;
  }

  // noise shaped once per context: reversed (exponential attack, hard cut) and forward grains
  bufs() {
    const c = this.a.ctx;
    if (this._bufs?.ctx === c) return this._bufs;
    const make = (dur, env, mod = () => 1) => {
      const n = Math.max(1, Math.floor(c.sampleRate * dur));
      const b = c.createBuffer(1, n, c.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * env(i / n) * mod(i / c.sampleRate);
      return b;
    };
    const rise = (x) => Math.exp((x - 1) * 6), fall = (x) => Math.exp(-x * 6);
    const crackle = () => (Math.random() < 0.06 ? 3 : 0.35);
    this._bufs = {
      ctx: c,
      swell: make(0.5, rise),
      tick: make(0.06, rise),
      long: make(1.4, rise),
      stone: make(0.35, fall, crackle),
      water: make(0.45, fall, (t) => 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 17)),
      fire: make(0.5, fall, crackle),
      metal: make(0.3, fall),
      pen: make(0.4, fall, (t) => 0.4 + 0.6 * Math.abs(Math.sin(t * 2 * Math.PI * 23))),
    };
    for (const k of ['stone', 'water', 'fire', 'metal', 'pen']) this._bufs[`${k}R`] = reverseBuffer(c, this._bufs[k]);
    return this._bufs;
  }

  play(buf, { vol = 0.1, type = 'bandpass', freq = 1200, q = 0.8, at = 0, rate = 1 } = {}) {
    const c = this.a.ctx;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.a.sfx);
    src.start(c.currentTime + at);
    return src;
  }

  grain(kind, reversed, at = 0) {
    if (!kind) return;
    const b = this.bufs();
    const key = reversed ? `${kind}R` : kind;
    const f = { stone: ['lowpass', 700], water: ['bandpass', 900], fire: ['highpass', 2600], metal: ['bandpass', 2400], pen: ['highpass', 4800] }[kind] || ['bandpass', 1200];
    this.play(b[key], { vol: 0.12, type: f[0], freq: f[1], q: kind === 'metal' ? 7 : 0.9, at });
    if (kind === 'metal') this.a.osc('sine', 780, this.a.ctx.currentTime + at, 0.3, 0.03, reversed ? 0.25 : 0.004, reversed ? 0.02 : 0.25, this.a.sfx);
  }

  acquire() {
    if (!this.ready()) return;
    this.play(this.bufs().tick, { vol: 0.09, type: 'highpass', freq: 2200 });
  }

  start(kind) {
    if (!this.ready()) return;
    this.play(this.bufs().swell, { vol: 0.16, type: 'bandpass', freq: 1500, q: 0.6 });
    this.grain(kind, true, 0.05);
  }

  tick() {
    if (!this.ready()) return;
    this.play(this.bufs().tick, { vol: 0.05, type: 'bandpass', freq: 3200, q: 2 });
  }

  // a low two-note drone on the year's root while something is held
  drone(on, root = 45) {
    if (!this.ready()) return;
    const c = this.a.ctx, t = c.currentTime;
    if (on && !this.dr) {
      const g = c.createGain();
      g.gain.value = 0.0001;
      g.gain.setTargetAtTime(0.045, t, 0.2);
      g.connect(this.a.sfx);
      const f = 440 * Math.pow(2, (root - 69) / 12);
      const o1 = c.createOscillator(), o2 = c.createOscillator();
      o1.type = 'sine';
      o2.type = 'triangle';
      o1.frequency.value = f;
      o2.frequency.value = f * 1.5;
      o1.connect(g);
      o2.connect(g);
      o1.start();
      o2.start();
      this.dr = { g, o: [o1, o2] };
    } else if (!on && this.dr) {
      const d = this.dr;
      this.dr = null;
      d.g.gain.setTargetAtTime(0.0001, t, 0.15);
      d.o.forEach((o) => o.stop(t + 0.8));
    }
  }

  // the music ducks while something is held (to 0.35 of its level)
  duck(on) {
    if (!this.ready() || !this.a.music) return;
    this.ducking = on;
    this.a.music.gain.setTargetAtTime(this.musicLevel(), this.a.ctx.currentTime, 0.25);
  }

  musicLevel() {
    return (this.a.level ? this.a.level('music') : (this.a.ducked ? 0.3 : 0.55)) * (this.ducking ? 0.35 : 1); // (the player's mix too)
  }

  // the music drops out for a moment (an inverted watcher comes into view)
  mute(secs) {
    if (!this.ready() || !this.a.music) return;
    const t = this.a.ctx.currentTime, g = this.a.music.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(0.0001, t, 0.02);
    g.setTargetAtTime(this.musicLevel(), t + secs, 0.08);
  }

  release(kind, creak = 0) {
    if (!this.ready()) return;
    const c = this.a.ctx, t = c.currentTime;
    if (creak > 0) {
      // a creak: a slow, strained low saw through a closing filter
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(58, t);
      o.frequency.linearRampToValueAtTime(44, t + creak);
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 380;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.1);
      g.gain.setTargetAtTime(0.0001, t + creak - 0.15, 0.08);
      o.connect(f).connect(g).connect(this.a.sfx);
      o.start(t);
      o.stop(t + creak + 0.3);
    }
    this.grain(kind, false, creak);
  }

  jam() {
    if (!this.ready()) return;
    const b = this.bufs();
    for (let i = 0; i < 6; i++) this.play(b.tick, { vol: 0.07, type: 'bandpass', freq: 2600, q: 3, at: i * 0.05 });
    this.clack(0.42);
    setTimeout(() => this.a.deny?.(), 520);
  }

  clack(at = 0) {
    if (!this.ready()) return;
    this.play(this.bufs().metal, { vol: 0.16, type: 'highpass', freq: 1800, at });
  }

  click() {
    if (!this.ready()) return;
    this.play(this.bufs().metalR, { vol: 0.12, type: 'bandpass', freq: 2000, q: 4 });
  }

  settle() {
    if (!this.ready()) return;
    this.a.bell?.(659.25, this.a.ctx.currentTime, 0.04, this.a.sfx);
  }

  refuse() {
    if (!this.ready()) return;
    this.a.osc('sine', 80, this.a.ctx.currentTime, 0.18, 0.12, 0.005, 0.15, this.a.sfx);
  }

  tone(name, vol = 0.5) {
    if (!this.ready() || !TONES[name]) return;
    this.a.bell?.(TONES[name], this.a.ctx.currentTime, 0.05 * vol, this.a.sfx);
  }

  unlock() {
    if (!this.ready()) return;
    const t = this.a.ctx.currentTime;
    this.play(this.bufs().long, { vol: 0.2, type: 'bandpass', freq: 1100, q: 0.5 });
    [57, 64, 69, 76].forEach((n, i) => this.a.bell?.(440 * Math.pow(2, (n - 69) / 12), t + 1.4 + i * 0.09, 0.05, this.a.sfx));
  }

  // the ward intercom's two words, played backwards (from the voice pack, when it has them)
  async intercom() {
    if (!this.ready()) return;
    const v = this.g.voice;
    try {
      const plan = (v?.plan?.(INV_LINES.intercom, 'PA') || []).filter((p) => p.ref);
      if (!plan.length) return;
      const bufs = await Promise.all(plan.map((p) => v.clip(p.key, p.ref, p.pack)));
      const c = this.a.ctx;
      const src = c.createBufferSource();
      src.buffer = reverseBuffer(c, joinBuffers(c, bufs));
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 300;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3500;
      const g = c.createGain();
      g.gain.value = 0.55;
      src.connect(hp).connect(lp).connect(g).connect(this.a.sfx);
      src.start();
    } catch {
      /* the subtitle carries it */
    }
  }

  stopLoop(id) {
    const l = this.loops.get(id);
    if (l) {
      try { l.stop(); } catch { /* done */ }
      this.loops.delete(id);
    }
  }

  stopLoops() {
    for (const id of [...this.loops.keys()]) this.stopLoop(id);
    this.drone(false);
    this.duck(false);
  }
}

// the pieces of a recorded line, end to end, in one buffer (so the whole line can play backwards)
function joinBuffers(c, bufs) {
  if (bufs.length === 1) return bufs[0];
  const ch = Math.max(...bufs.map((b) => b.numberOfChannels));
  const out = c.createBuffer(ch, bufs.reduce((n, b) => n + b.length, 0), bufs[0].sampleRate);
  let at = 0;
  for (const b of bufs) {
    for (let k = 0; k < ch; k++) out.getChannelData(k).set(b.getChannelData(Math.min(k, b.numberOfChannels - 1)), at);
    at += b.length;
  }
  return out;
}

function reverseBuffer(c, buf) {
  const out = c.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const s = buf.getChannelData(ch), d = out.getChannelData(ch);
    for (let i = 0, n = s.length; i < n; i++) d[i] = s[n - 1 - i];
  }
  return out;
}
