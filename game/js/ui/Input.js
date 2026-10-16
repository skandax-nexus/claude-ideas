// Unified input: keyboard + mouse (pointer lock) on desktop, virtual stick,
// look-drag and buttons on touch devices (Android first).

export class Input {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.state = { forward: 0, strafe: 0, run: false, jump: false, slow: false };
    this.keys = new Set();
    this.look = { dx: 0, dy: 0 };
    this.actions = []; // queued: 'use', 'shift', 'laws', 'journal', 'pause', 'set:STATE'
    this.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.sensitivity = 0.0024;
    this.touchSensitivity = 0.0065;
    this.enabled = true;
    this.stick = { id: null, x: 0, y: 0, ox: 0, oy: 0 };
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
      KeyM: 'map', KeyV: 'camera', F5: 'quicksave', F9: 'quickload',
    };
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (e.code === 'Tab' || e.code === 'F5' || e.code === 'F9') e.preventDefault();
      if (e.code === 'Equal' || e.code === 'NumpadAdd') this.zoom -= 1;
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') this.zoom += 1;
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === 'Space') this.state.jump = true;
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
      stickEl.style.left = `${Math.min(110, r.width * 0.3)}px`;
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
        knob.style.transform = 'translate(-50%,-50%)';
        stickEl.classList.remove('on');
        rest();
      }
    };
    zone.addEventListener('touchend', endStick);
    zone.addEventListener('touchcancel', endStick);

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
      if (now - (this.lastTap || 0) < 280) this.zoomReset = true; // double tap: back to the normal view
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
      b.addEventListener('touchstart', (e) => {
        this.activity();
        e.preventDefault();
        e.stopPropagation();
        const a = b.dataset.act;
        if (a === 'jump') this.state.jump = true;
        else this.actions.push(a);
        b.classList.add('down');
        navigator.vibrate?.(8);
      }, { passive: false });
      b.addEventListener('touchend', () => b.classList.remove('down'));
    }
  }

  moveStick(t, knob, R) {
    let dx = t.clientX - this.stick.ox, dy = t.clientY - this.stick.oy;
    const d = Math.hypot(dx, dy);
    if (d > R) (dx *= R / d), (dy *= R / d);
    this.stick.x = dx / R;
    this.stick.y = dy / R;
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  poll() {
    const k = this.keys;
    let f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    let s = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    let run = k.has('ShiftLeft') || k.has('ShiftRight');
    if (this.stick.id !== null) {
      f = -this.stick.y;
      s = this.stick.x;
      run = Math.hypot(this.stick.x, this.stick.y) > 0.95;
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
