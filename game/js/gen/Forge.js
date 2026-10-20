// WORLD FORGE: "build your own game". The Forge is an offline, deterministic
// engine: a Forge number plus the player's choices (genre, title, hero, the
// locations and their local rules, the cast and their roles, a four-slot kit
// of gear, the length) become a complete new game that the existing runtime
// plays: open acts are HALCYON-style districts (gen/ZoneGen.js), deck acts
// are vessel-style sectors (gen/LevelGen.js).
//
// Nothing here is a chat or neural model. The Forge recombines hand-written
// story parts (the line banks below) around the player's choices, and it
// plans every puzzle so that it is solvable under that location's rules with
// the laws the device knows and the gear the kit allows (tests/forge.test.mjs
// checks thousands of games).
import { Rng } from './rng.js';
import { DECKS, FIRST, LAST, PRONOUNS, TRAITS, MOOD_TRAITS, cleanName } from './StoryGen.js';
import { ZONES, CRADLE_ZONE, FRAGMENTS, CRADLE_FRAGMENTS, CRADLE_HINTS, ZONE_SECTORS } from './ZoneStory.js';
import { MECHANICS } from './LevelGen.js';

const ff = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
const CAST_COLORS = ['#2f8a5a', '#3b7fb8', '#6c5bc4', '#c0762a', '#1f9a90', '#c4566a', '#2b8f7a', '#a8862a'];

// --- what the player can choose ------------------------------------------------------------

export const LENGTHS = { SHORT: { acts: 3, label: 'SHORT', sub: '3 acts, about 40 minutes' }, FULL: { acts: 5, label: 'FULL', sub: '5 acts, about 1 h 30' }, EPIC: { acts: 8, label: 'EPIC', sub: '8 acts, about 2 h 30' } };

// The thirteen locations the engine already renders. Open ones are districts under a dome; deck
// ones are chains of rooms. Blurbs are shown on the act card (not spoken).
export const THEMES = {
  neon: { kind: 'open', theme: 'city', zone: ZONES[0], name: 'NEON MERIDIAN', label: 'Neon city', blurbs: ['A city under glass that never turned its lights off.', 'Rain on the overpass, noodles at midnight, nobody home.'] },
  reactor: { kind: 'open', theme: 'reactor', zone: ZONES[1], name: 'THE DROWNED REACTOR', label: 'Drowned reactor', blurbs: ['Black water in the turbine halls and the lights still on underneath.', 'A reactor that remembers the night it flooded.'] },
  forest: { kind: 'open', theme: 'forest', zone: ZONES[2], name: 'THE GLASS FOREST', label: 'Glass forest', blurbs: ['Glowing trees under a dome, still growing, still waiting.', 'A garden planted to outlive everyone who planted it.'] },
  tower: { kind: 'open', theme: 'tower', zone: ZONES[3], name: 'THE SIGNAL TOWER', label: 'Signal tower', blurbs: ['Storm on the glass and red lights all the way up.', 'The tallest thing for miles, and it is listening.'] },
  cradle: { kind: 'open', theme: 'cradle', zone: CRADLE_ZONE, name: 'THE CRADLE', label: 'Sleeping cradle', blurbs: ['Rows of sleepers under the roots of a forest.', 'A quiet hall where a whole city dreams.'] },
  hydro: { kind: 'deck', deck: DECKS[0], label: 'Garden deck', blurbs: ['Planters to the ceiling and pollen in the air.', 'A greenhouse that outgrew its gardeners.'] },
  cryo: { kind: 'deck', deck: DECKS[1], label: 'Cryo bay', blurbs: ['Frost on the pods and a hum that never stops.', 'Rows of sleepers with their names on the glass.'] },
  obs: { kind: 'deck', deck: DECKS[2], label: 'Observatory', blurbs: ['Star domes, lens arrays and a long way down.', 'A weightless deck that still knows where it was going.'] },
  eng: { kind: 'deck', deck: DECKS[3], label: 'Engineering', blurbs: ['Turbines, pistons and a clock that keeps everything prisoner.', 'Steam, brass and beams that sweep the floor.'] },
  med: { kind: 'deck', deck: DECKS[4], label: 'Medbay', blurbs: ['White rooms, clean light, something watching the ward.', 'A hospital deck that never discharged anyone.'] },
  crew: { kind: 'deck', deck: DECKS[5], label: 'Crew quarters', blurbs: ['Bunks, a galley, a shrine, a family\'s eleven years.', 'The home deck. Someone left the music on.'] },
  arch: { kind: 'deck', deck: DECKS[6], label: 'Archive core', blurbs: ['Deep stacks and a record well that remembers too much.', 'Nothing is forgotten here. Some things are filed elsewhere.'] },
  bridge: { kind: 'deck', deck: DECKS[7], label: 'The bridge', blurbs: ['The last deck, the chair, and a question.', 'Whoever sits here decides what happened.'] },
};
export const THEME_KEYS = Object.keys(THEMES);

// Local rules: what the engine can already do, per location.
export const RULE_OPTIONS = {
  gravity: { NORMAL: 'Down is down.', INVERTED: 'The floor is the ceiling. Shift to INVERTED to stand upright.', ZERO: 'Nothing has weight. You drift.' },
  echoes: { HIDDEN: 'Memories show only in ECHO.', VISIBLE: 'Memories show in every state.', SOLID: 'Memories are solid in every state.' },
  time: { NORMAL: 'Nothing sweeps the floor.', SWEEPERS: 'Beams turn through the halls. Jump them or freeze time.' },
  watchers: { NONE: 'Nobody watches.', PATROL: 'Watchers walk their rounds. Stay out of the cone.', HUNT: 'Watchers hunt: they see far and run fast.' },
  light: { DAY: 'Full light.', NIGHT: 'Dark. A flare helps.', EMERGENCY: 'Red emergency light. A flare burns longest here.' },
};
export const RULE_KEYS = Object.keys(RULE_OPTIONS);
export const NULL_FIELD_TEXT = 'No law and no gear works here. The way through is movement.';

// Gear: reality tools, not weapons (AFTERZERO has no combat). One press, a cooldown.
export const GEAR = {
  STASIS: { name: 'STASIS PULSE', short: 'STASIS', cooldown: 20, dur: 6, desc: 'Freezes the nearest watcher and the nearest sweeper for 6 s.' },
  GRAPPLE: { name: 'GRAPPLE LINE', short: 'GRAPPLE', cooldown: 15, dur: 8, desc: 'A hard-light line across one gap in front of you, up to 8 m, for 8 s.' },
  LENS: { name: 'ECHO LENS', short: 'LENS', cooldown: 25, dur: 10, desc: 'Shows every echo for 10 s, in any state.' },
  RIG: { name: 'LIGHT RIG', short: 'RIG', cooldown: 20, dur: 8, desc: 'A hard-light stair in front of you for 8 s.' },
  FLARE: { name: 'SIGNAL FLARE', short: 'FLARE', cooldown: 40, dur: 20, desc: 'Lights the dark for 20 s. Watchers go to look at it.' },
  KEYFORGE: { name: 'KEY FORGE', short: 'KEY', cooldown: 0, once: true, desc: 'Makes the memory key in your hand real. Once per location.' },
};
export const GEAR_KEYS = Object.keys(GEAR);

// Which gear works under which rules: the rules card lists this per location.
export function gearRule(key, rules) {
  if (rules.nullField) return { ok: false, note: 'null field: nothing works here' };
  const g = GEAR[key];
  switch (key) {
    case 'STASIS':
      if (rules.watchers === 'NONE' && rules.time !== 'SWEEPERS') return { ok: true, dur: g.dur, note: 'nothing here to freeze' };
      if (rules.watchers === 'HUNT') return { ok: true, dur: 4, note: 'hunters shake it off after 4 s' };
      return { ok: true, dur: g.dur, note: null };
    case 'GRAPPLE':
      if (rules.gravity === 'ZERO') return { ok: false, note: 'useless without weight' };
      return { ok: true, dur: g.dur, note: rules.gravity === 'INVERTED' ? 'runs along whatever you stand on' : null };
    case 'LENS':
      if (rules.echoes !== 'HIDDEN') return { ok: false, note: 'echoes are already visible here' };
      return { ok: true, dur: g.dur, note: null };
    case 'RIG':
      if (rules.gravity === 'ZERO') return { ok: false, note: 'stairs need weight' };
      if (rules.light === 'NIGHT') return { ok: true, dur: 12, note: 'holds 12 s in the dark' };
      return { ok: true, dur: g.dur, note: null };
    case 'FLARE':
      if (rules.light === 'DAY' && rules.watchers === 'NONE') return { ok: false, note: 'daylight, and nobody to distract' };
      if (rules.light === 'EMERGENCY') return { ok: true, dur: 30, note: 'burns 30 s in emergency light' };
      return { ok: true, dur: g.dur, note: rules.light === 'DAY' ? 'only a distraction in daylight' : null };
    case 'KEYFORGE':
      return { ok: true, dur: 0, note: 'once per location' };
    default:
      return { ok: false, note: 'unknown gear' };
  }
}

// every rule combination, so docs and tests can see the whole matrix
export function ruleCombos() {
  const out = [];
  for (const gravity of Object.keys(RULE_OPTIONS.gravity)) for (const echoes of Object.keys(RULE_OPTIONS.echoes)) for (const time of Object.keys(RULE_OPTIONS.time))
    for (const watchers of Object.keys(RULE_OPTIONS.watchers)) for (const light of Object.keys(RULE_OPTIONS.light)) for (const nullField of [false, true]) out.push({ gravity, echoes, time, watchers, light, nullField });
  return out;
}

// The rules as the reality engine applies them (RealityEngine.setOverride per room).
export function rulesOverride(rules) {
  if (rules.nullField) return { gravityFlip: false, zeroG: false, echoSolid: false, echoVisible: false, timeStop: false, observerFrozen: false, lightSolid: false, heldPersists: false };
  const o = {};
  if (rules.gravity === 'INVERTED') o.gravityFlip = { PHYSICAL: true, INVERTED: false, ECHO: false }; // upside down until you shift
  if (rules.gravity === 'ZERO') o.zeroG = true;
  if (rules.echoes === 'SOLID') o.echoSolid = true;
  if (rules.echoes === 'VISIBLE') o.echoVisible = true;
  return Object.keys(o).length ? o : null;
}

// effects a location's rules hand you for free (so a puzzle needing them costs no law slot)
export function ruleEffects(rules) {
  const s = new Set();
  if (rules.gravity === 'INVERTED') s.add('gravityFlip');
  if (rules.gravity === 'ZERO') s.add('zeroG');
  if (rules.echoes === 'SOLID') s.add('echoSolid').add('echoVisible');
  if (rules.echoes === 'VISIBLE') s.add('echoVisible');
  return s;
}

export const ROLES = {
  guide: { label: 'Guide', line: 'I know the way through. I have walked it more times than I can count.', secret: 'has walked you through before, and watched you fail' },
  rival: { label: 'Rival', line: 'You are not the first to come looking. You are just the slowest.', secret: 'wants what you came for, and got here first' },
  witness: { label: 'Witness', line: 'I saw it. Nobody believes the one who saw it.', secret: 'saw more than the record says, and said less' },
  keeper: { label: 'Keeper', line: 'I keep this place running. Nobody asked me to. Nobody asked me to stop.', secret: 'is the only one who knows which door was never locked' },
  engineer: { label: 'Engineer', line: 'Everything here can be fixed. Most things here should not be.', secret: 'rewired the lights the night it happened' },
  medic: { label: 'Medic', line: 'Sit down. You are shaking. Everyone shakes down here.', secret: 'signed a report without reading it' },
  child: { label: 'Child of the city', line: 'My mother said the lights would come back. They did. She did not.', secret: 'is older than the place looks' },
  watcher: { label: 'Watcher in disguise', line: 'Do not look at me like that. I am as lost as you are.', secret: 'is not what the badge says' },
};
export const ROLE_KEYS = Object.keys(ROLES);

// --- genres: the mood, the grammar and the line banks -------------------------------------------

const BASE_RULES = { gravity: [['NORMAL', 5], ['INVERTED', 2], ['ZERO', 2]], echoes: [['HIDDEN', 5], ['VISIBLE', 2], ['SOLID', 1.5]], time: [['NORMAL', 5], ['SWEEPERS', 2]], watchers: [['NONE', 3], ['PATROL', 4], ['HUNT', 1.5]], light: [['DAY', 3], ['NIGHT', 3], ['EMERGENCY', 1.5]] };
const rulesTable = (over) => ({ ...BASE_RULES, ...over });

export const GENRES = {
  THRILLER: {
    label: 'THRILLER', tag: 'Someone is lying. The clocks know who.', traits: MOOD_TRAITS.thriller,
    how: 'the one who lied', antRoles: ['rival', 'keeper', 'witness'],
    grammar: { setup: ['arrival', 'encounter', 'log'], mid: ['log', 'contradiction', 'choice'], twist: ['contradiction', 'choice', 'log'], finale: ['log', 'encounter', 'verdict'] },
    rules: rulesTable({ watchers: [['NONE', 1], ['PATROL', 5], ['HUNT', 2]], time: [['NORMAL', 3], ['SWEEPERS', 3]], light: [['DAY', 2], ['NIGHT', 4], ['EMERGENCY', 2]] }),
    nullChance: 0.3, weather: { open: 'rain', deck: 'motes' }, grade: { contrast: 1.18, saturation: 0.96, toning: 0.26 }, threat: 0.2,
    juno: ['Juno here. Somebody rewrote the schedule for this place, Ren. The clocks do not agree.', 'Whoever did it is still close.'],
    junoAfter: 'Nobody signs their own lies.',
    tick: ['SCANNING. ONE LIE PER ROOM, MINIMUM.', 'THE CLOCKS HERE RUN FAST. SO DO THE PEOPLE.'],
    logs: {
      arrival: ['Record. If this is found, I did not leave on my own. Check who signed the second log.'],
      mid: ['They changed the roster again tonight. My name was on it, and then it was not.'],
    },
    records: [
      { official: 'OFFICIAL RECORD: DOOR SEALED AT 03:12 - NO ENTRY', echo: 'ECHO: DOOR OPENED AT 03:11 - ONE PERSON - KEY ACCEPTED', text: 'The record says the door was sealed, and the echo says someone walked through it a minute before.' },
      { official: 'ROSTER: NIGHT WATCH - ALL PRESENT', echo: 'ECHO: NIGHT WATCH - ONE CHAIR EMPTY - ONE EXTRA COAT', text: 'The roster counts everyone present, and the echo counts an empty chair and a coat that belongs to nobody.' },
    ],
    npc: {
      witness: 'I saw the lights go out in order. Somebody planned the order.',
      ant: 'You were always going to find me. I made sure the trail was good.',
      trust: 'Then forget you saw the chair.',
      doubt: 'Ask, and you will not like the answer.',
    },
    choices: [
      { prompt: 'They offer you the key to the next door, if you say nothing about the roster.', a: ['Take the key', 'trust'], b: ['Refuse, and ask about the roster', 'doubt'] },
      { prompt: 'They say the guide is the one who changed the roster.', a: ['Stand by the guide', 'trust'], b: ['Believe them', 'doubt'] },
    ],
    finale: {
      prompt: 'Who rewrote the schedule, and what happens to them?',
      options: [['expose', 'Say the name to the whole station', 'doubt'], ['bargain', 'Make a deal: the truth stays in this room', 'trust'], ['walk', 'Walk away and let the clocks run', 'neutral']],
      outcomes: {
        expose: 'You say the name out loud. Every clock in {place} stops on the same second. {ant} does not run; there was never anywhere to run to.',
        bargain: 'You keep the name. {ant} keeps the schedule. The clocks agree again, and you are the only one who knows why.',
        walk: 'You leave the room with the question still in it. Behind you the clocks go on disagreeing, patiently, like people.',
      },
      codaTrust: 'You trusted them, Ren, and most of them deserved it.', codaDoubt: 'You doubted everyone, and you were right about one.',
      tick: 'CASE CLOSED. FILED UNDER PEOPLE.',
    },
  },
  HORROR: {
    label: 'HORROR', tag: 'Something stayed behind. It learned your name.', traits: MOOD_TRAITS.horror,
    how: 'the one who stayed', antRoles: ['watcher', 'child', 'keeper'],
    grammar: { setup: ['arrival', 'log', 'encounter'], mid: ['log', 'choice', 'contradiction'], twist: ['log', 'contradiction', 'choice'], finale: ['log', 'encounter', 'verdict'] },
    rules: rulesTable({ watchers: [['NONE', 1], ['PATROL', 3], ['HUNT', 4]], light: [['DAY', 1], ['NIGHT', 4], ['EMERGENCY', 3]], echoes: [['HIDDEN', 3], ['VISIBLE', 4], ['SOLID', 1]] }),
    nullChance: 0.35, weather: { open: 'storm', deck: 'frost' }, grade: { contrast: 1.2, saturation: 0.82, toning: 0.3 }, threat: 0.3,
    juno: ['Juno here. I lost your signal for a second, Ren. I have never lost it before.', 'There is something in the walls of this place, listening.'],
    junoAfter: 'Whoever wrote that was not alone.',
    tick: ['SCANNING. ONE HEARTBEAT. YOURS, I THINK.', 'THE WALLS HAVE A PULSE. I AM NOT SAYING THAT AGAIN.'],
    logs: {
      arrival: ['Record. The lights come back on by themselves now. Nobody is left to touch the switch.'],
      mid: ['I counted the sleepers twice. The second count was higher.'],
    },
    records: [
      { official: 'CENSUS: TWELVE RESIDENTS - ALL ACCOUNTED FOR', echo: 'ECHO: THIRTEEN - ONE DOES NOT BREATHE', text: 'The census counts twelve, and the echo counts thirteen, one of them not breathing.' },
      { official: 'MAINTENANCE: ALL LIGHTS NOMINAL', echo: 'ECHO: LIGHTS OFF - SOMETHING PREFERS IT', text: 'The log says the lights work, and the echo says they were switched off by something that likes the dark.' },
    ],
    npc: {
      witness: 'It stood where you are standing, very still, and then it was not there.',
      ant: 'I stayed. Everyone else went to sleep, and the dark got used to me.',
      trust: 'Stay close, and do not look behind me.',
      doubt: 'You do not believe me, but it believes you.',
    },
    choices: [
      { prompt: 'They ask you to turn the lights off, so it cannot find you.', a: ['Turn them off', 'trust'], b: ['Keep the lights on', 'doubt'] },
      { prompt: 'They want to come with you through the next door.', a: ['Let them come', 'trust'], b: ['Go alone', 'doubt'] },
    ],
    finale: {
      prompt: 'It is in the room with you. What do you do with the thing that stayed?',
      options: [['face', 'Turn and look at it', 'doubt'], ['stay', 'Stay with it. Someone has to', 'trust'], ['seal', 'Seal the door and leave it in the dark', 'neutral']],
      outcomes: {
        face: 'You turn around. It has {ant}\'s face, and it is tired, and it has been waiting for someone to look. It closes its eyes. The lights in {place} come back on by themselves, one last time.',
        stay: 'You sit down in the dark next to it. {ant} stops standing at the end of corridors. In {place}, two people keep each other company, and nothing else learns your name.',
        seal: 'You seal the door. Behind it, something that used to be {ant} goes on standing very still. The dark keeps it. You keep the key.',
      },
      codaTrust: 'You kept the lights off for them, which down here is brave and kind at once.', codaDoubt: 'You kept your back to the wall the whole way, and something was counting on you not to.',
      tick: 'I AM GOING TO NEED A MOMENT.',
    },
  },
  MYSTERY: {
    label: 'MYSTERY', tag: 'Every record has an echo. Only one of them is true.', traits: MOOD_TRAITS.mystery,
    how: 'the culprit', antRoles: ['keeper', 'engineer', 'medic', 'rival'],
    grammar: { setup: ['arrival', 'encounter', 'contradiction'], mid: ['contradiction', 'log', 'choice'], twist: ['contradiction', 'choice', 'log'], finale: ['log', 'encounter', 'verdict'] },
    rules: rulesTable({ echoes: [['HIDDEN', 4], ['VISIBLE', 3], ['SOLID', 2]], watchers: [['NONE', 4], ['PATROL', 3], ['HUNT', 0.5]] }),
    nullChance: 0.2, weather: { open: 'motes', deck: 'motes' }, grade: { contrast: 1.1, saturation: 1.0, toning: 0.24 }, threat: 0.05,
    juno: ['Juno here. Every record in this place has been filed twice, Ren. Once for the truth, once for whoever reads it.', 'Read everything in ECHO. The second version is the one they did not want kept.'],
    junoAfter: 'Statements are cheap down here.',
    tick: ['SCANNING. TWO VERSIONS OF EVERYTHING. I PREFER THE SECOND.', 'THE PLAQUES HERE HAVE BEEN EDITED. I CAN SEE THE SEAMS.'],
    logs: {
      arrival: ['Record. Three people had a key to this place, and the log shows two. I am writing down the third, in case.'],
      mid: ['The statement I gave was true. The question I was asked was not.'],
    },
    records: [
      { official: 'OFFICIAL RECORD: KEY HELD BY THE KEEPER - ALL NIGHT', echo: 'ECHO: KEY HANDED OVER AT 02:50 - NO NAME GIVEN', text: 'The record says the keeper held the key all night, and the echo says it changed hands at ten to three.' },
      { official: 'INCIDENT: ACCIDENT - NO ONE PRESENT', echo: 'ECHO: TWO PRESENT - ONE LEFT RUNNING', text: 'The record calls it an accident with nobody present, and the echo saw two people, one of them running.' },
    ],
    npc: {
      witness: 'I gave my statement, and then I read it. Half the words were not mine.',
      ant: 'You have the echoes. Echoes are what we were afraid of, not what we did.',
      trust: 'I hoped you would say that.',
      doubt: 'You are right to check.',
    },
    choices: [
      { prompt: 'They ask you not to read their record in ECHO.', a: ['Promise not to', 'trust'], b: ['Read it anyway', 'doubt'] },
      { prompt: 'They tell you the keeper had the key all night.', a: ['Take their word', 'trust'], b: ['Check the echo', 'doubt'] },
    ],
    finale: {
      prompt: 'Whose record was the lie?',
      options: [['accuse', 'Name {ant}', 'doubt'], ['forgive', 'Name {ant}, then burn both records', 'trust'], ['seal', 'Name nobody. File the echo beside the record', 'neutral']],
      outcomes: {
        accuse: 'You name {ant}. The record and the echo play together, and only one of them keeps going. {place} files the true version, at last, under the right name.',
        forgive: 'You name {ant}, and then you take both records out of the wall. Nobody will read either again. {ant} says thank you, very quietly, which is a kind of confession too.',
        seal: 'You name nobody. You file the echo beside the record and leave both on the wall. Whoever comes next will read them in order. That will have to be enough.',
      },
      codaTrust: 'You took people at their word, and one of them was counting on that.', codaDoubt: 'You read everything twice, which is what records are for.',
      tick: 'SOLVED. MOSTLY BY ME.',
    },
  },
  ADVENTURE: {
    label: 'ADVENTURE', tag: 'Somewhere past the last gate there is a way out. Go and look.', traits: MOOD_TRAITS.hopeful,
    how: 'the rival', antRoles: ['rival', 'guide', 'engineer'],
    grammar: { setup: ['arrival', 'encounter', 'log'], mid: ['log', 'choice', 'encounter'], twist: ['log', 'contradiction', 'choice'], finale: ['log', 'encounter', 'verdict'] },
    rules: rulesTable({ gravity: [['NORMAL', 3], ['INVERTED', 3], ['ZERO', 3]], watchers: [['NONE', 5], ['PATROL', 2], ['HUNT', 0.5]], light: [['DAY', 5], ['NIGHT', 2], ['EMERGENCY', 0.5]] }),
    nullChance: 0.2, weather: { open: 'fireflies', deck: 'pollen' }, grade: { contrast: 1.08, saturation: 1.16, toning: 0.18 }, threat: 0.1,
    juno: ['Juno here. Look at this place, Ren. Nobody has been through it in years, and it has been waiting.', 'There is a way out past the last gate.'],
    junoAfter: 'Do not let them get there first.',
    tick: ['NEW PLACE. NEW LAWS. I LOVE IT HERE ALREADY.', 'THE WAY OUT IS NORTH. EVERYTHING INTERESTING IS NORTH.'],
    logs: {
      arrival: ['Record. The gate at the far end opens for whoever gets there first. I intend to be first.'],
      mid: ['The rival got here before me. They left a rope and took the map.'],
    },
    records: [
      { official: 'NOTICE: ROUTE CLOSED - NO WAY THROUGH', echo: 'ECHO: ROUTE OPEN - THE ROPE IS STILL THERE', text: 'The notice says the route is closed, and the echo says it is open, with the rope still tied off.' },
      { official: 'EXPEDITION: ONE RETURNED', echo: 'ECHO: TWO WENT UP - ONE CHOSE TO STAY', text: 'The record counts one who came back, and the echo saw two go up, one of them choosing to stay.' },
    ],
    npc: {
      witness: 'The way out is real. I have seen the light at the end of it, and I never went.',
      ant: 'First to the gate wins. That is not a threat, it is the rules of the place.',
      trust: 'Then we go together.',
      doubt: 'I will wave from the top.',
    },
    choices: [
      { prompt: 'They offer to show you a shortcut, if you share the way out.', a: ['Share it', 'trust'], b: ['Find your own way', 'doubt'] },
      { prompt: 'They have the map. They will trade it for your device.', a: ['Trade', 'trust'], b: ['Keep the device', 'doubt'] },
    ],
    finale: {
      prompt: 'The last gate opens for one. Who goes through?',
      options: [['go', 'Go through first', 'doubt'], ['share', 'Open it for both of you', 'trust'], ['stay', 'Stay. Let {ant} go', 'neutral']],
      outcomes: {
        go: 'You go through first. On the other side of {place} the air is cold and new and nobody has breathed it. Behind you, {ant} is laughing, which you did not expect.',
        share: 'You hold the gate. {ant} walks through beside you, surprised, then not. Two people leave {place} at once. The rules of the place turn out to have been a suggestion.',
        stay: 'You step back. {ant} goes through without looking round, which is fair. You sit down in {place} and listen to the radio. Juno is still there. That was always the way out.',
      },
      codaTrust: 'You shared the way, and that is the only kind of way out that stays open.', codaDoubt: 'You got there first, so now turn around and help someone.',
      tick: 'WE WON. I CARRIED THE TEAM.',
    },
  },
  HEIST: {
    label: 'HEIST', tag: 'One key, four rooms, and a crew that lies for a living.', traits: ['dry', 'formal', 'warm'],
    how: 'the one who lied', antRoles: ['engineer', 'rival', 'keeper'],
    grammar: { setup: ['arrival', 'encounter', 'log'], mid: ['choice', 'log', 'contradiction'], twist: ['contradiction', 'choice', 'log'], finale: ['log', 'encounter', 'verdict'] },
    rules: rulesTable({ time: [['NORMAL', 2], ['SWEEPERS', 5]], watchers: [['NONE', 1], ['PATROL', 5], ['HUNT', 2]], light: [['DAY', 2], ['NIGHT', 5], ['EMERGENCY', 1]], echoes: [['HIDDEN', 5], ['VISIBLE', 1], ['SOLID', 1]] }),
    nullChance: 0.25, weather: { open: 'rain', deck: 'motes' }, grade: { contrast: 1.16, saturation: 1.02, toning: 0.26 }, threat: 0.15,
    juno: ['Juno here. The vault is at the far end and the whole place is on a timer, Ren.', 'Everyone on this job has a reason to be here. Only one of them told you the real one.'],
    junoAfter: 'Nobody follows the plan.',
    tick: ['SCANNING. SWEEPERS, LOCKS, ONE VAULT. I HAVE SEEN THIS FILM.', 'THE BEAMS RUN ON A RHYTHM. I HAVE GOT RHYTHM.'],
    logs: {
      arrival: ['The plan. In at the gate, through the sweepers, the key from the memory room, the vault at the end. Nobody improvises.'],
      mid: ['The key was in the memory room, like the plan said. So was someone else.'],
    },
    records: [
      { official: 'VAULT LOG: NO ACCESS SINCE INSTALLATION', echo: 'ECHO: VAULT OPENED ONCE - FROM INSIDE', text: 'The vault log says nobody has been in, and the echo says it was opened once, from the inside.' },
      { official: 'CREW MANIFEST: FOUR - ALL VERIFIED', echo: 'ECHO: FOUR - ONE BADGE BORROWED', text: 'The manifest verifies four, and the echo says one badge was borrowed and not returned.' },
    ],
    npc: {
      witness: 'Everyone runs the timing. That is how you know somebody is lying about the timing.',
      ant: 'You want the vault. I want what is in it. Those were never the same thing.',
      trust: 'We split it at the end, like we said.',
      doubt: 'Trust nobody on a job, especially the one who says that.',
    },
    choices: [
      { prompt: 'They ask you to carry the key through the sweepers for them.', a: ['Carry it', 'trust'], b: ['Make them carry it', 'doubt'] },
      { prompt: 'They want to change the plan: skip the memory room.', a: ['Go with the new plan', 'trust'], b: ['Stick to the plan', 'doubt'] },
    ],
    finale: {
      prompt: 'The vault is open. What is in it, and who leaves with it?',
      options: [['take', 'Take it and walk', 'doubt'], ['split', 'Split it with the crew, liar included', 'trust'], ['leave', 'Leave it where it is and close the door', 'neutral']],
      outcomes: {
        take: 'You take it and walk. Behind you the sweepers in {place} stop on the beat, as if the building is applauding. {ant} is already gone, which tells you what was really in the vault.',
        split: 'You split it four ways, and {ant} takes a share with the face of someone who expected to take all of it. The crew leaves {place} together, which is rarer than money.',
        leave: 'You close the vault on whatever it held. {ant} stares at you for a long time and then starts to laugh. The timer in {place} runs out on an empty room.',
      },
      codaTrust: 'You trusted the crew, which on a job is genius or the end of you.', codaDoubt: 'You watched everybody, and everybody watched you back.',
      tick: 'CLEAN. IN AND OUT.',
    },
  },
  SURVIVAL: {
    label: 'SURVIVAL', tag: 'The air is running out. So is the light. Keep moving.', traits: ['nervous', 'warm', 'dry'],
    how: 'the one who stayed', antRoles: ['keeper', 'medic', 'engineer'],
    grammar: { setup: ['arrival', 'log', 'encounter'], mid: ['log', 'choice', 'contradiction'], twist: ['log', 'choice', 'contradiction'], finale: ['log', 'encounter', 'verdict'] },
    rules: rulesTable({ light: [['DAY', 1], ['NIGHT', 3], ['EMERGENCY', 5]], watchers: [['NONE', 3], ['PATROL', 3], ['HUNT', 2]], gravity: [['NORMAL', 4], ['INVERTED', 2], ['ZERO', 3]], time: [['NORMAL', 3], ['SWEEPERS', 3]] }),
    nullChance: 0.4, weather: { open: 'storm', deck: 'steam' }, grade: { contrast: 1.14, saturation: 0.9, toning: 0.28 }, threat: 0.2,
    juno: ['Juno here. The air plant in this place is failing, Ren. You have the time it takes to walk through.', 'Everyone who stopped down here is still down here.'],
    junoAfter: 'People get strange when they ration.',
    tick: ['SCANNING. AIR AT SIXTY PERCENT AND FALLING.', 'EMERGENCY LIGHT. IT MAKES EVERYTHING LOOK URGENT.'],
    logs: {
      arrival: ['Record. Air plant down to one pump. We are moving everyone forward, room by room, and sealing the rooms behind us.'],
      mid: ['We left two people in the last room. The door would not open again.'],
    },
    records: [
      { official: 'AIR PLANT: ONE PUMP - STABLE', echo: 'ECHO: ONE PUMP - DIVERTED TO ONE ROOM', text: 'The gauge says the last pump is stable, and the echo says its air was diverted to a single room.' },
      { official: 'EVACUATION: ALL MOVED FORWARD', echo: 'ECHO: TWO LEFT BEHIND - DOOR SEALED FROM OUTSIDE', text: 'The record says everyone was moved forward, and the echo says two were left behind a door sealed from outside.' },
    ],
    npc: {
      witness: 'I was in the last room. Somebody opened the door for me, and I never found out who.',
      ant: 'I stayed with the pump. Somebody had to decide where the air went.',
      trust: 'Breathe slowly, there is enough for two.',
      doubt: 'Save your breath, the next room is a long walk.',
    },
    choices: [
      { prompt: 'They ask you to share your air. There is not enough for both of you to reach the next room.', a: ['Share it', 'trust'], b: ['Keep it, and go', 'doubt'] },
      { prompt: 'They say the sealed room still has people in it. Opening it will cost air.', a: ['Open the door', 'trust'], b: ['Leave it sealed', 'doubt'] },
    ],
    finale: {
      prompt: 'The last pump is in this room. Where does the air go?',
      options: [['everyone', 'Open every door. Share what is left', 'trust'], ['you', 'Seal the room. Keep the air', 'doubt'], ['pump', 'Fix the pump, whatever it costs you', 'neutral']],
      outcomes: {
        everyone: 'You open every door in {place}. The air thins and spreads and, for the first time in weeks, it is everybody\'s. {ant} stands by the pump and does not stop you. Nobody runs.',
        you: 'You seal the room. The pump feeds one room now, and it is yours. {ant} is on the other side of the door, and does not knock. In {place}, that is how it was always going to end for someone.',
        pump: 'You open the pump and put your hands inside it. It costs you more than you had. Then it turns over, and keeps turning, and {place} breathes. {ant} sits down on the floor and cries.',
      },
      codaTrust: 'You shared the air, and everyone down here will remember who did that.', codaDoubt: 'You kept moving, and that was the only rule that mattered.',
      tick: 'AIR AT ONE HUNDRED PERCENT.',
    },
  },
};
export const GENRE_KEYS = Object.keys(GENRES);

// TICK on arrival, about the rule that matters most in this location (one line per rule value)
const RULE_TICK = {
  nullField: 'NO LAWS HERE AND NO GEAR. JUST LEGS.',
  'gravity:INVERTED': 'THE FLOOR IS UP. SHIFT TO INVERTED TO PUT IT BACK.',
  'gravity:ZERO': 'NOTHING WEIGHS ANYTHING HERE.',
  'echoes:SOLID': 'EVERY MEMORY HERE IS SOLID. STAND ON THE PAST.',
  'echoes:VISIBLE': 'THE ECHOES SHOW IN EVERY STATE.',
  'time:SWEEPERS': 'BEAMS, ON A RHYTHM. JUMP THEM OR FREEZE TIME.',
  'watchers:HUNT': 'THE WATCHERS HERE HUNT. BE A WALL.',
  'watchers:PATROL': 'WATCHERS ON THEIR ROUNDS. THEY ONLY LOOK ALONG THE FLOOR.',
  'light:NIGHT': 'IT IS DARK. A FLARE WOULD HELP.',
  'light:EMERGENCY': 'EMERGENCY LIGHT. RED MEANS HURRY.',
};
const GEAR_TICK = {
  'STASIS:use': 'STASIS. IT IS STILL.',
  'STASIS:none': 'NOTHING NEAR ENOUGH TO FREEZE.',
  'GRAPPLE:use': 'LINE OUT. WALK.',
  'LENS:use': 'LENS ON.',
  'RIG:use': 'HARD LIGHT STAIRS. CLIMB.',
  'FLARE:use': 'FLARE UP. THEY ARE WATCHING THAT NOW.',
  'KEYFORGE:use': 'THE KEY IS REAL NOW.',
  'KEYFORGE:none': 'KEY FORGE NEEDS A MEMORY KEY IN YOUR HAND.',
  'KEYFORGE:spent': 'ONE KEY PER LOCATION.',
  refused: 'THE LOCAL RULES SAY NO.',
};
const AHEAD = { who: 'JUNO', text: 'Someone is ahead. Ren - be gentle. Everyone down here has a reason.' };
const CHOICE_TICK = 'A CHOICE. I WILL NOT HELP, BUT I WILL REMEMBER.';
const CLOSERS = ['Find the truth, Ren. Then decide if it\'s yours to tell.', 'Whoever did it - they loved someone. That\'s the only reason anyone breaks a ship.'];

// --- the Forge ------------------------------------------------------------------------------------

function normalise(choices = {}) {
  const c = {};
  c.title = String(choices.title || '').replace(/[<>&"]/g, '').trim().slice(0, 40) || null; // shown as HTML in the save list: no markup
  c.hero = cleanName(choices.hero) || null;
  c.genre = GENRES[choices.genre] ? choices.genre : null;
  c.length = LENGTHS[choices.length] ? choices.length : null;
  c.acts = (choices.acts || []).map((a) => ({
    theme: THEMES[a?.theme] ? a.theme : null,
    name: String(a?.name || '').replace(/[<>&"]/g, '').trim().slice(0, 28).toUpperCase() || null,
    rules: Object.fromEntries(RULE_KEYS.map((k) => [k, RULE_OPTIONS[k][a?.rules?.[k]] ? a.rules[k] : null])),
    nullField: a?.rules?.nullField === true || a?.rules?.nullField === 'true' ? true : a?.rules?.nullField === false || a?.rules?.nullField === 'false' ? false : null,
  }));
  c.cast = (choices.cast || []).map((m) => ({ name: cleanName(m?.name) || null, role: ROLES[m?.role] ? m.role : null })).filter((m) => m.name || m.role).slice(0, 8);
  c.gear = [...new Set((choices.gear || []).filter((g) => GEAR[g]))].slice(0, 4);
  return c;
}

// Plans one puzzle room of a deck act within its rules (mirrors LevelGen.planPuzzle).
function planPuzzle(rng, rules, difficulty) {
  const nul = rules.nullField, zero = rules.gravity === 'ZERO', inv = rules.gravity === 'INVERTED';
  const watch = rules.watchers !== 'NONE';
  const sweep = rules.time === 'SWEEPERS' ? 3 : 1.2;
  const used = new Set();
  const mids = [];
  let zerogUsed = false;
  const effOf = (seg) => (seg[0] === 'sweepers' ? 'timeStop' : seg[0] === 'sentinel' ? 'observerFrozen' : MECHANICS[seg[1]].effect);
  const midOpts = nul ? [[['sweepers'], sweep], ...(watch ? [[['sentinel'], 2]] : [])]
    : zero ? [[['pit', 'zerog'], 2], [['sweepers'], sweep], ...(watch ? [[['sentinel'], 2]] : [])]
      : [[['pit', 'gravity'], 1.2], [['pit', 'echo'], rules.echoes === 'SOLID' ? 2 : 1.5], [['pit', 'light'], 1.3], [['pit', 'zerog'], 1], [['sweepers'], sweep], ...(watch ? [[['sentinel'], rules.watchers === 'HUNT' ? 2.5 : 1.5]] : [])];
  const midCount = difficulty < 1.2 ? rng.int(0, 1) : difficulty < 4 ? rng.weighted([[0, 1], [1, 3], [2, 1]]) : rng.int(1, 2);
  for (let i = 0; i < midCount; i++) {
    const seg = rng.weighted(midOpts);
    if (seg[1] === 'zerog' && zerogUsed) continue;
    const next = new Set(used);
    next.add(effOf(seg));
    if (next.size > 3) continue;
    if (seg[1] === 'zerog') zerogUsed = true;
    mids.push(seg);
    used.add(effOf(seg));
  }
  const exitOpts = nul ? [[['open', null], 1]]
    // (no zero-g core: its socket sits on the floor, and in a ZERO act no state brings you down to it)
    : zero ? [[['open', null], 1], [['ledge', 'zerog'], zerogUsed ? 0 : 2], [['key', 'echo'], 1.2]]
      : [[['open', null], 0.8], [['ceiling', 'gravity'], 1.2], [['ledge', 'zerog'], zerogUsed ? 0 : 1], [['ledge', 'echo'], 1], [['ledge', 'light'], 1], ...(inv ? [] : [[['key', 'echo'], 1]]),
        [['core', 'gravity'], 0.7], [['core', 'zerog'], zerogUsed ? 0 : 0.5], [['core', 'echo'], 0.6], [['core', 'light'], 0.6]];
  const exits = exitOpts.filter(([, w]) => w > 0);
  let exit = null;
  for (let tries = 0; tries < 20 && !exit; tries++) {
    const [kind, m] = rng.weighted(exits);
    const eff = kind === 'key' ? 'heldPersists' : m ? MECHANICS[m].effect : null;
    const next = new Set(used);
    if (eff) next.add(eff);
    if (next.size <= 3) {
      exit = { kind, method: m };
      if (eff) used.add(eff);
    }
  }
  if (!exit) exit = { kind: 'open', method: null };
  if (!mids.length && exit.kind === 'open') {
    const seg = nul ? ['sweepers'] : zero ? ['pit', 'zerog'] : rng.pick([['pit', 'gravity'], ['pit', 'echo'], ['sweepers']]);
    mids.push(seg);
    used.add(effOf(seg));
  }
  return { mids, exit, effects: [...used] };
}

// The Forge: a seed and the player's choices become a whole game.
export function forgeGame(seed, choices = {}) {
  const c = normalise(choices);
  const r = Rng.from('forge', seed);
  const genreKey = c.genre || r.pick(GENRE_KEYS);
  const genre = GENRES[genreKey];
  const lengthKey = c.length || r.pick(Object.keys(LENGTHS));
  const nActs = LENGTHS[lengthKey].acts;
  const hero = c.hero || 'Ren';
  const title = c.title || r.pick(['THE NIGHT SHIFT', 'LAST LIGHT', 'THE LONG WAY ROUND', 'WHOSE HANDS', 'EVERYTHING HERE LISTENS', 'THE QUIET ROOMS']);

  // --- cast
  const typed = c.cast;
  const size = Math.max(typed.length, Math.min(8, 3 + Math.floor(nActs / 3)));
  const firsts = r.shuffle(FIRST), lasts = r.shuffle(LAST);
  const roleOrder = r.shuffle(ROLE_KEYS.filter((k) => k !== 'guide'));
  const cast = [];
  // a generated name that matches a typed one gives way to the next unused name further down the deal
  const typedNames = new Set(typed.filter((t) => t?.name).map((t) => t.name.toLowerCase()));
  let spare = 8;
  for (let i = 0; i < Math.min(8, size); i++) {
    const t = typed[i] || {};
    let gen = firsts[i];
    if (!t.name && typedNames.has(gen.toLowerCase())) {
      while (typedNames.has(firsts[spare].toLowerCase())) spare++;
      gen = firsts[spare++];
    }
    const first = t.name || gen;
    const role = t.role || (i === 0 ? 'guide' : roleOrder[(i - 1) % roleOrder.length]);
    cast.push({
      id: `f${i}`, first, name: `${first} ${lasts[i]}`, typed: !!t.name, role: ROLES[role].label, roleKey: role,
      pronoun: r.pick(PRONOUNS), trait: r.pick(genre.traits), secret: ROLES[role].secret, color: CAST_COLORS[i], alive: r.chance(0.7), seed: r.int(1, 1e9),
    });
  }
  // the antagonist: never the first person you meet; the genre says which roles it prefers
  const pool = cast.slice(1);
  const preferred = pool.filter((m) => genre.antRoles.includes(m.roleKey));
  const antagonist = cast.indexOf((preferred.length ? r.pick(preferred) : r.pick(pool)));
  cast[antagonist].antagonist = true;
  cast[antagonist].alive = true; // the one who stayed is always here to meet
  const ant = cast[antagonist];

  // --- acts: a setup, complications, a twist and a finale
  const shape = nActs === 3 ? ['setup', 'twist', 'finale'] : ['setup', ...Array(nActs - 3).fill('mid'), 'twist', 'finale'];
  const perAct = lengthKey === 'SHORT' ? 2 : 3;
  const usedThemes = new Set();
  let nullUsed = 0;
  const acts = shape.map((part, i) => {
    const ch = c.acts[i] || { rules: {} };
    let theme = ch.theme;
    if (!theme) {
      const opts = THEME_KEYS.filter((k) => !usedThemes.has(k) && (part !== 'finale' || k !== 'cradle'));
      theme = r.pick(opts.length ? opts : THEME_KEYS);
    }
    usedThemes.add(theme);
    const T = THEMES[theme];
    const rules = {};
    for (const k of RULE_KEYS) rules[k] = ch.rules?.[k] || r.weighted(genre.rules[k]);
    rules.nullField = ch.nullField ?? (part !== 'setup' && part !== 'finale' && nullUsed < 1 && r.chance(genre.nullChance));
    if (rules.nullField) nullUsed++;
    const gearAllowed = Object.fromEntries(GEAR_KEYS.map((g) => [g, gearRule(g, rules)]));
    const name = ch.name || T.name || T.deck.name;
    const blurb = r.pick(T.blurbs);
    // scenes: the genre's grammar for this part, as many as the act has sectors
    const gram = genre.grammar[part];
    const kinds = part === 'finale' ? gram.slice(-perAct) : gram.slice(0, perAct);
    // who you meet: the guide first, then the rest of the cast in turn, the antagonist at the twist and the end
    const others = cast.map((m, k) => k).filter((k) => k !== 0 && k !== antagonist);
    const npc = part === 'twist' || part === 'finale' ? antagonist : i === 0 ? 0 : others.length ? others[(i - 1) % others.length] : 0;
    const plans = T.kind === 'deck' ? Array.from({ length: perAct }, (_, s) => Array.from({ length: 1 + (s >= 1 ? 1 : 0) }, (_, p) => planPuzzle(r, rules, 0.6 + i * 0.5 + s * 0.3 + p * 0.25))) : null;
    const fragments = theme === 'cradle' ? CRADLE_FRAGMENTS : T.kind === 'open' ? FRAGMENTS[THEME_KEYS.indexOf(theme)] : [];
    const hints = T.kind === 'open' ? (T.zone.hints || null) : null; // open acts: TICK's roof/canal/drone hints; decks use LevelGen's per challenge
    return { index: i, part, theme, kind: T.kind, name, blurb, rules, gearAllowed, sectors: perAct, kinds, beats: kinds, npc, npcs: [npc], fragments, hints, plans, choice: part === 'mid' ? i % 2 : 1 };
  });

  // --- the kit
  const gear = c.gear.slice();
  const gearPool = r.shuffle(GEAR_KEYS.filter((g) => !gear.includes(g)));
  while (gear.length < 4) gear.push(gearPool.pop());

  const truth = { antagonist, how: genre.how, question: `${genre.tag} Who is ${genre.how}?` };
  return { seed, title, hero, genre: genreKey, length: lengthKey, acts, cast, truth, gear, choices: c, endings: genre.finale.options.map(([key, label, tag]) => ({ key, label: ff(label, { ant: ant.first }), tag })) };
}

// --- the story the runtime plays ------------------------------------------------------------------

const said = (c, texts) => texts.map((text) => ({ who: 'CREW', name: c.name.toUpperCase(), color: c.color, text }));

export function makeForgeStory(game) {
  const genre = GENRES[game.genre];
  const ant = game.cast[game.truth.antagonist];
  const r = Rng.from('forge-story', game.seed);
  const decks = game.acts.map((act) => {
    const T = THEMES[act.theme];
    const npc = game.cast[act.npc];
    const v = { hero: game.hero, name: npc.name, first: npc.first, their: npc.pronoun.their, them: npc.pronoun.them, role: npc.role.toLowerCase(), place: act.name, ant: ant.first };
    const intro = act.index === 0
      ? [{ who: 'JUNO', text: genre.juno[0] }, { who: 'JUNO', text: genre.juno[1] }, { who: 'TICK', text: genre.tick[0] }]
      : [{ who: 'JUNO', text: genre.juno[1] }, { who: 'TICK', text: genre.tick[act.index % 2] }];
    const ruleTick = act.rules.nullField ? RULE_TICK.nullField
      : ['gravity', 'watchers', 'echoes', 'time', 'light'].map((k) => RULE_TICK[`${k}:${act.rules[k]}`]).find(Boolean) || null;
    const beats = act.kinds.map((kind, s) => {
      const log = (title, text) => ({ title, who: 'NONE', text });
      if (kind === 'arrival') return { kind, goal: 'Find the record left here.', log: log(`${act.name} - RECORD`, r.pick(genre.logs.arrival)), plaque: T.kind === 'open' ? T.zone.motto : T.deck.motto, tick: act.index === 0 ? genre.tick[1] : genre.tick[0], junoAfter: genre.junoAfter, gate: 'THE WAY ON' };
      if (kind === 'log') return { kind, goal: 'Find the second record.', log: log(`${act.name} - RECORD ${s + 1}`, r.pick(genre.logs.mid)), junoAfter: genre.junoAfter, gate: 'THE WAY ON' };
      if (kind === 'contradiction') {
        const rec = genre.records[(act.index + s) % genre.records.length];
        const guilty = act.part === 'twist';
        const who = guilty ? ant : npc;
        return { kind, goal: 'Read the record. Then read it in ECHO.', official: rec.official, echo: rec.echo, log: rec.text, clue: guilty ? 'guilty' : 'cleared', crew: game.cast.indexOf(who), toast: guilty ? 'THE RECORD LIED' : 'RECORD CORRECTED', tick: 'THE PLAQUE READS DIFFERENTLY IN ECHO. RECORDS LIE. MEMORIES ARE WORSE AT IT.', junoAfter: genre.junoAfter, gate: 'THE WAY ON', twistRead: guilty };
      }
      // encounter, with or without a choice
      const who = act.part === 'twist' || act.part === 'finale' ? ant : npc;
      const w = { ...v, first: who.first, name: who.name, their: who.pronoun.their, them: who.pronoun.them };
      const greet = TRAITS[who.trait].greet[(act.index + s) % 2];
      const lines = [greet, ROLES[who.roleKey].line];
      if (who.antagonist && (act.part === 'twist' || act.part === 'finale')) lines.push(genre.npc.ant);
      else lines.push(genre.npc.witness);
      // what you chose earlier changes what they say now
      if (act.index > 0) lines.push({ text: genre.npc.trust, when: 'forge_trust > forge_doubt' }, { text: genre.npc.doubt, when: 'forge_doubt >= forge_trust && (forge_trust > 0 || forge_doubt > 0)' });
      lines.push(CLOSERS[act.index % 2]);
      const beat = {
        kind: 'encounter', goal: `Find ${who.first}.`, crew: game.cast.indexOf(who), path: !who.alive ? false : (act.index + s) % 2 === 1, gate: 'THE WAY ON',
        lines: lines.map((l) => (typeof l === 'string' ? said(who, [ff(l, w)])[0] : { ...said(who, [ff(l.text, w)])[0], when: l.when })),
        junoAfter: who.alive ? 'Alive. Down here. I did not think anyone was.' : 'An echo. Not them. I keep forgetting the difference.',
      };
      if (kind === 'choice') {
        const ch = genre.choices[act.choice % genre.choices.length];
        beat.choice = {
          prompt: ff(ch.prompt, w), fact: `forge_choice_${act.index}`,
          options: [{ key: 'a', label: ff(ch.a[0], w), tag: ch.a[1] }, { key: 'b', label: ff(ch.b[0], w), tag: ch.b[1] }],
          reply: { trust: said(who, [genre.npc.trust])[0], doubt: said(who, [genre.npc.doubt])[0] },
          tick: CHOICE_TICK,
        };
        beat.goal = `Find ${who.first}, and choose.`;
      }
      return beat;
    });
    if (act.part === 'finale') {
      beats[beats.length - 1] = { kind: 'verdict', goal: 'Reach the chair. Decide how this ends.', prompt: 'SIT IN THE CHAIR', question: ff(genre.finale.prompt, v), options: game.endings, tick: genre.finale.tick, gate: 'THE WAY OUT' };
    }
    // the location record the runtime builds from
    const light = act.rules.light;
    const base = T.kind === 'open' ? T.zone.palette : T.deck.palette;
    const palette = {
      ...base,
      weather: genre.weather[T.kind] || base.weather,
      grade: { ...base.grade, ...genre.grade },
      night: light === 'DAY' ? (T.kind === 'open' ? 0.2 : 0.08) : light === 'NIGHT' ? (T.kind === 'open' ? 1 : 0.85) : 0.6,
      emergency: light === 'EMERGENCY' ? 0.7 : 0,
    };
    const common = { index: act.index, part: act.part, forge: true, open: T.kind === 'open', name: act.name, title: act.blurb, subtitle: act.blurb, crew: act.npc, intro, beats, sectors: act.sectors, rules: act.rules, gearAllowed: act.gearAllowed, ruleTick, palette };
    if (T.kind === 'open') {
      const Z = T.zone;
      const plan = { ...common, key: `forge${act.index}`, theme: Z.theme, feature: Z.feature, rooms: Z.rooms, motto: Z.motto, canalSign: Z.canalSign, hints: Z.hints, idPrefix: 'f' };
      return plan;
    }
    const D = T.deck;
    return { ...common, key: D.key, deckName: D.name, feature: D.feature, rooms: D.rooms, motto: D.motto, role: D.role, planPuzzle: (s, p) => act.plans[s][p] };
  });
  const fragments = game.acts.map((act) => (act.theme === 'cradle' ? CRADLE_FRAGMENTS : act.kind === 'open' ? FRAGMENTS[THEME_KEYS.indexOf(act.theme)] : []));
  return {
    forge: true, game, seed: `forge-${game.seed}`, title: game.title, hero: game.hero, genre: game.genre, label: game.title,
    question: game.truth.question, cast: game.cast, captain: ant, truth: { culprit: game.truth.antagonist },
    decks, fragments, after: { key: 'NONE', title: null, sentinels: 'hunt' }, ahead: AHEAD,
  };
}

// Post-processing of a generated level under the act's rules (both generators build the same
// record; the rules only tune what they placed).
export function tuneLevel(level, act) {
  const rules = act.rules;
  if (rules.watchers === 'NONE') level.sentinels = [];
  if (rules.watchers === 'HUNT') for (const s of level.sentinels) { s.range *= 1.3; s.speed *= 1.25; s.fov = Math.min(1.3, s.fov * 1.2); }
  if (rules.nullField) level.effects = [];
  level.rules = rules;
  level.act = act.index;
  level.forge = true;
  return level;
}

// The ending for a final decision, coloured by the facts the player's choices set.
export function forgeEnding(game, key, facts) {
  const genre = GENRES[game.genre];
  const ant = game.cast[game.truth.antagonist];
  const fin = game.acts[game.acts.length - 1];
  const trust = (facts?.get?.('forge_trust') || 0), doubt = (facts?.get?.('forge_doubt') || 0);
  const opt = game.endings.find((e) => e.key === key) || game.endings[0];
  const v = { ant: ant.first, place: fin.name, hero: game.hero };
  const coda = trust > doubt ? genre.finale.codaTrust : genre.finale.codaDoubt;
  return { key: opt.key, title: opt.label.toUpperCase(), tag: opt.tag, text: [ff(genre.finale.outcomes[opt.key], v)], coda: [{ who: 'JUNO', text: coda }, { who: 'TICK', text: genre.finale.tick }], trust, doubt };
}

// Hints and words for the HUD (rules card, gear toasts)
export function describeRules(act, kit = GEAR_KEYS) {
  const rules = act.rules;
  const rows = RULE_KEYS.map((k) => ({ key: k.toUpperCase(), value: rules[k], text: RULE_OPTIONS[k][rules[k]] }));
  if (rules.nullField) rows.unshift({ key: 'NULL FIELD', value: 'ON', text: NULL_FIELD_TEXT });
  const gear = kit.map((g) => ({ key: g, name: GEAR[g].name, ...(act.gearAllowed[g] || gearRule(g, rules)) }));
  return { rows, gear };
}
export const gearTick = (key, what) => GEAR_TICK[`${key}:${what}`] || GEAR_TICK[what] || null;

// Solvability: every puzzle room of a generated level can be finished under the act's rules with
// the device's laws (all tokens known), the rules' free effects and the kit. Returns [] or reasons.
export function checkSolvable(level, act, kit = []) {
  const rules = act.rules;
  const out = [];
  const free = ruleEffects(rules);
  const gearEffects = new Set();
  for (const g of kit) if (act.gearAllowed[g]?.ok) {
    if (g === 'GRAPPLE') gearEffects.add('pit');
    if (g === 'RIG') gearEffects.add('ledge');
    if (g === 'KEYFORGE') gearEffects.add('heldPersists');
  }
  for (const rid of level.order) {
    const room = level.rooms[rid];
    const req = room.challenges.filter((c) => !c.optional && c.key !== 'gate' && c.key !== 'exit:open');
    const effects = new Set();
    for (const c of req) {
      if (c.effect) {
        if (!free.has(c.effect)) effects.add(c.effect);
        continue;
      }
      // open-district obstacles: any of several laws works (the dome, the memory stairs, zero-g)
      if (c.key === 'roof' || c.key === 'canal') { if (!['gravityFlip', 'echoSolid', 'zeroG'].some((e) => free.has(e))) effects.add(c.key); continue; }
    }
    if (rules.nullField && effects.size) out.push(`${rid}: null field but needs ${[...effects]}`);
    if (effects.size > 3) out.push(`${rid}: needs ${effects.size} laws`);
    if (rules.gravity === 'ZERO') for (const c of req) if (['exit:ceiling', 'ledge:echo', 'ledge:light', 'exit:core:gravity', 'exit:core:zerog', 'exit:core:echo', 'exit:core:light'].includes(c.key)) out.push(`${rid}: ${c.key} unreachable in zero gravity`);
    if (level.zone && rules.gravity === 'ZERO' && !rules.nullField && (room.floatY ?? 1.25) > 4.5 - 0.85) out.push(`${rid}: floats at ${room.floatY} m, over the 4.5 m gate`);
    if (rules.gravity === 'INVERTED') for (const c of req) if (c.key === 'exit:key') out.push(`${rid}: a key lock cannot be reached upside down`);
    if (rules.watchers === 'NONE' && level.sentinels.some((s) => s.room === rid)) out.push(`${rid}: watchers where the rules say none`);
  }
  return out;
}

// Every fixed line the Forge can say, for the voice pack (tools/voice-pack.mjs).
export function FORGE_LINES() {
  const out = [];
  const add = (voice, text) => text && out.push([voice, text]);
  for (const g of Object.values(GENRES)) {
    g.juno.forEach((t) => add('JUNO', t));
    add('JUNO', g.junoAfter);
    g.tick.forEach((t) => add('TICK', t));
    [...g.logs.arrival, ...g.logs.mid].forEach((t) => add('NONE', t));
    for (const rec of g.records) { add('NONE', rec.official); add('NONE', rec.echo); add('YOU', rec.text); } // the hero reads the contradiction aloud
    for (const t of Object.values(g.npc)) add('CREW', t);
    add('JUNO', g.finale.codaTrust);
    add('JUNO', g.finale.codaDoubt);
    add('TICK', g.finale.tick);
  }
  for (const role of Object.values(ROLES)) add('CREW', role.line);
  for (const t of Object.values(RULE_TICK)) add('TICK', t);
  for (const t of Object.values(GEAR_TICK)) add('TICK', t);
  add('JUNO', AHEAD.text);
  add('TICK', CHOICE_TICK);
  add('JUNO', 'Alive. Down here. I did not think anyone was.');
  add('JUNO', 'An echo. Not them. I keep forgetting the difference.');
  add('TICK', 'THE PLAQUE READS DIFFERENTLY IN ECHO. RECORDS LIE. MEMORIES ARE WORSE AT IT.');
  return out;
}
