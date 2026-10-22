// THE LAST VERSION OF EARTH: Act IV, THE UNWRITTEN SECOND (OVERHAUL.md §5 M19-M22; about 156 minutes).
//
//   Mission 19  THE PLACE OUTSIDE TIME         the salt mirror; the marks, the bridge in the reflection, five doors
//   Mission 20  MIRA'S MEMORY                  one plot remembered three ways; nothing here can be reversed
//   Mission 21  THE LAST BATTLE OF THE CONTINUUM  the Spire above the clouds; elites who rewind, the arena, an ally
//   Mission 22  THE FIRST SECOND               five wedges round the twin chamber; the chain, the arm, the seals, the logs
//
// Each mission is one map with soft quarters, threads and side stories (Threads.js), a cold open and a hook, as in
// act1.js to act3.js (whose helpers these are). Lines quoted from the bible are verbatim, with the bible's speakers
// (D16); in Mission 22 the speakers of the Prologue's warnings are fixed: it was always the Witness.
import { intent } from './npcs.js';
import { NO_MODEL } from './processes.js';
import { L, N, K, CREW, REV, FX, C, SAYS, person, song } from './act3.js';

// =============================================================================================================
// Mission 19: THE PLACE OUTSIDE TIME
// =============================================================================================================
const M19_HINTS = {
  marks: ['The clockmaker\'s mark.', 'Chalked where the road is real.', 'On the road, on the gallery in 2026, and where the road ends.'],
  pattern: ['Stones in a ring, west.', 'The observatory\'s pattern.', 'Look at it.'],
  badge: ['A badge set in the glass, east.', 'Mine, before the scar.', 'Look at it.'],
  bridge: ['The water shows a bridge. The air does not.', 'When was it there? Or bring the reflection back in step.', 'Cross in 2026, or REVERSE the lag.'],
  doors: ['The same blue door, five times.', 'Look at what the light does at each.', 'Look at two of them.'],
  door: ['Which door is real?', 'The Child had no shadow. Lin had none.', 'The one with no shadow.'],
  mira: ['Mira.', 'By the real door.', 'Talk to her.'],
  orren: ['Orren.', 'He keeps sweeping.', 'Ask him.'],
  gallery: ['The clockmaker\'s gallery.', 'It stands in 2026 and in 2196.', 'Climb to it.'],
  arm: ['The brass arm.', 'In the gallery.', 'Read what is cut under the mark.'],
};

const M19_PROCESSES = [
  // the reflection runs a little behind the world: held, it runs forwards into step, and the bridge holds in this year too
  {
    id: 'reflectionLag', kind: 'mechanism', at: 'lagSite', label: 'THE REFLECTION\'S LAG', weight: 1, settle: 'settled', grain: 'water', spin: [0, 1, 0, 1.2],
    parts: [{ shape: 'box', size: [1.1, 1.0, 0.06], mat: 'glass', at: [0, 1.6, 0] }], aim: [0, 1.6, 0],
    hints: ['The reflection lags the world.', 'Run it forwards, into step.', 'REVERSE the lag. Then the bridge holds in this year too.'],
  },
];

export const M19 = {
  key: 'm19', n: 19, chapter: 'act4', name: 'THE PLACE OUTSIDE TIME', title: 'Beyond the Chronolith\'s states', subtitle: 'Roads loop. Rooms connect impossibly. The sky shows an unbuilt city.',
  logline: 'A white salt mirror under a sky with no sun.',
  place: 'unwritten', sectors: 1, states: ['PRESENT', 'PAST', 'FUTURE'], drones: [0, 0, 0], ambience: null, ambient: 'liminal',
  motto: 'FOLLOW WHAT THEY REFUSE TO STEP ON', gate: 'THE DOOR', crew: C('orren'),
  named: ['orren', 'mira'],
  minutes: { main: 30, optional: 8 }, autoExit: 1.2, gateAfter: true,
  processes: M19_PROCESSES,
  fragSpots: [['canopy41'], ['stonePattern'], ['door2']],
  fragments: [[
    'A piece of the 41\'s canopy, dry, at eight fourteen.',
    'A road that returns to itself. Your footprints are already on it, going the other way.',
    'Mira\'s handwriting on the sky: YOU KEEP SOLVING THE WRONG PUZZLE.',
  ]],
  beats: [{ kind: 'custom', goal: 'Find the real door.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    shots: [{ cam: 'roadEnd', look: 'orrenRoad', t: 9 }],
    lines: [N('A white plain under a sky with no sun. A man of violet light sweeps a road that ends in the air.'), L('ORREN', 'Don\'t follow the footsteps. Follow what they refuse to step on.')],
  },
  quarters: [
    {
      name: 'THE LOOPING ROAD',
      threads: [
        { id: 'marks', kind: 'clue', need: 3, of: ['ev_mark_road', 'ev_mark_gallery', 'ev_mark_end'],
          spots: [
            { id: 'markRoad', scene: 'markRoad', at: 'clockMarks', prompt: 'A CHALK MARK', offset: [0, 0.6, 0], r: 2.4, kit: 'chalkMark' },
            { id: 'markGallery', scene: 'markGallery', at: 'clockGallery', prompt: 'THE MARK ON THE RAIL', offset: [0, 1.0, 6.4], r: 2.4, model: NO_MODEL, when: '@PAST || @FUTURE' },
            { id: 'markEnd', scene: 'markEnd', at: 'roadEnd', prompt: 'WHERE THE ROAD ENDS', offset: [0, 1.0, 1.6], r: 2.6, model: NO_MODEL },
          ],
          say: [K('Where somebody marked it, the road is real. Where nobody did, it goes round.')],
          goal: 'Follow the clockmaker\'s mark.', because: 'There are no markers here. Only symbols.', hints: M19_HINTS.marks, minutes: 5 },
      ],
      sides: [
        { id: 'orren', name: 'ORREN\'S THREE CONVERSATIONS', giver: 'orren', done: 'm19_orren3', minutes: 4,
          threads: [
            { id: 'orren1', kind: 'talk', npc: 'orren1', at: 'orrenRoad', goal: 'Orren, sweeping the road.', because: 'Is he a person, a memory or a pattern?', done: 'm19_orren1', hints: M19_HINTS.orren, minutes: 1 },
            { id: 'orren2', kind: 'talk', npc: 'orren2', at: 'observatoryPattern', after: ['orren1'], goal: 'Orren, by the stones.', because: 'He knows the rules here.', done: 'm19_orren2', hints: M19_HINTS.orren, minutes: 1 },
            { id: 'orren3', kind: 'talk', npc: 'orren3', at: 'bridgeFar', after: ['orren2'], goal: 'Orren, past the water.', because: 'He is waiting for me.', done: 'm19_orren3', hints: M19_HINTS.orren, minutes: 2 },
          ] },
        { id: 'gallery', name: 'THE CLOCKMAKER\'S MARK', done: 'ev_ezra_mark', minutes: 4,
          threads: [
            { id: 'galleryGo', kind: 'go', at: 'clockGallery', r: 7, goal: 'The clockmaker\'s gallery, floating.', because: 'His light well, in a sky with no sun.', hints: M19_HINTS.gallery, minutes: 2 },
            { id: 'galleryArm', kind: 'scene', scene: 'arm', at: 'clockGallery', after: ['galleryGo'], spot: { prompt: 'THE BRASS ARM', offset: [0, 1.0, -6.4], r: 2.4, kit: 'brassArm', when: '@PAST || @FUTURE' },
              goal: 'The brass arm in the light well.', because: 'Something is cut under his mark.', done: 'ev_ezra_mark', hints: M19_HINTS.arm, minutes: 2 },
          ] },
      ],
    },
    {
      name: 'THE BRIDGE IN THE REFLECTION',
      threads: [
        { id: 'pattern', kind: 'scene', scene: 'pattern', at: 'stonePattern', after: ['marks'], spot: { prompt: 'THE STONES', offset: [0, 0.8, 6], r: 3, kit: 'symbolStone' },
          goal: 'The observatory\'s pattern, in stones.', because: 'The second symbol.', done: 'ev_pattern19', hints: M19_HINTS.pattern, minutes: 5 },
        { id: 'badge', kind: 'scene', scene: 'badge', at: 'helixBadge', after: ['pattern'], spot: { prompt: 'A BADGE IN THE GLASS', offset: [0, 0.6, 1.6], r: 2.6, kit: 'badge' },
          goal: 'The Helix badge, set in the glass.', because: 'The third symbol.', done: 'ev_badge19', hints: M19_HINTS.badge, minutes: 4 },
        { id: 'bridge', kind: 'go', at: 'bridgeFar', r: 5, after: ['badge'], say: [K('A bridge that was there once, and in the water always.')],
          goal: 'Cross the bridge that is only in the reflection.', because: 'North of the badge, deep water.', hints: M19_HINTS.bridge, minutes: 6 },
      ],
    },
    {
      name: 'THE DOOR THAT IS EVERYWHERE',
      threads: [
        { id: 'doors', kind: 'clue', need: 2, of: ['ev_door_shadow', 'ev_door_bare'], after: ['bridge'],
          spots: [
            ...['door1', 'door2', 'door3', 'door4'].map((at) => ({ id: `look_${at}`, scene: 'doorShadow', at, prompt: 'A BLUE DOOR', offset: [0, 1.2, 1.4], r: 2.4, model: NO_MODEL })),
            { id: 'look_door5', scene: 'doorBare', at: 'door5', prompt: 'A BLUE DOOR', offset: [0, 1.2, 1.4], r: 2.4, model: NO_MODEL },
          ],
          goal: 'The same blue door, in five places.', because: 'One of them is a door. The rest are where it was.', hints: M19_HINTS.doors, minutes: 2 },
        { id: 'door', kind: 'deduce', deduction: 'door', at: 'miraMeet', after: ['doors'], spotOpts: { offset: [2.4, 1.2, 0], r: 3, kit: 'mirrorPlate' },
          goal: 'Which door is real?', because: 'Five doors. One way through.', hints: M19_HINTS.door, minutes: 3 },
        { id: 'mira', kind: 'talk', npc: 'mira19', at: 'miraMeet', after: ['door'], goal: 'Mira, by the real door.', because: 'In person. Not a hologram.', done: 'm20_lead', hints: M19_HINTS.mira, minutes: 3 },
      ],
    },
  ],
  talks: {
    orren1: [
      { when: '!m19_orren1', lines: [L('ORREN', 'I was an anchor once. Or I will be. The tense is unkind here.'), K('Are you a person?'), L('ORREN', 'Which version of the question are you asking?')], set: { m19_orren1: true } },
      { when: 'm19_orren1', lines: [L('ORREN', 'Follow the marks.')] },
    ],
    orren2: [
      { when: '!m19_orren2', lines: [L('ORREN', 'A road is real where someone cared enough to mark it.'), K('And a bridge?'), L('ORREN', 'A bridge is real when it was real. Ask the water when.')], set: { m19_orren2: true } },
      { when: 'm19_orren2', lines: [L('ORREN', 'Ask the water.')] },
    ],
    orren3: [
      { when: '!m19_orren3', lines: [L('ORREN', 'Doors are the worst. They are all the same door.'), K('Then how do I choose?'), L('ORREN', 'You don\'t. You notice which one the light ignores.')], set: { m19_orren3: true } },
      { when: 'm19_orren3', lines: [L('ORREN', 'The light, Kai.')] },
    ],
    mira19: [
      {
        when: '!m20_lead',
        lines: [REV(L('MIRA', 'You\'ve been trying to reach the version of me that would forgive you.')), K('Is there one?'), L('MIRA', 'There\'s me. Start there.')],
        choices: [
          intent('investigate', 'Open the door for her.', { say: 'Let me get the door.', consequence: true, lines: [L('MIRA', 'Of course you will.')], set: { m20_lead: 'kai' } }),
          intent('comfort', 'Wait for her to open it.', { say: 'After you.', consequence: true, lines: [L('MIRA', 'Thank you. That\'s new.')], set: { m20_lead: 'mira' } }),
        ],
      },
      { when: 'm20_lead', lines: [L('MIRA', 'The door, Kai.')] },
    ],
  },
  scenes: {
    markRoad: { lines: [N('The clockmaker\'s mark, chalked on the road. Under it the stone is real stone.')], set: { ev_mark_road: true } },
    markGallery: { lines: [N('The mark again, cut into the gallery\'s rail by the light well.')], set: { ev_mark_gallery: true } },
    markEnd: { lines: [N('No mark here. The road runs on a few metres more, and stops in the sky.')], set: { ev_mark_end: true } },
    arm: {
      lines: [N('The brass arm turns, and stops, and turns.'), N('Cut under the mark: PAID ON A WEDNESDAY.', 'ezra_debt == "release"'), N('Cut under the mark: FINISHED.', 'ezra_debt == "finish"'), N('Cut under the mark: OWED.', '!ezra_debt')],
      set: { ev_ezra_mark: true },
    },
    pattern: { lines: [N('Twelve stones in a ring, six of them gold: the observatory\'s pattern, the shape the Notch makes at sunrise.'), K('It points east. To the badge.')], set: { ev_pattern19: true } },
    badge: { lines: [N('A Helix badge set in the glass of the plain. VAREN, K. The edge is not scratched yet.'), K('North of it, the water.')], set: { ev_badge19: true } },
    doorShadow: { lines: [N('A blue door, a hand\'s width ajar. Its shadow lies long and blue on the water.')], set: { ev_door_shadow: true } },
    doorBare: { lines: [N('A blue door, a hand\'s width ajar. On the water under it, nothing. No shadow at all.')], set: { ev_door_bare: true } },
  },
  deductions: {
    door: {
      question: [K('Five doors, the same blue. Which one is the door?')],
      answers: [
        { intent: 'challenge', label: 'The one at the top of the stair.', lines: [K('A stair into the sky is a good place for a door. It has a shadow.')] },
        { intent: 'investigate', label: 'The one that casts no shadow.', correct: true, needs: 'ev_door_shadow && ev_door_bare',
          lines: [K('The Child had no shadow. Lin had none. Whatever is really here, the light goes through.'), REV(K('That one. It\'s the only real thing on the plain.'))] },
        { intent: 'withdraw', label: 'None of them.', lines: [K('Then where did she go?')] },
      ],
      unproven: [K('Look at the doors first. At what the light does.')],
      set: { ev_real_door: true }, log: 'The real door casts no shadow.',
    },
  },
  rules: [{ id: 'synced', when: 'inv_reflectionLag_done', set: { m19_synced: true }, say: [K('In step. The bridge holds now, in this year too.')] }],
  overlay(P) {
    person(P, { id: 'orren1', crew: 'orren', at: 'orrenRoad', off: [2, 0, -3], turn: Math.PI, prompt: 'TALK TO ORREN', when: '!m19_orren1' });
    person(P, { id: 'orren2', crew: 'orren', at: 'observatoryPattern', off: [3, 0, 0], turn: Math.PI / 2, prompt: 'TALK TO ORREN', when: 'm19_orren1 && !m19_orren2' });
    person(P, { id: 'orren3', crew: 'orren', at: 'bridgeFar', off: [3, 0, -2], turn: Math.PI, prompt: 'TALK TO ORREN', when: 'm19_orren2 && !m19_orren3' });
    person(P, { id: 'mira19', crew: 'mira', at: 'miraMeet', off: [0, 0, 0], turn: 0, prompt: 'TALK TO MIRA', when: 'ev_real_door' });
  },
  hook: {
    cue: 'cliff', minutes: 1,
    lines: [L('MIRA', 'Saving me is not the same as understanding me, Kai. You keep solving the wrong puzzle.'), N('She walks through the door alone, and it closes. It is a blue door.')],
  },
  done: 'm20_lead',
};
M19.outro = M19.hook.lines;

// =============================================================================================================
// Mission 20: MIRA'S MEMORY
// =============================================================================================================
const M20_HINTS = {
  childhood: ['Her childhood.', 'The fridge, the boots, the hall table. In 2026.', 'Look at all three.'],
  song: ['Mira, in the garden.', 'She remembers the song.', 'Talk to her.'],
  experiment: ['The experiment.', 'The console, in the white chamber.', 'Watch it from her side.'],
  without: ['The world without me.', 'The 41 stop, a memorial, a garden. In 2196.', 'Look at all three.'],
  align: ['Three memories.', 'Each keeps its own order. Nothing else has to.', 'Put the six moments on the board.'],
  child: ['The Child.', 'In the sea garden.', 'Listen.'],
  sister: ['Mira.', 'In the sea garden.', 'Talk to her.'],
  house: ['A house at the corner.', 'Nobody owns it on record. In 2196.', 'Look at the door, the window, the letterbox.'],
};
// R6: nothing here can be reversed; the first try, Mira answers it herself
const MEMORY = (id, at, label, aim) => ({ id, kind: 'refusal', refuse: 'A MEMORY', at, label, line: 'Don\'t. Let it happen the way it happened.', lineWho: 'MIRA', once: 'm20_refused', aim });
const M20_PROCESSES = [
  MEMORY('fridge', 'fridgeDrawing', 'THE DRAWING', [0, 1.4, 0.3]),
  MEMORY('chair', 'childChair', 'THE CHAIR', [0, 0.8, 0]),
  MEMORY('consoleMem', 'console', 'THE CONSOLE', [0, 1.2, 0]),
  MEMORY('planting', 'miraPlanting', 'THE GARDEN', [0, 0.6, 1]),
];
// the alignment: six moments from three memories; each memory keeps its own order, any interleaving is hers
const PIECES = [
  { id: 'h1', label: 'The drawing goes on the fridge.' }, { id: 'h2', label: 'The song, in the kitchen.' },
  { id: 'e1', label: 'She asks to see the ring turn.' }, { id: 'e2', label: 'The ring turns.' },
  { id: 'w1', label: 'The 41 is late.' }, { id: 'w2', label: 'She plants the garden.' },
];
const ALIGN = {
  first: [N('Six moments from three memories, on a board. Each memory keeps its own order. Nothing else has to.')],
  next: [N('The next moment.')],
  early: [L('MIRA', 'Not yet. In that memory, something comes first.')],
  tidy: [L('MIRA', 'One line, yours first, everything after you. That isn\'t mine, Kai.')],
  done: [N('Three memories side by side, none of them forced into the others.'), REV(L('MIRA', 'They\'re all mine.'))],
};
function alignNode(rt) {
  const f = rt.g.facts;
  const has = (p) => !!f.get(`m20_${p.id}`);
  const rest = PIECES.filter((p) => !has(p));
  if (!rest.length) return { lines: ALIGN.done };
  const choices = rest.map((p) => {
    const before = PIECES.find((q) => q.id[0] === p.id[0] && q.id < p.id && !has(q));
    if (before) return { intent: 'investigate', label: p.label, mute: true, lines: ALIGN.early };
    const last = rest.length === 1;
    return { intent: 'investigate', label: p.label, mute: true, set: { [`m20_${p.id}`]: true, ...(last ? { m20_aligned: true } : {}) }, lines: last ? ALIGN.done : [] };
  });
  // (Kai leading: his tidy version comes first, and the board will not take it)
  if (f.get('m20_lead') === 'kai' && !f.get('m20_tidy') && rest.length === PIECES.length) choices.unshift({ intent: 'challenge', label: 'One line. Mine first.', mute: true, set: { m20_tidy: true }, lines: ALIGN.tidy });
  return { lines: rest.length === PIECES.length ? ALIGN.first : ALIGN.next, choices };
}

export const M20 = {
  key: 'm20', n: 20, chapter: 'act4', name: 'MIRA\'S MEMORY', title: 'Subjective memories that contradict each other', subtitle: 'Childhood. The original experiment. A timeline where she survives and you do not.',
  logline: 'One street, remembered three ways.',
  place: 'memory', sectors: 1, home: 'PAST', states: ['PAST', 'PRESENT', 'FUTURE'], drones: [0, 0, 0], ambience: null, ambient: 'liminal',
  motto: 'I REMEMBER BEING YOUR SISTER', gate: 'THREE MEMORIES', crew: C('mira'),
  named: ['mira', 'child', 'kai12', 'witness'],
  minutes: { main: 30, optional: 10 }, autoExit: 1.2, gateAfter: true,
  processes: M20_PROCESSES,
  fragSpots: [['blueDoor'], ['whiteChamber'], ['stop41']],
  fragments: [[
    'A blue door. Behind it, a kitchen where two children are arguing about a song.',
    'A white room. Only the things she remembers are in colour.',
    'A bus stop by the sea. The timetable is from a city that never needed one.',
  ]],
  beats: [{ kind: 'custom', goal: 'Align three memories.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    shots: [{ cam: 'kitchen', look: 'fridgeDrawing', t: 9 }],
    cast: [{ crew: 'kai12', at: 'fridgeDrawing', off: [0.7, 0, 1.3], turn: Math.PI }, { crew: 'child', variant: 'mira9', at: 'fridgeDrawing', off: [-0.8, 0, 1.7], turn: Math.PI + 0.5 }],
    lines: [SAYS('KAI, TWELVE', 'KAI12', 'It goes up, and then up again, and then it stops.'), L('MIRA9', 'It goes up, up, and then down.'), SAYS('KAI, TWELVE', 'KAI12', 'Stops.'), L('MIRA9', 'Fine. Stops. For you.')],
  },
  quarters: [
    {
      name: 'THE HOUSE',
      threads: [
        { id: 'childhood', kind: 'clue', need: 3, of: ['ev_fridge_drawing', 'ev_yellow_boots', 'ev_night_badge'],
          spots: [
            { id: 'drawing', scene: 'drawing', at: 'fridgeDrawing', prompt: 'THE DRAWING ON THE FRIDGE', offset: [0, 1.3, 0.6], r: 2.2, kit: 'fridgeNote', when: '@PAST' },
            { id: 'boots', scene: 'boots', at: 'yellowBoots', prompt: 'YELLOW BOOTS', offset: [0, 0.4, 0.5], r: 2.2, model: NO_MODEL, when: '@PAST' },
            { id: 'nightBadge', scene: 'nightBadge', at: 'nightBadge', prompt: 'A BADGE ON THE HALL TABLE', offset: [0, 1.0, 0.5], r: 2.2, model: NO_MODEL, when: '@PAST' },
          ],
          say: [L('MIRA', 'Before the house, the hospital bench. You sat on it every night that week. I watched you from the ward.', 'm20_lead == "mira"')],
          goal: 'Explore Mira\'s childhood with her.', because: 'The house with the blue door, on a summer evening.', hints: M20_HINTS.childhood, minutes: 5 },
        { id: 'song', kind: 'talk', npc: 'mira20a', at: 'garden', after: ['childhood'], goal: 'Mira, in the garden.', because: 'She remembers the song her way.', done: 'm20_song', hints: M20_HINTS.song, minutes: 2 },
      ],
    },
    {
      name: 'THE EXPERIMENT',
      threads: [
        { id: 'experiment', kind: 'playback', at: 'console', after: ['song'], prompt: 'THE CONSOLE', offset: [0, 1.2, 1.4], kit: 'memoryChair',
          echoes: [{ crew: 'kai12', at: 'console' }, { crew: 'child', variant: 'mira9', at: 'childChair' }],
          lines: [N('Chamber One, from the chair. The ring is enormous. A boy on a step stool, at a console built for grown men.'), L('MIRA9', 'Do it, Kai. I want to see it turn.'),
            L('MIRA', 'You let me. I asked, and you let me. I was nine, Kai, not nothing.'), K('I should have said no.'), REV(L('MIRA', 'Then I would have asked somebody else. I was that kind of nine.'))],
          set: { ev_her_side: true }, log: 'The first experiment, from her side: she asked.',
          goal: 'Replay the original experiment, from Mira\'s side.', because: 'In the white room, the child-sized chair.', hints: M20_HINTS.experiment, minutes: 5 },
      ],
    },
    {
      name: 'THE WORLD WITHOUT KAI',
      threads: [
        { id: 'without', kind: 'clue', need: 3, of: ['ev_late41', 'ev_memorial_nobody', 'ev_mira_planting'], after: ['experiment'],
          spots: [
            { id: 'late41', scene: 'late41', at: 'stop41', prompt: 'THE 41 STOP', offset: [0, 1.2, 1.2], r: 2.6, kit: 'timetable', when: '@FUTURE' },
            { id: 'memorialNobody', scene: 'memorialNobody', at: 'memorialNobody', prompt: 'A MEMORIAL', offset: [0, 1.2, 1.2], r: 2.6, model: NO_MODEL, when: '@FUTURE' },
            { id: 'planting', scene: 'planting', at: 'miraPlanting', prompt: 'MIRA, PLANTING', offset: [0, 1.0, 1.6], r: 2.6, model: NO_MODEL, when: '@FUTURE' },
          ],
          say: [K('I\'m not in this one. The 41 is late, and she\'s fine.')],
          goal: 'The world where she survives and I do not.', because: 'The sea where the street was.', hints: M20_HINTS.without, minutes: 6 },
        { id: 'align', kind: 'scene', scene: 'align', at: 'alignBoard', after: ['without'], spot: { prompt: 'THREE MEMORIES', offset: [0, 1.2, 1.2], r: 3, kit: 'chartBoard' },
          goal: 'Align three memories without forcing them into one.', because: 'They disagree. They are all hers.', done: 'm20_aligned', hints: M20_HINTS.align, minutes: 6 },
        { id: 'child', kind: 'cinema', after: ['align'],
          lines: [N('The Child walks out of the house with the blue door, across all three memories, to the woman in the garden.'), L('CHILD', 'Up, up...'), L('MIRA', 'And then down.'),
            REV(L('MIRA', 'She\'s the part of me that stayed nine. She was waiting for someone to sing it right.'))],
          set: { child_resolved: true }, goal: 'The Child, in the sea garden.', because: 'She has been waiting since the station.', done: 'child_resolved', hints: M20_HINTS.child, minutes: 2 },
        { id: 'sister', kind: 'talk', npc: 'mira20', at: 'seaGarden', after: ['child'], goal: 'Mira.', because: 'Every life she remembers was real.', done: 'm20_sister', hints: M20_HINTS.sister, minutes: 2 },
      ],
      sides: [
        { id: 'house', name: 'THE HOUSE WITH NO OWNER', case: 'c_house', done: 'ev_no_owner', minutes: 10,
          threads: [
            { id: 'houseDoor', kind: 'scene', scene: 'houseDoor', at: 'houseNoOwner', spot: { prompt: 'THE FRONT DOOR', offset: [0, 1.2, 1.2], r: 2.6, kit: 'doorFrame', when: '@FUTURE' },
              goal: 'A house at the corner that belongs to nobody.', because: 'In the world without me.', done: 'ev_no_owner_door', hints: M20_HINTS.house, minutes: 3 },
            { id: 'houseWindow', kind: 'scene', scene: 'houseWindow', at: 'houseNoOwner', after: ['houseDoor'], spot: { prompt: 'THE WINDOW', offset: [-3.2, 1.4, 1.2], r: 2.4, model: NO_MODEL, when: '@FUTURE' },
              goal: 'Look through the window.', because: 'Whose life is in there?', done: 'ev_adult_life', hints: M20_HINTS.house, minutes: 3 },
            { id: 'houseLetter', kind: 'scene', scene: 'houseLetter', at: 'houseNoOwner', after: ['houseWindow'], spot: { prompt: 'THE LETTERBOX', offset: [1.4, 1.0, 1.2], r: 2.2, kit: 'keepsake', when: '@FUTURE' },
              goal: 'The letterbox.', because: 'A letter that was never posted.', done: 'ev_no_owner', hints: M20_HINTS.house, minutes: 4 },
          ] },
      ],
    },
  ],
  talks: {
    mira20a: [
      { when: '!m20_song', lines: [K('It goes up, and then up again, and then it stops.'), L('MIRA', 'Up, up, and then down. You always stopped it. I let you.'), K('Why?'), L('MIRA', 'Because you were twelve, and it was the only thing you were sure of.')], set: { m20_song: true, ev_song_argument: true } },
      { when: 'm20_song', lines: [L('MIRA', 'Down, Kai. It goes down.')] },
    ],
    mira20: [
      { when: '!m20_sister', lines: [L('MIRA', 'I remember being your sister.'), K('That\'s not the same thing.'), L('MIRA', 'Would it be enough if I said it was?')], set: { m20_sister: true } },
      { when: 'm20_sister', lines: [L('MIRA', 'Go on. He\'s waiting for you.')] },
    ],
  },
  scenes: {
    drawing: { lines: [N('Crayon on the fridge: KAI + MIRA beside a black circle. She drew it. He kept it.')], set: { ev_fridge_drawing: true } },
    boots: { lines: [N('Yellow boots by the back door, still muddy from the dig on the hill.')], set: { ev_yellow_boots: true } },
    nightBadge: { lines: [N('Their mother\'s badge: RAIN CITY GENERAL, NIGHT SHIFT. Left on the hall table, every morning, for a week.')], set: { ev_night_badge: true } },
    late41: { lines: [N('The 41 stop. The timetable says 8:14. The bus is late, and nobody minds.')], set: { ev_late41: true } },
    memorialNobody: { lines: [N('A memorial with no name on it, and fresh flowers. FOR NOBODY IN PARTICULAR.')], set: { ev_memorial_nobody: true } },
    planting: { lines: [N('Mira at thirty-two, planting. She hums up, up, and stops, and frowns, as if a note is missing.')], set: { ev_mira_planting: true } },
    // (the board itself is built when it is used: nodes.align)
    align: { lines: ALIGN.first },
    houseDoor: { lines: [N('The house at the corner belongs to nobody on record. The door is not locked. Nobody has ever needed it to be.')], set: { ev_no_owner_door: true } },
    houseWindow: { lines: [N('Through the window: one cup, one chair, a plan for a garden pinned to the wall. A whole life, kept for one.')], set: { ev_adult_life: true } },
    houseLetter: { lines: [N('In the letterbox, a letter she wrote and never posted: DEAR BROTHER. I DON\'T HAVE ONE. I KEEP WRITING ANYWAY.')], set: { ev_no_owner: true }, log: 'In the world without me, Mira writes to a brother she never had.' },
  },
  nodes: { align: alignNode },
  spoken: { align: [...ALIGN.first, ...ALIGN.next, ...ALIGN.early, ...ALIGN.tidy, ...ALIGN.done] },
  // the Child's song from the sea garden, while she walks to Mira
  step(rt, dt) {
    const g = rt.g;
    if (!g.facts.get('t_m20_align') || g.facts.get('child_resolved') || (rt.m20T = (rt.m20T ?? 0) - dt) > 0) return;
    rt.m20T = 6;
    song(rt, 0.8, 'child');
  },
  overlay(P) {
    person(P, { id: 'mira20a', crew: 'mira', at: 'garden', off: [1.6, 0, 1.4], turn: Math.PI, prompt: 'TALK TO MIRA', when: 't_m20_childhood && !m20_song' });
    person(P, { id: 'mira_plant', crew: 'mira', at: 'miraPlanting', off: [0, 0, 0], turn: 0, silent: true, when: '@FUTURE && !t_m20_align' });
    person(P, { id: 'mira20', crew: 'mira', at: 'seaGarden', off: [0, 0, 1.2], turn: Math.PI, prompt: 'TALK TO MIRA', when: 't_m20_align' });
    person(P, { id: 'child20', crew: 'child', at: 'seaGarden', off: [1.4, 0, 1.6], turn: Math.PI, silent: true, when: 't_m20_align' });
  },
  hook: {
    cue: 'cliff', minutes: 1,
    lines: [REV(N('Mira is a reconstructed consciousness carrying memories from more than one possible life. None of them is false.')), L('MIRA', 'Now he\'s going to try to fix it. He\'s already started.'), N('Sirens, from the Spire.')],
  },
  done: 'm20_sister',
};
M20.outro = M20.hook.lines;

// =============================================================================================================
// Mission 21: THE LAST BATTLE OF THE CONTINUUM
// =============================================================================================================
const M21_HINTS = {
  elites: ['Elites on the deck.', 'An afterimage throws them back five seconds. REVERSE that, and they are stuck.', 'Echo Step near one, then REVERSE one.'],
  infiltrate: ['The command halls.', 'Up on the first terrace. The kitchen door, if anyone listened; or the stair alone, west.', 'Get there unseen.'],
  prisoners: ['The cells.', 'Above the halls, behind glass.', 'Open them.'],
  arena: ['The arena.', 'Across the bridge from the cells\' terrace.', 'Walk onto the ring.'],
  gapOne: ['The first gap.', 'The slab fell into the clouds. Fallen things rise.', 'REVERSE the slab and cross while it holds.'],
  ally: ['Call for help.', 'Someone I earned, or nobody.', 'Choose.'],
  gapTwo: ['The second gap.', 'An ally holds it, or I do, or in 2196 a girder lies across it.', 'Cross to the summit stair.'],
  confront: ['The Witness.', 'At the summit, by the ring.', 'Face him.'],
  office: ['The Director\'s office.', 'A glass corner on the cells\' terrace.', 'Look.'],
  radio: ['A radio.', 'By the light bridge.', 'Listen.'],
};
const M21_SAY = {
  snap: [K('It jumped back to where it stood five seconds ago. They rewind themselves.')],
  stuck: [K('Its rewind, run forwards. It\'s stuck where it stands.')],
  release: [K('The slab is going. Whoever held it, thank you.')],
};
// a slab of the fallen arena: held, it comes back out of the clouds, a bridge across its gap
const GAP = (id) => ({
  id, kind: 'collapse', at: id, label: 'THE FALLEN SLAB', weight: 1.5, when: 'arena_fallen', grain: 'stone', mat: 'concrete',
  span: { from: [0, 0, -0.6], to: [0, 0, 8.4], width: 7, pieces: 5, thick: 0.6, floor: -30 }, aim: [0, 0.6, 4],
  hints: ['The slab fell into the clouds.', 'Fallen things rise. Only one at a time.', 'REVERSE it, and cross while it holds.'],
});
const M21_PROCESSES = [
  // R5: the elites rewind themselves; reversing a rewind leaves one stuck forward for six seconds
  { id: 'eliteA', kind: 'patrol', target: 'm21_spire_q0s0', mode: 'rewind', stuck: 6, label: 'THE REWIND', weight: 1, hints: M21_HINTS.elites },
  { id: 'eliteB', kind: 'patrol', target: 'm21_spire_q0s1', mode: 'rewind', stuck: 6, label: 'THE REWIND', weight: 1, hints: M21_HINTS.elites },
  GAP('arenaGap1'), GAP('arenaGap2'),
];
// an elite that sees an afterimage snaps back to where it stood five seconds earlier
function m21Echo(rt, p) {
  const g = rt.g;
  let n = 0;
  for (const s of g.deckWorld?.sentinels || []) {
    if (!/_q0s\d$/.test(s.def.id) || Math.hypot(s.pos.x - p.x, s.pos.z - p.z) > 16) continue;
    const h = rt.inv?.hist.get(s.def.id) || [];
    const back = h[Math.max(0, h.length - 50)];
    if (!back) continue;
    s.pos.set(back[0], 0, back[1]);
    if (Math.hypot(back[2], back[3]) > 1e-3) s.dir.set(back[2], 0, back[3]).normalize();
    s.mode = 'patrol';
    s.suspicion = 0;
    n++;
  }
  if (!n) return;
  g.facts.set('m21_snapped', true);
  if (!g.facts.get('m21_snap_said')) {
    g.facts.set('m21_snap_said', true);
    g.hud.say(M21_SAY.snap, g.facts);
  }
}
// the ally holds the second gap for thirty seconds (REVERSE, theirs); then it goes
function m21Step(rt, dt) {
  const g = rt.g;
  if (!(rt.m21Hold > 0)) return;
  rt.m21Hold -= dt;
  if (rt.m21Hold > 0) return;
  const p = rt.inv?.procs.find((x) => x.rec.id === 'arenaGap2');
  if (p?.heldBy) {
    p.release();
    p.heldBy = null;
    rt.inv?.snd?.release?.(p.rec.grain, p.rec.creak);
    if (!g.facts.get('t_m21_gapTwo')) g.hud.say(M21_SAY.release, g.facts);
  }
}
const DIRECTOR_LINE = 'One permanent timeline. The Witness is building it for us.';

export const M21 = {
  key: 'm21', n: 21, chapter: 'act4', name: 'THE LAST BATTLE OF THE CONTINUUM', title: 'The command structure', subtitle: 'The Continuum wants one timeline. The Witness wants Mira. The Unwritten want the network gone.',
  logline: 'The Continuum Spire, above the clouds.',
  place: 'spire', sectors: 1, states: ['PRESENT', 'PAST', 'FUTURE'], drones: [2, 0, 0, 0], unstable: true, ambience: 'wind', ambient: 'loop',
  motto: 'ONE PERMANENT TIMELINE', gate: 'THE ARENA', crew: C('witness'),
  named: ['witness', 'sera', 'anja', 'iven', 'rook', 'guard', 'mara'],
  minutes: { main: 34, optional: 6 }, autoExit: 1.2, gateAfter: true,
  processes: M21_PROCESSES,
  fragSpots: [['gliderDeck'], ['eliteRamps'], ['mastRail']],
  fragments: [[
    'A glider deck with one glider missing. Its mooring line is cut, not untied.',
    'An elite\'s visor, cracked, and mended, and cracked again in the same place.',
    'A transmitter mast humming three notes, slowly.',
  ]],
  beats: [{ kind: 'custom', goal: 'Reach the Witness.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    shots: [{ cam: 'arrival', look: 'mast', t: 9 }],
    cast: [{ crew: 'director', at: 'arrival', off: [0, 0, 12], turn: Math.PI, hologram: true }],
    lines: [L('ROOK', DIRECTOR_LINE, 'rook_fate == "persuade"'), SAYS('THE DIRECTOR', 'PRYCE', DIRECTOR_LINE, 'rook_fate == "expose"'),
      FX(SAYS('THE DIRECTOR', 'DIRECTOR', DIRECTOR_LINE, '!(rook_fate == "persuade") && !(rook_fate == "expose")'), 'recording'), N('Above the clouds, every elite on the Spire turns toward the stairs.')],
  },
  quarters: [
    {
      name: 'THE ALLY / ARRIVAL',
      threads: [
        { id: 'elites', kind: 'tasks', of: ['m21_snapped', 'm21_stuck'], at: 'arrival', say: [K('Throw them back, then hold them there.')],
          goal: 'Elite watchers on the deck. They rewind what you do to them.', because: 'Graphite, emissive visors. They heal backwards.', hints: M21_HINTS.elites, minutes: 7 },
        { id: 'infiltrate', kind: 'stealth', at: 'commandHalls', r: 6, after: ['elites'], goal: 'Infiltrate the command structure.', because: 'The command halls, on the first terrace.', hints: M21_HINTS.infiltrate, minutes: 6 },
      ],
      sides: [
        { id: 'radio', name: 'MARA ON THE RADIO', done: 'ev_mara_radio', minutes: 2,
          threads: [{ id: 'radioListen', kind: 'scene', scene: 'radio', at: 'lightBridge', spot: { prompt: 'A RADIO', offset: [2.4, 1.0, -2], r: 2.6, kit: 'recorder' },
            goal: 'A radio, by the light bridge.', because: 'It is on Mara\'s frequency.', done: 'ev_mara_radio', hints: M21_HINTS.radio, minutes: 2 }] },
      ],
    },
    {
      name: 'THE COMMAND STRUCTURE',
      threads: [
        { id: 'prisoners', kind: 'scene', scene: 'cells', at: 'cells', when: 'prisoners_held', after: ['infiltrate'], spot: { prompt: 'THE CELLS', offset: [0, 1.2, 1.4], r: 3, kit: 'citadelConsole' },
          goal: 'Free the prisoners from the dam.', because: 'They were held. They are here.', done: 'm21_cells', hints: M21_HINTS.prisoners, minutes: 2 },
      ],
      sides: [
        { id: 'office', name: 'THE DIRECTOR\'S OFFICE', done: 'ev_director_office21', minutes: 4,
          threads: [{ id: 'officeLook', kind: 'scene', scene: 'office', at: 'directorOffice', spot: { prompt: 'THE DIRECTOR\'S DESK', offset: [0, 1.1, 1.4], r: 2.8, kit: 'commandLectern' },
            goal: 'The Director\'s office.', because: 'A glass corner, with a view of everything.', done: 'ev_director_office21', hints: M21_HINTS.office, minutes: 4 }] },
      ],
    },
    {
      name: 'THE ARENA',
      threads: [
        { id: 'arena', kind: 'go', at: 'arenaRing', r: 6, after: ['infiltrate'], set: { arena_fallen: true },
          say: [N('The arena shudders. Slabs of the ring drop into the clouds, one after another.'), K('Last fallen, first back.')],
          goal: 'The arena ring.', because: 'The summit stair is on its far side.', hints: M21_HINTS.arena, minutes: 1 },
        { id: 'gapOne', kind: 'go', at: 'arenaMid', r: 4, after: ['arena'], goal: 'Across the first gap.', because: 'The slab is in the clouds.', hints: M21_HINTS.gapOne, minutes: 3 },
        { id: 'ally', kind: 'choice', scene: 'ally', at: 'arenaMid', after: ['gapOne'], spot: { prompt: 'CALL FOR HELP', offset: [0, 1.2, 0], r: 3, kit: 'eliteBadge' },
          goal: 'Call on an ally.', because: 'The second gap. Somebody could hold it while I cross.', done: 'ally', hints: M21_HINTS.ally, minutes: 3 },
        { id: 'gapTwo', kind: 'go', at: 'summitStair', r: 4, after: ['ally'], goal: 'Across the second gap, to the summit stair.', because: 'Thirty seconds, or another year.', hints: M21_HINTS.gapTwo, minutes: 4 },
      ],
    },
    {
      name: 'THE WITNESS',
      threads: [
        { id: 'confront', kind: 'talk', npc: 'witness21', at: 'witnessStand', after: ['gapTwo'], goal: 'Confront the Witness.', because: 'He is at the citadel\'s ring.', done: 'm21_wrists', hints: M21_HINTS.confront, minutes: 5 },
      ],
    },
  ],
  talks: {
    witness21: [
      {
        when: '!m21_wrists',
        lines: [N('Two wrists, side by side. The same broken halo, thirty years apart.'),
          FX(L('MIRA9', 'Tomorrow I\'m going to see the big ring turn. Don\'t tell Mum.', 'mira_tape == "kept"'), 'recording'), N('He stops, and listens to all of it.', 'mira_tape == "kept"'),
          N('Kai holds up the photograph from the museum. The Witness looks at it a long time.', 'photo_taken'),
          N('Kai gives him the letter. He does not open it. He does not give it back.', 'letter == "delivered"'),
          K('You were going to do it again. One more world.'), L('WITNESS', 'One more. It is always one more.')],
        set: { m21_wrists: true },
      },
      { when: 'm21_wrists', lines: [L('WITNESS', 'The ring, Kai.')] },
    ],
    m21_cook: [{ when: 'true', lines: [SAYS('A COOK', 'CROWD_F', 'You told us to get out of the tower, back then. We did. The kitchen door\'s open. Go on.')] }],
  },
  scenes: {
    radio: { lines: [FX(L('MARA', 'Whatever you choose, I\'ll keep both records.'), 'radio')], set: { ev_mara_radio: true } },
    cells: { lines: [N('The prisoners from the dam, twelve of them, behind glass. The lock answers the Chronolith.'), K('Out. All of you. Go down the way I came.')], set: { m21_cells: true } },
    office: {
      lines: [L('ROOK', 'They gave me the chair. I signed nothing in it. Go up.', 'rook_fate == "persuade"'),
        SAYS('OFFICER PRYCE', 'PRYCE', 'They gave me his chair. I check badges from it. Not yours.', 'rook_fate == "expose"'),
        N('An empty chair, and a recorder on the desk, still running.', '!(rook_fate == "persuade") && !(rook_fate == "expose")')],
      set: { ev_director_office21: true },
    },
    ally: {
      lines: [N('The second gap. Somebody you earned could hold it for thirty seconds. Or the year could.')],
      choices: [
        intent('investigate', 'Sera.', { when: '!ally && (faction == "unwritten" || ev_sera_doubt || trust_sera == "accept")', lines: [L('SERA', 'Told you I wasn\'t coming to get you. I lied. Go.')], set: { ally: 'sera' }, then: 'allyHold' }),
        intent('investigate', 'Anja.', { when: '!ally && (city_freed || city_stabilized)', lines: [L('ANJA', 'A lock can hold a slab as easily as a city. Thirty seconds. Run.')], set: { ally: 'anja' }, then: 'allyHold' }),
        intent('investigate', 'Iven.', { when: '!ally && (last_signal || iven_team_saved)', lines: [L('IVEN', 'I owe you a route. Thirty seconds. Go.')], set: { ally: 'iven' }, then: 'allyHold' }),
        intent('investigate', 'Rook.', { when: '!ally && rook_fate == "persuade"', lines: [L('ROOK', 'I held a gate for you once. A bridge is a gate lying down.')], set: { ally: 'rook' }, then: 'allyHold' }),
        intent('comfort', 'The people who listened.', { when: '!ally && warned_evacuees', lines: [SAYS('A LISTENER', 'CROWD_F2', 'You told us to get out. We got out. Now you get across.')], set: { ally: 'listeners' }, then: 'allyHold' }),
        intent('withdraw', 'Nobody. I go alone.', { when: '!ally', lines: [K('Alone, then. In 2196 a girder lies across that gap.')], set: { ally: 'none' } }),
        intent('investigate', 'Once more.', { when: 'ally && !(ally == "none")', lines: [K('Once more. Hold it.')], then: 'allyHold' }),
      ],
    },
  },
  rules: [{ id: 'stuck', when: 'stuck_eliteA || stuck_eliteB', set: { m21_stuck: true }, say: M21_SAY.stuck }],
  fx: {
    allyHold(rt) {
      const p = rt.inv?.procs.find((x) => x.rec.id === 'arenaGap2');
      if (!p) return;
      p.heldBy = rt.g.facts.get('ally') || 'ally';
      p.reverse();
      rt.inv.snd?.start?.(p.rec.grain);
      rt.m21Hold = 30;
    },
  },
  onEcho: m21Echo,
  step: m21Step,
  spoken: M21_SAY, // (the lines its code says: the snap back, the stuck elite, the ally letting go)
  watch: [[[[-50, 40], [50, 40]], [[40, 58], [-40, 58]]], [], [], []],
  overlay(P) {
    person(P, { id: 'witness21', crew: 'witness', at: 'witnessStand', off: [-2, 0, 0], turn: Math.PI / 2, prompt: 'TALK TO HIM', when: 't_m21_gapTwo' });
    person(P, { id: 'm21_cook', crew: 'm21_cook', first: 'A cook', seed: 2101, ambient: true, at: 'kitchenDoor', off: [2.2, 0, 1.6], turn: Math.PI, prompt: 'TALK', when: 'warned_evacuees && !t_m21_infiltrate' });
    for (const [id, crew, when, o] of [['sera21', 'sera', 'ally == "sera"', {}], ['anja21', 'anja', 'ally == "anja"', {}], ['iven21', 'iven', 'ally == "iven"', {}], ['rook21', 'rook', 'ally == "rook"', { variant: 'old' }]]) {
      person(P, { id, crew, at: 'arenaGap2', off: [3.6, 0, 9.4], turn: Math.PI, silent: true, when, ...o });
    }
    person(P, { id: 'm21_listener', crew: 'm21_listener', first: 'One who listened', seed: 2102, ambient: true, at: 'arenaGap2', off: [3.6, 0, 9.4], turn: Math.PI, silent: true, when: 'ally == "listeners"' });
    person(P, { id: 'rook_office', crew: 'rook', variant: 'old', at: 'directorOffice', off: [0, 0, -1.2], silent: true, when: 'rook_fate == "persuade"' });
    person(P, { id: 'pryce_office', crew: 'guard', at: 'directorOffice', off: [0, 0, -1.2], silent: true, when: 'rook_fate == "expose"' });
  },
  hook: {
    cue: 'cliff', minutes: 2,
    lines: [L('WITNESS', 'I was trying to find a version of me that didn\'t have to.'), K('And did you?'), L('WITNESS', 'No.'), N('He turns the citadel\'s ring, and the final experiment begins.'), REV(N('Every clock in the citadel reads 05:40.'))],
  },
  done: 'm21_wrists',
};
M21.outro = M21.hook.lines;

// =============================================================================================================
// Mission 22: THE FIRST SECOND
// =============================================================================================================
const M22_HINTS = {
  chain: ['The chain wall.', 'A river, a wall, a gate, a machine. What made what happen?', 'Put them in order: the river first.'],
  arm: ['The clockmaker\'s arm.', 'It answers only on its counted beat.', 'Count three, and REVERSE on the turn.'],
  odile: ['Odile\'s echo.', 'At the hospital\'s lock.', 'Listen to her.'],
  seals: ['The final seals.', 'Last fitted, first out. The chain, backwards.', 'MACHINE, GATE, WALL, RIVER.'],
  table: ['The evidence table.', 'A statement, and a card from the museum.', 'Read both.'],
  logs: ['Two sealed logs.', 'A record shows its making when it runs backwards.', 'REVERSE the logs.'],
  evidence: ['Evidence, or memory?', 'The logs keep seconds. Memories don\'t.', 'It turned before I pressed it.'],
  reveal: ['The Witness.', 'In the twin chamber.', 'Talk to him.'],
  chamber: ['The final chamber.', 'Behind the seals.', 'Open it.'],
  orren: ['Orren.', 'In the court wedge, 2196.', 'Ask him.'],
  record: ['The unwritten record.', 'Orren keeps it.', 'Read it.'],
};
const M22_PROCESSES = [
  // the activation sequence: the arm answers only on its counted beat (Ezra's count)
  {
    id: 'clockArm', kind: 'mechanism', at: 'clockArm', label: 'THE ARM', weight: 1, settle: 'settled', grain: 'metal', spin: [0, 0, 1, 1.4],
    beat: { period: 3, on: 0.9 }, offBeat: 'Off the beat. Count it, the way Ezra did.',
    parts: [{ shape: 'box', size: [0.14, 1.8, 0.1], mat: 'brass', at: [0, 2.2, 0.3] }], aim: [0, 2.2, 0.3],
    hints: ['The arm counts.', 'Only on its beat.', 'REVERSE it on the turn.'],
  },
  // the chain, undone the way the hospital's lock taught: last fitted, first out
  { id: 'finalSeals', kind: 'lock', at: 'finalSeals', label: 'THE FINAL SEALS', weight: 1, grain: 'metal', bolts: ['RIVER', 'WALL', 'GATE', 'MACHINE'], aim: [0, 1.4, 0.3],
    hints: ['Only the last seal fitted comes out.', 'The chain, backwards.', 'MACHINE, GATE, WALL, RIVER.'] },
  // a record shows its making: the two logs, one second apart
  {
    id: 'twoLogs', kind: 'recording', at: 'evidenceTable', label: 'THE TWO LOGS', weight: 0.5, grain: 'pen', aim: [0, 1.1, 0.4],
    clip: { who: 'NONE', text: 'Two logs, one second apart. RING: 16:02:00. CONSOLE BUTTON: 16:02:01.' },
    hints: ['Two logs.', 'A record runs forwards once.', 'REVERSE the logs.'],
  },
  // R6: a memory has no making to show
  { id: 'memoryCards', kind: 'refusal', refuse: 'A MEMORY', at: 'memoryCards', label: 'THE MEMORY CARDS', line: 'A memory. It has no making to show me.', aim: [0, 1.1, 0.4] },
];

export const M22 = {
  key: 'm22', n: 22, chapter: 'act4', name: 'THE FIRST SECOND', title: 'The original activation point', subtitle: 'Previous locations appear around you.',
  logline: 'Five places round one room, at the first second.',
  place: 'firstsecond', sectors: 1, states: ['PRESENT', 'PAST', 'FUTURE'], drones: [0, 0, 0], unstable: true, ambience: null, ambient: 'liminal', // (no watchers: §6.4)
  motto: 'YOU WERE TRYING TO STOP ME FROM BECOMING YOU', gate: 'THE FINAL CHAMBER', crew: C('witness'),
  named: ['witness', 'elder', 'clockmaker', 'odile', 'orren'], // (their echoes are quoted here: no crowd wears their faces)
  minutes: { main: 30, optional: 8 }, autoExit: 1.2, gateAfter: true,
  processes: M22_PROCESSES,
  fragSpots: [['roundhouse1'], ['wedgeHospital'], ['wedgeStation']],
  fragments: [[
    'A roundhouse door with your mark cut over it, still wet.',
    'A ward door with four bolts, all of them drawn.',
    'The 41\'s canopy in rain, at eight fourteen, forever.',
  ]],
  beats: [{ kind: 'custom', goal: 'Open the final chamber.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    shots: [{ cam: 'wedgeStation', look: 'paMic', t: 9 }],
    cast: [{ crew: 'witness', at: 'paMic', off: [0, -1, 0.7], turn: Math.PI }],
    lines: [N('The station at 8:14, replayed in a wedge of rain. A man at the public-address microphone.'), REV(FX(L('WITNESS', 'Kai Varen. Do not build the machine.'), 'pa'))],
  },
  quarters: [
    {
      name: 'THE VILLAGE\'S CHAIN',
      threads: [
        { id: 'chain', kind: 'playback', at: 'chainWall', prompt: 'THE CHAIN WALL', kit: 'chainWall', offset: [0, 1.4, 1.2],
          entries: [{ label: 'The river is diverted.' }, { label: 'The wall holds.' }, { label: 'The gate releases.' }, { label: 'The machine is found.' }],
          question: [N('The chain wall: four carvings, out of order. A river, a wall, a gate, a machine.')], wrong: [K('Not yet. What made that happen?')],
          echoes: [{ crew: 'elder', offset: [-2, 0, 2.4] }],
          lines: [N('The river was diverted. The wall held. The gate released. The machine was found.'), SAYS('THE ELDER', 'ELDER', 'The one with no dust taught the river to stay.'),
            REV(K('The machine was found because the river was diverted. Every cause was me.')), N('Cut under the chain, newer: HE TOLD NIKO THE RIVER WOULD COME BACK.', 'niko_told')],
          set: { ev_chain: true }, log: 'The chain: river, wall, gate, machine. Every cause was me.',
          goal: 'Infer the causal chain from the ancient village.', because: 'The wall shows it out of order.', hints: M22_HINTS.chain, minutes: 5 },
      ],
    },
    {
      name: 'THE CLOCKMAKER\'S PATTERN & THE HOSPITAL\'S LOCK',
      threads: [
        { id: 'arm', kind: 'invert', target: 'clockArm', at: 'clockArm', after: ['chain'], set: { ev_arm_count: true },
          say: [K('On the beat, it turns back. Its count is the activation sequence.')],
          goal: 'Read the repeating pattern from the clockmaker\'s house.', because: 'The arm counts the way it did in his light well.', hints: M22_HINTS.arm, minutes: 5 },
        { id: 'odile', kind: 'talk', npc: 'odile', at: 'hospitalLock', after: ['arm'], goal: 'Odile\'s echo, at the hospital\'s lock.', because: 'She knew how the ward door undid itself.', done: 'm22_odile', hints: M22_HINTS.odile, minutes: 2 },
      ],
    },
    {
      name: 'THE FINAL CHAMBER',
      threads: [
        { id: 'seals', kind: 'invert', target: 'finalSeals', at: 'finalSeals', after: ['odile'], goal: 'Undo the final seals.', because: 'The chain, fitted as seals, river first.', hints: M22_HINTS.seals, minutes: 3 },
        { id: 'table', kind: 'clue', need: 2, of: ['ev_iven_statement', 'ev_memory_card'], after: ['seals'],
          spots: [
            { id: 'ivenStatement', scene: 'ivenStatement', at: 'evidenceTable', prompt: 'A STATEMENT', offset: [0, 1.0, 0.8], r: 2.2, kit: 'logbook' },
            { id: 'memoryCard', scene: 'memoryCard', at: 'memoryCards', prompt: 'A MUSEUM CARD', offset: [0, 1.0, 0.8], r: 2.2, kit: 'museumLabel' },
          ],
          goal: 'The evidence table.', because: 'Iven\'s word, a museum\'s memory, two sealed logs.', hints: M22_HINTS.table, minutes: 2 },
        { id: 'logs', kind: 'invert', target: 'twoLogs', at: 'evidenceTable', after: ['table'], goal: 'The two sealed logs.', because: 'In the archive I would not read them.', hints: M22_HINTS.logs, minutes: 1 },
        { id: 'evidence', kind: 'deduce', deduction: 'evidence', at: 'evidenceTable', after: ['logs'], spotOpts: { offset: [-1.6, 1.2, 0.8], r: 3, kit: 'evidenceTable' },
          goal: 'Distinguish reliable evidence from subjective memory.', because: 'Which of them keeps the second?', hints: M22_HINTS.evidence, minutes: 3 },
        { id: 'reveal', kind: 'talk', npc: 'witness22', at: 'twinChamber', after: ['evidence'], goal: 'The Witness, in the twin chamber.', because: 'A second early.', done: 'm22_reveal', hints: M22_HINTS.reveal, minutes: 3 },
        { id: 'chamber', kind: 'scene', scene: 'chamber', at: 'finalSeals', after: ['reveal'], spot: { prompt: 'THE FINAL CHAMBER', offset: [0, 1.2, 1.6], r: 3, kit: 'sealPlinth' },
          goal: 'Open the Chronolith\'s final chamber.', because: 'The seals are out.', done: 'm22_chamber', hints: M22_HINTS.chamber, minutes: 3 },
      ],
      sides: [
        { id: 'record', name: 'THE UNWRITTEN RECORD', giver: 'orren', case: 'c_record', done: 'ev_unwritten_record', minutes: 8,
          threads: [
            { id: 'courtGo', kind: 'go', at: 'wedgeCourt', r: 6, goal: 'The court wedge.', because: 'Orren is sweeping a Helix court in the mist.', hints: M22_HINTS.orren, minutes: 2 },
            { id: 'orrenTalk', kind: 'talk', npc: 'orren22', at: 'orren', after: ['courtGo'], goal: 'Orren.', because: 'He keeps a record nobody wrote.', done: 'm22_orren', hints: M22_HINTS.orren, minutes: 3 },
            { id: 'recordRead', kind: 'scene', scene: 'record', at: 'orren', after: ['orrenTalk'], spot: { prompt: 'THE UNWRITTEN RECORD', offset: [-1.8, 1.1, 1.2], r: 2.6, kit: 'quoteStone' },
              goal: 'The unwritten record.', because: 'What each ending costs.', done: 'ev_unwritten_record', hints: M22_HINTS.record, minutes: 3 },
          ] },
      ],
    },
  ],
  talks: {
    clockmaker: [{ when: 'true', lines: [CREW('Count it, child. Three, and the turn. Always on the turn.')] }],
    odile: [
      { when: '!m22_odile', lines: [CREW('Last in, first out. Same as my ward door. Whatever was fitted first comes out last.'), K('The river went in first.')], set: { m22_odile: true } },
      { when: 'm22_odile', lines: [CREW('Last in, first out.')] },
    ],
    witness22: [
      {
        when: '!m22_reveal',
        lines: [K('You were trying to stop me from becoming you.'), L('WITNESS', 'I was trying to find a version of me that didn\'t have to.'),
          K('Every warning. Every voice in every speaker. That\'s what sent me in.'),
          REV(L('WITNESS', 'I know. I have known for a hundred and seventeen worlds. I kept thinking the next one would listen.')), K('I\'ll sign for it.')],
        set: { m22_reveal: true },
      },
      { when: 'm22_reveal', lines: [L('WITNESS', 'The chamber, Kai.')] },
    ],
    orren22: [
      { when: '!m22_orren', lines: [L('ORREN', 'I keep the record of what nobody chose. Do you want the costs before you choose?'), K('Yes.')], set: { m22_orren: true } },
      { when: 'm22_orren', lines: [L('ORREN', 'The record is beside me.')] },
    ],
  },
  scenes: {
    ivenStatement: { lines: [N('A typed statement. IVEN MARR: THE RING TURNED BEFORE THE BUTTON. I SAID A SECOND LATE, BECAUSE LATE WAS MY FAULT.')], set: { ev_iven_statement: true } },
    memoryCard: { lines: [N('A card from the museum: MEMORY THREE. NOBODY AT THE CONSOLE. Filed under SUBJECTIVE.')], set: { ev_memory_card: true } },
    chamber: { lines: [N('The final chamber opens. No door, and a door. Beyond it, the original Chronolith, and morning.')], set: { m22_chamber: true } },
    record: {
      lines: [L('ORREN', 'If the ring is destroyed, the fractures close, and Mira is released.'), L('ORREN', 'If the years are split, she lives, and the boundaries are fought over.'),
        L('ORREN', 'If someone becomes the anchor, the anchor is a person.'), K('And the person?'), L('ORREN', 'Is not in any record.')],
      set: { ev_unwritten_record: true }, log: 'Orren\'s record: A releases Mira. In B the boundaries are fought over. In C the anchor is a person.',
    },
  },
  deductions: {
    evidence: {
      question: [K('Iven\'s statement. A museum\'s memory. Two logs. Which of them is evidence?')],
      answers: [
        { intent: 'challenge', label: 'I pressed it, and it turned.', lines: [K('That is what I remember. Memories don\'t keep seconds.')] },
        { intent: 'investigate', label: 'It turned before I pressed it.', correct: true, needs: 'inv_twoLogs_done && ev_iven_statement && ev_memory_card',
          lines: [K('It turned before I pressed it. I was a second late.'), REV(L('WITNESS', '…No. I was a second early.'))] },
        { intent: 'withdraw', label: 'Nobody turned it.', lines: [K('Memory three says nobody. A log says somebody, one second early.')] },
      ],
      unproven: [K('Not yet. The logs, not my memory of them.')],
      set: { ev_second_early: true }, reveal: true, log: 'The ring turned at 16:02:00. The button at 16:02:01. He turned it a second early.',
    },
  },
  overlay(P) {
    person(P, { id: 'clockmaker', crew: 'clockmaker', at: 'clockArm', off: [2.2, 0, 1.2], turn: Math.PI, hologram: true, prompt: 'LISTEN' });
    person(P, { id: 'odile', crew: 'odile', at: 'hospitalLock', off: [2.2, 0, 1.2], turn: Math.PI, hologram: true, prompt: 'LISTEN' });
    person(P, { id: 'witness22', crew: 'witness', at: 'twinChamber', off: [1.6, 0, 1.2], turn: Math.PI, prompt: 'TALK TO HIM', when: 't_m22_evidence' });
    person(P, { id: 'orren22', crew: 'orren', at: 'orren', off: [0, 0, 0], turn: 0, prompt: 'TALK TO ORREN' });
  },
  hook: {
    cue: 'cliff', minutes: 2,
    lines: [L('WITNESS', 'Then help me hold it open. Once. For her.'), K('Not for her. For her to choose.')],
  },
  done: 'm22_chamber',
};
M22.outro = M22.hook.lines;

export const ACT4 = [M19, M20, M21, M22];
