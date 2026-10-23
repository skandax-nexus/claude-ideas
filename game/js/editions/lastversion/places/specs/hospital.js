// Rain City General (Mission 11, THE INVERTED HOSPITAL; OVERHAUL.md §5 M11, D3, D22). The garden-pavilion
// hospital on the city's western slope: a glass entrance atrium, white modernist pavilions (render, ribbon
// windows, pilotis) linked by open-air colonnades round garden courts (lawns, magnolias, a fountain,
// benches); the records hall under a skylight with its annex; the top pavilion, Ward 32, with the roof
// garden and helipad on it. Some wards run backwards on their own (engine.setOverride timeReverse): the
// quiet colonnade, the records annex, the twin of Ward 32's lock. They are rooms of the place
// (P.room), not years. The discontinuity court: rain on its west half, rising rain and clouds drifting
// backwards over its east half. 2049: a bright overcast noon, high key. 2026: the warm afternoon Mira
// was admitted: younger trees, older signs, the children's wing with its murals.
//   Q0 TRIAGE & THE QUIET COLONNADE  the atrium, the courts (z 0 .. 70)
//   Q1 RECORDS                       the records hall and its annex (x -80 .. 0, z -32 .. 0)
//   Q2 WARD 32                       the top pavilion (z -70 .. -32)
import { ground, wall, railing, block, prop, sign, colonnade, stair } from '../archetypes.js';

const H = 5; // a ward's storey
// a room's four walls: `doors` are empty openings, `windows` glass (solid), each [from, to] along the wall
// (from its west or north end), windows with [from, to, y0, y1]
function walls(P, [x0, z0, x1, z1], h, { doors = {}, windows = {}, m = 'renderWhite' } = {}) {
  const side = (k, ax, az, bx, bz) => {
    const ops = [...(doors[k] || []).map(([a, b, y1 = 3.2]) => [a, b, 0, y1]), ...(windows[k] || []).map(([a, b, y0 = 0.9, y1 = 2.8]) => [a, b, y0, y1])];
    wall(P, ax, az, bx, bz, h, 0.3, m, { openings: ops });
    for (const [a, b, y0 = 0.9, y1 = 2.8] of windows[k] || []) {
      const len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
      const [px0, pz0, px1, pz1] = [ax + ux * a, az + uz * a, ax + ux * b, az + uz * b];
      P.box([Math.min(px0, px1) - (uz ? 0.05 : 0), y0, Math.min(pz0, pz1) - (ux ? 0.05 : 0), Math.max(px0, px1) + (uz ? 0.05 : 0), y1, Math.max(pz0, pz1) + (ux ? 0.05 : 0)], 'glass', { noShadow: 1 });
    }
  };
  side('N', x0, z0, x1, z0);
  side('S', x0, z1, x1, z1);
  side('W', x0, z0, x0, z1);
  side('E', x1, z0, x1, z1);
}
// a flat roof with a skylight (glass) over `hole`
function roof(P, [x0, z0, x1, z1], y, hole, m = 'roofLight') {
  if (!hole) return P.vbox([x0 - 0.2, y, z0 - 0.2, x1 + 0.2, y + 0.35, z1 + 0.2], m);
  const [hx0, hz0, hx1, hz1] = hole;
  for (const b of [[x0 - 0.2, z0 - 0.2, x1 + 0.2, hz0], [x0 - 0.2, hz1, x1 + 0.2, z1 + 0.2], [x0 - 0.2, hz0, hx0, hz1], [hx1, hz0, x1 + 0.2, hz1]]) P.vbox([b[0], y, b[1], b[2], y + 0.35, b[3]], m);
  P.vbox([hx0, y + 0.2, hz0, hx1, y + 0.25, hz1], 'glass', { noShadow: 1 });
  for (let x = hx0 + 2; x < hx1; x += 2) P.vbox([x - 0.05, y + 0.2, hz0, x + 0.05, y + 0.4, hz1], 'steel', { noShadow: 1 });
}
// a pavilion: white render with ribbon windows, raised on pilotis where `piloti`
function pavilion(P, rect, h, o = {}) {
  const [x0, z0, x1, z1] = rect;
  if (o.piloti) {
    P.box([x0, 3.4, z0, x1, h, z1], 'renderFacade', { t: 0xffffff });
    for (let x = x0 + 2; x < x1; x += 6) for (const z of [z0 + 2, z1 - 2]) P.cyl(x, 0, z, 0.35, 3.4, 'renderWhite', { seg: 10, solid: true });
  } else P.box([x0, 0, z0, x1, h, z1], 'renderFacade', { t: 0xffffff });
  P.blocks.push([x0, z0, x1, z1]);
  P.reserve(x0, z0, x1, z1);
  P.vbox([x0 - 0.3, h, z0 - 0.3, x1 + 0.3, h + 0.5, z1 + 0.3], 'roofLight');
}

export default {
  key: 'hospital', style: 'hospital', sameAs: null, name: 'RAIN CITY GENERAL',
  bounds: [-80, -70, 80, 70],
  edges: { N: 'hill', E: 'blocks', W: 'hill', S: 'blocks' },
  killY: -3,
  primary: 'atrium',
  outdoorFirst: true, // its wards are rooms of their own; a sector starts in its quarter, outdoors or in
  backdrop: { notch: 'faint', sea: 200 },
  years: {
    PRESENT: { sky: 'brightOvercast', era: '2049', hour: 12.3, sun: { elev: 58, az: 175 }, fog: 0xd8ecec, density: 0.6, night: 0, weather: null, ibl: 'plant', lit: 0.3,
      hemi: { sky: 0xeef4f6, ground: 0x9aa8a0, k: 1.0 }, sunColor: 0xf8fcff, sunK: 0.75, grade: { shadowTint: 0x1e4a5a, highlightTint: 0xf2fbff, toning: 0.1, contrast: 1.1, saturation: 0.96 } },
    PAST: { sky: 'admissionAfternoon', era: '2026', hour: 16.4, sun: { elev: 26, az: 245 }, fog: 0xe8d8c0, density: 0.7, night: 0.05, weather: 'pollen', ibl: 'dusk', lit: 0,
      hemi: { sky: 0xf4dcb4, ground: 0x8a7a5a, k: 0.9 }, sunColor: 0xffe0a8, sunK: 1.2, grade: { shadowTint: 0x3a2a18, highlightTint: 0xfff0d0, toning: 0.16, contrast: 1.08, saturation: 1.06 } },
  },
  // the discontinuity court: over its east half the clouds drift backwards
  skyFeatures: { m11: [{ kind: 'reverse', box: [-24, 2, -6, 30] }] },
  quarters: [
    { name: 'TRIAGE & THE QUIET COLONNADE', area: [-80, 0, 80, 70], spawn: [0, 0, 44, 0], threshold: { at: 'recordsGate', kind: 'door' } },
    { name: 'RECORDS', area: [-80, -32, 0, 0], spawn: [-43, 0, -8, 0], threshold: { at: 'recordsDoor', kind: 'door' } },
    { name: 'WARD 32', area: [-30, -70, 80, -32], spawn: [12, 0, -36.5, 0], threshold: { at: 'ward32Door', kind: 'lock' } },
  ],
  beatAt: { m11: ['triage', 'ledger2026', 'odileStation'] },
  exits: { m11: 'ward32' },
  frags: { m11: [['gurneyRun', 'ivStand', 'glassWindow'], ['photoBoard', 'intercomRoom', 'recordsHall']] },
  crowd: [
    { era: 'present', years: ['PRESENT', 'PAST'], region: 'hospital', role: 'staffEcho', path: [[-6, 38], [-6, 10], [-30, 4]], n: 4, echo: true },
    { era: 'present', years: ['PAST'], region: 'hospital', role: 'visitor', path: [[24, 40], [52, 40]], n: 3, barks: ['Ward 32 is through there. They won\'t let you in.', 'She sang all night. Nobody minded.'] },
  ],

  build(P) {
    // --- the ground: paths and lawns over the slope's one level ----------------------------------------------------
    ground(P, [-80, -70, 80, 70], 0, 'hospitalPave');
    for (const r of [[-40, 2, -8, 28], [22, 2, 58, 28], [-28, -68, -10, -36], [26, -30, 62, -6]]) P.plane(r[0], r[1], r[2], r[3], 0.02, 'lawn', { noShadow: 1 });
    // --- Q0: the entrance plaza, the ambulance bay, the glass atrium --------------------------------------------------
    P.room('h_atrium', [-14, 30, 14, 48], { name: 'THE ATRIUM', h: 8, spawn: [0, 0.86, 44, 0], light: 0xf4f8ff });
    walls(P, [-14, 30, 14, 48], 8, { doors: { S: [[12, 16]], N: [[12, 16]] }, windows: { S: [[1, 11, 0.2, 7], [17, 27, 0.2, 7]], N: [[1, 11, 0.2, 7], [17, 27, 0.2, 7]], W: [[2, 16, 0.2, 7]], E: [[2, 16, 0.2, 7]] }, m: 'steel' });
    roof(P, [-14, 30, 14, 48], 8, [-10, 33, 10, 45]);
    P.plane(-14, 30, 14, 48, 0.03, 'terrazzo', { noShadow: 1 });
    P.land('atrium', 0, 0, 40, 0);
    P.land('triage', -8, 0, 36, Math.PI / 2);
    for (const x of [-10, -6, 6, 10]) prop(P, 'bench', x, 42, Math.PI, { m: 'steel' });
    P.box([4, 0, 32, 12, 1.1, 34], 'helixProp');
    sign(P, 'RAIN CITY GENERAL', 0, 9.2, 48.4, 0, { size: 0.7, color: '#3f9cff', board: 0, e: ['PRESENT'] });
    sign(P, 'RAIN CITY GENERAL HOSPITAL', 0, 8.6, 48.4, 0, { size: 0.5, color: '#2a3a4a', e: ['PAST'] });
    // the ambulance bay: a canopy on the east of the plaza
    P.vbox([20, 4.2, 48, 44, 4.5, 60], 'roofLight');
    for (const [x, z] of [[20, 48], [44, 48], [20, 60], [44, 60]]) P.cyl(x, 0, z, 0.25, 4.2, 'renderWhite', { seg: 8, solid: true });
    P.E('PRESENT', () => { prop(P, 'car', 28, 54, Math.PI / 2, { m: 'ambulanceWhite' }); prop(P, 'car', 36, 54, Math.PI / 2, { m: 'ambulanceWhite' }); });
    P.E('PAST', () => { prop(P, 'car', 30, 54, Math.PI / 2, { m: 'vanWhite' }); prop(P, 'car', -40, 58, 0, { m: 'carRed' }); prop(P, 'car', -48, 58, 0, { m: 'carBlue' }); });
    P.land('gurneyRun', 18, 0, 20, 0);
    // --- the discontinuity court (west) and the garden court (east) ----------------------------------------------------
    P.land('discontinuityCourt', -24, 0, 15, 0);
    P.land('glassWindow', -40.6, 1.4, 14, Math.PI / 2);
    P.land('ivStand', -14, 0, 8, 0);
    // rain falling on its west half, rising on its east half (the sky drifts backwards there: a Sky feature)
    for (let i = 0; i < 14; i++) {
      const x = -38 + (i % 7) * 2.2, z = 4 + Math.floor(i / 7) * 12 + (i % 3) * 3;
      P.vbox([x, 0.1, z, x + 0.04, 9, z + 0.04], 'waterfallWater', { noShadow: 1, prop: 1 });
      P.vbox([x + 16, 0.1, z + 2, x + 16.04, 9, z + 2.04], 'stormGlow', { noShadow: 1, prop: 1 });
    }
    P.cyl(40, 0, 15, 3.2, 0.8, 'renderWhite', { seg: 18, solid: true });
    P.disc(40, 0.75, 15, 2.9, 'fountainWater', { noShadow: 1 });
    for (const [x, z] of [[-34, 6], [-12, 24], [28, 8], [52, 24], [30, 24]]) prop(P, 'bench', x, z, 0.3);
    P.land('musicBox', 52, 0.9, 6, 0);
    P.land('youngKaiBench', 50, 0, 8, -Math.PI / 2);
    P.box([51.4, 0, 5.4, 52.6, 0.8, 6.6], 'renderWhite');
    // --- the quiet colonnade: a covered walk north from the atrium, between the courts (a ward that runs backwards) ----
    P.room('h_colonnade', [8, -24, 16, 30], { name: 'THE QUIET COLONNADE', h: 4, open: true, spawn: [12, 0.86, 28.4, 0] });
    colonnade(P, 8.4, -24, 8.4, 30, 10, 3.6, 0.22, 'renderWhite', { beam: true });
    colonnade(P, 15.6, -24, 15.6, 30, 10, 3.6, 0.22, 'renderWhite', { beam: true });
    P.vbox([7.8, 3.6, -24.4, 16.2, 4.0, 30.4], 'roofLight');
    P.land('quietColonnade', 12, 0, 6, 0);
    // the colonnades round the courts
    colonnade(P, -40, 30.6, -14, 30.6, 6, 3.6, 0.2, 'renderWhite', { beam: true });
    P.vbox([-40.4, 3.6, 29.8, -14, 3.9, 31.4], 'roofLight');
    colonnade(P, 16, 30.6, 58, 30.6, 8, 3.6, 0.2, 'renderWhite', { beam: true });
    P.vbox([16, 3.6, 29.8, 58.4, 3.9, 31.4], 'roofLight');
    // the pavilions round the courts: triage (west, on pilotis), the children's wing (east)
    pavilion(P, [-76, 2, -44, 40], 10, { piloti: true });
    pavilion(P, [60, -24, 78, 34], 9);
    P.land('childrensWing', 59.6, 0, 10, -Math.PI / 2);
    P.E('PAST', () => {
      // 2026: the children's wing painted with murals, an awning, a swing set on the lawn
      for (let i = 0; i < 6; i++) P.vbox([59.7, 0.6, -22 + i * 9.4, 59.9, 6.6, -14 + i * 9.4], 'muralPaint');
      P.vbox([56, 3.0, -20, 60, 3.2, 30], 'awningRed');
      for (const z of [12, 20]) { P.box([42 - 0.1, 0, z - 0.1, 42 + 0.1, 3, z + 0.1], 'accentPink', { solid: false }); P.box([48 - 0.1, 0, z - 0.1, 48 + 0.1, 3, z + 0.1], 'accentPink', { solid: false }); }
      P.vbox([41.8, 2.9, 11.8, 48.2, 3.1, 20.2], 'accentBlue');
    });
    P.E('PRESENT', () => {
      for (let i = 0; i < 6; i++) P.vbox([59.7, 0.6, -22 + i * 9.4, 59.9, 6.6, -14 + i * 9.4], 'accentBlue', { t: 0xe8f0f8 });
    });
    // --- Q1: the records pavilion: the hall under a skylight, its annex (a ward that runs backwards) -------------------
    P.land('recordsGate', -43, 0, -3.4, 0);
    P.room('h_records', [-58, -28, -28, -6], { name: 'RECORDS', h: 8, spawn: [-43, 0.86, -8, 0], light: 0xf4f6f8 });
    walls(P, [-58, -28, -28, -6], 8, {
      doors: { S: [[13.5, 16.5]], N: [[16.5, 19.5]], W: [[11, 17, 2.5]] },
      windows: { S: [[2, 12, 1, 3], [18, 28, 1, 3]], E: [[2, 20, 1, 3.4]] },
    });
    // the west wall leaves the burnt door's doorway (the door and its wall are the REVERSE process's own)
    roof(P, [-58, -28, -28, -6], 8, [-52, -24, -34, -10]);
    P.plane(-58, -28, -28, -6, 0.03, 'hospitalTile', { noShadow: 1 });
    P.land('recordsHall', -43, 0, -17, 0);
    P.land('recordsDoor', -40, 0, -27.75, 0);
    P.land('ledger2026', -31, 0, -14, -Math.PI / 2);
    P.land('tray', -34, 0, -22, 0);
    P.land('waterGlass', -42, 0, -24, 0);
    P.land('burntDoor', -58, 0, -14, Math.PI / 2);
    P.land('charredFile', -54, 0, -20, 0);
    P.land('flatlineMonitor', -50, 0, -24.5, Math.PI / 2);
    P.land('photoBoard', -56, 0, -8, Math.PI / 2);
    // the stacks: pale shelving, file boxes on every shelf
    for (const [x, z] of [[-36, -10], [-36, -16], [-48, -8], [-48, -12]]) {
      P.box([x - 3, 0, z - 0.35, x + 3, 2.4, z + 0.35], 'woodWhite');
      for (const y of [0.5, 1.2, 1.9]) P.vbox([x - 2.8, y, z - 0.38, x + 2.8, y + 0.42, z + 0.38], 'cloth', { t: 0xd8c8a0, prop: 1 });
    }
    // the annex beyond the burnt door: the stacks, scorched, running backwards
    P.room('h_annex', [-74, -28, -58, -6], { name: 'THE ANNEX', h: H, spawn: [-59.6, 0.86, -14, Math.PI / 2], light: 0xffd8b0 });
    wall(P, -74, -28, -58, -28, H, 0.3, 'renderWhite');
    wall(P, -74, -6, -58, -6, H, 0.3, 'renderWhite');
    wall(P, -74, -28, -74, -6, H, 0.3, 'renderWhite', { openings: [[8, 14, 1.2, 2.6]] });
    P.box([-74.1, 1.2, -20, -73.9, 2.6, -14], 'glass', { noShadow: 1 });
    roof(P, [-74, -28, -58, -6], H);
    P.plane(-74, -28, -58, -6, 0.03, 'ash', { noShadow: 1 });
    for (const z of [-26, -22, -10]) P.box([-72, 0, z - 0.4, -62, 2.6, z + 0.4], 'timber', { t: 0x4a3a2a });
    P.land('intercomRoom', -24, 0, -3, 0);
    // --- Q2: the top pavilion: the twin ward, Odile's station, Ward 32; the roof garden and the helipad ----------------
    pavilion(P, [-28, -62, -20, -34], 10);
    pavilion(P, [24, -62, 44, -38], 10);
    // the twin ward (runs backwards), the station, Ward 32 behind its door
    P.room('h_twin', [-20, -58, 2, -40], { name: 'THE REVERSED WARD', h: H, spawn: [0.4, 0.86, -43.5, Math.PI / 2], light: 0xd8e8ff });
    walls(P, [-20, -58, 2, -40], H, { doors: { E: [[13, 16]] }, windows: { S: [[4, 18, 1, 3]], W: [[4, 14, 1, 3]] } });
    P.plane(-20, -58, 2, -40, 0.03, 'hospitalTile', { noShadow: 1 });
    for (const x of [-16, -10, -4]) { P.box([x - 1, 0, -56, x + 1, 0.7, -52], 'renderWhite'); P.box([x - 1, 0.7, -56, x + 1, 1.0, -55], 'renderWhite'); }
    P.land('twinLock', 1.7, 0, -50, -Math.PI / 2);
    P.room('h_station', [2, -50, 22, -34], { name: 'WARD 32: THE DOOR', h: H, spawn: [12, 0.86, -36.5, 0], light: 0xf4f8ff });
    walls(P, [2, -50, 22, -34], H, { doors: { S: [[8.5, 11.5]], W: [[5, 8]], N: [[8.5, 11.5]] }, windows: { E: [[2, 6, 1, 3]] } });
    P.plane(2, -50, 22, -34, 0.03, 'hospitalTile', { noShadow: 1 });
    P.land('odileStation', 6, 0, -40, Math.PI / 2);
    P.box([3, 0, -43, 5, 1.1, -37], 'helixProp');
    P.land('intercom', 21.7, 0, -44, -Math.PI / 2);
    P.land('ward32Door', 12, 0, -49.75, 0);
    P.land('maintTag', 14.05, 1.5, -49.73, 0);
    P.room('h_ward32', [2, -64, 22, -50], { name: 'WARD 32', h: H, spawn: [12, 0.86, -51.8, 0], light: 0xe8f0ff });
    walls(P, [2, -64, 22, -50], H, { doors: { S: [[8.5, 11.5]] }, windows: { N: [[3, 17, 0.9, 3.4]], E: [[3, 11, 0.9, 3.4]] } });
    P.plane(2, -64, 22, -50, 0.03, 'hospitalTile', { noShadow: 1 });
    P.land('ward32', 12, 0, -57, Math.PI);
    P.box([9, 0, -62, 15, 0.7, -58.5], 'renderWhite');
    P.box([9, 0.7, -62, 15, 1.2, -61.4], 'renderWhite');
    // the roof garden and the helipad on the top pavilion (reached by the stair on its east side)
    P.box([22, 0, -68, 44, 9.6, -64], 'renderFacade', { t: 0xffffff });
    P.box([-20, 5, -64, 22, 5.4, -34], 'roofLight');
    P.setTerrain(-20, -64, 22, -34, 5.4);
    P.land('roofGarden', 0, 5.4, -40, Math.PI);
    stair(P, 30, -16, 0, 30, -30, 5.4, 3, 'hospitalPave', { rail: 'steel' });
    P.box([16, 5, -36, 34, 5.4, -30], 'roofLight');
    for (const [x0, z0, x1, z1] of [[-20, -64, 22, -64], [-20, -64, -20, -34], [-20, -34, 16, -34]]) railing(P, x0, z0, x1, z1, 1.1, 'steel', { y: 5.4 });
    P.disc(-6, 5.42, -54, 7, 'helipadMark', { noShadow: 1, seg: 28 });
    for (const [x, z] of [[12, -44], [16, -40], [6, -60]]) P.tree('shrub', x, z, 1.2, { y: 5.4, solid: false });
    // --- the trees: mature magnolias and lindens now, saplings in 2026 ----------------------------------------------
    for (const [x, z] of [[-36, 24], [-28, 6], [-10, 14], [26, 22], [34, 6], [54, 18], [-66, 52], [66, 52], [-56, -44], [50, -48], [-60, 60], [60, -60]]) {
      P.tree(Math.abs(x) > 50 ? 'linden' : 'magnolia', x, z, 1.5, { e: ['PRESENT'] });
      P.tree(Math.abs(x) > 50 ? 'linden' : 'magnolia', x, z, 1.0, { e: ['PAST'] });
    }
    for (let i = 0; i < 20; i++) P.tree('shrub', P.rng.float(-78, 78), P.rng.float(54, 68), 1, { solid: false });
    // the slope west and north: the hill falls toward the city east and south
    for (const [x, z, w, d, h] of [[-90, 0, 20, 140, 9], [0, -80, 160, 20, 12]]) P.obox(x, -1, z, w, h, d, 0, 'rockGrass');
  },
};
