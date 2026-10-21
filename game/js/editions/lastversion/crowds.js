// THE LAST VERSION OF EARTH: the crowds (OVERHAUL.md §6.1, §6.3).
//
// Every place lays out crowd paths (level.crowd: { era, years, region, role, path, n, y?, when?, echo? }).
// castLevel() turns them into people who walk those paths, by the era's wardrobe table and the role,
// and gives the level its cast: the named people (with this mission's variants) plus everyone in its
// crowds (story.cast = CAST.concat(levelCast), CAST's indices unchanged). Rules:
//   - a named character's face is never in a crowd (the named meshes present are left out; the
//     exceptions are the same person, and the crowd meshes a tier-2 person borrows: EXCEPTIONS);
//   - crowd faces never cross eras (present 2026/2049, ancient, 2196), except rb_child_m2;
//   - neighbours never share a model and variant; height varies by up to 4%, walk speed by up to 8%,
//     and hair is tinted; Rain City's crowds read 15% darker (wet) and carry umbrellas;
//   - a place's people, named and crowd, stay within §4.7's 24.
import { CAST, NPCS, AMBIENT } from './npcs.js';
import { sexOf, isChild, LV_MODELS, SHARED_MODELS } from './casting.js';
import { RAIN_DARK } from './wardrobe.js';

export const MAX_PEOPLE = 24; // §4.7: NPCs (named + crowd) per place

// role -> [[model, [variants]], ...] per era (the wardrobe table, §6.3)
const commuters = [['rb_civ_f1', ['default', 'plum', 'teal']], ['rb_civ_m1', ['default', 'navy', 'olive']], ['rb_civ_f2', ['default', 'rose', 'sand']], ['rb_courier', ['default', 'green', 'blue']], ['rb_civ_m2', ['default', 'brown']]];
const civilians = [['rb_civ_f2', ['default', 'sand']], ['rb_civ_m1', ['default', 'olive']], ['rb_civ_f1', ['default', 'teal']], ['rb_civ_m2', ['default', 'brown']], ['rb_courier', ['default', 'blue']]];
export const ERAS = {
  present: {
    commuter: commuters, civilian: civilians, shopper: commuters, visitor: commuters, fan: commuters, neighbour: civilians, evacuee: civilians, driver: [['rb_civ_m1', ['default', 'navy']], ['rb_courier', ['default', 'green']]],
    courier: [['rb_courier', ['default', 'green', 'blue']]],
    shopkeeper: [['rb_civ_m2', ['default', 'brown']]],
    contractor: [['rb_contractor', ['default', 'yellow']], ['rb_courier', ['default']]],
    builder: [['rb_contractor', ['default', 'yellow']]],
    quarryman: [['rb_contractor', ['default', 'yellow']], ['rb_courier', ['default', 'green']]],
    docker: [['rb_contractor', ['default', 'yellow']], ['rb_courier', ['default', 'green', 'blue']]],
    ems: [['rb_medic_f', ['default', 'dust']]],
    responder: [['rb_medic_f', ['default']], ['rb_contractor', ['utility']]],
    staff: [['rb_captain_m', ['transit', 'default']]],
    researcher: [['rb_doctor_m', ['default', 'tan']]],
    staffEcho: [['rb_doctor_m', ['ward']], ['rb_medic_f', ['default']]],
    recording: [['rb_doctor_m', ['default']], ['rb_contractor', ['helix slate']]],
    technician: [['rb_contractor', ['helix slate']], ['rb_civ_f2', ['coverall slate']]],
    surveyor: [['rb_contractor', ['helix slate']], ['rb_civ_f2', ['coverall slate']]],
    cleaner: [['rb_civ_m2', ['overall']]],
    child: [['rb_child_m2', ['default', 'blue', 'green']]],
    prisoner: [['rb_civ_m1', ['detention']], ['rb_civ_f1', ['detention']], ['rb_civ_m2', ['detention']], ['rb_civ_f2', ['detention']], ['rb_courier', ['detention']]],
    trapped: [['rb_civ_f2', ['dust']], ['rb_civ_m1', ['dust']], ['rb_civ_m2', ['dust']], ['rb_civ_f1', ['dust']], ['rb_courier', ['dust']]],
    officer: [['rb_trooper', ['continuum', 'elite']]],
    patrol: [['rb_trooper', ['continuum', 'elite']]],
    echo: civilians,
  },
  ancient: {
    // men in homespun; women on whichever named woman's mesh is not in the mission; girls in linen; elders
    villager: [['rb_robe_m', ['ochre', 'indigo', 'undyed', 'madder'], 3], ['WOMAN', ['umber', 'ochre', 'indigo'], 3], ['rb_child_f2', ['linen', 'ochre']], ['rb_robe_m', ['elder']]],
    waterKeeper: [['rb_robe_m', ['indigo', 'undyed', 'ochre'], 2], ['WOMAN', ['indigo', 'umber', 'ochre'], 2], ['rb_child_f2', ['linen']]],
    fisher: [['rb_robe_m', ['undyed', 'madder', 'indigo']], ['WOMAN', ['ochre', 'umber']]],
    skywatcher: [['rb_robe_m', ['indigo', 'undyed', 'madder'], 2], ['WOMAN', ['indigo', 'ochre'], 2], ['rb_robe_m', ['elder']]],
    child: [['rb_child_f2', ['linen', 'ochre']]],
    elder: [['rb_robe_m', ['elder']]],
  },
  future: {
    survivor: [['rb_trader', ['default', 'earth', 'faded'], 2], ['rb_villager_f', ['default', 'sage', 'rust'], 2], ['rb_scav', ['grey', 'olive', 'rust']], ['rb_civ_f3', ['default', 'moss', 'rust'], 2], ['rb_child_m2', ['patched', 'patched2']]],
    child: [['rb_child_m2', ['patched', 'patched2']]],
    gardener: [['rb_villager_f', ['sage', 'default']], ['rb_civ_f3', ['moss', 'default']], ['rb_trader', ['earth']]],
    scavenger: [['rb_scav', ['grey', 'olive', 'rust']]],
    trader: [['rb_trader', ['default', 'earth', 'faded']]],
    unwritten: [['rb_scav', ['unwritten', 'rust']], ['rb_trader', ['earth']]],
    warden: [['rb_scav', ['warden']], ['rb_trader', ['faded']]],
  },
};
ERAS.future.resident = ERAS.future.survivor;
ERAS.future.evacuee = ERAS.future.survivor;
ERAS.future.walker = ERAS.future.survivor;
ERAS.future.visitor = ERAS.future.survivor;
ERAS.future.echo = ERAS.future.survivor;
ERAS.ancient.echo = ERAS.ancient.villager;
const FALLBACK = { present: 'civilian', ancient: 'villager', future: 'survivor' };

// the crowd meshes tier-2 people borrow, and the ancient women (who are the named women's meshes, used
// only where that woman is not in the mission): the only overlap between named and crowd faces
export const EXCEPTIONS = ['rb_civ_f1', 'rb_civ_f2', 'rb_child_m2', 'rb_tala', 'rb_elder'];
export const ANCIENT_WOMEN = ['rb_tala', 'rb_elder'];

// every model a table can put in a crowd, per era (tests: eras are disjoint but for rb_child_m2)
export function eraModels(era) {
  const out = new Set();
  for (const list of Object.values(ERAS[era])) for (const [m] of list) for (const k of m === 'WOMAN' ? ANCIENT_WOMEN : [m]) out.add(k);
  return out;
}

// ambient people a mission places by hand (M1's toy child and the trapped pair, M3's technicians)
export const AMBIENT_CAST = {
  amb_child: { model: 'rb_child_m2', variant: 'redcoat', height: 1.26, pronoun: 'm' },
  trapped_a: { model: 'rb_civ_f1', variant: 'wet', height: 1.66, pronoun: 'f' },
  trapped_b: { model: 'rb_courier', variant: 'dust', height: 1.78, pronoun: 'm' },
  tech_0: { model: 'rb_contractor', variant: 'helix slate', height: 1.8, pronoun: 'm' },
  tech_1: { model: 'rb_civ_f2', variant: 'coverall slate', height: 1.67, pronoun: 'f' },
  tech_2: { model: 'rb_contractor', variant: 'helix slate', height: 1.76, pronoun: 'm' },
};

// the crowd models' base heights
const CAST_HEIGHT = Object.fromEntries([...Object.entries(SHARED_MODELS), ...Object.entries(LV_MODELS)].map(([k, m]) => [k, m.height || 1.75]));
const HAIR_TINTS = [0xffffff, 0xe8d8c8, 0xc8b8a8, 0xfff0d8, 0xb0a090, 0xf0e0e0];
const ECHO_GLOW = { present: '#7fc8f0', ancient: '#f0b070', future: '#80f0a0' };
const PRONOUN = { f: { their: 'her', them: 'her' }, m: { their: 'his', them: 'him' } };
const UMBRELLA_ROLES = ['commuter', 'courier', 'shopkeeper', 'civilian', 'visitor', 'shopper', 'evacuee', 'neighbour'];

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const hash = (str) => [...str].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

// which bark pool a crowd speaks from
function poolOf(c, deck) {
  if (c.era === 'ancient') return 'settlement';
  if (c.era === 'future') return deck.ambient === 'liminal' ? 'liminal' : 'future';
  if (AMBIENT[c.region]) return c.region;
  return ['rain', 'helix', 'loop'].includes(deck.ambient) ? deck.ambient : 'rain';
}

// the condition a crowd walks under: its years, and its own fact condition
function whenOf(c) {
  const ys = c.years?.length ? `(${c.years.map((y) => `@${y}`).join(' || ')})` : '';
  return [ys, c.when ? `(${c.when})` : ''].filter(Boolean).join(' && ') || undefined;
}

// a path's length and a point a fraction of the way along it (out and back for an open path)
function along(path, f) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const [x0, z0] = path[i], [x1, z1] = path[i + 1];
    const d = Math.hypot(x1 - x0, z1 - z0);
    segs.push([i, d]);
    total += d;
  }
  let t = f * total;
  for (const [i, d] of segs) {
    if (t <= d || i === segs.length - 1) {
      const k = d > 0 ? Math.min(1, t / d) : 0;
      return { x: path[i][0] + (path[i + 1][0] - path[i][0]) * k, z: path[i][1] + (path[i + 1][1] - path[i][1]) * k, seg: i };
    }
    t -= d;
  }
  return { x: path[0][0], z: path[0][1], seg: 0 };
}

// pick the people of one crowd: a weighted cycle through the role's models (a table row may carry a
// weight: [model, variants, weight]), each model's variants in turn, never two neighbours alike
function pickPeople(c, n, named, r, turn) {
  const table = ERAS[c.era]?.[c.role] || ERAS[c.era]?.[FALLBACK[c.era]] || ERAS.present.civilian;
  const cycle = [];
  for (const [m, vs, w = 1] of table) {
    const models = (m === 'WOMAN' ? ANCIENT_WOMEN : [m]).filter((model) => !named.has(model) || (model === 'rb_child_m2' && c.era !== 'ancient'));
    for (const model of models) for (let k = 0; k < w; k++) cycle.push([model, vs]);
  }
  if (!cycle.length) return [];
  const out = [];
  let i = Math.floor(r() * cycle.length);
  let guard = 0;
  while (out.length < n && guard++ < n * 8) {
    const [m, vs] = cycle[i % cycle.length];
    const v = vs[(turn[m] = (turn[m] ?? Math.floor(r() * vs.length)) + 1) % vs.length];
    i++;
    const prev = out[out.length - 1];
    if (prev && prev[0] === m && prev[1] === v && cycle.length > 1) continue;
    out.push([m, v]);
  }
  return out;
}

// the named people of the whole mission (its beats' people and the ones it names), not only this sector's:
// the settlement's women are whichever named woman is not in the mission at all
export function missionNamed(deck, level, cast) {
  const ids = new Set([...(deck.named || []), ...level.npcs.map((n) => n.crew)]);
  for (const k of [deck.crew, ...(deck.beats || []).map((b) => b.crew)]) if (typeof k === 'number' && CAST[k]) ids.add(CAST[k].id);
  for (const b of deck.beats || []) if (typeof b.npc === 'string') ids.add(b.npc);
  const out = new Set();
  for (const id of ids) {
    const c = cast.find((x) => x.id === id);
    if (c?.model && NPCS[c.id]) out.add(c.model);
  }
  return out;
}

// The level's people: the cast with this mission's variants, the hand-placed ambient people cast by
// role, and the crowds along the place's paths. Mutates level.npcs; returns the level's cast.
export function castLevel(level, deck, { facts = null } = {}) {
  // the named people, each a copy that can wear this mission's variant
  const cast = CAST.map((c) => ({ ...c }));
  const byId = Object.fromEntries(cast.map((c) => [c.id, c]));
  for (const n of level.npcs) {
    // the Director of Continuity is whoever rook_fate made them
    if (n.crew === 'director') {
      const res = NPCS.director.resolve.find((x) => !facts || facts.test(x.when)) || NPCS.director.resolve[NPCS.director.resolve.length - 1];
      if (res.as) { n.crew = res.as; n.variant = res.variant; } else n.chair = res.chair;
    }
    if (n.crew === 'pryce') n.crew = 'guard';
    const c = byId[n.crew];
    if (!c) continue;
    if (n.variant) c.variant = n.variant;
    const def = NPCS[c.id];
    if (def?.silent && n.silent === undefined) n.silent = true;
    if (def?.hologram && !n.hologram) n.hologram = true;
    if (def?.flicker) n.flicker = true;
  }
  level.npcs = level.npcs.filter((n) => !n.chair); // (an empty chair is a prop, not a person)
  const levelCast = [];
  // hand-placed ambient people: cast by who they are
  for (const n of level.npcs) {
    if (!n.ambient || byId[n.crew]) continue;
    const a = AMBIENT_CAST[n.crew] || AMBIENT_CAST[n.id];
    if (!a) continue;
    n.pronoun = PRONOUN[a.pronoun];
    if (!n.height) n.height = a.height;
    levelCast.push({ id: n.crew, first: n.first || 'Someone', name: (n.first || 'someone').toUpperCase(), color: '#4f6170', seed: n.seed || 1, pronoun: n.pronoun, model: a.model, variant: a.variant, height: a.height, ambient: true });
  }
  // the crowds
  const named = missionNamed(deck, level, cast);
  // within §4.7's 24: each crowd keeps its share, the places left over going to the largest remainders
  const crowds = (level.crowd || []).filter((c) => c.n > 0 && c.path?.length);
  const budget = Math.max(0, MAX_PEOPLE - level.npcs.length);
  const wanted = crowds.reduce((s, c) => s + c.n, 0);
  const scale = wanted > budget ? budget / wanted : 1;
  const counts = crowds.map((c) => Math.floor(c.n * scale));
  let left = Math.min(budget, wanted) - counts.reduce((a, b) => a + b, 0);
  for (const ci of crowds.map((c, i) => i).sort((a, b) => (crowds[b].n * scale % 1) - (crowds[a].n * scale % 1))) if (left-- > 0) counts[ci]++;
  const r = rng(hash(`${deck.mkey}:${level.id}`));
  const turn = {};
  const wet = ['rain', 'storm'].includes(level.years?.PRESENT?.weather);
  let k = 0;
  crowds.forEach((c, ci) => {
    const n = counts[ci];
    if (!n) return;
    const people = pickPeople(c, n, named, r, turn);
    const pool = AMBIENT[poolOf(c, deck)] || AMBIENT.rain;
    const when = whenOf(c);
    const rainy = wet && ['rain', 'northbank', 'south'].includes(c.region);
    people.forEach(([model, variant], j) => {
      const id = `crowd_${k++}`;
      const sex = sexOf(model) || 'm';
      const child = isChild(model);
      const old = variant === 'elder';
      const base = (CAST_HEIGHT[model] || 1.72);
      const height = Math.round(base * (1 + (r() - 0.5) * 0.072) * 100) / 100; // within ±4% (after rounding)
      const walk = (old ? 0.8 : 1) * (1 + (r() - 0.5) * 0.16); // ±8%
      // where along the path, which way, a step to one side
      const f = (j + 0.5) / people.length;
      const at = along(c.path, f);
      const side = (r() - 0.5) * 1.4;
      const reverse = j % 2 === 1;
      let path = c.path.map(([x, z]) => [Math.round((x + side) * 100) / 100, Math.round((z + side * 0.6) * 100) / 100]);
      if (c.path.length > 1) {
        // walk on from where they stand: the waypoint ahead first (or, walking the other way, the one behind)
        const L = path.length;
        if (reverse) {
          const R = [...path].reverse(), s0 = L - 1 - at.seg;
          path = [...R.slice(s0), ...R.slice(0, s0)];
        } else path = [...path.slice(at.seg + 1), ...path.slice(0, at.seg + 1)];
      }
      const x = at.x + side, z = at.z + side * 0.6;
      const y = c.y ?? level.heightAt?.(x, z) ?? 0;
      const voices = pool.voices || {};
      const vlist = child ? voices.child : old ? voices[`old_${sex}`] : voices[sex];
      const props = [];
      if (rainy && UMBRELLA_ROLES.includes(c.role) && !child && j % 3 !== 2) props.push('umbrella');
      if (['researcher', 'surveyor', 'technician'].includes(c.role) && j % 2 === 0) props.push('clipboard');
      if (c.role === 'gardener' && j % 2 === 0) props.push('trowel');
      if (c.role === 'skywatcher' && j % 3 === 0) props.push('lantern');
      const first = pool.roles?.[c.role] || pool.names?.[k % pool.names.length] || 'Someone';
      levelCast.push({
        id, first, name: first.toUpperCase(), color: c.echo ? ECHO_GLOW[c.era] : '#4f6170', seed: 300 + k, pronoun: PRONOUN[sex] || PRONOUN.m, model, variant, height, walk,
        hairTint: HAIR_TINTS[k % HAIR_TINTS.length], dark: rainy ? RAIN_DARK : null, props, crowd: true, era: c.era, crowdRole: c.role,
      });
      level.npcs.push({
        id, crew: id, first, ambient: true, crowd: true, seed: 300 + k, pronoun: PRONOUN[sex] || PRONOUN.m, pos: [x, y, z], yaw: r() * 6.28, height,
        path: path.length > 1 ? path : undefined, speed: Math.round(1.05 * walk * 100) / 100, when, silent: true, room: level.outdoorRoom || level.order[0],
        hologram: !!c.echo, ...(c.echo ? {} : { barks: c.barks || pool.barks, barkEvery: 24 + (k % 4) * 3 }), // (a crowd may say its own)
        ...(deck.crowdFreeze ? { freezeWhen: deck.crowdFreeze } : {}),
        voiceExtra: { id: vlist?.[k % vlist.length] || null, gender: sex },
      });
    });
  });
  return cast.concat(levelCast);
}
