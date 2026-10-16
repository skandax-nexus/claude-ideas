// Procedural humans for AFTERZERO: realistic proportions, real faces and
// futuristic costumes, generated entirely from code (no downloaded assets).
//
// Technique: every body part is sculpted as an analytic surface (loft of
// shaped cross-sections, deformed sphere for the head) in a bind pose, tagged
// with the joint it rides on, and merged per material into ONE rigidly skinned
// mesh per material. A character is therefore ~6 draw calls (skin, suit,
// armour, hair, eyes, light lines) no matter how many parts the costume has,
// while the skeleton is a plain hierarchy of joints that is cheap to animate.
// Colours live in vertex colours, so materials and textures are shared by
// every character on screen.
import * as THREE from '../../vendor/three.module.min.js';

// ------------------------------------------------------------------ helpers
const TAU = Math.PI * 2;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const gauss = (x, s) => Math.exp(-(x * x) / (s * s));
const wrapPi = (a) => {
  a = (a + Math.PI) % TAU;
  if (a < 0) a += TAU;
  return a - Math.PI;
};
const bump = (p, c, w) => gauss(wrapPi(p - c), w);
const damp = (cur, tgt, k, dt) => cur + (tgt - cur) * (1 - Math.exp(-k * dt));
const lin = (n, a = 0, b = 1) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
const mixHex = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t).getHex();
const _v = new THREE.Vector3();
const _w0 = new THREE.Vector3(); // scratch for surface wrappers (surf() owns _p0.._p4)

// ----------------------------------------------------------- shared assets
let _tex = null;
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function textures() {
  if (_tex) return _tex;
  let seed = 1234567;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // Suit fabric: fine twill weave, one panel seam each way with stitching.
  const S = 256;
  const fc = canvas(S, S);
  const g = fc.getContext('2d');
  const img = g.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const tw = ((x + y) & 3) < 2 ? 1 : 0;
      const v = 250 - tw * 9 - rnd() * 7;
      const i = (y * S + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  g.strokeStyle = 'rgba(40,40,40,0.28)';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, S * 0.5);
  g.lineTo(S, S * 0.5);
  g.moveTo(S * 0.5, 0);
  g.lineTo(S * 0.5, S);
  g.stroke();
  g.strokeStyle = 'rgba(40,40,40,0.16)';
  g.lineWidth = 1;
  g.setLineDash([4, 3]);
  g.beginPath();
  g.moveTo(0, S * 0.5 + 6);
  g.lineTo(S, S * 0.5 + 6);
  g.moveTo(S * 0.5 + 6, 0);
  g.lineTo(S * 0.5 + 6, S);
  g.stroke();
  const fabric = new THREE.CanvasTexture(fc);
  fabric.wrapS = fabric.wrapT = THREE.RepeatWrapping;
  fabric.colorSpace = THREE.SRGBColorSpace;
  fabric.anisotropy = 4;

  // Hair: fine strands running along v, with clumped light/dark streaks.
  const hc = canvas(256, 64);
  const h = hc.getContext('2d');
  const hi = h.createImageData(256, 64);
  const cols = [];
  let lo = 0.8;
  for (let x = 0; x < 256; x++) {
    lo = lo * 0.7 + (0.55 + rnd() * 0.45) * 0.3;
    cols.push(lo * (0.85 + rnd() * 0.15));
  }
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 256; x++) {
      const v = Math.round(255 * clamp(cols[x] * (0.95 + 0.05 * Math.sin(y * 0.4 + x)), 0, 1));
      const i = (y * 256 + x) * 4;
      hi.data[i] = hi.data[i + 1] = hi.data[i + 2] = v;
      hi.data[i + 3] = 255;
    }
  }
  h.putImageData(hi, 0, 0);
  const hair = new THREE.CanvasTexture(hc);
  hair.wrapS = hair.wrapT = THREE.RepeatWrapping;
  hair.colorSpace = THREE.SRGBColorSpace;
  hair.anisotropy = 4;
  _tex = { fabric, hair };
  return _tex;
}

const _mats = new Map();
const cached = (key, make) => {
  let m = _mats.get(key);
  if (!m) _mats.set(key, (m = make()));
  return m;
};
// Shared clock for the hologram shimmer (advanced by any animating character).
const holoTime = { value: 0 };

function materials() {
  const tx = textures();
  return {
    skin: cached('skin', () => {
      const m = new THREE.MeshPhysicalMaterial({
        vertexColors: true, roughness: 0.55, sheen: 0.18, sheenRoughness: 0.5,
        sheenColor: new THREE.Color(0xff9a80), specularIntensity: 0.5,
      });
      // cheap subsurface: a little of the albedo glows back warm in the shadows
      m.onBeforeCompile = (sh) => {
        sh.fragmentShader = sh.fragmentShader.replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * vec3(0.07, 0.025, 0.015);',
        );
      };
      return m;
    }),
    suit: cached('suit', () => new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.68, metalness: 0, map: tx.fabric, bumpMap: tx.fabric, bumpScale: 1.2,
    })),
    armor: cached('armor', () => new THREE.MeshPhysicalMaterial({
      vertexColors: true, roughness: 0.3, metalness: 0.05, clearcoat: 0.9, clearcoatRoughness: 0.12,
    })),
    hair: cached('hair', () => new THREE.MeshPhysicalMaterial({
      vertexColors: true, roughness: 0.48, map: tx.hair, bumpMap: tx.hair, bumpScale: 2.0,
      sheen: 0.6, sheenRoughness: 0.35, sheenColor: new THREE.Color(0xffffff), specularIntensity: 0.5,
    })),
    eye: cached('eye', () => new THREE.MeshPhysicalMaterial({
      vertexColors: true, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.03,
    })),
    glow: cached('glow', () => new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })),
    visor: cached('visor', () => new THREE.MeshPhysicalMaterial({
      color: 0xd8f0ff, transparent: true, opacity: 0.16, roughness: 0.04, clearcoat: 1,
      depthWrite: false, side: THREE.DoubleSide,
    })),
  };
}

function holoMaterial(hex) {
  return cached('holo' + hex, () => {
    const c = new THREE.Color(hex);
    const m = new THREE.MeshStandardMaterial({
      color: c, vertexColors: true, emissive: c, emissiveIntensity: 1, roughness: 0.45,
      transparent: true, opacity: 0.62, depthWrite: true,
    });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uHoloT = holoTime;
      sh.fragmentShader = 'uniform float uHoloT;\n' + sh.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float hFr = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.0);
        float hScan = 0.78 + 0.22 * sin(gl_FragCoord.y * 0.85 - uHoloT * 7.0);
        float hLum = dot(vColor.rgb, vec3(0.3, 0.59, 0.11));
        totalEmissiveRadiance = emissive * ((0.12 + 0.55 * hLum) * hScan + hFr * 1.1);
        diffuseColor.a = clamp(diffuseColor.a * (0.6 + 0.4 * hLum) * hScan + hFr * 0.45, 0.0, 1.0);`,
      );
    };
    return m;
  });
}

// --------------------------------------------------------- surface builder
// A "ring function" lofts smooth cross-sections along a vertical axis.
// rings: [y, halfWidth, frontDepth, backDepth, centreX, centreZ] (y decreasing)
// fn(t, a) -> point, with t in [0,1] from first to last ring and a the angle
// around the axis (0 = front +Z, +PI/2 = +X).
function ringFn(rings, { sq = 1, bumpFn = null } = {}) {
  const n = rings.length;
  const y0 = rings[0][0], y1 = rings[n - 1][0];
  const val = (i, f) => rings[clamp(i, 0, n - 1)][f] ?? 0;
  const p = [0, 0, 0, 0, 0, 0];
  const fn = (t, a, out) => {
    t = clamp(t, 0, 1);
    const y = y0 + (y1 - y0) * t;
    let i = 0;
    while (i < n - 2 && y < rings[i + 1][0]) i++;
    const ya = rings[i][0], yb = rings[i + 1][0];
    const s = clamp((ya - y) / (ya - yb), 0, 1);
    const s2 = s * s, s3 = s2 * s;
    for (let f = 1; f < 6; f++) {
      const p0 = val(i - 1, f), p1 = val(i, f), p2 = val(i + 1, f), p3 = val(i + 2, f);
      const m1 = (p2 - p0) * 0.5, m2 = (p3 - p1) * 0.5;
      p[f] = (2 * s3 - 3 * s2 + 1) * p1 + (s3 - 2 * s2 + s) * m1 + (-2 * s3 + 3 * s2) * p2 + (s3 - s2) * m2;
    }
    // poles stay poles (no cubic overshoot)
    const w = Math.max(0, p[1]);
    const sn = Math.sin(a), cs = Math.cos(a);
    const d = lerp(Math.max(0, p[3]), Math.max(0, p[2]), sstep(-0.35, 0.35, cs));
    let x = sq === 1 ? w * sn : w * Math.sign(sn) * Math.pow(Math.abs(sn), sq);
    let z = sq === 1 ? d * cs : d * Math.sign(cs) * Math.pow(Math.abs(cs), sq);
    if (bumpFn) {
      const b = bumpFn(y, wrapPi(a), w);
      x += sn * b;
      z += cs * b;
    }
    out.set(p[4] + x, y, p[5] + z);
    return out;
  };
  fn.tAt = (y) => (y0 - y) / (y0 - y1);
  return fn;
}

// Grid surface from fn(t, a). Rows run "down" the axis, columns go from the
// front towards +X: that orientation always gives outward-facing triangles.
// off(t, a, u, v) pushes points along the surface normal (plates, glow lines).
// keep(t, a) masks out regions (hairlines, openings).
const _p0 = new THREE.Vector3(), _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3();
const _p3 = new THREE.Vector3(), _p4 = new THREE.Vector3(), _n = new THREE.Vector3();
function surf(fn, { ts = lin(12), as = lin(16, -Math.PI, Math.PI), off = null, keep = null, uvScale = null } = {}) {
  const nt = ts.length, na = as.length;
  const pos = new Float32Array(nt * na * 3);
  const tp = new Float32Array(nt * na), ap = new Float32Array(nt * na);
  const tMin = Math.min(ts[0], ts[nt - 1]), tMax = Math.max(ts[0], ts[nt - 1]);
  const te = (tMax - tMin) * 0.004 + 1e-5;
  const ae = 2e-3;
  const inside = keep ? new Uint8Array(nt * na) : null;
  for (let i = 0; i < nt; i++) {
    for (let j = 0; j < na; j++) {
      const t = ts[i], a = as[j], k = i * na + j;
      fn(t, a, _p0);
      if (off) {
        const o = off(t, a, i / (nt - 1), j / Math.max(1, na - 1));
        if (o !== 0) {
          const tc = clamp(t, tMin + te * 2, tMax - te * 2);
          fn(Math.min(tc + te, tMax), a, _p1);
          fn(Math.max(tc - te, tMin), a, _p2);
          fn(tc, a + ae, _p3);
          fn(tc, a - ae, _p4);
          _p1.sub(_p2); // d/dt (down)
          _p3.sub(_p4); // d/da (towards +X)
          _n.crossVectors(_p1, _p3);
          if (_n.lengthSq() < 1e-14) _n.set(Math.sin(a), 0, Math.cos(a));
          _n.normalize();
          _p0.addScaledVector(_n, o);
        }
      }
      pos[k * 3] = _p0.x;
      pos[k * 3 + 1] = _p0.y;
      pos[k * 3 + 2] = _p0.z;
      tp[k] = t;
      ap[k] = a;
      if (keep) inside[k] = keep(t, a) ? 1 : 0;
    }
  }
  const idx = [];
  for (let i = 0; i < nt - 1; i++) {
    for (let j = 0; j < na - 1; j++) {
      const a = i * na + j, b = (i + 1) * na + j, c = (i + 1) * na + j + 1, d = i * na + j + 1;
      if (keep && !(inside[a] | inside[b] | inside[c] | inside[d])) continue;
      idx.push(a, b, d, b, c, d);
    }
  }
  // uv in metres * 2 (one fabric tile = 0.5 m): arc length around, length down
  const uv = new Float32Array(nt * na * 2);
  for (let i = 0; i < nt; i++) {
    let acc = 0;
    for (let j = 0; j < na; j++) {
      const k = i * na + j;
      if (j > 0) acc += Math.hypot(pos[k * 3] - pos[k * 3 - 3], pos[k * 3 + 1] - pos[k * 3 - 2], pos[k * 3 + 2] - pos[k * 3 - 1]);
      uv[k * 2] = acc * 2;
    }
  }
  const mj = Math.floor(na / 2);
  for (let j = 0; j < na; j++) {
    let acc = 0;
    for (let i = 0; i < nt; i++) {
      const k = i * na + j, km = i * na + mj, kp = (i - 1) * na + mj;
      if (i > 0) acc += Math.hypot(pos[km * 3] - pos[kp * 3], pos[km * 3 + 1] - pos[kp * 3 + 1], pos[km * 3 + 2] - pos[kp * 3 + 2]);
      uv[k * 2 + 1] = acc * 2;
    }
  }
  if (uvScale) {
    // parametric uv (hair: strands follow the columns exactly)
    for (let i = 0; i < nt; i++) {
      for (let j = 0; j < na; j++) {
        const k = i * na + j;
        uv[k * 2] = (j / (na - 1)) * uvScale[0];
        uv[k * 2 + 1] = (i / (nt - 1)) * uvScale[1];
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  weldNormals(geo);
  geo.userData.tp = tp;
  geo.userData.ap = ap;
  return geo;
}

// Average normals of coincident vertices (wrap seam, poles) for smooth shading.
function weldNormals(geo) {
  const p = geo.attributes.position, n = geo.attributes.normal;
  const map = new Map();
  for (let i = 0; i < p.count; i++) {
    const key = `${Math.round(p.getX(i) * 1e5)},${Math.round(p.getY(i) * 1e5)},${Math.round(p.getZ(i) * 1e5)}`;
    let e = map.get(key);
    if (!e) map.set(key, (e = { x: 0, y: 0, z: 0, ids: [] }));
    e.x += n.getX(i);
    e.y += n.getY(i);
    e.z += n.getZ(i);
    e.ids.push(i);
  }
  for (const e of map.values()) {
    if (e.ids.length < 2) continue;
    const l = Math.hypot(e.x, e.y, e.z) || 1;
    for (const i of e.ids) n.setXYZ(i, e.x / l, e.y / l, e.z / l);
  }
}

// Transform a primitive geometry into place.
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _m4 = new THREE.Matrix4();
function place(geo, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  _q.setFromEuler(_e.set(rx, ry, rz));
  geo.applyMatrix4(_m4.compose(_v.set(x, y, z), _q, new THREE.Vector3(sx, sy, sz)));
  return geo;
}
// Rounded box (superellipsoid) centred at origin with half sizes.
function roundBox(hx, hy, hz, e = 0.35, ws = 14, hs = 10) {
  const g = new THREE.SphereGeometry(1, ws, hs);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const f = (u) => Math.sign(u) * Math.pow(Math.abs(u), e);
    p.setXYZ(i, f(x) * hx, f(y) * hy, f(z) * hz);
  }
  g.computeVertexNormals();
  weldNormals(g);
  return g;
}

// ------------------------------------------------------------------- rig
class Rig {
  constructor() {
    this.bones = [];
    this.by = {};
    this.abs = {};
    this.slots = {};
  }
  bone(name, parent, x, y, z) {
    const b = new THREE.Bone();
    b.name = name;
    b.userData.idx = this.bones.length;
    this.bones.push(b);
    this.by[name] = b;
    this.abs[name] = new THREE.Vector3(x, y, z);
    if (parent) {
      const pa = this.abs[parent];
      b.position.set(x - pa.x, y - pa.y, z - pa.z);
      this.by[parent].add(b);
    } else b.position.set(x, y, z);
    return b;
  }
  // color: hex, or fn(point, t, a) -> hex | THREE.Color (linear)
  add(slot, geo, bone, color = 0xffffff, flip = false) {
    let S = this.slots[slot];
    if (!S) S = this.slots[slot] = { pos: [], nor: [], uv: [], col: [], bi: [], idx: [] };
    if (!geo.attributes.normal) geo.computeVertexNormals();
    const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
    const base = S.pos.length / 3;
    const bi = this.by[bone].userData.idx;
    const tp = geo.userData.tp, ap = geo.userData.ap;
    const c = new THREE.Color();
    const fl = flip ? -1 : 1;
    for (let i = 0; i < p.count; i++) {
      _v.fromBufferAttribute(p, i);
      S.pos.push(_v.x, _v.y, _v.z);
      S.nor.push(n.getX(i) * fl, n.getY(i) * fl, n.getZ(i) * fl);
      if (uv) S.uv.push(uv.getX(i), uv.getY(i));
      else S.uv.push(0, 0);
      if (typeof color === 'function') {
        const r = color(_v, tp ? tp[i] : 0, ap ? ap[i] : 0);
        if (r && r.isColor) c.copy(r);
        else c.setHex(r);
      } else if (color && color.isColor) c.copy(color);
      else c.setHex(color);
      S.col.push(c.r, c.g, c.b);
      S.bi.push(bi);
    }
    const ix = geo.index ? geo.index.array : Array.from({ length: p.count }, (_, i) => i);
    for (let i = 0; i < ix.length; i += 3) {
      if (flip) S.idx.push(base + ix[i], base + ix[i + 2], base + ix[i + 1]);
      else S.idx.push(base + ix[i], base + ix[i + 1], base + ix[i + 2]);
    }
  }
  // same surface twice: outside + inner lining (for coat panels, collars)
  add2(slot, geo, bone, color, lining) {
    this.add(slot, geo, bone, color);
    this.add(slot, geo, bone, lining, true);
  }
}

// ----------------------------------------------------------- presets
export const CAST_SPECS = {
  ren: {
    height: 1.72, build: 'slim', sex: 'f', skin: 0xd9a57f, hair: 0x2f2522, hairStyle: 'bob', eyes: 0x5a3a26,
    suit: 0xf4f7fa, trim: 0xff8a6a, glow: 0xff9d7a, armor: 0xe9eef3, costume: 'explorer',
  },
  juno: {
    height: 1.68, build: 'average', sex: 'f', skin: 0xf0c8a8, hair: 0x8a3f24, hairStyle: 'ponytail', eyes: 0x4f7a5a,
    suit: 0x4fae84, trim: 0xe8d8b8, glow: 0x7fffd0, armor: 0xe8eef0, costume: 'engineer',
  },
  varga: {
    height: 1.78, build: 'average', sex: 'm', skin: 0xc68a62, hair: 0xc8c8c8, hairStyle: 'short', beard: true,
    eyes: 0x4a5a6a, age: 0.8, suit: 0xb9b2e8, trim: 0xf6f7fb, glow: 0x9f8cff, armor: 0xeef0f6, costume: 'scientist',
  },
  custodian: {
    height: 1.9, build: 'average', sex: 'n', skin: 0xd8b8a0, hair: 0x6ff0d4, hairStyle: 'bald', eyes: 0x6ff0d4,
    suit: 0xdff8f2, trim: 0x9ff0dc, glow: 0x6ff0d4, armor: 0xe8fbf6, costume: 'robe', hologram: true,
  },
  other: {
    height: 1.72, build: 'slim', sex: 'f', skin: 0xd9a57f, hair: 0x2f2522, hairStyle: 'bob', eyes: 0x5a3a26,
    suit: 0xf4f7fa, trim: 0xff8a6a, glow: 0xc7a2ff, armor: 0xe9eef3, costume: 'explorer', hologram: true,
  },
};

const COSTUME_DEFAULTS = {
  explorer: { suit: 0xf4f7fa, trim: 0x7fc8d8, glow: 0x9fe8ff, armor: 0xe9eef3 },
  engineer: { suit: 0x4fae84, trim: 0xe8d8b8, glow: 0x7fffd0, armor: 0xe8eef0 },
  scientist: { suit: 0xb9b2e8, trim: 0xf6f7fb, glow: 0x9f8cff, armor: 0xeef0f6 },
  security: { suit: 0x8297b3, trim: 0x5d7898, glow: 0x8fd8ff, armor: 0xe9eef3 },
  pilot: { suit: 0x9cc8ec, trim: 0xf2f5f8, glow: 0xffd27a, armor: 0xf2f5f8 },
  medic: { suit: 0xf6f8fa, trim: 0x5fcfc0, glow: 0x7ff5e0, armor: 0xeef4f6 },
  robe: { suit: 0xe9e6f4, trim: 0xb7a8e8, glow: 0xc7b2ff, armor: 0xf2f0fa },
};

const SKIN_TONES = [0xf7e0d0, 0xf1c9aa, 0xe8b894, 0xdcab84, 0xcf9a72, 0xc08560, 0xa86e4c, 0x8f5a3c, 0x75462f, 0x5c3725, 0x47291c];
const HAIR_COLS = [0x1d1918, 0x2c2220, 0x3d2c22, 0x5a3e2b, 0x7a4a2a, 0x8a3f24, 0xb08a5a, 0xd2b47e, 0xe4d9c4, 0xa8a8a8, 0x9a86d8, 0x6fb8c8];
const EYE_COLS = [0x3b2a1e, 0x5a3a22, 0x6e4e2c, 0x7a6a3a, 0x5f8a5a, 0x4f7aa8, 0x6a8aa8, 0x8a96a2];
const PALETTES = {
  explorer: [[0xf4f7fa, 0xff8a6a, 0xff9d7a], [0xf4f7fa, 0x7fc8d8, 0x9fe8ff], [0xeef0f8, 0xa99bea, 0xc2b2ff], [0xf6f6f2, 0xf2c45a, 0xffe08a]],
  engineer: [[0x4fae84, 0xe8d8b8, 0x7fffd0], [0xe8a25a, 0xf0e2c8, 0xffd27a], [0x6f9fc8, 0xe8dcc6, 0x9fe8ff], [0xc9b27a, 0x6d7f8e, 0xffe08a]],
  scientist: [[0xb9b2e8, 0xf6f7fb, 0x9f8cff], [0x9fd0e6, 0xf6f7fb, 0x8fe0ff], [0xc8e6c8, 0xf6f7fb, 0x9fffc8], [0xf0c8d8, 0xf6f7fb, 0xffa8d0]],
  security: [[0x8297b3, 0x5d7898, 0x8fd8ff], [0x8aa89a, 0x5e7d70, 0x9fffd8], [0x9a92b8, 0x6b6290, 0xc8b2ff]],
  pilot: [[0x9cc8ec, 0xf2f5f8, 0xffd27a], [0xa8b4ec, 0xf2f5f8, 0xffe0a0], [0xb7e0c8, 0xf2f5f8, 0x9fffe0]],
  medic: [[0xf6f8fa, 0x5fcfc0, 0x7ff5e0], [0xf6f8fa, 0x6fb0e8, 0x9fd8ff], [0xf6f8fa, 0xf08a9a, 0xffb0c0]],
};

/** A random, tasteful crew member. rand: seeded () => [0,1). */
export function randomCrewSpec(rand = Math.random) {
  const pick = (a) => a[Math.floor(rand() * a.length) % a.length];
  const r = rand();
  const sex = r < 0.46 ? 'f' : r < 0.92 ? 'm' : 'n';
  const costume = pick(['explorer', 'engineer', 'scientist', 'security', 'pilot', 'medic']);
  const [suit, trim, glow] = pick(PALETTES[costume]);
  const styles = sex === 'f'
    ? ['bob', 'ponytail', 'long', 'bun', 'short', 'undercut', 'bun', 'ponytail']
    : sex === 'm' ? ['short', 'buzz', 'undercut', 'short', 'bald', 'ponytail', 'bun'] : ['short', 'bob', 'undercut', 'buzz', 'bun'];
  const age = rand() < 0.15 ? 0.6 + rand() * 0.3 : rand() * 0.5;
  let hair = pick(HAIR_COLS);
  if (age > 0.65 && rand() < 0.7) hair = pick([0xa8a8a8, 0xc8c8c8, 0x8a8a8a]);
  return {
    height: +(sex === 'f' ? 1.6 + rand() * 0.14 : sex === 'm' ? 1.7 + rand() * 0.16 : 1.64 + rand() * 0.16).toFixed(2),
    build: pick(['slim', 'average', 'average', 'broad']),
    sex,
    skin: pick(SKIN_TONES),
    hair,
    hairStyle: pick(styles),
    eyes: pick(EYE_COLS),
    beard: sex === 'm' && rand() < 0.3,
    age,
    suit, trim, glow,
    armor: costume === 'security' ? 0xe9eef3 : pick([0xeef2f6, 0xe9eef3, 0xf2f0ea]),
    costume,
    helmet: false,
    headgear: rand() < 0.6,
  };
}

// --------------------------------------------------------------- builder
/**
 * Build a procedural human. Origin at the feet, facing +Z, +X = character's left.
 * See CAST_SPECS for the spec fields.
 */
export function makeHuman(spec = {}) {
  const costume = spec.costume || 'explorer';
  const cd = COSTUME_DEFAULTS[costume] || COSTUME_DEFAULTS.explorer;
  const S = {
    height: 1.75, build: 'average', sex: 'n', skin: 0xd9a57f, hair: 0x3a2a22, hairStyle: 'short',
    eyes: 0x5a3a26, beard: false, age: 0.3, hologram: false, helmet: false, headgear: true, ...cd, ...spec, costume,
  };
  const k = S.height / 1.75;
  const f = S.sex === 'f' ? 1 : S.sex === 'm' ? 0 : 0.5; // femininity of the frame
  const bw = S.build === 'slim' ? 0.93 : S.build === 'broad' ? 1.1 : 1;
  const bs = 1 + (bw - 1) * 0.6; // skeleton widths change less than flesh
  const R = new Rig();

  // ---------------------------------------------------------- dimensions
  const D = {
    sx: lerp(0.188, 0.168, f) * bs, // shoulder joint x
    hx: lerp(0.088, 0.094, f) * bs, // hip joint x
    kx: lerp(0.082, 0.08, f) * bs, // knee / ankle x
    cw: lerp(0.152, 0.138, f) * bw, // chest half width
    cdF: lerp(0.102, 0.094, f) * bw,
    cdB: lerp(0.086, 0.08, f) * bw,
    ww: lerp(0.132, 0.114, f) * bw, // waist
    wd: lerp(0.088, 0.082, f) * bw,
    hw: lerp(0.155, 0.168, f) * bw, // hips
    hdF: lerp(0.088, 0.09, f) * bw,
    hdB: lerp(0.098, 0.108, f) * bw,
    arm: lerp(1.06, 0.9, f) * bw,
    leg: lerp(1.02, 1.0, f) * bw,
    neck: lerp(0.057, 0.048, f) * (0.9 + bw * 0.1),
  };
  const C = new THREE.Vector3(0, 1.635, 0.012); // head centre

  // ------------------------------------------------------------- skeleton
  R.bone('root', null, 0, 0, 0);
  R.bone('hips', 'root', 0, 0.95, 0);
  R.bone('spine', 'hips', 0, 1.08, 0);
  R.bone('chest', 'spine', 0, 1.25, 0);
  R.bone('ribs', 'chest', 0, 1.25, 0);
  R.bone('neck', 'chest', 0, 1.47, -0.008);
  R.bone('head', 'neck', 0, 1.54, 0.0);
  R.bone('jaw', 'head', 0, 1.6, 0.0);
  const eyeR = 0.0142;
  const EX = 0.0325; // eye centre x
  for (const [s, L] of [[1, 'L'], [-1, 'R']]) {
    R.bone('shoulder' + L, 'chest', s * D.sx, 1.432, -0.015);
    R.bone('elbow' + L, 'shoulder' + L, s * D.sx, 1.155, -0.022);
    R.bone('wrist' + L, 'elbow' + L, s * D.sx, 0.9, -0.012);
    R.bone('fingers' + L, 'wrist' + L, s * D.sx, 0.812, -0.006);
    R.bone('thigh' + L, 'hips', s * D.hx, 0.92, 0);
    R.bone('knee' + L, 'thigh' + L, s * D.kx, 0.49, 0.0);
    R.bone('ankle' + L, 'knee' + L, s * D.kx, 0.08, -0.012);
    R.bone('toe' + L, 'ankle' + L, s * D.kx, 0.028, 0.128);
    R.bone('tail' + L, 'hips', s * 0.07, 1.0, 0);
  }
  R.bone('tailF', 'hips', 0, 1.0, 0.05);
  R.bone('tailB', 'hips', 0, 1.0, -0.05);
  R.bone('pony', 'head', 0, C.y + 0.03, C.z - 0.098);

  const skin = mixHex(S.skin, 0x6a3a28, 0.1); // a touch deeper: reads true under bright ACES lighting
  const lipCol = mixHex(mixHex(skin, 0xc4606a, 0.5), 0x000000, 0.06);
  const shade = (h, t) => mixHex(h, 0x203040, t);
  const glowC = (h, m = 1.6) => new THREE.Color(h).multiplyScalar(m);

  // -------------------------------------------------------------- head
  const jt = lerp(0.28, 0.38, f);
  const headA = lerp(0.08, 0.078, f), headB = 0.117, headC = 0.1;
  const noseTab = [[0.009, 0], [0.001, 0.003], [-0.005, 0.0065], [-0.015, 0.0135], [-0.0215, 0.0168], [-0.026, 0.013], [-0.0295, 0.005], [-0.032, 0]];
  const noseP = (py) => {
    if (py > noseTab[0][0] || py < noseTab[noseTab.length - 1][0]) return 0;
    for (let i = 0; i < noseTab.length - 1; i++) {
      const [ya, za] = noseTab[i], [yb, zb] = noseTab[i + 1];
      if (py <= ya && py >= yb) return lerp(za, zb, sstep(0, 1, (ya - py) / (ya - yb)));
    }
    return 0;
  };
  const ULY = -0.0425, MY = -0.047, LLY = -0.0515; // upper lip, mouth line, lower lip
  const featZ = (px, py) => {
    const ax = Math.abs(px);
    let z = 0;
    // brow ridge, eye sockets, cheekbones
    z += (0.0045 + (1 - f) * 0.0015) * gauss(py - 0.027, 0.011) * gauss(ax - 0.028, 0.022);
    z -= 0.0095 * gauss(py - 0.006, 0.0108) * gauss(ax - EX, 0.0195);
    z += 0.004 * gauss(py + 0.018, 0.016) * gauss(ax - 0.046, 0.013);
    // nose
    const nz = noseP(py);
    if (nz > 0) z += nz * gauss(px, lerp(0.0072, 0.0105, sstep(0.004, -0.045, py)));
    z += 0.0068 * gauss(ax - 0.0125, 0.0055) * gauss(py + 0.0255, 0.0052); // alar wings
    // lips + mouth
    z += 0.0058 * gauss(py - ULY, 0.0042) * gauss(px, 0.021);
    z -= 0.0012 * gauss(px, 0.004) * gauss(py + 0.036, 0.0035); // philtrum
    z -= 0.0042 * gauss(py - LLY, 0.005) * gauss(px, 0.021);
    z -= 0.002 * gauss(py + 0.0625, 0.005) * gauss(px, 0.02); // mentolabial fold
    z += 0.006 * gauss(py + 0.079, 0.011) * gauss(px, 0.019); // chin
    z += 0.0045 * gauss(py + 0.028, 0.02) * gauss(ax - 0.042, 0.017); // cheeks
    return z;
  };
  // concavity of the facial relief, used to paint soft ambient occlusion
  const cavity = (px, py) => {
    const r = 0.0055;
    return (featZ(px + r, py) + featZ(px - r, py) + featZ(px, py + r) + featZ(px, py - r)) * 0.25 - featZ(px, py);
  };
  const headRaw = (lat, a, out) => {
    const ny = Math.cos(lat);
    const ux = Math.sin(a), uz = Math.cos(a);
    const L = clamp(-ny, 0, 1);
    const hp = ny >= 0 ? Math.sin(lat) : Math.sqrt(1 - 0.5 * ny * ny) * Math.sqrt(sstep(Math.PI + 0.02, 2.55, lat));
    let x = headA * ux * hp * (1 - jt * Math.pow(L, 1.4));
    let z = headC * uz * hp;
    let y = headB * ny * (ny < 0 ? 0.81 : 1);
    if (uz < 0) {
      z *= 1 - 0.32 * L;
      y *= 1 - 0.3 * L * Math.pow(-uz, 1.5);
      z -= 0.012 * -uz * sstep(-0.35, 0.45, ny) * Math.sin(lat); // occipital
    } else {
      z *= 1 - 0.06 * L * L;
    }
    // male: a little squarer jaw angle
    x *= 1 + (1 - f) * 0.07 * gauss(ny + 0.62, 0.22) * sstep(0.2, -0.4, uz);
    const front = sstep(0.25, 0.75, uz);
    const px = x, py = y;
    x += Math.sign(px) * 0.003 * gauss(py + 0.012, 0.022) * gauss(uz - 0.55, 0.3);
    z += front * featZ(px, py);
    out.set(C.x + x, C.y + y, C.z + z);
    return out;
  };
  // locate the eyes on the socket floor
  let eyeZ = C.z + 0.08;
  {
    let best = 1e9;
    for (let lat = 1.3; lat < 1.8; lat += 0.004) {
      for (let a = 0.2; a < 0.7; a += 0.004) {
        headRaw(lat, a, _p0);
        const d = Math.hypot(_p0.x - EX, _p0.y - (C.y + 0.006));
        if (d < best) {
          best = d;
          eyeZ = _p0.z;
        }
      }
    }
    eyeZ = eyeZ - eyeR + 0.0068;
  }
  for (const [s, L] of [[1, 'L'], [-1, 'R']]) {
    R.bone('eye' + L, 'head', s * EX, C.y + 0.006, eyeZ);
    R.bone('lid' + L, 'head', s * EX, C.y + 0.006, eyeZ);
  }
  // non-uniform sampling: dense across the face
  const headLat = [...lin(6, 0, 1.2), ...lin(20, 1.2, 2.45).slice(1), ...lin(5, 2.45, Math.PI).slice(1)];
  const headAz = lin(38, -Math.PI, Math.PI).map((s) => s - 0.5 * Math.sin(s));
  const headCol = (p, lat, a) => {
    const px = p.x - C.x, py = p.y - C.y;
    const c = new THREE.Color(skin);
    const fr = sstep(0.25, 0.75, Math.cos(a));
    if (fr > 0) {
      const lip = gauss(px, 0.02) * gauss(py - ULY, 0.0036);
      c.lerp(new THREE.Color(lipCol), clamp(lip * 1.1, 0, 0.9) * fr);
      const mouth = gauss(px, 0.019) * gauss(py - MY, 0.0018);
      c.lerp(new THREE.Color(0x3a1c1e), clamp(mouth * 0.9, 0, 0.85) * fr);
      // mouth interior, hidden behind the lower lip until the jaw opens
      const inner = gauss(px, 0.016) * sstep(MY + 0.001, MY - 0.001, py) * sstep(LLY - 0.0055, LLY - 0.003, py);
      c.lerp(new THREE.Color(0x2a1416), clamp(inner, 0, 0.9) * fr);
      const blush = gauss(Math.abs(px) - 0.045, 0.014) * gauss(py + 0.03, 0.018);
      c.lerp(new THREE.Color(mixHex(skin, 0xd06a6a, 0.6)), blush * 0.14 * fr);
      // baked occlusion in the folds, highlight on the ridges
      const crease = gauss(Math.abs(px) - EX, 0.0135) * gauss(py - 0.0215, 0.0032);
      c.lerp(new THREE.Color(mixHex(skin, 0x4a3038, 0.55)), crease * 0.5 * fr);
      const cv = cavity(px, py) * fr;
      c.multiplyScalar(clamp(1 - cv * 95, 0.62, 1.12));
    }
    // under the jaw and behind the ears a touch darker
    c.multiplyScalar(1 - 0.16 * sstep(2.35, 2.9, lat) - 0.06 * sstep(0.2, -0.6, Math.cos(a)) * sstep(1.4, 2.2, lat));
    return c;
  };
  R.add('skin', surf(headRaw, { ts: headLat, as: headAz }), 'head', headCol);

  // ears
  for (const s of [1, -1]) {
    const ear = new THREE.SphereGeometry(1, 9, 7);
    const p = ear.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i);
      const y = p.getY(i), z = p.getZ(i);
      x = x * 0.0075 + (x > 0 ? 0.0 : 0.002) - 0.002 * (1 - y * y); // cupped
      p.setXYZ(i, x, y * 0.029 * (1 - 0.15 * Math.max(0, -y)), z * 0.017 * (1 + 0.25 * y));
    }
    ear.computeVertexNormals();
    weldNormals(ear);
    place(ear, s * (headA * 0.97), C.y - 0.006, C.z - 0.014, -0.18, -s * 0.12, 0, s * 0.85, 0.95, 1);
    const earC = new THREE.Color(mixHex(skin, 0xb05a5a, 0.12));
    R.add('skin', ear, 'head', earC.getHex());
  }

  // neck
  const neckFn = ringFn([
    [1.6, D.neck * 0.9, D.neck * 0.9, D.neck, 0, 0.0],
    [1.55, D.neck, D.neck * 1.02, D.neck * 1.04, 0, 0.0],
    [1.5, D.neck * 1.04, D.neck * 1.0, D.neck * 1.1, 0, -0.008],
    [1.45, D.neck * 1.2, D.neck * 1.0, D.neck * 1.25, 0, -0.012],
    [1.42, D.neck, D.neck * 0.8, D.neck, 0, -0.012],
  ]);
  R.add('skin', surf(neckFn, { ts: lin(7), as: lin(16, -Math.PI, Math.PI) }), 'neck', skin);

  // eyes: sclera + iris cap + catch light, upper/lower lids
  for (const L of ['L', 'R']) {
    const E = R.abs['eye' + L];
    const scl = place(new THREE.SphereGeometry(eyeR, 10, 7), E.x, E.y, E.z, Math.PI / 2);
    R.add('eye', scl, 'eye' + L, mixHex(0xe8e2dc, skin, 0.12));
    const iris = place(new THREE.SphereGeometry(eyeR * 1.012, 12, 6, 0, TAU, 0, 0.66), E.x, E.y, E.z, Math.PI / 2);
    const ic = new THREE.Color(S.eyes);
    R.add('eye', iris, 'eye' + L, (p) => {
      _v.copy(p).sub(E).normalize();
      const ang = Math.acos(clamp(_v.z, -1, 1));
      if (ang < 0.2) return 0x0c0e12;
      if (ang < 0.27) return new THREE.Color(0x0c0e12).lerp(ic, (ang - 0.2) / 0.07);
      const c = ic.clone().lerp(new THREE.Color(0xffffff), 0.18 * (1 - (ang - 0.27) / 0.3));
      if (ang > 0.5) c.lerp(new THREE.Color(0x101418), sstep(0.5, 0.66, ang) * 0.7);
      if (ang > 0.6) c.lerp(new THREE.Color(0xf2eee8), sstep(0.6, 0.66, ang));
      return c;
    });
    const cl = place(new THREE.SphereGeometry(eyeR * 0.16, 6, 4), E.x - 0.0032, E.y + 0.0036, E.z + eyeR * 0.94);
    R.add('glow', cl, 'eye' + L, glowC(0xffffff, 0.9));
    const lid = place(new THREE.SphereGeometry(eyeR * 1.13, 10, 5, Math.PI / 2 - 1.45, 2.9, 0, 1.12), E.x, E.y, E.z);
    const lash = new THREE.Color(mixHex(S.hair, 0x140e0e, 0.85));
    R.add('skin', lid, 'lid' + L, (p) => {
      _v.copy(p).sub(E).normalize();
      const lat = Math.acos(clamp(_v.y, -1, 1));
      const c = new THREE.Color(mixHex(skin, 0x6a4a50, 0.12));
      return c.lerp(lash, 0.92 * sstep(0.9, 1.1, lat));
    });
    const low = place(new THREE.SphereGeometry(eyeR * 1.09, 10, 2, Math.PI / 2 - 1.45, 2.9, Math.PI - 0.72, 0.72), E.x, E.y, E.z);
    R.add('skin', low, 'head', mixHex(skin, 0x6a4a50, 0.1));
  }
  // lower lip on the jaw (talking)
  {
    headRaw(Math.acos(LLY / (headB * 0.81)), 0, _p0);
    const lip = roundBox(0.021, 0.0052, 0.0068, 0.7, 12, 6);
    place(lip, 0, C.y + LLY, _p0.z - 0.0024);
    R.add('skin', lip, 'jaw', (p) => new THREE.Color(lipCol).lerp(new THREE.Color(skin), sstep(0.012, 0.022, Math.abs(p.x))));
  }

  // brows
  const browCol = S.hairStyle === 'bald' && !spec.hair ? mixHex(skin, 0x2a2018, 0.6) : mixHex(S.hair, skin, S.age > 0.6 ? 0.25 : 0.1);
  for (const s of [1, -1]) {
    const bfn = (u, v, out) => {
      // u: inner -> outer, v: across
      u = clamp(u, 0, 1);
      const ax = lerp(0.11, 0.62, u);
      const arch = 0.035 * Math.sin(Math.PI * Math.pow(u, 0.8)) - 0.02 * u;
      return headRaw(1.32 - arch + v * lerp(1.15, 0.55, u), s * ax, out);
    };
    const g = surf((t, a, out) => bfn(s > 0 ? a : 1 - a, t, out), {
      ts: lin(2, -0.022, 0.022), as: lin(8, 0, 1),
      off: (t, a, u, v) => (u === 0 || u === 1 ? 0.0003 : 0.0018 * (1 - 0.6 * (s > 0 ? v : 1 - v))),
    });
    R.add('hair', g, 'head', browCol);
  }

  // ---------------------------------------------------------- hair
  const hairStyle = S.hairStyle;
  const coverHead = costume === 'pilot' && S.headgear;
  const hairOut = (lat, a, thk, out) => {
    headRaw(lat, a, out);
    _v.copy(out).sub(C).normalize();
    return out.addScaledVector(_v, thk);
  };
  if (hairStyle !== 'bald' && !coverHead) {
    const st = hairStyle;
    const curtain = st === 'bob' || st === 'long';
    const hl = (a) => {
      const x = Math.abs(a);
      // natural hairline: forehead, temple, above ear, behind ear, nape
      const pts = curtain
        ? [[0, 0.86], [0.55, 1.02], [0.95, st === 'long' ? 2.85 : 2.36], [Math.PI, st === 'long' ? 2.95 : 2.18]]
        : [[0, 0.9], [0.75, 1.15], [1.35, 1.36], [1.85, 1.42], [2.2, 1.98], [Math.PI, 2.2]];
      for (let i = 0; i < pts.length - 1; i++) {
        if (x <= pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], sstep(0, 1, (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0])));
      }
      return pts[pts.length - 1][1];
    };
    // side part / fringe sweep
    const part = (a) => (curtain ? 0.08 * gauss(a + 0.35, 0.3) + (0.03 * Math.sin(a * 17) + 0.02 * Math.sin(a * 29 + 1)) * sstep(0.9, 1.4, Math.abs(a)) : 0);
    const thkOf = (lat, a) => {
      const top = sstep(1.7, 0.4, lat);
      switch (st) {
        case 'buzz': return 0.0022;
        case 'undercut': return Math.abs(Math.sin(a)) > 0.62 && lat > 0.9 ? 0.0022 : 0.004 + 0.022 * top;
        case 'ponytail': case 'bun': return 0.0045 + 0.004 * top;
        case 'bob': case 'long': return 0.008 + 0.012 * top;
        default: return 0.004 + 0.011 * top + 0.006 * gauss(a, 0.5) * gauss(lat - 0.75, 0.35);
      }
    };
    const clumpy = st === 'bob' || st === 'long' || st === 'short' || st === 'undercut';
    const lim = (a) => hl(a) + part(a);
    // rows run from the crown (u=0) to exactly the hairline (u=1): smooth edge
    const hairFn = (u, a, out) => {
      const lat = u * lim(a);
      const edge = sstep(1, 0.86, u);
      let thk = thkOf(lat, a) * edge - 0.0012 * (1 - edge);
      if (clumpy) thk *= 1 + 0.2 * Math.sin(a * 23 + Math.sin(lat * 4) * 2.2) * sstep(0.6, 1.2, lat) * edge;
      if (curtain && lat > 1.42) {
        // hang straight down from the widest point, never towards the face
        hairOut(1.42, a, thkOf(1.42, a), out);
        const rx = out.x - C.x, rz = out.z - C.z;
        const yb = C.y + headB * Math.cos(Math.min(lat, 2.4)) - Math.max(0, lat - 2.4) * 0.32;
        const flare = 1 + 0.04 * sstep(1.6, 2.3, lat) + 0.1 * Math.sin(a * 23 + lat * 3) * 0.02;
        const tuck = lerp(0.86, 1, edge);
        out.set(C.x + rx * tuck * flare, yb + (1 - edge) * 0.004, C.z + rz * tuck * flare);
        return out;
      }
      return hairOut(lat, a, thk, out);
    };
    const az = lin(32, -Math.PI, Math.PI).map((x) => x - 0.12 * Math.sin(2 * x));
    const hairCol = (p) => {
      const c = new THREE.Color(S.hair);
      if (st === 'buzz' || (st === 'undercut' && p.y < C.y + 0.03)) c.lerp(new THREE.Color(skin), 0.3);
      // darker roots near the scalp line, lighter tips
      return c.multiplyScalar(0.9 + 0.2 * sstep(C.y + 0.12, C.y - 0.15, p.y));
    };
    R.add('hair', surf(hairFn, { ts: lin(curtain ? 18 : 14), as: az, uvScale: [4, 0.6] }), 'head', hairCol);
    if (st === 'ponytail') {
      const pz = C.z - 0.098;
      const tail = ringFn([
        [C.y + 0.05, 0, 0, 0, 0, pz + 0.01],
        [C.y + 0.04, 0.02, 0.02, 0.02, 0, pz - 0.006],
        [C.y + 0.0, 0.026, 0.024, 0.028, 0, pz - 0.03],
        [C.y - 0.08, 0.03, 0.026, 0.03, 0, pz - 0.05],
        [C.y - 0.18, 0.022, 0.02, 0.022, 0, pz - 0.05],
        [C.y - 0.26, 0.008, 0.008, 0.008, 0, pz - 0.04],
        [C.y - 0.28, 0, 0, 0, 0, pz - 0.038],
      ], { bumpFn: (y, a) => 0.003 * Math.sin(a * 9 + y * 40) });
      R.add('hair', surf(tail, { ts: lin(12), as: lin(14, -Math.PI, Math.PI) }), 'pony', hairCol);
      const band = place(new THREE.TorusGeometry(0.02, 0.0055, 6, 14), 0, C.y + 0.033, pz - 0.008, 1.25);
      R.add('armor', band, 'pony', S.trim);
    }
    if (st === 'bun') {
      const bun = new THREE.SphereGeometry(0.036, 14, 10);
      const p = bun.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const a = Math.atan2(p.getX(i), p.getZ(i));
        const r = 1 + 0.06 * Math.sin(a * 6 + p.getY(i) * 80);
        p.setXYZ(i, p.getX(i) * r, p.getY(i) * 0.85 * r, p.getZ(i) * r);
      }
      bun.computeVertexNormals();
      place(bun, 0, C.y + 0.07, C.z - 0.1, 0.5);
      R.add('hair', bun, 'head', hairCol);
    }
  }
  if (S.beard) {
    // rows start exactly on the beard line (moustache, cheek line, sideburn)
    const top = (a) => {
      const aa = Math.abs(a);
      return lerp(-0.036, -0.046, sstep(0.2, 0.8, aa)) + 0.056 * sstep(1.0, 1.6, aa);
    };
    const latTop = (a) => {
      let lo = 0.9, hi = Math.PI - 0.1;
      const ty = C.y + top(a);
      for (let i = 0; i < 22; i++) {
        const m = (lo + hi) / 2;
        headRaw(m, a, _w0);
        if (_w0.y > ty) lo = m;
        else hi = m;
      }
      return lo;
    };
    const tops = new Map();
    const lipHole = (lat, a) => {
      headRaw(lat, a, _w0);
      const px = _w0.x - C.x, py = _w0.y - C.y;
      return sstep(0.85, 1.1, (px / 0.025) ** 2 + ((py - (ULY + LLY) / 2) / 0.0085) ** 2);
    };
    const g = surf((u, a, out) => {
      let lt = tops.get(a);
      if (lt === undefined) tops.set(a, (lt = latTop(a)));
      const lat = lerp(lt, Math.PI - 0.06, u);
      const edge = sstep(0, 0.12, u) * sstep(1.78, 1.55, Math.abs(a)) * lipHole(lat, a);
      return hairOut(lat, a, lerp(-0.0014, 0.0034 + 0.0008 * Math.sin(a * 31 + lat * 17), edge), out);
    }, { ts: lin(10), as: lin(24, -1.78, 1.78), uvScale: [5, 1] });
    R.add('hair', g, 'head', mixHex(S.hair, 0x6a6a6a, 0.1));
  }

  // ------------------------------------------------------------- torso
  const bust = (y, a) => f * 0.024 * gauss(y - 1.315, 0.05) * gauss(Math.abs(a) - 0.46, 0.32)
    + (1 - f) * 0.007 * gauss(y - 1.37, 0.045) * gauss(Math.abs(a) - 0.5, 0.42)
    + 0.004 * gauss(y - 1.36, 0.06) * gauss(Math.abs(a) - 2.5, 0.4); // shoulder blades
  const chestFn = ringFn([
    [1.515, 0, 0, 0, 0, -0.01],
    [1.505, 0.05, 0.045, 0.05, 0, -0.01],
    [1.488, 0.075, 0.06, 0.068, 0, -0.012],
    [1.47, 0.13, 0.072, 0.08, 0, -0.012],
    [1.443, D.sx * 0.97, 0.085, 0.082, 0, -0.012],
    [1.4, D.cw * 1.04, D.cdF * 0.95, D.cdB, 0, -0.008],
    [1.33, D.cw, D.cdF, D.cdB * 0.98, 0, -0.004],
    [1.26, D.cw * 0.95, D.cdF * 0.93, D.cdB * 0.95, 0, 0],
    [1.2, D.ww * 1.03, D.wd * 1.06, D.wd, 0, 0],
    [1.16, D.ww * 0.92, D.wd * 0.95, D.wd * 0.9, 0, 0],
    [1.13, 0, 0, 0, 0, 0],
  ], { sq: 0.85, bumpFn: bust });
  const absFn = ringFn([
    [1.27, 0, 0, 0],
    [1.25, D.ww * 0.85, D.wd * 0.85, D.wd * 0.85],
    [1.21, D.ww, D.wd * 1.04, D.wd],
    [1.15, D.ww * 1.015, D.wd * 1.04, D.wd],
    [1.08, D.ww * 0.975, D.wd, D.wd * 0.96],
    [1.02, D.ww * 0.9, D.wd * 0.9, D.wd * 0.9],
    [1.0, 0, 0, 0],
  ], { sq: 0.85 });
  const pelvisFn = ringFn([
    [1.13, D.ww * 0.93, D.wd * 0.92, D.wd * 0.9, 0, 0],
    [1.08, D.ww * 1.0, D.wd * 1.0, D.wd * 0.97, 0, 0],
    [1.02, lerp(D.ww, D.hw, 0.65), D.hdF * 0.97, D.hdB * 0.92, 0, -0.004],
    [0.95, D.hw, D.hdF, D.hdB, 0, -0.008],
    [0.9, D.hw * 1.02, D.hdF * 0.9, D.hdB * 0.98, 0, -0.008],
    [0.86, D.hw * 0.88, D.hdF * 0.74, D.hdB * 0.84, 0, -0.007],
    [0.82, D.hw * 0.55, 0.045, 0.055, 0, -0.004],
    [0.8, 0, 0, 0, 0, 0],
  ], { sq: 0.85 });

  // -------------------------------------------------------------- limbs
  const A = D.arm, Lg = D.leg;
  const limbs = {};
  for (const [s, L] of [[1, 'L'], [-1, 'R']]) {
    const sx = s * D.sx;
    const up = ringFn([
      [1.455, 0, 0, 0, sx - s * 0.004, -0.015],
      [1.449, 0.03 * A, 0.034 * A, 0.032 * A, sx - s * 0.002, -0.015],
      [1.437, 0.047 * A, 0.05 * A, 0.047 * A, sx + s * 0.003, -0.015],
      [1.415, 0.054 * A, 0.055 * A, 0.052 * A, sx + s * 0.005, -0.015],
      [1.41, 0.056 * A, 0.054 * A, 0.05 * A, sx + s * 0.006, -0.016],
      [1.36, 0.049 * A, 0.048 * A, 0.044 * A, sx + s * 0.003, -0.017],
      [1.3, 0.042 * A, 0.046 * A, 0.042 * A, sx, -0.018],
      [1.24, 0.04 * A, 0.043 * A, 0.041 * A, sx, -0.02],
      [1.19, 0.037 * A, 0.038 * A, 0.037 * A, sx, -0.021],
      [1.16, 0.033 * A, 0.033 * A, 0.034 * A, sx, -0.022],
      [1.142, 0, 0, 0, sx, -0.022],
    ]);
    const fore = ringFn([
      [1.178, 0, 0, 0, sx, -0.022],
      [1.17, 0.027 * A, 0.029 * A, 0.03 * A, sx, -0.022],
      [1.15, 0.034 * A, 0.036 * A, 0.037 * A, sx, -0.021],
      [1.11, 0.038 * A, 0.039 * A, 0.039 * A, sx, -0.019],
      [1.06, 0.035 * A, 0.035 * A, 0.033 * A, sx, -0.017],
      [1.0, 0.029 * A, 0.03 * A, 0.028 * A, sx, -0.015],
      [0.95, 0.024 * A, 0.026 * A, 0.023 * A, sx, -0.013],
      [0.915, 0.0195 * A, 0.025 * A, 0.021 * A, sx, -0.012],
      [0.9, 0.019 * A, 0.024 * A, 0.02 * A, sx, -0.012],
      [0.886, 0, 0, 0, sx, -0.012],
    ]);
    const hS = lerp(1.0, 0.9, f);
    const palm = ringFn([
      [0.907, 0, 0, 0, sx, -0.01],
      [0.902, 0.013 * hS, 0.02 * hS, 0.018 * hS, sx, -0.01],
      [0.885, 0.0165 * hS, 0.03 * hS, 0.027 * hS, sx - s * 0.001, -0.008],
      [0.86, 0.016 * hS, 0.037 * hS, 0.032 * hS, sx - s * 0.002, -0.006],
      [0.83, 0.0145 * hS, 0.037 * hS, 0.031 * hS, sx - s * 0.002, -0.005],
      [0.812, 0.012 * hS, 0.033 * hS, 0.028 * hS, sx - s * 0.001, -0.005],
      [0.803, 0, 0, 0, sx, -0.005],
    ], { sq: 0.8 });
    const tx = s * D.kx;
    const thigh = ringFn([
      // the top is a near-vertical tube inside the pelvis, so the two surfaces
      // cross almost tangentially and no crease line shows
      [1.03, 0, 0, 0, s * (D.hx - 0.006), -0.004],
      [1.02, 0.042 * Lg, 0.048 * Lg, 0.048 * Lg, s * (D.hx - 0.01), -0.004],
      [0.995, 0.056 * Lg, 0.066 * Lg, 0.07 * Lg, s * (D.hx - 0.009), -0.004],
      [0.96, 0.064 * Lg, 0.072 * Lg, 0.079 * Lg, s * (D.hx - 0.006), -0.003],
      [0.92, lerp(0.072, 0.078, f) * Lg, 0.077 * Lg, 0.084 * Lg, s * D.hx, -0.002],
      [0.85, lerp(0.071, 0.076, f) * Lg, 0.076 * Lg, 0.077 * Lg, s * (D.hx + 0.002), 0],
      [0.75, 0.067 * Lg, 0.072 * Lg, 0.066 * Lg, s * lerp(D.hx, D.kx, 0.4), 0.002],
      [0.65, 0.059 * Lg, 0.064 * Lg, 0.057 * Lg, s * lerp(D.hx, D.kx, 0.65), 0.003],
      [0.57, 0.052 * Lg, 0.056 * Lg, 0.05 * Lg, s * lerp(D.hx, D.kx, 0.85), 0.003],
      [0.51, 0.047 * Lg, 0.05 * Lg, 0.046 * Lg, tx, 0.003],
      [0.47, 0.044 * Lg, 0.044 * Lg, 0.044 * Lg, tx, 0.002],
      [0.445, 0, 0, 0, tx, 0.0],
    ]);
    const shin = ringFn([
      [0.525, 0, 0, 0, tx, 0.0],
      [0.51, 0.041 * Lg, 0.043 * Lg, 0.042 * Lg, tx, 0.0],
      [0.48, 0.046 * Lg, 0.046 * Lg, 0.05 * Lg, tx, 0.0],
      [0.43, 0.047 * Lg, 0.043 * Lg, 0.059 * Lg, tx, -0.002],
      [0.37, 0.047 * Lg, 0.039 * Lg, 0.063 * Lg, tx, -0.004],
      [0.31, 0.044 * Lg, 0.036 * Lg, 0.054 * Lg, tx, -0.006],
      [0.23, 0.037 * Lg, 0.032 * Lg, 0.04 * Lg, tx, -0.008],
      [0.16, 0.031 * Lg, 0.028 * Lg, 0.031 * Lg, tx, -0.01],
      [0.1, 0.028 * Lg, 0.027 * Lg, 0.029 * Lg, tx, -0.012],
      [0.07, 0.028 * Lg, 0.029 * Lg, 0.03 * Lg, tx, -0.012],
      [0.05, 0, 0, 0, tx, -0.012],
    ]);
    // feet run along +Z: rows go from toe to heel, column 0 is the sole
    const fw = lerp(1.04, 0.94, f) * Lg;
    const footFn = (t, a, out) => {
      const z = lerp(0.15, -0.078, t);
      const w = fw * lerp(0.036, 0.047, sstep(-0.06, 0.11, z)) * (1 - 0.15 * sstep(0.11, 0.15, z));
      const top = lerp(0.108, 0.054, sstep(-0.02, 0.12, z));
      const e = Math.sqrt(sstep(1.0, 0.82, t)) * Math.sqrt(sstep(0, 0.06, t));
      const hh = (top / 2) * e, yc = top / 2;
      let y = yc - hh * Math.cos(a);
      const flat = y < 0.012;
      if (y < 0) y = 0;
      const x = tx + w * e * Math.sin(a) * (flat ? 1.06 : 1);
      return out.set(x, y, z - 0.012);
    };
    const toeFn = (t, a, out) => {
      const z = lerp(0.222, 0.115, t);
      const u = sstep(0.222, 0.17, z);
      const w = fw * lerp(0.03, 0.046, u);
      const top = lerp(0.03, 0.052, u);
      const e = Math.sqrt(sstep(0, 0.35, t));
      let y = top / 2 - (top / 2) * e * Math.cos(a);
      const flat = y < 0.012;
      if (y < 0) y = 0;
      return out.set(tx + w * e * Math.sin(a) * (flat ? 1.06 : 1), y, z - 0.012);
    };
    limbs[L] = { up, fore, palm, thigh, shin, footFn, toeFn, s };
  }

  // ------------------------------------------------- generic costume tools
  const ring = (n = 20) => lin(n, -Math.PI, Math.PI);
  // raised piece over a surface region with rounded edges
  const plate = (fn, yA, yB, aA, aB, o = {}) => {
    const { th = 0.01, gap = 0.003, nt = 8, na = 12, top = true, bottom = true, sides = true, tA = null } = o;
    const t0 = tA !== null ? tA : fn.tAt(yA), t1 = fn.tAt(yB);
    return surf(fn, {
      ts: lin(nt, t0, t1), as: lin(na, aA, aB),
      off: (t, a, u, v) => {
        let d = 1;
        if (top) d = Math.min(d, (u * nt) / 1.4);
        if (bottom) d = Math.min(d, ((1 - u) * nt) / 1.4);
        if (sides) d = Math.min(d, (v * na) / 1.4, ((1 - v) * na) / 1.4);
        if (d <= 0) return -0.002;
        return gap + th * Math.sin((Math.min(1, d) * Math.PI) / 2);
      },
    });
  };
  // thin strip at a constant height above a surface (light lines, straps)
  const strip = (fn, yA, yB, a, hw, off = 0.002, nt = 10) => surf(fn, {
    ts: lin(nt, fn.tAt(yA), fn.tAt(yB)), as: [a - hw, a + hw], off: () => off,
  });
  const band = (fn, yA, yB, off, na = 24) => surf(fn, { ts: [fn.tAt(yA), fn.tAt(yB)], as: ring(na), off: () => off });
  // shell over a surface (sleeve, jacket): constant offset
  const shell = (fn, yA, yB, off, o = {}) => surf(fn, {
    ts: lin(o.nt || 10, yA === null ? 0 : fn.tAt(yA), fn.tAt(yB)), as: o.as || ring(o.na || 20),
    off: typeof off === 'function' ? off : () => off, keep: o.keep || null,
  });

  const C0 = {
    suit: S.suit, trim: S.trim, armor: S.armor, glow: S.glow,
    inner: shade(S.suit, 0.12), dark: mixHex(S.trim, 0x3a4450, 0.45), sole: 0x8a939c,
  };
  const side = (a, s) => s * Math.sin(a); // +1 = lateral, -1 = medial

  // base suit colouring per costume
  let pants = C0.suit;
  if (costume === 'engineer') pants = mixHex(S.suit, 0x6a7680, 0.55);
  if (costume === 'scientist') pants = S.suit;
  if (costume === 'security') pants = shade(S.suit, 0.08);
  const suitTorso = (p, t, a) => {
    const c = new THREE.Color(S.suit);
    if (costume === 'explorer' || costume === 'pilot' || costume === 'medic') {
      if (Math.abs(Math.sin(a)) > 0.86 && p.y < 1.4 && p.y > 1.0) c.set(S.trim);
    }
    if (costume === 'security' && Math.abs(Math.cos(a)) < 0.4) c.set(S.trim);
    return c;
  };
  const suitLimb = (s, legs) => (p, t, a) => {
    const c = new THREE.Color(legs ? pants : S.suit);
    const sd = side(a, s);
    if ((costume === 'explorer' || costume === 'medic' || costume === 'pilot') && sd > 0.9 && (!legs || p.y < 0.9)) c.set(S.trim);
    if (sd < -0.75) c.lerp(new THREE.Color(0x8a96a6), 0.1);
    return c;
  };

  // ----------------------------------------------------- base body layers
  // under closed garments only the parts that can show are built
  const covered = costume === 'engineer' || costume === 'robe';
  if (!covered) {
    const coat = costume === 'scientist';
    R.add('suit', surf(chestFn, { ts: lin(16), as: coat ? lin(12, -1.15, 1.15) : ring(24) }), 'ribs', suitTorso);
    R.add('suit', surf(absFn, { ts: lin(7), as: coat ? lin(6, -0.6, 0.6) : ring(22) }), 'spine', suitTorso);
  }
  R.add('suit', surf(pelvisFn, { ts: [...lin(3, 0, pelvisFn.tAt(0.99)), ...lin(7, pelvisFn.tAt(0.99), 1).slice(1)], as: ring(24) }), 'hips', pants);
  const bareForearm = costume === 'engineer';
  const sleeved = costume === 'engineer' || costume === 'scientist' || costume === 'robe';
  const gloves = costume === 'explorer' || costume === 'security' || costume === 'pilot' || costume === 'medic';
  for (const L of ['L', 'R']) {
    const lb = limbs[L], s = lb.s;
    // sleeved costumes cover the whole upper arm with their own sleeve shell
    if (!sleeved) R.add('suit', surf(lb.up, { ts: lin(12), as: ring(14) }), 'shoulder' + L, suitLimb(s, false));
    R.add(bareForearm ? 'skin' : 'suit', surf(lb.fore, { ts: lin(9), as: ring(12) }), 'elbow' + L, bareForearm ? skin : suitLimb(s, false));
    R.add('suit', surf(lb.thigh, { ts: [...lin(5, 0, lb.thigh.tAt(0.85)), ...lin(6, lb.thigh.tAt(0.85), 1).slice(1)], as: ring(16) }), 'thigh' + L, suitLimb(s, true));
    // A slim piped seam laid exactly along the line where the thigh leaves the
    // pelvis: it hides the faceted crossing and reads as a suit panel seam.
    {
      const tEnd = lb.thigh.tAt(0.79);
      const exitT = new Map();
      const q0 = new THREE.Vector3(), q1 = new THREE.Vector3();
      const outside = (t, a) => {
        lb.thigh(t, a, q0);
        const pt = pelvisFn.tAt(q0.y);
        if (pt < 0 || pt > 1) return true;
        const cz = pelvisFn(pt, Math.PI / 2, q1).z;
        // find the pelvis point lying in the same direction (the section is a superellipse)
        const want = Math.atan2(q0.x, q0.z - cz);
        let ang = want;
        for (let i = 0; i < 6; i++) {
          pelvisFn(pt, ang, q1);
          ang += wrapPi(want - Math.atan2(q1.x, q1.z - cz));
        }
        return Math.hypot(q0.x, q0.z - cz) > Math.hypot(q1.x, q1.z - cz);
      };
      const seamT = (a) => {
        let tt = exitT.get(a);
        if (tt !== undefined) return tt;
        let lo = 0.02, hi = tEnd;
        if (outside(lo, a)) tt = lo;
        else if (!outside(hi, a)) tt = hi;
        else {
          for (let i = 0; i < 18; i++) {
            const m = (lo + hi) / 2;
            if (outside(m, a)) hi = m;
            else lo = m;
          }
          tt = hi;
        }
        exitT.set(a, tt);
        return tt;
      };
      // smooth the found line so the seam runs cleanly around the leg
      const seamS = (a) => (seamT(a - 0.16) + 2 * seamT(a) + seamT(a + 0.16)) / 4;
      const seam = surf((v, a, out) => lb.thigh(seamS(a) + v, a, out), {
        ts: [-0.018, -0.006, 0.006, 0.018], as: ring(28), off: (t, a, u) => (u > 0.2 && u < 0.8 ? 0.0016 : 0.0004),
      });
      R.add('suit', seam, 'thigh' + L, shade(pants, 0.06));
    }
    R.add('suit', surf(lb.shin, { ts: lin(11), as: ring(14) }), 'knee' + L, suitLimb(s, true));
    // hand: palm, finger block, thumb
    const handSlot = gloves ? 'suit' : 'skin';
    const handCol = gloves ? (costume === 'medic' ? S.trim : costume === 'security' ? S.trim : mixHex(S.suit, 0x6a7888, 0.28)) : skin;
    R.add(handSlot, surf(lb.palm, { ts: lin(6), as: ring(10) }), 'wrist' + L, handCol);
    const F = R.abs['fingers' + L];
    const hS = lerp(1.0, 0.9, f);
    const fl = [0.064, 0.07, 0.066, 0.053];
    const fz = [0.022, 0.0075, -0.0075, -0.021];
    for (let i = 0; i < 4; i++) {
      const r = 0.0078 * hS * (i === 3 ? 0.88 : 1);
      const g = new THREE.CapsuleGeometry(r, fl[i] * hS - 2 * r, 1, 6);
      g.translate(0, -(fl[i] * hS) / 2 + r, 0);
      place(g, F.x - s * 0.002, F.y + 0.008, F.z + fz[i] * hS, 0, 0, 0, 1, 1, 0.95);
      R.add(handSlot, g, 'fingers' + L, handCol);
    }
    const th = new THREE.CapsuleGeometry(0.0095 * hS, 0.032 * hS, 1, 6);
    th.translate(0, -0.026 * hS, 0);
    const W = R.abs['wrist' + L];
    place(th, W.x - s * 0.006, W.y - 0.018, W.z + 0.027 * hS, 0.55, 0, -s * 0.35);
    R.add(handSlot, th, 'wrist' + L, handCol);
    // boots
    const bootC = costume === 'security' ? C0.armor : costume === 'engineer' ? mixHex(S.trim, 0x6b5a48, 0.45) : mixHex(S.armor, S.trim, 0.12);
    const bootCol = (p) => (p.y < 0.013 ? new THREE.Color(C0.sole) : new THREE.Color(bootC));
    R.add('armor', surf(lb.footFn, { ts: lin(9), as: ring(12) }), 'ankle' + L, bootCol);
    R.add('armor', surf(lb.toeFn, { ts: lin(4), as: ring(12) }), 'toe' + L, bootCol);
    const bootTop = costume === 'security' ? 0.34 : costume === 'robe' ? 0.16 : 0.29;
    R.add('armor', plate(lb.shin, bootTop, 0.06, -Math.PI, Math.PI, { th: 0.005, gap: 0.002, nt: 5, na: 13, bottom: false, sides: false }), 'knee' + L,
      (p) => (p.y > bootTop - 0.03 ? new THREE.Color(costume === 'engineer' ? bootC : S.trim) : new THREE.Color(bootC)));
  }

  // ------------------------------------------------------------ costumes
  const glowLines = (arms = true, legs = true) => {
    for (const L of ['L', 'R']) {
      const lb = limbs[L], s = lb.s, a = s * Math.PI / 2;
      if (arms) {
        R.add('glow', strip(lb.up, 1.39, 1.19, a, 0.07, 0.0016), 'shoulder' + L, glowC(S.glow));
        if (!bareForearm) R.add('glow', strip(lb.fore, 1.13, 1.04, a, 0.08, 0.0016), 'elbow' + L, glowC(S.glow));
      }
      if (legs) {
        R.add('glow', strip(lb.thigh, 0.9, 0.56, a, 0.05, 0.0016), 'thigh' + L, glowC(S.glow));
        R.add('glow', strip(lb.shin, 0.46, 0.33, a, 0.07, 0.0016), 'knee' + L, glowC(S.glow));
      }
    }
  };
  const shoulderPads = (th = 0.008, yB = 1.385, extra = false, wa = 1.3) => {
    for (const L of ['L', 'R']) {
      const lb = limbs[L], s = lb.s, c = s * Math.PI / 2;
      R.add('armor', plate(lb.up, null, yB, c - wa, c + wa, { tA: 0, th, gap: 0.003, nt: 6, na: 12, top: false }), 'shoulder' + L,
        (p) => (p.y < yB + 0.012 ? new THREE.Color(S.trim) : new THREE.Color(S.armor)));
      if (extra) R.add('armor', plate(lb.up, yB + 0.005, yB - 0.06, c - 1.4, c + 1.4, { th: th * 0.8, gap: 0.004, nt: 5, na: 12 }), 'shoulder' + L, S.armor);
    }
  };
  const bracers = (col = S.armor) => {
    for (const L of ['L', 'R']) {
      const lb = limbs[L];
      R.add('armor', plate(lb.fore, 1.03, 0.925, -Math.PI, Math.PI, { th: 0.006, gap: 0.002, nt: 4, na: 14, sides: false }), 'elbow' + L, col);
      R.add('glow', band(lb.fore, 0.99, 0.983, 0.0092, 18), 'elbow' + L, glowC(S.glow));
    }
  };
  const kneeGuards = (big = false) => {
    for (const L of ['L', 'R']) {
      const lb = limbs[L];
      const kf = ringFn([
        [0.585, 0, 0, 0, lb.s * D.kx, 0.012],
        [0.57, 0.034, 0.036, 0.02, lb.s * D.kx, 0.012],
        [0.52, 0.047, 0.05, 0.03, lb.s * D.kx, 0.006],
        [0.46, 0.047, 0.05, 0.03, lb.s * D.kx, 0.004],
        [big ? 0.38 : 0.41, 0.045, 0.045, 0.03, lb.s * D.kx, 0.0],
      ]);
      R.add('armor', plate(kf, null, big ? 0.385 : 0.415, -1.25, 1.25, { tA: 0, th: 0.008, gap: 0.004, nt: 7, na: 12, top: false }), 'knee' + L, S.armor);
      R.add('glow', strip(kf, 0.5, 0.47, 0, 0.18, 0.0135, 2), 'knee' + L, glowC(S.glow));
    }
  };
  const chestPlate = (yA = 1.45, yB = 1.235, w = 0.88, th = 0.009) => {
    R.add('armor', plate(chestFn, yA, yB, -w, w, { th, gap: 0.006, nt: 10, na: 16 }), 'ribs',
      (p, t) => (t < chestFn.tAt(yA) + (chestFn.tAt(yB) - chestFn.tAt(yA)) * 0.12 ? new THREE.Color(S.trim) : new THREE.Color(S.armor)));
    R.add('glow', surf(chestFn, { ts: lin(1, chestFn.tAt(yB + 0.035), chestFn.tAt(yB + 0.028)), as: lin(12, -w * 0.62, w * 0.62), off: () => 0.006 + th + 0.0012 }), 'ribs', glowC(S.glow));
  };
  const belt = (off = 0.004, col = S.trim, y = 1.07) => {
    R.add('armor', plate(pelvisFn, y, y - 0.042, -Math.PI, Math.PI, { th: 0.005, gap: off, nt: 4, na: 28, sides: false }), 'hips', col);
    const b = roundBox(0.03, 0.022, 0.008, 0.4, 10, 8);
    pelvisFn(pelvisFn.tAt(y - 0.021), 0, _p0);
    place(b, 0, y - 0.021, _p0.z + off + 0.01);
    R.add('armor', b, 'hips', S.armor);
    const bl = roundBox(0.016, 0.0025, 0.002, 0.5, 6, 4);
    place(bl, 0, y - 0.021, _p0.z + off + 0.0185);
    R.add('glow', bl, 'hips', glowC(S.glow));
  };
  const collarRing = (r = 0.068, tube = 0.011, col = S.trim, y = 1.49) => {
    const g = new THREE.TorusGeometry(r, tube, 6, 22);
    place(g, 0, y, -0.012, Math.PI / 2 - 0.2, 0, 0, 1, 1.08, 1);
    R.add('armor', g, 'chest', col);
  };
  const box = (bone, x, y, z, hx, hy, hz, col, slot = 'armor', e = 0.35) => {
    const g = place(roundBox(hx, hy, hz, e, 8, 6), x, y, z);
    R.add(slot, g, bone, col);
  };
  const helmetShell = (latFront, latBack, thk, col, bone = 'head') => {
    const lim = (a) => lerp(latFront, latBack, sstep(0.9, 1.9, Math.abs(a)));
    const g = surf((u, a, out) => hairOut(u * lim(a), a, thk * Math.sqrt(sstep(1.0, 0.8, u)) + 0.002, out), {
      ts: lin(12), as: ring(36),
    });
    R.add('armor', g, bone, col);
    return lim;
  };

  if (costume === 'explorer') {
    chestPlate();
    shoulderPads();
    bracers();
    kneeGuards();
    belt(0.004, S.trim);
    collarRing(0.066, 0.011, S.trim);
    glowLines(true, true);
    // backpack with the glowing ring
    chestFn(chestFn.tAt(1.32), Math.PI, _p0);
    const bz = _p0.z - 0.052;
    box('chest', 0, 1.31, bz, 0.115, 0.14, 0.045, S.armor, 'armor', 0.3);
    box('chest', 0, 1.31, bz - 0.045, 0.085, 0.105, 0.012, S.trim, 'armor', 0.3);
    const rg = place(new THREE.TorusGeometry(0.048, 0.0065, 4, 24), 0, 1.31, bz - 0.058);
    R.add('glow', rg, 'chest', glowC(S.glow, 1.8));
    for (const s of [1, -1]) {
      const st = strip(chestFn, 1.47, 1.3, s * 0.5, 0.07, 0.008, 8);
      R.add('armor', st, 'ribs', S.trim);
    }
  } else if (costume === 'engineer') {
    // utility jacket (shell over torso and upper arms), rolled sleeves
    const jacketCol = (p, t, a) => {
      const c = new THREE.Color(S.suit);
      if (Math.abs(a) < 0.04) c.set(shade(S.suit, 0.25)); // zip
      if (Math.abs(Math.sin(a)) > 0.9) c.lerp(new THREE.Color(S.trim), 0.5);
      return c;
    };
    R.add('suit', shell(chestFn, 1.505, 1.15, 0.011, { nt: 12, na: 22 }), 'ribs', jacketCol);
    R.add('suit', shell(absFn, 1.25, 1.03, 0.012, { nt: 6, na: 22 }), 'spine', jacketCol);
    R.add('suit', shell(pelvisFn, 1.13, 0.9, (t) => 0.013 + 0.01 * t, { nt: 7, na: 22 }), 'hips', jacketCol);
    const col = ringFn([[1.53, D.neck + 0.022, D.neck + 0.02, D.neck + 0.03, 0, -0.01], [1.495, 0.085, 0.082, 0.088, 0, -0.012], [1.47, 0.115, 0.1, 0.1, 0, -0.012]]);
    R.add2('suit', shell(col, null, 1.47, 0.0, { nt: 3, as: lin(24, 0.38, TAU - 0.38) }), 'chest', S.suit, shade(S.trim, 0.1));
    for (const L of ['L', 'R']) {
      const lb = limbs[L];
      R.add('suit', shell(lb.up, null, 1.142, (t) => 0.007 * sstep(0, 0.15, t), { nt: 12, na: 14 }), 'shoulder' + L, jacketCol);
      const cuff = ringFn([[1.215, 0.046, 0.046, 0.046, lb.s * D.sx, -0.021], [1.19, 0.05, 0.05, 0.05, lb.s * D.sx, -0.021], [1.165, 0.044, 0.044, 0.044, lb.s * D.sx, -0.022]]);
      R.add('suit', shell(cuff, null, 1.165, 0.0, { nt: 4, na: 16 }), 'elbow' + L, shade(S.suit, 0.08));
      R.add('armor', plate(lb.fore, 0.96, 0.92, -Math.PI, Math.PI, { th: 0.003, gap: 0.001, nt: 3, na: 14, sides: false }), 'elbow' + L, S.trim); // wrist band
      R.add('glow', band(lb.fore, 0.945, 0.94, 0.0045, 14), 'elbow' + L, glowC(S.glow));
    }
    // harness straps over the jacket + tool belt with pouches
    for (const s of [1, -1]) {
      R.add('suit', strip(chestFn, 1.48, 1.16, s * 0.52, 0.075, 0.016, 10), 'ribs', mixHex(S.trim, 0x6b5a48, 0.25));
      R.add('suit', strip(chestFn, 1.48, 1.16, s * 2.62, 0.075, 0.016, 10), 'ribs', mixHex(S.trim, 0x6b5a48, 0.25));
      box('ribs', s * 0.06, 1.39, D.cdF + 0.024 + f * 0.012, 0.012, 0.012, 0.004, S.armor);
    }
    belt(0.018, mixHex(S.trim, 0x6b5a48, 0.35), 1.07);
    for (const [x, z, w] of [[0.13, 0.06, 0.028], [0.155, -0.035, 0.024], [-0.14, 0.04, 0.026], [-0.15, -0.05, 0.022]]) {
      const s = Math.sign(x);
      box('hips', x * (D.hw / 0.155) + s * 0.012, 1.0, z, 0.016, 0.03, w, mixHex(S.trim, 0x7a6a50, 0.2), 'suit', 0.4);
    }
    box('hips', -0.16 * (D.hw / 0.155) - 0.02, 0.97, -0.0, 0.006, 0.05, 0.006, S.armor, 'armor', 0.6); // tool
    box('hips', -0.16 * (D.hw / 0.155) - 0.02, 1.025, -0.0, 0.009, 0.01, 0.009, S.glow, 'glow', 0.6);
    // goggles on the forehead
    if (S.headgear) {
      const hairT = hairStyle === 'bald' ? 0 : hairStyle === 'buzz' ? 0.003 : hairStyle === 'ponytail' || hairStyle === 'bun' ? 0.008 : 0.016;
      const gl = (lat, a, out) => hairOut(lat, a, hairT + 0.004, out);
      R.add('suit', surf(gl, { ts: [0.9, 1.0], as: ring(32) }), 'head', shade(S.suit, 0.35));
      for (const s of [1, -1]) {
        gl(0.95, s * 0.36, _p0);
        _p1.copy(_p0).sub(C).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), _p1);
        const fr = new THREE.CylinderGeometry(0.018, 0.016, 0.014, 16, 1);
        fr.applyQuaternion(q);
        fr.translate(_p0.x + _p1.x * 0.006, _p0.y + _p1.y * 0.006, _p0.z + _p1.z * 0.006);
        R.add('armor', fr, 'head', mixHex(S.trim, 0x6b5a48, 0.35));
        const ln = new THREE.SphereGeometry(0.0142, 14, 4, 0, TAU, 0, 0.9);
        ln.scale(1, 0.45, 1);
        ln.applyQuaternion(q);
        ln.translate(_p0.x + _p1.x * 0.013, _p0.y + _p1.y * 0.013, _p0.z + _p1.z * 0.013);
        R.add('eye', ln, 'head', mixHex(S.glow, 0x1f3a40, 0.75));
      }
    }
  } else if (costume === 'scientist') {
    const coat = S.trim; // long white coat
    const lining = mixHex(S.suit, 0xffffff, 0.3);
    const vOpen = (y) => 0.1 + 0.4 * sstep(1.3, 1.49, y) + 0.04 * sstep(1.05, 0.95, y);
    const ct0 = chestFn.tAt(1.5), ct1 = chestFn.tAt(1.15);
    const coatTop = surf((t, u, out) => {
      chestFn(t, 0, _w0);
      const o = vOpen(_w0.y);
      return chestFn(t, lerp(o, TAU - o, u), out);
    }, { ts: lin(12, ct0, ct1), as: lin(20, 0, 1), off: () => 0.012 });
    R.add2('suit', coatTop, 'ribs', coat, lining);
    R.add2('suit', shell(absFn, 1.25, 1.03, 0.016, { nt: 6, as: lin(20, 0.1, TAU - 0.1) }), 'spine', coat, lining);
    const skirt = ringFn([
      [1.08, D.ww + 0.02, D.wd + 0.024, D.wd + 0.02, 0, 0],
      [1.0, D.hw * 0.98 + 0.022, D.hdF + 0.02, D.hdB + 0.02, 0, -0.006],
      [0.9, D.hw + 0.03, D.hdF + 0.03, D.hdB + 0.03, 0, -0.01],
      [0.7, D.hw + 0.05, D.hdF + 0.04, D.hdB + 0.06, 0, -0.016],
      [0.42, D.hw + 0.07, D.hdF + 0.05, D.hdB + 0.085, 0, -0.025],
    ]);
    for (const [s, L] of [[1, 'L'], [-1, 'R']]) {
      const as = s > 0 ? lin(10, 0.11, Math.PI) : lin(10, -Math.PI, -0.11);
      const g = surf(skirt, { ts: lin(8), as });
      R.add2('suit', g, 'tail' + L, (p, t, a) => {
        const c = new THREE.Color(coat);
        if (Math.abs(Math.abs(a) - 1.25) < 0.25 && p.y < 0.9 && p.y > 0.86) c.multiplyScalar(0.9);
        return c;
      }, lining);
    }
    // high collar
    const hc = ringFn([[1.57, 0.066, 0.072, 0.074, 0, -0.01], [1.52, 0.07, 0.078, 0.08, 0, -0.012], [1.47, 0.1, 0.095, 0.1, 0, -0.012]]);
    R.add2('suit', shell(hc, null, 1.47, 0, { nt: 4, as: lin(26, 0.32, TAU - 0.32) }), 'chest', coat, S.suit);
    for (const L of ['L', 'R']) {
      const lb = limbs[L];
      R.add('suit', shell(lb.up, null, 1.142, (t) => 0.008 * sstep(0, 0.12, t), { nt: 12, na: 14 }), 'shoulder' + L, coat);
      R.add('suit', shell(lb.fore, 1.17, 0.94, (t) => 0.008 + 0.004 * t, { nt: 7, na: 12 }), 'elbow' + L, (p) => (p.y < 0.965 ? new THREE.Color(S.suit) : new THREE.Color(coat)));
    }
    // ID light on the chest + pocket pens
    chestFn(chestFn.tAt(1.36), 0.62, _p0);
    box('ribs', _p0.x + 0.004, 1.36, _p0.z + 0.016, 0.02, 0.008, 0.002, glowC(S.glow).getHex(), 'glow', 0.5);
    chestFn(chestFn.tAt(1.33), -0.55, _p0);
    box('ribs', _p0.x, 1.34, _p0.z + 0.018, 0.0035, 0.025, 0.0035, S.suit, 'armor', 0.6);
    glowLines(false, true);
  } else if (costume === 'security') {
    chestPlate(1.465, 1.18, 1.3, 0.016);
    for (let i = 0; i < 3; i++) {
      const y = 1.17 - i * 0.045;
      R.add('armor', plate(absFn, y, y - 0.038, -0.75, 0.75, { th: 0.008, gap: 0.016, nt: 3, na: 10 }), 'spine', i === 1 ? S.trim : S.armor);
    }
    shoulderPads(0.013, 1.37, true, 1.6);
    bracers();
    kneeGuards(true);
    belt(0.006, S.trim, 1.07);
    collarRing(0.072, 0.015, S.armor, 1.492);
    for (const L of ['L', 'R']) {
      const lb = limbs[L], c = lb.s * 0.7;
      R.add('armor', plate(lb.thigh, 0.86, 0.64, c - 0.9, c + 0.9, { th: 0.008, gap: 0.004, nt: 6, na: 10 }), 'thigh' + L, S.armor);
    }
    glowLines(true, false);
    for (const s of [1, -1]) box('hips', s * (D.hw + 0.01), 1.0, 0.0, 0.014, 0.03, 0.035, S.trim, 'armor', 0.4);
    if (S.headgear) {
      helmetShell(0.86, 1.45, 0.024, S.armor);
      R.add('glow', surf((lat, a, out) => hairOut(lat, a, 0.0245, out), { ts: [0.8, 0.83], as: lin(14, -1.2, 1.2) }), 'head', glowC(S.glow));
    }
  } else if (costume === 'pilot') {
    collarRing(0.078, 0.016, S.trim, 1.488);
    shoulderPads(0.007, 1.4);
    belt(0.004, S.trim, 1.07);
    // harness: crossing straps
    for (const s of [1, -1]) {
      const g = surf((u, v, out) => chestFn(lerp(chestFn.tAt(1.47), chestFn.tAt(1.18), u), s * lerp(0.55, -0.15, u) + v, out),
        { ts: lin(10), as: [-0.07, 0.07], off: () => 0.004 });
      R.add('armor', g, 'ribs', S.trim);
    }
    for (const L of ['L', 'R']) {
      const lb = limbs[L];
      R.add('armor', plate(lb.thigh, 0.76, 0.72, -Math.PI, Math.PI, { th: 0.003, gap: 0.002, nt: 2, na: 18, sides: false }), 'thigh' + L, S.trim);
      box('thigh' + L, lb.s * (D.hx + 0.06 * Lg + 0.012), 0.68, 0.01, 0.01, 0.035, 0.028, S.armor, 'armor', 0.4);
    }
    glowLines(true, true);
    chestFn(chestFn.tAt(1.37), 0.55, _p0);
    box('ribs', _p0.x, 1.37, _p0.z + 0.006, 0.016, 0.004, 0.002, glowC(S.glow).getHex(), 'glow', 0.5);
    if (S.headgear) {
      helmetShell(0.82, 1.62, 0.026, S.armor);
      // visor raised over the brow
      const vz = surf((lat, a, out) => hairOut(lat, a, 0.031, out), { ts: lin(4, 0.35, 0.8), as: lin(14, -1.15, 1.15) });
      R.add('eye', vz, 'head', mixHex(S.glow, 0x283848, 0.72));
      for (const s of [1, -1]) {
        const ec = new THREE.CylinderGeometry(0.03, 0.032, 0.014, 18);
        place(ec, s * (headA + 0.024), C.y - 0.005, C.z - 0.012, 0, 0, Math.PI / 2);
        R.add('armor', ec, 'head', S.trim);
      }
    }
  } else if (costume === 'medic') {
    shoulderPads(0.007, 1.4);
    belt(0.004, S.trim, 1.07);
    collarRing(0.064, 0.009, S.trim);
    glowLines(true, false);
    bracers(S.trim);
    // cross emblem lights: chest and upper arms
    chestFn(chestFn.tAt(1.37), 0.5, _p0);
    const cx = _p0.x, cz = _p0.z + 0.006;
    box('ribs', cx, 1.37, cz, 0.006, 0.019, 0.002, glowC(S.glow).getHex(), 'glow', 0.5);
    box('ribs', cx, 1.37, cz, 0.019, 0.006, 0.002, glowC(S.glow).getHex(), 'glow', 0.5);
    for (const L of ['L', 'R']) {
      const lb = limbs[L];
      lb.up(lb.up.tAt(1.32), lb.s * Math.PI / 2, _p0);
      const x = _p0.x + lb.s * 0.004;
      box('shoulder' + L, x, 1.32, _p0.z, 0.002, 0.014, 0.0045, glowC(S.glow).getHex(), 'glow', 0.5);
      box('shoulder' + L, x, 1.32, _p0.z, 0.002, 0.0045, 0.014, glowC(S.glow).getHex(), 'glow', 0.5);
    }
    box('hips', -D.hw - 0.025, 0.98, 0.0, 0.02, 0.05, 0.06, S.trim, 'armor', 0.4); // satchel
    box('hips', -D.hw - 0.047, 0.99, 0.0, 0.002, 0.01, 0.01, glowC(S.glow).getHex(), 'glow', 0.5);
  } else if (costume === 'robe') {
    const robe = S.suit, tab = S.trim;
    R.add('suit', shell(chestFn, 1.505, 1.15, 0.012, { nt: 11, na: 22 }), 'ribs', robe);
    R.add('suit', shell(absFn, 1.25, 1.02, 0.016, { nt: 5, na: 22 }), 'spine', robe);
    const skirt = ringFn([
      [1.1, D.ww + 0.02, D.wd + 0.02, D.wd + 0.02, 0, 0],
      [1.0, D.hw + 0.022, D.hdF + 0.022, D.hdB + 0.02, 0, -0.006],
      [0.8, D.hw + 0.05, D.hdF + 0.05, D.hdB + 0.05, 0, -0.012],
      [0.4, D.hw + 0.09, D.hdF + 0.09, D.hdB + 0.1, 0, -0.02],
      [0.06, D.hw + 0.12, D.hdF + 0.12, D.hdB + 0.13, 0, -0.025],
    ]);
    for (const [s, L] of [[1, 'L'], [-1, 'R']]) {
      const as = s > 0 ? lin(12, 0, Math.PI) : lin(12, -Math.PI, 0);
      R.add2('suit', surf(skirt, { ts: lin(9), as }), 'tail' + L, (p) => (p.y < 0.12 ? new THREE.Color(tab) : new THREE.Color(robe)), shade(robe, 0.1));
    }
    // tabard front/back
    for (const [dir, bone] of [[0, 'tailF'], [Math.PI, 'tailB']]) {
      const g = surf(skirt, { ts: lin(10, 0, skirt.tAt(0.3)), as: lin(4, dir - 0.38, dir + 0.38), off: () => 0.01 });
      R.add2('suit', g, bone, (p) => (p.y < 0.36 ? new THREE.Color(S.glow) : new THREE.Color(tab)), tab);
      const up = surf(chestFn, { ts: lin(8, chestFn.tAt(1.47), chestFn.tAt(1.13)), as: lin(4, dir - 0.36, dir + 0.36), off: () => 0.019 });
      R.add('suit', up, 'ribs', tab);
    }
    // hood lying on the shoulders
    const hood = ringFn([[1.56, 0.07, 0.04, 0.1, 0, -0.03], [1.5, 0.11, 0.07, 0.13, 0, -0.03], [1.45, 0.15, 0.1, 0.13, 0, -0.02], [1.42, 0.16, 0.1, 0.12, 0, -0.01]]);
    R.add2('suit', shell(hood, null, 1.42, 0, { nt: 6, as: lin(26, 0.75, TAU - 0.75) }), 'chest', robe, shade(robe, 0.15));
    for (const L of ['L', 'R']) {
      const lb = limbs[L];
      R.add('suit', shell(lb.up, null, 1.142, (t) => 0.01 * sstep(0, 0.12, t), { nt: 12, na: 14 }), 'shoulder' + L, robe);
      const bell = (t) => 0.008 + 0.045 * t * t;
      R.add2('suit', shell(lb.fore, 1.17, 0.95, bell, { nt: 7, na: 12 }), 'elbow' + L, (p) => (p.y < 0.975 ? new THREE.Color(tab) : new THREE.Color(robe)), shade(robe, 0.15));
    }
    belt(0.022, tab, 1.08);
  }

  if (S.helmet) {
    const hb = place(new THREE.SphereGeometry(0.165, 24, 16, 0, TAU, 0, 2.3), C.x, C.y + 0.01, C.z);
    R.add('visor', hb, 'head', 0xffffff);
    const nr = place(new THREE.TorusGeometry(0.085, 0.012, 8, 28), 0, 1.5, -0.01, Math.PI / 2);
    R.add('armor', nr, 'chest', S.armor);
  }

  // ------------------------------------------------------------ assemble
  const group = new THREE.Group();
  group.name = 'human';
  const root = R.by.root;
  for (const b of R.bones) b.position.multiplyScalar(k);
  for (const b of R.bones) b.userData.rest = b.position.clone();
  group.add(root);
  group.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(R.bones);
  const mats = materials();
  const holo = S.hologram ? holoMaterial(S.glow) : null;
  const meshes = [];
  let tris = 0;
  for (const [slot, D2] of Object.entries(R.slots)) {
    const g = new THREE.BufferGeometry();
    const n = D2.pos.length / 3;
    const pos = new Float32Array(D2.pos);
    for (let i = 0; i < pos.length; i++) pos[i] *= k;
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(D2.nor), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(D2.uv), 2));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(D2.col), 3));
    const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      si[i * 4] = D2.bi[i];
      sw[i * 4] = 1;
    }
    g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    g.setIndex(n > 65535 ? new THREE.BufferAttribute(new Uint32Array(D2.idx), 1) : new THREE.BufferAttribute(new Uint16Array(D2.idx), 1));
    tris += D2.idx.length / 3;
    const m = new THREE.SkinnedMesh(g, holo || mats[slot]);
    m.name = 'human-' + slot;
    m.bind(skeleton);
    m.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.95 * k, 0), 1.25 * k);
    m.castShadow = !S.hologram && slot !== 'visor' && slot !== 'glow';
    m.receiveShadow = !S.hologram;
    if (slot === 'visor') m.renderOrder = 2;
    m.userData.baseMat = m.material;
    meshes.push(m);
    group.add(m);
  }

  // hand anchors at the palms (axes follow the forearm: +Y towards the elbow)
  const B = R.by;
  const handL = new THREE.Group(), handR = new THREE.Group();
  handL.name = 'handL';
  handR.name = 'handR';
  handL.position.set(-0.022 * k, -0.06 * k, 0.012 * k);
  handR.position.set(0.022 * k, -0.06 * k, 0.012 * k);
  B.wristL.add(handL);
  B.wristR.add(handR);

  // ------------------------------------------------------------ animation
  const rnd = (() => {
    let s = Math.floor((S.skin * 7 + S.hair * 13 + S.suit) % 2147483646) + 1;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  })();
  const st = {
    spd: 0, phase: rnd() * TAU, move: 0, run: 0, air: 0, talk: 0, talking: false,
    gest: 0, gestT: -1, nextGest: 1.5, wave: 0, waveT: -1, blinkT: -1, nextBlink: 1 + rnd() * 3,
    look: null, lookW: 0, yaw: 0, pitch: 0, sacX: 0, sacY: 0, sacT: 1, time: 0, tailL: 0, tailR: 0, ponyV: 0, pony: 0,
    opacity: 1, age: clamp(S.age, 0, 1),
  };
  const _t = new THREE.Vector3();
  const LT = 0.43, LS = 0.41; // thigh / shin length (unscaled)

  const legPose = (p, amp, run) => {
    // walk
    const tw = (0.42 * Math.sin(p) + 0.03) * amp;
    const kw = (0.07 + 1.0 * Math.pow(Math.max(0, Math.cos(p + 0.5)), 1.5) + 0.14 * bump(p, Math.PI / 2 + 0.55, 0.38)) * amp;
    const fw = (0.2 * bump(p, Math.PI / 2, 0.45) - 0.4 * bump(p, 4.5, 0.42)) * amp;
    const sw = sstep(0, 0.45, 1.8 - Math.abs(wrapPi(p - Math.PI - 0.1)));
    // run
    const tr = 0.6 * Math.sin(p) + 0.16;
    const kr = 0.32 + 1.75 * Math.pow(Math.max(0, Math.cos(p + 0.2)), 1.2) + 0.3 * bump(p, 2.15, 0.4);
    const fr = 0.04 * bump(p, Math.PI / 2, 0.4) - 0.55 * bump(p, 3.9, 0.45);
    const sr = sstep(0, 0.35, 1.25 - Math.abs(wrapPi(p - 2.7)));
    const th = lerp(tw, tr, run), kn = lerp(kw, kr, run), fp = lerp(fw, fr, run), stW = lerp(sw, sr, run);
    // ankle: hold the foot at its planned pitch while on the ground, relaxed in swing
    const ankleRel = lerp(0.08 * amp - 0.25 * run, fp - (th - kn), stW);
    return { th, kn, ankleRel, stW };
  };
  const reach = (lp) => {
    const fw = lp.th - lp.kn + lp.ankleRel; // world foot pitch (toe up +)
    const off = fw < 0 ? 0.08 * Math.cos(fw) + 0.14 * Math.sin(-fw) : 0.08 * Math.cos(fw) + 0.065 * Math.sin(fw);
    return LT * Math.cos(lp.th) + LS * Math.cos(lp.th - lp.kn) + off;
  };

  const animate = (dt, speed = 0, t = 0, airborne = false) => {
    dt = clamp(dt || 0, 0, 0.1);
    st.time += dt;
    holoTime.value = t;
    speed = Math.max(0, speed || 0);
    st.spd = damp(st.spd, speed, 7, dt);
    const v = st.spd;
    st.move = damp(st.move, sstep(0.1, 1.2, speed), 6, dt);
    st.run = damp(st.run, sstep(4.6, 6.0, speed), 4, dt);
    st.air = damp(st.air, airborne ? 1 : 0, 9, dt);
    st.talk = damp(st.talk, st.talking ? 1 : 0, 6, dt);
    const move = st.move, run = st.run, air = st.air, still = (1 - move) * (1 - air);
    const freq = lerp(0.55 + 0.17 * Math.min(v, 5), 1.42, run);
    st.phase = (st.phase + dt * TAU * freq * Math.min(1, v / 0.4)) % TAU;
    const p = st.phase;
    const amp = clamp(v / 4, 0, 1.1) * move;
    const lpL = legPose(p, amp, run), lpR = legPose(p + Math.PI, amp, run);
    // blend run/walk amplitude in by move
    for (const lp of [lpL, lpR]) {
      lp.th *= lerp(1, move, run);
      lp.kn *= lerp(1, move, run);
      lp.ankleRel *= lerp(1, move, run);
    }

    // airborne pose
    const airL = { th: 0.75, kn: 1.35, ankleRel: -0.35 }, airR = { th: 0.15, kn: 0.85, ankleRel: -0.3 };
    for (const [lp, ap] of [[lpL, airL], [lpR, airR]]) {
      lp.th = lerp(lp.th, ap.th, air);
      lp.kn = lerp(lp.kn, ap.kn, air);
      lp.ankleRel = lerp(lp.ankleRel, ap.ankleRel, air);
    }

    // idle life: breathing, weight shift
    const breath = Math.sin(st.time * TAU / 4.2);
    const sway = Math.sin(st.time * 0.45) * 0.012 * still;
    const stoop = st.age > 0.6 ? (st.age - 0.6) * 0.25 : 0;

    // pelvis height keeps the planted foot on the floor
    let h = Math.max(reach(lpL), reach(lpR));
    h = lerp(h, 0.92 - 0.03, air * 0.5);
    if (run > 0) h += run * move * 0.035 * Math.max(0, Math.sin(2 * p - 0.6));
    B.hips.position.set(sway * k, (0.95 + (h - 0.92)) * k, 0);
    const hipYaw = -lerp(0.11, 0.16, run) * Math.sin(p) * move;
    const hipRoll = 0.045 * Math.sin(p) * move * (1 - run * 0.5) + sway * 1.6;
    B.hips.rotation.set(0.03 * run * move, hipYaw, hipRoll);
    const lean = 0.035 * move + 0.17 * run * move - 0.04 * air + stoop;
    B.spine.rotation.set(lean, 0, -hipRoll * 0.6);
    const chestYaw = -hipYaw * 1.6 + 0.04 * Math.sin(st.time * 0.3) * still;
    B.chest.rotation.set(0.01 * breath * still + stoop * 0.6, chestYaw, -hipRoll * 0.3);
    B.ribs.scale.set(1 + 0.008 * breath, 1 + 0.004 * breath, 1 + 0.014 * breath);

    for (const [L, lp, s] of [['L', lpL, 1], ['R', lpR, -1]]) {
      B['thigh' + L].rotation.set(-lp.th - B.hips.rotation.x, 0, -hipRoll - sway / 0.84 + s * (0.02 + 0.08 * air));
      B['knee' + L].rotation.set(lp.kn, 0, 0);
      const fwp = lp.th - lp.kn + lp.ankleRel;
      B['ankle' + L].rotation.set(-lp.ankleRel, 0, hipRoll + sway / 0.84 - s * (0.02 + 0.08 * air));
      B['toe' + L].rotation.set(lerp(Math.min(0, fwp) * (lp.stW ?? 0), 0, air), 0, 0);
    }

    // arms: counter swing, elbow flex, fists when running
    const armAmp = lerp(clamp(v * 0.09, 0, 0.42), 0.6, run) * move;
    for (const [L, s] of [['L', 1], ['R', -1]]) {
      const sw = -armAmp * Math.sin(L === 'L' ? p : p + Math.PI); // forward +
      const sh = B['shoulder' + L], el = B['elbow' + L], wr = B['wrist' + L];
      sh.position.y = sh.userData.rest.y + 0.003 * breath * k;
      let rx = -sw - 0.05 * run * move;
      let rz = s * (0.075 + 0.06 * run * move);
      let eFlex = 0.16 + 0.22 * move * (1 - run) + Math.max(0, sw) * 0.5 * (1 - run) + 1.3 * run * move;
      const eRz = s * 0.06;
      const wRy = 0, wRz = 0, wRx = 0;
      // airborne: arms out for balance
      rx = lerp(rx, -0.35, air);
      rz = lerp(rz, s * 0.85, air);
      eFlex = lerp(eFlex, 0.5, air);
      sh.rotation.set(rx, 0, rz);
      el.rotation.set(-eFlex, 0, eRz);
      wr.rotation.set(wRx, wRy, wRz);
      B['fingers' + L].rotation.set(0, 0, -s * lerp(0.3, 1.25, run * move));
    }

    // talking: jaw + an occasional open-hand gesture
    const talkN = Math.abs(Math.sin(st.time * 9.3) * Math.sin(st.time * 5.1 + 1.3));
    B.jaw.rotation.set(st.talk * (0.03 + 0.09 * talkN), 0, 0);
    if (st.talking && still > 0.5) {
      st.nextGest -= dt;
      if (st.nextGest <= 0 && st.gestT < 0) {
        st.gestT = 0;
        st.gestSide = rnd() < 0.7 ? 'R' : 'L';
        st.nextGest = 2.5 + rnd() * 3;
      }
    }
    if (st.gestT >= 0) {
      st.gestT += dt;
      const e = sstep(0, 0.35, st.gestT) * (1 - sstep(1.3, 1.8, st.gestT));
      const L = st.gestSide, s = L === 'L' ? 1 : -1;
      const sh = B['shoulder' + L], el = B['elbow' + L], wr = B['wrist' + L];
      sh.rotation.x = lerp(sh.rotation.x, -0.3, e);
      sh.rotation.z = lerp(sh.rotation.z, s * 0.18, e);
      el.rotation.x = lerp(el.rotation.x, -1.25 - 0.12 * Math.sin(st.gestT * 5), e);
      wr.rotation.y = lerp(wr.rotation.y, -s * 1.1, e);
      if (st.gestT > 1.8) st.gestT = -1;
    }

    // wave (right hand)
    if (st.waveT >= 0) {
      st.waveT += dt;
      const e = sstep(0, 0.3, st.waveT) * (1 - sstep(1.2, 1.5, st.waveT));
      const sh = B.shoulderR, el = B.elbowR, wr = B.wristR;
      sh.rotation.x = lerp(sh.rotation.x, -0.25, e);
      sh.rotation.z = lerp(sh.rotation.z, -2.35, e);
      el.rotation.x = lerp(el.rotation.x, -0.25, e);
      el.rotation.z = lerp(el.rotation.z, 0.38 * Math.sin(st.waveT * 11) - 0.25, e);
      wr.rotation.y = lerp(wr.rotation.y, -Math.PI / 2, e);
      B.fingersR.rotation.z = lerp(B.fingersR.rotation.z, 0, e);
      if (st.waveT > 1.5) st.waveT = -1;
    }

    // tails/coat follow the legs with a little lag; ponytail bounces
    const tl = clamp(-B.thighL.rotation.x * 0.55, -0.6, 0.8), tr = clamp(-B.thighR.rotation.x * 0.55, -0.6, 0.8);
    st.tailL = damp(st.tailL, tl, 10, dt);
    st.tailR = damp(st.tailR, tr, 10, dt);
    B.tailL.rotation.set(-st.tailL, 0, 0.06 * run * move + 0.1 * air);
    B.tailR.rotation.set(-st.tailR, 0, -0.06 * run * move - 0.1 * air);
    B.tailF.rotation.set(-Math.max(st.tailL, st.tailR) * 0.9, 0, 0);
    B.tailB.rotation.set(-Math.min(st.tailL, st.tailR) * 0.9 + 0.05 * run * move, 0, 0);
    const bounce = move * Math.sin(2 * p) * (0.08 + 0.12 * run);
    st.ponyV += (-(st.pony - (0.18 * lean + bounce)) * 60 - st.ponyV * 8) * dt;
    st.pony += st.ponyV * dt;
    B.pony.rotation.set(clamp(st.pony, -0.3, 0.6), 0, 0.12 * Math.sin(p) * move);

    // head: stabilise against the body, then look/saccade/blink
    let ty = 0, tp = 0;
    if (st.look) {
      group.updateWorldMatrix(true, false);
      _t.copy(st.look);
      group.worldToLocal(_t);
      _t.y -= 1.62 * k;
      ty = Math.atan2(_t.x, _t.z);
      tp = Math.atan2(_t.y, Math.hypot(_t.x, _t.z));
      if (Math.abs(ty) > 2.3) ty = 0; // directly behind: don't snap around
      ty = clamp(ty, -1.22, 1.22);
      tp = clamp(tp, -0.6, 0.6);
    }
    st.lookW = damp(st.lookW, st.look ? 1 : 0, 4, dt);
    st.yaw = damp(st.yaw, ty, 4.5, dt);
    st.pitch = damp(st.pitch, tp, 4.5, dt);
    const idleYaw = 0.08 * Math.sin(st.time * 0.37) * still * (1 - st.lookW);
    const yaw = st.yaw + idleYaw;
    const bodyYaw = hipYaw + chestYaw;
    B.neck.rotation.set(-lean * 0.5 - 0.3 * st.pitch - stoop * 0.6, -bodyYaw * 0.6 + yaw * 0.4, hipRoll * 0.5);
    B.head.rotation.set(-lean * 0.4 - 0.55 * st.pitch - 0.02 * breath * still + st.talk * 0.03 * Math.sin(st.time * 2.7) - B.chest.rotation.x,
      -bodyYaw * 0.4 + yaw * 0.5, 0.25 * hipRoll);
    st.sacT -= dt;
    if (st.sacT <= 0) {
      st.sacT = 0.8 + rnd() * 2.2;
      st.sacX = (rnd() - 0.5) * 0.18;
      st.sacY = (rnd() - 0.5) * 0.08;
    }
    const eyeYaw = clamp(yaw * 0.12 + st.sacX * (1 - 0.5 * move), -0.4, 0.4);
    const eyePitch = clamp(-0.15 * st.pitch + st.sacY, -0.3, 0.3);
    for (const L of ['L', 'R']) {
      B['eye' + L].rotation.set(eyePitch, eyeYaw, 0);
    }
    // blink
    st.nextBlink -= dt;
    if (st.nextBlink <= 0 && st.blinkT < 0) {
      st.blinkT = 0;
      st.nextBlink = 2 + rnd() * 4;
    }
    let bl = 0;
    if (st.blinkT >= 0) {
      st.blinkT += dt;
      bl = st.blinkT < 0.07 ? st.blinkT / 0.07 : 1 - sstep(0.07, 0.17, st.blinkT);
      if (st.blinkT > 0.17) st.blinkT = -1;
    }
    for (const L of ['L', 'R']) B['lid' + L].rotation.set(0.14 + eyePitch * 0.6 + bl * 1.25, 0, 0);
  };

  const opMats = new Map();
  group.userData = {
    handL, handR, head: B.head, bones: B, skeleton, meshes, spec: S,
    // legacy aliases (old makeCharacter): rotate after animate() to override
    armL: B.shoulderL, armR: B.shoulderR, legL: B.thighL, legR: B.thighR, torso: B.chest, hips: B.hips,
    stats: { triangles: tris, drawCalls: meshes.length },
    animate,
    setTalking: (on) => {
      st.talking = !!on;
      if (on) st.nextGest = Math.min(st.nextGest, 0.8);
    },
    lookAt: (pos) => {
      if (pos) (st.look || (st.look = new THREE.Vector3())).copy(pos);
      else st.look = null;
    },
    wave: () => {
      st.waveT = 0;
    },
    setOpacity: (a) => {
      st.opacity = a;
      for (const m of meshes) {
        const base = m.userData.baseMat;
        if (a >= 0.999) {
          m.material = base;
          continue;
        }
        let c = opMats.get(base);
        if (!c) {
          c = base.clone();
          c.onBeforeCompile = base.onBeforeCompile;
          c.transparent = true;
          opMats.set(base, c);
        }
        c.opacity = a * (base.transparent ? base.opacity : 1);
        c.depthWrite = true;
        m.material = c;
      }
    },
  };
  animate(0, 0, 0, false);
  return group;
}
