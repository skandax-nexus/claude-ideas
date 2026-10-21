// THE LAST VERSION OF EARTH: the watchers (OVERHAUL.md §6.4, D14).
//
// DeckWorld builds every watcher as Station Zero's Observer. After the level is built, the edition
// swaps the mesh inside each sentinel's group, in place, for the watcher this mission has: a Helix
// security drone (built here from primitives; a heavier one for the unit that rewinds its damage), a
// person (a Continuum trooper with a helmet torch, a scavenger with a lantern "eye", an elite with a
// lit visor), or M17's red hologram of the player's own look. The cone, the eye colour and the
// suspicion stay DeckWorld's (userData.eyeMat / coneMat); a person is animated from how far the
// sentinel moved each frame (update()). The Observer robot never appears in the edition.
import * as THREE from '../../../vendor/three.module.min.js';
import { makeActor } from '../../world/Actors.js';
import { heroLook } from '../../world/People.js';
import { dress, attach, WARDROBE } from './wardrobe.js';

const WARDROBE_PROPS = (model, variant) => WARDROBE[model]?.[variant]?.props || [];

// mission -> watcher kind, or per year (the fragments of M18; M22 and M23 quote other places)
const FRAGMENTS = { PRESENT: 'drone', PAST: 'drone', FUTURE: 'scav' };
export const WATCHERS = {
  m02: 'drone', m03: 'drone', m08: 'drone', m12: 'drone',
  m07: 'scavBadge', m14: 'scav', m15: 'scav',
  m09: 'trooper', m10: 'trooper', m13: ['trooper', 'unwritten'],
  m17: 'mimic', m21: 'elite',
  m18: FRAGMENTS, m22: FRAGMENTS, m23: FRAGMENTS,
};
// a person who watches: [model, variant]
export const HUMAN = {
  trooper: ['rb_trooper', 'continuum'], elite: ['rb_trooper', 'elite'],
  scav: ['rb_scav', 'grey'], scavBadge: ['rb_scav', 'lantern'], unwritten: ['rb_scav', 'unwritten'],
};
export const kindsOf = (mkey) => {
  const w = WATCHERS[mkey];
  return !w ? [] : typeof w === 'string' ? [w] : Array.isArray(w) ? w : [...new Set(Object.values(w))];
};
export const watcherModels = (mkey) => [...new Set(kindsOf(mkey).map((k) => HUMAN[k]?.[0]).filter(Boolean))];

// --- the Helix security drone -----------------------------------------------------------------------
let droneKit = null;
function kit() {
  if (droneKit) return droneKit;
  const keep = (x) => { x.userData.keep = true; return x; };
  droneKit = {
    shell: keep(new THREE.MeshStandardMaterial({ color: 0xeef2f6, roughness: 0.32, metalness: 0.15 })),
    dark: keep(new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.45, metalness: 0.5 })),
    armour: keep(new THREE.MeshStandardMaterial({ color: 0x5a636e, roughness: 0.5, metalness: 0.6 })),
    body: keep(new THREE.SphereGeometry(0.34, 20, 14)),
    ring: keep(new THREE.TorusGeometry(0.42, 0.035, 8, 28)),
    rotor: keep(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 14)),
    arm: keep(new THREE.BoxGeometry(0.5, 0.03, 0.05)),
    lens: keep(new THREE.CircleGeometry(0.09, 16)),
    plate: keep(new THREE.BoxGeometry(0.5, 0.12, 0.3)),
  };
  return droneKit;
}
function makeDrone(heavy) {
  const K = kit();
  const g = new THREE.Group();
  const add = (geo, mat, x, y, z, rx = 0, ry = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, 0);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  const s = heavy ? 1.3 : 1;
  const body = add(K.body, heavy ? K.armour : K.shell, 0, 0, 0);
  body.scale.set(1.15 * s, 0.62 * s, 1 * s);
  add(K.ring, K.dark, 0, 0, 0, Math.PI / 2).scale.setScalar(s);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    add(K.arm, K.dark, x * 0.24 * s, 0.06, z * 0.2 * s, 0, Math.atan2(z, x));
    add(K.rotor, K.dark, x * 0.42 * s, 0.1, z * 0.36 * s);
  }
  if (heavy) for (const x of [-1, 1]) add(K.plate, K.armour, x * 0.36, -0.08, 0);
  // the eye: a lens on its face (-Z: the way the sentinel looks)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x7fd8ff });
  const eye = new THREE.Mesh(K.lens, eyeMat);
  eye.position.set(0, 0, -0.35 * s);
  eye.rotation.y = Math.PI;
  g.add(eye);
  g.position.y = heavy ? 1.9 : 2.3;
  return { body: g, eyeMat, eyeY: g.position.y, bob: true };
}

// --- the cone: what it sees, along the floor, out to its range ----------------------------------
function makeCone(eyeY, range = 9, fov = 0.75) {
  const len = range, r = Math.tan(fov * 0.6) * range;
  const coneMat = new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true });
  const geo = new THREE.ConeGeometry(r, len, 24, 1, true);
  geo.translate(0, -len / 2, 0);
  const cone = new THREE.Mesh(geo, coneMat);
  cone.rotation.x = Math.PI / 2 - Math.atan2(eyeY * 0.8, range); // tipped down to meet the floor at its range
  cone.position.set(0, eyeY, -0.2);
  return { cone, coneMat };
}

// --- a person who watches ------------------------------------------------------------------------
function makeHuman(kind, seed, renderer, hero) {
  let actor;
  if (kind === 'mimic') {
    // M17: security that mimics Kai: a red hologram of the player's current look
    actor = makeActor({ ...heroLook(hero), hologram: true, glow: 0xff6a48 });
  } else {
    const [model, variant] = HUMAN[kind];
    actor = makeActor({ model, height: 1.8 + ((seed % 5) - 2) * 0.015 });
    // a scavenger watches by lantern light: the lantern is its eye (the variant may carry one already)
    const lantern = model === 'rb_scav' && !WARDROBE_PROPS(model, variant).includes('lantern') ? ['lantern'] : [];
    dress(actor, { model, variant, seed, props: lantern }, { renderer });
  }
  actor.rotation.y = Math.PI; // the sentinel looks along -Z; a person faces +Z
  // the eye: a helmet torch, or the lantern's flame
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x7fd8ff });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(kind === 'trooper' || kind === 'elite' ? 0.028 : 0.05, 10, 8), eyeMat);
  if (kind === 'trooper' || kind === 'elite') attach(actor, 'head', lamp, [0, 0.16, 0.13]);
  else if (kind === 'mimic') attach(actor, 'head', lamp, [0, 0.06, 0.12]);
  else attach(actor, 'handR', lamp, [0, -0.16, 0], true); // a lantern held low
  return { body: actor, eyeMat, eyeY: 1.6, actor };
}

// The kind of one sentinel: the mission's, the sentinel's own (the rewinding unit), alternating sides
export function kindFor(mkey, sd, i, state) {
  const w = WATCHERS[mkey];
  if (sd.conduit) return 'droneHeavy';
  if (!w) return null;
  if (typeof w === 'string') return w;
  if (Array.isArray(w)) return w[i % w.length];
  return w[state] || w.PRESENT;
}

// Swap the Observer inside every sentinel for this mission's watcher(s). A sentinel whose kind changes
// with the year carries both bodies and shows the one for its room's year.
export class Watchers {
  constructor(rt) {
    this.rt = rt;
    this.list = [];
  }

  mount(deckWorld, mkey, { renderer, hero, stateOf }) {
    this.list = [];
    (deckWorld.sentinels || []).forEach((s, i) => {
      const g = s.model;
      // the Observer goes: its parts were made for it alone
      for (const c of [...g.children]) {
        g.remove(c);
        c.traverse((o) => { o.geometry?.dispose(); if (o.material && !Array.isArray(o.material)) o.material.dispose(); });
      }
      g.scale.setScalar(1);
      const w = WATCHERS[mkey];
      const kinds = s.def.conduit ? ['droneHeavy'] : w && typeof w === 'object' && !Array.isArray(w) ? [...new Set(Object.values(w))] : [kindFor(mkey, s.def, i) || 'drone'];
      const bodies = {};
      let eyeY = 1.6;
      const eyes = [];
      for (const k of kinds) {
        const b = k === 'drone' || k === 'droneHeavy' ? makeDrone(k === 'droneHeavy') : makeHuman(k, i * 7 + 3, renderer, hero);
        g.add(b.body);
        bodies[k] = b;
        eyes.push(b.eyeMat);
        eyeY = Math.max(eyeY, b.eyeY);
      }
      const { cone, coneMat } = makeCone(Math.min(eyeY, 2.2), s.def.range || 9, s.def.fov || 0.75);
      g.add(cone);
      // DeckWorld colours the eye and the cone: every body's eye follows the first
      const eyeMat = eyes[0];
      for (const e of eyes.slice(1)) e.color = eyeMat.color;
      g.userData = { eyeMat, coneMat, legs: [], arms: [], head: null, lvWatcher: true };
      const rec = { s, g, bodies, kinds, last: g.position.clone(), speed: 0, t: Math.random() * 6, mkey, byYear: w && typeof w === 'object' && !Array.isArray(w) ? w : null, stateOf };
      this.show(rec);
      this.list.push(rec);
    });
    return this.list.length;
  }

  show(rec) {
    const state = rec.stateOf?.(rec.s.def.room);
    const want = rec.byYear ? rec.byYear[state] || rec.byYear.PRESENT : rec.kinds[0];
    for (const [k, b] of Object.entries(rec.bodies)) b.body.visible = k === want;
    rec.current = rec.bodies[want] || Object.values(rec.bodies)[0];
  }

  // each frame: the year's body, a person's walk from how far the sentinel moved, a drone's hover
  update(dt) {
    for (const rec of this.list) {
      if (rec.byYear) this.show(rec);
      const g = rec.g;
      if (!g.visible) continue;
      const d = g.position.distanceTo(rec.last);
      rec.last.copy(g.position);
      rec.speed += (Math.min(6, d / Math.max(dt, 1e-3)) - rec.speed) * Math.min(1, dt * 8);
      rec.t += dt;
      const b = rec.current;
      if (b?.actor) b.actor.userData.animate?.(dt, rec.speed, rec.t);
      else if (b?.bob) b.body.position.y = b.eyeY + Math.sin(rec.t * 2.1) * 0.06;
    }
  }

  dispose() {
    this.list = [];
  }
}
