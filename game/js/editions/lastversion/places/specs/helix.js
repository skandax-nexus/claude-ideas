// Helix Temporal Research on the Ring Hill (Missions 2, 3 and, from U3, 12; OVERHAUL.md §5 M2, M3).
// Three wings round Helix Court: west, north and east, three storeys of white composite panels with
// full-height glass to the court (the crescent, open to the south and the city below). The court is
// 64 m round, wet stone, a ring of young lindens, and at its centre the oculus, a glass lens over the
// Chronolith chamber 11.5 m below. A mission's own rooms (Build.js, placed and turned round the
// court) stand inside the wings; the wings build round them. The north wing and its roofs are here
// for Mission 12. 2026 is the campus under construction (the east wing a bare frame, a crane over
// the court, the open dig at Site Zero); 2196 is a ruin (fallen slabs, ivy, pools, a linden through
// the oculus, the drowned valley and the sea on the horizon).
import { ground, groundHoles, terrace, stair, water, railing, block, prop, sign, canopy, crane, wall } from '../archetypes.js';

const WING_H = 13.5;
const COURT_R = 32;
export const CHAMBER = { at: [0, 12], y: -11.5, W: 24, L: 24, H: 12 };

// a wing: bays along its length; a bay a mission's room stands in is left to the room (only what
// is above the room's roof is built), a bay over an open room is left open to the sky
function wing(P, rect, { court, era = null, frame = false }) {
  const [x0, z0, x1, z1] = rect;
  const alongX = x1 - x0 > z1 - z0;
  const len = alongX ? x1 - x0 : z1 - z0;
  const n = Math.round(len / 8);
  const occ = P.occupied || [];
  P.E(era, () => {
    for (let i = 0; i < n; i++) {
      const b = alongX ? [x0 + (len * i) / n, z0, x0 + (len * (i + 1)) / n, z1] : [x0, z0 + (len * i) / n, x1, z0 + (len * (i + 1)) / n];
      const hit = occ.filter((o) => o.rect[0] < b[2] && o.rect[2] > b[0] && o.rect[1] < b[3] && o.rect[3] > b[1]);
      if (frame) {
        // 2026: a bare concrete frame: columns, slabs every storey, no roof
        for (const [px, pz] of [[b[0], b[1]], [b[2], b[1]], [b[0], b[3]], [b[2], b[3]]]) P.box([px - 0.35, 0, pz - 0.35, px + 0.35, WING_H - 4.5, pz + 0.35], 'rawConcrete');
        if (!hit.length) for (const y of [4.5, 9]) P.box([b[0], y - 0.3, b[1], b[2], y, b[3]], 'rawConcrete');
        continue;
      }
      if (!hit.length) {
        block(P, { rect: b, h: WING_H, facade: 'helixPanel', roof: 'flat', roofMat: 'roofLight', parapet: true, units: i % 3 === 1 ? 1 : 0, tint: 0xffffff, trim: 'steel' });
        // full-height glass to the court
        if (court) {
          const g = 0.08;
          const f = court === 'E' ? [b[2], 0, b[1], b[2] + g, WING_H - 0.5, b[3]] : court === 'W' ? [b[0] - g, 0, b[1], b[0], WING_H - 0.5, b[3]] : court === 'S' ? [b[0], 0, b[3], b[2], WING_H - 0.5, b[3] + g] : [b[0], 0, b[1] - g, b[2], WING_H - 0.5, b[1]];
          P.vbox(f, 'helixGlass', { noShadow: 1 });
        }
        continue;
      }
      if (hit.some((o) => o.open && !o.corridor)) continue; // open to the sky above the room
      const top = Math.max(...hit.map((o) => o.top)) + 0.2;
      if (top < WING_H - 1) {
        P.vbox([b[0], top, b[1], b[2], WING_H, b[3]], 'helixPanel', { t: 0xffffff });
        P.vbox([b[0] - 0.15, WING_H, b[1] - 0.15, b[2] + 0.15, WING_H + 0.3, b[3] + 0.15], 'roofLight');
      }
    }
  });
}

export default {
  key: 'helix', style: 'helix', sameAs: ['helix_v17'], name: 'HELIX',
  bounds: [-70, -90, 70, 70],
  edges: { N: 'hill', E: 'cliff', W: 'cliff', S: 'cliff' },
  killY: -16,
  primary: 'oculus',
  backdrop: { notch: 'clear', skyline: 'rain2049' },
  variants: {
    m02: {
      primary: 'lobby',
      years: {
        PRESENT: { sky: 'stormNight', era: '2049', hour: 22.5, sun: { elev: 40, az: 200 }, fog: 0x1c2028, density: 1.4, night: 0.7, weather: 'storm', ibl: 'night', lit: 1, emergency: 0.85,
          hemi: { sky: 0x3a4250, ground: 0x14161a, k: 0.6 }, sunColor: 0x9aa8c8, sunK: 0.25, grade: { shadowTint: 0x2a1418, highlightTint: 0xffc0a8, toning: 0.24, contrast: 1.14, saturation: 0.92 } },
      },
      quarters: [
        { name: 'SECURITY', area: [-70, 14, -20, 70], spawn: [-48, 0, 38.4, 0] },
        { name: 'THE DARK CORRIDOR', area: [-70, -14, -18, 40], spawn: [-48, 0, 19.6, 0] },
        { name: 'POWER', area: [-70, -48, -18, 4], spawn: [-48, 0, -9.2, 0] },
        { name: 'CONDUIT & ARCHIVE', area: [-40, -70, 20, -20], spawn: [-35.6, 0, -42.3, -Math.PI / 2] },
        { name: 'THE CHAMBER', area: [-26, -26, 26, 26], spawn: [0, -11.5, 10.4, 0] },
      ],
      // a cleaner in the lobby (one bark: the ring was humming at five)
      crowd: [{ era: 'present', years: ['PRESENT'], region: 'helix', role: 'cleaner', path: [[-51, 36], [-51, 29]], n: 1 }],
    },
    m03: {
      primary: 'controlRoom',
      years: {
        PRESENT: { sky: 'washedDawn', era: '2049', hour: 6.1, sun: { elev: 4, az: 'notch' }, fog: 0xc8c0bc, density: 1.0, night: 0.1, weather: null, ibl: 'dusk', lit: 0.3,
          hemi: { sky: 0xb8c8e0, ground: 0x6a7480, k: 0.8 }, sunColor: 0xffcf9a, sunK: 0.9, grade: { shadowTint: 0x2a3a5a, highlightTint: 0xffe0c8, toning: 0.14, contrast: 1.1, saturation: 0.96 } },
        PAST: { sky: 'hazyNoon', era: '2026', hour: 12.4, sun: { elev: 70, az: 180 }, fog: 0xdfe6ea, density: 1.6, night: 0, weather: 'motes', ibl: 'plant', lit: 0,
          hemi: { sky: 0xf0f4f6, ground: 0xb0aaa0, k: 0.95 }, sunColor: 0xffffff, sunK: 1.25, grade: { shadowTint: 0x3a3428, highlightTint: 0xfff4e0, toning: 0.12, contrast: 1.12, saturation: 0.86 } },
        FUTURE: { sky: 'mistGreenDawn', era: '2196', hour: 6.6, sun: { elev: 8, az: 80 }, fog: 0xc8dcc8, density: 2.0, night: 0.05, weather: 'pollen', ibl: 'dusk', lit: 0,
          hemi: { sky: 0xd8ecd4, ground: 0x6a7c64, k: 0.85 }, sunColor: 0xe6ffe8, sunK: 0.8, grade: { shadowTint: 0x14382a, highlightTint: 0xeaffd8, toning: 0.22, contrast: 1.06, saturation: 1.06 } },
      },
      quarters: [
        { name: 'THE CHAMBER', area: [-26, -26, 26, 26], spawn: [0, -11.5, 10.4, 0] },
        { name: 'TEMPORAL LAB', area: [26, -36, 70, 26], spawn: [40.4, 0, -9.9, -Math.PI / 2] },
        { name: 'THE DIG', area: [-30, 8, 30, 60], spawn: [0, 0, 44, Math.PI] },
        { name: 'MACHINE HALL', area: [20, -70, 70, -20], spawn: [54.7, 0, -23.3, 0] },
        { name: 'CONTROL', area: [-34, -70, 24, -26], spawn: [14.5, 0, -41.6, Math.PI / 2] },
      ],
      // 2026: the builders round the open dig (echoes)
      crowd: [{ era: 'present', years: ['PAST'], region: 'helix', role: 'builder', path: [[-16, 50], [16, 50]], n: 3, echo: true }],
    },
  },
  quarters: [{ name: 'HELIX COURT', area: [-38, -38, 38, 38], spawn: [0, 0, 30, 0] }],

  build(P, { mission }) {
    const occ = P.occupied || [];
    const holes = occ.map((o) => o.rect);
    // --- the court and its apron, with the chamber and its stair beneath (holes in the paving) -------
    const cx0 = CHAMBER.at[0] - CHAMBER.W / 2 - 0.4, cz1 = CHAMBER.at[1] + 0.4;
    groundHoles(P, [-70, -90, 70, 70], [[cx0, cz1 - CHAMBER.L - 0.8, -cx0, cz1], ...holes], 0, 'stoneWet');
    P.E(['PRESENT', 'FUTURE'], () => P.disc(0, 0.012, 0, COURT_R, 'courtStone', { seg: 48, noShadow: 1 }));
    P.E('PAST', () => P.disc(0, 0.012, 0, COURT_R, 'dirt', { seg: 48, noShadow: 1 }));
    // the oculus: a 20 m lens of glass and steel over the chamber, glowing from below
    P.land('oculus', 0, 0, 0, 0);
    P.E(['PRESENT'], () => {
      P.dome(0, 0.5, 0, 11.2, 2.4, 'oculusGlass', { seg: 28 });
      for (let i = 0; i < 12; i++) P.torus(0, 0.5, 0, 11.2, 0.09, 'steel', { rx: 0, ry: (i / 12) * Math.PI, rz: 0, arc: Math.PI, seg: 16 });
      P.torus(0, 0.55, 0, 11.6, 0.35, 'oculusRim', { rx: Math.PI / 2, seg: 48 });
    });
    P.E(['FUTURE'], () => {
      // the lens broken; a linden grows up through it
      P.torus(0, 0.55, 0, 11.6, 0.35, 'rust', { rx: Math.PI / 2, seg: 48 });
      for (let i = 0; i < 5; i++) P.torus(0, 0.5, 0, 11.2, 0.09, 'rust', { rx: 0, ry: (i / 5) * Math.PI + 0.3, rz: 0.1 * i, arc: Math.PI * 0.6, seg: 10 });
      P.tree('linden', 2, -1, 2.6, { y: -11.5, solid: false });
    });
    P.E('PAST', () => {
      // 2026: the chamber is a construction pit, its rim scaffolded
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        P.box([Math.cos(a) * 12.6 - 0.1, 0, Math.sin(a) * 12.6 - 0.1, Math.cos(a) * 12.6 + 0.1, 3.4, Math.sin(a) * 12.6 + 0.1], 'scaffold', { solid: false });
      }
      P.torus(0, 1.2, 0, 12.6, 0.06, 'scaffold', { rx: Math.PI / 2, seg: 40 });
      P.torus(0, 3.2, 0, 12.6, 0.06, 'scaffold', { rx: Math.PI / 2, seg: 40 });
    });
    // a ring of young lindens, lit bollards on the court's edge
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.13;
      const x = Math.cos(a) * 23, z = Math.sin(a) * 23;
      if (z > 8 && z < 34 && Math.abs(x) < 16) continue; // the dig takes the south of the court in 2026
      P.E(['PRESENT'], () => P.tree('linden', x, z, 0.95));
      P.E(['FUTURE'], () => P.tree('linden', x, z, 1.9));
    }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      P.E(['PRESENT'], () => prop(P, 'bollard', Math.cos(a) * 31, Math.sin(a) * 31, 0, { lit: 'bollardLit', solid: false }));
    }
    // --- the wings ---------------------------------------------------------------------------------------
    wing(P, [-62, -38, -38, 44], { court: 'E' });
    wing(P, [-62, -62, 62, -38], { court: 'S' });
    wing(P, [38, -38, 62, 44], { court: 'W', era: ['PRESENT', 'FUTURE'] });
    wing(P, [38, -38, 62, 44], { court: 'W', era: 'PAST', frame: true });
    P.land('northWing', 0, WING_H, -50, Math.PI);
    P.land('northRoofs', -30, WING_H, -50, 0);
    // the skybridge: 40 m of glass at 8 m over the court's north side, west wing to north wing
    P.land('skybridgeView', -24, 8, -30, 0);
    P.E(['PRESENT'], () => {
      P.obox(-26, 8, -26, 4, 3.2, 40, Math.PI / 4, 'helixGlass', { noShadow: 1 });
      P.obox(-26, 7.6, -26, 4.4, 0.4, 40, Math.PI / 4, 'steel');
      P.obox(-26, 11.2, -26, 4.4, 0.3, 40, Math.PI / 4, 'steel');
    });
    P.E(['FUTURE'], () => P.obox(-20, 0, -18, 4.4, 1.2, 18, Math.PI / 4 + 0.2, 'rust', { rx: 0.15, solid: true }));
    // --- the south: the campus terrace and the stair down to the city ----------------------------------------
    terrace(P, [-38, 44, 38, 70], -0.01, 'terrazzo', { sides: '' });
    for (const s of [-1, 1]) railing(P, s * 38, 69.6, s * 8, 69.6, 1.0, 'steel');
    stair(P, 0, 69.5, 0, 0, 76, -2.2, 16, 'terrazzo');
    sign(P, 'HELIX TEMPORAL RESEARCH', 0, 3.2, 44.2, 0, { size: 0.6, color: '#ffffff', board: 0, e: ['PRESENT'] });
    P.E(['PRESENT'], () => {
      for (const x of [-20, -10, 10, 20]) prop(P, 'bollard', x, 52, 0, { lit: 'bollardLit' });
      P.vbox([-4, 0, 44.6, 4, 2.8, 45.4], 'helixWhite');
    });
    // --- 2026: the open dig at Site Zero, the site hut, the crane, the fences -------------------------------
    P.land('excavationHut', -10, 0, 30, 0);
    P.land('excavationLog', -10.4, 1.1, 31.2, 0);
    P.land('thermosER', -8.4, 1.0, 29.4, 0);
    P.land('footprints', 4, -2.8, 21, 0);
    P.land('polaroid', -11.6, 1.0, 28.8, 0);
    P.land('siteZero', 3, -3, 19, 0);
    P.E('PAST', () => {
      // the dig: a pit cut in the old riverbed, the ring's upper arc showing in the clay
      for (const [b, m] of [[[-6, -3.4, 12, 14, -3, 28], 'clay'], [[-6.4, -3.4, 11.6, -6, 0, 28.4], 'clay'], [[14, -3.4, 11.6, 14.4, 0, 28.4], 'clay'], [[-6.4, -3.4, 11.6, 14.4, 0, 12], 'clay']]) P.vbox(b, m);
      P.torus(4, -3.0, 19.6, 3.6, 0.42, 'blackRing', { rx: 0, ry: 0.3, arc: Math.PI * 0.9, rz: 0.15, seg: 24 });
      for (let i = 0; i < 5; i++) P.box([-5 + i * 0.7, -3 + i * 0.6 - 0.3, 26, -4.3 + i * 0.7, -3 + i * 0.6, 28], 'timber');
      prop(P, 'siteHut', -10, 31, 0);
      prop(P, 'tarp', 8, 30, 0.2, { w: 5, d: 3 });
      prop(P, 'floodlight', 15, 30, 0);
      prop(P, 'floodlight', -7, 10, 0);
      crane(P, 24, 12, 34, 34, -Math.PI * 0.75);
      for (let x = -30; x <= 30; x += 6) P.vbox([x - 3, 0, 36.9, x + 3, 2.0, 37.1], 'siteFence', { prop: 1 });
      for (const [x, z] of [[-24, 0], [-20, 8], [20, -16], [-14, -24], [26, -2]]) prop(P, 'crate', x, z, 0.4, { m: 'rawConcrete' });
    });
    // the pit's colliders (2026 only): its floor and its walls
    P.E('PAST', () => {
      P.col([-6, -3.6, 12, 14, -3, 28]);
    });
    // --- 2196: the ruin: fallen slabs, ivy curtains, pools, a broken wing roof ------------------------------
    P.E('FUTURE', () => {
      for (const [x, z, ry, w, d] of [[-30, 14, 0.4, 10, 6], [24, -26, -0.3, 9, 7], [-8, -30, 0.8, 12, 5], [30, 20, 1.2, 8, 6], [-26, -20, -0.6, 7, 7]]) P.obox(x, 0, z, w, 0.8, d, ry, 'rawConcrete', { rx: 0.12, solid: true });
      for (const [x0, z0, x1, z1] of [[-37.9, -30, -37.8, 30], [-30, -37.9, 30, -37.8], [37.8, -30, 37.9, 30]]) for (let i = 0; i < 9; i++) {
        const f = (i + 0.5) / 9, x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f;
        P.vbox([x - (x0 === x1 ? 0.05 : 1.6), WING_H - P.rng.float(4, 11), z - (z0 === z1 ? 0.05 : 1.6), x + (x0 === x1 ? 0.05 : 1.6), WING_H, z + (z0 === z1 ? 0.05 : 1.6)], 'ivy', { noShadow: 1 });
      }
      for (const [x, z, r] of [[-18, 18, 5], [16, -12, 4], [20, 22, 3.5]]) P.disc(x, 0.06, z, r, 'poolWater', { noShadow: 1 });
      for (const [x, z] of [[-14, 26], [12, 28], [-26, -8], [6, -26], [28, 6], [-22, 30]]) P.tree('birch', x, z, 1.3);
      P.plane(-37, -37, 37, 37, 0.03, 'moss', { noShadow: 1 });
    });
    // --- the service yard north, against the hillside ------------------------------------------------------
    terrace(P, [10, -90, 70, -62], -0.01, 'rawConcrete', { sides: '' });
    P.land('serviceYardOut', 40, 0, -76, 0);
    for (const [x, z, ry] of [[22, -72, 0], [30, -72, 0], [52, -80, Math.PI / 2]]) prop(P, 'chiller', x, z, ry);
    canopy(P, { rect: [56, -88, 68, -66], h: 5, roof: 'corrugated', span: 6 });
    P.E(['PRESENT', 'PAST'], () => {
      for (const [x, z] of [[36, -84], [44, -84]]) P.box([x - 1.2, 0, z - 3, x + 1.2, 2.6, z + 3], 'containerBlue');
    });
    // the hillside behind
    for (const [x, z, w] of [[-40, -82, 34], [-6, -86, 26]]) P.obox(x, 0, z, w, 6, 10, 0.1, 'rockGrass', { solid: true });
    void mission;
    void water;
    void wall;
  },
};
