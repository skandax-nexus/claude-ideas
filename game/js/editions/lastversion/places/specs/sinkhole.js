// The quarry-sinkhole museum (Mission 16, THE MUSEUM OF FAILED WORLDS; OVERHAUL.md §5 M16, D3). The museum
// stays underground and keeps its sky: cut into the terraced walls of a round quarry on Rain City's eastern
// edge (the quarry that built Old Town), 120 m across and 38 m deep, its gallery caves along a 430 m ramp
// spiralling down; hanging gardens and a waterfall from the north rim; at the bottom a pool and the
// Comparison Hall under a glass lens; behind the waterfall the deepest cave and the way into the catacomb.
// 2196: dusk, the rim golden and the depths blue, lanterns along the ramp. 2026: the quarry working at noon,
// dust, trucks, cut blocks. 2049: the quarry flooded as a lake with a Helix storage barge, the lower caves
// under water and pontoons out to the barge.
//   Q0 THE RIM & THE FIRST MEMORY  the south rim and the ramp's first bend
//   Q1 THE SPIRAL                  the ramp's middle turn (east and north)
//   Q2 THE COMPARISON HALL         the floor of the quarry
//   Q3 THE PHOTOGRAPH              the north wall behind the waterfall
import { ground, railing, prop, sign, canopy } from '../archetypes.js';

const RIM = 26, FLOOR = -12, LAKE = -2;
const A0 = 90, A1 = 630, R0 = 55, R1 = 37; // the ramp: from the south rim (90°) round one and a half turns to the north
const W = 6; // the ramp's width
const deg = Math.PI / 180;
const rAt = (a) => R0 - ((R0 - R1) * (a - A0)) / (A1 - A0);
const yAt = (a) => RIM - ((RIM - FLOOR) * (a - A0)) / (A1 - A0);
const pt = (a, r = rAt(a)) => [Math.cos(a * deg) * r, Math.sin(a * deg) * r];
const ALCOVES = [['alcove1', 150], ['alcove2', 300], ['alcove3', 420]];
const CAVES = [...ALCOVES, ['photoCave', 627]]; // (the deepest cave, the photograph's, where the ramp reaches the floor)

// the spiral (D10's custom helper): the ramp in 3° pieces (a smooth slab over a stair of 0.2 m rises), its inner
// parapet, and the quarry's terraced rock face between it and the turn above, with the caves cut into it
function spiral(P) {
  const step = 3;
  const cave = (a) => CAVES.some(([, c]) => Math.abs(a - c) < 5.5);
  for (let a = A0; a < A1; a += step) {
    const am = a + step / 2, r = rAt(am), y0 = yAt(a), y1 = yAt(a + step);
    const [x, z] = pt(am);
    const len = (2 * Math.PI * r * step) / 360 + 0.08;
    const ry = -am * deg; // local z along the tangent, local x along the radius
    // the visible slab, and the rock under it down to the floor (the terrace the ramp is cut into)
    P.obox(x, (y0 + y1) / 2 - 0.35, z, W, 0.35, len, ry, 'rampStone', { noShadow: 1 });
    const [ux, uz] = pt(am, r - 0.1);
    P.obox(ux, FLOOR, uz, W + 0.2, Math.max(0.2, (y0 + y1) / 2 - 0.35 - FLOOR), len + 0.1, ry, 'quarryCut');
    // its colliders: two half-width pieces, each the box round its turned rectangle, at the upper end's height
    for (const dr of [-W / 4, W / 4]) {
      const [cx, cz] = pt(am, r + dr);
      const c = Math.abs(Math.cos(ry)), sn = Math.abs(Math.sin(ry));
      const hx = (W / 4) * c + (len / 2) * sn, hz = (W / 4) * sn + (len / 2) * c;
      P.col([cx - hx, y0 - 1.2, cz - hz, cx + hx, Math.max(y0, y1), cz + hz]);
    }
    // the inner parapet
    const [ix, iz] = pt(am, r - W / 2 - 0.2);
    if (a < 618) { // (at the foot the ramp opens onto the floor)
      P.obox(ix, Math.max(y0, y1), iz, 0.3, 1.0, len, ry, 'quarryCut', { noShadow: 1 });
      P.col([ix - 1.3, y1, iz - 1.3, ix + 1.3, y1 + 1.6, iz + 1.3]);
    }
    // the rock face from this turn up to the one above (or the rim), outside the ramp
    const above = a - 360 >= A0 ? yAt(a - 360) - 0.4 : RIM;
    const rOut = a - 360 >= A0 ? rAt(am - 360) - W / 2 - 0.2 : 62;
    const fr = (r + W / 2 + rOut) / 2, fw = Math.max(1, rOut - r - W / 2);
    const [fx, fz] = pt(am, fr);
    if (!cave(am)) {
      P.obox(fx, y1 - 0.5, fz, fw, above - y1 + 0.5, len + 0.6, ry, 'quarryRock');
      const [wx, wz] = pt(am, r + W / 2 + 1.0);
      P.col([wx - 1.4, y1, wz - 1.4, wx + 1.4, above, wz + 1.4]);
    } else {
      // a cave: rock above it, open to the ramp, 6 m deep
      P.obox(fx, y1 + 4.2, fz, fw, Math.max(0.5, above - y1 - 4.2), len + 0.6, ry, 'quarryRock');
      const [bx, bz] = pt(am, r + W / 2 + 6.6);
      P.col([bx - 1.4, y1, bz - 1.4, bx + 1.4, y1 + 4.4, bz + 1.4]);
      P.plane(...[pt(am, r + W / 2)[0] - 1.4, pt(am, r + W / 2)[1] - 1.4, pt(am, r + W / 2 + 6)[0] + 1.4, pt(am, r + W / 2 + 6)[1] + 1.4], y1 + 0.02, 'quarryFloor', { noShadow: 1 });
    }
  }
  // the caves' side walls (radial, 6 m deep) and floors
  for (const [, c] of CAVES) {
    for (const e of [c - 6, c + 6]) {
      const r = rAt(e), y = yAt(e);
      const [x, z] = pt(e, r + W / 2 + 3);
      P.obox(x, y - 0.2, z, 6, 4.6, 0.8, -e * deg, 'quarryRock', { solid: true });
    }
    const r = rAt(c), y = yAt(c);
    const [x, z] = pt(c, r + W / 2 + 3);
    P.col([x - 3, y - 1, z - 3, x + 3, y, z + 3]);
  }
}

export default {
  key: 'sinkhole', style: 'quarry', sameAs: null, name: 'THE MUSEUM OF FAILED WORLDS',
  bounds: [-75, -75, 75, 75],
  edges: { N: 'hill', E: 'hill', W: 'hill', S: 'meadow' },
  killY: -13,
  primary: 'lensHall',
  backdrop: { notch: 'clear', ridge: 'E' },
  years: {
    FUTURE: { sky: 'quarryDusk', era: '2196', hour: 18.8, sun: { elev: 3, az: 285 }, fog: 0x3a3848, density: 1.2, night: 0.35, weather: 'steam', ibl: 'dusk', lit: 0.8,
      hemi: { sky: 0xffb878, ground: 0x1a2030, k: 0.8 }, sunColor: 0xffb070, sunK: 1.0, grade: { shadowTint: 0x14303a, highlightTint: 0xffcc8a, toning: 0.22, contrast: 1.12, saturation: 1.04 } },
    PAST: { sky: 'dustNoon', era: '2026', hour: 12.4, sun: { elev: 68, az: 175 }, fog: 0xd8c8a8, density: 1.5, night: 0, weather: 'motes', ibl: 'plant', lit: 0,
      hemi: { sky: 0xe8dcc0, ground: 0xa89878, k: 1.0 }, sunColor: 0xfffaf0, sunK: 1.3, grade: { shadowTint: 0x4a3a28, highlightTint: 0xfff4e0, toning: 0.14, contrast: 1.08, saturation: 0.9 } },
    PRESENT: { sky: 'lakeGrey', era: '2049', hour: 9.6, sun: { elev: 24, az: 120 }, fog: 0x9aaab4, density: 1.1, night: 0.1, weather: null, ibl: 'night', lit: 0.2,
      hemi: { sky: 0xc4d0d6, ground: 0x4a5a60, k: 0.9 }, sunColor: 0xe8eef4, sunK: 0.7, grade: { shadowTint: 0x1c2a34, highlightTint: 0xe8f0f4, toning: 0.1, contrast: 1.06, saturation: 0.86 } },
  },
  quarters: [
    { name: 'THE RIM & THE FIRST MEMORY', area: [-75, 30, 75, 75], spawnAt: 'rimGate', threshold: { at: 'spiralBend', kind: 'ramp' } },
    { name: 'THE SPIRAL', area: [0, -75, 75, 30], spawnAt: 'spiralBend', threshold: { at: 'spiralLow', kind: 'ramp' } },
    { name: 'THE COMPARISON HALL', area: [-34, -34, 34, 34], spawnAt: 'spiralLow', threshold: { at: 'waterfall', kind: 'water' } },
    { name: 'THE PHOTOGRAPH', area: [-75, -75, 0, 0], spawnAt: 'waterfall', threshold: null },
  ],
  beatAt: { m16: ['alcove1', 'reel', 'deductionBoard'] },
  exits: { m16: 'photoAlcove' },
  frags: { m16: [['entranceHall', 'rimBench', 'alcove1Case'], ['alcove2', 'alcove3', 'shatteredCase']] },
  crowd: [
    { era: 'future', years: ['FUTURE'], region: 'museum', role: 'visitor', path: [[-20, 66], [20, 66]], y: RIM, n: 3, echo: true },
    { era: 'present', years: ['PAST'], region: 'quarry', role: 'quarryman', path: [[-14, 10], [14, 10], [14, -10]], y: FLOOR, n: 4 },
  ],

  build(P) {
    // --- the rim (26 m) round the hole, the quarry's floor (-12 m) ----------------------------------------------------
    for (let i = 0; i < 25; i++) for (let j = 0; j < 25; j++) {
      const x0 = -75 + i * 6, z0 = -75 + j * 6;
      if (Math.hypot(x0 + 3, z0 + 3) < 61) continue;
      P.box([x0, RIM - 1, z0, x0 + 6, RIM, z0 + 6], 'meadowLong', { noShadow: 1 });
    }
    P.setTerrain(-75, -75, 75, 75, RIM);
    P.box([-75, FLOOR - 1, -75, 75, FLOOR - 0.6, 75], 'rock', { vis: false });
    ground(P, [-34, -34, 34, 34], FLOOR, 'quarryFloor');
    P.setTerrain(-34, -34, 34, 34, FLOOR);
    for (let i = 0; i < 36; i++) {
      const a = i * 10;
      const [x, z] = pt(a, 66);
      P.obox(x, RIM - 30, z, 12, 30, 12, -a * deg, 'quarryRock');
    }
    spiral(P);
    P.box([-5, RIM - 1, 54, 5, RIM, 64], 'meadowLong', { noShadow: 1 }); // the ramp's head, onto the rim
    // the rim's parapet, open at the ramp's head and at the waterfall
    for (let i = 0; i < 48; i++) {
      const a = i * 7.5 + 3.75;
      if (Math.abs(a - 90) < 8 || Math.abs(a - 270) < 6) continue;
      const [x, z] = pt(a, 61.4);
      P.obox(x, RIM, z, 0.4, 1.1, 8.2, -a * deg, 'quarryCut', { noShadow: 1 });
      P.col([x - 0.5, RIM, z - 0.5, x + 0.5, RIM + 1.6, z + 0.5]);
    }
    // --- Q0: the gate and the entrance hall on the south rim ------------------------------------------------------
    P.land('rimGate', 0, RIM, 66, Math.PI);
    // the museum's gate on the rim: two cut-stone piers and a lintel, the hole framed beyond
    for (const s of [-1, 1]) P.box([s * 3.4 - 0.7, RIM, 61.3, s * 3.4 + 0.7, RIM + 6.6, 62.7], 'quarryCut');
    P.box([-4.4, RIM + 5.6, 61.1, 4.4, RIM + 6.9, 62.9], 'quarryCut', { solid: false });
    P.E('FUTURE', () => sign(P, 'THE MUSEUM OF FAILED WORLDS', 0, RIM + 6.25, 62.95, 0, { size: 0.32, color: '#ffc27a', board: 0 }));
    P.land('rimBench', 18, RIM, 64, Math.PI);
    P.land('entranceHall', -22, RIM, 68, Math.PI);
    P.land('spiralBend', ...pt(220).slice(0, 1), yAt(220), pt(220)[1], (-220 + 90) * deg);
    P.land('spiralLow', ...pt(560).slice(0, 1), yAt(560), pt(560)[1], (-560 + 90) * deg);
    for (const [name, a] of ALCOVES) {
      const [x, z] = pt(a, rAt(a) + W / 2 + 3.4);
      P.land(name, x, yAt(a), z, (-a + 90) * deg + Math.PI);
      P.land(`${name}Case`, ...pt(a + 2.5, rAt(a) + W / 2 + 4.6).slice(0, 1), yAt(a), pt(a + 2.5, rAt(a) + W / 2 + 4.6)[1], (-a + 90) * deg + Math.PI);
    }
    // the entrance hall: seventeen halls of finished worlds, a hundred cases labelled UNFINISHED (2196)
    P.E('FUTURE', () => {
      P.box([-40, RIM, 66, -6, RIM + 5, 74], 'quarryCut');
      P.vbox([-40, RIM + 5, 64, -6, RIM + 5.3, 74], 'glassRoof');
      for (let i = 0; i < 10; i++) prop(P, 'crate', -38 + i * 3.3, 64.4, 0, { y: RIM, m: 'caseGlass' });
      sign(P, 'THE MUSEUM OF FAILED WORLDS', -23, RIM + 3.4, 65.9, Math.PI, { size: 0.5, color: '#ffc27a', board: 0 });
      // lanterns along the ramp
      for (let a = A0 + 10; a < A1; a += 24) { const [x, z] = pt(a, rAt(a) - W / 2 + 0.4); P.cyl(x, yAt(a), z, 0.06, 1.8, 'ironDark', { seg: 5, prop: 1 }); P.sphere(x, yAt(a) + 1.9, z, 0.18, 'lanternGlow', { prop: 1 }); }
      // the hanging gardens over the rock faces
      for (let i = 0; i < 18; i++) { const a = i * 20 + 5; const [x, z] = pt(a, 61); P.obox(x, RIM - 9, z, 0.4, 9, 6, -a * deg, 'vineCurtain', { noShadow: 1 }); }
    });
    P.E('PAST', () => {
      // the working quarry: cut blocks, a crane, trucks on the ramp
      for (let i = 0; i < 8; i++) P.box([-24 + i * 6, FLOOR, -6 + (i % 3) * 4, -20 + i * 6, FLOOR + 1.6, -3 + (i % 3) * 4], 'quarryCut');
      for (const a of [180, 330, 470]) { const [x, z] = pt(a); prop(P, 'car', x, z, (-a + 90) * deg, { y: yAt(a), m: 'craneYellow' }); }
      P.obox(20, FLOOR, 20, 1.4, 34, 1.4, 0, 'craneYellow', { solid: true });
      P.obox(20, FLOOR + 34, 8, 1, 1, 28, 0, 'craneYellow');
      prop(P, 'siteHut', 10, 66, 0, { y: RIM });
      for (let i = 0; i < 6; i++) prop(P, 'tarp', -20 + i * 8, 22, i, { y: FLOOR });
    });
    // --- Q1 / the lake (2049): the water, the Helix barge, the pontoons ----------------------------------------------
    P.land('pontoons', ...pt(490).slice(0, 1), yAt(490), pt(490)[1], 0);
    P.land('reel', ...pt(302, rAt(302) + W / 2 + 4).slice(0, 1), yAt(302), pt(302, rAt(302) + W / 2 + 4)[1], (-302 + 90) * deg + Math.PI);
    P.land('shatteredCase', ...pt(418, rAt(418) + W / 2 + 4).slice(0, 1), yAt(418), pt(418, rAt(418) + W / 2 + 4)[1], (-418 + 90) * deg + Math.PI);
    P.E('PRESENT', () => {
      P.disc(0, LAKE, 0, 47, 'lakeWater', { seg: 48, noShadow: 1 });
      P.box([-6, LAKE - 1, -14, 14, LAKE + 1.2, 2], 'containerGrey');
      P.vbox([-4, LAKE + 1.2, -12, 12, LAKE + 4, 0], 'helixWhite');
      sign(P, 'HELIX STORAGE', 4, LAKE + 3, 0.1, 0, { size: 0.5, color: '#3a4a5a', board: 0 });
      const [px, pz] = pt(490);
      P.box([Math.min(px, 6), LAKE - 0.3, pz - 1.4, Math.max(px, 6), LAKE + 0.1, pz + 1.4], 'pontoonWood');
    });
    P.drown([-46, -46, 46, 46], LAKE - 0.4, '@PRESENT');
    // --- Q2: the floor: the pool, the Comparison Hall under its lens ------------------------------------------------
    P.land('lensHall', 0, FLOOR, 4, Math.PI);
    P.land('deductionBoard', 0, FLOOR, -4, 0);
    P.land('choiceCases', 8, FLOOR, 0, -Math.PI / 2);
    P.E('FUTURE', () => {
      P.disc(0, FLOOR + 0.04, 22, 9, 'poolWater', { noShadow: 1 });
      for (let i = 0; i < 10; i++) { const a = i * 36; P.cyl(Math.cos(a * deg) * 10, FLOOR, Math.sin(a * deg) * 10, 0.25, 6, 'bronzeAged', { seg: 8, solid: true }); }
      P.dome(0, FLOOR + 6, 0, 10.6, 3.2, 'lensGlass', { seg: 28 });
      P.torus(0, FLOOR + 6, 0, 10.6, 0.25, 'bronzeAged', { rx: Math.PI / 2, seg: 40 });
      for (let i = 0; i < 6; i++) { const a = i * 60 + 30; P.box([Math.cos(a * deg) * 7 - 0.5, FLOOR, Math.sin(a * deg) * 7 - 0.5, Math.cos(a * deg) * 7 + 0.5, FLOOR + 1.1, Math.sin(a * deg) * 7 + 0.5], 'pontoonWood'); }
    });
    // --- Q3: the waterfall from the north rim, the deepest cave behind it, the catacomb's door --------------------------
    // (the cave is the spiral's last: it opens off the foot of the ramp, the falls coming down over its mouth)
    const [cx, cz] = pt(627, rAt(627) + W / 2 + 3.4), cy = yAt(627);
    P.land('waterfall', 0, FLOOR, -28, Math.PI);
    P.land('photoAlcove', cx, cy, cz, (-627 + 90) * deg + Math.PI);
    const [kx, kz] = pt(623, rAt(623) + W / 2 + 5);
    P.land('catacomb', kx, yAt(623), kz, (-623 + 90) * deg + Math.PI);
    P.E(['FUTURE', 'PRESENT'], () => {
      const [wx, wz] = pt(627, rAt(627) + W / 2 + 0.5);
      P.obox(wx, cy + 4.4, wz, 0.5, RIM - cy - 4, 9, -627 * deg, 'waterfallWater', { noShadow: 1 });
      P.cone(0, FLOOR, -32, 4.6, 5, 'spillwayFoam', { noShadow: 1, seg: 10 });
    });
    P.obox(kx, cy, kz, 1.4, 2.6, 0.12, -623 * deg, 'doorDark', { prop: 1 });
    for (let i = 0; i < 12; i++) P.tree('fern', P.rng.float(-30, 30), P.rng.float(-30, 30), P.rng.float(0.8, 1.3), { y: FLOOR, solid: false, e: ['FUTURE', 'PAST'] });
    void canopy;
    void railing;
  },
};
