// Atmosphere for HALCYON's districts: rain over the city, a storm over the
// tower (rain plus lightning), drifting steam in the reactor, fireflies in the
// forest. One particle cloud that follows the camera, so it costs the same
// anywhere on the map.
import * as THREE from '../../vendor/three.module.min.js';

const N = 1400;
const R = 26; // the box around the camera

export class Weather {
  constructor(scene) {
    this.scene = scene;
    this.kind = null;
    this.flash = 0;
    this.nextBolt = 6;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2 * R;
      pos[i * 3 + 1] = Math.random() * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2 * R;
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
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
    this.kind = kind || null;
    this.points.visible = !!kind;
    if (!kind) return;
    const look = {
      rain: [0xbfd8ff, 0.07, 0.55],
      storm: [0xffd0d0, 0.08, 0.6],
      steam: [0xcfeee8, 0.16, 0.16],
      fireflies: [0xdfff8a, 0.16, 0.95],
    }[kind];
    this.mat.color.setHex(look[0]);
    this.mat.size = look[1];
    this.mat.opacity = look[2];
  }

  // returns extra light for the frame (lightning)
  update(dt, t, center) {
    if (!this.kind) return 0;
    const p = this.geo.attributes.position;
    const a = p.array;
    const fall = this.kind === 'rain' || this.kind === 'storm' ? 22 : this.kind === 'steam' ? -0.9 : 0;
    for (let i = 0; i < N; i++) {
      const k = i * 3;
      if (fall) a[k + 1] -= fall * dt;
      else {
        a[k] += Math.sin(t * 0.7 + i) * dt * 0.4;
        a[k + 1] += Math.cos(t * 0.5 + i * 1.7) * dt * 0.25;
      }
      if (fall > 0 && a[k + 1] < 0) a[k + 1] += 20;
      if (fall < 0 && a[k + 1] > 8) a[k + 1] -= 8;
    }
    p.needsUpdate = true;
    this.points.position.set(Math.round(center.x / 4) * 4, 0, Math.round(center.z / 4) * 4);
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
