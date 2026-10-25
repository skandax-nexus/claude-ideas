// THE LAST VERSION OF EARTH: clothes made for a body (the settlement's people, three thousand years ago).
//
// Rocketbox dresses everyone in today's clothes. The settlement's people wear woven wool and linen over them: a long
// tunic's skirt, a mantle on the shoulders or a cloak down the back, a sash across the chest, a belt. Each piece is built
// once per model and outfit from the body it covers as it stands (its rings follow the body's own cut at each height,
// direction by direction, a little out from it, falling free below the knee; a fitted coat is cut round the bind pose)
// and is skinned to that body's skeleton by weight transfer: each vertex takes the bone weights of the nearest vertices
// of the body under it, so it moves with the hips, legs and shoulders it hangs from, and is taken back to the bind pose
// through that skinning. One geometry per model and outfit, one draw call per person (the pieces are merged; their dyes
// are vertex colours over one woven map), shared and kept for the session.
//
// A variant's `garb` (wardrobe.js):
//   skirt:  { dye, hem: m above the floor (0.07), top: 'waist' | 'hips', flare (1.3), stripe: dye, ease }
//   mantle: { dye, front: m below the shoulders at the front (0.24), back: m at the back (0.36), reach: m down the
//             arms (0.2), stripe: dye }                          a short mantle over both shoulders and the tops of the arms
//   cloak:  { dye, hem: m above the floor (0.22), open: half-angle of the opening at the front (0.75 rad), stripe }
//             a cape on the shoulders over its length
//   sash:   { dye, side: 'L' | 'R' (the shoulder it hangs from), w: m (0.09) }
//   belt:   { dye, w: m (0.05) }
//   bodice: { dye, top: m below the shoulders (0.07) }   the tunic's body from under the arms to the waist, over today's
//             clothes (a jacket's front, a blouse's buttons), joining the skirt
//   apron:  { dye, hem: m above the floor (0.42), wide: half-angle round the front (1.1 rad), bib: m below the shoulder
//             joints the bib reaches up the chest (none; less than 0: above them), bibWide: its half-angle (0.7 rad),
//             leather }
//             a cook's apron; with a bib (held by a neck strap), a work apron (the glazier's: leather, its weave only a
//             shading)
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

// (castfix round 3) A body as it stands: a fresh actor's own pose (every converted model's, the arms down at 71.5 degrees
// below the shoulders, where the bind pose has them at 42-44), once per model. Clothes are cut round this body, so they fit
// the body as it is seen, and each point of them is then taken back to the bind pose through the very skinning it is
// given (unskin), so that posed again it comes back where it was cut. (Cut round the bind pose, a cape over the shoulders
// met the arms where they no longer are: the arms came down through it.)
const REST = new Map();
function restInfo(model) {
  if (REST.has(model)) return REST.get(model);
  if (!actorLoaded(model)) return null;
  const a = makeActor({ model });
  if (a.userData.spec?.model !== model) return null;
  // (standing as the people of a place stand: the first frames of its idle)
  for (let f = 0; f < 3; f++) a.userData.animate?.(1 / 30, 0, f / 30, false);
  a.updateMatrixWorld(true);
  let mesh = null;
  a.traverse((o) => { if (o.isSkinnedMesh && !mesh && [].concat(o.material)[0]?.name === 'body') mesh = o; });
  if (!mesh) a.traverse((o) => { if (o.isSkinnedMesh && !mesh) mesh = o; });
  if (!mesh) return null;
  // (the hair's and the eyes' vertices, which share the body's buffer: a strap round the neck goes round the neck and a
  // collar, not round a ponytail)
  const pos = mesh.geometry.attributes.position;
  const hair = new Uint8Array(pos.count);
  a.traverse((o) => {
    if (!o.isSkinnedMesh || o.geometry.attributes.position !== pos || !['hair', 'eye'].includes([].concat(o.material)[0]?.name)) return;
    const ix = o.geometry.index;
    if (ix) for (let k = 0; k < ix.count; k++) hair[ix.getX(k)] = 1;
  });
  const info = restFrom(mesh, a.userData.model || a, hair);
  a.traverse((o) => { if (o.userData.ownGeometry) o.geometry.dispose(); });
  REST.set(model, info);
  return info;
}
// a skinned body as it is posed now (its matrices up to date), in the frame of its root: its points, and the way back from
// a point of that frame to the mesh's bind space under given weights (unskin)
function restFrom(mesh, root, hair = null) {
  const toRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const toModel = toRoot.clone().multiply(mesh.matrixWorld);
  const g = mesh.geometry;
  const pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const n = pos.count;
  const q = new Float32Array(n * 3);
  const v = new THREE.Vector3();
  let floor = Infinity, top = -Infinity;
  for (let i = 0; i < n; i++) {
    mesh.applyBoneTransform(i, v.fromBufferAttribute(pos, i)).applyMatrix4(toModel);
    q[i * 3] = v.x; q[i * 3 + 1] = v.y; q[i * 3 + 2] = v.z;
    floor = Math.min(floor, v.y);
    top = Math.max(top, v.y);
  }
  const bones = mesh.skeleton.bones, names = bones.map((b) => b.name);
  const dom = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    let best = 0;
    for (let k = 1; k < 4; k++) if (sw.getComponent(i, k) > sw.getComponent(i, best)) best = k;
    dom[i] = si.getComponent(i, best);
  }
  const at = {};
  bones.forEach((b, i) => { at[names[i]] = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld).applyMatrix4(toRoot); });
  const skinI = new Uint16Array(n * 4), skinW = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) for (let c = 0; c < 4; c++) { skinI[i * 4 + c] = si.getComponent(i, c); skinW[i * 4 + c] = sw.getComponent(i, c); }
  // a point of the model's frame back to the mesh's bind space under given weights, the inverse of three.js's skinning
  // (local = bindMatrixInverse * B * bindMatrix * position, B the weights' blend of each bone's matrixWorld *
  // boneInverse; bindMatrixInverse as the mesh keeps it, which an attached mesh sets from its matrixWorld):
  // position = bindMatrix^-1 * B^-1 * bindMatrixInverse^-1 * matrixWorld^-1 * root * p
  const K = bones.map((b, i) => new THREE.Matrix4().multiplyMatrices(b.matrixWorld, mesh.skeleton.boneInverses[i]));
  const L = new THREE.Matrix4().copy(mesh.bindMatrixInverse).invert().multiply(new THREE.Matrix4().copy(mesh.matrixWorld).invert()).multiply(root.matrixWorld);
  const R = new THREE.Matrix4().copy(mesh.bindMatrix).invert();
  const B = new THREE.Matrix4(), e = new Float32Array(16);
  // (and a normal, through the same chain's turn: the skinning turns normals by its own matrix, so they are cut in the
  // pose the clothes are cut in; normals worked out on the unskinned shape, which can fold where neighbouring points take
  // other bones, were shaded dark in creases that are not there)
  const M = new THREE.Matrix4(), N3 = new THREE.Matrix3();
  const unskin = (p, ji, wi, nrm = null) => {
    e.fill(0);
    for (let c = 0; c < 4; c++) if (wi[c] > 0) { const m = K[ji[c]].elements; for (let k = 0; k < 16; k++) e[k] += m[k] * wi[c]; }
    B.fromArray(e).invert();
    M.copy(R).multiply(B).multiply(L);
    if (nrm) nrm.applyMatrix3(N3.setFromMatrix4(M)).normalize();
    return p.applyMatrix4(M);
  };
  return { q, n, dom, names, at, floor, top, si: skinI, sw: skinW, unskin, hair: hair || new Uint8Array(n), sets: new Map() };
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
  arms: /^Bip01_[LR]_UpperArm$/,
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

// --- the body's surface direction by direction (castfix round 3) --------------------------------------------------------
// A cloak cut from four extents (left, right, front, back) at each height is an ellipse round the body's widest points:
// over the shoulders it stood off them like a shell, and a bib apron held its bust depth to the waist like a board. These
// follow the body: a cut through it at a height, as cloth stretched round it would lie (the convex hull of its vertices
// there), met by a ray from the centre in each direction.
// the convex hull of points [x, z], anticlockwise (Andrew's monotone chain)
function hull2(pts) {
  if (pts.length < 3) return pts.slice();
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}
// how far from (cx, cz) a ray in direction a (0: the front, +z; pi/2: the body's left, +x) leaves a convex polygon (from
// outside it, the polygon's furthest reach that way)
function rayOut(poly, cx, cz, a) {
  const ux = Math.sin(a), uz = Math.cos(a);
  let best = 0, sup = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const ex = q[0] - p[0], ez = q[1] - p[1], px = p[0] - cx, pz = p[1] - cz;
    sup = Math.max(sup, px * ux + pz * uz);
    const den = ux * ez - uz * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = (px * ez - pz * ex) / den, s = (px * uz - pz * ux) / den;
    if (s >= -1e-6 && s <= 1 + 1e-6 && t > best) best = t;
  }
  return best || sup;
}
// a cut through the body at a height: the hull of the subsets' vertices within bandH of it and of any extra points
// (null where nothing is there)
function cut(info, sets, y, bandH, extra = []) {
  const pts = extra.slice();
  for (const s of sets) for (const i of s.idx) if (Math.abs(info.q[i * 3 + 1] - y) <= bandH) pts.push([info.q[i * 3], info.q[i * 3 + 2]]);
  return pts.length < 3 ? null : hull2(pts);
}
// a cut's reach in each direction of `angles`
function ringReach(info, sets, y, bandH, cx, cz, angles, extra = []) {
  const poly = cut(info, sets, y, bandH, extra);
  return poly ? angles.map((a) => rayOut(poly, cx, cz, a)) : null;
}
// how far forward (+z) a convex polygon reaches at a lateral x (held within its sides)
function frontAt(poly, x) {
  let lo = Infinity, hi = -Infinity;
  for (const p of poly) { lo = Math.min(lo, p[0]); hi = Math.max(hi, p[0]); }
  x = Math.min(hi - 1e-4, Math.max(lo + 1e-4, x));
  let z = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    if ((p[0] - x) * (q[0] - x) > 0 || p[0] === q[0]) continue;
    z = Math.max(z, lerp(p[1], q[1], (x - p[0]) / (q[0] - p[0])));
  }
  return z;
}
const centroid = (poly) => poly.reduce((c, p) => [c[0] + p[0] / poly.length, c[1] + p[1] / poly.length], [0, 0]);
// a sheet of rows of points [x, y, z] from the top down, each row as long as the others
function sheet(out, piece, rows, skin, uvk = 1) {
  const c = PIECES.indexOf(piece) * 2;
  const base = out.pos.length / 3, cols = rows[0].length;
  for (const row of rows) for (const [x, y, z] of row) {
    out.pos.push(x, y, z);
    out.uv.push(x * 4 * uvk, -y * 4 * uvk);
    out.paint.push(c);
    const [ji, wi] = skin(x, y, z);
    out.ji.push(...ji);
    out.wi.push(...wi);
  }
  for (let k = 0; k < rows.length - 1; k++) for (let j = 0; j < cols - 1; j++) {
    const a = base + k * cols + j, b = a + 1, d = a + cols, e = d + 1;
    out.idx.push(a, d, b, b, d, e);
  }
}
// the directions of a band's columns (as band() lays them: an opening at the front of half-angle `open`, turned)
const colAngles = (segs, open, turn = 0) => Array.from({ length: open ? segs + 1 : segs }, (_, j) => open + ((Math.PI * 2 - 2 * open) * j) / segs + turn);
// an ellipse ring's reach in a direction
const ellReach = (R, a) => Math.hypot(Math.sin(a) * (Math.sin(a) >= 0 ? R.l : R.r), Math.cos(a) * (Math.cos(a) >= 0 ? R.f : R.b));
// a strap: a flat strip w wide along a path of points p [x, y, z], each with the outward direction n it lies on
function strap(out, piece, path, w, skin, uvk = 1) {
  const c = PIECES.indexOf(piece) * 2;
  const base = out.pos.length / 3;
  const n = path.length;
  for (let k = 0; k < n; k++) {
    const { p, n: nn } = path[k];
    const A = path[Math.max(0, k - 1)].p, B = path[Math.min(n - 1, k + 1)].p;
    const t = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    let ax = t[1] * nn[2] - t[2] * nn[1], ay = t[2] * nn[0] - t[0] * nn[2], az = t[0] * nn[1] - t[1] * nn[0];
    const L = Math.hypot(ax, ay, az) || 1;
    ax /= L; ay /= L; az /= L;
    for (const sg of [-1, 1]) {
      const x = p[0] + (ax * w * sg) / 2, y = p[1] + (ay * w * sg) / 2, z = p[2] + (az * w * sg) / 2;
      out.pos.push(x, y, z);
      out.uv.push(k * 0.25 * uvk, sg * 0.05 * uvk);
      out.paint.push(c);
      const [ji, wi] = skin(x, y, z);
      out.ji.push(...ji);
      out.wi.push(...wi);
    }
  }
  for (let k = 0; k < n - 1; k++) {
    const a = base + 2 * k;
    out.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
}

// A band of rings round the body. rings: [{ y, l, r, f, b }] from the top down (extents about cx, cz); the lowest ring's
// height may depend on the angle (low(a)); an opening at the front (open: half-angle); pleats; the dye, and a stripe of
// its own colour along the lower edge (a hard edge: the stripe's top ring is doubled). a = 0 is the front (+z), a = pi/2
// the body's left (+x). skin(a, x, y, z) gives a vertex's [joints, weights].
// (castfix round 3) A ring may instead give its reach column by column (rad: one per column, as colAngles lays them for
// the ring's own opening), each column's own height (ys), and an opening of its own (open: a cloak fastened at the throat
// opens wider down the chest); uvk scales the woven map (a small one: a smooth leather).
function band(out, { piece, rings, cx, cz, segs = 28, open = 0, turn = 0, pleats = 0, pleat = 0, stripe = false, stripeW = 0.04, low = null, uvk = 1, skin }) {
  const c0 = PIECES.indexOf(piece) * 2, c1 = stripe ? c0 + 1 : null;
  const nR = rings.length;
  const yLast = rings[nR - 1].y;
  const yLow = (a) => (low ? low(a) : yLast);
  // the stripe: a doubled ring stripeW above the lower edge (castfin round 1: and no ring of the band inside it, where the
  // rings are closer together than the stripe is deep, near a short skirt's hem: the band folded back over the stripe in
  // a zigzag, its inside showing through as grey teeth along the stripe's top)
  const plan = rings.map((R, i) => ({ R, t: i / (nR - 1), c: c0 }))
    .filter((P, i) => c1 == null || i === 0 || i === nR - 1 || P.R.ys || low || P.R.y > yLast + stripeW + 0.006);
  if (c1 != null) {
    const last = plan.pop(), prev = plan[plan.length - 1];
    // (its top ring on the line from the ring above down to the hem, not as wide as the hem: a hem flared out over the feet
    // made a shelf of the stripe's top)
    let ER = last.R;
    if (prev && !low && !last.R.ys && !prev.R.ys && prev.R.y > yLast + stripeW) {
      const k = stripeW / (prev.R.y - yLast), L = (key) => lerp(last.R[key], prev.R[key], k);
      ER = { ...last.R, l: L('l'), r: L('r'), f: L('f'), b: L('b'), ...(last.R.rad && prev.R.rad ? { rad: last.R.rad.map((r, j) => lerp(r, prev.R.rad[j], k)) } : {}) };
    }
    const s = { R: ER, edge: stripeW, t: 1 };
    plan.push({ ...s, c: c0 }, { ...s, c: c1, dup: true }, { ...last, c: c1, edge: 0 });
  }
  const cols = open ? segs + 1 : segs;
  const base = out.pos.length / 3;
  for (const P of plan) {
    const R = P.R;
    const o = open ? R.open ?? open : 0;
    const a0 = o, a1 = Math.PI * 2 - o;
    for (let j = 0; j < cols; j++) {
      const a = a0 + ((a1 - a0) * j) / segs + turn; // (turned half round, an opening at the front is one at the back)
      const sx = Math.sin(a), czz = Math.cos(a);
      const fold = pleats ? 1 + pleat * P.t * Math.sin(a * pleats) : 1;
      let x, z;
      if (R.rad) {
        x = cx + sx * R.rad[j] * fold;
        z = cz + czz * R.rad[j] * fold;
      } else {
        const ex = sx >= 0 ? R.l : R.r, ez = czz >= 0 ? R.f : R.b;
        x = cx + sx * ex * fold;
        z = cz + czz * ez * fold;
      }
      const y = R.ys ? R.ys[j] + (P.edge ?? 0) : P.edge != null ? yLow(a) + P.edge : R.y + (yLow(a) - yLast) * P.t;
      out.pos.push(x, y, z);
      out.uv.push((a / (Math.PI * 2)) * 6 * uvk, -y * 4 * uvk);
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
  // (castfix round 3) the base of the neck: down from the neck's joint, the first height where a cut through the body is
  // half as wide again as the neck (the shoulders' slope begins there)
  let yNeck = null;
  const neckBase = () => {
    if (yNeck != null) return yNeck;
    const half = (y) => {
      let w = 0;
      for (const i of S('torso').idx) if (Math.abs(info.q[i * 3 + 1] - y) < 0.006) w = Math.max(w, Math.abs(info.q[i * 3] - cx));
      return w;
    };
    const y0 = Math.max(neck.y, yArm + 0.05) + 0.02, w0 = half(y0) || 0.06;
    yNeck = yArm + 0.04;
    for (let y = y0; y > yArm; y -= 0.004) if (half(y) > w0 * 1.5) { yNeck = y + 0.004; break; }
    return yNeck;
  };
  // the arms near their roots (within r of the shoulder joint), for a cape's or a mantle's sides
  const nearArm = (r) => ({ idx: S('arms').idx.filter((i) => { const x = info.q[i * 3], j = x > cx ? shL : shR; return Math.hypot(x - j.x, info.q[i * 3 + 1] - j.y, info.q[i * 3 + 2] - j.z) < r; }) });
  // a piece that lies on the shoulders and hangs (the cloak's cape, a mantle): N rings from yTop down to low(a), each point
  // at its own height on the cut through the body there (the hull of `sets` and of the clothes under it), e(t, a) out from
  // it, and down each column never nearer in than the point above (cloth hangs); open(t): the opening at the front. Its top
  // ring is gathered round the neck (a cut through it alone: the band of the cuts below would reach the slope of the
  // shoulders behind, and the shirt showed between the neck and a ring that lay out on them), and its rings are closest
  // together there, where the shoulders fall away fastest
  const drape = ({ yTop, low, sets, segs, open = () => 0, N = 12, e }) => {
    const cuts = new Map();
    const cutAt = (y, band = 0.018) => {
      const key = `${Math.round(y * 400)}|${band}`;
      if (!cuts.has(key)) cuts.set(key, cut(info, sets, Math.round(y * 400) / 400, band, under(Math.round(y * 400) / 400, 0.008)));
      return cuts.get(key);
    };
    const rings = [];
    let prev = null;
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1), o = open(t), angs = colAngles(segs, o);
      const ys = angs.map((a) => lerp(yTop, low(a), Math.pow(t, 1.5)));
      const rad = angs.map((a, j) => {
        const poly = cutAt(ys[j], k ? 0.018 : 0.006);
        const r = poly ? rayOut(poly, cx, cz, a) + e(t, a) : prev ? prev.rad[j] : 0.12;
        return Math.max(r, prev ? prev.rad[j] : 0);
      });
      prev = { y: ys[0], ys, rad, open: o };
      rings.push(prev);
    }
    return rings;
  };
  // the neck and the chest with whatever collar and lapels are on them (not the head's: a ponytail modelled in the head's
  // own mesh hangs to the base of the neck, and a strap round it stood out behind the neck to the hair's tip)
  const collar = () => {
    if (info.sets.has('collar')) return info.sets.get('collar');
    const re = /^Bip01_(Spine1?|Spine2|Neck|[LR]_Clavicle)$/, idx = [];
    for (let i = 0; i < info.n; i++) if (re.test(info.names[info.dom[i]]) && !info.hair?.[i]) idx.push(i);
    const c = { idx };
    info.sets.set('collar', c);
    return c;
  };
  // the clothes a cloak goes over, as points round the body at a height: the skirt's ring, and the bodice's (and the belt
  // a little under its lowest ring)
  let bodice = null;
  const bodiceAt = (y) => {
    if (!bodice || y > bodice[0].y + 0.01) return null;
    for (let k = 0; k < bodice.length - 1; k++) if (y >= bodice[k + 1].y) return grow(bodice[k], bodice[k + 1]);
    return y >= bodice[bodice.length - 1].y - 0.035 ? bodice[bodice.length - 1] : null;
  };
  const under = (y, e) => {
    const pts = [];
    for (const R of [skirtAt(y), bodiceAt(y)]) {
      if (!R) continue;
      for (let q = 0; q < 24; q++) { const a = (q / 24) * Math.PI * 2, r = ellReach(R, a) + e; pts.push([cx + Math.sin(a) * r, cz + Math.cos(a) * r]); }
    }
    return pts;
  };

  if (garb.skirt) {
    // a tunic's skirt from the waist to the ankles: round the hips, then falling straight past the legs, wider at the hem
    const s = garb.skirt;
    const top = s.top === 'hips' ? lerp(pelvis.y, spine2.y, 0.12) : yWaist;
    const hem = info.floor + (s.hem ?? 0.07);
    const ease = s.ease ?? 0.022;
    const rings = [];
    let prev = null;
    const N = 13, segs = 32, angs = colAngles(segs, 0);
    const yAt = (k) => lerp(top, hem, Math.pow(k / (N - 1), 0.85));
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1);
      const y = yAt(k);
      const o = outline(info, k < 3 ? S('hips') : S('legs'), y, 0.03, cx, cz) || prev;
      const fl = k ? 1 + ((s.flare ?? 1.3) - 1) * t * t : 1;
      let R = grow({ y, l: (o.l + ease) * fl, r: (o.r + ease) * fl, f: (o.f + ease) * fl, b: (o.b + ease) * fl }, prev);
      // a skirt is round: no side much nearer than the furthest
      const m = Math.max(R.l, R.r, R.f, R.b);
      R = { y, l: Math.max(R.l, m * 0.82), r: Math.max(R.r, m * 0.82), f: Math.max(R.f, m * 0.72), b: Math.max(R.b, m * 0.72) };
      // (castfin round 1) and round the body's own cut, direction by direction, over the whole height between this ring
      // and its neighbours: an ellipse through the four widest points passes inside the body between them (a child's
      // knees, standing together, came through it at the front corners as grey shards of the shorts under the tunic)
      const bandH = Math.max(0.03, (Math.abs(yAt(Math.max(0, k - 1)) - yAt(Math.min(N - 1, k + 1))) / 2) * 0.6 + 0.01);
      const reach = ringReach(info, [k < 3 ? S('hips') : S('legs')], y, bandH, cx, cz, angs);
      R.rad = angs.map((a, j) => Math.max(ellReach(R, a), reach ? (reach[j] + ease) * fl : 0, prev ? prev.rad[j] : 0));
      // (its four extents enclose every column, for the pieces that go over it: skirtAt, under)
      const kx = Math.max(1, ...angs.map((a, j) => R.rad[j] / Math.max(1e-4, ellReach(R, a))));
      if (kx > 1) Object.assign(R, { l: R.l * kx, r: R.r * kx, f: R.f * kx, b: R.b * kx });
      rings.push(R);
      prev = R;
    }
    skirt = rings;
    // (castfin round 1) the legs it covers, from the waist to a little above the hem, are not drawn (clothe): however it
    // is cut, a stride's knee came through the front of it (Rocketbox's jeans and a child's grey shorts, in patches)
    out.cover = { top, lo: hem + (s.hem > 0.2 ? 0.06 : 0.02) };
    // (the hips carry a share of the hem, so it does not split into two trouser legs as they stride)
    const pel = bone('Bip01_Pelvis');
    band(out, { piece: 'skirt', rings, cx, cz, segs, pleats: 9, pleat: 0.07, stripe: !!s.stripe, stripeW: s.stripeW ?? 0.05,
      skin: (a, x, y, z) => transfer(info, [[S('hips'), 1]], x, y, z, 14, [pel, Math.min(0.5, Math.max(0, (top - y) / (top - hem)) * 0.5)]) });
  }

  if (garb.apron) {
    // a cook's apron: the front of a skirt from the waist to below the knee, over today's trousers
    const s = garb.apron;
    const top = yWaist + 0.02, hem = info.floor + (s.hem ?? 0.42);
    const rings = [];
    let prev = null;
    const N = 12;
    // (castfix round 3: and round the legs' own cut, direction by direction, the convex hull of it and that ellipse: the
    // legs stand apart, and an ellipse through their widest points alone passes inside the front of each)
    const angs = colAngles(14, Math.PI - (s.wide ?? 1.1), Math.PI);
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1);
      const y = lerp(top, hem, t);
      const o = outline(info, k < 2 ? S('hips') : S('legs'), y, 0.03, cx, cz) || prev;
      // (a bib apron is tied close at the waist)
      const e = s.bib != null ? 0.018 + 0.04 * t : 0.03 + 0.03 * t;
      const R = outside(grow({ y, l: o.l + e, r: o.r + e, f: o.f + e, b: o.b + e }, prev), y, 0.012);
      const ell = [];
      for (let q = 0; q < 32; q++) { const a = (q / 32) * Math.PI * 2, r = ellReach(R, a) - e; ell.push([cx + Math.sin(a) * r, cz + Math.cos(a) * r]); }
      const cutR = ringReach(info, [k < 2 ? S('hips') : S('legs')], y, 0.03, cx, cz, angs, [...ell, ...under(y, 0.012 - e)]);
      R.rad = angs.map((a, j) => Math.max(cutR ? cutR[j] + e : ellReach(R, a), prev ? prev.rad[j] : 0));
      rings.push(R);
      prev = R;
    }
    const pel = bone('Bip01_Pelvis');
    const uvk = s.leather ? 0.015 : 1; // (leather: the weave drawn so large it is only a shading)
    band(out, { piece: 'apron', rings, cx, cz, segs: 14, open: Math.PI - (s.wide ?? 1.1), turn: Math.PI, uvk,
      skin: (a, x, y, z) => transfer(info, [[S('hips'), 1]], x, y, z, 14, [pel, Math.min(0.5, Math.max(0, (top - y) / (top - hem)) * 0.5)]) });
    if (s.bib != null) {
      // the bib: up the front of the chest from the apron's top, over the jacket, narrower than the skirt. (castfix round
      // 3) It lies on the chest, direction by direction, and spans its hollows as stiff cloth would (the hull of the
      // body's cuts, then of the bib's own profile down each column: from its top edge over the bust and in to the waist,
      // where it goes down behind the apron's top), held up by a strap round the back of the neck. (Four extents a ring
      // made it a board, standing out at the throat and holding its bust depth to the waist.)
      const yTop = yArm - s.bib, yBot = top - 0.03;
      const bw = s.bibWide ?? 0.7, NB = 12, NC = 11;
      // as wide as the old cut's (its half-angle round the chest at the bust), in straight columns
      const yBust = yArm - 0.13;
      const hw = (outline(info, S('torso'), yBust, 0.02, cx, cz) || { l: 0.15, r: 0.15 });
      const W = Math.sin(bw) * (hw.l + hw.r + 0.056);
      const xs = Array.from({ length: NC }, (_, j) => cx + (j / (NC - 1) - 0.5) * W);
      const A0 = rings[0], ys = Array.from({ length: NB }, (_, k) => lerp(yTop, yBot, k / (NB - 1)));
      const zs = ys.map((y, k) => {
        const poly = k < NB - 1 ? cut(info, [S('torso'), S('hips')], y, 0.016) : null;
        // (its lowest row behind the apron's top)
        return xs.map((x) => (poly ? frontAt(poly, x) + 0.012
          : cz + A0.f * Math.sqrt(1 - Math.min(0.96, ((x - cx) / (x > cx ? A0.l : A0.r)) ** 2)) - 0.006));
      });
      for (let j = 0; j < NC; j++) {
        const z = zs.map((r) => r[j]);
        for (let k = 1; k < NB - 1; k++) for (let i = 0; i < k; i++) for (let m = k + 1; m < NB; m++) zs[k][j] = Math.max(zs[k][j], lerp(z[i], z[m], (ys[i] - ys[k]) / (ys[i] - ys[m])));
      }
      sheet(out, 'apron', ys.map((y, k) => xs.map((x, j) => [x, y, zs[k][j]])), (x, y, z) => transfer(info, [[S('torso'), 1]], x, y, z, 10), uvk);
      // the neck strap: from the bib's top corners up the chest to the base of the neck, and round the back of it where
      // it meets the shoulders
      // (over the collar and the lapels of the jacket under it: the neck's, the chest's and the head's vertices, not its hair)
      const yN = neckBase();
      const ring = cut(info, [collar()], yN, 0.006) || [[cx - 0.06, cz], [cx + 0.06, cz], [cx, cz + 0.06], [cx, cz - 0.06]];
      const [ncx, ncz] = centroid(ring);
      const onNeck = (a, y) => {
        const r = rayOut(cut(info, [collar()], y, 0.008) || ring, ncx, ncz, a) + 0.007;
        return { p: [ncx + Math.sin(a) * r, y, ncz + Math.cos(a) * r], n: [Math.sin(a), 0.5, Math.cos(a)] };
      };
      const side = 0.95, path = [];
      for (const sg of [-1, 1]) {
        const j = sg < 0 ? 0 : NC - 1;
        const P0 = [xs[j] - sg * 0.012, ys[0] - 0.018, zs[0][j] + 0.004], P1 = onNeck(sg * side, yN).p;
        const leg = [];
        // (over the lapels, whichever bone carries them: a cut a little taller than the mesh's rows are apart, so the
        // strap never dips into the cloth between them)
        for (let k = 0; k <= 10; k++) {
          const t = k / 10, x = lerp(P0[0], P1[0], t), y = lerp(P0[1], P1[1], t);
          const poly = cut(info, [collar()], y, 0.02);
          const z = Math.max(lerp(P0[2], P1[2], t), poly ? frontAt(poly, x) + 0.01 : -Infinity);
          leg.push({ p: [x, y, z], n: [0, 0.45, 1] });
        }
        // (pulled taut: straight over the lapels' edges as the bib is over the hollows, not stepping over each)
        const z0 = leg.map((l) => l.p[2]);
        for (let k = 1; k < leg.length - 1; k++) for (let i = 0; i < k; i++) for (let m = k + 1; m < leg.length; m++) leg[k].p[2] = Math.max(leg[k].p[2], lerp(z0[i], z0[m], (k - i) / (m - i)));
        path.push(sg < 0 ? leg : leg.reverse());
      }
      const arc = [];
      for (let k = 1; k < 14; k++) arc.push(onNeck(lerp(-side, -(Math.PI * 2 - side), k / 14), yN + 0.01 * Math.sin((Math.PI * k) / 14)));
      strap(out, 'apron', [...path[0], ...arc, ...path[1]], 0.02, (x, y, z) => transfer(info, [[S('torso'), 1]], x, y, z, 10), uvk);
    }
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
    bodice = rings;
    band(out, { piece: 'bodice', rings, cx, cz, segs: 30, skin: (a, x, y, z) => transfer(info, [[S('torso'), 1]], x, y, z, 10) });
  }

  if (garb.cloak && !garb.cloak.fit) {
    // (castfix round 3) a long cloak fastened at the throat, in two layers as a cloak falls: a cape gathered round the
    // base of the neck, lying on the slope of the shoulders and over the tops of the arms (its sides go where the arms go,
    // as a mantle's do), and under it the cloak's length, from the shoulder blades, the chest and the hips to the hem,
    // over the tunic and open down the front, the arms coming out at its sides under the cape. Each ring follows the body
    // direction by direction (ringReach) and only ever hangs further out below. (An ellipse from the shoulders' widest
    // reach stood off the shoulders and the back like a shell, its top a shelf at the collarbones.)
    const s = garb.cloak;
    const hem = info.floor + (s.hem ?? 0.22);
    const open = s.open ?? 0.75, clasp = Math.min(open, 0.3);
    const yTop = neckBase() + 0.012;
    const capArm = nearArm(0.2);
    const yFront = yArm - 0.15, yBack = yArm - 0.2, ySide = yArm - 0.13;
    {
      const segs = 32;
      const low = (a) => { const fb = lerp(yFront, yBack, (1 - Math.cos(a)) / 2); return fb + (ySide - fb) * Math.pow(Math.sin(a), 2); };
      const rings = drape({ yTop, low, sets: [S('torso'), capArm], segs, open: (t) => lerp(clasp, open, t * t * (3 - 2 * t)), e: (t) => 0.018 + 0.016 * t });
      band(out, { piece: 'cloak', rings, cx, cz, segs, open, pleats: 7, pleat: 0.03,
        // (each point as the body under it moves: the arms' near the arms, the chest's and the neck's elsewhere)
        skin: (a, x, y, z) => transfer(info, [[S('shoulders'), 1]], x, y, z, 10) });
    }
    {
      const segs = 30, rings = [];
      let prev = null;
      const yP = yArm - 0.06, N = 14;
      const angs = colAngles(segs, open);
      for (let k = 0; k < N; k++) {
        const t = k / (N - 1), y = lerp(yP, hem, t);
        const sets = y > pelvis.y + 0.08 ? [S('torso')] : [S('torso'), S('legs')];
        let rad = ringReach(info, sets, y, 0.03, cx, cz, angs, under(y, 0.01));
        if (!rad) rad = prev ? prev.rad.slice() : angs.map(() => 0.15);
        const e = y > yBack ? 0.01 : 0.018;
        rad = rad.map((r, j) => Math.max(r + e, prev ? prev.rad[j] : 0));
        prev = { y, rad };
        rings.push(prev);
      }
      const pel = bone('Bip01_Pelvis');
      band(out, { piece: 'cloak', rings, cx, cz, segs, open, pleats: 6, pleat: 0.05, stripe: !!s.stripe, stripeW: 0.05,
        skin: (a, x, y, z) => transfer(info, [[S('back'), 1]], x, y, z, 14, y < pelvis.y ? [pel, Math.min(0.6, ((pelvis.y - y) / (pelvis.y - hem)) * 0.6)] : null) });
    }
  } else if (garb.cloak) {
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
    // a short mantle: round the base of the neck, over the shoulders and down over the tops of the arms, lower at the back
    // than at the front. (castfix round 3) Like the cloak's cape, gathered at the base of the neck and lying on the slope of
    // the shoulders, each ring following the body direction by direction and only hanging further out below, its points
    // moving with the body under them (cut round an ellipse of the widest reach, it stood off the shoulders as a box)
    const s = garb.mantle;
    const yTop = neckBase() + 0.012;
    const front = s.front ?? 0.24, back = s.back ?? 0.36, reach = s.reach ?? 0.2;
    const yFront = yArm - front, yBack = yArm - back;
    const segs = 36;
    // (lower at the back, and in a shallow point at the front: a mantle's corners hang)
    const low = (a) => lerp(yFront, yBack, (1 - Math.cos(a)) / 2) - (s.point ?? 0.07) * Math.pow(Math.max(0, Math.cos(a)), 6);
    const rings = drape({ yTop, low, sets: [S('torso'), nearArm(reach)], segs, e: (t, a) => 0.02 + 0.016 * t + 0.015 * t * Math.max(0, -Math.cos(a)) });
    band(out, { piece: 'mantle', rings, cx, cz, segs, pleats: 7, pleat: 0.045, stripe: !!s.stripe, stripeW: 0.035,
      skin: (a, x, y, z) => transfer(info, [[S('shoulders'), 1]], x, y, z, 10) });
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

  // into the mesh's own space (cut round the body as it stands: each point back to the bind pose through its own skin)
  const p = new Float32Array(out.pos);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setIndex(out.idx);
  g.computeVertexNormals(); // (in the pose the clothes are cut in)
  const nr = g.attributes.normal.array;
  const v = new THREE.Vector3(), nv = new THREE.Vector3();
  for (let i = 0; i < p.length; i += 3) {
    v.set(p[i], p[i + 1], p[i + 2]);
    if (info.unskin) {
      nv.set(nr[i], nr[i + 1], nr[i + 2]);
      info.unskin(v, out.ji.slice((i / 3) * 4, (i / 3) * 4 + 4), out.wi.slice((i / 3) * 4, (i / 3) * 4 + 4), nv);
      nr[i] = nv.x; nr[i + 1] = nv.y; nr[i + 2] = nv.z;
    } else v.applyMatrix4(info.fromModel);
    p[i] = v.x; p[i + 1] = v.y; p[i + 2] = v.z;
  }
  if (!info.unskin) g.computeVertexNormals();
  g.setAttribute('uv', new THREE.Float32BufferAttribute(out.uv, 2));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(out.ji, 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(out.wi, 4));
  g.computeBoundingSphere();
  return { g, paint: Uint8Array.from(out.paint), cover: out.cover ? { ...out.cover, info } : null };
}

// (castfin round 1) A body under a long skirt, its legs not drawn: the body's geometry (its own attributes, shared) with
// only the triangles that show, once per model and outfit. Left out: every triangle wholly on the thighs and the calves
// between the skirt's top and a little above its hem, and on the hips below the waist, as the body stands; the feet, the
// ankles and the shins under a boy's knee-length tunic are drawn, so a stride still steps out from under the hem.
// (A foot's bone carries the trouser leg's hem above the ankle: those are covered too, above the same height.)
const LEG = /^Bip01_[LR]_(Thigh|Calf|Foot|Toe0)$/;
function covered({ info, top, lo }, geo) {
  const ix = geo.index;
  if (!ix) return null;
  const hid = (i) => {
    const y = info.q[i * 3 + 1], n = info.names[info.dom[i]];
    return y >= lo && (LEG.test(n) ? y <= top - 0.03 : n === 'Bip01_Pelvis' && y <= top - 0.06);
  };
  const keep = [];
  for (let k = 0; k < ix.count; k += 3) {
    const a = ix.getX(k), b = ix.getX(k + 1), c = ix.getX(k + 2);
    if (!(hid(a) && hid(b) && hid(c))) keep.push(a, b, c);
  }
  if (keep.length === ix.count) return null;
  const g = new THREE.BufferGeometry();
  for (const [k, a] of Object.entries(geo.attributes)) g.setAttribute(k, a);
  g.morphAttributes = geo.morphAttributes;
  g.morphTargetsRelative = geo.morphTargetsRelative;
  g.setIndex(keep);
  g.boundingSphere = geo.boundingSphere;
  g.boundingBox = geo.boundingBox;
  g.name = `${geo.name || 'body'}:covered`;
  g.userData.keep = true; // (shared by everyone of this model in this outfit: DeckWorld leaves it)
  g.userData.covered = (ix.count - keep.length) / 3;
  return g;
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

const GEO = new Map(), SHAPES = new Map(), BARE = new Map();
// Put an outfit on a person (an actor of the given model): its pieces as one skinned mesh beside the body's, posed by
// the same skeleton. A person who fades (a flickering echo) fades their clothes with them.
export function clothe(actor, model, garb, { hologram = false, glow = null } = {}) {
  if (!garb || !PIECES.some((k) => garb[k])) return null;
  const body = partsOf(actor).body;
  if (!body) return null;
  const shape = `${model}|${shapeOf(garb)}`;
  let base = SHAPES.get(shape);
  if (!base) {
    // (a coat fitted to the body is cut round the bind pose, its arms out from its sides: cut round the arms as they hang,
    // its straight sides took the upper arms in and it stood off them as a box)
    const bind = () => bodyInfo(model, body, actor.userData.model || actor);
    base = build(garb.cloak?.fit ? bind() : restInfo(model) || bind(), garb);
    SHAPES.set(shape, base);
  }
  // (castfin round 1) the legs under a long skirt left out of the body (covered)
  if (base.cover) {
    if (!BARE.has(shape)) BARE.set(shape, covered(base.cover, body.geometry));
    const bare = BARE.get(shape);
    if (bare && bare.attributes.position === body.geometry.attributes.position) body.geometry = bare;
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
export const garmentStats = () => ({ shapes: SHAPES.size, geometries: GEO.size, bodies: INFO.size, covered: BARE.size });

// ---------------------------------------------------------------------------------------------------------------------
// A head of hair of its own, over a head whose hair is only painted (Children/Male_Child_01's: young Kai's and Tomas's).
// An echo is drawn in one light, its maps unseen, so a boy whose hair is painted on read bald, and two boys on the one body
// read as one boy. The mass is a shell over the skull from the crown to a hairline, each direction a little out from the
// head's own surface there, thickest at the crown; its lower edge is cut into locks by its map. A style:
//   { dye: '#rrggbb' (sRGB; an echo's is its light), fringe: the hairline at the brow, in radians down from the crown
//     (1.2: a fringe to the brows; 0.85: a short crop's), side: over the ears (1.75: half over them), nape: at the back
//     (2.1), lift: m at the crown (0.016), locks: the locks' share of the length (0.18), seed }
// One geometry per model and style (skinned to the head bone alone), kept; one map per style.
const MASS = new Map(), MASS_MAT = new Map();
export const MASS_DEFAULT = { fringe: 1.2, side: 1.75, nape: 2.1, lift: 0.016, locks: 0.18, seed: 1 };
function massShape(P, model, s) {
  const info = bodyInfo(model, P.body, P.root);
  const dh = boxOf(P.head, P.root);
  const hb = info.at.Bip01_Head;
  const pos = P.head.geometry.attributes.position;
  const q = [], v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(dh.T);
    if (v.y > hb.y - 0.01) q.push(v.x, v.y, v.z);
  }
  const top = dh.b.max.y;
  // the skull's middle: over the head bone, half way to the crown, centred front to back on the head at that height
  const cy = hb.y + 0.5 * (top - hb.y);
  let z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < q.length; i += 3) if (Math.abs(q[i + 1] - cy) < 0.012) { z0 = Math.min(z0, q[i + 2]); z1 = Math.max(z1, q[i + 2]); }
  const c = new THREE.Vector3(hb.x, cy, isFinite(z0) ? (z0 + z1) / 2 : hb.z);
  // the head's surface in each direction from there (the furthest vertex in each cell of azimuth and angle from the top),
  // the empty cells filled from their neighbours, smoothed
  const NA = 40, NE = 30, EMAX = 2.6;
  const R = new Float32Array(NA * NE);
  for (let i = 0; i < q.length; i += 3) {
    const dx = q[i] - c.x, dy = q[i + 1] - c.y, dz = q[i + 2] - c.z, r = Math.hypot(dx, dy, dz);
    const e = Math.acos(Math.max(-1, Math.min(1, dy / r))), a = Math.atan2(dx, dz);
    if (e >= EMAX) continue;
    const k = Math.floor((e / EMAX) * NE) * NA + (Math.floor(((a + Math.PI) / (2 * Math.PI)) * NA) % NA);
    R[k] = Math.max(R[k], r);
  }
  for (let pass = 0; pass < 12; pass++) {
    for (let e = 0; e < NE; e++) for (let a = 0; a < NA; a++) {
      const k = e * NA + a;
      if (R[k]) continue;
      let sum = 0, n = 0;
      for (const [de, da] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const ee = e + de;
        if (ee < 0 || ee >= NE) continue;
        const kk = ee * NA + ((a + da + NA) % NA);
        if (R[kk] > 0) { sum += R[kk]; n++; }
      }
      if (n) R[k] = -sum / n; // (filled after the pass, so a pass fills one ring of cells)
    }
    for (let k = 0; k < R.length; k++) if (R[k] < 0) R[k] = -R[k];
  }
  const S = new Float32Array(R.length);
  for (let e = 0; e < NE; e++) for (let a = 0; a < NA; a++) {
    let sum = 0, n = 0;
    for (let de = -1; de <= 1; de++) for (let da = -1; da <= 1; da++) {
      const ee = e + de;
      if (ee < 0 || ee >= NE) continue;
      const r = R[ee * NA + ((a + da + NA) % NA)];
      if (r) { sum += r; n++; }
    }
    S[e * NA + a] = n ? sum / n : 0.09;
  }
  const cell = (a, e) => {
    // bilinear in the smoothed cells (a: -pi..pi, e: 0..EMAX)
    const fa = (((a + Math.PI) / (2 * Math.PI)) * NA - 0.5 + NA) % NA, fe = Math.max(0, Math.min(NE - 1.001, (e / EMAX) * NE - 0.5));
    const a0 = Math.floor(fa), e0 = Math.floor(fe), ta = fa - a0, te = fe - e0, a1 = (a0 + 1) % NA;
    const g = (ee, aa) => S[ee * NA + aa];
    return lerp(lerp(g(e0, a0), g(e0, a1), ta), lerp(g(e0 + 1, a0), g(e0 + 1, a1), ta), te);
  };
  // (below the temples the hair falls past the ears rather than over them: no further out than the head at the temple)
  const surf = (a, e) => (e > 1.25 ? Math.min(cell(a, e), cell(a, 1.25) + 0.004) : cell(a, e));
  // the hairline: from the brow (a = 0, the face) by the temples and over the ears to the nape (a = pi)
  const line = (a) => {
    const t = Math.abs(a) / Math.PI;
    const k = [[0, s.fringe], [0.17, s.fringe * 0.97 + 0.05], [0.3, (s.fringe + s.side) / 2], [0.5, s.side], [0.72, (s.side + s.nape) / 2 + 0.05], [1, s.nape]];
    for (let i = 0; i < k.length - 1; i++) if (t <= k[i + 1][0]) { const u = (t - k[i][0]) / (k[i + 1][0] - k[i][0]); return lerp(k[i][1], k[i + 1][1], u * u * (3 - 2 * u)); }
    return s.nape;
  };
  // the grid: columns round the head (the first repeated at the end for the map's seam), rings from the crown to the edge
  const NC = 64, NR = 14, REP = 3;
  const toBind = new THREE.Matrix4().copy(P.root.matrixWorld).invert().multiply(P.body.matrixWorld).multiply(P.body.bindMatrix).invert();
  const p = [], uv = [], idx = [];
  for (let r = 0; r <= NR; r++) {
    const f = r / NR;
    for (let j = 0; j <= NC; j++) {
      const a = -Math.PI + (2 * Math.PI * j) / NC;
      const e = line(a) * f; // (the first ring is the crown, one point)
      // (thickest at the crown; at the edge it lies on the head; a fringe stands a little off the brow)
      const front = Math.max(0, Math.cos(a));
      const off = s.lift * (1 - 0.72 * f * f) + 0.003 + 0.004 * front * f;
      const rr = surf(a, e) + off;
      v.set(Math.sin(e) * Math.sin(a), Math.cos(e), Math.sin(e) * Math.cos(a)).multiplyScalar(rr).add(c).applyMatrix4(toBind);
      p.push(v.x, v.y, v.z);
      uv.push((j / NC) * REP, f);
    }
  }
  for (let r = 0; r < NR; r++) for (let j = 0; j < NC; j++) {
    const A = r * (NC + 1) + j, B = A + 1, C = A + NC + 1, D2 = C + 1;
    idx.push(A, C, B, B, C, D2); // (wound outward: an echo draws only its front faces)
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const n = p.length / 3, hi = P.body.skeleton.bones.findIndex((b) => b.name === 'Bip01_Head');
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(n * 4).map((_, i) => (i % 4 ? 0 : hi)), 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(new Float32Array(n * 4).map((_, i) => (i % 4 ? 0 : 1)), 4));
  g.computeBoundingSphere();
  g.userData.keep = true;
  return g;
}
// the mass's map: strands from the crown down, in locks of a few strands each whose tips end at their own length (alpha),
// the colour the dye with each strand a little lighter or darker (an echo's: grey, its light multiplied by it)
function massMap(s, dye) {
  const W = 256, H = 128;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const img = g.createImageData(W, H);
  let seed = s.seed * 9301 + 49297;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const base = col(dye || '#9a9a9a');
  const lock = [];
  for (let x = 0; x < W;) {
    // (a lock is 4-11 degrees of the head: wide enough for its tip to show at a talk's distance)
    const w = 9 + Math.floor(rnd() * 16), len = 1 - s.locks * (0.15 + 0.85 * rnd());
    for (let k = 0; k < w && x < W; k++, x++) lock.push({ len, at: k / w, tone: rnd() < 0.3 ? 0.62 + rnd() * 0.2 : 0.85 + rnd() * 0.3 });
  }
  for (let x = 0; x < W; x++) {
    const L = lock[x];
    // (a lock tapers to a point: its middle strands the longest)
    const tip = L.len - s.locks * 0.6 * Math.abs(L.at - 0.5) ** 1.5;
    // (and between two locks a darker parting)
    const part = Math.min(L.at, 1 - L.at) < 0.12 ? 0.62 : 1;
    for (let y = 0; y < H; y++) {
      const v = y / (H - 1), i = (y * W + x) * 4;
      const shade = L.tone * part * (0.88 + 0.12 * Math.sin(v * 30 + x * 1.7)) * (0.8 + 0.2 * Math.min(1, v * 3));
      img.data[i] = Math.min(255, base.r * 255 * shade);
      img.data[i + 1] = Math.min(255, base.g * 255 * shade);
      img.data[i + 2] = Math.min(255, base.b * 255 * shade);
      img.data[i + 3] = v < tip ? 255 : 0;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.flipY = false; // (v runs from the crown, the canvas's top row, to the tips)
  t.wrapS = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.userData.keep = true;
  return t;
}
function massMat(s, hologram, glow) {
  const k = `${JSON.stringify(s)}|${hologram ? glow || 0x8fe0ff : 'solid'}`;
  if (!MASS_MAT.has(k)) {
    let m;
    if (hologram) {
      // (of the echo's light, brighter and denser than the face under it, so the hair reads as hair and not as more head,
      // from the front too, its locks and partings drawn in it)
      const c2 = glow || 0x8fe0ff;
      m = new THREE.MeshStandardMaterial({ color: c2, emissive: c2, emissiveIntensity: 1.35, transparent: true, opacity: 0.78, depthWrite: false, roughness: 0.3, map: massMap(s, '#ffffff'), alphaTest: 0.5 });
      m.emissiveMap = m.map; // (its locks and partings in its light too)
    } else {
      m = new THREE.MeshStandardMaterial({ map: massMap(s, s.dye), alphaTest: 0.5, roughness: 0.72, metalness: 0, side: THREE.DoubleSide, envMapIntensity: 0.4 });
      m.name = 'hairmass';
    }
    m.userData.keep = true;
    MASS_MAT.set(k, m);
  }
  return MASS_MAT.get(k);
}
export function hairMass(actor, model, style = {}, { hologram = false, glow = null } = {}) {
  const P = partsOf(actor);
  if (!P.head || !P.body) return null;
  const s = { ...MASS_DEFAULT, ...style };
  const key = `${model}|${JSON.stringify({ ...s, dye: 0 })}`;
  let g = MASS.get(key);
  if (!g) {
    g = massShape(P, model, s);
    MASS.set(key, g);
  }
  const m = new THREE.SkinnedMesh(g, massMat(s, hologram, glow));
  m.name = 'hairmass';
  m.bind(P.body.skeleton, P.body.bindMatrix);
  m.position.copy(P.body.position);
  m.quaternion.copy(P.body.quaternion);
  m.scale.copy(P.body.scale);
  m.frustumCulled = false;
  m.castShadow = !hologram;
  m.onBeforeRender = (r, scene, cam, geo) => { geo.drawRange.count = scene.overrideMaterial ? 0 : Infinity; }; // (as Actors draws hair cards)
  P.body.parent.add(m);
  // (an echo that flickers flickers its hair)
  const U = actor.userData, fade = U.setOpacity;
  if (fade) {
    let own = null;
    U.setOpacity = (a) => {
      fade(a);
      if (!own) { own = m.material.clone(); m.material = own; }
      own.transparent = hologram || a < 1;
      own.opacity = (hologram ? 0.78 : 1) * a;
    };
  }
  return m;
}

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
  a.traverse((o) => { if (o.isSkinnedMesh && !['garment', 'hairdo', 'hairmass', 'holodepth'].includes(o.name)) { all.push(o); const n = [].concat(o.material)[0]?.name; if (n) out[n] = o; } });
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
export const _dbg = { restInfo, restFrom, bodyInfo, build, covered, ringReach, cut, colAngles, subset, SETS, outline, ellReach, hull2, rayOut, frontAt };
