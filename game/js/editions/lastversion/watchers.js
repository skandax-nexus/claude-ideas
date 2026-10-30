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

// mission -> watcher kind, or per year (the fragments of M18; the Finale quotes other places, and keeps the ones the
// passengers of the 41 clear from its opening streets: finale.js adjust; M22 has none, §6.4)
const FRAGMENTS = { PRESENT: 'drone', PAST: 'drone', FUTURE: 'scav' };
export const WATCHERS = {
  m02: 'drone', m03: 'drone', m08: 'drone', m12: 'drone',
  m07: 'scavBadge', m14: 'scav', m15: 'scav',
  m09: 'trooper', m10: 'trooper', m13: ['trooper', 'unwritten'],
  m17: 'mimic', m21: 'elite',
  m18: FRAGMENTS, m23: FRAGMENTS,
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

// --- what a watcher sees and reaches, up and down (v2.1.1 playtest M8) ------------------------------------------
// DeckWorld's watcher on the ground (no floor of its own, def.y) is "on Kai's floor" at any height: Mission 12's court
// drone saw Kai on the 2026 gangway 13.5 m over it and caught him there, measuring the catch flat. In the edition a
// watcher sees Kai only within a storey of its own floor, and catches him only within reach of it.
export const SEE_UP = 4, SEE_DOWN = 3, REACH = 2;
// dy: Kai's feet above the watcher's floor
export const inSight = (dy) => dy < SEE_UP && dy > -SEE_DOWN;
export const inReach = (dy) => Math.abs(dy) <= REACH;
const feetOver = (player, s) => player.pos.y - 0.85 - s.pos.y;

// --- walls (v2.1.1 playtest L15) ---------------------------------------------------------------------------------
// DeckWorld moves a watcher straight at its target with no collision: a chase that started at Mission 10's hall door
// went on through the hall's glass and caught Kai inside. In a chase a watcher keeps to the floor it can walk: a step
// into a wall or a pane is not taken (along the wall, if one way is open); the way it chased is kept, and once it gives
// up it walks that way back to where the chase began, then on with its round. (Its round itself is not checked: the
// rounds are laid on open ground, and a prop on one must not stop a patrol for good.)
const BODY = 0.3, LOW = 0.4, TALL = 1.7;
// how far a point is from a collider's footprint (0 inside it)
const gap = (c, x, z) => Math.hypot(Math.max(c.min[0] - x, 0, x - c.max[0]), Math.max(c.min[2] - z, 0, z - c.max[2]));
// does the line from (x0, z0) to (x1, z1) cross a collider's footprint?
function crosses(c, x0, z0, x1, z1, pad = 0) {
  let t0 = 0, t1 = 1;
  for (const [o, d, mn, mx] of [[x0, x1 - x0, c.min[0] - pad, c.max[0] + pad], [z0, z1 - z0, c.min[2] - pad, c.max[2] + pad]]) {
    if (Math.abs(d) < 1e-9) { if (o < mn || o > mx) return false; continue; }
    let ta = (mn - o) / d, tb = (mx - o) / d;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  return true;
}
// does a step from (x0, z0) to (x1, z1), for a body standing on a floor at y, run into one of the colliders
// ({ min, max })? Into one: closer than the body's half width, and closer than it was (a step away or along is free), or
// through it (its body's width round it, from outside that). What it can step over (under 0.4 m) or walk under does not
// hold it
export function blocked(cols, x0, z0, x1, z1, y) {
  if (Math.hypot(x1 - x0, z1 - z0) < 1e-6) return false;
  for (const c of cols) {
    if (c.max[1] <= y + LOW || c.min[1] >= y + TALL) continue;
    const g0 = gap(c, x0, z0), g1 = gap(c, x1, z1);
    if ((g1 < BODY && g1 < g0 - 1e-6) || (g0 > 0 && crosses(c, x0, z0, x1, z1, g0 >= BODY ? BODY : 0))) return true;
  }
  return false;
}

// a catch never chains into another (v2.1.1 playtest H3): while Kai is walked back, and for this long after he is
// back, no watcher sees him; they go on with their rounds
export const GRACE = 2.5;

// The edition's limits on one of DeckWorld's sentinels: sight and catch within reach of its floor, walls in a chase.
// cols(): the colliders standing now
export function limitWatcher(s, cols) {
  if (s.lvLimits) return s;
  s.lvLimits = true;
  if (s.def.y == null) s.onFloor = (player) => inSight(feetOver(player, s));
  const update = s.update;
  const trail = [];
  let back = null;
  const stop = (self) => { self.mode = 'chase'; self.suspicion = 1; return null; };
  s.update = function (dt, t, o) {
    const x0 = this.pos.x, z0 = this.pos.z, y = this.pos.y, was = this.mode;
    let r = update.call(this, dt, t, o);
    const p = o.player.pos;
    // (out of reach, over its head: it stands under him, still on the chase)
    if (r === 'caught' && !inReach(feetOver(o.player, this))) r = stop(this);
    const C = cols?.() || [];
    if (this.mode === 'chase' || r === 'caught') {
      back = null;
      if (was !== 'chase') trail.length = 0;
      const x1 = this.pos.x, z1 = this.pos.z;
      if (blocked(C, x0, z0, x1, z1, y)) {
        // (along the wall, if one way is open; else it stays where it was)
        if (!blocked(C, x0, z0, x1, z0, y)) this.pos.z = z0;
        else if (!blocked(C, x0, z0, x0, z1, y)) this.pos.x = x0;
        else { this.pos.x = x0; this.pos.z = z0; }
        this.model.position.copy(this.pos);
        // (no catch through the wall it did not walk through)
        if (r === 'caught' && Math.hypot(p.x - this.pos.x, p.z - this.pos.z) >= 1.15) r = stop(this);
      }
      if (!trail.length) trail.push([x0, z0]);
      const last = trail[trail.length - 1];
      if (trail.length < 400 && Math.hypot(this.pos.x - last[0], this.pos.z - last[1]) > 1) trail.push([this.pos.x, this.pos.z]);
    }
    if (this.mode !== 'chase' && was === 'chase' && trail.length) {
      back = trail.reverse().slice();
      trail.length = 0;
    }
    if (back && this.mode !== 'chase') {
      // the way it chased, walked back, while the straight way on to its round is shut
      const w = this.lure ? [this.lure.x, this.lure.z] : this.def.path[this.wp];
      while (back.length && Math.hypot(back[0][0] - x0, back[0][1] - z0) < 0.3) back.shift();
      if (!back.length || !w || !blocked(C, x0, z0, w[0], w[1], y)) back = null;
      else {
        const [bx, bz] = back[0], d = Math.hypot(bx - x0, bz - z0), k = Math.min(1, (this.def.speed * dt) / d);
        this.pos.x = x0 + (bx - x0) * k;
        this.pos.z = z0 + (bz - z0) * k;
        this.turnTo(new THREE.Vector3(bx - x0, 0, bz - z0), dt);
        this.sync(0, this.def.speed);
      }
    }
    return r;
  };
  return s;
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
    this.grace = 0;
    (deckWorld.sentinels || []).forEach((s, i) => {
      limitWatcher(s, () => deckWorld.colliders);
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
      // (a rewinding unit is the heavy drone in every year: it carries no other body to change into)
      const byYear = !s.def.conduit && w && typeof w === 'object' && !Array.isArray(w) ? w : null;
      const rec = { s, g, bodies, entries: Object.entries(bodies), kinds, last: g.position.clone(), speed: 0, t: Math.random() * 6, mkey, byYear, stateOf };
      this.show(rec);
      this.list.push(rec);
    });
    return this.list.length;
  }

  show(rec) {
    const state = rec.stateOf?.(rec.s.def.room);
    const want = rec.byYear ? rec.byYear[state] || rec.byYear.PRESENT : rec.kinds[0];
    for (const [k, b] of rec.entries) b.body.visible = k === want;
    rec.current = rec.bodies[want] || rec.entries[0][1];
  }

  // each frame: the year's body, a person's walk from how far the sentinel moved, a drone's hover
  update(dt) {
    // (a catch's grace: while Kai is walked back and GRACE seconds after, nobody sees him, H3)
    const g = this.rt?.g;
    if (g?.catching) this.grace = GRACE;
    else if (this.grace > 0) this.grace -= dt;
    if (g?.catching || this.grace > 0) {
      for (const { s } of this.list) {
        s.suspicion = 0;
        s.lostT = 0;
        if (s.mode === 'chase') s.mode = 'patrol';
      }
    }
    for (const rec of this.list) {
      if (rec.byYear) this.show(rec);
      const g = rec.g;
      if (!g.visible) continue;
      const d = g.position.distanceTo(rec.last);
      rec.last.copy(g.position);
      rec.speed += (Math.min(6, d / Math.max(dt, 1e-3)) - rec.speed) * Math.min(1, dt * 8);
      rec.t += dt;
      const b = rec.current;
      if (b?.actor) {
        // (out of view, body and shadow: not posed; DeckWorld.wake poses them for the time missed as they come into
        // view, before that frame is drawn)
        const U = b.actor.userData;
        if (U.dormant) {
          U.lodDt = Math.min(1, (U.lodDt || 0) + dt);
          U.lodSpeed = rec.speed;
          U.lodT = rec.t;
        } else {
          const late = U.lodDt || 0;
          U.lodDt = 0;
          U.animate?.(dt + late, rec.speed, rec.t);
        }
      }
      else if (b?.bob) b.body.position.y = b.eyeY + Math.sin(rec.t * 2.1) * 0.06;
    }
  }

  dispose() {
    this.list = [];
  }
}
