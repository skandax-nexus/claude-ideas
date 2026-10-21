// The Fracture (Mission 18; OVERHAUL.md §5 M18). A 120 x 420 m traverse from the hills to the coast under a
// planet-scale temporal storm, the game's only storm-of-times sky: a wall cloud with a ring-shaped eye over the
// coast, bands of other times (starry night beside day) sweeping round, lightning coloured by the year. The
// storm stays; the land changes. The anchor settlement on a ruined motorway interchange (2196: ramps for
// streets, containers for houses, wind turbines), the canyon (a torn chasm in 2196 and 2049; in 2026 a
// narrow river canyon with a stone arch to cross), the flooded highway (in 2049 the water covers the
// carriageway and the lamp-post heads are the stepping route; dry and buckled in 2196), and the collapsing
// skyscraper on the coast, its tilted floors in 2196 the climb up to the lattice transmission tower.
//   Q0 THE ANCHOR SETTLEMENT     z -210 .. -110
//   Q1 THE CANYON                z -110 .. -10
//   Q2 THE FLOODED HIGHWAY       z -10 .. 90
//   Q3 THE COLLAPSING SKYSCRAPER z 90 .. 210
import { ground, groundHoles, terrace, stair, ramp, water, railing, prop, sign, arch, container, lattice } from '../archetypes.js';

const CANYON = [-68, -52]; // the chasm (z)
const ROAD = [-10, 10]; // the motorway's carriageway (x)
const TOP = 26; // the transmission tower's deck

export default {
  key: 'fracture', style: 'fracture', sameAs: null, name: 'THE FRACTURE',
  bounds: [-60, -210, 60, 210],
  linear: true, // (a traverse: §4.7's 100-120 x 360-420 m, exempt from the short-side rule)
  edges: { N: 'hill', E: 'cliff', W: 'cliff', S: 'sea' },
  killY: -8,
  primary: 'transmissionScreen',
  backdrop: { notch: 'clear', sea: 180 },
  years: {
    FUTURE: { sky: 'storm2196', era: '2196', hour: 16.6, sun: { elev: 12, az: 240 }, fog: 0x5a4650, density: 1.3, night: 0.35, weather: 'storm', ibl: 'dusk', lit: 0,
      hemi: { sky: 0x9a7a7e, ground: 0x2a2428, k: 0.8 }, sunColor: 0xffc0a0, sunK: 0.8, grade: { shadowTint: 0x2a1030, highlightTint: 0xffd0c0, toning: 0.24, contrast: 1.16, saturation: 1.04 } },
    PAST: { sky: 'storm2026', era: '2026', hour: 15.2, sun: { elev: 18, az: 230 }, fog: 0x5a5a48, density: 1.2, night: 0.3, weather: 'storm', ibl: 'dusk', lit: 0,
      hemi: { sky: 0xb8a878, ground: 0x2a3028, k: 0.8 }, sunColor: 0xfff0b0, sunK: 0.85, grade: { shadowTint: 0x1e2a14, highlightTint: 0xfff0c0, toning: 0.22, contrast: 1.14, saturation: 1.0 } },
    PRESENT: { sky: 'storm2049', era: '2049', hour: 21.4, sun: { elev: -2, az: 300 }, fog: 0x2a3444, density: 1.4, night: 0.6, weather: 'storm', ibl: 'night', lit: 0.6,
      hemi: { sky: 0x5a6a8a, ground: 0x161a22, k: 0.7 }, sunColor: 0xb8c8ff, sunK: 0.4, grade: { shadowTint: 0x101830, highlightTint: 0xc8d8ff, toning: 0.24, contrast: 1.16, saturation: 0.94 } },
  },
  skyFeatures: { all: [{ kind: 'storm', az: 175, bands: 1, eye: 1, band: 0x0a0e24 }] },
  quarters: [
    { name: 'THE ANCHOR SETTLEMENT', area: [-60, -210, 60, -110], spawnAt: 'chronolithBench', threshold: { at: 'settlementGate', kind: 'ramp' } },
    { name: 'THE CANYON', area: [-60, -110, 60, -10], spawnAt: 'settlementGate', threshold: { at: 'highwaySign', kind: 'road' } },
    { name: 'THE FLOODED HIGHWAY', area: [-60, -10, 60, 90], spawnAt: 'highwaySign', threshold: { at: 'towerFoot', kind: 'tower' } },
    { name: 'THE COLLAPSING SKYSCRAPER', area: [-60, 90, 60, 210], spawnAt: 'towerFoot', threshold: null },
  ],
  // three sectors over four quarters: the evacuation and the canyon are one sector (sector -> its first quarter)
  sectors: { m18: [0, 2, 3] },
  beatAt: { m18: [null, 'lampPosts', 'towerDeck'] },
  exits: { m18: 'transmissionScreen' },
  frags: { m18: [['anchorMast', 'canyonArch', 'highwaySign'], ['verge', 'tollBooth', 'surge']] },
  watch: { m18: [[], [[[-40, -30], [40, -30]], [[-30, -96], [30, -96]]], [[[-36, 110], [36, 110]], [[-40, 150], [-40, 120]], [[30, 160], [30, 130]]]] },
  crowd: [
    { era: 'future', years: ['FUTURE'], region: 'fracture', role: 'evacuee', path: [[-20, -150], [20, -150], [20, -130]], n: 6 },
    { era: 'present', years: ['PRESENT'], region: 'fracture', role: 'driver', path: [[-6, 20], [-6, 80]], n: 2 },
  ],

  build(P) {
    // --- the ground, the chasm cut across it, the coast ---------------------------------------------------------
    groundHoles(P, [-60, -210, 60, 196], [[-60, CANYON[0], 60, CANYON[1]]], 0, 'slabConcrete');
    water(P, [-60, 196, 60, 210], -2, 'highwayWater', { depth: 3 });
    P.drown([-60, 197, 60, 210], -1.2);
    // the chasm: in 2049 and 2196 a torn gap to a rubble floor far below; in 2026 the narrow river canyon and its stone arch
    ground(P, [-60, CANYON[0], 60, CANYON[1]], -14, 'canyonRock', { depth: 1 });
    for (const [z0, z1] of [[CANYON[0], CANYON[0] + 0.6], [CANYON[1] - 0.6, CANYON[1]]]) P.vbox([-60, -14, z0, 60, 0, z1], 'canyonRock');
    P.E('PAST', () => {
      // the canyon is narrower in 2026: ledges from both sides, the river between, the stone arch over it
      for (const [z0, z1] of [[CANYON[0], -64], [-56, CANYON[1]]]) ground(P, [-60, z0, 60, z1], 0, 'canyonRock', { depth: 14 });
      water(P, [-60, -64, 60, -56], -10, 'riverWater', { depth: 2 });
      // the stone arch: a round arch springing from the canyon walls, the spandrels filled, a deck with parapets
      arch(P, 0, -60, 8, 6, 5, Math.PI / 2, 'riverStone', { y: -9.6, round: true });
      P.vbox([-2.5, -2.6, -64.6, 2.5, -0.6, -55.4], 'riverStone');
      P.box([-2.5, -0.6, -65, 2.5, 0, -55], 'riverStone');
      for (const s of [-1, 1]) railing(P, s * 2.35, -65, s * 2.35, -55, 0.9, 'riverStone', { t: 0.3 });
      for (let i = 0; i < 8; i++) P.obox(P.rng.float(-50, 50), -10.4, P.rng.float(-63, -57), P.rng.float(1, 2.4), P.rng.float(0.6, 1.4), P.rng.float(1, 2), P.rng.float(0, 3), 'riverStone', { prop: 1 });
    });
    P.land('canyonArch', 0, 0, -60, Math.PI);
    P.land('waterShortcut', 34, 0, -60, Math.PI);
    P.E('FUTURE', () => P.box([30, -0.6, CANYON[0], 38, 0, CANYON[1]], 'pontoonWood', { w: 'water_route' })); // (the river taught to stay: a causeway it left)
    P.challenge('canyon', [-60, -110, 60, -10], ['PAST'], ['The ground is torn in two here.', 'In 2026 this was a river canyon, narrower, and somebody built an arch over it.', 'Switch to 2026 and cross on the stone arch.']);
    // --- Q0: the anchor settlement on the interchange: ramps for streets, containers for houses ----------------------
    P.land('chronolithBench', 0, 0, -196, 0);
    P.land('anchorMast', -30, 0, -170, 0);
    P.land('houseA', -34.2, 0, -146, Math.PI / 2);
    P.land('houseB', 30.4, 6, -170, -Math.PI / 2);
    P.land('houseC', 37.8, 0, -128, -Math.PI / 2);
    P.land('garden', -24, 0, -122, 0);
    P.land('turbineFoot', 46, 0, -196, 0);
    P.land('settlementGate', 0, 0, -112, 0);
    // the interchange: a ring ramp up to a flyover deck at 6 m (the motorway's old slip road)
    terrace(P, [16, -190, 56, -150], 6, 'motorway', { wall: 'slabConcrete', sides: 'NSW' });
    ramp(P, [16, -150, 28, -122], 0, 6, 'N', 'motorway');
    for (const x of [16, 28]) railing(P, x, -150, x, -122, 1.0, 'slabConcrete', { solid: false });
    P.E('FUTURE', () => {
      container(P, -36, -146, 0, 'containerHouse', { n: 2, len: 10 });
      container(P, 36.5, -170, Math.PI / 2, 'containerRed', { n: 1, len: 10, y: 6 });
      container(P, 40, -128, 0, 'containerGreen', { n: 2, len: 10 });
      // the scrap village's street of containers along the old carriageway, more up on the flyover
      [[-22, -200, 'containerOrange', 2], [-22, -186, 'containerHouse', 1], [-22, -172, 'containerGreen', 2], [-22, -158, 'containerRed', 1]].forEach(([x, z, m, n]) => container(P, x, z, 0, m, { n, len: 10 }));
      [[46, -160, 'containerHouse'], [50, -182, 'containerOrange'], [24, -184, 'containerGreen']].forEach(([x, z, m]) => container(P, x, z, Math.PI / 2, m, { len: 10, y: 6 }));
      for (const [x, z] of [[-14, -192], [-14, -164], [12, -200], [30, -134]]) prop(P, 'tarp', x, z, P.rng.float(0, 3));
      for (const [x, z] of [[-8, -178], [6, -130]]) prop(P, 'firePit', x, z, 0);
      container(P, -40, -184, Math.PI / 2, 'containerOrange', { n: 2, len: 10 });
      for (const [x, z] of [[-20, -200], [-46, -120], [50, -132]]) container(P, x, z, 0.3, 'containerHouse', { len: 8 });
      P.cyl(-30, 0, -170, 0.25, 18, 'latticeSteel', { seg: 6, solid: true });
      P.sphere(-30, 18.6, -170, 0.6, 'redBeacon');
      for (const [x, z] of [[46, -196], [-50, -204]]) { P.cyl(x, 0, z, 0.6, 24, 'turbineWhite', { seg: 10, solid: true }); for (let k = 0; k < 3; k++) P.obox(x, 24, z + 0.8, 0.8, 9, 0.3, 0, 'turbineWhite', { rz: (k * 2 * Math.PI) / 3 }); }
      P.plane(-34, -128, -14, -116, 0.03, 'gardenLawn', { noShadow: 1 });
      for (let i = 0; i < 8; i++) P.tree('scrub', -32 + i * 2.4, -122, 1, { solid: false });
      P.box([-3, 0, -200, 3, 1.2, -198], 'machinePanel');
    });
    P.E(['PRESENT', 'PAST'], () => {
      // the interchange intact: a service station, a sign gantry, crash barriers, lamp posts
      for (const [x, z] of [[-45, -159], [-27, -159], [-45, -141], [-27, -141]]) P.box([x - 0.3, 0, z - 0.3, x + 0.3, 5, z + 0.3], 'steel');
      P.box([-47, 5, -161, -25, 5.7, -139], 'steel', { solid: false });
      P.vbox([-47, 5.7, -161, -25, 5.9, -139], 'adLit', { noShadow: 1 });
      P.box([-46, 0, -136, -28, 4.2, -126], 'slabConcrete');
      P.vbox([-46, 0.6, -136.1, -28, 3.2, -135.9], 'shopLit', { noShadow: 1 });
      for (const [x, z] of [[-40, -150], [-32, -150]]) P.box([x - 0.6, 0, z - 1, x + 0.6, 1.8, z + 1], 'machinePanel');
      P.box([-14, 0, -140, -12, 7, -138], 'latticeSteel');
      P.box([12, 0, -140, 14, 7, -138], 'latticeSteel');
      P.box([-14, 7, -140, 14, 8.6, -138], 'signGreen', { solid: false });
      for (let z = -200; z < -116; z += 14) prop(P, 'lampPost', -16, z, 0);
    });
    // the motorway down the middle of the whole traverse
    P.vbox([ROAD[0], 0.01, -196, ROAD[1], 0.03, 196], 'motorway', { noShadow: 1 });
    for (let z = -190; z < 190; z += 9) if (z < CANYON[0] - 2 || z > CANYON[1] + 2) P.vbox([-0.12, 0.03, z, 0.12, 0.05, z + 4.5], 'helipadPaint', { noShadow: 1 });
    // --- Q2: the flooded highway: water over the carriageway in 2049, the lamp heads the stepping route ------------------
    P.land('highwaySign', 0, 0, -8, 0);
    P.land('lampPosts', 6, 0, 30, Math.PI);
    P.land('surge', 0, 0, 50, 0);
    P.land('verge', -22, 0, 40, Math.PI / 2);
    P.land('tollBooth', 24, 0, 74, -Math.PI / 2);
    sign(P, 'HELIX NORTH 3 KM', 0, 7.4, -3.9, 0, { size: 0.6, color: '#f4f4f0', boardMat: 'signGreen' });
    for (const x of [-12, 12]) P.box([x - 0.2, 0, -4.2, x + 0.2, 7.8, -3.6], 'latticeSteel');
    P.E('PRESENT', () => {
      // the river over the road: deep water from z 0 to 82; the lamp heads poke out every 2 m along the verge
      water(P, [-60, 0, 60, 82], 1.4, 'highwayWater', { depth: 1.8, bed: false });
      P.drown([-60, 0, 60, 82], 0.95, '@PRESENT');
      for (let z = 2; z < 82; z += 2) {
        P.cyl(6, 0, z, 0.08, 1.6, 'ironDark', { seg: 5, prop: 1 });
        P.box([5.2, 1.6, z - 0.8, 6.8, 1.9, z + 0.8], 'lampGlow');
      }
    });
    P.E('FUTURE', () => {
      // dry and buckled: the slabs heaved up, weeds in the cracks
      for (let i = 0; i < 10; i++) P.obox(P.rng.float(-8, 8), -0.3, 8 + i * 7.6, 6, 0.6, 6, P.rng.float(-0.3, 0.3), 'motorway', { rx: P.rng.float(-0.15, 0.15), rz: P.rng.float(-0.15, 0.15), solid: true });
      for (let i = 0; i < 20; i++) P.tree('grass', P.rng.float(-50, 50), P.rng.float(0, 90), P.rng.float(0.8, 1.3), { solid: false });
    });
    prop(P, 'booth', 24, 74, -Math.PI / 2);
    P.obox(-22, 0.1, 40, 3.2, 0.2, 1.4, 0.4, 'signGreen', { prop: 1 });
    P.E('PAST', () => { for (const [x, z] of [[-5, 20], [5, 44], [-5, 70]]) prop(P, 'car', x, z, 0); for (let z = 4; z < 88; z += 14) prop(P, 'lampPost', 12, z, Math.PI); });
    for (const x of [-12, 12]) P.vbox([x - 0.3, 0, -10, x + 0.3, 0.8, 196], 'steel', { noShadow: 1 });
    // --- Q3: the collapsing skyscraper and the transmission tower on the coast ---------------------------------------
    P.land('towerFoot', 0, 0, 96, 0);
    P.land('stabilizer', 18, 0, 170, 0);
    P.land('pylon1', -20, 0, 156, 0);
    P.land('pylon2', 30, 0, 148, 0);
    P.land('pylon3', 6, 0, 186, 0);
    P.land('slabs', -26, 6, 128, Math.PI / 2);
    P.land('floorFragment', -30, 0, 112, 0);
    P.land('pocket', 40, 0, 116, 0);
    P.land('towerDeck', 24, TOP, 186, Math.PI);
    P.land('transmissionScreen', 24, TOP, 182, Math.PI);
    for (const [x, z] of [[-20, 156], [30, 148], [6, 186]]) { P.cyl(x, 0, z, 0.9, 3.4, 'latticeSteel', { seg: 8, solid: true }); P.cyl(x, 3.4, z, 1.2, 0.3, 'stormGlow', { seg: 12 }); }
    P.box([14, 0, 166, 22, 1.4, 174], 'machinePanel');
    // the skyscraper: whole in 2026 and 2049; in 2196 its floors tilted into a climb toward the tower's deck
    P.E(['PRESENT', 'PAST'], () => {
      P.box([-50, 0, 104, -14, 60, 140], 'towerGlass', { t: 0xc8d0d8 });
      P.blocks.push([-50, 104, -14, 140]);
    });
    P.E('FUTURE', () => {
      P.box([-50, 0, 104, -14, 6, 140], 'slabConcrete');
      // tilted floors, each a ramp from the last: the climb (6 m to 26 m) eastward toward the tower
      ramp(P, [-14, 104, 6, 112], 6, 12, 'E', 'slabConcrete', { terrain: false });
      P.box([6, 11.6, 104, 14, 12, 120], 'slabConcrete');
      ramp(P, [6, 120, 14, 140], 12, 19, 'S', 'slabConcrete', { terrain: false });
      P.box([6, 18.6, 140, 30, 19, 148], 'slabConcrete');
      ramp(P, [22, 148, 30, 178], 19, TOP, 'S', 'slabConcrete', { terrain: false });
      stair(P, -20, 95, 0, -20, 103.9, 6, 3, 'slabConcrete'); // (up onto the stump from the street)
      for (let i = 0; i < 6; i++) P.obox(-32 + i * 3, 6 + i * 2, 122, 14, 0.6, 16, 0, 'slabConcrete', { rx: 0.2 * ((i % 2) * 2 - 1), rz: 0.15 });
      for (let k = 0; k < 4; k++) P.box([-50 + k * 9, 6, 104, -48 + k * 9, 18 + k * 6, 106], 'latticeSteel', { solid: false });
    });
    // the transmission tower: 120 m of lattice on the coast, its deck at 26 m
    lattice(P, 24, 186, 0, 120, 8, 1.2, 'latticeSteel', { beacon: 'redBeacon', bays: 12 });
    P.box([16, TOP - 0.4, 178, 32, TOP, 194], 'gratingSteel');
    for (const [x0, z0, x1, z1] of [[16, 194, 32, 194], [32, 178, 32, 194], [16, 178, 16, 194]]) railing(P, x0, z0, x1, z1, 1.1, 'steel', { y: TOP });
    P.box([20, TOP, 179, 28, TOP + 3, 179.4], 'machinePanel');
    P.vbox([20.4, TOP + 0.6, 179.4, 27.6, TOP + 2.6, 179.5], 'stormGlow', { noShadow: 1 });
    // (the deck's south side at z 178 is open to the skyscraper's last tilted floor)
    for (let i = 0; i < 10; i++) P.obox(P.rng.float(-55, 55), 0, P.rng.float(100, 194), P.rng.float(1, 3), P.rng.float(0.4, 1.4), P.rng.float(1, 3), P.rng.float(0, 3), 'slabConcrete', { prop: 1 });
  },
};
