// The lock city (Mission 15, THE CITY THAT FORGOT TOMORROW; OVERHAUL.md §5 M15, D3). A 2196 survivors' city
// built into a ruined stadium in Rain City's eastern suburbs: houses stacked on the stands' tiers, the market
// on the pitch, the school in the main stand, the rail halt outside the north gate on its raised platform,
// the central archive in the broken press tower (chain C's two archives and the museum display). Sixty metres
// over the bowl turns Anja's lock, a halo of light in an open sky. Every 120 s the routines reset. 2196: an
// eternal late morning in pale gold and lilac, bunting and laundry. 2026: match day, an evening under the
// floodlights, the stands full of colour. 2049: the empty stadium the day after the Zero Second, an
// evacuation centre of tents in the rain.
//   Q0 THE STATION            the north gate and the rail halt (z -110 .. -62)
//   Q1 THE SCHOOL & MARKET    the pitch and the main stand (x -110 .. 40)
//   Q2 THE ARCHIVE / THE LOCK the press tower in the north-east corner (x 40 .. 110)
import { ground, stair, railing, prop, sign, canopy } from '../archetypes.js';

const PX = 50, PZ = 34; // the pitch's half sizes
const TIERS = 6, DEPTH = 4, RISE = 2.4, T0 = 1.6; // the stands: tier i stands at T0 + i * RISE, DEPTH deep
const RIM = T0 + (TIERS - 1) * RISE; // 13.6: the rim concourse
const AISLES = [-24, 0, 24]; // each stand's stairs (along it, from its middle)

// the bowl (D10's custom helper): four straight stands stepping up from the pitch, square corners, aisles of
// stairs cut through the tiers, a concourse round the rim, the outer wall
function bowl(P, { seats }) {
  const tierTop = (i) => T0 + i * RISE;
  for (let i = 0; i < TIERS; i++) {
    const a = PX + i * DEPTH, b = PZ + i * DEPTH, y = tierTop(i);
    const out = i === TIERS - 1 ? 8 : DEPTH;
    // each stand's tier as segments between its aisles (2.6 m gaps the stairs fill)
    for (const side of ['N', 'S', 'E', 'W']) {
      const alongX = side === 'N' || side === 'S';
      const half = alongX ? a + out : b + out;
      const gap = (c) => (side === 'N' && c === 0 ? 3 : 1.3); // (the north stand's middle is the tunnel from the gate)
      const cuts = [-half, ...AISLES.flatMap((c) => [c - gap(c), c + gap(c)]), half];
      for (let k = 0; k < cuts.length; k += 2) {
        const [u0, u1] = [cuts[k], cuts[k + 1]];
        const box = side === 'N' ? [u0, 0, -b - out, u1, y, -b] : side === 'S' ? [u0, 0, b, u1, y, b + out] : side === 'W' ? [-a - out, 0, u0, -a, y, u1] : [a, 0, u0, a + out, y, u1];
        P.box(box, 'stadiumConcrete');
        // the seats on the tier's riser
        const r = side === 'N' ? [u0, y - RISE + 0.2, -b - 0.06, u1, y - 0.1, -b] : side === 'S' ? [u0, y - RISE + 0.2, b, u1, y - 0.1, b + 0.06] : side === 'W' ? [-a - 0.06, y - RISE + 0.2, u0, -a, y - 0.1, u1] : [a, y - RISE + 0.2, u0, a + 0.06, y - 0.1, u1];
        if (i > 0) P.vbox(r, seats(side, i), { noShadow: 1 });
      }
    }
    P.setTerrain(-a - out, -b - out, a + out, b + out, y);
  }
  // the pitch is the floor of the bowl
  P.setTerrain(-PX, -PZ, PX, PZ, 0);
  // the aisles: straight stairs up each stand from the pitch's edge to the rim
  const run = (TIERS - 1) * DEPTH + DEPTH;
  for (const c of AISLES) {
    if (c !== 0) stair(P, c, -PZ, 0, c, -PZ - run, RIM, 2.4, 'stadiumConcrete', { rail: 'steel' });
    stair(P, c, PZ, 0, c, PZ + run, RIM, 2.4, 'stadiumConcrete', { rail: 'steel' });
    stair(P, -PX, c, 0, -PX - run, c, RIM, 2.4, 'stadiumConcrete', { rail: 'steel' });
    stair(P, PX, c, 0, PX + run, c, RIM, 2.4, 'stadiumConcrete', { rail: 'steel' });
  }
  // the outer wall, broken in places, and the stair down from the north concourse to the gate
  const OA = PX + TIERS * DEPTH + 4, OB = PZ + TIERS * DEPTH + 4;
  for (const [x0, z0, x1, z1] of [[-OA, -OB, -6, -OB + 1], [6, -OB, OA, -OB + 1], [-OA, OB - 1, OA, OB], [-OA, -OB, -OA + 1, OB], [OA - 1, -OB, OA, OB]]) P.box([x0, 0, z0, x1, RIM + 3 + (x0 * 3 % 4), z1], 'stadiumConcrete');
  return { OA, OB };
}

export default {
  key: 'lockcity', style: 'stadium', sameAs: null, name: 'THE LOCK CITY',
  bounds: [-110, -110, 110, 110],
  edges: { N: 'blocks', E: 'blocks', W: 'blocks', S: 'meadow' },
  killY: -3,
  primary: 'lockHalo',
  backdrop: { notch: 'faint', sea: 200 },
  years: {
    FUTURE: { sky: 'lilacMorning', era: '2196', hour: 11.6, sun: { elev: 42, az: 150 }, fog: 0xd8d0e0, density: 0.8, night: 0, weather: 'motes', ibl: 'dusk', lit: 0,
      hemi: { sky: 0xfff0d0, ground: 0x9a8a8a, k: 1.0 }, sunColor: 0xfff0d8, sunK: 1.15, grade: { shadowTint: 0x3a2a4a, highlightTint: 0xfff0d8, toning: 0.18, contrast: 1.04, saturation: 1.0 } },
    PAST: { sky: 'floodlitEvening', era: '2026', hour: 20.6, sun: { elev: -8, az: 290 }, fog: 0x2a2c48, density: 0.8, night: 0.65, weather: null, ibl: 'night', lit: 1,
      hemi: { sky: 0x4a4a7a, ground: 0x14161e, k: 0.75 }, sunColor: 0xe8f0ff, sunK: 0.5, grade: { shadowTint: 0x101830, highlightTint: 0xf0f4ff, toning: 0.12, contrast: 1.14, saturation: 1.12 } },
    PRESENT: { sky: 'tentRain', era: '2049', hour: 14.2, sun: { elev: 30, az: 200 }, fog: 0x7a8288, density: 1.4, night: 0.2, weather: 'rain', ibl: 'night', lit: 0.3,
      hemi: { sky: 0x8e969c, ground: 0x3a3c3a, k: 0.85 }, sunColor: 0xc8ccd0, sunK: 0.55, grade: { shadowTint: 0x1c242c, highlightTint: 0xd8e0e8, toning: 0.1, contrast: 1.06, saturation: 0.82 } },
  },
  skyFeatures: { all: [{ kind: 'halo', at: [0, 60, 0], r: 30, tilt: 0.15, when: '@FUTURE' }] },
  quarters: [
    { name: 'THE STATION', area: [-110, -110, 110, -62], spawnAt: 'northGate', threshold: { at: 'gateTunnel', kind: 'gate' } },
    { name: 'THE SCHOOL & MARKET', area: [-110, -62, 40, 110], spawnAt: 'market', threshold: { at: 'pressFoot', kind: 'stair' } },
    { name: 'THE ARCHIVE / THE LOCK', area: [40, -62, 110, 110], spawnAt: 'pressFoot', threshold: null },
  ],
  // (Case C, TWO RECORDS, ONE DISASTER, replays Mission 15's archive: cases.js; this map, its quarters)
  beatAt: { m15: ['departureBoard', 'floodLine', 'lockConsole'] },
  exits: { m15: 'pressFoot', c_c: 'museumDisplay' },
  frags: { m15: [['railHalt', 'evacTrain', 'gateTunnel'], ['register', 'marketWell', 'schoolDoor']] },
  crowd: [
    { era: 'future', years: ['FUTURE'], region: 'lockcity', role: 'resident', path: [[-30, -10], [30, -10], [30, 10], [-30, 10]], n: 6,
      barks: ['Same bread as yesterday.'] },
    { era: 'future', years: ['FUTURE'], region: 'lockcity', role: 'child', path: [[-62, -10], [-62, 10]], y: T0 + 2 * RISE, n: 3, barks: ['Present, miss.'] },
    { era: 'present', years: ['PAST'], region: 'lockcity', role: 'fan', path: [[-40, -48], [40, -48]], y: T0 + 3 * RISE, n: 5,
      barks: ['Two-nil at the half!'] },
    { era: 'present', years: ['PRESENT'], region: 'lockcity', role: 'evacuee', path: [[-20, 20], [20, 20]], n: 4,
      barks: ['Trains by noon, they said.'] },
  ],

  build(P) {
    ground(P, [-110, -110, 110, 110], 0, 'quayConcrete');
    P.plane(-PX, -PZ, PX, PZ, 0.02, 'pitchGrass', { noShadow: 1 });
    // the bowl: grey seats faded in 2196, colour in 2026, rain-dark in 2049 (one riser material per year)
    const { OA, OB } = bowl(P, { seats: (side, i) => ((side === 'W' || side === 'E') && i % 2 ? 'seatsRed' : 'seatsBlue') });
    P.E('FUTURE', () => P.plane(-PX - 4, -PZ - 4, PX + 4, PZ + 4, 0.03, 'meadowLong', { noShadow: 1 }));
    P.E('PAST', () => {
      // the pitch's lines, the goals, the four floodlight masts lit
      for (const r of [[-0.2, -PZ, 0.2, PZ], [-PX, -PZ, PX, -PZ + 0.3], [-PX, PZ - 0.3, PX, PZ], [-PX, -PZ, -PX + 0.3, PZ], [PX - 0.3, -PZ, PX, PZ]]) P.vbox([r[0], 0.03, r[1], r[2], 0.05, r[3]], 'helipadMark', { noShadow: 1 });
      P.torus(0, 0.04, 0, 9, 0.12, 'helipadMark', { rx: Math.PI / 2, seg: 40 });
      for (const s of [-1, 1]) { P.vbox([s * PX - 0.1, 0, -3.7, s * PX + 0.1, 2.4, 3.7], 'mastWhite'); }
    });
    for (const [x, z] of [[-OA + 6, -OB + 6], [OA - 6, -OB + 6], [-OA + 6, OB - 6], [OA - 6, OB - 6]]) {
      P.cyl(x, 0, z, 0.6, 38, 'steel', { seg: 8, solid: true });
      P.E('PAST', () => { P.obox(x, 38, z, 8, 4, 1, Math.atan2(-x, -z), 'floodlightGlow'); P.glow(x * 0.5, 0.05, z * 0.5, 12, 0xe8f0ff); });
      P.E(['PRESENT', 'FUTURE'], () => P.obox(x, 38, z, 8, 4, 1, Math.atan2(-x, -z), 'rust', { rx: 0.3 }));
    }
    // --- 2196: houses stacked on the tiers, bunting and laundry across the bowl, the market on the pitch ---------
    P.E('FUTURE', () => {
      let k = 0;
      for (let i = 1; i < TIERS; i++) {
        const y = T0 + i * RISE;
        for (const [side, n] of [['W', 8], ['E', 8], ['S', 10], ['N', 10]]) {
          for (let j = 0; j < n; j++) {
            const u = -0.85 + (1.7 * (j + 0.5)) / n;
            const alongX = side === 'N' || side === 'S';
            const L = (alongX ? PX : PZ) + i * DEPTH;
            const pos = u * L;
            if (AISLES.some((c) => Math.abs(pos - c) < 4) || (k++ * 7) % 5 === 0) continue;
            const depth = i * DEPTH, w = 3.2;
            const [hx, hz] = alongX ? [pos, (side === 'N' ? -1 : 1) * (PZ + depth + 2)] : [(side === 'W' ? -1 : 1) * (PX + depth + 2), pos];
            P.obox(hx, y, hz, alongX ? w : 2.6, 2.2, alongX ? 2.6 : w, 0, k % 3 ? 'whitewash' : 'containerHouse', { t: [0xf4e8f0, 0xe8e0f4, 0xf8f0d8][k % 3] });
            P.obox(hx, y + 2.2, hz, alongX ? w + 0.6 : 3.2, 0.25, alongX ? 3.2 : w + 0.6, 0, 'lilacTarp', { rz: 0.08 });
          }
        }
      }
      for (let i = 0; i < 6; i++) P.obox(0, RIM + 2 - (i % 2), -40 + i * 16, 0.05, 0.6, 1, 0, 'bunting', { prop: 1 });
      for (const [x0, z0, x1, z1] of [[-60, -48, 60, 48], [-60, 48, 60, -48], [-70, 0, 70, 0]]) {
        const len = Math.hypot(x1 - x0, z1 - z0);
        P.obox((x0 + x1) / 2, RIM + 1.2, (z0 + z1) / 2, 0.4, 0.04, len, Math.atan2(x1 - x0, z1 - z0), 'bunting', { noShadow: 1 });
      }
      for (let i = 0; i < 8; i++) prop(P, 'rack', -44 + i * 12, PZ + 6, 0, { y: T0 + RISE, goods: 'laundry' });
    });
    P.land('market', 0, 0, 6, Math.PI);
    P.land('marketWell', -8, 0, 4, 0);
    P.land('floodLine', -PX + 2, 0, -14, -Math.PI / 2);
    P.E('FUTURE', () => {
      for (let i = 0; i < 10; i++) prop(P, 'stall', -36 + (i % 5) * 18, i < 5 ? -12 : 18, i < 5 ? 0 : Math.PI, { awning: i % 2 ? 'lilacTarp' : 'awningGreen', goods: 'produce' });
      P.cyl(-8, 0, 4, 1.4, 0.9, 'quarryCut', { seg: 12, solid: true });
    });
    // the flood line: a band of silt on the west stand's foot, where the river came in on the 14th
    P.vbox([-PX - 0.1, 0.6, -PZ, -PX, 1.3, PZ], 'mud', { noShadow: 1 });
    // 2049: the evacuation tents on the pitch, in the rain
    P.E('PRESENT', () => {
      for (let i = 0; i < 18; i++) P.obox(-40 + (i % 6) * 16, 0, -24 + Math.floor(i / 6) * 22, 6, 2.8, 4, 0, 'tentWhite', { solid: true, shrink: 0.9 });
      for (let i = 0; i < 4; i++) P.gable(-40 + i * 26, 2.8, 22, 6, 12, 1.6, 0, 'tarp');
    });
    // --- the school in the main stand (west), at the rim ----------------------------------------------------
    P.land('school', -76, RIM, 6, Math.PI / 2);
    P.land('schoolDoor', -72, RIM, 14, Math.PI / 2);
    P.land('register', -72.6, RIM, -6, Math.PI / 2);
    P.box([-OA + 1, RIM, -20, -75, RIM + 5, 20], 'stadiumConcrete');
    P.vbox([-75.1, RIM + 0.8, -18, -75, RIM + 3.6, 18], 'glass', { noShadow: 1 });
    P.vbox([-OA, RIM + 5, -24, -PX - 10, RIM + 5.4, 24], 'roofLight');
    for (const z of [-22, 22]) P.cyl(-PX - 12, RIM, z, 0.3, 5, 'steel', { seg: 8, solid: true });
    // --- Q0: the north gate, the tunnel under the north stand, the rail halt on its platform -----------------------
    P.land('northGate', 6, 0, -OB - 15, -0.36); // (on the station's forecourt, the north stand and its gate ahead)
    P.land('gateTunnel', 0, 0, -OB + 2, 0);
    P.land('railHalt', 0, 3, -96, 0);
    P.land('departureBoard', -12, 3, -92, 0);
    P.land('evacTrain', 20, 3, -100, 0);
    // the tunnel through the north stand to the pitch
    P.box([-3, 0, -PZ - TIERS * DEPTH - 4, 3, 0.02, -PZ], 'stadiumConcrete', { solid: false });
    // (the stand's middle aisle runs over the tunnel: the gate is the way in)
    P.box([-30, 0, -104, 30, 3, -88], 'stadiumConcrete');
    P.setTerrain(-30, -104, 30, -88, 3);
    stair(P, 0, -79, 0, 0, -88, 3, 6, 'stadiumConcrete', { rail: 'steel' });
    canopy(P, { rect: [-26, -102, 26, -90], h: 4, roof: 'corrugated', span: 8, y: 3 });
    for (const x of [-60, -30, 30, 60]) P.vbox([x - 15, 0.02, -108, x + 15, 0.14, -106], 'railSteel', { noShadow: 1 });
    P.vbox([-110, 0.02, -108.6, 110, 0.12, -105.4], 'ballast', { noShadow: 1 });
    P.E(['FUTURE', 'PRESENT'], () => { for (let i = 0; i < 3; i++) P.obox(20 + (i - 1) * 13, 0.2, -107, 3, 3.4, 12.4, Math.PI / 2, i === 1 ? 'trainBody' : 'containerGrey', { solid: false }); });
    P.E('PAST', () => { for (let i = 0; i < 6; i++) prop(P, 'car', -90 + i * 14, -80, 0); });
    // --- Q2: the press tower in the north-east corner: the archive at the rim, broken open to the sky -----------
    const TX = PX + 12, TZ = -PZ - 12;
    P.land('pressTower', TX, 0, TZ, -Math.PI / 4);
    P.land('pressFoot', 74, RIM, -28, Math.PI);
    P.land('pressStairTop', TX + 14, RIM, TZ, -Math.PI / 2);
    P.land('archiveA', TX - 4, RIM, TZ - 4, Math.PI / 4);
    P.land('archiveB', TX + 4, RIM, TZ + 4, -Math.PI * 0.75);
    P.land('card14', TX, RIM, TZ - 6, 0);
    P.land('audioCylinder', TX + 6, RIM, TZ - 2, 0);
    P.land('museumDisplay', TX - 6, RIM, TZ + 2, Math.PI / 2);
    P.land('anjaDesk', TX + 2, RIM, TZ + 8, Math.PI);
    P.land('lockConsole', TX, RIM, TZ, Math.PI);
    P.land('lockHalo', 0, 60, 0, 0);
    // the tower: its shaft, the archive floor at the rim level (open sky above: the roof has gone)
    P.box([TX - 10, 0, TZ - 10, TX + 10, RIM, TZ + 10], 'stadiumConcrete');
    P.setTerrain(TX - 10, TZ - 10, TX + 10, TZ + 10, RIM);
    for (const [x0, z0, x1, z1, h] of [[TX - 10, TZ - 10, TX + 10, TZ - 9.4, 9], [TX - 10, TZ - 10, TX - 9.4, TZ + 4, 6], [TX + 9.4, TZ - 10, TX + 10, TZ + 10, 7]]) P.box([x0, RIM, z0, x1, RIM + h, z1], 'stadiumConcrete');
    P.vbox([TX - 9.4, RIM + 1, TZ - 9.5, TX + 9.4, RIM + 6, TZ - 9.45], 'glass', { noShadow: 1 });
    P.E(['FUTURE', 'PRESENT'], () => { for (let i = 0; i < 6; i++) P.obox(TX + P.rng.float(-8, 8), RIM, TZ + P.rng.float(-8, 8), P.rng.float(1, 3), P.rng.float(0.4, 1.2), P.rng.float(1, 3), P.rng.float(0, 3), 'rawConcrete', { rx: P.rng.float(-0.4, 0.4), prop: 1 }); });
    P.E('PAST', () => { P.vbox([TX - 10, RIM + 9, TZ - 10, TX + 10, RIM + 9.5, TZ + 10], 'roofLight'); P.vbox([TX - 10, RIM, TZ + 9.4, TX + 10, RIM + 9, TZ + 10], 'glass', { noShadow: 1 }); });
    for (const [x, z] of [[TX - 6, TZ - 8], [TX + 6, TZ - 8], [TX - 8, TZ - 4]]) P.box([x - 1.6, RIM, z - 0.4, x + 1.6, RIM + 2.4, z + 0.4], 'woodWhite');
    // reach the archive from the east concourse
    railing(P, TX - 10, TZ + 10, TX + 10, TZ + 10, 1.1, 'steel', { y: RIM, openings: [[6, 10]] });
    sign(P, 'PRESS', TX, RIM + 7.4, TZ + 10.1, 0, { size: 0.8, board: 0, color: '#3a3a40', e: ['PAST'] });
    // the outside: houses of the suburbs round the stadium
    for (const [x, z] of [[-96, -40], [-96, 40], [96, 40], [96, 80], [-96, 86], [40, 96], [-40, 96]]) P.box([x - 6, 0, z - 6, x + 6, 7, z + 6], 'whitewash', { t: 0xe8e0d8 });
    for (let i = 0; i < 12; i++) P.tree('plane', P.rng.pick([-100, 100]), P.rng.float(-100, 100), P.rng.float(0.9, 1.3));
  },
};
