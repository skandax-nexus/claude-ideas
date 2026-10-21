// THE LAST VERSION OF EARTH: Act I, THE WORLD THAT REMEMBERS (Missions 4-8).
import { CAST, WATER_HOOK, intent } from './npcs.js';
import { makeChronolith } from './Build.js';

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
// ACT I: THE WORLD THAT REMEMBERS
export const ACT1 = [
  place({
    key: 'm04', n: 4, chapter: 'act1', name: 'THE MAN FROM THE LAST DAY', title: 'The Ancient Settlement', subtitle: 'A village built around a stone ring. Its leader knows the mark on your wrist.',
    place: 'valley_upper', states: ['PRESENT', 'PAST'], drones: [0, 0, 0], ambience: 'water', ambient: 'settlement',
    labels: { PRESENT: 'THE VILLAGE', PAST: 'BEFORE THE FIRE' }, // three thousand years before Helix: here, now is the village
    motto: 'YOU CAME BEFORE THE FIRST FIRE', gate: 'THE UNDER-CHAMBER',
    crew: C('elder'),
    // the Chronolith as the settlement keeps it: dressed stone with a bronze band, standing inside the ring of
    // standing stones north of the under-chamber (Build.js makeChronolith 'stone'; the same ring Helix digs out)
    overlay(P) {
      const [x, , z] = P.at('underChamber');
      P.col([x - 2.3, 10, z - 10.3, x + 2.3, 14.2, z - 8.9]);
      P.inter.push({ id: 'chronolith_m04', kind: 'scene', scene: 'chronolith_m04', pos: [x, 12.05, z - 9.6], yaw: 0, r: 0, prompt: '', model: () => makeChronolith(0.5, 'stone'), room: P.rid });
    },
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
      ], { goal: 'Find the elder by the ring.', after: [REV(N('Under the ring: a chamber, and on its floor a Helix access card bearing the name KAI VAREN, dated three thousand years before Helix.')), K('My card. My name. Nobody has had a card like this for three thousand years.')], gate: 'THE UNDER-CHAMBER' }),
    ],
    outro: [K('A card that cannot exist, in a chamber that should not. And my name is on it.')],
  }),
  place({
    key: 'm05', n: 5, chapter: 'act1', name: 'THE VILLAGE THAT NEVER EXISTED', title: 'The settlement, thriving, abandoned, flooded', subtitle: 'Niko follows you through the years.',
    place: 'valley_river', states: ['PAST', 'PRESENT', 'FUTURE'], drones: [0, 0, 0], unstable: true, ambience: 'water', ambient: 'settlement',
    named: ['tala'], // (met in this mission's cold open: the settlement's women here wear the Elder's mesh, never Tala's face)
    labels: { PAST: 'THRIVING', PRESENT: 'ABANDONED', FUTURE: 'FLOODED' },
    motto: 'THE RIVER WAS TAUGHT TO STAY', gate: 'THE BURIED MACHINE',
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
      { kind: 'scene', goal: 'Release the pressure gate in the latest state, then find what is buried.', scene: 'gate', prompt: 'RELEASE THE GATE', after: [REV(N('Under the drained mud: a machine, clean and humming, far more advanced than any year the village has seen.')), ...says('niko', ['Helix did not invent the machine. It found it. So did we. So did everyone.'])] },
    ],
    scenes: {
      divert: { when: '@PAST', lines: [N('The head-stone lifts. The river takes the channel you offer it, and in the next state the houses on the low bank are still standing.')], set: { river_diverted: true, water_route: true }, beatDone: true, log: 'I diverted the river in the earliest state. The ruins downstream changed shape.' },
      divert_no: { lines: [K('The stone only moves in the year it was cut. The earliest one.')] },
      wall: { when: '@PRESENT && river_diverted', lines: [N('Timber against stone. The wall holds. In the flooded state the water now has an edge to stop at.')], set: { wall_braced: true }, beatDone: true, log: 'The wall braced in the middle state gives the flood an edge in the last.' },
      wall_no: { lines: [K('Brace it in the middle year, after the river has been moved.')] },
      gate: { when: '@FUTURE && wall_braced', lines: [N('The gate releases. The water goes out through a channel somebody taught it long ago.')], set: { gate_released: true }, beatDone: true, log: 'The flood drained through the released gate. Under it: the machine.' },
      gate_no: { lines: [K('The gate only answers in the last state, once the wall can hold.')] },
    },
    outro: [L('NIKO', 'Now you know what the village knew. Be careful who you tell.'), K('Helix found it. Then who left it here?')],
  }),
  place({
    key: 'm06', n: 6, chapter: 'act1', name: 'THE CLOCKMAKER\'S HOUSE', title: 'A workshop that repeats itself', subtitle: 'The clockmaker says you visited decades ago.',
    place: 'oldtown', states: ['PRESENT', 'PAST', 'FUTURE'], drones: [0, 0, 0], motto: 'YOU ASK WHAT TIME IT IS. WRONG QUESTION',
    ambience: 'hum', ambient: 'rain',
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
    outro: [K('My voice, older. Warning somebody about a child, and a ninth minute.'), N('Somewhere in the workshop, a clock that will not be built for forty years begins to tick.')],
  }),
  place({
    key: 'm07', n: 7, chapter: 'act1', name: 'THE BROKEN OBSERVATORY', title: 'Bronze rings under an open sky', subtitle: 'An ancient observatory, tracking alignments that include your birth.',
    place: 'observatory', states: ['PAST', 'PRESENT', 'FUTURE'], drones: [0, 1, 2], unstable: true, ambience: 'wind', ambient: 'settlement',
    labels: { PAST: 'THE FIRST SKY' },
    motto: 'THEY DID NOT KNOW WHEN. THEY KNEW WHO', gate: 'THE RING ROOM',
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
    outro: [K('It was not recording me. It was waiting for me.')],
  }),
  place({
    key: 'm08', n: 8, chapter: 'act1', name: 'THE FIRST DEATH', title: 'Helix, altered', subtitle: 'The facility you return to is not the one you left.',
    place: 'helix_v17', states: ['PRESENT', 'PAST'], drones: [0, 1, 1], unstable: true, motto: 'VERSION 17',
    ambience: 'hum', ambient: 'helix',
    named: ['receptionist', 'rook', 'guard', 'dale'], // (the altered staff never wear their faces: OVERHAUL.md §5 M8)
    beats: [
      { kind: 'arrival', goal: 'Investigate the altered facility: the staff records.', log: { title: 'STAFF RECORDS - REVISED', text: 'VARGA, I. - no record. ROOK, E. - Director. VAREN, K. - Temporal systems engineer, deceased 2026. A researcher named Lin has not come in since the Zero Second. Nobody remembers hiring her.' } },
      { kind: 'contradiction', goal: 'Recover the corrupted security log and read it twice.', official: 'SECURITY LOG 05:40 - CHAMBER CLOSED - NO ENTRY', echo: 'SECURITY LOG 05:40 - DALE OPENS CHAMBER - K. VAREN INSIDE - K. VAREN DOES NOT COME OUT', clue: 'guilty', crew: C('rook'), toast: 'LOG RECONSTRUCTED', log: 'The corrupted log, reconstructed: at 05:40 Dale opened the chamber on Rook\'s order. I was inside. I did not come out. I was also at home, asleep.' },
      { kind: 'scene', goal: 'Reconstruct the last ten minutes before the Zero Second, and escape containment.', scene: 'containment', prompt: 'OPEN THE CONTAINMENT RECORD', npc: 'researcher', lines: [L('CREW', 'Don\'t save me.'), K('Why?'), L('CREW', 'Because I am not the one who died.')], npcWhen: '@PAST', hologram: true, after: [REV(N('The system identifies the current timeline as VERSION 17. No surviving record exists for the previous sixteen.'))] },
    ],
    scenes: {
      containment: { lines: [N('The last ten minutes, from the chamber\'s own memory: a man at the console who looks like you. A woman beside him who looks like Lin. At the ninth minute he turns the ring. At the tenth there is one second missing.')], set: { version_17: true, ev_version17: true }, beatDone: true, log: 'The timeline is VERSION 17. The sixteen before it have no surviving record.' },
    },
    outro: [N('VERSION 17.'), K('Seventeen. Then where are the other sixteen?')],
  }),
];

