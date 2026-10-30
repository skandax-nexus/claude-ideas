// THE LAST VERSION OF EARTH: the sky over a place (OVERHAUL.md §4.3, §4.5). One inverted sphere
// (r 420) that follows the camera, one ShaderMaterial (fog off, no depth write, drawn first): the
// gradient from the year's zenith to its horizon and ground, the city glow on the horizon, the sun
// disc and its glow, the moon, a star field and the Milky Way (Mission 17), one bright star (Mission
// 7's), two scrolling cloud layers from a tileable noise texture painted once, the lightning flash
// (Weather.flash, coloured by the year), and the features a mission's sky can carry:
//   ringHole   the black ring-shaped hole in the clouds over the station after the Zero Second (M1)
//   storm      the storm of times: bands of other times moving across the sky, a wall cloud with a
//              ring-shaped eye (M18; in the shader)
//   wedges     the sky cut into wedges like a clock face, converging at the zenith (M22, and ending B's
//              panes) and eclipse, a black sun with its corona (M22; both in the shader)
//   halo       Anja's lock: a slowly turning halo of light over the bowl (M15; a mesh)
//   unbuilt    the unbuilt city hanging upside down in pale construction lines (M19; a mesh)
//   cloudSea   the cloud sea under the Spire, with the lagoon city through its gaps (M21; meshes)
//   route      the light changing along a route: night rain, dusk, pre-dawn, sunrise (M23)
//   preset     another preset while a fact holds (M23's three ending skies)
//   reverse    a zone where the clouds drift backwards (M11's discontinuity court, M23's collision)
//   beacon     one lit window far off that pulses, slow, like a sleeper's light: at a bearing and elevation on the
//              horizon band (M1's cold open: Chamber One, in Helix's crescent across the river; a mesh)
// On a year switch every uniform eases over about 1.2 s. One draw call, plus a feature's meshes.
import * as THREE from '../../../../vendor/three.module.min.js';
import { compileCondition } from '../../../core/conditions.js';
import { SKIES, sunVector } from './years.js';

let noiseTex = null;
// a tileable value-noise fbm: R a broad octave, G a fine one
function noise() {
  if (noiseTex) return noiseTex;
  const S = 256;
  const data = new Uint8Array(S * S * 4);
  const lattice = (n, seed) => {
    const a = new Float32Array(n * n);
    let s = seed;
    for (let i = 0; i < a.length; i++) a[i] = ((s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296);
    return (x, y) => a[((y % n + n) % n) * n + ((x % n + n) % n)];
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  const octave = (n, seed) => {
    const L = lattice(n, seed);
    return (u, v) => {
      const x = u * n, y = v * n, x0 = Math.floor(x), y0 = Math.floor(y), fx = smooth(x - x0), fy = smooth(y - y0);
      const a = L(x0, y0), b = L(x0 + 1, y0), c = L(x0, y0 + 1), d = L(x0 + 1, y0 + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
  };
  const o = [octave(4, 11), octave(8, 23), octave(16, 37), octave(32, 51), octave(64, 71)];
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const u = i / S, v = j / S;
    const broad = o[0](u, v) * 0.5 + o[1](u, v) * 0.3 + o[2](u, v) * 0.2;
    const fine = o[2](u, v) * 0.45 + o[3](u, v) * 0.35 + o[4](u, v) * 0.2;
    const k = (j * S + i) * 4;
    data[k] = broad * 255;
    data[k + 1] = fine * 255;
    data[k + 2] = 0;
    data[k + 3] = 255;
  }
  noiseTex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping;
  noiseTex.magFilter = noiseTex.minFilter = THREE.LinearFilter;
  noiseTex.needsUpdate = true;
  return noiseTex;
}

const VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w * 0.9999;
}`;

const FRAG = /* glsl */ `
uniform vec3 uZenith, uHorizon, uGround, uGlow, uSun, uC1, uC1s, uC2, uC2s, uSunDir, uMoonDir, uStarDir, uRingDir, uFlashCol;
uniform float uGlowK, uSunSize, uSunGlow, uStars, uMoon, uStar, uFlash, uTime, uCloudT, uMilky;
uniform vec4 uCl1, uCl2, uRing; // cover, speed, scale, -; ring: on, radius, width, -
uniform vec4 uStorm; // on, bands, eye, time
uniform vec3 uStormDir, uBandCol;
uniform vec4 uWedge; // on, count, turn, strength
uniform vec3 uWedgeCol[7];
uniform float uWedgeSoft; // 0: hard panes (ending B); 1: each wedge's light runs into the next (M22)
uniform vec4 uEclipse; // on, radius, corona, -
uniform vec3 uEclipseDir;
uniform sampler2D uNoise;
varying vec3 vDir;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
vec3 wedgeCol(float i) { vec3 c = uWedgeCol[0]; for (int k = 0; k < 7; k++) if (float(k) == i) c = uWedgeCol[k]; return c; }
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = h > 0.0 ? mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.5)) : mix(uHorizon, uGround, clamp(-h * 5.0, 0.0, 1.0));
  // the sky in wedges, like a clock face, each a different time, converging at the zenith
  if (uWedge.x > 0.0 && h > -0.02) {
    float a = mod(atan(d.z, d.x) + uWedge.z, 6.2831853);
    float n = uWedge.y;
    float w = a / (6.2831853 / n);
    float idx = floor(w);
    vec3 wc = wedgeCol(idx);
    float edge = min(fract(w), 1.0 - fract(w));
    // (closing: soft wedges: from each wedge's middle its light runs into its neighbour's all the way to the next middle,
    // no seam anywhere; a hard seam read as a rendering fault on a phone, and a narrower blend still read as an edge
    // where a pale wedge met a dark one)
    float u = w - 0.5, i0 = floor(u);
    vec3 soft = mix(wedgeCol(mod(i0 + n, n)), wedgeCol(mod(i0 + 1.0, n)), smoothstep(0.0, 1.0, fract(u)));
    wc = mix(wc, soft, uWedgeSoft);
    vec3 wcol = mix(wc, uZenith, pow(clamp(h, 0.0, 1.0), 1.6) * 0.65);
    col = mix(col, wcol, uWedge.x * uWedge.w * smoothstep(-0.02, 0.08, h));
    col *= 1.0 - uWedge.x * (1.0 - uWedgeSoft) * 0.55 * (1.0 - smoothstep(0.0, 0.035, edge)) * smoothstep(0.02, 0.12, h);
  }
  col += uGlow * uGlowK * exp(-abs(h) * 9.0);
  float sd = dot(d, uSunDir);
  col += uSun * uSunGlow * (pow(max(sd, 0.0), 6.0) * 0.22 + pow(max(sd, 0.0), 60.0) * 0.5);
  if (uStars > 0.0 && h > 0.0) {
    vec3 g = floor(d * 260.0);
    float s = hash(g);
    col += vec3(0.9, 0.95, 1.0) * step(0.9972, s) * (s - 0.9972) * 300.0 * uStars * smoothstep(0.02, 0.25, h);
  }
  // the Milky Way: a band of light and dense stars along a great circle
  if (uMilky > 0.0 && h > -0.02) {
    float b = dot(d, normalize(vec3(0.42, 0.55, -0.72)));
    float band = exp(-b * b * 34.0) * smoothstep(-0.02, 0.2, h);
    float cl = texture2D(uNoise, d.xz * 1.7 + vec2(0.3, 0.1)).g;
    col += vec3(0.62, 0.68, 0.9) * band * uMilky * (0.08 + 0.16 * cl);
    float s2 = hash(floor(d * 540.0));
    col += vec3(1.0, 0.97, 0.92) * step(0.982, s2) * band * uMilky * 1.4;
    col -= vec3(0.05) * band * uMilky * smoothstep(0.55, 0.75, texture2D(uNoise, d.xz * 3.1).r); // the dark lanes
  }
  if (uStar > 0.0) col += vec3(1.0, 0.96, 0.9) * uStar * (pow(max(dot(d, uStarDir), 0.0), 6000.0) * 3.0 + pow(max(dot(d, uStarDir), 0.0), 400.0) * 0.25);
  if (uMoon > 0.0) {
    float md = dot(d, uMoonDir);
    float disc = smoothstep(0.99955, 0.9997, md);
    float lit = smoothstep(0.99955, 0.9997, dot(normalize(d - vec3(0.012, 0.0, 0.0)), uMoonDir));
    col += vec3(0.85, 0.88, 0.95) * uMoon * (disc - lit * 0.75) + vec3(0.4, 0.45, 0.6) * uMoon * pow(max(md, 0.0), 300.0) * 0.12;
  }
  // the sun disc, under the clouds
  float disc = uSunSize > 0.0 ? smoothstep(1.0 - uSunSize, 1.0 - uSunSize * 0.55, sd) : 0.0;
  col = mix(col, uSun * 2.2, disc);
  // the storm of times: bands of other times sweeping round the sky
  if (uStorm.x > 0.0 && h > -0.02) {
    float az = atan(d.z, d.x);
    float bv = sin(az * 3.0 + uStorm.w * 0.035 + h * 2.6);
    float night = smoothstep(0.45, 0.7, bv) * uStorm.y * smoothstep(-0.02, 0.1, h) * (1.0 - smoothstep(0.7, 0.95, h));
    vec3 nb = uBandCol + vec3(0.9, 0.95, 1.0) * step(0.996, hash(floor(d * 300.0))) * 1.4;
    col = mix(col, nb, night * uStorm.x);
    float day = smoothstep(0.55, 0.8, -bv) * uStorm.y * smoothstep(0.0, 0.12, h) * (1.0 - smoothstep(0.75, 0.95, h));
    col = mix(col, vec3(0.62, 0.78, 0.98), day * uStorm.x * 0.55);
  }
  // the ring-shaped hole: no cloud inside its band, the sky behind it black
  float ring = 0.0;
  if (uRing.x > 0.0) {
    float a = acos(clamp(dot(d, uRingDir), -1.0, 1.0));
    ring = uRing.x * smoothstep(uRing.y - uRing.z, uRing.y - uRing.z * 0.4, a) * (1.0 - smoothstep(uRing.y + uRing.z * 0.4, uRing.y + uRing.z, a));
  }
  // clouds: two layers on a plane overhead
  if (h > -0.05) {
    float fade = smoothstep(-0.02, 0.18, h);
    vec2 p = d.xz / (h + 0.16);
    float t = uCloudT;
    float n1 = texture2D(uNoise, p * uCl1.z * 0.12 + vec2(t * uCl1.y, t * uCl1.y * 0.35)).r;
    n1 = n1 * 0.7 + texture2D(uNoise, p * uCl1.z * 0.31 - vec2(t * uCl1.y * 0.6, 0.0)).g * 0.3;
    float c1 = smoothstep(1.0 - uCl1.x, 1.0 - uCl1.x + 0.32, n1) * fade;
    vec3 cc1 = mix(uC1s, uC1, smoothstep(0.2, 0.85, n1)) + uSun * uSunGlow * pow(max(sd, 0.0), 8.0) * 0.25;
    float n2 = texture2D(uNoise, p * uCl2.z * 0.05 + vec2(t * uCl2.y * 0.7, -t * uCl2.y * 0.2)).g;
    float c2 = smoothstep(1.0 - uCl2.x, 1.0 - uCl2.x + 0.45, n2) * fade * 0.7;
    vec3 cc2 = mix(uC2s, uC2, n2);
    col = mix(col, cc2, c2 * (1.0 - ring));
    col = mix(col, cc1, c1 * (1.0 - ring));
  }
  // the storm's wall cloud on one side of the sky, and the ring-shaped eye in it
  if (uStorm.x > 0.0) {
    vec3 hd = normalize(vec3(d.x, 0.0001, d.z));
    float s = dot(hd, uStormDir);
    float nz = texture2D(uNoise, vec2(atan(d.z, d.x) * 0.6, h * 1.4) + vec2(uStorm.w * 0.004, 0.0)).r;
    float top = 0.32 + nz * 0.2;
    float wall = smoothstep(0.35, 0.75, s) * (1.0 - smoothstep(top - 0.08, top, h)) * smoothstep(-0.2, 0.0, h);
    col = mix(col, mix(vec3(0.06, 0.05, 0.08), vec3(0.22, 0.2, 0.26), nz), wall * uStorm.x * 0.92);
    vec3 eyeDir = normalize(uStormDir + vec3(0.0, 0.42, 0.0));
    float ea = acos(clamp(dot(d, eyeDir), -1.0, 1.0));
    float eyeRing = smoothstep(0.1, 0.13, ea) * (1.0 - smoothstep(0.15, 0.19, ea));
    float eyeIn = 1.0 - smoothstep(0.08, 0.13, ea);
    col = mix(col, vec3(0.55, 0.7, 0.95), eyeIn * uStorm.z * uStorm.x * 0.8);
    col += vec3(0.79, 0.72, 1.0) * eyeRing * uStorm.z * uStorm.x * 0.9;
  }
  // an eclipsed black sun with its corona
  if (uEclipse.x > 0.0) {
    float ed = acos(clamp(dot(d, uEclipseDir), -1.0, 1.0));
    float body = 1.0 - smoothstep(uEclipse.y * 0.96, uEclipse.y, ed);
    float corona = exp(-max(ed - uEclipse.y, 0.0) * 34.0) * (1.0 - body) + exp(-max(ed - uEclipse.y, 0.0) * 6.0) * 0.18;
    col = mix(col, vec3(0.005), body * uEclipse.x);
    col += vec3(1.0, 0.94, 0.86) * corona * uEclipse.z * uEclipse.x;
  }
  col = mix(col, vec3(0.008, 0.008, 0.012), ring * 0.95);
  col += vec3(0.55, 0.42, 0.85) * ring * (1.0 - ring) * 0.5;
  col += uFlashCol * uFlash * 0.55;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const _c = new THREE.Color(), _c2 = new THREE.Color(), _v = new THREE.Vector3();
// a cloud layer's (cover, speed, scale) eased toward its goal, in place
const easeW = (w, t, k) => {
  w.x += (t[0] - w.x) * k;
  w.y += (t[1] - w.y) * k;
  w.z += (t[2] - w.z) * k;
};
const COLORS = ['uZenith', 'uHorizon', 'uGround', 'uGlow', 'uSun', 'uC1', 'uC1s', 'uC2', 'uC2s', 'uFlashCol'];
const DIRS = ['uSunDir', 'uMoonDir', 'uStarDir'];
const SCALARS = ['uGlowK', 'uSunSize', 'uSunGlow', 'uStars', 'uMoon', 'uStar', 'uMilky'];
const deg = Math.PI / 180;
const dirOf = (az, elev) => [Math.sin(az * deg) * Math.cos(elev * deg), Math.sin(elev * deg), -Math.cos(az * deg) * Math.cos(elev * deg)];

// what a year's sky preset sets (targets of the easing); `sky` another preset in the year's light
function target(y, sky) {
  const p = SKIES[sky || y.sky] || SKIES.clearMidday;
  const sun = sunVector(y.sun);
  const az = ((y.sun?.az ?? 140) + 160) * deg;
  return {
    uZenith: p.zenith, uHorizon: p.horizon, uGround: p.ground, uGlow: p.glow, uSun: p.sun,
    uC1: p.clouds.color, uC1s: p.clouds.shade, uC2: p.cirrus.color, uC2s: p.cirrus.shade, uFlashCol: p.flash ?? 0x8c99cc,
    uSunDir: sun, uMoonDir: [Math.sin(az) * 0.8, 0.45, -Math.cos(az) * 0.8], uStarDir: p.starDir || [0.32, 0.62, -0.72],
    uGlowK: p.glowK, uSunSize: p.sunSize, uSunGlow: p.sunGlow, uStars: p.stars || 0, uMoon: p.moon || 0, uStar: p.star || 0, uMilky: p.milky || 0,
    cl1: [p.clouds.cover, p.clouds.speed, p.clouds.scale], cl2: [p.cirrus.cover, p.cirrus.speed, p.cirrus.scale],
  };
}

// a blend of two targets into out (out keeps its arrays: no allocation per frame)
const VECS = [...DIRS, 'cl1', 'cl2'];
function blend(out, a, b, k) {
  for (const key of COLORS) out[key] = _c.setHex(a[key]).lerp(_c2.setHex(b[key]), k).getHex();
  for (const key of VECS) {
    const o = (out[key] ||= [0, 0, 0]);
    for (let i = 0; i < 3; i++) o[i] = a[key][i] + (b[key][i] - a[key][i]) * k;
  }
  for (const key of SCALARS) out[key] = a[key] + (b[key] - a[key]) * k;
  return out;
}

// --- the features that are meshes -----------------------------------------------------------------------
// a window's light far off (beacon): a small warm pane and a soft glow round it, both added light, faded by the feature
let glowTex = null;
function beaconMesh(f) {
  if (!glowTex) {
    const S = 32, d = new Uint8Array(S * S * 4);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const r = Math.hypot(x - S / 2 + 0.5, y - S / 2 + 0.5) / (S / 2);
      const a = Math.max(0, 1 - r) ** 2;
      d.set([255, 255, 255, Math.round(a * 255)], (y * S + x) * 4);
    }
    glowTex = new THREE.DataTexture(d, S, S);
    glowTex.needsUpdate = true;
  }
  const s = f.size ?? 4.5, color = f.color ?? 0xffb45a; // (a warm window against the crescent's cold glass)
  const g = new THREE.Group();
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.62), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  pane.userData.base = 1;
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(s * 5, s * 5), new THREE.MeshBasicMaterial({ color, map: glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  glow.userData.base = 0.8;
  g.add(glow, pane);
  g.renderOrder = 2;
  g.frustumCulled = false;
  for (const o of g.children) o.frustumCulled = false;
  return g;
}

const glowMat = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide });

// Anja's lock: a turning halo of light in an open sky
function haloMesh(f) {
  const g = new THREE.Group();
  const r = f.r || 22;
  const add = (geo, color, opacity) => {
    const m = new THREE.Mesh(geo, glowMat(color, opacity));
    m.userData.base = opacity;
    g.add(m);
    return m;
  };
  add(new THREE.TorusGeometry(r, 0.55, 8, 96), 0xfff0c8, 0.85);
  add(new THREE.TorusGeometry(r, 2.2, 8, 96), 0xffd8a0, 0.18);
  for (let i = 0; i < 12; i++) {
    const s = add(new THREE.BoxGeometry(0.4, 3.2, 0.4), 0xfff4dc, 0.6);
    const a = (i / 12) * Math.PI * 2;
    s.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
    s.rotation.z = a;
  }
  g.position.set(...f.at);
  g.rotation.x = Math.PI / 2 - (f.tilt ?? 0.18);
  g.renderOrder = 3;
  g.userData.spin = f.spin ?? 0.05;
  return g;
}

// the unbuilt city: towers drawn in pale construction lines, hanging upside down from the sky
function unbuiltMesh(f) {
  const pts = [];
  let s = 7;
  const rnd = () => ((s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296);
  const [cx, cz] = f.at;
  const top = f.h || 150;
  const edges = (x0, y0, z0, x1, y1, z1) => {
    const c = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
    for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) pts.push(...c[a], ...c[b]);
  };
  for (let i = 0; i < (f.n || 46); i++) {
    const a = rnd() * Math.PI * 2, d = 40 + rnd() * (f.r || 220);
    const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    const w = 8 + rnd() * 16, dd = 8 + rnd() * 16, hh = 20 + rnd() * 70;
    edges(x - w / 2, top - hh, z - dd / 2, x + w / 2, top, z + dd / 2);
    for (let k = 1; k < hh / 7; k++) {
      const y = top - k * 7;
      pts.push(x - w / 2, y, z - dd / 2, x + w / 2, y, z - dd / 2, x + w / 2, y, z - dd / 2, x + w / 2, y, z + dd / 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const m = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: f.color ?? 0x8a80c0, transparent: true, opacity: 0.32, depthWrite: false, fog: false }));
  m.frustumCulled = false;
  m.renderOrder = -7;
  return m;
}

// the cloud sea: a sheet of cloud below the terraces, with gaps onto the lagoon city far below
const SEA_FRAG = /* glsl */ `
uniform sampler2D uNoise; uniform vec3 uTop, uShade; uniform float uTime, uCover;
varying vec2 vUv; varying vec3 vW;
void main() {
  vec2 p = vW.xz * 0.004 + vec2(uTime * 0.002, 0.0);
  float n = texture2D(uNoise, p).r * 0.7 + texture2D(uNoise, p * 3.1).g * 0.3;
  float a = smoothstep(1.0 - uCover, 1.0 - uCover + 0.22, n);
  float r = length(vUv - 0.5) * 2.0;
  vec3 col = mix(uShade, uTop, smoothstep(0.35, 0.9, n));
  gl_FragColor = vec4(col, a * (1.0 - smoothstep(0.85, 1.0, r)));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const SEA_VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vW;
void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
function cloudSea(f) {
  const g = new THREE.Group();
  const lag = document.createElement('canvas');
  lag.width = lag.height = 256;
  const x = lag.getContext('2d');
  x.fillStyle = '#2a4a50';
  x.fillRect(0, 0, 256, 256);
  let s = 3;
  const rnd = () => ((s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296);
  // the lagoon city far below: tower roofs with gardens, water between
  for (let i = 0; i < 700; i++) {
    const v = rnd();
    x.fillStyle = v < 0.5 ? `rgba(${60 + rnd() * 40 | 0},${90 + rnd() * 50 | 0},${70 + rnd() * 30 | 0},0.9)` : `rgba(${110 + rnd() * 60 | 0},${110 + rnd() * 50 | 0},${100 + rnd() * 40 | 0},0.9)`;
    x.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 4, 1 + rnd() * 4);
  }
  const lt = new THREE.CanvasTexture(lag);
  lt.colorSpace = THREE.SRGBColorSpace;
  lt.wrapS = lt.wrapT = THREE.RepeatWrapping;
  lt.repeat.set(6, 6);
  const below = new THREE.Mesh(new THREE.CircleGeometry(f.r || 1400, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: lt, fog: false, color: f.lagoon ?? 0xb8c8c8 }));
  below.position.y = f.lagoonY ?? -320;
  below.renderOrder = -8;
  g.add(below);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uNoise: { value: noise() }, uTop: { value: new THREE.Color(f.top ?? 0xffffff) }, uShade: { value: new THREE.Color(f.shade ?? 0xb8c8dc) }, uTime: { value: 0 }, uCover: { value: f.cover ?? 0.78 } },
    vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, transparent: true, depthWrite: false, fog: false, toneMapped: true,
  });
  const sea = new THREE.Mesh(new THREE.CircleGeometry(f.r || 1400, 64).rotateX(-Math.PI / 2), mat);
  sea.position.y = f.y ?? -12;
  sea.renderOrder = -6;
  g.add(sea);
  g.userData.mat = mat;
  g.userData.textures = [lt];
  g.userData.cloud = sea;
  return g;
}

export class Sky {
  constructor(root, level) {
    this.level = level;
    const u = {
      uNoise: { value: noise() }, uTime: { value: 0 }, uCloudT: { value: 0 }, uFlash: { value: 0 },
      uCl1: { value: new THREE.Vector4(0.5, 0.01, 1, 0) }, uCl2: { value: new THREE.Vector4(0.3, 0.01, 2, 0) },
      uRing: { value: new THREE.Vector4(0, 0.19, 0.045, 0) }, uRingDir: { value: new THREE.Vector3(0, 1, 0) },
      uStorm: { value: new THREE.Vector4(0, 1, 1, 0) }, uStormDir: { value: new THREE.Vector3(0, 0, -1) }, uBandCol: { value: new THREE.Color(0x0a0e22) },
      uWedge: { value: new THREE.Vector4(0, 5, 0, 0.6) }, uWedgeCol: { value: Array.from({ length: 7 }, () => new THREE.Color(0x888888)) }, uWedgeSoft: { value: 0 },
      uEclipse: { value: new THREE.Vector4(0, 0.05, 1, 0) }, uEclipseDir: { value: new THREE.Vector3(0, 1, 0) },
    };
    for (const k of COLORS) u[k] = { value: new THREE.Color() };
    for (const k of DIRS) u[k] = { value: new THREE.Vector3(0, 1, 0) };
    for (const k of SCALARS) u[k] = { value: 0 };
    this.u = u;
    this.mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: true });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(420, 48, 24), this.mat);
    this.mesh.name = 'lvSky';
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
    this.mesh.castShadow = this.mesh.receiveShadow = false;
    root.add(this.mesh);
    this.extras = [];
    this.features = (level.skyFeatures || []).map((f) => {
      const o = { ...f, cond: f.when ? compileCondition(f.when) : () => true, k: 0 };
      if (f.kind === 'halo') o.mesh = haloMesh(f);
      if (f.kind === 'unbuilt') o.mesh = unbuiltMesh(f);
      if (f.kind === 'cloudSea') o.mesh = cloudSea(f);
      if (f.kind === 'beacon') o.mesh = beaconMesh(f);
      if (o.mesh) {
        o.mesh.visible = false;
        root.add(o.mesh);
        this.extras.push(o.mesh);
      }
      if (f.kind === 'route') o.stops = f.stops.map(([z, sky]) => ({ z, sky }));
      // (a mission may give each year its own wedges, `when: '@PAST'`: the strongest one sets the sky, its colours eased in)
      if (f.kind === 'wedges') { o.colors = f.cols.map((c) => new THREE.Color(c)); f.cols.forEach((c, i) => u.uWedgeCol.value[i]?.setHex(c)); }
      return o;
    });
    this.goal = null;
    this.year = null;
    this.cloudT = 0;
    this.routeGoal = {};
    this.routeMix = {};
    this.targets = {};
  }

  // the year's preset: instant at a load, eased otherwise
  setYear(y, instant = false) {
    this.year = y;
    this.targets = {};
    this.goal = this.targetOf(y.sky);
    if (instant) {
      this.ease(1);
      this.snap = true; // the features settle at once on the next update too (the route at Kai's place, an ending's sky)
    }
  }

  // a preset in this year's light (cached per year: no allocation per frame)
  targetOf(sky) {
    return (this.targets[sky] ||= target(this.year, sky));
  }

  ease(k) {
    const g = this.goal, u = this.u;
    if (!g) return;
    const c = _c, v = _v; // (no allocation: this runs every frame)
    for (const key of COLORS) u[key].value.lerp(c.setHex(g[key]), k);
    for (const key of DIRS) u[key].value.lerp(v.set(g[key][0], g[key][1], g[key][2]), k).normalize();
    for (const key of SCALARS) u[key].value += (g[key] - u[key].value) * k;
    easeW(u.uCl1.value, g.cl1, k);
    easeW(u.uCl2.value, g.cl2, k);
  }

  // the light along a route: the two stops either side of z, blended
  routeAt(f, z) {
    const st = f.stops;
    const first = st[0], last = st[st.length - 1];
    if ((z - first.z) * (last.z - first.z) <= 0) return this.targetOf(first.sky);
    if ((z - last.z) * (last.z - first.z) >= 0) return this.targetOf(last.sky);
    for (let i = 0; i < st.length - 1; i++) {
      const a = st[i], b = st[i + 1];
      const k = (z - a.z) / (b.z - a.z || 1);
      if (k >= 0 && k <= 1) return blend(this.routeGoal, this.targetOf(a.sky), this.targetOf(b.sky), k);
    }
    return this.targetOf(last.sky);
  }

  update(dt, camera, { time, flash = 0, ctx }) {
    const cam = camera.position;
    this.mesh.position.copy(cam);
    // the features first: some change what the sky eases toward
    let drift = 1;
    let goal = this.year ? this.targetOf(this.year.sky) : null;
    let wb = null;
    for (const f of this.features) {
      const on = !!f.cond(ctx);
      f.k = this.snap ? (on ? 1 : 0) : f.k + ((on ? 1 : 0) - f.k) * Math.min(1, dt * (f.rate ?? 0.6));
      if (f.kind === 'ringHole') {
        const r = this.u.uRing.value;
        r.x = f.k;
        r.y = ((f.r || 11) * Math.PI) / 180;
        r.z = ((f.w || 2.6) * Math.PI) / 180;
        const H = Math.tan(((f.elev || 58) * Math.PI) / 180) * 160;
        this.u.uRingDir.value.set(f.at[0] - cam.x, H, f.at[1] - cam.z).normalize();
      } else if (f.kind === 'storm') {
        this.u.uStorm.value.set(f.k, f.bands ?? 1, f.eye ?? 1, time);
        this.u.uStormDir.value.set(...(f.dir ||= dirOf(f.az ?? 0, 0))).normalize(); // (a feature's bearing is fixed: worked out once)
        if (f.band) this.u.uBandCol.value.setHex(f.band);
      } else if (f.kind === 'wedges') {
        if (!wb || f.k > wb.k) wb = f;
      } else if (f.kind === 'eclipse') {
        this.u.uEclipse.value.set(f.k, (f.size || 3) * deg, f.corona ?? 1.2, 0);
        this.u.uEclipseDir.value.set(...(f.dir ||= dirOf(f.az ?? 180, f.elev ?? 40)));
      } else if (f.kind === 'reverse') {
        const [x0, z0, x1, z1] = f.box;
        if (on && cam.x > x0 && cam.x < x1 && cam.z > z0 && cam.z < z1) drift = -1;
      } else if (f.kind === 'route' && on && goal) goal = blend(this.routeMix, this.routeAt(f, cam.z), goal, f.year ?? 0.35); // (the light along the road, with a third of the year's own: a year switch still reads overhead)
      else if (f.kind === 'preset' && on) goal = this.targetOf(f.sky);
      if (f.mesh) {
        f.mesh.visible = f.k > 0.02;
        if (f.kind === 'halo') {
          f.mesh.rotation.z += dt * f.mesh.userData.spin;
          for (const o of f.mesh.children) o.material.opacity = o.userData.base * f.k;
        }
        if (f.kind === 'cloudSea') {
          f.mesh.position.set(cam.x, 0, cam.z);
          f.mesh.userData.mat.uniforms.uTime.value = time;
        }
        if (f.kind === 'beacon' && f.mesh.visible) {
          // (on the horizon band's cylinder, just inside it: the band is drawn round the camera, 1.6 m down)
          const b = (f.az ?? 0) * deg, r = 376;
          f.mesh.position.set(cam.x + r * Math.sin(b), cam.y - 1.6 + r * Math.tan((f.elev ?? 6) * deg), cam.z - r * Math.cos(b));
          f.mesh.lookAt(cam);
          const pulse = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(time * (f.speed ?? 1.3)));
          for (const o of f.mesh.children) o.material.opacity = o.userData.base * f.k * pulse;
        }
      }
    }
    if (wb) {
      this.u.uWedge.value.set(wb.k, wb.n || 5, (wb.turn || 0) + time * (wb.spin || 0), wb.mix ?? 0.6);
      this.u.uWedgeSoft.value = wb.soft ?? 0;
      const kk = this.snap ? 1 : Math.min(1, dt * 2.5);
      wb.colors.forEach((c, i) => this.u.uWedgeCol.value[i]?.lerp(c, kk));
    }
    if (goal) this.goal = goal;
    this.ease(this.snap ? 1 : 1 - Math.exp(-dt * 3.2));
    this.snap = false;
    this.cloudT += dt * drift;
    this.u.uTime.value = time;
    this.u.uCloudT.value = this.cloudT;
    this.u.uFlash.value = flash;
  }

  dispose() {
    this.mesh.parent?.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mat.dispose();
    for (const m of this.extras) {
      m.parent?.remove(m);
      m.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose?.();
      });
      for (const t of m.userData.textures || []) t.dispose();
    }
  }
}
