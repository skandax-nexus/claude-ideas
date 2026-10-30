// Character and prop models built from primitives. Low-poly by design:
// silhouettes and emissive light carry the look, which is cheap on mobile.
import * as THREE from '../../vendor/three.module.min.js';
import { textTexture } from './materials.js';

const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });

export function makeShard() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), basic(0xe6ddff));
  const shell = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.5, 0),
    basic(0x9a7bff, { wireframe: true, transparent: true, opacity: 0.7 }),
  );
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.7, 0.76, 48),
    basic(0xb8a0ff, { transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
  );
  g.add(core, shell, halo);
  g.userData.spin = (t) => {
    core.rotation.y = t * 1.3;
    shell.rotation.y = -t * 0.7;
    shell.rotation.x = t * 0.4;
    halo.rotation.x = Math.sin(t * 0.5) * 0.8;
    halo.rotation.y = t * 0.6;
    g.position.y = g.userData.baseY + Math.sin(t * 1.6) * 0.08;
  };
  return g;
}

// First-person device held in the left hand.
export function makeDevice() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), basic(0xffffff));
  const shell = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), basic(0x9a7bff, { wireframe: true }));
  g.add(core, shell);
  g.userData.shell = shell;
  g.userData.core = core;
  return g;
}

export function makeTerminal() {
  const g = new THREE.Group();
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), basic(0x2ad8ff, { transparent: true, opacity: 0.85 }));
  screen.position.set(0, 0.42, 0);
  screen.rotation.x = -0.5;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.65, 0.05), lam(0x3a4048));
  frame.position.set(0, 0.42, -0.03);
  frame.rotation.x = -0.5;
  g.add(frame, screen);
  g.userData.screen = screen;
  return g;
}

export function makeMachineRing() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.22, 10, 48), lam(0x8090a8, { emissive: 0x101828 }));
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(2.25, 0.05, 6, 48),
    basic(0x6ff0ff, { transparent: true, opacity: 0.6 }),
  );
  const struts = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.5), lam(0x606878));
    const a = (i / 6) * Math.PI * 2;
    s.position.set(Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0);
    s.rotation.z = a;
    struts.add(s);
  }
  g.add(ring, inner, struts);
  g.position.set(0, 3.6, 0);
  g.userData.inner = inner;
  return g;
}

export function makeCoreItem() {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), basic(0xffb24a));
  const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 0), basic(0x664020, { wireframe: true }));
  g.add(s, cage);
  return g;
}

export function makeKeyItem(echo = true) {
  const g = new THREE.Group();
  const mat = echo
    ? basic(0x22b5c4, { transparent: true, opacity: 0.85, depthWrite: false })
    : basic(0xd8f0ff);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 16), mat);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.04), mat);
  shaft.position.y = -0.24;
  const bit = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.04), mat);
  bit.position.set(0.05, -0.36, 0);
  g.add(bow, shaft, bit);
  g.userData.mat = mat;
  return g;
}

export function makeToken(label) {
  const g = new THREE.Group();
  const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), basic(0x2fae6a, { wireframe: true }));
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), basic(0x7fe0a8));
  const { tex, aspect } = textTexture(label, { color: '#1f8a54', font: 'bold 56px sans-serif' });
  const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
  tag.scale.set(0.32 * aspect, 0.32, 1);
  tag.position.y = 0.48;
  g.add(gem, inner, tag);
  g.userData.gem = gem;
  return g;
}

// Hologram figure (Custodian) and silhouette (the Other) share a body plan.
export function makeFigure({ color = 0x6ff0d4, opacity = 0.55, height = 1.8, wire = true } = {}) {
  // A soft hologram: translucent body + bright edges (readable on light backgrounds).
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: Math.min(0.5, opacity), depthWrite: false });
  const edge = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 });
  const k = height / 1.8;
  const parts = [
    [new THREE.CapsuleGeometry(0.22 * k, 0.5 * k, 4, 10), [0, 1.15 * k, 0]],
    [new THREE.SphereGeometry(0.16 * k, 14, 10), [0, 1.68 * k, 0]],
    [new THREE.CapsuleGeometry(0.15 * k, 0.55 * k, 4, 8), [0, 0.45 * k, 0]],
    [new THREE.CapsuleGeometry(0.05 * k, 0.55 * k, 3, 6), [-0.3 * k, 1.12 * k, 0]],
    [new THREE.CapsuleGeometry(0.05 * k, 0.55 * k, 3, 6), [0.3 * k, 1.12 * k, 0]],
  ];
  for (const [geo, pos] of parts) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    if (wire) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), edge));
    g.add(m);
  }
  g.userData.mat = mat;
  return g;
}

/** Stylised people (player, Juno, the Other): rounded, friendly, readable silhouettes. */
export function makeCharacter({ suit = 0xf4f7fa, accent = 0x46b6c8, skin = 0xf1c7a8, hair = 0x4a3a32, visor = false, height = 1.75 } = {}) {
  const g = new THREE.Group();
  const k = height / 1.75;
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
  const suitM = std(suit), accentM = std(accent, { emissive: accent, emissiveIntensity: 0.25 }), skinM = std(skin), hairM = std(hair);
  const mesh = (geo, m, x, y, z, parent = g) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x * k, y * k, z * k);
    o.castShadow = true;
    parent.add(o);
    return o;
  };
  const hips = new THREE.Group(); hips.position.y = 0.88 * k; g.add(hips);
  const torso = mesh(new THREE.CapsuleGeometry(0.23 * k, 0.36 * k, 4, 12), suitM, 0, 1.22, 0);
  mesh(new THREE.TorusGeometry(0.2 * k, 0.025 * k, 6, 20), accentM, 0, 1.06, 0).rotation.x = Math.PI / 2;
  mesh(new THREE.BoxGeometry(0.3 * k, 0.32 * k, 0.12 * k), accentM, 0, 1.25, -0.2); // backpack
  const head = mesh(new THREE.SphereGeometry(0.17 * k, 18, 14), skinM, 0, 1.66, 0);
  const hairCap = mesh(new THREE.SphereGeometry(0.18 * k, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM, 0, 1.68, -0.01);
  hairCap.rotation.x = -0.25;
  if (visor) mesh(new THREE.CapsuleGeometry(0.06 * k, 0.16 * k, 3, 8), std(0x1d2b38, { roughness: 0.2 }), 0, 1.67, 0.15).rotation.z = Math.PI / 2;
  else {
    const eye = std(0x2a2a33);
    mesh(new THREE.SphereGeometry(0.022 * k, 8, 6), eye, -0.06, 1.68, 0.155);
    mesh(new THREE.SphereGeometry(0.022 * k, 8, 6), eye, 0.06, 1.68, 0.155);
  }
  const limb = (x, y, len, r, m) => {
    const pivot = new THREE.Group();
    pivot.position.set(x * k, y * k, 0);
    g.add(pivot);
    const l = mesh(new THREE.CapsuleGeometry(r * k, len * k, 4, 8), m, 0, -(len / 2 + r), 0, pivot);
    l.position.set(0, -(len / 2 + r) * k, 0);
    return pivot;
  };
  const armL = limb(-0.31, 1.44, 0.42, 0.065, suitM), armR = limb(0.31, 1.44, 0.42, 0.065, suitM);
  const legL = limb(-0.11, 0.9, 0.52, 0.085, std(0x5a6f86)), legR = limb(0.11, 0.9, 0.52, 0.085, std(0x5a6f86));
  const handL = new THREE.Group(); handL.position.set(0, -0.62 * k, 0.05 * k); armL.add(handL);
  const handR = new THREE.Group(); handR.position.set(0, -0.62 * k, 0.05 * k); armR.add(handR);
  g.userData = { torso, head, armL, armR, legL, legR, handL, handR, walk: 0, hips };
  g.userData.animate = (dt, speed, t, airborne = false) => {
    const u = g.userData;
    u.walk += dt * speed * 2.4;
    const sw = airborne ? 0.5 : Math.sin(u.walk) * Math.min(0.75, speed * 0.16);
    legL.rotation.x = sw; legR.rotation.x = airborne ? -0.3 : -sw;
    armL.rotation.x = -sw * 0.8; armR.rotation.x = sw * 0.8;
    torso.position.y = 1.22 * k + Math.abs(Math.sin(u.walk)) * 0.03 * Math.min(1, speed / 3) + Math.sin(t * 1.8) * 0.006;
    head.rotation.y = Math.sin(t * 0.4) * 0.08;
  };
  return g;
}

/** TICK: a round little maintenance drone with one big friendly eye. */
export function makeTick() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), new THREE.MeshStandardMaterial({ color: 0xffd25a, roughness: 0.45 }));
  body.scale.y = 0.85;
  body.castShadow = true;
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), new THREE.MeshBasicMaterial({ color: 0x24303c }));
  face.position.z = 0.158;
  const eye = new THREE.Mesh(new THREE.CircleGeometry(0.045, 20), new THREE.MeshBasicMaterial({ color: 0x7fe8ff }));
  eye.position.z = 0.161;
  const rotor = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 6, 24), new THREE.MeshStandardMaterial({ color: 0xc8d2dc, roughness: 0.4 }));
  rotor.rotation.x = Math.PI / 2;
  rotor.position.y = 0.17;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.06), rotor.material);
  mast.position.y = 0.15;
  g.add(body, face, eye, rotor, mast);
  g.userData = { eye, rotor };
  return g;
}

export function makeShadowFigure() {
  const g = makeFigure({ color: 0x000000, opacity: 1, height: 1.85, wire: false });
  const m = new THREE.MeshBasicMaterial({ color: 0x2a2450 });
  g.traverse((o) => {
    if (o.isMesh) o.material = m;
  });
  const rim = makeFigure({ color: 0x4ff0ff, opacity: 0.6, height: 1.9, wire: true });
  g.add(rim);
  return g;
}

// A flat silhouette painted on a wall.
export function makeWallShadow() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const gx = c.getContext('2d');
  const grd = gx.createRadialGradient(64, 128, 10, 64, 128, 120);
  grd.addColorStop(0, 'rgba(0,0,0,0.9)');
  grd.addColorStop(1, 'rgba(0,0,0,0.0)');
  gx.fillStyle = grd;
  gx.beginPath();
  gx.ellipse(64, 40, 20, 24, 0, 0, Math.PI * 2);
  gx.fill();
  gx.beginPath();
  gx.moveTo(34, 70);
  gx.quadraticCurveTo(64, 58, 94, 70);
  gx.lineTo(90, 160);
  gx.lineTo(80, 250);
  gx.lineTo(48, 250);
  gx.lineTo(38, 160);
  gx.closePath();
  gx.fill();
  const t = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 2.0),
    new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0.85 }),
  );
  return m;
}

export function makeBrain() {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.75, 28, 20);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = Math.sin(v.x * 11) * Math.sin(v.y * 13) * Math.sin(v.z * 9) * 0.06;
    v.multiplyScalar(1 + n);
    v.x *= 1.25;
    // the longitudinal fissure
    if (Math.abs(v.x) < 0.06 && v.y > 0) v.y -= 0.1;
    p.setXYZ(i, v.x, v.y * 0.85, v.z);
  }
  geo.computeVertexNormals();
  const m = new THREE.MeshLambertMaterial({ color: 0xd88aa0, emissive: 0x5a1830 });
  const brain = new THREE.Mesh(geo, m);
  brain.rotation.y = Math.PI / 2;
  const glowM = new THREE.MeshBasicMaterial({
    color: 0xff9ac0, transparent: true, opacity: 0.25, depthWrite: false,
  });
  const glow = new THREE.Mesh(new THREE.SphereGeometry(1.05, 16, 12), glowM);
  g.add(brain, glow);
  g.userData.pulse = (t) => {
    const s = 1 + Math.sin(t * 2.4) * 0.04;
    brain.scale.setScalar(s);
    glowM.opacity = 0.18 + Math.max(0, Math.sin(t * 2.4)) * 0.2;
  };
  return g;
}

// The Observer: a tall, sleek white sentinel with a glowing visor. Curious, not monstrous.
export function makeObserver() {
  const g = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0xf5f7fa, roughness: 0.35, metalness: 0.05 });
  const joint = new THREE.MeshStandardMaterial({ color: 0x9fb0c2, roughness: 0.5 });
  const add = (geo, m, x, y, z) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    g.add(o);
    return o;
  };
  add(new THREE.CapsuleGeometry(0.26, 0.9, 6, 16), shell, 0, 1.75, 0);
  add(new THREE.CylinderGeometry(0.14, 0.2, 0.25, 16), joint, 0, 1.08, 0);
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10), joint, 0, 2.48, 0);
  const head = add(new THREE.SphereGeometry(0.27, 24, 18), shell, 0, 2.78, 0);
  head.scale.set(1.05, 0.82, 1);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x7fd8ff });
  const eye = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.24, 4, 10), eyeMat);
  eye.rotation.z = Math.PI / 2;
  eye.position.set(0, 2.8, -0.235);
  g.add(eye);
  const legs = [];
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.75, 4, 8), shell);
    leg.geometry.translate(0, -0.45, 0);
    leg.position.set(0.12 * sx, 0.95, 0);
    leg.castShadow = true;
    legs.push(leg);
    g.add(leg);
  }
  const arms = [];
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 1.1, 4, 8), shell);
    arm.geometry.translate(0, -0.65, 0);
    arm.position.set(0.34 * sx, 2.15, 0);
    arm.castShadow = true;
    arms.push(arm);
    g.add(arm);
  }
  // A soft cone shows where it is looking (helps players plan, reduces stress).
  // one colour at low opacity: one pass over both faces blends the same as two
  const coneMat = new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 9, 24, 1, true), coneMat);
  cone.geometry.translate(0, -4.5, 0);
  cone.rotation.x = Math.PI / 2 - 0.12;
  cone.position.set(0, 2.8, -0.2);
  g.add(cone);
  g.userData = { eyeMat, coneMat, legs, arms, head };
  return g;
}

export function makeCable(points, color = 0xff6aa0) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curve, 48, 0.07, 6, false);
  const mat = new THREE.MeshBasicMaterial({ color });
  return new THREE.Mesh(geo, mat);
}

export function makeStarfield() {
  const n = 1800;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(180 + Math.random() * 60);
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, fog: false }));
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(40, 32, 20),
    new THREE.MeshBasicMaterial({ color: 0x3a2a6a, fog: false }),
  );
  planet.position.set(140, -40, 60);
  const rim = new THREE.Mesh(
    new THREE.SphereGeometry(41.5, 32, 20),
    new THREE.MeshBasicMaterial({ color: 0x8a6aff, transparent: true, opacity: 0.25, fog: false, side: THREE.BackSide }),
  );
  planet.add(rim);
  const g = new THREE.Group();
  g.add(stars, planet);
  return g;
}
