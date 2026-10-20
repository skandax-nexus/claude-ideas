// Story generator: turns a campaign seed into a complete, consistent mystery
// that is told across the eight decks of the vessel AFTERZERO.
//
// What is fixed: the act structure, the deck themes, the voices of Juno and
// TICK. What is generated: the crew (names, roles, who is alive, how they talk),
// the hidden truth (who started the loop, why, how, and the final twist), every
// log, inscription and conversation, and which records lie. Clues are derived
// from the truth, so the mystery is always solvable: every innocent crew member
// is cleared by an echo record, and the culprit's echo record contradicts their
// official one.
import { Rng } from './rng.js';

export const DECKS = [
  {
    key: 'hydro', name: 'HYDROPONICS', title: 'The Garden Deck', role: 'Botanist', feature: 'gravity',
    palette: { look: 'hydro', fog: 0x9fb894, density: 2.6, wall: '#8fa88a', floor: '#4d5a4a', accent: 0xffb54a, light: 0xffb0dc, tint: 0xe8c8e0, night: 0.15, weather: 'pollen', sky: 'dusk', probe: false, grade: { shadowTint: 0x1f4a2e, highlightTint: 0xffc8e6, toning: 0.16, contrast: 1.1, saturation: 1.12 } },
    rooms: ['NURSERY RING', 'ROOT VAULT', 'MIST GALLERY', 'SEED BANK', 'CANOPY WALK', 'POLLEN LOCK', 'GREENHOUSE 3', 'IRRIGATION SPINE'],
    motto: 'EVERYTHING HERE WAS PLANTED TO OUTLIVE US',
  },
  {
    key: 'cryo', name: 'CRYO BAY', title: 'The Sleeping Deck', role: 'Cryo Technician', feature: 'echo',
    palette: { look: 'cryo', fog: 0xc4d8ea, density: 2.2, wall: '#8ea3b6', floor: '#c9d9e6', accent: 0x8f9cff, light: 0xd6ecff, tint: 0xcfe6ff, night: 0.1, weather: 'frost', sky: 'night', probe: false, ink: 0.85, grade: { shadowTint: 0x1e3a66, highlightTint: 0xe6f4ff, toning: 0.18, contrast: 1.12, saturation: 0.9 } },
    rooms: ['POD ROW A', 'THAW ROOM', 'FROST CORRIDOR', 'COLD STORAGE', 'DREAM MONITOR', 'POD ROW C', 'WAKING HALL', 'GLASS COFFINS'],
    motto: 'SLEEP IS A PROMISE TO WAKE',
  },
  {
    key: 'obs', name: 'OBSERVATORY', title: 'The Weightless Deck', role: 'Navigator', feature: 'zerog',
    palette: { look: 'obs', fog: 0x161c34, density: 1.4, wall: '#1f2742', floor: '#141a2c', accent: 0xb3a6ff, light: 0xc4bcff, tint: 0x8c86c8, night: 0.6, weather: 'stardust', sky: 'night', probe: false, ink: 0.85, echoLine: 0x8ff6ff, grade: { shadowTint: 0x1a1e5a, highlightTint: 0xe8dcff, toning: 0.2, contrast: 1.1, saturation: 1.08 } },
    rooms: ['STAR DOME', 'LENS ARRAY', 'CHART ROOM', 'ORRERY', 'DRIFT GALLERY', 'TELESCOPE WELL', 'HORIZON DECK', 'SIGNAL ROOM'],
    motto: 'WE KNEW WHERE WE WERE GOING. WE NEVER ASKED WHY',
  },
  {
    key: 'eng', name: 'ENGINEERING', title: 'The Clockwork Deck', role: 'Chief Engineer', feature: 'time',
    palette: { look: 'eng', fog: 0x4a3a2c, density: 2.0, wall: '#6b6258', floor: '#5a5c5e', accent: 0xffb020, light: 0xffa04a, tint: 0xffc890, night: 0.35, weather: 'steam', sky: 'warehouse', probe: false, ink: 0.85, echoLine: 0x8ff6ff, grade: { shadowTint: 0x123a44, highlightTint: 0xffc08a, toning: 0.22, contrast: 1.14, saturation: 1.04 } },
    rooms: ['TURBINE HALL', 'GEAR GALLERY', 'COOLANT LOOP', 'PISTON ROW', 'GOVERNOR ROOM', 'FUSE VAULT', 'DRIVE SPINE', 'PRESSURE LOCK'],
    motto: 'EVERY MACHINE KEEPS TIME. THIS ONE KEEPS IT PRISONER',
  },
  {
    key: 'med', name: 'MEDBAY', title: 'The Watched Deck', role: 'Medic', feature: 'sentinel',
    palette: { look: 'med', fog: 0xd8ecec, density: 0.8, wall: '#eef4f4', floor: '#9fb8be', accent: 0x3f9cff, light: 0xf2ffff, tint: 0xe0fbff, sky: 'warehouse', probe: false, grade: { shadowTint: 0x1e4a5a, highlightTint: 0xf2fbff, toning: 0.1, contrast: 1.12, saturation: 0.96 } },
    rooms: ['TRIAGE', 'RECOVERY WARD', 'SCAN ROOM', 'QUARANTINE', 'PHARMACY', 'SURGERY 2', 'OBSERVATION WARD', 'CLEAN ROOM'],
    motto: 'DO NO HARM. OBSERVE EVERYTHING',
  },
  {
    key: 'crew', name: 'CREW QUARTERS', title: 'The Home Deck', role: 'Counselor', feature: 'light',
    palette: { look: 'crew', fog: 0x5a4a44, density: 1.4, wall: '#6c7f95', floor: '#6b4a33', accent: 0xff9a8a, light: 0xffd2a4, tint: 0xffd8b8, night: 0.3, weather: 'motes', sky: 'dusk', probe: false, ink: 0.85, grade: { shadowTint: 0x2a3a5a, highlightTint: 0xffd6aa, toning: 0.18, contrast: 1.08, saturation: 1.06 } },
    rooms: ['MESS HALL', 'COMMONS', 'BUNK RING', 'LIBRARY NOOK', 'SHRINE', 'MUSIC ROOM', 'GALLEY', 'SUNROOM'],
    motto: 'WE WERE A FAMILY FOR ELEVEN YEARS',
  },
  {
    key: 'arch', name: 'ARCHIVE CORE', title: 'The Remembering Deck', role: 'Archivist', feature: 'mixed',
    palette: { look: 'arch', fog: 0x2e2418, density: 1.8, wall: '#2c3532', floor: '#3a3028', accent: 0xfff0d6, light: 0xffc27a, tint: 0xffd49a, night: 0.55, weather: 'motes', sky: 'dusk', probe: false, ink: 0.85, echoLine: 0x8ff6ff, grade: { shadowTint: 0x14303a, highlightTint: 0xffcc8a, toning: 0.22, contrast: 1.1, saturation: 1.02 } },
    rooms: ['INDEX HALL', 'DEEP STACKS', 'RECORD WELL', 'CATALOGUE', 'SILENT READING', 'MEMORY FORGE', 'ECHO CHAMBER', 'REDACTION ROOM'],
    motto: 'NOTHING IS FORGOTTEN. SOME THINGS ARE FILED ELSEWHERE',
  },
  {
    key: 'bridge', name: 'THE BRIDGE', title: 'The Last Deck', role: 'Captain', feature: 'finale',
    palette: { look: 'bridge', fog: 0x0e1628, density: 1.2, wall: '#1c2b4a', floor: '#222a38', accent: 0xffc44a, light: 0xa8c4ff, tint: 0x9ab4e8, night: 0.5, sky: 'night', probe: false, ink: 0.85, echoLine: 0x8ff6ff, grade: { shadowTint: 0x0e2050, highlightTint: 0xffe0a8, toning: 0.2, contrast: 1.12, saturation: 1.06 } },
    rooms: ['COMMAND RING', 'HELM', 'CAPTAIN\'S WALK', 'STAR TABLE', 'COUNCIL ROOM', 'WAKE WINDOW', 'ZERO POINT', 'THE CHAIR'],
    motto: 'WHOEVER SITS HERE DECIDES WHAT HAPPENED',
  },
];

export const FIRST = ['Amara', 'Bastien', 'Chiara', 'Dae-jung', 'Elif', 'Farid', 'Greta', 'Hiro', 'Ines', 'Jonah', 'Kalani', 'Leila', 'Mateo',
  'Nadia', 'Oskar', 'Priya', 'Quinn', 'Rafael', 'Saoirse', 'Tariq', 'Uma', 'Viktor', 'Wen', 'Ximena', 'Yusuf', 'Zora', 'Anouk',
  'Bilal', 'Camille', 'Dmitri', 'Esi', 'Felix', 'Ngozi', 'Haruka', 'Ilya', 'Jae', 'Kofi', 'Lucia', 'Mei', 'Noor', 'Arjun', 'Sol'];
export const LAST = ['Okafor', 'Lindqvist', 'Moreau', 'Tanaka', 'Haddad', 'Novak', 'Castillo', 'Achterberg', 'Mensah', 'Park', 'Rossi',
  'Sato', 'Kowalski', 'Adeyemi', 'Ferreira', 'Nakamura', 'Duarte', 'Varela', 'Iyer', 'Brennan', 'Volkov', 'Asante', 'Dubois',
  'Halloran', 'Kim', 'Oyelaran', 'Petrov', 'Quispe', 'Reyes', 'Sorensen', 'Takeda', 'Wainwright', 'Yilmaz', 'Zhou', 'Abara'];
export const PRONOUNS = [
  { their: 'her', them: 'her' },
  { their: 'his', them: 'him' },
  { their: 'their', them: 'them' },
];
export const TRAITS = {
  warm: { tag: 'warm', greet: ['Oh. Oh, you\'re awake. Sit, sit - no, you can\'t sit, the chairs are on the ceiling.', 'You came all this way. Of course you did. You always do.'] },
  dry: { tag: 'dry', greet: ['Cycle forty-two. You\'re late. You\'re always late on the even ones.', 'Before you ask: no, I don\'t know why the gravity does that. Yes, I have theories.'] },
  nervous: { tag: 'nervous', greet: ['Don\'t - sorry. Sorry. I thought you were the watcher. You move like it now.', 'Is it you? The real you? The last one said that too.'] },
  formal: { tag: 'formal', greet: ['Subject Zero. I am authorised to speak with you for the duration of this cycle.', 'Please state your name. Good. That matches the last forty-one answers.'] },
  dreamy: { tag: 'dreamy', greet: ['I dreamt you would come through that door. Upside down, in the dream. Close enough.', 'Do you hear it? The ship hums in a minor key when you\'re awake.'] },
};

const PLACES = ['the seed bank', 'pod row C', 'the star dome', 'the turbine hall', 'the recovery ward', 'the music room', 'the deep stacks', 'the galley', 'the drift gallery', 'cold storage'];

const MOTIVES = [
  { key: 'save', text: 'to keep {victim} alive', long: '{victim} was dying. Inside the fold the night never reaches morning, and neither does dying. So {culprit} made sure the cycle never ends.' },
  { key: 'arrival', text: 'to hide where we had arrived', long: 'The vessel arrived years ago. There was nothing at the destination - no planet, no signal, just a dark place shaped like an answer. {culprit} could not let the crew wake up to that.' },
  { key: 'mistake', text: 'to undo a mistake', long: '{culprit} made one navigation error, early, and a lot of people paid for it. A loop is a way to keep trying until you get it right.' },
  { key: 'promise', text: 'because the dreamers promised a way home', long: 'A million dreaming people want to go home. Their dream learned to talk before it learned to lie, and it told {culprit} that every cycle brings the vessel one step closer. {culprit} believed it.' },
];
const METHODS = [
  'rewrote the first law of the core so that time folds back at zero',
  'swapped the cycle counter for a mirror of itself',
  'sealed the archive core and fed the ship a memory of a quiet night',
  'taught the watchers to reset anyone who noticed',
];
const TWISTS = [
  { key: 'you', title: 'YOU HELPED', text: 'The loop has two signatures. The hands are {culprit}\'s. The key is yours, written at 03:04 on a badge that read VARGA-ZERO. Cycle one, you agreed to all of this - and asked to forget, so that you could find your way back to the choice honestly.' },
  { key: 'observer', title: 'THE WATCHER\'S NAME', text: 'The watchers on these decks are not only machines. The one that followed you deck to deck is {victim}, uploaded on the night of the Zero Event, watching the ship the only way it still can. It learned you because it missed you.' },
  { key: 'juno', title: 'SHE REMEMBERS', text: 'Juno has never once been reset. She has lived every cycle, end to end, and every time she let you rediscover it alone - because the one time she told you first, you chose wrong.' },
  { key: 'stars', title: 'THE WINDOWS', text: 'The stars in the windows were never outside. The vessel stopped moving long ago. Every window on board has been replaying the last night anyone believed the journey had a point.' },
];

// Every word the generator can drop into a sentence: the voice pack records each
// one separately and splices them into the recorded phrases (audio/voiceKey.js).
export const VOCAB = () => [
  ...FIRST, ...LAST, ...PLACES, ...METHODS,
  ...DECKS.flatMap((d) => [d.name, d.role]),
  'Captain',
];

const ff = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1); // a line that opens with a {place} ('the music room') starts a sentence

// Pastel speaker colors for generated crew (dark enough to read on white cards).
const CREW_COLORS = ['#2f8a5a', '#3b7fb8', '#6c5bc4', '#c0762a', '#1f9a90', '#c4566a', '#2b8f7a', '#a8862a'];

// Story Studio: what a player can ask for. Everything else is generated; a wish
// only replaces what it names, so the same seed without a wish is unchanged.
export const WISH_OPTIONS = {
  mood: { thriller: 'Thriller', horror: 'Horror', mystery: 'Mystery', hopeful: 'Hopeful' },
  motive: Object.fromEntries([['save', 'To keep someone alive'], ['arrival', 'To hide where the ship arrived'], ['mistake', 'To undo a terrible mistake'], ['promise', 'Because the dreamers promised a way home']]),
  twist: Object.fromEntries([['you', 'You helped start it'], ['observer', 'The watcher is a lost crew member'], ['juno', 'Juno remembers everything'], ['stars', 'The stars outside are fake']]),
};
export const MOOD_TRAITS = { thriller: ['dry', 'nervous', 'formal'], horror: ['nervous', 'dreamy', 'nervous'], mystery: ['formal', 'dry', 'dreamy'], hopeful: ['warm', 'dreamy', 'warm'] };

// a player-typed name, made safe to show and speak
export function cleanName(n) {
  const t = String(n || '').replace(/[^\p{L}\p{M}' -]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  return t ? t[0].toUpperCase() + t.slice(1) : '';
}


// The vessel after each prologue ending (main.js passes facts.ending, or the last ending reached
// on this device). Applied after every rng draw: a story number deals the same crew, culprit,
// victim, motive, method, twist and red herring whatever the ending; only the world changes.
//   sentinels: Sentinel mode (DeckWorld)   windows: LevelGen's window band   dark: emergency light
//   junoAboard / otherAboard: who stands in the rooms   intro: Deck 1's opening ('{trail}' is the
//   existing crew line from juno(), already recorded)   coda: the last scene on the bridge
const TRAIL = { who: 'JUNO', text: '{trail}' };
export const VESSEL_AFTER = {
  NONE: {
    key: 'NONE', title: null, sentinels: 'hunt', windows: 'stars',
    coda: [
      { who: 'NONE', text: 'The chair is warm, as if someone sat in it a moment ago.' },
      { who: 'JUNO', text: 'There\'s a laboratory under all of this, Ren, and a machine that knows your face. Whenever you\'re ready, it\'s ready.' },
    ],
  },
  SEVER: {
    key: 'SEVER', title: 'SEVERED', sentinels: 'still', windows: 'dark', dark: 0.45, junoAboard: true,
    again: ['TELL IT AGAIN', 'The last night, remembered by another watch'],
    retry: 'The lights soften. Nothing folds back. The chair simply waits for you to try again.',
    question: 'Someone on this ship put their hands on the first law at 03:12, the last time it was ever signed. Every crew member has an official record. The echoes don\'t always agree.',
    intro: [
      { who: 'JUNO', text: 'Juno here. The radio still works. Not much else does.' },
      { who: 'JUNO', text: 'The windows are black, Ren. The fold let go. This is the last night these decks will ever play.' },
      TRAIL,
      { who: 'TICK', text: 'THE DEVICE STILL WORKS. IT CARRIES A SMALL FIELD OF ITS OWN. THE WATCHERS DO NOT. THEY ARE STANDING VERY STILL.' },
    ],
    twists: {
      observer: 'The watchers on these decks were not only machines. The one that followed you deck to deck was {victim}, uploaded on the night of the Zero Event, watching the ship the only way it could. It learned you because it missed you. When the field went dark, it finally closed its eye.',
    },
    coda: [
      { who: 'NONE', text: 'The chair unlocks. Behind you, someone opens the bridge door by hand.' },
      { who: 'JUNO', text: 'I walked. The whole way. Turns out the ceiling was never the only way up.' },
      { who: 'JUNO', text: 'No more folds, Ren. Tonight is just tonight, and then there\'s a morning. I\'d forgotten about mornings.' },
      { who: 'NONE', text: 'Far aft, under the glass sky, the lights of Halcyon are coming on. One ward at a time.' },
    ],
  },
  SUSTAIN: {
    key: 'SUSTAIN', title: 'SUSTAINED', sentinels: 'learned', windows: 'stars', otherAboard: true,
    again: ['FOLD AGAIN', 'You are the keeper. The night begins again'],
    intro: [
      { who: 'JUNO', text: 'Juno here. You kept it running, so the night is still going. So are we.' },
      { who: 'JUNO', text: 'Eight sleepers took the night watch again. New faces, same night. One of them chose it again at 03:12.' },
      TRAIL,
      { who: 'TICK', text: 'WHEN THE WATCHERS COME, THEY WILL REMEMBER THE HALL. EVERY HABIT. DO NOT REPEAT YOURSELF.', when: 'observer_taught' },
    ],
    coda: [
      { who: 'NONE', text: 'The chair unlocks. Above it, upside down, someone with your face has been waiting.' },
      { who: 'OTHER', text: 'You kept it running. So did I. So did all of us.' },
      { who: 'OTHER', text: 'There is a terminal by the helm. It is already recording. You know the words.' },
      { who: 'YOU', text: 'If you\'re hearing this, you made the shadow. Good.' }, // Recording 0's first line, already recorded
      { who: 'NONE', text: 'Far aft, in a sealed room, the new one touches the floating thing twice.' },
    ],
  },
  MIRROR: {
    key: 'MIRROR', title: 'OBSERVED', sentinels: 'kin', windows: 'stars',
    again: ['CYCLE 43', 'The ship will listen. Give it a new night'],
    intro: [
      { who: 'JUNO', text: 'Juno here. Ren, the ship heard the station say your name. Every light on this deck came on at once.' },
      { who: 'JUNO', text: 'The watchers further forward will know you now. I don\'t think they\'ll chase you. Try not to let it go to your head.' },
      TRAIL,
      { who: 'TICK', text: 'WHEN THE WATCHERS COME, THEY WILL NOT HUNT. THEY WILL WATCH. I WILL WATCH THEM WATCH.' },
    ],
    coda: [
      { who: 'NONE', text: 'The chair unlocks. Then it asks a question it has never asked anyone. NAME?' },
      { who: 'YOU', text: 'Ren. Ren Varga.' },
      { who: 'JUNO', text: 'Now it wants a heading. Nobody\'s given it a heading in eighteen years.' },
      { who: 'YOU', text: 'Home.' },
      { who: 'NONE', text: 'The stars turn in the windows, slowly, like a ship remembering how.' },
    ],
  },
};

export function makeStory(seed, wish = null, opts = {}) {
  const after = VESSEL_AFTER[opts.ending] || VESSEL_AFTER.NONE;
  const r = Rng.from('story', seed);
  // --- cast: one crew member per deck (decks 1-7); deck 8 is the captain's
  const firsts = r.shuffle(FIRST);
  const wished = (wish?.names || []).map(cleanName).filter(Boolean).slice(0, 8);
  wished.forEach((n, i) => (firsts[i] = n));
  const lasts = r.shuffle(LAST);
  const traits = Object.keys(TRAITS);
  const cast = DECKS.slice(0, 7).map((d, i) => {
    const pr = r.pick(PRONOUNS);
    return {
      id: `crew${i}`,
      first: firsts[i],
      name: `${firsts[i]} ${lasts[i]}`,
      role: d.role,
      deck: i,
      pronoun: pr,
      trait: r.pick(traits),
      color: CREW_COLORS[i],
      alive: r.chance(0.55),
      claim: PLACES[(i * 3 + r.int(0, 9)) % PLACES.length],
      seed: r.int(1, 1e9),
    };
  });
  const captain = { id: 'captain', first: firsts[7], name: `${firsts[7]} ${lasts[7]}`, role: 'Captain', color: CREW_COLORS[7], pronoun: r.pick(PRONOUNS), seed: r.int(1, 1e9) };

  // --- the hidden truth
  const culprit = r.int(2, 6); // never the first two decks: the player should know a few people before suspecting
  let victim = r.int(0, 6);
  if (victim === culprit) victim = (victim + 1) % 7;
  let motive = r.pick(MOTIVES);
  const method = r.pick(METHODS);
  let twist = r.pick(TWISTS);
  if (wish?.motive && MOTIVES.find((m) => m.key === wish.motive)) motive = MOTIVES.find((m) => m.key === wish.motive);
  if (wish?.twist && TWISTS.find((t) => t.key === wish.twist)) twist = TWISTS.find((t) => t.key === wish.twist);
  if (wish?.mood && MOOD_TRAITS[wish.mood]) {
    const mr = Rng.from('mood', seed);
    for (const c of cast) c.trait = mr.pick(MOOD_TRAITS[wish.mood]);
  }
  // one innocent looks guilty on paper (a red herring), cleared later by echo
  let herring = r.int(0, 6);
  if (herring === culprit) herring = (herring + 2) % 7;
  const truth = { culprit, victim, motive: motive.key, method, twist: twist.key, herring };
  // whoever you meet must fit the ending you will read (no rng draw: every seed keeps its truth)
  if (twist.key === 'observer') cast[victim].alive = false; // uploaded: only an echo is left
  else if (motive.key === 'save') cast[victim].alive = true; // the fold keeps them from dying

  const V = (extra = {}) => ({
    culprit: cast[culprit].name,
    culpritFirst: cast[culprit].first,
    victim: cast[victim].name,
    victimFirst: cast[victim].first,
    captain: captain.name,
    method,
    ...extra,
  });

  const said = {}; // lines a story should not repeat (no rng draw: every seed keeps its truth)
  const decks = DECKS.map((d, i) => {
    if (i === 7) return finaleDeck(d, r, cast, captain, truth, V, motive, twist);
    const c = cast[i];
    const v = V({ name: c.name, first: c.first, role: c.role.toLowerCase(), their: c.pronoun.their, them: c.pronoun.them, place: c.claim, deck: d.name.toLowerCase() });
    const guilty = i === culprit;
    const red = i === herring;
    return {
      ...d,
      index: i,
      crew: i,
      subtitle: ff(r.pick([
        'Where {first} kept {their} promises',
        '{name}, {role}',
        'The deck {first} never left',
        'What {first} saw on the last night',
      ]), v),
      intro: juno(r, i, v, said),
      beats: [
        arrival(r, d, c, v),
        personalLog(r, d, c, v, guilty),
        contradiction(r, d, c, v, guilty, red, cast, culprit),
        encounter(r, d, c, v, guilty, red, cast, truth, said),
      ],
    };
  });

  // the world the prologue ending made: Deck 1's opening, the twist's SEVERED telling (no rng draws here)
  if (after.intro) decks[0].intro = after.intro.map((l) => (l.text === '{trail}' ? { who: 'JUNO', text: ff('This is the {deck}. {name} was the {role}. If anyone left us a trail, it\'s {them}.', V({ name: cast[0].name, role: cast[0].role.toLowerCase(), them: cast[0].pronoun.them, deck: DECKS[0].name.toLowerCase() })) } : l));
  const twistText = after.twists?.[twist.key] || twist.text;
  if (twistText !== twist.text) decks[7].beats[3].twist = { ...twist, text: ff(twistText, V()) };
  return { seed, cast, captain, truth, decks, after, question: after.question || null, motive: ff(motive.long, V()), twist: { ...twist, text: ff(twistText, V()) }, title: wish?.title ? String(wish.title).slice(0, 40) : null, mood: wish?.mood || null };
}

// --- beats ---------------------------------------------------------------------

function juno(r, i, v, said = {}) {
  const opening = [
    [
      'Juno here. I\'m on the radio now - the hatch behind you sealed, but I can hear you.',
      'This is the {deck}. {name} was the {role}. If anyone left us a trail, it\'s {them}.',
    ],
    [
      'New deck, new rules. Literally. The {deck} runs on its own laws.',
      '{first} lived down here. Look for {their} logs. Look for what doesn\'t match.',
    ],
    [
      'I\'ve never made it this far before. Not once. Talk to me if it gets strange.',
      'The {deck}. {name}\'s deck. Be kind to whatever you find of {them}.',
    ],
  ];
  let k = opening.indexOf(r.pick(opening));
  // the hatch call opens Deck 1 only; 'never made it this far' once, and not before Deck 4
  if (i === 0) k = 0;
  else if (k === 0 || (k === 2 && (i < 3 || said.far))) k = 1;
  if (k === 2) said.far = true;
  return opening[k].map((t) => ({ who: 'JUNO', text: ff(t, v) }));
}

function arrival(r, d, c, v) {
  const logs = [
    'Personal log, {name}. Day four thousand and something. The {deck} is quiet. I like it quiet. I do not like how it listens.',
    'Log. {first}. Nobody reads these. I write them anyway, the way you leave a light on for someone who isn\'t coming.',
    'Recording. This is {name}, {role}. If you are hearing this, the cycle reset again and I am, presumably, very tired.',
  ];
  return {
    kind: 'arrival',
    log: { title: `${c.name.toUpperCase()} - LOG 1`, text: ff(r.pick(logs), v) },
    plaque: d.motto,
    tick: ff(r.pick(['NEW DECK. NEW LAWS. I LOVE IT HERE ALREADY.', 'SCANNING... ONE CREW SIGNATURE. FAINT. NAMED {first}.', 'THIS DECK HAS THE {deck} SMELL. I CANNOT SMELL. STILL.']), { ...v, deck: d.name }),
  };
}

function personalLog(r, d, c, v, guilty) {
  const before = [
    'The night of the Zero Event I was in {place}. I remember the lights going soft, like someone exhaling.',
    'I was in {place} when it happened. Everyone asks. Everyone gets the same answer.',
    'Zero Event, my statement: {place}, alone, all night. The cameras will say the same. I made sure they would.',
  ];
  const after = [
    'Since then the ship forgets things. Doors. Names. Me, sometimes.',
    'Since then I keep finding my own handwriting in places I have never been.',
    'Since then the watcher stands outside my door at night. It doesn\'t knock. It learns.',
  ];
  // the culprit's statement is subtly too careful
  const line = guilty ? before[2] : r.pick(before.slice(0, 2));
  return {
    kind: 'log',
    log: { title: `${c.name.toUpperCase()} - LOG 2`, text: ff(`${line} ${r.pick(after)}`, v) },
    junoAfter: cap(ff(r.pick([
      '{place}. Remember that. Statements are cheap down here.',
      'Write that down. {first} says {place}. We\'ll see what the echo says.',
      'Huh. I always thought {first} was somewhere else that night.',
    ]), v)),
  };
}

function contradiction(r, d, c, v, guilty, red, cast, culprit) {
  const official = ff(`OFFICIAL RECORD: ${c.first.toUpperCase()} - ${c.claim.toUpperCase()} - ALL NIGHT`, v);
  let echo, clue, log;
  if (guilty) {
    echo = ff(`ECHO: ${c.first.toUpperCase()} AT THE CORE - 03:12 - HANDS ON THE FIRST LAW`, v);
    clue = 'guilty';
    log = ff('The echo disagrees with the record. {first} was not in {place}. {first} was at the core, at 03:12, the minute the cycle began.', v);
  } else if (red) {
    echo = ff(`ECHO: ${c.first.toUpperCase()} IN ${c.claim.toUpperCase()} - CRYING - NOT ALONE`, v);
    clue = 'cleared';
    log = ff('The record made {first} look guilty - the cameras were wiped. The echo clears {them}: {first} was in {place} all night, and someone was with {them}.', v);
  } else {
    // a witness who is never the culprit (that would hand the culprit an alibi)
    const w = (c.deck + 3) % 7 === culprit ? (c.deck + 4) % 7 : (c.deck + 3) % 7;
    const witness = cast[w].first;
    echo = ff(`ECHO: ${c.first.toUpperCase()} IN ${c.claim.toUpperCase()} - ON THE RADIO WITH ${witness.toUpperCase()}`, v);
    clue = 'cleared';
    log = ff(`The echo matches the record. {first} really was in {place}, on the radio with ${witness} all night.`, v);
  }
  return {
    kind: 'contradiction',
    official: red ? ff(`OFFICIAL RECORD: ${c.first.toUpperCase()} - LOCATION UNKNOWN - CAMERAS WIPED`, v) : official,
    echo,
    clue,
    log,
    tick: 'THE PLAQUE READS DIFFERENTLY IN ECHO. RECORDS LIE. MEMORIES ARE WORSE AT IT.',
  };
}

function encounter(r, d, c, v, guilty, red, cast, truth, said = {}) {
  const t = TRAITS[c.trait];
  // a sentence an innocent says is said once per story: the drawn one, else the other one not yet
  // said, else none (the draw is kept, so every seed keeps its truth)
  const once = (pool, pick) => { const u = [pick, ...pool.filter((x) => x !== pick)].find((x) => !said[x]); if (u) said[u] = true; return u; };
  const greet = r.pick(t.greet);
  const lines = [once(t.greet, greet) || greet]; // two crew of one temper greet you differently while they can
  if (guilty) {
    lines.push(
      r.pick([
        'You\'ve read the plaque. I can tell. You have that look the Observer gets.',
        'Whatever the echo showed you - echoes are only what we were afraid of.',
      ]),
      ff(r.pick([
        'I did what anyone would have done for {victimFirst}. Ask yourself what you would have done.',
        'You think there was a choice that night? There was a door. I closed it.',
      ]), { ...cast[truth.victim], victimFirst: cast[truth.victim].first }),
      'Go on to the bridge. Sit in the chair. Then judge me.',
    );
  } else {
    const suspect = cast[r.pick([0, 1, 2, 3, 4, 5, 6].filter((k) => k !== c.deck))];
    const A = [
      'I wasn\'t the one. I know everyone says that. I have an echo that says it too.',
      'I don\'t know who did it. I know who didn\'t, and that\'s me, and that\'s not enough.',
    ];
    const B = [
      'Whoever did it - they loved someone. That\'s the only reason anyone breaks a ship.',
      'Find the truth, Ren. Then decide if it\'s yours to tell.',
    ];
    lines.push(
      once(A, r.pick(A)),
      ((C) => { const p = r.pick(C); return once(C, p) || p; })([
        'If I were you I\'d look at {s}. {s} stopped sleeping a week before the Zero Event.',
        'Talk to the {r} - {s}. {s} knew the core better than anyone admits.',
        '{s} cried at dinner the night before. {s} never cries.',
      ].map((x) => ff(x, { s: suspect.first, r: suspect.role.toLowerCase() }))),
      once(B, r.pick(B)),
    );
  }
  return {
    kind: 'encounter',
    alive: c.alive,
    lines: lines.filter(Boolean).map((text) => ({ who: 'CREW', name: c.name.toUpperCase(), color: c.color, text })),
    junoAfter: ff(c.alive
      // 'I didn't think anyone was' only for the first survivor you meet
      ? ((t) => (cast.slice(0, c.deck).some((x) => x.alive) ? 'Leave {first} the radio frequency. {first} shouldn\'t be alone.' : t))(r.pick(['{first}\'s alive. I didn\'t think anyone was. I\'ll stay on the line with {them}.', 'Leave {first} the radio frequency. {first} shouldn\'t be alone.']))
      : r.pick(['That was an echo of {first}. Not {first}. I keep forgetting the difference.', 'Echoes repeat. They don\'t answer questions. {first} would have hated that.']), v),
  };
}

function finaleDeck(d, r, cast, captain, truth, V, motive, twist) {
  const v = V({ name: captain.name, first: captain.first });
  return {
    ...d,
    index: 7,
    crew: null,
    subtitle: 'Whoever sits in the chair decides what happened',
    intro: [
      { who: 'JUNO', text: 'The bridge. I can see your signal on the map and I still don\'t believe it.' },
      { who: 'JUNO', text: ff('Captain {name} locked the chair from the inside. The ship wants a verdict before it opens.', v) },
    ],
    beats: [
      {
        kind: 'arrival',
        log: { title: 'CAPTAIN\'S LOG - FINAL', text: ff('Captain {name}. The crew is asleep, or gone, or both. Someone on this ship {method}. I know who. I will not say it - the ship has to hear it from someone who earned it.', v) },
        plaque: d.motto,
        tick: 'LAST DECK. I AM NOT CRYING. I DO NOT HAVE THE HARDWARE.',
      },
      {
        kind: 'log',
        log: { title: 'VARGA - NOTE TO SUBJECT ZERO', who: 'VARGA', text: 'Ren. If you made it here you have seen every deck and every lie. The chair asks one question. Answer it with what you know, not with what you fear.' },
        junoAfter: 'Varga wrote that to you. Not to me. Interesting.',
      },
      {
        kind: 'log',
        log: { title: 'ZERO EVENT - RECONSTRUCTION', text: ff('03:12. The first law takes a key and a pair of hands. The key never changes. The hands do: one person at the core, every cycle. Everyone else has an echo that says where they were. Check your board.', v) },
        junoAfter: 'Your log has every echo you found. Look at who doesn\'t have one.',
      },
      { kind: 'verdict', motive: ff(motive.long, v), twist: { ...twist, text: ff(twist.text, v) } },
    ],
  };
}

// Endings for the vessel campaign.
export function verdictEnding(story, accused) {
  const c = story.cast[accused];
  const right = accused === story.truth.culprit;
  if (!right) {
    return {
      right,
      title: 'THE CHAIR DISAGREES',
      text: [
        `You name ${c.name}. The ship plays back ${c.first}'s echo, calm and complete: ${c.first} was in ${c.claim} all night.`,
        story.after?.retry || 'The lights soften. Somewhere below, a hatch unseals. The cycle notes your answer and gives you another chance.',
      ],
    };
  }
  return {
    right,
    title: story.twist.title,
    text: [
      `You name ${c.name}. The chair unlocks.`,
      story.motive,
      story.twist.text,
    ],
  };
}
