// The Broken Observatory on the eastern Ridge (Mission 7; OVERHAUL.md §5 M7). A plateau of stone and
// grass high above the valley (the village and the Ring Hill below to the west, the sea far south),
// stepping up in terraces to a summit drum at 27.5 m (the engine respawns anyone above 30 m, so the
// bible's 30 m summit stands a little lower) whose Horizon Ring frames the Notch. In the middle
// of it the Great Armillary: a 48 m bronze ring on twelve stone piers, carrying a walkway at 18 m,
// with the tilted rings of an armillary sphere inside. The lower ring and its gnomon, the astronomers'
// flat-roofed houses (their roofs a route up), the three stepped turntables, the Star Tube's tower.
// THE FIRST SKY: sunrise exactly in the Notch, polished bronze, torches, sky-watchers. 2049: blue hour,
// one bright star, a thin moon; a survey: floodlights, tarps, scaffold stairs, site huts, the inner
// rings dismantled in the grass. 2196: a golden windy afternoon in tall grass; two segments of the
// outer ring have fallen down the slope (one is a ramp up to the walkway); a new star: the Fracture.
//   Q0 THE LOWER RING        the south lawns (z 20 .. 90)
//   Q1 THE INSTRUMENT STAIR  the middle (z -30 .. 20)
//   Q2 THE OUTER RING        the north (z -90 .. -30): the armillary and the terraces to the summit
import { ground, terrace, stair, ramp, railing, prop, glyphs, sign, tent, canopy, ringStones, bridge } from '../archetypes.js';

const C = [-12, -52]; // the armillary's centre
const RW = 24; // the walkway's radius
const WALK_Y = 18;
const SUMMIT = 27.5;

// the outer ring walkway: deck, piers, parapet and rail colliders; `gaps` are angle ranges where it has
// fallen, `opens` where its outer parapet lets a bridge, a scaffold or a fallen segment on
const OPENS = [[-0.07, 0.07], [6.21, 6.3]]; // the bridge from the terraces, due east
function ringWalk(P, gaps = [], opens = []) {
  const [cx, cz] = C;
  const n = 72;
  const inGap = (a) => gaps.some(([a0, a1]) => a >= a0 && a < a1);
  const open = (a) => [...OPENS, ...opens].some(([a0, a1]) => a >= a0 && a < a1);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2, m = (a + b) / 2;
    if (inGap(m)) continue;
    const x = cx + Math.cos(m) * RW, z = cz + Math.sin(m) * RW;
    P.obox(x, WALK_Y - 0.35, z, 2.8, 0.35, (2 * Math.PI * RW) / n + 0.06, -m, 'sandstone', { noShadow: 0 });
    P.col([x - 1.25, WALK_Y - 0.6, z - 1.25, x + 1.25, WALK_Y, z + 1.25]);
    for (const [r, h] of [[RW + 1.45, 1.6], [RW - 1.45, 1.6]]) {
      if (r > RW && open(m)) continue;
      const x0 = cx + Math.cos(a) * r, z0 = cz + Math.sin(a) * r, x1 = cx + Math.cos(b) * r, z1 = cz + Math.sin(b) * r;
      P.col([Math.min(x0, x1) - 0.15, WALK_Y, Math.min(z0, z1) - 0.15, Math.max(x0, x1) + 0.15, WALK_Y + h, Math.max(z0, z1) + 0.15]);
    }
  }
  for (let i = 0; i < 12; i++) {
    const m = (i / 12) * Math.PI * 2 + 0.13;
    if (inGap(m)) continue;
    const x = cx + Math.cos(m) * RW, z = cz + Math.sin(m) * RW;
    P.box([x - 1.1, 0, z - 1.1, x + 1.1, WALK_Y - 0.35, z + 1.1], 'basalt');
  }
}

// the armillary's bronze: the outer band on the walkway's outer edge and the tilted rings inside
function bronzework(P, m, { fallen = false } = {}) {
  const [cx, cz] = C;
  const arc = fallen ? Math.PI * 1.45 : Math.PI * 2;
  P.torus(cx, WALK_Y + 0.6, cz, RW + 1.45, 0.42, m, { rx: Math.PI / 2, arc, rz: fallen ? 0.35 : 0, seg: 72 });
  P.torus(cx, WALK_Y + 1.1, cz, RW - 1.45, 0.1, m, { rx: Math.PI / 2, arc, rz: fallen ? 0.35 : 0, seg: 72 });
  if (fallen) return;
  P.torus(cx, 14, cz, 13, 0.36, m, { rx: 0, ry: 0.3, seg: 64 });
  P.torus(cx, 14, cz, 12, 0.3, m, { rx: Math.PI / 2 - 0.41, ry: 0.3, seg: 64 });
  P.torus(cx, 14, cz, 10.6, 0.26, m, { rx: Math.PI / 2 + 0.4, ry: 1.2, seg: 56 });
  P.cyl(cx, 1.2, cz, 0.3, 26, m, { rx: 0.41, ry: 0.3, seg: 10 });
  P.sphere(cx, 14, cz, 1.4, m);
}

export default {
  key: 'observatory', style: 'observatory', sameAs: null, name: 'THE BROKEN OBSERVATORY',
  bounds: [-90, -90, 90, 90],
  edges: { N: 'cliff', E: 'cliff', W: 'slope', S: 'slope' },
  killY: -3,
  primary: 'outerRingWalk',
  ancientYears: ['PAST'],
  backdrop: { notch: 'clear', valley: 'W' },
  years: {
    PRESENT: { sky: 'blueHour', era: '2049', hour: 19.6, sun: { elev: -5, az: 290 }, fog: 0x2a3654, density: 1.0, night: 0.62, weather: null, ibl: 'night', lit: 1,
      hemi: { sky: 0x5070a0, ground: 0x1a2232, k: 0.8 }, sunColor: 0x8aa0d0, sunK: 0.3, grade: { shadowTint: 0x101c3a, highlightTint: 0xc8d8ff, toning: 0.2, contrast: 1.12, saturation: 0.92 } },
    PAST: { sky: 'notchSunrise', era: 'ancient', hour: 5.9, sun: { elev: 3, az: 'notch' }, fog: 0xd89a7a, density: 1.1, night: 0.15, weather: null, ibl: 'dusk', lit: 0,
      hemi: { sky: 0xffb890, ground: 0x3a3440, k: 0.8 }, sunColor: 0xffb070, sunK: 1.2, grade: { shadowTint: 0x2a1c3a, highlightTint: 0xffd8a8, toning: 0.24, contrast: 1.12, saturation: 1.06 } },
    FUTURE: { sky: 'windyGold', era: '2196', hour: 16.8, sun: { elev: 20, az: 250 }, fog: 0xe0c890, density: 0.9, night: 0, weather: 'pollen', ibl: 'dusk', lit: 0,
      hemi: { sky: 0xf2d49a, ground: 0x8a7a50, k: 0.9 }, sunColor: 0xffd890, sunK: 1.2, grade: { shadowTint: 0x3a2a14, highlightTint: 0xfff0c8, toning: 0.16, contrast: 1.08, saturation: 1.08 } },
  },
  quarters: [
    { name: 'THE LOWER RING', area: [-90, 20, 90, 90], spawnAt: 'nikoGuide', threshold: { at: 'rotatingPlatforms', kind: 'roof' } },
    { name: 'THE INSTRUMENT STAIR', area: [-90, -30, 90, 20], spawnAt: 'instrumentFoot', threshold: { at: 'ringFoot', kind: 'stair' } },
    { name: 'THE OUTER RING', area: [-90, -90, 90, -30], spawnAt: 'ringFoot', threshold: { at: 'horizonRing', kind: 'summit' } },
  ],
  beatAt: { m07: ['gnomon', 'datesRing', 'tinSpot'] },
  exits: { m07: 'horizonRing' },
  frags: { m07: [['lowerRing', 'astronomerRoofs', 'gnomonFoot'], ['starTube', 'scavengerCamp', 'cache'], ['outerRingWalk', 'summitStair', 'horizonRing']] },
  watch: { m07: [[], [[[38, -16], [62, -16], [62, 4], [38, 4]]], [[[-46, -40], [-44, -66], [-28, -82], [-4, -84]], [[-20, -56], [-4, -56], [-4, -46], [-20, -46]]]] },
  crowd: [
    { era: 'ancient', years: ['PAST'], region: 'settlement', role: 'skywatcher', path: [[-40, 60], [0, 60], [0, 40]], n: 5 },
    { era: 'present', years: ['PRESENT'], region: 'helix', role: 'surveyor', path: [[-30, -20], [10, -20]], n: 3 },
  ],

  build(P) {
    const [cx, cz] = C;
    // --- the plateau and the terraces to the summit (north-east) ------------------------------------------
    ground(P, [-90, -90, 90, 90], 0, 'ridgeGrass');
    terrace(P, [20, -90, 90, -36], 8, 'ridgeGrass', { wall: 'sandstone', sides: 'SW', cap: 'sandstone' });
    terrace(P, [40, -90, 90, -46], 16, 'ridgeGrass', { wall: 'sandstone', sides: 'SW', cap: 'sandstone' });
    stair(P, 30, -22, 0, 30, -36.4, 8, 6, 'sandstone', { rail: 'bronzeAged' });
    stair(P, 27.6, -70, 8, 40.4, -70, 16, 5, 'sandstone'); // up the first terrace to the second, eastward
    P.land('terraceStair', 30, 0, -21, Math.PI);
    // the summit drum (27.5 m) and its stair; the Horizon Ring frames the Notch
    P.cyl(74, 16, -74, 8, SUMMIT - 16, 'sandstone', { seg: 24 });
    P.col([67, 16, -81, 81, SUMMIT, -67]);
    P.setTerrain(66, -82, 82, -66, SUMMIT);
    P.disc(74, SUMMIT + 0.02, -74, 8, 'sandstoneDark', { seg: 24, noShadow: 1 });
    stair(P, 44, -74, 16, 66.2, -74, SUMMIT, 3.2, 'sandstone');
    P.land('summitStair', 46, 16, -74, -Math.PI / 2);
    for (const [x0, z0, x1, z1] of [[66.4, -81.6, 81.6, -81.6], [81.6, -81.6, 81.6, -66.4], [66.4, -66.4, 81.6, -66.4]]) railing(P, x0, z0, x1, z1, 1.0, 'sandstone', { y: SUMMIT });
    P.land('horizonRing', 74, SUMMIT, -78, Math.PI);
    P.box([72.6, SUMMIT, -79.4, 75.4, SUMMIT + 1, -78.6], 'basalt');
    // the Horizon Ring itself: an upright bronze ring on the drum's north edge, aimed at the Notch
    P.E('PAST', () => P.torus(74, SUMMIT + 4.2, -80.6, 3.4, 0.2, 'bronzePolished', { ry: 0.4, seg: 40 }));
    P.E('PRESENT', () => P.torus(74, SUMMIT + 4.2, -80.6, 3.4, 0.2, 'bronzeAged', { ry: 0.4, seg: 40 }));
    P.E('FUTURE', () => P.torus(74, SUMMIT + 3.6, -80.6, 3.4, 0.2, 'bronzeVerdigris', { ry: 0.4, rz: 0.5, arc: 4.4, seg: 40 }));
    for (const s of [-1, 1]) P.box([74 + s * 3.6 - 0.3, SUMMIT, -81, 74 + s * 3.6 + 0.3, SUMMIT + 1.4, -80.2], 'basalt');
    // --- Q2: the Great Armillary --------------------------------------------------------------------------
    P.land('outerRingWalk', cx + RW, WALK_Y, cz, Math.PI / 2);
    P.land('ringFoot', cx + 8, 0, cz + 31, Math.PI);
    P.land('tinSpot', cx - RW - 3.4, 0, cz + 6, Math.PI / 2);
    P.disc(cx, 0.02, cz, 9, 'sandstoneDark', { seg: 32, noShadow: 1 });
    P.cyl(cx, 0, cz, 3.2, 1.2, 'basalt', { seg: 16, solid: true });
    // the bridge from the second terrace (16 m) to the walkway (18 m)
    bridge(P, cx + RW + 1.2, cz, 40, cz, 2.8, WALK_Y, 'sandstone', { parapetMat: 'sandstone', parapetH: 0.9, thick: 0.5 });
    stair(P, 46, cz, 16, 40.2, cz, WALK_Y, 2.8, 'sandstone');
    P.E('PAST', () => ringWalk(P));
    P.E('PRESENT', () => ringWalk(P, [], [[2.2, 2.36]]));
    P.E('FUTURE', () => ringWalk(P, [[2.1, 2.75], [4.0, 4.5]], [[3.06, 3.22]]));
    P.E('PAST', () => bronzework(P, 'bronzePolished'));
    P.E('PRESENT', () => bronzework(P, 'bronzeAged'));
    P.E('FUTURE', () => {
      bronzework(P, 'bronzeVerdigris', { fallen: true });
      // two segments of the outer ring lie down the slope; the western one is a ramp up to the walkway
      const a = 2.42, x = cx + Math.cos(a) * (RW + 6), z = cz + Math.sin(a) * (RW + 6);
      P.torus(x - 4, 3, z + 6, 14, 0.5, 'bronzeVerdigris', { rx: 0.3, ry: 1.0, arc: 1.4, seg: 24 });
      // the western segment lies against the walk: a ramp up to it, due west of the ring
      ramp(P, [cx - 66, cz - 1.6, cx - RW - 1.3, cz + 1.6], 0, WALK_Y, 'E', 'bronzeVerdigris', { terrain: false });
      P.land('fallenSegment', cx - 66, 0, cz, -Math.PI / 2);
      P.torus(cx + 18, 0.6, cz - 30, 9, 0.5, 'bronzeVerdigris', { rx: Math.PI / 2 - 0.15, arc: 2.2, seg: 20 });
      for (let i = 0; i < 5; i++) P.obox(cx + 30 + i * 3, 0, cz - 20 + i * 4, 1.8, 1.4, 3.2, i, 'basalt', { solid: true, rx: 0.4 });
      for (let i = 0; i < 40; i++) P.tree('grass', P.rng.float(-88, 88), P.rng.float(-88, 88), P.rng.float(1.6, 2.6), { solid: false });
    });
    P.E('PRESENT', () => {
      // the survey: scaffold stair up one pier to the walkway, floodlights, tarps, the inner rings in the grass
      const a = 2.0, x = cx + Math.cos(a) * (RW + 3.6), z = cz + Math.sin(a) * (RW + 3.6);
      // six switchback flights in two lanes, landings at each end, and a plank in to the walk
      for (let f = 0; f < 6; f++) {
        const y0 = f * 3, dir = f % 2 ? -1 : 1, zz = z + (f % 2) * 1.8, xe = x + dir * 4.8;
        stair(P, x - dir * 4, zz, y0, x + dir * 4, zz, y0 + 3, 1.6, 'scaffold');
        P.box([xe - 0.8, y0 + 2.8, z - 0.8, xe + 0.8, y0 + 3, z + 2.6], 'scaffold');
      }
      P.box([x - 5.6, WALK_Y - 0.2, z - 6.2, x - 4, WALK_Y, z - 0.8], 'scaffold');
      for (const [px, pz] of [[x - 5.6, z - 0.9], [x + 5.6, z - 0.9], [x - 5.6, z + 2.7], [x + 5.6, z + 2.7]]) P.vbox([px - 0.06, 0, pz - 0.06, px + 0.06, WALK_Y + 1, pz + 0.06], 'scaffold', { noShadow: 1 });
      P.land('surveyScaffold', x, 0, z + 2, 0);
      for (const [px, pz] of [[cx - 14, cz + 30], [cx + 20, cz + 26], [cx - 30, cz - 10], [20, -8], [-40, 30]]) prop(P, 'floodlight', px, pz, 0);
      for (const [px, pz, r] of [[cx + 30, cz + 40, 11], [cx - 36, cz + 34, 9]]) P.torus(px, 0.4, pz, r, 0.34, 'bronzeAged', { rx: Math.PI / 2 - 0.05, arc: 4, seg: 32 });
      for (const [px, pz] of [[cx + 12, cz + 36], [-50, -14], [52, 30]]) prop(P, 'siteHut', px, pz, 0.3);
      for (const [px, pz] of [[cx - 4, cz + 34], [cx + 16, cz + 40], [0, 30]]) prop(P, 'tarp', px, pz, 0.4, { w: 5, d: 4 });
      sign(P, 'RIDGE SURVEY 2049 - HELIX HERITAGE', cx + 12, 2.2, cz + 34.6, 0, { size: 0.3, color: '#ffe0b0' });
    });
    P.challenge('outerRing', [cx - 40, cz - 40, cx + 40, cz + 40], ['PRESENT', 'FUTURE', 'PAST'], ['The walk is eighteen metres up. The bridge reaches it from the terraces.', 'In 2049 the surveyors have a scaffold against a pier. In 2196 a fallen segment leans up to it.', 'Take the terrace stairs to the bridge, or climb the scaffold in 2049, or walk up the fallen segment in 2196.'], { optional: true });
    // --- Q1: the instrument stair: the turntables, the dates ring, the Star Tube, the scavengers' camp --------
    P.land('instrumentFoot', -48, 0, 14, Math.PI);
    P.land('rotatingPlatforms', -36, 3, -6, 0);
    for (const [x, z, y] of [[-50, -4, 2], [-36, -10, 4], [-22, -4, 6]]) {
      P.cyl(x, 0, z, 6, y, 'sandstone', { seg: 28, solid: true });
      P.col([x - 5.2, 0, z - 5.2, x + 5.2, y, z + 5.2]);
      P.setTerrain(x - 5.2, z - 5.2, x + 5.2, z + 5.2, y);
      P.disc(x, y + 0.02, z, 5.2, 'sandstoneDark', { seg: 28, noShadow: 1 });
      P.E('PAST', () => P.torus(x, y + 0.1, z, 4.6, 0.12, 'bronzePolished', { rx: Math.PI / 2, seg: 36 }));
      P.E('PRESENT', () => P.torus(x, y + 0.1, z, 4.6, 0.12, 'bronzeAged', { rx: Math.PI / 2, seg: 36 }));
    }
    stair(P, -46, 4, 0, -48, -0.6, 2, 2.4, 'sandstone');
    stair(P, -43, -6, 2, -40.6, -8, 4, 2.4, 'sandstone');
    stair(P, -29.5, -8.5, 4, -27.2, -6.4, 6, 2.4, 'sandstone');
    // the Star Tube: a 20 m tower with a sighting tube on its roof, an outside stair to its gallery
    P.land('starTube', 6, 0, -14, Math.PI);
    P.box([3, 0, -17, 9, 20, -11], 'sandstone');
    P.vbox([2.6, 20, -17.4, 9.4, 20.6, -10.6], 'basalt');
    P.E(['PAST', 'PRESENT'], () => P.cyl(6, 20.6, -14, 0.6, 9, 'bronzeAged', { rx: -0.85, seg: 14 }));
    P.E('FUTURE', () => P.cyl(10, 0, -9, 0.6, 9, 'bronzeVerdigris', { rx: 1.45, ry: 0.8, seg: 14 }));
    stair(P, 0.4, -19, 0, 0.4, -9.6, 3.2, 1.6, 'sandstone');
    // the dates ring: an upright bronze ring on a plinth, its dates cut round the rim
    P.land('datesRing', -6, 0, 4, 0);
    P.box([-9, 0, 3.2, -3, 0.8, 4.8], 'basalt');
    P.E('PAST', () => P.torus(-6, 4, 4, 3.1, 0.22, 'bronzePolished', { seg: 40 }));
    P.E('PRESENT', () => P.torus(-6, 4, 4, 3.1, 0.22, 'bronzeAged', { seg: 40 }));
    P.E('FUTURE', () => P.torus(-6, 3.6, 4.4, 3.1, 0.22, 'bronzeVerdigris', { seg: 40, rx: 0.25 }));
    // the scavengers' camp and their cache (2196's people are on the hill in every year's echo of it)
    P.land('scavengerCamp', 50, 0, -6, 0);
    P.land('cache', 66, 0, -12, -Math.PI / 2);
    P.E(['PRESENT', 'FUTURE'], () => {
      for (const [x, z] of [[46, -12], [54, -14], [58, -2]]) tent(P, { x, z, r: 2.2, h: 2.8, m: 'tarpScav' });
      prop(P, 'firePit', 50, -6, 0, { fire: true });
      for (const [x, z] of [[64, -14], [66, -10], [44, 0]]) prop(P, 'crate', x, z, 0.6, { m: 'rust' });
    });
    P.E('PAST', () => {
      for (const [x, z] of [[46, -12], [56, -8]]) tent(P, { x, z, r: 2.6, h: 3.2, m: 'hide' });
      prop(P, 'firePit', 50, -6, 0, { fire: true });
    });
    // --- Q0: the lower ring, the gnomon, the astronomers' houses ----------------------------------------------
    P.land('nikoGuide', -46, 0, 72, Math.PI);
    P.land('gnomon', -22, 0, 34, Math.PI);
    P.land('gnomonFoot', -20, 0, 36.4, 0);
    P.cyl(-22, 0, 30, 1.6, 0.8, 'basalt', { seg: 8, solid: true });
    P.cyl(-22, 0.8, 30, 0.7, 10, 'sandstone', { r2: 0.25, seg: 8, solid: true });
    P.land('lowerRing', -22, 0, 50, 0);
    ringStones(P, -22, 0, 50, 9, 12, 1.4, { w: 1.6, d: 1.0, m: 'sandstone' });
    P.E('PAST', () => P.torus(-22, 1.5, 50, 9, 0.22, 'bronzePolished', { rx: Math.PI / 2, seg: 48 }));
    P.E('PRESENT', () => P.torus(-22, 1.5, 50, 9, 0.22, 'bronzeAged', { rx: Math.PI / 2, seg: 48 }));
    glyphs(P, -22, 0.8, 41.6, 3, 0.8, 0, { m: 'glyphStone' });
    // the astronomers' houses: flat roofs stepping up to the first turntable (a route over the rooftops)
    P.land('astronomerRoofs', -40, 4.4, 30, Math.PI);
    const houses = [[-62, 40, 1.1], [-58, 34, 2.2], [-54, 28, 3.3], [-50, 22, 4.4]]; // touching, each a jump higher
    houses.forEach(([x, z, h], i) => {
      P.box([x - 3.6, 0, z - 3, x + 3.6, h, z + 3], 'sandstone');
      P.vbox([x - 3.8, h, z - 3.2, x + 3.8, h + 0.25, z + 3.2], 'sandstoneDark');
      P.vbox([x - 0.7, 0, z + 2.98, x + 0.7, Math.min(h, 1.9), z + 3.04], 'shadow');
      P.E('PAST', () => P.vbox([x - 3.8, h + 0.25, z - 3.2, x - 2.2, h + 1.6, z + 3.2], 'hideAwning'));
      P.E('FUTURE', () => i % 2 && P.obox(x + 2, h - 0.6, z, 4, 0.3, 6, 0.2, 'sandstone', { rz: 0.35 }));
    });
    for (const [x, z, h] of [[-36, 34, 3.2], [-30, 28, 4.2], [-38, 22, 5.2]]) {
      P.box([x - 3, 0, z - 2.6, x + 3, h, z + 2.6], 'sandstone');
      P.vbox([x - 3.2, h, z - 2.8, x + 3.2, h + 0.25, z + 2.8], 'sandstoneDark');
    }
    // the eastern lawns: the old observers' benches, the cairns of the people who came up to watch
    for (const [x, z] of [[20, 50], [34, 62], [48, 46], [8, 70]]) P.box([x - 2, 0, z - 0.4, x + 2, 0.5, z + 0.4], 'sandstone');
    for (const [x, z] of [[60, 70], [70, 54], [-70, 80], [76, 30]]) prop(P, 'cairn', x, z, 0);
    // the years on the lower lawns: torches and sky-watchers' poles then; floodlit survey pegs now; tall grass later
    P.E('PAST', () => {
      for (const [x, z] of [[-30, 42], [-14, 42], [-30, 58], [-14, 58], [-50, 60], [-6, 20], [-40, 8], [-26, 8], [-14, -18], [14, -24], [-34, -26], [10, 30], [24, 10], [-60, -20]]) prop(P, 'torch', x, z, 0);
      for (const [x, z] of [[0, 40], [10, 50], [-4, 64], [30, 40]]) {
        P.cyl(x, 0, z, 0.08, 4.4, 'timber', { seg: 6 });
        P.vbox([x + 0.08, 3.2, z - 0.02, x + 1.2, 4.3, z + 0.02], 'linen');
      }
    });
    P.E('PRESENT', () => {
      for (const [x, z] of [[-30, 60], [-10, 46], [10, 24], [-40, -10], [24, -20]]) prop(P, 'barrier', x, z, 0.4, { w: 3 });
    });
    for (let i = 0; i < 24; i++) P.tree('grass', P.rng.float(-88, 88), P.rng.float(20, 88), P.rng.float(0.8, 1.2), { solid: false });
    for (const [x, z] of [[-80, 70], [-82, 40], [-80, 0], [-78, -40], [80, 80], [84, 10], [60, 84], [-60, 86]]) P.tree('cypress', x, z, P.rng.float(1.2, 1.7));
    for (let i = 0; i < 10; i++) P.tree('shrub', P.rng.float(-88, 88), P.rng.float(-28, 18), P.rng.float(0.9, 1.3), { solid: false });
    void canopy;
  },
};
