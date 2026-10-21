// THE LAST VERSION OF EARTH: Act II, THE NINE-MINUTE WAR (Missions 9-13).
import { CAST, intent } from './npcs.js';

const L = (who, text, when) => (when ? { who, text, when } : { who, text });
const N = (text) => L('NONE', text);
const K = (text) => L('KAI', text);
// a line that turns the story over carries the reveal cue (score.js)
const REV = (l) => ({ ...l, voice: { ...(l.voice || {}), cue: 'reveal' } });
const C = (id) => CAST.findIndex((c) => c.id === id);
// (a person without a speaker of their own (CREW) carries their recorded voice, OVERHAUL.md §8.4)
const says = (id, texts) => texts.map((text) => ({ who: CAST[C(id)].voice, name: CAST[C(id)].name.toUpperCase(), color: CAST[C(id)].color, text, ...(CAST[C(id)].voice === 'CREW' ? { voice: { id: CAST[C(id)].vid } } : {}) }));
const place = (o) => ({ kind: 'place', sectors: o.beats.length, ...o });
const E = (id, lines, extra = {}) => ({ kind: 'encounter', crew: C(id), lines: says(id, lines), ...extra });
const encounterQ = (id, lines, choices, extra = {}) => E(id, lines, { choices, ...extra });

// =============================================================================================
// MISSION 11: the processes REVERSE learns on, at the hospital's landmarks (places/specs/hospital.js); each
// stands in its quarter's sector only (the whole hospital loads for every sector)
export const LOCK_ORDER = ['RING', 'BAR', 'STAR', 'CRESCENT'];
const CLUE_TAG = 'A 2026 maintenance tag on the lock: WARD 32 LOCK REFITTED 14-03-2026. BOLTS FITTED IN ORDER: RING, BAR, STAR, CRESCENT.';
const CLUE_TWIN = 'In the reversed ward the twin of the Ward 32 lock comes apart on its loop, last bolt first: CRESCENT, then STAR, then BAR, then RING. Then it fits itself back together.';
const CLUE_CHIME = 'The intercom chimes before it speaks: four tones, low to high. The bolts answer in the same four tones: RING, BAR, STAR, CRESCENT.';
const M11_PROCESSES = [
  // the three tutorial objects in the records hall (D22): a fall, a flow, a burn
  {
    id: 'tray', sector: 1, kind: 'fall', at: 'tray', label: 'THE TRAY', weight: 0.5, when: '@PRESENT', grain: 'metal', creak: 0.3,
    props: [{ box: [-0.5, 0, -0.32, 0.5, 0.86, 0.32], mat: 'prop' }],
    parts: [
      { shape: 'box', size: [0.62, 0.025, 0.42], mat: 'steel', at: [0, 0.875, 0], rest: { at: [-0.62, 0.013, 0.72], rot: [0.04, 0.55, 0.03] } },
      { shape: 'disc', size: [0.2, 0.035, 0.2], mat: 'steel', at: [0.16, 0.905, 0.06], rest: { at: [-1.05, 0.018, 0.38], rot: [0.3, 0, 0.2] } },
      { shape: 'box', size: [0.17, 0.012, 0.04], mat: 'steel', at: [-0.14, 0.894, -0.08], rot: [0, 0.4, 0], rest: { at: [-0.32, 0.006, 1.12], rot: [0, 1.9, 0] } },
      { shape: 'cyl', size: [0.022, 0.15, 0.022], mat: 'white', at: [0.02, 0.9, -0.11], rot: [0, 0, 1.5708], rest: { at: [-1.12, 0.011, 0.95], rot: [0, 0.8, 1.5708] } },
    ],
    aim: [0, 0.9, 0],
    hints: ['A tray that fell off its trolley. Things that fell can rise again, for a while.', 'Aim at the tray and REVERSE. It goes back up while it holds.', 'Look at the trolley and REVERSE. REVERSE again to let it fall.'],
  },
  {
    id: 'waterGlass', sector: 1, kind: 'flow', mode: 'spill', at: 'waterGlass', label: 'THE GLASS', weight: 0.5, when: '@PRESENT', grain: 'water',
    props: [{ box: [-0.42, 0, -0.32, 0.42, 0.74, 0.32], mat: 'prop2' }],
    parts: [
      { shape: 'glass', size: [0.085, 0.13, 0.085], mat: 'glass', at: [0.12, 0.805, 0.02] },
      { shape: 'cyl', size: [0.07, 0.1, 0.07], mat: 'water', at: [0.12, 0.795, 0.02] },
      { shape: 'disc', size: [0.8, 0.006, 0.8], mat: 'water', at: [0.55, 0.004, 0.62] },
    ],
    aim: [0.12, 0.82, 0.02],
    hints: ['A spilled glass of water.', 'Water runs backwards too. Aim at the glass and REVERSE.', 'Look at the glass on the table and REVERSE.'],
  },
  {
    id: 'burntDoor', sector: 1, kind: 'burn', at: 'burntDoor', label: 'THE ANNEX DOOR', weight: 1, when: '@PRESENT', grain: 'fire',
    props: [
      { box: [-3.0, 0, -0.07, -0.56, 2.5, 0.07], mat: 'wall' },
      { box: [0.56, 0, -0.07, 3.0, 2.5, 0.07], mat: 'wall' },
      { box: [-0.56, 2.15, -0.07, 0.56, 2.5, 0.07], mat: 'wall' },
    ],
    parts: [{ shape: 'box', size: [1.0, 2.1, 0.05], mat: 'wood', at: [0, 1.05, 0], rest: { at: [0.15, 0.03, -1.25], rot: [-1.5708, 0, 0.12] } }],
    aim: [0, 1.1, 0],
    hints: ['The annex door burned and fell.', 'Fire runs backwards: the char recedes, the door stands up again.', 'Aim at the burnt door in the annex doorway and REVERSE.'],
  },
  // the file the ward un-burns for three seconds in ten: readable only while Kai holds it
  {
    id: 'charredFile', sector: 1, kind: 'burn', at: 'charredFile', label: 'THE CHARRED FILE', weight: 0.5, max: 12, when: '@PRESENT', grain: 'fire', required: true,
    ambient: { period: 10, on: 3 }, scene: 'charredFile', prompt: 'READ THE FILE',
    props: [{ box: [-0.6, 0, -0.42, 0.6, 0.76, 0.42], mat: 'prop' }],
    parts: [{ shape: 'sheet', size: [0.34, 0, 0.44], mat: 'paper', at: [0, 0.775, 0], rot: [0, 1.5708, 0], text: ['RAIN CITY GENERAL', 'ADMISSION · WARD 32', '14-03-2026 · 16:40', 'VAREN, M. · AGE 9', '', '~Admitted by: K. Varen'] }],
    aim: [0, 0.8, 0],
    hints: ['The file was paper once. For three seconds in ten it remembers.', 'Hold it backwards and it stays paper while the charge lasts. Read it then.', 'Aim at the file on the annex desk, REVERSE, then read it while it holds.'],
  },
  // R6: never a person
  {
    id: 'flatlineMonitor', sector: 1, kind: 'refusal', refuse: 'NOT A PROCESS', at: 'flatlineMonitor', label: 'THE MONITOR', when: '@PRESENT', line: 'Not a person. It won\'t take a person.',
    props: [{ box: [-1.0, 0, -0.48, 1.0, 0.6, 0.48], mat: 'prop2' }, { box: [0.93, 0, 0.62, 1.01, 1.24, 0.7], mat: 'trimDark' }],
    parts: [{ shape: 'box', size: [0.46, 0.32, 0.06], mat: 'screen', at: [0.97, 1.4, 0.66] }],
    aim: [0.97, 1.4, 0.66],
  },
  // the reversing lock on Ward 32's door: four bolts, RING, BAR, STAR, CRESCENT fitted in that order
  {
    id: 'm11lock', sector: 2, kind: 'lock', at: 'ward32Door', label: 'THE LOCK', weight: 1, grain: 'metal', required: true, bolts: LOCK_ORDER, aim: [0, 1.4, 0.3],
    hints: ['Four bolts, fitted in an order. Only the last one fitted will come out.', 'The 2026 tag, the twin lock next door and the chime all give the order.', 'RING, BAR, STAR, CRESCENT went in. Reverse CRESCENT, then STAR, then BAR, then RING.'],
  },
];

// =============================================================================================
// ACT II: THE NINE-MINUTE WAR
export const ACT2 = [
  place({
    key: 'm09', n: 9, chapter: 'act2', name: 'NINE MINUTES TO ZERO', title: 'Loop City', subtitle: 'The city repeats the same nine minutes. Positions change. You do not.',
    place: 'northbank', states: ['PRESENT', 'PAST'], drones: [1, 2, 2], loop: 41 * 2, ambience: 'rain', ambient: 'loop',
    motto: 'YOU HAVE NINE MINUTES', gate: 'THE TOWER',
    crew: C('engineer'),
    intro: [N('Sirens, then silence, then sirens, every nine minutes. The patrols walk the same loop and then a slightly different one.'), L('WITNESS', 'You have nine minutes.'), K('To do what?'), L('WITNESS', 'To become me.')],
    fragments: [[
      'A clock stopped at nine minutes to zero. Then at eight. Then at nine again.',
      'A patrol schedule with the same route written eleven times in increasingly tired handwriting.',
      'A civilian\'s note: GO LEFT AT THE CLOCK. LAST TIME RIGHT. DID NOT HELP.',
      'A transmitter mast with a maintenance panel open. Someone has already sabotaged it, in a loop that no longer exists.',
      'A trapped engineer\'s radio, still broadcasting: "Eleven. Twelve. Is anyone counting with me?"',
      'The tower door, with a hand-print in the dust that is yours and is not yours yet.',
    ]],
    beats: [
      { kind: 'arrival', goal: 'Observe two loops and find the first clock.', log: { title: 'CLOCK A', text: 'Synchronized to the transmitter. Every nine minutes it reaches zero and the street forgets. The patrols do not. Watch them twice before you move.' } },
      { kind: 'contradiction', goal: 'Find the second clock on the enemy route. Read what the loop erased.', official: 'EVACUATION ORDER - ALL CIVILIANS TO THE TOWER', echo: 'EVACUATION ORDER CANCELLED - TOWER COMPROMISED - DO NOT GO UP', clue: 'cleared', crew: C('engineer'), toast: 'RESIDUE READ', log: 'The order on the board sends everyone to the tower. The residue says the order was cancelled. The loop keeps the lie.' },
      E('engineer', ['You again. You get here earlier every time.', 'The transmitter is above us. Cut it and the street stops forgetting. I would do it myself but my leg is in two loops at once.', 'Go up before the reset. If you make it, you keep what you know. I think that is how it works. Nobody has made it.'], { goal: 'Rescue the engineer and reach the tower before the reset.', after: [N('The city resets. Kai does not. The knowledge stays.'), K('I remember. I remember all of it.')] }),
    ],
    outro: [K('The street forgot. I didn\'t. Nine minutes, and every one of them is still mine.')],
  }),
  place({
    key: 'm10', n: 10, chapter: 'act2', name: 'ENEMIES WHO REMEMBER', title: 'The Continuum\'s detention block', subtitle: 'They believe time must be controlled. Sera helps you out.',
    place: 'dam', states: ['PRESENT', 'PAST'], drones: [2, 2, 0], motto: 'TIME MUST BE CONTROLLED',
    ambience: 'hum', ambient: 'loop',
    beats: [
      { kind: 'arrival', goal: 'Escape the detention block. The guards watch the floor.', log: { title: 'CONTINUUM INTAKE - VAREN, K.', text: 'Subject denies responsibility for the Fracture. Every version does. Hold for the Director of Continuity. Note: subject retained knowledge across a civic reset. That is not supposed to be possible.' } },
      encounterQ('sera', ['In my time, your face is on every memorial.'], [
        intent('challenge', 'For saving the world?', { lines: says('sera', ['For ending it.']), know: 2 }),
        intent('investigate', 'Why are you helping me?', { lines: says('sera', ['Because the record is incomplete, and I would rather find out than be told. The power runs through the other years. Switch it there and the guards go blind here.']), trust: 1, ev: 'sera_doubt' }),
        intent('withdraw', 'Get me out first.', { lines: says('sera', ['Then move. The testing chamber is the only way through, and it is where they keep what they took from you.']) }),
      ], { goal: 'Find Sera. Switch the power across states to blind the guards.' }),
      { kind: 'choice', goal: 'Fight through the testing chamber. Choose what to do about the prisoners in the loops.', scene: 'prisoners', prompt: 'THE LOOP CELLS', after: [N('Something comes loose in the chamber: a limited afterimage of yourself, a step ahead. Echo Step.'), K('It distracts them. It crosses things. It costs me.')] },
    ],
    scenes: {
      prisoners: {
        lines: [N('Twelve people in unstable loops, repeating the same four seconds. Releasing them ends the loops. It also ends the four seconds they are safe in.')],
        choices: [
          intent('comfort', 'Release them.', { consequence: true, lines: [N('The cells open. Eleven walk out. One does not get up. You will be told later that she was already dead in nine of the twelve.')], set: { prisoners_freed: true, echo_step: true }, ev: 'prisoners', beatDone: true }),
          intent('withdraw', 'Leave them stable.', { consequence: true, lines: [N('The loops hold. Twelve people stay safe, four seconds at a time, until somebody else decides.')], set: { prisoners_held: true, echo_step: true }, ev: 'prisoners', beatDone: true }),
        ],
      },
    },
    outro: [K('A step ahead of myself. It costs me every time.'), L('SERA', 'Then spend it on somebody else.')],
  }),
  place({
    key: 'm11', n: 11, chapter: 'act2', name: 'THE INVERTED HOSPITAL', title: 'A hospital in localized inversion', subtitle: 'Some wards move forward. Others reverse. Kai learns to hold one thing back.',
    place: 'hospital', states: ['PRESENT', 'PAST'], drones: [0, 0, 0], unstable: true, motto: 'TEMPORAL DISCONTINUITY',
    ambience: 'hum', ambient: 'loop',
    // the wards that run backwards on their own (not a year: engine.setOverride timeReverse), rooms of the hospital
    reversed: [{ sector: 0, room: 'h_colonnade' }, { sector: 1, room: 'h_annex' }, { sector: 2, room: 'h_twin' }],
    processes: M11_PROCESSES,
    // Ward 32's figure stands by the nurse at the lock: silent, a hologram that flickers (npcs.js 'patient')
    adjust(level) {
      const nurse = level.npcs.find((n) => n.crew === 'odile');
      if (!nurse) return;
      const [x, y, z] = nurse.pos;
      level.npcs.push({ id: 'ward32_figure', crew: 'patient', pos: [x + Math.cos(nurse.yaw) * 1.6, y, z - Math.sin(nurse.yaw) * 1.6], yaw: nurse.yaw + 0.3, silent: true, hologram: true, room: nurse.room });
    },
    spots: [
      { id: 'maintTag', at: 'ward32Door', sector: 2, scene: 'maintTag', prompt: 'THE MAINTENANCE TAG', model: 'tag', offset: [2.05, 1.5, 0.02], r: 2.2,
        texts: [{ text: 'WARD 32 LOCK', at: [2.05, 1.92, 0.03], size: 0.09, color: '#7a828a', when: '!@PAST' }, { text: 'WARD 32 LOCK · REFITTED 14-03-2026', at: [2.05, 1.92, 0.03], size: 0.07, color: '#3a3020', when: '@PAST' }, { text: 'RING · BAR · STAR · CRESCENT', at: [2.05, 1.8, 0.03], size: 0.07, color: '#3a3020', when: '@PAST' }] },
      { id: 'intercom', at: 'intercom', sector: 2, scene: 'chime', prompt: 'THE INTERCOM', model: 'intercom', offset: [0, 1.6, 0.03] },
      { id: 'twinLockSpot', at: 'twinLock', sector: 2, scene: 'twinLock', prompt: 'THE TWIN LOCK', model: 'none', offset: [0, 1.5, 0.4] },
    ],
    doors: [
      { id: 'door_m11records', at: 'recordsDoor', when: '!ev_admitted_by' },
      { id: 'door_m11ward32', at: 'ward32Door', when: '!inv_m11lock_done' },
    ],
    zones: [{ at: 'charredFile', sector: 1, box: [-1.5, -0.5, -1.9, 1.7, 3, 1.9], set: { m11_saw_file: true }, when: '!has_inversion' }],
    displays: [{ id: 'twinLock', kind: 'lockLoop', at: 'twinLock', sector: 2, y: 1.5 }],
    // the three clues to the lock's order: the tag lists the fitting, the twin lock the coming apart, the chime the tones
    lockClues: [{ scene: 'maintTag', order: 'fit' }, { scene: 'twinLock', order: 'out' }, { scene: 'chime', order: 'fit' }],
    beats: [
      { kind: 'arrival', goal: 'Follow the sound that gets quieter as you approach.', log: { title: 'WARD INTERCOM', text: 'Temporal discontinuity. Temporal discontinuity. Temporal discontinuity.' } },
      { kind: 'contradiction', goal: 'Compare the medical records to find the missing patient.', official: 'PATIENT 32 - VAREN, M. - AGE 32 - DISCHARGED', echo: 'PATIENT 32 - VAREN, M. - AGE 9 - DATE OF DEATH: ', clue: 'cleared', crew: C('mira'), toast: 'RECORD COMPARED', log: 'Mira\'s file lists an age of 32, though the record predates the present by 23 years. Her death date is blank.' },
      // Nurse Odile, caught in the inverted ward since 2026, speaks for it; the bed holds a silent, flickering
      // figure of adult Mira in a gown (adjust, below)
      { kind: 'scene', goal: 'Dismantle the reversing lock in the correct order.', scene: 'lock', prompt: 'WARD 32: THE REVERSING LOCK', npc: 'odile', lines: [L('CREW', 'They put me back together every morning. I would like, once, to stay apart.')] },
    ],
    scenes: {
      lock: { when: 'inv_m11lock_done', lines: [N('The last bolt backs out and stays out. Nothing pushes it back in. The door to Ward 32 slides up.')], set: { lock_open: true }, beatDone: true, log: 'The reversing lock came apart the way it went together, last bolt first. Nothing pushes a bolt back in.' },
      lock_no: { lines: [K('Forwards, it only tightens. It has to come apart the way it went together: last bolt first.')] },
      charredFile: { when: 'rev_charredFile', lines: [N('For as long as Kai holds it, the file is paper. Rain City General, Ward 32, the fourteenth of March 2026. VAREN, M., nine. At the bottom, in an older hand:'), N('ADMITTED BY: K. VAREN.'), K('My name. Not my handwriting. Not yet.')], set: { ev_admitted_by: true }, log: 'The charred file, held unburnt: Mira, nine, Ward 32, 14 March 2026. ADMITTED BY: K. VAREN, in an older hand.' },
      charredFile_no: { lines: [L('NONE', 'Ash on a desk in the annex. For three seconds in every ten it is paper again.', '!has_inversion'), L('KAI', 'It goes back to ash. I have to hold it in its unburnt second, and read it while it holds.', 'has_inversion')], then: 'unlock' },
      maintTag: { when: '@PAST', lines: [N(CLUE_TAG)], set: { ev_lock_order: true }, log: 'The 2026 maintenance tag on the Ward 32 lock: refitted RING, BAR, STAR, CRESCENT.' },
      maintTag_no: { lines: [K('A maintenance tag, bleached blank. In 2026 it was new.')] },
      twinLock: { lines: [N(CLUE_TWIN), K('Last in, first out.')], set: { ev_lock_order: true } },
      chime: { lines: [N(CLUE_CHIME), K('Fitted low to high. So they come out high to low.')], then: 'chime' },
    },
    rules: [
      { id: 'unlock', when: 'm11_saw_file && !has_inversion', then: 'unlock' },
      { id: 'lockopen', when: 'inv_m11lock_done', then: 'lockOpen' },
    ],
    fx: {
      unlock: (rt) => rt.inv?.unlock(),
      lockOpen: (rt) => rt.playNode(rt.deck.scenes.lock, null, 'lock'),
      chime: (rt) => rt.inv?.chime(),
    },
    hints: [
      { at: 'recordsHall', when: '!has_inversion', tiers: ['Something in the annex keeps un-burning.', 'Watch the charred file on the annex desk. For three seconds in every ten it is paper.', 'Stand by the charred file in the annex and watch it come back.'] },
    ],
    // what Kai understands, step by step, while the records and the lock teach him REVERSE
    objectiveFor(rt) {
      const g = rt.g, f = (k) => g.facts.get(k), s = g.campaign?.sector;
      if (s === 1) {
        if (!f('has_inversion')) return 'Find the records. Watch the charred file in the annex.';
        if (!f('ev_admitted_by')) return f('inv_used') ? 'Hold the charred file in its unburnt second, and read it while it holds.' : 'Practise REVERSE on the tray, the glass or the burnt annex door. Then the file.';
        if (!g.deckWorld.flags.beat_done) return 'Compare the medical records: read the record now, then in 2026.';
      }
      if (s === 2 && !f('inv_m11lock_done')) return f('ev_lock_order') ? 'Reverse only the last-fitted bolt each time. The order is on the tag, in the twin lock, in the chime.' : 'Learn the order the lock went together: the 2026 tag, the twin lock next door, the intercom chime.';
      return null;
    },
    outro: [K('Thirty-two. In a file twenty-three years old. And nobody wrote down when she died.')],
  }),
  place({
    key: 'm12', n: 12, chapter: 'act2', name: 'THE MAN BEHIND THE GLASS', title: 'Helix, three years deep', subtitle: 'A figure changes states to escape you.',
    place: 'helix', wing: 'north', states: ['PRESENT', 'PAST', 'FUTURE'], drones: [1, 1, 0], unstable: true, motto: 'THE PERSON YOU BECOME WHEN YOU REFUSE TO LET GO',
    ambience: 'hum', ambient: 'helix',
    beats: [
      { kind: 'arrival', goal: 'Chase the figure through Helix in 2049, then through the corridor that only existed in 2026.', log: { title: 'DOOR LOG - CORRIDOR B', text: 'Corridor B was walled off in 2031. In 2026 it ran straight to the lower chamber. He is using it. He knows the building the way you know it.' } },
      { kind: 'contradiction', goal: 'Reconstruct his route from the repeated fragments.', official: 'MAINTENANCE: NO ACCESS BELOW -3', echo: 'HE GOES DOWN EVERY TIME. HE STOPS AT THE GLASS EVERY TIME. - K.V.', clue: 'cleared', crew: C('witness'), toast: 'ROUTE RECONSTRUCTED', log: 'His route repeats. He always goes down, and he always stops at the glass.' },
      E('witness', ['The person you become when you refuse to let go.'], { goal: 'Enter the chamber containing the second Chronolith.', hologram: false, after: [REV(N('Behind the glass: a second Chronolith, and a man with your face and your wrist scar, older by years he has not told you about. He steps into a fracture and is gone.')), K('That scar. That\'s my scar.')] }),
    ],
    outro: [K('My scar. He has my scar.'), N('The fracture closes behind him like water.')],
  }),
  place({
    key: 'm13', n: 13, chapter: 'act2', name: 'THE NINE-MINUTE WAR', title: 'The war zone', subtitle: 'Two factions fight over a stabilizer. Both are reacting to their own past attacks.',
    place: 'warport', states: ['PRESENT', 'PAST', 'FUTURE'], drones: [2, 2, 3], unstable: true, ambience: 'wind', ambient: 'loop',
    motto: 'THE FUTURE THAT SURVIVES LONG ENOUGH TO REMEMBER US', gate: 'THE DISTRICT',
    crew: C('soldier'),
    intro: [N('A district on fire in three years at once. The Continuum holds the north; the Unwritten hold the south. Every shell that lands was fired by the same side, nine minutes ago.'), ...says('sera', ['This is not the future.']), K('What is it, then?'), ...says('sera', ['The future that survives long enough to remember us.'])],
    fragments: [[
      'A Continuum helmet with two names inside. The second is crossed out and written again.',
      'A shell crater that is a garden in 2196 and a pond in 2026.',
      'A device the size of a suitcase, humming at a pitch that makes your teeth remember something.',
      'A field order: HOLD THE STABILIZER. UNDER IT: DESTROY THE STABILIZER. SAME HANDWRITING.',
      'An Unwritten flag made from a Helix lab coat.',
      'A trapped population\'s roll-call, 212 names, taped inside a frozen door.',
    ]],
    beats: [
      { kind: 'arrival', goal: 'Cross the active battlefield and find the field orders.', log: { title: 'FIELD ORDER - CONTINUUM 2ND', text: 'Enemy artillery incoming from the south at 09:00. Return fire at 09:09. - Note from the Unwritten side, same paper: enemy artillery incoming from the north at 09:09. Return fire at 09:00.' } },
      {
        kind: 'tasks', goal: 'Disable the three devices, each in its own temporal state.', npc: 'soldier', npcAt: 'canyonGate',
        lines: says('soldier', ['You did that already. No - you\'re about to do it. I hate that I know the difference.', 'Three devices. Three years. Nobody on either side can reach all three. You can.']),
        tasks: [
          { state: 'PAST', prompt: 'DEVICE ONE (2026)', at: 'deviceRail', kit: 'deviceCase', no: 'This one was buried in 2026. It only answers there.', lines: [N('The first device, half buried in 2026 soil. It was planted before the war it starts. You pull its core.')] },
          { state: 'PRESENT', prompt: 'DEVICE TWO (2049)', at: 'deviceCrane', kit: 'deviceCase', no: 'Not this year. This one hums in 2049.', lines: [N('The second device, humming in 2049 at a pitch your teeth remember. You cut it.')] },
          { state: 'FUTURE', prompt: 'DEVICE THREE (2196)', at: 'deviceCrater', kit: 'deviceCase', no: 'In this year it is not a ruin yet. It answers in 2196.', lines: [N('The third device is a ruin in 2196, and still running. You switch off something that has been on for a hundred and forty years.')] },
        ],
        after: [K('Both sides are shooting at their own last attack.'), ...says('soldier', ['Then who fired first?']), K('Nobody. That\'s the point.')],
      },
      { kind: 'choice', goal: 'Destroy the stabilizer, or redirect it to free the trapped population.', scene: 'stabilizer', prompt: 'THE STABILIZER' },
    ],
    scenes: {
      stabilizer: {
        lines: [N('The stabilizer can freeze the district - the war with it - or spend itself freeing the two hundred and twelve people locked in the frozen block.')],
        choices: [
          intent('challenge', 'Destroy it. End the loop.', { consequence: true, lines: [N('The stabilizer goes. The district stops repeating. The war does not, but it is only a war now.'), ...says('sera', ['The Continuum will call that a victory. So will we. Go.'])], set: { faction: 'unwritten', stabilizer_destroyed: true }, ev: 'stabilizer', beatDone: true }),
          intent('comfort', 'Redirect it. Free the people.', { consequence: true, lines: [N('The block thaws. Two hundred and twelve people walk out into a war that is still repeating. The Continuum holds the district now, and it is quiet.'), ...says('sera', ['You chose them over the district. I would have chosen the district. I am glad it was you.'])], set: { faction: 'continuum', civilians_freed: true }, ev: 'stabilizer', beatDone: true }),
        ],
      },
    },
    outro: [K('The district will remember what I chose. So will the people who were in it.')],
  }),
];

