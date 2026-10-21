// The delta port (Mission 13, THE NINE-MINUTE WAR; OVERHAUL.md §5 M13). Rain City's cargo port at the river's
// delta, the largest field in the game: the south quay with its trench and sandbag lines, the container
// canyons, the open ground between the batteries where the shells fly, the rail yard, the dock channel with
// its lifting bridge and gantry crane, the crater field; across the channel the grain silos, "the Cathedral",
// holding the stabilizer, and north of them the frozen district: a residential block caught mid-collapse,
// its people visible inside. 2049, the battle: a low sun through smoke, ash in the air, smoke columns. 2026:
// the working port on a sunny, windy day, coloured containers stacked high, the crater a pond. 2196: a meadow
// over the port, the cranes rusting as monuments, wildflowers in the craters.
//   Q0 THE BATTLEFIELD     the quay, the canyons, the shell zone (z 12 .. 100)
//   Q1 THE THREE DEVICES   the rail yard, the dock crane, the crater field (z -48 .. 12)
//   Q2 THE STABILIZER      the silos and the frozen district, across the channel (z -100 .. -48)
import { ground, water, railing, block, prop, sign, bridge, stair, container, gantry } from '../archetypes.js';

const CH = [-48, -40]; // the dock channel (z)
const CRANE_Y = 14; // the crane cab's platform

export default {
  key: 'warport', style: 'port', sameAs: null, name: 'THE DELTA PORT',
  bounds: [-120, -100, 120, 100],
  edges: { N: 'blocks', E: 'water', W: 'blocks', S: 'water' },
  killY: -3,
  primary: 'silos',
  backdrop: { notch: 'faint', sea: 180 },
  years: {
    PRESENT: { sky: 'battleSmoke', era: '2049', hour: 17.8, sun: { elev: 8, az: 252 }, fog: 0x6a4a3a, density: 1.5, night: 0.3, weather: 'motes', ibl: 'dusk', lit: 0.2,
      hemi: { sky: 0xff9a5a, ground: 0x2a2020, k: 0.8 }, sunColor: 0xff8a3d, sunK: 1.1, grade: { shadowTint: 0x3a1410, highlightTint: 0xffb47a, toning: 0.26, contrast: 1.16, saturation: 1.0 } },
    PAST: { sky: 'windyPort', era: '2026', hour: 11.2, sun: { elev: 46, az: 150 }, fog: 0xc8dcec, density: 0.7, night: 0, weather: null, ibl: 'plant', lit: 0,
      hemi: { sky: 0xcfe6f4, ground: 0x6a7068, k: 1.0 }, sunColor: 0xfffaf0, sunK: 1.3, grade: { shadowTint: 0x1e3a5a, highlightTint: 0xfffaf0, toning: 0.06, contrast: 1.1, saturation: 1.1 } },
    FUTURE: { sky: 'meadowAfternoon', era: '2196', hour: 15.4, sun: { elev: 30, az: 230 }, fog: 0xd8dcc0, density: 0.9, night: 0, weather: 'pollen', ibl: 'dusk', lit: 0,
      hemi: { sky: 0xf0e8c8, ground: 0x8a9050, k: 0.95 }, sunColor: 0xfff0c8, sunK: 1.15, grade: { shadowTint: 0x2a3418, highlightTint: 0xfff4d8, toning: 0.12, contrast: 1.06, saturation: 1.1 } },
  },
  quarters: [
    { name: 'THE BATTLEFIELD', area: [-120, 12, 120, 100], spawnAt: 'quayTrench', threshold: { at: 'canyonGate', kind: 'gap' } },
    { name: 'THE THREE DEVICES', area: [-120, -48, 120, 12], spawnAt: 'canyonGate', threshold: { at: 'liftBridge', kind: 'bridge' } },
    { name: 'THE STABILIZER', area: [-120, -100, 120, -48], spawnAt: 'liftBridgeN', threshold: null },
  ],
  beatAt: { m13: ['fieldOrders', null, 'stabilizer'] },
  exits: { m13: 'siloYardN' },
  frags: { m13: [['helmetPile', 'shellZone', 'flagPost'], ['rollCallDoor', 'craterRim', 'wagonDoor']] },
  watch: { m13: [
    [[[-100, 30], [10, 30]], [[30, 30], [100, 30], [100, 56], [30, 56]]],
    [[[24, -30], [100, -30], [100, -4], [24, -4]], [[-110, -20], [-70, -20], [-70, 4]]],
    [[[-70, -56], [0, -56]], [[10, -60], [100, -60]], [[-100, -96], [-100, -60], [-80, -60]]],
  ] },
  crowd: [
    { era: 'present', years: ['PRESENT'], region: 'port', role: 'trapped', path: [[40, -66], [80, -66]], n: 5 },
    { era: 'present', years: ['PAST'], region: 'port', role: 'docker', path: [[-60, 74], [40, 74]], n: 5 },
    { era: 'future', years: ['FUTURE'], region: 'port', role: 'unwritten', path: [[60, 84], [100, 84], [100, 60]], n: 3 },
  ],

  build(P) {
    // --- the ground, the sea, the dock channel ---------------------------------------------------------------------
    ground(P, [-120, CH[1], 120, 92], 0, 'quayConcrete');
    ground(P, [-120, -100, 120, CH[0]], 0, 'quayConcrete');
    water(P, [-120, 92, 120, 100], -2, 'harbourWater', { depth: 4 });
    water(P, [-120, CH[0], 120, CH[1]], -2.2, 'harbourWater', { depth: 4 });
    P.drown([-120, 92.3, 120, 100], -1.2);
    P.drown([-120, CH[0] + 0.3, 120, CH[1] - 0.3], -1.2);
    for (const z of [92, CH[0], CH[1]]) P.vbox([-120, -2.4, z - 0.3, 120, 0.02, z + 0.3], 'quayConcrete');
    for (let x = -116; x < 120; x += 9) for (const z of [91.2, CH[0] - 0.8, CH[1] + 0.8]) prop(P, 'bollard', x, z, 0, { m: 'rust' });
    P.E('FUTURE', () => {
      // a meadow has grown over the port; the channel has silted to a reed marsh
      for (const r of [[-120, -100, 120, CH[0]], [-120, CH[1], 120, 92]]) P.plane(r[0], r[1], r[2], r[3], 0.04, 'meadowLong', { noShadow: 1 });
      for (let i = 0; i < 60; i++) P.tree('wildflower', P.rng.float(-116, 116), P.rng.float(-96, 88), P.rng.float(0.8, 1.3), { solid: false });
      for (let i = 0; i < 22; i++) P.tree('birch', P.rng.float(-116, 116), P.rng.float(-96, 88), P.rng.float(1.0, 1.6));
    });
    // --- Q0: the quay trench, the field orders, the battery on the south ----------------------------------------
    P.land('quayTrench', 0, 0, 84, Math.PI);
    P.land('fieldOrders', -6, 0, 76, 0);
    P.land('helmetPile', 18, 0, 80, 0);
    P.land('flagPost', -40, 0, 82, 0);
    P.land('batteryB', 92, 0, 84, Math.PI);
    P.land('shellZone', 60, 0, 38, 0);
    P.land('batteryA', -100, 0, -88, 0);
    P.E('PRESENT', () => {
      // the trench line across the quay: sandbag walls, a gap at the middle
      for (const [x0, x1] of [[-110, -4], [4, 110]]) { P.box([x0, 0, 70, x1, 1.3, 71.6], 'sandbag'); P.box([x0, 0, 86.4, x1, 1.0, 88], 'sandbag'); }
      for (let x = -100; x <= 100; x += 25) P.box([x - 1, 0, 71.6, x + 1, 1.3, 74], 'sandbag');
      // the Unwritten guns on the quay, the Continuum's across the channel, both aimed at their own last attack
      for (const [bx, bz, ry, m] of [[92, 84, Math.PI, 'rustRed'], [-100, -88, 0, 'eliteGraphite']]) {
        P.box([bx - 4, 0, bz - 3, bx + 4, 1.2, bz + 3], 'sandbag');
        P.obox(bx, 1.2, bz, 1.6, 1.2, 2.6, ry, m);
        P.obox(bx, 1.8, bz + (ry ? -3 : 3), 0.4, 0.4, 6, ry, m, { rx: ry ? 0.5 : -0.5 });
      }
      // smoke columns: puffs rising and spreading, leaning with the wind
      for (const [x, z, h] of [[30, 50, 30], [-70, 38, 24], [70, -20, 34], [-30, -70, 40], [100, 20, 26]]) {
        for (let i = 0; i < 5; i++) P.sphere(x + i * 1.6, 2 + (h * i) / 5, z - i * 0.8, 2.4 + i * 1.4, 'smoke', { sy: 0.8, noShadow: 1 });
      }
      for (const [x, z] of [[40, 30], [70, 50], [86, 36], [52, 60], [-104, -2], [-88, -16]]) P.disc(x, 0.03, z, 3.4, 'crater', { noShadow: 1 });
      sign(P, 'HOLD THE STABILIZER', -6, 2.6, 75.4, 0, { size: 0.32, color: '#ff8a3d', board: 0 });
    });
    // --- the container canyons (west of the shell zone) ----------------------------------------------------------
    P.land('canyonGate', 22, 0, 10, Math.PI);
    P.land('containerCanyon', -46, 0, 32, 0);
    P.land('listenersRoute', -50, 0, 46, Math.PI / 2);
    const COLS = ['containerRed', 'containerBlue', 'containerOrange', 'containerGreen', 'containerYellow', 'containerGrey'];
    let k = 0;
    for (const z of [16, 26, 36, 52, 62]) {
      for (let x = -106; x < 14; x += 14) {
        if ((z === 36 && x > -60 && x < -40) || (z === 52 && x > -20)) continue; // the canyons' cross gaps
        const m = COLS[k++ % COLS.length];
        const n = 1 + ((k * 7) % 3);
        P.E('PRESENT', () => container(P, x + 6, z, Math.PI / 2, m, { n: Math.min(n, 2) }));
        P.E('PAST', () => container(P, x + 6, z, Math.PI / 2, [m, COLS[(k + 2) % 6], COLS[(k + 4) % 6]], { n: n + 1 }));
        P.E('FUTURE', () => P.obox(x + 6, -0.6, z, 2.5, 2.2, 12, Math.PI / 2 + 0.06, 'rust', { solid: true, rz: 0.08 }));
      }
    }
    // --- Q1: the rail yard (east), the dock crane on the channel, the crater field (west) ------------------------
    P.land('deviceRail', 62, 0, -14, Math.PI);
    P.land('wagonDoor', 80, 0, -24, 0);
    for (const z of [-30, -22, -14, -6]) {
      P.vbox([20, 0.02, z - 0.8, 118, 0.12, z + 0.8], 'ballast', { noShadow: 1 });
      for (const dz of [-0.7, 0.7]) P.vbox([20, 0.12, z + dz - 0.05, 118, 0.22, z + dz + 0.05], 'railSteel', { noShadow: 1 });
    }
    for (const [x, z, n] of [[34, -30, 3], [86, -22, 2], [40, -6, 2], [96, -6, 3]]) {
      for (let i = 0; i < n; i++) {
        P.E(['PRESENT', 'PAST'], () => P.obox(x + i * 13, 0.4, z, 2.8, 3.2, 12, Math.PI / 2, i % 2 ? 'wagonRust' : 'containerGrey', { solid: true }));
        P.E('FUTURE', () => P.obox(x + i * 13, -0.4, z, 2.8, 2.6, 12, Math.PI / 2 + 0.1, 'rust', { solid: true, rz: 0.12 }));
      }
    }
    // the gantry crane over the channel's quay, its cab reached by a stair up the west leg
    P.land('deviceCrane', -62, CRANE_Y, -30, 0);
    P.E(['PRESENT', 'PAST'], () => gantry(P, -62, -32, 16, CRANE_Y + 6, 0, { m: 'craneRed' }));
    P.E('FUTURE', () => gantry(P, -62, -32, 16, CRANE_Y + 6, 0, { m: 'rust' }));
    stair(P, -78, -24, 0, -78, -36.4, CRANE_Y / 2, 2.4, 'gratingSteel', { rail: 'steel' });
    P.box([-80, CRANE_Y / 2 - 0.3, -40, -74, CRANE_Y / 2, -36], 'gratingSteel');
    stair(P, -74.2, -38, CRANE_Y / 2, -66, -38, CRANE_Y, 2.4, 'gratingSteel', { rail: 'steel' });
    P.box([-66.2, CRANE_Y - 0.3, -39.4, -58, CRANE_Y, -28], 'gratingSteel');
    railing(P, -58, -39.4, -58, -28, 1.1, 'steel', { y: CRANE_Y });
    railing(P, -66.2, -28, -58, -28, 1.1, 'steel', { y: CRANE_Y });
    // the crater field: shell craters in 2049, a pond in 2026, wildflowers in 2196
    P.land('deviceCrater', -96, 0, -10, Math.PI / 2);
    P.land('craterRim', -84, 0, -24, 0);
    P.land('burialSite', -104, 0, 0, Math.PI / 2);
    P.E('PRESENT', () => { for (const [x, z, r] of [[-96, -14, 6], [-82, 0, 4], [-108, -28, 5]]) { P.disc(x, 0.04, z, r, 'crater', { noShadow: 1 }); P.torus(x, 0.1, z, r, 0.6, 'ashGround', { rx: Math.PI / 2, seg: 24 }); } });
    P.E('PAST', () => { P.disc(-96, 0.05, -14, 6, 'poolWater', { noShadow: 1 }); for (let i = 0; i < 10; i++) P.tree('grass', -96 + Math.cos(i) * 7, -14 + Math.sin(i) * 7, 1.2, { solid: false }); });
    // --- the channel's crossings: the lifting bridge (raised in the battle), the rail bridge (always) ------------------
    P.land('liftBridge', -20, 0, CH[1] + 3, 0);
    P.land('liftBridgeN', -20, 0, CH[0] - 3, Math.PI);
    P.E(['PAST', 'FUTURE'], () => bridge(P, -20, CH[1] + 0.4, -20, CH[0] - 0.4, 6, 0.02, 'gratingSteel', { parapetMat: 'steel' }));
    P.E('PRESENT', () => {
      // raised: two leaves standing up into the smoke
      P.obox(-20, 0, CH[1] - 0.5, 6, 0.6, 5, 0, 'gratingSteel', { rx: -1.2 });
      P.obox(-20, 0, CH[0] + 0.5, 6, 0.6, 5, 0, 'gratingSteel', { rx: 1.2 });
    });
    for (const s of [-1, 1]) P.box([-20 + s * 4.5 - 1, 0, CH[1] - 1, -20 + s * 4.5 + 1, 5, CH[1] + 1], 'steel');
    bridge(P, 70, CH[1] + 0.4, 70, CH[0] - 0.4, 8, 0.02, 'ballast', { parapetMat: 'rust' });
    // --- Q2: the silos, the stabilizer in their yard, the frozen district ------------------------------------------------
    P.land('silos', -36, 0, -76, 0);
    P.land('stabilizer', -30, 0, -56, 0);
    P.land('siloYardN', -6, 0, -60, Math.PI);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
      const x = -60 + i * 11, z = -90 + j * 12;
      P.cyl(x, 0, z, 5.2, 4, 'siloConcrete', { seg: 18, solid: true });
      P.E(['PRESENT', 'PAST'], () => P.cyl(x, 4, z, 5.2, 24, 'siloConcrete', { seg: 18 }));
      P.E('FUTURE', () => P.cyl(x, 4, z, 5.2, 8 + ((i * 5 + j * 3) % 9), 'siloConcrete', { seg: 18 }));
    }
    P.E(['PRESENT', 'PAST'], () => { P.box([-6, 0, -96, 6, 32, -72], 'siloConcrete', { t: 0xe8e0d0 }); P.gable(0, 32, -84, 13, 25, 4, 0, 'corrugated'); });
    P.E('FUTURE', () => { P.box([-6, 0, -96, 6, 14, -72], 'siloConcrete', { t: 0xc8c0b0 }); P.tree('birch', 0, -84, 2.2, { y: 14, solid: false }); });
    sign(P, 'DELTA GRAIN', 0, 26, -71.9, 0, { size: 1.1, board: 0, color: '#3a3430', e: ['PRESENT', 'PAST'] });
    // the stabilizer: a ring device on a plinth in the silo yard, humming
    P.box([-33, 0, -59, -27, 0.8, -53], 'damConcrete');
    P.E(['PRESENT', 'PAST'], () => { P.torus(-30, 3.6, -56, 2.6, 0.4, 'steel', { seg: 32 }); P.cyl(-30, 0.8, -56, 0.6, 2.2, 'machinePanel', { seg: 10 }); });
    P.E('PRESENT', () => P.torus(-30, 3.6, -56, 3.4, 0.08, 'stormGlow', { seg: 32 }));
    // the frozen district: a residential block caught mid-collapse (2049), whole (2026), mounds (2196)
    P.land('frozenBlock', 60, 0, -78, 0);
    P.land('rollCall', 40, 0, -59.6, 0);
    P.land('rollCallDoor', 50, 0, -59.6, 0);
    for (const [x0, x1, floors] of [[20, 50, 5], [56, 86, 6], [92, 116, 4]]) {
      P.E(['PRESENT', 'PAST'], () => block(P, { rect: [x0, -96, x1, -62], floors: floors - 2, roof: 'none', facade: 'rainBrick', tint: 0xc8a890, cornice: false }));
      P.E('PAST', () => block(P, { rect: [x0, -96, x1, -62], y: (floors - 2) * 3.4, floors: 2, roof: 'flat', facade: 'rainBrick', tint: 0xc8a890, solid: false }));
      P.E('PRESENT', () => {
        // the upper floors hang in the air, broken off and frozen as they fell
        for (let i = 0; i < 5; i++) P.obox(x0 + 4 + i * ((x1 - x0 - 8) / 4), (floors - 2) * 3.4 + 2 + (i % 3) * 3, -79 + (i % 2) * 6, 6, 3, 10, P.rng.float(-0.4, 0.4), 'rainBrick', { rx: P.rng.float(-0.4, 0.4), rz: P.rng.float(-0.5, 0.5), t: 0xc8a890 });
        for (let i = 0; i < 8; i++) P.obox(x0 + P.rng.float(2, x1 - x0 - 2), (floors - 2) * 3.4 + P.rng.float(1, 9), -64 + P.rng.float(-2, 4), P.rng.float(0.6, 2), P.rng.float(0.4, 1.4), P.rng.float(0.6, 2), P.rng.float(0, 3), 'concrete', { rx: P.rng.float(0, 3), prop: 1 });
      });
      P.E('FUTURE', () => P.obox((x0 + x1) / 2, -1, -79, x1 - x0, 6, 30, 0, 'rockGrass', { rx: 0.1, solid: true }));
    }
    P.E('PRESENT', () => P.vbox([20, 0, -62.4, 116, 12, -62.2], 'frozenGlass', { noShadow: 1 }));
    P.challenge('drones', [-120, -100, 120, 92], ['PRESENT', 'PAST', 'FUTURE'], null);
  },
};
