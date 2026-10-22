// THE LAST VERSION OF EARTH: the story's ledgers, for the whole campaign (OVERHAUL.md §9). Pure data.
//
//   QUESTIONS     the case board's THE QUESTIONS: each chapter's question (the bible's, and the sharper ones the
//                 story adds), the evidence pinned under it, and the missions that answer it. The board shows the
//                 clues found, never the answer, until the mission that pays it off is done.
//   CLUES         the clue ledger C1-C12: plant -> reinforce -> payoff, by mission. A plant in a mission that has
//                 been rewritten names the fact it sets or the words it shows, so a test can find it there; every
//                 plant comes before its payoff in campaign order (tested).
//   CONSEQUENCES  choice -> where it shows. Every fact a choice sets in a rewritten mission is read later or listed
//                 here for a later mission (tested). Nothing locks the player out.
//   CHOSEN        what the case board's WHAT YOU CHOSE says about a fact (shown, never spoken)
//   PREVIOUSLY    three lines per chapter, said by the narrator when a chapter starts or a save loads
//   EPILOGUE      the endings' last lines: one per fact the player set (Runtime's ending, voicelines.endingLines)
//
// Keep these true: every later edit to a mission updates them, and their tests fail loudly by design (§12 risk 14).

// the campaign's missions in order (the cases are outside it)
export const MISSION_ORDER = Array.from({ length: 23 }, (_, i) => `m${String(i + 1).padStart(2, '0')}`);
export const missionIndex = (m) => MISSION_ORDER.indexOf(m);

// --- the questions (§9.3) ------------------------------------------------------------------------------------
// clues: evidence keys (ev_<key>) pinned under the question; answer: the mission that pays it off (the board shows
// "ANSWERED" once that mission is done); partly: missions that answer part of it
export const QUESTIONS = [
  { id: 'q_card', chapter: 'prologue', text: 'Who used my card at 05:40, and whose is the voice?', partly: ['m06', 'm09', 'm12'], answer: 'm22',
    clues: ['card_0540', 'empty_corridor', 'florist', 'rook_log', 'junior_pass', 'raw_log', 'door_log'] },
  { id: 'q_prologue', chapter: 'prologue', bible: true, text: 'What happened, and why does the voice know Kai?', partly: ['m03'], answer: 'm12',
    clues: ['minute_814', 'stopped_clock', 'drawing'] },
  { id: 'q_predate', chapter: 'act1', bible: true, text: 'How can the machine predate its inventors?', answer: 'm08',
    clues: ['site_zero_print', 'site_zero', 'found_not_built', 'others_before', 'clock_question'] },
  { id: 'q_woman', chapter: 'act1', text: 'Who is the woman with Mira\'s face?', partly: ['m08'], answer: 'm11',
    clues: ['mira_photo', 'lin_peg', 'lin_badge', 'three_notes', 'three_photos'] },
  { id: 'q_witness', chapter: 'act2', bible: true, text: 'Is the Witness protecting Kai or controlling him?', partly: ['m13'], answer: 'm22',
    clues: ['witness_recording', 'version17', 'prisoners', 'stabilizer', 'admitted_by'] },
  { id: 'q_cost', chapter: 'act3', bible: true, text: 'What did the previous attempts cost?', partly: ['m15', 'm16'], answer: 'm17',
    clues: ['memorial', 'anja_lock', 'dual_archive', 'museum_his', 'two_logs', 'i_pressed'] },
  { id: 'q_saved', chapter: 'act4', bible: true, text: 'Can Mira be saved without repeating the catastrophe?', partly: ['m20'], answer: 'm22',
    clues: ['real_door', 'her_side', 'chain', 'second_early'] },
  { id: 'q_accept', chapter: 'finale', bible: true, text: 'What must be accepted rather than fixed?', answer: 'm23', clues: ['unwritten_record'] },
];

// --- the clue ledger (§9.4) ----------------------------------------------------------------------------------
// a step: { m, what, fact?, text? } (fact / text: what a rewritten mission must contain)
const S = (m, what, o = {}) => ({ m, what, ...o });
export const CLUES = [
  {
    id: 'C1', name: 'The voice is the Witness',
    plant: [S('m01', 'the card opened Chamber One at 05:40 while Kai slept; one voicemail, caller unknown', { fact: 'ev_card_0540', text: 'One voicemail. Received 05:40. Caller unknown.' }),
      S('m01', 'the florist: you already came in, older, with a scar', { fact: 'ev_florist', text: 'Grey at the temples, same coat, a scar on the wrist.' })],
    reinforce: [S('m01', 'the voice in every speaker is built on Kai\'s own voice'), S('m06', 'a recording in an older voice', { fact: 'ev_witness_recording' }), S('m09', '"You have nine minutes"', { text: 'You have nine minutes.' }), S('m14', 'fresh white chrysanthemums at the memorial')],
    payoff: [S('m12', 'the voicemail plays', { text: 'Received 05:40.' }), S('m22', 'the Witness at the PA microphone')],
  },
  {
    id: 'C2', name: 'The scar',
    plant: [S('m01', 'the carriage glass opens his wrist', { fact: 'wrist_cut' }), S('m03', 'the ring seals it into a circle with a broken halo', { fact: 'wrist_mark' })],
    reinforce: [S('m04', 'the Elder recognises it', { fact: 'elder_met', text: 'The broken halo.' }), S('m07', '"KAI" carved beside the circle', { text: 'KAI VAREN' })],
    payoff: [S('m12', 'the Witness\'s scar, thirty years older', { fact: 'm12_faced', text: 'thirty years older than yours' }), S('m21', 'the two wrists side by side')],
  },
  {
    id: 'C3', name: 'Lin is Mira',
    plant: [S('m01', 'the woman in the crowd, and the yellow raincoat she leaves', { fact: 'raincoat' }),
      S('m02', 'the empty, dripping LIN peg; PHOTO PENDING SINCE 2026; "nobody remembers hiring me"; up, up, down', { fact: 'ev_lin_badge', text: 'PHOTO PENDING SINCE 2026' })],
    reinforce: [S('m08', 'previous employer: HELIX JUNIOR PROGRAMME 2026; she is in the reconstruction; "Don\'t save me"', { fact: 'lin_gone', text: 'HELIX JUNIOR PROGRAMME 2026' })],
    payoff: [S('m11', 'the file photograph is Lin, under the name VAREN, M.', { fact: 'ward32_read', text: 'The photograph is Lin.' }), S('m17', 'the pattern'), S('m20', 'Mira herself')],
  },
  {
    id: 'C4', name: 'The ring was found',
    plant: [S('m02', 'the Site Zero print in the lobby', { fact: 'ev_site_zero_print', text: 'THE SITE ZERO PRINT' }),
      S('m03', 'the 2026 excavation office: found in a riverbed drained long before any record', { fact: 'ev_site_zero' })],
    reinforce: [S('m04', 'the card', { fact: 'ev_card_ancient' }), S('m05', 'Kai drains the riverbed himself; Niko\'s line', { fact: 'machine_found' })],
    payoff: [S('m08', 'Rook\'s log ("boot prints in the clay") and Kai\'s boot beside the case', { fact: 'ev_boot_mine', text: 'There were boot prints in the clay.' }), S('m22', 'the chain')],
  },
  {
    id: 'C5', name: 'The version count',
    plant: [S('m08', 'VERSION 17', { fact: 'version_17', text: 'TIMELINE: VERSION 17. PRIOR VERSIONS: NO SURVIVING RECORD.' })],
    reinforce: [S('m15', '"worlds that never finished becoming worlds"'), S('m16', 'seventeen halls and a hundred UNFINISHED')],
    payoff: [S('m17', 'RECORDING 117 OF 117'), S('m22', '117 attempts'), S('m23', 'the post-credit 118')],
  },
  {
    id: 'C6', name: 'The three notes',
    plant: [S('m01', 'the Child sings up, up, stop (Kai\'s way)', { fact: 'ev_three_notes' }),
      S('m02', 'Lin hums up, up, down (Mira\'s way)', { text: 'up, up, down' })],
    reinforce: [S('m06', 'the clockmaker\'s chime', { fact: 'clock_set', text: 'up, up, and a stop' }), S('m09', 'the transmitter\'s carrier', { fact: 'transmitter_cut', text: 'three notes' }), S('m11', 'the music box', { text: 'music box' }), S('m12', 'the Witness whistles it slowly', { text: 'whistles' })],
    payoff: [S('m20', 'the argument; the Child and Mira sing "and then down"'), S('m23', 'Ending C: Mira hums it')],
  },
  {
    id: 'C7', name: 'Rook\'s secret',
    plant: [S('m01', 'the newspaper: WE STUDY CLOCKS, NOT MIRACLES', { text: 'WE STUDY CLOCKS, NOT MIRACLES' }),
      S('m02', 'the 05:40 test moved by the director\'s office; "There is nothing before Helix"', { text: 'There is nothing before Helix' })],
    reinforce: [S('m03', 'the excavation log and the E.R. thermos', { fact: 'ev_site_zero' }), S('m06', 'Ezra repaired his gauge', { fact: 'ev_rook_gauge', text: 'A Dr. Rook. Very polite. Very frightened.' }), S('m07', '"I asked Dr. Rook and he went white"', { text: 'I asked Dr. Rook and he went white.' })],
    payoff: [S('m08', 'the confrontation', { fact: 'rook_fate', text: 'By me. Write it down.' })],
  },
  {
    id: 'C8', name: 'The ninth minute',
    plant: [S('m06', '"do not let him see the ninth minute" (the clockmaker calls Kai "child")', { text: 'do not let him see the ninth minute' })],
    reinforce: [S('m08', 'at the ninth minute a man turns the ring', { fact: 'ev_ninth_minute', text: 'At the ninth minute a man turns the ring.' })],
    payoff: [S('m09', 'Kai sees the man at the console', { fact: 'ev_ninth_view', text: 'That\'s the ninth minute.' }), S('m12', 'the man behind the glass', { fact: 'm12_faced' }), S('m22', 'the second')],
  },
  {
    id: 'C9', name: 'Missing shadows',
    plant: [S('m01', 'the Child in the Station has no shadow', { text: 'no shadow' }), S('m02', 'Lin has no shadow under the emergency light', { text: 'no shadow' })],
    reinforce: [S('m12', 'the Witness, while he stands in 2026'), S('m18', 'Mira\'s hologram')],
    payoff: [S('m19', 'the real door has no shadow')],
  },
  {
    id: 'C10', name: 'Early',
    plant: [S('m04', '"HE IS NOT LYING. HE IS EARLY."', { fact: 'ev_frag_early', text: 'HE IS NOT LYING. HE IS EARLY.' }), S('m06', '"You\'re early."', { text: 'You\'re early.' })],
    reinforce: [S('m09', 'the Witness: "You are early. You are always early."', { text: 'You are early. You are always early.' }), S('m11', '"She\'s early."', { text: 'She\'s early.' })],
    payoff: [S('m22', '"I was a second early."'), S('m23', '"For once, you are on time."')],
  },
  {
    id: 'C11', name: 'The credentials',
    plant: [S('m01', 'Pryce: badged into Chamber One at 05:40', { fact: 'ev_card_0540', text: 'Says here you badged into Chamber One at 05:40.' })],
    reinforce: [S('m02', '"Then someone has been using your credentials." / "I was twelve."; the junior pass stamped OVERRIDE 16:02', { fact: 'ev_junior_pass', text: 'Then someone has been using your credentials.' }),
      S('m08', 'Iven: "a second late"', { fact: 'ev_second_late', text: 'A second late.' }), S('m16', 'memory three: nobody at the console'), S('m17', 'two logs, not yet read')],
    payoff: [S('m22', 'the deduction')],
  },
  {
    id: 'C12', name: 'The river',
    plant: [S('m05', 'Kai diverts it', { fact: 'river_diverted' })],
    reinforce: [S('m08', 'Helix rebuilt round the river court', { fact: 'ev_river_court' }), S('m15', 'the fourteenth\'s flood'), S('m18', 'the flooded highway is that river')],
    payoff: [S('m22', '"every cause was you"')],
  },
];

// --- the consequence ledger (§9.7) ---------------------------------------------------------------------------
export const CONSEQUENCES = [
  { facts: ['jun_line', 'jun_evidence'], set: 'm01', shown: ['m02', 'm15', 'm23'], what: 'Jun\'s relay: the line or the evidence. With the evidence, Kai can put Rook\'s own order to him.' },
  { facts: ['quest_jun'], set: 'm01', shown: ['m15', 'm23'], what: 'Last Train Home' },
  { facts: ['trust_guard'], set: 'm01', shown: ['m08'], what: 'Officer Pryce opens the staff door, or Kai climbs the river wall' },
  { facts: ['case_c_child'], set: 'm01', shown: ['m09', 'm11', 'm20'], what: 'The Child in Three Photographs' },
  { facts: ['officer_trusted'], set: 'm02', shown: ['m08', 'm10'], what: 'Dale on the door; Dale among the prisoners' },
  { facts: ['trust_rook'], set: 'm02', shown: ['m08'], what: 'the first line of the confrontation' },
  { facts: ['iven_team_saved', 'ev_raw_log', 'quest_iven'], set: 'm03', shown: ['m08', 'm18', 'm21'], what: 'Iven in person or as a record; the Last Signal; an ally either way' },
  { facts: ['niko_told'], set: 'm04', shown: ['m05', 'm14', 'm22'], what: 'the mural, the rhyme, the chain wall' },
  { facts: ['machine_buried'], set: 'm05', shown: ['m08', 'm22'], what: 'Rook\'s log wording' },
  { facts: ['water_route'], set: 'm05', shown: ['m07', 'm14', 'm18', 'm23'], what: 'Niko\'s clue, the channel, the shortcut, Tala' },
  { facts: ['ezra_debt'], set: 'm06', shown: ['m16', 'm19', 'm23'], what: 'the case, his mark, the epilogue' },
  { facts: ['mira_tape'], set: 'm07', shown: ['m11', 'm16', 'm21'], what: 'Odile; the case; the Witness hesitates' },
  { facts: ['rook_fate'], set: 'm08', shown: ['m10', 'm12', 'm21', 'm23'], what: 'the Director; Corridor B; the office; the transmission' },
  { facts: ['warned_evacuees'], set: 'm09', shown: ['m13', 'm21'], what: 'a safe route; the kitchen door' },
  { facts: ['prisoners_freed', 'prisoners_held'], set: 'm10', shown: ['m13', 'm21'], what: 'eleven more Unwritten, the field orders; the cells' },
  { facts: ['odile_released'], set: 'm11', shown: ['m16', 'm23'], what: 'the watch case; she waves' },
  { facts: ['faction', 'stabilizer_destroyed', 'civilians_freed'], set: 'm13', shown: ['m13', 'm18', 'm21', 'm23'], what: 'the district at once; the pylons; the allies' },
  { facts: ['trust_sera'], set: 'm14', shown: ['m18', 'm23'], what: 'her line; AND HE CAME BACK' },
  { facts: ['garden_restored'], set: 'm14', shown: ['m18', 'm23'], what: 'shelter; Sera\'s garden' },
  { facts: ['city_freed', 'city_stabilized'], set: 'm15', shown: ['m18', 'm21', 'm23'], what: 'helpers, or a lock corridor; a line' },
  { facts: ['photo_taken'], set: 'm16', shown: ['m21', 'm23'], what: 'hesitation; the table in Ending C' },
  { facts: ['letter'], set: 'm17', shown: ['m21', 'm23'], what: 'delivered, or asked' },
  { facts: ['last_signal'], set: 'm18', shown: ['m21'], what: 'Iven an ally regardless' },
  { facts: ['m20_lead'], set: 'm19', shown: ['m20'], what: 'who leads' },
  { facts: ['ally'], set: 'm21', shown: ['m21'], what: 'who arrives' },
  { facts: ['ending'], set: 'm23', shown: ['m23'], what: 'the epilogue, one line per fact set' },
];

// what the case board's WHAT YOU CHOSE says (shown, never spoken): fact -> text, or { value: text }
export const CHOSEN = {
  jun_line: 'Jun\'s relay ran the line. His passengers got off the 41.',
  jun_evidence: 'Jun\'s relay fed the evidence terminal: Rook\'s order, before the Zero Second.',
  trust_guard: { 1: 'Officer Pryce let you through on a long morning.', 0: 'Officer Pryce let you through.', '-1': 'Officer Pryce let you through, and remembered your tone.' },
  officer_trusted: 'You trusted Officer Dale\'s recording.',
  trust_rook: { 1: 'At the chamber door you asked Rook what happened.', 0: 'At the chamber door you asked Rook who used your card.', '-1': 'At the chamber door you put the 05:40 test to Rook.' },
  iven_team_saved: 'You opened the conduit for Iven\'s team.',
  ev_raw_log: 'You kept the raw experiment log. Iven\'s team waited.',
  faction: { continuum: 'You redirected the stabilizer: the Continuum.', unwritten: 'You destroyed the stabilizer: the Unwritten.', neutral: 'No side yet.' },
  ally: 'Your ally at the Spire.',
  ending: 'The ending you chose.',
  prisoners_freed: 'You freed the prisoners.',
  city_freed: 'You let the city\'s tomorrow come.',
  city_stabilized: 'You kept the city at one day.',
};

// --- PREVIOUSLY (§9.8): what the narrator says when a chapter starts or a save loads -------------------------------
export const PREVIOUSLY = {
  prologue: ['Rain City, 2049.', 'Kai Varen builds machines for Helix Temporal Research.', 'This morning, the city\'s clocks have started to disagree.'],
  act1: ['Kai Varen built a machine he was told not to build.', 'The ring under Helix knew his name.', 'He fell.'],
  act2: ['A village three thousand years old knew his face.', 'In a Helix that should not exist, a screen said VERSION 17.', 'Someone older keeps leaving him instructions.'],
  act3: ['For nine minutes the war repeated, and Kai learned to hold things backwards.', 'The man behind the glass had his face, thirty years older.', 'The next door opened onto the future.'],
  act4: ['In the future, Kai\'s name is on a memorial.', 'A museum keeps every attempt at one world.', 'In the archive, he heard himself confess.'],
  finale: ['Outside time, Mira walked through a blue door alone.', 'She told him whose idea it was.', 'At the first second, the logs said who was early.'],
  cases: ['The stories the main road walked past.', 'Each one waits in its own place.', 'Some of them are still open.'],
  // a load inside a mission its chapter's recap has fallen behind (the Prologue's starts before the crash): its own
  m02: ['At 8:14 the 41 came into Line 41 at full speed.', 'Every speaker in the station said his name: Do not build the machine.', 'Tonight Helix has gone dark, and Kai Varen is inside it.'],
  m03: ['Helix went dark, and under it waited the ring Mira drew.', 'Kai touched it, and it let him in.', 'Now the building has three dates, and it is trying all of them.'],
};

// --- EPILOGUE (§5 M23): one line per fact the player set, after an ending's quote ------------------------------------
export const EPILOGUE = [
  { when: 'jun_line', who: 'JUN', text: 'They all got off. I stopped apologizing.' },
  { when: 'trust_guard >= 1', who: 'CREW', name: 'OFFICER PRYCE', color: '#4f6170', voice: { id: 'PRYCE' }, text: 'I still check every badge. The tired ones, I wave through.' },
  { when: 'officer_trusted', who: 'CREW', name: 'OFFICER DALE', color: '#4f6170', voice: { id: 'DALE' }, text: 'They kept my recording. Somebody finally asked to hear it.' },
  { when: 'iven_team_saved', who: 'IVEN', text: 'My team came up out of the conduit. All three of them. I kept the hatch key.' },
  { when: 'water_route', who: 'CREW', name: 'THE GARDENER', color: '#4f6170', voice: { id: 'GARDENER' }, text: 'The channel is running again. Nobody alive remembers who opened it.' },
  { when: 'ezra_debt == "release"', who: 'CREW', name: 'EZRA MOLL', color: '#8a6a3a', voice: { id: 'CLOCKMAKER' }, text: 'Wednesday. Imagine that.' },
  { when: 'city_freed', who: 'ANJA', text: 'We planted things.' },
  // (Rook testifies only where Kai exposed him; Iven's raw log is what the court read)
  { when: 'ev_raw_log && rook_fate == "expose"', who: 'IVEN', text: 'Elias Rook testified for nine days. The log said I refused to sign, forty-one times.' },
  { when: '!ev_raw_log && rook_fate == "expose"', who: 'NONE', text: 'Elias Rook testified for nine days. He signed every page.' },
  { when: 'rook_fate == "persuade"', who: 'ROOK', text: 'I kept her drawing on my desk for twenty-three years. This morning I gave it back.' },
  // Acts III and IV (U8)
  { when: 'ezra_debt == "finish"', who: 'CREW', name: 'EZRA MOLL', color: '#8a6a3a', voice: { id: 'CLOCKMAKER' }, text: 'The clock keeps its own time. So do I.' },
  { when: 'odile_released', who: 'CREW', name: 'NURSE ODILE', color: '#7aa6c8', voice: { id: 'ODILE' }, text: 'My shift finished. Thirty-two went home.' },
  { when: 'warned_evacuees', who: 'CREW', name: 'ONE WHO LISTENED', color: '#4f6170', voice: { id: 'CROWD_F2' }, text: 'You said get out of the tower. We did. We never said thank you.' },
  { when: 'prisoners_freed || m21_cells', who: 'NONE', text: 'Twelve people walked out of the dam\'s loops. They meet once a year, and nobody can say why.' },
  { when: 'garden_restored', who: 'SERA', text: 'The garden has water. The children named the channel after nobody.' },
  { when: 'trust_sera == "accept"', who: 'SERA', text: 'I cut it into the memorial myself. AND HE CAME BACK.' },
  { when: 'city_stabilized', who: 'ANJA', text: 'The lock holds. I check it at noon, and now I remember why.' },
  { when: 'last_signal', who: 'IVEN', text: 'I came out of the pocket. Some nights I still hear it folding.' },
  { when: 'photo_taken', who: 'NONE', text: 'A photograph lies on a kitchen table in Rain City. Nobody remembers taking it.' },
  { when: 'letter == "delivered"', who: 'NONE', text: 'A letter, opened at last, in the pocket of a coat nobody claims.' },
  { when: 'ev_no_owner && ending == "C"', who: 'MIRA', text: 'There\'s a letter in my desk to a brother I never had. I keep meaning to send it.' },
];
