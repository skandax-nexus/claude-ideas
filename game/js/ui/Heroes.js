// Character select: six heroes to play as, each restylable (skin tone, hair,
// hairstyle, suit colour). Whoever you pick, the story calls you Ren -
// Subject Zero - and lets you decide how you remember yourself.
import { CAST_SPECS } from '../world/humans.js';

export const HEROES = {
  ren: { name: 'REN', role: 'Explorer', blurb: 'Light explorer suit and a coral pack. The one who keeps waking up.', spec: { ...CAST_SPECS.ren } },
  kai: {
    name: 'KAI', role: 'Pilot', blurb: 'Flight suit, visor up. Never met a gravity field they could not fly.',
    spec: { height: 1.8, build: 'average', sex: 'm', skin: 0x8f5a3c, hair: 0x1d1918, hairStyle: 'short', eyes: 0x3b2a1e, suit: 0xdfe9f5, trim: 0x5aa0e6, glow: 0x8fd0ff, armor: 0xf2f5f8, costume: 'pilot', headgear: true },
  },
  asha: {
    name: 'ASHA', role: 'Engineer', blurb: 'Tool harness, goggles, rolled sleeves. Fixes doors by talking to them.',
    spec: { height: 1.7, build: 'average', sex: 'f', skin: 0x5c3725, hair: 0x1d1918, hairStyle: 'bun', eyes: 0x3b2a1e, suit: 0xe8a25a, trim: 0x2f8f86, glow: 0xffd27a, armor: 0xf0ece4, costume: 'engineer', headgear: true },
  },
  mira: {
    name: 'MIRA', role: 'Medic', blurb: 'Clean whites and mint light. Steady hands, steadier nerves.',
    spec: { height: 1.66, build: 'slim', sex: 'f', skin: 0xf1c9aa, hair: 0xb08a5a, hairStyle: 'long', eyes: 0x4f7aa8, suit: 0xf6f8fa, trim: 0x3fbfb4, glow: 0x7ff5e0, armor: 0xeef4f6, costume: 'medic' },
  },
  leo: {
    name: 'LEO', role: 'Security', blurb: 'Plated shoulders, quiet voice. Watches the watchers.',
    spec: { height: 1.84, build: 'broad', sex: 'm', skin: 0xc08560, hair: 0x3d2c22, hairStyle: 'buzz', beard: true, eyes: 0x5a3a22, suit: 0x9aa8c8, trim: 0x6b7aa8, glow: 0xb0c4ff, armor: 0xeef2f8, costume: 'security', headgear: false },
  },
  noor: {
    name: 'NOOR', role: 'Scientist', blurb: 'Long coat, lavender light, a theory for everything.',
    spec: { height: 1.74, build: 'slim', sex: 'n', skin: 0xa86e4c, hair: 0x2c2220, hairStyle: 'undercut', eyes: 0x6e4e2c, suit: 0xc9c2f0, trim: 0xf6f7fb, glow: 0xb39cff, armor: 0xeef0f6, costume: 'scientist' },
  },
};

export const OPTIONS = {
  skin: [0xf7e0d0, 0xf1c9aa, 0xdcab84, 0xc08560, 0xa86e4c, 0x8f5a3c, 0x75462f, 0x47291c],
  hair: [0x1d1918, 0x3d2c22, 0x7a4a2a, 0x8a3f24, 0xd2b47e, 0xe4d9c4, 0x9a86d8, 0x6fb8c8],
  hairStyle: ['bob', 'short', 'long', 'ponytail', 'bun', 'undercut', 'buzz', 'bald'],
  suit: [0xf4f7fa, 0xdfe9f5, 0xe8a25a, 0x4fae84, 0x9aa8c8, 0xc9c2f0, 0xf0c8d8, 0xf2e2b0],
};

// settings.hero = { id, skin?, hair?, hairStyle?, suit? }
export function heroSpec(choice) {
  const h = HEROES[choice?.id] || HEROES.ren;
  const s = { ...h.spec };
  for (const k of ['skin', 'hair', 'hairStyle', 'suit']) if (choice && choice[k] !== undefined) s[k] = choice[k];
  return s;
}

export const hex = (n) => '#' + n.toString(16).padStart(6, '0');
