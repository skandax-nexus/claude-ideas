// AFTERZERO - narrative data.
//
// Lines are { who, text, when? }. A script is an ordered list of lines; lines
// whose `when` fails are skipped, so the same recording can grow new
// sentences as the world changes (System 3: discoveries change earlier
// events). Rules fire once when their condition becomes true.

export const SPEAKERS = {
  VARGA: { name: 'DR. ILSE VARGA', color: '#ffc27a' },
  YOU: { name: 'YOU', color: '#ffffff' },
  OTHER: { name: '???', color: '#c7a2ff' },
  CUSTODIAN: { name: 'CUSTODIAN', color: '#6ff0d4' },
  DEVICE: { name: 'DEVICE', color: '#9dff9d' },
  OBSERVER: { name: '', color: '#ff7a6a' },
  NONE: { name: '', color: '#cfd8e0' },
};

export const scripts = {
  other_speaks: [
    { who: 'OTHER', text: 'You finally learned how to move the room.' },
    { who: 'OTHER', text: 'Now learn why it was moving you.' },
  ],

  // R1 - Varga's warning. It changes after the machine is activated.
  r1: [
    { who: 'NONE', text: '[ RECORDING 1  -  LAB 0  -  CYCLE: UNREADABLE ]' },
    { who: 'VARGA', text: 'This is Dr. Ilse Varga. If the field is stable, you are hearing this from the lab terminal.' },
    { who: 'VARGA', text: 'Whatever you do, do not activate the machine.' },
    { who: 'VARGA', text: 'If you have already activated it, I am sorry.', when: 'machine_activated' },
    { who: 'VARGA', text: 'That last sentence was not there the first time you listened. I added it later. Much later.', when: 'machine_activated && vault_seen' },
    { who: 'YOU', text: 'That sentence wasn\'t there before.', when: 'machine_activated && heard_varga && !vault_seen' },
  ],

  // R0 - your own voice, behind the shadow.
  r0: [
    { who: 'NONE', text: '[ RECORDING 0  -  DATED 14 MARCH 2071 ]' },
    { who: 'YOU', text: 'If you\'re hearing this, you made the shadow. Good.' },
    { who: 'YOU', text: 'Here\'s how it works: stand where it isn\'t, and let the room remember you there.' },
    { who: 'YOU', text: 'Things you take out of a memory don\'t survive leaving it. Unless you change the law.' },
    { who: 'YOU', text: 'You won\'t be born for eighteen years. Don\'t let that slow you down.' },
    { who: 'YOU', text: '...wait. If I made the shadow - who was I controlling?', when: 'noticed_shadow' },
  ],

  // R2 - Varga's recording from after.
  r2: [
    { who: 'NONE', text: '[ RECORDING 2  -  VAULT  -  DATED: AFTER ]' },
    { who: 'VARGA', text: 'This one is recorded after the activation. It is always after.' },
    { who: 'VARGA', text: 'You activate it. You always do. The way out of this place runs through the machine, and you are very good at finding ways out.' },
    { who: 'VARGA', text: 'I built the lab to keep it alive. I never told you what "it" was.' },
    { who: 'VARGA', text: 'You already did it, didn\'t you. I can hear the windows.', when: 'machine_activated' },
    { who: 'VARGA', text: 'When the walls become windows, look at the machine in the echo. Then decide.' },
  ],

  lock_no_key: [
    { who: 'NONE', text: 'ARCHIVE SEALED. QUERY: "LABORATORY" - NO RECORD.' },
    { who: 'CUSTODIAN', text: 'There is no laboratory. There has never been a laboratory.', when: '!custodian_denied' },
    { who: 'CUSTODIAN', text: 'You are standing in nothing. Bring me something that says otherwise.', when: '!custodian_denied' },
    { who: 'CUSTODIAN', text: 'Still nothing. Evidence, or silence.', when: 'custodian_denied' },
  ],
  lock_echo_key: [
    { who: 'CUSTODIAN', text: 'That key is a memory. Memories are not evidence.' },
    { who: 'CUSTODIAN', text: 'Make it real, then show me.' },
  ],
  lock_open: [
    { who: 'NONE', text: 'KEY ACCEPTED: LABORATORY 0.' },
    { who: 'CUSTODIAN', text: '...' },
  ],

  custodian_first: [
    { who: 'CUSTODIAN', text: 'The laboratory. Yes. I remember it now.' },
    { who: 'CUSTODIAN', text: 'You came through that door before. You were older. You were carrying her.' },
    { who: 'CUSTODIAN', text: 'You told me to forget the laboratory, so you would have to prove it to yourself.' },
    { who: 'CUSTODIAN', text: 'You also told me to give you these.' },
  ],
  custodian_hint: [
    { who: 'CUSTODIAN', text: 'The vault is past the gap. The bridge exists only in memory.', when: '!vault_seen' },
    { who: 'CUSTODIAN', text: 'Memory can be made load-bearing. You wrote that law once.', when: '!vault_seen' },
    { who: 'CUSTODIAN', text: 'Varga\'s last recording is in the vault. She recorded it after.', when: 'vault_seen && !machine_activated' },
    { who: 'CUSTODIAN', text: 'The walls of the laboratory are windows now. It was never a laboratory.', when: 'machine_activated && !brain_seen' },
    { who: 'CUSTODIAN', text: 'It was a life-support system. For one occupant. You have met him.', when: 'brain_seen' },
  ],

  machine_empty: [{ who: 'NONE', text: 'An empty socket. Something round and heavy belonged here.' }],
  machine_installed: [{ who: 'NONE', text: 'The core seats itself. The machine is waiting.' }],
  machine_warn: [
    { who: 'VARGA', text: 'Whatever you do, do not activate the machine.' },
    { who: 'DEVICE', text: 'USE AGAIN TO ACTIVATE.' },
  ],
  machine_activate: [
    { who: 'NONE', text: 'The field opens.' },
    { who: 'NONE', text: 'The walls are not walls.' },
    { who: 'YOU', text: 'Stars. It\'s not a lab. It\'s moving.' },
  ],
  machine_hum: [{ who: 'NONE', text: 'It hums at the edge of hearing. Something inside it only shows in the echo.' }],

  brain: [
    { who: 'NONE', text: 'Inside the ring: a human brain, suspended, lit from within.' },
    { who: 'YOU', text: 'The machine was built around it.' },
    { who: 'NONE', text: 'Cables surface from the floor and run west - toward the hall.' },
  ],
  observer_tethered: [
    { who: 'NONE', text: 'The Observer stands in the doorway. It does not hunt you now.' },
    { who: 'NONE', text: 'Its eye pulses at the same rate as the brain.' },
  ],
  observer_face: [
    { who: 'NONE', text: 'It looks at you the way you look at a mirror.' },
    { who: 'YOU', text: 'It learned how I hide. How I run. How I think.' },
    { who: 'YOU', text: 'It was learning to be me.' },
  ],

  shadow_cold: [{ who: 'NONE', text: 'It is cold, and solid, and waiting for something you have not done yet.' }],
  shadow_opens: [
    { who: 'NONE', text: 'The shadow steps into the wall. The wall remembers a door.' },
  ],

  key_dissolves: [{ who: 'NONE', text: 'The key comes apart in your hand and drifts back into memory.' }],
  caught: [{ who: 'OBSERVER', text: 'It remembers you.' }],
  archive_fall: [{ who: 'NONE', text: 'The archive returns you to where it last remembered you.' }],

  law_hint_first: [
    { who: 'DEVICE', text: 'NEW LAW TOKEN. THE DEVICE CAN BE REWRITTEN.' },
  ],
};

// Discoveries recorded as a theory log (the gameplay loop: notice -> theory).
// Rules: the narrative engine's authored logic.
export const rules = [
  { id: 'a_touch1', when: 'shard_touch >= 1', then: [{ log: 'Touching the object changed the room, not me. Gravity let go.' }] },
  { id: 'a_touch2', when: 'shard_touch >= 2', then: [{ log: 'Touch it twice and the room turns over. A door exists only upside-down.' }] },
  { id: 'a_device', when: 'has_device', then: [{ log: 'The object is in my hand now. It changes the state of whatever room I stand in.' }] },
  { id: 'a_echo', when: 'seen_echo', then: [{ log: 'ECHO shows what happened here. Footprints. Writing. Things that are gone.' }] },
  { id: 'a_shadow', when: 'noticed_shadow', then: [{ log: 'The shadow on the east wall moves against me. Left when I go right.' }] },
  { id: 'a_shadow2', when: 'shadow_solid_seen', then: [{ log: 'In the echo, the shadow is a thing. It freezes where it was.' }] },
  { id: 'a_passage', when: 'shadow_passage_open', then: [{ log: 'I stood where it wasn\'t. It stood where the door was.' }] },
  { id: 'a_self', when: 'heard_self', then: [{ log: 'Recording 0 is my voice. It is dated eighteen years before I was born.' }] },
  { id: 'a_key', when: 'key_dissolved', then: [{ log: 'Things I take from the echo don\'t survive leaving it.' }] },
  { id: 'a_law', when: 'wrote_law', then: [{ log: 'The device runs on laws. I can rewrite them. The world obeys.' }] },
  { id: 'a_cust', when: 'custodian_remembers', then: [{ log: 'The Custodian now remembers a lab it said never existed - and an older me carrying someone.' }] },
  { id: 'a_varga', when: 'heard_varga', then: [{ log: 'Varga warned me not to activate the machine. Who was she warning?' }] },
  { id: 'a_vault', when: 'vault_seen', then: [{ log: 'Varga\'s last recording was made after the activation. She is not missing. She is later.' }] },
  { id: 'a_act', when: 'machine_activated', then: [{ log: 'The walls are windows. The lab is a ship. It is moving.' }] },
  { id: 'a_r1x', when: 'machine_activated && heard_varga', then: [{ log: 'Varga\'s first recording now has a sentence it didn\'t have before.' }] },
  { id: 'a_brain', when: 'brain_seen', then: [{ log: 'A human brain is inside the machine. Cables run from it to the Observer.' }] },
  { id: 'a_face', when: 'observer_faced', then: [{ log: 'The Observer was not hunting me. It was learning me.' }] },

  // Narrative consequences
  { id: 'tether', when: 'machine_activated', then: [{ set: { observer_tethered: true } }] },
];

// System 5: the objective the player sees is the best explanation of the
// evidence so far. Each layer replaces the last.
export const objectiveLayers = [
  { when: 'left_antechamber', text: 'Escape the structure.', because: 'I woke in a sealed room. Nothing else made sense.' },
  { when: 'heard_varga', text: 'Find Dr. Ilse Varga.', because: 'Someone left a warning. She might know the way out.' },
  { when: 'vault_seen', text: 'Stop the event you already caused.', because: 'Varga isn\'t lost. She\'s recording from after something I do.' },
  { when: 'brain_seen', text: 'Decide what the catastrophe is holding back.', because: 'The machine keeps something alive. Stopping it may be worse.' },
];

// Questions the journal keeps open until evidence answers them.
export const questions = [
  { q: 'What is the floating object?', open: 'shard_touch >= 1', closed: 'has_device', a: 'A device that rewrites the room\'s state.' },
  { q: 'Why does the shadow move the wrong way?', open: 'noticed_shadow', closed: 'heard_self', a: 'I made it. Or a version of me did.' },
  { q: 'Who recorded Recording 0?', open: 'heard_self', closed: 'observer_faced', a: 'Every version of me leaves one.' },
  { q: 'Does the laboratory exist?', open: 'custodian_denied', closed: 'custodian_remembers', a: 'It does now.' },
  { q: 'Where is Varga?', open: 'heard_varga', closed: 'vault_seen', a: 'Not where. When.' },
  { q: 'What is the machine for?', open: 'heard_varga', closed: 'brain_seen', a: 'Keeping one occupant alive.' },
  { q: 'What does the Observer want?', open: 'hall_seen', closed: 'observer_faced', a: 'To become me.' },
];

export const endings = {
  SEVER: {
    title: 'SEVERED',
    text: [
      'You pull the core. The brain goes dark between one pulse and the next.',
      'In the doorway, the Observer folds to the floor like a coat with no one in it.',
      'The windows go black. The ship stops moving. For a long, quiet moment, nothing happens.',
      'Then, far beneath the station, something that was being held shut opens its eyes.',
    ],
  },
  SUSTAIN: {
    title: 'SUSTAINED',
    text: [
      'You leave the machine running. The brain keeps its slow rhythm. The ship keeps moving.',
      'You find a terminal and begin to record: "This is Dr. Ilse Varga..." - no. Your own name. Then you stop.',
      'Somewhere behind you, in a sealed room, someone wakes up and sees a glowing object for the first time.',
      'You go to stand in the corridor, upside down, and wait to tell them how to move the room.',
    ],
  },
  MIRROR: {
    title: 'OBSERVED',
    when: 'observer_faced && heard_self && custodian_remembers',
    text: [
      'You walk to the doorway and stand where the Observer can see you. You do not hide.',
      'It has learned how you hide, how you run, which laws you lean on. Now it learns the last thing: that you chose to be seen.',
      'The cables slacken. The brain\'s rhythm changes to match yours.',
      'There are two of you in the doorway. Then there is one, and the station knows your name.',
    ],
  },
};

// Discovery facts counted for the playtest report.
export const discoveries = [
  'has_device', 'seen_echo', 'noticed_shadow', 'shadow_passage_open', 'heard_self', 'heard_varga',
  'key_dissolved', 'wrote_law', 'archive_open', 'custodian_remembers', 'vault_seen', 'core_installed',
  'machine_activated', 'brain_seen', 'observer_faced',
];
