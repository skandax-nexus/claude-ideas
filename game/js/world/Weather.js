// Atmosphere for HALCYON's districts: rain over the city, a storm over the
// tower (rain plus lightning), drifting steam in the reactor, fireflies in the
// forest - and for the vessel's decks: pollen in the garden, frost in the cryo
// bay, dust motes in the archive and the crew quarters, star dust in the
// observatory. One particle cloud that follows the camera, so it costs the
// same anywhere on the map.
import * as THREE from '../../vendor/three.module.min.js';

const N = 1400;
const R = 26; // the box around the camera

// colour, size, opacity, fall speed (negative rises), drift, and for indoor
// kinds a smaller box (radius R, height H) with fewer particles (n)
const KINDS = {
  rain: { color: 0xbfd8ff, size: 0.07, opacity: 0.55, fall: 22 },
  storm: { color: 0xffd0d0, size: 0.08, opacity: 0.6, fall: 22 },
  steam: { color: 0xcfeee8, size: 0.16, opacity: 0.16, fall: -0.9 },
  fireflies: { color: 0xdfff8a, size: 0.16, opacity: 0.95 },
  pollen: { color: 0xfff0b0, size: 0.05, opacity: 0.75, R: 11, H: 8, n: 650, drift: 0.6 },
  frost: { color: 0xf2f8ff, size: 0.045, opacity: 0.85, R: 11, H: 8, n: 800, fall: 0.35, drift: 0.5 },
  motes: { color: 0xffe2b0, size: 0.035, opacity: 0.7, R: 10, H: 8, n: 750, drift: 0.3 },
  stardust: { color: 0xc8d0ff, size: 0.035, opacity: 0.65, R: 11, H: 8, n: 550, drift: 0.25 },
};

export class Weather {
  constructor(scene) {
    this.scene = scene;
    this.kind = null;
    this.flash = 0;
    this.nextBolt = 6;
    this.cx = 0; // the centre the cloud last wrapped around (the player)
    this.cz = 0;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2 * R;
      pos[i * 3 + 1] = Math.random() * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2 * R;
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    // rewritten every frame: a dynamic buffer, and update() uploads only the particles in use
    this.geo.attributes.position.setUsage(THREE.DynamicDrawUsage);
    // a soft round sprite, so drops and fireflies aren't square
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 32, 32);
    this.mat = new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), alphaTest: 0.01, size: 0.08, transparent: true, opacity: 0.6, depthWrite: false, color: 0xbfd8ff, fog: true });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.visible = false;
    scene.add(this.points);
  }

  set(kind) {
    const k = KINDS[kind];
    this.kind = k ? kind : null;
    this.points.visible = !!k;
    if (!k) return;
    this.k = k;
    this.mat.color.setHex(k.color);
    this.mat.size = k.size;
    this.mat.opacity = k.opacity;
    // re-spread the particles when the box changes (outdoor <-> indoor)
    const box = (k.R || R) * 100 + (k.H || 20);
    this.n = k.n || N;
    this.geo.setDrawRange(0, this.n);
    const p = this.geo.attributes.position, a = p.array, r = k.R || R, r2 = 2 * r, cx = this.cx, cz = this.cz;
    if (this.box !== box) {
      this.box = box;
      const h = k.H || 20;
      for (let i = 0; i < N; i++) {
        a[i * 3] = (Math.random() - 0.5) * 2 * r;
        a[i * 3 + 1] = Math.random() * h;
        a[i * 3 + 2] = (Math.random() - 0.5) * 2 * r;
      }
    }
    // particles live in world space: wrap them all around where the cloud last was and upload the
    // whole buffer, so a change made after this frame's update() (an edition's year) draws in place
    for (let i = 0; i < N * 3; i += 3) {
      a[i] -= r2 * Math.floor((a[i] - cx + r) / r2);
      a[i + 2] -= r2 * Math.floor((a[i + 2] - cz + r) / r2);
    }
    p.clearUpdateRanges();
    p.needsUpdate = true;
  }

  // returns extra light for the frame (lightning)
  update(dt, t, center) {
    if (!this.kind) return 0;
    const p = this.geo.attributes.position;
    const a = p.array;
    const K = this.k, fall = K.fall || 0, drift = K.drift ?? (fall ? 0 : 1), top = K.H || 20, n = this.n;
    // the cloud stays at the world origin and each particle wraps around the centre on its own,
    // so particles move continuously instead of the whole box jumping 4 m as the player walks
    const r = K.R || R, r2 = 2 * r, cx = (this.cx = center.x), cz = (this.cz = center.z);
    for (let i = 0; i < n; i++) {
      const k = i * 3;
      if (fall) a[k + 1] -= fall * dt;
      if (drift) {
        a[k] += Math.sin(t * 0.7 + i) * dt * 0.4 * drift;
        if (!fall) a[k + 1] += Math.cos(t * 0.5 + i * 1.7) * dt * 0.25 * drift;
        else a[k + 2] += Math.cos(t * 0.6 + i * 1.3) * dt * 0.3 * drift;
      }
      if (fall > 0 && a[k + 1] < 0) a[k + 1] += top;
      if (fall < 0 && a[k + 1] > 8) a[k + 1] -= 8;
      // wrap into [-r, r) around the centre: a branch, since a float % per particle made rain ~9x slower
      const dx = a[k] - cx, dz = a[k + 2] - cz;
      if (dx < -r || dx >= r) a[k] -= r2 * Math.floor((dx + r) / r2);
      if (dz < -r || dz >= r) a[k + 2] -= r2 * Math.floor((dz + r) / r2);
    }
    // only the drawn particles changed (set() clears the range, so a change of kind uploads them all)
    p.clearUpdateRanges();
    p.addUpdateRange(0, n * 3);
    p.needsUpdate = true;
    this.points.position.set(0, 0, 0);
    // three sorts see-through objects by the bounding sphere's centre, computed once: keep it on
    // the player, so the weather sorts against nearby hair, holograms and effects as it did when
    // the cloud moved with the player. (Not culled and never ray-cast: it is only the sort key.)
    const bs = (this.geo.boundingSphere ??= new THREE.Sphere());
    bs.center.set(cx, top / 2, cz);
    bs.radius = r * 1.5;
    if (this.kind === 'storm') {
      this.nextBolt -= dt;
      if (this.nextBolt <= 0) {
        this.flash = 1;
        this.nextBolt = 7 + Math.random() * 9;
      }
      this.flash = Math.max(0, this.flash - dt * 3.2);
      return this.flash * (0.6 + 0.4 * Math.sin(t * 90));
    }
    return 0;
  }
}
