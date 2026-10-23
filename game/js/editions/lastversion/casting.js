// THE LAST VERSION OF EARTH: who is built from which model (OVERHAUL.md §6.2, §6.5, §6.6).
//
// The edition's own people (31 Microsoft Rocketbox avatars converted by tools/rocketbox-to-glb.mjs
// --edition lastversion) are registered into Actors' MODELS when the runtime is built, after main.js
// has made its preload list, so they load lazily: each chapter loads the models it needs behind its
// chapter card (CHAPTER_CAST), one at a time so that no frame waits for more than one of them.
// Actors keeps a model once loaded (it has no release), so a chapter's models stay for the session.
import { MODELS, loadActors, actorLoaded, makeActor } from '../../world/Actors.js';
import { dress, afterPose } from './wardrobe.js';

// the 37 new people: named characters at 1024 px, crowds at 512 px (tools/rocketbox-to-glb.mjs LV_AVATARS)
// sex: the model's, for pronouns; child: a child's body; px: the size of its colour maps
const rb = (height, sex, o = {}) => ({ rig: 'rb', height, sex, px: 1024, ...o });
export const LV_MODELS = {
  // named (20)
  rb_child_m: rb(1.42, 'm', { child: true }),
  rb_mira: rb(1.68, 'f'),
  rb_child_f: rb(1.24, 'f', { child: true }),
  rb_rook: rb(1.8, 'm'),
  rb_niko: rb(1.76, 'm'),
  rb_jun: rb(1.74, 'm'),
  rb_tala: rb(1.66, 'f'),
  rb_security_f: rb(1.7, 'f'),
  rb_security_m: rb(1.8, 'm'),
  rb_elder: rb(1.6, 'f'),
  rb_ezra: rb(1.74, 'm'),
  rb_engineer_f: rb(1.7, 'f'),
  rb_soldier_m: rb(1.8, 'm'),
  rb_odile: rb(1.66, 'f'),
  rb_florist: rb(1.64, 'f'),
  rb_warden: rb(1.8, 'm'),
  // (U4 review) the named who wore Station Zero's faces (Juno's, Varga's, Kade's, Ren's FIELD JACKET) have their own
  rb_sera: rb(1.7, 'f'),
  rb_mara: rb(1.68, 'f'),
  rb_iven: rb(1.8, 'm'),
  rb_gardener_f: rb(1.68, 'f'),
  // crowd (17)
  rb_civ_f1: rb(1.66, 'f', { px: 512, crowd: true }),
  rb_civ_f2: rb(1.67, 'f', { px: 512, crowd: true }),
  rb_civ_f3: rb(1.66, 'f', { px: 512, crowd: true }),
  rb_civ_m1: rb(1.79, 'm', { px: 512, crowd: true }),
  rb_civ_m2: rb(1.75, 'm', { px: 512, crowd: true }),
  rb_courier: rb(1.78, 'm', { px: 512, crowd: true }),
  rb_contractor: rb(1.8, 'm', { px: 512, crowd: true }),
  rb_medic_f: rb(1.68, 'f', { px: 512, crowd: true }),
  rb_child_m2: rb(1.32, 'm', { px: 512, crowd: true, child: true }),
  rb_child_f2: rb(1.3, 'f', { px: 512, crowd: true, child: true }),
  rb_trooper: rb(1.82, 'm', { px: 512, crowd: true }),
  rb_robe_m: rb(1.76, 'm', { px: 512, crowd: true }),
  rb_scav: rb(1.78, 'm', { px: 512, crowd: true }),
  rb_trader: rb(1.78, 'm', { px: 512, crowd: true }),
  rb_villager_f: rb(1.66, 'f', { px: 512, crowd: true }),
  // (U4 review) more faces for 2026/2049's crowds
  rb_civ_m3: rb(1.78, 'm', { px: 512, crowd: true }),
  rb_civ_f4: rb(1.68, 'f', { px: 512, crowd: true }),
};
for (const [k, m] of Object.entries(LV_MODELS)) m.file = `${k}.glb`;

// the models Station Zero already has that the edition uses (none of its named crew's faces: U4 review)
export const SHARED_MODELS = {
  xbot: { sex: 'n', file: 'Xbot.glb' }, // the motion library (and Orren's hologram)
  rb_ren_m: { sex: 'm', file: 'rb_ren_m.glb', px: 1024 }, // Kai (and the Witness)
  rb_doctor_f: { sex: 'f', file: 'rb_doctor_f.glb', px: 1024 }, // Dr. Anja Vale
  rb_doctor_m: { sex: 'm', file: 'rb_doctor_m.glb', px: 1024, crowd: true, height: 1.78 }, // Helix researchers, hospital staff
};

export const sexOf = (key) => LV_MODELS[key]?.sex || SHARED_MODELS[key]?.sex || null;
export const isChild = (key) => !!LV_MODELS[key]?.child;
export const pxOf = (key) => LV_MODELS[key]?.px || SHARED_MODELS[key]?.px || 512;

// The edition's model manifest: the only character files the edition's APK and preview carry
// (android/build-apk.sh with EDITION=lastversion reads this list).
export const MANIFEST = [...new Set([...Object.values(SHARED_MODELS).map((m) => m.file), ...Object.values(LV_MODELS).map((m) => m.file)])];

// Which models each chapter needs: its named people, its crowds' tables, its watchers. Kai (rb_ren_m)
// and the motion library are always loaded. (tests/lastversion.test.mjs checks these against every
// person every level of the chapter builds.)
export const COMMON = ['xbot', 'rb_ren_m'];
// (exactly the models the chapter's levels cast today; the story units add the people they place)
export const CHAPTER_CAST = {
  prologue: ['rb_civ_m3', 'rb_civ_f4', 'rb_child_m2', 'rb_florist', 'rb_security_f', 'rb_jun', 'rb_civ_f1', 'rb_courier', 'rb_child_f', 'rb_mira', 'rb_civ_m2', 'rb_civ_m1', 'rb_civ_f2', 'rb_contractor', 'rb_medic_f', 'rb_iven', 'rb_rook', 'rb_security_m'],
  act1: ['rb_civ_m3', 'rb_civ_f4', 'rb_tala', 'rb_child_f2', 'rb_robe_m', 'rb_elder', 'rb_niko', 'rb_civ_f1', 'rb_civ_m2', 'rb_courier', 'rb_civ_f2', 'rb_civ_m1', 'rb_ezra', 'rb_scav', 'rb_contractor', 'rb_mira', 'rb_doctor_m', 'rb_rook', 'rb_security_f', 'rb_security_m', 'rb_iven'],
  act2: ['rb_civ_m3', 'rb_civ_f4', 'rb_trooper', 'rb_courier', 'rb_civ_f2', 'rb_civ_m1', 'rb_civ_f1', 'rb_civ_m2', 'rb_medic_f', 'rb_contractor', 'rb_engineer_f', 'rb_sera', 'rb_doctor_m', 'rb_odile', 'rb_mira', 'rb_scav', 'rb_trader', 'rb_soldier_m', 'rb_child_f', 'rb_child_m', 'rb_rook', 'rb_security_f', 'rb_security_m'],
  act3: ['rb_civ_m3', 'rb_civ_f4', 'rb_scav', 'rb_villager_f', 'rb_civ_f3', 'rb_civ_m2', 'rb_civ_f1', 'rb_civ_m1', 'rb_civ_f2', 'rb_courier', 'rb_contractor', 'rb_sera', 'rb_child_m2', 'rb_child_f2', 'rb_trader', 'rb_doctor_f', 'rb_mara', 'rb_doctor_m', 'rb_mira', 'rb_gardener_f', 'rb_warden', 'rb_jun', 'rb_child_m', 'rb_child_f', 'rb_iven'],
  act4: ['rb_civ_m3', 'rb_civ_f4', 'rb_civ_m2', 'rb_courier', 'rb_civ_f2', 'rb_mira', 'rb_civ_m1', 'rb_civ_f1', 'rb_trader', 'rb_villager_f', 'rb_civ_f3', 'rb_child_m2', 'rb_trooper', 'rb_scav', 'rb_child_f2', 'rb_robe_m', 'rb_child_f', 'rb_child_m', 'rb_sera', 'rb_doctor_f', 'rb_iven', 'rb_rook', 'rb_security_f', 'rb_ezra', 'rb_odile', 'rb_elder'],
  finale: ['rb_civ_m3', 'rb_civ_f4', 'rb_scav', 'rb_civ_m1', 'rb_civ_f2', 'rb_courier', 'rb_civ_m2', 'rb_elder', 'rb_civ_f3', 'rb_trader', 'rb_villager_f', 'rb_robe_m', 'rb_mira', 'rb_child_f2', 'rb_jun', 'rb_tala', 'rb_ezra', 'rb_odile', 'rb_iven', 'rb_sera', 'rb_doctor_f'],
  cases: ['rb_civ_m3', 'rb_civ_f4', 'rb_child_f2', 'rb_robe_m', 'rb_elder', 'rb_tala', 'rb_trader', 'rb_villager_f', 'rb_scav', 'rb_civ_f3', 'rb_child_m2', 'rb_courier', 'rb_civ_m2', 'rb_civ_f1', 'rb_civ_m1', 'rb_civ_f2', 'rb_mara', 'rb_florist', 'rb_security_f', 'rb_jun', 'rb_child_f', 'rb_mira', 'rb_contractor', 'rb_medic_f', 'rb_doctor_f', 'rb_warden', 'rb_doctor_m', 'rb_sera', 'rb_iven', 'rb_ezra', 'rb_soldier_m', 'rb_gardener_f', 'rb_odile', 'rb_child_m', 'rb_niko'],
};
for (const k of Object.keys(CHAPTER_CAST)) CHAPTER_CAST[k] = [...new Set(CHAPTER_CAST[k])];
export const castOf = (chapter) => [...new Set([...COMMON, ...(CHAPTER_CAST[chapter] || [])])];

// the edition's people into Actors' model table (once: the runtime is built after main.js's preload list)
export function registerModels(table = MODELS) {
  for (const [k, m] of Object.entries(LV_MODELS)) if (!table[k]) table[k] = { file: m.file, rig: m.rig, height: m.height };
}

// Load a chapter's models one after another (each one's set-up is one task on the main thread; a
// frame is let through between two), resolving when all have arrived (true) or some could not (false).
const waitFrame = () => new Promise((r) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => setTimeout(r, 0)) : setTimeout(r, 0)));
const loading = {};
export function loadCast(chapter, { onEach } = {}) {
  if (loading[chapter]) return loading[chapter];
  const keys = castOf(chapter);
  const p = (loading[chapter] = (async () => {
    let ok = true;
    for (const k of keys) {
      if (actorLoaded(k)) continue;
      ok = (await loadActors([k])) && ok;
      onEach?.(k);
      await waitFrame();
    }
    if (!ok) delete loading[chapter]; // the next try fetches what is missing
    return ok;
  })());
  return p;
}
export const castReady = (chapter) => castOf(chapter).every((k) => actorLoaded(k) || !MODELS[k]);

// --- dressing and the animation budget (§4.7: at most 16 people animated at full rate; still beyond) ---
export const LOD = { full: 16, near: 40, far: 70, slow: 0.25 };

// People.setCrewDresser(makeDresser(...)): everyone the edition builds is dressed, then posed through
// a gate that keeps the nearest people at full rate, the rest a few times a second, the far ones still
// A person whose own model has not arrived (a load that failed or is still coming after the chapter's wait) is not
// put in somebody else's body (People's fallback would make Officer Pryce a doctor again): they are a plain hologram
// stand-in of their height until the next place is built.
export function makeDresser(renderer) {
  return (actor, crew, o = {}) => {
    const want = crew?.model;
    if (want && want !== 'xbot' && MODELS[want] && actor.userData.spec?.model !== want) {
      actor.traverse((x) => { if (x.userData.ownGeometry) x.geometry.dispose(); });
      actor = makeActor({ model: 'xbot', hologram: true, glow: o.glow || 0x8fe0ff, height: crew.height || actor.userData.spec?.height });
      actor.userData.standIn = want;
    }
    dress(actor, crew, { renderer: renderer(), px: pxOf });
    gate(actor);
    return actor;
  };
}
export function gate(actor) {
  const U = actor.userData;
  if (U.lvGate || !U.animate) return actor;
  const pose = U.animate;
  let acc = Math.random() * LOD.slow; // (staggered, so the slow ones do not all pose on one frame)
  U.lvGate = true;
  U.lodTier = 0;
  U.animate = (dt, speed, t, air) => {
    acc += dt;
    if (U.lodTier === 2 || (U.lodTier === 1 && acc < LOD.slow)) return;
    pose(Math.min(acc, 0.3), speed, t, air);
    acc = 0;
    afterPose(actor);
  };
  return actor;
}

// rank the people of a place by distance each frame: the nearest LOD.full within LOD.near pose every
// frame, the rest within LOD.far a few times a second, anyone farther holds their pose
// (each frame, with no allocation: the people's models and distances in buffers kept between frames, ranked by an
// insertion sort, which a place's at most two dozen people, nearly in last frame's order, make cheap)
const _m = [], _d = [];
export function lodUpdate(people, at) {
  let n = 0;
  for (let i = 0; i < people.length; i++) {
    const m = people[i].model;
    if (!m?.visible || !m.userData.lvGate) continue;
    const e = m.matrixWorld.elements; // (last frame's)
    const d2 = (e[12] - at.x) ** 2 + (e[13] - at.y) ** 2 + (e[14] - at.z) ** 2;
    let j = n++;
    while (j > 0 && _d[j - 1] > d2) {
      _d[j] = _d[j - 1];
      _m[j] = _m[j - 1];
      j--;
    }
    _d[j] = d2;
    _m[j] = m;
  }
  let full = 0;
  for (let i = 0; i < n; i++) {
    const m = _m[i], d = Math.sqrt(_d[i]);
    m.userData.lodTier = d < LOD.near && full < LOD.full ? 0 : d < LOD.far ? 1 : 2;
    if (m.userData.lodTier === 0) full++;
    _m[i] = null;
  }
  return full;
}
