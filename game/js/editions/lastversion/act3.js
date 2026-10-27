// THE LAST VERSION OF EARTH: Act III, THE LAST VERSION OF EARTH (OVERHAUL.md §5 M14-M18; about 194 minutes).
//
//   Mission 14  WELCOME TO 2196                downtown Rain City as a lagoon; a beacon of three parts; the memorial
//   Mission 15  THE CITY THAT FORGOT TOMORROW  the lock city in a stadium bowl; one day, forever; chain C on the main path
//   Mission 16  THE MUSEUM OF FAILED WORLDS    the quarry-sinkhole museum; three memories, a photograph, the names
//   Mission 17  THE WITNESS'S ARCHIVE          the desert array; recordings, red copies of Kai, the original experiment
//   Mission 18  THE FRACTURE                   the traverse under the storm of times; the pylons, the slab stair
//
// Each mission is one map with soft quarters, threads and side stories (Threads.js), a cold open and a hook, as in
// act1.js and act2.js. The helpers below are shared with act4.js, finale.js and cases.js. Lines quoted from the bible
// are verbatim, with the bible's speakers (D16).
import * as THREE from '../../../vendor/three.module.min.js';
import { CAST, intent } from './npcs.js';
import { makeKit } from './places/kits.js';
import { NO_MODEL } from './processes.js';

export const L = (who, text, when) => (when ? { who, text, when } : { who, text });
export const N = (text, when) => L('NONE', text, when);
export const K = (text, when) => L('KAI', text, when);
export const CREW = (text, when) => L('CREW', text, when); // (said by the person being talked to, in their own voice)
export const REV = (l) => ({ ...l, voice: { ...(l.voice || {}), cue: 'reveal' } });
export const FX = (l, fx) => ({ ...l, voice: { ...(l.voice || {}), fx } });
export const C = (id) => CAST.findIndex((c) => c.id === id);
// a person a scene names, in their own recorded voice
export const SAYS = (name, id, text, when) => ({ who: 'CREW', name, color: '#4f6170', voice: { id }, text, ...(when ? { when } : {}) });
export const AMB = (id) => (text, when) => ({ who: 'CREW', text, voice: { id }, ...(when ? { when } : {}) });
export const kit = (name) => () => makeKit(name);

// a person (or a thing) on a landmark, in the mission's overlay: [right, up, forward] in the landmark's frame
export function spotAt(P, name, [dx, dy, dz] = [0, 0, 0]) {
  const [x, y, z, yaw] = P.at(name);
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return [x + dx * c + dz * s, y + dy, z - dx * s + dz * c, yaw];
}
export function person(P, o) {
  const { at, off, turn = 0, ...n } = o;
  const [x, y, z, yaw] = spotAt(P, at, off);
  // (a passer-by cast by role who can be talked to: DeckWorld offers a talk only to a passer-by with lines of their own;
  // what they say is the mission's talks for them)
  if (n.ambient && n.prompt && !n.lines) n.lines = [];
  P.npcs.push({ room: P.rid, ...n, pos: [x, n.y ?? y, z], yaw: yaw + turn });
}
// the three notes (the Child's song, the Witness's, the theme), from a place in the world, at a gain (score.js's motif)
export function song(rt, gain = 1, kind = 'child') {
  const s = rt.score;
  if (!s?.ready() || gain <= 0.001) return;
  s.motif(kind, 48, s.a.ctx.currentTime + 0.05, 0.42, s.a.sfx, 0.07 * gain);
}
// a tear in the air where a fracture never closed (a spot's model): a thin violet sheet, lit from inside
export function scarModel() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.6), new THREE.MeshBasicMaterial({ color: 0xc9b8ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.z = 0.25;
  g.add(m);
  return g;
}

// =============================================================================================================
// Mission 14: WELCOME TO 2196
// =============================================================================================================
const M14_HINTS = {
  parts: ['The beacon\'s parts list is on this platform.', 'On the case by the signal gantry.', 'Read the parts list.'],
  lift: ['The capacitor is on the bank\'s roof. Its lift car fell to the street.', 'Down the viaduct stair, west along the north sidewalk, over the poled crossing.', 'Walk into the fallen car, aim at it and hold REVERSE. It carries me up.'],
  capacitor: ['The capacitor is in the roof garden.', 'At the old weather station, among the beans.', 'Take it from the weather station.'],
  stones: ['The survivors marked their way with stacked stones.', 'On the drowned sidewalks under the viaduct.', 'Find all three stacks, one of them kicked over.'],
  warning: ['The warden painted a notice here.', 'In 2026 it said something else.', 'Read it, then read it again in 2026.'],
  antenna: ['The antenna is past the line\'s fallen span.', 'Hold the span up with REVERSE, or cross in 2049.', 'Hold the span and cross, or walk over in 2049 and switch back.'],
  memorial: ['The last part is in the memorial\'s foot.', 'Its stone, its flowers, its core.', 'Look at the stone and flowers, then take the core.'],
  sera: ['Sera saw me read the memorial.', 'She is waiting by the steps.', 'Talk to Sera by the steps.'],
  beacon: ['I have all three parts.', 'The beacon case is by Sera\'s steps.', 'Build the beacon at the case.'],
  gardener: ['A gardener is working by the dry channel.', 'In the old street, by the channel.', 'Talk to the gardener.'],
  culvert: ['The channel\'s culvert is blocked.', 'In 2049 it was a street drain.', 'Clear the culvert in 2049.'],
  prints: ['Footprints in the moss walk backwards.', 'Held back, they walk forwards once.', 'Aim at the prints and hold REVERSE.'],
  scar: ['The prints begin in the air.', 'At head height, a tear.', 'Look at the tear in the air.'],
  rhyme: ['A child is reciting something.', 'In the schoolroom. It has my name in it.', 'Listen to the child.'],
  book: ['A schoolbook lies open.', 'On a desk in the schoolroom.', 'Read the open schoolbook.'],
  warden: ['A warden stands where the street flickers.', 'By the shimmering patches near the line.', 'Talk to the warden.'],
  voice: ['The beacon has found a voice.', 'Listen to the voice.', 'Listen, then answer it.'],
  keeper: ['A man keeps the old board clean.', 'He holds a ticket as if it might be checked.', 'Talk to the man on the platform.'],
  departures: ['The 41\'s last board is still here.', 'At the old platform\'s end.', 'Read the last board.'],
};
const KEEPER = AMB('CROWD_M');
// the street's unstable zones: shimmering patches where the street flickers between years (stability drains in them)
const M14_ZONES = [[6, -10, 5], [-30, 8, 4], [56, 30, 4.5], [-6, -30, 3.5]];
const PUPIL = AMB('CROWD_CHILD');

const M14_PROCESSES = [
  // the bank's outside lift: its car lies at the foot of the shaft; held, it climbs back to the roof (and carries Kai)
  {
    id: 'liftCar', kind: 'fall', at: 'liftCar', label: 'THE LIFT CAR', weight: 1, speed: 3, when: '@FUTURE', grain: 'metal', creak: 0.5,
    parts: [
      // (it lies nearly level and low: its floor a step up from the sidewalk, 0.2 m, so Kai walks into it; it stood 0.38 m
      // proud, and he had to jump: v2.1 playtest X4)
      { shape: 'box', size: [2.9, 0.4, 2.9], mat: 'steel', at: [0, 23.65, 0], rest: { at: [0, -0.07, 0], rot: [0.03, 0, -0.02] }, solid: true },
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => ({ shape: 'box', size: [0.12, 2.4, 0.12], mat: 'metal', at: [a * 1.35, 25.05, b * 1.35], rest: { at: [a * 1.35 + 0.3, 0.3, b * 1.35], rot: [0, 0, 1.45 * a] } })),
      { shape: 'box', size: [2.9, 0.12, 2.9], mat: 'glass', at: [0, 26.3, 0], rest: { at: [2.4, 0.1, 0.6], rot: [0.2, 0.4, 0.1] } },
    ],
    aim: [1.0, 0.9, 0],
    hints: ['The car fell.', 'It rises, with me in it.', 'Stand in it, REVERSE it, step off at the top.'],
  },
  // the fallen span of the Line 41 viaduct: nine pieces in the lagoon; held, they come back last fallen first
  {
    id: 'transitBridge', kind: 'collapse', at: 'transitBridge', label: 'THE TRANSIT BRIDGE', weight: 1.5, when: '@FUTURE', grain: 'stone', mat: 'concrete',
    span: { from: [0, 0, -10], to: [0, 0, 10], width: 6.4, pieces: 9, thick: 0.5, floor: -7.6 }, aim: [0, 0.6, 0],
    hints: ['The span is in the lagoon.', 'Last fallen, first back.', 'REVERSE it, cross while it holds.'],
  },
  // the moss prints run backwards from the flowers: held, they run forwards once, and say where they came from
  {
    id: 'mossPrints', kind: 'recording', at: 'mossPrints', label: 'THE MOSS PRINTS', weight: 0.5, grain: 'pen', aim: [0, 0.3, 0.8],
    clip: { who: 'NONE', text: 'The prints run forwards: out of the air at head height, across the plaza, to the flowers, and back.' },
    hints: ['Footprints in the moss.', 'They walk backwards.', 'REVERSE them.'],
  },
  // R6: the memorial is not a process
  { id: 'memorialRefusal', kind: 'refusal', refuse: 'NOT A PROCESS', at: 'memorial', label: 'THE MEMORIAL', when: '@FUTURE', line: 'It isn\'t something that happened. It\'s something they decided.', aim: [0, 2.6, -0.8] },
];

// the statue of Kai on its plinth: his own body in weathered stone, still (it takes its pose, then holds it)
const STONE = new THREE.MeshStandardMaterial({ color: 0x9c978d, roughness: 0.96, metalness: 0 });
function m14Statue(rt) {
  const g = rt.g, n = g.deckWorld?.npcs.find((x) => x.n.statue);
  if (!n || n.stone) return;
  n.stone = true;
  g.facts.set('m14_statue', false); // (a load: the pose first)
  n.model.traverse((o) => { if (o.isMesh) { o.material = STONE; o.castShadow = true; } });
  n.model.userData.setOpacity = null;
  g.after(0.6, () => g.facts.set('m14_statue', true)); // (then it stands still: freezeWhen)
}
function m14Step(rt, dt) {
  m14Statue(rt);
  const g = rt.g, p = g.player?.pos;
  if (!p || g.catching || rt.opening || rt.cinema?.active) return;
  // in a zone the street flickers between years, and the Chronolith pays for it, in any year
  const z = M14_ZONES.find(([x, zz, r]) => Math.hypot(p.x - x, p.z - zz) < r && p.y < 3.4);
  if (!z) return;
  rt.stability = Math.max(0, rt.stability - dt * 0.14);
  if ((rt.m14T = (rt.m14T ?? 0) - dt) <= 0) {
    rt.m14T = 6;
    g.hud.flash?.('rgba(200, 184, 255, 0.18)');
    rt.score?.capText('the street flickering between years');
  }
  if (rt.stability <= 0) rt.snapBack();
}

export const M14 = {
  key: 'm14', n: 14, chapter: 'act3', name: 'WELCOME TO 2196', title: 'The 2196 city', subtitle: 'A beautiful, devastated world. A beacon to build before the Chronolith lets go.',
  logline: 'Downtown Rain City, where the avenues are canals.',
  place: 'drowned', sectors: 1, home: 'FUTURE', states: ['FUTURE', 'PRESENT', 'PAST'], drones: [0, 1, 2], unstable: true, ambience: 'wind', ambient: 'future',
  motto: 'WE TEACH CHILDREN YOUR NAME', gate: 'THE BEACON', crew: C('sera'),
  named: ['sera', 'gardener', 'warden'],
  minutes: { main: 30, optional: 8 }, autoExit: 1.2, gateAfter: true,
  processes: M14_PROCESSES,
  fragSpots: [['bankTerrace'], ['lowWaterPath'], ['kaiStatue']], fragYears: ['FUTURE'], // (2196's things: no statue's plinth in 2026)
  fragments: [[
    'A ticket for the 41, kept a hundred and forty-seven years.',
    'Beans growing in a bank\'s safety deposit boxes.',
    'Your statue\'s plinth. Under the name, a child has scratched: WHY.',
  ]],
  beats: [{ kind: 'custom', goal: 'Build the return beacon.' }],
  coldOpen: {
    first: true, minutes: 2, cue: 'card',
    shots: [{ cam: 'seraSchool', look: 'memorial', t: 12 }],
    lines: [L('SERA', 'And the first name?'), SAYS('THE CHILDREN', 'CROWD_CHILD', 'Kai Varen.'), L('SERA', 'And what did he do?'),
      SAYS('THE CHILDREN', 'CROWD_CHILD', 'He made the sky disagree with itself.'), L('SERA', 'Good. Now the names of the dead. Slowly. Every one.')],
    title: { shots: [{ cam: 'arrivalPlatform', look: 'bankTower', t: 6 }], lines: [N('A platform eight metres above a lagoon that was an avenue.'), K('Twenty-one ninety-six. It\'s beautiful. Why is it beautiful?')] },
  },
  quarters: [
    {
      name: 'THE OVERGROWN TOWERS',
      threads: [
        { id: 'parts', kind: 'scene', scene: 'parts', at: 'partsList', spot: { prompt: 'THE PARTS LIST', offset: [0, 1.1, 0.8], r: 2.6, kit: 'beaconCase' },
          goal: 'Read the beacon\'s parts list.', because: 'The Chronolith will not hold me here for long.', done: 'm14_parts', hints: M14_HINTS.parts, minutes: 2 },
        { id: 'lift', kind: 'go', at: 'roofGarden', r: 6, after: ['parts'], goal: 'Up to the bank\'s roof garden.', because: 'The capacitor is up there. The bank\'s lift car fell to the street, and fallen things rise.', hints: M14_HINTS.lift, minutes: 5 },
        { id: 'capacitor', kind: 'scene', scene: 'capacitor', at: 'roofGarden', after: ['lift'], spot: { prompt: 'THE WEATHER STATION', offset: [0, 1.0, 2], r: 2.8, kit: 'beaconCase' },
          goal: 'Take the capacitor.', because: 'The first of three parts.', done: 'm14_capacitor', hints: M14_HINTS.capacitor, minutes: 1 },
      ],
      sides: [
        // (the closing pass: a man who keeps a ticket for the 41 on the platform it never came back to; on the Finale's road
        // the 41 comes, and he is there with it)
        { id: 'ticket', name: 'THE LAST TICKET', done: 'm14_ticket', minutes: 3,
          threads: [
            { id: 'departures', kind: 'scene', scene: 'departures', at: 'arrivalPlatform', spot: { prompt: 'THE LAST BOARD', offset: [-2.2, 1.3, -6], r: 2.4, kit: 'timetable', when: '@FUTURE' },
              goal: 'A departures board on the old platform.', because: 'Somebody keeps it clean.', done: 'ev_last_board', hints: M14_HINTS.departures },
            { id: 'keeper', kind: 'talk', npc: 'm14_keeper', at: 'arrivalPlatform', after: ['departures'], goal: 'The man who keeps the board.', because: 'He is holding a ticket as if it might be checked.', done: 'm14_ticket', hints: M14_HINTS.keeper },
          ] },
      ],
    },
    {
      name: 'THE TRANSIT LINE',
      threads: [
        { id: 'stones', kind: 'clue', need: 3, of: ['ev_stones3', 'ev_stones4', 'ev_stones0'], after: ['capacitor'],
          spots: [
            { id: 'stones3', scene: 'stones3', at: 'stackedStones', prompt: 'STACKED STONES', offset: [0, 0.6, 0], r: 2.6, model: NO_MODEL },
            { id: 'stones4', scene: 'stones4', at: 'stackedStones', prompt: 'STACKED STONES', offset: [0, 0.6, -32], r: 2.6, model: NO_MODEL },
            { id: 'stones0', scene: 'stones0', at: 'stackedStones', prompt: 'A KICKED-OVER CAIRN', offset: [-35, 0.6, 3], r: 2.6, model: NO_MODEL },
          ],
          say: [K('They went south under the gap. When the water was low.')],
          goal: 'Track the survivors by their stacked stones.', because: 'Somebody went this way, and marked it.', hints: M14_HINTS.stones, minutes: 3 },
        // (the closing pass: the man who painted over Sera's path, in person: why a safe path can kill you)
        { id: 'warden', kind: 'talk', npc: 'warden', at: 'unstableZones', after: ['stones'], goal: 'The warden at the flickering street.', because: 'He has stood on this corner a long time.', done: 'm14_warden', hints: M14_HINTS.warden },
        { id: 'warning', kind: 'residue', at: 'unstableZones', after: ['warden'],
          record: { official: 'WARDEN\'S NOTICE. UNSTABLE ZONE ON FOURTH. DO NOT CROSS BEFORE NOON. IT IS ALWAYS BEFORE NOON.', echo: 'Under the paint, the first words ever written on the board: SAFE PATH WHEN THE WATER IS LOW. SERA.',
            hint: 'Fresh paint, over older paint.', after: [K('She left a way through, and somebody painted over it.'), K('Low water. In twenty twenty-six there was no water here at all.')],
            prompt: 'THE WARDEN\'S NOTICE', offset: [0, 1.4, 0.4], kit: 'wardenSign', log: 'Sera marked a safe path for low water. The warden painted over it.' },
          goal: 'Read the warden\'s notice where the street flickers.', because: 'Every survivor\'s trail goes round this corner.', ev: 'low_water', hints: M14_HINTS.warning, minutes: 3 },
        { id: 'antenna', kind: 'scene', scene: 'antenna', at: 'antenna', after: ['warning'], spot: { prompt: 'THE ANTENNA', offset: [0, 1.2, 1.2], r: 2.8, model: NO_MODEL, when: '@FUTURE' },
          goal: 'The antenna, on the survivors\' platform past the fallen span.', because: 'The second part. The line\'s gap is between me and it.', done: 'm14_antenna', hints: M14_HINTS.antenna, minutes: 5 },
      ],
    },
    {
      name: 'THE MEMORIAL',
      threads: [
        { id: 'memorial', kind: 'tasks', of: ['ev_memorial', 'ev_fresh_flowers', 'm14_core'], after: ['antenna'],
          spots: [
            { id: 'memorialStone', scene: 'memorial', at: 'memorial', prompt: 'THE MEMORIAL', offset: [0, 1.4, 1.2], r: 2.8, model: NO_MODEL, when: '@FUTURE' },
            { id: 'memorialFlowers', scene: 'flowers', at: 'flowers', prompt: 'THE FLOWERS', offset: [0, 0.6, 0.6], r: 2.2, model: NO_MODEL, when: '@FUTURE' },
            { id: 'memorialCore', scene: 'core', at: 'memorial', prompt: 'THE CORE', offset: [6.5, 1.0, 1.4], r: 2.4, kit: 'memorialCore', when: '@FUTURE' },
          ],
          goal: 'The memorial on the old Helix Plaza.', because: 'The last part is in its foot. My name is on its face.', hints: M14_HINTS.memorial, minutes: 3 },
        { id: 'sera', kind: 'talk', npc: 'sera', at: 'seraSteps', after: ['memorial'], goal: 'Sera is waiting by the steps.', because: 'She watched me read it.', done: 'trust_sera', hints: M14_HINTS.sera, minutes: 4 },
        { id: 'beacon', kind: 'scene', scene: 'beacon', at: 'seraSteps', after: ['sera'], spot: { prompt: 'BUILD THE BEACON', offset: [3, 1.0, 1.0], r: 2.6, kit: 'beaconCase' },
          goal: 'Build the return beacon.', because: 'Three parts. Then east, where a bell is ringing.', done: 'beacon_built', hints: M14_HINTS.beacon, minutes: 1 },
        // (the closing pass: adult Mira, a hundred and forty years early, on the frequency the beacon wakes to)
        { id: 'voice', kind: 'cinema', after: ['beacon'], shots: [{ cam: 'seraSteps', look: 'memorial', t: 16 }],
          lines: [N('The beacon wakes, and finds a voice already on its frequency.'), FX(L('MIRA', 'Kai? It\'s raining where you are. It\'s always raining where you are.'), 'radio'),
            FX(L('MIRA', 'Is it still Saturday?'), 'radio'), L('SERA', 'That channel has been calling for a hundred and forty years. Nobody has ever answered it.'),
            K('I know that voice.'), L('SERA', 'Then answer it.'), K('Mira?'), N('Static, and under it, very faint, three notes.')],
          set: { ev_beacon_voice: true }, log: 'The beacon woke on a channel that has called for 140 years, in a voice I know: "Is it still Saturday?"',
          goal: 'The beacon has found a voice.', because: 'Somebody is on its frequency.', hints: M14_HINTS.voice },
      ],
      sides: [
        { id: 'garden', name: 'THE SURVIVOR\'S GARDEN', giver: 'gardener', case: 'c_garden', done: 'garden_restored', minutes: 4,
          threads: [
            { id: 'gardener', kind: 'talk', npc: 'gardener', at: 'gardenChannel', goal: 'A gardener by the dry channel.', because: 'Sera\'s community grows food where it can.', done: 'm14_culvert_asked || garden_restored', hints: M14_HINTS.gardener, minutes: 2 },
            { id: 'culvert', kind: 'scene', scene: 'culvert', at: 'gardenChannel', after: ['gardener'], spot: { prompt: 'THE CULVERT', offset: [0, 1.0, -1.6], r: 2.6, model: NO_MODEL, when: '!garden_restored' },
              goal: 'The channel\'s culvert, in the old street.', because: 'In 2049 it was a drain. Something blocked it.', done: 'garden_restored', hints: M14_HINTS.culvert, minutes: 2 },
          ] },
        { id: 'flowers', name: 'WHOSE FLOWERS?', done: 'ev_receipt_0804', minutes: 3,
          threads: [
            { id: 'prints', kind: 'invert', target: 'mossPrints', at: 'mossPrints', goal: 'Footprints in the moss walk away from the flowers, backwards.', because: 'Whoever brought them came from somewhere.', hints: M14_HINTS.prints, minutes: 1 },
            { id: 'scar', kind: 'scene', scene: 'scar', at: 'mossPrints', after: ['prints'], spot: { prompt: 'THE TEAR IN THE AIR', offset: [-2, 1.6, -4], r: 2.6, model: scarModel },
              goal: 'Where the prints begin.', because: 'In the air, at head height.', done: 'ev_receipt_0804', hints: M14_HINTS.scar, minutes: 2 },
          ] },
        { id: 'school', name: 'THE SCHOOLROOM', done: 'ev_rhyme && ev_schoolbook', minutes: 1,
          threads: [
            { id: 'rhyme', kind: 'talk', npc: 'm14_pupil', at: 'seraSchool', goal: 'A child is reciting something.', because: 'It has my name in it.', done: 'ev_rhyme', hints: M14_HINTS.rhyme, minutes: 0.5 },
            { id: 'book', kind: 'scene', scene: 'schoolbook', at: 'seraSchool', spot: { prompt: 'THE SCHOOLBOOK', offset: [-4, 1.0, 2.5], r: 2.4, model: NO_MODEL, when: '@FUTURE' },
              goal: 'A schoolbook on a desk.', because: 'The lesson before the names.', done: 'ev_schoolbook', hints: M14_HINTS.book, minutes: 0.5 },
          ] },
      ],
    },
  ],
  talks: {
    sera: [
      {
        when: '!trust_sera',
        lines: [L('SERA', 'You came up the plaza steps like you knew them.'), K('I worked here. It was a plaza.'), L('SERA', 'We teach children your name before they learn the names of the dead.')],
        choices: [
          intent('challenge', 'I didn\'t do this.', { consequence: true, lines: [L('SERA', 'Every version of you denies responsibility. I have met four. You are the first to look at the memorial before saying it.')], set: { trust_sera: 'deny' } }),
          intent('comfort', 'Then teach them this too: I came back.', { consequence: true, lines: [L('SERA', 'Nobody has ever said that. I don\'t know whether to write it down.')], set: { trust_sera: 'accept' } }),
          intent('investigate', 'What did I do?', { lines: [L('SERA', 'Nobody knows. That\'s why we teach the name.')], set: { trust_sera: 'ask' } }),
        ],
      },
      { when: 'trust_sera', lines: [L('SERA', 'Build your beacon.')] },
    ],
    gardener: [
      { when: 'water_route && !garden_restored', lines: [CREW('The channel is running again. Nobody alive remembers who opened it.'), K('Somebody taught it to stay.')], set: { garden_restored: true } },
      { when: '!water_route && !garden_restored && !m14_culvert_asked', lines: [CREW('Dry since before my mother. The culvert was in the old street.'), K('I can.')], set: { m14_culvert_asked: true } },
      { when: 'garden_restored', lines: [CREW('Water, and something to put it on. That is an economy, here.')] },
      { when: 'true', lines: [CREW('The culvert.')] },
    ],
    warden: [
      {
        when: '!m14_warden',
        lines: [CREW('Stop. Nobody crosses Fourth before noon.'), K('It\'s the afternoon.'), CREW('It is always before noon on Fourth. That is the rule, and the rule is why anyone here is alive.'),
          CREW('And you have the face from the plaza. They will want you dead, or sorry. I haven\'t decided which I want.')],
        choices: [
          intent('investigate', 'Who made the rule?', { lines: [CREW('A woman who came through when the water was low. She wrote a safe path on my board. I painted over it.'), K('Why?'), CREW('Because the water is never low any more. A safe path that drowns you is worse than no path.')], set: { m14_warden: 'asked' } }),
          intent('challenge', 'Then I\'ll cross anyway.', { lines: [CREW('Then read my board first. Everyone who drowned there read it afterwards.')], set: { m14_warden: 'crossed' } }),
          intent('comfort', 'You\'ve kept people alive.', { lines: [CREW('Thirty-eight of them. I count them every morning. I count them again at night.')], set: { m14_warden: 'thanked' } }),
        ],
      },
      { when: 'm14_warden', lines: [CREW('Read the board. Then cross, if you must.')] },
    ],
    m14_keeper: [
      {
        when: '!m14_ticket',
        lines: [KEEPER('My great-great-grandmother bought this for the 41 the morning it fell. Eight fourteen. She was late, and she never got on.'),
          KEEPER('We keep it for the day the 41 comes back. Somebody ought to have a ticket.')],
        choices: [
          intent('comfort', 'It will come back.', { consequence: true, lines: [KEEPER('Then I\'ll be first on, and I\'ll make them punch it.')], set: { m14_ticket: 'kept' } }),
          intent('investigate', 'Why keep it, if it never comes?', { consequence: true, lines: [KEEPER('Because she was late. Being late kept us alive. You keep the thing that kept you.')], set: { m14_ticket: 'asked' } }),
        ],
      },
      { when: 'm14_ticket', lines: [KEEPER('Eight fourteen. Any day now.')] },
    ],
    m14_pupil: [
      {
        when: '!ev_rhyme',
        lines: [PUPIL('A city of rain where nobody\'s late. A man with no dust, who never would wait.', 'niko_told == "story"'),
          PUPIL('A man with no dust built a thing to remember. It ate up the summers and gave back the embers.', 'niko_told == "truth"'),
          PUPIL('A man with no dust came and told us nothing. So we made up the rest.', '!(niko_told == "story") && !(niko_told == "truth")'),
          K('Where did you learn that?'), PUPIL('Everybody knows it. It\'s old.')],
        set: { ev_rhyme: true },
      },
      { when: 'true', lines: [PUPIL('We learn the names after.')] },
    ],
  },
  scenes: {
    parts: { lines: [N('RETURN BEACON. A capacitor, on the bank\'s roof. An antenna, on the transit line. A core, in the memorial.')], set: { m14_parts: true } },
    capacitor: { lines: [N('Beans grow round the bank\'s old weather station. Its capacitor is dry, and whole.'), K('One.')], set: { m14_capacitor: true }, log: 'The capacitor, from the bank\'s roof garden.' },
    stones3: { lines: [N('Three stones stacked on a drowned sidewalk. People passed here.')], set: { ev_stones3: true } },
    stones4: { lines: [N('Four. The same hand, further on.')], set: { ev_stones4: true } },
    stones0: { lines: [N('A cairn kicked over.'), K('Somebody did not want to be followed.')], set: { ev_stones0: true } },
    antenna: { when: '@FUTURE', lines: [N('An antenna made from the 41\'s mast. In paint: KEEP IT POINTED AT THE HILL.'), K('Two.')], set: { m14_antenna: true }, log: 'The antenna, from the survivors\' platform on Line 41.' },
    antenna_no: { lines: [K('No antenna in this year.')] },
    memorial: { lines: [N('A long black stone on the old Helix Plaza. KAI VAREN. ARCHITECT OF THE FRACTURE.'), K('They spelled it right.')], set: { ev_memorial: true }, log: 'The memorial: KAI VAREN, ARCHITECT OF THE FRACTURE.' },
    flowers: { lines: [N('White chrysanthemums in florist\'s paper. Fresh this morning.'), K('Nobody here has paper to spare.')], set: { ev_fresh_flowers: true }, log: 'Fresh white chrysanthemums at my memorial, in florist\'s paper.' },
    core: { lines: [N('A beacon core in its foot, to light the name at night.'), K('Three. I\'m taking the light off my own name.')], set: { m14_core: true } },
    beacon: { lines: [N('Capacitor, antenna, core. The beacon wakes.')], set: { beacon_built: true }, log: 'The return beacon is built.' },
    culvert: { when: '@PRESENT', lines: [N('In twenty forty-nine a cable drum chokes the culvert. Kai rolls it clear. A century downhill, water finds the channel.')], set: { garden_restored: true }, log: 'I cleared the culvert in 2049. The garden channel runs in 2196.' },
    culvert_no: { lines: [K('The culvert was a street drain, in twenty forty-nine.')] },
    scar: {
      lines: [N('The prints begin at a tear in the air. Caught in it: a white petal, and a florist\'s receipt. 08:04, 2049.'), K('Somebody stepped out of twenty forty-nine with flowers. For my name.')],
      set: { ev_receipt_0804: true }, log: 'The flowers came through a fracture from 2049, bought at 08:04.',
    },
    departures: { when: '@FUTURE', lines: [N('The 41\'s departures board, wiped clean by hand. One line still lit in paint: 08:14, ON TIME.'), K('Somebody repaints it.')], set: { ev_last_board: true } },
    departures_no: { lines: [K('In this year the board is a board. In twenty-one ninety-six somebody keeps it.')] },
    schoolbook: { lines: [N('A schoolbook: THE FRACTURE AND THE MAN WHO MADE IT. My photograph, with a moustache drawn on and rubbed out.')], set: { ev_schoolbook: true } },
  },
  step: m14Step,
  overlay(P) {
    person(P, { id: 'sera', crew: 'sera', at: 'seraSteps', off: [0, 0, 1.6], turn: Math.PI, prompt: 'TALK TO SERA' });
    person(P, { id: 'gardener', crew: 'gardener', at: 'gardenChannel', off: [1.6, 0, 1.0], turn: -Math.PI / 2, prompt: 'TALK TO THE GARDENER', when: '@FUTURE' });
    person(P, { id: 'kai_statue', crew: 'kai', at: 'kaiStatue', off: [0, 1.6, 0], turn: 0, silent: true, statue: true, freezeWhen: 'm14_statue', temporal: ['PRESENT', 'PAST', 'FUTURE'], when: '@FUTURE' }); // (the memorial is 2196's)
    person(P, { id: 'warden', crew: 'warden', at: 'unstableZones', off: [3, 0, 2], turn: Math.PI, when: '@FUTURE', prompt: 'TALK TO THE WARDEN', barks: ['Do not cross before noon. It is always before noon.'] });
    person(P, { id: 'm14_keeper', crew: 'm14_keeper', first: 'The ticket keeper', seed: 1404, ambient: true, at: 'arrivalPlatform', off: [1.8, 0, -4], turn: Math.PI, when: '@FUTURE', prompt: 'TALK TO HIM' });
    person(P, { id: 'm14_pupil', crew: 'm14_pupil', first: 'A child', seed: 1401, ambient: true, at: 'seraSchool', off: [2, 0, 3], turn: Math.PI, when: '@FUTURE', prompt: 'TALK TO THE CHILD' });
    person(P, { id: 'm14_pupilA', crew: 'm14_pupilA', first: 'A child', seed: 1402, ambient: true, at: 'seraSchool', off: [-2, 0, 1.5], turn: Math.PI, when: '@FUTURE', silent: true });
    person(P, { id: 'm14_pupilB', crew: 'm14_pupilB', first: 'A child', seed: 1403, ambient: true, at: 'seraSchool', off: [-5, 0, 1.5], turn: Math.PI, when: '@FUTURE', silent: true });
  },
  hook: {
    cue: 'cliff', minutes: 1,
    lines: [L('SERA', 'Four versions of you have stood here. Every one said: I didn\'t do this.'),
      K('What did the fifth say?', '!(trust_sera == "deny")'), L('SERA', 'There hasn\'t been a fifth. Not yet.', '!(trust_sera == "deny")'),
      K('And the fifth?', 'trust_sera == "deny"'), L('SERA', 'He said it too. But he looked first.', 'trust_sera == "deny"'),
      N('A bell rings from the east. Somewhere over there, a city has missed noon.')],
  },
  done: 't_m14_voice',
};
M14.outro = M14.hook.lines;

// =============================================================================================================
// Mission 15: THE CITY THAT FORGOT TOMORROW
// =============================================================================================================
const M15_HINTS = {
  announce: ['The station board.', 'On the halt.', 'Read the board.'],
  station: ['Watch the platform.', 'Noon resets everything.', 'Wait on the halt through one reset.'],
  register: ['The school register.', 'In the main stand, at the rim.', 'Read the register. Look at the desks.'],
  flood: ['The market.', 'The silt on the stand. The well.', 'Look at both.'],
  fourteenth: ['What happened on the fourteenth?', 'The silt line, the well\'s last mark.', 'A flood.'],
  mara: ['The archive in the press tower.', 'An archivist keeps it.', 'Talk to Mara.'],
  ink: ['Ink remembers its order.', 'The card, and both archives.', 'REVERSE each one.'],
  anja: ['Anja Vale.', 'Her desk, by the lock\'s console.', 'Talk to her.'],
  lock: ['The lock\'s console.', 'Stabilize it, or free it.', 'Use the console and decide.'],
  junEcho: ['A driver on the evacuation train.', 'He is an echo.', 'Talk to him.'],
  flaps: ['The departure board\'s flaps run backwards.', 'Run them forwards.', 'REVERSE the board.'],
  carriage: ['The next carriage.', 'The train at the halt.', 'Open it.'],
};
const M15_PROCESSES = [
  // card fourteen: CAUSE: HELIX TEST was written over the card; it un-writes first, so it was added last
  {
    id: 'card14', kind: 'ink', at: 'card14', label: 'CARD FOURTEEN', weight: 0.5, when: '@FUTURE', grain: 'pen', aim: [0, 1.4, 0.06],
    layers: ['CAUSE: HELIX TEST', 'THE 14TH · CAUSE: UNDOCUMENTED · CONSEQUENCE: THIS'],
    props: [{ box: [-0.55, 0, -0.12, 0.55, 2.0, -0.02], mat: 'prop' }],
    hints: ['The card about the fourteenth.', 'Ink comes off in the order it went on, last first.', 'REVERSE the card.'],
  },
  // the two archives: neither un-writes, so both are original
  {
    id: 'archiveA', kind: 'ink', at: 'archiveA', label: 'THE FIRST ARCHIVE', weight: 0.5, when: '@FUTURE', grain: 'pen', aim: [0, 1.4, 0.06],
    layers: ['FIRST OPERATOR: E. ROOK · 05:40'], props: [{ box: [-0.55, 0, -0.12, 0.55, 2.0, -0.02], mat: 'prop' }],
    hints: ['The first archive.', 'Was anything written over it?', 'REVERSE it and see.'],
  },
  {
    id: 'archiveB', kind: 'ink', at: 'archiveB', label: 'THE SECOND ARCHIVE', weight: 0.5, when: '@FUTURE', grain: 'pen', aim: [0, 1.4, 0.06],
    layers: ['FIRST OPERATOR: K. VAREN · 05:40'], props: [{ box: [-0.55, 0, -0.12, 0.55, 2.0, -0.02], mat: 'prop' }],
    hints: ['The second archive.', 'Was anything written over it?', 'REVERSE it and see.'],
  },
  // the departure board's flaps run backwards; held, they run forwards to tomorrow's departures
  {
    id: 'departureBoard', kind: 'mechanism', at: 'departureBoard', label: 'THE DEPARTURE BOARD', weight: 0.5, when: '@FUTURE', grain: 'metal', spin: [1, 0, 0, 6],
    parts: [0, 1, 2].map((i) => ({ shape: 'box', size: [1.6, 0.34, 0.06], mat: 'black', at: [0, 2.0 + i * 0.4, 0.12] })),
    aim: [0, 2.4, 0.12],
    hints: ['The flaps run backwards.', 'Run them forwards.', 'REVERSE the board, and read it.'],
  },
];

export const M15 = {
  key: 'm15', n: 15, chapter: 'act3', name: 'THE CITY THAT FORGOT TOMORROW', title: 'The lock city', subtitle: 'Residents repeat one day. Nobody remembers beyond it.',
  logline: 'A city in a stadium, under a lock of light.',
  place: 'lockcity', sectors: 1, home: 'FUTURE', states: ['FUTURE', 'PAST', 'PRESENT'], drones: [0, 0, 0], ambience: 'wind', ambient: 'future',
  motto: 'THE WORLDS THAT NEVER FINISHED BECOMING WORLDS', gate: 'THE LOCK', crew: C('anja'),
  named: ['anja', 'mara', 'warden', 'tomas', 'jun'],
  minutes: { main: 30, optional: 10 }, autoExit: 1.2, gateAfter: true,
  // the city resets at noon, every two minutes of play, until the lock is decided
  loop: { period: 120, until: 'city_freed || city_stabilized' },
  processes: M15_PROCESSES,
  fragSpots: [['railHalt', 'gateTunnel'], ['schoolDoor', 'marketWell']],
  fragments: [[
    'A station timetable for one day, printed on both sides.',
    'A loaf from the market. Fresh. It was fresh yesterday.',
    'A child\'s drawing of a river coming into the market. Someone has painted it over in lilac.',
    'Anja\'s note to herself: CHECK THE LOCK AT NOON.',
  ]],
  beats: [{ kind: 'custom', goal: 'Find out what the lock holds.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    shots: [{ cam: 'anjaDesk', look: 'lockConsole', t: 9 }],
    lines: [L('ANJA', 'Check the lock at noon.'), N('She reads her own note. YOU HAVE WRITTEN THIS NOTE 3,112 TIMES.'), L('ANJA', 'Three thousand one hundred and twelve. Then I have been very careful.'), N('She writes it again.')],
  },
  quarters: [
    {
      name: 'THE STATION',
      threads: [
        { id: 'announce', kind: 'scene', scene: 'announce', at: 'departureBoard', spot: { prompt: 'THE DEPARTURE BOARD', offset: [0, 1.6, 0.8], r: 2.8, kit: 'timetable' },
          goal: 'Read the departure board.', because: 'The station is evacuating. It has been evacuating for years.', done: 'm15_board', hints: M15_HINTS.announce, minutes: 1 },
        { id: 'station', kind: 'loop', at: 'railHalt', after: ['announce'], goal: 'Watch the station relive its evacuation.', because: 'Every morning the last train leaves. Every morning it is the first.',
          say: [N('Noon. A bell. Everyone on the platform steps back to where they stood at eight, with the same bags.'), K('Nobody grieves. Nobody remembers enough to.')], hints: M15_HINTS.station, minutes: 5 },
      ],
      sides: [
        { id: 'train', name: 'THE TRAIN THAT ARRIVES YESTERDAY', giver: 'jun', case: 'c_train', done: 'quest_jun == "observed"', minutes: 10,
          threads: [
            { id: 'junEcho', kind: 'talk', npc: 'jun', at: 'evacTrain', goal: 'An echo is driving the evacuation train.', because: 'He has Jun Park\'s face.', done: 'm15_jun', hints: M15_HINTS.junEcho, minutes: 3 },
            { id: 'flaps', kind: 'invert', target: 'departureBoard', at: 'departureBoard', after: ['junEcho'], done: 'ev_blank_tomorrow', goal: 'The board\'s flaps run backwards.', because: 'Jun says it never says where to.', hints: M15_HINTS.flaps, minutes: 3 },
            { id: 'carriage', kind: 'scene', scene: 'carriage', at: 'evacTrain', after: ['flaps'], spot: { prompt: 'THE NEXT CARRIAGE', offset: [3, 1.2, -2.4], r: 3, model: NO_MODEL, when: '@FUTURE' },
              goal: 'The next carriage.', because: 'Jun can hear them in it.', done: 'quest_jun == "observed"', hints: M15_HINTS.carriage, minutes: 4 },
          ] },
      ],
    },
    {
      name: 'THE SCHOOL & MARKET',
      threads: [
        { id: 'register', kind: 'clue', need: 2, of: ['ev_register', 'ev_tomas'], after: ['station'],
          spots: [
            { id: 'registerBook', scene: 'register', at: 'register', prompt: 'THE REGISTER', offset: [0, 1.1, 0.6], r: 2.6, kit: 'registerBook', when: '@FUTURE' },
            { id: 'tomasDesk', scene: 'tomasDesk', at: 'register', prompt: 'A DESK', offset: [-3.5, 1.0, 2.5], r: 2.4, model: NO_MODEL, when: '@FUTURE' },
          ],
          goal: 'The school relives its last morning.', because: 'Thirty names, the same ink every day.', hints: M15_HINTS.register, minutes: 3 },
        { id: 'flood', kind: 'clue', need: 2, of: ['ev_flood_line', 'ev_well_gauge'], after: ['register'],
          spots: [
            { id: 'floodLine', scene: 'floodLine', at: 'floodLine', prompt: 'THE SILT LINE', offset: [0, 1.0, 0.8], r: 2.6, model: NO_MODEL },
            { id: 'marketWell', scene: 'well', at: 'marketWell', prompt: 'THE MARKET WELL', offset: [0, 1.0, 1.6], r: 2.6, model: NO_MODEL },
          ],
          goal: 'The market relives a disaster nobody wrote down.', because: 'The fourteenth. Everybody stops talking at the stall where it was.', hints: M15_HINTS.flood, minutes: 2 },
        { id: 'fourteenth', kind: 'deduce', deduction: 'fourteenth', at: 'market', after: ['flood'], spotOpts: { offset: [0, 1.2, 2], r: 3 },
          goal: 'What happened on the fourteenth?', because: 'The archive will tell me one thing. The market says another.', hints: M15_HINTS.fourteenth, minutes: 3 },
      ],
    },
    {
      name: 'THE ARCHIVE / THE LOCK',
      threads: [
        { id: 'mara', kind: 'talk', npc: 'mara', at: 'pressFoot', after: ['fourteenth'], goal: 'The central archive, in the press tower.', because: 'Someone keeps the records of a city that forgets.', done: 'm15_mara', hints: M15_HINTS.mara, minutes: 2 },
        { id: 'ink', kind: 'tasks', of: ['inv_card14_done', 'inv_archiveA_done', 'inv_archiveB_done'], at: 'pressTower', after: ['mara'],
          set: { ev_dual_archive: true, quest_mara: 'resolved' }, log: 'Card fourteen was written over: CAUSE: HELIX TEST was added last. The two archives are both original.',
          say: [K('The card was written over. HELIX TEST came off first: it went on last.'), K('The archives don\'t un-write. Rook first in one, me first in the other. Both original.'),
            L('MARA', 'Both true, for different branches. Now you know why I keep both.')],
          goal: 'Separate the causes from the forgeries.', because: 'Ink remembers the order it went on.', hints: M15_HINTS.ink, minutes: 5 },
        { id: 'anja', kind: 'talk', npc: 'anja', at: 'anjaDesk', after: ['ink'], goal: 'Anja Vale, at her desk by the lock.', because: 'She built it. She checks it at noon.', done: 'm15_anja', hints: M15_HINTS.anja, minutes: 3 },
        { id: 'lock', kind: 'choice', scene: 'lock', at: 'lockConsole', after: ['anja'], spot: { prompt: 'THE LOCK', offset: [0, 1.2, 1.2], r: 3, kit: 'lockConsole' },
          goal: 'Stabilize the city, or free it.', because: 'One day, kept forever, or every day after it.', done: 'city_freed || city_stabilized', hints: M15_HINTS.lock, minutes: 3 },
      ],
    },
  ],
  talks: {
    mara: [
      {
        when: '!m15_mara',
        lines: [L('MARA', 'A clean history is usually a history someone has cleaned.'), K('Which record is true?'), L('MARA', 'Start with the question: true for whom?'),
          L('MARA', 'Two archives, and a card about the fourteenth. Ink remembers the order it went on. Ask it, not me.')],
        set: { m15_mara: true, quest_mara: 'active' },
      },
      { when: 'm15_mara', lines: [L('MARA', 'I only keep it. The ink does the remembering.')] },
    ],
    anja: [
      {
        when: '!m15_anja',
        lines: [K('How many worlds has the Chronolith cost?'), L('ANJA', 'That depends on whether you count the worlds that never finished becoming worlds.'),
          L('ANJA', 'My son was in the market on the fourteenth. Every morning he isn\'t there, and every morning I don\'t know why. That is what the lock is for.'),
          K('If I free the city—'), L('ANJA', 'Then tomorrow comes, and I\'ll know why. Ask me which I want. Then don\'t listen to the answer. I\'ve changed it three thousand times.')],
        set: { m15_anja: true, ev_anja_lock: true },
      },
      { when: 'm15_anja', lines: [L('ANJA', 'The console. Noon is coming. It always is.')] },
    ],
    jun: [
      {
        when: '!m15_jun',
        lines: [L('JUN', 'The train keeps arriving. Nobody gets on. Nobody gets off. But I can hear them in the next carriage.'), K('Jun. You\'re a hundred and forty-seven years from your platform.'),
          L('JUN', 'Forty-one seconds, then it starts again. I drive it every morning. The board never says where to.')],
        set: { m15_jun: true, quest_jun: 'active' },
      },
      { when: 'm15_jun', lines: [L('JUN', 'The next carriage. I can hear them.')] },
    ],
  },
  scenes: {
    announce: { lines: [FX(L('PA', 'All passengers to the last train. The last train is the first train. Please remain calm. You were calm yesterday.'), 'pa'), K('Yesterday. They keep saying yesterday.')], set: { m15_board: true } },
    register: { lines: [N('A school register. Thirty names, thirty ticks, today\'s date, in the same ink as yesterday\'s.'), N('Twenty-ninth line: VALE, T. Ticked present.')], set: { ev_register: true }, log: 'The school register: thirty names, ticked every day. VALE, T. among them.' },
    tomasDesk: { lines: [N('One desk has a boy at it who is not quite there. When the bell rings, he flickers.'), K('Vale. Tomas Vale.')], set: { ev_tomas: true } },
    floodLine: { lines: [N('A band of silt along the foot of the west stand, chest-high, painted over in lilac.'), K('The paint is fresh. They paint it every morning.')], set: { ev_flood_line: true } },
    well: { lines: [N('The market well is an old river gauge. Its last mark is scratched by hand: FOURTEENTH.'), N('Under it, smaller: THE RIVER AGAIN.')], set: { ev_well_gauge: true } },
    lock: {
      lines: [N('The lock\'s console. One lever holds the city at its one day. The other lets tomorrow in, and everything that was lost with it.')],
      choices: [
        intent('comfort', 'Stabilize it. Let them rest.', { consequence: true, lines: [L('ANJA', 'Then they rest. I will keep checking the lock at noon. Someone has to remember that it is a lock.')], set: { city_stabilized: true }, ev: 'anja_lock' }),
        intent('challenge', 'Free it. Let tomorrow come.', { consequence: true, lines: [L('ANJA', 'Then it comes. They will hate us for a week, and then they will plant things. I would like to see that.')], set: { city_freed: true }, ev: 'anja_lock' }),
      ],
    },
    carriage: {
      when: '@FUTURE',
      lines: [L('JUN', 'You got them off once. They\'re not in here.', 'jun_line'), L('JUN', 'Then I can stop apologizing.', 'jun_line'),
        N('Kai opens the next carriage. It is full of people with luggage from twenty forty-nine. They step down into twenty-one ninety-six, blinking.', 'jun_evidence'),
        L('JUN', 'There they are. There they all are.', 'jun_evidence'),
        N('The next carriage is empty. Jun\'s echo holds the door open anyway.', '!jun_line && !jun_evidence')],
      set: { quest_jun: 'observed' }, log: 'The train that arrives yesterday: Jun\'s next carriage.',
    },
    carriage_no: { lines: [K('In this year the train is only a timetable.')] },
  },
  deductions: {
    fourteenth: {
      question: [K('The fourteenth. What happened in the market?')],
      answers: [
        { intent: 'challenge', label: 'A Helix test.', lines: [K('That is what the archive card says. The well says otherwise.')] },
        { intent: 'investigate', label: 'A flood. The river came in.', correct: true, needs: 'ev_flood_line && ev_well_gauge',
          lines: [K('The river came into the market on the fourteenth.'), K('The same river. The one I taught to stay.', 'river_diverted')] },
        { intent: 'withdraw', label: 'Nothing. It never happened.', lines: [K('Then why do they paint over it every morning?')] },
      ],
      unproven: [K('Not on a feeling. The silt, the well.')],
      set: { ev_river_14: true }, log: 'The fourteenth was a flood: the river came into the market.',
    },
  },
  rules: [
    { id: 'flaps', when: 'inv_departureBoard_done || rev_departureBoard', say: [N('The flaps clatter forwards and stop on tomorrow. Every line is blank.'), K('No tomorrow. Not even a timetable for one.')], set: { ev_blank_tomorrow: true } },
  ],
  onLoop(rt) {
    // the school bell and the reverse swish of noon (the score's own reset cue plays too)
    rt.score?.cue('pin');
  },
  overlay(P) {
    person(P, { id: 'anja', crew: 'anja', at: 'anjaDesk', off: [0, 0, 1.4], turn: Math.PI, prompt: 'TALK TO ANJA', when: '@FUTURE' });
    person(P, { id: 'mara', crew: 'mara', at: 'pressFoot', off: [1.8, 0, 1.2], turn: Math.PI, prompt: 'TALK TO MARA', when: '@FUTURE' });
    person(P, { id: 'jun_echo', crew: 'jun', at: 'evacTrain', off: [0, 0, -2], turn: Math.PI, hologram: true, when: '@FUTURE', prompt: 'TALK TO THE DRIVER' });
    person(P, { id: 'tomas', crew: 'tomas', at: 'register', off: [-2.5, 0, 1.6], turn: Math.PI, when: '@FUTURE' }); // (on the rim, by his desk)
    person(P, { id: 'warden15', crew: 'warden', at: 'market', off: [6, 0, 2], turn: Math.PI, silent: true, when: '@FUTURE', barks: ['Noon in four minutes. Same as always.'] });
  },
  hook: {
    cue: 'cliff', minutes: 2,
    lines: [REV(N('On the console, the lock\'s install plate: INSTALLED: K. VAREN. WITNESS PROTOCOL. VERSION 9.')), K('I built this?'), L('ANJA', 'No. He did.'),
      L('MARA', 'If you want to know what the attempts cost, go under the city. We keep the failed worlds there.')],
  },
  done: 't_m15_lock',
};
M15.outro = M15.hook.lines;

// =============================================================================================================
// Mission 16: THE MUSEUM OF FAILED WORLDS
// =============================================================================================================
const M16_HINTS = {
  hall: ['The entrance hall.', 'On the rim.', 'Read the halls.'],
  memory1: ['The first memory.', 'In the first cave on the ramp.', 'Play it.'],
  memory2: ['A reel running backwards.', 'In the second cave.', 'REVERSE it, and it plays forwards.'],
  memory3: ['The third memory.', 'Further down.', 'Play it.'],
  compare: ['Cases from this world.', 'The raincoat; the barge in 2049; the pass.', 'Look at two of them.'],
  descend: ['Down the spiral.', 'To the floor.', 'Follow the ramp.'],
  museum: ['Which version explains this place?', 'Three memories, three versions.', 'None of them alone.'],
  photo: ['Behind the waterfall.', 'The deepest cave.', 'The photograph.'],
  catacomb: ['A door behind the falls.', 'Next to the deepest cave.', 'Go in.'],
  names: ['Names on the wall.', 'Three of them I know.', 'Read them.'],
  choiceCases: ['Cases on the floor.', 'By the lens.', 'Look at the cases.'],
  case41: ['A shattered case.', 'In the third cave.', 'REVERSE it.'],
  mara: ['Mara keeps the museum.', 'At the rim gate.', 'Talk to her.'],
};
const M16_PROCESSES = [
  // memory two runs backwards on its reel: held, it plays forwards once (R5)
  {
    id: 'reel', kind: 'recording', at: 'reel', label: 'THE REEL', weight: 0.5, grain: 'pen', aim: [0, 1.2, 0.6],
    clip: { who: 'MIRA', text: 'We had a thousand chances. We only needed one that was ours.' },
    hints: ['The reel runs backwards.', 'A recording runs forwards once.', 'REVERSE the reel.'],
  },
  // a case in the third cave, shattered: held, it reassembles and stays
  {
    id: 'shatteredCase', kind: 'collapse', at: 'shatteredCase', label: 'THE SHATTERED CASE', weight: 0.5, settle: 'settled', grain: 'stone',
    parts: [[-0.45, 1.05], [0.45, 1.05], [-0.45, 1.75], [0.45, 1.75]].map(([x, y], i) => ({ shape: 'box', size: [0.86, 0.66, 0.03], mat: 'glass', at: [x, y, 0.5], rest: { at: [x * 1.8 + (i % 2 ? 0.3 : -0.3), 0.02, 1.2 + i * 0.25], rot: [1.5708, i * 0.7, 0.2] } })),
    props: [{ box: [-0.95, 0, 0.4, 0.95, 0.7, 0.6], mat: 'prop' }], aim: [0, 1.4, 0.5],
    hints: ['A case, in pieces.', 'Glass comes back too.', 'REVERSE the case.'],
  },
];
const M16_MIRA = { crew: 'mira', variant: 'mira' };

export const M16 = {
  key: 'm16', n: 16, chapter: 'act3', name: 'THE MUSEUM OF FAILED WORLDS', title: 'An underground museum', subtitle: 'Objects from worlds that no longer exist.',
  logline: 'A museum in a quarry, a hundred and seventeen cases deep.',
  place: 'sinkhole', sectors: 1, home: 'FUTURE', states: ['FUTURE', 'PAST', 'PRESENT'], drones: [0, 0, 0, 0], ambience: 'hum', ambient: 'future',
  motto: 'WE HAD A THOUSAND CHANCES', gate: 'THE PHOTOGRAPH', crew: C('mara'),
  named: ['mara', 'mira', 'witness'],
  minutes: { main: 30, optional: 8 }, autoExit: 1.2, gateAfter: true,
  processes: M16_PROCESSES,
  spots: [{ id: 'case41label', at: 'shatteredCase', scene: 'case41', prompt: 'THE CASE', offset: [0, 1.0, 1.0], model: 'none',
    texts: [{ text: 'VERSION 41 · UNFINISHED', at: [0, 2.2, 0.5], size: 0.12, color: '#ffc27a', when: 'inv_shatteredCase_done' }] }],
  fragSpots: [['rimBench', 'entranceHall'], ['spiralBend', 'pontoons'], ['lensHall']],
  fragments: [[
    'A case holding one shoe. UNFINISHED. The world it came from got as far as Tuesday.',
    'A lantern on the ramp, lit by someone who leaves before dawn.',
    'A guest book. Every entry is in the same handwriting, and older each time.',
    'A barge manifest from 2049: ITEMS RECOVERED, SOUTH SQUARE, THIS MORNING.',
  ]],
  beats: [{ kind: 'custom', goal: 'Find out who keeps this museum.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    shots: [{ cam: 'rimGate', look: 'entranceHall', t: 9 }],
    lines: [N('Dawn in the sinkhole. Mara opens the museum and dusts a hundred and seventeen cases.'), N('One is new this morning: a child\'s yellow raincoat, labelled VERSION 17.'), L('MARA', 'You weren\'t here yesterday.')],
  },
  quarters: [
    {
      name: 'THE RIM & THE FIRST MEMORY',
      threads: [
        { id: 'hall', kind: 'scene', scene: 'hall', at: 'entranceHall', spot: { prompt: 'THE ENTRANCE HALL', offset: [0, 1.2, 1.4], r: 2.8, kit: 'museumLabel', when: '@FUTURE' },
          goal: 'The museum\'s entrance hall.', because: 'Mara said they keep the failed worlds here.', done: 'ev_unfinished', hints: M16_HINTS.hall, minutes: 3 },
        // (the closing pass: the keeper, the guest book, and the woman who stands at the raincoat case)
        { id: 'mara', kind: 'talk', npc: 'mara', at: 'rimGate', after: ['hall'], goal: 'Mara keeps the museum.', because: 'She dusts every case. She has seen who comes.', done: 'm16_mara', hints: M16_HINTS.mara },
        { id: 'memory1', kind: 'playback', at: 'alcove1', after: ['mara'], prompt: 'MEMORY ONE', kit: 'reelStand', offset: [0, 1.0, 0.6],
          echoes: [{ crew: 'kai', offset: [-1.2, 0, 0.2] }, { ...M16_MIRA, offset: [1.2, 0, -0.4], yaw: 0 }],
          lines: [N('Memory one. Version four.'), N('Kai at the console. Mira in the chair, laughing at something. The ring turns. The lights go.')],
          set: { ev_memory_one: true }, log: 'Memory one, version four: me at the console.',
          goal: 'Play the first memory.', because: 'Three memories of one event. This is the first.', hints: M16_HINTS.memory1, minutes: 4 },
      ],
    },
    {
      name: 'THE SPIRAL',
      threads: [
        { id: 'memory2', kind: 'invert', target: 'reel', at: 'reel', after: ['memory1'],
          spots: [{ id: 'reelStand', scene: 'reelStand', at: 'reel', prompt: 'THE REEL', offset: [0, 0.9, 1.6], r: 2.4, kit: 'reelPlayer' }],
          say: [N('Memory two. Version nine. Mira at the console. Kai in the chair. The ring turns anyway.')], set: { ev_memory_two: true }, log: 'Memory two, version nine: Mira at the console.',
          goal: 'The second memory runs backwards on its reel.', because: 'A recording running backwards plays forwards, once.', hints: M16_HINTS.memory2, minutes: 4 },
        { id: 'memory3', kind: 'playback', at: 'alcove3', after: ['memory2'], prompt: 'MEMORY THREE', kit: 'reelStand', offset: [0, 1.0, 0.6], echoes: [],
          lines: [N('Memory three. Version sixteen.'), REV(N('Nobody at the console. Nobody in the chair. The ring turns by itself.')), K('Then who started it?')],
          set: { ev_memory_three: true }, log: 'Memory three, version sixteen: nobody at the console. The ring turned by itself.',
          goal: 'Play the third memory.', because: 'Two versions, two people at the console.', hints: M16_HINTS.memory3, minutes: 4 },
        { id: 'compare', kind: 'clue', need: 2, of: ['ev_case_coat', 'ev_barge_coat', 'ev_case_pass'], after: ['memory3'],
          spots: [
            { id: 'coatCase', scene: 'coatCase', at: 'alcove2Case', prompt: 'A CASE', offset: [0, 1.2, 0.8], r: 2.4, kit: 'museumCase', when: '@FUTURE' },
            { id: 'bargeManifest', scene: 'barge', at: 'pontoons', prompt: 'THE BARGE\'S MANIFEST', offset: [0, 1.0, 0], r: 2.6, model: NO_MODEL, when: '@PRESENT' },
            { id: 'passCase', scene: 'passCase', at: 'alcove3Case', prompt: 'A CASE', offset: [0, 1.2, 0.8], r: 2.4, kit: 'museumCase', when: '@FUTURE' },
          ],
          say: [K('Things from my world are already in the cases. It isn\'t only keeping the past. It\'s collecting us.')],
          goal: 'Compare the cases with the world they came from.', because: 'Which of these things exist in 2049, now?', hints: M16_HINTS.compare, minutes: 4 },
        { id: 'descend', kind: 'go', at: 'spiralLow', r: 5, after: ['compare'], goal: 'Down the spiral to the floor.', because: 'The Comparison Hall is at the bottom, under the lens.', hints: M16_HINTS.descend, minutes: 2 },
      ],
    },
    {
      name: 'THE COMPARISON HALL',
      threads: [
        { id: 'museum', kind: 'deduce', deduction: 'museum', at: 'deductionBoard', after: ['descend'], spotOpts: { offset: [0, 1.2, 1.2], r: 3, kit: 'chartBoard' },
          goal: 'Which version explains the museum?', because: 'Somebody built this. Somebody keeps adding to it.', hints: M16_HINTS.museum, minutes: 4 },
      ],
      sides: [
        { id: 'cases', name: 'CASES FOR MY CHOICES', done: 'ev_choice_cases && ev_case41', minutes: 2,
          threads: [
            { id: 'choiceCases', kind: 'scene', scene: 'choiceCases', at: 'choiceCases', spot: { prompt: 'THREE CASES', offset: [0, 1.2, 1.2], r: 2.6, kit: 'museumCase' },
              goal: 'Three cases on the floor, labelled for me.', because: 'Things I left behind.', done: 'ev_choice_cases', hints: M16_HINTS.choiceCases, minutes: 1 },
            { id: 'case41', kind: 'invert', target: 'shatteredCase', at: 'shatteredCase', done: 'ev_case41', goal: 'A shattered case in the third cave.', because: 'Its label is in the glass.', hints: M16_HINTS.case41, minutes: 1 },
          ] },
      ],
    },
    {
      name: 'THE PHOTOGRAPH',
      threads: [
        { id: 'photo', kind: 'choice', scene: 'photo', at: 'photoAlcove', after: ['museum'], spot: { prompt: 'THE PHOTOGRAPH', offset: [0, 1.2, 0.6], r: 2.6, kit: 'drawingFrame' },
          goal: 'Behind the waterfall, the deepest cave.', because: 'Mara said someone hung a photograph she did not hang.', done: 'm16_photo', hints: M16_HINTS.photo, minutes: 2 },
      ],
      sides: [
        { id: 'names', name: 'THE NAMES BENEATH THE CITY', case: 'c_names', done: 'ev_erased', minutes: 6,
          threads: [
            { id: 'catacomb', kind: 'go', at: 'catacomb', r: 3, goal: 'A door behind the falls goes down under the city.', because: 'Mara keeps the failed worlds. Who keeps the failed people?', hints: M16_HINTS.catacomb, minutes: 2 },
            { id: 'names', kind: 'clue', need: 3, of: ['ev_name_tomas', 'ev_name_jun', 'ev_name_carriage'], after: ['catacomb'],
              spots: [
                { id: 'nameTomas', scene: 'nameTomas', at: 'catacomb', prompt: 'A NAME', offset: [-1.6, 1.4, 0.4], r: 1.6, model: NO_MODEL },
                { id: 'nameJun', scene: 'nameJun', at: 'catacomb', prompt: 'A NAME', offset: [1.6, 1.4, 0.4], r: 1.6, model: NO_MODEL },
                { id: 'nameCarriage', scene: 'nameCarriage', at: 'catacomb', prompt: 'NINETEEN NAMES', offset: [0, 1.4, -0.6], r: 1.6, model: NO_MODEL },
              ],
              set: { ev_erased: true }, say: [K('Names no world kept. Somebody kept them anyway.')], log: 'Under the city, the names the records erased: Tomas Vale, Jun Park, the 41\'s next carriage.',
              goal: 'The names cut into the catacomb.', because: 'Three of them I know.', hints: M16_HINTS.names, minutes: 4 },
          ] },
      ],
    },
  ],
  talks: {
    mara: [
      {
        when: '!m16_mara',
        lines: [L('MARA', 'Seventeen halls. A hundred cases. I dust them all. Someone keeps adding.'), K('Who?'),
          L('MARA', 'I never see him. I see the guest book. One name every morning, in the same hand, a little older every page.'),
          L('MARA', 'And sometimes a woman. She doesn\'t sign. She stands at the raincoat case and doesn\'t touch the glass.'), K('What does she look like?'),
          L('MARA', 'Like somebody waiting to be told off. Like a sister.'), L('MARA', 'And there is a photograph behind the falls that I never hung.')],
        choices: [
          intent('investigate', 'Show me the guest book.', { lines: [N('Page after page: K. VAREN. K. VAREN. The hand gets older. On the last page, under his name, another hand: STOP BRINGING ME HERE. M.')], set: { m16_mara: 'book' } }),
          intent('comfort', 'Has she ever said anything?', { lines: [L('MARA', 'Once. She said he thinks a museum is a way of saying sorry.'), K('Is it?'), L('MARA', 'I dust it. I don\'t ask it questions.')], set: { m16_mara: 'her' } }),
        ],
      },
      { when: 'm16_mara', lines: [L('MARA', 'The photograph behind the falls. I never hung it. I dust round it.')] },
    ],
  },
  deductions: {
    museum: {
      question: [K('Kai at the console. Mira at the console. Nobody at the console. Which version explains this place?')],
      answers: [
        { intent: 'challenge', label: 'Version four. Mine.', lines: [K('Then who kept the other hundred and sixteen?')] },
        { intent: 'comfort', label: 'Version nine. Hers.', lines: [K('She would not keep a raincoat she has not lost yet.')] },
        { intent: 'investigate', label: 'None alone. Whoever kept all of them.', correct: true, needs: 'ev_memory_one && ev_memory_two && ev_memory_three',
          lines: [K('Nobody built this from one version. Somebody kept every one.'), REV(K('The Witness. This is his museum.'))] },
      ],
      unproven: [K('All three memories first.')],
      set: { ev_museum_his: true }, reveal: true, log: 'The museum is the Witness\'s: he kept every version.',
    },
  },
  scenes: {
    hall: { when: '@FUTURE', lines: [N('Seventeen halls, one for each finished world. Then a hundred cases, each holding one object, each labelled UNFINISHED.'), K('A hundred worlds that never finished.'), K('And seventeen that did. This is the seventeenth.')], set: { ev_unfinished: true }, log: 'Seventeen finished worlds. A hundred unfinished.' },
    hall_no: { lines: [K('In this year it is a quarry. The museum is in twenty-one ninety-six.')] },
    reelStand: { lines: [N('A memory reel on a stand, running backwards. The voice on it speaks in reverse.')] },
    coatCase: { when: '@FUTURE', lines: [N('A child\'s yellow raincoat. VERSION 17. The newest case in the museum.'),
      N('Nobody stands at the case now. On the glass, at a grown woman\'s height, a breath is fading.', 'm16_mara')], set: { ev_case_coat: true } },
    coatCase_no: { lines: [K('The cases are in twenty-one ninety-six.')] },
    barge: { when: '@PRESENT', lines: [N('The Helix barge\'s manifest, twenty forty-nine: ONE CHILD\'S RAINCOAT, YELLOW. RECOVERED SOUTH SQUARE, THIS MORNING.')], set: { ev_barge_coat: true } },
    barge_no: { lines: [K('The barge was here in twenty forty-nine, when the quarry was a lake.')] },
    passCase: { when: '@FUTURE', lines: [N('A junior pass. OVERRIDE 16:02. VERSION 9.'), K('I have the same one. In my pocket.')], set: { ev_case_pass: true } },
    passCase_no: { lines: [K('The cases are in twenty-one ninety-six.')] },
    photo: {
      lines: [N('One photograph, unframed: an older Kai and an older Mira on a bench, in a world the museum has no case for.'), K('We\'re old. We were never old.')],
      choices: [
        intent('investigate', 'Take it.', { consequence: true, lines: [N('Kai puts it in his coat, beside the Chronolith.')], set: { photo_taken: true, m16_photo: true } }),
        intent('withdraw', 'Leave it.', { consequence: true, lines: [K('It belongs to whoever kept it.')], set: { photo_taken: false, m16_photo: true } }),
      ],
    },
    choiceCases: {
      lines: [N('A biscuit tin, rusted shut. FOR KAI, in crayon.', 'mira_tape == "left"'), N('A nurse\'s watch, stopped at the minute a ward let one woman go.', 'odile_released'),
        N('A clock with no hands. EZRA MOLL. FINISHED.', 'ezra_debt == "finish"'), N('A clock with its hands set to Wednesday.', 'ezra_debt == "release"'),
        N('Empty plinths, labelled with my choices.', '!(mira_tape == "left") && !odile_released && !ezra_debt'), K('He keeps what I leave behind.')],
      set: { ev_choice_cases: true },
    },
    case41: { when: 'inv_shatteredCase_done', lines: [N('Whole again, the case holds a child\'s bicycle bell. VERSION 41. UNFINISHED.')], set: { ev_case41: true } },
    case41_no: { lines: [K('Broken glass. It was a case, once.')] },
    nameTomas: { lines: [N('VALE, TOMAS. THE FOURTEENTH.')], set: { ev_name_tomas: true } },
    nameJun: { lines: [N('PARK, JUN. LINE 41. LAST SEEN BOARDING.')], set: { ev_name_jun: true } },
    nameCarriage: { lines: [N('Nineteen names under one heading. LINE 41, NEXT CARRIAGE, 08:13.')], set: { ev_name_carriage: true } },
  },
  overlay(P) {
    person(P, { id: 'mara', crew: 'mara', at: 'rimGate', off: [4, 0, -3], turn: Math.PI, prompt: 'TALK TO MARA', when: '@FUTURE' });
    // (the woman at the raincoat case: across the hall once Mara has spoken of her, gone when Kai reaches the glass)
    person(P, { id: 'mira16', ...M16_MIRA, at: 'alcove2Case', off: [0.9, 0, 2.4], turn: Math.PI, silent: true, hologram: true, when: '@FUTURE && m16_mara && !ev_case_coat' });
  },
  hook: {
    cue: 'cliff', minutes: 2,
    lines: [N('On the back of the photograph, in an older version of Kai\'s handwriting: V. 117. She laughed today. Beginning again.'), REV(K('He kept coming back. He kept bringing her back.'))],
  },
  done: 'm16_photo',
};
M16.outro = M16.hook.lines;

// =============================================================================================================
// Mission 17: THE WITNESS'S ARCHIVE
// =============================================================================================================
const M17_HINTS = {
  corridor: ['Through the racks.', 'A gap in one year is a wall in another.', 'Switch the year, and walk where the gaps line up.'],
  recordings: ['Three recordings, on three dishes.', 'Seventeen, twenty-nine, fifty-eight of a hundred and seventeen.', 'Listen to all three.'],
  match: ['The shelves.', 'One object for each recording.', 'In the order of my age.'],
  mimics: ['Red copies of me.', 'They walk where I walked.', 'Keep off my own old route. Reverse one if it sees me.'],
  echoes: ['The earlier rooms.', 'The huts had roofs in 2026.', 'Go in, in 2026.'],
  shredded: ['Shredded paper.', 'It was one sheet.', 'REVERSE it.'],
  reconstruct: ['The reconstruction.', 'Console, stool, logs.', 'Look at all three.'],
  witness: ['His hologram.', 'In the control hall.', 'Talk to him.'],
  memory: ['The memory.', 'At the console.', 'Play it.'],
  letter: ['An envelope.', 'On the desk in the hall.', 'Decide what to do with it.'],
  mimic: ['A mimic.', 'A patrol walks its last seconds back.', 'REVERSE it.'],
  hers: ['The far dishes are tagged too.', 'Eighty-eight, a hundred and two, a hundred and seventeen.', 'Listen to her.'],
  plaque: ['Who paid for all this?', 'The plaque by the cable trenches.', 'Read it now, then in 2026.'],
};
const M17_ROUTE = { area: [-20, -60, 130, 50] };
const M17_PROCESSES = [
  // a shredded recording sheet in the earlier rooms: held, it flies back into one page, and stays
  {
    id: 'shredded', kind: 'collapse', at: 'earlierRooms', label: 'THE SHREDDED SHEET', weight: 0.5, settle: 'settled', grain: 'pen',
    parts: Array.from({ length: 6 }, (_, i) => ({ shape: 'sheet', size: [0.09, 0, 0.6], mat: 'paper', at: [-0.25 + i * 0.1, 1.06, 0], rest: { at: [-1.2 + i * 0.5, 0.02, 0.9 + (i % 3) * 0.4], rot: [0, i * 0.9, 0] } })),
    props: [{ box: [-0.8, 0, -0.5, 0.8, 1.0, 0.5], mat: 'prop' }], aim: [0, 1.1, 0],
    hints: ['Shredded paper.', 'Paper comes back too.', 'REVERSE the sheet.'],
  },
  // the mimics walk where Kai walked: held, a mimic walks its last seconds back and forgets him
  { id: 'mimicA', kind: 'patrol', target: 'm17_array_q1s0', label: 'A MIMIC', weight: 1, hints: M17_HINTS.mimic },
  { id: 'mimicB', kind: 'patrol', target: 'm17_array_q1s1', label: 'A MIMIC', weight: 1, hints: M17_HINTS.mimic },
];

// the mimics replay Kai's own route through the recordings, a little behind him; and a mimic that sees a held
// process reverses the reversal (it does what Kai would do), which lets it go
function m17Step(rt, dt) {
  const g = rt.g, p = g.player?.pos;
  if (!p || !g.deckWorld?.sentinels) return;
  const S = (rt.m17 ||= { t: 0, route: [], set: 0 });
  if (S.level !== rt.level) Object.assign(S, { level: rt.level, t: 0, route: [], set: 0 });
  const [x0, z0, x1, z1] = M17_ROUTE.area;
  if ((S.t -= dt) <= 0) {
    S.t = 0.5;
    if (p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1) {
      const last = S.route[S.route.length - 1];
      if (!last || Math.hypot(last[0] - p.x, last[1] - p.z) > 2) S.route.push([+p.x.toFixed(1), +p.z.toFixed(1)]);
      if (S.route.length > 160) S.route.shift();
    }
  }
  // every few new points, the mimics take up the route Kai has walked (each its own stretch of it)
  if (S.route.length >= 8 && S.route.length - S.set >= 6) {
    S.set = S.route.length;
    const mimics = g.deckWorld.sentinels.filter((s) => /_q1s\d$/.test(s.def.id));
    mimics.forEach((s, i) => {
      if (rt.inv?.active?.p.sentinel === s) return;
      const half = Math.floor(S.route.length / 2);
      const path = (i % 2 ? S.route.slice(half) : S.route.slice(0, Math.max(4, half))).filter((q, k, a) => k % 2 === 0 || k === a.length - 1);
      if (path.length < 2) return;
      s.def.path = path;
      if (!s.walkedRoute) {
        s.walkedRoute = true;
        s.home.set(path[0][0], 0, path[0][1]);
      }
      s.wp = Math.min(s.wp, path.length - 1);
    });
    g.facts.set('m17_mimics_route', true);
  }
  // the counter-reverse: a mimic that sees what Kai holds runs it forwards again
  const a = rt.inv?.active;
  if (!a || a.lock || g.catching) return;
  const at = rt.inv.aimOf(a.p);
  for (const s of g.deckWorld.sentinels) {
    if (s === a.p.sentinel || s.stasisT > 0 || s.model?.visible === false) continue;
    const dx = at[0] - s.pos.x, dz = at[2] - s.pos.z, d = Math.hypot(dx, dz);
    if (d > (s.def.range || 9) || d < 0.01) continue;
    const cos = (dx * s.dir.x + dz * s.dir.z) / (d * (Math.hypot(s.dir.x, s.dir.z) || 1));
    if (cos < Math.cos(s.def.fov || 0.75)) continue;
    rt.inv.release('mimic');
    g.facts.inc('m17_countered');
    rt.score?.capText('a mimic reversing the reversal');
    if (g.facts.get('m17_countered') === 1) g.hud.say(rt.deck.spoken.counter, g.facts);
    return;
  }
}

export const M17 = {
  key: 'm17', n: 17, chapter: 'act3', name: 'THE WITNESS\'S ARCHIVE', title: 'The archive in the desert', subtitle: 'Recordings from many versions of one life.',
  logline: 'A radio-telescope array on a desert plateau, listening to one man.',
  place: 'array', sectors: 1, states: ['PRESENT', 'PAST', 'FUTURE'], drones: [0, 2, 1, 0], unstable: true, ambience: 'hum', ambient: 'liminal',
  motto: 'THEY BECAME THE PRICE', gate: 'THE CONTROL HALL', crew: C('witness'),
  named: ['witness', 'kai12', 'child'],
  minutes: { main: 32, optional: 6 }, autoExit: 1.2, gateAfter: true,
  processes: M17_PROCESSES,
  spots: [{ id: 'sheetLabel', at: 'earlierRooms', scene: 'sheet', prompt: 'THE SHEET', offset: [0, 1.2, 0.9], model: 'none',
    texts: [{ text: 'RECORDING 117 OF 117', at: [0, 1.1, 0.02], size: 0.09, color: '#2a3442', when: 'inv_shredded_done' }] }],
  zones: [{ at: 'earlierRooms', box: [-14, -1, -10, 14, 4, 10], set: { m17_earlier: true }, when: '@PAST' }],
  spoken: { counter: [K('It reversed my reversal. It does what I would do.')] },
  fragSpots: [['cableTrenches', 'dish8'], ['dish4', 'mimicPatrol']],
  fragments: [[
    'A recording drum labelled 3 OF 117. Silence on it, and breathing.',
    'Frost on a dish, in the shape of a handprint.',
    'A cable tag: LISTEN FOR HER. The handwriting is mine, and steadier.',
  ]],
  beats: [{ kind: 'custom', goal: 'Find what the archive kept.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    // (the closing pass: she is heard first, waking, before he files her)
    shots: [{ cam: 'reconstruction', look: 'controlHall', t: 7 }, { cam: 'arrival', look: 'dish8', t: 8 }],
    lines: [N('RECORDING 117 OF 117.'), FX(L('MIRA', 'Where is he? Not you. Where\'s Kai?'), 'recording'), FX(L('WITNESS', 'Version one hundred and seventeen. She woke. She asked where you were. I did not have an answer she would accept. Beginning again.'), 'recording')],
  },
  quarters: [
    {
      name: 'THE SHIFTING CORRIDOR',
      threads: [
        // (the closing pass: the far dishes keep her side: adult Mira in three of the worlds he made, in her own voice)
        { id: 'hers', kind: 'clue', need: 3, of: ['ev_her88', 'ev_her102', 'ev_her117'],
          spots: [
            { id: 'her88', scene: 'her88', at: 'dish7', prompt: '88 OF 117', offset: [0, 1.2, 0.6], r: 2.8, kit: 'recordingTag' },
            { id: 'her102', scene: 'her102', at: 'dish8', prompt: '102 OF 117', offset: [0, 1.2, 0.6], r: 2.8, kit: 'recordingTag' },
            { id: 'her117', scene: 'her117', at: 'dish9', prompt: '117 OF 117', offset: [0, 1.2, 0.6], r: 2.8, kit: 'recordingTag' },
          ],
          say: [K('A different woman every time. Herself every time. He kept every one of them.')],
          goal: 'The far dishes, tagged with other numbers.', because: 'They are not my recordings. The voice on them is a woman\'s.', hints: M17_HINTS.hers },
        { id: 'corridor', kind: 'go', at: 'corridorEnd', r: 5, after: ['hers'], goal: 'Through the shifting corridors, to the dishes.', because: 'The racks stand differently in every year. Somewhere they line up.', hints: M17_HINTS.corridor, minutes: 5 },
      ],
      sides: [
        { id: 'plaque', name: 'WHO PAID FOR THE ARRAY', done: 'ev_array_paid', minutes: 2,
          threads: [{ id: 'plaqueRead', kind: 'residue', at: 'drumRacks',
            record: { official: 'THE RAIN CITY ARRAY. BUILT BY PUBLIC SUBSCRIPTION, 2031.', echo: 'Under it, in 2026, a foreman\'s ledger page: PAID IN CASH. ONE MAN, GREY. A SCAR ON HIS WRIST. ASKED THAT EVERY DISH FACE THE HILL.',
              hint: 'A plaque, and a page pinned under it.', after: [K('He paid for somewhere to listen to her.')], prompt: 'THE PLAQUE', offset: [-3, 1.3, 1.2], kit: 'bronzePlate',
              log: 'The array was paid for in cash in 2026, by a grey man with a scarred wrist.' },
            goal: 'A plaque by the drum racks.', because: 'Somebody is paying for all this. Nobody will say who.', ev: 'array_paid', hints: M17_HINTS.plaque }] },
      ],
    },
    {
      name: 'THE RECORDINGS',
      threads: [
        { id: 'recordings', kind: 'clue', need: 3, of: ['ev_rec20', 'ev_rec30', 'ev_rec45'], after: ['corridor'],
          spots: [
            { id: 'rec20', scene: 'rec20', at: 'dish5', prompt: '58 OF 117', offset: [0, 1.2, 0.6], r: 2.8, kit: 'recordingTag' },
            { id: 'rec30', scene: 'rec30', at: 'dish2', prompt: '17 OF 117', offset: [0, 1.2, 0.6], r: 2.8, kit: 'recordingTag' },
            { id: 'rec45', scene: 'rec45', at: 'dish3', prompt: '29 OF 117', offset: [0, 1.2, 0.6], r: 2.8, kit: 'recordingTag' },
          ],
          goal: 'Listen to the recordings on the dishes.', because: 'They are tagged with my versions.', hints: M17_HINTS.recordings, minutes: 3 },
        { id: 'match', kind: 'playback', at: 'shelves', after: ['recordings'], prompt: 'THE SHELVES', kit: 'evidenceTray', offset: [0, 1.2, 1.4], echoes: [],
          question: [K('Three recordings. Three things on the shelves. The first?')], next: [K('And the next.')], wrong: [K('Not that one. Not yet.')],
          entries: [{ label: 'A dried yellow ribbon, from a grave.' }, { label: 'An activation key, signed for by nobody.' }, { label: 'One cup, and one chair.' }],
          lines: [N('Twenty: the ribbon. Thirty: the key. Forty-five: one cup, one chair.'), K('My life, in the order I stopped expecting company.')],
          set: { ev_recordings_matched: true }, log: 'The recordings matched to their objects: a ribbon, a key, one cup.',
          goal: 'Match the recordings to the things on the shelves.', because: 'Each recording has its object.', hints: M17_HINTS.match, minutes: 3 },
        { id: 'mimics', kind: 'stealth', at: 'echoGate', r: 4, after: ['match'], goal: 'Past the security that walks my own route.', because: 'Red copies of me, replaying where I went.', hints: M17_HINTS.mimics, minutes: 6 },
      ],
    },
    {
      name: 'THE EARLIER ROOMS',
      threads: [
        { id: 'echoes', kind: 'go', at: 'earlierRooms', done: 'm17_earlier', after: ['mimics'], goal: 'Into the earlier rooms.', because: 'The array\'s first huts. They had roofs in 2026.', hints: M17_HINTS.echoes, minutes: 3 },
        { id: 'shredded', kind: 'invert', target: 'shredded', at: 'earlierRooms', after: ['echoes'], say: [N('The strips fly back into one page. A label, typed: RECORDING 117 OF 117.')],
          ev: 'recording_117', goal: 'A shredded sheet on the hut\'s table.', because: 'Somebody did not want it read.', hints: M17_HINTS.shredded, minutes: 2 },
      ],
    },
    {
      name: 'THE ORIGINAL EXPERIMENT',
      threads: [
        { id: 'reconstruct', kind: 'tasks', of: ['ev_console', 'ev_step_stool', 'ev_two_logs'], at: 'reconstruction', after: ['shredded'],
          spots: [
            { id: 'console', scene: 'console', at: 'reconstruction', prompt: 'THE CONSOLE', offset: [0, 1.3, 2.4], r: 2.2, model: NO_MODEL },
            { id: 'stool', scene: 'stool', at: 'reconstruction', prompt: 'THE STEP STOOL', offset: [-1.2, 0.6, 1.0], r: 1.8, model: NO_MODEL },
            { id: 'logs', scene: 'logs', at: 'reconstruction', prompt: 'TWO LOGS', offset: [2.4, 1.3, 2.4], r: 2.0, kit: 'evidenceTray' },
          ],
          goal: 'The reconstruction of the original experiment.', because: 'Chamber One, 2026, 16:02, rebuilt to the millimetre.', hints: M17_HINTS.reconstruct, minutes: 3 },
        { id: 'witness', kind: 'talk', npc: 'witness', at: 'controlHall', after: ['reconstruct'], goal: 'His hologram stands in the hall.', because: 'He built this. He wants me to see it.', done: 'm17_price', hints: M17_HINTS.witness, minutes: 2 },
        { id: 'memory', kind: 'playback', at: 'reconstruction', after: ['witness'], prompt: 'THE MEMORY', offset: [-3, 1.2, 0.5],
          // (the boy stands on the step stool, 0.35 m: he stood in it)
          echoes: [{ crew: 'kai12', offset: [0, 0.35, 1.3] }, { crew: 'child', variant: 'mira9', offset: [0, 0, 10], yaw: 0 }],
          lines: [N('Chamber One, 2026, 16:02. A boy on a step stool at a console built for grown men. A girl in yellow boots, in the chair, laughing.'), REV(K('I pressed it.')), L('WITNESS', 'You pressed it.')],
          set: { ev_i_pressed: true }, log: 'I pressed the button. I was twelve.',
          goal: 'The memory, at the console.', because: 'He says I should see it once.', hints: M17_HINTS.memory, minutes: 2 },
      ],
      sides: [
        { id: 'letter', name: 'THE UNSENT LETTER', case: 'c_letter', done: 'letter', minutes: 6,
          threads: [{ id: 'letterDesk', kind: 'choice', scene: 'letter', at: 'letterDesk', spot: { prompt: 'AN ENVELOPE', offset: [0, 1.1, 1.2], r: 2.4, kit: 'keepsake' },
            goal: 'An envelope on the desk in the hall.', because: 'It is in Mira\'s handwriting.', done: 'letter', hints: M17_HINTS.letter, minutes: 6 }] },
      ],
    },
  ],
  talks: {
    witness: [
      {
        when: '!m17_price',
        lines: [K('You kept bringing her back.'), L('WITNESS', 'I kept finding a world where she could exist.'), K('And what happened to those worlds?'), REV(L('WITNESS', 'They became the price.'))],
        set: { m17_price: true },
      },
      { when: 'm17_price', lines: [L('WITNESS', 'Look at the stool, Kai.')] },
    ],
  },
  scenes: {
    her88: { lines: [FX(L('MIRA', 'You keep calling me by her name. I think I am her. Am I? Say yes slower.'), 'recording')], set: { ev_her88: true } },
    her102: { lines: [FX(L('MIRA', 'I was a cellist in this one. You came to every concert and never clapped. You only watched my hands.'), 'recording')], set: { ev_her102: true } },
    her117: { lines: [FX(L('MIRA', 'Stop bringing me flowers. Bring me a door.'), 'recording')], set: { ev_her117: true }, log: 'The far dishes kept her side: Mira in three of his worlds. "Bring me a door."' },
    rec20: { lines: [FX(K('Twenty. I come here on her birthday. I bring the yellow ones. The white ones are for funerals.'), 'recording')], set: { ev_rec20: true } },
    rec30: { lines: [FX(K('Thirty. The activation system passed its first test tonight. Rook says it is for clocks. I let him say it.'), 'recording')], set: { ev_rec30: true } },
    rec45: { lines: [FX(L('WITNESS', 'Forty-five. Nobody comes here any more. I talk to the dish, because it answers in her voice. A little.'), 'recording')], set: { ev_rec45: true } },
    sheet: { when: 'inv_shredded_done', lines: [N('RECORDING 117 OF 117. Under it, in pencil: THE LAST ONE. I SAID THAT BEFORE.')] },
    sheet_no: { lines: [K('Strips of paper, typed on. Someone shredded it carefully.')] },
    console: { lines: [N('The console, rebuilt to the millimetre. Built for grown men. The button is at an adult\'s chest.')], set: { ev_console: true } },
    stool: { lines: [N('A child\'s step stool in front of it. Yellow paint on one corner.')], set: { ev_step_stool: true } },
    logs: { lines: [N('Two logs from Chamber One, side by side, sealed in plastic. RING. CONSOLE BUTTON. The times are under the seal.'), K('Not yet. I don\'t want to read them yet.')], set: { ev_two_logs: true }, log: 'Two sealed logs from Chamber One: the ring, the button. I did not read the times.' },
    letter: {
      lines: [N('An envelope in Mira\'s handwriting. TO THE MAN WHO KEEPS BRINGING ME BACK.'), N('It is sealed. It has been sealed for a long time.')],
      choices: [
        intent('comfort', 'Carry it to him.', { consequence: true, lines: [K('He should read it. I\'ll make sure he does.')], set: { letter: 'delivered' } }),
        intent('withdraw', 'Keep it.', { consequence: true, lines: [K('Not to him. Not yet.')], set: { letter: 'kept' } }),
      ],
    },
  },
  step: m17Step,
  overlay(P) {
    person(P, { id: 'witness', crew: 'witness', at: 'controlHall', off: [3, 0, 2], turn: Math.PI, hologram: true, prompt: 'TALK TO HIM' });
  },
  hook: {
    cue: 'cliff', minutes: 2,
    lines: [K('I killed her.'), FX(L('MIRA', 'No.'), 'echo'), N('The archive\'s glass breaks. On the horizon, storms stand up like pillars.'),
      REV(N('Mira\'s body did not survive the week. A pattern of her did. It stayed in the ring.'))],
  },
  done: 'ev_i_pressed',
};
M17.outro = M17.hook.lines;

// =============================================================================================================
// Mission 18: THE FRACTURE
// =============================================================================================================
const M18_HINTS = {
  sera: ['Sera, at the anchor.', 'By the Chronolith bench.', 'Talk to her.'],
  evacuate: ['Three houses.', 'The water keepers, the potter, the school.', 'Knock at each.'],
  canyon: ['The canyon.', 'It was a river in 2026, with an arch.', 'Cross in 2026.'],
  highway: ['The highway.', 'In 2049 it is under water. The storm stands across it in the other years.', 'Walk the lamp-post heads, in 2049.'],
  plan: ['A floor plan.', 'By the skyscraper\'s stump.', 'Read it.'],
  repair: ['Sera is at the stabilizer.', 'The tower\'s base.', 'Listen to her.'],
  hold: ['Keep the pylons in phase.', 'When one drifts, go to it in its own year.', 'One in 2026, one in 2049, one here.'],
  slabs: ['The slabs fell from the core.', 'Last fallen, first back. A stair.', 'REVERSE the slabs and climb while they hold.'],
  climb: ['Up the tilted floors.', 'To the tower\'s deck.', 'Keep climbing.'],
  message: ['A message.', 'On the tower\'s screen.', 'Listen to the message.'],
  signal: ['A signal.', 'From a pocket by the coast.', 'Find it.'],
  iven: ['Iven is out there.', 'In the pocket.', 'Get him out.'],
  porch: ['The potter\'s porch.', 'It fell over his kiln.', 'REVERSE it.'],
  kiln: ['The kiln.', 'Behind the porch.', 'Open it.'],
  scavengers: ['A man at the third pylon.', 'He wants one of its cells.', 'Decide whether he takes it.'],
};
const SCAV = AMB('CROWD_M2');
const M18_PROCESSES = [
  // the core's slabs, fallen into the street: held, they come back last fallen first, a stair to the ramp at 9 m
  {
    id: 'slabs', kind: 'collapse', at: 'slabs', label: 'THE CORE\'S SLABS', weight: 1.5, when: '@FUTURE', arm: 'm18_stabilized', grain: 'stone', mat: 'concrete',
    span: { from: [0, 0, 0], to: [10, 3, 0], width: 3, pieces: 10, thick: 0.4, floor: -6 }, aim: [5, 1.6, 0],
    hints: ['Slabs in the street.', 'They fell in order. Last fallen, first back.', 'REVERSE them, and climb the stair while it holds.'],
  },
  // the potter's porch, down over his kiln's door (the side story)
  {
    id: 'porch', kind: 'collapse', at: 'houseB', label: 'THE PORCH', weight: 1, when: '@FUTURE', grain: 'stone',
    parts: [0, 1, 2].map((i) => ({ shape: 'box', size: [0.3, 2.4, 0.3], mat: 'wood', at: [-1.4 + i * 1.4, 1.2 + 6, 1.4], rest: { at: [-1.6 + i * 1.6, 6.15, 2.4 + i * 0.3], rot: [1.5, i * 0.3, 0] }, fall: i })),
    aim: [0, 7.2, 1.4],
    hints: ['A fallen porch.', 'Fallen things rise.', 'REVERSE the porch.'],
  },
];
// the stabilizer's three pylons, one in each year; the scavengers come for them
const PYLON = (at, name, year, drift, wrongYear) => ({ at, name, year, drift: [K(drift)], anchor: [N('The pylon settles back into its year.')], wrongYear: [K(wrongYear)], steady: [K('It holds.')] });
const PYLONS = [
  PYLON('pylon1', 'PYLON ONE', 'PAST', 'Pylon one is drifting.', 'Not in this year. It answers in twenty twenty-six.'),
  PYLON('pylon2', 'PYLON TWO', 'PRESENT', 'Pylon two is drifting.', 'Not in this year. It answers in twenty forty-nine.'),
  PYLON('pylon3', 'PYLON THREE', 'FUTURE', 'Pylon three is drifting.', 'Not in this year. It answers in twenty-one ninety-six.'),
];

export const M18 = {
  key: 'm18', n: 18, chapter: 'act3', name: 'THE FRACTURE', title: 'The planet, in three states', subtitle: 'Temporal storms. The land changes across the years.',
  logline: 'From the hills to the coast, under a storm of other times.',
  place: 'fracture', sectors: 1, home: 'FUTURE', states: ['FUTURE', 'PAST', 'PRESENT'], drones: [0, 1, 0, 3], ambience: 'wind', ambient: 'future',
  motto: 'THE ONE BEFORE YOU TRIED TO SAVE ME', gate: 'THE TRANSMISSION TOWER', crew: C('sera'),
  named: ['sera', 'mira', 'iven'],
  minutes: { main: 32, optional: 8 }, autoExit: 1.2, gateAfter: true,
  // (round the skyscraper, not through it; and wide of the stabilizer's pylons, so a scavenger never walks through a pylon
  // Kai must re-anchor while it drifts: pylon two is at x 30, the east patrol at x 54, U8 review)
  watch: [[], [[[-30, -96], [30, -96]]], [], [[[-36, 92], [36, 92]], [[-55, 150], [-55, 120]], [[54, 160], [54, 126]]]],
  processes: M18_PROCESSES,
  zones: [{ at: 'towerDeck', box: [-8, -1, -8, 8, 4, 8], set: { m18_on_deck: true }, when: 'm18_stabilized' }],
  fragSpots: [['anchorMast', 'garden'], ['canyonArch', 'highwaySign'], ['verge', 'tollBooth']],
  fragments: [[
    'An evacuation list, every name ticked but one.',
    'A canyon wall with a date cut in it. It will not be a canyon for long.',
    'A highway sign under two metres of water: HELIX NORTH, 3 KM.',
    'A stabilizer manual. In the margin, in Sera\'s hand: THIS PAGE IS WRONG.',
  ]],
  beats: [{ kind: 'custom', goal: 'Reach the transmission tower.' }],
  coldOpen: {
    first: true, minutes: 1, cue: 'card',
    shots: [{ cam: 'chronolithBench', look: 'anchorMast', t: 9 }],
    lines: [N('Storms stand on the horizon like pillars, each one a different hour.'), SAYS('A WATER KEEPER', 'CROWD_F', 'Sera. The anchor light is red again.'),
      L('SERA', 'This page is wrong. So is the next one.'), L('SERA', 'Then we go tonight. Everybody. Not most of you. Everybody.')],
  },
  quarters: [
    {
      name: 'THE ANCHOR SETTLEMENT',
      threads: [
        { id: 'sera', kind: 'talk', npc: 'sera18', at: 'chronolithBench', goal: 'Sera is at the anchor with a manual.', because: 'The settlement\'s anchor is failing.', done: 'm18_sera', hints: M18_HINTS.sera, minutes: 2 },
        { id: 'evacuate', kind: 'tasks', of: ['m18_houseA', 'm18_houseB', 'm18_houseC'], after: ['sera'],
          spots: [
            { id: 'houseA', scene: 'houseA', at: 'houseA', prompt: 'KNOCK: THE WATER KEEPERS', offset: [0, 1.2, 1.4], r: 2.6, kit: 'doorFrame' },
            { id: 'houseB', scene: 'houseB', at: 'houseB', prompt: 'KNOCK: THE POTTER', offset: [0, 1.2, 2.6], r: 2.6, kit: 'doorFrame' },
            { id: 'houseC', scene: 'houseC', at: 'houseC', prompt: 'KNOCK: THE SCHOOLHOUSE', offset: [0, 1.2, 1.4], r: 2.6, kit: 'doorFrame' },
          ],
          set: { m18_evacuated: true }, say: [N('The settlement walks out under the storm, toward the canyon.'), N('The evacuees shelter in Sera\'s garden, the one with water in it.', 'garden_restored')],
          goal: 'Evacuate three houses before the anchor fails.', because: 'Its light is red over every door.', hints: M18_HINTS.evacuate, minutes: 5 },
      ],
      sides: [
        { id: 'kiln', name: 'THE POTTER\'S KILN', done: 'ev_kiln', minutes: 3,
          threads: [
            { id: 'porchRev', kind: 'invert', target: 'porch', at: 'houseB', done: 'rev_porch || ev_kiln', goal: 'The potter\'s porch fell over his kiln.', because: 'He will not leave without his last pot.', hints: M18_HINTS.porch, minutes: 2 },
            { id: 'kilnOpen', kind: 'scene', scene: 'kiln', at: 'houseB', after: ['porchRev'], spot: { prompt: 'THE KILN', offset: [2.4, 1.2, 1.6], r: 2.4, model: NO_MODEL }, goal: 'The kiln, while the porch holds.', because: 'One pot.', done: 'ev_kiln', hints: M18_HINTS.kiln, minutes: 1 },
          ] },
      ],
    },
    {
      name: 'THE CANYON',
      threads: [
        { id: 'canyon', kind: 'go', at: [0, 0, -44, 0], r: 6, after: ['evacuate'], goal: 'Cross the canyon that exists only in the past.', because: 'In 2026 it was a river, with a stone arch over it.', hints: M18_HINTS.canyon, minutes: 4 },
      ],
    },
    {
      name: 'THE FLOODED HIGHWAY',
      threads: [
        { id: 'highway', kind: 'go', at: [6, 0, 88, 0], r: 6, after: ['canyon'], goal: 'Cross the flooded highway in the present.', because: 'The storm stands across it in every other year.',
          say: [K('The river again. The one I taught to stay. It found the road.')], hints: M18_HINTS.highway, minutes: 4 },
      ],
    },
    {
      name: 'THE COLLAPSING SKYSCRAPER',
      threads: [
        { id: 'plan', kind: 'scene', scene: 'plan', at: 'floorFragment', after: ['highway'], spot: { prompt: 'A FLOOR PLAN', offset: [0, 1.0, 1.2], r: 2.6, kit: 'manualStand' },
          goal: 'A floor plan by the skyscraper\'s stump.', because: 'Its floors are numbered strangely.', done: 'ev_fall_order', hints: M18_HINTS.plan, minutes: 1 },
        { id: 'repair', kind: 'cinema', after: ['plan'], lines: [L('SERA', 'Kai. Wrist. I\'m recutting your Chronolith\'s coil from the stabilizer. Two minutes. It stays on you.'),
          L('SERA', 'Three pylons feed the stabilizer, one in twenty twenty-six, one in twenty forty-nine, one here. When one drifts, put it back in its year.'),
          L('SERA', 'And keep the scavengers off them. They think it\'s food.'),
          N('Unwritten fighters take the first pylon. They will hold it.', 'faction == "unwritten"'), N('People from the lock city come up the road. They brought tools.', 'city_freed')],
          goal: 'Sera is at the stabilizer.', because: 'She can make the Chronolith hold longer.', done: 'm18_repair', hints: M18_HINTS.repair, minutes: 1 },
        // (the closing pass: a scavenger father asks for one of the pylons' cells for his daughter's lamp; giving it costs the
        // hold, and the two of them are seen again: at the pylon, and on the Finale's road)
        { id: 'scavengers', kind: 'choice', scene: 'scavs', at: 'pylon3', after: ['repair'], spot: { prompt: 'THE MAN AT THE PYLON', offset: [-2.2, 1.2, 1.6], r: 3, model: NO_MODEL },
          goal: 'A man and a girl at the third pylon.', because: 'He is not stealing. He is asking.', done: 'm18_scav', hints: M18_HINTS.scavengers },
        { id: 'hold', kind: 'hold', at: 'stabilizer', r: 46, after: ['scavengers'], secs: 120, drift: 20, window: 18, label: 'THE STABILIZER',
          posts: PYLONS,
          allies: { 'faction == "unwritten"': 0 }, slow: 'city_freed || m18_scav == "refused"', lapse: [L('SERA', 'Kai! A pylon\'s out!')],
          set: { inv_cap: 12, m18_stabilized: true },
          say: [L('SERA', 'Done. You can say you didn\'t do this, too. It holds twelve seconds now.', 'trust_sera == "deny"'),
            L('SERA', 'Done. I wrote it down, by the way. I came back. It holds twelve seconds now.', 'trust_sera == "accept"'),
            L('SERA', 'Done. Nobody knows what you did. Now nobody can say you didn\'t help. Twelve seconds.', '!(trust_sera == "deny") && !(trust_sera == "accept")')],
          goal: 'Keep the stabilizer\'s pylons in phase while Sera works.', because: 'Two minutes. One pylon in each year.', hints: M18_HINTS.hold, minutes: 6 },
        { id: 'slabStair', kind: 'tasks', of: ['rev_slabs'], at: 'slabs', after: ['hold'], goal: 'The core\'s fallen slabs: a stair, if they come back in order.', because: 'Floors numbered in the order they fall.', hints: M18_HINTS.slabs, minutes: 3 },
        { id: 'climb', kind: 'go', at: 'towerDeck', done: 'm18_on_deck', after: ['slabStair'], goal: 'Up the tilted floors to the tower\'s deck.', because: 'The transmission tower. Something is on its screen.', hints: M18_HINTS.climb, minutes: 2 },
        { id: 'message', kind: 'cinema', after: ['climb'],
          lines: [FX(L('MIRA', 'I remember the first world.'), 'radio'), K('Which one?'), REV(FX(L('MIRA', 'The one before you tried to save me.'), 'radio'))],
          set: { ev_mira_message: true }, goal: 'Mira\'s message, on the tower\'s screen.', because: 'Her face. No shadow under it.', hints: M18_HINTS.message, minutes: 1 },
      ],
      sides: [
        { id: 'signal', name: 'THE LAST SIGNAL', giver: 'iven', case: 'c_signal', done: 'last_signal', minutes: 5,
          threads: [
            { id: 'signalGo', kind: 'go', at: 'pocket', r: 6, goal: 'A signal from a pocket by the coast.', because: 'Somebody is calling on an old Helix band.', hints: M18_HINTS.signal, minutes: 2 },
            { id: 'ivenTalk', kind: 'talk', npc: 'iven', at: 'pocket', after: ['signalGo'], goal: 'Iven, in a collapsing pocket of time.', because: 'He is calling from twenty forty-nine.', done: 'last_signal', hints: M18_HINTS.iven, minutes: 3 },
          ] },
      ],
    },
  ],
  talks: {
    sera18: [
      {
        when: '!m18_sera',
        lines: [L('SERA', 'The anchor mast is failing. Three houses still inside the line.'), K('And the Chronolith?'), L('SERA', 'Later. People first. Then I fix you.')],
        set: { m18_sera: true },
      },
      { when: 'm18_sera', lines: [L('SERA', 'The houses, Kai.')] },
    ],
    iven: [
      {
        when: '!last_signal',
        lines: [L('IVEN', 'Varen. You hear me? The pocket\'s folding.'), L('IVEN', 'You got my team out once. This time it\'s only me.', 'iven_team_saved'),
          L('IVEN', 'You kept the log. I kept waiting. Here I am.', '!iven_team_saved'), K('Take my hand.'), N('The pocket folds shut behind them, very quietly.'),
          L('IVEN', 'I owe you a route. When you need one, call.')],
        set: { last_signal: true, quest_iven: 'resolved' },
      },
      { when: 'last_signal', lines: [L('IVEN', 'When you need a route, call.')] },
    ],
  },
  scenes: {
    houseA: { lines: [N('The water keepers, packed already, as if somebody told them yesterday.'), SAYS('A WATER KEEPER', 'CROWD_F', 'The canyon. In the old year. We know.')], set: { m18_houseA: true } },
    houseB: { lines: [N('The potter will not leave his kiln. His porch has come down across its door.'), K('Go. I\'ll get your pot.')], set: { m18_houseB: true } },
    houseC: { lines: [N('Eleven children and a teacher counting them twice. The anchor light over the door is red.'), SAYS('THE TEACHER', 'CROWD_F2', 'Eleven. Eleven. Go on, then.')], set: { m18_houseC: true } },
    kiln: { when: 'rev_porch', lines: [N('While the porch stands, the kiln\'s door opens. One pot, still warm: a bowl with three notes painted round it.')], set: { ev_kiln: true } },
    kiln_no: { lines: [K('The porch is across the door.')] },
    scavs: {
      lines: [SCAV('Please. One cell off the pylon. My girl\'s lamp has been dark a week, and the dark out here has things in it.'),
        L('SERA', 'Every cell he takes, the pylons drift faster while I work. Your call, Varen.')],
      choices: [
        intent('comfort', 'Take one. Take the lamp\'s worth.', { consequence: true, lines: [SCAV('Thank you. Thank you.'), SAYS('HIS DAUGHTER', 'CROWD_CHILD', 'It\'s lit! Dad, look, it\'s lit!'), L('SERA', 'Then hold them harder.')], set: { m18_scav: 'shared' } }),
        intent('challenge', 'Not tonight. I need every one of them.', { consequence: true, lines: [SCAV('Then we\'ll find a way to take it.'), N('He takes the girl\'s hand and walks back into the storm without looking round.'), L('SERA', 'He will, too.')], set: { m18_scav: 'refused' } }),
      ],
    },
    plan: { lines: [N('A floor plan from the skyscraper. The floors are numbered not by height, but in the order they fell.'), K('Last fallen, first back. Like the hospital\'s lock.')], set: { ev_fall_order: true }, log: 'The skyscraper\'s floors are numbered in the order they fell.' },
  },
  overlay(P) {
    person(P, { id: 'sera18', crew: 'sera', at: 'chronolithBench', off: [2, 0, 2], turn: Math.PI, prompt: 'TALK TO SERA', when: '!m18_evacuated' });
    person(P, { id: 'sera18b', crew: 'sera', at: 'stabilizer', off: [0, 0, -5], turn: 0, silent: true, when: 'm18_evacuated' });
    person(P, { id: 'iven', crew: 'iven', at: 'pocket', off: [0, 0, 1.6], turn: Math.PI, hologram: true, when: '!last_signal', prompt: 'TALK TO IVEN' });
    person(P, { id: 'm18_fighter', crew: 'm18_fighter', first: 'An Unwritten fighter', seed: 1801, ambient: true, at: 'pylon1', off: [1.6, 0, 1.6], turn: Math.PI, silent: true, when: 'faction == "unwritten" && m18_evacuated' });
    person(P, { id: 'm18_citizen', crew: 'm18_citizen', first: 'From the lock city', seed: 1802, ambient: true, at: 'pylon2', off: [1.6, 0, 1.6], turn: Math.PI, silent: true, when: 'city_freed && m18_evacuated' });
    // the scavenger and his daughter at the third pylon: asking; then, given a cell, sitting by it under her lamp; refused,
    // gone back into the storm
    person(P, { id: 'm18_scav', crew: 'm18_scav', first: 'A scavenger', seed: 1803, ambient: true, at: 'pylon3', off: [-2.2, 0, 2.6], turn: Math.PI, silent: true, when: 't_m18_repair && !(m18_scav == "refused")' });
    person(P, { id: 'm18_scavgirl', crew: 'm18_scavgirl', first: 'His daughter', seed: 1804, ambient: true, at: 'pylon3', off: [-3.4, 0, 2], turn: Math.PI * 0.8, silent: true, when: 't_m18_repair && !(m18_scav == "refused")' });
    person(P, { id: 'mira_msg', crew: 'mira', at: 'transmissionScreen', off: [0, 0, 1.2], turn: Math.PI, hologram: true, silent: true, when: 't_m18_climb' });
  },
  hook: {
    cue: 'cliff', minutes: 2,
    lines: [FX(L('MIRA', 'Come to the second that isn\'t on any clock. Come without fixing anything.'), 'radio'), N('The tower\'s screen reads zero hours, zero minutes, zero seconds. Then a time with no digits in it at all.')],
  },
  done: 't_m18_message',
};
M18.outro = M18.hook.lines;

export const ACT3 = [M14, M15, M16, M17, M18];
