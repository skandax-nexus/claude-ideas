// Voiced dialogue. Every line is spoken with recorded neural voices from the
// voice pack (assets/voice, built by tools/voice-pack.*): scripted lines are
// recorded whole, generated lines are spliced from recorded phrases and names.
// It plays through the game's own audio, so it works wherever music does.
// Anything the pack can't say falls back to the device's text-to-speech
// (the browser's speech synthesis, Android's TTS inside the APK).
// Music ducks under speech (see Synth.setDuck). Toggle in Settings.
//
// THE LAST VERSION OF EARTH (OVERHAUL.md §8.6) has packs of its own, one per chapter group
// (assets/voice/lv/<group>/: whole sentences, nothing spliced), and never uses device speech: a line its
// packs cannot say waits for a pack still loading (up to 2 s), else it is a miss (window.__voiceMiss) and
// its subtitle carries it. Its lines may name their recorded voice (extra.id) and an effect chain
// (extra.fx: 'pa' station speakers, 'radio' comms, 'recording' records, 'echo' echoes and memories), whose
// chains the edition provides (voice.effects: editions/lastversion/voicefx.js).
import { voicePieces } from './voiceKey.js';
import { VOCAB } from '../gen/StoryGen.js';
import { EDITION } from '../core/Edition.js';

const GAP = 0.05; // between spliced pieces
const LRU = 64; // decoded clips kept (decoded speech is ~190 KB a second; the line playing keeps its own buffers)

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
  // THE LAST VERSION OF EARTH (its speakers' pace, for a subtitle's length before its pack is here)
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
const ALIAS = { KAI: 'YOU_m', VOICE: 'WITNESS', MIRA9: 'CHILD' };

// A pack: an index plus one file of chained Ogg Opus clips (voice.ogg), loaded once per base.
// onProgress(0..1) follows the clips' download; vocab: the words spliced into lines ([] for none).
const PACKS = new Map();
const LOADED = new Map(); // the packs already here, by base
export function loadVoicePack(base = 'assets/voice/', onProgress = null, vocab = null) {
  if (PACKS.has(base)) return PACKS.get(base);
  const p = (async () => {
    try {
      const index = await (await fetch(base + 'voice.json')).json();
      const res = await fetch(base + 'voice.ogg');
      if (!res.ok) throw new Error(`${res.status} ${base}voice.ogg`);
      let bin;
      const total = +res.headers?.get?.('content-length') || 0;
      if (onProgress && total && res.body?.getReader) {
        // (the length announced is only the progress's measure: a server that compresses the file announces the
        // compressed length, and the stream gives more bytes than that; the buffer grows as they come)
        const reader = res.body.getReader();
        let buf = new Uint8Array(total);
        let at = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (at + value.length > buf.length) {
            const more = new Uint8Array(Math.max(at + value.length, buf.length * 2));
            more.set(buf.subarray(0, at));
            buf = more;
          }
          buf.set(value, at);
          at += value.length;
          onProgress(Math.min(0.99, at / total));
        }
        bin = buf.buffer.slice(0, at);
      } else bin = await res.arrayBuffer();
      onProgress?.(1);
      const pack = { base, index, bin, vocab: vocab || VOCAB() };
      if (PACKS.get(base) === p) LOADED.set(base, pack);
      return pack;
    } catch (e) {
      console.warn(`Voice pack unavailable (${base}); using device speech`, e);
      if (PACKS.get(base) === p) PACKS.delete(base); // a later call may try again
      return null;
    }
  })();
  PACKS.set(base, p);
  return p;
}

export class Voice {
  constructor(audio = null, opts = {}) {
    this.audio = audio; // the game's Synth: voices play through its mixer
    this.edn = (opts.edition ?? EDITION) === 'lastversion';
    this.packs = []; // the packs a line is looked up in (first hit wins)
    this.clips = new Map();
    this.playing = [];
    this.packOk = true;
    this.loading = 1; // 0..1 while the edition's packs come in
    this.effects = null; // THE LAST VERSION's effect chains (extra.fx), set by the edition
    this.enabled = true;
    if (this.edn) {
      // never the device's voice (the edition's Runtime chooses the packs: usePacks)
      this.android = null;
      this.synth = null;
      this.voices = [];
      return;
    }
    loadVoicePack().then((p) => p && (this.packs = [p]));
    this.android = typeof window !== 'undefined' ? window.AndroidTTS : null;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    if (this.synth) {
      const load = () => (this.voices = this.synth.getVoices().filter((v) => /^en/i.test(v.lang)));
      load();
      this.synth.onvoiceschanged = load;
    }
  }

  get pack() {
    return this.packs[0] || null;
  }

  get available() {
    if (this.edn) return this.packOk;
    return !!(this.pack && this.packOk) || !!(this.android || (this.synth && this.voices.length));
  }

  // THE LAST VERSION: the packs lines are said from (in lookup order), and those to load meanwhile for later
  // (the next chapter). A pack this voice loaded that is in neither list is let go. -> a promise for them.
  usePacks(bases, prefetch = []) {
    const want = new Set([...bases, ...prefetch]);
    for (const b of this.mine || []) {
      if (want.has(b)) continue;
      PACKS.delete(b); // its clips' buffer goes with it
      LOADED.delete(b);
      for (const k of [...this.clips.keys()]) if (k.startsWith(b)) this.clips.delete(k);
    }
    this.mine = want;
    for (const b of prefetch) loadVoicePack(b, null, []);
    // the packs already here answer at once (the common pack, a chapter prefetched): nothing to wait for
    if (bases.every((b) => LOADED.has(b))) {
      this.packsToken = (this.packsToken || 0) + 1;
      this.packs = bases.map((b) => LOADED.get(b));
      this.loading = 1;
      this.whenReady = Promise.resolve(this.packs);
      return this.whenReady;
    }
    const prog = new Map(bases.map((b) => [b, 0]));
    const token = (this.packsToken = (this.packsToken || 0) + 1);
    this.loading = 0;
    const active = Promise.all(bases.map((b) => loadVoicePack(b, (f) => {
      prog.set(b, f);
      if (token === this.packsToken) this.loading = Math.min(0.99, [...prog.values()].reduce((a, v) => a + v, 0) / prog.size);
    }, []))).then((list) => {
      if (token === this.packsToken) {
        this.packs = list.filter(Boolean);
        this.loading = 1;
      }
      return this.packs;
    });
    this.whenReady = active;
    return active;
  }

  // a promise that resolves when the active packs are here
  ready() {
    return this.whenReady || Promise.resolve(this.packs);
  }

  has(name) {
    return this.packs.some((p) => p.index[name]);
  }

  // the recorded pieces for a line, or null if the pack can't say all of it
  plan(text, who, extra = {}) {
    if (!this.packs.length || !this.packOk) return null;
    extra = extra || {};
    if (this.edn && who === 'YOU' && this.has('KAI')) who = 'KAI'; // THE LAST VERSION: you are Kai, in his own voice
    let id = this.edn && extra.id ? extra.id // (a line that names its recorded voice: OVERHAUL.md §8.6)
      : who === 'CREW' ? `CREW_${extra.gender || 'n'}` : ALIAS[who] && !this.has(who) ? ALIAS[who] : who;
    if (who === 'YOU' && this.youMale && this.has('YOU_m')) id = 'YOU_m'; // your look decides your voice
    if (who === 'OTHER' && this.youMale && this.has('OTHER_m')) id = 'OTHER_m'; // and the Other's: it wears your face
    // the Other speaks with your voice when it has no recording of its own
    const you = this.youMale && this.has('YOU_m') ? 'YOU_m' : 'YOU';
    const pieces = voicePieces(text, this.packs[0].vocab);
    const say = (names) => {
      const libs = [];
      for (const n of names) for (const pk of this.packs) if (pk.index[n]) libs.push([n, pk.index[n], pk]);
      if (!libs.length) return null;
      const out = [];
      for (const p of pieces) {
        if (p.pause) {
          out.push(p);
          continue;
        }
        const hit = libs.find(([, l]) => l[p.key]);
        if (!hit) return null;
        out.push({ key: hit[0] + '|' + p.key, ref: hit[1][p.key], pack: hit[2] });
      }
      return out.length ? out : null;
    };
    // a crew line is said whole in one voice: the person's own, else the neutral crew voice (a line the
    // pack has not recorded in every crew voice yet); splicing the two is the last resort
    if (who === 'CREW' && id !== 'CREW_n' && !(this.edn && extra.id)) return say([id]) || say(['CREW_n']) || say([id, 'CREW_n']);
    return say([id, ...(who === 'OTHER' ? [you] : [])]);
  }

  clip(key, ref, pack = this.packs[0]) {
    const ck = pack.base + key;
    let c = this.clips.get(ck);
    if (c) this.clips.delete(ck); // set again below: the most recently used is last
    else {
      const [off, len] = ref;
      c = this.audio.ctx.decodeAudioData(pack.bin.slice(off, off + len)).catch((e) => {
        this.packOk = false; // e.g. no Opus decoder: use device speech from now on (the edition: subtitles)
        this.onDecodeFail?.(e);
        throw e;
      });
    }
    this.clips.set(ck, c);
    // a small LRU: decoded speech is ~190 KB a second and few lines repeat (the line playing keeps its own buffers)
    while (this.clips.size > LRU) this.clips.delete(this.clips.keys().next().value);
    return c;
  }

  // the voice's own output, on the voice bus
  output() {
    if (!this.out) {
      this.out = this.audio.ctx.createGain();
      this.out.gain.value = 1.15;
      this.out.connect(this.audio.voiceBus || this.audio.master);
    }
    return this.out;
  }

  async playPlan(plan, extra) {
    const ctx = this.audio.ctx;
    const token = (this.token = (this.token || 0) + 1);
    const bufs = await Promise.all(plan.map((p) => (p.ref ? this.clip(p.key, p.ref, p.pack) : null)));
    if (token !== this.token) return; // a newer line (or a skip) took over
    // crew voices vary a little around their recorded voice
    let rate = extra.pitch && extra.gender ? Math.min(1.08, Math.max(0.93, 1 + (extra.pitch - { f: 1.14, m: 0.84, n: 1 }[extra.gender]) * 0.9)) : 1;
    // THE LAST VERSION: the effect chain the line names (extra.fx), from the edition (editions/lastversion/voicefx.js)
    const ef = this.edn && extra.fx ? this.effects : null;
    const out = this.output();
    const dest = (ef && ef.input(extra.fx, out)) || out;
    if (ef) rate *= ef.rate(extra.fx);
    let t = ctx.currentTime + 0.06;
    const t0 = t;
    for (let i = 0; i < plan.length; i++) {
      if (plan[i].pause) {
        t += plan[i].pause;
        continue;
      }
      const src = ctx.createBufferSource();
      src.buffer = bufs[i];
      src.playbackRate.value = rate;
      ef?.source(src, extra.fx, t, bufs[i].duration / rate);
      src.connect(dest);
      src.start(t);
      this.playing.push(src);
      t += bufs[i].duration / rate + GAP;
    }
    const bed = ef?.bed(extra.fx, t0, t - t0, out);
    if (bed) this.playing.push(bed);
  }

  // who: speaker key; extra: { pitch, gender } for generated crew (THE LAST VERSION: { id, fx, cue })
  // -> the line's length in seconds (0 when it is not said from a pack)
  speak(text, who = 'NONE', extra = {}) {
    if (!this.enabled || !text) return 0;
    extra = extra || {};
    this.stop();
    const plan = this.audio?.ctx && this.plan(text, who, extra);
    if (plan) {
      this.playPlan(plan, extra).catch(() => (this.edn ? this.miss(text, who, extra, 'decode') : this.speakDevice(text, who, extra)));
      return this.length(plan);
    }
    if (!this.edn) {
      this.speakDevice(text, who, extra);
      return 0;
    }
    if (!this.audio?.ctx) return 0; // no sound yet (before the first tap): the subtitle carries it
    // a pack still on its way: the line waits for it (2 s at most), else the subtitle carries it alone
    if (this.loading < 1) {
      const token = this.token;
      const t0 = Date.now();
      Promise.race([this.ready(), new Promise((r) => setTimeout(r, 2000))]).then(() => {
        if (!this.enabled) return;
        if (token !== this.token) {
          // another line (or a skip) took over: this one is not said, but one the packs cannot say is still a miss
          if (this.loading >= 1 && !this.plan(text, who, extra)) this.miss(text, who, extra, 'not in the packs (passed over while they loaded)');
          return;
        }
        const p = Date.now() - t0 <= 2100 && this.plan(text, who, extra);
        if (p) this.playPlan(p, extra).catch(() => this.miss(text, who, extra, 'decode'));
        else this.miss(text, who, extra, this.loading < 1 ? 'pack still loading' : undefined);
      });
      return 0;
    }
    this.miss(text, who, extra);
    return 0;
  }

  // THE LAST VERSION: a line its packs could not say (the bots read window.__voiceMiss)
  miss(text, who, extra = {}, why = 'not in the packs') {
    if (typeof window !== 'undefined') (window.__voiceMiss ||= []).push({ who, text, id: extra?.id || null, why });
    console.warn(`voice: ${why}: ${who}${extra?.id ? ` (${extra.id})` : ''}: ${text}`);
  }

  length(plan) {
    return plan.reduce((a, p) => a + (p.pause || p.ref[2] + GAP), 0.06);
  }

  speakDevice(text, who, extra) {
    if (this.edn) return; // (never in THE LAST VERSION)
    const vol = this.audio ? (this.audio.muted ? 0 : this.audio.volume ?? 1) : 1;
    if (vol <= 0) return; // SOUND OFF and volume 0 silence the device voice too
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
      u.volume = Math.min(1, 0.95 * vol);
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
    if (this.edn) return;
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
    if (plan) return Math.max(1.6, this.length(plan) + 0.45);
    const p = PROFILES[who] || PROFILES.NONE;
    return Math.max(2.2, (text.replace(/<[^>]+>/g, '').length / 14.5) / p.rate + 0.5);
  }
}
