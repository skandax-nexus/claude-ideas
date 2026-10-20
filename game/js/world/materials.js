// Procedural textures and the shared material palette. No image assets:
// everything is drawn into canvases at startup, which keeps the download
// tiny and the look consistent on low-end Android GPUs.
import * as THREE from '../../vendor/three.module.min.js';

export function canvasTex(size, draw, repeat = true, height = size) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = height;
  const g = c.getContext('2d');
  draw(g, size, height);
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
// a neutral stand-in while a photo loads, or if it never does (three.js would bind black, so a floor
// or a pillar would vanish): white colour and roughness (the material's own colour shows), flat normals
function flatImage(role) {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  const g = c.getContext('2d');
  g.fillStyle = role === 'normal' ? '#8080ff' : '#ffffff';
  g.fillRect(0, 0, 1, 1);
  return c;
}
export function pbrTex(name, role, repeat = 1) {
  const key = `${name}_${role}_${repeat}`;
  if (_texCache.has(key)) return _texCache.get(key);
  // r169 keeps a texture's GPU storage at the size of its first upload: when the photo arrives, drop the
  // stand-in's GPU copy so the photo is allocated at its own size (never a stand-in without this)
  const t = _texLoader.load(`assets/textures/${name}_${role}.jpg`, (tex) => tex.dispose());
  if (!t.image) {
    t.image = flatImage(role);
    t.needsUpdate = true;
  }
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
  // Station Zero's rooms, each in its own key (World.js picks these per room):
  // the sealed violet antechamber, the clean lab on a dark floor, the teal
  // archive of shelves, the dark red hall of pillars.
  const labFloor = canvasTex(256, (g, s) => {
    panel(g, s, '#3c4552', '#56616e', false);
    g.fillStyle = 'rgba(120,200,230,0.18)';
    g.fillRect(0, s / 2 - 1, s, 2);
  });
  const hallWall = canvasTex(128, (g, s) => panel(g, s, '#8a3a3c', '#6a2a2e'));
  m.rooms = {
    antechamber: {
      wall: std({ map: wallTex, ...relief('concrete2', 1, 0.5), color: 0xb2a4ec }),
      floor: std({ map: floorTex, ...relief('pavement', 0.5, 0.7), color: 0xa69cd0, roughness: 0.7 }),
      ceil: std({ map: ceilTex, color: 0xc4b8f2, roughness: 0.95 }),
      wallDark: std({ map: softTex, color: 0x5e4ea8, roughness: 0.6 }),
    },
    lab: {
      floor: std({ map: labFloor, ...relief('pavement', 0.5, 0.4), roughness: 0.35, metalness: 0.15 }),
    },
    archive: {
      wall: std({ map: wallTex, ...relief('concrete2', 1, 0.5), color: 0x92d2c6 }),
      wallDark: std({ map: softTex, color: 0x2e5a54 }),
      floor: std({ map: floorTex, ...relief('pavement', 0.5, 0.7), color: 0x5a8a82, roughness: 0.7 }),
      floorDark: std({ map: softTex, color: 0x1c3430 }),
      ceil: std({ map: ceilTex, color: 0xa8d8ce, roughness: 0.95 }),
    },
    hall: {
      wallDark: std({ map: hallWall, ...relief('concrete2', 1, 0.5), roughness: 0.8 }),
      wall: std({ map: hallWall, ...relief('concrete2', 1, 0.5), roughness: 0.8 }),
      floor: pbr('stone', 0.5, { color: 0x9a7a72 }),
      ceil: std({ map: softTex, color: 0x5a2e30, roughness: 0.95 }),
      pillar: pbr('concrete', 0.5, { color: 0xf0e2d0 }),
    },
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
    // THE CRADLE (theme 'cradle'): stone floor, the forest's roots for a ceiling, amber pod lights
    stone: pbr('stone', 0.5, { color: 0x8a8494, roughness: 0.7 }),
    roots: pbr('bark', 0.25, { color: 0x4a3c48, emissive: new THREE.Color(pal.accent), emissiveIntensity: 0.05, side: THREE.DoubleSide }),
    root: pbr('bark', 0.6, { color: 0x6a5866, emissive: new THREE.Color(pal.accent), emissiveIntensity: 0.06 }), // one hanging root
    podLight: basic(new THREE.Color(pal.accent2).multiplyScalar(1.4)),
    pods: podStack(pal, std),
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

// THE CRADLE's pod stacks: tiers of sleeping pods in a steel frame (three pods across, four
// tiers up, 8 m of stack per texture), most of them glowing with someone asleep inside.
const _pods = new Map();
function capsule(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  g.lineTo(x + r, y + h);
  g.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
  g.closePath();
}
function podStack(pal, std) {
  const key = `${pal.wall}|${pal.accent}|${pal.accent2}`;
  if (_pods.has(key)) return _pods.get(key);
  const acc = '#' + new THREE.Color(pal.accent).getHexString();
  const acc2 = '#' + new THREE.Color(pal.accent2).getHexString();
  const frame = new THREE.Color(pal.wall).lerp(new THREE.Color(0x000000), 0.2).getStyle();
  const draw = (lit) => canvasTex(512, (g, s) => {
    g.fillStyle = lit ? '#000' : frame;
    g.fillRect(0, 0, s, s);
    const rows = 4, cols = 3, rh = s / rows, cw = s / cols;
    if (!lit) {
      for (let i = 0; i < 1200; i++) {
        const v = Math.random() * 20 - 10;
        g.fillStyle = `rgba(${128 + v},${128 + v},${128 + v},0.06)`;
        g.fillRect(Math.random() * s, Math.random() * s, 3, 3);
      }
      g.fillStyle = 'rgba(0,0,0,0.35)'; // a ledge under every tier
      for (let r = 0; r < rows; r++) g.fillRect(0, r * rh + rh * 0.86, s, rh * 0.06);
      g.fillStyle = 'rgba(255,255,255,0.05)'; // a post between pods
      for (let c = 0; c <= cols; c++) g.fillRect(c * cw - 3, 0, 6, s);
    }
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cw + cw * 0.08, y = r * rh + rh * 0.3, w = cw * 0.84, h = rh * 0.44;
      const on = rnd() < 0.85, a = 0.4 + rnd() * 0.5, tone = rnd() < 0.25 ? acc : acc2;
      capsule(g, x, y, w, h, h / 2);
      if (lit) {
        if (!on) continue;
        const gr = g.createRadialGradient(x + w / 2, y + h / 2, 2, x + w / 2, y + h / 2, w * 0.55);
        gr.addColorStop(0, tone);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalAlpha = a;
        g.fillStyle = gr;
        g.fill();
        g.globalAlpha = 1;
        g.fillStyle = acc; // the status light at the head end
        g.fillRect(x + w * 0.88, y + h * 0.42, 7, 7);
      } else {
        g.fillStyle = '#0c0b14';
        g.fill();
        g.strokeStyle = 'rgba(214,204,240,0.3)';
        g.lineWidth = 4;
        g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.08)'; // light along the top of the glass
        g.fillRect(x + h / 2, y + h * 0.12, w - h, h * 0.12);
      }
    }
  });
  const base = draw(false), lit = draw(true);
  for (const t of [base, lit]) t.repeat.set(0.25, 0.25);
  const m = std({ map: base, ...relief('metal', 0.5, 0.4), emissive: 0xffffff, emissiveMap: lit, emissiveIntensity: 0.85, roughness: 0.55, metalness: 0.35 });
  _pods.set(key, m);
  return m;
}

// The vessel's window bands (LevelGen storyRoom): a small star field, drawn once.
let _stars = null;
function starTex() {
  if (_stars) return _stars;
  _stars = canvasTex(256, (g, s) => {
    g.fillStyle = '#02030a';
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 180; i++) {
      g.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.7})`;
      const r = Math.random() < 0.1 ? 2 : 1;
      g.fillRect(Math.random() * s, Math.random() * s, r, r);
    }
  });
  _stars.repeat.set(0.25, 0.25); // boxGeometry tiles UVs per 2 m: one star field per 8 m of wall
  return _stars;
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
    // the vessel's window bands (LevelGen storyRoom): the replayed sky, or black glass after SEVERED
    windowStars: new THREE.MeshBasicMaterial({ map: starTex(), fog: false }),
    windowDark: new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.05, metalness: 0.9 }),
  };
  m.metal = m.prop;
  m.crate = m.prop2;
  if (pal.look) Object.assign(m, lookMaterials(pal, std, basic));
  else if (pal.night !== undefined) Object.assign(m, zoneMaterials(pal, std, basic));
  // on dark decks the echo outline is drawn lighter so it still reads
  if (pal.echoLine !== undefined) m.echoLine = new THREE.LineBasicMaterial({ color: pal.echoLine, transparent: true, opacity: 0.95, fog: false });
  _deckCache.set(key, m);
  return m;
}

// --- the vessel's decks: each one its own surfaces -------------------------------

// A small seeded generator so painted textures come out the same every time.
function lcg(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
const css = (hex, k = 1) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
function speckle(g, w, h, rnd, n, alpha, size = 2) {
  for (let i = 0; i < n; i++) {
    const v = rnd() < 0.5 ? 0 : 255;
    g.fillStyle = `rgba(${v},${v},${v},${alpha * rnd()})`;
    g.fillRect(rnd() * w, rnd() * h, size, size);
  }
}
// square tiles with grout and a little variation tile to tile
function tiles(g, s, n, base, grout, vary, rnd, gw = 3) {
  g.fillStyle = grout;
  g.fillRect(0, 0, s, s);
  const t = s / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    g.fillStyle = css(base, 1 + (rnd() - 0.5) * 2 * vary);
    g.fillRect(i * t + gw / 2, j * t + gw / 2, t - gw, t - gw);
  }
}
// riveted panels: n columns, seams and corner rivets
function panels(g, s, n, base, seam, rivet, rnd, vary = 0.03) {
  const t = s / n;
  for (let i = 0; i < n; i++) {
    g.fillStyle = css(base, 1 + (rnd() - 0.5) * 2 * vary);
    g.fillRect(i * t, 0, t, s);
  }
  speckle(g, s, s, rnd, 1400, 0.05);
  g.fillStyle = seam;
  for (let i = 0; i <= n; i++) g.fillRect(i * t - 1.5, 0, 3, s);
  g.fillRect(0, s / 2 - 1.5, s, 3);
  g.fillRect(0, 0, s, 2);
  if (rivet) {
    g.fillStyle = rivet;
    for (let i = 0; i < n; i++) for (const y of [8, s / 2 - 8, s / 2 + 8, s - 8]) for (const x of [i * t + 8, (i + 1) * t - 8]) g.fillRect(x - 2, y - 2, 4, 4);
  }
}

// World-space shading for deck surfaces: walls get darker down a pit shaft (so a
// pit always reads as a drop), an optional band of another colour near the floor
// (frost, grime, wainscot, a tiled dado) and, on floors, world-space patches
// (frost, moss). Same shader for every deck; the values are per material.
function deckShade(mat, o = {}) {
  const u = {
    dsBand: { value: new THREE.Color(o.band ?? 0xffffff) },
    dsBandH: { value: o.bandH ?? 0 },
    dsBandSoft: { value: o.bandSoft ?? 0.3 },
    dsBandAmt: { value: o.bandAmt ?? 0 },
    dsPit: { value: o.pit ?? 0.55 },
    dsSpeck: { value: o.speck ?? 0 },
    dsSpeckCol: { value: new THREE.Color(o.speckCol ?? 0xffffff) },
  };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDsW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvDsW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vDsW;
uniform vec3 dsBand, dsSpeckCol;
uniform float dsBandH, dsBandSoft, dsBandAmt, dsPit, dsSpeck;
float dsHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float dsNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(dsHash(i), dsHash(i + vec2(1.0, 0.0)), f.x), mix(dsHash(i + vec2(0.0, 1.0)), dsHash(i + vec2(1.0, 1.0)), f.x), f.y); }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
float dsLum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
float dsK = dsBandAmt * (1.0 - smoothstep(dsBandH - dsBandSoft, dsBandH, vDsW.y)) * step(-0.02, vDsW.y);
diffuseColor.rgb = mix(diffuseColor.rgb, dsBand * (0.72 + 0.6 * dsLum), dsK);
float dsS = dsSpeck * smoothstep(0.52, 0.72, dsNoise(vDsW.xz * 0.55) * 0.6 + dsNoise(vDsW.xz * 2.7) * 0.4);
diffuseColor.rgb = mix(diffuseColor.rgb, dsSpeckCol * (0.85 + 0.3 * dsLum), dsS);
diffuseColor.rgb *= mix(1.0 - dsPit, 1.0, smoothstep(-2.6, -0.08, vDsW.y));`);
  };
  mat.customProgramCacheKey = () => 'deckShade';
  return mat;
}

const _lookTex = new Map();
// painted textures per deck look (cached: built once per session)
export function lookTextures(look) {
  if (_lookTex.has(look)) return _lookTex.get(look);
  const rnd = lcg(look.length * 7919 + look.charCodeAt(0));
  const T = {};
  if (look === 'hydro') {
    T.wall = canvasTex(512, (g, s) => {
      tiles(g, s, 4, 0x8fa88a, '#5f7a5c', 0.06, rnd, 6);
      // condensation runs down the glazed tiles
      for (let i = 0; i < 90; i++) {
        g.fillStyle = `rgba(235,255,240,${0.04 + rnd() * 0.06})`;
        g.fillRect(rnd() * s, rnd() * s, 1.5, 20 + rnd() * 90);
      }
      speckle(g, s, s, rnd, 1500, 0.06);
    });
    T.floor = canvasTex(512, (g, s) => {
      tiles(g, s, 2, 0x55634f, '#2a3328', 0.08, rnd, 8);
      speckle(g, s, s, rnd, 4000, 0.1, 3);
      // a drainage grate across each slab
      g.fillStyle = 'rgba(20,26,18,0.55)';
      for (let k = 0; k < 2; k++) for (let i = 0; i < 9; i++) g.fillRect(k * s / 2 + s / 4 - 36 + i * 9, s / 4 - 3, 4, s / 2 + 6);
    });
    T.ceil = canvasTex(256, (g, s) => {
      g.fillStyle = '#4d6658';
      g.fillRect(0, 0, s, s);
      speckle(g, s, s, rnd, 600, 0.08);
      g.fillStyle = '#26352b';
      for (let i = 0; i <= 2; i++) { g.fillRect(i * s / 2 - 5, 0, 10, s); g.fillRect(0, i * s / 2 - 5, s, 10); }
    });
  } else if (look === 'cryo') {
    T.wall = canvasTex(256, (g, s) => {
      panels(g, s, 4, 0x8ea3b6, '#5d7184', '#b8c8d6', rnd);
      for (let i = 0; i < 260; i++) {
        g.fillStyle = `rgba(${rnd() < 0.5 ? 255 : 40},${rnd() < 0.5 ? 255 : 60},255,0.04)`;
        g.fillRect(rnd() * s, 0, 1, s); // brushed steel
      }
    });
    T.floor = canvasTex(512, (g, s) => {
      tiles(g, s, 4, 0xc9d9e6, '#93a8ba', 0.03, rnd, 4);
      speckle(g, s, s, rnd, 3000, 0.08);
      // frost crystals
      g.strokeStyle = 'rgba(255,255,255,0.35)';
      for (let i = 0; i < 40; i++) {
        const x = rnd() * s, y = rnd() * s, r = 6 + rnd() * 18;
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke();
        }
      }
    });
    T.ceil = canvasTex(256, (g, s) => panels(g, s, 2, 0x415163, '#2a3644', '#6f8296', rnd));
  } else if (look === 'obs') {
    T.wall = canvasTex(256, (g, s) => panels(g, s, 2, 0x222a48, '#8a6a3a', '#b08a4a', rnd, 0.04));
    T.floor = canvasTex(512, (g, s) => {
      g.fillStyle = '#151b2e';
      g.fillRect(0, 0, s, s);
      speckle(g, s, s, rnd, 2500, 0.05);
      // brass star-chart inlay: a compass rose per slab
      g.strokeStyle = 'rgba(176,138,74,0.55)';
      g.lineWidth = 2;
      const c = s / 2;
      for (const r of [0.46, 0.3, 0.12]) { g.beginPath(); g.arc(c, c, s * r, 0, Math.PI * 2); g.stroke(); }
      g.lineWidth = 1;
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2, r0 = k % 4 ? s * 0.3 : s * 0.05;
        g.beginPath(); g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); g.lineTo(c + Math.cos(a) * s * 0.46, c + Math.sin(a) * s * 0.46); g.stroke();
      }
      g.strokeStyle = 'rgba(176,138,74,0.35)';
      g.strokeRect(1, 1, s - 2, s - 2);
    });
    T.ceil = canvasTex(512, (g, s) => {
      g.fillStyle = '#05070f';
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 260; i++) {
        const b = 120 + rnd() * 135;
        g.fillStyle = `rgba(${b},${b},${Math.min(255, b + 40)},${0.5 + rnd() * 0.5})`;
        const r = rnd() < 0.1 ? 2 : 1;
        g.fillRect(rnd() * s, rnd() * s, r, r);
      }
    });
  } else if (look === 'eng') {
    T.wall = canvasTex(256, (g, s) => {
      panels(g, s, 2, 0x7c7064, '#3a332c', '#a89a88', rnd, 0.06);
      // rust weeping from the seams and rivets
      for (let i = 0; i < 70; i++) {
        const x = rnd() * s, y = rnd() * s, h = 20 + rnd() * 90;
        const gr = g.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, `rgba(140,70,30,${0.15 + rnd() * 0.25})`);
        gr.addColorStop(1, 'rgba(140,70,30,0)');
        g.fillStyle = gr;
        g.fillRect(x, y, 2 + rnd() * 5, h);
      }
      speckle(g, s, s, rnd, 2500, 0.1, 2);
    });
    T.floor = canvasTex(256, (g, s) => {
      g.fillStyle = '#55585b';
      g.fillRect(0, 0, s, s);
      speckle(g, s, s, rnd, 2500, 0.1);
      // diamond plate
      const n = 16, t = s / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        g.save();
        g.translate(i * t + t / 2, j * t + t / 2);
        g.rotate((i + j) % 2 ? Math.PI / 4 : -Math.PI / 4);
        g.fillStyle = 'rgba(200,205,210,0.32)';
        g.fillRect(-t * 0.36, -2, t * 0.72, 4);
        g.fillStyle = 'rgba(0,0,0,0.3)';
        g.fillRect(-t * 0.36, 2, t * 0.72, 1.5);
        g.restore();
      }
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(0, 0, s, 3);
      g.fillRect(0, 0, 3, s);
    });
    T.ceil = canvasTex(256, (g, s) => panels(g, s, 2, 0x34302c, '#1c1a18', '#5a5048', rnd));
    T.hazard = canvasTex(128, (g, s) => {
      g.fillStyle = '#e8b020';
      g.fillRect(0, 0, s, s);
      g.fillStyle = '#1c1a18';
      for (let k = -s; k < s * 2; k += 32) {
        g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 16, 0); g.lineTo(k + 16 - s, s); g.lineTo(k - s, s); g.fill();
      }
      speckle(g, s, s, rnd, 500, 0.15);
    });
  } else if (look === 'med') {
    T.wall = canvasTex(512, (g, s) => {
      tiles(g, s, 8, 0xeef4f4, '#c4d3d3', 0.015, rnd, 3);
      speckle(g, s, s, rnd, 600, 0.03);
    });
    T.floor = canvasTex(256, (g, s) => {
      g.fillStyle = '#a3bcc2';
      g.fillRect(0, 0, s, s);
      speckle(g, s, s, rnd, 3500, 0.18, 2);
      g.fillStyle = 'rgba(60,90,96,0.25)';
      g.fillRect(0, 0, s, 2);
      g.fillRect(0, 0, 2, s);
    });
    T.ceil = canvasTex(256, (g, s) => tiles(g, s, 4, 0xf4f8f8, '#d6e0e0', 0.01, rnd, 4));
  } else if (look === 'crew') {
    T.wall = canvasTex(512, (g, s) => {
      g.fillStyle = '#6c7f95';
      g.fillRect(0, 0, s, s);
      speckle(g, s, s, rnd, 2500, 0.05);
      // striped wallpaper with a small diamond motif
      for (let i = 0; i < 8; i++) {
        g.fillStyle = 'rgba(150,170,195,0.22)';
        g.fillRect(i * 64 + 6, 0, 4, s);
        g.fillRect(i * 64 + 14, 0, 2, s);
      }
      g.fillStyle = 'rgba(240,226,200,0.3)';
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
        const x = i * 64 + 40, y = j * 64 + (i % 2 ? 32 : 0) + 16;
        g.beginPath(); g.moveTo(x, y - 7); g.lineTo(x + 5, y); g.lineTo(x, y + 7); g.lineTo(x - 5, y); g.fill();
      }
    });
    T.floor = canvasTex(512, (g, s) => {
      // walnut planks, 0.25 m wide
      const n = 8, w = s / n;
      for (let i = 0; i < n; i++) {
        let y = -rnd() * 300;
        while (y < s) {
          const len = 160 + rnd() * 260;
          g.fillStyle = css(0x6b4a33, 0.82 + rnd() * 0.36);
          g.fillRect(i * w, y, w, len);
          g.strokeStyle = 'rgba(40,24,12,0.18)';
          for (let k = 0; k < 5; k++) {
            const x = i * w + 4 + rnd() * (w - 8);
            g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 4, y + len * 0.3, x - 4, y + len * 0.7, x + 2, y + len); g.stroke();
          }
          g.fillStyle = 'rgba(30,18,10,0.7)';
          g.fillRect(i * w, y, w, 2);
          y += len;
        }
        g.fillStyle = 'rgba(30,18,10,0.75)';
        g.fillRect(i * w, 0, 2, s);
      }
    });
    T.ceil = canvasTex(256, (g, s) => {
      g.fillStyle = '#e6dac8';
      g.fillRect(0, 0, s, s);
      speckle(g, s, s, rnd, 800, 0.04);
      g.fillStyle = '#b89a76';
      g.fillRect(0, s / 2 - 6, s, 12);
    });
  } else if (look === 'arch') {
    T.wall = canvasTex(256, (g, s) => panels(g, s, 2, 0x2c3532, '#1a2220', '#4a5450', rnd));
    T.ceil = canvasTex(256, (g, s) => panels(g, s, 2, 0x1e2220, '#121614', null, rnd));
  } else if (look === 'bridge') {
    T.wall = canvasTex(256, (g, s) => {
      panels(g, s, 2, 0x1c2b4a, '#2c406a', '#3a5080', rnd);
      g.fillStyle = 'rgba(110,170,255,0.45)';
      g.fillRect(0, s * 0.25, s, 2);
    });
    T.floor = canvasTex(256, (g, s) => {
      g.fillStyle = '#20283a';
      g.fillRect(0, 0, s, s);
      speckle(g, s, s, rnd, 2500, 0.06);
      g.strokeStyle = 'rgba(70,90,130,0.35)';
      const r = 16, h = r * Math.sqrt(3);
      for (let y = 0; y < s + h; y += h) for (let x = 0; x < s + 3 * r; x += 3 * r) {
        for (const [ox, oy] of [[0, 0], [1.5 * r, h / 2]]) {
          g.beginPath();
          for (let k = 0; k <= 6; k++) {
            const a = (k / 6) * Math.PI * 2;
            g.lineTo(x + ox + Math.cos(a) * r, y + oy + Math.sin(a) * r);
          }
          g.stroke();
        }
      }
    });
    T.ceil = canvasTex(256, (g, s) => panels(g, s, 2, 0x131b2e, '#0a101c', null, rnd));
  }
  _lookTex.set(look, T);
  return T;
}

// The surfaces of one deck: walls, floors, ceilings, the furniture material and
// the trim, each deck in its own materials. Echo, hard light, gates and the
// glowing edges keep their shared colours, so the puzzles read the same everywhere.
function lookMaterials(pal, std, basic) {
  const look = pal.look;
  const T = lookTextures(look);
  const accent = new THREE.Color(pal.accent);
  const col = (h) => new THREE.Color(h);
  const out = {};
  const L = (o) => Object.assign(out, o);
  const dark = (pal.night || 0) > 0.25;
  out.door = std({ color: accent.clone().lerp(col(0xffffff), 0.3), emissive: accent, emissiveIntensity: dark ? 0.4 : 0.15, roughness: 0.45, metalness: 0.2 });
  if (look === 'hydro') {
    L({
      wall: deckShade(std({ map: T.wall, ...relief('concrete2', 1, 0.35), roughness: 0.62 }), { band: 0x4a5a34, bandH: 0.7, bandSoft: 0.6, bandAmt: 0.55, pit: 0.7 }),
      floor: deckShade(std({ map: T.floor, ...relief('concrete', 0.5, 0.6), roughness: 0.55 }), { speck: 0.45, speckCol: 0x4f6a32 }),
      ceil: std({ map: T.ceil, roughness: 0.6, metalness: 0.2 }),
      pit: deckShade(std({ color: 0x24362a, roughness: 0.12, metalness: 0.3 }), { pit: 0.5 }),
      prop: pbr('concrete', 0.5, { color: 0xa8b098 }),
      pillar: pbr('stone', 0.5, { color: 0xb0b8a0 }),
      trim: std({ color: 0x46705a, roughness: 0.5, metalness: 0.35 }),
      trimDark: std({ color: 0x3b2f22, roughness: 0.9 }),
      panelGlow: basic(col(0xff8ae0)),
      leaf: std({ color: 0x4f9a45, emissive: 0x2a5a20, emissiveIntensity: 0.2, roughness: 0.8 }),
    });
  } else if (look === 'cryo') {
    L({
      wall: deckShade(std({ map: T.wall, ...relief('metal', 1, 0.5), roughness: 0.45, metalness: 0.35 }), { band: 0xeef6ff, bandH: 1.1, bandSoft: 0.9, bandAmt: 0.75, pit: 0.65 }),
      floor: deckShade(std({ map: T.floor, ...relief('concrete', 0.5, 0.4), roughness: 0.32, metalness: 0.1 }), { speck: 0.55, speckCol: 0xf6fbff }),
      ceil: std({ map: T.ceil, roughness: 0.5, metalness: 0.4 }),
      pit: deckShade(std({ color: 0x1c2a3a, roughness: 0.2, metalness: 0.2 }), { pit: 0.4 }),
      prop: std({ color: 0xd6e2ec, roughness: 0.35, metalness: 0.3 }),
      pillar: std({ color: 0xb8c8d6, roughness: 0.4, metalness: 0.4 }),
      trim: std({ color: 0x46566a, roughness: 0.35, metalness: 0.6 }),
      trimDark: std({ color: 0x2b3846, roughness: 0.5, metalness: 0.4 }),
      panelGlow: basic(col(0xc8ecff)),
      glass: new THREE.MeshStandardMaterial({ color: 0xdff2ff, emissive: 0x4f9ad0, emissiveIntensity: 0.25, transparent: true, opacity: 0.42, roughness: 0.2, depthWrite: false }),
    });
  } else if (look === 'obs') {
    L({
      wall: deckShade(std({ map: T.wall, ...relief('metal', 1, 0.4), roughness: 0.5, metalness: 0.3 }), { pit: 0.75 }),
      floor: deckShade(std({ map: T.floor, roughness: 0.28, metalness: 0.25 }), {}),
      ceil: std({ map: T.ceil, emissive: 0xffffff, emissiveMap: T.ceil, emissiveIntensity: 0.9, roughness: 0.8 }),
      pit: deckShade(std({ color: 0x0a0d1a, roughness: 0.6 }), { pit: 0.5 }),
      prop: std({ color: 0x4c5280, roughness: 0.45, metalness: 0.3 }),
      pillar: std({ color: 0x4c5280, roughness: 0.45, metalness: 0.3 }),
      trim: std({ color: 0xb48a4c, roughness: 0.35, metalness: 0.85 }),
      trimDark: std({ color: 0x6a5230, roughness: 0.4, metalness: 0.8 }),
      panelGlow: basic(col(0xc8bcff)),
    });
  } else if (look === 'eng') {
    L({
      wall: deckShade(std({ map: T.wall, normalMap: pbrTex('rust', 'normal', 0.5), normalScale: new THREE.Vector2(0.7, 0.7), roughness: 0.72, metalness: 0.25 }), { band: 0x2a2018, bandH: 1.0, bandSoft: 0.9, bandAmt: 0.55, pit: 0.75 }),
      floor: deckShade(std({ map: T.floor, bumpMap: T.floor, bumpScale: 1.2, roughness: 0.45, metalness: 0.55 }), { speck: 0.3, speckCol: 0x2a2420 }),
      ceil: std({ map: T.ceil, roughness: 0.7, metalness: 0.4 }),
      pit: deckShade(std({ color: 0x15100c, roughness: 0.3, metalness: 0.4 }), { pit: 0.5 }),
      prop: std({ color: 0x4a5a52, ...relief('metal', 1, 0.6), roughness: 0.5, metalness: 0.45 }),
      pillar: std({ color: 0x5a5650, ...relief('rust', 0.5, 0.6), roughness: 0.6, metalness: 0.5 }),
      trim: std({ color: 0xc8962a, ...relief('rust', 0.5, 0.5), roughness: 0.6, metalness: 0.3 }),
      trimDark: std({ map: T.hazard, roughness: 0.7 }),
      panelGlow: basic(col(0xffb050)),
    });
  } else if (look === 'med') {
    L({
      wall: deckShade(std({ map: T.wall, roughness: 0.28, metalness: 0.05 }), { band: 0x2d6476, bandH: 1.25, bandSoft: 0.015, bandAmt: 1, pit: 0.65 }),
      floor: deckShade(std({ map: T.floor, roughness: 0.38 }), {}),
      ceil: std({ map: T.ceil, roughness: 0.6 }),
      pit: deckShade(std({ color: 0x1a3236, roughness: 0.5 }), { pit: 0.4 }),
      prop: std({ color: 0xeef3f3, roughness: 0.35 }),
      pillar: std({ color: 0xdfe8ea, roughness: 0.35 }),
      trim: std({ color: 0xc5d1d4, roughness: 0.3, metalness: 0.6 }),
      trimDark: std({ color: 0x2d6476, roughness: 0.5 }),
      panelGlow: basic(col(0xf4ffff)),
    });
  } else if (look === 'crew') {
    L({
      wall: deckShade(std({ map: T.wall, ...relief('concrete2', 1, 0.25), roughness: 0.9 }), { band: 0x6a4630, bandH: 1.0, bandSoft: 0.015, bandAmt: 1, pit: 0.7 }),
      floor: deckShade(std({ map: T.floor, bumpMap: T.floor, bumpScale: 0.6, roughness: 0.55 }), {}),
      ceil: std({ map: T.ceil, roughness: 0.9 }),
      pit: deckShade(std({ color: 0x241a14, roughness: 0.8 }), { pit: 0.5 }),
      prop: std({ color: 0x8a6446, ...relief('bark', 1, 0.15), roughness: 0.6 }),
      pillar: std({ color: 0x7a5638, roughness: 0.6 }),
      trim: std({ color: 0x7a5638, roughness: 0.6 }),
      trimDark: std({ color: 0x4a3222, roughness: 0.7 }),
      panelGlow: basic(col(0xffe2b8)),
    });
  } else if (look === 'arch') {
    L({
      wall: deckShade(std({ map: T.wall, ...relief('concrete2', 1, 0.4), roughness: 0.7, metalness: 0.2 }), { pit: 0.75 }),
      floor: deckShade(pbr('stone', 0.5, { color: 0xa08c76 }), {}),
      ceil: std({ map: T.ceil, roughness: 0.8 }),
      pit: deckShade(std({ color: 0x0e0b08, roughness: 0.8 }), { pit: 0.5 }),
      prop: std({ color: 0x4a3828, ...relief('bark', 1, 0.15), roughness: 0.6 }),
      pillar: std({ color: 0x4a3828, roughness: 0.6 }),
      trim: std({ color: 0x5a4630, roughness: 0.55, metalness: 0.2 }),
      trimDark: std({ color: 0x2a2018, roughness: 0.7 }),
      panelGlow: basic(col(0xffc070)),
    });
  } else if (look === 'bridge') {
    L({
      wall: deckShade(std({ map: T.wall, ...relief('metal', 1, 0.4), roughness: 0.45, metalness: 0.35 }), { pit: 0.75 }),
      floor: deckShade(std({ map: T.floor, roughness: 0.5, metalness: 0.2 }), {}),
      ceil: std({ map: T.ceil, roughness: 0.7, metalness: 0.3 }),
      pit: deckShade(std({ color: 0x05070e, roughness: 0.6 }), { pit: 0.5 }),
      prop: std({ color: 0x2e3b55, roughness: 0.45, metalness: 0.4 }),
      pillar: std({ color: 0x34425e, roughness: 0.45, metalness: 0.4 }),
      trim: std({ color: 0x2e3a52, roughness: 0.4, metalness: 0.5 }),
      trimDark: std({ color: 0xb8923e, roughness: 0.35, metalness: 0.7 }),
      panelGlow: basic(col(0xcfe0ff)),
    });
  }
  return out;
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
