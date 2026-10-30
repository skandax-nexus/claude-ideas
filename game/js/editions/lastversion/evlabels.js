// THE LAST VERSION OF EARTH: what the case board calls the evidence Kai has pinned (ev_<id>), for every clue the
// missions set that Runtime's own list (EV_LABELS: the Prologue's and the first acts' main clues) does not name.
// The board listed more than a hundred clues by their internal ids ("picto fire", "lin desk17"), and pinned them
// without a word (v2.1.1 playtest M13). Each is said as the board says the others: what Kai found, in a few words.
// Shown, never spoken. Runtime.evLabel reads both lists; tests/fix2-lv-runtime.test.mjs checks that every ev_ fact
// a mission sets is named.
export const EV_MORE = {
  // Act I: the village (Missions 4 and 5)
  picto_fire: 'A painted fire, people round it in a circle', picto_water: 'A painted wave, a hand turning it aside',
  picto_ring: 'A broken halo, a man who does not touch the ground: my mark', telling: 'The telling-stone: a village built for my return',
  frag_door: 'WHEN THE ONE WITH NO DUST RETURNS, SHOW HIM THE DOOR', frag_never: 'HE WILL SAY HE HAS NEVER BEEN HERE',
  frag_early: 'HE IS NOT LYING. HE IS EARLY. (the water steps)',
  tally: 'Tally marks by a door: THE RING TOOK THREE', names: 'A family\'s names in the wall, the last one half cut',
  hearths: 'Cold hearths, swept clean: they meant to be gone', mural: 'A mural: a man with no dust draws a machine that remembers',
  // Missions 6 to 8: the clockmaker, the observatory, Helix
  window_faces: 'Three clock faces: 2026, 2049, 2196', boards_now: 'Worn boards to the north wall, ending at brick',
  boards_then: 'In 2026 the path runs on, up a stair', ezra26: 'Ezra at sixty-five, in 2026, already waiting',
  tuesdays: 'The appointment book: twenty-seven years of Tuesdays', astro: 'A woman with no shadow asked them to cut my name',
  cache: 'The scavengers\' cache: my keys, the 08:04 receipt, a yellow button', star_early: 'The star rises when he stops being early',
  print_moved: 'The Site Zero print, moved to the atrium', photo_wall: 'The staff photo wall: no Kai Varen, Lin\'s frame empty',
  lin_desk17: 'Lin\'s desk: three arrows, a badge, a yellow raincoat', log_entries: 'The security log, 05:33 to 08:14',
  group_photo: 'The 2026 junior programme: Mira, me at twelve, young Rook',
  // Act II: Missions 9 to 13
  lin_interview: 'The Continuum\'s interview of Lin: no birth, no past', director_office: 'The Director\'s office: Rook\'s junior badge',
  flood_mark: 'The flood pole on the yard\'s roof', board_32: 'The ward board, 2049: a woman of thirty-two',
  board_9: 'The same frame, 2026: a girl of nine in yellow boots', tape_played: 'Mira\'s tape on the ward intercom',
  pane_roof: 'A child\'s handprint on the dome\'s glass', pane_gangway: 'The same handprint on a 2026 hoarding',
  bouquet: 'White chrysanthemums, the receipt for 08:04', camp_cot: 'His cot, made with hospital corners, as I make mine',
  camp_cup: 'His cup: coffee, black, the way I drink it', camp_wall: 'A wall of one child\'s handprints, from memory',
  witness_page: 'HE CHASES. HE ALWAYS CHASES.', block: 'The frozen block: Sera\'s mother, making tea for nine years',
  rollcall: 'The roll-call door, held open under the wall',
  // Act III: Missions 14 to 18
  stones3: 'Three stones on a drowned sidewalk: people passed', stones4: 'Four stones: the same hand, further on',
  stones0: 'A cairn kicked over: someone did not want to be followed', low_water: 'The warden\'s notice: cross at low water',
  last_board: 'The 41\'s board, repainted: 08:14, ON TIME', schoolbook: 'A schoolbook: THE FRACTURE AND THE MAN WHO MADE IT',
  rhyme: 'A children\'s rhyme about a man with no dust', beacon_voice: 'The beacon found a voice',
  register: 'The school register: VALE, T., ticked present', tomas: 'Tomas Vale, flickering at his desk',
  flood_line: 'Silt at chest height on the stand, painted over every morning', well_gauge: 'The well\'s last mark: FOURTEENTH. THE RIVER AGAIN.',
  blank_tomorrow: 'The board\'s flaps run backwards: never where to', unfinished: 'Seventeen finished worlds, a hundred unfinished',
  case_coat: 'A yellow raincoat, VERSION 17, the newest case', barge_coat: 'The barge\'s manifest: one child\'s raincoat, this morning',
  case_pass: 'A junior pass, VERSION 9: the same as mine', choice_cases: 'Three cases labelled for me: things I left behind',
  case41: 'A bicycle bell, VERSION 41, UNFINISHED', name_tomas: 'VALE, TOMAS. THE FOURTEENTH.', name_jun: 'PARK, JUN. LINE 41. LAST SEEN BOARDING.',
  name_carriage: 'Nineteen names: LINE 41, NEXT CARRIAGE, 08:13', array_paid: 'The array\'s plaque: what it was paid with',
  her88: 'Her side, world 88: "Say yes slower."', her102: 'Her side, world 102: a cellist, and he watched her hands',
  her117: 'Her side, world 117: "Bring me a door."', rec20: 'His recording at twenty: yellow flowers on her birthday',
  rec30: 'His recording at thirty: the system passed its first test', rec45: 'His recording at forty-five: the dish answers in her voice',
  recording_117: 'The shredded sheet: recording 117', recordings_matched: 'The recordings matched to the shelves',
  console: 'The console, rebuilt: its button at a grown man\'s chest', step_stool: 'A child\'s step stool, yellow paint on one corner',
  kiln: 'The potter\'s last pot: three notes painted round it',
  // Act IV: Missions 19 to 22
  mark_road: 'The clockmaker\'s mark, chalked on the road', mark_gallery: 'The mark again, on the gallery rail',
  mark_end: 'No mark: the road stops in the sky', ezra_mark: 'Under the mark on the arm: PAID ON A WEDNESDAY',
  pattern19: 'The observatory\'s pattern, in twelve stones', badge19: 'My badge in the glass: VAREN, K., not yet scratched',
  door_shadow: 'A blue door with a shadow', door_bare: 'A blue door with no shadow at all',
  fridge_drawing: 'Her drawing on the fridge, and a sun in a grown man\'s pen', yellow_boots: 'Yellow boots by the back door, muddy from the dig',
  night_badge: 'Their mother\'s badge: NIGHT SHIFT, left every morning', late41: 'The 41 is late, and nobody minds',
  memorial_nobody: 'A memorial FOR NOBODY IN PARTICULAR', mira_planting: 'Mira at thirty-two, humming a song that stops',
  no_owner_door: 'A house at the corner that belongs to nobody', adult_life: 'Through the window: a whole life, kept for one',
  song_argument: 'Up, up, and then down: I always stopped the song', mara_radio: 'Mara on the radio: she keeps both records',
  director_office21: 'The Director\'s chair, given to Rook', requisition: 'The Witness\'s requisition: a console, a stool, a child\'s chair',
  m21_console: 'A 2026 console bolted to the summit', m21_stool: 'The step stool again, its yellow corner painted by hand',
  m21_chair: 'A child\'s chair facing the ring', one_line: 'A hundred and seventeen timelines struck through but one',
  witness_plan: 'What the Witness is building',
  // the Finale (Mission 23)
  gallery: 'The people my choices changed', telling_line: 'The telling-stone\'s new line: HE CAME BACK',
  platform41: 'The 41 at the platform, doors open, ON TIME', rook_last: 'Rook on a borrowed radio: "I\'m sorry."',
  iven_signed: 'Iven Marr\'s statement, signed', memorial23: 'The memorial: AND HE CAME BACK',
  gal_scav: 'The scavenger child\'s lamp', gal_jun: 'Jun: they all got off', gal_listeners: 'The tower\'s listeners, out in time',
  gal_ezra: 'Ezra\'s Wednesdays', gal_prisoners: 'The twelve from the dam\'s loops', gal_keeper: 'The 41 came at 8:14, punched on time',
  gal_odile: 'Odile\'s shift finished: thirty-two went home', tala23: 'Tala: the river knows the way now',
  sera23: 'Sera: "You came back."', anja23: 'Anja: the lock holds, and now she remembers why',
};
