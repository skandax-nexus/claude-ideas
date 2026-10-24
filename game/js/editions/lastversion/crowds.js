// THE LAST VERSION OF EARTH: the crowds (OVERHAUL.md §6.1, §6.3).
//
// Every place lays out crowd paths (level.crowd: { era, years, region, role, path, n, y?, when?, echo? }).
// castLevel() turns them into people who walk those paths, by the era's wardrobe table and the role,
// and gives the level its cast: the named people (with this mission's variants) plus everyone in its
// crowds (story.cast = CAST.concat(levelCast), CAST's indices unchanged). Rules:
//   - a named character's face is never in a crowd, in any mission (closing: the settlement's women no longer wear Tala's
//     or the Elder's mesh, the receptionist and Officer Haig have faces of their own; EXCEPTIONS is empty);
//   - crowd faces never cross eras (present 2026/2049, ancient, 2196), except rb_child_m2 (Rocketbox has four children
//     and the named own two of them: the one boy's body is the crowds' boy in every era, and the settlement's girl with
//     a woman's hair);
//   - a place dresses its people from its own palette (PALETTE: the settlement's dyes, today's coats and colours), so
//     no two missions' crowds look alike; each face walks at most CAP times a year in a place, each time in other
//     clothes (a face and wardrobe once), and neighbours differ; height varies by up to 4%, walk speed by up to 8%,
//     hair is tinted; Rain City's crowds read 15% darker (wet) and carry umbrellas;
//   - every role is named for what it is (ROLE_NAMES), never from another region's list;
//   - a place's people, named and crowd, stay within §4.7's 24 (a place the sheets call crowded: its own `people`).
import { compileCondition } from '../../core/conditions.js';
import { CAST, NPCS, AMBIENT } from './npcs.js';
import { sexOf, isChild, LV_MODELS, SHARED_MODELS, castOf } from './casting.js';
import { RAIN_DARK, WARDROBE } from './wardrobe.js';
import { missionBarks } from './barks.js';

export const MAX_PEOPLE = 24; // §4.7: NPCs (named + crowd) per place

// role -> [[model, [variants]], ...] per era (the wardrobe table, §6.3). (U4 review) Every working role draws on more
// than one face, and castLevel caps any one face at CAP a year in a place: a crowd is never copies of one or two.
const commuters = [['rb_civ_f1', ['default', 'plum', 'teal']], ['rb_civ_m1', ['default', 'navy', 'olive']], ['rb_civ_f2', ['default', 'rose', 'sand']], ['rb_courier', ['default', 'green', 'blue']], ['rb_civ_m2', ['default', 'brown']], ['rb_civ_m3', ['default', 'blue']], ['rb_civ_f4', ['default', 'plum']]];
const civilians = [['rb_civ_f2', ['default', 'sand']], ['rb_civ_m1', ['default', 'olive']], ['rb_civ_f1', ['default', 'teal']], ['rb_civ_m2', ['default', 'brown']], ['rb_courier', ['default', 'blue']], ['rb_civ_m3', ['default', 'blue']], ['rb_civ_f4', ['default', 'plum']]];
const dusty = [['rb_civ_f2', ['dust', 'soot']], ['rb_civ_m1', ['dust', 'soot']], ['rb_civ_m2', ['dust', 'soot']], ['rb_civ_f1', ['dust', 'soot']], ['rb_courier', ['dust', 'soot']], ['rb_civ_m3', ['dust', 'soot']], ['rb_civ_f4', ['dust', 'soot']]];
// (closing) the casual roles of today wear the place's palette (wardrobe.js PRESENT_PALETTES, '#1'... become e.g. 'rain3'),
// the settlement's people its dyes ('#2' -> 'fire2', '#_boy1' -> 'fire_boy1'); a mission without a palette of today
// keeps the plain variants
const P6 = ['#1', '#2', '#3', '#4', '#5', '#6'];
const A5 = ['#1', '#2', '#3', '#4', '#5'];
const KIDS = ['#_boy1', '#_girl2', '#_boy3', '#_girl4', '#_boy5', '#_girl1'];
export const ERAS = {
  present: {
    commuter: commuters, civilian: civilians, shopper: commuters, visitor: commuters, fan: commuters, neighbour: civilians, evacuee: dusty, driver: [['rb_civ_m1', ['default', 'navy']], ['rb_courier', ['default', 'green']], ['rb_civ_m3', ['default']]],
    courier: [['rb_courier', ['default', 'green', 'blue']], ['rb_civ_m1', ['navy', 'olive']], ['rb_civ_f4', ['default']]],
    shopkeeper: [['rb_civ_m2', ['default', 'brown']], ['rb_civ_m3', ['default']], ['rb_civ_f4', ['default']]],
    contractor: [['rb_contractor', ['default', 'yellow']], ['rb_courier', ['default']], ['rb_civ_m2', ['overall']]],
    builder: [['rb_contractor', ['default', 'yellow']], ['rb_civ_m2', ['overall']], ['rb_civ_m1', ['dust']], ['rb_civ_m3', ['dust']]],
    quarryman: [['rb_contractor', ['default', 'yellow']], ['rb_courier', ['default', 'green']], ['rb_civ_m2', ['overall']]],
    docker: [['rb_contractor', ['default', 'yellow']], ['rb_courier', ['default', 'green', 'blue']], ['rb_civ_m2', ['overall']], ['rb_civ_m3', ['dust']]],
    ems: [['rb_medic_f', ['default', 'dust', 'night']]], // (a paramedic is a paramedic: the utility crews are responders)
    responder: [['rb_medic_f', ['default']], ['rb_contractor', ['utility']], ['rb_civ_m3', ['dust']]],
    // transit staff in navy (no airline captain's cap and stripes)
    staff: [['rb_civ_m3', ['transit']], ['rb_civ_f4', ['transit']]],
    // (closing) Helix's researchers in lab coats, its technicians in slate work uniforms: never a woman in a T-shirt or a
    // tank top dyed grey, who read as someone off duty
    researcher: [['rb_doctor_m', ['default', 'tan']], ['rb_civ_f4', ['labcoat']], ['rb_civ_m3', ['labcoat']]],
    staffEcho: [['rb_doctor_m', ['ward']], ['rb_medic_f', ['default']]],
    recording: [['rb_doctor_m', ['default']], ['rb_civ_f4', ['labcoat']], ['rb_contractor', ['helix slate']]],
    technician: [['rb_contractor', ['helix slate']], ['rb_medic_f', ['helix tech']], ['rb_civ_m2', ['overall']], ['rb_civ_m3', ['labcoat']]],
    surveyor: [['rb_contractor', ['helix slate']], ['rb_medic_f', ['helix tech']], ['rb_civ_m3', ['labcoat']]],
    cleaner: [['rb_civ_m2', ['overall']]],
    child: [['rb_child_m2', ['default', 'blue', 'green']]],
    prisoner: [['rb_civ_m1', ['detention']], ['rb_civ_f1', ['detention']], ['rb_civ_m2', ['detention']], ['rb_civ_f2', ['detention']], ['rb_courier', ['detention']], ['rb_civ_m3', ['detention']], ['rb_civ_f4', ['detention']], ['rb_contractor', ['detention']]],
    trapped: dusty,
    officer: [['rb_trooper', ['continuum', 'elite']]],
    patrol: [['rb_trooper', ['continuum', 'elite']]],
    echo: civilians,
  },
  ancient: {
    // (closing) the settlement's own people, three thousand years ago, in wool and linen (wardrobe.js SETTLEMENT): two men,
    // two women, two old men, and the one boy's body as its boys and (with a woman's hair) its girls; never a named face
    villager: [['rb_vill_m', A5], ['rb_vill_f', A5], ['rb_vill_m2', A5], ['rb_vill_f2', A5], ['rb_child_m2', KIDS], ['rb_elder_m', A5]],
    waterKeeper: [['rb_vill_m2', A5], ['rb_vill_f', A5], ['rb_vill_m', A5], ['rb_vill_f2', A5], ['rb_child_m2', KIDS]],
    fisher: [['rb_vill_m', A5], ['rb_vill_m2', A5], ['rb_vill_f2', A5]],
    skywatcher: [['rb_sage_m', A5], ['rb_vill_m', A5], ['rb_vill_f', A5], ['rb_elder_m', A5], ['rb_vill_f2', A5], ['rb_vill_m2', A5]],
    child: [['rb_child_m2', KIDS]],
    elder: [['rb_elder_m', A5], ['rb_sage_m', A5]],
    craftsperson: [['rb_vill_f2', A5], ['rb_vill_m', A5], ['rb_vill_f', A5]],
    storyteller: [['rb_elder_m', A5], ['rb_sage_m', A5]],
  },
  future: {
    survivor: [['rb_trader', ['default', 'earth', 'faded'], 2], ['rb_surv_f', ['default', 'sage', 'rust'], 2], ['rb_scav', ['grey', 'olive', 'rust']], ['rb_civ_f3', ['default', 'moss', 'rust'], 2], ['rb_child_m2', ['patched', 'patched2']]],
    // (the lock city's schoolchildren, M15: Tomas has a body of his own, and sits among them)
    child: [['rb_child_m2', ['patched', 'patched2', 'patched3']], ['rb_child_f2', ['faded']]],
    gardener: [['rb_surv_f', ['sage', 'default']], ['rb_civ_f3', ['moss', 'default']], ['rb_trader', ['earth']]],
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

// (closing) each mission's palette: the settlement's dyes, and the colours today's casual crowds wear (wardrobe.js
// SETTLEMENT, PRESENT_PALETTES), so that no two missions' crowds look alike; a case replays its mission's
export const PALETTE = {
  ancient: { m04: 'fire', m05: 'water', m07: 'sky', m22: 'ash', m23: 'fest' },
  present: { m01: 'rain', m06: 'autumn', m09: 'summer', m11: 'ward', m14: 'midday', m15: 'winter', m20: 'memory', m22: 'grey', m23: 'bright' },
};
export const PALETTE_ROLES = ['commuter', 'civilian', 'shopper', 'visitor', 'fan', 'neighbour', 'echo'];
const paletteOf = (era, deck) => PALETTE[era]?.[deck.origin || deck.mkey] || (era === 'ancient' ? 'fire' : null);
// a table's variant in this place: '#n' in its palette; a casual role of today in the place's palette when the body
// has one
function placeVariant(v, era, pal) {
  return typeof v === 'string' && v.startsWith('#') ? (pal || 'fire') + v.slice(1) : v;
}

// (closing) no named face is ever in a crowd: the settlement's women were the named women's meshes, and the
// receptionist and Officer Haig wore two commuters' faces; each has her own now
export const EXCEPTIONS = [];
// (U4 review; closing) one face at most CAP times a year in a place's crowds, and each time in other clothes; holograms
// (echoes) aside, and the helmeted troopers (a uniform is the point of them)
export const CAP = 4;
// the old: a slower walk, an old voice
export const OLD = ['rb_elder_m', 'rb_sage_m'];
const UNCAPPED = ['rb_trooper'];
// (and the roles whose clothes are a uniform: the loop cells' prisoners may wear the same grey, each face still capped)
const UNIFORM = ['prisoner', 'officer', 'patrol'];
// the people Kai has met by the Place Outside Time (M19), its echoes (§6.3): their own faces, as holograms, and their names
export const MET = ['guard', 'iven', 'odile', 'clockmaker', 'elder'];

// every model a table can put in a crowd, per era (tests: eras are disjoint but for rb_child_m2)
export function eraModels(era) {
  const out = new Set();
  for (const list of Object.values(ERAS[era])) for (const [m] of list) out.add(m);
  return out;
}
// what a role is called, in every region (a role a region's own table does not name is named here, never from another
// region's list: a construction worker was once 'Nurse' because Rain City's names were next in line)
export const ROLE_NAMES = {
  commuter: 'Commuter', courier: 'Courier', shopkeeper: 'Shopkeeper', contractor: 'Contractor', staff: 'Platform staff', ems: 'Paramedic',
  civilian: 'Passer-by', builder: 'Builder', child: 'Child', researcher: 'Researcher', technician: 'Technician', cleaner: 'Cleaner',
  surveyor: 'Surveyor', guard: 'Guard', villager: 'Villager', waterKeeper: 'Water keeper', fisher: 'Fisher', skywatcher: 'Sky-watcher',
  elder: 'Elder', craftsperson: 'Craftsperson', storyteller: 'Storyteller', evacuee: 'Evacuee', responder: 'Responder', shopper: 'Shopper',
  prisoner: 'Prisoner', staffEcho: 'Staff', visitor: 'Visitor', trapped: 'Civilian', docker: 'Docker', officer: 'Officer', patrol: 'Patrol',
  unwritten: 'Irregular', fan: 'Fan', survivor: 'Survivor', resident: 'Resident', walker: 'Walker', gardener: 'Gardener', scavenger: 'Scavenger',
  trader: 'Trader', warden: 'Warden', echo: 'Echo', recording: 'A recording', neighbour: 'A memory', driver: 'Driver', quarryman: 'Quarry worker',
};
export const roleName = (pool, role) => pool?.roles?.[role] || ROLE_NAMES[role] || 'Someone';

// ambient people a mission places by hand (M1's toy child and the trapped pair, M3's technicians)
export const AMBIENT_CAST = {
  amb_child: { model: 'rb_child_m2', variant: 'redcoat', height: 1.26, pronoun: 'm' },
  trapped_a: { model: 'rb_civ_f1', variant: 'wet', height: 1.66, pronoun: 'f' },
  trapped_b: { model: 'rb_courier', variant: 'dust', height: 1.78, pronoun: 'm' },
  tech_0: { model: 'rb_contractor', variant: 'helix slate', height: 1.8, pronoun: 'm' },
  tech_1: { model: 'rb_medic_f', variant: 'helix tech', height: 1.67, pronoun: 'f' }, // (closing: a work uniform, not a T-shirt dyed grey)
  tech_2: { model: 'rb_contractor', variant: 'helix slate', height: 1.76, pronoun: 'm' },
  // Act I (U7; closing): the settlement's people at the first fire (M4: a craftswoman at her work, the storyteller, an
  // old man, and the girl who lost her ring), the villagers who left (M5's echoes), M8's altered staff: the settlement's
  // own faces, never a named woman's
  m4_craft: { model: 'rb_vill_f2', variant: 'craft', height: 1.62, pronoun: 'f' },
  m4_teller: { model: 'rb_elder_m', variant: 'storyteller', height: 1.72, pronoun: 'm' },
  m4_girl: { model: 'rb_child_m2', variant: 'girl_m4', height: 1.28, pronoun: 'f' },
  m5_potter: { model: 'rb_vill_m', variant: 'potter', height: 1.76, pronoun: 'm' },
  m5_mother: { model: 'rb_vill_f', variant: 'mother', height: 1.64, pronoun: 'f' },
  m5_child: { model: 'rb_child_m2', variant: 'girl_m5', height: 1.26, pronoun: 'f' },
  m5_keeper: { model: 'rb_vill_m2', variant: 'keeper', height: 1.78, pronoun: 'm' },
  m7_astro: { model: 'rb_sage_m', variant: 'astronomer', height: 1.7, pronoun: 'm' },
  // (U7 review) Ezra's 2026 echo at sixty-five (M6; and the clockmaker of its 1999 cold open), Niko older at the first sky
  // (M7's cold open): their own meshes in another wardrobe, apart from the named person the mission also places
  ezra26: { model: 'rb_ezra', variant: 'ezra65', height: 1.74, pronoun: 'm' },
  m7_oldniko: { model: 'rb_niko', variant: 'older', height: 1.74, pronoun: 'm' },
  m8_tech: { model: 'rb_contractor', variant: 'helix slate', height: 1.79, pronoun: 'm' },
  // Act II (U7): an evacuee in Loop City, Sera disguised as a Continuum guard, the people who listened, a freed prisoner
  m9_evac: { model: 'rb_civ_f2', variant: 'dust', height: 1.66, pronoun: 'f' },
  m10_guard: { model: 'rb_sera', variant: 'guard', height: 1.7, pronoun: 'f' },
  m10_looper: { model: 'rb_civ_m3', variant: 'detention', height: 1.77, pronoun: 'm' }, // (closing: the prisoner whose loop let him keep a few words)
  m12_glazier: { model: 'rb_medic_f', variant: 'helix tech', height: 1.67, pronoun: 'f' }, // (closing: the glazier on Helix's roof, M12; at the Spire, M21; on the road, M23)
  m13_listener: { model: 'rb_civ_m1', variant: 'dust', height: 1.78, pronoun: 'm' },
  m13_freed: { model: 'rb_civ_m2', variant: 'detention', height: 1.76, pronoun: 'm' },
  // Act III (U8): Sera's schoolchildren (M14), an Unwritten fighter and a lock-city volunteer at the pylons (M18)
  // (a girl and two boys in two bodies, in 2196's faded clothes: not one boy three times, U8 review)
  m14_pupil: { model: 'rb_child_m2', variant: 'patched2', height: 1.3, pronoun: 'm' },
  m14_pupilA: { model: 'rb_child_f2', variant: 'faded', height: 1.24, pronoun: 'f' },
  m14_pupilB: { model: 'rb_child_m2', variant: 'patched', height: 1.34, pronoun: 'm' },
  m14_keeper: { model: 'rb_trader', variant: 'faded', height: 1.76, pronoun: 'm' }, // (closing: the ticket keeper on the 41's old platform, M14; the Finale's road)
  m18_fighter: { model: 'rb_scav', variant: 'unwritten', height: 1.78, pronoun: 'm' },
  m18_citizen: { model: 'rb_civ_f3', variant: 'moss', height: 1.66, pronoun: 'f' },
  // (closing: the scavenger father and daughter who ask for a pylon's cell, M18; she is in Sera's garden on the Finale's road)
  m18_scav: { model: 'rb_scav', variant: 'rust', height: 1.77, pronoun: 'm' },
  m18_scavgirl: { model: 'rb_child_f2', variant: 'faded', height: 1.22, pronoun: 'f' },
  m21_cook: { model: 'rb_civ_f2', variant: 'cook', height: 1.67, pronoun: 'f' }, // (the Loop City evacuee, years on, cooking: a white top and an apron)
  m21_listener: { model: 'rb_civ_f1', variant: 'teal', height: 1.66, pronoun: 'f' },
  m23_listener: { model: 'rb_civ_f2', variant: 'rose', height: 1.67, pronoun: 'f' },
  m23_passenger: { model: 'rb_courier', variant: 'blue', height: 1.78, pronoun: 'm' },
  // Ending B: whoever stands guard on the other side of the line (a temporal scavenger with a lantern)
  m23_guard: { model: 'rb_scav', variant: 'lantern', height: 1.78, pronoun: 'm' },
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

// what one of a crowd says in passing: every other line of its pool (neighbours share the walla); an elder does not
// speak of "the elders" as other people
function barksOf(pool, k, old) {
  const mine = pool.barks.filter((b, i) => b && i % 2 === k % 2);
  if (!old) return mine;
  const own = mine.filter((b) => !/\belders?\b/i.test(b));
  return own.length ? own : pool.barks.filter((b) => b && !/\belders?\b/i.test(b));
}

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

// pick the people of one crowd: a weighted cycle through the role's models (a table row may carry a weight: [model,
// variants, weight]), each model's variants in turn (in this place's palette), never two neighbours alike
function pickPeople(c, n, named, r, turn, fits = () => true, last = null, worn = null, pal = null) {
  // the Place Outside Time's echoes are the people Kai has met (MET), each once, in their own face and wardrobe
  if (c.role === 'met') {
    const met = MET.filter((id) => NPCS[id] && !named.has(NPCS[id].model));
    const at = Math.floor(r() * met.length);
    return [...met.slice(at), ...met.slice(0, at)].slice(0, n).map((id) => [NPCS[id].model, NPCS[id].variant, id]);
  }
  const table = ERAS[c.era]?.[c.role] || ERAS[c.era]?.[FALLBACK[c.era]] || ERAS.present.civilian;
  const casual = c.era === 'present' && pal && PALETTE_ROLES.includes(c.role);
  const cycle = [];
  for (const [m, vs0, w = 1] of table) {
    // (never a named face: the named of the whole mission are left out; the crowds' one boy's body aside)
    if (named.has(m) && m !== 'rb_child_m2') continue;
    // (a casual role of today in the place's palette, where the body has one)
    const vs = casual && WARDROBE[m]?.[`${pal}1`] ? P6.map((v) => placeVariant(v, c.era, pal)).filter((v) => WARDROBE[m][v]) : vs0.map((v) => placeVariant(v, c.era, pal));
    for (let k = 0; k < w; k++) cycle.push([m, vs]);
  }
  if (!cycle.length) return [];
  const out = [];
  let i = Math.floor(r() * cycle.length);
  let guard = 0;
  while (out.length < n && guard++ < n * 12) {
    const [m, vs] = cycle[i % cycle.length];
    i++;
    const v = vs[(turn[m] = (turn[m] ?? Math.floor(r() * vs.length)) + 1) % vs.length];
    if (!fits(m, v)) continue; // (this face, or this face in these clothes, is already here as often as it may be)
    if (worn?.has(`${m}/${v}`)) continue; // (someone placed by hand in this look is not also in the crowd)
    const prev = out[out.length - 1] || last; // (the last of the crowd before is a neighbour too)
    if (prev && prev[0] === m && prev[1] === v && cycle.length > 1) continue;
    out.push([m, v]);
    fits(m, v, true);
  }
  return out;
}

// --- feet on the ground (U4 review) -----------------------------------------------------------------------------------
// DeckWorld walks a crowd's people round their paths in x and z only. So that nobody floats off a terrace, sinks into a
// plaza or walks through a wall, each walker's route is followed over the level's solid boxes when the level is cast:
// up or down a step of at most STEP_UP, never into anything taller (with a body's width round it), never off a ledge,
// in every year the walker shows in. A loop that can be walked all the way round stays a loop; else the walker goes out
// and back over the stretch it can walk from where it stands (a stretch under MIN_RUN: it stands). Every waypoint
// carries the ground's height ([x, z, y]), with one either side of each step, and Runtime.step sets a walker's height
// from the two it walks between.
export const STEP_UP = 0.4, BODY_R = 0.3, MIN_RUN = 4;
const SAMPLE = 0.2, CELL = 2, HEAD = 1.7;
const cellKey = (i, j) => (i + 4096) * 8192 + (j + 4096);
export function groundOf(level, deck) {
  const states = (level.states || deck.states || ['PRESENT']).filter((st) => !level.years || level.years[st]);
  const solids = (level.elements || []).filter((e) => e.solid && e.box);
  const grid = new Map();
  solids.forEach((e, i) => {
    const b = e.box;
    for (let gx = Math.floor((b[0] - BODY_R) / CELL); gx <= Math.floor((b[3] + BODY_R) / CELL); gx++) {
      for (let gz = Math.floor((b[2] - BODY_R) / CELL); gz <= Math.floor((b[5] + BODY_R) / CELL); gz++) {
        const k = cellKey(gx, gz);
        let l = grid.get(k);
        if (!l) grid.set(k, (l = []));
        l.push(i);
      }
    }
  });
  const holds = (when, st, v) => !when || !!compileCondition(when)({ fact: () => v, state: st });
  const masks = new Map();
  // for the years a walker shows in: which solids are ground (there whatever the facts) and which are in the way
  // (there with some facts) in each
  const maskOf = (when) => {
    let m = masks.get(when || '');
    if (m) return m;
    let sts = states.filter((st) => holds(when, st, false) || holds(when, st, true));
    if (!sts.length) sts = states;
    m = sts.map((st) => ({
      ground: solids.map((e) => holds(e.when, st, false) && holds(e.when, st, true)),
      wall: solids.map((e) => holds(e.when, st, false) || holds(e.when, st, true)),
    }));
    masks.set(when || '', m);
    return m;
  };
  // the ground under (x, z) within a step of y in every year, or null: blocked, a ledge, or years that disagree
  const at = (m, x, z, y) => {
    const l = grid.get(cellKey(Math.floor(x / CELL), Math.floor(z / CELL))) || [];
    let out = null;
    for (const yr of m) {
      let best = null;
      for (const i of l) {
        const b = solids[i].box;
        if (yr.wall[i] && b[1] < y + HEAD && b[4] > y + STEP_UP && x > b[0] - BODY_R && x < b[3] + BODY_R && z > b[2] - BODY_R && z < b[5] + BODY_R) return null;
        if (yr.ground[i] && x >= b[0] && x <= b[3] && z >= b[2] && z <= b[5] && Math.abs(b[4] - y) <= STEP_UP && (best === null || Math.abs(b[4] - y) < Math.abs(best - y))) best = b[4];
      }
      if (best === null || (out !== null && Math.abs(best - out) > 0.05)) return null;
      out ??= best;
    }
    return out;
  };
  const R2 = (v) => Math.round(v * 100) / 100;
  // walk from a point along a list of points (the first leg starts at the point), as far as the ground allows: the
  // points walked through with their heights (one either side of each step) and how far it got
  const walk = (m, x, z, y, pts) => {
    const out = [];
    let dist = 0;
    let px = x, pz = z, py = y;
    for (const [tx, tz] of pts) {
      const L = Math.hypot(tx - px, tz - pz);
      const n = Math.max(1, Math.ceil(L / SAMPLE));
      let qx = px, qz = pz, qy = py;
      for (let i = 1; i <= n; i++) {
        const sx = px + ((tx - px) * i) / n, sz = pz + ((tz - pz) * i) / n;
        const sy = at(m, sx, sz, qy);
        if (sy === null) return { pts: out, dist, end: [R2(qx), R2(qz), qy], done: false };
        if (Math.abs(sy - qy) > 0.02) out.push([R2(qx), R2(qz), qy], [R2(sx), R2(sz), sy]); // (a step: its foot and its top)
        dist += L / n;
        qx = sx; qz = sz; qy = sy;
      }
      out.push([R2(tx), R2(tz), qy]);
      px = tx; pz = tz; py = qy;
    }
    return { pts: out, dist, end: [R2(px), R2(pz), py], done: true };
  };
  // A walker's route: path (DeckWorld's waypoints, the first the one it walks to first) from (x, z), standing near y.
  // { y, path } with path [[x, z, y], ...] or undefined (standing), or null: nowhere to stand.
  return (when, x, z, y, path) => {
    const m = maskOf(when);
    const y0 = at(m, x, z, y);
    if (y0 === null) return null;
    if (!path || path.length < 2) return { y: y0 };
    const L = path.length;
    // round the loop and back to where it started
    const loop = walk(m, x, z, y0, [...path, [x, z]]);
    if (loop.done && Math.abs(loop.end[2] - y0) < 0.03) {
      const pts = loop.pts.slice(0, -1); // (not the starting point itself)
      return { y: y0, path: pts.length > 1 ? pts : undefined };
    }
    // else out and back over what can be walked: ahead (the waypoints in order) and behind (in reverse); a loop that
    // came round at another height is walked out and back the way it went
    const ahead = loop;
    const behind = ahead.done ? { pts: [], dist: 0, done: true } : walk(m, x, z, y0, [...path].reverse().slice(0, L));
    if (ahead.dist + behind.dist < MIN_RUN) return { y: y0 };
    const F = ahead.done ? ahead.pts.slice(0, -1) : [...ahead.pts, ahead.end];
    const B = behind.done ? behind.pts : [...behind.pts, behind.end];
    // forward to F's end, back through the start to B's end, forward again to the start
    const route = [...F, ...F.slice(0, -1).reverse(), [R2(x), R2(z), y0], ...B, ...B.slice(0, -1).reverse(), [R2(x), R2(z), y0]];
    // (drop points that repeat the one before)
    const clean = route.filter((p, i) => i === 0 || Math.hypot(p[0] - route[i - 1][0], p[1] - route[i - 1][1]) > 0.05 || p[2] !== route[i - 1][2]);
    return { y: y0, path: clean.length > 1 ? clean : undefined };
  };
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
  // (a face a hand-placed person wears here, the trapped woman or Sera in her disguise, is not also in the crowd:
  // children aside, who have one crowd face)
  const placed = new Set(levelCast.map((c) => c.model).filter((m) => !isChild(m)));
  // (a named child placed here is not also a crowd child in the same look: Tomas among the lock city's; nor is anyone
  // placed by hand in the same face and clothes: the settlement's storyteller, craftswoman and girl walked twice in
  // Mission 4, its crowd sharing their three faces)
  const worn = new Set([...level.npcs.filter((n) => byId[n.crew] && isChild(byId[n.crew].model)).map((n) => `${byId[n.crew].model}/${n.variant || byId[n.crew].variant}`),
    ...levelCast.map((c) => `${c.model}/${c.variant || 'default'}`)]);
  const faces = new Map(); // `${model}@${year}` -> how many of the crowd wear it (and `${model}/${variant}@${year}`)
  const yearsOf = (c) => (c.years?.length ? c.years : level.states || deck.states || ['PRESENT']);
  // within §4.7's 24: each crowd keeps its share, the places left over going to the largest remainders
  const crowds = (level.crowd || []).filter((c) => c.n > 0 && c.path?.length);
  const budget = Math.max(0, (level.people || MAX_PEOPLE) - level.npcs.length);
  const wanted = crowds.reduce((s, c) => s + c.n, 0);
  const scale = wanted > budget ? budget / wanted : 1;
  const counts = crowds.map((c) => Math.floor(c.n * scale));
  let left = Math.min(budget, wanted) - counts.reduce((a, b) => a + b, 0);
  for (const ci of crowds.map((c, i) => i).sort((a, b) => (crowds[b].n * scale % 1) - (crowds[a].n * scale % 1))) if (left-- > 0) counts[ci]++;
  // (a CASE FILES replay walks its mission's crowd: seeded as the mission's, in faces the mission's chapter loads, as
  // a replay loads only that chapter's people: Runtime.castKeyOf)
  const r = rng(hash(`${deck.origin || deck.mkey}:${level.id}`));
  const own = deck.origin && deck.voiceGroup ? castOf(deck.voiceGroup) : null;
  const turn = {};
  const route = crowds.length ? groundOf(level, deck) : null;
  let lastPick = null;
  const wet = ['rain', 'storm'].includes(level.years?.PRESENT?.weather);
  let k = 0;
  crowds.forEach((c, ci) => {
    const n = counts[ci];
    if (!n) return;
    // (a face at most CAP times a year in a place, each time in other clothes; never one someone placed by hand here
    // wears, but in the settlement, whose few faces dress differently by hand and in the crowd)
    const ancient = c.era === 'ancient';
    const ys = yearsOf(c);
    const capped = !c.echo && c.role !== 'met';
    const pal = paletteOf(c.era, deck);
    const fits = (m, v, take) => {
      if (!take && own && !own.includes(m)) return false; // (a replay's crowd wears only faces its chapter loads)
      if (!capped || UNCAPPED.includes(m)) return true;
      if (take) { for (const y of ys) for (const k of [`${m}@${y}`, `${m}/${v}@${y}`]) faces.set(k, (faces.get(k) || 0) + 1); return true; }
      return (ancient || !placed.has(m)) && ys.every((y) => (faces.get(`${m}@${y}`) || 0) < CAP && (UNIFORM.includes(c.role) || !faces.get(`${m}/${v}@${y}`)));
    };
    const people = pickPeople(c, n, named, r, turn, fits, lastPick, worn, pal);
    if (people.length) lastPick = people[people.length - 1];
    const pool = AMBIENT[poolOf(c, deck)] || AMBIENT.rain;
    // (closing: a mission whose crowd would say a region's lines another mission says has its own, barks.js)
    const mine = missionBarks(deck, AMBIENT[poolOf(c, deck)] ? poolOf(c, deck) : 'rain');
    const says = mine ? { ...pool, barks: mine } : pool;
    const when = whenOf(c);
    const rainy = wet && ['rain', 'northbank', 'south'].includes(c.region);
    people.forEach(([model, variant, metId], j) => {
      const met = metId ? NPCS[metId] : null;
      const sex = sexOf(model, variant) || 'm';
      const child = isChild(model);
      const old = OLD.includes(model);
      const base = (CAST_HEIGHT[model] || 1.72);
      const varied = Math.round(base * (1 + (r() - 0.5) * 0.072) * 100) / 100; // within ±4% (after rounding)
      const height = met ? met.height : varied;
      const walk = (old ? 0.8 : 1) * (1 + (r() - 0.5) * 0.16); // ±8%
      // where along the path, which way, a step to one side
      const f = (j + 0.5) / people.length;
      const at = along(c.path, f);
      // (a queue stands in line, each a step from the one ahead, facing its head: crowd.queue)
      const side0 = c.queue ? (j % 2 ? 0.12 : -0.12) : (r() - 0.5) * 1.4;
      const reverse = j % 2 === 1;
      // (the step to one side that leaves the most of the route to walk on the ground, the one drawn first if it can)
      let best = null;
      for (const side of [...new Set([side0, side0 / 2, 0, -side0 / 2, -side0])]) {
        let path = c.path.map(([x, z]) => [Math.round((x + side) * 100) / 100, Math.round((z + side * 0.6) * 100) / 100]);
        if (c.path.length > 1) {
          // walk on from where they stand: the waypoint ahead first (or, walking the other way, the one behind)
          const L = path.length;
          if (reverse) {
            const R = [...path].reverse(), s0 = L - 1 - at.seg;
            path = [...R.slice(s0), ...R.slice(0, s0)];
          } else path = [...path.slice(at.seg + 1), ...path.slice(0, at.seg + 1)];
        }
        const x = Math.round((at.x + side) * 100) / 100, z = Math.round((at.z + side * 0.6) * 100) / 100;
        const w = route(whenOf(c), x, z, c.y ?? level.heightAt?.(x, z) ?? 0, path);
        if (!w) continue;
        const len = w.path ? w.path.reduce((a, p, i) => a + (i ? Math.hypot(p[0] - w.path[i - 1][0], p[1] - w.path[i - 1][1]) : 0), 0) : 0;
        if (!best || len > best.len + 0.5) best = { x, z, y: w.y, path: w.path, len };
        if (len >= 2 * MIN_RUN && path.length > 1) break;
      }
      if (!best) return; // (nowhere on this route to stand)
      const { x, y, z, path } = best;
      const id = `crowd_${k++}`;
      const voices = pool.voices || {};
      const vlist = child ? voices.child : old ? voices[`old_${sex}`] : voices[sex];
      const props = [];
      if (rainy && UMBRELLA_ROLES.includes(c.role) && !child && j % 3 !== 2) props.push('umbrella');
      if (['researcher', 'surveyor', 'technician'].includes(c.role) && j % 2 === 0) props.push('clipboard');
      if (c.role === 'gardener' && j % 2 === 0) props.push('trowel');
      if (c.role === 'skywatcher' && j % 3 === 0) props.push('lantern');
      const first = met ? met.first : roleName(pool, c.role);
      levelCast.push({
        id, first, name: first.toUpperCase(), color: c.echo ? ECHO_GLOW[c.era] : '#4f6170', seed: 300 + k, pronoun: PRONOUN[sex] || PRONOUN.m, model, variant, height, walk,
        hairTint: met ? null : HAIR_TINTS[k % HAIR_TINTS.length], dark: rainy ? RAIN_DARK : null, props, crowd: true, era: c.era, crowdRole: c.role, ...(met ? { met: metId } : {}),
      });
      level.npcs.push({
        id, crew: id, first, ambient: true, crowd: true, seed: 300 + k, pronoun: PRONOUN[sex] || PRONOUN.m, pos: [x, y, z], height,
        yaw: c.queue ? Math.atan2(c.path[c.path.length - 1][0] - c.path[0][0], c.path[c.path.length - 1][1] - c.path[0][1]) + (r() - 0.5) * 0.5 : r() * 6.28,
        path: path?.length > 1 && !c.queue ? path : undefined, speed: Math.round(1.05 * walk * 100) / 100, when, silent: true, room: level.outdoorRoom || level.order[0],
        hologram: !!c.echo, ...(c.echo && !c.barks ? {} : { barks: c.barks || barksOf(says, k, old), barkEvery: 24 + (k % 4) * 3 }), // (a crowd may
        // say its own, an echo only its own; else every other line of its pool: neighbours share the walla, and the speech
        // budget holds)
        ...(c.flicker ? { flicker: true } : {}), // (between solid and hologram: Runtime.step)
        ...(c.freezeWhen || deck.crowdFreeze ? { freezeWhen: c.freezeWhen || deck.crowdFreeze } : {}), // (a crowd may stand still on its own condition)
        voiceExtra: { id: vlist?.[k % vlist.length] || null, gender: sex },
      });
    });
  });
  return cast.concat(levelCast);
}
