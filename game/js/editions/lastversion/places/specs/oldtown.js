// Rain City's Old Town on the old river terraces (Mission 6, THE CLOCKMAKER'S HOUSE; OVERHAUL.md §5 M6).
// M5's river is a stone canal now: a canal street of cobbles and plane trees, two humpback bridges,
// four- and five-storey townhouses with steep slate roofs, dormers, shutters and workshops. Ezra
// Moll's corner house is 16 × 16 m and five storeys round an open 6 × 6 m light well that runs from
// the cellar (the village's old water steps) to a glass lantern; galleries on every floor, a scissor
// stair up to the third floor, the repeating brass arm sweeping the shop floor, the clock room behind a 6 m face (up
// the servants' stair along the north wall, which stands only in 2026: later it is bricked up and floored over, so the
// clock room is reached in 2026 or not at all), the roof terrace. 2026 is a spring morning; 2049 an autumn evening;
// 2196 winter, the canal iced over, the lantern broken, vines down the well, the arm rusted solid.
//   Q0 SHOP FLOOR & CANAL STREET   the street, the cellar, the shop floor (below 3.5 m)
//   Q1 THE GALLERIES               floors 1-3 of the house (4 / 8 / 12 m)
//   Q2 THE CLOCK ROOM / ROOF       the clock room (16 m) and the roof terrace (20 m)
import { ground, groundHoles, terrace, stair, water, wall, railing, block, fill, prop, sign, bridge, glyphs } from '../archetypes.js';

const H = [8, -32, 24, -16]; // the house
const WELL = [13, -27, 19, -21];
const STRIP = [20.4, -31.0, 23.2, -17.6]; // the scissor stair (flights between z -29.6 and -19)

export default {
  key: 'oldtown', style: 'oldtown', sameAs: null, name: 'OLD TOWN',
  bounds: [-60, -70, 60, 70],
  edges: { N: 'blocks', E: 'blocks', W: 'blocks', S: 'blocks' },
  killY: -8,
  primary: 'clockFace',
  backdrop: { skyline: 'rain2049', notch: 'faint' },
  years: {
    PRESENT: { sky: 'autumnEvening', era: '2049', hour: 18.7, sun: { elev: 2, az: 280 }, fog: 0xb89080, density: 1.1, night: 0.35, weather: 'motes', ibl: 'dusk', lit: 0.8,
      hemi: { sky: 0xb8a8b0, ground: 0x5a4a4a, k: 0.8 }, sunColor: 0xf09060, sunK: 0.85, grade: { shadowTint: 0x3a2418, highlightTint: 0xffe0c0, toning: 0.2, contrast: 1.1, saturation: 1.04 } },
    PAST: { sky: 'springMorning', era: '2026', hour: 9.3, sun: { elev: 30, az: 120 }, fog: 0xece4d4, density: 0.8, night: 0, weather: null, ibl: 'plant', lit: 0,
      hemi: { sky: 0xf4ead8, ground: 0x8a8a70, k: 0.95 }, sunColor: 0xfff2dc, sunK: 1.15, grade: { shadowTint: 0x2a3a3a, highlightTint: 0xfff6e8, toning: 0.1, contrast: 1.06, saturation: 1.02 } },
    FUTURE: { sky: 'winterFrost', era: '2196', hour: 13.5, sun: { elev: 14, az: 190 }, fog: 0xc8d0d8, density: 1.9, night: 0.2, weather: 'frost', ibl: 'night', lit: 0.18,
      hemi: { sky: 0xd8e0e8, ground: 0xb8c0c8, k: 0.85 }, sunColor: 0xf0f4ff, sunK: 0.6, grade: { shadowTint: 0x2a3444, highlightTint: 0xf0f6ff, toning: 0.16, contrast: 1.04, saturation: 0.78 } },
  },
  quarters: [
    { name: 'SHOP FLOOR & CANAL STREET', area: [-60, -70, 60, 70], spawnAt: 'cellarStair', threshold: { at: 'galleryLanding', kind: 'stair' }, cp: [-60, -12, -70, 60, 3.5, 70] },
    { name: 'THE GALLERIES', area: [-10, -50, 40, 0], spawnAt: 'galleryLanding', threshold: { at: 'clockLanding', kind: 'stair' }, cp: [8, 3.5, -32, 24, 15.5, -16] },
    { name: 'THE CLOCK ROOM / ROOF', area: [-10, -60, 40, -10], spawnAt: 'clockLanding', threshold: { at: 'roofTerrace', kind: 'roof' }, cp: [8, 15.5, -32, 24, 30, -16] },
  ],
  beatAt: { m06: ['shopFloor', 'ezraBench', 'clockRoom'] },
  exits: { m06: 'roofTerrace' },
  frags: { m06: [['canalBridge', 'floorboards', 'loopSpring']] },
  crowd: [
    { era: 'present', years: ['PRESENT', 'PAST'], region: 'rain', role: 'civilian', path: [[-50, -11], [50, -11]], n: 6 },
    { era: 'present', years: ['PRESENT', 'PAST'], region: 'rain', role: 'courier', path: [[-50, 11], [50, 11]], n: 4 },
  ],

  build(P) {
    // --- the canal and its streets ------------------------------------------------------------------------
    groundHoles(P, [-60, -70, 60, -6], [H], 0, 'cobbles'); // (the house stands in a hole: its cellar goes down 4 m)
    ground(P, [-60, 6, 60, 70], 0, 'cobbles');
    water(P, [-60, -6, 60, 6], -1.5, 'canalGreen', { depth: 2.0 });
    for (const z of [-6.4, 6]) P.box([-60, -3.6, z, 60, 0, z + 0.4], 'limestone');
    P.drown([-60, -6, 60, 6], -1.0, '!@FUTURE');
    P.E('FUTURE', () => {
      // the iced canal holds: a way across anywhere
      P.box([-60, -1.7, -6, 60, -1.4, 6], 'ice');
    });
    P.challenge('ice', [-60, -10, 60, 10], ['FUTURE', 'PRESENT'], null, { optional: true });
    for (const z of [-6.2, 6.2]) {
      railing(P, -60, z, -31, z, 1.0, 'ironDark');
      railing(P, -25, z, 23, z, 1.0, 'ironDark');
      railing(P, 29, z, 60, z, 1.0, 'ironDark');
    }
    bridge(P, -28, -7, -28, 7, 6, 0.05, 'limestone', { hump: 1.4, parapetMat: 'limestone' });
    bridge(P, 26, -7, 26, 7, 6, 0.05, 'limestone', { hump: 1.4, parapetMat: 'limestone' });
    P.land('canalBridge', 26, 1.4, 0, 0);
    for (let x = -54; x <= 54; x += 12) for (const z of [-12.5, 12.5]) {
      if (Math.abs(x - 26) < 4 || Math.abs(x + 28) < 4) continue;
      P.E(['PRESENT'], () => P.tree('plane', x, z, 1.2));
      P.E(['PAST'], () => P.tree('blossom', x, z, 1.0));
      P.E(['FUTURE'], () => P.tree('bareTree', x, z, 1.25));
    }
    for (let x = -48; x <= 48; x += 24) for (const z of [-7.4, 7.4]) prop(P, 'lampPost', x, z, z < 0 ? Math.PI / 2 : -Math.PI / 2, { color: 0xffc890 });
    // --- the rows of townhouses -----------------------------------------------------------------------------
    P.reserve(...H, 0.5);
    P.reserve(24, -34, 30, -16); // the lane beside the corner house
    const row = { floors: [4, 5], fh: 3.6, roof: 'gable', roofMat: 'slate', dormers: 2, chimney: true, cornice: 'limestone', minW: 7, maxW: 11, shop: { side: 'S', awning: 'awningGreen', color: 0xffc890 } };
    fill(P, [-60, -34, 8, -16], { ...row, along: 'x' });
    fill(P, [30, -34, 60, -16], { ...row, along: 'x' });
    fill(P, [-60, 16, -10, 34], { ...row, along: 'x', shop: { side: 'N', awning: 'awningRed', color: 0xffc890 } });
    fill(P, [-4, 16, 60, 34], { ...row, along: 'x', shop: { side: 'N', awning: 'awningBlue', color: 0xffc890 } });
    fill(P, [-60, -70, 60, -44], { ...row, along: 'x', shop: null, floors: [4, 6] });
    fill(P, [-60, 44, 60, 70], { ...row, along: 'x', shop: null, floors: [4, 6] });
    for (const [x, z] of [[-40, -39], [0, -39], [40, -39], [-30, 39], [20, 39]]) prop(P, 'lampPost', x, z, 0, { color: 0xffc890 });
    sign(P, 'E. MOLL - CLOCKS - REPAIRS', 16, 4.2, -15.7, 0, { size: 0.4, color: '#ffd9a0', boardMat: 'signGreen' });
    sign(P, 'BOOKS', -40, 3.8, -15.7, 0, { size: 0.36, color: '#ffe8c8', boardMat: 'signGreen' });
    sign(P, 'BAKERY', -16, 3.8, 15.7, Math.PI, { size: 0.36, color: '#ffe8c8', boardMat: 'signGreen' });
    sign(P, 'CANAL STREET', -6, 2.4, -6.9, Math.PI, { size: 0.3, color: '#e8f0e8', boardMat: 'signBlue' });
    // --- Ezra Moll's house: the shell, the floors round the light well, the scissor stair ---------------------
    const [hx0, hz0, hx1, hz1] = H;
    P.blocks.push([hx0, hz0, hx1, hz1]);
    // the cellar: the old water steps, and the stair up beside the west wall
    ground(P, [hx0, hz0, hx1, hz1], -4, 'flagstone', { depth: 0.4 });
    for (let i = 0; i < 4; i++) P.box([15 + i * 0.01, -4 - (i + 1) * 0.35, -31.6 + i * 1.2, 22, -4 - i * 0.35, -30.4 + i * 1.2], 'riverStone');
    P.plane(15, -31.6, 22, -26.8, -5.3, 'canalGreen', { noShadow: 1 });
    P.land('cellarStair', 9.8, -4, -30.6, 0);
    stair(P, 9.8, -30.6, -4, 9.8, -19.8, 0, 2.2, 'flagstone');
    // the floors: the shop floor (0) and the galleries (4, 8, 12, 16), the roof (20), each round the well
    const floors = [0, 4, 8, 12, 16, 20];
    floors.forEach((y, j) => {
      const holes = [WELL];
      if (j === 0) holes.push([8.6, -31, 11, -19.4]);
      else if (j === 4) holes.push([11.4, -31.6, 19, -29.4]); // (the clock room's floor: the servants' stair comes up here; the scissor stair stops below)
      else {
        const arrivedNorth = (j - 1) % 2 === 0;
        holes.push(arrivedNorth ? [STRIP[0], -29.6, STRIP[2], STRIP[3]] : [STRIP[0], STRIP[1], STRIP[2], -19]);
      }
      groundHoles(P, H, holes, y, j === 0 ? 'oakFloor' : j === 5 ? 'roofLead' : 'oakFloor', { depth: 0.3 });
      // the well's railings on the galleries
      if (j > 0 && j < 5) {
        railing(P, WELL[0], WELL[1], WELL[2], WELL[1], 1.0, 'brass', { y });
        railing(P, WELL[0], WELL[3], WELL[2], WELL[3], 1.0, 'brass', { y });
        railing(P, WELL[0], WELL[1], WELL[0], WELL[3], 1.0, 'brass', { y });
        railing(P, WELL[2], WELL[1], WELL[2], WELL[3], 1.0, 'brass', { y });
      }
    });
    // the hidden stair: the servants' stair from the third floor up to the clock room, along the north wall. In 2026
    // it stands; later it is bricked up and floored over, and the third floor's boards are worn in a path to the brick
    P.E('PAST', () => stair(P, 19, -30.5, 12, 11.4, -30.5, 16, 2.0, 'oakFloor'));
    P.E(['PRESENT', 'FUTURE'], () => {
      P.box([11.4, 15.7, -31.6, 19, 16, -29.4], 'oakFloor');
      P.box([11.4, 12, -29.3, 19, 15.7, -29.0], 'brickWall');
      P.box([19, 12, -31.6, 19.3, 15.7, -29.0], 'brickWall'); // (and its end: nobody walks in behind the brick)
    });
    P.land('hiddenStair', 15, 12, -29.6, Math.PI);
    P.land('floorboards', 15, 12, -28.6, 0);
    P.challenge('hiddenStair', [8, -32, 24, -16], ['PAST', 'PRESENT'], null, { optional: true });
    // the scissor stair, flights of 4 m in two lanes (north in the inner lane, south in the outer): up to the third
    // floor, and from the clock room on to the roof. Between the third floor and the clock room there is none: that
    // flight is the servants' stair's
    for (let k = 0; k < 5; k++) {
      if (k === 3) continue;
      const north = k % 2 === 0, lx = north ? 21.1 : 22.5;
      stair(P, lx, north ? -19 : -29.6, k * 4, lx, north ? -29.6 : -19, k * 4 + 4, 1.3, 'oakFloor');
    }
    P.land('galleryLanding', 21.8, 4, -30.3, 0);
    P.land('clockLanding', 21.8, 16, -18.3, Math.PI);
    // the shell: walls with windows on every floor, the shop door and windows on the canal street
    const band = (x0, z0, x1, z1, y, h, openings) => wall(P, x0, z0, x1, z1, h, 0.45, 'townhouseEzra', { y, openings });
    band(hx0, hz1, hx1, hz1, -4, 4, []);
    band(hx0, hz1, hx1, hz1, 0, 4, [[2, 5.4, 0.4, 3.4], [6, 10, 0, 3.4], [10.6, 14, 0.4, 3.4]]);
    for (let j = 1; j < 5; j++) band(hx0, hz1, hx1, hz1, j * 4, 4, j === 4 ? [[1.5, 4, 1, 3.2], [12, 14.5, 1, 3.2]] : [[1.5, 4, 1, 3.2], [6.8, 9.2, 1, 3.2], [12, 14.5, 1, 3.2]]);
    for (let j = 0; j < 6; j++) {
      const y = j * 4 - 4, open = j >= 1 ? [[2.5, 5, 1, 3.2], [10.5, 13, 1, 3.2]] : [];
      band(hx0, hz0, hx1, hz0, y, 4, open);
      band(hx0, hz0, hx0, hz1, y, 4, open);
      band(hx1, hz0, hx1, hz1, y, 4, open);
    }
    // the shop windows: three clock faces (2026 morning, 2049 evening, 2196 noon)
    P.land('shopWindows', 12, 1.8, -15.6, 0);
    for (const [x, h] of [[9.7, 2.1], [12.2, 6.6], [20.3, 0.4]]) {
      P.cyl(x, 1.9, -15.75, 0.55, 0.06, 'clockFaceWhite', { rx: Math.PI / 2, seg: 20 });
      P.obox(x, 1.9, -15.7, 0.05, 0.42, 0.02, 0, 'ironDark', { rz: (h / 12) * Math.PI * 2 });
    }
    // the door, the shopfront glass
    P.vbox([hx0 + 2, 0.4, hz1 - 0.05, hx0 + 5.4, 3.4, hz1 + 0.02], 'glass');
    P.col([hx0 + 2, 0.4, hz1 - 0.2, hx0 + 5.4, 3.4, hz1 + 0.2]);
    P.vbox([hx0 + 10.6, 0.4, hz1 - 0.05, hx0 + 14, 3.4, hz1 + 0.02], 'glass');
    P.col([hx0 + 10.6, 0.4, hz1 - 0.2, hx0 + 14, 3.4, hz1 + 0.2]);
    // upper windows glazed (nobody steps out of a gallery)
    for (let j = 1; j < 6; j++) P.col([hx0, j * 4 - 4 + 1, hz0 - 0.3, hx1, j * 4 - 4 + 3.2, hz0 + 0.3]);
    // the roof terrace (20), its parapet; the lantern over the well; the clock tower and its 6 m face
    for (const [x0, z0, x1, z1] of [[hx0, hz0, hx1, hz0 + 0.3], [hx0, hz0, hx0 + 0.3, hz1], [hx1 - 0.3, hz0, hx1, hz1]]) P.box([x0, 20, z0, x1, 21.1, z1], 'townhouseEzra');
    P.land('roofTerrace', 13, 20, -28, Math.PI);
    P.E(['PRESENT', 'PAST'], () => {
      P.hip(16, 20, -24, 7, 7, 2.6, 0, 'lanternGlass');
      P.col([WELL[0], 20, WELL[1], WELL[2], 20.2, WELL[3]]);
    });
    P.E('FUTURE', () => {
      for (let i = 0; i < 4; i++) P.obox(14 + i * 1.3, 20, -24, 0.12, 2.2, 6.4, 0, 'ironDark', { rz: 0.4 - i * 0.25 });
      for (let i = 0; i < 6; i++) P.vbox([13.4 + i, 9 + i, -26.6, 13.6 + i, 20, -26.4], 'ivy', { noShadow: 1 });
    });
    P.land('lightWell', 16, 0, -24, 0);
    P.land('galleries', 10.4, 8, -24, Math.PI / 2);
    P.land('ezraBench', 10.6, 8, -18.6, Math.PI / 2);
    P.box([9, 8, -19.4, 10.2, 8.5, -17.6], 'oakFloor');
    P.box([8.6, 8, -19.4, 9, 9.2, -17.6], 'oakFloor');
    P.land('clockRoom', 12.6, 16, -18.6, 0);
    P.land('clock2026', 10, 17.6, -31.4, 0);
    P.land('clock2049', 16, 17.6, -31.4, 0);
    P.land('clock2196', 22, 17.6, -31.4, 0);
    for (const x of [10, 16]) P.cyl(x, 17.6, -31.7, 0.8, 0.12, 'brass', { rx: Math.PI / 2, seg: 18 });
    P.land('recordingCase', 9.2, 16, -26, Math.PI / 2);
    P.box([8.6, 16, -27, 9.6, 17.4, -25], 'clockCaseWood');
    P.land('shopFloor', 12.4, 0, -18.4, 0);
    P.land('repeatArm', 16, 0.75, -24, 0);
    P.hazards.push({ kind: 'sweeper', radius: 7.2, speed: 1.1, phase: 0.6, pivot: [16, 0.75, -24], room: P.rid, lvKit: 'brassArm', stillIn: 'FUTURE' });
    P.E('FUTURE', () => P.obox(16, 0.5, -24, 14, 0.3, 0.6, 0, 'rust', { solid: true }));
    // the clock tower over the front, the 6 m face on the canal street
    P.box([11, 20, -20, 21, 27, -16.6], 'townhouseEzra');
    P.hip(16, 27, -18.3, 11, 4.6, 3, 0, 'slate');
    P.land('clockFace', 16, 23.5, -16.3, 0);
    P.cyl(16, 23.5, -16.5, 3, 0.3, 'clockFaceWhite', { rx: Math.PI / 2, seg: 32 });
    P.torus(16, 23.5, -16.4, 3.05, 0.18, 'brass', { seg: 40 });
    P.obox(16, 23.5, -16.25, 0.22, 2.3, 0.08, 0, 'ironDark', { rz: -2.2 });
    P.obox(16, 23.5, -16.22, 0.16, 2.8, 0.08, 0, 'ironDark', { rz: 0.5 });
    P.land('loopSpring', 20.5, 20, -29.5, 0);
    P.E('FUTURE', () => P.torus(20.5, 20.6, -29.5, 0.7, 0.12, 'rust', { rx: Math.PI / 2, seg: 16 }));
    // --- the years in the street ---------------------------------------------------------------------------
    P.E('PAST', () => {
      for (let i = 0; i < 6; i++) prop(P, 'stall', -46 + i * 9, 10.5, Math.PI, { awning: i % 2 ? 'awningRed' : 'awningGreen', goods: i % 3 ? 'produce' : 'flowersStall' });
      for (const [x, z] of [[-36, -26], [40, 24]]) {
        for (const dx of [-3, 0, 3]) P.vbox([x + dx - 0.07, 0, z - 9.6, x + dx + 0.07, 14, z - 9.4], 'scaffold', { noShadow: 1 });
        for (const y of [4.5, 9]) P.vbox([x - 3.4, y, z - 10, x + 3.4, y + 0.12, z - 9.2], 'scaffold');
      }
      for (const [x, z, ry] of [[-10, 0, 1.6], [40, -1, 1.5]]) prop(P, 'boat', x, z, ry, { y: -1.45 });
    });
    P.E('FUTURE', () => {
      for (const [x0, z0, x1, z1] of [[-60, -16, 60, -6.4], [-60, 6.4, 60, 16]]) P.plane(x0, z0, x1, z1, 0.03, 'snow', { noShadow: 1 });
      for (let i = 0; i < 10; i++) P.vbox([-58 + i * 12, 0, P.rng.pick([-14, 14]) - 0.6, -56 + i * 12, 0.5, P.rng.pick([-14, 14]) + 0.6], 'snow', { prop: 1 });
      for (const [x, z] of [[-30, -25], [0, 25], [36, 25], [-48, 25]]) P.vbox([x - 0.6, 3, z - 9.1, x + 0.6, 4.6, z - 8.9], 'windowWarm', { noShadow: 1 });
    });
    P.E('PRESENT', () => {
      for (const [x, z] of [[-20, -10], [8, 11], [-44, 12], [34, -11]]) P.plane(x - 1.5, z - 1, x + 1.5, z + 1, 0.02, 'leaves', { noShadow: 1, prop: 1 });
      for (const [x, z, ry] of [[-34, -11, 0.2], [44, 11, Math.PI]]) prop(P, 'bench', x, z, ry);
    });
    void terrace;
    void glyphs;
    void block;
  },
};
