// The Continuum Spire (Mission 21, THE LAST BATTLE OF THE CONTINUUM; OVERHAUL.md §5 M21). A citadel on top of Rain
// City's tallest drowned tower, above the cloud layer: the cloud sea lies 10 m below the lowest terrace, and
// through its gaps the M14 lagoon city shows far below (Sky feature). Black basalt-and-glass terraces climb round
// the transmitter mast, with open-sided command halls and glass windbreaks; the Arena, a 70 m ring terrace round
// the mast, collapses into the clouds during the causal puzzle; the citadel's ring, which the Witness turns.
// 2049: hard noon above the clouds. 2026: the tower roof as it was, a helipad and masts, at the cloud line.
// 2196: the tower's ruin at a blue dusk, frost and broken glass.
//   Q0 THE ALLY / ARRIVAL        the south deck (y 0)
//   Q1 THE COMMAND STRUCTURE     the east terraces (y 6, 12)
//   Q2 THE ARENA                 the ring round the mast (y 18)
//   Q3 THE WITNESS               the north-west summit (y 24)
import { ramp, stair, railing, prop, sign, lattice } from '../archetypes.js';

const MX = -8, MZ = -14; // the transmitter mast
const AR0 = 24, AR1 = 35; // the arena ring's radii (a 70 m ring)
const T1 = 6, T2 = 12, TA = 18, T3 = 24;

// a terrace of the citadel: a basalt slab on a black-glass skirt, glass windbreaks on the open sides
function deck(P, rect, y, o = {}) {
  const [x0, z0, x1, z1] = rect;
  P.box([x0, y - 0.6, z0, x1, y, z1], 'basaltPave');
  P.vbox([x0 + 0.4, y - 3.6, z0 + 0.4, x1 - 0.4, y - 0.6, z1 - 0.4], 'blackGlass');
  P.setTerrain(x0, z0, x1, z1, y);
  const gaps = o.gaps || {};
  for (const [side, a, b] of [['N', [x0, z0], [x1, z0]], ['S', [x0, z1], [x1, z1]], ['W', [x0, z0], [x0, z1]], ['E', [x1, z0], [x1, z1]]]) {
    if (!(o.wind || 'NESW').includes(side)) continue;
    const along = side === 'N' || side === 'S';
    const lo = along ? a[0] : a[1], hi = along ? b[0] : b[1];
    let u = lo;
    for (const [g0, g1] of (gaps[side] || []).concat([[hi, hi]]).sort((p, q) => p[0] - q[0])) {
      if (g0 > u + 0.5) {
        if (along) railing(P, u, a[1], g0, a[1], 1.4, 'windbreakGlass', { y, t: 0.08 });
        else railing(P, a[0], u, a[0], g0, 1.4, 'windbreakGlass', { y, t: 0.08 });
      }
      u = Math.max(u, g1);
    }
  }
}

export default {
  key: 'spire', style: 'spire', sameAs: null, name: 'THE CONTINUUM SPIRE',
  bounds: [-80, -80, 80, 80],
  edges: {},
  killY: -6,
  primary: 'citadelRing',
  backdrop: { kind: 'clouds', skirt: false },
  years: {
    PRESENT: { sky: 'aboveClouds', era: '2049', hour: 12.6, sun: { elev: 64, az: 190 }, fog: 0xc8dcf4, density: 0.45, night: 0, weather: 'wind', ibl: 'plant', lit: 0,
      hemi: { sky: 0xb8d0f4, ground: 0xe8eef4, k: 1.0 }, sunColor: 0xffffff, sunK: 1.5, grade: { shadowTint: 0x0e2050, highlightTint: 0xffffff, toning: 0.16, contrast: 1.14, saturation: 1.02 } },
    PAST: { sky: 'cloudLine', era: '2026', hour: 9.4, sun: { elev: 30, az: 120 }, fog: 0xc8d0d8, density: 1.2, night: 0, weather: 'wind', ibl: 'warehouse', lit: 0,
      hemi: { sky: 0xc8d4e0, ground: 0x8a949e, k: 0.95 }, sunColor: 0xf4f8ff, sunK: 0.9, grade: { shadowTint: 0x2a3440, highlightTint: 0xf4f8ff, toning: 0.14, contrast: 1.04, saturation: 0.92 } },
    FUTURE: { sky: 'frostDusk', era: '2196', hour: 18.8, sun: { elev: 2, az: 250 }, fog: 0x3a4a78, density: 0.9, night: 0.55, weather: 'frost', ibl: 'night', lit: 0.4,
      hemi: { sky: 0x6a7cb0, ground: 0x1a2038, k: 0.8 }, sunColor: 0xa8b8e8, sunK: 0.5, grade: { shadowTint: 0x0e1430, highlightTint: 0xc8d8ff, toning: 0.24, contrast: 1.12, saturation: 0.92 } },
  },
  skyFeatures: { all: [
    { kind: 'cloudSea', when: '@PRESENT', y: -10, lagoonY: -320, cover: 0.8, top: 0xffffff, shade: 0xb8c8dc, lagoon: 0xa8c0c0 },
    { kind: 'cloudSea', when: '@PAST', y: -3, lagoonY: -320, cover: 0.93, top: 0xe4eaf0, shade: 0x8a98a8, lagoon: 0x6a7a80 },
    { kind: 'cloudSea', when: '@FUTURE', y: -10, lagoonY: -320, cover: 0.7, top: 0x6a7aa8, shade: 0x1e2648, lagoon: 0x2a3448 },
  ] },
  quarters: [
    { name: 'THE ALLY / ARRIVAL', area: [-80, 20, 80, 80], spawnAt: 'arrival', threshold: { at: 'kitchenDoor', kind: 'door' } },
    { name: 'THE COMMAND STRUCTURE', area: [20, -80, 80, 30], spawnAt: 'kitchenDoor', threshold: { at: 'arenaGate', kind: 'bridge' } },
    { name: 'THE ARENA', area: [-50, -70, 22, 20], spawnAt: 'arenaGate', threshold: { at: 'summitStair', kind: 'stair' } },
    { name: 'THE WITNESS', area: [-80, -80, -20, -20], spawnAt: 'summitStair', threshold: null },
  ],
  sectors: { m21: [0, 2, 3] },
  beatAt: { m21: ['commandHalls', 'arenaRing', 'witnessStand'] },
  exits: { m21: 'citadelRing' },
  frags: {},
  watch: { m21: [[[[-50, 40], [50, 40]], [[-40, 60], [40, 60]]], [], []] },
  crowd: [
    { era: 'present', years: ['PRESENT'], region: 'spire', role: 'officer', path: [[34, -36], [58, -36], [58, -10]], y: T1, n: 3, // (on the command halls' floor)
      barks: ['One timeline. Hold your post.', 'Nobody goes up to the ring room. Nobody.'] },
  ],

  build(P) {
    const SKIP = [295, 225]; // where the bridges meet the arena ring (degrees, x east, z south)
    const at = (deg, r) => [MX + Math.cos((deg * Math.PI) / 180) * r, MZ + Math.sin((deg * Math.PI) / 180) * r];
    // --- the tower under everything: its shaft drops into the clouds ---------------------------------------------
    P.vbox([-46, -90, -46, 46, -4, 46], 'blackGlass', { t: 0x8090a8 });
    for (const x of [-46, 46]) for (const z of [-46, 46]) P.vbox([x - 1.5, -90, z - 1.5, x + 1.5, -4, z + 1.5], 'basalt');
    // --- PAST (2026): the tower's crown as it was, at the cloud line: a roof with a helipad, masts, plant -------------
    P.E('PAST', () => {
      P.box([-74, -4.6, -78, 74, 0, 76], 'concrete');
      for (const [x0, z0, x1, z1] of [[-74, -78, 74, -78], [-74, 76, 74, 76], [-74, -78, -74, 76], [74, -78, 74, 76]]) railing(P, x0, z0, x1, z1, 1.1, 'steel', { t: 0.08 });
      P.cyl(0, 0, 40, 11, 0.12, 'concrete', { seg: 32 });
      P.torus(0, 0.14, 40, 9.5, 0.2, 'helipadPaint', { rx: Math.PI / 2, seg: 40 });
      for (const b of [[-3.2, 36, -2.2, 44], [2.2, 36, 3.2, 44], [-2.2, 39.5, 2.2, 40.5]]) P.vbox([b[0], 0.12, b[1], b[2], 0.15, b[3]], 'helipadPaint', { noShadow: 1 });
      for (const [x, z, h] of [[MX, MZ, 46], [-50, -60, 22], [50, -60, 18], [56, 50, 14]]) lattice(P, x, z, 0, h, 1.6, 0.4, 'mastRed', { beacon: 'redBeacon', bays: Math.round(h / 5) });
      for (let i = 0; i < 8; i++) P.box([20 + (i % 4) * 9, 0, -40 + Math.floor(i / 4) * 12, 26 + (i % 4) * 9, 2.4, -34 + Math.floor(i / 4) * 12], 'relayCabinet');
      for (const [x, z] of [[-40, 10], [-40, 24], [-26, 10]]) P.cyl(x, 0, z, 3, 5, 'steel', { seg: 14, solid: true });
      P.box([-12, 0, -40, 4, 3.2, -30], 'concrete');
      P.vbox([-6, 0, -30.05, -4, 2.2, -29.95], 'doorDark');
      for (let i = 0; i < 14; i++) P.cyl(-65 + i * 10, 0, 66, 0.4, 0.9, 'steel', { seg: 6 });
      for (let i = 0; i < 6; i++) P.box([-70 + i * 22, 0, -74, -60 + i * 22, 1.2, -70], 'steel');
      // the roof's plant room and the lift's motor tower, by the stair head where the citadel's arrival deck will be
      P.box([-14, 0, 50, -6, 6.5, 58], 'concrete');
      P.vbox([-13.5, 6.5, 50.5, -6.5, 7.2, 57.5], 'steel');
      P.box([14, 0, 34, 21, 10, 41], 'concrete');
      for (let k = 0; k < 4; k++) P.vbox([14.2 + k * 1.7, 7, 41, 15.4 + k * 1.7, 9, 41.05], 'serverGlass', { noShadow: 1 });
    });
    // --- PRESENT and FUTURE: the citadel (FUTURE: its ruin, the same terraces frosted, glass broken) -------------------
    P.E(['PRESENT', 'FUTURE'], () => {
      // Q0: the south deck at y 0, the allies' arrival points round it
      deck(P, [-74, 20, 74, 76], 0, { gaps: { N: [[-34, -26], [40, 56]], S: [[-4, 4]], W: [[60, 72]] } });
      deck(P, [-78, 60, -74, 72], 0, { wind: 'NSW' }); // the glider deck (Sera)
      P.box([-2, -0.3, 76, 2, 0, 80], 'glowAccent', { noShadow: 1 }); // the light bridge (Anja), over the clouds
      P.box([46, 0, 34, 50, 14, 46], 'eliteGraphite'); // the service lift (Iven)
      P.vbox([45.9, 0, 36, 46, 2.6, 44], 'lightPanel', { noShadow: 1 });
      // the kitchen block (the people who listened): a passage through it, a stair up to the command terrace
      P.box([40, 0, 20, 46.7, 5.4, 26], 'basalt');
      P.box([49.3, 0, 20, 58, 5.4, 26], 'basalt');
      P.box([46.7, 2.6, 20, 49.3, 5.4, 26], 'basalt');
      P.vbox([46.7, 0, 26, 49.3, 2.6, 26.06], 'helixDoor', { noShadow: 1 });
      P.W('!warned_evacuees', () => P.col([46.7, 0, 25.6, 49.3, 2.6, 26.1])); // (the kitchen door opens for the people who listened)
      stair(P, 48, 19.8, 0, 48, 10.2, T1, 2.6, 'basaltPave');
      // the stair you climb alone (west), up to the walkway to the halls
      stair(P, -30, 20.2, 0, -30, 6.2, T1, 3, 'basaltPave');
      // Q1: the walkway (y 6), the command terrace with its halls (y 6), the cells' terrace (y 12)
      deck(P, [-40, -4, 24, 6], T1, { gaps: { S: [[-31.5, -28.5]] }, wind: 'NSW' });
      deck(P, [24, -40, 74, 10], T1, { gaps: { N: [[40, 52]], S: [[46.5, 49.5]], W: [[-4, 6]] } });
      for (const [x0, z0, x1, z1] of [[28, -34, 44, -14], [52, -34, 70, -14]]) {
        for (const x of [x0, x1]) for (const z of [z0, z1]) P.box([x - 0.4, T1, z - 0.4, x + 0.4, T1 + 5, z + 0.4], 'basalt');
        P.vbox([x0 - 1, T1 + 5, z0 - 1, x1 + 1, T1 + 5.5, z1 + 1], 'blackGlass');
        for (let k = 0; k < 3; k++) P.box([x0 + 2 + k * 5, T1, z0 + 8, x0 + 5 + k * 5, T1 + 1.1, z0 + 10], 'eliteGraphite');
        P.vbox([x0 + 2, T1 + 1.4, z1 - 0.6, x1 - 2, T1 + 3.4, z1 - 0.5], 'adLit', { noShadow: 1 });
      }
      ramp(P, [42, -60, 50, -40], T1, T2, 'N', 'basaltPave'); // the elite ramps
      deck(P, [20, -78, 74, -60], T2, { gaps: { S: [[42, 50]], W: [[-71, -65]] } });
      for (let i = 0; i < 5; i++) { // the cells: glass-fronted, on the north edge
        const x = 26 + i * 8;
        P.box([x, T2, -78, x + 0.4, T2 + 3.6, -70], 'basalt');
        P.vbox([x + 0.4, T2, -70.1, x + 8, T2 + 3.6, -70], 'windbreakGlass');
        P.col([x + 0.4, T2, -70.2, x + 8, T2 + 3.6, -70]);
      }
      P.vbox([26, T2 + 3.6, -78, 66.4, T2 + 4, -70], 'basalt');
      P.vbox([66.4, T2, -69, 74, T2 + 4, -68.9], 'windbreakGlass'); // the director's office, a glass corner
      P.box([68, T2, -66, 72, T2 + 0.9, -64.6], 'eliteGraphite');
      // Q2: the arena ring at y 18 round the mast, in twenty-four slabs (the collapse takes them in a known order)
      const n = 24, rm = (AR0 + AR1) / 2, wR = AR1 - AR0;
      // (Mission 21: when the arena collapses, two of the slabs between the bridge (295°) and the summit (225°) fall into
      // the clouds, 270-285° and 240-255°: their gaps are spanned by REVERSE, an ally, or 2196's frozen girder; and
      // one the other way round, 300-315°, which nothing spans: the long way round is gone)
      const FALLS = [18, 16, 20];
      const fallen = (deg) => FALLS.some((k) => deg > k * 15 - 0.5 && deg < (k + 1) * 15 + 0.5);
      for (let i = 0; i < n; i++) {
        const am = ((i + 0.5) / n) * Math.PI * 2, len = ((2 * Math.PI * AR1) / n) * 1.02, deg = (am * 180) / Math.PI;
        const [cx, cz] = at(deg, rm);
        P.W(FALLS.includes(i) ? '!arena_fallen' : null, () => {
          P.obox(cx, TA - 0.6, cz, wR, 0.6, len, -am, 'basaltPave');
          P.obox(cx, TA - 2.4, cz, wR - 1, 1.8, len * 0.8, -am, 'blackGlass');
          for (const r of [25.6, 29.5, 33.4]) for (const f of [-0.33, 0, 0.33]) {
            const [x, z] = at(deg + (f * 360) / n, r);
            P.col([x - 2.4, TA - 0.6, z - 2.4, x + 2.4, TA, z + 2.4]);
          }
          if (!SKIP.some((d) => Math.abs(((deg - d + 540) % 360) - 180) < 8)) { const [wx, wz] = at(deg, AR1); P.obox(wx, TA, wz, 0.12, 1.3, len, -am, 'windbreakGlass'); }
        });
      }
      for (let i = 0; i < 60; i++) { // the outer windbreak's collider, open at the bridges; the inner edge round the drop
        const deg = ((i + 0.5) / 60) * 360;
        P.W(fallen(deg) ? '!arena_fallen' : null, () => {
          if (!SKIP.some((d) => Math.abs(((deg - d + 540) % 360) - 180) < 6)) { const [x, z] = at(deg, AR1 + 0.4); P.col([x - 1.2, TA, z - 1.2, x + 1.2, TA + 1.6, z + 1.2]); }
          const [x, z] = at(deg, AR0 - 0.6);
          P.col([x - 1.1, TA, z - 1.1, x + 1.1, TA + 1.6, z + 1.1]);
        });
      }
      // 2196's ruin: a frozen girder lies across the second gap (going alone, the year is the answer)
      P.E('FUTURE', () => P.W('arena_fallen', () => {
        const [x0, z0] = at(256, rm), [x1, z1] = at(239, rm);
        const len = Math.hypot(x1 - x0, z1 - z0);
        P.obox((x0 + x1) / 2, TA - 0.5, (z0 + z1) / 2, 2.6, 0.5, len + 1, Math.atan2(x1 - x0, z1 - z0), 'frozenGlass', { solid: false });
        for (let k = 0; k <= 8; k++) { const x = x0 + ((x1 - x0) * k) / 8, z = z0 + ((z1 - z0) * k) / 8; P.col([x - 1.2, TA - 0.5, z - 1.2, x + 1.2, TA, z + 1.2]); }
      }));
      // the arena bridge from the cells' terrace: up from 12 m going west, then north along to the ring at 295°
      ramp(P, [9, -71, 20, -65], T2, TA, 'W', 'basaltPave');
      deck(P, [3, -71, 9, -44], TA, { gaps: { E: [[-71, -65]], S: [[3, 9]] }, wind: 'NES' });
      // the transmitter mast: a black-glass drum, the lattice above it
      P.cyl(MX, -4, MZ, 9, TA + 2, 'blackGlass', { seg: 16 });
      lattice(P, MX, MZ, TA + 2, 58, 5, 0.8, 'steel', { beacon: 'redBeacon', bays: 10 });
      // Q3: from the ring's north-west the last ramp climbs to the summit (y 24); the citadel's ring stands there
      const [ax, az] = at(225, AR1);
      ramp(P, [ax - 3, az - 14, ax + 3, az + 1], T3, TA, 'S', 'basaltPave');
      deck(P, [-78, -78, -22, az - 14], T3, { gaps: { S: [[ax - 3, ax + 3]] } });
      P.torus(-50, T3 + 13, -64, 11, 1.1, 'blackRing', { seg: 48 });
      for (const s of [-1, 1]) P.box([-50 + s * 11 - 1, T3, -65.5, -50 + s * 11 + 1, T3 + 4, -62.5], 'basalt');
      P.torus(-50, T3 + 13, -64, 9.6, 0.25, 'glowAccent', { seg: 48 });
      P.box([-34, T3, -68, -30, T3 + 1.1, -64], 'eliteGraphite');
    });
    // in 2026 the mast is the roof's tallest mast (above); the landmarks stand in every year
    const [ax, az] = at(225, AR1);
    P.land('arrival', 0, 0, 66, Math.PI);
    P.land('gliderDeck', -76, 0, 66, Math.PI / 2);
    P.land('lightBridge', 0, 0, 74, Math.PI);
    P.land('serviceLift', 44.6, 0, 40, -Math.PI / 2);
    P.land('kitchenDoor', 48, 0, 27.6, 0);
    P.land('stairsAlone', -30, 0, 22.6, Math.PI);
    P.land('commandHalls', 36, T1, -8, 0);
    P.land('eliteRamps', 46, T1, -38, Math.PI);
    P.land('cells', 40, T2, -67, Math.PI);
    P.land('directorOffice', 70, T2, -62, Math.PI);
    P.land('arenaGate', 21.5, T2, -68, -Math.PI / 2);
    P.land('arenaRing', ...((p) => [p[0], TA, p[1]])(at(295, rm())), Math.PI);
    P.land('arenaBridges', 6, TA, -50, Math.PI);
    // the arena's gaps once it has fallen (Mission 21): each stands at its near edge, facing across it
    const gapAt = (name, d0, d1) => { const [x0, z0] = at(d0, rm()), [x1, z1] = at(d1, rm()); P.land(name, x0, TA, z0, Math.atan2(x1 - x0, z1 - z0)); };
    gapAt('arenaGap1', 285, 270);
    gapAt('arenaGap2', 255, 240);
    P.land('arenaMid', ...((p) => [p[0], TA, p[1]])(at(262.5, rm())), 0);
    P.land('mast', MX, TA, MZ, 0);
    P.land('mastRail', ...((p) => [p[0], TA, p[1]])(at(160, AR0 + 1.6)), (-160 * Math.PI) / 180 - Math.PI / 2); // (the ring's inner edge, facing the mast)
    P.land('summitStair', ax, TA, az + 3, Math.PI);
    P.land('witnessStand', -36, T3, -60, Math.PI / 2);
    P.land('citadelRing', -50, T3, -58, 0);
    function rm() { return (AR0 + AR1) / 2; }
    // FUTURE: the ruin: frost on everything, broken glass, fallen pieces on the decks
    P.E('FUTURE', () => {
      for (let i = 0; i < 24; i++) P.obox(P.rng.float(-70, 70), 0, P.rng.float(24, 74), P.rng.float(1, 4), P.rng.float(0.2, 0.8), P.rng.float(1, 4), P.rng.float(0, 3), P.rng.pick(['frozenGlass', 'basalt', 'snowRock']), { prop: 1 });
      for (let i = 0; i < 8; i++) P.obox(P.rng.float(28, 70), T1, P.rng.float(-36, 6), P.rng.float(2, 5), P.rng.float(0.3, 1.2), P.rng.float(2, 5), P.rng.float(0, 3), 'frozenGlass', { prop: 1 });
      P.plane(-74, 20, 74, 76, 0.03, 'snow', { noShadow: 1 });
    });
    // PRESENT: the Continuum's banners and lit panels
    P.E('PRESENT', () => {
      for (const x of [-60, -20, 20, 60]) P.vbox([x - 1.2, 0, 75.4, x + 1.2, 7, 75.6], 'flagHelix');
      sign(P, 'ONE PERMANENT TIMELINE', 0, 4.4, 20.4, 0, { size: 0.6, color: '#ffc44a', boardMat: 'eliteGraphite' });
      for (const [x, z] of [[-50, 30], [56, 60], [-20, 50], [20, 30]]) prop(P, 'floodlight', x, z, 0);
    });
  },
};
