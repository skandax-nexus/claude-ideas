// Open maps for HALCYON (gen/ZoneStory.js): each sector is one big district
// under a glass dome - streets, buildings, water, trees - with the sector's
// scene somewhere in it and the way on locked until that scene is done.
//
// Every obstacle has at least two answers, built from what Ren already knows
// at this point of the prologue:
// - INVERTED: fall up to the dome, walk across it, shift back to drop down
//   (onto a roof, over water, past a drone).
// - ECHO + "ECHOES SOLIDIFY IN ECHO": the old stairs and bridges are memories.
// - zero gravity ("GRAVITY FREEZES", token found in the first district) floats
//   you to roof height.
// Same level format as gen/LevelGen.js, so world/DeckWorld.js runs it.
import { Rng } from './rng.js';
import { ZONE_SECTORS, FRAGMENTS } from './ZoneStory.js';

const T = 0.4;
const H = 22; // the dome
const XW = 34; // half width of a district
const ZN = -104; // the north wall (the way on); spawn is near z = 0

export const ZONE_HINTS = {
  roof: ['THE SCENE IS ON A ROOF.', 'THE DOME IS A FLOOR IF YOU ARE UPSIDE DOWN. OR THE OLD STAIRS ARE A MEMORY.', 'SHIFT TO INVERTED, WALK THE DOME UNTIL YOU ARE ABOVE THE ROOF, SHIFT BACK. OR: ECHOES SOLIDIFY IN ECHO, SHIFT TO ECHO, CLIMB.'],
  canal: ['THE WATER CUTS THE DISTRICT IN TWO.', 'A BRIDGE USED TO BE HERE. ECHO REMEMBERS IT. THE DOME DOES NOT CARE ABOUT WATER.', 'ECHOES SOLIDIFY IN ECHO, SHIFT TO ECHO, CROSS. OR SHIFT TO INVERTED AND WALK OVER IT ON THE GLASS.'],
  drones: ['THE DRONES WATCH THE STREET. ONLY THE STREET.', 'STAY BEHIND BUILDINGS. OR GO WHERE THEY DO NOT LOOK: UP.', 'SHIFT TO INVERTED AND CROSS ON THE DOME. OR WRITE  OBSERVER  FREEZES IN  (THIS STATE).'],
  gate: ['THE WAY ON IS LOCKED.', 'IT OPENS WHEN YOU HAVE SEEN WHAT THIS DISTRICT IS FOR.', 'FINISH THE SCENE HERE. THEN WALK NORTH TO THE GATE.'],
};

class District {
  constructor(id) {
    this.id = id;
    this.els = [];
    this.texts = [];
    this.inter = [];
    this.tokens = [];
    this.sentinels = [];
    this.npcs = [];
    this.checkpoints = [];
    this.challenges = [];
    this.free = []; // rects kept clear of buildings
  }

  box(b, o = {}) {
    this.els.push({ box: b, mat: 'wall', solid: true, ...o });
  }

  clear(x0, z0, x1, z1) {
    this.free.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]);
  }

  isFree(x0, z0, x1, z1, m = 1.5) {
    return !this.free.some((r) => x0 < r[2] + m && x1 > r[0] - m && z0 < r[3] + m && z1 > r[1] - m);
  }
}

export function generateZone(story, zi, si) {
  const zone = story.decks[zi];
  const beat = zone.beats[si];
  const rng = Rng.from('halcyon', zi, si);
  const id = `z${zi}s${si}`;
  const M = new District(id);
  const theme = zone.theme;
  const canal = si >= 1 || theme === 'reactor'; // water splits the district from the second sector on
  const canalZ = [-50, -57];

  // --- shell: ground, walls, dome, the gate -----------------------------------------
  const ground = (x0, z0, x1, z1) => M.box([x0, -T, z0, x1, 0, z1], { mat: theme === 'forest' ? 'moss' : 'road' });
  if (canal) {
    ground(-XW, canalZ[0], XW, 4);
    ground(-XW, ZN, XW, canalZ[1]);
    M.box([-XW, -6, canalZ[1], XW, -2.4, canalZ[0]], { mat: 'water', solid: false });
    // banks
    M.box([-XW, -6, canalZ[0] - T, XW, 0, canalZ[0]], { mat: 'trimDark' });
    M.box([-XW, -6, canalZ[1], XW, 0, canalZ[1] + T], { mat: 'trimDark' });
  } else ground(-XW, ZN, XW, 4);
  const wallMat = theme === 'forest' ? 'glassWall' : theme === 'reactor' ? 'industrial' : 'facade';
  M.box([-XW - T, -6, ZN, -XW, H, 4], { mat: wallMat });
  M.box([XW, -6, ZN, XW + T, H, 4], { mat: wallMat });
  M.box([-XW, -6, 4, XW, H, 4 + T], { mat: wallMat });
  M.box([-XW, -6, ZN - T, -3, H, ZN], { mat: wallMat });
  M.box([3, -6, ZN - T, XW, H, ZN], { mat: wallMat });
  M.box([-3, 4.5, ZN - T, 3, H, ZN], { mat: wallMat });
  M.box([-XW - T, H, ZN - T, XW + T, H + T, 4 + T], { mat: 'dome' });
  // the gate: locked until this district's scene is done
  M.box([-3, 0, ZN - 0.2, 3, 4.5, ZN + 0.2], { mat: 'door', when: '!beat_done', id: `gate_${id}` });
  M.box([-3, 0, ZN - 4, 3, 4.5, ZN - T], { mat: 'gate', solid: false });
  M.box([-3.4, -T, ZN - 4, 3.4, 0, ZN], { mat: 'road' });
  M.box([-3.4, 0, ZN - 4, -3, 4.5, ZN], { mat: 'trim' });
  M.box([3, 0, ZN - 4, 3.4, 4.5, ZN], { mat: 'trim' });
  M.box([-3.4, 4.5, ZN - 4, 3.4, 4.9, ZN], { mat: 'trim' });
  M.texts.push({ text: beat.kind === 'encounter' && zi === 3 ? 'LIFT - STATION ZERO' : 'NORTH GATE', pos: [0, 5.6, ZN + 0.3], rotY: 0, size: 0.6, color: hex(zone.palette.accent) });
  M.clear(-6, ZN, 6, ZN + 10);
  M.clear(-6, -8, 6, 4); // the arrival plaza
  M.clear(-5, ZN, 5, 4); // the main avenue stays walkable

  // --- the scene of this sector ----------------------------------------------------
  const far = (z) => (canal ? Math.min(z, canalZ[1] - 8) : z);
  const sceneSide = rng.pick([-1, 1]);
  const scene = { x: sceneSide * rng.float(14, 22), z: far(rng.float(-62, -84)) };
  if (beat.kind === 'arrival') {
    // a recorder on a landmark roof: the dome or the remembered stairs get you there
    const rx = sceneSide * 18, rz = canal ? -76 : -38, rh = 7;
    // a landmark roof: a tower block, a pump house, a giant tree's platform, a relay hut
    M.box([rx - 6, 0, rz - 6, rx + 6, rh, rz + 6], { mat: theme === 'forest' ? 'bark' : theme === 'reactor' ? 'industrial' : 'facade' });
    if (theme === 'forest') M.box([rx - 7.5, rh + 0.4, rz - 7.5, rx + 7.5, rh + 2.6, rz + 7.5], { mat: 'leaf', solid: false });
    M.box([rx - 6.2, rh, rz - 6.2, rx + 6.2, rh + 0.4, rz + 6.2], { mat: 'trim' });
    M.box([rx - 0.5, rh + 0.4, rz - 0.4, rx + 0.5, rh + 1.4, rz + 0.4], { mat: 'prop' });
    M.inter.push({ id: `log_${id}`, kind: 'terminal', pos: [rx, rh + 1.65, rz], yaw: 0, r: 2.6, prompt: 'PLAY RECORDER', log: beat.log });
    for (let k = 0; k < 7; k++) {
      // memory stairs up the inner side of the building
      const sx = rx - sceneSide * (6 + 1.1), sz = rz + 5 - k * 1.5;
      M.box([sx - 1, k + 0.8, sz - 0.75, sx + 1, k + 1, sz + 0.75], { mat: 'wall', echo: true });
    }
    M.box([rx - sceneSide * 6.1 - 1, rh, rz - 6.2, rx - sceneSide * 6.1 + 1, rh + 0.4, rz - 4.6], { mat: 'wall', echo: true });
    M.clear(rx - 9, rz - 9, rx + 9, rz + 9);
    M.challenges.push({ key: 'roof', z0: 4, z1: ZN, hints: ZONE_HINTS.roof });
    M.texts.push({ text: zi === 0 ? 'FOLLOW THE PINK LIGHTS' : zone.motto, pos: [rx - sceneSide * 6.05, 4.5, rz], rotY: sceneSide > 0 ? -Math.PI / 2 : Math.PI / 2, size: 0.55, color: hex(zone.palette.accent) });
    scene.x = rx;
    scene.z = rz;
  } else if (beat.kind === 'log') {
    M.box([scene.x - 2.5, 0, scene.z - 2.5, scene.x + 2.5, 3.2, scene.z - 1.5], { mat: theme === 'reactor' ? 'industrial' : 'facade' });
    M.box([scene.x - 0.6, 0, scene.z - 1.5, scene.x + 0.6, 1.0, scene.z - 0.8], { mat: 'prop' });
    M.inter.push({ id: `log_${id}`, kind: 'terminal', pos: [scene.x, 1.25, scene.z - 0.6], yaw: 0, r: 2.6, prompt: 'READ THE NOTE', log: beat.log });
    M.clear(scene.x - 6, scene.z - 6, scene.x + 6, scene.z + 6);
  } else if (beat.kind === 'contradiction') {
    // a big public screen: the record on it, the memory in ECHO
    const sx = scene.x, sz = scene.z;
    M.box([sx - 6, 0, sz - 3, sx + 6, 9, sz - 1.8], { mat: theme === 'forest' ? 'bark' : 'facade' });
    M.box([sx - 4.6, 3.2, sz - 1.8, sx + 4.6, 6.8, sz - 1.6], { mat: 'screen', solid: false });
    M.texts.push({ text: beat.official, pos: [sx, 5.0, sz - 1.5], rotY: 0, size: 0.42, color: '#ffd6e6', when: '!@ECHO' });
    M.texts.push({ text: beat.echo, pos: [sx, 5.0, sz - 1.5], rotY: 0, size: 0.42, color: '#8ff4ff', echo: true });
    M.inter.push({ id: `plaque_${id}`, kind: 'plaque', pos: [sx, 1.6, sz + 0.4], r: 3.6, prompt: 'READ THE SCREEN', beat });
    M.clear(sx - 8, sz - 4, sx + 8, sz + 8);
  } else if (beat.kind === 'encounter') {
    const c = story.cast[zone.crew];
    const sx = scene.x, sz = scene.z;
    // a lit nook for whoever is here: a stall, a hatch, a cabin, a beacon
    M.box([sx - 4, 0, sz - 4, sx + 4, 4.2, sz - 3.4], { mat: theme === 'forest' ? 'bark' : 'facade' });
    M.box([sx - 4, 4.2, sz - 4, sx + 4, 4.6, sz + 1], { mat: 'trim' });
    M.box([sx - 4, 0, sz - 4, sx - 3.4, 4.2, sz + 1], { mat: theme === 'forest' ? 'bark' : 'facade' });
    M.box([sx + 3.4, 0, sz - 4, sx + 4, 4.2, sz + 1], { mat: theme === 'forest' ? 'bark' : 'facade' });
    M.box([sx - 2.4, 3.3, sz - 3.35, sx + 2.4, 3.9, sz - 3.3], { mat: 'neon', solid: false });
    M.npcs.push({ id: `npc_${id}`, crew: c.id, pos: [sx, 0, sz - 1.6], yaw: 0, hologram: !c.alive, lines: beat.lines, junoAfter: beat.junoAfter });
    M.clear(sx - 7, sz - 6, sx + 7, sz + 8);
  }
  if (canal) {
    // the old bridge is a memory: solid with ECHOES SOLIDIFY IN ECHO
    M.box([-3, -0.4, canalZ[1], 3, 0, canalZ[0]], { mat: 'wall', echo: true });
    M.challenges.push({ key: 'canal', z0: canalZ[0] + 8, z1: canalZ[1] - 2, hints: ZONE_HINTS.canal });
    M.texts.push({ text: 'BRIDGE CLOSED', pos: [0, 2.6, canalZ[0] + 1.2], rotY: 0, size: 0.5, color: hex(zone.palette.accent) });
  }

  // --- drones on the far side ----------------------------------------------------------
  const nDrones = theme === 'tower' ? 2 + si : si === 2 || theme === 'city' && si === 1 ? 1 : 0;
  for (let k = 0; k < nDrones; k++) {
    const z = canal ? -64 - k * 9 : -40 - k * 12;
    const x0 = -XW + 6, x1 = XW - 6;
    M.sentinels.push({ path: k % 2 ? [[x1, z], [x0, z]] : [[x0, z], [x1, z]], speed: 2.2 + si * 0.3, range: 9, fov: 0.75 });
  }
  if (nDrones) M.challenges.push({ key: 'drones', z0: (canal ? canalZ[1] : -30), z1: ZN, hints: ZONE_HINTS.drones });
  M.challenges.push({ key: 'gate', z0: ZN + 14, z1: ZN, hints: ZONE_HINTS.gate });

  // --- the district: buildings, trees, tanks, masts --------------------------------------
  dressing(M, theme, rng, zone, canal ? canalZ : null);

  // three hidden memory fragments: a roof, a back street, the water's edge
  const lore = FRAGMENTS[zi] || [];
  const spots = [];
  const roofs = (M.blocks || []).filter((b) => b[2] - b[0] > 5 && b[3] - b[1] > 5);
  if (roofs.length) {
    const b = rng.pick(roofs);
    const top = M.els.find((e) => e.box[0] === b[0] && e.box[2] === b[1] && e.box[3] === b[2])?.box[4] || 8;
    spots.push([(b[0] + b[2]) / 2, top + 0.35 + 1.0, (b[1] + b[3]) / 2]);
  }
  spots.push([rng.pick([-1, 1]) * (XW - 2), 1.2, rng.float(-30, -12)]);
  spots.push(canal ? [rng.pick([-1, 1]) * rng.float(10, 26), 1.2, canalZ[1] - 2.5] : [rng.pick([-1, 1]) * rng.float(10, 26), 1.2, rng.float(ZN + 12, ZN + 24)]);
  spots.forEach((p, k) => {
    const text = lore[si * 3 + k];
    if (!text) return;
    M.box([p[0] - 0.35, p[1] - 1.2, p[2] - 0.35, p[0] + 0.35, p[1] - 0.5, p[2] + 0.35], { mat: 'trim' });
    M.inter.push({ id: `frag_${id}_${k}`, kind: 'fragment', pos: p, r: 2.4, prompt: 'MEMORY FRAGMENT', text, n: si * 3 + k });
  });

  // tokens: new words for the device
  if (zi === 0 && si === 0) {
    M.tokens.push({ token: 'FREEZES', pos: [-3, 1.2, -6] });
    M.tokens.push({ token: 'OBSERVER', pos: [3, 1.2, -6] });
  }
  // a memory beacon by the entrance saves the game
  M.box([4.6, 0, -2.4, 5.4, 1.2, -1.6], { mat: 'prop' });
  M.inter.push({ id: `beacon_${id}`, kind: 'beacon', pos: [5, 1.5, -2], r: 2.4, prompt: 'SAVE MEMORY' });

  // checkpoints: the entrance, and past the water
  M.checkpoints.push({ box: [-XW, -12, canal ? canalZ[0] : ZN, XW, H + 2, 4], spawn: [0, 0.86, -2, 0] });
  if (canal) M.checkpoints.push({ box: [-XW, -12, ZN, XW, H + 2, canalZ[1]], spawn: [0, 0.86, canalZ[1] - 2, 0] });

  // --- level record ---------------------------------------------------------------------
  const pal = zone.palette;
  const lights = [
    [0, H - 2, -20, pal.light, 2.2, 60],
    [0, H - 2, -70, pal.light, 2.0, 60],
    [scene.x, 6, scene.z + 2, pal.accent, 2.4, 22],
    [0, 4, ZN + 6, pal.accent2, 1.6, 18],
  ];
  const name = zone.rooms[(si * 2) % zone.rooms.length];
  const room = {
    name, kind: 'district', beat: beat.kind,
    bounds: [[-XW, -12, ZN - 4, XW, H + 2, 4]],
    spawn: [0, 0.86, -2, 0],
    lights, tint: pal.tint, killY: -2, floatY: 8.4,
    challenges: M.challenges.map((c) => ({ ...c, box: [-XW, -12, Math.min(c.z0, c.z1), XW, H + 2, Math.max(c.z0, c.z1)] })),
    route: [], exitSide: 'N', L: -ZN, W: XW * 2, H,
  };
  const level = {
    id, deck: zi, sector: si, seed: 'halcyon', zone: true,
    deckName: zone.name, palette: pal,
    rooms: { [id]: room }, order: [id],
    elements: M.els.map((e) => ({ ...e, room: id })),
    texts: M.texts.map((t) => ({ ...t, room: id })),
    interactables: M.inter.map((t) => ({ ...t, room: id })),
    items: [],
    tokens: M.tokens.map((t) => ({ ...t, room: id })),
    hazards: [],
    sentinels: M.sentinels.map((s, k) => ({ ...s, room: id, id: `${id}_s${k}` })),
    npcs: M.npcs.map((n) => ({ ...n, room: id })),
    checkpoints: M.checkpoints.map((c) => ({ ...c, room: id })),
    triggers: [],
    map: { rooms: [{ id, rect: [-XW, ZN, XW, 4], name, kind: 'district' }], corridors: [], blocks: M.blocks || [], gate: [0, ZN - 2] },
    effects: new Set(['echoSolid', 'gravityFlip', 'zeroG', 'observerFrozen']),
    exit: { room: id, box: [-3, -1, ZN - 4, 3, 6, ZN - 1] },
    spawn: room.spawn,
    estimateMin: 7 + si,
    sectors: ZONE_SECTORS,
  };
  level.effects = [...level.effects];
  return level;
}

const hex = (n) => '#' + n.toString(16).padStart(6, '0');

// Buildings and landmarks that make each district its own place.
function dressing(M, theme, rng, zone, canalZ) {
  M.blocks = [];
  const inCanal = (z0, z1) => canalZ && z0 < canalZ[0] + 2 && z1 > canalZ[1] - 2;
  const signs = {
    city: ['NOODLES 24H', 'HALCYON TRANSIT', 'DREAM CLINIC', 'NO SLEEP', 'KARAOKE', 'MERIDIAN BANK', 'LUCKY 8', 'REPAIRS'],
    reactor: ['PUMP 4', 'DANGER - HIGH PRESSURE', 'COOLANT', 'SECTOR C', 'NO ENTRY', 'VALVE ROOM'],
    forest: ['SEED VAULT', 'PATH TO CABIN', 'QUIET PLEASE', 'GLOWROOT'],
    tower: ['RELAY 7', 'STORM WARNING', 'BEACON', 'AUTHORIZED ONLY', 'SIGNAL'],
  }[theme];
  const tries = theme === 'forest' ? 120 : 70;
  for (let i = 0; i < tries; i++) {
    const side = rng.pick([-1, 1]);
    const x = side * rng.float(9, XW - 4);
    const z = rng.float(ZN + 8, -10);
    if (theme === 'forest') {
      // trunks and glowing canopies; some trees are only memories
      const r = rng.float(0.5, 1.1), h = rng.float(8, 16);
      if (!M.isFree(x - 2.5, z - 2.5, x + 2.5, z + 2.5, 0.5) || inCanal(z - 3, z + 3)) continue;
      const echo = rng.chance(0.18);
      M.box([x - r, 0, z - r, x + r, h, z + r], { mat: 'bark', echo, solid: !echo });
      const c = rng.float(2.2, 3.6);
      M.box([x - c, h - 1, z - c, x + c, h + 1.6, z + c], { mat: 'leaf', solid: false, echo });
      if (rng.chance(0.4)) M.box([x - 0.25, 0, z + r, x + 0.25, 0.5, z + r + 0.6], { mat: 'neon', solid: false });
      M.clear(x - c, z - c, x + c, z + c);
      continue;
    }
    const w = rng.float(6, 11), d = rng.float(6, 12);
    const x0 = side > 0 ? Math.max(7, x - w / 2) : x - w / 2, x1 = Math.min(XW - 1, x0 + w);
    const z0 = z - d / 2, z1 = z + d / 2;
    if (!M.isFree(x0, z0, x1, z1) || inCanal(z0, z1)) continue;
    const h = theme === 'tower' ? rng.float(5, 12) : rng.float(6, 17);
    const mat = theme === 'reactor' ? rng.pick(['industrial', 'tank']) : 'facade';
    M.box([x0, 0, z0, x1, h, z1], { mat });
    M.box([x0 - 0.2, h, z0 - 0.2, x1 + 0.2, h + 0.35, z1 + 0.2], { mat: 'trim' });
    M.blocks.push([x0, z0, x1, z1]);
    M.clear(x0, z0, x1, z1);
    // a sign on the side facing the avenue
    if (rng.chance(0.7)) {
      const fx = side > 0 ? x0 - 0.06 : x1 + 0.06;
      M.texts.push({ text: rng.pick(signs), pos: [fx, rng.float(3, Math.max(3.5, h - 2)), (z0 + z1) / 2], rotY: side > 0 ? -Math.PI / 2 : Math.PI / 2, size: rng.float(0.5, 0.9), color: hex(rng.chance(0.5) ? zone.palette.accent : zone.palette.accent2) });
    }
    if (theme === 'tower' && rng.chance(0.5)) M.box([(x0 + x1) / 2 - 0.15, h, (z0 + z1) / 2 - 0.15, (x0 + x1) / 2 + 0.15, h + rng.float(3, 6), (z0 + z1) / 2 + 0.15], { mat: 'neon', solid: false });
  }
  // street furniture along the avenue: lamps, crates, cars, pipes
  for (let z = -6; z > ZN + 8; z -= 9) {
    if (inCanal(z - 1, z + 1)) continue;
    for (const s of [-1, 1]) {
      const x = s * 5.6;
      M.box([x - 0.12, 0, z - 0.12, x + 0.12, 4.2, z + 0.12], { mat: 'trimDark' });
      M.box([x - 0.5, 4.2, z - 0.25, x + 0.5, 4.45, z + 0.25], { mat: 'neon', solid: false });
    }
    if (theme === 'city' && rng.chance(0.45)) {
      const x = rng.pick([-1, 1]) * rng.float(9, 12);
      M.box([x - 1, 0, z - 2.1, x + 1, 1.0, z + 2.1], { mat: 'car' });
      M.box([x - 0.85, 1.0, z - 1.1, x + 0.85, 1.6, z + 1.0], { mat: 'glass', solid: false });
    }
    if (theme === 'reactor' && rng.chance(0.5)) {
      const x = rng.pick([-1, 1]) * rng.float(8, 12);
      M.box([x - 0.5, 0, z - 4, x + 0.5, 1.0, z + 4], { mat: 'pipe' });
    }
    if (rng.chance(0.35)) {
      const x = rng.pick([-1, 1]) * rng.float(7, 9);
      M.box([x - 0.6, 0, z - 0.6, x + 0.6, 1.1, z + 0.6], { mat: 'crate' });
    }
  }
  // the landmark at the heart of each district
  if (theme === 'tower') {
    M.box([-2.5, 0, -30, 2.5, H, -25], { mat: 'facade' });
    M.box([-0.4, 0, -25, 0.4, H, -24.8], { mat: 'neon', solid: false });
  }
  if (theme === 'forest') {
    M.box([-9, -0.05, -24, -3, 0.02, -18], { mat: 'water', solid: false });
  }
}
