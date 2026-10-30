// Northbank, Rain City North (Mission 9, NINE MINUTES TO ZERO; OVERHAUL.md §5 M9, D3). Loop City: the
// 19th-century hill quarter across the river from Helix, replaying 08:05-08:14 of the Zero Second morning.
// From the river quay the town climbs north in four terraces (6, 12, 18 and 24 m) of pale limestone
// and brick under slate and copper roofs: the iron market loggia on the square, stair-streets and the
// cathedral steps up the middle, the funicular up the east side with its mid-station, glass skyways
// between the upper terraces, the cathedral on the third terrace. On the headland over the river mouth
// to the south-west stands the Helix North transmitter, 45 m of lattice. Helix's crescent glows on the
// Ring Hill across the river to the south; the Notch to the north-east; the open sea to the west.
// 2049, the sunbreak: a low gold sun under a lifting rain shelf, wet stone. 2026: a clear harbour
// morning, fewer floors, the old timber market, and on the headland only the old lighthouse in scaffold.
//   START                 the quay (z 60 .. 100)
//   CLOCK A               the market square (x -60 .. 20, z 20 .. 70)
//   CLOCK B               the funicular and its mid-station (x 20 .. 100)
//   CLOCK C               the cathedral steps and terrace (x -40 .. 20, z -100 .. 20)
//   THE CONTROL TOWER     the headland (x -100 .. -40)
import { ground, terrace, stair, ramp, water, railing, block, prop, sign, canopy, colonnade, spiralStair, lattice } from '../archetypes.js';

const FX0 = 72, FX1 = 76; // the funicular's stair-street; its rails run beside it to the east
const TOWER = [-78, 46]; // the transmitter on the headland
const HEAD = 6; // the headland's height

// a clock's face (v2.1.1 playtest L37: the three clocks were blank discs): a white dial in a dark rim, its twelve hour
// marks, and its hands at 08:05, the loop's first minute; at (x, y, z), facing the way ry turns +z, radius r
function clockFace(P, x, y, z, ry, r = 0.75) {
  const c = Math.cos(ry), s = Math.sin(ry);
  const at = (dx, dy, dz) => [x + dx * c + dz * s, y + dy, z - dx * s + dz * c];
  P.cyl(...at(0, 0, -0.02), r, 0.06, 'clockFaceWhite', { seg: 28, rx: Math.PI / 2, ry });
  P.torus(...at(0, 0, 0.02), r, 0.06, 'ironDark', { ry, seg: 32 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, big = i % 3 === 0;
    const [px, py, pz] = at(Math.sin(a) * r * 0.82, Math.cos(a) * r * 0.82, 0.05);
    P.obox(px, py - (big ? 0.07 : 0.04), pz, big ? 0.05 : 0.03, big ? 0.14 : 0.08, 0.02, ry, 'ironDark', { rz: 0, noShadow: 1 });
  }
  // the hands: the hour hand just past 8, the minute hand on 1 (08:05)
  for (const [ang, len, w] of [[-(8 + 5 / 60) * (Math.PI / 6), r * 0.5, 0.06], [-(5 / 60) * Math.PI * 2, r * 0.75, 0.035]]) {
    const [hx, hy, hz] = at(-Math.sin(ang) * len * 0.5, Math.cos(ang) * len * 0.5, 0.07);
    P.obox(hx, hy - len / 2, hz, w, len, 0.02, ry, 'ironDark', { rz: ang, noShadow: 1 });
  }
}

// a house: its first `then` floors in both years; in 2049 `now - then` more and their roof, in 2026 a roof on the first
function house(P, rect, now, then, o = {}) {
  const fh = 3.4;
  const b = block(P, { rect, floors: then, roof: 'none', cornice: false, ...o });
  const top = b.y + then * fh;
  const roof = o.roof || 'gable';
  P.E('PRESENT', () => block(P, { rect, y: top, h: (now - then) * fh, roof, roofMat: o.roofMat, tint: o.tint, facade: o.facade, cornice: true, dormers: o.dormers, chimney: o.chimney, solid: true }));
  P.E('PAST', () => {
    if (roof === 'flat') P.vbox([b.x0 - 0.15, top, b.z0 - 0.15, b.x1 + 0.15, top + 0.4, b.z1 + 0.15], 'roofDark');
    else block(P, { rect, y: top, h: 0.3, roof: 'gable', roofMat: 'slate', tint: o.tint, facade: o.facade, cornice: false, solid: false });
  });
  return b;
}

export default {
  key: 'northbank', style: 'northbank', sameAs: null, name: 'NORTHBANK',
  bounds: [-100, -100, 100, 100],
  edges: { N: 'hill', E: 'hill', W: 'water', S: 'water' },
  killY: -3,
  primary: 'transmitter',
  backdrop: { notch: 'clear', sea: 270, helix: 'crescent' },
  years: {
    PRESENT: { sky: 'sunbreak', era: '2049', hour: 8.1, sun: { elev: 6, az: 92 }, fog: 0xd8c0a0, density: 0.9, night: 0.12, weather: null, ibl: 'dusk', lit: 0.25,
      hemi: { sky: 0x9ec8f0, ground: 0x6a6458, k: 0.85 }, sunColor: 0xffc878, sunK: 1.25, grade: { shadowTint: 0x2a3450, highlightTint: 0xffe0b0, toning: 0.2, contrast: 1.14, saturation: 1.04 } },
    PAST: { sky: 'harbourMorning', era: '2026', hour: 10.4, sun: { elev: 38, az: 130 }, fog: 0xc8d8e4, density: 0.8, night: 0, weather: null, ibl: 'plant', lit: 0,
      hemi: { sky: 0xd6e6f2, ground: 0x7a7a70, k: 0.95 }, sunColor: 0xfff6e0, sunK: 1.2, grade: { shadowTint: 0x2a3a4a, highlightTint: 0xfff6e8, toning: 0.08, contrast: 1.08, saturation: 1.0 } },
  },
  quarters: [
    // Kai steps off the ferry and looks up the main street: the market loggia, the terraces, the cathedral
    { name: 'START', area: [-40, 60, 60, 100], spawn: [0, 0, 87, 0.05], threshold: { at: 'funicularStation', kind: 'street' } },
    { name: 'CLOCK A — OBSERVATION', area: [-60, 20, 20, 60], spawnAt: 'marketGate', threshold: { at: 'cathedralFoot', kind: 'stair' } },
    { name: 'CLOCK B — THE ENEMY ROUTE', area: [20, -100, 100, 60], spawnAt: 'funicularStation', threshold: { at: 'towerBase', kind: 'tower' } },
    { name: 'CLOCK C — THE LOOP TRIGGER', area: [-40, -100, 20, 20], spawnAt: 'cathedralSteps', threshold: null }, // (spawns at the steps' first landing, in its quarter)
    { name: 'THE CONTROL TOWER', area: [-100, -40, -40, 80], spawnAt: 'headlandStair', threshold: null },
  ],
  beatAt: { m09: ['clockA', 'orderBoard', 'towerBase'] },
  exits: { m09: 'towerTop' },
  frags: { m09: [['quayBench', 'loggiaStall', 'marketFountain'], ['funicularTrack', 'midStation', 'skyways']] },
  // the Continuum's patrols walk the lower town (a watcher's eye stays at street level)
  watch: { m09: [
    [[[12, 78], [50, 78], [50, 86], [12, 86]]], // (clear of the spawn at (0, 87): M9's deck.watch, F15)
    [[[32, 30], [66, 30], [66, 54], [32, 54]], [[-54, 22], [-48, 22], [-48, 58], [-20, 58]]],
    [[[-50, 24], [-12, 24], [-12, 56], [-50, 56]], [[20, 79], [60, 79]]],
  ] },
  crowd: [
    { era: 'present', years: ['PRESENT'], region: 'northbank', role: 'evacuee', path: [[-4, 90], [-4, 34], [4, 30]], n: 6 },
    { era: 'present', years: ['PRESENT'], region: 'northbank', role: 'responder', path: [[30, 77], [56, 77]], n: 3 },
    { era: 'present', years: ['PAST'], region: 'northbank', role: 'shopper', path: [[-38, 39], [-14, 39], [-14, 51]], n: 5 },
  ],

  build(P) {
    // --- the ground: the lower town, the four terraces, the headland, the river along the south ----------------
    ground(P, [-100, -100, 100, 92], 0, 'limestonePave');
    water(P, [-100, 92, 100, 100], -1.4, 'harbourWater', { depth: 3 });
    P.vbox([-100, -1.6, 91.6, 100, 0.02, 92.2], 'limestoneBlock');
    P.drown([-100, 92.2, 100, 100], -0.6);
    // (the terraces nest: each one's front at its own edge)
    terrace(P, [-100, -100, 70, 20], 6, 'limestonePave', { wall: 'limestoneBlock', sides: 'S', cap: 'limestoneBlock' });
    terrace(P, [-100, -100, 70, -15], 12, 'limestonePave', { wall: 'limestoneBlock', sides: 'S', cap: 'limestoneBlock' });
    terrace(P, [-100, -100, 70, -45], 18, 'limestonePave', { wall: 'limestoneBlock', sides: 'S', cap: 'limestoneBlock' });
    terrace(P, [-100, -100, 70, -75], 24, 'limestonePave', { wall: 'limestoneBlock', sides: 'S', cap: 'limestoneBlock' });
    // the headland over the river mouth: a rock outcrop at 6 m with the transmitter
    terrace(P, [-100, 26, -56, 76], HEAD, 'rockGrass', { wall: 'rock', sides: 'ES' });
    P.land('headlandStair', -50, 0, 52, -Math.PI / 2);
    stair(P, -48.6, 50, 0, -56, 50, HEAD, 4, 'stairStone');
    // --- the quay: the promenade, the ferry pontoon, bollards, a kiosk ------------------------------------------
    P.land('ferryQuay', 14, 0, 88, 0);
    P.land('quayBench', -14, 0, 86, 0);
    P.box([6, -0.4, 90, 22, 0.05, 100], 'quayTimber');
    for (let x = -96; x <= 96; x += 8) prop(P, 'bollard', x, 91, 0, { m: 'ironDark' });
    prop(P, 'bench', -14, 84, 0);
    prop(P, 'bench', 34, 84, 0);
    prop(P, 'kiosk', -28, 82, 0, { m: 'ironLoggia' });
    for (const x of [-60, -30, 30, 60]) prop(P, 'lampPost', x, 80, Math.PI / 2);
    sign(P, 'NORTHBANK FERRY', 14, 3.2, 89.2, Math.PI, { size: 0.36, color: '#f4ead8' });
    // the quay front: houses with shops facing the river, a street up the middle (x -8 .. 8)
    for (const [x0, x1, now, then, roof, tint] of [[-96, -74, 5, 3, 'gable', 0xf4ece0], [-72, -50, 6, 4, 'mansard', 0xd8c4b0], [-48, -30, 5, 3, 'gable', 0xc89a80], [-28, -10, 6, 4, 'hip', 0xf0e4d4], [10, 28, 6, 3, 'mansard', 0xe8dccc], [30, 46, 5, 3, 'gable', 0xc89a80], [48, 66, 6, 4, 'hip', 0xf4ece0]]) {
      house(P, [x0, 62, x1, 76], now, then, { roof, tint, roofMat: roof === 'mansard' ? 'copperRoof' : 'slate', shop: { side: 'S', color: 0xffd9a8, awning: 'awningGreen' } });
    }
    // --- CLOCK A: the market square and its iron loggia ---------------------------------------------------------
    P.land('marketGate', -4, 0, 58, 0);
    P.land('marketLoggia', -26, 0, 44, Math.PI / 2);
    P.land('clockA', -8, 0, 40, Math.PI / 2);
    P.land('loggiaStall', -30, 0, 34, 0);
    P.land('marketFountain', -40, 0, 26, 0);
    P.E('PRESENT', () => {
      colonnade(P, -44, 30, -44, 54, 7, 6.5, 0.22, 'ironLoggia', { beam: true, beamMat: 'ironLoggia' });
      colonnade(P, -12, 30, -12, 54, 7, 6.5, 0.22, 'ironLoggia', { beam: true, beamMat: 'ironLoggia' });
      P.vbox([-45, 6.5, 29, -11, 6.8, 55], 'ironLoggia');
      for (let i = 0; i < 6; i++) P.gable(-28, 6.8, 31 + i * 4, 4.2, 32, 1.8, Math.PI / 2, 'glassRoof');
    });
    P.E('PAST', () => {
      // 2026: the older market: timber posts and a long slate roof
      colonnade(P, -44, 30, -44, 54, 5, 5, 0.3, 'timber', { beam: true });
      colonnade(P, -12, 30, -12, 54, 5, 5, 0.3, 'timber', { beam: true });
      P.gable(-28, 5.3, 42, 36, 26, 4.4, 0, 'slate');
      for (const z of [34, 42, 50]) prop(P, 'stall', -20, z, Math.PI / 2, { awning: 'awningRed' });
    });
    for (const z of [34, 44, 52]) prop(P, 'stall', -36, z, -Math.PI / 2, { awning: 'awningGreen', goods: 'produce' });
    P.cyl(-40, 0, 26, 2.4, 0.7, 'limestoneBlock', { seg: 16, solid: true });
    P.disc(-40, 0.65, 26, 2.1, 'fountainWater', { noShadow: 1 });
    P.cyl(-40, 0.7, 26, 0.3, 2.2, 'limestoneBlock', { seg: 8 });
    prop(P, 'clockPost', -8, 40, 0);
    P.cyl(-8, 0, 40, 0.14, 4.6, 'ironDark', { seg: 8, solid: true });
    P.cyl(-8, 4.6, 40, 0.75, 0.25, 'clockFaceWhite', { seg: 20, rx: Math.PI / 2, rz: Math.PI / 2 });
    for (const ry of [Math.PI / 2, -Math.PI / 2]) clockFace(P, -8 + Math.sin(ry) * 0.13, 4.6, 40 + Math.cos(ry) * 0.13, ry);
    sign(P, 'MARKET', -28, 7.6, 29, Math.PI, { size: 0.5, board: 0, color: '#2e3a34', e: ['PRESENT'] });
    // the square's east side: houses and the street up to the steps
    for (const [z0, z1, now, then, tint] of [[24, 40, 5, 3, 0xe8dccc], [42, 58, 6, 4, 0xd8c4b0]]) house(P, [10, z0, 30, z1], now, then, { tint, roof: 'hip', roofMat: 'copperRoof', shop: { side: 'W', color: 0xffd9a8 } });
    // (and on the headland, two keepers' cottages clear of the transmitter's ring and the way to it from the stair)
    for (const [x0, z0, x1, z1, now, then, tint] of [[-99, 34, -90, 44, 4, 3, 0xf4ece0], [-68, 27, -59, 35, 3, 2, 0xc89a80]]) house(P, [x0, z0, x1, z1], now, then, { tint, roof: 'gable', roofMat: 'slate' });
    // --- CLOCK B: the funicular, its stair-street, the mid-station, the order board -------------------------------
    P.land('funicularStation', 74, 0, 50, Math.PI);
    P.land('funicularTrack', 74, 6, 20, Math.PI);
    P.land('midStation', 74, 12, -19, -Math.PI / 2);
    P.land('clockB', 70.5, 12, -22, -Math.PI / 2);
    P.land('orderBoard', 66, 12, -19, Math.PI / 2);
    P.box([70, 0, 46, 82, 0.3, 56], 'stairStone');
    P.box([82, 0, 46, 82.4, 4.2, 56], 'limestoneBlock');
    canopy(P, { rect: [70, 46, 82, 56], h: 4.4, roof: 'copperRoof', span: 6, postMat: 'ironLoggia' });
    sign(P, 'FUNICULAR', 76, 3.6, 45.8, Math.PI, { size: 0.42, color: '#f4ead8' });
    ramp(P, [FX0, -14, FX1, 46], 0, 12, 'N', 'stairStone', { terrain: false });
    P.box([FX0 - 1, 11.7, -24, 82, 12, -14], 'stairStone'); // the mid-station landing
    ramp(P, [FX0, -85, FX1, -24], 12, 24, 'N', 'stairStone', { terrain: false });
    P.box([FX0 - 4, 23.7, -100, 82, 24, -85], 'stairStone'); // the top station
    P.box([70, 11.7, -24, FX0, 12, -14], 'stairStone'); // onto the second terrace
    // clock B, on its post at the mid-station, its face to the funicular's stair-street (M9)
    P.cyl(70.5, 12, -22.6, 0.12, 3.6, 'ironDark', { seg: 8, solid: true });
    clockFace(P, 70.5, 15.2, -22.45, 0, 0.6);
    // the rails and the car (2049: red; 2026: the old green car at the bottom)
    for (const x of [77.6, 80]) {
      P.obox(x, 6, 16, 0.12, 0.2, 61, 0, 'steel', { rx: Math.atan2(12, 60), noShadow: 1 });
      P.obox(x, 18, -54.5, 0.12, 0.2, 62, 0, 'steel', { rx: Math.atan2(12, 61), noShadow: 1 });
    }
    railing(P, FX1, -85, FX1, 46, 1.1, 'ironDark', { solid: false });
    P.E('PRESENT', () => P.obox(78.8, 7.4, -5, 2.6, 3.2, 7, 0, 'funicularRed', { rx: Math.atan2(12, 60) }));
    P.E('PAST', () => P.obox(78.8, 0.4, 44, 2.6, 3.0, 7, 0, 'containerGreen'));
    // the order board at the mid-station: the cancelled evacuation order
    // the east hillside behind the funicular
    for (const [z, h] of [[30, 6], [-10, 14], [-50, 22], [-90, 30]]) P.obox(92, -2, z, 16, h + 2, 40, 0.05, 'rockGrass', { solid: true });
    // --- CLOCK C: the cathedral steps, the cathedral, the loop's edge ---------------------------------------------
    P.land('cathedralFoot', 0, 0, 32, Math.PI);
    P.land('cathedralSteps', 0, 6, 14, Math.PI);
    stair(P, 0, 29, 0, 0, 20, 6, 14, 'cathedralStone');
    stair(P, 0, -6, 6, 0, -15, 12, 12, 'cathedralStone');
    stair(P, 0, -36, 12, 0, -45, 18, 12, 'cathedralStone');
    for (const z of [8, -26]) for (const s of [-1, 1]) prop(P, 'lampPost', s * 8, z, s < 0 ? 0 : Math.PI, { y: z > 0 ? 6 : 12 });
    P.land('clockC', 0, 18, -50, 0);
    P.land('loopEdge', -60, 18, -47, Math.PI);
    prop(P, 'clockPost', 4, -50, 0, { y: 18 });
    // clock C, the trigger: a tall dial on its post, its face down the cathedral steps (M9)
    P.cyl(4, 18, -50.3, 0.12, 3.8, 'ironDark', { seg: 8, solid: true });
    clockFace(P, 4, 21.4, -50.15, 0, 0.7);
    // the cathedral: a limestone front with a rose window, a copper dome, two towers
    P.box([-20, 18, -78, 20, 34, -58], 'cathedralStone');
    P.box([-26, 18, -64, -20, 42, -58], 'cathedralStone');
    P.box([20, 18, -64, 26, 42, -58], 'cathedralStone');
    P.cone(-23, 42, -61, 4.4, 9, 'copperRoof', { seg: 8 });
    P.cone(23, 42, -61, 4.4, 9, 'copperRoof', { seg: 8 });
    P.dome(0, 34, -68, 11, 12, 'copperRoof', { seg: 24 });
    P.cyl(0, 45, -68, 1.2, 4, 'cathedralStone', { seg: 10 });
    P.cyl(0, 27, -57.9, 3.4, 0.2, 'roseWindow', { seg: 24, rx: Math.PI / 2 });
    P.box([-4, 18, -58.4, 4, 25, -57.8], 'doorDark');
    for (let i = 0; i < 6; i++) P.cyl(-15 + i * 6, 18, -56, 0.6, 9, 'cathedralStone', { seg: 10, solid: true });
    P.vbox([-18, 27, -57.6, 18, 28.4, -55], 'cathedralStone');
    // the cathedral terrace: benches, the parapet over the town
    railing(P, -100, -45.3, -6, -45.3, 1.1, 'limestoneBlock', { y: 18 });
    railing(P, 6, -45.3, 70, -45.3, 1.1, 'limestoneBlock', { y: 18 });
    prop(P, 'bench', -30, -50, 0, { y: 18 });
    prop(P, 'bench', 30, -50, 0, { y: 18 });
    // --- the terraces' houses and lanes -----------------------------------------------------------------------
    for (const [x0, x1, z0, z1, now, then, tint] of [
      [-96, -70, -12, 12, 5, 3, 0xf0e4d4], [-58, -22, -12, 8, 4, 3, 0xc89a80], [14, 40, -12, 10, 5, 3, 0xe8dccc], [44, 66, -12, 12, 4, 2, 0xf4ece0],
      [-96, -70, -42, -20, 4, 3, 0xd8c4b0], [-58, -26, -42, -22, 5, 3, 0xf0e4d4], [14, 44, -42, -22, 4, 2, 0xc89a80], [48, 66, -42, -28, 4, 3, 0xe8dccc],
      [-96, -66, -72, -54, 3, 2, 0xf4ece0], [36, 66, -72, -52, 4, 2, 0xd8c4b0], [-96, -40, -100, -80, 3, 2, 0xe8dccc], [30, 66, -100, -82, 3, 2, 0xf0e4d4],
    ]) house(P, [x0, z0, x1, z1], now, then, { tint, roof: now > 4 ? 'mansard' : 'gable', roofMat: (x0 + z0) % 3 ? 'slate' : 'copperRoof', chimney: true });
    // the skyways: glass bridges from the second terrace's houses up to the cathedral terrace (2049 only)
    P.land('skyways', -40, 18, -46, Math.PI);
    P.E('PRESENT', () => {
      for (const x of [-44, 28]) {
        P.obox(x, 18, -41, 3.2, 2.8, 8.4, 0, 'glass', { noShadow: 1 });
        P.obox(x, 17.7, -41, 3.4, 0.3, 8.4, 0, 'steel', { noShadow: 1 });
      }
    });
    // the west stair-street (both years) and, in 2026 only, the old stair beside the funicular
    stair(P, -64, 29, 0, -64, 20, 6, 4, 'stairStone', { rail: 'ironDark' });
    stair(P, -64, -6, 6, -64, -15, 12, 4, 'stairStone', { rail: 'ironDark' });
    stair(P, -64, -36, 12, -64, -45, 18, 4, 'stairStone', { rail: 'ironDark' });
    stair(P, -30, -66, 18, -30, -75, 24, 4, 'stairStone', { rail: 'ironDark' });
    // --- THE CONTROL TOWER: the transmitter (2049), the old lighthouse in scaffold (2026) ---------------------------
    const [tx, tz] = TOWER;
    P.land('towerBase', tx + 7, HEAD, tz + 6, Math.PI / 4);
    P.land('transmitter', tx, HEAD, tz, 0);
    P.box([tx - 6, HEAD, tz - 6, tx + 6, HEAD + 0.3, tz + 6], 'damConcrete'); // (a step up from the headland)
    // the climb: a stair spiralling up inside the mast to a gallery at 23 m, and the view across the river
    const top = spiralStair(P, tx, tz, HEAD + 0.4, HEAD + 17, 2.2, 1.8, 'gratingSteel', { per: 6 });
    // (the gallery's floor leaves the west side open as the stairwell: the stair's last flights climb under it)
    P.box([tx - 1.8, HEAD + 16.7, tz - 4.2, tx + 4.2, HEAD + 17, tz + 4.2], 'gratingSteel');
    P.land('towerTop', tx, HEAD + 17, tz + 2.6, Math.PI);
    for (const [x0, z0, x1, z1] of [[-4.2, -4.2, 4.2, -4.2], [4.2, -4.2, 4.2, 4.2], [4.2, 4.2, -4.2, 4.2], [-4.2, 4.2, -4.2, -4.2]]) railing(P, tx + x0, tz + z0, tx + x1, tz + z1, 1.1, 'ironDark', { y: HEAD + 17 });
    void top;
    P.E('PRESENT', () => {
      lattice(P, tx, tz, HEAD + 0.4, 45, 4.4, 1.0, 'mastRed', { beacon: 'redBeacon', solid: false });
      for (let i = 0; i < 4; i++) P.cyl(tx, HEAD + 26 + i * 5, tz, 0.8, 0.5, 'mastWhite', { seg: 8 });
      // the Continuum's fence round the base (solid: Kai walked through its panels; the way in is its gap on the north side)
      for (const [x0, z0, x1, z1] of [[-9, -9, 9, -9], [9, -9, 9, 9], [-9, 9, -4, 9], [4, 9, 9, 9], [-9, -9, -9, 9]]) P.box([tx + Math.min(x0, x1) - 0.04, HEAD, tz + Math.min(z0, z1) - 0.04, tx + Math.max(x0, x1) + 0.04, HEAD + 2.6, tz + Math.max(z0, z1) + 0.04], 'siteFence', { noShadow: 1 });
    });
    P.E('PAST', () => {
      // the old lighthouse, scaffolded for the conversion that will make it a transmitter
      P.cyl(tx, HEAD + 0.4, tz, 3.6, 20, 'limestoneBlock', { r2: 2.8, seg: 16 });
      P.cyl(tx, HEAD + 20.4, tz, 3.0, 3.4, 'glass', { seg: 12 });
      P.cone(tx, HEAD + 23.8, tz, 3.2, 2.8, 'copperRoof', { seg: 12 });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        P.box([tx + Math.cos(a) * 5 - 0.08, HEAD, tz + Math.sin(a) * 5 - 0.08, tx + Math.cos(a) * 5 + 0.08, HEAD + 18, tz + Math.sin(a) * 5 + 0.08], 'scaffold', { solid: false });
      }
      for (const y of [4, 8, 12, 16]) P.torus(tx, HEAD + y, tz, 5, 0.06, 'scaffold', { rx: Math.PI / 2, seg: 24 });
    });
    prop(P, 'siteHut', tx + 12, tz - 8, Math.PI / 2, { y: HEAD });
    for (const [x, z] of [[-96, 30], [-62, 72], [-90, 70]]) P.tree('pine', x, z, P.rng.float(1.0, 1.4), { y: HEAD });
    // trees along the terraces and the quay
    for (const [x, z, y] of [[-50, 16, 6], [44, 16, 6], [-50, -20, 12], [50, -46, 18], [-80, -48, 18], [-70, 82, 0], [70, 82, 0], [-56, 32, 0]]) P.tree('plane', x, z, P.rng.float(0.9, 1.2), { y });
    for (let i = 0; i < 10; i++) P.tree('shrub', P.rng.float(-90, 60), P.rng.float(-96, -82), 1, { y: 24, solid: false });
    // the drone challenge (the patrols walk the lower town)
    P.challenge('drones', [-60, 20, 90, 92], ['PRESENT', 'PAST'], null);
  },
};
