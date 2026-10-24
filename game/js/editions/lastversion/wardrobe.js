// THE LAST VERSION OF EARTH: what each person wears (OVERHAUL.md §6.1, §6.5).
//
// A variant dresses one model: parts hidden (the stethoscope, a cap), its colour maps recoloured by
// HSL rules, hair tinted, things carried (umbrellas, lanterns, staffs, a loupe, a beret). Rules:
//   { band: [u0, v0, u1, v1]   only texels in this rectangle of the map (image coordinates, v down)
//     lmin, lmax               only texels this light (HSL lightness, 0..1)
//     hue: [centre, width]     only texels of this hue (0..1, wrapping), and smin: at least this saturated
//     to: hue                  the new hue (0..1)
//     sat | sset               saturation multiplied | set
//     light | lset | lrange    lightness multiplied | set | lmin..lmax mapped onto [a, b]
//     skin: false              also recolour texels that look like this person's skin }
// Skin is protected with the avatar's own skin colour, sampled from the middle of its head map (a
// fixed skin mask takes ochre and red cloth for skin), and anything skin-hued in the map's corners,
// where every Rocketbox layout puts the hands. Each model and variant is recoloured once, on
// the GPU (a render to a texture, mipmapped), and cached; never on the CPU in the middle of play.
// The recoloured map leaves with the people who wear it (DeckWorld.freeLeft disposes it) and is made
// again the next time someone needs it.
import * as THREE from '../../../vendor/three.module.min.js';
import { clothe, hairdo, hairMass } from './garments.js';

const RAIN_DARK = 0.85; // Rain City's crowds: wet clothes read about 15% darker

// shorthands for the variant table
const ROSE = 0.965; // Mira's colour, #c4566a
// rb_child_m2's jersey: the middle of the map and the short sleeves on its sides (a jersey's hue is the boy's skin's
// too: a rule over the whole map dyed his shins)
const JERSEY = (rule) => [[0.32, 0, 0.68, 1], [0, 0.43, 0.32, 0.62], [0.68, 0.43, 1, 0.62]].map((band) => ({ band, ...rule }));
// ---------------------------------------------------------------------------------------------------
// The variants, per model. `default` is the model as converted. Colours follow OVERHAUL.md §6.2/§6.3.
// part names are the converted materials: body, head, hair, hat, helmet, equipment, keffiyeh, stetoskop
export const WARDROBE = {
  rb_ren_m: {
    kai: {},
    // the Witness: Kai after years without sleep: silver hair, a charcoal shirt, dark jeans
    witness: {
      body: [{ hue: [0.58, 0.12], smin: 0.08, lmin: 0.35, sset: 0.04, lrange: [0.2, 0.36] }],
      hair: [{ sset: 0.03, lrange: [0.6, 0.86] }],
      head: [{ band: [0, 0, 1, 0.3], lmax: 0.32, sset: 0.04, lrange: [0.42, 0.62] }],
    },
    // the Witness as Mission 8's reconstruction and Mission 6's 1999 keep him: the same charcoal, a deep hood up and his
    // face in its shadow (Mission 12 is where his face is seen). The hood is worn by his hologram too (holoProps)
    hooded: {
      hide: ['hair'], props: ['shadowHood'], holoProps: true,
      body: [{ hue: [0.58, 0.12], smin: 0.08, lmin: 0.35, sset: 0.04, lrange: [0.2, 0.36] }],
      head: [{ skin: false, light: 0.25 }],
    },
    // the memorial statue of Kai (M14): weathered stone
    stone: {
      body: [{ sset: 0.04, lrange: [0.34, 0.62], skin: false, to: 0.1 }], head: [{ sset: 0.04, lrange: [0.36, 0.64], skin: false, to: 0.1 }],
      hair: [{ sset: 0.04, lrange: [0.34, 0.6], to: 0.1 }],
    },
  },
  // (U4 review) Sera, Mara, Iven and the Gardener no longer wear Station Zero's faces (Juno's, Varga's, Kade's, Ren's
  // FIELD JACKET): their own avatars
  rb_sera: {
    default: {},
    // Sera: the belted leather jacket over a red scarf; jeans worn to dust and olive, boots
    resistance: { body: [{ band: [0, 0.55, 0.32, 0.92], lmin: 0.12, to: 0.16, sset: 0.16, light: 0.92 }, { band: [0.68, 0.55, 1, 0.92], lmin: 0.12, to: 0.16, sset: 0.16, light: 0.92 }] },
    // Sera disguised as a Continuum guard (M10): slate from collar to boots, the troopers' helmet and plate carrier
    guard: { body: [{ to: 0.6, sset: 0.14, lrange: [0.14, 0.4] }], hair: [{ lrange: [0.08, 0.2], sset: 0.1 }], props: ['helmet', 'vest'] },
  },
  rb_mara: {
    default: {},
    // Mara Quill: the archivist's suit, faded and patched by 2196
    faded: { body: [{ lmin: 0.15, sat: 0.55, light: 1.08 }] },
  },
  rb_iven: {
    default: {},
    // Iven Marr: Helix's slate overalls, a pale hard hat
    helix: { body: [{ hue: [0.6, 0.12], smin: 0.2, to: 0.58, sset: 0.12, lrange: [0.18, 0.4] }], helmet: [{ sset: 0.06, lrange: [0.62, 0.84], skin: false }] },
  },
  rb_gardener_f: {
    default: {},
    // the Gardener of 2196: a shirt dyed moss, jeans worn to earth, a trowel
    moss: { body: [{ hue: [0.97, 0.08], smin: 0.2, to: 0.25, sset: 0.3, light: 0.78 }, { hue: [0.6, 0.1], smin: 0.1, to: 0.09, sset: 0.18, light: 0.95 }], props: ['trowel'] },
  },
  rb_doctor_f: {
    default: { hide: ['stetoskop'] },
    // Dr. Anja Vale: the coat worn to a sage off-white
    anja: { hide: ['stetoskop'], body: [{ lmin: 0.55, to: 0.25, sset: 0.12, light: 0.9 }] },
  },
  rb_doctor_m: { default: { hide: ['stetoskop'] }, tan: { hide: ['stetoskop'], body: [{ hue: [0.6, 0.12], smin: 0.12, to: 0.09, sat: 0.7, light: 0.95 }] }, ward: {} },
  // --- the new named people ---------------------------------------------------------------------
  rb_child_m: {
    // young Kai at twelve: brown hair, a faded tee
    // (his hair is painted on the boy's head: his echoes, of one light, read bald, so they wear a short crop of their own,
    // close to the head, the brow clear: garments.js hairMass. Solid, his painted brown hair is his own)
    kai12: { body: [{ hue: [0.6, 0.1], smin: 0.35, sat: 0.6, light: 1.05 }], hairMass: { dye: '#3a2a20', fringe: 0.86, side: 1.5, nape: 1.95, lift: 0.007, locks: 0.07, seed: 3, holoOnly: true } },
  },
  rb_mira: {
    // Mira: a rose tunic, denim trousers, blonde hair (the tunic is the middle of the map; the trouser legs
    // its lower corners; the shoes its upper corners)
    mira: {
      body: [{ band: [0.33, 0, 0.67, 0.8], lmin: 0.45, to: ROSE, sset: 0.48, lrange: [0.3, 0.62] },
        { band: [0, 0.6, 0.3, 1], lmin: 0.4, to: 0.6, sset: 0.38, lrange: [0.22, 0.48] }, { band: [0.7, 0.6, 1, 1], lmin: 0.4, to: 0.6, sset: 0.38, lrange: [0.22, 0.48] }],
      hair: [{ to: 0.12, sset: 0.45, lrange: [0.45, 0.78] }],
      head: [{ band: [0, 0, 1, 0.3], lmax: 0.3, to: 0.12, sset: 0.4, lrange: [0.4, 0.6] }],
    },
    // M1: the woman in the rain: a yellow rain jacket and boots, darkened by the rain: the tunic and its sleeves to the
    // wrist dyed one yellow (the forearms are the band across the map at v 0.29-0.47; the shoes, rain boots now, the
    // map's upper sides), dark trousers, and the jacket's hood up
    raincoat: {
      // (her hair is under the hood, not hidden: Mira's own fair hair, as she is seen in Acts III-IV, the scalp's painting
      // dyed with it, should any of it show at the brim)
      props: ['raincoatHood'], hair: [{ to: 0.12, sset: 0.45, lrange: [0.45, 0.78] }],
      head: [{ band: [0, 0, 1, 0.3], lmax: 0.3, to: 0.12, sset: 0.4, lrange: [0.4, 0.6] }],
      body: [{ band: [0.33, 0, 0.67, 0.8], lmin: 0.45, to: 0.14, sset: 0.85, lrange: [0.34, 0.56] },
        { band: [0, 0, 0.33, 0.29], lmin: 0.45, to: 0.14, sset: 0.85, lrange: [0.34, 0.56] }, { band: [0.67, 0, 1, 0.29], lmin: 0.45, to: 0.14, sset: 0.85, lrange: [0.34, 0.56] },
        { band: [0, 0.29, 1, 0.47], to: 0.14, sset: 0.85, lrange: [0.3, 0.54], skin: false },
        { band: [0, 0.6, 0.3, 1], lmin: 0.4, to: 0.6, sset: 0.3, lrange: [0.16, 0.34] }, { band: [0.7, 0.6, 1, 1], lmin: 0.4, to: 0.6, sset: 0.3, lrange: [0.16, 0.34] }],
    },
    // M11, Ward 32: a pale hospital-blue gown
    gown: { body: [{ band: [0.3, 0, 1, 1], lmin: 0.4, to: 0.55, sset: 0.3, lrange: [0.62, 0.84] }, { band: [0, 0.3, 0.3, 1], lmin: 0.4, to: 0.55, sset: 0.3, lrange: [0.62, 0.84] }], hair: [{ to: 0.12, sset: 0.4, lrange: [0.45, 0.78] }] },
    // Dr. Lin: the same face, disguised: a white tunic, dark-brown hair in a bun, an ID lanyard
    lin: { body: [{ band: [0, 0.6, 0.3, 1], lmin: 0.4, to: 0.08, sset: 0.06, lrange: [0.16, 0.3] }, { band: [0.7, 0.6, 1, 1], lmin: 0.4, to: 0.08, sset: 0.06, lrange: [0.16, 0.3] }], hair: [{ to: 0.07, sset: 0.4, lrange: [0.08, 0.2] }], props: ['lanyard'] },
  },
  rb_child_f: {
    // the Child in the Station: a pink top, a blonde ponytail, yellow boots (the shoes: the map's upper corners)
    child: { body: [{ hue: [0.86, 0.08], smin: 0.4, to: 0.93, sat: 0.7, light: 1.25 }, { band: [0.2, 0, 0.35, 0.28], lmin: 0.35, to: 0.14, sset: 0.85, lrange: [0.42, 0.6] }, { band: [0.65, 0, 0.8, 0.28], lmin: 0.35, to: 0.14, sset: 0.85, lrange: [0.42, 0.6] }] },
    // Mira at nine in her own memory (M20): the same child, solid
    mira9: { body: [{ hue: [0.86, 0.08], smin: 0.4, to: 0.93, sat: 0.7, light: 1.25 }, { band: [0.2, 0, 0.35, 0.28], lmin: 0.35, to: 0.14, sset: 0.85, lrange: [0.42, 0.6] }, { band: [0.65, 0, 0.8, 0.28], lmin: 0.35, to: 0.14, sset: 0.85, lrange: [0.42, 0.6] }] },
  },
  rb_rook: {
    // Rook: waistcoat and shirtsleeves
    rook: {},
    // the Director of Continuity, years on: greyer
    old: { head: [{ band: [0, 0, 1, 0.3], lmax: 0.35, sset: 0.03, lrange: [0.45, 0.66] }], body: [{ lmax: 0.3, light: 1.2, sat: 0.6 }] },
  },
  rb_jun: {
    // Jun Park: a navy transit blazer, a line-41 amber tie
    transit: { body: [{ hue: [0.66, 0.12], smin: 0.05, to: 0.63, sset: 0.42, light: 1.15 }, { band: [0.42, 0.35, 0.58, 0.62], lmin: 0.35, to: 0.1, sset: 0.85, lrange: [0.4, 0.55] }] },
  },
  rb_security_f: {
    // Officer Pryce: Helix's black uniform and cap
    helix: {},
    // her recording in M2: the same face, as a hologram
  },
  rb_security_m: {
    // Officer Dale: a grey uniform
    grey: {},
  },
  rb_ezra: {
    // Ezra Moll: tweed worn as a workshop dust coat, a loupe
    ezra: { body: [{ lmin: 0.25, sat: 0.6, light: 1.12 }], props: ['loupe'] },
    // Ezra in 2026, an echo at sixty-five: grey-brown hair
    ezra65: { body: [{ lmin: 0.25, sat: 0.6, light: 1.12 }], hair: [{ sat: 0.5, lrange: [0.3, 0.5] }], props: ['loupe'] },
  },
  rb_engineer_f: {
    // Rhea Odum: hi-vis and a hard hat, darkened by the rain
    'rain-dark': { body: [{ light: 0.8 }], helmet: [{ light: 0.85 }] },
  },
  rb_soldier_m: {
    // Sergeant Brask: camouflage dyed the Continuum's slate
    continuum: { body: [{ hue: [0.2, 0.25], smin: 0, lmin: 0.08, to: 0.6, sset: 0.14, light: 0.82 }], head: [{ band: [0, 0.5, 0.9, 0.92], hue: [0.2, 0.25], lmin: 0.08, to: 0.6, sset: 0.14, light: 0.82 }] },
  },
  rb_odile: {
    // Nurse Odile: a pale-blue sweater over white, a navy scrub skirt, white shoes (not the denim and black heels)
    ward: { body: [{ band: [0, 0.3, 1, 0.75], lmin: 0.5, smin: 0, to: 0.57, sset: 0.32, lrange: [0.62, 0.8] },
      { band: [0, 0.55, 0.32, 0.8], lmax: 0.55, to: 0.61, sset: 0.34, lrange: [0.13, 0.24] }, { band: [0.68, 0.55, 1, 0.8], lmax: 0.55, to: 0.61, sset: 0.34, lrange: [0.13, 0.24] },
      { band: [0.15, 0, 0.34, 0.16], lmax: 0.35, sset: 0.03, lrange: [0.76, 0.9], skin: false }, { band: [0.66, 0, 0.85, 0.16], lmax: 0.35, sset: 0.03, lrange: [0.76, 0.9], skin: false }] },
  },
  rb_florist: {
    // the Florist: a wrap cardigan, a green apron
    florist: { body: [{ band: [0.25, 0.55, 0.75, 1], lmin: 0.3, to: 0.33, sset: 0.3, lrange: [0.24, 0.4] }] },
  },
  rb_warden: {
    // the District Warden: faded charcoal, the wardens' red beret
    warden: { body: [{ lmax: 0.5, sat: 0.4, lrange: [0.1, 0.36] }], equipment: [{ light: 0.9 }], props: ['beret'] },
  },
  // --- crowds (512 px) ------------------------------------------------------------------------
  rb_civ_f1: {
    detention: { body: [{ to: 0.58, sset: 0.05, lrange: [0.34, 0.56] }] }, dust: { body: [{ sat: 0.45, light: 1.12 }] },
    default: {}, plum: { body: [{ hue: [0.68, 0.1], smin: 0.15, to: 0.85, sat: 0.9 }] }, teal: { body: [{ hue: [0.68, 0.1], smin: 0.15, to: 0.5, sat: 0.9 }] },
    // the trapped woman (M1): soaked
    wet: { body: [{ light: 0.78 }] },
  },
  rb_civ_f2: {
    detention: { body: [{ to: 0.58, sset: 0.05, lrange: [0.34, 0.56] }] }, dust: { body: [{ sat: 0.45, light: 1.12 }] },
    default: {}, rose: { body: [{ band: [0.3, 0, 0.7, 0.6], lmin: 0.3, to: 0.97, sset: 0.35, light: 1 }] }, sand: { body: [{ band: [0.3, 0, 0.7, 0.6], lmin: 0.3, to: 0.1, sset: 0.3 }] },
    // Helix technicians: a slate coverall
    'coverall slate': { body: [{ to: 0.6, sset: 0.14, lrange: [0.2, 0.42] }] },
  },
  // (the tour: rb_civ_f3's and rb_civ_m1's variants dyed only their trims, and two of them walked the same street in the
  // same black hoodie or jacket, the same face twice: their black is dyed too, a moss or rust hoodie, a navy or olive coat)
  rb_civ_f3: { default: {}, dust: { body: [{ sat: 0.45, light: 1.12 }] },
    moss: { body: [{ hue: [0.35, 0.12], smin: 0.3, to: 0.24, sat: 0.6 }, { lmax: 0.3, to: 0.24, sset: 0.3, lrange: [0.12, 0.28] }] },
    rust: { body: [{ hue: [0.35, 0.12], smin: 0.3, to: 0.05, sat: 0.7 }, { lmax: 0.3, to: 0.05, sset: 0.42, lrange: [0.12, 0.28] }] } },
  rb_civ_m1: { default: {}, detention: { body: [{ to: 0.58, sset: 0.05, lrange: [0.34, 0.56] }] }, dust: { body: [{ sat: 0.45, light: 1.12 }] },
    navy: { body: [{ hue: [0.1, 0.12], smin: 0.15, to: 0.62, sat: 0.8, light: 0.8 }, { lmax: 0.3, to: 0.62, sset: 0.45, lrange: [0.12, 0.3] }] },
    olive: { body: [{ hue: [0.1, 0.12], smin: 0.15, to: 0.2, sat: 0.9 }, { lmax: 0.3, to: 0.2, sset: 0.38, lrange: [0.15, 0.33] }] } },
  rb_civ_m2: {
    detention: { body: [{ to: 0.58, sset: 0.05, lrange: [0.34, 0.56] }] }, dust: { body: [{ sat: 0.45, light: 1.12 }] },
    default: {}, brown: { body: [{ band: [0.3, 0, 0.7, 1], lmin: 0.2, to: 0.08, sset: 0.25 }] },
    // the Helix cleaner: an overall
    overall: { body: [{ to: 0.58, sset: 0.3, lrange: [0.2, 0.45] }] },
  },
  rb_courier: { default: {}, detention: { body: [{ to: 0.58, sset: 0.05, lrange: [0.34, 0.56] }] }, dust: { body: [{ sat: 0.45, light: 1.12 }] }, green: { body: [{ hue: [0.0, 0.06], smin: 0.3, to: 0.36, sat: 0.7, light: 0.9 }] }, blue: { body: [{ hue: [0.0, 0.06], smin: 0.3, to: 0.6, sat: 0.7, light: 0.9 }] } },
  rb_contractor: {
    default: {}, yellow: { body: [{ hue: [0.06, 0.06], smin: 0.4, to: 0.14 }] },
    // Helix technicians and the utility crews: slate
    'helix slate': { body: [{ hue: [0.06, 0.06], smin: 0.4, to: 0.6, sset: 0.12, light: 0.7 }, { hue: [0.6, 0.12], smin: 0.3, to: 0.6, sset: 0.14, light: 0.7 }], helmet: [{ to: 0.6, sset: 0.1, lrange: [0.6, 0.85] }] },
    utility: { body: [{ hue: [0.06, 0.06], smin: 0.4, to: 0.14 }, { hue: [0.6, 0.12], smin: 0.3, to: 0.6, sset: 0.2, light: 0.5 }] },
    // a prisoner of the dam's loop cells (M10): the hard hat gone, the detention grey
    detention: { hide: ['helmet'], body: [{ to: 0.58, sset: 0.05, lrange: [0.34, 0.56] }] },
  },
  rb_medic_f: { default: {}, dust: { body: [{ sat: 0.6, light: 1.08 }] }, night: { body: [{ hue: [0.62, 0.1], smin: 0.2, to: 0.64, sset: 0.5, light: 0.7 }] } },
  // (the jersey's #38 is painted out of the map itself, tools/rocketbox-textures.py TRANSPLANT: a number shared by the toy
  // boy, Tomas and 2196's children would read as a clue the story does not have)
  rb_child_m2: {
    default: {}, blue: { body: JERSEY({ hue: [0.07, 0.07], smin: 0.3, to: 0.58 }) }, green: { body: JERSEY({ hue: [0.07, 0.07], smin: 0.3, to: 0.33, sat: 0.8 }) },
    // M1's toy child: a red rain jacket (yellow is Mira's): the jersey dyed red, its sleeves to the wrist (the arms are
    // the map's sides at v 0.43-0.8), the hood up
    redcoat: { body: [JERSEY({ hue: [0.07, 0.07], smin: 0.3, to: 0.99, sset: 0.75, light: 0.9 })[0],
      { band: [0, 0.43, 0.32, 0.8], to: 0.99, sset: 0.75, lrange: [0.22, 0.42], skin: false }, { band: [0.68, 0.43, 1, 0.8], to: 0.99, sset: 0.75, lrange: [0.22, 0.42], skin: false }], props: ['raincoatChildHood'] },
    // 2196 children: patched, faded
    patched: { body: [...JERSEY({ hue: [0.07, 0.07], smin: 0.3, to: 0.12, sat: 0.4, light: 1.05 }), { band: [0.4, 0.45, 0.6, 0.6], lmin: 0.5, light: 0.6 }] },
    patched2: { body: JERSEY({ hue: [0.07, 0.07], smin: 0.3, to: 0.42, sat: 0.35 }) },
    patched3: { body: [...JERSEY({ hue: [0.07, 0.07], smin: 0.3, to: 0.08, sat: 0.45, light: 0.9 }), { band: [0.42, 0.5, 0.58, 0.62], lmin: 0.5, light: 0.7 }] },
  },
  rb_child_f2: {
    // (closing) a girl of 2196 in a head scarf, never of the settlement: there a scarf would be a modern garment's
    // a 2196 schoolgirl (M14): a faded blue smock, the head cloth a washed grey
    faded: { body: [{ to: 0.58, sset: 0.2, lrange: [0.4, 0.6] }], head: [{ hue: [0.93, 0.1], smin: 0.15, to: 0.6, sset: 0.06, lrange: [0.5, 0.68] }] },
  },
  rb_trooper: {
    // Continuum troops: slate blue-grey, helmeted
    continuum: { body: [{ to: 0.6, sset: 0.14, light: 0.75, lmin: 0.06 }], equipment: [{ to: 0.6, sset: 0.12, light: 0.7 }], helmet: [{ to: 0.6, sset: 0.12, light: 0.72 }] },
    // the Spire's elites: graphite, a lit visor
    elite: { body: [{ to: 0.62, sset: 0.05, light: 0.45, lmin: 0.06 }], equipment: [{ to: 0.62, sset: 0.04, light: 0.42 }], helmet: [{ to: 0.62, sset: 0.04, light: 0.4 }], props: ['visor'] },
  },
  rb_scav: {
    // 2196 scavengers: grey, olive or rust
    grey: { body: [{ sat: 0.4, light: 0.9 }] }, olive: { body: [{ lmin: 0.15, to: 0.2, sset: 0.25 }] }, rust: { body: [{ lmin: 0.15, to: 0.06, sset: 0.4, light: 0.9 }] },
    // temporal scavengers with the Continuum's closed-circle badge (M7) and a lantern
    lantern: { body: [{ lmin: 0.15, to: 0.6, sset: 0.12, light: 0.8 }], props: ['lantern', 'badge'] },
    // the Unwritten's irregulars (M13): rust hoods
    unwritten: { body: [{ lmin: 0.15, to: 0.06, sset: 0.5, light: 0.85 }], props: ['lantern'] },
    // a warden among the crowd: the wardens' charcoal
    warden: { body: [{ to: 0.6, sset: 0.06, lrange: [0.12, 0.3] }], props: ['beret'] },
  },
  // (faded: a khaki shirt over washed-out jeans; only paler, it was the default's blue shirt again on the same street)
  rb_trader: { default: {}, earth: { body: [{ hue: [0.58, 0.12], smin: 0.1, to: 0.08, sat: 0.9 }] },
    // the ticket keeper of the 41's old platform (M14, the Finale's road): the line's navy, faded, in a work shirt and
    // dark trousers, the amber strap of his ticket bag across him; no trader of 2196 wears it
    keeper: { body: [{ hue: [0.56, 0.14], smin: 0.04, lmin: 0.5, to: 0.62, sset: 0.3, lrange: [0.2, 0.38] }, { band: [0, 0, 0.31, 0.44], to: 0.62, sset: 0.06, lrange: [0.12, 0.28] },
      { band: [0.69, 0, 1, 0.44], to: 0.62, sset: 0.06, lrange: [0.12, 0.28] }], garb: { sash: { dye: '#c8962a', side: 'R', w: 0.05 } } },
    faded: { body: [{ hue: [0.58, 0.12], smin: 0.1, lmin: 0.45, to: 0.14, sset: 0.28, lrange: [0.5, 0.68] }, { hue: [0.58, 0.12], smin: 0.1, lmax: 0.45, sat: 0.4, light: 1.25 }] } },
  // (U4 review) more 2026/2049 faces: an older man in a shirt and khakis, a woman in a waistcoat and jeans; each has the
  // crowds' working wardrobes (a transit uniform, a lab white, the detention grey, dust)
  rb_civ_m3: {
    default: {}, blue: { body: [{ band: [0.3, 0.15, 0.7, 0.84], to: 0.58, sset: 0.3, lrange: [0.45, 0.68] }, { band: [0, 0.42, 0.32, 0.84], to: 0.58, sset: 0.3, lrange: [0.45, 0.68] }, { band: [0.68, 0.42, 1, 0.84], to: 0.58, sset: 0.3, lrange: [0.45, 0.68] }],
    },
    transit: { body: [{ band: [0.3, 0.15, 0.7, 0.84], to: 0.62, sset: 0.45, lrange: [0.16, 0.3] }, { band: [0, 0.42, 0.32, 0.84], to: 0.62, sset: 0.45, lrange: [0.16, 0.3] }, { band: [0.68, 0.42, 1, 0.84], to: 0.62, sset: 0.45, lrange: [0.16, 0.3] },
      { band: [0, 0, 0.3, 0.42], to: 0.62, sset: 0.2, lrange: [0.1, 0.2] }, { band: [0.7, 0, 1, 0.42], to: 0.62, sset: 0.2, lrange: [0.1, 0.2] }] },
    lab: { body: [{ band: [0.3, 0.15, 0.7, 0.84], sset: 0.03, lrange: [0.74, 0.9] }, { band: [0, 0.42, 0.32, 0.84], sset: 0.03, lrange: [0.74, 0.9] }, { band: [0.68, 0.42, 1, 0.84], sset: 0.03, lrange: [0.74, 0.9] }] },
    detention: { body: [{ to: 0.58, sset: 0.05, lrange: [0.34, 0.56] }] }, dust: { body: [{ sat: 0.45, light: 1.12 }] },
  },
  rb_civ_f4: {
    default: {}, plum: { body: [{ band: [0.3, 0.1, 0.7, 0.62], lmin: 0.2, to: 0.86, sset: 0.3 }] },
    transit: { body: [{ band: [0.3, 0.1, 0.7, 0.62], to: 0.62, sset: 0.45, lrange: [0.14, 0.3] }, { band: [0, 0.55, 0.3, 1], to: 0.62, sset: 0.2, lrange: [0.1, 0.2] }, { band: [0.7, 0.55, 1, 1], to: 0.62, sset: 0.2, lrange: [0.1, 0.2] }] },
    lab: { body: [{ band: [0.3, 0.1, 0.7, 0.62], sset: 0.03, lrange: [0.72, 0.9] }] },
    detention: { body: [{ to: 0.58, sset: 0.05, lrange: [0.34, 0.56] }] }, dust: { body: [{ sat: 0.45, light: 1.12 }] },
  },
  // 2196's gardeners, medics and archivists (Female_Adult_17: a tee, jeans): moss, rust, a faded blue, worn
  rb_surv_f: { default: { body: [{ sat: 0.6, light: 0.92 }] }, sage: { body: [{ hue: [0.4, 0.12], smin: 0.15, to: 0.27, sset: 0.3, light: 0.85 }, { hue: [0.6, 0.1], smin: 0.15, to: 0.09, sset: 0.22 }] },
    rust: { body: [{ hue: [0.4, 0.12], smin: 0.15, to: 0.05, sset: 0.45, light: 0.8 }, { hue: [0.6, 0.1], smin: 0.15, to: 0.1, sset: 0.18, light: 0.85 }] },
    faded: { body: [{ hue: [0.4, 0.12], smin: 0.15, to: 0.58, sset: 0.18, lrange: [0.45, 0.62] }, { hue: [0.6, 0.1], smin: 0.15, sat: 0.4, light: 1.15 }] } },
  xbot: { default: {}, hologram: {} },
};

// --- the settlement, three thousand years ago (closing) ---------------------------------------------------------------
// Its people wear wool and linen made for their bodies (garments.js): a tunic to the ankle (a boy's to the knee), a mantle
// on the shoulders, a cloak down the back or a sash across the chest, a belt, the bare head or tied-back hair; never
// Rocketbox's robe, kurta, hijab, abaya or head-cloth avatars (they are gone from the edition). Today's clothes under a
// tunic take its dye (skin and hair kept). Natural dyes: undyed and grey wool, walnut, madder, weld, woad.
export const DYE = {
  undyed: '#d2c4a4', flax: '#b9aa86', oat: '#a39272', grey: '#857a69', brown: '#5b4836', walnut: '#6a4a30', black: '#302a25',
  madder: '#8c3a2c', rose: '#a65a4a', weld: '#c2a04c', ochre: '#a5803a', saffron: '#bf8a30', woad: '#3d4f6d', sky: '#687c94',
  olive: '#646036', plum: '#583c48',
};
// a body map dyed one colour of the table (its texture's light and shade kept, a little brighter or darker)
export function dyeRule(name, o = {}) {
  const h = {};
  new THREE.Color(DYE[name]).getHSL(h, THREE.SRGBColorSpace);
  const r3 = (x) => Math.round(x * 1000) / 1000;
  return { to: r3(h.h), sset: r3(Math.min(0.85, h.s)), lrange: [r3(Math.max(0.04, h.l - 0.14)), r3(Math.min(0.9, h.l + 0.06))], ...o };
}
// Each place of the settlement dresses its people from its own palette (crowds.js PALETTE): the first fire's ochres and
// madder (M4), the river's woad and undyed linen (M5), the night sky-watchers' black wool and plum (M7), the road's feast
// colours (the Finale). An outfit: [tunic, mantle or cloak or sash, stripe, belt].
export const SETTLEMENT = {
  fire: [['ochre', 'madder', 'walnut', 'walnut'], ['undyed', 'walnut', 'madder', 'madder'], ['madder', 'undyed', 'black', 'black'], ['walnut', 'ochre', 'undyed', 'ochre'], ['flax', 'madder', 'ochre', 'brown']],
  water: [['woad', 'undyed', 'walnut', 'walnut'], ['undyed', 'woad', 'sky', 'brown'], ['sky', 'oat', 'woad', 'woad'], ['olive', 'flax', 'woad', 'brown'], ['oat', 'olive', 'woad', 'walnut']],
  sky: [['black', 'madder', 'weld', 'madder'], ['woad', 'grey', 'weld', 'black'], ['plum', 'black', 'undyed', 'black'], ['grey', 'woad', 'plum', 'plum'], ['brown', 'plum', 'weld', 'black']],
  fest: [['saffron', 'rose', 'undyed', 'madder'], ['rose', 'undyed', 'saffron', 'walnut'], ['sky', 'saffron', 'undyed', 'saffron'], ['undyed', 'madder', 'saffron', 'woad'], ['weld', 'sky', 'madder', 'madder']],
  // the first second (M22): the settlement as the fire left it, its dyes gone to ash and undyed grey
  ash: [['grey', 'black', 'undyed', 'black'], ['undyed', 'grey', 'brown', 'brown'], ['brown', 'undyed', 'grey', 'black'], ['oat', 'brown', 'black', 'grey'], ['black', 'oat', 'grey', 'brown']],
};
const D = (n) => DYE[n];
// Female_Adult_09's (the Elder's) body map: the cardigan and its shirt (the middle, the sides under her hands' corners),
// then her hands' corners, where her skin is kept
const ELDER_BODY = [[0.25, 0, 0.75, 1], [0, 0.27, 0.25, 1], [0.75, 0.27, 1, 1], [0, 0, 0.25, 0.27], [0.75, 0, 1, 0.27]];
// the cuts: a man's tunic to the shin, a woman's and an elder's to the ankle (wider), a child's narrower; a boy's to the knee
const CUT = {
  man: (t, o, st, b, i) => ({ skirt: { dye: D(t), stripe: D(st), hem: 0.14, flare: 1.12 }, bodice: { dye: D(t) }, ...(i % 2 ? { cloak: { dye: D(o), stripe: D(st), open: 0.55 } } : { mantle: { dye: D(o), stripe: D(st) } }), belt: { dye: D(b) } }),
  woman: (t, o, st, b, i) => ({ skirt: { dye: D(t), stripe: D(st), hem: 0.05, flare: 1.25 }, bodice: { dye: D(t) }, ...(i % 2 ? { sash: { dye: D(o), side: i % 4 === 1 ? 'L' : 'R' } } : { mantle: { dye: D(o), stripe: D(st), front: 0.2, back: 0.34 } }), belt: { dye: D(b) } }),
  elder: (t, o, st, b) => ({ skirt: { dye: D(t), stripe: D(st), hem: 0.05, flare: 1.1 }, bodice: { dye: D(t) }, cloak: { dye: D(o), stripe: D(st), hem: 0.12, open: 0.5 }, belt: { dye: D(b) } }),
  boy: (t, o, st, b) => ({ skirt: { dye: D(t), stripe: D(st), hem: 0.3, flare: 1.06, ease: 0.014 }, belt: { dye: D(b) } }),
  girl: (t, o, st, b, i) => ({ skirt: { dye: D(t), stripe: D(st), hem: 0.05, flare: 1.1, ease: 0.014 }, ...(i % 2 ? { sash: { dye: D(o), side: 'L', w: 0.06 } } : { belt: { dye: D(b) } }) }),
};
// the one boy's body's jersey and sleeves (rb_child_m2): only those bands are dyed, his skin is the jersey's hue
const JERSEY_DYE = (name) => JERSEY(dyeRule(name));
// (Female_Adult_05's blazer is pink, a colour the dye would take for her skin and leave: dyed all over but for the map's
// corners, where her hands are)
const OUT_OF_CORNERS = [[0.25, 0, 0.75, 1], [0, 0.17, 0.25, 0.83], [0.75, 0.17, 1, 0.83]];
const BODY_DYE = { rb_vill_f: (t) => OUT_OF_CORNERS.map((band) => dyeRule(t, { band, skin: false })) };
function settlementVariants() {
  const out = { rb_vill_m: {}, rb_vill_m2: {}, rb_vill_f: {}, rb_vill_f2: {}, rb_elder_m: {}, rb_sage_m: {}, rb_child_m2: {} };
  const kind = { rb_vill_m: 'man', rb_vill_m2: 'man', rb_vill_f: 'woman', rb_vill_f2: 'woman', rb_elder_m: 'elder', rb_sage_m: 'elder' };
  for (const [pal, outfits] of Object.entries(SETTLEMENT)) {
    outfits.forEach(([t, o, st, b], k) => {
      const i = k + 1;
      for (const [m, kd] of Object.entries(kind)) {
        // (the two men and the two women wear each outfit differently: the second's cut is the other one)
        const j = m.endsWith('2') ? i + 1 : i;
        out[m][`${pal}${i}`] = { body: BODY_DYE[m] ? BODY_DYE[m](t) : [dyeRule(t)], garb: CUT[kd](t, o, st, b, j), ...(kd === 'elder' ? { props: ['staff'] } : {}) };
      }
      out.rb_child_m2[`${pal}_boy${i}`] = { body: JERSEY_DYE(t), garb: CUT.boy(t, o, st, b, i) };
      // a girl wears one of the settlement's women's hair (tied back, or loose to the shoulder)
      out.rb_child_m2[`${pal}_girl${i}`] = { body: JERSEY_DYE(t), garb: CUT.girl(t, o, st, b, i), hairdo: { from: i % 2 ? 'rb_vill_f2' : 'rb_vill_f' } };
    });
  }
  return out;
}
for (const [m, vs] of Object.entries(settlementVariants())) WARDROBE[m] = { ...(WARDROBE[m] || {}), ...vs };
// the settlement's named people and its people placed by hand
Object.assign(WARDROBE, {
  rb_niko: {
    // Niko, keeper of the settlement (Male_Adult_09: his own black hair, long and tied back; Male_Adult_15's woven cap
    // read as a present-day prayer cap and is gone): an undyed linen tunic to the shin, a woad mantle
    niko: { body: [dyeRule('flax')],
      garb: { skirt: { dye: D('flax'), stripe: D('walnut'), hem: 0.12, flare: 1.12 }, bodice: { dye: D('flax') }, mantle: { dye: D('woad'), stripe: D('undyed') }, belt: { dye: D('walnut') } } },
  },
  rb_niko_old: {
    // Niko, an old man (M7's cold open): the same face aged in his model's own maps (tools/rocketbox-textures.py 'age_m':
    // salt-and-pepper hair and tail, lines at the brow, the eyes and the mouth, a short grey beard, paler skin; greying
    // the young man's black hair alone left a man of thirty with grey hair), in oat wool and a woad cloak, a staff
    older: { body: [dyeRule('oat')],
      garb: { skirt: { dye: D('oat'), stripe: D('walnut'), hem: 0.1, flare: 1.12 }, bodice: { dye: D('oat') }, cloak: { dye: D('woad'), stripe: D('undyed') }, belt: { dye: D('walnut') } }, props: ['staff'] },
  },
  rb_tala: {
    // Tala, the water keeper: an indigo tunic, an undyed mantle (the bible's "undyed scarf", worn on the shoulders), her
    // hair tied up out of the water
    tala: { body: [dyeRule('woad')], garb: { skirt: { dye: D('woad'), stripe: D('undyed'), hem: 0.06, flare: 1.2 }, bodice: { dye: D('woad') }, mantle: { dye: D('undyed'), stripe: D('woad'), front: 0.2, back: 0.32 }, belt: { dye: D('madder') } } },
  },
  rb_elder: {
    // the Elder: a madder-red wool robe to the ground, a dark cloak, a staff and a slow, stooped walk. Her face is aged in
    // her model's own maps (tools/rocketbox-textures.py 'age': silver hair, lines at the brow, the eyes, the mouth and the
    // neck, paler skin); the wardrobe keeps her hair cards silver whatever the light. In an echo (M19, M22) her staff is
    // of its light (holoProps), her back as bent, and her silver hair cards a pale light where a dark head of hair is dim
    // (her body map's cardigan and shirt are dyed as cloth, not kept as skin, everywhere but her hands: her face's paler
    // skin, which the dye's skin guard is sampled from, is near enough the cardigan's brown to have left squares of it)
    elder: { body: ELDER_BODY.map((band, i) => dyeRule('madder', { band, ...(i < 3 ? { skin: false } : {}) })), hair: [{ sset: 0.03, light: 1.06, skin: false }], stoop: 0.42, holoProps: true,
      garb: { skirt: { dye: D('madder'), stripe: D('weld'), hem: 0.03, flare: 1.15 }, bodice: { dye: D('madder') }, cloak: { dye: D('brown'), stripe: D('weld'), hem: 0.08 }, belt: { dye: D('weld') } }, props: ['staff'] },
  },
});
// (M4's storyteller by the fire, M7's astronomer: elders placed by hand, in clothes no one in the crowd wears)
WARDROBE.rb_elder_m.storyteller = { body: [dyeRule('walnut')], garb: { skirt: { dye: D('walnut'), stripe: D('madder'), hem: 0.05, flare: 1.1 }, bodice: { dye: D('walnut') }, cloak: { dye: D('madder'), stripe: D('black'), hem: 0.1, open: 0.5 }, belt: { dye: D('black') } }, props: ['staff'] };
WARDROBE.rb_sage_m.astronomer = { body: [dyeRule('woad')], garb: { skirt: { dye: D('woad'), stripe: D('weld'), hem: 0.04, flare: 1.1 }, bodice: { dye: D('woad') }, cloak: { dye: D('black'), stripe: D('weld'), hem: 0.1, open: 0.5 }, belt: { dye: D('weld') } }, props: ['staff'] };

// the settlement's girls are the crowds' one boy's body with a woman's hair (garments.js hairdo): theirs is 'f'
for (const [k, v] of Object.entries(WARDROBE.rb_child_m2)) if (/_girl\d$/.test(k)) v.sex = 'f';
// the people of the settlement placed by hand: M4's craftswoman and the girl who lost her ring, M5's potter, mother and
// water keeper (in clothes the crowd does not wear)
Object.assign(WARDROBE.rb_vill_f2, { craft: { body: [dyeRule('walnut')], garb: { skirt: { dye: D('walnut'), stripe: D('ochre'), hem: 0.05, flare: 1.2 }, bodice: { dye: D('walnut') }, apron: { dye: D('undyed'), hem: 0.3 }, belt: { dye: D('ochre') } } } });
Object.assign(WARDROBE.rb_vill_m, { potter: { body: [dyeRule('oat')], garb: { skirt: { dye: D('oat'), stripe: D('brown'), hem: 0.16, flare: 1.1 }, bodice: { dye: D('oat') }, apron: { dye: D('brown'), hem: 0.4 }, belt: { dye: D('brown') } } } });
Object.assign(WARDROBE.rb_vill_f, { mother: { body: OUT_OF_CORNERS.map((band) => dyeRule('olive', { band, skin: false })), garb: { skirt: { dye: D('olive'), stripe: D('undyed'), hem: 0.05, flare: 1.25 }, bodice: { dye: D('olive') }, mantle: { dye: D('undyed'), front: 0.2, back: 0.34 }, belt: { dye: D('walnut') } } } });
Object.assign(WARDROBE.rb_vill_m2, { keeper: { body: [dyeRule('woad')], garb: { skirt: { dye: D('woad'), stripe: D('undyed'), hem: 0.14, flare: 1.12 }, bodice: { dye: D('woad') }, sash: { dye: D('undyed'), side: 'R' }, belt: { dye: D('walnut') } } } });
Object.assign(WARDROBE.rb_child_m2, {
  // M4's girl: undyed linen and a madder sash, her hair loose to the shoulder (it is her ring the player finds)
  girl_m4: { sex: 'f', body: JERSEY_DYE('undyed'), garb: { skirt: { dye: D('undyed'), stripe: D('madder'), hem: 0.05, flare: 1.1, ease: 0.014 }, sash: { dye: D('madder'), side: 'L', w: 0.06 } }, hairdo: { from: 'rb_vill_f2' } },
  girl_m5: { sex: 'f', body: JERSEY_DYE('sky'), garb: { skirt: { dye: D('sky'), stripe: D('undyed'), hem: 0.05, flare: 1.1, ease: 0.014 }, belt: { dye: D('walnut') } }, hairdo: { from: 'rb_vill_f' } },
});

// --- today's crowds, place by place (closing) ---------------------------------------------------------------------------
// The casual crowds of a place wear its own colours (crowds.js PALETTE), so Rain City's wet morning, Old Town's autumn,
// Loop City's summer before the war, the lock city's winter, the frozen first second and Afterzero's morning do not dress
// the same few people alike: each body's main garment (its coat, jacket, blouse, flannel, waistcoat) takes the palette's
// colours, the rest as it was.
export const PRESENT_PALETTES = {
  rain: ['#2c3a52', '#3a3d42', '#2f4a3a', '#5a2a32', '#8a6a44', '#4a5866'], // navy, charcoal, bottle, wine, camel, slate
  autumn: ['#b08a2e', '#8c4a2a', '#2f6a6a', '#9a7a52', '#cfc4aa', '#5a3a52'], // mustard, rust, teal, camel, cream, plum
  summer: ['#e2e0d8', '#7aa2c8', '#d0705a', '#8ac0a2', '#d8c050', '#d08aa0'], // white, sky, coral, mint, yellow, pink
  winter: ['#3c4a5e', '#6a2a2a', '#55606a', '#2a3a34', '#8a8070', '#40364a'], // the lock city's fans of 2049: dark wool
  grey: ['#7a7a78', '#5a5c60', '#8a8478', '#4a4a4c', '#9a9a96', '#66625a'], // the first second, drained
  bright: ['#d09a30', '#c0607a', '#6a9ac8', '#7ab896', '#e6e2d6', '#d07a5a'], // saffron, rose, sky, mint, white, coral
  midday: ['#2a3e66', '#d8d4c8', '#7a2e3a', '#3a5a4a', '#b89a6a', '#5c6670'], // 2049's downtown at noon: cobalt, stone, burgundy
  ward: ['#8a84a8', '#8aa08a', '#d6cfbf', '#7d93ad', '#9a8a7a', '#b88a90'], // the hospital's visitors: lavender, sage, cream
  memory: ['#b8a07a', '#9a7a5a', '#c8b8a0', '#8a9a8a', '#a88a7a', '#7a6a5a'], // Mira's memory (M20): a faded photograph's
};
// each body's main garment, as recolour selectors (the variants' own, without their colour)
const MAIN = {
  rb_civ_f1: [{ hue: [0.68, 0.1], smin: 0.15 }],
  rb_civ_f2: [{ band: [0.3, 0, 0.7, 0.6], lmin: 0.3 }],
  rb_civ_m1: [{ lmax: 0.3 }],
  rb_civ_m2: [{ band: [0.3, 0, 0.7, 1], lmin: 0.2 }],
  rb_civ_m3: [{ band: [0.3, 0.15, 0.7, 0.84] }, { band: [0, 0.42, 0.32, 0.84] }, { band: [0.68, 0.42, 1, 0.84] }],
  rb_civ_f4: [{ band: [0.3, 0.1, 0.7, 0.62] }],
  rb_courier: [{ hue: [0.0, 0.06], smin: 0.3 }],
};
const hexRule = (hex, sel) => {
  const h = {};
  new THREE.Color(hex).getHSL(h, THREE.SRGBColorSpace);
  const r3 = (x) => Math.round(x * 1000) / 1000;
  return { ...sel, to: r3(h.h), sset: r3(Math.min(0.8, h.s)), lrange: [r3(Math.max(0.04, h.l - 0.12)), r3(Math.min(0.92, h.l + 0.06))] };
};
for (const [pal, cols] of Object.entries(PRESENT_PALETTES)) {
  for (const [m, sels] of Object.entries(MAIN)) cols.forEach((hex, i) => { WARDROBE[m][`${pal}${i + 1}`] = { body: sels.map((sel) => hexRule(hex, sel)) }; });
}
// (closing) soot: the second look of people caught in a disaster (Loop City, the war's port), so a crowd of them is not
// the same few in the same dust
for (const m of ['rb_civ_f1', 'rb_civ_f2', 'rb_civ_m1', 'rb_civ_m2', 'rb_courier', 'rb_civ_m3', 'rb_civ_f4']) WARDROBE[m].soot = { body: [{ sat: 0.3, light: 0.72 }] };
// (closing) Helix at work: a lab coat (a cloak open at the front, hemmed at the knee) over a white top; the technicians'
// slate work uniform on the paramedic's body (its reflective bands kept); a cook's white top and apron (M21)
const LABCOAT = { cloak: { dye: '#e4e4e0', hem: 0.5, open: 0.42, fit: true } };
WARDROBE.rb_civ_f4.labcoat = { body: [{ band: [0.3, 0.1, 0.7, 0.62], sset: 0.03, lrange: [0.74, 0.9] }, { band: [0, 0, 0.3, 0.55], sset: 0.03, lrange: [0.7, 0.88] }, { band: [0.7, 0, 1, 0.55], sset: 0.03, lrange: [0.7, 0.88] }], garb: LABCOAT, props: ['lanyard'] };
WARDROBE.rb_civ_m3.labcoat = { body: [{ band: [0.3, 0.15, 0.7, 0.84], sset: 0.03, lrange: [0.74, 0.9] }, { band: [0, 0.42, 0.32, 0.84], sset: 0.03, lrange: [0.74, 0.9] }, { band: [0.68, 0.42, 1, 0.84], sset: 0.03, lrange: [0.74, 0.9] }], garb: LABCOAT, props: ['clipboard'] };
WARDROBE.rb_medic_f['helix tech'] = { body: [{ hue: [0.62, 0.1], smin: 0.2, to: 0.6, sset: 0.14, lrange: [0.16, 0.36] }] };
WARDROBE.rb_civ_f2.cook = { body: [{ band: [0.3, 0, 0.7, 0.6], sset: 0.03, lrange: [0.76, 0.92] }, { hue: [0.6, 0.1], smin: 0.1, to: 0.6, sset: 0.06, lrange: [0.12, 0.24] }], garb: { apron: { dye: '#ece8dc', hem: 0.38 }, belt: { dye: '#ece8dc', w: 0.03 } } };
// the receptionist: Helix's navy suit; Officer Haig at home (her recording)
WARDROBE.rb_desk_f = { 'helix desk': { body: [{ lmax: 0.3, to: 0.62, sset: 0.3, lrange: [0.08, 0.2] }] } };
WARDROBE.rb_haig = { home: {} };
// Tomas Vale, thirteen, in the lock city's school of 2196 (an echo): a boy's body (Male_Child_01, his own sandy hair and
// freckles in his model's maps), a brick-red school jersey under a grey-green wool coat to the knee, buttoned (a fitted
// coat: garments.js), which his echo wears too: no crowd child of 2196 wears a coat, nor young Kai
WARDROBE.rb_tomas = { school: { body: [{ hue: [0.6, 0.1], smin: 0.3, to: 0.025, sset: 0.42, lrange: [0.2, 0.42] }], garb: { cloak: { dye: '#56604f', stripe: '#3c4238', hem: 0.36, open: 0.3, fit: true } },
  hairMass: { dye: '#d2ac78', fringe: 1.28, side: 1.9, nape: 2.25, lift: 0.019, locks: 0.24, seed: 7 } } };
// The glazier Kai holds the frame for on Helix's roof (M12), who is at the Spire's glass (M21) and on the road (M23): a face
// of her own (Business_Female_04), her hair dyed copper, a petrol work jacket (the suit's jacket dyed, its pinstripe
// gone to a twill), charcoal work trousers, a leather bib apron and tool belt, and a suction lifter for the panes. No one
// else, crowd or named, wears her body
const GLAZIER_HAIR = [[0, 0, 1, 0.17], [0, 0.17, 0.3, 0.55], [0.7, 0.17, 1, 0.55], [0.5, 0.64, 1, 1]];
const PETROL = { to: 0.5, sset: 0.4, lrange: [0.18, 0.42], lmax: 0.7 };
WARDROBE.rb_glazier = { glazier: {
  body: [{ band: [0.33, 0, 0.67, 0.86], ...PETROL }, { band: [0, 0.12, 0.33, 0.48], ...PETROL }, { band: [0.67, 0.12, 1, 0.48], ...PETROL },
    { band: [0, 0.55, 0.33, 1], to: 0.08, sset: 0.12, lrange: [0.1, 0.26] }, { band: [0.67, 0.55, 1, 1], to: 0.08, sset: 0.12, lrange: [0.1, 0.26] }],
  hair: [{ to: 0.045, sset: 0.66, lrange: [0.24, 0.58], skin: false }],
  head: GLAZIER_HAIR.map((band) => ({ band, lmax: 0.36, to: 0.045, sset: 0.6, lrange: [0.2, 0.48], skin: false })),
  garb: { apron: { dye: '#9a683c', hem: 0.4, wide: 1.2, bib: 0.02, bibWide: 0.62, leather: true }, belt: { dye: '#3a2a1e', w: 0.05 } },
  props: ['glassLifter'],
} };

// --- the props --------------------------------------------------------------------------------------
// built from primitives, once (their geometry and materials are shared and kept); each: where it hangs
// (handR, handL, head, chest or root) and whether it stays upright in the world whatever the hand does
const keepGeo = (g) => { g.userData.keep = true; return g; };
const keepMat = (m) => { m.userData.keep = true; return m; };
let PROPS = null;
function propKit() {
  if (PROPS) return PROPS;
  const M = (o) => keepMat(new THREE.MeshStandardMaterial({ roughness: 0.6, ...o }));
  const mats = {
    canopy: M({ color: 0x1d2228, roughness: 0.35, side: THREE.DoubleSide }), canopy2: M({ color: 0x3a2a3c, roughness: 0.35, side: THREE.DoubleSide }), canopy3: M({ color: 0x23384a, roughness: 0.35, side: THREE.DoubleSide }),
    steel: M({ color: 0x9aa2aa, metalness: 0.7, roughness: 0.35 }), wood: M({ color: 0x6a4a2c, roughness: 0.8 }), brass: M({ color: 0xb08a3a, metalness: 0.8, roughness: 0.35 }),
    glow: keepMat(new THREE.MeshBasicMaterial({ color: 0xffd08a })), card: M({ color: 0xf4f4f0 }), strap: M({ color: 0x2a4a8a }), beret: M({ color: 0x9a1c1c, roughness: 0.9 }),
    visor: keepMat(new THREE.MeshBasicMaterial({ color: 0x8fd8ff })), badge: M({ color: 0xc8ccd2, metalness: 0.6, roughness: 0.3 }), board: M({ color: 0x5a4a3a }), paper: M({ color: 0xe8e4d8 }),
    // rain gear (wet: low roughness), the troopers' slate kit
    rainYellow: M({ color: 0xc99a12, roughness: 0.32, side: THREE.DoubleSide }), rainRed: M({ color: 0x9c1c22, roughness: 0.32, side: THREE.DoubleSide }),
    // a hood's outside and its lining, in shadow (the lining lit as brightly as the outside made a disc behind the head)
    rainYellowOut: M({ color: 0xc99a12, roughness: 0.32 }), rainYellowIn: M({ color: 0x4a3808, roughness: 0.6, side: THREE.BackSide }),
    rainRedOut: M({ color: 0x9c1c22, roughness: 0.32 }), rainRedIn: M({ color: 0x3a0a0e, roughness: 0.6, side: THREE.BackSide }),
    slate: M({ color: 0x3c4652, roughness: 0.55, side: THREE.DoubleSide }), plate: M({ color: 0x4a5664, roughness: 0.7 }),
    lens: M({ color: 0x141a22, metalness: 0.4, roughness: 0.12, side: THREE.DoubleSide }),
    rubber: M({ color: 0x1b1d20, roughness: 0.75 }), lifter: M({ color: 0xc8501e, roughness: 0.45 }),
    // the Witness's hood, and the dark inside it where a face would be
    hoodCloth: M({ color: 0x1c2026, roughness: 0.9, side: THREE.DoubleSide }), shade: keepMat(new THREE.MeshBasicMaterial({ color: 0x040405, side: THREE.DoubleSide })),
  };
  // a raincoat's hood, up: a shell round the top, sides and back of the head down to the jaw, open at the face (a sphere
  // less a wedge about +Z), about the middle of the wearer's head ([x, y, z] in the head bone's frame) with its radii
  // cap: a raincoat's hood is closed over the crown down to the hairline (that angle from the top, in radians) and open
  // only round the face below it; without one the wedge runs up to the crown (the Witness's deep hood, whose opening the
  // shade fills). (Seen from in front, a hood open to the crown showed its far side as a disc behind the head: a halo)
  // lining: a second material for the inside (the outside then only on its front faces); open: half the opening's angle
  // round the face (radians), its edges as far back as the temples at 0.78
  const hood = (mat, [x, y, z], [rx, ry, rz], cap = 0, lining = null, open = 0.78) => {
    const shell = (m) => {
      const h = mesh(new THREE.SphereGeometry(1, 18, 10, Math.PI / 2 + open, Math.PI * 2 - open * 2, cap, 2.15 - cap), m, x, y, z);
      h.scale.set(rx, ry, rz);
      if (!cap) return [h];
      const c = mesh(new THREE.SphereGeometry(1, 18, 4, 0, Math.PI * 2, 0, cap), m, x, y, z);
      c.scale.set(rx, ry, rz);
      return [h, c];
    };
    const parts = [...shell(mat), ...(lining ? shell(lining) : [])];
    return parts.length === 1 ? parts[0] : group(...parts);
  };
  const mesh = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(keepGeo(geo), mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    return m;
  };
  const group = (...c) => { const g = new THREE.Group(); g.add(...c); return g; };
  PROPS = {
    // an open umbrella held over the head: the canopy sits above the hand, the shaft runs down to it
    umbrella: { at: 'handR', upright: true, make: (i = 0) => group(
      mesh(new THREE.ConeGeometry(0.56, 0.24, 10, 1, true), [mats.canopy, mats.canopy2, mats.canopy3][i % 3], 0, 0.98, 0),
      mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.0, 5), mats.steel, 0, 0.42, 0)) },
    lantern: { at: 'handR', upright: true, make: () => group(
      mesh(new THREE.BoxGeometry(0.12, 0.16, 0.12), mats.brass, 0, -0.16, 0), mesh(new THREE.SphereGeometry(0.045, 8, 6), mats.glow, 0, -0.16, 0),
      mesh(new THREE.TorusGeometry(0.045, 0.006, 4, 10), mats.brass, 0, -0.05, 0)) },
    staff: { at: 'handR', upright: true, make: () => group(mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.7, 6), mats.wood, 0, -0.1, 0)) },
    trowel: { at: 'handR', make: () => group(mesh(new THREE.BoxGeometry(0.03, 0.12, 0.03), mats.wood, 0, -0.04, 0), mesh(new THREE.BoxGeometry(0.07, 0.11, 0.008), mats.steel, 0, -0.15, 0)) },
    // a glazier's suction lifter: two rubber cups under an orange grip, carried by the grip, cups down
    glassLifter: { at: 'handR', upright: true, make: () => group(
      mesh(new THREE.BoxGeometry(0.2, 0.026, 0.032), mats.lifter, 0, -0.05, 0), mesh(new THREE.BoxGeometry(0.024, 0.04, 0.03), mats.lifter, -0.085, -0.075, 0),
      mesh(new THREE.BoxGeometry(0.024, 0.04, 0.03), mats.lifter, 0.085, -0.075, 0),
      mesh(new THREE.CylinderGeometry(0.058, 0.064, 0.018, 16), mats.rubber, -0.085, -0.1, 0), mesh(new THREE.CylinderGeometry(0.058, 0.064, 0.018, 16), mats.rubber, 0.085, -0.1, 0)) },
    clipboard: { at: 'handL', make: () => group(mesh(new THREE.BoxGeometry(0.22, 0.3, 0.012), mats.board, 0, -0.1, 0.03), mesh(new THREE.BoxGeometry(0.19, 0.25, 0.004), mats.paper, 0, -0.1, 0.04)) },
    // a jeweller's loupe over the right eye
    loupe: { at: 'head', make: () => group(mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.03, 10), mats.brass, -0.034, 0.075, 0.1, Math.PI / 2, 0, 0)) },
    // an ID card on a lanyard, on the chest
    lanyard: { at: 'chest', make: () => group(mesh(new THREE.BoxGeometry(0.055, 0.08, 0.004), mats.card, 0, -0.06, 0.13), mesh(new THREE.TorusGeometry(0.11, 0.004, 3, 16, Math.PI), mats.strap, 0, 0.05, 0.03, Math.PI / 2 + 0.3, 0, Math.PI)) },
    beret: { at: 'head', make: () => { const b = mesh(new THREE.SphereGeometry(0.115, 12, 6), mats.beret, 0.018, 0.17, 0.0); b.scale.set(1.05, 0.34, 1.05); b.rotation.z = -0.18; return group(b); } },
    visor: { at: 'head', make: () => group(mesh(new THREE.BoxGeometry(0.17, 0.035, 0.02), mats.visor, 0, 0.085, 0.115)) },
    badge: { at: 'chest', make: () => group(mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 16), mats.badge, -0.08, 0.02, 0.13)) },
    // the hoods of Mira's yellow raincoat (M1) and the toy boy's red one, child-sized (the coats are recolours)
    // (close round the head, the brim at the hairline, the lining dark: a looser shell read as a halo or a helmet). Fitted to
    // the heads as measured in the frame a head prop is held in (Mira's with her hair: |x| < 0.1, y < 0.207, z -0.18..0.122;
    // the boy's: |x| < 0.069, y < 0.151, z -0.07..0.1): the shell clears them by 1.5-2 cm, and the crown closes down to a brim
    // just in front of the hairline, so no hair or scalp shows over it (the tour saw the crown in front of a ring of hood)
    // (both brims come down to the hairline and the openings' edges forward to the cheekbones: the tour saw a pale band of
    // Mira's scalp at her forehead and temples, between the brim and her face, and the boy's lining at his temples like
    // earmuffs)
    raincoatHood: { at: 'head', make: () => group(hood(mats.rainYellowOut, [0, 0.095, -0.03], [0.118, 0.13, 0.165], 1.25, mats.rainYellowIn, 0.6)) }, // (rb_mira)
    raincoatChildHood: { at: 'head', make: () => group(hood(mats.rainRedOut, [0, 0.075, 0.008], [0.088, 0.092, 0.11], 1.3, mats.rainRedIn, 0.62)) }, // (rb_child_m2)
    // the Witness's deep hood (rb_ren_m/hooded): its opening filled by shadow a little inside the rim, so no face shows
    shadowHood: { at: 'head', make: () => {
      const f = mesh(new THREE.SphereGeometry(1, 12, 8, Math.PI / 2 - 0.8, 1.6, 0.25, 1.85), mats.shade, 0, 0.1, -0.01);
      f.scale.set(0.124, 0.134, 0.164);
      return group(hood(mats.hoodCloth, [0, 0.1, -0.01], [0.134, 0.144, 0.178]), f);
    } },
    // a Continuum trooper's helmet, its dark visor raised, and a plate carrier (Sera's disguise, M10). In the frames of the
    // head bone (the head reaches +0.2 m, the forehead +0.1 m forward) and the chest bone (the chest +0.13 m forward, the
    // back -0.14 m, from +0.06 m to -0.25 m)
    helmet: { at: 'head', make: () => {
      const h = mesh(new THREE.SphereGeometry(0.12, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), mats.slate, 0, 0.09, -0.02, -0.15, 0, 0);
      h.scale.set(1, 1, 1.12);
      const v = mesh(new THREE.SphereGeometry(0.126, 14, 4, Math.PI / 2 - 0.85, 1.7, 0.62, 0.5), mats.lens, 0, 0.09, -0.02, -0.15, 0, 0);
      v.scale.set(1, 1, 1.12);
      return group(h, v);
    } },
    vest: { at: 'chest', make: () => {
      const plate = (z) => mesh(new THREE.BoxGeometry(0.25, 0.27, 0.03), mats.plate, 0, -0.09, z);
      const side = (x) => mesh(new THREE.BoxGeometry(0.03, 0.13, 0.25), mats.plate, x, -0.16, -0.005);
      const strap = (x) => mesh(new THREE.TorusGeometry(0.13, 0.014, 4, 12, Math.PI), mats.plate, x, 0.05, -0.005, 0, Math.PI / 2, 0);
      return group(plate(0.138), plate(-0.15), side(0.165), side(-0.165), strap(0.085), strap(-0.085));
    } },
  };
  Object.defineProperty(PROPS, 'shadeMat', { value: mats.shade }); // (a hologram's hood keeps its shadow dark: dress)
  return PROPS;
}
// a hologram's prop: its light (as world/Actors.js lights a hologram), or the dark inside a hood; one per colour
const holoMats = new Map();
function holoPropMat(color, dark) {
  const k = `${color}|${dark}`;
  if (!holoMats.has(k)) {
    holoMats.set(k, keepMat(dark
      ? new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide })
      : new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, transparent: true, opacity: 0.5, depthWrite: false, roughness: 0.3, side: THREE.DoubleSide })));
  }
  return holoMats.get(k);
}

// --- the recolour, on the GPU -------------------------------------------------------------------------
const MAXR = 8;
const FRAG = `
precision highp float;
uniform sampler2D map;
uniform vec3 skin;
uniform vec2 corners;        // the body map's corners that hold the hands (or bare shins): top, bottom
uniform int count;
uniform vec4 band[${MAXR}];
uniform vec4 sel[${MAXR}];   // hue centre (-1: any), hue width, smin, skin (1 protect)
uniform vec4 win[${MAXR}];   // lmin, lmax, -, -
uniform vec4 act[${MAXR}];   // to hue (-1 keep), sat mul, sat set (-1), light mul
uniform vec4 act2[${MAXR}];  // light set (-1), lrange a (-1), lrange b, -
varying vec2 vUv;
vec3 toS(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(1e-6)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
vec3 toL(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 hsl(vec3 c) {
  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), l = (mx + mn) * 0.5, d = mx - mn;
  if (d < 1e-5) return vec3(0.0, 0.0, l);
  float s = l > 0.5 ? d / (2.0 - mx - mn) : d / (mx + mn);
  float h = mx == c.r ? (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0) : mx == c.g ? (c.b - c.r) / d + 2.0 : (c.r - c.g) / d + 4.0;
  return vec3(h / 6.0, s, l);
}
float hue2(float p, float q, float t) {
  t = fract(t);
  if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
  if (t < 0.5) return q;
  if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
  return p;
}
vec3 rgb(vec3 h) {
  if (h.y < 1e-5) return vec3(h.z);
  float q = h.z < 0.5 ? h.z * (1.0 + h.y) : h.z + h.y - h.z * h.y, p = 2.0 * h.z - q;
  return vec3(hue2(p, q, h.x + 1.0 / 3.0), hue2(p, q, h.x), hue2(p, q, h.x - 1.0 / 3.0));
}
void main() {
  vec4 t = texture2D(map, vUv);
  vec3 c = toS(t.rgb);
  // how much this texel looks like this person's skin: its chromaticity and brightness near theirs
  float sum = c.r + c.g + c.b + 1e-4, ssum = skin.r + skin.g + skin.b + 1e-4;
  vec2 ch = c.rg / sum, sh = skin.rg / ssum;
  float br = sum / ssum;
  float skinW = (1.0 - smoothstep(0.022, 0.05, distance(ch, sh))) * smoothstep(0.3, 0.45, br) * (1.0 - smoothstep(1.6, 2.0, br)) * step(0.0, skin.r);
  vec3 h = hsl(c);
  // the hands (and bare shins) lie in the body map's top or bottom corners in every Rocketbox layout, often
  // warmer than the face: anything skin-hued in those corners is skin too
  float corner = step(min(vUv.x, 1.0 - vUv.x), 0.25) * (step(vUv.y, 0.17) * corners.x + step(0.83, vUv.y) * corners.y);
  float warm = 1.0 - smoothstep(0.065, 0.095, abs(fract(h.x - 0.05 + 0.5) - 0.5));
  skinW = max(skinW, corner * warm * smoothstep(0.12, 0.2, h.y) * (1.0 - smoothstep(0.78, 0.88, h.y)) * smoothstep(0.14, 0.24, h.z) * (1.0 - smoothstep(0.86, 0.94, h.z)));
  // (each rule's result is blended in RGB by its weight: blending hues would run a reddish texel that is
  // only partly selected, skin at a band's edge, through every hue on the way: rainbow hands)
  for (int i = 0; i < ${MAXR}; i++) {
    if (i >= count) break;
    vec4 b = band[i];
    float w = step(b.x, vUv.x) * step(vUv.x, b.z) * step(b.y, vUv.y) * step(vUv.y, b.w);
    w *= smoothstep(win[i].x - 0.04, win[i].x + 0.02, h.z) * (1.0 - smoothstep(win[i].y - 0.02, win[i].y + 0.04, h.z));
    if (sel[i].x >= 0.0) {
      float dh = abs(fract(h.x - sel[i].x + 0.5) - 0.5);
      w *= (1.0 - smoothstep(sel[i].y * 0.75, sel[i].y, dh)) * smoothstep(sel[i].z * 0.7, sel[i].z + 0.02, h.y);
    } else w *= smoothstep(sel[i].z * 0.7, sel[i].z + 0.02, h.y + step(sel[i].z, 0.0));
    w *= 1.0 - skinW * sel[i].w;
    if (w <= 0.0) continue;
    vec3 n = h;
    if (act[i].x >= 0.0) n.x = act[i].x;
    n.y = act[i].z >= 0.0 ? act[i].z * mix(0.6, 1.0, smoothstep(0.0, 0.25, h.y)) : clamp(h.y * act[i].y, 0.0, 1.0);
    if (act2[i].x >= 0.0) n.z = act2[i].x;
    else if (act2[i].y >= 0.0) n.z = mix(act2[i].y, act2[i].z, clamp((h.z - win[i].x) / max(1e-3, win[i].y - win[i].x), 0.0, 1.0));
    else n.z = clamp(h.z * act[i].w, 0.0, 1.0);
    c = mix(c, rgb(n), clamp(w, 0.0, 1.0));
    h = hsl(c);
  }
  gl_FragColor = vec4(toL(c), t.a);
}`;
const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

let quad = null;
function quadScene() {
  if (quad) return quad;
  const uniforms = {
    map: { value: null }, skin: { value: new THREE.Vector3(-1, -1, -1) }, corners: { value: new THREE.Vector2() }, count: { value: 0 },
    band: { value: Array.from({ length: MAXR }, () => new THREE.Vector4()) }, sel: { value: Array.from({ length: MAXR }, () => new THREE.Vector4()) },
    win: { value: Array.from({ length: MAXR }, () => new THREE.Vector4()) }, act: { value: Array.from({ length: MAXR }, () => new THREE.Vector4()) },
    act2: { value: Array.from({ length: MAXR }, () => new THREE.Vector4()) },
  };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  quad = { scene, cam: new THREE.Camera(), mat, uniforms };
  return quad;
}

// rules -> the shader's uniform rows
export function packRules(rules) {
  const rows = [];
  for (const r of rules.slice(0, MAXR)) {
    rows.push({
      band: r.band || [0, 0, 1, 1],
      sel: [r.hue ? r.hue[0] : -1, r.hue ? r.hue[1] : 0, r.smin ?? 0, r.skin === false ? 0 : 1],
      win: [r.lmin ?? 0, r.lmax ?? 1, 0, 0],
      act: [r.to ?? -1, r.sat ?? 1, r.sset ?? -1, r.light ?? 1],
      act2: [r.lset ?? -1, r.lrange ? r.lrange[0] : -1, r.lrange ? r.lrange[1] : -1, 0],
    });
  }
  return rows;
}

// The avatar's own skin: its colour (sRGB 0..1) from the middle of its face on the head map, and which
// corners of its body map hold skin (the hands at the top or the bottom, bare shins): { rgb, corners }.
// Read once per model from 64 px copies of the two maps.
const skinCache = new Map();
function pixels(img, n = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, n, n);
  return g.getImageData(0, 0, n, n).data;
}
export function skinOf(model, headMap, bodyMap) {
  if (skinCache.has(model)) return skinCache.get(model);
  const out = { rgb: null, corners: [0, 0] };
  try {
    if (headMap?.image && typeof document !== 'undefined') {
      const d = pixels(headMap.image);
      // cheeks and forehead, between the eyes and the mouth
      const px = [];
      for (let y = 14; y < 30; y++) for (let x = 22; x < 42; x++) {
        const i = (y * 64 + x) * 4;
        if (d[i] > d[i + 1] && d[i + 1] >= d[i + 2] && d[i] > 40) px.push([d[i], d[i + 1], d[i + 2]]);
      }
      if (px.length > 20) {
        px.sort((a, b) => a[0] + a[1] + a[2] - b[0] - b[1] - b[2]);
        out.rgb = px[px.length >> 1].map((v) => v / 255);
      }
    }
    if (out.rgb && bodyMap?.image) {
      // a corner band holds skin when over a third of it is near the face's colour; skin-brown trouser legs
      // and shoes (Tala's) fall outside that, and stay theirs to recolour
      const d = pixels(bodyMap.image);
      const [sr, sg, sb] = out.rgb;
      const ss = sr + sg + sb;
      const share = (y0, y1) => {
        let n = 0, k = 0;
        for (let y = y0; y < y1; y++) for (const x of [...Array(16).keys(), ...Array.from({ length: 16 }, (_, i) => 48 + i)]) {
          const i = (y * 64 + x) * 4;
          const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, t = r + g + b;
          if (t < 0.15) continue; // (the black between the islands)
          n++;
          if (Math.hypot(r / t - sr / ss, g / t - sg / ss) < 0.04 && t / ss > 0.35 && t / ss < 2) k++;
        }
        return n ? k / n : 0;
      };
      out.corners = [share(0, 11) > 0.35 ? 1 : 0, share(53, 64) > 0.35 ? 1 : 0];
    }
  } catch { /* a tainted or missing image: no protection beyond the rules' bands */ }
  skinCache.set(model, out);
  return out;
}

// A recolour's source map is uploaded to the GPU to be drawn from. Nobody wears it once its recolours are made (unless
// a variant leaves that part as it is), so DeckWorld.freeLeft, which frees the maps on the people who leave, would never
// find it: after the recolours of this task it is let go, unless someone wears it plain (worn()), and uploaded again
// the next time a recolour needs it. So only the people in play hold GPU memory (1.1.1's rule).
const toFree = new Set();
function letGo(src) {
  if (!toFree.size) {
    setTimeout(() => {
      for (const t of toFree) if (!t.userData.lvWorn) t.dispose();
      toFree.clear();
    }, 0);
  }
  toFree.add(src);
}
// a source map on someone's material (a part their variant leaves as it is): kept until DeckWorld frees it with them
function worn(map) {
  if (map.userData.lvWorn) return;
  map.userData.lvWorn = true;
  if (!map.userData.lvWornHook) {
    map.userData.lvWornHook = true;
    map.addEventListener('dispose', () => { map.userData.lvWorn = false; });
  }
}

const cache = new Map(); // `${model}|${variant}|${part}` -> texture
export const stats = { made: 0, ms: 0 };
export function recoloured(renderer, src, key, rules, skin, px = 512, corners = [0, 0]) {
  if (cache.has(key)) return cache.get(key);
  if (!renderer || !src?.image || !rules?.length) return src;
  const t0 = performance.now();
  const w = Math.min(px, src.image.width || px), h = Math.min(px, src.image.height || px);
  const rt = new THREE.WebGLRenderTarget(w, h, { colorSpace: THREE.SRGBColorSpace, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
  rt.texture.anisotropy = src.anisotropy || 1;
  rt.texture.wrapS = src.wrapS;
  rt.texture.wrapT = src.wrapT;
  rt.texture.name = `lv:${key}`;
  const q = quadScene();
  q.uniforms.map.value = src;
  q.uniforms.skin.value.set(...(skin || [-1, -1, -1]));
  q.uniforms.corners.value.set(...corners);
  const rows = packRules(rules);
  q.uniforms.count.value = rows.length;
  rows.forEach((r, i) => {
    q.uniforms.band.value[i].set(...r.band);
    q.uniforms.sel.value[i].set(...r.sel);
    q.uniforms.win.value[i].set(...r.win);
    q.uniforms.act.value[i].set(...r.act);
    q.uniforms.act2.value[i].set(...r.act2);
  });
  const prev = renderer.getRenderTarget();
  renderer.setRenderTarget(rt);
  renderer.render(q.scene, q.cam);
  renderer.setRenderTarget(prev);
  q.uniforms.map.value = null;
  letGo(src);
  // when the people who wore it have left (DeckWorld.freeLeft disposes it), the copy goes too
  rt.texture.addEventListener('dispose', () => { cache.delete(key); rt.dispose(); });
  cache.set(key, rt.texture);
  stats.made++;
  stats.ms += performance.now() - t0;
  return rt.texture;
}

// each model's own colour maps, per part (the maps a fresh actor's materials share with the loaded model)
const SOURCES = new Map();
function noteSources(model, mats) {
  if (SOURCES.has(model)) return;
  const out = {};
  for (const m of mats) if (m.map && !m.map.isRenderTargetTexture && !out[m.name]) out[m.name] = m.map;
  SOURCES.set(model, out);
}
export const sourcesOf = (model) => SOURCES.get(model) || null;

export function variantOf(model, variant) {
  const vs = WARDROBE[model];
  if (!vs) return null;
  return vs[variant] || vs.default || vs[Object.keys(vs)[0]] || null;
}
export const hasVariant = (model, variant) => !!WARDROBE[model]?.[variant];

// make every recoloured map a variant needs, ahead of time (behind the chapter card). make(model) builds
// a throwaway actor for a model no one has worn yet, so its maps are known.
export function prewarm(renderer, pairs, { make, px = () => 512 } = {}) {
  let n = 0;
  for (const [model, variant] of pairs) {
    const v = WARDROBE[model]?.[variant];
    if (!v) continue;
    if (!SOURCES.has(model) && make) {
      const a = make(model);
      const mats = [];
      a?.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) mats.push(m); });
      if (a?.userData.spec?.model === model) noteSources(model, mats);
      a?.traverse((o) => { if (o.userData.ownGeometry) o.geometry.dispose(); });
    }
    const m = SOURCES.get(model);
    if (!m) continue;
    for (const [part, rules] of Object.entries(v)) {
      if (!Array.isArray(rules) || !rules.length || !m[part]) continue;
      if (!cache.has(`${model}|${variant}|${part}`)) n++;
      const sk = skinOf(model, m.head, m.body);
      recoloured(renderer, m[part], `${model}|${variant}|${part}`, rules, sk.rgb, px(model), part === 'body' ? sk.corners : [0, 0]);
    }
  }
  return n;
}

// The dresser: called for every person the edition builds (People.setCrewDresser), holograms too.
// opts: { renderer, maps(model) -> { part: texture }, px(model) }
export function dress(actor, crew, opts = {}) {
  const U = actor.userData;
  const model = U.spec?.model;
  if (!model || U.spec?.model !== (crew.model || model)) return actor; // fell back to another model: leave it as it is
  const variant = crew.variant || 'default';
  const v = variantOf(model, variant) || {};
  const holo = !!U.spec.hologram;
  const mats = [];
  actor.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) mats.push(m); });
  if (!holo) noteSources(model, mats);
  const src = SOURCES.get(model) || {};
  for (const m of mats) {
    const part = m.name;
    if (v.hide?.includes(part)) m.visible = false;
    if (holo) {
      if (m.map && !m.map.isRenderTargetTexture) worn(m.map); // (a hologram keeps its hair cards' own map)
      continue;
    }
    const rules = v[part];
    if (Array.isArray(rules) && rules.length && src[part] && opts.renderer) {
      const sk = skinOf(model, src.head, src.body);
      m.map = recoloured(opts.renderer, src[part], `${model}|${variant}|${part}`, rules, sk.rgb, opts.px?.(model) || 512, part === 'body' ? sk.corners : [0, 0]);
    } else if (m.map && m.map === src[part]) worn(m.map);
    // crowds: tinted hair; Rain City's wet clothes read darker
    if (crew.hairTint && (part === 'hair') && m.color) m.color.multiply(new THREE.Color(crew.hairTint));
    if (crew.dark && part !== 'eye' && part !== 'head' && m.color) m.color.multiplyScalar(crew.dark);
  }
  // things carried
  const props = [...(v.props || []), ...(crew.props || [])];
  if (props.length && (!holo || v.holoProps)) {
    const kit = propKit();
    props.forEach((name, i) => {
      const p = kit[name];
      const h = p && attach(actor, p.at, p.make(crew.seed || i), [0, 0, 0], !!p.upright);
      if (h) h.userData.prop = name;
      // a hologram's things are of its light too: the hooded Witness's hood, cloth black on a figure of light, read as a
      // solid black helmet on Missions 8's and 20's re-enactments. The hood glows as he does; the shadow in it, where a
      // face would be, stays dark (translucent)
      if (h && holo) h.traverse((o) => {
        if (!o.isMesh) return;
        const dark = o.material === kit.shadeMat;
        o.material = holoPropMat(dark ? 0x05070a : U.spec.glow || 0x8fe0ff, dark);
        o.castShadow = false;
      });
    });
    if (props.includes('umbrella')) U.umbrella = true;
  }
  // clothes made for the body (garments.js): the settlement's tunics, mantles and belts (of light on an echo), a lab
  // coat, an apron; and the settlement's girls' hair
  if (v.garb) clothe(actor, model, v.garb, { hologram: holo, glow: U.spec.glow });
  if (v.hairdo) hairdo(actor, model, v.hairdo.from, { ...v.hairdo, hologram: holo, glow: U.spec.glow });
  // a head of hair of its own over a painted one (garments.js hairMass): Tomas's mop, young Kai's crop (on his echo only)
  if (v.hairMass && (holo || !v.hairMass.holoOnly)) hairMass(actor, model, v.hairMass, { hologram: holo, glow: U.spec.glow });
  if (holo) holoDepth(actor);
  // an old back (the Elder's): bent forward at the spine after every pose, the head raised again (afterPose)
  U.stoop = v.stoop || 0;
  U.lvVariant = variant;
  return actor;
}

// An echo shows its nearest surface only: each of its skinned parts is drawn first into the depth buffer alone (no colour),
// then in its light where it is nearest. Every surface of an echo was blended before: the inside of the mouth through
// the lips (an open grin), the backs of the eyes, the far side of the head (a hollow face), the body through its clothes.
// The depth passes come after everything solid and every other see-through thing (renderOrder 1, the light 2), so
// nothing behind an echo is cut out of the scene; hair cards and a hair mass, cut out by their maps, are left out of them
// (they would write depth over the face where they are empty) and drawn over the head in their light. Seen once, not
// through its own layers, an echo's surface is denser (HOLO_DENSITY: world/Actors.js's 0.55 was for a figure seen
// through two or three of its own surfaces, about 0.8 together), through its flicker too.
const HOLO_DEPTH = new Map();
export const HOLO_DENSITY = 0.72 / 0.55;
function holoDepthMat(side) {
  if (!HOLO_DEPTH.has(side)) HOLO_DEPTH.set(side, keepMat(new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, transparent: true, side })));
  return HOLO_DEPTH.get(side);
}
export function holoDepth(actor) {
  const parts = [];
  actor.traverse((o) => {
    if (!o.isMesh || o.name === 'holodepth') return;
    o.renderOrder = 2;
    if (o.isSkinnedMesh && ![].concat(o.material).some((m) => m.alphaTest > 0)) parts.push(o);
  });
  // (each material's own opacity kept once, so a material shared by many echoes is never thickened twice; the parts'
  // materials as they are now, a flickering garment's own copy among them)
  const thicken = (a = 1) => {
    for (const o of parts) for (const m of [].concat(o.material)) {
      if (!m.transparent) continue;
      m.userData.holoBase ??= m.opacity;
      m.opacity = Math.min(1, m.userData.holoBase * HOLO_DENSITY * a);
    }
  };
  thicken();
  const U = actor.userData, fade = U.setOpacity;
  if (fade) U.setOpacity = (a) => { fade(a); thicken(a); };
  for (const o of parts) {
    const d = new THREE.SkinnedMesh(o.geometry, holoDepthMat([].concat(o.material)[0].side));
    d.name = 'holodepth';
    d.bind(o.skeleton, o.bindMatrix);
    d.position.copy(o.position);
    d.quaternion.copy(o.quaternion);
    d.scale.copy(o.scale);
    d.frustumCulled = false;
    d.castShadow = d.receiveShadow = false;
    d.renderOrder = 1;
    o.parent.add(d);
  }
  return parts.length;
}

// Hang something on a person: 'head', 'chest', 'handL', 'handR' or the root. It is held in a frame that
// faces the way the person faces, in metres (the skeleton's own scale undone), offset in that frame;
// upright: turned upright again after every pose (a lantern, a staff, an umbrella), else it moves with
// the bone it hangs from.
export function attach(actor, where, obj, offset = [0, 0, 0], upright = false) {
  const U = actor.userData;
  const at = where === 'head' ? U.head : where === 'chest' ? U.bones?.Spine2 || U.bones?.Spine1 : where === 'handL' ? U.handL : where === 'handR' ? U.handR : actor;
  if (!at) return null;
  actor.updateMatrixWorld(true);
  const holder = new THREE.Group();
  holder.add(obj);
  obj.position.set(...offset);
  const ws = at.getWorldScale(new THREE.Vector3());
  const as = actor.getWorldScale(new THREE.Vector3());
  holder.scale.setScalar(as.x / Math.max(1e-4, ws.x));
  holder.quaternion.copy(at.getWorldQuaternion(_p).invert().multiply(actor.getWorldQuaternion(_y)));
  holder.userData.upright = upright;
  at.add(holder);
  (U.props ||= []).push(holder);
  return holder;
}

// After each pose (the actor's animate): an umbrella is held up, the forearm raised in front of the
// chest, an old back is bent (stoop: radians, most of it in the lower spine, the neck raised again so the face is
// not on the chest), and the props in a hand turn upright again.
const _q = new THREE.Quaternion(), _p = new THREE.Quaternion(), _y = new THREE.Quaternion(), _v = new THREE.Vector3(), _ax = new THREE.Vector3();
function turnWorld(bone, axis, ang) {
  bone.parent.getWorldQuaternion(_p);
  _q.setFromAxisAngle(axis, ang).multiply(_y.copy(_p).multiply(bone.quaternion));
  bone.quaternion.copy(_p.invert().multiply(_q));
  bone.updateMatrixWorld(true);
}
export function afterPose(actor) {
  const U = actor.userData;
  if (U.umbrella && U.bones?.RightArm && U.bones.RightForeArm) {
    actor.getWorldQuaternion(_y);
    const right = _ax.set(-1, 0, 0).applyQuaternion(_y); // (the model faces +Z: its right hand is on -X)
    turnWorld(U.bones.RightArm, right, -0.35);
    actor.getWorldQuaternion(_y);
    turnWorld(U.bones.RightForeArm, _ax.set(-1, 0, 0).applyQuaternion(_y), -1.45);
  }
  if (U.stoop && U.bones?.Spine1 && U.bones.Spine2 && U.bones.Neck) {
    actor.getWorldQuaternion(_y);
    const right = _v.set(-1, 0, 0).applyQuaternion(_y);
    turnWorld(U.bones.Spine1, right, -U.stoop * 0.6);
    turnWorld(U.bones.Spine2, right, -U.stoop * 0.4);
    turnWorld(U.bones.Neck, right, U.stoop * 0.75);
  }
  const props = U.props;
  if (!props) return;
  actor.getWorldQuaternion(_y);
  for (const o of props) {
    if (!o.userData.upright) continue;
    o.parent.getWorldQuaternion(_p);
    o.quaternion.copy(_q.copy(_p).invert().multiply(_y));
  }
}

// recolour a whole render sheet's worth of variants: for tests and the render sheets
export function variantsOf(model) {
  return Object.keys(WARDROBE[model] || {});
}

export { RAIN_DARK };
