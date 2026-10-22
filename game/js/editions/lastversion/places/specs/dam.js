// The dam on the upper gorge (Mission 10, ENEMIES WHO REMEMBER; OVERHAUL.md §5 M10, D3). The Continuum's
// detention block inside the hydroelectric dam that closes the upper gorge, with the snow-capped Notch
// standing directly above it. The downstream face drops in benches: the crest (24 m) with its
// watchtowers and the reservoir behind; the crown bench (12 m) with the switch rooms; the long open-air
// gallery (0 m) with the cells cut into the face and the floodlit yard on the turbine hall's roof; the
// turbine hall itself (-12 m) with its tall windows onto the gorge; the gorge floor and the river, where
// Sera's skiff waits. 2049: night and falling snow, sodium and cold LED striping the face, spillway mist,
// the moonlit Notch. 2026: the dam under refurbishment at dusk: scaffold stairs up the face, workers'
// cabins, warm work lights, no prison (the cells are store bays), and so the routes differ.
//   Q0 THE DETENTION BLOCK  the gallery and its cells (z -24 .. 0, y 0)
//   Q1 POWER SYSTEMS        the crown bench and the crest (z -60 .. -24)
//   Q2 THE TESTING CHAMBER  the turbine hall (z 0 .. 30, y -12)
//   Q3 THE YARD             the gorge floor (z 30 .. 60, y -12)
import { ground, groundHoles, stair, water, railing, prop, sign, canopy } from '../archetypes.js';

const CREST = 24, CROWN = 12, HALL = -12;
const CELLS = [-54, -44, -34, -24, 12, 22, 32, 42, 52]; // the cells' centres along the face (x)

export default {
  key: 'dam', style: 'dam', sameAs: null, name: 'THE DAM',
  bounds: [-90, -60, 90, 60],
  edges: { N: 'water', E: 'cliff', W: 'cliff', S: 'cliff' },
  killY: -13,
  primary: 'crestYard',
  backdrop: { notch: 'near', gorge: true },
  years: {
    PRESENT: { sky: 'snowNight', era: '2049', hour: 23.2, sun: { elev: 34, az: 30 }, fog: 0x1c2638, density: 1.3, night: 0.75, weather: 'frost', ibl: 'night', lit: 1,
      hemi: { sky: 0x2a3a54, ground: 0x10161e, k: 0.7 }, sunColor: 0xa8c0e8, sunK: 0.35, grade: { shadowTint: 0x101c3a, highlightTint: 0xffd8a0, toning: 0.22, contrast: 1.14, saturation: 0.9 } },
    PAST: { sky: 'damDusk', era: '2026', hour: 19.1, sun: { elev: 2, az: 255 }, fog: 0x6a5a6a, density: 1.0, night: 0.4, weather: 'motes', ibl: 'dusk', lit: 0.8,
      hemi: { sky: 0xb08a8a, ground: 0x2a2630, k: 0.8 }, sunColor: 0xff9a5a, sunK: 0.8, grade: { shadowTint: 0x2a1c34, highlightTint: 0xffc890, toning: 0.24, contrast: 1.1, saturation: 1.02 } },
  },
  quarters: [
    // (U7: Kai wakes in his cell, its bars bent open: out of the gallery patrol's sight until he steps out)
    { name: 'THE DETENTION BLOCK', area: [-70, -24, 70, 0], spawn: [-24, 0, -19.5, Math.PI], threshold: { at: 'gallStair', kind: 'stair' } },
    { name: 'POWER SYSTEMS', area: [-70, -60, 70, -24], spawnAt: 'crownLanding', threshold: { at: 'hallStair', kind: 'stair' } },
    { name: 'THE TESTING CHAMBER', area: [-60, 0, 60, 30], spawnAt: 'turbineHall', threshold: { at: 'spillwayTunnel', kind: 'tunnel' } },
    { name: 'THE YARD', area: [-70, 30, 70, 60], spawnAt: 'gorgeFloor', threshold: null },
  ],
  beatAt: { m10: ['guardPost', 'switch2049', 'loopCells'] },
  exits: { m10: 'seraSkiff' },
  frags: { m10: [['cellWall', 'intakeRecords', 'floodPole'], ['switch2026', 'directorOffice', 'crestParapet']] },
  // the guards walk the gallery and the yard on the turbine hall's roof
  watch: { m10: [
    [[[-60, -10], [60, -10]], [[-20, 6], [20, 6], [20, 20], [-20, 20]]],
    [[[-50, -4], [50, -4], [50, 12], [-50, 12]], [[0, 24], [40, 24]]],
    [],
  ] },
  crowd: [
    { era: 'present', years: ['PRESENT'], region: 'dam', role: 'prisoner', path: [[-30, 12], [-30, 24], [-16, 24]], y: HALL, n: 6 },
    { era: 'present', years: ['PAST'], region: 'dam', role: 'builder', path: [[-40, -6], [40, -6]], n: 4 },
  ],

  build(P) {
    // --- the gorge floor, the river, the cliffs on both sides ------------------------------------------------------
    ground(P, [-70, 30, 70, 60], HALL, 'gravel');
    water(P, [-70, 42, 70, 54], HALL - 0.4, 'reservoirWater', { depth: 2 });
    P.drown([-70, 42, 70, 54], HALL - 0.9);
    P.vbox([-70, HALL - 0.9, 41.6, 70, HALL + 0.05, 42.2], 'damConcrete');
    for (const x0 of [-90, 70]) {
      for (let z = -60; z < 60; z += 12) {
        const h = CREST + 6 + P.rng.float(-2, 8);
        P.box([x0, HALL - 2, z, x0 + 20, h, z + 12], 'cliffRock');
        P.obox(x0 + 10 + P.rng.float(-2, 2), h - 2, z + 6, 22, P.rng.float(3, 5), 13, P.rng.float(-0.2, 0.2), 'snowRock', { rx: P.rng.float(-0.15, 0.15), rz: P.rng.float(-0.2, 0.2) });
      }
    }
    for (const [x, z] of [[-66, 36], [-62, 58], [64, 34], [60, 58], [-50, 58], [52, 56]]) P.tree('pine', x, z, P.rng.float(1.1, 1.5), { y: HALL });
    P.land('gorgeFloor', 0, HALL, 36, Math.PI);
    P.land('seraSkiff', 26, HALL, 39, Math.PI / 2);
    P.obox(26, HALL - 0.2, 46, 2.2, 0.7, 6.2, 0.3, 'pontoonWood');
    P.box([22, HALL - 0.5, 38, 30, HALL + 0.1, 43], 'quayTimber');
    // --- the turbine hall at the foot (-12 m), its roof the gallery's yard (0 m) --------------------------------------
    const HZ0 = -6, HZ1 = 30;
    ground(P, [-60, HZ0, 60, HZ1], HALL, 'damConcrete');
    // the hall's walls: the south wall is 15 m of windows onto the gorge, with a door to the yard below
    P.box([-60, HALL, HZ0, -58, 0, HZ1], 'damConcrete');
    P.box([58, HALL, HZ0, 60, 0, -2], 'damConcrete');
    P.box([58, HALL + 8, -2, 60, 0, 10], 'damConcrete');
    P.box([58, HALL, 10, 60, 0, HZ1], 'damConcrete');
    // the dam's mass under the gallery, and beside the hall
    P.box([-70, HALL - 2, -42, 70, -0.6, HZ0], 'damConcrete');
    P.box([-70, HALL - 2, HZ0, -60, -0.6, 30], 'damConcrete');
    P.box([60, HALL - 2, HZ0, 70, HALL, 30], 'damConcrete');
    P.box([60, HALL + 9, HZ0, 70, -0.6, 30], 'damConcrete');
    P.box([60, HALL, 10.4, 70, HALL + 9, 30], 'damConcrete');
    P.box([60, HALL, HZ0, 70, HALL + 9, -2.4], 'damConcrete');
    for (let x = -58; x < 58; x += 8) {
      P.box([x, HALL, HZ1 - 1, x + 1.2, 0, HZ1], 'damConcrete');
      if (Math.abs(x + 4) > 3) P.vbox([x + 1.2, HALL + 1, HZ1 - 0.6, x + 8, -1, HZ1 - 0.5], 'glass', { noShadow: 1 });
    }
    P.col([-58, HALL, HZ1 - 1, -4, HALL + 1, HZ1]);
    P.col([4, HALL, HZ1 - 1, 58, HALL + 1, HZ1]);
    for (let x = -58; x < 58; x += 8) if (Math.abs(x + 4) > 3) P.col([x + 1.2, HALL + 1, HZ1 - 0.8, x + 8, -1, HZ1 - 0.4]);
    P.box([-58, -1, HZ1 - 1, 58, 0, HZ1], 'damConcrete');
    // the turbines, the projector, the loop cells
    P.land('turbineHall', 0, HALL, 4, Math.PI);
    for (const x of [-40, -20, 20, 40]) {
      P.cyl(x, HALL, 12, 4.2, 3.4, 'turbineGreen', { seg: 20, solid: true });
      P.cyl(x, HALL + 3.4, 12, 2.4, 2.2, 'steel', { seg: 16 });
    }
    P.land('projector', 0, HALL, 14, Math.PI);
    P.box([-1.4, HALL, 12.6, 1.4, HALL + 1.2, 15.4], 'gratingSteel');
    P.cyl(0, HALL + 1.2, 14, 0.9, 1.6, 'cellBars', { seg: 12, rx: 0.4 });
    P.land('loopCells', -30, HALL, 24, 0);
    for (let i = 0; i < 6; i++) {
      const x = -48 + i * 6.4;
      P.vbox([x - 2.6, HALL, 21, x + 2.6, HALL + 3, 21.08], 'glass', { noShadow: 1 });
      P.box([x - 2.7, HALL, 21, x - 2.5, HALL + 3, 27], 'cellBars');
      P.disc(x, HALL + 0.02, 24, 1.8, 'stormGlow', { noShadow: 1 });
    }
    P.land('spillwayTunnel', 54, HALL, 4, -Math.PI / 2);
    P.box([60, HALL, -2, 70, HALL + 0.1, 10], 'damConcrete');
    P.vbox([66, HALL + 0.05, -2, 70, HALL + 7, 10], 'spillwayFoam', { noShadow: 1 });
    for (const x of [-40, 0, 40]) { P.vbox([x - 3, -0.6, 8, x + 3, -0.4, 20], 'lightPanel', { noShadow: 1 }); P.glow(x, HALL + 0.02, 14, 6, 0xdce8ff); }
    // --- the gallery (0 m): the roof of the hall and the bench along the face; the stairwell down into the hall -------
    groundHoles(P, [-70, -16, 70, 30], [[-38.5, 1, -33.5, 23]], 0, 'damConcrete', { depth: 0.6 });
    stair(P, -36, 2, 0, -36, 22, HALL, 4, 'gratingSteel', { rail: 'steel' });
    P.land('hallStair', -36, 0, 0, Math.PI);
    railing(P, -70, 29.7, 70, 29.7, 1.2, 'steel');
    for (const [x0, x1] of [[-39, -39], [-33, -33]]) railing(P, x0, 1, x1, 23, 1.1, 'steel');
    railing(P, -39, 23, -33, 23, 1.1, 'steel');
    // the face: from the gallery up to the crown bench, with the cells cut into it
    const FZ = -16;
    let x = -70;
    for (const cx of [...CELLS, 80]) {
      const a = Math.min(cx - 3.2, 70);
      if (a > x) P.box([x, 0, FZ - 8, a, CROWN, FZ], 'damConcrete');
      if (cx > 70) break;
      P.box([cx - 3.2, 3.4, FZ - 8, cx + 3.2, CROWN, FZ], 'damConcrete');
      P.box([cx - 3.2, 0, FZ - 8, cx + 3.2, 3.4, FZ - 6], 'damConcrete');
      P.vbox([cx - 3.2, 0.01, FZ - 6, cx + 3.2, 0.03, FZ], 'yardConcrete', { noShadow: 1 });
      x = cx + 3.2;
    }
    P.land('cell', CELLS[3], 0, FZ - 3, 0);
    P.land('cellWall', CELLS[3], 0, FZ - 5.6, 0); // (the back wall of Kai's own cell: the next cell's front is the gallery stair)
    // the cells' bars (2049; in 2026 these are store bays with roller doors open)
    P.E('PRESENT', () => {
      for (const cx of CELLS) {
        if (cx === CELLS[3]) { P.vbox([cx - 3.2, 0, FZ - 0.2, cx - 1.6, 3.4, FZ], 'cellBars'); continue; } // Kai's cell, its bars bent open
        for (let k = 0; k < 9; k++) P.vbox([cx - 3 + k * 0.75, 0, FZ - 0.12, cx - 2.92 + k * 0.75, 3.4, FZ - 0.04], 'cellBars', { noShadow: 1 });
        P.col([cx - 3.2, 0, FZ - 0.2, cx + 3.2, 3.4, FZ]);
      }
    });
    P.E('PAST', () => {
      for (const cx of CELLS) { P.vbox([cx - 3.2, 2.6, FZ - 0.4, cx + 3.2, 3.4, FZ], 'containerGrey'); prop(P, 'crate', cx - 1.2, FZ - 4, 0.2); }
      // the scaffold stair up the face to the crown bench, east: in 2026 there is another way up
      stair(P, 12, -14.2, 0, 32.4, -14.2, CROWN, 2.2, 'scaffold');
      P.box([32, CROWN - 0.4, -16, 38, CROWN, -13], 'scaffold');
      for (const sx of [12, 18, 24, 30, 36]) P.box([sx - 0.08, 0, -12.9, sx + 0.08, CROWN + 3, -12.7], 'scaffold', { solid: false });
    });
    P.land('guardPost', 2, 0, -8, Math.PI);
    P.land('galleries', 16, 0, -10, Math.PI); // the inspection gallery along the face, east of the guard post
    P.box([-1, 0, -12.5, 5, 2.8, -10.5], 'cellBars');
    P.box([-1.2, 2.8, -12.7, 5.2, 3, -10.3], 'gratingSteel');
    P.land('intakeRecords', -12, 0, -13, 0);
    P.land('floodPole', 30, 0, 18, 0);
    // floodlights on the yard: sodium and cold LED in 2049, warm work lights in 2026
    for (const [fx, fz] of [[-56, 26], [-20, 26], [20, 26], [56, 26], [-56, -4], [56, -4]]) {
      P.cyl(fx, 0, fz, 0.12, 8, 'steel', { seg: 6, solid: true });
      P.E('PRESENT', () => { P.obox(fx, 8, fz, 1.6, 0.6, 0.6, 0, fx < 0 ? 'sodiumGlow' : 'ledGlow'); P.glow(fx, 0.02, fz - 4, 7, fx < 0 ? 0xffc44a : 0xdce8ff); });
      P.E('PAST', () => { P.obox(fx, 8, fz, 0.9, 0.5, 0.5, 0, 'lampGlow'); P.glow(fx, 0.02, fz - 3, 5, 0xffb070); });
    }
    P.E('PAST', () => {
      for (const [x, z, r] of [[-50, 10, 0], [-30, 8, 0.1], [30, 8, -0.1], [48, 14, 0], [0, 22, Math.PI / 2], [-10, -6, 0]]) prop(P, 'siteHut', x, z, r);
      for (const [x, z] of [[-44, 18], [36, 20], [14, -2]]) prop(P, 'tarp', x, z, 0.3, { w: 5, d: 4 });
    });
    P.E('PRESENT', () => {
      for (const [x, z] of [[-30, 14], [30, 14], [0, 2]]) { P.box([x - 3, 0, z - 2, x + 3, 0.9, z + 2], 'sandbag'); }
      sign(P, 'CONTINUUM DETENTION · LEVEL 0', 0, 3.8, FZ + 0.05, 0, { size: 0.42, color: '#ffc44a' });
    });
    P.challenge('drones', [-70, -16, 70, 30], ['PRESENT', 'PAST'], null);
    // --- the crown bench (12 m): the switch rooms; the stairs up from the gallery and on to the crest ----------------
    P.box([-70, CROWN - 0.6, -24, 70, CROWN, FZ], 'gratingSteel');
    P.setTerrain(-70, -24, 70, FZ, CROWN);
    railing(P, -70, FZ + 0.2, 70, FZ + 0.2, 1.1, 'steel', { y: CROWN, openings: [[14, 22], [100, 110]] });
    // up from the gallery: a stair along the face, west
    stair(P, -28, -14.5, 0, -48.4, -14.5, CROWN, 2.6, 'gratingSteel', { rail: 'steel' });
    P.box([-56, CROWN - 0.6, FZ, -48, CROWN, -13], 'gratingSteel');
    P.land('gallStair', -26, 0, -14.5, -Math.PI / 2);
    P.land('crownLanding', -40, CROWN, -20, Math.PI / 2);
    P.land('switch2049', -8, CROWN, -21, Math.PI);
    P.land('switch2026', 18, CROWN, -21, Math.PI);
    P.box([-14, CROWN, -24, -2, CROWN + 3.4, -22.6], 'damConcrete');
    P.box([12, CROWN, -24, 24, CROWN + 3.4, -22.6], 'damConcrete');
    P.E('PRESENT', () => prop(P, 'chiller', -8, -23, 0, { y: CROWN }));
    P.E('PAST', () => prop(P, 'chiller', 18, -23, 0, { y: CROWN }));
    // the face from the crown bench up to the crest
    P.box([-70, CROWN, -42, 70, CREST, -24], 'damConcrete');
    // on to the crest: a stair along the face, east
    stair(P, 30, -21.5, CROWN, 50.4, -21.5, CREST, 2.6, 'gratingSteel', { rail: 'steel' });
    P.box([50, CREST - 0.6, -25, 58, CREST, -19], 'gratingSteel');
    // --- the crest (24 m): the road, the yard, the watchtowers, the Director's office; the reservoir behind ----------
    P.setTerrain(-70, -42, 70, -24, CREST);
    P.plane(-70, -42, 70, -24, CREST + 0.02, 'yardConcrete', { noShadow: 1 });
    P.land('crestYard', 0, CREST, -33, 0);
    P.land('crestParapet', -30, CREST, -26, Math.PI);
    railing(P, -70, -24.2, 50, -24.2, 1.1, 'damConcrete', { y: CREST });
    railing(P, -70, -41.8, 70, -41.8, 1.1, 'damConcrete', { y: CREST });
    P.land('directorOffice', 40, CREST, -36, -Math.PI / 2);
    P.box([44, CREST, -40, 62, CREST + 4, -28], 'damConcrete');
    P.vbox([43.9, CREST + 1, -38, 44, CREST + 3, -30], 'windowWarm');
    P.E('PRESENT', () => {
      for (const tx of [-50, -10, 26]) {
        for (const [dx, dz] of [[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]]) P.cyl(tx + dx, CREST, -33 + dz, 0.15, 7, 'steel', { seg: 6, solid: true });
        P.box([tx - 2.2, CREST + 7, -35.2, tx + 2.2, CREST + 9.4, -30.8], 'damConcrete', { solid: false });
        P.vbox([tx - 2.3, CREST + 7.8, -35.3, tx + 2.3, CREST + 8.8, -30.7], 'ledGlow');
      }
      sign(P, 'CONTINUUM · TIME MUST BE CONTROLLED', -20, CREST + 2.2, -41.6, 0, { size: 0.5, color: '#c8d4e8' });
    });
    P.E('PAST', () => {
      crane(P);
      for (let i = 0; i < 5; i++) prop(P, 'floodlight', -50 + i * 22, -26, 0, { y: CREST });
    });
    // the reservoir upstream, just below the crest
    water(P, [-70, -60, 70, -42], CREST - 3, 'reservoirWater', { depth: 4 });
    P.drown([-70, -60, 70, -42], CREST - 3.5);
    P.vbox([-70, CREST - 3.6, -42.3, 70, CREST, -42], 'damConcrete');
    // the Notch stands over the gorge to the north; the spillway's mist rises east
    P.E('PRESENT', () => { for (let i = 0; i < 4; i++) P.cone(64, HALL, 6 + i * 6, 3, 18 + i * 4, 'spillwayFoam', { noShadow: 1, seg: 8 }); });

    // 2026: a tower crane on the crest
    function crane(P) {
      P.obox(-30, CREST, -36, 1.4, 22, 1.4, 0, 'craneYellow', { solid: true });
      P.obox(-30, CREST + 22, -24, 1.0, 1.0, 34, 0, 'craneYellow');
      P.obox(-30, CREST + 22, -44, 1.2, 1.2, 10, 0, 'craneYellow');
      P.obox(-30, CREST + 20.6, -46, 2.2, 1.6, 2.4, 0, 'concrete');
    }
    void canopy;
  },
};
