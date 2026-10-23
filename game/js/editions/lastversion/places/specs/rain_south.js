// Rain City South, 2049 (Mission 1, THE LAST NORMAL DAY; OVERHAUL.md §5 M1). An open district under
// a dark overcast morning: the avenue with its tram wires from Kai's door north to the transit plaza,
// the market lane, the canal and its checkpoint bridge, and Line 41's station on its brick
// embankment under a 70 m ribbed canopy. Helix's crescent glows on the Ring Hill to the north.
//   Q0 HOME & MARKET         z  12 .. -70
//   Q1 TRANSIT PLAZA         z -70 .. -140 (the canal z -110 .. -126, the checkpoint bridge)
//   Q2 LINE 41               z -140 .. -230 (platforms at 3.4 m, tracks at 2.4 m, the staff gate)
import { ground, terrace, stair, ramp, water, railing, block, tower, fill, prop, sign, canopy, viaduct, bridge, wall } from '../archetypes.js';

const PLAT = 3.4, BED = 2.4;

export default {
  key: 'rain_south', style: 'rain2049', sameAs: null, name: 'RAIN CITY',
  bounds: [-90, -230, 90, 12],
  edges: { N: 'hillStair', E: 'blocks', W: 'blocks', S: 'blocks' },
  killY: -2.6,
  primary: 'plazaClock',
  backdrop: { skyline: 'rain2049', notch: 'faint', sea: 'S', helix: 'crescent' },
  years: {
    PRESENT: { sky: 'rainMorning', era: '2049', hour: 8.2, sun: { elev: 10, az: 112 }, fog: 0x6f7c8c, density: 1.6, night: 0.45, weather: 'rain', ibl: 'night', lit: 0.9,
      hemi: { sky: 0x8a98a8, ground: 0x3a4048, k: 0.85 }, sunColor: 0xc8d4e4, sunK: 0.45, grade: { shadowTint: 0x1c2a44, highlightTint: 0xffe6c8, toning: 0.16, contrast: 1.1, saturation: 0.92 } },
    PAST: { sky: 'rainSunbreak', era: '2049', hour: 8.2, sun: { elev: 9, az: 104 }, fog: 0x8a8c90, density: 1.2, night: 0.3, weather: 'rain', ibl: 'dusk', lit: 0.7,
      hemi: { sky: 0xb0a898, ground: 0x464c54, k: 0.9 }, sunColor: 0xffd6a0, sunK: 0.9, grade: { shadowTint: 0x2a2c3c, highlightTint: 0xffdcb0, toning: 0.2, contrast: 1.08, saturation: 0.96 } },
  },
  // after the Zero Second a black ring-shaped hole opens in the clouds over the station. While Mission 1's cold open
  // plays (co_m01: 05:40), the rain before dawn, and one window in Helix's crescent across the river pulsing: Chamber
  // One (the crescent stands due north of the district, its lit glass at about 6.5°: atlas.horizonFor)
  skyFeatures: { m01: [
    { kind: 'ringHole', when: 'zero_second', at: [0, -170], elev: 58, r: 11, w: 2.6 },
    { kind: 'preset', when: 'co_m01', sky: 'rainPreDawn' },
    { kind: 'beacon', when: 'co_m01', az: 1.8, elev: 6.5, rate: 3 },
  ] },
  quarters: [
    { name: 'HOME & MARKET', area: [-90, -70, 90, 12], spawnAt: 'door4B', threshold: { at: 'rookCall', kind: 'street' }, frags: ['puddle', 'noodleAlley', 'pocketPark'] },
    { name: 'TRANSIT PLAZA & CHECKPOINT', area: [-90, -140, 90, -70], spawnAt: 'tramStop', threshold: { at: 'checkpointBooth', kind: 'barrier' } },
    { name: 'LINE 41', area: [-90, -230, 90, -140], spawnAt: 'platform', threshold: { at: 'staffGate', kind: 'gate' } },
  ],
  exits: { m01: 'staffGate' },
  gates: { m01: { visible: true, solid: true, mat: 'gateSteel', box: [-3, 0, -224.3, 3, 3.2, -223.7] } },
  frags: { m01: [['towpath', 'laundromat', 'carriageDoor']] }, // (a fragment is read within 2.4 m: never up on the pigeons' ledge)
  // (closing) "a crowded security checkpoint" (the bible): the place holds 30 people, not §4.7's 24, and the queue at the
  // checkpoint stands in two lines between the tapes, waiting for Officer Pryce to wave each one through
  people: 30,
  crowd: [
    // (29 asked for, with the eight named and tier-2 people; each face walks at most four times a year in a place, each
    // time in other clothes, so crowds.js casts 21, in this order: the knot at the staff gate first (the pursuit ends in
    // it), the station staff, the avenue's commuters, the checkpoint's two lines, the EMS)
    // Helix's people at the staff gate, waiting to badge in all morning (the crowd where the woman with Mira's face is
    // lost, after the Zero Second); the morning's people are not out yet at 05:40, while the cold open plays (co_m01)
    { era: 'present', years: ['PRESENT', 'PAST'], region: 'rain', role: 'commuter', path: [[-9, -217.5], [9, -217.5], [7, -221], [-7, -221]], n: 4, when: '!co_m01' },
    { era: 'present', years: ['PRESENT', 'PAST'], region: 'rain', role: 'staff', path: [[-30, -153], [28, -153]], y: 3.4, n: 3, when: '!co_m01' },
    { era: 'present', years: ['PRESENT', 'PAST'], region: 'rain', role: 'commuter', path: [[-11, 6], [-11, -64]], n: 4, when: '!co_m01' },
    { era: 'present', years: ['PRESENT', 'PAST'], region: 'rain', role: 'commuter', path: [[11, -8], [11, -66]], n: 4, when: '!co_m01' },
    { era: 'present', years: ['PRESENT', 'PAST'], region: 'rain', role: 'commuter', path: [[0.4, -94.4], [0.4, -98.2]], n: 6, queue: true, when: '!co_m01' },
    { era: 'present', years: ['PRESENT', 'PAST'], region: 'rain', role: 'contractor', path: [[2.6, -96], [2.6, -99.8]], n: 5, queue: true, when: '!co_m01' },
    { era: 'present', years: ['PRESENT'], region: 'rain', role: 'ems', path: [[-6, -160], [14, -160]], y: 3.4, n: 2, when: 'after_zero' },
  ],

  build(P, { mission }) {
    // --- ground: the street, the sidewalks (0.15 m kerbs: walked up), the plaza ----------------------------
    ground(P, [-90, -110, 90, 12], 0, 'asphalt');
    ground(P, [-90, -230, 90, -126], 0, 'asphalt');
    for (const [x0, x1] of [[-14, -8], [8, 14]]) terrace(P, [x0, -70, x1, 12], 0.15, 'pavement', { wall: 'kerb', sides: x0 < 0 ? 'E' : 'W' });
    terrace(P, [-46, -109, 46, -70], 0.15, 'pavingWet', { wall: 'kerb', sides: 'S' });
    terrace(P, [-46, -146, 46, -126], 0.15, 'pavingWet', { wall: 'kerb', sides: 'N' });
    // the road's markings and the tram rails
    for (let z = 8; z > -66; z -= 7) P.vbox([-0.1, 0.005, z - 3, 0.1, 0.02, z], 'marking', { noShadow: 1 });
    for (const x of [-4.2, -2.8, 2.8, 4.2]) P.vbox([x - 0.05, 0.005, -70, x + 0.05, 0.03, 12], 'steel', { noShadow: 1 });
    // tram poles and the catenary
    for (let z = 6; z > -68; z -= 16) {
      for (const x of [-8.6, 8.6]) prop(P, 'tramPole', x, z);
      P.vbox([-8.6, 6.4, z - 0.04, 8.6, 6.46, z + 0.04], 'ironDark', { noShadow: 1 });
      for (const x of [-3.5, 3.5]) P.vbox([x - 0.02, 6.0, -70, x + 0.02, 6.05, 12], 'ironDark', { noShadow: 1, prop: 1 });
    }
    // --- Q0: home and market -----------------------------------------------------------------------------
    // Kai's building (door 4B on the avenue), the lane, the laundromat's block
    block(P, { rect: [14, -16, 46, 12], floors: 7, tint: 0x9a5a48, cornice: true, shop: { side: 'W', color: 0xffd9a8 } });
    P.land('door4B', 12.2, 0.15, -2, Math.PI);
    P.land('photoByDoor', 13.9, 1.6, -3.4, -Math.PI / 2);
    P.vbox([13.86, 0.15, -3.2, 14, 3.4, -0.8], 'doorDark');
    block(P, { rect: [14, -52, 46, -22], floors: 9, tint: 0xc89a7a, cornice: true, shop: { side: 'W', color: 0xcfe4ff, awning: 'awningBlue' } });
    P.land('laundromat', 13.9, 0.15, -44, -Math.PI / 2);
    P.land('puddle', 10.6, 0.15, -31, 0);
    P.plane(9.4, -32.4, 12.2, -29.6, 0.17, 'puddleWater', { noShadow: 1 });
    P.reserve(14, -22, 46, -16); // the side street
    block(P, { rect: [14, -68, 46, -56], floors: 6, tint: 0x8a7a70, shop: { side: 'W' } });
    // the market lane, west off the avenue, and its blocks
    ground(P, [-70, -34, -14, -24], 0.15, 'pavingWet', { depth: 0.2 });
    P.land('marketLane', -34, 0.15, -29, Math.PI / 2);
    P.land('toyChild', -17.5, 0.15, -31.5, 0.4);
    P.land('floristStall', -24, 0.15, -25.6, Math.PI);
    for (const [x, aw, goods] of [[-24, 'awningGreen', 'flowersStall'], [-32, 'awningRed', 'produce'], [-40, 'awningBlue', 'produce'], [-48, 'awningRed', 'produce'], [-56, 'awningGreen', 'produce']]) prop(P, 'stall', x, -25.8, Math.PI, { awning: aw, goods, y: 0.15 });
    for (const x of [-28, -44, -60]) prop(P, 'stall', x, -32.2, 0, { awning: 'awningBlue', goods: 'produce', y: 0.15 });
    block(P, { rect: [-40, -14, -14, 12], floors: 6, tint: 0xb06a52, shop: { side: ['E', 'N'] }, cornice: true });
    block(P, { rect: [-60, -14, -44, 12], floors: 5, tint: 0xa8a49c, shop: { side: 'N' } });
    block(P, { rect: [-44, -2, -40, 12], floors: 3, tint: 0x7a5040, roof: 'flat' });
    P.land('noodleAlley', -42, 0, -10, 0);
    P.vbox([-44, 0.3, -2.1, -40, 3.1, -2.0], 'shopLit');
    sign(P, 'NOODLES 24H', -42, 3.6, -2.2, 0, { size: 0.36, color: '#ffb48a' });
    P.glow(-42, 0.02, -4, 3, 0xffb07a);
    block(P, { rect: [-60, -62, -40, -34], floors: 8, tint: 0x7a5040, cornice: true, shop: { side: 'S', awning: 'awningRed' } });
    block(P, { rect: [-40, -42, -14, -34], floors: 4, tint: 0xd8c8b0, shop: { side: ['S', 'E'] } });
    P.land('pigeonLedge', -13.7, 5.2, -38, Math.PI / 2);
    P.vbox([-14, 5.0, -41, -13.4, 5.2, -35], 'concrete');
    // the pocket park
    ground(P, [-40, -62, -16, -44], 0.25, 'lawn', { depth: 0.3 });
    P.land('pocketPark', -28, 0.25, -53, 0);
    for (const [x, z] of [[-35, -48], [-22, -47], [-34, -58], [-20, -58]]) P.tree('plane', x, z, 1.15);
    prop(P, 'bench', -28, -50, 0, { y: 0.25 });
    prop(P, 'bench', -28, -57, Math.PI, { y: 0.25 });
    // fill: the city goes on, east and west
    fill(P, [-90, -14, -62, 12], { along: 'z', floors: [5, 9], shop: { side: 'E' }, cornice: true });
    fill(P, [-90, -68, -62, -16], { along: 'z', floors: [6, 10], shop: { side: 'E' } });
    fill(P, [48, -68, 90, -54], { along: 'x', floors: [6, 11], shop: { side: 'S' } });
    fill(P, [48, -16, 90, 12], { along: 'x', floors: [5, 8] });
    fill(P, [48, -50, 90, -22], { along: 'x', floors: [7, 12], cornice: true });
    // street furniture
    for (const z of [2, -18, -38, -58]) for (const x of [-12.8, 12.8]) prop(P, 'lampPost', x, z, x < 0 ? 0 : Math.PI, { y: 0.15, color: 0xffe0b0 });
    prop(P, 'busShelter', -11, -12, Math.PI / 2, { y: 0.15 });
    for (const [x, z] of [[-12.4, -4], [12.4, -12], [-12.4, -46], [12.4, -60]]) prop(P, 'bin', x, z, 0, { y: 0.15 });
    for (const [x, z] of [[10, -6], [10.2, -7.2], [-10, -50]]) prop(P, 'scooter', x, z, 0.3, { y: 0.15 });
    for (let z = -66; z < 10; z += 9) for (const x of [-8.3, 8.3]) prop(P, 'bollard', x, z, 0, { y: 0.15 });
    prop(P, 'adScreen', 12.6, -24, -Math.PI / 2, { y: 0.15, w: 4.5, h: 2.4 });
    sign(P, 'HELIX: WE STUDY CLOCKS', 12.42, 4.2, -24, -Math.PI / 2, { size: 0.3, color: '#cfe4ff', board: 0 });
    sign(P, 'LAUNDRY', 13.84, 3.7, -44, -Math.PI / 2, { size: 0.36, color: '#cfe4ff' });
    sign(P, 'FLOWERS', -24, 3.0, -25, 0, { size: 0.3, color: '#ffe0b0', board: 0 });
    sign(P, '24H PHARMACY', -14.1, 3.6, -6, Math.PI / 2, { size: 0.32, color: '#9fffb0' });
    sign(P, 'RAIN CITY SAVINGS', 13.84, 4.4, 4, -Math.PI / 2, { size: 0.32, color: '#ffe0b0' });
    sign(P, 'COFFEE', -14.1, 3.4, -38, Math.PI / 2, { size: 0.32, color: '#ffc890' });
    // the morning's traffic: at 8:13 it moves; from 8:14 it stands where the Zero Second left it
    P.E('PAST', () => {
      for (const [x, z, ry] of [[-5.5, -10, 0], [-5.5, -28, 0], [5.5, -36, Math.PI], [5.5, -14, Math.PI], [-5.5, -50, 0], [5.5, -60, Math.PI], [-36, -94, Math.PI / 2], [30, -96, -Math.PI / 2]]) prop(P, 'car', x, z, ry);
      // a tram at the stop, and the 41 coming in along the viaduct
      for (let i = 0; i < 3; i++) P.vbox([-1.4 + 3.5, 0.2, -86 + i * 10.4, 1.4 + 3.5, 3.4, -76.2 + i * 10.4], 'tramBody');
      for (let i = 0; i < 4; i++) P.vbox([46 + i * 15, BED + 0.2, -175, 59.5 + i * 15, BED + 3.8, -171.4], 'trainBody');
      for (const [x, z] of [[60, -202], [74, -202]]) P.vbox([x - 6, 0, z - 1.4, x + 6, 3.4, z + 1.4], 'busBody');
      for (const [x, z] of [[-32, -29], [-48, -29], [-20, -88], [24, -84]]) P.cone(x, 2.0, z, 1.3, 0.5, 'umbrella', { prop: 1 });
      P.vbox([-30, 0, -14.5, -26, 2.4, -12.5], 'vanWhite');
    });
    P.E('PRESENT', () => {
      for (const [x, z, ry] of [[-5.2, -16, 0.2], [5.8, -40, Math.PI - 0.3], [-4.5, -58, 0.5], [20, -94, 1.2], [-26, -100, -0.4]]) prop(P, 'car', x, z, ry);
    });
    // --- Q1: the transit plaza, the canal and the checkpoint ---------------------------------------------
    P.land('rookCall', 0, 0.15, -72, Math.PI);
    P.land('plazaClock', 0, 0.15, -88, 0);
    P.cyl(0, 0.15, -88, 0.45, 0.8, 'ironDark', { seg: 10, solid: true });
    P.cyl(0, 0.95, -88, 0.22, 5.0, 'ironDark', { seg: 10 });
    P.vbox([-0.9, 5.4, -88.9, 0.9, 6.9, -87.1], 'ironDark');
    P.land('tramStop', 10.8, 0.15, -78, Math.PI);
    canopy(P, { rect: [9, -84, 12.6, -72], h: 2.8, roof: 'glassRoof', span: 6, y: 0.15 });
    sign(P, 'TRAM 7 · 12', 10.8, 3.3, -71.8, 0, { size: 0.3, color: '#cfe4ff' });
    P.land('photoBooth', -30, 0.15, -78, Math.PI / 2);
    prop(P, 'phoneBooth', -30, -78, Math.PI / 2, { y: 0.15, m: 'boothPhoto' });
    sign(P, 'PHOTO', -29.4, 2.7, -78, Math.PI / 2, { size: 0.26, color: '#ffe0b0', board: 0 });
    for (const [x, z] of [[-20, -84], [20, -84], [-20, -98], [20, -98]]) P.tree('plane', x, z, 1.25, { y: 0.15 });
    for (const [x, z] of [[-12, -80], [12, -100], [-38, -100], [38, -80]]) prop(P, 'bench', x, z, 0, { y: 0.15 });
    for (const x of [-40, -24, 24, 40]) prop(P, 'lampPost', x, -104, Math.PI / 2, { y: 0.15, color: 0xffe0b0 });
    // the blocks round the plaza; the fire escape up the east block to its roof terrace
    block(P, { rect: [-90, -106, -48, -72], floors: 7, tint: 0x8a7a70, cornice: true, shop: { side: 'E', awning: 'awningGreen' } });
    const east = block(P, { rect: [48, -106, 82, -74], h: 12, tint: 0xb06a52, roofWalk: true, parapet: true, units: 2, shop: { side: 'W' } });
    P.land('fireEscape', 46.2, 0.15, -100, Math.PI / 2);
    // four flights in two lanes (up north in the outer lane, back south in the inner), landings across both
    for (let f = 0; f < 4; f++) {
      const y0 = f * 3, y1 = y0 + 3, lx = f % 2 ? 45.6 : 46.9;
      const [za, zb] = f % 2 ? [-80, -98] : [-98, -80];
      stair(P, lx, za, y0, lx, zb, y1, 1.2, 'fireEscape'); // (the first flight from the street, on the ground at 0)
      const ze = f % 2 ? -99.2 : -78.8;
      P.vbox([45.0, y1 - 0.12, ze - 1.2, 47.5, y1, ze + 1.2], 'fireEscape');
      P.col([45.0, y1 - 0.3, ze - 1.2, 47.5, y1, ze + 1.2]);
    }
    P.vbox([44.9, 0, -100.5, 45.0, 12, -77.5], 'ironDark', { noShadow: 1 });
    P.land('roofTerrace', 62, east.h, -90, 0);
    prop(P, 'chiller', 72, -98, 0, { y: east.h + 0.3 });
    // the canal: quays, the towpath ledge on the south side, parapets, the checkpoint bridge
    water(P, [-90, -124, 90, -112.5], -2.0, 'canalWater', { depth: 2.4 });
    P.vbox([-90, -4.5, -126, 90, 0, -124], 'quayStone');
    P.col([-90, -4.5, -126, 90, 0, -124]);
    P.vbox([-90, -4.5, -112.5, 90, -1.2, -110], 'quayStone');
    P.col([-90, -4.5, -112.5, -86, 0, -110]);
    P.col([-12, -4.5, -112.5, 90, 0, -110]);
    P.vbox([-12, -1.2, -112.5, 90, 0, -110], 'quayStone');
    // the towpath: a ledge at the foot of the south quay, down a stair from the landing by the bridge
    terrace(P, [-86, -112.5, -16, -110], -1.2, 'towpath', { base: -4.5, sides: '', wall: 'quayStone' });
    P.vbox([-86, -1.2, -110.2, -16, 0, -110], 'quayStone');
    stair(P, -12, -111.3, 0, -16.2, -111.3, -1.2, 2.3, 'quayStone');
    P.land('towpath', -60, -1.2, -111.2, Math.PI);
    railing(P, -90, -109.8, -12, -109.8, 1.05, 'ironDark', { y: 0.15 });
    railing(P, 5, -109.8, 90, -109.8, 1.05, 'ironDark', { y: 0.15 });
    railing(P, -90, -126.2, -5, -126.2, 1.05, 'ironDark', { y: 0.15 });
    railing(P, 5, -126.2, 90, -126.2, 1.05, 'ironDark', { y: 0.15 });
    bridge(P, 0, -109.6, 0, -126.4, 10, 0.15, 'bridgeStone', { parapetMat: 'ironDark' });
    P.land('checkpointBooth', -8.2, 0.15, -104.5, 0);
    P.land('checkpointQueue', 1.5, 0.15, -100, Math.PI);
    for (let z = -106; z <= -94; z += 2) {
      prop(P, 'bollard', -1.2, z, 0, { y: 0.15, m: 'steel', solid: false });
      prop(P, 'bollard', 4.2, z, 0, { y: 0.15, m: 'steel', solid: false });
    }
    P.vbox([-1.2, 0.95, -106, -1.15, 1.0, -94], 'barrierTape', { prop: 1 });
    P.vbox([4.15, 0.95, -106, 4.2, 1.0, -94], 'barrierTape', { prop: 1 });
    // --- Q2: Line 41: the forecourt, the station on its embankment, the depot, the staff gate --------------
    // the platforms and the track bed on the brick embankment, under the ribbed canopy
    terrace(P, [-35, -166, 35, -146], PLAT, 'platformTile', { wall: 'brickWall', sides: 'SEW' });
    terrace(P, [-90, -176, 90, -166], BED, 'ballast', { wall: 'brickWall', sides: 'EW' });
    terrace(P, [-35, -186, 35, -176], PLAT, 'platformTile', { wall: 'brickWall', sides: 'NEW' });
    for (const [x0, x1] of [[-90, -35], [35, 90]]) {
      P.vbox([x0, 0, -166.4, x1, BED, -166], 'brickWall');
      P.col([x0, 0, -166.4, x1, BED, -166]);
      P.vbox([x0, 0, -176, x1, BED, -175.6], 'brickWall');
      P.col([x0, 0, -176, x1, BED, -175.6]);
    }
    for (const z of [-169.5, -172.5]) for (const dz of [-0.75, 0.75]) P.vbox([-90, BED, z + dz - 0.06, 90, BED + 0.16, z + dz + 0.06], 'steel', { noShadow: 1 });
    P.vbox([-35, PLAT, -166.2, 35, PLAT + 0.02, -165.8], 'platformEdge', { noShadow: 1 });
    stair(P, 0, -139.5, 0.15, 0, -146.2, PLAT, 18, 'platformTile');
    stair(P, 0, -186, PLAT, 0, -193.5, 0, 14, 'platformTile');
    // a barrow crossing at the platform end
    ramp(P, [27, -166, 32, -170.5], PLAT, BED, 'N', 'platformTile', { terrain: false });
    ramp(P, [27, -171.5, 32, -176], BED, PLAT, 'N', 'platformTile', { terrain: false });
    P.land('platform', 0, PLAT, -154, Math.PI);
    // the canopy: cast-iron columns and arched ribs, glass between
    const AR = 26, th = Math.asin(18.4 / AR), acy = PLAT + 6 - AR * Math.cos(th);
    for (let x = -31.5; x <= 31.5; x += 7) {
      for (const z of [-147.6, -184.4]) P.cyl(x, PLAT, z, 0.32, 6, 'ironDark', { seg: 10, solid: true });
      P.torus(x, acy, -166, AR, 0.28, 'ironDark', { rx: 0, ry: Math.PI / 2, rz: Math.PI / 2 - th, arc: 2 * th, seg: 24 });
    }
    P.v({ k: 'vault', x: 0, y: acy, z: -166, r: AR, len: 72, arc: 2 * th, m: 'glassRoof' });
    P.land('boardSign', 0, PLAT + 4.6, -147.2, 0);
    P.vbox([-2.8, PLAT + 5.0, -147.3, 2.8, PLAT + 6, -147.1], 'ironDark');
    P.land('junBooth', -25, PLAT, -151, Math.PI / 2);
    P.land('relay41B', -30.2, PLAT, -156, Math.PI / 2);
    P.land('maintGate41B', -34.6, PLAT, -160, Math.PI / 2);
    P.land('carriageDoor', 8, PLAT, -164.5, Math.PI);
    P.land('viaduct', 62, BED, -171, 0);
    viaduct(P, 36, -171, 90, -171, BED + 1.2, 10, 'brickWall', { span: 9, solid: false, y: -1.2 });
    // the north concourse, the bus depot, the staff gate at the foot of the Ring Hill stair
    terrace(P, [-46, -230, 46, -193], 0.15, 'pavingWet', { wall: 'kerb', sides: 'S' });
    P.land('busDepot', 66, 0, -205, Math.PI);
    canopy(P, { rect: [48, -216, 86, -194], h: 6.5, roof: 'corrugated', span: 9.5, thick: 0.3 });
    for (const x of [56, 66, 76]) P.vbox([x - 0.1, 0.01, -216, x + 0.1, 0.03, -194], 'marking', { noShadow: 1 });
    sign(P, 'DEPOT 41', 66, 7.2, -193.6, 0, { size: 0.4, color: '#ffc06a' });
    P.land('staffGate', 0, 0.15, -224, Math.PI);
    for (const s of [-1, 1]) {
      P.box([s * 3 - 0.4, 0.15, -224.6, s * 3 + 0.4, 4.2, -223.4], 'helixWhite');
      wall(P, s * 3.4, -224, s * 46, -224, 2.2, 0.3, 'helixFence', { y: 0.15 });
    }
    P.vbox([-3.4, 4.2, -224.6, 3.4, 4.6, -223.4], 'helixWhite');
    sign(P, 'HELIX TEMPORAL RESEARCH - STAFF', 0, 5.0, -223.2, 0, { size: 0.34, color: '#ffc06a', board: 0 });
    // the Ring Hill stair beyond the gate, climbing toward the crescent
    for (let i = 0; i < 6; i++) P.vbox([-4, 0.15 + i * 0.3, -226 - i * 0.6, 4, 0.45 + i * 0.3, -225.4 - i * 0.6], 'quayStone');
    // two glass towers by the station, and the blocks around the forecourt
    tower(P, { rect: [-84, -168, -62, -146], h: 42, mast: 6 });
    tower(P, { rect: [58, -164, 84, -140], h: 36 });
    block(P, { rect: [-58, -142, -48, -128], floors: 5, tint: 0xa8a49c, shop: { side: 'E' } });
    block(P, { rect: [48, -136, 58, -128], floors: 4, tint: 0xc89a7a, shop: { side: 'W' } });
    fill(P, [-90, -228, -50, -194], { along: 'x', floors: [4, 8] });
    for (const x of [-30, -16, 16, 30]) prop(P, 'lampPost', x, -196, 0, { y: 0.15, color: 0xffe0b0 });
    for (const x of [-26, 26]) prop(P, 'lampPost', x, -140, Math.PI, { y: 0.15 });
    sign(P, 'RAIN CITY SOUTH · LINE 41', 0, PLAT + 7.4, -146.6, 0, { size: 0.5, color: '#cfe4ff', board: 0 });
    void mission;
  },
};
