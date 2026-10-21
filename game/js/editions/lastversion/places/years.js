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
  // --- Acts II-IV and the Finale (U3) ---------------------------------------------------------------------
  // M9 Northbank, 08:05: the sunbreak, a low gold sun under a lifting rain shelf
  sunbreak: {
    zenith: 0x5a7ea8, horizon: 0xffd9a8, ground: 0x6a6458, glow: 0xffc070, glowK: 0.55,
    sun: 0xffc878, sunSize: 0.0026, sunGlow: 1.5,
    clouds: { cover: 0.62, color: 0xd8c8b8, shade: 0x3a4250, speed: 0.012, scale: 0.9 },
    cirrus: { cover: 0.25, color: 0xffe0b8, shade: 0x8a7a78, speed: 0.02, scale: 2.2 },
  },
  // M9 2026: a clear harbour morning, a sea breeze, high cumulus
  harbourMorning: {
    zenith: 0x5f92d0, horizon: 0xd6e6f2, ground: 0x7a7a70, glow: 0xffffff, glowK: 0.1,
    sun: 0xfff6e0, sunSize: 0.0018, sunGlow: 0.7,
    clouds: { cover: 0.36, color: 0xffffff, shade: 0xa8b8cc, speed: 0.014, scale: 1.3 },
    cirrus: { cover: 0.15, color: 0xffffff, shade: 0xd0dce8, speed: 0.02, scale: 2.6 },
  },
  // M10 2049: night and falling snow over the dam, the moon on the Notch, sodium on the face
  snowNight: {
    zenith: 0x0a1424, horizon: 0x2a3a54, ground: 0x10161e, glow: 0xffb050, glowK: 0.22,
    sun: 0xa8c0e8, sunSize: 0, sunGlow: 0.05, stars: 0.3, moon: 1,
    clouds: { cover: 0.45, color: 0x3a4a64, shade: 0x0e1420, speed: 0.008, scale: 1.1 },
    cirrus: { cover: 0.3, color: 0x4a5a78, shade: 0x1a2234, speed: 0.01, scale: 2.0 },
  },
  // M10 2026: the dam under refurbishment at dusk, the last of the sun behind the gorge
  damDusk: {
    zenith: 0x2a3466, horizon: 0xf09a64, ground: 0x2a2630, glow: 0xff8a4a, glowK: 0.6,
    sun: 0xff9a5a, sunSize: 0.0022, sunGlow: 1.3, stars: 0.12,
    clouds: { cover: 0.3, color: 0xf0a078, shade: 0x4a3a58, speed: 0.005, scale: 1.2 },
    cirrus: { cover: 0.5, color: 0xffb88a, shade: 0x6a4a6a, speed: 0.007, scale: 2.5 },
  },
  // M11 2049: a bright overcast noon, high key
  brightOvercast: {
    zenith: 0xc8d4dc, horizon: 0xeef2f4, ground: 0x9aa8a0, glow: 0xffffff, glowK: 0.2,
    sun: 0xffffff, sunSize: 0, sunGlow: 0.35,
    clouds: { cover: 0.82, color: 0xf6f8fa, shade: 0xb0bcc4, speed: 0.005, scale: 0.9 },
    cirrus: { cover: 0.5, color: 0xffffff, shade: 0xd8e0e4, speed: 0.008, scale: 1.8 },
  },
  // M11 2026: the warm afternoon Mira was admitted
  admissionAfternoon: {
    zenith: 0x5a8ed0, horizon: 0xf4dcb4, ground: 0x8a7a5a, glow: 0xffd8a0, glowK: 0.35,
    sun: 0xffe0a8, sunSize: 0.002, sunGlow: 1.0,
    clouds: { cover: 0.22, color: 0xfff2dc, shade: 0xc8a888, speed: 0.004, scale: 1.4 },
    cirrus: { cover: 0.4, color: 0xffeccc, shade: 0xd0b498, speed: 0.006, scale: 2.8 },
  },
  // M12 2049: sunset and wind over Helix's north roofs
  windSunset: {
    zenith: 0x2a3a7a, horizon: 0xff9a6a, ground: 0x3a2a30, glow: 0xff7a40, glowK: 0.75,
    sun: 0xff8a4a, sunSize: 0.0028, sunGlow: 1.7,
    clouds: { cover: 0.4, color: 0xff9a70, shade: 0x3a2a58, speed: 0.026, scale: 1.0 },
    cirrus: { cover: 0.55, color: 0xffb080, shade: 0x5a3a68, speed: 0.04, scale: 2.2 },
  },
  // M12 2026: dusk into night, a violet sky over sodium work lights
  violetWorklight: {
    zenith: 0x1e1840, horizon: 0x7a5a8a, ground: 0x18141e, glow: 0xffa050, glowK: 0.5,
    sun: 0xb090c8, sunSize: 0, sunGlow: 0.2, stars: 0.35,
    clouds: { cover: 0.2, color: 0x5a4a7a, shade: 0x1e1838, speed: 0.004, scale: 1.2 },
    cirrus: { cover: 0.35, color: 0x8a6a9a, shade: 0x2a2040, speed: 0.006, scale: 2.4 },
  },
  // M12 2196: a green-gold dusk with fireflies
  greenGoldDusk: {
    zenith: 0x3a5a54, horizon: 0xe8d890, ground: 0x3a4a30, glow: 0xffe890, glowK: 0.45,
    sun: 0xffe8a0, sunSize: 0.002, sunGlow: 1.0, stars: 0.1,
    clouds: { cover: 0.28, color: 0xe8e0a0, shade: 0x4a5a48, speed: 0.004, scale: 1.2 },
    cirrus: { cover: 0.3, color: 0xf0e8b0, shade: 0x6a7058, speed: 0.006, scale: 2.4 },
  },
  // M13 2049, the battle: a low sun through smoke, ash in the air
  battleSmoke: {
    zenith: 0x3a2a2a, horizon: 0xff9a5a, ground: 0x2a2020, glow: 0xff7a3a, glowK: 0.85,
    sun: 0xff8a3d, sunSize: 0.0034, sunGlow: 1.4,
    clouds: { cover: 0.74, color: 0x6a4a3e, shade: 0x1e1614, speed: 0.012, scale: 0.8 },
    cirrus: { cover: 0.5, color: 0x8a5a44, shade: 0x2a1c18, speed: 0.018, scale: 1.6 },
  },
  // M13 2026: the working port on a sunny, windy day
  windyPort: {
    zenith: 0x3878c8, horizon: 0xcfe6f4, ground: 0x6a7068, glow: 0xffffff, glowK: 0.06,
    sun: 0xfffaf0, sunSize: 0.0018, sunGlow: 0.6,
    clouds: { cover: 0.44, color: 0xffffff, shade: 0x8aa0bc, speed: 0.034, scale: 1.1 },
    cirrus: { cover: 0.12, color: 0xffffff, shade: 0xc8d8e8, speed: 0.05, scale: 2.6 },
  },
  // M13 2196: a meadow over the port, a soft afternoon
  meadowAfternoon: {
    zenith: 0x7aa4cc, horizon: 0xf0e8c8, ground: 0x8a9050, glow: 0xfff0c0, glowK: 0.25,
    sun: 0xfff0c8, sunSize: 0.0018, sunGlow: 0.8,
    clouds: { cover: 0.3, color: 0xfffaf0, shade: 0xc0c0b0, speed: 0.005, scale: 1.5 },
    cirrus: { cover: 0.25, color: 0xfff8e8, shade: 0xd0d0c0, speed: 0.008, scale: 3.0 },
  },
  // M14 2196: a misty pastel morning, sun shafts between the towers
  pastelMist: {
    zenith: 0x9cc0d4, horizon: 0xf8e8c8, ground: 0x8a9a80, glow: 0xfff0d0, glowK: 0.45,
    sun: 0xfff4dc, sunSize: 0.0022, sunGlow: 1.1,
    clouds: { cover: 0.34, color: 0xfff6ec, shade: 0xc8c0c8, speed: 0.003, scale: 1.2 },
    cirrus: { cover: 0.42, color: 0xfff0e4, shade: 0xd8ccd0, speed: 0.005, scale: 2.6 },
  },
  // M14 2049: the same downtown, dry and busy at midday in light rain
  middayDrizzle: {
    zenith: 0x6a7684, horizon: 0xb4bcc4, ground: 0x4a4e52, glow: 0xd8dce0, glowK: 0.15,
    sun: 0xe8ecf0, sunSize: 0, sunGlow: 0.25,
    clouds: { cover: 0.9, color: 0xa4acb4, shade: 0x5a6068, speed: 0.01, scale: 1.0 },
    cirrus: { cover: 0.5, color: 0xb8c0c8, shade: 0x6a727a, speed: 0.016, scale: 2.0 },
  },
  // M14 2026: half the towers are cranes and frames, a sunny late morning
  craneMorning: {
    zenith: 0x4a8ad8, horizon: 0xe4eef4, ground: 0x7a7a72, glow: 0xffffff, glowK: 0.08,
    sun: 0xffffff, sunSize: 0.002, sunGlow: 0.75,
    clouds: { cover: 0.18, color: 0xffffff, shade: 0xb8c8d8, speed: 0.008, scale: 1.4 },
    cirrus: { cover: 0.55, color: 0xffffff, shade: 0xd8e4ee, speed: 0.012, scale: 3.2 },
  },
  // M15 2196: an eternal, identical late morning in pale gold and lilac
  lilacMorning: {
    zenith: 0xb4acd8, horizon: 0xfff0d0, ground: 0x9a8a8a, glow: 0xffe8c8, glowK: 0.4,
    sun: 0xfff0d8, sunSize: 0.002, sunGlow: 0.9,
    clouds: { cover: 0.26, color: 0xf8eef8, shade: 0xb8a8c8, speed: 0.002, scale: 1.4 },
    cirrus: { cover: 0.46, color: 0xfff0f0, shade: 0xc8b8d0, speed: 0.003, scale: 2.8 },
  },
  // M15 2026: match day, an evening under floodlights
  floodlitEvening: {
    zenith: 0x0e1430, horizon: 0x4a4a7a, ground: 0x14161e, glow: 0xe8f0ff, glowK: 0.7,
    sun: 0x8a90c0, sunSize: 0, sunGlow: 0.1, stars: 0.15,
    clouds: { cover: 0.25, color: 0x3a3a5a, shade: 0x101424, speed: 0.004, scale: 1.2 },
    cirrus: { cover: 0.2, color: 0x5a5a7a, shade: 0x1a1c2c, speed: 0.006, scale: 2.4 },
  },
  // M15 2049: the day after the Zero Second, rain over the evacuation tents
  tentRain: {
    zenith: 0x48525e, horizon: 0x8e969c, ground: 0x3a3c3a, glow: 0x9aa4a8, glowK: 0.1,
    sun: 0xc8ccd0, sunSize: 0, sunGlow: 0.1,
    clouds: { cover: 1.0, color: 0x7a8288, shade: 0x343a42, speed: 0.014, scale: 0.8 },
    cirrus: { cover: 0.7, color: 0x8a9298, shade: 0x4a5056, speed: 0.02, scale: 1.6 },
  },
  // M16 2196: dusk in the quarry, the rim golden and the depths blue
  quarryDusk: {
    zenith: 0x223868, horizon: 0xffb878, ground: 0x1a2030, glow: 0xffa860, glowK: 0.6,
    sun: 0xffb070, sunSize: 0.0024, sunGlow: 1.4, stars: 0.18,
    clouds: { cover: 0.2, color: 0xffa880, shade: 0x2a2a50, speed: 0.003, scale: 1.3 },
    cirrus: { cover: 0.4, color: 0xffc090, shade: 0x4a3a60, speed: 0.005, scale: 2.6 },
  },
  // M16 2026: the quarry working at noon, dust in the air
  dustNoon: {
    zenith: 0x9ab0c0, horizon: 0xe8dcc0, ground: 0xa89878, glow: 0xfff0d0, glowK: 0.2,
    sun: 0xfffaf0, sunSize: 0.002, sunGlow: 0.6,
    clouds: { cover: 0.1, color: 0xf8f4ec, shade: 0xd0c8b8, speed: 0.004, scale: 1.4 },
    cirrus: { cover: 0.7, color: 0xf0e8d8, shade: 0xd8ccb4, speed: 0.006, scale: 2.0 },
  },
  // M16 2049: the flooded quarry lake under a cool grey morning
  lakeGrey: {
    zenith: 0x7890a4, horizon: 0xc4d0d6, ground: 0x4a5a60, glow: 0xdce4e8, glowK: 0.15,
    sun: 0xe8eef4, sunSize: 0.0012, sunGlow: 0.3,
    clouds: { cover: 0.7, color: 0xc8d4dc, shade: 0x6a7a88, speed: 0.006, scale: 1.0 },
    cirrus: { cover: 0.4, color: 0xd8e0e8, shade: 0x8a98a4, speed: 0.008, scale: 2.0 },
  },
  // M17 2049: a cold clear desert night and the Milky Way
  milkyWay: {
    zenith: 0x0c1228, horizon: 0x2a3a6a, ground: 0x0e1018, glow: 0x4a5a8a, glowK: 0.2,
    sun: 0x8a9ac8, sunSize: 0, sunGlow: 0, stars: 1.2, milky: 1,
    clouds: { cover: 0.05, color: 0x2a3454, shade: 0x0a0e1c, speed: 0.002, scale: 1.2 },
    cirrus: { cover: 0.08, color: 0x3a4468, shade: 0x141a2c, speed: 0.003, scale: 2.4 },
  },
  // M17 2026: the array under construction in blazing afternoon heat
  heatHaze: {
    zenith: 0x5a84c0, horizon: 0xf2dcaa, ground: 0xb0905a, glow: 0xfff4d0, glowK: 0.3,
    sun: 0xfff8e0, sunSize: 0.0024, sunGlow: 0.9,
    clouds: { cover: 0.04, color: 0xffffff, shade: 0xe0d0b0, speed: 0.002, scale: 1.4 },
    cirrus: { cover: 0.2, color: 0xfff8e8, shade: 0xe8d8c0, speed: 0.004, scale: 3.0 },
  },
  // M17 2196: dawn over drifted sand, wind
  sandDawn: {
    zenith: 0x40507e, horizon: 0xf2b48a, ground: 0x5a4a44, glow: 0xff9a6a, glowK: 0.55,
    sun: 0xffb080, sunSize: 0.0026, sunGlow: 1.3, stars: 0.15,
    clouds: { cover: 0.15, color: 0xf0a888, shade: 0x5a4a68, speed: 0.02, scale: 1.2 },
    cirrus: { cover: 0.5, color: 0xffc0a0, shade: 0x7a5a70, speed: 0.035, scale: 2.2 },
  },
  // M18: the storm of times, the same storm over three years of land (its bands and wall: Sky features)
  storm2196: {
    zenith: 0x2e2a3e, horizon: 0x9a7a7e, ground: 0x2a2428, glow: 0xff8a6a, glowK: 0.5,
    sun: 0xffc0a0, sunSize: 0.0016, sunGlow: 0.8, stars: 0.3,
    clouds: { cover: 0.66, color: 0x6a5a6a, shade: 0x1e1822, speed: 0.03, scale: 0.8 },
    cirrus: { cover: 0.6, color: 0x8a6a78, shade: 0x2e2430, speed: 0.05, scale: 1.6 },
    lightning: true, flash: 0xff9a80,
  },
  storm2026: {
    zenith: 0x34403a, horizon: 0xb8a878, ground: 0x2a3028, glow: 0xffd88a, glowK: 0.45,
    sun: 0xfff0b0, sunSize: 0.0018, sunGlow: 0.9, stars: 0.2,
    clouds: { cover: 0.6, color: 0x6a7058, shade: 0x1e221c, speed: 0.028, scale: 0.85 },
    cirrus: { cover: 0.55, color: 0x8a8a68, shade: 0x2a2c22, speed: 0.045, scale: 1.6 },
    lightning: true, flash: 0xfff0a0,
  },
  storm2049: {
    zenith: 0x1a2236, horizon: 0x5a6a8a, ground: 0x161a22, glow: 0x8aa8ff, glowK: 0.4,
    sun: 0xb8c8ff, sunSize: 0, sunGlow: 0.3, stars: 0.35,
    clouds: { cover: 0.78, color: 0x3a4660, shade: 0x0e121c, speed: 0.034, scale: 0.8 },
    cirrus: { cover: 0.6, color: 0x4a5878, shade: 0x161c2a, speed: 0.05, scale: 1.6 },
    lightning: true, flash: 0xa8c0ff,
  },
  // M19: the place outside time, high-key white-violet with no sun disc; each year tints the mirror
  whiteViolet: {
    zenith: 0xd8d0f0, horizon: 0xf6f2ff, ground: 0xe8e4f4, glow: 0xffffff, glowK: 0.3,
    sun: 0xffffff, sunSize: 0, sunGlow: 0.15,
    clouds: { cover: 0.12, color: 0xffffff, shade: 0xd8d0ec, speed: 0.002, scale: 1.6 },
    cirrus: { cover: 0.3, color: 0xffffff, shade: 0xe0d8f0, speed: 0.003, scale: 3.0 },
  },
  whiteRose: {
    zenith: 0xe8c8d8, horizon: 0xfff4f0, ground: 0xf0e0e4, glow: 0xffffff, glowK: 0.3,
    sun: 0xffffff, sunSize: 0, sunGlow: 0.15,
    clouds: { cover: 0.12, color: 0xffffff, shade: 0xecd4dc, speed: 0.002, scale: 1.6 },
    cirrus: { cover: 0.3, color: 0xffffff, shade: 0xf0dce4, speed: 0.003, scale: 3.0 },
  },
  whiteMint: {
    zenith: 0xc4e4dc, horizon: 0xf2fff8, ground: 0xe0f0ea, glow: 0xffffff, glowK: 0.3,
    sun: 0xffffff, sunSize: 0, sunGlow: 0.15,
    clouds: { cover: 0.12, color: 0xffffff, shade: 0xd0ece4, speed: 0.002, scale: 1.6 },
    cirrus: { cover: 0.3, color: 0xffffff, shade: 0xdcf0ea, speed: 0.003, scale: 3.0 },
  },
  // M20, Mira's memory, a watercolour wash. THE BLUE DOOR: a golden, overexposed summer evening
  overexposedSummer: {
    zenith: 0xf0c890, horizon: 0xfff6e4, ground: 0xc8a878, glow: 0xffe0a0, glowK: 0.7,
    sun: 0xfff0c8, sunSize: 0.004, sunGlow: 1.8,
    clouds: { cover: 0.2, color: 0xfff4e0, shade: 0xe8c8a0, speed: 0.003, scale: 1.0 },
    cirrus: { cover: 0.3, color: 0xfff8ec, shade: 0xf0d4b0, speed: 0.004, scale: 2.2 },
  },
  // THE FIRST EXPERIMENT: a white void, cold, only the remembered things in colour
  coldVoid: {
    zenith: 0xb8c4cc, horizon: 0xf4f6f8, ground: 0xd8dce0, glow: 0xe8f4ff, glowK: 0.4,
    sun: 0xf4f8ff, sunSize: 0, sunGlow: 0.2,
    clouds: { cover: 0.0, color: 0xffffff, shade: 0xe0e4e8, speed: 0.0, scale: 1.0 },
    cirrus: { cover: 0.15, color: 0xffffff, shade: 0xe4e8ec, speed: 0.0, scale: 2.0 },
  },
  // THE WORLD WITHOUT KAI: adult Mira's seaside garden in morning light
  seaMorning: {
    zenith: 0x78b4e8, horizon: 0xeef6f4, ground: 0x7a9a7a, glow: 0xfffaf0, glowK: 0.3,
    sun: 0xfff8ec, sunSize: 0.002, sunGlow: 0.9,
    clouds: { cover: 0.24, color: 0xffffff, shade: 0xc0d0e0, speed: 0.006, scale: 1.3 },
    cirrus: { cover: 0.2, color: 0xffffff, shade: 0xd8e4ec, speed: 0.008, scale: 2.8 },
  },
  // M21 2049: hard noon above the clouds (the cloud sea itself: a Sky feature)
  aboveClouds: {
    zenith: 0x14306e, horizon: 0xc8e0ff, ground: 0xf0f4f8, glow: 0xffffff, glowK: 0.25,
    sun: 0xffffff, sunSize: 0.0016, sunGlow: 0.8,
    clouds: { cover: 0.0, color: 0xffffff, shade: 0xc8d8f0, speed: 0.0, scale: 1.0 },
    cirrus: { cover: 0.22, color: 0xffffff, shade: 0xd0e0f8, speed: 0.01, scale: 3.4 },
  },
  // M21 2026: the tower roof at the cloud line, a bright grey morning
  cloudLine: {
    zenith: 0x6a88ac, horizon: 0xd4dce4, ground: 0xb8c4cc, glow: 0xf0f4f8, glowK: 0.3,
    sun: 0xf4f8ff, sunSize: 0.0014, sunGlow: 0.5,
    clouds: { cover: 0.55, color: 0xe8eef4, shade: 0x8a9cb0, speed: 0.012, scale: 0.9 },
    cirrus: { cover: 0.4, color: 0xf0f4f8, shade: 0xa8b8c8, speed: 0.016, scale: 2.0 },
  },
  // M21 2196: the ruin at a blue dusk, frost on the glass
  frostDusk: {
    zenith: 0x141e44, horizon: 0x6a7cb0, ground: 0x2a3450, glow: 0x9ab0e8, glowK: 0.35,
    sun: 0xa8b8e8, sunSize: 0.001, sunGlow: 0.4, stars: 0.4,
    clouds: { cover: 0.1, color: 0x4a5a8a, shade: 0x141c38, speed: 0.004, scale: 1.2 },
    cirrus: { cover: 0.3, color: 0x6a7aa8, shade: 0x1e2848, speed: 0.006, scale: 2.4 },
  },
  // M22, the First Second, under an eclipsed black sun; the sky cut into wedges like a clock face (Sky features)
  eclipse2026: {
    zenith: 0x1a1428, horizon: 0xb08a6a, ground: 0x1a1618, glow: 0xffc890, glowK: 0.5,
    sun: 0xffe8c0, sunSize: 0, sunGlow: 0.6, stars: 0.6,
    clouds: { cover: 0.1, color: 0x5a4a5a, shade: 0x1a1420, speed: 0.002, scale: 1.2 },
    cirrus: { cover: 0.2, color: 0x7a6a78, shade: 0x2a2230, speed: 0.003, scale: 2.4 },
  },
  eclipse2049: {
    zenith: 0x0e1424, horizon: 0x6a7a9a, ground: 0x10141c, glow: 0xa8c0ff, glowK: 0.5,
    sun: 0xe0e8ff, sunSize: 0, sunGlow: 0.6, stars: 0.7,
    clouds: { cover: 0.1, color: 0x3a4a64, shade: 0x0e121e, speed: 0.002, scale: 1.2 },
    cirrus: { cover: 0.2, color: 0x4a5a78, shade: 0x161c2c, speed: 0.003, scale: 2.4 },
  },
  eclipse2196: {
    zenith: 0x12201c, horizon: 0x7a9a80, ground: 0x101814, glow: 0xc8ffd8, glowK: 0.5,
    sun: 0xe8fff0, sunSize: 0, sunGlow: 0.6, stars: 0.6,
    clouds: { cover: 0.1, color: 0x3a5a4a, shade: 0x0e1a14, speed: 0.002, scale: 1.2 },
    cirrus: { cover: 0.2, color: 0x4a6a5a, shade: 0x14221c, speed: 0.003, scale: 2.4 },
  },
  // M23 AFTERZERO: the route's light, from the M1 quotation's night rain to the first true sunrise in the Notch
  routeNightRain: {
    zenith: 0x10161e, horizon: 0x3a4250, ground: 0x12161c, glow: 0xffb070, glowK: 0.4,
    sun: 0x9aa8c8, sunSize: 0, sunGlow: 0,
    clouds: { cover: 0.96, color: 0x2e3644, shade: 0x0c1016, speed: 0.02, scale: 0.9 },
    cirrus: { cover: 0.6, color: 0x3a4250, shade: 0x141820, speed: 0.03, scale: 1.8 },
  },
  routeDusk: {
    zenith: 0x3a3a6a, horizon: 0xffa878, ground: 0x2a2428, glow: 0xff9a5a, glowK: 0.6,
    sun: 0xffa060, sunSize: 0.0024, sunGlow: 1.3, stars: 0.1,
    clouds: { cover: 0.35, color: 0xe89a80, shade: 0x3a2e48, speed: 0.006, scale: 1.1 },
    cirrus: { cover: 0.45, color: 0xffb890, shade: 0x5a4060, speed: 0.008, scale: 2.4 },
  },
  routePreDawn: {
    zenith: 0x10183a, horizon: 0x6a7ab0, ground: 0x141828, glow: 0xa0b4e8, glowK: 0.35,
    sun: 0xb8c8f0, sunSize: 0, sunGlow: 0.25, stars: 0.6, moon: 0.3,
    clouds: { cover: 0.15, color: 0x3a4a78, shade: 0x101830, speed: 0.003, scale: 1.2 },
    cirrus: { cover: 0.25, color: 0x5a6a98, shade: 0x1e2848, speed: 0.004, scale: 2.4 },
  },
  firstSunrise: {
    zenith: 0x3a5aa0, horizon: 0xffc888, ground: 0x3a3440, glow: 0xffb070, glowK: 0.8,
    sun: 0xffc080, sunSize: 0.003, sunGlow: 1.8,
    clouds: { cover: 0.18, color: 0xffb890, shade: 0x5a4a6a, speed: 0.004, scale: 1.2 },
    cirrus: { cover: 0.4, color: 0xffd0a8, shade: 0x7a5a78, speed: 0.006, scale: 2.4 },
  },
  // the three ending skies: an ordinary clear morning (A), panes of different skies (B: the wedge feature), one warm light (C)
  endingClear: {
    zenith: 0x5a9ae0, horizon: 0xe4f0f8, ground: 0x7a8a6a, glow: 0xffffff, glowK: 0.1,
    sun: 0xfffaf0, sunSize: 0.002, sunGlow: 0.8,
    clouds: { cover: 0.2, color: 0xffffff, shade: 0xb8c8d8, speed: 0.006, scale: 1.3 },
    cirrus: { cover: 0.2, color: 0xffffff, shade: 0xd8e4ec, speed: 0.008, scale: 2.8 },
  },
  endingPanes: {
    zenith: 0x4a5a8a, horizon: 0xd8b8a0, ground: 0x3a3a40, glow: 0xffc890, glowK: 0.4,
    sun: 0xffe0b0, sunSize: 0.002, sunGlow: 0.9, stars: 0.4,
    clouds: { cover: 0.3, color: 0xc8b0a8, shade: 0x3a3448, speed: 0.01, scale: 1.0 },
    cirrus: { cover: 0.3, color: 0xe0c8b8, shade: 0x5a4a58, speed: 0.012, scale: 2.0 },
  },
  endingWarm: {
    zenith: 0xe8b890, horizon: 0xfff0d8, ground: 0xb89a7a, glow: 0xffd8a0, glowK: 0.9,
    sun: 0xffe8c0, sunSize: 0.003, sunGlow: 2.0,
    clouds: { cover: 0.1, color: 0xfff0e0, shade: 0xe0c0a0, speed: 0.002, scale: 1.2 },
    cirrus: { cover: 0.2, color: 0xfff4e8, shade: 0xe8ccb0, speed: 0.003, scale: 2.4 },
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
