// THE LAST VERSION OF EARTH: the campaign spine after the Prologue.
//
// Acts I and II live in act1.js and act2.js (U7): each mission one map with soft quarters, threads and side stories,
// a cold open and a hook (Threads.js), re-exported from here. Acts III-IV and the Finale (below) stand in open places
// of their own (places/specs/*.js, one map per mission whose sector i activates quarter i), and carry the bible's
// mission setup as authored beats:
// arrival / log / contradiction / encounter / choice / scene, each with its quoted
// dialogue, its goal and its mission ending. The four quest chains are optional
// cases. The bible's combat is readable stealth and evasion here: the game has no
// combat, so soldiers, scavengers and security systems are watchers to slip past
// (docs/lastversion/DESIGN.md says so too).
import { CAST, WATER_HOOK, MARA_HOOK, intent } from './npcs.js';
import { ACT1 } from './act1.js';
import { ACT2 } from './act2.js';

export { ACT1 } from './act1.js';
export { ACT2, LOCK_ORDER } from './act2.js';

const L = (who, text, when) => (when ? { who, text, when } : { who, text });
const N = (text) => L('NONE', text);
const K = (text) => L('KAI', text);
// a line that turns the story over carries the reveal cue (score.js)
const REV = (l) => ({ ...l, voice: { ...(l.voice || {}), cue: 'reveal' } });
const C = (id) => CAST.findIndex((c) => c.id === id);
// (a person without a speaker of their own (CREW) carries their recorded voice, OVERHAUL.md §8.4)
const says = (id, texts) => texts.map((text) => ({ who: CAST[C(id)].voice, name: CAST[C(id)].name.toUpperCase(), color: CAST[C(id)].color, text, ...(CAST[C(id)].voice === 'CREW' ? { voice: { id: CAST[C(id)].vid } } : {}) }));

// a mission in one of the open places (places/specs/<key>.js): sector i activates quarter i
const place = (o) => ({ kind: 'place', sectors: o.beats.length, ...o });
const E = (id, lines, extra = {}) => ({ kind: 'encounter', crew: C(id), lines: says(id, lines), ...extra });
const encounterQ = (id, lines, choices, extra = {}) => E(id, lines, { choices, ...extra });

// =============================================================================================
// ACT III: THE LAST VERSION OF EARTH
export const ACT3 = [
  place({
    key: 'm14', n: 14, chapter: 'act3', name: 'WELCOME TO 2196', title: 'The 2196 city', subtitle: 'A beautiful, devastated world. Reach the settlement before the Chronolith loses stability.',
    place: 'drowned', states: ['FUTURE', 'PRESENT', 'PAST'], drones: [0, 1, 2], unstable: true, ambience: 'wind', ambient: 'future',
    motto: 'WE TEACH CHILDREN YOUR NAME', gate: 'THE SETTLEMENT',
    crew: C('sera'),
    intro: [N('Skyscrapers wear forests. The transit line runs through a lake. The light is the kindest light you have ever seen, and the Chronolith is losing its grip on you.')],
    fragments: [[
      'A beacon component, scavenged from a car that has not moved in 147 years.',
      'A warden\'s log: UNSTABLE ZONE ON 4TH. DO NOT CROSS BEFORE NOON. IT IS ALWAYS BEFORE NOON.',
      'A gardener\'s planting record on the roof of a bank.',
      'A survivor\'s trail: three stones stacked, then four, then none.',
      'A school book: THE FRACTURE AND THE MAN WHO MADE IT, Chapter One, with your photograph.',
      'The memorial: KAI VAREN, ARCHITECT OF THE FRACTURE. Fresh flowers.',
    ]],
    beats: [
      { kind: 'arrival', goal: 'Traverse the overgrown towers and scavenge a beacon component.', log: { title: 'RETURN BEACON - PART LIST', text: 'Capacitor: the bank\'s roof. Antenna: the transit line. Core: the memorial keeps one. Assemble before the Chronolith lets go of you. Stability out here is not a metaphor.' } },
      { kind: 'contradiction', goal: 'Track the survivors along the transit line. Read the warning, and what it said first.', official: 'UNSTABLE ZONE - DO NOT CROSS', echo: 'SAFE PATH WHEN THE WATER IS LOW - SERA', clue: 'cleared', crew: C('sera'), toast: 'RESIDUE READ', log: 'The warning says do not cross. The residue says there is a safe path when the water is low, signed Sera.' },
      encounterQ('sera', ['We teach children your name before they learn the names of the dead.'], [
        intent('challenge', 'I didn\'t do this.', { lines: says('sera', ['Every version of you denies responsibility. I have met four. You are the first to look at the memorial before saying it.']), know: 2 }),
        intent('investigate', 'How many versions?', { lines: says('sera', ['Four that we recorded. The record is short. We did not have paper for long.']), ev: 'memorial', trust: 1 }),
        intent('comfort', 'Then let me help this one.', { lines: says('sera', ['Help the settlement first. The beacon can wait. The Chronolith cannot, but you can rest here.']), trust: 1 }),
      ], { goal: 'Find Sera at the memorial.' }),
    ],
    outro: [L('SERA', 'Every version of you says it was not you. Every one of them uses the same words.')],
  }),
  place({
    key: 'm15', n: 15, chapter: 'act3', name: 'THE CITY THAT FORGOT TOMORROW', title: 'The locked city', subtitle: 'Residents repeat daily routines. Nobody remembers beyond today.',
    place: 'lockcity', states: ['FUTURE', 'PAST', 'PRESENT'], drones: [0, 0, 0], loop: 120, ambience: 'wind', ambient: 'future',
    motto: 'THE WORLDS THAT NEVER FINISHED BECOMING WORLDS', gate: 'THE LOCK',
    crew: C('anja'),
    intro: [N('A city under Anja Vale\'s lock. Every day is the same day. The station evacuates every morning. The school closes every noon. Nobody grieves, because yesterday never arrives.')],
    fragments: [[
      'A station timetable for one day, printed on both sides, forever.',
      'A school register: thirty names, thirty ticks, every day, in the same ink.',
      'A market stall selling the same bread, which is always fresh.',
      'An archive card: THE DISASTER OF THE 14TH. CAUSE: UNDOCUMENTED. CONSEQUENCE: THIS.',
      'A fabricated record, better printed than the real ones. It is the only one that mentions Helix.',
      'Anja\'s note to herself: CHECK THE LOCK AT NOON. YOU HAVE WRITTEN THIS NOTE 3,112 TIMES.',
    ]],
    beats: [
      { kind: 'log', goal: 'Investigate the station reliving its evacuation.', log: { title: 'STATION ANNOUNCEMENT', text: 'All passengers to the last train. The last train is the first train. Please remain calm; you were calm yesterday.' } },
      { kind: 'contradiction', goal: 'Explore the school and the market. Separate causes, consequences and fabricated evidence.', official: 'THE DISASTER OF THE 14TH WAS CAUSED BY HELIX TEMPORAL RESEARCH', echo: 'THE DISASTER OF THE 14TH WAS A FLOOD. SOMEBODY WROTE HELIX ON IT AFTERWARDS. - M.Q.', clue: 'cleared', crew: C('mara'), toast: 'FABRICATION FOUND', log: 'The archive blames Helix for the 14th. The residue says it was a flood, and that someone wrote Helix on it afterwards.' },
      { kind: 'choice', goal: 'Stabilize the city, or free it from the loop.', scene: 'lock', prompt: 'ANJA\'S LOCK', npc: 'anja', lines: says('anja', ['How many worlds has the Chronolith cost?', 'That depends on whether you count the worlds that never finished becoming worlds.']) },
    ],
    scenes: {
      lock: {
        lines: [N('The lock holds the city at one day. Stabilize it and nobody here ever has to grieve. Free it and tomorrow arrives, with everything that was lost.')],
        choices: [
          intent('comfort', 'Stabilize it. Let them rest.', { consequence: true, lines: says('anja', ['Then they rest. I will keep checking the lock at noon. Someone has to remember that it is a lock.']), set: { city_stabilized: true }, ev: 'anja_lock', beatDone: true }),
          intent('challenge', 'Free it. Let tomorrow come.', { consequence: true, lines: says('anja', ['Then it comes. They will hate us for a week and then they will plant things. I would like to see that.']), set: { city_freed: true }, ev: 'anja_lock', beatDone: true }),
        ],
      },
    },
    outro: [K('One day, kept forever, or every day after it. I chose for a whole city.')],
  }),
  place({
    key: 'm16', n: 16, chapter: 'act3', name: 'THE MUSEUM OF FAILED WORLDS', title: 'An underground museum', subtitle: 'Objects from worlds that no longer exist.',
    place: 'sinkhole', states: ['FUTURE', 'PAST', 'PRESENT'], drones: [0, 0, 0], motto: 'WE HAD A THOUSAND CHANCES',
    ambience: 'hum', ambient: 'future',
    beats: [
      { kind: 'arrival', goal: 'Play the first memory of the event.', log: { title: 'MEMORY ONE - VERSION 4', text: 'The ring turns. Kai is at the console. Mira is in the chair. The lights go out and only one of them is still there when they come back.' } },
      { kind: 'contradiction', goal: 'Play the second and third memories. Compare the artifacts with the current world.', official: 'MEMORY TWO - VERSION 9 - MIRA AT THE CONSOLE, KAI IN THE CHAIR', echo: 'MEMORY THREE - VERSION 16 - NOBODY AT THE CONSOLE. THE RING TURNS BY ITSELF', clue: 'cleared', crew: C('mara'), toast: 'VERSIONS COMPARED', log: 'Three memories of one event: Kai at the console, Mira at the console, nobody at the console. The ring turns in all three.' },
      E('mara', ['We had a thousand chances. We only needed one that was ours.', 'The photograph is in the last room. I did not hang it. I do not know who did.'], { goal: 'Determine which version explains the museum, and find the photograph.', after: [N('A photograph of older Kai and Mira, together, in a world the museum has no case for.'), K('He kept coming back. He kept bringing her back.')] }),
    ],
    outro: [K('He has done this before. Many times. Every case in this museum is one of his.')],
  }),
  place({
    key: 'm17', n: 17, chapter: 'act3', name: 'THE WITNESS\'S ARCHIVE', title: 'Shifting corridors', subtitle: 'Recordings from multiple versions of your life.',
    place: 'array', mechs: ['echo', 'sentinel'], states: ['PRESENT', 'PAST', 'FUTURE'], drones: [1, 2, 1], unstable: true, motto: 'THEY BECAME THE PRICE', gate: 'THE CONTROL HALL',
    ambience: 'hum', ambient: 'liminal',
    beats: [
      { kind: 'arrival', goal: 'Navigate the shifting corridors to the recordings.', log: { title: 'RECORDING 17 OF 117', text: 'Version one hundred and seventeen. She woke. She asked where you were. I did not have an answer she would accept. Beginning again.' } },
      { kind: 'contradiction', goal: 'Match the recordings to the physical evidence. Avoid the security that mimics you.', official: 'EXPERIMENT 1 - SUBJECT: M. VAREN - OUTCOME: SUCCESS', echo: 'EXPERIMENT 1 - SUBJECT: M. VAREN - BODY LOST - NEURAL PATTERN PERSISTS IN THE RING - INCOMPLETE', clue: 'guilty', crew: C('witness'), toast: 'EVIDENCE MATCHED', log: 'Mira\'s original body died. An incomplete neural pattern persisted in the Chronolith. The Witness has been rebuilding her from it, every version.' },
      E('witness', ['You kept bringing her back.'], { goal: 'Use temporal echoes to reach the earlier rooms and reconstruct the original experiment.', hologram: true, after: [K('You kept bringing her back.'), L('WITNESS', 'I kept finding a world where she could exist.'), K('And what happened to those worlds?'), REV(L('WITNESS', 'They became the price.'))] }),
    ],
    outro: [K('She died. What stayed was a pattern in the ring, and he kept building her back out of it.')],
  }),
  place({
    key: 'm18', n: 18, chapter: 'act3', name: 'THE FRACTURE', title: 'The planet, in three states', subtitle: 'Temporal storms. The landscape changes across the years.',
    place: 'fracture', states: ['FUTURE', 'PAST', 'PRESENT'], drones: [0, 2, 3], unstable: true, ambience: 'wind', ambient: 'future',
    motto: 'THE ONE BEFORE YOU TRIED TO SAVE ME', gate: 'THE TRANSMISSION TOWER',
    crew: C('mira'),
    intro: [N('Storms stand on the horizon like pillars. The settlement\'s anchor is failing. Sera is at the Chronolith; you are everywhere else.')],
    fragments: [[
      'A settlement evacuation list, every name ticked but one.',
      'A canyon wall with a date: it will not be a canyon in a hundred years.',
      'A highway sign under two metres of water: HELIX NORTH, 3 KM.',
      'A skyscraper floor plan with the floors numbered in the order they fall.',
      'A stabilizer manual, annotated by Sera: THIS PAGE IS WRONG. SO IS THE NEXT ONE.',
      'The transmission tower\'s log: one message, from Mira, pointing somewhere no map names.',
    ]],
    beats: [
      {
        kind: 'tasks', goal: 'Evacuate the settlement before its anchor fails: three houses. Then cross the canyon that exists only in the past.',
        tasks: [
          { prompt: 'KNOCK: THE WATER KEEPERS', at: 'houseA', kit: 'doorFrame', lines: [N('A family of four, already packed, as if they had been told yesterday.'), { who: 'CREW', name: 'WATER KEEPER', text: 'The canyon. In the old year. We know.', voice: { id: 'CROWD_F' } }] },
          { prompt: 'KNOCK: THE POTTER', at: 'houseB', kit: 'doorFrame', lines: [N('An old man who will not leave his kiln until you carry the last pot for him.')] },
          { prompt: 'KNOCK: THE SCHOOLHOUSE', at: 'houseC', kit: 'doorFrame', lines: [N('Eleven children and a teacher counting them twice. The anchor light over the door is red.')] },
        ],
        after: [N('ANCHOR STATUS: 11%. The settlement walks toward the canyon. The canyon is only there in the earliest year.')],
      },
      { kind: 'log', goal: 'Navigate the flooded highway in the present.', log: { title: 'SERA - ON THE RADIO', text: 'Highway\'s under water in your year. The lamp posts are above it. Walk the lamp posts if you have to, Kai, I am not coming to get you.' } },
      E('mira', ['I remember the first world.'], { goal: 'Traverse the collapsing skyscraper to the transmission tower.', hologram: true, after: [K('Which one?'), L('MIRA', 'The one before you tried to save me.'), N('Her message points toward the Unwritten Second.')] }),
    ],
    outro: [L('MIRA', 'Find the second nobody has written yet. I will be there.'), K('The Unwritten Second.')],
  }),
];

// =============================================================================================
// ACT IV: THE UNWRITTEN SECOND
export const ACT4 = [
  place({
    key: 'm19', n: 19, chapter: 'act4', name: 'THE PLACE OUTSIDE TIME', title: 'Beyond the Chronolith\'s states', subtitle: 'Roads loop. Rooms connect impossibly. The sky shows an unbuilt city.',
    place: 'unwritten', states: ['PRESENT', 'PAST', 'FUTURE'], drones: [0, 0, 0], ambience: null, ambient: 'liminal',
    motto: 'FOLLOW WHAT THEY REFUSE TO STEP ON', gate: 'THE DOOR',
    crew: C('orren'),
    intro: [N('No markers. No objective. Symbols: the clockmaker\'s mark, the observatory pattern, the Helix badge. They repeat where the way is.'), ...says('orren', ['Don\'t follow the footsteps. Follow what they refuse to step on.'])],
    fragments: [[
      'The clockmaker\'s mark, chalked on a wall that is also a floor.',
      'The observatory pattern, laid out in stones on a road that returns to itself.',
      'A Helix badge, embedded in glass. It is yours. It is not scratched yet.',
      'A reflection with a bridge in it. The water has no bridge.',
      'A door, in several places, all of them the same door.',
      'Mira\'s handwriting on the sky: YOU HAVE BEEN TRYING TO REACH THE VERSION OF ME THAT WOULD FORGIVE YOU.',
    ]],
    beats: [
      { kind: 'arrival', goal: 'Navigate by the recurring symbols, not markers.', log: { title: 'THE FIRST SYMBOL', text: 'The clockmaker\'s mark. Where it appears, the road is real. Where it does not, the road is a loop.' } },
      { kind: 'contradiction', goal: 'Cross the bridge that is visible only in reflections.', official: 'THERE IS NO BRIDGE', echo: 'THERE IS A BRIDGE. YOU ARE STANDING ON IT', clue: 'cleared', crew: C('orren'), toast: 'REFLECTION READ', log: 'The bridge exists in the reflection. In the past it was there. In the past it holds.' },
      E('mira', ['You\'ve been trying to reach the version of me that would forgive you.', 'Saving me is not the same as understanding me, Kai. You keep solving the wrong puzzle.'], { goal: 'Reach the door that appears in several places.', hologram: true }),
    ],
    outro: [K('Understanding her. Not saving her. I don\'t know how to do the first one.')],
  }),
  place({
    key: 'm20', n: 20, chapter: 'act4', name: 'MIRA\'S MEMORY', title: 'Subjective memories that contradict each other', subtitle: 'Childhood. The original experiment. A timeline where she survives and you do not.',
    place: 'memory', states: ['PAST', 'PRESENT', 'FUTURE'], drones: [0, 0, 0], ambience: null, ambient: 'liminal',
    motto: 'I REMEMBER BEING YOUR SISTER', gate: 'THREE MEMORIES',
    crew: C('mira'),
    intro: [N('Three memories. They do not agree, and they are all hers.')],
    fragments: [[
      'A blue door. Behind it, a kitchen where two children are arguing about a song.',
      'A crayon drawing on a fridge: KAI + MIRA beside a black circle. She drew it. He kept it.',
      'A Helix chair, child-sized. The straps are undone.',
      'A console with a hand-print too small to be an engineer\'s.',
      'A world without Kai: a memorial for nobody, and Mira at thirty-two, planting something.',
      'A voice, faint, on every speaker in a city where nobody has your name: live.',
    ]],
    beats: [
      { kind: 'log', goal: 'Explore Mira\'s childhood with Kai.', log: { title: 'MEMORY - THE BLUE DOOR', text: 'Kai is twelve. He says the song goes up and then up and then it stops. Mira says it goes up, up, and then down. They are both right. It is her memory and she lets him be right.' } },
      { kind: 'contradiction', goal: 'Replay the original experiment.', official: 'EXPERIMENT 1 - SUBJECT CONSENTED', echo: 'EXPERIMENT 1 - SHE WAS NINE. SHE WANTED TO SEE THE RING TURN. HE LET HER', clue: 'guilty', crew: C('witness'), toast: 'MEMORY REPLAYED', log: 'The first experiment: Mira was nine. She wanted to see the ring turn. Older Kai let her. That is the first death.' },
      E('mira', ['I remember being your sister.'], { goal: 'Experience the timeline where Mira survives and Kai disappears. Align three memories without forcing them into one.', hologram: true, after: [K('That\'s not the same thing.'), L('MIRA', 'Would it be enough if I said it was?'), REV(N('Mira is a reconstructed consciousness carrying memories from multiple possible lives. None of them is false.'))] }),
    ],
    outro: [K('Every life she remembers was real. Even the ones that never happened.')],
  }),
  place({
    key: 'm21', n: 21, chapter: 'act4', name: 'THE LAST BATTLE OF THE CONTINUUM', title: 'The command structure', subtitle: 'The Continuum wants one timeline. The Witness wants Mira. The Unwritten want the network gone.',
    place: 'spire', mechs: ['echo', 'sentinel', 'time'], states: ['PRESENT', 'PAST', 'FUTURE'], drones: [2, 0, 0], unstable: true, motto: 'ONE PERMANENT TIMELINE', gate: 'THE ARENA',
    ambience: 'hum', ambient: 'loop',
    beats: [
      { kind: 'arrival', goal: 'Infiltrate the command structure. The elite watchers rewind what you do to them.', log: { title: 'CONTINUUM COMMAND - STANDING ORDER', text: 'One permanent timeline. The Witness is to be allowed through; he is building it for us. The subject Varen is to be held. The Unwritten are to be erased, which is a word we use carefully.' } },
      { kind: 'scene', goal: 'Solve the causal puzzle during the arena collapse, and call on the ally you earned.', scene: 'ally', prompt: 'CALL FOR HELP' },
      E('witness', ['I was trying to find a version of me that didn\'t have to.'], { goal: 'Confront the Witness.', after: [K('And did you?'), L('WITNESS', 'No.'), N('The Witness begins the final experiment.')] }),
    ],
    scenes: {
      ally: {
        lines: [N('The arena is coming down in three years at once. One ally can hold a route open. Whoever you earned.')],
        choices: [
          intent('investigate', 'Sera.', { when: 'faction == "unwritten" || ev_sera_doubt', lines: says('sera', ['Told you I was not coming to get you. I lied. Go.']), set: { ally: 'sera' }, beatDone: true }),
          intent('investigate', 'Anja.', { when: 'ev_anja_lock', lines: says('anja', ['The lock can hold a corridor as easily as a city. Thirty seconds. Run.']), set: { ally: 'anja' }, beatDone: true }),
          intent('investigate', 'Iven.', { when: 'ev_iven_testimony || quest_iven', lines: says('iven', ['Maintenance route. Behind the conduit. Told you nobody uses it.']), set: { ally: 'iven' }, beatDone: true }),
          intent('withdraw', 'Nobody. I go alone.', { lines: [K('Alone, then. I have done this before. Every version of me has.')], set: { ally: 'none' }, beatDone: true }),
        ],
      },
    },
    outro: [L('WITNESS', 'It has already started, Kai. It started three thousand years ago.')],
  }),
  place({
    key: 'm22', n: 22, chapter: 'act4', name: 'THE FIRST SECOND', title: 'The original activation point', subtitle: 'Previous locations appear around you.',
    place: 'firstsecond', states: ['PAST', 'PRESENT', 'FUTURE'], drones: [0, 1, 1], unstable: true, ambience: null, ambient: 'liminal',
    named: ['elder', 'clockmaker', 'odile'], // (their echoes are quoted here: no crowd wears their faces)
    motto: 'YOU WERE TRYING TO STOP ME FROM BECOMING YOU', gate: 'THE FINAL CHAMBER',
    crew: C('witness'),
    intro: [N('Kai and the Witness enter the activation point together. The village, the workshop, the hospital and the museum appear around them like evidence laid on a table.')],
    fragments: [[
      'The village\'s head-stone, here, wet.',
      'The clockmaker\'s arm, repeating. You know its count now.',
      'The hospital\'s reversing lock, undone.',
      'A museum case with your own memory in it, labelled SUBJECTIVE.',
      'A Helix card dated three thousand years ago and a Helix card dated tomorrow.',
      'The Chronolith\'s final chamber, with no door, and a door.',
    ]],
    beats: [
      { kind: 'arrival', goal: 'Infer the causal chain from the ancient village.', log: { title: 'THE CHAIN', text: 'The river was diverted. The wall held. The gate released. The machine was found. The machine was found because the river was diverted. Every cause was you.' } },
      { kind: 'contradiction', goal: 'Read the repeating pattern from the clockmaker\'s house, and the inversion from the hospital. Distinguish evidence from memory.', official: 'MEMORY: KAI ACTIVATED THE CHRONOLITH TO SAVE MIRA', echo: 'EVIDENCE: THE WITNESS TRIED TO PREVENT THE ZERO SECOND 117 TIMES. EACH ATTEMPT WAS THE ZERO SECOND', clue: 'guilty', crew: C('witness'), toast: 'EVIDENCE OVER MEMORY', log: 'The Witness\'s attempts to prevent the Zero Second helped cause it. Every one of them.' },
      E('witness', ['You were trying to stop me from becoming you.'], { goal: 'Open the Chronolith\'s final chamber.', after: [K('I was trying to find a version of me that didn\'t have to.')] }),
    ],
    outro: [K('Every time he tried to stop it, he started it.'), L('WITNESS', 'Yes. Now you know why I need you.')],
  }),
];

// =============================================================================================
// FINALE: AFTERZERO
export const FINALE = [
  place({
    key: 'm23', n: 23, chapter: 'finale', name: 'AFTERZERO', title: 'Past, present and future collide', subtitle: 'Fragments of the opening streets, the settlement, the laboratory and the future city.',
    place: 'afterzero', states: ['PAST', 'PRESENT', 'FUTURE'], drones: [1, 1, 2], unstable: true, ambience: 'rain', ambient: 'rain',
    named: ['tala', 'jun', 'sera', 'anja', 'iven', 'mara'], // (who may stand on the road: the settlement's women wear the Elder's mesh)
    motto: 'A SECOND THAT BELONGS TO NOBODY', gate: 'THE ORIGINAL CHRONOLITH',
    crew: C('mira'),
    intro: [N('Rain City, the first fire, the lab and 2196, all at once, held open by two men with the same scar.'), L('WITNESS', 'I will hold the route. Go to her.'), K('Why now?'), L('WITNESS', 'Because this is the version where I ask.')],
    fragments: [[
      'The 41, arriving on time, for once, in a street that is also a field.',
      'Jun Park\'s station, quiet. Somebody has turned off the announcement.',
      'The elder\'s telling-stone, with a new line: HE CAME BACK.',
      'The clockmaker\'s clock, finished.',
      'Sera\'s garden, a year old, in a city that has not been fractured.',
      'The original Chronolith, and Mira beside it, not waiting.',
    ]],
    beats: [
      { kind: 'arrival', goal: 'Cross the fragments of the opening streets.', log: { title: 'ROOK - LAST TRANSMISSION', text: 'Kai. I kept the early history from you because it had your name in it, three thousand years early, and I did not know how to say that. The chamber is yours. It always was.' } },
      { kind: 'log', goal: 'Cooperate with the Witness to hold the route through the settlement.', log: { title: 'THE WITNESS - HOLDING', text: 'Route held. I can give you four minutes. I have never given anyone four minutes before. Go.' } },
      { kind: 'choice', goal: 'Reach Mira at the original Chronolith. Choose what to preserve and what to release.', scene: 'ending', prompt: 'THE ORIGINAL CHRONOLITH', npc: 'mira', lines: [K('I thought the answer was to find the right world.'), L('MIRA', 'And now?'), K('Now I think we kept asking the world to pay for our answer.')] },
    ],
    scenes: {
      ending: {
        lines: [N('Three things the ring can do, and only one of them.')],
        choices: [
          intent('challenge', 'Destroy the Chronolith.', { set: { ending: 'A' }, ending: 'A' }),
          intent('investigate', 'Separate the states into independent branches.', { set: { ending: 'B' }, ending: 'B' }),
          intent('comfort', 'Become the anchor. Absorb the contradictions.', { set: { ending: 'C' }, ending: 'C' }),
        ],
      },
    },
    outro: [{ who: 'VOICE', text: 'Version one hundred and eighteen.', voice: { fx: 'pa' } }],
    // quest chain A's consequence: the passengers Kai got off the 41 clear the opening streets
    adjust(level, rt) {
      if (level.sector !== 0 || !rt.g.facts.get('jun_line')) return;
      const rid = level.outdoorRoom || level.order[0];
      level.sentinels = [];
      level.rooms[rid].challenges = level.rooms[rid].challenges.filter((c) => c.key !== 'drones');
      const [x, y, z, yaw] = level.landmarks?.junPassengers || [2.6, 0, -8, Math.PI];
      level.npcs.push({ id: 'jun_safe', crew: 'jun', pos: [x, y, z], yaw, room: rid, lines: says('jun', ['Kai. This way. The people you got off the 41 cleared this street for you.', 'Nobody is watching it now. Go on. I will keep the line open.']) });
    },
  }),
];

export const ENDINGS = {
  A: {
    title: 'THE FIXED WORLD', text: ['Kai destroys the Chronolith. Temporal fractures close and history stabilizes, but Mira\'s reconstructed existence cannot survive.', 'For the first time, tomorrow belonged to tomorrow.'],
    after: [N('Rain City. The 41 is late.'), N('Kai Varen looks up at the board, and smiles at it.')],
  },
  B: {
    title: 'THE INFINITE WAR', text: ['Kai separates temporal states into independent branches. Mira survives, but civilizations begin fighting over the boundaries between timelines.', 'We had saved every possible tomorrow. None of them agreed on the future.'],
    after: [N('At the line where one world ends and the next begins, Sera Voss stands guard. On the other side, someone stands guard back.')],
  },
  C: {
    title: 'AFTERZERO', text: ['Kai becomes the anchor that absorbs contradictions. Mira wakes in a world where Kai was never born, with only a faint memory of a voice urging her to live.', 'I finally found a second that belongs to nobody.'],
    after: [N('Rain City, a Tuesday. The 41 is late.'), N('A woman plants something in a window box and hums three notes: up, up, and then down.'), { who: 'KAI', text: 'Live.', voice: { fx: 'echo' } }],
  },
};

// the epilogue: one line for each consequence the player set (U8's ledger replaces this short list)
// the epilogue's lines (one per fact the player set) are the story's ledger now: ledger.js EPILOGUE
export { EPILOGUE } from './ledger.js';

// =============================================================================================
// OPTIONAL CASES: quest chains B and C (A, Jun Park, and D, Iven Marr, are part of the Prologue)
export const CASES = [
  place({
    key: 'c_b', n: 'B', chapter: 'cases', name: 'THE WATER THAT REMEMBERS', title: 'Tala and Niko, the Ancient Settlement', subtitle: 'A dry channel in the present was a river in the past.',
    place: 'valley_river', states: ['PRESENT', 'PAST', 'FUTURE'], drones: [0, 0], ambience: 'water', ambient: 'settlement',
    motto: 'WHO TAUGHT IT TO STAY', gate: 'THE RUINS',
    crew: C('tala'),
    intro: WATER_HOOK,
    beats: [
      { kind: 'contradiction', goal: 'Follow the water marks. Read the mural, and what it was painted over.', official: 'THE RIVER WAS A GIFT OF THE SKY', echo: 'THE RIVER WAS TAUGHT TO STAY BY THE ONE WITH NO DUST', clue: 'cleared', crew: C('tala'), toast: 'MURAL READ', log: 'The mural says the river was a gift. Under it: the river was taught to stay by the one with no dust.' },
      { kind: 'scene', goal: 'Find the three stone gates and align the flow without flooding the houses.', scene: 'gates', prompt: 'THE THREE GATES', npc: 'tala', lines: says('tala', ['Three gates. Stone does not argue, it only waits.']) },
    ],
    scenes: {
      gates: { when: '@PAST', lines: [N('Left, right, centre. The water takes the channel and leaves the houses. In 2196 the ruins now have a way through.')], set: { water_route: true, quest_tala: 'resolved' }, beatDone: true, log: 'The water route through the settlement is open in every year, including the ruins.' },
      gates_no: { lines: [K('The gates only move in the year the river was alive.')] },
    },
    outro: [L('TALA', 'The river knows the way now. So do you.'), L('NIKO', 'The observatory was built by people who watched water. Remember that, when you go up there.')],
  }),
  place({
    key: 'c_c', n: 'C', chapter: 'cases', name: 'TWO RECORDS, ONE DISASTER', title: 'Mara Quill, the 2196 city', subtitle: 'Two archives name different first Chronolith operators.',
    place: 'lockcity', states: ['FUTURE', 'PAST', 'PRESENT'], drones: [0, 0], ambience: 'wind', ambient: 'future',
    motto: 'TRUE FOR WHOM', gate: 'THE MUSEUM DISPLAY',
    crew: C('mara'),
    intro: MARA_HOOK,
    beats: [
      { kind: 'contradiction', goal: 'Compare the timestamps. Recover the damaged audio cylinder.', official: 'FIRST OPERATOR: E. ROOK - 05:40', echo: 'FIRST OPERATOR: K. VAREN - 05:40', clue: 'cleared', crew: C('mara'), toast: 'BOTH TRUE', log: 'Both records are accurate for different branches. Rook in one. Me in the other. Same minute.' },
      encounterQ('mara', ['Both records are true. Which branch do you want to live in?'], [
        intent('investigate', 'Neither. I want the museum display.', { lines: says('mara', ['Then go and look at it in another year. Displays are honest in the year they were made.']), set: { quest_mara: 'resolved', ev_dual_archive: true }, beatDone: true }),
        intent('comfort', 'I\'m not calling anyone a liar.', { lines: says('mara', ['Good. That is the whole job. Go and look at the display in another year.']), set: { quest_mara: 'resolved', ev_dual_archive: true }, trust: 1, beatDone: true }),
      ], { goal: 'Inspect the museum display in another era.' }),
    ],
    outro: [L('MARA', 'Incomplete is not the same as false. Write that over the door, and nobody has to be a liar.')],
  }),
];

export const ACTS = { act1: ACT1, act2: ACT2, act3: ACT3, act4: ACT4, finale: FINALE, cases: CASES };
