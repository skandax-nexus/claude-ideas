// THE LAST VERSION OF EARTH: staged moments (OVERHAUL.md §8.9): cold opens, hooks, outros and the endings.
//
//   play({ shots, lines, cue, letterbox }, then) -> a promise for its end (then() is called at once when it ends)
//
// shots: [{ cam, look, t }] where cam and look are landmark names or [x, y, z] points (t: seconds, else the
// lines' length shared out); 'default' stages the level's spawn: a wide view behind it easing in, then over
// the shoulder; null keeps the game's camera (letterbox and lines only). The camera runs through the
// existing Player.cinema hook; Kai is held meanwhile (keys, the touch stick, the actions that act in the world);
// the lines are said through hud.say (the voice packs). A tap on the view, a click, Space, E, Enter or the SKIP button
// skips the line being said and the shot it is in, and only that: one tap never ends a whole moment, a mission's
// opening or its spoken card (the closing pass: SKIP once ended the whole opening, so a player who tapped it to pass
// one line of a cold open never heard the mission's card). The moment ends with its last line, or its last shot.
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
  /* (the aiming dot and the touch stick's ring are no part of a shot; the stick's zone still takes the thumb) */
  body.lastversion.lvcine #crosshair, body.lastversion.lvcine #stickzone #stick { opacity: 0 !important; transition: opacity 0.4s; }
  /* (nor are the year pips and the REVERSE chip, which sat half on the top bar, the aim label, or the watchers' meter) */
  body.lastversion.lvcine #lvTop, body.lastversion.lvcine #lvTarget, body.lastversion.lvcine #eye { opacity: 0 !important; pointer-events: none; transition: opacity 0.4s; }
  /* the watchers' meter only near a watcher (Runtime.step) */
  body.lastversion.lvnoeye #eye { opacity: 0 !important; }
  body.lastversion #lvSkip { position: fixed; right: max(16px, env(safe-area-inset-right)); bottom: calc(9vh + 12px); z-index: 41; display: none;
    background: rgba(0,0,0,0.42); color: #f4f6f8; border: 1px solid rgba(255,255,255,0.35); border-radius: 999px; padding: 7px 16px;
    font: 600 12px/1 system-ui, sans-serif; letter-spacing: 0.14em; cursor: pointer; }
  body.lastversion.lvcine #lvSkip { display: block; }
  body.lastversion #lvSkip small { opacity: 0.6; font-size: 10px; margin-left: 4px; }
  body.lastversion.touch #lvSkip small { display: none; }
`;

// the keys that skip a line and its shot (Enter is the SKIP button's); the actions held while a moment plays (use, the year,
// REVERSE, echo-step, the anchor, THINK, gear): what acts in the world. Pause, the map, the case board, saves pass.
const SKIP_KEYS = ['Space', 'KeyE', 'Enter', 'NumpadEnter'];
const HELD = /^(use|shift|set:|combo|anchor|hint|gear:|rules$)/;

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
      // SKIP: the line being said and the shot it is in (one tap, one line: the card and the rest still play)
      const skipBtn = document.createElement('button');
      skipBtn.id = 'lvSkip';
      skipBtn.innerHTML = 'SKIP › <small>ENTER</small>';
      skipBtn.setAttribute('aria-label', 'Skip');
      skipBtn.onclick = (e) => {
        e.stopPropagation();
        this.skip();
      };
      document.body.appendChild(skipBtn);
      // a deliberate tap, click or key skips a shot (and the line being said): Space or E, a click, a tap on the
      // view. Not a movement key, and not the thumb landing on the stick (a player reaching for the controls
      // as a mission starts would cut its card off line by line)
      const skip = (e) => {
        if (!this.active || this.g.menu) return;
        if (e.type === 'keydown') {
          if (e.repeat) return; // (a key held down repeats: one press skips one line, not the whole moment)
          // (Enter is SKIP's key: with the pointer locked, a desktop at play, the button cannot be clicked)
          if (!SKIP_KEYS.includes(e.code)) return;
        } else if (e.target?.closest?.('button, input, .overlay, #stickzone, #dock, #buttons, #topbtns')) return;
        this.skip();
      };
      window.addEventListener('pointerdown', skip, true);
      window.addEventListener('keydown', skip, true);
    }
    // nothing the player does walks Kai off his mark or acts in the world meanwhile: the movement the input
    // reads (keys, the touch stick, the jump button) is nought, and only the menus' and saves' actions pass
    const input = this.g.input;
    if (input?.poll && input.consumeActions) {
      const poll = input.poll.bind(input);
      input.poll = () => {
        const s = poll();
        if (this.active) {
          s.forward = s.strafe = 0;
          s.jump = false;
        }
        return s;
      };
      const consume = input.consumeActions.bind(input);
      input.consumeActions = () => {
        const a = consume();
        return this.active ? a.filter((x) => !HELD.test(x)) : a;
      };
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

  // hidePlayer: Kai is off screen for the whole of it (the endings: in C he was never born). The game camera, which
  // shows him again by its distance, is not run while a shot holds the view, so he is hidden at each step of it and its
  // first shot is taken at once (no frame of the game camera between two such moments)
  play({ shots = 'default', lines = [], cue = null, letterbox = true, total = null, hidePlayer = false } = {}, then = null) {
    const g = this.g;
    this.end();
    // (the pointer stays locked: letting it go would open the pause menu on a desktop; held keys are dropped in step)
    if (cue) this.rt.score?.cue(cue);
    this.rt.hushBarks?.(); // (a line said in passing gives way: the Zero Second's clocks were narrated behind a commuter)
    const len = total ?? Math.max(3, (lines || []).reduce((a, l) => a + (g.hud.durFn?.(l) || Math.max(2.2, l.text.length * 0.055)), 0));
    const list = shots === 'default' ? this.defaultShots(len) : Array.isArray(shots) ? shots : null;
    const share = list ? len / Math.max(1, list.length) : 0;
    const p0 = g.player.pos.clone();
    this.active = {
      shots: list ? list.map((s) => {
        const cam = this.point(s.cam, p0.clone().add(_a.set(0, 4, 8)));
        return { cam, to: s.to ? this.point(s.to, cam) : cam, look: this.point(s.look, p0), t: s.t || share };
      }) : null,
      i: 0, t: 0, letterbox, then, hidePlayer: hidePlayer && !!list,
    };
    if (letterbox && typeof document !== 'undefined') document.body.classList.add('lvcine');
    const mine = this.active;
    if (mine.shots) this.step(0); // (the first shot at once: no frame of the game camera, nor of Kai round its lens)
    return new Promise((resolve) => {
      mine.resolve = resolve;
      const done = () => this.active === mine && this.end();
      if (lines?.length) g.hud.say(lines, g.facts, done);
      else g.after(len, done);
    });
  }

  // the whole moment ends now: every line still to come is dropped (what waits for it goes on)
  skipAll() {
    const a = this.active;
    if (!a) return;
    a.skipped = true;
    if (this.g.hud.talking) this.g.hud.skipAll();
    else this.end();
  }

  // one tap: the line being said ends (the next one is said) and the shot it is in (the next one is taken); a moment
  // with no line left to say and no shot after this one (a held shot, a timed beat with no lines) ends
  skip() {
    const a = this.active;
    if (!a) return;
    const more = a.shots && a.i < a.shots.length - 1;
    if (more) {
      a.i++;
      a.t = 0;
    }
    if (this.g.hud.talking) this.g.hud.skipSub();
    else if (!more) this.end();
  }

  // each step: the camera along its shot; nothing the player presses walks Kai off his mark meanwhile
  step(dt) {
    const a = this.active;
    if (!a) return;
    const g = this.g;
    g.input.keys?.clear?.();
    if (g.input.state) g.input.state.jump = false;
    // nobody in the crowd starts a line in passing over a staged moment (DeckWorld waits 9 s after the last one)
    if (g.deckWorld && typeof g.time === 'number') g.deckWorld.lastBarkT = g.time;
    if (!a.shots) return;
    const s = a.shots[Math.min(a.i, a.shots.length - 1)];
    a.t += dt;
    const k = ease(Math.min(1, a.t / Math.max(0.1, s.t)));
    const pos = _a.copy(s.cam).lerp(s.to, k);
    g.player.cinema = { pos: { x: pos.x, y: pos.y, z: pos.z }, target: { x: s.look.x, y: s.look.y, z: s.look.z }, up: { x: 0, y: 1, z: 0 } };
    // a shot whose camera stands where Kai stands (a cold open shot from the spawn: Mission 8's doors, the road's start)
    // is his point of view: he is not drawn round the lens (the inside of his head filled the frame). The game camera
    // shows him again by its distance once the moment ends
    const pm = g.player.model;
    if (pm) {
      const p = g.player.pos;
      const inside = Math.hypot(pos.x - p.x, pos.z - p.z) < 0.9 && pos.y > p.y - 1.0 && pos.y < p.y + 1.3;
      if (a.hidePlayer || inside) pm.visible = false;
      else if (a.pov) pm.visible = true;
      a.pov = inside && !a.hidePlayer;
    }
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
