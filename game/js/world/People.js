// Who looks like what. Every person in the game is built here: the modelled,
// motion-captured cast from world/Actors.js once it has loaded, and the
// procedural humans as a fallback (e.g. if the model files are missing).
import { makeActor, actorsReady, actorLoaded } from './Actors.js';
import { makeHuman, CAST_SPECS, randomCrewSpec } from './humans.js';
import { mulberry32 } from '../gen/rng.js';

// You are always Ren; the character screen changes how Ren looks.
// The first two are realistic (photo-scanned people); the rest are the older,
// stylised looks, kept for whoever prefers them.
export const LOOKS = {
  real_f: { model: 'rb_ren_f', name: 'FIELD JACKET', blurb: 'Worn leather jacket, field trousers, boots. Looks like someone who has done this before.', voice: 'f' },
  real_m: { model: 'rb_ren_m', name: 'SHIRTSLEEVES', blurb: 'Sleeves rolled up, jeans, steady eyes. Ready to fix whatever this is.', voice: 'm' },
  nova: { model: 'nova', name: 'NOVA', blurb: 'Long hair, easy smile, oversized tee. Wakes up already curious.', colours: true, voice: 'f' },
  ren: { model: 'ren', name: 'STREET', blurb: 'Round shades, headphones, quick feet.', voice: 'f' },
  scifi: { model: 'scifi', name: 'FLIGHT SUIT', blurb: 'Station-issue flight suit, short hair, steady hands.', voice: 'f' },
  spacer: { model: 'spacer', name: 'SPACESUIT', blurb: 'Full pressure suit and helmet. Ready for any deck.', voice: 'm' },
  w_casual: { model: 'w_casual', name: 'CASUAL', blurb: 'White tee, rust trousers, nothing to prove.', voice: 'f' },
  w_suit: { model: 'w_suit', name: 'OFFICER', blurb: 'A sharp black suit from the bridge crew.', voice: 'f' },
  w_punk: { model: 'w_punk', name: 'PUNK', blurb: 'Pink crest, torn jeans, no patience for rules.', voice: 'f' },
  w_worker: { model: 'w_worker', name: 'ENGINEER', blurb: 'Hard hat and hi-vis: the ship is a job site.', voice: 'f' },
  w_soldier: { model: 'w_soldier', name: 'SECURITY', blurb: 'Field gear and boots. Watches the doors.', voice: 'f' },
  w_adventurer: { model: 'w_adventurer', name: 'EXPLORER', blurb: 'Backpack, khakis, boots made for decks.', voice: 'f' },
  m_casual: { model: 'm_casual', name: 'EASYGOING', blurb: 'Tee, jeans, red sneakers.', voice: 'm' },
  m_hoodie: { model: 'm_hoodie', name: 'HOODIE', blurb: 'Purple hoodie and shorts. Always comfortable.', voice: 'm' },
  m_suit: { model: 'm_suit', name: 'EXECUTIVE', blurb: 'Dark suit and tie, even at the end of the world.', voice: 'm' },
  m_punk: { model: 'm_punk', name: 'REBEL', blurb: 'Red crest and a vest that says "no".', voice: 'm' },
  m_worker: { model: 'm_worker', name: 'MECHANIC', blurb: 'Overalls and tools, fixes what breaks.', voice: 'm' },
  m_swat: { model: 'm_swat', name: 'TACTICAL', blurb: 'Armoured vest and helmet. Expects trouble.', voice: 'm' },
  m_adventurer: { model: 'm_adventurer', name: 'RANGER', blurb: 'Pack and field jacket, mapping every deck.', voice: 'm' },
};
export const HAIR = [0x7a4e3a, 0x2a211e, 0xc79a62, 0xe8e2d8, 0xd06a52, 0x6a74c8, 0x58b8a8, 0xe08fb0];
export const TOPS = [0xffffff, 0x2a3240, 0x8fc6e8, 0xf0c7d4, 0xbfe6cf, 0xf3d9a6, 0xb9a8e8, 0xe86a6a];
export const LOOK_DEFAULT = { id: 'real_f', hair: HAIR[0], top: TOPS[1] };

export function heroLook(choice) {
  const id = LOOKS[choice?.id] ? choice.id : LOOK_DEFAULT.id;
  const L = LOOKS[id];
  const look = { model: L.model };
  if (L.colours) {
    look.hair = choice?.hair ?? LOOK_DEFAULT.hair;
    look.top = choice?.top ?? LOOK_DEFAULT.top;
  }
  return look;
}

export const lookOf = (choice) => LOOKS[choice?.id] || LOOKS[LOOK_DEFAULT.id];

// the model Ren wears now: the crew never wear the same one
let wearing = null;

// The player.
export function makePlayerModel(choice) {
  const look = heroLook(choice);
  if (actorLoaded(look.model)) {
    wearing = look.model;
    return makeActor(look);
  }
  if (actorsReady()) {
    wearing = ['rb_ren_f', 'ren'].find(actorLoaded) || null;
    return makeActor({ model: wearing || 'ren' });
  }
  return makeHuman(CAST_SPECS.ren);
}

// Named characters.
export function makeCastModel(who, choice) {
  if (!actorsReady()) return makeHuman(CAST_SPECS[who]);
  if (who === 'juno') return makeActor({ model: ['rb_juno', 'w_adventurer', 'ren'].find(actorLoaded), height: 1.68 });
  if (who === 'custodian') return makeActor({ model: 'xbot', hologram: true, glow: 0x6ff0d4, height: 1.9 });
  if (who === 'other') return makeActor({ ...heroLook(choice), hologram: true, glow: 0xc7a2ff });
  return makeActor({ model: 'xbot' });
}

// Crew: realistic people dressed for their job, by role, then by pronoun
// (f: her, m: his; "their" picks from both). HALCYON's cast are named.
const BY_ROLE = {
  botanist: { f: ['rb_ren_f', 'rb_office_f'], m: ['rb_gardener_m'] },
  'cryo technician': { f: ['rb_doctor_f'], m: ['rb_doctor_m'] },
  navigator: { f: ['rb_pilot_f'], m: ['rb_captain_m'] },
  'chief engineer': { f: ['rb_ren_f', 'rb_pilot_f'], m: ['rb_engineer_m'] },
  medic: { f: ['rb_doctor_f'], m: ['rb_doctor_m'] },
  counselor: { f: ['rb_office_f'], m: ['rb_ren_m', 'rb_captain_m'] },
  archivist: { f: ['rb_office_f'], m: ['rb_ren_m', 'rb_doctor_m'] },
  captain: { f: ['rb_pilot_f'], m: ['rb_captain_m'] },
};
const BY_NAME = { kade: 'rb_engineer_m', osei: 'rb_pilot_f', theo: 'rb_gardener_m', varga: 'rb_office_f' };
export const CREW_REAL = {
  f: ['rb_pilot_f', 'rb_doctor_f', 'rb_office_f', 'rb_ren_f'],
  m: ['rb_captain_m', 'rb_doctor_m', 'rb_engineer_m', 'rb_gardener_m', 'rb_ren_m'],
};
// the older stylised crew, used only if the realistic people have not loaded
const WOMEN = ['w_casual', 'w_suit', 'w_punk', 'w_worker', 'w_soldier', 'w_adventurer'];
const MEN = ['m_casual', 'm_hoodie', 'm_suit', 'm_punk', 'm_worker', 'm_swat', 'm_adventurer'];
export const CREW_MODELS = [...CREW_REAL.f, ...CREW_REAL.m, ...WOMEN, ...MEN];

export function crewModelKey(crew) {
  const seed = crew.seed || 0;
  const sex = crew.pronoun?.their === 'her' ? 'f' : crew.pronoun?.their === 'his' ? 'm' : null;
  const ok = (k) => actorLoaded(k) && k !== wearing;
  if (BY_NAME[crew.id] && ok(BY_NAME[crew.id])) return BY_NAME[crew.id];
  const role = BY_ROLE[(crew.role || '').toLowerCase()];
  const pick = (list) => {
    const l = list.filter(ok);
    return l.length ? l[seed % l.length] : null;
  };
  const both = (r) => (sex ? r[sex] || [] : [...(r.f || []), ...(r.m || [])]);
  return (role && pick(both(role))) || pick(both(CREW_REAL)) || pick(sex === 'f' ? WOMEN : sex === 'm' ? MEN : [...WOMEN, ...MEN]) || null;
}

export function makeCrewModel(crew, { hologram = false, glow } = {}) {
  if (!actorsReady()) return makeHuman({ ...randomCrewSpec(mulberry32(crew.seed)), hologram, glow });
  const model = crewModelKey(crew) || 'xbot';
  const woman = /_f$|^w_/.test(model) || (model === 'xbot' && crew.pronoun?.their === 'her');
  const height = (woman ? 1.64 : 1.76) + ((crew.seed || 0) % 9) / 100;
  if (hologram) return makeActor({ model, hologram: true, glow: glow || 0x8fe0ff, height });
  return makeActor({ model, height });
}
