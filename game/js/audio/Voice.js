// Voiced dialogue. Every line is spoken with recorded neural voices from the
// voice pack (assets/voice, built by tools/voice-pack.*): scripted lines are
// recorded whole, generated lines are spliced from recorded phrases and names.
// It plays through the game's own audio, so it works wherever music does.
// Anything the pack can't say falls back to the device's text-to-speech
// (the browser's speech synthesis, Android's TTS inside the APK).
// Music ducks under speech (see Synth.setDuck). Toggle in Settings.
import { voicePieces } from './voiceKey.js';
import { VOCAB } from '../gen/StoryGen.js';

const GAP = 0.05; // between spliced pieces

const PROFILES = {
  JUNO: { pitch: 1.12, rate: 1.03, gender: 'f' },
  TICK: { pitch: 1.75, rate: 1.12, gender: 'n' },
  YOU: { pitch: 1.0, rate: 0.98, gender: 'f' },
  YOU_m: { pitch: 0.9, rate: 0.98, gender: 'm' },
  VARGA: { pitch: 0.9, rate: 0.92, gender: 'f' },
  CUSTODIAN: { pitch: 0.72, rate: 0.88, gender: 'm' },
  OBSERVER: { pitch: 0.55, rate: 0.82, gender: 'n' },
  OTHER: { pitch: 1.05, rate: 0.9, gender: 'f' },
  OTHER_m: { pitch: 0.92, rate: 0.9, gender: 'm' },
  NONE: { pitch: 1.0, rate: 0.95, gender: 'n' },
  // THE LAST VERSION OF EARTH
  KAI: { pitch: 0.9, rate: 0.98, gender: 'm' },
  MIRA: { pitch: 1.08, rate: 0.96, gender: 'f' },
  WITNESS: { pitch: 0.78, rate: 0.86, gender: 'm' },
  ROOK: { pitch: 0.8, rate: 0.94, gender: 'm' },
  NIKO: { pitch: 1.0, rate: 1.04, gender: 'm' },
  SERA: { pitch: 0.98, rate: 1.0, gender: 'f' },
  ANJA: { pitch: 1.02, rate: 0.95, gender: 'f' },
  IVEN: { pitch: 0.86, rate: 1.0, gender: 'm' },
  JUN: { pitch: 0.92, rate: 1.02, gender: 'm' },
  TALA: { pitch: 1.05, rate: 0.95, gender: 'f' },
  MARA: { pitch: 0.95, rate: 0.9, gender: 'f' },
  ORREN: { pitch: 0.75, rate: 0.88, gender: 'm' },
  CHILD: { pitch: 1.45, rate: 1.05, gender: 'f' },
  VOICE: { pitch: 0.7, rate: 0.86, gender: 'm' },
};
// speakers recorded under another name in the pack
const ALIAS = { KAI: 'YOU_m', VOICE: 'WITNESS' };

// The pack: an index plus one file of chained Ogg Opus clips (voice.ogg).
let PACK = null;
export function loadVoicePack(base = 'assets/voice/') {
  if (PACK) return PACK;
  PACK = (async () => {
    try {
      const index = await (await fetch(base + 'voice.json')).json();
      const bin = await (await fetch(base + 'voice.ogg')).arrayBuffer();
      return { index, bin, vocab: VOCAB() };
    } catch (e) {
      console.warn('Voice pack unavailable; using device speech', e);
      return null;
    }
  })();
  return PACK;
}

export class Voice {
  constructor(audio = null) {
    this.audio = audio; // the game's Synth: voices play through its mixer
    this.pack = null;
    this.clips = new Map();
    this.playing = [];
    this.packOk = true;
    loadVoicePack().then((p) => (this.pack = p));
    this.enabled = true;
    this.android = typeof window !== 'undefined' ? window.AndroidTTS : null;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    if (this.synth) {
      const load = () => (this.voices = this.synth.getVoices().filter((v) => /^en/i.test(v.lang)));
      load();
      this.synth.onvoiceschanged = load;
    }
  }

  get available() {
    return !!(this.pack && this.packOk) || !!(this.android || (this.synth && this.voices.length));
  }

  // the recorded pieces for a line, or null if the pack can't say all of it
  plan(text, who, extra = {}) {
    if (!this.pack || !this.packOk) return null;
    let id = who === 'CREW' ? `CREW_${extra.gender || 'n'}` : ALIAS[who] && !this.pack.index[who] ? ALIAS[who] : who;
    if (who === 'YOU' && this.youMale && this.pack.index.YOU_m) id = 'YOU_m'; // your look decides your voice
    if (who === 'OTHER' && this.youMale && this.pack.index.OTHER_m) id = 'OTHER_m'; // and the Other's: it wears your face
    // the Other speaks with your voice when it has no recording of its own
    const you = this.youMale && this.pack.index.YOU_m ? 'YOU_m' : 'YOU';
    // a crew voice falls back on the neutral crew recordings (WORLD FORGE's cast lines are recorded once)
    const libs = [[id, this.pack.index[id]], ...(who === 'OTHER' ? [[you, this.pack.index[you]]] : []), ...(who === 'CREW' && id !== 'CREW_n' ? [['CREW_n', this.pack.index.CREW_n]] : [])].filter(([, l]) => l);
    if (!libs.length) return null;
    const out = [];
    for (const p of voicePieces(text, this.pack.vocab)) {
      if (p.pause) {
        out.push(p);
        continue;
      }
      const hit = libs.find(([, l]) => l[p.key]);
      if (!hit) return null;
      out.push({ key: hit[0] + '|' + p.key, ref: hit[1][p.key] });
    }
    return out.length ? out : null;
  }

  clip(key, ref) {
    let c = this.clips.get(key);
    if (!c) {
      const [off, len] = ref;
      c = this.audio.ctx.decodeAudioData(this.pack.bin.slice(off, off + len)).catch((e) => {
        this.packOk = false; // e.g. no Opus decoder: use device speech from now on
        throw e;
      });
      this.clips.set(key, c);
    }
    return c;
  }

  async playPlan(plan, extra) {
    const ctx = this.audio.ctx;
    const token = (this.token = (this.token || 0) + 1);
    const bufs = await Promise.all(plan.map((p) => (p.ref ? this.clip(p.key, p.ref) : null)));
    if (token !== this.token) return; // a newer line (or a skip) took over
    // crew voices vary a little around their recorded voice
    const rate = extra.pitch && extra.gender ? Math.min(1.08, Math.max(0.93, 1 + (extra.pitch - { f: 1.14, m: 0.84, n: 1 }[extra.gender]) * 0.9)) : 1;
    if (!this.out) {
      this.out = ctx.createGain();
      this.out.gain.value = 1.15;
      this.out.connect(this.audio.master);
    }
    let t = ctx.currentTime + 0.06;
    for (let i = 0; i < plan.length; i++) {
      if (plan[i].pause) {
        t += plan[i].pause;
        continue;
      }
      const src = ctx.createBufferSource();
      src.buffer = bufs[i];
      src.playbackRate.value = rate;
      src.connect(this.out);
      src.start(t);
      this.playing.push(src);
      t += bufs[i].duration / rate + GAP;
    }
  }

  // who: speaker key; extra: { pitch, gender } for generated crew
  speak(text, who = 'NONE', extra = {}) {
    if (!this.enabled || !text) return;
    this.stop();
    const plan = this.audio?.ctx && this.plan(text, who, extra);
    if (plan) {
      this.playPlan(plan, extra).catch(() => this.speakDevice(text, who, extra));
      return;
    }
    this.speakDevice(text, who, extra);
  }

  speakDevice(text, who, extra) {
    const plain = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const spoken = plain === plain.toUpperCase() ? plain.toLowerCase() : plain; // TICK and records shout in caps
    const p = { ...(PROFILES[(who === 'YOU' || who === 'OTHER') && this.youMale ? `${who}_m` : who] || PROFILES.NONE), ...extra };
    try {
      if (this.android && this.android.ready && this.android.ready()) {
        this.android.speak(spoken, p.pitch, p.rate);
        return;
      }
      if (!this.synth) return;
      this.synth.cancel();
      const u = new SpeechSynthesisUtterance(spoken);
      u.pitch = Math.min(2, p.pitch);
      u.rate = p.rate;
      u.volume = 0.95;
      const v = this.pickVoice(p.gender);
      if (v) u.voice = v;
      this.synth.speak(u);
    } catch {
      /* speech is a bonus, never an error */
    }
  }

  pickVoice(gender) {
    if (!this.voices.length) return null;
    const f = /female|samantha|victoria|karen|moira|tessa|zira|susan|aria|jenny|libby|sonia|google uk english female|google us english/i;
    const m = /male|daniel|alex|fred|david|mark|guy|ryan|george|google uk english male/i;
    const pref = gender === 'f' ? this.voices.find((v) => f.test(v.name) && !/\bmale\b/i.test(v.name))
      : gender === 'm' ? this.voices.find((v) => m.test(v.name) && !/female/i.test(v.name)) : null;
    return pref || this.voices[0];
  }

  stop() {
    this.token = (this.token || 0) + 1;
    for (const s of this.playing) {
      try {
        s.stop();
      } catch {
        /* already done */
      }
    }
    this.playing = [];
    try {
      if (this.android) this.android.stop();
      else this.synth?.cancel();
    } catch {
      /* ignore */
    }
  }

  // how long a line takes to say, so subtitles wait for the voice
  duration(text, who, extra = {}) {
    const plan = this.plan(text, who, extra);
    if (plan) return Math.max(1.6, plan.reduce((a, p) => a + (p.pause || p.ref[2] + GAP), 0.06) + 0.45);
    const p = PROFILES[who] || PROFILES.NONE;
    return Math.max(2.2, (text.replace(/<[^>]+>/g, '').length / 14.5) / p.rate + 0.5);
  }
}
