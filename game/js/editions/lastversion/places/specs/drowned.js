// Downtown Rain City (Mission 14, WELCOME TO 2196; OVERHAUL.md §5 M14). One street grid in every year. In 2196
// the sea stands 3 m higher and the avenues are lagoon canals: the old sidewalks are 0.6 m wading strips, the
// deep channels between them take you back; the towers wear hanging gardens over broken curtain walls; the
// elevated Line 41 viaduct is the main walkway, with a gap where it fell; one tower lies across a block like
// a ramp up to the bank's roof garden. The memorial stands on the old Helix Plaza: KAI VAREN, ARCHITECT OF
// THE FRACTURE. Shimmering patches flicker between years. 2049: the same downtown dry and busy at midday in
// light rain, a train on the viaduct. 2026: half the towers are cranes and steel frames, a sunny morning.
//   Q0 THE OVERGROWN TOWERS  the south blocks, the bank and the fallen tower (z 30 .. 110)
//   Q1 THE TRANSIT LINE      the viaduct's middle and its gap (z -40 .. 30)
//   Q2 THE MEMORIAL          the old Helix Plaza (z -110 .. -40)
import { ground, terrace, stair, ramp, railing, block, prop, sign, viaduct, bridge } from '../archetypes.js';

const VX = 32, VY = 8; // the Line 41 viaduct: its axis (x) and deck height
const SEA = 0.75; // the lagoon's surface in 2196 (the sidewalks are 0.6 m under it)
const ROADS = [-60, 0, 60]; // the avenues (both ways), 14 m wide, with 4 m sidewalks
const XING = [67, 71]; // the crossing of the line's avenue (x 0) in 2196: the bank avenue's north sidewalk, z 67 .. 71

// a tower: a podium in every year (shops lit behind their glass in 2026 and 2049; in 2196 the old shopfronts dark behind
// rusted shutters, gone green at the waterline); above it glass (2049), glass or a steel frame and a crane (2026), and in
// 2196 the broken curtain wall under real overgrowth: terraces of hanging gardens with ivy along their edges and vines
// falling from them, sheets of creeper down the faces, roots over the podium's edge, trees on the broken crown
// (closing: visuals; the towers had read as green-tinted glass). `faces`: the sides that look onto the avenues or the
// viaduct, where the growth is ('N', 'S', 'E', 'W')
function tower(P, [x0, z0, x1, z1], h, { frame = false, tint = 0xffffff, podium = 8, faces = 'SW', only = null } = {}) {
  // (only: the years it stands in, the fallen tower's 2026 and 2049)
  const E = (yrs, fn) => { const ys = [].concat(yrs).filter((y) => !only || only.includes(y)); if (ys.length) P.E(ys, fn); };
  E(['PRESENT', 'PAST', 'FUTURE'], () => P.col([x0, 0, z0, x1, podium, z1]));
  E(['PRESENT', 'PAST'], () => P.vbox([x0, 0, z0, x1, podium, z1], 'podiumFacade', { t: tint }));
  E('FUTURE', () => P.vbox([x0, 0, z0, x1, podium, z1], 'ruinPodium', { t: tint }));
  P.blocks.push([x0, z0, x1, z1]);
  P.reserve(x0, z0, x1, z1);
  const [ix0, iz0, ix1, iz1] = [x0 + 2, z0 + 2, x1 - 2, z1 - 2];
  E('PRESENT', () => P.vbox([ix0, podium, iz0, ix1, h, iz1], 'rainGlass', { t: tint }));
  E('PAST', () => {
    if (!frame) return P.vbox([ix0, podium, iz0, ix1, h * 0.85, iz1], 'rainGlass', { t: tint });
    // a steel frame of floors and columns, and a crane on top
    for (let y = podium + 4; y < h * 0.7; y += 4) P.vbox([ix0, y, iz0, ix1, y + 0.4, iz1], 'rawConcrete');
    for (const [cx, cz] of [[ix0, iz0], [ix1, iz0], [ix1, iz1], [ix0, iz1]]) P.vbox([cx - 0.4, podium, cz - 0.4, cx + 0.4, h * 0.7, cz + 0.4], 'scaffold');
    P.obox((ix0 + ix1) / 2, h * 0.7, (iz0 + iz1) / 2, 1.2, 18, 1.2, 0, 'craneYellow');
    P.obox((ix0 + ix1) / 2 + 10, h * 0.7 + 18, (iz0 + iz1) / 2, 30, 1, 1, 0, 'craneYellow');
  });
  E('FUTURE', () => {
    const top = h * (0.6 + ((x0 * 7 + z0 * 3) % 10) / 30);
    P.vbox([ix0, podium, iz0, ix1, top, iz1], 'ruinFacade', { t: 0xe8ece0 });
    // the crown broken off: stubs of the top storey's frame
    for (let k = 0; k < 5; k++) { const u = ix0 + ((ix1 - ix0) * (k + 0.2)) / 5; P.vbox([u, top, iz0 + 0.2, u + 0.8, top + 1.2 + ((k * 7 + x0) % 4) * 0.7, iz0 + 1.0], 'concreteStained'); }
    // the faces with growth: [the face's line, along x?, outward sign]
    const F = { N: [iz0, true, -1], S: [iz1, true, 1], W: [ix0, false, -1], E: [ix1, false, 1] };
    const sides = [...faces].map((f) => F[f]);
    // terraces of hanging gardens every few floors: a slab, its soil and leaves, ivy along the edge, vines falling from it
    for (let y = podium + 8; y < top - 3; y += 12) {
      P.vbox([ix0 - 1.2, y, iz0 - 1.2, ix1 + 1.2, y + 0.5, iz1 + 1.2], 'concreteStained');
      P.vbox([ix0 - 1.1, y + 0.5, iz0 - 1.1, ix1 + 1.1, y + 0.7, iz1 + 1.1], 'roofGarden', { noShadow: 1 });
      for (const [line, alongX, sg] of sides) {
        const [a0, a1] = alongX ? [ix0, ix1] : [iz0, iz1];
        for (let u = a0 + 2 + ((y * 3) % 5); u < a1 - 1; u += 9) {
          const [vx, vz] = alongX ? [u, line + sg * 1.25] : [line + sg * 1.25, u];
          P.tree('vine', vx, vz, P.rng.float(0.9, 1.25), { y: y + 0.4, solid: false });
          const [ix, iz] = alongX ? [u + 4.5, line + sg * 0.6] : [line + sg * 0.6, u + 4.5];
          P.tree('ivy', ix, iz, P.rng.float(0.55, 0.85), { y: y + 0.7, solid: false });
        }
        // a sheet of creeper hung from the terrace down the storey below it (leaves cut out of a sheet)
        const len = Math.min(10, y - podium - 1);
        const w = Math.min(12, a1 - a0 - 4), c = a0 + 2 + ((y * 7 + a0) % Math.max(1, a1 - a0 - 4 - w));
        if (alongX) P.vbox([c, y - len, line + sg * 0.15 - 0.02, c + w, y + 0.3, line + sg * 0.15 + 0.02], P.rng.chance(0.5) ? 'vineSheet' : 'vineSheetDark');
        else P.vbox([line + sg * 0.15 - 0.02, y - len, c, line + sg * 0.15 + 0.02, y + 0.3, c + w], P.rng.chance(0.5) ? 'vineSheet' : 'vineSheetDark');
      }
    }
    // creeper sheets down the face from the crown, and roots over the podium's edge where the faces meet the street
    for (const [line, alongX, sg] of sides) {
      const [a0, a1] = alongX ? [ix0, ix1] : [iz0, iz1];
      const c = a0 + (a1 - a0) * 0.55, len = Math.min(14, top - podium - 2);
      if (alongX) P.vbox([c, top - len, line + sg * 0.12 - 0.02, c + Math.min(9, a1 - c), top + 0.4, line + sg * 0.12 + 0.02], 'vineSheet');
      else P.vbox([line + sg * 0.12 - 0.02, top - len, c, line + sg * 0.12 + 0.02, top + 0.4, c + Math.min(9, a1 - c)], 'vineSheet');
      for (let u = a0 + 3; u < a1; u += 11) {
        const [rx, rz] = alongX ? [u, line + sg * 2.2] : [line + sg * 2.2, u];
        P.tree('roots', rx, rz, P.rng.float(0.9, 1.2), { y: podium, solid: false });
      }
    }
    // trees grown on the broken crown
    P.tree('birch', (ix0 + ix1) / 2, (iz0 + iz1) / 2, 1.6, { y: top, solid: false });
    P.tree('willow', ix0 + 4, iz1 - 4, 1.1, { y: top, solid: false });
    P.tree('ivy', ix1 - 3, iz0 + 3, 1.0, { y: top, solid: false });
  });
}

export default {
  key: 'drowned', style: 'drowned', sameAs: null, name: 'DOWNTOWN',
  bounds: [-110, -110, 110, 110],
  edges: { N: 'blocks', E: 'blocks', W: 'blocks', S: 'sea' },
  killY: -3,
  primary: 'memorial',
  backdrop: { notch: 'faint', sea: 190 },
  years: {
    FUTURE: { sky: 'pastelMist', era: '2196', hour: 7.9, sun: { elev: 14, az: 105 }, fog: 0xb8c8b0, density: 1.4, night: 0, weather: 'pollen', ibl: 'dusk', lit: 0,
      hemi: { sky: 0xf8e8c8, ground: 0x8a9a80, k: 0.95 }, sunColor: 0xfff4dc, sunK: 1.1, grade: { shadowTint: 0x2a3a3a, highlightTint: 0xfff4e4, toning: 0.16, contrast: 1.06, saturation: 1.02 } },
    PRESENT: { sky: 'middayDrizzle', era: '2049', hour: 12.6, sun: { elev: 52, az: 170 }, fog: 0x8a9298, density: 1.3, night: 0.15, weather: 'rain', ibl: 'night', lit: 0.5,
      hemi: { sky: 0xb4bcc4, ground: 0x4a4e52, k: 0.9 }, sunColor: 0xe8ecf0, sunK: 0.6, grade: { shadowTint: 0x1c2a3a, highlightTint: 0xe8f0f8, toning: 0.12, contrast: 1.1, saturation: 0.9 } },
    PAST: { sky: 'craneMorning', era: '2026', hour: 10.1, sun: { elev: 40, az: 125 }, fog: 0xd0dce4, density: 0.7, night: 0, weather: null, ibl: 'plant', lit: 0,
      hemi: { sky: 0xe4eef4, ground: 0x7a7a72, k: 1.0 }, sunColor: 0xffffff, sunK: 1.3, grade: { shadowTint: 0x1e3a5a, highlightTint: 0xfffaf0, toning: 0.06, contrast: 1.1, saturation: 1.06 } },
  },
  quarters: [
    { name: 'THE OVERGROWN TOWERS', area: [-110, 30, 110, 110], spawnAt: 'arrivalPlatform', threshold: { at: 'viaductMid', kind: 'viaduct' } },
    { name: 'THE TRANSIT LINE', area: [-110, -40, 110, 30], spawnAt: 'viaductMid', threshold: { at: 'plazaSteps', kind: 'stair' } },
    { name: 'THE MEMORIAL', area: [-110, -110, 110, -40], spawnAt: 'plazaSteps', threshold: null },
  ],
  beatAt: { m14: ['partsList', 'unstableZones', 'memorial'] },
  exits: { m14: 'seraSchool' },
  frags: { m14: [['bankTerrace', 'fallenTower', 'roofGarden'], ['antenna', 'stackedStones', 'lowWaterPath']] },
  watch: { m14: [[], [[[-50, -2], [50, -2]]], [[[-40, -54], [40, -54], [40, -48], [-40, -48]], [[-60, -20], [-60, 20]]]] }, // (over the avenues, not through the towers)
  crowd: [
    { era: 'future', years: ['FUTURE'], region: 'drowned', role: 'survivor', path: [[VX - 2, 96], [VX - 2, 40]], y: VY, n: 4 },
    // (they keep their heads down in the drizzle: Rain City South's lines are the Zero Second's morning, Mission 1's,
    // and the mission's speech budget is spent on its own people; U7 review)
    { era: 'present', years: ['PRESENT'], region: 'rain', role: 'commuter', path: [[-4, 90], [-4, -90]], n: 6, barks: [] },
    { era: 'present', years: ['PAST'], region: 'rain', role: 'builder', path: [[-70, 57], [-30, 57]], n: 3, // (along the bank's front, not over its roof)
      barks: ['Thirty floors by spring.'] },
  ],

  build(P) {
    // --- the street grid: avenues and sidewalks (every year), the lagoon over them in 2196 ---------------------------
    ground(P, [-110, -110, 110, 110], 0, 'asphalt');
    for (const r of ROADS) {
      for (const s of [-1, 1]) {
        terrace(P, [r + s * 7, -110, r + s * 11, 110], 0.15, 'pavement', { wall: 'kerb', sides: s < 0 ? 'E' : 'W' });
        terrace(P, [-110, r + s * 7, 110, r + s * 11], 0.15, 'pavement', { wall: 'kerb', sides: s < 0 ? 'S' : 'N' });
      }
    }
    P.E('FUTURE', () => {
      P.plane(-110, -110, 110, 110, SEA, 'lagoonWater', { noShadow: 1 });
      for (let i = 0; i < 40; i++) P.tree('reeds', P.rng.float(-108, 108), P.rng.float(-108, 108), P.rng.float(0.9, 1.4), { y: 0.2, solid: false });
    });
    // the deep channels (the avenues' carriageways) take you back in 2196; but for one crossing, where the bank's
    // avenue meets the line's: the old crosswalk, under knee-deep water like the sidewalks, poled by the survivors. It is
    // how a walker from the platform reaches the bank's fallen lift car in 2196 (v2.1 playtest F09: before, only a dash
    // through 2049 got there, on a Chronolith that ran out half way)
    for (const r of ROADS) {
      if (r === 0) for (const [z0, z1] of [[-110, XING[0]], [XING[1], 110]]) P.drown([r - 7, z0, r + 7, z1], 1.4, '@FUTURE');
      else P.drown([r - 7, -110, r + 7, 110], 1.4, '@FUTURE');
      P.drown([-110, r - 7, 110, r + 7], 1.4, '@FUTURE');
    }
    P.E('FUTURE', () => {
      // the crossing's poles, a rag tied to each, and the rubble the survivors laid along its edges
      for (let x = -8; x <= 8; x += 4) for (const z of [XING[0] + 0.2, XING[1] - 0.2]) {
        P.cyl(x, 0.15, z, 0.07, 2.4, 'timber', { seg: 5 });
        P.obox(x + 0.2, 2.1, z, 0.4, 0.5, 0.04, 0, 'awningRed', { rz: 0.3 });
      }
      for (let x = -6; x <= 6; x += 3) for (const z of [XING[0] - 0.3, XING[1] + 0.3]) P.obox(x, 0.1, z, 2.2, 0.5, 0.5, P.rng.float(-0.2, 0.2), 'concreteStained', { rx: P.rng.float(-0.15, 0.15) });
      // (a board on a post at the crossing's east end, toward the platform the walker comes from)
      P.cyl(10.6, 0.15, XING[0] + 2, 0.07, 2.0, 'timber', { seg: 5 });
      sign(P, 'SAFE TO WADE', 10.7, 2.15, XING[0] + 2, Math.PI / 2, { size: 0.26, color: '#f4ead8', boardMat: 'timber' });
    });
    P.challenge('channels', [-110, -110, 110, 110], ['FUTURE'], ['The avenues are canals. Too deep to wade.', 'The old sidewalks are a step higher: the water only reaches my knees there.', 'Walk the sidewalks along the edges of the blocks, or take the viaduct.'], { optional: true });
    // --- the blocks: towers and podiums, one layout, three years -------------------------------------------------
    const cells = [-110, -49, 11, 71, 110];
    let n = 0;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x0 = cells[i] + (i ? 4 : 0), x1 = cells[i + 1] - (i < 3 ? 15 : 0);
      const z0 = cells[j] + (j ? 4 : 0), z1 = cells[j + 1] - (j < 3 ? 15 : 0);
      if (x1 - x0 < 20 || z1 - z0 < 20) continue;
      if (x0 < VX + 6 && x1 > VX - 6) continue; // (the viaduct's blocks are open lots)
      if (i === 1 && j === 0) continue; // the plaza
      if (i === 0 && j === 3) continue; // the bank (below)
      if (i === 0 && j === 2) continue; // where the fallen tower lies
      n++;
      // (the growth on the faces seen from the viaduct and the avenues: toward the line, and south toward the arrival)
      const fc = ((x0 + x1) / 2 < VX ? 'E' : 'W') + 'S' + ((z0 + z1) / 2 < -40 ? 'N' : '');
      tower(P, [x0 + 2, z0 + 2, x1 - 2, z1 - 2], 40 + ((n * 37) % 50), { frame: n % 2 === 0, tint: [0xffffff, 0xe0e8e4, 0xd8e0e8, 0xe8e0d8][n % 4], faces: fc });
    }
    // --- Q0: the arrival platform on the viaduct, the bank tower and its roof garden, the fallen tower ------------------
    P.land('arrivalPlatform', VX, VY, 92, Math.PI);
    // the line's signal gantry over the viaduct, just ahead of the platform (rusted, ivied in 2196)
    // (closing: visuals; painted steel while the line runs, rust and flaking in 2196, not a black frame in every year)
    for (const s of [-1, 1]) P.col([VX + s * 4.6 - 0.3, VY, 81.7, VX + s * 4.6 + 0.3, VY + 6.4, 82.3]);
    for (const [yrs, m] of [[['PRESENT', 'PAST'], 'signGreen'], [['FUTURE'], 'rust']]) P.E(yrs, () => {
      for (const s of [-1, 1]) P.vbox([VX + s * 4.6 - 0.3, VY, 81.7, VX + s * 4.6 + 0.3, VY + 6.4, 82.3], m);
      P.vbox([VX - 4.9, VY + 5.6, 81.6, VX + 4.9, VY + 6.6, 82.4], m);
      for (const s of [-1, 1]) P.obox(VX + s * 3.9, VY + 4.9, 82, 0.12, 1.6, 0.12, 0, m, { rz: s * 0.785 }); // (the knee braces)
    });
    // (lit while the line runs; in 2196 the line has been dead for a century and a half: dark lamps, one head hanging)
    for (const dx of [-2, 0, 2]) {
      P.vbox([VX + dx - 0.35, VY + 4.3, 81.9, VX + dx + 0.35, VY + 5.6, 82.3], 'signBoard', { e: dx === 2 ? ['PRESENT', 'PAST'] : null });
      P.E(['PRESENT', 'PAST'], () => P.sphere(VX + dx, VY + 5.2, 82.35, 0.14, 'lampGlow'));
      P.E('FUTURE', () => P.sphere(VX + dx, VY + 5.2, 82.35, 0.14, 'ironDark'));
    }
    P.E('FUTURE', () => {
      P.vbox([VX - 4.9, VY + 3.2, 81.5, VX - 3.9, VY + 6.6, 82.5], 'ivy', { noShadow: 1 });
      P.obox(VX + 2.4, VY + 3.6, 82.1, 0.7, 1.3, 0.4, 0, 'signBoard', { rz: 0.9 }); // (the third head hangs off its bracket)
    });
    P.land('partsList', VX - 1.6, VY, 84, Math.PI / 2);
    P.land('bankTower', -60, 0, 64, 0);
    // the bank's outside lift on its east face: in 2196 its car lies at the foot of the shaft (Mission 14 reverses it)
    P.land('liftCar', -41.6, 0.15, 69.5, -Math.PI / 2);
    P.land('roofGarden', -56, 24, 76, 0); // (on the bank's roof terrace, west of the lift's landing)
    P.land('bankTerrace', -92, 24, 70, Math.PI / 2); // (the roof terrace's far end, under the set-back tower)
    P.land('fallenTower', -92, 0, 40, -Math.PI / 2);
    // the bank: six storeys to a roof terrace at 24 m, its tower set back above
    // (its six storeys: brick and tall windows in 2026 and 2049; in 2196 the same frame broken and grown over)
    P.col([-106, 0, 60, -44, 24, 106]);
    P.E(['PRESENT', 'PAST'], () => P.vbox([-106, 0, 60, -44, 24, 106], 'rainBrick', { t: 0xe0d0c0 }));
    P.E('FUTURE', () => {
      P.vbox([-106, 0, 60, -44, 24, 106], 'ruinFacade', { t: 0xf0ece4 });
      for (const [x0, x1] of [[-102, -92], [-84, -74], [-64, -54]]) P.vbox([x0, 9, 59.86, x1, 24.3, 59.9], 'vineSheet');
      for (const z0 of [64, 82, 96]) P.vbox([-43.9, 8, z0, -43.86, 24.3, z0 + 8], 'vineSheetDark');
      for (let x = -100; x < -48; x += 10) P.tree('ivy', x, 59.6, 0.9, { y: 24, solid: false });
    });
    P.blocks.push([-106, 60, -44, 106]);
    P.reserve(-106, 60, -44, 106);
    P.setTerrain(-106, 60, -44, 106, 24);
    P.E(['PRESENT', 'PAST'], () => P.vbox([-104, 0, 59.8, -46, 22, 60], 'rainGlass', { noShadow: 1 }));
    P.E(['PRESENT', 'PAST'], () => P.vbox([-104, 24, 84, -80, 70, 104], 'rainGlass', { t: 0xd8e0e8 }));
    P.E('FUTURE', () => {
      P.vbox([-104, 24, 84, -80, 52, 104], 'ruinFacade');
      P.vbox([-96, 34, 83.86, -86, 52.3, 83.9], 'vineSheet');
      P.plane(-104, 62, -46, 82, 24.05, 'roofGarden', { noShadow: 1 });
      for (let i = 0; i < 10; i++) P.tree(i % 2 ? 'birch' : 'willow', P.rng.float(-100, -50), P.rng.float(64, 80), P.rng.float(0.9, 1.3), { y: 24 });
    });
    railing(P, -106, 60, -44, 60, 1.1, 'rust', { y: 24, openings: [[54, 62]] });
    railing(P, -44, 60, -44, 106, 1.1, 'rust', { y: 24, openings: [[7.6, 11.4]] }); // (the lift's landing)
    // the lift's shaft: two guide rails up the bank's east face, and the landing's sill at the roof
    for (const z of [67.7, 71.3]) P.vbox([-40.2, 0, z - 0.12, -39.96, 26, z + 0.12], 'rust', { noShadow: 1 });
    P.box([-44, 23.6, 67.8, -43.2, 24, 71.2], 'concreteStained');
    sign(P, 'RAIN CITY SAVINGS', -75, 23, 59.7, Math.PI, { size: 0.9, board: 0, color: '#d8c8a0', e: ['PRESENT', 'PAST'] });
    // the fallen tower: in 2196 a tower lies across the block like a ramp onto the bank's terrace
    tower(P, [-106, 4, -64, 42], 70, { tint: 0xd8e0e8, only: ['PRESENT', 'PAST'] });
    P.E('FUTURE', () => {
      P.box([-106, 0, 4, -64, 8, 42], 'concreteStained');
      ramp(P, [-106, 48, -46, 56], 0, 24, 'E', 'ruinFacade', { terrain: false });
      P.box([-52, 23.6, 48, -44, 24, 62], 'ruinFacade');
      P.obox(-76, 3, 52, 64, 8, 12, 0, 'ruinFacade', { rz: Math.atan2(24, 60), t: 0xd8dccc });
      for (let i = 0; i < 8; i++) P.tree('ivy', -100 + i * 7, 52 + (i % 2 ? 4.6 : -4.6), 0.8, { y: 2.6 + i * 2.8, solid: false });
      for (let i = 0; i < 4; i++) P.tree('roots', -98 + i * 14, 46.4, 1.1, { y: 3 + i * 5.6, solid: false });
    });
    // --- Q1: the viaduct (Line 41), its fallen span in 2196 (the transit bridge), the low-water path below ------------
    for (const [z0, z1] of [[-110, -24], [-4, 110]]) viaduct(P, VX, z0, VX, z1, VY, 7, 'viaductDeck', { span: 12, walk: true, under: true });
    P.E(['PRESENT', 'PAST'], () => viaduct(P, VX, -24, VX, -4, VY, 7, 'viaductDeck', { span: 10, walk: true, under: true }));
    P.E('FUTURE', () => {
      // the span has fallen into the canal: its pieces in the water
      for (let i = 0; i < 4; i++) P.obox(VX + P.rng.float(-3, 3), -0.6, -22 + i * 5, 7, 1.2, 4.6, P.rng.float(-0.3, 0.3), 'viaductDeck', { rx: P.rng.float(-0.3, 0.3), rz: P.rng.float(-0.3, 0.3) });
    });
    // (2196: the line is the survivors' high street: grass along its edges, ivy over its parapets)
    P.E('FUTURE', () => {
      for (const [z0, z1] of [[-110, -24], [-4, 110]]) for (const sx of [-1, 1]) P.plane(VX + sx * 3.35, z0, VX + sx * 2.2, z1, VY + 0.03, 'meadowLong', { noShadow: 1 });
      for (let z = -100; z < 106; z += 13) if (z < -26 || z > -2) P.tree('ivy', VX + ((z / 13) % 2 ? 3.3 : -3.3), z, 0.55, { y: VY, solid: false });
    });
    railing(P, VX - 3.4, -110, VX - 3.4, 110, 1.1, 'rust', { y: VY, openings: [[38, 42], [86, 106], [214, 220]] });
    railing(P, VX + 3.4, -110, VX + 3.4, 110, 1.1, 'rust', { y: VY, openings: [[76, 84], [86, 106]] }); // (onto the survivors' platform; the fallen span)
    P.land('viaduct', VX, VY, 40, Math.PI);
    P.land('viaductMid', VX, VY, 12, Math.PI);
    P.land('transitBridge', VX, VY, -14, Math.PI);
    P.land('lowWaterPath', VX - 9, 0.15, -14, Math.PI);
    P.land('antenna', VX + 18, VY, -30, 0);
    P.land('stackedStones', VX - 9, 0.15, 6, 0);
    P.land('unstableZones', 9, 0.15, -20, Math.PI / 2);
    // the stairs up to the viaduct (south and at the plaza)
    stair(P, VX - 6, 90, 0, VX - 6, 107, VY, 3, 'viaductDeck', { rail: 'rust' });
    P.box([VX - 8, VY - 0.4, 104, VX - 2, VY, 110], 'viaductDeck');
    // down from the viaduct onto the old Helix Plaza (1.6 m)
    stair(P, 8, -70, 1.6, 25.6, -70, VY, 4, 'viaductDeck', { rail: 'rust' });
    P.box([24, VY - 0.4, -72, VX - 3, VY, -68], 'viaductDeck');
    // the survivors' platform on the viaduct with the antenna, and a rope bridge to a tower's garden
    P.box([VX + 3.5, VY - 0.4, -36, VX + 22, VY, -24], 'pontoonWood');
    P.E('FUTURE', () => { P.cyl(VX + 18, VY, -30, 0.1, 9, 'rust', { seg: 6 }); prop(P, 'tarp', VX + 10, -30, 0, { y: VY, m: 'tarpScav' }); });
    P.E('PRESENT', () => {
      // the 41 on the viaduct at midday
      for (let i = 0; i < 3; i++) P.obox(VX, VY + 0.3, 30 + i * 13, 3.2, 3.6, 12.4, 0, 'trainBody');
      for (const [x, z] of [[-6, 40], [6, -30], [-66, -20], [54, 50], [66, -66]]) prop(P, 'car', x, z, 0);
      for (const z of [80, 20, -40]) prop(P, 'busShelter', -12, z, Math.PI / 2, { y: 0.15 });
    });
    // unstable zones: shimmering patches where the street flickers between years
    // (a soft pool of light, not a flat lit disc that read as a decal on the street)
    for (const [x, z, r] of [[6, -10, 5], [-30, 8, 4], [56, 30, 4.5], [-6, -30, 3.5]]) P.glow(x, 0.2, z, r * 1.3, 0xc9b8ff);
    for (const [x, z] of [[VX - 9, 6], [VX - 9, -26], [-12, 9]]) P.E('FUTURE', () => { for (let i = 0; i < 3; i++) P.box([x - 0.3 + i * 0.05, 0.15 + i * 0.25, z - 0.25, x + 0.3 - i * 0.05, 0.4 + i * 0.25, z + 0.25], 'riverStone', { solid: false }); });
    // --- Q2: the memorial on the old Helix Plaza, Sera's school, the statue ------------------------------------------
    terrace(P, [-46, -104, 8, -60], 1.6, 'limestonePave', { wall: 'concreteStained', sides: 'NESW', cap: 'limestoneBlock' });
    stair(P, -19, -55.5, 0.15, -19, -60, 1.6, 10, 'limestonePave');
    P.land('plazaSteps', 7, 1.6, -70, -Math.PI / 2);
    P.land('seraSteps', -19, 1.6, -61.5, Math.PI);
    P.land('memorial', -19, 1.6, -82, 0);
    P.land('flowers', -16, 1.6, -78.6, 0);
    P.land('kaiStatue', -34, 1.6, -82, Math.PI / 2);
    P.land('seraSchool', 0, 1.6, -96, Math.PI);
    P.land('gardenChannel', -40, 1.6, -64, 0);
    P.land('mossPrints', 4, 1.6, -66, 0);
    // 2196: the memorial, a long black stone with the name, and the statue of Kai in stone on a plinth; Sera's school,
    // an open schoolroom under a canopy at the back of the plaza. (The plaza becomes the memorial only in 2196: in 2026
    // and 2049 it is the old Helix Plaza, its fountain and its name.)
    P.E('FUTURE', () => {
      P.box([-27, 1.6, -84, -11, 4.6, -82.6], 'basalt');
      P.box([-35.5, 1.6, -83.5, -32.5, 3.2, -80.5], 'statueStone'); // (the statue on it is Kai himself, in stone: M14's overlay)
      P.box([-17, 1.6, -79, -15, 1.9, -78], 'flowersStall', { solid: false });
      for (let i = 0; i < 6; i++) P.tree('ivy', -44 + i * 8, -102, 0.7, { y: 1.6, solid: false });
      P.box([-12, 1.6, -104, 8, 5.4, -100], 'concreteStained');
      P.vbox([-14, 5.4, -104, 10, 5.7, -92], 'pontoonWood');
      for (const x of [-12, 8]) P.cyl(x, 1.6, -92, 0.15, 3.8, 'pontoonWood', { seg: 6, solid: true });
      for (let i = 0; i < 4; i++) P.box([-8 + i * 4, 1.6, -97, -6 + i * 4, 2.3, -96], 'pontoonWood');
    });
    // (the school is the Helix entrance canopy at the back of the plaza, patched with timber: in 2026 and 2049 it is
    // still the company's, steel over the glass front of the lobby)
    P.E(['PRESENT', 'PAST'], () => {
      P.box([-12, 1.6, -104, 8, 5.4, -100], 'rainGlass');
      P.vbox([-14, 5.4, -104, 10, 5.7, -92], 'steel');
      for (const x of [-12, 8]) P.cyl(x, 1.6, -92, 0.15, 3.8, 'steel', { seg: 6, solid: true });
    });
    sign(P, 'KAI VAREN', -19, 4.0, -82.5, 0, { size: 0.5, board: 0, color: '#e8e4dc', e: ['FUTURE'] });
    sign(P, 'ARCHITECT OF THE FRACTURE', -19, 3.3, -82.5, 0, { size: 0.32, board: 0, color: '#c8c4bc', e: ['FUTURE'] });
    P.E(['PRESENT', 'PAST'], () => {
      // the Helix Plaza: the fountain where the memorial will stand, the company's name over the steps, planters
      P.cyl(-19, 1.6, -84, 3.4, 0.7, 'limestoneBlock', { seg: 20, solid: true });
      P.disc(-19, 2.25, -84, 3.1, 'fountainWater', { noShadow: 1 });
      P.cyl(-19, 2.3, -84, 0.35, 2.4, 'limestoneBlock', { seg: 10 });
      for (const x of [-40, -30, 0, 6]) P.box([x - 1.2, 1.6, -100, x + 1.2, 2.3, -98], 'limestoneBlock');
    });
    sign(P, 'HELIX PLAZA', -19, 1.95, -80.55, 0, { size: 0.32, board: 0, color: '#3a4450', e: ['PRESENT', 'PAST'] }); // (cut in the fountain's rim)
    // the garden channel: dry in 2049, running in 2196 when it has been opened
    P.vbox([-42, 1.5, -100, -38, 1.62, -64], 'riverStone', { noShadow: 1 });
    P.E('FUTURE', () => P.vbox([-41.6, 1.62, -100, -38.4, 1.66, -64], 'lagoonWater', { noShadow: 1, w: 'water_route || garden_restored' }));
    void block;
    void bridge;
  },
};
