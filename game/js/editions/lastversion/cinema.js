// THE LAST VERSION OF EARTH: staged moments (OVERHAUL.md §8.9): cold opens, hooks, outros and the endings.
//
//   play({ shots, lines, cue, letterbox, rig }, then) -> a promise for its end (then() is called at once when it ends)
//   addFx(fx) -> an effect drawn in the world for as long as it lives (stagefx.js: the endings' rings of light, panes of sky);
//   stepped every frame, staged or not, and let go when a new place loads
//
// shots: [{ cam, to, look, t, hide }] where cam and look are landmark names or [x, y, z] points (t: seconds, else the
// lines' length shared out; hide: Kai is not drawn in that shot), or a function of the runtime that returns them when the
// moment plays; 'default' stages the level's spawn: a wide view behind it easing in, then over
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
  /* a conversation (main.js puts body.talking on while it frames whoever speaks): framed as a staged moment, with the
     cinematics' black bars, and no stick, YEAR, year pips, objective or map over the speaker; the dock stays, dimmed, for
     the pause and the case board (playtest v2.1 FT-18: light grey bars, and the stick, YEAR and the objective drawn over
     the letterboxed frame) */
  body.lastversion #letterbox i { background: #000; }
  body.lastversion.talking #letterbox i { height: 9vh; }
  body.lastversion.talking #buttons, body.lastversion.talking #minimap, body.lastversion.talking #objective, body.lastversion.talking #lvTop,
  body.lastversion.talking #lvTarget, body.lastversion.talking #eye, body.lastversion.talking #crosshair, body.lastversion.talking #stickzone #stick {
    opacity: 0 !important; transition: opacity 0.4s; }
  body.lastversion.talking #buttons, body.lastversion.talking #minimap { pointer-events: none; }
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
    this.fxs = [];
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
  // rig: the camera as a function of the moment instead of shots: (dt, t) -> { cam, look, hide } each step, for a moment
  // whose camera follows what happens in it (the Finale's choice: finale.js); it has no shots, and holds no cut of its own
  play({ shots = 'default', lines = [], cue = null, letterbox = true, total = null, hidePlayer = false, rig = null } = {}, then = null) {
    const g = this.g;
    this.end();
    // (the pointer stays locked: letting it go would open the pause menu on a desktop; held keys are dropped in step)
    if (cue) this.rt.score?.cue(cue);
    this.rt.hushBarks?.(); // (a line said in passing gives way: the Zero Second's clocks were narrated behind a commuter)
    const len = total ?? Math.max(3, (lines || []).reduce((a, l) => a + (g.hud.durFn?.(l) || Math.max(2.2, l.text.length * 0.055)), 0));
    // (shots may be built when the moment plays, from where Kai stands: a function of the runtime, as Mission 2's hook)
    if (typeof shots === 'function') shots = shots(this.rt) || null;
    const list = shots === 'default' ? this.defaultShots(len) : Array.isArray(shots) ? shots : null;
    const share = list ? len / Math.max(1, list.length) : 0;
    const p0 = g.player.pos.clone();
    this.active = {
      shots: list ? list.map((s) => {
        const cam = this.point(s.cam, p0.clone().add(_a.set(0, 4, 8)));
        return { cam, to: s.to ? this.point(s.to, cam) : cam, look: this.point(s.look, p0), t: s.t || share, hide: !!s.hide };
      }) : null,
      i: 0, t: 0, letterbox, then, hidePlayer: hidePlayer && !!list, rig: typeof rig === 'function' ? rig : null,
    };
    if (letterbox && typeof document !== 'undefined') document.body.classList.add('lvcine');
    const mine = this.active;
    if (mine.shots || mine.rig) this.step(0); // (the first shot at once: no frame of the game camera, nor of Kai round its lens)
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

  // a conversation, outside a staged moment (playtest v2.1 FT-18: the game's over-the-shoulder framing showed Kai's back,
  // large, with the speaker small behind him): the camera frames whoever is speaking. The person Kai talks to, from just
  // beside Kai (a clean single when they stand apart, Kai's shoulder at the frame's edge when they stand close); Kai's own
  // lines from beside them, the reverse shot, both from the same side of the line between them; narration keeps the shot
  // it is in. A change of speaker is a cut; within a line the camera eases. Comfort mode keeps the game's camera (main.js
  // sets no talkTarget then)
  talkStep(dt) {
    const g = this.g, pl = g.player;
    const tt = pl?.talkTarget;
    if (!tt || !g.hud?.talking || !pl.rayDistance) {
      if (this.talk) {
        this.talk = null;
        if (pl?.cinema?.talk) pl.cinema = null;
      }
      return;
    }
    const cur = g.hud.subT > 0 ? g.hud.cur : null;
    const T = (this.talk ||= { who: 'them', pos: new THREE.Vector3(), look: new THREE.Vector3(), fresh: true });
    if (cur && !cur.bark && cur.who !== 'NONE') T.who = cur.who === 'KAI' ? 'kai' : 'them';
    const K = _a.set(pl.pos.x, pl.pos.y + 0.74, pl.pos.z);
    const N = _b.set(tt[0], tt[1] - 0.05, tt[2]);
    // (someone not standing, a person posed where the story put them, carries talkAt: where their face is from their
    // feet; Mission 1's woman pinned on her back, the man on his knees. The game's talkTarget is a standing head)
    if (T.npcAt !== tt) {
      T.npcAt = tt;
      T.npc = (g.deckWorld?.npcs || []).find((n) => n.n.talkAt && Math.hypot(n.model.position.x - tt[0], n.model.position.z - tt[2]) < 0.4) || null;
    }
    if (T.npc?.model.visible) {
      const m = T.npc.model.position, o = T.npc.n.talkAt;
      N.set(m.x + o[0], m.y + o[1], m.z + o[2]);
    }
    const ax = N.x - K.x, az = N.z - K.z, D = Math.hypot(ax, az);
    const fx = D > 0.3 ? ax / D : pl.facing?.x ?? 0, fz = D > 0.3 ? az / D : pl.facing?.z ?? 1;
    // (Kai turns to the person he talks to, unless he is walking: the reverse shot sees his face)
    if (pl.facing && Math.hypot(pl.vel?.x || 0, pl.vel?.z || 0) < 0.3 && D > 0.3) pl.facing.set(fx, 0, fz);
    const kai = T.who === 'kai';
    const S = kai ? K : N, sgn = kai ? 1 : -1; // (the subject; the camera stands toward the other one)
    const R = D >= 2.6 ? 2.0 : D + 0.7;
    // (a face low down, someone lying or kneeling, is seen from where Kai stands over them, looking down)
    const feet = pl.pos.y - 0.86, low = !kai && S.y < feet + 0.8;
    // (the way to the camera is tested from the subject's head, or for someone lying from a metre over the floor: the
    // camera's ray keeps a margin round every collider, and a face on the stones starts inside the floor's)
    const O = S.clone();
    if (low) O.y = Math.max(O.y, feet + 1.1);
    const shot = (side) => {
      const c = new THREE.Vector3(S.x + fx * (low ? 2.1 : R) * sgn + fz * side, low ? feet + 1.75 : S.y - 0.02, S.z + fz * (low ? 2.1 : R) * sgn - fx * side);
      const d = c.clone().sub(O), len = d.length();
      d.divideScalar(len);
      const hit = pl.rayDistance(O, d, len);
      return { c, free: hit >= len - 0.05, at: hit < len - 0.05 ? O.clone().addScaledVector(d, Math.max(0.7, hit - 0.25)) : c };
    };
    let pick = shot(0.7);
    if (!pick.free) {
      const other = shot(-0.7);
      pick = other.free || other.at.distanceTo(O) > pick.at.distanceTo(O) ? other : pick;
    }
    const want = pick.free ? pick.c : pick.at;
    const look = new THREE.Vector3(S.x, S.y - 0.16, S.z);
    const cut = T.fresh || T.shot !== T.who;
    T.fresh = false;
    T.shot = T.who;
    if (cut) {
      T.pos.copy(want);
      T.look.copy(look);
    } else {
      const k = 1 - Math.exp(-dt * 5);
      T.pos.lerp(want, k);
      T.look.lerp(look, k);
    }
    pl.cinema = { pos: { x: T.pos.x, y: T.pos.y, z: T.pos.z }, target: { x: T.look.x, y: T.look.y, z: T.look.z }, up: { x: 0, y: 1, z: 0 }, talk: true };
  }

  // each step: the camera along its shot; nothing the player presses walks Kai off his mark meanwhile
  step(dt) {
    this.stepFx(dt);
    const a = this.active;
    if (!a) return this.talkStep(dt);
    if (this.talk) this.talk = null; // (a staged moment takes the camera; a conversation after it starts with a cut)
    const g = this.g;
    g.input.keys?.clear?.();
    if (g.input.state) g.input.state.jump = false;
    // nobody in the crowd starts a line in passing over a staged moment (DeckWorld waits 9 s after the last one)
    if (g.deckWorld && typeof g.time === 'number') g.deckWorld.lastBarkT = g.time;
    if (a.rig) {
      a.t += dt;
      const r = a.rig(dt, a.t);
      if (r?.cam && r.look) {
        a.rigged = true;
        g.player.cinema = { pos: { x: r.cam[0], y: r.cam[1], z: r.cam[2] }, target: { x: r.look[0], y: r.look[1], z: r.look[2] }, up: { x: 0, y: 1, z: 0 } };
        if (g.player.model) g.player.model.visible = !r.hide;
      }
      return;
    }
    if (!a.shots) return;
    const s = a.shots[Math.min(a.i, a.shots.length - 1)];
    a.t += dt;
    const k = ease(Math.min(1, a.t / Math.max(0.1, s.t)));
    const pos = _a.copy(s.cam).lerp(s.to, k);
    g.player.cinema = { pos: { x: pos.x, y: pos.y, z: pos.z }, target: { x: s.look.x, y: s.look.y, z: s.look.z }, up: { x: 0, y: 1, z: 0 } };
    // a shot whose camera stands where Kai stands (a cold open shot from the spawn: Mission 8's doors, the road's start)
    // is his point of view: he is not drawn round the lens (the inside of his head filled the frame). The game camera
    // shows him again by its distance once the moment ends
    // (a shot can leave him out on its own, hide: the cold open's "Kai Varen is asleep" looks at his building, not at him
    // standing at its door; the next shot that does not hide him shows him again)
    const pm = g.player.model;
    if (pm) {
      const p = g.player.pos;
      const inside = Math.hypot(pos.x - p.x, pos.z - p.z) < 0.9 && pos.y > p.y - 1.0 && pos.y < p.y + 1.3;
      if (a.hidePlayer || inside || s.hide) pm.visible = false;
      else if (a.pov) pm.visible = true;
      a.pov = (inside || s.hide) && !a.hidePlayer;
    }
    if (a.t >= s.t && a.i < a.shots.length - 1) {
      a.i++;
      a.t = 0;
    }
  }

  // a scene's own camera for as long as its lines are said (a node's `show` fact is up meanwhile: Runtime.playNode):
  // called by a mission's step each frame; build: shots, or a function of the runtime that returns them. A moment
  // already playing is not interrupted (playtest v2.1 F07: Act II's payoffs, the frozen block and Ward 32's bed)
  watchShow(fact, build) {
    const on = !!this.g.facts.get(fact), key = `show:${fact}`;
    this.shown ||= {};
    if (on && !this.shown[key]) {
      this.shown[key] = true;
      if (this.active) return;
      this.play({ shots: build, lines: [], total: 120 });
      if (this.active) this.active.tag = key;
    } else if (!on && this.shown[key]) {
      this.shown[key] = false;
      if (this.active?.tag === key) this.end();
    }
  }

  // an effect in the world (stagefx.js): { obj, update(dt) -> false once it is over, dispose() }; added to the scene now
  addFx(fx) {
    if (!fx) return null;
    if (fx.obj && this.g.scene) this.g.scene.add(fx.obj);
    this.fxs.push(fx);
    return fx;
  }

  stepFx(dt) {
    if (!this.fxs.length) return;
    this.fxs = this.fxs.filter((f) => {
      if (f.update(dt) !== false) return true;
      f.obj?.removeFromParent();
      f.dispose?.();
      return false;
    });
  }

  dropFx() {
    for (const f of this.fxs) {
      f.obj?.removeFromParent();
      f.dispose?.();
    }
    this.fxs = [];
  }

  // the moment ends (a new one replacing it ends it too: what waited for it goes on); dropped: a new place
  // is loading, and nothing that waited for it follows
  end(dropped = false) {
    if (dropped) this.dropFx(); // (a new place: the effects in this one go with it)
    const a = this.active;
    if (!a) return;
    this.active = null;
    if (a.shots || a.rigged) this.g.player.cinema = null;
    if (typeof document !== 'undefined') document.body.classList.remove('lvcine');
    if (dropped) return;
    a.then?.(); // (at once, not a microtask later: what follows starts on the same frame)
    a.resolve?.();
  }
}
