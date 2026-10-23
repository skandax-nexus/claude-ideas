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
    kai12: { body: [{ hue: [0.6, 0.1], smin: 0.35, sat: 0.6, light: 1.05 }] },
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
      head: [{ band: [0, 0, 1, 0.3], lmax: 0.3, to: 0.12, sset: 0.4, lrange: [0.36, 0.56] }],
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
  rb_niko: {
    // Niko: an undyed linen kurta and a plain woven cap
    niko: { head: [{ band: [0.05, 0.6, 1, 1], hue: [0.1, 0.5], smin: 0, to: 0.1, sset: 0.2, lrange: [0.5, 0.7], skin: false }] },
    // Niko, older (M7's cold open): the beard greying
    older: { head: [{ band: [0.05, 0.6, 1, 1], to: 0.1, sset: 0.2, lrange: [0.5, 0.7], skin: false }, { band: [0, 0, 1, 0.58], lmax: 0.28, sset: 0.04, lrange: [0.42, 0.6] }] },
  },
  rb_jun: {
    // Jun Park: a navy transit blazer, a line-41 amber tie
    transit: { body: [{ hue: [0.66, 0.12], smin: 0.05, to: 0.63, sset: 0.42, light: 1.15 }, { band: [0.42, 0.35, 0.58, 0.62], lmin: 0.35, to: 0.1, sset: 0.85, lrange: [0.4, 0.55] }] },
  },
  rb_tala: {
    // Tala: an indigo tunic, an undyed scarf
    tala: { body: [{ hue: [0.13, 0.12], smin: 0.15, to: 0.66, sset: 0.45, light: 0.75 }], hair: [{ lmin: 0.5, to: 0.1, sset: 0.16, light: 0.92 }] },
    // the settlement's women where Tala is absent (M4, M7): umber, ochre or indigo homespun
    umber: { body: [{ hue: [0.13, 0.12], smin: 0.15, to: 0.06, sset: 0.4, light: 0.7 }], hair: [{ lmin: 0.5, to: 0.09, sset: 0.22, light: 0.85 }] },
    ochre: { body: [{ hue: [0.13, 0.12], smin: 0.15, to: 0.1, sset: 0.55, light: 0.95 }], hair: [{ lmin: 0.5, to: 0.1, sset: 0.12, light: 0.95 }] },
    indigo: { body: [{ hue: [0.13, 0.12], smin: 0.15, to: 0.65, sset: 0.4, light: 0.62 }], hair: [{ lmin: 0.5, to: 0.1, sset: 0.14, light: 0.9 }] },
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
  rb_elder: {
    // the Elder: a madder-red wool robe, a staff, a slow walk
    // (lighter than her robe was: a madder that read as black at dusk made her a figure in a modern abaya)
    elder: { body: [{ lmax: 0.5, to: 0.99, sset: 0.56, lrange: [0.27, 0.5] }], hair: [{ to: 0.06, sset: 0.25, lrange: [0.6, 0.78] }], props: ['staff'] },
    // the settlement's women where the Elder is absent (M5, M7)
    umber: { body: [{ lmax: 0.5, to: 0.07, sset: 0.42, lrange: [0.14, 0.42] }], hair: [{ to: 0.1, sset: 0.18, lrange: [0.6, 0.8] }] },
    ochre: { body: [{ lmax: 0.5, to: 0.1, sset: 0.55, lrange: [0.24, 0.56] }], hair: [{ to: 0.1, sset: 0.14, lrange: [0.62, 0.82] }] },
    indigo: { body: [{ lmax: 0.5, to: 0.65, sset: 0.42, lrange: [0.12, 0.38] }], hair: [{ to: 0.1, sset: 0.16, lrange: [0.6, 0.8] }] },
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
    // the Helix receptionist
    'helix desk': { body: [{ hue: [0.68, 0.1], smin: 0.15, to: 0.6, sset: 0.1, light: 0.5 }] },
    // the trapped woman (M1): soaked
    wet: { body: [{ light: 0.78 }] },
  },
  rb_civ_f2: {
    detention: { body: [{ to: 0.58, sset: 0.05, lrange: [0.34, 0.56] }] }, dust: { body: [{ sat: 0.45, light: 1.12 }] },
    default: {}, rose: { body: [{ band: [0.3, 0, 0.7, 0.6], lmin: 0.3, to: 0.97, sset: 0.35, light: 1 }] }, sand: { body: [{ band: [0.3, 0, 0.7, 0.6], lmin: 0.3, to: 0.1, sset: 0.3 }] },
    // Helix technicians: a slate coverall
    'coverall slate': { body: [{ to: 0.6, sset: 0.14, lrange: [0.2, 0.42] }] },
    // Officer Haig's recording: at home, a T-shirt
    home: {},
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
  rb_medic_f: { default: {}, dust: { body: [{ sat: 0.6, light: 1.08 }] } },
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
    // the settlement's girls in linen (the head cloth plain)
    linen: { body: [{ to: 0.11, sset: 0.16, lrange: [0.5, 0.74] }], head: [{ hue: [0.93, 0.1], smin: 0.15, to: 0.1, sset: 0.14, lrange: [0.5, 0.72] }] },
    ochre: { body: [{ to: 0.1, sset: 0.45, lrange: [0.34, 0.54] }], head: [{ hue: [0.93, 0.1], smin: 0.15, to: 0.1, sset: 0.16, lrange: [0.52, 0.72] }] },
    // (a third homespun: where a girl in linen is placed by hand, the crowd's children still differ from their neighbours)
    indigo: { body: [{ to: 0.64, sset: 0.34, lrange: [0.24, 0.44] }], head: [{ hue: [0.93, 0.1], smin: 0.15, to: 0.1, sset: 0.14, lrange: [0.52, 0.72] }] },
    // a 2196 schoolgirl (M14): a faded blue smock, the head cloth a washed grey
    faded: { body: [{ to: 0.58, sset: 0.2, lrange: [0.4, 0.6] }], head: [{ hue: [0.93, 0.1], smin: 0.15, to: 0.6, sset: 0.06, lrange: [0.5, 0.68] }] },
  },
  rb_trooper: {
    // Continuum troops: slate blue-grey, helmeted
    continuum: { body: [{ to: 0.6, sset: 0.14, light: 0.75, lmin: 0.06 }], equipment: [{ to: 0.6, sset: 0.12, light: 0.7 }], helmet: [{ to: 0.6, sset: 0.12, light: 0.72 }] },
    // the Spire's elites: graphite, a lit visor
    elite: { body: [{ to: 0.62, sset: 0.05, light: 0.45, lmin: 0.06 }], equipment: [{ to: 0.62, sset: 0.04, light: 0.42 }], helmet: [{ to: 0.62, sset: 0.04, light: 0.4 }], props: ['visor'] },
  },
  rb_robe_m: {
    // the settlement's men: homespun in ochre, indigo, undyed or madder; the head cloth plain
    ochre: { body: [{ to: 0.1, sset: 0.62, lrange: [0.26, 0.46] }], keffiyeh: [{ to: 0.1, sset: 0.12, lrange: [0.58, 0.78], skin: false }] },
    indigo: { body: [{ to: 0.65, sset: 0.38, lrange: [0.2, 0.4] }], keffiyeh: [{ to: 0.1, sset: 0.1, lrange: [0.6, 0.8], skin: false }] },
    undyed: { body: [{ to: 0.11, sset: 0.14, lrange: [0.56, 0.78] }], keffiyeh: [{ to: 0.1, sset: 0.16, lrange: [0.5, 0.7], skin: false }] },
    madder: { body: [{ to: 0.99, sset: 0.45, lrange: [0.26, 0.44] }], keffiyeh: [{ to: 0.1, sset: 0.12, lrange: [0.58, 0.78], skin: false }] },
    // an astronomer (M7)
    astronomer: { body: [{ to: 0.66, sset: 0.42, lrange: [0.14, 0.3] }], keffiyeh: [{ to: 0.66, sset: 0.3, lrange: [0.2, 0.36], skin: false }], props: ['staff'] },
    // the crowd's elders: darker, with a staff and a slow walk
    elder: { body: [{ to: 0.08, sset: 0.3, lrange: [0.2, 0.36] }], keffiyeh: [{ to: 0.1, sset: 0.1, lrange: [0.5, 0.66], skin: false }], props: ['staff'] },
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
  rb_villager_f: { default: {}, sage: { body: [{ hue: [0.09, 0.1], smin: 0.1, to: 0.27, sat: 0.9 }] }, rust: { body: [{ hue: [0.09, 0.1], smin: 0.1, to: 0.04, sat: 1.1 }] } },
  xbot: { default: {}, hologram: {} },
};

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
  U.lvVariant = variant;
  return actor;
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
// chest, and the props in a hand turn upright again.
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
  const props = U.props;
  if (!props) return;
  actor.getWorldQuaternion(_y);
  for (const o of props) {
    if (!o.userData.upright) continue;
    o.parent.getWorldQuaternion(_p);
    o.quaternion.copy(_q.copy(_p).invert().multiply(_y));
  }
  void _v;
}

// recolour a whole render sheet's worth of variants: for tests and the render sheets
export function variantsOf(model) {
  return Object.keys(WARDROBE[model] || {});
}

export { RAIN_DARK };
