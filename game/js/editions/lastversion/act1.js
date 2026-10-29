// THE LAST VERSION OF EARTH: Act I, THE WORLD THAT REMEMBERS (OVERHAUL.md §5 M4-M8; about 186 minutes).
//
//   Mission 4  THE MAN FROM THE LAST DAY       the Ring Hill three thousand years ago: the village, and before the fire
//   Mission 5  THE VILLAGE THAT NEVER EXISTED   the river bend, thriving, abandoned and flooded; the upper gorge
//   Mission 6  THE CLOCKMAKER'S HOUSE           Old Town's canal street and Ezra Moll's light-well house, 2049 / 2026 / 2196
//   Mission 7  THE BROKEN OBSERVATORY           the Ridge's bronze rings at the first sky, blue hour and a windy 2196
//   Mission 8  THE FIRST DEATH                  Helix in VERSION 17: a full ring round a river court, a still afternoon
//
// Each mission is one map with soft quarters, threads and side stories (Threads.js), a cold open and a hook. Lines
// quoted from the bible are verbatim, with the bible's speakers (D16); the rest follows the voice rules (§9.1): short
// in danger, longer in safe places, objects and disagreement instead of speeches, phrases that come back changed.
import * as THREE from '../../../vendor/three.module.min.js';
import { CAST, WATER_HOOK, intent } from './npcs.js';
import { makeChronolith, makeClock, makeDrawing, makePhoto, makeLogbook, makeNotebook, makeCoatPegs, makeScreen, makePanel } from './Build.js';
import { makeKit } from './places/kits.js';
import { NO_MODEL } from './processes.js';
import { lendLooks } from './echoes.js';

const L = (who, text, when) => (when ? { who, text, when } : { who, text });
const N = (text, when) => L('NONE', text, when);
const K = (text, when) => L('KAI', text, when);
const CREW = (text, when) => L('CREW', text, when); // (said by the person being talked to, in their own voice)
// a line that turns the story over carries the reveal cue (score.js)
const REV = (l) => ({ ...l, voice: { ...(l.voice || {}), cue: 'reveal' } });
const FX = (l, fx) => ({ ...l, voice: { ...(l.voice || {}), fx } });
const C = (id) => CAST.findIndex((c) => c.id === id);
// a person a scene names, in their own recorded voice (a named tier-2 person, or a crowd voice)
const SAYS = (name, id, text, when) => ({ who: 'CREW', name, color: '#8a6a3a', voice: { id }, text, ...(when ? { when } : {}) });
const ELDER = (t, when) => SAYS('THE ELDER', 'ELDER', t, when);
const EZRA = (t, when) => SAYS('EZRA MOLL', 'CLOCKMAKER', t, when);
// someone a mission places by hand and talks to (their crowd voice named, so the voice packs know it)
const AMB = (id) => (text, when) => ({ who: 'CREW', text, voice: { id }, ...(when ? { when } : {}) });
const kit = (name) => () => makeKit(name);

// a person (or a thing) on a landmark, in the mission's overlay: [right, up, forward] in the landmark's frame
function spotAt(P, name, [dx, dy, dz] = [0, 0, 0]) {
  const [x, y, z, yaw] = P.at(name);
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [x + dx * c + dz * s, y + dy, z - dx * s + dz * c, yaw];
}
function person(P, o) {
  const { at, off, turn = 0, ...n } = o;
  const [x, y, z, yaw] = spotAt(P, at, off);
  // (a passer-by cast by role who can be talked to: DeckWorld offers a talk only to a passer-by with lines of their own;
  // what they say is the mission's talks for them)
  if (n.ambient && n.prompt && !n.lines) n.lines = [];
  P.npcs.push({ room: P.rid, ...n, pos: [x, n.y ?? y, z], yaw: yaw + turn });
}

// small things lying about (a card on a floor, a cassette in a tin)
function flatCard(color = 0xf4f4f0, w = 0.09, d = 0.055, edge = 0xc83a2a) {
  return () => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.004, d), new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
    const s = new THREE.Mesh(new THREE.BoxGeometry(w, 0.005, d * 0.22), new THREE.MeshBasicMaterial({ color: edge }));
    s.position.z = -d * 0.3;
    g.add(m, s);
    return g;
  };
}
function tin() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.09, 20), new THREE.MeshStandardMaterial({ color: 0x8a5a3a, metalness: 0.5, roughness: 0.6 }));
  m.position.y = 0.045;
  g.add(m);
  return g;
}

// =============================================================================================================
// Mission 4: THE MAN FROM THE LAST DAY
// =============================================================================================================
// (playtest v2.1.1 P4: these were fragments, "Whose blanket?", "A log stair."; now each tier is a sentence, as in
// Missions 5-8: the first says why, the second where, the third what to do)
const M04_HINTS = {
  wake: ['Somebody put a blanket over me. I should look round the house I woke in.', 'The blanket and the cup hang on a rail beside its door.', 'Go to the door of the house and look at the blanket.'],
  picto: ['They write in pictures here, and I can\'t read a word of it.', 'The pictures are carved on three standing stones round the fire: west, north and east of it.', 'Walk up to the three standing stones and look at each carving.'],
  telling: ['The children say a stone on a roof tells about me.', 'It stands on the Elder\'s roof, east of the fire. A log stair climbs the west side of her house.', 'Climb the log stair onto the roof and read the telling-stone.'],
  meal: ['They are cooking at the fire, and nobody here eats alone.', 'The first fire burns in the middle of the lower terrace.', 'Go to the fire and sit down with them.'],
  stele: ['A carved stone says who raised the ring. Carvings keep what they said before.', 'The stele stands on the high terrace, below the ring.', 'Read the stele, then switch to before the fire and read it again.'],
  frags: ['The same words are cut in three places, and each piece says only part of them.', 'Over a door on the lower terrace, on the grain store, and in the water steps.', 'Read the lintel and the grain store. The stone in the water steps is there only before the fire.'],
  elder: ['The Elder went up to the ring. She is waiting for me.', 'Her stone seat is on the summit, inside the ring.', 'Climb up to the ring and talk to the Elder at her seat.'],
  panels: ['Four carved panels tell the village\'s story, and they are out of order.', 'The ash under the cooking pot kept the order, one layer on another.', 'Put them in the order the ash lay: built, plenty, burned, left.'],
  card: ['Something lies on the floor of the chamber.', 'It is down here under the ring, near the panels.', 'Look down at the chamber floor and see what lies there.'],
  cord: ['The girl lost a stone ring before the houses were built.', 'Before the fire the hill is only grass. Her ring lies near the ring stones.', 'Switch to before the fire, find the cord in the grass by the ring, and give it back to her.'],
  niko: ['Niko keeps the village\'s stories, and he wants mine.', 'He waits down by the water steps, on the west side of the hill.', 'Go to the water steps and talk to Niko.'],
};
const GIRL = AMB('CROWD_CHILD');

export const M04 = {
  key: 'm04', n: 4, chapter: 'act1', name: 'THE MAN FROM THE LAST DAY', title: 'The Ancient Settlement', subtitle: 'A village built around a stone ring. Its leader knows the mark on your wrist.',
  logline: 'A village three thousand years before Helix, built round a stone ring.',
  place: 'valley_upper', sectors: 1, states: ['PRESENT', 'PAST'], drones: [0, 0, 0], ambience: 'water', ambient: 'settlement',
  labels: { PRESENT: 'THE VILLAGE', PAST: 'BEFORE THE FIRE' }, // three thousand years before Helix: here, now is the village
  motto: 'YOU CAME BEFORE THE FIRST FIRE', gate: 'THE UNDER-CHAMBER', crew: C('elder'),
  minutes: { main: 29, optional: 7 }, autoExit: 1.2, gateAfter: true,
  fragSpots: [['granary'], ['skyFloor', 'cistern'], ['ringStone']],
  fragments: [[
    'Grain tallies: built, full, burned. A fourth, scratched out.',
    'A sky map on a floor. One star not up yet.',
    'A hand-cut channel, and a stone that fits a hand.',
    'A bronze band, polished by a thousand years of hands.',
  ]],
  beats: [{ kind: 'custom', goal: 'Find out why the village knows your face.' }],
  // the cold open, before the title: the villagers' side, at night by the ring (stage: while it plays the hill is under
  // the stars, night its light; behind the title card the afternoon he wakes in comes back, v2.1 playtest F14)
  coldOpen: {
    first: true, stage: true, night: 0.8, minutes: 2, cue: 'card',
    // (the first shot rises as it backs away from the Elder's seat: at the seat's height it ran into the seat's back wall,
    // which filled the frame while Niko spoke)
    shots: [{ cam: [0, 12.3, -4.2], to: [0, 13.9, 1.6], look: 'ring', t: 9 }, { cam: 'underStair', look: 'ring', t: 8 }],
    // (Niko runs up to the Elder at the ring; they stand in the shot only while it plays)
    cast: [{ crew: 'elder', at: 'elderSeat', off: [-1, 0, -2.6], turn: 0.3 }, { crew: 'niko', at: 'elderSeat', off: [2.2, 0, -2.2], turn: -1.2 }],
    lines: [L('NIKO', 'Elder. By the ring. A man. He fell out of the stars.'), ELDER('Is there dust on him?'), L('NIKO', 'None.'),
      ELDER('Then it is him again. Put a blanket over him. And do not tell him he has been here before. He never believes it.')],
    // (beside the fire, over the heads of the people walking round it: in the fire it stood in their way)
    title: { shots: [{ cam: [7, 2.4, 77.5], look: 'blanketHouse', t: 6 }], lines: [N('He has slept through a day.')] },
  },
  quarters: [
    {
      name: 'THE FIRST FIRE',
      threads: [
        // (playtest v2.1 F14: the house was 7.6 m behind Kai with nothing at it. He starts at its door now, facing it, and
        // the blanket and the cup hang on a rail beside the door, a glint over them)
        { id: 'wake', kind: 'scene', scene: 'wake', at: 'blanketHouse', spot: { prompt: 'THE BLANKET', offset: [1.3, 1.3, 0.5], r: 2.8, kit: 'blanket' },
          goal: 'Look round the house you woke in.', because: 'Somebody put a blanket over a stranger.', done: 'ev_village_mark', hints: M04_HINTS.wake, minutes: 2 },
        { id: 'picto', kind: 'clue', need: 3, of: ['ev_picto_fire', 'ev_picto_water', 'ev_picto_ring'], after: ['wake'],
          spots: [
            { id: 'picto_fire', scene: 'picto_fire', at: 'pictoFire', prompt: 'THE CARVING', offset: [0, 1.2, 0.3], r: 2.6, model: NO_MODEL },
            { id: 'picto_water', scene: 'picto_water', at: 'pictoWater', prompt: 'THE CARVING', offset: [0, 1.1, 0.3], r: 2.6, model: NO_MODEL },
            { id: 'picto_ring', scene: 'picto_ring', at: 'pictoRing', prompt: 'THE CARVING', offset: [0, 1.1, 0.3], r: 2.6, model: NO_MODEL },
          ],
          goal: 'They write in pictures. Learn three of them.', because: 'Everyone here can read a wall but me.', hints: M04_HINTS.picto, minutes: 3 },
        { id: 'telling', kind: 'scene', scene: 'telling', at: 'tellingStone', after: ['wake'], spot: { prompt: 'THE TELLING-STONE', offset: [0, 0, 0], r: 3, model: kit('tellingStone'), when: '@PRESENT' },
          goal: 'Climb to the telling-stone on the Elder\'s roof.', because: 'The children say it tells about me.', done: 'ev_telling', hints: M04_HINTS.telling, minutes: 3 },
        { id: 'meal', kind: 'scene', scene: 'meal', at: 'firePit', after: ['picto', 'telling'], spot: { prompt: 'SIT AT THE FIRST FIRE', offset: [0, 1.0, 2.4], r: 3.2, model: NO_MODEL, when: '@PRESENT' },
          goal: 'Eat at the first fire. Ask about the others.', because: 'They keep saying "again".', done: 'ev_others_before', hints: M04_HINTS.meal, minutes: 3 },
      ],
      sides: [
        { id: 'cord', name: 'THE CHILD\'S STONE RING', giver: 'm4_girl', done: 'cord_returned', minutes: 4,
          threads: [
            { id: 'cordFind', kind: 'scene', scene: 'cord', at: 'childRingCord', spot: { prompt: 'A CORD IN THE GRASS', offset: [-0.5, 0.8, 0], r: 2.6, model: NO_MODEL, when: '@PAST && !has_cord' },
              goal: 'A girl lost a stone ring before the houses were built.', because: 'She says she lost it before she was born.', done: 'has_cord', hints: M04_HINTS.cord, minutes: 2 },
            { id: 'cordGive', kind: 'talk', npc: 'm4_girl', after: ['cordFind'], goal: 'Give the girl her ring back.', because: 'Three thousand years is a long time to look for something.', done: 'cord_returned', hints: M04_HINTS.cord, minutes: 2 },
          ] },
      ],
    },
    {
      name: 'THE WATER STEPS',
      threads: [
        { id: 'stele', kind: 'residue', at: 'stele', after: ['meal'],
          record: { official: 'The stele: THE RING WAS RAISED BY THE PEOPLE OF THE FIRST FIRE.', echo: 'Before the fire: THE RING WAS HERE. THE PEOPLE CAME TO IT. HE SAID NOT TO WRITE THAT DOWN.',
            hint: 'It said something else, before.', after: [K('They didn\'t raise it. They found it, and built round it.')], prompt: 'READ THE STELE', offset: [0, 1.6, 0.8], model: 'none', log: 'The ring was here first.' },
          goal: 'Read the stele, and what it said before the fire.', because: 'It says who raised the ring.', ev: 'found_not_built', hints: M04_HINTS.stele, minutes: 3 },
        { id: 'frags', kind: 'clue', need: 3, of: ['ev_frag_door', 'ev_frag_never', 'ev_frag_early'], after: ['meal'],
          spots: [
            { id: 'frag_door', scene: 'frag_door', at: 'lintelHouse', prompt: 'THE LINTEL', offset: [0, 1.6, -6.9], r: 2.8, model: NO_MODEL, when: '@PRESENT' },
            { id: 'frag_never', scene: 'frag_never', at: 'grainStore', prompt: 'THE GRAIN STORE', offset: [0, 0, 8.6], r: 3, model: kit('carvedStone'), when: '@PRESENT' },
            { id: 'frag_early', scene: 'frag_early', at: 'waterSteps', prompt: 'A STONE IN THE STEPS', offset: [-2.4, 0, 0], r: 3, model: kit('carvedStone'), when: '@PAST' },
          ],
          say: [K('Early for what?')],
          goal: 'Find the three pieces of the broken inscription.', because: 'The same words are cut in three places.', ev: 'he_is_early', hints: M04_HINTS.frags, minutes: 4 },
      ],
      sides: [
        { id: 'niko', name: 'NIKO\'S QUESTIONS', giver: 'niko', done: 'niko_told', minutes: 3,
          threads: [{ id: 'nikoAsk', kind: 'talk', npc: 'niko', at: 'waterSteps', goal: 'Niko wants to know where you come from.', because: 'He keeps the village\'s stories. He wants yours.', done: 'niko_told', hints: M04_HINTS.niko, minutes: 3 }] },
      ],
    },
    {
      name: 'THE RING',
      threads: [
        { id: 'elder', kind: 'talk', npc: 'elder', at: 'elderSeat', after: ['stele', 'frags'], goal: 'The Elder is waiting at the ring.', because: 'She knew the mark on my wrist before I did.', done: 'elder_met', hints: M04_HINTS.elder, minutes: 3 },
        { id: 'panels', kind: 'deduce', deduction: 'panels', at: 'panels', after: ['elder'], spotOpts: { offset: [0, -0.4, 1.4], r: 3 },
          goal: 'Under the ring: put the four carved panels in order.', because: 'The chamber will not open the rest until the story is told right.', hints: M04_HINTS.panels, minutes: 4 },
        { id: 'card', kind: 'scene', scene: 'card', at: 'card', after: ['panels'], spot: { prompt: 'WHAT LIES ON THE FLOOR', offset: [0, 0.05, 0], r: 2.4, model: flatCard(), when: 't_m04_panels' },
          goal: 'Something lies on the chamber floor.', because: 'Nobody has swept here in three thousand years.', done: 'card_found', hints: M04_HINTS.card, minutes: 1 },
      ],
    },
  ],
  talks: {
    elder: [
      { when: '!t_m04_meal', lines: [CREW('Eat first. Questions are lighter after bread.')] },
      { when: '!elder_met && !(t_m04_stele && t_m04_frags)', lines: [CREW('Read the stele and the three stones first. Then come up.')] },
      {
        when: '!elder_met',
        lines: [CREW('You came before the first fire.'), K('I\'ve never been here.'), CREW('That is what the others said.'),
          N('She turns your wrist to the light. The broken halo.'), CREW('It was cut over our doors before my grandmother\'s grandmother.')],
        choices: [
          intent('challenge', 'Who carved it?', { lines: [CREW('You did. You came back to show us how.')], set: { elder_met: true }, know: 1 }),
          intent('investigate', 'How many others?', { lines: [CREW('We stopped counting. Under the ring is a chamber with your name.')], set: { elder_met: true }, ev: 'others_before' }),
          intent('comfort', 'Thank you for keeping it.', { lines: [CREW('We kept it because you asked. Go under.')], set: { elder_met: true }, trust: 1 }),
        ],
      },
      { when: 'elder_met', lines: [CREW('Go under. It has waited longer than I have.')] },
    ],
    niko: [
      {
        when: '!niko_told',
        lines: [L('NIKO', 'What is it like, where you come from?')],
        choices: [
          intent('investigate', 'The truth.', { say: 'There are machines that remember time. I build them.', consequence: true, lines: [L('NIKO', 'Then you keep dangerous things too.')], set: { niko_told: 'truth' } }),
          intent('comfort', 'A story.', { say: 'There is a city of rain, where nobody is ever late.', consequence: true, lines: [L('NIKO', 'I will tell it to the children.')], set: { niko_told: 'story' } }),
          intent('withdraw', 'Nothing.', { say: 'I can\'t tell you.', consequence: true, lines: [L('NIKO', 'Then the wall stays blank.')], set: { niko_told: 'none' } }),
        ],
      },
      { when: 'niko_told', lines: [L('NIKO', 'Go up to the ring.')] },
    ],
    m4_girl: [
      { when: 'has_cord && !cord_returned', lines: [GIRL('My ring! I lost it before I was born.'), N('She ties it on, and does not ask how.')], set: { cord_returned: true }, log: 'The girl has her ring back.' },
      { when: 'cord_returned', lines: [GIRL('You wear no dust. Mother says that is rude.')] },
      { when: 'true', lines: [GIRL('I lost my ring. Before the houses. Before me.')] },
    ],
  },
  deductions: {
    panels: {
      question: [K('Building, plenty, burning, leaving. Which order?')],
      answers: [
        { intent: 'investigate', label: 'Built, plenty, burned, left.', correct: true, needs: 'ev_ash_layers', lines: [K('Cooking, feasting, then the burn. Then a cold hearth, swept clean. They left.'), N('The fourth panel sinks. The floor opens.')] },
        { intent: 'challenge', label: 'Built, burned, plenty, left.', lines: [K('No. Nothing grows here after a fire like that.')] },
        { intent: 'comfort', label: 'Left, built, plenty, burned.', lines: [K('They came to the ring first.')] },
      ],
      unproven: [K('I\'d be guessing. The fire keeps the order.')],
      set: { panels_ordered: true }, log: 'The under-chamber\'s panels: built, plenty, burned, left.',
    },
  },
  scenes: {
    wake: { lines: [N('A blanket, a cup of water, children in the doorway.'), K('My wrist. The cut\'s gone. It\'s a mark now.'), N('A broken halo. The same mark is over every door.')], set: { ev_village_mark: true } },
    picto_fire: { lines: [N('A fire, and people sitting round it in a circle.')], set: { ev_picto_fire: true } },
    picto_water: { lines: [N('A wave, and a hand turning it aside.')], set: { ev_picto_water: true } },
    picto_ring: { lines: [N('A broken halo, and a man whose feet do not touch the ground.'), K('That\'s my mark. They write it like a word.')], set: { ev_picto_ring: true } },
    telling: { lines: [N('The telling-stone: a man came with no dust on him, and slept beside the ring.'), N('He said he had never been here. We built him somewhere to come back to.')],
      set: { ev_telling: true }, log: 'A village built for my return.' },
    meal: {
      lines: [SAYS('A CRAFTSWOMAN', 'CROWD_F2', 'The first one came with a cut wrist, like yours, and asked for water.'),
        SAYS('THE STORYTELLER', 'CROWD_OLD_M', 'One came grey, and would not speak, and sat by the ring until it took him.'),
        SAYS('A VILLAGE GIRL', 'CROWD_CHILD', 'One of them cried.'),
        ELDER('Every one of them said: I have never been here.'), K('I\'ve never—'), N('Nobody laughs.'),
        N('The ash under the pot: cooking, feasting, a black burn, and on top a hearth swept clean and cold.')],
      set: { ev_others_before: true, ev_ash_layers: true }, log: 'Others came before me. One came grey.',
    },
    frag_door: { lines: [N('On the lintel: WHEN THE ONE WITH NO DUST RETURNS, SHOW HIM THE DOOR.')], set: { ev_frag_door: true } },
    frag_never: { lines: [N('On the grain store: HE WILL SAY HE HAS NEVER BEEN HERE.')], set: { ev_frag_never: true } },
    frag_early: { lines: [N('In the water steps: HE IS NOT LYING. HE IS EARLY.')], set: { ev_frag_early: true } },
    cord: { lines: [N('A stone ring on a cord, half sunk where a house will stand.'), K('Three thousand years early, and somebody has already lost it.')], set: { has_cord: true } },
    card: {
      lines: [REV(N('Under the ring, on a floor nobody has swept in three thousand years: a Helix access card. VAREN, K. ACCESS: ALL.')),
        N('The photograph is worn. The man in it has grey at the temples.'), K('That\'s me. That\'s me in twenty years.')],
      set: { card_found: true, ev_card_ancient: true }, log: 'My Helix card. My face, older.',
    },
  },
  // the Chronolith as the settlement keeps it (stone with a bronze band, inside the ring north of the under-chamber);
  // the Elder at the fire and then at the ring, the people of the meal, Niko by the water steps
  overlay(P) {
    const [x, , z] = P.at('underChamber');
    P.col([x - 2.3, 10, z - 10.3, x + 2.3, 14.2, z - 8.9]);
    P.inter.push({ id: 'chronolith_m04', kind: 'scene', scene: 'chronolith_m04', pos: [x, 12.05, z - 9.6], yaw: 0, r: 0, prompt: '', model: () => makeChronolith(0.5, 'stone'), room: P.rid });
    person(P, { id: 'elder_fire', crew: 'elder', at: 'firePit', off: [-2.6, 0, -1.8], turn: 0.9, when: '@PRESENT && !t_m04_meal', prompt: 'TALK TO THE ELDER' });
    // (in front of her seat, facing the ring: at 0.9 m she stood half inside the seat's stone)
    person(P, { id: 'elder_ring', crew: 'elder', at: 'elderSeat', off: [0, 0, 0.3], turn: Math.PI, when: 't_m04_meal && @PRESENT', prompt: 'TALK TO THE ELDER' });
    person(P, { id: 'm4_craft', crew: 'm4_craft', first: 'Craftswoman', seed: 401, ambient: true, at: 'firePit', off: [2.4, 0, -1.4], turn: -0.9, silent: true, when: '@PRESENT' });
    person(P, { id: 'm4_teller', crew: 'm4_teller', first: 'Storyteller', seed: 402, ambient: true, at: 'firePit', off: [1.8, 0, 2.2], turn: -2.4, silent: true, when: '@PRESENT' });
    person(P, { id: 'm4_girl', crew: 'm4_girl', first: 'Girl', seed: 403, ambient: true, at: 'firePit', off: [-1.6, 0, 2.6], turn: 2.6, when: '@PRESENT', prompt: 'TALK TO THE GIRL' });
    person(P, { id: 'niko', crew: 'niko', at: 'waterSteps', off: [1.6, 0, 3.2], turn: -Math.PI / 2, when: '@PRESENT', prompt: 'TALK TO NIKO' });
  },
  // the hook (§5 M4): Niko's last word, and the ring wakes
  hook: { cue: 'cliff', minutes: 1, lines: [L('NIKO', 'Now you have read it. Now you are not early any more.'), N('The ring hums.'), L('NIKO', 'It wakes when you come. Tomorrow it will show you the river.')] },
  done: 'card_found',
};
M04.outro = M04.hook.lines;

// =============================================================================================================
// Mission 5: THE VILLAGE THAT NEVER EXISTED
// =============================================================================================================
const M05_HINTS = {
  follows: ['Niko came down from the ring after me. He is waiting by the weir.', 'The weir is the low stone dam across the river, east of the village.', 'Walk to Niko at the weir and talk to him.'],
  divert: ['The river runs where the village will drown. Its head-stone could turn it.', 'The head-stone is by the weir. It only moves while the river is young: THRIVING.', 'Switch to THRIVING, stand at the head-stone and lift it.'],
  why: ['The village is empty. Something made them leave.', 'Three things kept count: tally marks on a wall, names in the stones, the cold hearths. Read them ABANDONED.', 'Switch to ABANDONED and read the tally marks, the names in the stones and the cold hearth.'],
  leave: ['The cold hearths kept something of the last night.', 'Go back to the cold hearth while the village is ABANDONED.', 'Stand at the cold hearth in ABANDONED and watch what it kept.'],
  wall: ['The retaining wall will have to hold the flood back.', 'It is the cracked wall on the river side of the village. It can be braced while it is ABANDONED.', 'Switch to ABANDONED and brace the retaining wall.'],
  mural: ['Somebody painted the village wall after everyone left.', 'The mural is at the village\'s west end, in ABANDONED.', 'Go to the painted wall in ABANDONED and look at it.'],
  gate: ['The flood needs a way out. The pressure gate is it.', 'The gate is on top of the tower in the flood. Switch to FLOODED to reach it.', 'In FLOODED, climb the tower and release the pressure gate.'],
  machine: ['The basin has drained, and something in the mud is humming.', 'The drained basin is south of the village, past the tower.', 'Go down into the basin and look at what hums in the mud.'],
  bury: ['Niko wants to choose who finds the machine.', 'He is waiting by the cairn stones, on the way down to the basin.', 'Go to Niko at the cairn stones and talk to him.'],
  water: ['Tala keeps the channel in the upper gorge.', 'The gorge opens upriver, past the weir.', 'Walk up the gorge past the weir and talk to Tala.'],
  cliff: ['The mural cliff was painted over.', 'While the river was alive it said something else. Read it again THRIVING.', 'Read the mural cliff, then switch to THRIVING and read it again.'],
  gates: ['Three gates, and the cliff says in which order.', 'First the low stone, then the high, then the middle.', 'Lift the low gate, then the high gate, then the middle one.'],
};
const M05_SAY = {
  gateOk: [[N('The lowest gate lifts. Under the water, a low note.')], [N('The highest gate lifts. A higher note.')], [N('The middle gate lifts, and the three notes are a song: up, up, and a stop.')]],
  gateWrong: [N('The water backs up toward the houses. Tala drops the gates again.'), L('TALA', 'Not that one. Stone does not argue, it only waits.')],
  gateNotNow: [K('The gates only move while the river is alive.')],
  askTala: [K('Tala\'s gates. I should ask her first.')],
  gatesDone: [N('The water takes the channel and leaves the houses dry.'), L('TALA', 'The river knows the way now. So do you.')],
};

export const M05 = {
  key: 'm05', n: 5, chapter: 'act1', name: 'THE VILLAGE THAT NEVER EXISTED', title: 'The settlement, thriving, abandoned, flooded', subtitle: 'Niko follows you through the years.',
  logline: 'The village at the river bend, in three of its lives.', spoken: M05_SAY,
  place: 'valley_river', sectors: 1, states: ['PAST', 'PRESENT', 'FUTURE'], drones: [0, 0, 0, 0], unstable: true, ambience: 'water', ambient: 'settlement',
  named: ['tala'], // (met in this mission's cold open: the settlement's women here wear the Elder's mesh, never Tala's face)
  labels: { PAST: 'THRIVING', PRESENT: 'ABANDONED', FUTURE: 'FLOODED' },
  motto: 'THE RIVER WAS TAUGHT TO STAY', gate: 'THE BURIED MACHINE', crew: C('niko'),
  minutes: { main: 30, optional: 10 }, autoExit: 1.2, gateAfter: true,
  fragSpots: [['weir'], ['stiltHouses', 'jetties'], ['basin'], ['aqueduct']],
  fragments: [[
    'A river-stone with a hand-print. While the river lives, it is wet.',
    'A fishing net in a house: dry in one year, drowned in another.',
    'A ladder out of the flood, food tied to its top rung.',
    'A retaining wall with one crack running through three centuries.',
    'Gorge walls marked at the height a river was taught to keep.',
  ]],
  beats: [{ kind: 'custom', goal: 'Follow the river through the village\'s years.' }],
  coldOpen: {
    minutes: 1, shots: [{ cam: 'millRace', look: 'headStone', t: 8 }],
    lines: [L('NIKO', 'The keepers said: never show him the river.'), L('TALA', 'The keepers also said he always finds it.'), L('NIKO', 'Then I would rather he found it with me.')],
  },
  quarters: [
    {
      name: 'THE HEAD-STONE',
      threads: [
        { id: 'follows', kind: 'talk', npc: 'niko', at: 'weir', goal: 'Niko followed you down from the ring.', because: 'He says the ring showed him the river too.', done: 'niko_follows', hints: M05_HINTS.follows, minutes: 2 },
        { id: 'divert', kind: 'scene', scene: 'divert', at: 'headStone', after: ['follows'], spot: { prompt: 'LIFT THE HEAD-STONE', offset: [-1.2, 1.0, 0], r: 3, model: NO_MODEL },
          goal: 'Turn the river at its head, while it is thriving.', because: 'The river runs where the village will drown.', done: 'river_diverted', hints: M05_HINTS.divert, minutes: 4 },
      ],
      sides: [],
    },
    {
      name: 'THE RETAINING WALL',
      threads: [
        { id: 'why', kind: 'clue', need: 3, of: ['ev_tally', 'ev_names', 'ev_hearths'], after: ['divert'],
          spots: [
            { id: 'tally', scene: 'tally', at: 'tallyWall', prompt: 'THE TALLY MARKS', offset: [0, 1.4, 0.5], r: 2.8, model: NO_MODEL, when: '@PRESENT' },
            { id: 'names', scene: 'names', at: 'wall80', prompt: 'NAMES IN THE STONES', offset: [-6, 1.2, -1.2], r: 2.8, model: NO_MODEL, when: '@PRESENT' },
            { id: 'hearths', scene: 'hearths', at: 'coldHearths', prompt: 'THE COLD HEARTH', offset: [0, 0.7, 1.2], r: 2.8, model: NO_MODEL, when: '@PRESENT' },
          ],
          goal: 'Abandoned: find out why they left.', because: 'Nobody leaves a village with a river like that.', hints: M05_HINTS.why, minutes: 4 },
        { id: 'leave', kind: 'playback', at: 'coldHearths', after: ['why'], until: 'gate_released', prompt: 'WATCH WHAT THE HEARTH KEPT', offset: [1.6, 0.8, 0], r: 3, model: NO_MODEL, spotWhen: '@PRESENT',
          echoes: [
            { crew: 'm5_potter', first: 'Potter', ambient: true, offset: [-2, 0, 2], path: [[-62, 2, -26], [-30, 2, -10], [-8, 2, -26]] },
            { crew: 'm5_mother', first: 'Mother', ambient: true, offset: [0, 0, 2.4], path: [[-60, 2, -27], [-28, 2, -11], [-6, 2, -27]] },
            { crew: 'm5_child', first: 'Child', ambient: true, offset: [1.4, 0, 3], path: [[-58, 2, -28], [-26, 2, -12], [-4, 2, -28]] },
          ],
          lines: [N('The echoes of a family lift their bundles and walk out, not looking at the ring.'),
            FX(SAYS('A CRAFTSWOMAN (ECHO)', 'CROWD_F2', 'It took the potter\'s son. He only touched it.'), 'echo'),
            K('They didn\'t leave because of the flood. They left because the ring kept taking people.'),
            L('NIKO', 'It took them when you came. Every time you came.'), K('Then they left because of me.')],
          goal: 'Watch what the cold hearths kept.', because: 'Somebody ate here the night before they went.', set: { ev_ring_took: true }, log: 'They left because the ring kept taking people. Every time I came.', hints: M05_HINTS.leave, minutes: 3 },
        { id: 'wall', kind: 'scene', scene: 'wall', at: 'wallBrace', after: ['divert'], spot: { prompt: 'BRACE THE WALL', offset: [0, 1.2, 0.6], r: 3, model: NO_MODEL },
          goal: 'Brace the retaining wall, while it is abandoned.', because: 'In the flood the water needs an edge to stop at.', done: 'wall_braced', hints: M05_HINTS.wall, minutes: 4 },
        { id: 'mural', kind: 'scene', scene: 'mural', at: 'muralWall', after: ['why'], until: 'gate_released', spot: { prompt: 'THE MURAL', offset: [0, 1.6, 0.8], r: 3, model: NO_MODEL, when: '@PRESENT' },
          goal: 'Somebody painted the village wall after they left.', because: 'Niko says it is a story he told.', done: 'ev_mural', hints: M05_HINTS.mural, minutes: 2 },
      ],
    },
    {
      name: 'THE PRESSURE GATE',
      threads: [
        { id: 'gate', kind: 'scene', scene: 'gate', at: 'gateTop', after: ['wall', 'leave', 'mural'], spot: { prompt: 'RELEASE THE GATE', offset: [0, 1.0, 0], r: 3, model: NO_MODEL },
          goal: 'Release the pressure gate, while it is flooded.', because: 'The wall holds now. The water has somewhere to go.', done: 'gate_released', hints: M05_HINTS.gate, minutes: 4 },
        { id: 'machine', kind: 'scene', scene: 'machine', at: 'buriedMachine', after: ['gate'], spot: { prompt: 'WHAT HUMS IN THE MUD', offset: [0, 0.9, 2.4], r: 3.2, model: NO_MODEL, when: 'gate_released' },
          goal: 'Go down into the drained basin.', because: 'Something under the mud is humming.', done: 'machine_found', hints: M05_HINTS.machine, minutes: 2 },
        { id: 'bury', kind: 'talk', npc: 'niko', at: 'cairnSite', after: ['machine'], goal: 'Niko is waiting by the cairn stones.', because: 'Someone will find it. He wants to choose who.', done: 'machine_buried', hints: M05_HINTS.bury, minutes: 3 },
      ],
    },
    {
      name: 'THE UPPER GORGE',
      threads: [],
      sides: [
        { id: 'water', name: 'THE WATER THAT REMEMBERS', giver: 'tala', start: 'quest_tala', done: 'water_route', minutes: 10,
          threads: [
            { id: 'tala', kind: 'talk', npc: 'tala', at: 'gorgeMouth', goal: 'Tala keeps the channel in the upper gorge.', because: 'She asked where I thought the river began.', done: 'quest_tala', hints: M05_HINTS.water, minutes: 3 },
            { id: 'cliff', kind: 'residue', at: 'muralCliff', after: ['tala'],
              record: { official: 'The mural cliff: THE RIVER WAS A GIFT OF THE SKY.', echo: 'Under the paint: THE RIVER WAS TAUGHT TO STAY BY THE ONE WITH NO DUST. FIRST THE LOW STONE, THEN THE HIGH, THEN THE MIDDLE.', hint: 'Painted over. While the river was alive it said something else.', prompt: 'READ THE CLIFF', offset: [0.8, 1.6, 0], model: 'none' },
              goal: 'Read the mural cliff, and what it said first.', because: 'Tala says the cliff remembers the gates.', hints: M05_HINTS.cliff, minutes: 3 },
            { id: 'gates', kind: 'tasks', of: ['gate_low', 'gate_high', 'gate_mid'], after: ['cliff'],
              spots: [
                { id: 'gorge_gate1', scene: 'gorge_gate1', at: 'gate1', prompt: 'THE LOW GATE', offset: [0, 1.2, 0], r: 3, model: NO_MODEL },
                { id: 'gorge_gate3', scene: 'gorge_gate3', at: 'gate3', prompt: 'THE HIGH GATE', offset: [0, 1.2, 0], r: 3, model: NO_MODEL },
                { id: 'gorge_gate2', scene: 'gorge_gate2', at: 'gate2', prompt: 'THE MIDDLE GATE', offset: [0, 1.2, 0], r: 3, model: NO_MODEL },
              ],
              goal: 'Lift Tala\'s three gates in their order, without flooding the houses.', because: 'Lift the wrong one and the houses remember.', done: 'water_route', hints: M05_HINTS.gates, minutes: 4 },
          ] },
      ],
    },
  ],
  talks: {
    niko: [
      { when: '!niko_follows', lines: [L('NIKO', 'You keep changing the world.'), K('I\'m trying to get home.'), L('NIKO', 'Then stop changing it.')], set: { niko_follows: true } },
      {
        when: 'machine_found && !machine_buried',
        lines: [L('NIKO', 'Bury it again, or leave it for whoever comes?')],
        choices: [
          intent('comfort', 'Bury it. Gently.', { consequence: true, lines: [N('Stones over the panel, in the pattern of the broken halo.')], set: { machine_buried: 'cairn' }, log: 'We buried the machine under a cairn.' }),
          intent('investigate', 'Leave it. Someone has to find it.', { consequence: true, lines: [N('You leave it humming in the clay.'), L('NIKO', 'Then it will wait. It is good at that.')], set: { machine_buried: 'clay' }, log: 'We left the machine in the clay.' }),
        ],
      },
      { when: 'river_diverted && !machine_found', lines: [L('NIKO', 'Every year you touch, the village answers. Be gentle with the water.')] },
      { when: 'true', lines: [L('NIKO', 'The keepers said you would find the river. Not what you would do with it.')] },
    ],
    tala: [
      { when: '!quest_tala', lines: [...WATER_HOOK, L('TALA', 'Three gates up the gorge. The cliff knows their order. Read it before you lift anything.')], set: { quest_tala: 'active' } },
      { when: 'quest_tala && !water_route', lines: [L('TALA', 'Read the cliff while the river is alive. Stone does not argue, it only waits.')] },
      { when: 'water_route', lines: [L('TALA', 'The channel will run for longer than either of us.')] },
    ],
  },
  scenes: {
    divert: { when: '@PAST', lines: [N('The head-stone lifts. The river takes the channel you offer it.'), K('In the next year the houses on the low bank are still standing. I did that.')], set: { river_diverted: true }, log: 'I turned the river at its head. The houses downstream changed shape.' },
    divert_no: { lines: [K('The stone only moves in the year it was cut. While the river is young.')] },
    tally: { lines: [N('Tally marks by the door, in fours. Under the last group, three words: THE RING TOOK THREE.')], set: { ev_tally: true } },
    names: { lines: [N('A family\'s names cut into the wall stones, one under another. The last one is a child\'s, half finished.')], set: { ev_names: true } },
    hearths: { lines: [N('Cold hearths, swept clean. Whoever lived here meant to be gone a long time.')], set: { ev_hearths: true } },
    wall: { when: '@PRESENT && river_diverted', lines: [N('Timber against stone. In the flood the water will have an edge to stop at.')], set: { wall_braced: true }, log: 'The wall braced while abandoned gives the flood an edge.' },
    wall_no: { lines: [K('Brace it while it\'s abandoned. After the river has been moved.')] },
    mural: {
      lines: [N('A mural on the village wall, painted by someone who came back.'),
        N('A man with no dust draws a machine that remembers time, and a keeper listens.', 'niko_told == "truth"'),
        N('A city of rain, where nobody is ever late. The children have added a dog.', 'niko_told == "story"'),
        N('A blank where a story should be, and a man with no dust, facing away.', '!niko_told || niko_told == "none"'),
        L('NIKO', 'You told me that. They painted what you told me.')],
      set: { ev_mural: true },
    },
    gate: { when: '@FUTURE && wall_braced', lines: [N('The gate releases. The flood goes out through a channel somebody taught it long ago.')], set: { gate_released: true }, log: 'The flood drained through the gate.' },
    gate_no: { lines: [K('The gate only answers while it\'s flooded, and only once the wall can hold.')] },
    machine: {
      lines: [REV(N('Under the drained mud: a panel, clean and humming, far beyond any year this village has seen.')), K('It\'s Helix. It\'s the ring. It\'s both, three thousand years early.')],
      set: { machine_found: true, ev_found_not_built: true }, log: 'Under the basin: the machine, three thousand years before Helix.',
    },
    gorge_gate1: { lines: [], then: 'gate1' },
    gorge_gate2: { lines: [], then: 'gate2' },
    gorge_gate3: { lines: [], then: 'gate3' },
  },
  overlay(P) {
    // (Niko follows Kai through the years, the bible's "through transitions": he is met in person in every one)
    person(P, { id: 'niko', crew: 'niko', at: 'weir', off: [1.8, 0, 2.6], turn: Math.PI, when: '!machine_found', prompt: 'TALK TO NIKO', inPerson: true });
    person(P, { id: 'niko_cairn', crew: 'niko', at: 'cairnSite', off: [0, 0, 1.6], turn: Math.PI, when: 'machine_found', prompt: 'TALK TO NIKO', inPerson: true });
    person(P, { id: 'tala', crew: 'tala', at: 'gorgeMouth', off: [1.8, 0, -4], turn: Math.PI / 2, prompt: 'TALK TO TALA' });
    // a water keeper at the head-stone while the river is alive
    person(P, { id: 'm5_keeper', crew: 'm5_keeper', first: 'Water keeper', seed: 501, ambient: true, at: 'headStone', off: [-2.4, 0, 3], turn: -0.6, when: '@PAST', silent: true });
    // the cairn stones Niko sets over the machine, if it is buried
    const [cx, cy, cz] = P.at('buriedMachine');
    P.W('machine_buried == "cairn"', () => {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        P.box([cx + Math.cos(a) * 2.6 - 0.4, cy, cz + Math.sin(a) * 2.6 - 0.4, cx + Math.cos(a) * 2.6 + 0.4, cy + 0.7, cz + Math.sin(a) * 2.6 + 0.4], 'riverStone', { solid: false });
      }
    });
  },
  fx: {
    // the gorge's three gates: low, then high, then middle, only while the river is alive; each lifted sounds a note
    gate1: (rt) => gorgeGate(rt, 0),
    gate3: (rt) => gorgeGate(rt, 1),
    gate2: (rt) => gorgeGate(rt, 2),
  },
  hook: { cue: 'cliff', minutes: 1, lines: [L('NIKO', 'Helix did not invent the machine. It found it.'), K('You can\'t know that word.'), L('NIKO', 'It is written on the card you carry.'),
    N('The machine knows the mark on your wrist, and the valley folds.'), N('Ticking. Hundreds of clocks, none of them agreeing.'), EZRA('You\'re early. You were expected in the ninth minute.')] },
  done: 'machine_buried',
};
M05.outro = M05.hook.lines;

// a gorge gate, k-th in the right order (low 0, high 1, middle 2)
function gorgeGate(rt, k) {
  const g = rt.g, f = g.facts;
  if (g.engine.state(g.room) !== 'PAST') return g.hud.say(M05_SAY.gateNotNow, f);
  if (!f.get('quest_tala')) return g.hud.say(M05_SAY.askTala, f);
  // (no gate up is the count's start, whatever an earlier run left in it: a CASE FILES replay of chain B)
  const n = ['gate_low', 'gate_high', 'gate_mid'].some((x) => f.get(x)) ? f.get('gates_n') || 0 : 0;
  if (f.get('water_route')) return;
  const note = [261.63, 349.23, 466.16][k];
  g.audio.bell?.(note, g.audio.ctx?.currentTime || 0, 0.06, g.audio.sfx);
  if (k !== n) {
    f.set('gates_n', 0);
    for (const x of ['gate_low', 'gate_high', 'gate_mid']) f.set(x, false);
    return g.hud.say(M05_SAY.gateWrong, f);
  }
  f.set('gates_n', n + 1);
  f.set(['gate_low', 'gate_high', 'gate_mid'][k], true);
  g.hud.say(M05_SAY.gateOk[k], f, () => {
    if (n + 1 < 3) return;
    f.set('water_route', true);
    f.set('quest_tala', 'resolved');
    f.set('ev_water_gates', true);
    g.log.push('Tala\'s three gates: low, high, middle. The water route is open in every year.');
    g.hud.say(M05_SAY.gatesDone, f);
  });
}

// =============================================================================================================
// Mission 6: THE CLOCKMAKER'S HOUSE
// =============================================================================================================
const M06_HINTS = {
  cellar: ['Somewhere above me a clock is ticking for me. I should go up.', 'The stone steps at the back of the cellar go up into the shop.', 'Climb the cellar steps into the clockmaker\'s shop.'],
  ezra: ['The clockmaker looked up as if I were late. He wants a word.', 'He is behind his counter, on the shop floor.', 'Walk up to the counter and talk to Ezra Moll.'],
  arm: ['That brass arm keeps sweeping the floor. He set it going for somebody.', 'It turns on its post in the front of the shop, and it always comes back.', 'Watch the arm from the counter, and count its sweeps.'],
  // (playtest v2.1.1 L16: "Go when it has passed" is what gets Kai hit, as the toast after a hit has said since v2.1.1)
  cross: ['The stair is past the arm, and the arm always comes back.', 'At the brass ring, let an end sweep past me, and count two before I go.', 'Let an end pass, count two, then follow it across, the way it turns.'],
  windows: ['A clockmaker\'s window is his notebook. His is full of clocks.', 'The shop window looks out onto the canal street.', 'Go out into the street and read the three faces in the window.'],
  boards: ['A worn line in the floor.', 'Now, and in 2026.', 'Look at the boards in both.'],
  stair: ['The path worn into the boards runs straight into a brick wall.', 'In 2026 the path did not stop there. Something stood at that wall.', 'Compare the boards now and in 2026, then piece the stair together.'],
  clocks: ['Three clocks, three years.', 'Each answers in one year. The window gives the hours.', 'Morning in 2026, evening in 2049, noon in 2196.'],
  recording: ['Something clicked open when the clocks agreed.', 'A glass case stands by the wall of the clock room.', 'Open the case by the wall and see what it holds.'],
  spring: ['The loop has a spring.', 'On the roof, in 2196.', 'Find it in the ruin.'],
  debt: ['Ezra owes fifty years to somebody. The spring might pay some of it.', 'He is back at his counter, still repeating with the arm.', 'Take the spring to Ezra and talk to him.'],
  gauge: ['Ezra mended something for Helix once. There may be proof of it here.', 'His workbench is in the shop, the way it stood in 2026.', 'Switch to 2026 and look at the gauge on his workbench.'],
  ledger: ['A clockmaker writes down who is coming. I want to see that page.', 'His appointment book lies open on the counter.', 'Read the book now, then switch to 2026 and read it again.'],
  echo26: ['In 2026 Ezra was already waiting for me. His echo is still talking.', 'His echo stands at the counter, but only in 2026.', 'Switch to 2026 and listen to Ezra\'s echo at the counter.'],
};

// what Mission 6's code says (fx.agree and step; voicelines.js walks them for the packs)
const M06_SAY = {
  agree: [N('Three clocks, three years. The escapement catches. Every clock agrees.'), N('The house chimes: up, up, and a stop.')],
  // (said when the arm first knocks Kai back, with the toast's advice: playtest v2.1.1 L16)
  armHit: [K('Too soon. Let an end pass, count two, then follow it across.')],
};
// a brass clock of the escapement: in its own year (and once the window has been read), a choice of hour; the right one
// holds, a wrong one slips back. In another year its hands will not move.
const HOURS = [['investigate', 'Morning.', 'morning'], ['comfort', 'Evening.', 'evening'], ['challenge', 'Noon.', 'noon']];
const CLOCK_SLIP = [N('The hands take the hour, and the escapement slips them back. Not that one.')];
const clockNo = (fact) => ({ lines: [N('It holds its hour.', fact), K('The hands won\'t move. Not in this year.', `!${fact} && ev_window_faces`),
  K('Which hour would it want? The shop window keeps the hours.', `!${fact} && !ev_window_faces`)] });
const clockNode = (year, fact, hour, ok) => ({
  when: `${year} && ev_window_faces && !${fact}`, lines: [N('A brass clock with its hands loose. It waits for an hour.')],
  choices: HOURS.map(([i, label, h]) => intent(i, label, h === hour ? { lines: ok, set: { [fact]: true } } : { lines: CLOCK_SLIP })),
});
// the shop window's three faces, one shot each from the street as the line says them: 2026's morning, 2049's evening,
// 2196's noon, each over its year (places/specs/oldtown.js), then back to Kai
function m06WindowShots(rt) {
  const g = rt.g, w = rt.level?.landmarks?.shopWindows, p = g.player.pos;
  if (!w) return null;
  const dur = (l) => g.hud.durFn?.(l) || Math.max(2.2, l.text.length * 0.055);
  const t = dur(rt.deck.scenes.windows.lines[0]) / 3;
  const face = (x) => ({ cam: [x + 0.3, 1.75, w[2] + 2.3], to: [x + 0.1, 1.72, w[2] + 1.9], look: [x, 1.6, w[2] - 0.15], t });
  return [face(9.7), face(12.2), face(20.3), { cam: [p.x + 2.2, p.y + 1.2, p.z + 3.2], to: [p.x + 1.8, p.y + 1.1, p.z + 2.6], look: [w[0] + 4, 1.8, w[2]] }];
}

export const M06 = {
  key: 'm06', n: 6, chapter: 'act1', name: 'THE CLOCKMAKER\'S HOUSE', title: 'A workshop that repeats itself', subtitle: 'The clockmaker says you visited decades ago.',
  logline: 'A clockmaker\'s house on the old canal, in three years.',
  place: 'oldtown', sectors: 1, states: ['PRESENT', 'PAST', 'FUTURE'], drones: [0, 0, 0], motto: 'YOU ASK WHAT TIME IT IS. WRONG QUESTION',
  ambience: 'hum', ambient: 'rain', crew: C('clockmaker'),
  minutes: { main: 26, optional: 10 }, autoExit: 1.2, gateAfter: true,
  fragSpots: [['canalBridge'], ['galleries']],
  fragments: [[
    'A canal where a river was, walled with stones cut like the head-stone.',
    'A clock on the second gallery whose hands go round both ways at once.',
  ]],
  beats: [{ kind: 'custom', goal: 'Find out what the clockmaker is waiting for.' }],
  // the cold open, after the title: what the shop kept of 1999
  coldOpen: {
    minutes: 1, shots: [{ cam: 'shopWindows', to: 'shopFloor', look: 'repeatArm', t: 9 }],
    // (what the shop kept of 1999, a residue in its oldest year: the hooded man at the counter, Ezra's echo behind it)
    year: 'PAST', cast: [{ crew: 'witness', variant: 'hooded', hologram: true, at: 'shopFloor', off: [0.2, 0, 1.2], turn: Math.PI }],
    lines: [N('1999. A man in a hood pays the clockmaker in advance. His wrist is scarred.'), FX(L('WITNESS', 'Set the arm to repeat. He\'ll need to learn it.'), 'echo'),
      FX(EZRA('Repeat for how long?'), 'echo'), FX(L('WITNESS', 'Until he comes. He will be early. He is always early.'), 'echo')],
  },
  quarters: [
    {
      name: 'SHOP FLOOR & CANAL STREET',
      threads: [
        { id: 'cellar', kind: 'go', at: 'shopFloor', r: 3.5, goal: 'Up the cellar steps into the shop.', because: 'Somewhere above me, a clock is ticking for me.',
          say: [K('These steps went down to a river once. I turned it.')], hints: M06_HINTS.cellar, minutes: 2 },
        { id: 'ezra', kind: 'talk', npc: 'clockmaker', at: 'shopFloor', after: ['cellar'], goal: 'Talk to the clockmaker.', because: 'He looked up as if I were late.', done: 'ezra_met', hints: M06_HINTS.ezra, minutes: 3 },
        // (watched from the counter's side, outside the brass ring, and only until it has been: at the arm's post, offered
        // again after, its prompt floated over the arm all through the crossing and a tap replayed the scene)
        { id: 'arm', kind: 'scene', scene: 'arm', at: 'repeatArm', after: ['ezra'], spot: { prompt: 'WATCH THE ARM', offset: [-3.4, 0.6, 0], r: 3, model: NO_MODEL, when: '!ev_arm_count' },
          goal: 'Watch the repeating arm.', because: 'He set it repeating for somebody.', done: 'ev_arm_count', hints: M06_HINTS.arm, minutes: 2 },
        { id: 'windows', kind: 'scene', scene: 'windows', at: 'shopWindows', after: ['ezra'], spot: { prompt: 'THE THREE FACES', offset: [0, 0, 1.6], r: 3, model: NO_MODEL },
          goal: 'Read the three clock faces in the shop window.', because: 'A clockmaker\'s window is his notebook.', done: 'ev_window_faces', hints: M06_HINTS.windows, minutes: 1 },
        // (the closing pass: fifty years of Tuesdays, written down: the appointment he kept for Kai, and who paid for it)
        { id: 'ledger', kind: 'residue', at: 'shopFloor', after: ['ezra'],
          record: { official: 'APPOINTMENTS. TUESDAY, FOUR IN THE AFTERNOON: V. The same line on every page, back to 1999.', echo: 'In 2026, the first page: TUESDAY: V. PAID IN ADVANCE. DO NOT ASK HIS NAME. HE WILL NOT KNOW IT YET.',
            hint: 'The same appointment, on every page.', after: [K('Every Tuesday for fifty years, he wrote me in.')], prompt: 'THE APPOINTMENT BOOK', offset: [0.2, 1.0, 0], kit: 'ledger',
            log: 'Ezra\'s appointment book: V., every Tuesday since 1999, paid in advance.' },
          goal: 'The appointment book on the counter.', because: 'A clockmaker writes down who is coming.', ev: 'tuesdays', hints: M06_HINTS.ledger },
        // (the closing pass: Ezra at sixty-five, in 2026, talking to the spot where Kai will stand)
        { id: 'echo26', kind: 'talk', npc: 'ezra_shop26', at: 'shopFloor', after: ['ezra'], goal: 'In 2026 Ezra was sixty-five, and already waiting.', because: 'His echo is still at the counter, talking.', done: 'ev_ezra26', hints: M06_HINTS.echo26 },
        { id: 'cross', kind: 'go', at: 'galleryLanding', r: 3, after: ['arm'], when: 'ev_arm_count', goal: 'Get past the arm to the stair.', because: 'It sweeps the floor between the counter and the stair. It always comes back.', hints: M06_HINTS.cross, minutes: 3 },
      ],
      sides: [
        { id: 'gauge', name: 'ROOK\'S GAUGE', giver: 'clockmaker', done: 'ev_rook_gauge', minutes: 2,
          threads: [{ id: 'gauge', kind: 'scene', scene: 'gauge', at: 'shopFloor', spot: { prompt: 'THE 2026 WORKBENCH', offset: [-1.6, 1.0, -3.2], r: 2.6, model: kit('brassPlate'), when: '@PAST' },
            goal: 'Ezra mended something for Helix, once.', because: 'A gauge with a Helix stamp, on a 2026 bench.', done: 'ev_rook_gauge', hints: M06_HINTS.gauge, minutes: 2 }] },
      ],
    },
    {
      name: 'THE GALLERIES',
      threads: [
        { id: 'boards', kind: 'clue', need: 2, of: ['ev_boards_now', 'ev_boards_then'], after: ['cross'],
          spots: [
            // (playtest v2.1 F13: read again and again, the boards took the focus from PIECE IT TOGETHER beside them; once
            // both are read they have said what they have to say)
            { id: 'boards_now', scene: 'boards_now', at: 'floorboards', prompt: 'THE WORN BOARDS', offset: [0, 0.6, 1], r: 2.8, model: NO_MODEL, when: '!@PAST && !(ev_boards_now && ev_boards_then)' },
            { id: 'boards_then', scene: 'boards_then', at: 'floorboards', prompt: 'THE BOARDS, 2026', offset: [0, 0.6, 1], r: 2.8, model: NO_MODEL, when: '@PAST && !(ev_boards_now && ev_boards_then)' },
          ],
          goal: 'The gallery floor is worn in a line. Compare it with 2026.', because: 'Nobody wears a path to a wall.', hints: M06_HINTS.boards, minutes: 2 },
        { id: 'stair', kind: 'deduce', deduction: 'stair', at: 'floorboards', after: ['boards'], spotOpts: { offset: [1.4, 0.6, 1], r: 2.8 },
          goal: 'Where does the worn path go?', because: 'Ezra said the house has a stair he does not use.', hints: M06_HINTS.stair, minutes: 3 },
      ],
      sides: [],
    },
    {
      name: 'THE CLOCK ROOM / ROOF',
      threads: [
        // the escapement (the sheet's [6]): three brass clocks, each answering in one year only, each to be set to the hour
        // the shop window gives that year (2026 morning, 2049 evening, 2196 noon); a wrong hour slips back
        { id: 'clocks', kind: 'tasks', of: ['clk_26', 'clk_49', 'clk_96'], after: ['stair', 'windows', 'ledger', 'echo26'],
          spots: [
            { id: 'clock26', scene: 'clock26', at: 'clock2026', prompt: 'THE BRASS CLOCK', offset: [0, -0.4, 1.2], r: 2.6, model: NO_MODEL },
            { id: 'clock49', scene: 'clock49', at: 'clock2049', prompt: 'THE BRASS CLOCK', offset: [0, -0.4, 1.2], r: 2.6, model: NO_MODEL },
            { id: 'clock96', scene: 'clock96', at: 'clock2196', prompt: 'THE BRASS CLOCK', offset: [0, -0.4, 1.2], r: 2.6, model: () => makeClock({ mode: 'stopped' }) },
          ],
          goal: 'Set the three clocks: each in the year it answers, to that year\'s hour.', because: 'The escapement only runs when all three agree.', done: 'clock_set', hints: M06_HINTS.clocks, minutes: 6 },
        { id: 'recording', kind: 'scene', scene: 'recording', at: 'recordingCase', after: ['clocks'], spot: { prompt: 'OPEN THE CASE', offset: [0.8, 1.2, 0], r: 2.6, model: NO_MODEL },
          goal: 'Something opened when the clocks agreed.', because: 'A case by the wall clicked.', done: 'recording_found', hints: M06_HINTS.recording, minutes: 2 },
      ],
      sides: [
        { id: 'debt', name: 'THE CLOCKMAKER\'S DEBT', giver: 'clockmaker', done: 'ezra_debt', minutes: 8,
          threads: [
            { id: 'spring', kind: 'scene', scene: 'spring', at: 'loopSpring', spot: { prompt: 'THE LOOP\'S SPRING', offset: [0, 0.6, 0], r: 2.6, model: NO_MODEL, when: '@FUTURE && !has_spring' },
              goal: 'The arm repeats on a spring. Find it in the ruin of 2196.', because: 'Fifty years is a long time to wind anything.', done: 'has_spring', hints: M06_HINTS.spring, minutes: 3 },
            { id: 'debtTalk', kind: 'talk', npc: 'clockmaker', after: ['spring'], goal: 'Take Ezra the spring.', because: 'He has been repeating with the arm.', done: 'ezra_debt', hints: M06_HINTS.debt, minutes: 5 },
          ] },
      ],
    },
  ],
  talks: {
    clockmaker: [
      {
        when: '!ezra_met',
        lines: [CREW('Sit down, child. You\'re early.'), K('I\'ve never been in this shop.'), CREW('You said that in 1999 as well. You were greyer then.'),
          CREW('You ask what time it is. Wrong question.'), K('What\'s the right one?'), CREW('Which version of the question are you asking?')],
        choices: [
          intent('investigate', 'Who paid you in 1999?', { lines: [CREW('A man with your wrist. He paid in advance for a clock nobody has built yet.')], set: { ezra_met: true }, ev: 'clock_question' }),
          intent('comfort', 'You knew I\'d come.', { lines: [CREW('Every Tuesday for fifty years, child. You were always about to.')], set: { ezra_met: true }, trust: 1 }),
          intent('challenge', 'Stop calling me child.', { lines: [CREW('When you stop being one.')], set: { ezra_met: true }, trust: -1 }),
        ],
      },
      {
        when: 'has_spring && !ezra_debt',
        lines: [CREW('He asked me to keep the arm repeating until you came. Somebody has to repeat with it.'), K('How long?'), CREW('Fifty years of Tuesdays. I liked Tuesdays.')],
        choices: [
          intent('comfort', 'Let it go. Have a Wednesday.', { consequence: true, lines: [CREW('A Wednesday. I shall need a new apron.')], set: { ezra_debt: 'release' }, log: 'I let the clockmaker\'s loop go. He will have a Wednesday.' }),
          intent('investigate', 'Finish your last clock first.', { consequence: true, lines: [CREW('Then I will finish it. The only clock in the house that keeps its own time.')], set: { ezra_debt: 'finish' }, log: 'Ezra will finish his last clock before the loop lets go.' }),
        ],
      },
      { when: 'ezra_met && !clock_set', lines: [CREW('Three clocks upstairs. Set each in its own year, child.')] },
      { when: 'true', lines: [CREW('The arm keeps time. I only keep the arm.')] },
    ],
  },
  deductions: {
    stair: {
      question: [K('A worn path that ends at brick. What was there?')],
      answers: [
        { intent: 'investigate', label: 'A stair. Bricked up after 2026.', correct: true, needs: 'ev_boards_now && ev_boards_then', lines: [K('A stair. Somebody used it every day, then bricked it in.')] },
        { intent: 'challenge', label: 'A cupboard.', lines: [K('Nobody wears a path to a cupboard.')] },
        { intent: 'comfort', label: 'Nothing. Old wood wears.', lines: [K('Not in a line, it doesn\'t.')] },
      ],
      unproven: [K('I\'ve only seen the boards in one year.')],
      set: { stair_found: true }, log: 'In 2026 a stair ran up the north wall.',
    },
  },
  scenes: {
    arm: { lines: [N('The brass arm sweeps the shop floor, and comes back, and comes back.'), N('Scratched into the floor beside its pivot, a tally: two thousand six hundred and nine.'), K('Fifty years of Tuesdays.')],
      set: { ev_arm_count: true }, log: 'The arm has turned two thousand six hundred and nine times.' },
    // (each face seen as the line names it, from the street: v2.1 playtest F07 named Mission 6's clock faces among the
    // payoffs only a caption showed; m06WindowShots)
    windows: { lines: [N('Three faces in the window: morning, evening, noon. Under each, a year: 2026, 2049, 2196.')], set: { ev_window_faces: true }, show: 'm06_window_view' },
    boards_now: { lines: [N('The boards are worn in a path toward the north wall, and stop at brick.')], set: { ev_boards_now: true } },
    boards_then: { lines: [N('In 2026 the path runs on, up a stair later years do not have.')], set: { ev_boards_then: true } },
    clock26: clockNode('@PAST', 'clk_26', 'morning', [N('Morning, as the window says. The clock takes the hour, and holds it.')]),
    clock26_no: clockNo('clk_26'),
    clock49: clockNode('@PRESENT', 'clk_49', 'evening', [N('Evening. The clock takes the hour, and holds it.')]),
    clock49_no: clockNo('clk_49'),
    clock96: clockNode('@FUTURE', 'clk_96', 'noon', [N('Noon, under a roofless lantern. The clock takes the hour, and holds it.')]),
    clock96_no: clockNo('clk_96'),
    recording: { lines: [N('In the case, a recording cylinder. The label is in a hand that is nearly yours: FOR THE CHILD.')], set: { recording_found: true, ev_witness_recording: true },
      log: 'A recording, labelled in a hand that is nearly mine.' },
    spring: { lines: [N('In the ruin of 2196, the loop\'s spring, rusted into a knot. Fifty years of Tuesdays, wound tight.')], set: { has_spring: true } },
    ezra_echo: {
      lines: [N('2026. Ezra at sixty-five, his hair still brown at the edges, oiling the arm.'), EZRA('Twenty-seven years of Tuesdays. Half done, child. Half done.'),
        K('You can see me?', '!ev_ezra26'), EZRA('I can see where you will stand. I have talked to that spot since 1999. It is nice when it answers.', '!ev_ezra26'),
        EZRA('Your sister came in once. Nine years old, yellow boots. She wanted a watch that went backwards.', '!ev_ezra26'), K('Did you make her one?', '!ev_ezra26'),
        EZRA('I made her one that went forwards very slowly. She said it would do.', '!ev_ezra26')],
      set: { ev_ezra26: true }, log: 'In 2026 Ezra made Mira a watch that went forwards very slowly.',
    },
    gauge: { lines: [N('On the 2026 workbench: a brass ring gauge stamped HELIX, tagged for return.'), EZRA('A Dr. Rook. Very polite. Very frightened.')], set: { ev_rook_gauge: true } },
  },
  spoken: M06_SAY,
  rules: [
    // the three clocks agree: the escapement runs, and the house chimes the three notes
    // (playtest v2.1 F13: said as the rule fired, these came before Kai's "Noon." and the last clock's own line, which
    // the same tap queues after them; now they wait for the clock's lines: fx.agree)
    { id: 'clocks', when: 'clk_26 && clk_49 && clk_96', set: { clock_set: true }, then: 'agree' },
  ],
  fx: {
    chime(rt) {
      const a = rt.g.audio;
      if (!a?.ctx) return;
      [392, 523.25, 698.46].forEach((f, i) => a.bell?.(f, a.ctx.currentTime + 0.4 + i * 0.5, 0.05, a.sfx));
    },
    // the escapement catches once the last clock's lines are over (they are queued by the tap that set the hour)
    agree(rt) {
      const g = rt.g, deck = rt.deck;
      const go = (n = 0) => {
        if (rt.deck !== deck) return;
        if ((g.hud.talking || g.menu) && n < 120) return g.after(0.25, () => go(n + 1));
        g.hud.say(M06_SAY.agree, g.facts);
        M06.fx.chime(rt);
      };
      g.after(0.1, () => go());
    },
  },
  // the brass arm (playtest v2.1 F02, X02): a whoosh as an end of the bar comes round toward Kai, and the first time it
  // knocks him back, what it was and how to cross it (later, that in 2196 it has rusted still). How: count two after an
  // end has passed, then follow it, the way it turns. Walking in at once, as the toast first said, a walker gains on the
  // bar near its post and is hit; against its turn, near the post, the bar's other half meets him (the two halves are
  // half a turn apart). The safe start following it, walking: 1.7-3.1 s after an end passes 1 m from the post, 2.1-2.9 s
  // at 0.6 m, the closest the post lets Kai by, 0.9-3.2 s at the ring's edge (v2.1.1 release check;
  // tests/lv-fix-release.test.mjs)
  step(rt) {
    const g = rt.g, f = g.facts;
    rt.cinema?.watchShow?.('m06_window_view', m06WindowShots);
    // (playtest v2.1 F16: Ezra at sixty-five, his own face and his brown hair in the echo, not a white figure)
    lendLooks(g, (n) => /^ezra_/.test(n.id));
    const h = g.deckWorld.hazards.find((x) => x.hz.lvKit === 'brassArm');
    if (!h || g.room !== h.hz.room) return;
    const p = g.player.pos, [px, py, pz] = h.hz.pivot, R = h.hz.radius;
    const d = Math.hypot(p.x - px, p.z - pz);
    const feet = p.y - g.player.half.y;
    if (g.catching && !rt.m06Hit && d < R + 0.8 && feet < py + 0.3 && feet > py - 2) {
      rt.m06Hit = true;
      const n = (rt.m06Hits = (rt.m06Hits || 0) + 1);
      g.after(0.8, () => {
        if (rt.deck?.key !== 'm06') return;
        if (!f.get('arm_hit_told')) {
          f.set('arm_hit_told');
          g.hud.toast('<small>THE BRASS ARM</small><br>It knocked you back to the counter. At the brass ring, let an end sweep past you, count two, then follow it across, the way it turns.', 7000);
          g.hud.say(M06_SAY.armHit, f);
        } else if (n >= 3 && !f.get('arm_still_told') && g.engine.statesOf(g.room).includes('FUTURE')) {
          f.set('arm_still_told');
          g.hud.toast('<small>THE BRASS ARM</small><br>In 2196 it has rusted still.', 5000);
        }
      });
    }
    if (!g.catching) rt.m06Hit = false;
    // (a setback on the shop floor puts Kai back by the counter, not at the foot of the cellar steps: X02; on the canal
    // street, outside the shop door. main.js has just set the quarter's checkpoint, the cellar's; this runs after it)
    // (the shop door's spot only for the street in front of the house: further along the canal, the bank Kai was on, where
    // he was, as the crowd walks it. The band reached the whole canal, and a fall into it 60 m off put him back at the
    // shop door; v2.1 playtest review)
    const lm = rt.level?.landmarks;
    const street = p.z >= -16 && p.z < 16 && feet > -2 && feet < 3.5 ? lm?.streetReturn : null;
    const back = p.x >= 8 && p.x < 24 && p.z >= -32 && p.z < -16 && feet > -0.5 && feet < 3.5 ? lm?.shopReturn
      : !street ? null : p.x >= 4 && p.x < 28 && p.z < 0 ? street
        : [Math.max(-50, Math.min(50, p.x)), 0, p.z < 0 ? -9 : 9, p.z < 0 ? street[3] : street[3] + Math.PI];
    if (back && (g.player.grounded || g.catching)) g.checkpoint = [back[0], back[1] + 0.86, back[2], back[3]];
    const turning = !(h.stasisT > 0) && !g.engine.hasIn('timeStop', h.hz.room);
    if (!turning || d > R + 2.5 || d < 0.3 || feet > py + 0.3) return;
    // how far the bar still turns before an end points at Kai (its ends are half a turn apart)
    const a = Math.atan2(-(p.z - pz), p.x - px), dir = g.engine.hasIn('timeReverse', h.hz.room) ? -1 : 1;
    let left = ((a - h.angle) * dir) % Math.PI;
    if (left < 0) left += Math.PI;
    const soon = left < h.hz.speed * 0.7;
    if (soon && !rt.m06Warned) g.audio?.zap?.();
    rt.m06Warned = soon;
  },
  overlay(P) {
    // Ezra in 2049; in 2026 his echo at sixty-five (the sheet's rb_ezra/ezra65); in the 2196 ruin, nobody
    // (playtest v2.1 F02: behind his counter, facing the shop and the cellar steps, out of the arm's reach; the arm turns
    // between the counter and the stair up)
    person(P, { id: 'ezra_shop', crew: 'clockmaker', at: 'shopFloor', off: [0.2, 0, -1.4], when: '!t_m06_stair && @PRESENT', prompt: 'TALK TO EZRA MOLL' });
    person(P, { id: 'ezra_room', crew: 'clockmaker', at: 'clockRoom', off: [1.2, 0, -1.6], turn: Math.PI, when: 't_m06_stair && @PRESENT', prompt: 'TALK TO EZRA MOLL' });
    person(P, { id: 'ezra_shop26', crew: 'ezra26', first: 'Ezra Moll', seed: 601, ambient: true, hologram: true, at: 'shopFloor', off: [0.2, 0, -1.4], when: '!t_m06_stair && @PAST', scene: 'ezra_echo', prompt: 'LISTEN TO EZRA\'S ECHO' });
    person(P, { id: 'ezra_room26', crew: 'ezra26', first: 'Ezra Moll', seed: 601, ambient: true, hologram: true, at: 'clockRoom', off: [1.2, 0, -1.6], turn: Math.PI, when: 't_m06_stair && @PAST', scene: 'ezra_echo', prompt: 'LISTEN TO EZRA\'S ECHO' });
  },
  hook: { cue: 'cliff', minutes: 1, lines: [FX(L('WITNESS', 'When the child returns, do not let him see the ninth minute.'), 'recording'), K('What is the ninth minute?'),
    EZRA('He said you\'d ask. He said not to tell you. It\'s the minute before your sister—'), N('The arm completes its turn. The clockmaker straightens his apron.'), EZRA('Good evening. You\'re early.')] },
  done: 'recording_found',
};
M06.outro = M06.hook.lines;

// =============================================================================================================
// Mission 7: THE BROKEN OBSERVATORY
// =============================================================================================================
const M07_HINTS = {
  guide: ['Niko came up the ridge with me. He has been waiting to talk.', 'He is beside the place where I arrived.', 'Go back to where I arrived and talk to Niko.'],
  gnomon: ['The first instrument is the sun.', 'The gnomon, at the first sky.', 'Stand at the gnomon at the first sky.'],
  roofs: ['The instruments climb the hill.', 'Over the roofs and the turning platforms.', 'Cross the turntables to the stair.'],
  scav: ['Scavengers camp by the stair.', 'They only watch in front of them.', 'Cross their camp behind their backs.'],
  star: ['The second instrument is a star.', 'The tube, in 2049\'s blue hour.', 'Sight the tube in 2049.'],
  dates: ['The ring is cut with dates.', 'Read it, and at the first sky.', 'Read the dates ring at the first sky.'],
  ring: ['The outer ring has a walkway.', 'Up the stair to the great ring.', 'Walk the outer ring.'],
  newstar: ['The third instrument waits for a star.', 'The horizon ring, in 2196.', 'Sight the horizon ring in 2196.'],
  tape: ['Something is buried at the foot of the ring.', 'In 2049, by the outer ring.', 'Dig up the tin at the ring\'s foot.'],
  cache: ['The scavengers keep a cache.', 'East of their camp.', 'Look in the cache.'],
  extra: ['Niko has more to say about the star.', 'The river keepers taught him something.', 'Find Niko and talk to him about the star.'],
  astro: ['The astronomer is still turning the ring.', 'At the first sky, by the horizon ring.', 'Talk to the astronomer at the first sky.'],
};
const ASTRO = (t) => SAYS('THE ASTRONOMER', 'CROWD_OLD_M', t);
export const M07 = {
  key: 'm07', n: 7, chapter: 'act1', name: 'THE BROKEN OBSERVATORY', title: 'Bronze rings under an open sky', subtitle: 'An ancient observatory, tracking alignments that include your birth.',
  logline: 'Bronze rings on the Ridge, aligned to a birth.',
  place: 'observatory', sectors: 1, states: ['PAST', 'PRESENT', 'FUTURE'], drones: [0, 1, 2], unstable: true, ambience: 'wind', ambient: 'settlement',
  labels: { PAST: 'THE FIRST SKY' }, motto: 'THEY DID NOT KNOW WHEN. THEY KNEW WHO', gate: 'THE HORIZON RING', crew: C('niko'),
  minutes: { main: 32, optional: 6 }, autoExit: 1.2, gateAfter: true,
  fragSpots: [['lowerRing', 'astronomerRoofs'], ['cache'], ['summitStair']],
  fragments: [[
    'A rooftop with footprints that go up the wall.',
    'A lens, cracked, through which the city of 2196 shows on a clear night.',
    'A scavenger\'s badge: a closed circle. Not a broken one. Somebody thinks the circle should close.',
    'An inscription on the outer ring: KAI. Just that. Beside it, a circle with a broken halo.',
  ]],
  beats: [{ kind: 'custom', goal: 'Align the three instruments.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    // (on the summit drum, at the first sky: the astronomer and Niko, older, under the horizon ring)
    shots: [{ cam: [74, 29.4, -67.6], to: [74, 29.2, -69.4], look: [74, 29.2, -80.6], t: 8 }],
    year: 'PAST', cast: [{ crew: 'm7_oldniko', ambient: true, seed: 702, first: 'Niko', at: 'horizonRing', off: [-2.2, 0, 2], turn: Math.PI }],
    lines: [N('Three thousand years ago, an astronomer and an old man turn a bronze ring toward the Notch.'), L('NIKO', 'There. The star that isn\'t up yet.')],
  },
  processes: [
    // the scavengers' thrown stone: it lands, and is back in the hand a moment ago (enemy-side, never needed)
    { id: 'scavStone', kind: 'projectile', at: 'scavengerCamp', label: 'THE THROWN STONE', weight: 0.5, cycle: { period: 5, flight: 1.4 },
      parts: [{ shape: 'box', size: [0.22, 0.18, 0.2], mat: 'stone', at: [0, 1.7, 0], rest: { at: [0.6, 0.1, 9] } }],
      hints: ['They throw stones that come back.', 'It lands where it was a moment ago.', 'Let it fly. It cannot hurt what is not there yet.'] },
  ],
  quarters: [
    {
      name: 'THE LOWER RING',
      threads: [
        { id: 'guide', kind: 'talk', npc: 'niko', at: 'nikoGuide', goal: 'Niko came up the ridge with you.', because: 'He knows what the instruments watch for.', done: 'niko_guide', hints: M07_HINTS.guide, minutes: 2 },
        { id: 'gnomon', kind: 'scene', scene: 'gnomon', at: 'gnomon', after: ['guide'], spot: { prompt: 'THE GNOMON', offset: [0, 1.2, 1.4], r: 3, model: NO_MODEL },
          goal: 'Align the first instrument: the sun, at the first sky.', because: 'The gnomon\'s shadow points at the next ring.', done: 'align_sun', hints: M07_HINTS.gnomon, minutes: 5 },
        { id: 'roofs', kind: 'go', at: 'rotatingPlatforms', r: 5, after: ['gnomon'], when: 'align_sun', goal: 'Over the astronomers\' roofs to the turning platforms.', because: 'The shadow runs up the hill.', hints: M07_HINTS.roofs, minutes: 4 },
      ],
      sides: [
        { id: 'extra', name: 'WHAT THE RIVER TOLD NIKO', giver: 'niko', start: 'water_route', done: 'ev_star_early', minutes: 3,
          threads: [{ id: 'extra', kind: 'talk', npc: 'niko', when: 'water_route', goal: 'Niko has heard something from the river keepers.', because: 'Tala\'s channel runs because of me.', done: 'ev_star_early', hints: M07_HINTS.extra, minutes: 3 }] },
      ],
    },
    {
      name: 'THE INSTRUMENT STAIR',
      threads: [
        { id: 'star', kind: 'scene', scene: 'star', at: 'starTube', after: ['roofs'], spot: { prompt: 'SIGHT THE TUBE', offset: [0, 1.4, 1.6], r: 3, model: NO_MODEL },
          goal: 'Align the second instrument: a star, at 2049\'s blue hour.', because: 'The tube is cut for one bright star.', done: 'align_star', hints: M07_HINTS.star, minutes: 3 },
        { id: 'dates', kind: 'residue', at: 'datesRing', after: ['star'],
          record: { official: 'Cut into the ring: ALIGNMENTS. 1077 BC. 2026. 2049. 2196.', echo: 'At the first sky the ring said: KAI VAREN. BORN 2 MAY 2013. THE ONE WITH NO DUST.',
            hint: 'Four dates. The first sky will have cut something else.', after: [K('How could they know when I would be born?'), L('NIKO', 'They didn\'t know when. They knew who.')], prompt: 'READ THE DATES', offset: [0, 1.2, 1.2], model: 'none',
            log: 'The observatory\'s first dates ring names my birth. They didn\'t know when. They knew who.' },
          goal: 'Read the dates on the ring, and what it said at the first sky.', because: 'One of them is mine.', hints: M07_HINTS.dates, minutes: 3 },
        { id: 'scav', kind: 'stealth', at: 'scavengerCamp', r: 5, after: ['dates'], until: 't_m07_ring', when: 'align_sun', goal: 'Cross the scavengers\' camp unseen.', because: 'They wear a closed circle. They camp on the way to the summit stair.', hints: M07_HINTS.scav, minutes: 5 },
      ],
      sides: [
        { id: 'cache', name: 'THE SCAVENGERS\' CACHE', done: 'ev_cache', minutes: 3,
          threads: [{ id: 'cache', kind: 'scene', scene: 'cache', at: 'cache', spot: { prompt: 'THE CACHE', offset: [0, 1.2, 1.2], r: 2.8, kit: 'curioBox' },
            goal: 'The scavengers keep a cache east of their camp.', because: 'Things from this morning are in it.', done: 'ev_cache', hints: M07_HINTS.cache, minutes: 3 }] },
      ],
    },
    {
      name: 'THE OUTER RING',
      threads: [
        { id: 'ring', kind: 'go', at: 'outerRingWalk', r: 5, after: ['scav'], when: 'align_star', goal: 'Walk the great ring\'s outer walkway.', because: 'From up there the last instrument is in sight.', hints: M07_HINTS.ring, minutes: 3 },
        { id: 'tape', kind: 'scene', scene: 'tape', at: 'tinSpot', after: ['ring'], spot: { prompt: 'A TIN IN THE GROUND', offset: [0, 0.2, 0], r: 2.6, model: tin, when: '@PRESENT && !mira_tape' },
          goal: 'Something is buried at the foot of the great ring.', because: 'The bronze says a child stood here.', done: 'mira_tape', hints: M07_HINTS.tape, minutes: 2 },
        // (the closing pass: the astronomer who cut the name, and who asked him to; adult Mira, before Kai, with no shadow)
        { id: 'astro', kind: 'scene', scene: 'astro', at: 'horizonRing', after: ['tape'], spot: { prompt: 'THE ASTRONOMER', offset: [2.2, 1.2, 0.6], r: 2.8, model: NO_MODEL },
          goal: 'At the first sky, the astronomer is still turning the great ring.', because: 'He cut my name into it. Somebody told him to.', done: 'ev_astro', hints: M07_HINTS.astro },
        { id: 'newstar', kind: 'scene', scene: 'newstar', at: 'horizonRing', after: ['astro'], spot: { prompt: 'SIGHT THE HORIZON RING', offset: [0, 1.2, -2], r: 3.4, model: NO_MODEL },
          goal: 'Align the third instrument: the new star of 2196.', because: 'The horizon ring was cut for a star that wasn\'t up yet.', done: 'align_new', hints: M07_HINTS.newstar, minutes: 2 },
      ],
    },
  ],
  talks: {
    niko: [
      { when: '!niko_guide', lines: [L('NIKO', 'The keepers built this to watch the sky. My grandfather said they were watching for you.'), K('For me.'), L('NIKO', 'For a man with no dust. You are the only one I know.')], set: { niko_guide: true } },
      { when: 'water_route && !ev_star_early', lines: [L('NIKO', 'Tala sent word up the channel. The keepers say the star rises when he stops being early.')], set: { ev_star_early: true } },
      { when: 'true', lines: [L('NIKO', 'Three instruments. The sun, a star, and one that is not up yet.')] },
    ],
  },
  scenes: {
    gnomon: { when: '@PAST', lines: [N('The sun clears the Notch. The gnomon\'s shadow runs across the lower ring and stops in a notch cut for it.')], set: { align_sun: true }, then: 'bell1' },
    gnomon_no: { lines: [K('The shadow means nothing now. At the first sky, the sun rises in the Notch.')] },
    star: { when: '@PRESENT', lines: [N('Through the tube, in the blue hour, one bright star, exactly where the bronze says.')], set: { align_star: true }, then: 'bell2' },
    star_no: { lines: [K('Too bright. Or too early. The blue hour of 2049.')] },
    newstar: { when: '@FUTURE', lines: [N('In 2196 a new star stands over the Notch: the light of the Fracture. The horizon ring was cut for it.'), K('Three instruments. Three years. One line through all of them.')], set: { align_new: true }, then: 'bell3' },
    newstar_no: { lines: [K('Nothing there yet. The star this ring waits for comes later.')] },
    astro: {
      when: '@PAST',
      lines: [N('The astronomer does not stop turning the ring. He speaks over his shoulder, as if you were here yesterday.'),
        ASTRO('You came back with no dust on you. The woman said you would.'), K('What woman?'),
        ASTRO('She came up the hill in the rain season, in a coat the colour of the river. At noon she had no shadow. We thought she was a spirit, and fed her anyway.'),
        ASTRO('She would not give us her name. She gave us yours. Cut it where he will stand, she said, so he knows somebody waited.'),
        K('What did she look like?'),
        ASTRO('Like you, if you had slept. She laughed at the star tube. She said her brother would look through it the wrong way round.'),
        N('Beside your name on the outer ring there is a second mark, smaller, cut by another hand: a circle, and inside it the letter M.')],
      set: { ev_astro: true }, log: 'At the first sky a woman with no shadow asked them to cut my name. Beside it, an M.',
    },
    astro_no: { lines: [K('The ring is still. At the first sky an old man stood here turning it, and he was talking to somebody.')] },
    cache: { lines: [N('Your keys. The florist\'s receipt for 08:04. A yellow button from a raincoat.'), N('A trade tag: FROM A MAN WHO LOOKED LIKE YOU, BUT TIRED.')], set: { ev_cache: true } },
    tape: {
      lines: [N('A biscuit tin, rusted shut, buried at the ring\'s foot. Inside: a cassette, and a label in crayon. FOR KAI.')],
      choices: [
        intent('investigate', 'Keep it.', { say: 'I\'m keeping it.', consequence: true, lines: [N('You put the tin in your coat. It is heavier than a tin should be.')], set: { mira_tape: 'kept' }, log: 'I kept Mira\'s tape.' }),
        intent('withdraw', 'Play it, then bury it again.', { say: 'I\'ll leave it where she put it.', consequence: true, lines: [N('You play it once, and put it back where a nine-year-old put it.')], set: { mira_tape: 'left' }, log: 'I left Mira\'s tape where she buried it.' }),
      ],
    },
  },
  fx: {
    bell1: (rt) => rt.g.audio.bell?.(392, rt.g.audio.ctx?.currentTime || 0, 0.06, rt.g.audio.sfx),
    bell2: (rt) => rt.g.audio.bell?.(523.25, rt.g.audio.ctx?.currentTime || 0, 0.06, rt.g.audio.sfx),
    bell3: (rt) => rt.g.audio.bell?.(698.46, rt.g.audio.ctx?.currentTime || 0, 0.06, rt.g.audio.sfx),
  },
  overlay(P) {
    person(P, { id: 'niko', crew: 'niko', at: 'nikoGuide', turn: 0, prompt: 'TALK TO NIKO', inPerson: true });
    person(P, { id: 'm7_astro', crew: 'm7_astro', first: 'Astronomer', seed: 701, ambient: true, at: 'horizonRing', off: [2.4, 0, 2], turn: Math.PI, when: '@PAST', silent: true });
  },
  // the hook: Mira's tape (§5 M7), a nine-year-old's voice through the recording chain
  hook: { cue: 'cliff', minutes: 2, lines: [
    FX(L('MIRA9', 'Kai, it\'s me. It\'s Friday. We\'re at the dig on the hill. The rings have numbers on them and one of them is your birthday.'), 'recording'),
    FX(L('MIRA9', 'I asked Dr. Rook and he went white. Like milk.'), 'recording'),
    FX(L('MIRA9', 'I think the rings know you. Not that you came. That you\'d come back.'), 'recording'),
    FX(L('MIRA9', 'Tomorrow I\'m going to see the big ring turn. Don\'t tell Mum.'), 'recording'), N('Click.')] },
  done: 'align_new',
};
M07.outro = M07.hook.lines;

// =============================================================================================================
// Mission 8: THE FIRST DEATH
// =============================================================================================================
const M08_HINTS = {
  changed: ['I know this building, and it has changed. Find three things that are different.', 'The river court, the boot print\'s glass case and the staff photo wall.', 'Look at the river court, the print case and the photo wall.'],
  records: ['Reception says there is no Kai Varen. The staff records will say who there is.', 'The records terminal is by reception, in the lobby.', 'Use the staff records terminal by reception.'],
  linDesk: ['Dr. Lin has not come in since the Zero Second. Her desk is still here.', 'Her desk is in the north loggia, along the court.', 'Walk to the north loggia and look at Lin\'s desk.'],
  drive: ['The security log was never wiped in 2026. The old server still has it.', 'The server room is in the east wing, and it only stands in 2026.', 'Switch to 2026, go into the east wing\'s server room and take the drive.'],
  readLog: ['The drive needs a reader. There is one in the security office.', 'The office is up on the balcony: the staff stair, or over the old river wall.', 'Climb to the security office on the balcony and read the drive there.'],
  rook: ['His order is in the log. Rook has to answer for it.', 'His office is upstairs, at the top of the outside stair.', 'Climb the outside stair to Rook\'s office and talk to him.'],
  boot: ['Rook said the boot prints are in the clay. The print case.', 'The famous boot print, in its glass case.', 'Stand beside the boot print\'s case and look.'],
  reconstruct: ['Four entries from that morning, out of order.', 'The echoes walk them once they are in order. The table is on the island.', 'At the island, put the four entries in the order they happened.'],
  containment: ['Lin is inside the containment cube.', 'Its door is open now.', 'Walk in through the cube\'s open door, to Lin.'],
  escape: ['The cube has sealed me in.', 'In 2026 there was no cube here, only the floor.', 'Switch to 2026 to step out, then come back to 2049 and reach the terminal before the drone sees me.'],
  version: ['The terminal on the island names this world.', 'It is on the island, where the morning was rebuilt.', 'Read the terminal on the island.'],
  iven: ['Iven Marr was there in 2026. His statement is recorded.', 'His recorder is in the east arcade.', 'Talk to Iven in the east arcade, or play his recorded statement.'],
  door: ['The staff door is locked.', 'The officer on it might open it for someone they trust.', 'Talk to the officer at the staff door.'],
  photo: ['A 2026 photo of the junior programme hangs here.', 'It is on the staff photo wall.', 'Look at the 2026 group photo on the wall.'],
};
const RECEPTION = (t) => SAYS('RECEPTION', 'RECEPTIONIST', t);
// the drones of the court's last quarter (the island and its south bank) and the lockdown that sets them hunting
const ISLAND = /_q2s\d+$/;
const ESCAPE_BACK = 2; // (seconds back in 2049 before the terminal counts as reached: the island's drone's moment)
function lockdown(defs) {
  for (const d of defs) if (ISLAND.test(d.id) && !d.locked) Object.assign(d, { locked: true, range: d.range + 4, speed: d.speed + 0.6 });
}
export const M08 = {
  key: 'm08', n: 8, chapter: 'act1', name: 'THE FIRST DEATH', title: 'Helix, altered', subtitle: 'The facility you return to is not the one you left.',
  logline: 'Helix, rebuilt round a river. Version seventeen.',
  place: 'helix_v17', sectors: 1, states: ['PRESENT', 'PAST'], drones: [0, 1, 2], unstable: true, motto: 'VERSION 17',
  ambience: 'hum', ambient: 'helix', crew: C('rook'),
  labels: { PRESENT: '2049 · V17' },
  named: ['receptionist', 'rook', 'guard', 'dale', 'researcher', 'iven'], // (the altered staff never wear their faces)
  minutes: { main: 34, optional: 8 }, autoExit: 1.2, gateAfter: true,
  fragSpots: [['southBridge'], ['serverWindow']],
  fragments: [[
    'A visitor badge printed for VAREN, M., age 9, dated today. Nobody has signed it out.',
    'A 2026 server rack, one second behind every other clock.',
  ]],
  beats: [{ kind: 'custom', goal: 'Find out what changed.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    // (her call from the visitors' side of the desk, between the canopy's posts; then from the atrium, the doors and Kai in
    // them. The one shot stood its camera on the doors where Kai spawns, inside his head)
    shots: [{ cam: [-56.2, 1.72, -22.4], to: [-55.2, 1.68, -22.3], look: [-50.8, 1.5, -22], t: 8 }, { cam: [-54.6, 1.95, -18.2], to: [-55.4, 1.9, -18], look: [-64, 1.3, -16], t: 6 }],
    lines: [RECEPTION('Helix Temporal, good afternoon. No, we have no Kai Varen. There was a Varen in the junior programme. Mira. She died in 2026.'),
      N('The doors open. Kai Varen walks in. Outside, nothing moves. Not even the flags.')],
  },
  quarters: [
    {
      name: 'STAFF RECORDS',
      threads: [
        { id: 'changed', kind: 'clue', need: 3, of: ['ev_river_court', 'ev_print_moved', 'ev_photo_wall'],
          spots: [
            { id: 'river_court', scene: 'river_court', at: 'riverCourt', prompt: 'THE RIVER COURT', offset: [0, 1.2, -1], r: 3.4, model: NO_MODEL },
            { id: 'print_moved', scene: 'print_moved', at: 'printCase', prompt: 'THE PRINT CASE', offset: [0, 1.2, 1.2], r: 2.8, model: NO_MODEL },
            { id: 'photo_wall', scene: 'photo_wall', at: 'photoWall', prompt: 'THE STAFF PHOTO WALL', offset: [0, -0.4, 1.2], r: 2.8, model: NO_MODEL },
          ],
          goal: 'The building is wrong. Find three things that changed.', because: 'I know this place. It doesn\'t know me.', hints: M08_HINTS.changed, minutes: 3 },
        { id: 'records', kind: 'scene', scene: 'records', at: 'recordsTerminal', after: ['changed'], spot: { prompt: 'STAFF RECORDS', offset: [0, 1.2, 1.2], r: 2.8, kit: 'lectern' },
          goal: 'Read the staff records.', because: 'Reception says there is no Kai Varen.', done: 'ev_v17_records', hints: M08_HINTS.records, minutes: 3 },
        { id: 'linDesk', kind: 'scene', scene: 'lin_desk', at: 'linDesk', after: ['records'], spot: { prompt: 'DR. LIN\'S DESK', offset: [0, 0.9, -1.2], r: 2.8, model: makeNotebook },
          goal: 'Lin has not come in since the Zero Second. Look at her desk.', because: 'Her previous employer was the junior programme, in 2026.', done: 'ev_lin_desk17', hints: M08_HINTS.linDesk, minutes: 3 },
      ],
      sides: [
        { id: 'photo', name: 'THE 2026 GROUP PHOTO', done: 'ev_group_photo', minutes: 3,
          threads: [{ id: 'photo', kind: 'scene', scene: 'group_photo', at: 'groupPhoto', spot: { prompt: 'THE GROUP PHOTO', offset: [0, -0.4, 1.2], r: 2.6, model: makePhoto },
            goal: 'A 2026 photo of the junior programme.', because: 'Six children and a marquee.', done: 'ev_group_photo', hints: M08_HINTS.photo, minutes: 3 }] },
      ],
    },
    {
      name: 'THE CORRUPTED LOG',
      threads: [
        { id: 'drive', kind: 'scene', scene: 'drive', at: 'serverRoom2026', after: ['linDesk'], spot: { prompt: 'THE 2026 SERVER', offset: [-1.4, 1.2, 0], r: 2.8, model: NO_MODEL },
          goal: 'Take the security log off the 2026 server.', because: 'In this version the log was never wiped. In 2026 it was never written over.', done: 'has_drive', hints: M08_HINTS.drive, minutes: 2 },
        { id: 'readLog', kind: 'scene', scene: 'read_log', at: 'securityOffice', after: ['drive'], spot: { prompt: 'THE LOG READER', offset: [2.4, 1.2, 0], r: 2.8, model: () => makeScreen(0x9fd8ff) },
          goal: 'Read the drive in the security office.', because: 'The reader is on the balcony. The staff door, or the old river wall.', done: 'ev_log_entries', hints: M08_HINTS.readLog, minutes: 2 },
        { id: 'rook', kind: 'talk', npc: 'rook', at: 'rookOffice', after: ['readLog'], goal: 'Confront Rook in his office.', because: 'His order is in the log. His name is on the test.', done: 'rook_fate', hints: M08_HINTS.rook, minutes: 5 },
        { id: 'boot', kind: 'scene', scene: 'boot', at: 'printCase', after: ['rook'], spot: { prompt: 'STAND BESIDE THE PRINT', offset: [-1.2, 1.2, 1.2], r: 2.6, model: NO_MODEL },
          goal: 'Rook said boot prints in the clay. Go and look.', because: 'Every intern gets a mug.', done: 'ev_boot_mine', hints: M08_HINTS.boot, minutes: 1 },
      ],
      sides: [
        { id: 'door', name: 'THE STAFF DOOR', done: 'staff_door_open', minutes: 2,
          threads: [{ id: 'door', kind: 'talk', npc: 'guard', at: 'staffDoor', when: 'trust_guard >= 1 || officer_trusted', goal: 'An officer is on the staff door.', because: 'Someone in this version still trusts me.', done: 'staff_door_open', hints: M08_HINTS.door, minutes: 2 }] },
        { id: 'iven', name: 'IVEN\'S TESTIMONY', giver: 'iven', done: 'ev_second_late', minutes: 3,
          threads: [{ id: 'ivenTestimony', kind: 'scene', scene: 'iven_record', at: 'eastArcade', spot: { prompt: 'IVEN MARR\'S STATEMENT', offset: [1.6, 1.2, 1.2], r: 2.6, model: kit('recorder'), when: 'ev_raw_log && !iven_team_saved' }, goal: 'Iven Marr was there in 2026.', because: 'He refused to sign once. He might talk now.', done: 'ev_second_late', hints: M08_HINTS.iven, minutes: 3 }] },
      ],
    },
    {
      name: 'THE LAST TEN MINUTES',
      threads: [
        // (the Prologue's morning, in order: the test moved, the card at 05:40 on an empty corridor, then 08:12-08:14,
        // the ninth minute of Mission 9's loop, when the ring turns and the Zero Second is missing)
        { id: 'reconstruct', kind: 'playback', at: 'reconstruction', after: ['boot'], prompt: 'RECONSTRUCT THE MORNING', offset: [0, 1.2, 0.6], r: 3, model: NO_MODEL,
          question: [K('Four entries. Put them in order and the echoes walk them.')],
          wrong: [K('Not yet. That one happened later.')],
          entries: [
            { label: '05:33. Test moved to 05:40. Director\'s office.', lines: [N('05:33. Rook\'s office moves the test to 05:40.')] },
            { label: '05:40. Chamber One opens on Varen\'s card.', lines: [N('05:40. The door opens on my card. Nobody walks through it.')] },
            { label: '08:12. A man at the console. Dr. Lin beside him.', lines: [N('08:12. A man at the console. Lin beside him.')] },
            { label: '08:13. The ring turns. At 08:14, one second missing.', lines: [N('08:13. The ring turns. At 08:14, a second that isn\'t there.')] },
          ],
          echoes: [
            // (the man at the console, hooded: his face never comes into the light; Mission 12 is where it is seen)
            { crew: 'witness', variant: 'hooded', offset: [-1.4, 0, 2.6], turn: Math.PI, path: [[-12, 0.4, 4], [-6, 0.4, 9], [-2, 0.4, 9.4]] },
            { crew: 'researcher', offset: [0.4, 0, 2.6], path: [[-11, 0.4, 3], [-5, 0.4, 8], [-1, 0.4, 8.6]] },
          ],
          lines: [N('The echoes walk it again: the door, the corridor, the console.'), REV(N('At the ninth minute a man turns the ring. His face never comes into the light. Lin stands beside him.')),
            K('She was there. She was there, and she let him.')],
          goal: 'Reconstruct the morning, up to the Zero Second.', because: 'The cube kept it backwards. The log has it forwards.', set: { ev_ninth_minute: true }, log: 'At the ninth minute a man turned the ring. Lin stood beside him.', hints: M08_HINTS.reconstruct, minutes: 6 },
        { id: 'containment', kind: 'talk', npc: 'researcher', at: 'containmentCube', after: ['reconstruct'], goal: 'Lin is inside the containment cube.', because: 'She was in the reconstruction. She is in there now.', done: 'lin_gone', hints: M08_HINTS.containment, minutes: 3 },
        // (the breach seals the cube with Kai inside it: in 2049 the glass holds; 2026 has no cube, so he walks out
        // through that year and comes back to 2049 at the terminal, past the island's drone; U7 review)
        // (playtest v2.1.1 L34: it counted in any year, so the whole escape was walked in 2026, where there is no drone.
        // It counts in 2049 only, once Kai has been back in 2049 for a moment (m08_back49, step): switching back at the
        // terminal itself is not a way past the drone)
        { id: 'escape', kind: 'stealth', at: 'versionTerminal', r: 3, after: ['containment'], when: 'lin_gone', trigWhen: '@PRESENT && m08_back49', goal: 'The cube seals. Get out, and reach the version terminal unseen.', because: 'In 2049 the glass holds. In 2026 there was no glass.', hints: M08_HINTS.escape, minutes: 3 },
        // (playtest v2.1.1 L20: the terminal is not built in 2026, so it is offered in 2049 only)
        { id: 'version', kind: 'scene', scene: 'version', at: 'versionTerminal', after: ['escape'], spot: { prompt: 'THE VERSION TERMINAL', offset: [0, 1.2, -1], r: 2.8, model: () => makeScreen(0xd8d4ff), when: '@PRESENT' },
          goal: 'Read the version terminal.', because: 'Containment, version control. Version of what?', done: 'version_17', hints: M08_HINTS.version, minutes: 1 },
      ],
    },
  ],
  talks: {
    receptionist: [{ when: 'true', lines: [CREW('Visitors sign in. Staff swipe. You are neither, sir.')] }],
    rook: [
      {
        when: '!rook_fate',
        lines: [L('ROOK', 'You came back different. The building came back different. I assumed it was the building.', '!trust_rook'),
          L('ROOK', 'At the chamber door I said I didn\'t know. That was nearly true.', 'trust_rook == 1'),
          L('ROOK', 'You put my own order to me. You were right. Sit down.', 'trust_rook == -1'),
          K('The test was moved to 05:40.'), L('ROOK', 'By me. Write it down. I have waited twenty-three years for somebody to make me say it.'),
          L('ROOK', 'We did not build it. We dug it out from under a cairn, in a riverbed drained three thousand years ago. There were boot prints in the clay.', 'machine_buried == "cairn"'),
          L('ROOK', 'We did not build it. We dug it out of a riverbed somebody drained three thousand years ago. There were boot prints in the clay.', 'machine_buried != "cairn"'),
          L('ROOK', 'Your sister was in the programme. She wanted to see it turn. She was nine.'), K('She died of a fever.'), L('ROOK', 'That is what I signed.'),
          L('ROOK', 'I kept her drawing. I could not throw it away and I could not look at it. So I pinned it where nobody goes.')],
        choices: [
          intent('challenge', 'Expose him.', { say: 'Then I\'ll tell everyone what you signed.', consequence: true, lines: [L('ROOK', 'Good. Somebody should.')], set: { rook_fate: 'expose' }, ev: 'rook_confession', log: 'Rook signed "fever". I will tell everyone.' }),
          intent('comfort', 'Ask for his help.', { say: 'Help me stop it happening again.', consequence: true, lines: [L('ROOK', 'Again. Yes. I have always known it was again.')], set: { rook_fate: 'persuade' }, ev: 'rook_confession', log: 'Rook will help me stop it.' }),
          intent('investigate', 'Put it on the record.', { say: 'Say it to the camera.', consequence: true, lines: [L('ROOK', 'For the record. My name is Elias Rook.')], set: { rook_fate: 'record' }, ev: 'rook_confession', log: 'Rook said it to the camera.' }),
        ],
      },
      { when: 'rook_fate', lines: [L('ROOK', 'Go and look at the print case, Kai.')] },
    ],
    guard: [
      { when: '!staff_door_open', lines: [CREW('Varen. You look like somebody I let through once. Go on up.')], set: { staff_door_open: true } },
      { when: 'true', lines: [CREW('Stairs on your left. Don\'t touch the balcony glass.')] },
    ],
    dale: [
      { when: '!staff_door_open', lines: [CREW('Varen. They kept my recording, in this version. Go on up.')], set: { staff_door_open: true } },
      { when: 'true', lines: [CREW('Balcony\'s through there. I\'m not here.')] },
    ],
    researcher: [
      { when: '!lin_gone', lines: [K('Lin. Come out of there.'), CREW('Don\'t save me.'), K('Why?'), CREW('Because I am not the one who died.'),
        REV(N('A hand with a ring-shaped scar rests on her shoulder, and she is gone.'))], set: { lin_gone: true }, log: 'Lin: "I am not the one who died." Then she was gone.' },
    ],
  },
  scenes: {
    river_court: { lines: [N('The river runs through the court now, over stepping stones. The old west wing is gone.'), K('I moved that river. Three thousand years ago. Helix moved round it.')], set: { ev_river_court: true } },
    print_moved: { lines: [N('The Site Zero print, moved to the atrium. Its tread has never been explained.')], set: { ev_print_moved: true } },
    photo_wall: { lines: [N('The staff photo wall. Rook in the middle. No Kai Varen. Lin\'s frame is empty.')], set: { ev_photo_wall: true } },
    records: {
      lines: [N('STAFF RECORDS, REVISED. VAREN, M. Junior programme. Deceased 2026.'), N('LIN, DR. Start date: none. Previous employer: HELIX JUNIOR PROGRAMME 2026.'),
        N('MARR, I. Maintenance. On shift.', 'iven_team_saved || !ev_raw_log'), N('MARR, I. Suspended pending inquiry.', 'ev_raw_log && !iven_team_saved'),
        K('No Kai Varen. In this version I was never here.')],
      set: { ev_v17_records: true }, log: 'In VERSION 17 Mira died in 2026.',
    },
    lin_desk: { lines: [N('On Lin\'s blotter: three arrows, up, up, down. A badge: PHOTO PENDING. A yellow raincoat on a peg.'),
      K('She had no shadow. In the security room. I saw it and I didn\'t see it.')], set: { ev_lin_desk17: true } },
    drive: { when: '@PAST', lines: [N('A 2026 drive, labelled SECURITY. Nothing here ever overwrote it.')], set: { has_drive: true } },
    drive_no: { lines: [K('In 2049 this rack is empty. In 2026 it wasn\'t.')] },
    read_log: { when: 'has_drive && @PRESENT', lines: [N('Four entries readable, from 05:33 to 08:14. Rook\'s office is in one.')], set: { ev_log_entries: true } },
    read_log_no: { lines: [K('The drive first. Then read it here, in 2049.')] },
    boot: { lines: [N('Kai sets his boot beside the glass. The same tread. The same worn heel.'), REV(K('Three thousand years. It\'s mine.'))], set: { ev_boot_mine: true }, log: 'The Site Zero print is my boot.' },
    version: { when: '@PRESENT', lines: [REV(N('TIMELINE: VERSION 17. PRIOR VERSIONS: NO SURVIVING RECORD.'))], set: { version_17: true, ev_version17: true }, log: 'This is VERSION 17.' },
    version_no: { lines: [K('Not built yet, in 2026.')] },
    group_photo: { lines: [N('The 2026 junior programme: Mira in yellow boots, a scowling boy of twelve, and a young Elias Rook.'),
      K('I hated that day. I don\'t remember why.')], set: { ev_group_photo: true } },
    iven_record: {
      lines: [L('IVEN', 'The ring turned by itself. Then the boy hit the button. A second late.', 'iven_team_saved || !ev_raw_log'),
        FX(L('IVEN', 'The ring turned by itself. Then the boy hit the button. A second late.', 'ev_raw_log && !iven_team_saved'), 'recording'),
        K('A second late. I was twelve.')],
      set: { ev_second_late: true }, log: 'Iven: the ring turned a second before the boy\'s hand.',
    },
  },
  rules: [
    // Lin is gone: the containment alarm, and the drones on the island start looking
    { id: 'lockdown', when: 'lin_gone', say: [N('CONTAINMENT BREACH. The cube seals. Every drone on the island turns.')], then: 'lockdown' },
  ],
  fx: {
    // the lockdown: every drone of the court's last quarter turns and rushes to the cube's sealed door, then hunts the
    // island further and faster than before; the version terminal is past them (U7 review: the escape is a stealth beat)
    lockdown(rt) {
      const g = rt.g;
      g.audio.alert?.();
      if (!g.settings?.comfort) g.hud.flash('rgba(200,190,255,0.45)');
      for (const s of g.deckWorld?.sentinels || []) if (ISLAND.test(s.def.id)) { s.lure = { x: 0, z: 10, t: 4 }; s.suspicion = 0; s.mode = 'patrol'; }
      lockdown(g.deckWorld?.sentinels?.map((s) => s.def) || []);
    },
  },
  // (a load during the lockdown keeps the drones hunting)
  adjust(level, rt) {
    if (rt?.g?.facts?.get('lin_gone') && !rt.g.facts.get('t_m08_escape')) lockdown(level.sentinels);
  },
  // (playtest v2.1 F16: Lin in the cube, the morning's two echoes and Rook's 2026 echo wear their own faces and clothes,
  // faint, not one white glow: echoes.js)
  step(rt, dt = 0) {
    lendLooks(rt.g);
    // the escape (playtest v2.1.1 L34): back in 2049 for ESCAPE_BACK seconds, unseen, before the terminal counts; in 2026
    // at the terminal's spot Kai says it is not built yet (once a visit)
    const g = rt.g, f = g.facts;
    if (!f?.get('lin_gone') || f.get('t_m08_escape')) return;
    const year = g.engine.state(g.room);
    rt.m08Back = year === 'PRESENT' && !g.catching ? (rt.m08Back || 0) + dt : 0;
    const back = rt.m08Back >= ESCAPE_BACK;
    if (!!f.get('m08_back49') !== back) f.set('m08_back49', back);
    const t = rt.level?.landmarks?.versionTerminal, p = g.player?.pos;
    const at = !!t && !!p && Math.hypot(p.x - t[0], p.z - t[2]) < 3;
    if (at && year === 'PAST' && !rt.m08Told) g.hud.say(M08.scenes.version_no.lines, f);
    rt.m08Told = at && year === 'PAST' ? true : at ? rt.m08Told : false;
  },
  overlay(P) {
    // (behind her desk, facing the doors: she stood on the visitors' side with her back to them)
    person(P, { id: 'receptionist', crew: 'receptionist', at: 'receptionDesk', off: [0, 0, 1.2], turn: Math.PI, prompt: 'TALK TO RECEPTION' });
    // (Rook in 2049; in 2026 his echo practises a statement at the window: the confrontation is in his own year)
    person(P, { id: 'rook', crew: 'rook', at: 'rookOffice', off: [1.6, 0, 0.4], turn: Math.PI, prompt: 'TALK TO ROOK', temporal: ['PRESENT'] });
    // the staff door: shut, unless an officer who trusts Kai opens it (else the old river wall is the climb)
    P.cols.push({ box: [28.4, 0, -21.7, 31.6, 3.4, -21.1], mat: 'door', solid: true, when: '!staff_door_open', id: 'door_m08staff', room: P.rid, lvMat: 'gateSteel' });
    person(P, { id: 'door_pryce', crew: 'guard', at: 'staffDoor', off: [2.4, 0, 1.6], turn: Math.PI, when: 'trust_guard >= 1', prompt: 'TALK TO THE OFFICER' });
    person(P, { id: 'door_dale', crew: 'dale', at: 'staffDoor', off: [-2.4, 0, 1.6], turn: Math.PI, when: '!(trust_guard >= 1) && officer_trusted', prompt: 'TALK TO THE OFFICER' });
    // Iven, in person (his team got out) or as a record (he was suspended over the raw log)
    person(P, { id: 'iven', crew: 'iven', at: 'eastArcade', off: [0, 0, 1.6], turn: Math.PI, when: 'iven_team_saved || !ev_raw_log', scene: 'iven_record', prompt: 'TALK TO IVEN' });
    // Lin in the cube, after the reconstruction: in its middle, in 2049, spoken to from inside (its door stands open)
    person(P, { id: 'lin_cube', crew: 'researcher', at: 'containmentCube', off: [0, 0, -7.4], turn: Math.PI, hologram: true, when: '@PRESENT && t_m08_reconstruct && !lin_gone', prompt: 'TALK TO LIN' });
    // the altered staff (researchers with their stethoscopes hidden, technicians) walk the court
    person(P, { id: 'm8_tech', crew: 'm8_tech', first: 'Technician', seed: 801, ambient: true, at: 'eastArcade', off: [-3, 0, 6], silent: true, path: [[34, -30], [34, -12]], speed: 0.9 });
  },
  hook: { cue: 'cliff', minutes: 1, lines: [K('Seventeen. Then where are the other sixteen?'), N('Outside, Rain City\'s lights go out block by block, and come back in a different order.')] },
  done: 'version_17',
};
M08.outro = M08.hook.lines;

export const ACT1 = [M04, M05, M06, M07, M08];
