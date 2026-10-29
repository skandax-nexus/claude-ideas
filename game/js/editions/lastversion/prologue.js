// THE LAST VERSION OF EARTH: the Prologue, THE ZERO SECOND (OVERHAUL.md §5 M1-M3; about 97 minutes).
//
//   Mission 1  THE LAST NORMAL DAY   Rain City South, 2049 08:14 (an open district under a dark overcast morning)
//   Mission 2  HELIX GOES DARK       Helix's west wing round the court, at night in the storm, under emergency light
//   Mission 3  THE FIRST SWITCH      Helix's east wing, the court and the 2026 dig, in three years at dawn, noon and mist
//
// Each mission is one map with soft quarters, threads and side stories (Threads.js), a cold open and a hook.
// Lines quoted from the bible are verbatim, with the bible's speakers; the rest follows its voice rules: short in
// danger, longer in safe places, objects and disagreement instead of speeches, phrases that come back changed.
import * as THREE from '../../../vendor/three.module.min.js';
import { Deck, makeClock, makeToy, makeScreen, makeCell, makePanel, makeDrawing, makeChronolith, makeBoard,
  makePhoto, makePhotoStrip, makeThermos, makePolaroid, makeFootprints, makeRaincoat, makePigeon, makePass, makeCoatPegs, makeNotebook, makeLogbook, makePlaque } from './Build.js';
import { DIALOGUE, IVEN_HOOK, intent } from './npcs.js';
import { NO_MODEL } from './processes.js';
import { trainRush, posePeople } from './stagefx.js';

const L = (who, text, when) => (when ? { who, text, when } : { who, text });
const N = (text, when) => L('NONE', text, when);
const K = (text, when) => L('KAI', text, when);
// Rook on the phone, the intercom and the comms (fx 'radio'); in person at the chamber door he is ROOK, dry
const R = (text, when) => ({ ...L('ROOK', text, when), voice: { fx: 'radio' } });
// a person a scene names, in their own recorded voice
const SAYS = (name, id, text, fx) => ({ who: 'CREW', name, color: '#4f6170', voice: { id, ...(fx ? { fx } : {}) }, text });
const CREW = (text, when) => L('CREW', text, when); // (said by the person being talked to, in their voice)
const NONE_MODEL = NO_MODEL; // (a spot with nothing of its own to show: the place is the thing)

// =============================================================================================================
// Mission 1: THE LAST NORMAL DAY
// =============================================================================================================
// what Mission 1's scripted moments say (its fx and step play them; voicelines.js walks them for the packs)
const M01_SAY = {
  clocks: [N('All the clocks stop.')],
  train: [N('The 41 comes in at full speed and does not stop.'), K('Get back! Get off the platform!')],
  wrist: [N('The broken door glass opens your wrist on the way out. A clean curve, like a bracket.'), SAYS('MAN', 'CROWD_M', 'Your wrist—'), K('It\'s nothing. Go.')],
  event: [R('The event lasted one second.'), K('What event?'), R('That\'s the problem. Every recording says it hasn\'t happened yet.')],
  speakers: [N('Every speaker in the station, at once:'), { who: 'VOICE', text: 'Kai Varen. Do not build the machine.', voice: { fx: 'pa' } }],
  face: [N('A woman in the crowd at the far end turns. For one second she has Mira\'s face.'), K('She has our mother\'s face. She has Mira\'s eyes.')],
  follow: [K('Wait. Please, wait.')],
  // the station announcer, through the platform speakers, after a two-tone chime
  // (ambient: the station's own voice, not the story's; it never hides the tap prompt, HUD.storyTalking)
  announcement: [{ who: 'PA', text: 'The 8:14 service to Helix North is now arriving. Yesterday.', voice: { fx: 'pa', cue: 'pa' }, ambient: true }],
};

// the staged moments of LINE 41's platform (cinema.js shots; the landmarks of rain_south): the Zero Second, first the
// stopped clock's face (it hangs on the canopy's first column, facing the plaza stair) with the frozen platform
// behind it, then from high at the platform's east end down across the wreck; after the rescue, from the track bed
// east of the 41, the far platform where a woman turns (the overlay's 'mira', at the foot of the north stair)
export function m01Shots(rt, which) {
  const L = rt.level?.landmarks;
  const pl = L?.platform, cd = L?.carriageDoor;
  if (!pl || !cd) return null;
  // (playtest v2.1 FT-06: the 41 is seen coming: the stopped clock; then from the platform's end down the track as the
  // 41 comes at the camera at full speed (stagefx.trainRush, M01.fx.zeroSecond) and does not stop; at the impact, 2.9 s
  // in, with the score's, the wreck from high at the east end, the lead carriage up on the platform)
  if (which === 'zero') {
    return [
      { cam: [pl[0] - 7, pl[1] + 2.6, pl[2] + 12.5], to: [pl[0] - 8, pl[1] + 2.75, pl[2] + 11], look: [pl[0] - 13.6, pl[1] + 3.5, pl[2] + 6], t: 1.4 },
      { cam: [cd[0] + 16, cd[1] + 1.3, cd[2] + 1.2], to: [cd[0] + 16.4, cd[1] + 1.35, cd[2] + 1.8], look: [cd[0] - 30, cd[1] + 0.4, cd[2] - 8.3], t: 1.5 },
      { cam: [cd[0] + 19, cd[1] + 5.6, cd[2] + 10], to: [cd[0] + 16, cd[1] + 5.0, cd[2] + 9.5], look: [cd[0] - 6, cd[1] + 0.4, cd[2] - 4], t: 6 },
    ];
  }
  // the woman at the far end, from high over the wreck; then nearer, along the platform through the rain, for Kai's
  // line. OVERHAUL §9.5 keeps the glimpse distant and in rain: Dr. Lin wears this face in Mission 2, and Mission 11's
  // reveal that the photograph is Lin must not be given away here, so the second shot stops about nine metres short of
  // her, at Kai's eye height: a woman in a yellow raincoat looking back, her face a few pixels under the hood.
  // (playtest v2.1 FT-05, VX-02: she stood at the far end of the north platform, behind the 41, and the pursuit began
  // with her out of sight. She stands at the east end of Kai's own platform now (pl + [30, 0, -4]), in view of the
  // wreck, and the way she goes, over the barrow crossing beside her, is the first thing he sees her do)
  const m = [pl[0] + 30, pl[1], pl[2] - 4];
  return [
    { cam: [cd[0] + 2, cd[1] + 4.6, cd[2] + 9.5], to: [cd[0] + 5, cd[1] + 3.8, cd[2] + 9], look: [m[0], m[1] + 1.5, m[2]], t: 3.4 },
    { cam: [m[0] - 13, m[1] + 1.7, m[2] + 2.6], to: [m[0] - 9.2, m[1] + 1.65, m[2] + 1.8], look: [m[0], m[1] + 1.3, m[2]], t: 5 },
  ];
}

const M01_HINTS = {
  photo: ['The photo. It always starts with the photo.', 'Beside my door, at eye height.', 'Look at the photo beside the door.'],
  anomalies: ['Things are wrong on this street. Look at them.', 'A toy, a clock, a shop camera, a puddle, a pigeon.', 'The toy by the market, the plaza clock, the laundromat screen.'],
  deduce: ['Three wrong things is not weather.', 'Which way are they all going?', 'Piece it together at the plaza clock.'],
  rook: ['Work is north.', 'Up the avenue to the plaza.', 'Walk north into the plaza.'],
  checkpoint: ['The checkpoint is a conversation.', 'The officer at the booth by the bridge.', 'Talk to the officer at the booth.'],
  jun: ['Jun Park will know why the board is wrong.', 'His booth is at the west end of the platform.', 'Talk to Jun in the operator\'s booth.'],
  zero: ['The 41 is due.', 'East along the platform.', 'Walk east along the platform.'],
  rescue: ['Two people are trapped in the wreck.', 'One under a bench, one caught in a door.', 'Walk to each of them and pull them free.'],
  voice: ['Listen.', 'Something is in the speakers.', 'Stay here and listen.'],
  chase: ['Keep her in sight.', 'Down the north stair, through the crowd.', 'Follow her past the bus depot and along the fence to the staff gate.'],
  raincoat: ['She left something.', 'Something yellow on the steps.', 'Pick up the raincoat by the staff gate.'],
  gate: ['Rook is through the gate.', 'The staff gate. Nobody is checking any more.', 'Walk in through the staff gate.'],
  florist: ['Flowers. Same as every year.', 'The florist on the market lane.', 'Talk to the florist.'],
  booth: ['The photo booth printed something.', 'The booth on the west side of the plaza.', 'Take the strip from the booth.'],
  junHook: ['Jun is talking to an empty carriage.', 'His booth.', 'Talk to Jun.'],
  relay: ['The relay by the maintenance gate.', 'Relay 41-B, at the west end.', 'Look at the relay.'],
  reroute: ['When the announcement plays, it is 8:13 again.', 'Wait at the relay for it.', 'At 8:13, reroute the relay.'],
  choice: ['The bypass held.', 'The line, or the evidence.', 'Use the relay and choose.'],
  child: ['A girl is singing on the platform.', 'At the west end, after the clocks stopped.', 'Talk to the girl with no shadow.'],
};

export const M01 = {
  key: 'm01', n: 1, chapter: 'prologue', name: 'THE LAST NORMAL DAY', title: 'Rain City, 2049', subtitle: 'Eight-fourteen. The 41 is late.',
  logline: 'The last ordinary morning in Rain City.', spoken: M01_SAY,
  // PAST here is not 2026: it is 8:13, the minute before the crash, which the station keeps falling back into (quest chain A)
  place: 'rain_south', sectors: 1, states: ['PRESENT', 'PAST'], drones: [0],
  ambience: 'rain', ambient: 'rain',
  crowdFreeze: 'zero_second && !after_zero', // Rain City's crowds stop with the clocks
  minutes: { main: 25, optional: 10 },
  fragments: [[
    'A wet newspaper on a bench: HELIX DENIES "TIME TESTS" - DIRECTOR ROOK: "WE STUDY CLOCKS, NOT MIRACLES".',
    'A pharmacy receipt dated tomorrow. The total is right. The date is not.',
    'A child\'s mitten on the platform railing. Somebody has tied it there so it will not be lost twice.',
  ]],
  beats: [{ kind: 'custom', goal: 'Get to work.' }],
  // the cold open, before the title: Helix across the river before dawn, one window pulsing; then 08:02 at door 4B
  // (stage: while it plays the place is 05:40, the rain before dawn and one window pulsing in Helix's crescent across
  // the river, its streets empty: rain_south's co_m01 sky features and crowds; the title, 08:02, is the morning again)
  coldOpen: {
    first: true, stage: true, minutes: 2, cue: 'card',
    // (Helix's crescent stands due north on the horizon, about 6.5° up, behind the Ring Hill's foot at the district's
    // north edge: the first two shots look at it from high over the plaza and the canal, where the hill is below it;
    // the third finds Kai's door)
    // (timed to the lines: at 9 + 9 s the third shot, Kai's door, came after the narration had ended and was never seen)
    // (playtest v2.1 FT-10: the third shot glided from [24, 12, -20] through the block east of Kai's door, its colliders
    // [14, 3.4, -16]..[46, 23.8, 12], and showed window quads floating on black. It is taken from across the avenue now, at
    // a passer-by's height: the whole block, its roofline on the sky, the door, and his window on the fourth floor, where
    // the phone lights the glass (overlay). Kai is not drawn at his door meanwhile: he is upstairs, asleep)
    shots: [{ cam: [0, 20, -104], to: [0, 23, -132], look: [14, 62, -560], t: 4 }, { cam: [-6, 30, -150], to: [-2, 32, -172], look: [12, 66, -560], t: 5 },
      { cam: [-8, 2.4, -17], to: [-7, 3.4, -10], look: [14, 10, -2.2], t: 7, hide: true }],
    lines: [N('Rain City. 05:40.'), N('At Helix Temporal Research, a card opens Chamber One. The name on the card is KAI VAREN.'), N('Kai Varen is asleep, four kilometres away. His phone lights once on the table. One voicemail. He does not wake.')],
    title: { lines: [N('08:02.'), K('Twenty-three years today.'), K('I\'ll go after work. I always go after work.'), K('The 41 is late. The 41 is never late.')] },
  },
  quarters: [
    {
      name: 'HOME & MARKET',
      threads: [
        // (walked past once Kai is out on the avenue: anything found there, or Rook's call; else the objective would send
        // him back to his door for the rest of the mission: U6 review)
        { id: 'photo', kind: 'scene', scene: 'photo', at: 'photoByDoor', spot: { prompt: 'LOOK AT THE PHOTO', offset: [0, 0, 0], r: 2.6, model: makePhoto },
          until: 'ev_toy || ev_clock || ev_camera || ev_puddle || ev_pigeon || ev_helix_window || ev_florist || rook_message',
          goal: 'Look at the photo by the door.', because: 'It is the anniversary. It always starts at the door.', done: 'ev_mira_photo', hints: M01_HINTS.photo, minutes: 1 },
        // (the things on the avenue that run backwards; the roof's view of Helix, one window pulsing, is a sight, not one
        // of them: the deduction asks about the ones Kai found)
        { id: 'anomalies', kind: 'clue', need: 3, of: ['ev_toy', 'ev_clock', 'ev_camera', 'ev_puddle', 'ev_pigeon'], until: 'checkpoint_passed',
          spots: [
            { id: 'puddle', scene: 'puddle', at: 'puddle', prompt: 'WATCH THE PUDDLE', offset: [0, 0.5, 0], r: 2.8, model: NONE_MODEL },
            { id: 'pigeon', scene: 'pigeon', at: 'pigeonLedge', prompt: 'THE PIGEON', offset: [0, 0.32, 0], r: 7.5, model: makePigeon },
            { id: 'helix_view', scene: 'helix_view', at: 'roofTerrace', prompt: 'LOOK AT HELIX', offset: [0, 1.4, -3], r: 3.2, model: NONE_MODEL },
          ],
          goal: 'Something on the avenue is running backwards. Find three things that are wrong.', because: 'A city does not do that. Not even this one.', hints: M01_HINTS.anomalies, minutes: 4 },
        { id: 'deduce', kind: 'deduce', deduction: 'minute', at: 'plazaClock', after: ['anomalies'], until: 'checkpoint_passed', spotOpts: { offset: [1.4, 1.3, 1.2], r: 2.8 },
          goal: 'Put it together: which way is everything wrong going?', because: 'Three wrong things in one morning is not a coincidence.', hints: M01_HINTS.deduce, minutes: 2 },
      ],
      sides: [
        { id: 'florist', name: 'THE FLORIST', giver: 'florist', done: 'ev_florist', minutes: 2,
          threads: [{ id: 'florist', kind: 'talk', npc: 'florist', at: 'floristStall', goal: 'Buy the white chrysanthemums. Same as every year.', because: 'Twenty-three years today.', done: 'ev_florist', hints: M01_HINTS.florist, minutes: 2 }] },
      ],
    },
    {
      name: 'TRANSIT PLAZA & CHECKPOINT',
      threads: [
        { id: 'rook', kind: 'go', at: 'rookCall', goal: 'Walk north to the transit plaza.', because: 'The 41 is late. Walking is faster than waiting.', done: 'rook_message', hints: M01_HINTS.rook, minutes: 1 },
        { id: 'checkpoint', kind: 'talk', npc: 'guard', at: 'checkpointBooth', goal: 'Get through the Helix checkpoint at the bridge.', because: 'Rook said come in now. Rook never says now.', done: 'checkpoint_passed', hints: M01_HINTS.checkpoint, minutes: 2 },
      ],
      sides: [
        { id: 'booth', name: 'THE CHILD IN THREE PHOTOGRAPHS', giver: 'child', case: 'c_child', done: 'ev_three_photos', minutes: 1,
          threads: [{ id: 'booth', kind: 'scene', scene: 'booth', at: 'photoBooth', spot: { prompt: 'THE PHOTO BOOTH', offset: [0, 1.0, 0.75], r: 2.6, model: makePhotoStrip },
            goal: 'Take the strip from the photo booth.', because: 'Nobody was in the booth. It printed anyway.', done: 'ev_three_photos', hints: M01_HINTS.booth, minutes: 1 }] },
      ],
    },
    {
      name: 'LINE 41',
      threads: [
        { id: 'jun', kind: 'talk', npc: 'jun', at: 'junBooth', after: ['checkpoint'], until: 'zero_second', goal: 'Ask the operator why the board is wrong.', because: 'The board says the 41 arrives yesterday.', done: 'jun_board', hints: M01_HINTS.jun, minutes: 1 },
        { id: 'zero', kind: 'cinema', at: 'platform', after: ['checkpoint'], goal: 'Cross the platform to the staff gate.', because: 'The staff gate is past the station. Rook is waiting.', done: 'after_zero', hints: M01_HINTS.zero, minutes: 2 },
        { id: 'rescue', kind: 'tasks', of: ['rescued_a', 'rescued_b'], after: ['zero'], goal: 'Get the trapped people out of the wreck.', because: 'The 41 came in at full speed. The clocks stopped first.', done: 'wrist_cut', hints: M01_HINTS.rescue, minutes: 3 },
        { id: 'voice', kind: 'cinema', after: ['rescue'], goal: 'Listen.', because: 'Every speaker in the station is about to say something.', done: 'voice_heard', hints: M01_HINTS.voice, minutes: 1 },
        // the pursuit (about 225 m): from the east end of Kai's platform over the barrow crossing, west along the north
        // platform to its stair, down it, east across the concourse through the people streaming out of the station,
        // through the bus depot between its posts, back west along the Helix fence, and into the crowd at the staff gate,
        // where she is gone (the bible: she vanishes into the crowd). Its fact is mira_gone, so a save from before the
        // threads (which had mira_gone and no chase) has it done. She sets off only once Kai can see her (step)
        { id: 'chase', kind: 'chase', npc: 'mira', after: ['voice'], done: 'mira_gone', leash: 14, ahead: 10, speed: 1.7,
          path: [[29.5, 3.4, -163], [29.5, 3.4, -166], [29.5, 2.4, -170.5], [29.5, 2.4, -171.5], [29.5, 3.4, -176], [26, 3.4, -181], [6, 3.4, -183.6], [0, 3.4, -186.4], [0, 0.15, -193.8], [16, 0.15, -199], [40, 0.15, -203], [52, 0, -210.5], [80, 0, -210.5], [82, 0, -219], [64, 0, -219.5], [40, 0.15, -219.5], [12, 0.15, -219.5], [1, 0.15, -222.4]],
          set: { mira_gone: true }, say: [N('By the staff gate the crowd closes round her. When it opens again she is gone. On the wet steps lies a yellow raincoat.')],
          goal: 'Follow the woman with Mira\'s face.', because: 'She has been dead for twenty-three years.', hints: M01_HINTS.chase, minutes: 3 },
        // (3 m in front of the gate, out of the way on through it: main.js's exit box reaches 2 m out from the gate)
        { id: 'raincoat', kind: 'scene', scene: 'raincoat', at: 'staffGate', after: ['chase'], spot: { prompt: 'THE YELLOW RAINCOAT', offset: [-1.0, 1.15, -3.0], r: 2.6, model: makeRaincoat, when: 'mira_gone && !raincoat' },
          goal: 'She left something on the steps.', because: 'The crowd closed round her by the gate. Nobody saw her go.', done: 'raincoat', hints: M01_HINTS.raincoat, minutes: 1 },
        // (playtest v2.1 FT-15: after the raincoat the objective was the general "The next door is open", with nothing at
        // the gate to say it was the way: now the gate is the objective, lit and lettered, open once the raincoat is his
        // (M01.done), and the objective until he is through it (exit: Runtime.objectiveParts). Its own arrival is beyond
        // the gate: a box round the gate that held the raincoat's spot finished it as the raincoat was taken, and the
        // objective was the general one again)
        { id: 'gate', kind: 'go', at: 'staffGate', box: [-2.6, -226.6, 2.6, -224.4], exit: true, after: ['raincoat'], trigWhen: 'raincoat', goal: 'Go in through the staff gate.', because: 'Rook is waiting on the other side. Rook said now.', hints: M01_HINTS.gate, minutes: 1 },
      ],
      sides: [
        { id: 'lasttrain', name: 'LAST TRAIN HOME', giver: 'jun', start: 'quest_jun', done: 'jun_choice', minutes: 6,
          threads: [
            { id: 'junHook', kind: 'talk', npc: 'jun', when: 'zero_second', goal: 'Jun Park keeps apologising to a carriage that isn\'t there.', because: 'Every forty-one seconds the station forgets the crash.', done: 'quest_jun', hints: M01_HINTS.junHook, minutes: 1 },
            { id: 'relay', kind: 'scene', after: ['junHook'], goal: 'Look at relay 41-B by the maintenance gate.', because: 'The gate keeps locking itself back to how it was.', done: 'ev_relay || jun_rerouted', hints: M01_HINTS.relay, minutes: 1 },
            { id: 'reroute', kind: 'scene', after: ['relay'], goal: 'At 8:13, reroute the relay.', because: 'It was live at 8:13. And 8:13 keeps coming back.', done: 'jun_rerouted', hints: M01_HINTS.reroute, minutes: 2 },
            { id: 'junChoice', kind: 'choice', after: ['reroute'], goal: 'The relay: the line, or the evidence.', because: 'It can carry one of them. Not both.', done: 'jun_choice', hints: M01_HINTS.choice, minutes: 2 },
          ] },
        { id: 'child', name: 'THE CHILD IN THE STATION', giver: 'child', done: 'ev_three_notes', minutes: 1,
          threads: [{ id: 'child', kind: 'talk', npc: 'child', when: 'zero_second', goal: 'A girl on the platform is singing to herself.', because: 'She is the only one in the station who is not afraid.', done: 'ev_three_notes', hints: M01_HINTS.child, minutes: 1 }] },
      ],
    },
  ],
  // Mission 1's set pieces, each on its landmark in Rain City South (places/specs/rain_south.js)
  overlay(P, si, { A }) {
    const L = (n) => P.at(n);
    const rid = P.rid;
    const box = (b, o = {}) => P.cols.push({ box: b, mat: 'wall', solid: true, room: rid, ...o });
    // Kai's door
    const [dx, dy, dz] = L('door4B');
    P.texts.push({ text: 'VAREN - 4B', pos: [dx + 1.66, dy + 2.4, dz - 2.6], rotY: -Math.PI / 2, size: 0.3, color: '#ffe0b0', room: rid });
    // his window on the fourth floor, over the door, while the cold open plays (05:40): the phone's light on the glass,
    // cold blue among the warm windows of the block (the cold open's third shot looks up at it: FT-10)
    P.vbox([dx + 1.7, dy + 10.9, dz - 0.95, dx + 1.76, dy + 12.4, dz + 0.45], 'adLit', { w: 'co_m01' });
    // (Rain City's commuters, the queue at the checkpoint and the platform staff are the place's crowds:
    // rain_south's paths, cast by crowds.js. They stop with the clocks at the Zero Second.)
    // --- the anomalies (the puddle, the pigeon and the view from the roof are the anomalies thread's spots) ---------
    const [tx, ty, tz] = L('toyChild');
    A.prop(P, 'bench', tx, tz, 0.4, { y: ty });
    // the toy child: a boy in a red raincoat (yellow is Mira's), silent (crowds.js casts him)
    P.npcs.push({ id: 'amb_child', crew: 'amb_child', first: 'Child', seed: 77, ambient: true, pronoun: { their: 'his', them: 'him' }, pos: [tx - 0.6, ty, tz - 1.7], yaw: 0.4, silent: true, height: 1.26, freezeWhen: 'zero_second && !after_zero', room: rid });
    // the Florist at her stall: her side story
    const [fx, fy, fz, fyaw] = L('floristStall');
    P.npcs.push({ id: 'florist', crew: 'florist', pos: [fx + 0.4, fy, fz + 1.4], yaw: fyaw, prompt: 'TALK TO THE FLORIST', freezeWhen: 'zero_second && !after_zero', room: rid });
    P.inter.push({ id: 'toy', kind: 'scene', scene: 'toy', pos: [tx + 0.4, ty + 0.25, tz - 1.1], r: 2.4, prompt: 'LOOK', model: () => makeToy(), once: true, room: rid });
    const [cx, cy, cz] = L('plazaClock');
    P.inter.push({ id: 'clock', kind: 'scene', scene: 'clock', pos: [cx, cy + 6.15, cz + 0.95], yaw: 0, r: 7, prompt: 'LOOK AT THE CLOCK', model: () => { const m = makeClock({ mode: 'backwards' }); m.scale.setScalar(2.4); return m; }, once: true, room: rid });
    // the shop camera's feed, on the laundromat's back wall over the machines: walk in through its open door to watch it
    const [lx, ly, lz] = L('laundromat');
    P.inter.push({ id: 'camera', kind: 'scene', scene: 'camera', pos: [lx - 0.1, ly + 1.7, lz], yaw: -Math.PI / 2, r: 2.4, prompt: 'WATCH THE FEED', model: () => makeScreen(0xbfe4ff), once: true, room: rid });
    // --- Rook's call, on the way into the plaza: across the whole street, wall to wall and roofs too (the Zero Second
    // waits for it; a strip narrower than the place could be walked round, and the platform would wait for ever)
    const [, , rz] = L('rookCall');
    const [wx0, , wx1] = P.spec.bounds;
    P.triggers.push({ box: [wx0, -1, rz - 3, wx1, 30, rz + 3], set: { rook_message: true }, once: true, room: rid });
    // --- the checkpoint at the bridge: Officer Pryce, Helix security (her conversation is this mission's talks.guard)
    const [bx, by, bz] = L('checkpointBooth');
    A.prop(P, 'booth', bx, bz, 0, { y: by, m: 'helixWhite' });
    P.texts.push({ text: 'CHECKPOINT - HELIX CONTRACTORS', pos: [bx + 4.2, by + 3.4, bz - 3.6], rotY: 0, size: 0.36, color: '#ffc06a', room: rid });
    box([-4.85, by, bz - 6.4, 4.85, by + 2.6, bz - 6.0], { mat: 'door', when: '!checkpoint_passed', id: 'gate_checkpoint', lvMat: 'gateBarrier' });
    P.glow(bx + 4, by + 0.02, bz - 3.5, 3.2, 0xffc06a);
    P.npcs.push({ id: 'guard', crew: 'guard', pos: [bx + 5.4, by, bz - 3.0], yaw: 0, prompt: 'TALK TO THE OFFICER', freezeWhen: 'zero_second && !after_zero', room: rid });
    // --- the station --------------------------------------------------------------------
    const [sx, sy, sz] = L('boardSign');
    // the departures board under the canopy, lettered on both faces (playtest v2.1 FT-17: its lines faced the plaza stair
    // only, and from the platform, where the story is told, it was a black slab): on time from the plaza; once Kai is
    // through the checkpoint, the 41 arriving yesterday, the line Jun is asked about; a lamp over each face
    const board = (text, when, color, dy = 0.1, size = 0.42) => {
      P.texts.push({ text, pos: [sx, sy + dy, sz + 0.08], rotY: 0, size, color, when, room: rid });
      P.texts.push({ text, pos: [sx, sy + dy, sz - 0.12], rotY: Math.PI, size, color, when, room: rid });
    };
    board('LINE 41 - ON TIME - 08:14', '!checkpoint_passed', '#9fd8ff');
    board('LINE 41 - 08:14 - ARRIVING YESTERDAY', 'checkpoint_passed', '#ffc06a');
    P.inter.push({ id: 'board_back', kind: 'scene', scene: 'board', pos: [sx, sy + 0.1, sz - 0.02], r: 0, prompt: '', model: () => makeBoard(5.6, 0.9), room: rid });
    P.vbox([sx - 2.6, sy + 0.62, sz - 0.5, sx + 2.6, sy + 0.66, sz + 0.4], 'lampGlow');
    const [px, py, pz] = L('platform');
    // the station clock hangs on the canopy's column west of the board
    P.inter.push({ id: 'clock_station', kind: 'scene', scene: 'station_clock', pos: [sx - 13.6, py + 3.4, sz - 0.75], yaw: 0, r: 3.4, prompt: 'LOOK AT THE CLOCK', model: () => makeClock({ mode: 'stopped' }), once: true, when: 'zero_second', room: rid });
    P.texts.push({ text: '08:13', pos: [sx - 13.6, py + 4.2, sz - 0.7], rotY: 0, size: 0.5, color: '#ffe0b0', when: '@PAST', room: rid });
    // Jun Park's operator booth, relay 41-B and the maintenance gate (quest chain A, LAST TRAIN HOME)
    const [jx, jy, jz] = L('junBooth');
    A.prop(P, 'booth', jx - 1.4, jz, Math.PI / 2, { y: jy, m: 'boothBlue' });
    P.texts.push({ text: 'OPERATOR', pos: [jx - 0.25, jy + 2.4, jz], rotY: Math.PI / 2, size: 0.3, color: '#ffe0b0', room: rid });
    P.npcs.push({ id: 'jun', crew: 'jun', pos: [jx + 0.4, jy, jz], yaw: Math.PI / 2, dialogue: DIALOGUE.jun, freezeWhen: 'zero_second && !after_zero', room: rid });
    const [ex, ey, ez] = L('relay41B');
    box([ex - 0.5, ey, ez - 1, ex + 0.4, ey + 2.4, ez + 1], { invisible: true });
    P.vbox([ex - 0.5, ey, ez - 1, ex + 0.4, ey + 2.4, ez + 1], 'relayCabinet');
    P.texts.push({ text: 'RELAY 41-B', pos: [ex + 0.45, ey + 2.7, ez], rotY: Math.PI / 2, size: 0.28, color: '#9fd8ff', room: rid });
    const relayAt = [ex + 0.62, ey + 1.4, ez];
    P.inter.push({ id: 'relay', kind: 'scene', scene: 'relay', pos: relayAt, yaw: Math.PI / 2, r: 2.6, prompt: 'INSPECT THE RELAY', model: () => makePanel(0x9fd8ff), when: 'zero_second && !@PAST && !jun_rerouted', room: rid });
    P.inter.push({ id: 'reroute', kind: 'scene', scene: 'reroute', pos: relayAt, yaw: Math.PI / 2, r: 2.6, prompt: 'REROUTE THE POWER (8:13)', model: () => makePanel(0xffd27a), when: '@PAST && !jun_rerouted', room: rid });
    P.inter.push({ id: 'relay_choice', kind: 'scene', scene: 'relay_choice', pos: relayAt, yaw: Math.PI / 2, r: 2.6, prompt: 'THE RELAY: THE LINE, OR THE EVIDENCE', model: () => makePanel(0x7fe0a8), when: 'jun_rerouted && !jun_choice && !@PAST', room: rid });
    const [gx, gy, gz] = L('maintGate41B');
    box([gx - 0.2, gy, gz - 1.6, gx + 0.2, gy + 3.0, gz + 1.6], { mat: 'door', when: '!jun_line', id: 'door_gate41', lvMat: 'gateSteel' });
    P.texts.push({ text: 'MAINTENANCE GATE 41-B', pos: [gx + 0.25, gy + 3.4, gz], rotY: Math.PI / 2, size: 0.28, color: '#ffc06a', room: rid });
    board('LINE 41 - EVACUATION SERVICE - BOARDING', 'jun_line', '#7fe0a8', -0.6, 0.32);
    P.texts.push({ text: 'HELIX EVIDENCE TERMINAL - ONLINE', pos: [jx - 0.25, jy + 1.8, jz], rotY: Math.PI / 2, size: 0.22, color: '#7fe0a8', when: 'jun_evidence', room: rid });
    // the 41, after the Zero Second: a wreck (playtest v2.1 FT-06: three intact carriages had stood in a row along the
    // platform under "The 41 comes in at full speed and does not stop"). The last carriage still on its rails but knocked
    // askew; the middle one jackknifed, its front swung at the platform and rolled onto its side wheels; the lead
    // carriage up on the platform, slewed across it and leaning over it, its nose dug in, a door burst open on the
    // platform side where a man's coat is caught; debris and glass on the stones, smoke over the wreck. It is there from
    // the impact (after_zero: the moving 41 before it is the Zero Second's own effect, M01.fx.zeroSecond)
    const [kx, ky, kz] = L('carriageDoor');
    const WRECK = 'after_zero && !@PAST';
    // a carriage turned and tilted (YXZ, as Scenery places an obox): its pieces placed in its own frame; colliders a row of
    // short boxes along it, so a slewed carriage is not one wide invisible wall
    const rot = ([x, y, z], rx, ry, rz) => {
      let a = x * Math.cos(rz) - y * Math.sin(rz), b = x * Math.sin(rz) + y * Math.cos(rz), c = z;
      [b, c] = [b * Math.cos(rx) - c * Math.sin(rx), b * Math.sin(rx) + c * Math.cos(rx)];
      return [a * Math.cos(ry) + c * Math.sin(ry), b, -a * Math.sin(ry) + c * Math.cos(ry)];
    };
    const carriage = ({ at, len = 17, w = 3.8, h = 3.4, rx = 0, ry = 0, rz = 0, door = 0, burst = false }) => {
      const piece = (lx, ly, lz, pw, ph, pd, m) => {
        const [ox, oy, oz] = rot([lx, ly, lz], rx, ry, rz);
        P.obox(at[0] + ox, at[1] + oy, at[2] + oz, pw, ph, pd, ry, m, { rx, rz, w: WRECK });
      };
      piece(0, 0, 0, len, h, w, 'trainBody');
      for (const sd of [-1, 1]) {
        piece(0, h * 0.5, sd * (w / 2 + 0.02), len - 1, h * 0.3, 0.06, 'carGlass');
        piece(0, h * 0.38, sd * (w / 2 + 0.03), len - 0.2, h * 0.07, 0.07, 'containerOrange');
        if (!(burst && sd === door)) piece(0, h * 0.12, sd * (w / 2 + 0.04), 1.3, h * 0.7, 0.06, 'doorDark');
        piece(sd * (len / 2 + 0.02), h * 0.5, 0, 0.06, h * 0.3, w - 0.7, 'carGlass');
        piece(sd * (len / 2 + 0.03), h * 0.38, 0, 0.07, h * 0.07, w - 0.2, 'containerOrange');
      }
      if (burst) { // the door on the platform side, burst open: its leaf hanging out from the frame, glass gone
        piece(0, h * 0.12, door * (w / 2 + 0.04), 1.3, h * 0.7, 0.04, 'roofDark');
        piece(0.95, h * 0.1, door * (w / 2 + 0.55), 0.06, h * 0.68, 1.0, 'doorDark');
      }
      piece(0, h, 0, len + 0.16, 0.16, w + 0.16, 'roofDark');
      // (and the boxes the conversation camera keeps out of, three down its length round the whole leaning body and a
      // burst door's leaf: the colliders are upright and short, and the reverse shot of PULL HIM FREE stood inside the
      // leaning carriage, a black slab with Kai not in it; v2.1 playtest review, cinema.talkStep)
      for (let i = 0; i < 3; i++) {
        const x0 = -len / 2 + (i * len) / 3, x1 = x0 + len / 3, b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
        for (const lx of [x0, x1]) for (const ly of [-h / 2, h / 2 + 0.2]) for (const lz of [-w / 2 - 0.7, w / 2 + 0.7]) {
          const q = rot([lx, ly + h / 2, lz], rx, ry, rz);
          for (let k = 0; k < 3; k++) { b[k] = Math.min(b[k], at[k] + q[k]); b[k + 3] = Math.max(b[k + 3], at[k] + q[k]); }
        }
        P.camBlocks.push({ box: b.map((v) => +v.toFixed(2)), when: WRECK });
      }
      for (let i = 0; i < 6; i++) { // (its colliders: six short boxes down its length)
        const [cx, , cz] = rot([(i + 0.5) * (len / 6) - len / 2, 0, 0], rx, ry, rz);
        const hx = (Math.abs(Math.cos(ry)) * len) / 12 + (Math.abs(Math.sin(ry)) * w) / 2, hz = (Math.abs(Math.sin(ry)) * len) / 12 + (Math.abs(Math.cos(ry)) * w) / 2;
        P.col([at[0] + cx - hx * 0.9, at[1], at[2] + cz - hz * 0.9, at[0] + cx + hx * 0.9, at[1] + h, at[2] + cz + hz * 0.9], { when: WRECK, mat: 'car' });
      }
    };
    carriage({ at: [kx - 23.5, ky - 1, kz - 8.6], len: 17, ry: 0.035, rx: -0.03 }); // the last: askew on its rails
    carriage({ at: [kx - 5.2, ky - 0.85, kz - 7.2], len: 17, ry: -0.2, rx: 0.3, rz: 0.03 }); // jackknifed, its front at the platform
    carriage({ at: [kx + 6.2, ky + 0.12, kz - 1.65], len: 16, ry: -0.24, rx: 0.2, rz: -0.06, door: 1, burst: true }); // up on the platform
    // the thrown bench, tipped across where the woman lies; glass and debris on the platform; smoke over the wreck
    // (across her thighs: its seat on its edge on her, its back fallen against the platform, a leg in the air)
    P.obox(kx - 3.3, ky + 0.16, kz + 2.2, 1.8, 0.08, 0.5, 1.45, 'wood', { rx: 1.2, w: WRECK });
    P.obox(kx - 3.05, ky + 0.02, kz + 2.12, 1.8, 0.45, 0.06, 1.45, 'wood', { rx: 1.35, w: WRECK });
    for (const dx of [-0.8, 0.8]) P.obox(kx - 3.3 + dx * Math.cos(1.45), ky + 0.12, kz + 2.2 - dx * Math.sin(1.45), 0.08, 0.42, 0.5, 1.45, 'ironDark', { rx: 1.1, w: WRECK });
    P.glow(kx - 2.8, ky + 0.02, kz + 2.4, 3.2, 0xffb890); // (and the fire's light on them: a real lamp at the quality's lamps)
    P.glow(kx + 6, ky + 0.02, kz + 1.8, 3.2, 0xffb890);
    P.col([kx - 3.75, ky, kz + 1.55, kx - 2.95, ky + 0.45, kz + 2.85], { when: WRECK, mat: 'crate' });
    for (let i = 0; i < 14; i++) {
      const dx = -8 + (i * 7.3) % 20, dz = 0.6 + ((i * 3.7) % 4.2);
      P.obox(kx + dx, ky + 0.01, kz + dz, 0.3 + (i % 4) * 0.25, 0.06 + (i % 3) * 0.08, 0.25 + (i % 3) * 0.2, i * 0.9, i % 3 ? 'concreteStained' : 'carGlass', { rx: (i % 5) * 0.1, w: WRECK, prop: 1 });
    }
    for (const [dx, dz, r, hh] of [[1.6, -3.4, 1.4, 9], [-13.5, -8.4, 1.1, 7], [9, -1.2, 0.9, 6]]) P.cyl(kx + dx, ky - 0.6, kz + dz, r, hh, 'smoke', { r2: r * 2.4, seg: 10, w: WRECK, noShadow: 1 });
    P.cyl(kx + 1.4, ky - 0.4, kz - 3.6, 0.7, 0.5, 'fireGlow', { r2: 0.2, seg: 8, w: WRECK, noShadow: 1 });
    P.glow(kx + 2, ky + 0.02, kz - 2, 4, 0xff6a48);
    // the two trapped people, posed where the narration puts them (M01.step): the woman on her back under the thrown
    // bench, her legs under it; the man on his knees against the leaning carriage, his coat caught in its burst door
    // (frozen: they do not turn to Kai, nor walk; the scene and the prompt are theirs as before)
    P.npcs.push({ id: 'trapped_a', crew: 'trapped_a', first: 'Woman', seed: 201, ambient: true, pronoun: { their: 'her', them: 'her' }, pos: [kx - 3.95, ky, kz + 2.2], yaw: -Math.PI / 2, pose: 'pinned', talkAt: [1.2, 0.3, 0], freezeWhen: 'true', when: 'after_zero && !rescued_a', scene: 'rescue_a', prompt: 'PULL HER FREE', room: rid });
    P.npcs.push({ id: 'trapped_b', crew: 'trapped_b', first: 'Man', seed: 202, ambient: true, pronoun: { their: 'his', them: 'him' }, pos: [kx + 6, ky, kz + 0.95], yaw: -0.24, pose: 'caught', talkAt: [0, 1.6, 0], freezeWhen: 'true', when: 'after_zero && !rescued_b', scene: 'rescue_b', prompt: 'PULL HIM FREE', room: rid });
    // his coat, caught: from his shoulders back into the burst door
    P.obox(kx + 6.02, ky + 0.55, kz + 0.7, 0.8, 1.25, 0.05, -0.24, 'linen', { rx: -0.66, w: 'after_zero && !rescued_b && !@PAST' });
    // the Child in the Station (her side story): only after the clocks stop
    P.npcs.push({ id: 'child', crew: 'child', pos: [px - 31, py, pz - 7], yaw: 0.6, hologram: true, height: 1.22, when: 'zero_second', barks: ['Do you know the song? It goes up and then it goes up again and then it stops.'], room: rid });
    // the woman with Mira's face, at the far end of Kai's platform, by the barrow crossing: she walks to the staff gate
    // ahead of Kai (the chase thread), and is gone there
    // (she has turned: she looks back along the platform at the wreck, and at Kai; playtest v2.1 FT-05: in view of him,
    // where she stood behind the 41 before)
    P.npcs.push({ id: 'mira', crew: 'mira', variant: 'raincoat', pos: [px + 30, py, pz - 4], yaw: -Math.PI / 2, silent: true, when: 'voice_heard && !mira_gone', room: rid });
    // the staff gate, once the raincoat is Kai's (playtest v2.1 FT-15): a lamp over the gate and its name on the
    // concourse side, until it opens as he reaches it (the gate thread)
    const [qx, qy, qz] = L('staffGate');
    box([qx - 3, qy + 3.3, qz + 0.34, qx + 3, qy + 3.42, qz + 0.42], { solid: false, when: 'raincoat && !t_m01_gate', lvMat: 'lampGlow' });
    P.texts.push({ text: 'STAFF ENTRANCE', pos: [qx, qy + 3.8, qz + 0.5], rotY: 0, size: 0.38, color: '#7fe0a8', when: 'raincoat', room: rid });
    // the Zero Second: a moment after Jun has told Kai about the board (the rule below), or as soon as Kai walks on
    // east along the platform toward the 41's track without asking
    P.triggers.push({ box: [px + 4, py - 1, pz - 14, px + 35, py + 6, pz + 8], set: { zero_second: true }, once: true, when: 'checkpoint_passed && rook_message', room: rid });
  },
  talks: {
    // Officer Pryce, Helix security, at the checkpoint: every answer gets Kai through
    guard: [
      {
        when: '!checkpoint_passed',
        lines: [CREW('Helix? Badge.'), K('Varen. Temporal systems.'), CREW('Says here you badged into Chamber One at 05:40.'), K('At 05:40 I was asleep.'), CREW('Then somebody\'s been sleepwalking with your card.')],
        choices: [
          intent('investigate', 'Who else came through at 05:40?', { lines: [CREW('Nobody. That\'s what bothers me. My badge record has you. The camera has an empty corridor.'), CREW('Go on through. And Varen: find out who you were.')], set: { checkpoint_passed: true, ev_card_0540: true }, know: 1, log: 'My card opened Chamber One at 05:40, while I slept.' }),
          intent('challenge', 'Then your system is wrong.', { lines: [CREW('My system is the only thing in this city telling the time right this morning. Go through.')], set: { checkpoint_passed: true }, trust: -1 }),
          intent('comfort', 'Long morning?', { lines: [CREW('Longest one yet. Night desk, then this. Go on through, Varen.')], set: { checkpoint_passed: true }, trust: 1 }),
          intent('withdraw', 'I\'ll let them sort it out.', { lines: [CREW('Somebody had better. Go on. You\'re holding up the line.')], set: { checkpoint_passed: true } }),
        ],
      },
      { when: 'checkpoint_passed', lines: [CREW('Staff gate\'s past the platform. Mind the line.')] },
    ],
    // the Florist: white chrysanthemums, and a man who already came in
    florist: [
      {
        when: '!ev_florist',
        lines: [CREW('White chrysanthemums. Same as every year.'), K('Same as every year.'), CREW('Funny. You already came in. Ten minutes ago.'), K('I didn\'t.'),
          CREW('Grey at the temples, same coat, a scar on the wrist. Paid cash. Said you would come in and say you didn\'t.'), K('I don\'t have a scar.'), CREW('Then he was a very good impression.'),
          N('She gives you his receipt with the flowers. 08:04. White chrysanthemums. Paid.')],
        set: { ev_florist: true }, log: 'The florist sold my flowers at 08:04 to an older me, with a scar.',
      },
      { when: 'ev_florist && !wrist_cut', lines: [CREW('Paid for twice. I\'ve never had that before.')] },
      { when: 'wrist_cut', lines: [CREW('That cut. He had one just like it, only older.')] },
    ],
    // the Child in the Station: she sings Kai's way, up, up, stop
    child: [
      {
        when: 'true', lines: [L('CHILD', 'Do you know the song? It goes up and then it goes up again and then it stops.'), N('Under the station lights she has no shadow.')],
        choices: [
          intent('comfort', 'Hum it for me.', { lines: [N('Three notes. Up, up, and a stop. You know it. You have not heard it in twenty-three years.')], ev: 'three_notes', trust: 1 }),
          intent('investigate', 'Where are your parents?', { lines: [L('CHILD', 'In the photo. All three of me are.')], ev: 'three_photos', set: { case_c_child: 'active' } }),
          intent('withdraw', 'Stay where it\'s dry.'),
        ],
      },
    ],
  },
  deductions: {
    // the avenue's anomalies, read together at the plaza clock
    // (the question names what Kai found, and only that: U6 review)
    minute: {
      question: [K('A toy that falls up.', 'ev_toy'), K('A clock running down.', 'ev_clock'), K('A camera showing tomorrow.', 'ev_camera'), K('A ripple that comes before its drop.', 'ev_puddle'),
        K('A pigeon that lands tail first.', 'ev_pigeon'), K('What do they have in common?')],
      answers: [
        { intent: 'investigate', label: 'They\'re all running backwards, toward 8:14.', correct: true, needs: 't_m01_anomalies',
          lines: [K('There\'s a cause. There\'s always a cause.'), K('Everything odd is running backwards toward the same minute: 8:14.'), K('Whatever happens at 8:14, the city already remembers it.')] },
        { intent: 'challenge', label: 'Somebody hacked the city\'s clocks.', lines: [K('A hack doesn\'t put a toy back in a child\'s hand.')] },
        { intent: 'comfort', label: 'I didn\'t sleep. That\'s all this is.', lines: [K('I slept fine. The city didn\'t.')] },
      ],
      unproven: [K('Maybe. I haven\'t seen enough to say it out loud.')],
      set: { ev_minute_814: true }, log: 'Everything odd runs backwards toward 8:14.', reveal: true,
    },
  },
  scenes: {
    photo: { lines: [N('A photograph by the door: a girl of nine in a yellow raincoat and yellow boots, laughing.'), K('Mira. She hated having her picture taken. She loved those boots.')], set: { ev_mira_photo: true } },
    toy: { lines: [N('A child drops a toy. It bounces once, and then it is in his hand again.'), K('I saw that backwards.')], set: { ev_toy: true } },
    clock: { lines: [N('The transit clock runs backward. The second hand is very sure of itself.'), K('Eight-fourteen. Eight-thirteen. Eight-twelve.')], set: { ev_clock: true } },
    camera: { lines: [N('A shop camera, timestamped tomorrow. In it, this corner is empty and the rain has stopped.'), K('That\'s this corner. That\'s tomorrow.')], set: { ev_camera: true } },
    puddle: { lines: [N('A ring spreads across the puddle. Then the drop that made it lands, a second late.'), K('The ripple came first.')], set: { ev_puddle: true } },
    pigeon: { lines: [N('A pigeon lands on the ledge, tail first, its wings folding the wrong way.'), K('It landed backwards. It doesn\'t seem to mind.')], set: { ev_pigeon: true } },
    helix_view: { lines: [N('From the roof, Helix on its hill. One window in the crescent pulses, slow, like a sleeper\'s light.'), K('Chamber One. Nobody should be in there at this hour.')], set: { ev_helix_window: true } },
    booth: { lines: [N('The photo booth has printed a strip for nobody: three photographs of one girl, nine years old.'), N('The dates stamped under them read 2026, 2049 and 2196.'), K('Same girl. Same age. A hundred and seventy years apart.')],
      set: { ev_three_photos: true, case_c_child: 'active' } },
    relay: { lines: [N('Relay 41-B, the feed for the maintenance gate. Burnt through where the 41 hit the line.'), K('Dead now. It was live at 8:13. And 8:13 keeps coming back.')], set: { ev_relay: true } },
    reroute: { lines: [N('8:13. The relay is whole and humming. You throw the bypass before the minute closes.'), K('Rerouted. In a minute that has already happened.')], set: { jun_rerouted: true, ev_gate_resets: true }, log: 'I rerouted the relay at 8:13. It held.' },
    relay_choice: {
      lines: [N('The bypass held. The relay can carry the repaired line and get the passengers out, or feed the evidence terminal in Jun\'s booth. Not both.')],
      choices: [
        intent('comfort', 'Run the line. Get them home.', { consequence: true, lines: [L('JUN', 'They\'re getting on. Kai, they\'re getting on.'), N('The gate opens. People Jun kept apologizing to walk out of the next carriage.')], set: { jun_line: true, jun_choice: true, quest_jun: 'resolved' }, log: 'I gave the relay to the line. Jun\'s passengers got off.' }),
        intent('investigate', 'Power the evidence terminal.', { consequence: true, lines: [N('The terminal wakes: a Helix order with Rook\'s name on it, timestamped before the Zero Second.'), L('JUN', 'I hope whatever\'s on it is worth a train.')], set: { jun_evidence: true, jun_choice: true, ev_rook_log: true, ev_rook_terminal: true, quest_jun: 'resolved' }, log: 'I powered the evidence terminal. The passengers waited.' }),
      ],
    },
    station_clock: { lines: [N('Eight-fourteen. Every clock in the station agrees, for the first time all day.')], set: { ev_stopped_clock: true } },
    rescue_a: { lines: [N('A woman pinned under a thrown bench, between the carriage and the wall.'), K('Hold on. I\'ve got you. Don\'t look at it, look at me.')], set: { rescued_a: true } },
    rescue_b: { lines: [N('A man with his coat caught in the door of a carriage that is not on the tracks any more.'), K('Arms out of the sleeves. Leave the coat. Leave it.')], set: { rescued_b: true } },
    raincoat: { lines: [N('A yellow raincoat, a woman\'s, folded on the step. It is dry inside.'), K('Dry. In this.')], set: { raincoat: true }, log: 'She left a yellow raincoat, dry inside. I kept it.' },
  },
  // the moments that run in callbacks: a save taken in one plays it again on load, from what it has not set yet
  resumes: [{ when: 'zero_second', until: 'after_zero', fx: 'zeroSecond' }, { when: 'rescued_a && rescued_b', until: 'wrist_cut && voice_heard', fx: 'afterRescue' }],
  rules: [
    { id: 'rook_call', when: 'rook_message', say: [
      R('Kai. Where are you.'), K('Twelve minutes out. The 41 is-'),
      R('Not the front entrance. Staff gate, past the station. Come in now. Something happened in the chamber last night and I need you to tell me it didn\'t.'),
      K('Tell you what didn\'t happen?'), R('Just come in.'),
    ] },
    { id: 'board', when: 'jun_board && checkpoint_passed && rook_message && !zero_second', then: 'zeroSoon' },
    { id: 'zero', when: 'zero_second', then: 'zeroSecond' },
    { id: 'rescued', when: 'rescued_a && rescued_b', set: { rescued: true }, then: 'afterRescue' },
  ],
  // the hook (§5 M1): the voicemail stays unheard until Mission 12
  hook: { cue: 'cliff', minutes: 2, lines: [K('She died twenty-three years ago. I was at the funeral. I was twelve.'), N('One voicemail. Received 05:40. Caller unknown.'), K('Not now.'), N('The staff gate is open. Nobody is checking badges any more.')] },
  // (the raincoat opens the staff gate; the gate thread stays the objective until Kai is through it)
  done: 'raincoat',
  // mission-specific behaviour the runtime calls by name
  fx: {
    // Jun has said the board is wrong: the minute comes
    zeroSoon(rt) {
      const g = rt.g;
      g.after(2.5, () => rt.deck?.key === 'm01' && !g.facts.get('zero_second') && g.facts.set('zero_second'));
    },
    zeroSecond(rt) {
      const g = rt.g;
      g.hud.flash('rgba(255,255,255,0.7)');
      g.deckWorld.flags.freeze_people = true;
      g.deckWorld.refresh();
      g.weather.set(null);
      // the Zero Second, staged (cinema.js: letterboxed, Kai held): the stopped clock, then the 41 coming in down the track
      // at full speed, and the wreck. Its cue (score.js 'zero'): the ticks stop, one second of silence under the narration,
      // the horn, the brakes, the impact at 2.9 s; the 41 is drawn coming (stagefx.trainRush) and the wreck is there from
      // the impact (after_zero: the overlay's carriages, and the two people trapped in it)
      rt.cinema.play({ shots: m01Shots(rt, 'zero'), lines: [...M01_SAY.clocks, ...M01_SAY.train], cue: 'zero' });
      const cd = rt.level?.landmarks?.carriageDoor;
      let train = null;
      if (cd && rt.cinema.addFx) g.after(1.0, () => { if (!g.facts.get('after_zero')) train = rt.cinema.addFx(trainRush({ from: [cd[0] - 56, cd[1] - 1, cd[2] - 8.3], dir: 1, speed: 34 })); });
      g.after(1.1, () => g.weather.set('rain'));
      g.after(2.9, () => {
        train?.stop();
        g.audio.caught();
        g.hud.flash('rgba(255,150,110,0.75)');
        if (cd) g.fx?.burst?.([cd[0] + 4, cd[1] + 1.2, cd[2] - 2], 0xffc8a0, 40, 2.6);
        g.deckWorld.flags.freeze_people = false;
        g.facts.set('after_zero');
        g.deckWorld.refresh?.();
      });
    },
    // the second rescue: the glass opens Kai's wrist; Rook; the voice in every speaker; the woman with Mira's face.
    // (Played again after a load that cut it off (resumes): each part only if what it sets is not set yet; a save from
    // before the threads, which had the voice and not the wrist, gets the wrist)
    afterRescue(rt) {
      const g = rt.g, f = g.facts;
      const voice = () => {
        if (f.get('voice_heard')) return;
        g.after(0.6, () => g.hud.say(M01_SAY.event, f, () => {
          // staged (cinema.js): every speaker in the station at once, over Kai; then the woman at the far end, from
          // high over the wreck. Kai's "Wait" is said as he is let go, to follow her
          rt.cinema.play({ shots: 'default', lines: M01_SAY.speakers }, () => {
            f.set('voice_heard');
            g.deckWorld.refresh();
            rt.cinema.play({ shots: m01Shots(rt, 'face'), lines: M01_SAY.face }, () => g.hud.say(M01_SAY.follow, f));
          });
        }));
      };
      if (f.get('wrist_cut')) return voice();
      g.after(0.4, () => g.hud.say(M01_SAY.wrist, f, () => {
        f.set('wrist_cut');
        voice();
      }));
    },
  },
  // the announcement repeats every 41 seconds
  step(rt, dt) {
    const g = rt.g;
    const f = g.facts;
    // the two trapped in the wreck, posed (playtest v2.1 FT-06: both stood upright beside Kai under "A woman pinned under a
    // thrown bench" and "a man with his coat caught in the door"): she lies on her back, her legs under the bench; he is
    // on his knees against the leaning carriage, pulling away from the door that has his coat (stagefx.posePeople)
    if (f.get('after_zero') && !(f.get('rescued_a') && f.get('rescued_b'))) posePeople(g);
    // the pursuit starts only once Kai can see her (playtest v2.1 VX-02: within its 14 m she set off while he stood on
    // the track bed behind the 41, out of sight): until then the leash is nothing, and she waits, looking back at him
    const mira = f.get('voice_heard') && !f.get('mira_gone') ? g.deckWorld.npcs.find((n) => n.n.id === 'mira') : null;
    const ch = mira?.n.chase;
    if (ch && !ch.started && mira.model.visible) {
      const eye = (rt.m01Eye ||= g.player.pos.clone()), dir = (rt.m01Dir ||= g.player.pos.clone());
      eye.copy(g.player.pos);
      eye.y += 0.7;
      dir.copy(mira.model.position);
      dir.y += 1.5;
      dir.sub(eye);
      const d = dir.length();
      dir.divideScalar(d || 1);
      ch.leash = d < 14 && g.player.rayDistance(eye, dir, d) >= d - 0.4 ? 14 : 0;
    } else if (ch) ch.leash = 14;
    // the map's district is named for the quarter Kai is in (playtest v2.1 FT-08: HOME & MARKET at the station too)
    const q = rt.level?.quarters?.[rt.threads?.here ?? g.campaign?.quarter ?? 0], md = g.minimap?.data;
    if (q && md === rt.level.map && md.rooms?.[0] && md.rooms[0].name !== q.name) md.rooms[0].name = q.name;
    const plat = rt.level?.landmarks?.platform;
    if (f.get('after_zero') && plat && g.player.pos.z < plat[2] + 10 && g.player.pos.y > plat[1] - 1.5) {
      rt.annT = (rt.annT ?? 38) + dt;
      if (rt.annT >= 41 && !g.hud.talking) {
        rt.annT = 0;
        g.hud.say(M01_SAY.announcement, f);
        // quest chain A: with the announcement the station falls back to 8:13 for a few seconds
        if (f.get('quest_jun') === 'active' && !f.get('jun_rerouted')) {
          g.engine.setState(g.room, 'PAST', { force: true });
          g.audio.sweep(true);
          if (!g.settings.comfort) g.hud.flash('rgba(255,210,150,0.35)');
          g.hud.toast('<small>08:13</small><br>For a few seconds it is a minute before the crash.', 2600);
          rt.flickT = 7;
        }
      }
    }
    if (rt.flickT > 0 && (rt.flickT -= dt) <= 0) {
      g.engine.setState(g.room, 'PRESENT', { force: true });
      g.audio.sweep(false);
    }
  },
};
M01.outro = M01.hook.lines;

// =============================================================================================================
// Mission 2: HELIX GOES DARK
// =============================================================================================================
// Helix's rooms take the light of their own palette (DeckWorld's few pieces: doors, the gate); the
// place draws everything else in the Helix style (places/specs/helix.js). No Vessel look.
// (closing: visuals; readable on a phone: the emergency light is a red wash over the storm's grey daylight through the windows
// and the lobby's skylight, not a dark red room. It had read as near black)
const HELIX_PALETTE = { emergency: 0.45, fog: 0x3a3234, density: 1.2, wall: '#e8ecf0', floor: '#202428', accent: 0xff6a48, accent2: 0xffb36b, light: 0xffc4b4, tint: 0x8a6a6a, night: 0.4, weather: 'storm', sky: 'night', probe: false, ink: 0.85, daylight: 0xc8d8f0, daylightK: 1.8, grade: { shadowTint: 0x2a1418, highlightTint: 0xffd0bc, toning: 0.2, contrast: 1.1, saturation: 0.94 } };

const T0 = 0.4;

// the ring reveal, Mission 2's hook (cinema.js shots, built where Kai stands when it plays): low behind him, the whole ring
// over him; from beside the ring, back at his face; over his shoulder into the black stone, where his reflection is late.
// (playtest v2.1 FT-18: the hook kept the game's camera, and Rook's head, behind Kai at the door, filled the bottom of
// the frame)
export function m02Reveal(rt) {
  const ring = rt.level?.landmarks?.chamber, p = rt.g.player.pos;
  if (!ring) return null;
  const fy = p.y - 0.86; // (his feet)
  let ux = ring[0] - p.x, uz = ring[2] - p.z;
  const d = Math.hypot(ux, uz) || 1;
  ux /= d;
  uz /= d;
  const sx = -uz, sz = ux; // (to his left, facing the ring)
  const at = (back, side, up) => [p.x - ux * back + sx * side, fy + up, p.z - uz * back + sz * side];
  // the first shot from behind him, on whichever side has nobody in it (playtest v2.1 FT-18 review: 4.2 m behind Kai on
  // the line back to the door is where Rook stands, and his dark back filled the frame in front of the ring). A person
  // is in it when they stand by the camera or within 0.9 m of the line from it to the ring (and to Kai)
  const look0 = [ring[0], ring[1] + 4.0, ring[2]];
  const people = (rt.g.deckWorld?.npcs || []).filter((n) => n.model?.visible).map((n) => n.model.position);
  const near = (a, b, q) => {
    const vx = b[0] - a[0], vy = b[1] - a[1], vz = b[2] - a[2], l2 = vx * vx + vy * vy + vz * vz || 1;
    let best = Infinity;
    for (const h of [0.4, 1.1, 1.7]) {
      const qx = q.x - a[0], qy = q.y + h - a[1], qz = q.z - a[2];
      const t = Math.max(0, Math.min(1, (qx * vx + qy * vy + qz * vz) / l2));
      best = Math.min(best, Math.hypot(qx - t * vx, qy - t * vy, qz - t * vz));
    }
    return best;
  };
  // (and not through a wall: the way from Kai's head to the camera is open)
  const pl = rt.g.player, head = new THREE.Vector3(p.x, fy + 1.4, p.z), dir = new THREE.Vector3();
  const open = (cam) => {
    if (!pl.rayDistance) return true;
    dir.set(cam[0] - head.x, cam[1] - head.y, cam[2] - head.z);
    const len = dir.length() || 1;
    return pl.rayDistance(head, dir.divideScalar(len), len) >= len - 0.05;
  };
  const clear = ([b, sd]) => {
    const cam = at(b, sd, 0.7);
    return open(cam) && people.every((q) => Math.hypot(q.x - p.x, q.z - p.z) < 0.3 || (near(cam, look0, q) > 0.9 && near(cam, [p.x, fy + 1.2, p.z], q) > 0.9));
  };
  const [back0, side0] = [[4.2, 1.8], [4.2, -1.8], [3.4, 3.0], [3.4, -3.0], [2.4, 3.6], [2.4, -3.6]].find(clear) || [4.2, 1.8];
  return [
    { cam: at(back0, side0, 0.7), to: at(back0 - 0.8, side0 * 0.78, 0.8), look: look0 },
    { cam: at(-2.6, -1.0, 1.55), to: at(-2.3, -0.8, 1.5), look: [p.x, fy + 1.55, p.z] },
    { cam: at(1.3, 0.55, 1.75), to: at(1.0, 0.45, 1.7), look: [ring[0], fy + 1.5, ring[2]] },
  ];
}

// the three officers' recordings, each in its speaker's own voice through the recording chain, with a hologram
const REC = {
  pryce: SAYS('OFFICER PRYCE · 05:52', 'PRYCE', 'Pryce, night desk. Chamber door logged shut all night. Nobody went in. I checked the log myself. It is clean. There is nothing to discuss.', 'recording'),
  haig: SAYS('OFFICER HAIG · 05:58', 'HAIG', 'Haig. I was not on shift. I was home. If the roster says otherwise, the roster is wrong.', 'recording'),
  dale: SAYS('OFFICER DALE · 06:01', 'DALE', 'Dale, chamber watch. At 05:40 the door opened on Varen\'s card, on an empty corridor. I logged it. Somebody has edited the log since, and I want that on record.', 'recording'),
};

const M02_HINTS = {
  intercom: ['Someone is calling the lobby.', 'The intercom on the desk.', 'Answer the intercom.'],
  print: ['The glass case by the turnstiles.', 'Helix\'s famous boot print.', 'Look at the print in its case.'],
  lin: ['Someone else is still here.', 'The researcher by the turnstiles.', 'Talk to Dr. Lin.'],
  gallery: ['One cell is past the drone.', 'It only watches what is in front of it.', 'Wait behind a pillar, then take the cell from the east alcove.'],
  cells: ['Three sockets, three cells.', 'The alcove, the gantry, Marr\'s locker.', 'Talk to Iven and his locker opens. Carry each cell to a socket.'],
  records: ['One statement tells the truth.', 'Compare each statement with the roster and the door log.', 'Dale\'s statement matches the door log. Enter Dale\'s code.'],
  unit: ['It rewinds its own damage.', 'The breaker makes the damaged conduit live.', 'Throw the breaker and lead the unit through the conduit.'],
  archive: ['Mira\'s name is in this room.', 'The file, the drawer, the drawing.', 'Open the drawer and look at the drawing.'],
  rook: ['Rook is in the way.', 'He wants to talk first.', 'Talk to Rook.'],
  chamber: ['The ring.', 'Walk up to it. Don\'t touch it.', 'Walk toward the ring.'],
  linDesk: ['Lin\'s things are on this floor.', 'Her coat peg, and her desk in the gallery.', 'Look at the peg marked LIN, and at her desk.'],
  iven: ['Iven Marr is on the plant terrace.', 'His shift notes are on a panel.', 'Talk to Iven and read his notes.'],
  camera: ['The cameras saw something at 05:40.', 'The camera console in the lobby.', 'Watch the 05:40 feed.'],
};

// Mission 2's rooms in Helix's west wing, round the court (the bible's map: ENTRY → DARK CORRIDOR →
// POWER ROOM → LIFT, with the archive): the lobby faces the city, the dark gallery the court, the
// plant terrace is on the first-floor roof, open to the storm, the conduit hall is a glass hall on the court's edge,
// and the glass lift drops into the chamber under the oculus, where Rook is waiting. Helix Court is the hub
// (OVERHAUL.md §4.6): the lobby, the gallery and the staff lounge each have a door onto it, so the court in the storm
// is walked between them, and the stair from the gallery climbs to the terrace over it.
function helixDarkRooms(P, story, si, rt) {
  const D = new Deck({ id: 'm02', deckName: 'HELIX', palette: HELIX_PALETTE, seed: 'lv', states: ['PRESENT'], estimateMin: 40, place: P, start: { at: [-48, 40], rot: 0 } });
  const land = (R, name, at, yaw = 0) => { const w = R.p(at); P.land(name, w[0], w[1], w[2], yaw + R.th); };
  // r0 SECURITY: the double-height lobby, glass to the city and the court
  D.room({ id: 'security', name: 'SECURITY', W: 12, L: 14, H: 9, kind: 'arrival', beat: 'custom', roof: 'glass', windows: { S: 'full', E: 'full' }, gaps: { E: [{ at: [6.5, 9.5] }] } }, (R) => {
    R.floor(0, -R.L, 0, { mat: 'terrazzo' });
    R.text('HELIX TEMPORAL RESEARCH - STAFF', [0, 6.6, -13.9], 0, { size: 0.5, color: '#ffb0a0' });
    R.text('LOCKDOWN IN EFFECT', [-5.9, 3.2, -7], Math.PI / 2, { size: 0.5, color: '#ff6a48' });
    R.prop('desk', -4, -4);
    R.prop('console', -4, -5.2);
    for (const x of [-1.6, 0, 1.6]) R.box([x - 0.08, 0, -9.6, x + 0.08, 1.0, -8.4], { mat: 'trim' }); // turnstiles
    R.box([2.4, 0, -12.6, 4.6, 1.1, -11.6], { mat: 'prop' });
    R.box([2.5, 1.1, -12.5, 4.5, 1.9, -11.7], { mat: 'glass', solid: false }); // the Site Zero print, in its case
    R.text('THE SITE ZERO PRINT - c. 1077 BC', [3.5, 2.2, -11.55], 0, { size: 0.16, color: '#dfe8f0' });
    // Dr. Lin, the researcher nobody remembers hiring (her conversation is this mission's talks.researcher)
    R.npc({ id: 'lin', crew: 'researcher', pos: [4.2, 0, -5], yaw: -Math.PI * 0.75, prompt: 'TALK TO THE RESEARCHER', barks: ['Everything below three is dead. I said that already, didn\'t I.'] });
    R.scene('intercom', [-4, 1.5, -5.6], 'ANSWER THE INTERCOM', { color: 0xff6a48, once: true, scene: 'intercom' });
    R.trigger([-6, -1, -14, 6, 5, -10], { helix_entered: true });
    R.prop('console', -4.4, -12.4);
    land(R, 'lobby', [0, 0, -7]);
    land(R, 'lobbyIntercom', [-4, 1.5, -5.6]);
    land(R, 'sitePrint', [3.5, 1.2, -12.1]);
    land(R, 'linPeg', [5.6, 1.6, -2.2], -Math.PI / 2);
    land(R, 'cameraRoom', [-4.4, 0, -12], Math.PI);
  });
  // r1 DARK CORRIDOR: the west gallery, glass to the court; a malfunctioning drone on a loop, the first cell in an alcove
  // (its door onto the court beside the entry; its stair climbs 4.5 m to the plant terrace on the first-floor roof)
  D.room({ id: 'corridor', name: 'DARK CORRIDOR', W: 16, L: 24, H: 6, windows: { E: [[1, 2.4], [6.6, 9], [15, 23]] }, gaps: { E: [{ at: [3, 6] }] }, corridor: { len: 6, rise: 4.5 } }, (R) => {
    R.floor();
    for (const [x, z] of [[-4, -7], [4, -7], [0, -12], [-4, -17], [4, -17]]) R.pillar(x, z, 0.7);
    R.sentinel({ path: [[-6, -4], [6, -4], [6, -20], [-6, -20]], speed: 1.9, range: 8, fov: 0.8 });
    // the east alcove with cell one, on a cabinet at chest height
    // (playtest v2.1 FT-13: on a 2.4 m box the cell sat 1.2 m over Kai's eye, and its prompt came only with the view
    // tilted up; at 1.1 m it is in front of him as he walks up)
    R.box([7, 0, -14, 8, 1.1, -10], { mat: 'prop' });
    R.item({ id: 'cell_1', kind: 'core', pos: [7.5, 1.45, -12], label: 'POWER CELL' });
    R.text('EMERGENCY LIGHTING - DO NOT RUN', [0, 4.6, -23.9], 0, { size: 0.42, color: '#ff6a48' });
    R.prop('desk', -6.2, -21);
    R.text('DR. LIN', [-6.2, 1.5, -21.5], 0, { size: 0.16, color: '#dfe8f0' });
    R.challenge('helix:drone', 0, -24, M02_HINTS.gallery);
    R.checkpoint(0, -2, -1.6);
    land(R, 'westGallery', [0, 0, -12]);
    land(R, 'linDesk', [-6.2, 0.8, -21]);
    land(R, 'cellA', [7.5, 1.45, -12]);
  });
  // r2 POWER: the plant terrace on the first-floor roof (4.5 m, on the wing's ground storey), open to the storm, its glass
  // over the court: chillers, cable trays, three sockets; Iven Marr under a canopy; a stair back down to the lounge
  D.room({ id: 'power', name: 'PLANT TERRACE', W: 14, L: 18, H: 6.5, roof: 'open', windows: { E: [[2, 16, 1.0, 3.2]] }, corridor: { len: 6, rise: -4.5 } }, (R) => {
    R.floor();
    for (const [i, x] of [[0, -3], [1, 0], [2, 3]]) {
      R.prop('console', x, -16.4);
      R.inter({ id: `socket_${i}`, kind: 'socket', pos: [x, 1.3, -16], r: 2.4, prompt: 'LIFT POWER SOCKET', needs: 'cell', any: true });
    }
    R.text('LIFT POWER  0 / 3', [0, 3.4, -17.9], 0, { size: 0.42, color: '#ffb36b', when: '!cells_1' });
    R.text('LIFT POWER  1 / 3', [0, 3.4, -17.9], 0, { size: 0.42, color: '#ffb36b', when: 'cells_1 && !cells_2' });
    R.text('LIFT POWER  2 / 3', [0, 3.4, -17.9], 0, { size: 0.42, color: '#ffb36b', when: 'cells_2 && !lift_powered' });
    R.text('LIFT POWER  3 / 3 - READY', [0, 3.4, -17.9], 0, { size: 0.42, color: '#7fe0a8', when: 'lift_powered' });
    // a gantry on the west side, up a stair from the floor, with cell two
    // (playtest v2.1 FT-02, VX-01: the stair's first three steps stood inside the chiller, so its lowest open step was
    // above Kai's jump, and its steps were slabs in the air with a sealed gap under them. Now each step is solid down to
    // the floor, the foot is clear, 4 m west of the way in, and the chiller stands beside the stair against the west
    // wall, filling the space between them)
    R.ledge(-7, -14, -3.6, -6, 2.6);
    {
      const n = Math.ceil(2.6 / 0.34), TREAD = 0.6;
      for (let i = 0; i < n; i++) {
        const zz = -6 + (n - i) * TREAD;
        R.box([-5.2, 0, zz - TREAD, -3.8, ((i + 1) * 2.6) / n, zz], { mat: 'prop' });
      }
    }
    R.item({ id: 'cell_2', kind: 'core', pos: [-5.4, 3.05, -11], label: 'POWER CELL' });
    // Iven's locker, east: opens when he gives the code; his post under a canopy
    R.box([5.6, 0, -11, 7, 2.2, -9.4], { mat: 'prop' });
    R.box([5.5, 0, -11, 5.6, 2.2, -9.4], { mat: 'door', when: '!quest_iven', id: 'door_locker' });
    R.item({ id: 'cell_3', kind: 'core', pos: [6.3, 1.0, -10.2], label: 'POWER CELL', when: 'quest_iven' });
    R.text('MARR', [5.45, 1.8, -10.2], -Math.PI / 2, { size: 0.28, color: '#ffb36b' });
    R.box([2.6, 3.0, -9, 7, 3.2, -4.2], { mat: 'trim', solid: false });
    R.npc({ id: 'iven', crew: 'iven', pos: [4.6, 0, -7.4], yaw: -Math.PI * 0.7, dialogue: DIALOGUE.iven, barks: ['I signed nothing. Remember that when they ask.'] });
    R.scene('shift_notes', [6.4, 1.1, -5], 'READ THE SHIFT NOTES', { yaw: -Math.PI / 2, model: () => makePanel(0xffb36b), once: true });
    // the chillers and the cable trays of the plant
    R.box([-7, 0, -6, -5.25, 1.9, -1.4], { mat: 'tank' }); // (beside the gantry stair, never in front of it)
    R.box([-6.6, 0, -17.6, -4.6, 1.6, -15.8], { mat: 'tank' });
    R.box([-7, 2.9, -17, 7, 3.0, -16.6], { mat: 'trimDark', solid: false });
    R.prop('crate', -2.6, -13.2);
    R.checkpoint(0, -2, -1.6);
    land(R, 'plantTerrace', [0, 0, -9]);
    land(R, 'cellB', [-5.4, 3.05, -11]);
    land(R, 'cellC', [6.3, 1.0, -10.2]);
    land(R, 'ivenPost', [4.6, 0, -7.4]);
  });
  // r3 RECORDS: the staff lounge: three recorded statements, the roster, the door log; one officer can be trusted
  D.room({ id: 'records', name: 'STAFF LOUNGE', W: 12, L: 14, H: 6, exit: 'E', windows: { E: [[1, 5.8]], W: [[2, 12, 1.0, 4.6]] }, gaps: { E: [{ at: [6.4, 9.4] }] } }, (R) => {
    R.floor();
    for (const [id, x, crew] of [['rec_pryce', -4, 'guard'], ['rec_haig', 0, 'haig'], ['rec_dale', 4, 'dale']]) {
      R.prop('console', x, -5.4);
      R.scene(id, [x, 1.25, -5], 'PLAY THE RECORDING', { kit: 'recorder' });
      // the officer, as a hologram over the recorder while the statement plays
      R.npc({ id: `holo_${id}`, crew, pos: [x, 0, -6.6], yaw: 0, hologram: true, silent: true, when: `holo_${id.slice(4)}` });
    }
    R.text('ROSTER 05:00 - PRYCE · HAIG · DALE', [-5.9, 3.0, -8], Math.PI / 2, { size: 0.34, color: '#dfe8f0' });
    R.text('CHAMBER DOOR LOG - EDITED 05:50', [5.9, 3.0, -4], -Math.PI / 2, { size: 0.34, color: '#ff6a48' });
    R.scene('door_log', [5.7, 1.6, -4], 'READ THE DOOR LOG', { yaw: -Math.PI / 2, model: () => makePanel(0xff6a48) });
    R.prop('console', 0, -12.6);
    R.scene('whose_code', [0, 1.3, -12.2], 'ENTER AN OFFICER\'S CODE', { model: () => makePanel(0xff6a48) });
    R.box([R.W / 2, 0, -R.L + 0.6, R.W / 2 + T0, 4, -R.L + 3.6], { mat: 'door', when: '!officer_trusted', id: 'door_records' });
    R.checkpoint(0, -2, -1.6);
    land(R, 'staffLounge', [0, 0, -7]);
  });
  // r4 CONDUIT HALL: the glass hall over the court's edge (the skybridge); the unit that rewinds damage; a live conduit
  D.room({ id: 'conduit', name: 'THE SKYBRIDGE', W: 16, L: 24, H: 7, roof: 'glass', windows: { E: 'full', W: [[3, 21, 1.2, 5.6]] } }, (R) => {
    R.floor();
    for (const [x, z] of [[-5, -6], [-5, -12], [-5, -18], [2, -9], [2, -15]]) R.pillar(x, z, 0.65);
    R.box([6.6, 0, -20, 7.4, 1.0, -4], { mat: 'pipe' });
    R.box([6.4, 1.0, -14, 7.6, 1.6, -10], { mat: 'glow', solid: false, when: 'conduit_live' });
    R.text('CONDUIT 4 - DAMAGED', [6.2, 2.6, -12], -Math.PI / 2, { size: 0.4, color: '#ffb36b' });
    R.prop('console', -6.6, -21);
    R.scene('breaker', [-6.6, 1.3, -20.6], 'THROW THE BREAKER', { model: () => makePanel(0xff6a48), once: true });
    R.sentinel({ path: [[-2, -4], [5, -4], [5, -20], [-2, -20]], speed: 2.1, range: 9, fov: 0.85, conduit: [5.4, -15, 8, -9], conduitWhen: 'conduit_live', unit: true });
    R.challenge('helix:unit', 0, -24, M02_HINTS.unit);
    R.box([-1.5, 0, -24.4, 1.5, 4, -24], { mat: 'door', when: '!unit_down', id: 'door_conduit' });
    R.checkpoint(0, -2, -1.6);
    land(R, 'skybridge', [0, 0, -12]);
    land(R, 'conduit', [7, 1, -12]);
  });
  // r5 ARCHIVE: the reading room (old wood, one green lamp): Mira's file, the junior pass drawer, the drawing
  D.room({ id: 'archive', name: 'READING ROOM', W: 12, L: 14, H: 6, windows: { E: [[3, 10, 1.4, 4.2]] } }, (R) => {
    R.floor(0, -R.L, 0, { mat: 'woodFloor' });
    R.prop('shelf', -4, -4, { mat: 'prop2' });
    R.prop('shelf', -4, -8, { mat: 'prop2' });
    R.prop('shelf', 4, -4, { mat: 'prop2' });
    R.prop('desk', 4, -9, { mat: 'prop2' });
    R.box([3.8, 0.78, -9.2, 4.0, 1.3, -9.0], { mat: 'trimDark', solid: false });
    R.box([3.6, 1.3, -9.4, 4.2, 1.5, -8.8], { mat: 'lampGreen', solid: false });
    R.inter({ id: 'mira_file', kind: 'terminal', pos: [4, 1.05, -8.6], yaw: 0, r: 2.4, prompt: 'OPEN THE FILE', log: { title: 'HELIX JUNIOR PROGRAMME - 2026', text: 'VAREN, MIRA. Age nine. Admitted to the junior observation programme by the director\'s office. Status: discharged. Reason for discharge: redacted. Next of kin: VAREN, KAI, age twelve.' }, kit: 'fileFolder' });
    R.box([-5.6, 0, -12.4, -3.6, 1.0, -11.4], { mat: 'prop2' });
    R.scene('drawing', [0, 1.7, -13.85], 'LOOK AT THE DRAWING', { model: () => makeDrawing(), once: true });
    R.text('LIFT - LEVEL -3', [-5.9, 3.2, -11], Math.PI / 2, { size: 0.4, color: '#ffb36b' });
    R.box([-1.5, 0, -14.4, 1.5, 4, -14], { mat: 'door', when: '!lift_powered || !drawing_seen', id: 'door_lift' });
    R.checkpoint(0, -2, -1.6);
    land(R, 'readingRoom', [0, 0, -7]);
    land(R, 'passDrawer', [-4.6, 1.0, -11.9]);
  });
  // r6 THE LIFT: a glass lift into the oculus
  const lift = D.room({ id: 'liftAtrium', name: 'THE LIFT', W: 8, L: 8, H: 6, roof: 'glass', exit: 'none', windows: { E: 'full', W: 'full' } }, (R) => {
    R.floor();
    R.box([-2.2, 0, -7.6, 2.2, 0.12, -3.4], { mat: 'glow', solid: false });
    R.text('LIFT - LEVEL -3 - CHAMBER', [0, 4.2, -7.9], 0, { size: 0.36, color: '#ffb36b' });
    land(R, 'liftAtrium', [0, 0, -5.5]);
  });
  // r7 THE CHRONOLITH CHAMBER, 11.5 m under the oculus; the lift lets you out at its south wall, where Rook stands in the way
  const ch = D.room({ id: 'chamber', name: 'CHRONOLITH CHAMBER', W: 24, L: 24, H: 12, at: [0, 12], rot: 0, y: -11.5, exit: 'E', corridor: { len: 26, rise: 11.5 }, roof: 'glass', closedS: true, kind: 'encounter', beat: 'custom' }, (R) => {
    R.floor(0, -R.L, 0, { mat: 'chamberFloor' });
    R.text('CHAMBER - AUTHORISED PERSONNEL - DIRECTOR\'S OFFICE', [0, 8.2, -23.9], 0, { size: 0.42, color: '#ff6a48' });
    // the ring itself (to look at, not to use), and the place to walk up to it once Rook lets Kai pass
    R.inter({ id: 'chronolith', kind: 'scene', scene: 'ring', pos: [0, 4.6, -12], r: 0, prompt: '', model: () => makeChronolith(1.15, 'helix') });
    R.scene('chronolith_walk', [0, 1.4, -7.4], 'WALK TO THE RING', { scene: 'chronolith', model: NONE_MODEL, when: 'rook_door', r: 3 });
    R.box([-3, -T0, -15, 3, 0.02, -9], { mat: 'glow', solid: false });
    // Rook, in person, at the chamber door; a security line across the floor until he steps aside
    R.npc({ id: 'rook_door', crew: 'rook', pos: [0.4, 0, -3.4], yaw: Math.PI, prompt: 'TALK TO ROOK' });
    R.box([-11.8, 0, -4.4, 11.8, 1.1, -4.2], { mat: 'door', when: '!rook_door', id: 'door_rook' });
    R.checkpoint(0, -2, -1.6);
    land(R, 'chamberDoor', [0, 0, -0.8]);
    land(R, 'chamber', [0, 0, -12]);
  });
  // the lift goes down: walk into it, and the doors open on the chamber
  const [sx, sy, sz] = ch.p([0, 0.86, -1.6]);
  P.triggers.push({ box: lift.b([-2.2, -1, -7.6, 2.2, 3, -3.4]), set: { lift_down: true }, once: false, to: [sx, sy, sz, ch.th], room: 'liftAtrium' });
  // out of the lobby into the court, the hub every other room opens off: the lobby's threads are walked past
  const [bx0, bz0, bx1, bz1] = P.spec.bounds;
  P.triggers.push({ box: [bx0, -20, bz0, bx1, 40, bz1], set: { left_lobby: true }, once: true, room: P.rid });
  return D.finish({ gated: true });
}


export const M02 = {
  key: 'm02', n: 2, chapter: 'prologue', name: 'HELIX GOES DARK', title: 'Helix Temporal Research Facility', subtitle: 'Lockdown. Emergency light. Rook calls it a system failure.',
  logline: 'Helix in the storm, under emergency light.',
  place: 'helix', wing: 'west', rooms: helixDarkRooms, sectors: 1, states: ['PRESENT'], dark: 0.45,
  ambience: 'hum', minutes: { main: 27, optional: 7 }, autoExit: 0.6,
  // the cold open, before the title: what the lobby kept of 05:38 (Kai is not there)
  coldOpen: {
    first: true, minutes: 2,
    shots: [{ cam: 'lobbyIntercom', to: 'lobby', look: 'sitePrint', t: 9 }, { cam: 'lobby', look: 'linPeg', t: 8 }],
    lines: [
      { ...L('IVEN', 'Test\'s at 05:40 now? Who moved it?'), voice: { fx: 'echo' } }, { ...L('ROOK', 'My office.'), voice: { fx: 'echo' } },
      { ...L('IVEN', 'Then your office can sign for it. I\'m not signing.'), voice: { fx: 'echo' } }, { ...L('ROOK', 'Nobody is asking you to sign, Iven.'), voice: { fx: 'echo' } },
      { ...L('IVEN', 'Good. Nobody signs for it. Write that down.'), voice: { fx: 'echo' } },
      N('05:40. Every light in the building goes out.'),
    ],
  },
  quarters: [
    {
      name: 'SECURITY',
      threads: [
        // (the lobby's threads are walked past once Kai goes out into the court: U6 review)
        { id: 'intercom', kind: 'scene', at: 'lobbyIntercom', until: 'left_lobby', goal: 'Answer the intercom.', because: 'Rook is calling the lobby from somewhere in the building.', done: 'intercom_heard', hints: M02_HINTS.intercom, minutes: 1 },
        { id: 'print', kind: 'scene', scene: 'print', at: 'sitePrint', until: 'left_lobby', spot: { prompt: 'LOOK AT THE PRINT', offset: [0, 0.4, 0.2], r: 2.6, model: NONE_MODEL },
          goal: 'Look at the Site Zero print in the lobby case.', because: 'Every visitor stops at it. Nobody looks at it.', done: 'ev_site_zero_print', hints: M02_HINTS.print, minutes: 1 },
        { id: 'lin', kind: 'talk', npc: 'researcher', at: 'lobby', until: 'left_lobby', goal: 'Talk to the researcher by the turnstiles.', because: 'Someone else is still in the building.', done: 'lin_met', hints: M02_HINTS.lin, minutes: 2 },
      ],
      sides: [
        { id: 'camera', name: 'THE CAMERA ROOM', done: 'ev_empty_corridor', minutes: 2,
          threads: [{ id: 'camera', kind: 'scene', scene: 'camera_room', at: 'cameraRoom', spot: { prompt: 'WATCH THE 05:40 FEED', offset: [0, 1.6, -0.6], r: 2.6, model: () => makeScreen(0x9fd8ff) },
            goal: 'Watch the chamber corridor\'s camera at 05:40.', because: 'My card opened that door.', done: 'ev_empty_corridor', hints: M02_HINTS.camera, minutes: 2 }] },
      ],
    },
    {
      name: 'THE DARK CORRIDOR',
      threads: [
        { id: 'gallery', kind: 'stealth', at: 'westGallery', goal: 'Get a power cell past the drone in the dark gallery.', because: 'The lift takes three cells. One is past the drone.', done: 'cells_1', hints: M02_HINTS.gallery, minutes: 3 },
      ],
      sides: [
        { id: 'lin', name: 'DR. LIN\'S DESK', giver: 'researcher', done: 'ev_lin_badge && ev_lin_peg', minutes: 2,
          threads: [
            { id: 'peg', kind: 'scene', scene: 'peg', at: 'linPeg', spot: { prompt: 'THE COAT PEGS', offset: [0, 0, 0.1], r: 2.4, model: makeCoatPegs }, goal: 'Look at the coat pegs by the door.', because: 'One peg is dripping.', done: 'ev_lin_peg', hints: M02_HINTS.linDesk, minutes: 1 },
            { id: 'linDesk', kind: 'scene', scene: 'lin_desk', at: 'linDesk', spot: { prompt: 'DR. LIN\'S DESK', offset: [0, 0.02, 0], r: 2.4, model: makeNotebook }, goal: 'Look at Dr. Lin\'s desk.', because: 'Six weeks here, and nobody remembers hiring her.', done: 'ev_lin_badge', hints: M02_HINTS.linDesk, minutes: 1 },
          ] },
      ],
    },
    {
      name: 'POWER',
      threads: [
        { id: 'cells', kind: 'tasks', of: ['cells_1', 'cells_2', 'cells_3'], at: 'plantTerrace', goal: 'Restore the lift: three cells in the plant terrace sockets.', because: 'The lift is the only way down.', done: 'lift_powered', hints: M02_HINTS.cells, minutes: 5 },
        { id: 'records', kind: 'deduce', at: 'staffLounge', goal: 'Find the officer whose statement is the truth, and use their code.', because: 'The records door wants an officer\'s code.', done: 'officer_trusted', hints: M02_HINTS.records, minutes: 4 },
      ],
      sides: [
        { id: 'iven', name: 'THE TECHNICIAN\'S KEY', giver: 'iven', start: 'quest_iven', done: 'ev_rook_log && quest_iven', minutes: 3,
          threads: [
            { id: 'ivenTalk', kind: 'talk', npc: 'iven', goal: 'Talk to Iven Marr on the plant terrace.', because: 'He was here at 05:40. He refused to sign.', done: 'quest_iven', hints: M02_HINTS.iven, minutes: 1 },
            { id: 'notes', kind: 'scene', after: ['ivenTalk'], goal: 'Read Marr\'s shift notes.', because: 'He wrote it down. Nobody else did.', done: 'ev_rook_log', hints: M02_HINTS.iven, minutes: 2 },
          ] },
      ],
    },
    {
      name: 'CONDUIT & ARCHIVE',
      threads: [
        { id: 'unit', kind: 'stealth', at: 'skybridge', goal: 'Get past the unit that rewinds its own damage.', because: 'It puts itself back together. I watched it.', done: 'unit_down', hints: M02_HINTS.unit, minutes: 3 },
        { id: 'archive', kind: 'tasks', of: ['drawing_seen', 'ev_junior_pass'], at: 'readingRoom', goal: 'Search the reading room.', because: 'Mira\'s name is on a file in this building.', hints: M02_HINTS.archive, minutes: 2,
          spots: [{ id: 'pass', scene: 'pass', at: 'passDrawer', prompt: 'OPEN THE DRAWER', offset: [0, 0.1, 0.4], r: 2.4, model: makePass }] },
      ],
    },
    {
      name: 'THE CHAMBER',
      threads: [
        { id: 'rookDoor', kind: 'talk', npc: 'rook', at: 'chamberDoor', goal: 'Rook is at the chamber door.', because: 'He came down himself. He never comes down.', done: 'rook_door', hints: M02_HINTS.rook, minutes: 2 },
        { id: 'chamber', kind: 'scene', at: 'chamber', after: ['rookDoor'], goal: 'Go into the chamber. Touch nothing.', because: 'You were always going to.', done: 'chronolith_seen', hints: M02_HINTS.chamber, minutes: 1 },
      ],
    },
  ],
  talks: {
    // Dr. Lin: the researcher nobody remembers hiring
    researcher: [
      {
        when: '!lin_met',
        lines: [N('Under the emergency light she has no shadow. Nobody in the lobby would think to look.'),
          CREW('Don\'t go to the lift. The lift is dead. Everything below three is dead.'), K('Rook said system failure.'),
          CREW('Rook said it twice. Systems don\'t scream, Kai. Something screamed.'), K('Have we met?'),
          CREW('Everybody asks me that this morning. I\'ve been here six weeks. Nobody remembers hiring me.'),
          CREW('Power cells. Three of them on this floor. I am not going to look for them.')],
        set: { lin_met: true }, log: 'Nobody remembers hiring Dr. Lin.',
      },
      { when: 'lin_met && raincoat && !lin_coat', lines: [CREW('That coat. Is it raining yellow out there now?'), K('Somebody left it at the staff gate.'), CREW('Then somebody will want it back.')], set: { lin_coat: true } },
      { when: 'lin_met', lines: [CREW('Three cells, then the lift. Then I would like to go home.')] },
    ],
    // Rook, in person, blocking the chamber door
    rook: [
      {
        when: '!rook_door',
        lines: [L('ROOK', 'The chamber is off limits.'), K('You called me in.'), L('ROOK', 'Because you built the activation system, Kai. Did you think it was for clocks?')],
        choices: [
          intent('challenge', 'You moved the test to 05:40.', { when: 'jun_evidence || ev_door_log || ev_rook_log', consequence: true,
            lines: [K('Your order was on Jun Park\'s terminal. Timestamped before any of this happened.', 'jun_evidence'), L('ROOK', 'I moved a test. I did not move a second. Something else did that.')], set: { trust_rook: -1, rook_door: true }, log: 'Rook moved a test, he says, not a second.' }),
          intent('investigate', 'Who used my card?', { lines: [L('ROOK', 'Your card. Your access. Your machine. You tell me.')], set: { trust_rook: 0, rook_door: true }, log: 'Rook asked me who used my card.' }),
          intent('comfort', 'Elias. What happened?', { lines: [L('ROOK', 'I don\'t know. That is the truth, and I hate it.')], set: { trust_rook: 1, rook_door: true }, log: 'Rook does not know what happened.' }),
        ],
        after: [L('ROOK', 'Go in, then. You were always going to.')],
      },
      { when: 'rook_door', lines: [L('ROOK', 'Go in. I will be on the radio. I am always on the radio.')] },
    ],
  },
  scenes: {
    intercom: { lines: [R('Kai. The chamber is off limits.'), K('Then why did you call me in?'), R('Because you are the only one who can tell me the readings are wrong.'), K('What do they read?'), R('Dates. Before Helix. There is nothing before Helix, Kai. Come to the lab.')], set: { intercom_heard: true }, log: 'Rook says there is nothing before Helix.' },
    print: { lines: [N('A boot print in grey clay, under glass. The card reads: THE SITE ZERO PRINT. Circa 1077 BC. Its tread has never been explained.'), K('Helix\'s mascot. Every intern gets a mug.')], set: { ev_site_zero_print: true } },
    peg: { lines: [N('Coat pegs with brass name tags. The peg marked LIN is empty, and dripping.'), K('Somebody came in out of the rain. Just now.')], set: { ev_lin_peg: true } },
    lin_desk: { lines: [N('Dr. Lin\'s desk. Her badge has a grey square for a photo: PHOTO PENDING SINCE 2026.'), N('Her notebook: the song again: up, up, down. Someone at a window, waving.'), K('Since 2026. She said six weeks.')],
      set: { ev_lin_badge: true } },
    camera_room: { lines: [N('Chamber One\'s corridor camera, 05:40. Nobody there. The chamber door opens by itself, and closes.'), K('My card opened that door. Nobody walked through it.')], set: { ev_empty_corridor: true } },
    shift_notes: { lines: [N('Marr\'s shift notes, in pencil, taped to the panel: "Test moved to 05:40 by director\'s office. Not approved by maintenance. Not signed by me. I.M."')], set: { ev_rook_log: true }, log: 'Rook\'s office moved the test to 05:40. Marr refused to sign.' },
    // (Pryce at the bridge, 08:14, read Kai's card off her own badge record; at 05:52 she read the director's clean log)
    rec_pryce: { lines: [REC.pryce, K('At the bridge she told me the door logged my card. At 05:52 she read them a clean log.')], show: 'holo_pryce', set: { rec_pryce: true } },
    rec_haig: { lines: [REC.haig], show: 'holo_haig', set: { rec_haig: true } },
    rec_dale: { lines: [REC.dale], show: 'holo_dale', set: { rec_dale: true } },
    // (the timeline of the three statements: the door opens on Kai's card at 05:40; the director's office cleans the log
    // at 05:50; Pryce reads the clean log into her statement at 05:52; Dale, who logged the opening before, says it was
    // edited at 06:01. At 08:14 her checkpoint's own badge record, which nobody cleaned, shows her the card: U6 review)
    door_log: { lines: [N('The door log, taped to the wall: 05:40, CHAMBER ONE, CARD VAREN, K. In red: EDITED 05:50, DIRECTOR\'S OFFICE.'), K('My card. Edited by Rook\'s office, ten minutes later.')], set: { ev_door_log: true } },
    whose_code: {
      lines: [N('The panel wants an officer\'s code. Three names on the roster.')],
      choices: [
        { intent: 'investigate', label: 'Dale', lines: [N('The door accepts Dale\'s code.'), K('He logged the door opening on an empty corridor. They edited it, and he said so anyway.')], set: { officer_trusted: true, ev_dale: true } },
        { intent: 'investigate', label: 'Pryce', lines: [N('ACCESS DENIED. ALERT.'), K('Pryce read them the log after somebody cleaned it. Clean was never the truth.')], then: 'alarm' },
        { intent: 'investigate', label: 'Haig', lines: [N('ACCESS DENIED. ALERT.'), K('Haig said she was home. The roster has her at 05:00.')], then: 'alarm' },
        { intent: 'withdraw', label: 'Listen again' },
      ],
    },
    breaker: { lines: [N('The breaker goes over. Along the east wall, the damaged conduit begins to spit light.'), K('Now it just has to see me.')], set: { conduit_live: true } },
    drawing: {
      lines: [N('A child\'s drawing, pinned to the wall of the archive: two figures holding hands beside a black circular machine. KAI + MIRA, in crayon.'), K('This drawing is twenty-three years old.'), R('Then someone has been using your credentials.'), K('I was twelve.')],
      set: { drawing_seen: true, ev_drawing: true }, log: 'A drawing of me and Mira beside the ring, twenty-three years old.',
    },
    pass: { lines: [N('A laminated pass in the drawer: VAREN, K. JUNIOR PASS. CHAMBER ACCESS: NO. Stamped: OVERRIDE 14-03-2026 16:02.'), K('My junior pass. I was twelve. I never went near that chamber.')], set: { ev_junior_pass: true } },
    chronolith: { lines: [N('Kai walks to the edge of the floor glow, and stops there.'), K('I\'m not touching it.')], set: { chronolith_seen: true } },
  },
  rules: [
    { id: 'cells', when: 'cells_3', set: { lift_powered: true }, say: [N('The lift wakes up three floors down. You feel it through the floor before you hear it.')] },
    { id: 'unit', when: 'unit_down', say: [N('The unit walks into the live conduit and stops rewinding. Then it is only a shape.'), K('It couldn\'t put that back.')] },
  ],
  fx: {
    alarm(rt) {
      const g = rt.g;
      g.audio.alert();
      g.hud.flash('rgba(255,90,60,0.5)');
      g.after(0.6, () => g.deckSetback('caught'));
    },
  },
  hook: { cue: 'reveal', minutes: 1, lines: [N('A black ring, taller than the room should allow. It is not running. It is waiting.'), K('Mira drew this. Before any of it was built.'), N('In the black stone his reflection arrives half a second late.')],
    shots: (rt) => m02Reveal(rt) },
  done: 'chronolith_seen',
};
M02.outro = M02.hook.lines;

// =============================================================================================================
// Mission 3: THE FIRST SWITCH
// =============================================================================================================
const SWITCH_PALETTE = { ...HELIX_PALETTE, emergency: 0, fog: 0x1e2430, wall: '#58606c', floor: '#363c46', accent: 0x4f9fe8, accent2: 0xc08a3e, light: 0xcfe0ff, tint: 0x4a5a7a, night: 0.4, weather: null, grade: { shadowTint: 0x14243a, highlightTint: 0xe0ecff, toning: 0.18, contrast: 1.12, saturation: 0.96 } };

// Iven Marr in the maintenance route (quest chain D)
const IVEN_ROUTE = [
  {
    when: '!quest_iven', lines: [...IVEN_HOOK, L('IVEN', 'My team is behind that lock. So is the raw log. The lock resets every time the building changes its mind about the year.')],
    choices: [
      intent('comfort', 'Your team first.', { lines: [L('IVEN', 'The service panel is in 2026. It was installed before the drone was. I\'ll keep the drone busy.')], trust: 1, quest: 'active', set: { iven_busy: true }, then: 'ivenLure' }),
      intent('investigate', 'Who signed for the test?', { lines: [L('IVEN', 'Rook\'s name is on the order. Mine is on the sheet that says no. Service panel is in 2026, if you want to see for yourself.')], ev: 'iven_testimony', quest: 'active' }),
      intent('withdraw', 'Not now.'),
    ],
  },
  { when: 'quest_iven == "active" && !iven_busy', lines: [L('IVEN', 'You came back. Panel in 2026, then in, before you change your mind about the year.'), K('And the drone?'), L('IVEN', 'I\'ll keep it busy. It knows my face. It thinks I\'m still on shift.')], set: { iven_busy: true }, then: 'ivenLure' },
  { when: 'quest_iven == "active"', lines: [L('IVEN', 'Panel in 2026. Then in. The terminal only answers in your year.')] },
  { when: 'iven_team_saved', lines: [L('IVEN', 'Three of them. All three. Nobody signs for that either, but I will.')] },
  { when: 'ev_raw_log', lines: [L('IVEN', 'You have the log. Use it on him. That is the only way it was worth it.')] },
];

const M03_HINTS = {
  cycle: ['Let it happen.', 'The room is choosing a year.', 'Wait for 2049.'],
  lab: ['The chamber door is open.', 'Up the corridor.', 'Walk up into the lab.'],
  dig: ['The cable is in 2026.', 'In 2026 the lab\'s south wall is only a frame.', 'Switch to 2026 and walk out to the site hut by the dig.'],
  office: ['Rook\'s site office.', 'The log, the thermos, the footprints, the photograph.', 'Read the log at the hut, and look around it.'],
  cable: ['Connect in 2026, switch on in 2049.', 'The socket on the lab\'s east wall, in 2026.', 'Plug in the cable in 2026, then throw the power in 2049.'],
  hall: ['The floor is gone in every year but one.', 'In 2196 a lift is parked across the gap.', 'Switch to 2196, cross on the lift, switch back.'],
  plaque: ['A plaque, only in 2196.', 'On the machine hall\'s far wall.', 'Read the plaque in 2196.'],
  control: ['The lock reads 2049. The card is in 2026.', 'Anchor what I carry, or it comes apart.', 'Take the card in 2026, anchor it, use the lock in 2049.'],
  panel: ['The panel.', 'In 2049.', 'Use the control panel in 2049.'],
  route: ['Iven Marr is in the service yard.', 'His team is behind a lock that resets.', 'Talk to Iven, open the 2026 panel, use the terminal in 2049.'],
};

// Mission 3's rooms: the same chamber under the oculus, then up the stair under the court into the
// east wing (the temporal lab, glass to the court, and in 2026 a bare frame Kai can walk out of, to the
// dig), the machine hall in the north-east corner, the open service court, and the control room's
// panoramic window over the valley. In 2026 the wing is a frame and the hall has no roof; in 2196 the
// roof has fallen in and the oculus is open.
function firstSwitchRooms(P, story, si, rt) {
  const D = new Deck({ id: 'm03', deckName: 'HELIX', palette: SWITCH_PALETTE, seed: 'lv', states: ['PRESENT', 'PAST', 'FUTURE'], unstable: true, estimateMin: 40, place: P, start: { at: [0, 12], rot: 0, y: -11.5 } });
  const land = (R, name, at, yaw = 0) => { const w = R.p(at); P.land(name, w[0], w[1], w[2], yaw + R.th); };
  // r0 the chamber: the Chronolith teaches the switch
  D.room({ id: 'chamber', name: 'CHRONOLITH CHAMBER', W: 24, L: 24, H: 12, exit: 'E', corridor: { len: 26, rise: 11.5 }, roof: { PRESENT: 'glass', PAST: 'open', FUTURE: 'open' }, kind: 'arrival', beat: 'custom' }, (R) => {
    R.floor(0, -R.L, 0, { mat: 'chamberFloor' });
    // the ring (to look at), and, should the cold open not have played, the place to touch it
    R.inter({ id: 'ring_touch', kind: 'scene', scene: 'ring', pos: [0, 4.6, -12], r: 0, prompt: '', model: () => makeChronolith(1.15, 'helix', { eras: { PRESENT: 'helix', PAST: 'cradle', FUTURE: 'halo' } }) });
    R.scene('touch', [0, 1.6, -8.6], 'TOUCH THE CHRONOLITH', { model: NONE_MODEL, r: 4, when: '!has_chronolith' });
    // 2026: scaffolding round the ring's empty cradle (the ring is still in the ground at the dig, outside: one ring in
    // 2026, where the excavation log says it was found); 2196: the ceiling gone, moss, a fallen beam
    for (const [x, z] of [[-7, -6], [7, -6], [-7, -18], [7, -18]]) R.box([x - 0.15, 0, z - 0.15, x + 0.15, 10, z + 0.15], { mat: 'trimDark', when: '@PAST' });
    // (two scaffold boards along the poles, so the open sky of 2026 shows over the cradle)
    for (const x of [-7, 7]) R.box([x - 0.8, 5.0, -18, x + 0.8, 5.2, -6], { mat: 'crate', solid: false, when: '@PAST' });
    R.text('HELIX - CHAMBER 1 - UNDER CONSTRUCTION - 2026', [0, 8.2, -23.9], 0, { size: 0.42, color: '#ffd9a0', when: '@PAST' });
    R.text('CHAMBER - AUTHORISED PERSONNEL - DIRECTOR\'S OFFICE', [0, 8.2, -23.9], 0, { size: 0.42, color: '#9fd8ff', when: '@PRESENT' });
    R.box([-12, 0, -24, 12, 0.3, 0], { mat: 'moss', solid: false, when: '@FUTURE' });
    R.box([-9, 5, -16, 9, 5.4, -15.6], { mat: 'industrial', when: '@FUTURE' });
    R.text('2196', [0, 8.2, -23.9], 0, { size: 0.5, color: '#9fe8c8', when: '@FUTURE' });
    R.box([R.W / 2, 0, -R.L + 0.6, R.W / 2 + T0, 4, -R.L + 3.6], { mat: 'door', when: '!has_chronolith', id: 'door_chamber' });
    R.checkpoint(0, -2, -1.6);
    land(R, 'chamber', [0, 0, -12]);
    land(R, 'ringTouch', [0, 1, -8.2]);
  });
  // r1 the temporal lab (the east wing's ground floor, glass to the court): the socket was put in in 2026, the switch
  // works in 2049. In 2026 the wing is a bare frame: a gap in the lab's south wall lets Kai out to the court and the dig
  D.room({ id: 'cable', name: 'TEMPORAL LAB', W: 14, L: 18, H: 6.5, exit: 'W', windows: { S: 'full', E: [[3.8, 9, 1.0, 4.6]] }, gaps: { E: [{ at: [0.8, 3.2], closed: '!@PAST' }] } }, (R) => {
    R.floor();
    R.prop('desk', -4, -5);
    R.prop('console', 4, -5);
    // in 2026 the far third of the floor is open framing
    R.box([-7.4, -0.4, -18, 7.4, 0, -12], { mat: 'trimDark', when: '@PAST' });
    R.inter({ id: 'cable_socket', kind: 'socket', pos: [6.6, 1.3, -14], yaw: -Math.PI / 2, r: 2.4, prompt: 'CABLE SOCKET (2026)', needs: 'cable', only: 'PAST', no: 'The socket was put in in 2026. In this year it was never installed.' });
    R.text('MAIN FEED - NOT CONNECTED', [6.9, 2.6, -14], -Math.PI / 2, { size: 0.34, color: '#ffd9a0', when: '!cable_connected' });
    R.text('MAIN FEED - CONNECTED', [6.9, 2.6, -14], -Math.PI / 2, { size: 0.34, color: '#7fe0a8', when: 'cable_connected' });
    R.text('TO THE DIG', [6.9, 3.4, -2], -Math.PI / 2, { size: 0.26, color: '#ffd9a0', when: '@PAST' });
    R.prop('console', 0, -16.6);
    R.scene('power', [0, 1.3, -16.2], 'ACTIVATE THE POWER (2049)', { model: () => makePanel(0x4f9fe8), when: '@PRESENT' });
    R.box([-R.W / 2 - T0, 0, -R.L + 0.6, -R.W / 2, 4, -R.L + 3.6], { mat: 'door', when: '!power_on', id: 'door_cable' });
    R.box([-7, 0, -18, 7, 0.25, -2], { mat: 'moss', solid: false, when: '@FUTURE' });
    R.challenge('switch:cable', 0, -18, M03_HINTS.cable, { answer: ['PAST', 'PRESENT'] });
    R.checkpoint(0, -2, -1.6);
    land(R, 'temporalLab', [0, 0, -9]);
    land(R, 'cableSocket', [6.6, 1.3, -14]);
    land(R, 'powerPanel', [0, 1.3, -16.2]);
  });
  // r2 the machine hall: its floor collapsed into the plant level; in 2196 a lift is parked across the gap
  D.room({ id: 'collapse', name: 'MACHINE HALL', W: 14, L: 22, H: 14, exit: 'W', roof: { PRESENT: 'solid', PAST: 'open', FUTURE: 'open' }, windows: { E: [[2, 20, 8, 13]], W: [[2, 16, 8, 13]] } }, (R) => {
    R.floor(0, -6);
    R.pit(-6, -16, { depth: 5 });
    R.floor(-16, -22);
    // the gantry crane overhead
    R.box([-7, 11.5, -21, 7, 12.0, -20.4], { mat: 'trimDark', solid: false });
    R.box([-7, 11.5, -1.6, 7, 12.0, -1.0], { mat: 'trimDark', solid: false });
    R.box([-0.5, 11.2, -20.4, 0.5, 11.9, -1.6], { mat: 'trim', solid: false });
    // 2196: a maintenance lift, left parked across the gap, and the moss that grew on it; the roof slabs in the pit
    R.box([-1.6, -0.4, -16.4, 1.6, 0, -5.6], { mat: 'industrial', when: '@FUTURE' });
    R.box([-1.6, 0, -16.4, 1.6, 0.05, -5.6], { mat: 'moss', solid: false, when: '@FUTURE' });
    R.box([2.4, -5, -15, 6.6, -2.4, -8], { mat: 'industrial', when: '@FUTURE' });
    R.text('LIFT PARKED - 2196', [0, 5.2, -21.9], 0, { size: 0.42, color: '#9fe8c8', when: '@FUTURE' });
    R.text('MACHINE HALL - FLOOR COLLAPSED', [0, 3.5, -21.9], 0, { size: 0.42, color: '#9fd8ff', when: '!@FUTURE' });
    // the 2196 plaque on the far wall
    R.scene('plaque', [0, 2.6, -21.7], 'READ THE PLAQUE (2196)', { model: makePlaque, when: '@FUTURE', r: 4.5 });
    R.challenge('switch:lift', 0, -22, M03_HINTS.hall, { answer: 'FUTURE' });
    R.checkpoint(0, -2, -1.6);
    R.checkpoint(-16, -22, -18);
    land(R, 'machineHall', [0, 0, -11]);
    land(R, 'lift2196', [0, 0, -11]);
    land(R, 'plaque2196', [0, 3.5, -21.6]);
  });
  // r3 quest chain D, THE TECHNICIAN'S KEY: the service court (open to the sky) behind a lock that resets
  // after every switch; the service panel exists only in 2026, the drone only in 2049
  // (from its far end a stair climbs 9 m inside the north wing to the control room on the top floor)
  D.room({ id: 'route', name: 'SERVICE YARD', W: 16, L: 22, H: 6.5, roof: 'open', corridor: { len: 9, rise: 9 } }, (R) => {
    R.floor(0, -R.L, 0, { mat: 'yardConcrete' });
    R.npc({ id: 'iven3', crew: 'iven', pos: [-4.2, 0, -3.6], yaw: Math.PI * 0.8, dialogue: IVEN_ROUTE, barks: ['Panel was installed before the drone was.'] });
    R.pillar(-2.4, -11, 0.6);
    R.prop('crate', -5.6, -17.4);
    // the service panel: 2026 only
    R.box([-8, 0.6, -11.8, -7.7, 2.0, -10.2], { mat: 'prop', when: '@PAST' });
    R.scene('service_panel', [-7.5, 1.3, -11], 'SERVICE PANEL (2026)', { yaw: Math.PI / 2, model: () => makePanel(0xffd27a), when: '@PAST && !maint_open' });
    R.text('SERVICE PANEL - REMOVED 2031', [-7.9, 2.4, -11], Math.PI / 2, { size: 0.3, color: '#9fd8ff', when: '!@PAST' });
    // the maintenance strip along the east wall, behind a partition and a lock
    R.box([3, 0, -18, 3.4, 6.5, -12]);
    R.box([3, 0, -9, 3.4, 6.5, -4]);
    R.box([3, 4, -12, 3.4, 6.5, -9]);
    R.box([3, 0, -12, 3.4, 4, -9], { mat: 'door', when: '!maint_open', id: 'door_maint' });
    R.box([3.4, 0, -4.4, 8, 6.5, -4]);
    R.box([3.4, 0, -18, 8, 6.5, -17.6]);
    R.text('MAINTENANCE ROUTE - M. TEAM ONLY', [2.95, 4.6, -10.5], -Math.PI / 2, { size: 0.3, color: '#ffb36b' });
    R.text('LOCK RESETS ON STATE CHANGE', [2.95, 3.9, -10.5], -Math.PI / 2, { size: 0.24, color: '#ff6a48' });
    R.scene('release', [3.7, 1.3, -7.2], 'MANUAL RELEASE', { yaw: -Math.PI / 2, model: () => makePanel(0xff6a48), when: '!maint_open' });
    R.prop('console', 6.6, -15.6);
    R.scene('iven_terminal', [6.6, 1.3, -15.1], 'THE RAW LOG / THE TEAM (2049)', { model: () => makePanel(0x4f9fe8), when: '@PRESENT && quest_iven != "resolved"' });
    R.text('THE TEAM IS IN 2049', [6.6, 2.6, -17.5], 0, { size: 0.3, color: '#ffd9a0', when: '!@PRESENT' });
    R.prop('crate', 5.2, -6.2, { size: 0.5 });
    for (const [k, x, z] of [[0, 5.0, -12.6], [1, 6.4, -11.2], [2, 5.6, -9.4]]) R.npc({ id: `tech_${k}`, crew: `tech_${k}`, first: 'Technician', seed: 310 + k, ambient: true, pronoun: k === 1 ? { their: 'her', them: 'her' } : { their: 'his', them: 'him' }, pos: [x, 0, z], yaw: -Math.PI / 2, silent: true, when: 'iven_team_saved' });
    // the drone: 2049 only
    R.sentinel({ path: [[-6, -7], [1.6, -7], [1.6, -15.4], [-6, -15.4]], speed: 1.7, range: 7.5, fov: 0.8, when: '@PRESENT' });
    R.challenge('helix:route', 0, -22, M03_HINTS.route, { answer: ['PAST', 'FUTURE'] });
    R.checkpoint(0, -2, -1.6);
    land(R, 'serviceYard', [0, 0, -11]);
  });
  // r4 control, on the north wing's top floor (9 m): its panoramic window looks south over the court and the city to the
  // valley; the keycard waits in 2026 (anchor it), the panel works in 2049. (The mission ends there, on the fracture:
  // no door out, exit 'none')
  D.room({ id: 'control', name: 'CONTROL', W: 12, L: 16, H: 6, kind: 'encounter', beat: 'custom', exit: 'none', windows: { W: 'full' } }, (R) => {
    R.floor();
    R.prop('desk', 4, -4);
    R.item({ id: 'keycard', kind: 'key', pos: [4, 1.1, -4], echo: true, label: 'KEYCARD (2026)' });
    R.text('CONTROL ROOM - CARD ACCESS', [-1.9, 4.4, -9.9], 0, { size: 0.36, color: '#9fd8ff' });
    R.box([-5.6, 0, -10.4, -1.5, 4.5, -10], { mat: 'wall' });
    R.box([1.5, 0, -10.4, 5.6, 4.5, -10], { mat: 'wall' });
    R.box([-1.5, 0, -10.4, 1.5, 4, -10], { mat: 'door', when: '!open_control', id: 'door_control' });
    R.inter({ id: 'lock_control', kind: 'lock', pos: [2.2, 1.3, -9.6], r: 2.4, prompt: 'CARD LOCK (2049)', needs: 'keycard', opens: 'open_control' });
    R.prop('console', 0, -14.6);
    R.scene('panel', [0, 1.3, -14.2], 'THE CONTROL PANEL (2049)', { model: () => makePanel(0x4f9fe8), when: '@PRESENT && open_control' });
    R.challenge('switch:anchor', 0, -16, M03_HINTS.control, { answer: ['PAST', 'PRESENT'] });
    R.checkpoint(0, -2, -1.6);
    land(R, 'controlRoom', [0, 0, -8]);
    land(R, 'keycard', [4, 1.1, -4]);
    land(R, 'controlPanel', [0, 1.3, -14.2]);
  });
  const lv = D.finish({ gated: true });
  // the dig (2026): the cable for the lab's socket lies by the site hut, with the excavation office's things
  P.items.push({ id: 'cable', kind: 'key', pos: [-5.6, 0.9, 31.4], echo: true, label: 'POWER CABLE (2026)', room: P.rid });
  return lv;
}

const M03_SAY = {
  // (in 2026 the ring is still in the ground at the dig: the chamber's cradle stands empty. U6 review)
  past: [N('2026. Scaffolding round an empty cradle. Whatever it was built for is still in the ground.')],
  // (2196 is a dry green dawn: no rain falls; a linden has grown up through the broken lens)
  future: [N('2196. The ceiling is gone. A tree grows where the glass was, and the ring is still here.')],
  present: [R('Kai? The chamber is reading three dates at once.'), K('Which one is real?'), R('All of them. That\'s why this is dangerous.'),
    N('Stability drains while you are out of 2049.')],
  // the fracture: Rook reads the chamber's number, and the year lets go of Kai
  reading: [R('Kai, the chamber is reading a date. It\'s reading—'), K('Read it to me.'), R('That isn\'t a date. That\'s a number. Minus three thousand and—')],
};


export const M03 = {
  key: 'm03', spoken: M03_SAY, n: 3, chapter: 'prologue', name: 'THE FIRST SWITCH', title: 'Helix, three years at once', subtitle: '2049. 2026. 2196. The facility cannot decide.',
  logline: 'Helix in three years at once.',
  place: 'helix', wing: 'east', rooms: firstSwitchRooms, sectors: 1, states: ['PRESENT', 'PAST', 'FUTURE'], unstable: true,
  // (the court and the dig are outside the facility: the Chronolith's stability holds there, in any year)
  stableOutdoors: true,
  carryOut: ['cable'], // (the year Kai walks out of the lab in is the court's: through 2026's frame, into 2026)
  ambience: 'hum', minutes: { main: 22, optional: 6 }, autoExit: 1.6,
  // the cold open, after the title: the touch, the wrist sealing; then the first cycle through the years
  coldOpen: {
    minutes: 1, cue: 'reveal',
    shots: [{ cam: 'ringTouch', to: [2, -9.6, 1.6], look: 'chamber', t: 7 }],
    lines: [N('It is cold, and then it is every temperature it has ever been.'), N('The cut on his wrist closes into a circle with a broken halo.'), K('It sealed it.')],
    set: { has_chronolith: true, chronolith_touched: true, wrist_mark: true }, then: 'firstCycle',
  },
  quarters: [
    {
      name: 'THE CHAMBER',
      threads: [
        { id: 'cycle', kind: 'cinema', at: 'chamber', goal: 'Hold on to the ring.', because: 'The room has three dates and is trying all of them.', done: 'first_cycle', hints: M03_HINTS.cycle, minutes: 2 },
      ],
    },
    {
      name: 'TEMPORAL LAB',
      threads: [
        { id: 'lab', kind: 'go', at: 'temporalLab', r: 6, after: ['cycle'], goal: 'Up the corridor to the temporal lab.', because: 'The chamber door is open now. Everything else in this building is waiting on power.', hints: M03_HINTS.lab, minutes: 1 },
      ],
    },
    {
      name: 'THE DIG',
      threads: [
        { id: 'dig', kind: 'go', at: 'excavationHut', r: 7, after: ['lab'], goal: 'In 2026 the wing is only a frame. Walk out to the dig and find the cable.', because: 'The socket was put in in 2026. So was everything else.', hints: M03_HINTS.dig, minutes: 2 },
        // (walked past once the cable is in; SITE ZERO is pinned by reading the log itself, never by three other things)
        { id: 'office', kind: 'clue', need: 3, of: ['ev_site_zero', 'ev_thermos_er', 'ev_footprints', 'ev_polaroid'], after: ['dig'], until: 'cable_connected || power_on',
          spots: [
            { id: 'dig_log', scene: 'dig_log', at: 'excavationLog', prompt: 'THE EXCAVATION LOG', offset: [0, 0, -2.4], r: 2.6, model: makeLogbook, when: '@PAST' },
            { id: 'dig_thermos', scene: 'dig_thermos', at: 'thermosER', prompt: 'THE THERMOS', offset: [0, 0, -0.6], r: 2.4, model: makeThermos, when: '@PAST' },
            { id: 'dig_footprints', scene: 'dig_footprints', at: 'footprints', prompt: 'THE FOOTPRINTS', offset: [0, 1.1, 0], r: 9, model: makeFootprints, when: '@PAST' },
            { id: 'dig_polaroid', scene: 'dig_polaroid', at: 'polaroid', prompt: 'THE POLAROID', offset: [0, 0.4, -0.2], r: 2.4, model: makePolaroid, when: '@PAST' },
          ],
          goal: 'Rook\'s excavation office: find out what he dug up.', because: 'His initials are on everything here.', hints: M03_HINTS.office, minutes: 4 },
        { id: 'cable', kind: 'tasks', of: ['cable_connected', 'power_on'], after: ['dig'], goal: 'Connect the cable in 2026. Throw the power in 2049.', because: 'The feed was laid in one year and switched in another.', done: 'power_on', hints: M03_HINTS.cable, minutes: 3 },
      ],
    },
    {
      name: 'MACHINE HALL',
      threads: [
        { id: 'hall', kind: 'go', after: ['cable'], goal: 'Cross the machine hall. Its floor is gone.', because: 'The floor fell in. In one year, something is parked across the gap.', done: 'crossed', hints: M03_HINTS.hall, minutes: 2 },
        { id: 'plaque', kind: 'scene', after: ['cable'], until: 'open_control', goal: 'Read the plaque on the far wall, in 2196.', because: 'Somebody put up a plaque in this building, later.', done: 'ev_plaque2196', hints: M03_HINTS.plaque, minutes: 1 },
      ],
      sides: [
        { id: 'route', name: 'THE TECHNICIAN\'S KEY', giver: 'iven', start: 'quest_iven', done: 'quest_iven == "resolved"', minutes: 6,
          threads: [
            { id: 'ivenRoute', kind: 'talk', npc: 'iven', at: 'serviceYard', goal: 'Iven Marr is in the service yard.', because: 'His team is behind a lock that will not stay open.', done: 'quest_iven', hints: M03_HINTS.route, minutes: 2 },
            { id: 'servicePanel', kind: 'scene', after: ['ivenRoute'], goal: 'Open the maintenance route from the 2026 panel.', because: 'The panel was installed before the drone was.', done: 'maint_open || quest_iven == "resolved"', hints: M03_HINTS.route, minutes: 2 },
            { id: 'teamOrLog', kind: 'choice', after: ['servicePanel'], goal: 'In 2049: the team, or the raw log.', because: 'The terminal can open one of them before the building changes its mind.', done: 'quest_iven == "resolved"', hints: M03_HINTS.route, minutes: 2 },
          ] },
      ],
    },
    {
      name: 'CONTROL',
      threads: [
        { id: 'control', kind: 'scene', after: ['hall'], goal: 'Open the control room: the lock reads 2049, the card is in 2026.', because: 'Whatever I carry out of 2026 comes apart in 2049, unless I anchor it.', done: 'open_control', hints: M03_HINTS.control, minutes: 3 },
        { id: 'panel', kind: 'scene', after: ['control'], goal: 'Use the control panel in 2049.', because: 'Whatever happened in the chamber was started from here.', done: 'fractured', hints: M03_HINTS.panel, minutes: 2 },
      ],
    },
  ],
  scenes: {
    touch: { lines: [N('It is cold, and then it is every temperature it has ever been.')], set: { has_chronolith: true, wrist_mark: true }, then: 'firstCycle', log: 'The ring let me in. I can choose the year.' },
    power: { when: 'cable_connected', lines: [N('The main feed comes up. Twenty-three years late, the lab has power.'), K('Connected then. Switched on now.')], set: { power_on: true }, log: 'Connected in 2026, switched on in 2049.' },
    power_no: { lines: [N('The panel is dead. MAIN FEED - NOT CONNECTED.'), K('Not connected. Not connected when?')] },
    dig_log: { lines: [N('The site log, in a careful hand: SITE ZERO. E. ROOK. Found in a riverbed drained long before any record.'), K('Found. In a riverbed. Rook always said we built it.')],
      set: { ev_site_zero: true }, log: 'Rook\'s 2026 log: the ring was found in a dry riverbed.' },
    dig_thermos: { lines: [N('A steel thermos on the hut step, with two initials on a strip of tape: E.R.'), K('Elias Rook was here in 2026. With a shovel.')], set: { ev_thermos_er: true } },
    dig_footprints: { lines: [N('Children\'s footprints in the plaster dust by the pit. The small ones have a star in the tread.'), K('Mira\'s boots had stars on the soles.')], set: { ev_footprints: true } },
    dig_polaroid: { lines: [N('A Polaroid inside the hut window: the black ring, half dug out of the clay.'), K('Everything in that ground is old. It looks new.')], set: { ev_polaroid: true } },
    plaque: { lines: [N('A bronze plaque gone green, on the machine hall\'s far wall: HELIX. WHERE THE FRACTURE BEGAN. WE REMEMBER.'), K('Remember what?')], set: { ev_plaque2196: true } },
    service_panel: { lines: [N('A service panel from 2026, before the drone, before the lock had opinions. The release takes.'), K('Open. Until I change the year.')], set: { maint_open: true }, log: 'The 2026 panel opens Marr\'s route, until the year changes.' },
    release: { lines: [N('The manual release clunks. The route is open again, until the next switch.')], set: { maint_open: true } },
    iven_terminal: {
      lines: [N('The maintenance terminal. Three technicians are sealed in the lower conduit, and the raw experiment log is on the same circuit. One of them, before the year changes.')],
      choices: [
        intent('comfort', 'Get the team out first.', { consequence: true, npc: 'iven', lines: [N('The hatch opens. Three technicians climb out into a building that cannot decide what year it is.'), L('IVEN', 'That is the whole of my statement, when they ask. You got them out.')], set: { iven_team_saved: true, quest_iven: 'resolved' }, trust: 1, log: 'I got Marr\'s team out.' }),
        intent('investigate', 'Keep the raw log.', { consequence: true, npc: 'iven', lines: [N('The log holds: the director\'s order, Marr\'s refusal, and a second entry at 05:40 that nobody wrote.'), L('IVEN', 'I would have chosen them. I understand why you did not.')], set: { ev_raw_log: true, ev_rook_log: true, quest_iven: 'resolved' }, trust: -1, log: 'I kept the raw log. Marr\'s team waited.' }),
      ],
    },
    panel: {
      lines: [K('Control. Finally.'), N('The panel lights: MAIN FEED, 2026. SWITCHED, 2049.'), K('Connected in 2026. Switched on in 2049. That should not work.'), R('It works. That is the problem.'), N('Then every date on the panel starts to count the wrong way.')],
      set: { fractured: true }, then: 'fracture', log: 'The facility fractured.',
    },
  },
  rules: [
    { id: 'crossed', when: 'crossed', say: [K('Across. In a year that has not happened yet.')] },
  ],
  // the moments that run in callbacks: a save taken in one plays it again on load (Runtime.afterResume)
  resumes: [{ when: 'has_chronolith', until: 'first_cycle', fx: 'firstCycle' }, { when: 'fractured', until: 'fracture_done', fx: 'fracture' }],
  // the hook: Rook reads the chamber's number (fx fracture), the year lets go, and Act I opens older than the building
  hook: { cue: 'cliff', minutes: 1, lines: [N('The floor remembers being earth. The walls remember being nothing.'), N('Kai Varen falls out of 2049 and lands somewhere older than the building.')] },
  // quest chain D: the maintenance lock resets every time the building changes its mind about the year
  onShift(rt) {
    const g = rt.g;
    if (g.facts.get('maint_open')) {
      g.facts.set('maint_open', false);
      g.deckWorld.refresh();
      g.hud.toast('<small>MAINTENANCE ROUTE</small><br>The lock resets.', 1800);
    }
  },
  fx: {
    ivenLure(rt) {
      // Marr walks out in front of the drone; it knows his face and follows him for a while
      const g = rt.g;
      const iv = g.deckWorld.npcs.find((n) => n.n.id === 'iven3');
      if (!iv) return;
      for (const s of g.deckWorld.sentinels) if (s.def.room === 'route') s.lure = { x: iv.model.position.x, z: iv.model.position.z, t: 45 };
      g.hud.toast('<small>IVEN MARR</small><br>The drone follows him. 45 seconds.', 2400);
    },
    firstCycle(rt) {
      const g = rt.g;
      const room = g.room;
      g.engine.setState(room, 'PAST', { force: true });
      g.audio.sweep(true);
      g.hud.say(M03_SAY.past, g.facts, () => {
        g.engine.setState(room, 'FUTURE', { force: true });
        g.audio.sweep(true);
        g.hud.say(M03_SAY.future, g.facts, () => {
          g.engine.setState(room, 'PRESENT', { force: true });
          g.audio.sweep(false);
          g.hud.say(M03_SAY.present, g.facts, () => g.facts.set('first_cycle'));
          g.hud.toast(g.touch ? '<small>THE YEAR</small><br>The YEAR button switches it' : '<small>THE YEAR</small><br>Q switches it · 1 2 3 pick one', 5200);
          g.deckWorld.refresh();
        });
      });
    },
    fracture(rt) {
      const g = rt.g;
      // staged (cinema.js: letterboxed, Kai held): Rook reads the number; the whiteout, a breath of silence, and the
      // year lets go (the hook, the mission's outro, follows in the same letterbox)
      rt.cinema.play({ shots: null, lines: M03_SAY.reading }, () => {
        g.hud.flash('rgba(255,255,255,0.95)');
        if (rt.score) rt.score.cue('fracture'); // a whiteout swell, a breath of silence, a fall, a landing
        else g.audio.silence(0.8);
        rt.cinema.play({ shots: null, total: 1.0 }, () => {
          g.engine.setState(g.room, 'PAST', { force: true });
          g.deckWorld.refresh();
          g.facts.set('fracture_done');
        });
      });
    },
  },
  step(rt) {
    const g = rt.g;
    // (playtest v2.1.1 L14: at the hall's floor level, on the lift or the far floor; landing on the debris in the pit past
    // the line is not crossing it)
    const hall = g.level.rooms.collapse;
    if (g.room === 'collapse' && !g.facts.get('crossed') && g.player.pos.z < hall.bounds[0][2] + 8 + 4 && g.player.grounded && g.player.pos.y > hall.spawn[1] - 0.5) g.facts.set('crossed');
  },
  done: 'fracture_done',
};
M03.outro = M03.hook.lines;

export const PROLOGUE = [M01, M02, M03];
