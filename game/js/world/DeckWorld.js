// Runtime for a generated sector of the vessel (see gen/LevelGen.js): turns
// level data into meshes and colliders, evaluates conditional geometry against
// the sector's flags and the rooms' reality states, and runs the moving parts
// (time sweepers, sentinels, crew).
import * as THREE from '../../vendor/three.module.min.js';
import { deckMaterials, boxGeometry, mergeGeometries, textTexture } from './materials.js';
import * as M from './models.js';
import { makeCrewModel, makeCastModel } from './People.js';
import { TOKENS } from '../core/Laws.js';
import { compileCondition } from '../core/conditions.js';
import { mergeVertices } from '../../vendor/addons/utils/BufferGeometryUtils.js';
import { buildDecor, RESKIN } from './DeckDecor.js';

const _v = new THREE.Vector3(), _c = new THREE.Color();

// named people who can stand in a generated room (they are not crew): see LevelGen storyRoom
const GUESTS = {
  juno: { id: 'juno', first: 'Juno', name: 'JUNO HALE', color: '#2f9a64' },
  other: { id: 'other', first: '???', name: '???', color: '#7a5fd0' },
};

export class DeckWorld {
  constructor(scene, engine, facts) {
    this.scene = scene;
    this.engine = engine;
    this.facts = facts;
    this.root = null;
    this.level = null;
    this.flags = {};
    this.colliders = [];
    this.temps = []; // WORLD FORGE gear: hard-light lines and stairs that last a few seconds
    this.lensT = 0; // WORLD FORGE gear: the echo lens shows every echo for a while
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
    this.temps = [];
    this.lensT = 0;
    // a memory key the KEY FORGE made real stays real (the flag is saved with the sector)
    for (const it of level.items) if (it.echo && this.flags[`forged_${it.id}`]) it.echo = false;

    // static geometry merged per material, conditional pieces kept separate
    const groups = new Map(), dress = new Map();
    const reskin = RESKIN[level.palette.look] || {};
    for (const el of level.elements) {
      const [x0, y0, z0, x1, y1, z1] = el.box;
      const geo = boxGeometry(x1 - x0, y1 - y0, z1 - z0);
      geo.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      const box = { min: [x0, y0, z0], max: [x1, y1, z1], id: el.id, room: el.room };
      // furniture this deck dresses in its own model (DeckDecor): keep the collision only
      if (el.invisible || (el.part && reskin[el.part]) || (el.prop && reskin[el.prop] === 'full')) {
        // collision only (the visible part is drawn elsewhere, e.g. a tree)
        if (el.solid) this.staticColliders.push(box);
        geo.dispose();
        continue;
      }
      if (el.dress) {
        // decoration that belongs to one state (THE LAST VERSION): merged per material and condition
        const k = `${el.mat}|${el.when || ''}|${el.room}`;
        if (!dress.has(k)) dress.set(k, { el, geos: [] });
        dress.get(k).geos.push(geo);
        continue;
      }
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
    for (const { el, geos } of dress.values()) {
      const mesh = new THREE.Mesh(mergeGeometries(geos), this.mats[el.mat] || this.mats.wall);
      mesh.receiveShadow = true;
      root.add(mesh);
      geos.forEach((g) => g.dispose());
      this.dynamic.push({ el: { when: el.when, room: el.room, mat: el.mat, solid: false }, kind: null, mesh, box: null, cond: compileCondition(el.when) });
    }
    for (const [mat, geos] of groups) {
      const material = this.mats[mat] || this.mats.wall;
      const mesh = new THREE.Mesh(mergeGeometries(geos), material);
      if (material.transparent) mesh.renderOrder = 2;
      // the glass sky and see-through walls let the light through (a dome shadow cut a hard
      // diagonal edge across HALCYON where the sun's shadow area ended)
      mesh.castShadow = !['ceil', 'glass', 'glow', 'gate', 'leaf', 'dome', 'roots', 'glassWall', 'neon', 'lamp', 'shopfront', 'screen', 'podLight', 'windowStars', 'windowDark'].includes(mat);
      // ceilings, the dome and the roots face down, away from the sun: it adds nothing to them
      // shadowed or not, so they skip the 16 shadow-map lookups per pixel
      mesh.receiveShadow = !['ceil', 'roots', 'dome'].includes(mat);
      root.add(mesh);
      geos.forEach((g) => g.dispose());
    }

    // the deck's own set dressing (decoration only: no collisions)
    this.decor = buildDecor(level);
    if (this.decor) root.add(this.decor.root);

    // dark decks lighten the ink of their plaques so they stay readable
    const ink = level.palette.ink;
    const white = new THREE.Color(0xffffff);
    for (const t of level.texts) {
      const color = ink ? '#' + new THREE.Color(t.color).lerp(white, ink).getHexString() : t.color;
      const { tex, aspect } = textTexture(t.text, { color, font: 'bold 60px Inter, "Segoe UI", sans-serif' });
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(t.size * aspect, t.size), mat);
      mesh.position.set(...t.pos);
      mesh.rotation.y = t.rotY || 0;
      root.add(mesh);
      this.textMeshes.push({ t, mesh, cond: compileCondition(t.when) });
    }

    // pools of light under lamps (main.js turns the nearest into real lights)
    this.glows = [...(level.glows || []), ...(this.decor?.glows || [])];
    if (this.glows.length) root.add(...lightPools(this.glows));
    if (level.trees?.length || level.rocks?.length) root.add(...forest(level, this.mats));

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
      const guest = GUESTS[n.crew];
      const crew = guest || story.cast.find((c) => c.id === n.crew) || (n.ambient ? { id: n.crew, first: n.first || 'Someone', name: n.first || 'SOMEONE', color: '#4f6170', seed: n.seed || 1, pronoun: n.pronoun } : story.captain);
      const model = guest ? makeCastModel(n.crew, this.hero) : makeCrewModel(crew, { hologram: !!n.hologram, glow: n.hologram ? crewGlow(crew.color) : undefined, height: n.height });
      if (n.upsideDown) model.rotation.z = Math.PI; // hangs from the ceiling, like the Other in the first corridor
      model.position.set(...n.pos);
      model.rotation.y = n.yaw || 0;
      root.add(model);
      // THE LAST VERSION: someone who only exists in some temporal states (n.temporal) leaves an
      // echo in the others - a translucent impression of them that can still be listened to
      let echo = null;
      if (n.temporal && !guest) {
        echo = makeCrewModel(crew, { hologram: true, glow: crewGlow(crew.color), height: n.height });
        echo.position.copy(model.position);
        echo.rotation.y = model.rotation.y;
        echo.visible = false;
        root.add(echo);
      }
      // ambient people walk a small loop (n.path: [[x, z], ...]) and stand still when the world stops
      this.npcs.push({ n, crew, model, body: model, echo, talkT: 0, cond: compileCondition(n.when), freeze: compileCondition(n.freezeWhen || 'false'), wp: 0, lastBark: -99 });
    }
    this.decoy = null; // an Echo Step afterimage the watchers chase instead of you

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
    } else if (it.kind === 'fragment') {
      // a memory fragment: a small bright crystal (HALCYON)
      obj = new THREE.Group();
      const c = new THREE.Color(this.level.palette.accent2 ?? 0x9fe8ff);
      const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(1.4) }));
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.18, depthWrite: false }));
      obj.add(gem, halo);
      obj.userData.gem = gem;
      obj.position.set(...it.pos);
      obj.visible = !this.flags[`done_${it.id}`];
    } else if (it.kind === 'scene') {
      // THE LAST VERSION: something to inspect; the edition may hand over its own model
      obj = new THREE.Group();
      if (it.model) obj.add(it.model());
      else {
        const c = new THREE.Color(it.color ?? 0xffc04a);
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: c }));
        const halo = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.14, depthWrite: false }));
        obj.add(gem, halo);
        obj.userData.gem = gem;
      }
      obj.position.set(it.pos[0], it.pos[1] - (it.model ? 0 : 0.2), it.pos[2]);
      obj.rotation.y = it.yaw || 0;
      obj.visible = !it.when || !!compileCondition(it.when)(this.ctx(it.room));
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
      if (o.material && o.material.map && !o.material.userData.keep && !Object.values(this.mats || {}).includes(o.material)) o.material.map.dispose?.();
    });
    this.root = null;
    this.level = null;
    this.decor = null;
    this.glows = [];
  }

  echoVisible(state) {
    return state === 'ECHO' || this.lensT > 0 || this.engine.has('echoVisible', state);
  }

  // WORLD FORGE gear: a solid hard-light box (a grapple line, a stair) for a few seconds
  addTemp(box, secs) {
    const [x0, y0, z0, x1, y1, z1] = box;
    const geo = boxGeometry(x1 - x0, y1 - y0, z1 - z0);
    geo.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    const mesh = new THREE.Mesh(geo, this.mats.lightSolid);
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), this.mats.lightLine));
    this.root.add(mesh);
    const t = { mesh, box: { min: [x0, y0, z0], max: [x1, y1, z1] }, t: secs };
    this.temps.push(t);
    this.refresh();
    return t;
  }

  // the echo lens: every echo shows, in any state, for a while
  lens(secs) {
    this.lensT = secs;
    this.refresh();
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
    for (const t of this.temps) cols.push(t.box);
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
      if (it.kind === 'fragment') p.visible = !this.flags[`done_${it.id}`];
      if (it.kind === 'scene') p.visible = (!it.when || !!compileCondition(it.when)(this.ctx(it.room))) && !(it.once && this.flags[`done_${it.id}`]);
    }
    for (const p of this.npcs || []) {
      const c = this.ctx(p.n.room);
      const here = !!p.cond(c);
      if (p.echo) {
        // in a state they do not exist in, their echo stands where they would be
        const want = p.n.temporal.includes(c.state) ? p.body : p.echo;
        if (want !== p.model) {
          want.position.copy(p.model.position);
          want.rotation.y = p.model.rotation.y;
          p.model.visible = false;
          p.model = want;
        }
        p.isEcho = p.model === p.echo;
      }
      p.model.visible = here;
    }
  }

  // THE LAST VERSION: each temporal state tints the place (warm stone and wood in the past,
  // cold steel now, moss and rust in 2196, a cold violet when inverted), eased in by main.js
  setLook(state, k = 1) {
    if (!this.mats) return;
    // (materials are shared between levels of one palette: each keeps its own untinted base)
    const keys = ['wall', 'floor', 'prop', 'prop2', 'trim', 'trimDark', 'facade', 'industrial', 'road', 'sidewalk', 'stone', 'pillar', 'ceil', 'door'];
    const tint = { PAST: [1.1, 0.96, 0.78], PRESENT: [1, 1, 1], PHYSICAL: [1, 1, 1], FUTURE: [0.82, 0.98, 0.84], INVERTED: [0.94, 0.9, 1.08], ECHO: [0.9, 1.02, 1.04] }[state] || [1, 1, 1];
    for (const key of keys) {
      const m = this.mats[key];
      if (!m?.color) continue;
      const b = (m.userData.lookBase ??= m.color.clone());
      _c.set(b.r * tint[0], b.g * tint[1], b.b * tint[2]);
      m.color.lerp(_c, k);
    }
    // the lit windows: in 2196 nobody has power any more
    const lit = { FUTURE: 0.05, INVERTED: 0.6 }[state] ?? 1;
    for (const key of ['facade', 'industrial']) {
      const m = this.mats[key];
      if (!m?.emissiveMap) continue;
      const base = (m.userData.litBase ??= m.emissiveIntensity);
      m.emissiveIntensity += (base * lit - m.emissiveIntensity) * k;
    }
  }


  // an Echo Step afterimage: the watchers chase it for `secs`, not you
  setDecoy(pos, secs) {
    this.decoy = { pos: pos.clone(), until: secs, proxy: null };
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
    // gear that runs out: hard light fades, the lens closes
    if (this.temps.length) {
      let gone = false;
      for (const tp of this.temps) {
        tp.t -= dt;
        tp.mesh.material = tp.t < 1.5 && Math.floor(tp.t * 8) % 2 ? this.mats.light : this.mats.lightSolid; // it flickers before it goes
        if (tp.t <= 0) { this.root.remove(tp.mesh); tp.mesh.geometry.dispose(); gone = true; }
      }
      if (gone) { this.temps = this.temps.filter((tp) => tp.t > 0); this.refresh(); }
    }
    if (this.lensT > 0) { this.lensT -= dt; if (this.lensT <= 0) { this.lensT = 0; this.refresh(); } }
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
    this.decor?.update(dt, t, this);
    for (const p of Object.values(this.props)) {
      for (const ch of p.children) {
        if (ch.userData.tick) ch.userData.tick(t);
        if (ch.userData.spin) ch.rotation.y = t * 1.2;
        if (ch.userData.inner) ch.userData.inner.rotation.z = t * 0.4;
      }
      if (p.userData.gem) {
        p.userData.gem.rotation.y = t * 1.4;
        p.userData.gem.position.y = Math.sin(t * 2) * 0.06;
      }
      if (p.userData.ring) p.userData.ring.scale.setScalar(1 + Math.sin(t * 2.4) * 0.04);
    }
    // time sweepers: stopped by a TIME FREEZES law in their room's state
    const feet = player.pos.y - player.half.y, head = player.pos.y + player.half.y;
    for (const h of this.hazards) {
      if (h.stasisT > 0) h.stasisT -= dt; // a stasis pulse holds it still
      const frozen = this.engine.hasIn('timeStop', h.hz.room) || h.stasisT > 0;
      if (!frozen) h.angle += h.hz.speed * dt * (this.engine.hasIn('timeReverse', h.hz.room) ? -1 : 1);
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
    // the afterimage the watchers follow (Echo Step)
    let who = player;
    if (this.decoy) {
      this.decoy.until -= dt;
      if (this.decoy.until <= 0) this.decoy = null;
      else who = this.decoy.proxy ||= { pos: this.decoy.pos, running: false, gravity: -1, rayDistance: (o, d, m) => player.rayDistance(o, d, m) };
    }
    const reversed = this.engine.hasIn('timeReverse', g.room); // INVERTED: selected motion runs backwards
    for (const s of this.sentinels) {
      // a watcher that only exists in some states (THE LAST VERSION: installed after 2026, say)
      if (s.def.when) {
        const on = !!(s.cond ||= compileCondition(s.def.when))(this.ctx(s.def.room));
        s.model.visible = on;
        if (!on) { s.mode = 'patrol'; s.suspicion = 0; continue; }
      }
      if (s.stasisT > 0) s.stasisT -= dt;
      if (s.lure && (s.lure.t -= dt) <= 0) s.lure = null;
      const r = s.update(dt, t, {
        player: who,
        here: g.room === s.def.room,
        frozen: this.engine.hasIn('observerFrozen', s.def.room) || s.stasisT > 0,
        hidden: who.gravity === 1,
        mode: s.dead ? 'still' : this.story?.after?.sentinels || 'hunt',
        lessons: g.observer?.brain?.lessons || null,
        reversed: reversed && s.def.room === g.room,
      });
      if (r === 'caught' && who === player) event = 'caught';
      // a unit that rewinds its own damage can only be lured into a live conduit
      if (s.def.conduit && !s.dead && s.mode === 'chase' && (!s.def.conduitWhen || this.ctx(s.def.room).fact(s.def.conduitWhen))) {
        const b = s.def.conduit;
        if (s.pos.x >= b[0] && s.pos.x <= b[2] && s.pos.z >= b[1] && s.pos.z <= b[3]) {
          s.dead = true;
          s.mode = 'patrol';
          s.suspicion = 0;
          this.onSentinelDown?.(s);
        }
      }
    }
    for (const n of this.npcs) {
      const m = n.model;
      const frozen = this.flags.freeze_people || !!n.freeze(this.ctx(n.n.room));
      const d = _v.copy(player.pos).sub(m.position);
      d.y = 0;
      const near = d.length() < 7;
      // someone you can talk to stops and turns to you; passers-by (and silent echoes) keep walking
      const talker = !n.n.silent && !(n.n.ambient && !n.n.lines && !n.n.scene);
      let speed = 0;
      if (talker && near && !frozen) {
        const yaw = Math.atan2(d.x, d.z);
        m.rotation.y += Math.atan2(Math.sin(yaw - m.rotation.y), Math.cos(yaw - m.rotation.y)) * Math.min(1, dt * 3);
        m.userData.lookAt?.(_v.copy(player.pos).setY(player.pos.y + 0.6));
      } else if (n.n.path && !frozen && m.visible) {
        // walk the loop (WORLD FORGE's cast walk their scenes; THE LAST VERSION's city walks its streets)
        const w = n.n.path[n.wp];
        const to = _v.set(w[0] - m.position.x, 0, w[1] - m.position.z);
        const dist = to.length();
        if (dist < 0.25) n.wp = (n.wp + 1) % n.n.path.length;
        else {
          speed = n.n.speed || 0.9;
          const yaw = Math.atan2(to.x, to.z);
          m.rotation.y += Math.atan2(Math.sin(yaw - m.rotation.y), Math.cos(yaw - m.rotation.y)) * Math.min(1, dt * 4);
          m.position.addScaledVector(to.divideScalar(dist), Math.min(dist, speed * dt));
        }
        m.userData.lookAt?.(null);
      } else m.userData.lookAt?.(null);
      n.talkT = Math.max(0, n.talkT - dt);
      m.userData.setTalking?.(n.talkT > 0);
      if (!m.visible) continue; // hidden (not here in this state, or their echo stands in): no pose to compute, nothing to say
      if (!frozen) m.userData.animate(dt, speed, t);
      // a bark: something said in passing, never over a conversation
      // (one bark at a time across the whole place, each person starting somewhere else in their list)
      if (n.n.barks?.length && m.visible && !n.isEcho && !frozen && d.length() < 5 && t - n.lastBark > (n.n.barkEvery || 16) && t - (this.lastBarkT ?? -99) > 9 && !g.hud.talking && !g.menu) {
        n.lastBark = this.lastBarkT = t;
        n.barkI = n.barkI === undefined ? (n.n.seed || this.npcs.indexOf(n)) % n.n.barks.length : (n.barkI + 1) % n.n.barks.length;
        const text = n.n.barks[n.barkI];
        n.talkT = 2.5;
        const gender = { her: 'f', his: 'm' }[(n.n.pronoun || n.crew.pronoun)?.their] || 'n';
        g.hud.say([{ who: n.n.voice || n.crew.voice || 'CREW', name: (n.n.first || n.crew.first || '').toUpperCase(), color: n.crew.color, text, voice: n.n.voiceExtra || { gender } }], g.facts);
      }
    }
    return event;
  }

  focusCandidates(g) {
    if (!this.level) return [];
    const out = [];
    for (const it of this.level.interactables) {
      if (this.flags[`done_${it.id}`] && it.kind !== 'beacon' && it.kind !== 'terminal' && it.kind !== 'chair') continue;
      if ((it.kind === 'lock' || it.kind === 'socket') && this.flags[`open_${it.room}`]) continue;
      if (it.r === 0 || this.flags[`filled_${it.id}`] || (it.when && !compileCondition(it.when)(this.ctx(it.room)))) continue; // not here (yet), not in this state, or done
      out.push({ id: `deck:${it.id}`, pos: it.pos, r: it.r, prompt: it.prompt, it });
    }
    for (const [id, im] of Object.entries(this.itemMeshes)) {
      if (g.held === id || !this.isItemAvailable(id)) continue;
      out.push({ id: `ditem:${id}`, pos: im.it.pos, r: 2.3, prompt: `TAKE ${im.it.label}` });
    }
    for (const n of this.npcs) {
      if (n.n.silent || !n.model.visible || (n.n.ambient && !n.n.lines && !n.n.scene)) continue;
      const p = n.model.position;
      const who = (n.n.first || n.crew.first).toUpperCase();
      out.push({ id: `dnpc:${n.n.id}`, pos: [p.x, p.y + 1.5, p.z], r: 3.2, prompt: n.isEcho ? `LISTEN TO ${who}'S ECHO` : n.n.prompt || `TALK TO ${who}`, npc: n });
    }
    return out;
  }
}

// Trees and boulders for open districts: tapered bark trunks with layered,
// lumpy crowns, and moss-covered rocks; instanced, a few draw calls in all.
function forest(level, mats) {
  const out = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
  const trees = level.trees || [];
  if (trees.length) {
    const trunkGeo = new THREE.CylinderGeometry(0.55, 1, 1, 10, 4).translate(0, 0.5, 0);
    // jitter the trunk a little so no two read as perfect cylinders
    const tp = trunkGeo.attributes.position;
    for (let i = 0; i < tp.count; i++) tp.setX(i, tp.getX(i) * (1 + Math.sin(tp.getY(i) * 9 + i) * 0.06));
    trunkGeo.computeVertexNormals();
    let crownGeo = new THREE.IcosahedronGeometry(1, 3);
    crownGeo.deleteAttribute('normal');
    crownGeo.deleteAttribute('uv');
    crownGeo = mergeVertices(crownGeo); // welded, so the lumps shade smoothly
    const cp = crownGeo.attributes.position;
    for (let i = 0; i < cp.count; i++) {
      const v = p.fromBufferAttribute(cp, i);
      v.multiplyScalar(1 + Math.sin(v.x * 5.1) * Math.cos(v.z * 4.3) * 0.14 + Math.sin(v.y * 7.7) * 0.06);
      cp.setXYZ(i, v.x, v.y, v.z);
    }
    crownGeo.computeVertexNormals();
    const trunks = new THREE.InstancedMesh(trunkGeo, mats.bark, trees.length);
    const crowns = new THREE.InstancedMesh(crownGeo, mats.crown || mats.leaf, trees.length * 3);
    trees.forEach(([x, z, h, r, c, turn], i) => {
      q.setFromAxisAngle(p.set(0, 1, 0), turn);
      m.compose(p.set(x, 0, z), q, sc.set(r, h, r));
      trunks.setMatrixAt(i, m);
      for (let k = 0; k < 3; k++) {
        const a = turn + k * 2.1;
        m.compose(p.set(x + Math.cos(a) * c * 0.35, h - 0.6 + k * 0.9, z + Math.sin(a) * c * 0.35), q, sc.set(c * (1 - k * 0.18), c * 0.72 * (1 - k * 0.15), c * (1 - k * 0.18)));
        crowns.setMatrixAt(i * 3 + k, m);
      }
    });
    trunks.castShadow = crowns.castShadow = true;
    trunks.receiveShadow = crowns.receiveShadow = true;
    out.push(trunks, crowns);
  }
  const rocks = level.rocks || [];
  if (rocks.length) {
    const rockGeo = new THREE.DodecahedronGeometry(1, 1);
    const rp = rockGeo.attributes.position;
    for (let i = 0; i < rp.count; i++) {
      const v = p.fromBufferAttribute(rp, i);
      v.set(v.x * (1 + Math.sin(v.y * 6) * 0.12), v.y * 0.62, v.z * (1 + Math.cos(v.x * 5) * 0.12));
      rp.setXYZ(i, v.x, v.y, v.z);
    }
    rockGeo.computeVertexNormals();
    const inst = new THREE.InstancedMesh(rockGeo, mats.rock || mats.prop, rocks.length);
    rocks.forEach(([x, z, b, turn], i) => {
      q.setFromAxisAngle(p.set(0, 1, 0), turn);
      m.compose(p.set(x, b * 0.2, z), q, sc.set(b, b, b));
      inst.setMatrixAt(i, m);
    });
    inst.castShadow = inst.receiveShadow = true;
    out.push(inst);
  }
  return out;
}

// Pools of light on the ground under lamps and shop windows, and faint cones
// of light from the lamps: instanced, additive, two draw calls for a district.
let poolTex = null;
function lightPools(glows) {
  if (!poolTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,0.9)');
    gr.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    poolTex = new THREE.CanvasTexture(c);
  }
  const out = [];
  const plane = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const pools = new THREE.InstancedMesh(plane, new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, fog: true }), glows.length);
  const m = new THREE.Matrix4(), col = new THREE.Color();
  glows.forEach(([x, y, z, r, c], i) => {
    m.makeScale(r * 2, 1, r * 2).setPosition(x, y + 0.03, z);
    pools.setMatrixAt(i, m);
    pools.setColorAt(i, col.setHex(c));
  });
  pools.renderOrder = 1;
  out.push(pools);
  const lamps = glows.filter((g) => g[5]);
  if (lamps.length) {
    const cone = new THREE.ConeGeometry(1, 1, 20, 1, true).translate(0, -0.5, 0);
    const coneMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.018, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true });
    // haze you see from a distance: it fades out as the camera comes close, so walking
    // past (or through) a lamp never washes half the screen
    coneMat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vAzD;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvAzD = -mvPosition.z;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vAzD;')
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.a *= smoothstep(4.0, 9.0, vAzD);');
    };
    const cones = new THREE.InstancedMesh(cone, coneMat, lamps.length);
    lamps.forEach(([x, , z, r, c, h], i) => {
      m.makeScale(r * 0.55, h, r * 0.55).setPosition(x, h, z);
      cones.setMatrixAt(i, m);
      cones.setColorAt(i, col.setHex(c));
    });
    cones.renderOrder = 1;
    out.push(cones);
  }
  return out;
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

  update(dt, t, { player, here, frozen, hidden, mode = 'hunt', lessons = null, reversed = false }) {
    const U = this.model.userData;
    if (reversed && this.mode !== 'chase') {
      // INVERTED: the patrol runs backwards along its loop
      if (!this.rev) {
        this.rev = true;
        this.wp = (this.wp - 1 + this.def.path.length) % this.def.path.length;
      }
    } else if (this.rev) {
      this.rev = false;
      this.wp = (this.wp + 1) % this.def.path.length;
    }
    // SEVERED: nobody looks out of it any more
    if (mode === 'still') {
      U.eyeMat.color.setHex(0x1a1a22);
      U.coneMat.opacity = 0;
      this.suspicion = 0;
      this.mode = 'patrol';
      this.sync(dt, 0);
      return null;
    }
    // OBSERVED: it is yours
    if (mode === 'kin') return this.kin(dt, player, here);
    // SUSTAINED: it carries what you taught the Observer in the hall
    const L = mode === 'learned' ? lessons : null;
    if (L?.has('ceiling')) hidden = false;
    if (frozen) {
      U.eyeMat.color.setHex(0xb6a6ff);
      U.coneMat.color.setHex(0xb6a6ff);
      U.coneMat.opacity = 0.05;
      this.suspicion = 0;
      this.mode = 'patrol';
      this.sync(dt, 0);
      return null;
    }
    const heard = !!L?.has('runner') && here && player.running && this.pos.distanceTo(_v.set(player.pos.x, 0, player.pos.z)) < 7;
    // a signal flare: it goes to look at the light instead of you
    const lured = !!this.lure;
    if (lured && this.mode === 'chase') { this.mode = 'patrol'; this.suspicion = 0; }
    const seen = !lured && ((here && !hidden && this.sees(player)) || heard);
    if (seen) this.suspicion = Math.min(1.2, this.suspicion + dt * (player.running ? 2.4 : 1.4));
    else this.suspicion = Math.max(0, this.suspicion - dt * 0.45);
    if (this.mode !== 'chase' && this.suspicion >= 1) this.mode = 'chase';
    let speed = this.def.speed;
    let target;
    if (this.mode === 'chase') {
      if (!here || hidden) this.lostT += dt;
      else if (seen) this.lostT = 0;
      else this.lostT += dt;
      if (this.lostT > (L?.has('patient') ? 4 : 2.2)) {
        this.mode = 'patrol';
        this.suspicion = 0.4;
        this.lostT = 0;
      }
      target = new THREE.Vector3(player.pos.x, 0, player.pos.z);
      speed = 4.4;
    } else {
      const w = this.def.path[this.wp];
      target = lured ? new THREE.Vector3(this.lure.x, 0, this.lure.z) : new THREE.Vector3(w[0], 0, w[1]);
      if (lured && target.distanceTo(this.pos) < 1.6) speed = 0; // it stands and stares at the flare
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
    if (this.mode === 'patrol' && !lured && d < 0.3) this.wp = this.rev ? (this.wp - 1 + this.def.path.length) % this.def.path.length : (this.wp + 1) % this.def.path.length;
    const col = this.mode === 'chase' ? 0xff8a70 : lured ? 0xffd27a : this.suspicion > 0.3 ? 0xffc04a : 0x7fd8ff;
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

  // OBSERVED: patrols, stops to watch you pass, never builds suspicion, never catches
  kin(dt, player, here) {
    const U = this.model.userData;
    this.suspicion = 0;
    this.mode = 'patrol';
    let speed = this.def.speed;
    const look = new THREE.Vector3(player.pos.x - this.pos.x, 0, player.pos.z - this.pos.z);
    if (here && look.length() < this.def.range) {
      speed = 0;
      this.turnTo(look, dt);
    } else {
      const w = this.def.path[this.wp];
      const to = new THREE.Vector3(w[0] - this.pos.x, 0, w[1] - this.pos.z);
      const d = to.length();
      if (d < 0.3) this.wp = (this.wp + 1) % this.def.path.length;
      else {
        this.turnTo(to, dt);
        this.pos.addScaledVector(to.divideScalar(d), Math.min(d, speed * dt));
      }
    }
    U.eyeMat.color.setHex(0xb48cff);
    U.coneMat.color.setHex(0xb48cff);
    U.coneMat.opacity = 0.05;
    this.sync(dt, speed);
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
