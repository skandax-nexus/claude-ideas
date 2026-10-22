// The Ring Hill three thousand years ago (Mission 4, THE MAN FROM THE LAST DAY; OVERHAUL.md §5 M4).
// Four terraces (0 / 3 / 6 / 10 m) climb the knoll to the standing-stone ring on its summit, which
// stands exactly where Helix's oculus will be. Stone footings, timber and wattle walls, conical
// thatch, a longhouse, stilt granaries, dry-stone terrace walls, looms and drying racks, cypress,
// olive and barley. No lamps and no letters: records are carved stones. BEFORE THE FIRE there are no
// houses at all: the ring in tall grass, hide tents, the first campfire, and meadow slopes that
// cut across the terraces.
//   Q0 THE FIRST FIRE    the lower terrace, south (z 62 .. 100)
//   Q1 THE WATER STEPS   the middle terraces (z 6 .. 62)
//   Q2 THE RING          the summit (the ring at 0, -20; the under-chamber inside it)
import { ground, groundHoles, terrace, stair, ramp, roundhouse, longhouse, granary, tent, prop, ringStones, glyphs, wall } from '../archetypes.js';

const RING = [0, -20];

export default {
  key: 'valley_upper', style: 'settlement', sameAs: null, name: 'THE RING HILL',
  bounds: [-100, -100, 100, 100],
  edges: { N: 'slope', E: 'slope', W: 'slope', S: 'slope' },
  killY: -3,
  primary: 'ring',
  ancientYears: ['PRESENT', 'PAST'],
  backdrop: { notch: 'clear', sea: 'S', ridge: 'E' },
  years: {
    PRESENT: { sky: 'goldenAfternoon', era: 'ancient', hour: 17.4, sun: { elev: 14, az: 262 }, fog: 0xd8c8a8, density: 0.8, night: 0.05, weather: 'pollen', ibl: 'dusk', lit: 0,
      hemi: { sky: 0xb8c8e0, ground: 0x8a7a5a, k: 0.85 }, sunColor: 0xffb870, sunK: 1.15, grade: { shadowTint: 0x3a2a18, highlightTint: 0xfff0d0, toning: 0.18, contrast: 1.08, saturation: 1.08 } },
    PAST: { sky: 'blueDawn', era: 'ancient', hour: 5.2, sun: { elev: -4, az: 70 }, fog: 0x9fb0c8, density: 2.2, night: 0.55, weather: null, ibl: 'night', lit: 0,
      hemi: { sky: 0x5a6a8a, ground: 0x2a3446, k: 0.7 }, sunColor: 0xa8b8e0, sunK: 0.35, grade: { shadowTint: 0x1a2440, highlightTint: 0xd8e4ff, toning: 0.2, contrast: 1.06, saturation: 0.9 } },
  },
  quarters: [
    // Kai steps out of the blanket house and looks down the lane: the first fire, the elder's house with the
    // telling-stone on its roof, the granaries, and the Ridge beyond (in BEFORE THE FIRE: hide tents in the grass)
    { name: 'THE FIRST FIRE', area: [-100, 62, 100, 100], spawn: [-18, 0, 80, -1.27], threshold: { at: 'stairT1', kind: 'stair' } },
    { name: 'THE WATER STEPS', area: [-80, 6, 80, 62], spawnAt: 'stairT1Top', threshold: { at: 'stairT3', kind: 'stair' } },
    { name: 'THE RING', area: [-60, -60, 60, 6], spawnAt: 'stairT3Top', threshold: { at: 'underChamber', kind: 'stair' } },
  ],
  beatAt: { m04: ['tellingStone', 'stele', 'elderSeat'] },
  exits: { m04: 'underChamber' },
  frags: { m04: [['lintelHouse', 'granary', 'pictoRing'], ['skyFloor', 'firePit', 'cistern'], ['waterSteps', 'grainStore', 'ringStone']] },
  crowd: [
    { era: 'ancient', years: ['PRESENT'], region: 'settlement', role: 'villager', path: [[-30, 80], [30, 80], [20, 70]], n: 6 },
    { era: 'ancient', years: ['PRESENT'], region: 'settlement', role: 'child', path: [[-10, 72], [10, 74]], n: 3 },
  ],

  build(P) {
    // --- the knoll: four nested terraces with dry-stone walls ------------------------------------------
    ground(P, [-100, -100, 100, 100], 0, 'meadow');
    terrace(P, [-80, -70, 80, 62], 3, 'meadow', { wall: 'drystone', cap: 'drystone' });
    terrace(P, [-60, -58, 60, 34], 6, 'meadow', { wall: 'drystone', cap: 'drystone' });
    // the summit, with the under-chamber cut into it inside the ring
    const [rx, rz] = RING;
    groundHoles(P, [-34, -46, 34, 6], [[rx - 7, rz - 7, rx + 7, rz + 7], [rx - 1.9, rz + 7, rx + 1.9, rz + 11.2]], 10, 'summitGrass', { depth: 4.6 });
    for (const s of [-1, 1]) P.vbox([rx + s * 1.9 - 0.2, 5.4, rz + 7, rx + s * 1.9 + 0.2, 10, rz + 11.2], 'drystone');
    for (const [b, m] of [[[-34, 5.4, -46, 34, 10, -45.5], 'drystone'], [[-34, 5.4, 5.5, 34, 10, 6], 'drystone'], [[-34, 5.4, -46, -33.5, 10, 6], 'drystone'], [[33.5, 5.4, -46, 34, 10, 6], 'drystone']]) P.vbox(b, m);
    // the stairs between them (and in BEFORE THE FIRE, meadow slopes that cut across)
    stair(P, 0, 66, 0, 0, 61.6, 3, 5, 'drystone');
    P.land('stairT1', 0, 0, 66.5, Math.PI);
    P.land('stairT1Top', 0, 3, 58, Math.PI);
    stair(P, -20, 38, 3, -20, 33.6, 6, 4, 'drystone');
    stair(P, 24, 38, 3, 24, 33.6, 6, 4, 'drystone');
    stair(P, 0, 10.8, 6, 0, 5.6, 10, 5, 'drystone');
    P.land('stairT3', 0, 6, 11.5, Math.PI);
    P.land('stairT3Top', 0, 10, 2, Math.PI);
    P.E('PAST', () => {
      ramp(P, [50, 62, 60, 72], 0, 3, 'N', 'meadowLong', { terrain: false });
      ramp(P, [-58, 34, -48, 44], 3, 6, 'N', 'meadowLong', { terrain: false });
      ramp(P, [40, 6, 48, 18], 6, 10, 'N', 'meadowLong', { terrain: false });
      ramp(P, [-44, 6, -36, 18], 6, 10, 'N', 'meadowLong', { terrain: false });
    });
    P.challenge('meadow', [-60, -46, 60, 72], ['PAST', 'PRESENT'], ['The terraces meet only at stairs.', 'Before the fire, the meadow ran straight up.', 'Go before the fire. Walk up the meadow.'], { optional: true });
    // --- Q2: the ring on the summit; the under-chamber inside it -------------------------------------------
    ringStones(P, rx, 10, rz, 12, 14, 9, { band: 'bronze', w: 2.4, d: 1.4 });
    P.land('ring', rx, 10, rz - 12, 0);
    P.land('ringStone', rx + 11.6, 10, rz - 3.2, -Math.PI / 2);
    P.land('elderSeat', rx, 10, rz + 15.5, 0);
    P.box([rx - 1.4, 10, rz + 16.4, rx + 1.4, 10.6, rz + 17.4], 'drystone');
    P.box([rx - 1.4, 10.6, rz + 17.0, rx + 1.4, 11.6, rz + 17.4], 'drystone');
    // the under-chamber: a sunken round room open to the sky through the ring; a stair down its south side
    P.vbox([rx - 7, 6, rz - 7, rx + 7, 6.05, rz + 7], 'ash', { noShadow: 1 });
    for (const [b] of [[[rx - 7.4, 5.4, rz - 7.4, rx + 7.4, 10, rz - 7]], [[rx - 7.4, 5.4, rz + 7, rx - 2, 10, rz + 7.4]], [[rx + 2, 5.4, rz + 7, rx + 7.4, 10, rz + 7.4]], [[rx - 7.4, 5.4, rz - 7, rx - 7, 10, rz + 7]], [[rx + 7, 5.4, rz - 7, rx + 7.4, 10, rz + 7]]]) P.box(b, 'drystone');
    stair(P, rx, rz + 11, 10, rx, rz + 4.5, 6, 3.6, 'drystone');
    P.land('underStair', rx, 10, rz + 11.4, Math.PI);
    P.land('underChamber', rx, 6, rz, 0);
    P.land('panels', rx, 7.6, rz - 6.8, 0);
    for (let i = 0; i < 4; i++) glyphs(P, rx - 4.5 + i * 3, 7.6, rz - 6.75, 2.4, 2.4, 0, { m: 'glyphStone' });
    P.land('card', rx + 0.6, 6.05, rz - 1.4, 0);
    P.land('childRingCord', rx - 9, 10, rz + 9.5, 0);
    P.E('PRESENT', () => {
      // bronze broken-halo marks hung on the ring, and a ring of offerings
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.25;
        prop(P, 'pots', rx + Math.cos(a) * 9, rz + Math.sin(a) * 9, 0, { y: 10 });
      }
      for (const [x, z] of [[-26, -38], [26, -38], [-26, 0], [26, 0]]) prop(P, 'torch', x, z, 0, { y: 10 });
    });
    P.E('PAST', () => {
      // before the fire: tall grass round the ring, a child's cord ring on a stone
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        P.tree('grass', rx + Math.cos(a) * P.rng.float(14, 30), rz + Math.sin(a) * P.rng.float(14, 30), P.rng.float(1.4, 2.2), { y: 10, solid: false });
      }
      P.box([rx - 9.5, 10, rz + 9, rx - 8.5, 10.6, rz + 10], 'riverStone');
    });
    for (const [x, z] of [[-28, -40], [28, -40], [-30, -6], [30, -8]]) P.tree('cypress', x, z, 1.6, { y: 10 });
    // --- Q1: the water steps, the cistern, the stele, the grain store ---------------------------------------
    // a stepped rill coming down the west terraces from a spring under the summit
    for (let i = 0; i < 18; i++) {
      const z = 6 + i * 3.1, y = P.heightAt(-44, z);
      P.vbox([-46.6, y - 0.3, z, -43.4, y + 0.02, z + 3.1], 'rillStone', { noShadow: 1 });
      P.vbox([-46.2, y + 0.02, z, -43.8, y + 0.06, z + 3.1], 'water', { noShadow: 1 });
    }
    P.land('waterSteps', -45, 3, 44, Math.PI / 2);
    P.land('cistern', -52, 3, 50, 0);
    P.cyl(-52, 3, 50, 3.2, 1.0, 'drystone', { seg: 16, solid: true });
    P.disc(-52, 3.9, 50, 2.9, 'water', { noShadow: 1 });
    P.land('stele', 14, 6, 20, Math.PI);
    glyphs(P, 14, 6, 20, 2.6, 3.4, 0, { m: 'glyphStone', solid: true });
    P.land('grainStore', 40, 3, 48, Math.PI);
    P.land('skyFloor', -18, 6, 24, 0);
    P.E('PRESENT', () => {
      longhouse(P, { rect: [30, 40, 50, 54], y: 3 });
      granary(P, { x: 56, z: 44, y: 3 });
      granary(P, { x: 60, z: 52, y: 3 });
      for (const [x, z] of [[-30, 46], [-10, 50], [10, 44], [-66, 40]]) roundhouse(P, { x, z, r: 3.4, ry: Math.PI, y: 3 });
      for (const [x, z] of [[-30, 22], [36, 18], [-12, 26]]) roundhouse(P, { x, z, r: 3.0, ry: Math.PI, y: 6 });
      prop(P, 'loom', -2, 40, 0, { y: 3 });
      prop(P, 'rack', 20, 46, 0, { y: 3 });
      prop(P, 'rack', -36, 20, 0.3, { y: 6 });
      P.vbox([-20, 6, 22, -16, 6.03, 26], 'paintedFloor', { noShadow: 1 });
    });
    // barley on the middle terraces, olives along the walls
    for (let i = 0; i < 14; i++) P.tree('barley', P.rng.float(-74, 74), P.rng.float(52, 60), P.rng.float(0.9, 1.3), { solid: false });
    for (const [x, z] of [[-70, 20], [-66, -10], [66, -16], [70, 20], [-56, 56], [70, 56]]) P.tree('olive', x, z, 1.3);
    // --- Q0: the first fire, the houses of the lower village ------------------------------------------------
    P.land('blanketHouse', -24, 0, 84, Math.PI);
    P.land('firePit', 4, 0, 80, 0);
    prop(P, 'firePit', 4, 80, 0, { fire: true });
    P.land('granary', 34, 0, 76, Math.PI);
    P.land('lintelHouse', -46, 0, 76, 0);
    P.land('tellingStone', 22, 4.7, 88, Math.PI);
    P.land('pictoFire', -40, 0, 71.2, Math.PI);
    P.land('pictoWater', -8, 0, 64.2, Math.PI);
    P.land('pictoRing', 46, 0, 69.6, Math.PI);
    P.E('PRESENT', () => {
      roundhouse(P, { x: -24, z: 88, r: 4.2, ry: Math.PI });
      roundhouse(P, { x: -46, z: 82, r: 4, ry: Math.PI });
      roundhouse(P, { x: -70, z: 76, r: 3.6, ry: Math.PI / 2 });
      roundhouse(P, { x: 60, z: 84, r: 3.8, ry: -Math.PI / 2 });
      roundhouse(P, { x: -8, z: 94, r: 3.4, ry: Math.PI });
      granary(P, { x: 34, z: 76 });
      granary(P, { x: 40, z: 72 });
      // the elder's house: stone walls, a flat earthen roof with the telling-stone, a log stair up
      P.box([16, 0, 84, 28, 4.4, 92], 'drystone');
      P.vbox([15.6, 4.4, 83.6, 28.4, 4.7, 92.4], 'earthRoof');
      P.col([16, 4.4, 84, 28, 4.7, 92]);
      stair(P, 15.2, 92, 0, 15.2, 85, 4.7, 1.6, 'timber');
      P.blocks.push([16, 84, 28, 92]);
      prop(P, 'loom', -10, 76, 0.4);
      prop(P, 'rack', 12, 72, 0.2);
      prop(P, 'rack', -56, 70, -0.3);
      prop(P, 'pots', 8, 86, 0);
      prop(P, 'pots', -34, 92, 0);
      prop(P, 'cart', 48, 90, 0.6);
      for (const x of [-60, -30, 0, 30, 60]) P.cone(x, 0, 66 + (x % 3), 0.3, 6, 'smoke', { noShadow: 1, prop: 1 });
    });
    // pictograms: carved on the heads of three standing stones (older than the houses: they stand before the fire too)
    for (const [x, y, z, h, m] of [[-40, 1.2, 71.2, 1.4, 'pictoFire'], [-8, 1.0, 64.2, 1.4, 'pictoWater'], [46, 1.0, 69.6, 1.6, 'pictoRing']]) {
      P.obox(x, 0, z, 2.1, y + 0.02, 0.6, 0, 'drystone', { solid: true });
      glyphs(P, x, y, z, 1.8, h, 0, { m });
    }
    // the carved lintel: a stone doorway at the lane into the lower village (before the fire nothing is built)
    P.E('PRESENT', () => {
      for (const x0 of [-48.6, -44.6]) P.box([x0, 0, 69.2, x0 + 1.2, 2.4, 70.6], 'drystone');
      P.box([-48.8, 2.4, 69.1, -43.2, 3.0, 70.7], 'drystone');
      glyphs(P, -46, 2.45, 69.0, 4.6, 0.5, 0, { m: 'glyphStone' });
    });
    P.E('PAST', () => {
      // before the fire: hide tents, the first campfire, tall grass where the houses will be
      for (const [x, z] of [[-30, 84], [-14, 90], [12, 92], [30, 84], [-48, 78], [48, 78], [-22, 72], [22, 70]]) tent(P, { x, z, r: 2.3, h: 3.4 });
      for (let i = 0; i < 30; i++) P.tree('grass', P.rng.float(-90, 90), P.rng.float(66, 98), P.rng.float(1.4, 2.4), { solid: false });
      for (let i = 0; i < 14; i++) P.tree('grass', P.rng.float(-74, 74), P.rng.float(10, 58), P.rng.float(1.4, 2.4), { solid: false });
    });
    for (const [x, z] of [[-86, 66], [-80, 94], [84, 70], [88, 94], [-92, 30], [92, 24], [-90, -20], [90, -30], [-60, -84], [60, -84], [0, -90]]) P.tree('cypress', x, z, P.rng.float(1.3, 1.8));
    for (const [x, z] of [[-70, 94], [70, 96], [-36, 98], [40, 98]]) P.tree('olive', x, z, 1.4);
    void wall;
  },
};
