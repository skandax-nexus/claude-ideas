// Small visual feedback for interactions: sparkle bursts (pickups, tokens,
// saves, doors), a soft ring that marks what you can use, and floating
// hologram screens that show a log while it plays.
import * as THREE from '../../vendor/three.module.min.js';

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.7)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function wrap(g, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (g.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

export class Fx {
  constructor(scene) {
    this.scene = scene;
    this.tex = dotTexture();
    this.bursts = [];
    this.holos = [];
    // Burst and hologram materials are reused, never disposed: disposing the last one deletes
    // its shader program, and the next pickup or log would link it again on the tap.
    this.pool = [];
    this.holoPool = [];
    // one invisible point drawn on the first frames links the burst program before play
    const warm = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3)), this.burstMaterial());
    warm.material.opacity = 0;
    warm.frustumCulled = false;
    warm.onAfterRender = () => { warm.userData.drawn = true; };
    this.warm = warm;
    scene.add(warm);
    // focus marker: a soft pulsing ring + glow under whatever you can use
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false, fog: false });
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 8, 48), ringMat);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex, color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false, fog: false }));
    this.glow.scale.setScalar(1.3);
    this.marker = new THREE.Group();
    this.marker.add(this.ring, this.glow);
    this.marker.visible = false;
    this.marker.renderOrder = 5;
    scene.add(this.marker);
  }

  focus(pos, color = 0xffffff, t = 0, camera = null) {
    if (!pos) {
      this.marker.visible = false;
      return;
    }
    this.marker.visible = true;
    this.marker.position.set(pos[0], pos[1], pos[2]);
    if (camera) this.marker.quaternion.copy(camera.quaternion);
    const k = 1 + Math.sin(t * 4) * 0.08;
    this.ring.scale.setScalar(k);
    this.ring.material.color.setHex(color);
    this.glow.material.color.setHex(color);
    this.glow.material.opacity = 0.25 + Math.sin(t * 4) * 0.08;
  }

  burstMaterial() {
    return this.pool.pop() || new THREE.PointsMaterial({ map: this.tex, size: 0.16, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
  }

  burst(pos, color = 0xffffff, n = 26, speed = 2.2) {
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3);
    const v = [];
    for (let i = 0; i < n; i++) {
      p.set(pos, i * 3);
      const a = Math.random() * Math.PI * 2, e = Math.random() * 1.2 - 0.2;
      const s = speed * (0.5 + Math.random() * 0.7);
      v.push([Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s + 0.8, Math.sin(a) * Math.cos(e) * s]);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const mat = this.burstMaterial();
    mat.color.set(color);
    mat.opacity = 1;
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    this.scene.add(pts);
    this.bursts.push({ pts, v, t: 0, life: 0.9 });
  }

  // A floating screen above a terminal with the log's text on it.
  holo(pos, yaw, title, text, color = '#2f7f9e', secs = 8) {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 360;
    const g = c.getContext('2d');
    // see-through glass: a faint tint, a thin glowing frame, light text with a dark halo
    g.fillStyle = 'rgba(20,40,56,0.18)';
    g.beginPath();
    g.roundRect ? g.roundRect(8, 8, 624, 344, 26) : g.rect(8, 8, 624, 344);
    g.fill();
    g.strokeStyle = 'rgba(160,230,255,0.7)';
    g.lineWidth = 3;
    g.stroke();
    g.shadowColor = 'rgba(8,16,26,0.95)';
    g.shadowBlur = 8;
    g.fillStyle = '#9fe6ff';
    g.font = '700 26px Inter, "Segoe UI", sans-serif';
    g.fillText(title, 36, 58);
    g.fillStyle = '#ffffff';
    g.font = '500 25px Inter, "Segoe UI", sans-serif';
    wrap(g, text, 568).slice(0, 8).forEach((l, i) => g.fillText(l, 36, 108 + i * 32));
    void color;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    // a flat screen: one pass draws both faces (no back-then-front program switch per frame)
    const mat = this.holoPool.pop() || new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, forceSinglePass: true });
    mat.map = tex; // swapping one map for another keeps the same program
    mat.opacity = 0;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.35), mat);
    mesh.position.set(pos[0], pos[1] + 1.25, pos[2]);
    mesh.rotation.y = yaw;
    this.scene.add(mesh);
    this.holos.forEach((h) => (h.t = Math.max(h.t, h.life - 0.4))); // one at a time
    this.holos.push({ mesh, t: 0, life: secs, base: mesh.position.y });
  }

  update(dt) {
    if (this.warm?.userData.drawn) {
      this.scene.remove(this.warm);
      this.warm.geometry.dispose();
      this.pool.push(this.warm.material);
      this.warm = null;
    }
    for (const b of this.bursts) {
      b.t += dt;
      const a = b.pts.geometry.attributes.position;
      for (let i = 0; i < b.v.length; i++) {
        b.v[i][1] -= dt * 2.2;
        a.setXYZ(i, a.getX(i) + b.v[i][0] * dt, a.getY(i) + b.v[i][1] * dt, a.getZ(i) + b.v[i][2] * dt);
      }
      a.needsUpdate = true;
      b.pts.material.opacity = Math.max(0, 1 - b.t / b.life);
    }
    for (const b of this.bursts.filter((x) => x.t >= x.life)) {
      this.scene.remove(b.pts);
      b.pts.geometry.dispose();
      this.pool.push(b.pts.material);
    }
    this.bursts = this.bursts.filter((x) => x.t < x.life);
    for (const h of this.holos) {
      h.t += dt;
      const fade = Math.min(1, h.t / 0.35, (h.life - h.t) / 0.4);
      h.mesh.material.opacity = Math.max(0, fade) * 0.95;
      h.mesh.position.y = h.base + Math.sin(h.t * 1.6) * 0.03;
      h.mesh.scale.y = Math.min(1, h.t / 0.25);
    }
    for (const h of this.holos.filter((x) => x.t >= x.life)) {
      this.scene.remove(h.mesh);
      const m = h.mesh.material;
      m.map.dispose();
      m.map = null; // let the canvas go; the next log sets its own
      h.mesh.geometry.dispose();
      this.holoPool.push(m);
    }
    this.holos = this.holos.filter((x) => x.t < x.life);
  }
}
