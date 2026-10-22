// AFTERZERO (Mission 23, the Finale; OVERHAUL.md §5 M23). One 100 x 360 m road held open through the storm by two
// men with the same scar. It runs north from M1's South Square (its exact layout, quoted), through the settlement
// terraces, the Helix lab and the 2196 lagoon, to the Ring Hill and the original Chronolith. Where the years meet
// there are seams: the asphalt turns to grass mid-street, and the 41 stands in a field. A "rain rises" zone marks
// where the inversions collide (the sky drifts backwards over it). The light progresses with the route (a Sky
// feature): night rain over the square, dusk over the settlement, pre-dawn over Helix, and at the ring the game's
// first true sunrise, in the Notch. The three endings each have their sky: A an ordinary clear morning with no
// ring, B the sky shattered into panes of different skies, C one warm light with no ring.
//   Q0 THE OPENING STREETS        z 110 .. 180
//   Q1 THE SETTLEMENT, AGAIN      z  40 .. 110
//   Q2 THE HELIX LAB              z -20 .. 40
//   Q3 2196                       z -100 .. -20
//   Q4 THE ORIGINAL CHRONOLITH    z -180 .. -100
import { ground, terrace, stair, ramp, water, railing, block, prop, sign, roundhouse, ringStones, bridge } from '../archetypes.js';

const HILL = 4; // the Ring Hill's summit

export default {
  key: 'afterzero', style: 'composite', sameAs: ['rain_south', 'valley_upper', 'helix', 'drowned'], name: 'AFTERZERO',
  bounds: [-50, -180, 50, 180],
  linear: true, // (one road: §4.7's 100 x 360 m, exempt from the short-side rule)
  edges: { N: 'hill', E: 'slope', W: 'slope', S: 'blocks' },
  killY: -4,
  primary: 'originalRing',
  backdrop: { notch: 'clear' },
  years: {
    PRESENT: { sky: 'routePreDawn', era: '2049', hour: 5.6, sun: { elev: 1, az: 'notch' }, fog: 0x2a3048, density: 1.0, night: 0.6, weather: 'rain', ibl: 'night', lit: 0.7,
      hemi: { sky: 0x6a7aa8, ground: 0x181a24, k: 0.8 }, sunColor: 0xffc890, sunK: 0.6, grade: { shadowTint: 0x101a3a, highlightTint: 0xffe0c0, toning: 0.24, contrast: 1.14, saturation: 1.0 } },
    PAST: { sky: 'routeDusk', era: '2026', hour: 19.4, sun: { elev: 9.2, az: 'notch' }, fog: 0x4a3a48, density: 1.0, night: 0.4, weather: 'rain', ibl: 'dusk', lit: 0.6,
      hemi: { sky: 0xb8907a, ground: 0x2a2224, k: 0.85 }, sunColor: 0xffb070, sunK: 0.8, grade: { shadowTint: 0x2a1430, highlightTint: 0xffd8b0, toning: 0.24, contrast: 1.12, saturation: 1.04 } },
    FUTURE: { sky: 'firstSunrise', era: '2196', hour: 6.3, sun: { elev: 9.2, az: 'notch' }, fog: 0x5a5068, density: 0.9, night: 0.3, weather: 'motes', ibl: 'dusk', lit: 0.3,
      hemi: { sky: 0xd8a888, ground: 0x2a2830, k: 0.9 }, sunColor: 0xffc080, sunK: 1.0, grade: { shadowTint: 0x2a1a3a, highlightTint: 0xffe0b8, toning: 0.24, contrast: 1.1, saturation: 1.06 } },
  },
  skyFeatures: { all: [
    // the light along the road, by where you stand (Kai walks north, toward the ring)
    { kind: 'route', stops: [[170, 'routeNightRain'], [112, 'routeNightRain'], [96, 'routeDusk'], [44, 'routeDusk'], [30, 'routePreDawn'], [-96, 'routePreDawn'], [-128, 'firstSunrise']] },
    { kind: 'ringHole', at: [0, -300], elev: 58, r: 11, when: '!ending' },
    { kind: 'reverse', box: [-50, -44, 50, -22] },
    // the endings' skies, once the choice is made
    { kind: 'preset', sky: 'endingClear', when: 'ending == "A"' },
    { kind: 'preset', sky: 'endingPanes', when: 'ending == "B"' },
    { kind: 'wedges', n: 7, cols: [0x5a9ae0, 0xffa060, 0x14306e, 0xe8c8d8, 0x1a1428, 0x9aa862, 0xc8e0ff], turn: 0.3, mix: 0.75, when: 'ending == "B"' },
    { kind: 'preset', sky: 'endingWarm', when: 'ending == "C"' },
  ] },
  quarters: [
    { name: 'THE OPENING STREETS', area: [-50, 110, 50, 180], spawnAt: 'platform41', threshold: { at: 'seam41', kind: 'seam' } },
    { name: 'THE SETTLEMENT, AGAIN', area: [-50, 40, 50, 110], spawnAt: 'seam41', threshold: { at: 'labDoor', kind: 'door' } },
    { name: 'THE HELIX LAB', area: [-50, -20, 50, 40], spawnAt: 'labDoor', threshold: { at: 'labGate', kind: 'gate' } },
    { name: '2196', area: [-50, -100, 50, -20], spawnAt: 'labGate', threshold: { at: 'hillFoot', kind: 'hill' } },
    { name: 'THE ORIGINAL CHRONOLITH', area: [-50, -180, 50, -100], spawnAt: 'hillFoot', threshold: null },
  ],
  sectors: { m23: [0, 1, 3] },
  beatAt: { m23: ['streetCollapse', 'tellingStone', 'endingChoice'] },
  exits: { m23: 'originalRing' },
  frags: { m23: [['junPassengers', 'busField', 'tala'], ['ivenStatement', 'memorial2196', 'seraGarden']] },
  watch: { m23: [[[[-6, 146], [6, 124]]], [[[-22, 86], [22, 86]]], [[[-3, -36], [-3, -96]], [[3, -96], [3, -36]]]] },
  crowd: [
    { era: 'present', years: ['PRESENT', 'PAST'], region: 'south', role: 'commuter', path: [[-10, 170], [-10, 138]], n: 4 },
    { era: 'ancient', years: ['PAST', 'PRESENT'], region: 'settlement', role: 'villager', path: [[-13, 89], [13, 89]], n: 3 },
    { era: 'future', years: ['FUTURE'], region: 'lagoon', role: 'gardener', path: [[10, -64], [20, -72]], n: 3 },
  ],

  build(P) {
    P.setTerrain(-50, -180, 50, 180, 0);
    // (the ground, except where the avenue has collapsed: x -14 .. 14, z 120 .. 136)
    for (const b of [[-50, 64, 50, 120], [-50, 136, 50, 180], [-50, 120, -14, 136], [14, 120, 50, 136]]) P.box([b[0], -0.6, b[1], b[2], 0, b[3]], 'meadow', { noShadow: 1, vis: false });
    // --- Q0: M1's South Square, quoted: the avenue, its blocks and shopfronts, the 41's shelter ---------------------
    for (const b of [[-50, 112, 50, 120], [-50, 136, 50, 180], [-50, 120, -14, 136], [14, 120, 50, 136]]) P.vbox([b[0], 0, b[1], b[2], 0.04, b[3]], 'pavement', { noShadow: 1 });
    for (const [z0, z1] of [[112, 120], [136, 180]]) P.vbox([-9, 0.04, z0, 9, 0.07, z1], 'asphalt', { noShadow: 1 });
    for (let z = 116; z < 180; z += 9) if (z + 4 < 120 || z > 136) P.vbox([-0.1, 0.07, z, 0.1, 0.09, z + 4], 'marking', { noShadow: 1 });
    block(P, { rect: [14, 154, 46, 180], floors: 7, tint: 0x9a5a48, cornice: true, shop: { side: 'W', color: 0xffd9a8 } });
    block(P, { rect: [14, 118, 46, 148], floors: 9, tint: 0xc89a7a, cornice: true, shop: { side: 'W', color: 0xcfe4ff, awning: 'awningBlue' } });
    block(P, { rect: [-40, 156, -14, 180], floors: 6, tint: 0xb06a52, shop: { side: ['E'] }, cornice: true });
    block(P, { rect: [-40, 120, -14, 136], floors: 4, tint: 0xd8c8b0, shop: { side: ['E'] } });
    for (let z = 118; z < 178; z += 14) if (z < 118 || z > 136) for (const x of [-8.6, 8.6]) prop(P, 'tramPole', x, z);
    prop(P, 'busShelter', -11, 160, Math.PI / 2);
    sign(P, '41', -12.2, 2.9, 163.4, Math.PI / 2, { size: 0.5, color: '#ffffff', boardMat: 'busStopGreen' });
    P.land('platform41', -5, 0, 166, Math.PI);
    P.land('junPassengers', -11.6, 0, 150, Math.PI / 2);
    P.land('streetCollapse', 0, 0, 128, Math.PI);
    P.E(['PAST', 'PRESENT'], () => {
      for (let i = 0; i < 8; i++) P.disc(P.rng.float(-8, 8), 0.09, P.rng.float(116, 176), P.rng.float(0.6, 1.8), 'puddleWater', { seg: 12 });
      for (const [x, z] of [[-6, 140], [5, 172]]) prop(P, 'car', x, z, x < 0 ? 0 : Math.PI);
    });
    P.E('PRESENT', () => { for (const z of [114, 150]) prop(P, 'adScreen', 12, z, -Math.PI / 2); for (const x of [-4, 4]) prop(P, 'barrier', x, 138, 0); });
    P.E('FUTURE', () => {
      for (let i = 0; i < 26; i++) { const z = P.rng.float(114, 178); if (z < 119 || z > 137) P.tree(P.rng.pick(['grass', 'shrub', 'fern']), P.rng.float(-12, 12), z, P.rng.float(0.8, 1.4), { solid: false }); }
      for (let i = 0; i < 6; i++) P.obox(P.rng.float(-8, 8), -0.2, P.rng.float(140, 176), P.rng.float(2, 4), 0.4, P.rng.float(2, 4), P.rng.float(0, 3), 'asphalt', { rx: P.rng.float(-0.1, 0.1) });
    });
    // the street that collapsed (Mission 23): a pit across the avenue, 6 m deep, a stair back up on its south side.
    // In 2026 its south half is still the old street; its north half the Witness holds up (REVERSE, his, scripted)
    P.box([-14, -6.6, 120, 14, -6, 136], 'concreteStained');
    for (const [x0, z0, x1, z1] of [[-14.3, 119.7, 14.3, 120], [-14.3, 136, 14.3, 136.3], [-14.3, 120, -14, 136], [14, 120, 14.3, 136]]) P.box([x0, -6, z0, x1, 0, z1], 'concreteStained');
    stair(P, 12, 121, -6, 12, 135.6, 0, 1.8, 'concreteStained');
    for (let i = 0; i < 10; i++) P.obox(P.rng.float(-12, 9), -6, P.rng.float(121, 135), P.rng.float(1.5, 3.5), P.rng.float(0.3, 1.2), P.rng.float(1.5, 3), P.rng.float(0, 3), 'asphalt', { rx: P.rng.float(-0.3, 0.3), solid: false });
    P.E('PAST', () => P.box([-14, -0.6, 128, 14, 0, 136], 'asphalt'));
    // --- the seam: the asphalt ends mid-street; the 41 stands in the field beyond -------------------------------------
    P.land('seam41', 0, 0, 108, Math.PI);
    P.land('busField', 9.4, 0, 102, -Math.PI / 2);
    for (let i = 0; i < 9; i++) P.obox(-8 + i * 2, -0.05, 112 + P.rng.float(-0.8, 0.8), 2.1, 0.12, 1.6, P.rng.float(-0.2, 0.2), 'asphalt');
    P.box([4.6, 0.3, 94, 8.0, 3.3, 106], 'busBody');
    P.vbox([4.5, 1.6, 95, 4.6, 2.6, 105], 'windowWarm', { noShadow: 1 });
    for (const z of [96, 104]) for (const x of [4.6, 8]) P.cyl(x, 0, z, 0.45, 0.3, 'tyre', { seg: 10, rz: Math.PI / 2 });
    sign(P, '41  SOUTH SQUARE', 6.3, 3.0, 105.95, 0, { size: 0.3, color: '#ffd36a', board: 0 });
    // --- Q1: the settlement, again: terraces, roundhouses, the telling-stone, the stream and its bridge -----------------
    P.plane(-50, 40, 50, 112, 0.02, 'meadowLong', { noShadow: 1 });
    P.vbox([-3, 0, 40, 3, 0.05, 112], 'dirt', { noShadow: 1 });
    terrace(P, [-46, 70, -16, 104], 1.2, 'ridgeGrass', { wall: 'drystone', sides: 'E' });
    terrace(P, [16, 70, 46, 104], 1.2, 'ridgeGrass', { wall: 'drystone', sides: 'W' });
    for (const [x, z] of [[-34, 80], [-24, 94], [30, 78], [26, 96]]) roundhouse(P, { x, z, r: 3.4, ry: x < 0 ? Math.PI / 2 : -Math.PI / 2, y: 1.2 });
    for (const [x0, x1] of [[-16, -16], [16, 16]]) stair(P, x0 + (x0 < 0 ? 1.4 : -1.4), 86, 0, x1 + (x0 < 0 ? -1.2 : 1.2), 86, 1.2, 2.4, 'drystone');
    P.land('tellingStone', -7, 0, 92, Math.PI / 2);
    P.land('tala', -10, 0, 74, Math.PI / 2);
    P.obox(-8.4, 0, 92, 1.2, 2.6, 0.9, Math.PI / 2, 'headStone', { solid: true });
    P.text('HE CAME BACK', [-7.78, 1.7, 92], Math.PI / 2, { size: 0.22, color: '#e8e0d0' });
    P.E('PAST', () => { for (const [x, z] of [[-28, 88], [30, 88]]) prop(P, 'firePit', x, z, 0, { y: 1.2 }); });
    P.E('FUTURE', () => { for (let i = 0; i < 18; i++) P.tree(P.rng.pick(['flowers', 'grass', 'shrub']), P.rng.float(-44, 44), P.rng.float(66, 108), P.rng.float(0.8, 1.3), { solid: false }); });
    // the stream across the road, deep; the timber bridge Kai holds
    P.col([-50, -0.6, 40, 50, 0, 56]);
    water(P, [-50, 56, 50, 64], -1.2, 'riverWater', { depth: 2.2 });
    P.drown([-50, 56, 50, 64], -1.6);
    for (const z of [56, 64]) P.vbox([-50, -3.6, z - 0.3, 50, 0.02, z + 0.3], 'riverStone');
    // (its timber bridge has fallen into the stream: Mission 23's REVERSE holds it up; the abutments stand)
    for (const z of [53.4, 64.2]) P.box([-2.6, -0.6, z, 2.6, 0.3, z + 2.4], 'drystone');
    P.land('settlementBridge', 0, 0.3, 60, Math.PI);
    // --- the corridor of still air the Witness holds: the storm's walls of rain either side of the road ----------------
    for (const x of [-15, 15]) P.vbox([x - 0.2, 0, -100, x + 0.2, 14, 40], 'smoke', { noShadow: 1 });
    // --- Q2: the Helix lab: white panels, glass, a black rubber floor, open to the sky between the ceiling panels ---------
    P.vbox([-11, 0.02, -18, 11, 0.06, 38], 'rubber', { noShadow: 1 });
    P.box([-50, -0.6, -20, 50, 0, 40], 'meadow', { noShadow: 1, vis: false });
    P.plane(-50, -20, 50, 40, 0.01, 'summitGrass', { noShadow: 1 });
    P.land('labDoor', 0, 0, 37, Math.PI);
    P.land('rookTransmission', -8.6, 0, 12, Math.PI / 2);
    P.land('ivenStatement', 8.4, 0, 24, -Math.PI / 2);
    P.land('labGate', 0, 0, -22, Math.PI);
    P.E(['PRESENT', 'FUTURE'], () => {
      for (const x of [-11, 11]) {
        for (let z = -16; z < 36; z += 8) P.box([x - 0.2, 0, z, x + 0.2, 4.6, z + 6.6], x < 0 ? 'helixPanel' : 'helixGlass', { t: 0xffffff });
      }
      for (let z = -16; z < 36; z += 10) P.vbox([-11.2, 4.6, z, 11.2, 4.8, z + 5], 'helixWhite');
      for (let z = -12; z < 36; z += 10) P.vbox([-10, 4.5, z, 10, 4.6, z + 0.3], 'lightPanel', { noShadow: 1 });
      P.vbox([-10.75, 1.2, 9.5, -10.7, 3.6, 14.5], 'adLit', { noShadow: 1 });
      P.box([7.6, 0, 23.4, 8.4, 1.1, 24.6], 'helixWhite');
    });
    P.E('PAST', () => {
      for (const x of [-11, 11]) for (let z = -16; z < 36; z += 8) P.box([x - 0.3, 0, z, x + 0.3, 2.2, z + 6.6], 'rawConcrete');
      for (let i = 0; i < 12; i++) P.cyl(-11 + (i % 2) * 22, 0, -14 + i * 4.4, 0.05, 6, 'scaffold', { seg: 5 });
      P.box([7.6, 0, 23.4, 8.4, 1.1, 24.6], 'siteCabin');
    });
    P.E('FUTURE', () => { for (let i = 0; i < 12; i++) { const x = P.rng.pick([-10.8, 10.4]), z = P.rng.float(-14, 34); P.vbox([x, 0, z, x + 0.4, P.rng.float(1.5, 4.4), z + 1.4], 'ivy', { noShadow: 1 }); } });
    // --- Q3: 2196: the lagoon (in 2196), the causeway the road becomes, the memorial and Sera's garden on islands -------------
    P.col([-5, -0.6, -100, 5, 0, -20]);
    P.vbox([-5, 0, -100, 5, 0.04, -20], 'viaductDeck', { noShadow: 1 });
    ground(P, [-26, -72, -8, -48], 0, 'statueStone');
    ground(P, [8, -82, 28, -58], 0, 'gardenLawn');
    P.E(['PAST', 'PRESENT'], () => {
      P.col([-50, -0.6, -100, 50, 0, -20]);
      P.plane(-50, -100, 50, -20, 0.02, 'pavement', { noShadow: 1 });
      for (const [x0, z0, x1, z1, h] of [[-46, -96, -32, -80, 34], [-46, -44, -32, -26, 28], [32, -96, 46, -86, 38], [32, -50, 46, -28, 24]]) P.box([x0, 0, z0, x1, h, z1], 'towerGlass', { t: 0xd0d8e0 });
    });
    P.E('FUTURE', () => {
      water(P, [-50, -100, 50, -20], -0.5, 'lagoonWater', { depth: 2.4 });
      P.drown([-50, -100, 50, -20], -0.9);
      for (const [x0, z0, x1, z1, h] of [[-46, -96, -32, -80, 22], [-46, -44, -32, -26, 16], [32, -96, 46, -86, 26], [32, -50, 46, -28, 14]]) {
        P.box([x0, -1, z0, x1, h, z1], 'concreteStained');
        for (let k = 0; k < 4; k++) P.tree('birch', x0 + 2 + k * 3.4, (z0 + z1) / 2, 1.2, { y: h, solid: false });
      }
      for (let i = 0; i < 12; i++) P.tree('reeds', P.rng.pick([-8, 8]) + P.rng.float(-2, 2), P.rng.float(-98, -22), 1, { solid: false, y: -0.5 });
    });
    P.land('memorial2196', -14, 0, -60, Math.PI / 2);
    P.land('seraGarden', 16, 0, -70, -Math.PI / 2);
    P.land('anja', 0, 0, -88, Math.PI);
    P.box([-18.4, 0, -61.2, -16, 2.2, -58.8], 'statueStone');
    P.text('KAI VAREN', [-15.94, 1.6, -60], Math.PI / 2, { size: 0.3, color: '#f0e8d8' });
    for (let i = 0; i < 5; i++) P.tree('flowers', -15.2, -61.6 + i * 0.8, 0.6, { solid: false });
    for (let i = 0; i < 6; i++) P.plane(10 + i * 3, -80, 12 + i * 3, -62, 0.04, 'soil', { noShadow: 1 });
    for (let i = 0; i < 16; i++) P.tree(P.rng.pick(['flowers', 'shrub']), P.rng.float(10, 27), P.rng.float(-80, -60), P.rng.float(0.7, 1.1), { solid: false });
    // the causeway's paths to the islands
    P.col([-8, -0.6, -61, -5, 0, -59]);
    P.vbox([-8, 0, -61, -5, 0.04, -59], 'viaductDeck', { noShadow: 1 });
    P.col([5, -0.6, -71, 8, 0, -69]);
    P.vbox([5, 0, -71, 8, 0.04, -69], 'viaductDeck', { noShadow: 1 });
    // --- Q4: the Ring Hill and the original Chronolith ------------------------------------------------------------------
    P.land('hillFoot', 0, 0, -102, Math.PI);
    P.box([-50, -0.6, -124, 50, 0, -100], 'summitGrass', { noShadow: 1 });
    ramp(P, [-6, -124, 6, -104], 0, HILL, 'N', 'summitGrass');
    for (const x of [-6, 6]) P.vbox([x - 0.3, 0, -124, x + 0.3, 1, -104], 'drystone');
    terrace(P, [-50, -180, 50, -124], HILL, 'summitGrass', { sides: '' });
    for (const [a, b] of [[-50, -6], [6, 50]]) P.vbox([a, -0.6, -124.5, b, HILL, -124], 'drystone');
    ringStones(P, 0, HILL, -150, 16, 14, 4.2, { band: 'bronzeAged', lintels: true });
    P.torus(0, HILL + 5.6, -152, 5, 0.55, 'blackRing', { seg: 48 });
    for (const s of [-1, 1]) P.box([s * 5.2 - 0.5, HILL, -152.6, s * 5.2 + 0.5, HILL + 1.4, -151.4], 'blackRing');
    P.land('originalRing', 0, HILL, -152, 0);
    P.land('miraStands', 2.2, HILL, -146, Math.PI);
    P.land('endingChoice', 0, HILL, -142, Math.PI);
    P.E('PAST', () => { for (const x of [-30, 30]) P.box([x - 0.3, HILL, -170, x + 0.3, HILL + 12, -169.4], 'scaffold'); P.vbox([-30, HILL + 12, -170, 30, HILL + 12.4, -169.4], 'scaffold'); });
    P.E('PRESENT', () => { for (let i = 0; i < 7; i++) { const a = Math.PI * (0.15 + i * 0.12); P.obox(Math.cos(a) * 34, HILL, -150 - Math.sin(a) * 22, 6, 8, 1, a, 'helixWhite'); } });
    P.E('FUTURE', () => { for (let i = 0; i < 20; i++) P.tree(P.rng.pick(['grass', 'flowers', 'birch']), P.rng.float(-44, 44), P.rng.float(-176, -126), P.rng.float(0.8, 1.3), { solid: false }); });
  },
};
