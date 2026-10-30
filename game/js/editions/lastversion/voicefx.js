// THE LAST VERSION OF EARTH: what a line sounds like through (OVERHAUL.md §8.6). A line's extra may name an
// effect chain, extra.fx; audio/Voice.js plays its sources into the chain through the `effects` hook the
// edition gives it (Runtime: g.voice.effects = new VoiceFx(g.voice)), and Station Zero's voice has none.
//
//   pa         a station speaker (the announcer, the VOICE, the post-credit voice): band-limited, a presence
//              peak, a slapback off the far wall, a reverb send
//   radio      a phone, a comm (Rook's calls, the unseen Director): narrower, a little driven, a hiss under it
//   recording  a record, a file, a terminal: a little dull, its speed wandering (wow), a crackle under it
//   echo       an echo, a memory, Ending C's "Live.": far off, a little slow, in a large room
//
// Each chain is built once and ends in the voice's own output (voice.output(), on the voice bus); its reverb send
// goes through a gain at the Dialogue row's level (the reverb returns to the master, not to the voice bus).

// a few seconds of the radio's hiss and of a record's crackle, made once per audio context: every line plays a
// window of them (a fresh buffer the length of each line was a multi-megabyte fill on the main thread)
const BEDS = new WeakMap();
const BED_SEC = 3;
function bedBuffer(ctx, fx) {
  let m = BEDS.get(ctx);
  if (!m) BEDS.set(ctx, (m = {}));
  if (!m[fx]) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * BED_SEC));
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    let s = 12345;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;
    if (fx === 'radio') for (let i = 0; i < len; i++) d[i] = rnd();
    else for (let i = 0; i < len; i++) d[i] = Math.abs(rnd()) > 0.9993 ? rnd() : rnd() * 0.04;
    m[fx] = b;
  }
  return m[fx];
}

export class VoiceFx {
  constructor(voice) {
    this.v = voice;
    this.chains = {};
  }

  get a() {
    return this.v.audio;
  }

  // a line through this chain plays a little slower (the echo)
  rate(fx) {
    return fx === 'echo' ? 0.97 : 1;
  }

  // the chains' reverb sends, at the Dialogue row's level as each line starts (Dialogue at 0: no reverb wash either)
  sends() {
    const a = this.a;
    if (!a.reverb) return null;
    if (!this.sendBus) {
      this.sendBus = a.ctx.createGain();
      this.sendBus.connect(a.reverb);
    }
    this.sendBus.gain.value = a.level ? a.level('voice') : 1;
    return this.sendBus;
  }

  // where the sources of a line with this effect connect (null: the voice's own output)
  input(fx, out) {
    this.sends();
    if (this.chains[fx]) return this.chains[fx];
    const ctx = this.a.ctx;
    const f = (type, freq, q = 0.7, gain = 0) => {
      const n = ctx.createBiquadFilter();
      n.type = type;
      n.frequency.value = freq;
      n.Q.value = q;
      n.gain.value = gain;
      return n;
    };
    const send = (from, amount) => {
      const bus = this.sends();
      if (!bus) return;
      const g = ctx.createGain();
      g.gain.value = amount;
      from.connect(g).connect(bus);
    };
    const delay = (from, sec, fb, wet) => {
      const d = ctx.createDelay(1);
      d.delayTime.value = sec;
      const g = ctx.createGain();
      g.gain.value = fb;
      const w = ctx.createGain();
      w.gain.value = wet;
      from.connect(d);
      d.connect(g).connect(d);
      d.connect(w).connect(out);
    };
    let input;
    if (fx === 'pa') {
      input = f('highpass', 300);
      const pk = f('peaking', 1800, 1, 5);
      input.connect(f('lowpass', 3500)).connect(pk).connect(out);
      delay(pk, 0.11, 0.3, 0.35);
      send(pk, 0.3);
    } else if (fx === 'radio') {
      input = f('highpass', 450);
      const sh = ctx.createWaveShaper();
      const k = new Float32Array(1024);
      for (let i = 0; i < k.length; i++) k[i] = Math.tanh(2.2 * (i / 511.5 - 1)) / Math.tanh(2.2);
      sh.curve = k;
      input.connect(f('lowpass', 3200)).connect(sh).connect(out);
    } else if (fx === 'recording') {
      input = f('highpass', 200);
      input.connect(f('lowpass', 5500)).connect(out);
    } else if (fx === 'echo') {
      input = f('lowpass', 2400);
      input.connect(out);
      delay(input, 0.32, 0.25, 0.4);
      send(input, 0.7);
    } else return null;
    this.chains[fx] = input;
    return input;
  }

  // each source of the line, as it is scheduled: a record's speed wanders by ±0.3%
  source(src, fx, t, dur) {
    if (fx !== 'recording') return;
    const ctx = this.a.ctx;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.7;
    const depth = ctx.createGain();
    depth.gain.value = src.playbackRate.value * 0.003;
    lfo.connect(depth).connect(src.playbackRate);
    lfo.start(t);
    lfo.stop(t + dur + 0.1);
  }

  // under the whole line, as long as it: the radio's band noise (-38 dB), a record's crackle -> the source (the
  // voice stops it with the line), or null
  bed(fx, t, dur, out) {
    if (fx !== 'radio' && fx !== 'recording') return null;
    const ctx = this.a.ctx;
    const src = ctx.createBufferSource();
    src.buffer = bedBuffer(ctx, fx);
    src.loop = true; // (as long as the line: it stops with it, below, or when the voice stops)
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = fx === 'radio' ? 1800 : 3000;
    const g = ctx.createGain();
    g.gain.value = fx === 'radio' ? 0.0126 : 0.05;
    src.connect(bp).connect(g).connect(out);
    src.start(t, ((t * 7.3) % 1) * BED_SEC); // (a different window of it each line)
    src.stop(t + Math.max(0.05, dur));
    return src;
  }
}
