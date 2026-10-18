// HALCYON: the middle of the prologue. Station Zero is the basement of a
// city-sized arcology. Varga's last recording sends Ren up through it - four
// open districts, each a different kind of film - to the Signal Tower, and
// back down to Station Zero with the truth.
//
// Same shape as a generated vessel story (gen/StoryGen.js), so the vessel's
// runtime plays it: decks are zones, beats are the authored scenes of each
// sector, cast are the people Ren meets. Maps come from gen/ZoneGen.js.

export const ZONE_SECTORS = 3;

const cast = [
  { id: 'kade', first: 'Kade', name: 'Kade Mori', role: 'Sign Fixer', pronoun: { their: 'his', them: 'him' }, color: '#c4566a', alive: true, seed: 4021 },
  { id: 'osei', first: 'Abena', name: 'Abena Osei', role: 'Reactor Chief', pronoun: { their: 'her', them: 'her' }, color: '#c0762a', alive: false, seed: 977 },
  { id: 'theo', first: 'Theo', name: 'Theo Lark', role: 'Botanist', pronoun: { their: 'their', them: 'them' }, color: '#2f8a5a', alive: true, seed: 3160 },
  { id: 'varga', first: 'Ilse', name: 'Dr. Ilse Varga', role: 'Director', pronoun: { their: 'her', them: 'her' }, color: '#6c5bc4', alive: false, seed: 5512, voice: 'VARGA' },
];

const crew = (id) => cast.findIndex((c) => c.id === id);
const said = (id, lines) => lines.map((text) => ({ who: cast[crew(id)].voice || 'CREW', name: cast[crew(id)].name.toUpperCase(), color: cast[crew(id)].color, text }));

export const ZONES = [
  {
    key: 'neon', name: 'NEON MERIDIAN', title: 'The City Under Glass', theme: 'city', feature: 'gravity', crew: crew('kade'),
    subtitle: 'A city that never turns its lights off, under a sky made of glass',
    palette: { fog: 0x161b26, wall: '#3b3e46', floor: '#24272e', accent: 0xff4fa8, accent2: 0x3fe0ff, light: 0xffd2a0, tint: 0x3a3f6e, night: 1, weather: 'rain', sky: 'night', grade: { shadowTint: 0x1c3a72, highlightTint: 0xffb6dc, toning: 0.22, contrast: 1.12, saturation: 1.12 } },
    rooms: ['MERIDIAN SQUARE', 'RAIN ALLEY', 'NOODLE ROW', 'THE OVERPASS', 'GLASS MARKET', 'NIGHT STATION'],
    motto: 'HALCYON NEVER SLEEPS',
    intro: [
      { who: 'JUNO', text: 'Ren, that hatch goes up. All the way up. There is a whole city on top of Station Zero.' },
      { who: 'JUNO', text: 'They called it Halcyon. One glass sky, a million lights, and nobody left to switch them off.' },
      { who: 'TICK', text: 'DRONES. TWO. THEY LOOK AT FLOORS. WE SHOULD NOT BE A FLOOR.' },
    ],
    beats: [
      {
        kind: 'arrival', goal: 'Find Varga\'s recorder in the square.',
        log: { title: 'VARGA - FIELD RECORDER 1', who: 'VARGA', text: 'If you are hearing this, you came up the long way. Good. The Observer cannot see past its own floors, so stay high when you can. I am going to the Signal Tower. Follow the pink lights.' },
        tick: 'THE RECORDER IS ON A ROOF. ROOFS ARE CEILINGS FOR THE SKY. FLIP THE CITY.',
        junoAfter: 'Stay high. Roofs, overpasses, the glass itself if you have to. I can steer you.',
      },
      {
        kind: 'contradiction', goal: 'Read the wanted screen. Then read it in ECHO.',
        log: 'The screen says the city hunted me. The echo says it hunted Varga. Someone rewrote who the villain was.',
        official: 'WANTED: SUBJECT ZERO - FOR THE ZERO EVENT - DO NOT APPROACH',
        echo: 'WANTED: ILSE VARGA - FOR TRYING TO STOP IT',
        clue: 'cleared', crew: crew('varga'), toast: 'RECORD CORRECTED',
        tick: 'THE SCREEN HAS A MEMORY. MEMORIES TELL THE TRUTH MORE OFTEN. NOT ALWAYS.',
        junoAfter: 'They put your face on every screen in the city. Somebody wanted you to be the reason.',
      },
      {
        kind: 'encounter', goal: 'Find whoever keeps the signs lit.',
        lines: said('kade', [
          'Hey - hey! Don\'t run. Nobody runs on my street. You\'ll scare the signs.',
          'Kade. I fix the neon. Eighteen years, every night, and not one customer. Feels honest work, though.',
          'The woman with the grey coat? Varga. She came through crying and laughing at the same time. Took the old service lift to the reactor.',
          'Told me if a kid with a glowing thing in their hand comes by, I should say: the lights are a map. I never knew what that meant.',
        ]),
        junoAfter: 'The lights are a map. Ren, the pink ones run north, toward the reactor stack.',
      },
    ],
  },
  {
    key: 'reactor', name: 'THE DROWNED REACTOR', title: 'Where the Water Came In', theme: 'reactor', feature: 'echo', crew: crew('osei'),
    subtitle: 'Halcyon\'s heart flooded the night the cycle began',
    palette: { fog: 0x0f2a2e, wall: '#33484a', floor: '#2b3a3c', accent: 0xff8a3d, accent2: 0x4ff0d2, light: 0xffb27a, tint: 0x1d4a48, night: 0.85, weather: 'steam', sky: 'plant', grade: { shadowTint: 0x0c4a48, highlightTint: 0xffb47a, toning: 0.24, contrast: 1.14, saturation: 1.0 } },
    rooms: ['TURBINE FLOOR', 'COOLANT GALLERY', 'THE SUMP', 'PUMP ROW', 'CONTROL DECK', 'THE CORE WELL'],
    motto: 'PRESSURE IS A PROMISE',
    intro: [
      { who: 'JUNO', text: 'The reactor. It is flooded, Ren. Halls full of black water and the lights are still on underneath.' },
      { who: 'JUNO', text: 'Varga came through here. Whatever she did, the water came in after her.' },
      { who: 'TICK', text: 'THE WATER IS VERY DEEP AND I AM VERY SMALL. BRIDGES PLEASE.' },
    ],
    beats: [
      {
        kind: 'arrival', goal: 'Find the reactor\'s last shift log.',
        log: { title: 'REACTOR SHIFT LOG - 03:04', text: 'Chief Osei on shift. Pressure is climbing for no reason I can find. Someone is in the control deck rewriting the core\'s first law. The doors will not open for me. They open for her.' },
        tick: 'THE WATER REMEMBERS THE OLD WALKWAYS. ECHO SHOWS THEM. A LAW CAN STAND ON THEM.',
        junoAfter: 'Her. Osei saw someone rewriting the core. Varga, or someone with Varga\'s keys.',
      },
      {
        kind: 'log', goal: 'Find Varga\'s note in the pump hall.',
        log: { title: 'VARGA - NOTE ON A PUMP', who: 'VARGA', text: 'I opened the flood valves myself. It was the only way to slow the core down. Osei, I am sorry. Ren, if you read this: the water bought us eighteen years. Do not waste them.' },
        junoAfter: 'Eighteen years. That number again. Recording 0 was eighteen years before you were born.',
      },
      {
        kind: 'encounter', goal: 'Find Chief Osei.',
        lines: said('osei', [
          'Pressure at nine-forty and climbing. Seal the lower gallery. Seal it!',
          'Who is that? You are not on my shift. Nobody is on my shift anymore.',
          'The doors said VARGA. I took it for the Director. I never saw a face.',
          'She opened the valves. She saved the city and drowned my reactor in the same breath. I would have done the same.',
          'Hale. Where is Hale? Somebody get Hale out of the lower gallery!',
          'Go up the core well. The forest is above us. She went to the cabin. She always went to the cabin.',
        ]),
        junoAfter: 'That was Osei. My chief. She has been calling for me in an empty room for eighteen years.',
      },
    ],
  },
  {
    key: 'forest', name: 'THE GLASS FOREST', title: 'The Garden That Kept Growing', theme: 'forest', feature: 'zerog', crew: crew('theo'),
    subtitle: 'A forest under a dome, still glowing, still growing, still waiting',
    palette: { fog: 0x14302a, wall: '#3c5a4c', floor: '#2d4436', accent: 0x9dff7a, accent2: 0xffd36a, light: 0xd8ffb0, tint: 0x2a5a44, night: 0.75, weather: 'fireflies', sky: 'dusk', grade: { shadowTint: 0x1a4a34, highlightTint: 0xfff0b8, toning: 0.2, contrast: 1.08, saturation: 1.1 } },
    rooms: ['THE CANOPY', 'GLOWROOT HOLLOW', 'THE STILL POND', 'FERN STAIR', 'THE CABIN ROAD', 'SEED CHAPEL'],
    motto: 'EVERYTHING HERE WAS PLANTED TO OUTLIVE US',
    intro: [
      { who: 'JUNO', text: 'Oh. Ren. Look up. Trees. Real ones. They glow.' },
      { who: 'JUNO', text: 'The cabin Osei talked about is somewhere in there. Go slow. Forests listen.' },
      { who: 'TICK', text: 'SOME OF THE TREES ARE MEMORIES OF TREES. DO NOT LEAN ON THOSE.' },
    ],
    beats: [
      {
        kind: 'arrival', goal: 'Find the gardener\'s log in the canopy.',
        log: { title: 'GARDEN LOG - DAY 6570', text: 'Theo again. The glow-roots are spreading toward the cabin. Dr. Varga still has not come back. I water her plants anyway. Somebody should be here when she does.' },
        tick: 'THE LOG IS IN THE CANOPY. TREES DO NOT HAVE STAIRS. GRAVITY IS OPTIONAL HERE.',
        junoAfter: 'Theo. Someone is still alive up here. Find them.',
      },
      {
        kind: 'contradiction', goal: 'Read the memorial. Then read it in ECHO.',
        log: 'The memorial says Halcyon\'s people died. The echo says they are asleep. Varga did not kill this city. She put it to sleep.',
        official: 'IN MEMORY OF THE PEOPLE OF HALCYON - LOST IN THE ZERO EVENT',
        echo: 'THEY ARE NOT LOST - THEY ARE ASLEEP - WAKE THEM WHEN IT IS SAFE',
        clue: 'cleared', crew: crew('varga'), toast: 'RECORD CORRECTED',
        tick: 'STONE REMEMBERS WHAT IT WAS ASKED TO SAY. ECHO REMEMBERS WHAT IT MEANT.',
        junoAfter: 'Asleep. A whole city, asleep. Ren, that is what the machine is for.',
      },
      {
        kind: 'encounter', goal: 'Find the cabin and whoever keeps it.',
        lines: said('theo', [
          'Stop there. Hands where the roots can see them. ...Oh. Oh, it is you. You are smaller than she said.',
          'Theo. I keep the garden. I kept it for her, and then I kept it because it was the only thing that kept me.',
          'You were her student, you know. Before. You helped her build the machine. Then you asked her to make you forget.',
          'She is at the top of the Signal Tower. Or what is left of her is. Take the canopy road. Do not look down. The forest is very tall and you are very much not.',
        ]),
        junoAfter: 'Her student. Ren, you built the machine. That is why it knows your face.',
      },
    ],
  },
  {
    key: 'tower', name: 'THE SIGNAL TOWER', title: 'Last Light', theme: 'tower', feature: 'sentinel', crew: crew('varga'),
    subtitle: 'The tallest thing in Halcyon, and the Observer knows you are coming',
    palette: { fog: 0x1e1a1e, wall: '#45403f', floor: '#2c2a2b', accent: 0xff4a4a, accent2: 0xffc06a, light: 0xffa0a0, tint: 0x5a2a34, night: 0.9, weather: 'storm', sky: 'night', grade: { shadowTint: 0x3a1830, highlightTint: 0xffb0a0, toning: 0.24, contrast: 1.16, saturation: 1.04 } },
    rooms: ['STORM DECK', 'THE SPIRE STAIR', 'ANTENNA FIELD', 'THE RELAY', 'LAST LANDING', 'THE BEACON'],
    motto: 'SAY IT ONCE AND THE WHOLE SKY HEARS',
    intro: [
      { who: 'JUNO', text: 'The tower. Storm on the glass, red lights everywhere. And Ren - the Observer\'s eyes are up here. Its drones got here first.' },
      { who: 'OBSERVER', text: 'They have been waiting at the top of the world. They know the way you climb.' },
      { who: 'TICK', text: 'IT WATCHES FLOORS. YOU KNOW WHAT TO DO. PROBABLY.' },
    ],
    beats: [
      {
        kind: 'arrival', goal: 'Find Varga\'s relay log on the storm deck.',
        log: { title: 'VARGA - RELAY LOG', who: 'VARGA', text: 'The broadcast that starts the cycle goes out from this tower every zero hour. I can stop it from here. I can also stop it from Station Zero, the right way, with a choice instead of a switch. I am not brave enough to choose for everyone.' },
        tick: 'ITS DRONES PATROL THE DECK. HIDE BEHIND THINGS. OR BE ON THE CEILING. OR WRITE THEM A LAW.',
        junoAfter: 'She could have ended it here. She did not. She left it for someone to choose.',
      },
      {
        kind: 'log', goal: 'Find Varga\'s last instruction in the antenna field.',
        log: { title: 'VARGA - TO REN', who: 'VARGA', text: 'Ren. You asked me to make you forget so that you could choose honestly. You even scratched our name off your badge. Go back down to Station Zero. Install the core. Wake the machine and look inside it. Then decide. I will be the light at the top of the tower when you need me.' },
        junoAfter: 'Go back down. After all this. She wants the choice made where it started.',
      },
      {
        kind: 'encounter', goal: 'Reach the beacon at the top of the tower.',
        lines: said('varga', [
          'There you are. You climbed it. You always climbed it, every cycle, and every cycle I wondered if this would be the one.',
          'Do not grieve me. I am an echo of a woman who made one good decision and one terrible one, the same night.',
          'The people of Halcyon are asleep below the forest. The machine keeps them dreaming. It keeps someone else alive, too. You will see.',
          'Go home, Ren. Station Zero. The lift behind me goes all the way down. Whatever you choose, choose it awake.',
        ]),
        junoAfter: 'The lift goes down to the lab. Come home, Ren. I will meet you there.',
      },
    ],
  },
];

// Memory fragments: three hidden in every district (gen/ZoneGen.js places
// them on roofs, behind buildings, by the water). Optional, voiced, and they
// tell you who lived here.
export const FRAGMENTS = [
  [
    'A child\'s drawing on a noodle bar menu: a city with a glass lid, and a sun drawn on top of the glass.',
    'A transit card with eleven years of rides on it. The last one ends at Station Zero.',
    'A karaoke booth still playing a love song to nobody. Someone wrote on the wall: SING IT BACK TO ME.',
    'A shop sign: CLOSED FOR THE ZERO EVENT. BACK SOON. The tape is eighteen years old.',
    'A wedding photo in a phone booth. On the back: we met in the rain that never stopped.',
    'A police log: "Subject Zero sighted near the square." Crossed out. "Correction: Varga."',
    'A vending machine that only sells umbrellas. All of them sold.',
    'A note under a bench: if you are reading this, the lights still work. Good. Leave them on.',
    'A ticket for the last train out of Meridian. The train never left.',
  ],
  [
    'A hard hat with a name scratched in it: OSEI. Under it, smaller: and her crew, every one.',
    'A pressure gauge stuck at nine-forty. Someone drew a smile on the glass.',
    'A flooded locker. Inside, dry, sealed in plastic: a birthday card for a child named Halcyon.',
    'A maintenance tag: pump four, repaired by Varga. Signed with a little drawing of a fish.',
    'An emergency checklist. Step one: stay calm. Step two has been torn off.',
    'A thermos of tea, still warm. That should not be possible.',
    'A union notice: night shift has been cancelled until further notice. Nobody cancelled the night.',
    'A diver\'s slate: the core well goes down further than the drawings say.',
    'Graffiti on a tank: THE WATER BOUGHT US TIME. SPEND IT WELL.',
  ],
  [
    'A seed packet labelled for Ren, in Varga\'s handwriting. Inside: one seed, already sprouting.',
    'A school trip register for the glass forest. Thirty names, thirty ticks, one question mark.',
    'A bench plaque: for everyone who came here to be quiet. Someone has left a pillow.',
    'Theo\'s watering schedule. Every day for eighteen years. Not one day missed.',
    'A pressed flower in a book about leaving. The book has no ending; the pages were cut out.',
    'A sleeping pod\'s status light, buried in moss. It pulses slowly. Someone is still dreaming in there.',
    'A drawing of the machine, in a child\'s hand. The child has drawn a heart inside it.',
    'A trail marker: CABIN, 300 METRES. Someone added: HURRY.',
    'A recording of birdsong, playing on loop for birds that never came.',
  ],
  [
    'A storm log: the lightning has struck the tower nine thousand times. It never misses.',
    'An engineer\'s badge for the relay: R. VARGA-ZERO. The last name is scratched almost through.',
    'A cup of coffee left on the stairs at the top of the world. Still steaming.',
    'Broadcast notes: every zero hour, the tower sends one word down to Station Zero. The word is redacted.',
    'A hand-drawn map of the tower with an X at the top: here is where I chose not to choose.',
    'A safety rope, tied off neatly. A little card on the knot: for whoever climbs next.',
    'A cracked visor with a reflection still burned into it: two people, one of them you.',
    'A letter: Ren, you will hate me for this, and then you will understand, and then you will forgive me. In that order.',
    'The last light in the tower: a lamp on a timer. It is set to switch off the moment you leave.',
  ],
];


// THE CRADLE: beneath Station Zero, after the machine. The long-sleep hold around the lower core
// well, where Halcyon's million sleep in rows under the roots of the Glass Forest, with Varga in
// row one. One zone, three districts, told differently after each prologue ending (null: started
// from the chapter menu before the choice). Same shape as a HALCYON story, so the same runtime
// plays it; gen/ZoneGen.js builds the 'cradle' theme.
export const CRADLE_FRAGMENTS = [
  'Footprints in the dust, from the foot of the ladder to row one. One set going in. None coming out.',
  'An empty pod, its lid propped open with a wrench. Scratched inside: NOT TONIGHT. SOMEBODY HAS TO KEEP THE LIGHTS ON. K. MORI.',
  'The next pod along: S. MORI, asleep. Someone has taped a tiny neon sign to the glass. It says OPEN.',
  'A door log from the reactor control deck. 03:04: KEY ACCEPTED - VARGA. The doors knew one name. Two people carried it. Badge on record: R. VARGA-ZERO.',
  'A dream monitor labelled ROW ONE, wired up to the station terminals. Its last output, word for word: If you have already activated it, I am sorry.',
  'A half-built drone in a toolbox, one rotor missing. A note in a child\'s handwriting: TICK. HE WILL TELL ME WHEN I AM WRONG.',
  'Eight empty pods at the end of the row, lids up, still warm. The label says NIGHT WATCH. The names on it change every cycle.',
  'Broadcast notes, the unredacted copy. Every zero hour, the tower sends one word down to Station Zero. The word is AGAIN.',
  'A lab tag dated 14 March 2071: LIFE SUPPORT, ONE OCCUPANT, R. VARGA. Consent signed by the Director. The line for the occupant is blank.',
];

// TICK in the Cradle: the ceiling is roots, not glass (gate hints are HALCYON's)
export const CRADLE_HINTS = {
  roof: ['THE RECORDER IS ON TOP OF THE PODS.', 'THE ROOTS ARE A FLOOR IF YOU ARE UPSIDE DOWN. OR THE OLD STAIRS ARE A MEMORY.', 'SHIFT TO INVERTED, WALK THE ROOTS UNTIL YOU ARE ABOVE THE STACK, SHIFT BACK. OR: ECHOES SOLIDIFY IN ECHO, SHIFT TO ECHO, CLIMB.'],
  canal: ['THE WATER CUTS THE ROW IN TWO.', 'A WALKWAY USED TO BE HERE. ECHO REMEMBERS IT. THE ROOTS DO NOT CARE ABOUT WATER.', 'ECHOES SOLIDIFY IN ECHO, SHIFT TO ECHO, CROSS. OR SHIFT TO INVERTED AND WALK OVER IT ON THE ROOTS.'],
  drones: ['THE DRONES WATCH THE AISLES. ONLY THE AISLES.', 'KEEP THE PODS BETWEEN YOU. OR GO WHERE THEY DO NOT LOOK: UP, AMONG THE ROOTS.', 'SHIFT TO INVERTED AND CROSS ON THE ROOTS. OR WRITE  OBSERVER  FREEZES IN  (THIS STATE).'],
};

const VARGA_CRADLE = { id: 'varga', first: 'Ilse', name: 'Dr. Ilse Varga', role: 'Director', pronoun: { their: 'her', them: 'her' }, color: '#6c5bc4', seed: 5512, voice: 'VARGA' };
const vargaSays = (lines) => lines.map((text) => ({ who: 'VARGA', name: 'DR. ILSE VARGA', color: VARGA_CRADLE.color, text }));
const LADDER = { who: 'JUNO', text: 'Varga said they sleep below the forest. That means below us. The ladder behind the vault goes down. It always did.' };
const HUSH = { who: 'TICK', text: 'EVERYONE DOWN HERE IS ASLEEP. I WILL USE MY INSIDE VOICE. THIS IS MY INSIDE VOICE.' };
// shared with the vessel's SEVERED opening (one recording)
const SMALL_FIELD = { who: 'TICK', text: 'THE DEVICE STILL WORKS. IT CARRIES A SMALL FIELD OF ITS OWN. THE WATCHERS DO NOT. THEY ARE STANDING VERY STILL.' };

export const CRADLE_ZONE = {
  key: 'cradle', name: 'THE CRADLE', title: 'Where Halcyon Sleeps', theme: 'cradle', feature: 'echo', idPrefix: 'c',
  rooms: ['THE WELL FLOOR', 'ROOT GALLERY', 'THE REGISTRY', 'MERIDIAN WARD', 'ROW ONE', 'NIGHT WATCH'],
  motto: 'SLEEP IS A PROMISE TO WAKE', // the Cryo Bay's motto: the night watch is woken from here
  canalSign: 'WALKWAY FLOODED',
  hints: CRADLE_HINTS,
  palette: { fog: 0x0e0c19, wall: '#2e2b38', floor: '#221f2a', accent: 0xb08cff, accent2: 0xffb46a, light: 0xe2d4ff, tint: 0x2c2650, night: 0.95, weather: 'motes', sky: 'warehouse', grade: { shadowTint: 0x221a4a, highlightTint: 0xffcf9e, toning: 0.24, contrast: 1.12, saturation: 0.96 } },
};

const CRADLE_BY_ENDING = {
  SEVER: {
    title: 'SEVERED', subtitle: 'Below the station, a sleeping city opens its eyes',
    awake: true, podsOpen: true, sentinels: 'still',
    palette: { accent2: 0xeef4ff, night: 0.8, grade: { highlightTint: 0xfff0dc } }, // pod lights gone white: the lids are open
    intro: [
      { who: 'JUNO', text: 'The lab went dark when you pulled the core. And something down the ladder is breathing, Ren. Hundreds of somethings.' },
      LADDER,
      SMALL_FIELD,
    ],
    open: 'There you are. Smaller than I made you. Come here. Let me look at you.',
    close: 'You let him go. I never could. Go forward and see whose hands were last. Then come back and help me wake the rest.',
    after: 'She\'s awake. Ren, she\'s actually awake. Go on - I\'ll keep her company on the radio.',
  },
  SUSTAIN: {
    title: 'SUSTAINED', subtitle: 'Below the station, the city you are keeping asleep',
    awake: false, podsOpen: false, sentinels: 'learned',
    intro: [
      { who: 'JUNO', text: 'The new one found the door. You were good at that part. Upside down and everything.' },
      LADDER,
      HUSH,
    ],
    open: 'If you are hearing this, you kept him running. I understand. I kept him for eighteen years.',
    close: 'I am asleep, Ren. Let me sleep. Go forward and see whose hands it is this time. Then decide how long you can keep doing this.',
    after: 'That was her dream talking. She\'s still asleep in there. Go on. The gate goes forward.',
  },
  MIRROR: {
    title: 'OBSERVED', subtitle: 'Below the station, a city that heard your name',
    awake: true, podsOpen: false, sentinels: 'kin',
    palette: { accent: 0x9fb4ff },
    intro: [
      { who: 'YOU', text: 'I know this ladder. I\'ve carried someone down it.' },
      { who: 'JUNO', text: 'Ren? You sound different. Older, at the edges. Go slow. It goes a long way down.' },
      { who: 'TICK', text: 'THE DRONES DOWN HERE KNOW YOUR NAME. I CAN TELL. NOBODY TELLS ME ANYTHING.' },
    ],
    open: 'Ren. Both of you. I can hear it in the way you walk.',
    close: 'You did not end him and you did not keep him. You let him in. Go forward. The ship will listen to you now.',
    after: 'She knew you. Both of you. Go on - I\'ll stay on the line with her.',
  },
  NONE: {
    title: null, subtitle: 'Below the forest, below the station, a city asleep in rows',
    awake: false, podsOpen: false, sentinels: 'hunt',
    intro: [
      { who: 'JUNO', text: 'You came down without choosing. That\'s allowed. The machine will wait. It\'s good at waiting.' },
      LADDER,
      HUSH,
    ],
    open: 'If you are hearing this, you have not chosen yet. Good. Look first.',
    close: 'The machine is still waiting upstairs. Go forward first, if you like. See whose hands. Then choose it awake.',
    after: 'That was her dream talking. She\'s still asleep in there. Go on. The gate goes forward.',
  },
};

const VARGA_SHARED = [
  'The one in the machine is my son. The first Ren. I opened the valves, and he went into the water for Juno.',
  'He carried her all the way to the lab. Then I could not let him go. That was my terrible decision.',
  'That night the control deck opened for my name, on his badge. He could not stop the fold. So he made it ask, every cycle: whose hands?',
  'Someone always answers. Never the same hands twice. You are made of him, Ren. You do not have to be him.',
];

export function makeCradleStory(ending = null) {
  const v = CRADLE_BY_ENDING[ending] || CRADLE_BY_ENDING.NONE;
  const cast = [{ ...VARGA_CRADLE, alive: v.awake }]; // awake after SEVERED and OBSERVED; otherwise her dream, as an echo
  const zone = {
    ...CRADLE_ZONE,
    crew: 0,
    subtitle: v.subtitle,
    awake: v.awake, // ZoneGen: Varga's pod lid stands open
    podsOpen: v.podsOpen, // ZoneGen: every pod lid stands open (SEVERED)
    palette: { ...CRADLE_ZONE.palette, ...v.palette, grade: { ...CRADLE_ZONE.palette.grade, ...v.palette?.grade } },
    intro: v.intro,
    beats: [
      {
        kind: 'arrival', goal: 'Find the recorder on top of the pod stack.',
        log: { title: 'VARGA - LAST LOG - 14 MARCH 2071', who: 'VARGA', text: 'Last log. The city is down here, every pod green. I chose not to choose at the tower, so I will not stay awake to choose here. Row one. When the water runs out, the field will wake a new Ren. Tell Juno I am sorry.' },
        tick: 'ROW ONE IS AT THE FAR END. I COUNTED. THERE ARE A LOT OF ROWS.',
        junoAfter: 'She asked for me. Eighteen years, and she was under our feet the whole time. Keep going, Ren.',
      },
      {
        kind: 'contradiction', goal: 'Read the sleep registry. Then read it in ECHO.',
        log: 'The registry says nobody made me. The echo says Ren Varga, Ilse Varga\'s son. Body lost. Mind kept. The one in the machine is him. I\'m made of him.',
        official: 'SLEEP REGISTRY - SUBJECT ZERO - WOKEN DAY 6570 - NO PARENT ON RECORD',
        echo: 'REN VARGA - SON OF ILSE VARGA - BODY LOST 14 MARCH 2071 - MIND KEPT',
        clue: 'cleared', crew: 0, toast: 'RECORD CORRECTED',
        tick: 'THE REGISTRY HAS AN ECHO. FORMS FORGET PEOPLE. ECHOES DO NOT.',
        // Juno's confession: the 'her' the Custodian saw you carry
        junoAfter: [
          'Ren. I was on Osei\'s shift that night. Lower gallery. When the valves opened, the water came in like a wall.',
          'You came down for me. Nobody else did. You carried me all the way to the lab.',
          'That\'s the her. The Custodian saw you carry me. I made it. You didn\'t. I\'ve wanted to say that for forty-two cycles.',
        ],
      },
      {
        kind: 'encounter', goal: 'Find row one.', gate: 'NIGHT WATCH - FORWARD DECKS',
        lines: vargaSays([v.open, ...VARGA_SHARED, v.close]),
        junoAfter: v.after,
      },
    ],
    index: 0,
    sectors: ZONE_SECTORS,
  };
  return {
    zones: true,
    cradle: true,
    set: 'cradle',
    seed: 'cradle',
    label: 'THE CRADLE',
    cardTop: v.title ? `BENEATH STATION ZERO · AFTER ${v.title}` : 'BENEATH STATION ZERO',
    question: 'Who sleeps beneath Station Zero, and who did you carry through the archive door?',
    after: { key: ending || 'NONE', title: v.title, sentinels: v.sentinels },
    fragments: [CRADLE_FRAGMENTS],
    cast,
    captain: cast[0],
    truth: {},
    decks: [zone],
  };
}

export function makeZoneStory() {
  return {
    zones: true,
    seed: 'halcyon',
    question: 'Where did Varga go, and what did she do on the night of the Zero Event?',
    cast,
    captain: cast[crew('varga')],
    truth: {},
    decks: ZONES.map((z, i) => ({ ...z, index: i, sectors: ZONE_SECTORS })),
  };
}
