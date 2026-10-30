// THE LAST VERSION OF EARTH: the processes REVERSE can hold (docs/lastversion/OVERHAUL.md §7.6).
//
// The bible's "Inverted state" is not a year here. It is a local verb: Kai aims at one thing he
// can see that fell, burned, flooded, was assembled, was written or walked, and holds it running
// backwards for a few seconds (inversion.js owns the verb). This module owns the things:
//
//   records      pure data, built with the level (Runtime.buildLevel → placeAuthored), so the
//                unit tests can check every one without a browser:
//                { id, kind, room, label, aim, reach, weight, max, settle, when, rate, back, creak,
//                  parts: [{ rest: { p, q }, origin: { p, q }, box, order }], solid, fact, done,
//                  refuse, line, hints, grain, required, ... }
//   anchors      §5's landmark names → a place in this level. A mission maps each name to a room
//                and a room-relative point (`deck.anchors`), so the open places of U2–U3 can put
//                the same names anywhere (`level.landmarks`, `level.sites`) without touching
//                the missions.
//   controllers  the meshes and the moving colliders, built in the browser by inversion.js.
//                A solid piece is an edition-owned entry in `deckWorld.temps`
//                ({ mesh: an empty Object3D, box, t: Infinity }) whose box is changed in place;
//                the edition adds and removes its own entries, and none can ever expire.
import * as THREE from '../../../vendor/three.module.min.js';
import { mergeGeometries } from '../../../vendor/addons/utils/BufferGeometryUtils.js';

export const MAX_PROCESSES = 12;
export const MAX_PARTS = 10;
export const WEIGHTS = [0.5, 1, 1.5]; // light, medium, heavy: charge spent per second held
export const STAB_COST = { 0.5: 0.03, 1: 0.06, 1.5: 0.1 }; // stability spent at the start
export const REVERSE_COLOR = 0xc9b8ff; // the Witness's reversals use the same colour and sound

// what each kind does when Kai reverses it, and how it goes forward again
//   dur   seconds from rest to origin;  back  seconds from origin to rest;  creak  the pause before it does
export const KINDS = {
  collapse: { weight: 1, settle: 'held', dur: 1.4, back: 1.2, creak: 0.8, grain: 'stone', arc: 0.7 },
  fall: { weight: 1.5, settle: 'held', speed: 2, back: 0.6, creak: 0.6, grain: 'metal', arc: 0.25 },
  flow: { weight: 1, settle: 'held', dur: 1.2, back: 1.5, creak: 0, grain: 'water' },
  burn: { weight: 1, settle: 'held', dur: 1.0, back: 1.2, creak: 0, grain: 'fire', arc: 0.35 },
  lock: { weight: 1, settle: 'settled', dur: 0.9, back: 0, creak: 0, grain: 'metal' },
  ink: { weight: 0.5, settle: 'settled', dur: 1.5, back: 0, creak: 0, grain: 'pen' },
  recording: { weight: 0.5, settle: 'settled', dur: 0.5, back: 0, creak: 0, grain: 'pen' },
  patrol: { weight: 1, settle: 'held', dur: 8, back: 0, creak: 0, grain: 'metal' },
  mechanism: { weight: 1, settle: 'held', dur: 0.4, back: 0.4, creak: 0, grain: 'metal' },
  projectile: { weight: 0.5, settle: 'settled', dur: 1.2, back: 0, creak: 0, grain: 'stone', arc: 2.5 },
  refusal: { weight: 0.5, settle: 'held', dur: 0, back: 0, creak: 0, grain: null },
};

// =============================================================================================
// anchors
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);

// a generated or hand-built room's own frame: x across, z from 0 at its entry wall to -L, y up
// (both builders put the spawn 1.6 m inside the entry, turned by the room's heading)
export function roomFrame(room) {
  const [sx, , sz, th = 0] = room.spawn;
  const c = Math.cos(th), s = Math.sin(th);
  const o = [sx + 1.6 * s, sz + 1.6 * c];
  return { theta: th, p: ([x, y, z]) => [x * c + z * s + o[0], y, -x * s + z * c + o[1]] };
}

// 'story' (the room with the beat), 'before' / 'after' it, 'last', an index, or a room id
export function pickRoom(level, sel = 'story') {
  const order = level.order;
  if (typeof sel === 'number') return order[sel] ?? null;
  const si = order.findIndex((id) => level.rooms[id].beat);
  if (sel === 'story') return si >= 0 ? order[si] : order[0];
  if (sel === 'before') return si > 0 ? order[si - 1] : null;
  if (sel === 'after') return si >= 0 ? order[si + 1] ?? null : null;
  if (sel === 'last') return order[order.length - 1];
  return level.rooms[sel] ? sel : null;
}

// a room's doorway, seen from inside: local +z points into the room
export function doorFrame(room, which = 'exit') {
  const { W = 12, L = 16 } = room;
  if (which === 'entry') return { at: [0, 0, 0], yaw: Math.PI };
  const side = room.exitSide || 'N';
  const zc = -L + 2.1;
  if (side === 'W') return { at: [-W / 2, 0, zc], yaw: Math.PI / 2 };
  if (side === 'E') return { at: [W / 2, 0, zc], yaw: -Math.PI / 2 };
  return { at: [0, 0, -L], yaw: 0 };
}

export function roomAtPoint(level, p) {
  for (const id of level.order) {
    for (const b of level.rooms[id].bounds) if (p[0] >= b[0] && p[0] < b[3] && p[1] >= b[1] && p[1] < b[4] && p[2] >= b[2] && p[2] < b[5]) return id;
  }
  return level.order[0];
}

// a landmark name → { pos, yaw, room } in this level, or null when it is not in this sector
export function resolveAnchor(level, deck, name) {
  const lm = level.landmarks?.[name];
  if (lm) return { pos: [lm[0], lm[1], lm[2]], yaw: lm[3] || 0, room: roomAtPoint(level, lm) };
  const a = deck?.anchors?.[name];
  if (!a || (a.sector ?? level.sector ?? 0) !== (level.sector ?? 0)) return null;
  const rid = pickRoom(level, a.room ?? 'story');
  if (!rid) return null;
  const room = level.rooms[rid];
  const f = roomFrame(room);
  if (a.door) {
    const d = doorFrame(room, a.door);
    return { pos: f.p(d.at), yaw: f.theta + d.yaw, room: rid };
  }
  const at = typeof a.at === 'function' ? a.at(room) : a.at || [0, 0, 0];
  return { pos: f.p(at), yaw: f.theta + (a.yaw || 0), room: rid };
}

// a point in an anchor's frame → the world
export function toWorld(anchor, [x, y, z]) {
  const c = Math.cos(anchor.yaw), s = Math.sin(anchor.yaw);
  return [anchor.pos[0] + x * c + z * s, anchor.pos[1] + y, anchor.pos[2] - x * s + z * c];
}

// a box in an anchor's frame → a world AABB
export function boxWorld(anchor, [x0, y0, z0, x1, y1, z1]) {
  const a = toWorld(anchor, [x0, y0, z0]), b = toWorld(anchor, [x1, y1, z1]);
  const c = toWorld(anchor, [x0, y0, z1]), d = toWorld(anchor, [x1, y0, z0]);
  const xs = [a[0], b[0], c[0], d[0]], zs = [a[2], b[2], c[2], d[2]];
  const r = (v) => Math.round(v * 1e6) / 1e6;
  return [r(Math.min(...xs)), y0 + anchor.pos[1], r(Math.min(...zs)), r(Math.max(...xs)), y1 + anchor.pos[1], r(Math.max(...zs))];
}

function quatOf(yaw, rot = [0, 0, 0]) {
  _q.setFromAxisAngle(_up, yaw);
  _q2.setFromEuler(_e.set(rot[0] || 0, rot[1] || 0, rot[2] || 0, 'XYZ'));
  _q.multiply(_q2);
  return [_q.x, _q.y, _q.z, _q.w].map((v) => Math.round(v * 1e6) / 1e6);
}

// the half extents a shape occupies (cylinders and discs stand on y)
function halfOf(shape, size) {
  const [w = 0.3, h = 0.3, d = w] = size || [];
  if (shape === 'sheet') return [w / 2, 0.01, d / 2];
  return [w / 2, h / 2, d / 2];
}

// a part's AABB in a pose
export function poseBox(p, q, shape, size) {
  const [hx, hy, hz] = halfOf(shape, size);
  _q.set(q[0], q[1], q[2], q[3]);
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    _v.set(sx * hx, sy * hy, sz * hz).applyQuaternion(_q);
    const c = [p[0] + _v.x, p[1] + _v.y, p[2] + _v.z];
    for (let k = 0; k < 3; k++) {
      mn[k] = Math.min(mn[k], c[k]);
      mx[k] = Math.max(mx[k], c[k]);
    }
  }
  return { min: mn, max: mx };
}

// =============================================================================================
// records
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const hash = (s) => [...String(s)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 2147483647, 7) || 1;

// parts a kind can build for itself when the mission does not list them
function defaultParts(def) {
  if (def.kind === 'lock') {
    const names = def.bolts || ['RING', 'BAR', 'STAR', 'CRESCENT'];
    return names.map((name, i) => {
      const x = i % 2 ? 0.34 : -0.34, y = i < 2 ? 1.66 : 1.14;
      return { name, order: i + 1, shape: `bolt:${name.toLowerCase()}`, size: [0.26, 0.26, 0.3], mat: 'steel', at: [x, y, 0.42], rest: { at: [x, y, 0.08] } };
    });
  }
  if (def.kind === 'collapse' && def.span) {
    // a bridge, a stair or a catwalk of n pieces, fallen into a pile below it
    const { from, to, width = 2, pieces = 6, thick = 0.25, floor } = def.span;
    seed = hash(def.id);
    const out = [];
    const dx = (to[0] - from[0]) / pieces, dy = (to[1] - from[1]) / pieces, dz = (to[2] - from[2]) / pieces;
    const len = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const fy = floor ?? Math.min(from[1], to[1]) - 3;
    for (let i = 0; i < pieces; i++) {
      const at = [from[0] + dx * (i + 0.5), from[1] + dy * (i + 0.5) - thick / 2, from[2] + dz * (i + 0.5)];
      const rest = { at: [at[0] + (rnd() - 0.5) * width * 0.8, fy + thick / 2 + (i % 3) * thick * 0.9, at[2] + (rnd() - 0.5) * len], rot: [(rnd() - 0.5) * 0.7, yaw + (rnd() - 0.5) * 1.2, (rnd() - 0.5) * 0.5] };
      out.push({ shape: 'box', size: [width, thick, len * 0.98], mat: def.mat || 'concrete', at, rot: [0, yaw, 0], rest, fall: i, solid: def.solid !== false });
    }
    return out;
  }
  return [];
}

// one part, from the mission's anchor frame to the world
function worldPart(p, anchor, i) {
  const rot = p.rot || [0, 0, 0];
  const origin = { p: toWorld(anchor, p.at || [0, 0, 0]), q: quatOf(anchor.yaw, rot) };
  const rest = p.rest ? { p: toWorld(anchor, p.rest.at || p.at || [0, 0, 0]), q: quatOf(anchor.yaw, p.rest.rot || rot) } : origin;
  const b = poseBox(origin.p, origin.q, p.shape || 'box', p.size);
  return {
    name: p.name || `part${i}`, order: p.order ?? i + 1, fall: p.fall ?? i, shape: p.shape || 'box', size: p.size || [0.3, 0.3, 0.3], mat: p.mat || 'metal',
    solid: !!p.solid, text: p.text, rest, origin, box: [...b.min, ...b.max].map((v) => Math.round(v * 1e4) / 1e4),
  };
}

export function makeRecord(def, anchor, level) {
  const K = KINDS[def.kind] || KINDS.refusal;
  const room = level.rooms[anchor.room];
  const outdoor = !!(level.zone || room?.open);
  const parts = (def.parts || defaultParts(def)).slice(0, MAX_PARTS).map((p, i) => worldPart(p, anchor, i));
  let aim;
  if (def.aim) aim = toWorld(anchor, def.aim);
  else if (parts.length) {
    aim = [0, 0, 0];
    for (const p of parts) for (let k = 0; k < 3; k++) aim[k] += p.origin.p[k] / parts.length;
  } else aim = toWorld(anchor, [0, 1.2, 0]);
  let dur = K.dur;
  if (def.kind === 'fall' && parts.length) {
    const p = parts[0];
    dur = Math.max(0.6, Math.hypot(p.origin.p[0] - p.rest.p[0], p.origin.p[1] - p.rest.p[1], p.origin.p[2] - p.rest.p[2]) / (def.speed || K.speed));
  }
  const weight = def.weight ?? K.weight;
  return {
    id: def.id, kind: def.kind, room: anchor.room, label: def.label || def.id.toUpperCase(), aim: aim.map((v) => Math.round(v * 1e4) / 1e4),
    anchor: { pos: anchor.pos, yaw: anchor.yaw },
    reach: def.reach ?? (outdoor ? 22 : 14), weight, max: def.max ?? (def.kind === 'burn' && parts.some((p) => p.text) ? 12 : 30),
    settle: def.settle || K.settle, when: def.when || null, rate: dur > 0 ? 1 / (def.dur || dur) : 0, back: (def.back ?? K.back) > 0 ? 1 / (def.back ?? K.back) : 0, creak: def.creak ?? K.creak,
    arc: def.arc ?? K.arc ?? 0, parts, solid: parts.some((p) => p.solid), fact: `rev_${def.id}`, done: `inv_${def.id}_done`,
    refuse: def.refuse || null, line: def.line || null, hints: def.hints || null, grain: def.grain || K.grain, required: !!def.required,
    ambient: def.ambient || null, target: def.target || null, layers: def.layers || null, volume: def.volume || null, mode: def.mode || null,
    cycle: def.cycle || null, clip: def.clip || null, spin: def.spin || null, hazard: def.hazard ?? null, tones: def.tones || null, carry: !!def.carry,
    beat: def.beat || null, offBeat: def.offBeat || null, stuck: def.stuck ?? null, lineWho: def.lineWho || null, once: def.once || null, arm: def.arm || null,
  };
}

// what the unit tests hold every record to (an empty list means it is valid)
export function checkRecord(rec, level) {
  const out = [];
  const room = level.rooms[rec.room];
  if (!room) return [`${rec.id}: no room ${rec.room}`];
  const inside = (p) => room.bounds.some((b) => p[0] >= b[0] && p[0] <= b[3] && p[1] >= b[1] && p[1] <= b[4] && p[2] >= b[2] && p[2] <= b[5]);
  if (!KINDS[rec.kind]) out.push(`${rec.id}: kind ${rec.kind}`);
  if (!inside(rec.aim)) out.push(`${rec.id}: aim ${rec.aim} outside ${rec.room}`);
  if (!(rec.reach > 0)) out.push(`${rec.id}: reach ${rec.reach}`);
  if (!WEIGHTS.includes(rec.weight)) out.push(`${rec.id}: weight ${rec.weight}`);
  if (rec.parts.length > MAX_PARTS) out.push(`${rec.id}: ${rec.parts.length} parts`);
  for (const p of rec.parts) {
    const b = p.box;
    if (!room.bounds.some((r) => b[0] >= r[0] - 0.05 && b[1] >= r[1] - 0.05 && b[2] >= r[2] - 0.05 && b[3] <= r[3] + 0.05 && b[4] <= r[4] + 0.05 && b[5] <= r[5] + 0.05)) out.push(`${rec.id}/${p.name}: origin box ${b} outside ${rec.room}`);
  }
  return out;
}

// an empty model for a scene that is read off something already in the world
export const NO_MODEL = () => new THREE.Group();

// =============================================================================================
// placing a mission's authored pieces in a built level (called by Runtime.buildLevel)
//   deck.anchors     landmark name → { sector, room, at | door, yaw }
//   deck.processes   REVERSE processes (at a landmark, or at level.sites[id] once places exist)
//   deck.spots       scenes at landmarks (a tag, an intercom, a file), with optional texts
//   deck.doors       doorways that stay shut until a condition holds
//   deck.reversed    rooms that run backwards on their own (engine.setOverride timeReverse)
//   deck.displays    authored environmental reversals that loop (the twin lock)
//   deck.zones       trigger boxes at landmarks that set facts
export function placeAuthored(deck, level) {
  level.processes = [];
  level.reversedRooms = [];
  level.displays = [];
  level.anchorsAt = {};
  const at = (name) => {
    if (!(name in level.anchorsAt)) level.anchorsAt[name] = resolveAnchor(level, deck, name);
    return level.anchorsAt[name];
  };
  for (const name of Object.keys(deck.anchors || {})) at(name);
  for (const name of Object.keys(level.landmarks || {})) at(name);
  for (const r of deck.reversed || []) {
    if ((r.sector ?? level.sector) !== level.sector) continue;
    const rid = pickRoom(level, r.room);
    if (rid && !level.reversedRooms.includes(rid)) level.reversedRooms.push(rid);
  }
  // (a piece with a `sector` is that quarter's only: the whole place loads for every sector, D2 step 1)
  const here = (d) => d.sector === undefined || d.sector === level.sector;
  for (const d of deck.doors || []) {
    if (!here(d)) continue;
    const a = at(d.at);
    if (!a) continue;
    const w = d.w ?? 1.5;
    level.elements.push({ box: boxWorld(a, [-w, 0, -0.4, w, d.h ?? 4, 0]), mat: d.mat || 'door', solid: true, when: d.when, id: d.id, room: a.room });
  }
  for (const s of deck.spots || []) {
    if (!here(s)) continue;
    const a = at(s.at);
    if (!a) continue;
    const pos = toWorld(a, s.offset || [0, 1.3, 0.2]);
    level.interactables.push({ id: s.id, kind: 'scene', scene: s.scene || s.id, pos, yaw: a.yaw, r: s.r ?? 2.4, prompt: s.prompt, room: a.room, model: spotModel(s.model || 'none', s), when: s.when, color: s.color });
    for (const t of s.texts || []) level.texts.push({ text: t.text, pos: toWorld(a, t.at || [0, 2, 0.05]), rotY: a.yaw, size: t.size || 0.16, color: t.color || '#23303c', when: t.when, room: a.room });
  }
  for (const z of deck.zones || []) {
    if (!here(z)) continue;
    const a = at(z.at);
    if (a) level.triggers.push({ box: boxWorld(a, z.box || [-2, -1, -2, 2, 3, 2]), set: z.set, when: z.when, once: z.once !== false, room: a.room });
  }
  for (const d of deck.displays || []) {
    if (!here(d)) continue;
    const a = at(d.at);
    if (a) level.displays.push({ ...d, pos: a.pos, yaw: a.yaw, room: a.room });
  }
  for (let def of deck.processes || []) {
    if (!here(def)) continue;
    let a;
    const site = level.sites?.[def.id];
    if (site) a = { pos: site.at.slice(0, 3), yaw: site.at[3] || 0, room: roomAtPoint(level, site.at) };
    else if (def.kind === 'patrol') {
      const s = level.sentinels.find((x) => x.id === def.target) || level.sentinels.filter((x) => x.room === pickRoom(level, def.room ?? 'story'))[def.sentinel || 0];
      if (s) a = { pos: [s.path[0][0], 0, s.path[0][1]], yaw: 0, room: s.room };
      if (s) def = { ...def, target: s.id, aim: def.aim || [0, 1.2, 0] };
    } else a = at(def.at);
    if (!a || level.processes.length >= MAX_PROCESSES) continue;
    for (const pr of def.props || []) level.elements.push({ box: boxWorld(a, pr.box), mat: pr.mat || 'prop', solid: pr.solid !== false, room: a.room, when: pr.when });
    const rec = makeRecord(site?.parts ? { ...def, parts: site.parts } : def, a, level);
    level.processes.push(rec);
    if (def.scene) level.interactables.push({ id: `p_${def.id}`, kind: 'scene', scene: def.scene, pos: rec.aim, r: def.r ?? 2.2, prompt: def.prompt || 'READ IT', room: a.room, model: NO_MODEL });
  }
}

// =============================================================================================
// meshes (browser only from here on: inversion.js builds them when a level loads)
const MAT = {
  steel: { color: 0xc8ccd2, metalness: 0.8, roughness: 0.3 },
  metal: { color: 0x8a9098, metalness: 0.7, roughness: 0.45 },
  brass: { color: 0xc89a4a, metalness: 0.8, roughness: 0.35 },
  bronze: { color: 0x9a6a3a, metalness: 0.7, roughness: 0.45 },
  stone: { color: 0x9a948a, roughness: 0.9 },
  concrete: { color: 0xa9a8a2, roughness: 0.92 },
  wood: { color: 0x8a6440, roughness: 0.8 },
  paper: { color: 0xf3efe3, roughness: 0.95 },
  glass: { color: 0xe4f2ff, transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.1, depthWrite: false },
  water: { color: 0x6faed4, transparent: true, opacity: 0.62, roughness: 0.08, depthWrite: false },
  smoke: { color: 0x8f8f98, transparent: true, opacity: 0.6, roughness: 1, depthWrite: false },
  cloth: { color: 0xdfe6ea, roughness: 0.95 },
  black: { color: 0x1a1d22, roughness: 0.6 },
  white: { color: 0xeef2f4, roughness: 0.6 },
  screen: { color: 0x0e1a14, roughness: 0.4, emissive: 0x0c2a1a },
};
const CHAR = new THREE.Color(0x17130f);

function material(key) {
  const m = new THREE.MeshStandardMaterial({ ...(MAT[key] || MAT.metal) });
  m.userData.base = m.color.clone();
  m.userData.baseEmissive = m.emissive.clone();
  return m;
}

function starShape(r1, r2, n = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i <= n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? r2 : r1;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return s;
}

function crescentShape(r) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, Math.PI * 0.25, Math.PI * 1.75, false);
  s.absarc(r * 0.45, 0, r * 0.72, Math.PI * 1.62, Math.PI * 0.38, true);
  return s;
}

// a sheet of paper with writing on it (the charred file, a ledger page)
function paperTexture(lines) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 320;
  const g = c.getContext('2d');
  g.fillStyle = '#f3efe3';
  g.fillRect(0, 0, 256, 320);
  g.strokeStyle = 'rgba(80,110,160,0.25)';
  for (let y = 54; y < 320; y += 22) {
    g.beginPath();
    g.moveTo(14, y);
    g.lineTo(242, y);
    g.stroke();
  }
  g.fillStyle = '#2a3442';
  g.font = 'bold 17px Inter, sans-serif';
  lines.forEach((l, i) => {
    const hand = l.startsWith('~');
    g.font = hand ? 'italic 22px Georgia, serif' : 'bold 15px Inter, sans-serif';
    g.fillStyle = hand ? '#1d3a7a' : '#2a3442';
    g.fillText(hand ? l.slice(1) : l, 16, 40 + i * 30);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// one part's geometry, centred on its origin
function partGeometry(p) {
  const [w = 0.3, h = 0.3, d = w] = p.size;
  const sh = p.shape;
  let geos;
  if (sh.startsWith('bolt:')) {
    // a shaft into the door and a head you can tell apart from the others, facing the room
    const shaft = new THREE.CylinderGeometry(0.035, 0.035, d, 10).rotateX(Math.PI / 2);
    const z = d / 2;
    const kind = sh.slice(5);
    let head;
    if (kind === 'ring') head = new THREE.TorusGeometry(w * 0.34, 0.028, 8, 24).translate(0, 0, z);
    else if (kind === 'bar') head = new THREE.BoxGeometry(w * 0.9, w * 0.24, 0.05).translate(0, 0, z);
    else if (kind === 'star') head = new THREE.ExtrudeGeometry(starShape(w * 0.46, w * 0.2), { depth: 0.05, bevelEnabled: false }).translate(0, 0, z - 0.025);
    else head = new THREE.ExtrudeGeometry(crescentShape(w * 0.42), { depth: 0.05, bevelEnabled: false }).translate(0, 0, z - 0.025);
    const plate = new THREE.CylinderGeometry(w * 0.5, w * 0.5, 0.03, 20).rotateX(Math.PI / 2).translate(0, 0, z - 0.04);
    geos = [shaft, plate, head];
  } else if (sh === 'cyl' || sh === 'disc') geos = [new THREE.CylinderGeometry(w / 2, w / 2, h, sh === 'disc' ? 28 : 16)];
  else if (sh === 'glass') geos = [new THREE.CylinderGeometry(w / 2, w * 0.42, h, 18, 1, true)];
  else if (sh === 'sheet') geos = [new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2)];
  else if (sh === 'shell') geos = [new THREE.CylinderGeometry(w / 2, w / 2, h * 0.7, 12).translate(0, -h * 0.15, 0), new THREE.ConeGeometry(w / 2, h * 0.3, 12).translate(0, h * 0.35, 0)];
  else if (sh === 'gear') {
    geos = [new THREE.TorusGeometry(w * 0.38, w * 0.1, 8, 28).rotateX(Math.PI / 2)];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      geos.push(new THREE.BoxGeometry(w * 0.16, h, w * 0.12).translate(Math.cos(a) * w * 0.48, 0, Math.sin(a) * w * 0.48).rotateY(0));
    }
    geos.push(new THREE.CylinderGeometry(w * 0.1, w * 0.1, h * 1.4, 10));
  } else geos = [new THREE.BoxGeometry(w, h, d)];
  if (geos.length === 1) return geos[0];
  const flat = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  for (const g of flat) if (g.attributes.uv === undefined) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  const m = mergeGeometries(flat.map((g) => {
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    return g;
  }));
  geos.forEach((g) => g.dispose());
  return m;
}

const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (t) => Math.max(0, Math.min(1, t));

// a collider the edition owns in deckWorld.temps: it never expires (t: Infinity), and its box is
// changed in place; the edition removes it itself
export function colliderEntry(box) {
  return { mesh: new THREE.Object3D(), box: { min: [...box.min], max: [...box.max] }, t: Infinity, lvInv: true };
}

// =============================================================================================
// a process in the world: its meshes, its phase, its colliders
//   P = 0 at rest (fallen, burnt, spilled, assembled, written), 1 at its origin (reversed)
export class Process {
  constructor(rec, env) {
    this.rec = rec;
    this.env = env; // { root, deckWorld, player, time() }
    this.group = new THREE.Group();
    this.group.name = `rev_${rec.id}`;
    env.root.add(this.group);
    this.P = 0;
    this.dir = 0; // +1 running backwards (Kai holds it), -1 running forwards again, 0 still
    this.creakT = 0;
    this.settled = false;
    this.mats = [];
    this.entries = [];
    this.glintK = 0;
    this.partP = rec.parts.map(() => 0); // locks move bolt by bolt
    this.partOut = rec.parts.map(() => false);
    this.jamT = -1;
    this.jamPart = -1;
    this.hiddenByWhen = false;
    const fallOrder = rec.parts.map((p, i) => [p.fall, i]).sort((a, b) => b[0] - a[0]).map(([, i]) => i); // the last to fall flies back first
    const n = rec.parts.length;
    const span = n > 1 && rec.kind === 'collapse' ? 0.45 : 1;
    this.windows = rec.parts.map(() => [0, 1]);
    fallOrder.forEach((pi, k) => {
      const a = n > 1 && rec.kind === 'collapse' ? ((1 - span) * k) / (n - 1) : 0;
      this.windows[pi] = [a, a + span];
    });
    this.meshes = rec.parts.map((p) => this.makeMesh(p));
    if (rec.kind === 'flow') this.buildFlow();
    if (rec.kind === 'refusal') this.buildRefusal();
    if (rec.kind === 'ink') this.buildInk();
    if (rec.kind === 'recording') this.buildRecorder();
    if (rec.kind === 'mechanism') this.meshes.forEach((m, i) => m.quaternion.set(...rec.parts[i].origin.q));
    this.merged = null;
    if (['collapse', 'fall', 'burn'].includes(rec.kind) && this.meshes.length > 1) this.buildMerged();
    this.apply();
  }

  makeMesh(p) {
    const m = material(p.mat);
    if (p.text) {
      const tex = paperTexture(p.text);
      if (tex) m.map = tex;
    }
    if (p.shape === 'sheet') m.side = THREE.DoubleSide;
    this.mats.push(m);
    const mesh = new THREE.Mesh(partGeometry(p), m);
    mesh.castShadow = !m.transparent;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    return mesh;
  }

  // at rest every piece is one mesh with one material (one draw call per process): each part's
  // colour rides in its vertices, and a burn's rest is char. (One material, never an array:
  // DeckWorld.dispose reads material.map, which an array has as a function.)
  buildMerged() {
    try {
      const burnt = this.rec.kind === 'burn';
      const geos = this.meshes.map((mesh, i) => {
        const p = this.rec.parts[i];
        const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
        if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
        const c = burnt ? new THREE.Color(1, 1, 1) : mesh.material.userData.base;
        const col = new Float32Array(g.attributes.position.count * 3);
        for (let v = 0; v < col.length; v += 3) col.set([c.r, c.g, c.b], v);
        g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        const mtx = new THREE.Matrix4().compose(new THREE.Vector3(...p.rest.p), new THREE.Quaternion(...p.rest.q), new THREE.Vector3(1, 1, 1));
        return g.applyMatrix4(mtx);
      });
      const merged = mergeGeometries(geos, false);
      geos.forEach((g) => g.dispose());
      if (!merged) return;
      const base = this.meshes[0].material;
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, color: burnt ? CHAR : 0xffffff, roughness: base.roughness, metalness: base.metalness });
      mat.userData.base = mat.color.clone();
      mat.userData.baseEmissive = mat.emissive.clone();
      this.mats.push(mat);
      this.merged = new THREE.Mesh(merged, mat);
      this.merged.castShadow = this.merged.receiveShadow = true;
      this.group.add(this.merged);
    } catch {
      this.merged = null; // separate meshes are fine too
    }
  }

  // a spill: the glass on its table, its water, the puddle it made and the stream between
  buildFlow() {
    const r = this.rec;
    if (r.mode === 'spill' && this.meshes.length >= 3) {
      this.fill = this.meshes[1];
      this.puddle = this.meshes[2];
      const top = r.parts[1].origin.p, bot = r.parts[2].rest.p;
      const h = Math.max(0.2, top[1] - bot[1]);
      const sm = material('water');
      this.mats.push(sm);
      this.stream = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, h, 8), sm);
      this.stream.position.set((top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2, (top[2] + bot[2]) / 2);
      this.group.add(this.stream);
    }
  }

  // something that is not a process: a flatline monitor, a memorial, a memory
  buildRefusal() {
    if (this.rec.refuse !== 'NOT A PROCESS' || !this.rec.parts.length) return;
    const m = this.meshes[0];
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.012), new THREE.MeshBasicMaterial({ color: 0x5fe08a }));
    const sz = this.rec.parts[0].size;
    line.position.set(0, 0, (sz[2] || 0.05) / 2 + 0.002);
    m.add(line);
  }

  // layered writing: each layer a plane, the newest in front
  buildInk() {
    const layers = this.rec.layers || [];
    this.inkPlanes = layers.map((text, i) => {
      const tex = paperTexture([text]);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: i === layers.length - 1 ? 0xffffff : 0xffffff });
      this.mats.push(mat);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), mat);
      const a = this.rec.anchor;
      pl.position.set(...toWorld(a, [0, 1.4, 0.02 + (layers.length - i) * 0.004]));
      pl.rotation.y = a.yaw;
      this.group.add(pl);
      return pl;
    });
    this.removed = 0;
  }

  buildRecorder() {
    if (this.meshes.length) return;
    const mat = material('black');
    this.mats.push(mat);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 14), mat);
    body.position.set(...this.rec.aim);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff6a48 }));
    lamp.position.set(0, 0.13, 0);
    body.add(lamp);
    this.lamp = lamp;
    this.group.add(body);
  }

  // --- the phase ------------------------------------------------------------------------------
  reverse() {
    this.dir = 1;
    this.creakT = 0;
  }

  release() {
    if (this.rec.settle === 'settled' || this.rec.kind === 'refusal') return;
    if (this.P <= 0) {
      this.dir = 0;
      return;
    }
    this.creakT = this.rec.creak || 0;
    this.dir = this.creakT > 0 ? 0 : -1;
  }

  // a lock: only the last-fitted bolt still in backs out; any other turns half back and snaps home
  tryPart(i) {
    const parts = this.rec.parts;
    const inOrder = parts.map((p, k) => [p.order, k]).filter(([, k]) => !this.partOut[k]).sort((a, b) => b[0] - a[0]);
    if (!inOrder.length || this.partOut[i]) return 'none';
    if (inOrder[0][1] === i) {
      this.partOut[i] = 'moving';
      return 'out';
    }
    this.jamPart = i;
    this.jamT = 0;
    return 'jam';
  }

  // restore what a save remembers (settled processes stay where Kai left them)
  restore(flags) {
    const r = this.rec;
    if (r.kind === 'lock') {
      r.parts.forEach((p, i) => {
        if (flags[`${r.done.replace(/_done$/, '')}_${p.name}`]) {
          this.partOut[i] = true;
          this.partP[i] = 1;
        }
      });
      this.settled = this.partOut.every((v) => v === true);
    } else if (r.kind === 'ink') {
      this.removed = flags[`${r.done.replace(/_done$/, '')}_n`] || 0;
      // (one layer: an original record; reversing it un-writes nothing, and once tried it is settled)
      this.settled = (r.layers?.length || 1) === 1 ? !!flags[r.done] : this.removed >= (r.layers?.length || 1) - 1;
    } else if (r.settle === 'settled' && flags[r.done]) {
      this.settled = true;
      this.P = 1;
    }
    this.apply();
  }

  // advance by dt; returns events: 'origin' (reached), 'settledPart' (a bolt is out), 'rest', 'landed'
  step(dt, ctx) {
    const r = this.rec;
    const ev = [];
    if (this.creakT > 0) {
      this.creakT -= dt;
      if (this.creakT <= 0) this.dir = -1;
    }
    if (r.kind === 'lock') {
      r.parts.forEach((p, i) => {
        if (this.partOut[i] === 'moving') {
          this.partP[i] = Math.min(1, this.partP[i] + dt * r.rate);
          if (this.partP[i] >= 1) {
            this.partOut[i] = true;
            ev.push({ type: 'part', i });
            if (this.partOut.every((v) => v === true)) {
              this.settled = true;
              ev.push({ type: 'settled' });
            }
          }
        }
      });
      if (this.jamT >= 0) {
        this.jamT += dt;
        const k = this.jamT < 0.3 ? this.jamT / 0.3 : Math.max(0, 1 - (this.jamT - 0.3) / 0.12);
        this.partP[this.jamPart] = 0.5 * k;
        if (this.jamT > 0.42) {
          this.partP[this.jamPart] = 0;
          this.jamT = -1;
          ev.push({ type: 'clack' });
        }
      }
    } else if (r.kind === 'projectile') {
      this.stepProjectile(dt, ctx, ev);
    } else if (r.kind === 'ink') {
      if (this.dir > 0 && (r.layers?.length || 1) === 1) {
        // an original: the ink trembles and stays; nothing was written over it
        this.P = Math.min(1, this.P + dt * r.rate);
        if (this.P >= 1) {
          this.P = 0;
          this.dir = 0;
          this.settled = true;
          ev.push({ type: 'settled' });
        }
      } else if (this.dir > 0) {
        this.P = Math.min(1, this.P + dt * r.rate);
        if (this.P >= 1) {
          this.removed++;
          this.P = 0;
          this.dir = 0;
          ev.push({ type: 'layer', n: this.removed });
          if (this.removed >= (r.layers?.length || 1) - 1) {
            this.settled = true;
            ev.push({ type: 'settled' });
          }
        }
      }
    } else if (r.kind !== 'patrol' && r.kind !== 'refusal' && r.kind !== 'recording') {
      if (this.dir > 0) {
        const before = this.P;
        this.P = Math.min(this.maxP(ctx), this.P + dt * r.rate);
        if (this.P >= 1 && before < 1) {
          ev.push({ type: 'origin' });
          if (r.settle === 'settled') {
            this.settled = true;
            this.dir = 0;
            ev.push({ type: 'settled' });
          }
        }
      } else if (this.dir < 0) {
        this.P = Math.max(0, this.P - dt * (r.back || 1));
        if (this.P <= 0) {
          this.dir = 0;
          ev.push({ type: 'rest' });
        }
      } else if (r.ambient && !this.settled) {
        // the ward's own rhythm: on for a few seconds in every few, with nobody holding it
        const t = ctx.time % r.ambient.period;
        const want = t < r.ambient.on ? 1 : 0;
        this.P += Math.sign(want - this.P) * Math.min(Math.abs(want - this.P), dt * 2.5);
      }
    }
    if (r.kind === 'mechanism') this.stepMechanism(dt, ctx);
    if (r.kind === 'flow' && r.volume?.hazard && ctx.player) {
      // deep water is a setback (back to the last checkpoint) until it is drained
      const b = this.volumeBox(), p = ctx.player.pos;
      if (this.P < 0.5 && p.x > b[0] && p.x < b[3] && p.z > b[2] && p.z < b[5] && p.y - 0.85 < b[4] - 0.25) ev.push({ type: 'drown' });
    }
    this.apply(ctx, dt);
    return ev;
  }

  // a solid piece never seats into Kai: it hovers short until he steps clear
  maxP(ctx) {
    const r = this.rec;
    if (!r.solid || !ctx?.player || r.kind === 'fall') return 1;
    const p = ctx.player.pos, h = ctx.player.half;
    for (const part of r.parts) {
      if (!part.solid) continue;
      const b = part.box;
      if (p.x + h.x > b[0] && p.x - h.x < b[3] && p.y + h.y > b[1] && p.y - h.y < b[4] && p.z + h.z > b[2] && p.z - h.z < b[5]) {
        const d = Math.hypot(part.origin.p[0] - part.rest.p[0], part.origin.p[1] - part.rest.p[1], part.origin.p[2] - part.rest.p[2]);
        return Math.max(0, 1 - 0.3 / Math.max(0.3, d)) * 0.999;
      }
    }
    return 1;
  }

  volumeBox() {
    const v = this.rec.volume;
    return v?.box ? boxWorld(this.rec.anchor, v.box) : [0, 0, 0, 0, 0, 0];
  }

  stepMechanism(dt, ctx) {
    const sp = this.rec.spin || [0, 1, 0, 2];
    const w = sp[3] * (this.P > 0.5 ? -1 : 1);
    const beat = this.rec.beat;
    if (beat && this.P <= 0.5 && !this.settled && ctx?.time !== undefined) {
      // (a mechanism on a counted beat, M22's clock arm, shows it: it stands for the counts, ticking once at each, then
      // turns a third of a circle in the window that answers REVERSE; the same clock as Inversion's, so what is seen
      // and heard is when it answers. Inversion.step sounds the clicks and the turn's chime)
      const per = beat.period, ph = ctx.time % per, turns = Math.floor(ctx.time / per);
      const turn = (Math.PI * 2) / 3, tick = 0.07;
      const a = turns * (turn + 2 * tick) + (ph < beat.on ? turn * Math.sin((ph / beat.on) * Math.PI * 0.5) : turn + Math.floor(ph) * tick);
      _q.setFromAxisAngle(_v.set(sp[0], sp[1], sp[2]).normalize(), a);
      this.meshes.forEach((m, i) => m.quaternion.set(...this.rec.parts[i].origin.q).multiply(_q));
      return;
    }
    for (const m of this.meshes) {
      m.rotateOnAxis(_v.set(sp[0], sp[1], sp[2]).normalize(), w * dt);
    }
    // a sweeper bound to this mechanism turns the other way while it is held
    if (this.rec.hazard !== null && this.P > 0.5 && ctx.deckWorld) {
      const h = ctx.deckWorld.hazards?.[this.rec.hazard];
      if (h && !(h.stasisT > 0)) h.angle -= 2 * h.hz.speed * dt * (ctx.deckWorld.engine?.hasIn('timeReverse', h.hz.room) ? -1 : 1);
    }
  }

  // a shell on an authored cycle: launched from its origin, landing at rest, again and again
  stepProjectile(dt, ctx, ev) {
    const r = this.rec;
    const cyc = r.cycle || { period: 6, flight: 2 };
    if (this.settled) {
      this.P = 1;
      return;
    }
    if (this.dir > 0) {
      this.P = Math.min(1, this.P + dt * r.rate);
      if (this.P >= 1) {
        this.settled = true;
        this.dir = 0;
        ev.push({ type: 'settled' });
      }
      return;
    }
    const t = ctx.time % cyc.period;
    const f = clamp01(t / cyc.flight);
    const P = 1 - f;
    if (this.lastF !== undefined && this.lastF < 1 && f >= 1) ev.push({ type: 'landed', at: r.parts[0]?.rest.p });
    this.lastF = f;
    this.P = P;
  }

  // the parts where the phase puts them
  apply(ctx, dt = 0) {
    const r = this.rec;
    const idle = this.P <= 0 && this.dir === 0 && this.creakT <= 0 && !(r.ambient && !this.settled);
    if (this.merged) {
      this.merged.visible = idle;
      for (const m of this.meshes) m.visible = !idle;
    }
    if (r.kind === 'ink') return this.applyInk();
    if (r.kind === 'flow' && r.mode === 'spill') return this.applySpill();
    if (r.kind === 'flow') return this.applyVolume();
    const shake = this.creakT > 0 ? Math.sin((ctx?.time || 0) * 60) * 0.012 : 0;
    r.parts.forEach((p, i) => {
      const mesh = this.meshes[i];
      let s;
      if (r.kind === 'lock') s = this.partP[i];
      else {
        const [a, b] = this.windows[i];
        s = clamp01((this.P - a) / Math.max(1e-3, b - a));
      }
      const e = r.kind === 'lock' || r.kind === 'projectile' ? s : smooth(s);
      const op = p.origin.p, rp = p.rest.p;
      if (r.kind === 'mechanism') {
        mesh.position.set(...op); // it turns in place (stepMechanism)
        return;
      }
      const horiz = Math.hypot(op[0] - rp[0], op[2] - rp[2]);
      const lift = r.kind === 'projectile' ? Math.max(1.5, horiz * 0.35) * ((r.arc || 2.5) / 2.5) : (r.arc || 0) * horiz * 0.35;
      mesh.position.set(rp[0] + (op[0] - rp[0]) * e + shake, rp[1] + (op[1] - rp[1]) * e + lift * 4 * e * (1 - e), rp[2] + (op[2] - rp[2]) * e);
      _q.set(...p.rest.q);
      _q2.set(...p.origin.q);
      mesh.quaternion.slerpQuaternions(_q, _q2, e);
      if (r.kind === 'lock') mesh.rotateZ(e * Math.PI * 2); // a bolt turns as it backs out
      if (r.kind === 'burn') {
        const m = mesh.material;
        m.color.copy(CHAR).lerp(m.userData.base, e);
        const ember = e > 0 && e < 1 ? (1 - e) * (0.5 + 0.5 * Math.sin((ctx?.time || 0) * 23 + i)) : 0;
        m.emissive.setRGB(ember * 0.9 + this.glintK * 0.79, ember * 0.3 + this.glintK * 0.72, this.glintK);
      }
      // colliders: a piece is solid once it is seated (or, for a lift car, all the way along)
      if (p.solid) this.syncCollider(i, mesh, r.kind === 'fall' ? true : s >= 0.999, ctx);
    });
  }

  applyInk() {
    const n = this.inkPlanes?.length || 0;
    if (n === 1) {
      // an original record: it shivers while it is tried, and keeps every letter
      const pl = this.inkPlanes[0];
      pl.visible = true;
      pl.material.opacity = 1 - 0.3 * Math.sin(Math.PI * this.P);
      pl.scale.x = 1;
      return;
    }
    this.inkPlanes?.forEach((pl, i) => {
      // layer 0 is the newest; removed layers are gone, the one being reversed un-writes from the right
      if (i < this.removed) pl.visible = false;
      else if (i === this.removed && i < n - 1) {
        pl.visible = true;
        const k = 1 - smooth(this.P);
        pl.material.opacity = 0.35 + 0.65 * k;
        pl.scale.x = Math.max(0.02, k);
      } else {
        pl.visible = true;
        pl.material.opacity = 1;
        pl.scale.x = 1;
      }
    });
  }

  applySpill() {
    const s = smooth(this.P);
    if (this.fill) this.fill.scale.set(1, Math.max(0.02, s), 1);
    if (this.fill) {
      const p = this.rec.parts[1];
      const h = p.size[1];
      this.fill.position.set(p.origin.p[0], p.origin.p[1] - (h * (1 - Math.max(0.02, s))) / 2, p.origin.p[2]);
    }
    if (this.puddle) {
      const k = Math.max(0.02, 1 - s);
      this.puddle.scale.set(k, 1, k);
      this.puddle.position.set(...this.rec.parts[2].rest.p);
    }
    if (this.meshes[0]) {
      this.meshes[0].position.set(...this.rec.parts[0].origin.p);
      this.meshes[0].quaternion.set(...this.rec.parts[0].origin.q);
    }
    if (this.stream) this.stream.visible = this.P > 0.04 && this.P < 0.96;
  }

  applyVolume() {
    const s = smooth(this.P);
    this.rec.parts.forEach((p, i) => {
      const m = this.meshes[i];
      const h = p.size[1];
      const k = Math.max(0.02, 1 - s);
      m.scale.set(1, k, 1);
      m.position.set(p.rest.p[0], p.rest.p[1] - (h * (1 - k)) / 2, p.rest.p[2]);
      m.quaternion.set(...p.rest.q);
      if (this.rec.mode === 'smoke') m.material.opacity = 0.6 * k;
    });
  }

  syncCollider(i, mesh, want, ctx) {
    const dw = this.env.deckWorld;
    let e = this.entries[i];
    if (want) {
      const p = this.rec.parts[i];
      const b = poseBox([mesh.position.x, mesh.position.y, mesh.position.z], [mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w], p.shape, p.size);
      if (!e) {
        e = this.entries[i] = colliderEntry(b);
        dw.temps.push(e);
        dw.refresh();
      } else {
        // a lift car carries Kai: he rises with it (at 2 m/s or less)
        const dy = b.max[1] - e.box.max[1];
        const pl = ctx?.player;
        if (pl && dy > 0 && this.rec.kind === 'fall') {
          const feet = pl.pos.y - pl.half.y;
          if (feet > e.box.max[1] - 0.12 && feet < e.box.max[1] + 0.15 && pl.pos.x > b.min[0] - 0.25 && pl.pos.x < b.max[0] + 0.25 && pl.pos.z > b.min[2] - 0.25 && pl.pos.z < b.max[2] + 0.25) pl.pos.y += dy;
        }
        for (let k = 0; k < 3; k++) {
          e.box.min[k] = b.min[k];
          e.box.max[k] = b.max[k];
        }
      }
    } else if (e) {
      this.entries[i] = null;
      dw.temps = dw.temps.filter((x) => x !== e);
      dw.refresh();
    }
  }

  // the silver glint, the aimed pulse and the reversing shimmer: an emissive tint on the parts
  glint(k) {
    if (Math.abs(k - this.glintK) < 0.01) return;
    this.glintK = k;
    for (const m of this.mats) {
      if (!m.emissive) continue;
      const b = m.userData.baseEmissive;
      m.emissive.setRGB((b?.r || 0) + k * 0.79, (b?.g || 0) + k * 0.72, (b?.b || 0) + k);
    }
  }

  // `when` decides where a process is (its year, a fact). Out of it, it is not stepped (inversion.js), so on the
  // way out nothing of it stays solid (a seated bridge, a lift car) and a release under way finishes at once
  // (its creak and fall would wait for steps that never come). Back in it, the next step seats its colliders again.
  setVisible(v) {
    const was = !this.hiddenByWhen;
    this.group.visible = v;
    this.hiddenByWhen = !v;
    if (was && !v) this.hide();
  }

  hide() {
    if (!this.settled && this.rec.kind !== 'lock' && (this.dir !== 0 || this.creakT > 0)) {
      this.P = 0;
      this.dir = 0;
      this.creakT = 0;
    }
    if (this.entries.some(Boolean)) {
      const dw = this.env.deckWorld;
      dw.temps = dw.temps.filter((x) => !this.entries.includes(x));
      dw.refresh();
    }
    this.entries = [];
  }

  dispose() {
    const dw = this.env.deckWorld;
    if (this.entries.some(Boolean)) {
      dw.temps = dw.temps.filter((x) => !this.entries.includes(x));
      dw.refresh();
    }
    this.entries = [];
    this.group.parent?.remove(this.group);
    this.group.traverse((o) => {
      o.geometry?.dispose?.();
      if (o.material) for (const m of [].concat(o.material)) { m.map?.dispose?.(); m.dispose?.(); }
    });
  }
}

// =============================================================================================
// the twin lock in the reversed ward: the same four bolts, coming apart on a loop, last fitted first
export class LockLoop {
  constructor(d, root) {
    this.d = d;
    this.group = new THREE.Group();
    this.group.position.set(...d.pos);
    this.group.rotation.y = d.yaw;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 0.06), material('metal'));
    plate.position.set(0, d.y ?? 1.5, 0.03);
    this.group.add(plate);
    const names = d.bolts || ['RING', 'BAR', 'STAR', 'CRESCENT'];
    this.bolts = names.map((name, i) => {
      const p = { shape: `bolt:${name.toLowerCase()}`, size: [0.22, 0.22, 0.26] };
      const m = new THREE.Mesh(partGeometry(p), material('steel'));
      const x = i % 2 ? 0.28 : -0.28, y = (d.y ?? 1.5) + (i < 2 ? 0.24 : -0.22);
      m.position.set(x, y, 0.12);
      m.userData.home = [x, y];
      this.group.add(m);
      return { name, order: i + 1, m };
    });
    root.add(this.group);
    this.last = -1;
  }

  // 12 s: last fitted backs out first (1-4 s), a pause, then they fit back in order (7-10 s)
  step(t) {
    const T = t % (this.d.period || 12);
    const n = this.bolts.length;
    let started = -1;
    this.bolts.forEach((b, i) => {
      const outAt = 1 + (n - b.order) * 1.0, inAt = 7 + (b.order - 1) * 1.0;
      let k;
      if (T < outAt) k = 0;
      else if (T < outAt + 0.6) k = (T - outAt) / 0.6;
      else if (T < inAt) k = 1;
      else if (T < inAt + 0.6) k = 1 - (T - inAt) / 0.6;
      else k = 0;
      b.m.position.z = 0.12 + 0.3 * k;
      b.m.rotation.z = k * Math.PI * 2;
      if (T >= outAt && T < outAt + 0.6) started = i;
    });
    const ev = started >= 0 && started !== this.last ? this.bolts[started].name : null;
    this.last = started;
    return ev;
  }

  dispose() {
    this.group.parent?.remove(this.group);
    this.group.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  }
}

// models for scenes at landmarks
export function spotModel(kind) {
  if (kind === 'none') return NO_MODEL;
  return () => {
    const g = new THREE.Group();
    if (kind === 'tag') {
      const tag = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.012), new THREE.MeshStandardMaterial({ color: 0xf2ead6, roughness: 0.9 }));
      const hole = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.006, 6, 12), new THREE.MeshStandardMaterial({ color: 0xb08a3a, metalness: 0.7 }));
      hole.position.set(-0.13, 0.06, 0.008);
      g.add(tag, hole);
    } else if (kind === 'intercom') {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.44, 0.05), new THREE.MeshStandardMaterial({ color: 0xe8eef0, roughness: 0.5 }));
      const grille = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 20).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.7 }));
      grille.position.set(0, 0.06, 0.03);
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.018, 12), new THREE.MeshBasicMaterial({ color: 0x5fd39a }));
      lamp.position.set(0, -0.13, 0.03);
      g.add(plate, grille, lamp);
    }
    return g;
  };
}
