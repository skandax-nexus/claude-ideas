// Procedural textures and the shared material palette. No image assets:
// everything is drawn into canvases at startup, which keeps the download
// tiny and the look consistent on low-end Android GPUs.
import * as THREE from '../../vendor/three.module.min.js';

function canvasTex(size, draw, repeat = true) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function panel(g, s, base, line, dots = true) {
  g.fillStyle = base;
  g.fillRect(0, 0, s, s);
  // subtle noise
  for (let i = 0; i < 900; i++) {
    const v = Math.random() * 18 - 9;
    g.fillStyle = `rgba(${128 + v},${128 + v},${128 + v},0.05)`;
    g.fillRect(Math.random() * s, Math.random() * s, 2, 2);
  }
  g.strokeStyle = line;
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, s - 3, s - 3);
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, s * 0.5);
  g.lineTo(s, s * 0.5);
  g.stroke();
  if (dots) {
    g.fillStyle = line;
    for (const [x, y] of [[8, 8], [s - 8, 8], [8, s - 8], [s - 8, s - 8]]) g.fillRect(x - 2, y - 2, 4, 4);
  }
}

export function createMaterials() {
  const wallTex = canvasTex(128, (g, s) => panel(g, s, '#8a929c', '#5d646d'));
  const floorTex = canvasTex(128, (g, s) => {
    panel(g, s, '#5b6068', '#3a3e45', false);
    g.strokeStyle = '#41454c';
    for (let i = 8; i < s; i += 16) {
      g.beginPath();
      g.moveTo(i, 4);
      g.lineTo(i, s - 4);
      g.stroke();
    }
  });
  const ceilTex = canvasTex(128, (g, s) => panel(g, s, '#4a4f57', '#33373d'));
  const darkTex = canvasTex(128, (g, s) => panel(g, s, '#5a616b', '#3a3f46'));
  const crateTex = canvasTex(64, (g, s) => {
    panel(g, s, '#7a6a4a', '#4a3e28', false);
    g.strokeStyle = '#4a3e28';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(s, s);
    g.stroke();
  });

  const lam = (o) => new THREE.MeshLambertMaterial(o);
  const glow = (color, opacity = 1) =>
    new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, fog: false });

  const m = {
    wall: lam({ map: wallTex, color: 0xb8c2cc }),
    wallDark: lam({ map: darkTex, color: 0xb8c0cc, emissive: 0x050608 }),
    floor: lam({ map: floorTex, color: 0xa0a8b0 }),
    floorDark: lam({ map: darkTex, color: 0x50565e }),
    ceil: lam({ map: ceilTex, color: 0x9098a0 }),
    metal: lam({ map: darkTex, color: 0x8a95a6 }),
    shelf: lam({ map: darkTex, color: 0x6b7480 }),
    pillar: lam({ map: darkTex, color: 0xc8b4b4, emissive: 0x080404 }),
    crate: lam({ map: crateTex }),
    door: lam({ map: darkTex, color: 0x6d7a96, emissive: 0x0a1020 }),
    doorArchive: lam({ map: darkTex, color: 0x4a8a80, emissive: 0x062420 }),
    glass: new THREE.MeshLambertMaterial({ color: 0x223040, transparent: true, opacity: 0.18, depthWrite: false }),
    accent: glow(0x6ff0ff),
    stripCool: glow(0x7fd8ff),
    stripViolet: glow(0x9a7bff),
    stripRed: glow(0xff4a3a),
    stripTeal: glow(0x4af0c8),
    stripFaint: glow(0x9fdcff, 0.35),
    echo: new THREE.MeshBasicMaterial({
      color: 0x4ff0ff, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    }),
    echoSolid: new THREE.MeshBasicMaterial({
      color: 0x7ff8ff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    }),
    echoLine: new THREE.LineBasicMaterial({ color: 0x8ff8ff, transparent: true, opacity: 0.85, fog: false }),
  };
  return m;
}

// Box geometry whose UVs tile in world units (one texture repeat per `tile` m).
export function boxGeometry(w, h, d, tile = 2) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  // face order: +x, -x, +y, -y, +z, -z (4 verts each)
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const [su, sv] = dims[f];
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, (uv.getX(i) * su) / tile, (uv.getY(i) * sv) / tile);
    }
  }
  return g;
}

// Concatenate many non-indexed-compatible geometries into one (position,
// normal, uv). Keeps static rooms to a handful of draw calls on mobile.
export function mergeGeometries(geos) {
  let vCount = 0, iCount = 0;
  for (const g of geos) {
    vCount += g.attributes.position.count;
    iCount += g.index ? g.index.count : g.attributes.position.count;
  }
  const pos = new Float32Array(vCount * 3), nor = new Float32Array(vCount * 3), uv = new Float32Array(vCount * 2);
  const idx = new Uint32Array(iCount);
  let vo = 0, io = 0;
  for (const g of geos) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, vo * 3);
    nor.set(g.attributes.normal.array, vo * 3);
    uv.set(g.attributes.uv.array, vo * 2);
    if (g.index) for (let i = 0; i < g.index.count; i++) idx[io++] = g.index.array[i] + vo;
    else for (let i = 0; i < n; i++) idx[io++] = vo + i;
    vo += n;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere();
  return out;
}

export function textTexture(str, { color = '#9fe8ff', font = 'bold 64px monospace', glow = true } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = font;
  const w = Math.ceil(g.measureText(str).width) + 40;
  c.width = w;
  c.height = 100;
  g.font = font;
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  if (glow) {
    g.shadowColor = color;
    g.shadowBlur = 16;
  }
  g.fillStyle = color;
  g.fillText(str, w / 2, 52);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { tex: t, aspect: w / 100 };
}
