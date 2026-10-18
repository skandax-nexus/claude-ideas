// THE LAST VERSION OF EARTH: hand-authored interiors (the Helix facility) in the
// level format gen/LevelGen.js produces, so world/DeckWorld.js runs them unchanged.
//
// A Deck is a chain of rooms laid along -z. Each room is authored in its own
// local frame (x across, z from 0 at the south door to -L at the north door,
// y up from the floor) and the builder turns boxes, props, people, watchers and
// scenes into world coordinates. Small procedural props (a clock, a toy, a power
// cell, the Chronolith) live here too.
import * as THREE from '../../../vendor/three.module.min.js';
import { makeMachineRing } from '../../world/models.js';

const T = 0.4; // wall thickness
const DOOR_W = 1.5; // half width of a doorway
const DOOR_H = 4;
const CL = 4; // corridor length

export class Deck {
  constructor({ id, deckName, palette, seed = 'lv', deck = 0, sector = 0, states = null, unstable = false, estimateMin = 20 }) {
    this.level = {
      id, deck, sector, seed, deckName, palette,
      rooms: {}, order: [], elements: [], texts: [], interactables: [], items: [], tokens: [], hazards: [], sentinels: [], npcs: [], checkpoints: [], triggers: [],
      map: { rooms: [], corridors: [] }, effects: ['echoSolid', 'gravityFlip'], estimateMin, states, unstable,
    };
    this.cursor = 0; // world z of the next room's south wall
    this.rooms = [];
  }

  // Author one room. fn(R) places its contents; R.W, R.L, R.H are the room size.
  room({ id, name, W = 12, L = 16, H = 6, kind = 'puzzle', beat, states, lights, tint, floatY, ox = 0 }, fn) {
    const lv = this.level;
    const z0 = this.cursor; // south wall at world z = z0, room runs to z0 - L
    const R = new Room(this, id, { W, L, H, z0, ox });
    const first = !this.rooms.length;
    R.first = first;
    fn(R);
    R.shell();
    const room = {
      name, kind, bounds: [[ox - W / 2 - T, -12, z0 - L - T - CL - 1, ox + W / 2 + T, 30, z0 + T]],
      spawn: [ox, 0.86, z0 - 1.6, 0],
      lights: lights || [[ox, H - 0.8, z0 - L * 0.3, lv.palette.light, 2.0, Math.max(14, L)], [ox, H - 0.8, z0 - L * 0.75, lv.palette.light, 1.8, Math.max(14, L)], [ox + W / 2 - 1, 2.2, z0 - L / 2, lv.palette.accent, 0.8, 10]],
      tint: tint ?? lv.palette.tint, killY: -3, floatY: floatY ?? 1.3, challenges: R.challenges, route: [], exitSide: 'N', L, W, H,
      states: states || lv.states || undefined,
    };
    if (beat) room.beat = beat;
    lv.rooms[id] = room;
    lv.order.push(id);
    lv.map.rooms.push({ id, rect: [ox - W / 2, z0 - L, ox + W / 2, z0], name, kind });
    lv.map.corridors.push([ox - DOOR_W, z0 - L - T - CL, ox + DOOR_W, z0 - L]);
    this.rooms.push(R);
    this.cursor = z0 - L - 2 * T - CL;
    return R;
  }

  // the last room's north door is the way out (walking into it completes the sector)
  finish({ gated = true } = {}) {
    const lv = this.level;
    const R = this.rooms[this.rooms.length - 1];
    const z = R.z0 - R.L - T - CL;
    lv.exit = { room: R.id, box: [R.ox - DOOR_W, -1, z - 1, R.ox + DOOR_W, DOOR_H + 1, z + 1.2] };
    lv.map.gate = [R.ox, z];
    if (gated) lv.elements.push({ box: [R.ox - DOOR_W, 0, R.z0 - R.L - T, R.ox + DOOR_W, DOOR_H, R.z0 - R.L], mat: 'door', solid: true, when: '!beat_done', id: `gate_${lv.id}`, room: R.id });
    lv.spawn = lv.rooms[lv.order[0]].spawn;
    return lv;
  }
}

class Room {
  constructor(deck, id, { W, L, H, z0, ox }) {
    this.deck = deck;
    this.lv = deck.level;
    this.id = id;
    this.W = W;
    this.L = L;
    this.H = H;
    this.z0 = z0;
    this.ox = ox;
    this.challenges = [];
    this.openings = { S: true, N: true };
  }

  // local -> world
  p([x, y, z]) {
    return [this.ox + x, y, this.z0 + z];
  }

  b([x0, y0, z0, x1, y1, z1]) {
    return [this.ox + Math.min(x0, x1), Math.min(y0, y1), this.z0 + Math.min(z0, z1), this.ox + Math.max(x0, x1), Math.max(y0, y1), this.z0 + Math.max(z0, z1)];
  }

  box(local, o = {}) {
    this.lv.elements.push({ box: this.b(local), mat: 'wall', solid: true, ...o, room: this.id });
  }

  text(str, pos, rotY = 0, o = {}) {
    this.lv.texts.push({ text: str, pos: this.p(pos), rotY, size: 0.4, color: '#dfe8f0', ...o, room: this.id });
  }

  inter(it) {
    this.lv.interactables.push({ r: 2.6, ...it, pos: this.p(it.pos), room: this.id });
  }

  // a scene: something to inspect (kind 'scene' is handled by the edition's runtime)
  scene(id, pos, prompt, o = {}) {
    this.inter({ id, kind: 'scene', scene: o.scene || id, pos, prompt, ...o });
  }

  item(it) {
    this.lv.items.push({ ...it, pos: this.p(it.pos), room: this.id });
  }

  npc(n) {
    this.lv.npcs.push({ ...n, pos: this.p(n.pos), path: n.path?.map(([x, z]) => [this.ox + x, this.z0 + z]), room: this.id });
  }

  sentinel(s) {
    const path = s.path.map(([x, z]) => [this.ox + x, this.z0 + z]);
    const conduit = s.conduit ? [this.ox + s.conduit[0], this.z0 + s.conduit[1], this.ox + s.conduit[2], this.z0 + s.conduit[3]] : undefined;
    this.lv.sentinels.push({ speed: 1.8, range: 8.5, fov: 0.85, ...s, path, conduit, room: this.id, id: `${this.id}_s${this.lv.sentinels.length}` });
  }

  hazard(h) {
    this.lv.hazards.push({ kind: 'sweeper', radius: this.W / 2 - 0.4, speed: 1.4, phase: 0, ...h, pivot: this.p(h.pivot), room: this.id });
  }

  trigger(local, set, o = {}) {
    this.lv.triggers.push({ box: this.b(local), set, once: true, ...o, room: this.id });
  }

  checkpoint(zFrom, zTo, spawnZ) {
    this.lv.checkpoints.push({ box: this.b([-this.W / 2, -1, zTo, this.W / 2, this.H + 1, zFrom]), spawn: [this.ox, 0.86, this.z0 + spawnZ, 0], room: this.id });
  }

  challenge(key, zFrom, zTo, hints) {
    this.challenges.push({ key, hints, box: this.b([-this.W / 2, -12, zTo, this.W / 2, 30, zFrom]) });
  }

  // a floor slab (default: the whole room)
  floor(z0 = 0, z1 = -this.L, y = 0, o = {}) {
    this.box([-this.W / 2 - T, y - T, z1, this.W / 2 + T, y, z0], { mat: 'floor', ...o });
  }

  // a gap in the floor with a visible bottom, and what lies in it
  pit(z0, z1, { depth = 5, mat = 'pit', debris = true } = {}) {
    const W = this.W;
    this.box([-W / 2 - T, -depth - T, z1, W / 2 + T, -depth, z0], { mat });
    this.box([-W / 2 - T, -depth, z1, -W / 2, 0, z0], { mat: 'wall' });
    this.box([W / 2, -depth, z1, W / 2 + T, 0, z0], { mat: 'wall' });
    this.box([-W / 2, -depth, z0 - T, W / 2, -T, z0], { mat: 'wall' });
    this.box([-W / 2, -depth, z1, W / 2, -T, z1 + T], { mat: 'wall' });
    this.box([-W / 2, -0.02, z0 - 0.12, W / 2, 0.02, z0], { mat: 'glow', solid: false });
    this.box([-W / 2, -0.02, z1, W / 2, 0.02, z1 + 0.12], { mat: 'glow', solid: false });
    if (debris) {
      const mid = (z0 + z1) / 2;
      this.box([-2.5, -depth, mid - 1.5, 0.5, -depth + 1.6, mid + 0.5], { mat: 'industrial' });
      this.box([1, -depth, mid - 0.5, 3.2, -depth + 2.4, mid + 2], { mat: 'tank' });
      this.box([-1, -depth + 1.6, mid - 2.2, 2, -depth + 2.0, mid + 1.4], { mat: 'trimDark' });
    }
  }

  // a raised slab you can walk on
  ledge(x0, z0, x1, z1, h, o = {}) {
    this.box([x0, -T, z1, x1, h, z0], { mat: 'prop', ...o });
  }

  // plain stairs along -z from (x0..x1, zFace) up to height h
  stairs(x0, x1, zFace, h, o = {}) {
    const RISE = 0.5, TREAD = 0.8;
    const n = Math.ceil(h / RISE);
    for (let i = 0; i < n; i++) {
      const top = Math.min(h, (i + 1) * (h / n));
      const zz = zFace + (n - i) * TREAD;
      this.box([x0, top - 0.3, zz - TREAD, x1, top, zz], { mat: 'prop', ...o });
    }
    return n * TREAD;
  }

  pillar(x, z, r = 0.7) {
    this.box([x - r, 0, z - r, x + r, this.H, z + r], { mat: 'pillar' });
  }

  // a desk, a crate, a console, a shelf
  prop(kind, x, z, o = {}) {
    if (kind === 'desk') {
      this.box([x - 0.9, 0, z - 0.5, x + 0.9, 0.78, z + 0.5], { mat: 'prop', ...o });
    } else if (kind === 'console') {
      this.box([x - 0.6, 0, z - 0.4, x + 0.6, 1.0, z + 0.4], { mat: 'prop', ...o });
      this.box([x - 0.5, 1.0, z - 0.3, x + 0.5, 1.06, z + 0.3], { mat: 'glow', solid: false, ...o });
    } else if (kind === 'crate') {
      const s = o.size || 0.7;
      this.box([x - s, 0, z - s, x + s, s * 1.5, z + s], { mat: 'prop2', ...o });
    } else if (kind === 'shelf') {
      this.box([x - 1.2, 0, z - 0.35, x + 1.2, 2.2, z + 0.35], { mat: 'prop', ...o });
    } else if (kind === 'bench') {
      this.box([x - 0.4, 0, z - 1.2, x + 0.4, 0.5, z + 1.2], { mat: 'prop2', ...o });
    } else if (kind === 'lamp') {
      this.box([x - 0.3, 0, z - 0.3, x + 0.3, 2.4, z + 0.3], { mat: 'prop', ...o });
      this.box([x - 0.4, 2.4, z - 0.4, x + 0.4, 2.5, z + 0.4], { mat: 'glow', solid: false, ...o });
    }
  }

  // the shell: floor (unless the author laid it), ceiling, four walls with the doorways
  shell() {
    const { W, L, H } = this;
    const wall = (b, o = {}) => this.box(b, { mat: 'wall', ...o });
    this.box([-W / 2 - T, H, -L - T, W / 2 + T, H + T, T], { mat: 'ceil' });
    // south wall, with the entry opening (closed for the first room)
    const openS = this.openings.S && !this.first;
    wall([-W / 2 - T, -6, 0, openS ? -DOOR_W : W / 2 + T, H, T]);
    if (openS) {
      wall([DOOR_W, -6, 0, W / 2 + T, H, T]);
      wall([-DOOR_W, DOOR_H, 0, DOOR_W, H, T]);
    }
    // north wall with the exit opening
    wall([-W / 2 - T, -6, -L - T, -DOOR_W, H, -L]);
    wall([DOOR_W, -6, -L - T, W / 2 + T, H, -L]);
    wall([-DOOR_W, DOOR_H, -L - T, DOOR_W, H, -L]);
    // sides
    wall([-W / 2 - T, -6, -L, -W / 2, H, 0]);
    wall([W / 2, -6, -L, W / 2 + T, H, 0]);
    // ribs, baseboards and light strips, as the generator does
    const ribs = Math.max(2, Math.floor(L / 4));
    for (let i = 1; i < ribs; i++) {
      const rz = -(i * L) / ribs;
      for (const sx of [-1, 1]) {
        const x0 = sx < 0 ? -W / 2 : W / 2 - 0.28, x1 = sx < 0 ? -W / 2 + 0.28 : W / 2;
        this.box([x0, 0, rz - 0.3, x1, H, rz + 0.3], { mat: 'trim', solid: false });
      }
      this.box([-1.6, H - 0.06, rz - 0.6, 1.6, H, rz + 0.6], { mat: 'panelGlow', solid: false });
    }
    for (const sx of [-1, 1]) {
      const x0 = sx < 0 ? -W / 2 : W / 2 - 0.06, x1 = sx < 0 ? -W / 2 + 0.06 : W / 2;
      this.box([x0, 0, -L, x1, 0.18, 0], { mat: 'trimDark', solid: false });
      this.box([x0, 2.6, -L, x1, 2.66, 0], { mat: 'glow', solid: false });
    }
    // the corridor north
    const z0 = -L - T, z1 = -L - T - CL;
    this.box([-DOOR_W - T, -T, z1, DOOR_W + T, 0, z0], { mat: 'floor' });
    this.box([-DOOR_W - T, DOOR_H, z1, DOOR_W + T, DOOR_H + T, z0], { mat: 'ceil' });
    this.box([-DOOR_W - T, 0, z1, -DOOR_W, DOOR_H, z0], { mat: 'wall' });
    this.box([DOOR_W, 0, z1, DOOR_W + T, DOOR_H, z0], { mat: 'wall' });
    this.box([-DOOR_W, DOOR_H, -L - 0.06, DOOR_W, DOOR_H + 0.12, -L], { mat: 'glow', solid: false });
    this.lv.checkpoints.push({ box: this.b([-W / 2, -1, -3.5, W / 2, H + 1, 0]), spawn: [this.ox, 0.86, this.z0 - 1.6, 0], room: this.id });
  }
}

// --- small props ---------------------------------------------------------------------
const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });

// a station clock: a white face, dark hands, stopped (or running backwards: userData.backwards)
export function makeClock(opts = {}) {
  const g = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 32), std(0xf4f4f0));
  face.rotation.x = Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 8, 32), std(0x2a2f36, { metalness: 0.6 }));
  const hour = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.17, 0.02), basic(0x202428));
  hour.position.set(0, 0.07, 0.04);
  const minute = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.26, 0.02), basic(0x202428));
  minute.position.set(0, 0.11, 0.045);
  const sec = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.28, 0.012), basic(0xe2574a));
  sec.position.set(0, 0.12, 0.05);
  const hands = new THREE.Group();
  const hp = new THREE.Group();
  hp.add(hour);
  hp.rotation.z = -2.1; // 8 o'clock
  const mp = new THREE.Group();
  mp.add(minute);
  mp.rotation.z = -1.47; // 14 minutes
  const sp = new THREE.Group();
  sp.add(sec);
  hands.add(hp, mp, sp);
  g.add(face, rim, hands);
  g.userData.sp = sp;
  g.userData.mode = opts.mode || 'stopped'; // 'stopped' | 'backwards' | 'running'
  g.userData.tick = (t) => {
    if (g.userData.mode === 'stopped') return;
    sp.rotation.z = (g.userData.mode === 'backwards' ? 1 : -1) * (t % 60) * (Math.PI / 30);
  };
  return g;
}

// a child's toy: a small red car
export function makeToy() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.14), std(0xe2452a));
  body.position.y = 0.08;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.12), std(0xf6e8c0));
  cab.position.set(-0.02, 0.17, 0);
  g.add(body, cab);
  for (const [x, z] of [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 10), std(0x202428));
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.035, z);
    g.add(w);
  }
  return g;
}

// a shop-window security screen showing tomorrow (a glowing plane in a frame)
export function makeScreen(color = 0x9fd8ff) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 0.08), std(0x1c2026));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.68), basic(color, { transparent: true, opacity: 0.9 }));
  screen.position.z = 0.045;
  g.add(frame, screen);
  g.userData.screen = screen;
  return g;
}

// a power cell: a glowing cylinder with caps
export function makeCell(color = 0xffb36b) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5, 14), basic(color));
  const cap = std(0x3a4048, { metalness: 0.7 });
  const a = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 14), cap);
  a.position.y = 0.28;
  const b = a.clone();
  b.position.y = -0.28;
  g.add(core, a, b);
  g.userData.spin = true;
  return g;
}

// a wall panel: a plate with a light and a label stripe
export function makePanel(color = 0xffc04a) {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.1), std(0x2b323a));
  const light = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20), basic(color));
  light.position.set(0, 0.22, 0.06);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.02), basic(0xdfe8f0));
  stripe.position.set(0, -0.2, 0.06);
  g.add(plate, light, stripe);
  g.userData.light = light;
  return g;
}

// a child's drawing pinned to the wall: a pale sheet with crayon marks
export function makeDrawing() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 192;
  const g = c.getContext('2d');
  g.fillStyle = '#f6f1e4';
  g.fillRect(0, 0, 256, 192);
  g.lineWidth = 6;
  g.lineCap = 'round';
  // a black circle: the machine
  g.strokeStyle = '#2a2a2a';
  g.beginPath();
  g.arc(168, 96, 52, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(168, 96, 30, 0, Math.PI * 2);
  g.stroke();
  // two figures: a taller one and a smaller one holding hands
  const figure = (x, h, col) => {
    g.strokeStyle = col;
    g.beginPath();
    g.arc(x, 150 - h, 10, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.moveTo(x, 160 - h);
    g.lineTo(x, 170);
    g.moveTo(x, 172 - h);
    g.lineTo(x - 14, 190 - h);
    g.moveTo(x, 172 - h);
    g.lineTo(x + 14, 190 - h);
    g.moveTo(x - 10, 185);
    g.lineTo(x, 170);
    g.lineTo(x + 10, 185);
    g.stroke();
  };
  figure(60, 50, '#3a6fc4');
  figure(96, 32, '#d04a7a');
  g.strokeStyle = '#d04a7a';
  g.beginPath();
  g.moveTo(74, 140);
  g.lineTo(82, 150);
  g.stroke();
  g.fillStyle = '#5a5a5a';
  g.font = '18px sans-serif';
  g.fillText('KAI + MIRA', 24, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), new THREE.MeshBasicMaterial({ map: tex }));
  return m;
}

// the Chronolith: a black ring, taller than the room should allow; a thin light runs around it when it wakes
export function makeChronolith(scale = 1.6) {
  const g = new THREE.Group();
  const ring = makeMachineRing();
  ring.traverse((o) => {
    if (o.isMesh && o.material) {
      o.material = o.material.clone();
      if (o.material.color) o.material.color.setHex(0x0c0e12);
      if ('emissive' in o.material) o.material.emissive.setHex(0x101420);
      o.material.metalness = 0.75;
      o.material.roughness = 0.35;
    }
  });
  ring.position.set(0, 0, 0); // (the lab's machine ring is mounted 3.6 m up; the Chronolith stands where it is put)
  ring.scale.setScalar(scale);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(3.05 * scale * 0.62, 0.025, 8, 96), basic(0x4f9fe8, { transparent: true, opacity: 0.6 }));
  g.add(ring, halo);
  g.userData.inner = ring.userData.inner;
  g.userData.halo = halo;
  return g;
}

// a station board: a dark plane carrying a line of text (texts are drawn by DeckWorld; this is its backing)
export function makeBoard(w = 3.2, h = 0.7) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), std(0x161a20, { emissive: 0x0d1118 }));
}
