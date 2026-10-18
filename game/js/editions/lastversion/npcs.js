// THE LAST VERSION OF EARTH: the people (NPC design supplement of the bible).
//
// Every quest-relevant NPC has a small explicit state model, kept in facts:
//   trust_<id>      -1 hostile · 0 guarded · 1 cooperative
//   know_<id>        0 unaware · 1 suspicious · 2 loop-aware · 3 informed
//   quest_<id>       '' not started · 'active' · 'resolved' · 'observed' (the consequence seen)
//   faction          'neutral' · 'continuum' · 'unwritten'   (Kai's standing, Mission 13 on)
//   ev_<flag>        evidence flags: rook_log, mira_memory, dual_archive, witness_recording, ...
// Temporal state: the states an NPC exists in (others get an echo or a recording in their place).
// Dialogue choices express intent (challenge / comfort / investigate / withdraw) and set facts.
// Barks are short lines said in passing, never over a conversation.

const HER = { their: 'her', them: 'her' }, HIS = { their: 'his', them: 'him' };

export const NPCS = {
  kai: { id: 'kai', first: 'Kai', name: 'Kai Varen', role: 'Temporal systems engineer', pronoun: HIS, color: '#25313d', voice: 'KAI', era: 'present', seed: 1 },
  mira: {
    id: 'mira', first: 'Mira', name: 'Mira Varen', role: 'The impossible sister', pronoun: HER, color: '#c4566a', voice: 'MIRA', era: 'temporal', seed: 2,
    temporal: ['echo'], want: 'To be treated as a person, not a restoration project.', fear: 'Being overwritten.',
    barks: ['You keep looking for me where I was.', 'Don\'t fix it, Kai. Look at it.'],
  },
  witness: {
    id: 'witness', first: 'The Witness', name: 'The Witness', role: 'Older Kai', pronoun: HIS, color: '#4a5a7a', voice: 'WITNESS', era: 'future', seed: 3,
    temporal: ['PRESENT', 'PAST', 'FUTURE'], want: 'To force a survivable path.', fear: 'Uncertainty and loss.',
    barks: ['You are early. You are always early.', 'Do not build the machine.'],
    echo: [{ who: 'NONE', text: 'The Witness does not exist in this state. What stands here is the shape he left behind on his way through.' }, { who: 'WITNESS', text: 'You are early. You are always early.' }],
  },
  sera: {
    id: 'sera', first: 'Sera', name: 'Sera Voss', role: 'Resistance leader, 2196', pronoun: HER, color: '#c0762a', voice: 'SERA', era: 'future', seed: 4,
    temporal: ['FUTURE'], faction: 'unwritten', want: 'To protect a fragile district.', fear: 'Another timeline disaster.',
    barks: ['Stay off the glass. It remembers weight.', 'If you are who they say, keep walking.', 'We teach children your name before they learn the names of the dead.'],
  },
  rook: {
    id: 'rook', first: 'Rook', name: 'Dr. Elias Rook', role: 'Director, Helix', pronoun: HIS, color: '#6c5bc4', voice: 'ROOK', era: 'present', seed: 5,
    temporal: ['PRESENT'], faction: 'continuum', want: 'Control of the Chronolith project.', fear: 'Public exposure.',
    barks: ['The chamber is off limits, Kai.', 'Lockdown is procedure. Nothing more.'],
  },
  niko: {
    id: 'niko', first: 'Niko', name: 'Niko', role: 'Keeper of the settlement', pronoun: HIS, color: '#2f8a5a', voice: 'NIKO', era: 'past', seed: 6,
    temporal: ['PAST', 'PRESENT'], want: 'To protect communal memory.', fear: 'Outsiders turning sacred knowledge into a weapon.',
    barks: ['You wear no dust, but the old story knows your face.', 'The river was taught to stay. Who taught you?'],
    echo: [{ who: 'NONE', text: 'Niko has not been born in this year, or has been dead in it a long time. His echo kneels by the water, listening.' }, { who: 'NIKO', text: 'Then you have not listened long enough.' }],
  },
  anja: {
    id: 'anja', first: 'Anja', name: 'Dr. Anja Vale', role: 'Temporal scientist, 2196', pronoun: HER, color: '#1f9a90', voice: 'ANJA', era: 'future', seed: 7,
    temporal: ['FUTURE'], want: 'To stabilize the city\'s temporal lock.', fear: 'Preserving a lie.',
    barks: ['The lock holds. I have stopped asking what it holds out.', 'Every morning here is the same morning. It is very restful. I hate it.'],
  },
  iven: {
    id: 'iven', first: 'Iven', name: 'Iven Marr', role: 'Helix technician', pronoun: HIS, color: '#a8862a', voice: 'IVEN', era: 'present', seed: 8,
    temporal: ['PRESENT'], want: 'To get his team out safely.', fear: 'Being blamed for a test he did not approve.',
    barks: ['I signed nothing. Remember that when they ask.', 'Maintenance route runs behind the conduit. Nobody uses it. Nobody is supposed to.'],
    echo: [{ who: 'NONE', text: 'Iven Marr is not here in this year. His echo is: a man at a panel, writing NOT SIGNED BY ME on a sheet, again and again.' }, { who: 'IVEN', text: 'Panel was installed before the drone was. Remember that.' }],
  },
  jun: {
    id: 'jun', first: 'Jun', name: 'Jun Park', role: 'Transit operator, Rain City', pronoun: HIS, color: '#3b7fb8', voice: 'JUN', era: 'present', seed: 9,
    temporal: ['PRESENT'], want: 'To keep the station running.', fear: 'Leaving passengers behind.',
    barks: ['Mind the yellow line. The board is wrong but the line is right.', 'Forty-one seconds. I\'ve timed it. Forty-one.'],
    echo: [{ who: 'NONE', text: 'For a few seconds it is a minute before the crash. The Jun in the booth is an echo, calling the 41 in.' }, { who: 'JUN', text: 'Line 41, platform two, on time. On time. On time.' }],
  },
  tala: {
    id: 'tala', first: 'Tala', name: 'Tala', role: 'Water keeper', pronoun: HER, color: '#2b8f7a', voice: 'TALA', era: 'past', seed: 10,
    temporal: ['PAST'], want: 'The water system restored.', fear: 'The observatory being weaponized.',
    barks: ['The dry channel remembers being a river.', 'Three gates. Stone does not argue, it only waits.'],
    echo: [{ who: 'NONE', text: 'Tala belongs to the year the river was alive. Here she is an echo, lifting a stone gate that is not there.' }, { who: 'TALA', text: 'Left, right, centre. Stone does not argue.' }],
  },
  mara: {
    id: 'mara', first: 'Mara', name: 'Mara Quill', role: 'Archivist, 2196', pronoun: HER, color: '#8a6a9a', voice: 'MARA', era: 'future', seed: 11,
    temporal: ['FUTURE'], want: 'To preserve conflicting records.', fear: 'One official history.',
    barks: ['Two records. Both true. Start there.', 'A clean history is usually a history someone has cleaned.'],
  },
  orren: {
    id: 'orren', first: 'Orren', name: 'Orren', role: 'A guide, or a pattern', pronoun: HIS, color: '#7a5fd0', voice: 'ORREN', era: 'outside', seed: 12,
    temporal: ['echo'], want: 'Kai to stop treating the impossible realm as a machine.', fear: 'Being erased by a final choice.',
    barks: ['Don\'t follow the footsteps. Follow what they refuse to step on.', 'You are asking the room what time it is. Wrong question.'],
  },
  child: {
    id: 'child', first: 'The Child', name: 'The Child in the Station', role: 'A recurring anomaly', pronoun: HER, color: '#d06a9a', voice: 'CHILD', era: 'temporal', seed: 13,
    temporal: ['echo'], height: 1.22, want: 'A familiar tune and a way home.', fear: 'Nothing. She does not understand the timeline.',
    barks: ['Do you know the song? It goes up and then it goes up again and then it stops.', 'The train is late. The train is early. Which one is mine?'],
  },
  // Tier 2 and ambient voices with a name
  guard: { id: 'guard', first: 'Officer', name: 'Checkpoint Officer', role: 'Security', pronoun: HER, color: '#4f6170', voice: 'CREW', era: 'present', seed: 21 },
  dale: { id: 'dale', first: 'Dale', name: 'Officer Dale', role: 'Helix security', pronoun: HIS, color: '#4f6170', voice: 'CREW', era: 'present', seed: 22 },
  pryce: { id: 'pryce', first: 'Pryce', name: 'Officer Pryce', role: 'Helix security', pronoun: HER, color: '#4f6170', voice: 'CREW', era: 'present', seed: 23 },
  haig: { id: 'haig', first: 'Haig', name: 'Officer Haig', role: 'Helix security', pronoun: HER, color: '#4f6170', voice: 'CREW', era: 'present', seed: 24 },
  researcher: { id: 'researcher', first: 'Lin', name: 'Dr. Lin', role: 'Helix researcher', pronoun: HER, color: '#4f6170', voice: 'CREW', era: 'present', seed: 25 },
  elder: { id: 'elder', first: 'The Elder', name: 'The Elder', role: 'Leader of the settlement', pronoun: HER, color: '#8a6a3a', voice: 'CREW', era: 'past', seed: 26 },
  clockmaker: { id: 'clockmaker', first: 'The Clockmaker', name: 'The Clockmaker', role: 'Keeper of loops', pronoun: HIS, color: '#8a6a3a', voice: 'CREW', era: 'past', seed: 27 },
  engineer: { id: 'engineer', first: 'Rhea', name: 'Rhea Odum', role: 'Trapped engineer', pronoun: HER, color: '#4f6170', voice: 'CREW', era: 'present', seed: 28 },
  soldier: { id: 'soldier', first: 'Sergeant', name: 'Loop-aware sergeant', role: 'Continuum soldier', pronoun: HIS, color: '#4f6170', voice: 'CREW', era: 'present', seed: 29 },
  patient: { id: 'patient', first: 'The Patient', name: 'Patient 32', role: 'Inverted Hospital', pronoun: HER, color: '#4f6170', voice: 'CREW', era: 'present', seed: 30 },
  warden: { id: 'warden', first: 'Warden', name: 'District Warden', role: 'Warden, 2196', pronoun: HIS, color: '#4f6170', voice: 'CREW', era: 'future', seed: 31 },
  gardener: { id: 'gardener', first: 'Gardener', name: 'The Gardener', role: 'Gardener, 2196', pronoun: HER, color: '#4f6170', voice: 'CREW', era: 'future', seed: 32 },
};

export const CAST = Object.values(NPCS).map((n) => ({ ...n, alive: true }));

// the state model, read from facts
export const TRUST = { '-1': 'hostile', 0: 'guarded', 1: 'cooperative' };
export const KNOWLEDGE = ['unaware', 'suspicious', 'loop-aware', 'informed'];
export const npcState = (facts, id) => ({
  trust: facts.get(`trust_${id}`) ?? 0,
  knowledge: facts.get(`know_${id}`) ?? 0,
  quest: facts.get(`quest_${id}`) || '',
});

// Ambient populations by region: who walks here and what they say in passing.
export const AMBIENT = {
  rain: {
    names: ['Commuter', 'Commuter', 'Courier', 'Shopkeeper', 'Contractor', 'Nurse', 'Student', 'Commuter'],
    barks: [
      'My phone says 8:14. The station board says tomorrow.',
      'Third clock this morning. I stopped checking.',
      'They closed the pharmacy. The clock in the window was going the wrong way.',
      'Helix people, probably. Everything odd in this city is Helix people.',
      'The 41 is late. Then it was early. Then it was late again.',
      'Is it raining harder, or is it the same rain for longer?',
    ],
  },
  helix: {
    names: ['Researcher', 'Technician', 'Guard', 'Cleaner', 'Contractor'],
    barks: ['Lockdown. Stay where the lights are.', 'The chamber readings were fine at six. At six-oh-one there were no readings.', 'Rook said system failure. Twice. People only say it twice when it isn\'t.', 'Did you hear it? Everyone heard it. Nobody heard the same thing.'],
  },
  settlement: {
    names: ['Water keeper', 'Craftsperson', 'Child', 'Elder', 'Sentry', 'Storyteller'],
    barks: ['You wear no dust, but the old story knows your face.', 'The water goes where it is told. We only ask politely.', 'The sky changed last night. The elders will not say how.', 'We cook at the first fire. Everyone. Nobody eats alone here.'],
  },
  loop: {
    names: ['Evacuee', 'Responder', 'Soldier', 'Civilian', 'Medic'],
    barks: ['You did that already. No - you\'re about to do it. I hate that I know the difference.', 'Nine minutes. Then the sirens again. I have counted eleven times.', 'Go left at the clock. Last time you went right and it did not help.', 'If the city resets, do I?'],
  },
  future: {
    names: ['Scavenger', 'Warden', 'Gardener', 'Medic', 'Trader', 'Archivist', 'Engineer'],
    barks: ['The channel is running again. Nobody alive remembers who opened it.', 'Don\'t stand under the tower. It falls on Tuesdays.', 'We trade for batteries. We give water away. That was decided before I was born.', 'The memorial has your face. Please don\'t make me say it twice.'],
  },
  liminal: {
    names: ['Echo', 'A memory', 'A pattern'],
    barks: ['Don\'t follow the footsteps. Follow what they refuse to step on.', 'This door was in the observatory. It is here now. It is still there.', 'Which version of the question are you asking?'],
  },
};

// --- the four quest chains (sample dialogue verbatim) -----------------------------------
// Quest chain A: Last Train Home (Jun Park, Rain City)
export const JUN_HOOK = [
  { who: 'JUN', text: 'The train keeps arriving. Nobody gets on. Nobody gets off. But I can hear them in the next carriage.' },
  { who: 'KAI', text: 'They are not here now.' },
  { who: 'JUN', text: 'Then why do I keep apologizing to them?' },
];
// Quest chain B: The Water That Remembers (Tala and Niko)
export const WATER_HOOK = [
  { who: 'TALA', text: 'You ask where the river began. We ask who taught it to stay.' },
  { who: 'KAI', text: 'A river cannot remember.' },
  { who: 'NIKO', text: 'Then you have not listened long enough.' },
];
// Quest chain C: Two Records, One Disaster (Mara Quill)
export const MARA_HOOK = [
  { who: 'MARA', text: 'A clean history is usually a history someone has cleaned.' },
  { who: 'KAI', text: 'Which record is true?' },
  { who: 'MARA', text: 'Start with the question: true for whom?' },
];
// Quest chain D: The Technician's Key (Iven Marr)
export const IVEN_HOOK = [
  { who: 'IVEN', text: 'Maintenance route\'s behind the conduit. The lock resets every time the building changes its mind about what year it is.' },
  { who: 'KAI', text: 'Changes its mind how?' },
  { who: 'IVEN', text: 'You\'ll see. Everyone sees. Nobody signs for it.' },
];

// a choice: { intent, label, lines?, set?, trust?, know?, ev?, quest? }
export const intent = (intent, label, o = {}) => ({ intent, label, ...o });

// Generic conversations, used when a mission does not give an NPC its own.
export const DIALOGUE = {
  rook: [
    {
      when: '!ev_rook_log', lines: [{ who: 'ROOK', text: 'Kai. The chamber is a system failure, and the chamber is off limits. Both of those are true at the same time.' }],
      choices: [
        intent('challenge', 'Systems don\'t say my name.', { lines: [{ who: 'ROOK', text: 'No. People do, through speakers, when they have access they should not have. That is a security matter.' }], know: 1, trust: -1 }),
        intent('investigate', 'What was in the chamber before Helix?', { lines: [{ who: 'ROOK', text: 'A hole in the ground. Then a project. Then a budget. There is nothing before Helix, Kai.' }], ev: 'rook_evasion' }),
        intent('comfort', 'You look like you haven\'t slept.', { lines: [{ who: 'ROOK', text: 'I have not. Go and do your job. Mine is to keep this building standing.' }], trust: 1 }),
        intent('withdraw', 'Later.'),
      ],
    },
    { when: 'ev_rook_log', lines: [{ who: 'ROOK', text: 'You have the log. Then you know I did not approve the test. You also know I did not stop it.' }] },
  ],
  mira: [
    { when: 'true', lines: [{ who: 'MIRA', text: 'I remember being your sister.' }, { who: 'KAI', text: 'That\'s not the same thing.' }, { who: 'MIRA', text: 'Would it be enough if I said it was?' }] },
  ],
  sera: [
    {
      when: 'faction != "continuum"', lines: [{ who: 'SERA', text: 'In my time, your face is on every memorial.' }, { who: 'KAI', text: 'For saving the world?' }, { who: 'SERA', text: 'For ending it.' }],
      choices: [
        intent('challenge', 'I haven\'t done anything yet.', { lines: [{ who: 'SERA', text: 'Every version of you says that. I am told it is the first thing you say.' }], know: 2 }),
        intent('investigate', 'What does the record actually say?', { lines: [{ who: 'SERA', text: 'That a man named Varen activated a machine, and then the sky learned to disagree with itself. The record is short. We did not have paper for long.' }], ev: 'memorial', trust: 1 }),
        intent('comfort', 'I\'m sorry for whatever I did.', { lines: [{ who: 'SERA', text: 'Don\'t apologise to me. Apologise to the channel, when you reach it. It is the only thing here that answers.' }], trust: 1 }),
        intent('withdraw', 'I need to keep moving.'),
      ],
    },
    { when: 'faction == "continuum"', lines: [{ who: 'SERA', text: 'You chose the stabilizer. The district is quiet now. Quiet is not the same as alive, but I will take it.' }] },
  ],
  niko: [
    {
      when: 'true', lines: [{ who: 'NIKO', text: 'You keep changing the world.' }, { who: 'KAI', text: 'I\'m trying to get home.' }, { who: 'NIKO', text: 'Then stop changing it.' }],
      choices: [
        intent('investigate', 'Who built the stone ring?', { lines: [{ who: 'NIKO', text: 'Nobody built it. It was here before the first fire. Helix did not invent the machine, Kai. It found it.' }], ev: 'found_not_built', know: 3 }),
        intent('challenge', 'You can\'t know my name.', { lines: [{ who: 'NIKO', text: 'The old story knows it. I only repeat the story. That is what a keeper is for.' }], trust: -1 }),
        intent('comfort', 'I\'ll be careful with it.', { lines: [{ who: 'NIKO', text: 'Be careful with the water first. The ring can wait. It has waited three thousand years.' }], trust: 1 }),
        intent('withdraw', 'Not now.'),
      ],
    },
  ],
  anja: [
    {
      when: 'true', lines: [{ who: 'ANJA', text: 'How many worlds has the Chronolith cost? That depends on whether you count the worlds that never finished becoming worlds.' }],
      choices: [
        intent('investigate', 'How does the lock work?', { lines: [{ who: 'ANJA', text: 'It holds the city at one day. Yesterday never arrives, so nothing has to be grieved. It is the kindest thing I have ever built, and I am not sure it is kind.' }], ev: 'anja_lock' }),
        intent('challenge', 'You froze a city.', { lines: [{ who: 'ANJA', text: 'I kept a city. Freezing would have been quicker.' }], trust: -1 }),
        intent('comfort', 'You did what you could.', { lines: [{ who: 'ANJA', text: 'I did what was possible. Those are different sentences. Thank you for the first one anyway.' }], trust: 1 }),
        intent('withdraw', 'I\'ll come back.'),
      ],
    },
  ],
  iven: [
    {
      when: '!quest_iven', lines: IVEN_HOOK,
      choices: [
        intent('investigate', 'Who signed for the test?', { lines: [{ who: 'IVEN', text: 'Rook\'s name is on the order. Mine is on the sheet that says no. Ask which one the building listened to.' }], ev: 'iven_testimony', quest: 'active' }),
        intent('comfort', 'I\'ll get your team out.', { lines: [{ who: 'IVEN', text: 'Three of them. Lower conduit. If the lift comes back, they come back.' }], trust: 1, quest: 'active' }),
        intent('challenge', 'You ran the test.', { lines: [{ who: 'IVEN', text: 'I ran the cables. The test ran itself. Those words are in my statement and I will say them to anyone.' }], trust: -1, quest: 'active' }),
        intent('withdraw', 'Later.'),
      ],
    },
    { when: 'quest_iven', lines: [{ who: 'IVEN', text: 'Locker code is my badge number backwards. Everything in this building is something backwards.' }] },
  ],
  jun: [
    { when: '!zero_second', lines: [{ who: 'JUN', text: 'Platform\'s closed past the yellow line. The board\'s wrong. The board\'s been wrong since six.' }, { who: 'KAI', text: 'Wrong how?' }, { who: 'JUN', text: 'Says the 41 arrives yesterday. I\'ve called it in twice.' }] },
    {
      when: 'zero_second && !quest_jun', lines: JUN_HOOK,
      choices: [
        intent('investigate', 'Which carriage?', { lines: [{ who: 'JUN', text: 'The one that isn\'t there. The maintenance gate behind me keeps locking itself back to how it was before. I can\'t get anyone out through it.' }], quest: 'active', ev: 'gate_resets' }),
        intent('comfort', 'You got everyone off the platform.', { lines: [{ who: 'JUN', text: 'Everyone I could see. That\'s the part I keep hearing.' }], trust: 1, quest: 'active' }),
        intent('challenge', 'There\'s nobody in the next carriage.', { lines: [{ who: 'JUN', text: 'Then stand here for forty-one seconds and tell me that again.' }], trust: -1, quest: 'active' }),
        intent('withdraw', 'I have to go in.'),
      ],
    },
    { when: 'quest_jun', lines: [{ who: 'JUN', text: 'Forty-one seconds. Count it with me if you don\'t believe me.' }] },
  ],
  tala: [
    {
      when: 'true', lines: WATER_HOOK,
      choices: [
        intent('investigate', 'Where are the gates?', { lines: [{ who: 'TALA', text: 'Three stones along the dry channel. Lift the right ones and the river remembers. Lift the wrong ones and the houses do.' }], quest: 'active', ev: 'water_gates' }),
        intent('comfort', 'I\'ll bring the water back.', { lines: [{ who: 'TALA', text: 'Bring it back gently. It was never ours.' }], trust: 1, quest: 'active' }),
        intent('withdraw', 'I\'ll listen longer.'),
      ],
    },
  ],
  mara: [
    {
      when: 'true', lines: MARA_HOOK,
      choices: [
        intent('investigate', 'Who was the first operator?', { lines: [{ who: 'MARA', text: 'One archive says Varen. One says Rook. The timestamps are both right. That is the interesting part.' }], quest: 'active', ev: 'dual_archive' }),
        intent('challenge', 'Somebody is lying.', { lines: [{ who: 'MARA', text: 'Somebody is always lying. That is not the same as the record being wrong.' }], trust: -1 }),
        intent('comfort', 'Thank you for keeping both.', { lines: [{ who: 'MARA', text: 'Keeping both is the job. Choosing is yours.' }], trust: 1 }),
        intent('withdraw', 'Later.'),
      ],
    },
  ],
  orren: [
    { when: 'true', lines: [{ who: 'ORREN', text: 'You are asking the room what time it is. Wrong question.' }, { who: 'KAI', text: 'What\'s the right one?' }, { who: 'ORREN', text: 'Which version of the question are you asking?' }] },
  ],
  child: [
    {
      when: 'true', lines: [{ who: 'CHILD', text: 'Do you know the song? It goes up and then it goes up again and then it stops.' }],
      choices: [
        intent('comfort', 'Hum it for me.', { lines: [{ who: 'NONE', text: 'Three notes. Up, up, and a stop. You know it. You have not heard it in twenty-three years.' }], ev: 'three_notes', trust: 1 }),
        intent('investigate', 'Where are your parents?', { lines: [{ who: 'CHILD', text: 'In the photo. All three of me are.' }], ev: 'three_photos' }),
        intent('withdraw', 'Stay where it\'s dry.'),
      ],
    },
  ],
  witness: [
    { when: 'true', lines: [{ who: 'WITNESS', text: 'You were trying to stop me from becoming you.' }, { who: 'KAI', text: 'I was trying to find a version of me that didn\'t have to.' }] },
  ],
  guard: [
    {
      when: '!checkpoint_passed', lines: [{ who: 'CREW', text: 'Helix? Badge.' }, { who: 'KAI', text: 'Varen. Temporal systems.' }, { who: 'CREW', text: 'Everyone\'s temporal something this morning.' }],
      choices: [
        intent('investigate', 'What\'s the line for?', { lines: [{ who: 'CREW', text: 'Clocks. Half the city\'s clocks say the wrong thing and everyone wants to blame a building. Go on through.' }], set: { checkpoint_passed: true }, know: 1 }),
        intent('challenge', 'I have a director waiting.', { lines: [{ who: 'CREW', text: 'Then he can wait with the rest of us. ...Go. Before I change my mind.' }], set: { checkpoint_passed: true }, trust: -1 }),
        intent('comfort', 'Long morning?', { lines: [{ who: 'CREW', text: 'Longest one yet. Go on through, Varen.' }], set: { checkpoint_passed: true }, trust: 1 }),
        intent('withdraw', 'I\'ll wait.'),
      ],
    },
    { when: 'checkpoint_passed', lines: [{ who: 'CREW', text: 'Staff gate\'s past the platform. Mind the line.' }] },
  ],
};
