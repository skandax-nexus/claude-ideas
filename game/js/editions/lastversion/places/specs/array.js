// The Witness's archive (Mission 17, THE WITNESS'S ARCHIVE; OVERHAUL.md §5 M17, D3). A radio-telescope array on
// a high desert plateau, mesas on the horizon: nine 25 m dishes on rails, each tagged "n OF 117"; between
// them the shifting corridors, cable trenches and rows of recording-drum racks that stand differently in
// every year, so the way through changes when the year does; the half-roofless control hall in the north,
// with a full-scale reconstruction of the original experiment: the console, a child's step stool, two logs.
// 2049: a cold clear night with the Milky Way, red aircraft lights on the dishes, frost. 2026: the array under
// construction in blazing afternoon heat, cranes, ochre. 2196: dawn, the dishes tilted and drifted with sand,
// the Witness's lanterns.
//   Q0 THE SHIFTING CORRIDOR    the south (z 50 .. 130)
//   Q1 THE RECORDINGS           the dishes (x -20 .. 130, z -60 .. 50)
//   Q2 THE EARLIER ROOMS        the west annex (x -130 .. -20, z -80 .. 50)
//   Q3 THE ORIGINAL EXPERIMENT  the control hall (z -130 .. -60)
import { ground, wall, railing, prop, sign, dish, canopy } from '../archetypes.js';

const DISHES = [[-80, -30], [0, -30], [80, -30], [-80, 30], [0, 30], [80, 30], [-80, 90], [0, 90], [80, 90]].map(([x, z], i) => ({ x: x + (i % 2 ? 6 : -4), z, n: [3, 17, 29, 44, 58, 71, 88, 102, 117][i] }));

// the corridors: rows of drum racks (2.4 m) that stand in a different pattern each year; each row is a run of
// racks along x at z with gaps (u0 .. u1 open)
const RACKS = {
  PRESENT: [[60, -130, 130, [[-20, -8], [40, 52]]], [76, -130, 130, [[-60, -48], [8, 20]]], [108, -60, 60, [[-12, 0]]]],
  PAST: [[60, -130, 130, [[-60, -48], [8, 20]]], [76, -130, 130, [[-20, -8], [60, 72]]], [108, -60, 60, [[24, 36]]]],
  FUTURE: [[60, -130, 130, [[60, 72]]], [76, -130, 130, [[-40, -28], [-20, -8]]], [108, -60, 60, [[-40, -28]]]],
};

export default {
  key: 'array', style: 'desertArray', sameAs: null, name: 'THE ARRAY',
  bounds: [-130, -130, 130, 130],
  edges: { N: 'meadow', E: 'meadow', W: 'meadow', S: 'meadow' },
  killY: -3,
  primary: 'controlHall',
  backdrop: { kind: 'desert' },
  years: {
    PRESENT: { sky: 'milkyWay', era: '2049', hour: 1.4, sun: { elev: 40, az: 160 }, fog: 0x141c34, density: 0.7, night: 0.8, weather: 'frost', ibl: 'night', lit: 0.6,
      hemi: { sky: 0x2a3a6a, ground: 0x0e1018, k: 0.7 }, sunColor: 0x8a9ac8, sunK: 0.35, grade: { shadowTint: 0x0a1430, highlightTint: 0xc8d8ff, toning: 0.22, contrast: 1.16, saturation: 0.92 } },
    PAST: { sky: 'heatHaze', era: '2026', hour: 15.4, sun: { elev: 52, az: 225 }, fog: 0xe0c898, density: 1.3, night: 0, weather: 'motes', ibl: 'plant', lit: 0,
      hemi: { sky: 0xf2dcaa, ground: 0xb0905a, k: 1.0 }, sunColor: 0xfff8e0, sunK: 1.4, grade: { shadowTint: 0x5a3a1a, highlightTint: 0xfff4d8, toning: 0.2, contrast: 1.12, saturation: 1.06 } },
    FUTURE: { sky: 'sandDawn', era: '2196', hour: 6.3, sun: { elev: 4, az: 95 }, fog: 0xc89a7a, density: 1.4, night: 0.15, weather: 'motes', ibl: 'dusk', lit: 0,
      hemi: { sky: 0xf2b48a, ground: 0x5a4a44, k: 0.85 }, sunColor: 0xffb080, sunK: 1.0, grade: { shadowTint: 0x2a1c2a, highlightTint: 0xffd8b8, toning: 0.24, contrast: 1.1, saturation: 1.02 } },
  },
  quarters: [
    { name: 'THE SHIFTING CORRIDOR', area: [-130, 50, 130, 130], spawnAt: 'arrival', threshold: { at: 'corridorEnd', kind: 'gap' } },
    { name: 'THE RECORDINGS', area: [-20, -60, 130, 54], spawnAt: 'corridorEnd', threshold: { at: 'echoGate', kind: 'gate' } },
    { name: 'THE EARLIER ROOMS', area: [-130, -80, -20, 50], spawnAt: 'echoGate', threshold: { at: 'hallDoor', kind: 'door' } },
    { name: 'THE ORIGINAL EXPERIMENT', area: [-130, -130, 130, -60], spawnAt: 'hallDoor', threshold: null },
  ],
  beatAt: { m17: ['drumRacks', 'shelves', 'reconstruction'] },
  exits: { m17: 'letterDesk' },
  frags: { m17: [['cableTrenches', 'dish7', 'dish8'], ['dish5', 'dish2', 'mimicPatrol']] },
  watch: { m17: [
    [[[-60, 92], [60, 92]]],
    [[[20, 0], [100, 0], [100, 12], [20, 12]], [[-10, -50], [-10, 40]]],
    [[[-110, -20], [-40, -20]]],
  ] },
  crowd: [
    { era: 'present', years: ['PAST'], region: 'array', role: 'builder', path: [[-40, 0], [40, 0]], n: 4,
      barks: ['Forty degrees, and they want the dish true to a millimetre.', 'Somebody is paying for all this. Nobody will say who.'] },
    { era: 'present', years: ['PRESENT'], region: 'array', role: 'recording', path: [[-6, -100], [6, -100]], n: 2, echo: true },
  ],

  build(P) {
    ground(P, [-130, -130, 130, 130], 0, 'sand');
    P.E('FUTURE', () => {
      // drifted sand: long low dunes across the array
      for (let i = 0; i < 14; i++) P.obox(P.rng.float(-120, 120), -1.2, P.rng.float(-120, 120), P.rng.float(14, 30), P.rng.float(1.6, 2.6), P.rng.float(5, 9), P.rng.float(-0.6, 0.6), 'sand', { rx: P.rng.float(-0.05, 0.05) });
    });
    // --- the nine dishes on their rails, tagged n OF 117 -------------------------------------------------------
    for (const z of [-30, 30, 90]) for (const dz of [-1.2, 1.2]) P.vbox([-120, 0.02, z + dz - 0.08, 120, 0.2, z + dz + 0.08], 'railSteel', { noShadow: 1 });
    DISHES.forEach((d, i) => {
      const name = `dish${i + 1}`;
      P.land(name, d.x, 0, d.z + 4, 0);
      P.E('PRESENT', () => dish(P, d.x, d.z, 12, { tilt: 0.55, az: 170, light: 'redBeacon' }));
      P.E('FUTURE', () => dish(P, d.x, d.z, 12, { tilt: 1.15 + (i % 3) * 0.1, az: 120 + i * 25, m: 'sand', yoke: 'rust' }));
      P.E('PAST', () => {
        if (i % 3 === 1) { dish(P, d.x, d.z, 12, { tilt: 0.0, az: 0 }); return; }
        // still being built: the pedestal and the yoke, the bowl in pieces on the ground, a crane over it
        P.cyl(d.x, 0, d.z, 1.6, 1.4, 'hallConcrete', { seg: 10, solid: true });
        P.obox(d.x, 1.4, d.z, 1.6, 9, 1.6, 0, 'scaffold');
        for (let k = 0; k < 4; k++) P.obox(d.x + 6 + k * 2, 0, d.z + 5, 4.4, 0.4, 2.6, k * 0.6, 'dishWhite', { rx: 0.2 });
        P.obox(d.x - 8, 0, d.z - 6, 1.2, 26, 1.2, 0, 'craneYellow', { solid: true });
        P.obox(d.x - 8, 26, d.z + 4, 1, 1, 22, 0, 'craneYellow');
      });
      sign(P, `${d.n} OF 117`, d.x, 1.5, d.z + 1.62, 0, { size: 0.32, color: '#ff6a48', board: 0, e: ['PRESENT', 'FUTURE'] }); // (the Witness's archive is not tagged while the array is being built)
    });
    // --- Q0: the arrival, the cable trenches and the drum-rack corridors (a different maze each year) ----------------
    P.land('arrival', 0, 0, 122, Math.PI);
    P.land('corridorEnd', 0, 0, 52, Math.PI);
    P.land('cableTrenches', -40, 0, 100, 0);
    P.land('drumRacks', 12, 0, 66, 0);
    for (const x of [-60, -20, 20, 60]) P.vbox([x - 0.8, -0.3, 40, x + 0.8, 0.02, 128], 'cablePath', { noShadow: 1 });
    for (const [st, rows] of Object.entries(RACKS)) {
      P.E(st, () => {
        for (const [z, x0, x1, gaps] of rows) {
          let u = x0;
          for (const [g0, g1] of [...gaps, [x1, x1]]) {
            if (g0 > u) {
              if (st === 'FUTURE') P.obox((u + g0) / 2, -0.4, z, g0 - u, 2.0, 1.4, 0, 'drumRack', { rz: 0.06, solid: true, t: 0xc8a070 });
              else if (st === 'PAST') { for (let x = u + 1; x < g0 - 1; x += 3) prop(P, 'crate', x, z, 0.2); P.col([u, 0, z - 0.6, g0, 1.1, z + 0.6]); }
              else { P.box([u, 0, z - 0.6, g0, 2.4, z + 0.6], 'drumRack'); for (let x = u + 1; x < g0; x += 2.2) P.vbox([x, 1.9, z + 0.6, x + 0.3, 2.1, z + 0.64], 'redBeacon', { noShadow: 1, prop: 1 }); }
            }
            u = g1;
          }
        }
      });
    }
    P.challenge('corridors', [-130, 50, 130, 130], ['PRESENT', 'PAST', 'FUTURE'], ['The racks stand in rows. There is always a gap, somewhere.', 'The rows are different in every year. A gap in one year is a wall in another.', 'Switch the year and look along the rows again; walk through where the gaps line up.'], { optional: true });
    // --- Q1: the shelves of physical objects (the recordings' evidence), the mimics' patrol ----------------------------
    P.land('shelves', 40, 0, 4, Math.PI);
    P.land('mimicPatrol', 60, 0, 6, 0);
    canopy(P, { rect: [30, -2, 52, 8], h: 3.2, roof: 'corrugated', span: 7, postMat: 'steel' });
    for (const x of [33, 39, 45]) P.box([x - 2.4, 0, -1.6, x + 2.4, 2.2, -0.8], 'drumRack');
    // --- Q2: the earlier rooms: the ruins of the array's first huts, open in some years only ------------------------
    P.land('echoGate', -24, 0, -6, -Math.PI / 2);
    P.land('earlierRooms', -70, 0, -60, 0);
    for (const [x, z] of [[-60, -54], [-80, -54], [-100, -54], [-60, -70], [-100, -70]]) {
      P.box([x - 7, 0, z - 0.2, x + 7, 3.2, z + 0.2], 'hallConcrete');
      P.E(['PAST'], () => P.vbox([x - 7, 3.2, z - 6, x + 7, 3.4, z + 0.2], 'corrugated'));
    }
    wall(P, -110, -76, -110, -48, 3.2, 0.4, 'hallConcrete');
    P.E('PRESENT', () => P.box([-28, 0, -10, -26, 3, -2], 'drumRack')); // (the echo gate: shut now, open in another year)
    // --- Q3: the control hall, half its roof gone: the reconstruction of the original experiment -----------------------
    P.land('hallDoor', 0, 0, -78, Math.PI);
    P.land('controlHall', 0, 0, -100, 0);
    P.land('reconstruction', 0, 0, -104, Math.PI);
    P.land('letterDesk', 18, 0, -112, -Math.PI / 2);
    wall(P, -32, -126, 32, -126, 7, 0.6, 'hallConcrete');
    wall(P, -32, -126, -32, -82, 7, 0.6, 'hallConcrete', { openings: [[10, 20, 1.2, 5]] });
    wall(P, 32, -126, 32, -82, 7, 0.6, 'hallConcrete', { openings: [[10, 20, 1.2, 5]] });
    wall(P, -32, -82, 32, -82, 7, 0.6, 'hallConcrete', { openings: [[28, 36]] });
    // the roof survives over the north half only (the rest is open to the sky; in 2196 none of it)
    P.E(['PRESENT', 'PAST'], () => P.vbox([-32, 7, -126, 32, 7.4, -104], 'corrugated'));
    for (let x = -28; x <= 28; x += 8) P.vbox([x - 0.2, 6.6, -126, x + 0.2, 7, -82], 'steel', { noShadow: 1 });
    // the reconstruction: Chamber One, 2026, 16:02, a console built for grown men and a child's step stool
    P.box([-3, 0, -108, 3, 1.1, -106], 'machinePanel');
    P.box([-0.4, 0, -105.6, 0.4, 0.35, -105], 'woodWhite');
    P.torus(0, 5, -117, 4.2, 0.45, 'blackRing', { seg: 40 });
    P.box([-4.6, 0, -117.6, 4.6, 0.6, -116.4], 'blackRing');
    P.box([16, 0, -114, 20, 0.85, -110], 'woodFloor');
    P.E('FUTURE', () => { for (let i = 0; i < 8; i++) prop(P, 'torch', -24 + i * 7, -86 - (i % 2) * 30, 0); });
    P.E('PRESENT', () => { for (const x of [-20, 20]) prop(P, 'floodlight', x, -86, 0); });
    for (let i = 0; i < 24; i++) P.tree('scrub', P.rng.float(-125, 125), P.rng.float(-125, 125), P.rng.float(0.8, 1.4), { solid: false });
  },
};
