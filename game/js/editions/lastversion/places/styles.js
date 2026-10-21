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
  // --- Acts II-IV and the Finale (U3) -------------------------------------------------------------------
  // Northbank, Rain City North's hill quarter: pale limestone and brick terraces, slate and copper roofs, stair-streets
  northbank: {
    ground: 'limestonePave', walk: 'stairStone', facade: 'stoneFacade', roof: 'copperRoof', trim: 'ironDark', base: 'limestoneBlock',
    tints: [0xffffff, 0xf4ece0, 0xe8dccc, 0xd8c4b0, 0xc89a80, 0xf0e4d4],
    veg: ['plane', 'shrub', 'pine'], kits: { record: 'noticeBoard', residue: 'orderBoard', fragment: 'enamelSign', scene: 'clockPost' },
    palette: pal({ fog: 0xd8c0a0, wall: '#c8bcaa', floor: '#7a7468', accent: 0xffc878, accent2: 0x9fd8ff, light: 0xffe0b0, tint: 0xffe8d0, night: 0.1, weather: 'rain', sky: 'dusk' }),
  },
  // the dam on the upper gorge: raw concrete, steel gratings, sodium and cold LED floodlight, snow
  dam: {
    ground: 'damConcrete', walk: 'gratingSteel', facade: 'damConcrete', roof: 'corrugated', trim: 'steel', base: 'damConcrete',
    tints: [0xffffff, 0xe8e6e0, 0xd8d6d0],
    veg: ['pine', 'scrub'], kits: { record: 'logbook', residue: 'intakeBoard', fragment: 'tagPlate', scene: 'switchPanel' },
    palette: pal({ fog: 0x1c2230, wall: '#8a8c90', floor: '#4a4c50', accent: 0xffc44a, accent2: 0xff6a48, light: 0xa8c0e8, tint: 0xd0d8e8, night: 0.6, weather: 'frost', sky: 'night' }),
  },
  // Rain City General: white modernist pavilions on pilotis, ribbon windows, colonnades round garden courts
  hospital: {
    ground: 'lawn', walk: 'hospitalPave', facade: 'renderFacade', roof: 'roofLight', trim: 'steel', base: 'renderWhite',
    floor: 'hospitalTile', wall: 'renderWhite',
    tints: [0xffffff, 0xf8f8f4, 0xf0f4f4],
    veg: ['magnolia', 'linden', 'shrub', 'grass'], kits: { record: 'chartBoard', residue: 'whiteboard', fragment: 'wristband', scene: 'bedside' },
    palette: pal({ fog: 0xd8ecec, wall: '#eef4f4', floor: '#9fb8be', accent: 0x3f9cff, accent2: 0xe86a9c, light: 0xf2ffff, tint: 0xe0fbff, night: 0, weather: null, sky: 'plant' }),
  },
  // the delta cargo port: container canyons, gantry cranes, rail wagons, the silos, trenches and sandbags
  port: {
    ground: 'quayConcrete', walk: 'quayConcrete', facade: 'siloConcrete', roof: 'corrugated', trim: 'rust', base: 'quayConcrete',
    tints: [0xffffff, 0xe8e0d8, 0xd8d0c4],
    veg: ['wildflower', 'grass', 'birch'], kits: { record: 'fieldBoard', residue: 'sandbagSign', fragment: 'helmet', scene: 'deviceCase' },
    palette: pal({ fog: 0x6a4a3a, wall: '#6a5c56', floor: '#3a3430', accent: 0xff8a3d, accent2: 0x9fd8ff, light: 0xffb27a, tint: 0xffd0b0, night: 0.35, weather: 'motes', sky: 'plant' }),
  },
  // downtown in 2196: a lagoon city, towers wearing forests, the elevated Line 41 as the main walkway
  drowned: {
    ground: 'mossStone', walk: 'viaductDeck', facade: 'towerGlass', roof: 'roofGarden', trim: 'rust', base: 'concreteStained',
    tints: [0xffffff, 0xe8f0e8, 0xd8e4dc, 0xc8d8d0],
    veg: ['willow', 'reeds', 'birch', 'fern'], kits: { record: 'beaconCase', residue: 'wardenSign', fragment: 'stackedStones', scene: 'memorialCore' },
    palette: pal({ fog: 0xb8c8b0, wall: '#7a8a78', floor: '#4a5a48', accent: 0x9fff7a, accent2: 0xffd36a, light: 0xe8ffd0, tint: 0xd0e8d0, night: 0.05, weather: 'pollen', sky: 'dusk' }),
  },
  // the lock city in a ruined stadium: houses on the stands, the market on the pitch, the press tower
  stadium: {
    ground: 'pitchGrass', walk: 'stadiumConcrete', facade: 'stadiumConcrete', roof: 'lilacTarp', trim: 'steel', base: 'stadiumConcrete',
    tints: [0xffffff, 0xf4ecf0, 0xe8e0e8, 0xf0e8d8],
    veg: ['plane', 'shrub', 'wildflower'], kits: { record: 'timetable', residue: 'cardCabinet', fragment: 'registerBook', scene: 'lockConsole' },
    palette: pal({ fog: 0xd8d0e0, wall: '#b8b0c0', floor: '#7a7468', accent: 0xffe0a0, accent2: 0xc8b8ff, light: 0xfff0d0, tint: 0xf0e8f0, night: 0, weather: 'motes', sky: 'dusk' }),
  },
  // the quarry-sinkhole museum: terraced rock walls, gallery caves on a spiral ramp, a lens over the hall
  quarry: {
    ground: 'quarryFloor', walk: 'rampStone', facade: 'quarryRock', roof: 'glassRoof', trim: 'bronzeAged', base: 'quarryCut',
    tints: [0xffffff, 0xf0e8dc, 0xe0d8c8],
    veg: ['fern', 'shrub', 'birch'], kits: { record: 'museumCase', residue: 'museumLabel', fragment: 'curioBox', scene: 'reelStand' },
    palette: pal({ fog: 0x2e2a30, wall: '#8a7e6a', floor: '#4a4436', accent: 0xffc27a, accent2: 0x8ff6ff, light: 0xffc27a, tint: 0xffd49a, night: 0.4, weather: 'steam', sky: 'dusk' }),
  },
  // the desert array: nine dishes on rails, cable trenches, drum racks, the half-roofless control hall
  desertArray: {
    ground: 'sand', walk: 'cablePath', facade: 'hallConcrete', roof: 'corrugated', trim: 'steel', base: 'hallConcrete',
    tints: [0xffffff, 0xf0e8dc, 0xe4d8c4],
    veg: ['scrub', 'grass'], kits: { record: 'drumRack', residue: 'recordingTag', fragment: 'evidenceTray', scene: 'reelPlayer' },
    palette: pal({ fog: 0x141c34, wall: '#8a8478', floor: '#5a5040', accent: 0xff3a2a, accent2: 0x9fd8ff, light: 0xc8d8ff, tint: 0xc8d0e8, night: 0.7, weather: null, sky: 'night' }),
  },
  // the Fracture: a traverse under the storm of times; a scrap village on a motorway, a canyon, a highway, a tower
  fracture: {
    ground: 'motorway', walk: 'motorway', facade: 'containerHouse', roof: 'corrugated', trim: 'rust', base: 'slabConcrete',
    tints: [0xffffff, 0xe8d8c8, 0xd8c8b8, 0xc8d0d8],
    veg: ['grass', 'birch', 'scrub'], kits: { record: 'manualStand', residue: 'roadSignKit', fragment: 'evacList', scene: 'anchorPanel' },
    palette: pal({ fog: 0x4a3a44, wall: '#5a4a52', floor: '#3a2e34', accent: 0xff7a63, accent2: 0x7fe0ff, light: 0xffd0c0, tint: 0xe0c8d0, night: 0.4, weather: 'storm', sky: 'night' }),
  },
  // the Unwritten Second: a white salt mirror, floating fragments of earlier places, the blue door
  salt: {
    ground: 'salt', walk: 'salt', facade: 'fragmentStone', roof: 'glassRoof', trim: 'chalkWhite', base: 'salt',
    tints: [0xffffff, 0xf4f0ff, 0xf0f4ff],
    veg: [], kits: { record: 'symbolStone', residue: 'mirrorPlate', fragment: 'chalkMark', scene: 'doorFrame' },
    palette: pal({ fog: 0xece8f8, wall: '#e0dcf0', floor: '#d8d4e8', accent: 0xb08cff, accent2: 0xffd36a, light: 0xffffff, tint: 0xf4f0ff, night: 0, weather: 'motes', sky: 'dusk' }),
  },
  // Mira's memory: one plot remembered three ways, in watercolour; the edges dissolve into white
  memory: {
    ground: 'gardenLawn', walk: 'pathBrick', facade: 'watercolourWall', roof: 'slate', trim: 'woodWhite', base: 'brickWall',
    tints: [0xffffff, 0xfff0e4, 0xf8e8e0],
    veg: ['blossom', 'shrub', 'flowers', 'grass'], kits: { record: 'fridgeNote', residue: 'drawingFrame', fragment: 'keepsake', scene: 'memoryChair' },
    palette: pal({ fog: 0xf0e0d0, wall: '#a08878', floor: '#7a6858', accent: 0xffb0a0, accent2: 0x9fd8ff, light: 0xfff0e0, tint: 0xf0d0c0, night: 0, weather: 'pollen', sky: 'dusk' }),
  },
  // the Continuum Spire above the clouds: black basalt and glass terraces, windbreaks, the arena ring
  spire: {
    ground: 'basaltPave', walk: 'basaltPave', facade: 'blackGlass', roof: 'basalt', trim: 'steel', base: 'basalt',
    tints: [0xffffff, 0xe8ecf4],
    veg: ['scrub'], kits: { record: 'commandLectern', residue: 'orderScreen', fragment: 'eliteBadge', scene: 'citadelConsole' },
    palette: pal({ fog: 0xc8d8f0, wall: '#3a3e48', floor: '#2a2c32', accent: 0xffc44a, accent2: 0x9fd8ff, light: 0xffffff, tint: 0xe0e8f8, night: 0, weather: null, sky: 'plant' }),
  },
  // the composites (M22, M23): quotations of earlier places, each in its own year and light
  composite: {
    ground: 'meadow', walk: 'flagstone', facade: 'townhouse', roof: 'slate', trim: 'ironDark', base: 'drystone',
    tints: [0xffffff, 0xf0e8dc, 0xe8e0d0],
    veg: ['linden', 'cypress', 'grass', 'plane'], kits: { record: 'evidenceTable', residue: 'chainWall', fragment: 'quoteStone', scene: 'sealPlinth' },
    palette: pal({ fog: 0x6a6070, wall: '#8a8090', floor: '#4a4450', accent: 0xc9b8ff, accent2: 0xffd36a, light: 0xfff0e0, tint: 0xe8e0f0, night: 0.3, weather: null, sky: 'dusk' }),
  },
};
