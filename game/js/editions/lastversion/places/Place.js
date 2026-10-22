// THE LAST VERSION OF EARTH: the place builder (OVERHAUL.md §4.3, D10).
//
// One parametric builder turns a place spec (specs/<key>.js) into a level in the shared format
// (gen/LevelGen.js's, which world/DeckWorld.js runs), plus what §3.1 adds: the place's landmarks,
// quarters, years, crowd paths, REVERSE sites and its scenery.
//
// Everything here is pure data (no THREE, no DOM), so the unit tests build every place:
//   colliders  level.elements: invisible boxes (DeckWorld keeps their collision only); a piece that
//              exists only in some years or after some fact is a `ghost` (DeckWorld makes it a
//              conditional element; the edition takes its mesh away after the build)
//   visuals    level.vis: pieces Scenery.js merges per material, per era and per condition
//              { k: 'box'|'obox'|'cyl'|'cone'|'gable'|'hip'|'dome'|'torus'|'plane'|'disc'|'sphere',
//                m: material, e: [years] (all when absent), when: fact condition, t: tint, p: prop }
//   vegetation level.veg: { k: kind, x, y, z, s, r, e, when } instanced by Scenery.js
// The pipeline: ground → the spec's layout (terrain, roads, landmarks, plots, fill, set pieces,
// era props, vegetation) → edges and the invisible ring → the mission's own rooms or overlay →
// quarters and checkpoints → the beat of this sector at its landmark → fragments → watchers →
// the exit and its gate → challenges → years → the level.
import { SKIES, year, hourBucket } from './years.js';
import { STYLES } from './styles.js';
import { notchBearing } from './atlas.js';

export const ERAS = ['PRESENT', 'PAST', 'FUTURE'];
const R = (v) => Math.round(v * 1000) / 1000;
const rbox = (b) => b.map(R);

// a seeded generator per place, so a place is the same every time it is built
export function rng(seed) {
  let s = [...String(seed)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 2166136261) || 1;
  const next = () => ((s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296);
  return {
    next, float: (a, b) => a + (b - a) * next(), int: (a, b) => Math.floor(a + (b - a + 1) * next()),
    pick: (arr) => arr[Math.floor(next() * arr.length)], chance: (p) => next() < p,
  };
}

// a condition for the years a piece exists in
export function eraCond(e) {
  if (!e) return null;
  const list = [].concat(e);
  if (list.length >= 3) return null;
  return list.map((s) => `@${s}`).join(' || ');
}

export class Place {
  constructor(spec, { key, rid, deck, si = 0, seed }) {
    this.spec = spec;
    this.key = key;
    this.rid = rid;
    this.deck = deck;
    this.si = si;
    this.style = STYLES[spec.style] || {};
    this.rng = rng(seed || key);
    this.cols = [];
    this.vis = [];
    this.veg = [];
    this.texts = [];
    this.inter = [];
    this.npcs = [];
    this.triggers = [];
    this.glows = [];
    this.sentinels = [];
    this.hazards = [];
    this.items = [];
    this.checkpoints = [];
    this.challenges = [];
    this.blocks = [];
    this.landmarks = {};
    this.sites = {};
    this.crowd = [];
    this.terrain = []; // [x0, z0, x1, z1, y] rects, the highest wins
    this.keep = []; // rects kept clear of fill
    this.rooms = {}; // extra rooms (hand-built interiors)
    this.order = [];
    this.eraStack = [null];
    this.whenStack = [null];
    this.state = { states: deck?.states || ERAS };
    this.extraYears = {};
  }

  // --- context: which years, which facts ------------------------------------------------------
  get era() {
    return this.eraStack[this.eraStack.length - 1];
  }

  get fact() {
    return this.whenStack[this.whenStack.length - 1];
  }

  // E(era, fn): everything fn builds exists only in those years (colliders `@ERA`, visuals in the era group)
  E(era, fn) {
    this.eraStack.push(era ? [].concat(era) : null);
    try {
      fn();
    } finally {
      this.eraStack.pop();
    }
  }

  // W(cond, fn): everything fn builds exists only while a fact condition holds
  W(cond, fn) {
    this.whenStack.push(cond || null);
    try {
      fn();
    } finally {
      this.whenStack.pop();
    }
  }

  has(state) {
    return this.state.states.includes(state);
  }

  condOf(o = {}) {
    const e = o.e !== undefined ? o.e : this.era;
    const w = o.w !== undefined ? o.w : this.fact;
    const parts = [eraCond(e), w].filter(Boolean);
    if (!parts.length) return null;
    return parts.length === 1 ? parts[0] : parts.map((p) => `(${p})`).join(' && ');
  }

  // --- primitives ---------------------------------------------------------------------------------
  // a collider only (invisible)
  col(b, o = {}) {
    const when = o.when ?? this.condOf(o);
    const el = { box: rbox(b), mat: o.mat || 'wall', solid: o.solid !== false, room: o.room || this.rid, place: true };
    if (when) {
      el.when = when;
      el.ghost = true; // DeckWorld builds a mesh for a conditional element; the edition takes it away
    } else el.invisible = true;
    if (o.id) el.id = o.id;
    if (o.echo) el.echoLike = true;
    this.cols.push(el);
    return el;
  }

  // a visual piece
  v(piece, o = {}) {
    const e = o.e !== undefined ? o.e : this.era;
    const w = o.w !== undefined ? o.w : this.fact;
    const p = { ...piece };
    if (e) p.e = [].concat(e);
    if (w) p.when = w; // (a fact condition; `w` is a piece's width)
    if (o.t ?? piece.t) p.t = o.t ?? piece.t;
    if (o.prop) p.p = 1;
    if (o.noShadow) p.ns = 1;
    this.vis.push(p);
    return p;
  }

  // a solid, visible axis-aligned box
  box(b, m, o = {}) {
    const [x0, y0, z0, x1, y1, z1] = b;
    const bb = [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1), Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)];
    if (o.solid !== false) this.col(bb, o);
    if (o.vis !== false) this.v({ k: 'box', b: rbox(bb), m }, o);
    return bb;
  }

  // a visual box only
  vbox(b, m, o = {}) {
    return this.box(b, m, { ...o, solid: false });
  }

  // a box turned about y around its centre (x, z), base at y: visual, and its AABB as a collider if solid
  obox(x, y, z, w, h, d, ry, m, o = {}) {
    this.v({ k: 'obox', x: R(x), y: R(y), z: R(z), w, h, d, ry: R(ry || 0), rx: o.rx || 0, rz: o.rz || 0, m }, o);
    if (o.solid) {
      const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry));
      const hx = (w * c + d * s) / 2, hz = (w * s + d * c) / 2;
      this.col([x - hx * (o.shrink ?? 1), y, z - hz * (o.shrink ?? 1), x + hx * (o.shrink ?? 1), y + h, z + hz * (o.shrink ?? 1)], o);
    }
  }

  cyl(x, y, z, r, h, m, o = {}) {
    this.v({ k: 'cyl', x: R(x), y: R(y), z: R(z), r, r2: o.r2 ?? r, h, seg: o.seg || 12, m, open: o.open ? 1 : 0, rx: o.rx || 0, rz: o.rz || 0, ry: o.ry || 0 }, o);
    if (o.solid) this.col([x - r * 0.75, y, z - r * 0.75, x + r * 0.75, y + h, z + r * 0.75], o);
  }

  cone(x, y, z, r, h, m, o = {}) {
    this.cyl(x, y, z, r, h, m, { ...o, r2: 0 });
  }

  // a pitched roof: span w across, length d along its ridge (local z), ridge height h, turned ry
  gable(x, y, z, w, d, h, ry, m, o = {}) {
    this.v({ k: 'gable', x: R(x), y: R(y), z: R(z), w, d, h, ry: R(ry || 0), m }, o);
  }

  hip(x, y, z, w, d, h, ry, m, o = {}) {
    this.v({ k: 'hip', x: R(x), y: R(y), z: R(z), w, d, h, ry: R(ry || 0), top: o.top ?? 0, m }, o);
  }

  dome(x, y, z, r, h, m, o = {}) {
    this.v({ k: 'dome', x: R(x), y: R(y), z: R(z), r, h: h ?? r, m, seg: o.seg || 20 }, o);
  }

  // a ring standing or lying: radius R, tube r; rx tilts it (π/2 lies flat), arc in radians
  torus(x, y, z, Rr, r, m, o = {}) {
    this.v({ k: 'torus', x: R(x), y: R(y), z: R(z), R: Rr, r, rx: o.rx ?? 0, ry: o.ry ?? 0, rz: o.rz ?? 0, arc: o.arc ?? Math.PI * 2, seg: o.seg || 48, m }, o);
  }

  // a flat surface at y (water, a lawn, a painted plaza)
  plane(x0, z0, x1, z1, y, m, o = {}) {
    this.v({ k: 'plane', b: [R(Math.min(x0, x1)), R(y), R(Math.min(z0, z1)), R(Math.max(x0, x1)), R(y), R(Math.max(z0, z1))], m }, o);
  }

  // a flat sector of a ring at y: radii r0 .. r, from bearing a0 to a1 (radians from +x toward +z)
  fan(x, y, z, r0, r, a0, a1, m, o = {}) {
    this.v({ k: 'fan', x: R(x), y: R(y), z: R(z), r0, r, a0: R(a0), a1: R(a1), seg: o.seg || 24, m }, o);
  }

  disc(x, y, z, r, m, o = {}) {
    this.v({ k: 'disc', x: R(x), y: R(y), z: R(z), r, seg: o.seg || 32, m }, o);
  }

  sphere(x, y, z, r, m, o = {}) {
    this.v({ k: 'sphere', x: R(x), y: R(y), z: R(z), r, sy: o.sy || 1, m }, o);
  }

  // vegetation: kind, position, scale, turn
  tree(k, x, z, s = 1, o = {}) {
    const y = o.y ?? this.heightAt(x, z);
    const t = { k, x: R(x), y: R(y), z: R(z), s: R(s), r: R(o.r ?? this.rng.float(0, Math.PI * 2)) };
    const e = o.e !== undefined ? o.e : this.era;
    const w = o.w !== undefined ? o.w : this.fact;
    if (e) t.e = [].concat(e);
    if (w) t.when = w;
    this.veg.push(t);
    if (o.solid !== false && ['cypress', 'olive', 'plane', 'linden', 'birch', 'palm'].includes(k)) this.col([x - 0.35 * s, y, z - 0.35 * s, x + 0.35 * s, y + 3 * s, z + 0.35 * s], { e, w });
    return t;
  }

  // a sign or label (level.texts): ancient places use carved glyphs instead (archetypes.glyphs)
  text(str, pos, rotY = 0, o = {}) {
    const when = o.when ?? this.condOf(o);
    const t = { text: str, pos: pos.map(R), rotY, size: o.size || 0.4, color: o.color || '#e8e4dc', room: o.room || this.rid };
    if (when) t.when = when;
    if (o.echo) t.echo = true;
    this.texts.push(t);
    return t;
  }

  glow(x, y, z, r, color, h) {
    this.glows.push(h ? [R(x), R(y), R(z), r, color, h] : [R(x), R(y), R(z), r, color]);
  }

  // a landmark (§3.1): [x, y, z, yaw]; yaw is where it faces
  land(name, x, y, z, yaw = 0) {
    this.landmarks[name] = [R(x), R(y ?? this.heightAt(x, z)), R(z), R(yaw)];
    return this.landmarks[name];
  }

  at(name) {
    const l = this.landmarks[name];
    if (!l) throw new Error(`${this.key}: no landmark ${name}`);
    return l;
  }

  // ground height (the highest terrace under a point)
  setTerrain(x0, z0, x1, z1, y) {
    this.terrain.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1), y]);
  }

  heightAt(x, z) {
    let y = 0, found = false;
    for (const [x0, z0, x1, z1, h] of this.terrain) {
      if (x >= x0 && x <= x1 && z >= z0 && z <= z1 && (!found || h > y)) {
        y = h;
        found = true;
      }
    }
    return y;
  }

  // a rect kept clear of fill
  reserve(x0, z0, x1, z1, m = 0) {
    this.keep.push([Math.min(x0, x1) - m, Math.min(z0, z1) - m, Math.max(x0, x1) + m, Math.max(z0, z1) + m]);
  }

  isFree(x0, z0, x1, z1) {
    return !this.keep.some((r) => x0 < r[2] && x1 > r[0] && z0 < r[3] && z1 > r[1]);
  }

  // a REVERSE site (U3+): where a named process's geometry stands
  site(id, at, parts) {
    this.sites[id] = { at: at.map(R), ...(parts ? { parts } : {}) };
  }

  // deep water: below y in this box (while the condition holds) the current takes Kai back to the checkpoint
  drown(rect, y, when) {
    (this.drowns ||= []).push({ box: [rect[0], -12, rect[1], rect[2], y, rect[3]], when: when || this.condOf({}) || null, room: this.rid });
  }

  // an interior room inside the place (a ward, a hall, a cell block): its own bounds, spawn, lights and
  // years, for what needs a room of its own: a ward that runs backwards (engine.setOverride), a hall
  // REVERSE works in, a stair of floors. The walls, floors and roofs are the spec's own pieces.
  //   rect [x0, z0, x1, z1]; y0 its floor; h its height; spawn [x, y, z, yaw] (yaw: where Kai faces);
  //   open: true for a roofless court or colonnade (REVERSE reaches as far as outdoors)
  room(id, rect, o = {}) {
    const [x0, z0, x1, z1] = [Math.min(rect[0], rect[2]), Math.min(rect[1], rect[3]), Math.max(rect[0], rect[2]), Math.max(rect[1], rect[3])];
    const y0 = o.y0 ?? 0, h = o.h ?? 5;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const room = {
      name: o.name || id.toUpperCase(), kind: o.kind || 'room', bounds: [[R(x0), R(y0 - 0.6), R(z0), R(x1), R(y0 + h), R(z1)]],
      spawn: (o.spawn || [cx, y0 + 0.86, cz, 0]).map(R), lights: o.lights || [[R(cx), R(y0 + h - 0.6), R(cz), o.light ?? 0xfff4e8, 1.6, Math.max(x1 - x0, z1 - z0)]],
      tint: 0xffffff, killY: y0 - 3, floatY: y0 + 1.3, challenges: [], route: [], exitSide: 'N', L: z1 - z0, W: x1 - x0, H: h,
      states: o.states || this.state.states, interior: !o.open, open: !!o.open, sky: o.sky ?? (o.open ? 'year' : null), rect: [x0, z0, x1, z1].map(R),
    };
    if (o.beat) room.beat = o.beat;
    this.rooms[id] = room;
    this.order.push(id);
    return room;
  }

  challenge(key, rect, answer, hints, o = {}) {
    this.challenges.push({ key, answer: [].concat(answer), hints, box: [rect[0], -12, rect[1], rect[2], 30, rect[3]], room: o.room || this.rid, optional: !!o.optional });
  }
}

// --- the beat of a sector, at its landmark (D2 step 1) ------------------------------------------------
// The beats are today's (arrival, log, contradiction, encounter, scene, choice, tasks, custom); each
// stands at a landmark and uses the place's own kit (a telling-stone, a ledger on a lectern, a
// bronze plate, a field-order board) instead of Station Zero's terminals.
export function stageBeat(P, story, deck, si, beat, rid) {
  const name = beat.at || P.spec.beatAt?.[deck.mkey]?.[si];
  if (!name || beat.kind === 'custom' || beat.kind === 'tasks') return null;
  const [x, y, z, yaw] = P.at(name);
  const kit = P.style.kits || {};
  const fwd = (d) => [x + Math.sin(yaw) * d, z + Math.cos(yaw) * d];
  if (beat.kind === 'arrival' || beat.kind === 'log') {
    const it = { id: `log_${rid}`, kind: 'terminal', pos: [x, y + 1.15, z], yaw, r: 2.8, prompt: beat.prompt || kit.recordPrompt || 'READ THE RECORD', log: beat.log, room: rid, kit: beat.kit || kit.record || 'lectern' };
    P.inter.push(it);
    P.col([x - 0.5, y, z - 0.5, x + 0.5, y + 1.0, z + 0.5]);
    return it;
  }
  if (beat.kind === 'contradiction') {
    const it = { id: `plaque_${rid}`, kind: 'plaque', pos: [x, y + 1.6, z], r: 3.6, prompt: beat.prompt || kit.residuePrompt || 'READ THE INSCRIPTION', beat, room: rid, kit: beat.kit || kit.residue || 'stele' };
    P.inter.push(it);
    P.col([x - 1.2, y, z - 0.4, x + 1.2, y + 2.6, z + 0.4]);
    // written words only in years that write in letters; ancient years carry carved glyphs (the kit)
    const anc = P.spec.ancientYears || [];
    const [tx, tz] = fwd(0.45);
    if (!deck.states.filter((s) => s !== 'PAST').some((s) => anc.includes(s))) P.text(beat.official, [tx, y + 2.9, tz], yaw, { size: 0.3, color: '#f4e6d0', when: '!@PAST', e: null, w: null });
    if (!anc.includes('PAST')) P.text(beat.echo, [tx, y + 2.9, tz], yaw, { size: 0.3, color: '#9ff4ff', echo: true, e: null, w: null });
    return it;
  }
  if (beat.kind === 'encounter') {
    const c = story.cast[beat.crew ?? deck.crew];
    const n = { id: `npc_${rid}`, crew: c.id, pos: [x, y, z], yaw, hologram: !!beat.hologram || !c.alive, lines: beat.lines, choices: beat.choices, after: beat.after, room: rid };
    if (beat.junoAfter) n.junoAfter = beat.junoAfter;
    P.npcs.push(n);
    return n;
  }
  if (beat.kind === 'scene' || beat.kind === 'choice') {
    const it = { id: `${beat.kind}_${rid}`, kind: 'scene', scene: beat.scene, pos: [x, y + 1.3, z], yaw, r: 2.8, prompt: beat.prompt || 'EXAMINE', color: 0xffc04a, room: rid, kit: beat.kit || kit.scene || null };
    P.inter.push(it);
    if (beat.npc) {
      const [nx, nz] = [x + Math.cos(yaw) * 2.2, z - Math.sin(yaw) * 2.2];
      P.npcs.push({ id: `npc_${rid}`, crew: beat.npc, pos: [nx, P.heightAt(nx, nz), nz], yaw: yaw + 0.4, hologram: !!beat.hologram, lines: beat.lines || [], choices: beat.choices, after: beat.after, when: beat.npcWhen, room: rid });
    }
    return it;
  }
  return null;
}

// --- the level ---------------------------------------------------------------------------------------
export function assemble(P, { story, deck, si, beat, years, name, extraRooms = [], palette }) {
  const spec = P.spec;
  const [bx0, bz0, bx1, bz1] = spec.bounds;
  const rid = P.rid;
  const quarters = quartersOf(spec, deck).map((q, i) => ({ name: q.name, area: q.area, ...(q.cp ? { cp: q.cp } : {}), spawn: P.quarterSpawns?.[i] || q.spawn, threshold: q.threshold || null }));
  const qi = spec.sectors?.[deck.mkey]?.[si] ?? Math.min(si, Math.max(0, quarters.length - 1));
  const q = quarters[qi];
  const spawn = P.spawn || (q ? [q.spawn[0], q.spawn[1] + 0.86, q.spawn[2], q.spawn[3] || 0] : [0, 0.86, 0, 0]);
  const room = {
    name: name || q?.name || spec.name || P.key.toUpperCase(), kind: 'district', beat: beat?.kind || 'custom',
    bounds: [[bx0, -12, bz0, bx1, 30, bz1]], spawn, lights: spec.lights || [], tint: 0xffffff, killY: spec.killY ?? -3, floatY: 8,
    challenges: P.challenges.filter((c) => c.room === rid).map((c) => ({ key: c.key, answer: c.answer, hints: c.hints, box: c.box, optional: c.optional })),
    route: [], exitSide: 'N', L: bz1 - bz0, W: bx1 - bx0, H: 30, open: true, outdoor: true, states: deck.states,
  };
  const rooms = { ...P.rooms, [rid]: room };
  // a place whose interiors are rooms of its own (spec.outdoorFirst: the hospital's wards) starts in the place
  // itself: the outdoor room comes first, its bounds the place's box with every interior cut out of it, so a
  // point inside an interior is that room's whatever the order (and the sector's spawn is the quarter's)
  let order;
  if (spec.outdoorFirst && P.order.length) {
    let boxes = [room.bounds[0]];
    for (const id of P.order) for (const h of P.rooms[id].bounds) boxes = boxes.flatMap((b) => cut(b, h));
    room.bounds = boxes.map((b) => b.map(R));
    order = [rid, ...P.order, ...extraRooms];
  } else order = [...P.order, ...extraRooms, rid];
  const level = {
    id: `${deck.mkey}_${P.key}_s${si}`, deck: story.decks.indexOf(deck), sector: si, seed: story.seed, deckName: deck.name,
    palette, rooms, order,
    elements: P.cols, texts: P.texts, interactables: P.inter, items: P.items, tokens: [], hazards: P.hazards, sentinels: P.sentinels, npcs: P.npcs,
    checkpoints: P.checkpoints, triggers: P.triggers,
    map: { rooms: [{ id: rid, rect: [bx0, bz0, bx1, bz1], name: room.name, kind: 'district' }, ...Object.entries(P.rooms).map(([id, r]) => ({ id, rect: r.rect, name: r.name, kind: 'room' }))], corridors: [], blocks: P.blocks.slice(0, 220), gate: P.exitAt ? [P.exitAt[0], P.exitAt[2]] : undefined },
    trees: [], rocks: [], glows: P.glows, effects: ['echoSolid'],
    exit: P.exit, states: deck.states, unstable: !!deck.unstable, spawn: order[0] === rid ? spawn : rooms[order[0]].spawn, estimateMin: deck.minutes?.main || 25,
    // §3.1
    // the crowd paths U4's crowds walk: the place's own (or the mission's, for Helix's wings), and any the build added
    place: P.key, landmarks: P.landmarks, quarters, years, crowd: [...(spec.variants?.[deck.mkey]?.crowd || spec.crowd || []), ...P.crowd], sites: P.sites, vis: P.vis, veg: P.veg, style: spec.style,
    sameAs: spec.sameAs || null, backdrop: spec.backdrop || {}, skyFeatures: spec.skyFeatures?.[deck.mkey] || spec.skyFeatures?.all || [],
    bounds: spec.bounds, outdoorRoom: rid, drowns: P.drowns || [],
    turntables: P.turntables || [], // (places/turntables.js: gangways that turn and bridge, Mission 7)
  };
  return level;
}

// a box with another box cut out of it: up to six boxes around the hole
function cut(B, H) {
  if (H[0] >= B[3] || H[3] <= B[0] || H[1] >= B[4] || H[4] <= B[1] || H[2] >= B[5] || H[5] <= B[2]) return [B];
  const out = [];
  let [x0, y0, z0, x1, y1, z1] = B;
  if (H[0] > x0) { out.push([x0, y0, z0, H[0], y1, z1]); x0 = H[0]; }
  if (H[3] < x1) { out.push([H[3], y0, z0, x1, y1, z1]); x1 = H[3]; }
  if (H[2] > z0) { out.push([x0, y0, z0, x1, y1, H[2]]); z0 = H[2]; }
  if (H[5] < z1) { out.push([x0, y0, H[5], x1, y1, z1]); z1 = H[5]; }
  if (H[1] > y0) out.push([x0, y0, z0, x1, H[1], z1]);
  if (H[4] < y1) out.push([x0, H[4], z0, x1, y1, z1]);
  return out;
}

// deep water (level.drowns, each with its condition compiled as `cond`): is a point (Kai's centre, or a
// checkpoint's spawn, which is a centre too) under water that runs in this context ({ fact, state })?
export function underWater(drowns, pt, c) {
  for (const d of drowns) {
    const b = d.box;
    if (pt[0] < b[0] || pt[0] > b[3] || pt[2] < b[2] || pt[2] > b[5] || pt[1] > b[4]) continue;
    if (d.cond && !d.cond(c)) continue;
    return true;
  }
  return false;
}

// a place's quarters as a mission sees them (Helix: each wing's missions have their own)
export function quartersOf(spec, deck) {
  return spec.variants?.[deck?.mkey]?.quarters || spec.quarters || [];
}

// the years a mission sees in a place, with defaults filled in
export function yearsFor(spec, deck) {
  const src = { ...(spec.years || {}), ...(spec.variants?.[deck.mkey]?.years || {}) };
  const out = {};
  for (const s of deck.states) {
    if (!src[s]) continue;
    const y = year(src[s]);
    // a sun that rises in the Notch takes the Notch's true bearing from this place (M3, M7)
    if (y.sun?.az === 'notch') y.sun = { ...y.sun, az: Math.round(notchBearing(spec.key) * 10) / 10 };
    out[s] = y;
  }
  return out;
}

// the uniqueness signature (§4.8): [style, default sky preset, hour bucket, weather, primary landmark]
export function signature(spec, deck) {
  const ys = yearsFor(spec, deck);
  const d = ys.PRESENT || Object.values(ys)[0] || {};
  const primary = spec.variants?.[deck.mkey]?.primary || spec.primary;
  return [spec.style, d.sky, hourBucket(d.hour ?? 12), d.weather || 'clear', primary].join('|');
}

export { SKIES };
