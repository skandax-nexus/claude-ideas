// The village at the river bend (Mission 5, THE VILLAGE THAT NEVER EXISTED; OVERHAUL.md §5 M5).
// A 14 m river comes out of the upstream gorge, turns west past the head-stone and the mill, and
// runs under the village's 80 m retaining wall; south of it the low bank and the basin with its
// pressure gate. THRIVING: whitewash and thatch, boats, washing lines, fish racks. ABANDONED: roofs
// fallen in, weeds, crows, drizzle. FLOODED: water at +4 m over the low village; roof tops, the
// wall's top and the gate tower are the stepping route. The gorge quarter (chain B) climbs three
// cascade levels to three stone gates under an aqueduct arch and a painted-over mural cliff.
//   Q0 THE HEAD-STONE     x 10 .. 100, z -40 .. 14
//   Q1 THE RETAINING WALL x -100 .. 10, z -60 .. 0 (the village terrace at 2 m)
//   Q2 THE PRESSURE GATE  x -100 .. 10, z 14 .. 70 (the low bank, the basin)
//   Q3 THE UPPER GORGE    x 10 .. 100, z -150 .. -40 (side)
import { ground, groundHoles, terrace, stair, water, wall, roundhouse, longhouse, prop, glyphs, bridge, arch } from '../archetypes.js';

const RIVER = [[-100, 0, 48, 14], [48, -30, 62, 14]]; // the channel: west along z 0..14, and down from the gorge
const BASIN = [-80, 34, -30, 62];
const BASIN_STAIR = [-47.5, 31.6, -44.5, 34]; // (the stair down into it, where it is cut into the meadow)
const FLOOD = 4;

export default {
  key: 'valley_river', style: 'river', sameAs: null, name: 'THE RIVER BEND',
  bounds: [-100, -150, 100, 70],
  edges: { N: 'cliff', E: 'cliff', W: 'water', S: 'slope' },
  killY: -3.4, // (U7: under the drained basin's floor at -2.5, which a stair walks down into; the river's deep channel drowns)
  primary: 'headStone',
  ancientYears: ['PAST', 'PRESENT', 'FUTURE'],
  backdrop: { notch: 'clear', ringHill: 'NE' },
  years: {
    PRESENT: { sky: 'greyOvercast', era: 'ancient', hour: 15.2, sun: { elev: 28, az: 230 }, fog: 0x9aa0a4, density: 1.5, night: 0.12, weather: 'motes', ibl: 'dusk', lit: 0,
      hemi: { sky: 0xb0b6ba, ground: 0x6a6e6a, k: 0.9 }, sunColor: 0xd8dcdc, sunK: 0.55, grade: { shadowTint: 0x2a3034, highlightTint: 0xe8ecec, toning: 0.12, contrast: 1.04, saturation: 0.82 } },
    PAST: { sky: 'clearMidday', era: 'ancient', hour: 12.5, sun: { elev: 66, az: 185 }, fog: 0xc8dcec, density: 0.7, night: 0, weather: 'pollen', ibl: 'plant', lit: 0,
      hemi: { sky: 0xd8ecf8, ground: 0x7a8a5a, k: 1.0 }, sunColor: 0xfff8e8, sunK: 1.3, grade: { shadowTint: 0x203a4a, highlightTint: 0xfffaf0, toning: 0.1, contrast: 1.1, saturation: 1.1 } },
    FUTURE: { sky: 'tealLowSky', era: 'ancient', hour: 16.6, sun: { elev: 18, az: 250 }, fog: 0x8ac0b4, density: 1.6, night: 0.2, weather: 'steam', ibl: 'dusk', lit: 0,
      hemi: { sky: 0x9fd8c8, ground: 0x2e4a48, k: 0.85 }, sunColor: 0xd8fff0, sunK: 0.8, grade: { shadowTint: 0x0e3a36, highlightTint: 0xd8fff4, toning: 0.24, contrast: 1.08, saturation: 0.94 } },
  },
  quarters: [
    { name: 'THE HEAD-STONE', area: [10, -40, 100, 14], spawnAt: 'weir', threshold: { at: 'villageGate', kind: 'path' } },
    { name: 'THE RETAINING WALL', area: [-100, -60, 10, 0], spawnAt: 'villageGate', threshold: { at: 'riverLanding', kind: 'stair' } },
    { name: 'THE PRESSURE GATE', area: [-100, 14, 10, 70], spawnAt: 'southBank', threshold: { at: 'gateTower', kind: 'tower' } },
    { name: 'THE UPPER GORGE', area: [10, -150, 100, -34], spawnAt: 'gorgeMouth', threshold: null },
  ],
  // (Case B, THE WATER THAT REMEMBERS, replays Mission 5's upper gorge: cases.js; this map, its quarters)
  beatAt: { m05: ['headStone', 'wallBrace', 'gateTop'] },
  exits: { m05: 'buriedMachine', c_b: 'aqueduct' },
  frags: { m05: [['weir', 'wall80', 'gateTower'], ['stiltHouses', 'jetties', 'basin']] },
  crowd: [
    { era: 'ancient', years: ['PAST'], region: 'settlement', role: 'waterKeeper', path: [[-60, -21], [-20, -31], [-10, -11]], n: 6 },
    { era: 'ancient', years: ['PAST'], region: 'settlement', role: 'fisher', path: [[-77, 18], [-27, 18]], n: 3 },
    // (U7) in ABANDONED the same villagers walk their old rounds as echoes (§5 M5)
    { era: 'ancient', years: ['PRESENT'], region: 'settlement', role: 'waterKeeper', path: [[-58, -22], [-22, -30], [-12, -12]], n: 3, echo: true },
    // (U4 review) and in FLOODED too, the fishers along what is left of the bank (§5 M5: echoes in both later years)
    { era: 'ancient', years: ['FUTURE'], region: 'settlement', role: 'fisher', path: [[-77, 18], [-27, 18]], n: 3, echo: true },
  ],

  build(P) {
    // --- the ground: the river's channel and the basin cut into it; the village terrace at 2 m ----------
    groundHoles(P, [-100, -40, 100, 70], [...RIVER, BASIN, [-25.5, 14, -20.5, 34], BASIN_STAIR], 0, 'riverMeadow');
    groundHoles(P, [-100, -150, 10, -1], [[-31.6, -7, -28.4, -1]], 2, 'riverMeadow', { depth: 2.6 });
    P.vbox([9.6, -0.6, -150, 10, 2, -1], 'riverStone');
    for (const s of [-1, 1]) P.vbox([-30 + s * 1.6 - 0.2, -0.6, -7, -30 + s * 1.6 + 0.2, 2, -1], 'riverStone');
    for (const [x0, z0, x1, z1] of RIVER) water(P, [x0, z0, x1, z1], -1.0, 'riverWater', { depth: 2.0, bedMat: 'riverBed' });
    for (const r of RIVER) P.drown(r, -1.6); // (the current takes Kai back, where the place's killY did before the basin was walkable)
    // the channel's banks
    P.vbox([-100, -3.2, -0.4, 48, 0, 0], 'riverStone');
    P.vbox([-100, -3.2, 14, -25.5, 0, 14.4], 'riverStone');
    P.vbox([-20.5, -3.2, 14, 48, 0, 14.4], 'riverStone');
    P.vbox([47.6, -3.2, -30, 48, 0, 0], 'riverStone');
    P.vbox([62, -3.2, -30, 62.4, 0, 14.4], 'riverStone');
    // the basin, sunk 2.5 m, and the channel that feeds it from the river through the pressure gate
    ground(P, BASIN, -2.5, 'basinMud');
    // (playtest v2.1.1 M5: the rims were drawn but not solid, and the meadow is cut away over the basin, so from the
    // basin floor Kai walked on under the meadow and out of the world. They are solid now, the north one open where the
    // stair comes down; and the meadow is cut over the stair too, whose upper steps ran under it, so it is walked up
    // again, not climbed with a jump)
    const [sx0, , sx1] = BASIN_STAIR;
    for (const b of [[BASIN[0], -2.5, BASIN[1], sx0, 0, BASIN[1] + 0.4], [sx1, -2.5, BASIN[1], BASIN[2], 0, BASIN[1] + 0.4], [BASIN[0], -2.5, BASIN[3] - 0.4, BASIN[2], 0, BASIN[3]], [BASIN[0], -2.5, BASIN[1], BASIN[0] + 0.4, 0, BASIN[3]], [BASIN[2] - 0.4, -2.5, BASIN[1], BASIN[2], 0, BASIN[3]]]) P.box(b, 'riverStone');
    stair(P, -46, 31.6, 0, -46, 37.6, -2.5, 3, 'riverStone');
    for (const x of [sx0 - 0.4, sx1]) P.box([x, -2.8, BASIN_STAIR[1], x + 0.4, 0, BASIN[1]], 'riverStone'); // (the cut's cheeks)
    P.vbox([-25.5, -2.6, 14, -20.5, -2.2, 34], 'riverBed');
    P.col([-25.5, -3, 14, -20.5, -2.2, 34]);
    for (const x of [-26, -20]) P.box([x - 0.5, -2.6, 14, x + 0.5, 0, 34], 'riverStone');
    // (playtest v2.1 F17: the gate channel was a 2.2 m trench with sheer sides that Kai walked into from the south bank and
    // could leave only by the river. Now a parapet runs along both its sides, waist-high, and a stair climbs out of its
    // south end to the bank)
    for (const x of [-26, -20]) P.box([x - 0.5, 0, 14.4, x + 0.5, 0.85, 34], 'riverStone');
    stair(P, -23, 28.2, -2.2, -23, 33.9, 0, 3.4, 'riverStone');
    // --- Q0: the head-stone, the weir, the mill race and the mill -----------------------------------------
    P.land('weir', 42, 0, -20, Math.PI / 2);
    P.box([48, -1.6, -21, 62, -0.6, -19], 'riverStone');
    P.land('headStone', 44, 0, -9, Math.PI / 2);
    P.box([45.2, -1.2, -11, 47.8, 1.6, -7], 'headStone');
    glyphs(P, 45.1, 0.4, -9, 0.2, 1.0, Math.PI / 2, { m: 'glyphStone' });
    P.land('millRace', 34, 0, -10, 0);
    water(P, [24, -11.5, 47.6, -8.5], -0.6, 'riverWater', { depth: 0.8, bedMat: 'riverBed', wade: true });
    P.land('waterMill', 22, 0, -16, 0);
    P.box([14, 0, -24, 24, 5, -14], 'whitewash');
    P.gable(19, 5, -19, 10.6, 10.6, 3.6, 0, 'reedThatch');
    P.torus(25, 2.4, -10, 2.6, 0.25, 'timber', { ry: Math.PI / 2, seg: 18 });
    for (let i = 0; i < 6; i++) P.obox(25, 2.4, -10, 0.15, 5.0, 0.4, 0, 'timber', { rx: (i / 6) * Math.PI });
    P.land('villageGate', 7, 2, -26, -Math.PI / 2);
    stair(P, 16, -26, 0, 10, -26, 2, 3.6, 'riverStone');
    P.land('gorgeMouth', 55, 0, -36, Math.PI);
    // --- Q1: the village on its terrace behind the 80 m wall ---------------------------------------------------
    P.land('wall80', -48, 2, -1, 0);
    wall(P, -88, -0.9, -8, -0.9, 4.6, 1.2, 'riverStone', { y: 0, openings: [[57, 61, 0, 2.6]] });
    P.col([-88, 4.5, -1.5, -8, 4.6, -0.3]); // its top is a path
    stair(P, -20, -7, 2, -20, -2.2, 4.6, 2.2, 'riverStone');
    P.land('wallBrace', -48, 2, -3.2, Math.PI);
    P.W('wall_braced', () => P.E(['PRESENT', 'FUTURE'], () => {
      for (let x = -84; x <= -12; x += 8) P.obox(x, 2, -3.0, 0.4, 4.0, 3.2, 0, 'timber', { rx: 0.65 });
    }));
    P.land('riverLanding', -30, 0.3, -1.6, Math.PI);
    ground(P, [-33, -3, -27, 0], 0.3, 'riverStone', { depth: 0.6 });
    stair(P, -30, -6.5, 2, -30, -3, 0.3, 2.8, 'riverStone');
    P.land('footbridgeN', -30, 0.3, -1.5, Math.PI);
    P.land('footbridgeS', -30, 0, 16.5, 0);
    P.E('PAST', () => bridge(P, -30, -0.4, -30, 14.6, 2.4, 0.3, 'timber', { parapetH: 0.9, thick: 0.4 }));
    P.E('PRESENT', () => {
      P.obox(-31, -1.2, 4, 2.2, 0.4, 5, 0.2, 'timber', { rx: 0.35 });
      P.obox(-29.4, -1.0, 11, 2.2, 0.4, 4, -0.3, 'timber', { rx: -0.3 });
    });
    P.challenge('canal', [-40, -6, -20, 20], 'PAST', null);
    P.land('jetties', -58, 0, 2, 0);
    for (const x of [-64, -52]) P.box([x - 1.2, -0.6, 0, x + 1.2, 0.25, 6], 'timber');
    P.land('tallyWall', -16, 2, -36, Math.PI / 2);
    wall(P, -16, -42, -16, -30, 2.4, 0.6, 'whitewash', { y: 2 });
    glyphs(P, -15.6, 2.8, -36, 0.1, 1.2, Math.PI / 2, { m: 'tallyMarks' });
    P.land('coldHearths', -62, 2, -30, 0);
    for (const [x, z] of [[-62, -30], [-70, -40], [-44, -48]]) prop(P, 'firePit', x, z, 0, { y: 2, fire: false });
    P.land('muralWall', -78, 2, -46, Math.PI / 2);
    P.box([-79.4, 2, -54, -78.4, 6, -38], 'whitewash');
    glyphs(P, -78.3, 2.6, -46, 0.08, 3.0, Math.PI / 2, { m: 'muralPaint' });
    // the houses of the village: whole in THRIVING, roofless in ABANDONED, drowned to the eaves in FLOODED
    const houses = [[-70, -20, 3.6], [-54, -16, 3.4], [-38, -22, 3.8], [-24, -16, 3.2], [-60, -46, 3.6], [-40, -38, 3.4], [-28, -48, 3.6], [-6, -40, 3.2], [-86, -30, 3.4], [-86, -12, 3.0]];
    for (const [x, z, r] of houses) {
      P.cyl(x, 2, z, r + 0.15, 0.6, 'riverStone', { seg: 12 });
      P.E(['PAST', 'FUTURE'], () => {
        P.cyl(x, 2.6, z, r, 1.9, 'whitewash', { seg: 12 });
        P.cone(x, 4.5, z, r + 1.0, 3.6, 'reedThatch', { seg: 12 });
      });
      P.E('PRESENT', () => P.cyl(x, 2.6, z, r, 0.9, 'whitewash', { seg: 12, open: 1 }));
      P.col([x - r * 0.75, 2, z - r * 0.75, x + r * 0.75, 4.5, z + r * 0.75]);
      P.E('FUTURE', () => P.col([x - 0.9, 4.5, z - 0.9, x + 0.9, 5.4, z + 0.9]));
      P.blocks.push([x - r, z - r, x + r, z + r]);
    }
    longhouse(P, { rect: [-60, -34, -44, -26], y: 2 });
    // --- Q2: the low bank, the stilt houses, the basin and the pressure gate ------------------------------------
    P.land('southBank', -8, 0, 22, 0);
    P.land('stiltHouses', -70, 0, 20, Math.PI);
    const stilts = [[-82, 19], [-70, 19], [-58, 20], [-44, 19], [-8, 20], [4, 19]];
    for (const [x, z] of stilts) {
      for (const [dx, dz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) P.cyl(x + dx, -0.2, z + dz, 0.15, 2.4, 'timber', { seg: 6 });
      P.box([x - 2.2, 2.2, z - 2.2, x + 2.2, 2.4, z + 2.2], 'timber');
      P.E(['PAST', 'FUTURE'], () => P.cone(x, 4.3, z, 3.2, 2.8, 'reedThatch', { seg: 10 }));
      P.E(['PAST', 'PRESENT'], () => P.box([x - 2.0, 2.4, z - 2.0, x + 2.0, 4.3, z + 2.0], 'whitewash', { solid: false }));
      P.E('FUTURE', () => P.col([x - 0.9, 4.3, z - 0.9, x + 0.9, 5.2, z + 0.9]));
    }
    // the low-bank houses stand in ABANDONED and FLOODED only if the river was diverted in THRIVING
    for (const [x, z] of [[-90, 40], [-14, 48], [-6, 62]]) {
      P.E('PAST', () => roundhouse(P, { x, z, r: 3.2 }));
      P.W('river_diverted', () => P.E(['PRESENT', 'FUTURE'], () => roundhouse(P, { x, z, r: 3.2 })));
    }
    P.land('basin', -55, -2.5, 48, 0);
    P.land('buriedMachine', -55, -2.5, 52, Math.PI);
    P.land('cairnSite', -62, 0, 27, 0);
    P.land('gateTower', -29.5, 0, 37, 0);
    P.box([-32.5, 0, 26, -26.6, 7.4, 34], 'riverStone');
    for (const [x0, z0, x1, z1] of [[-32.5, 26, -26.6, 26.3], [-32.5, 26, -32.2, 34], [-26.9, 26, -26.6, 34]]) P.vbox([x0, 7.4, z0, x1, 8.2, z1], 'riverStone');
    glyphs(P, -26.5, 3.2, 30, 0.1, 1.8, Math.PI / 2, { m: 'glyphStone' });
    // the tower's stair climbs from the solid ground south of it (the basin is west, the gate channel east)
    stair(P, -28, 44, 0, -28, 34.1, 7.4, 2.4, 'riverStone');
    P.land('gateTop', -28.6, 7.4, 30, Math.PI / 2);
    // the machine in the basin floor: clay over it until the gate is released (and in the years before)
    P.vbox([-60, -2.5, 47, -50, -1.9, 57], 'basinMud', { prop: 1 });
    P.W('gate_released', () => P.vbox([-58, -2.6, 49, -52, -2.3, 55], 'machinePanel'));
    // --- FLOODED: the water at +4 m, deep; the wall's top, the roofs and the tower are the way --------------------
    P.E('FUTURE', () => {
      P.W('!gate_released', () => P.plane(-100, 0, 48, 70, FLOOD, 'floodWater', { noShadow: 1 }));
      P.W('!wall_braced', () => P.plane(-100, -60, 10, 0, FLOOD, 'floodWater', { noShadow: 1 }));
      for (let i = 0; i < 18; i++) P.tree('reeds', P.rng.float(-96, 40), P.rng.float(16, 68), P.rng.float(0.9, 1.4), { y: FLOOD - 0.6, solid: false });
      // the stepping route from the wall's top to the tower: post tops in the river, then roofs
      for (const [x, z, y] of [[-20, 2.2, 4.4], [-20.6, 5.6, 4.4], [-21.2, 9, 4.4], [-21.8, 12.4, 4.4], [-23.6, 16, 5.2], [-25.6, 19.6, 6.0], [-27.6, 23.2, 6.8]]) P.box([x - 0.8, FLOOD - 1, z - 0.8, x + 0.8, y, z + 0.8], 'timber');
    });
    P.drown([-100, 0, 48, 70], FLOOD - 0.8, '@FUTURE && !gate_released');
    P.drown([-100, -60, 10, 0], FLOOD - 0.8, '@FUTURE && !wall_braced');
    // --- THRIVING's life: boats, washing lines, fish racks; ABANDONED's weeds and crows ---------------------------
    P.E('PAST', () => {
      for (const [x, z, ry] of [[-60, 8, 1.4], [-10, 6, 1.7], [20, 9, 1.5], [55, -10, 0]]) prop(P, 'boat', x, z, ry, { y: -0.95 });
      for (const [x, z] of [[-74, 26], [-36, 24], [-2, 28]]) prop(P, 'fishRack', x, z, 0);
      for (const [x, z] of [[-64, -26], [-32, -30], [-50, -52]]) P.vbox([x - 3, 3.6, z, x + 3, 3.62, z + 0.02], 'rope', { prop: 1 });
      for (const [x, z] of [[-63, -26], [-60, -26], [-31, -30], [-28, -30], [-48, -52]]) P.vbox([x - 0.6, 2.6, z - 0.02, x + 0.6, 3.6, z + 0.02], 'linen', { prop: 1 });
      for (const [x, z] of [[-40, -12], [-18, -30], [-74, -50]]) prop(P, 'pots', x, z, 0, { y: 2 });
    });
    P.E('PRESENT', () => {
      for (let i = 0; i < 16; i++) P.tree('fern', P.rng.float(-96, 6), P.rng.float(-58, -4), P.rng.float(0.8, 1.3), { y: 2, solid: false });
      for (const [x, z, ry] of [[-66, 30, 0.3], [-12, 34, 1.2]]) P.obox(x, 0, z, 1.4, 0.4, 4.4, ry, 'timber', { rx: 0.1 });
    });
    // --- the far bank of the gorge channel, the first thing Kai sees from the weir, in its three years ------------------
    // (playtest v2.1 F17: from the start the three years looked alike: the same channel, meadow and willows. Across the
    // channel now: a farmstead with its barley and blossom in THRIVING; the same house roofless among weeds and dead trees,
    // a boat rotting on the bank, in ABANDONED; in FLOODED the channel brims and the meadow is a sheet of water to the
    // willows, the house drowned to its thatch)
    const FARM = [80, -12, 3.4];
    // (its own random numbers: the place's P.rng sequence, which places the gorge's rock, is left as it was)
    const rnd = ((n) => () => (n = (n * 16807) % 2147483647) / 2147483647)(5005), rf = (a, b) => a + (b - a) * rnd();
    const plant = (k, x, z, s, o = {}) => P.tree(k, x, z, s, { r: rf(0, Math.PI * 2), ...o });
    P.E('PAST', () => {
      roundhouse(P, { x: FARM[0], z: FARM[1], r: FARM[2], y: 0, wall: 'whitewash', roof: 'reedThatch', footing: 'riverStone' });
      for (let i = 0; i < 26; i++) plant('barley', rf(66, 92), rf(-33, -23), rf(1.0, 1.3), { solid: false });
      for (const [x, z] of [[68, -18], [90, -2]]) plant('blossom', x, z, 1.1);
      prop(P, 'fishRack', 66.5, 5, 0);
      P.vbox([84.5, 1.9, -6.2, 90.5, 1.92, -6.18], 'rope', { prop: 1 });
      for (const x of [85.4, 87.2, 89.0]) P.vbox([x - 0.5, 1.0, -6.21, x + 0.5, 1.9, -6.17], 'linen', { prop: 1 });
    });
    P.E('PRESENT', () => {
      P.cyl(FARM[0], 0, FARM[1], FARM[2] + 0.15, 0.6, 'riverStone', { seg: 12 });
      P.cyl(FARM[0], 0.6, FARM[1], FARM[2], 1.0, 'whitewash', { seg: 12, open: 1 });
      P.col([FARM[0] - FARM[2] * 0.75, 0, FARM[1] - FARM[2] * 0.75, FARM[0] + FARM[2] * 0.75, 1.6, FARM[1] + FARM[2] * 0.75]);
      for (const [x, z] of [[68, -18], [90, -2]]) plant('bareTree', x, z, 1.0);
      for (let i = 0; i < 18; i++) plant('fern', rf(65, 95), rf(-32, 10), rf(0.9, 1.5), { solid: false }); // (the place keeps to six kinds of plant)
      P.obox(65.2, 0, -3, 1.3, 0.55, 4.0, 0.5, 'timber', { rz: 0.45 });
    });
    P.E('FUTURE', () => {
      P.plane(48, -30, 62, 14, -0.12, 'floodWater', { noShadow: 1 });
      P.plane(62.4, -34, 100, 14, 0.14, 'floodWater', { noShadow: 1 });
      P.cone(FARM[0], 0.7, FARM[1], FARM[2] + 1.0, 2.4, 'reedThatch', { seg: 12 });
      P.col([FARM[0] - 1.2, 0, FARM[1] - 1.2, FARM[0] + 1.2, 1.6, FARM[1] + 1.2]);
      for (const [x, z] of [[68, -18], [90, -2]]) plant('bareTree', x, z, 1.0);
      for (let i = 0; i < 16; i++) plant('reeds', rf(64, 96), rf(-32, 12), rf(0.8, 1.2), { y: 0.1, solid: false });
    });
    for (const [x, z] of [[-94, -56], [-70, -58], [6, -56], [-94, 64], [-40, 68], [8, 66], [92, -36], [70, 6], [94, 10]]) P.tree('willow', x, z, P.rng.float(1.1, 1.5));
    for (let i = 0; i < 12; i++) P.tree('willow', P.rng.float(-96, 4), P.rng.float(-146, -66), P.rng.float(1.0, 1.6));
    for (const [x, z, w] of [[-80, -120, 14], [-40, -136, 18], [-10, -100, 10], [-62, -84, 9]]) P.obox(x, 2, z, w, P.rng.float(2, 5), w * 0.8, P.rng.float(0, 3), 'cliffRock', { solid: true });
    for (let i = 0; i < 16; i++) P.tree('reeds', P.rng.float(-96, 44), P.rng.float(14.6, 17), P.rng.float(0.8, 1.2), { solid: false });
    // --- Q3: the upper gorge: three cascade levels, three gates, the aqueduct, the mural cliff -----------------------
    ground(P, [10, -60, 100, -40], 0, 'gorgeFloor');
    terrace(P, [22, -90, 90, -60], 3, 'gorgeFloor', { wall: 'riverStone', sides: 'S' });
    terrace(P, [22, -150, 90, -90], 6, 'gorgeFloor', { wall: 'riverStone', sides: 'S' });
    // the gorge's walls: rock in 10 m buttresses of uneven height, each capped by a tilted slab (a broken skyline)
    for (const [x0, x1, h] of [[10, 22, 20], [90, 100, 22]]) {
      for (let z = -150; z < -40; z += 10) {
        const hh = h + P.rng.float(-7, 3);
        P.box([x0, 0, z, x1, hh, z + 10], 'cliffRock');
        P.obox((x0 + x1) / 2 + P.rng.float(-1, 1), hh - 1.6, z + 5, x1 - x0 + 1.5, P.rng.float(2.4, 4.4), 11, P.rng.float(-0.2, 0.2), 'cliffRock', { rx: P.rng.float(-0.22, 0.22), rz: P.rng.float(-0.25, 0.25) });
      }
    }
    for (let i = 0; i < 6; i++) P.obox(P.rng.float(14, 20), 0, -48 - i * 18, 8, P.rng.float(16, 24), 14, P.rng.float(-0.2, 0.2), 'cliffRock');
    P.land('dryChannel', 55, 0, -46, Math.PI);
    for (const [z0, z1, y] of [[-60, -40, 0], [-90, -60, 3], [-150, -90, 6]]) P.vbox([51, y - 0.4, z0, 59, y + 0.02, z1], 'riverBed', { noShadow: 1 });
    // (each stair climbs to its terrace's face, never into it: the gorge's way up for Mission 5 and Case B)
    stair(P, 70, -57, 0, 70, -60, 3, 4, 'riverStone');
    stair(P, 70, -87, 3, 70, -90, 6, 4, 'riverStone');
    for (const [name, z, y] of [['gate1', -60, 0], ['gate2', -90, 3], ['gate3', -120, 6]]) {
      P.land(name, 55, y, z + 1.4, Math.PI);
      arch(P, 55, z, 8, 4.2, 1.8, 0, 'riverStone', { y });
      P.E('PAST', () => P.box([51, y, z - 0.3, 59, y + 2.8, z + 0.3], 'gateTimber'));
    }
    P.land('aqueduct', 55, 6, -105, 0);
    arch(P, 55, -105, 60, 15, 4, 0, 'riverStone', { y: 6, pier: 3 });
    P.land('muralCliff', 22.6, 3, -76, Math.PI / 2);
    glyphs(P, 22.4, 4, -76, 0.12, 6, Math.PI / 2, { m: 'muralPaint' });
    for (let i = 0; i < 20; i++) P.tree('fern', P.rng.float(24, 88), P.rng.float(-148, -44), P.rng.float(0.9, 1.5), { solid: false });
  },
};
