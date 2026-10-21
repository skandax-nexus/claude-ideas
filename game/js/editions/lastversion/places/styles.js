// THE LAST VERSION OF EARTH: one style per place (OVERHAUL.md §4.3). A style names the place's
// materials (keys of places/materials.js), its facade tints, its vegetation (at most six kinds),
// its record kits (what a record, a residue, a fragment and a scene look like here: never a
// Station Zero terminal) and the palette DeckWorld's own few pieces (doors, the train) are lit by.
// No style is a Vessel look: `palette.look` is never set.

const pal = (o) => ({ wall: '#8a8a8a', floor: '#5a5a5a', accent: 0xffc06a, accent2: 0x9fd8ff, light: 0xffe0b0, tint: 0xffffff, night: 0, weather: null, probe: false, ...o });

export const STYLES = {
  // Rain City South, 2049: brick-and-glass mid-rises, lit shopfronts, wet asphalt, tram wires
  rain2049: {
    ground: 'asphalt', walk: 'pavement', facade: 'rainBrick', tower: 'rainGlass', roof: 'roofDark', trim: 'steel', base: 'concrete',
    tints: [0xb06a52, 0x9a5a48, 0xc89a7a, 0x8a7a70, 0xd8c8b0, 0x7a5040, 0xa8a49c],
    veg: ['plane', 'shrub', 'flowers'], kits: { record: 'phoneBooth', residue: 'adBoard', fragment: 'newsBox', scene: null },
    palette: pal({ fog: 0x6f7c8c, wall: '#5a6470', floor: '#3a4048', accent: 0xffc06a, accent2: 0x9fd8ff, light: 0xffe0b0, tint: 0x6a7890, night: 0.45, weather: 'rain', sky: 'night' }),
  },
  // Helix Temporal Research: white composite panels, brushed steel, glass, black rubber floors
  helix: {
    ground: 'stoneWet', walk: 'terrazzo', facade: 'helixPanel', tower: 'helixGlass', roof: 'roofLight', trim: 'steel', base: 'helixWhite',
    floor: 'rubber', wall: 'helixWhite', ceil: 'helixCeil',
    tints: [0xffffff, 0xf2f4f6, 0xe8ecf0],
    veg: ['linden', 'shrub', 'ivy', 'grass'], kits: { record: 'lectern', residue: 'glassCase', fragment: 'badge', scene: null },
    palette: pal({ fog: 0x2a2f3a, wall: '#e8ecf0', floor: '#202428', accent: 0xff6a48, accent2: 0x9fd8ff, light: 0xffb0a0, tint: 0xffffff, night: 0.6, weather: 'rain', sky: 'night' }),
  },
  // the Ring Hill 3,000 years ago: stone footings, timber walls, conical thatch, dry-stone terraces
  settlement: {
    ground: 'meadow', walk: 'dirt', facade: 'drystone', roof: 'thatch', trim: 'timber', base: 'drystone',
    tints: [0xffffff, 0xf0e4d0, 0xe0d4c0],
    veg: ['cypress', 'olive', 'grass', 'barley', 'flowers'], kits: { record: 'tellingStone', residue: 'stele', fragment: 'carvedStone', scene: 'altar' },
    palette: pal({ fog: 0xd8c8a8, wall: '#8a7a62', floor: '#5a5444', accent: 0xffb060, accent2: 0x7fd8c8, light: 0xffd9a0, tint: 0xc8a878, night: 0.1, weather: 'pollen', sky: 'dusk' }),
  },
  // the village at the river bend: whitewash and stilts, jetties, the river, the gorge
  river: {
    ground: 'meadow', walk: 'mud', facade: 'whitewash', roof: 'reedThatch', trim: 'timber', base: 'riverStone',
    tints: [0xffffff, 0xf4ecdc, 0xe8dcc8],
    veg: ['reeds', 'willow', 'grass', 'fern'], kits: { record: 'tellingStone', residue: 'muralPanel', fragment: 'riverStone', scene: 'sluice' },
    palette: pal({ fog: 0xb8c8c8, wall: '#9a8a72', floor: '#5a5444', accent: 0x7fd8c8, accent2: 0xffc06a, light: 0xffe8c0, tint: 0xc8d0c8, night: 0.05, weather: null, sky: 'dusk' }),
  },
  // Old Town on the river terraces: a stone canal, humpback bridges, plane trees, slate roofs
  oldtown: {
    ground: 'cobbles', walk: 'flagstone', facade: 'townhouse', roof: 'slate', trim: 'ironDark', base: 'limestone',
    tints: [0xf2e2c4, 0xe8c89a, 0xd8d4c8, 0xc8a890, 0xe0d0b8, 0xb8c0b8],
    veg: ['plane', 'ivy', 'blossom', 'shrub'], kits: { record: 'ledger', residue: 'clockCase', fragment: 'brassPlate', scene: 'escapement' },
    palette: pal({ fog: 0xc8b8a0, wall: '#8a7a6a', floor: '#5a5048', accent: 0xffb020, accent2: 0x9fd8ff, light: 0xffc890, tint: 0xffe0c0, night: 0.2, weather: 'motes', sky: 'dusk' }),
  },
  // the Broken Observatory on the Ridge: stepped stone, bronze rings, astronomers' flat roofs
  observatory: {
    ground: 'ridgeGrass', walk: 'sandstone', facade: 'sandstone', roof: 'sandstone', trim: 'bronze', base: 'basalt',
    tints: [0xffffff, 0xf0e0c8, 0xe0d0b8],
    veg: ['grass', 'cypress', 'shrub'], kits: { record: 'bronzePlate', residue: 'datesRing', fragment: 'bronzeShard', scene: null },
    palette: pal({ fog: 0x8a90a8, wall: '#7a6a52', floor: '#5a4c3a', accent: 0xffc06a, accent2: 0x9fc8ff, light: 0xffd6a0, tint: 0xffe8c8, night: 0.3, weather: null, sky: 'dusk' }),
  },
};
