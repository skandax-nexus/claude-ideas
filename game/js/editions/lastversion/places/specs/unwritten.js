// The place outside time (Mission 19, THE PLACE OUTSIDE TIME; OVERHAUL.md §5 M19). A white salt mirror: two
// centimetres of water over salt, reflecting a high-key white-violet sky with no sun disc. 220 x 220 m whose
// east and west edges wrap (walk off one side and come back from the other, so the roads loop). Fragments of
// earlier places float at 2-12 m, joined by paths: the clockmaker's light-well gallery, a piece of the Line 41
// canopy, an observatory ring segment, a Helix gallery. The recurring symbols are the only way-finding: the
// clockmaker's mark chalked where the road is real, the observatory pattern laid in stones, the Helix badge set
// in glass. A channel of deep water crosses the whole plain; the bridge over it is visible only in its
// reflection (drawn mirrored below the water, nothing above it) and holds in 2026, or when the reflection is
// brought back in step. North of it the same blue door stands alone in five places; the real one casts no
// shadow. The sky shows the unbuilt city hanging upside down in pale construction lines.
//   Q0 THE LOOPING ROAD                 the south (z 20 .. 110)
//   Q1 THE BRIDGE IN THE REFLECTION     the middle (z -40 .. 20), the channel at z -36 .. -24
//   Q2 THE DOOR THAT IS EVERYWHERE      the north (z -110 .. -40)
import { stair, ramp, railing, sign } from '../archetypes.js';

const W = 110; // half the plain's side
const CH = [-36, -24]; // the channel (z)
const CHY = -1.2; // the channel's water

// `mirror`: build pieces as they show in a still water surface at y0, drawn upside down below it
// (visual only; the box, obox, cylinder and ring of the builder, without their tilts except the ring's)
function mirror(P, y0, fn) {
  const fy = (y) => 2 * y0 - y;
  fn({
    box: (b, m, o = {}) => P.vbox([b[0], fy(b[4]), b[2], b[3], fy(b[1]), b[5]], m, { ...o, noShadow: 1 }),
    obox: (x, y, z, w, h, d, ry, m, o = {}) => P.obox(x, fy(y + h), z, w, h, d, ry, m, { ...o, solid: false, noShadow: 1 }),
    cyl: (x, y, z, r, h, m, o = {}) => P.cyl(x, fy(y + h), z, o.r2 ?? r, h, m, { ...o, r2: r, solid: false, noShadow: 1 }),
    torus: (x, y, z, Rr, r, m, o = {}) => P.torus(x, fy(y), z, Rr, r, m, { ...o, rx: -(o.rx ?? 0), rz: -(o.rz ?? 0), noShadow: 1 }),
  });
}

// a thing and its reflection in the plain: fn(B) is called with the real builder and the mirrored one
function twice(P, fn) {
  fn({ box: (b, m, o = {}) => P.box(b, m, o), obox: (...a) => P.obox(...a), cyl: (...a) => P.cyl(...a), torus: (...a) => P.torus(...a) });
  mirror(P, 0.02, fn);
}

// the blue door, standing alone: a white frame, the blue leaf a hand's width ajar; the real one casts no shadow
function blueDoor(P, x, y, z, ry, o = {}) {
  const c = Math.cos(ry), s = Math.sin(ry);
  const q = { noShadow: o.real ? 1 : 0 };
  for (const k of [-1, 1]) {
    P.obox(x + c * k * 0.68, y, z - s * k * 0.68, 0.16, 2.5, 0.22, ry, 'woodWhite', q);
    P.col([x + c * k * 0.68 - 0.12, y - 0.3, z - s * k * 0.68 - 0.12, x + c * k * 0.68 + 0.12, y + 2.5, z - s * k * 0.68 + 0.12]);
  }
  P.obox(x, y + 2.42, z, 1.52, 0.18, 0.22, ry, 'woodWhite', q);
  P.obox(x + c * 0.02, y, z - s * 0.02 + 0.04, 1.18, 2.38, 0.06, ry + 0.12, 'blueDoor', q);
  P.cyl(x - c * 0.44 + s * 0.08, y + 1.1, z + s * 0.44 + c * 0.08, 0.04, 0.06, 'symbolGold', { seg: 6, rx: Math.PI / 2, ry });
  mirror(P, 0.02, (M) => {
    for (const k of [-1, 1]) M.obox(x + c * k * 0.68, y, z - s * k * 0.68, 0.16, 2.5, 0.22, ry, 'woodWhite');
    M.obox(x, y + 2.42, z, 1.52, 0.18, 0.22, ry, 'woodWhite');
    M.obox(x, y, z, 1.18, 2.38, 0.06, ry + 0.12, 'blueDoor');
  });
}

export default {
  key: 'unwritten', style: 'salt', sameAs: null, name: 'THE UNWRITTEN SECOND',
  bounds: [-W, -W, W, W],
  edges: {},
  killY: -6,
  primary: 'realDoor',
  backdrop: { kind: 'void', skirt: false },
  years: {
    PRESENT: { sky: 'whiteViolet', era: '2049', hour: 12.5, sun: { elev: 62, az: 200 }, fog: 0xf2eeff, density: 1.25, night: 0, weather: 'motes', ibl: 'warehouse', lit: 0,
      hemi: { sky: 0xf4f0ff, ground: 0xd8d0f0, k: 1.1 }, sunColor: 0xfaf6ff, sunK: 0.7, grade: { shadowTint: 0x6a5aa0, highlightTint: 0xffffff, toning: 0.16, contrast: 0.98, saturation: 0.9 } },
    PAST: { sky: 'whiteRose', era: '2026', hour: 12.5, sun: { elev: 58, az: 160 }, fog: 0xfff0f2, density: 1.25, night: 0, weather: 'motes', ibl: 'warehouse', lit: 0,
      hemi: { sky: 0xfff2f4, ground: 0xf0d8e0, k: 1.1 }, sunColor: 0xfff6f4, sunK: 0.7, grade: { shadowTint: 0x9a5a7a, highlightTint: 0xffffff, toning: 0.16, contrast: 0.98, saturation: 0.92 } },
    FUTURE: { sky: 'whiteMint', era: '2196', hour: 12.5, sun: { elev: 66, az: 240 }, fog: 0xeefff8, density: 1.25, night: 0, weather: 'motes', ibl: 'warehouse', lit: 0,
      hemi: { sky: 0xf0fff8, ground: 0xd0ece4, k: 1.1 }, sunColor: 0xf4fffa, sunK: 0.7, grade: { shadowTint: 0x3a7a6a, highlightTint: 0xffffff, toning: 0.16, contrast: 0.98, saturation: 0.9 } },
  },
  skyFeatures: { all: [{ kind: 'unbuilt', at: [0, -30], h: 170, n: 52, r: 230, color: 0x8a80c0 }] },
  quarters: [
    { name: 'THE LOOPING ROAD', area: [-W, 20, W, W], spawnAt: 'orrenRoad', threshold: { at: 'observatoryPattern', kind: 'stones' } },
    { name: 'THE BRIDGE IN THE REFLECTION', area: [-W, -40, W, 20], spawnAt: 'observatoryPattern', threshold: { at: 'bridgeFar', kind: 'bridge' } },
    { name: 'THE DOOR THAT IS EVERYWHERE', area: [-W, -W, W, -40], spawnAt: 'bridgeFar', threshold: null },
  ],
  beatAt: { m19: ['clockMarks', 'mirrorBridge', 'miraMeet'] },
  exits: { m19: 'realDoor' },
  frags: { m19: [['clockGallery', 'stonePattern', 'helixBadge'], ['lagSite', 'door2', 'miraMeet']] },
  watch: { m19: [[], [], []] },
  crowd: [
    // (U4 review) the echoes are people Kai has met (crowds.js MET: Pryce, Iven, Odile, Ezra, the Elder), not strangers
    { era: 'present', years: ['PRESENT', 'PAST', 'FUTURE'], region: 'unwritten', role: 'met', path: [[-30, 60], [30, 60]], n: 5, echo: true },
  ],

  build(P) {
    // --- the plain: an invisible floor, the mirror over it, the white below it (what the mirror shows) -------------
    P.setTerrain(-W, -W, W, W, 0);
    for (const [z0, z1] of [[-W, CH[0]], [CH[1], W]]) P.col([-W, -1, z0, W, 0, z1]);
    P.E('PRESENT', () => { for (const [z0, z1] of [[-W, CH[0]], [CH[1], W]]) P.plane(-W - 40, z0, W + 40, z1, 0.02, 'mirrorWater', { noShadow: 1 }); });
    P.E('PAST', () => { for (const [z0, z1] of [[-W, CH[0]], [CH[1], W]]) P.plane(-W - 40, z0, W + 40, z1, 0.02, 'mirrorRose', { noShadow: 1 }); });
    P.E('FUTURE', () => { for (const [z0, z1] of [[-W, CH[0]], [CH[1], W]]) P.plane(-W - 40, z0, W + 40, z1, 0.02, 'mirrorMint', { noShadow: 1 }); });
    P.plane(-W - 200, -W - 200, W + 200, W + 200, -30, 'voidWhite', { noShadow: 1 });
    // salt crust: white islands in the mirror (they hide the reflection under them)
    for (let i = 0; i < 26; i++) {
      const x = P.rng.float(-W + 8, W - 8), z = P.rng.float(-W + 8, W - 8);
      if (z > CH[0] - 6 && z < CH[1] + 6) continue;
      P.cyl(x, -0.05, z, P.rng.float(3, 9), 0.1, 'salt', { seg: 6, ry: P.rng.float(0, 1) });
    }
    // the channel: deep, still, the plain's mirror on it; salt walls down to the white
    for (const z of CH) P.vbox([-W - 40, -14, z - 0.2, W + 40, 0.02, z + 0.2], 'salt');
    P.plane(-W - 40, CH[0], W + 40, CH[1], CHY, 'mirrorWater', { noShadow: 1 });
    P.drown([-W, CH[0], W, CH[1]], CHY - 0.4);
    // --- wrapping: walk off the east edge and come back from the west, and back (the roads loop) ------------------
    P.triggers.push({ box: [W - 2, -12, -W, W, 40, W], set: {}, wrap: [-(2 * W - 6), 0] });
    P.triggers.push({ box: [-W, -12, -W, -W + 2, 40, W], set: {}, wrap: [2 * W - 6, 0] });
    // --- Q0: the looping road; Orren sweeps a road that ends in sky -------------------------------------------------
    P.land('orrenRoad', 0, 0, 96, Math.PI);
    P.land('clockMarks', 3.2, 0, 52, -Math.PI / 2);
    P.land('roadEnd', 26, 6, 79, 0);
    // the road east-west round the world, and north to the channel; pale paving laid on the mirror
    P.vbox([-W - 40, 0, 57, W + 40, 0.05, 63], 'limestone', { noShadow: 1 });
    P.vbox([-3, 0, -24, 3, 0.05, 104], 'limestone', { noShadow: 1 });
    // the clockmaker's mark: where it is chalked, the road is real
    for (const [x, z] of [[2.2, 52], [-2.2, 30], [2.2, 8], [40, 60], [-60, 60], [86, 60]]) { P.torus(x, 0.07, z, 0.5, 0.05, 'chalkWhite', { rx: Math.PI / 2, seg: 16 }); P.vbox([x - 0.04, 0.05, z - 0.7, x + 0.04, 0.07, z + 0.7], 'chalkWhite', { noShadow: 1 }); }
    // a road that ends in sky: it rises off the plain to 6 m and stops
    ramp(P, [23, 80, 29, 106], 0, 6, 'N', 'fragmentStone', { terrain: false });
    P.box([22, 5.6, 77.4, 30, 6, 80], 'fragmentStone');
    // the clockmaker's light-well gallery (2026 and 2196): a square gallery round a well of light at 6 m
    P.land('clockGallery', -55, 6, 70, 0);
    P.E(['PAST', 'FUTURE'], () => twice(P, (B) => {
      for (const [x0, z0, x1, z1] of [[-63, 62, -47, 65], [-63, 75, -47, 78], [-63, 65, -60, 75], [-50, 65, -47, 75]]) B.box([x0, 5.6, z0, x1, 6, z1], 'oakFloor');
      for (const [x, z] of [[-63, 62], [-47, 62], [-63, 78], [-47, 78]]) B.obox(x, 6, z, 0.3, 4, 0.3, 0, 'wood');
      B.box([-64, 10, 61, -46, 10.4, 79], 'glassRoof', { solid: false });
      B.box([-56.5, 6, 69.5, -53.5, 12, 70.5], 'brass', { solid: false });
    }));
    P.E(['PAST', 'FUTURE'], () => {
      for (const [x0, z0, x1, z1] of [[-63, 62, -47, 62], [-63, 78, -56.6, 78], [-53.4, 78, -47, 78], [-63, 62, -63, 78], [-47, 62, -47, 78], [-60, 65, -50, 65], [-60, 75, -50, 75], [-60, 65, -60, 75], [-50, 65, -50, 75]]) railing(P, x0, z0, x1, z1, 1.0, 'wood', { y: 6, t: 0.12 });
      stair(P, -55, 96, 0, -55, 78, 6, 3, 'oakFloor');
    });
    // a piece of the Line 41 canopy (2049 and 2026): a platform at 3 m under a glass roof on green posts
    P.land('canopy41', 55, 3, 72, 0);
    P.E(['PRESENT', 'PAST'], () => {
      twice(P, (B) => {
        B.box([40, 2.6, 68, 70, 3, 76], 'platformTile');
        for (let x = 42; x <= 68; x += 6.5) B.obox(x, 3, 72, 0.3, 3.4, 0.3, 0, 'busStopGreen', { solid: true });
        B.box([39, 6.4, 67, 71, 6.6, 77], 'glassRoof', { solid: false });
      });
      ramp(P, [44, 76, 50, 92], 3, 0, 'S', 'platformTile', { terrain: false });
      sign(P, 'LINE 41  SOUTH SQUARE', 55, 5.6, 72.2, 0, { size: 0.36, color: '#f4f4f0', boardMat: 'signGreen' });
    });
    // --- Q1: the observatory pattern, the Helix badge, the bridge in the reflection -------------------------------------
    P.land('observatoryPattern', 0, 0, 14, Math.PI);
    P.land('stonePattern', -40, 0, 0, 0);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; P.cyl(-40 + Math.cos(a) * 5, 0, Math.sin(a) * 5, 0.45, 0.35, 'fragmentStone', { seg: 6, solid: false }); }
    P.cyl(-40, 0, 0, 0.8, 0.5, 'fragmentStone', { seg: 8 });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.26; P.cyl(-40 + Math.cos(a) * 9, 0, Math.sin(a) * 9, 0.35, 0.3, 'symbolGold', { seg: 6, solid: false }); }
    // an observatory ring segment over the pattern, at 5 m, with a stone landing (every year)
    twice(P, (B) => {
      B.box([-62, 4.6, -16, -50, 5, -4], 'fragmentStone');
      B.torus(-56, 5, -10, 9, 0.5, 'bronzeAged', { arc: Math.PI * 0.9, ry: 0.4, seg: 24 });
    });
    stair(P, -56, 10, 0, -56, -4, 5, 2.4, 'fragmentStone');
    // the Helix badge set in glass, and a Helix gallery at 8 m above it (2049 and 2196)
    P.land('helixBadge', 40, 0, -6, Math.PI);
    P.vbox([38.5, 0, -7.5, 41.5, 0.06, -4.5], 'helixGlass', { noShadow: 1 });
    P.cyl(40, 0.01, -6, 0.9, 0.04, 'symbolGold', { seg: 6 });
    P.E(['PRESENT', 'FUTURE'], () => {
      twice(P, (B) => {
        B.box([44, 7.6, -14, 72, 8, -10], 'helixWhite');
        B.box([44, 8, -14.1, 72, 9.1, -13.9], 'helixGlass', { solid: false });
        for (const x of [46, 58, 70]) B.obox(x, 8, -10.2, 0.2, 3.2, 0.2, 0, 'helixFence');
        B.box([43.8, 11.2, -14.4, 72.2, 11.5, -9.8], 'helixWhite', { solid: false });
      });
      stair(P, 72, 6, 0, 72, -10, 8, 3, 'helixWhite');
      railing(P, 44, -14, 72, -14, 1.1, 'helixGlass', { y: 8 });
    });
    // the bridge in the reflection: nothing above the channel; in its water a suspension bridge, upside down.
    // It holds in 2026 (when it was there), or when the reflection is brought back in step (m19_synced)
    P.land('mirrorBridge', -5, 0, -20.4, 0); // (beside the bridge's head: the plaque, not in the way)
    P.land('lagSite', 8, 0, -20, Math.PI);
    P.land('bridgeFar', 0, 0, -42, Math.PI);
    mirror(P, CHY, (M) => {
      M.box([-2.5, -0.5, -38, 2.5, 0, -22], 'reflectionGlass');
      for (const x of [-2.4, 2.4]) M.box([x - 0.06, 0, -38, x + 0.06, 1.1, -22], 'reflectionGlass');
      for (const z of [-37, -23]) for (const x of [-2.8, 2.8]) M.obox(x, 0, z, 0.5, 11, 0.5, 0, 'reflectionGlass');
      for (const z of [-37, -23]) M.obox(0, 10.6, z, 6.1, 0.5, 0.5, 0, 'reflectionGlass');
      for (let k = 0; k < 8; k++) { const z = -36 + k * 1.75; for (const x of [-2.4, 2.4]) M.obox(x, 1.1, z, 0.05, 9.5 - Math.abs(k - 3.5) * 2.2, 0.05, 0, 'reflectionGlass'); }
    });
    P.E('PAST', () => P.col([-2.5, -0.5, -38, 2.5, 0, -22]));
    P.W('m19_synced', () => P.col([-2.5, -0.5, -38, 2.5, 0, -22]));
    P.vbox([7.4, 0, -20.6, 8.6, 1.1, -19.4], 'mirrorWater', { prop: 1 });
    P.challenge('reflection', [-W, CH[0] - 2, W, CH[1] + 2], ['PAST'], ['The water shows a bridge. The air does not.', 'In the reflection the bridge is there. When was it there?', 'Switch to 2026 and walk where the reflection says the bridge is.']);
    // --- Q2: the door that is everywhere -----------------------------------------------------------------------------
    P.land('door1', -70, 0, -60, 0.6);
    P.land('door2', 64, 0, -72, -0.9);
    P.land('door3', -34, 0, -96, 0.2);
    P.land('door4', 86, 12, -83, -1.6);
    P.land('door5', 18, 0, -88, 0);
    P.land('realDoor', 18, 0, -88, 0);
    P.land('miraMeet', 14, 0, -82, Math.PI);
    for (const name of ['door1', 'door2', 'door3', 'door4', 'door5']) {
      const [x, y, z, ry] = P.at(name);
      blueDoor(P, x, y, z, ry, { real: name === 'door5' });
    }
    // door 4 stands at the top of a stair that climbs into the sky and stops (a slab at 12 m)
    twice(P, (B) => B.box([80, 11.6, -88, 92, 12, -78], 'fragmentStone'));
    stair(P, 86, -44, 0, 86, -78, 12, 3, 'fragmentStone');
    railing(P, 80, -88, 92, -88, 1.0, 'fragmentStone', { y: 12, t: 0.15 });
    // paths of pale paving joining the fragments, and symbols where the way is real
    P.vbox([-3, 0, -110, 3, 0.05, -38], 'limestone', { noShadow: 1 });
    P.vbox([-80, 0, -64, 90, 0.05, -60], 'limestone', { noShadow: 1 });
    for (const [x, z] of [[0, -50], [-34, -62], [64, -62], [18, -80]]) P.torus(x, 0.07, z, 0.5, 0.05, 'chalkWhite', { rx: Math.PI / 2, seg: 16 });
    // floating debris of other places, high up: chairs, a lamp post, a clock face (every year, slowly different)
    for (let i = 0; i < 14; i++) {
      const x = P.rng.float(-W + 10, W - 10), z = P.rng.float(-W + 10, W - 10), y = P.rng.float(14, 26);
      if (z > CH[0] - 4 && z < CH[1] + 4) continue;
      P.obox(x, y, z, P.rng.float(0.8, 3), P.rng.float(0.3, 2.4), P.rng.float(0.8, 3), P.rng.float(0, 3), P.rng.pick(['fragmentStone', 'woodWhite', 'helixWhite', 'oakFloor']), { rx: P.rng.float(-0.5, 0.5), rz: P.rng.float(-0.5, 0.5) });
    }
    P.E('FUTURE', () => { for (let i = 0; i < 10; i++) P.cyl(P.rng.float(-90, 90), 0, P.rng.float(-100, 100), P.rng.float(0.6, 1.4), P.rng.float(2.4, 6), 'fragmentStone', { seg: 7 }); });
    P.E('PAST', () => { for (let i = 0; i < 10; i++) P.obox(P.rng.float(-90, 90), 0, P.rng.float(40, 100), P.rng.float(2, 4), P.rng.float(2, 3.6), 0.2, P.rng.float(0, 3), 'brickWall'); });
  },
};
