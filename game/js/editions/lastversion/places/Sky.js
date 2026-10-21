// THE LAST VERSION OF EARTH: the sky over a place (OVERHAUL.md §4.3, §4.5). One inverted sphere
// (r 420) that follows the camera, one ShaderMaterial (fog off, no depth write, drawn first): the
// gradient from the year's zenith to its horizon and ground, the city glow on the horizon, the sun
// disc and its glow, the moon, a star field, one bright star (Mission 7's), two scrolling cloud layers
// from a tileable noise texture painted once, the lightning flash (Weather.flash), and the features a
// mission's sky can carry: the black ring-shaped hole in the clouds over the station after the Zero
// Second (Mission 1). On a year switch every uniform eases over about 1.2 s. One draw call.
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
uniform vec3 uZenith, uHorizon, uGround, uGlow, uSun, uC1, uC1s, uC2, uC2s, uSunDir, uMoonDir, uStarDir, uRingDir;
uniform float uGlowK, uSunSize, uSunGlow, uStars, uMoon, uStar, uFlash, uTime;
uniform vec4 uCl1, uCl2, uRing; // cover, speed, scale, -; ring: on, radius, width, -
uniform sampler2D uNoise;
varying vec3 vDir;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = h > 0.0 ? mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.5)) : mix(uHorizon, uGround, clamp(-h * 5.0, 0.0, 1.0));
  col += uGlow * uGlowK * exp(-abs(h) * 9.0);
  float sd = dot(d, uSunDir);
  col += uSun * uSunGlow * (pow(max(sd, 0.0), 6.0) * 0.22 + pow(max(sd, 0.0), 60.0) * 0.5);
  float night = 1.0 - clamp(dot(col, vec3(0.333)) * 2.2, 0.0, 1.0);
  if (uStars > 0.0 && h > 0.0) {
    vec3 g = floor(d * 260.0);
    float s = hash(g);
    col += vec3(0.9, 0.95, 1.0) * step(0.9972, s) * (s - 0.9972) * 300.0 * uStars * smoothstep(0.02, 0.25, h);
  }
  if (uStar > 0.0) col += vec3(1.0, 0.96, 0.9) * uStar * (pow(max(dot(d, uStarDir), 0.0), 6000.0) * 3.0 + pow(max(dot(d, uStarDir), 0.0), 400.0) * 0.25);
  if (uMoon > 0.0) {
    float md = dot(d, uMoonDir);
    float disc = smoothstep(0.99955, 0.9997, md);
    float lit = smoothstep(0.99955, 0.9997, dot(normalize(d + uMoonDir * 0.0 - vec3(0.012, 0.0, 0.0)), uMoonDir));
    col += vec3(0.85, 0.88, 0.95) * uMoon * (disc - lit * 0.75) + vec3(0.4, 0.45, 0.6) * uMoon * pow(max(md, 0.0), 300.0) * 0.12;
  }
  // the sun disc, under the clouds
  float disc = uSunSize > 0.0 ? smoothstep(1.0 - uSunSize, 1.0 - uSunSize * 0.55, sd) : 0.0;
  col = mix(col, uSun * 2.2, disc);
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
    float n1 = texture2D(uNoise, p * uCl1.z * 0.12 + vec2(uTime * uCl1.y, uTime * uCl1.y * 0.35)).r;
    n1 = n1 * 0.7 + texture2D(uNoise, p * uCl1.z * 0.31 - vec2(uTime * uCl1.y * 0.6, 0.0)).g * 0.3;
    float c1 = smoothstep(1.0 - uCl1.x, 1.0 - uCl1.x + 0.32, n1) * fade;
    vec3 cc1 = mix(uC1s, uC1, smoothstep(0.2, 0.85, n1)) + uSun * uSunGlow * pow(max(sd, 0.0), 8.0) * 0.25;
    float n2 = texture2D(uNoise, p * uCl2.z * 0.05 + vec2(uTime * uCl2.y * 0.7, -uTime * uCl2.y * 0.2)).g;
    float c2 = smoothstep(1.0 - uCl2.x, 1.0 - uCl2.x + 0.45, n2) * fade * 0.7;
    vec3 cc2 = mix(uC2s, uC2, n2);
    col = mix(col, cc2, c2 * (1.0 - ring));
    col = mix(col, cc1, c1 * (1.0 - ring));
  }
  col = mix(col, vec3(0.008, 0.008, 0.012), ring * 0.95);
  col += vec3(0.55, 0.42, 0.85) * ring * (1.0 - ring) * 0.5;
  col += vec3(0.55, 0.6, 0.8) * uFlash * 0.55;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const COLORS = ['uZenith', 'uHorizon', 'uGround', 'uGlow', 'uSun', 'uC1', 'uC1s', 'uC2', 'uC2s'];
const DIRS = ['uSunDir', 'uMoonDir', 'uStarDir'];
const SCALARS = ['uGlowK', 'uSunSize', 'uSunGlow', 'uStars', 'uMoon', 'uStar'];

// what a year's sky preset sets (targets of the easing)
function target(y) {
  const p = SKIES[y.sky] || SKIES.clearMidday;
  const sun = sunVector(y.sun);
  const az = ((y.sun?.az ?? 140) + 160) * (Math.PI / 180);
  return {
    uZenith: p.zenith, uHorizon: p.horizon, uGround: p.ground, uGlow: p.glow, uSun: p.sun,
    uC1: p.clouds.color, uC1s: p.clouds.shade, uC2: p.cirrus.color, uC2s: p.cirrus.shade,
    uSunDir: sun, uMoonDir: [Math.sin(az) * 0.8, 0.45, -Math.cos(az) * 0.8], uStarDir: p.starDir || [0.32, 0.62, -0.72],
    uGlowK: p.glowK, uSunSize: p.sunSize, uSunGlow: p.sunGlow, uStars: p.stars || 0, uMoon: p.moon || 0, uStar: p.star || 0,
    cl1: [p.clouds.cover, p.clouds.speed, p.clouds.scale], cl2: [p.cirrus.cover, p.cirrus.speed, p.cirrus.scale],
  };
}

export class Sky {
  constructor(root, level) {
    this.level = level;
    const u = { uNoise: { value: noise() }, uTime: { value: 0 }, uFlash: { value: 0 }, uCl1: { value: new THREE.Vector4(0.5, 0.01, 1, 0) }, uCl2: { value: new THREE.Vector4(0.3, 0.01, 2, 0) }, uRing: { value: new THREE.Vector4(0, 0.19, 0.045, 0) }, uRingDir: { value: new THREE.Vector3(0, 1, 0) } };
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
    this.features = (level.skyFeatures || []).map((f) => ({ ...f, cond: f.when ? compileCondition(f.when) : () => true, k: 0 }));
    this.goal = null;
  }

  // the year's preset: instant at a load, eased otherwise
  setYear(y, instant = false) {
    this.goal = target(y);
    if (instant) this.ease(1);
  }

  ease(k) {
    const g = this.goal, u = this.u;
    if (!g) return;
    const c = new THREE.Color();
    for (const key of COLORS) u[key].value.lerp(c.setHex(g[key]), k);
    for (const key of DIRS) u[key].value.lerp(new THREE.Vector3(...g[key]), k).normalize();
    for (const key of SCALARS) u[key].value += (g[key] - u[key].value) * k;
    for (const [key, v] of [['uCl1', g.cl1], ['uCl2', g.cl2]]) {
      const w = u[key].value;
      w.x += (v[0] - w.x) * k;
      w.y += (v[1] - w.y) * k;
      w.z += (v[2] - w.z) * k;
    }
  }

  update(dt, camera, { time, flash = 0, ctx }) {
    this.mesh.position.copy(camera.position);
    this.ease(1 - Math.exp(-dt * 3.2));
    this.u.uTime.value = time;
    this.u.uFlash.value = flash;
    // features: the ring hole fades in when its condition comes true
    for (const f of this.features) {
      const on = !!f.cond(ctx);
      f.k += ((on ? 1 : 0) - f.k) * Math.min(1, dt * 0.6);
      if (f.kind === 'ringHole') {
        const r = this.u.uRing.value;
        r.x = f.k;
        r.y = ((f.r || 11) * Math.PI) / 180;
        r.z = ((f.w || 2.6) * Math.PI) / 180;
        const H = Math.tan(((f.elev || 58) * Math.PI) / 180) * 160;
        this.u.uRingDir.value.set(f.at[0] - camera.position.x, H, f.at[1] - camera.position.z).normalize();
      }
    }
  }

  dispose() {
    this.mesh.parent?.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}
