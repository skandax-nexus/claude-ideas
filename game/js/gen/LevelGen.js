// Level generator: builds the sectors of the vessel from a seed.
//
// A sector is a chain of rooms joined by short corridors. Each room is put
// together from SEGMENTS laid end to end (a pit, a bank of time-sweepers, a
// watched hall...) and finished with an EXIT (a plain door, a door on the
// ceiling, a door on a high ledge, a key lock, a power-core socket). Every
// segment and exit knows which law effect solves it, and the generator never
// asks for more distinct effects in one room than the device has slots - so
// every room is solvable by construction (tests/gen.test.mjs checks this for
// thousands of seeds).
//
// All geometry is authored in a room-local frame: the entry door is on the
// south wall at z = 0, the room runs north to z = -L, x spans -W/2..W/2,
// the floor is y = 0 and the ceiling y = H. Rooms are then rotated in 90°
// steps and translated, so corridors can turn left and right and the map of a
// sector looks like a real ship, not a straight line.
import { Rng } from './rng.js';

const T = 0.4; // wall thickness
const CL = 4; // corridor length
const DOOR_W = 1.5; // half width of a doorway
const DOOR_H = 4;

export const MECHANICS = {
  gravity: { effect: 'gravityFlip', deck: 0 },
  echo: { effect: 'echoSolid', deck: 1 },
  zerog: { effect: 'zeroG', deck: 2 },
  time: { effect: 'timeStop', deck: 3 },
  sentinel: { effect: null, deck: 4 }, // observerFrozen helps, sneaking also works
  light: { effect: 'lightSolid', deck: 5 },
};
const FEATURE_MECH = { gravity: 'gravity', echo: 'echo', zerog: 'zerog', time: 'time', sentinel: 'sentinel', light: 'light' };
export const NEW_TOKENS = { 3: ['TIME'], 5: ['LIGHT'] }; // deck index -> tokens introduced there

export const SECTORS_PER_DECK = 4;

// ---------------------------------------------------------------------------------
// Hints (TICK) per challenge: nudge, direction, answer.
export const HINTS = {
  'pit:gravity': ['THE FLOOR STOPS. THE CEILING DOES NOT.', 'WHAT IF THE CEILING WERE THE FLOOR?', 'SHIFT THIS ROOM TO INVERTED, WALK ACROSS ON THE CEILING, THEN SHIFT BACK OVER THE FAR LEDGE.'],
  'pit:echo': ['SOMETHING WAS BUILT HERE ONCE.', 'IN ECHO YOU CAN SEE THE OLD BRIDGE. IT IS ONLY A MEMORY.', 'WRITE  ECHOES  SOLIDIFY IN  ECHO  IN A FREE SLOT, SHIFT TO ECHO, AND WALK THE BRIDGE.'],
  'pit:light': ['THE GOLD OUTLINE IS A BRIDGE THAT HAS NOT DECIDED TO EXIST.', 'HARD LIGHT NEEDS A LAW TO HOLD WEIGHT.', 'WRITE  LIGHT  SOLIDIFY IN  (THIS ROOM\'S STATE)  AND CROSS.'],
  'pit:zerog': ['THE CEILING IS BLOCKED. THE BRIDGE IS GONE. WHAT IS LEFT?', 'NOTHING HOLDS YOU DOWN IF GRAVITY STOPS.', 'WRITE  GRAVITY  FREEZES IN  PHYSICAL  (OR ANY STATE), SET THE ROOM TO IT, AND DRIFT ACROSS.'],
  'ledge:zerog': ['THE DOOR IS UP THERE. TOO HIGH TO JUMP.', 'IN ZERO-G YOU FLOAT. HIGH, IN THIS ROOM.', 'WRITE  GRAVITY  FREEZES IN  (A STATE), SHIFT TO IT, FLOAT UP TO THE LEDGE.'],
  'ledge:echo': ['THERE WERE STAIRS HERE ONCE.', 'SHIFT TO ECHO TO SEE THE STAIRS. THEN MAKE MEMORIES SOLID.', 'ECHOES  SOLIDIFY IN  ECHO, SHIFT TO ECHO, CLIMB.'],
  'ledge:light': ['GOLD OUTLINES. STEPS, MAYBE.', 'THE LIGHT STAIRS NEED A LAW.', 'LIGHT  SOLIDIFY IN  (THIS ROOM\'S STATE), THEN CLIMB.'],
  'exit:ceiling': ['THE DOOR IS IN A STRANGE PLACE.', 'IT IS ON THE CEILING. SO WALK THERE.', 'SHIFT TO INVERTED AND WALK THROUGH THE DOOR ON THE CEILING.'],
  'exit:key': ['THE LOCK WANTS A KEY. THERE IS ONE - SOMEWHERE ELSE IN TIME.', 'THE KEY ONLY EXISTS IN ECHO. THE LOCK ONLY WORKS IN PHYSICAL.', 'WRITE  HELD MATTER  PERSISTS THROUGH  PHYSICAL, TAKE THE KEY IN ECHO, SHIFT TO PHYSICAL, USE THE LOCK.'],
  'exit:core:gravity': ['THE SOCKET IS EMPTY. A CORE IS ON THE CEILING.', 'GO GET IT. THE CEILING IS A FLOOR IF YOU ASK NICELY.', 'SHIFT TO INVERTED, TAKE THE CORE, SHIFT BACK, PUT IT IN THE SOCKET.'],
  'exit:core:zerog': ['THE CORE IS ON A HIGH SHELF.', 'FLOAT UP.', 'GRAVITY  FREEZES IN  (A STATE), DRIFT UP TO THE SHELF, TAKE THE CORE, BRING IT TO THE SOCKET.'],
  'exit:core:echo': ['THE CORE IS ON A HIGH SHELF. A STAIR USED TO LEAD THERE.', 'THE STAIR IS AN ECHO.', 'ECHOES  SOLIDIFY IN  ECHO, CLIMB TO THE CORE, CARRY IT TO THE SOCKET.'],
  'exit:core:light': ['THE CORE IS ON A HIGH SHELF. GOLD STEPS LEAD UP.', 'LIGHT CAN BE SOLID.', 'LIGHT  SOLIDIFY IN  (A STATE), CLIMB, TAKE THE CORE, SOCKET IT.'],
  sweepers: ['THE BEAMS SWEEP ON A RHYTHM. WATCH IT.', 'YOU CAN JUMP THEM. OR YOU CAN STOP TIME.', 'WRITE  TIME  FREEZES IN  (THIS ROOM\'S STATE) AND WALK THROUGH THE FROZEN BEAMS.'],
  sentinel: ['IT WATCHES THE FLOOR. ONLY THE FLOOR.', 'STAY BEHIND THE PILLARS. OR WALK ON THE CEILING. OR FREEZE IT.', 'OBSERVER  FREEZES IN  (THIS ROOM\'S STATE) STOPS IT COLD. INVERTED KEEPS YOU OUT OF ITS SIGHT.'],
  'exit:open': ['THE DOOR IS OPEN. GO ON.', 'JUST WALK.', 'WALK THROUGH THE DOOR.'],
};

// ---------------------------------------------------------------------------------
// Room builder in local coordinates.
class RoomBuilder {
  constructor(id, W, H) {
    this.id = id;
    this.W = W;
    this.H = H;
    this.els = [];
    this.texts = [];
    this.inter = [];
    this.items = [];
    this.tokens = [];
    this.hazards = [];
    this.sentinels = [];
    this.npcs = [];
    this.checkpoints = [];
    this.challenges = [];
    this.lightsL = [];
    this.floatY = 1.3;
    this.killY = -2.5;
    this.route = []; // a known solution, walked by the QA bot (tests/vessel.mjs)
  }

  box(b, o = {}) {
    this.els.push({ box: b, mat: 'wall', solid: true, ...o });
  }

  floor(z0, z1, y = 0, o = {}) {
    this.box([-this.W / 2 - T, y - T, z1, this.W / 2 + T, y, z0], { mat: 'floor', ...o });
  }
}

// rotate a local point by heading theta (multiples of 90°) and translate
function xf(o, th) {
  const c = Math.round(Math.cos(th)), s = Math.round(Math.sin(th));
  return {
    p: ([x, y, z]) => [x * c + z * s + o[0], y, -x * s + z * c + o[1]],
    box: ([x0, y0, z0, x1, y1, z1]) => {
      const a = [x0 * c + z0 * s, -x0 * s + z0 * c];
      const b = [x1 * c + z1 * s, -x1 * s + z1 * c];
      return [Math.min(a[0], b[0]) + o[0], y0, Math.min(a[1], b[1]) + o[1], Math.max(a[0], b[0]) + o[0], y1, Math.max(a[1], b[1]) + o[1]];
    },
  };
}

function rectsOverlap(a, b, m = 0.5) {
  return a[0] < b[2] - m && a[2] > b[0] + m && a[1] < b[3] - m && a[3] > b[1] + m;
}

// ---------------------------------------------------------------------------------
// Segments. Each takes the builder and the current z cursor and returns the new cursor.

function segFlat(R, z, len, rng, theme) {
  R.floor(z, z - len);
  // a little furniture along the walls, never in the walking lane
  const n = rng.int(0, 2);
  for (let i = 0; i < n; i++) {
    const side = rng.chance(0.5) ? -1 : 1;
    const x = side * (R.W / 2 - 1.1);
    const zz = z - rng.float(0.8, Math.max(1, len - 0.8));
    const kind = rng.pick(theme.props);
    propAt(R, kind, x, zz, rng);
  }
  return z - len;
}

function propAt(R, kind, x, z, rng) {
  if (kind === 'planter') {
    R.box([x - 0.7, 0, z - 0.7, x + 0.7, 0.7, z + 0.7], { mat: 'prop' });
    R.box([x - 0.55, 0.7, z - 0.55, x + 0.55, 1.3, z + 0.55], { mat: 'leaf', solid: false });
  } else if (kind === 'console') {
    R.box([x - 0.6, 0, z - 0.4, x + 0.6, 1.0, z + 0.4], { mat: 'prop' });
    R.box([x - 0.5, 1.0, z - 0.3, x + 0.5, 1.06, z + 0.3], { mat: 'glow', solid: false });
  } else if (kind === 'pod') {
    R.box([x - 0.6, 0, z - 1.1, x + 0.6, 0.9, z + 1.1], { mat: 'prop' });
    R.box([x - 0.5, 0.9, z - 1.0, x + 0.5, 1.3, z + 1.0], { mat: 'glass', solid: false });
  } else if (kind === 'crate') {
    const s = rng.float(0.5, 0.9);
    R.box([x - s, 0, z - s, x + s, s * 1.6, z + s], { mat: 'prop2' });
  } else if (kind === 'bench') {
    R.box([x - 0.4, 0, z - 1.2, x + 0.4, 0.5, z + 1.2], { mat: 'prop2' });
  } else {
    R.box([x - 0.35, 0, z - 0.35, x + 0.35, 2.4, z + 0.35], { mat: 'prop' });
    R.box([x - 0.4, 2.4, z - 0.4, x + 0.4, 2.5, z + 0.4], { mat: 'glow', solid: false });
  }
}

function checkpoint(R, zStart, zEnd, spawnZ, yaw = 0) {
  R.checkpoints.push({ box: [-R.W / 2, -1, zEnd, R.W / 2, R.H + 1, zStart], spawn: [0, 0.86, spawnZ, yaw] });
}

function segPit(R, z, len, method) {
  const W = R.W, H = R.H;
  const z1 = z - len;
  // pit floor and the walls of the shaft (pastel, not a black void)
  R.box([-W / 2 - T, -6.4, z1, W / 2 + T, -6, z], { mat: 'pit' });
  R.box([-W / 2 - T, -6, z1, -W / 2, 0, z], { mat: 'wall' });
  R.box([W / 2, -6, z1, W / 2 + T, 0, z], { mat: 'wall' });
  R.box([-W / 2, -6, z - T, W / 2, -T, z], { mat: 'wall' });
  R.box([-W / 2, -6, z1, W / 2, -T, z1 + T], { mat: 'wall' });
  // glowing edge lines so the gap reads clearly
  R.box([-W / 2, -0.02, z - 0.12, W / 2, 0.02, z], { mat: 'glow', solid: false });
  R.box([-W / 2, -0.02, z1, W / 2, 0.02, z1 + 0.12], { mat: 'glow', solid: false });
  const mid = (z + z1) / 2;
  if (method !== 'gravity') {
    // hanging stacks close the ceiling route
    R.box([-W / 2, 2.7, mid - 0.25, W / 2, H, mid + 0.25], { mat: 'prop' });
  } else {
    // a walkway painted on the ceiling invites you up there
    for (let k = z - 1; k > z1; k -= 1.6) R.box([-0.6, H - 0.03, k - 0.5, 0.6, H, k], { mat: 'glow', solid: false });
  }
  if (method === 'echo') R.box([-1.2, -0.25, z1, 1.2, 0, z], { echo: true });
  if (method === 'light') R.box([-1.2, -0.25, z1, 1.2, 0, z], { light: true });
  if (method === 'zerog') R.floatY = 1.3;
  checkpoint(R, z + 0.01, z - 0.8, z + 0.6);
  const st = method === 'gravity' ? 'INVERTED' : method === 'zerog' ? 'PHYSICAL' : 'ECHO';
  R.route.push({ x: 0, z: z + 0.6, state: 'PHYSICAL' }, { x: 0, z: z + 0.2, state: st, wait: method === 'zerog' ? 1.5 : method === 'gravity' ? 1.2 : 0.2 }, { x: 0, z: z1 - 1.2, state: st }, { x: 0, z: z1 - 1.3, state: 'PHYSICAL', wait: 1.2 });
  R.challenges.push({ key: `pit:${method}`, effect: MECHANICS[method].effect, z0: z + 2, z1 });
  return z1;
}

function segSweepers(R, z, n, rng) {
  // each beam sweeps a full circle: give it its own stretch of floor so it
  // never reaches into the neighbouring segment
  const radius = R.W / 2 - 0.15;
  const span = radius * 2 + 1.4;
  const len = n * span;
  R.floor(z, z - len);
  for (let i = 0; i < n; i++) {
    const zc = z - span * (i + 0.5);
    R.hazards.push({ kind: 'sweeper', pivot: [0, 0.75, zc], radius, speed: (i % 2 ? -1 : 1) * rng.float(1.3, 1.8), phase: rng.float(0, Math.PI) });
    R.box([-0.3, 0, zc - 0.3, 0.3, 0.5, zc + 0.3], { mat: 'prop' }); // hub (you can stand on it)
  }
  checkpoint(R, z + 0.01, z - 0.8, z + 0.6);
  R.route.push({ x: 1.0, z: z - 0.3, state: 'PHYSICAL' }, { x: 1.0, z: z - len + 0.3, state: 'PHYSICAL' }, { x: 0, z: z - len - 0.6 });
  R.challenges.push({ key: 'sweepers', effect: 'timeStop', optional: true, z0: z + 2, z1: z - len });
  return z - len;
}

function segSentinel(R, z, len, rng) {
  R.floor(z, z - len);
  const W = R.W;
  // pillars to hide behind, in two staggered rows
  const rows = [z - len * 0.3, z - len * 0.68];
  rows.forEach((zz, ri) => {
    for (const x of ri % 2 ? [-W / 4, W / 4] : [-W / 2.6, 0, W / 2.6]) {
      if (Math.abs(x) < 0.1 && rng.chance(0.4)) continue;
      R.box([x - 0.7, 0, zz - 0.7, x + 0.7, R.H, zz + 0.7], { mat: 'pillar' });
    }
  });
  const zm = z - len / 2;
  const path = rng.chance(0.5)
    ? [[-W / 2 + 1.4, zm + 1.2], [W / 2 - 1.4, zm + 1.2], [W / 2 - 1.4, zm - 2.6], [-W / 2 + 1.4, zm - 2.6]]
    : [[-W / 2 + 1.4, zm], [W / 2 - 1.4, zm]];
  R.sentinels.push({ path, speed: rng.float(1.6, 2.2), range: 8.5, fov: 0.85 });
  checkpoint(R, z + 0.01, z - 0.8, z + 0.6);
  R.route.push({ x: 2.0, z: z - 0.3, state: 'PHYSICAL' }, { x: 2.0, z: z - len + 0.3, state: 'PHYSICAL' }, { x: 0, z: z - len - 0.6 });
  R.challenges.push({ key: 'sentinel', effect: 'observerFrozen', optional: true, z0: z + 2, z1: z - len });
  return z - len;
}

// Steps that only exist as a memory (echo) or as hard light.
const RISE = 0.75, TREAD = 1.5;
function stairs(R, x0, x1, zFace, h, kind) {
  const n = Math.ceil(h / RISE);
  for (let i = 0; i < n; i++) {
    const top = Math.min(h, (i + 1) * (h / n));
    const zz = zFace + (n - i) * TREAD;
    R.box([x0, top - 0.3, zz - TREAD, x1, top, zz], kind === 'echo' ? { echo: true } : { light: true });
  }
  return n * TREAD;
}

// ---------------------------------------------------------------------------------
// Exits. They end the room at z and return the room length L plus the exit opening.

function exitOpen(R, z) {
  R.floor(z, z - 3.5);
  R.route.push({ x: 0, z: z - 1, state: 'PHYSICAL' }, { exit: true });
  return { L: -(z - 3.5), y0: 0 };
}

function exitCeiling(R, z) {
  R.floor(z, z - 4);
  R.route.push({ x: 0, z: z - 0.5, state: 'INVERTED', wait: 1.2 }, { exit: true, state: 'INVERTED' });
  R.challenges.push({ key: 'exit:ceiling', effect: 'gravityFlip', z0: z + 2, z1: z - 4 });
  return { L: -(z - 4), y0: R.H - DOOR_H };
}

function exitLedge(R, z, method, rng) {
  const h = 4;
  let approach = 4;
  if (method === 'echo' || method === 'light') approach = Math.max(4, Math.ceil(h / RISE) * TREAD + 2);
  R.floor(z, z - approach);
  const face = z - approach;
  if (method === 'echo' || method === 'light') stairs(R, -1.2, 1.2, face, h, method);
  if (method === 'zerog') R.floatY = h + 1.1;
  const lst = 'ECHO'; // echo stairs show in ECHO; hard light works in any state with gravity
  if (method === 'zerog') R.route.push({ x: 0, z: face + 1.5, state: 'PHYSICAL', wait: 3 }, { x: 0, z: face - 1.5, state: 'PHYSICAL' }, { exit: true, state: 'PHYSICAL' });
  else R.route.push({ x: 0, z: face + Math.ceil(h / RISE) * TREAD + 0.8, state: lst }, { x: 0, z: face - 1.5, state: lst, jump: true }, { exit: true, state: lst });
  R.box([-R.W / 2 - T, -T, face - 4, R.W / 2 + T, h, face], { mat: 'floor' }); // the ledge
  R.box([-R.W / 2, h - 0.05, face - 0.12, R.W / 2, h + 0.02, face], { mat: 'glow', solid: false });
  R.challenges.push({ key: `ledge:${method}`, effect: MECHANICS[method].effect, z0: z + 2, z1: face - 4 });
  return { L: -(face - 4), y0: h, floorY: h };
}

function exitKey(R, z, rng) {
  R.floor(z, z - 4);
  const L = -(z - 4);
  // the key waits in a memory near the entrance; the lock is by the exit
  const side = rng.chance(0.5) ? -1 : 1;
  const kx = side * (R.W / 2 - 1.4);
  R.box([kx - 0.4, 0, -2.4, kx + 0.4, 0.9, -1.6], { mat: 'prop' });
  R.items.push({ id: `key_${R.id}`, kind: 'key', pos: [kx, 1.25, -2], echo: true, label: 'MEMORY KEY' });
  // the key is by the entrance: the bot takes it first (route is reordered below)
  R.keyRoute = [{ x: kx - side * 1.2, z: -2, state: 'ECHO', act: 'take', item: `key_${R.id}` }, { x: 0, z: -2.6, state: 'PHYSICAL' }];
  R.route.push({ x: 0, z: z - 0.5, state: 'PHYSICAL' }, { x: 1.6, z: -L + 1.4, state: 'PHYSICAL', act: 'use', target: `lock_${R.id}` }, { exit: true, state: 'PHYSICAL' });
  R.inter.push({ id: `lock_${R.id}`, kind: 'lock', pos: [2.2, 1.3, -L + 0.35], r: 2.4, prompt: 'KEY LOCK', needs: `key_${R.id}` });
  R.challenges.push({ key: 'exit:key', effect: 'heldPersists', z0: 0, z1: -L });
  return { L, y0: 0, locked: true };
}

function exitCore(R, z, method, rng) {
  const side = rng.chance(0.5) ? -1 : 1;
  const h = 4.2;
  const n = Math.ceil(h / RISE);
  const stairLen = method === 'echo' || method === 'light' ? n * TREAD + 1.5 : 0;
  const region = Math.max(7, stairLen + 6.5); // clear floor in front of the stairs
  R.floor(z, z - region);
  const L = -(z - region);
  const zc = -L + 3; // the shelf (or ceiling pedestal) sits by the far wall, clear of any pit
  let pos;
  const sx = side * (R.W / 2 - 1.3);
  R.route.push({ x: 0, z: z - 0.5, state: 'PHYSICAL' });
  if (method === 'gravity') {
    // an upside-down pedestal hanging from the ceiling
    const px = side * (R.W / 2 - 2);
    R.box([px - 0.5, R.H - 0.9, zc - 0.5, px + 0.5, R.H, zc + 0.5], { mat: 'prop' });
    pos = [px, R.H - 1.3, zc];
    R.route.push({ x: px * 0.6, z: zc + 1.2, state: 'INVERTED' }, { x: px * 0.75, z: zc + 0.6, state: 'INVERTED', act: 'take', item: `core_${R.id}` });
  } else {
    const x0 = side > 0 ? R.W / 2 - 2.6 : -R.W / 2, x1 = side > 0 ? R.W / 2 : -R.W / 2 + 2.6;
    R.box([x0, 0, zc - 1.4, x1, h, zc + 1.4], { mat: 'prop' });
    pos = [(x0 + x1) / 2, h + 0.45, zc];
    if (method === 'zerog') {
      R.floatY = h + 1.0;
      R.route.push({ x: sx * 0.5, z: zc + 2.4, state: 'PHYSICAL', wait: 2.5 }, { x: sx, z: zc + 0.3, state: 'PHYSICAL', act: 'take', item: `core_${R.id}` }, { x: sx * 0.5, z: zc + 2.4, state: 'ECHO', wait: 1.5 });
    } else {
      // stairs run along the shelf toward the entrance
      for (let i = 0; i < n; i++) {
        const top = (i + 1) * (h / n);
        const zz = zc + 1.4 + (n - i) * TREAD;
        R.box([x0, top - 0.3, zz - TREAD, x1, top, zz], method === 'echo' ? { echo: true } : { light: true });
      }
      const st = 'ECHO';
      R.route.push({ x: sx, z: zc + 1.4 + n * TREAD + 1, state: st }, { x: sx, z: zc + 0.6, state: st, jump: true, act: 'take', item: `core_${R.id}` }, { x: 0, z: zc + 0.5, state: st });
    }
  }
  R.items.push({ id: `core_${R.id}`, kind: 'core', pos, label: 'POWER CORE' });
  R.inter.push({ id: `socket_${R.id}`, kind: 'socket', pos: [2.2, 1.2, -L + 0.35], r: 2.4, prompt: 'CORE SOCKET', needs: `core_${R.id}` });
  const after = method === 'zerog' ? 'ECHO' : 'PHYSICAL';
  R.route.push({ x: 1.6, z: -L + 1.4, state: after, act: 'use', target: `socket_${R.id}` }, { exit: true, state: after });
  R.challenges.push({ key: `exit:core:${method}`, effect: MECHANICS[method].effect, z0: 0, z1: -L });
  return { L, y0: 0, locked: true };
}

// ---------------------------------------------------------------------------------

function deckTheme(deck) {
  const props = {
    hydro: ['planter', 'planter', 'crate', 'bench'],
    cryo: ['pod', 'pod', 'console', 'crate'],
    obs: ['console', 'lamp', 'crate'],
    eng: ['crate', 'console', 'lamp', 'crate'],
    med: ['bench', 'console', 'pod'],
    crew: ['bench', 'planter', 'lamp', 'crate'],
    arch: ['console', 'lamp', 'crate'],
    bridge: ['console', 'lamp', 'bench'],
  }[deck.key];
  return { props };
}

function availableMechs(deckIdx) {
  return Object.entries(MECHANICS).filter(([, m]) => m.deck <= deckIdx).map(([k]) => k);
}

// Plan one puzzle room: which segments and which exit, within the slot budget.
function planPuzzle(rng, deckIdx, difficulty, feature) {
  const mechs = availableMechs(deckIdx);
  const featured = FEATURE_MECH[feature];
  const pickMech = (opts) => {
    const pairs = opts.map((m) => [m, m === featured ? 4 : m === 'gravity' ? 1.2 : 1.5]);
    return rng.weighted(pairs);
  };
  const midCount = difficulty < 1.2 ? rng.int(0, 1) : difficulty < 5 ? rng.weighted([[0, 1], [1, 3], [2, 1]]) : rng.int(1, 2);
  const mids = [];
  const used = new Set();
  let zerogUsed = false;
  const midOpts = (m) => {
    if (m === 'gravity' || m === 'echo' || m === 'light') return [['pit', m]];
    if (m === 'zerog') return zerogUsed ? [] : [['pit', 'zerog']];
    if (m === 'time') return [['sweepers']];
    if (m === 'sentinel') return [['sentinel']];
    return [];
  };
  const effOf = (m) => (m === 'sentinel' ? 'observerFrozen' : MECHANICS[m].effect);
  for (let i = 0; i < midCount; i++) {
    const m = pickMech(mechs);
    const o = midOpts(m);
    if (!o.length) continue;
    // every room stays solvable with laws alone (timing and sneaking are bonuses)
    const next = new Set(used);
    next.add(effOf(m));
    if (next.size > 3) continue;
    const seg = rng.pick(o);
    if (m === 'zerog') zerogUsed = true;
    mids.push(seg);
    used.add(effOf(m));
  }
  // exit
  const exitOpts = [['open', null, 1]];
  if (mechs.includes('gravity')) exitOpts.push(['ceiling', 'gravity', featured === 'gravity' ? 3 : 1]);
  for (const m of ['zerog', 'echo', 'light']) if (mechs.includes(m) && !(m === 'zerog' && zerogUsed)) exitOpts.push(['ledge', m, m === featured ? 3 : 1]);
  if (mechs.includes('echo')) exitOpts.push(['key', 'echo', featured === 'echo' ? 2.5 : 1]);
  for (const m of ['gravity', 'zerog', 'echo', 'light']) if (mechs.includes(m) && !(m === 'zerog' && zerogUsed)) exitOpts.push(['core', m, m === featured ? 2 : 0.7]);
  let exit;
  for (let tries = 0; tries < 20; tries++) {
    const [kind, m] = rng.weighted(exitOpts.map((e) => [e, e[2]]));
    const eff = kind === 'key' ? 'heldPersists' : m ? MECHANICS[m].effect : null;
    const next = new Set(used);
    if (eff) next.add(eff);
    if (next.size <= 3) {
      exit = { kind, method: m };
      if (eff) used.add(eff);
      break;
    }
  }
  if (!exit) exit = { kind: 'open', method: null };
  // a room with no challenge at all is boring: force one
  if (!mids.length && exit.kind === 'open') {
    const m = pickMech(mechs.filter((x) => x !== 'sentinel' || deckIdx >= 4));
    mids.push(...midOpts(m).slice(0, 1));
    if (!mids.length) mids.push(['pit', 'gravity']);
    used.add(mids[0][0] === 'pit' ? MECHANICS[mids[0][1]].effect : mids[0][0] === 'sweepers' ? 'timeStop' : 'observerFrozen');
  }
  return { mids, exit, effects: [...used] };
}

// ---------------------------------------------------------------------------------

export function generateSector(story, deckIdx, sectorIdx, campaignSeed) {
  const deck = story.decks[deckIdx];
  const rng = Rng.from('sector', campaignSeed, deckIdx, sectorIdx);
  const theme = deckTheme(deck);
  const beat = deck.beats[sectorIdx];
  const difficulty = deckIdx + sectorIdx / SECTORS_PER_DECK;
  const nPuzzles = 1 + (sectorIdx >= 1 ? 1 : 0) + (deckIdx >= 6 && sectorIdx === 3 ? 1 : 0);
  // story room position: first on arrival, last for the finale verdict, otherwise mid-sector
  const storyAt = beat.kind === 'arrival' ? 0 : beat.kind === 'verdict' ? nPuzzles : rng.int(1, Math.max(1, nPuzzles - 1));
  const plan = [];
  for (let i = 0; i < nPuzzles; i++) plan.push({ type: 'puzzle', ...planPuzzle(rng, deckIdx, difficulty + i * 0.25, deck.feature) });
  plan.splice(storyAt, 0, { type: 'story', beat });

  const names = rng.shuffle(deck.rooms);
  const level = {
    id: `d${deckIdx}s${sectorIdx}`, deck: deckIdx, sector: sectorIdx, seed: campaignSeed,
    deckName: deck.name, palette: deck.palette,
    rooms: {}, order: [], elements: [], texts: [], interactables: [], items: [], tokens: [], hazards: [], sentinels: [], npcs: [], checkpoints: [], triggers: [],
    map: { rooms: [], corridors: [] }, effects: new Set(), estimateMin: 0,
  };

  let origin = [0, 0];
  let theta = 0;
  let entryY = 0;
  const placed = [];

  plan.forEach((p, i) => {
    const rid = `${level.id}r${i}`;
    const W = p.type === 'story' ? 13 : p.mids.some((m) => m[0] === 'sentinel') ? 16 : rng.pick([11, 12, 13]);
    let H = p.type === 'story' ? 6.5 : 7.5;
    H = Math.max(H, entryY + DOOR_H + 0.6);
    const R = new RoomBuilder(rid, W, H);
    let z = 0;

    // entry pad
    R.floor(0, -3.5);
    z = -3.5;
    if (entryY > 0) {
      // you drop in from a high doorway: a soft landing pad
      R.box([-1.4, 0, -2.6, 1.4, 0.04, -0.2], { mat: 'glow', solid: false });
    }
    let ex;
    if (p.type === 'story') {
      R.floor(z, z - 9);
      z -= 9;
      storyRoom(R, p.beat, deck, rng, level, story);
      ex = exitOpen(R, z);
      R.route.splice(0, R.route.length - 1, { x: 0, z: -3 }, { x: 2.6, z: -4.5 }, { x: 2.6, z: -12.5 }); // story rooms: walk around the middle
      level.estimateMin += 1.6;
    } else {
      for (const m of p.mids) {
        z = segFlat(R, z, rng.float(1.5, 3), rng, theme);
        if (m[0] === 'pit') z = segPit(R, z, rng.float(6.2, 8.5), m[1]);
        else if (m[0] === 'sweepers') z = segSweepers(R, z, difficulty > 5 && rng.chance(0.4) ? 2 : 1, rng);
        else if (m[0] === 'sentinel') z = segSentinel(R, z, rng.float(13, 16), rng);
        z = segFlat(R, z, 1.5, rng, theme);
      }
      const e = p.exit;
      if (e.kind === 'open') ex = exitOpen(R, z);
      else if (e.kind === 'ceiling') ex = exitCeiling(R, z);
      else if (e.kind === 'ledge') ex = exitLedge(R, z, e.method, rng);
      else if (e.kind === 'key') ex = exitKey(R, z, rng);
      else ex = exitCore(R, z, e.method, rng);
      if (e.kind === 'open' && !R.challenges.length) R.challenges.push({ key: 'exit:open', z0: 0, z1: z });
      // estimated solve time: ~1.7 min per law challenge (more the first time a deck
      // introduces it), ~1 min for ones you can also beat with timing or sneaking
      level.estimateMin += 0.7 + R.challenges.reduce((s, c) => s + (c.optional ? 1.0 : c.key === 'exit:open' ? 0.3 : 1.7), 0);
      for (const eff of p.effects) level.effects.add(eff);
    }
    const L = ex.L;

    // new law tokens are introduced in the first room of the deck
    if (sectorIdx === 0 && i === 0 && NEW_TOKENS[deckIdx]) {
      NEW_TOKENS[deckIdx].forEach((tk, k) => R.tokens.push({ token: tk, pos: [-2 + k * 4, 1.1, -5.5] }));
    }

    // choose the exit side: north, or turn west/east near the far end
    const last = i === plan.length - 1;
    const sideOpts = ex.y0 > 0 || ex.locked || last ? ['N'] : rng.shuffle(['N', 'N', 'W', 'E']);
    let side = 'N';
    let next = null;
    const T0 = xf(origin, theta);
    const footprint = (o, th, w, l) => {
      const t = xf(o, th);
      const b = t.box([-w / 2 - T, 0, -l - T - CL, w / 2 + T, 1, T]);
      return [b[0], b[2], b[3], b[5]];
    };
    const myRect = footprint(origin, theta, W, L);
    for (const sd of sideOpts) {
      const zc = -L + 2.1;
      const nl = sd === 'N' ? [0, -L - 2 * T - CL] : sd === 'W' ? [-W / 2 - 2 * T - CL, zc] : [W / 2 + 2 * T + CL, zc];
      const p2 = T0.p([nl[0], 0, nl[1]]);
      const th2 = theta + (sd === 'W' ? Math.PI / 2 : sd === 'E' ? -Math.PI / 2 : 0);
      // look ahead: would a typical next room overlap anything already placed?
      const probe = footprint([p2[0], p2[2]], th2, 16, 30);
      if (placed.slice(0, -1).some((r) => rectsOverlap(r, probe)) || rectsOverlap(myRect, probe, 2)) continue;
      side = sd;
      next = { origin: [p2[0], p2[2]], theta: th2 };
      break;
    }
    if (!next) {
      const p2 = T0.p([0, 0, -L - 2 * T - CL]);
      next = { origin: [p2[0], p2[2]], theta };
      side = 'N';
    }
    placed.push(myRect);

    // shell: walls, ceiling, entry and exit openings, corridor
    shellRoom(R, L, entryY, side, ex, last);

    // lights
    const lc = deck.palette.light;
    R.lightsL.push([0, H - 0.8, -L * 0.25, lc, 2.2, Math.max(16, L)], [0, H - 0.8, -L * 0.75, lc, 2.0, Math.max(16, L)]);
    R.lightsL.push([W / 2 - 1, 2.2, -L / 2, deck.palette.accent, 0.8, 10]);

    // finalize into world space
    const t = xf(origin, theta);
    const base = { room: rid };
    for (const el of R.els) level.elements.push({ ...el, ...base, box: t.box(el.box) });
    for (const tx of R.texts) level.texts.push({ ...tx, ...base, pos: t.p(tx.pos), rotY: (tx.rotY || 0) + theta });
    for (const it of R.inter) level.interactables.push({ ...it, ...base, pos: t.p(it.pos), yaw: (it.yaw || 0) + theta });
    for (const it of R.items) level.items.push({ ...it, ...base, pos: t.p(it.pos) });
    for (const tk of R.tokens) level.tokens.push({ ...tk, ...base, pos: t.p(tk.pos) });
    for (const hz of R.hazards) level.hazards.push({ ...hz, ...base, pivot: t.p(hz.pivot) });
    for (const sn of R.sentinels) level.sentinels.push({ ...sn, ...base, id: `${rid}_s${level.sentinels.length}`, path: sn.path.map(([x, zz]) => { const q = t.p([x, 0, zz]); return [q[0], q[2]]; }) });
    for (const n of R.npcs) level.npcs.push({ ...n, ...base, pos: t.p(n.pos), yaw: (n.yaw || 0) + theta });
    const zc = -L + 2.1;
    const exitPts = side === 'N' ? [[0, -L + 1], [0, -L - T - CL + 0.8]] : [[0, zc], [(side === 'W' ? -1 : 1) * (W / 2 + T + CL - 0.8), zc]];
    const route = [];
    for (const w of [...(R.keyRoute || []), ...R.route]) {
      if (w.exit) for (const [x, zz] of exitPts) route.push({ state: w.state, exit: true, pos: t.p([x, 0, zz]) });
      else route.push({ ...w, pos: t.p([w.x, 0, w.z]) });
    }
    for (const c of R.checkpoints) level.checkpoints.push({ ...base, box: t.box(c.box), spawn: [...t.p(c.spawn), theta] });
    const roomBox = t.box([-W / 2, -12, -L - T - (side === 'N' ? (last ? CL + 2 : CL) : 0), W / 2, 30, T]);
    const bounds = [roomBox];
    if (side !== 'N') {
      const zc = -L + 2.1;
      const cb = side === 'W' ? [-W / 2 - T - CL, -12, zc - DOOR_W, -W / 2, 30, zc + DOOR_W] : [W / 2, -12, zc - DOOR_W, W / 2 + T + CL, 30, zc + DOOR_W];
      bounds.push(t.box(cb));
    }
    level.rooms[rid] = {
      name: p.type === 'story' ? names[0] : names[(i % (names.length - 1)) + 1],
      kind: p.type === 'story' ? p.beat.kind : 'puzzle',
      bounds,
      spawn: [...t.p([0, 0.86, -1.6]), theta],
      lights: R.lightsL.map(([x, y, zz, c, k, d]) => { const q = t.p([x, y, zz]); return [q[0], q[1], q[2], c, k, d]; }),
      tint: deck.palette.tint,
      killY: R.killY,
      floatY: R.floatY,
      challenges: R.challenges.map((c) => ({ ...c, hints: HINTS[c.key] || HINTS['exit:open'], box: t.box([-W / 2, -12, c.z1, W / 2, 30, c.z0]) })),
      exitSide: side,
      route,
      L, W, H,
    };
    if (p.type === 'story') level.rooms[rid].beat = p.beat.kind;
    level.order.push(rid);
    const inner = t.box([-W / 2, 0, -L, W / 2, 1, 0]);
    level.map.rooms.push({ id: rid, rect: [inner[0], inner[2], inner[3], inner[5]], name: level.rooms[rid].name, kind: level.rooms[rid].kind });
    if (!last) {
      const zc = -L + 2.1;
      const cor = side === 'N' ? [-DOOR_W, 0, -L - T - CL, DOOR_W, 1, -L] : side === 'W' ? [-W / 2 - T - CL, 0, zc - DOOR_W, -W / 2, 1, zc + DOOR_W] : [W / 2, 0, zc - DOOR_W, W / 2 + T + CL, 1, zc + DOOR_W];
      const cw = t.box(cor);
      level.map.corridors.push([cw[0], cw[2], cw[3], cw[5]]);
    } else {
      // the sector gate: walking into it completes the sector
      const gate = t.box([-DOOR_W, ex.y0 - 1, -L - T - CL - 1, DOOR_W, ex.y0 + DOOR_H + 1, -L - T - 1]);
      level.exit = { room: rid, box: gate };
      const gw = t.box([-DOOR_W, 0, -L - T - CL, DOOR_W, 1, -L]);
      level.map.corridors.push([gw[0], gw[2], gw[3], gw[5]]);
      level.map.gate = [(gw[0] + gw[3]) / 2, (gw[2] + gw[5]) / 2];
    }
    origin = next.origin;
    theta = next.theta;
    entryY = ex.y0;
  });

  level.effects = [...level.effects];
  level.spawn = level.rooms[level.order[0]].spawn;
  return level;
}

// Walls, ceiling and the two doorways of a room, plus the outgoing corridor.
function shellRoom(R, L, entryY, side, ex, last) {
  const { W, H } = R;
  const wallX = (x0, x1, z0, z1, y0, y1, mat = 'wall') => R.box([x0, y0, z0, x1, y1, z1], { mat });
  // ceiling
  R.box([-W / 2 - T, H, -L - T, W / 2 + T, H + T, T], { mat: 'ceil' });
  // south wall with entry opening at entryY
  const ey0 = entryY, ey1 = entryY + DOOR_H;
  wallX(-W / 2 - T, -DOOR_W, 0, T, -6, H);
  wallX(DOOR_W, W / 2 + T, 0, T, -6, H);
  if (ey0 > -6) wallX(-DOOR_W, DOOR_W, 0, T, -6, ey0);
  if (ey1 < H) wallX(-DOOR_W, DOOR_W, 0, T, ey1, H);
  // north wall (exit opening if side N)
  const xy0 = ex.y0, xy1 = ex.y0 + DOOR_H;
  if (side === 'N') {
    wallX(-W / 2 - T, -DOOR_W, -L - T, -L, -6, H);
    wallX(DOOR_W, W / 2 + T, -L - T, -L, -6, H);
    if (xy0 > -6) wallX(-DOOR_W, DOOR_W, -L - T, -L, -6, xy0);
    if (xy1 < H) wallX(-DOOR_W, DOOR_W, -L - T, -L, xy1, H);
  } else wallX(-W / 2 - T, W / 2 + T, -L - T, -L, -6, H);
  // side walls (exit opening on W or E near the far end)
  const zc = -L + 2.1;
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -W / 2 - T : W / 2, x1 = sx < 0 ? -W / 2 : W / 2 + T;
    const isExit = (side === 'W' && sx < 0) || (side === 'E' && sx > 0);
    if (!isExit) R.box([x0, -6, -L, x1, H, 0], { mat: 'wall' });
    else {
      R.box([x0, -6, -L, x1, H, zc - DOOR_W], { mat: 'wall' });
      R.box([x0, -6, zc + DOOR_W, x1, H, 0], { mat: 'wall' });
      if (xy0 > -6) R.box([x0, -6, zc - DOOR_W, x1, xy0, zc + DOOR_W], { mat: 'wall' });
      if (xy1 < H) R.box([x0, xy1, zc - DOOR_W, x1, H, zc + DOOR_W], { mat: 'wall' });
    }
  }
  // architecture: wall ribs, baseboards, light strips and ceiling panels give
  // each room rhythm and depth (decor only, never solid)
  const ribs = Math.max(2, Math.floor(L / 4));
  for (let i = 1; i < ribs; i++) {
    const rz = -(i * L) / ribs;
    for (const sx of [-1, 1]) {
      const isExitSide = (side === 'W' && sx < 0) || (side === 'E' && sx > 0);
      if (isExitSide && Math.abs(rz - zc) < DOOR_W + 0.6) continue;
      const x0 = sx < 0 ? -W / 2 : W / 2 - 0.28, x1 = sx < 0 ? -W / 2 + 0.28 : W / 2;
      R.box([x0, 0, rz - 0.3, x1, H, rz + 0.3], { mat: 'trim', solid: false });
    }
    R.box([-1.6, H - 0.06, rz - 0.6, 1.6, H, rz + 0.6], { mat: 'panelGlow', solid: false });
  }
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -W / 2 : W / 2 - 0.06, x1 = sx < 0 ? -W / 2 + 0.06 : W / 2;
    R.box([x0, 0, -L, x1, 0.18, 0], { mat: 'trimDark', solid: false });
    R.box([x0, 2.6, -L, x1, 2.66, 0], { mat: 'glow', solid: false });
  }
  // locked door filling the exit opening
  const doorBox = side === 'N' ? [-DOOR_W, xy0, -L - T, DOOR_W, xy1, -L]
    : side === 'W' ? [-W / 2 - T, xy0, zc - DOOR_W, -W / 2, xy1, zc + DOOR_W]
      : [W / 2, xy0, zc - DOOR_W, W / 2 + T, xy1, zc + DOOR_W];
  if (ex.locked) R.box(doorBox, { mat: 'door', when: `!open_${R.id}`, id: `door_${R.id}` });
  // exit marker light strip above the door
  const strip = side === 'N' ? [-DOOR_W, xy1, -L - 0.06, DOOR_W, xy1 + 0.12, -L]
    : side === 'W' ? [-W / 2, xy1, zc - DOOR_W, -W / 2 + 0.06, xy1 + 0.12, zc + DOOR_W]
      : [W / 2 - 0.06, xy1, zc - DOOR_W, W / 2, xy1 + 0.12, zc + DOOR_W];
  R.box(strip, { mat: 'glow', solid: false });
  // corridor out
  const cf = xy0;
  if (side === 'N') {
    const z0 = -L - T, z1 = -L - T - CL;
    R.box([-DOOR_W - T, cf - T, z1, DOOR_W + T, cf, z0], { mat: 'floor' });
    R.box([-DOOR_W - T, cf + DOOR_H, z1, DOOR_W + T, cf + DOOR_H + T, z0], { mat: 'ceil' });
    R.box([-DOOR_W - T, cf, z1, -DOOR_W, cf + DOOR_H, z0], { mat: 'wall' });
    R.box([DOOR_W, cf, z1, DOOR_W + T, cf + DOOR_H, z0], { mat: 'wall' });
    if (last) {
      R.box([-DOOR_W, cf, z1 - T, DOOR_W, cf + DOOR_H, z1], { mat: 'gate', solid: false });
      R.box([-DOOR_W - T, cf - T, z1 - 3, DOOR_W + T, cf, z1], { mat: 'floor' });
    }
  } else {
    const s = side === 'W' ? -1 : 1;
    const xa = s * (W / 2 + T), xb = s * (W / 2 + T + CL);
    const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
    R.box([x0, cf - T, zc - DOOR_W - T, x1, cf, zc + DOOR_W + T], { mat: 'floor' });
    R.box([x0, cf + DOOR_H, zc - DOOR_W - T, x1, cf + DOOR_H + T, zc + DOOR_W + T], { mat: 'ceil' });
    R.box([x0, cf, zc - DOOR_W - T, x1, cf + DOOR_H, zc - DOOR_W], { mat: 'wall' });
    R.box([x0, cf, zc + DOOR_W, x1, cf + DOOR_H, zc + DOOR_W + T], { mat: 'wall' });
  }
}

// The story room of a sector: logs, plaques, a crew member, the verdict chair.
function storyRoom(R, beat, deck, rng, level, story) {
  const W = R.W;
  const L = 16; // entry pad 3.5 + hall 9 + exit pad 3.5
  // a terminal for the log, against the west wall
  const motto = beat.plaque || deck.motto;
  R.texts.push({ text: motto, pos: [0, R.H - 1.6, -L - 0.05 + 0.1], rotY: 0, size: 0.42, color: '#4f6170' });
  if (beat.log) {
    R.box([-W / 2 + 0.6, 0, -6.6, -W / 2 + 1.6, 1.0, -5.4], { mat: 'prop' });
    R.inter.push({ id: `log_${R.id}`, kind: 'terminal', pos: [-W / 2 + 1.5, 1.25, -6], yaw: Math.PI / 2, r: 2.4, prompt: 'PLAY LOG', log: beat.log });
  }
  if (beat.kind === 'contradiction') {
    // the same plaque, two truths: the record in every state, the memory in ECHO
    R.texts.push({ text: beat.official, pos: [W / 2 - 0.06, 3.0, -6], rotY: -Math.PI / 2, size: 0.34, color: '#4a5a6a', when: '!@ECHO' });
    R.texts.push({ text: beat.echo, pos: [W / 2 - 0.06, 3.0, -6], rotY: -Math.PI / 2, size: 0.34, color: '#0e7c88', echo: true });
    R.box([W / 2 - 0.12, 2.3, -9.2, W / 2, 3.7, -2.8], { mat: 'prop', solid: false });
    R.inter.push({ id: `plaque_${R.id}`, kind: 'plaque', pos: [W / 2 - 0.5, 2.6, -6], r: 3.2, prompt: 'READ THE RECORD', beat });
  }
  if (beat.kind === 'encounter') {
    const c = story.cast[story.decks[deck.index].crew];
    R.npcs.push({ id: `npc_${R.id}`, crew: c.id, pos: [1.6, 0, -7.2], yaw: Math.PI * 0.85, hologram: !c.alive, lines: beat.lines, junoAfter: beat.junoAfter });
  }
  if (beat.kind === 'verdict') {
    // the crew, in a circle of echoes around the chair
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      R.npcs.push({ id: `juror_${k}`, crew: story.cast[k].id, pos: [Math.sin(a) * 3.6, 0, -6.6 + Math.cos(a) * 3.6], yaw: a + Math.PI, hologram: true, silent: true });
    }
    R.box([-0.6, 0, -7.2, 0.6, 0.6, -6.0], { mat: 'prop' });
    R.inter.push({ id: 'chair', kind: 'chair', pos: [0, 1.0, -6.6], r: 2.6, prompt: 'SIT IN THE CHAIR' });
  }
  // a memory beacon: touch it to save
  R.box([W / 2 - 1.4, 0, -2.4, W / 2 - 0.6, 1.2, -1.6], { mat: 'prop' });
  R.inter.push({ id: `beacon_${R.id}`, kind: 'beacon', pos: [W / 2 - 1.0, 1.5, -2.0], r: 2.4, prompt: 'SAVE MEMORY' });
  R.checkpoints.push({ box: [-W / 2, -1, -L, W / 2, R.H + 1, 0], spawn: [0, 0.86, -1.6, 0] });
}

// Campaign-level helpers ---------------------------------------------------------

export function campaignLength(story, seed) {
  let total = 0;
  const per = [];
  for (let d = 0; d < story.decks.length; d++) {
    let deckMin = 0;
    for (let s = 0; s < SECTORS_PER_DECK; s++) deckMin += generateSector(story, d, s, seed).estimateMin + 1.0;
    per.push(deckMin);
    total += deckMin;
  }
  return { total, per };
}
