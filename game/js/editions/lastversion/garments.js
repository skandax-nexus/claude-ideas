// THE LAST VERSION OF EARTH: clothes made for a body (the settlement's people, three thousand years ago).
//
// Rocketbox dresses everyone in today's clothes. The settlement's people wear woven wool and linen over them: a long
// tunic's skirt, a mantle on the shoulders or a cloak down the back, a sash across the chest, a belt. Each piece is built
// once per model and outfit from the body it covers (its rings follow the body's own outline in the bind pose, a little
// out from it, falling free below the knee) and is skinned to that body's skeleton by weight transfer: each vertex takes
// the bone weights of the nearest vertices of the body under it, so it moves with the hips, legs and shoulders it hangs
// from. One geometry per model and outfit, one draw call per person (the pieces are merged; their dyes are vertex colours
// over one woven map), shared and kept for the session.
//
// A variant's `garb` (wardrobe.js):
//   skirt:  { dye, hem: m above the floor (0.07), top: 'waist' | 'hips', flare (1.3), stripe: dye, ease }
//   mantle: { dye, front: m below the shoulders at the front (0.24), back: m at the back (0.36), reach: m down the
//             arms (0.2), stripe: dye }                          a short mantle over both shoulders and the tops of the arms
//   cloak:  { dye, hem: m above the floor (0.22), open: half-angle of the opening at the front (0.75 rad), stripe }
//   sash:   { dye, side: 'L' | 'R' (the shoulder it hangs from), w: m (0.09) }
//   belt:   { dye, w: m (0.05) }
//   bodice: { dye, top: m below the shoulders (0.07) }   the tunic's body from under the arms to the waist, over today's
//             clothes (a jacket's front, a blouse's buttons), joining the skirt
//   apron:  { dye, hem: m above the floor (0.42), wide: half-angle round the front (1.1 rad) }   a cook's apron
//   (a cloak `fit` to the body, hemmed at the knee and open at the front, is a lab coat)
// dyes: 0xRRGGBB or '#rrggbb' (sRGB).
import * as THREE from '../../../vendor/three.module.min.js';
import { makeActor, actorLoaded } from '../../world/Actors.js';

export const PIECES = ['skirt', 'mantle', 'cloak', 'sash', 'belt', 'bodice', 'apron'];
const lerp = (a, b, t) => a + (b - a) * t;
const col = (c) => new THREE.Color(c);

// ---------------------------------------------------------------------------------------------------------------------
// A body in its bind pose, once per model. (The converted models' bind space is the FBX's, z up: the frame here is the
// model's own, y up and facing +z, the one its mesh's parents turn it into.)
const INFO = new Map();
function bodyInfo(model, mesh, root) {
  if (INFO.has(model)) return INFO.get(model);
  root.updateMatrixWorld(true);
  const parent = new THREE.Matrix4().copy(root.matrixWorld).invert().multiply(mesh.matrixWorld);
  const toModel = parent.clone().multiply(mesh.bindMatrix);
  const g = mesh.geometry;
  const pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const n = pos.count;
  const q = new Float32Array(n * 3);
  const v = new THREE.Vector3();
  let floor = Infinity, top = -Infinity;
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(toModel);
    q[i * 3] = v.x; q[i * 3 + 1] = v.y; q[i * 3 + 2] = v.z;
    floor = Math.min(floor, v.y);
    top = Math.max(top, v.y);
  }
  const names = mesh.skeleton.bones.map((b) => b.name);
  const dom = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    let best = 0;
    for (let k = 1; k < 4; k++) if (sw.getComponent(i, k) > sw.getComponent(i, best)) best = k;
    dom[i] = si.getComponent(i, best);
  }
  // each bone's place in the bind pose
  const at = {};
  const m = new THREE.Matrix4();
  mesh.skeleton.boneInverses.forEach((bi, i) => { at[names[i]] = new THREE.Vector3().setFromMatrixPosition(m.copy(bi).invert()).applyMatrix4(parent); });
  const skinI = new Uint16Array(n * 4), skinW = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) for (let c = 0; c < 4; c++) { skinI[i * 4 + c] = si.getComponent(i, c); skinW[i * 4 + c] = sw.getComponent(i, c); }
  const info = { q, n, dom, names, at, floor, top, si: skinI, sw: skinW, fromModel: toModel.clone().invert(), sets: new Map() };
  INFO.set(model, info);
  return info;
}

// the body's vertices whose main bone matches, with a grid over them for nearest-vertex queries
const CELL = 0.06;
const cellKey = (i, j, k) => ((i + 512) * 1024 + (j + 512)) * 1024 + (k + 512);
function subset(info, re) {
  if (info.sets.has(re.source)) return info.sets.get(re.source);
  const idx = [];
  const grid = new Map();
  for (let i = 0; i < info.n; i++) {
    if (!re.test(info.names[info.dom[i]])) continue;
    idx.push(i);
    const k = cellKey(Math.floor(info.q[i * 3] / CELL), Math.floor(info.q[i * 3 + 1] / CELL), Math.floor(info.q[i * 3 + 2] / CELL));
    let l = grid.get(k);
    if (!l) grid.set(k, (l = []));
    l.push(i);
  }
  const s = { idx, grid };
  info.sets.set(re.source, s);
  return s;
}
const SETS = {
  legs: /^Bip01_(Pelvis|Spine|[LR]_(Thigh|Calf|Foot|Toe0))$/,
  hips: /^Bip01_(Pelvis|Spine1?|Spine2|[LR]_(Thigh|Calf|Foot|Toe0))$/,
  torso: /^Bip01_(Spine1?|Spine2|Neck|[LR]_Clavicle)$/,
  shoulders: /^Bip01_([LR]_(Clavicle|UpperArm)|Spine2|Neck)$/,
  back: /^Bip01_(Pelvis|Spine1?|Spine2|Neck|[LR]_(Clavicle|Thigh|Calf))$/,
};

// the k nearest vertices of a subset to a point, searching out shell by shell of cells (kept in _nd/_nv, nearest first)
const KMAX = 16;
const _nd = new Float64Array(KMAX), _nv = new Int32Array(KMAX);
function nearest(info, s, x, y, z, k) {
  const q = info.q;
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL), cz = Math.floor(z / CELL);
  let n = 0;
  for (let r = 0; r < 16; r++) {
    for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) {
      const edge = Math.abs(i) === r || Math.abs(j) === r;
      for (let l = -r; l <= r; l += edge ? 1 : 2 * r || 1) {
        const list = s.grid.get(cellKey(cx + i, cy + j, cz + l));
        if (!list) continue;
        for (let t = 0; t < list.length; t++) {
          const v = list[t];
          const dx = q[v * 3] - x, dy = q[v * 3 + 1] - y, dz = q[v * 3 + 2] - z;
          const d = dx * dx + dy * dy + dz * dz;
          if (n === k && d >= _nd[k - 1]) continue;
          let p = n < k ? n++ : k - 1;
          while (p > 0 && _nd[p - 1] > d) { _nd[p] = _nd[p - 1]; _nv[p] = _nv[p - 1]; p--; }
          _nd[p] = d; _nv[p] = v;
        }
      }
    }
    // (anything in a cell further out is at least r cells away)
    if (n === k && Math.sqrt(_nd[k - 1]) <= r * CELL) break;
  }
  return n;
}
// a garment vertex's skin: a blend of the bone weights of its nearest body vertices (by inverse square distance) in
// each of the subsets it is given ([[subset, share], ...]), and an optional share given straight to one bone
const _acc = new Float64Array(256), _part = new Float64Array(256);
function transfer(info, mix, x, y, z, k, extra = null) {
  const touched = [];
  for (const [s, share] of mix) {
    if (share <= 0) continue;
    const n = nearest(info, s, x, y, z, k);
    let tot = 0;
    const local = [];
    for (let t = 0; t < n; t++) {
      const v = _nv[t], w = 1 / (_nd[t] + 1e-4);
      for (let c = 0; c < 4; c++) {
        const bw = info.sw[v * 4 + c];
        if (bw <= 0) continue;
        const b = info.si[v * 4 + c];
        if (!_part[b]) local.push(b);
        _part[b] += w * bw;
        tot += w * bw;
      }
    }
    for (const b of local) {
      if (!_acc[b]) touched.push(b);
      _acc[b] += (share * _part[b]) / (tot || 1);
      _part[b] = 0;
    }
  }
  if (extra && extra[0] >= 0 && extra[1] > 0) {
    for (const b of touched) _acc[b] *= 1 - extra[1];
    if (!_acc[extra[0]]) touched.push(extra[0]);
    _acc[extra[0]] += extra[1];
  }
  touched.sort((a, b) => _acc[b] - _acc[a]);
  const ji = [0, 0, 0, 0], wi = [0, 0, 0, 0];
  let sum = 0;
  for (let c = 0; c < 4 && c < touched.length; c++) sum += _acc[touched[c]];
  for (let c = 0; c < 4 && c < touched.length; c++) { ji[c] = touched[c]; wi[c] = _acc[touched[c]] / (sum || 1); }
  for (const b of touched) _acc[b] = 0;
  return [ji, wi];
}

// a subset's extents at a height: left, right, front and back of a centre
function outline(info, s, y, band, cx, cz) {
  let l = 0, r = 0, f = 0, b = 0, n = 0;
  for (const i of s.idx) {
    if (Math.abs(info.q[i * 3 + 1] - y) > band) continue;
    const dx = info.q[i * 3] - cx, dz = info.q[i * 3 + 2] - cz;
    if (dx > l) l = dx; // (l: the body's left, +x)
    if (-dx > r) r = -dx;
    if (dz > f) f = dz;
    if (-dz > b) b = -dz;
    n++;
  }
  return n ? { l, r, f, b } : null;
}
const grow = (R, prev) => (prev ? { ...R, l: Math.max(R.l, prev.l), r: Math.max(R.r, prev.r), f: Math.max(R.f, prev.f), b: Math.max(R.b, prev.b) } : R);

// A band of rings round the body. rings: [{ y, l, r, f, b }] from the top down (extents about cx, cz); the lowest ring's
// height may depend on the angle (low(a)); an opening at the front (open: half-angle); pleats; the dye, and a stripe of
// its own colour along the lower edge (a hard edge: the stripe's top ring is doubled). a = 0 is the front (+z), a = pi/2
// the body's left (+x). skin(a, x, y, z) gives a vertex's [joints, weights].
function band(out, { piece, rings, cx, cz, segs = 28, open = 0, turn = 0, pleats = 0, pleat = 0, stripe = false, stripeW = 0.04, low = null, skin }) {
  const c0 = PIECES.indexOf(piece) * 2, c1 = stripe ? c0 + 1 : null;
  const nR = rings.length;
  const yLast = rings[nR - 1].y;
  const yLow = (a) => (low ? low(a) : yLast);
  // the stripe: a doubled ring stripeW above the lower edge
  const plan = rings.map((R, i) => ({ R, t: i / (nR - 1), c: c0 }));
  if (c1 != null) {
    const last = plan.pop();
    const s = { R: last.R, edge: stripeW, t: 1 };
    plan.push({ ...s, c: c0 }, { ...s, c: c1, dup: true }, { ...last, c: c1, edge: 0 });
  }
  const a0 = open, a1 = Math.PI * 2 - open;
  const cols = open ? segs + 1 : segs;
  const base = out.pos.length / 3;
  for (const P of plan) {
    const R = P.R;
    for (let j = 0; j < cols; j++) {
      const a = a0 + ((a1 - a0) * j) / segs + turn; // (turned half round, an opening at the front is one at the back)
      const sx = Math.sin(a), czz = Math.cos(a);
      const ex = sx >= 0 ? R.l : R.r, ez = czz >= 0 ? R.f : R.b;
      const fold = pleats ? 1 + pleat * P.t * Math.sin(a * pleats) : 1;
      const x = cx + sx * ex * fold, z = cz + czz * ez * fold;
      const y = P.edge != null ? yLow(a) + P.edge : R.y + (yLow(a) - yLast) * P.t;
      out.pos.push(x, y, z);
      out.uv.push((a / (Math.PI * 2)) * 6, -y * 4);
      out.paint.push(P.c);
      const [ji, wi] = skin(a, x, y, z);
      out.ji.push(...ji);
      out.wi.push(...wi);
    }
  }
  for (let ri = 0; ri < plan.length - 1; ri++) {
    if (plan[ri + 1].dup) continue; // (no faces between a ring and its double)
    for (let j = 0; j < segs; j++) {
      const j1 = open ? j + 1 : (j + 1) % segs;
      const a = base + ri * cols + j, b = base + ri * cols + j1, c = base + (ri + 1) * cols + j, d = base + (ri + 1) * cols + j1;
      out.idx.push(a, c, b, b, c, d);
    }
  }
}

// --- the pieces ---------------------------------------------------------------------------------------------------------
function build(info, garb) {
  const out = { pos: [], uv: [], paint: [], ji: [], wi: [], idx: [] };
  const at = info.at;
  const pelvis = at.Bip01_Pelvis, spine2 = at.Bip01_Spine2 || pelvis, neck = at.Bip01_Neck || spine2;
  const shL = at.Bip01_L_UpperArm, shR = at.Bip01_R_UpperArm;
  const cx = pelvis.x, cz = pelvis.z;
  const S = (k) => subset(info, SETS[k]);
  const bone = (n) => info.names.indexOf(n);
  const yWaist = lerp(pelvis.y, spine2.y, 0.32);
  const yArm = (shL.y + shR.y) / 2;
  // the shoulders' and upper arms' reach out from the centre at a height (the bind pose's arms slope down), no further
  // down an arm than `reach` from its shoulder joint
  const armReach = (y, bandH, reach) => {
    let l = 0, r = 0;
    for (const i of S('shoulders').idx) {
      const vy = info.q[i * 3 + 1];
      if (Math.abs(vy - y) > bandH) continue;
      const x = info.q[i * 3], z = info.q[i * 3 + 2];
      const j = x > cx ? shL : shR;
      if (Math.hypot(x - j.x, vy - j.y, z - j.z) > reach) continue;
      if (x - cx > l) l = x - cx;
      if (cx - x > r) r = cx - x;
    }
    return { l, r };
  };
  let skirt = null; // its rings: a cloak, a mantle and a belt go outside it
  const skirtAt = (y) => {
    if (!skirt) return null;
    if (y > skirt[0].y) return null;
    for (let k = 0; k < skirt.length - 1; k++) {
      const A = skirt[k], B = skirt[k + 1];
      if (y <= A.y && y >= B.y) {
        const t = (A.y - y) / Math.max(1e-4, A.y - B.y);
        return { l: lerp(A.l, B.l, t), r: lerp(A.r, B.r, t), f: lerp(A.f, B.f, t), b: lerp(A.b, B.b, t) };
      }
    }
    return skirt[skirt.length - 1];
  };
  const outside = (R, y, e) => {
    const s = skirtAt(y);
    return s ? { ...R, l: Math.max(R.l, s.l + e), r: Math.max(R.r, s.r + e), f: Math.max(R.f, s.f + e), b: Math.max(R.b, s.b + e) } : R;
  };

  if (garb.skirt) {
    // a tunic's skirt from the waist to the ankles: round the hips, then falling straight past the legs, wider at the hem
    const s = garb.skirt;
    const top = s.top === 'hips' ? lerp(pelvis.y, spine2.y, 0.12) : yWaist;
    const hem = info.floor + (s.hem ?? 0.07);
    const ease = s.ease ?? 0.022;
    const rings = [];
    let prev = null;
    const N = 13;
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1);
      const y = lerp(top, hem, Math.pow(t, 0.85));
      const o = outline(info, k < 3 ? S('hips') : S('legs'), y, 0.03, cx, cz) || prev;
      const fl = k ? 1 + ((s.flare ?? 1.3) - 1) * t * t : 1;
      let R = grow({ y, l: (o.l + ease) * fl, r: (o.r + ease) * fl, f: (o.f + ease) * fl, b: (o.b + ease) * fl }, prev);
      // a skirt is round: no side much nearer than the furthest
      const m = Math.max(R.l, R.r, R.f, R.b);
      R = { y, l: Math.max(R.l, m * 0.82), r: Math.max(R.r, m * 0.82), f: Math.max(R.f, m * 0.72), b: Math.max(R.b, m * 0.72) };
      rings.push(R);
      prev = R;
    }
    skirt = rings;
    // (the hips carry a share of the hem, so it does not split into two trouser legs as they stride)
    const pel = bone('Bip01_Pelvis');
    band(out, { piece: 'skirt', rings, cx, cz, segs: 32, pleats: 9, pleat: 0.07, stripe: !!s.stripe, stripeW: s.stripeW ?? 0.05,
      skin: (a, x, y, z) => transfer(info, [[S('hips'), 1]], x, y, z, 14, [pel, Math.min(0.5, Math.max(0, (top - y) / (top - hem)) * 0.5)]) });
  }

  if (garb.apron) {
    // a cook's apron: the front of a skirt from the waist to below the knee, over today's trousers
    const s = garb.apron;
    const top = yWaist + 0.02, hem = info.floor + (s.hem ?? 0.42);
    const rings = [];
    let prev = null;
    const N = 8;
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1);
      const y = lerp(top, hem, t);
      const o = outline(info, k < 2 ? S('hips') : S('legs'), y, 0.03, cx, cz) || prev;
      const e = 0.03 + 0.03 * t;
      const R = outside(grow({ y, l: o.l + e, r: o.r + e, f: o.f + e, b: o.b + e }, prev), y, 0.012);
      rings.push(R);
      prev = R;
    }
    const pel = bone('Bip01_Pelvis');
    band(out, { piece: 'apron', rings, cx, cz, segs: 14, open: Math.PI - (s.wide ?? 1.1), turn: Math.PI,
      skin: (a, x, y, z) => transfer(info, [[S('hips'), 1]], x, y, z, 14, [pel, Math.min(0.5, Math.max(0, (top - y) / (top - hem)) * 0.5)]) });
  }

  if (garb.bodice) {
    // the tunic's body: round the chest from under the arms down to the waist, where the skirt (or the belt) takes over
    const s = garb.bodice;
    const yTop = yArm - (s.top ?? 0.07), yBot = (skirt ? skirt[0].y : yWaist) - 0.015;
    const rings = [];
    const N = 7;
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1);
      const y = lerp(yTop, yBot, t);
      const o = outline(info, y > lerp(pelvis.y, spine2.y, 0.5) ? S('torso') : S('hips'), y, 0.025, cx, cz) || rings[k - 1];
      const e = 0.017;
      rings.push({ y, l: o.l + e, r: o.r + e, f: o.f + e, b: o.b + e });
    }
    if (skirt) rings[N - 1] = { ...rings[N - 1], l: Math.max(rings[N - 1].l, skirt[0].l), r: Math.max(rings[N - 1].r, skirt[0].r), f: Math.max(rings[N - 1].f, skirt[0].f), b: Math.max(rings[N - 1].b, skirt[0].b) };
    band(out, { piece: 'bodice', rings, cx, cz, segs: 30, skin: (a, x, y, z) => transfer(info, [[S('torso'), 1]], x, y, z, 10) });
  }

  if (garb.cloak) {
    // a long cloak from the shoulders down the back, open at the front, outside the skirt
    const s = garb.cloak;
    const yTop = lerp(spine2.y, neck.y, 0.75);
    const hem = info.floor + (s.hem ?? 0.22);
    const rings = [];
    let prev = null;
    const N = 14;
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1);
      const y = lerp(yTop, hem, t);
      const o = outline(info, y > pelvis.y ? S('torso') : S('legs'), y, 0.035, cx, cz) || prev;
      // (a coat fitted to the body, `fit`, is cut close, under the arms; a cloak hangs from the shoulders' points)
      const arm = !s.fit && y > yArm - 0.1 ? armReach(y, 0.035, 0.12) : { l: 0, r: 0 };
      const e = s.fit ? (y > pelvis.y + 0.05 ? 0.02 : 0.05) : 0.03; // (a coat's skirts clear the legs)
      let R = { y, l: Math.max(o.l, arm.l) + e, r: Math.max(o.r, arm.r) + e, f: o.f + e, b: o.b + e + (s.fit ? 0 : 0.015) };
      R = outside(R, y, 0.015);
      if (prev && y < yArm) R = { ...grow(R, prev), f: R.f };
      rings.push(R);
      prev = R;
    }
    const pel = bone('Bip01_Pelvis');
    band(out, { piece: 'cloak', rings, cx, cz, segs: 30, open: s.open ?? 0.75, pleats: 6, pleat: 0.05, stripe: !!s.stripe, stripeW: 0.05,
      // (a fitted coat's skirts go with the legs, as a tunic's skirt does; a cloak's hang from the hips)
      skin: (a, x, y, z) => (s.fit && y < pelvis.y
        ? transfer(info, [[S('hips'), 1]], x, y, z, 14, [pel, Math.min(0.3, ((pelvis.y - y) / (pelvis.y - hem)) * 0.3)])
        : transfer(info, [[S('back'), 1]], x, y, z, 14, y < pelvis.y ? [pel, Math.min(0.6, ((pelvis.y - y) / (pelvis.y - hem)) * 0.6)] : null)) });
  }

  if (garb.mantle) {
    // a short mantle: round the base of the neck, over the shoulders and down over the tops of the arms (its sides go
    // where the arms go; its front and back stay with the chest), lower at the back than at the front
    const s = garb.mantle;
    const yTop = lerp(spine2.y, neck.y, 0.82);
    const front = s.front ?? 0.24, back = s.back ?? 0.36, reach = s.reach ?? 0.2;
    const yFront = yArm - front, yBack = yArm - back;
    const rings = [];
    let prev = null;
    const N = 10;
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1);
      const y = lerp(yTop, yFront, t);
      const o = outline(info, S('torso'), y, 0.03, cx, cz) || prev;
      const arm = armReach(y, 0.03, reach);
      const e = 0.02 + 0.016 * t;
      let R = { y, l: Math.max(o.l, arm.l) + e, r: Math.max(o.r, arm.r) + e, f: o.f + e, b: o.b + e + 0.015 * t };
      R = grow(outside(R, y, 0.012), prev);
      rings.push(R);
      prev = R;
    }
    band(out, { piece: 'mantle', rings, cx, cz, segs: 36, pleats: 7, pleat: 0.045, stripe: !!s.stripe, stripeW: 0.035,
      // (lower at the back, and in a shallow point at the front: a mantle's corners hang)
      low: (a) => lerp(yFront, yBack, (1 - Math.cos(a)) / 2) - (s.point ?? 0.07) * Math.pow(Math.max(0, Math.cos(a)), 6),
      // (the sides with the arms, the front and back with the chest: a mantle taking the arms' weights all round folded
      // its front through itself as they came down)
      skin: (a, x, y, z) => { const side = Math.pow(Math.abs(Math.sin(a)), 2); return transfer(info, [[S('shoulders'), side], [S('torso'), 1 - side]], x, y, z, 10); } });
  }

  if (garb.sash) {
    // a sash from one shoulder across the chest and back to the other hip
    const s = garb.sash;
    const sgn = s.side === 'R' ? -1 : 1;
    const w = s.w ?? 0.09;
    const yHi = yArm + 0.02, yLo = lerp(pelvis.y, spine2.y, 0.2);
    const mid = (yHi + yLo) / 2, amp = (yHi - yLo) / 2;
    const segs = 32;
    const base = out.pos.length / 3;
    for (const dv of [w / 2, -w / 2]) {
      for (let j = 0; j < segs; j++) {
        const a = (j / segs) * Math.PI * 2;
        const yc = mid + amp * Math.sin(a) * sgn + dv;
        const o = outline(info, S('torso'), yc, 0.03, cx, cz) || outline(info, S('hips'), yc, 0.03, cx, cz) || { l: 0.15, r: 0.15, f: 0.12, b: 0.12 };
        const arm = armReach(yc, 0.03, 0.08);
        const sk = skirtAt(yc);
        const e = 0.02;
        const L = Math.max(o.l, arm.l, sk ? sk.l : 0) + e, Rr = Math.max(o.r, arm.r, sk ? sk.r : 0) + e;
        const F = Math.max(o.f, sk ? sk.f : 0) + e, B = Math.max(o.b, sk ? sk.b : 0) + e;
        const sx = Math.sin(a), czz = Math.cos(a);
        const x = cx + sx * (sx >= 0 ? L : Rr), z = cz + czz * (czz >= 0 ? F : B);
        out.pos.push(x, yc, z);
        out.uv.push(j / 4, dv * 8);
        out.paint.push(PIECES.indexOf('sash') * 2);
        const [ji, wi] = transfer(info, [[S('shoulders'), 0.4], [S('torso'), 0.6]], x, yc, z, 10);
        out.ji.push(...ji);
        out.wi.push(...wi);
      }
    }
    for (let j = 0; j < segs; j++) {
      const j1 = (j + 1) % segs;
      out.idx.push(base + j, base + segs + j, base + j1, base + j1, base + segs + j, base + segs + j1);
    }
  }

  if (garb.belt) {
    const s = garb.belt;
    const y0 = (skirt ? skirt[0].y : yWaist) + 0.004, w = s.w ?? 0.05;
    const o = skirt ? skirt[0] : outline(info, S('hips'), y0, 0.03, cx, cz);
    const e = 0.009;
    const rings = [0, 0.5, 1].map((t) => ({ y: y0 + w / 2 - w * t, l: o.l + e, r: o.r + e, f: o.f + e, b: o.b + e }));
    band(out, { piece: 'belt', rings, cx, cz, segs: 28, skin: (a, x, y, z) => transfer(info, [[S('hips'), 1]], x, y, z, 12) });
  }

  // into the mesh's own space
  const p = new Float32Array(out.pos);
  const v = new THREE.Vector3();
  for (let i = 0; i < p.length; i += 3) {
    v.set(p[i], p[i + 1], p[i + 2]).applyMatrix4(info.fromModel);
    p[i] = v.x; p[i + 1] = v.y; p[i + 2] = v.z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(out.uv, 2));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(out.ji, 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(out.wi, 4));
  g.setIndex(out.idx);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return { g, paint: Uint8Array.from(out.paint) };
}

// an outfit's shape (what the geometry depends on: no dyes) and its colours, a vertex colour per piece and stripe
const shapeOf = (garb) => JSON.stringify(PIECES.filter((k) => garb[k]).map((k) => {
  const { dye, stripe, ...rest } = garb[k];
  return [k, { ...rest, stripe: !!stripe }];
}));
function dyed(base, garb) {
  const n = base.paint.length;
  const c = new Float32Array(n * 3);
  const cols = PIECES.map((k) => [garb[k] && col(garb[k].dye ?? 0x888888), garb[k]?.stripe != null && col(garb[k].stripe)]);
  for (let i = 0; i < n; i++) {
    const p = base.paint[i];
    const cc = cols[p >> 1][p & 1] || cols[p >> 1][0];
    c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b;
  }
  const g = new THREE.BufferGeometry();
  for (const [k, a] of Object.entries(base.g.attributes)) g.setAttribute(k, a);
  g.setIndex(base.g.index);
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  g.boundingSphere = base.g.boundingSphere;
  g.userData.keep = true; // (shared by everyone of this model in this outfit: DeckWorld leaves it)
  return g;
}

// --- the cloth ----------------------------------------------------------------------------------------------------------
// the woven map: a plain weave of slubbed yarn, undyed (the dye is the vertex colour)
let WOOL = null;
function woolMap() {
  if (WOOL) return WOOL;
  const N = 128;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  const img = g.createImageData(N, N);
  let s = 7;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const rowJ = Array.from({ length: N }, () => rnd() * 0.1), colJ = Array.from({ length: N }, () => rnd() * 0.1);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const over = ((x >> 2) + (y >> 2)) & 1;
    const ph = over ? (x % 4) / 3 : (y % 4) / 3;
    const v = 0.84 + 0.16 * Math.sin(ph * Math.PI) - (over ? colJ[x] : rowJ[y]) - rnd() * 0.05;
    const i = (y * N + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.round(Math.max(0, Math.min(1, v)) * 255);
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  WOOL = new THREE.CanvasTexture(c);
  WOOL.wrapS = WOOL.wrapT = THREE.RepeatWrapping;
  WOOL.colorSpace = THREE.SRGBColorSpace;
  WOOL.anisotropy = 4;
  WOOL.userData.keep = true;
  return WOOL;
}
let CLOTH = null;
const HOLO = new Map();
function clothMat(holo, glow) {
  if (holo) {
    const k = glow || 0x8fe0ff;
    if (!HOLO.has(k)) {
      // (as world/Actors.js lights a hologram)
      const m = new THREE.MeshStandardMaterial({ color: k, emissive: k, emissiveIntensity: 0.55, transparent: true, opacity: 0.55, depthWrite: false, roughness: 0.3, side: THREE.DoubleSide });
      m.userData.keep = true;
      HOLO.set(k, m);
    }
    return HOLO.get(k);
  }
  if (!CLOTH) {
    CLOTH = new THREE.MeshStandardMaterial({ map: woolMap(), vertexColors: true, roughness: 0.95, metalness: 0, side: THREE.DoubleSide, envMapIntensity: 0.45 });
    CLOTH.name = 'garment';
    CLOTH.userData.keep = true;
  }
  return CLOTH;
}

const GEO = new Map(), SHAPES = new Map();
// Put an outfit on a person (an actor of the given model): its pieces as one skinned mesh beside the body's, posed by
// the same skeleton. A person who fades (a flickering echo) fades their clothes with them.
export function clothe(actor, model, garb, { hologram = false, glow = null } = {}) {
  if (!garb || !PIECES.some((k) => garb[k])) return null;
  const body = partsOf(actor).body;
  if (!body) return null;
  const shape = `${model}|${shapeOf(garb)}`;
  let base = SHAPES.get(shape);
  if (!base) {
    base = build(bodyInfo(model, body, actor.userData.model || actor), garb);
    SHAPES.set(shape, base);
  }
  const key = `${model}|${JSON.stringify(garb)}`;
  let geo = GEO.get(key);
  if (!geo) {
    geo = dyed(base, garb);
    GEO.set(key, geo);
  }
  const m = new THREE.SkinnedMesh(geo, clothMat(hologram, glow));
  m.name = 'garment';
  m.bind(body.skeleton, body.bindMatrix);
  m.position.copy(body.position);
  m.quaternion.copy(body.quaternion);
  m.scale.copy(body.scale);
  m.frustumCulled = false; // (skinned bounds do not follow the animation)
  m.castShadow = !hologram;
  m.receiveShadow = !hologram;
  body.parent.add(m);
  const U = actor.userData;
  U.garment = m;
  const fade = U.setOpacity;
  if (fade) {
    let own = null;
    U.setOpacity = (a) => {
      fade(a);
      if (!own) { own = m.material.clone(); m.material = own; }
      own.transparent = hologram || a < 1;
      own.opacity = (hologram ? 0.55 : 1) * a;
      own.depthWrite = !own.transparent;
    };
  }
  return m;
}
export const garmentStats = () => ({ shapes: SHAPES.size, geometries: GEO.size, bodies: INFO.size });

// Another person's hair on this one: the hair cards of a loaded model (src), moved from its head to this one's (centred
// on the head, its crown on this head's crown, scaled to this head's width) and skinned to the head bone alone. A girl of
// the settlement wears a woman's tied-back hair on the one child's body Rocketbox has without a head cloth. One geometry
// per pair, kept; the source's hair material, shared.
const HAIR = new Map(), HOLO_HAIR = new Map();
// a person's primitives by part: by their materials' names, or (a hologram's materials are its light, unnamed) by the
// converted models' order: the body first, then the head (tools/rocketbox-to-glb.mjs keeps Rocketbox's material order)
function partsOf(a) {
  const root = a.userData.model || a;
  root.updateMatrixWorld(true);
  const out = { root };
  const all = [];
  a.traverse((o) => { if (o.isSkinnedMesh && o.name !== 'garment' && o.name !== 'hairdo') { all.push(o); const n = [].concat(o.material)[0]?.name; if (n) out[n] = o; } });
  if (!out.body && all.length >= 2) { out.body = all[0]; out.head = all[1]; }
  return out;
}
function boxOf(m, root) {
  const T = new THREE.Matrix4().copy(root.matrixWorld).invert().multiply(m.matrixWorld).multiply(m.bindMatrix);
  const b = new THREE.Box3(), v = new THREE.Vector3(), p = m.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) b.expandByPoint(v.fromBufferAttribute(p, i).applyMatrix4(T));
  return { b, T };
}
export function hairdo(actor, model, src, { scale = 1, lift = 0, back = 0, hologram = false, glow = null } = {}) {
  if (!actorLoaded(src)) return null;
  const P = partsOf(actor);
  if (!P.head || !P.body) return null;
  const key = `${src}>${model}|${scale}|${lift}|${back}`;
  let H = HAIR.get(key);
  if (!H) {
    const s = makeActor({ model: src });
    if (s.userData.spec?.model !== src) return null;
    const S = partsOf(s);
    if (!S.hair || !S.head) return null;
    const sh = boxOf(S.head, S.root), dh = boxOf(P.head, P.root), hb = boxOf(S.hair, S.root);
    const sw = sh.b.max.x - sh.b.min.x, dw = dh.b.max.x - dh.b.min.x;
    const k = (dw / sw) * scale;
    const sc = sh.b.getCenter(new THREE.Vector3()), dc = dh.b.getCenter(new THREE.Vector3());
    const toDst = new THREE.Matrix4().copy(P.root.matrixWorld).invert().multiply(P.body.matrixWorld).multiply(P.body.bindMatrix).invert();
    const g0 = S.hair.geometry, pos = g0.attributes.position;
    const p = new Float32Array(pos.count * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(hb.T); // (the source's model frame)
      v.set((v.x - sc.x) * k + dc.x, (v.y - sh.b.max.y) * k + dh.b.max.y + lift, (v.z - sc.z) * k + dc.z - back).applyMatrix4(toDst);
      p[i * 3] = v.x; p[i * 3 + 1] = v.y; p[i * 3 + 2] = v.z;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    for (const a of ['normal', 'uv']) if (g0.attributes[a]) g.setAttribute(a, g0.attributes[a]);
    if (g0.index) g.setIndex(g0.index);
    const hi = P.body.skeleton.bones.findIndex((b) => b.name === 'Bip01_Head');
    const n = pos.count;
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(n * 4).map((_, i) => (i % 4 ? 0 : hi)), 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(new Float32Array(n * 4).map((_, i) => (i % 4 ? 0 : 1)), 4));
    g.computeBoundingSphere();
    g.userData.keep = true;
    const mat = [].concat(S.hair.material)[0];
    mat.userData.keep = true;
    s.traverse((o) => { if (o.userData.ownGeometry) o.geometry.dispose(); });
    H = { g, mat };
    HAIR.set(key, H);
  }
  // (an echo's hair is of its light, its cards still cut out: as world/Actors.js makes a hologram's)
  let mat = H.mat;
  if (hologram) {
    const k = `${src}|${glow || 0x8fe0ff}`;
    if (!HOLO_HAIR.has(k)) {
      const c = glow || 0x8fe0ff;
      const hm = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.55, transparent: true, opacity: 0.55, depthWrite: false, roughness: 0.3, map: H.mat.map, alphaTest: H.mat.alphaTest || 0.35, side: H.mat.side });
      hm.userData.keep = true;
      HOLO_HAIR.set(k, hm);
    }
    mat = HOLO_HAIR.get(k);
  }
  const m = new THREE.SkinnedMesh(H.g, mat);
  m.name = 'hairdo';
  m.bind(P.body.skeleton, P.body.bindMatrix);
  m.position.copy(P.body.position);
  m.quaternion.copy(P.body.quaternion);
  m.scale.copy(P.body.scale);
  m.frustumCulled = false;
  m.castShadow = false;
  m.onBeforeRender = (r, scene, cam, geo) => { geo.drawRange.count = scene.overrideMaterial ? 0 : Infinity; }; // (as Actors draws hair cards)
  P.body.parent.add(m);
  return m;
}
