// Mira's memory (Mission 20, MIRA'S MEMORY; OVERHAUL.md §5 M20). One plot, remembered three ways; the layout is
// shared, so the three memories can be aligned without being forced into one. A terrace of houses facing a
// street, their back gardens, a back lane and the park behind. The edges dissolve into white fog (the memory
// boundary), and the sky is a watercolour wash.
//   PAST    THE HOUSE WITH THE BLUE DOOR: the terrace and its gardens on a golden, overexposed summer evening,
//           a sprinkler, bikes; the kitchen opens to the garden through French doors; the drawing on the fridge.
//   PRESENT THE FIRST EXPERIMENT: the same plot inside the 2026 Helix chamber as the child in the chair remembers it:
//           white panelled walls round the whole memory, a ceiling of light, a dark grid floor; the street only pencil
//           lines in it; the remembered things in colour, the child-sized chair in its pool of light.
//   FUTURE  THE WORLD WITHOUT KAI: adult Mira's seaside garden in morning light; the sea where the street was,
//           the 41 stop at the corner, a memorial for nobody, a house that belongs to nobody on record.
//   Q0 THE HOUSE                 the west of the terrace, Mira's house and garden (x -65 .. 10)
//   Q1 THE EXPERIMENT            the park behind the back lane (z -65 .. -36)
//   Q2 THE WORLD WITHOUT KAI     the east of the terrace, its gardens and the corner (x 10 .. 65)
import { railing, prop, sign } from '../archetypes.js';

const B = 65; // half the side: a 130 m square, the plot in the middle of it
const FRONT = 26, BACK = 14, EXT = 8; // the terrace: front wall, back wall, the kitchen extensions' garden wall
const GARDEN = -30, LANE = -36; // the gardens' back fences, the back lane's far side
const SEA = 34; // where the street was, in the world without Kai
const HOUSES = [-62, -50, -38, -26, -14, -2, 10, 22, 34, 46]; // each 12 m wide, from x0
const MIRA = -26; // her house (x -26 .. -14)
const NOOWNER = 34; // the house with no owner (x 34 .. 46)

// a house of the terrace (not Mira's): two storeys and a pitched roof, a coloured door, sash windows; solid
function house(P, x0, i) {
  const x1 = x0 + 12, tint = [0xfff4ec, 0xf4ecf8, 0xecf4f0, 0xfff0dc][i % 4];
  P.box([x0 + 0.1, 0, BACK, x1 - 0.1, 6.4, FRONT], 'watercolourWall', { t: tint });
  P.gable((x0 + x1) / 2, 6.4, (BACK + FRONT) / 2, 12, 12, 3.2, Math.PI / 2, 'slate');
  P.box([x0 + 2, 0, EXT + 0.2, x1 - 2, 3, BACK], 'watercolourWall', { t: tint });
  for (const fx of [x0 + 2.4, x0 + 8.4]) for (const fy of [1.0, 3.9]) P.vbox([fx, fy, FRONT, fx + 1.3, fy + 1.7, FRONT + 0.06], 'windowWarm', { noShadow: 1 });
  P.vbox([x0 + 5.2, 0, FRONT, x0 + 6.4, 2.2, FRONT + 0.08], ['awningRed', 'busStopGreen', 'woodWhite', 'doorDark'][i % 4], { noShadow: 1 });
  P.vbox([x0 + 4.8, 6.4, FRONT - 1.2, x0 + 5.6, 8.2, FRONT - 0.4], 'brickWall');
}

export default {
  key: 'memory', style: 'memory', sameAs: null, name: 'MIRA\'S MEMORY',
  bounds: [-B, -B, B, B],
  edges: {},
  killY: -4,
  primary: 'blueDoor',
  backdrop: { kind: 'memory', skirt: false },
  years: {
    PAST: { sky: 'overexposedSummer', era: '2026', hour: 19.3, sun: { elev: 9, az: 292 }, fog: 0xffe8c8, density: 1.0, night: 0, weather: 'pollen', ibl: 'dusk', lit: 0.2,
      hemi: { sky: 0xffe8c0, ground: 0x8a7a5a, k: 1.05 }, sunColor: 0xffd890, sunK: 1.25, grade: { shadowTint: 0x6a4a3a, highlightTint: 0xfff4d8, toning: 0.26, contrast: 0.96, saturation: 1.06 } },
    // (closing: inside Chamber One, a ceiling of light over a dark floor; the air a cool grey, not Mission 19's white)
    PRESENT: { sky: 'coldVoid', era: '2049', hour: 12.2, sun: { elev: 72, az: 180 }, fog: 0xb4bccc, density: 1.0, night: 0, weather: 'motes', ibl: 'warehouse', lit: 0,
      hemi: { sky: 0xf4f8ff, ground: 0x4a5060, k: 1.15 }, sunColor: 0xf4f8ff, sunK: 0.45, grade: { shadowTint: 0x2a3448, highlightTint: 0xf4f8ff, toning: 0.16, contrast: 1.12, saturation: 0.8 } },
    FUTURE: { sky: 'seaMorning', era: '2196', hour: 8.4, sun: { elev: 20, az: 105 }, fog: 0xdcecf2, density: 0.9, night: 0, weather: 'pollen', ibl: 'dusk', lit: 0,
      hemi: { sky: 0xd8ecf8, ground: 0x6a8a6a, k: 0.95 }, sunColor: 0xfff4e0, sunK: 1.15, grade: { shadowTint: 0x2a4a5a, highlightTint: 0xfff8ec, toning: 0.2, contrast: 1.02, saturation: 1.04 } },
  },
  quarters: [
    { name: 'THE HOUSE', area: [-B, LANE, 10, B], spawnAt: 'kitchen', threshold: { at: 'gardenGate', kind: 'gate' } },
    { name: 'THE EXPERIMENT', area: [-B, -B, B, LANE + 6], spawnAt: 'gardenGate', threshold: { at: 'laneEnd', kind: 'lane' } },
    { name: 'THE WORLD WITHOUT KAI', area: [10, LANE, B, B], spawnAt: 'laneEnd', threshold: null },
  ],
  beatAt: { m20: ['fridgeDrawing', 'console', 'miraPlanting'] },
  exits: { m20: 'stop41' },
  frags: { m20: [['blueDoor', 'nightBadge', 'yellowBoots'], ['childChair', 'whiteChamber', 'garden']] },
  watch: { m20: [[], [], []] },
  crowd: [
    { era: 'present', years: ['PAST'], region: 'memory', role: 'neighbour', path: [[-50, 30], [40, 30]], n: 4,
      barks: ['Sprinkler is on again. Mind the bikes.', 'Your mum on nights again? Come in for tea.'] },
    { era: 'future', years: ['FUTURE'], region: 'memory', role: 'walker', path: [[-50, 30], [50, 30]], n: 3,
      barks: ['The bus is late again. Nobody minds.', 'Lovely morning for it. Whatever it is.'] },
  ],

  build(P) {
    // --- the ground: land everywhere but the south in the world without Kai, where the sea is ---------------------
    P.setTerrain(-B, -B, B, B, 0);
    P.col([-B, -1, -B, B, 0, SEA]);
    P.E(['PAST', 'PRESENT'], () => P.col([-B, -1, SEA, B, 0, B]));
    // PAST and FUTURE: lawns, the pavement, the street (PAST) or the promenade and the sea (FUTURE)
    P.E(['PAST', 'FUTURE'], () => {
      P.plane(-B - 30, -B - 30, B + 30, LANE, 0.01, 'meadowLong', { noShadow: 1 });
      P.plane(-B - 30, LANE, B + 30, GARDEN, 0.02, 'pathBrick', { noShadow: 1 });
      P.plane(-B - 30, GARDEN, B + 30, BACK, 0.01, 'gardenLawn', { noShadow: 1 });
      P.plane(-B - 30, FRONT, B + 30, 30, 0.02, 'pavement', { noShadow: 1 });
    });
    P.E('PAST', () => {
      P.plane(-B - 30, 30, B + 30, 42, 0.02, 'asphalt', { noShadow: 1 });
      P.plane(-B - 30, 42, B + 30, B + 30, 0.02, 'pavement', { noShadow: 1 });
      for (let x = -60; x < 60; x += 8) P.vbox([x, 0.02, 35.9, x + 4, 0.04, 36.1], 'marking', { noShadow: 1 });
      // across the street, the other terrace (seen, never visited)
      for (let x = -62; x < 62; x += 12) { P.box([x + 0.1, 0, 46, x + 11.9, 7, 58], 'watercolourWall', { t: 0xf8ecdc }); P.gable(x + 6, 7, 52, 12, 12, 3, Math.PI / 2, 'slate'); }
      P.col([-B, 0, 44, B, 3, 46]);
      for (const [x, z, r] of [[-40, 33, 0], [-6, 39, Math.PI], [18, 33, 0], [44, 39, Math.PI]]) prop(P, 'car', x, z, r);
    });
    P.E('FUTURE', () => {
      P.plane(-B - 30, 30, B + 30, SEA, 0.03, 'pavement', { noShadow: 1 });
      P.plane(-B - 120, SEA, B + 120, B + 160, -0.8, 'seaWater', { noShadow: 1 });
      P.vbox([-B - 30, -3, SEA - 0.4, B + 30, 0.03, SEA], 'stairStone');
      railing(P, -B, SEA - 0.2, B, SEA - 0.2, 1.0, 'ironDark', { t: 0.08 });
      P.drown([-B, SEA, B, B], -1.2);
      for (let i = 0; i < 5; i++) prop(P, 'bench', -50 + i * 22, 31.4, Math.PI);
    });
    // PRESENT: the first experiment, as the child in the chair remembers it: Chamber One round the whole plot, its white
    // panelled walls and a ceiling of light, a dark grid underfoot; the street she knew is only pencil lines in it, and the
    // remembered things keep their colour. (closing: visuals; a white fog void with a ring read as Mission 19's salt plain,
    // the mission before)
    P.E('PRESENT', () => {
      P.plane(-B - 4, -B - 4, B + 4, B + 4, 0.01, 'chamberGrid', { noShadow: 1 });
      const CH = 15;
      for (const b of [[-B - 4, -B - 4, B + 4, -B - 3], [-B - 4, B + 3, B + 4, B + 4], [-B - 4, -B - 4, -B - 3, B + 4], [B + 3, -B - 4, B + 4, B + 4]]) P.vbox([b[0], 0, b[1], b[2], CH, b[3]], 'chamberPanel');
      P.vbox([-B - 4, CH, -B - 4, B + 4, CH + 0.3, B + 4], 'chamberLights');
      // the wall's lit band and its skirting, and the ribs that hold the ceiling
      for (const b of [[-B - 3, -B - 3, B + 3, -B - 2.9], [-B - 3, B + 2.9, B + 3, B + 3], [-B - 3, -B - 3, -B - 2.9, B + 3], [B + 2.9, -B - 3, B + 3, B + 3]]) { P.vbox([b[0], 3.2, b[1], b[2], 3.5, b[3]], 'lightPanel', { noShadow: 1 }); P.vbox([b[0], 0, b[1], b[2], 0.4, b[3]], 'ironDark', { noShadow: 1 }); }
      for (let x = -B; x <= B; x += 26) P.vbox([x - 0.4, CH - 1.2, -B - 3, x + 0.4, CH, B + 3], 'panelGrey', { noShadow: 1 });
      // the chamber's floor and ring, in the park: the platform, the consoles, the cables to them
      P.disc(-10, 0.03, -50, 13, 'helixWhite', { seg: 48 });
      P.torus(-10, 0.05, -50, 13, 0.12, 'helixGlass', { rx: Math.PI / 2, seg: 64 });
      P.torus(-10, 7, -58, 6.5, 0.7, 'blackRing', { seg: 48 });
      P.box([-17.5, 0, -59, -16.5, 7, -57], 'blackRing');
      P.box([-3.5, 0, -59, -2.5, 7, -57], 'blackRing');
      for (const [x, z, r] of [[-22, -44, 0.6], [2, -54, -0.5], [-24, -58, 1.2]]) { P.obox(x, 0, z, 1.6, 1.0, 0.8, r, 'panelWhite', { solid: true }); P.obox(x, 1.0, z, 1.4, 0.06, 0.6, r, 'lightPanel', { rx: -0.3 }); }
      for (const [x0, z0, x1, z1] of [[-10, -36, -10.2, -44], [-24, -44.4, -16, -44.2], [2, -54.2, -4, -54]]) P.vbox([Math.min(x0, x1) - 0.08, 0.02, Math.min(z0, z1) - 0.08, Math.max(x0, x1) + 0.08, 0.1, Math.max(z0, z1) + 0.08], 'ironDark', { noShadow: 1 });
      // the pool of light on the child's chair
      P.cyl(-10, 0.03, -50, 1.6, 9, 'smoke', { seg: 16, r2: 0.5, open: true });
      P.glow(-10, 0.05, -50, 2.4, 0xfff4d8);
      // the street she knew, in pencil: each house's edges, its roof, its windows and door
      const line = (a, b) => P.vbox([Math.min(a[0], b[0]) - 0.035, Math.min(a[1], b[1]) - 0.035, Math.min(a[2], b[2]) - 0.035, Math.max(a[0], b[0]) + 0.035, Math.max(a[1], b[1]) + 0.035, Math.max(a[2], b[2]) + 0.035], 'pencil', { noShadow: 1 });
      for (const x0 of HOUSES) {
        const x1 = x0 + 12, t = 6.4, r = 9.6, mz = (BACK + FRONT) / 2;
        for (const [ax, az, bx, bz] of [[x0, BACK, x1, BACK], [x0, FRONT, x1, FRONT], [x0, BACK, x0, FRONT], [x1, BACK, x1, FRONT]]) { line([ax, 0, az], [bx, 0, bz]); line([ax, t, az], [bx, t, bz]); }
        for (const [cx, cz] of [[x0, BACK], [x1, BACK], [x0, FRONT], [x1, FRONT]]) line([cx, 0, cz], [cx, t, cz]);
        line([x0, r, mz], [x1, r, mz]);
        if (x0 === MIRA) continue; // (her own house is drawn in colour, below)
        for (const fx of [x0 + 2.4, x0 + 8.4]) for (const fy of [1.0, 3.9]) { line([fx, fy, FRONT], [fx + 1.3, fy, FRONT]); line([fx, fy + 1.7, FRONT], [fx + 1.3, fy + 1.7, FRONT]); line([fx, fy, FRONT], [fx, fy + 1.7, FRONT]); line([fx + 1.3, fy, FRONT], [fx + 1.3, fy + 1.7, FRONT]); }
        line([x0 + 5.2, 2.2, FRONT], [x0 + 6.4, 2.2, FRONT]); line([x0 + 5.2, 0, FRONT], [x0 + 5.2, 2.2, FRONT]); line([x0 + 6.4, 0, FRONT], [x0 + 6.4, 2.2, FRONT]);
      }
      // the gable ends' slopes, drawn as short steps of line (the sketch's diagonals)
      for (const x0 of HOUSES) for (const xe of [x0, x0 + 12]) for (let k = 0; k < 6; k++) {
        const f0 = k / 6, f1 = (k + 1) / 6;
        for (const [za, zb] of [[BACK, (BACK + FRONT) / 2], [FRONT, (BACK + FRONT) / 2]]) line([xe, 6.4 + 3.2 * f0, za + (zb - za) * f0], [xe, 6.4 + 3.2 * f1, za + (zb - za) * f1]);
      }
    });
    // the edge of the memory: white, thickening, then nothing (an invisible ring keeps Kai inside); in the first experiment
    // the chamber's walls are its edge
    P.E(['PAST', 'FUTURE'], () => {
      for (let k = 0; k < 3; k++) {
        const d = 2 + k * 5, h = 8 + k * 6;
        for (const b of [[-B - d, -B - d, B + d, -B - d + 3], [-B - d, B + d - 3, B + d, B + d], [-B - d, -B - d, -B - d + 3, B + d], [B + d - 3, -B - d, B + d, B + d]]) P.vbox([b[0], -1, b[1], b[2], h, b[3]], 'memoryFog', { noShadow: 1 });
      }
    });
    // --- the terrace: Mira's house, and the others ------------------------------------------------------------------
    P.E(['PAST', 'FUTURE'], () => HOUSES.forEach((x0, i) => { if (x0 !== MIRA) house(P, x0, i); }));
    // in the first experiment the houses are only their pencil lines (above), and a low wall here and there where the
    // memory still holds the street's line (the walk along the terrace keeps its kerb)
    P.E('PRESENT', () => HOUSES.forEach((x0) => {
      if (x0 === MIRA) return;
      P.box([x0 + 0.1, 0, FRONT - 0.3, x0 + 11.9, 0.5 + ((x0 + 62) % 3) * 0.3, FRONT], 'chamberPanel');
    }));
    // Mira's house: a garden-room kitchen under a glass roof, French doors to the garden, the hall, the blue door
    P.land('kitchen', -20, 0, 12, Math.PI);
    P.land('fridgeDrawing', -24.6, 0, 11.4, Math.PI / 2);
    P.land('yellowBoots', -22.6, 0, 9, Math.PI);
    P.land('nightBadge', -15.9, 0, 22, -Math.PI / 2);
    P.land('blueDoor', -20, 0, 26.6, 0);
    P.land('garden', -20, 0, -10, Math.PI);
    const mx0 = MIRA, mx1 = MIRA + 12;
    // the floors (every year: the plot is the same)
    P.vbox([mx0, 0, EXT, mx1, 0.06, FRONT], 'kitchenTile', { noShadow: 1 });
    P.E(['PAST', 'FUTURE'], () => {
      // the kitchen extension (x -26 .. -14, z 8 .. 14): side walls, the French doors' wall with its opening, glass roof
      P.box([mx0, 0, EXT, mx0 + 0.3, 3, BACK], 'watercolourWall');
      P.box([mx1 - 0.3, 0, EXT, mx1, 3, BACK], 'watercolourWall');
      P.box([mx0, 0, EXT, -23, 3, EXT + 0.3], 'watercolourWall');
      P.box([-17, 0, EXT, mx1, 3, EXT + 0.3], 'watercolourWall');
      P.vbox([-23, 2.4, EXT, -17, 3, EXT + 0.3], 'watercolourWall');
      for (const x of [-23, -20, -17]) P.vbox([x - 0.05, 0, EXT, x + 0.05, 2.4, EXT + 0.3], 'woodWhite');
      P.vbox([mx0, 3, EXT, mx1, 3.12, BACK], 'glassRoof');
      // the house: walls to 6.4 m, the ceiling at 3 m, an opening from the kitchen into the hall
      P.box([mx0, 0, BACK, mx0 + 0.3, 6.4, FRONT], 'watercolourWall');
      P.box([mx1 - 0.3, 0, BACK, mx1, 6.4, FRONT], 'watercolourWall');
      P.box([mx0, 0, BACK, -22, 6.4, BACK + 0.3], 'watercolourWall');
      P.box([-18, 0, BACK, mx1, 6.4, BACK + 0.3], 'watercolourWall');
      P.box([-22, 2.6, BACK, -18, 6.4, BACK + 0.3], 'watercolourWall');
      P.box([mx0, 0, FRONT - 0.3, -20.7, 6.4, FRONT], 'watercolourWall');
      P.box([-19.3, 0, FRONT - 0.3, mx1, 6.4, FRONT], 'watercolourWall');
      P.box([-20.7, 2.4, FRONT - 0.3, -19.3, 6.4, FRONT], 'watercolourWall');
      P.box([mx0, 3, BACK, mx1, 3.3, FRONT], 'oakFloor', { solid: false });
      P.col([mx0, 3, BACK, mx1, 4, FRONT]);
      P.gable(-20, 6.4, 20, 12, 12, 3.2, Math.PI / 2, 'slate');
      for (const fx of [-25, -17.6]) P.vbox([fx, 3.9, FRONT, fx + 1.3, 5.6, FRONT + 0.06], 'windowWarm', { noShadow: 1 });
      P.vbox([-24.6, 0.9, FRONT, -22, 2.3, FRONT + 0.06], 'windowWarm', { noShadow: 1 });
      // inside: the counter, the table, the hall table, the stair (to a landing that is not remembered). (closing: visuals)
      // each drawn as what it is, its collider one box: a counter with its worktop, doors and handles; a table on four
      // legs with two chairs; the stair as its steps and stringer
      P.box([mx0 + 0.3, 0, 12.8, -21.5, 0.88, BACK], 'woodWhite');
      P.vbox([mx0 + 0.3, 0.88, 12.7, -21.4, 0.95, BACK], 'counterTop');
      for (let x = mx0 + 0.9; x < -21.9; x += 0.75) { P.vbox([x - 0.33, 0.08, 12.78, x + 0.33, 0.8, 12.8], 'woodWhite', { noShadow: 1 }); P.vbox([x + 0.2, 0.62, 12.74, x + 0.26, 0.74, 12.78], 'steel', { noShadow: 1 }); }
      P.col([-19.5, 0, 9.6, -16.5, 0.78, 11.4]);
      P.vbox([-19.6, 0.72, 9.5, -16.4, 0.78, 11.5], 'oakFloor');
      for (const [x, z] of [[-19.35, 9.75], [-16.65, 9.75], [-19.35, 11.25], [-16.65, 11.25]]) P.vbox([x - 0.04, 0, z - 0.04, x + 0.04, 0.72, z + 0.04], 'oakFloor');
      for (const [x, z, ry] of [[-18.6, 9.0, 0], [-17.2, 12.0, Math.PI]]) { P.obox(x, 0.44, z, 0.44, 0.04, 0.42, ry, 'oakFloor', { prop: 1 }); for (const dx of [-0.18, 0.18]) for (const dz of [-0.17, 0.17]) P.vbox([x + dx - 0.02, 0, z + dz - 0.02, x + dx + 0.02, 0.44, z + dz + 0.02], 'oakFloor', { prop: 1, noShadow: 1 }); P.obox(x, 0.48, z + (ry ? 0.19 : -0.19), 0.44, 0.5, 0.04, ry, 'oakFloor', { prop: 1 }); }
      P.box([-15, 0, 21.2, -14.3, 0.85, 22.8], 'woodWhite');
      P.col([-25.6, 0, 16, -24.2, 2.6, 23]);
      for (let k = 0; k < 10; k++) P.vbox([-25.6, 0, 16 + k * 0.7, -24.2, 0.26 * (k + 1), 16.7 + k * 0.7], 'oakFloor');
      P.vbox([-24.25, 0, 16, -24.2, 3.2, 23], 'woodWhite', { noShadow: 1 });
    });
    // the blue door itself, ajar (every year: it is the one thing the memory keeps)
    P.obox(-20.6, 0, FRONT + 0.25, 1.1, 2.3, 0.07, -0.9, 'blueDoor', { prop: 1 });
    P.vbox([-21, 0, FRONT - 0.1, -20.7, 2.5, FRONT + 0.1], 'woodWhite', { noShadow: 1 });
    P.vbox([-19.3, 0, FRONT - 0.1, -19, 2.5, FRONT + 0.1], 'woodWhite', { noShadow: 1 });
    // the remembered things, in colour in every year: the boots, the bikes, the badge on the hall table
    // (the yellow wellingtons: each a shaft and a foot, not a cube)
    for (const x of [-22.75, -22.35]) { P.vbox([x - 0.07, 0.06, 8.84, x + 0.07, 0.34, 9.0], 'marqueeYellow', { prop: 1 }); P.vbox([x - 0.075, 0, 8.66, x + 0.075, 0.08, 9.02], 'marqueeYellow', { prop: 1 }); P.vbox([x - 0.075, 0, 8.66, x + 0.075, 0.02, 9.02], 'ironDark', { prop: 1, noShadow: 1 }); }
    P.vbox([-15.0, 0.85, 21.8, -14.6, 0.88, 22.2], 'accentBlue', { prop: 1, noShadow: 1 });
    for (const [x, z, r] of [[-12.5, -2, 0.3], [-11.4, -3.2, 0.5]]) { P.torus(x, 0.35, z, 0.33, 0.03, 'ironDark', { ry: r, seg: 12 }); P.torus(x + Math.cos(r) * 1.0, 0.35, z - Math.sin(r) * 1.0, 0.33, 0.03, 'ironDark', { ry: r, seg: 12 }); P.obox(x + Math.cos(r) * 0.5, 0.45, z - Math.sin(r) * 0.5, 0.06, 0.3, 1.0, r + Math.PI / 2, 'carRed', { prop: 1 }); }
    // --- the gardens: fences, the sprinkler, a shed; Mira's gate into the back lane --------------------------------
    P.land('gardenGate', -20, 0, GARDEN - 2, Math.PI);
    P.E('PAST', () => {
      for (const x of HOUSES.slice(1)) railing(P, x, EXT, x, GARDEN, 1.3, 'wood', { t: 0.06 });
      railing(P, -62, GARDEN, -22, GARDEN, 1.6, 'wood', { t: 0.06 });
      railing(P, -18, GARDEN, 12, GARDEN, 1.6, 'wood', { t: 0.06 });
      railing(P, 16, GARDEN, 58, GARDEN, 1.6, 'wood', { t: 0.06 });
      P.box([-62, 0, EXT, -61.8, 1.6, FRONT], 'wood');
      // the sprinkler, its spray a disc of light
      P.cyl(-20, 0, -10, 0.06, 0.5, 'ironDark', { seg: 5 });
      P.disc(-20, 0.04, -10, 3.2, 'puddleWater', { seg: 24 });
      P.box([-25.5, 0, -27, -22, 2.2, -24], 'wood');
      P.gable(-23.75, 2.2, -25.5, 3.5, 3, 0.8, 0, 'roofDark');
      for (let i = 0; i < HOUSES.length; i++) {
        const x = HOUSES[i] + 6;
        if (HOUSES[i] === MIRA) continue;
        P.tree(i % 2 ? 'blossom' : 'shrub', x + P.rng.float(-3, 3), P.rng.float(-24, -6), P.rng.float(0.9, 1.3));
        P.box([x - 1.5, 0, -28, x + 1.5, 1.9, -26], i % 3 ? 'wood' : 'corrugated');
      }
      // the park behind: allotments and a playground
      for (let i = 0; i < 8; i++) P.plane(-60 + i * 15, -60, -50 + i * 15, -44, 0.03, 'soil', { noShadow: 1 });
      for (let i = 0; i < 16; i++) P.tree('blossom', P.rng.float(-60, 60), P.rng.float(-62, -40), P.rng.float(1, 1.5));
      P.box([20, 0, -52, 22, 3, -50], 'ironDark');
      P.box([26, 0, -52, 28, 3, -50], 'ironDark');
      P.box([20, 3, -52, 28, 3.2, -50], 'ironDark', { solid: false });
    });
    // --- the experiment, in the park (every year has its trace; the white chamber is the first experiment's) -------
    P.land('whiteChamber', -10, 0, -44, Math.PI);
    P.land('childChair', -10, 0, -50, 0);
    P.land('console', -2, 0, -46, -Math.PI / 2);
    P.land('laneEnd', 14, 0, LANE + 3, 0);
    P.vbox([-10.3, 0, -50.3, -9.7, 0.45, -49.7], 'marqueeYellow', { prop: 1 });
    P.box([-1.4, 0, -47.2, -0.2, 1.1, -44.8], 'helixWhite');
    P.vbox([-1.45, 1.1, -47, -1.35, 1.6, -45], 'lightPanel', { noShadow: 1 });
    // the back lane's east end and the alley down to the corner (x 58 .. 65)
    P.E('PAST', () => { railing(P, 58, EXT, 58, GARDEN, 1.6, 'wood', { t: 0.06 }); P.box([58, 0, BACK, 58.3, 6, FRONT], 'brickWall'); });
    // --- the world without Kai: the east gardens as one garden, the corner, the sea --------------------------------
    P.land('seaGarden', 36, 0, -12, Math.PI);
    P.land('miraPlanting', 30, 0, -4, Math.PI / 2);
    P.land('memorialNobody', 40, 0, 31, Math.PI);
    P.land('stop41', 60, 0, 31, Math.PI);
    P.land('alignBoard', 22, 0, 30.5, Math.PI);
    P.land('houseNoOwner', 40, 0, 27, 0);
    P.E('FUTURE', () => {
      // her garden: beds, a path, a greenhouse, everything in flower
      for (let i = 0; i < 6; i++) P.plane(14 + i * 7, -24, 19 + i * 7, -6, 0.03, 'soil', { noShadow: 1 });
      P.plane(12, -4, 58, -1, 0.04, 'pathBrick', { noShadow: 1 });
      for (let i = 0; i < 40; i++) P.tree(P.rng.pick(['flowers', 'shrub', 'blossom', 'grass']), P.rng.float(12, 58), P.rng.float(-26, 6), P.rng.float(0.8, 1.4), { solid: false });
      P.box([44, 0, -22, 52, 2.6, -14], 'glass');
      P.gable(48, 2.6, -18, 8, 8, 1.4, 0, 'glassRoof');
      for (const x of [-62, -50, -38, -14, -2]) { railing(P, x, EXT, x, GARDEN, 1.0, 'hedge', { t: 0.6 }); }
      for (const [a, b] of [[-62, -22], [-18, 12], [16, 58]]) railing(P, a, GARDEN, b, GARDEN, 1.0, 'hedge', { t: 0.6 });
      for (let i = 0; i < 12; i++) P.tree('blossom', P.rng.float(-60, 8), P.rng.float(-26, 4), P.rng.float(1, 1.4));
      for (let i = 0; i < 14; i++) P.tree(P.rng.pick(['flowers', 'grass']), P.rng.float(-60, 60), P.rng.float(-62, -40), P.rng.float(1, 1.6), { solid: false });
      // the memorial for nobody: a plinth with no name
      P.box([38.8, 0, 30.4, 41.2, 1.6, 31.6], 'statueStone');
      P.vbox([39.2, 1.6, 30.8, 40.8, 2.4, 31.2], 'statueStone');
      for (let i = 0; i < 4; i++) P.tree('flowers', 38.5 + i * 0.9, 32.4, 0.6, { solid: false });
    });
    // the 41 stop at the corner (every year; in the experiment it is the only thing on the street)
    P.cyl(60, 0, 31, 0.07, 2.8, 'busStopGreen', { seg: 6 });
    sign(P, '41', 60, 2.6, 31.1, 0, { size: 0.5, color: '#ffffff', boardMat: 'busStopGreen' });
    P.E(['PAST', 'FUTURE'], () => prop(P, 'busShelter', 56, 28.6, 0));
    // the alignment board: three memories pinned in their own order
    P.box([20.6, 0, 30.3, 23.4, 1.9, 30.6], 'wood');
    for (const [k, c] of [[0, 'marqueeYellow'], [1, 'voidWhite'], [2, 'accentBlue']]) P.vbox([20.9 + k * 0.9, 1.1, 30.62, 21.6 + k * 0.9, 1.7, 30.66], c, { noShadow: 1 });
  },
};
