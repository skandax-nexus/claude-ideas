// Voiced dialogue. Every subtitle line can also be spoken, each character
// with their own pitch and pace: the browser's speech synthesis on desktop
// and mobile Chrome, Android's own text-to-speech inside the APK.
// Music ducks under speech (see Synth.setDuck). Toggle in Settings.

const PROFILES = {
  JUNO: { pitch: 1.12, rate: 1.03, gender: 'f' },
  TICK: { pitch: 1.75, rate: 1.12, gender: 'n' },
  YOU: { pitch: 1.0, rate: 0.98, gender: 'f' },
  VARGA: { pitch: 0.9, rate: 0.92, gender: 'f' },
  CUSTODIAN: { pitch: 0.72, rate: 0.88, gender: 'm' },
  OBSERVER: { pitch: 0.55, rate: 0.82, gender: 'n' },
  OTHER: { pitch: 1.05, rate: 0.9, gender: 'f' },
  NONE: { pitch: 1.0, rate: 0.95, gender: 'n' },
};

export class Voice {
  constructor() {
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
    return !!(this.android || this.synth);
  }

  // who: speaker key; extra: { pitch, gender } for generated crew
  speak(text, who = 'NONE', extra = {}) {
    if (!this.enabled || !text) return;
    const plain = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const spoken = plain === plain.toUpperCase() ? plain.toLowerCase() : plain; // TICK and records shout in caps
    const p = { ...(PROFILES[who] || PROFILES.NONE), ...extra };
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
    try {
      if (this.android) this.android.stop();
      else this.synth?.cancel();
    } catch {
      /* ignore */
    }
  }

  // how long a line takes to say, so subtitles wait for the voice
  duration(text, who) {
    const p = PROFILES[who] || PROFILES.NONE;
    return Math.max(2.2, (text.replace(/<[^>]+>/g, '').length / 14.5) / p.rate + 0.5);
  }
}
