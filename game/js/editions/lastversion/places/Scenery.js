// THE LAST VERSION OF EARTH: a place's scenery in the browser (OVERHAUL.md §4.3). level.vis is pure
// data (Place.js); this turns it into a few merged meshes: one per shared surface (materials.js) and
// per fact condition. Every vertex carries its tint (a vertex colour), a world-projected UV (pieces of
// every size share one texture scale) and the years it stands in (aEra): the vertex shader drops the
// other years and small props beyond 90 m, so a year switch is one uniform and a place costs one draw
// call per surface. Vegetation is instanced: one draw call per kind, the instances of other years
// scaled to nothing. setEra(state) switches the year; refresh() re-reads the fact conditions.
import * as THREE from '../../../../vendor/three.module.min.js';
import { compileCondition } from '../../../core/conditions.js';
import { MATS, surfaceOf, surfaceMaterial, setEraBit, eraDepthMaterial } from './materials.js';

const _m = new THREE.Matrix4(), _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _t = new THREE.Color();
const PROP_RANGE = 90;

// --- the geometry of one piece, in world coordinates ------------------------------------------------------------
function prism(w, d, h, tw, td) {
  // a frustum from a w × d base at y 0 to a 2tw × 2td top at y h (td or tw 0: a ridge; both 0: a point)
  const b = [[-w / 2, 0, -d / 2], [w / 2, 0, -d / 2], [w / 2, 0, d / 2], [-w / 2, 0, d / 2]];
  const t = [[-tw, h, -td], [tw, h, -td], [tw, h, td], [-tw, h, td]];
  const tri = [];
  const quad = (a, b2, c, d2) => tri.push(a, b2, c, a, c, d2);
  quad(b[1], b[0], t[0], t[1]); // north slope
  quad(b[3], b[2], t[2], t[3]); // south slope
  quad(b[0], b[3], t[3], t[0]); // west
  quad(b[2], b[1], t[1], t[2]); // east
  if (tw > 0 && td > 0) quad(t[0], t[3], t[2], t[1]);
  const pos = new Float32Array(tri.length * 3);
  tri.forEach((v, i) => pos.set(v, i * 3));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.computeVertexNormals();
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  return g;
}

function gable(w, d, h) {
  const tri = [];
  const A = [-w / 2, 0, -d / 2], B = [w / 2, 0, -d / 2], C = [w / 2, 0, d / 2], Dd = [-w / 2, 0, d / 2], R0 = [0, h, -d / 2], R1 = [0, h, d / 2];
  tri.push(A, Dd, R1, A, R1, R0); // west slope
  tri.push(C, B, R0, C, R0, R1); // east slope
  tri.push(B, A, R0); // north gable
  tri.push(Dd, C, R1); // south gable
  const pos = new Float32Array(tri.length * 3);
  tri.forEach((v, i) => pos.set(v, i * 3));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.computeVertexNormals();
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  return g;
}

const place = (g, x, y, z, rx = 0, ry = 0, rz = 0) => {
  _e.set(rx, ry, rz, 'YXZ');
  _m.compose(_p.set(x, y, z), _q.setFromEuler(_e), _s.set(1, 1, 1));
  return g.applyMatrix4(_m);
};

export function pieceGeometry(v) {
  switch (v.k) {
    case 'box': {
      const [x0, y0, z0, x1, y1, z1] = v.b;
      return new THREE.BoxGeometry(Math.max(0.01, x1 - x0), Math.max(0.01, y1 - y0), Math.max(0.01, z1 - z0)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    }
    case 'obox':
      return place(new THREE.BoxGeometry(v.w, v.h, v.d).translate(0, v.h / 2, 0), v.x, v.y, v.z, v.rx, v.ry, v.rz);
    case 'cyl': {
      const seg = Math.max(3, v.seg || 12);
      return place(new THREE.CylinderGeometry(v.r2 ?? v.r, v.r, v.h, seg, 1, !!v.open).translate(0, v.h / 2, 0), v.x, v.y, v.z, v.rx, v.ry, v.rz);
    }
    case 'gable':
      return place(gable(v.w, v.d, v.h), v.x, v.y, v.z, 0, v.ry);
    case 'hip': {
      const top = v.top || 0;
      const tw = top ? (v.w / 2) * top : v.w >= v.d ? (v.w - v.d) / 2 : 0;
      const td = top ? (v.d / 2) * top : v.d > v.w ? (v.d - v.w) / 2 : 0;
      return place(prism(v.w, v.d, v.h, tw, td), v.x, v.y, v.z, 0, v.ry);
    }
    case 'dome':
      return new THREE.SphereGeometry(v.r, v.seg || 20, Math.max(4, (v.seg || 20) >> 1), 0, Math.PI * 2, 0, Math.PI / 2).scale(1, (v.h ?? v.r) / v.r, 1).translate(v.x, v.y, v.z);
    case 'torus':
      return place(new THREE.TorusGeometry(v.R, v.r, 6, v.seg || 48, v.arc ?? Math.PI * 2), v.x, v.y, v.z, v.rx, v.ry, v.rz);
    case 'plane': {
      const [x0, y, z0, x1, , z1] = v.b;
      return new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2);
    }
    case 'fan':
      // (a ring sector: RingGeometry's theta runs from +x toward +y, which lies flat toward -z)
      return new THREE.RingGeometry(Math.max(0.01, v.r0 || 0), v.r, v.seg || 24, 1, -v.a1, v.a1 - v.a0).rotateX(-Math.PI / 2).translate(v.x, v.y, v.z);
    case 'disc':
      return new THREE.CircleGeometry(v.r, v.seg || 32).rotateX(-Math.PI / 2).translate(v.x, v.y, v.z);
    case 'sphere':
      return new THREE.SphereGeometry(v.r, 12, 8).scale(1, v.sy || 1, 1).translate(v.x, v.y, v.z);
    case 'vault':
      // a barrel vault along x: an arc of a cylinder about the axis (x, y, z), `arc` radians centred on the top
      return new THREE.CylinderGeometry(v.r, v.r, v.len, 24, 1, true, Math.PI / 2 - v.arc / 2, v.arc).rotateZ(Math.PI / 2).translate(v.x, v.y, v.z);
    default:
      return null;
  }
}

// world-projected UVs (box mapping by the face normal) and the tint as vertex colours
const BITS = { PRESENT: 1, PAST: 2, FUTURE: 4 };
export const eraMask = (e) => (e ? e.reduce((a, s) => a | (BITS[s] || 0), 0) : 7);
function finish(g, v, mat, tint) {
  if (g.index) g = g.toNonIndexed();
  const pos = g.attributes.position, nor = g.attributes.normal;
  const n = pos.count;
  const uv = new Float32Array(n * 2), col = new Float32Array(n * 3), era = new Float32Array(n).fill(eraMask(v.e) + (v.p ? 8 : 0));
  const [tu, tv] = mat.userData.tile.length > 1 ? mat.userData.tile : [mat.userData.tile[0], mat.userData.tile[0]];
  const fit = mat.userData.fit;
  const old = g.attributes.uv;
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (fit && old) {
      uv[i * 2] = old.getX(i);
      uv[i * 2 + 1] = old.getY(i);
    } else {
      const ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i)), az = Math.abs(nor.getZ(i));
      if (ay >= ax && ay >= az) { uv[i * 2] = x / tu; uv[i * 2 + 1] = z / tu; }
      else if (ax >= az) { uv[i * 2] = z / tu; uv[i * 2 + 1] = y / tv; }
      else { uv[i * 2] = x / tu; uv[i * 2 + 1] = y / tv; }
    }
    col[i * 3] = tint.r;
    col[i * 3 + 1] = tint.g;
    col[i * 3 + 2] = tint.b;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aEra', new THREE.BufferAttribute(era, 1));
  return g;
}

function merge(geos) {
  let n = 0;
  for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3);
  const era = geos[0]?.attributes.aEra ? new Float32Array(n) : null;
  let o = 0;
  for (const g of geos) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    uv.set(g.attributes.uv.array, o * 2);
    col.set(g.attributes.color.array, o * 3);
    if (era) era.set(g.attributes.aEra.array, o);
    o += c;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (era) out.setAttribute('aEra', new THREE.BufferAttribute(era, 1));
  out.computeBoundingSphere();
  out.computeBoundingBox();
  return out;
}

// --- vegetation: one small merged model per kind (vertex colours: bark, leaves, straw) ----------------------------
const BARK = 0x5a4632, LEAF = 0x4a7a3a;
function part(geo, color, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  const g = (geo.index ? geo.toNonIndexed() : geo).scale(sx, sy, sz);
  _e.set(rx, 0, rz);
  g.applyMatrix4(_m.makeRotationFromEuler(_e)).translate(x, y, z);
  _c.setHex(color);
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([_c.r, _c.g, _c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  return g;
}
const trunk = (h, r, c = BARK) => part(new THREE.CylinderGeometry(r * 0.7, r, h, 6).translate(0, h / 2, 0), c);
const blob = (r, c, x, y, z, sy = 1) => part(new THREE.IcosahedronGeometry(r, 1), c, x, y, z, 1, sy, 1);
const blades = (n, h, c, spread = 0.3) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push(part(new THREE.ConeGeometry(0.05, h * (0.75 + 0.25 * Math.sin(i * 2.7)), 3).translate(0, h / 2, 0), c, Math.cos(a) * spread, 0, Math.sin(a) * spread, 1, 1, 1, Math.sin(a) * 0.25, -Math.cos(a) * 0.25));
  }
  return out;
};
const VEG = {
  plane: () => [trunk(4, 0.28, 0x8a8070), blob(2.3, 0x5a8a3a, 0, 5.6, 0, 0.8), blob(1.8, 0x4a7a32, 1.2, 6.6, 0.4), blob(1.6, 0x6a9a42, -1.1, 6.2, -0.6)],
  linden: () => [trunk(3, 0.22), blob(2.0, 0x4a7a36, 0, 4.4, 0, 1.25), blob(1.4, 0x5a8a3e, 0.6, 5.6, 0.2)],
  birch: () => [trunk(5, 0.14, 0xe8e4dc), blob(1.4, 0x7aa04a, 0, 5.4, 0, 1.4), blob(1.0, 0x8aac52, 0.4, 6.4, 0.1)],
  cypress: () => [trunk(1, 0.2), part(new THREE.ConeGeometry(0.95, 8, 7).translate(0, 4.8, 0), 0x2e4a2a), part(new THREE.ConeGeometry(0.7, 3, 7).translate(0, 7.6, 0), 0x34522e)],
  olive: () => [trunk(1.8, 0.26, 0x6a5a48), blob(1.8, 0x8a9a72, 0, 2.6, 0, 0.6), blob(1.3, 0x7a8a66, 1.0, 2.9, 0.5, 0.6), blob(1.2, 0x96a47c, -0.9, 2.7, -0.4, 0.6)],
  willow: () => [trunk(2.6, 0.3), blob(2.6, 0x6a8a42, 0, 3.6, 0, 0.9), part(new THREE.CylinderGeometry(2.4, 3.0, 2.6, 8, 1, true).translate(0, 2.4, 0), 0x5a7a3a)],
  blossom: () => [trunk(2.8, 0.2, 0x5a4034), blob(1.9, 0xf0c0d0, 0, 4.0, 0, 0.8), blob(1.4, 0xf8d4e0, 0.9, 4.6, 0.3), blob(1.2, 0xe8b0c4, -0.8, 4.4, -0.5)],
  bareTree: () => [trunk(4.5, 0.24, 0x4a3e36), ...[0, 1.6, 3.2, 4.6].map((a, i) => part(new THREE.CylinderGeometry(0.05, 0.1, 2.6, 4).translate(0, 1.3, 0), 0x4a3e36, 0, 2.6 + i * 0.5, 0, 1, 1, 1, Math.cos(a) * 0.7, Math.sin(a) * 0.7))],
  shrub: () => [blob(0.8, 0x4a6a34, 0, 0.5, 0, 0.7), blob(0.6, 0x5a7a3a, 0.5, 0.6, 0.2, 0.7)],
  grass: () => blades(7, 1.2, 0x9a9a52, 0.25),
  barley: () => blades(9, 1.1, 0xd8b860, 0.35),
  reeds: () => blades(8, 2.2, 0x6a8a4a, 0.3),
  fern: () => [blob(0.7, 0x3a6a2a, 0, 0.35, 0, 0.45), blob(0.5, 0x4a7a32, 0.4, 0.4, 0.2, 0.45)],
  palm: () => [trunk(6, 0.22, 0x8a7a5a), blob(1.6, 0x4a7a32, 0, 6.4, 0, 0.4)],
  // (U3) the dam's gorge, the hospital's courts, the port's meadow, the desert, Mira's garden
  pine: () => [trunk(2, 0.22, 0x4a3a2a), part(new THREE.ConeGeometry(1.8, 3.4, 8).translate(0, 3.4, 0), 0x2a4a34), part(new THREE.ConeGeometry(1.4, 3.0, 8).translate(0, 5.2, 0), 0x2e5038), part(new THREE.ConeGeometry(0.9, 2.4, 8).translate(0, 6.8, 0), 0x345a3e)],
  magnolia: () => [trunk(2.2, 0.2, 0x5a4a40), blob(1.7, 0xf4e4ec, 0, 3.3, 0, 0.8), blob(1.2, 0xfaf0f4, 0.9, 3.8, 0.4), blob(1.1, 0xead0dc, -0.8, 3.6, -0.5), blob(0.9, 0x5a7a44, 0.2, 2.8, 0.9)],
  wildflower: () => [...blades(6, 0.7, 0x7a9a4a, 0.25), blob(0.12, 0xe8c040, 0.2, 0.75, 0), blob(0.11, 0xd84a3a, -0.2, 0.7, 0.15), blob(0.1, 0xf4f0f0, 0, 0.8, -0.2), blob(0.11, 0x8a6ad8, 0.1, 0.65, 0.22)],
  scrub: () => [blob(0.6, 0x8a8a5a, 0, 0.35, 0, 0.55), blob(0.45, 0x9a9462, 0.4, 0.3, 0.2, 0.55), blob(0.4, 0x7a7a50, -0.3, 0.28, -0.2, 0.55)],
  flowers: () => [blob(0.45, 0x4a7a3a, 0, 0.3, 0, 0.6), blob(0.16, 0xf06a8a, 0.2, 0.55, 0.1), blob(0.15, 0xffd040, -0.2, 0.5, -0.1), blob(0.14, 0xf8f8f0, 0.05, 0.6, -0.25)],
};
let vegMat = null;
function vegGeometry(kind) {
  const parts = (VEG[kind] || VEG.shrub)();
  for (const p of parts) if (!p.attributes.normal) p.computeVertexNormals();
  return merge(parts.map((p) => (p.index ? p.toNonIndexed() : p)));
}

// --- the scenery ----------------------------------------------------------------------------------------------
export class Scenery {
  constructor(level, root, ctx) {
    this.level = level;
    this.root = new THREE.Group();
    this.root.name = 'lvScenery';
    root.add(this.root);
    this.ctx = ctx; // () => { fact, state } for the place's own room
    this.meshes = [];
    this.veg = [];
    this.state = null;
    const groups = new Map();
    for (const v of level.vis) {
      const s = surfaceOf(v.m);
      const key = `${s}|${v.when || ''}`;
      if (!groups.has(key)) groups.set(key, { s, when: v.when || null, geos: [], mask: 0 });
      const grp = groups.get(key);
      let g = pieceGeometry(v);
      if (!g) continue;
      const mat = surfaceMaterial(s);
      _c.setHex(MATS[v.m]?.c ?? 0x888888);
      if (v.t !== undefined) _c.multiply(_t.setHex(v.t));
      g = finish(g, v, mat, _c);
      grp.geos.push(g);
      grp.mask |= eraMask(v.e);
    }
    for (const grp of groups.values()) {
      if (!grp.geos.length) continue;
      const mat = surfaceMaterial(grp.s);
      const mesh = new THREE.Mesh(merge(grp.geos), mat);
      mesh.castShadow = mat.userData.cast;
      mesh.receiveShadow = !mat.transparent;
      if (mesh.castShadow) mesh.customDepthMaterial = eraDepthMaterial();
      if (mat.transparent) mesh.renderOrder = 2;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      mesh.frustumCulled = false; // (its vertices are culled per year in the shader; the place is round you)
      this.root.add(mesh);
      this.meshes.push({ mesh, mask: grp.mask, cond: grp.when ? compileCondition(grp.when) : null });
    }
    // vegetation, instanced per kind
    vegMat ||= Object.assign(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), { userData: { keep: true } });
    const kinds = new Map();
    for (const t of level.veg) {
      if (!kinds.has(t.k)) kinds.set(t.k, []);
      kinds.get(t.k).push(t);
    }
    for (const [k, list] of kinds) {
      const inst = new THREE.InstancedMesh(vegGeometry(k), vegMat, list.length);
      inst.castShadow = !['grass', 'barley', 'reeds', 'fern', 'wildflower', 'scrub', 'flowers'].includes(k);
      inst.receiveShadow = true;
      inst.frustumCulled = false;
      this.root.add(inst);
      this.veg.push({ inst, list: list.map((t) => ({ ...t, cond: t.when ? compileCondition(t.when) : null })) });
    }
  }

  // which year: a group shows only in its years, and only while its fact condition holds
  setEra(state) {
    if (state === this.state) return;
    this.state = state;
    this.refresh();
  }

  refresh() {
    const c = this.ctx();
    const st = this.state || c.state;
    const bit = setEraBit(st);
    for (const m of this.meshes) m.mesh.visible = !!(m.mask & bit) && (!m.cond || !!m.cond(c));
    for (const v of this.veg) {
      v.list.forEach((t, i) => {
        const on = (!t.e || t.e.includes(st)) && (!t.cond || !!t.cond(c));
        _e.set(0, t.r || 0, 0);
        _m.compose(_p.set(t.x, t.y, t.z), _q.setFromEuler(_e), _s.setScalar(on ? t.s : 0));
        v.inst.setMatrixAt(i, _m);
      });
      v.inst.instanceMatrix.needsUpdate = true;
      v.inst.computeBoundingSphere();
    }
  }

  update() {}

  // what is drawn: draw calls and triangles of the visible scenery (for the perf numbers)
  stats() {
    let calls = 0, tris = 0;
    for (const m of this.meshes) if (m.mesh.visible) { calls++; tris += m.mesh.geometry.attributes.position.count / 3; }
    for (const v of this.veg) { calls++; tris += (v.inst.geometry.attributes.position.count / 3) * v.list.length; }
    return { calls, tris: Math.round(tris), meshes: this.meshes.length };
  }

  dispose() {
    this.root.parent?.remove(this.root);
    this.root.traverse((o) => o.geometry?.dispose());
  }
}

export { PROP_RANGE };
