// THE LAST VERSION OF EARTH: the campaign spine after the Prologue.
//
// Acts I-IV and the Finale are generated regions (gen/ZoneGen.js districts and
// gen/LevelGen.js decks) that carry the bible's mission setup as authored beats:
// arrival / log / contradiction / encounter / choice / scene, each with its quoted
// dialogue, its goal and its mission ending. The four quest chains are optional
// cases. The bible's combat is readable stealth and evasion here: the game has no
// combat, so soldiers, scavengers and security systems are watchers to slip past
// (docs/lastversion/DESIGN.md says so too).
import { CAST, WATER_HOOK, MARA_HOOK, intent } from './npcs.js';

const L = (who, text, when) => (when ? { who, text, when } : { who, text });
const N = (text) => L('NONE', text);
const K = (text) => L('KAI', text);
const C = (id) => CAST.findIndex((c) => c.id === id);
const says = (id, texts) => texts.map((text) => ({ who: CAST[C(id)].voice, name: CAST[C(id)].name.toUpperCase(), color: CAST[C(id)].color, text }));

// --- palettes ------------------------------------------------------------------------------
const P = {
  settlement: { fog: 0xd8c8a8, wall: '#8a7a62', floor: '#5a5444', accent: 0xffb060, accent2: 0x7fd8c8, light: 0xffd9a0, tint: 0xc8a878, night: 0.25, weather: 'pollen', sky: 'dusk', grade: { shadowTint: 0x3a2a18, highlightTint: 0xfff0d0, toning: 0.18, contrast: 1.08, saturation: 1.08 } },
  observatory: { fog: 0x2a2630, wall: '#5a4c3a', floor: '#3a3028', accent: 0xffc06a, accent2: 0x9fc8ff, light: 0xffd6a0, tint: 0x6a5a48, night: 0.8, weather: 'stardust', sky: 'night', grade: { shadowTint: 0x2a1c3a, highlightTint: 0xffd8a8, toning: 0.22, contrast: 1.14, saturation: 1.02 } },
  helix2: { look: 'eng', fog: 0x2a2630, density: 1.6, wall: '#5c5a62', floor: '#3b3a40', accent: 0x9f8aff, accent2: 0xffb36b, light: 0xd8c8ff, tint: 0x5a4a6a, night: 0.45, weather: 'motes', sky: 'warehouse', probe: false, ink: 0.85, grade: { shadowTint: 0x1a1430, highlightTint: 0xe6d8ff, toning: 0.2, contrast: 1.12, saturation: 0.96 } },
  loop: { fog: 0x1a1b26, wall: '#3b3e46', floor: '#24272e', accent: 0xff4fa8, accent2: 0x3fe0ff, light: 0xffd2a0, tint: 0x3a3f6e, night: 1, weather: 'rain', sky: 'night', grade: { shadowTint: 0x1c3a72, highlightTint: 0xffb6dc, toning: 0.22, contrast: 1.12, saturation: 1.12 } },
  detention: { look: 'cryo', fog: 0x1c2230, density: 1.8, wall: '#4a5668', floor: '#2c3440', accent: 0x8f9cff, accent2: 0xff6a48, light: 0xa8c0e8, tint: 0x4a5a7a, night: 0.6, weather: 'frost', sky: 'night', probe: false, ink: 0.85, grade: { shadowTint: 0x101c3a, highlightTint: 0xd8e8ff, toning: 0.2, contrast: 1.12, saturation: 0.9 } },
  hospital: { look: 'med', fog: 0xd8ecec, density: 0.8, wall: '#eef4f4', floor: '#9fb8be', accent: 0x3f9cff, accent2: 0xe86a9c, light: 0xf2ffff, tint: 0xe0fbff, sky: 'warehouse', probe: false, grade: { shadowTint: 0x1e4a5a, highlightTint: 0xf2fbff, toning: 0.1, contrast: 1.12, saturation: 0.96 } },
  war: { fog: 0x2a1c18, wall: '#4a3c36', floor: '#2b2420', accent: 0xff8a3d, accent2: 0x9fd8ff, light: 0xffb27a, tint: 0x4a2a20, night: 0.85, weather: 'storm', sky: 'plant', grade: { shadowTint: 0x3a1410, highlightTint: 0xffb47a, toning: 0.26, contrast: 1.16, saturation: 1.0 } },
  future: { fog: 0xb8c8b0, wall: '#5a6a58', floor: '#3a4a38', accent: 0x9fff7a, accent2: 0xffd36a, light: 0xe8ffd0, tint: 0x6a8a68, night: 0.2, weather: 'pollen', sky: 'dusk', grade: { shadowTint: 0x1a3a2a, highlightTint: 0xfff4d8, toning: 0.16, contrast: 1.08, saturation: 1.06 } },
  museum: { look: 'arch', fog: 0x2e2418, density: 1.8, wall: '#2c3532', floor: '#3a3028', accent: 0xfff0d6, accent2: 0xffc27a, light: 0xffc27a, tint: 0xffd49a, night: 0.55, weather: 'motes', sky: 'dusk', probe: false, ink: 0.85, echoLine: 0x8ff6ff, grade: { shadowTint: 0x14303a, highlightTint: 0xffcc8a, toning: 0.22, contrast: 1.1, saturation: 1.02 } },
  archive: { look: 'arch', fog: 0x181c2e, density: 1.6, wall: '#2c3240', floor: '#262a34', accent: 0x9fd8ff, accent2: 0xff9a8a, light: 0xc8d8ff, tint: 0x4a5a8a, night: 0.6, weather: 'motes', sky: 'night', probe: false, ink: 0.85, echoLine: 0x8ff6ff, grade: { shadowTint: 0x101830, highlightTint: 0xd8e8ff, toning: 0.22, contrast: 1.12, saturation: 0.98 } },
  fracture: { fog: 0x4a3a44, wall: '#5a4a52', floor: '#3a2e34', accent: 0xff7a63, accent2: 0x7fe0ff, light: 0xffd0c0, tint: 0x6a4a5a, night: 0.6, weather: 'storm', sky: 'night', grade: { shadowTint: 0x2a1030, highlightTint: 0xffd0c0, toning: 0.24, contrast: 1.16, saturation: 1.04 } },
  liminal: { fog: 0xe8e4f4, wall: '#8a86a0', floor: '#6a6680', accent: 0xb08cff, accent2: 0xffd36a, light: 0xffffff, tint: 0xd0c8f0, night: 0.1, weather: 'motes', sky: 'dusk', grade: { shadowTint: 0x3a2a6a, highlightTint: 0xffffff, toning: 0.12, contrast: 1.06, saturation: 0.9 } },
  memory: { fog: 0xf0e0d0, wall: '#a08878', floor: '#7a6858', accent: 0xffb0a0, accent2: 0x9fd8ff, light: 0xfff0e0, tint: 0xf0d0c0, night: 0.05, weather: 'pollen', sky: 'dusk', grade: { shadowTint: 0x4a2a2a, highlightTint: 0xfff4ea, toning: 0.1, contrast: 1.04, saturation: 0.92 } },
};

const zone = (o) => ({ kind: 'zone', sectors: o.beats.length, ...o });
const rooms = (o) => ({ kind: 'rooms', sectors: o.beats.length, gated: true, ...o });
const E = (id, lines, extra = {}) => ({ kind: 'encounter', crew: C(id), lines: says(id, lines), ...extra });
const encounterQ = (id, lines, choices, extra = {}) => E(id, lines, { choices, ...extra });

// =============================================================================================
// ACT I: THE WORLD THAT REMEMBERS
export const ACT1 = [
  zone({
    key: 'm04', n: 4, chapter: 'act1', name: 'THE MAN FROM THE LAST DAY', title: 'The Ancient Settlement', subtitle: 'A village built around a stone ring. Its leader knows the mark on your wrist.',
    theme: 'settlement', palette: P.settlement, states: ['PRESENT', 'PAST'], canal: false, drones: [0, 0, 0], ambience: 'water', ambient: 'settlement',
    labels: { PRESENT: 'THE VILLAGE', PAST: 'BEFORE THE FIRE' }, // three thousand years before Helix: here, now is the village
    rooms: ['THE FIRST FIRE', 'THE WATER STEPS', 'THE RING CHAMBER'], motto: 'YOU CAME BEFORE THE FIRST FIRE', gate: 'THE UNDER-CHAMBER',
    crew: C('elder'),
    intro: [N('Kai wakes in grass, under a sky that has never seen a plane. The ring in the middle of the village is stone, and it is the same ring.'), K('Where is this. When is this.')],
    fragments: [[
      'A wrist mark carved into the lintel of the first house: a circle with a broken halo. Yours.',
      'A grain store with three tallies on the door: built, full, burned. The fourth line is scratched out.',
      'A child\'s stone ring on a cord, worn smooth. The child who wore it is three thousand years dead.',
      'A map of the sky, painted on a floor, with one star marked that is not up there yet.',
      'The first fire-pit. Ash in layers: cooking, then feasting, then nothing, then cooking again.',
      'A water channel cut by hand, dry. At its head, a stone that fits a hand exactly.',
      'An inscription fragment: WHEN THE ONE WITH NO DUST RETURNS, SHOW HIM THE DOOR.',
      'A second fragment: HE WILL SAY HE HAS NEVER BEEN HERE.',
      'A third fragment: HE IS NOT LYING. HE IS EARLY.',
    ]],
    beats: [
      {
        kind: 'arrival', goal: 'Find the elder\'s telling-stone on the house roof.',
        log: { title: 'THE TELLING-STONE', text: 'Before the first fire, a man came with no dust on him. He slept beside the ring. When he woke he said he had never been here. We built the village so he would have somewhere to come back to.' },
      },
      {
        kind: 'contradiction', goal: 'Read the ring\'s inscription. Then read what stood here before.',
        official: 'THE RING WAS RAISED BY THE PEOPLE OF THE FIRST FIRE', echo: 'THE RING WAS HERE. THE PEOPLE CAME TO IT. - HE SAID NOT TO WRITE THAT DOWN',
        clue: 'cleared', crew: C('niko'), toast: 'RESIDUE READ',
        log: 'The inscription says the village built the ring. The residue says the ring was here first, and that someone told them not to write it down.',
      },
      encounterQ('elder', ['You came before the first fire.', 'I know that is what you will say. That is what the others said.'], [
        intent('challenge', 'I\'ve never been here.', { lines: says('elder', ['That is what the others said.']), know: 1 }),
        intent('investigate', 'How many others?', { lines: says('elder', ['Enough that we stopped counting and started building. Under the ring there is a chamber. It has your name in it. I have never been able to read it.']), ev: 'others_before' }),
        intent('comfort', 'Thank you for keeping it.', { lines: says('elder', ['We kept it because you asked. Go under. It is yours to read.']), trust: 1 }),
      ], { goal: 'Find the elder by the ring.', after: [N('Under the ring: a chamber, and on its floor a Helix access card bearing the name KAI VAREN, dated three thousand years before Helix.'), K('My card. My name. Nobody has had a card like this for three thousand years.')], gate: 'THE UNDER-CHAMBER' }),
    ],
    outro: [N('Mission 4 ends with a card that cannot exist in a chamber that should not.')],
  }),
  zone({
    key: 'm05', n: 5, chapter: 'act1', name: 'THE VILLAGE THAT NEVER EXISTED', title: 'The settlement, thriving, abandoned, flooded', subtitle: 'Niko follows you through the years.',
    theme: 'settlement', palette: P.settlement, states: ['PAST', 'PRESENT', 'FUTURE'], canal: true, drones: [0, 0, 0], unstable: true, ambience: 'water', ambient: 'settlement',
    labels: { PAST: 'THRIVING', PRESENT: 'ABANDONED', FUTURE: 'FLOODED' },
    rooms: ['THE LIVING VILLAGE', 'THE EMPTY VILLAGE', 'THE DROWNED VILLAGE'], motto: 'THE RIVER WAS TAUGHT TO STAY', gate: 'THE BURIED MACHINE',
    crew: C('niko'),
    intro: [N('The village in three states: thriving in the earliest, abandoned in the middle, flooded in the last. Niko watches you switch.'), ...says('niko', ['You keep changing the world.']), K('I\'m trying to get home.'), ...says('niko', ['Then stop changing it.'])],
    fragments: [[
      'A river-stone with a hand-print. In the earliest state the print is wet.',
      'A retaining wall with a crack running through three centuries.',
      'A pressure gate carved with the same broken halo as the ring, waiting to be released.',
      'A fishing net in a house that is dry in one state and under four metres of water in another.',
      'A ladder leading up out of the flood, with a bundle tied to its top rung. Food. Somebody expected to come back.',
      'A buried panel, far too clean, humming under the mud.',
    ]],
    beats: [
      { kind: 'scene', goal: 'Divert the river at its head, in the earliest state.', scene: 'divert', prompt: 'LIFT THE HEAD-STONE', npc: 'niko', lines: WATER_HOOK, hologram: false },
      { kind: 'scene', goal: 'Reinforce the retaining wall in the middle state.', scene: 'wall', prompt: 'BRACE THE WALL' },
      { kind: 'scene', goal: 'Release the pressure gate in the latest state, then find what is buried.', scene: 'gate', prompt: 'RELEASE THE GATE', after: [N('Under the drained mud: a machine, clean and humming, far more advanced than any year the village has seen.'), ...says('niko', ['Helix did not invent the machine. It found it. So did we. So did everyone.'])] },
    ],
    scenes: {
      divert: { when: '@PAST', lines: [N('The head-stone lifts. The river takes the channel you offer it, and in the next state the houses on the low bank are still standing.')], set: { river_diverted: true, water_route: true }, beatDone: true, log: 'I diverted the river in the earliest state. The ruins downstream changed shape.' },
      divert_no: { lines: [K('The stone only moves in the year it was cut. The earliest one.')] },
      wall: { when: '@PRESENT && river_diverted', lines: [N('Timber against stone. The wall holds. In the flooded state the water now has an edge to stop at.')], set: { wall_braced: true }, beatDone: true, log: 'The wall braced in the middle state gives the flood an edge in the last.' },
      wall_no: { lines: [K('Brace it in the middle year, after the river has been moved.')] },
      gate: { when: '@FUTURE && wall_braced', lines: [N('The gate releases. The water goes out through a channel somebody taught it long ago.')], set: { gate_released: true }, beatDone: true, log: 'The flood drained through the released gate. Under it: the machine.' },
      gate_no: { lines: [K('The gate only answers in the last state, once the wall can hold.')] },
    },
    outro: [N('Niko reveals that Helix did not invent the machine; it found it.')],
  }),
  rooms({
    key: 'm06', n: 6, chapter: 'act1', name: 'THE CLOCKMAKER\'S HOUSE', title: 'A workshop that repeats itself', subtitle: 'The clockmaker says you visited decades ago.',
    deckKey: 'eng', palette: { ...P.helix2, look: 'eng', fog: 0x4a3a2c, wall: '#6b6258', floor: '#5a5c5e', accent: 0xffb020, light: 0xffa04a, tint: 0xffc890, night: 0.35, weather: 'steam', sky: 'warehouse' }, feature: 'time', mechs: ['echo', 'time'],
    states: ['PAST', 'PRESENT', 'FUTURE'], roomsNames: ['THE SHOP FLOOR', 'THE ARM', 'THE HIDDEN STAIR', 'THE ESCAPEMENT', 'THE BACK ROOM'], motto: 'YOU ASK WHAT TIME IT IS. WRONG QUESTION',
    ambience: 'hum', ambient: 'helix',
    beats: [
      { kind: 'arrival', log: { title: 'THE CLOCKMAKER\'S LEDGER', text: 'A customer with no dust on him. Paid in advance for a clock that will not be built for forty years. Asked me to set the arm to repeat. Said he would need to learn it.' }, goal: 'Observe the repeating arm and cross the workshop.' },
      encounterQ('clockmaker', ['You ask what time it is. Wrong question.'], [
        intent('investigate', 'What\'s the right one?', { lines: says('clockmaker', ['Which version of the question are you asking?']), know: 2, ev: 'clock_question' }),
        intent('challenge', 'I\'ve never been in this shop.', { lines: says('clockmaker', ['You said that then as well. You will say it again.']), trust: -1 }),
        intent('comfort', 'How long have you been winding it?', { lines: says('clockmaker', ['Since you asked me to. The stair is behind the escapement. Compare the room with its other years.']), trust: 1 }),
      ], { goal: 'Find the clockmaker.' }),
      { kind: 'scene', goal: 'Set the mechanisms in past, present and future, and find the recording.', scene: 'escapement', prompt: 'SET THE MECHANISM', after: [N('A recording in older Kai\'s voice, hidden in the case:'), L('WITNESS', 'When the child returns, do not let him see the ninth minute.')] },
    ],
    scenes: {
      escapement: { lines: [N('Past, present, future: three positions, one mechanism. It only runs when all three agree.')], set: { clock_set: true, ev_witness_recording: true }, beatDone: true, log: 'A recording of my own older voice: "When the child returns, do not let him see the ninth minute."' },
    },
    outro: [N('A recording warns: when the child returns, do not let him see the ninth minute.')],
  }),
  zone({
    key: 'm07', n: 7, chapter: 'act1', name: 'THE BROKEN OBSERVATORY', title: 'Bronze rings under an open sky', subtitle: 'An ancient observatory, tracking alignments that include your birth.',
    theme: 'tower', palette: P.observatory, states: ['PAST', 'PRESENT', 'FUTURE', 'INVERTED'], canal: true, drones: [0, 1, 2], unstable: true, ambience: 'wind', ambient: 'settlement',
    rooms: ['THE LOWER RING', 'THE INSTRUMENT STAIR', 'THE OUTER RING'], motto: 'THEY DID NOT KNOW WHEN. THEY KNEW WHO', gate: 'THE RING ROOM',
    crew: C('mira'),
    intro: [N('The observatory tracks the sun and the stars across three thousand years. Its rings still turn. Scavengers turn with them, and what they throw lands yesterday.')],
    fragments: [[
      'A bronze instrument aimed at a star that rose in 2026. Somebody has scratched a date beside it. Your birthday.',
      'A rooftop with footprints that go up the wall.',
      'A lens, cracked, through which the city of 2196 can be seen on a clear night. It has never been a clear night.',
      'An inscription on the outer ring: KAI. Just that.',
      'A scavenger\'s cache: three objects that were in your pocket this morning.',
      'A recording cylinder, hidden under the ring, waiting for a woman\'s voice to be played.',
    ]],
    beats: [
      { kind: 'arrival', goal: 'Align the first instrument from the lower roof.', log: { title: 'ALIGNMENT ONE - THE SUN', text: 'Sun at the first notch, in the earliest year. The stone throws its shadow across the second ring, where the next instrument waits.' }, tick: null },
      { kind: 'contradiction', goal: 'Read the dates on the ring. Then read what was carved first.', official: 'ALIGNMENTS: 1077 BC · 2026 · 2049 · 2196', echo: 'KAI VAREN - BORN 14 MARCH 2017 - THE ONE WITH NO DUST', clue: 'cleared', crew: C('mira'), toast: 'RESIDUE READ', log: 'The dates span three thousand years, and one of them is my birthday. They did not know when. They knew who.' },
      E('mira', ['How could they know when you would be born? They didn\'t know when. They knew who.', 'The Chronolith has been anticipating you, Kai. Not recording you. Anticipating.'], { goal: 'Find the hidden recording in the outer ring.', hologram: true, after: [K('Mira\'s voice. A recording. She was nine.')] }),
    ],
    outro: [N('Mira\'s hidden recording implies the Chronolith has been anticipating Kai, not merely recording him.')],
  }),
  rooms({
    key: 'm08', n: 8, chapter: 'act1', name: 'THE FIRST DEATH', title: 'Helix, altered', subtitle: 'The facility you return to is not the one you left.',
    deckKey: 'arch', palette: P.helix2, feature: 'echo', mechs: ['echo', 'gravity', 'sentinel'], states: ['PAST', 'PRESENT', 'INVERTED'], unstable: true,
    roomsNames: ['THE ALTERED LAB', 'STAFF RECORDS', 'THE CORRUPTED LOG', 'CONTAINMENT', 'THE LAST TEN MINUTES'], motto: 'VERSION 17',
    ambience: 'hum', ambient: 'helix',
    beats: [
      { kind: 'arrival', goal: 'Investigate the altered facility: the staff records.', log: { title: 'STAFF RECORDS - REVISED', text: 'VARGA, I. - no record. ROOK, E. - Director. VAREN, K. - Temporal systems engineer, deceased 2026. A researcher named Lin has not come in since the Zero Second. Nobody remembers hiring her.' } },
      { kind: 'contradiction', goal: 'Recover the corrupted security log and read it twice.', official: 'SECURITY LOG 05:40 - CHAMBER CLOSED - NO ENTRY', echo: 'SECURITY LOG 05:40 - DALE OPENS CHAMBER - K. VAREN INSIDE - K. VAREN DOES NOT COME OUT', clue: 'guilty', crew: C('rook'), toast: 'LOG RECONSTRUCTED', log: 'The corrupted log, reconstructed: at 05:40 Dale opened the chamber on Rook\'s order. I was inside. I did not come out. I was also at home, asleep.' },
      { kind: 'scene', goal: 'Reconstruct the last ten minutes before the Zero Second, and escape containment.', scene: 'containment', prompt: 'OPEN THE CONTAINMENT RECORD', npc: 'researcher', lines: [L('CREW', 'Don\'t save me.'), K('Why?'), L('CREW', 'Because I am not the one who died.')], npcWhen: '@PAST', hologram: true, after: [N('The system identifies the current timeline as VERSION 17. No surviving record exists for the previous sixteen.')] },
    ],
    scenes: {
      containment: { lines: [N('The last ten minutes, from the chamber\'s own memory: a man at the console who looks like you. A woman beside him who looks like Lin. At the ninth minute he turns the ring. At the tenth there is one second missing.')], set: { version_17: true, ev_version17: true }, beatDone: true, log: 'The timeline is VERSION 17. The sixteen before it have no surviving record.' },
    },
    outro: [N('VERSION 17. No surviving record exists for the previous sixteen.')],
  }),
];

// =============================================================================================
// ACT II: THE NINE-MINUTE WAR
export const ACT2 = [
  zone({
    key: 'm09', n: 9, chapter: 'act2', name: 'NINE MINUTES TO ZERO', title: 'Loop City', subtitle: 'The city repeats the same nine minutes. Positions change. You do not.',
    theme: 'city', palette: P.loop, states: ['PRESENT', 'PAST', 'INVERTED'], canal: true, drones: [1, 2, 2], loop: 41 * 2, ambience: 'rain', ambient: 'loop',
    rooms: ['CLOCK A - OBSERVATION', 'CLOCK B - THE ENEMY ROUTE', 'THE CONTROL TOWER'], motto: 'YOU HAVE NINE MINUTES', gate: 'THE TOWER',
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
    outro: [N('The city resets, but Kai retains his knowledge and no longer resets with it.')],
  }),
  rooms({
    key: 'm10', n: 10, chapter: 'act2', name: 'ENEMIES WHO REMEMBER', title: 'The Continuum\'s detention block', subtitle: 'They believe time must be controlled. Sera helps you out.',
    deckKey: 'cryo', palette: P.detention, feature: 'sentinel', mechs: ['echo', 'gravity', 'sentinel', 'time'], states: ['PRESENT', 'PAST', 'INVERTED'],
    roomsNames: ['THE DETENTION BLOCK', 'POWER SYSTEMS', 'THE TESTING CHAMBER', 'THE PRISONERS', 'THE YARD'], motto: 'TIME MUST BE CONTROLLED',
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
          intent('comfort', 'Release them.', { lines: [N('The cells open. Eleven walk out. One does not get up. You will be told later that she was already dead in nine of the twelve.')], set: { prisoners_freed: true, echo_step: true }, ev: 'prisoners', beatDone: true }),
          intent('withdraw', 'Leave them stable.', { lines: [N('The loops hold. Twelve people stay safe, four seconds at a time, until somebody else decides.')], set: { prisoners_held: true, echo_step: true }, ev: 'prisoners', beatDone: true }),
        ],
      },
    },
    outro: [N('Kai unlocks Echo Step, a limited-use temporal afterimage.')],
  }),
  rooms({
    key: 'm11', n: 11, chapter: 'act2', name: 'THE INVERTED HOSPITAL', title: 'A hospital in localized inversion', subtitle: 'Some rooms move forward. Others reverse.',
    deckKey: 'med', palette: P.hospital, feature: 'time', mechs: ['time', 'echo'], states: ['INVERTED', 'PRESENT', 'PAST'], unstable: true,
    roomsNames: ['TRIAGE, REVERSED', 'THE QUIET CORRIDOR', 'RECORDS', 'THE REVERSING LOCK', 'WARD 32'], motto: 'TEMPORAL DISCONTINUITY',
    ambience: 'hum', ambient: 'loop',
    beats: [
      { kind: 'arrival', goal: 'Follow the sound that gets quieter as you approach.', log: { title: 'WARD INTERCOM', text: 'Temporal discontinuity. Temporal discontinuity. Temporal discontinuity.' } },
      { kind: 'contradiction', goal: 'Compare the medical records to find the missing patient.', official: 'PATIENT 32 - VAREN, M. - AGE 32 - DISCHARGED', echo: 'PATIENT 32 - VAREN, M. - AGE 9 - DATE OF DEATH: ', clue: 'cleared', crew: C('mira'), toast: 'RECORD COMPARED', log: 'Mira\'s file lists an age of 32, though the record predates the present by 23 years. Her death date is blank.' },
      { kind: 'scene', goal: 'Dismantle the reversing lock in the correct order.', scene: 'lock', prompt: 'THE REVERSING LOCK', npc: 'patient', lines: [L('CREW', 'They put me back together every morning. I would like, once, to stay apart.')], npcWhen: '@INVERTED' },
    ],
    scenes: {
      lock: { when: '@INVERTED', lines: [N('Four bolts. Backwards, they undo themselves in the order they were done. Forwards, they only tighten.')], set: { lock_open: true }, beatDone: true, log: 'The reversing lock comes apart in INVERTED, in the order it was assembled.' },
      lock_no: { lines: [K('Forwards, it only tightens. It has to be undone the way it was done: in reverse.')] },
    },
    outro: [N('Mira\'s file lists an age of 32, though the record predates the present by 23 years; her death date is blank.')],
  }),
  rooms({
    key: 'm12', n: 12, chapter: 'act2', name: 'THE MAN BEHIND THE GLASS', title: 'Helix, three years deep', subtitle: 'A figure changes states to escape you.',
    deckKey: 'eng', palette: P.helix2, feature: 'echo', mechs: ['echo', 'gravity', 'sentinel'], states: ['PRESENT', 'PAST', 'FUTURE', 'INVERTED'], unstable: true,
    roomsNames: ['THE CHASE - 2049', 'THE CORRIDOR THAT WAS - 2026', 'THE RUIN - 2196', 'THE WITNESS\'S ROUTE', 'THE SECOND CHAMBER'], motto: 'THE PERSON YOU BECOME WHEN YOU REFUSE TO LET GO',
    ambience: 'hum', ambient: 'helix',
    beats: [
      { kind: 'arrival', goal: 'Chase the figure through Helix in 2049, then through the corridor that only existed in 2026.', log: { title: 'DOOR LOG - CORRIDOR B', text: 'Corridor B was walled off in 2031. In 2026 it ran straight to the lower chamber. He is using it. He knows the building the way you know it.' } },
      { kind: 'contradiction', goal: 'Reconstruct his route from the repeated fragments.', official: 'MAINTENANCE: NO ACCESS BELOW -3', echo: 'HE GOES DOWN EVERY TIME. HE STOPS AT THE GLASS EVERY TIME. - K.V.', clue: 'cleared', crew: C('witness'), toast: 'ROUTE RECONSTRUCTED', log: 'His route repeats. He always goes down, and he always stops at the glass.' },
      E('witness', ['The person you become when you refuse to let go.'], { goal: 'Enter the chamber containing the second Chronolith.', hologram: false, after: [N('Behind the glass: a second Chronolith, and a man with your face and your wrist scar, older by years he has not told you about. He steps into a fracture and is gone.'), K('That scar. That\'s my scar.')] }),
    ],
    outro: [N('The Witness bears the same wrist scar as Kai and escapes through a fracture.')],
  }),
  zone({
    key: 'm13', n: 13, chapter: 'act2', name: 'THE NINE-MINUTE WAR', title: 'The war zone', subtitle: 'Two factions fight over a stabilizer. Both are reacting to their own past attacks.',
    theme: 'reactor', palette: P.war, states: ['PRESENT', 'PAST', 'FUTURE', 'INVERTED'], canal: true, drones: [2, 2, 3], unstable: true, ambience: 'wind', ambient: 'loop',
    rooms: ['THE BATTLEFIELD', 'THE THREE DEVICES', 'THE STABILIZER'], motto: 'THE FUTURE THAT SURVIVES LONG ENOUGH TO REMEMBER US', gate: 'THE DISTRICT',
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
        kind: 'tasks', goal: 'Disable the three devices, each in its own temporal state.', npc: 'soldier',
        lines: says('soldier', ['You did that already. No - you\'re about to do it. I hate that I know the difference.', 'Three devices. Three years. Nobody on either side can reach all three. You can.']),
        tasks: [
          { state: 'PAST', prompt: 'DEVICE ONE (2026)', lines: [N('The first device, half buried in 2026 soil. It was planted before the war it starts. You pull its core.')] },
          { state: 'PRESENT', prompt: 'DEVICE TWO (2049)', lines: [N('The second device, humming in 2049 at a pitch your teeth remember. You cut it.')] },
          { state: 'FUTURE', prompt: 'DEVICE THREE (2196)', lines: [N('The third device is a ruin in 2196, and still running. You switch off something that has been on for a hundred and forty years.')] },
        ],
        after: [K('Both sides are shooting at their own last attack.'), ...says('soldier', ['Then who fired first?']), K('Nobody. That\'s the point.')],
      },
      { kind: 'choice', goal: 'Destroy the stabilizer, or redirect it to free the trapped population.', scene: 'stabilizer', prompt: 'THE STABILIZER' },
    ],
    scenes: {
      stabilizer: {
        lines: [N('The stabilizer can freeze the district - the war with it - or spend itself freeing the two hundred and twelve people locked in the frozen block.')],
        choices: [
          intent('challenge', 'Destroy it. End the loop.', { lines: [N('The stabilizer goes. The district stops repeating. The war does not, but it is only a war now.'), ...says('sera', ['The Continuum will call that a victory. So will we. Go.'])], set: { faction: 'unwritten', stabilizer_destroyed: true }, ev: 'stabilizer', beatDone: true }),
          intent('comfort', 'Redirect it. Free the people.', { lines: [N('The block thaws. Two hundred and twelve people walk out into a war that is still repeating. The Continuum holds the district now, and it is quiet.'), ...says('sera', ['You chose them over the district. I would have chosen the district. I am glad it was you.'])], set: { faction: 'continuum', civilians_freed: true }, ev: 'stabilizer', beatDone: true }),
        ],
      },
    },
    outro: [N('The choice changes the district and later support options, but does not block the campaign.')],
  }),
];

// =============================================================================================
// ACT III: THE LAST VERSION OF EARTH
export const ACT3 = [
  zone({
    key: 'm14', n: 14, chapter: 'act3', name: 'WELCOME TO 2196', title: 'The 2196 city', subtitle: 'A beautiful, devastated world. Reach the settlement before the Chronolith loses stability.',
    theme: 'ruin', palette: P.future, states: ['FUTURE', 'PRESENT', 'PAST', 'INVERTED'], canal: true, drones: [0, 1, 2], unstable: true, ambience: 'wind', ambient: 'future',
    rooms: ['THE OVERGROWN TOWERS', 'THE TRANSIT LINE', 'THE MEMORIAL'], motto: 'WE TEACH CHILDREN YOUR NAME', gate: 'THE SETTLEMENT',
    crew: C('sera'),
    intro: [N('Skyscrapers wear forests. The transit line runs through a lake. The light is the kindest light you have ever seen, and the Chronolith is losing its grip on you.')],
    fragments: [[
      'A beacon component, scavenged from a car that has not moved in 147 years.',
      'A warden\'s log: UNSTABLE ZONE ON 4TH. DO NOT CROSS BEFORE NOON. IT IS ALWAYS BEFORE NOON.',
      'A gardener\'s planting record on the roof of a bank.',
      'A survivor\'s trail: three stones stacked, then four, then none.',
      'A school book: THE FRACTURE AND THE MAN WHO MADE IT, Chapter One, with your photograph.',
      'The memorial: KAI VAREN, ARCHITECT OF THE FRACTURE. Fresh flowers.',
    ]],
    beats: [
      { kind: 'arrival', goal: 'Traverse the overgrown towers and scavenge a beacon component.', log: { title: 'RETURN BEACON - PART LIST', text: 'Capacitor: the bank\'s roof. Antenna: the transit line. Core: the memorial keeps one. Assemble before the Chronolith lets go of you. Stability out here is not a metaphor.' } },
      { kind: 'contradiction', goal: 'Track the survivors along the transit line. Read the warning, and what it said first.', official: 'UNSTABLE ZONE - DO NOT CROSS', echo: 'SAFE PATH WHEN THE WATER IS LOW - SERA', clue: 'cleared', crew: C('sera'), toast: 'RESIDUE READ', log: 'The warning says do not cross. The residue says there is a safe path when the water is low, signed Sera.' },
      encounterQ('sera', ['We teach children your name before they learn the names of the dead.'], [
        intent('challenge', 'I didn\'t do this.', { lines: says('sera', ['Every version of you denies responsibility. I have met four. You are the first to look at the memorial before saying it.']), know: 2 }),
        intent('investigate', 'How many versions?', { lines: says('sera', ['Four that we recorded. The record is short. We did not have paper for long.']), ev: 'memorial', trust: 1 }),
        intent('comfort', 'Then let me help this one.', { lines: says('sera', ['Help the settlement first. The beacon can wait. The Chronolith cannot, but you can rest here.']), trust: 1 }),
      ], { goal: 'Find Sera at the memorial.' }),
    ],
    outro: [N('Sera reveals that every version of Kai denies responsibility.')],
  }),
  zone({
    key: 'm15', n: 15, chapter: 'act3', name: 'THE CITY THAT FORGOT TOMORROW', title: 'The locked city', subtitle: 'Residents repeat daily routines. Nobody remembers beyond today.',
    theme: 'ruin', palette: { ...P.future, weather: 'motes', fog: 0xc8d0c0 }, states: ['FUTURE', 'PAST', 'PRESENT'], canal: false, drones: [0, 0, 1], loop: 120, ambience: 'wind', ambient: 'future',
    rooms: ['THE STATION, EVACUATING', 'THE SCHOOL, CLOSING', 'THE CENTRAL ARCHIVE'], motto: 'THE WORLDS THAT NEVER FINISHED BECOMING WORLDS', gate: 'THE LOCK',
    crew: C('anja'),
    intro: [N('A city under Anja Vale\'s lock. Every day is the same day. The station evacuates every morning. The school closes every noon. Nobody grieves, because yesterday never arrives.')],
    fragments: [[
      'A station timetable for one day, printed on both sides, forever.',
      'A school register: thirty names, thirty ticks, every day, in the same ink.',
      'A market stall selling the same bread, which is always fresh.',
      'An archive card: THE DISASTER OF THE 14TH. CAUSE: UNDOCUMENTED. CONSEQUENCE: THIS.',
      'A fabricated record, better printed than the real ones. It is the only one that mentions Helix.',
      'Anja\'s note to herself: CHECK THE LOCK AT NOON. YOU HAVE WRITTEN THIS NOTE 3,112 TIMES.',
    ]],
    beats: [
      { kind: 'log', goal: 'Investigate the station reliving its evacuation.', log: { title: 'STATION ANNOUNCEMENT', text: 'All passengers to the last train. The last train is the first train. Please remain calm; you were calm yesterday.' } },
      { kind: 'contradiction', goal: 'Explore the school and the market. Separate causes, consequences and fabricated evidence.', official: 'THE DISASTER OF THE 14TH WAS CAUSED BY HELIX TEMPORAL RESEARCH', echo: 'THE DISASTER OF THE 14TH WAS A FLOOD. SOMEBODY WROTE HELIX ON IT AFTERWARDS. - M.Q.', clue: 'cleared', crew: C('mara'), toast: 'FABRICATION FOUND', log: 'The archive blames Helix for the 14th. The residue says it was a flood, and that someone wrote Helix on it afterwards.' },
      { kind: 'choice', goal: 'Stabilize the city, or free it from the loop.', scene: 'lock', prompt: 'ANJA\'S LOCK', npc: 'anja', lines: says('anja', ['How many worlds has the Chronolith cost?', 'That depends on whether you count the worlds that never finished becoming worlds.']) },
    ],
    scenes: {
      lock: {
        lines: [N('The lock holds the city at one day. Stabilize it and nobody here ever has to grieve. Free it and tomorrow arrives, with everything that was lost.')],
        choices: [
          intent('comfort', 'Stabilize it. Let them rest.', { lines: says('anja', ['Then they rest. I will keep checking the lock at noon. Someone has to remember that it is a lock.']), set: { city_stabilized: true }, ev: 'anja_lock', beatDone: true }),
          intent('challenge', 'Free it. Let tomorrow come.', { lines: says('anja', ['Then it comes. They will hate us for a week and then they will plant things. I would like to see that.']), set: { city_freed: true }, ev: 'anja_lock', beatDone: true }),
        ],
      },
    },
    outro: [N('The player stabilizes the city or frees it from the loop; later allies and dialogue change.')],
  }),
  rooms({
    key: 'm16', n: 16, chapter: 'act3', name: 'THE MUSEUM OF FAILED WORLDS', title: 'An underground museum', subtitle: 'Objects from worlds that no longer exist.',
    deckKey: 'arch', palette: P.museum, feature: 'echo', mechs: ['echo', 'gravity'], states: ['FUTURE', 'PAST', 'PRESENT'],
    roomsNames: ['THE FIRST MEMORY', 'THE SECOND MEMORY', 'THE THIRD MEMORY', 'THE COMPARISON HALL', 'THE PHOTOGRAPH'], motto: 'WE HAD A THOUSAND CHANCES',
    ambience: 'hum', ambient: 'future',
    beats: [
      { kind: 'arrival', goal: 'Play the first memory of the event.', log: { title: 'MEMORY ONE - VERSION 4', text: 'The ring turns. Kai is at the console. Mira is in the chair. The lights go out and only one of them is still there when they come back.' } },
      { kind: 'contradiction', goal: 'Play the second and third memories. Compare the artifacts with the current world.', official: 'MEMORY TWO - VERSION 9 - MIRA AT THE CONSOLE, KAI IN THE CHAIR', echo: 'MEMORY THREE - VERSION 16 - NOBODY AT THE CONSOLE. THE RING TURNS BY ITSELF', clue: 'cleared', crew: C('mara'), toast: 'VERSIONS COMPARED', log: 'Three memories of one event: Kai at the console, Mira at the console, nobody at the console. The ring turns in all three.' },
      E('mara', ['We had a thousand chances. We only needed one that was ours.', 'The photograph is in the last room. I did not hang it. I do not know who did.'], { goal: 'Determine which version explains the museum, and find the photograph.', after: [N('A photograph of older Kai and Mira, together, in a world the museum has no case for.'), K('He kept coming back. He kept bringing her back.')] }),
    ],
    outro: [N('The museum proves the Witness has repeated the experiment many times.')],
  }),
  rooms({
    key: 'm17', n: 17, chapter: 'act3', name: 'THE WITNESS\'S ARCHIVE', title: 'Shifting corridors', subtitle: 'Recordings from multiple versions of your life.',
    deckKey: 'arch', palette: P.archive, feature: 'echo', mechs: ['echo', 'gravity', 'sentinel'], states: ['PRESENT', 'PAST', 'FUTURE', 'INVERTED'], unstable: true,
    roomsNames: ['THE SHIFTING CORRIDOR', 'THE RECORDINGS', 'THE SECURITY THAT MOVES LIKE YOU', 'THE EARLIER ROOMS', 'THE ORIGINAL EXPERIMENT'], motto: 'THEY BECAME THE PRICE',
    ambience: 'hum', ambient: 'liminal',
    beats: [
      { kind: 'arrival', goal: 'Navigate the shifting corridors to the recordings.', log: { title: 'RECORDING 17 OF 117', text: 'Version one hundred and seventeen. She woke. She asked where you were. I did not have an answer she would accept. Beginning again.' } },
      { kind: 'contradiction', goal: 'Match the recordings to the physical evidence. Avoid the security that mimics you.', official: 'EXPERIMENT 1 - SUBJECT: M. VAREN - OUTCOME: SUCCESS', echo: 'EXPERIMENT 1 - SUBJECT: M. VAREN - BODY LOST - NEURAL PATTERN PERSISTS IN THE RING - INCOMPLETE', clue: 'guilty', crew: C('witness'), toast: 'EVIDENCE MATCHED', log: 'Mira\'s original body died. An incomplete neural pattern persisted in the Chronolith. The Witness has been rebuilding her from it, every version.' },
      E('witness', ['You kept bringing her back.'], { goal: 'Use temporal echoes to reach the earlier rooms and reconstruct the original experiment.', hologram: true, after: [K('You kept bringing her back.'), L('WITNESS', 'I kept finding a world where she could exist.'), K('And what happened to those worlds?'), L('WITNESS', 'They became the price.')] }),
    ],
    outro: [N('Mira\'s original body died, but an incomplete neural pattern persisted in the Chronolith.')],
  }),
  zone({
    key: 'm18', n: 18, chapter: 'act3', name: 'THE FRACTURE', title: 'The planet, in three states', subtitle: 'Temporal storms. The landscape changes across the years.',
    theme: 'settlement', themes: ['settlement', 'rain', 'ruin'], palette: P.fracture, states: ['PAST', 'PRESENT', 'FUTURE', 'INVERTED'], canal: true, drones: [0, 2, 3], unstable: true, ambience: 'wind', ambient: 'future',
    rooms: ['THE CANYON THAT EXISTS ONLY IN THE PAST', 'THE FLOODED HIGHWAY', 'THE COLLAPSING SKYSCRAPER'], motto: 'THE ONE BEFORE YOU TRIED TO SAVE ME', gate: 'THE TRANSMISSION TOWER',
    crew: C('mira'),
    intro: [N('Storms stand on the horizon like pillars. The settlement\'s anchor is failing. Sera is at the Chronolith; you are everywhere else.')],
    fragments: [[
      'A settlement evacuation list, every name ticked but one.',
      'A canyon wall with a date: it will not be a canyon in a hundred years.',
      'A highway sign under two metres of water: HELIX NORTH, 3 KM.',
      'A skyscraper floor plan with the floors numbered in the order they fall.',
      'A stabilizer manual, annotated by Sera: THIS PAGE IS WRONG. SO IS THE NEXT ONE.',
      'The transmission tower\'s log: one message, from Mira, pointing somewhere no map names.',
    ]],
    beats: [
      {
        kind: 'tasks', goal: 'Evacuate the settlement before its anchor fails: three houses. Then cross the canyon that exists only in the past.',
        tasks: [
          { prompt: 'KNOCK: THE WATER KEEPERS', lines: [N('A family of four, already packed, as if they had been told yesterday.'), L('CREW', 'The canyon. In the old year. We know.')] },
          { prompt: 'KNOCK: THE POTTER', lines: [N('An old man who will not leave his kiln until you carry the last pot for him.')] },
          { prompt: 'KNOCK: THE SCHOOLHOUSE', lines: [N('Eleven children and a teacher counting them twice. The anchor light over the door is red.')] },
        ],
        after: [N('ANCHOR STATUS: 11%. The settlement walks toward the canyon. The canyon is only there in the earliest year.')],
      },
      { kind: 'log', goal: 'Navigate the flooded highway in the present.', log: { title: 'SERA - ON THE RADIO', text: 'Highway\'s under water in your year. The lamp posts are above it. Walk the lamp posts if you have to, Kai, I am not coming to get you.' } },
      E('mira', ['I remember the first world.'], { goal: 'Traverse the collapsing skyscraper to the transmission tower.', hologram: true, after: [K('Which one?'), L('MIRA', 'The one before you tried to save me.'), N('Her message points toward the Unwritten Second.')] }),
    ],
    outro: [N('Mira\'s message points Kai toward the Unwritten Second.')],
  }),
];

// =============================================================================================
// ACT IV: THE UNWRITTEN SECOND
export const ACT4 = [
  zone({
    key: 'm19', n: 19, chapter: 'act4', name: 'THE PLACE OUTSIDE TIME', title: 'Beyond the Chronolith\'s states', subtitle: 'Roads loop. Rooms connect impossibly. The sky shows an unbuilt city.',
    theme: 'liminal', palette: P.liminal, states: ['PRESENT', 'PAST', 'FUTURE', 'INVERTED'], canal: true, drones: [0, 0, 0], ambience: null, ambient: 'liminal',
    rooms: ['THE LOOPING ROAD', 'THE BRIDGE IN THE REFLECTION', 'THE DOOR THAT IS EVERYWHERE'], motto: 'FOLLOW WHAT THEY REFUSE TO STEP ON', gate: 'THE DOOR',
    crew: C('orren'),
    intro: [N('No markers. No objective. Symbols: the clockmaker\'s mark, the observatory pattern, the Helix badge. They repeat where the way is.'), ...says('orren', ['Don\'t follow the footsteps. Follow what they refuse to step on.'])],
    fragments: [[
      'The clockmaker\'s mark, chalked on a wall that is also a floor.',
      'The observatory pattern, laid out in stones on a road that returns to itself.',
      'A Helix badge, embedded in glass. It is yours. It is not scratched yet.',
      'A reflection with a bridge in it. The water has no bridge.',
      'A door, in several places, all of them the same door.',
      'Mira\'s handwriting on the sky: YOU HAVE BEEN TRYING TO REACH THE VERSION OF ME THAT WOULD FORGIVE YOU.',
    ]],
    beats: [
      { kind: 'arrival', goal: 'Navigate by the recurring symbols, not markers.', log: { title: 'THE FIRST SYMBOL', text: 'The clockmaker\'s mark. Where it appears, the road is real. Where it does not, the road is a loop.' } },
      { kind: 'contradiction', goal: 'Cross the bridge that is visible only in reflections.', official: 'THERE IS NO BRIDGE', echo: 'THERE IS A BRIDGE. YOU ARE STANDING ON IT', clue: 'cleared', crew: C('orren'), toast: 'REFLECTION READ', log: 'The bridge exists in the reflection. In the past it was there. In the past it holds.' },
      E('mira', ['You\'ve been trying to reach the version of me that would forgive you.', 'Saving me is not the same as understanding me, Kai. You keep solving the wrong puzzle.'], { goal: 'Reach the door that appears in several places.', hologram: true }),
    ],
    outro: [N('Mira challenges Kai\'s assumption that saving her is the same as understanding her.')],
  }),
  zone({
    key: 'm20', n: 20, chapter: 'act4', name: 'MIRA\'S MEMORY', title: 'Subjective memories that contradict each other', subtitle: 'Childhood. The original experiment. A timeline where she survives and you do not.',
    theme: 'liminal', palette: P.memory, states: ['PAST', 'PRESENT', 'FUTURE'], canal: false, drones: [0, 0, 0], ambience: null, ambient: 'liminal',
    rooms: ['THE HOUSE WITH THE BLUE DOOR', 'THE FIRST EXPERIMENT', 'THE WORLD WITHOUT KAI'], motto: 'I REMEMBER BEING YOUR SISTER', gate: 'THREE MEMORIES',
    crew: C('mira'),
    intro: [N('Three memories. They do not agree, and they are all hers.')],
    fragments: [[
      'A blue door. Behind it, a kitchen where two children are arguing about a song.',
      'A crayon drawing on a fridge: KAI + MIRA beside a black circle. She drew it. He kept it.',
      'A Helix chair, child-sized. The straps are undone.',
      'A console with a hand-print too small to be an engineer\'s.',
      'A world without Kai: a memorial for nobody, and Mira at thirty-two, planting something.',
      'A voice, faint, on every speaker in a city where nobody has your name: live.',
    ]],
    beats: [
      { kind: 'log', goal: 'Explore Mira\'s childhood with Kai.', log: { title: 'MEMORY - THE BLUE DOOR', text: 'Kai is twelve. He says the song goes up and then up and then it stops. Mira says it goes up, up, and then down. They are both right. It is her memory and she lets him be right.' } },
      { kind: 'contradiction', goal: 'Replay the original experiment.', official: 'EXPERIMENT 1 - SUBJECT CONSENTED', echo: 'EXPERIMENT 1 - SHE WAS NINE. SHE WANTED TO SEE THE RING TURN. HE LET HER', clue: 'guilty', crew: C('witness'), toast: 'MEMORY REPLAYED', log: 'The first experiment: Mira was nine. She wanted to see the ring turn. Older Kai let her. That is the first death.' },
      E('mira', ['I remember being your sister.'], { goal: 'Experience the timeline where Mira survives and Kai disappears. Align three memories without forcing them into one.', hologram: true, after: [K('That\'s not the same thing.'), L('MIRA', 'Would it be enough if I said it was?'), N('Mira is a reconstructed consciousness carrying memories from multiple possible lives. None of them is false.')] }),
    ],
    outro: [N('Kai learns that Mira is a reconstructed consciousness carrying memories from multiple possible lives.')],
  }),
  rooms({
    key: 'm21', n: 21, chapter: 'act4', name: 'THE LAST BATTLE OF THE CONTINUUM', title: 'The command structure', subtitle: 'The Continuum wants one timeline. The Witness wants Mira. The Unwritten want the network gone.',
    deckKey: 'bridge', palette: { ...P.detention, look: 'bridge', accent: 0xffc44a }, feature: 'sentinel', mechs: ['echo', 'gravity', 'sentinel', 'time'], states: ['PRESENT', 'PAST', 'FUTURE', 'INVERTED'], unstable: true,
    roomsNames: ['THE COMMAND STRUCTURE', 'THE ELITE WATCH', 'THE ARENA', 'THE ALLY', 'THE WITNESS'], motto: 'ONE PERMANENT TIMELINE',
    ambience: 'hum', ambient: 'loop',
    beats: [
      { kind: 'arrival', goal: 'Infiltrate the command structure. The elite watchers rewind what you do to them.', log: { title: 'CONTINUUM COMMAND - STANDING ORDER', text: 'One permanent timeline. The Witness is to be allowed through; he is building it for us. The subject Varen is to be held. The Unwritten are to be erased, which is a word we use carefully.' } },
      { kind: 'scene', goal: 'Solve the causal puzzle during the arena collapse, and call on the ally you earned.', scene: 'ally', prompt: 'CALL FOR HELP' },
      E('witness', ['I was trying to find a version of me that didn\'t have to.'], { goal: 'Confront the Witness.', after: [K('And did you?'), L('WITNESS', 'No.'), N('The Witness begins the final experiment.')] }),
    ],
    scenes: {
      ally: {
        lines: [N('The arena is coming down in three years at once. One ally can hold a route open. Whoever you earned.')],
        choices: [
          intent('investigate', 'Sera.', { when: 'faction == "unwritten" || ev_sera_doubt', lines: says('sera', ['Told you I was not coming to get you. I lied. Go.']), set: { ally: 'sera' }, beatDone: true }),
          intent('investigate', 'Anja.', { when: 'ev_anja_lock', lines: says('anja', ['The lock can hold a corridor as easily as a city. Thirty seconds. Run.']), set: { ally: 'anja' }, beatDone: true }),
          intent('investigate', 'Iven.', { when: 'ev_iven_testimony || quest_iven', lines: says('iven', ['Maintenance route. Behind the conduit. Told you nobody uses it.']), set: { ally: 'iven' }, beatDone: true }),
          intent('withdraw', 'Nobody. I go alone.', { lines: [K('Alone, then. I have done this before. Every version of me has.')], set: { ally: 'none' }, beatDone: true }),
        ],
      },
    },
    outro: [N('The Witness begins the final experiment.')],
  }),
  zone({
    key: 'm22', n: 22, chapter: 'act4', name: 'THE FIRST SECOND', title: 'The original activation point', subtitle: 'Previous locations appear around you.',
    theme: 'liminal', themes: ['settlement', 'liminal', 'liminal'], palette: P.liminal, states: ['PAST', 'PRESENT', 'FUTURE', 'INVERTED'], canal: true, drones: [0, 1, 1], unstable: true, ambience: null, ambient: 'liminal',
    rooms: ['THE VILLAGE\'S CHAIN', 'THE CLOCKMAKER\'S PATTERN', 'THE FINAL CHAMBER'], motto: 'YOU WERE TRYING TO STOP ME FROM BECOMING YOU', gate: 'THE FINAL CHAMBER',
    crew: C('witness'),
    intro: [N('Kai and the Witness enter the activation point together. The village, the workshop, the hospital and the museum appear around them like evidence laid on a table.')],
    fragments: [[
      'The village\'s head-stone, here, wet.',
      'The clockmaker\'s arm, repeating. You know its count now.',
      'The hospital\'s reversing lock, undone.',
      'A museum case with your own memory in it, labelled SUBJECTIVE.',
      'A Helix card dated three thousand years ago and a Helix card dated tomorrow.',
      'The Chronolith\'s final chamber, with no door, and a door.',
    ]],
    beats: [
      { kind: 'arrival', goal: 'Infer the causal chain from the ancient village.', log: { title: 'THE CHAIN', text: 'The river was diverted. The wall held. The gate released. The machine was found. The machine was found because the river was diverted. Every cause was you.' } },
      { kind: 'contradiction', goal: 'Read the repeating pattern from the clockmaker\'s house, and the inversion from the hospital. Distinguish evidence from memory.', official: 'MEMORY: KAI ACTIVATED THE CHRONOLITH TO SAVE MIRA', echo: 'EVIDENCE: THE WITNESS TRIED TO PREVENT THE ZERO SECOND 117 TIMES. EACH ATTEMPT WAS THE ZERO SECOND', clue: 'guilty', crew: C('witness'), toast: 'EVIDENCE OVER MEMORY', log: 'The Witness\'s attempts to prevent the Zero Second helped cause it. Every one of them.' },
      E('witness', ['You were trying to stop me from becoming you.'], { goal: 'Open the Chronolith\'s final chamber.', after: [K('I was trying to find a version of me that didn\'t have to.')] }),
    ],
    outro: [N('The Witness\'s attempts to prevent the Zero Second helped cause it.')],
  }),
];

// =============================================================================================
// FINALE: AFTERZERO
export const FINALE = [
  zone({
    key: 'm23', n: 23, chapter: 'finale', name: 'AFTERZERO', title: 'Past, present, future and inversion collide', subtitle: 'Fragments of the opening streets, the settlement, the laboratory and the future city.',
    theme: 'rain', themes: ['rain', 'settlement', 'ruin'], palette: P.fracture, states: ['PAST', 'PRESENT', 'FUTURE', 'INVERTED'], canal: true, drones: [1, 1, 2], unstable: true, ambience: 'rain', ambient: 'rain',
    rooms: ['THE OPENING STREETS', 'THE SETTLEMENT, AGAIN', 'THE ORIGINAL CHRONOLITH'], motto: 'A SECOND THAT BELONGS TO NOBODY', gate: 'THE ORIGINAL CHRONOLITH',
    crew: C('mira'),
    intro: [N('Rain City, the first fire, the lab and 2196, all at once, held open by two men with the same scar.'), L('WITNESS', 'I will hold the route. Go to her.'), K('Why now?'), L('WITNESS', 'Because this is the version where I ask.')],
    fragments: [[
      'The 41, arriving on time, for once, in a street that is also a field.',
      'Jun Park\'s station, quiet. Somebody has turned off the announcement.',
      'The elder\'s telling-stone, with a new line: HE CAME BACK.',
      'The clockmaker\'s clock, finished.',
      'Sera\'s garden, a year old, in a city that has not been fractured.',
      'The original Chronolith, and Mira beside it, not waiting.',
    ]],
    beats: [
      { kind: 'arrival', goal: 'Cross the fragments of the opening streets.', log: { title: 'ROOK - LAST TRANSMISSION', text: 'Kai. I kept the early history from you because it had your name in it, three thousand years early, and I did not know how to say that. The chamber is yours. It always was.' } },
      { kind: 'log', goal: 'Cooperate with the Witness to hold the route through the settlement.', log: { title: 'THE WITNESS - HOLDING', text: 'Route held. I can give you four minutes. I have never given anyone four minutes before. Go.' } },
      { kind: 'choice', goal: 'Reach Mira at the original Chronolith. Choose what to preserve and what to release.', scene: 'ending', prompt: 'THE ORIGINAL CHRONOLITH', npc: 'mira', lines: [K('I thought the answer was to find the right world.'), L('MIRA', 'And now?'), K('Now I think we kept asking the world to pay for our answer.')] },
    ],
    scenes: {
      ending: {
        lines: [N('Three things the ring can do, and only one of them.')],
        choices: [
          intent('challenge', 'Destroy the Chronolith.', { set: { ending: 'A' }, ending: 'A' }),
          intent('investigate', 'Separate the states into independent branches.', { set: { ending: 'B' }, ending: 'B' }),
          intent('comfort', 'Become the anchor. Absorb the contradictions.', { set: { ending: 'C' }, ending: 'C' }),
        ],
      },
    },
    outro: [N('A post-credit clock begins ticking.'), L('VOICE', 'Version one hundred and eighteen.')],
    // quest chain A's consequence: the passengers Kai got off the 41 clear the opening streets
    adjust(level, rt) {
      if (level.sector !== 0 || !rt.g.facts.get('jun_line')) return;
      const rid = level.order[0];
      level.sentinels = [];
      level.rooms[rid].challenges = level.rooms[rid].challenges.filter((c) => c.key !== 'drones');
      level.npcs.push({ id: 'jun_safe', crew: 'jun', pos: [2.6, 0, -8], yaw: Math.PI, room: rid, lines: says('jun', ['Kai. This way. The people you got off the 41 cleared this street for you.', 'Nobody is watching it now. Go on. I will keep the line open.']) });
    },
  }),
];

export const ENDINGS = {
  A: { title: 'THE FIXED WORLD', text: ['Kai destroys the Chronolith. Temporal fractures close and history stabilizes, but Mira\'s reconstructed existence cannot survive.', 'For the first time, tomorrow belonged to tomorrow.'] },
  B: { title: 'THE INFINITE WAR', text: ['Kai separates temporal states into independent branches. Mira survives, but civilizations begin fighting over the boundaries between timelines.', 'We had saved every possible tomorrow. None of them agreed on the future.'] },
  C: { title: 'AFTERZERO', text: ['Kai becomes the anchor that absorbs contradictions. Mira wakes in a world where Kai was never born, with only a faint memory of a voice urging her to live.', 'I finally found a second that belongs to nobody.'] },
};

// =============================================================================================
// OPTIONAL CASES: quest chains B and C (A, Jun Park, and D, Iven Marr, are part of the Prologue)
export const CASES = [
  zone({
    key: 'c_b', n: 'B', chapter: 'cases', name: 'THE WATER THAT REMEMBERS', title: 'Tala and Niko, the Ancient Settlement', subtitle: 'A dry channel in the present was a river in the past.',
    theme: 'settlement', palette: P.settlement, states: ['PRESENT', 'PAST', 'FUTURE'], canal: true, drones: [0, 0], ambience: 'water', ambient: 'settlement',
    rooms: ['THE DRY CHANNEL', 'THE GATES'], motto: 'WHO TAUGHT IT TO STAY', gate: 'THE RUINS',
    crew: C('tala'),
    intro: WATER_HOOK,
    beats: [
      { kind: 'contradiction', goal: 'Follow the water marks. Read the mural, and what it was painted over.', official: 'THE RIVER WAS A GIFT OF THE SKY', echo: 'THE RIVER WAS TAUGHT TO STAY BY THE ONE WITH NO DUST', clue: 'cleared', crew: C('tala'), toast: 'MURAL READ', log: 'The mural says the river was a gift. Under it: the river was taught to stay by the one with no dust.' },
      { kind: 'scene', goal: 'Find the three stone gates and align the flow without flooding the houses.', scene: 'gates', prompt: 'THE THREE GATES', npc: 'tala', lines: says('tala', ['Three gates. Stone does not argue, it only waits.']) },
    ],
    scenes: {
      gates: { when: '@PAST', lines: [N('Left, right, centre. The water takes the channel and leaves the houses. In 2196 the ruins now have a way through.')], set: { water_route: true, quest_tala: 'resolved' }, beatDone: true, log: 'The water route through the settlement is open in every year, including the ruins.' },
      gates_no: { lines: [K('The gates only move in the year the river was alive.')] },
    },
    outro: [N('Access shortcut, Niko\'s additional observatory clue, and a changed future garden.')],
  }),
  zone({
    key: 'c_c', n: 'C', chapter: 'cases', name: 'TWO RECORDS, ONE DISASTER', title: 'Mara Quill, the 2196 city', subtitle: 'Two archives name different first Chronolith operators.',
    theme: 'ruin', palette: P.future, states: ['FUTURE', 'PAST', 'PRESENT'], canal: false, drones: [0, 1], ambience: 'wind', ambient: 'future',
    rooms: ['THE FIRST ARCHIVE', 'THE SECOND ARCHIVE'], motto: 'TRUE FOR WHOM', gate: 'THE MUSEUM DISPLAY',
    crew: C('mara'),
    intro: MARA_HOOK,
    beats: [
      { kind: 'contradiction', goal: 'Compare the timestamps. Recover the damaged audio cylinder.', official: 'FIRST OPERATOR: E. ROOK - 05:40', echo: 'FIRST OPERATOR: K. VAREN - 05:40', clue: 'cleared', crew: C('mara'), toast: 'BOTH TRUE', log: 'Both records are accurate for different branches. Rook in one. Me in the other. Same minute.' },
      encounterQ('mara', ['Both records are true. Which branch do you want to live in?'], [
        intent('investigate', 'Neither. I want the museum display.', { lines: says('mara', ['Then go and look at it in another year. Displays are honest in the year they were made.']), set: { quest_mara: 'resolved', ev_dual_archive: true }, beatDone: true }),
        intent('comfort', 'I\'m not calling anyone a liar.', { lines: says('mara', ['Good. That is the whole job. Go and look at the display in another year.']), set: { quest_mara: 'resolved', ev_dual_archive: true }, trust: 1, beatDone: true }),
      ], { goal: 'Inspect the museum display in another era.' }),
    ],
    outro: [N('The archive is exposed as incomplete without declaring every survivor a liar.')],
  }),
];

export const ACTS = { act1: ACT1, act2: ACT2, act3: ACT3, act4: ACT4, finale: FINALE, cases: CASES };
