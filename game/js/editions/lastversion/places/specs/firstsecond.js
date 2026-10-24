// The First Second (Mission 22, THE FIRST SECOND; OVERHAUL.md §5 M22). A radial place 160 m across on the Ring
// Hill at the First Second, under an eclipsed black sun. At the centre the twin chamber: 2026 at 16:02 and 2049
// at 05:40 as one room, one half construction concrete and one half machined black, the original ring in it.
// Round it, five wedges (helper `wedges`), each a fragment of an earlier place in its own year and light, quoted:
// the village terraces at golden evening and the causal-chain wall (M5), the clockmaker's light well in autumn
// and the arm (M6), the hospital colonnade at noon and the lock (M11), the Line 41 canopy at 08:14 in rain and
// the PA microphone (M1), the 2196 Helix court at misty dawn and Orren (M3). The sky is cut into the same five
// wedges like a clock face, converging at the zenith above the ring. The years change the centre's half-states
// and which wedge is lit.
//   Q0 THE VILLAGE'S CHAIN                               the south wedge
//   Q1 THE CLOCKMAKER'S PATTERN & THE HOSPITAL'S LOCK    the west and north-west wedges
//   Q2 THE FINAL CHAMBER                                 the centre, the north-east and east wedges
import { terrace, stair, railing, prop, sign, glyphs, roundhouse, colonnade, canopy } from '../archetypes.js';

const D2R = Math.PI / 180;
const RC = 14; // the twin chamber's radius
// the five wedges: centre bearing (degrees from +x toward +z: 90 is south), the ground, the sky's colour
const WEDGES = [
  { key: 'wedgeVillage', c: 90, ground: 'ridgeGrass', sky: 0xffb468 },
  { key: 'wedgeClock', c: 162, ground: 'leaves', sky: 0xd8884a },
  { key: 'wedgeHospital', c: 234, ground: 'terrazzo', sky: 0xe8f2ff },
  { key: 'wedgeStation', c: 306, ground: 'pavingWet', sky: 0x5a6a84 },
  { key: 'wedgeCourt', c: 18, ground: 'moss', sky: 0xb8d8c8 },
];
const polar = (deg, r) => [Math.cos(deg * D2R) * r, Math.sin(deg * D2R) * r];
// which wedges are lit, by year (their lanterns below, and their part of the sky: an unlit wedge's sky is its colour dimmed)
const LIT = { PAST: ['wedgeVillage', 'wedgeClock'], PRESENT: ['wedgeHospital', 'wedgeStation'], FUTURE: ['wedgeCourt', 'wedgeVillage'] };
const dim = (c, k) => (Math.round(((c >> 16) & 255) * k) << 16) | (Math.round(((c >> 8) & 255) * k) << 8) | Math.round((c & 255) * k);

// `wedges`: the five fans of ground from the chamber's walk outward, with seams of light between them
function wedges(P) {
  for (const w of WEDGES) P.fan(0, 0.03, 0, RC + 8, 118, (w.c - 36) * D2R, (w.c + 36) * D2R, w.ground, { seg: 20, noShadow: 1 });
  for (const w of WEDGES) {
    const a = w.c + 36, [x0, z0] = polar(a, RC + 9), [x1, z1] = polar(a, 112);
    const len = Math.hypot(x1 - x0, z1 - z0);
    P.obox((x0 + x1) / 2, 0, (z0 + z1) / 2, 0.08, 3.2, len, Math.PI / 2 - a * D2R, 'wedgeGlass', { noShadow: 1 });
    P.obox((x0 + x1) / 2, 3.2, (z0 + z1) / 2, 0.12, 0.08, len, Math.PI / 2 - a * D2R, 'glowAccent', { noShadow: 1 });
  }
}

export default {
  key: 'firstsecond', style: 'composite', sameAs: ['rain_south', 'valley_upper', 'oldtown', 'hospital', 'helix'], name: 'THE FIRST SECOND',
  bounds: [-80, -80, 80, 80],
  edges: { N: 'slope', E: 'slope', W: 'slope', S: 'slope' },
  killY: -3,
  primary: 'twinChamber',
  backdrop: { notch: 'clear' },
  years: {
    PAST: { sky: 'eclipse2026', era: '2026', hour: 16.0, sun: { elev: 34, az: 210 }, fog: 0x4a3a40, density: 0.9, night: 0.3, weather: 'motes', ibl: 'dusk', lit: 0.5,
      hemi: { sky: 0xc89a84, ground: 0x3a2e2c, k: 1.0 }, sunColor: 0xffd8b0, sunK: 0.7, grade: { shadowTint: 0x2a1424, highlightTint: 0xffe0c0, toning: 0.24, contrast: 1.14, saturation: 1.0 } },
    PRESENT: { sky: 'eclipse2049', era: '2049', hour: 5.66, sun: { elev: 40, az: 180 }, fog: 0x1e2638, density: 0.9, night: 0.42, weather: 'motes', ibl: 'night', lit: 0.6,
      hemi: { sky: 0x8a9ac0, ground: 0x1c2028, k: 0.95 }, sunColor: 0xd8e4ff, sunK: 0.6, grade: { shadowTint: 0x0e1430, highlightTint: 0xd8e4ff, toning: 0.24, contrast: 1.16, saturation: 0.96 } },
    FUTURE: { sky: 'eclipse2196', era: '2196', hour: 6.4, sun: { elev: 38, az: 150 }, fog: 0x2a3a34, density: 1.0, night: 0.3, weather: 'motes', ibl: 'dusk', lit: 0.5,
      hemi: { sky: 0x9abaa8, ground: 0x24302a, k: 1.0 }, sunColor: 0xe0ffe8, sunK: 0.65, grade: { shadowTint: 0x0e2018, highlightTint: 0xe0ffe8, toning: 0.24, contrast: 1.12, saturation: 1.0 } },
  },
  // (closing: visuals) the sky's wedges run into each other (soft: a hard seam read as a rendering fault on a phone), and
  // each year lights its own two: the years differ overhead as well as at the chamber
  skyFeatures: { all: [
    ...Object.entries(LIT).map(([yr, lit]) => ({ kind: 'wedges', n: 5, cols: WEDGES.map((w) => (lit.includes(w.key) ? w.sky : dim(w.sky, 0.3))), turn: -54 * D2R, mix: 0.62, soft: 1, when: `@${yr}` })),
    { kind: 'eclipse', az: 180, elev: 58, size: 3.2, corona: 1.4 },
  ] },
  quarters: [
    { name: 'THE VILLAGE\'S CHAIN', area: [-40, 30, 40, 80], spawnAt: 'wedgeVillage', threshold: { at: 'villageGate', kind: 'seam' } },
    { name: 'THE CLOCKMAKER\'S PATTERN & THE HOSPITAL\'S LOCK', area: [-80, -60, -29, 30], spawnAt: 'wedgeClock', threshold: { at: 'chamberGate', kind: 'door' } },
    { name: 'THE FINAL CHAMBER', area: [-29, -80, 80, 30], spawnAt: 'chamberGate', threshold: null },
  ],
  beatAt: { m22: ['chainWall', 'clockArm', 'finalSeals'] },
  exits: { m22: 'finalSeals' },
  frags: { m22: [['villageGate', 'roundhouse1', 'chainWall'], ['hospitalLock', 'paMic', 'memoryCards']] },
  crowd: [
    { era: 'ancient', years: ['PAST'], region: 'firstsecond', role: 'villager', path: [[-14, 41], [14, 41]], n: 3 },
    { era: 'present', years: ['PRESENT'], region: 'firstsecond', role: 'commuter', path: [[18, -39], [36, -39]], n: 3 },
  ],

  build(P) {
    P.setTerrain(-80, -80, 80, 80, 0);
    P.box([-80, -0.6, -80, 80, 0, 80], 'summitGrass', { noShadow: 1 });
    wedges(P);
    // --- the twin chamber: one room, two halves; the walk round it ---------------------------------------------------
    P.fan(0, 0.05, 0, 0, RC, 90 * D2R, 270 * D2R, 'rawConcrete', { seg: 24, noShadow: 1 });
    P.fan(0, 0.05, 0, 0, RC, -90 * D2R, 90 * D2R, 'eliteGraphite', { seg: 24, noShadow: 1 });
    P.fan(0, 0.04, 0, RC, RC + 8, 0, Math.PI * 2, 'flagstone', { seg: 48, noShadow: 1 });
    const doors = WEDGES.map((w) => w.c);
    const N = 40;
    for (let i = 0; i < N; i++) {
      const a = ((i + 0.5) / N) * 360;
      if (doors.some((d) => Math.abs(((a - d + 540) % 360) - 180) < 9)) continue;
      const [x, z] = polar(a, RC), west = Math.cos(a * D2R) < 0;
      const len = ((2 * Math.PI * RC) / N) * 1.05, ry = -a * D2R;
      const m = west ? 'rawConcrete' : 'eliteGraphite';
      P.obox(x, 0, z, 0.7, 2.6, len, ry, m);
      P.col([x - 0.9, 0, z - 0.9, x + 0.9, 3.4, z + 0.9]);
      // the upper walls: 2026's concrete half stands whole in 2026 and 2049; 2049's black half from 2049 on; 2196 broken
      if (west) P.E(['PAST', 'PRESENT'], () => P.obox(x, 2.6, z, 0.7, 4.4, len, ry, 'rawConcrete'));
      else P.E('PRESENT', () => P.obox(x, 2.6, z, 0.7, 4.4, len, ry, 'eliteGraphite'));
      if (i % 3 === 0) P.E('FUTURE', () => P.obox(x, 2.6, z, 0.7, 1 + (i % 4) * 0.8, len, ry, west ? 'rawConcrete' : 'eliteGraphite'));
      if (!west) P.E('PAST', () => P.obox(x, 2.6, z, 0.7, 4.4, len, ry, 'wedgeGlass', { noShadow: 1 }));
    }
    // 2026's scaffold round the concrete half; 2049's lit seam round the black half
    P.E('PAST', () => { for (let i = 0; i < 9; i++) { const [x, z] = polar(100 + i * 20, RC + 1.6); P.cyl(x, 0, z, 0.06, 7, 'scaffold', { seg: 5 }); } });
    P.E('PRESENT', () => P.torus(0, 6.9, 0, RC, 0.1, 'glowAccent', { rx: Math.PI / 2, arc: Math.PI, rz: 0, ry: Math.PI / 2, seg: 40 }));
    P.E('FUTURE', () => { for (let i = 0; i < 14; i++) { const [x, z] = polar(i * 26, RC + P.rng.float(-1, 2)); P.tree('grass', x, z, 1.2, { solid: false }); } });
    sign(P, '16:02', -RC + 0.5, 3.6, 0, Math.PI / 2, { size: 0.7, color: '#f4e8d8', boardMat: 'rawConcrete' });
    sign(P, '05:40', RC - 0.5, 3.6, 0, -Math.PI / 2, { size: 0.7, color: '#9fd8ff', boardMat: 'eliteGraphite' });
    // the original ring, standing in the middle, the final seals round its foot, the evidence on a table
    P.torus(0, 5.2, -3, 4.6, 0.5, 'blackRing', { seg: 48 });
    P.box([-4.8, 0, -3.6, -4, 1.2, -2.4], 'blackRing');
    P.box([4, 0, -3.6, 4.8, 1.2, -2.4], 'blackRing');
    for (const dx of [-2.4, 0, 2.4]) P.cyl(dx, 0, -6.4, 0.5, 1.0, 'sealBronze', { seg: 8, solid: true });
    P.land('twinChamber', 0, 0, 9, Math.PI);
    P.land('finalSeals', 0, 0, -5, 0);
    P.land('evidenceTable', -7, 0, 3, Math.PI / 2);
    P.land('memoryCards', 7, 0, 3, -Math.PI / 2);
    P.land('chamberGate', ...((p) => [p[0], 0, p[1]])(polar(234, RC + 3)), Math.atan2(-Math.cos(234 * D2R), -Math.sin(234 * D2R))); // (facing the ring)
    P.land('villageGate', ...((p) => [p[0], 0, p[1]])(polar(126, RC + 4)), 0);
    // --- the village wedge (south, golden evening): terraces, roundhouses, the causal-chain wall ----------------------
    P.land('wedgeVillage', 0, 2.4, 64, Math.PI);
    P.land('chainWall', 11.6, 2.4, 59, -Math.PI / 2);
    P.land('roundhouse1', -10, 1.2, 50, 0); // (at its door: the roundhouse stands at z 46)
    terrace(P, [-22, 40, 22, 52], 1.2, 'ridgeGrass', { wall: 'drystone', sides: 'NEW' });
    terrace(P, [-16, 52, 16, 68], 2.4, 'ridgeGrass', { wall: 'drystone', sides: 'NEW' });
    stair(P, 0, 37.6, 0, 0, 40.4, 1.2, 3, 'drystone');
    stair(P, 0, 49.8, 1.2, 0, 52.6, 2.4, 3, 'drystone');
    roundhouse(P, { x: -10, z: 46, r: 3.2, ry: 0, y: 1.2 });
    roundhouse(P, { x: 12, z: 45, r: 3.6, ry: 0, y: 1.2 });
    roundhouse(P, { x: -8, z: 62, r: 3, ry: Math.PI / 2, y: 2.4 });
    P.box([13, 2.4, 53, 14.4, 4.6, 66], 'drystone');
    for (let k = 0; k < 4; k++) glyphs(P, 12.9, 3.0, 54.6 + k * 3.2, 2.2, 1.2, -Math.PI / 2, { m: 'glyphStone' });
    for (let i = 0; i < 6; i++) P.tree(i % 2 ? 'olive' : 'cypress', -30 + i * 12, 74 + (i % 2) * 3, P.rng.float(1, 1.3));
    // --- the clockmaker's wedge (west-south-west, autumn): the light well and the arm -------------------------------------
    P.land('wedgeClock', -30, 0, 14, -Math.PI / 2);
    P.land('clockArm', -42, 0, 14, Math.PI / 2);
    for (const [x0, z0, x1, z1] of [[-53, 5, -35, 6], [-53, 22, -35, 23], [-54, 5, -53, 23]]) P.box([x0, 0, z0, x1, 9, z1], 'townhouse', { t: 0xf0e0cc });
    P.box([-36, 0, 5, -35, 9, 11.5], 'townhouse', { t: 0xf0e0cc });
    P.box([-36, 0, 16.5, -35, 9, 23], 'townhouse', { t: 0xf0e0cc });
    P.box([-36, 3.2, 11.5, -35, 9, 16.5], 'townhouse', { t: 0xf0e0cc, solid: false });
    for (const z of [5.5, 22.5]) for (let k = 0; k < 4; k++) P.vbox([-51 + k * 4, 4, z - 0.56, -49.6 + k * 4, 6.2, z + 0.56], 'windowWarm', { noShadow: 1 });
    P.vbox([-54.2, 9, 4.8, -34.8, 9.3, 23.2], 'glassRoof');
    P.cyl(-46, 0, 14, 0.5, 4.2, 'clockCaseWood', { seg: 8, solid: true });
    P.obox(-46, 4.2, 14, 3.6, 0.2, 0.2, 0.4, 'brass');
    for (let i = 0; i < 5; i++) P.tree('plane', -66 + i * 3, -4 + i * 7, P.rng.float(1, 1.3));
    // --- the hospital wedge (north-west, noon): the colonnade, the lock ---------------------------------------------------
    P.land('wedgeHospital', -30, 0, -40, -Math.PI / 2);
    P.land('hospitalLock', -52, 0, -40, Math.PI / 2);
    colonnade(P, -52, -48, -26, -48, 7, 4.2, 0.32, 'renderWhite', { beamMat: 'renderWhite' });
    colonnade(P, -52, -32, -26, -32, 7, 4.2, 0.32, 'renderWhite', { beamMat: 'renderWhite' });
    P.vbox([-53, 4.9, -49.4, -25, 5.1, -30.6], 'renderWhite');
    P.box([-54.4, 0, -46, -53.6, 3.4, -34], 'renderWhite');
    P.box([-53.6, 0, -41, -53.2, 2.4, -39], 'hospitalTile');
    P.cyl(-53.1, 1.2, -40, 0.25, 0.1, 'brass', { seg: 10, rz: Math.PI / 2 });
    P.vbox([-50, 0.02, -46, -28, 0.05, -34], 'hospitalTile', { noShadow: 1 });
    // --- the station wedge (north-east, 08:14 in rain): the Line 41 canopy, the PA microphone -------------------------------
    P.land('wedgeStation', 30, 0, -32, Math.PI);
    P.land('paMic', 36.4, 1.0, -44, Math.PI);
    P.box([18, 0, -48, 48, 1.0, -40], 'platformTile');
    P.vbox([18, 0.98, -40.4, 48, 1.02, -40], 'platformEdge', { noShadow: 1 });
    stair(P, 30, -39.6, 0, 30, -41.4, 1.0, 3, 'platformTile');
    canopy(P, { rect: [19, -47, 47, -41], h: 3.4, y: 1.0, roof: 'glassRoof', postMat: 'busStopGreen', span: 7 });
    P.cyl(34, 1.0, -44.6, 0.04, 1.4, 'ironDark', { seg: 5 });
    P.sphere(34, 2.45, -44.6, 0.09, 'ironDark');
    sign(P, 'LINE 41  SOUTH SQUARE  08:14', 33, 3.7, -40.9, 0, { size: 0.36, color: '#ffd36a', boardMat: 'signGreen' });
    for (let i = 0; i < 5; i++) P.disc(P.rng.float(16, 50), 0.05, P.rng.float(-36, -26), P.rng.float(0.6, 1.6), 'puddleWater', { seg: 12 });
    // --- the court wedge (east-south-east, 2196 misty dawn): the Helix court, Orren --------------------------------------------
    P.land('wedgeCourt', 40, 0, 14, -Math.PI / 2);
    P.land('orren', 50, 0, 12, -Math.PI / 2);
    for (const [x0, z0, x1, z1] of [[36, 2, 62, 3], [36, 25, 62, 26], [61, 3, 62, 25]]) P.box([x0, 0, z0, x1, 6, z1], 'helixWhite');
    for (let i = 0; i < 6; i++) P.vbox([37 + i * 4, 0, 3, 39 + i * 4, P.rng.float(2, 5), 3.3], 'ivy', { noShadow: 1 });
    P.cyl(48, 0, 14, 3, 0.6, 'helixWhite', { seg: 18, solid: true });
    P.disc(48, 0.62, 14, 2.6, 'moss', { seg: 18 });
    for (let i = 0; i < 8; i++) P.tree('birch', P.rng.float(38, 60), P.rng.pick([P.rng.float(-6, 0), P.rng.float(28, 34)]), P.rng.float(0.9, 1.2));
    // --- which wedge is lit, by year: lanterns along the seams of the lit wedges ---------------------------------------------
    for (const [yr, keys] of Object.entries(LIT)) P.E(yr, () => {
      for (const k of keys) {
        const w = WEDGES.find((q) => q.key === k);
        for (let i = 0; i < 6; i++) {
          const [x, z] = polar(w.c - 30 + i * 12, RC + 10);
          P.cyl(x, 0, z, 0.08, 3.4, 'ironDark', { seg: 5 });
          P.sphere(x, 3.6, z, 0.32, 'lanternGlow');
        }
        for (let i = 0; i < 4; i++) { const [x, z] = polar(w.c - 18 + i * 12, 70); P.cyl(x, 0, z, 0.9, 5.5, 'lanternGlow', { seg: 8, r2: 0.4 }); }
      }
    });
    // the rest of the hill: stones of the ring's hill, the village's fields in 2026, the court's birches in 2196
    P.E('PAST', () => { for (let i = 0; i < 10; i++) { const [x, z] = polar(60 + i * 6, P.rng.float(76, 86)); P.obox(x, 0, z, 2, P.rng.float(2, 4), 1.2, P.rng.float(0, 3), 'standingStone', { solid: false }); } });
    P.E('FUTURE', () => { for (let i = 0; i < 16; i++) { const [x, z] = polar(P.rng.float(0, 360), P.rng.float(72, 100)); P.tree('birch', x, z, P.rng.float(1, 1.4), { solid: false }); } });
    P.E('PRESENT', () => { for (let i = 0; i < 8; i++) { const [x, z] = polar(i * 45 + 20, 90); P.cyl(x, 0, z, 0.2, 8, 'helixFence', { seg: 6 }); P.sphere(x, 8.2, z, 0.25, 'redBeacon'); } });
    // --- the years at the chamber, each seen from the village wedge (closing: visuals; from the spawn the three years had
    // looked almost the same) --------------------------------------------------------------------------------------------
    // 2026: a building site: a tower crane over the concrete half, site hoarding round it between its doors, floodlights
    P.E('PAST', () => {
      const cx = 4, cz = -27;
      P.obox(cx, 0, cz, 1.4, 38, 1.4, 0, 'craneYellow');
      for (let y = 2; y < 38; y += 3) P.obox(cx, y, cz, 1.6, 0.12, 1.6, 0.785, 'craneYellow', { noShadow: 1 });
      P.obox(cx - 6, 38, cz + 9, 1.1, 1.0, 34, -0.6, 'craneYellow');
      P.obox(cx + 4, 38, cz - 6, 1.3, 1.1, 12, -0.6, 'craneYellow');
      P.obox(cx + 6.5, 36.4, cz - 9.6, 2.2, 1.8, 2.6, -0.6, 'concrete');
      P.obox(cx, 39, cz, 0.6, 6, 0.6, 0, 'craneYellow');
      P.obox(cx - 14, 22, cz + 21, 0.05, 16, 0.05, 0, 'steel', { noShadow: 1 });
      P.obox(cx - 14, 21.4, cz + 21, 1.4, 0.6, 1.4, 0, 'ironDark');
      for (const [a0, a1] of [[100, 150], [174, 222]]) for (let a = a0; a < a1; a += 6) {
        const [x, z] = polar(a + 3, RC + 2.4), len = ((2 * Math.PI * (RC + 2.4)) / 60) * 1.02;
        P.obox(x, 0, z, 0.12, 2.4, len, -(a + 3) * D2R, 'siteHoarding', { solid: true });
      }
      for (const a of [110, 200, 250]) { const [x, z] = polar(a, RC + 5); prop(P, 'floodlight', x, z, 0); }
    });
    // 2049: the black half finished, and from the ring a beam of light straight up into the eclipse
    P.E('PRESENT', () => {
      P.cyl(0, 7.2, -3, 0.5, 90, 'lightPanel', { seg: 10 });
      P.cyl(0, 7.2, -3, 2.2, 90, 'smoke', { seg: 16, open: true });
      P.glow(0, 0.06, -3, 6, 0x9fd8ff);
      for (const a of [60, 120, 240, 300]) { const [x, z] = polar(a, RC + 7); P.cyl(x, 0, z, 0.1, 4.4, 'ironDark', { seg: 6 }); P.obox(x, 4.4, z, 0.8, 0.4, 0.4, -a * D2R, 'ledGlow'); P.glow(x, 0.05, z, 4, 0xdce8ff); }
    });
    // 2196: the chamber broken open and grown through: lindens inside it taller than its walls, creepers down the walls
    P.E('FUTURE', () => {
      for (const [x, z, k] of [[-6, 4, 1.9], [5, 6, 1.6], [-4, -9, 1.7], [8, -6, 1.4]]) P.tree('linden', x, z, k, { solid: false });
      for (let i = 0; i < 40; i += 4) {
        const a = ((i + 0.5) / 40) * 360;
        if (WEDGES.some((w) => Math.abs(((a - w.c + 540) % 360) - 180) < 10)) continue;
        const [x, z] = polar(a, RC + 0.42), len = ((2 * Math.PI * RC) / 40) * 2.4;
        P.obox(x, 0.2, z, 0.04, 3.4, len, -a * D2R, 'vineSheet', { noShadow: 1 });
      }
      for (let i = 0; i < 18; i++) { const [x, z] = polar(i * 20 + 7, P.rng.float(24, 60)); P.tree('grass', x, z, P.rng.float(1.2, 1.8), { solid: false }); }
    });
    prop(P, 'bench', -4, 26, Math.PI);
    railing(P, -80, 79.5, 80, 79.5, 0.6, 'drystone', { t: 0.4, solid: false });
  },
};
