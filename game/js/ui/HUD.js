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
      held: $('#held'), toast: $('#toast'), eye: $('#eye'), fade: $('#fade'), tint: $('#tint'), stability: $('#stability'),
    };
    this.onSubsDone = null;
    // the states the pips show: key, label and css class (an edition replaces them)
    this.states = [{ key: 'PHYSICAL', label: 'PHYSICAL' }, { key: 'INVERTED', label: 'INVERTED' }, { key: 'ECHO', label: 'ECHO' }];
    this.speakers = {}; // an edition's extra speakers, looked up before the story's
  }

  // --- subtitles ---------------------------------------------------------
  say(lines, facts, done) {
    const filtered = lines.filter((l) => !l.when || facts.test(l.when));
    for (const l of filtered) this.subs.push({ ...l, dur: this.durFn?.(l) || Math.max(2.2, l.text.length * 0.055) });
    if (done) this.subs.push({ done });
    if (this.subT <= 0) this.nextSub();
  }

  line(text, who = 'NONE') {
    this.say([{ who, text }], { test: () => true });
  }

  nextSub() {
    let s = this.subs.shift();
    while (s && s.done) {
      const seq = this.subSeq;
      s.done();
      // done() may start the next conversation, which already shows its first line:
      // stop here, or that line would be skipped (Juno's hatch line, the Observer's doorway)
      if (this.subSeq !== seq) return;
      s = this.subs.shift();
    }
    if (!s) {
      this.el.subs.innerHTML = '';
      this.subT = 0;
      return;
    }
    this.cur = s;
    this.onLine?.(s.who, s);
    const sp = s.name ? { name: s.name, color: s.color || '#23303c' } : this.speakers[s.who] || SPEAKERS[s.who] || SPEAKERS.NONE;
    const name = sp.name ? `<b style="color:${sp.color}">${sp.name}</b> ` : '';
    const cls = s.who === 'OBSERVER' ? 'obs' : s.who === 'NONE' ? 'narr' : '';
    this.el.subs.innerHTML = `<div class="sub ${cls}">${name}<span style="color:${sp.color}">${s.text}</span></div>`;
    this.subT = s.dur;
    this.subSeq = (this.subSeq || 0) + 1;
  }

  // a menu closed over a line: say it again from the start, so voice and text stay together
  replay() {
    if (this.subT > 0 && this.cur) {
      this.subs.unshift(this.cur);
      this.nextSub();
    }
  }

  // end the whole conversation now (its end callbacks still run)
  skipAll() {
    this.onSkip?.();
    this.subs = this.subs.filter((x) => x.done);
    if (this.subT > 0) this.subT = 0.01;
  }

  skipSub() {
    this.onSkip?.();
    if (this.subT > 0) this.subT = 0.01;
  }

  get talking() {
    return this.subT > 0 || this.subs.length > 0;
  }

  // --- small widgets -----------------------------------------------------
  // prompt, held and setState run every frame: each touches the DOM only when
  // what it shows has changed (rewriting it every frame cost style, layout and
  // paint work, and garbage that brought on long GC pauses)
  prompt(text) {
    text = text || '';
    const el = this.el.prompt;
    if (text === this._promptText && el.classList.contains('on') === !!text) return;
    this._promptText = text;
    const t = el.querySelector('.txt');
    if (t) t.textContent = text;
    else el.textContent = text;
    el.classList.toggle('on', !!text);
  }

  // avail: the states this room was authored with (others are not shown)
  setState(visible, room, state, roomName, locked, avail = null) {
    const c = this._stateIn;
    if (c && c.visible === visible && (!visible || (c.room === room && c.state === state && c.roomName === roomName && c.locked === locked
      && c.avail === avail && c.states === this.states && c.bar === this.stabilityBar))) return;
    this._stateIn = { visible, room, state, roomName, locked, avail, states: this.states, bar: this.stabilityBar };
    this.el.state.classList.toggle('on', visible);
    if (!visible) return;
    const html =
      `<div class="room">${roomName}${locked ? ' <i>(UNRESPONSIVE)</i>' : ''}</div>` +
      this.states
        .map((st, i) => (avail && !avail.includes(st.key) ? '' : `<span class="pip ${st.key.toLowerCase()} ${st.key === state ? 'cur' : ''}"><em>${i + 1}</em>${st.label}</span>`))
        .join('') + (this.stabilityBar ? '<div class="stab" title="Chronolith stability"><i></i></div>' : '');
    if (html !== this._stateHtml) {
      this._stateHtml = html;
      this.el.state.innerHTML = html;
    }
    const ds = state || this.states[0].key;
    if (document.body.dataset.state !== ds) document.body.dataset.state = ds;
  }

  // Chronolith stability (THE LAST VERSION): a quiet bar that only shows when it matters
  setStability(v, visible, draining = false) {
    // a thin bar under the year pips: quiet until it matters
    const st = this.el.state;
    st.classList.toggle('stab-on', visible);
    st.classList.toggle('draining', visible && draining);
    st.classList.toggle('low', visible && v < 0.3);
    st.style.setProperty('--sv', Math.max(0, Math.min(1, v)).toFixed(3));
    const el = this.el.stability;
    if (!el) return;
    el.classList.toggle('on', visible);
    el.classList.toggle('draining', draining);
    el.classList.toggle('low', v < 0.3);
    el.style.setProperty('--v', Math.max(0, Math.min(1, v)).toFixed(3));
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
      clearInterval(this._glitch); // a rewrite still running would keep overwriting the new text
      el.classList.remove('rewrite');
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
    label = label || '';
    if (label === this._heldLabel && !!echo === this._heldEcho) return;
    this._heldLabel = label;
    this._heldEcho = !!echo;
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

  // A big centred title card (deck arrivals, chapter breaks).
  card(kicker, title, sub, ms = 3800) {
    const el = $('#card');
    el.querySelector('small').textContent = kicker || '';
    el.querySelector('h2').textContent = title || '';
    el.querySelector('p').textContent = sub || '';
    el.classList.add('on');
    clearTimeout(this._cardT);
    this._cardT = setTimeout(() => el.classList.remove('on'), ms);
  }

  // WORLD FORGE: the local rules card, shown on arrival and on demand
  rules(title, rowsHtml, gearHtml, ms = 7000) {
    const el = $('#rules');
    el.querySelector('h2').textContent = title || '';
    el.querySelector('ul').innerHTML = rowsHtml || '';
    el.querySelector('.gg').innerHTML = gearHtml || '';
    el.classList.add('on');
    clearTimeout(this._rulesT);
    if (ms) this._rulesT = setTimeout(() => el.classList.remove('on'), ms);
  }

  rulesHide() {
    clearTimeout(this._rulesT);
    $('#rules').classList.remove('on');
  }

  get rulesShown() {
    return $('#rules').classList.contains('on');
  }

  // Journal in a WORLD FORGE game: the act, its rules, the kit, the cast and what you chose.
  renderForgeJournal(game) {
    const { story, campaign, facts } = game;
    const g = story.game;
    const act = story.decks[campaign.deck];
    const twist = facts.get('forge_twist_read');
    const people = g.cast.map((c) => {
      const st = facts.get(`clue_${c.id}`);
      const label = st === 'guilty' ? 'THE RECORD LIED' : st === 'cleared' ? 'RECORD CORRECTED' : facts.get(`met_${c.id}`) ? 'MET' : 'UNKNOWN';
      const secret = twist && (facts.get(`met_${c.id}`) || c.antagonist) ? `<br><i>${c.first} ${c.secret}.</i>` : '';
      return `<li><span><b>${c.name}</b> <small>${c.role}${c.antagonist && st === 'guilty' ? ` &middot; ${g.truth.how}` : ''}${secret}</small></span><span class="st ${st || ''}">${label}</span></li>`;
    }).join('');
    const choices = story.decks.flatMap((d) => d.beats.filter((b) => b.choice).map((b) => {
      const v = facts.get(b.choice.fact);
      const o = v && b.choice.options.find((x) => x.tag === v);
      return `<li>${b.choice.prompt} <small>${o ? `You chose: ${o.label}.` : 'Not yet decided.'}</small></li>`;
    })).join('') || '<li class="dim">No choices yet.</li>';
    const logs = game.log.slice().reverse().map((l) => `<li>${l}</li>`).join('') || '<li class="dim">Nothing yet.</li>';
    const R = game.rulesHtml(act);
    $('#journal .body').innerHTML = `
      <h3>WHERE YOU ARE</h3><p><b>${g.title.toUpperCase()} &middot; ACT ${campaign.deck + 1} OF ${story.decks.length} &middot; ${act.name}</b><br><span class="dim">${act.subtitle} &middot; ${act.open ? 'district' : 'sector'} ${campaign.sector + 1} of ${act.sectors} &middot; ${g.genre.toLowerCase()} &middot; ${g.hero}</span></p>
      <h3>THE QUESTION</h3><p class="dim">${story.question}</p>
      <h3>LOCAL RULES</h3><ul class="rr">${R.rows}</ul>
      <h3>GEAR</h3><div class="tokens">${R.gear}</div>
      <h3>PEOPLE</h3><ul class="suspects">${people}</ul>
      <h3>YOUR CHOICES</h3><ul>${choices}</ul>
      <h3>LOG</h3><ul class="log">${logs}</ul>`;
  }

  // Journal while out on the vessel: progress, the suspects board, logs.
  renderDeckJournal(game) {
    if (game.story?.forge) return this.renderForgeJournal(game);
    const { story, campaign, facts } = game;
    const deck = story.decks[campaign.deck];
    const sus = story.cast.map((c) => {
      const st = facts.get(`clue_${c.id}`);
      // (HALCYON and the Cradle clear Varga by correcting the record: nobody there has an alibi)
      const label = st === 'guilty' ? 'ECHO CONTRADICTS' : st === 'cleared' ? (story.zones ? 'RECORD CORRECTED' : 'ALIBI CONFIRMED') : facts.get(`met_${c.id}`) ? 'MET' : 'UNKNOWN';
      return `<li><span><b>${c.name}</b> <small>${c.role}${st || c.deck === undefined ? '' : ` &middot; deck ${c.deck + 1}`}</small></span><span class="st ${st || ''}">${label}</span></li>`;
    }).join('');
    const logs = game.log.slice().reverse().map((l) => `<li>${l}</li>`).join('') || '<li class="dim">Nothing yet.</li>';
    $('#journal .body').innerHTML = `
      <h3>WHERE YOU ARE</h3><p><b>${story.zones ? ((story.label || 'HALCYON') === deck.name ? deck.name : `${story.label || 'HALCYON'} &middot; ${deck.name}`) :`DECK ${campaign.deck + 1} OF 8 &middot; ${deck.name}`}</b><br><span class="dim">${deck.title} &middot; ${story.zones ? `district ${campaign.sector + 1} of ${deck.sectors}` : `sector ${campaign.sector + 1} of 4`}</span></p>
      <h3>THE QUESTION</h3><p class="dim">${story.question || 'The first law takes a key and a pair of hands. Someone on this ship put their hands on it at 03:12 and started this cycle. Every crew member has an official record. The echoes don\'t always agree.'}</p>
      <h3>${story.zones ? 'PEOPLE' : 'SUSPECTS'}</h3><ul class="suspects">${sus}</ul>
      <h3>LOG</h3><ul class="log">${logs}</ul>`;
  }

  renderJournal(game) {
    if (game.edition?.renderJournal) return game.edition.renderJournal(game, $('#journal .body'));
    if (game.mode === 'deck') return this.renderDeckJournal(game);
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
    const sig = (l) => (l && (l.subject || l.verb || l.target) ? `${l.subject}|${l.verb}|${l.target}` : '');
    // the draft survives closing the panel; it is rebuilt from the running laws only when
    // they changed elsewhere (a load, a combo switch, the story)
    const draft = (this.lawDraft ||= engine.laws.map((l) => (l ? { ...l } : { subject: null, verb: null, target: null })));
    const rows = draft
      .map((law, i) => {
        if (i >= engine.unlocked) return `<div class="slot locked">SLOT ${i + 1} <i>LOCKED - REQUIRES ARCHIVE AUTHORITY</i></div>`;
        const chip = (kind, key) => {
          const v = law[key];
          return `<button class="chip ${kind} ${v ? '' : 'empty'}" data-slot="${i}" data-key="${key}" data-kind="${kind}">${v ? TOKENS[v].label : '+'}</button>`;
        };
        const r = parseLaw(law.subject || law.verb || law.target ? law : null);
        const active = sig(engine.laws[i]) === sig(law);
        const running = engine.laws[i] ? parseLaw(engine.laws[i]).text : '';
        // what the slot says: RUNNING for a law in force, ACTIVATE (pressable) for a finished
        // draft, and for an unfinished one, plainly, that nothing new is running yet
        const button = active
          ? `<span class="install ${engine.laws[i] ? 'ok' : ''}">${engine.laws[i] ? 'RUNNING' : 'EMPTY'}</span>`
          : `<button class="install pending ${r.ok ? '' : 'dim'}" data-install="${i}" ${r.ok ? '' : 'disabled'}>ACTIVATE</button>`;
        const desc = active ? (r.text || 'Empty slot. Tap the words to write a law.')
          : r.ok ? `Not running yet. Press ACTIVATE to push it.${running ? ` Still running: ${running}` : ''}`
            : `${r.error}. Not running.${running ? ` Still running: ${running}` : ''}`;
        return `<div class="slot ${active ? '' : 'editing'}"><span class="n">${i + 1}</span>${chip('subject', 'subject')}${chip('verb', 'verb')}${chip('target', 'target')}
          ${button}
          <button class="clear" data-clear="${i}" aria-label="Clear law ${i + 1}">&times;</button>
          <div class="desc ${active ? '' : 'err'}">${desc}</div></div>`;
      })
      .join('');
    const effects = engine.laws
      .slice(0, engine.unlocked)
      .filter(Boolean)
      .map((l) => `<li>${describeLaw(l)}</li>`)
      .join('');
    const combos = (game.combos || []).map((c, i) => `<div class="combo ${game.comboIndex === i ? 'cur' : ''}">
        <span class="cname">${c.name}</span>
        <span class="claws">${c.laws.map((l) => (l ? describeLaw(l) : 'EMPTY')).join(' · ')}</span>
        <button data-combo="${i}">SWITCH</button><button class="clear" data-combo-del="${i}" aria-label="Delete combo ${c.name}">&times;</button></div>`).join('');
    const anyRunning = engine.laws.slice(0, engine.unlocked).some(Boolean);
    $('#laws .body').innerHTML = `
      <p class="intro">The device does what its laws say. Tap the words to write a law, then press ACTIVATE to push it.</p>
      ${rows}
      ${flash ? `<div class="flash">${flash}</div>` : ''}
      ${engine.paradoxes.map((p) => `<div class="flash err">${p}</div>`).join('')}
      <h3>RUNNING</h3><ul>${effects || '<li class="dim">No laws. The world is ordinary.</li>'}</ul>
      <h3>LAW COMBOS <small>switch a whole set at once · X key or the dock</small></h3>
      ${combos || '<p class="dim">No combos saved yet. Save the running laws as a combo, then switch between combos with one press.</p>'}
      <div class="comborow"><input id="comboName" maxlength="18" placeholder="Combo name (e.g. CLIMB)" ${anyRunning ? '' : 'disabled'}><button id="comboSave" ${anyRunning ? '' : 'disabled'}>SAVE RUNNING LAWS</button></div>
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
        this.lawsSelf = true;
        const r = engine.setLaw(i, law);
        this.lawsSelf = false;
        if (r.ok) {
          game.onLawInstalled(i, law);
          this.renderLaws(game, law ? `LAW ${i + 1} RUNNING: ${r.text}` : `SLOT ${i + 1} CLEARED`);
        } else {
          game.audio.deny();
          this.renderLaws(game, `<span class="err">${r.error}</span>`);
        }
      };
    }
    for (const b of document.querySelectorAll('#laws [data-clear]')) {
      b.onclick = () => {
        const i = +b.dataset.clear;
        draft[i] = { subject: null, verb: null, target: null };
        if (engine.laws[i]) {
          this.lawsSelf = true;
          engine.setLaw(i, null);
          this.lawsSelf = false;
          game.onLawInstalled(i, null);
          this.renderLaws(game, `SLOT ${i + 1} CLEARED`);
        } else this.renderLaws(game);
      };
    }
    for (const b of document.querySelectorAll('#laws [data-combo]')) b.onclick = () => this.renderLaws(game, game.switchCombo(+b.dataset.combo));
    for (const b of document.querySelectorAll('#laws [data-combo-del]')) b.onclick = () => { game.deleteCombo(+b.dataset.comboDel); this.renderLaws(game); };
    const save = $('#comboSave');
    if (save) save.onclick = () => {
      const name = ($('#comboName').value || '').trim().toUpperCase() || `COMBO ${(game.combos?.length || 0) + 1}`;
      this.renderLaws(game, game.saveCombo(name));
    };
  }
}
