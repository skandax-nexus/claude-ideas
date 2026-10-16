// Environment system: turns map data into meshes and colliders, and
// re-evaluates every conditional element whenever facts, room states or
// laws change. Static geometry is merged per room/material.
import * as THREE from '../../vendor/three.module.min.js';
import { createMaterials, boxGeometry, mergeGeometries, textTexture } from './materials.js';
import * as M from './models.js';
import { makeCastModel } from './People.js';
import {
  elements, texts, drifters, cables, interactables, items, tokens, SHADOW,
} from './maps.js';
import { TOKENS } from '../core/Laws.js';
import { compileCondition } from '../core/conditions.js';

export class World {
  constructor(scene, facts, engine) {
    this.scene = scene;
    this.facts = facts;
    this.engine = engine;
    this.mats = createMaterials();
    this.staticColliders = [];
    this.colliders = [];
    this.dynamic = []; // { el, mesh, cond }
    this.textMeshes = [];
    this.props = {}; // visuals for interactables by id
    this.itemMeshes = {};
    this.tokenMeshes = [];
    this.cableMeshes = [];
    this.drift = [];
    this.root = new THREE.Group(); // Station Zero; hidden while you are out on the vessel
    scene.add(this.root);
    this.build();
  }

  ctx(room) {
    return { fact: (k) => this.facts.get(k), state: this.engine.state(room) };
  }

  build() {
    const groups = new Map();
    for (const el of elements) {
      const [x0, y0, z0, x1, y1, z1] = el.box;
      const geo = boxGeometry(x1 - x0, y1 - y0, z1 - z0);
      geo.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      const box = { min: [x0, y0, z0], max: [x1, y1, z1], id: el.id, room: el.room };
      if (!el.when && !el.echo) {
        const k = `${el.room}|${el.mat}`;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(geo);
        if (el.solid) this.staticColliders.push(box);
      } else {
        const mesh = new THREE.Mesh(geo, el.echo ? this.mats.echo : this.mats[el.mat]);
        mesh.castShadow = !el.echo;
        mesh.receiveShadow = !el.echo;
        if (el.echo) {
          const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), this.mats.echoLine);
          mesh.add(edges);
        }
        this.root.add(mesh);
        this.dynamic.push({ el, mesh, box, cond: compileCondition(el.when) });
      }
    }
    for (const [k, geos] of groups) {
      const mat = this.mats[k.split('|')[1]];
      const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
      if (mat.transparent) mesh.renderOrder = 2;
      const matName = k.split('|')[1];
      mesh.castShadow = !(matName === 'ceil' || matName === 'glass' || matName.startsWith('strip'));
      mesh.receiveShadow = true;
      this.root.add(mesh);
      geos.forEach((g) => g.dispose());
    }

    for (const t of texts) {
      const { tex, aspect } = textTexture(t.text, { color: t.color });
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, depthWrite: false, fog: false,
        blending: THREE.NormalBlending,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(t.size * aspect, t.size), mat);
      mesh.position.set(...t.pos);
      if (t.ceiling) {
        mesh.rotation.x = Math.PI / 2; // face down
        mesh.rotation.z = Math.PI;
      } else mesh.rotation.y = t.rotY;
      this.root.add(mesh);
      this.textMeshes.push({ t, mesh, cond: compileCondition(t.when) });
    }

    for (const d of drifters) {
      const mesh = new THREE.Mesh(boxGeometry(d.size, d.size, d.size, 1), this.mats.crate);
      mesh.position.set(...d.pos);
      this.root.add(mesh);
      this.drift.push({ d, mesh, phase: Math.random() * 6 });
    }

    for (const c of cables) {
      const mesh = M.makeCable(c.pts);
      this.root.add(mesh);
      this.cableMeshes.push({ c, mesh, cond: compileCondition(c.when) });
    }

    this.buildProps();
    this.buildItems();
    this.buildTokens();

    this.stars = M.makeStarfield();
    this.root.add(this.stars);
  }

  // The Other wears your face: rebuild it when you pick a hero.
  refreshCast(choice) {
    const old = this.props.other;
    if (!old) return;
    const next = makeCastModel('other', choice);
    next.position.copy(old.position);
    next.rotation.copy(old.rotation);
    next.visible = old.visible;
    old.parent?.add(next);
    old.parent?.remove(old);
    this.props.other = next;
  }

  buildProps() {
    const P = this.props;
    const add = (id, obj, pos, rotY = 0) => {
      obj.position.set(...pos);
      obj.rotation.y = rotY;
      this.root.add(obj);
      P[id] = obj;
      return obj;
    };
    const shard = add('shard', M.makeShard(), [0, 1.7, 21.5]);
    shard.userData.baseY = 1.7;
    add('r1', M.makeTerminal(), [-8, 1.0, 8], Math.PI);
    add('r0', M.makeTerminal(), [16.55, 1.1, 6], -Math.PI / 2);
    add('r2', M.makeTerminal(), [0, 1.0, -35.05], 0);
    add('machine', M.makeMachineRing(), [0, 3.6, 0]);
    add('brain', M.makeBrain(), [0, 3.6, 0]);
    add('socketCore', M.makeCoreItem(), [0, 1.2, 1.7]);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.08), new THREE.MeshBasicMaterial({ color: 0x4af0c8 }));
    add('archive_lock', lock, [3, 1.4, -11.95]);
    add('custodian', makeCastModel('custodian'), [0, 0, -20.5], Math.PI);
    const other = add('other', makeCastModel('other'), [0, 4.5, 14.5]);
    other.rotation.z = Math.PI;
    // The shadow lives on the east wall of the lab, and as a figure in echo.
    const wallShadow = M.makeWallShadow();
    wallShadow.rotation.y = -Math.PI / 2;
    add('shadowWall', wallShadow, [SHADOW.wallX, 1.0, 0], -Math.PI / 2);
    add('shadow', M.makeShadowFigure(), [11.1, 0, 0], -Math.PI / 2);
  }

  buildItems() {
    for (const it of items) {
      const mesh = it.id === 'key' ? M.makeKeyItem(true) : M.makeCoreItem();
      mesh.position.set(...it.pos);
      this.root.add(mesh);
      this.itemMeshes[it.id] = { it, mesh, cond: compileCondition(it.when) };
    }
  }

  buildTokens() {
    for (const tk of tokens) {
      const mesh = M.makeToken(TOKENS[tk.token].label);
      mesh.position.set(...tk.pos);
      if (tk.hang) mesh.rotation.z = Math.PI; // readable from the ceiling
      this.root.add(mesh);
      this.tokenMeshes.push({ tk, mesh });
    }
  }

  echoVisible(state) {
    return state === 'ECHO' || this.engine.has('echoVisible', state);
  }

  // Re-evaluate all conditional geometry. Cheap: a few hundred conditions.
  refresh() {
    const cols = this.staticColliders.slice();
    for (const d of this.dynamic) {
      const c = this.ctx(d.el.room);
      const present = !!d.cond(c);
      if (d.el.echo) {
        const solid = present && this.engine.has('echoSolid', c.state) && d.el.solid !== false;
        d.mesh.visible = present && (solid || this.echoVisible(c.state));
        d.mesh.material = solid ? this.mats.echoSolid : this.mats.echo;
        if (solid) cols.push(d.box);
      } else {
        d.mesh.visible = present;
        if (present && d.el.solid !== false) cols.push(d.box);
      }
    }
    this.colliders = cols;
    for (const tm of this.textMeshes) {
      const c = this.ctx(tm.t.room);
      tm.mesh.visible = !!tm.cond(c) && (!tm.t.echo || this.echoVisible(c.state));
    }
    for (const cm of this.cableMeshes) cm.mesh.visible = !!cm.cond(this.ctx(cm.c.room));
    for (const i of interactables) {
      const p = this.props[i.id];
      if (p && i.kind !== 'shadow') p.visible = !!compileCondition(i.when)(this.ctx(i.room));
    }
    this.props.shard.visible = !this.facts.get('has_device');
    this.props.socketCore.visible = !!this.facts.get('core_installed');
  }

  isItemAvailable(id) {
    const im = this.itemMeshes[id];
    const c = this.ctx(im.it.room);
    if (!im.cond(c)) return false;
    return !im.it.echo || this.echoVisible(c.state);
  }

  update(dt, t, heldId) {
    const P = this.props;
    P.shard.userData.spin(t);
    P.machine.userData.inner.rotation.z = t * (this.facts.get('machine_activated') ? 2.5 : 0.3);
    P.brain.userData.pulse(t);
    for (const id of ['r0', 'r1', 'r2']) P[id].userData.screen.material.opacity = 0.7 + Math.sin(t * 9 + id.length) * 0.08;
    P.custodian.userData.setOpacity?.(0.62 + Math.sin(t * 13) * 0.05 + (Math.random() < 0.03 ? -0.25 : 0));
    P.other.userData.setOpacity?.(0.6 + Math.sin(t * 3) * 0.12);
    P.custodian.userData.animate(1 / 60, 0, t);
    P.other.userData.animate(1 / 60, 0, t);

    for (const tm of this.tokenMeshes) {
      tm.mesh.visible = !this.facts.get(`token_${tm.tk.token}`);
      tm.mesh.children[0].rotation.y = t * 1.5;
      tm.mesh.children[0].rotation.x = t * 0.7;
    }
    for (const [id, im] of Object.entries(this.itemMeshes)) {
      im.mesh.visible = heldId !== id && this.isItemAvailable(id);
      im.mesh.rotation.y = t * 1.2;
    }

    // gravity-reactive debris
    const g = this.engine.gravity('antechamber');
    for (const dr of this.drift) {
      const h = dr.d.size / 2;
      const target = g === -1 ? h : g === 1 ? 4.5 - h : 1.1 + dr.phase * 0.35 + Math.sin(t * 0.7 + dr.phase) * 0.25;
      dr.mesh.position.y += (target - dr.mesh.position.y) * Math.min(1, dt * (g === 0 ? 0.8 : 4));
      if (g === 0) {
        dr.mesh.rotation.x += dt * 0.3;
        dr.mesh.rotation.y += dt * 0.2;
      }
    }

    if (this.facts.get('machine_activated')) this.stars.rotation.y += dt * 0.01;
  }
}
