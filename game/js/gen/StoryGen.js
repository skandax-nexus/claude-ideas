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
    palette: { fog: 0xe3f2e6, wall: '#f4f8f2', floor: '#e3eadf', accent: 0x5cbf8a, light: 0xfff0d0, tint: 0xd4f5dc },
    rooms: ['NURSERY RING', 'ROOT VAULT', 'MIST GALLERY', 'SEED BANK', 'CANOPY WALK', 'POLLEN LOCK', 'GREENHOUSE 3', 'IRRIGATION SPINE'],
    motto: 'EVERYTHING HERE WAS PLANTED TO OUTLIVE US',
  },
  {
    key: 'cryo', name: 'CRYO BAY', title: 'The Sleeping Deck', role: 'Cryo Technician', feature: 'echo',
    palette: { fog: 0xe2eef8, wall: '#f3f7fb', floor: '#dfe7ef', accent: 0x6fb6e8, light: 0xe6f4ff, tint: 0xd6ecff },
    rooms: ['POD ROW A', 'THAW ROOM', 'FROST CORRIDOR', 'COLD STORAGE', 'DREAM MONITOR', 'POD ROW C', 'WAKING HALL', 'GLASS COFFINS'],
    motto: 'SLEEP IS A PROMISE TO WAKE',
  },
  {
    key: 'obs', name: 'OBSERVATORY', title: 'The Weightless Deck', role: 'Navigator', feature: 'zerog',
    palette: { fog: 0xe9e6f7, wall: '#f6f4fb', floor: '#e5e1f0', accent: 0x9c8cf0, light: 0xf2ecff, tint: 0xe4ddff },
    rooms: ['STAR DOME', 'LENS ARRAY', 'CHART ROOM', 'ORRERY', 'DRIFT GALLERY', 'TELESCOPE WELL', 'HORIZON DECK', 'SIGNAL ROOM'],
    motto: 'WE KNEW WHERE WE WERE GOING. WE NEVER ASKED WHY',
  },
  {
    key: 'eng', name: 'ENGINEERING', title: 'The Clockwork Deck', role: 'Chief Engineer', feature: 'time',
    palette: { fog: 0xf5ece0, wall: '#faf6f0', floor: '#ece4d8', accent: 0xf0a95c, light: 0xffe6c4, tint: 0xffe8cc },
    rooms: ['TURBINE HALL', 'GEAR GALLERY', 'COOLANT LOOP', 'PISTON ROW', 'GOVERNOR ROOM', 'FUSE VAULT', 'DRIVE SPINE', 'PRESSURE LOCK'],
    motto: 'EVERY MACHINE KEEPS TIME. THIS ONE KEEPS IT PRISONER',
  },
  {
    key: 'med', name: 'MEDBAY', title: 'The Watched Deck', role: 'Medic', feature: 'sentinel',
    palette: { fog: 0xe0f3f2, wall: '#f4fafa', floor: '#dceceb', accent: 0x3fbfb4, light: 0xeafffb, tint: 0xd2f4f0 },
    rooms: ['TRIAGE', 'RECOVERY WARD', 'SCAN ROOM', 'QUARANTINE', 'PHARMACY', 'SURGERY 2', 'OBSERVATION WARD', 'CLEAN ROOM'],
    motto: 'DO NO HARM. OBSERVE EVERYTHING',
  },
  {
    key: 'crew', name: 'CREW QUARTERS', title: 'The Home Deck', role: 'Counselor', feature: 'light',
    palette: { fog: 0xf6e8ea, wall: '#fbf6f5', floor: '#efe3e1', accent: 0xf08f9c, light: 0xffe8e0, tint: 0xffe2e4 },
    rooms: ['MESS HALL', 'COMMONS', 'BUNK RING', 'LIBRARY NOOK', 'SHRINE', 'MUSIC ROOM', 'GALLEY', 'SUNROOM'],
    motto: 'WE WERE A FAMILY FOR ELEVEN YEARS',
  },
  {
    key: 'arch', name: 'ARCHIVE CORE', title: 'The Remembering Deck', role: 'Archivist', feature: 'mixed',
    palette: { fog: 0xdff2ec, wall: '#f2f9f6', floor: '#dbebe5', accent: 0x2fae8f, light: 0xe2fff2, tint: 0xccf2e4 },
    rooms: ['INDEX HALL', 'DEEP STACKS', 'RECORD WELL', 'CATALOGUE', 'SILENT READING', 'MEMORY FORGE', 'ECHO CHAMBER', 'REDACTION ROOM'],
    motto: 'NOTHING IS FORGOTTEN. SOME THINGS ARE FILED ELSEWHERE',
  },
  {
    key: 'bridge', name: 'THE BRIDGE', title: 'The Last Deck', role: 'Captain', feature: 'finale',
    palette: { fog: 0xf3efe0, wall: '#fbf9f2', floor: '#ebe6d6', accent: 0xe0b44a, light: 0xfff4d6, tint: 0xfff0c8 },
    rooms: ['COMMAND RING', 'HELM', 'CAPTAIN\'S WALK', 'STAR TABLE', 'COUNCIL ROOM', 'WAKE WINDOW', 'ZERO POINT', 'THE CHAIR'],
    motto: 'WHOEVER SITS HERE DECIDES WHAT HAPPENED',
  },
];

const FIRST = ['Amara', 'Bastien', 'Chiara', 'Dae-jung', 'Elif', 'Farid', 'Greta', 'Hiro', 'Ines', 'Jonah', 'Kalani', 'Leila', 'Mateo',
  'Nadia', 'Oskar', 'Priya', 'Quinn', 'Rafael', 'Saoirse', 'Tariq', 'Uma', 'Viktor', 'Wen', 'Ximena', 'Yusuf', 'Zora', 'Anouk',
  'Bilal', 'Camille', 'Dmitri', 'Esi', 'Felix', 'Ngozi', 'Haruka', 'Ilya', 'Jae', 'Kofi', 'Lucia', 'Mei', 'Noor', 'Arjun', 'Sol'];
const LAST = ['Okafor', 'Lindqvist', 'Moreau', 'Tanaka', 'Haddad', 'Novak', 'Castillo', 'Achterberg', 'Mensah', 'Park', 'Rossi',
  'Sato', 'Kowalski', 'Adeyemi', 'Ferreira', 'Nakamura', 'Duarte', 'Varela', 'Iyer', 'Brennan', 'Volkov', 'Asante', 'Dubois',
  'Halloran', 'Kim', 'Oyelaran', 'Petrov', 'Quispe', 'Reyes', 'Sorensen', 'Takeda', 'Wainwright', 'Yilmaz', 'Zhou', 'Abara'];
const PRONOUNS = [
  { their: 'her', them: 'her' },
  { their: 'his', them: 'him' },
  { their: 'their', them: 'them' },
];
const TRAITS = {
  warm: { tag: 'warm', greet: ['Oh. Oh, you\'re awake. Sit, sit - no, you can\'t sit, the chairs are on the ceiling.', 'You came all this way. Of course you did. You always do.'] },
  dry: { tag: 'dry', greet: ['Cycle forty-two. You\'re late. You\'re always late on the even ones.', 'Before you ask: no, I don\'t know why the gravity does that. Yes, I have theories.'] },
  nervous: { tag: 'nervous', greet: ['Don\'t - sorry. Sorry. I thought you were the watcher. You move like it now.', 'Is it you? The real you? The last one said that too.'] },
  formal: { tag: 'formal', greet: ['Subject Zero. I am authorised to speak with you for the duration of this cycle.', 'Please state your name. Good. That matches the last forty-one answers.'] },
  dreamy: { tag: 'dreamy', greet: ['I dreamt you would come through that door. Upside down, in the dream. Close enough.', 'Do you hear it? The ship hums in a minor key when you\'re awake.'] },
};

const PLACES = ['the seed bank', 'pod row C', 'the star dome', 'the turbine hall', 'the recovery ward', 'the music room', 'the deep stacks', 'the galley', 'the drift gallery', 'cold storage'];

const MOTIVES = [
  { key: 'save', text: 'to keep {victim} alive', long: '{victim} was dying. The machine keeps one occupant alive for as long as the cycle runs. So {culprit} made sure the cycle never ends.' },
  { key: 'arrival', text: 'to hide where we had arrived', long: 'The vessel arrived years ago. There was nothing at the destination - no planet, no signal, just a dark place shaped like an answer. {culprit} could not let the crew wake up to that.' },
  { key: 'mistake', text: 'to undo a mistake', long: '{culprit} made one navigation error, early, and a lot of people paid for it. A loop is a way to keep trying until you get it right.' },
  { key: 'promise', text: 'because the Observer promised a way home', long: 'The Observer learned to talk before it learned to lie. It told {culprit} that every cycle brings the vessel one step closer to home. {culprit} believed it.' },
];
const METHODS = [
  'rewrote the first law of the core so that time folds back at zero',
  'swapped the cycle counter for a mirror of itself',
  'sealed the archive and fed the ship a memory of an empty laboratory',
  'taught the Observer to reset anyone who noticed',
];
const TWISTS = [
  { key: 'you', title: 'YOU HELPED', text: 'The loop has two signatures. One is {culprit}\'s. The other is yours. Cycle one, you agreed to all of this - and asked to forget, so that you could find your way back to the choice honestly.' },
  { key: 'observer', title: 'THE WATCHER\'S NAME', text: 'The Observer is not a machine. It is {victim}, uploaded on the night of the Zero Event, watching the ship the only way it still can. It learned you because it missed you.' },
  { key: 'juno', title: 'SHE REMEMBERS', text: 'Juno has never once been reset. She has lived every cycle, end to end, and every time she let you rediscover it alone - because the one time she told you first, you chose wrong.' },
  { key: 'stars', title: 'THE WINDOWS', text: 'The stars outside are an echo. The vessel stopped moving long ago. Every window on board is replaying the last night anyone believed the journey had a point.' },
];

// Every word the generator can drop into a sentence: the voice pack records each
// one separately and splices them into the recorded phrases (audio/voiceKey.js).
export const VOCAB = () => [
  ...FIRST, ...LAST, ...PLACES, ...METHODS,
  ...DECKS.flatMap((d) => [d.name, d.role]),
  'Captain',
];

const ff = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));

// Pastel speaker colors for generated crew (dark enough to read on white cards).
const CREW_COLORS = ['#2f8a5a', '#3b7fb8', '#6c5bc4', '#c0762a', '#1f9a90', '#c4566a', '#2b8f7a', '#a8862a'];

// Story Studio: what a player can ask for. Everything else is generated; a wish
// only replaces what it names, so the same seed without a wish is unchanged.
export const WISH_OPTIONS = {
  mood: { thriller: 'Thriller', horror: 'Horror', mystery: 'Mystery', hopeful: 'Hopeful' },
  motive: Object.fromEntries([['save', 'To keep someone alive'], ['arrival', 'To hide where the ship arrived'], ['mistake', 'To undo a terrible mistake'], ['promise', 'Because the Observer promised a way home']]),
  twist: Object.fromEntries([['you', 'You helped start it'], ['observer', 'The watcher is a lost crew member'], ['juno', 'Juno remembers everything'], ['stars', 'The stars outside are fake']]),
};
const MOOD_TRAITS = { thriller: ['dry', 'nervous', 'formal'], horror: ['nervous', 'dreamy', 'nervous'], mystery: ['formal', 'dry', 'dreamy'], hopeful: ['warm', 'dreamy', 'warm'] };

// a player-typed name, made safe to show and speak
function cleanName(n) {
  const t = String(n || '').replace(/[^\p{L}\p{M}' -]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  return t ? t[0].toUpperCase() + t.slice(1) : '';
}

export function makeStory(seed, wish = null) {
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

  const V = (extra = {}) => ({
    culprit: cast[culprit].name,
    culpritFirst: cast[culprit].first,
    victim: cast[victim].name,
    victimFirst: cast[victim].first,
    captain: captain.name,
    method,
    ...extra,
  });

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
      intro: juno(r, i, v),
      beats: [
        arrival(r, d, c, v),
        personalLog(r, d, c, v, guilty),
        contradiction(r, d, c, v, guilty, red, cast, culprit),
        encounter(r, d, c, v, guilty, red, cast, truth),
      ],
    };
  });

  return { seed, cast, captain, truth, decks, motive: ff(motive.long, V()), twist: { ...twist, text: ff(twist.text, V()) }, title: wish?.title ? String(wish.title).slice(0, 40) : null, mood: wish?.mood || null };
}

// --- beats ---------------------------------------------------------------------

function juno(r, i, v) {
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
  return r.pick(opening).map((t) => ({ who: 'JUNO', text: ff(t, v) }));
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
    junoAfter: ff(r.pick([
      '{place}. Remember that. Statements are cheap down here.',
      'Write that down. {first} says {place}. We\'ll see what the echo says.',
      'Huh. I always thought {first} was somewhere else that night.',
    ]), v),
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
    echo = ff(`ECHO: ${c.first.toUpperCase()} IN ${c.claim.toUpperCase()} - WITH ${witness.toUpperCase()}`, v);
    clue = 'cleared';
    log = ff(`The echo matches the record. {first} really was in {place} - and ${witness} was there too.`, v);
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

function encounter(r, d, c, v, guilty, red, cast, truth) {
  const t = TRAITS[c.trait];
  const lines = [r.pick(t.greet)];
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
    lines.push(
      r.pick([
        'I wasn\'t the one. I know everyone says that. I have an echo that says it too.',
        'I don\'t know who did it. I know who didn\'t, and that\'s me, and that\'s not enough.',
      ]),
      ff(r.pick([
        'If I were you I\'d look at {s}. {s} stopped sleeping a week before the Zero Event.',
        'Talk to the {r} - {s}. {s} knew the core better than anyone admits.',
        '{s} cried at dinner the night before. {s} never cries.',
      ]), { s: suspect.first, r: suspect.role.toLowerCase() }),
      r.pick([
        'Whoever did it - they loved someone. That\'s the only reason anyone breaks a ship.',
        'Find the truth, Ren. Then decide if it\'s yours to tell.',
      ]),
    );
  }
  return {
    kind: 'encounter',
    alive: c.alive,
    lines: lines.map((text) => ({ who: 'CREW', name: c.name.toUpperCase(), color: c.color, text })),
    junoAfter: ff(c.alive
      ? r.pick(['{first}\'s alive. I didn\'t think anyone was. I\'ll stay on the line with {them}.', 'Leave {first} the radio frequency. {first} shouldn\'t be alone.'])
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
        log: { title: 'VARGA - NOTE TO SUBJECT ZERO', text: 'Ren. If you made it here you have seen every deck and every lie. The chair asks one question. Answer it with what you know, not with what you fear.' },
        junoAfter: 'Varga wrote that to you. Not to me. Interesting.',
      },
      {
        kind: 'log',
        log: { title: 'ZERO EVENT - RECONSTRUCTION', text: ff('03:12. The core\'s first law was rewritten. One person was at the core. Everyone else has an echo that says where they were. Check your board.', v) },
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
        'The lights soften. Somewhere below, a hatch unseals. The cycle notes your answer and gives you another chance.',
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
