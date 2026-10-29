// THE LAST VERSION on a phone: the controls a player has to find for themselves, said once, when they first matter.
//   - the causal anchor: the first times Kai carries something out of another year (until he has anchored once in
//     this game), a toast says how, and the ANCHOR button (and the CARRYING label, which anchors too) glows;
//   - THINK: the first time Kai seems stuck (the objective unchanged through 45 s of play), once per device;
//   - the CASE board: the first time something is pinned to it, once per device.
// Each is a toast and a glow on the control it names (nothing spoken: no line to record). It also keeps the
// edition's HUD classes on <body>: lvcarry (an echo thing in hand: the ANCHOR button shows), lvanchored, and
// lvnoyear (no Chronolith yet: the YEAR button is greyed, not lit), lvoneyear (a place with one year: greyed too, and a
// tap says why, Runtime.shift; v2.1.1 playtest L5).
import { saveSettings } from './Settings.js';

const STUCK_SECS = 45;
const GLOW_SECS = 10;

export class Tips {
  constructor(game) {
    this.g = game;
    this.cls = {};
    this.glows = {};
    this.stuckT = 0;
    this.obj = null;
    this.heldWas = null;
    this.anchorDue = 0; // >0: an anchor tip waits (seconds waited so far, +1)
    this.evT = 0;
  }

  setClass(k, on) {
    if (this.cls[k] === on) return;
    this.cls[k] = on;
    document.body.classList.toggle(k, on);
  }

  glow(sel, secs) {
    this.glows[sel] = secs;
    document.querySelector(sel)?.classList.add('lvteach');
  }

  stopGlow(sel) {
    if (!(sel in this.glows)) return;
    delete this.glows[sel];
    document.querySelector(sel)?.classList.remove('lvteach');
  }

  done(key) {
    const s = this.g.settings;
    s.tips = { ...(s.tips || {}), [key]: true };
    saveSettings(s);
  }

  // the edition's state for the HUD; run every frame (cheap: a class is written only when it changes)
  update(dt) {
    const g = this.g, e = g.edition;
    if (typeof document === 'undefined') return;
    const lv = !!(e && g.started && g.campaign?.lv && g.mode === 'deck');
    const f = g.facts;
    const chrono = lv && !!f.get('has_chronolith');
    const it = lv ? g.heldItem() : null;
    const carry = chrono && !!it?.echo;
    const anchored = carry && e.anchored === it.id;
    this.setClass('lvnoyear', lv && !chrono);
    this.setClass('lvoneyear', chrono && (g.engine?.statesOf?.(g.room)?.length ?? 2) < 2);
    this.setClass('lvcarry', carry);
    this.setClass('lvanchored', anchored);
    for (const sel of Object.keys(this.glows)) if ((this.glows[sel] -= dt) <= 0) this.stopGlow(sel);
    if (!lv) return;
    const touch = !!g.touch;
    // (not over a menu, a catch, a load, a staged moment, or a title card such as PREVIOUSLY)
    const busy = !!(g.menu || g.paused || g.catching || g.transitioning || e.opening || e.cinema?.active || document.querySelector('#card.on'));
    const toastUp = g.hud.toastT > 0;

    // the anchor: each time an unanchored thing from another year comes into Kai's hands, until he has anchored once
    const teach = carry && !anchored && !f.get('anchored_once');
    if (teach) document.querySelector('#buttons .anchor')?.classList.add('lvteach');
    else if (!('#buttons .anchor' in this.glows)) document.querySelector('#buttons .anchor')?.classList.remove('lvteach');
    if (g.held !== this.heldWas) {
      this.heldWas = g.held;
      this.anchorDue = teach ? 1 : 0;
    }
    if (!teach) this.anchorDue = 0;
    if (this.anchorDue && !busy) {
      this.anchorDue += dt;
      if (!toastUp || this.anchorDue > 2.5) { // (a toast already up first, briefly)
        this.anchorDue = 0;
        g.hud.toast(`<small>CAUSAL ANCHOR</small><br>${it.label} comes apart when the year changes.<br>${touch ? 'Tap ANCHOR first, then YEAR.' : 'Press C to anchor it first, then switch the year.'}`, 6500);
      }
    }

    // THINK: the objective has not moved through 45 s of play (time in menus, staged moments and lines not counted)
    const tips = g.settings.tips || {};
    if (!tips.think) {
      const obj = e.lastObjective || '';
      if (obj !== this.obj) {
        this.obj = obj;
        this.stuckT = 0;
      }
      if (!busy && !g.hud.storyTalking && obj) this.stuckT += dt;
      if (this.stuckT > STUCK_SECS && !toastUp && !busy) {
        this.done('think');
        g.hud.toast(`<small>THINK</small><br>Not sure what is next? ${touch ? 'Tap THINK' : 'Press H'}: Kai thinks it through. Again for a clearer thought.`, 6500);
        this.glow('#dock .hint', GLOW_SECS);
      }
    }
    // the CASE board: the first evidence pinned to it
    if (!tips.case && (this.evT -= dt) <= 0) {
      this.evT = 1;
      const pinned = Object.keys(f.facts).some((k) => k.startsWith('ev_') && f.facts[k]);
      if (pinned && !toastUp && !busy) {
        this.done('case');
        g.hud.toast(`<small>THE CASE BOARD</small><br>What Kai finds is pinned there, under the questions it answers. ${touch ? 'Tap CASE' : 'Press J'} to read it.`, 6500);
        this.glow('#dock .journal', GLOW_SECS);
      }
    }
  }

  // a control the player used: its glow has done its work
  used(action) {
    if (action === 'journal' || action === 'laws') this.stopGlow('#dock .journal');
    else if (action === 'hint') this.stopGlow('#dock .hint');
  }
}
