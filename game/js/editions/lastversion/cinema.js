// THE LAST VERSION OF EARTH: staged moments (OVERHAUL.md §8.9): cold opens, hooks, outros and the endings.
//
//   play({ shots, lines, cue, letterbox }, then) -> a promise for its end (then() is called at once when it ends)
//
// shots: [{ cam, look, t }] where cam and look are landmark names or [x, y, z] points (t: seconds, else the
// lines' length shared out); 'default' stages the level's spawn: a wide view behind it easing in, then over
// the shoulder; null keeps the game's camera (letterbox and lines only). The camera runs through the
// existing Player.cinema hook; held keys are dropped meanwhile; the lines are said through hud.say (the voice packs).
// A tap or a key skips the line being said and the shot it is in; the moment ends with its last line.
import * as THREE from '../../../vendor/three.module.min.js';

const STYLE = `
  body.lastversion #lvBars { position: fixed; inset: 0; pointer-events: none; z-index: 40; }
  body.lastversion #lvBars::before, body.lastversion #lvBars::after { content: ''; position: absolute; left: 0; right: 0; height: 0;
    background: #000; transition: height 0.6s ease; }
  body.lastversion #lvBars::before { top: 0; }
  body.lastversion #lvBars::after { bottom: 0; }
  body.lastversion.lvcine #lvBars::before, body.lastversion.lvcine #lvBars::after { height: 9vh; }
  body.lastversion.lvcine #dock, body.lastversion.lvcine #buttons, body.lastversion.lvcine #minimap, body.lastversion.lvcine #objective,
  body.lastversion.lvcine #prompt { opacity: 0; pointer-events: none; transition: opacity 0.4s; }
`;

const _a = new THREE.Vector3(), _b = new THREE.Vector3();
const ease = (x) => x * x * (3 - 2 * x);

export class Cinema {
  constructor(rt) {
    this.rt = rt;
    this.g = rt.g;
    this.active = null;
    if (typeof document !== 'undefined' && document.querySelector('#ui') && !document.querySelector('#lvCine')) {
      const st = document.createElement('style');
      st.id = 'lvCine';
      st.textContent = STYLE;
      document.head.appendChild(st);
      const bars = document.createElement('div');
      bars.id = 'lvBars';
      document.body.appendChild(bars);
      // a tap, a click or a key skips a shot (and the line being said)
      const skip = (e) => {
        if (!this.active || this.g.menu) return;
        if (e.type === 'keydown' && ['Escape', 'ShiftLeft', 'ShiftRight', 'F5', 'F9'].includes(e.code)) return;
        if (e.target?.closest?.('button, input, .overlay')) return;
        this.skip();
      };
      window.addEventListener('pointerdown', skip, true);
      window.addEventListener('keydown', skip, true);
    }
  }

  // a landmark name, a point, or a level room's spawn
  point(p, fallback) {
    const lv = this.rt.level;
    if (typeof p === 'string') {
      const l = lv?.landmarks?.[p];
      if (l) return _b.set(l[0], (l[1] || 0) + 1.6, l[2]).clone();
      return fallback.clone();
    }
    if (Array.isArray(p)) return new THREE.Vector3(p[0], p[1], p[2]);
    return fallback.clone();
  }

  // the default staging: behind and above the place Kai stands, easing in; then over his shoulder
  defaultShots(total) {
    const g = this.g;
    const p = g.player.pos;
    const H = g.player.H || { x: 0, z: 1 };
    const fx = H.x, fz = H.z, rx = fz, rz = -fx;
    // (a camera point is pulled in front of whatever wall stands between it and Kai)
    const at = (b, s, u) => {
      const head = new THREE.Vector3(p.x, p.y + 0.6, p.z);
      const want = new THREE.Vector3(p.x - fx * b + rx * s, p.y + u, p.z - fz * b + rz * s);
      const d = want.clone().sub(head);
      const len = d.length();
      const hit = g.player.rayDistance ? g.player.rayDistance(head, d.normalize(), len) : len;
      if (hit < len) want.copy(head).addScaledVector(d, Math.max(1.2, hit - 0.4));
      return [want.x, want.y, want.z];
    };
    const look = (d, u) => [p.x + fx * d, p.y + u, p.z + fz * d];
    const t1 = Math.max(2.5, total * 0.6), t2 = Math.max(2, total - t1);
    return [
      { cam: at(16, 3, 8), to: at(10, 2, 5), look: look(24, 1), t: t1 },
      { cam: at(5, 1.6, 2.4), to: at(3.4, 0.6, 1.4), look: look(8, 0.8), t: t2 },
    ];
  }

  play({ shots = 'default', lines = [], cue = null, letterbox = true, total = null } = {}, then = null) {
    const g = this.g;
    this.end();
    // (the pointer stays locked: letting it go would open the pause menu on a desktop; held keys are dropped in step)
    if (cue) this.rt.score?.cue(cue);
    const len = total ?? Math.max(3, (lines || []).reduce((a, l) => a + (g.hud.durFn?.(l) || Math.max(2.2, l.text.length * 0.055)), 0));
    const list = shots === 'default' ? this.defaultShots(len) : Array.isArray(shots) ? shots : null;
    const share = list ? len / Math.max(1, list.length) : 0;
    const p0 = g.player.pos.clone();
    this.active = {
      shots: list ? list.map((s) => {
        const cam = this.point(s.cam, p0.clone().add(_a.set(0, 4, 8)));
        return { cam, to: s.to ? this.point(s.to, cam) : cam, look: this.point(s.look, p0), t: s.t || share };
      }) : null,
      i: 0, t: 0, letterbox, then,
    };
    if (letterbox && typeof document !== 'undefined') document.body.classList.add('lvcine');
    const mine = this.active;
    return new Promise((resolve) => {
      mine.resolve = resolve;
      const done = () => this.active === mine && this.end();
      if (lines?.length) g.hud.say(lines, g.facts, done);
      else g.after(len, done);
    });
  }

  skip() {
    const a = this.active;
    if (!a) return;
    if (a.shots && a.i < a.shots.length - 1) {
      a.i++;
      a.t = 0;
    }
    if (this.g.hud.talking) this.g.hud.skipSub();
  }

  // each step: the camera along its shot; nothing the player presses walks Kai off his mark meanwhile
  step(dt) {
    const a = this.active;
    if (!a) return;
    const g = this.g;
    g.input.keys?.clear?.();
    if (g.input.state) g.input.state.jump = false;
    if (!a.shots) return;
    const s = a.shots[Math.min(a.i, a.shots.length - 1)];
    a.t += dt;
    const k = ease(Math.min(1, a.t / Math.max(0.1, s.t)));
    const pos = _a.copy(s.cam).lerp(s.to, k);
    g.player.cinema = { pos: { x: pos.x, y: pos.y, z: pos.z }, target: { x: s.look.x, y: s.look.y, z: s.look.z }, up: { x: 0, y: 1, z: 0 } };
    if (a.t >= s.t && a.i < a.shots.length - 1) {
      a.i++;
      a.t = 0;
    }
  }

  // the moment ends (a new one replacing it ends it too: what waited for it goes on); dropped: a new place
  // is loading, and nothing that waited for it follows
  end(dropped = false) {
    const a = this.active;
    if (!a) return;
    this.active = null;
    if (a.shots) this.g.player.cinema = null;
    if (typeof document !== 'undefined') document.body.classList.remove('lvcine');
    if (dropped) return;
    a.then?.(); // (at once, not a microtask later: what follows starts on the same frame)
    a.resolve?.();
  }
}
