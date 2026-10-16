// Runtime for a generated sector of the vessel (see gen/LevelGen.js): turns
// level data into meshes and colliders, evaluates conditional geometry against
// the sector's flags and the rooms' reality states, and runs the moving parts
// (time sweepers, sentinels, crew).
import * as THREE from '../../vendor/three.module.min.js';
import { deckMaterials, boxGeometry, mergeGeometries, textTexture } from './materials.js';
import * as M from './models.js';
import { makeHuman, randomCrewSpec } from './humans.js';
import { TOKENS } from '../core/Laws.js';
import { compileCondition } from '../core/conditions.js';
import { mulberry32 } from '../gen/rng.js';

const _v = new THREE.Vector3();

export class DeckWorld {
  constructor(scene, engine, facts) {
    this.scene = scene;
    this.engine = engine;
    this.facts = facts;
    this.root = null;
    this.level = null;
    this.flags = {};
    this.colliders = [];
  }

  ctx(room) {
    return { fact: (k) => (k in this.flags ? this.flags[k] : this.facts.get(k)), state: this.engine.state(room) };
  }

  setFlag(k, v = true) {
    this.flags[k] = v;
    this.refresh();
  }

  build(level, story, flags = {}) {
    this.dispose();
    this.level = level;
    this.story = story;
    this.flags = { ...flags };
    this.mats = deckMaterials(level.palette);
    const root = (this.root = new THREE.Group());
    this.scene.add(root);
    this.staticColliders = [];
    this.dynamic = [];
    this.textMeshes = [];
    this.props = {};
    this.itemMeshes = {};
    this.tokenMeshes = [];
    this.hazards = [];
    this.sentinels = [];
    this.npcs = [];

    // static geometry merged per material, conditional pieces kept separate
    const groups = new Map();
    for (const el of level.elements) {
      const [x0, y0, z0, x1, y1, z1] = el.box;
      const geo = boxGeometry(x1 - x0, y1 - y0, z1 - z0);
      geo.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      const box = { min: [x0, y0, z0], max: [x1, y1, z1], id: el.id, room: el.room };
      if (!el.when && !el.echo && !el.light) {
        if (!groups.has(el.mat)) groups.set(el.mat, []);
        groups.get(el.mat).push(geo);
        if (el.solid) this.staticColliders.push(box);
      } else {
        const kind = el.echo ? 'echo' : el.light ? 'light' : null;
        const mesh = new THREE.Mesh(geo, kind ? this.mats[kind] : this.mats[el.mat] || this.mats.wall);
        mesh.castShadow = !kind;
        mesh.receiveShadow = !kind;
        if (kind) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), kind === 'echo' ? this.mats.echoLine : this.mats.lightLine));
        root.add(mesh);
        this.dynamic.push({ el, kind, mesh, box, cond: compileCondition(el.when) });
      }
    }
    for (const [mat, geos] of groups) {
      const material = this.mats[mat] || this.mats.wall;
      const mesh = new THREE.Mesh(mergeGeometries(geos), material);
      if (material.transparent) mesh.renderOrder = 2;
      mesh.castShadow = !(mat === 'ceil' || mat === 'glass' || mat === 'glow' || mat === 'gate' || mat === 'leaf');
      mesh.receiveShadow = true;
      root.add(mesh);
      geos.forEach((g) => g.dispose());
    }

    for (const t of level.texts) {
      const { tex, aspect } = textTexture(t.text, { color: t.color, font: 'bold 60px Inter, "Segoe UI", sans-serif' });
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(t.size * aspect, t.size), mat);
      mesh.position.set(...t.pos);
      mesh.rotation.y = t.rotY || 0;
      root.add(mesh);
      this.textMeshes.push({ t, mesh, cond: compileCondition(t.when) });
    }

    for (const it of level.interactables) this.buildInteractable(it);

    for (const it of level.items) {
      const mesh = it.kind === 'key' ? M.makeKeyItem(true) : M.makeCoreItem();
      mesh.position.set(...it.pos);
      root.add(mesh);
      this.itemMeshes[it.id] = { it, mesh };
    }
    for (const tk of level.tokens) {
      const mesh = M.makeToken(TOKENS[tk.token].label);
      mesh.position.set(...tk.pos);
      root.add(mesh);
      this.tokenMeshes.push({ tk, mesh });
    }

    for (const hz of level.hazards) {
      const g = new THREE.Group();
      g.position.set(...hz.pivot);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xff8f7a, transparent: true, opacity: 0.85, fog: false });
      const beam = new THREE.Mesh(new THREE.BoxGeometry(hz.radius * 2, 0.16, 0.16), beamMat);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xffc2b4, transparent: true, opacity: 0.25, depthWrite: false, fog: false });
      const halo = new THREE.Mesh(new THREE.BoxGeometry(hz.radius * 2, 0.42, 0.42), glowMat);
      g.add(beam, halo);
      root.add(g);
      this.hazards.push({ hz, g, beamMat, angle: hz.phase });
    }

    for (const sd of level.sentinels) {
      const model = M.makeObserver();
      model.scale.setScalar(0.82);
      root.add(model);
      this.sentinels.push(new Sentinel(sd, model));
    }

    for (const n of level.npcs) {
      const crew = story.cast.find((c) => c.id === n.crew) || story.captain;
      const spec = { ...randomCrewSpec(mulberry32(crew.seed)), hologram: !!n.hologram, glow: n.hologram ? crewGlow(crew.color) : undefined };
      const model = makeHuman(spec);
      model.position.set(...n.pos);
      model.rotation.y = n.yaw || 0;
      root.add(model);
      this.npcs.push({ n, crew, model, talkT: 0 });
    }

    this.ready = false;
    this.refresh();
    this.ready = true;
  }

  buildInteractable(it) {
    const root = this.root;
    let obj;
    if (it.kind === 'terminal') {
      obj = M.makeTerminal();
      obj.position.set(it.pos[0], it.pos[1] - 0.3, it.pos[2]);
      obj.rotation.y = (it.yaw || 0);
    } else if (it.kind === 'lock' || it.kind === 'socket') {
      obj = new THREE.Group();
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.12), this.mats.prop);
      const light = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), new THREE.MeshBasicMaterial({ color: 0xffb36b }));
      light.position.z = 0.07;
      obj.add(plate, light);
      if (it.kind === 'socket') {
        const core = M.makeCoreItem();
        core.scale.setScalar(0.6);
        core.position.set(0, 0.62, 0.15);
        core.visible = false;
        obj.add(core);
        obj.userData.core = core;
      }
      obj.userData.light = light;
      obj.position.set(...it.pos);
      obj.rotation.y = (it.yaw || 0);
    } else if (it.kind === 'beacon') {
      obj = new THREE.Group();
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), new THREE.MeshBasicMaterial({ color: this.mats.glow.color }));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.02, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      ring.rotation.x = Math.PI / 2;
      obj.add(gem, ring);
      obj.userData.gem = gem;
      obj.position.set(...it.pos);
    } else if (it.kind === 'chair') {
      obj = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.9), this.mats.door);
      seat.position.y = 0.0;
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.3, 0.12), this.mats.door);
      back.position.set(0, 0.6, -0.42);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.03, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffd36a }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.95;
      obj.add(seat, back, ring);
      obj.position.set(it.pos[0], it.pos[1] - 0.35, it.pos[2]);
      obj.userData.ring = ring;
    } else return;
    obj.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    root.add(obj);
    this.props[it.id] = obj;
  }

  dispose() {
    if (!this.root) return;
    this.scene.remove(this.root);
    this.root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material.map && !Object.values(this.mats || {}).includes(o.material)) o.material.map.dispose?.();
    });
    this.root = null;
    this.level = null;
  }

  echoVisible(state) {
    return state === 'ECHO' || this.engine.has('echoVisible', state);
  }

  refresh() {
    if (!this.level) return;
    const cols = this.staticColliders.slice();
    for (const d of this.dynamic) {
      const c = this.ctx(d.el.room);
      const present = !!d.cond(c);
      if (d.kind === 'echo') {
        const solid = present && this.engine.has('echoSolid', c.state) && d.el.solid !== false;
        d.mesh.visible = present && (solid || this.echoVisible(c.state));
        d.mesh.material = solid ? this.mats.echoSolid : this.mats.echo;
        if (solid) cols.push(d.box);
      } else if (d.kind === 'light') {
        // hard light is always outlined; a law decides whether it carries weight
        const solid = present && this.engine.has('lightSolid', c.state);
        d.mesh.visible = present;
        d.mesh.material = solid ? this.mats.lightSolid : this.mats.light;
        if (solid) cols.push(d.box);
      } else {
        const isDoor = d.el.id && d.el.id.startsWith('door_');
        if (isDoor && !present) {
          // doors glide up into the frame instead of vanishing
          if (d.openT === undefined) {
            if (this.ready) d.openT = 0;
            else d.mesh.visible = false;
          }
        } else d.mesh.visible = present;
        if (present && d.el.solid !== false) cols.push(d.box);
      }
    }
    this.colliders = cols;
    for (const tm of this.textMeshes) {
      const c = this.ctx(tm.t.room);
      tm.mesh.visible = !!tm.cond(c) && (!tm.t.echo || this.echoVisible(c.state));
    }
    for (const it of this.level.interactables) {
      const p = this.props[it.id];
      if (!p) continue;
      const open = this.flags[`open_${it.room}`];
      if (p.userData.light) p.userData.light.material.color.setHex(open ? 0x5fd39a : 0xffb36b);
      if (p.userData.core) p.userData.core.visible = !!open;
    }
  }

  isItemAvailable(id) {
    const im = this.itemMeshes[id];
    if (!im || this.flags[`used_${id}`]) return false;
    return !im.it.echo || this.echoVisible(this.engine.state(im.it.room));
  }

  roomAt(p, fallback) {
    for (const id of this.level.order) {
      for (const b of this.level.rooms[id].bounds) {
        if (p.x >= b[0] && p.x < b[3] && p.y >= b[1] && p.y < b[4] && p.z >= b[2] && p.z < b[5]) return id;
      }
    }
    return fallback;
  }

  // Returns 'hit' if a time sweeper touched the player this frame, 'caught' if a sentinel did.
  update(dt, t, g) {
    if (!this.level) return null;
    const { player } = g;
    let event = null;
    for (const d of this.dynamic) {
      if (d.openT === undefined || d.openT >= 1) continue;
      d.openT = Math.min(1, d.openT + dt * 1.1);
      const k = d.openT * d.openT * (3 - 2 * d.openT);
      d.mesh.position.y = k * (d.box.max[1] - d.box.min[1] + 0.1);
      if (d.openT >= 1) d.mesh.visible = false;
    }
    for (const [id, im] of Object.entries(this.itemMeshes)) {
      im.mesh.visible = g.held !== id && this.isItemAvailable(id);
      im.mesh.rotation.y = t * 1.2;
    }
    for (const tm of this.tokenMeshes) {
      tm.mesh.visible = !this.facts.get(`token_${tm.tk.token}`);
      tm.mesh.children[0].rotation.y = t * 1.5;
      tm.mesh.children[0].rotation.x = t * 0.7;
    }
    for (const p of Object.values(this.props)) {
      if (p.userData.gem) {
        p.userData.gem.rotation.y = t * 1.4;
        p.userData.gem.position.y = Math.sin(t * 2) * 0.06;
      }
      if (p.userData.ring) p.userData.ring.scale.setScalar(1 + Math.sin(t * 2.4) * 0.04);
    }
    // time sweepers: stopped by a TIME FREEZES law in their room's state
    const feet = player.pos.y - player.half.y, head = player.pos.y + player.half.y;
    for (const h of this.hazards) {
      const frozen = this.engine.hasIn('timeStop', h.hz.room);
      if (!frozen) h.angle += h.hz.speed * dt;
      h.g.rotation.y = h.angle;
      h.beamMat.color.setHex(frozen ? 0xb6a6ff : 0xff8f7a);
      if (frozen || g.room !== h.hz.room) continue;
      const by = h.hz.pivot[1];
      if (feet > by + 0.1 || head < by - 0.1) continue;
      // distance from the player to the beam line in the horizontal plane
      const dx = player.pos.x - h.hz.pivot[0], dz = player.pos.z - h.hz.pivot[2];
      const ax = Math.cos(h.angle), az = -Math.sin(h.angle);
      const along = dx * ax + dz * az;
      if (Math.abs(along) > h.hz.radius) continue;
      const perp = Math.abs(dx * -az + dz * ax);
      if (perp < 0.42) event = 'hit';
    }
    for (const s of this.sentinels) {
      const r = s.update(dt, t, {
        player,
        here: g.room === s.def.room,
        frozen: this.engine.hasIn('observerFrozen', s.def.room),
        hidden: player.gravity === 1,
      });
      if (r === 'caught') event = 'caught';
    }
    for (const n of this.npcs) {
      const m = n.model;
      const d = _v.copy(player.pos).sub(m.position);
      d.y = 0;
      if (!n.n.silent && d.length() < 7) {
        const yaw = Math.atan2(d.x, d.z);
        m.rotation.y += Math.atan2(Math.sin(yaw - m.rotation.y), Math.cos(yaw - m.rotation.y)) * Math.min(1, dt * 3);
        m.userData.lookAt?.(_v.copy(player.pos).setY(player.pos.y + 0.6));
      } else m.userData.lookAt?.(null);
      n.talkT = Math.max(0, n.talkT - dt);
      m.userData.setTalking?.(n.talkT > 0);
      m.userData.animate(dt, 0, t);
    }
    return event;
  }

  focusCandidates(g) {
    if (!this.level) return [];
    const out = [];
    for (const it of this.level.interactables) {
      if (this.flags[`done_${it.id}`] && it.kind !== 'beacon' && it.kind !== 'terminal' && it.kind !== 'chair') continue;
      if ((it.kind === 'lock' || it.kind === 'socket') && this.flags[`open_${it.room}`]) continue;
      out.push({ id: `deck:${it.id}`, pos: it.pos, r: it.r, prompt: it.prompt, it });
    }
    for (const [id, im] of Object.entries(this.itemMeshes)) {
      if (g.held === id || !this.isItemAvailable(id)) continue;
      out.push({ id: `ditem:${id}`, pos: im.it.pos, r: 2.3, prompt: `TAKE ${im.it.label}` });
    }
    for (const n of this.npcs) {
      if (n.n.silent) continue;
      const p = n.model.position;
      out.push({ id: `dnpc:${n.n.id}`, pos: [p.x, p.y + 1.5, p.z], r: 3.2, prompt: `TALK TO ${n.crew.first.toUpperCase()}`, npc: n });
    }
    return out;
  }
}

function crewGlow(css) {
  const c = new THREE.Color(css);
  return c.lerp(new THREE.Color(0xffffff), 0.35).getHex();
}

// A deck sentinel: a smaller cousin of the Observer. It patrols a loop, sees
// in a cone along the floor (never the ceiling), and walks you back to the
// last checkpoint if it reaches you. Frozen by OBSERVER FREEZES.
export class Sentinel {
  constructor(def, model) {
    this.def = def;
    this.model = model;
    this.pos = new THREE.Vector3(def.path[0][0], 0, def.path[0][1]);
    this.wp = 1 % def.path.length;
    this.dir = new THREE.Vector3(0, 0, -1);
    this.mode = 'patrol';
    this.suspicion = 0;
    this.lostT = 0;
    this.home = this.pos.clone();
    this.sync(0);
  }

  reset() {
    this.mode = 'patrol';
    this.suspicion = 0;
  }

  sees(player) {
    const to = _v.copy(player.pos).sub(this.pos);
    to.y = 0;
    const d = to.length();
    if (d > this.def.range || d < 0.01) return false;
    to.normalize();
    if (to.dot(this.dir) < Math.cos(this.def.fov * 0.6)) return false;
    // line of sight at chest height
    const eye = new THREE.Vector3(this.pos.x, 1.6, this.pos.z);
    const target = new THREE.Vector3(player.pos.x, Math.min(player.pos.y, 2.0), player.pos.z);
    const dir = target.clone().sub(eye);
    const len = dir.length();
    dir.divideScalar(len);
    return player.rayDistance(eye, dir, len) >= len - 0.6;
  }

  update(dt, t, { player, here, frozen, hidden }) {
    const U = this.model.userData;
    if (frozen) {
      U.eyeMat.color.setHex(0xb6a6ff);
      U.coneMat.color.setHex(0xb6a6ff);
      U.coneMat.opacity = 0.05;
      this.suspicion = 0;
      this.mode = 'patrol';
      this.sync(dt, 0);
      return null;
    }
    const seen = here && !hidden && this.sees(player);
    if (seen) this.suspicion = Math.min(1.2, this.suspicion + dt * (player.running ? 2.4 : 1.4));
    else this.suspicion = Math.max(0, this.suspicion - dt * 0.45);
    if (this.mode !== 'chase' && this.suspicion >= 1) this.mode = 'chase';
    let speed = this.def.speed;
    let target;
    if (this.mode === 'chase') {
      if (!here || hidden) this.lostT += dt;
      else if (seen) this.lostT = 0;
      else this.lostT += dt;
      if (this.lostT > 2.2) {
        this.mode = 'patrol';
        this.suspicion = 0.4;
        this.lostT = 0;
      }
      target = new THREE.Vector3(player.pos.x, 0, player.pos.z);
      speed = 4.4;
    } else {
      const w = this.def.path[this.wp];
      target = new THREE.Vector3(w[0], 0, w[1]);
      if (this.suspicion > 0.3 && seen) {
        // stop and stare
        speed = 0;
        this.turnTo(_v.copy(player.pos).sub(this.pos).setY(0), dt);
      }
    }
    const to = target.clone().sub(this.pos);
    to.y = 0;
    const d = to.length();
    if (d > 0.05 && speed > 0) {
      this.turnTo(to, dt);
      this.pos.addScaledVector(to.normalize(), Math.min(d, speed * dt));
    }
    if (this.mode === 'patrol' && d < 0.3) this.wp = (this.wp + 1) % this.def.path.length;
    const col = this.mode === 'chase' ? 0xff8a70 : this.suspicion > 0.3 ? 0xffc04a : 0x7fd8ff;
    U.eyeMat.color.setHex(col);
    U.coneMat.color.setHex(col);
    U.coneMat.opacity = this.mode === 'chase' ? 0.16 : 0.09;
    this.sync(dt, speed);
    if (this.mode === 'chase' && here && player.pos.distanceTo(_v.set(this.pos.x, player.pos.y, this.pos.z)) < 1.15) {
      this.mode = 'patrol';
      this.suspicion = 0;
      return 'caught';
    }
    return null;
  }

  turnTo(dir, dt) {
    if (dir.lengthSq() < 1e-6) return;
    const want = dir.clone().normalize();
    this.dir.lerp(want, 1 - Math.exp(-dt * 6)).normalize();
  }

  sync(dt, speed = 0) {
    const m = this.model;
    m.position.copy(this.pos);
    m.rotation.y = Math.atan2(-this.dir.x, -this.dir.z);
    const U = m.userData;
    this.walk = (this.walk || 0) + dt * speed * 3;
    if (U.legs) U.legs.forEach((l, i) => (l.rotation.x = Math.sin(this.walk + i * Math.PI) * Math.min(0.5, speed * 0.2)));
  }
}
