// THE LAST VERSION OF EARTH: the Finale, AFTERZERO (OVERHAUL.md §5 M23; about 50 minutes), and the three endings.
//
// One road from the 41's shelter to the original Chronolith, held open through the storm by two men with the same
// scar: the Witness holds the street that fell while Kai crosses by switching years; then they swap, and Kai holds
// the settlement's bridge while the Witness crosses (the only time two holds happen). The people Kai's choices
// changed stand along it. At the ring, Mira chooses first; then Kai chooses what to preserve and what to release.
// The ending sequence (Runtime.ending, voicelines.endingLines): the bible's text, what the ending adds, Kai's quote,
// one epilogue line per fact the player set (ledger.EPILOGUE), four clock ticks and the voice in every speaker.
import { intent } from './npcs.js';
import { NO_MODEL } from './processes.js';
import { L, N, K, REV, FX, C, SAYS, person } from './act3.js';

// after the epilogue: four clock ticks, then the voice in every speaker (voicelines.js re-exports it)
export const POSTCREDIT = [{ who: 'VOICE', text: 'Version one hundred and eighteen.', voice: { fx: 'pa' } }];

const M23_HINTS = {
  streets: ['The opening streets.', 'Watchers on the avenue, unless Jun\'s passengers cleared it.', 'Get to the fallen street unseen.'],
  street: ['The street has fallen in.', 'He holds the far half. The near half stood in 2026.', 'Switch to 2026, cross, and step onto what he holds.'],
  settlement: ['The settlement, again.', 'The telling-stone. Tala, if the river was taught to stay.', 'Look.'],
  bridge: ['The stream. The bridge has fallen.', 'My turn to hold. He crosses first.', 'REVERSE the bridge, and cross after him.'],
  lab: ['The Helix lab.', 'Rook\'s transmission, and Iven.', 'Both.'],
  city: ['2196.', 'The memorial, Sera, Anja.', 'Two of them.'],
  mira: ['Mira.', 'At the original Chronolith.', 'Ask her.'],
  choose: ['The ring.', 'Destroy it, split the years, or become the anchor.', 'Choose.'],
  gallery: ['The people my choices changed.', 'Along the road.', 'Visit three of them.'],
};

const M23_PROCESSES = [
  // the street that fell: the Witness holds its far half (his REVERSE, scripted); Kai may hold it himself as well
  // (it answers Kai only once the Witness has it: before, it is his to hold, and he takes it as Kai reaches the pit)
  {
    id: 'streetCollapse', kind: 'collapse', at: 'streetCollapse', label: 'THE STREET', weight: 1.5, grain: 'stone', mat: 'concrete', arm: 't_m23_streets',
    span: { from: [0, 0, 0], to: [0, 0, 8.4], width: 12, pieces: 6, thick: 0.6, floor: -6 }, aim: [0, 0.6, 4],
    hints: ['The street fell.', 'Fallen things rise.', 'REVERSE the street, or let him hold it.'],
  },
  // the settlement's timber bridge, in the stream: Kai holds it while the Witness crosses
  {
    id: 'settlementBridge', kind: 'collapse', at: 'settlementBridge', label: 'THE BRIDGE', weight: 1, grain: 'wood', mat: 'wood',
    span: { from: [0, 0, -5.6], to: [0, 0, 5.6], width: 4, pieces: 6, thick: 0.4, floor: -2.6 }, aim: [0, 0.4, 0],
    hints: ['The bridge fell into the stream.', 'Fallen things rise.', 'REVERSE the bridge.'],
  },
];
// (the road is every year at once: the people on it stand in all three, never as echoes)
const EVERY = ['PRESENT', 'PAST', 'FUTURE'];
const M23_SAY = {
  across: [N('The Witness crosses while it holds. He does not look down.')],
};
// the two holds: his, while the street is the way; then Kai's, which lets him across
function m23Step(rt) {
  const g = rt.g, f = g.facts, procs = rt.inv?.procs || [];
  const street = procs.find((x) => x.rec.id === 'streetCollapse');
  if (street) {
    const holding = f.get('t_m23_streets') && !f.get('t_m23_street');
    if (holding && street.heldBy !== 'witness') {
      street.heldBy = 'witness';
      street.reverse();
      rt.inv.snd?.start?.(street.rec.grain);
    } else if (!holding && street.heldBy === 'witness' && f.get('t_m23_street')) {
      street.heldBy = null;
      street.release();
    }
  }
  // (he crosses only if he came this far: he held the street that fell, t_m23_street)
  if (f.get('rev_settlementBridge') && f.get('t_m23_street') && f.get('t_m23_settlement') && !f.get('m23_witness_across')) {
    f.set('m23_witness_across', true);
    g.hud.say(M23_SAY.across, f);
  }
}

export const M23 = {
  key: 'm23', n: 23, chapter: 'finale', name: 'AFTERZERO', title: 'Past, present, future and inversion collide', subtitle: 'Fragments of the opening streets, the settlement, the laboratory and the future city.',
  logline: 'One road through every year, held open by two men with the same scar.',
  place: 'afterzero', sectors: 1, states: ['PRESENT', 'PAST', 'FUTURE'], drones: [2, 0, 0, 1, 0], unstable: true, ambience: 'rain', ambient: 'rain',
  named: ['witness', 'mira', 'jun', 'tala', 'sera', 'anja', 'iven', 'clockmaker', 'odile'],
  motto: 'A SECOND THAT BELONGS TO NOBODY', gate: 'THE ORIGINAL CHRONOLITH', crew: C('mira'),
  minutes: { main: 40, optional: 10 }, gateAfter: true,
  processes: M23_PROCESSES,
  zones: [{ at: 'settlementBridge', box: [-8, -1, 7, 8, 4, 14], set: { m23_across: true } }],
  watch: [[[[-8, 152], [8, 142]], [[-10, 160], [-2, 146]]], [], [], [[[-3, -36], [-3, -96]]], []],
  fragSpots: [['busField'], ['labGate'], ['hillFoot']],
  fragments: [[
    'The 41, standing in a field, its doors open. The seats are dry.',
    'A Helix door with no lock, in a wall that is not finished.',
    'The first light of a sunrise, in the Notch, for the first time.',
  ]],
  beats: [{ kind: 'custom', goal: 'Reach Mira at the original Chronolith.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    shots: [{ cam: 'platform41', look: 'streetCollapse', t: 9 }],
    lines: [N('Rain City, the first fire, the lab and 2196, all at once. The 41 arrives on time.'), L('JUN', 'On time. I don\'t know what to do with myself.', 'jun_line || jun_evidence'),
      N('The platform is empty. Somebody has turned off the announcement.', '!jun_line && !jun_evidence')],
  },
  quarters: [
    {
      name: 'THE OPENING STREETS',
      threads: [
        // (the line across the whole avenue before the fallen street, pavements and all: whichever way Kai comes, the
        // Witness takes the street as he gets there; the strips beside the pit are closed by fallen facades)
        { id: 'streets', kind: 'stealth', at: [0, 0, 141, 0], box: [-50, 137, 50, 147], goal: 'Cross the opening streets.', because: 'The avenue from the first morning, and the watchers on it.',
          say: [L('WITNESS', 'I will hold the route. Go to her.'), K('Why now?'), REV(L('WITNESS', 'Because this is the version where I ask.'))], hints: M23_HINTS.streets, minutes: 6 },
        { id: 'street', kind: 'go', at: [0, 0, 114, 0], box: [-50, 104, 50, 119], after: ['streets'], goal: 'Over the street that fell.', because: 'He is holding it. In his ring, my colour.',
          say: [N('Behind Kai, the street goes down into the dark without a sound.')], hints: M23_HINTS.street, minutes: 4 },
      ],
      sides: [
        { id: 'gallery', name: 'THE CONSEQUENCES GALLERY', done: 'ev_gallery', minutes: 10,
          threads: [{ id: 'galleryVisit', kind: 'clue', need: 3, of: ['ev_gal_jun', 'ev_gal_ezra', 'ev_gal_listeners', 'ev_gal_prisoners', 'ev_gal_odile'], set: { ev_gallery: true },
            spots: [
              { id: 'galJun', scene: 'galJun', at: 'junPassengers', prompt: 'JUN\'S PASSENGERS', offset: [1.6, 1.2, 0], r: 2.6, model: NO_MODEL },
              { id: 'galListeners', scene: 'galListeners', at: 'busField', prompt: 'THE 41 IN THE FIELD', offset: [0, 1.2, 2.4], r: 2.6, model: NO_MODEL },
              { id: 'galEzra', scene: 'galEzra', at: 'tellingStone', prompt: 'A CLOCK ON A POST', offset: [0, 1.2, 4], r: 2.4, kit: 'clockPost' },
              { id: 'galPrisoners', scene: 'galPrisoners', at: 'labDoor', prompt: 'THE LAB STEPS', offset: [3, 1.0, 1], r: 2.6, model: NO_MODEL },
              { id: 'galOdile', scene: 'galOdile', at: 'labGate', prompt: 'A BENCH', offset: [3, 1.0, 1], r: 2.4, model: NO_MODEL },
            ],
            goal: 'Visit the people your choices changed.', because: 'They stand along the road.', hints: M23_HINTS.gallery, minutes: 10 }] },
      ],
    },
    {
      name: 'THE SETTLEMENT, AGAIN',
      threads: [
        { id: 'settlement', kind: 'clue', need: 1, of: ['ev_telling_line', 'ev_tala23'], after: ['street'],
          spots: [{ id: 'tellingLine', scene: 'tellingLine', at: 'tellingStone', prompt: 'THE TELLING-STONE', offset: [0, 1.3, 1.4], r: 2.6, model: NO_MODEL }],
          goal: 'The settlement, again.', because: 'Niko\'s stone, with a new line on it.', hints: M23_HINTS.settlement, minutes: 4 },
        { id: 'bridge', kind: 'tasks', of: ['m23_witness_across', 'm23_across'], at: 'settlementBridge', after: ['settlement'],
          say: [REV(L('WITNESS', 'And, Kai. For once, you are on time.'))],
          goal: 'Hold the bridge while he crosses.', because: 'Now we swap.', hints: M23_HINTS.bridge, minutes: 4 },
      ],
    },
    {
      name: 'THE HELIX LAB',
      threads: [
        { id: 'lab', kind: 'clue', need: 2, of: ['ev_rook_last', 'ev_iven_signed'], after: ['bridge'],
          spots: [
            { id: 'rookLast', scene: 'rookLast', at: 'rookTransmission', prompt: 'ROOK\'S TRANSMISSION', offset: [0, 1.4, 0.6], r: 2.4, kit: 'recorder' },
            { id: 'ivenSigned', scene: 'ivenSigned', at: 'ivenStatement', prompt: 'IVEN', offset: [0, 1.2, 1.2], r: 2.6, model: NO_MODEL },
          ],
          goal: 'The Helix laboratory.', because: 'Rook left a last transmission. Iven is waiting.', hints: M23_HINTS.lab, minutes: 4 },
      ],
    },
    {
      name: '2196',
      threads: [
        { id: 'city', kind: 'clue', need: 2, of: ['ev_memorial23', 'ev_sera23', 'ev_anja23'], after: ['lab'],
          spots: [{ id: 'memorial23', scene: 'memorial23', at: 'memorial2196', prompt: 'THE MEMORIAL', offset: [0, 1.2, 1.8], r: 2.6, kit: 'memorialCore' }],
          goal: 'The future city.', because: 'The memorial, Sera, Anja.', hints: M23_HINTS.city, minutes: 5 },
      ],
    },
    {
      name: 'THE ORIGINAL CHRONOLITH',
      threads: [
        { id: 'mira', kind: 'talk', npc: 'mira23', at: 'miraStands', after: ['city'], goal: 'Reach Mira at the original Chronolith.', because: 'She is not waiting. She is choosing.', done: 'm23_asked', hints: M23_HINTS.mira, minutes: 4 },
        { id: 'choose', kind: 'choice', scene: 'ending', at: 'endingChoice', after: ['mira'], spot: { prompt: 'THE ORIGINAL CHRONOLITH', offset: [0, 1.2, 0], r: 3, model: NO_MODEL },
          goal: 'Choose what to preserve and what to release.', because: 'Three things the ring can do, and only one of them.', done: 'ending', hints: M23_HINTS.choose, minutes: 3 },
      ],
    },
  ],
  talks: {
    tala23: [{ when: 'true', lines: [L('TALA', 'The river knows the way now. So did you.')], set: { ev_tala23: true } }],
    sera23: [
      {
        when: '!ev_sera23',
        lines: [L('SERA', 'You came back.', 'trust_sera == "accept"'), L('SERA', 'You said it wasn\'t you. Then it was.', 'trust_sera == "deny"'), L('SERA', 'Kai.', '!(trust_sera == "accept") && !(trust_sera == "deny")'),
          L('SERA', 'The garden has water. Go on. She\'s on the hill.', 'garden_restored'), L('SERA', 'Go on. She\'s on the hill.', '!garden_restored')],
        set: { ev_sera23: true },
      },
      { when: 'ev_sera23', lines: [L('SERA', 'The hill, Kai.')] },
    ],
    anja23: [
      {
        when: '!ev_anja23',
        lines: [L('ANJA', 'Tomorrow came. They hated us for a week. Then they planted things.', 'city_freed'), L('ANJA', 'The lock holds. I check it at noon, and now I remember why.', 'city_stabilized'), L('ANJA', 'Go and count your second.')],
        set: { ev_anja23: true },
      },
      { when: 'ev_anja23', lines: [L('ANJA', 'Count it.')] },
    ],
    mira23: [
      {
        when: '!m23_asked',
        lines: [L('MIRA', 'Ask me.'), K('Ask you what?'), L('MIRA', 'What I want. Nobody has. Not in a hundred and seventeen worlds.'), K('What do you want?'),
          REV(L('MIRA', 'A second that is mine. Not saved. Not fixed. Mine. Count it with me.')),
          K('I thought the answer was to find the right world.'), L('MIRA', 'And now?'), K('Now I think we kept asking the world to pay for our answer.'),
          // (the letter Kai kept in Mission 17: she knows)
          L('MIRA', 'You kept my letter. Did you ever read it?', 'letter == "kept"'), K('No. It was yours to send.', 'letter == "kept"'),
          L('MIRA', 'Then I will. Afterwards.', 'letter == "kept"')],
        set: { m23_asked: true },
      },
      { when: 'm23_asked', lines: [L('MIRA', 'Count it with me, Kai.')] },
    ],
  },
  scenes: {
    tellingLine: { lines: [N('The telling-stone has a new line, cut in Niko\'s hand: HE CAME BACK.')], set: { ev_telling_line: true } },
    rookLast: {
      lines: [FX(L('ROOK', 'Kai. I have the lab\'s power. It stays on until you\'re through. Go.', 'rook_fate == "persuade"'), 'radio'),
        FX(L('ROOK', 'This is Elias Rook, on a borrowed radio. They let me say one thing. I\'m sorry.', 'rook_fate == "expose"'), 'radio'),
        FX(L('ROOK', 'For the record. The chamber is yours, Kai. It always was.', '!(rook_fate == "persuade") && !(rook_fate == "expose")'), 'recording')],
      set: { ev_rook_last: true },
    },
    ivenSigned: { lines: [L('IVEN', 'Statement of Iven Marr. I signed for it.')], set: { ev_iven_signed: true } },
    memorial23: { lines: [N('The memorial. KAI VAREN.'), N('Under it, newly cut: AND HE CAME BACK.', 'trust_sera == "accept"')], set: { ev_memorial23: true } },
    galJun: {
      lines: [L('JUN', 'They all got off. Every one of them.', 'jun_line'), L('JUN', 'The evidence went in. Somebody read it.', 'jun_evidence'), N('Jun\'s booth, empty. The 41 runs without him.', '!jun_line && !jun_evidence')],
      set: { ev_gal_jun: true },
    },
    galListeners: {
      lines: [SAYS('ONE WHO LISTENED', 'CROWD_F2', 'You said get out of the tower. We did. We never said thank you.', 'warned_evacuees'), N('A bus in a field. Nobody waiting for it.', '!warned_evacuees')],
      set: { ev_gal_listeners: true },
    },
    galEzra: {
      lines: [SAYS('EZRA MOLL', 'CLOCKMAKER', 'Wednesday. I have had nine of them now.', 'ezra_debt == "release"'), SAYS('EZRA MOLL', 'CLOCKMAKER', 'The clock keeps its own time. So do I.', 'ezra_debt == "finish"'),
        N('A clock on a post, ticking, with no maker\'s mark.', '!ezra_debt')],
      set: { ev_gal_ezra: true },
    },
    galPrisoners: {
      lines: [N('Twelve people from the dam\'s loops, on the lab steps, arguing about breakfast.', 'prisoners_freed || m21_cells'), N('Twelve empty chairs on the lab steps.', '!prisoners_freed && !m21_cells')],
      set: { ev_gal_prisoners: true },
    },
    galOdile: {
      lines: [SAYS('NURSE ODILE', 'ODILE', 'My shift finished. Thirty-two went home.', 'odile_released'), N('A nurse\'s watch on a bench, still running.', '!odile_released')],
      set: { ev_gal_odile: true },
    },
    ending: {
      lines: [N('Three things the ring can do, and only one of them.'), N('Orren\'s record: released. Fought over. A person.', 'ev_unwritten_record')],
      choices: [
        intent('challenge', 'Destroy the Chronolith.', { set: { ending: 'A' }, ending: 'A' }),
        intent('investigate', 'Separate the states into independent branches.', { set: { ending: 'B' }, ending: 'B' }),
        intent('comfort', 'Become the anchor. Absorb the contradictions.', { set: { ending: 'C' }, ending: 'C' }),
      ],
    },
  },
  step: m23Step,
  spoken: M23_SAY, // (what its code says: the Witness crossing)
  // quest chain A's consequence: the passengers Kai got off the 41 clear the opening streets of watchers
  adjust(level, rt) {
    if (!rt.g.facts.get('jun_line')) return;
    level.sentinels = (level.sentinels || []).filter((s) => !/_q0s\d$/.test(s.id));
  },
  overlay(P) {
    person(P, { id: 'jun23', crew: 'jun', at: 'platform41', off: [-2, 0, 1], turn: Math.PI / 2, silent: true, when: 'jun_line || jun_evidence', temporal: EVERY });
    person(P, { id: 'm23_passenger', crew: 'm23_passenger', first: 'A passenger', seed: 2301, ambient: true, at: 'junPassengers', off: [0, 0, 2], turn: Math.PI / 2, silent: true, when: 'jun_line' });
    person(P, { id: 'witness_street', crew: 'witness', at: 'streetCollapse', off: [5, 0, 13], turn: Math.PI, silent: true, when: 't_m23_streets && !t_m23_street' });
    person(P, { id: 'witness_bridge', crew: 'witness', at: 'settlementBridge', off: [2.6, 0, -8], turn: 0, silent: true, when: 't_m23_street && !m23_witness_across' });
    person(P, { id: 'witness_far', crew: 'witness', at: 'settlementBridge', off: [2.6, 0, 8.4], turn: Math.PI, silent: true, when: 'm23_witness_across && !t_m23_lab' });
    person(P, { id: 'tala23', crew: 'tala', at: 'tala', off: [0, 0, 1.2], turn: Math.PI, prompt: 'TALK TO TALA', when: 'water_route', temporal: EVERY });
    person(P, { id: 'ezra23', crew: 'clockmaker', at: 'tellingStone', off: [1.6, 0, 4], turn: Math.PI, silent: true, when: 'ezra_debt' });
    person(P, { id: 'm23_listener', crew: 'm23_listener', first: 'One who listened', seed: 2302, ambient: true, at: 'busField', off: [-1.6, 0, 2], turn: Math.PI, silent: true, when: 'warned_evacuees' });
    person(P, { id: 'odile23', crew: 'odile', at: 'labGate', off: [3, 0, 2], turn: Math.PI, silent: true, when: 'odile_released' });
    person(P, { id: 'iven23', crew: 'iven', at: 'ivenStatement', off: [0, 0, 1.6], turn: Math.PI, silent: true, temporal: EVERY });
    person(P, { id: 'sera23', crew: 'sera', at: 'seraGarden', off: [0, 0, 1.6], turn: Math.PI, prompt: 'TALK TO SERA', temporal: EVERY });
    person(P, { id: 'anja23', crew: 'anja', at: 'anja', off: [2.4, 0, 0], turn: -Math.PI / 2, prompt: 'TALK TO ANJA', temporal: EVERY });
    person(P, { id: 'mira23', crew: 'mira', at: 'miraStands', off: [0, 0, 0], turn: 0, prompt: 'TALK TO MIRA', when: 't_m23_city' });
    // the endings' people (Runtime.ending stages them; Kai himself is not on screen): A, Kai under the 41's board; B,
    // Sera at the seam where one world ends, and someone on the other side; C, Mira at a window box in Rain City
    person(P, { id: 'kai_end', crew: 'kai', at: 'board41', silent: true, when: 'ending == "A"', temporal: EVERY });
    person(P, { id: 'sera_end', crew: 'sera', at: 'seam41', off: [0, 0, -5], silent: true, when: 'ending == "B"', temporal: EVERY });
    person(P, { id: 'm23_guard', crew: 'm23_guard', first: 'Someone', seed: 2303, ambient: true, at: 'seam41', off: [0, 0, 4], turn: Math.PI, silent: true, when: 'ending == "B"', temporal: EVERY });
    person(P, { id: 'mira_end', crew: 'mira', at: 'windowBox', silent: true, when: 'ending == "C"', temporal: EVERY });
  },
  // (the Finale has no hook: the ending sequence is Runtime.ending's; the voice in every speaker closes it)
  hook: { cue: 'postcredit', minutes: 5, lines: POSTCREDIT },
  done: 'ending',
};
M23.outro = M23.hook.lines;

export const FINALE = [M23];

// the endings: the bible's text (two paragraphs: what happens, and Kai's quote), and what each ending adds
// (§5 M23 "Ending additions": after the bible's text, before its quote)
export const ENDINGS = {
  A: {
    title: 'THE FIXED WORLD', text: ['Kai destroys the Chronolith. Temporal fractures close and history stabilizes, but Mira\'s reconstructed existence cannot survive.', 'For the first time, tomorrow belonged to tomorrow.'],
    after: [N('Rain City. The 41 is late.'), N('Kai Varen looks up at the board, and smiles at it.')],
  },
  B: {
    title: 'THE INFINITE WAR', text: ['Kai separates temporal states into independent branches. Mira survives, but civilizations begin fighting over the boundaries between timelines.', 'We had saved every possible tomorrow. None of them agreed on the future.'],
    after: [N('At the line where one world ends and the next begins, Sera Voss stands guard. On the other side, someone stands guard back.')],
  },
  C: {
    title: 'AFTERZERO', text: ['Kai becomes the anchor that absorbs contradictions. Mira wakes in a world where Kai was never born, with only a faint memory of a voice urging her to live.', 'I finally found a second that belongs to nobody.'],
    after: [N('Rain City, a Tuesday. The 41 is late.'), N('A woman plants something in a window box and hums three notes: up, up, and then down.'), { who: 'KAI', text: 'Live.', voice: { fx: 'echo' } }],
    // (the epilogue's lines come from the worlds Kai passed through, not from hers, where he was never born)
    frame: [N('In the worlds he passed through, what he did stayed done.')],
  },
};

// the endings, staged (Runtime.ending): one shot for the bible's text, one for each line the ending adds, and one for
// Kai's quote and the epilogue; Kai himself is never on screen (A has him under the 41's board, in a body of his own)
const RING = { cam: [9, 9.5, -128], to: [5, 8, -134], look: 'originalRing' };
const STOP = { cam: [1, 3.2, 151], to: [-1.5, 2.9, 155], look: [-12.2, 2.9, 163.4] }; // (the 41's sign over the shelter)
export const ENDING_SHOTS = {
  A: [RING, STOP, { cam: [-11.6, 1.75, 162.2], to: [-11.4, 1.7, 162.6], look: [-9.4, 1.62, 163.4] }, { cam: [0, 5, 176], to: [0, 18, 160], look: [0, 3, 110] }],
  B: [RING, { cam: [7, 2.4, 108.5], to: [8.5, 2.9, 108.5], look: [0, 1.4, 108.5] }, { cam: [0, 6, 122], to: [0, 22, 100], look: [0, 0, 60] }],
  C: [{ cam: [8, 6.5, -132], to: [4, 6, -137], look: 'originalRing' }, STOP, { cam: [-11.4, 1.75, 174.5], to: [-11.7, 1.7, 173], look: [-13.6, 1.3, 169.5] },
    { cam: [-12, 1.6, 171.6], to: [-12.2, 1.6, 171.2], look: [-13.3, 1.5, 169.5] }, { cam: [-10, 3, 172], to: [0, 20, 160], look: [0, 2, 120] }],
};
