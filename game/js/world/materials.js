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
  // Soft, bright "clean sci-fi" palette: off-white panels, warm light floors,
  // pastel accents. Low contrast and matte surfaces are easy on the eyes.
  const wallTex = canvasTex(128, (g, s) => panel(g, s, '#f4f6f8', '#dfe5eb'));
  const floorTex = canvasTex(128, (g, s) => {
    panel(g, s, '#e6e9ed', '#d3d9df', false);
    g.strokeStyle = '#dce1e6';
    for (let i = 16; i < s; i += 32) {
      g.beginPath();
      g.moveTo(i, 4);
      g.lineTo(i, s - 4);
      g.stroke();
    }
  });
  const ceilTex = canvasTex(128, (g, s) => panel(g, s, '#fbfcfd', '#e8edf1'));
  const softTex = canvasTex(128, (g, s) => panel(g, s, '#eef1f4', '#dde3e9'));
  const woodTex = canvasTex(64, (g, s) => {
    panel(g, s, '#efd6ae', '#d9b98a', false);
    g.strokeStyle = 'rgba(180,140,90,0.25)';
    for (let i = 6; i < s; i += 10) {
      g.beginPath();
      g.moveTo(0, i);
      g.lineTo(s, i + 3);
      g.stroke();
    }
  });

  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...o });
  const glow = (color, opacity = 1) =>
    new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, fog: false });

  const m = {
    wall: std({ map: wallTex, color: 0xffffff }),
    wallDark: std({ map: softTex, color: 0xf6eee4 }),
    floor: std({ map: floorTex, color: 0xffffff, roughness: 0.75 }),
    floorDark: std({ map: softTex, color: 0xc9d4de }),
    ceil: std({ map: ceilTex, color: 0xffffff, roughness: 0.95 }),
    metal: std({ map: softTex, color: 0xd4dce5, roughness: 0.5, metalness: 0.1 }),
    shelf: std({ map: softTex, color: 0xc6d3df }),
    pillar: std({ map: softTex, color: 0xf3e3cf }),
    crate: std({ map: woodTex }),
    door: std({ map: softTex, color: 0xa9cdea, roughness: 0.6 }),
    doorArchive: std({ map: softTex, color: 0xa6e6d6, roughness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.22, roughness: 0.1, depthWrite: false }),
    accent: glow(0x6fd6dc),
    stripCool: glow(0x8fd3f0),
    stripViolet: glow(0xb9a8ff),
    stripRed: glow(0xffc27a),
    stripTeal: glow(0x7fe3c9),
    stripFaint: glow(0x7fb8d8, 0.6),
    echo: new THREE.MeshBasicMaterial({ color: 0x3cc4cf, transparent: true, opacity: 0.28, depthWrite: false, fog: false }),
    echoSolid: new THREE.MeshBasicMaterial({ color: 0x29b3c0, transparent: true, opacity: 0.55, depthWrite: false, fog: false }),
    echoLine: new THREE.LineBasicMaterial({ color: 0x1f9aa8, transparent: true, opacity: 0.9, fog: false }),
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
    g.shadowBlur = 3;
  }
  g.fillStyle = color;
  g.fillText(str, w / 2, 52);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { tex: t, aspect: w / 100 };
}
