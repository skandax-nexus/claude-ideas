// THE LAST VERSION OF EARTH: the score (OVERHAUL.md §8.9). Procedural, 0 bytes of assets: it writes the
// music through Synth's composer hook, plays the cues of the story's moments, runs the ambience beds of
// each place and year, keeps the player's mix (Dialogue, Music, Effects, Ambience, Sound captions) and
// shows TAP FOR SOUND until the first tap has woken the sound up.
//
//   MOTIF    the bible's three notes, also the Child's song: up a fourth, up a fourth, and it stops on an
//            unresolved sus4. The Main Theme plays it on piano, the Witness slower and lower on bowed metal,
//            Mira with reversed tails, the Child on a music box.
//   REGIONS  each mission's music: tempo, mode and instruments, with a layer per year that crossfades
//            over 1.5 s when the year changes (Synth.sweep is the signature transition).
//   CUES     the story's moments: chapter, card, reveal, consequence, cliff, zero, fracture, pin, echoStep,
//            reverse, loopReset, pa, ending:A / B / C, postcredit.
//   BEDS     what a place sounds like in each year (rain, traffic, walla, wind, water, birds, ...).
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const MODES = {
  aeolian: [0, 2, 3, 5, 7, 8, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11], ionian: [0, 2, 4, 5, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10],
};
export const MOTIF = [0, 5, 10]; // semitones: up a fourth, up a fourth (it stops there, over a sus4)

// a region's music. layers: what plays in each year; prog: the chord roots (scale degrees), a bar each
export const REGIONS = {
  title: { tempo: 78, root: 57, mode: 'aeolian', prog: [0, 5, 2, 6], layers: { PRESENT: ['pad', 'piano', 'motif'] }, motif: 'theme' },
  rain_city: { tempo: 92, root: 57, mode: 'aeolian', prog: [0, 5, 3, 4], motif: 'theme',
    layers: { PRESENT: ['piano', 'pulse', 'ticks', 'bass'], PAST: ['piano', 'pluck', 'bell', 'bass'], FUTURE: ['strings', 'piano'] } },
  helix: { tempo: 84, root: 50, mode: 'phrygian', prog: [0, 1, 0, 6], motif: 'witness',
    layers: { PRESENT: ['metal', 'piano', 'alarm', 'sub'], PAST: ['piano', 'pluck', 'pad'], FUTURE: ['glass', 'strings', 'metal'] } },
  settlement: { tempo: 82, root: 52, mode: 'dorian', prog: [0, 3, 6, 4], motif: 'theme',
    layers: { PRESENT: ['drum', 'flute', 'pluck'], PAST: ['drum', 'flute', 'pluck', 'bass'], FUTURE: ['flute', 'glass', 'pad'] } },
  clockmaker: { tempo: 72, root: 55, mode: 'ionian', prog: [0, 3, 4, 0], motif: 'child',
    layers: { PRESENT: ['clock', 'musicbox', 'piano'], PAST: ['clock', 'musicbox', 'pluck'], FUTURE: ['clock', 'glass'] } },
  observatory: { tempo: 60, root: 53, mode: 'lydian', prog: [0, 1, 4, 0], motif: 'theme',
    layers: { PRESENT: ['glass', 'cello'], PAST: ['glass', 'cello', 'flute'], FUTURE: ['glass', 'strings'] } },
  loop_city: { tempo: 118, root: 57, mode: 'aeolian', prog: [0, 5, 6, 4], motif: 'witness', loop: ['bass', 'pulse', 'piano', 'strings', 'choir'],
    layers: { PRESENT: ['bass'], PAST: ['bass', 'pluck'], FUTURE: ['bass', 'glass'] } },
  detention: { tempo: 100, root: 52, mode: 'phrygian', prog: [0, 1, 6, 0], motif: 'theme',
    layers: { PRESENT: ['perc', 'ostinato', 'sub'], PAST: ['perc', 'ostinato'], FUTURE: ['ostinato', 'glass'] } },
  hospital: { tempo: 64, root: 60, mode: 'aeolian', prog: [0, 5, 3, 6], motif: 'mira',
    layers: { PRESENT: ['beeps', 'revpad', 'piano'], PAST: ['beeps', 'pad', 'piano'], FUTURE: ['revpad', 'glass'] } },
  war: { tempo: 118, root: 50, mode: 'phrygian', prog: [0, 6, 5, 1], motif: 'theme', drop: 9,
    layers: { PRESENT: ['perc', 'ostinato', 'bass', 'brass'], PAST: ['perc', 'ostinato', 'bass'], FUTURE: ['perc', 'ostinato', 'strings'] } },
  city2196: { tempo: 70, root: 53, mode: 'lydian', prog: [0, 4, 5, 3], motif: 'theme',
    layers: { PRESENT: ['strings', 'piano'], PAST: ['strings', 'piano', 'pluck'], FUTURE: ['strings', 'brass', 'piano'] } },
  locked_city: { tempo: 70, root: 53, mode: 'lydian', prog: [0, 4, 5, 3], motif: 'theme', repeat: 4,
    layers: { PRESENT: ['strings', 'piano'], PAST: ['strings', 'pluck'], FUTURE: ['strings', 'brass', 'piano'] } },
  museum: { tempo: 66, root: 55, mode: 'dorian', prog: [0, 3, 1, 5], motif: 'all', free: true,
    layers: { PRESENT: ['glass', 'prepared'], PAST: ['glass', 'prepared', 'pluck'], FUTURE: ['glass', 'prepared', 'strings'] } },
  archive: { tempo: 54, root: 45, mode: 'phrygian', prog: [0, 1, 5, 0], motif: 'witness',
    layers: { PRESENT: ['cello', 'metal', 'sub'], PAST: ['cello', 'metal'], FUTURE: ['metal', 'glass', 'sub'] } },
  fracture: { tempo: 76, root: 50, mode: 'aeolian', prog: [0, 1, 5, 6], motif: 'witness', mixed: true,
    layers: { PRESENT: ['piano', 'pulse', 'sub'], PAST: ['drum', 'flute', 'sub'], FUTURE: ['strings', 'brass', 'sub'] } },
  liminal: { tempo: 48, root: 50, mode: 'lydian', prog: [0, 4, 0, 1], motif: 'fragments', free: true,
    layers: { PRESENT: ['glass', 'sub'], PAST: ['glass', 'sub', 'flute'], FUTURE: ['glass', 'sub', 'strings'] } },
  memory: { tempo: 64, root: 57, mode: 'aeolian', prog: [0, 5, 2, 6], motif: 'mira',
    layers: { PRESENT: ['piano', 'cello'], PAST: ['piano', 'cello', 'musicbox'], FUTURE: ['piano', 'cello', 'strings'] } },
  command: { tempo: 110, root: 48, mode: 'phrygian', prog: [0, 6, 1, 0], motif: 'witness', cold: true,
    layers: { PRESENT: ['perc', 'ostinato', 'metal', 'bass'], PAST: ['perc', 'ostinato', 'bass'], FUTURE: ['ostinato', 'metal', 'strings'] } },
  finale: { tempo: 78, root: 57, mode: 'aeolian', prog: [0, 5, 2, 6], motif: 'theme', slows: 62,
    layers: { PRESENT: ['piano', 'metal', 'strings'], PAST: ['piano', 'flute', 'drum'], FUTURE: ['piano', 'strings', 'brass'] } },
};
// which region each mission plays in (a mission's own `music` wins)
export const MISSION_REGION = {
  m01: 'rain_city', m02: 'helix', m03: 'helix', m04: 'settlement', m05: 'settlement', m06: 'clockmaker', m07: 'observatory', m08: 'helix',
  m09: 'loop_city', m10: 'detention', m11: 'hospital', m12: 'helix', m13: 'war', m14: 'city2196', m15: 'locked_city', m16: 'museum',
  m17: 'archive', m18: 'fracture', m19: 'liminal', m20: 'memory', m21: 'command', m22: 'liminal', m23: 'finale', c_b: 'settlement', c_c: 'locked_city',
};
// what each region sounds like in each year (a mission's own `beds: { PRESENT: [...], ... }` win); the year's
// own rain or storm always adds the rain
export const BEDS = {
  rain_city: { PRESENT: ['rain', 'traffic', 'walla'], PAST: ['rain', 'walla'], FUTURE: ['wind', 'birds'] },
  helix: { PRESENT: ['hum', 'drip'], PAST: ['hum', 'site'], FUTURE: ['wind', 'birds', 'drip'] },
  settlement: { PRESENT: ['water', 'birds', 'walla'], PAST: ['water', 'birds', 'fire', 'walla'], FUTURE: ['water', 'wind'] },
  clockmaker: { PRESENT: ['hum', 'wind'], PAST: ['fire', 'walla'], FUTURE: ['wind'] },
  observatory: { PRESENT: ['wind'], PAST: ['wind', 'birds'], FUTURE: ['wind', 'birds'] },
  loop_city: { PRESENT: ['traffic', 'walla', 'siren'], PAST: ['walla', 'water'], FUTURE: ['wind'] },
  detention: { PRESENT: ['hum', 'water', 'drip'], PAST: ['water', 'wind'], FUTURE: ['wind', 'drip'] },
  hospital: { PRESENT: ['hum', 'walla'], PAST: ['hum', 'walla', 'birds'], FUTURE: ['wind', 'birds'] },
  war: { PRESENT: ['fire', 'wind', 'siren'], PAST: ['wind', 'water'], FUTURE: ['fire', 'wind'] },
  city2196: { PRESENT: ['wind', 'birds'], PAST: ['traffic', 'walla'], FUTURE: ['wind', 'birds', 'water'] },
  locked_city: { PRESENT: ['walla', 'wind'], PAST: ['walla'], FUTURE: ['walla', 'birds'] },
  museum: { PRESENT: ['hum', 'drip'], PAST: ['hum'], FUTURE: ['hum', 'wind'] },
  archive: { PRESENT: ['wind'], PAST: ['wind', 'hum'], FUTURE: ['wind'] },
  fracture: { PRESENT: ['wind', 'rain'], PAST: ['wind'], FUTURE: ['wind', 'fire'] },
  liminal: { PRESENT: ['tone'], PAST: ['tone', 'water'], FUTURE: ['tone', 'wind'] },
  memory: { PRESENT: ['tone'], PAST: ['birds', 'water'], FUTURE: ['water', 'birds'] },
  command: { PRESENT: ['wind', 'hum'], PAST: ['wind'], FUTURE: ['wind', 'hum'] },
  finale: { PRESENT: ['rain', 'wind'], PAST: ['water', 'birds'], FUTURE: ['wind', 'birds'] },
};
// the filtered-noise loops the beds are built from
const NOISE = {
  rain: { type: 'bandpass', freq: 1400, q: 0.5, vol: 0.05, lfo: 0.15, depth: 400 },
  traffic: { type: 'lowpass', freq: 260, q: 0.6, vol: 0.05, lfo: 0.05, depth: 90 },
  walla: { type: 'bandpass', freq: 600, q: 1.1, vol: 0.016, lfo: 0.4, depth: 180 },
  water: { type: 'bandpass', freq: 520, q: 0.7, vol: 0.035, lfo: 0.3, depth: 120 },
  wind: { type: 'lowpass', freq: 380, q: 0.4, vol: 0.05, lfo: 0.09, depth: 220 },
  hum: { type: 'bandpass', freq: 120, q: 6, vol: 0.03, lfo: 0.02, depth: 4 },
  fire: { type: 'highpass', freq: 2200, q: 0.4, vol: 0.012, lfo: 1.7, depth: 600 },
  site: { type: 'bandpass', freq: 900, q: 2, vol: 0.012, lfo: 0.6, depth: 300 },
  tone: { type: 'lowpass', freq: 90, q: 3, vol: 0.03, lfo: 0.03, depth: 20 },
};
// things a bed does now and then (scheduled on the score's clock)
const EVENTS = { birds: 0.06, drip: 0.05, siren: 0.004, walla: 0.03, fire: 0.05 };
// a caption for a cue that carries a clue, when Sound captions is on
const CAPTIONS = {
  zero: 'every clock stops ticking', pa: 'a two-tone chime', reveal: 'a low drop', loopReset: 'a tape rewinds; sirens',
  fracture: 'the air tears', postcredit: 'a clock ticks', consequence: 'a low metallic ring', echoStep: 'a reversed rush',
};
const STYLE = `
  body.lastversion #lvSound { position: fixed; left: 50%; bottom: 18%; transform: translateX(-50%); z-index: 60; display: none;
    padding: 12px 20px; border-radius: 22px; background: rgba(20,26,34,0.82); color: #fff; font: 600 14px/1.2 system-ui, sans-serif;
    letter-spacing: 0.14em; cursor: pointer; border: 1px solid rgba(255,255,255,0.35); }
  body.lastversion #lvSound.on { display: block; }
  body.lastversion #lvCaption { position: fixed; left: 50%; top: 12%; transform: translateX(-50%); z-index: 55; pointer-events: none;
    color: #eef2f6; font: italic 14px/1.3 system-ui, sans-serif; text-shadow: 0 1px 3px #000; opacity: 0; transition: opacity 0.3s; }
  body.lastversion #lvCaption.on { opacity: 0.95; }
  body.lastversion #settings .lvmix small { display: block; }
  body.lastversion #journal .lvplay { border: 0; background: none; color: inherit; cursor: pointer; padding: 0 4px; font-size: 12px; opacity: 0.75; }
  body.lastversion #journal .lvplay:hover { opacity: 1; }
`;

export class Score {
  constructor(rt) {
    this.rt = rt;
    this.g = rt.g;
    this.region = REGIONS.title;
    this.regionKey = 'title';
    this.year = 'PRESENT';
    this.heard = []; // every cue, in order (the bots read it)
    this.seed = 7;
    this.beds = new Map();
    this.layer = null;
    this.loops = 0;
    if (typeof document !== 'undefined' && document.querySelector('#ui') && !document.querySelector('#lvScore')) {
      const st = document.createElement('style');
      st.id = 'lvScore';
      st.textContent = STYLE;
      document.head.appendChild(st);
      this.banner = document.createElement('button');
      this.banner.id = 'lvSound';
      this.banner.textContent = 'TAP FOR SOUND';
      document.body.appendChild(this.banner);
      this.caption = document.createElement('div');
      this.caption.id = 'lvCaption';
      document.body.appendChild(this.caption);
    }
  }

  get a() {
    return this.g.audio;
  }

  ready() {
    return !!this.a?.ctx && !!this.a.music;
  }

  rand() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  // the composer hook: the music is ours from now on (Synth.schedule calls step)
  attach() {
    this.a.composer = this;
  }

  // TAP FOR SOUND: shown while the sound is asleep after a tap (the context would not start)
  setBanner(on) {
    this.banner?.classList.toggle('on', !!on);
  }

  // --- the mix (the edition's Settings rows) -----------------------------------------------------------
  applyMix(s) {
    const m = s.mix || {};
    this.a.setMix?.({ voice: m.voice ?? 1, music: m.music ?? 0.8, sfx: m.sfx ?? 1, amb: m.amb ?? 0.85 });
    this.captions = !!s.captions;
  }

  // rows under SOUND in the settings: Dialogue, Music, Effects, Ambience, Sound captions
  mixRows(g) {
    const body = document.querySelector('#settings .body');
    if (!body || body.querySelector('.lvmix')) return;
    const s = g.settings;
    s.mix ||= { voice: 1, music: 0.8, sfx: 1, amb: 0.85 };
    const rows = [['voice', 'Dialogue'], ['music', 'Music'], ['sfx', 'Effects'], ['amb', 'Ambience']]
      .map(([k, l]) => `<div class="setting lvmix"><span>${l}</span><input type="range" data-mix="${k}" min="0" max="1" step="0.05" value="${s.mix[k] ?? 1}"></div>`).join('');
    const caps = `<div class="setting lvmix"><span>Sound captions<small>Brackets for sounds that carry a clue</small></span><span class="seg"><button data-cap="1" class="${s.captions ? 'sel' : ''}">ON</button><button data-cap="0" class="${s.captions ? '' : 'sel'}">OFF</button></span></div>`;
    const vol = [...body.querySelectorAll('.setting')].find((el) => /Volume/.test(el.textContent));
    const html = rows + caps;
    if (vol) vol.insertAdjacentHTML('afterend', html);
    else body.insertAdjacentHTML('beforeend', html);
    for (const r of body.querySelectorAll('input[data-mix]')) r.oninput = () => g.changeSetting('mix', { ...g.settings.mix, [r.dataset.mix]: +r.value });
    for (const b of body.querySelectorAll('button[data-cap]')) {
      b.onclick = () => {
        g.changeSetting('captions', b.dataset.cap === '1');
        for (const x of body.querySelectorAll('button[data-cap]')) x.classList.toggle('sel', x === b);
      };
    }
  }

  cap(name) {
    if (CAPTIONS[name]) this.capText(CAPTIONS[name]);
  }

  // a bracketed caption for a sound that carries a clue (Sound captions on), and a pulse with it: Mission 11's
  // chime shows each of its four tones as it sounds
  capText(text) {
    if (!this.captions || !this.caption) return;
    this.caption.textContent = `[${text}]`;
    this.caption.classList.add('on');
    clearTimeout(this.capT);
    this.capT = setTimeout(() => this.caption.classList.remove('on'), 2600);
  }

  // --- where the music is ---------------------------------------------------------------------------------
  title() {
    this.setRegion('title');
    this.setBeds([]);
  }

  // a mission's music and beds, in the place's year
  enter(deck, year = 'PRESENT', level = null) {
    this.deck = deck;
    this.level = level;
    this.loops = 0;
    this.setRegion(deck.music || MISSION_REGION[deck.mkey || deck.key] || 'rain_city');
    this.setYear(year, true);
  }

  setRegion(key) {
    if (this.regionKey === key && this.region) return;
    this.regionKey = key;
    this.region = REGIONS[key] || REGIONS.rain_city;
    this.bar0 = null;
    this.newLayer(0.8);
  }

  setYear(year, instant = false) {
    const changed = year !== this.year;
    this.year = year;
    if (changed && !instant) this.newLayer(1.5);
    // the beds: the mission's own, else the region's; the year's rain adds the rain
    const own = this.deck?.beds?.[year];
    const base = own || BEDS[this.regionKey]?.[year] || [];
    const w = this.level?.years?.[year]?.weather;
    this.setBeds([...new Set([...base, ...(['rain', 'storm'].includes(w) ? ['rain'] : [])])], instant ? 0.6 : 1.5);
  }

  // the music's layers crossfade: the new layer comes in as the old one's notes ring out
  newLayer(sec) {
    if (!this.ready()) return;
    const c = this.a.ctx, t = c.currentTime;
    const old = this.layer;
    if (old) {
      old.gain.cancelScheduledValues(t);
      old.gain.setTargetAtTime(0.0001, t, sec / 3);
      setTimeout(() => old.disconnect(), (sec + 1.5) * 1000);
    }
    const g = c.createGain();
    g.gain.value = 0.0001;
    g.gain.setTargetAtTime(1, t, sec / 3);
    g.connect(this.a.music);
    this.layer = g;
  }

  // --- the beds -----------------------------------------------------------------------------------------
  setBeds(kinds, sec = 1.5) {
    if (!this.ready()) {
      this.wantBeds = kinds;
      return;
    }
    const c = this.a.ctx, t = c.currentTime;
    for (const [k, b] of this.beds) {
      if (kinds.includes(k)) continue;
      b.gain.gain.setTargetAtTime(0.0001, t, sec / 3);
      setTimeout(() => { try { b.src.stop(); b.lfo.stop(); } catch { /* gone */ } }, (sec + 1) * 1000);
      this.beds.delete(k);
    }
    for (const k of kinds) {
      if (this.beds.has(k)) continue;
      const a = NOISE[k];
      if (!a) {
        if (EVENTS[k]) this.beds.set(k, { events: true, gain: { gain: { setTargetAtTime() {} } } });
        continue;
      }
      const len = c.sampleRate * 4;
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = this.rand() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = c.createBiquadFilter();
      f.type = a.type;
      f.frequency.value = a.freq;
      f.Q.value = a.q;
      const lfo = c.createOscillator();
      lfo.frequency.value = a.lfo;
      const lg = c.createGain();
      lg.gain.value = a.depth;
      lfo.connect(lg).connect(f.frequency);
      lfo.start();
      const gain = c.createGain();
      gain.gain.value = 0.0001;
      gain.gain.setTargetAtTime(a.vol, t, sec / 3);
      src.connect(f).connect(gain).connect(this.a.amb || this.a.master);
      src.start();
      this.beds.set(k, { src, gain, lfo });
    }
  }

  // now and then, on the score's clock: a bird, a drip, a distant siren, a voice in the crowd, a crackle
  bedEvents(t, dur) {
    const a = this.a;
    const out = a.amb || a.master;
    for (const k of this.beds.keys()) {
      const p = EVENTS[k];
      if (!p || this.rand() > p * dur * 2) continue;
      if (k === 'birds') {
        const f = 2400 + this.rand() * 1800;
        for (let i = 0; i < 3; i++) this.chirp(f * (1 + i * 0.06), t + i * 0.11, out);
      } else if (k === 'drip') a.osc('sine', 1400 + this.rand() * 600, t, 0.08, 0.02, 0.002, 0.07, out);
      else if (k === 'siren') this.siren(t, 0.012, out, 3);
      else if (k === 'fire') a.noise(t, 0.04, { type: 'highpass', from: 3000, to: 5000, vol: 0.03 });
      else if (k === 'walla') this.walla(t, out);
    }
  }

  chirp(f, t, out) {
    const c = this.a.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.07);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.012, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.12);
  }

  siren(t, v, out, dur = 2.4) {
    const c = this.a.ctx;
    const o = c.createOscillator();
    o.type = 'triangle';
    for (let i = 0; i <= dur * 2; i++) o.frequency.setValueAtTime(i % 2 ? 640 : 860, t + i * 0.5);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.4);
    g.gain.setTargetAtTime(0.0001, t + dur, 0.3);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 1.5);
  }

  // a voice in the crowd: one of the place's barks, from the voice pack, far off (-24 dB, low-passed, in the room)
  walla(t, out) {
    const v = this.g.voice;
    const barks = this.rt.wallaLines?.() || [];
    if (!v?.packs?.length || !barks.length) return;
    const [text, id] = barks[Math.floor(this.rand() * barks.length)];
    const plan = v.plan(text, 'CREW', { id });
    const p = plan?.find((x) => x.ref);
    if (!p) return;
    v.clip(p.key, p.ref, p.pack).then((buf) => {
      const c = this.a.ctx;
      const src = c.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = 0.96 + this.rand() * 0.08;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1200;
      const g = c.createGain();
      g.gain.value = 0.063;
      src.connect(lp).connect(g).connect(out);
      if (this.a.reverb) g.connect(this.a.reverb);
      src.start(Math.max(t, c.currentTime + 0.05));
    }).catch(() => {});
  }

  // --- the instruments (built on Synth's osc, noise, pluck, bell and pad) ------------------------------------
  // rev: the held-REVERSE layer reverses the envelopes (swelling attacks, clipped tails)
  piano(f, t, v, dest, rev = false, felt = false) {
    const a = this.a;
    if (rev) {
      a.osc('triangle', f, t, 0.9, v * 0.8, 0.85, 0.04, dest);
      return;
    }
    a.osc('triangle', f, t, 1.8, v, 0.004, felt ? 1.2 : 1.6, dest);
    a.osc('sine', f * 2, t, 0.6, v * (felt ? 0.12 : 0.25), 0.003, 0.5, dest);
  }

  cello(f, t, dur, v, dest, rev = false) {
    const c = this.a.ctx;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, t);
    const vib = c.createOscillator();
    vib.frequency.value = 5.2;
    const vg = c.createGain();
    vg.gain.value = 9;
    vib.connect(vg).connect(o.detune);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const g = c.createGain();
    const atk = rev ? dur * 0.9 : Math.min(0.6, dur * 0.3);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + atk);
    g.gain.setTargetAtTime(0.0001, t + dur, rev ? 0.02 : 0.4);
    o.connect(lp).connect(g).connect(dest);
    o.start(t);
    vib.start(t);
    o.stop(t + dur + 2);
    vib.stop(t + dur + 2);
  }

  glass(f, t, v, dest, rev = false) {
    this.a.osc('sine', f, t, 2.6, v, rev ? 2.2 : 0.3, rev ? 0.05 : 2.2, dest);
    this.a.osc('sine', f * 2.01, t, 1.6, v * 0.3, rev ? 1.4 : 0.2, 1.2, dest);
  }

  metal(f, t, v, dest, rev = false) {
    for (const [r, k] of [[1, 1], [2.76, 0.4], [5.4, 0.18]]) this.a.osc('sine', f * r, t, 3.2, v * k, rev ? 2.8 : 0.9, rev ? 0.05 : 2.4, dest, r === 1 ? 0 : 7);
  }

  drum(t, v, dest) {
    const c = this.a.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(58, t + 0.18);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + 0.45);
  }

  flute(f, t, dur, v, dest) {
    this.a.osc('sine', f, t, dur, v, 0.08, 0.3, dest);
    const c = this.a.ctx;
    const len = Math.floor(c.sampleRate * Math.min(dur, 2));
    const b = c.createBuffer(1, Math.max(1, len), c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (this.rand() * 2 - 1) * Math.sin((Math.PI * i) / len);
    const s = c.createBufferSource();
    s.buffer = b;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f * 2;
    bp.Q.value = 3;
    const g = c.createGain();
    g.gain.value = v * 0.25;
    s.connect(bp).connect(g).connect(dest);
    s.start(t);
  }

  tick(t, v, dest) {
    this.a.osc('square', 2600, t, 0.012, v, 0.001, 0.01, dest);
  }

  // the motif: the Main Theme (piano), the Witness (slower, lower, bowed metal), Mira (reversed tails),
  // the Child (a music box); it stops on an unresolved sus4
  motif(kind, root, t, beat, dest, v = 0.05) {
    const notes = MOTIF.map((s) => root + s);
    if (kind === 'witness') {
      notes.forEach((n, i) => this.metal(mtof(n - 12), t + i * beat * 2, v * 0.9, dest));
      this.a.pad(mtof(root - 12), t + 4 * beat, beat * 6, 0.012);
      this.a.pad(mtof(root - 7), t + 4 * beat, beat * 6, 0.012);
      return;
    }
    notes.forEach((n, i) => {
      if (kind === 'mira') this.piano(mtof(n + 12), t + i * beat, v, dest, true);
      else if (kind === 'child') this.a.bell(mtof(n + 24), t + i * beat, v * 0.8, dest);
      else this.piano(mtof(n + 12), t + i * beat, v, dest);
    });
    // the sus4 it stops on: root, fourth, fifth, held, never resolved
    for (const s of [0, 5, 7]) this.a.pad(mtof(root + s), t + 2 * beat, beat * 5, 0.014);
  }

  // --- the composer: one step of the region's music ----------------------------------------------------------
  step(synth, n, t) {
    const R = this.region || REGIONS.title;
    let tempo = R.tempo;
    if (R.slows && this.rt.g.facts?.get?.('ending')) tempo = R.slows;
    const len = R.free ? (60 / tempo / 2) * (0.75 + this.rand() * 0.6) : 60 / tempo / 2;
    if (!this.layer) this.newLayer(0.5);
    const dest = this.layer || synth.music;
    if (this.silentUntil && t < this.silentUntil) return len;
    if (this.bar0 === null || this.bar0 === undefined) this.bar0 = n;
    const k = n - this.bar0;
    const bar = Math.floor(k / 8), beat = k % 8;
    // the locked city's four bars repeat exactly: the dice are the same every time round
    if (R.repeat && beat === 0 && bar % R.repeat === 0) this.seed = 4242;
    const mode = MODES[R.mode] || MODES.aeolian;
    const deg = R.prog[bar % R.prog.length];
    const note = (d, oct = 0) => R.root + mode[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct);
    const chord = [note(deg), note(deg + 2), note(deg + 4)];
    const rev = !!this.rt.inv?.active;
    const energy = Math.min(1, synth.threat || 0);
    // the war drops a beat every nine bars
    if (R.drop && bar % R.drop === R.drop - 1 && beat === 7) return len;
    let layers = R.layers[this.year] || R.layers.PRESENT || [];
    if (R.loop) layers = [...new Set([...layers, ...R.loop.slice(0, Math.min(R.loop.length, 1 + (this.rt.g.facts?.get?.('loops_seen') || 0)))])];
    if (R.mixed) layers = [...new Set(Object.values(R.layers).flat())].filter((x, i) => (bar + i) % 3 !== 0);
    const v = 0.05 * (R.cold ? 0.8 : 1);
    for (const ins of layers) {
      switch (ins) {
        case 'pad': if (beat === 0) for (const m of chord) synth.pad(mtof(m), t, len * 8.4, 0.016); break;
        case 'strings': if (beat === 0) for (const m of [...chord, chord[0] + 12]) this.cello(mtof(m + 12), t, len * 7.6, 0.012, dest, rev); break;
        case 'piano': if (beat === 0 || (this.rand() < 0.22 + energy * 0.3 && beat % 2 === 0)) this.piano(mtof(chord[Math.floor(this.rand() * 3)] + 12), t, v * 0.9, dest, rev, this.regionKey === 'memory'); break;
        case 'prepared': if (this.rand() < 0.3) { this.piano(mtof(chord[0] + 24 + Math.floor(this.rand() * 3)), t, v * 0.6, dest, rev); synth.noise(t, 0.05, { type: 'highpass', from: 4000, to: 4000, vol: 0.02 }); } break;
        case 'pulse': if (beat % 2 === 0) synth.osc('sine', mtof(chord[0] - 12), t, len * 0.8, 0.035, 0.005, len * 0.6, dest); break;
        case 'ticks': this.tick(t + (this.rand() - 0.5) * len * 0.3 * (1 + bar % 3), 0.012, dest); break;
        case 'bass': if (beat === 0 || (beat === 4 && energy > 0.3)) synth.osc('sine', mtof(chord[0] - 12), t, len * 5, 0.07, 0.04, 0.6, dest); break;
        case 'sub': if (beat === 0 && bar % 2 === 0) synth.osc('sine', mtof(R.root - 24), t, len * 16, 0.06, 1.2, 2.4, dest); break;
        case 'pluck': if (this.rand() < 0.3 + energy * 0.4) synth.pluck(mtof(chord[Math.floor(this.rand() * 3)] + 24), t, 0.045, dest); break;
        case 'bell': if (beat === 6 && this.rand() < 0.5) synth.bell(mtof(chord[1] + 24), t, 0.035, dest); break;
        case 'cello': if (beat === 0 && bar % 2 === 0) this.cello(mtof(chord[0] - 12), t, len * 14, 0.03, dest, rev); break;
        case 'glass': if (beat === 0 || (beat === 4 && this.rand() < 0.4)) this.glass(mtof(chord[Math.floor(this.rand() * 3)] + 24), t, 0.02, dest, rev); break;
        case 'metal': if (beat === 0 && bar % 2 === 1) this.metal(mtof(chord[0]), t, 0.018, dest, rev); break;
        case 'alarm': if (beat === 0 || beat === 1) synth.osc('square', beat ? 880 : 932, t, 0.12, 0.006, 0.005, 0.08, dest); break;
        case 'drum': if (beat === 0 || beat === 3 || (beat === 6 && this.rand() < 0.6)) this.drum(t, beat === 0 ? 0.08 : 0.05, dest); break;
        case 'flute': if (beat === 0 && this.rand() < 0.6) this.flute(mtof(note(deg + Math.floor(this.rand() * 5), 1)), t, len * (2 + Math.floor(this.rand() * 3)), 0.03, dest); break;
        case 'musicbox': if (bar % 4 === 2 && beat === 0) this.motif('child', R.root, t, len, dest, 0.04); break;
        case 'clock': for (const bpm of [60, 72, 90]) { const p = 60 / bpm; const first = Math.ceil(t / p) * p; for (let x = first; x < t + len; x += p) this.tick(x, bpm === 60 ? 0.016 : 0.009, dest); } break;
        case 'beeps': if (beat % 4 === 0) synth.osc('sine', 1000, t, 0.09, 0.012, 0.004, 0.06, dest); break;
        case 'revpad': if (beat === 0 && bar % 2 === 0) for (const m of chord) synth.osc('triangle', mtof(m), t, len * 15, 0.012, len * 14, 0.03, dest); break;
        case 'perc': if (beat % 2 === 0 || this.rand() < energy * 0.5) synth.noise(t, 0.08, { type: 'lowpass', from: beat === 0 ? 200 : 900, to: 120, vol: beat === 0 ? 0.12 : 0.05 }); break;
        case 'ostinato': synth.osc('sawtooth', mtof(R.root + MOTIF[k % 3] + (beat >= 4 ? 7 : 0)), t, len * 0.7, 0.008, 0.01, len * 0.4, dest); break;
        case 'brass': if (beat === 0 && bar % 4 === 0) synth.osc('sawtooth', mtof(chord[0]), t, len * 12, 0.008, 0.8, 1.6, dest); break;
        case 'choir': if (beat === 0) for (const m of chord) synth.osc('sawtooth', mtof(m + 12), t, len * 8, 0.004, 1.2, 1.4, dest, 4); break;
        case 'motif': break;
        default: break;
      }
    }
    // the motif closes a phrase every eight bars (the museum plays other regions' motifs out of order; the
    // liminal places only fragments of it)
    if (bar % 8 === 7 && beat === 0) {
      const kind = R.motif === 'all' ? ['theme', 'witness', 'mira', 'child'][Math.floor(this.rand() * 4)] : R.motif === 'fragments' ? (this.rand() < 0.5 ? 'theme' : 'child') : R.motif;
      this.motif(kind, R.root, t, len, dest);
    }
    this.bedEvents(t, len);
    return len;
  }

  // --- the cues --------------------------------------------------------------------------------------------
  cue(name, o = {}) {
    this.heard.push(name);
    this.cap(name);
    if (!this.ready()) return;
    const a = this.a, c = a.ctx, t = c.currentTime + 0.02;
    const out = a.sfx;
    const R = this.region || REGIONS.title;
    const root = R.root;
    switch (name) {
      case 'title':
        this.title();
        break;
      case 'chapter':
        // a seven-second phrase of the theme and a cello rising under it
        this.motif('theme', 57, t + 0.2, 0.42, out, 0.06);
        this.cello(mtof(33), t, 6.5, 0.05, out);
        this.cello(mtof(40), t + 2.5, 4.5, 0.035, out);
        break;
      case 'card':
        // a reversed swell, the motif in the mission's key, a low resonance
        a.osc('triangle', mtof(root), t, 0.8, 0.05, 0.78, 0.02, out);
        a.noise(t, 0.8, { type: 'bandpass', from: 400, to: 3000, q: 0.7, vol: 0.05 });
        this.motif(R.motif === 'witness' ? 'witness' : R.motif === 'mira' ? 'mira' : 'theme', root, t + 0.85, 0.32, out, 0.055);
        a.osc('sine', mtof(root - 24), t + 0.85, 3.2, 0.12, 0.02, 2.6, out);
        break;
      case 'reveal':
        a.osc('triangle', mtof(root + 12), t, 2.2, 0.04, 0.01, 1.8, out);
        a.osc('triangle', mtof(root + 13), t, 2.2, 0.04, 0.01, 1.8, out);
        this.dropTo(40, t, out);
        this.dropout(0.4);
        break;
      case 'consequence':
        this.metal(mtof(root - 12), t, 0.06, out);
        a.osc('sine', 55, t, 2.4, 0.16, 0.01, 1.8, out);
        this.dropout(0.3);
        break;
      case 'cliff': {
        // a rising cello and ticks that come faster, cut on the fade (cut())
        const g = c.createGain();
        g.connect(out);
        this.cliffBus = g;
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(mtof(root - 12), t);
        o.frequency.exponentialRampToValueAtTime(mtof(root + 3), t + 6);
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 900;
        const og = c.createGain();
        og.gain.setValueAtTime(0.0001, t);
        og.gain.linearRampToValueAtTime(0.05, t + 4);
        o.connect(lp).connect(og).connect(g);
        o.start(t);
        o.stop(t + 9);
        let x = t, gap = 0.6;
        while (x < t + 8) { this.tick(x, 0.02, g); x += gap; gap = Math.max(0.08, gap * 0.88); }
        break;
      }
      case 'zero':
        // the ticks stop; one second of silence under the narration (the voices go on); the resonance;
        // then the 41: its horn going by, its brakes, the impact
        this.silentUntil = t + 1;
        a.silence(1.0);
        this.horn(t + 1.1, out);
        a.noise(t + 1.6, 1.6, { type: 'bandpass', from: 3800, to: 2400, q: 6, vol: 0.06 });
        this.impact(t + 2.9, out);
        break;
      case 'fracture':
        a.noise(t, 1.2, { type: 'highpass', from: 200, to: 6000, q: 0.5, vol: 0.08 });
        this.silentUntil = t + 2.0;
        a.silence(0.8);
        for (let i = 0; i < 12; i++) a.pluck(mtof(root + 36 - i * 3), t + 2.0 + i * 0.05, 0.04, out);
        this.impact(t + 2.7, out, 0.5);
        break;
      case 'pin':
        a.bell(mtof(84), t, 0.05, out);
        a.bell(mtof(91), t + 0.12, 0.05, out);
        break;
      case 'echoStep':
        a.noise(t, 0.6, { type: 'bandpass', from: 600, to: 4800, q: 1.2, vol: 0.08 });
        this.motif('mira', root, t + 0.3, 0.12, out, 0.035);
        break;
      case 'reverse':
        if (o.release) { a.noise(t, 0.12, { type: 'highpass', from: 5000, to: 1200, vol: 0.08 }); a.osc('sine', mtof(root), t, 0.3, 0.05, 0.002, 0.2, out); } else a.osc('triangle', mtof(root + 12), t, 1.2, 0.03, 1.1, 0.03, out);
        break;
      case 'loopReset':
        a.noise(t, 0.9, { type: 'bandpass', from: 3000, to: 200, q: 2, vol: 0.08 });
        this.siren(t + 0.6, 0.02, out, 2.4);
        this.loops++;
        break;
      case 'pa':
        // the station chime: two tones
        a.bell(mtof(76), t, 0.07, out);
        a.bell(mtof(72), t + 0.42, 0.07, out);
        break;
      case 'ending:A':
        // the only full major cadence in the game: IV, V, I
        [[53, 57, 60, 65], [55, 59, 62, 67], [48, 52, 55, 60, 64, 72]].forEach((ch, i) => {
          for (const m of ch) this.cello(mtof(m), t + 1.2 + i * 1.6, i === 2 ? 6 : 1.7, 0.02, out);
          this.piano(mtof(ch[ch.length - 1] + 12), t + 1.2 + i * 1.6, 0.06, out);
        });
        break;
      case 'ending:B':
        // the motif in two keys at once, never agreeing
        this.motif('theme', 57, t + 1.2, 0.5, out, 0.05);
        this.motif('theme', 63, t + 1.2, 0.5, out, 0.04);
        this.motif('witness', 50, t + 4.2, 0.6, out, 0.04);
        break;
      case 'ending:C':
        // piano and cello, a bloom of strings, one breath of silence, one note
        this.motif('theme', 57, t + 1.2, 0.6, out, 0.05);
        this.cello(mtof(45), t + 1.2, 5, 0.05, out);
        for (const m of [57, 60, 64, 69]) this.cello(mtof(m + 12), t + 3.5, 4.5, 0.014, out);
        this.silentUntil = t + 9.5;
        this.piano(mtof(69), t + 10, 0.05, out);
        break;
      case 'postcredit':
        for (let i = 0; i < 4; i++) this.tick(t + i, 0.05, out);
        break;
      default:
        break;
    }
  }

  // the cliff's ticks and cello stop on the fade
  cut() {
    const g = this.cliffBus;
    if (!g || !this.ready()) return;
    g.gain.setTargetAtTime(0.0001, this.a.ctx.currentTime, 0.02);
    setTimeout(() => g.disconnect(), 400);
    this.cliffBus = null;
  }

  // the music drops out for a moment
  dropout(sec) {
    const t = this.a.ctx.currentTime;
    const g = this.layer?.gain;
    if (!g) return;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(0.0001, t, 0.02);
    g.setTargetAtTime(1, t + sec, 0.1);
  }

  dropTo(hz, t, out) {
    const o = this.a.ctx.createOscillator();
    const g = this.a.ctx.createGain();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(hz, t + 0.6);
    g.gain.setValueAtTime(0.18, t);
    g.gain.setTargetAtTime(0.0001, t + 0.8, 0.5);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 3);
  }

  horn(t, out) {
    const c = this.a.ctx;
    for (const f0 of [311, 370]) {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0 * 1.06, t);
      o.frequency.linearRampToValueAtTime(f0 * 0.94, t + 1.4); // it goes by
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1400;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.03, t + 0.3);
      g.gain.setTargetAtTime(0.0001, t + 1.2, 0.2);
      o.connect(lp).connect(g).connect(out);
      o.start(t);
      o.stop(t + 2.2);
    }
  }

  impact(t, out, v = 1) {
    this.a.osc('sine', 48, t, 1.6, 0.3 * v, 0.004, 1.4, out);
    this.a.noise(t, 0.6, { type: 'lowpass', from: 1800, to: 120, vol: 0.2 * v });
  }
}

