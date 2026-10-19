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
import { HINTS } from './LevelGen.js';

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
    this.glows = []; // pools of light on the ground: [x, y, z, radius, color]
    this.trees = []; // [x, z, height, trunk radius, crown radius, turn]
    this.rocks = []; // [x, z, size, turn]
    this.triggers = []; // THE LAST VERSION: boxes that set facts when you walk into them
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
  const rng = Rng.from(story.seed || 'halcyon', zi, si);
  const id = `${zone.idPrefix || 'z'}${zi}s${si}`;
  const M = new District(id);
  const theme = zone.themes?.[si] || zone.theme;
  // THE LAST VERSION's themes: 'rain' (a present-day city in the rain), 'ruin' (the same city in
  // 2196, overgrown), 'settlement' (stone houses, water and trees), 'liminal' (floating fragments)
  const rules = zone.rules || null; // WORLD FORGE: the act's local rules shape the district
  const canal = zone.canal ?? (si >= 1 || theme === 'reactor'); // water splits the district from the second sector on
  const canalZ = [-50, -57];

  // --- shell: ground, walls, dome, the gate -----------------------------------------
  const ground = (x0, z0, x1, z1) => M.box([x0, -T, z0, x1, 0, z1], { mat: theme === 'forest' || theme === 'ruin' || theme === 'settlement' ? 'moss' : theme === 'cradle' || theme === 'liminal' ? 'stone' : 'road' });
  if (canal) {
    ground(-XW, canalZ[0], XW, 4);
    ground(-XW, ZN, XW, canalZ[1]);
    M.box([-XW, -6, canalZ[1], XW, -2.4, canalZ[0]], { mat: 'water', solid: false });
    // banks
    M.box([-XW, -6, canalZ[0] - T, XW, 0, canalZ[0]], { mat: 'trimDark' });
    M.box([-XW, -6, canalZ[1], XW, 0, canalZ[1] + T], { mat: 'trimDark' });
  } else ground(-XW, ZN, XW, 4);
  // the avenue: curbs and sidewalks either side, dashed centre line (not in the forest)
  if (theme !== 'forest' && theme !== 'settlement' && theme !== 'liminal') {
    const runs = canal ? [[ZN, canalZ[1]], [canalZ[0], 4]] : [[ZN, 4]];
    for (const [z0, z1] of runs) {
      for (const sx of [-1, 1]) {
        const a = sx * 4.6, b = sx * 7.2;
        M.box([Math.min(a, b), 0, z0, Math.max(a, b), 0.16, z1], { mat: theme === 'cradle' ? 'metal' : 'sidewalk' });
      }
      for (let z = z1 - 2; z > z0 + 1; z -= 4) M.box([-0.08, 0, z - 1.6, 0.08, 0.012, z], { mat: theme === 'cradle' ? 'neon' : 'marking', solid: false });
    }
  }
  const wallMat = theme === 'forest' || theme === 'liminal' ? 'glassWall' : theme === 'reactor' || theme === 'cradle' || theme === 'ruin' ? 'industrial' : theme === 'settlement' ? 'stone' : 'facade';
  M.box([-XW - T, -6, ZN, -XW, H, 4], { mat: wallMat });
  M.box([XW, -6, ZN, XW + T, H, 4], { mat: wallMat });
  M.box([-XW, -6, 4, XW, H, 4 + T], { mat: wallMat });
  M.box([-XW, -6, ZN - T, -3, H, ZN], { mat: wallMat });
  M.box([3, -6, ZN - T, XW, H, ZN], { mat: wallMat });
  M.box([-3, 4.5, ZN - T, 3, H, ZN], { mat: wallMat });
  M.box([-XW - T, H, ZN - T, XW + T, H + T, 4 + T], { mat: theme === 'cradle' ? 'roots' : 'dome' });
  for (const c of zone.clear || []) M.clear(...c); // rects the edition keeps for its own set pieces
  // the gate: locked until this district's scene is done
  M.box([-3, 0, ZN - 0.2, 3, 4.5, ZN + 0.2], { mat: 'door', when: '!beat_done', id: `gate_${id}` });
  M.box([-3, 0, ZN - 4, 3, 4.5, ZN - T], { mat: 'gate', solid: false });
  M.box([-3.4, -T, ZN - 4, 3.4, 0, ZN], { mat: 'road' });
  M.box([-3.4, 0, ZN - 4, -3, 4.5, ZN], { mat: 'trim' });
  M.box([3, 0, ZN - 4, 3.4, 4.5, ZN], { mat: 'trim' });
  M.box([-3.4, 4.5, ZN - 4, 3.4, 4.9, ZN], { mat: 'trim' });
  M.texts.push({ text: beat.gate || zone.gate || (beat.kind === 'encounter' && zi === 3 ? 'LIFT - STATION ZERO' : 'NORTH GATE'), pos: [0, 5.6, ZN + 0.3], rotY: 0, size: 0.6, color: hex(zone.palette.accent) });
  M.clear(-6, ZN, 6, ZN + 10);
  M.clear(-6, -8, 6, 4); // the arrival plaza
  M.clear(-5, ZN, 5, 4); // the main avenue stays walkable

  // --- the scene of this sector ----------------------------------------------------
  const far = (z) => (canal ? Math.min(z, canalZ[1] - 8) : z);
  const sceneSide = rng.pick([-1, 1]);
  const scene = { x: sceneSide * rng.float(14, 22), z: far(rng.float(-62, -84)) };
  if (beat.kind === 'custom') {
    // the edition places its own scene (zone.overlay below): nothing here
  } else if (beat.kind === 'arrival' && rules?.nullField) {
    // a null field: no law reaches a roof, so the recorder waits on a plinth in the street
    const rx = sceneSide * 16, rz = canal ? -76 : -38;
    M.box([rx - 2.5, 0, rz - 2.5, rx + 2.5, 0.6, rz + 2.5], { mat: 'trim' });
    M.box([rx - 0.5, 0.6, rz - 0.4, rx + 0.5, 1.6, rz + 0.4], { mat: 'prop' });
    M.inter.push({ id: `log_${id}`, kind: 'terminal', pos: [rx, 1.85, rz], yaw: 0, r: 2.6, prompt: 'PLAY RECORDER', log: beat.log });
    M.clear(rx - 6, rz - 6, rx + 6, rz + 6);
    M.texts.push({ text: zone.motto, pos: [rx, 3.2, rz - 2.6], rotY: 0, size: 0.5, color: hex(zone.palette.accent) });
    scene.x = rx;
    scene.z = rz;
  } else if (beat.kind === 'arrival') {
    // a recorder on a landmark roof: the dome or the remembered stairs get you there
    const rx = sceneSide * 18, rz = canal ? -76 : -38, rh = 7;
    // a landmark roof: a tower block, a pump house, a giant tree's platform, a relay hut
    M.box([rx - 6, 0, rz - 6, rx + 6, rh, rz + 6], { mat: theme === 'forest' || theme === 'settlement' ? 'bark' : theme === 'reactor' || theme === 'ruin' ? 'industrial' : theme === 'cradle' ? 'pods' : theme === 'liminal' ? 'glassWall' : 'facade' });
    if (theme === 'forest' || theme === 'settlement') {
      for (const [dx, dz] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) {
        M.trees.push([rx + dx, rz + dz, rh + 6, 0.9, 3.4, dx + dz]);
        M.box([rx + dx - 0.7, 0, rz + dz - 0.7, rx + dx + 0.7, rh + 6, rz + dz + 0.7], { mat: 'bark', invisible: true });
      }
    }
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
    M.challenges.push({ key: 'roof', z0: 4, z1: ZN, hints: zone.hints?.roof || ZONE_HINTS.roof });
    M.texts.push({ text: zone.key === 'neon' ? 'FOLLOW THE PINK LIGHTS' : zone.motto, pos: [rx - sceneSide * 6.05, 4.5, rz], rotY: sceneSide > 0 ? -Math.PI / 2 : Math.PI / 2, size: 0.55, color: hex(zone.palette.accent) });
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
    M.box([sx - 6, 0, sz - 3, sx + 6, 9, sz - 1.8], { mat: theme === 'forest' ? 'bark' : theme === 'cradle' ? 'industrial' : 'facade' });
    M.box([sx - 4.6, 3.2, sz - 1.8, sx + 4.6, 6.8, sz - 1.6], { mat: 'screen', solid: false });
    M.texts.push({ text: beat.official, pos: [sx, 5.0, sz - 1.5], rotY: 0, size: 0.42, color: '#ffd6e6', when: story.residue ? `!@${story.residue}` : '!@ECHO' });
    M.texts.push({ text: beat.echo, pos: [sx, 5.0, sz - 1.5], rotY: 0, size: 0.42, color: '#8ff4ff', echo: true });
    M.inter.push({ id: `plaque_${id}`, kind: 'plaque', pos: [sx, 1.6, sz + 0.4], r: 3.6, prompt: 'READ THE SCREEN', beat });
    M.clear(sx - 8, sz - 4, sx + 8, sz + 8);
  } else if (beat.kind === 'scene' || beat.kind === 'choice') {
    // THE LAST VERSION: something to work at the heart of the district, and maybe someone beside it
    const sx = scene.x, sz = scene.z;
    const nookMat = theme === 'forest' || theme === 'settlement' ? 'bark' : theme === 'cradle' || theme === 'ruin' ? 'industrial' : theme === 'liminal' ? 'glassWall' : 'facade';
    M.box([sx - 4, 0, sz - 4, sx + 4, 4.2, sz - 3.4], { mat: nookMat });
    M.box([sx - 4, 4.2, sz - 4, sx + 4, 4.6, sz + 1], { mat: 'trim' });
    M.box([sx - 4, 0, sz - 4, sx - 3.4, 4.2, sz + 1], { mat: nookMat });
    M.box([sx + 3.4, 0, sz - 4, sx + 4, 4.2, sz + 1], { mat: nookMat });
    M.box([sx - 2.4, 3.3, sz - 3.35, sx + 2.4, 3.9, sz - 3.3], { mat: 'neon', solid: false });
    M.box([sx - 0.6, 0, sz - 2.2, sx + 0.6, 0.9, sz - 1.0], { mat: 'prop' });
    M.inter.push({ id: `${beat.kind}_${id}`, kind: 'scene', scene: beat.scene, pos: [sx, 1.3, sz - 1.6], r: 2.8, prompt: beat.prompt || 'EXAMINE', color: 0xffc04a });
    if (beat.npc) M.npcs.push({ id: `npc_${id}`, crew: beat.npc, pos: [sx + 2.2, 0, sz - 1.8], yaw: 0.4, hologram: !!beat.hologram, lines: beat.lines || [], choices: beat.choices, after: beat.after, when: beat.npcWhen });
    M.clear(sx - 7, sz - 6, sx + 7, sz + 8);
  } else if (beat.kind === 'encounter') {
    const c = story.cast[beat.crew ?? zone.crew];
    const sx = scene.x, sz = scene.z;
    // a lit nook for whoever is here: a stall, a hatch, a cabin, a beacon
    M.box([sx - 4, 0, sz - 4, sx + 4, 4.2, sz - 3.4], { mat: theme === 'forest' ? 'bark' : theme === 'cradle' ? 'industrial' : 'facade' });
    M.box([sx - 4, 4.2, sz - 4, sx + 4, 4.6, sz + 1], { mat: 'trim' });
    M.box([sx - 4, 0, sz - 4, sx - 3.4, 4.2, sz + 1], { mat: theme === 'forest' ? 'bark' : theme === 'cradle' ? 'industrial' : 'facade' });
    M.box([sx + 3.4, 0, sz - 4, sx + 4, 4.2, sz + 1], { mat: theme === 'forest' ? 'bark' : theme === 'cradle' ? 'industrial' : 'facade' });
    M.box([sx - 2.4, 3.3, sz - 3.35, sx + 2.4, 3.9, sz - 3.3], { mat: 'neon', solid: false });
    M.npcs.push({ id: `npc_${id}`, crew: c.id, pos: [sx, 0, sz - 1.6], yaw: 0, hologram: !c.alive, lines: beat.lines, junoAfter: beat.junoAfter, choices: beat.choices, after: beat.after, path: beat.path ? [[sx, sz - 1.6], [sx + 5, sz + 3], [sx - 5, sz + 3]] : undefined });
    if (theme === 'cradle') cradlePod(M, sx, sz, zone); // row one: Varga's pod, open if she is awake
    M.clear(sx - 7, sz - 6, sx + 7, sz + 8);
  } else if (beat.kind === 'verdict') {
    // WORLD FORGE's finale in the open: a chair on a plinth, the cast standing round it as echoes
    const sx = scene.x, sz = scene.z;
    M.box([sx - 5, 0, sz - 5, sx + 5, 0.5, sz + 5], { mat: 'trim' });
    M.box([sx - 0.6, 0.5, sz - 0.6, sx + 0.6, 1.1, sz + 0.6], { mat: 'prop' });
    M.inter.push({ id: 'chair', kind: 'chair', pos: [sx, 1.5, sz], r: 2.8, prompt: beat.prompt || 'SIT IN THE CHAIR' });
    const nj = Math.min(7, story.cast.length);
    for (let k = 0; k < nj; k++) {
      const a = (k / nj) * Math.PI * 2;
      M.npcs.push({ id: `juror_${k}`, crew: story.cast[k].id, pos: [sx + Math.sin(a) * 4.2, 0.5, sz + Math.cos(a) * 4.2], yaw: a + Math.PI, hologram: true, silent: true });
    }
    M.texts.push({ text: zone.motto, pos: [sx, 3.4, sz - 5.2], rotY: 0, size: 0.5, color: hex(zone.palette.accent) });
    M.clear(sx - 8, sz - 8, sx + 8, sz + 8);
  }
  if (canal && rules?.nullField) {
    // a null field: the bridge is real, the water is only water
    M.box([-3, -0.4, canalZ[1] - T, 3, 0, canalZ[0] + T], { mat: 'trim' });
    M.texts.push({ text: 'BRIDGE OPEN', pos: [0, 2.6, canalZ[0] + 1.2], rotY: 0, size: 0.5, color: hex(zone.palette.accent) });
  } else if (canal) {
    // the old bridge is a memory: solid with ECHOES SOLIDIFY IN ECHO
    M.box([-3, -0.4, canalZ[1], 3, 0, canalZ[0]], { mat: 'wall', echo: true });
    M.challenges.push({ key: 'canal', z0: canalZ[0] + 8, z1: canalZ[1] - 2, hints: zone.hints?.canal || ZONE_HINTS.canal });
    M.texts.push({ text: zone.canalSign || 'BRIDGE CLOSED', pos: [0, 2.6, canalZ[0] + 1.2], rotY: 0, size: 0.5, color: hex(zone.palette.accent) });
  }

  // --- drones on the far side ----------------------------------------------------------
  const nDrones = zone.drones ? zone.drones[si] ?? 0 : rules ? { NONE: 0, PATROL: 1 + (si > 0 ? 1 : 0), HUNT: 2 + si }[rules.watchers] ?? 1
    : theme === 'tower' ? 2 + si : theme === 'cradle' ? si : si === 2 || theme === 'city' && si === 1 ? 1 : 0;
  for (let k = 0; k < nDrones; k++) {
    const z = canal ? -64 - k * 9 : -40 - k * 12;
    const x0 = -XW + 6, x1 = XW - 6;
    M.sentinels.push({ path: k % 2 ? [[x1, z], [x0, z]] : [[x0, z], [x1, z]], speed: 2.2 + si * 0.3, range: 9, fov: 0.75 });
  }
  if (nDrones) M.challenges.push({ key: 'drones', z0: (canal ? canalZ[1] : -30), z1: ZN, hints: HINTS[`sentinel:${story.after?.sentinels}`] || zone.hints?.drones || ZONE_HINTS.drones });
  M.challenges.push({ key: 'gate', z0: ZN + 14, z1: ZN, hints: ZONE_HINTS.gate });
  // WORLD FORGE, time SWEEPERS: beams turn across the avenue; the sidewalks stay clear of them
  if (rules?.time === 'SWEEPERS') {
    M.hazards = [];
    for (const z of canal ? [-24, -70] : [-24, -52]) M.hazards.push({ kind: 'sweeper', pivot: [0, 0.75, z], radius: 4.3, speed: 1.1 + si * 0.2, phase: z });
    M.challenges.push({ key: 'sweepers', effect: 'timeStop', optional: true, z0: 4, z1: ZN, hints: HINTS.sweepers });
  }

  // --- the district: buildings, trees, tanks, masts --------------------------------------
  dressing(M, theme, rng, zone, canal ? canalZ : null);

  // three hidden memory fragments: a roof, a back street, the water's edge
  const lore = (story.fragments || FRAGMENTS)[zi] || [];
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

  // the edition's own set pieces, placed in its reserved rects
  if (zone.overlay) zone.overlay(M, si, { XW, ZN, H, canal, canalZ, rng, hex, scene });

  // tokens: new words for the device
  if (zone.key === 'neon' && si === 0) {
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
  const name = zone.names?.[si] ?? zone.rooms[(si * 2) % zone.rooms.length]; // an edition can name each district
  const room = {
    name, kind: 'district', beat: beat.kind,
    bounds: [[-XW, -12, ZN - 4, XW, H + 2, 4]],
    spawn: [0, 0.86, -2, 0],
    // a ZERO act has no state to come down in: drift at street height (jump to rise to the roofs)
    lights, tint: pal.tint, killY: -2, floatY: rules?.gravity === 'ZERO' && !rules.nullField ? 1.3 : 8.4,
    challenges: M.challenges.map((c) => ({ ...c, box: [-XW, -12, Math.min(c.z0, c.z1), XW, H + 2, Math.max(c.z0, c.z1)] })),
    route: [], exitSide: 'N', L: -ZN, W: XW * 2, H,
  };
  const level = {
    id, deck: zi, sector: si, seed: story.seed || 'halcyon', zone: true,
    deckName: zone.name, palette: pal,
    rooms: { [id]: room }, order: [id],
    elements: M.els.map((e) => ({ ...e, room: id })),
    texts: M.texts.map((t) => ({ ...t, room: id })),
    interactables: M.inter.map((t) => ({ ...t, room: id })),
    items: [],
    tokens: M.tokens.map((t) => ({ ...t, room: id })),
    hazards: (M.hazards || []).map((h) => ({ ...h, room: id })),
    sentinels: M.sentinels.map((s, k) => ({ ...s, room: id, id: `${id}_s${k}` })),
    npcs: M.npcs.map((n) => ({ ...n, room: id })),
    checkpoints: M.checkpoints.map((c) => ({ ...c, room: id })),
    map: { rooms: [{ id, rect: [-XW, ZN, XW, 4], name, kind: 'district' }], corridors: [], blocks: M.blocks || [], gate: [0, ZN - 2] },
    trees: M.trees, rocks: M.rocks,
    glows: [...M.glows, [scene.x, 0.02, scene.z + 1, 5, pal.accent], [0, 0.02, ZN + 2, 4, pal.accent2]],
    effects: new Set(['echoSolid', 'gravityFlip', 'zeroG', 'observerFrozen']),
    exit: { room: id, box: [-3, -1, ZN - 4, 3, 6, ZN - 1] },
    states: zone.states || null, // the temporal states this region was authored with (THE LAST VERSION)
    unstable: !!zone.unstable,
    triggers: (M.triggers || []).map((t) => ({ ...t, room: id })),
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
    cradle: ['ROW 12', 'MERIDIAN WARD', 'REACTOR WARD', 'FOREST WARD', 'QUIET - SLEEPERS', 'DO NOT WAKE', 'DORMANCY 98%', 'NIGHT WATCH'],
    rain: ['TRANSIT', 'HELIX TEMPORAL RESEARCH', '24H PHARMACY', 'LINE 41', 'COFFEE', 'NEWS', 'TAXI', 'PARKING', 'DENTIST', 'RAIN CITY SAVINGS'],
    ruin: ['NO SIGNAL', 'EVAC ROUTE', 'SHELTER', 'WARDEN POST', 'WATER HERE', 'DO NOT ENTER - UNSTABLE', 'TRADE', 'CLINIC'],
    settlement: ['WATER KEEPERS', 'THE FIRST FIRE', 'GRAIN', 'THE LONG STAIR', 'QUIET AT NIGHT'],
    liminal: ['⟲', '◯', '⌂', '✦', '⟲ ⟲', '◯ ◯ ◯'],
  }[theme] || ['-'];
  const signs2 = zone.signs || signs;
  const tries = theme === 'forest' || theme === 'ruin' || theme === 'settlement' ? 120 : 70;
  for (let i = 0; i < tries; i++) {
    const side = rng.pick([-1, 1]);
    const x = side * rng.float(9, XW - 4);
    const z = rng.float(ZN + 8, -10);
    if (theme === 'settlement' && rng.chance(0.4)) {
      // a stone house with a low roof and a warm window
      const w = rng.float(5, 8), d = rng.float(5, 8), h = rng.float(3, 4.5);
      const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2;
      if (!M.isFree(x0, z0, x1, z1) || inCanal(z0, z1)) continue;
      M.box([x0, 0, z0, x1, h, z1], { mat: 'stone' });
      M.box([x0 - 0.3, h, z0 - 0.3, x1 + 0.3, h + 0.35, z1 + 0.3], { mat: 'bark' });
      const fx = side > 0 ? x0 - 0.05 : x1 + 0.05;
      M.box([fx - 0.04, 0.9, (z0 + z1) / 2 - 0.5, fx + 0.04, 1.7, (z0 + z1) / 2 + 0.5], { mat: 'lamp', solid: false });
      M.glows.push([fx - side * 1.4, 0.02, (z0 + z1) / 2, 2.6, zone.palette.light]);
      if (rng.chance(0.5)) M.texts.push({ text: rng.pick(signs2), pos: [fx, 2.3, (z0 + z1) / 2], rotY: side > 0 ? -Math.PI / 2 : Math.PI / 2, size: 0.45, color: hex(zone.palette.accent) });
      M.blocks.push([x0, z0, x1, z1]);
      M.clear(x0, z0, x1, z1);
      continue;
    }
    if (theme === 'ruin' && rng.chance(0.45)) {
      // a ruined block: short, broken at the top, moss on it
      const w = rng.float(6, 11), d = rng.float(6, 12);
      const x0 = side > 0 ? Math.max(7, x - w / 2) : x - w / 2, x1 = Math.min(XW - 1, x0 + w);
      const z0 = z - d / 2, z1 = z + d / 2;
      if (!M.isFree(x0, z0, x1, z1) || inCanal(z0, z1)) continue;
      const h = rng.float(4, 13);
      M.box([x0, 0, z0, x1, h, z1], { mat: 'industrial' });
      M.box([x0, h, z0, x0 + (x1 - x0) * rng.float(0.3, 0.7), h + rng.float(1, 4), z1], { mat: 'industrial' }); // the broken top
      M.box([x0 - 0.1, h - 0.4, z0 - 0.1, x1 + 0.1, h + 0.05, z1 + 0.1], { mat: 'moss', solid: false });
      M.box([x0 - 0.3, 0, z0 - 0.3, x1 + 0.3, 0.3, z1 + 0.3], { mat: 'moss', solid: false });
      if (rng.chance(0.5)) M.texts.push({ text: rng.pick(signs2), pos: [side > 0 ? x0 - 0.06 : x1 + 0.06, rng.float(2.5, Math.max(3, h - 1)), (z0 + z1) / 2], rotY: side > 0 ? -Math.PI / 2 : Math.PI / 2, size: 0.55, color: hex(zone.palette.accent) });
      M.blocks.push([x0, z0, x1, z1]);
      M.clear(x0, z0, x1, z1);
      continue;
    }
    if (theme === 'forest' || theme === 'ruin' || theme === 'settlement') {
      // trunks and glowing canopies; some trees are only memories
      const r = rng.float(0.5, 1.1), h = rng.float(8, 16);
      if (!M.isFree(x - 2.5, z - 2.5, x + 2.5, z + 2.5, 0.5) || inCanal(z - 3, z + 3)) continue;
      const echo = rng.chance(0.18);
      const c = rng.float(2.2, 3.6);
      if (echo) {
        // a memory of a tree: an outline only
        M.box([x - r, 0, z - r, x + r, h, z + r], { mat: 'bark', echo, solid: false });
        M.box([x - c, h - 1, z - c, x + c, h + 1.6, z + c], { mat: 'leaf', solid: false, echo });
      } else {
        M.box([x - r * 0.8, 0, z - r * 0.8, x + r * 0.8, h, z + r * 0.8], { mat: 'bark', invisible: true });
        M.trees.push([x, z, h, r, c, rng.float(0, Math.PI * 2)]);
      }
      if (rng.chance(0.25)) {
        const b = rng.float(0.6, 1.4), bx = x + rng.float(-3, 3), bz = z + rng.float(-3, 3);
        if (M.isFree(bx - b, bz - b, bx + b, bz + b, 0.2)) M.rocks.push([bx, bz, b, rng.float(0, 6)]);
      }
      if (theme === 'forest' && rng.chance(0.4)) M.box([x - 0.25, 0, z + r, x + 0.25, 0.5, z + r + 0.6], { mat: 'neon', solid: false });
      M.clear(x - c, z - c, x + c, z + c);
      continue;
    }
    if (theme === 'cradle') {
      podBlock(M, rng, side, x, z, zone, inCanal, signs);
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
    // a ledge at every floor, a shopfront glow at street level, clutter on the roof
    for (let y = 4; y < h - 1; y += 4) M.box([x0 - 0.12, y, z0 - 0.12, x1 + 0.12, y + 0.18, z1 + 0.12], { mat: 'trimDark', solid: false });
    if ((theme === 'city' || theme === 'rain') && rng.chance(0.7)) {
      const fx = side > 0 ? x0 - 0.05 : x1 + 0.05;
      M.box([fx - 0.04, 0.4, z0 + 1, fx + 0.04, 2.8, z1 - 1], { mat: 'shopfront', solid: false });
      M.glows.push([fx - side * 1.6, 0.02, (z0 + z1) / 2, 3.4, theme === 'rain' ? zone.palette.light : zone.palette.accent2]);
    }
    for (let k = rng.int(1, 3); k > 0; k--) {
      const ux = rng.float(x0 + 1, x1 - 1.5), uz = rng.float(z0 + 1, z1 - 1.5);
      const kind = rng.pick(theme === 'tower' ? ['mast', 'ac', 'ac'] : ['ac', 'tank', 'mast']);
      if (kind === 'ac') M.box([ux, h + 0.35, uz, ux + 1.2, h + 1.2, uz + 0.9], { mat: 'metal' });
      else if (kind === 'tank') M.box([ux, h + 0.35, uz, ux + 1.4, h + 2.4, uz + 1.4], { mat: 'tank' });
      else M.box([ux, h + 0.35, uz, ux + 0.12, h + 3.5, uz + 0.12], { mat: 'trimDark', solid: false });
    }
    M.blocks.push([x0, z0, x1, z1]);
    M.clear(x0, z0, x1, z1);
    // a sign on the side facing the avenue
    if (rng.chance(0.7)) {
      const fx = side > 0 ? x0 - 0.06 : x1 + 0.06;
      M.texts.push({ text: rng.pick(signs2), pos: [fx, rng.float(3, Math.max(3.5, h - 2)), (z0 + z1) / 2], rotY: side > 0 ? -Math.PI / 2 : Math.PI / 2, size: rng.float(0.5, 0.9), color: hex(rng.chance(0.5) ? zone.palette.accent : zone.palette.accent2) });
    }
    if (theme === 'tower' && rng.chance(0.5)) M.box([(x0 + x1) / 2 - 0.15, h, (z0 + z1) / 2 - 0.15, (x0 + x1) / 2 + 0.15, h + rng.float(3, 6), (z0 + z1) / 2 + 0.15], { mat: 'neon', solid: false });
  }
  // street furniture along the avenue: lamps, crates, cars, pipes
  for (let z = -6; z > ZN + 8; z -= 9) {
    if (inCanal(z - 1, z + 1)) continue;
    for (const s of [-1, 1]) {
      const x = s * 5.6;
      M.box([x - 0.12, 0, z - 0.12, x + 0.12, 4.2, z + 0.12], { mat: 'trimDark' });
      // lamp: a dark housing on an arm, the light underneath
      M.box([Math.min(x, x - s * 1.05), 4.15, z - 0.06, Math.max(x, x - s * 1.05), 4.25, z + 0.06], { mat: 'trimDark', solid: false });
      M.box([x - s * 1.05 - 0.28, 4.1, z - 0.18, x - s * 1.05 + 0.28, 4.32, z + 0.18], { mat: 'trimDark', solid: false });
      M.box([x - s * 1.05 - 0.22, 4.06, z - 0.13, x - s * 1.05 + 0.22, 4.1, z + 0.13], { mat: 'lamp', solid: false });
      M.glows.push([x - s * 1.05, 0.02, z, 3.0, zone.palette.light, 4.05]);
    }
    if ((theme === 'city' || theme === 'rain' || theme === 'ruin') && rng.chance(theme === 'ruin' ? 0.3 : 0.45)) {
      const x = rng.pick([-1, 1]) * rng.float(9, 12);
      M.box([x - 0.95, 0.25, z - 2.2, x + 0.95, 0.95, z + 2.2], { mat: 'car' });
      M.box([x - 0.82, 0.95, z - 1.2, x + 0.82, 1.45, z + 0.9], { mat: 'carGlass', solid: false });
      for (const [wx, wz] of [[-0.8, -1.4], [0.8, -1.4], [-0.8, 1.4], [0.8, 1.4]]) M.box([x + wx - 0.15, 0, z + wz - 0.35, x + wx + 0.15, 0.6, z + wz + 0.35], { mat: 'tyre', solid: false });
      M.glows.push([x, 0.02, z - 2.6, 1.4, 0xff3030]);
    }
    if ((theme === 'reactor' || theme === 'cradle') && rng.chance(0.5)) {
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
  if (theme === 'forest' || theme === 'settlement') {
    M.box([-9, -0.05, -24, -3, 0.02, -18], { mat: 'water', solid: false });
  }
  if (theme === 'cradle') cradleCeiling(M, rng);
  if (theme === 'liminal') {
    // fragments of other places float in the air: blocks at odd heights, some only memories
    for (let i = 0, n = 0; i < 80 && n < 26; i++) {
      const x = rng.pick([-1, 1]) * rng.float(8, XW - 3), z = rng.float(ZN + 8, -8);
      const w = rng.float(2, 5), y = rng.float(2.5, 9), h = rng.float(0.4, 1.2);
      if (!M.isFree(x - w / 2, z - w / 2, x + w / 2, z + w / 2, 0.4)) continue;
      M.box([x - w / 2, y, z - w / 2, x + w / 2, y + h, z + w / 2], rng.chance(0.3) ? { mat: 'wall', echo: true } : { mat: rng.pick(['stone', 'facade', 'industrial', 'bark']) });
      n++;
    }
  }
}

// --- THE CRADLE (theme 'cradle') ------------------------------------------------------
// A bank of sleeping pods on a low plinth, or a stack of them in tiers, in the slot a building
// would take. Lids are decided here from the ending (zone.podsOpen), so they merge into one mesh.
function podBlock(M, rng, side, x, z, zone, inCanal, signs) {
  const w = rng.float(6, 10), d = rng.float(6, 12);
  const x0 = side > 0 ? Math.max(7, x - w / 2) : x - w / 2, x1 = Math.min(XW - 1, x0 + w);
  const z0 = z - d / 2, z1 = z + d / 2;
  if (!M.isFree(x0, z0, x1, z1) || inCanal(z0, z1)) return;
  if (rng.chance(0.4)) {
    // a stack: tiers of glowing pods in a steel frame; its roof holds a fragment
    const h = rng.float(6, 14);
    M.box([x0, 0, z0, x1, h, z1], { mat: 'pods' });
    M.box([x0 - 0.2, h, z0 - 0.2, x1 + 0.2, h + 0.35, z1 + 0.2], { mat: 'trim' });
    for (let k = rng.int(1, 2); k > 0; k--) {
      const ux = rng.float(x0 + 1, x1 - 1.5), uz = rng.float(z0 + 1, z1 - 1.5);
      M.box([ux, h + 0.35, uz, ux + 1.2, h + 1.2, uz + 0.9], { mat: 'metal' });
    }
    if (rng.chance(0.7)) {
      const fx = side > 0 ? x0 - 0.06 : x1 + 0.06;
      M.texts.push({ text: rng.pick(signs), pos: [fx, rng.float(3, Math.max(3.5, h - 2)), (z0 + z1) / 2], rotY: side > 0 ? -Math.PI / 2 : Math.PI / 2, size: rng.float(0.5, 0.8), color: hex(zone.palette.accent) });
    }
  } else {
    // a bank: two rows of pods on a 1.2 m plinth, low cover from the drones
    M.box([x0, 0, z0, x1, 1.2, z1], { mat: 'metal' });
    for (const cx of [x0 + (x1 - x0) * 0.3, x0 + (x1 - x0) * 0.7]) {
      for (let pz = z0 + 1.4; pz < z1 - 1.2; pz += 2.6) {
        if (zone.podsOpen) M.box([cx - 0.5, 1.2, pz + 1.0, cx + 0.5, 2.6, pz + 1.1], { mat: 'glassWall', solid: false }); // the lid stands open
        else M.box([cx - 0.5, 1.2, pz - 1.1, cx + 0.5, 1.75, pz + 1.1], { mat: 'glassWall', solid: false });
        M.box([cx - 0.08, 1.2, pz - 1.25, cx + 0.08, 1.32, pz - 1.15], { mat: 'podLight', solid: false });
      }
      M.glows.push([cx, 1.22, (z0 + z1) / 2, 1.6, zone.palette.accent2]);
    }
  }
  M.blocks.push([x0, z0, x1, z1]);
  M.clear(x0, z0, x1, z1);
}

// Row one: Varga's pod against the back of the lit nook. The lid stands open if she is awake.
function cradlePod(M, sx, sz, zone) {
  M.box([sx - 1.2, 0, sz - 3.35, sx + 1.2, 0.8, sz - 2.45], { mat: 'metal' });
  if (zone.awake) M.box([sx - 1.0, 0.8, sz - 3.38, sx + 1.0, 2.6, sz - 3.3], { mat: 'glassWall', solid: false });
  else M.box([sx - 1.0, 0.8, sz - 3.3, sx + 1.0, 1.25, sz - 2.5], { mat: 'glassWall', solid: false });
  M.box([sx - 0.1, 0.8, sz - 2.5, sx + 0.1, 0.9, sz - 2.42], { mat: 'podLight', solid: false });
  M.texts.push({ text: 'ROW ONE  -  I. VARGA', pos: [sx, 2.9, sz - 3.28], rotY: 0, size: 0.32, color: hex(zone.palette.accent) });
}

// The underside of the Glass Forest: roots hang from the ceiling, so the INVERTED walk weaves
// between them; one in five is only a memory. They keep out of every clear rect (the avenue, the
// arrival roof, the scenes, the stacks), so every dome answer still has a straight path. The core
// well comes down the middle, with the reactor's flood water still falling down its face.
function cradleCeiling(M, rng) {
  for (let i = 0, n = 0; i < 90 && n < 24; i++) {
    const x = rng.pick([-1, 1]) * rng.float(8, XW - 2), z = rng.float(ZN + 6, -6);
    const r = rng.float(0.3, 0.8), h = rng.float(4, 12);
    if (!M.isFree(x - r, z - r, x + r, z + r, 0.6)) continue;
    M.box([x - r, H - h, z - r, x + r, H, z + r], rng.chance(0.2) ? { mat: 'root', echo: true } : { mat: 'root' });
    n++;
  }
  M.box([-2.5, 0, -30, 2.5, H, -25], { mat: 'industrial' });
  M.box([-1.2, 0, -25, 1.2, H, -24.9], { mat: 'water', solid: false });
}
