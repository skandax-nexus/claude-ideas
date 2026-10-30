// THE LAST VERSION on a phone: picking a year (v2.1.1 playtest M1). YEAR only stepped forward through a place's years,
// and the year pips cannot be tapped, so going from 2026 to 2049 passed through 2196: in Mission 5's village that year
// drowned Kai on every tap, and on Mission 12's gangway it dropped him 13 m. Now, in a place with three years, YEAR
// opens a picker: the three years as thumb-sized buttons over the YEAR button, 2026 at the top, the year Kai is in
// marked NOW. A tap on a year switches straight to it; a thumb pressed on YEAR and slid onto a year picks it as it
// lifts. YEAR again, a touch anywhere else, or 6 s without a pick close it. Where a place has two years, YEAR still
// switches with one tap (the other year is the only pick); where it has one, YEAR is dimmed (Tips.js) and says so
// (Runtime.shift). The keyboard is unchanged: Q steps on, 1 2 3 pick.
//   new YearPick(rt); rt.yearButton() -> toggle(); step(dt) closes it when it no longer applies

const ORDER = ['PAST', 'PRESENT', 'FUTURE']; // 2026, 2049, 2196: top to bottom, as everywhere the years are listed
const OPEN_SECS = 6;

const CSS = `
body.lastversion #lvYearPick { position: fixed; z-index: 6; display: none; flex-direction: column; gap: 8px; width: 172px; pointer-events: none; }
body.lastversion #lvYearPick.on { display: flex; }
body.lastversion #lvYearPick button { pointer-events: auto; position: relative; min-height: 52px; width: 100%; margin: 0; padding: 0 14px; border: none; border-radius: 999px;
  color: #fff; font: 800 13px Inter, sans-serif; letter-spacing: 0.1em; text-align: left; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
  box-shadow: 0 6px 18px rgba(20, 30, 50, 0.35), inset 0 0 0 2px rgba(255, 255, 255, 0.35); }
body.lastversion #lvYearPick button[data-state="PAST"] { background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%), var(--past); }
body.lastversion #lvYearPick button[data-state="PRESENT"] { background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%), var(--present); }
body.lastversion #lvYearPick button[data-state="FUTURE"] { background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%), var(--future); }
body.lastversion #lvYearPick button.cur { opacity: 0.6; padding-right: 50px; box-shadow: inset 0 0 0 2px #fff; }
body.lastversion #lvYearPick button.cur::after { content: "NOW"; position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 9px; letter-spacing: 0.16em; opacity: 0.9; }
body.lastversion #lvYearPick button.over, body.lastversion #lvYearPick button.down { transform: scale(1.05); box-shadow: 0 0 0 3px #fff, 0 6px 18px rgba(20, 30, 50, 0.35); }
body.lastversion #lvYearPick button.off { display: none; }
`;

export class YearPick {
  constructor(rt) {
    this.rt = rt;
    this.g = rt.g;
    this.open = false;
    this.t = 0;
    if (typeof document === 'undefined' || !document.querySelector('#ui')) return;
    if (!document.querySelector('#lvYearPickCss')) {
      const st = document.createElement('style');
      st.id = 'lvYearPickCss';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    this.el = document.createElement('div');
    this.el.id = 'lvYearPick';
    this.el.setAttribute('role', 'group');
    this.el.setAttribute('aria-label', 'Pick a year');
    this.btns = {};
    for (const s of ORDER) {
      const b = document.createElement('button');
      b.dataset.state = s;
      b.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        b.classList.add('down');
        navigator.vibrate?.(8);
        this.pick(s);
      }, { passive: false });
      b.addEventListener('touchend', () => b.classList.remove('down'));
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        this.pick(s);
      });
      this.btns[s] = b;
      this.el.appendChild(b);
    }
    document.querySelector('#ui').appendChild(this.el);
    // the YEAR button: its touch opened the picker (Input queues 'year', main.js -> Runtime.yearButton); slid onto a
    // year, the thumb picks it as it lifts
    this.yearBtn = document.querySelector('#buttons .shift');
    const under = (e) => {
      const t = e.changedTouches?.[0];
      const el = t && document.elementFromPoint?.(t.clientX, t.clientY);
      return el?.closest?.('#lvYearPick button') || null;
    };
    this.yearBtn?.addEventListener('touchmove', (e) => {
      if (!this.open) return;
      const b = under(e);
      for (const x of Object.values(this.btns)) x.classList.toggle('over', x === b);
    }, { passive: true });
    this.yearBtn?.addEventListener('touchend', (e) => {
      if (!this.open) return;
      const b = under(e);
      for (const x of Object.values(this.btns)) x.classList.remove('over');
      if (b) this.pick(b.dataset.state);
    });
    // a touch anywhere else closes it (and does what it does: the stick, a look, the prompt)
    window.addEventListener('touchstart', (e) => {
      if (this.open && !e.target?.closest?.('#lvYearPick, #buttons .shift')) this.close();
    }, { capture: true, passive: true });
    window.addEventListener('mousedown', (e) => {
      if (this.open && !e.target?.closest?.('#lvYearPick, #buttons .shift')) this.close();
    }, true);
  }

  // the years this place has, in the order they are listed
  years() {
    const g = this.g;
    const list = g.engine.statesOf(g.room);
    return ORDER.filter((s) => list.includes(s));
  }

  // YEAR pressed in a place with three years
  toggle() {
    if (this.open) return this.close();
    if (!this.el) return;
    const g = this.g, cur = g.engine.state(g.room), list = this.years();
    for (const s of ORDER) {
      const b = this.btns[s];
      b.classList.toggle('off', !list.includes(s));
      b.classList.toggle('cur', s === cur);
      b.textContent = this.rt.label(s);
      b.setAttribute('aria-label', `${this.rt.label(s)}${s === cur ? ' (now)' : ''}`);
    }
    // over the YEAR button, its right edge on YEAR's (the jump button is to its right), clamped on screen
    const r = this.yearBtn?.getBoundingClientRect?.();
    const W = window.innerWidth, H = window.innerHeight, w = 172;
    const right = r && r.width ? r.right : W - 24;
    const top = r && r.height ? r.top : H - 120;
    this.el.style.left = `${Math.round(Math.max(8, Math.min(W - w - 8, right - w)))}px`;
    this.el.style.bottom = `${Math.round(Math.max(8, H - top + 10))}px`;
    this.el.classList.add('on');
    this.open = true;
    this.at = cur;
    this.t = OPEN_SECS;
    // said once: what the picker is (it explains itself, but a first-time player is told the years can be skipped)
    const tips = g.settings.tips || {};
    if (!tips.yearpick) {
      g.tips?.done?.('yearpick');
      g.hud.toast('<small>PICK A YEAR</small><br>This place has three years. Tap the one you want: Kai goes straight there.', 5200);
    }
  }

  pick(s) {
    if (!this.open) return;
    const g = this.g;
    this.close();
    if (g.menu || g.paused) return;
    if (g.engine.state(g.room) === s) return;
    this.rt.shift(s);
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.el?.classList.remove('on');
    for (const b of Object.values(this.btns || {})) b.classList.remove('over', 'down');
  }

  // every step: it closes after a while, and when it no longer applies (a menu, a staged moment, a catch, a load,
  // another place, a year changed some other way)
  step(dt) {
    if (!this.open) return;
    const g = this.g, rt = this.rt;
    if ((this.t -= dt) <= 0 || g.menu || g.paused || g.catching || g.transitioning || rt.opening || rt.cinema?.active
      || this.years().length < 3 || !g.facts.get('has_chronolith') || g.engine.state(g.room) !== this.at) this.close();
  }
}
