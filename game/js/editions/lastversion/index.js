// AFTERZERO: THE LAST VERSION OF EARTH - the edition descriptor main.js loads when
// window.AZ_EDITION === 'lastversion' (or ?edition=lastversion). Everything the
// edition changes about the game lives under this folder:
//   index.js    this descriptor: title, states, looks, speakers, themes
//   Runtime.js  chapters, missions, objectives, scenes, choices, stability, Echo Step, anchors, endings
//   inversion.js REVERSE: the bible's inversion as a local verb (Mission 11 on)
//   processes.js the things REVERSE can hold, and the mission landmarks they stand at
//   Build.js    hand-authored interiors (Helix) and small props
//   npcs.js     the people: roster, state model, barks, quest chains, dialogue
//   casting.js  which model each person is built from; the chapter's models, loaded behind its card
//   wardrobe.js what each person wears: recolours on the GPU, hidden parts, things carried
//   crowds.js   the crowds that walk each place's paths, by era and region
//   watchers.js the watchers: Helix drones, Continuum troopers, scavengers, the red mimics
//   voicelines.js every line the edition can speak (the voice packs), the lexicon, the cards' lines
//   score.js    the score: the motif, region music, cues, per-year beds, the mix
//   cinema.js   staged moments: shots, letterbox, lines, tap to skip
//   prologue.js Missions 1-3, fully authored
//   acts.js     Acts I-IV, the Finale, the endings and the four optional cases
import { LastVersion, CHAPTERS, MISSIONS, ORDER, HINTS, HINTS_REVERSE } from './Runtime.js';
import { NPCS, CAST, DIALOGUE, AMBIENT } from './npcs.js';
import { ENDINGS } from './acts.js';
import { spokenLines } from './voicelines.js';

export const LV = {
  key: 'lastversion',
  title: 'AFTERZERO',
  subtitle: 'THE LAST VERSION OF EARTH',
  tagline: 'Every attempt to repair history has helped create the catastrophe.',
  // the three years of one world, in the order the number keys pick them (REVERSE is a verb, not a year)
  states: ['PRESENT', 'PAST', 'FUTURE'],
  labels: { PRESENT: '2049', PAST: '2026', FUTURE: '2196' },
  // the character screen offers Kai's own realistic look only (Kai is a man in the bible, voiced male)
  looks: ['real_m'],
  // the light of each state: cold steel now, warm stone and wood then, overgrown ruin later
  themes: {
    PRESENT: { fog: 0xd8e2ec, sky: 0xf4f8ff, ground: 0xc8d0d8, hemi: 0.7, sun: 2.1, sunColor: 0xeef4ff, density: 0.012, device: 0x4f9fe8 },
    PAST: { fog: 0xe8d8c0, sky: 0xfff4e4, ground: 0xd8c4a8, hemi: 0.72, sun: 2.3, sunColor: 0xffe2b8, density: 0.013, device: 0xc08a3e },
    FUTURE: { fog: 0xc8dcc8, sky: 0xeefff0, ground: 0xb8ccb4, hemi: 0.7, sun: 2.2, sunColor: 0xe6ffe8, density: 0.015, device: 0x3fa078 },
  },
  speakers: {
    KAI: { name: 'KAI VAREN', color: '#25313d' },
    YOU: { name: 'KAI VAREN', color: '#25313d' },
    MIRA: { name: 'MIRA', color: '#c4566a' },
    WITNESS: { name: 'THE WITNESS', color: '#4a5a7a' },
    VOICE: { name: '???', color: '#4a5a7a' },
    ROOK: { name: 'DR. ELIAS ROOK', color: '#6c5bc4' },
    NIKO: { name: 'NIKO', color: '#2f8a5a' },
    SERA: { name: 'SERA VOSS', color: '#c0762a' },
    ANJA: { name: 'DR. ANJA VALE', color: '#1f9a90' },
    IVEN: { name: 'IVEN MARR', color: '#a8862a' },
    JUN: { name: 'JUN PARK', color: '#3b7fb8' },
    TALA: { name: 'TALA', color: '#2b8f7a' },
    MARA: { name: 'MARA QUILL', color: '#8a6a9a' },
    ORREN: { name: 'ORREN', color: '#7a5fd0' },
    CHILD: { name: 'THE CHILD', color: '#d06a9a' },
    PA: { name: 'ANNOUNCEMENT', color: '#5a6a78' }, // the station speakers, the ward intercom (fx 'pa')
  },
  chapters: CHAPTERS,
  order: ORDER,
  missions: MISSIONS,
  endings: ENDINGS,
  npcs: NPCS,
  cast: CAST,
  dialogue: DIALOGUE,
  ambient: AMBIENT,
  hints: HINTS,
  // the reality engine for this edition: three years, no laws, no law slots (PAST shows and holds
  // the residue of what stood there). Gravity never changes: engine.gravity() is always -1.
  // Reversal is local: inversion.js, and engine.setOverride(room, { timeReverse }) for a reversed ward.
  engineOptions() {
    return {
      slots: 0, unlocked: 0, laws: [],
      states: LV.states, baseline: 'PRESENT', residue: 'PAST',
      stateEffects: { PAST: { echoVisible: true, echoSolid: true } },
    };
  },
  makeRuntime(game) {
    return new LastVersion(game, LV);
  },
};

// every line the edition can speak: [speaker, text] (a thin wrapper over voicelines.js spokenLines(), which
// tools/voice-pack.mjs --edition lastversion records, with the voice and the pack of each)
export function allLines() {
  return spokenLines().map((e) => [e.who === 'YOU' ? 'KAI' : e.who, e.text]);
}
