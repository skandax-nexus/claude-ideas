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

// Photo-scanned CC0 surfaces (assets/textures, see CREDITS.md). Loaded in the
// background; materials pick them up when they arrive. repeat: texture
// repeats per UV unit (boxGeometry gives 1 UV unit per 2 m).
const _texLoader = new THREE.TextureLoader();
const _texCache = new Map();
export function pbrTex(name, role, repeat = 1) {
  const key = `${name}_${role}_${repeat}`;
  if (_texCache.has(key)) return _texCache.get(key);
  const t = _texLoader.load(`assets/textures/${name}_${role}.jpg`);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  if (role === 'color') t.colorSpace = THREE.SRGBColorSpace;
  _texCache.set(key, t);
  return t;
}
// a full surface: colour, normal and roughness maps
export function pbr(name, repeat = 1, o = {}) {
  return new THREE.MeshStandardMaterial({
    map: pbrTex(name, 'color', repeat),
    normalMap: pbrTex(name, 'normal', repeat),
    roughnessMap: pbrTex(name, 'rough', repeat),
    roughness: 1,
    metalness: 0,
    ...o,
  });
}
// just the relief of a surface (normal + roughness) under an existing look
export function relief(name, repeat = 1, strength = 0.6) {
  return { normalMap: pbrTex(name, 'normal', repeat), normalScale: new THREE.Vector2(strength, strength), roughnessMap: pbrTex(name, 'rough', repeat) };
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
    wall: std({ map: wallTex, ...relief('concrete2', 1, 0.5), color: 0xffffff }),
    wallDark: std({ map: softTex, ...relief('concrete2', 1, 0.5), color: 0xf6eee4 }),
    floor: std({ map: floorTex, ...relief('pavement', 0.5, 0.7), color: 0xffffff, roughness: 0.8 }),
    floorDark: std({ map: softTex, color: 0xc9d4de }),
    ceil: std({ map: ceilTex, color: 0xffffff, roughness: 0.95 }),
    metal: std({ map: softTex, ...relief('metal', 1, 0.6), color: 0xd4dce5, roughness: 0.6, metalness: 0.35 }),
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

// Materials for a generated deck, tinted by the deck's palette. Panel
// textures double as bump maps so walls catch the light along their seams.
const _deckCache = new Map();
export const WATER_NORMALS = new Set(); // scrolled each frame (main.js) so water moves

// Rain puddles on a street surface: a world-space noise mask (no texture) turns
// patches of the road into dark, mirror-smooth water that reflects the sky and
// the city lights. wet: 0 dry .. 1 pouring.
function puddles(mat, wet) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.azWet = { value: wet };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vAzW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvAzW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vAzW;
uniform float azWet;
float azH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float azN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(azH(i), azH(i + vec2(1.0, 0.0)), f.x), mix(azH(i + vec2(0.0, 1.0)), azH(i + vec2(1.0, 1.0)), f.x), f.y); }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
float azNoise = azN(vAzW.xz * 0.32) * 0.65 + azN(vAzW.xz * 1.4) * 0.35;
float azPuddle = smoothstep(0.62 - azWet * 0.16, 0.68 - azWet * 0.16, azNoise) * step(abs(vAzW.y), 0.06) * step(0.01, azWet);
float azDamp = azWet * 0.5;
roughnessFactor = mix(roughnessFactor * (1.0 - azDamp * 0.35), 0.035, azPuddle);
diffuseColor.rgb *= mix(1.0 - azDamp * 0.25, 0.42, azPuddle);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
normal = normalize(mix(normal, nonPerturbedNormal, azPuddle));`);
  };
  mat.customProgramCacheKey = () => 'puddles';
  return mat;
}
// HALCYON's districts (gen/ZoneGen.js): lit facades, neon, wet roads, water, the dome.
function zoneMaterials(pal, std, basic) {
  const acc = '#' + new THREE.Color(pal.accent).getHexString();
  const acc2 = '#' + new THREE.Color(pal.accent2).getHexString();
  const wall = pal.wall;
  // 8 m of facade per texture: 4 x 4 windows, some lit
  const windows = (lit) => canvasTex(512, (g, s) => {
    g.fillStyle = lit ? '#000' : wall;
    g.fillRect(0, 0, s, s);
    if (!lit) {
      for (let i = 0; i < 1400; i++) {
        const v = Math.random() * 20 - 10;
        g.fillStyle = `rgba(${128 + v},${128 + v},${128 + v},0.06)`;
        g.fillRect(Math.random() * s, Math.random() * s, 3, 3);
      }
      g.fillStyle = 'rgba(0,0,0,0.25)';
      for (let k = 0; k < 5; k++) g.fillRect(0, k * (s / 5) + s / 5 - 6, s, 6);
    }
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const cw = s / 6, ch = s / 5;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
      const on = rnd() < 0.38;
      const x = c * cw + cw * 0.18, y = r * ch + ch * 0.22, w = cw * 0.64, hh = ch * 0.5;
      if (lit) {
        if (!on) continue;
        // a lit room: warm or cool, sometimes a blind half down
        const grd = g.createLinearGradient(0, y, 0, y + hh);
        const tone = rnd() < 0.2 ? acc2 : rnd() < 0.6 ? '#ffd9a0' : '#d6e8ff';
        grd.addColorStop(0, tone);
        grd.addColorStop(1, 'rgba(0,0,0,0.6)');
        g.fillStyle = grd;
        g.globalAlpha = 0.45 + rnd() * 0.5;
        const blind = rnd() < 0.35 ? hh * rnd() * 0.6 : 0;
        g.fillRect(x, y + blind, w, hh - blind);
        g.globalAlpha = 1;
      } else {
        g.fillStyle = on ? '#2e3346' : '#11141f';
        g.fillRect(x, y, w, hh);
        g.fillStyle = 'rgba(255,255,255,0.06)'; // sky reflected in the top of the glass
        g.fillRect(x, y, w, hh * 0.3);
        g.strokeStyle = 'rgba(200,210,230,0.18)';
        g.lineWidth = 3;
        g.strokeRect(x, y, w, hh);
        g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + hh); g.stroke();
      }
    }
  });
  const facadeTex = windows(false), litTex = windows(true);
  for (const t of [facadeTex, litTex]) t.repeat.set(0.125, 0.125);
  const skyTex = canvasTex(512, (g, s) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.7})`;
      const r = Math.random() < 0.08 ? 2 : 1;
      g.fillRect(Math.random() * s, Math.random() * s, r, r);
    }
    g.strokeStyle = acc2;
    g.globalAlpha = 0.18;
    g.lineWidth = 2;
    for (let k = 0; k <= s; k += 128) {
      g.beginPath(); g.moveTo(k, 0); g.lineTo(k, s); g.stroke();
      g.beginPath(); g.moveTo(0, k); g.lineTo(s, k); g.stroke();
    }
    g.globalAlpha = 1;
  });
  skyTex.repeat.set(0.1, 0.1);
  const n = pal.night;
  const waterNormal = _texLoader.load('assets/textures/water_normal.jpg');
  waterNormal.wrapS = waterNormal.wrapT = THREE.RepeatWrapping;
  waterNormal.repeat.set(0.15, 0.15);
  WATER_NORMALS.add(waterNormal);
  const wet = { rain: 1, storm: 1, steam: 0.6 }[pal.weather] ?? 0.2;
  return {
    industrial: pbr('rust', 0.5, { color: 0xc8c0b8, metalness: 0.35 }),
    sidewalk: puddles(pbr('pavement', 0.6, { color: 0xa8acb2 }), wet * 0.6),
    marking: basic(0xd8dde6, 0.75),
    carGlass: new THREE.MeshStandardMaterial({ color: 0x0c1016, roughness: 0.05, metalness: 0.9, envMapIntensity: 1.5 }),
    tyre: std({ color: 0x111111, roughness: 0.9 }),
    lamp: basic(new THREE.Color(pal.light).lerp(new THREE.Color(0xffffff), 0.5).multiplyScalar(1.6)),
    metal: pbr('metal', 1, { color: 0x9aa2aa, metalness: 0.7 }),
    shopfront: basic(new THREE.Color(0xffd9a8).lerp(new THREE.Color(pal.accent2), 0.25), 0.55, { depthWrite: false }),
    facade: std({ map: facadeTex, ...relief('concrete', 0.5, 0.9), emissive: 0xffffff, emissiveMap: litTex, emissiveIntensity: 0.9 * n + 0.2, roughness: 1, metalness: 0.1 }),
    road: puddles(pbr('asphalt', 0.5, { color: 0x8a8f99, roughness: 0.55, metalness: 0.15, envMapIntensity: 1.4 }), wet), // wet: puddles catch the neon
    moss: pbr('moss', 0.35, { color: 0x9aa890 }),
    tank: pbr('metal', 0.5, { color: 0xb8c2c6, metalness: 0.6 }),
    pipe: pbr('rust', 1, { metalness: 0.5 }),
    car: std({ color: 0x23272e, roughness: 0.22, metalness: 0.75, envMapIntensity: 1.3 }),
    bark: pbr('bark', 0.5),
    crown: new THREE.MeshStandardMaterial({ color: 0x2c4a24, emissive: new THREE.Color(pal.accent), emissiveIntensity: 0.035, roughness: 0.9 }),
    rock: pbr('rock', 0.5),
    leaf: std({ color: new THREE.Color(pal.accent).lerp(new THREE.Color(0x1a4a2a), 0.45), emissive: new THREE.Color(pal.accent), emissiveIntensity: 0.25, roughness: 0.8, transparent: true, opacity: 0.9 }),
    neon: basic(new THREE.Color(pal.accent).multiplyScalar(1.6)),
    screen: basic(new THREE.Color(pal.accent).lerp(new THREE.Color(0x101828), 0.55)),
    water: new THREE.MeshStandardMaterial({ color: new THREE.Color(pal.accent2).lerp(new THREE.Color(0x05101a), 0.8), normalMap: waterNormal, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.06, metalness: 0.8, envMapIntensity: 1.6, transparent: true, opacity: 0.92 }),
    dome: std({ color: new THREE.Color(pal.fog).lerp(new THREE.Color(0x000000), 0.35), emissive: 0xffffff, emissiveMap: skyTex, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.4, side: THREE.DoubleSide }),
    glassWall: new THREE.MeshStandardMaterial({ color: new THREE.Color(pal.fog).lerp(new THREE.Color(0xffffff), 0.15), roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.55 }),
    trim: std({ color: new THREE.Color(wall).lerp(new THREE.Color(0xffffff), 0.25), roughness: 0.4, metalness: 0.3 }),
    trimDark: std({ color: new THREE.Color(wall).lerp(new THREE.Color(0x000000), 0.35), roughness: 0.5, metalness: 0.4 }),
    door: std({ color: new THREE.Color(pal.accent).lerp(new THREE.Color(0x202030), 0.4), emissive: new THREE.Color(pal.accent), emissiveIntensity: 0.35 }),
  };
}

export function deckMaterials(pal) {
  const key = JSON.stringify(pal);
  if (_deckCache.has(key)) return _deckCache.get(key);
  const tint = (hex, k) => {
    const c = new THREE.Color(hex);
    return '#' + c.lerp(new THREE.Color(0xffffff), k).getHexString();
  };
  const accent = new THREE.Color(pal.accent);
  const accentCss = '#' + accent.getHexString();
  const wallTex = canvasTex(256, (g, s) => {
    panel(g, s / 2, tint(accentCss, 0.88), tint(accentCss, 0.62));
    g.drawImage(g.canvas, 0, 0, s / 2, s / 2, s / 2, 0, s / 2, s / 2);
    g.drawImage(g.canvas, 0, 0, s, s / 2, 0, s / 2, s, s / 2);
    g.fillStyle = tint(accentCss, 0.55);
    g.fillRect(0, s * 0.47, s, 3);
  });
  const floorTex = canvasTex(256, (g, s) => {
    panel(g, s, tint(accentCss, 0.8), tint(accentCss, 0.58), false);
    g.strokeStyle = 'rgba(120,130,140,0.12)';
    for (let i = 32; i < s; i += 64) {
      g.beginPath(); g.moveTo(i, 6); g.lineTo(i, s - 6); g.stroke();
      g.beginPath(); g.moveTo(6, i); g.lineTo(s - 6, i); g.stroke();
    }
  });
  const ceilTex = canvasTex(128, (g, s) => panel(g, s, '#fbfcfd', tint(accentCss, 0.85)));
  const propTex = canvasTex(128, (g, s) => panel(g, s, tint(accentCss, 0.86), tint(accentCss, 0.6)));
  const woodTex = canvasTex(64, (g, s) => {
    panel(g, s, '#efd6ae', '#d9b98a', false);
    g.strokeStyle = 'rgba(180,140,90,0.25)';
    for (let i = 6; i < s; i += 10) { g.beginPath(); g.moveTo(0, i); g.lineTo(s, i + 3); g.stroke(); }
  });
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0, ...o });
  const basic = (color, opacity = 1, o = {}) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, fog: false, ...o });
  const m = {
    trim: std({ color: accent.clone().lerp(new THREE.Color(0xffffff), 0.45), roughness: 0.4, metalness: 0.1 }),
    trimDark: std({ color: accent.clone().lerp(new THREE.Color(0x3a4656), 0.35), roughness: 0.5 }),
    panelGlow: basic(new THREE.Color(0xffffff).lerp(new THREE.Color(pal.light), 0.6)),
    wall: std({ map: wallTex, ...relief('concrete2', 1, 0.5) }),
    floor: std({ map: floorTex, ...relief('pavement', 0.5, 0.7), roughness: 0.75 }),
    ceil: std({ map: ceilTex, roughness: 0.95 }),
    pit: std({ map: floorTex, color: new THREE.Color(pal.fog).multiplyScalar(0.9) }),
    prop: std({ map: propTex, bumpMap: propTex, bumpScale: 0.8, roughness: 0.45, metalness: 0.05 }),
    prop2: std({ map: woodTex }),
    pillar: std({ map: propTex, color: 0xfff7ee, roughness: 0.55 }),
    leaf: std({ color: 0x7fcf8f, roughness: 0.9, transparent: true, opacity: 0.92 }),
    glow: basic(accent),
    glass: new THREE.MeshStandardMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.3, roughness: 0.08, depthWrite: false }),
    door: std({ map: propTex, color: accent.clone().lerp(new THREE.Color(0xffffff), 0.35), roughness: 0.5 }),
    gate: basic(accent.clone().lerp(new THREE.Color(0xffffff), 0.3), 0.55, { depthWrite: false }),
    echo: basic(0x3cc4cf, 0.28, { depthWrite: false }),
    echoSolid: basic(0x29b3c0, 0.6, { depthWrite: false }),
    echoLine: new THREE.LineBasicMaterial({ color: 0x1f9aa8, transparent: true, opacity: 0.9, fog: false }),
    light: basic(0xffcf6a, 0.16, { depthWrite: false }),
    lightSolid: basic(0xffc24a, 0.62, { depthWrite: false }),
    lightLine: new THREE.LineBasicMaterial({ color: 0xe8a420, transparent: true, opacity: 0.95, fog: false }),
  };
  m.metal = m.prop;
  m.crate = m.prop2;
  if (pal.night !== undefined) Object.assign(m, zoneMaterials(pal, std, basic));
  _deckCache.set(key, m);
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
