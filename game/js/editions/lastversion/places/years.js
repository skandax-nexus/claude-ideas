// THE LAST VERSION OF EARTH: skies and years (OVERHAUL.md §4.5).
//
// A sky preset is what Sky.js paints: the gradient, the sun disc and its glow, the moon and the
// stars, two cloud layers and the city glow on the horizon. A place's year names its preset and
// adds the light the engine uses: the hour, the sun's elevation and bearing, the fog, the night,
// the weather, the colour grade, the image-based light, the hemisphere and the sun's colour.
// Everything here is pure data, so the unit tests can check every year of every place.

// cloud layer: cover 0..1, colour, shade (the underside), speed (texture units a second), scale
export const SKIES = {
  // M1 Rain City, 08:14: a dark overcast morning, fast low cloud, the sun hidden ESE
  rainMorning: {
    zenith: 0x2e3a4a, horizon: 0x7d8a99, ground: 0x3a4048, glow: 0x8a8070, glowK: 0.18,
    sun: 0xd8dce4, sunSize: 0, sunGlow: 0.12,
    clouds: { cover: 0.95, color: 0x8a96a4, shade: 0x2f3946, speed: 0.016, scale: 1.0 },
    cirrus: { cover: 0.55, color: 0x9aa6b2, shade: 0x55606c, speed: 0.03, scale: 2.2 },
  },
  // M1 "8:13", the flicker: lighter rain, one low sunbreak in the east
  rainSunbreak: {
    zenith: 0x3e4c60, horizon: 0xa8a49a, ground: 0x464c54, glow: 0xffc890, glowK: 0.35,
    sun: 0xffd6a0, sunSize: 0.0016, sunGlow: 0.9,
    clouds: { cover: 0.78, color: 0xb4b8bc, shade: 0x46505c, speed: 0.012, scale: 1.0 },
    cirrus: { cover: 0.4, color: 0xd8c8b0, shade: 0x7a7470, speed: 0.025, scale: 2.0 },
  },
  // M2 Helix in the storm, at night: lightning, a sodium city glow under the cloud
  stormNight: {
    zenith: 0x0b0f16, horizon: 0x2a2f3a, ground: 0x0e1014, glow: 0x3a2a20, glowK: 0.6,
    sun: 0x9aa8c8, sunSize: 0, sunGlow: 0,
    clouds: { cover: 1.0, color: 0x262c38, shade: 0x0a0d12, speed: 0.022, scale: 0.9 },
    cirrus: { cover: 0.7, color: 0x3a3440, shade: 0x14161c, speed: 0.04, scale: 1.8 },
    lightning: true,
  },
  // M3 2049: the cold washed dawn after the storm; the sun rises in the Notch
  washedDawn: {
    zenith: 0x6a8cc0, horizon: 0xe8d8c8, ground: 0x6a7480, glow: 0xffd0a0, glowK: 0.3,
    sun: 0xffcf9a, sunSize: 0.0022, sunGlow: 1.1,
    clouds: { cover: 0.35, color: 0xf2e0d0, shade: 0x8a90a8, speed: 0.006, scale: 1.2 },
    cirrus: { cover: 0.5, color: 0xffd8b8, shade: 0xb0a4b4, speed: 0.01, scale: 2.4 },
  },
  // M3 2026: a harsh hazy noon, white sun high
  hazyNoon: {
    zenith: 0x9cb4c8, horizon: 0xdfe6ea, ground: 0x9a9890, glow: 0xffffff, glowK: 0.1,
    sun: 0xffffff, sunSize: 0.0018, sunGlow: 0.7,
    clouds: { cover: 0.2, color: 0xf4f4f0, shade: 0xc0c4c8, speed: 0.004, scale: 1.4 },
    cirrus: { cover: 0.62, color: 0xf0f2f2, shade: 0xd0d4d6, speed: 0.006, scale: 2.8 },
  },
  // M3 2196: a misty green dawn
  mistGreenDawn: {
    zenith: 0x8fae9e, horizon: 0xd6e8d2, ground: 0x7a8c78, glow: 0xe6ffe8, glowK: 0.35,
    sun: 0xe6ffe8, sunSize: 0.002, sunGlow: 0.8,
    clouds: { cover: 0.5, color: 0xe4efe0, shade: 0x9ab0a0, speed: 0.004, scale: 1.1 },
    cirrus: { cover: 0.3, color: 0xf0fff0, shade: 0xb8c8b8, speed: 0.008, scale: 2.0 },
  },
  // M4 THE VILLAGE: golden late afternoon, cirrus, the sun 14° in the west
  goldenAfternoon: {
    zenith: 0x6a9ad0, horizon: 0xf6d7a8, ground: 0x8a7a5a, glow: 0xffc070, glowK: 0.4,
    sun: 0xffb870, sunSize: 0.0024, sunGlow: 1.2,
    clouds: { cover: 0.18, color: 0xfff0d8, shade: 0xc89a78, speed: 0.004, scale: 1.3 },
    cirrus: { cover: 0.66, color: 0xffe4c0, shade: 0xd8a888, speed: 0.007, scale: 2.6 },
  },
  // M4 BEFORE THE FIRE: blue pre-dawn, the last stars, valley mist
  blueDawn: {
    zenith: 0x14203c, horizon: 0x8a9cb8, ground: 0x2a3446, glow: 0xb8c4e0, glowK: 0.25,
    sun: 0xc8d4f0, sunSize: 0, sunGlow: 0.25, stars: 0.8, moon: 0.4,
    clouds: { cover: 0.12, color: 0x6a7a98, shade: 0x2a3450, speed: 0.003, scale: 1.2 },
    cirrus: { cover: 0.22, color: 0x9aa8c4, shade: 0x4a5670, speed: 0.004, scale: 2.4 },
  },
  // M5 THRIVING: bright clear midday
  clearMidday: {
    zenith: 0x4f8fd8, horizon: 0xd8ecf8, ground: 0x7a8a5a, glow: 0xffffff, glowK: 0.08,
    sun: 0xfff8e8, sunSize: 0.0018, sunGlow: 0.6,
    clouds: { cover: 0.32, color: 0xffffff, shade: 0xb8c8d8, speed: 0.006, scale: 1.0 },
    cirrus: { cover: 0.1, color: 0xffffff, shade: 0xd0dce8, speed: 0.008, scale: 2.6 },
  },
  // M5 ABANDONED: flat grey overcast afternoon, drizzle mist
  greyOvercast: {
    zenith: 0x8a9094, horizon: 0xa4aaae, ground: 0x6a6e6a, glow: 0xb0b4b4, glowK: 0.05,
    sun: 0xd8dcdc, sunSize: 0, sunGlow: 0.1,
    clouds: { cover: 1.0, color: 0xa2a8ac, shade: 0x6e7478, speed: 0.005, scale: 0.8 },
    cirrus: { cover: 0.6, color: 0xb4b8bc, shade: 0x80868a, speed: 0.008, scale: 1.6 },
  },
  // M5 FLOODED: a low heavy teal sky with sun shafts
  tealLowSky: {
    zenith: 0x3e6a6c, horizon: 0x9fd8c8, ground: 0x2e4a48, glow: 0xc8fff0, glowK: 0.4,
    sun: 0xd8fff0, sunSize: 0.0012, sunGlow: 0.9,
    clouds: { cover: 0.84, color: 0x7ab0aa, shade: 0x274442, speed: 0.008, scale: 0.85 },
    cirrus: { cover: 0.3, color: 0xa8e0d4, shade: 0x5a8a86, speed: 0.012, scale: 1.8 },
  },
  // M6 2049: autumn, late afternoon into evening
  autumnEvening: {
    zenith: 0x7aa0c8, horizon: 0xf0c890, ground: 0x6a5a4a, glow: 0xf0a860, glowK: 0.45,
    sun: 0xf0a860, sunSize: 0.0022, sunGlow: 1.1,
    clouds: { cover: 0.42, color: 0xf8d0a8, shade: 0x8a7078, speed: 0.008, scale: 1.1 },
    cirrus: { cover: 0.35, color: 0xffd8b0, shade: 0xb08878, speed: 0.012, scale: 2.2 },
  },
  // M6 2026: a soft spring morning
  springMorning: {
    zenith: 0x9cc0e0, horizon: 0xf4ead8, ground: 0x8a8a70, glow: 0xfff0d8, glowK: 0.25,
    sun: 0xfff2dc, sunSize: 0.0018, sunGlow: 0.7,
    clouds: { cover: 0.28, color: 0xffffff, shade: 0xc8ccd4, speed: 0.005, scale: 1.2 },
    cirrus: { cover: 0.2, color: 0xfff8f0, shade: 0xd8d8dc, speed: 0.007, scale: 2.4 },
  },
  // M6 2196: winter, frost fog over an iced canal
  winterFrost: {
    zenith: 0x9aa8b8, horizon: 0xd0d8e0, ground: 0xb8c0c8, glow: 0xe8f0ff, glowK: 0.15,
    sun: 0xf0f4ff, sunSize: 0.0012, sunGlow: 0.35,
    clouds: { cover: 0.9, color: 0xd8e0e8, shade: 0x8a94a0, speed: 0.003, scale: 0.9 },
    cirrus: { cover: 0.4, color: 0xe8eef4, shade: 0xa8b0bc, speed: 0.005, scale: 1.6 },
  },
  // M7 THE FIRST SKY: sunrise exactly in the Notch
  notchSunrise: {
    zenith: 0x2a3a6a, horizon: 0xffb07a, ground: 0x3a3440, glow: 0xff9a5a, glowK: 0.7,
    sun: 0xffb070, sunSize: 0.0026, sunGlow: 1.6, stars: 0.25,
    clouds: { cover: 0.22, color: 0xffa878, shade: 0x5a4a6a, speed: 0.004, scale: 1.2 },
    cirrus: { cover: 0.45, color: 0xffc89a, shade: 0x7a5a78, speed: 0.006, scale: 2.4 },
  },
  // M7 2049: blue hour, one bright star and a thin moon
  blueHour: {
    zenith: 0x101c40, horizon: 0x5070a0, ground: 0x1a2232, glow: 0x6a88c0, glowK: 0.3,
    sun: 0x8aa0d0, sunSize: 0, sunGlow: 0.15, stars: 0.35, moon: 0.9, star: 1,
    clouds: { cover: 0.15, color: 0x3a4a78, shade: 0x141c34, speed: 0.003, scale: 1.2 },
    cirrus: { cover: 0.18, color: 0x5a6a98, shade: 0x2a3454, speed: 0.004, scale: 2.4 },
  },
  // M7 2196: a golden windy afternoon, and a new star: the Fracture's light
  windyGold: {
    zenith: 0x5a8ac8, horizon: 0xf2d49a, ground: 0x8a7a50, glow: 0xffd890, glowK: 0.35,
    sun: 0xffd890, sunSize: 0.002, sunGlow: 1.0, star: 1,
    clouds: { cover: 0.48, color: 0xfff0d0, shade: 0xa08878, speed: 0.03, scale: 1.0 },
    cirrus: { cover: 0.3, color: 0xffeccc, shade: 0xc0a080, speed: 0.05, scale: 2.0 },
  },
  // M8 VERSION 17: a still, grey-violet pre-storm afternoon; no wind at all
  stillViolet: {
    zenith: 0x8a8ea0, horizon: 0xc8c4d0, ground: 0x6a6870, glow: 0xd8d0e0, glowK: 0.12,
    sun: 0xe8e0f0, sunSize: 0.001, sunGlow: 0.3,
    clouds: { cover: 0.72, color: 0xbcb8c8, shade: 0x6a6878, speed: 0, scale: 1.0 },
    cirrus: { cover: 0.5, color: 0xd0ccd8, shade: 0x8a8898, speed: 0, scale: 2.2 },
  },
  // M8 2026 (this version): warm light over a young garden
  warmGarden: {
    zenith: 0x7aa8d8, horizon: 0xf0dcc0, ground: 0x8a8060, glow: 0xffe0b0, glowK: 0.3,
    sun: 0xffe2b0, sunSize: 0.002, sunGlow: 0.9,
    clouds: { cover: 0.25, color: 0xfff4e4, shade: 0xc0b0a0, speed: 0.005, scale: 1.2 },
    cirrus: { cover: 0.3, color: 0xfff0dc, shade: 0xd0c0b0, speed: 0.007, scale: 2.4 },
  },
};

// the hour, in buckets, for the uniqueness signature (§4.8)
export function hourBucket(h) {
  if (h < 5 || h >= 21) return 'night';
  if (h < 7.5) return 'dawn';
  if (h < 11) return 'morning';
  if (h < 14) return 'noon';
  if (h < 17.5) return 'afternoon';
  return 'evening';
}

// the sun's direction in a place's frame (x east, y up, z south): elevation and compass bearing in degrees
export function sunVector({ elev = 30, az = 140 } = {}) {
  const e = (elev * Math.PI) / 180, a = (az * Math.PI) / 180;
  return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)];
}

const BASE_DENSITY = 0.0058; // FogExp2 density of a year with density 1

// what main.js's lights take from a year (edition.themeFor)
export function themeOf(y) {
  const night = y.night ?? 0;
  return {
    fog: y.fog, sky: y.hemi?.sky ?? SKIES[y.sky]?.zenith ?? 0xffffff, ground: y.hemi?.ground ?? SKIES[y.sky]?.ground ?? 0x808080,
    hemi: y.hemi?.k ?? 0.75, sun: (y.sunK ?? 1) * 2.4, sunColor: y.sunColor ?? SKIES[y.sky]?.sun ?? 0xffffff,
    density: (BASE_DENSITY * (y.density ?? 1)) / 0.3, device: y.device ?? 0x4f9fe8, night,
  };
}

// a year with its defaults filled in
export function year(y) {
  return { night: 0, density: 1, weather: null, ibl: 'dusk', lit: y.night ?? 0, grade: {}, ...y };
}
