// Player controller: third-person movement with per-room gravity that can
// point down, up, or nowhere. The camera follows over the shoulder, never
// clips through walls, and barrel-rolls around the facing direction when
// gravity flips so "forward" stays forward.
import * as THREE from '../../vendor/three.module.min.js';
import { makePlayerModel } from '../world/People.js';

const HALF = new THREE.Vector3(0.3, 0.85, 0.3);
const EYE = 0.68;
const G = 22;
// a ledge up to this high is walked onto (district kerbs are 0.16 m), and the ground is
// followed down over a drop up to this deep instead of leaving it for a few frames
const STEP = 0.35;
// stride cycles per second the player's legs may reach (5.2 steps/s, a sprint cadence; NPCs keep
// 2.2), so the 3.9 m/s walk is carried by the legs instead of sliding
const MAX_CADENCE = 2.6;
const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();
// does the box centred at p with half-size h overlap the collider c?
const overlaps = (p, h, c) => {
  for (let a = 0; a < 3; a++) if (p[a] + h[a] <= c.min[a] || p[a] - h[a] >= c.max[a]) return false;
  return true;
};

export class Player {
  constructor(camera, scene) {
    this.camera = camera;
    this.model = makePlayerModel(null);
    this.model.userData.maxCadence = MAX_CADENCE;
    if (scene) scene.add(this.model);
    this.facing = new THREE.Vector3(0, 0, -1);
    this.colliders = [];
    this.cam = { dist: 3.6, shoulder: 0.5, lift: 0.35 }; // set from the camera preset
    this.zoom = 1; // wheel / pinch multiplier
    this.distNow = 3.6;
    this.comfort = false; // instant gravity flips, steadier camera
    this.talkTarget = null; // [x, y, z] of whoever you're talking to: the camera frames you both
    this.lastTalk = null; // the last talkTarget, so the framing eases out after the conversation ends
    this.talkK = 0;
    this.cramped = false; // the camera is using the higher over-the-shoulder angle near a wall
    this.camPos = null;
    this.cinema = null; // { pos: Vector3, target: Vector3 } overrides the camera (trailers)
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.H = new THREE.Vector3(0, 0, -1); // horizontal heading
    this.U = new THREE.Vector3(0, 1, 0); // camera up (animated)
    this.pitch = 0;
    this.gravity = -1; // -1 down, +1 up, 0 none
    this.grounded = false;
    this.running = false;
    this.speed = 0;
    this.topSpeed = null; // the gait's top speed, eased between walk (3.9) and run (7.6)
    this.stepOff = 0; // how far the model lags a step up (+) or down (-) along U, eased away
    this.airT = 0; // seconds since the feet last touched the ground
    this._canStep = false; // set during update(): walking into a low ledge climbs it
    this.bob = 0;
    this.half = HALF;
    this.floatY = 1.25;
  }

  // Swap the character model (character select: settings.hero); returns the new model.
  setModel(choice) {
    const old = this.model;
    this.model = makePlayerModel(choice);
    this.model.userData.maxCadence = MAX_CADENCE;
    this.model.position.copy(old.position);
    this.model.quaternion.copy(old.quaternion);
    if (old && old.parent) {
      old.parent.add(this.model);
      old.parent.remove(old);
    }
    old?.traverse((o) => o.geometry?.dispose?.());
    return this.model;
  }

  place([x, y, z, yaw = 0]) {
    this.pos.set(x, y, z);
    this.vel.set(0, 0, 0);
    this.stepOff = 0;
    this.airT = 0;
    this.H.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    this.U.set(0, this.gravity === 1 ? -1 : 1, 0);
    this.pitch = -0.12;
    this.facing.copy(this.H);
    this.camPos = null;
    this.cramped = false;
    // a teleport or respawn starts the camera fresh, never blending from a stale conversation
    // (one still running keeps its framing: Echo Step mid-conversation lands on the framed shot)
    if (!this.talkTarget) {
      this.lastTalk = null;
      this.talkK = 0;
    }
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
    this.colliders = colliders;
    // --- camera roll toward gravity's up ---------------------------------
    if (this.gravity !== 0) {
      const target = _v.set(0, this.upTarget, 0);
      const ang = this.U.angleTo(target);
      if (ang > 1e-4) {
        const cross = new THREE.Vector3().crossVectors(this.U, target);
        const sign = cross.dot(this.H) >= 0 ? 1 : -1;
        const step = this.comfort ? ang : Math.min(ang, dt * 4.2);
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
    // one continuous speed curve: the gait sets a top speed that eases over ~0.3 s when it
    // changes, and the stick scales it, so neither a gait switch nor a trembling thumb lurches
    const top = input.run ? 7.6 : 3.9;
    this.topSpeed = this.topSpeed === null ? top : this.topSpeed + (top - this.topSpeed) * (1 - Math.exp(-dt * 5));
    const speed = this.topSpeed * mag * (input.slow ? 0.7 : 1);
    this.running = input.run && speed > 4.5; // 'running' (noise, stealth, footsteps) means actually fast
    const accel = this.gravity === 0 ? 1.5 : this.grounded ? 14 : 5;
    const k = Math.min(1, accel * dt);
    this.vel.x += (wish.x * speed - this.vel.x) * k;
    this.vel.z += (wish.z * speed - this.vel.z) * k;

    const jump = input.jump;
    if (this.gravity === 0) {
      // weightless: drift, with a gentle pull back to mid-air so nobody gets stranded
      this.vel.y += (this.floatY - this.pos.y) * 0.9 * dt;
      this.vel.y *= Math.pow(0.6, dt);
      if (jump) this.vel.y += 2.2;
    } else {
      this.vel.y += this.gravity * G * dt;
      this.vel.y = THREE.MathUtils.clamp(this.vel.y, -24, 24);
      if (jump && this.grounded) this.vel.y = -this.gravity * 7.2;
    }
    input.jump = false;

    // --- integrate with collision, in substeps ----------------------------
    // last frame's ground counts only under the same gravity: the frame it flips, the body falls
    // the new way instead of snapping to (or stepping onto) a surface within STEP of the head
    const flipped = this.gravity !== (this._lastG ?? this.gravity);
    this._lastG = this.gravity;
    const wasGrounded = this.grounded && !flipped;
    this._canStep = wasGrounded && this.gravity !== 0; // steps are climbed from the ground, never weightless
    this.grounded = false;
    const steps = Math.max(1, Math.ceil((this.vel.length() * dt) / 0.25));
    const sdt = dt / steps;
    const near = this.nearby(colliders, this.vel.length() * dt + 2);
    for (let s = 0; s < steps; s++) {
      this.moveAxis(0, this.vel.x * sdt, near);
      this.moveAxis(2, this.vel.z * sdt, near);
      this.moveAxis(1, this.vel.y * sdt, near);
    }
    this._canStep = false;
    // walking off a kerb or a low ledge follows the ground down instead of leaving it for a few
    // frames (no jump, not weightless, not moving against gravity): probe up to STEP below
    if (wasGrounded && !this.grounded && !jump && this.gravity !== 0 && this.vel.y * this.gravity >= 0) {
      const y0 = this.pos.y, vy0 = this.vel.y;
      this.moveAxis(1, this.gravity * STEP, near);
      const drop = (this.pos.y - y0) * this.gravity; // how far it moved along gravity
      if (this.grounded && drop >= 0) this.stepOff -= drop;
      else {
        this.pos.y = y0;
        this.vel.y = vy0;
        this.grounded = false;
      }
    }
    this.airT = this.grounded ? 0 : this.airT + dt;
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
      if (!overlaps(p, h, c)) continue;
      if (axis !== 1 && this._canStep) {
        // a ledge no higher than STEP above the feet (feet toward gravity) is climbed, if
        // there is headroom above it; the model eases up (stepOff) instead of popping
        const rise = this.gravity < 0 ? c.max[1] - (p[1] - h[1]) : (p[1] + h[1]) - c.min[1];
        if (rise > 0 && rise <= STEP) {
          const y = p[1];
          p[1] = y - this.gravity * (rise + 1e-4);
          if (!cols.some((o) => overlaps(p, h, o))) {
            this.pos.y = p[1];
            this.stepOff += rise;
            continue;
          }
          p[1] = y;
        }
      }
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

  // Ray vs. the world's boxes; returns the distance to the first hit (or max).
  rayDistance(origin, dir, max) {
    let best = max;
    const pad = 0.22;
    for (const c of this.colliders) {
      let t0 = 0, t1 = best;
      let hit = true;
      for (let a = 0; a < 3; a++) {
        const o = origin.getComponent(a), d = dir.getComponent(a);
        const mn = c.min[a] - pad, mx = c.max[a] + pad;
        if (Math.abs(d) < 1e-8) {
          if (o < mn || o > mx) { hit = false; break; }
        } else {
          let ta = (mn - o) / d, tb = (mx - o) / d;
          if (ta > tb) [ta, tb] = [tb, ta];
          t0 = Math.max(t0, ta);
          t1 = Math.min(t1, tb);
          if (t0 > t1) { hit = false; break; }
        }
      }
      if (hit && t0 < best) best = t0;
    }
    return best;
  }

  updateCamera(dt = 1 / 60) {
    this.updateModel(dt);
    if (this.cinema) {
      this.camera.position.copy(this.cinema.pos);
      this.camera.up.copy(this.cinema.up || this.U);
      const t = this.cinema.target;
      this.camera.lookAt(t.x, t.y, t.z);
      return;
    }
    const F = this.forward(new THREE.Vector3());
    const up = new THREE.Vector3().copy(this.U).multiplyScalar(Math.cos(this.pitch)).addScaledVector(this.H, -Math.sin(this.pitch));
    const right = new THREE.Vector3().crossVectors(F, up).normalize();
    const head = new THREE.Vector3().copy(this.pos).addScaledVector(this.U, 0.6 - this.stepOff); // eases over steps
    const wantDist = THREE.MathUtils.clamp(this.cam.dist * this.zoom, 1.4, 12);
    this.distNow += (wantDist - this.distNow) * (1 - Math.exp(-dt * 8));
    const k = this.distNow / Math.max(0.1, this.cam.dist);
    const desired = head.clone().addScaledVector(F, -this.distNow).addScaledVector(up, this.cam.lift * Math.min(2, k)).addScaledVector(right, this.cam.shoulder);
    const dir = desired.clone().sub(head);
    const len = dir.length();
    dir.divideScalar(len);
    const hit = this.rayDistance(head, dir, len);
    let dist = Math.max(0.35, hit - 0.15);
    let target = head.clone().addScaledVector(dir, dist);
    if (dist < 1.8 || this.cramped) {
      // cramped: try a higher, closer angle looking down over the shoulder
      const alt = head.clone().addScaledVector(F, -2.0).addScaledVector(up, 1.3).addScaledVector(right, 0.3).sub(head);
      const altLen = alt.length();
      alt.divideScalar(altLen);
      const altDist = Math.max(0.35, this.rayDistance(head, alt, altLen) - 0.15);
      // enter only when clearly better; leave only once the normal shot reaches as far out, so the
      // camera swoops back instead of cutting (a camera still trailing, as when walking away from
      // a wall, is pulled in along its own line by the wall guard below, not cut).
      // A zoomed-in shot with nothing behind it (shorter than the high angle even in the open)
      // leaves at the old 1.8 m line, so it never sticks to the high angle in open space.
      const open = hit >= len && dist >= 1.8;
      const useAlt = this.cramped ? dist < altDist - 0.05 && !open : dist < 1.8 && altDist > dist + 0.3;
      this.cramped = useAlt;
      if (useAlt) { dist = altDist; target = head.clone().addScaledVector(alt, altDist); }
    }
    // conversation framing: over your shoulder, looking at whoever is talking
    this.talkK += ((this.talkTarget ? 1 : 0) - this.talkK) * (1 - Math.exp(-dt * 3));
    let aim = head.clone().addScaledVector(F, 6);
    // after the conversation ends, keep framing the last speaker while talkK fades,
    // so the view eases back over about a second instead of whipping round in one frame
    if (this.talkTarget) this.lastTalk = this.talkTarget;
    const tt = this.talkTarget || this.lastTalk;
    if (this.talkK > 0.01 && tt) {
      const who = new THREE.Vector3(...tt);
      const flat = who.clone().sub(head);
      flat.y = 0;
      if (flat.lengthSq() > 0.04) {
        flat.normalize();
        const side = new THREE.Vector3().crossVectors(flat, this.U).normalize();
        const want = head.clone().addScaledVector(flat, -1.7).addScaledVector(side, 0.85).addScaledVector(this.U, 0.25);
        const d2 = want.clone().sub(head);
        const l2 = d2.length();
        d2.divideScalar(l2);
        const free = Math.max(0.4, this.rayDistance(head, d2, l2) - 0.15);
        target.lerp(head.clone().addScaledVector(d2, free), this.talkK);
        aim.lerp(who.clone().lerp(head, 0.3), this.talkK);
        dist = Math.min(dist, free);
      }
    } else if (!this.talkTarget) this.lastTalk = null;
    if (!this.camPos || this.camPos.distanceTo(target) > 6) this.camPos = target.clone();
    else this.camPos.lerp(target, 1 - Math.exp(-dt * (this.comfort ? 8 : 14)));
    // never let smoothing drag the camera behind a wall: a camera farther out than the shot allows
    // is pulled in along its own line of sight, to the shot's distance or short of whatever is in
    // the way, instead of cut to the target. (Walking away from a wall, the camera trails the
    // moving shot by more than this margin when it leaves the high angle: a cut there dropped it
    // a metre in one frame.)
    const lim = Math.max(dist, target.distanceTo(head)) + 0.05;
    const cd = this.camPos.clone().sub(head), cl = cd.length();
    if (cl > lim) {
      cd.divideScalar(cl);
      const hitC = this.rayDistance(head, cd, lim);
      this.camPos.copy(head).addScaledVector(cd, hitC < lim ? Math.max(0.35, hitC - 0.15) : lim);
    }
    // look slightly past the character's head, so the view stays centred on what's ahead
    _m.lookAt(this.camPos, aim, up);
    this.camera.quaternion.setFromRotationMatrix(_m);
    this.camera.position.copy(this.camPos);
    this.model.visible = this.camPos.distanceTo(head) > 0.9;
  }

  updateModel(dt) {
    const m = this.model;
    // face where we're moving; idle keeps the last direction
    const v = new THREE.Vector3(this.vel.x, 0, this.vel.z);
    if (v.lengthSq() > 0.09) this.facing.lerp(v.normalize(), 1 - Math.exp(-dt * 10)).normalize();
    const z = this.facing.clone().addScaledVector(this.U, -this.facing.dot(this.U)).normalize();
    const x = new THREE.Vector3().crossVectors(this.U, z).normalize();
    _m.makeBasis(x, this.U, z);
    m.quaternion.setFromRotationMatrix(_m);
    // a step up or down moved the body at once: the model follows it smoothly
    this.stepOff = THREE.MathUtils.clamp(this.stepOff * Math.exp(-dt * 12), -STEP, STEP);
    if (Math.abs(this.stepOff) < 1e-4) this.stepOff = 0;
    m.position.copy(this.pos).addScaledVector(this.U, -0.85 - this.stepOff);
    // in the air only after a moment off the ground, or when really rising or falling: a blip
    // (the edge of a ledge) keeps the stride instead of flashing the leap
    const airborne = this.gravity !== 0 && !this.grounded && (this.airT > 0.15 || Math.abs(this.vel.y) > 3);
    m.userData.animate(dt, this.speed, performance.now() / 1000, airborne);
  }

  // Is the player standing on (or near) the ceiling?
  onCeiling() {
    return this.gravity === 1;
  }
}
