// Unified input: keyboard + mouse (pointer lock) on desktop, virtual stick,
// look-drag and buttons on touch devices (Android first).

export class Input {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.state = { forward: 0, strafe: 0, run: false, jump: false, slow: false };
    this.runMode = false; // one button toggles walking and running (touch button, CapsLock or Z)
    this.keys = new Set();
    this.look = { dx: 0, dy: 0 };
    this.actions = []; // queued: 'use', 'shift', 'laws', 'journal', 'pause', 'set:STATE'
    this.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.sensitivity = 0.0024;
    this.touchSensitivity = 0.0065;
    this.enabled = true;
    this.stick = { id: null, x: 0, y: 0, ox: 0, oy: 0 };
    this.rimRun = false; // the stick pushed to its rim runs, with hysteresis (on above 97%, off below 85%)
    this.lookTouch = { id: null, x: 0, y: 0 };
    this.zoom = 0; // accumulated zoom steps (+ out, - in)
    this.invertY = false;
    this.pinch = null;
    this.bindKeyboard();
    this.bindMouse();
    if (this.touch) this.bindTouch(ui);
  }

  bindKeyboard() {
    const map = {
      KeyE: 'use', KeyF: 'use', KeyH: 'hint', KeyQ: 'shift', KeyR: 'shift', KeyL: 'laws', Tab: 'laws', KeyJ: 'journal',
      Escape: 'pause', Digit1: 'set:PHYSICAL', Digit2: 'set:INVERTED', Digit3: 'set:ECHO',
      KeyM: 'map', KeyV: 'camera', KeyX: 'combo', F5: 'quicksave', F9: 'quickload', KeyC: 'anchor', Digit4: 'set:4',
      // WORLD FORGE: the four gear slots and the local rules card
      Digit5: 'gear:0', Digit6: 'gear:1', Digit7: 'gear:2', Digit8: 'gear:3', KeyK: 'rules',
    };
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        if (e.code !== 'Escape') return;
        e.target.blur(); // Escape leaves the text box and closes the panel as usual
      }
      // in a menu, Tab moves between its buttons (it still toggles the laws, log and map panels)
      if (e.code === 'Tab' && document.body.classList.contains('menu') && !document.querySelector('#laws.on, #journal.on, #map.on')) return;
      if (e.code === 'Tab' || e.code === 'F5' || e.code === 'F9') e.preventDefault();
      if (e.code === 'Equal' || e.code === 'NumpadAdd') this.zoom -= 1;
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') this.zoom += 1;
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === 'Space') this.state.jump = true;
      if (e.code === 'CapsLock' || e.code === 'KeyZ') this.toggleRun();
      if (map[e.code]) this.actions.push(map[e.code]);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  // anything the player does wakes the HUD up for a moment
  activity() {
    this.lastActivity = performance.now();
  }

  bindMouse() {
    // the dock, the floating prompt and the minimap also work with a mouse
    for (const b of document.querySelectorAll('#ui [data-act]')) {
      b.addEventListener('click', (e) => {
        if (this.touch) return;
        e.stopPropagation();
        const a = b.dataset.act;
        if (a === 'jump') this.state.jump = true;
        else if (a === 'run') this.toggleRun();
        else this.actions.push(a);
      });
    }
    this.canvas.addEventListener('click', () => {
      if (!this.touch && this.enabled && document.pointerLockElement !== this.canvas) this.canvas.requestPointerLock?.();
    });
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== this.canvas) return;
      this.look.dx += e.movementX * this.sensitivity;
      this.look.dy += e.movementY * this.sensitivity;
    });
    document.addEventListener('mousedown', (e) => {
      if (document.pointerLockElement === this.canvas && e.button === 0) this.actions.push('use');
      if (document.pointerLockElement === this.canvas && e.button === 2) this.actions.push('shift');
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('wheel', (e) => {
      if (document.body.classList.contains('menu')) return;
      this.zoom += Math.sign(e.deltaY);
    }, { passive: true });
  }

  bindTouch(ui) {
    document.body.classList.add('touch');
    // The joystick appears wherever your left thumb lands, and follows it.
    const zone = ui.querySelector('#stickzone');
    const stickEl = ui.querySelector('#stick');
    const knob = ui.querySelector('#stick .knob');
    const lookEl = ui.querySelector('#lookzone');
    const R = 56;
    const rest = () => {
      const r = zone.getBoundingClientRect();
      stickEl.style.left = `${Math.max(78, Math.min(110, r.width * 0.3))}px`;
      stickEl.style.top = `${r.height - 100}px`;
    };
    rest();
    window.addEventListener('resize', rest);
    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.stick.id !== null) return;
      const t = e.changedTouches[0];
      const r = zone.getBoundingClientRect();
      stickEl.style.left = `${t.clientX - r.left}px`;
      stickEl.style.top = `${t.clientY - r.top}px`;
      stickEl.classList.add('on');
      Object.assign(this.stick, { id: t.identifier, ox: t.clientX, oy: t.clientY, x: 0, y: 0 });
      this.activity();
    }, { passive: false });
    zone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) if (t.identifier === this.stick.id) this.moveStick(t, knob, R);
    }, { passive: false });
    const endStick = (e) => {
      for (const t of e.changedTouches) if (t.identifier === this.stick.id) {
        this.stick.id = null;
        this.stick.x = this.stick.y = 0;
        this.rimRun = false;
        knob.style.transform = 'translate(-50%,-50%)';
        stickEl.classList.remove('on');
        rest();
      }
    };
    zone.addEventListener('touchend', endStick);
    zone.addEventListener('touchcancel', endStick);

    const pinchDist = (e) => Math.hypot(e.targetTouches[0].clientX - e.targetTouches[1].clientX, e.targetTouches[0].clientY - e.targetTouches[1].clientY);
    lookEl.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.targetTouches.length >= 2) {
        this.pinch = pinchDist(e);
        this.lookTouch.id = null;
        return;
      }
      if (this.lookTouch.id !== null) return;
      const t = e.changedTouches[0];
      const now = performance.now();
      if (now - (this.lastTap || 0) < 350) this.zoomReset = true; // double tap: back to the normal view
      this.lastTap = now;
      Object.assign(this.lookTouch, { id: t.identifier, x: t.clientX, y: t.clientY });
    }, { passive: false });
    lookEl.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.pinch && e.targetTouches.length >= 2) {
        const d = pinchDist(e);
        if (Math.abs(d - this.pinch) > 28) {
          this.zoom += d > this.pinch ? -1 : 1;
          this.pinch = d;
        }
        return;
      }
      for (const t of e.changedTouches) if (t.identifier === this.lookTouch.id) {
        this.look.dx += (t.clientX - this.lookTouch.x) * this.touchSensitivity;
        this.look.dy += (t.clientY - this.lookTouch.y) * this.touchSensitivity;
        this.lookTouch.x = t.clientX;
        this.lookTouch.y = t.clientY;
      }
    }, { passive: false });
    const endLook = (e) => {
      if (e.targetTouches.length < 2) this.pinch = null;
      for (const t of e.changedTouches) if (t.identifier === this.lookTouch.id) this.lookTouch.id = null;
    };
    lookEl.addEventListener('touchend', endLook);
    lookEl.addEventListener('touchcancel', endLook);

    for (const b of ui.querySelectorAll('[data-act]')) {
      // the floating prompt (and anything else marked data-tap) sits where a right thumb starts to look round: it acts on
      // a tap, and a drag that starts on it turns the view. The dock's buttons too: held upright, THE LAST VERSION's dock
      // is a column at the right edge, in the look area (v2.1 playtest review: a look drag from there opened CASE, MAP
      // or MENU, or pressed THINK, and turned nothing)
      if (b.hasAttribute('data-tap') || b.closest('#dock')) {
        this.tapOrLook(b, () => {
          const a = b.dataset.act;
          if (a === 'jump') this.state.jump = true;
          else if (a === 'run') this.toggleRun();
          else this.actions.push(a);
        });
        continue;
      }
      b.addEventListener('touchstart', (e) => {
        this.activity();
        e.preventDefault();
        e.stopPropagation();
        const a = b.dataset.act;
        if (a === 'jump') this.state.jump = true;
        else if (a === 'run') this.toggleRun();
        else this.actions.push(a);
        b.classList.add('down');
        navigator.vibrate?.(8);
      }, { passive: false });
      b.addEventListener('touchend', () => b.classList.remove('down'));
    }
  }

  // A control in the look area: a tap (lifted within TAP_SLOP px of where it landed) fires it on touchend; a touch that
  // moves further is a look drag from there on, as if it had started on the look zone. (Its touches stay with the
  // element they started on, whatever moves or hides under the thumb, so the drag is followed here.)
  tapOrLook(el, fire) {
    let t0 = null;
    const pt = (e) => e.changedTouches?.[0] || { identifier: 'synthetic', clientX: 0, clientY: 0 };
    const mine = (e) => (e.changedTouches?.length ? [...e.changedTouches].find((t) => t0 && t.identifier === t0.id) : t0 && t0.id === 'synthetic' ? pt(e) : null);
    el.addEventListener('touchstart', (e) => {
      this.activity();
      e.preventDefault();
      e.stopPropagation();
      // a second finger while the first is down is not a new tap; but a first touch whose end never came (the system
      // took the gesture) no longer holds the control: it is let go, or the control would ignore every touch after it
      if (t0) {
        const fresh = e.changedTouches?.[0]?.identifier;
        if (fresh !== t0.id && e.touches && [...e.touches].some((x) => x.identifier === t0.id)) return;
        t0 = null;
      }
      const t = pt(e);
      t0 = { id: t.identifier, x: t.clientX, y: t.clientY, lx: t.clientX, ly: t.clientY, drag: false };
      el.classList.add('down');
    }, { passive: false });
    el.addEventListener('touchmove', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const t = mine(e);
      if (!t || t.identifier === 'synthetic') return;
      if (!t0.drag && Math.hypot(t.clientX - t0.x, t.clientY - t0.y) > Input.TAP_SLOP) {
        t0.drag = true;
        el.classList.remove('down');
      }
      if (t0.drag) {
        this.look.dx += (t.clientX - t0.lx) * this.touchSensitivity;
        this.look.dy += (t.clientY - t0.ly) * this.touchSensitivity;
        this.activity();
      }
      t0.lx = t.clientX;
      t0.ly = t.clientY;
    }, { passive: false });
    const end = (e) => {
      const t = mine(e);
      if (!t) return;
      e.stopPropagation();
      const tap = !t0.drag && e.type === 'touchend';
      t0 = null;
      el.classList.remove('down');
      if (!tap) return;
      navigator.vibrate?.(8);
      fire(e);
    };
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
  }

  moveStick(t, knob, R) {
    let dx = t.clientX - this.stick.ox, dy = t.clientY - this.stick.oy;
    const d = Math.hypot(dx, dy);
    if (d > R) (dx *= R / d), (dy *= R / d);
    this.stick.x = dx / R;
    this.stick.y = dy / R;
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  toggleRun(on = !this.runMode) {
    this.runMode = on;
    for (const b of document.querySelectorAll('[data-act="run"]')) {
      b.classList.toggle('on', on);
      const l = b.querySelector('span');
      if (l) l.textContent = on ? 'RUN' : 'WALK';
    }
    this.onGait?.(on);
  }

  poll() {
    const k = this.keys;
    let f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    let s = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    let run = this.runMode !== (k.has('ShiftLeft') || k.has('ShiftRight')); // Shift flips the current gait
    if (this.stick.id !== null) {
      // one continuous curve: a dead zone for a settling thumb (12%), then linear to full
      // deflection at 92%, so the speed never steps as the thumb trembles
      const raw = Math.hypot(this.stick.x, this.stick.y);
      const m = raw <= 0.12 ? 0 : Math.min(1, (raw - 0.12) / 0.8);
      const sc = raw > 0 ? m / raw : 0;
      f = -this.stick.y * sc;
      s = this.stick.x * sc;
      // the rim runs: on above 97%, off only below 85%, so a thumb resting at the edge doesn't flicker
      if (raw > 0.97) this.rimRun = true;
      else if (raw < 0.85) this.rimRun = false;
      run = this.runMode || this.rimRun;
    }
    this.state.forward = f;
    this.state.strafe = s;
    this.state.run = run;
    this.state.slow = k.has('ControlLeft') || k.has('KeyC');
    return this.state;
  }

  consumeZoom() {
    const z = this.zoom;
    this.zoom = 0;
    return z;
  }

  consumeLook() {
    const l = { ...this.look };
    if (this.invertY) l.dy = -l.dy;
    this.look.dx = this.look.dy = 0;
    return l;
  }

  consumeActions() {
    const a = this.actions;
    this.actions = [];
    return a;
  }

  release() {
    if (document.pointerLockElement) document.exitPointerLock?.();
  }
}

// how far (CSS px) a thumb may wander on a tap-only control and still tap it; further, and it is looking round
Input.TAP_SLOP = 12;
