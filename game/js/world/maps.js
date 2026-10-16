// AFTERZERO - Station Zero vertical slice.
//
// Everything here is data. Elements are axis-aligned boxes with optional
// conditions (`when`, see core/conditions.js) evaluated against the facts
// and the state of the element's room. `echo: true` marks memory-geometry:
// visible in ECHO (or with an ECHOES PERSIST law), solid only with an
// ECHOES SOLIDIFY law. The same authoring model maps 1:1 onto UE5 actors
// (see docs/REALITY_ENGINE.md).
//
//                        N (-z)
//          +----------------------------+
//          |   ARCHIVE  (vault / pit)   |
//          +-------------+--------------+
//                        |
//  +-----------------+   |   +----------------+
//  | OBSERVATION     |---LAB  (hub, 5 layers)--| passage (shadow)
//  | HALL (Observer) |   |   +----------------+
//  +-----------------+   |
//                        |
//                 ANTECHAMBER (start)
//                        S (+z)

const T = 0.4; // wall thickness
export const elements = [];
export const texts = [];

function add(room, b, o = {}) {
  elements.push({ room, box: b, mat: 'wall', solid: true, ...o });
}

// Wall along an axis with rectangular openings cut out of it.
// openings: [a0, a1, y0, y1] in wall-local "along" coordinates.
function wall(room, axis, fixed0, fixed1, a0, a1, y0, y1, openings = [], o = {}) {
  const mk = (s0, s1, h0, h1) => {
    if (s1 - s0 < 0.01 || h1 - h0 < 0.01) return;
    if (axis === 'x') add(room, [s0, h0, fixed0, s1, h1, fixed1], o);
    else add(room, [fixed0, h0, s0, fixed1, h1, s1], o);
  };
  let cur = a0;
  for (const [o0, o1, oy0, oy1] of [...openings].sort((p, q) => p[0] - q[0])) {
    mk(cur, o0, y0, y1);
    mk(o0, o1, y0, oy0);
    mk(o0, o1, oy1, y1);
    cur = o1;
  }
  mk(cur, a1, y0, y1);
}

// A room: floor, ceiling and four walls with openings. Returns nothing; pushes elements.
function shell(room, [x0, y0, z0, x1, y1, z1], opt = {}) {
  const open = opt.open || {};
  const skip = opt.skip || [];
  const wm = opt.wallMat || {};
  if (opt.floor !== false) add(room, [x0 - T, y0 - T, z0 - T, x1 + T, y0, z1 + T], { mat: opt.floorMat || 'floor' });
  if (opt.ceil !== false) add(room, [x0 - T, y1, z0 - T, x1 + T, y1 + T, z1 + T], { mat: opt.ceilMat || 'ceil' });
  const sides = {
    N: ['x', z0 - T, z0, x0 - T, x1 + T],
    S: ['x', z1, z1 + T, x0 - T, x1 + T],
    W: ['z', x0 - T, x0, z0, z1],
    E: ['z', x1, x1 + T, z0, z1],
  };
  for (const [side, [axis, f0, f1, a0, a1]] of Object.entries(sides)) {
    if (skip.includes(side)) continue;
    wall(room, axis, f0, f1, a0, a1, y0, y1, open[side] || [], { mat: wm[side] || opt.wall || 'wall' });
    if (opt.lining?.[side]) {
      // A thin interior skin that can be removed to reveal the material behind.
      const inset = side === 'N' || side === 'W' ? [f1, f1 + 0.06] : [f0 - 0.06, f0];
      wall(room, axis, inset[0], inset[1], axis === 'x' ? a0 + T : a0, axis === 'x' ? a1 - T : a1, y0, y1, open[side] || [], {
        mat: opt.lining[side].mat || 'wall',
        when: opt.lining[side].when,
        solid: false,
      });
    }
  }
  if (opt.strip) {
    const c = opt.strip;
    add(room, [x0, y0, z0, x1, y0 + 0.08, z0 + 0.05], { mat: c, solid: false });
    add(room, [x0, y0, z1 - 0.05, x1, y0 + 0.08, z1], { mat: c, solid: false });
    add(room, [x0, y0, z0, x0 + 0.05, y0 + 0.08, z1], { mat: c, solid: false });
    add(room, [x1 - 0.05, y0, z0, x1, y0 + 0.08, z1], { mat: c, solid: false });
  }
}

// A straight corridor between two openings (no end walls).
function corridor(room, axis, [x0, y0, z0, x1, y1, z1], mat = 'wall') {
  add(room, [x0 - T, y0 - T, z0, x1 + T, y0, z1], { mat: 'floor' });
  add(room, [x0 - T, y1, z0, x1 + T, y1 + T, z1], { mat: 'ceil' });
  if (axis === 'z') {
    add(room, [x0 - T, y0, z0, x0, y1, z1], { mat });
    add(room, [x1, y0, z0, x1 + T, y1, z1], { mat });
  } else {
    add(room, [x0, y0, z0 - T, x1, y1, z0], { mat });
    add(room, [x0, y0, z1, x1, y1, z1 + T], { mat });
  }
}

function text(room, str, pos, rotY, o = {}) {
  texts.push({ room, text: str, pos, rotY, size: 0.5, color: '#2f7f9e', ...o });
}

// ---------------------------------------------------------------------------
// ROOMS
// ---------------------------------------------------------------------------
const Y = [-12, 14];
export const rooms = {
  antechamber: {
    name: 'ANTECHAMBER',
    bounds: [
      [-4, Y[0], 17.6, 4, Y[1], 26],
      [-1.5, Y[0], 12, 1.5, Y[1], 17.6],
    ],
    spawn: [0, 0.86, 23.6, 0],
    lights: [[0, 3.6, 22, 0xd8ccff, 2.2, 14], [0, 3.5, 14.5, 0xc8d4ff, 1.2, 8]],
    tint: 0xd8d0ff,
  },
  lab: {
    name: 'LABORATORY',
    bounds: [
      [-12, Y[0], -12, 12, Y[1], 12],
      [12, Y[0], 4.5, 17, Y[1], 7.5],
    ],
    spawn: [0, 0.86, 8, 0],
    lights: [[0, 8.5, 0, 0xcfe6ff, 2.4, 26], [-8, 5, 8, 0xffd29a, 1.6, 14], [8, 5, -6, 0x9fd8ff, 1.4, 14], [14.5, 2.6, 6, 0xd8ccff, 1.2, 6]],
    tint: 0xbfe0ff,
  },
  hall: {
    name: 'OBSERVATION HALL',
    bounds: [
      [-50, Y[0], -8, -16, Y[1], 8],
      [-16, Y[0], -2, -12, Y[1], 2],
    ],
    spawn: [-17.5, 0.86, 0, Math.PI / 2],
    lights: [[-22, 7, 0, 0xffd6a0, 2.4, 22], [-34, 7, 0, 0xffcf98, 2.2, 22], [-46, 7, 0, 0xffe0b0, 2.2, 20], [-28, 2, 6, 0xc8b8ff, 1.2, 12]],
    tint: 0xffe0c0,
  },
  archive: {
    name: 'ARCHIVE',
    bounds: [
      [-10, Y[0], -36, 10, Y[1], -16],
      [-2, Y[0], -16, 2, Y[1], -12],
    ],
    spawn: [0, 0.86, -18, 0],
    lights: [[0, 6.5, -20, 0xc8fff0, 2.0, 18], [0, 6.5, -33, 0xc8f0ff, 1.8, 14], [0, -3, -27, 0x9fc8ff, 1.4, 12]],
    tint: 0xc8f5ea,
    killY: -4,
  },
};

// ---------------------------------------------------------------------------
// ANTECHAMBER - "The Unknown". No instructions. A floating object.
// ---------------------------------------------------------------------------
shell('antechamber', [-4, 0, 18, 4, 4.5, 26], { open: { N: [[-1.5, 1.5, 0, 4.5]] }, strip: 'stripViolet' });
// The wall where the door "appears": present in every state except INVERTED.
add('antechamber', [-1.5, 0, 17.6, 1.5, 4.5, 18], { mat: 'wallDark', when: '!@INVERTED', id: 'ante_seal' });
corridor('antechamber', 'z', [-1.5, 0, 12.4, 1.5, 4.5, 17.6]);
// ribs in the corridor, hanging from what will become the floor
for (let z = 13.4; z < 17.6; z += 1.4) add('antechamber', [-1.5, 4.2, z, 1.5, 4.5, z + 0.2], { mat: 'stripViolet', solid: false });
// debris that reacts to gravity (decor only)
export const drifters = [
  { room: 'antechamber', pos: [-2.6, 0.25, 20.2], size: 0.5 },
  { room: 'antechamber', pos: [2.8, 0.3, 21.0], size: 0.6 },
  { room: 'antechamber', pos: [-2.2, 0.2, 24.8], size: 0.4 },
  { room: 'antechamber', pos: [2.4, 0.35, 24.1], size: 0.7 },
  { room: 'antechamber', pos: [1.0, 0.15, 19.2], size: 0.3 },
];
text('antechamber', 'SUBJECT HOLDING  -  CYCLE 0', [0, 3.6, 25.95], Math.PI, { size: 0.32, color: '#6f5fcf' });
// Upside-down writing on the ceiling: only readable once the room is inverted.
text('antechamber', 'YOU HAVE BEEN HERE BEFORE', [0, 4.45, 21], 0, { size: 0.4, color: '#cf4f8f', ceiling: true });

// ---------------------------------------------------------------------------
// LABORATORY - the hub. Revisited; changes meaning five times.
// ---------------------------------------------------------------------------
shell('lab', [-12, 0, -12, 12, 10, 12], {
  open: {
    S: [[-1.5, 1.5, 0, 4.5]],
    W: [[-2, 2, 0, 4]],
    N: [[-2, 2, 0, 4]],
    E: [[4.5, 7.5, 0, 3]],
  },
  // East and south walls are glass behind a removable skin: activation reveals space.
  wallMat: { E: 'glass', S: 'glass' },
  lining: { E: { when: '!machine_activated' }, S: { when: '!machine_activated' } },
  strip: 'stripCool',
});
// Door that seals the way back to the antechamber.
add('lab', [-1.5, 0, 12, 1.5, 4.5, 12.4], { mat: 'door', when: 'left_antechamber' });
// Archive door (sealed until the laboratory is proven to exist).
add('lab', [-2, 0, -12.4, 2, 4, -12], { mat: 'doorArchive', when: '!archive_open', id: 'archive_door' });
// Hidden passage panel on the east wall.
add('lab', [12, 0, 4.5, 12.4, 3, 7.5], { mat: 'wall', when: '!shadow_passage_open', id: 'shadow_panel' });
// A faint outline around the panel - visible if you look closely.
add('lab', [11.9, 3.0, 4.4, 11.93, 3.06, 7.6], { mat: 'stripFaint', solid: false, when: '!shadow_passage_open' });
add('lab', [11.9, 0, 4.4, 11.93, 3.06, 4.46], { mat: 'stripFaint', solid: false, when: '!shadow_passage_open' });
add('lab', [11.9, 0, 7.54, 11.93, 3.06, 7.6], { mat: 'stripFaint', solid: false, when: '!shadow_passage_open' });

// The Machine.
add('lab', [-2, 0, -2, 2, 0.8, 2], { mat: 'metal', id: 'machine_base' });
add('lab', [-0.6, 0.8, 1.4, 0.6, 1.0, 2], { mat: 'accent', solid: false });

// Recording terminal R1, benches, shelves.
add('lab', [-9, 0, 7.5, -7, 1.0, 8.5], { mat: 'metal' });
add('lab', [-11.6, 0, -10, -10.6, 4, 4], { mat: 'shelf' });
add('lab', [7, 0, -7, 10, 0.9, -5], { mat: 'metal' }); // desk holding the key's memory
add('lab', [-8, 0, -8, -4, 1.0, -6.6], { mat: 'metal' });
add('lab', [4, 0, 6, 7, 1.0, 7.2], { mat: 'metal' });
add('lab', [-10.6, 0, 9, -9.4, 1.2, 10.2], { mat: 'crate' });
add('lab', [-9.2, 0, 9.4, -8.2, 0.9, 10.4], { mat: 'crate' });
add('lab', [9, 0, 9, 10.4, 1.4, 10.4], { mat: 'crate' });
// Overhead gantry (decor) - you can walk on its underside when inverted.
add('lab', [-11.6, 9.4, -1, 11.6, 9.6, 1], { mat: 'metal', solid: false });
// Ceiling alcove around the PERSISTS token: a hanging frame that reads as a
// "room on the ceiling" once inverted.
add('lab', [-8, 8.6, -8.2, -4, 10, -8], { mat: 'metal' });
add('lab', [-8, 8.6, -4, -4, 10, -3.8], { mat: 'metal' });
add('lab', [-8.2, 8.6, -8.2, -8, 10, -3.8], { mat: 'metal' });

// Echo layer: things that happened here.
add('lab', [-0.4, 0, 9.0, 0.4, 0.02, 9.6], { echo: true, solid: false });
add('lab', [0.3, 0, 7.6, 1.1, 0.02, 8.2], { echo: true, solid: false });
add('lab', [-0.3, 0, 6.2, 0.5, 0.02, 6.8], { echo: true, solid: false });
add('lab', [0.4, 0, 4.8, 1.2, 0.02, 5.4], { echo: true, solid: false });
add('lab', [-0.2, 0, 3.4, 0.6, 0.02, 4.0], { echo: true, solid: false });
add('lab', [-11.0, 0.9, 1.0, -10.6, 3.2, 3.6], { echo: true, solid: false }); // missing shelf
text('lab', 'THE ROOM REMEMBERS', [0, 6.2, -11.95], 0, { echo: true, size: 0.9, color: '#0e7c88' });
text('lab', 'STAND WHERE IT ISN\'T', [11.88, 4.2, 0], -Math.PI / 2, { echo: true, size: 0.6, color: '#0e7c88' });
text('lab', 'DO NOT ACTIVATE', [-11.95, 5.2, -2], Math.PI / 2, { echo: true, size: 0.7, color: '#0e7c88' });
text('lab', 'LAB 0  -  FIELD CONTAINMENT', [0, 6.5, 11.88], Math.PI, { size: 0.5, color: '#4a6a8a', when: '!machine_activated' });
text('lab', 'VESSEL AFTERZERO  -  LIFE SUPPORT: 1 OCCUPANT', [0, 6.5, 11.88], Math.PI, { size: 0.45, color: '#c06a1e', when: 'machine_activated' });
text('lab', 'ARCHIVE', [0, 4.6, -11.95], 0, { size: 0.45 });
text('lab', 'OBSERVATION', [-11.95, 4.5, 0], Math.PI / 2, { size: 0.45, color: '#c2574a' });

// Passage behind the shadow: a small room with your own recording.
shell('lab', [12.4, 0, 4.5, 17, 3, 7.5], { skip: ['W'], strip: 'stripViolet' });
add('lab', [16.2, 0, 5.4, 16.9, 1.1, 6.6], { mat: 'metal' });
text('lab', 'RECORDING 0', [16.95, 1.9, 6], -Math.PI / 2, { size: 0.3, color: '#6f5fcf' });

// Brain + cables (layers 3 and 4 of the lab).
export const cables = [
  { room: 'lab', when: 'brain_seen', pts: [[0, 0.82, -1.5], [-3, 0.1, -1.2], [-8, 0.1, -0.8], [-12, 0.1, -0.5], [-13.5, 0.4, -0.2]] },
  { room: 'lab', when: 'brain_seen', pts: [[0, 0.82, 1.5], [-4, 0.1, 1.2], [-9, 0.1, 0.8], [-12, 0.1, 0.5], [-13.5, 0.4, 0.2]] },
];

// ---------------------------------------------------------------------------
// OBSERVATION HALL - the Observer's territory.
// ---------------------------------------------------------------------------
shell('hall', [-50, 0, -8, -16, 9, 8], { open: { E: [[-2, 2, 0, 4]] }, strip: 'stripRed', wall: 'wallDark' });
corridor('hall', 'x', [-15.6, 0, -2, -12.4, 4, 2], 'wallDark');
export const pillars = [
  ['p1', -21, -4.5], ['p2', -21, 4.5], ['p3', -27, 0], ['p4', -30, -4.5], ['p5', -30, 4.5],
  ['p6', -34, 0], ['p7', -39, -4.5], ['p8', -39, 4.5], ['p9', -43, 0], ['p10', -46, -4.5], ['p11', -46, 4.5],
].map(([id, x, z]) => ({ id, x, z, s: 0.8 }));
for (const p of pillars) {
  add('hall', [p.x - p.s, 0, p.z - p.s, p.x + p.s, 9, p.z + p.s], { mat: 'pillar', id: p.id });
  add('hall', [p.x - p.s - 0.02, 2.0, p.z - p.s - 0.02, p.x + p.s + 0.02, 2.1, p.z + p.s + 0.02], { mat: 'stripRed', solid: false });
}
add('hall', [-48.6, 0, -0.6, -47.4, 1.0, 0.6], { mat: 'metal' }); // core pedestal
text('hall', 'OBSERVATION HALL  -  DO NOT RUN', [-16.05, 5.5, 0], -Math.PI / 2, { size: 0.45, color: '#c2574a' });
text('hall', 'IT ONLY KNOWS WHAT YOU TEACH IT', [-49.95, 4.5, 0], Math.PI / 2, { echo: true, size: 0.7, color: '#0e7c88' });

export const hall = {
  room: 'hall',
  bounds: [-50, -8, -16, 8],
  corridor: [-16, -2, -12, 2],
  lanes: { north: [-8, -2.4], centre: [-2.4, 2.4], south: [2.4, 8] },
  entranceX: -19,
  farX: -44,
  spawn: [-42, 0, 0],
  tether: [-13.6, 0, 0],
};

// ---------------------------------------------------------------------------
// ARCHIVE - "The laboratory has never existed."
// ---------------------------------------------------------------------------
shell('archive', [-10, 0, -36, 10, 8, -16], { open: { S: [[-2, 2, 0, 4]] }, floor: false, strip: 'stripTeal' });
corridor('archive', 'z', [-2, 0, -15.6, 2, 4, -12.4]);
add('archive', [-10.4, -0.4, -24, 10.4, 0, -16], { mat: 'floor' });
add('archive', [-10.4, -0.4, -36.4, 10.4, 0, -30], { mat: 'floor' });
// the gap
add('archive', [-10, -6.4, -30, 10, -6, -24], { mat: 'floorDark' });
add('archive', [-10.4, -6, -30, -10, 0, -24], { mat: 'wallDark' });
add('archive', [10, -6, -30, 10.4, 0, -24], { mat: 'wallDark' });
add('archive', [-10, -6, -24.4, 10, -0.4, -24], { mat: 'wallDark' });
add('archive', [-10, -6, -30, 10, -0.4, -29.6], { mat: 'wallDark' });
// The bridge exists only as a memory.
add('archive', [-1.2, -0.25, -30, 1.2, 0, -24], { echo: true, id: 'echo_bridge' });
// Hanging stacks block the ceiling route across the gap.
add('archive', [-10, 2.4, -27.2, 10, 8, -26.8], { mat: 'shelf' });
// shelves
for (const x of [-9.2, -6.6, 6.6, 9.2].map((v) => v)) add('archive', [x - 0.5, 0, -23, x + 0.5, 4.5, -17.5], { mat: 'shelf' });
add('archive', [-1, 0, -35.5, 1, 1.0, -34.6], { mat: 'metal' }); // vault terminal R2
for (const x of [-8, 8]) add('archive', [x - 1, 0, -35.6, x + 1, 3.5, -34.8], { mat: 'shelf' });
text('archive', 'NO RECORD OF LABORATORY', [0, 5.8, -35.95], 0, { size: 0.5, color: '#24927a', when: '!custodian_remembers' });
text('archive', 'RECORDS RESTORED: LABORATORY (2 VISITS)', [0, 5.8, -35.95], 0, { size: 0.45, color: '#24927a', when: 'custodian_remembers' });
text('archive', 'MEMORY IS LOAD-BEARING', [0, 2.4, -24.1], 0, { echo: true, size: 0.5, color: '#0e7c88' });

// ---------------------------------------------------------------------------
// INTERACTABLES, ITEMS, TOKENS, TRIGGERS
// ---------------------------------------------------------------------------
export const interactables = [
  { id: 'shard', room: 'antechamber', pos: [0, 1.7, 21.5], r: 2.6, kind: 'shard', when: '!has_device', prompt: 'TOUCH' },
  { id: 'other', room: 'antechamber', pos: [0, 3.6, 14.5], r: 0, kind: 'other', when: 'shard_touch >= 2 && !other_gone' },
  { id: 'r1', room: 'lab', pos: [-8, 1.3, 7.3], r: 2.2, kind: 'terminal', prompt: 'PLAY RECORDING' },
  { id: 'machine', room: 'lab', pos: [0, 1.2, 2.2], r: 2.4, kind: 'machine', prompt: 'MACHINE' },
  { id: 'archive_lock', room: 'lab', pos: [3, 1.4, -11.7], r: 2.2, kind: 'panel', when: '!archive_open', prompt: 'ARCHIVE PANEL' },
  { id: 'shadow', room: 'lab', pos: [11, 1, 0], r: 2.4, kind: 'shadow', when: '@ECHO && !shadow_passage_open', prompt: 'TOUCH THE SHADOW' },
  { id: 'r0', room: 'lab', pos: [15.8, 1.3, 6], r: 2.2, kind: 'terminal', prompt: 'PLAY RECORDING 0' },
  { id: 'brain', room: 'lab', pos: [0, 3.6, 0], r: 4.2, kind: 'brain', when: 'machine_activated && @ECHO', prompt: 'LOOK CLOSER' },
  { id: 'custodian', room: 'archive', pos: [0, 1.6, -20.5], r: 2.8, kind: 'npc', when: 'archive_open', prompt: 'SPEAK' },
  { id: 'r2', room: 'archive', pos: [0, 1.3, -34.2], r: 2.2, kind: 'terminal', prompt: 'PLAY RECORDING' },
];

// Things you can carry. echo items only exist in the ECHO state of their room.
export const items = [
  { id: 'key', room: 'lab', pos: [8.5, 1.05, -6], echo: true, label: 'LABORATORY KEY', when: '!archive_open' },
  { id: 'core', room: 'hall', pos: [-48, 1.35, 0], label: 'POWER CORE', when: '!core_installed' },
];

// Law tokens: walk into them.
export const tokens = [
  { token: 'HELD', room: 'lab', pos: [14.2, 1.1, 6] },
  { token: 'PERSISTS', room: 'lab', pos: [-6, 9.15, -6], hang: true },
  { token: 'OBSERVER', room: 'hall', pos: [-18.6, 1.1, 6.6] },
  { token: 'FREEZES', room: 'hall', pos: [-48.2, 1.1, -6.6] },
  { token: 'ALL', room: 'archive', pos: [-6, 1.1, -33] },
];

export const triggers = [
  { id: 'enter_lab', room: 'lab', box: [-11, -5, -11, 11, 12, 10.6], set: { left_antechamber: true } },
  { id: 'enter_hall', room: 'hall', box: [-50, -5, -8, -16, 12, 8], set: { hall_seen: true } },
  { id: 'enter_archive', room: 'archive', box: [-10, -5, -24, 10, 12, -16], set: { archive_seen: true } },
  { id: 'enter_vault', room: 'archive', box: [-10, -1, -36, 10, 12, -30], set: { vault_entered: true } },
];

export const SHADOW = { wallX: 11.78, panelZ: 6, range: 9.5, tolerance: 1.3 };
