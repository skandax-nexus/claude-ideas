// THE LAST VERSION OF EARTH: hand-authored interiors (the Helix facility) in the level format
// gen/LevelGen.js produces, so world/DeckWorld.js runs them unchanged.
//
// A Deck is a chain of rooms. Each room is authored in its own local frame (x across, z from 0 at
// its entry wall to -L at its far wall, y up from its floor) and the builder turns boxes, props,
// people, watchers and scenes into world coordinates. A room may be placed and turned (`at`, `rot`
// in quarter turns, `y` its floor), may leave by its far wall or by a side wall (`exit: 'N' | 'E' |
// 'W'`, so a chain can turn a corner round a court), may climb to the next room on a stair corridor
// (`corridor: { len, rise }`), has a roof that can differ per year (`roof: 'solid' | 'glass' | 'open'`
// or `{ PAST: 'open', ... }`) and windows in its walls (`windows: { S, E, W, N }`, 'full' or
// [[from, to, y0, y1], ...]). Inside a place (`place:` a Place builder, OVERHAUL.md §4.3) the rooms
// stand among the place's own geometry: their surfaces are drawn by the place's scenery in the
// place's materials (never a Vessel look), their doors and conditional pieces stay DeckWorld's.
// Small procedural props (a clock, a toy, a power cell, the three Chronoliths) live here too.
import * as THREE from '../../../vendor/three.module.min.js';

const T = 0.4; // wall thickness
const DOOR_W = 1.5; // half width of a doorway
const DOOR_H = 4;
const CL = 4; // corridor length

// the place materials a room's own materials become inside a place
// (closing: visuals; Helix's desks, consoles, ledges and stairs are painted panels with their seams, its plant painted
// cabinets, its floors a grey tile that reads in emergency light, never blank white boxes on black rubber)
const PLACE_MATS = {
  wall: 'helixWhite', floor: 'helixFloor', ceil: 'helixCeil', prop: 'panelWhite', prop2: 'wood', pillar: 'steel', trim: 'steel', trimDark: 'ironDark',
  glow: 'glowAccent', panelGlow: 'lightPanel', door: 'helixDoor', crate: 'crateWood', industrial: 'rawConcrete', pit: 'rawConcrete', pipe: 'rust',
  moss: 'moss', tank: 'panelGrey', metal: 'steel', glass: 'glass', console: 'panelWhite',
};

// a condition that only names years ('@PAST', '!@PAST', '@PAST || @FUTURE'): the years it holds in
const ALL = ['PRESENT', 'PAST', 'FUTURE'];
export function eraOf(when) {
  if (!when) return null;
  const neg = /^!@([A-Z]+)$/.exec(when);
  if (neg) return ALL.filter((s) => s !== neg[1]);
  if (/^@[A-Z]+(\s*\|\|\s*@[A-Z]+)*$/.test(when)) return when.split('||').map((x) => x.trim().slice(1));
  return null;
}

export class Deck {
  constructor({ id, deckName, palette, seed = 'lv', deck = 0, sector = 0, states = null, unstable = false, estimateMin = 20, place = null, start = null, mats = null }) {
    this.place = place;
    this.mats = { ...PLACE_MATS, ...(mats || {}) };
    if (place) {
      // inside a place: the rooms write into the place's own lists
      const P = place;
      this.level = {
        id, deck, sector, seed, deckName, palette, rooms: P.rooms, order: P.order, elements: P.cols, texts: P.texts, interactables: P.inter, items: P.items, tokens: [],
        hazards: P.hazards, sentinels: P.sentinels, npcs: P.npcs, checkpoints: P.checkpoints, triggers: P.triggers, map: { rooms: [], corridors: [] }, effects: ['echoSolid'], estimateMin, states, unstable,
      };
    } else {
      this.level = {
        id, deck, sector, seed, deckName, palette,
        rooms: {}, order: [], elements: [], texts: [], interactables: [], items: [], tokens: [], hazards: [], sentinels: [], npcs: [], checkpoints: [], triggers: [],
        map: { rooms: [], corridors: [] }, effects: ['echoSolid'], estimateMin, states, unstable,
      };
    }
    // the cursor: where the next room's entry is, which way it faces, its floor
    this.cur = { x: start?.at?.[0] ?? 0, z: start?.at?.[1] ?? 0, th: ((start?.rot ?? 0) * Math.PI) / 2, y: start?.y ?? 0 };
    this.rooms = [];
    this.pending = null; // the corridor of the last room, built once the next room's floor is known
  }

  // Author one room. fn(R) places its contents; R.W, R.L, R.H are the room size.
  room({ id, name, W = 12, L = 16, H = 6, kind = 'puzzle', beat, states, lights, tint, floatY, ox, exit = 'N', at, rot, y, corridor, roof = 'solid', windows = {}, gaps = {}, closedS = false, interior = true, sky = null }, fn) {
    const lv = this.level;
    if (ox !== undefined && !this.place) this.cur.x = ox; // (the old side offset)
    if (at) {
      this.cur.x = at[0];
      this.cur.z = at[1];
    }
    if (rot !== undefined) this.cur.th = (rot * Math.PI) / 2;
    if (y !== undefined) this.cur.y = y;
    const R = new Room(this, id, { W, L, H, x: this.cur.x, z: this.cur.z, th: this.cur.th, y0: this.cur.y, exit, roof, windows, gaps, corridor });
    const first = !this.rooms.length;
    R.first = first || closedS;
    fn(R);
    R.shell();
    const [bx0, bz0, bx1, bz1] = R.rectXZ(-W / 2 - T, -L - T - (corridor?.len ?? CL) - 1, W / 2 + T, T, exit);
    const yLo = this.place ? R.y0 + Math.min(0, corridor?.rise ?? 0) - 6 : -12;
    let bounds = [[bx0, yLo, bz0, bx1, this.place ? R.y0 + Math.max(H, (corridor?.rise ?? 0) + DOOR_H) + 0.6 : 30, bz1]];
    // a sunken room with a stair up to the next: the room and its stair as two boxes, so the open ground over the
    // room and beside the stair is the place's (one box round both held the court over Helix's chamber)
    if (this.place && corridor?.rise && R.corridorBox) {
      const [rx0, rz0, rx1, rz1] = R.rectXZ(-W / 2 - T, -L - T, W / 2 + T, T);
      const c = R.corridorBox;
      bounds = [[rx0, yLo, rz0, rx1, R.y0 + H + 0.6, rz1], [c[0] - 0.5, yLo, c[2] - 0.5, c[3] + 0.5, c[4] + 0.6, c[5] + 0.5]];
    }
    // (closing: visuals) inside a place, the daylight through a room's windows or glass roof is a light of its own, so a room
    // reads on a phone: the fourth light stands inside its brightest window wall (or under its glass roof)
    const daylight = (() => {
      if (!this.place || lights) return [];
      const wall = ['E', 'W', 'S', 'N'].find((k) => windows[k]);
      const at = roof !== 'solid' ? [0, H - 0.6, -L / 2] : wall === 'E' ? [W / 2 - 1.2, H * 0.6, -L / 2] : wall === 'W' ? [-W / 2 + 1.2, H * 0.6, -L / 2] : wall === 'S' ? [0, H * 0.6, -1.2] : wall === 'N' ? [0, H * 0.6, -L + 1.2] : null;
      return at ? [[...R.p(at), lv.palette.daylight ?? 0xc8d4e8, lv.palette.daylightK ?? 1.5, Math.max(16, L)]] : [];
    })();
    const room = {
      name, kind, bounds,
      spawn: [...R.p([0, 0.86, -1.6]).map((v) => Math.round(v * 1000) / 1000), R.th],
      lights: lights || [[...R.p([0, H - 0.8, -L * 0.3]), lv.palette.light, 2.0, Math.max(14, L)], [...R.p([0, H - 0.8, -L * 0.75]), lv.palette.light, 1.8, Math.max(14, L)], [...R.p([W / 2 - 1, 2.2, -L / 2]), lv.palette.accent, 0.8, 10], ...daylight],
      tint: tint ?? lv.palette.tint, killY: R.y0 - 3, floatY: floatY ?? R.y0 + 1.3, challenges: R.challenges, route: [], exitSide: exit, L, W, H,
      states: states || lv.states || undefined, interior, sky: sky || (roof === 'solid' ? null : typeof roof === 'string' ? roof : 'year'),
      rect: R.rectXZ(-W / 2, -L, W / 2, 0),
    };
    if (beat) room.beat = beat;
    lv.rooms[id] = room;
    lv.order.push(id);
    const mapRoom = { id, rect: room.rect, name, kind };
    if (this.place) this.place.mapRooms = [...(this.place.mapRooms || []), mapRoom];
    else lv.map.rooms.push(mapRoom);
    // the next room starts where this one's corridor ends
    const d = R.exitFrame();
    const len = corridor?.len ?? CL;
    this.cur.x = d.x + d.ox * (T + len);
    this.cur.z = d.z + d.oz * (T + len);
    this.cur.th = d.th;
    this.cur.y = R.y0 + (corridor?.rise ?? 0);
    if (this.place) this.place.reserve(...room.rect, 1);
    this.rooms.push(R);
    return R;
  }

  // the last room's exit is the way out (walking into it completes the sector)
  finish({ gated = true } = {}) {
    const lv = this.level;
    const R = this.rooms[this.rooms.length - 1];
    const len = R.corridor?.len ?? CL, rise = R.corridor?.rise ?? 0;
    // in the room's own frame: the doorway in the exit wall, and the end of its corridor
    const { W, L } = R;
    let door, end;
    if (R.exit === 'E') {
      door = [W / 2, 0, -L + 2.1 - DOOR_W, W / 2 + T, DOOR_H, -L + 2.1 + DOOR_W];
      end = [W / 2 + T + len - 1.2, rise - 1, -L + 2.1 - DOOR_W, W / 2 + T + len + 1, rise + DOOR_H + 1, -L + 2.1 + DOOR_W];
    } else if (R.exit === 'W') {
      door = [-W / 2 - T, 0, -L + 2.1 - DOOR_W, -W / 2, DOOR_H, -L + 2.1 + DOOR_W];
      end = [-W / 2 - T - len - 1, rise - 1, -L + 2.1 - DOOR_W, -W / 2 - T - len + 1.2, rise + DOOR_H + 1, -L + 2.1 + DOOR_W];
    } else {
      door = [-DOOR_W, 0, -L - T, DOOR_W, DOOR_H, -L];
      end = [-DOOR_W, rise - 1, -L - T - len - 1, DOOR_W, rise + DOOR_H + 1, -L - T - len + 1.2];
    }
    lv.exit = { room: R.id, box: R.b(end) };
    const eb = lv.exit.box;
    lv.map.gate = [(eb[0] + eb[3]) / 2, (eb[2] + eb[5]) / 2];
    if (gated) lv.elements.push({ box: R.b(door), mat: 'door', solid: true, when: '!beat_done', id: `gate_${lv.id}`, room: R.id, lvMat: this.mats.door });
    if (this.place) {
      this.place.exit = lv.exit;
      this.place.exitAt = [(eb[0] + eb[3]) / 2, eb[1] + 1, (eb[2] + eb[5]) / 2];
    }
    lv.spawn = lv.rooms[lv.order[0]].spawn;
    return lv;
  }
}

class Room {
  constructor(deck, id, { W, L, H, x, z, th, y0, exit, roof, windows, gaps = {}, corridor }) {
    this.deck = deck;
    this.lv = deck.level;
    this.P = deck.place;
    this.id = id;
    this.W = W;
    this.L = L;
    this.H = H;
    this.x = x;
    this.z = z;
    this.th = th;
    this.c = Math.round(Math.cos(th) * 1e6) / 1e6;
    this.s = Math.round(Math.sin(th) * 1e6) / 1e6;
    this.y0 = y0;
    this.exit = exit;
    this.roof = roof;
    this.windows = windows;
    this.gaps = gaps; // { S: [{ at: [from, to], closed: '<condition>' }] }: a doorway in a wall, glazed while `closed` holds
    this.corridor = corridor;
    this.challenges = [];
    this.openings = { S: true, N: true };
    this.ox = x; // (kept for code that reads the room's x)
    this.z0 = z;
  }

  // local -> world
  p([x, y, z]) {
    return [this.x + x * this.c + z * this.s, this.y0 + y, this.z - x * this.s + z * this.c];
  }

  // a local box -> a world AABB (exact for quarter turns)
  b([x0, y0, z0, x1, y1, z1]) {
    const a = this.p([x0, y0, z0]), b = this.p([x1, y1, z1]);
    const r = (v) => Math.round(v * 1e4) / 1e4;
    return [r(Math.min(a[0], b[0])), r(Math.min(a[1], b[1])), r(Math.min(a[2], b[2])), r(Math.max(a[0], b[0])), r(Math.max(a[1], b[1])), r(Math.max(a[2], b[2]))];
  }

  // a local rect (x0..x1, z0..z1) -> a world [x0, z0, x1, z1]; with an exit side, the corridor's reach is added on that side
  rectXZ(x0, z0, x1, z1, exit = null) {
    let lx0 = x0, lx1 = x1, lz0 = z0, lz1 = z1;
    if (exit === 'E') {
      lz0 = -this.L - T;
      lx1 = this.W / 2 + T + (this.corridor?.len ?? CL) + 1;
    } else if (exit === 'W') {
      lz0 = -this.L - T;
      lx0 = -this.W / 2 - T - (this.corridor?.len ?? CL) - 1;
    }
    const b = this.b([lx0, 0, lz0, lx1, 0, lz1]);
    return [b[0], b[2], b[3], b[5]];
  }

  // the exit doorway: its world centre, the outward direction and the next room's heading
  exitFrame() {
    const { W, L } = this;
    let at, out, th;
    if (this.exit === 'E') {
      at = [W / 2 + T, 0, -L + 2.1];
      out = [1, 0];
      th = this.th - Math.PI / 2;
    } else if (this.exit === 'W') {
      at = [-W / 2 - T, 0, -L + 2.1];
      out = [-1, 0];
      th = this.th + Math.PI / 2;
    } else {
      at = [0, 0, -L - T];
      out = [0, -1];
      th = this.th;
    }
    const w = this.p(at);
    const ox = out[0] * this.c + out[1] * this.s, oz = -out[0] * this.s + out[1] * this.c;
    return { x: w[0], z: w[2], ox: Math.round(ox), oz: Math.round(oz), th, local: at };
  }

  // every box goes through here: plain DeckWorld elements outside a place; inside one, the place
  // draws it (an era piece goes to the era's group, its collider is a ghost), while doors and
  // pieces that wait on facts stay DeckWorld's own (the edition swaps in a place material)
  box(local, o = {}) {
    const b = this.b(local);
    const el = { box: b, mat: 'wall', solid: true, ...o, room: this.id };
    if (!this.P) return this.lv.elements.push(el);
    const m = this.deck.mats[el.mat] || el.mat;
    const era = eraOf(el.when);
    if (el.echo || el.id || (el.when && !era)) {
      this.lv.elements.push({ ...el, lvMat: m });
      return;
    }
    const P = this.P;
    // (o.vis false: a collider only, its look drawn by finer pieces: a desk, a console, a shelf)
    const run = () => (o.vis === false ? P.col(b, { room: this.id }) : el.solid === false ? P.vbox(b, m, { t: o.t }) : P.box(b, m, { t: o.t, room: this.id }));
    if (era) P.E(era, run);
    else run();
  }

  text(str, pos, rotY = 0, o = {}) {
    this.lv.texts.push({ text: str, pos: this.p(pos), rotY: rotY + this.th, size: 0.4, color: '#dfe8f0', ...o, room: this.id });
  }

  inter(it) {
    this.lv.interactables.push({ r: 2.6, ...it, pos: this.p(it.pos), yaw: (it.yaw || 0) + this.th, room: this.id });
  }

  // a scene: something to inspect (kind 'scene' is handled by the edition's runtime)
  scene(id, pos, prompt, o = {}) {
    this.inter({ id, kind: 'scene', scene: o.scene || id, pos, prompt, ...o });
  }

  item(it) {
    this.lv.items.push({ ...it, pos: this.p(it.pos), room: this.id });
  }

  npc(n) {
    this.lv.npcs.push({ ...n, pos: this.p(n.pos), yaw: (n.yaw || 0) + this.th, path: n.path?.map(([x, z]) => { const w = this.p([x, 0, z]); return [w[0], w[2]]; }), room: this.id });
  }

  sentinel(s) {
    const path = s.path.map(([x, z]) => { const w = this.p([x, 0, z]); return [w[0], w[2]]; });
    let conduit;
    if (s.conduit) {
      const b = this.b([s.conduit[0], 0, s.conduit[1], s.conduit[2], 0, s.conduit[3]]);
      conduit = [b[0], b[2], b[3], b[5]];
    }
    this.lv.sentinels.push({ speed: 1.8, range: 8.5, fov: 0.85, ...s, path, conduit, room: this.id, id: `${this.id}_s${this.lv.sentinels.length}` });
  }

  hazard(h) {
    this.lv.hazards.push({ kind: 'sweeper', radius: this.W / 2 - 0.4, speed: 1.4, phase: 0, ...h, pivot: this.p(h.pivot), room: this.id });
  }

  trigger(local, set, o = {}) {
    this.lv.triggers.push({ box: this.b(local), set, once: true, ...o, room: this.id });
  }

  checkpoint(zFrom, zTo, spawnZ) {
    this.lv.checkpoints.push({ box: this.b([-this.W / 2, -1, zTo, this.W / 2, this.H + 1, zFrom]), spawn: [...this.p([0, 0.86, spawnZ]), this.th], room: this.id });
  }

  challenge(key, zFrom, zTo, hints, o = {}) {
    this.challenges.push({ key, hints, box: this.b([-this.W / 2, -12, zTo, this.W / 2, 30, zFrom]), ...o, ...(o.answer ? { answer: [].concat(o.answer) } : {}) });
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

  // plain stairs along -z from (x0..x1, zFace) up to height h (rises of 0.34 m inside a place: the engine walks up 0.35 m)
  stairs(x0, x1, zFace, h, o = {}) {
    const RISE = this.P ? 0.34 : 0.5, TREAD = this.P ? 0.6 : 0.8;
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
    // (closing: visuals) inside a place, a desk is a top on two pedestals with a monitor on it, a console a cabinet with its
    // lit screen, a shelf uprights and boards and the binders on them: each collides as one box and is drawn in pieces
    if (this.P && ['desk', 'console', 'shelf'].includes(kind)) {
      const wood = o.mat === 'prop2';
      const v = (b, mat) => this.box(b, { mat, solid: false });
      if (kind === 'desk') {
        this.box([x - 0.9, 0, z - 0.5, x + 0.9, 0.78, z + 0.5], { vis: false });
        v([x - 0.92, 0.72, z - 0.52, x + 0.92, 0.78, z + 0.52], wood ? 'wood' : 'counterTop');
        for (const s of [-1, 1]) v([x + s * 0.45, 0, z - 0.46, x + s * 0.88, 0.72, z + 0.46], wood ? 'wood' : 'panelGrey');
        if (!wood) { v([x - 0.34, 0.86, z - 0.34, x + 0.34, 1.26, z - 0.3], 'carGlass'); v([x - 0.04, 0.78, z - 0.34, x + 0.04, 0.86, z - 0.28], 'ironDark'); v([x - 0.25, 0.78, z - 0.1, x + 0.25, 0.8, z + 0.08], 'ironDark'); }
      } else if (kind === 'console') {
        this.box([x - 0.6, 0, z - 0.4, x + 0.6, 1.0, z + 0.4], { vis: false });
        v([x - 0.6, 0.1, z - 0.4, x + 0.6, 1.0, z + 0.4], 'panelGrey');
        v([x - 0.56, 0, z - 0.34, x + 0.56, 0.1, z + 0.34], 'ironDark');
        v([x - 0.5, 1.0, z - 0.3, x + 0.5, 1.06, z + 0.3], 'glowAccent');
        v([x - 0.5, 1.06, z - 0.36, x + 0.5, 1.5, z - 0.3], 'carGlass');
      } else {
        this.box([x - 1.2, 0, z - 0.35, x + 1.2, 2.2, z + 0.35], { vis: false });
        for (const s of [-1, 1]) v([x + s * 1.14, 0, z - 0.35, x + s * 1.2, 2.2, z + 0.35], wood ? 'wood' : 'panelGrey');
        v([x - 1.14, 0.05, z + 0.28, x + 1.14, 2.15, z + 0.33], 'shopShelves');
        for (let k = 0; k < 5; k++) v([x - 1.14, 0.08 + k * 0.52, z - 0.33, x + 1.14, 0.12 + k * 0.52, z + 0.33], wood ? 'wood' : 'panelWhite');
      }
      return;
    }
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

  // a wall of the room along one side, with its doorway and its windows (place rooms only)
  side(which, x0, z0, x1, z1, door) {
    const H = this.H;
    const win = this.windows[which];
    const spans = []; // along the wall, [from, to] of glass
    const len = Math.hypot(x1 - x0, z1 - z0);
    if (win === 'full') {
      if (door) spans.push([0.6, door[0] - 0.3, 0.15, H - 0.3], [door[1] + 0.3, len - 0.6, 0.15, H - 0.3]);
      else spans.push([0.6, len - 0.6, 0.15, H - 0.3]);
    }
    else if (Array.isArray(win)) for (const w of win) spans.push(w);
    // a gap: a doorway out of the room that only some years (or facts) leave open: glass fills it otherwise
    const gaps = (this.gaps?.[which] || []).map((g) => [g.at[0], g.at[1], 0, DOOR_H, g]);
    if (gaps.length && win === 'full') {
      // (a full-glass wall: the glass runs either side of each gap)
      const cuts = [...(door ? [door] : []), ...gaps.map((g) => [g[0], g[1]])].sort((a, b) => a[0] - b[0]);
      spans.length = 0;
      let u0 = 0.6;
      for (const [a, b] of cuts) {
        if (a - 0.3 > u0) spans.push([u0, a - 0.3, 0.15, H - 0.3]);
        u0 = b + 0.3;
      }
      if (len - 0.6 > u0) spans.push([u0, len - 0.6, 0.15, H - 0.3]);
    }
    const openings = [...(door ? [[door[0], door[1], 0, DOOR_H]] : []), ...gaps, ...spans.map(([a, b, y0 = 0.9, y1 = H - 0.6]) => [a, b, y0, y1])].sort((a, b) => a[0] - b[0]);
    const ux = (x1 - x0) / len, uz = (z1 - z0) / len;
    const seg = (a, b, y0, y1, o = {}) => {
      const lx0 = x0 + ux * a, lz0 = z0 + uz * a, lx1 = x0 + ux * b, lz1 = z0 + uz * b;
      const nx = Math.abs(uz) > 0.5 ? T / 2 : 0, nz = Math.abs(ux) > 0.5 ? T / 2 : 0;
      this.box([Math.min(lx0, lx1) - nx, y0, Math.min(lz0, lz1) - nz, Math.max(lx0, lx1) + nx, y1, Math.max(lz0, lz1) + nz], { mat: 'wall', ...o });
    };
    let u = 0;
    const lowY = -T; // inside a place the walls stop at the floor slab
    for (const [a, b, y0, y1, gap] of openings) {
      if (a > u) seg(u, a, lowY, H);
      if (y0 > 0) seg(a, b, lowY, y0);
      if (y1 < H) seg(a, b, y1, H);
      const isDoor = door && a === door[0] && b === door[1];
      if (gap) {
        if (gap.closed) seg(a, b, 0, y1, { mat: 'glass', t: undefined, when: gap.closed });
      } else if (!isDoor) {
        // glass, solid, with thin mullions every 1.5 m
        seg(a, b, y0, y1, { mat: 'glass', t: undefined });
        for (let m = a + 1.5; m < b - 0.2; m += 1.5) seg(m - 0.04, m + 0.04, y0, y1, { mat: 'trim', solid: false });
      }
      u = Math.max(u, b);
    }
    if (u < len) seg(u, len, lowY, H);
  }

  // the shell: floor (unless the author laid it), ceiling, four walls with the doorways
  shell() {
    if (this.P) return this.placeShell();
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
    this.lv.checkpoints.push({ box: this.b([-W / 2, -1, -3.5, W / 2, H + 1, 0]), spawn: [...this.p([0, 0.86, -1.6]), this.th], room: this.id });
  }

  // a room inside a place: walls with real windows, a roof that may be glass or open (or differ per
  // year), ceiling light panels instead of the Vessel's ribs, the corridor (or stair) to the next room
  placeShell() {
    const { W, L, H } = this;
    const sx = this.exit === 'E' ? 1 : this.exit === 'W' ? -1 : 0;
    const doorAt = (len) => [len / 2 - DOOR_W, len / 2 + DOOR_W];
    // the entry wall (south), from local x -W/2 to W/2 at z = 0
    this.side('S', -W / 2 - T, T / 2, W / 2 + T, T / 2, this.first ? null : doorAt(W + 2 * T));
    // the far wall (north)
    this.side('N', -W / 2 - T, -L - T / 2, W / 2 + T, -L - T / 2, sx || this.exit === 'none' ? null : doorAt(W + 2 * T));
    // the sides, from the entry toward the far wall; a side exit sits 2.1 m from the far wall
    const sideDoor = [L - 2.1 - DOOR_W, L - 2.1 + DOOR_W];
    this.side('W', -W / 2 - T / 2, 0, -W / 2 - T / 2, -L, sx < 0 ? sideDoor : null);
    this.side('E', W / 2 + T / 2, 0, W / 2 + T / 2, -L, sx > 0 ? sideDoor : null);
    // the roof, per year
    const roofs = typeof this.roof === 'string' ? { PRESENT: this.roof, PAST: this.roof, FUTURE: this.roof } : { PRESENT: 'solid', PAST: 'solid', FUTURE: 'solid', ...this.roof };
    const kinds = [...new Set(Object.values(roofs))];
    for (const k of kinds) {
      const years = Object.keys(roofs).filter((s) => roofs[s] === k);
      const when = years.length === 3 ? undefined : years.map((s) => `@${s}`).join(' || ');
      if (k === 'solid') {
        this.box([-W / 2 - T, H, -L - T, W / 2 + T, H + T, T], { mat: 'ceil', when });
        for (let i = 1; i < Math.max(2, Math.floor(L / 5)); i++) {
          const rz = -(i * L) / Math.max(2, Math.floor(L / 5));
          this.box([-1.4, H - 0.05, rz - 0.5, 1.4, H, rz + 0.5], { mat: 'panelGlow', solid: false, when });
        }
      } else if (k === 'glass') {
        this.box([-W / 2 - T, H, -L - T, W / 2 + T, H + 0.1, T], { mat: 'glassRoof', when });
        for (let i = 0; i <= Math.floor(W / 3); i++) {
          const rx = -W / 2 + (i * W) / Math.floor(W / 3);
          this.box([rx - 0.08, H - 0.3, -L - T, rx + 0.08, H, T], { mat: 'trim', solid: false, when });
        }
      }
      // 'open': nothing overhead; a parapet coping marks the top of the walls
    }
    this.box([-W / 2 - T - 0.1, H, -L - T - 0.1, -W / 2 + 0.1, H + 0.35, T + 0.1], { mat: 'trim', solid: false });
    this.box([W / 2 - 0.1, H, -L - T - 0.1, W / 2 + T + 0.1, H + 0.35, T + 0.1], { mat: 'trim', solid: false });
    // what the place builds round: this room (and, below, its corridor), up to their tops
    const open = typeof this.roof === 'string' ? this.roof !== 'solid' : Object.values(this.roof).some((r) => r !== 'solid');
    const occ = (this.P.occupied ||= []);
    const rr = this.rectXZ(-W / 2 - T, -L - T, W / 2 + T, T);
    occ.push({ rect: rr, base: this.y0, top: this.y0 + H + T, open }); // (base: a room raised off the ground stands on the place's own storeys)
    this.checkpointShell();
    if (this.exit === 'none') return;
    // the corridor to the next room (a stair when the next floor is higher or lower)
    const len = this.corridor?.len ?? CL, rise = this.corridor?.rise ?? 0;
    const f = this.exitFrame();
    const [ax, , az] = f.local;
    const ox = sx || 0, oz = sx ? 0 : -1;
    const along = (u, v, y0, y1, w) => {
      // a box in the corridor's frame: u from the doorway outward, v across
      const p0 = [ax + ox * u + (sx ? 0 : v), az + oz * u + (sx ? v : 0)];
      const p1 = [ax + ox * w + (sx ? 0 : -v), az + oz * w + (sx ? -v : 0)];
      return [Math.min(p0[0], p1[0]), y0, Math.min(p0[1], p1[1]), Math.max(p0[0], p1[0]), y1, Math.max(p0[1], p1[1])];
    };
    const hw = DOOR_W + T;
    const lo = Math.min(0, rise) - T;
    this.box(along(0, -hw, lo, Math.min(0, rise), len + T), { mat: 'floor' });
    // a stair: steps of at most 0.34 m, and a ceiling that steps with them
    const n = rise ? Math.ceil(Math.abs(rise) / 0.34) : 1;
    for (let i = 0; i < n; i++) {
      const u0 = (i * len) / n, u1 = i === n - 1 ? len + T : ((i + 1) * len) / n;
      const yTop = rise ? (rise > 0 ? (rise * (i + 1)) / n : rise * (i / n)) : 0;
      if (rise) this.box(along(u0, -DOOR_W, lo, yTop, u1), { mat: 'floor' });
      const ceil = Math.max(yTop, rise > 0 ? (rise * i) / n : yTop) + DOOR_H + 0.5;
      const side1 = along(u0, -hw, lo, ceil, u1), side2 = side1.slice();
      if (sx) {
        side1[5] = side1[2] + T;
        side2[2] = side2[5] - T;
      } else {
        side1[3] = side1[0] + T;
        side2[0] = side2[3] - T;
      }
      this.box(side1, { mat: 'wall' });
      this.box(side2, { mat: 'wall' });
      this.box(along(u0, -hw, ceil, ceil + T, u1), { mat: 'ceil' });
    }
    const cw = this.b(along(0, -hw, lo, Math.max(0, rise) + DOOR_H + 0.9, len + T));
    occ.push({ rect: [cw[0], cw[2], cw[3], cw[5]], top: cw[4], open: false, corridor: true });
    this.corridorBox = cw;
  }

  checkpointShell() {
    const { W, H } = this;
    this.lv.checkpoints.push({ box: this.b([-W / 2, -1, -3.5, W / 2, H + 1, 0]), spawn: [...this.p([0, 0.86, -1.6]), this.th], room: this.id });
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

// The Chronolith, in the edition's own three forms (OVERHAUL.md §4.3; never Station Zero's lab ring):
//   'stone'  a ring of dressed stone with a bronze band, as the settlement kept it (the past)
//   'helix'  the black machined ring Helix dug out of Site Zero, glyphs inlaid, a light that wakes
//   'halo'   2196: the same ring broken, a halo of fragments hanging where the rest should be
//   'cradle' 2026 in Helix's chamber: the steel cradle built for it, empty (the ring is still in the ground at the dig)
// The ring's centre is the model's origin; `inner` turns slowly (DeckWorld spins userData.inner).
// With { eras: { PRESENT: 'helix', PAST: 'stone', FUTURE: 'halo' } } one model carries several forms
// and userData.setEra(state) shows the right one (the runtime calls it on a year switch).
export function makeChronolith(scale = 1, kind = 'helix', opts = {}) {
  if (opts.eras) {
    const g = new THREE.Group();
    const forms = {};
    for (const k of new Set(Object.values(opts.eras))) {
      forms[k] = makeChronolith(scale, k);
      g.add(forms[k]);
    }
    g.userData.setEra = (state) => {
      const want = opts.eras[state] || opts.eras.PRESENT;
      for (const [k, f] of Object.entries(forms)) f.visible = k === want;
      g.userData.inner = forms[want]?.userData.inner;
    };
    g.userData.setEra('PRESENT');
    g.userData.inner = forms[opts.eras.PRESENT]?.userData.inner;
    return g;
  }
  const g = new THREE.Group();
  const R = 3.6 * scale, tube = 0.42 * scale;
  if (kind === 'stone') {
    const stone = std(0x8a8478, { roughness: 0.95 });
    const n = 14;
    for (let i = 0; i < n; i++) {
      // dressed blocks laid round the circle
      const a = (i / n) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.BoxGeometry(tube * 2.2, (2 * Math.PI * R) / n * 0.96, tube * 2.2), stone);
      b.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
      b.rotation.z = a;
      g.add(b);
    }
    const band = new THREE.Mesh(new THREE.TorusGeometry(R, tube * 0.32, 8, 72), std(0xa8743a, { metalness: 0.8, roughness: 0.35 }));
    band.position.z = tube * 1.12;
    g.add(band);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(R * 0.72, tube * 0.18, 6, 60), std(0x7a5a30, { metalness: 0.7, roughness: 0.4 }));
    g.add(inner);
    g.userData.inner = inner;
  } else if (kind === 'halo') {
    const black = std(0x0c0e12, { metalness: 0.75, roughness: 0.4 });
    // the lower two thirds stand; the rest hangs in fragments
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, tube, 12, 64, Math.PI * 1.25), black);
    ring.rotation.z = -Math.PI * 0.12;
    g.add(ring);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.18 + i * 0.1);
      const f = new THREE.Mesh(new THREE.TorusGeometry(R + 0.4 * scale * Math.sin(i * 1.9), tube * 0.8, 8, 6, Math.PI * 0.07), black);
      f.rotation.z = a;
      f.position.set(Math.cos(a) * 0.3 * scale, Math.sin(a) * 0.3 * scale + 0.2 * i * scale * 0.2, (i % 2 ? 0.3 : -0.3) * scale);
      g.add(f);
    }
    const moss = new THREE.Mesh(new THREE.TorusGeometry(R, tube * 1.04, 8, 40, Math.PI * 0.5), std(0x4a6a3a, { roughness: 1 }));
    moss.rotation.z = Math.PI * 1.2 + 0.4;
    g.add(moss);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(R * 0.7, tube * 0.12, 6, 48, Math.PI * 1.4), basic(0x9fe8c8, { transparent: true, opacity: 0.35 }));
    g.add(inner);
    g.userData.inner = inner;
  } else if (kind === 'cradle') {
    const steel = std(0x6a6e74, { metalness: 0.7, roughness: 0.45 });
    // an arc of steel under where the ring will sit, on two legs; nothing in it
    const arc = new THREE.Mesh(new THREE.TorusGeometry(R + tube * 1.4, tube * 0.35, 8, 32, Math.PI * 0.55), steel);
    arc.rotation.z = Math.PI * 1.225; // (centred under the ring)
    g.add(arc);
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16 * scale, R * 0.9, 0.16 * scale), steel);
      leg.position.set(s * R * 0.62, -R * 0.62, 0);
      g.add(leg);
    }
  } else {
    const black = std(0x0b0d11, { metalness: 0.82, roughness: 0.28 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, tube, 16, 96), black);
    g.add(ring);
    // a machined face: two flat rims and inlaid glyph lines in bronze
    for (const z of [-tube * 0.9, tube * 0.9]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(R, tube * 0.16, 6, 96), std(0x16191f, { metalness: 0.9, roughness: 0.2 }));
      rim.position.z = z;
      g.add(rim);
    }
    const glyph = std(0x8a6a3a, { metalness: 0.85, roughness: 0.35, emissive: 0x2a1a08 });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const gl = new THREE.Mesh(new THREE.BoxGeometry(0.05 * scale, tube * (i % 3 ? 0.8 : 1.3), 0.02), glyph);
      gl.position.set(Math.cos(a) * (R + tube * 0.95), Math.sin(a) * (R + tube * 0.95), tube * 0.35);
      gl.rotation.z = a;
      g.add(gl);
    }
    const inner = new THREE.Mesh(new THREE.TorusGeometry(R * 0.74, tube * 0.22, 8, 72), std(0x121418, { metalness: 0.8, roughness: 0.3 }));
    g.add(inner);
    g.userData.inner = inner;
  }
  // the light that runs round it when it wakes (an empty cradle has none)
  if (kind !== 'cradle') {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(R * 0.86, 0.025 * scale, 8, 96), basic(kind === 'stone' ? 0xffc06a : kind === 'halo' ? 0x9fe8c8 : 0x4f9fe8, { transparent: true, opacity: 0.6 }));
    g.add(halo);
    g.userData.halo = halo;
  }
  // a low plinth it stands in
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(R * 1.1, 0.5 * scale, tube * 3.2), std(kind === 'stone' ? 0x6a6458 : 0x1a1d22, { roughness: 0.8 }));
  plinth.position.y = -R - tube * 0.3;
  g.add(plinth);
  g.userData.kind = kind;
  return g;
}

// a station board: a dark plane carrying a line of text (texts are drawn by DeckWorld; this is its backing)
export function makeBoard(w = 3.2, h = 0.7) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), std(0x161a20, { emissive: 0x0d1118 }));
}

// --- the Prologue's small things (OVERHAUL.md §5 M1-M3): each faces +z, its origin where it is looked at -----------
const flat = (w, h, d, c, x = 0, y = 0, z = 0, o = {}) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.basic ? basic(c, o.basic === true ? {} : o.basic) : std(c, o.std || {}));
  m.position.set(x, y, z);
  if (o.rx) m.rotation.x = o.rx;
  if (o.ry) m.rotation.y = o.ry;
  if (o.rz) m.rotation.z = o.rz;
  return m;
};

// a framed photograph on a wall: a girl in a yellow raincoat and yellow boots
export function makePhoto() {
  const g = new THREE.Group();
  g.add(flat(0.34, 0.26, 0.03, 0x3a2a20));
  g.add(flat(0.28, 0.2, 0.01, 0xd8d4c8, 0, 0, 0.02, { basic: true }));
  g.add(flat(0.06, 0.09, 0.012, 0xf2c21a, 0.02, -0.01, 0.026, { basic: true })); // the raincoat
  g.add(flat(0.05, 0.03, 0.012, 0xf2c21a, 0.02, -0.07, 0.026, { basic: true })); // the boots
  g.add(flat(0.04, 0.04, 0.012, 0xc89a7a, 0.02, 0.055, 0.026, { basic: true }));
  return g;
}

// a strip of three photographs from a booth, sepia, one child in each
export function makePhotoStrip() {
  const g = new THREE.Group();
  g.add(flat(0.09, 0.32, 0.006, 0xf4ecd8, 0, 0, 0, { basic: true }));
  for (let i = 0; i < 3; i++) {
    g.add(flat(0.07, 0.08, 0.004, [0xb8a080, 0x9fb0c0, 0xa8c8a8][i], 0, 0.1 - i * 0.1, 0.005, { basic: true }));
    g.add(flat(0.025, 0.04, 0.004, 0xd06a9a, 0, 0.09 - i * 0.1, 0.008, { basic: true }));
  }
  return g;
}

// a steel thermos with a red cup, initials taped on it
export function makeThermos() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 14), std(0x5a7088, { metalness: 0.6, roughness: 0.35 }));
  body.position.y = -0.06;
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.07, 14), std(0xb83a2a));
  cup.position.y = 0.12;
  g.add(body, cup, flat(0.07, 0.04, 0.005, 0xf4ecd8, 0, -0.04, 0.061, { basic: true }));
  return g;
}

// a Polaroid pinned to a board: a black ring half out of the clay
export function makePolaroid() {
  const g = new THREE.Group();
  g.add(flat(0.11, 0.13, 0.004, 0xf6f4ee, 0, 0, 0, { basic: true }));
  g.add(flat(0.09, 0.09, 0.004, 0x7a6a50, 0, 0.012, 0.003, { basic: true }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 6, 20, Math.PI), basic(0x101010));
  ring.position.set(0, 0.005, 0.006);
  g.add(ring);
  return g;
}

// footprints in pale dust: a man's boots and a child's, one with a star tread
export function makeFootprints() {
  const g = new THREE.Group();
  const dust = new THREE.Mesh(new THREE.CircleGeometry(0.9, 20), basic(0xe8e2d4, { transparent: true, opacity: 0.85 }));
  dust.rotation.x = -Math.PI / 2;
  dust.position.y = -1.08;
  g.add(dust);
  const print = (x, z, s, c, star) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.07 * s, 10), basic(c));
    m.rotation.x = -Math.PI / 2;
    m.scale.set(0.55, 1.4, 1);
    m.position.set(x, -1.07, z);
    g.add(m);
    if (star) {
      const st = new THREE.Mesh(new THREE.CircleGeometry(0.025, 5), basic(0xd8b020));
      st.rotation.x = -Math.PI / 2;
      st.position.set(x, -1.065, z);
      g.add(st);
    }
  };
  for (let i = 0; i < 3; i++) {
    print(-0.3 + (i % 2) * 0.14, -0.5 + i * 0.4, 1.3, 0x8a7a68);
    print(0.25 + (i % 2) * 0.1, -0.4 + i * 0.34, 0.8, 0x9a8a70, true);
  }
  return g;
}

// a yellow raincoat, dropped on wet steps
export function makeRaincoat() {
  const g = new THREE.Group();
  g.add(flat(0.6, 0.06, 0.42, 0xf2c21a, 0, -1.12, 0, { ry: 0.3 }));
  g.add(flat(0.24, 0.08, 0.22, 0xe8b410, 0.22, -1.08, -0.1, { ry: -0.4 }));
  g.add(flat(0.5, 0.03, 0.12, 0xd8a40a, -0.12, -1.06, 0.2, { ry: 0.9 }));
  return g;
}

// a pigeon on a ledge
export function makePigeon() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), std(0x7a8290));
  body.scale.set(1, 0.8, 1.5);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), std(0x6a7280));
  head.position.set(0, 0.1, 0.13);
  const neck = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), std(0x5a8a7a, { metalness: 0.3 }));
  neck.position.set(0, 0.05, 0.1);
  g.add(body, neck, head);
  return g;
}

// a junior pass in an open drawer
export function makePass() {
  const g = new THREE.Group();
  g.add(flat(0.5, 0.12, 0.36, 0x6a4a30, 0, -0.08, 0));
  g.add(flat(0.09, 0.006, 0.055, 0xf4f4f0, 0, 0, 0, { basic: true }));
  g.add(flat(0.09, 0.007, 0.012, 0xc83a2a, 0, 0.001, -0.018, { basic: true }));
  return g;
}

// a row of coat pegs with brass name tags; one is empty, and the floor under it is wet
export function makeCoatPegs() {
  const g = new THREE.Group();
  g.add(flat(1.2, 0.08, 0.04, 0xc8ccd2, 0, 0, 0, { std: { metalness: 0.7 } }));
  for (let i = 0; i < 4; i++) {
    g.add(flat(0.03, 0.03, 0.12, 0x9aa0a8, -0.45 + i * 0.3, -0.03, 0.06));
    g.add(flat(0.12, 0.04, 0.005, 0xc89a4a, -0.45 + i * 0.3, 0.07, 0.022, { std: { metalness: 0.8 } }));
    if (i !== 2) g.add(flat(0.32, 0.8, 0.12, [0x3a4048, 0x5a3a2a, 0, 0x2a3a5a][i], -0.45 + i * 0.3, -0.45, 0.08));
  }
  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), basic(0x9fb8c8, { transparent: true, opacity: 0.5 }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0.15, -1.58, 0.2);
  g.add(pool);
  return g;
}

// a notebook and a staff badge on a desk
export function makeNotebook() {
  const g = new THREE.Group();
  g.add(flat(0.22, 0.02, 0.3, 0x2a3a5a, -0.12, 0, 0, { ry: 0.2 }));
  g.add(flat(0.07, 0.005, 0.1, 0xeef0f2, 0.16, 0, 0.04, { basic: true }));
  g.add(flat(0.05, 0.006, 0.04, 0x9aa0a8, 0.16, 0.002, 0.02, { basic: true }));
  return g;
}

// an old excavation log on a trestle
export function makeLogbook() {
  const g = new THREE.Group();
  g.add(flat(0.9, 0.05, 0.6, 0x8a6a48, 0, -0.08, 0));
  for (const x of [-0.4, 0.4]) g.add(flat(0.05, 0.95, 0.5, 0x6a5038, x, -0.56, 0));
  g.add(flat(0.36, 0.04, 0.26, 0x4a3020, 0, -0.03, 0, { ry: 0.15 }));
  g.add(flat(0.32, 0.01, 0.22, 0xf0e6cc, 0, 0, 0, { ry: 0.15, basic: true }));
  return g;
}

// a bronze plaque gone green, on a wall
export function makePlaque() {
  const g = new THREE.Group();
  g.add(flat(1.0, 0.6, 0.05, 0x5f8a6a, 0, 0, 0, { std: { metalness: 0.6, roughness: 0.55 } }));
  g.add(flat(0.86, 0.46, 0.01, 0x8ab89a, 0, 0, 0.03, { std: { metalness: 0.5, roughness: 0.6 } }));
  return g;
}
