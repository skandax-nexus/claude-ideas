// Player controller: first-person movement with per-room gravity that can
// point down, up, or nowhere. When gravity flips, the camera barrel-rolls
// around the facing direction so "forward" stays forward.
import * as THREE from '../../vendor/three.module.min.js';

const HALF = new THREE.Vector3(0.3, 0.85, 0.3);
const EYE = 0.68;
const G = 22;
const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();

export class Player {
  constructor(camera) {
    this.camera = camera;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.H = new THREE.Vector3(0, 0, -1); // horizontal heading
    this.U = new THREE.Vector3(0, 1, 0); // camera up (animated)
    this.pitch = 0;
    this.gravity = -1; // -1 down, +1 up, 0 none
    this.grounded = false;
    this.running = false;
    this.speed = 0;
    this.bob = 0;
    this.half = HALF;
    this.floatY = 1.25;
  }

  place([x, y, z, yaw = 0]) {
    this.pos.set(x, y, z);
    this.vel.set(0, 0, 0);
    this.H.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    this.U.set(0, this.gravity === 1 ? -1 : 1, 0);
    this.pitch = 0;
  }

  get upTarget() {
    return this.gravity === 1 ? -1 : 1;
  }

  setGravity(g) {
    this.gravity = g;
  }

  look(dx, dy) {
    // yaw around the current camera up, then keep heading horizontal
    _v.copy(this.U);
    this.H.applyAxisAngle(_v, -dx);
    this.H.y = 0;
    if (this.H.lengthSq() < 1e-6) this.H.set(0, 0, -1);
    this.H.normalize();
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy, -1.45, 1.45);
  }

  right(out) {
    return out.crossVectors(this.H, this.U).setY(0).normalize();
  }

  update(dt, input, colliders) {
    // --- camera roll toward gravity's up ---------------------------------
    if (this.gravity !== 0) {
      const target = _v.set(0, this.upTarget, 0);
      const ang = this.U.angleTo(target);
      if (ang > 1e-4) {
        const cross = new THREE.Vector3().crossVectors(this.U, target);
        const sign = cross.dot(this.H) >= 0 ? 1 : -1;
        const step = Math.min(ang, dt * 4.2);
        this.U.applyAxisAngle(this.H, sign * step).normalize();
        if (ang - step < 1e-3) this.U.copy(target);
      }
    }
    // keep U orthogonal to H
    this.U.addScaledVector(this.H, -this.U.dot(this.H)).normalize();

    // --- desired motion ---------------------------------------------------
    const r = this.right(new THREE.Vector3());
    const wish = new THREE.Vector3().addScaledVector(this.H, input.forward).addScaledVector(r, input.strafe);
    wish.y = 0;
    const mag = Math.min(1, wish.length());
    if (mag > 0) wish.normalize();
    this.running = input.run && mag > 0.5;
    const speed = (this.running ? 6.4 : 4.0) * mag * (input.slow ? 0.7 : 1);
    const accel = this.gravity === 0 ? 1.5 : this.grounded ? 14 : 5;
    const k = Math.min(1, accel * dt);
    this.vel.x += (wish.x * speed - this.vel.x) * k;
    this.vel.z += (wish.z * speed - this.vel.z) * k;

    if (this.gravity === 0) {
      // weightless: drift, with a gentle pull back to mid-air so nobody gets stranded
      this.vel.y += (this.floatY - this.pos.y) * 0.9 * dt;
      this.vel.y *= Math.pow(0.6, dt);
      if (input.jump) this.vel.y += 2.2;
    } else {
      this.vel.y += this.gravity * G * dt;
      this.vel.y = THREE.MathUtils.clamp(this.vel.y, -24, 24);
      if (input.jump && this.grounded) this.vel.y = -this.gravity * 7.2;
    }
    input.jump = false;

    // --- integrate with collision, in substeps ----------------------------
    this.grounded = false;
    const steps = Math.max(1, Math.ceil((this.vel.length() * dt) / 0.25));
    const sdt = dt / steps;
    const near = this.nearby(colliders, this.vel.length() * dt + 2);
    for (let s = 0; s < steps; s++) {
      this.moveAxis(0, this.vel.x * sdt, near);
      this.moveAxis(2, this.vel.z * sdt, near);
      this.moveAxis(1, this.vel.y * sdt, near);
    }
    this.speed = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded) this.bob += this.speed * dt * 1.8;
  }

  nearby(colliders, r) {
    const p = this.pos;
    const out = [];
    for (const c of colliders) {
      if (c.max[0] < p.x - r || c.min[0] > p.x + r) continue;
      if (c.max[1] < p.y - r || c.min[1] > p.y + r) continue;
      if (c.max[2] < p.z - r || c.min[2] > p.z + r) continue;
      out.push(c);
    }
    return out;
  }

  moveAxis(axis, d, cols) {
    if (d === 0) return;
    const key = ['x', 'y', 'z'][axis];
    this.pos[key] += d;
    const h = [HALF.x, HALF.y, HALF.z];
    const p = [this.pos.x, this.pos.y, this.pos.z];
    for (const c of cols) {
      let overlap = true;
      for (let a = 0; a < 3; a++) {
        if (p[a] + h[a] <= c.min[a] || p[a] - h[a] >= c.max[a]) {
          overlap = false;
          break;
        }
      }
      if (!overlap) continue;
      if (d > 0) p[axis] = c.min[axis] - h[axis] - 1e-4;
      else p[axis] = c.max[axis] + h[axis] + 1e-4;
      this.pos[key] = p[axis];
      if (axis === 1 && Math.sign(d) === Math.sign(this.gravity)) this.grounded = true;
      this.vel[key] = 0;
    }
  }

  eye(out = new THREE.Vector3()) {
    const bob = this.grounded ? Math.sin(this.bob * 2) * 0.035 * Math.min(1, this.speed / 4) : 0;
    return out.copy(this.pos).addScaledVector(this.U, EYE + bob);
  }

  forward(out = new THREE.Vector3()) {
    return out.copy(this.H).multiplyScalar(Math.cos(this.pitch)).addScaledVector(this.U, Math.sin(this.pitch));
  }

  updateCamera() {
    const F = this.forward(new THREE.Vector3());
    const up = new THREE.Vector3().copy(this.U).multiplyScalar(Math.cos(this.pitch)).addScaledVector(this.H, -Math.sin(this.pitch));
    const right = new THREE.Vector3().crossVectors(F, up).normalize();
    _m.makeBasis(right, up, F.negate());
    this.camera.quaternion.setFromRotationMatrix(_m);
    this.eye(this.camera.position);
  }

  // Is the player standing on (or near) the ceiling?
  onCeiling() {
    return this.gravity === 1;
  }
}
