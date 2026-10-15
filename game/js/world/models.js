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
    ? basic(0x7ff8ff, { transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
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
  const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), basic(0x9dff9d, { wireframe: true }));
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), basic(0xeaffea));
  const { tex, aspect } = textTexture(label, { color: '#9dff9d', font: 'bold 56px monospace' });
  const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
  tag.scale.set(0.32 * aspect, 0.32, 1);
  tag.position.y = 0.48;
  g.add(gem, inner, tag);
  g.userData.gem = gem;
  return g;
}

// Hologram figure (Custodian) and silhouette (the Other) share a body plan.
export function makeFigure({ color = 0x6ff0d4, opacity = 0.55, height = 1.8, wire = true } = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, wireframe: wire,
  });
  const k = height / 1.8;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * k, 0.26 * k, 0.75 * k, 8, 2), mat);
  torso.position.y = 1.15 * k;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15 * k, 10, 8), mat);
  head.position.y = 1.68 * k;
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * k, 0.12 * k, 0.78 * k, 8, 2), mat);
  legs.position.y = 0.39 * k;
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * k, 0.04 * k, 0.7 * k, 6), mat);
  armL.position.set(-0.3 * k, 1.12 * k, 0);
  armL.rotation.z = 0.12;
  const armR = armL.clone();
  armR.position.x = 0.3 * k;
  armR.rotation.z = -0.12;
  g.add(torso, head, legs, armL, armR);
  g.userData.mat = mat;
  return g;
}

export function makeShadowFigure() {
  const g = makeFigure({ color: 0x000000, opacity: 1, height: 1.85, wire: false });
  const m = new THREE.MeshBasicMaterial({ color: 0x05070a });
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
    color: 0xff6aa0, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false,
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

// The Observer: too tall, too thin, one eye.
export function makeObserver() {
  const g = new THREE.Group();
  const body = lam(0x1a1c22, { emissive: 0x050608 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 1.5, 7), body);
  torso.position.y = 1.65;
  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.3, 7), body);
  pelvis.position.y = 0.85;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.35, 6), body);
  neck.position.y = 2.55;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), body);
  head.scale.set(0.85, 1.35, 0.95);
  head.position.y = 2.88;
  const eyeMat = basic(0xffffff);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), eyeMat);
  eye.position.set(0, 2.92, -0.19);
  const legs = [];
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.95, 6), body);
    leg.geometry.translate(0, -0.475, 0);
    leg.position.set(0.1 * sx, 0.85, 0);
    legs.push(leg);
    g.add(leg);
  }
  const arms = [];
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.025, 1.7, 6), body);
    arm.geometry.translate(0, -0.85, 0);
    arm.position.set(0.28 * sx, 2.3, 0);
    arm.rotation.z = 0.06 * sx;
    arms.push(arm);
    g.add(arm);
  }
  // Vision cone, faint, for legibility.
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.05, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 9, 20, 1, true), coneMat);
  cone.geometry.translate(0, -4.5, 0);
  cone.rotation.x = Math.PI / 2 - 0.12; // base points along -z (forward)
  cone.position.set(0, 2.92, -0.2);
  g.add(torso, pelvis, neck, head, eye, cone);
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
