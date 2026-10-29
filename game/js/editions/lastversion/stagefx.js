// THE LAST VERSION OF EARTH: effects for staged moments, what their narration says happens, drawn (playtest v2.1 FT-06 and
// F05: "The 41 comes in at full speed", "The ring comes apart in rings of light", "The sky breaks into panes", "He steps into
// the ring" were captions over the game's camera). Each is { obj, update(dt) -> false once it is over, dispose() } for
// Cinema.addFx: unlit light that reads at any quality (or the place's own materials), a few draw calls each, and nothing
// left behind once it is over.
// Comfort mode (Cinema.addFx sets fx.calm): no flare and no muzzle flash, nothing that lights up at once (v2.1.1 playtest
// M3); what grows and fades over seconds (rings, panes, a column of light) stays.
import * as THREE from '../../../vendor/three.module.min.js';
import { namedMaterial } from './places/materials.js';

const glow = (color, opacity = 1, o = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: o.normal ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: o.fog ?? true });
const ease = (x) => x * x * (3 - 2 * x);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function owned(obj) {
  return () => obj.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose?.();
  });
}

// Ending A: the ring comes apart in rings of light. First the ring itself turns to light (a bright ring over the black one,
// growing in), then ring after ring of light leaves it, widening and thinning as they go; the last fades as the morning
// comes. center: the ring's centre; R: its radius; facing: the axis it faces ('z' or 'x')
export function ringsOfLight({ center, R = 5, n = 7, color = 0xe8dcff, facing = 'z', delay = 0, every = 0.42, life = 3.6 }) {
  const root = new THREE.Group();
  root.position.set(center[0], center[1], center[2]);
  if (facing === 'x') root.rotation.y = Math.PI / 2;
  const core = new THREE.Mesh(new THREE.TorusGeometry(R, 0.62, 12, 72), glow(0xffffff, 0));
  root.add(core);
  const rings = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(R, 0.34, 8, 72), glow(i % 2 ? color : 0xffffff, 0));
    m.visible = false;
    root.add(m);
    rings.push({ m, t0: delay + 0.9 + i * every, tilt: (i % 3 - 1) * 0.12 });
  }
  let t = 0;
  const end = delay + 0.9 + n * every + life;
  return {
    obj: root,
    update(dt) {
      t += dt;
      // the ring becomes light, and stays light while rings leave it, then it is gone
      const k = clamp01((t - delay) / 0.9);
      core.material.opacity = ease(k) * (1 - clamp01((t - delay - 0.9 - n * every * 0.7) / 1.4)) * 0.95;
      for (const r of rings) {
        const u = (t - r.t0) / life;
        r.m.visible = u > 0 && u < 1;
        if (!r.m.visible) continue;
        const s = 1 + ease(clamp01(u)) * 7.5;
        r.m.scale.set(s, s, 1);
        r.m.rotation.x = r.tilt * u;
        r.m.material.opacity = (1 - u) * (u < 0.08 ? u / 0.08 : 1) * 0.9;
      }
      return t < end;
    },
    dispose: owned(root),
  };
}

// Ending B: the sky breaks into panes, each a different sky: shards of other skies (painted over this one, not added to
// it: on a pale dawn added light would not show) across the sky beyond the ring, edged with the white of the crack each
// broke along, turning in as they break off and held there; one comes down beside her as a door (paneDoor).
// toward: the bearing (radians, from +x toward +z) the shards gather round, the way the shot looks; spread: their arc
export function skyPanes({ center, n = 14, colors = [0x3a7ad0, 0xff9a50, 0x2a3a90, 0xe8a8c8, 0x8aa84a, 0x9fd0ff, 0xff6a58, 0x5fd0b0], radius = 70, height = 30, seed = 7, life = 30, toward = -Math.PI / 2, spread = 2.4 }) {
  const root = new THREE.Group();
  root.position.set(center[0], center[1], center[2]);
  root.updateMatrixWorld(true);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const panes = [];
  for (let i = 0; i < n; i++) {
    const a = toward + ((i + 0.5) / n - 0.5) * spread + (rnd() - 0.5) * 0.15, r = radius * (0.55 + rnd() * 0.5);
    const w = 18 + rnd() * 22, h = 12 + rnd() * 18;
    const shape = new THREE.Shape();
    // (an irregular four-sided shard, not a rectangle: broken, not tiled)
    shape.moveTo(-w / 2 + rnd() * 4, -h / 2);
    shape.lineTo(w / 2, -h / 2 + rnd() * 5);
    shape.lineTo(w / 2 - rnd() * 6, h / 2);
    shape.lineTo(-w / 2, h / 2 - rnd() * 4);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), glow(colors[i % colors.length], 0, { fog: false, normal: true }));
    m.position.set(Math.cos(a) * r, height + rnd() * 26, Math.sin(a) * r);
    m.lookAt(center[0], center[1], center[2]); // (a world point: each pane faces the hill)
    m.renderOrder = 2;
    // a bright edge round each pane, the crack it broke along
    const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(shape.getPoints()), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    m.add(edge);
    root.add(m);
    panes.push({ m, edge, t0: 0.35 + i * 0.16 + rnd() * 0.3, spin: (rnd() - 0.5) * 0.5 });
  }
  let t = 0;
  return {
    obj: root,
    update(dt) {
      t += dt;
      for (const p of panes) {
        const u = clamp01((t - p.t0) / 0.8);
        p.m.material.opacity = ease(u) * 0.62 * (1 - clamp01((t - life + 2) / 2));
        p.edge.material.opacity = (u > 0 ? Math.max(0.25, 1 - (t - p.t0) * 0.6) : 0) * (1 - clamp01((t - life + 2) / 2));
        p.m.rotateZ(p.spin * dt * (1 - u * 0.8));
      }
      return t < life;
    },
    dispose: owned(root),
  };
}

// a pane of another sky standing on the ground: a door of light someone walks into (Ending B: Mira's)
export function paneDoor({ at, yaw = 0, color = 0xffa060, w = 1.7, h = 2.9, life = 12 }) {
  const root = new THREE.Group();
  root.position.set(at[0], at[1], at[2]);
  root.rotation.y = yaw;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0), glow(color, 0));
  const edge = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.24, h + 0.24).translate(0, h / 2, -0.01), glow(0xffffff, 0));
  root.add(edge, face);
  let t = 0;
  return {
    obj: root,
    update(dt) {
      t += dt;
      const k = ease(clamp01(t / 1.2)) * (1 - clamp01((t - life + 1.5) / 1.5));
      face.material.opacity = k * 0.75;
      edge.material.opacity = k * 0.35;
      return t < life;
    },
    dispose: owned(root),
  };
}

// Ending C: he steps into the ring and becomes its anchor: the ring fills with light from its rim inward, flares as he
// reaches it, and settles into a steady glow
export function anchorLight({ center, R = 4.4, facing = 'z', grow = 2.4, life = 30 }) {
  const root = new THREE.Group();
  root.position.set(center[0], center[1], center[2]);
  if (facing === 'x') root.rotation.y = Math.PI / 2;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 64), glow(0xfff0d8, 0));
  const halo = new THREE.Mesh(new THREE.RingGeometry(R * 0.92, R * 1.45, 64), glow(0xd8c8ff, 0));
  root.add(disc, halo);
  let t = 0;
  return {
    obj: root,
    flare: 0,
    update(dt) {
      t += dt;
      this.flare = this.calm ? 0 : Math.max(0, this.flare - dt * 0.8);
      const k = ease(clamp01(t / grow));
      disc.material.opacity = Math.min(1, k * 0.55 + this.flare * 0.6);
      disc.scale.setScalar(0.2 + 0.8 * k + this.flare * 0.08);
      halo.material.opacity = k * 0.35 + this.flare * 0.5;
      halo.scale.setScalar(1 + this.flare * 0.5);
      return t < life;
    },
    dispose: owned(root),
  };
}

// someone who is not there any more: a column of light where they stood, rising and thinning (Ending C: the Witness)
export function goneLight({ at, h = 3.2, life = 2.6, color = 0xe8dcff }) {
  const root = new THREE.Group();
  root.position.set(at[0], at[1], at[2]);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, h, 16, 1, true).translate(0, h / 2, 0), glow(color, 0));
  root.add(col);
  let t = 0;
  return {
    obj: root,
    update(dt) {
      t += dt;
      const u = clamp01(t / life);
      col.material.opacity = Math.sin(u * Math.PI) * 0.8;
      col.scale.set(1 - u * 0.75, 1 + u * 1.4, 1 - u * 0.75);
      return t < life;
    },
    dispose: owned(root),
  };
}

// Mission 1's Zero Second: the 41 coming in at full speed along its track, three carriages in the line's livery, until
// stop() (the impact: the wreck takes its place, prologue.js). from: the lead carriage's nose [x, y, z] (y its floor
// under the wheels), dir: +1 or -1 along x, speed in m/s
export function trainRush({ from, dir = -1, speed = 34, len = 17, gap = 0.9, w = 3.8, h = 3.4, life = 6 }) {
  const root = new THREE.Group();
  root.position.set(from[0], from[1], from[2]);
  const mats = ['trainBody', 'carGlass', 'containerOrange', 'roofDark'].map((m) => namedMaterial(m));
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const add = (m, sx, sy, sz, x, y, z) => {
    const b = new THREE.Mesh(geo, m);
    b.scale.set(sx, sy, sz);
    b.position.set(x, y, z);
    root.add(b);
  };
  for (let i = 0; i < 3; i++) {
    const cx = -dir * (len / 2 + i * (len + gap)); // (the lead carriage first, the others behind it)
    add(mats[0], len, h, w, cx, h / 2, 0);
    add(mats[1], len - 1, h * 0.3, w + 0.06, cx, h * 0.65, 0);
    add(mats[2], len - 0.2, h * 0.07, w + 0.08, cx, h * 0.415, 0);
    add(mats[3], len + 0.16, 0.16, w + 0.16, cx, h + 0.08, 0);
  }
  // its headlights, on the lead carriage's nose
  const lamp = new THREE.MeshBasicMaterial({ color: 0xfff2d8 });
  for (const z of [-1.1, 1.1]) {
    const l = new THREE.Mesh(geo, lamp);
    l.scale.set(0.08, 0.3, 0.5);
    l.position.set(dir * 0.04, h * 0.3, z);
    root.add(l);
  }
  let t = 0;
  const fx = {
    obj: root,
    stopped: false,
    stop() { this.stopped = true; },
    update(dt) {
      t += dt;
      root.position.x += dir * speed * dt;
      return !this.stopped && t < life;
    },
    dispose() { geo.dispose(); lamp.dispose(); }, // (the place's materials are shared: namedMaterial keeps them)
  };
  return fx;
}

// Mission 13: a shell held in flight climbs back where it came from: a burning head with a trail of light, along an arc
// from where it fell to the gun that fired it (from, to: [x, y, z]; apex: the arc's height over the higher end), over
// dur seconds after delay; then a flash at the muzzle. pos(t) is where the head is at t (the camera's rig follows it)
export function shellHome({ from, to, apex = 30, dur = 3.2, delay = 0.35, color = 0xffd27a, size = 0.55 }) {
  const root = new THREE.Group();
  const geo = new THREE.SphereGeometry(1, 12, 8);
  const head = new THREE.Mesh(geo, glow(0xfff4d8, 1, { fog: false }));
  head.scale.setScalar(size);
  root.add(head);
  const halo = new THREE.Mesh(geo, glow(color, 0.45, { fog: false }));
  halo.scale.setScalar(size * 2.6);
  root.add(halo);
  const trail = [];
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(geo, glow(color, 0.5 * (1 - i / 16), { fog: false }));
    m.scale.setScalar(size * (1 - i / 20));
    root.add(m);
    trail.push(m);
  }
  const flash = new THREE.Mesh(geo, glow(0xffe8b0, 0, { fog: false }));
  flash.position.set(...to);
  root.add(flash);
  const top = Math.max(from[1], to[1]) + apex;
  const at = (u, out = [0, 0, 0]) => {
    u = clamp01(u);
    // a quadratic arc through a control point over the middle, high enough that its top is at `top`
    const cy = 2 * top - (from[1] + to[1]) / 2;
    for (let i = 0; i < 3; i++) {
      const c = i === 1 ? cy : (from[i] + to[i]) / 2;
      out[i] = (1 - u) * (1 - u) * from[i] + 2 * (1 - u) * u * c + u * u * to[i];
    }
    return out;
  };
  let t = 0;
  const p = [0, 0, 0];
  return {
    obj: root,
    pos: (tt = t) => at((tt - delay) / dur),
    end: delay + dur,
    update(dt) {
      t += dt;
      const u = (t - delay) / dur;
      const flying = u > 0 && u < 1;
      head.visible = halo.visible = flying;
      at(u, p);
      head.position.set(...p);
      halo.position.set(...p);
      trail.forEach((m, i) => {
        const ui = u - (i + 1) * 0.018;
        m.visible = flying && ui > 0;
        if (m.visible) m.position.set(...at(ui));
      });
      const f = t - delay - dur;
      flash.material.opacity = f > 0 && f < 0.9 && !this.calm ? (1 - f / 0.9) * 0.9 : 0;
      flash.scale.setScalar(1.5 + Math.max(0, f) * 5);
      return t < delay + dur + 1.2;
    },
    dispose: owned(root),
  };
}

// people posed where the story put them (playtest v2.1 FT-06, F07): a hand-placed person's `pose` (DeckWorld places
// people standing, and turns the ones you can talk to toward Kai). Called every step by the mission that places them;
// they are frozen (freezeWhen), so the pose the game gave them holds, and this places their body:
//   pinned  on their back, face up, feet at their spot (yaw: the way their head lies)
//   caught  on their knees (the shins through the floor, out of sight), leaning away from what holds them
//   kneel   on one knee to the floor, bent over it (tying a shoe)
export function posePeople(g) {
  for (const n of g.deckWorld?.npcs || []) {
    const kind = n.n.pose;
    if (!kind || !n.model?.visible) continue;
    const m = n.model, p = n.n.pos, yaw = n.n.yaw ?? 0;
    m.rotation.order = 'YXZ';
    if (kind === 'pinned') {
      m.rotation.set(-Math.PI / 2, yaw, 0.12);
      m.position.set(p[0], p[1] + 0.14, p[2]);
    } else if (kind === 'caught') {
      m.rotation.set(0.3, yaw, 0.06);
      m.position.set(p[0], p[1] - 0.5, p[2]);
    } else if (kind === 'kneel') {
      m.rotation.set(0.5, yaw, -0.05);
      m.position.set(p[0], p[1] - 0.46, p[2]);
    }
  }
}
