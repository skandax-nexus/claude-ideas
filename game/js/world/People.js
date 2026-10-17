// Who looks like what. Every person in the game is built here: the modelled,
// motion-captured cast from world/Actors.js once it has loaded, and the
// procedural humans as a fallback (e.g. if the model files are missing).
import { makeActor, actorsReady, actorLoaded } from './Actors.js';
import { makeHuman, CAST_SPECS, randomCrewSpec } from './humans.js';
import { mulberry32 } from '../gen/rng.js';

// You are always Ren; the character screen changes how Ren looks.
export const LOOKS = {
  nova: { model: 'nova', name: 'NOVA', blurb: 'Long hair, easy smile, oversized tee. Wakes up already curious.', colours: true, voice: 'f' },
  ren: { model: 'ren', name: 'STREET', blurb: 'Round shades, headphones, quick feet.', voice: 'f' },
  scifi: { model: 'scifi', name: 'FLIGHT SUIT', blurb: 'Station-issue flight suit, short hair, steady hands.', voice: 'f' },
  spacer: { model: 'spacer', name: 'SPACESUIT', blurb: 'Full pressure suit and helmet. Ready for any deck.', voice: 'm' },
};
export const HAIR = [0x7a4e3a, 0x2a211e, 0xc79a62, 0xe8e2d8, 0xd06a52, 0x6a74c8, 0x58b8a8, 0xe08fb0];
export const TOPS = [0xffffff, 0x2a3240, 0x8fc6e8, 0xf0c7d4, 0xbfe6cf, 0xf3d9a6, 0xb9a8e8, 0xe86a6a];
export const LOOK_DEFAULT = { id: 'nova', hair: HAIR[0], top: TOPS[1] };

export function heroLook(choice) {
  const id = LOOKS[choice?.id] ? choice.id : 'nova';
  const L = LOOKS[id];
  const look = { model: L.model };
  if (L.colours) {
    look.hair = choice?.hair ?? LOOK_DEFAULT.hair;
    look.top = choice?.top ?? LOOK_DEFAULT.top;
  }
  return look;
}

export const lookOf = (choice) => LOOKS[choice?.id] || LOOKS.nova;

// The player.
export function makePlayerModel(choice) {
  const look = heroLook(choice);
  if (actorLoaded(look.model)) return makeActor(look);
  if (actorsReady()) return makeActor({ model: 'ren' });
  return makeHuman(CAST_SPECS.ren);
}

// Named characters.
export function makeCastModel(who, choice) {
  if (!actorsReady()) return makeHuman(CAST_SPECS[who]);
  if (who === 'juno') return makeActor({ model: actorLoaded('w_adventurer') ? 'w_adventurer' : 'ren', height: 1.68 });
  if (who === 'custodian') return makeActor({ model: 'xbot', hologram: true, glow: 0x6ff0d4, height: 1.9 });
  if (who === 'other') return makeActor({ ...heroLook(choice), hologram: true, glow: 0xc7a2ff });
  return makeActor({ model: 'xbot' });
}

// Generated crew: people in everyday and work clothes; echoes are holograms of them in their colour.
const WOMEN = ['w_casual', 'w_suit', 'w_punk', 'w_worker', 'w_soldier', 'w_adventurer'];
const MEN = ['m_casual', 'm_hoodie', 'm_suit', 'm_punk', 'm_worker', 'm_swat', 'm_adventurer'];
export const CREW_MODELS = [...WOMEN, ...MEN];

export function crewModelKey(crew) {
  const pool = crew.pronoun?.their === 'her' ? WOMEN : crew.pronoun?.their === 'his' ? MEN : [...WOMEN, ...MEN];
  return pool[(crew.seed || 0) % pool.length];
}

export function makeCrewModel(crew, { hologram = false, glow } = {}) {
  if (!actorsReady()) return makeHuman({ ...randomCrewSpec(mulberry32(crew.seed)), hologram, glow });
  const key = crewModelKey(crew);
  const model = actorLoaded(key) ? key : CREW_MODELS.find(actorLoaded) || 'xbot';
  const height = (crew.pronoun?.their === 'her' ? 1.64 : 1.76) + ((crew.seed || 0) % 9) / 100;
  if (hologram) return makeActor({ model, hologram: true, glow: glow || 0x8fe0ff, height });
  return makeActor({ model, height });
}
