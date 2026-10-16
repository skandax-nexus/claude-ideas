// Who looks like what. Every person in the game is built here: the modelled,
// motion-captured cast from world/Actors.js once it has loaded, and the
// procedural humans as a fallback (e.g. if the model files are missing).
import { makeActor, actorsReady } from './Actors.js';
import { makeHuman, CAST_SPECS, randomCrewSpec } from './humans.js';
import { heroSpec } from '../ui/Heroes.js';
import { mulberry32 } from '../gen/rng.js';

// Heroes you can play (character select). Armoured suits take any colour.
export const HERO_LOOKS = {
  ren: { model: 'michelle', name: 'REN', role: 'Explorer', blurb: 'Round shades, headphones, quick feet. The one who keeps waking up.' },
  kai: { model: 'vanguard', tint: 0xe4ecff, name: 'KAI', role: 'Vanguard', blurb: 'Pearl-white armour and a sealed visor. Built for gravity that changes its mind.' },
  asha: { model: 'vanguard', name: 'ASHA', role: 'Field Engineer', blurb: 'Desert-worn plating, a tool for every bolt. Fixes doors by talking to them.' },
  leo: { model: 'vanguard', tint: 0xc9c3ee, name: 'LEO', role: 'Security', blurb: 'Lavender-grey plate. Watches the watchers.' },
  mira: { model: 'vanguard', tint: 0xbfeee0, name: 'MIRA', role: 'Medic', blurb: 'Mint-white armour. Steady hands, steadier nerves.' },
  noor: { model: 'xbot', tint: 0xf3c9b8, name: 'NOOR', role: 'Synthetic', blurb: 'A crew android with a gentle voice and a theory for everything.' },
};
export const SUIT_TINTS = [0xffffff, 0xe4ecff, 0xbfeee0, 0xffe0c2, 0xc9c3ee, 0xf6c9d4, 0xd6dde6, 0xfff1b8];

const tintable = (look) => look.model !== 'michelle';

export function heroLook(choice) {
  const base = HERO_LOOKS[choice?.id] || HERO_LOOKS.ren;
  const look = { ...base };
  if (choice?.tint !== undefined && tintable(look)) look.tint = choice.tint;
  return look;
}

export function canTint(choice) {
  return tintable(HERO_LOOKS[choice?.id] || HERO_LOOKS.ren);
}

// The player: the chosen hero.
export function makePlayerModel(choice) {
  if (actorsReady()) return makeActor(heroLook(choice));
  return makeHuman(heroSpec(choice));
}

// Named characters.
export function makeCastModel(who, choice) {
  if (!actorsReady()) return makeHuman(CAST_SPECS[who]);
  if (who === 'juno') return makeActor({ model: 'vanguard', tint: 0xb9ecc9, height: 1.72 });
  if (who === 'custodian') return makeActor({ model: 'xbot', hologram: true, glow: 0x6ff0d4, height: 1.9 });
  if (who === 'other') return makeActor({ ...heroLook(choice), hologram: true, glow: 0xc7a2ff });
  return makeActor({ model: 'xbot' });
}

const CREW_TINTS = [0xdfe9ff, 0xffe2c4, 0xd3f2e2, 0xe8dcff, 0xffd8de, 0xfff0bd, 0xd6dde6];

// Generated crew: alive crew wear coloured armour, echoes are holograms in their colour.
export function makeCrewModel(crew, { hologram = false, glow } = {}) {
  if (!actorsReady()) {
    return makeHuman({ ...randomCrewSpec(mulberry32(crew.seed)), hologram, glow });
  }
  if (hologram) return makeActor({ model: 'xbot', hologram: true, glow: glow || 0x8fe0ff, height: 1.7 + ((crew.seed || 0) % 20) / 100 });
  return makeActor({ model: 'vanguard', tint: CREW_TINTS[(crew.seed || 0) % CREW_TINTS.length], height: 1.72 + ((crew.seed || 0) % 14) / 100 });
}
