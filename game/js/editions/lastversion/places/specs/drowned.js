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

// a tower: a podium in every year; above it glass (2049), glass or a steel frame and a crane (2026), broken
// glass under hanging gardens (2196)
function tower(P, [x0, z0, x1, z1], h, { frame = false, tint = 0xffffff, podium = 8 } = {}) {
  P.box([x0, 0, z0, x1, podium, z1], 'concreteStained', { t: tint });
  P.blocks.push([x0, z0, x1, z1]);
  P.reserve(x0, z0, x1, z1);
  const [ix0, iz0, ix1, iz1] = [x0 + 2, z0 + 2, x1 - 2, z1 - 2];
  P.E('PRESENT', () => P.vbox([ix0, podium, iz0, ix1, h, iz1], 'rainGlass', { t: tint }));
  P.E('PAST', () => {
    if (!frame) return P.vbox([ix0, podium, iz0, ix1, h * 0.85, iz1], 'rainGlass', { t: tint });
    // a steel frame of floors and columns, and a crane on top
    for (let y = podium + 4; y < h * 0.7; y += 4) P.vbox([ix0, y, iz0, ix1, y + 0.4, iz1], 'rawConcrete');
    for (const [cx, cz] of [[ix0, iz0], [ix1, iz0], [ix1, iz1], [ix0, iz1]]) P.vbox([cx - 0.4, podium, cz - 0.4, cx + 0.4, h * 0.7, cz + 0.4], 'scaffold');
    P.obox((ix0 + ix1) / 2, h * 0.7, (iz0 + iz1) / 2, 1.2, 18, 1.2, 0, 'craneYellow');
    P.obox((ix0 + ix1) / 2 + 10, h * 0.7 + 18, (iz0 + iz1) / 2, 30, 1, 1, 0, 'craneYellow');
  });
  P.E('FUTURE', () => {
    const top = h * (0.6 + ((x0 * 7 + z0 * 3) % 10) / 30);
    P.vbox([ix0, podium, iz0, ix1, top, iz1], 'towerGlass', { t: 0xc8d8c8 });
    // terraces of hanging gardens every few floors, vines down the faces
    for (let y = podium + 8; y < top; y += 12) P.vbox([ix0 - 1, y, iz0 - 1, ix1 + 1, y + 1.2, iz1 + 1], 'roofGarden');
    P.vbox([ix0 - 0.3, podium, iz0 + 2, ix0, top - 4, iz1 - 6], 'vineCurtain', { noShadow: 1 });
    P.vbox([ix1, podium, iz0 + 4, ix1 + 0.3, top - 8, iz1 - 2], 'vineCurtain', { noShadow: 1 });
    P.tree('birch', (ix0 + ix1) / 2, (iz0 + iz1) / 2, 1.6, { y: top, solid: false });
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
    { era: 'present', years: ['PRESENT'], region: 'rain', role: 'commuter', path: [[-4, 90], [-4, -90]], n: 6 },
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
    // the deep channels (the avenues' carriageways) take you back in 2196
    for (const r of ROADS) {
      P.drown([r - 7, -110, r + 7, 110], 1.4, '@FUTURE');
      P.drown([-110, r - 7, 110, r + 7], 1.4, '@FUTURE');
    }
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
      tower(P, [x0 + 2, z0 + 2, x1 - 2, z1 - 2], 40 + ((n * 37) % 50), { frame: n % 2 === 0, tint: [0xffffff, 0xe0e8e4, 0xd8e0e8, 0xe8e0d8][n % 4] });
    }
    // --- Q0: the arrival platform on the viaduct, the bank tower and its roof garden, the fallen tower ------------------
    P.land('arrivalPlatform', VX, VY, 92, Math.PI);
    // the line's signal gantry over the viaduct, just ahead of the platform (rusted, ivied in 2196)
    for (const s of [-1, 1]) P.box([VX + s * 4.6 - 0.3, VY, 81.7, VX + s * 4.6 + 0.3, VY + 6.4, 82.3], 'ironDark');
    P.vbox([VX - 4.9, VY + 5.6, 81.6, VX + 4.9, VY + 6.6, 82.4], 'ironDark');
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
    P.box([-106, 0, 60, -44, 24, 106], 'concreteStained', { t: 0xe8e0d8 });
    P.blocks.push([-106, 60, -44, 106]);
    P.reserve(-106, 60, -44, 106);
    P.setTerrain(-106, 60, -44, 106, 24);
    P.vbox([-104, 0, 59.8, -46, 22, 60], 'rainGlass', { noShadow: 1 });
    P.E(['PRESENT', 'PAST'], () => P.vbox([-104, 24, 84, -80, 70, 104], 'rainGlass', { t: 0xd8e0e8 }));
    P.E('FUTURE', () => {
      P.vbox([-104, 24, 84, -80, 52, 104], 'towerGlass');
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
    P.E(['PRESENT', 'PAST'], () => tower(P, [-106, 4, -64, 42], 70, { tint: 0xd8e0e8 }));
    P.E('FUTURE', () => {
      P.box([-106, 0, 4, -64, 8, 42], 'concreteStained');
      ramp(P, [-106, 48, -46, 56], 0, 24, 'E', 'towerGlass', { terrain: false });
      P.box([-52, 23.6, 48, -44, 24, 62], 'towerGlass');
      P.obox(-76, 3, 52, 64, 8, 12, 0, 'towerGlass', { rz: Math.atan2(24, 60), t: 0xb8c8b8 });
      for (let i = 0; i < 8; i++) P.tree('fern', -100 + i * 7, 52, 1, { y: 2 + i * 2.8, solid: false });
    });
    // --- Q1: the viaduct (Line 41), its fallen span in 2196 (the transit bridge), the low-water path below ------------
    for (const [z0, z1] of [[-110, -24], [-4, 110]]) viaduct(P, VX, z0, VX, z1, VY, 7, 'viaductDeck', { span: 12, walk: true, under: true });
    P.E(['PRESENT', 'PAST'], () => viaduct(P, VX, -24, VX, -4, VY, 7, 'viaductDeck', { span: 10, walk: true, under: true }));
    P.E('FUTURE', () => {
      // the span has fallen into the canal: its pieces in the water
      for (let i = 0; i < 4; i++) P.obox(VX + P.rng.float(-3, 3), -0.6, -22 + i * 5, 7, 1.2, 4.6, P.rng.float(-0.3, 0.3), 'viaductDeck', { rx: P.rng.float(-0.3, 0.3), rz: P.rng.float(-0.3, 0.3) });
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
    for (const [x, z, r] of [[6, -10, 5], [-30, 8, 4], [56, 30, 4.5], [-6, -30, 3.5]]) P.disc(x, 0.2, z, r, 'stormGlow', { noShadow: 1 });
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
      for (let i = 0; i < 6; i++) P.tree('fern', -44 + i * 8, -102, 1.2, { y: 1.6, solid: false });
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
