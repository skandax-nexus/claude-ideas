// HUD and overlays. The HUD is deliberately sparse: no map, no markers, no
// tutorial text. It shows only what the character could know.
import { SPEAKERS, questions } from '../world/story.js';
import { TOKENS, describeLaw, parseLaw } from '../core/Laws.js';

const $ = (s) => document.querySelector(s);
const GLYPHS = '!<>-_\\/[]{}=+*^?#01';

export class HUD {
  constructor() {
    this.subs = [];
    this.subT = 0;
    this.toastT = 0;
    this.el = {
      subs: $('#subs'), prompt: $('#prompt'), state: $('#state'), objective: $('#objective'),
      held: $('#held'), toast: $('#toast'), eye: $('#eye'), fade: $('#fade'), tint: $('#tint'),
    };
    this.onSubsDone = null;
  }

  // --- subtitles ---------------------------------------------------------
  say(lines, facts, done) {
    const filtered = lines.filter((l) => !l.when || facts.test(l.when));
    for (const l of filtered) this.subs.push({ ...l, dur: Math.max(2.2, l.text.length * 0.055) });
    if (done) this.subs.push({ done });
    if (this.subT <= 0) this.nextSub();
  }

  line(text, who = 'NONE') {
    this.say([{ who, text }], { test: () => true });
  }

  nextSub() {
    let s = this.subs.shift();
    while (s && s.done) {
      s.done();
      s = this.subs.shift();
    }
    if (!s) {
      this.el.subs.innerHTML = '';
      this.subT = 0;
      return;
    }
    this.onLine?.(s.who);
    const sp = SPEAKERS[s.who] || SPEAKERS.NONE;
    const name = sp.name ? `<b style="color:${sp.color}">${sp.name}</b> ` : '';
    const cls = s.who === 'OBSERVER' ? 'obs' : s.who === 'NONE' ? 'narr' : '';
    this.el.subs.innerHTML = `<div class="sub ${cls}">${name}<span style="color:${sp.color}">${s.text}</span></div>`;
    this.subT = s.dur;
  }

  skipSub() {
    if (this.subT > 0) this.subT = 0.01;
  }

  get talking() {
    return this.subT > 0 || this.subs.length > 0;
  }

  // --- small widgets -----------------------------------------------------
  prompt(text) {
    this.el.prompt.textContent = text || '';
    this.el.prompt.classList.toggle('on', !!text);
  }

  setState(visible, room, state, roomName, locked) {
    this.el.state.classList.toggle('on', visible);
    if (!visible) return;
    this.el.state.innerHTML =
      `<div class="room">${roomName}${locked ? ' <i>(UNRESPONSIVE)</i>' : ''}</div>` +
      ['PHYSICAL', 'INVERTED', 'ECHO']
        .map((s, i) => `<span class="pip ${s.toLowerCase()} ${s === state ? 'cur' : ''}"><em>${i + 1}</em>${s}</span>`)
        .join('');
    document.body.dataset.state = state || 'PHYSICAL';
  }

  objective(text, animate = true) {
    const el = this.el.objective;
    if (!text) {
      el.classList.remove('on');
      return;
    }
    el.classList.add('on');
    const out = el.querySelector('.txt');
    if (!animate) {
      out.textContent = text;
      return;
    }
    el.classList.add('rewrite');
    let f = 0;
    const old = out.textContent;
    const n = Math.max(old.length, text.length);
    clearInterval(this._glitch);
    this._glitch = setInterval(() => {
      f++;
      const k = Math.floor((f / 28) * n);
      let s = '';
      for (let i = 0; i < n; i++) {
        if (i < k) s += text[i] || '';
        else s += Math.random() < 0.6 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : old[i] || ' ';
      }
      out.textContent = s;
      if (k >= n) {
        clearInterval(this._glitch);
        out.textContent = text;
        el.classList.remove('rewrite');
      }
    }, 45);
  }

  held(label, echo) {
    this.el.held.innerHTML = label ? `CARRYING <b class="${echo ? 'echo' : ''}">${label}</b>` : '';
  }

  toast(text, ms = 3200) {
    this.el.toast.innerHTML = text;
    this.el.toast.classList.add('on');
    this.toastT = ms / 1000;
  }

  eye(v, visible) {
    this.el.eye.classList.toggle('on', visible);
    this.el.eye.style.setProperty('--v', Math.min(1, v).toFixed(3));
    this.el.eye.classList.toggle('alert', v >= 1);
  }

  fade(on) {
    this.el.fade.classList.toggle('on', on);
  }

  flash(color = '#fff') {
    const t = this.el.tint;
    t.style.background = color;
    t.classList.remove('flash');
    void t.offsetWidth;
    t.classList.add('flash');
  }

  update(dt) {
    if (this.subT > 0) {
      this.subT -= dt;
      if (this.subT <= 0) this.nextSub();
    } else if (this.subs.length) this.nextSub();
    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT <= 0) this.el.toast.classList.remove('on');
    }
  }

  // --- overlays ----------------------------------------------------------
  show(id) {
    for (const o of document.querySelectorAll('.overlay')) o.classList.toggle('on', o.id === id);
    document.body.classList.toggle('menu', !!id);
  }

  renderJournal(game) {
    const { facts, objectives, observer } = game;
    const hist = objectives.history
      .map((h, i, a) => `<li class="${i < a.length - 1 ? 'old' : 'cur'}"><span>${h.text}</span><small>${h.because}</small></li>`)
      .join('');
    const logs = game.log.map((l) => `<li>${l}</li>`).join('') || '<li class="dim">Nothing yet. Look closer.</li>';
    const qs = questions
      .filter((q) => facts.test(q.open))
      .map((q) => (facts.test(q.closed) ? `<li class="done">${q.q} <small>${q.a}</small></li>` : `<li>${q.q}</li>`))
      .join('') || '<li class="dim">-</li>';
    const obs = facts.get('hall_seen')
      ? observer.brain.summary().map((t) => `<li>${t}</li>`).join('') || '<li class="dim">It has not learned anything about you. Yet.</li>'
      : '<li class="dim">-</li>';
    $('#journal .body').innerHTML = `
      <h3>CURRENT UNDERSTANDING</h3><ol class="hist">${hist || '<li class="dim">-</li>'}</ol>
      <h3>OPEN QUESTIONS</h3><ul class="qs">${qs}</ul>
      <h3>THEORY LOG</h3><ul class="log">${logs}</ul>
      <h3>THE OBSERVER HAS LEARNED</h3><ul class="obs">${obs}</ul>`;
  }

  renderLaws(game, flash = '') {
    const { engine, facts } = game;
    const owned = Object.keys(TOKENS).filter((t) => facts.get(`token_${t}`));
    const byKind = (k) => owned.filter((t) => TOKENS[t].kind === k);
    const draft = (this.lawDraft ||= engine.laws.map((l) => (l ? { ...l } : { subject: null, verb: null, target: null })));
    const rows = draft
      .map((law, i) => {
        if (i >= engine.unlocked) return `<div class="slot locked">SLOT ${i + 1} <i>LOCKED - REQUIRES ARCHIVE AUTHORITY</i></div>`;
        const chip = (kind, key) => {
          const v = law[key];
          return `<button class="chip ${kind} ${v ? '' : 'empty'}" data-slot="${i}" data-key="${key}" data-kind="${kind}">${v ? TOKENS[v].label : '+'}</button>`;
        };
        const r = parseLaw(law.subject || law.verb || law.target ? law : null);
        const sig = (l) => (l && (l.subject || l.verb || l.target) ? `${l.subject}|${l.verb}|${l.target}` : '');
        const installed = sig(engine.laws[i]) === sig(law);
        return `<div class="slot"><span class="n">${i + 1}</span>${chip('subject', 'subject')}${chip('verb', 'verb')}${chip('target', 'target')}
          <button class="install ${installed ? 'ok' : ''}" data-install="${i}">${installed ? 'ACTIVE' : 'INSTALL'}</button>
          <button class="clear" data-clear="${i}">&times;</button>
          <div class="desc ${r.ok ? '' : 'err'}">${r.ok ? r.text || 'EMPTY SLOT' : r.error}</div></div>`;
      })
      .join('');
    const effects = engine.laws
      .slice(0, engine.unlocked)
      .filter(Boolean)
      .map((l) => `<li>${describeLaw(l)}</li>`)
      .join('');
    $('#laws .body').innerHTML = `
      <p class="intro">The device does what its laws say. Tap a token to cycle it, then install the law.</p>
      ${rows}
      ${flash ? `<div class="flash">${flash}</div>` : ''}
      ${engine.paradoxes.map((p) => `<div class="flash err">${p}</div>`).join('')}
      <h3>RUNNING</h3><ul>${effects || '<li class="dim">No laws. The world is ordinary.</li>'}</ul>
      <h3>TOKENS FOUND</h3><div class="tokens">${owned.map((t) => `<span class="tk ${TOKENS[t].kind}">${TOKENS[t].label}</span>`).join('')}</div>`;

    for (const b of document.querySelectorAll('#laws .chip')) {
      b.onclick = () => {
        const i = +b.dataset.slot, key = b.dataset.key;
        const opts = [null, ...byKind(b.dataset.kind)];
        const cur = opts.indexOf(draft[i][key]);
        draft[i][key] = opts[(cur + 1) % opts.length];
        this.renderLaws(game);
      };
    }
    for (const b of document.querySelectorAll('#laws [data-install]')) {
      b.onclick = () => {
        const i = +b.dataset.install;
        const d = draft[i];
        const law = d.subject || d.verb || d.target ? { ...d } : null;
        const r = engine.setLaw(i, law);
        if (r.ok) {
          game.onLawInstalled(i, law);
          this.renderLaws(game, law ? `LAW ${i + 1} INSTALLED` : `SLOT ${i + 1} CLEARED`);
        } else {
          game.audio.deny();
          this.renderLaws(game, `<span class="err">${r.error}</span>`);
        }
      };
    }
    for (const b of document.querySelectorAll('#laws [data-clear]')) {
      b.onclick = () => {
        draft[+b.dataset.clear] = { subject: null, verb: null, target: null };
        this.renderLaws(game);
      };
    }
  }
}
