// THE LAST VERSION OF EARTH: the places' materials (OVERHAUL.md §4.3). No new binary assets: the
// surfaces are painted into canvases at first use, or reuse the game's CC0 scans (assets/textures:
// asphalt, bark, brick, concrete, metal, moss, pavement, rock, rust, stone, water_normal).
//
// A place names its materials (`m:` in level.vis). Each name maps onto one of a few shared surfaces
// (a painted texture, or a plain finish) plus a tint, which Scenery.js bakes into vertex colours, so
// a place costs one draw call per surface per year group, not one per name. The table is pure data
// (the unit tests check every name a place uses, and that ancient years carry no modern surface).
//   s     the shared surface             c     the tint (vertex colour)
//   tags  modern (lamps, neon, roads, kerbs, signs: never in an ancient year), ground (does not cast)
import * as THREE from '../../../../vendor/three.module.min.js';
import { canvasTex, pbrTex, WATER_NORMALS } from '../../../world/materials.js';

const D = (s, c = 0xffffff, tags = '') => ({ s, c, tags: tags ? tags.split(' ') : [] });

// name -> surface and tint
export const MATS = {
  // --- ground and paving ---------------------------------------------------------------------------
  asphalt: D('asphalt', 0x8a8e94, 'modern ground road'), marking: D('glow', 0xc8c8b8, 'modern ground road'), kerb: D('concrete', 0xa8aaa8, 'modern road'),
  pavement: D('paving', 0xb0aca4, 'modern ground road'), pavingWet: D('paving', 0x8e949a, 'modern ground road'), platformTile: D('tile', 0xc0bcb2, 'modern ground'),
  platformEdge: D('glow', 0xe8d070, 'modern ground'), ballast: D('gravel', 0x6a6460, 'ground'), towpath: D('paving', 0x8a8a84, 'ground'),
  stoneWet: D('flag', 0x8a8e96, 'ground'), courtStone: D('flag', 0xc8c4bc, 'ground'), terrazzo: D('terrazzo', 0xe4e0d8, 'ground'), gravel: D('gravel', 0xb8ae98, 'ground'),
  yardConcrete: D('concrete', 0xa8a6a0, 'ground'), rubber: D('matte', 0x22252a, 'ground'), chamberFloor: D('flag', 0x3a3e46, 'ground'), woodFloor: D('wood', 0x8a5e3a, 'ground'),
  oakFloor: D('wood', 0x9a6c42, 'ground'), cobbles: D('cobble', 0xa8a092, 'ground'), flagstone: D('flag', 0xb4a890, 'ground'), limestone: D('flag', 0xd4ccb8),
  meadow: D('grass', 0x8aa05a, 'ground'), meadowLong: D('grass', 0x9aa862, 'ground'), summitGrass: D('grass', 0x98a868, 'ground'), riverMeadow: D('grass', 0x7a9a58, 'ground'),
  lawn: D('grass', 0x6aa060, 'ground'), ridgeGrass: D('grass', 0x9a9a62, 'ground'), rockGrass: D('rock', 0x8a9070), gorgeFloor: D('gravel', 0x7a7462, 'ground'),
  dirt: D('soil', 0x8a7458, 'ground'), mud: D('soil', 0x4a4034, 'ground'), basinMud: D('soil', 0x5a4c3a, 'ground'), riverBed: D('soil', 0x4a4a3c, 'ground'), clay: D('soil', 0x9a6a48, 'ground'),
  soil: D('soil', 0x5a4632, 'ground'), ash: D('soil', 0x3a3632, 'ground'), snow: D('snow', 0xf2f6fa, 'ground'), ice: D('ice', 0xcfe4ee, 'ground'), paintedFloor: D('picto', 0xffffff, 'ground'),
  leaves: D('leaves', 0xd08a3a, 'ground'), roofLead: D('slate', 0x6a7078, 'ground'), rillStone: D('stone', 0x8a8478, 'ground'), sandstoneDark: D('sandstone', 0xa08a6a, 'ground'),
  // --- walls and facades -----------------------------------------------------------------------------
  rainBrick: D('brickFacade', 0xffffff, 'lit'), rainGlass: D('glassFacade', 0xc8d4e0, 'lit'), brickWall: D('brick', 0xa86a52), quayStone: D('stone', 0xa09a90),
  bridgeStone: D('stone', 0xa8a298), concrete: D('concrete', 0xb0aea8), rawConcrete: D('concrete', 0xa8a49c), fireEscape: D('metal', 0x2a2e34, 'modern'),
  helixPanel: D('helixFacade', 0xffffff, 'lit'), helixWhite: D('satin', 0xeef0f2), helixFence: D('metal', 0xd8dce0, 'modern'), helixProp: D('satin', 0xd8dce2),
  townhouse: D('townFacade', 0xffffff, 'lit'), townhouseEzra: D('townFacade', 0xc8b49a, 'lit'), whitewash: D('plaster', 0xf0ece0), drystone: D('drystone', 0xa89c88),
  sandstone: D('sandstone', 0xd8c09a), basalt: D('stone', 0x4a4844), riverStone: D('stone', 0x8a8a80), headStone: D('stone', 0x7a7468), standingStone: D('stone', 0x8a8478),
  cliffRock: D('rock', 0x8a8070), rock: D('rock', 0x8a8478), wattle: D('wattle', 0xa08a62), timber: D('wood', 0x7a5a3a), wood: D('wood', 0x8a6440), earthRoof: D('soil', 0x6a5a40),
  // --- roofs -----------------------------------------------------------------------------------------
  roofDark: D('slate', 0x4a4e54), roofLight: D('concrete', 0xd8dade), slate: D('slate', 0x5a626c), thatch: D('thatch', 0xc8a868), reedThatch: D('thatch', 0xb8a070),
  corrugated: D('corrugated', 0x8a9098, 'modern'), glassRoof: D('glass', 0xbcd0dc), lanternGlass: D('glass', 0xd8e8f0), hide: D('hide', 0xb89a70), hideAwning: D('hide', 0xa88a60),
  // --- metal and machines -----------------------------------------------------------------------------
  steel: D('metal', 0xb8bcc2), ironDark: D('metal', 0x2e3238), rust: D('metal', 0x8a4a2a), brass: D('metal', 0xc89a4a), bronze: D('metal', 0xa8743a),
  bronzePolished: D('metal', 0xd8a050), bronzeAged: D('metal', 0x7a5a38), bronzeVerdigris: D('satin', 0x5a9a84), blackRing: D('metal', 0x121418), oculusRim: D('metal', 0x2a2e36),
  craneYellow: D('satin', 0xe8b030, 'modern'), scaffold: D('metal', 0x9aa0a6, 'modern'), relayCabinet: D('satin', 0x4a5a52, 'modern'), serverRack: D('satin', 0x1a1e24, 'modern'),
  machinePanel: D('metal', 0x2a2e34), containerBlue: D('corrugated', 0x2a5a8a, 'modern'), siteCabin: D('satin', 0xd8d4c8, 'modern'), siteFence: D('metal', 0xa8b0b4, 'modern'),
  tyre: D('matte', 0x1a1a1c, 'modern'), carRed: D('satin', 0x9a2a24, 'modern'), carGrey: D('satin', 0x5a6068, 'modern'), carBlue: D('satin', 0x2a4a7a, 'modern'),
  carWhite: D('satin', 0xd8dadc, 'modern'), vanWhite: D('satin', 0xe0e2e4, 'modern'), busBody: D('satin', 0x2a6a9a, 'modern'), tramBody: D('satin', 0xc8a030, 'modern'),
  trainBody: D('satin', 0xb8c0c8, 'modern'), boothRed: D('satin', 0xa82a24, 'modern'), boothBlue: D('satin', 0x2a5a8a, 'modern'), helixDoor: D('satin', 0xdfe4e8, 'modern'),
  // --- cloth, small things -----------------------------------------------------------------------------
  awningRed: D('cloth', 0xa83a30, 'modern'), awningGreen: D('cloth', 0x2a6a4a, 'modern'), awningBlue: D('cloth', 0x2a4a7a, 'modern'), umbrella: D('cloth', 0x2a2e3a, 'modern'),
  tarp: D('cloth', 0x3a5a8a, 'modern'), tarpScav: D('cloth', 0x6a5a40), marqueeYellow: D('cloth', 0xe8c040, 'modern'), bannerYellow: D('cloth', 0xe8c040, 'modern'),
  flagHelix: D('cloth', 0xe8ecf0, 'modern'), linen: D('cloth', 0xe8e0cc), cloth: D('cloth', 0xc8b490), rope: D('matte', 0x8a7a5a), fish: D('matte', 0x9aa0a0),
  produce: D('matte', 0x8a9a3a), flowersStall: D('matte', 0xe8e0d8), hedge: D('leaves', 0x3a6a34), ivy: D('leaves', 0x3a5a2a), moss: D('leaves', 0x4a6a34),
  planterTimber: D('wood', 0x6a4a30), gateTimber: D('wood', 0x6a4a2a), pavingStack: D('paving', 0xb0aca4, 'modern'), terracottaPot: D('matte', 0xa85a3a), barrierStripe: D('stripe', 0xffffff, 'modern'),
  barrierTape: D('stripe', 0xffffff, 'modern'), photoBoard: D('matte', 0x3a3430, 'modern'), clockCaseWood: D('wood', 0x5a3a24), clockFaceWhite: D('satin', 0xf4f0e4),
  signBoard: D('satin', 0x1c2026, 'modern'), signGreen: D('satin', 0x1e3a2a, 'modern'), signBlue: D('satin', 0x1e2e4a, 'modern'), doorDark: D('satin', 0x2a2420),
  shadow: D('matte', 0x0c0c0e), smoke: D('smoke', 0xb8b4b0), glass: D('glass', 0xd0e0ec), helixGlass: D('glass', 0xa8c8e0), cubeGlass: D('glass', 0xd8d4ff),
  oculusGlass: D('glass', 0x8ab8e8), serverGlass: D('glass', 0x9ab8c8, 'modern'), carGlass: D('satin', 0x1a2028, 'modern'), helixDoorPanel: D('satin', 0xdfe4e8, 'modern'),
  // --- carved and painted records (the ancient places' writing is glyphs, never letters) -------------------
  glyphStone: D('glyph', 0xb0a68e), pictoFire: D('pictoFire', 0xb0a68e), pictoWater: D('pictoWater', 0xb0a68e), pictoRing: D('pictoRing', 0xb0a68e),
  muralPaint: D('mural', 0xffffff), tallyMarks: D('tally', 0xe8e0d0),
  // --- light ----------------------------------------------------------------------------------------------
  lampGlow: D('glow', 0xffe0b0, 'modern lamp'), shopLit: D('glow', 0xffd9a8, 'modern neon'), adLit: D('glow', 0xbfe4ff, 'modern neon'), bollardLit: D('glow', 0x9fd8ff, 'modern lamp'),
  windowWarm: D('glow', 0xffc890), fireGlow: D('glow', 0xff9a40), flameCore: D('glow', 0xffe08a), emberGlow: D('glow', 0xc84a1e), glowAccent: D('glow', 0x4f9fe8, 'modern'), lightPanel: D('glow', 0xffe8d8, 'modern'), lampGreen: D('glow', 0x7fe0a0, 'modern'),
  helixCeil: D('satin', 0xd0d4d8, 'modern'),
  // --- water ------------------------------------------------------------------------------------------------
  water: D('water', 0x5a8aa0), canalWater: D('water', 0x3a4a52), canalGreen: D('water', 0x4a6a5a), riverWater: D('water', 0x4a7a8a), poolWater: D('water', 0x5a7a6a),
  puddleWater: D('water', 0x3a4250), floodWater: D('water', 0x3a7a72),
  // --- Acts II-IV and the Finale (U3) ---------------------------------------------------------------------
  // Northbank: pale limestone, brick, copper roofs, the funicular, the transmitter
  limestonePave: D('cobble', 0xd4ccbc, 'ground'), stairStone: D('stone', 0xc8c0b0, 'ground'), stoneFacade: D('stoneFacade', 0xffffff, 'lit'), copperRoof: D('slate', 0x6ab89a),
  limestoneBlock: D('stone', 0xe4dccc), cathedralStone: D('sandstone', 0xece2d0), roseWindow: D('glow', 0xffd8a0), funicularRed: D('satin', 0x9a2a2a, 'modern'),
  ironLoggia: D('metal', 0x3a4a44), mastRed: D('satin', 0xc83a2a, 'modern'), mastWhite: D('satin', 0xf0f0ec, 'modern'), harbourWater: D('water', 0x3a6a7a), quayTimber: D('wood', 0x6a5440),
  // the dam: raw concrete, gratings, floodlights, the reservoir and the spillway
  damConcrete: D('concrete', 0xb8b6b0), gratingSteel: D('metal', 0x7a8088, 'modern'), sodiumGlow: D('glow', 0xffc44a, 'modern lamp'), ledGlow: D('glow', 0xdce8ff, 'modern lamp'),
  cellBars: D('metal', 0x4a5058, 'modern'), turbineGreen: D('satin', 0x3a6a5a, 'modern'), reservoirWater: D('water', 0x2a4a5a), spillwayFoam: D('smoke', 0xe8f0f4), snowRock: D('rock', 0xd8dce4),
  // the hospital: white render, ribbon windows, tiles, the accents of the children's wing
  renderFacade: D('renderFacade', 0xffffff, 'lit'), renderWhite: D('plaster', 0xfafaf6), hospitalPave: D('paving', 0xd4d0c8, 'modern ground'), hospitalTile: D('tile', 0xe8eef0, 'ground'),
  accentBlue: D('satin', 0x3f9cff, 'modern'), accentPink: D('satin', 0xe86a9c, 'modern'), helipadMark: D('glow', 0xf4f4f0, 'modern ground'), fountainWater: D('water', 0x7ab0c0), ambulanceWhite: D('satin', 0xf0f0ee, 'modern'),
  // the port: quay concrete, containers, sandbags, rails, the silos, craters
  quayConcrete: D('concrete', 0x9e9a92), containerRed: D('corrugated', 0xa83a2a, 'modern'), containerOrange: D('corrugated', 0xd8782a, 'modern'), containerGreen: D('corrugated', 0x3a7a4a, 'modern'),
  containerYellow: D('corrugated', 0xd8b02a, 'modern'), containerGrey: D('corrugated', 0x8a9096, 'modern'), sandbag: D('cloth', 0xa8986a), railSteel: D('metal', 0x6a6058, 'modern'),
  wagonRust: D('metal', 0x7a4a2a, 'modern'), siloConcrete: D('concrete', 0xc8c0b0), craneRed: D('satin', 0xb03a2a, 'modern'), crater: D('soil', 0x3a3028, 'ground'), ashGround: D('soil', 0x4a4440, 'ground'),
  frozenGlass: D('glass', 0xcfe8ff), rustRed: D('metal', 0x8a3a24),
  // the lagoon city: mossy stone, the viaduct's deck, broken curtain walls, roof gardens, vines
  mossStone: D('stone', 0x6a7a5a, 'ground'), viaductDeck: D('concrete', 0x9a9a8e), towerGlass: D('glassFacade', 0xa8c0b0, 'lit'), concreteStained: D('concrete', 0x8e8c80),
  roofGarden: D('leaves', 0x6a9a4a), vineCurtain: D('leaves', 0x4a7a3a), lagoonWater: D('water', 0x4a8a88), statueStone: D('stone', 0xb8b4a8),
  // the lock city: the stadium's concrete, its seats, the pitch, bunting, laundry, tents
  pitchGrass: D('grass', 0x7aa850, 'ground'), stadiumConcrete: D('concrete', 0xc8c2b8), seatsRed: D('seats', 0xc84a3a), seatsBlue: D('seats', 0x3a5ab0), seatsFaded: D('seats', 0xb8a8b0),
  bunting: D('stripe', 0xfff0d0), laundry: D('cloth', 0xf4f0e8), lilacTarp: D('cloth', 0xb8a8d0), tentWhite: D('cloth', 0xe8e8e0, 'modern'), floodlightGlow: D('glow', 0xf0f4ff, 'modern lamp'),
  // the quarry museum: rock, cut blocks, the ramp, lanterns, the lake, cases
  quarryRock: D('rock', 0xb4a48c), quarryCut: D('sandstone', 0xd4c8ac), quarryFloor: D('gravel', 0x9a907a, 'ground'), rampStone: D('flag', 0xa89c86, 'ground'), lanternGlow: D('glow', 0xffc27a),
  pontoonWood: D('wood', 0x6a5a48), lakeWater: D('water', 0x3a5a68), lensGlass: D('glass', 0xc8e0f0), caseGlass: D('glass', 0xe0ecf4), waterfallWater: D('smoke', 0xe8f4f8),
  // the desert array: sand, cable paths, the dishes, the drum racks, red aircraft lights, mesas
  sand: D('sand', 0xd8b07a, 'ground'), cablePath: D('concrete', 0xb4a894, 'ground'), dishWhite: D('satin', 0xe8eaec, 'modern'), drumRack: D('metal', 0x3a3e44, 'modern'),
  redBeacon: D('glow', 0xff3a2a, 'modern lamp'), mesaRock: D('rock', 0xb06a48), hallConcrete: D('concrete', 0xccc0aa), reelBrown: D('satin', 0x4a3a2a, 'modern'),
  // the Fracture: the motorway, container houses, turbines, the canyon, the lattice tower
  motorway: D('asphalt', 0x7a7e82, 'modern ground road'), containerHouse: D('corrugated', 0xb87a5a, 'modern'), turbineWhite: D('satin', 0xe8eaec, 'modern'), canyonRock: D('rock', 0xa8603a),
  latticeSteel: D('metal', 0x8a9096, 'modern'), slabConcrete: D('concrete', 0xa09a92), highwayWater: D('water', 0x4a5a58), stormGlow: D('glow', 0xc9b8ff),
  // the Unwritten Second: salt, the mirror, fragments, chalk, the blue door
  salt: D('salt', 0xf4f2f0, 'ground'), mirrorWater: D('mirror', 0xeae4ff), mirrorRose: D('mirror', 0xffe8ee), mirrorMint: D('mirror', 0xe4fff4), reflectionGlass: D('satin', 0xa898e8), memoryFog: D('smoke', 0xffffff), fragmentStone: D('stone', 0xe4e0d8), chalkWhite: D('matte', 0xf4f4f0), blueDoor: D('satin', 0x2a5ab0), symbolGold: D('metal', 0xd8b060),
  // Mira's memory: a garden, brick paths, watercolour walls, a kitchen, the sea
  gardenLawn: D('grass', 0x8ab060, 'ground'), pathBrick: D('brick', 0xc08a6a, 'ground'), watercolourWall: D('plaster', 0xf0d8c8), woodWhite: D('satin', 0xf4f0ea), voidWhite: D('matte', 0xf4f4f6),
  kitchenTile: D('tile', 0xf0e8d8, 'ground'), seaWater: D('water', 0x5a9ac0), fridgeWhite: D('satin', 0xf8f8f4, 'modern'), busStopGreen: D('satin', 0x2a6a4a, 'modern'),
  // the Spire: basalt paving, black glass, windbreaks, the elites' graphite
  basaltPave: D('flag', 0x4e4e54, 'ground'), blackGlass: D('glass', 0x2a3040), windbreakGlass: D('glass', 0xc8d8e8), eliteGraphite: D('satin', 0x3a3c40, 'modern'), helipadPaint: D('glow', 0xe8e8e0, 'modern ground'),
  // the composites: the twin chamber, half construction concrete and half machined black
  twinConcrete: D('concrete', 0xb0aca4), sealBronze: D('metal', 0x9a7a4a), wedgeGlass: D('glass', 0xd8d0ff),
  // --- (closing: visuals) things you can tell apart: props painted face by face, facades with their windows ------------
  // crates and boxes: a wooden crate, a museum's packing crate, a cardboard box, a moving box, an aid crate
  crateWood: D('crate', 0xffffff), crateMuseum: D('crate', 0xe0d0b0), cardboard: D('cardboard', 0xffffff, 'modern'), cardboardPale: D('cardboard', 0xf4ece0, 'modern'),
  aidCrate: D('aidCrate', 0xffffff, 'modern'), aidCrateGreen: D('aidCrate', 0xa8c8a0, 'modern'),
  // painted panels with their seams and scuffs (Helix's props and booths, cabins, cabinets, consoles)
  panelWhite: D('panel', 0xf2f4f6, 'modern'), panelGrey: D('panel', 0xa8b0b8, 'modern'), panelGreen: D('panel', 0x5a7a68, 'modern'), panelNavy: D('panel', 0x4a5a7a, 'modern'),
  panelCream: D('panel', 0xece4d0, 'modern'), helixFloor: D('tile', 0x9aa0a8, 'modern ground'),
  // tents and awnings of canvas: seams, stains, the weave
  canvasWhite: D('canvas', 0xf4f0e4), canvasKhaki: D('canvas', 0xc0b088), canvasBlue: D('canvas', 0x9ab0d8, 'modern'), canvasLilac: D('canvas', 0xd0c0e4),
  // 2196's towers: the curtain wall broken, panes gone, moss down the slabs, creepers; the podiums under them
  ruinFacade: D('ruinFacade', 0xffffff), ruinPodium: D('ruinPodium', 0xffffff), podiumFacade: D('podiumFacade', 0xffffff, 'lit'),
  vineSheet: D('vineSheet', 0xffffff), vineSheetDark: D('vineSheet', 0xb8c8a8),
  // the lock city: the stadium's ribbed precast walls with their murals, the houses on the tiers with a door and a window
  stadiumWall: D('stadiumWall', 0xffffff), shackFace: D('shack', 0xffffff), shackFaceBlue: D('shack', 0xd0dcf4), shackFaceRose: D('shack', 0xf8dcd8),
  suburbHouse: D('houseFacade', 0xffffff, 'lit'),
  // a shop's inside seen through its glass (Mission 1): shelves of goods, washing machines, the floor, the lit ceiling
  shopShelves: D('shelves', 0xffffff, 'modern'), washerFront: D('washer', 0xffffff, 'modern'), shopFloor: D('tile', 0xe8e4dc, 'modern ground'),
  shopCeiling: D('lightGrid', 0xfff4e4, 'modern'), counterTop: D('panel', 0xd8d0c4, 'modern'), shopBack: D('plaster', 0xf4ece0),
  // Helix's checkpoint barrier (Mission 1): a steel frame with glass leaves and the company's stripe
  barrierPanel: D('barrierFace', 0xffffff, 'modern'),
  // Mira's first experiment (Mission 20): Chamber One as a child remembers it, panelled white, a ceiling of light, a dark grid
  // underfoot, and the street she knew drawn in pencil lines round it
  chamberPanel: D('chamberPanel', 0xffffff), chamberGrid: D('chamberGrid', 0xffffff, 'ground'), chamberLights: D('chamberCeiling', 0xf4f8ff), pencil: D('matte', 0x30323a),
  // Mission 11's rain in the discontinuity court: streaks falling on its west half, rising on its east (animated: tickSurfaces)
  rainUp: D('rainUp', 0xe0d4ff), rainDown: D('rainDown', 0xd0e4f4),
  // Mission 22's 2049 beam from the ring into the eclipse: its sheath of light (unlit, faint: a lit grey smoke had drawn a
  // dark line down the sky)
  beamHalo: D('halo', 0x9fd8ff, 'modern'),
  // the years of Mission 22's chamber: 2026's site hoarding round the concrete half
  siteHoarding: D('hoarding', 0xffffff, 'modern'),
};

// the shared surfaces: a finish, and a painter (or a scan) for the textured ones
//   tile: metres per texture repeat; cast: whether it casts shadows
export const SURFACES = {
  // (closing: visuals) the plain finishes are never flat colour: matte with its grime, satin paint with its wear, metal
  // brushed and scratched, cloth with its weave and folds (each near white, so the tint keeps its colour)
  matte: { paint: 'wearMatte', tile: 2.2, rough: 0.92 }, satin: { paint: 'wearSatin', tile: 2.4, rough: 0.5, metal: 0.08 }, metal: { paint: 'wearMetal', tile: 1.8, rough: 0.36, metal: 0.72 },
  cloth: { paint: 'wearCloth', tile: 1.6, rough: 0.95, side: 2 },
  glow: { basic: true, cast: false }, glass: { rough: 0.06, metal: 0.25, opacity: 0.32, cast: false }, smoke: { rough: 1, opacity: 0.22, cast: false },
  water: { rough: 0.06, metal: 0.15, opacity: 0.86, water: true, cast: false },
  mirror: { rough: 0.03, metal: 0.25, opacity: 0.5, cast: false }, // (M19's salt mirror: what stands below it shows through as its reflection)
  asphalt: { scan: 'asphalt', tile: 6, rough: 1, cast: false }, paving: { scan: 'pavement', tile: 3, cast: false }, concrete: { scan: 'concrete', tile: 4 },
  brick: { scan: 'brick', tile: 3 }, stone: { scan: 'stone', tile: 4 }, rock: { scan: 'rock', tile: 8 }, flag: { paint: 'flag', tile: 4, cast: false },
  tile: { paint: 'tile', tile: 2.4, cast: false }, terrazzo: { paint: 'terrazzo', tile: 3, cast: false }, cobble: { paint: 'cobble', tile: 2, cast: false },
  gravel: { paint: 'gravel', tile: 3, cast: false }, grass: { paint: 'grass', tile: 6, cast: false }, soil: { paint: 'soil', tile: 5, cast: false },
  snow: { paint: 'snow', tile: 6, cast: false }, ice: { paint: 'ice', tile: 8, rough: 0.15, cast: false }, leaves: { paint: 'leaves', tile: 2 },
  brickFacade: { paint: 'brickFacade', tile: [4, 3.4], lit: 0xffd9a8 }, glassFacade: { paint: 'glassFacade', tile: [3, 3.6], lit: 0xcfe4ff, rough: 0.2, metal: 0.4 },
  helixFacade: { paint: 'helixFacade', tile: [4, 4.5], lit: 0xffc06a, rough: 0.4 }, townFacade: { paint: 'townFacade', tile: [3.6, 3.6], lit: 0xffc890 },
  plaster: { paint: 'plaster', tile: 4 }, drystone: { paint: 'drystone', tile: 3 }, sandstone: { paint: 'sandstone', tile: 4 }, wattle: { paint: 'wattle', tile: 2 },
  wood: { paint: 'wood', tile: 2 }, slate: { paint: 'slate', tile: 2 }, thatch: { paint: 'thatch', tile: 3 }, hide: { paint: 'hide', tile: 3, side: 2 },
  corrugated: { paint: 'corrugated', tile: 2, metal: 0.4, rough: 0.5 }, stripe: { paint: 'stripe', tile: 1 },
  glyph: { paint: 'glyph', tile: 1.6 }, pictoFire: { paint: 'pictoFire', tile: 1.8, fit: true }, pictoWater: { paint: 'pictoWater', tile: 1.8, fit: true },
  pictoRing: { paint: 'pictoRing', tile: 1.8, fit: true }, picto: { paint: 'skyFloor', tile: 4, fit: true, cast: false }, mural: { paint: 'mural', tile: 6 }, tally: { paint: 'tally', tile: 1.2 },
  stoneFacade: { paint: 'stoneFacade', tile: [3.4, 3.8], lit: 0xffd8a0 }, renderFacade: { paint: 'renderFacade', tile: [6, 3.6], lit: 0xe8f4ff, rough: 0.6 },
  sand: { paint: 'sand', tile: 8, cast: false }, salt: { paint: 'salt', tile: 5, rough: 0.5, cast: false }, seats: { paint: 'seats', tile: [2, 1.6] },
  // (closing: visuals) fit: each face of a box carries the whole picture (a crate's face, a washing machine's door)
  crate: { paint: 'crate', fit: true, rough: 0.85 }, cardboard: { paint: 'cardboard', fit: true, rough: 0.95 }, aidCrate: { paint: 'aidCrate', fit: true, rough: 0.6 },
  panel: { paint: 'panel', tile: [2.4, 2.4], rough: 0.55, metal: 0.1 }, canvas: { paint: 'canvas', tile: 3, rough: 0.95, side: 2 },
  ruinFacade: { paint: 'ruinFacade', tile: [4, 4], rough: 0.85 }, ruinPodium: { paint: 'ruinPodium', tile: [6, 4], rough: 0.95 },
  vineSheet: { paint: 'vineSheet', fit: true, tile: [1, 2], alphaTest: 0.45, side: 2, rough: 0.9, cast: false },
  podiumFacade: { paint: 'podiumFacade', tile: [6, 4], lit: 0xffd8a8, rough: 0.6 },
  stadiumWall: { paint: 'stadiumWall', tile: [8, 6], rough: 0.9 }, shack: { paint: 'shack', fit: true, rough: 0.9 }, houseFacade: { paint: 'houseFacade', tile: [4, 3.5], lit: 0xffd8a0 },
  shelves: { paint: 'shelves', tile: [2.4, 2.4], rough: 0.7 }, washer: { paint: 'washer', fit: true, rough: 0.35, metal: 0.1 },
  lightGrid: { paint: 'lightGrid', tile: [2.4, 2.4], basic: true, cast: false }, barrierFace: { paint: 'barrierFace', fit: true, rough: 0.45, metal: 0.3 },
  chamberPanel: { paint: 'chamberPanel', tile: [3, 3], rough: 0.4 }, chamberGrid: { paint: 'chamberGrid', tile: [2, 2], rough: 0.3, metal: 0.1, cast: false },
  chamberCeiling: { paint: 'lightGrid', tile: [7, 7], basic: true, cast: false },
  rainUp: { paint: 'rainRise', tile: [1.5, 3], basic: true, opacity: 0.85, cast: false, scroll: [0, -0.5] },
  rainDown: { paint: 'rainStreaks', tile: [1.5, 3], basic: true, opacity: 0.75, cast: false, scroll: [0, 1.4] },
  hoarding: { paint: 'hoarding', tile: [6, 2.4], rough: 0.8 }, halo: { basic: true, opacity: 0.18, cast: false, side: 2 },
  // a sheet of paper with its writing, a whiteboard in marker, a lit advertisement (each face of a kit carries one)
  paper: { paint: 'paper', fit: true, rough: 0.9 }, whiteboard: { paint: 'whiteboard', fit: true, rough: 0.3 }, poster: { paint: 'poster', fit: true, basic: true, cast: false },
};

export function surfaceOf(name) {
  return MATS[name]?.s || 'matte';
}

// --- painters (browser only) ----------------------------------------------------------------------------------
// a small seeded generator, so a texture looks the same every time
function rnd(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296);
}
const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
function speckle(g, w, h, n, r, alpha, light = true) {
  for (let i = 0; i < n; i++) {
    const v = light ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},${alpha * r()})`;
    g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
  }
}
// a window grid on a facade: returns the emissive mask too
function windows(g, w, h, { cols, rows, x0, y0, ww, wh, frame, glass, mask, lit = 0.6, r }) {
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = x0 + (i * w) / cols, y = y0 + (j * h) / rows;
    g.fillStyle = frame;
    g.fillRect(x - 3, y - 3, ww + 6, wh + 6);
    g.fillStyle = glass;
    g.fillRect(x, y, ww, wh);
    g.fillStyle = 'rgba(255,255,255,0.08)';
    g.fillRect(x, y, ww, wh * 0.35);
    if (mask && r() < lit) {
      mask.fillStyle = `rgba(255,255,255,${0.55 + r() * 0.45})`;
      mask.fillRect(x, y, ww, wh);
    }
  }
}

const PAINT = {
  flag(g, s, r) {
    g.fillStyle = '#9a968e'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(40,36,30,0.55)'; g.lineWidth = 3;
    for (let j = 0; j < 4; j++) {
      let x = (j % 2) * s * 0.18;
      while (x < s) { const w = s * (0.22 + r() * 0.16); g.fillStyle = `rgb(${150 + r() * 30 | 0},${146 + r() * 28 | 0},${138 + r() * 26 | 0})`; g.fillRect(x + 2, (j * s) / 4 + 2, w - 4, s / 4 - 4); x += w; }
      g.beginPath(); g.moveTo(0, (j * s) / 4); g.lineTo(s, (j * s) / 4); g.stroke();
    }
    speckle(g, s, s, 1600, r, 0.08);
  },
  tile(g, s, r) {
    g.fillStyle = '#c4c0b8'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { g.fillStyle = `rgba(0,0,0,${r() * 0.07})`; g.fillRect((i * s) / 6 + 1, (j * s) / 6 + 1, s / 6 - 2, s / 6 - 2); }
    g.strokeStyle = 'rgba(60,60,60,0.35)'; g.lineWidth = 2;
    for (let i = 0; i <= 6; i++) { g.beginPath(); g.moveTo((i * s) / 6, 0); g.lineTo((i * s) / 6, s); g.moveTo(0, (i * s) / 6); g.lineTo(s, (i * s) / 6); g.stroke(); }
  },
  terrazzo(g, s, r) {
    g.fillStyle = '#e2ded6'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) { const c = [[90, 90, 96], [160, 140, 120], [60, 70, 80], [200, 196, 190]][(r() * 4) | 0]; g.fillStyle = `rgba(${c},${0.5 + r() * 0.5})`; g.fillRect(r() * s, r() * s, 1 + r() * 4, 1 + r() * 3); }
  },
  // setts: tight rows of squarish stones with thin joints (round stones with wide dark gaps read as polka dots
  // underfoot), each of its own tone, a little worn at the edges
  cobble(g, s, r) {
    g.fillStyle = '#6a645a'; g.fillRect(0, 0, s, s);
    const n = 12, c = s / n;
    for (let j = 0; j < n; j++) for (let i = -1; i < n; i++) {
      const w = c * (0.82 + r() * 0.3), x = (i + (j % 2) * 0.5) * c + (r() - 0.5) * 2, y = j * c + (r() - 0.5) * 2, v = 128 + r() * 64;
      g.fillStyle = `rgb(${v | 0},${(v * 0.95) | 0},${(v * 0.87) | 0})`;
      const x0 = x + 1.5, y0 = y + 1.5, ww = Math.min(w, c * 1.05) - 3, hh = c - 3, k = 3 + r() * 3;
      g.beginPath();
      g.moveTo(x0 + k, y0); g.lineTo(x0 + ww - k, y0); g.quadraticCurveTo(x0 + ww, y0, x0 + ww, y0 + k);
      g.lineTo(x0 + ww, y0 + hh - k); g.quadraticCurveTo(x0 + ww, y0 + hh, x0 + ww - k, y0 + hh);
      g.lineTo(x0 + k, y0 + hh); g.quadraticCurveTo(x0, y0 + hh, x0, y0 + hh - k); g.lineTo(x0, y0 + k); g.quadraticCurveTo(x0, y0, x0 + k, y0);
      g.fill();
      g.fillStyle = `rgba(255,250,240,${0.05 + r() * 0.08})`;
      g.fillRect(x0 + 2, y0 + 2, ww * 0.6, hh * 0.3);
    }
  },
  gravel(g, s, r) {
    g.fillStyle = '#8a8274'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 5000; i++) { const v = 90 + r() * 120; g.fillStyle = `rgb(${v | 0},${(v * 0.96) | 0},${(v * 0.9) | 0})`; g.fillRect(r() * s, r() * s, 1 + r() * 3, 1 + r() * 3); }
  },
  grass(g, s, r) {
    g.fillStyle = '#7a8a50'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) { const v = r(); g.strokeStyle = `rgba(${(60 + v * 90) | 0},${(90 + v * 80) | 0},${(30 + v * 40) | 0},0.55)`; const x = r() * s, y = r() * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - 2 - r() * 5); g.stroke(); }
    for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '120,100,60' : '60,80,40'},0.12)`; g.beginPath(); g.ellipse(r() * s, r() * s, 20 + r() * 50, 14 + r() * 40, r() * 3, 0, Math.PI * 2); g.fill(); }
  },
  soil(g, s, r) {
    g.fillStyle = '#7a6a54'; g.fillRect(0, 0, s, s);
    speckle(g, s, s, 3000, r, 0.18, false); speckle(g, s, s, 1500, r, 0.12);
  },
  snow(g, s, r) { g.fillStyle = '#f4f6fa'; g.fillRect(0, 0, s, s); for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(180,200,220,0.08)'; g.beginPath(); g.ellipse(r() * s, r() * s, 30 + r() * 60, 10 + r() * 20, r() * 3, 0, Math.PI * 2); g.fill(); } },
  ice(g, s, r) { g.fillStyle = '#c8dce6'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(255,255,255,0.4)'; for (let i = 0; i < 40; i++) { g.beginPath(); let x = r() * s, y = r() * s; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 60; y += (r() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); } },
  leaves(g, s, r) { g.fillStyle = '#5a7a3a'; g.fillRect(0, 0, s, s); for (let i = 0; i < 1400; i++) { const v = r(); g.fillStyle = `rgba(${(40 + v * 80) | 0},${(70 + v * 90) | 0},${(20 + v * 30) | 0},0.8)`; g.beginPath(); g.ellipse(r() * s, r() * s, 2 + r() * 4, 1 + r() * 3, r() * 3, 0, Math.PI * 2); g.fill(); } },
  brickFacade(g, w, h, r, m) {
    g.fillStyle = '#a86a52'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(60,40,32,0.35)'; g.lineWidth = 1;
    for (let y = 0; y < h; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = ((y / 8) % 2) * 9; x < w; x += 18) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 8); g.stroke(); } }
    speckle(g, w, h, 900, r, 0.1, false);
    windows(g, w, h, { cols: 2, rows: 1, x0: 22, y0: 30, ww: 76, wh: 120, frame: '#e8e0d0', glass: '#20262e', mask: m, lit: 0.55, r });
    g.fillStyle = 'rgba(232,224,208,0.9)'; g.fillRect(0, h - 10, w, 6);
  },
  glassFacade(g, w, h, r, m) {
    g.fillStyle = '#3a4a5a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) { g.fillStyle = `rgb(${50 + r() * 30 | 0},${70 + r() * 30 | 0},${90 + r() * 30 | 0})`; g.fillRect((i * w) / 3 + 3, 6, w / 3 - 6, h - 20); if (r() < 0.5) { m.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.5})`; m.fillRect((i * w) / 3 + 3, 6, w / 3 - 6, h - 20); } }
    g.fillStyle = '#9aa4ae'; g.fillRect(0, h - 14, w, 14); for (let i = 0; i <= 3; i++) g.fillRect((i * w) / 3 - 2, 0, 4, h);
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,0.18)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  },
  helixFacade(g, w, h, r, m) {
    g.fillStyle = '#eceef0'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,128,136,0.45)'; g.lineWidth = 2;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo((i * w) / 4, 0); g.lineTo((i * w) / 4, h); g.stroke(); }
    g.fillStyle = '#1e2a36'; g.fillRect(0, h * 0.38, w, h * 0.4);
    g.fillStyle = 'rgba(160,190,220,0.25)'; g.fillRect(0, h * 0.38, w, h * 0.12);
    for (let i = 0; i < 4; i++) if (r() < 0.6) { m.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.5})`; m.fillRect((i * w) / 4 + 2, h * 0.38, w / 4 - 4, h * 0.4); }
    g.fillStyle = '#9aa2aa'; for (let i = 0; i <= 4; i++) g.fillRect((i * w) / 4 - 2, h * 0.38, 4, h * 0.4);
  },
  townFacade(g, w, h, r, m) {
    g.fillStyle = '#d8c8a8'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 1200, r, 0.08, false);
    g.strokeStyle = 'rgba(120,100,80,0.25)'; for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    windows(g, w, h, { cols: 1, rows: 1, x0: w * 0.3, y0: h * 0.18, ww: w * 0.4, wh: h * 0.58, frame: '#f2ece0', glass: '#2a2a2e', mask: m, lit: 0.6, r });
    g.fillStyle = '#4a5a4a'; g.fillRect(w * 0.18, h * 0.18, w * 0.1, h * 0.58); g.fillRect(w * 0.72, h * 0.18, w * 0.1, h * 0.58);
    g.fillStyle = '#c0b090'; g.fillRect(w * 0.26, h * 0.78, w * 0.48, 8);
  },
  plaster(g, s, r) { g.fillStyle = '#ece6d8'; g.fillRect(0, 0, s, s); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(150,130,100,${0.04 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * s, r() * s, 10 + r() * 40, 6 + r() * 30, r() * 3, 0, Math.PI * 2); g.fill(); } speckle(g, s, s, 600, r, 0.06, false); },
  drystone(g, s, r) {
    g.fillStyle = '#4a443a'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s;) { const hh = 14 + r() * 16; for (let x = -r() * 20; x < s;) { const ww = 22 + r() * 34, v = 130 + r() * 60; g.fillStyle = `rgb(${v | 0},${(v * 0.94) | 0},${(v * 0.84) | 0})`; g.beginPath(); g.roundRect?.(x + 2, y + 2, ww - 4, hh - 4, 5); if (!g.roundRect) g.rect(x + 2, y + 2, ww - 4, hh - 4); g.fill(); x += ww; } y += hh; }
  },
  sandstone(g, s, r) { g.fillStyle = '#d0b890'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(120,96,64,0.4)'; g.lineWidth = 2; for (let y = 0; y < s; y += s / 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); for (let x = ((y / (s / 6)) % 2) * s / 6; x < s; x += s / 3) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + s / 6); g.stroke(); } } speckle(g, s, s, 1400, r, 0.08, false); },
  wattle(g, s, r) { g.fillStyle = '#9a8460'; g.fillRect(0, 0, s, s); for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(90,70,40,${0.3 + r() * 0.3})`; g.fillRect(0, (i * s) / 8 + 2, s, 4); } speckle(g, s, s, 900, r, 0.12, false); },
  wood(g, s, r) { g.fillStyle = '#8a6440'; g.fillRect(0, 0, s, s); for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '40,24,10' : '200,160,110'},${0.1 + r() * 0.12})`; g.fillRect(0, (i * s) / 6, s, s / 6 - 2); } g.strokeStyle = 'rgba(40,24,10,0.25)'; for (let i = 0; i < 40; i++) { const y = r() * s; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(s * 0.3, y + (r() - 0.5) * 6, s * 0.7, y + (r() - 0.5) * 6, s, y); g.stroke(); } },
  slate(g, s, r) { g.fillStyle = '#3a4048'; g.fillRect(0, 0, s, s); for (let j = 0; j < 8; j++) for (let i = 0; i < 6; i++) { const v = 70 + r() * 30; g.fillStyle = `rgb(${v | 0},${(v * 1.05) | 0},${(v * 1.15) | 0})`; g.fillRect(((i + (j % 2) * 0.5) * s) / 6 + 1, (j * s) / 8 + 1, s / 6 - 2, s / 8 - 2); } },
  thatch(g, s, r) { g.fillStyle = '#a88850'; g.fillRect(0, 0, s, s); for (let i = 0; i < 3000; i++) { const v = r(); g.strokeStyle = `rgba(${(140 + v * 90) | 0},${(110 + v * 70) | 0},${(50 + v * 40) | 0},0.5)`; const x = r() * s, y = r() * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 2, y + 6 + r() * 10); g.stroke(); } for (let y = 0; y < s; y += s / 5) { g.fillStyle = 'rgba(60,40,20,0.2)'; g.fillRect(0, y, s, 3); } },
  hide(g, s, r) { g.fillStyle = '#b09068'; g.fillRect(0, 0, s, s); for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(90,60,30,${0.05 + r() * 0.08})`; g.beginPath(); g.ellipse(r() * s, r() * s, 20 + r() * 40, 10 + r() * 30, r() * 3, 0, Math.PI * 2); g.fill(); } g.strokeStyle = 'rgba(70,50,30,0.5)'; g.setLineDash([4, 4]); g.strokeRect(6, 6, s - 12, s - 12); g.setLineDash([]); },
  corrugated(g, s) { const gr = g.createLinearGradient(0, 0, s / 8, 0); gr.addColorStop(0, '#6a7078'); gr.addColorStop(0.5, '#b8c0c8'); gr.addColorStop(1, '#6a7078'); g.fillStyle = gr; for (let x = 0; x < s; x += s / 8) { g.save(); g.translate(x, 0); g.fillRect(0, 0, s / 8, s); g.restore(); } },
  stripe(g, s) { for (let i = -s; i < s * 2; i += s / 2) { g.fillStyle = '#d82a24'; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + s / 4, 0); g.lineTo(i + s / 4 - s, s); g.lineTo(i - s, s); g.fill(); } g.globalCompositeOperation = 'destination-over'; g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, s, s); g.globalCompositeOperation = 'source-over'; },
  // carved glyphs: rows of rings, broken halos, strokes and dots cut in the stone (never letters)
  glyph(g, s, r) {
    g.fillStyle = '#b0a68e'; g.fillRect(0, 0, s, s); speckle(g, s, s, 900, r, 0.1, false);
    g.strokeStyle = 'rgba(50,42,32,0.75)'; g.lineWidth = 4;
    for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) {
      const x = 20 + i * (s - 40) / 4.5, y = 26 + j * (s - 40) / 3.6, k = (r() * 5) | 0;
      g.beginPath();
      if (k === 0) g.arc(x, y, 9, 0, Math.PI * 2);
      else if (k === 1) { g.arc(x, y, 9, 0, Math.PI * 1.6); g.moveTo(x + 13, y - 4); g.lineTo(x + 17, y - 9); }
      else if (k === 2) { g.moveTo(x - 8, y + 8); g.lineTo(x, y - 9); g.lineTo(x + 8, y + 8); }
      else if (k === 3) { g.moveTo(x - 9, y); g.lineTo(x + 9, y); g.moveTo(x, y - 9); g.lineTo(x, y + 9); }
      else { g.arc(x, y, 3, 0, Math.PI * 2); g.moveTo(x + 9, y); g.arc(x + 6, y, 3, 0, Math.PI * 2); }
      g.stroke();
    }
  },
  pictoFire(g, s) { this.glyphPlate(g, s); g.strokeStyle = 'rgba(60,30,14,0.85)'; g.lineWidth = 7; g.beginPath(); g.moveTo(s * 0.5, s * 0.2); g.bezierCurveTo(s * 0.75, s * 0.45, s * 0.7, s * 0.7, s * 0.5, s * 0.8); g.bezierCurveTo(s * 0.3, s * 0.7, s * 0.25, s * 0.45, s * 0.5, s * 0.2); g.stroke(); g.beginPath(); g.moveTo(s * 0.3, s * 0.86); g.lineTo(s * 0.7, s * 0.86); g.stroke(); },
  pictoWater(g, s) { this.glyphPlate(g, s); g.strokeStyle = 'rgba(30,40,60,0.85)'; g.lineWidth = 7; for (let k = 0; k < 3; k++) { g.beginPath(); for (let i = 0; i <= 8; i++) { const x = s * 0.15 + (i * s * 0.7) / 8, y = s * (0.32 + k * 0.18) + Math.sin(i * 1.6) * 8; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } },
  pictoRing(g, s) { this.glyphPlate(g, s); g.strokeStyle = 'rgba(40,30,20,0.9)'; g.lineWidth = 9; g.beginPath(); g.arc(s * 0.5, s * 0.52, s * 0.24, -0.2, Math.PI * 1.55); g.stroke(); g.lineWidth = 6; g.beginPath(); g.arc(s * 0.5, s * 0.52, s * 0.34, -1.2, -0.5); g.stroke(); },
  glyphPlate(g, s) { g.fillStyle = '#b0a68e'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(70,60,46,0.6)'; g.lineWidth = 6; g.strokeRect(8, 8, s - 16, s - 16); },
  skyFloor(g, s, r) { g.fillStyle = '#4a4434'; g.fillRect(0, 0, s, s); for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(240,230,190,${0.5 + r() * 0.5})`; g.beginPath(); g.arc(r() * s, r() * s, 1 + r() * 3, 0, Math.PI * 2); g.fill(); } g.strokeStyle = '#e8c070'; g.lineWidth = 4; g.beginPath(); g.arc(s * 0.7, s * 0.3, 10, 0, Math.PI * 2); g.stroke(); },
  mural(g, s, r) {
    g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, s, s);
    const col = ['#a8442a', '#2a5a7a', '#c89a3a', '#3a3a32'];
    for (let i = 0; i < 6; i++) { g.strokeStyle = col[i % 4]; g.lineWidth = 6; g.beginPath(); g.arc(s * (0.15 + i * 0.14), s * 0.6, 14, 0, Math.PI * 2); g.moveTo(s * (0.15 + i * 0.14), s * 0.66); g.lineTo(s * (0.15 + i * 0.14), s * 0.86); g.stroke(); }
    g.strokeStyle = '#2a5a7a'; g.lineWidth = 8; g.beginPath(); for (let i = 0; i <= 10; i++) g.lineTo((i * s) / 10, s * 0.3 + Math.sin(i) * 10); g.stroke();
    g.fillStyle = 'rgba(232,224,204,0.45)'; for (let i = 0; i < 12; i++) g.fillRect(r() * s, r() * s, 40 + r() * 80, 20 + r() * 50);
  },
  // Northbank: pale limestone ashlar, a tall window with shutters each bay
  stoneFacade(g, w, h, r, m) {
    g.fillStyle = '#e2dccc'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,110,90,0.3)'; g.lineWidth = 1;
    for (let y = 0; y < h; y += 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = ((y / 14) % 2) * 20; x < w; x += 40) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 14); g.stroke(); } }
    speckle(g, w, h, 900, r, 0.07, false);
    windows(g, w, h, { cols: 1, rows: 1, x0: w * 0.32, y0: h * 0.14, ww: w * 0.36, wh: h * 0.64, frame: '#f4f0e8', glass: '#28303a', mask: m, lit: 0.5, r });
    g.fillStyle = '#5a7a8a'; g.fillRect(w * 0.18, h * 0.14, w * 0.12, h * 0.64); g.fillRect(w * 0.7, h * 0.14, w * 0.12, h * 0.64);
    g.fillStyle = '#cfc6b2'; g.fillRect(w * 0.26, h * 0.8, w * 0.48, 7); g.fillRect(0, h - 8, w, 8);
  },
  // the hospital: white render with a long ribbon window each storey
  renderFacade(g, w, h, r, m) {
    g.fillStyle = '#f6f6f2'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 500, r, 0.04, false);
    g.fillStyle = '#26303a'; g.fillRect(0, h * 0.3, w, h * 0.4);
    g.fillStyle = 'rgba(180,210,230,0.22)'; g.fillRect(0, h * 0.3, w, h * 0.12);
    for (let i = 0; i < 6; i++) if (r() < 0.55) { m.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.4})`; m.fillRect((i * w) / 6 + 2, h * 0.3, w / 6 - 4, h * 0.4); }
    g.fillStyle = '#c8ccd0'; for (let i = 0; i <= 6; i++) g.fillRect((i * w) / 6 - 1.5, h * 0.3, 3, h * 0.4);
    g.fillStyle = '#e4e6e4'; g.fillRect(0, h * 0.7, w, 5);
  },
  // the desert: wind ripples in ochre sand
  sand(g, s, r) {
    g.fillStyle = '#c8a070'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(${r() < 0.5 ? '255,236,200' : '120,86,50'},${0.12 + r() * 0.12})`; g.lineWidth = 2 + r() * 3; g.beginPath(); const y = r() * s; g.moveTo(0, y); for (let x = 0; x <= s; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 5); g.stroke(); }
    speckle(g, s, s, 2200, r, 0.1, false); speckle(g, s, s, 1200, r, 0.1);
  },
  // the salt plain: a white crust broken into polygons, with a faint wet sheen
  salt(g, s, r) {
    g.fillStyle = '#f2f0ee'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(190,184,200,0.55)'; g.lineWidth = 2;
    const pts = []; for (let i = 0; i < 26; i++) pts.push([r() * s, r() * s]);
    for (const [x, y] of pts) { g.beginPath(); const n = 6, rr = 14 + r() * 18; for (let k = 0; k <= n; k++) { const a = (k / n) * Math.PI * 2 + r() * 0.3; k ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.stroke(); }
    speckle(g, s, s, 900, r, 0.05, false);
  },
  // stadium seats: rows of moulded seats
  seats(g, w, h, r) {
    g.fillStyle = '#8a8488'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += h / 4) for (let x = 0; x < w; x += w / 8) { g.fillStyle = `rgba(255,255,255,${0.75 + r() * 0.25})`; g.fillRect(x + 3, y + 6, w / 8 - 6, h / 4 - 14); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + 3, y + h / 4 - 10, w / 8 - 6, 4); }
  },
  tally(g, s, r) { g.fillStyle = '#e8e0d0'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(50,40,30,0.85)'; g.lineWidth = 4; for (let k = 0; k < 3; k++) { const x0 = 20 + k * 74; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x0 + i * 12, 70 + r() * 6); g.lineTo(x0 + i * 12 + 2, 150); g.stroke(); } g.beginPath(); g.moveTo(x0 - 6, 140); g.lineTo(x0 + 46, 82); g.stroke(); } },
  // --- (closing: visuals) props you can tell apart, and the facades the critic found blank ------------------------------
  // a wooden crate's face: planks across with their grain and knots, a frame of battens, the diagonal brace, nails, a stencil
  crate(g, s, r) {
    g.fillStyle = '#7a5630'; g.fillRect(0, 0, s, s);
    const n = 6, ph = s / n;
    for (let i = 0; i < n; i++) {
      const v = 0.82 + r() * 0.3;
      g.fillStyle = `rgb(${(176 * v) | 0},${(132 * v) | 0},${(84 * v) | 0})`;
      g.fillRect(0, i * ph + 1.5, s, ph - 3);
      g.strokeStyle = 'rgba(70,44,20,0.3)'; g.lineWidth = 1;
      for (let k = 0; k < 5; k++) { const y = i * ph + 3 + r() * (ph - 6); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(s * 0.35, y + (r() - 0.5) * 5, s * 0.65, y + (r() - 0.5) * 5, s, y + (r() - 0.5) * 3); g.stroke(); }
      if (r() < 0.5) { g.fillStyle = 'rgba(60,36,16,0.55)'; g.beginPath(); g.ellipse(r() * s, i * ph + ph / 2, 3 + r() * 3, 2, 0, 0, Math.PI * 2); g.fill(); }
    }
    const b = s * 0.12;
    const batten = (x, y, w, h) => { g.fillStyle = '#86603a'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(255,230,190,0.16)'; g.fillRect(x, y, w, 2); g.fillStyle = 'rgba(30,16,6,0.5)'; g.fillRect(x, y + h - 2, w, 2); };
    g.save(); g.translate(s / 2, s / 2); g.rotate(-Math.PI / 4); batten(-s * 0.72, -b / 2, s * 1.44, b); g.restore();
    batten(0, 0, s, b); batten(0, s - b, s, b); batten(0, 0, b, s); batten(s - b, 0, b, s);
    g.strokeStyle = 'rgba(30,16,6,0.6)'; g.lineWidth = 2; g.strokeRect(b, b, s - 2 * b, s - 2 * b);
    g.fillStyle = '#2a2622';
    for (const [x, y] of [[b / 2, b / 2], [s - b / 2, b / 2], [b / 2, s - b / 2], [s - b / 2, s - b / 2], [s / 2, b / 2], [s / 2, s - b / 2], [b / 2, s / 2], [s - b / 2, s / 2]]) { g.beginPath(); g.arc(x, y, 2.4, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(28,24,20,0.5)'; g.font = `bold ${(s * 0.085) | 0}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(['FRAGILE', 'THIS WAY UP', 'No. 41', 'KEEP DRY'][(r() * 4) | 0], s * 0.5, s * 0.3);
    speckle(g, s, s, 600, r, 0.08, false);
  },
  // a cardboard box: brown board, packing tape across, printed arrows and a label
  cardboard(g, s, r) {
    g.fillStyle = '#b8895a'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '90,60,30' : '230,200,160'},${0.04 + r() * 0.05})`; g.fillRect(0, r() * s, s, 1 + r() * 2); }
    g.fillStyle = 'rgba(214,194,150,0.9)'; g.fillRect(0, s * 0.44, s, s * 0.12);
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(0, s * 0.44, s, 3);
    g.strokeStyle = 'rgba(40,30,20,0.72)'; g.lineWidth = 4;
    for (const x of [s * 0.15, s * 0.27]) { g.beginPath(); g.moveTo(x, s * 0.32); g.lineTo(x, s * 0.14); g.moveTo(x - 8, s * 0.22); g.lineTo(x, s * 0.13); g.lineTo(x + 8, s * 0.22); g.stroke(); }
    g.fillStyle = '#f4f0e6'; g.fillRect(s * 0.56, s * 0.66, s * 0.34, s * 0.2);
    g.fillStyle = 'rgba(40,40,40,0.8)'; for (let k = 0; k < 4; k++) g.fillRect(s * 0.6, s * 0.69 + k * s * 0.04, s * (0.12 + r() * 0.14), 2);
    g.strokeStyle = 'rgba(80,56,30,0.6)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, s - 3, s - 3);
    speckle(g, s, s, 700, r, 0.07, false);
  },
  // an aid crate of moulded plastic: ribs, a rim, a handle slot, a white band with its mark
  aidCrate(g, s, r) {
    g.fillStyle = '#3a6a9a'; g.fillRect(0, 0, s, s);
    for (let x = s * 0.07; x < s - 6; x += s * 0.13) { g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x, s * 0.08, 4, s * 0.84); g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(x + 4, s * 0.08, 3, s * 0.84); }
    g.fillStyle = '#2c5680'; g.fillRect(0, 0, s, s * 0.08); g.fillRect(0, s * 0.92, s, s * 0.08);
    g.fillStyle = '#122436'; g.fillRect(s * 0.38, s * 0.12, s * 0.24, s * 0.07);
    g.fillStyle = '#eef0ec'; g.fillRect(s * 0.1, s * 0.42, s * 0.8, s * 0.26);
    g.fillStyle = '#c83a2a'; g.fillRect(s * 0.16, s * 0.48, s * 0.06, s * 0.14); g.fillRect(s * 0.12, s * 0.52, s * 0.14, s * 0.06);
    g.fillStyle = '#24486e'; g.font = `bold ${(s * 0.12) | 0}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('RELIEF', s * 0.57, s * 0.555);
    speckle(g, s, s, 600, r, 0.1, false); speckle(g, s, s, 300, r, 0.08);
  },
  // painted panels: four to a tile, seams, screws at the corners, scuffs (the tint is the paint)
  panel(g, s, r) {
    g.fillStyle = '#dcdee0'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const v = 0.93 + r() * 0.07; g.fillStyle = `rgb(${(255 * v) | 0},${(255 * v) | 0},${(255 * v) | 0})`; g.fillRect(i * s / 2 + 3, j * s / 2 + 3, s / 2 - 6, s / 2 - 6); }
    g.strokeStyle = 'rgba(40,44,50,0.6)'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(s / 2, 0); g.lineTo(s / 2, s); g.moveTo(0, s / 2); g.lineTo(s, s / 2); g.stroke();
    g.strokeRect(1, 1, s - 2, s - 2);
    g.fillStyle = 'rgba(60,64,70,0.75)';
    for (const x of [9, s / 2 - 9, s / 2 + 9, s - 9]) for (const y of [9, s / 2 - 9, s / 2 + 9, s - 9]) { g.beginPath(); g.arc(x, y, 2, 0, Math.PI * 2); g.fill(); }
    for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(60,60,60,${0.05 + r() * 0.09})`; g.lineWidth = 1 + r() * 2; const x = r() * s, y = r() * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 6); g.stroke(); }
    for (let i = 0; i < 4; i++) { const x = r() * s, gr = g.createLinearGradient(0, s / 2, 0, s / 2 + 40); gr.addColorStop(0, 'rgba(70,60,50,0.18)'); gr.addColorStop(1, 'rgba(70,60,50,0)'); g.fillStyle = gr; g.fillRect(x, s / 2, 3 + r() * 4, 40); }
  },
  // canvas: the weave, a seam with its stitching, stains and a patch (tents, a stall's cover)
  canvas(g, s, r) {
    g.fillStyle = '#e6dfce'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 2) { g.fillStyle = `rgba(120,110,90,${0.05 + r() * 0.06})`; g.fillRect(0, y, s, 1); }
    for (let x = 0; x < s; x += 2) { g.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.05})`; g.fillRect(x, 0, 1, s); }
    g.strokeStyle = 'rgba(90,80,60,0.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, s * 0.5); g.lineTo(s, s * 0.5); g.stroke();
    g.setLineDash([3, 3]); g.strokeStyle = 'rgba(70,60,40,0.6)'; g.lineWidth = 1;
    for (const y of [s * 0.5 - 4, s * 0.5 + 4]) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); }
    g.setLineDash([]);
    for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(110,90,60,${0.05 + r() * 0.08})`; g.beginPath(); g.ellipse(r() * s, r() * s, 10 + r() * 30, 6 + r() * 20, r() * 3, 0, Math.PI * 2); g.fill(); }
    const px = 20 + r() * s * 0.5, py = 20 + r() * s * 0.3;
    g.fillStyle = 'rgba(150,140,110,0.55)'; g.fillRect(px, py, 44, 32);
    g.setLineDash([2, 2]); g.strokeStyle = 'rgba(60,50,40,0.7)'; g.strokeRect(px, py, 44, 32); g.setLineDash([]);
  },
  // 2196's curtain wall: a slab at the foot of the storey with moss along it and stains running down, two panes a bay,
  // each gone (the dark inside, shards at the frame), still glazed and filthy (a crack), or a garden pressing at the frame;
  // creepers across the whole of it
  ruinFacade(g, w, h, r) {
    g.fillStyle = '#767a70'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 1500, r, 0.12, false);
    const slab = h * 0.16;
    for (let i = 0; i < 2; i++) {
      const x0 = 12 + (i * (w - 16)) / 2, x1 = x0 + (w - 16) / 2 - 10, y0 = 8, y1 = h - slab - 6, k = r();
      if (k < 0.45) {
        g.fillStyle = '#101410'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
        g.fillStyle = 'rgba(70,78,64,0.7)'; g.fillRect(x0, y0, x1 - x0, 9);
        g.fillStyle = 'rgba(40,46,36,0.9)'; g.fillRect(x0 + (x1 - x0) * 0.6, y0 + 12, 8, y1 - y0 - 12); // a column inside
        g.fillStyle = 'rgba(160,190,180,0.6)';
        for (let q = 0; q < 4; q++) { const sx = x0 + 6 + r() * (x1 - x0 - 12); g.beginPath(); g.moveTo(sx - 7, y0); g.lineTo(sx + 7, y0); g.lineTo(sx + (r() - 0.5) * 10, y0 + 10 + r() * 34); g.fill(); }
      } else if (k < 0.72) {
        const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#6e7e74'); gr.addColorStop(0.5, '#34423c'); gr.addColorStop(1, '#5a6a60');
        g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
        g.fillStyle = 'rgba(80,70,40,0.25)'; g.fillRect(x0, y1 - 30, x1 - x0, 30); // grime up from the sill
        g.strokeStyle = 'rgba(220,230,220,0.4)'; g.lineWidth = 1; g.beginPath();
        const cx = x0 + r() * (x1 - x0), cy = y0 + r() * (y1 - y0);
        for (let q = 0; q < 6; q++) { g.moveTo(cx, cy); g.lineTo(cx + (r() - 0.5) * 70, cy + (r() - 0.5) * 70); }
        g.stroke();
      } else {
        g.fillStyle = '#16200e'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
        for (let q = 0; q < 110; q++) { const v = r(); g.fillStyle = `rgba(${(40 + v * 60) | 0},${(84 + v * 84) | 0},${(28 + v * 30) | 0},0.92)`; g.beginPath(); g.ellipse(x0 + r() * (x1 - x0), y0 + (y1 - y0) * (0.2 + r() * 0.8), 3 + r() * 7, 2 + r() * 4, r() * 3, 0, Math.PI * 2); g.fill(); }
      }
      g.strokeStyle = '#3e423c'; g.lineWidth = 4; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
    }
    g.fillStyle = '#8a8c82'; g.fillRect(0, h - slab, w, slab);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, h - slab, w, 3);
    for (let i = 0; i < 46; i++) { g.fillStyle = `rgba(${(56 + r() * 30) | 0},${(92 + r() * 46) | 0},40,${0.55 + r() * 0.4})`; g.beginPath(); g.ellipse(r() * w, h - slab + 1, 4 + r() * 12, 3 + r() * 5, 0, 0, Math.PI * 2); g.fill(); }
    for (let i = 0; i < 16; i++) { const x = r() * w, len = 24 + r() * 70, gr = g.createLinearGradient(0, 0, 0, len); gr.addColorStop(0, 'rgba(46,56,36,0.42)'); gr.addColorStop(1, 'rgba(46,56,36,0)'); g.fillStyle = gr; g.fillRect(x, 0, 2 + r() * 5, len); }
    g.fillStyle = '#7e8278'; g.fillRect(0, 0, 8, h); g.fillRect(w - 8, 0, 8, h);
    for (let t = 0; t < 3; t++) {
      const pts = [];
      let x = r() * w, y = 0;
      for (let q = 0; q <= 14; q++) { pts.push([x, y]); x += (r() - 0.5) * 20; y += h / 14; }
      g.strokeStyle = 'rgba(58,74,36,0.9)'; g.lineWidth = 2.5; g.beginPath(); pts.forEach(([px, py], q) => (q ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke();
      for (const [px, py] of pts) for (let q = 0; q < 3; q++) { const v = r(); g.fillStyle = `rgba(${(50 + v * 50) | 0},${(96 + v * 70) | 0},${(30 + v * 24) | 0},0.95)`; g.beginPath(); g.ellipse(px + (r() - 0.5) * 12, py + (r() - 0.5) * 10, 3 + r() * 4, 2 + r() * 3, r() * 3, 0, Math.PI * 2); g.fill(); }
    }
  },
  // vines hanging in a sheet: a leafy mass along the top, strands of leaves falling to ragged ends (cut out: the clear
  // ground between them is not drawn). Fitted to each sheet, so every sheet hangs from its ledge
  vineSheet(g, w, h, r) {
    g.clearRect(0, 0, w, h);
    const leafAt = (x, y, k) => { const v = r(); g.fillStyle = `rgb(${(36 + v * 50) | 0},${(70 + v * 70) | 0},${(24 + v * 26) | 0})`; g.beginPath(); g.ellipse(x, y, (3 + r() * 5) * k, (2 + r() * 3) * k, r() * 3, 0, Math.PI * 2); g.fill(); };
    for (let i = 0; i < 520; i++) leafAt(r() * w, r() * h * 0.12, 1.3);
    for (let t = 0; t < 22; t++) {
      let x = (t + r()) * (w / 22), y = h * 0.06;
      const end = h * (0.35 + r() * 0.63);
      g.strokeStyle = 'rgb(52,62,32)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y);
      const pts = [];
      while (y < end) { x += (r() - 0.5) * 5; y += 6; g.lineTo(x, y); pts.push([x, y]); }
      g.stroke();
      for (const [px, py] of pts) { const k = 1.15 - (py / h) * 0.5; for (let q = 0; q < 3; q++) leafAt(px + (r() - 0.5) * 12, py + (r() - 0.5) * 6, k); }
    }
  },
  // 2196's podiums at the waterline: concrete gone green, the old shopfronts dark behind rusted shutters, moss in bands
  ruinPodium(g, w, h, r) {
    g.fillStyle = '#6e7466'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 1800, r, 0.12, false); speckle(g, w, h, 600, r, 0.06);
    for (let i = 0; i < 2; i++) {
      const x0 = 14 + (i * w) / 2, x1 = x0 + w / 2 - 28, y0 = h * 0.22, y1 = h * 0.94;
      g.fillStyle = '#121610'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      const up = (y1 - y0) * (0.25 + r() * 0.5);
      for (let y = y0; y < y0 + up; y += 6) { g.fillStyle = y % 12 < 6 ? '#7a4a2a' : '#5a3a22'; g.fillRect(x0, y, x1 - x0, 6); }
      g.fillStyle = 'rgba(30,20,10,0.4)'; for (let q = 0; q < 8; q++) g.fillRect(x0 + r() * (x1 - x0), y0, 2, up);
      g.strokeStyle = '#4a4e44'; g.lineWidth = 5; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
    }
    g.fillStyle = 'rgba(70,96,46,0.55)'; for (let q = 0; q < 70; q++) { g.beginPath(); g.ellipse(r() * w, h * 0.16 + r() * 8, 4 + r() * 12, 2 + r() * 5, 0, 0, Math.PI * 2); g.fill(); }
    for (let i = 0; i < 14; i++) { const x = r() * w, len = 30 + r() * 80, gr = g.createLinearGradient(0, h * 0.16, 0, h * 0.16 + len); gr.addColorStop(0, 'rgba(40,52,30,0.45)'); gr.addColorStop(1, 'rgba(40,52,30,0)'); g.fillStyle = gr; g.fillRect(x, h * 0.16, 2 + r() * 6, len); }
    g.fillStyle = 'rgba(30,36,24,0.35)'; g.fillRect(0, h * 0.92, w, h * 0.08);
  },
  // 2049's and 2026's podiums: a fascia band, shop windows lit from inside with their mullions and doors, columns
  podiumFacade(g, w, h, r, m) {
    g.fillStyle = '#b8b4aa'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 900, r, 0.08, false);
    const cols = ['#2a4a6a', '#6a2a2a', '#2a5a3a', '#3a3a42', '#7a5a2a'];
    g.fillStyle = cols[(r() * cols.length) | 0]; g.fillRect(0, h * 0.06, w, h * 0.14);
    g.fillStyle = 'rgba(255,240,210,0.85)'; for (let q = 0; q < 2; q++) g.fillRect(w * (0.1 + q * 0.5), h * 0.1, w * (0.12 + r() * 0.18), h * 0.06);
    for (let i = 0; i < 2; i++) {
      const x0 = 10 + (i * w) / 2, x1 = x0 + w / 2 - 20, y0 = h * 0.26, y1 = h * 0.96;
      g.fillStyle = '#2a3036'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      g.fillStyle = 'rgba(200,190,170,0.35)'; for (let q = 0; q < 3; q++) g.fillRect(x0 + 4, y0 + (y1 - y0) * (0.3 + q * 0.22), x1 - x0 - 8, 3); // shelves inside
      g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(x0, y0, x1 - x0, (y1 - y0) * 0.3);
      g.fillStyle = '#5a5e62'; for (let q = 0; q <= 3; q++) g.fillRect(x0 + ((x1 - x0) * q) / 3 - 2, y0, 4, y1 - y0);
      if (m) { m.fillStyle = `rgba(255,255,255,${0.55 + r() * 0.4})`; m.fillRect(x0, y0, x1 - x0, y1 - y0); }
    }
    g.fillStyle = '#9a968e'; g.fillRect(0, 0, 8, h); g.fillRect(w - 8, 0, 8, h);
  },
  // the stadium's precast walls: ribbed panels, the club's stripe faded, tags and a mural, water stains
  stadiumWall(g, w, h, r) {
    g.fillStyle = '#bcb6aa'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 1600, r, 0.08, false);
    for (let x = 0; x < w; x += w / 8) { g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x + 2, 0, 5, h); g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(x + 7, 0, 4, h); }
    g.strokeStyle = 'rgba(60,56,50,0.5)'; g.lineWidth = 2; for (const y of [h * 0.5, h - 1]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = 'rgba(176,60,52,0.55)'; g.fillRect(0, h * 0.62, w, h * 0.08); g.fillStyle = 'rgba(52,80,150,0.5)'; g.fillRect(0, h * 0.7, w, h * 0.05);
    const tag = ['#d84a8a', '#3ab0d0', '#e8c040', '#5ac06a', '#f06a3a', '#9a6ad8'];
    for (let t = 0; t < 5; t++) {
      g.strokeStyle = tag[(r() * tag.length) | 0]; g.lineWidth = 3 + r() * 3; g.lineCap = 'round';
      const x = r() * w * 0.85, y = h * (0.78 + r() * 0.14);
      g.beginPath(); g.moveTo(x, y);
      for (let q = 0; q < 6; q++) g.quadraticCurveTo(x + q * 9 + r() * 10, y - 18 + r() * 36, x + q * 12 + 10, y + (r() - 0.5) * 14);
      g.stroke();
    }
    g.lineCap = 'butt';
    for (let i = 0; i < 12; i++) { const x = r() * w, len = 30 + r() * 90, gr = g.createLinearGradient(0, h * 0.5, 0, h * 0.5 + len); gr.addColorStop(0, 'rgba(70,64,52,0.3)'); gr.addColorStop(1, 'rgba(70,64,52,0)'); g.fillStyle = gr; g.fillRect(x, h * 0.5, 2 + r() * 6, len); }
  },
  // a house on the tiers: a plastered wall, a painted door, a window with its shutters and a box of flowers
  shack(g, s, r) {
    g.fillStyle = '#ece4d6'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(150,130,100,${0.05 + r() * 0.08})`; g.beginPath(); g.ellipse(r() * s, r() * s, 8 + r() * 30, 6 + r() * 20, r() * 3, 0, Math.PI * 2); g.fill(); }
    const door = ['#3a6a8a', '#8a3a3a', '#4a7a4a', '#c89a3a', '#6a4a7a'][(r() * 5) | 0];
    g.fillStyle = door; g.fillRect(s * 0.1, s * 0.3, s * 0.26, s * 0.7);
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; g.strokeRect(s * 0.13, s * 0.34, s * 0.2, s * 0.28); g.strokeRect(s * 0.13, s * 0.66, s * 0.2, s * 0.28);
    g.fillStyle = '#d8c060'; g.beginPath(); g.arc(s * 0.32, s * 0.66, 3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2a2e34'; g.fillRect(s * 0.5, s * 0.3, s * 0.3, s * 0.28);
    g.fillStyle = 'rgba(200,220,230,0.25)'; g.fillRect(s * 0.5, s * 0.3, s * 0.3, s * 0.1);
    g.strokeStyle = '#e8e0d0'; g.lineWidth = 3; g.strokeRect(s * 0.5, s * 0.3, s * 0.3, s * 0.28); g.beginPath(); g.moveTo(s * 0.65, s * 0.3); g.lineTo(s * 0.65, s * 0.58); g.stroke();
    g.fillStyle = door; g.fillRect(s * 0.42, s * 0.29, s * 0.07, s * 0.3); g.fillRect(s * 0.81, s * 0.29, s * 0.07, s * 0.3);
    g.fillStyle = '#7a5a3a'; g.fillRect(s * 0.48, s * 0.6, s * 0.34, s * 0.06);
    for (let q = 0; q < 8; q++) { g.fillStyle = ['#e8506a', '#f0d040', '#f4f0f0', '#5aa04a'][(r() * 4) | 0]; g.beginPath(); g.arc(s * (0.5 + r() * 0.3), s * (0.58 + r() * 0.03), 3 + r() * 3, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(60,50,40,0.25)'; g.fillRect(0, s * 0.94, s, s * 0.06);
  },
  // a house of the suburbs: render with one window a bay, its sill and curtains, a downpipe
  houseFacade(g, w, h, r, m) {
    g.fillStyle = '#e4dccc'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 900, r, 0.07, false);
    windows(g, w, h, { cols: 1, rows: 1, x0: w * 0.3, y0: h * 0.2, ww: w * 0.4, wh: h * 0.5, frame: '#f4f0e8', glass: '#2a3038', mask: m, lit: 0.45, r });
    g.fillStyle = 'rgba(200,120,110,0.5)'; g.fillRect(w * 0.3, h * 0.2, w * 0.08, h * 0.5); g.fillRect(w * 0.62, h * 0.2, w * 0.08, h * 0.5);
    g.fillStyle = '#c8bca8'; g.fillRect(w * 0.27, h * 0.72, w * 0.46, 7);
    g.fillStyle = '#5a5e62'; g.fillRect(w * 0.94, 0, 5, h);
    g.fillStyle = 'rgba(80,70,60,0.2)'; g.fillRect(0, h - 10, w, 10);
  },
  // a shop's shelves: four shelves of goods in their colours
  shelves(g, s, r) {
    g.fillStyle = '#e8e4dc'; g.fillRect(0, 0, s, s);
    const cols = ['#d84a3a', '#3a7ac8', '#e8c040', '#5aa04a', '#f4f0e8', '#8a5ac0', '#e88a3a', '#2a2e34'];
    for (let j = 0; j < 4; j++) {
      const y = (j * s) / 4, sh = s / 4;
      g.fillStyle = '#b8b0a4'; g.fillRect(0, y + sh - 7, s, 7);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, y + sh - 1, s, 2);
      for (let x = 4; x < s - 10;) {
        const w = 8 + r() * 18, hh = sh * (0.4 + r() * 0.45);
        g.fillStyle = cols[(r() * cols.length) | 0]; g.fillRect(x, y + sh - 7 - hh, w - 2, hh);
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 2, y + sh - 7 - hh * 0.7, w - 6, hh * 0.2);
        x += w;
      }
    }
    g.fillStyle = '#9a948a'; g.fillRect(0, 0, 4, s); g.fillRect(s - 4, 0, 4, s);
  },
  // a washing machine's front: the control strip with its dial, the round door with its dark glass and chrome ring
  washer(g, s, r) {
    g.fillStyle = '#eef0f0'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#d4d8da'; g.fillRect(0, 0, s, s * 0.2);
    g.fillStyle = '#2a2e34'; g.fillRect(s * 0.08, s * 0.06, s * 0.36, s * 0.08);
    g.fillStyle = '#7fe0a8'; g.fillRect(s * 0.1, s * 0.08, s * 0.12, s * 0.04);
    g.fillStyle = '#9aa0a6'; g.beginPath(); g.arc(s * 0.78, s * 0.1, s * 0.06, 0, Math.PI * 2); g.fill();
    const cx = s * 0.5, cy = s * 0.58, R = s * 0.3;
    g.fillStyle = '#b8bec4'; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    const gr = g.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 2, cx, cy, R * 0.8);
    gr.addColorStop(0, '#5a6a7a'); gr.addColorStop(1, '#1a2028');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R * 0.78, 0, Math.PI * 2); g.fill();
    g.fillStyle = `rgba(${r() < 0.5 ? '200,60,60' : '60,90,200'},0.6)`; g.beginPath(); g.ellipse(cx, cy + R * 0.35, R * 0.5, R * 0.22, 0, 0, Math.PI); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.ellipse(cx - R * 0.3, cy - R * 0.35, R * 0.22, R * 0.1, -0.6, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(60,64,70,0.4)'; g.lineWidth = 2; g.strokeRect(1, 1, s - 2, s - 2);
  },
  // a ceiling of light panels in a dark grid (drawn unlit: the panels are the light)
  lightGrid(g, s, r) {
    g.fillStyle = '#4a4c50'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const x = (i * s) / 2 + 10, y = (j * s) / 2 + 10, k = 0.9 + r() * 0.1;
      g.fillStyle = `rgb(${(255 * k) | 0},${(252 * k) | 0},${(246 * k) | 0})`; g.fillRect(x, y, s / 2 - 20, s / 2 - 20);
      g.strokeStyle = 'rgba(160,160,160,0.6)'; g.lineWidth = 1; for (let q = 1; q < 4; q++) { g.beginPath(); g.moveTo(x + ((s / 2 - 20) * q) / 4, y); g.lineTo(x + ((s / 2 - 20) * q) / 4, y + s / 2 - 20); g.stroke(); }
    }
  },
  // Helix's security barrier: a steel frame, glass leaves, the company's band and a hazard stripe at the foot
  barrierFace(g, s, r) {
    g.fillStyle = '#5a626c'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2; i++) {
      const x = 8 + (i * (s - 16)) / 2;
      const gr = g.createLinearGradient(x, 0, x + (s - 16) / 2, s); gr.addColorStop(0, '#a8c4d8'); gr.addColorStop(0.5, '#6a8aa0'); gr.addColorStop(1, '#94b0c4');
      g.fillStyle = gr; g.fillRect(x + 4, s * 0.14, (s - 16) / 2 - 8, s * 0.6);
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x + 6, s * 0.14, 4, s * 0.58);
    }
    g.fillStyle = '#e8ecf0'; g.fillRect(0, s * 0.02, s, s * 0.08);
    g.fillStyle = '#c84a2a'; g.font = `bold ${(s * 0.06) | 0}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HELIX SECURITY - STOP', s * 0.5, s * 0.06);
    for (let x = -s; x < s * 2; x += 24) { g.fillStyle = '#e8b830'; g.beginPath(); g.moveTo(x, s * 0.78); g.lineTo(x + 12, s * 0.78); g.lineTo(x + 12 - 20, s); g.lineTo(x - 20, s); g.fill(); }
    g.fillStyle = 'rgba(20,20,20,0.85)'; for (let x = -s + 12; x < s * 2; x += 24) { g.beginPath(); g.moveTo(x, s * 0.78); g.lineTo(x + 12, s * 0.78); g.lineTo(x + 12 - 20, s); g.lineTo(x - 20, s); g.fill(); }
    g.strokeStyle = '#3a4048'; g.lineWidth = 4; g.strokeRect(2, 2, s - 4, s - 4);
  },
  // Chamber One's walls as a child remembers them: white panels, thin grey seams, a vent in some
  chamberPanel(g, s, r) {
    g.fillStyle = '#f2f4f6'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(120,128,140,0.55)'; g.lineWidth = 2;
    g.strokeRect(1, 1, s - 2, s - 2); g.beginPath(); g.moveTo(s / 2, 0); g.lineTo(s / 2, s); g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(2, s - 18, s - 4, 16);
    if (r() < 0.7) { g.fillStyle = '#c8ccd2'; g.fillRect(s * 0.62, s * 0.7, s * 0.26, s * 0.12); g.fillStyle = '#9aa0a8'; for (let q = 0; q < 5; q++) g.fillRect(s * 0.63, s * 0.715 + q * s * 0.02, s * 0.24, 2); }
  },
  // its floor: dark tiles, a lighter grout grid, a gloss
  chamberGrid(g, s, r) {
    g.fillStyle = '#2a2e36'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${r() * 0.05})`; g.fillRect((i * s) / 4 + 2, (j * s) / 4 + 2, s / 4 - 4, s / 4 - 4); }
    g.strokeStyle = 'rgba(150,170,200,0.45)'; g.lineWidth = 2;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo((i * s) / 4, 0); g.lineTo((i * s) / 4, s); g.moveTo(0, (i * s) / 4); g.lineTo(s, (i * s) / 4); g.stroke(); }
  },
  // rain as streaks on a clear ground (the court's falling rain, its bright head below its tail; the surface scrolls down)
  rainStreaks(g, w, h, r) { this.streaks(g, w, h, r, false); },
  // the rising rain: the head above the tail (the surface scrolls up)
  rainRise(g, w, h, r) { this.streaks(g, w, h, r, true); },
  streaks(g, w, h, r, up) {
    g.clearRect(0, 0, w, h);
    for (let i = 0; i < 80; i++) {
      const x = r() * w, y = r() * h, len = 18 + r() * 44, a = 0.4 + r() * 0.6;
      for (const oy of [y, y - h]) {
        const gr = g.createLinearGradient(0, oy, 0, oy + len);
        gr.addColorStop(0, `rgba(255,255,255,${up ? a : 0})`); gr.addColorStop(up ? 0.3 : 0.7, `rgba(255,255,255,${a})`); gr.addColorStop(1, `rgba(255,255,255,${up ? 0 : a * 0.9})`);
        g.fillStyle = gr; g.fillRect(x, oy, 1.6 + r() * 0.8, len);
      }
      if (r() < 0.25) { g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.arc(x + 1, up ? y : y + len, 1.6, 0, Math.PI * 2); g.fill(); } // a drop
    }
  },
  // 2026's site hoarding round the chamber's concrete half: plywood boards, a printed band, posters
  hoarding(g, w, h, r) {
    g.fillStyle = '#b89a6a'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += w / 5) { g.fillStyle = `rgba(${r() < 0.5 ? '255,240,210' : '90,60,30'},${0.06 + r() * 0.08})`; g.fillRect(x, 0, w / 5, h); g.fillStyle = 'rgba(60,40,20,0.5)'; g.fillRect(x, 0, 2, h); }
    g.fillStyle = '#1e3a6a'; g.fillRect(0, h * 0.1, w, h * 0.3);
    g.fillStyle = '#f4f4f0'; g.font = `bold ${(h * 0.14) | 0}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HELIX TEMPORAL RESEARCH - CHAMBER ONE', w * 0.5, h * 0.25);
    for (let q = 0; q < 3; q++) { const x = w * (0.08 + q * 0.32) + r() * 10; g.fillStyle = ['#e8d8b0', '#d8e0e8', '#f0c8b0'][q]; g.fillRect(x, h * 0.5, w * 0.16, h * 0.42); g.fillStyle = 'rgba(40,40,40,0.6)'; for (let k = 0; k < 4; k++) g.fillRect(x + 6, h * 0.56 + k * h * 0.08, w * 0.12 * (0.5 + r() * 0.5), 3); }
    speckle(g, w, h, 600, r, 0.08, false);
  },
  // --- (closing: visuals) the plain finishes' wear: near white (the tint is the colour), tileable (each mark drawn again
  // across the edges it crosses), so a box of paint, a steel cabinet or a canvas wall reads as made and used ------------
  wearMatte(g, s, r) {
    g.fillStyle = '#efefef'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 36; i++) blot(g, s, r() * s, r() * s, 12 + r() * 46, 8 + r() * 30, r() * 3, `rgba(${r() < 0.6 ? '110,100,90' : '255,255,255'},${0.035 + r() * 0.06})`);
    speckle(g, s, s, 1400, r, 0.12, false); speckle(g, s, s, 500, r, 0.08);
  },
  wearSatin(g, s, r) {
    g.fillStyle = '#f5f5f5'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 22; i++) blot(g, s, r() * s, r() * s, 20 + r() * 60, 14 + r() * 40, r() * 3, `rgba(120,118,112,${0.025 + r() * 0.04})`);
    for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(100,98,92,${0.03 + r() * 0.04})`; g.fillRect(r() * s, 0, 1 + r() * 3, s); } // runs the full height: they tile
    g.lineWidth = 1;
    for (let i = 0; i < 40; i++) { const x = r() * s, y = r() * s, a = r() * 3; g.strokeStyle = `rgba(${r() < 0.5 ? '80,80,80' : '255,255,255'},${0.06 + r() * 0.1})`; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * (4 + r() * 16), y + Math.sin(a) * (4 + r() * 16)); g.stroke(); }
    speckle(g, s, s, 500, r, 0.06, false);
  },
  wearMetal(g, s, r) {
    g.fillStyle = '#e4e4e4'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '60,60,60'},${0.03 + r() * 0.06})`; g.fillRect(0, r() * s, s, 1); } // brushed, across the whole tile
    g.lineWidth = 1;
    for (let i = 0; i < 30; i++) { const x = r() * s, y = r() * s, a = r() * 3; g.strokeStyle = `rgba(${r() < 0.5 ? '40,40,40' : '255,255,255'},${0.1 + r() * 0.12})`; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * (6 + r() * 26), y + Math.sin(a) * (6 + r() * 26)); g.stroke(); }
    for (let i = 0; i < 10; i++) blot(g, s, r() * s, r() * s, 6 + r() * 20, 4 + r() * 12, r() * 3, `rgba(90,74,60,${0.05 + r() * 0.07})`);
  },
  wearCloth(g, s, r) {
    g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 2) { g.fillStyle = `rgba(90,90,90,${0.04 + r() * 0.05})`; g.fillRect(0, y, s, 1); }
    for (let x = 0; x < s; x += 2) { g.fillStyle = `rgba(255,255,255,${0.03 + r() * 0.05})`; g.fillRect(x, 0, 1, s); }
    for (let i = 0; i < 6; i++) { const x = r() * s, w = 10 + r() * 30, gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, `rgba(60,60,60,${0.05 + r() * 0.05})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, 0, w, s); if (x + w > s) g.fillRect(x - s, 0, w, s); } // folds
    for (let i = 0; i < 8; i++) blot(g, s, r() * s, r() * s, 10 + r() * 24, 6 + r() * 16, r() * 3, `rgba(110,96,70,${0.04 + r() * 0.05})`);
  },
  // a sheet of paper: off-white, a heading, rows of writing, a stamp or a signature (a kit's file, notice or order)
  paper(g, s, r) {
    g.fillStyle = '#f4f0e4'; g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(40,44,52,0.85)'; g.fillRect(s * 0.1, s * 0.08, s * (0.35 + r() * 0.3), s * 0.06);
    for (let y = s * 0.2; y < s * 0.86; y += s * 0.055) { let x = s * 0.1; while (x < s * 0.88) { const w = s * (0.04 + r() * 0.12); if (x + w > s * 0.9) break; g.fillStyle = `rgba(50,54,62,${0.5 + r() * 0.3})`; g.fillRect(x, y, w, s * 0.018); x += w + s * 0.02; } }
    if (r() < 0.5) { g.strokeStyle = 'rgba(180,40,40,0.6)'; g.lineWidth = 3; g.beginPath(); g.arc(s * 0.74, s * 0.8, s * 0.09, 0, Math.PI * 2); g.stroke(); }
    else { g.strokeStyle = 'rgba(30,40,90,0.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(s * 0.6, s * 0.86); for (let i = 0; i < 6; i++) g.quadraticCurveTo(s * (0.62 + i * 0.04), s * (0.8 + (i % 2) * 0.08), s * (0.64 + i * 0.04), s * 0.86); g.stroke(); }
    g.strokeStyle = 'rgba(120,110,90,0.4)'; g.lineWidth = 2; g.strokeRect(1, 1, s - 2, s - 2);
  },
  // a whiteboard: marker writing and a diagram, magnets, a smudge where it was wiped
  whiteboard(g, s, r) {
    g.fillStyle = '#f8f8f6'; g.fillRect(0, 0, s, s);
    blot(g, s, s * 0.6, s * 0.5, s * 0.25, s * 0.12, 0.2, 'rgba(120,130,150,0.08)');
    const ink = ['#2a3a8a', '#b02a2a', '#1a1a1a', '#2a7a3a'];
    for (let row = 0; row < 6; row++) { let x = s * 0.06; const y = s * (0.12 + row * 0.1); g.strokeStyle = ink[row % 4]; g.lineWidth = 2.5; g.beginPath(); while (x < s * 0.55) { const w = s * (0.03 + r() * 0.07); g.moveTo(x, y); for (let k = 0; k < 4; k++) g.lineTo(x + (w * (k + 1)) / 4, y + (r() - 0.5) * 8); x += w + s * 0.02; } g.stroke(); }
    g.strokeStyle = '#2a3a8a'; g.lineWidth = 3; g.strokeRect(s * 0.62, s * 0.14, s * 0.3, s * 0.22); g.beginPath(); g.moveTo(s * 0.77, s * 0.36); g.lineTo(s * 0.77, s * 0.52); g.stroke(); g.strokeRect(s * 0.64, s * 0.52, s * 0.26, s * 0.18);
    for (const [x, y, c] of [[0.1, 0.8, '#e8c040'], [0.3, 0.84, '#d84a3a'], [0.85, 0.82, '#3a7ac8']]) { g.fillStyle = c; g.beginPath(); g.arc(s * x, s * y, s * 0.025, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#9aa0a6'; g.fillRect(0, 0, s, 4); g.fillRect(0, s - 4, s, 4); g.fillRect(0, 0, 4, s); g.fillRect(s - 4, 0, 4, s);
  },
  // a lit advertisement: a city poster (a skyline, a train, a slogan), drawn unlit: it is its own light
  poster(g, s, r) {
    const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, '#2a5a9a'); gr.addColorStop(1, '#c8e4ff'); g.fillStyle = gr; g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(20,30,50,0.55)'; for (let x = 0; x < s;) { const w = 10 + r() * 24, h = s * (0.2 + r() * 0.3); g.fillRect(x, s * 0.72 - h, w - 2, h); x += w; }
    g.fillStyle = '#f4f4f0'; g.fillRect(0, s * 0.72, s, s * 0.28);
    g.fillStyle = '#c83a2a'; g.fillRect(s * 0.1, s * 0.58, s * 0.6, s * 0.1); g.fillStyle = '#f8f8f8'; for (let k = 0; k < 4; k++) g.fillRect(s * (0.14 + k * 0.13), s * 0.6, s * 0.08, s * 0.04);
    g.fillStyle = '#1a2a4a'; g.font = `bold ${(s * 0.09) | 0}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(['LINE 41', 'RAIN CITY', 'ON TIME'][(r() * 3) | 0], s * 0.5, s * 0.82); g.font = `${(s * 0.05) | 0}px sans-serif`; g.fillText('EVERY MORNING, EVERY STOP', s * 0.5, s * 0.92);
  },
};

// a soft mark drawn again across each edge it crosses (the wear painters tile)
function blot(g, s, x, y, rx, ry, a, fill) {
  g.fillStyle = fill;
  for (const dx of [0, -s, s]) for (const dy of [0, -s, s]) {
    if ((dx && (x + dx + rx < 0 || x + dx - rx > s)) || (dy && (y + dy + ry < 0 || y + dy - ry > s))) continue;
    g.beginPath(); g.ellipse(x + dx, y + dy, rx, ry, a, 0, Math.PI * 2); g.fill();
  }
}

// the year a vertex belongs to (Scenery.js bakes a mask per vertex: PRESENT 1, PAST 2, FUTURE 4, and
// 8 for a small prop): the vertex shader drops what is not of this year, and props beyond 90 m
export const ERA = { value: 1 };
const ERA_BIT = { PRESENT: 1, PAST: 2, FUTURE: 4 };
export function setEraBit(state) {
  ERA.value = ERA_BIT[state] || 1;
  return ERA.value;
}
const ERA_GLSL = `{
  float lvBit = mod(floor(aEra / uEra + 0.01), 2.0);
  vec3 lvW = (modelMatrix * vec4(transformed, 1.0)).xyz;
  if (lvBit < 0.5 || (aEra > 7.5 && distance(lvW, cameraPosition) > 90.0)) gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
}`;
function eraShader(m) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uEra = ERA;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aEra;\nuniform float uEra;').replace('#include <project_vertex>', `#include <project_vertex>\n${ERA_GLSL}`);
  };
  m.customProgramCacheKey = () => 'lvEra';
}
let _depth = null;
// the shadow pass's material for scenery: the same year test, so a hidden year casts no shadow
export function eraDepthMaterial() {
  if (!_depth) {
    _depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    eraShader(_depth);
    _depth.userData.keep = true;
  }
  return _depth;
}

const _surf = new Map();
function texture(name, def) {
  const P = PAINT[def.paint];
  const tile = [].concat(def.tile || 2);
  const aspect = tile.length > 1 ? tile[1] / tile[0] : 1;
  const w = 256, h = Math.round(256 * aspect);
  let mask = null;
  const r = rnd([...name].reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  const map = canvasTex(w, (g) => {
    if (def.lit) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      mask = c.getContext('2d');
      mask.fillStyle = '#000';
      mask.fillRect(0, 0, w, h);
    }
    // a facade paints w x h with its window mask; a tileable surface paints its square
    if (P.length >= 4) P.call(PAINT, g, w, h, r, mask);
    else P.call(PAINT, g, w, r);
  }, true, h);
  let emissiveMap = null;
  if (mask) {
    emissiveMap = new THREE.CanvasTexture(mask.canvas);
    emissiveMap.wrapS = emissiveMap.wrapT = THREE.RepeatWrapping;
  }
  return { map, emissiveMap };
}

// the THREE material of a surface (shared by every place; never disposed: userData.keep)
export function surfaceMaterial(s) {
  if (_surf.has(s)) return _surf.get(s);
  const def = SURFACES[s] || SURFACES.matte;
  let m;
  if (def.basic) {
    m = new THREE.MeshBasicMaterial({ vertexColors: true, fog: true });
    // (closing: a painted unlit surface: a ceiling of light panels, rain streaks that scroll)
    if (def.paint) m.map = texture(s, def).map;
    if (def.opacity !== undefined) Object.assign(m, { transparent: true, opacity: def.opacity, depthWrite: false });
    if (def.side === 2) m.side = THREE.DoubleSide;
  } else {
    const o = { vertexColors: true, roughness: def.rough ?? 0.85, metalness: def.metal ?? 0 };
    if (def.opacity !== undefined) Object.assign(o, { transparent: true, opacity: def.opacity, depthWrite: false });
    if (def.alphaTest) o.alphaTest = def.alphaTest; // (leaves cut out of their sheet: the vines on 2196's towers)
    if (def.side === 2) o.side = THREE.DoubleSide;
    if (def.paint) {
      const t = texture(s, def);
      o.map = t.map;
      if (t.emissiveMap) Object.assign(o, { emissiveMap: t.emissiveMap, emissive: new THREE.Color(def.lit), emissiveIntensity: 0 });
    } else if (def.scan) {
      o.map = pbrTex(def.scan, 'color', 1);
      o.normalMap = pbrTex(def.scan, 'normal', 1);
      o.normalScale = new THREE.Vector2(0.7, 0.7);
      o.roughnessMap = pbrTex(def.scan, 'rough', 1);
      o.roughness = def.rough ?? 1;
    }
    if (def.water) {
      const n = pbrTex('water', 'normal', 1);
      WATER_NORMALS.add(n);
      o.normalMap = n;
      o.normalScale = new THREE.Vector2(0.35, 0.35);
    }
    m = new THREE.MeshStandardMaterial(o);
  }
  eraShader(m);
  m.userData.keep = true;
  m.userData.surface = s;
  m.userData.tile = [].concat(def.tile || 2);
  m.userData.fit = !!def.fit;
  m.userData.cast = def.cast !== false;
  m.userData.lit = !!def.lit;
  if (def.scroll && m.map) {
    // (its own copy of the map, so the scroll moves only this surface: rain falling and rain rising share a picture)
    m.map = m.map.clone();
    m.map.needsUpdate = true;
    m.userData.scroll = def.scroll;
  }
  _surf.set(s, m);
  return m;
}

// the surfaces that move (Mission 11's rain): their maps scroll with the game's time (Scenery.update, each frame)
export function tickSurfaces(dt) {
  for (const m of _surf.values()) {
    const sc = m.userData.scroll;
    if (!sc) continue;
    m.map.offset.x = (m.map.offset.x + sc[0] * dt) % 1;
    m.map.offset.y = (m.map.offset.y + sc[1] * dt) % 1;
  }
}

// a painted surface's picture for something drawn outside the scenery (a kit, a gate): the same canvas, shared
export function paintedMap(s) {
  return SURFACES[s]?.paint ? surfaceMaterial(s).map : null;
}

// a lit facade's windows come on with the year's light (0 dark .. 1 every lit window)
export function setLit(k) {
  for (const m of _surf.values()) if (m.userData.lit) m.emissiveIntensity = k * 1.35;
}

// a plain material for a named place surface outside Scenery (doors, gates, the train): no vertex colours
const _named = new Map();
export function namedMaterial(name) {
  if (_named.has(name)) return _named.get(name);
  const d = MATS[name];
  let m;
  if (name === 'gateVeil') m = new THREE.MeshBasicMaterial({ color: 0xc9b8ff, transparent: true, opacity: 0.12, depthWrite: false });
  // (closing: Mission 1's checkpoint barrier is a steel frame with glass leaves and the company's band, not a blank panel)
  // (DeckWorld's boxes carry a repeat every 2 m: a gate leaf every 2 m across, the picture once up its 2.6 m)
  else if (name === 'gateBarrier') {
    const map = paintedMap('barrierFace').clone();
    map.repeat.set(1, 1 / 1.3);
    map.needsUpdate = true;
    m = new THREE.MeshStandardMaterial({ map, roughness: 0.45, metalness: 0.3 });
  }
  else if (name === 'gateSteel') m = new THREE.MeshStandardMaterial({ color: 0x5a626c, map: surfaceMaterial('metal').map, roughness: 0.5, metalness: 0.6 });
  else {
    const s = SURFACES[d?.s] || SURFACES.matte;
    // (closing: visuals) a door or a train wears its surface's picture too (a tiled one: DeckWorld's boxes repeat it every 2 m)
    const map = s.basic || s.fit ? null : s.paint ? surfaceMaterial(d?.s in SURFACES ? d.s : 'matte').map : s.scan ? pbrTex(s.scan, 'color', 1) : null;
    m = s.basic ? new THREE.MeshBasicMaterial({ color: d?.c ?? 0x888888 }) : new THREE.MeshStandardMaterial({ color: d?.c ?? 0x888888, map, roughness: s.rough ?? 0.8, metalness: s.metal ?? 0, transparent: s.opacity !== undefined, opacity: s.opacity ?? 1 });
  }
  m.userData.keep = true;
  _named.set(name, m);
  return m;
}

export { hex };
