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
import { shellHome, posePeople } from './stagefx.js';

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
  loop1: ['Nine minutes, then everything goes back. I should watch it happen once.', 'The whole street resets at the end of the loop. The quay is a safe place to watch from.', 'Stay on the quay and watch the street through one whole reset.'],
  loop2: ['The patrol walked a different round last time. I should watch again.', 'Each reset moves the market\'s patrol onto a new round.', 'Watch the market\'s patrol through one more reset, and learn its round.'],
  clockA: ['Three clocks hold the loop to the transmitter. The first one is close.', 'The first clock hangs under the loggia.', 'Go under the loggia and stop the first clock.'],
  order: ['Everyone is walking the same way, as if somebody told them to.', 'The order board stands by the funicular\'s middle station.', 'Read the order board now, then switch to 2026 and read it again.'],
  clockB: ['The second clock is where the patrol walks past every forty seconds.', 'It stands at the funicular\'s middle station, where the terrace patrol turns back.', 'Wait until the patrol has passed, then stop the second clock unseen.'],
  clockC: ['The third clock is the one that starts the morning again.', 'It hangs above the cathedral steps.', 'Climb to the cathedral steps and stop the third clock.'],
  transmitter: ['The three clocks are stopped. Now the loop only has its voice.', 'The transmitter stands out on the headland.', 'Go out to the headland and cut the transmitter\'s carrier.'],
  rhea: ['Someone at the tower is counting the resets. She was on the radio.', 'She is somewhere at the foot of the tower.', 'Go to the foot of the tower and find Rhea.'],
  tower: ['From the top of the tower you can see into the chamber.', 'Up there I can look right across the river.', 'Climb the tower all the way to the top.'],
  reset: ['It is nearly 08:14, and the loop has nothing left to hold it.', 'The last reset is coming, and it will not come round again.', 'Stay where you are and let the last reset come.'],
  warn: ['The evacuees are climbing toward the tower before 08:12.', 'The board sent them there, and that order was cancelled at 08:09.', 'Talk to the evacuees by the headland stair and quote the cancelled order.'],
  child: ['A girl at the edge of the loop does not reset. Everyone else goes round.', 'She is at the loop\'s edge, where the street stops repeating.', 'Go to the girl and hum her song back to her.'],
  brask: ['A Continuum sergeant is watching me, not the street. He remembers the loops.', 'He is standing by the funicular station, at the foot of the hill.', 'Go to the funicular station and talk to the sergeant.'],
};
const EVAC = AMB('CROWD_F2');
// each reset moves the patrols (the watchers of quarters 1 and 2: their ids end _q1s0, _q2s0)
// (each round's paths keep to open ground: the square round the loggia, the street east of its houses)
const M09_PATROLS = [
  { q1s0: [[-50, 24], [-12, 24], [-12, 56], [-50, 56]], q2s0: [[32, 30], [66, 30], [66, 54], [32, 54]] },
  { q1s0: [[-54, 22], [-10, 22], [-10, 58], [-54, 58]], q2s0: [[32, 36], [68, 36], [68, 58], [32, 58]] },
  { q1s0: [[-54, 22], [-48, 22], [-48, 58], [-20, 58]], q2s0: [[32, 44], [62, 44]] },
];

// the loop's clock (the year's label): 08:05 at a reset, a minute on every ninth of the loop, 08:13 once the carrier is cut
export function loopClock(left, period, cut) {
  if (cut || !(period > 0)) return '08:13';
  const m = 5 + Math.min(8, Math.max(0, Math.floor(((period - left) / period) * 9)));
  return `08:${String(m).padStart(2, '0')}`;
}
// the chamber across the river, through its skylight (v2.1.1 playtest M15: the tower's payoff was captions over the
// rooftops): a small set under the market square, there only while the tower's lines play (m09_tower_view): the second
// ring humming in the dark, a console, and a man at it who looks up. Its centre, the skylight 5 m over it
const M09_CHAMBER = [-22, -40, 36];
function m09TowerShots(rt) {
  const g = rt.g, p = g.player.pos, [cx, cy, cz] = M09_CHAMBER;
  const dur = (l) => g.hud.durFn?.(l) || Math.max(2.2, l.text.length * 0.055);
  const ls = rt.deck.scenes.tower.lines;
  return [
    // (from the top of the mast, over the quay's roofs and the river, south to the Ring Hill, where the chamber is)
    { cam: [p.x - 0.5, p.y + 7.5, p.z + 1], to: [p.x - 0.4, p.y + 7.4, p.z + 1.8], look: [p.x + 22, p.y + 4, p.z + 300], t: dur(ls[0]) * 0.4 },
    // (down through the skylight's ring: the ring, the console, the man turning it; he looks up)
    { cam: [cx + 0.5, cy + 4.6, cz + 4.8], to: [cx + 0.4, cy + 4.4, cz + 4.4], look: [cx + 0.3, cy + 0.8, cz + 1.4], t: dur(ls[0]) * 0.6 + dur(ls[1]) },
    // (Kai, close, from in front of him on the gallery, the river behind the camera)
    { cam: [p.x + 0.9, p.y + 1.0, p.z + 2.2], to: [p.x + 0.7, p.y + 1.0, p.z + 1.8], look: [p.x, p.y + 0.75, p.z] },
  ];
}
// Mission 9 each frame: the loop's clock in the year's label; Brask, asked for help, has clock B's patrol look the other
// way until the clock is stopped (M12); the tower's view, staged (M15)
function m09Step(rt) {
  const g = rt.g, f = g.facts;
  rt.cinema?.watchShow?.('m09_tower_view', m09TowerShots);
  const lab = `2049 · ${loopClock(rt.loopT, rt.loopPeriod?.(), f.get('transmitter_cut'))}`;
  if (g.hud?.states && rt.m09Label !== lab) {
    rt.m09Label = lab;
    g.hud.states = g.hud.states.map((st) => (st.key === 'PRESENT' ? { ...st, label: lab } : st)); // (a new list: the HUD draws it again)
  }
  if (f.get('m09_brask') === 'help' && !f.get('clk_b')) {
    for (const s of g.deckWorld?.sentinels || []) if (/_q2s2$/.test(s.def.id) && s.mode !== 'chase') s.suspicion = 0;
  }
}

export const M09 = {
  key: 'm09', n: 9, chapter: 'act2', name: 'NINE MINUTES TO ZERO', title: 'Loop City', subtitle: 'The city repeats the same nine minutes. Positions change. You do not.',
  logline: 'Rain City North, 08:05 to 08:14, again and again.',
  place: 'northbank', sectors: 1, states: ['PRESENT', 'PAST'], drones: [1, 1, 3, 0, 0], ambience: 'rain', ambient: 'loop',
  labels: { PRESENT: '2049 · 08:05' }, motto: 'YOU HAVE NINE MINUTES', gate: 'THE TOWER', crew: C('engineer'),
  named: ['engineer', 'soldier', 'child'],
  minutes: { main: 33, optional: 8 }, autoExit: 1.2, gateAfter: true,
  // the loop: every minute the street goes back to 08:05 (the patrols to their next round, the rain upward for a second);
  // it stops when the carrier is cut. The year's label is the loop's clock, 08:05 to 08:13 (m09Step). (v2.1.1 playtest
  // L37: every ninety seconds, with the label standing at 08:05, the first two objectives were three minutes of
  // standing still)
  loop: { period: 60, upward: true, until: 'transmitter_cut', variants: M09_PATROLS.map((watch) => ({ watch })) },
  // (the quay's promenade, not its houses; east of the ferry steps, so where Kai steps off to watch the street is out of
  // its sight: v2.1 playtest F15, caught at the spawn while doing as the objective asked)
  // (v2.1.1 playtest M12: and clock B's patrol, on the second terrace at 12 m, turning back at the clock every forty
  // seconds, as the objective says; Brask, asked to help, has it look the other way, m09Step)
  watch: [[[[12, 78], [50, 78], [50, 86], [12, 86]]], [M09_PATROLS[0].q1s0], [M09_PATROLS[0].q2s0, [[20, 79], [60, 79]], { y: 12, path: [[22, -18], [69, -18]] }]],
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
        // (the closing pass: the Continuum's sergeant, who keeps every loop, in person before Missions 13 and 21)
        { id: 'brask', kind: 'talk', npc: 'brask9', at: 'funicularStation', after: ['order'], goal: 'A Continuum sergeant is watching me, not the street.', because: 'He looks at me the way I look at the clocks.', done: 'm09_brask', hints: M09_HINTS.brask },
        { id: 'clockB', kind: 'scene', scene: 'clockB', at: 'clockB', after: ['brask'], spot: { prompt: 'CLOCK B', offset: [0, 1.4, 0.6], r: 2.8, model: NO_MODEL },
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
        // (its prompt goes with the carrier: it took the focus at the mast's foot from the tower's, v2.1.1 playtest L19)
        { id: 'transmitter', kind: 'scene', scene: 'transmitter', at: 'transmitter', after: ['clockC'], spot: { prompt: 'THE TRANSMITTER', offset: [0, 1.4, 2.4], r: 3.2, model: NO_MODEL, when: '!transmitter_cut' },
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
    soldier: [
      {
        when: '!m09_brask',
        lines: [CREW('You again. The eleventh time round, you always come up the funicular steps.'), K('You remember the loops.'),
          CREW('Every one. My orders reset. I don\'t. That is the Continuum\'s whole argument, Varen. Imagine everyone like me.')],
        choices: [
          intent('investigate', 'Who sent them to the tower?', { lines: [CREW('Helix North, at five past eight. The cancellation came at nine past. Nobody in a loop reads past five past.')], set: { m09_brask: 'asked' } }),
          intent('challenge', 'Then help me break it.', { lines: [CREW('Break it, and I still remember everything. Go on. I\'ll be looking the other way at clock B.')], set: { m09_brask: 'help' } }),
          intent('withdraw', 'Let me pass.', { lines: [CREW('Pass. You will anyway. You always do.')], set: { m09_brask: 'passed' } }),
        ],
      },
      { when: 'm09_brask', lines: [CREW('Clock B. Go.')] },
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
      set: { ev_ninth_view: true }, log: 'From the tower at 08:13: a man at the console, looking back at me.', show: 'm09_tower_view',
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
    // (a step clear of the fence round the mast: she stood in its panel)
    person(P, { id: 'engineer', crew: 'engineer', at: 'towerBase', off: [2.3, 0, 2.1], turn: Math.PI, prompt: 'TALK TO RHEA' });
    person(P, { id: 'brask9', crew: 'soldier', at: 'funicularStation', off: [-2.4, 0, -2], turn: 0.6, prompt: 'TALK TO THE SERGEANT', barks: ['You did that already. No—you\'re about to do it. I hate that I know the difference.'] });
    person(P, { id: 'm9_evac', crew: 'm9_evac', first: 'Evacuee', seed: 901, ambient: true, at: 'headlandStair', off: [2.2, 0, 2.4], turn: Math.PI, when: '!warned_evacuees', prompt: 'TALK TO THE EVACUEES' });
    person(P, { id: 'm9_evac_safe', crew: 'm9_evac', first: 'Evacuee', seed: 901, ambient: true, at: 'ferryQuay', off: [-6, 0, -2], when: 'warned_evacuees', prompt: 'TALK TO THE EVACUEES' });
    person(P, { id: 'child9', crew: 'child', at: 'loopEdge', off: [0, 0, -0.6], turn: Math.PI, hologram: true, silent: true, when: '!child_step2' });
    // the chamber across the river, seen from the tower (M15): only while the tower's lines play, under the market square
    const [cx, cy, cz] = M09_CHAMBER;
    P.col([cx - 7, cy - 0.4, cz - 7, cx + 7, cy, cz + 7]); // (its floor, under the town: the man stands on it)
    P.W('m09_tower_view', () => {
      P.vbox([cx - 7, cy - 0.4, cz - 7, cx + 7, cy, cz + 7], 'rawConcrete');
      for (const [x0, z0, x1, z1] of [[-7, -7, 7, -6.6], [-7, 6.6, 7, 7], [-7, -7, -6.6, 7], [6.6, -7, 7, 7]]) P.vbox([cx + x0, cy, cz + z0, cx + x1, cy + 5, cz + z1], 'rawConcrete');
      P.torus(cx, cy + 2.6, cz - 1.6, 2.4, 0.32, 'blackRing', { seg: 36 }); // (the second ring, standing)
      P.glow(cx, cy + 0.02, cz - 1.6, 3.2, 0xb6a6ff);
      P.box([cx - 0.9, cy, cz + 0.4, cx + 0.9, cy + 1.0, cz + 1.1], 'steel', { solid: false }); // the console
      P.vbox([cx - 0.75, cy + 1.0, cz + 0.5, cx + 0.75, cy + 1.04, cz + 1.0], 'ledGlow', { noShadow: 1 });
      P.torus(cx, cy + 5, cz, 3.2, 0.18, 'oculusRim', { rx: Math.PI / 2, seg: 36 }); // the skylight's ring, over it all
      P.glow(cx, cy + 0.03, cz + 0.8, 2.2, 0xdce8ff);
    });
    P.npcs.push({ id: 'm9_ninth', crew: 'witness', pos: [cx + 0.3, cy, cz + 2.0], yaw: 0.15, silent: true, when: 'm09_tower_view', room: P.rid }); // (turned from the console, up to the skylight)
  },
  hook: { cue: 'cliff', minutes: 1, lines: [N('The city resets. Kai does not.'), K('I remember. I remember all of it.'), SAYS('A SOLDIER', 'CROWD_M2', 'That one didn\'t reset.')] },
  done: 't_m09_reset',
  step: m09Step,
};
M09.outro = M09.hook.lines;

// =============================================================================================================
// Mission 10: ENEMIES WHO REMEMBER
// =============================================================================================================
const M10_HINTS = {
  escape: ['A trooper on the gallery is watching the way from the cells to the guard post.', 'He only looks one way, toward the cells. The yard on the hall\'s roof runs round behind him.', 'Go south out of the cell into the yard, round behind him, and up to the guard post.'],
  sera: ['That guard is watching me, and she has not raised the alarm.', 'She is standing at the guard post.', 'Walk up to the guard post and talk to the guard.'],
  power: ['The guards\' lamps are fed through both years. I can blind them.', 'There are two switches on the power run, one in each year.', 'Cut the power run in 2049, then switch to 2026 and cut that run too.'],
  projector: ['What did they take from me? They keep what they capture in one room.', 'Everything they took is in the testing chamber.', 'Go into the testing chamber and look at the projector.'],
  cross: ['The testing chamber has troopers of its own, between me and the spillway.', 'Echo Step throws a copy of me a step ahead, and the watchers follow the copy.', 'Use Echo Step where they can see it, then go for the spillway tunnel.'],
  prisoners: ['Twelve people are caught in loops of four seconds, over and over.', 'They are all in the loop cells.', 'Go to the loop cells and decide what happens to them.'],
  yard: ['Sera\'s skiff is down on the river, out under the open sky.', 'One trooper walks the gorge floor between the hall\'s south door and the water.', 'Watch him through the hall\'s windows, then go out of the south door behind his back, to the skiff.'],
  intake: ['The guard said "again". They have taken a Varen before.', 'The earlier intakes are kept at the intake desk.', 'Go to the intake desk and read the earlier intakes.'],
  office: ['The Director\'s office is empty, and whoever sits there knows my name.', 'The office is up on the crest.', 'Climb to the crest and look inside the Director\'s office.'],
  interview: ['They questioned everyone Helix ever paid. There is a recording of it.', 'An interview reel is waiting up on the crest.', 'Climb to the crest and play the interview reel.'],
  looper: ['A prisoner who remembers is trying to tell me something, four seconds at a time.', 'He is in one of the loop cells.', 'Stand by his cell and listen through his loops.'],
  skiff: ['Sera took her helmet off. She is waiting for me to say something.', 'She is down by the skiff.', 'Go down to the skiff and talk to Sera.'],
  flood: ['A flood pole on a roof, with marks higher than any water here.', 'It stands on the yard\'s roof.', 'Read the flood pole now, then switch to 2026 and read it again.'],
};
// the prisoner in the loop cells who remembers: four seconds a loop, and a few words in each
const LOOPER = AMB('CROWD_M2');

export const M10 = {
  key: 'm10', n: 10, chapter: 'act2', name: 'ENEMIES WHO REMEMBER', title: 'The Continuum\'s detention block', subtitle: 'They believe time must be controlled. Sera helps you out.',
  logline: 'A prison in a dam, on a snowy night.',
  place: 'dam', sectors: 1, states: ['PRESENT', 'PAST'], drones: [3, 2, 2, 1], ambience: 'hum', ambient: 'loop',
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
  // the Director watches the Loop City capture: whoever rook_fate made them; then the guard at the gallery post below,
  // who is Sera under a Continuum helmet, reads his intake and tells nobody (the closing pass: a cold open from the
  // other side of the bars)
  coldOpen: {
    first: true, minutes: 2, cue: 'card',
    shots: [{ cam: 'directorOffice', look: 'crestYard', t: 8 }, { cam: [7, 2.4, -2.5], to: [4.6, 2.1, -4.4], look: [0.6, 1.5, -9.6], t: 9 }],
    lines: [N('A capture feed from Loop City. A man who did not reset.'),
      L('ROOK', 'He didn\'t reset. Every version resets. Bring me the one who doesn\'t.', 'rook_fate == "persuade"'),
      SAYS('THE DIRECTOR', 'PRYCE', 'The director said nobody could keep their memory through a reset. I\'m the director now.', 'rook_fate == "expose"'),
      FX(SAYS('THE DIRECTOR', 'DIRECTOR', 'Hold him.', '!(rook_fate == "persuade") && !(rook_fate == "expose")'), 'radio'),
      FX(SAYS('THE GUARD', 'SERA', 'Gallery post. Prisoner is awake. Fifth intake of the same man, it says here.'), 'radio'),
      SAYS('THE GUARD', 'SERA', 'Four times they caught you, and four times you walked out. Show me how.')],
  },
  quarters: [
    {
      name: 'THE DETENTION BLOCK',
      threads: [
        { id: 'escape', kind: 'stealth', at: 'guardPost', r: 3, goal: 'Out of the cell to the guard post, unseen.', because: 'They remember my last attempt.', hints: M10_HINTS.escape, minutes: 6 },
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
            // (a switch cut offers nothing more: the 2049 one said its line again, v2.1.1 playtest L19)
            { id: 'sw49', scene: 'sw49', at: 'switch2049', prompt: 'THE 2049 SWITCH', offset: [0, 1.3, 0.8], r: 2.8, model: NO_MODEL, when: '!pw_49' },
            { id: 'sw26', scene: 'sw26', at: 'switch2026', prompt: 'THE 2026 SWITCH', offset: [0, 1.3, 0.8], r: 2.8, model: NO_MODEL, when: '!pw_26' },
          ],
          goal: 'Cut the power run in 2049 and in 2026.', because: 'Sera says the guards\' lamps are fed through both years.', set: { power_cut: true }, hints: M10_HINTS.power, minutes: 5 },
        // (the closing pass: the Continuum questioned everyone Helix employed after the Zero Second; the woman with no
        // past was one of them. Adult Mira, as Lin, in her own voice, on a reel)
        { id: 'interview', kind: 'scene', scene: 'interview', at: 'crestYard', after: ['power'], spot: { prompt: 'THE INTERVIEW REEL', offset: [6, 1.1, 3], r: 2.6, kit: 'reelPlayer' },
          goal: 'An interview reel on the crest.', because: 'Sera says they questioned everyone Helix ever paid.', done: 'ev_lin_interview', hints: M10_HINTS.interview },
      ],
      sides: [
        // (the closing pass: a flood pole the 2026 refurbishment marked at the crest, initialled by the man who knew)
        { id: 'flood', name: 'THE FLOOD POLE', done: 'ev_flood_mark', minutes: 2,
          threads: [{ id: 'floodRead', kind: 'residue', at: 'floodPole',
            record: { official: 'FLOOD POLE. HIGHEST WATER: 2031. NOTHING HAS EVER COME ABOVE THE GALLERY.', echo: 'At the very top, a mark painted by hand, still wet: THIS HIGH, ONE DAY. W.',
              hint: 'Old paint, under the Continuum\'s.', after: [K('W. In twenty twenty-six. Somebody already knew how high the water comes.')], prompt: 'THE FLOOD POLE', offset: [0, 1.4, 0.6], kit: 'tagPlate',
              log: 'The dam\'s flood pole: in 2026 somebody marked a flood at the crest, and signed it W.' },
            goal: 'A flood pole on the yard\'s roof.', because: 'Its marks go higher than any water here.', ev: 'flood_mark', hints: M10_HINTS.flood }] },
        { id: 'office', name: 'THE DIRECTOR\'S OFFICE', done: 'ev_director_office', minutes: 3,
          threads: [{ id: 'officeLook', kind: 'scene', scene: 'office', at: 'directorOffice', spot: { prompt: 'THE DIRECTOR\'S DESK', offset: [0, 1.1, 1.2], r: 2.8, model: NO_MODEL },
            goal: 'The Director\'s office is empty.', because: 'Whoever sits there knows my name.', done: 'ev_director_office', hints: M10_HINTS.office, minutes: 3 }] },
      ],
    },
    {
      name: 'THE TESTING CHAMBER',
      threads: [
        { id: 'projector', kind: 'scene', scene: 'projector', at: 'projector', after: ['interview'], spot: { prompt: 'THE CAPTURED WEAPON', offset: [0, 1.2, 1.4], r: 3, model: kit('deviceCase') },
          goal: 'The testing chamber: what they took from me.', because: 'Sera says they keep captured weapons there.', done: 'echo_step', hints: M10_HINTS.projector, minutes: 2 },
        // (a prisoner whose loop let him keep a little: each time Kai speaks to him he gets four seconds, and a few words)
        { id: 'looper', kind: 'talk', npc: 'm10_looper', at: 'loopCells', after: ['projector'], goal: 'A prisoner in the loop cells is trying to tell me something.', because: 'He gets four seconds at a time.', done: 'm10_l4', hints: M10_HINTS.looper },
        { id: 'prisoners', kind: 'choice', scene: 'prisoners', at: 'loopCells', after: ['looper'], spot: { prompt: 'THE LOOP CELLS', offset: [0, 1.2, 2], r: 3.4, model: NO_MODEL },
          goal: 'Twelve prisoners in unstable loops.', because: 'Four seconds, over and over.', done: 'ev_prisoners', hints: M10_HINTS.prisoners, minutes: 4 },
        // (the chamber has troopers of its own: an Echo Step's afterimage draws them off; the crossing counts once Kai has
        // stepped ahead of himself)
        { id: 'cross', kind: 'stealth', at: 'spillwayTunnel', r: 4, after: ['projector'], trigWhen: 'echo_steps >= 1', goal: 'Echo Step past the chamber\'s troopers to the spillway.', because: 'A step ahead of myself, the watchers follow the copy.', hints: M10_HINTS.cross, minutes: 4 },
      ],
    },
    {
      name: 'THE YARD',
      threads: [
        // (v2.1.1 playtest L17: the way out is the hall's south door; the spillway is walled off from the gorge)
        { id: 'yard', kind: 'stealth', at: 'seraSkiff', r: 4, after: ['cross', 'prisoners'], goal: 'Out of the hall\'s south door to Sera\'s skiff, past the yard\'s trooper.', because: 'Under the open sky, for the first time tonight.', hints: M10_HINTS.yard, minutes: 4 },
        { id: 'skiff', kind: 'talk', npc: 'sera_skiff', at: 'seraSkiff', after: ['yard'], goal: 'Sera, at the skiff.', because: 'She took her helmet off. She is waiting for me to say something.', done: 'm10_skiff', hints: M10_HINTS.skiff },
      ],
    },
  ],
  talks: {
    m10_guard: [
      {
        when: '!sera_met',
        lines: [N('The guard turns her face to the light.'), L('SERA', 'In my time, your face is on every memorial.'), K('For saving the world?'), L('SERA', 'For ending it.')],
        choices: [
          intent('investigate', 'Then why help me?', { lines: [L('SERA', 'Because the record is incomplete. Cut the power in both years and their lamps go blind.')], set: { sera_met: true }, ev: 'sera_doubt' }),
          intent('challenge', 'I haven\'t ended anything.', { lines: [L('SERA', 'Not yet. Move.')], set: { sera_met: true } }),
          intent('withdraw', 'Get me out first.', { lines: [L('SERA', 'Then move. The switch rooms are on the crown.')], set: { sera_met: true } }),
        ],
      },
      { when: 'sera_met', lines: [L('SERA', 'Two switches. 2049, then 2026. Go.')] },
    ],
    // (four seconds a loop: each time Kai speaks to him, the loop gives him a few words, then takes him back)
    // (his first three loops wait for his thread too, which comes after the projector: before it he answered LISTEN three
    // times and then went quiet, v2.1.1 playtest L21)
    m10_looper: [
      { when: 'echo_step && !m10_l1', lines: [LOOPER('Four seconds. Listen. Don\'t talk. Every time you talk, I lose one.')], set: { m10_l1: true } },
      { when: 'echo_step && m10_l1 && !m10_l2', lines: [LOOPER('A woman. No shadow. They kept her here two nights, then they let her go.')], set: { m10_l2: true } },
      { when: 'echo_step && m10_l2 && !m10_l3', lines: [LOOPER('She asked for a hospital. Rain City General. A ward with a number she would not say.')], set: { m10_l3: true } },
      { when: 'm10_l3 && !m10_l4', lines: [LOOPER('She said: tell the one who comes to stop looking for me where I was.'), K('Where she was. Helix. The cube.'), LOOPER('Four seconds. That is all I get. Let me out, or let me keep them.')], set: { m10_l4: true } },
      { when: 'm10_l4', lines: [LOOPER('Four seconds.')] },
    ],
    // Sera at her skiff, her helmet off (the closing pass: she gets a say before the hook)
    sera_skiff: [
      {
        when: '!m10_skiff',
        lines: [L('SERA', 'Get in. Keep your head below the gunwale. They count heads on the water.'), K('You said my face is on every memorial.'), L('SERA', 'Every memorial I have ever scrubbed the moss off.')],
        choices: [
          intent('challenge', 'Then why get me out?', { lines: [L('SERA', 'Because they want you more than I hate you. That is how I choose sides.')], set: { m10_skiff: true } }),
          intent('comfort', 'Thank you.', { lines: [L('SERA', 'Don\'t. I\'ll want something for it, and you won\'t like what.')], set: { m10_skiff: true } }),
          intent('investigate', 'What is it like, in your time?', { lines: [L('SERA', 'Rain that falls up on Tuesdays. Children who learn your name first. Get in the boat.')], set: { m10_skiff: true } }),
        ],
      },
      { when: 'm10_skiff', lines: [L('SERA', 'In. Now.')] },
    ],
  },
  scenes: {
    // (the Continuum's interview of Dr. Lin, the night of the Zero Second: Sergeant Brask asks, she answers in her own voice)
    interview: {
      lines: [FX(SAYS('SERGEANT BRASK', 'SERGEANT', 'State your name.'), 'recording'),
        FX(SAYS('DR. LIN', 'LIN', 'Lin. That is what the badge says. It is the only thing that says anything about me.'), 'recording'),
        FX(SAYS('SERGEANT BRASK', 'SERGEANT', 'No birth record. No schooling. Helix hired you on a date that never happened.'), 'recording'),
        FX(SAYS('DR. LIN', 'LIN', 'I know. I remember a kitchen. A boy who stopped a song too early. That is all I have.'), 'recording'),
        FX(SAYS('SERGEANT BRASK', 'SERGEANT', 'Where will you go?'), 'recording'),
        FX(SAYS('DR. LIN', 'LIN', 'Wherever they put me back together.'), 'recording'),
        K('Up, up, and stop. I always stopped it.')],
      set: { ev_lin_interview: true }, log: 'The Continuum interviewed Lin: no birth, no past, a kitchen and a boy who stopped a song too early.',
    },
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
    person(P, { id: 'sera', crew: 'sera', at: 'seraSkiff', off: [-1.6, 0, 1.2], turn: Math.PI, silent: true, when: '!t_m10_yard' });
    person(P, { id: 'sera_skiff', crew: 'sera', at: 'seraSkiff', off: [-1.6, 0, 1.2], turn: Math.PI, prompt: 'TALK TO SERA', when: 't_m10_yard' });
    // (the prisoner who remembers, at the glass of the second cell: his loop flickers him, like the rest, until they are let go)
    person(P, { id: 'm10_looper', crew: 'm10_looper', first: 'A prisoner', seed: 1003, ambient: true, at: 'loopCells', off: [-11.6, 0, -2.2], turn: Math.PI, flicker: true, when: '!prisoners_freed', prompt: 'LISTEN' });
    person(P, { id: 'dale_cell', crew: 'dale', at: 'loopCells', off: [-2.4, 0, 2.2], turn: Math.PI, hologram: true, silent: true, when: 'officer_trusted && !prisoners_freed' });
    person(P, { id: 'rook_cell', crew: 'rook', variant: 'old', at: 'loopCells', off: [2.4, 0, 2.2], turn: Math.PI, hologram: true, silent: true, when: 'rook_fate == "expose" && !prisoners_freed' });
  },
  hook: {
    cue: 'cliff', minutes: 1,
    lines: [L('SERA', 'Somebody at Rain City General is being put back together every morning. The readings come from Ward 32.'), K('Thirty-two.'), L('SERA', 'Means something to you?'), K('It\'s her age. It would be her age.')],
  },
  done: 't_m10_skiff',
};
M10.outro = M10.hook.lines;

// the watchers the gallery's and the crown's lamps light (quarters 0 and 1): the power cut blinds these
const LAMPS = /_q[01]s\d+$/;
// the gallery's lookout (dam.js: a round of one point): he stands looking west along the gallery, at the cells
const LOOKOUT = /_q0s2$/;
// the Continuum's watchers remember Kai's last attempt (§5 M10): after each catch (a setback with a watcher at his
// shoulder) every patrol starts its round further along, and looks a metre further, up to three
function m10Step(rt) {
  const g = rt.g, f = g.facts, p = g.player?.pos;
  const S = (rt.m10 ||= { catching: false, caught: false });
  if (!p) return;
  // (the lookout, back at his spot and not looking at anything else: west, along the gallery, v2.1.1 playtest M10)
  for (const s of g.deckWorld?.sentinels || []) {
    const w = s.def.path[0];
    if (LOOKOUT.test(s.def.id) && s.mode === 'patrol' && s.suspicion < 0.3 && Math.hypot(s.pos.x - w[0], s.pos.z - w[1]) < 0.3) s.dir.set(-1, 0, 0);
  }
  if (g.catching && !S.catching) S.caught = (g.deckWorld?.sentinels || []).some((s) => Math.hypot(s.pos.x - p.x, s.pos.z - p.z) < 1.8);
  const ended = S.catching && !g.catching;
  S.catching = !!g.catching;
  if (!ended || !S.caught) return;
  S.caught = false;
  f.inc('m10_caught');
  const n = f.get('m10_caught');
  const cp = Array.isArray(g.checkpoint) ? g.checkpoint : null;
  for (const s of g.deckWorld.sentinels) {
    const path = s.def.path;
    s.def.baseRange ??= s.def.range;
    s.def.range = Math.min(s.def.baseRange + Math.min(3, n), f.get('power_cut') && LAMPS.test(s.def.id) ? 3.5 : Infinity);
    if (path.length < 2) continue;
    // (never onto the place Kai has just been put back at: the yard's trooper, two points on his round, came round to
    // stand 6 m in front of the checkpoint, facing it, and caught him again as the fade lifted. v2.1.1 playtest H3)
    const near = (q) => cp && Math.abs(cp[1] - 0.86 - s.pos.y) < 3 && Math.hypot(q[0] - cp[0], q[1] - cp[2]) < s.def.range + 4;
    const k = [...path.keys()].map((i) => (s.wp + n + i) % path.length).find((i) => !near(path[i]));
    if (k === undefined) continue;
    s.pos.set(path[k][0], s.pos.y, path[k][1]); // (on its own floor: the chamber's troopers stand at -12 m)
    s.wp = (k + 1) % path.length;
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
    hints: ['The tray fell off its trolley, and everything on it.', 'Things that fell rise again, for as long as I hold them back.', 'Aim at the tray and hold REVERSE.'],
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
    hints: ['A glass of water spilled across the floor.', 'Spilled water runs back into its glass too.', 'Aim at the glass and hold REVERSE.'],
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
    hints: ['The door to the annex burned down.', 'Fire runs backwards here: the door can stand again.', 'Aim at the burnt door and hold REVERSE.'],
  },
  // the file the ward un-burns for three seconds in ten: readable only while Kai holds it
  {
    id: 'charredFile', kind: 'burn', at: 'charredFile', label: 'THE CHARRED FILE', weight: 0.5, max: 12, when: '@PRESENT', grain: 'fire', required: true,
    ambient: { period: 10, on: 3 }, scene: 'charredFile', prompt: 'READ THE FILE',
    props: [{ box: [-0.6, 0, -0.42, 0.6, 0.76, 0.42], mat: 'prop' }],
    parts: [{ shape: 'sheet', size: [0.34, 0, 0.44], mat: 'paper', at: [0, 0.775, 0], rot: [0, 1.5708, 0], text: ['RAIN CITY GENERAL', 'ADMISSION · WARD 32', '14-03-2026 · 16:40', 'VAREN, M. · AGE 9', '', '~Admitted by: K. Varen'] }],
    aim: [0, 0.8, 0],
    hints: ['The file is paper for three seconds in every ten.', 'I can hold it unburnt while I read it.', 'Hold REVERSE on the file, then read it while it holds.'],
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
    hints: ['Only the last bolt that went in will come out.', 'The 2026 tag, the twin lock and the chime all give the order the bolts went in.', 'Back them out last first: CRESCENT, then STAR, then BAR, then RING.'],
  },
  // R5: Odile's 2026 echo, walking her shift backwards; held, it runs forwards once and says what it says
  {
    id: 'odileEcho', kind: 'recording', at: 'odileStation', label: 'ODILE\'S ECHO', weight: 0.5, grain: 'pen', aim: [1, 1.3, -3.5], // (her echo, behind the counter)
    clip: { who: 'CREW', name: 'ODILE', voice: { id: 'ODILE' }, text: 'Thirty-two isn\'t missing. She\'s early.' },
    hints: ['Her 2026 echo walks her shift backwards.', 'Held back, a recording runs forwards once.', 'Aim at her echo and hold REVERSE.'],
  },
];
const M11_HINTS = {
  arrive: ['Sera\'s readings come from inside the hospital.', 'In through the atrium; triage is past it.', 'Walk in through the atrium to triage.'],
  music: ['Somewhere a music box is playing her song.', 'It gets quieter as I get closer. It is quietest where it is.', 'Follow the sound east, to where it is quietest.'],
  youngKai: ['Someone is sitting by the music box.', 'On the bench outside the children\'s wing.', 'Look at the boy on the bench.'],
  boy: ['The boy is drawing, waiting for a doctor.', 'He is on the bench, beside the music box.', 'Sit with him on the bench.'],
  hazards: ['Things here go back to where they were, hard.', 'Each one runs on its own cycle. Watch it go and come back, then cross.', 'Cross behind each one as it goes back, past the IV stand, to the records hall.'],
  rhythm: ['A file in the records hall keeps un-burning.', 'It is on a desk by the burnt annex door. Three seconds in ten it is paper.', 'Stand by that desk, beside the annex door, and watch the file.'],
  practise: ['Something has changed in me: I can hold one thing back.', 'The tray, the glass or the annex door. Any one of them.', 'Aim at the tray, the glass or the door and hold REVERSE.'],
  file: ['The file is paper for a moment. I can hold it there.', 'Hold it back with REVERSE, and read it while it holds.', 'Aim at the file, hold REVERSE, then read it.'],
  compare: ['Someone is missing from the medical records.', 'The ledger in the records hall, now and in 2026.', 'Read the ledger, switch to 2026, and read it again.'],
  odile: ['There is a nurse at the Ward 32 station.', 'Down the Ward 32 corridor, at her station.', 'Talk to Odile at the station.'],
  lock: ['The lock on Ward 32 comes apart in one order only.', 'The tag, the twin lock next door and the chime all give the order its bolts were fitted in.', 'Last fitted, first out: CRESCENT, then STAR, then BAR, then RING.'],
  ward: ['The readings come from Ward 32.', 'A file is lying on the bed.', 'Go in and read the file on the bed.'],
  photo: ['The family-room board has photos of one face.', 'The same board, now and in 2026.', 'Look at the board now, then switch to 2026 and look again.'],
  echo: ['Odile\'s 2026 echo walks her shift backwards.', 'At her station. A recording runs forwards once.', 'Aim at her echo and hold REVERSE.'],
  tape: ['The intercom reaches every ward. Odile is still on hers.', 'The intercom room is off the records hall.', 'Play Mira\'s tape on the ward intercom.'],
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

// Ward 32's bed, what the ward32 scene and the hook say is on it (playtest v2.1 F07: a pale box): a mattress, a pillow,
// a blanket; on the pillow Lin's lanyard, its card turned up; on the blanket a file, open, a photograph clipped to it.
// Larger than life by a little, so a phone shows them from the foot of the bed
function ward32Things() {
  const g = new THREE.Group();
  const mat = (c, o = {}) => (o.basic ? new THREE.MeshBasicMaterial({ color: c }) : new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? 0.85, metalness: 0 }));
  const box = (w, h, d, c, x, y, z, o = {}) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o));
    m.position.set(x, y + h / 2, z);
    if (o.ry) m.rotation.y = o.ry;
    if (o.rx) m.rotation.x = o.rx;
    g.add(m);
    return m;
  };
  box(1.05, 0.18, 2.05, 0xeef2f4, 0, 0, 0); // the mattress (head toward -z)
  box(0.7, 0.12, 0.42, 0xffffff, 0, 0.18, -0.72); // the pillow
  box(1.1, 0.05, 1.2, 0x7a9ab8, 0, 0.18, 0.42); // the blanket, folded back
  // Lin's lanyard: the strap in a loop on the pillow, the card on it
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.014, 6, 24), mat(0x2a6ab8));
  strap.rotation.x = Math.PI / 2;
  strap.position.set(-0.08, 0.31, -0.74);
  g.add(strap);
  box(0.12, 0.012, 0.17, 0xffffff, 0.07, 0.31, -0.62, { basic: true, ry: 0.3 });
  box(0.12, 0.013, 0.035, 0x2a6ab8, 0.07, 0.312, -0.69, { basic: true, ry: 0.3 });
  box(0.045, 0.014, 0.055, 0xc8a890, 0.05, 0.313, -0.6, { basic: true, ry: 0.3 }); // (her photo on the card)
  // the file, open on the blanket, a photograph clipped to its inside page
  box(0.36, 0.015, 0.46, 0xd8c08a, 0.12, 0.23, 0.32, { ry: -0.15 });
  box(0.33, 0.01, 0.42, 0xfbfaf6, 0.14, 0.245, 0.32, { basic: true, ry: -0.15 });
  for (let i = 0; i < 6; i++) box(0.2, 0.004, 0.012, 0x6a6e74, 0.18, 0.252, 0.22 + i * 0.045, { basic: true, ry: -0.15 });
  box(0.12, 0.006, 0.15, 0xf6f4ee, 0.05, 0.253, 0.2, { basic: true, ry: -0.15 });
  box(0.1, 0.006, 0.11, 0x8a7a68, 0.05, 0.257, 0.195, { basic: true, ry: -0.15 });
  box(0.04, 0.006, 0.05, 0xd8b8a0, 0.05, 0.259, 0.18, { basic: true, ry: -0.15 }); // (a woman's face, thirty-two)
  return g;
}
// the bed's things stand on the ward's bed (hospital.js: its top at 0.7 m, its head to the north), centred here
const W32 = (lm) => [lm[0], lm[1] + 0.7, lm[2] - 3.4];
// what the camera shows of them: the bed from its foot as the scene says what is on it; the file and its photograph,
// close, for the hook ("The photograph is Lin."), then the ward's glass
function m11WardShots(rt) {
  const lm = rt.level?.landmarks?.ward32;
  if (!lm) return null;
  const [x, y, z] = W32(lm);
  return [{ cam: [x + 0.7, y + 1.1, z + 2.0], to: [x + 0.45, y + 0.85, z + 1.5], look: [x, y + 0.2, z - 0.2] }];
}
function m11HookShots(rt) {
  const lm = rt.level?.landmarks?.ward32;
  if (!lm) return null;
  const [x, y, z] = W32(lm);
  return [
    { cam: [x + 0.32, y + 0.62, z + 0.85], to: [x + 0.24, y + 0.5, z + 0.7], look: [x + 0.08, y + 0.25, z + 0.28], t: 9 },
    { cam: [x + 0.9, y + 1.0, z + 1.6], to: [x + 0.6, y + 1.0, z + 1.2], look: [x, y + 1.1, z - 4.2], t: 6 },
  ];
}
// the lock's four bolts, close: as Kai first comes to it, and as the last one backs out (playtest v2.1 F07: from the
// game's camera they were small grey dots on a blue slab)
function m11LockShots(rt, open = false) {
  const d = rt.level?.landmarks?.ward32Door;
  if (!d) return null;
  const s = Math.sin(d[3] || 0), c = Math.cos(d[3] || 0);
  const at = (lx, ly, lz) => [d[0] + lx * c + lz * s, d[1] + ly, d[2] - lx * s + lz * c];
  const close = { cam: at(0.32, 1.48, 1.35), to: at(0.22, 1.44, 1.05), look: at(0, 1.4, 0.35), t: open ? 2.0 : 2.6 };
  return open ? [close, { cam: at(-0.6, 1.7, 3.4), to: at(-0.4, 1.7, 3.0), look: at(0, 1.6, -2.4), t: 2.8 }] : [close];
}

function m11Step(rt, dt) {
  const g = rt.g, lv = rt.level;
  if (!lv?.landmarks || !g.player) return;
  // (the Act II payoffs, staged: F07) the bed's things while the ward scene is said; the lock, close, the first time Kai
  // comes up to it with the lock thread his
  rt.cinema?.watchShow?.('m11_ward_view', m11WardShots);
  const door = lv.landmarks.ward32Door;
  // (once Kai has tried a bolt the lock is his: its close-up, held back by a line or a menu as he came up, no longer
  // breaks in after his first try and takes the camera from his next. v2.1.1 release check: the full bot's second bolt
  // found no target under it)
  const lp = !rt.m11LockSeen && rt.inv?.procs?.find((x) => x.rec.id === 'm11lock');
  if (lp && (lp.jamPart >= 0 || lp.partOut.some(Boolean) || rt.inv.active?.p === lp)) rt.m11LockSeen = true;
  if (door && !rt.m11LockSeen && rt.threads?.current?.()?.id === 'lock' && !rt.cinema?.active && !g.hud.talking && !g.menu
    && Math.hypot(g.player.pos.x - door[0], g.player.pos.z - door[2]) < 3.2) {
    rt.m11LockSeen = true;
    rt.cinema.play({ shots: m11LockShots(rt), lines: [], total: 2.6 });
  }
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
    lines: [N('2026.'), SAYS('NURSE ODILE', 'ODILE', 'Bed two. Varen, Mira. Nine years old. Fever, they said.'), N('The ink lifts off the whiteboard, letter by letter, back into the marker.'),
      SAYS('NURSE ODILE', 'ODILE', 'Not again. Please, not tonight.')],
  },
  quarters: [
    {
      name: 'TRIAGE & THE QUIET COLONNADE',
      threads: [
        { id: 'arrive', kind: 'go', at: 'triage', r: 4, goal: 'In through the atrium.', because: 'Sera\'s readings come from here.', say: [FX(L('PA', 'Temporal discontinuity.'), 'pa')], hints: M11_HINTS.arrive, minutes: 3 },
        { id: 'music', kind: 'go', at: 'musicBox', r: 3, after: ['arrive'], goal: 'Follow the sound that gets quieter as you approach.', because: 'A music box. Her song. It is quietest where it is.', hints: M11_HINTS.music, minutes: 4 },
        { id: 'youngKai', kind: 'scene', scene: 'young_kai', at: 'youngKaiBench', after: ['music'], spot: { prompt: 'THE BOY ON THE BENCH', offset: [0, 1.0, 1.2], r: 2.8, model: NO_MODEL },
          goal: 'Someone is sitting by the music box.', because: 'The song is his.', done: 'ev_young_kai', hints: M11_HINTS.youngKai, minutes: 1 },
        // (the closing pass: sit with him; the drawing is hers, and the sun on it is his to finish)
        { id: 'boy', kind: 'scene', scene: 'boy', at: 'youngKaiBench', after: ['youngKai'], spot: { prompt: 'SIT WITH HIM', offset: [1.4, 1.0, 1.0], r: 2.6, model: NO_MODEL },
          goal: 'Sit with the boy on the bench.', because: 'He is waiting for a doctor. He has waited here before.', done: 'm11_boy', hints: M11_HINTS.boy },
        { id: 'hazards', kind: 'go', at: 'recordsGate', r: 4, after: ['boy'], goal: 'Back across the courts to the records hall.', because: 'Things here go back to where they were, hard.', hints: M11_HINTS.hazards, minutes: 3 },
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
        // (after her talk: until then, on a phone, the echo's REVERSE label stood over TALK TO ODILE and took its tap, so
        // her first words were her echo's, v2.1.1 playtest L21)
        { id: 'echo', name: 'ODILE\'S SHIFT', done: 'inv_odileEcho_done', minutes: 2,
          threads: [{ id: 'echoRev', kind: 'invert', target: 'odileEcho', at: 'odileStation', after: ['odile'], goal: 'Odile\'s 2026 echo walks her shift backwards.', because: 'A recording runs forwards once.', hints: M11_HINTS.echo, minutes: 2 }] },
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
    boy: {
      lines: [N('You sit down beside him. He does not move up. He is twelve, and he is waiting for a doctor.'),
        SAYS('KAI, TWELVE', 'KAI12', 'They said wait here. I\'ve waited here four times.'), K('What are you drawing?'),
        SAYS('KAI, TWELVE', 'KAI12', 'It\'s hers. She did the ring and I\'m doing the sun, because she always does the sun wrong. She puts a face on it.'),
        FX(L('MIRA9', 'Kai! The sun has to have a face, or how does it see us?'), 'echo'),
        N('Down the corridor, behind a door that is not open, a nine-year-old laughs. The boy\'s pencil stops.'),
        SAYS('KAI, TWELVE', 'KAI12', 'If she gets better, I\'ll let her do the sun.')],
      choices: [
        intent('comfort', 'Tell him she gets better.', { say: 'She gets better.', lines: [SAYS('KAI, TWELVE', 'KAI12', 'You don\'t know that.'), K('No. I\'ve been trying to find out for a long time.')], set: { m11_boy: 'told' } }),
        intent('withdraw', 'Draw the face on the sun for him.', { say: 'Here. Like she does it.', lines: [N('You take his pencil and give the sun two eyes and a smile. He looks at it for a long time.'), SAYS('KAI, TWELVE', 'KAI12', 'That\'s wrong. That\'s how she does it.')], set: { m11_boy: 'drew' } }),
      ],
      log: 'I sat with myself at twelve, outside her ward. He was finishing her drawing.',
    },
    lock: { when: 'inv_m11lock_done', lines: [N('The last bolt backs out and stays out. Nothing pushes it back in. The door to Ward 32 slides up.')], set: { lock_open: true }, log: 'The lock came apart the way it went together, last bolt first.' },
    lock_no: { lines: [K('Forwards, it only tightens. Last bolt first.')] },
    charredFile: { when: 'rev_charredFile', lines: [N('For as long as Kai holds it, the file is paper. Ward 32, the fourteenth of March 2026. VAREN, M., nine. At the bottom, in an older hand:'), N('ADMITTED BY: K. VAREN.'), K('My name. Not my handwriting. Not yet.')], set: { ev_admitted_by: true }, log: 'Mira, nine, Ward 32. ADMITTED BY: K. VAREN, in an older hand.' },
    charredFile_no: { lines: [L('NONE', 'Ash on a desk by the annex door. For three seconds in every ten it is paper again.', '!has_inversion'), L('KAI', 'It goes back to ash. I have to hold it unburnt, and read it while it holds.', 'has_inversion')], then: 'unlock' },
    maintTag: { when: '@PAST', lines: [N(CLUE_TAG)], set: { ev_lock_order: true }, log: 'The 2026 tag: RING, BAR, STAR, CRESCENT.' },
    maintTag_no: { lines: [K('A maintenance tag, bleached blank. In 2026 it was new.')] },
    twinLock: { lines: [N(CLUE_TWIN), K('Last in, first out.')], set: { ev_lock_order: true } },
    chime: { lines: [N(CLUE_CHIME), K('Fitted low to high. So they come out high to low.')], then: 'chime' },
    ward32: { lines: [N('Ward 32. A bed that puts itself back together every morning. On the pillow, Lin\'s lanyard. On the blanket, a file.')], set: { ward32_read: true }, show: 'm11_ward_view' },
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
    // (the lock, close, as its last bolt backs out, and the door going up: F07)
    lockOpen: (rt) => {
      const shots = m11LockShots(rt, true);
      if (shots && rt.cinema && !rt.cinema.active) rt.cinema.play({ shots, lines: [], total: 4.8 });
      rt.playNode(rt.deck.scenes.lock, null, 'lock');
    },
    chime: (rt) => rt.inv?.chime(),
  },
  step: m11Step,
  overlay(P) {
    // Ward 32's bed: the mattress and blanket, Lin's lanyard and the file with her photograph (F07). A prop, the edition's
    // way (as Threads.placeThreads' props): a model with no reach, so nothing offers it and it plays no scene (the bed's
    // scene is THE FILE ON THE BED's, ward32)
    if (P.landmarks.ward32) P.inter.push({ id: 'ward32_things', kind: 'scene', scene: null, pos: W32(P.landmarks.ward32), yaw: 0, r: 0, prompt: '', model: () => ward32Things(), room: 'h_ward32' });
    // the reversing lock's housing on Ward 32's door (v2.1.1 playtest P7: the lock read as a blue slab with four pale dots):
    // a steel plate with a dark frame, a brass socket round each bolt and its name stamped under it; gone with the door
    const dr = P.landmarks.ward32Door;
    if (dr) P.W('!inv_m11lock_done', () => {
      const [x, y, z] = dr;
      P.vbox([x - 0.66, y + 0.84, z, x + 0.66, y + 1.96, z + 0.05], 'steel');
      for (const [x0, y0, x1, y1] of [[-0.7, 0.8, 0.7, 0.86], [-0.7, 1.94, 0.7, 2.0], [-0.7, 0.8, -0.64, 2.0], [0.64, 0.8, 0.7, 2.0]]) P.vbox([x + x0, y + y0, z, x + x1, y + y1, z + 0.08], 'ironDark');
      LOCK_ORDER.forEach((name, i) => {
        const bx = x + (i % 2 ? 0.34 : -0.34), by = y + (i < 2 ? 1.66 : 1.14);
        P.torus(bx, by, z + 0.06, 0.16, 0.025, 'brass', { seg: 24 });
        P.text(name, [bx, by - 0.22, z + 0.06], 0, { size: 0.055, color: '#1e242c' });
      });
    });
    person(P, { id: 'odile', crew: 'odile', at: 'odileStation', off: [0, 0, 1.4], turn: Math.PI, prompt: 'TALK TO ODILE' });
    // (behind the station's counter, facing the ward's door: she stood inside the counter)
    person(P, { id: 'odile_echo', crew: 'odile', at: 'odileStation', off: [1, 0, -3.5], hologram: true, silent: true, when: '!inv_odileEcho_done' });
    person(P, { id: 'kai12', crew: 'kai12', at: 'youngKaiBench', off: [0, 0, 0.4], turn: Math.PI, hologram: true, silent: true, when: '@PRESENT' });
  },
  hook: {
    cue: 'cliff', minutes: 1, shots: m11HookShots, // (the file and its photograph, close; then the ward's glass: F07)
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
  chase: ['The figure is running across the roofs. He has my walk.', 'He waits at the glass when I fall behind. Stay close to him.', 'Keep running after him across the roofs, toward the glass panes.'],
  follow: ['He stepped off the roof into 2026.', 'In 2026 there was a gangway across, at the roof\'s edge by the court.', 'Go to the roof\'s edge by the court and switch to 2026 there.'],
  corridor: ['Corridor B only existed in 2026: a gangway across.', 'Stay in 2026 and walk the gangway.', 'Cross the 2026 gangway to its far end, where the flowers are.'],
  ruin: ['His steps go on in 2196, where the north wing fell.', 'East, past the court, into the ruin.', 'Switch to 2196 and walk east into the ruin.'],
  panes: ['He stops at glass, the same stop in every year.', 'His steps in the ruin, the roof\'s glass, the 2026 gangway\'s hoarding. The fire stair by the east wing climbs to the roof.', 'REVERSE his footsteps here, then climb the fire stair and look at the roof\'s glass.'],
  route: ['His route repeats. I have seen all of it now.', 'The roof, the gangway, the ruin: the same stops every time.', 'In the ruin, piece his route together.'],
  witnessStair: ['He went down the terraces, into the hill.', 'It is happening now. Watch where he goes.', 'Stay where you are and watch him go down.'],
  stair: ['He dropped the stair behind him.', 'A fallen thing rises while I hold it back.', 'Aim at the fallen stair and hold REVERSE, then climb down it while it holds.'],
  beam: ['A beam has fallen across the chamber\'s way.', 'It is at the foot of the stair. It can be held back like the stair.', 'Aim at the beam, hold REVERSE, and go under it while it holds.'],
  voicemail: ['My phone is playing something.', 'It plays by itself: a voicemail, received at 05:40.', 'Wait, and listen to the voicemail.'],
  face: ['He is waiting by the second Chronolith.', 'Down under the hill, at the second ring.', 'Walk to him at the second ring and talk to him.'],
  escape: ['He is leaving, the way he always does.', 'He steps into the fracture.', 'Stay and watch him go.'],
  rook: ['Corridor B has a gate, locked in 2026.', 'At the gangway\'s gate, in 2026.', 'Look at the gangway gate in 2026.'],
  bouquet: ['Something dropped on the gangway: florist\'s paper.', 'He was carrying it. It is on the 2026 gangway.', 'Look at the florist\'s paper on the gangway.'],
  whiteboard: ['The 2026 site lunch room has a board.', 'The lunch room is off the gangway, in 2026.', 'Read the lunch room\'s board in 2026.'],
  glazier: ['Somebody is shouting on the roof\'s edge.', 'Where he went through the glass, the roof cracked under her.', 'Go to the roof\'s edge and help her, or keep after him.'],
  holdGlass: ['A frame fell across her way.', 'A fallen thing rises while I hold it back.', 'Aim at the frame and hold REVERSE until she is clear.'],
  gangway: ['He has stopped at the far end of the gangway.', 'In 2026, where the flowers were. He is letting me catch up.', 'Walk up to him and look at him. Look under him.'],
  camp: ['Somebody has been living in the ruin.', 'By the east wing in 2196: a cot, a camp stove, a wall.', 'Look at the cot, the stove and the wall, in 2196.'],
  ring: ['The second ring is humming. Somebody inside it said my name.', 'It is happening now. Listen to it.', 'Stay by the ring and listen.'],
  practice: ['A tape recorder by his cot is running backwards.', 'It only runs in 2196. Held back, it plays forwards.', 'Aim at the recorder in 2196, hold REVERSE, and listen.'],
  deck: ['One planter on the roof he ran past without looking.', 'On the plant decks. It says one thing now and another in 2026.', 'Read the planter now, then switch to 2026 and read it again.'],
};
const GLAZIER = AMB('CROWD_F');
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
  // (the closing pass) the glazier's sunshade frame on the roof, down across the walkway where he tore into 2026: held,
  // it stands back up while she gets clear (2049 only)
  {
    id: 'roofFrame', kind: 'fall', at: 'glassPanes', label: 'THE FALLEN FRAME', weight: 1, when: '@PRESENT', grain: 'metal', creak: 0.5,
    parts: [
      { shape: 'box', size: [3.4, 2.6, 0.18], mat: 'steel', at: [-4, 1.3, 3], rest: { at: [-4, 0.2, 4.4], rot: [1.45, 0, 0.12] }, solid: true },
      { shape: 'box', size: [3.4, 0.5, 0.9], mat: 'wood', at: [-4, 2.75, 3], rest: { at: [-3.4, 0.28, 6], rot: [0.3, 0.5, 0] } },
    ],
    aim: [-4, 0.5, 4.6],
    hints: ['The frame fell across her way.', 'Fallen things rise.', 'REVERSE the frame, and hold it while she gets clear.'],
  },
  // (the closing pass) his tape recorder by the cot, in 2196, running backwards: held, it plays forwards once, and it is
  // him rehearsing what he will say to Kai
  {
    id: 'practice', kind: 'recording', at: 'eastRuin', label: 'HIS TAPE RECORDER', weight: 0.5, grain: 'pen', when: '@FUTURE', aim: [13, 1.0, -2.8],
    clip: { who: 'WITNESS', text: 'You\'re early. No. Kai, you\'re early. No. You were always early, and I was always late, and she was nine.' },
    hints: ['A tape recorder, running backwards.', 'A recording runs forwards once.', 'REVERSE his tape recorder.'],
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
    // (the closing pass: he speaks for himself, and a second shot comes in close on his hands, the flowers and the wrist)
    year: 'FUTURE', shots: [{ cam: [0.8, 2.6, -29], to: [0.4, 2.2, -30.5], look: [0, -4, -50], t: 7 }, { cam: [1.5, 1.3, -33.1], to: [1.2, 1.25, -33.4], look: [0, 1.0, -34.3], t: 8 }],
    cast: [{ crew: 'witness', at: 'sinkTerraces', off: [0, 0, 2.6], turn: Math.PI }],
    lines: [N('2196. On the rim where Helix\'s north wing stood, a man waits with white chrysanthemums.'), L('WITNESS', 'He comes up the east stair. He always comes up the east stair.'),
      L('WITNESS', 'White ones. She liked the yellow ones. I bring the white ones anyway.'), REV(N('On his wrist, a scar.')), N('He whistles three notes, slowly.')],
  },
  quarters: [
    {
      name: 'THE CHASE — 2049',
      threads: [
        { id: 'chase', kind: 'chase', npc: 'witness_chase', path: [[-24, 13.5, -41], [-8, 13.5, -42], 'northWing', 'plantDecks', 'glassPanes'], at: 'northRoofs', goal: 'Chase the figure across the roofs.', because: 'He has my walk.', hints: M12_HINTS.chase, minutes: 5 },
        // (the closing pass: Act II's question, played: the man Kai has chased for three missions, or the person in front of
        // him. She is seen again at the Spire, Mission 21, and on the Finale's road)
        { id: 'glazier', kind: 'choice', scene: 'glazier', at: 'glassPanes', after: ['chase'], spot: { prompt: 'THE GLAZIER', offset: [-4, 1.2, 1.8], r: 3, model: NO_MODEL, when: '@PRESENT' },
          goal: 'Somebody is shouting on the roof\'s edge.', because: 'The roof cracked where he went through it.', done: 'm12_glazier', hints: M12_HINTS.glazier },
        { id: 'holdGlass', kind: 'tasks', of: ['rev_roofFrame'], at: 'glassPanes', after: ['glazier'], when: 'm12_glazier == "saved"', until: 'm12_glazier == "left"',
          say: [GLAZIER('Eleven years on this roof. It never moved before tonight.'), GLAZIER('Go on, then. Whoever he is, he stood at the glass and waited for you.')],
          goal: 'Hold the fallen frame up while she gets clear.', because: 'It only has to stand for a few seconds.', hints: M12_HINTS.holdGlass },
        // (the closing pass: the roof he runs across every evening, and the one planter he never looks at: Lin's)
        { id: 'deck', kind: 'residue', at: 'plantDecks', after: ['holdGlass'],
          record: { official: 'PLANT DECK 4: ADOPTED BY DR. LIN. Yellow chrysanthemums, watered every evening at the same minute.', echo: 'In 2026 the roof was bare concrete. On the parapet, in chalk at a child\'s height: a ring, and a sun with a face. MIRA, 9.',
            hint: 'Chalk, under the planter. A child was up here once.', after: [K('She grows the yellow ones. He brings her the white ones.'), K('He runs past her flowers every evening, and never looks.')],
            prompt: 'THE PLANTER', offset: [0, 1.0, 1.4], model: 'none', log: 'Lin grows yellow chrysanthemums on the north roof. In 2026 a nine-year-old chalked a sun with a face there.' },
          goal: 'One planter on the roof he ran past without looking.', because: 'Everything else up here he touched.', hints: M12_HINTS.deck },
        { id: 'follow', kind: 'go', at: 'gangway2026', r: 4, after: ['deck'], goal: 'He stepped off the roof into 2026. Follow.', because: 'In 2026 there was a way across.', hints: M12_HINTS.follow, minutes: 3 },
      ],
    },
    {
      name: 'THE CORRIDOR THAT WAS — 2026',
      threads: [
        { id: 'corridor', kind: 'go', at: 'bouquet', r: 3, after: ['follow'], goal: 'Across Corridor B, the gangway that only existed in 2026.', because: 'He uses the building the way I know it.', hints: M12_HINTS.corridor, minutes: 4 },
        // (he waits for Kai on the gangway, in a year in which he casts no shadow: C9)
        { id: 'gangway', kind: 'talk', npc: 'witness_gangway', at: 'bouquet', after: ['corridor'], goal: 'He has stopped at the far end of the gangway.', because: 'He is letting me catch up.', done: 'm12_no_shadow', hints: M12_HINTS.gangway },
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
        { id: 'ruin', kind: 'go', at: 'eastRuin', r: 5, after: ['gangway'], goal: 'Into 2196, where the north wing fell.', because: 'His steps go on there.', hints: M12_HINTS.ruin, minutes: 2 },
        { id: 'panes', kind: 'clue', need: 2, of: ['ev_pane_roof', 'ev_pane_gangway', 'ev_steps'], after: ['ruin'],
          spots: [
            { id: 'pane_roof', scene: 'pane_roof', at: 'glassPanes', prompt: 'THE GLASS', offset: [0, 1.2, 0.6], r: 2.8, model: NO_MODEL, when: '@PRESENT' },
            { id: 'pane_gangway', scene: 'pane_gangway', at: 'gangway2026', prompt: 'THE HOARDING', offset: [-2.2, 1.2, 1], r: 2.8, model: NO_MODEL, when: '@PAST' },
          ],
          goal: 'Where he stopped, every time.', because: 'The same stop, in every year.', hints: M12_HINTS.panes, minutes: 2 },
        // (where he has been living, in the ruin: his bed made the way Kai makes one, one cup, a wall of small handprints)
        { id: 'camp', kind: 'tasks', of: ['ev_camp_cot', 'ev_camp_cup', 'ev_camp_wall'], after: ['panes'],
          spots: [
            { id: 'campCot', scene: 'campCot', at: 'eastRuin', prompt: 'A COT', offset: [12, 0.5, -4], r: 2.4, kit: 'bedside', when: '@FUTURE' },
            { id: 'campCup', scene: 'campCup', at: 'eastRuin', prompt: 'A CAMP STOVE', offset: [14, 0.9, -1.6], r: 2.2, kit: 'keepsake', when: '@FUTURE' },
            { id: 'campWall', scene: 'campWall', at: 'eastRuin', prompt: 'THE WALL', offset: [9.6, 1.4, -6.4], r: 2.6, kit: 'drawingFrame', when: '@FUTURE' },
          ],
          goal: 'Where he has been living, in the ruin.', because: 'Somebody has slept here, more than once.', hints: M12_HINTS.camp },
        { id: 'practice', kind: 'invert', target: 'practice', at: 'eastRuin', after: ['camp'], say: [K('He rehearses it. What he will say to me when I catch up.'), K('He still gets it wrong.')],
          goal: 'A tape recorder by his cot, running backwards.', because: 'Whatever is on it, he plays it every night.', hints: M12_HINTS.practice },
        { id: 'route', kind: 'deduce', deduction: 'route', at: 'eastRuin', after: ['practice'], spotOpts: { offset: [2, 1.2, 0], r: 3 }, goal: 'Reconstruct his route.', because: 'He repeats it.', hints: M12_HINTS.route, minutes: 3 },
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
        // (the closing pass: the second ring speaks, in a woman's voice, waking; the mystery is left standing)
        { id: 'ring', kind: 'cinema', after: ['face'], shots: [{ cam: [7, -8.6, -47], to: [5, -8.9, -49], look: [0, -6.4, -57], t: 14 }],
          lines: [FX(L('MIRA', 'Kai? Is that you? It\'s so dark in here.'), 'echo'), L('WITNESS', 'She always wakes up asking for you.'), K('Who is she?'),
            L('WITNESS', 'Ask me again in thirty years.'), FX(L('MIRA', 'Kai?'), 'echo')],
          goal: 'The second ring is humming.', because: 'Somebody inside it said my name.', hints: M12_HINTS.ring },
        { id: 'escape', kind: 'cinema', after: ['ring'], lines: [N('He steps back into a fracture. It closes behind him like water.')], goal: 'He is leaving.', because: 'He always leaves.', hints: M12_HINTS.escape, minutes: 2 },
      ],
    },
  ],
  talks: {
    witness: [
      {
        when: '!m12_faced',
        lines: [K('Who are you?'), L('WITNESS', 'The person you become when you refuse to let go.'), REV(N('He lifts his wrist. A circle with a broken halo, thirty years older than yours.')),
          L('WITNESS', 'You got yours at a train door. It aches when it rains. It always rains.')],
        // (the closing pass: face to face, Kai asks one thing)
        choices: [
          intent('investigate', 'Ask about the flowers.', { lines: [L('WITNESS', 'White chrysanthemums. For a girl who liked the yellow ones.'), K('Mira.'), L('WITNESS', 'Don\'t say her name here. The ring is listening.')], set: { m12_faced: true } }),
          intent('challenge', 'Ask why he runs.', { lines: [L('WITNESS', 'I don\'t run. I lead. You only ever follow what runs.'), K('Where are you leading me?'), L('WITNESS', 'Somewhere you can forgive me from.')], set: { m12_faced: true } }),
          intent('withdraw', 'Say nothing.', { lines: [N('You say nothing. He nods, as if it was the right answer, and the one he gave.')], set: { m12_faced: true } }),
        ],
      },
      { when: 'm12_faced', lines: [L('WITNESS', 'Go home, Kai.')] },
    ],
    witness_gangway: [
      {
        when: '!m12_no_shadow',
        lines: [L('WITNESS', 'Look down, Kai.'), K('You have no shadow.'), L('WITNESS', 'Not in this year. In this year I haven\'t happened yet.'), L('WITNESS', 'Neither have you, quite. Keep up.')],
        choices: [
          intent('investigate', 'Why do you wait for me?', { lines: [L('WITNESS', 'Because you always catch up at the glass. I like to see your face when you do.'), K('And what does it look like?'), L('WITNESS', 'Younger.')], set: { m12_no_shadow: true } }),
          intent('challenge', 'Stop running.', { lines: [L('WITNESS', 'Stop chasing, and we could both sit down.'), K('Then sit.'), L('WITNESS', 'Not here. I haven\'t happened yet.')], set: { m12_no_shadow: true } }),
        ],
      },
      { when: 'm12_no_shadow', lines: [L('WITNESS', 'Keep up.')] },
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
    glazier: {
      lines: [GLAZIER('Hey! You! The frame came down when he went through the glass. The roof is cracking under me!'), K('He\'s getting away.')],
      choices: [
        intent('comfort', 'Hold the frame up for her.', { consequence: true, lines: [K('Stay where you are. I can hold it.')], set: { m12_glazier: 'saved' } }),
        intent('investigate', 'Go after him.', { consequence: true, lines: [GLAZIER('Hey! Hey!'), N('Behind Kai she climbs down the cradle ropes on her own, slowly, and does not look up.'),
          N('At the gangway he has dropped a page, still warm from his pocket.'), K('My handwriting, older. HE CHASES. HE ALWAYS CHASES. LET HIM SEE THE STAIR.')],
        set: { m12_glazier: 'left', ev_witness_page: true }, log: 'I went after him and left the glazier. He dropped a page: HE CHASES. HE ALWAYS CHASES.' }),
      ],
    },
    campCot: { when: '@FUTURE', lines: [K('A cot, made with hospital corners. I make a bed like that. Nobody taught me.')], set: { ev_camp_cot: true } },
    campCup: { when: '@FUTURE', lines: [K('One cup, one spoon, coffee, black. He has been drinking it the way I drink it for a long time.')], set: { ev_camp_cup: true } },
    campWall: { when: '@FUTURE', lines: [N('A ruined wall covered in handprints in paint, every one at a nine-year-old\'s height, every one the same hand.'), K('He did these one at a time. From memory.')], set: { ev_camp_wall: true }, log: 'His camp in the ruin: my bed, my cup, a wall of one child\'s handprints.' },
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
    // the glazier on the roof's edge, where he tore into 2026; once Kai has held the frame, by the stair core, safe
    person(P, { id: 'm12_glazier', crew: 'm12_glazier', first: 'A glazier', seed: 1201, ambient: true, at: 'glassPanes', off: [-4, 0, 0.8], turn: Math.PI, silent: true, when: '@PRESENT && t_m12_chase && !t_m12_holdGlass && !(m12_glazier == "left")' });
    person(P, { id: 'm12_glazier_safe', crew: 'm12_glazier', first: 'A glazier', seed: 1201, ambient: true, at: 'glassPanes', off: [-9, 0, 8], turn: -Math.PI / 2, silent: true, when: '@PRESENT && t_m12_holdGlass' });
    // (in 2026, at the gangway's far end, where the flowers fall: no shadow)
    person(P, { id: 'witness_gangway', crew: 'witness', at: 'bouquet', off: [0, 0, 3], turn: 0, prompt: 'TALK TO HIM', when: '@PAST && t_m12_corridor && !m12_no_shadow' });
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
  cross: ['A sentry walks the sandbag line in front of the canyon gate.', 'The only gap is at the line\'s west end, by the containers. Wait behind a burnt truck and watch which way it faces.', 'As soon as it turns east, away from the gap, go: through the gap and on to the canyon gate.'],
  orders: ['Both sides say the other fired first. Their orders will say more.', 'The field orders lie by the quay trench, behind the sandbags.', 'Read the field orders by the quay trench.'],
  shells: ['A shell is hanging in flight over the field. Where did it come from?', 'Hold one back with REVERSE and watch where it goes. Then one from the other side.', 'At the shell zone, aim at a shell in flight and hold REVERSE. Then the other side\'s.'],
  first: ['Who fired first? I have both orders and both shells.', 'Each order answers the other. Each shell went home to the gun that fired it.', 'Nobody. Each side answers its own last shot.'],
  sera: ['Sera is waiting at the canyon gate.', 'At the canyon gate, with the sergeant.', 'Talk to Sera at the canyon gate.'],
  devices: ['Three devices, each answering in its own year.', 'The rail yard\'s in 2026, the crane cab\'s in 2049, the crater field\'s in 2196.', 'Disable each in its year: rail yard 2026, crane 2049, crater 2196.'],
  stabilizer: ['The stabilizer is in the silo yard. Both sides want it.', 'It can freeze the war, or free the people in the frozen block. Not both.', 'Go to the stabilizer in the silo yard and decide.'],
  district: ['The district will remember what I chose.', 'It is happening now, over the frozen block.', 'Stay and watch the district.'],
  casing: ['The first device has a casing. Somebody made it.', 'At the rail yard\'s wagon, in 2026.', 'Switch to 2026 and read the casing at the wagon.'],
  burial: ['Somebody buried the first device in 2026.', 'The burial site is by the crater field. Soil runs back too.', 'In 2026, aim at the fresh soil and hold REVERSE.'],
  listeners: ['Someone from Loop City is waving from the canyons.', 'On the listeners\' route, in the container canyon.', 'Talk to them. They know a way round the guns.'],
  rollcall: ['A wall is coming down on the roll-call door.', 'By the frozen block. Two hundred and twelve names are on that door.', 'Aim at the falling wall, hold REVERSE, and keep holding.'],
  block: ['The frozen block: two hundred and twelve people behind glass.', 'East of the stabilizer, across the rail bridge. Look in from the street, in 2049.', 'Stand at the frozen block\'s glass in 2049 and look in.'],
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
// the frozen block, staged as its scene is said (F07: a brick box with flat windows): a man in the lobby behind the glass
// on one knee, tying a shoe; three floors up, the kitchen hanging where it broke away, a woman at her stove, the steam
// over her kettle standing like glass; then Kai on the street, looking up, for Sera on the radio
const M13_BLOCK = { man: [66.4, 0, -63.3], kitchen: [66, 10.6, -59.8] };
function m13BlockShots(rt) {
  const g = rt.g, k = M13_BLOCK.kitchen, mn = M13_BLOCK.man, p = g.player.pos;
  const dur = (l) => g.hud.durFn?.(l) || Math.max(2.2, l.text.length * 0.055);
  const ls = rt.deck.scenes.block.lines;
  return [
    // (at the glass, low, in front of him; then the kitchen from its own height, the floor it stands on not in the way)
    { cam: [mn[0] + 1.3, 1.25, -60.6], to: [mn[0] + 0.8, 1.1, -61.3], look: [mn[0] - 0.1, 0.55, mn[2]], t: dur(ls[0]) },
    { cam: [k[0] + 1.9, k[1] + 1.4, k[2] + 2.9], to: [k[0] + 1.5, k[1] + 1.3, k[2] + 2.3], look: [k[0] - 0.4, k[1] + 0.95, k[2] + 0.1], t: dur(ls[1]) },
    { cam: [p.x + 3.2, p.y + 1.6, p.z + 5.2], to: [p.x + 2.6, p.y + 1.5, p.z + 4.4], look: [k[0], k[1] - 2, k[2]] },
  ];
}
// a shell, nose up (+y): a steel body, its brass driving band, an ogive nose
function shellBody() {
  const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0x5c626a, metalness: 0.7, roughness: 0.35 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc8a050, metalness: 0.8, roughness: 0.3 });
  const part = (geo, mat, y) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; g.add(m); };
  part(new THREE.CylinderGeometry(0.17, 0.17, 0.95, 14), steel, 0);
  part(new THREE.ConeGeometry(0.17, 0.45, 14), steel, 0.7);
  part(new THREE.CylinderGeometry(0.18, 0.18, 0.09, 14), brass, -0.32);
  return g;
}
// a shell held in flight, going home (F07: a 0.24 m shell nobody could see, the caption doing the work): its arc from
// where it fell back into the battery that fired it, a burning head and a trail the camera follows, a flash at the gun
function m13ShellHome(rt, which) {
  const g = rt.g, L = rt.level?.landmarks;
  const zone = L?.shellZone, gun = L?.[which === 'A' ? 'batteryA' : 'batteryB'];
  if (!zone || !gun || !rt.cinema) return;
  const from = which === 'A' ? [zone[0] - 3, zone[1] + 0.4, zone[2] + 2] : [zone[0] + 3, zone[1] + 0.4, zone[2] - 2];
  const to = which === 'A' ? [gun[0], gun[1] + 3.0, gun[2] + 3.5] : [gun[0], gun[1] + 3.0, gun[2] - 3.5];
  const far = Math.hypot(to[0] - from[0], to[2] - from[2]);
  // (v2.1.1 playtest P7: the shell is a shell, steel with a brass band, nose first along its arc; the glow is its tracer,
  // a small one at its tail: as big flat discs the glow and its trail were all a phone showed)
  const fx = rt.cinema.addFx(shellHome({ from, to, apex: Math.max(14, far * 0.2), dur: 3.4, delay: 0.3, size: 0.22 }));
  const body = shellBody(), a = new THREE.Vector3(), b = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  let bt = 0;
  rt.cinema.addFx({ obj: body, update(dt) {
    bt += dt;
    if (bt >= fx.end) return false;
    a.set(...fx.pos(bt + 0.07));
    b.set(...fx.pos(bt + 0.11)).sub(a);
    body.visible = bt > 0.3 && b.lengthSq() > 1e-10;
    body.position.copy(a);
    if (body.visible) body.quaternion.setFromUnitVectors(up, b.normalize());
    return true;
  }, dispose() { body.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); }); } });
  const dir = [to[0] - from[0], 0, to[2] - from[2]].map((v) => v / (far || 1));
  const side = [-dir[2], 0, dir[0]];
  const end = fx.end;
  const look = [0, 0, 0];
  rt.cinema.play({ shots: null, lines: [], total: end + 1.1, rig: (dt, t) => {
    const h = fx.pos(Math.min(t, end - 0.01));
    if (t < 1.1) return { cam: [from[0] - dir[0] * 7 + side[0] * 3, from[1] + 1.7, from[2] - dir[2] * 7 + side[2] * 3], look: h }; // (from where it fell, up at it)
    if (t < end - 0.8) { // (alongside it, behind and to one side)
      for (let i = 0; i < 3; i++) look[i] = h[i];
      return { cam: [h[0] - dir[0] * 16 + side[0] * 6, h[1] + 4, h[2] - dir[2] * 16 + side[2] * 6], look };
    }
    return { cam: [to[0] - dir[0] * 14 + side[0] * 7, to[1] + 3.5, to[2] - dir[2] * 14 + side[2] * 7], look: to }; // (at the gun)
  } });
}

function m13Step(rt) {
  const g = rt.g;
  rt.cinema?.watchShow?.('m13_block_view', m13BlockShots);
  posePeople(g);
  // until the crossing is done, a catch by the canyon gate walks Kai back to the shells, not to the gate: the gate's
  // arrival box reaches over the line between the battlefield and the next quarter (z 12), whose checkpoint is the gate
  // itself, so a catch there was the crossing made for him (v2.1 playtest review F03). main.stepDeck has just set it
  const cp = g.checkpoint, gate = rt.level?.landmarks?.canyonGate;
  if (gate && Array.isArray(cp) && !g.facts.get('t_m13_cross') && Math.hypot(cp[0] - gate[0], cp[2] - gate[2]) < 1 && g.room === rt.level.outdoorRoom) {
    const field = rt.level.checkpoints?.find((c) => c.id === 'shells');
    if (field) g.checkpoint = field.spawn;
  }
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
    // (the closing pass: both sides give the same order, a second apart, before anyone fires)
    lines: [FX(SAYS('SERGEANT BRASK', 'SERGEANT', 'Ninth minute. They\'re about to fire. Fire first.'), 'radio'), FX(L('SERA', 'Ninth minute. They\'re about to fire. Fire first.'), 'radio'),
      N('A Continuum gun and an Unwritten gun fire in the same second.'), REV(N('Both shells hang in the air. One of them runs backwards.'))],
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
        { id: 'cross', kind: 'stealth', at: 'canyonGate', r: 4, after: ['firstShot'], goal: 'Cross the battlefield to the container canyon.', because: 'A sandbag line closes the field. Its one gap is watched, but the sentry walks a loop.', hints: M13_HINTS.cross, minutes: 6 },
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
        // (the closing pass: the people the choice is about, close enough to see, and one of them is Sera's)
        { id: 'block', kind: 'scene', scene: 'block', at: 'frozenBlock', after: ['devices'], spot: { prompt: 'THE FROZEN BLOCK', offset: [10, 1.2, 18.5], r: 3, model: NO_MODEL, when: '@PRESENT' },
          goal: 'Look into the frozen block.', because: 'Two hundred and twelve people. The stabilizer can free them, or end the war.', done: 'ev_block', hints: M13_HINTS.block },
        { id: 'stabilizer', kind: 'choice', scene: 'stabilizer', at: 'stabilizer', after: ['block'], spot: { prompt: 'THE STABILIZER', offset: [0, 1.2, 2.2], r: 3.4, model: NO_MODEL },
          goal: 'The stabilizer: destroy it, or free the people in the frozen block.', because: 'It is what both sides are fighting for.', done: 'stabilizer_destroyed || civilians_freed', hints: M13_HINTS.stabilizer, minutes: 4 },
        // (shot from over the channel onto the frozen block: it stays frozen with its people still inside, or it has come
        // down and they walk out past the silos; warport.js builds both)
        { id: 'district', kind: 'cinema', after: ['stabilizer'], shots: [{ cam: [30, 7, -45], to: [36, 6, -50], look: [64, 5, -72], t: 9 }],
          lines: [N('The frozen block stays frozen, its people still inside. Around it the guns go on, but nothing repeats.', 'faction == "unwritten"'),
            N('The block thaws. Two hundred and twelve people walk out into the smoke. The Continuum holds the district now.', 'faction == "continuum"'),
            N('Three floors up, the steam still stands over the kettle.', 'faction == "unwritten" && ev_block'),
            N('In the smoke, a woman with a tea towel over her shoulder is looking for her daughter.', 'faction == "continuum" && ev_block')],
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
    block: {
      when: '@PRESENT',
      lines: [N('Behind the frozen glass, every floor stopped halfway through something. A man tying a shoe. Two children on a stair, mid-argument.'),
        N('Three floors up, hanging in the air where it broke away, a kitchen: a woman at a stove, the steam standing over her kettle like glass.'),
        FX(L('SERA', 'Third floor. The woman at the stove.'), 'radio'), K('You know her?'),
        FX(L('SERA', 'She was making tea when the block stopped. She has been making it for nine years. She is my mother.'), 'radio'),
        K('Why didn\'t you tell me?'),
        FX(L('SERA', 'Because you would choose her. Choose the way you would if she was nobody\'s.'), 'radio')],
      set: { ev_block: true }, log: 'Sera\'s mother is in the frozen block. She has been making tea for nine years.', show: 'm13_block_view',
    },
    block_no: { lines: [K('In this year the block is whole, or a green mound. It froze in 2049.')] },
    stabilizer: {
      lines: [N('The stabilizer can freeze the district, and the war with it, or spend itself freeing the two hundred and twelve people locked in the frozen block.')],
      choices: [
        intent('challenge', 'Destroy it. End the loop.', { consequence: true, lines: [N('The stabilizer goes dark. The district stops repeating.'), L('SERA', 'My people will take its coil to your Chronolith. It will hold longer.')],
          set: { faction: 'unwritten', stabilizer_destroyed: true, inv_cap: 10 }, ev: 'stabilizer', after: [N('REVERSE holds for ten seconds now.', 'inv_cap >= 10')] }),
        intent('comfort', 'Redirect it. Free the people.', { consequence: true, lines: [N('The stabilizer spends itself on the block. The hanging floors come down slowly, like a breath let go.'), L('SERA', 'You chose them. I would have chosen the district. I am glad it was you. Give me your Chronolith a moment.')],
          set: { faction: 'continuum', civilians_freed: true, inv_cap: 10 }, ev: 'stabilizer', after: [N('REVERSE holds for ten seconds now.', 'inv_cap >= 10')] }),
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
  // (v2.1.1 playtest M10: the sentry at the sandbag line's gap looks a little wider and further, 30 degrees each side and
  // 10 m, and walks its line briskly, so its back is turned to the gap for less of its round: a walk straight at the gate
  // meets its look nine times in ten; waiting behind a truck until it walks east, as THINK says, gets through)
  adjust(level) {
    for (const s of level.sentinels) if (/_q0s1$/.test(s.id)) Object.assign(s, { range: 10, fov: 1.0, speed: 2.4 });
  },
  // (a load while they lead the way: the flare is lit again, its patrol drawn off; a lure is not in the save)
  resumes: [{ when: 'listeners_route', until: 't_m13_cross', fx: 'listenersRoute' }],
  fx: {
    // the people who listened draw the canyon lane's patrol off with a flare (the way the signal flares lure a watcher):
    // for a minute and a half the lane through the canyons is clear
    listenersRoute(rt) {
      for (const s of rt.g.deckWorld?.sentinels || []) if (/_q0s0$/.test(s.def.id)) { s.lure = { x: -112, z: 30, t: 90 }; s.mode = 'patrol'; s.suspicion = 0; }
    },
    shellHomeA: (rt) => m13ShellHome(rt, 'A'),
    shellHomeB: (rt) => m13ShellHome(rt, 'B'),
  },
  rules: [
    { id: 'shellA', when: 'inv_shellA_done', say: [N('It climbs. Not south. North, over the Continuum line, back into a Continuum gun.')], then: 'shellHomeA' },
    { id: 'shellB', when: 'inv_shellB_done', say: [N('It climbs south, over the Unwritten line, back into an Unwritten gun.')], then: 'shellHomeB' },
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
    // the frozen block, as its scene says (F07): a man on one knee in the lobby, tying a shoe; three floors up the kitchen
    // that broke away and hangs there, a woman at her stove, the steam over her kettle standing like glass. Frozen while
    // the block is; freed, the floor comes down (warport.js) and they are among the people who walk out
    const [mx, , mz] = M13_BLOCK.man, [kx, ky, kz] = M13_BLOCK.kitchen;
    P.npcs.push({ id: 'm13_shoe', crew: 'm13_listener', first: 'A man', seed: 1304, ambient: true, silent: true, pos: [mx, 0, mz], yaw: 0.2, pose: 'kneel', freezeWhen: 'true', when: '!civilians_freed && @PRESENT', room: P.rid });
    P.npcs.push({ id: 'm13_mother', crew: 'm13_mother', first: 'A woman', seed: 1303, ambient: true, silent: true, pos: [kx - 0.6, ky + 0.3, kz + 0.2], yaw: Math.PI / 2, freezeWhen: 'true', when: '!civilians_freed && @PRESENT', room: P.rid });
    P.W('!civilians_freed', () => P.E('PRESENT', () => {
      P.obox(kx, ky, kz, 5.2, 0.3, 4.4, 0, 'concrete', { rx: -0.05, rz: 0.04, solid: true }); // the floor, broken off (she stands on it)
      P.obox(kx, ky + 0.3, kz - 2.0, 5.2, 2.2, 0.25, 0, 'rainBrick', { t: 0xc8a890, rz: 0.04 }); // a stub of its wall
      P.obox(kx + 0.5, ky + 0.3, kz + 0.1, 0.8, 0.9, 0.62, 0, 'steel'); // the stove
      P.cyl(kx + 0.5, ky + 1.2, kz + 0.1, 0.14, 0.22, 'steel', { seg: 10, r2: 0.1 }); // the kettle
      for (let i = 0; i < 5; i++) P.sphere(kx + 0.5 + Math.sin(i * 1.7) * 0.12, ky + 1.55 + i * 0.32, kz + 0.1 + Math.cos(i * 1.3) * 0.1, 0.16 + i * 0.07, 'frozenGlass', { noShadow: 1 }); // the steam, stopped
      P.obox(kx - 1.6, ky + 0.3, kz + 0.6, 1.1, 0.75, 0.8, 0.2, 'wood'); // the table
      for (const [dx, dz] of [[-2.3, -1.9], [2.3, -1.9], [-2.3, 1.9], [2.3, 1.9]]) P.cyl(kx + dx, ky - 1.6, kz + dz, 0.05, 1.6, 'steel', { seg: 5 }); // its torn rebar
    }));
  },
  hook: { cue: 'cliff', minutes: 1, lines: [N('The stabilizer\'s last pulse tears a fracture open.'), L('SERA', 'You\'re coming with me.'), K('Where?'), L('SERA', '2196. Where they teach your name.')] },
  done: 't_m13_district',
};
M13.outro = M13.hook.lines;

export const ACT2 = [M09, M10, M11, M12, M13];
