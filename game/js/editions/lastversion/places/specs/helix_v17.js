// Helix in VERSION 17 (Mission 8, THE FIRST DEATH; OVERHAUL.md §5 M8). The same campus on the same
// hill (sameAs helix), altered: a full ring of wings instead of the crescent, and the river running
// straight through the court as a water garden with stepping stones: the river Kai drained three
// thousand years ago (Mission 5), its bed the dig the ring came out of (Mission 3's Site Zero), led
// back into that bed by this version's Helix once the ring was out (a plaque on the north quay says
// so, so Rook's "a riverbed somebody drained" in Mission 8 is a clue here, not a contradiction). The old west wing with its lobby is gone; the staff come in through a
// glass atrium on the riverbank where the river enters the ring. The oculus is capped by a glass
// containment cube. A still, grey-violet pre-storm afternoon: no wind, no birds, the flags hang.
// 2026 (this version): the ring just finished, a young garden, the junior programme's marquee.
//   Q0 STAFF RECORDS        the west half: the riverside atrium, the river court, the north loggia
//   Q1 THE CORRUPTED LOG    the east wing: the server room, the security balcony, Rook's office
//   Q2 THE LAST TEN MINUTES the south court: the containment cube, the reconstruction
import { ground, groundHoles, terrace, stair, water, railing, block, prop, sign, canopy, colonnade, bridge, wall } from '../archetypes.js';

const WING_H = 13.5;
const RIVER = [-6, 6]; // the channel's z extent; it runs west to east through the whole place

export default {
  key: 'helix_v17', style: 'helix', sameAs: 'helix', name: 'HELIX (VERSION 17)',
  bounds: [-70, -90, 70, 70],
  edges: { N: 'hill', E: 'water', W: 'water', S: 'cliff' },
  killY: -3.5,
  primary: 'containmentCube',
  backdrop: { notch: 'clear', skyline: 'rain2049' },
  years: {
    PRESENT: { sky: 'stillViolet', era: 'v17', hour: 15.4, sun: { elev: 24, az: 228 }, fog: 0xb8b4c4, density: 1.2, night: 0.08, weather: null, ibl: 'dusk', lit: 0.3,
      hemi: { sky: 0xc8c4d0, ground: 0x6a6870, k: 0.85 }, sunColor: 0xe8e0f0, sunK: 0.6, grade: { shadowTint: 0x2a2a3a, highlightTint: 0xf0ecf8, toning: 0.16, contrast: 1.04, saturation: 0.78 } },
    PAST: { sky: 'warmGarden', era: '2026', hour: 11.6, sun: { elev: 52, az: 160 }, fog: 0xe8dcc8, density: 0.9, night: 0, weather: 'pollen', ibl: 'plant', lit: 0,
      hemi: { sky: 0xf0dcc0, ground: 0x8a8060, k: 0.95 }, sunColor: 0xffe2b0, sunK: 1.15, grade: { shadowTint: 0x3a2a1a, highlightTint: 0xfff0d8, toning: 0.14, contrast: 1.06, saturation: 1.0 } },
  },
  quarters: [
    { name: 'STAFF RECORDS', area: [-70, -90, 0, 0], spawnAt: 'atriumDoors', threshold: { at: 'staffDoor', kind: 'door' } },
    { name: 'THE CORRUPTED LOG', area: [0, -90, 70, 0], spawnAt: 'eastArcade', threshold: { at: 'rookOffice', kind: 'stair' } },
    { name: 'THE LAST TEN MINUTES', area: [-70, 0, 70, 70], spawnAt: 'southBridge', threshold: { at: 'versionTerminal', kind: 'terminal' } },
  ],
  beatAt: { m08: ['recordsTerminal', 'serverRoom2026', 'containmentCube'] },
  exits: { m08: 'versionTerminal' },
  frags: { m08: [['printCase', 'photoWall', 'groupPhoto'], ['securityOffice', 'riverWall', 'rookOffice'], ['reconstruction', 'riverCourt', 'southBridge']] },
  // (U7 review) at the lockdown the island has a drone of its own in 2049, round the cube on its terrace (past the
  // version terminal): Kai, sealed in the cube, can watch it go round before he steps into 2026 and out
  watch: { m08: [[], [[[18, -30], [30, -30], [30, -14], [18, -14]]], [[[-20, 22], [20, 22], [20, 30], [-20, 30]],
    { y: 0.4, when: '@PRESENT && lin_gone && !version_17', path: [[-10.5, 10.5], [10.5, 10.5], [10.5, -10.5], [-10.5, -10.5]] }]] },
  crowd: [
    // (their own words in this version, U7 review: not the storm night's lockdown)
    { era: 'present', years: ['PRESENT', 'PAST'], region: 'helix', role: 'researcher', path: [[-33, -32], [27, -32]], n: 4,
      barks: ['The court floods every spring. Always has.'] },
    { era: 'present', years: ['PRESENT', 'PAST'], region: 'helix', role: 'technician', path: [[30, -16], [30, 24]], n: 3, // (over the east bridge, not the river)
      barks: ['Rack nine is a second behind.'] },
  ],

  build(P) {
    // --- the ground: the court and its apron, the river channel cut through it --------------------------
    const POND = [-20, -18, 20, 18];
    groundHoles(P, [-70, -90, 70, 70], [[-70, RIVER[0], 70, RIVER[1]], POND], 0, 'stoneWet');
    water(P, [-70, RIVER[0], 70, RIVER[1]], -0.9, 'riverWater', { depth: 1.6, bedMat: 'riverBed' });
    water(P, POND, -0.9, 'riverWater', { depth: 1.6, bedMat: 'riverBed' });
    P.drown([-70, RIVER[0], 70, RIVER[1]], -1.3);
    P.drown(POND, -1.3);
    for (const [x0, x1] of [[-70, POND[0]], [POND[2], 70]]) for (const z of [RIVER[0] - 0.3, RIVER[1]]) P.box([x0, -2.6, z, x1, 0.05, z + 0.3], 'quayStone');
    for (const z of [POND[1] - 0.3, POND[3]]) P.box([POND[0], -2.6, z, POND[2], 0.05, z + 0.3], 'quayStone');
    for (const x of [POND[0] - 0.3, POND[2]]) for (const [z0, z1] of [[POND[1], RIVER[0]], [RIVER[1], POND[3]]]) P.box([x, -2.6, z0, x + 0.3, 0.05, z1], 'quayStone');
    P.E('PRESENT', () => P.disc(0, 0.012, 36, 15, 'courtStone', { seg: 40, noShadow: 1 }));
    P.E('PAST', () => P.disc(0, 0.012, 36, 15, 'gravel', { seg: 40, noShadow: 1 }));
    P.E('PRESENT', () => P.disc(0, 0.012, -36, 15, 'courtStone', { seg: 40, noShadow: 1 }));
    P.E('PAST', () => P.disc(0, 0.012, -36, 15, 'gravel', { seg: 40, noShadow: 1 }));
    // --- the court's water garden: the river widens into a pool round the island with the cube on it -----------
    P.land('riverCourt', -14, 0, -20, Math.PI);
    // the quay's plaque, facing the north walk: the river was drained, dug, and given back its bed
    P.box([-12.2, 0, -19.9, -7.8, 0.55, -19.5], 'quayStone');
    P.obox(-10, 0.55, -19.69, 4.2, 1.35, 0.08, Math.PI, 'signBoard');
    P.text('THE RIVER GARDEN', [-10, 1.6, -19.78], Math.PI, { size: 0.3, color: '#f4ead8' });
    P.text('THE OLD RIVER, DRAINED THREE THOUSAND YEARS AGO,', [-10, 1.15, -19.78], Math.PI, { size: 0.13, color: '#f4ead8' });
    P.text('LED BACK INTO ITS BED WHEN THE RING WAS DUG OUT', [-10, 0.92, -19.78], Math.PI, { size: 0.13, color: '#f4ead8' });
    terrace(P, [-12, -12, 12, 12], 0.4, 'courtStone', { wall: 'quayStone', base: -2.6 });
    P.reserve(...POND);
    // stepping stones from the north and south banks to the island, and the bridges at the wing arches
    for (const sz of [-1, 1]) for (const [z, x] of [[17.0, -0.3], [15.6, 0.4], [14.2, -0.2], [12.8, 0.3]]) P.cyl(x, -1.0, sz * z, 0.8, 1.15, 'riverStone', { seg: 10, solid: true });
    for (const x of [-30, 30]) bridge(P, x, -6.6, x, 6.6, 4, 0.2, 'quayStone', { parapetMat: 'steel', parapetH: 1.0 });
    P.land('southBridge', 30, 0.2, 12, 0);
    for (const z of [-6.4, 6.4]) for (const [x0, x1] of [[-70, -32], [-28, POND[0]], [POND[2], 28], [32, 70]]) railing(P, x0, z, x1, z, 1.0, 'steel');
    for (const z of [POND[1] - 0.2, POND[3] + 0.2]) for (const [x0, x1] of [[POND[0], -2.4], [2.4, POND[2]]]) railing(P, x0, z, x1, z, 1.0, 'steel');
    for (const x of [POND[0] - 0.2, POND[2] + 0.2]) for (const [z0, z1] of [[POND[1], RIVER[0]], [RIVER[1], POND[3]]]) railing(P, x, z0, x, z1, 1.0, 'steel');
    // --- the containment cube over the oculus (2049); in 2026 the lens is open, roped off ------------------------
    P.land('containmentCube', 0, 0.4, 10.4, 0);
    P.land('reconstruction', -10.2, 0.4, -2, Math.PI / 2);
    P.land('versionTerminal', 5, 0.4, 11.4, 0);
    P.E('PRESENT', () => {
      // (U7 review) the glass has a door in its south face (x -1.4 .. 1.4, 3 m high), open while Lin is inside: Kai goes in
      // to her, and the breach (lin_gone) seals it behind him. In 2049 the cube holds; 2026 has no cube, only the lens
      for (const b of [[-8, 0.4, -8, 8, 9.4, -7.8], [-8, 0.4, -7.8, -7.8, 9.4, 7.8], [7.8, 0.4, -7.8, 8, 9.4, 7.8], [-8, 0.4, 7.8, -1.4, 9.4, 8], [1.4, 0.4, 7.8, 8, 9.4, 8], [-1.4, 3, 7.8, 1.4, 9.4, 8]]) P.box(b, 'cubeGlass');
      for (const x of [-1.6, 1.6]) P.box([x - 0.2, 0.4, 7.7, x + 0.2, 3.2, 8.1], 'steel');
      P.W('lin_gone', () => {
        P.box([-1.4, 0.4, 7.84, 1.4, 3, 7.96], 'cubeGlass');
        for (const y of [1.2, 2.2]) P.vbox([-1.4, y - 0.06, 7.78, 1.4, y + 0.06, 8.02], 'steel'); // (its bars: the door reads shut)
      });
      for (const [x, z] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) P.box([x - 0.3, 0.4, z - 0.3, x + 0.3, 9.6, z + 0.3], 'steel');
      for (const y of [0.6, 9.4]) for (const [x0, z0, x1, z1] of [[-8, -8.3, 8, -7.7], [-8.3, -8, -7.7, 8], [7.7, -8, 8.3, 8], ...(y > 1 ? [[-8, 7.7, 8, 8.3]] : [[-8, 7.7, -1.8, 8.3], [1.8, 7.7, 8, 8.3]])]) P.vbox([x0, y - 0.2, z0, x1, y + 0.2, z1], 'steel');
      P.vbox([-7.4, 9.4, -7.4, 7.4, 9.6, 7.4], 'cubeGlass');
      prop(P, 'booth', 5, 9.8, Math.PI, { y: 0.4, m: 'helixWhite' });
      sign(P, 'CONTAINMENT - VERSION CONTROL', 0, 10.4, 8.4, 0, { size: 0.42, color: '#d8d4ff', board: 0 });
      for (let i = 0; i < 8; i++) P.cyl(Math.cos(i * 0.785) * 10.8, 0.4, Math.sin(i * 0.785) * 10.8, 0.12, 1.0, 'steel', { seg: 6, prop: 1 });
    });
    P.E('PAST', () => {
      P.dome(0, 0.4, 0, 7.4, 1.8, 'oculusGlass', { seg: 24 });
      P.torus(0, 0.45, 0, 7.6, 0.3, 'oculusRim', { rx: Math.PI / 2, seg: 40 });
      for (let i = 0; i < 10; i++) prop(P, 'bollard', Math.cos(i * 0.628) * 9.2, Math.sin(i * 0.628) * 9.2, 0, { y: 0.4 });
      P.vbox([-9.2, 1.0, -0.04, 9.2, 1.05, 0.04], 'barrierTape', { prop: 1 });
      // the junior programme's marquee on the island: SITE ZERO JUNIOR TOUR, the yellow canvas
      canopy(P, { rect: [-11, 4, -3, 10], h: 3.2, roof: 'marqueeYellow', span: 4, y: 0.4, post: 0.08, postMat: 'steel' });
      for (const [x, z] of [[-9, 6], [-6, 8], [-5, 5.4]]) prop(P, 'crate', x, z, 0.2, { y: 0.4, m: 'helixWhite' });
    });
    // --- the full ring: four wings round the court, arched over the river -------------------------------------
    const wingBlock = (rect, o = {}) => block(P, { rect, h: o.h ?? WING_H, facade: 'helixPanel', roof: 'flat', roofMat: 'roofLight', parapet: true, units: o.units ?? 1, tint: 0xf4f2f8, trim: 'steel', ...o });
    // north wing: a ground-floor loggia (glass to the court) under the offices; the security balcony at 9 m
    wingBlock([-62, -62, 62, -48]);
    P.box([-62, 4.5, -48, 62, WING_H, -40], 'helixPanel', { t: 0xf4f2f8 });
    P.vbox([-62, WING_H, -48, 62, WING_H + 0.3, -40], 'roofLight');
    colonnade(P, -60, -40.6, 60, -40.6, 25, 4.5, 0.32, 'steel', { beam: false });
    P.vbox([-62, 0, -47.9, 62, 4.5, -47.8], 'helixGlass', { noShadow: 1 });
    P.land('linDesk', -24, 0, -44.4, Math.PI);
    prop(P, 'bench', -24, -45.6, 0);
    P.land('photoWall', -10, 1.6, -47.6, 0);
    P.vbox([-14, 1.0, -47.7, -6, 2.6, -47.6], 'photoBoard');
    P.land('printCase', -50, 0, -16, Math.PI / 2);
    // the security balcony on the court face of the north wing (9 m): the staff stair up from the court
    // behind the staff door (Pryce opens it, if she trusts Kai), or the climb up the old river wall's
    // ledges at its west end
    P.box([10, 8.6, -40, 42, 9, -36.4], 'helixWhite');
    railing(P, 14, -36.4, 28.6, -36.4, 1.1, 'steel', { y: 9 });
    railing(P, 31.4, -36.4, 42, -36.4, 1.1, 'steel', { y: 9 });
    railing(P, 42, -40, 42, -36.4, 1.1, 'steel', { y: 9 });
    P.land('staffDoor', 30, 0, -21.4, Math.PI);
    for (const s of [-1, 1]) P.box([30 + s * 1.6 - 0.2, 0, -21.6, 30 + s * 1.6 + 0.2, 3.4, -21.2], 'helixWhite');
    P.vbox([28.2, 3.4, -21.6, 31.8, 3.8, -21.2], 'helixWhite');
    stair(P, 30, -22, 0, 30, -36.4, 9, 2.4, 'helixWhite', { rail: 'steel' });
    P.land('riverWall', 4, 0, -34, 0);
    for (let i = 0; i < 9; i++) P.box([1 + i * 1.1, 0, -39.4, 2.2 + i * 1.1, 1.0 * (i + 1), -37.2], 'quayStone');
    P.box([10.9, 8.6, -39.4, 12, 9, -36.4], 'quayStone');
    P.land('securityOffice', 30, 9, -38.6, Math.PI);
    prop(P, 'booth', 34, -39, 0, { y: 9, m: 'helixWhite' });
    P.vbox([26, 9, -40.02, 38, 12.6, -39.9], 'helixGlass', { noShadow: 1 });
    // east wing (the server room and the arcade on the ground floor; Rook's office over the river)
    wingBlock([48, -62, 62, -6.6], { units: 2 });
    wingBlock([48, 6.6, 62, 62], { units: 1 });
    P.box([48, 6, -6.6, 62, WING_H, 6.6], 'helixPanel', { t: 0xf4f2f8 });
    P.vbox([48, WING_H, -6.6, 62, WING_H + 0.3, 6.6], 'roofLight');
    for (const x of [48.6, 61.4]) for (const z of [-6.4, 6.4]) P.box([x - 0.5, -2.6, z - 0.3, x + 0.5, 6, z + 0.3], 'helixWhite');
    P.land('eastArcade', 40, 0, -26.4, Math.PI / 2); // (at the foot of the office stair, whose first step is at z -24: not on it)
    colonnade(P, 44, -36, 44, -8, 8, 4.5, 0.3, 'steel');
    P.box([44, 4.5, -38, 48, 5.0, -8], 'helixWhite');
    P.land('serverRoom2026', 46, 0, -26, -Math.PI / 2);
    // (where the second record lies: at the server glass, south of the drive's spot; at the arcade's foot it floated in
    // front of Iven, who stands there)
    P.land('serverWindow', 46.4, 0, -31.5, -Math.PI / 2);
    P.vbox([47.9, 0, -32, 48, 4.2, -20], 'serverGlass', { noShadow: 1 });
    for (let i = 0; i < 4; i++) P.vbox([49, 0, -31 + i * 3, 50.2, 2.4, -29.4 + i * 3], 'serverRack');
    // Rook's office: a corner room at 6 m in the east wing, its window over the river; an outside stair up
    P.land('rookOffice', 44, 6, -9, Math.PI / 2);
    P.box([38, 5.6, -14, 48, 6, -7.2], 'helixWhite');
    railing(P, 38, -14, 38, -7.2, 1.1, 'steel', { y: 6 });
    P.vbox([47.95, 6, -13, 48.05, 9.8, -7.4], 'helixGlass', { noShadow: 1 });
    prop(P, 'bench', 46.6, -10.4, -Math.PI / 2, { y: 6 });
    stair(P, 40, -24, 0, 40, -14.2, 6, 2.4, 'helixWhite', { rail: 'steel' });
    // south wing, arched over the stair down to the city; the cube's terminal faces it
    wingBlock([-62, 48, -6, 62]);
    wingBlock([6, 48, 48, 62]);
    P.box([-6, 5.2, 48, 6, WING_H, 62], 'helixPanel', { t: 0xf4f2f8 });
    stair(P, 0, 62.4, 0, 0, 69.6, -2.4, 10, 'terrazzo');
    // west: the old wing is gone; the riverside atrium stands where the river comes in
    P.land('atriumDoors', -64, 0, -16, Math.PI / 2); // (the doors face in: Kai walks into the atrium)
    canopy(P, { rect: [-62, -30, -40, -10], h: 7.5, roof: 'glassRoof', span: 5.5, post: 0.22, postMat: 'steel' });
    for (const z of [-30, -10]) P.vbox([-62, 0, z - 0.04, -40, 7.5, z + 0.04], 'helixGlass', { noShadow: 1 });
    P.vbox([-62.04, 0, -30, -61.96, 7.5, -19], 'helixGlass', { noShadow: 1 });
    P.vbox([-62.04, 0, -13, -61.96, 7.5, -10], 'helixGlass', { noShadow: 1 });
    P.land('receptionDesk', -52, 0, -22, Math.PI / 2);
    P.box([-53, 0, -25, -51.6, 1.1, -19], 'helixWhite');
    // (a reception desk, not a white block filling Mission 8's first shot: a dark counter over it, a kick and a band; no
    // lettering on its front, where the shot's subtitles fall)
    P.vbox([-53.1, 1.1, -25.1, -51.5, 1.15, -18.9], 'signBoard');
    P.vbox([-53.03, 0, -24.9, -52.98, 0.12, -19.1], 'signBoard', { noShadow: 1 });
    P.vbox([-53.03, 0.84, -24.9, -52.98, 0.9, -19.1], 'signBlue', { noShadow: 1 });
    P.land('recordsTerminal', -46, 0, -26, Math.PI);
    P.box([-50.6, 0, -16.6, -49.4, 1.0, -15.4], 'helixWhite');
    P.vbox([-50.7, 1.0, -16.7, -49.3, 1.9, -15.3], 'glass');
    wingBlock([-62, -38, -40, -32], { h: 9 });
    wingBlock([-62, 12, -48, 44], { h: 9, units: 0 });
    // --- the two years of the garden, the flags, the people's things ------------------------------------------
    P.E('PRESENT', () => {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.2, x = Math.cos(a) * 27, z = Math.sin(a) * 27;
        if (Math.abs(z) < 9) continue;
        P.tree('linden', x, z, 1.25);
      }
      for (let i = 0; i < 22; i++) P.tree('reeds', P.rng.float(-60, 60), P.rng.chance(0.5) ? -5.6 : 5.6, P.rng.float(0.9, 1.3), { y: -0.7, solid: false });
      for (const x of [-20, 20]) {
        P.cyl(x, 0, -30, 0.08, 9, 'steel', { seg: 6 });
        P.vbox([x + 0.1, 6.2, -30.02, x + 1.5, 8.8, -29.98], 'flagHelix');
      }
      for (const [x, z] of [[-36, -26], [-36, 24], [24, 36], [-24, 36]]) prop(P, 'barrier', x, z, 0.3, { m: 'barrierStripe' });
      for (const [x, z] of [[-30, 18], [30, -18], [-18, 30], [18, 30]]) prop(P, 'bench', x, z, Math.atan2(-x, -z));
      for (const [x0, z0, x1, z1] of [[-40, 14, -24, 22], [24, 14, 40, 22], [-40, -22, -24, -14], [24, -22, 40, -14]]) P.vbox([x0, 0, z0, x1, 0.5, z1], 'hedge');
    });
    P.E('PAST', () => {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.2, x = Math.cos(a) * 27, z = Math.sin(a) * 27;
        if (Math.abs(z) < 9) continue;
        P.tree('linden', x, z, 0.45, { solid: false });
        P.cyl(x, 0, z, 0.9, 0.6, 'planterTimber', { seg: 8, solid: true });
      }
      for (const [x0, z0, x1, z1] of [[-40, 14, -24, 22], [24, 14, 40, 22], [-40, -22, -24, -14], [24, -22, 40, -14]]) P.vbox([x0, 0, z0, x1, 0.25, z1], 'soil');
      for (const [x, z] of [[-34, 30], [34, 30], [-34, -30], [34, -30], [0, -30]]) {
        P.cyl(x, 0, z, 0.06, 6, 'steel', { seg: 6 });
        P.vbox([x + 0.08, 3.4, z - 0.02, x + 0.9, 5.8, z + 0.02], 'bannerYellow');
      }
      for (const [x, z] of [[-26, 40], [26, 40], [-44, 30], [44, -30], [-44, -30], [20, -36]]) prop(P, 'crate', x, z, 0.5, { m: 'wood' });
      for (const [x, z, w, d] of [[-30, 34, 6, 3], [30, 34, 5, 3], [36, -34, 4, 4], [-20, -34, 5, 2]]) P.box([x - w / 2, 0, z - d / 2, x + w / 2, 1.0, z + d / 2], 'pavingStack');
      sign(P, 'SITE ZERO JUNIOR TOUR - SATURDAY 14 MARCH - 16:00', -7, 3.9, 10.1, 0, { size: 0.26, color: '#3a2a10', board: 0 });
      prop(P, 'booth', -16, 22, Math.PI, { m: 'helixWhite' });
    });
    // the 2026 junior programme's group photo hangs on the photo wall (and is taken in 2026 by the marquee)
    P.land('groupPhoto', -12.4, 1.6, -47.6, 0);
    // the hillside north, the drop to the city south
    for (const [x, z, w] of [[-40, -80, 40], [10, -84, 34], [50, -78, 26]]) P.obox(x, 0, z, w, 7, 12, 0.08, 'rockGrass', { solid: true });
    terrace(P, [-70, 62, 70, 70], -0.01, 'terrazzo', { sides: '' });
    railing(P, -70, 69.6, -8, 69.6, 1.0, 'steel');
    railing(P, 8, 69.6, 70, 69.6, 1.0, 'steel');
    void ground;
    void wall;
  },
};
