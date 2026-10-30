// THE LAST VERSION OF EARTH: the score's written music (the bible, §6 "Music Generation Bible"). Every theme the
// bible names is written out here as notes: a melody, its harmony bar by bar (a voiced chord, its bass first) and a
// form. score.js plays them live through Synth (0 bytes of assets), each mission in its region's key, tempo and
// instruments, with a layer per year; the cues quote them. Nothing here is drawn at random: the same theme is the
// same tune every time round, in every place it is heard.
//
//   MOTIF   the three notes all of it grows from (the Child's song: "it goes up, and then it goes up again, and then
//           it stops"): up a fourth, up a fourth, unresolved. Every theme states it, transformed: the Main Theme
//           plainly on piano; Kai's theme compressed into quavers, a cell repeated; the Past as a flute call over
//           chords built of fourths (the motif as a chord); the Nine-Minute War as its ostinato, in 7/8 against 4/4;
//           2196 augmented in the brass; the Unwritten Second in fragments, with silence between; Mira's theme
//           leaps its first fourth and falls back; the Witness plays it slower and lower, a note a bar; the Final
//           Choice is the Main Theme reduced.
//   THEMES  name, home key and tempo (the bible's), sections of bars: [chord, melody], and the form the sections
//           play in. A chord is semitones above the tonic, bass first ('' or '-' is no chord: silence as rhythm);
//           a melody is 'pitch:eighths' pairs, '-' a rest. A bar is 8 eighths unless it says otherwise (the war's
//           7/8 bars: { len: 7 }).
//   Per act: the Prologue is Kai's theme, Act I the Past, Act II the Nine-Minute War, Act III 2196, Act IV the
//           Unwritten Second, the Finale the Final Choice; the title and the CASE FILES the Main Theme. A mission
//           plays its act's theme unless it is a character's (Mira's: Missions 11 and 20; the Witness's: Missions 12,
//           17 and 21) or the museum's (Mission 16 plays the other themes' phrases out of order, as exhibits).
export const MOTIF = [0, 5, 10];

// a bar: [chord, melody, options]
const B = (chord, mel, o = {}) => ({ chord, mel, ...o });

export const THEMES = {
  // AFTERZERO Main Theme: wonder mixed with loss. Solo piano motif, low cello, distant choir-like texture, slowly
  // expanding strings, one unresolved final note. 78 BPM, minor, a hopeful suspended chord.
  main: {
    name: 'AFTERZERO Main Theme', home: 57, tempo: 78,
    sections: {
      intro: { dyn: 0.55, bars: [B('0 7 14 15', '-:8'), B('-4 3 7 12', '-:8')] },
      A: { dyn: 0.8, bars: [
        B('0 7 14 15', '0:2 5:2 10:4'), B('-4 3 7 12', '7:3 5:1 3:2 0:2'), B('-2 3 7 10', '3:4 7:2 10:2'), B('-2 3 5 10', '12:6 10:2'),
        B('0 7 12 15', '12:2 17:2 22:4'), B('-4 3 7 12', '19:3 17:1 15:2 12:2'), B('-7 3 8 12', '8:2 7:2 5:4'), B('-5 2 7 12', '2:8'),
      ] },
      B: { dyn: 1, bloom: true, bars: [
        B('-4 3 7 12', '12:3 14:1 15:4'), B('-2 3 5 10', '14:3 12:1 10:4'), B('-5 2 5 10', '7:2 10:2 14:4'), B('0 7 12 15', '12:6 -:2'),
        B('-7 3 8 12', '5:2 10:2 15:4'), B('-4 3 7 12', '14:3 12:1 10:2 7:2'), B('-2 3 5 10', '10:4 12:4'), B('0 5 7 12', '17:8'),
      ] },
      breath: { dyn: 0, bars: [B('', '-:8')] },
    },
    form: ['intro', 'A', 'A', 'B', 'A', 'breath'],
  },
  // Kai, The Need to Fix It (the Prologue): drive, precision, hidden anxiety. A muted pulse, short piano cells, low
  // strings, ticking percussion that drifts off the grid. 92 BPM. The motif compressed into a quaver cell.
  kai: {
    name: 'Kai: The Need to Fix It', home: 57, tempo: 92,
    sections: {
      cells: { dyn: 0.6, bars: [B('0 7 12 15', '0:1 5:1 10:1 -:1 0:1 5:1 10:1 -:1'), B('0 7 12 15', '0:1 5:1 10:1 12:1 10:1 -:3')] },
      A: { dyn: 0.8, bars: [
        B('0 7 12 15', '0:1 5:1 10:1 -:1 0:1 5:1 10:1 -:1'), B('0 7 12 15', '0:1 5:1 10:1 12:1 10:1 -:3'),
        B('-4 3 7 12', '0:1 5:1 8:1 -:1 0:1 5:1 8:1 -:1'), B('-4 3 7 12', '0:1 5:1 8:1 12:1 7:1 -:3'),
        B('-7 5 8 12', '-2:1 3:1 8:1 -:1 -2:1 3:1 8:1 -:1'), B('-7 5 8 12', '-2:1 3:1 8:1 10:1 8:1 -:3'),
        B('-5 2 7 12', '7:1 12:1 17:1 -:1 7:1 12:1 17:1 -:1'), B('-5 4 7 11', '14:2 11:2 7:4'),
      ] },
      B: { dyn: 0.95, bloom: true, bars: [
        B('-4 3 7 12', '12:4 10:2 7:2'), B('-2 2 5 10', '10:4 7:2 5:2'), B('0 7 12 15', '7:2 5:2 3:2 0:2'), B('0 7 12 15', '-:2 0:1 5:1 10:4'),
        B('-4 3 7 12', '12:4 15:2 14:2'), B('-2 2 5 10', '14:4 10:2 12:2'), B('-5 2 7 12', '12:8'), B('-5 4 7 11', '11:8'),
      ] },
      breath: { dyn: 0, bars: [B('', '-:8')] },
    },
    form: ['cells', 'A', 'A', 'B', 'cells', 'A', 'breath'],
  },
  // The Past, Ancient Settlement (Act I): human continuity, living history. Frame drum, breathy flute, plucked
  // strings, stone and water; curious and ancient without any one real culture's sound: modal, its chords built of
  // fourths (the motif stacked). 82 BPM.
  past: {
    name: 'The Past: Ancient Settlement', home: 52, tempo: 82,
    sections: {
      intro: { dyn: 0.55, bars: [B('0 5 10 15', '-:8'), B('0 7 12 17', '-:8')] },
      A: { dyn: 0.8, bars: [
        B('0 5 10 15', '12:2 17:2 22:4'), B('-7 0 5 9', '21:3 19:1 17:4'), B('0 5 10 15', '14:2 12:2 10:2 7:2'), B('-2 5 10 14', '10:6 -:2'),
        B('-9 -2 3 7', '15:2 14:2 15:2 17:2'), B('-7 0 5 9', '19:4 17:2 14:2'), B('-5 2 5 10', '14:3 12:1 10:4'), B('0 7 12 17', '12:8'),
      ] },
      B: { dyn: 0.95, bars: [
        B('2 9 14 17', '14:2 17:2 21:4'), B('-7 0 5 9', '17:4 12:4'), B('-2 5 10 14', '14:2 19:2 24:4'), B('0 7 12 15', '22:6 -:2'),
        B('-9 -2 3 7', '15:4 19:4'), B('-7 0 5 9', '21:4 17:4'), B('0 5 10 15', '17:2 22:2 27:4'), B('0 7 12 17', '24:8'),
      ] },
      breath: { dyn: 0, bars: [B('', '-:8')] },
    },
    form: ['intro', 'A', 'B', 'A', 'breath'],
  },
  // Nine-Minute War (Act II): urgency and tactical adaptation. Layered percussion, short string ostinati, the tempo
  // slipping: 4/4 against 7/8, brief gaps, reversed impacts. 118 BPM. The motif is the ostinato under it all.
  war: {
    name: 'Nine-Minute War', home: 50, tempo: 118,
    sections: {
      A: { dyn: 0.85, bars: [
        B('0 7 12 15', '12:3 13:1 12:2 10:2'), B('1 8 13 17', '13:2 15:2 17:3', { len: 7 }),
        B('0 7 12 15', '15:3 13:1 12:4'), B('-2 5 10 13', '10:2 12:2 13:3', { len: 7 }),
        B('-4 3 8 12', '17:4 15:2 12:2'), B('1 8 13 17', '13:3 15:2 17:2', { len: 7 }),
        B('0 7 12 15', '19:4 17:2 15:2'), B('-5 2 7 12', '19:7', { len: 7 }),
      ] },
      B: { dyn: 1, bars: [
        B('-4 3 8 12', '12:2 17:2 22:4'), B('-2 5 10 13', '22:3 20:1 19:4'), B('0 7 12 15', '17:2 15:2 12:3', { len: 7 }), B('1 8 13 17', '13:4 12:4'),
        B('-7 0 5 8', '10:3 8:2 7:2', { len: 7 }), B('-4 3 8 12', '12:4 15:4'), B('-5 2 7 12', '19:7', { len: 7 }), B('', '-:8', { gap: true }),
      ] },
    },
    form: ['A', 'A', 'B', 'A', 'B'],
  },
  // 2196, Beautiful Catastrophe (Act III): awe, grief, resilience. Wide strings, distant brass, processed wind, a
  // slow pulse, sparse piano; no heavy drums. 70 BPM, lydian. The brass carries the motif augmented, a note a bar.
  c2196: {
    name: '2196: Beautiful Catastrophe', home: 53, tempo: 70,
    sections: {
      A: { dyn: 0.8, bars: [
        B('0 7 14 16', '12:4 14:2 16:2'), B('0 9 14 18', '18:6 16:2'), B('4 11 14 19', '16:4 14:2 12:2'), B('-3 7 12 16', '14:6 12:2'),
        B('-7 0 4 9', '12:3 14:1 16:4'), B('-5 2 7 12', '19:4 18:4'), B('4 12 16 19', '16:4 12:4'), B('-5 2 7 11', '14:8'),
      ] },
      B: { dyn: 1, bloom: true, brass: true, bars: [
        B('-7 0 4 9', '7:4 12:4'), B('-7 0 4 9', '17:8'), B('4 12 16 19', '16:4 19:4'), B('-3 7 12 16', '21:6 19:2'),
        B('2 9 12 17', '17:4 14:4'), B('4 11 14 19', '16:4 12:4'), B('-7 0 4 9', '9:4 11:4'), B('-5 2 7 12', '12:8'),
      ] },
      breath: { dyn: 0, bars: [B('', '-:8')] },
    },
    form: ['A', 'B', 'A', 'breath'],
  },
  // The Unwritten Second (Act IV): reality beyond familiar rules. Sparse glass, prepared piano, a low drone, silence
  // as rhythm, the motif only in fragments. 48 BPM or free time; no beat.
  unwritten: {
    name: 'The Unwritten Second', home: 50, tempo: 48,
    sections: {
      A: { dyn: 0.75, bars: [
        B('0 7 14', '12:2 17:2 -:4'), B('', '-:8'), B('0 7 14', '-:4 22:4'), B('', '-:8'),
        B('-5 2 9', '14:2 19:2 24:4'), B('', '-:8'), B('0 6 11', '18:8'), B('', '-:8'),
      ] },
      B: { dyn: 0.7, bars: [
        B('0 7 14', '24:1 -:3 19:1 -:3'), B('', '-:8'), B('-3 4 11', '16:4 -:4'), B('', '-:8'),
        B('0 7 14', '12:2 17:2 22:2 -:2'), B('', '-:8'), B('', '-:8'), B('0 7', '-:8'),
      ] },
    },
    form: ['A', 'B'],
  },
  // Mira, Memory Without a Body (Missions 11 and 20): tenderness, uncertainty, identity. Felt piano, breathy
  // woodwinds, warm cello harmonics, reversed tails used sparingly. 64 BPM; unresolved but compassionate.
  mira: {
    name: 'Mira: Memory Without a Body', home: 57, tempo: 64,
    sections: {
      A: { dyn: 0.75, bars: [
        B('0 7 14 15', '12:3 17:1 15:4'), B('-2 7 10 14', '14:3 12:1 10:4'), B('-4 3 7 12', '12:2 15:2 19:4'), B('-5 3 7 10', '17:4 15:4'),
        B('-7 3 8 12', '12:3 17:1 20:4'), B('3 7 12 15', '19:4 17:2 15:2'), B('2 8 12 17', '14:4 12:4'), B('-5 2 5 12', '12:8'),
      ] },
      B: { dyn: 0.85, flute: true, bars: [
        B('-4 3 7 12', '19:3 17:1 15:4'), B('-2 2 5 10', '14:3 17:1 14:4'), B('-5 2 5 10', '12:4 10:4'), B('0 7 12 15', '7:2 12:2 17:4'),
        B('-7 3 8 12', '17:3 15:1 12:4'), B('-4 3 7 12', '15:4 14:4'), B('-5 2 7 12', '12:4 14:4'), B('-5 2 5 12', '14:8'),
      ] },
      breath: { dyn: 0, bars: [B('', '-:8')] },
    },
    form: ['A', 'B', 'A', 'breath'],
  },
  // The Witness (Missions 12, 17 and 21): a familiar self made frightening by time. Kai's motif slower and lower,
  // bowed bass, metallic resonance, an irregular pulse. 54 BPM.
  witness: {
    name: 'The Witness', home: 45, tempo: 54,
    sections: {
      A: { dyn: 0.8, bars: [
        B('0 7 12 15', '0:4 5:4'), B('0 7 12 15', '10:8'), B('1 8 13 17', '8:4 5:4'), B('0 7 12 15', '3:6 -:2'),
        B('-4 3 7 12', '0:4 3:2 5:2'), B('-5 -1 2 8', '8:4 7:4'), B('-7 3 8 12', '5:4 8:4'), B('-5 -1 2 8', '-1:8'),
      ] },
      B: { dyn: 0.9, bars: [
        B('0 7 12 15', '12:4 17:4'), B('0 7 12 15', '22:6 -:2'), B('1 8 13 17', '20:4 17:4'), B('-4 3 7 12', '15:4 12:4'),
        B('-7 3 8 12', '17:4 15:4'), B('1 8 13 17', '13:8'), B('-5 -1 2 8', '11:4 8:4'), B('0 7 12 15', '0:8'),
      ] },
    },
    form: ['A', 'B', 'A'],
  },
  // Afterzero, Final Choice (the Finale): grief without defeat. The Main Theme reduced to piano and cello, then
  // slowly joined by strings; it ends with one breath of silence. 62 BPM.
  final: {
    name: 'Afterzero: Final Choice', home: 57, tempo: 62, of: 'main',
    sections: {
      reduced: { dyn: 0.7, reduced: true, from: 'A' },
      bloom: { dyn: 0.85, bloom: true, from: 'A' },
      rise: { dyn: 1, bloom: true, from: 'B' },
      breath: { dyn: 0, bars: [B('', '-:8')] },
    },
    form: ['reduced', 'bloom', 'rise', 'breath'],
  },
};

// the museum of failed worlds (Mission 16): the other themes' first phrases, one exhibit a round, out of order
export const MUSEUM = ['war', 'mira', 'past', 'main', 'witness', 'c2196', 'kai', 'unwritten'];

// which theme each act is (its chapter card quotes it; its missions play it)
export const ACT_THEME = { prologue: 'kai', act1: 'past', act2: 'war', act3: 'c2196', act4: 'unwritten', finale: 'final', cases: 'main' };
// the missions that play a character's theme (or the museum's), not their act's
export const CHARACTER_THEME = { m11: 'mira', m12: 'witness', m16: 'museum', m17: 'witness', m20: 'mira', m21: 'witness' };
const ACT_OF = { m01: 'prologue', m02: 'prologue', m03: 'prologue', m04: 'act1', m05: 'act1', m06: 'act1', m07: 'act1', m08: 'act1',
  m09: 'act2', m10: 'act2', m11: 'act2', m12: 'act2', m13: 'act2', m14: 'act3', m15: 'act3', m16: 'act3', m17: 'act3', m18: 'act3',
  m19: 'act4', m20: 'act4', m21: 'act4', m22: 'act4', m23: 'finale', c_b: 'act1', c_c: 'act3' };
// Mission 8 goes back to Helix, where Kai's theme began: it is heard there again (the place keeps its tune)
const RETURNS = { m08: 'kai' };
export const missionTheme = (mkey) => CHARACTER_THEME[mkey] || RETURNS[mkey] || ACT_THEME[ACT_OF[mkey]] || 'main';
export const actOf = (mkey) => ACT_OF[mkey] || null;

// --- reading the notation ----------------------------------------------------------------------------------------
const chordOf = (s) => (!s || s === '-' ? null : s.trim().split(/\s+/).map(Number));
const melodyOf = (s, len) => {
  const notes = [];
  let at = 0;
  for (const tok of s.trim().split(/\s+/)) {
    const [p, d] = tok.split(':');
    const dur = +d;
    if (p !== '-') notes.push({ at, p: +p, d: dur });
    at += dur;
  }
  return { notes, total: at, len };
};
const parseBar = (b) => {
  const len = b.len || 8;
  const m = melodyOf(b.mel, len);
  return { chord: chordOf(b.chord), notes: m.notes, total: m.total, len, gap: !!b.gap };
};
const CACHE = new Map();
// a theme's section as bars ready to play: { chord, notes: [{ at, p, d }], len, total, gap, dyn, bloom, reduced, ... }
export function section(themeKey, secKey) {
  const k = `${themeKey}/${secKey}`;
  if (CACHE.has(k)) return CACHE.get(k);
  const th = THEMES[themeKey];
  let sec = th?.sections?.[secKey];
  if (!sec) return null;
  // a section may be another theme's (the Final Choice is the Main Theme's A and B, reduced, then blooming)
  const src = sec.from ? THEMES[th.of].sections[sec.from] : sec;
  const bars = src.bars.map(parseBar);
  sec = { key: secKey, theme: themeKey, dyn: sec.dyn ?? src.dyn ?? 0.8, bloom: !!(sec.bloom ?? src.bloom), reduced: !!sec.reduced, brass: !!(sec.brass ?? src.brass), flute: !!(sec.flute ?? src.flute), bars };
  CACHE.set(k, sec);
  return sec;
}

// a theme's melody as pitches, its form in order (what the tests and the bot compare the score's lead with)
export function melodyPitches(themeKey, secKey) {
  const s = section(themeKey, secKey);
  return s ? s.bars.flatMap((b) => b.notes.map((n) => n.p)) : [];
}

// the head of a theme: its first sounding phrase (a cue quotes it)
export function head(themeKey, bars = 2) {
  const th = THEMES[themeKey];
  if (!th) return null;
  const key = th.form.find((s) => section(themeKey, s)?.bars.some((b) => b.notes.length));
  const s = section(themeKey, key);
  return { theme: themeKey, section: key, bars: s.bars.slice(0, bars), tempo: th.tempo, home: th.home };
}

// THE FIXED WORLD (Ending A): the only full major cadence in the game, IV, V, I in A major. The motif goes up a fourth
// and then, for once, does not stop on its unresolved note: it rises to the sixth, falls through the fifth and comes home
export const ENDING_A = [B('-7 5 9 12', '0:2 5:2 9:4'), B('-5 7 11 14', '11:4 7:4'), B('0 4 7 12 16', '12:8')].map(parseBar);
