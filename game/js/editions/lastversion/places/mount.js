// THE LAST VERSION OF EARTH: a place, mounted in the browser after DeckWorld has built its level
// (Runtime.onSectorLoaded). Everything goes into deckWorld.root, so it leaves with the level:
//   - the scenery (Scenery.js), the sky (Sky.js) and the horizon (Horizon.js)
//   - DeckWorld's own meshes for the place's conditional colliders (`ghost`) are taken away (the
//     scenery draws those pieces per year), and doors, gates and the train wear place materials
//   - records, fragments and scene props become kits of the place (kits.js), never terminals or crystals
//   - a hazard with a kit (the clockmaker's brass arm) wears it; one that is still in a year (`stillIn`)
//     holds still there
//   - deep water (level.drowns) takes Kai back to the last checkpoint
import * as THREE from '../../../../vendor/three.module.min.js';
import { compileCondition } from '../../../core/conditions.js';
import { Scenery } from './Scenery.js';
import { Sky } from './Sky.js';
import { Horizon } from './Horizon.js';
import { makeKit, makeGlint } from './kits.js';
import { namedMaterial, setLit } from './materials.js';
import { underWater } from './Place.js';

// how far above the ground a kind of interactable floats (Place.stageBeat, fragments)
const KIND_Y = { terminal: 1.15, plaque: 1.6, fragment: 1.1, scene: 1.3 };

export function mountPlace(rt) {
  const g = rt.g, level = rt.level, dw = g.deckWorld, root = dw.root;
  if (!level?.place || !root) return null;
  const rid = level.outdoorRoom;
  const ctx = () => dw.ctx(rid);
  const scenery = new Scenery(level, root, ctx);
  const sky = new Sky(root, level);
  const horizon = new Horizon(root, level);
  // the first switch into each year neither paints its horizon nor fetches and filters its light probe on its frame:
  // every year's band is painted and uploaded now, and every year's probe is on its way (a probe not yet asked
  // for is asked for, and the one in use asked for again, so the scene keeps its light meanwhile)
  horizon.prepare(g.renderer);
  const pf = g.postfx;
  if (pf?.q?.env) {
    const want = pf.envName, k = pf.envIntensity;
    const fresh = [...new Set(Object.values(level.years).map((y) => y.ibl).filter((n) => n && n !== want && !pf.skies?.[n] && !pf.loading?.has(n)))];
    for (const n of fresh) pf.setEnvironment(n, k);
    if (fresh.length) pf.setEnvironment(want, k);
  }
  // DeckWorld's meshes: the place's own conditional pieces are drawn by the scenery
  for (const d of dw.dynamic) {
    if (d.el.ghost) {
      root.remove(d.mesh);
      d.mesh.geometry?.dispose();
      d.mesh = new THREE.Object3D();
    } else if (d.el.lvMat) d.mesh.material = namedMaterial(d.el.lvMat);
  }
  // the records, fragments and scene props, as things of this place
  for (const it of level.interactables) {
    if (!it.kit) continue;
    const y0 = it.ground ?? it.pos[1] - (KIND_Y[it.kind] ?? 1.2);
    const p = dw.props[it.id];
    const kit = makeKit(it.kit);
    kit.position.set(it.pos[0], y0, it.pos[2]);
    kit.rotation.y = it.yaw || 0;
    if (it.kind === 'terminal' && p) {
      p.clear();
      p.position.copy(kit.position);
      p.rotation.y = kit.rotation.y;
      kit.position.set(0, 0, 0);
      kit.rotation.y = 0;
      p.add(kit);
      continue;
    }
    root.add(kit);
    if (p && !it.model) {
      // the crystal or the gem goes; a faint glint marks what is still to read
      p.clear();
      const glint = makeGlint(it.kind === 'fragment' ? 0xffe2b0 : 0xffd27a);
      glint.position.y = 0.2;
      p.add(glint);
      p.userData.gem = glint.children[0];
    }
  }
  for (const h of dw.hazards) {
    if (!h.hz.lvKit) continue;
    h.g.clear();
    h.g.add(makeKit(h.hz.lvKit, h.hz.radius));
  }
  const drowns = (level.drowns || []).map((d) => ({ ...d, cond: d.when ? compileCondition(d.when) : null }));
  let state = null;
  const api = {
    scenery, sky, horizon,
    // a year: the scenery's groups, the sky's preset (eased unless instant), the horizon's panorama, the lit windows
    setYear(s, instant = false) {
      const y = level.years[s] || Object.values(level.years)[0];
      if (!y) return;
      state = s;
      scenery.setEra(s);
      sky.setYear(y, instant);
      horizon.setYear(s, y);
      setLit(y.lit ?? 0);
      // a model that has a form per year (the Chronolith: the black ring, broken into a halo by 2196)
      for (const p of Object.values(dw.props)) p.traverse((o) => o.userData.setEra?.(s));
    },
    setEra(s) {
      api.setYear(s);
    },
    refresh() {
      scenery.refresh();
    },
    update(dt) {
      const cam = g.camera;
      sky.update(dt, cam, { time: g.time || 0, flash: g.weather?.flash || 0, ctx: ctx() });
      horizon.update(cam);
      scenery.update(dt, cam);
      // a hazard still in this year (the arm rusted solid in 2196) does not move
      for (const h of dw.hazards) if (h.hz.stillIn && h.hz.stillIn === state) h.stasisT = 0.25;
      // deep water: the current takes Kai back to the last anchor. An anchor under the same water (M5's village gate
      // and low bank while FLOODED) would take him straight back in, a setback every frame: then the place goes back,
      // in the fade, to a year that leaves the anchor dry (the mission's own first, as a snap back does)
      if (!g.catching && drowns.length) {
        const p = g.player.pos, c = ctx();
        if (underWater(drowns, [p.x, p.y, p.z], c)) {
          const cp = g.checkpoint;
          const dry = cp && underWater(drowns, cp, c) ? [rt.home(), ...g.engine.statesOf(rid)].find((s) => !underWater(drowns, cp, { ...c, state: s })) : null;
          g.deckSetback('fall');
          if (dry) {
            setTimeout(() => {
              if (rt.level !== level || g.engine.state(rid) === dry) return;
              g.engine.setState(rid, dry, { force: true });
              dw.refresh();
            }, 340); // (main.js puts him back at 350 ms)
          }
        }
      }
    },
    stats() {
      return scenery.stats();
    },
    dispose() {
      sky.dispose();
      horizon.dispose();
      scenery.dispose();
    },
  };
  return api;
}
