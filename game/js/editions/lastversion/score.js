// THE LAST VERSION OF EARTH: the score (OVERHAUL.md §8.9; the bible §6 and §7). Written music played live: the
// themes the bible names are written out note for note in themes.js (melody, harmony, form), and this plays them
// through Synth's composer hook (0 bytes of assets) in each mission's region: its key, tempo and instruments, with
// a layer per year. It also plays the cues of the story's moments, runs the ambience beds of each place and year,
// keeps the player's mix (Dialogue, Music, Effects, Ambience, Sound captions) and shows TAP FOR SOUND until the
// first tap has woken the sound up.
//
//   THEMES   themes.js: the Main Theme (the title, the CASE FILES), a theme per act (the Prologue: Kai's; Act I: the
//            Past; Act II: the Nine-Minute War; Act III: 2196; Act IV: the Unwritten Second; the Finale: the Final
//            Choice) and the characters' (Mira's in Missions 11 and 20, the Witness's in 12, 17 and 21); Mission 16's
//            museum plays the other themes' first phrases out of order. All of them grow from the MOTIF.
//   MOTIF    the bible's three notes, also the Child's song: up a fourth, up a fourth, and it stops on an
//            unresolved sus4 (motif(): the Main Theme on piano, the Witness slower and lower on bowed metal,
//            Mira with reversed tails, the Child on a music box).
//   REGIONS  each mission's place: tempo, key, the instrument that carries the tune in each year (lead) and what
//            plays under it (layers), crossfading over 1.5 s when the year changes. The same tune is heard in each
//            year of a place, on other instruments (the bible §7: a place sounds different in each era and keeps
//            a motif you know it by).
//   CUES     the story's moments: chapter (the act's theme), card (the mission's theme), reveal, consequence (not
//            music: a low metallic ring and a dropout), cliff, zero, fracture, pin, echoStep, reverse, loopReset, pa,
//            ending:A / B / C, postcredit.
//   BEDS     what a place sounds like in each year (rain, traffic, walla, wind, water, birds, ...).
import { THEMES, MUSEUM, MOTIF as THE_MOTIF, missionTheme, section, head, ACT_THEME, ENDING_A } from './themes.js';

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const MOTIF = THE_MOTIF; // semitones: up a fourth, up a fourth (it stops there, over a sus4)

// a region's music: tempo, the key its tune is played in (root), the instrument that carries the tune in each year
// (lead) and what plays under it (layers: harmony, bass and texture, by role; see Score.accompany)
export const REGIONS = {
  title: { tempo: 78, root: 57, lead: { PRESENT: 'piano' }, layers: { PRESENT: ['cello', 'choir', 'strings'] } },
  rain_city: { tempo: 92, root: 57, lead: { PRESENT: 'piano', PAST: 'pluck', FUTURE: 'strings' },
    layers: { PRESENT: ['pulse', 'ticks', 'bass', 'strings'], PAST: ['pad', 'bass', 'bell'], FUTURE: ['glass', 'sub', 'pad'] } },
  helix: { tempo: 84, root: 50, lead: { PRESENT: 'piano', PAST: 'pluck', FUTURE: 'glass' },
    layers: { PRESENT: ['metal', 'alarm', 'sub', 'pad', 'ticks'], PAST: ['pad', 'pulse', 'bass'], FUTURE: ['strings', 'metal', 'sub'] } },
  settlement: { tempo: 82, root: 52, lead: { PRESENT: 'flute', PAST: 'flute', FUTURE: 'glass' },
    layers: { PRESENT: ['drum', 'pluck', 'bass'], PAST: ['drum', 'pluck', 'bass', 'pad'], FUTURE: ['pad', 'sub'] } },
  clockmaker: { tempo: 72, root: 55, lead: { PRESENT: 'piano', PAST: 'pluck', FUTURE: 'glass' },
    layers: { PRESENT: ['clock', 'musicbox', 'pad'], PAST: ['clock', 'musicbox', 'bass'], FUTURE: ['clock', 'sub'] } },
  observatory: { tempo: 60, root: 53, lead: { PRESENT: 'glass', PAST: 'flute', FUTURE: 'strings' },
    layers: { PRESENT: ['cello', 'pad'], PAST: ['glass', 'cello', 'drum'], FUTURE: ['glass', 'sub'] } },
  loop_city: { tempo: 118, root: 57, loop: ['pulse', 'piano', 'perc', 'strings', 'choir'], lead: { PRESENT: 'strings', PAST: 'pluck', FUTURE: 'glass' },
    layers: { PRESENT: ['bass', 'ostinato'], PAST: ['bass', 'ostinato'], FUTURE: ['bass', 'glass'] } },
  detention: { tempo: 100, root: 52, lead: { PRESENT: 'cello', PAST: 'pluck', FUTURE: 'glass' },
    layers: { PRESENT: ['perc', 'ostinato', 'sub'], PAST: ['ostinato', 'bass'], FUTURE: ['ostinato', 'sub'] } },
  hospital: { tempo: 64, root: 60, lead: { PRESENT: 'piano', PAST: 'piano', FUTURE: 'flute' },
    layers: { PRESENT: ['beeps', 'revpad', 'cello'], PAST: ['beeps', 'pad', 'cello'], FUTURE: ['revpad', 'glass'] } },
  war: { tempo: 118, root: 50, drop: 9, lead: { PRESENT: 'strings', PAST: 'pluck', FUTURE: 'brass' },
    layers: { PRESENT: ['perc', 'ostinato', 'bass', 'brass'], PAST: ['perc', 'ostinato', 'bass'], FUTURE: ['perc', 'ostinato', 'strings'] } },
  city2196: { tempo: 70, root: 53, lead: { PRESENT: 'strings', PAST: 'piano', FUTURE: 'strings' },
    layers: { PRESENT: ['piano', 'sub', 'pad'], PAST: ['strings', 'pluck', 'bass'], FUTURE: ['brass', 'pad', 'glass'] } },
  locked_city: { tempo: 70, root: 53, repeat: 4, lead: { PRESENT: 'strings', PAST: 'pluck', FUTURE: 'strings' },
    layers: { PRESENT: ['piano', 'pad'], PAST: ['strings', 'bass'], FUTURE: ['brass', 'pad'] } },
  museum: { tempo: 66, root: 55, free: true, lead: { PRESENT: 'prepared' },
    layers: { PRESENT: ['glass', 'pad'], PAST: ['glass', 'pad', 'pluck'], FUTURE: ['glass', 'pad', 'strings'] } },
  archive: { tempo: 54, root: 45, irregular: true, lead: { PRESENT: 'cello', PAST: 'cello', FUTURE: 'metal' },
    layers: { PRESENT: ['metal', 'sub', 'pulse'], PAST: ['metal', 'pad'], FUTURE: ['glass', 'sub'] } },
  fracture: { tempo: 76, root: 50, mixed: true, lead: { PRESENT: 'piano', PAST: 'flute', FUTURE: 'strings' },
    layers: { PRESENT: ['pulse', 'sub'], PAST: ['drum', 'sub'], FUTURE: ['brass', 'sub'] } },
  liminal: { tempo: 48, root: 50, free: true, lead: { PRESENT: 'glass', PAST: 'flute', FUTURE: 'strings' },
    layers: { PRESENT: ['sub', 'prepared'], PAST: ['sub', 'glass'], FUTURE: ['sub', 'glass'] } },
  memory: { tempo: 64, root: 57, lead: { PRESENT: 'piano', PAST: 'piano', FUTURE: 'flute' },
    layers: { PRESENT: ['cello', 'pad'], PAST: ['cello', 'musicbox'], FUTURE: ['cello', 'strings'] } },
  command: { tempo: 110, root: 48, cold: true, irregular: true, lead: { PRESENT: 'metal', PAST: 'cello', FUTURE: 'strings' },
    layers: { PRESENT: ['perc', 'ostinato', 'bass', 'pulse'], PAST: ['perc', 'ostinato', 'bass'], FUTURE: ['ostinato', 'metal', 'sub'] } },
  finale: { tempo: 62, root: 57, slows: 54, lead: { PRESENT: 'piano', PAST: 'piano', FUTURE: 'piano' },
    layers: { PRESENT: ['cello', 'pad'], PAST: ['cello', 'flute'], FUTURE: ['cello', 'strings'] } },
};
// where an instrument plays the tune: [lowest, highest] MIDI note (a theme is moved by octaves to sit in it)
const RANGE = { piano: [57, 86], flute: [64, 93], strings: [55, 84], cello: [41, 67], glass: [72, 98], musicbox: [76, 100], bell: [72, 96],
  pluck: [62, 88], metal: [43, 70], brass: [50, 74], prepared: [62, 90] };
// the instrument an act's theme is announced on (the chapter card)
const SIGNATURE = { kai: 'piano', past: 'flute', war: 'strings', c2196: 'strings', unwritten: 'glass', final: 'piano', main: 'piano', mira: 'piano', witness: 'cello' };
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
// the cues that are music (the Music row sets their level); the rest are sound effects (the Effects row)
const MUSIC_CUES = new Set(['chapter', 'card', 'reveal', 'consequence', 'cliff', 'ending:A', 'ending:B', 'ending:C']);
// four seconds of white noise, made once per audio context: the beds, the score's noise hits and the flute's
// breath all play windows of it (a fresh buffer for each bed, hit and note was a main-thread fill and a GC hitch)
const NOISE_BUFS = new WeakMap();
const NOISE_SEC = 4;
function noiseBuffer(c) {
  let b = NOISE_BUFS.get(c);
  if (!b) {
    const len = Math.max(1, Math.floor(c.sampleRate * NOISE_SEC));
    b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    let s = 22222;
    for (let i = 0; i < len; i++) d[i] = ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;
    NOISE_BUFS.set(c, b);
  }
  return b;
}
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
    this.themeKey = 'main'; // the theme playing (themes.js), and where in its form (cur)
    this.cur = null;
    this.bars = 0;
    this.played = []; // the tune's last notes: { theme, sec, bar, p, midi, ins, t } (the tests, the bots and tools/score-render.mjs read it)
    this.quotes = []; // what each cue quoted: { cue, theme }
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
    if (this.cues) this.cues.gain.value = this.cueLevel();
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
    this.setTheme('main');
    this.setBeds([]);
  }

  // a mission's music and beds, in the place's year
  enter(deck, year = 'PRESENT', level = null) {
    this.deck = deck;
    this.level = level;
    this.loops = 0;
    this.bars = 0;
    this.setRegion(deck.music || MISSION_REGION[deck.mkey || deck.key] || 'rain_city');
    this.setTheme(deck.theme || missionTheme(deck.mkey || deck.key));
    this.setYear(year, true);
  }

  // the theme a place plays (themes.js): it starts again from the top of its form
  setTheme(key) {
    if (this.themeKey === key && this.cur) return;
    this.themeKey = (THEMES[key] || key === 'museum') ? key : 'main';
    this.cur = null;
  }

  setRegion(key) {
    if (this.regionKey === key && this.region) return;
    this.regionKey = key;
    this.region = REGIONS[key] || REGIONS.rain_city;
    this.cur = null;
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
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c);
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
      src.start(t, this.rand() * NOISE_SEC); // (each bed its own stretch of the noise)
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
      else if (k === 'fire') this.noise(t, 0.04, { type: 'highpass', from: 3000, to: 5000, vol: 0.03 }, out);
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

  cello(f, t, dur, v, dest, rev = false, cutoff = 900, detune = 0, attack = null) {
    const c = this.a.ctx;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, t);
    o.detune.value = detune;
    const vib = c.createOscillator();
    vib.frequency.value = 5.2;
    const vg = c.createGain();
    vg.gain.value = 9;
    vib.connect(vg).connect(o.detune);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cutoff;
    const g = c.createGain();
    const atk = rev ? dur * 0.9 : attack ?? Math.min(0.6, dur * 0.3);
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
    // the breath: a band of the noise, swelling and fading over the note's first two seconds
    this.noise(t, Math.min(dur, 2), { type: 'bandpass', from: f * 2, to: f * 2, q: 3, vol: v * 0.25 }, dest);
  }

  // a burst of noise through a filter sweep, rising and falling over its length (Synth.noise, which always plays on the
  // effects bus and makes a buffer each time; this one plays where it is sent, from the shared noise)
  noise(t, dur, { type = 'bandpass', from = 800, to = 800, q = 1, vol = 0.1 } = {}, dest = this.a.sfx) {
    const c = this.a.ctx;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    const f = c.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + dur / 2);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, this.rand() * Math.max(0, NOISE_SEC - dur), dur);
  }

  // the music cues' own bus: at the Music row's level (at the default mix, the level they had on the effects bus),
  // into the master and the reverb (not the score's layer: the duck and the music's low-pass would change them)
  cueLevel() {
    return this.a.mix?.music ?? 0.8;
  }

  cueBus() {
    const a = this.a;
    if (!this.cues) {
      this.cues = a.ctx.createGain();
      this.cues.connect(a.master);
      if (a.reverb) this.cues.connect(a.reverb);
    }
    this.cues.gain.value = this.cueLevel();
    return this.cues;
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

  // more instruments: bowed strings (an ensemble of two, slightly apart), distant brass that opens as it swells, a
  // wordless choir-like texture, a music box, and an impact played backwards (the war's gaps)
  strings(f, t, dur, v, dest, rev = false, attack = null) {
    this.cello(f, t, dur, v * 0.6, dest, rev, 1700, -5, attack);
    this.cello(f, t, dur, v * 0.6, dest, rev, 1700, 6, attack);
  }

  brass(f, t, dur, v, dest) {
    const c = this.a.ctx;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, t);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(300, t);
    lp.frequency.linearRampToValueAtTime(1300, t + Math.min(1.2, dur * 0.5));
    lp.frequency.setTargetAtTime(500, t + dur * 0.7, 0.4);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + Math.min(0.9, dur * 0.4));
    g.gain.setTargetAtTime(0.0001, t + dur, 0.35);
    o.connect(lp).connect(g).connect(dest);
    if (this.a.reverb) g.connect(this.a.reverb); // (distant: more of it in the room)
    o.start(t);
    o.stop(t + dur + 1.8);
  }

  choir(f, t, dur, v, dest) {
    const c = this.a.ctx;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + Math.min(1.6, dur * 0.4));
    g.gain.setTargetAtTime(0.0001, t + dur, 0.6);
    bp.connect(g).connect(dest);
    for (const d of [-7, 0, 8]) {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t);
      o.detune.value = d;
      o.connect(bp);
      o.start(t);
      o.stop(t + dur + 2.2);
    }
  }

  musicbox(f, t, v, dest) {
    this.a.bell(f, t, v, dest);
    this.a.osc('sine', f * 4.02, t, 0.15, v * 0.15, 0.001, 0.12, dest);
  }

  revImpact(t, dur, dest) {
    this.noise(t, dur, { type: 'lowpass', from: 200, to: 2400, vol: 0.06 }, dest);
    this.a.osc('sine', 52, t, dur, 0.12, dur * 0.95, 0.03, dest);
  }

  // --- the composer: one step (an eighth) of the theme, in the region's key, tempo and instruments --------------------
  // the sections to play, in order: the theme's form; the museum's exhibits (each theme's first phrase, then a
  // breath); the locked city's first four bars, over and over, until tomorrow is let in
  planFor(R) {
    const locked = !!(R.repeat && !this.rt.g.facts?.get?.('city_freed'));
    const key = `${this.themeKey}|${locked}`;
    if (this.planKey === key) return this.plan;
    this.planKey = key;
    if (this.themeKey === 'museum') {
      const breath = section('main', 'breath');
      this.plan = MUSEUM.flatMap((k) => [section(k, THEMES[k].form.find((x) => section(k, x).bars.some((b) => b.notes.length))), breath]);
    } else {
      const th = THEMES[this.themeKey] || THEMES.main;
      this.plan = th.form.map((x) => section(this.themeKey, x));
      if (locked) {
        const A = this.plan.find((x) => x.bars.some((b) => b.notes.length));
        this.plan = [{ ...A, key: `${A.key}:locked`, bars: A.bars.slice(0, R.repeat) }];
      }
    }
    this.cur = null;
    return this.plan;
  }

  // where the next eighth is in the form, then one eighth on: { sec, bar, bi, beat, newBar, top (the form begins) }
  advance(R) {
    const plan = this.planFor(R);
    if (!this.cur) this.cur = { pi: 0, bi: 0, beat: 0 };
    const c = this.cur;
    const sec = plan[c.pi % plan.length];
    const bar = sec.bars[c.bi % sec.bars.length];
    const pos = { sec, bar, bi: c.bi, beat: c.beat, newBar: c.beat === 0, top: c.pi === 0 && c.bi === 0 && c.beat === 0 };
    if (pos.newBar) this.bars++;
    if (++c.beat >= bar.len) {
      c.beat = 0;
      if (++c.bi >= sec.bars.length) {
        c.bi = 0;
        c.pi = (c.pi + 1) % plan.length;
      }
    }
    return pos;
  }

  // the octave a theme sits in on an instrument: its notes' middle near the middle of the instrument's range
  octave(ins, root) {
    const k = `${this.themeKey}|${ins}|${root}`;
    this.octaves ||= new Map();
    if (this.octaves.has(k)) return this.octaves.get(k);
    const ps = this.plan.flatMap((x) => x.bars.flatMap((b) => b.notes.map((n) => n.p))).sort((a, b) => a - b);
    const mid = ps.length ? ps[Math.floor(ps.length / 2)] : 12;
    const [lo, hi] = RANGE[ins] || RANGE.piano;
    const shift = 12 * Math.round(((lo + hi) / 2 - (root + mid)) / 12);
    this.octaves.set(k, shift);
    return shift;
  }

  // a chord, voiced from the tonic: its bass and its upper notes placed between C3 and C6
  voicing(chord, root) {
    let bass = root - 12 + chord[0];
    while (bass > 52) bass -= 12;
    while (bass < 33) bass += 12;
    let up = chord.slice(1).map((v) => root + v);
    while (up.length && Math.min(...up) < 48) up = up.map((m) => m + 12);
    while (up.length && Math.max(...up) > 84) up = up.map((m) => m - 12);
    return { bass, up };
  }

  // one note of the tune on an instrument
  lead(ins, m, t, dur, v, dest, rev) {
    const f = mtof(m);
    switch (ins) {
      case 'flute': this.flute(f, t, dur, v * 0.75, dest); break;
      // (the tune on strings is bowed with a quick attack and sits over its chords: tools/score-render.mjs found it heard as
      // the strongest pitch at a quarter of its notes when it swelled in at the accompaniment's level)
      case 'strings': this.strings(f, t, dur, v * 0.75, dest, rev, Math.min(0.1, dur * 0.25)); break;
      case 'cello': this.cello(f, t, dur, v * 0.75, dest, rev); break;
      case 'glass': this.glass(f, t, v * 0.5, dest, rev); break;
      case 'metal': this.metal(f, t, v * 0.5, dest, rev); break;
      case 'brass': this.brass(f, t, dur, v * 0.22, dest); break;
      case 'pluck': this.a.pluck(f, t, v * 0.9, dest); break;
      case 'bell': this.a.bell(f, t, v * 0.7, dest); break;
      case 'musicbox': this.musicbox(f, t, v * 0.6, dest); break;
      case 'prepared': this.piano(f, t, v * 0.8, dest, rev); this.noise(t, 0.05, { type: 'highpass', from: 4000, to: 4000, vol: v * 0.3 }, dest); break;
      default: this.piano(f, t, v, dest, rev, this.themeKey === 'mira'); break;
    }
  }

  step(synth, n, t) {
    const R = this.region || REGIONS.title;
    let tempo = R.tempo;
    if (R.slows && this.rt.g.facts?.get?.('ending')) tempo = R.slows;
    const e8 = 60 / tempo / 2;
    const len = R.free ? e8 * (0.8 + this.rand() * 0.5) : e8;
    if (!this.layer) this.newLayer(0.5);
    const dest = this.layer || synth.music;
    if (this.silentUntil && t < this.silentUntil) return len;
    const pos = this.advance(R);
    const { sec, bar, bi, beat } = pos;
    // the locked city's four bars: the dice are the same every time round, until tomorrow is let in
    if (R.repeat && pos.top) this.seed = 4242;
    // the war drops a beat every nine bars
    if (R.drop && this.bars % R.drop === R.drop - 1 && beat === bar.len - 1) return len;
    const year = R.mixed ? ['PRESENT', 'PAST', 'FUTURE'][this.bars % 3] : this.year;
    let ins = R.lead?.[year] || R.lead?.PRESENT || 'piano';
    if (sec.flute && ins === 'piano') ins = 'flute'; // (Mira's second phrase: a breathy woodwind takes the tune)
    if (this.themeKey === 'museum') ins = 'prepared';
    let layers = R.layers[year] || R.layers.PRESENT || [];
    if (R.loop) layers = [...new Set([...layers, ...R.loop.slice(0, Math.min(R.loop.length, 1 + (this.rt.g.facts?.get?.('loops_seen') || 0)))])];
    if (R.mixed) layers = [...new Set(Object.values(R.layers).flat())].filter((x, i) => (this.bars + i) % 3 !== 0);
    if (sec.reduced) layers = ['cello']; // (the Final Choice begins as the Main Theme on piano and cello alone)
    else if (sec.bloom && !layers.includes('strings') && ins !== 'strings') layers = [...layers, 'strings'];
    if (sec.brass && !layers.includes('brass')) layers = [...layers, 'brass'];
    layers = layers.filter((x) => x !== ins);
    const rev = !!this.rt.inv?.active;
    const energy = Math.min(1, synth.threat || 0);
    const v = 0.05 * (R.cold ? 0.8 : 1) * (0.55 + 0.45 * sec.dyn);
    const barSec = e8 * bar.len;
    const root = R.root;
    // the war's gap: nothing, and an impact played backwards into the next downbeat
    if (bar.gap) {
      if (beat === bar.len - 2) this.revImpact(t, len * 2, dest);
      this.bedEvents(t, len);
      return len;
    }
    // the tune
    for (const nt of bar.notes) {
      if (nt.at !== beat) continue;
      const m = root + nt.p + this.octave(ins, root);
      // (a little give in the hands: physical, not on the grid)
      const lt = t + (ins === 'piano' || ins === 'pluck' || ins === 'prepared' ? (this.rand() - 0.5) * 0.012 : 0);
      const accent = beat === 0 ? 1.08 : 1;
      this.lead(ins, m, lt, Math.max(len, nt.d * e8 * 0.98), v * accent, dest, rev);
      if (sec.brass && ins !== 'brass') this.brass(mtof(m - 12), t, nt.d * e8, v * 0.12, dest); // (2196: the brass carries it too)
      this.played.push({ theme: sec.theme, sec: sec.key, bar: bi, p: nt.p, midi: m, ins, t: lt });
      if (this.played.length > 256) this.played.shift();
    }
    // what plays under it
    if (bar.chord) this.accompany(layers, { t, sec, bar, bi, beat, len, barSec, root, dest, v, energy, rev, synth, irregular: !!R.irregular });
    this.bedEvents(t, len);
    return len;
  }

  // the layers under the tune, by role: harmony (pad, strings, choir, brass, revpad, flute), bass (bass, cello, sub),
  // figures from the chord (piano, pluck, glass, bell, prepared, musicbox) and texture (pulse, ticks, perc, drum,
  // ostinato, alarm, beeps, clock, metal)
  accompany(layers, o) {
    const { t: when, sec, bar, bi, beat, len, barSec, root, dest, v, energy, rev, synth } = o;
    const { bass, up } = this.voicing(bar.chord, root);
    // a figure's note from the chord, by index (wrapped): a chord of two notes has one above its bass, and the glass's
    // second note read up[-1], undefined, a non-finite frequency that threw in Act IV (v2.1.1 playtest L45); a chord of
    // its bass alone plays the figures an octave over it
    const at = (i) => (up.length ? up[((i % up.length) + up.length) % up.length] : bass + 12);
    const k = bar.len;
    const grow = sec.bloom ? 0.35 + 0.65 * Math.min(1, (bi + 1) / sec.bars.length) : 1; // (strings that slowly widen)
    for (const ins of layers) {
      switch (ins) {
        case 'pad': if (beat === 0) for (const m of up) { this.a.osc('triangle', mtof(m), when, barSec * 1.05, 0.012, Math.min(1.2, barSec * 0.3), Math.min(1.6, barSec * 0.4), dest, -6); this.a.osc('sine', mtof(m), when, barSec * 1.05, 0.01, Math.min(1.2, barSec * 0.3), Math.min(1.6, barSec * 0.4), dest, 6); } break;
        case 'strings': if (beat === 0) for (const m of up) this.strings(mtof(m), when, barSec * 0.98, 0.016 * grow, dest, rev); break;
        case 'choir': if (beat === 0 && bi % 2 === 0) for (const m of up.slice(0, 3)) this.choir(mtof(m), when, barSec * 1.9, 0.0045, dest); break;
        case 'brass': if (beat === 0 && bi % 2 === 0) for (const m of [bass + 12, bass + 19]) this.brass(mtof(m), when, barSec * 1.6, 0.007, dest); break;
        case 'revpad': if (beat === 0 && bi % 2 === 0) for (const m of up) this.a.osc('triangle', mtof(m), when, barSec * 1.9, 0.011, barSec * 1.8, 0.03, dest); break;
        case 'flute': if (beat === 0 && bi % 2 === 1) this.flute(mtof(at(up.length - 1) + 12), when, barSec * 0.9, 0.018, dest); break;
        case 'bass': if (beat === 0 || (beat === 4 && energy > 0.3)) this.a.osc('sine', mtof(bass), when, len * (beat ? 3 : 5), 0.07, 0.04, 0.6, dest); break;
        case 'cello': if (beat === 0) this.cello(mtof(bass + (bass < 40 ? 12 : 0)), when, barSec * 0.97, sec.reduced ? 0.034 : 0.028, dest, rev); break;
        case 'sub': if (beat === 0 && bi % 2 === 0) this.a.osc('sine', mtof(root - 24), when, barSec * 2, 0.06, 1.2, 2.4, dest); break;
        case 'piano': if (beat === 0 || beat === 3 || beat === 6) this.piano(mtof(at([0, 1, 2][beat / 3]) + 12), when, v * 0.55, dest, rev); break;
        case 'pluck': if ([0, 2, 3, 5, 6].includes(beat)) this.a.pluck(mtof(at([0, 1, 2, 1, 2][[0, 2, 3, 5, 6].indexOf(beat)]) + 12), when, 0.032 + energy * 0.012, dest); break;
        case 'glass': if (beat === 0 || beat === 4) this.glass(mtof(at(up.length - 1 - (beat ? 1 : 0)) + 12), when, 0.014, dest, rev); break;
        case 'bell': if (beat === 6 && bi % 2 === 1) this.a.bell(mtof(at(1) + 24), when, 0.028, dest); break;
        case 'prepared': if ((beat === 1 || beat === 5) && bi % 2 === 0) { this.piano(mtof(at(up.length - 1) + 12), when, v * 0.4, dest, rev); this.noise(when, 0.05, { type: 'highpass', from: 4000, to: 4000, vol: 0.016 }, dest); } break;
        case 'musicbox': if (bi % 4 === 2 && beat === 0) MOTIF.forEach((s, i) => this.musicbox(mtof(bass + 36 + s), when + i * len * 2, 0.03, dest)); break;
        case 'pulse': {
          // (the Witness's pulse is irregular: three beats in a bar, never the same two bars running)
          const hit = o.irregular ? (bi % 2 ? [0, 3, 5] : [0, 2, 6]).includes(beat) : beat % 2 === 0;
          if (hit) this.a.osc('sine', mtof(bass + 12), when, len * 0.8, 0.032, 0.005, len * 0.6, dest);
          break;
        }
        case 'ticks': {
          // (Kai's ticking drifts off the grid as a section goes on, and is put right when the next begins)
          const drift = Math.sin(beat * 1.7 + bi * 0.9) * len * 0.3 * Math.min(1, bi / Math.max(1, sec.bars.length - 1));
          this.tick(when + drift, 0.011, dest);
          break;
        }
        case 'perc': {
          // a 4/4 bar: low on 1 and 3, a snap on 2 and 4, a tick between; a 7/8 bar falls 2 + 2 + 3
          const low = k === 7 ? [0, 4] : [0, 4], snap = k === 7 ? [2] : [2, 6];
          if (low.includes(beat)) this.noise(when, 0.09, { type: 'lowpass', from: 220, to: 110, vol: 0.12 }, dest);
          else if (snap.includes(beat)) this.noise(when, 0.07, { type: 'bandpass', from: 1800, to: 900, q: 1.2, vol: 0.05 }, dest);
          else if (this.rand() < 0.5 + energy * 0.4) this.noise(when, 0.03, { type: 'highpass', from: 6000, to: 6000, vol: 0.018 }, dest);
          break;
        }
        case 'drum': if (beat === 0 || beat === 3 || beat === 6 || (beat === 5 && bi % 2)) this.drum(when, beat === 0 ? 0.08 : beat === 5 ? 0.03 : 0.05, dest); break;
        case 'ostinato': synth.osc('sawtooth', mtof(bass + 24 + MOTIF[beat % 3] + (beat >= 4 ? 7 : 0)), when, len * 0.7, 0.008, 0.01, len * 0.4, dest); break;
        case 'alarm': if (bi % 2 === 0 && (beat === 0 || beat === 1)) synth.osc('square', beat ? 880 : 932, when, 0.12, 0.006, 0.005, 0.08, dest); break;
        case 'beeps': if (beat === 0 || beat === 4) synth.osc('sine', 1000, when, 0.09, 0.012, 0.004, 0.06, dest); break;
        case 'clock': for (const bpm of [60, 72, 90]) { const p = 60 / bpm; const first = Math.ceil(when / p) * p; for (let x = first; x < when + len; x += p) this.tick(x, bpm === 60 ? 0.016 : 0.009, dest); } break;
        case 'metal': if (beat === 0 && bi % 2 === 1) this.metal(mtof(bass + 12), when, 0.018, dest, rev); break;
        default: break;
      }
    }
  }

  // a theme's bars played once, as a cue: the tune on an instrument, its chords under it (on strings, a pad, or
  // none) and its bass on the cello, at a tempo, in a key; -> its length in seconds
  phrase(bars, { root, tempo, ins = 'piano', chords = 'strings', t, out, v = 0.05, bass = true, theme = null }) {
    const e8 = 60 / tempo / 2;
    const ps = bars.flatMap((b) => b.notes.map((n) => n.p)).sort((x, y) => x - y);
    const mid = ps.length ? ps[Math.floor(ps.length / 2)] : 12;
    const [lo, hi] = RANGE[ins] || RANGE.piano;
    const shift = 12 * Math.round(((lo + hi) / 2 - (root + mid)) / 12);
    let x = t;
    for (const b of bars) {
      const barSec = e8 * b.len;
      if (b.chord) {
        const { bass: bs, up } = this.voicing(b.chord, root);
        if (chords === 'strings') for (const m of up) this.strings(mtof(m), x, barSec, 0.014, out);
        else if (chords === 'pad') for (const m of up) this.a.osc('triangle', mtof(m), x, barSec, 0.01, Math.min(0.6, barSec * 0.3), 1, out);
        if (bass) this.cello(mtof(bs + (bs < 40 ? 12 : 0)), x, barSec, 0.03, out);
      }
      for (const n of b.notes) {
        this.lead(ins, root + n.p + shift, x + n.at * e8, n.d * e8, v, out);
        this.played.push({ theme: theme || 'cue', sec: 'cue', bar: 0, p: n.p, midi: root + n.p + shift, ins, cue: true, t: x + n.at * e8 });
      }
      x += barSec;
    }
    if (this.played.length > 256) this.played.splice(0, this.played.length - 256);
    return x - t;
  }

  // --- the cues --------------------------------------------------------------------------------------------
  cue(name, o = {}) {
    this.heard.push(name);
    this.cap(name);
    if (!this.ready()) return;
    const a = this.a, c = a.ctx, t = c.currentTime + 0.02;
    const out = MUSIC_CUES.has(name) ? this.cueBus() : a.sfx;
    const R = this.region || REGIONS.title;
    const root = R.root;
    switch (name) {
      case 'title':
        this.title();
        break;
      case 'chapter': {
        // the act's own theme announced: its first two bars, on the instrument it is known by, in its own key and
        // tempo, with its chords on strings and a low cello rising under them (the Prologue: Kai's theme on piano;
        // Act I: the Past on the flute; Act II: the war's strings over its percussion; Act III: 2196's strings and
        // brass; Act IV: the Unwritten Second's glass; the Finale: the Main Theme on piano and cello)
        const key = ACT_THEME[o.chapter || this.rt.chapter] || 'main';
        const h = head(key, 2);
        const ins = SIGNATURE[key] || 'piano';
        const len = this.phrase(h.bars, { root: h.home, tempo: h.tempo, ins, chords: key === 'unwritten' ? 'pad' : 'strings', t: t + 0.2, out, v: 0.06, theme: key });
        if (key === 'war') for (let i = 0; i < 2; i++) this.noise(t + 0.2 + i * len / 2, 0.12, { type: 'lowpass', from: 220, to: 100, vol: 0.14 }, out);
        if (key === 'c2196') this.brass(mtof(h.home - 5), t + 0.2, len, 0.008, out); // (distant: a fifth below the tune, not in its octave)
        this.cello(mtof(h.home - 24), t, len + 0.5, 0.05, out);
        this.cello(mtof(h.home - 17), t + len * 0.4, len * 0.6 + 0.5, 0.035, out);
        this.quotes.push({ cue: name, theme: key });
        break;
      }
      case 'card': {
        // a reversed swell, then the head of the mission's own theme (its first bar) on the instrument that carries
        // it in this place and year, in the place's key, and a low resonance under it
        a.osc('triangle', mtof(root), t, 0.8, 0.05, 0.78, 0.02, out);
        this.noise(t, 0.8, { type: 'bandpass', from: 400, to: 3000, q: 0.7, vol: 0.05 }, out);
        const key = this.themeKey === 'museum' ? 'main' : this.themeKey;
        const h = head(key, 1);
        const ins = R.lead?.[this.year] || R.lead?.PRESENT || 'piano';
        this.phrase(h.bars, { root, tempo: R.tempo, ins: ins === 'prepared' ? 'piano' : ins, chords: 'pad', t: t + 0.85, out, v: 0.055, bass: false, theme: key });
        a.osc('sine', mtof(root - 24), t + 0.85, 3.2, 0.12, 0.02, 2.6, out);
        this.quotes.push({ cue: name, theme: key });
        break;
      }
      case 'reveal':
        // a minor second, a low drop, and the Witness's two first notes, slow and low, on bowed metal
        a.osc('triangle', mtof(root + 12), t, 2.2, 0.04, 0.01, 1.8, out);
        a.osc('triangle', mtof(root + 13), t, 2.2, 0.04, 0.01, 1.8, out);
        this.dropTo(40, t, out);
        this.metal(mtof(root - 12), t + 0.5, 0.04, out);
        this.metal(mtof(root - 7), t + 1.6, 0.035, out);
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
        // and the motif's first two notes, its third withheld: the story stops before it resolves
        this.piano(mtof(root + 12), t + 0.4, 0.04, g);
        this.piano(mtof(root + 17), t + 1.3, 0.04, g);
        break;
      }
      case 'zero':
        // the ticks stop; one second of silence under the narration (the voices go on); the resonance;
        // then the 41: its horn going by, its brakes, the impact
        this.silentUntil = t + 1;
        a.silence(1.0);
        this.horn(t + 1.1, out);
        this.noise(t + 1.6, 1.6, { type: 'bandpass', from: 3800, to: 2400, q: 6, vol: 0.06 }, out);
        this.impact(t + 2.9, out);
        break;
      case 'fracture':
        // the whiteout swell first, then the breath of silence after it (silence() from the start muted the swell)
        this.noise(t, 1.2, { type: 'highpass', from: 200, to: 6000, q: 0.5, vol: 0.08 }, out);
        this.silentUntil = t + 2.0;
        setTimeout(() => a.silence(0.7), 1150);
        for (let i = 0; i < 12; i++) a.pluck(mtof(root + 36 - i * 3), t + 2.0 + i * 0.05, 0.04, out);
        this.impact(t + 2.7, out, 0.5);
        break;
      case 'pin':
        a.bell(mtof(84), t, 0.05, out);
        a.bell(mtof(91), t + 0.12, 0.05, out);
        break;
      case 'echoStep':
        this.noise(t, 0.6, { type: 'bandpass', from: 600, to: 4800, q: 1.2, vol: 0.08 }, out);
        this.motif('mira', root, t + 0.3, 0.12, out, 0.035);
        break;
      case 'reverse':
        if (o.release) { this.noise(t, 0.12, { type: 'highpass', from: 5000, to: 1200, vol: 0.08 }, out); a.osc('sine', mtof(root), t, 0.3, 0.05, 0.002, 0.2, out); } else a.osc('triangle', mtof(root + 12), t, 1.2, 0.03, 1.1, 0.03, out);
        break;
      case 'loopReset':
        this.noise(t, 0.9, { type: 'bandpass', from: 3000, to: 200, q: 2, vol: 0.08 }, out);
        this.siren(t + 0.6, 0.02, out, 2.4);
        this.loops++;
        break;
      case 'pa':
        // the station chime: two tones
        a.bell(mtof(76), t, 0.07, out);
        a.bell(mtof(72), t + 0.42, 0.07, out);
        break;
      case 'ending:A': {
        // THE FIXED WORLD: the only full major cadence in the game. The motif goes up a fourth and, for once, does
        // not stop: it rises to the sixth over IV, falls through V, and comes home to A major (strings under the last)
        const len = this.phrase(ENDING_A, { root: 57, tempo: 62, ins: 'piano', chords: 'strings', t: t + 1.2, out, v: 0.06, theme: 'main' });
        this.silentUntil = t + 1.2 + len; // (the place's music waits for it)
        this.quotes.push({ cue: name, theme: 'main' });
        break;
      }
      case 'ending:B': {
        // THE INFINITE WAR: the Main Theme's head in A minor and in E-flat minor at once, a tritone apart, never
        // agreeing; the war's ostinato under them; then the Witness's motif, low
        const h = head('main', 2);
        const len = this.phrase(h.bars, { root: 57, tempo: 62, ins: 'piano', chords: 'strings', t: t + 1.2, out, v: 0.05, theme: 'main' });
        this.phrase(h.bars, { root: 63, tempo: 62, ins: 'glass', chords: 'none', t: t + 1.2, out, v: 0.05, bass: false, theme: 'main' });
        for (let i = 0; i < 24; i++) a.osc('sawtooth', mtof(38 + MOTIF[i % 3] + (i % 8 >= 4 ? 7 : 0)), t + 1.2 + i * 0.32, 0.22, 0.006, 0.01, 0.15, out);
        this.motif('witness', 45, t + 1.4 + len, 0.6, out, 0.04);
        this.silentUntil = t + 1.2 + len + 3;
        this.quotes.push({ cue: name, theme: 'main' });
        break;
      }
      case 'ending:C': {
        // AFTERZERO: the Final Choice. The Main Theme's first two bars reduced to piano and cello, then strings bloom
        // on the hopeful suspended chord; one breath of silence; one note
        const h = head('main', 2);
        const len = this.phrase(h.bars, { root: 57, tempo: 62, ins: 'piano', chords: 'none', t: t + 1.2, out, v: 0.05, theme: 'final' });
        for (const m of [57, 62, 64, 69]) this.strings(mtof(m + 12), t + 1.2 + len, 4.5, 0.016, out);
        this.cello(mtof(45), t + 1.2 + len, 4.5, 0.04, out);
        const end = t + 1.2 + len + 4.5;
        this.silentUntil = end + 2.2; // (the breath: everything stops)
        this.piano(mtof(69), end + 2.2, 0.05, out);
        this.quotes.push({ cue: name, theme: 'final' });
        break;
      }
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
    this.noise(t, 0.6, { type: 'lowpass', from: 1800, to: 120, vol: 0.2 * v }, out);
  }
}

