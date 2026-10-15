// The Observer: patrols the hall, perceives the player with sight and
// hearing, and plans using ObserverBrain's memory of the player's habits.
import * as THREE from '../../vendor/three.module.min.js';
import { makeObserver } from '../world/models.js';
import { hall, pillars } from '../world/maps.js';
import { ObserverBrain } from '../core/ObserverBrain.js';

const CELL = 1;
const X0 = hall.bounds[0], Z0 = hall.bounds[1];
const NX = Math.round((hall.corridor[2] - X0) / CELL);
const NZ = Math.round((hall.bounds[3] - Z0) / CELL);
const RADIUS = 0.45;

function walkable(x, z) {
  const inHall = x > hall.bounds[0] + RADIUS && x < hall.bounds[2] - RADIUS && z > hall.bounds[1] + RADIUS && z < hall.bounds[3] - RADIUS;
  const inCorr = x >= hall.bounds[2] - 1 && x < hall.corridor[2] && z > hall.corridor[1] + RADIUS && z < hall.corridor[3] - RADIUS;
  if (!inHall && !inCorr) return false;
  for (const p of pillars) if (Math.abs(x - p.x) < p.s + RADIUS + 0.1 && Math.abs(z - p.z) < p.s + RADIUS + 0.1) return false;
  return true;
}

// Does the segment a->b (xz) pass through a pillar? Returns that pillar.
export function blockingPillar(ax, az, bx, bz, pad = 0) {
  for (const p of pillars) {
    const s = p.s + pad;
    // slab test
    let t0 = 0, t1 = 1;
    const dx = bx - ax, dz = bz - az;
    let ok = true;
    for (const [o, d, mn, mx] of [[ax, dx, p.x - s, p.x + s], [az, dz, p.z - s, p.z + s]]) {
      if (Math.abs(d) < 1e-9) {
        if (o < mn || o > mx) ok = false;
      } else {
        let ta = (mn - o) / d, tb = (mx - o) / d;
        if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta);
        t1 = Math.min(t1, tb);
        if (t0 > t1) ok = false;
      }
      if (!ok) break;
    }
    if (ok) return p;
  }
  return null;
}

export class Observer {
  constructor(scene) {
    this.mesh = makeObserver();
    scene.add(this.mesh);
    this.brain = new ObserverBrain({ freezeAfter: 3 });
    this.pos = new THREE.Vector3(...hall.spawn);
    this.facing = new THREE.Vector3(1, 0, 0);
    this.mode = 'patrol';
    this.path = [];
    this.timer = 0;
    this.suspicion = 0;
    this.lastSeen = null;
    this.lostTime = 0;
    this.frozen = false;
    this.walk = 0;
    this.trail = [];
    this.trailT = 0;
    this.lookTarget = null;
    this.hide = { pillar: null, t: 0, recorded: false };
    this.crossing = { start: null, lanes: {} };
    this.grid = [];
    for (let i = 0; i < NX; i++) for (let k = 0; k < NZ; k++) this.grid.push(walkable(X0 + (i + 0.5) * CELL, Z0 + (k + 0.5) * CELL));
    this.buildTrail(scene);
    this.onCatch = () => {};
    this.onSay = () => {};
    this.sightRange = 15;
  }

  buildTrail(scene) {
    const n = 80;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setDrawRange(0, 0);
    this.trailPts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0x5ff8ff, size: 0.22, transparent: true, opacity: 0.8, fog: false, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.trailPts.visible = false;
    scene.add(this.trailPts);
  }

  reset() {
    this.pos.set(...hall.spawn);
    this.mode = 'patrol';
    this.path = [];
    this.suspicion = 0;
    this.lastSeen = null;
  }

  // --- navigation -------------------------------------------------------
  cell(x, z) {
    return [Math.floor((x - X0) / CELL), Math.floor((z - Z0) / CELL)];
  }

  open(i, k) {
    return i >= 0 && k >= 0 && i < NX && k < NZ && this.grid[i * NZ + k];
  }

  nearestOpen(i, k) {
    if (this.open(i, k)) return [i, k];
    for (let r = 1; r < 6; r++)
      for (let di = -r; di <= r; di++)
        for (let dk = -r; dk <= r; dk++) if (this.open(i + di, k + dk)) return [i + di, k + dk];
    return null;
  }

  findPath(tx, tz) {
    const s = this.nearestOpen(...this.cell(this.pos.x, this.pos.z));
    const g = this.nearestOpen(...this.cell(tx, tz));
    if (!s || !g) return [];
    const key = (i, k) => i * NZ + k;
    const open = [[s[0], s[1]]];
    const came = new Map([[key(...s), null]]);
    const cost = new Map([[key(...s), 0]]);
    const h = (i, k) => Math.hypot(i - g[0], k - g[1]);
    const f = new Map([[key(...s), h(...s)]]);
    let found = false, guard = 0;
    while (open.length && guard++ < 4000) {
      let bi = 0;
      for (let j = 1; j < open.length; j++) if (f.get(key(...open[j])) < f.get(key(...open[bi]))) bi = j;
      const [ci, ck] = open.splice(bi, 1)[0];
      if (ci === g[0] && ck === g[1]) {
        found = true;
        break;
      }
      for (let di = -1; di <= 1; di++)
        for (let dk = -1; dk <= 1; dk++) {
          if (!di && !dk) continue;
          const ni = ci + di, nk = ck + dk;
          if (!this.open(ni, nk)) continue;
          if (di && dk && (!this.open(ci + di, ck) || !this.open(ci, ck + dk))) continue;
          const nc = cost.get(key(ci, ck)) + (di && dk ? 1.414 : 1);
          const kk = key(ni, nk);
          if (!cost.has(kk) || nc < cost.get(kk)) {
            cost.set(kk, nc);
            f.set(kk, nc + h(ni, nk));
            came.set(kk, [ci, ck]);
            if (!open.some(([a, b]) => a === ni && b === nk)) open.push([ni, nk]);
          }
        }
    }
    if (!found) return [];
    const pts = [];
    let c = g;
    while (c) {
      pts.unshift(new THREE.Vector3(X0 + (c[0] + 0.5) * CELL, 0, Z0 + (c[1] + 0.5) * CELL));
      c = came.get(key(...c));
    }
    // string-pull: drop waypoints we can see past
    const out = [];
    let from = this.pos.clone();
    for (let j = 0; j < pts.length; j++) {
      const next = pts[j + 1];
      if (next && !blockingPillar(from.x, from.z, next.x, next.z, RADIUS + 0.05)) continue;
      out.push(pts[j]);
      from = pts[j];
    }
    return out;
  }

  goTo(x, z) {
    this.path = this.findPath(x, z);
  }

  randomPoint() {
    for (let n = 0; n < 50; n++) {
      const x = THREE.MathUtils.randFloat(hall.bounds[0] + 2, hall.bounds[2] - 3);
      const z = THREE.MathUtils.randFloat(hall.bounds[1] + 1.5, hall.bounds[3] - 1.5);
      if (walkable(x, z) && Math.abs(x - this.pos.x) > 6) return [x, z];
    }
    return [hall.spawn[0], hall.spawn[2]];
  }

  // --- decisions ----------------------------------------------------------
  plan(now) {
    const p = this.brain.decide(now);
    if (p.type === 'inspect') {
      const pil = pillars.find((q) => q.id === p.spot);
      this.mode = 'inspect';
      this.inspectPillar = pil;
      // approach from the far side of where it stands now
      const sx = Math.sign(pil.x - this.pos.x) || 1;
      this.goTo(pil.x + sx * (pil.s + 1.2), pil.z);
      this.onSay('It walks straight to the pillar you keep hiding behind.');
    } else if (p.type === 'intercept') {
      const [z0, z1] = hall.lanes[p.lane];
      this.mode = 'intercept';
      this.goTo(THREE.MathUtils.randFloat(-38, -26), (z0 + z1) / 2);
    } else {
      this.mode = 'patrol';
      this.goTo(...this.randomPoint());
    }
  }

  // --- per-frame ----------------------------------------------------------
  update(dt, now, g) {
    const { player, inHall, roomState, frozenByLaw, tethered, playerHidden } = g;
    const U = this.mesh.userData;

    if (tethered) return this.updateTethered(dt, now);

    // Laws: the Observer can be frozen - until it learns.
    const wantFreeze = frozenByLaw && !this.brain.ignoresFreeze();
    if (wantFreeze && !this.frozen) {
      this.brain.recordFreeze();
      if (this.brain.ignoresFreeze()) this.frozen = false;
      else this.frozen = true;
    } else if (!wantFreeze) this.frozen = false;

    if (inHall) {
      this.brain.recordStateTime(roomState, dt);
      this.brain.recordPace(player.running, dt);
    }

    // Perception
    const pp = player.pos;
    const dx = pp.x - this.pos.x, dz = pp.z - this.pos.z;
    const dist = Math.hypot(dx, dz);
    let sees = false, hears = false;
    if (inHall && !this.frozen) {
      const ceilingHidden = playerHidden && !this.brain.seesCeiling();
      const dot = (dx * this.facing.x + dz * this.facing.z) / (dist || 1);
      const inCone = dist < this.sightRange && (dot > Math.cos(0.9) || dist < 1.6);
      const blocker = blockingPillar(this.pos.x, this.pos.z, pp.x, pp.z);
      sees = inCone && !blocker && !ceilingHidden;
      hears = !ceilingHidden && dist < this.brain.hearingRadius(player.running) && player.speed > 0.5;
      this.trackHiding(dt, player, dist, blocker);
      this.trackCrossing(player);
    }

    if (sees) {
      const rate = dist < 6 ? 2.6 : 1.1;
      this.suspicion = Math.min(1.2, this.suspicion + dt * rate * (player.running ? 1.5 : 1));
      this.lastSeen = pp.clone();
      this.lostTime = 0;
    } else {
      this.suspicion = Math.max(0, this.suspicion - dt * 0.25);
      this.hearCd = (this.hearCd || 0) - dt;
      if (hears && this.mode !== 'chase' && this.hearCd <= 0) {
        this.hearCd = 0.6;
        this.lastSeen = pp.clone();
        if (this.mode !== 'search') this.onSay('It turns toward the sound.');
        this.mode = 'search';
        this.timer = this.brain.searchDuration();
        this.goTo(pp.x, pp.z);
      }
    }

    if (this.frozen) {
      this.animate(dt, 0, now);
      U.eyeMat.color.setHex(0x6aa0ff);
      return;
    }

    if (sees && this.suspicion >= 1 && this.mode !== 'chase') {
      this.mode = 'chase';
      this.repath = 0;
      this.onSay('It sees you.');
    }

    let speed = 2.1;
    switch (this.mode) {
      case 'chase': {
        speed = 5.0;
        this.repath -= dt;
        if (sees) this.lostTime = 0;
        else this.lostTime += dt;
        if (this.repath <= 0 && this.lastSeen) {
          this.goTo(this.lastSeen.x, this.lastSeen.z);
          this.repath = 0.35;
        }
        if (this.lostTime > 2.5) {
          this.mode = 'search';
          this.timer = this.brain.searchDuration();
        }
        break;
      }
      case 'search':
        speed = 2.8;
        if (!this.path.length) {
          this.timer -= dt;
          this.facing.applyAxisAngle(new THREE.Vector3(0, 1, 0), dt * 1.4);
          if (this.timer <= 0) this.plan(now);
        }
        break;
      case 'pause':
        speed = 0;
        this.timer -= dt;
        if (this.lookTarget) this.faceToward(this.lookTarget.x, this.lookTarget.z, dt);
        if (this.timer <= 0) this.plan(now);
        break;
      case 'inspect':
        speed = 2.6;
        if (!this.path.length) {
          this.faceToward(this.inspectPillar.x, this.inspectPillar.z, dt);
          this.facing.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(now * 2) * dt);
          this.timer = (this.timer || 3) - dt;
          if (this.timer <= 0) {
            this.timer = 0;
            this.plan(now);
          }
        }
        break;
      case 'intercept':
        speed = 2.4;
        if (!this.path.length) {
          this.mode = 'pause';
          this.timer = 3.5;
          this.lookTarget = new THREE.Vector3(this.pos.x + 10, 0, this.pos.z);
        }
        break;
      default:
        if (!this.path.length) this.plan(now);
    }

    // follow path
    let moved = 0;
    if (this.path.length && speed > 0) {
      const wp = this.path[0];
      const vx = wp.x - this.pos.x, vz = wp.z - this.pos.z;
      const d = Math.hypot(vx, vz);
      if (d < 0.25) this.path.shift();
      else {
        const step = Math.min(d, speed * dt);
        this.pos.x += (vx / d) * step;
        this.pos.z += (vz / d) * step;
        moved = step / dt;
        this.faceToward(wp.x, wp.z, dt, 6);
      }
    }
    if (this.mode === 'chase' && sees) this.faceToward(pp.x, pp.z, dt, 8);

    // catch
    const reach = player.onCeiling() ? (this.brain.seesCeiling() ? 1.3 : -1) : 1.15;
    if (inHall && dist < reach && (this.mode === 'chase' || sees || dist < 0.9)) {
      this.onCatch(roomState);
      return;
    }

    this.trailT -= dt;
    if (this.trailT <= 0) {
      this.trailT = 0.35;
      this.trail.push([this.pos.x, 0.08, this.pos.z]);
      if (this.trail.length > 80) this.trail.shift();
      const a = this.trailPts.geometry.attributes.position;
      this.trail.forEach((p, i) => a.setXYZ(i, ...p));
      a.needsUpdate = true;
      this.trailPts.geometry.setDrawRange(0, this.trail.length);
    }
    this.trailPts.visible = roomState === 'ECHO';

    const col = this.mode === 'chase' ? 0xff3020 : this.suspicion > 0.35 ? 0xffc040 : 0xffffff;
    U.eyeMat.color.setHex(col);
    U.coneMat.opacity = this.mode === 'chase' ? 0.09 : 0.045;
    this.animate(dt, moved, now);
  }

  faceToward(x, z, dt, rate = 4) {
    const t = new THREE.Vector3(x - this.pos.x, 0, z - this.pos.z);
    if (t.lengthSq() < 1e-4) return;
    t.normalize();
    this.facing.lerp(t, Math.min(1, dt * rate)).normalize();
  }

  // Memory: hiding behind the same pillar while it is nearby.
  trackHiding(dt, player, dist, blocker) {
    const h = this.hide;
    let near = null;
    for (const p of pillars) if (Math.hypot(player.pos.x - p.x, player.pos.z - p.z) < p.s + 1.3) near = p;
    if (!near || (h.pillar && near.id !== h.pillar)) {
      h.pillar = near ? near.id : null;
      h.t = 0;
      h.recorded = false;
      return;
    }
    h.pillar = near.id;
    if (!h.recorded && dist < 14 && blocker && blocker.id === near.id && player.speed < 1.5) {
      h.t += dt;
      if (h.t > 1.0) {
        h.recorded = true;
        const n = this.brain.recordHide(near.id);
        const r = this.brain.hideReaction(near.id);
        if (r === 'pause' && this.mode !== 'chase') {
          this.mode = 'pause';
          this.timer = 2.2;
          this.path = [];
          this.lookTarget = new THREE.Vector3(near.x, 0, near.z);
          this.onSay('It pauses by the pillar.');
        } else if (r === 'inspect' && this.mode !== 'chase') {
          this.mode = 'pause';
          this.timer = 0.6;
          this.lookTarget = new THREE.Vector3(near.x, 0, near.z);
          this.onSay('It looks directly at your pillar.');
          this.brain.mem.inspected[near.id] = -Infinity;
        }
        return n;
      }
    }
  }

  // Memory: which aisle the player uses to cross the hall.
  trackCrossing(player) {
    const c = this.crossing;
    const x = player.pos.x, z = player.pos.z;
    const lane = Object.entries(hall.lanes).find(([, [a, b]]) => z >= a && z < b)?.[0];
    if (x > hall.entranceX) {
      if (c.start === 'far') this.finishCrossing();
      c.start = 'near';
      c.lanes = {};
    } else if (x < hall.farX) {
      if (c.start === 'near') this.finishCrossing();
      c.start = 'far';
      c.lanes = {};
    } else if (lane) c.lanes[lane] = (c.lanes[lane] || 0) + 1;
  }

  finishCrossing() {
    const e = Object.entries(this.crossing.lanes).sort((a, b) => b[1] - a[1])[0];
    if (e) this.brain.recordCrossing(e[0]);
  }

  updateTethered(dt, now) {
    const [tx, , tz] = hall.tether;
    if (this.mode !== 'tethered') {
      this.mode = 'tethered';
      this.goTo(tx, tz);
    }
    if (this.path.length) {
      const wp = this.path[0];
      const vx = wp.x - this.pos.x, vz = wp.z - this.pos.z;
      const d = Math.hypot(vx, vz);
      if (d < 0.25) this.path.shift();
      else {
        const step = Math.min(d, 2.0 * dt);
        this.pos.x += (vx / d) * step;
        this.pos.z += (vz / d) * step;
        this.faceToward(wp.x, wp.z, dt);
      }
      this.animate(dt, 2, now);
    } else {
      this.faceToward(this.pos.x + 5, this.pos.z, dt);
      this.animate(dt, 0, now);
    }
    const pulse = 0.5 + Math.max(0, Math.sin(now * 2.4)) * 0.5;
    this.mesh.userData.eyeMat.color.setRGB(1, 0.4 + pulse * 0.4, 0.6 + pulse * 0.3);
    this.mesh.userData.coneMat.opacity = 0;
    this.trailPts.visible = false;
  }

  animate(dt, moving, now) {
    const U = this.mesh.userData;
    this.walk += dt * moving * 2.2;
    const sw = moving > 0.1 ? Math.sin(this.walk) * 0.45 : 0;
    U.legs[0].rotation.x = sw;
    U.legs[1].rotation.x = -sw;
    U.arms[0].rotation.x = -sw * 0.6;
    U.arms[1].rotation.x = sw * 0.6;
    U.head.rotation.z = this.mode === 'pause' || this.mode === 'inspect' ? Math.sin(now * 1.3) * 0.25 : 0;
    U.head.rotation.x = this.brain.seesCeiling() && this.mode !== 'tethered' ? 0.35 + Math.sin(now * 0.8) * 0.15 : 0;
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = Math.atan2(-this.facing.x, -this.facing.z);
  }

  serialize() {
    return this.brain.serialize();
  }
}
