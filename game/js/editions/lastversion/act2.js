// THE LAST VERSION OF EARTH: Act II, THE NINE-MINUTE WAR (OVERHAUL.md §5 M9-M13; about 190 minutes).
//
//   Mission 9   NINE MINUTES TO ZERO        Loop City: Rain City North at 08:05-08:14, looping; the Helix North transmitter
//   Mission 10  ENEMIES WHO REMEMBER        the Continuum's detention block in the dam, a snowy night; Echo Step
//   Mission 11  THE INVERTED HOSPITAL       Rain City General at noon; wards that run backwards; REVERSE is taught
//   Mission 12  THE MAN BEHIND THE GLASS    Helix's north wing at sunset, the 2026 gangway, the 2196 sinkhole
//   Mission 13  THE NINE-MINUTE WAR         the delta port in three years; shells that run back to their own guns
//
// Each mission is one map with soft quarters, threads and side stories (Threads.js), a cold open and a hook (as in
// act1.js). Lines quoted from the bible are verbatim, with the bible's speakers (D16).
import * as THREE from '../../../vendor/three.module.min.js';
import { CAST, intent } from './npcs.js';
import { makeKit } from './places/kits.js';
import { NO_MODEL } from './processes.js';
import { makeScreen, makePhoto, makeLogbook } from './Build.js';

const L = (who, text, when) => (when ? { who, text, when } : { who, text });
const N = (text, when) => L('NONE', text, when);
const K = (text, when) => L('KAI', text, when);
const CREW = (text, when) => L('CREW', text, when); // (said by the person being talked to, in their own voice)
const REV = (l) => ({ ...l, voice: { ...(l.voice || {}), cue: 'reveal' } });
const FX = (l, fx) => ({ ...l, voice: { ...(l.voice || {}), fx } });
const C = (id) => CAST.findIndex((c) => c.id === id);
// a person a scene names, in their own recorded voice
const SAYS = (name, id, text, when) => ({ who: 'CREW', name, color: '#4f6170', voice: { id }, text, ...(when ? { when } : {}) });
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
// the three notes (the Child's song), from a place in the world, at a gain (score.js's motif)
function song(rt, gain = 1, kind = 'child') {
  const s = rt.score;
  if (!s?.ready() || gain <= 0.001) return;
  s.motif(kind, 48, s.a.ctx.currentTime + 0.05, 0.42, s.a.sfx, 0.07 * gain);
}

// =============================================================================================================
// Mission 9: NINE MINUTES TO ZERO
// =============================================================================================================
const M09_HINTS = {
  loop1: ['Wait. Watch.', 'The street resets.', 'Stay on the quay through one reset.'],
  loop2: ['Watch it again.', 'The patrol moves each time.', 'Watch the market through a reset.'],
  clockA: ['The first clock.', 'Under the loggia.', 'Stop the first clock.'],
  order: ['The order board.', 'By the funicular\'s middle station.', 'Read it now, then in 2026.'],
  clockB: ['The second clock.', 'On the patrol route.', 'Stop it unseen.'],
  clockC: ['The third clock.', 'Above the cathedral steps.', 'Stop the third clock.'],
  transmitter: ['The transmitter.', 'On the headland.', 'Cut the carrier.'],
  rhea: ['Someone is counting.', 'The foot of the tower.', 'Find Rhea.'],
  tower: ['Up the tower.', 'Look across the river.', 'Climb to the top.'],
  reset: ['08:14.', 'It is coming.', 'Let it come.'],
  warn: ['People head for the tower.', 'The order is wrong.', 'Quote the cancelled order.'],
  child: ['She does not loop.', 'The loop\'s edge.', 'Hum her song.'],
};
const EVAC = AMB('CROWD_F2');
// each reset moves the patrols (the watchers of quarters 1 and 2: their ids end _q1s0, _q2s0)
// (each round's paths keep to open ground: the square round the loggia, the street east of its houses)
const M09_PATROLS = [
  { q1s0: [[-50, 24], [-12, 24], [-12, 56], [-50, 56]], q2s0: [[32, 30], [66, 30], [66, 54], [32, 54]] },
  { q1s0: [[-54, 22], [-10, 22], [-10, 58], [-54, 58]], q2s0: [[32, 36], [68, 36], [68, 58], [32, 58]] },
  { q1s0: [[-54, 22], [-48, 22], [-48, 58], [-20, 58]], q2s0: [[32, 44], [62, 44]] },
];

export const M09 = {
  key: 'm09', n: 9, chapter: 'act2', name: 'NINE MINUTES TO ZERO', title: 'Loop City', subtitle: 'The city repeats the same nine minutes. Positions change. You do not.',
  logline: 'Rain City North, 08:05 to 08:14, again and again.',
  place: 'northbank', sectors: 1, states: ['PRESENT', 'PAST'], drones: [1, 1, 2, 0, 0], ambience: 'rain', ambient: 'loop',
  labels: { PRESENT: '2049 · 08:05' }, motto: 'YOU HAVE NINE MINUTES', gate: 'THE TOWER', crew: C('engineer'),
  named: ['engineer', 'soldier', 'child'],
  minutes: { main: 33, optional: 8 }, autoExit: 1.2, gateAfter: true,
  // the loop: every ninety seconds the street goes back to 08:05 (the patrols to their next round, the rain upward for a
  // second); it stops when the carrier is cut
  loop: { period: 90, upward: true, until: 'transmitter_cut', variants: M09_PATROLS.map((watch) => ({ watch })) },
  watch: [[[[-20, 79], [40, 79], [40, 86], [-20, 86]]], [M09_PATROLS[0].q1s0], [M09_PATROLS[0].q2s0, [[20, 79], [60, 79]]]], // (the quay's promenade, not its houses)
  fragSpots: [['quayBench', 'loggiaStall'], ['marketFountain', 'midStation']],
  fragments: [[
    'A clock at nine to zero. Then eight. Then nine again.',
    'A patrol schedule, the same route written eleven times.',
    'A note: GO LEFT AT THE CLOCK. LAST TIME RIGHT. DID NOT HELP.',
    'The tower door. A handprint in the dust that is yours, not yet.',
  ]],
  beats: [{ kind: 'custom', goal: 'Break the loop.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    shots: [{ cam: 'quayBench', look: 'marketGate', t: 9 }],
    cast: [{ crew: 'm9_evac', ambient: true, seed: 902, first: 'A woman', at: 'quayBench', off: [1.6, 0, -6], turn: 0.3 }],
    lines: [N('08:05. A woman drops her coffee.'), N('08:05 again. She catches it.'), N('Again. She does not.'), K('It\'s the same morning. It\'s that morning.')],
  },
  quarters: [
    {
      name: 'START',
      threads: [
        { id: 'loop1', kind: 'loop', until: 'transmitter_cut', goal: 'Watch the street through one reset.', because: 'Nine minutes, then everything goes back. Almost everything.', hints: M09_HINTS.loop1, minutes: 4 },
      ],
    },
    {
      name: 'CLOCK A — OBSERVATION',
      threads: [
        { id: 'loop2', kind: 'loop', after: ['loop1'], until: 'transmitter_cut', goal: 'Watch the market\'s patrol through another reset.', because: 'It walked a different round last time.', hints: M09_HINTS.loop2, minutes: 4 },
        { id: 'clockA', kind: 'scene', scene: 'clockA', at: 'clockA', after: ['loop2'], spot: { prompt: 'CLOCK A', offset: [0, 1.4, 0.6], r: 2.8, model: NO_MODEL },
          goal: 'Stop clock A.', because: 'Three clocks hold the loop to the transmitter.', done: 'clk_a', hints: M09_HINTS.clockA, minutes: 3 },
      ],
    },
    {
      name: 'CLOCK B — THE ENEMY ROUTE',
      threads: [
        { id: 'order', kind: 'residue', at: 'orderBoard', after: ['clockA'],
          record: { official: 'EVACUATION ORDER: ALL CIVILIANS TO THE TOWER.', echo: 'Under it: ORDER CANCELLED 08:09. TOWER COMPROMISED. DO NOT GO UP.', hint: 'The loop kept the old order.',
            after: [K('The loop keeps the lie. Every nine minutes they walk up the tower.')], prompt: 'READ THE ORDER BOARD', offset: [0, 1.4, 0.4], model: 'none', log: 'The tower order was cancelled at 08:09. The loop forgot.' },
          goal: 'Read the order board.', because: 'Everyone is walking the same way.', ev: 'order_cancelled', hints: M09_HINTS.order, minutes: 3 },
        { id: 'clockB', kind: 'scene', scene: 'clockB', at: 'clockB', after: ['order'], spot: { prompt: 'CLOCK B', offset: [0, 1.4, 0.6], r: 2.8, model: NO_MODEL },
          goal: 'Stop clock B, on the patrol\'s route.', because: 'They walk past it every forty seconds.', done: 'clk_b', hints: M09_HINTS.clockB, minutes: 2 },
      ],
    },
    {
      name: 'CLOCK C — THE LOOP TRIGGER',
      threads: [
        { id: 'clockC', kind: 'scene', scene: 'clockC', at: 'clockC', after: ['clockB'], spot: { prompt: 'CLOCK C', offset: [0, 1.4, 0.6], r: 2.8, model: NO_MODEL },
          goal: 'Stop clock C, the trigger.', because: 'This one starts the morning again.', done: 'clk_c', hints: M09_HINTS.clockC, minutes: 3 },
      ],
      sides: [
        { id: 'child', name: 'THE CHILD IN THREE PHOTOGRAPHS: THE EDGE', done: 'child_step2', minutes: 2,
          threads: [{ id: 'childSong', kind: 'scene', scene: 'child_song', at: 'loopEdge', spot: { prompt: 'THE GIRL WHO DOES NOT LOOP', offset: [0, 1.2, 1.4], r: 3, model: NO_MODEL, when: '!child_step2' },
            goal: 'A girl at the loop\'s edge does not reset.', because: 'Everyone else goes round.', done: 'child_step2', hints: M09_HINTS.child, minutes: 2 }] },
      ],
    },
    {
      name: 'THE CONTROL TOWER',
      threads: [
        { id: 'transmitter', kind: 'scene', scene: 'transmitter', at: 'transmitter', after: ['clockC'], spot: { prompt: 'THE TRANSMITTER', offset: [0, 1.4, 2.4], r: 3.2, model: NO_MODEL },
          goal: 'Cut the transmitter\'s carrier.', because: 'The three clocks are stopped. Now the loop has only its voice.', done: 'transmitter_cut', hints: M09_HINTS.transmitter, minutes: 4 },
        { id: 'rhea', kind: 'talk', npc: 'engineer', at: 'towerBase', after: ['transmitter'], goal: 'Someone at the tower is counting resets.', because: 'She was on the radio.', done: 'rhea_freed', hints: M09_HINTS.rhea, minutes: 3 },
        { id: 'tower', kind: 'scene', scene: 'tower', at: 'towerTop', after: ['rhea'], spot: { prompt: 'LOOK ACROSS THE RIVER', offset: [0, 1.4, 1.2], r: 3.2, model: NO_MODEL },
          goal: 'Climb the tower. The street runs on to 08:13 now.', because: 'From the top you can see into the chamber.', done: 'ev_ninth_view', hints: M09_HINTS.tower, minutes: 3 },
        { id: 'reset', kind: 'cinema', after: ['tower'], lines: [N('08:14. Light comes off the river like a wave.'), FX(L('WITNESS', 'You are early. You are always early.'), 'radio')], goal: 'The last reset is coming.', because: 'The loop has nothing left to hold it.', hints: M09_HINTS.reset, minutes: 2 },
      ],
      sides: [
        { id: 'warn', name: 'THE EVACUEES', giver: 'm9_evac', done: 'warned_evacuees', minutes: 6,
          threads: [{ id: 'warnTalk', kind: 'talk', npc: 'm9_evac', at: 'headlandStair', goal: 'People are climbing to the tower before 08:12.', because: 'The order sends them there. The order was cancelled.', done: 'warned_evacuees', hints: M09_HINTS.warn, minutes: 6 }] },
      ],
    },
  ],
  talks: {
    engineer: [
      {
        when: '!rhea_freed',
        // (the carrier is cut: the loop lets go of the street with one last jump, and Rhea's leg with it)
        lines: [CREW('You again. You get here earlier every time.'), CREW('My leg is in two loops at once. The street jumps once more when it lets go. Pull then.')],
        choices: [
          intent('comfort', 'Hold on to me.', { lines: [N('The street jumps, one last time. Rhea does not.'), CREW('Thirteen. Somebody counted with me.')], set: { rhea_freed: true }, trust: 1, then: 'lastJump' }),
          intent('investigate', 'How many times?', { lines: [CREW('Twelve. You were here for the last few.', 'loops_m09 <= 3'), CREW('Twelve. You were here for most of them.', 'loops_m09 > 3'),
            N('The street jumps, one last time. Rhea comes with it.')], set: { rhea_freed: true }, then: 'lastJump' }),
        ],
      },
      { when: 'rhea_freed', lines: [CREW('Go up. Look across the river at 08:13.')] },
    ],
    m9_evac: [
      { when: 'warned_evacuees', lines: [EVAC('Down to the quay. We heard you.')] },
      {
        when: 't_m09_order',
        lines: [EVAC('The board says the tower. Everybody to the tower.')],
        choices: [
          intent('challenge', 'Quote the cancelled order.', { say: 'Cancelled at 08:09. Tower compromised. Do not go up.', consequence: true, lines: [EVAC('Then where?'), K('Down. The quay.'), N('They turn. Then the others turn.')], set: { warned_evacuees: true } }),
          intent('withdraw', 'Say nothing.', { lines: [N('They go on up the hill.')] }),
        ],
      },
      { when: 'true', lines: [EVAC('The board says the tower.'), K('They won\'t listen to me. They would listen to the order.')] },
    ],
  },
  scenes: {
    clockA: { lines: [N('Clock A, under the loggia: 08:05, the minute hand shaking.'), K('Wired to the transmitter. Stop it, and the street forgets a little less.')], set: { clk_a: true } },
    clockB: { lines: [N('Clock B. A patrol has walked past it on every loop.')], set: { clk_b: true } },
    clockC: { lines: [N('Clock C, the trigger. Its hands stand at nine to zero.'), K('This one starts it. Every time.')], set: { clk_c: true } },
    transmitter: {
      lines: [N('Under the hum, the carrier: three notes. Up, up, and a stop.'), K('Her song. They built the loop on her song.'), N('Kai pulls the carrier. The hum goes thin.'),
        FX(SAYS('RHEA', 'RHEA', 'Eleven. Twelve. Is anyone counting with me?'), 'radio')],
      set: { transmitter_cut: true }, then: 'carrier', log: 'The transmitter\'s carrier is the three notes. I cut it.',
    },
    tower: {
      lines: [REV(N('Across the river, through the chamber skylight, a man at the console turns the ring. He looks up. He looks at you.')), K('That\'s the ninth minute.'),
        FX(L('WITNESS', 'You have nine minutes.'), 'radio'), K('To do what?'), FX(L('WITNESS', 'To become me.'), 'radio')],
      set: { ev_ninth_view: true }, log: 'From the tower at 08:13: a man at the console, looking back at me.',
    },
    child_song: {
      lines: [L('CHILD', 'You found my photographs.', 'case_c_child'), L('CHILD', 'Everybody here goes round. I don\'t.', '!case_c_child'), N('Kai hums the three notes. Up, up, and a stop.'),
        N('She steps off the edge of the loop, and does not come round again.')],
      set: { child_step2: true }, then: 'childSong',
    },
  },
  fx: {
    // the loop's last jump, as Rhea is pulled out of it: the reset's sound and light, once, with nothing reset
    lastJump(rt) {
      const g = rt.g;
      g.audio.sweep?.(false);
      rt.score?.cue('loopReset');
      if (!g.settings?.comfort) g.hud.flash?.('rgba(200,220,255,0.35)');
    },
    carrier: (rt) => song(rt, 1, 'theme'),
    childSong: (rt) => song(rt, 0.8),
  },
  overlay(P) {
    // the loop decays: every reset burns one more shopfront along the quay (in 2049 only; the street goes back, the soot
    // does not)
    [[-28, -10], [10, 28], [30, 46], [-48, -30]].forEach(([x0, x1], k) => P.W(`loops_m09 >= ${k + 1}`, () => P.E('PRESENT', () => {
      P.vbox([x0 + 1, 0, 61.55, x1 - 1, 4.4, 61.9], 'ash');
      P.vbox([x0 + 3, 4.4, 61.5, x1 - 3, 6.4, 61.85], 'ash');
      P.vbox([x0 + 0.5, 0, 57.5, x1 - 0.5, 0.06, 61.5], 'ashGround');
    })));
    person(P, { id: 'engineer', crew: 'engineer', at: 'towerBase', off: [1.6, 0, 1.4], turn: Math.PI, prompt: 'TALK TO RHEA' });
    person(P, { id: 'brask9', crew: 'soldier', at: 'funicularStation', off: [-2.4, 0, -2], turn: 0.6, silent: true, barks: ['You did that already. No—you\'re about to do it. I hate that I know the difference.'] });
    person(P, { id: 'm9_evac', crew: 'm9_evac', first: 'Evacuee', seed: 901, ambient: true, at: 'headlandStair', off: [2.2, 0, 2.4], turn: Math.PI, when: '!warned_evacuees', prompt: 'TALK TO THE EVACUEES' });
    person(P, { id: 'm9_evac_safe', crew: 'm9_evac', first: 'Evacuee', seed: 901, ambient: true, at: 'ferryQuay', off: [-6, 0, -2], when: 'warned_evacuees', prompt: 'TALK TO THE EVACUEES' });
    person(P, { id: 'child9', crew: 'child', at: 'loopEdge', off: [0, 0, -0.6], turn: Math.PI, hologram: true, silent: true, when: '!child_step2' });
  },
  hook: { cue: 'cliff', minutes: 1, lines: [N('The city resets. Kai does not.'), K('I remember. I remember all of it.'), SAYS('A SOLDIER', 'CROWD_M2', 'That one didn\'t reset.')] },
  done: 't_m09_reset',
};
M09.outro = M09.hook.lines;

// =============================================================================================================
// Mission 10: ENEMIES WHO REMEMBER
// =============================================================================================================
const M10_HINTS = {
  escape: ['Out of the cell.', 'Along the gallery, unseen.', 'Reach the guard post.'],
  sera: ['That guard is watching me.', 'The guard post.', 'Talk to the guard.'],
  power: ['Blind them.', 'Two switches, two years.', 'The 2049 run, then the 2026 run.'],
  projector: ['What did they take from me?', 'The testing chamber.', 'Look at the projector.'],
  cross: ['Troopers in the chamber.', 'A step ahead of myself. They follow the copy.', 'Echo Step, then go for the spillway.'],
  prisoners: ['Twelve people in loops.', 'The loop cells.', 'Decide.'],
  yard: ['Out under the sky.', 'One trooper by the water.', 'Behind him, to Sera\'s skiff.'],
  intake: ['Earlier intakes.', 'The intake desk.', 'Read them.'],
  office: ['The Director\'s office.', 'Up on the crest.', 'Look inside.'],
};

export const M10 = {
  key: 'm10', n: 10, chapter: 'act2', name: 'ENEMIES WHO REMEMBER', title: 'The Continuum\'s detention block', subtitle: 'They believe time must be controlled. Sera helps you out.',
  logline: 'A prison in a dam, on a snowy night.',
  place: 'dam', sectors: 1, states: ['PRESENT', 'PAST'], drones: [2, 2, 2, 1], ambience: 'hum', ambient: 'loop',
  motto: 'TIME MUST BE CONTROLLED', gate: 'THE SPILLWAY', crew: C('sera'),
  named: ['sera', 'dale', 'rook', 'guard'],
  minutes: { main: 31, optional: 6 }, autoExit: 1.2, gateAfter: true,
  fragSpots: [['cellWall', 'floodPole'], ['switch2026', 'crestParapet']],
  fragments: [[
    'Scratched by a cell door: 11, 12, 13. Somebody kept count of the resets.',
    'A flood pole marked to the crest. The dam has never been that full.',
    'A 2026 work order: FIT NEW SWITCHGEAR. NO PRISON ON THE DRAWINGS.',
    'Snow on the parapet, falling up for a second, then down.',
  ]],
  beats: [{ kind: 'custom', goal: 'Get out of the dam.' }],
  // the Director watches the Loop City capture: whoever rook_fate made them
  coldOpen: {
    first: true, minutes: 2, cue: 'card',
    shots: [{ cam: 'directorOffice', look: 'crestYard', t: 10 }],
    lines: [N('A capture feed from Loop City. A man who did not reset.'),
      L('ROOK', 'He didn\'t reset. Every version resets. Bring me the one who doesn\'t.', 'rook_fate == "persuade"'),
      SAYS('THE DIRECTOR', 'PRYCE', 'The director said nobody could keep their memory through a reset. I\'m the director now.', 'rook_fate == "expose"'),
      FX(SAYS('THE DIRECTOR', 'DIRECTOR', 'Hold him.', '!(rook_fate == "persuade") && !(rook_fate == "expose")'), 'radio')],
  },
  quarters: [
    {
      name: 'THE DETENTION BLOCK',
      threads: [
        { id: 'escape', kind: 'stealth', at: 'guardPost', r: 3, goal: 'Out of the cell, along the gallery, unseen.', because: 'They remember my last attempt.', hints: M10_HINTS.escape, minutes: 6 },
        { id: 'sera', kind: 'talk', npc: 'm10_guard', at: 'guardPost', after: ['escape'], goal: 'The guard at the post is watching me.', because: 'She has not raised the alarm.', done: 'sera_met', hints: M10_HINTS.sera, minutes: 3 },
      ],
      sides: [
        { id: 'intake', name: 'THE INTAKE RECORDS', done: 'ev_intakes', minutes: 3,
          threads: [{ id: 'intakeRead', kind: 'scene', scene: 'intake', at: 'intakeRecords', spot: { prompt: 'THE INTAKE RECORDS', offset: [0, 1.1, 0.8], r: 2.6, model: makeLogbook },
            goal: 'They have taken a Varen before.', because: 'The guard said "again".', done: 'ev_intakes', hints: M10_HINTS.intake, minutes: 3 }] },
      ],
    },
    {
      name: 'POWER SYSTEMS',
      threads: [
        { id: 'power', kind: 'tasks', of: ['pw_49', 'pw_26'], after: ['sera'],
          spots: [
            { id: 'sw49', scene: 'sw49', at: 'switch2049', prompt: 'THE 2049 SWITCH', offset: [0, 1.3, 0.8], r: 2.8, model: NO_MODEL },
            { id: 'sw26', scene: 'sw26', at: 'switch2026', prompt: 'THE 2026 SWITCH', offset: [0, 1.3, 0.8], r: 2.8, model: NO_MODEL },
          ],
          goal: 'Cut the power run in 2049 and in 2026.', because: 'Sera says the guards\' lamps are fed through both years.', set: { power_cut: true }, hints: M10_HINTS.power, minutes: 5 },
      ],
      sides: [
        { id: 'office', name: 'THE DIRECTOR\'S OFFICE', done: 'ev_director_office', minutes: 3,
          threads: [{ id: 'officeLook', kind: 'scene', scene: 'office', at: 'directorOffice', spot: { prompt: 'THE DIRECTOR\'S DESK', offset: [0, 1.1, 1.2], r: 2.8, model: NO_MODEL },
            goal: 'The Director\'s office is empty.', because: 'Whoever sits there knows my name.', done: 'ev_director_office', hints: M10_HINTS.office, minutes: 3 }] },
      ],
    },
    {
      name: 'THE TESTING CHAMBER',
      threads: [
        { id: 'projector', kind: 'scene', scene: 'projector', at: 'projector', after: ['power'], spot: { prompt: 'THE CAPTURED WEAPON', offset: [0, 1.2, 1.4], r: 3, model: kit('deviceCase') },
          goal: 'The testing chamber: what they took from me.', because: 'Sera says they keep captured weapons there.', done: 'echo_step', hints: M10_HINTS.projector, minutes: 2 },
        { id: 'prisoners', kind: 'choice', scene: 'prisoners', at: 'loopCells', after: ['projector'], spot: { prompt: 'THE LOOP CELLS', offset: [0, 1.2, 2], r: 3.4, model: NO_MODEL },
          goal: 'Twelve prisoners in unstable loops.', because: 'Four seconds, over and over.', done: 'ev_prisoners', hints: M10_HINTS.prisoners, minutes: 4 },
        // (the chamber has troopers of its own: an Echo Step's afterimage draws them off; the crossing counts once Kai has
        // stepped ahead of himself)
        { id: 'cross', kind: 'stealth', at: 'spillwayTunnel', r: 4, after: ['projector'], trigWhen: 'echo_steps >= 1', goal: 'Echo Step past the chamber\'s troopers to the spillway.', because: 'A step ahead of myself, the watchers follow the copy.', hints: M10_HINTS.cross, minutes: 4 },
      ],
    },
    {
      name: 'THE YARD',
      threads: [
        { id: 'yard', kind: 'stealth', at: 'seraSkiff', r: 4, after: ['cross', 'prisoners'], goal: 'Down the spillway to Sera\'s skiff, past the yard\'s trooper.', because: 'Under the open sky, for the first time tonight.', hints: M10_HINTS.yard, minutes: 4 },
      ],
    },
  ],
  talks: {
    m10_guard: [
      {
        when: '!sera_met',
        lines: [N('The guard lifts her visor.'), L('SERA', 'In my time, your face is on every memorial.'), K('For saving the world?'), L('SERA', 'For ending it.')],
        choices: [
          intent('investigate', 'Then why help me?', { lines: [L('SERA', 'Because the record is incomplete. Cut the power in both years and their lamps go blind.')], set: { sera_met: true }, ev: 'sera_doubt' }),
          intent('challenge', 'I haven\'t ended anything.', { lines: [L('SERA', 'Not yet. Move.')], set: { sera_met: true } }),
          intent('withdraw', 'Get me out first.', { lines: [L('SERA', 'Then move. The switch rooms are on the crown.')], set: { sera_met: true } }),
        ],
      },
      { when: 'sera_met', lines: [L('SERA', 'Two switches. 2049, then 2026. Go.')] },
    ],
  },
  scenes: {
    intake: { lines: [N('Four earlier intakes of VAREN, K. Four photographs of the same face. In the last, his hair is grey.'), K('They have been catching me for years. Some of me.')], set: { ev_intakes: true }, log: 'Four earlier intakes of Varen. One of them grey.' },
    office: {
      lines: [N('A chair facing the capture feed.'), N('On the desk, an old junior programme badge. ROOK, E.', 'rook_fate == "persuade"'), N('On the desk, an officer\'s cap. PRYCE.', 'rook_fate == "expose"'),
        N('On the desk, a recorder, still running.', '!(rook_fate == "persuade") && !(rook_fate == "expose")')],
      set: { ev_director_office: true },
    },
    sw49: { when: '@PRESENT', lines: [N('The 2049 run goes dark. Half the gallery lamps die.')], set: { pw_49: true } },
    sw49_no: { lines: [K('In 2026 this switch is not wired yet.')] },
    sw26: { when: '@PAST', lines: [N('In 2026 the same run feeds the work cabins. Cut here, it never reaches the lamps.')], set: { pw_26: true } },
    sw26_no: { lines: [K('This one runs in 2026.')] },
    projector: {
      lines: [N('The captured weapon: an afterimage projector, still warm.'), N('It throws a copy of Kai a step ahead of him. The copy walks. He follows it.'), REV(K('A step ahead of myself. It costs me.'))],
      set: { echo_step: true, ev_echo_step: true }, log: 'Echo Step: an afterimage a step ahead. The watchers follow it.', then: 'echoUnlock',
    },
    prisoners: {
      lines: [N('Twelve people in loops, the same four seconds over and over. Releasing them ends the loops, and the four seconds they are safe in.'),
        N('Dale is among them.', 'officer_trusted'), N('So is an old man. Elias Rook.', 'rook_fate == "expose"')],
      choices: [
        intent('comfort', 'Release them.', { consequence: true, lines: [N('The cells open. Eleven walk out. One does not get up.')], set: { prisoners_freed: true, echo_step: true }, ev: 'prisoners' }),
        intent('withdraw', 'Leave them stable.', { consequence: true, lines: [N('The loops hold. Twelve people stay safe, four seconds at a time.')], set: { prisoners_held: true, echo_step: true }, ev: 'prisoners' }),
      ],
    },
  },
  rules: [{ id: 'power', when: 'pw_49 && pw_26', set: { power_cut: true }, say: [N('Both runs dark. The guards\' lamps go blind.')], then: 'blind' }],
  fx: {
    // the lamps are out: the gallery's and the crown's watchers see only what is close (the testing chamber and the yard
    // have floodlights of their own)
    blind: (rt) => { for (const s of rt.g.deckWorld?.sentinels || []) if (LAMPS.test(s.def.id)) s.def.range = Math.min(s.def.range, 3.5); },
    echoUnlock: (rt) => rt.score?.cue('echoStep'),
  },
  adjust(level, rt) {
    if (rt?.g?.facts?.get('power_cut')) for (const s of level.sentinels) if (LAMPS.test(s.id)) s.range = Math.min(s.range, 3.5);
  },
  spoken: { remember: [K('They moved. They remember where I went.')] },
  step: m10Step,
  overlay(P) {
    person(P, { id: 'm10_guard', crew: 'm10_guard', first: 'Guard', seed: 1001, ambient: true, at: 'guardPost', off: [1.4, 0, 1.6], turn: Math.PI, when: '!t_m10_power', prompt: 'TALK TO THE GUARD' });
    person(P, { id: 'sera', crew: 'sera', at: 'seraSkiff', off: [-1.6, 0, 1.2], turn: Math.PI, silent: true });
    person(P, { id: 'dale_cell', crew: 'dale', at: 'loopCells', off: [-2.4, 0, 2.2], turn: Math.PI, hologram: true, silent: true, when: 'officer_trusted && !prisoners_freed' });
    person(P, { id: 'rook_cell', crew: 'rook', variant: 'old', at: 'loopCells', off: [2.4, 0, 2.2], turn: Math.PI, hologram: true, silent: true, when: 'rook_fate == "expose" && !prisoners_freed' });
  },
  hook: {
    cue: 'cliff', minutes: 1,
    lines: [L('SERA', 'Somebody at Rain City General is being put back together every morning. The readings come from Ward 32.'), K('Thirty-two.'), L('SERA', 'Means something to you?'), K('It\'s her age. It would be her age.')],
  },
  done: 't_m10_yard',
};
M10.outro = M10.hook.lines;

// the watchers the gallery's and the crown's lamps light (quarters 0 and 1): the power cut blinds these
const LAMPS = /_q[01]s\d+$/;
// the Continuum's watchers remember Kai's last attempt (§5 M10): after each catch (a setback with a watcher at his
// shoulder) every patrol starts its round further along, and looks a metre further, up to three
function m10Step(rt) {
  const g = rt.g, f = g.facts, p = g.player?.pos;
  const S = (rt.m10 ||= { catching: false, caught: false });
  if (!p) return;
  if (g.catching && !S.catching) S.caught = (g.deckWorld?.sentinels || []).some((s) => Math.hypot(s.pos.x - p.x, s.pos.z - p.z) < 1.8);
  const ended = S.catching && !g.catching;
  S.catching = !!g.catching;
  if (!ended || !S.caught) return;
  S.caught = false;
  f.inc('m10_caught');
  const n = f.get('m10_caught');
  for (const s of g.deckWorld.sentinels) {
    const path = s.def.path;
    s.def.baseRange ??= s.def.range;
    s.def.range = Math.min(s.def.baseRange + Math.min(3, n), f.get('power_cut') && LAMPS.test(s.def.id) ? 3.5 : Infinity);
    if (path.length < 2) continue;
    const j = (s.wp + n) % path.length;
    s.pos.set(path[j][0], s.pos.y, path[j][1]); // (on its own floor: the chamber's troopers stand at -12 m)
    s.wp = (j + 1) % path.length;
  }
  if (n === 1) g.hud.say(rt.deck.spoken.remember, f);
}

// =============================================================================================================
// Mission 11: THE INVERTED HOSPITAL (REVERSE is taught here: the processes at the hospital's landmarks)
// =============================================================================================================
export const LOCK_ORDER = ['RING', 'BAR', 'STAR', 'CRESCENT'];
const CLUE_TAG = 'A 2026 maintenance tag: WARD 32 LOCK REFITTED 14-03-2026. BOLTS FITTED IN ORDER: RING, BAR, STAR, CRESCENT.';
const CLUE_TWIN = 'Next door the twin lock comes apart on its loop, last bolt first: CRESCENT, then STAR, then BAR, then RING.';
const CLUE_CHIME = 'The intercom chimes four tones, low to high. The bolts answer in the same tones: RING, BAR, STAR, CRESCENT.';
const M11_PROCESSES = [
  // the three tutorial objects in the records hall (D22): a fall, a flow, a burn
  {
    id: 'tray', kind: 'fall', at: 'tray', label: 'THE TRAY', weight: 0.5, when: '@PRESENT', grain: 'metal', creak: 0.3,
    props: [{ box: [-0.5, 0, -0.32, 0.5, 0.86, 0.32], mat: 'prop' }],
    parts: [
      { shape: 'box', size: [0.62, 0.025, 0.42], mat: 'steel', at: [0, 0.875, 0], rest: { at: [-0.62, 0.013, 0.72], rot: [0.04, 0.55, 0.03] } },
      { shape: 'disc', size: [0.2, 0.035, 0.2], mat: 'steel', at: [0.16, 0.905, 0.06], rest: { at: [-1.05, 0.018, 0.38], rot: [0.3, 0, 0.2] } },
      { shape: 'box', size: [0.17, 0.012, 0.04], mat: 'steel', at: [-0.14, 0.894, -0.08], rot: [0, 0.4, 0], rest: { at: [-0.32, 0.006, 1.12], rot: [0, 1.9, 0] } },
      { shape: 'cyl', size: [0.022, 0.15, 0.022], mat: 'white', at: [0.02, 0.9, -0.11], rot: [0, 0, 1.5708], rest: { at: [-1.12, 0.011, 0.95], rot: [0, 0.8, 1.5708] } },
    ],
    aim: [0, 0.9, 0],
    hints: ['The tray fell.', 'Fallen things rise, for a while.', 'Aim at the tray. REVERSE.'],
  },
  {
    id: 'waterGlass', kind: 'flow', mode: 'spill', at: 'waterGlass', label: 'THE GLASS', weight: 0.5, when: '@PRESENT', grain: 'water',
    props: [{ box: [-0.42, 0, -0.32, 0.42, 0.74, 0.32], mat: 'prop2' }],
    parts: [
      { shape: 'glass', size: [0.085, 0.13, 0.085], mat: 'glass', at: [0.12, 0.805, 0.02] },
      { shape: 'cyl', size: [0.07, 0.1, 0.07], mat: 'water', at: [0.12, 0.795, 0.02] },
      { shape: 'disc', size: [0.8, 0.006, 0.8], mat: 'water', at: [0.55, 0.004, 0.62] },
    ],
    aim: [0.12, 0.82, 0.02],
    hints: ['A spilled glass.', 'Water runs back too.', 'Aim at the glass. REVERSE.'],
  },
  {
    id: 'burntDoor', kind: 'burn', at: 'burntDoor', label: 'THE ANNEX DOOR', weight: 1, when: '@PRESENT', grain: 'fire',
    props: [
      { box: [-3.0, 0, -0.07, -0.56, 2.5, 0.07], mat: 'wall' },
      { box: [0.56, 0, -0.07, 3.0, 2.5, 0.07], mat: 'wall' },
      { box: [-0.56, 2.15, -0.07, 0.56, 2.5, 0.07], mat: 'wall' },
    ],
    parts: [{ shape: 'box', size: [1.0, 2.1, 0.05], mat: 'wood', at: [0, 1.05, 0], rest: { at: [0.15, 0.03, -1.25], rot: [-1.5708, 0, 0.12] } }],
    aim: [0, 1.1, 0],
    hints: ['The annex door burned.', 'Fire runs backwards.', 'Aim at the door. REVERSE.'],
  },
  // the file the ward un-burns for three seconds in ten: readable only while Kai holds it
  {
    id: 'charredFile', kind: 'burn', at: 'charredFile', label: 'THE CHARRED FILE', weight: 0.5, max: 12, when: '@PRESENT', grain: 'fire', required: true,
    ambient: { period: 10, on: 3 }, scene: 'charredFile', prompt: 'READ THE FILE',
    props: [{ box: [-0.6, 0, -0.42, 0.6, 0.76, 0.42], mat: 'prop' }],
    parts: [{ shape: 'sheet', size: [0.34, 0, 0.44], mat: 'paper', at: [0, 0.775, 0], rot: [0, 1.5708, 0], text: ['RAIN CITY GENERAL', 'ADMISSION · WARD 32', '14-03-2026 · 16:40', 'VAREN, M. · AGE 9', '', '~Admitted by: K. Varen'] }],
    aim: [0, 0.8, 0],
    hints: ['Paper, three seconds in ten.', 'Hold it unburnt.', 'REVERSE the file, then read it.'],
  },
  // R6: never a person
  {
    id: 'flatlineMonitor', kind: 'refusal', refuse: 'NOT A PROCESS', at: 'flatlineMonitor', label: 'THE MONITOR', when: '@PRESENT', line: 'Not a person. It won\'t take a person.',
    props: [{ box: [-1.0, 0, -0.48, 1.0, 0.6, 0.48], mat: 'prop2' }, { box: [0.93, 0, 0.62, 1.01, 1.24, 0.7], mat: 'trimDark' }],
    parts: [{ shape: 'box', size: [0.46, 0.32, 0.06], mat: 'screen', at: [0.97, 1.4, 0.66] }],
    aim: [0.97, 1.4, 0.66],
  },
  // the reversing lock on Ward 32's door: four bolts, RING, BAR, STAR, CRESCENT fitted in that order
  {
    id: 'm11lock', kind: 'lock', at: 'ward32Door', label: 'THE LOCK', weight: 1, grain: 'metal', required: true, bolts: LOCK_ORDER, aim: [0, 1.4, 0.3],
    hints: ['Only the last bolt fitted comes out.', 'The tag, the twin lock, the chime.', 'CRESCENT, STAR, BAR, RING.'],
  },
  // R5: Odile's 2026 echo, walking her shift backwards; held, it runs forwards once and says what it says
  {
    id: 'odileEcho', kind: 'recording', at: 'odileStation', label: 'ODILE\'S ECHO', weight: 0.5, grain: 'pen', aim: [0, 1.3, -1.6],
    clip: { who: 'CREW', name: 'ODILE', voice: { id: 'ODILE' }, text: 'Thirty-two isn\'t missing. She\'s early.' },
    hints: ['Her echo walks backwards.', 'A recording runs forwards once.', 'REVERSE her echo.'],
  },
];
const M11_HINTS = {
  arrive: ['The intercom.', 'Past the atrium.', 'Go in to triage.'],
  music: ['A music box.', 'It gets quieter as I get closer.', 'Follow it east, to the quietest point.'],
  youngKai: ['Someone on the bench.', 'Outside the children\'s wing.', 'Look at him.'],
  hazards: ['Things go back where they were.', 'Watch the cycle, then cross.', 'Past the IV stand to the records.'],
  rhythm: ['The file keeps un-burning.', 'The annex desk.', 'Watch the file.'],
  practise: ['Practise.', 'The tray, the glass, the door.', 'Reverse one of them.'],
  file: ['Hold the file unburnt.', 'Read it while it holds.', 'Reverse it, then read.'],
  compare: ['Who was admitted?', 'The ledger, now and in 2026.', 'Read it in both years.'],
  odile: ['A nurse at the station.', 'The Ward 32 corridor.', 'Talk to Odile.'],
  lock: ['Four bolts, one order.', 'Tag, twin lock, chime.', 'Last fitted, first out.'],
  ward: ['Ward 32.', 'The bed.', 'Read the file.'],
  photo: ['The family-room photos.', 'One face, two years.', 'Look in both years.'],
  echo: ['Odile\'s echo.', 'Her station.', 'Reverse her echo.'],
  tape: ['The intercom room.', 'Off the records hall.', 'Play her something.'],
};
// the things in the bright wards that go back where they were, each on its own cycle (6-8 s): a gurney rolls back up
// the run, an IV stand jumps upright, glass flies up into its window frame. Only the return hits (a setback 'hit').
//   origin and rest: [right, up, forward] from the landmark;  size: the box that hits
const M11_HAZARDS = [
  { id: 'gurney', at: 'gurneyRun', origin: [0, 0.5, -10], rest: [0, 0.5, 8], size: [0.8, 0.9, 2.0], period: 7, phase: 0, color: 0xd8dde2 },
  { id: 'ivStand', at: 'ivStand', origin: [0, 0.9, 0], rest: [0.8, 0.15, 0], size: [0.45, 1.8, 0.45], tilt: 1.45, period: 6, phase: 2, color: 0xb8c0c8 },
  { id: 'glass', at: 'glassWindow', origin: [0, 0, 0], rest: [0, -1.25, 2.4], size: [1.4, 1.0, 0.12], period: 8, phase: 4, color: 0xcfe8f4 },
];
const RETURN = 1.3; // seconds a hazard takes to go back where it was
// the music box's gain at d metres from it: the nearer, the quieter (the bible's "the sound that becomes quieter")
export const musicGain = (d) => Math.max(0.04, Math.min(1, d / 25));
// a hazard's two ends in the world: where it goes back to (o) and where it drifts to (r), from its landmark
export function hazardEnds(h, lm) {
  const [x, y, z, yaw] = lm;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const w = ([dx, dy, dz]) => [x + dx * c + dz * s, y + dy, z - dx * s + dz * c];
  return { o: w(h.origin), r: w(h.rest) };
}
// where each hazard is now (and whether it is returning), at time t; written into `out` (m11Step keeps one per hazard,
// and its ends, for the level: nothing is made each frame)
export function hazardAt(h, lm, t, out = { pos: [0, 0, 0] }, ends = hazardEnds(h, lm)) {
  const { o, r } = ends;
  const u = (t + h.phase) % h.period, hold = h.period * 0.55;
  let k, returning = false;
  if (u < RETURN) { k = u / RETURN; returning = true; } else if (u < hold) k = 1; else k = 1 - (u - hold) / (h.period - hold);
  for (let i = 0; i < 3; i++) out.pos[i] = r[i] + (o[i] - r[i]) * k;
  out.k = k;
  out.returning = returning;
  out.cycle = Math.floor((t + h.phase) / h.period);
  return out;
}

function m11Step(rt, dt) {
  const g = rt.g, lv = rt.level;
  if (!lv?.landmarks || !g.player) return;
  let S = rt.m11;
  if (!S || S.level !== lv) {
    // (each hazard's state, ends and half size, made once for the level and written in place each frame)
    S = rt.m11 = { level: lv, t: 0, songT: 1, gain: 0, dist: 0, hits: 0, hit: {}, meshes: {},
      hazards: M11_HAZARDS.map((h) => ({ id: h.id, pos: [0, 0, 0], k: 0, returning: false, cycle: 0 })),
      ends: M11_HAZARDS.map((h) => lv.landmarks[h.at] && hazardEnds(h, lv.landmarks[h.at])), half: M11_HAZARDS.map((h) => h.size.map((v) => v / 2 + 0.35)) };
    const root = g.deckWorld?.root;
    if (root) for (const h of M11_HAZARDS) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(...h.size), new THREE.MeshStandardMaterial({ color: h.color, roughness: 0.4, metalness: h.id === 'glass' ? 0.1 : 0.5, transparent: h.id === 'glass', opacity: h.id === 'glass' ? 0.45 : 1 }));
      m.castShadow = h.id !== 'glass';
      root.add(m);
      S.meshes[h.id] = m;
    }
  }
  S.t += dt;
  const f = g.facts, present = g.engine.state(g.room) === 'PRESENT';
  const p = g.player.pos;
  // the hazards: in the bright 2049 wards only
  for (let i = 0; i < M11_HAZARDS.length; i++) {
    const h = M11_HAZARDS[i], lm = lv.landmarks[h.at];
    if (!lm) continue;
    const st = hazardAt(h, lm, S.t, S.hazards[i], S.ends[i]);
    const m = S.meshes[h.id];
    if (m) {
      m.visible = present;
      m.position.set(st.pos[0], st.pos[1], st.pos[2]);
      m.rotation.set(0, lm[3], h.tilt ? h.tilt * (1 - st.k) : 0);
    }
    if (!present || !st.returning || g.catching || rt.opening || rt.cinema?.active || g.hud?.talking) continue;
    const [hx, hy, hz] = S.half[i];
    if (Math.abs(p.x - st.pos[0]) < hx && Math.abs(p.z - st.pos[2]) < hz && Math.abs(p.y - 0.86 - st.pos[1]) < hy + 0.9 && S.hit[h.id] !== st.cycle) {
      S.hit[h.id] = st.cycle;
      S.hits++;
      f.inc('m11_hits');
      g.deckSetback?.('hit');
    }
  }
  // the music box: quieter the nearer you are (gain = d / 25), until its source is found
  const mb = lv.landmarks.musicBox;
  if (mb) {
    S.dist = Math.hypot(p.x - mb[0], p.z - mb[2]);
    S.gain = musicGain(S.dist);
    if (!f.get('t_m11_youngKai') && (S.songT -= dt) <= 0) {
      S.songT = 2.8;
      song(rt, S.gain * 0.9);
      if ((S.n = (S.n || 0) + 1) % 3 === 1) rt.score?.capText(S.gain < 0.3 ? 'the music box, very quiet: close' : 'a music box, quieter as you come closer');
    }
  }
}

export const M11 = {
  key: 'm11', n: 11, chapter: 'act2', name: 'THE INVERTED HOSPITAL', title: 'A hospital in localized inversion', subtitle: 'Some wards move forward. Others reverse. Kai learns to hold one thing back.',
  logline: 'Rain City General, where some wards run backwards.',
  place: 'hospital', sectors: 1, states: ['PRESENT', 'PAST'], drones: [0, 0, 0], unstable: true, motto: 'TEMPORAL DISCONTINUITY', gate: 'WARD 32',
  ambience: 'hum', ambient: 'loop', crew: C('odile'),
  named: ['odile', 'patient', 'kai12'],
  minutes: { main: 32, optional: 8 }, autoExit: 1.2, gateAfter: true,
  // the wards that run backwards on their own (not a year: engine.setOverride timeReverse)
  reversed: [{ room: 'h_colonnade' }, { room: 'h_annex' }, { room: 'h_twin' }],
  processes: M11_PROCESSES,
  // Ward 32's figure: silent, a hologram that flickers (npcs.js 'patient'), at the head of the bed that puts itself back
  // together, inside the ward, once the lock is open, and in 2049 only (in 2026 Mira was nine, and in this bed)
  adjust(level) {
    const bed = level.landmarks?.ward32;
    if (!bed) return;
    level.npcs.push({ id: 'ward32_figure', crew: 'patient', pos: [bed[0] + 4.2, bed[1], bed[2] - 3.4], yaw: -0.45, silent: true, hologram: true, room: 'h_ward32', when: 'lock_open && @PRESENT' });
  },
  spots: [
    { id: 'maintTag', at: 'ward32Door', scene: 'maintTag', prompt: 'THE MAINTENANCE TAG', model: 'tag', offset: [2.05, 1.5, 0.02], r: 2.2,
      texts: [{ text: 'WARD 32 LOCK', at: [2.05, 1.92, 0.03], size: 0.09, color: '#7a828a', when: '!@PAST' }, { text: 'WARD 32 LOCK · REFITTED 14-03-2026', at: [2.05, 1.92, 0.03], size: 0.07, color: '#3a3020', when: '@PAST' }, { text: 'RING · BAR · STAR · CRESCENT', at: [2.05, 1.8, 0.03], size: 0.07, color: '#3a3020', when: '@PAST' }] },
    { id: 'intercom', at: 'intercom', scene: 'chime', prompt: 'THE INTERCOM', model: 'intercom', offset: [0, 1.6, 0.03] },
    { id: 'twinLockSpot', at: 'twinLock', scene: 'twinLock', prompt: 'THE TWIN LOCK', model: 'none', offset: [0, 1.5, 0.4] },
  ],
  doors: [
    { id: 'door_m11records', at: 'recordsDoor', when: '!ev_admitted_by' },
    { id: 'door_m11ward32', at: 'ward32Door', when: '!inv_m11lock_done' },
  ],
  zones: [{ at: 'charredFile', box: [-1.5, -0.5, -1.9, 1.7, 3, 1.9], set: { m11_saw_file: true }, when: '!has_inversion' }],
  displays: [{ id: 'twinLock', kind: 'lockLoop', at: 'twinLock', y: 1.5 }],
  // the three clues to the lock's order: the tag lists the fitting, the twin lock the coming apart, the chime the tones
  lockClues: [{ scene: 'maintTag', order: 'fit' }, { scene: 'twinLock', order: 'out' }, { scene: 'chime', order: 'fit' }],
  fragSpots: [['triage', 'gurneyRun'], ['recordsHall'], ['roofGarden']],
  fragments: [[
    'A visitor badge for VAREN, K., age 12. Signed in. Never signed out.',
    'A drawing taped to a wall: a girl, a ring, a sun. MIRA, 9.',
    'A wristband cut off with scissors: VAREN, M.',
    'A roof garden bench with a view of the Ring Hill.',
  ]],
  beats: [{ kind: 'custom', goal: 'Find Ward 32.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    // (2026, inside the Ward 32 station: Odile at her desk, as the ward kept her)
    shots: [{ cam: [11, 2.1, -46], to: [9.5, 1.9, -44.5], look: [5.2, 1.3, -39.6], t: 9 }],
    year: 'PAST',
    lines: [N('2026. A nurse writes on the ward whiteboard: VAREN, M., 9.'), N('The ink lifts off the board, letter by letter, back into the marker.')],
  },
  quarters: [
    {
      name: 'TRIAGE & THE QUIET COLONNADE',
      threads: [
        { id: 'arrive', kind: 'go', at: 'triage', r: 4, goal: 'In through the atrium.', because: 'Sera\'s readings come from here.', say: [FX(L('PA', 'Temporal discontinuity.'), 'pa')], hints: M11_HINTS.arrive, minutes: 3 },
        { id: 'music', kind: 'go', at: 'musicBox', r: 3, after: ['arrive'], goal: 'Follow the sound that gets quieter as you approach.', because: 'A music box. Her song. It is quietest where it is.', hints: M11_HINTS.music, minutes: 4 },
        { id: 'youngKai', kind: 'scene', scene: 'young_kai', at: 'youngKaiBench', after: ['music'], spot: { prompt: 'THE BOY ON THE BENCH', offset: [0, 1.0, 1.2], r: 2.8, model: NO_MODEL },
          goal: 'Someone is sitting by the music box.', because: 'The song is his.', done: 'ev_young_kai', hints: M11_HINTS.youngKai, minutes: 1 },
        { id: 'hazards', kind: 'go', at: 'recordsGate', r: 4, after: ['youngKai'], goal: 'Back across the courts to the records hall.', because: 'Things here go back to where they were, hard.', hints: M11_HINTS.hazards, minutes: 3 },
      ],
    },
    {
      name: 'RECORDS',
      threads: [
        { id: 'rhythm', kind: 'cinema', at: 'charredFile', after: ['hazards'], done: 'has_inversion', goal: 'Watch the file that keeps un-burning.', because: 'Three seconds in ten it is paper.', hints: M11_HINTS.rhythm, minutes: 2 },
        { id: 'practise', kind: 'cinema', after: ['rhythm'], done: 'inv_used', goal: 'Hold one thing back: the tray, the glass or the annex door.', because: 'One thing. Only one, and only for a while.', hints: M11_HINTS.practise, minutes: 2 },
        { id: 'file', kind: 'scene', scene: 'charredFile', at: 'charredFile', after: ['practise'], done: 'ev_admitted_by', goal: 'Hold the file unburnt, and read it.', because: 'Someone admitted her.', hints: M11_HINTS.file, minutes: 2 },
        { id: 'compare', kind: 'residue', at: 'ledger2026', after: ['file'],
          record: { official: 'RECORDS, 2049. WARD 32 ADMISSIONS: NO PATIENT NAMED VAREN.', echo: 'The 2026 ledger: VAREN, M., 9. ADMITTED 14-03-2026, 16:40. WARD 32.', hint: 'In 2026 the ledger was new.',
            after: [K('She was here. This year has no record of her.')], prompt: 'THE ADMISSIONS LEDGER', offset: [0, 1.1, 0.6], model: 'none', log: 'Mira was admitted to Ward 32 in 2026. 2049 has no record of her.' },
          goal: 'Compare the medical records.', because: 'A patient is missing from one of them.', ev: 'missing_patient', hints: M11_HINTS.compare, minutes: 3 },
      ],
      sides: [
        { id: 'photo', name: 'THE CHILD IN THREE PHOTOGRAPHS: THE BOARD', done: 'child_step3', minutes: 4,
          threads: [{ id: 'photoBoard', kind: 'clue', need: 2, of: ['ev_board_9', 'ev_board_32'],
            spots: [
              { id: 'board_now', scene: 'board_now', at: 'photoBoard', prompt: 'THE FAMILY-ROOM BOARD', offset: [0, 1.4, 0.4], r: 2.6, model: NO_MODEL, when: '@PRESENT' },
              { id: 'board_then', scene: 'board_then', at: 'photoBoard', prompt: 'THE FAMILY-ROOM BOARD', offset: [0, 1.4, 0.4], r: 2.6, model: NO_MODEL, when: '@PAST' },
            ],
            say: [K('Nine, and thirty-two. The years can\'t agree on her age.'), K('The Child. The third photograph.', 'case_c_child')], set: { child_step3: true },
            goal: 'A photo board in the family room.', because: 'One face, at different ages.', hints: M11_HINTS.photo, minutes: 4 }] },
        { id: 'tape', name: 'THE INTERCOM ROOM', when: 'mira_tape == "kept"', done: 'ev_tape_played', minutes: 2,
          threads: [{ id: 'tapePlay', kind: 'scene', scene: 'tape', at: 'intercomRoom', spot: { prompt: 'THE WARD INTERCOM', offset: [0, 1.3, 0.6], r: 2.6, model: NO_MODEL },
            goal: 'The intercom reaches every ward.', because: 'Odile is still on hers.', done: 'ev_tape_played', hints: M11_HINTS.tape, minutes: 2 }] },
      ],
    },
    {
      name: 'WARD 32',
      threads: [
        { id: 'odile', kind: 'talk', npc: 'odile', at: 'odileStation', after: ['compare'], goal: 'A nurse at the Ward 32 station.', because: 'She has been here since 2026.', done: 'odile_met', hints: M11_HINTS.odile, minutes: 3 },
        { id: 'lock', kind: 'invert', target: 'm11lock', at: 'ward32Door', after: ['odile'], goal: 'Take the reversing lock apart, in the right order.', because: 'It came apart once. Next door, it still does.', hints: M11_HINTS.lock, minutes: 5 },
        { id: 'ward', kind: 'scene', scene: 'ward32', at: 'ward32', after: ['lock'], spot: { prompt: 'THE FILE ON THE BED', offset: [0, 0.9, 0], r: 3, model: NO_MODEL },
          goal: 'Ward 32.', because: 'The readings come from here.', done: 'ward32_read', hints: M11_HINTS.ward, minutes: 2 },
      ],
      sides: [
        { id: 'echo', name: 'ODILE\'S SHIFT', done: 'inv_odileEcho_done', minutes: 2,
          threads: [{ id: 'echoRev', kind: 'invert', target: 'odileEcho', at: 'odileStation', goal: 'Odile\'s 2026 echo walks her shift backwards.', because: 'A recording runs forwards once.', hints: M11_HINTS.echo, minutes: 2 }] },
      ],
    },
  ],
  talks: {
    odile: [
      {
        when: '!odile_met',
        lines: [CREW('They put me back together every morning. I would like, once, to stay apart.'), K('Who puts you back together?'), CREW('A man who sits with the girl in thirty-two. He always says thank you.'),
          CREW('There was a boy, once. Twelve. He would not let go of her hand. We took his fingers off one at a time.'), K('I don\'t remember that.'), CREW('No. You wouldn\'t have let yourself.')],
        choices: [
          intent('comfort', 'Let her stay apart.', { say: 'Then stay apart. I will tell him.', consequence: true, lines: [CREW('Thank you. Nobody says it first.')], set: { odile_met: true, odile_released: true } }),
          intent('withdraw', 'Keep her together.', { say: 'Not yet. I need you to hold.', consequence: true, lines: [CREW('Then I will hold. I am good at it.')], set: { odile_met: true, odile_released: false } }),
        ],
      },
      { when: 'odile_met', lines: [CREW('The lock. Last in, first out. Everyone forgets.')] },
    ],
  },
  scenes: {
    young_kai: { lines: [N('A boy of twelve on the bench, a drawing on his knees, the music box beside him. He does not look up.')], set: { ev_young_kai: true }, log: 'Outside the children\'s wing: me at twelve, with her drawing.' },
    lock: { when: 'inv_m11lock_done', lines: [N('The last bolt backs out and stays out. Nothing pushes it back in. The door to Ward 32 slides up.')], set: { lock_open: true }, log: 'The lock came apart the way it went together, last bolt first.' },
    lock_no: { lines: [K('Forwards, it only tightens. Last bolt first.')] },
    charredFile: { when: 'rev_charredFile', lines: [N('For as long as Kai holds it, the file is paper. Ward 32, the fourteenth of March 2026. VAREN, M., nine. At the bottom, in an older hand:'), N('ADMITTED BY: K. VAREN.'), K('My name. Not my handwriting. Not yet.')], set: { ev_admitted_by: true }, log: 'Mira, nine, Ward 32. ADMITTED BY: K. VAREN, in an older hand.' },
    charredFile_no: { lines: [L('NONE', 'Ash on a desk in the annex. For three seconds in every ten it is paper again.', '!has_inversion'), L('KAI', 'It goes back to ash. I have to hold it unburnt, and read it while it holds.', 'has_inversion')], then: 'unlock' },
    maintTag: { when: '@PAST', lines: [N(CLUE_TAG)], set: { ev_lock_order: true }, log: 'The 2026 tag: RING, BAR, STAR, CRESCENT.' },
    maintTag_no: { lines: [K('A maintenance tag, bleached blank. In 2026 it was new.')] },
    twinLock: { lines: [N(CLUE_TWIN), K('Last in, first out.')], set: { ev_lock_order: true } },
    chime: { lines: [N(CLUE_CHIME), K('Fitted low to high. So they come out high to low.')], then: 'chime' },
    ward32: { lines: [N('Ward 32. A bed that puts itself back together every morning. On the pillow, Lin\'s lanyard. On the blanket, a file.')], set: { ward32_read: true } },
    board_now: { lines: [N('The family-room board, 2049: a woman of thirty-two in a ward gown.')], set: { ev_board_32: true } },
    board_then: { lines: [N('The same frame, 2026: a girl of nine in yellow boots.')], set: { ev_board_9: true } },
    tape: { when: 'mira_tape == "kept"', lines: [N('Kai plays Mira\'s tape into the ward intercom.'), SAYS('ODILE', 'ODILE', 'I know that voice. She sang on this ward.')], set: { ev_tape_played: true } },
    tape_no: { lines: [L('KAI', 'I left her tape on the ridge.', 'mira_tape == "left"'), L('KAI', 'Nothing to play her.', '!mira_tape')] },
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
  step: m11Step,
  overlay(P) {
    person(P, { id: 'odile', crew: 'odile', at: 'odileStation', off: [0, 0, 1.4], turn: Math.PI, prompt: 'TALK TO ODILE' });
    person(P, { id: 'odile_echo', crew: 'odile', at: 'odileStation', off: [2.2, 0, -1.6], hologram: true, silent: true, when: '!inv_odileEcho_done' });
    person(P, { id: 'kai12', crew: 'kai12', at: 'youngKaiBench', off: [0, 0, 0.4], turn: Math.PI, hologram: true, silent: true, when: '@PRESENT' });
  },
  hook: {
    cue: 'cliff', minutes: 1,
    lines: [REV(N('The file: VAREN, M., age 32. The record is twenty-three years old. The death date is blank. The photograph is Lin.')), K('Lin.'), N('The intercom stops repeating.'),
      FX(L('WITNESS', 'Close the file, Kai.'), 'pa'), N('Beyond the ward glass a man walks away, flickering between 2026 and 2049.')],
  },
  done: 'ward32_read',
};
M11.outro = M11.hook.lines;

// =============================================================================================================
// Mission 12: THE MAN BEHIND THE GLASS
// =============================================================================================================
const M12_HINTS = {
  chase: ['He is on the roof.', 'He waits at the glass.', 'Keep after him.'],
  follow: ['He stepped into 2026.', 'The roof\'s edge, by the court.', 'Switch to 2026 at the gangway.'],
  corridor: ['A corridor that was.', 'The 2026 gangway.', 'Cross it, in 2026.'],
  ruin: ['2196.', 'East, past the court.', 'Into the ruin.'],
  panes: ['He stops at glass.', 'The roof, the gangway, his steps.', 'Two of them.'],
  route: ['His route repeats.', 'In the ruin.', 'Piece it together.'],
  witnessStair: ['He went down here.', 'The terraces.', 'Watch him.'],
  stair: ['The stair he dropped.', 'Fallen things rise.', 'REVERSE the stair.'],
  beam: ['A beam across the way.', 'At the foot of the stair.', 'REVERSE the beam.'],
  voicemail: ['My phone.', 'It plays by itself.', 'Listen.'],
  face: ['The second ring.', 'He is waiting.', 'Talk to him.'],
  escape: ['He is leaving.', 'The fracture.', 'Watch.'],
  rook: ['Rook, in 2026.', 'The gangway gate.', 'Look at the gate.'],
  bouquet: ['Florist\'s paper.', 'On the gangway.', 'Look at it.'],
  whiteboard: ['The lunch room.', 'In 2026.', 'Read the board.'],
};
const M12_SAY = {
  stair: [N('He raises his wrist. The fallen stair lifts back into place, in your colour, with your sound.'), K('That\'s my… he does it the way I do it.'), N('He goes down it, and lets it fall behind him.')],
};
const M12_PROCESSES = [
  // the stair from the first terrace to the second: fallen in 2196 (the Witness holds it first, then Kai)
  {
    id: 'collapsedStair', kind: 'collapse', at: 'collapsedStair', label: 'THE COLLAPSED STAIR', weight: 1, when: '@FUTURE', grain: 'stone',
    span: { from: [0, 3, 4.2], to: [0, 0, 0.4], width: 1.8, pieces: 5, floor: 0 }, aim: [0, 1.4, 2.2],
    hints: ['He went down a stair that is not there.', 'It fell. Fallen things rise.', 'REVERSE the stair, then go down.'],
  },
  // the beam across the foot of the last stair, in front of the second chamber
  {
    id: 'fallenBeam', kind: 'fall', at: 'fallenBeam', label: 'THE FALLEN BEAM', weight: 1, when: '@FUTURE', grain: 'metal',
    parts: [{ shape: 'box', size: [0.9, 0.9, 6], mat: 'concrete', at: [0, 5.5, 0], rest: { at: [0, 0.45, 0], rot: [0, 0.12, 0] }, solid: true }], aim: [0, 0.8, 0],
    hints: ['A beam blocks the chamber.', 'It fell from the wing.', 'REVERSE it, and pass under.'],
  },
  // his footsteps, played backwards: held, they run forwards once, and say where he goes
  {
    id: 'witnessSteps', kind: 'recording', at: 'eastRuin', label: 'HIS FOOTSTEPS', weight: 0.5, grain: 'pen', aim: [0, 1.2, 1.4],
    clip: { who: 'NONE', text: 'His steps, forwards: the roof, the glass, the gangway, the glass, the stair. At every pane, he stops.' },
    hints: ['His steps, backwards.', 'A recording runs forwards once.', 'REVERSE his footsteps.'],
  },
  // a Helix drone over the court: held, it walks its last seconds backwards and forgets it saw Kai
  { id: 'droneCourt', kind: 'patrol', target: 'm12_helix_q0s0', label: 'THE DRONE', weight: 1,
    hints: ['A drone has seen me.', 'A patrol walks back its last few seconds.', 'REVERSE the drone. It forgets me.'] },
];

export const M12 = {
  key: 'm12', n: 12, chapter: 'act2', name: 'THE MAN BEHIND THE GLASS', title: 'Helix, three years deep', subtitle: 'A figure changes states to escape you.',
  logline: 'The north wing at sunset, the gangway of 2026, the sinkhole of 2196.',
  place: 'helix', wing: 'north', sectors: 1, states: ['PRESENT', 'PAST', 'FUTURE'], drones: [1, 1, 0, 0], unstable: true, motto: 'THE PERSON YOU BECOME WHEN YOU REFUSE TO LET GO',
  ambience: 'hum', ambient: 'helix', crew: C('witness'), gate: 'THE SECOND CHAMBER',
  named: ['witness', 'rook'],
  minutes: { main: 34, optional: 5 }, autoExit: 1.2, gateAfter: true,
  processes: M12_PROCESSES,
  // (Kai at the top of the fallen stair in 2196, once he knows the route: the Witness shows him the way down)
  zones: [{ at: 'collapsedStair', box: [-9, -5, -6, 9, 8, 9], set: { m12_at_stair: true }, when: 't_m12_route && @FUTURE' }],
  spoken: M12_SAY,
  fragSpots: [['northRoofs'], ['lunchRoom2026'], ['sinkTerraces']],
  fragments: [[
    'A pane of roof glass with a handprint at a child\'s height.',
    'A 2026 hard hat with VAREN written inside, crossed out.',
    'Chrysanthemum petals on the terraces, white, fresh.',
  ]],
  beats: [{ kind: 'custom', goal: 'Follow the man behind the glass.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    // (2196, where the north wing fell: the Witness on the sinkhole's rim, from behind, looking down where Kai will come)
    year: 'FUTURE', shots: [{ cam: [0.8, 2.6, -29], to: [0.4, 2.2, -30.5], look: [0, -4, -50], t: 9 }],
    cast: [{ crew: 'witness', at: 'sinkTerraces', off: [0, 0, 2.6], turn: Math.PI }],
    lines: [N('2196. On the rim where Helix\'s north wing stood, a man holds white chrysanthemums and waits for a younger Kai.'), REV(N('He is seen from behind. On his wrist, a scar.')), N('He whistles three notes, slowly.')],
  },
  quarters: [
    {
      name: 'THE CHASE — 2049',
      threads: [
        { id: 'chase', kind: 'chase', npc: 'witness_chase', path: [[-24, 13.5, -41], [-8, 13.5, -42], 'northWing', 'plantDecks', 'glassPanes'], at: 'northRoofs', goal: 'Chase the figure across the roofs.', because: 'He has my walk.', hints: M12_HINTS.chase, minutes: 5 },
        { id: 'follow', kind: 'go', at: 'gangway2026', r: 4, after: ['chase'], goal: 'He stepped off the roof into 2026. Follow.', because: 'In 2026 there was a way across.', hints: M12_HINTS.follow, minutes: 3 },
      ],
    },
    {
      name: 'THE CORRIDOR THAT WAS — 2026',
      threads: [
        { id: 'corridor', kind: 'go', at: 'bouquet', r: 3, after: ['follow'], goal: 'Across Corridor B, the gangway that only existed in 2026.', because: 'He uses the building the way I know it.', hints: M12_HINTS.corridor, minutes: 4 },
      ],
      sides: [
        { id: 'rook', name: 'ROOK IN THE CORRIDOR', done: 'ev_corridor_b', minutes: 2,
          threads: [{ id: 'rookGate', kind: 'scene', scene: 'rook_corridor', at: 'gangway2026', spot: { prompt: 'THE GANGWAY GATE', offset: [2.2, 1.2, 1], r: 2.8, model: NO_MODEL, when: '@PAST' },
            goal: 'Corridor B has a gate.', because: 'Somebody locked it in 2026.', done: 'ev_corridor_b', hints: M12_HINTS.rook, minutes: 2 }] },
        { id: 'flowers', name: 'THE DROPPED BOUQUET', done: 'ev_bouquet', minutes: 1,
          threads: [{ id: 'bouquetLook', kind: 'scene', scene: 'bouquet', at: 'bouquet', spot: { prompt: 'FLORIST\'S PAPER', offset: [0, 0.2, 0.8], r: 2.4, model: NO_MODEL, when: '@PAST' },
            goal: 'Something dropped on the gangway.', because: 'He was carrying it.', done: 'ev_bouquet', hints: M12_HINTS.bouquet, minutes: 1 }] },
        { id: 'board', name: 'THE LUNCH-ROOM WHITEBOARD', done: 'ev_junior_tour', minutes: 2,
          threads: [{ id: 'boardRead', kind: 'scene', scene: 'whiteboard', at: 'lunchRoom2026', spot: { prompt: 'THE WHITEBOARD', offset: [0, 1.4, 0.6], r: 2.6, model: NO_MODEL, when: '@PAST' },
            goal: 'The 2026 site lunch room.', because: 'Somebody planned a tour.', done: 'ev_junior_tour', hints: M12_HINTS.whiteboard, minutes: 2 }] },
      ],
    },
    {
      name: 'THE RUIN — 2196',
      threads: [
        { id: 'ruin', kind: 'go', at: 'eastRuin', r: 5, after: ['corridor'], goal: 'Into 2196, where the north wing fell.', because: 'His steps go on there.', hints: M12_HINTS.ruin, minutes: 2 },
        { id: 'panes', kind: 'clue', need: 2, of: ['ev_pane_roof', 'ev_pane_gangway', 'ev_steps'], after: ['ruin'],
          spots: [
            { id: 'pane_roof', scene: 'pane_roof', at: 'glassPanes', prompt: 'THE GLASS', offset: [0, 1.2, 0.6], r: 2.8, model: NO_MODEL, when: '@PRESENT' },
            { id: 'pane_gangway', scene: 'pane_gangway', at: 'gangway2026', prompt: 'THE HOARDING', offset: [-2.2, 1.2, 1], r: 2.8, model: NO_MODEL, when: '@PAST' },
          ],
          goal: 'Where he stopped, every time.', because: 'The same stop, in every year.', hints: M12_HINTS.panes, minutes: 2 },
        { id: 'route', kind: 'deduce', deduction: 'route', at: 'eastRuin', after: ['panes'], spotOpts: { offset: [2, 1.2, 0], r: 3 }, goal: 'Reconstruct his route.', because: 'He repeats it.', hints: M12_HINTS.route, minutes: 3 },
      ],
    },
    {
      name: 'THE SECOND CHAMBER',
      threads: [
        { id: 'witnessStair', kind: 'cinema', at: 'collapsedStair', after: ['route'], done: 'm12_stair_shown', goal: 'Down the terraces after him.', because: 'He went down into the hill.', hints: M12_HINTS.witnessStair, minutes: 1 },
        { id: 'stair', kind: 'tasks', of: ['rev_collapsedStair'], at: 'collapsedStair', after: ['witnessStair'], goal: 'Hold the stair the way he did, and follow.', because: 'He did it the way I do it.', hints: M12_HINTS.stair, minutes: 3 },
        { id: 'beam', kind: 'tasks', of: ['rev_fallenBeam'], at: 'fallenBeam', after: ['stair'], goal: 'A fallen beam across the chamber\'s way.', because: 'He went under it, somehow.', hints: M12_HINTS.beam, minutes: 2 },
        { id: 'voicemail', kind: 'cinema', after: ['beam'], lines: [N('In his pocket the phone plays the voicemail on its own. Received 05:40.'), FX(L('WITNESS', 'Kai Varen. If you are hearing this, you went in anyway. You always go in anyway.'), 'radio')],
          goal: 'The phone in my pocket.', because: 'Received 05:40.', hints: M12_HINTS.voicemail, minutes: 1 },
        { id: 'face', kind: 'talk', npc: 'witness_face', at: 'secondRing', after: ['voicemail'], goal: 'The second Chronolith. He is waiting by it.', because: 'Face to face, for once.', done: 'm12_faced', hints: M12_HINTS.face, minutes: 4 },
        { id: 'escape', kind: 'cinema', after: ['face'], lines: [N('He steps back into a fracture. It closes behind him like water.')], goal: 'He is leaving.', because: 'He always leaves.', hints: M12_HINTS.escape, minutes: 2 },
      ],
    },
  ],
  talks: {
    witness: [
      {
        when: '!m12_faced',
        lines: [K('Who are you?'), L('WITNESS', 'The person you become when you refuse to let go.'), REV(N('He lifts his wrist. A circle with a broken halo, thirty years older than yours.')),
          L('WITNESS', 'You got yours at a train door. It aches when it rains. It always rains.')],
        set: { m12_faced: true },
      },
      { when: 'm12_faced', lines: [L('WITNESS', 'Go home, Kai.')] },
    ],
  },
  deductions: {
    route: {
      question: [K('Every pane of glass, he stops. Why?')],
      answers: [
        { intent: 'investigate', label: 'Her reflection.', correct: true, needs: 'ev_pane_roof && ev_steps || ev_pane_gangway && ev_steps || ev_pane_roof && ev_pane_gangway', lines: [K('He puts his hand where her reflection would be. Every time.')] },
        { intent: 'challenge', label: 'To lose me.', lines: [K('No. He waits for me. He wants to be followed.')] },
      ],
      unproven: [K('Not enough yet. Where else did he stop?')],
      set: { route_known: true }, log: 'At every pane he stops where her reflection would be.',
    },
  },
  scenes: {
    pane_roof: { lines: [N('A handprint on the glass, at the height of a nine-year-old\'s face.')], set: { ev_pane_roof: true } },
    pane_gangway: { lines: [N('The same handprint on a site hoarding, in 2026.')], set: { ev_pane_gangway: true } },
    rook_corridor: {
      lines: [L('ROOK', 'I walked this in 2026. Go on. I will hold the gate.', 'rook_fate == "persuade"'), N('In a tray by the gate, Rook\'s confiscated badge. It still opens it.', 'rook_fate == "expose"'),
        FX(L('ROOK', 'For the record. My name is Elias Rook. I moved the test to 05:40.', '!(rook_fate == "persuade") && !(rook_fate == "expose")'), 'recording')],
      set: { ev_corridor_b: true },
    },
    bouquet: { lines: [N('White chrysanthemums in florist\'s paper. The receipt says 08:04.')], set: { ev_bouquet: true } },
    whiteboard: { lines: [N('On the 2026 lunch-room whiteboard: SITE ZERO JUNIOR TOUR. SATURDAY 14 MARCH. 6 KIDS.')], set: { ev_junior_tour: true } },
  },
  rules: [
    { id: 'steps', when: 'inv_witnessSteps_done', set: { ev_steps: true } },
    { id: 'witnessStair', when: 't_m12_route && m12_at_stair && !m12_stair_shown', then: 'witnessStair' },
  ],
  // (a save taken while he shows the stair, the zone and the rule fired, m12_stair_shown still to come: it plays again)
  resumes: [{ when: 't_m12_route && m12_at_stair', until: 'm12_stair_shown', fx: 'witnessStair' }],
  fx: {
    // the Witness holds the fallen stair as Kai would (REVERSE's own colour and sound), goes down, and lets it go
    witnessStair(rt) {
      const g = rt.g, p = rt.inv?.procs.find((x) => x.rec.id === 'collapsedStair');
      if (p && !p.settled) {
        p.reverse();
        rt.inv.snd?.start?.(p.rec.grain);
        g.after?.(5, () => { p.release(); rt.inv?.snd?.release?.(p.rec.grain, p.rec.creak); });
      }
      g.hud.say(M12_SAY.stair, g.facts, () => g.facts.set('m12_stair_shown'));
    },
  },
  // while the chase is on, he whistles the three notes slowly (the Witness's own motif), as near as he is
  step(rt, dt) {
    const g = rt.g;
    if (g.facts.get('t_m12_chase') || (rt.m12T = (rt.m12T ?? 2) - dt) > 0) return;
    rt.m12T = 7;
    const n = g.deckWorld?.npcs.find((x) => x.n.id === 'witness_chase');
    if (!n?.model.visible) return;
    const d = Math.hypot(g.player.pos.x - n.model.position.x, g.player.pos.z - n.model.position.z);
    if (d < 30) song(rt, 1 - d / 30, 'witness');
  },
  overlay(P) {
    // (he starts south of the lift's overrun, along the parapet, and leads Kai east across the roof)
    person(P, { id: 'witness_chase', crew: 'witness', at: 'northRoofs', off: [-6, 0, 8], turn: -Math.PI / 2 });
    person(P, { id: 'witness_ruin', crew: 'witness', at: 'collapsedStair', off: [0, 3, 5.5], silent: true, when: 't_m12_route && !m12_stair_shown' });
    person(P, { id: 'witness_face', crew: 'witness', at: 'secondRing', off: [0, 0, 4], turn: Math.PI, when: 't_m12_voicemail && !t_m12_escape', prompt: 'TALK TO HIM' });
    // (Rook, persuaded, holds the 2026 gate himself: in person, not his echo)
    person(P, { id: 'rook_b', crew: 'rook', variant: 'old', at: 'gangway2026', off: [3.2, 0, 1.4], turn: -Math.PI / 2, silent: true, when: 'rook_fate == "persuade" && @PAST', inPerson: true });
  },
  hook: { cue: 'cliff', minutes: 1, lines: [N('Kai looks at his own wrist.'), FX(L('SERA', 'Varen. The war\'s started. Both sides are asking for you by name.'), 'radio')] },
  done: 't_m12_escape',
};
M12.outro = M12.hook.lines;

// =============================================================================================================
// Mission 13: THE NINE-MINUTE WAR
// =============================================================================================================
const M13_HINTS = {
  cross: ['Through the fire.', 'The gaps between the shells.', 'Reach the canyon gate unseen.'],
  orders: ['Field orders.', 'By the quay trench.', 'Read them.'],
  shells: ['A shell in flight.', 'One from each side.', 'REVERSE one shell, then one of the other side\'s.'],
  first: ['Who started it?', 'The orders, and where each shell went.', 'Nobody. Each answers its own last shot.'],
  sera: ['Sera is at the gate.', 'The canyon gate.', 'Talk to Sera.'],
  devices: ['Three devices, three years.', 'Rail yard, crane, crater.', '2026, 2049, 2196.'],
  stabilizer: ['The stabilizer.', 'In the silos.', 'Decide.'],
  district: ['The frozen block.', 'Look at it.', 'Watch.'],
  casing: ['The first device.', 'The rail yard, 2026.', 'Read the casing.'],
  burial: ['Who buried it?', 'The burial site.', 'REVERSE the soil.'],
  listeners: ['People who listened.', 'The listeners\' route.', 'Talk to them.'],
  rollcall: ['The roll-call wall.', 'By the frozen block.', 'Hold the wall up.'],
};
const M13_PROCESSES = [
  // two shells in flight over the shell zone, each on its own cycle: held, each climbs back into the gun that fired it
  {
    id: 'shellA', kind: 'projectile', at: 'shellZone', label: 'A CONTINUUM SHELL', weight: 0.5, when: '@PRESENT', cycle: { period: 6, flight: 2 },
    parts: [{ shape: 'cyl', size: [0.24, 0.8, 0.24], mat: 'metal', at: [-40, 14, -30], rest: { at: [-3, 0.3, 2], rot: [1.2, 0, 0] } }], aim: [-6, 3.5, -4],
    hints: ['A shell from the north.', 'It lands where it was.', 'REVERSE it in flight.'],
  },
  {
    id: 'shellB', kind: 'projectile', at: 'shellZone', label: 'AN UNWRITTEN SHELL', weight: 0.5, when: '@PRESENT', cycle: { period: 7, flight: 2.2 },
    parts: [{ shape: 'cyl', size: [0.24, 0.8, 0.24], mat: 'metal', at: [30, 14, 40], rest: { at: [3, 0.3, -2], rot: [-1.2, 0, 0] } }], aim: [6, 3.5, 5],
    hints: ['A shell from the south.', 'The other side\'s.', 'REVERSE it in flight.'],
  },
  // the side story: the soil over the first device, in 2026; and the wall that falls on the roll-call door
  {
    id: 'burial', kind: 'flow', at: 'burialSite', label: 'THE BURIAL', weight: 0.5, when: '@PAST', grain: 'stone',
    parts: [{ shape: 'box', size: [1.8, 0.9, 1.4], mat: 'stone', at: [0, 0.45, 0] }], aim: [0, 0.6, 0],
    hints: ['Fresh soil.', 'Soil runs back too.', 'REVERSE the burial.'],
  },
  {
    id: 'shelterWall', kind: 'collapse', at: 'rollCall', label: 'THE SHELTER WALL', weight: 1, when: '@PRESENT', grain: 'stone',
    parts: [0, 1, 2].flatMap((i) => [0, 1].map((j) => ({ shape: 'box', size: [2.1, 1.15, 0.4], mat: 'concrete', at: [-2.2 + i * 2.2, 0.6 + j * 1.2, 0],
      rest: { at: [-2.6 + i * 2.4 + (j ? 0.6 : -0.4), 0.2 + j * 0.4, 1.4 + j * 0.8], rot: [1.3, (i - 1) * 0.4, 0.2 * j] }, solid: true }))),
    aim: [0, 1.2, 0],
    hints: ['The wall is coming down.', 'On the roll-call door.', 'REVERSE it and hold.'],
  },
  // a Continuum patrol between the devices: held, it walks back its last seconds and forgets it saw Kai
  { id: 'patrolYard', kind: 'patrol', target: 'm13_warport_q1s0', label: 'A CONTINUUM PATROL', weight: 1, when: '@PRESENT',
    hints: ['A patrol has seen me.', 'It can walk back its last few seconds.', 'REVERSE the patrol. It forgets me.'] },
];
// the Continuum's "inverted" patrol on the quay walks its round backwards (its eyes on the way it came), and the music
// drops out for a breath when it first comes into view
const M13_INVERTED = ['m13_warport_q0s0'];
const _fwd = new THREE.Vector3();
function m13Step(rt) {
  const g = rt.g;
  if (!g.camera || g.engine.state(g.room) !== 'PRESENT') return;
  const S = (rt.m13 ||= { seen: new Set() });
  for (const s of g.deckWorld?.sentinels || []) {
    if (!M13_INVERTED.includes(s.def.id) || s.model?.visible === false || s.mode !== 'patrol') continue;
    const w = s.def.path[s.wp], dx = w[0] - s.pos.x, dz = w[1] - s.pos.z, d = Math.hypot(dx, dz);
    if (d > 0.05) s.dir.set(-dx / d, 0, -dz / d); // (it moonwalks: its cone faces the way it came)
    if (S.seen.has(s.def.id)) continue;
    const c = g.camera.position, f = g.camera.getWorldDirection(_fwd), fl = Math.hypot(f.x, f.z) || 1;
    const tx = s.pos.x - c.x, tz = s.pos.z - c.z, tl = Math.hypot(tx, tz) || 1;
    if (tl < 22 && (tx * f.x + tz * f.z) / (tl * fl) > 0.8) {
      S.seen.add(s.def.id);
      rt.inv?.snd?.mute?.(0.4);
      rt.score?.capText('a patrol walking backwards');
    }
  }
}
const LISTENER = AMB('CROWD_M');

export const M13 = {
  key: 'm13', n: 13, chapter: 'act2', name: 'THE NINE-MINUTE WAR', title: 'The war zone', subtitle: 'Two factions fight over a stabilizer. Both are reacting to their own past attacks.',
  logline: 'The delta port, at war in 2049; working in 2026; a meadow in 2196.',
  place: 'warport', sectors: 1, states: ['PRESENT', 'PAST', 'FUTURE'], drones: [2, 2, 3], unstable: true, ambience: 'wind', ambient: 'loop',
  motto: 'THE FUTURE THAT SURVIVES LONG ENOUGH TO REMEMBER US', gate: 'THE DISTRICT', crew: C('soldier'),
  named: ['sera', 'soldier'],
  minutes: { main: 32, optional: 10 }, autoExit: 1.2, gateAfter: true,
  processes: M13_PROCESSES,
  fragSpots: [['helmetPile', 'flagPost'], ['craterRim'], ['rollCallDoor']],
  fragments: [[
    'A Continuum helmet with two names inside. The second is crossed out and written again.',
    'An Unwritten flag made from a Helix lab coat.',
    'A shell crater that is a garden in 2196 and a pond in 2026.',
    'A roll call, two hundred and twelve names, taped inside a frozen door.',
  ]],
  beats: [{ kind: 'custom', goal: 'Find out who fired first.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    shots: [{ cam: 'quayTrench', look: 'shellZone', t: 9 }],
    lines: [N('A Continuum gun and an Unwritten gun fire in the same second.'), REV(N('Both shells hang in the air. One of them runs backwards.'))],
  },
  quarters: [
    {
      name: 'THE BATTLEFIELD',
      threads: [
        { id: 'orders', kind: 'scene', scene: 'orders', at: 'fieldOrders', spot: { prompt: 'THE FIELD ORDERS', offset: [0, 1.1, 0.8], r: 2.8, model: makeLogbook },
          goal: 'Read the field orders.', because: 'Both sides say the other fired first.', done: 'ev_field_orders', hints: M13_HINTS.orders, minutes: 2 },
        { id: 'shells', kind: 'tasks', of: ['inv_shellA_done', 'inv_shellB_done'], at: 'shellZone', after: ['orders'], goal: 'Hold a shell in flight. Then one from the other side.', because: 'Where do they come from? Run one back and see.',
          set: { ev_both_sides: true }, say: [K('Both of them go home. Each side is firing at its own last shot.')], hints: M13_HINTS.shells, minutes: 4 },
        { id: 'firstShot', kind: 'deduce', deduction: 'firstShot', at: 'shellZone', after: ['shells'], spotOpts: { offset: [0, 1.2, 6], r: 3 },
          goal: 'Who fired first?', because: 'Two shells, two guns, two sets of orders.', hints: M13_HINTS.first, minutes: 2 },
        { id: 'cross', kind: 'stealth', at: 'canyonGate', r: 4, after: ['firstShot'], goal: 'Cross the battlefield to the container canyon.', because: 'The fire comes round on a loop. So do the patrols.', hints: M13_HINTS.cross, minutes: 6 },
      ],
      sides: [
        { id: 'listeners', name: 'THE PEOPLE WHO LISTENED', giver: 'm13_listener', start: 'warned_evacuees', done: 'listeners_route', minutes: 2,
          threads: [{ id: 'listenTalk', kind: 'talk', npc: 'm13_listener', at: 'listenersRoute', goal: 'Someone from Loop City is waving.', because: 'They heard me at the tower.', done: 'listeners_route', hints: M13_HINTS.listeners, minutes: 2 }] },
      ],
    },
    {
      name: 'THE THREE DEVICES',
      threads: [
        { id: 'sera', kind: 'talk', npc: 'sera', at: 'canyonGate', after: ['cross'], goal: 'Sera is at the canyon gate.', because: 'She said both sides were asking for me.', done: 'sera_war', hints: M13_HINTS.sera, minutes: 2 },
        { id: 'devices', kind: 'tasks', of: ['dev_rail', 'dev_crane', 'dev_crater'], after: ['sera'],
          spots: [
            { id: 'dev_rail', scene: 'dev_rail', at: 'deviceRail', prompt: 'DEVICE ONE', offset: [0, 1.1, 1.2], r: 2.8, kit: 'deviceCase' },
            { id: 'dev_crane', scene: 'dev_crane', at: 'deviceCrane', prompt: 'DEVICE TWO', offset: [0, 1.1, 1.2], r: 2.8, kit: 'deviceCase' },
            { id: 'dev_crater', scene: 'dev_crater', at: 'deviceCrater', prompt: 'DEVICE THREE', offset: [0, 1.1, 1.2], r: 2.8, kit: 'deviceCase' },
          ],
          goal: 'Disable the three devices, each in its own year.', because: 'Nobody on either side can reach all three. I can.', hints: M13_HINTS.devices, minutes: 8 },
      ],
      sides: [
        { id: 'evidence', name: 'THE NINTH MINUTE: EVIDENCE', done: 'ev_witness_cause', minutes: 5,
          threads: [
            { id: 'casing', kind: 'scene', scene: 'casing', at: 'wagonDoor', spot: { prompt: 'THE FIRST CASING', offset: [0, 1.1, 1.2], r: 2.6, model: NO_MODEL, when: '@PAST' },
              goal: 'The first device has a casing.', because: 'Somebody made it.', done: 'ev_casing', hints: M13_HINTS.casing, minutes: 2 },
            { id: 'burialRev', kind: 'tasks', of: ['rev_burial'], at: 'burialSite', after: ['casing'], set: { ev_witness_cause: true },
              say: [N('Under the soil, running backwards: a hand pressing it down. A scarred wrist.'), L('SERA', 'Somebody with your name did.')],
              goal: 'Somebody buried it in 2026.', because: 'Soil runs back too.', hints: M13_HINTS.burial, minutes: 3 },
          ] },
      ],
    },
    {
      name: 'THE STABILIZER',
      threads: [
        { id: 'stabilizer', kind: 'choice', scene: 'stabilizer', at: 'stabilizer', after: ['devices'], spot: { prompt: 'THE STABILIZER', offset: [0, 1.2, 2.2], r: 3.4, model: NO_MODEL },
          goal: 'The stabilizer: destroy it, or free the people in the frozen block.', because: 'It is what both sides are fighting for.', done: 'stabilizer_destroyed || civilians_freed', hints: M13_HINTS.stabilizer, minutes: 4 },
        // (shot from over the channel onto the frozen block: it stays frozen with its people still inside, or it has come
        // down and they walk out past the silos; warport.js builds both)
        { id: 'district', kind: 'cinema', after: ['stabilizer'], shots: [{ cam: [30, 7, -45], to: [36, 6, -50], look: [64, 5, -72], t: 9 }],
          lines: [N('The frozen block stays frozen, its people still inside. Around it the guns go on, but nothing repeats.', 'faction == "unwritten"'),
            N('The block thaws. Two hundred and twelve people walk out into the smoke. The Continuum holds the district now.', 'faction == "continuum"')],
          goal: 'Watch the district.', because: 'It will remember what I chose.', hints: M13_HINTS.district, minutes: 2 },
      ],
      sides: [
        { id: 'rollcall', name: 'THE ROLL CALL', done: 'ev_rollcall', minutes: 3,
          threads: [{ id: 'wallHold', kind: 'tasks', of: ['rev_shelterWall'], at: 'rollCall', set: { ev_rollcall: true }, say: [N('The wall stands while you hold it. The people behind the roll-call door get under it.')],
            goal: 'A wall is coming down on the roll-call door.', because: 'Two hundred and twelve names on it.', hints: M13_HINTS.rollcall, minutes: 3 }] },
      ],
    },
  ],
  talks: {
    sera: [
      {
        when: '!sera_war',
        lines: [L('SERA', 'This is not the future.'), K('What is it, then?'), L('SERA', 'The future that survives long enough to remember us.'),
          K('Both sides are shooting at their own last attack.'), SAYS('SERGEANT BRASK', 'SERGEANT', 'Then who fired first?'), K('Nobody. That\'s the point.')],
        set: { sera_war: true },
      },
      { when: 'sera_war', lines: [L('SERA', 'Three devices. Three years. Go.')] },
    ],
    m13_listener: [
      { when: '!listeners_route', lines: [LISTENER('You told us not to go up. We didn\'t. There is a way round the guns. Follow us.'),
        N('Two of them run west along the canyon lane with a flare. The patrol there turns to follow it.')], set: { listeners_route: true }, then: 'listenersRoute' },
      { when: 'true', lines: [LISTENER('Keep left of the cranes.')] },
    ],
  },
  scenes: {
    orders: {
      lines: [SAYS('A FREED PRISONER', 'CROWD_M', 'You let us out of the cells. We took these off a runner.', 'prisoners_freed'),
        N('A field order: ENEMY ARTILLERY FROM THE SOUTH AT 09:00. RETURN FIRE AT 09:09.'), N('Under it, the other side\'s: FROM THE NORTH AT 09:09. RETURN FIRE AT 09:00. Signed by nobody.')],
      set: { ev_field_orders: true }, log: 'Each side\'s orders answer the other\'s. Nobody signed them.',
    },
    dev_rail: { when: '@PAST', lines: [N('The first device, half buried in 2026 soil. It was planted before the war it starts. Kai pulls its core.')], set: { dev_rail: true } },
    dev_rail_no: { lines: [K('This one was buried in 2026. It only answers there.')] },
    dev_crane: { when: '@PRESENT', lines: [N('The second, in the crane cab, humming in 2049. Kai cuts it.')], set: { dev_crane: true } },
    dev_crane_no: { lines: [K('Not this year. This one hums in 2049.')] },
    dev_crater: { when: '@FUTURE', lines: [N('The third is a ruin in 2196, and still running. Kai switches it off.')], set: { dev_crater: true } },
    dev_crater_no: { lines: [K('It answers in 2196.')] },
    casing: { lines: [N('The casing, under the 2026 mud: HELIX. PROPERTY OF K. VAREN.')], set: { ev_casing: true } },
    stabilizer: {
      lines: [N('The stabilizer can freeze the district, and the war with it, or spend itself freeing the two hundred and twelve people locked in the frozen block.')],
      choices: [
        intent('challenge', 'Destroy it. End the loop.', { consequence: true, lines: [N('The stabilizer goes dark. The district stops repeating.'), L('SERA', 'My people will take its coil to your Chronolith. It will hold longer.')],
          set: { faction: 'unwritten', stabilizer_destroyed: true, inv_cap: 10 }, ev: 'stabilizer' }),
        intent('comfort', 'Redirect it. Free the people.', { consequence: true, lines: [N('The stabilizer spends itself on the block. The hanging floors come down slowly, like a breath let go.'), L('SERA', 'You chose them. I would have chosen the district. I am glad it was you. Give me your Chronolith a moment.')],
          set: { faction: 'continuum', civilians_freed: true, inv_cap: 10 }, ev: 'stabilizer' }),
      ],
    },
  },
  deductions: {
    firstShot: {
      question: [K('Two shells, two guns, two sets of orders. Who fired first?')],
      answers: [
        { intent: 'challenge', label: 'The Continuum.', lines: [K('Their shell went home to a Continuum gun. It was answering something too.')] },
        { intent: 'comfort', label: 'The Unwritten.', lines: [K('Theirs went home as well. Answering a shot that came before it.')] },
        { intent: 'investigate', label: 'Neither. Each side answers its own last shot.', correct: true, needs: 'ev_both_sides && ev_field_orders',
          lines: [K('Each order answers the other, and each shell goes home. Nobody started it. It keeps starting.')] },
      ],
      unproven: [K('One shell is not enough. I need one from each side, and their orders.')],
      set: { ev_nobody_first: true }, log: 'Nobody fired first. Each side answers its own last attack.',
    },
  },
  step: m13Step,
  // (a load while they lead the way: the flare is lit again, its patrol drawn off; a lure is not in the save)
  resumes: [{ when: 'listeners_route', until: 't_m13_cross', fx: 'listenersRoute' }],
  fx: {
    // the people who listened draw the canyon lane's patrol off with a flare (the way the signal flares lure a watcher):
    // for a minute and a half the lane through the canyons is clear
    listenersRoute(rt) {
      for (const s of rt.g.deckWorld?.sentinels || []) if (/_q0s0$/.test(s.def.id)) { s.lure = { x: -112, z: 30, t: 90 }; s.mode = 'patrol'; s.suspicion = 0; }
    },
  },
  rules: [
    { id: 'shellA', when: 'inv_shellA_done', say: [N('It climbs. Not south. North, over the Continuum line, back into a Continuum gun.')] },
    { id: 'shellB', when: 'inv_shellB_done', say: [N('It climbs south, over the Unwritten line, back into an Unwritten gun.')] },
    { id: 'cap', when: 'inv_cap >= 10', say: [N('REVERSE holds for ten seconds now.')] },
  ],
  overlay(P) {
    // Sera came to the war: in person in 2049, where the guns and Brask are; an echo in the port's other two years
    person(P, { id: 'sera', crew: 'sera', at: 'canyonGate', off: [-2, 0, 2.4], turn: Math.PI, prompt: 'TALK TO SERA', temporal: ['PRESENT'],
      echoLines: [N('Only an echo of Sera waits at this gate, in a year the war has not reached.'), L('SERA', 'Not here, Varen. Where the guns are.')] });
    person(P, { id: 'brask', crew: 'soldier', at: 'canyonGate', off: [2, 0, 2.6], turn: Math.PI, silent: true, when: '@PRESENT', barks: ['Three devices. Three years. Nobody on either side can reach all three.'] });
    person(P, { id: 'm13_listener', crew: 'm13_listener', first: 'A listener', seed: 1301, ambient: true, at: 'listenersRoute', off: [0, 0, 2], turn: Math.PI, when: 'warned_evacuees && !listeners_route', prompt: 'TALK TO THEM' });
    // (and once they have spoken, one of them leads the way through the canyons to the gate)
    person(P, { id: 'm13_listener_go', crew: 'm13_listener', first: 'A listener', seed: 1301, ambient: true, at: 'listenersRoute', off: [0, 0, 2], when: 'listeners_route && !t_m13_cross', silent: true,
      path: [[-50, 40], [-50, 30], [-30, 30], [-10, 20], [16, 12]], speed: 1.3 });
    person(P, { id: 'm13_freed', crew: 'm13_freed', first: 'Freed prisoner', seed: 1302, ambient: true, at: 'fieldOrders', off: [1.8, 0, 1.4], turn: Math.PI, silent: true, when: 'prisoners_freed' });
  },
  hook: { cue: 'cliff', minutes: 1, lines: [N('The stabilizer\'s last pulse tears a fracture open.'), L('SERA', 'You\'re coming with me.'), K('Where?'), L('SERA', '2196. Where they teach your name.')] },
  done: 't_m13_district',
};
M13.outro = M13.hook.lines;

export const ACT2 = [M09, M10, M11, M12, M13];
