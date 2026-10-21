// THE LAST VERSION OF EARTH: the Valley of the Ring (OVERHAUL.md §4.2).
//
// One geography for every connected place. The Ring Hill is a knoll at a river bend: three
// thousand years ago the standing-stone ring crowns it, later Helix builds its campus on it.
// The river comes down an upstream gorge past the village bend, becomes Old Town's canal and
// reaches the sea in the south. The Ridge carries the Observatory to the east; the Notch, a split
// peak, stands far to the north-east. Each place has an atlas position (metres; x east, z south),
// and Horizon.js draws these features at their true bearing from it, so the same peaks recur where
// they should and nowhere else.

export const ATLAS = {
  // [x, z] of each place's origin; a place's own north is the atlas north
  helix: [0, 0], helix_v17: [0, 0], valley_upper: [0, 0],
  rain_south: [0, 560], valley_river: [-170, 210], oldtown: [-300, 440], observatory: [1320, -60],
};

// the far features (all pure data)
export const FEATURES = {
  ringHill: { at: [0, 0], r: 210, h: 58 },
  ridge: { from: [1200, 1100], to: [1290, -1500], h: 170 },
  notch: { at: [2600, -3000], h: 760, w: 900 },
  city: { at: [60, 980], r: 820 }, // Rain City's centre and spread (from 2026 on)
  harbour: { at: [200, 1650], w: 900 },
  sea: { z: { ancient: 3400, 2026: 1800, 2049: 1700, v17: 1700, 2196: 950 } },
  gorge: { at: [420, -700] },
};

const deg = (r) => (r * 180) / Math.PI;
export function bearing(from, to) {
  return (deg(Math.atan2(to[0] - from[0], -(to[1] - from[1]))) + 360) % 360;
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const elevOf = (h, d, eye = 2) => deg(Math.atan2(h - eye, Math.max(d, 1)));

// The horizon of a place in one era: a list of silhouettes to paint, each at a bearing (degrees,
// 0 north, 90 east) with a half width and a height in degrees, and a haze 0..1 toward the year's
// horizon colour. kind: hill | ridge | notch | skyline | sea | cranes | crown | glint | smoke
export function horizonFor(key, era, opts = {}) {
  const at = ATLAS[key] || [0, 0];
  const out = [];
  const ancient = era === 'ancient';
  // the Notch: a split peak, far off to the north-east
  {
    const f = FEATURES.notch, d = dist(at, f.at);
    out.push({ kind: 'notch', b: bearing(at, f.at), w: deg(Math.atan2(f.w / 2, d)), h: elevOf(f.h, d), haze: opts.notch === 'faint' ? 0.78 : 0.55, snow: true });
  }
  // the Ridge: a long line of hills to the east (or under the place itself, for the observatory)
  if (key !== 'observatory') {
    const f = FEATURES.ridge;
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const p = [f.from[0] + ((f.to[0] - f.from[0]) * i) / n, f.from[1] + ((f.to[1] - f.from[1]) * i) / n];
      const d = dist(at, p);
      out.push({ kind: 'ridge', b: bearing(at, p), w: deg(Math.atan2(260, d)), h: elevOf(f.h * (0.75 + 0.25 * Math.sin(i * 1.7)), d), haze: 0.42 });
    }
    // the observatory's rings glint on the Ridge
    const o = ATLAS.observatory, d = dist(at, o);
    out.push({ kind: 'glint', b: bearing(at, o), w: 0.6, h: elevOf(FEATURES.ridge.h + 18, d), haze: 0.2, era });
  } else {
    // from the Ridge the valley opens west: the Ring Hill below, the river, the city south-west
    out.push({ kind: 'ridge', b: 330, w: 40, h: 2.2, haze: 0.5 });
    out.push({ kind: 'ridge', b: 200, w: 28, h: 1.6, haze: 0.5 });
    out.push({ kind: 'ridge', b: 120, w: 50, h: 3.5, haze: 0.45 });
  }
  // the Ring Hill (from anywhere but on it), crowned by whatever stands on it in this era
  if (!['helix', 'helix_v17', 'valley_upper'].includes(key)) {
    const f = FEATURES.ringHill, d = dist(at, f.at);
    const b = bearing(at, f.at);
    out.push({ kind: 'hill', b, w: deg(Math.atan2(f.r, d)), h: elevOf(f.h, d), haze: 0.32 });
    const crown = ancient ? 'stones' : era === '2196' ? 'ruin' : era === 'v17' ? 'ring' : era === '2026' ? 'frame' : 'crescent';
    out.push({ kind: 'crown', crown, b, w: deg(Math.atan2(70, d)), h: elevOf(f.h + 16, d), base: elevOf(f.h, d), haze: 0.28 });
  }
  // the city: none 3,000 years ago; around rain_south it is all round; elsewhere to the south
  if (!ancient) {
    const f = FEATURES.city;
    if (key === 'rain_south' || key === 'oldtown') {
      for (const [b0, b1, h] of key === 'rain_south' ? [[60, 150, 7], [210, 300, 8], [150, 210, 5]] : [[90, 200, 5], [200, 260, 6], [300, 350, 3]]) {
        out.push({ kind: 'skyline', b: (b0 + b1) / 2, w: (b1 - b0) / 2, h: era === '2196' ? h * 0.6 : era === '2026' ? h * 0.7 : h, haze: 0.4, broken: era === '2196', lit: era !== '2196' });
      }
    } else {
      const d = dist(at, f.at), b = bearing(at, f.at);
      out.push({ kind: 'skyline', b, w: deg(Math.atan2(f.r, d)), h: elevOf(era === '2026' ? 60 : 110, d) * (era === '2196' ? 0.55 : 1), haze: 0.5, broken: era === '2196', lit: era !== '2196' });
    }
    if (era !== '2196') {
      const h = FEATURES.harbour, d = dist(at, h.at);
      out.push({ kind: 'cranes', b: bearing(at, h.at), w: deg(Math.atan2(h.w / 2, d)), h: elevOf(60, d), haze: 0.55 });
    }
  } else {
    // smoke from cooking fires rises over the village bend
    if (key !== 'valley_river' && key !== 'valley_upper') out.push({ kind: 'smoke', b: bearing(at, ATLAS.valley_river), w: 2, h: 6, haze: 0.5 });
  }
  // the sea: a bright line to the south, nearer in 2196
  {
    const z = FEATURES.sea.z[era] ?? 1700;
    const d = Math.max(200, z - at[1]);
    out.push({ kind: 'sea', b: 180, w: era === '2196' ? 70 : ancient ? 35 : 55, h: Math.max(0.15, elevOf(0, d, -2) + 0.4), haze: ancient ? 0.6 : 0.35 });
  }
  return out;
}

// the Notch's bearing from a place (the sunrises of M3 and M7 rise in it)
export function notchBearing(key) {
  return bearing(ATLAS[key] || [0, 0], FEATURES.notch.at);
}
