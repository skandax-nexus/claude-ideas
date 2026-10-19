// AFTERZERO: THE LAST VERSION OF EARTH - the edition descriptor main.js loads when
// window.AZ_EDITION === 'lastversion' (or ?edition=lastversion). Everything the
// edition changes about the game lives under this folder:
//   index.js    this descriptor: title, states, looks, speakers, themes
//   Runtime.js  chapters, missions, objectives, scenes, choices, stability, Echo Step, anchors, endings
//   Build.js    hand-authored interiors (Helix) and small props
//   npcs.js     the people: roster, state model, barks, quest chains, dialogue
//   prologue.js Missions 1-3, fully authored
//   acts.js     Acts I-IV, the Finale, the endings and the four optional cases
import { LastVersion, CHAPTERS, MISSIONS, ORDER, HINTS } from './Runtime.js';
import { NPCS, CAST, DIALOGUE, AMBIENT } from './npcs.js';
import { ENDINGS } from './acts.js';

export const LV = {
  key: 'lastversion',
  title: 'AFTERZERO',
  subtitle: 'THE LAST VERSION OF EARTH',
  tagline: 'Every attempt to repair history has helped create the catastrophe.',
  // the four temporal states, in the order the number keys pick them
  states: ['PRESENT', 'PAST', 'FUTURE', 'INVERTED'],
  labels: { PRESENT: '2049', PAST: '2026', FUTURE: '2196', INVERTED: 'INVERTED' },
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
  // the reality engine for this edition: four temporal states, no laws (PAST shows and holds the
  // residue of what stood there; INVERTED flips gravity and runs selected motion backwards)
  engineOptions() {
    return {
      slots: 3, unlocked: 3, laws: [null, null, null],
      states: LV.states, baseline: 'PRESENT', residue: 'PAST',
      stateEffects: { PAST: { echoVisible: true, echoSolid: true }, INVERTED: { gravityFlip: true, timeReverse: true } },
    };
  },
  makeRuntime(game) {
    return new LastVersion(game, LV);
  },
};

// every line the edition can speak: [speaker, text] (tools/voice-pack.mjs records them)
export function allLines() {
  const out = [];
  const add = (who, text) => text && who && out.push([who === 'CREW' ? 'CREW_n' : who, text]);
  const walk = (o, seen = new Set()) => {
    if (!o || typeof o !== 'object' || seen.has(o)) return;
    seen.add(o);
    if (Array.isArray(o)) return o.forEach((x) => walk(x, seen));
    if (typeof o.text === 'string' && typeof o.who === 'string') add(o.who, o.text);
    if (Array.isArray(o.tiers)) o.tiers.forEach((t) => add('KAI', t));
    if (Array.isArray(o.barks)) o.barks.forEach((t) => add(o.voice || 'CREW', t));
    if (o.log && typeof o.log === 'object' && o.log.text) add(o.log.who || 'NONE', o.log.text);
    if (typeof o.log === 'string' && o.kind === 'contradiction') add('KAI', o.log);
    if (o.kind === 'contradiction') { add('NONE', o.official); add('NONE', o.echo); }
    if (typeof o.log === 'string' && !o.kind) add('KAI', o.log);
    for (const v of Object.values(o)) if (typeof v === 'object') walk(v, seen);
  };
  for (const ms of Object.values(MISSIONS)) walk(ms);
  walk(DIALOGUE);
  for (const n of Object.values(NPCS)) (n.barks || []).forEach((t) => add(n.voice, t));
  for (const a of Object.values(AMBIENT)) a.barks.forEach((t) => add('CREW_n', t));
  for (const e of Object.values(ENDINGS)) e.text.forEach((t) => add('NONE', t));
  for (const tiers of Object.values(HINTS)) tiers.forEach((t) => add('KAI', t));
  for (const t of ['The Chronolith let go of me. Back to the present, back to the last anchor.', 'Nothing in my hands to hold on to.', 'Not like this. Not now.', 'Not yet. Something here is unfinished.', 'The gate waits for the scene. Finish it first.', 'The next door is open. Keep going.', 'Read the record on the wall. Then read it again in the past.', 'Look around. Someone left something for me.', 'The lock reads the present. The room is somewhere else right now.', 'It wants a key. I saw one in another year.', 'An empty socket. There is a cell for it somewhere near.', 'It came apart when the year changed. Next time, anchor it first. C.', 'It walked me back to the last anchor. It only watches the floor in front of it.', 'Records have a residue. Read it in the past.', 'I can\'t change the year. Not yet.', 'There are things to do along the avenue. Some of them only answer in their own year.']) add('KAI', t);
  add('NONE', 'A post-credit clock begins ticking.');
  add('VOICE', 'Version one hundred and eighteen.');
  return out;
}
