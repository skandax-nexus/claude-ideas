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
  { id: 'varga', first: 'Ilse', name: 'Dr. Ilse Varga', role: 'Director', pronoun: { their: 'her', them: 'her' }, color: '#6c5bc4', alive: false, seed: 5512 },
];

const crew = (id) => cast.findIndex((c) => c.id === id);
const said = (id, lines) => lines.map((text) => ({ who: 'CREW', name: cast[crew(id)].name.toUpperCase(), color: cast[crew(id)].color, text }));

export const ZONES = [
  {
    key: 'neon', name: 'NEON MERIDIAN', title: 'The City Under Glass', theme: 'city', feature: 'gravity', crew: crew('kade'),
    subtitle: 'A city that never turns its lights off, under a sky made of glass',
    palette: { fog: 0x161b26, wall: '#3b3e46', floor: '#24272e', accent: 0xff4fa8, accent2: 0x3fe0ff, light: 0xb9a6ff, tint: 0x3a3f6e, night: 1, weather: 'rain', grade: { shadowTint: 0x1c3a72, highlightTint: 0xffb6dc, toning: 0.22, contrast: 1.12, saturation: 1.12 } },
    rooms: ['MERIDIAN SQUARE', 'RAIN ALLEY', 'NOODLE ROW', 'THE OVERPASS', 'GLASS MARKET', 'NIGHT STATION'],
    motto: 'HALCYON NEVER SLEEPS',
    intro: [
      { who: 'JUNO', text: 'Ren, that hatch goes up. All the way up. There is a whole city on top of Station Zero.' },
      { who: 'JUNO', text: 'They called it Halcyon. One glass sky, a million lights, and nobody left to switch them off.' },
      { who: 'TICK', text: 'DRONES. THREE. THEY LOOK AT FLOORS. WE SHOULD NOT BE A FLOOR.' },
    ],
    beats: [
      {
        kind: 'arrival', goal: 'Find Varga\'s recorder in the square.',
        log: { title: 'VARGA - FIELD RECORDER 1', text: 'If you are hearing this, you came up the long way. Good. The Observer cannot see past its own floors, so stay high when you can. I am going to the Signal Tower. Follow the pink lights.' },
        tick: 'THE RECORDER IS ON A ROOF. ROOFS ARE CEILINGS FOR THE SKY. FLIP THE CITY.',
        junoAfter: 'Stay high. Roofs, overpasses, the glass itself if you have to. I can steer you.',
      },
      {
        kind: 'contradiction', goal: 'Read the wanted screen. Then read it in ECHO.',
        log: 'The screen says the city hunted me. The echo says it hunted Varga. Someone rewrote who the villain was.',
        official: 'WANTED: SUBJECT ZERO - FOR THE ZERO EVENT - DO NOT APPROACH',
        echo: 'WANTED: ILSE VARGA - FOR TRYING TO STOP IT',
        clue: 'cleared', crew: crew('varga'),
        tick: 'THE SCREEN HAS A MEMORY. MEMORIES TELL THE TRUTH MORE OFTEN. NOT ALWAYS.',
        junoAfter: 'They put your face on every screen in the city. Somebody wanted you to be the reason.',
      },
      {
        kind: 'encounter', goal: 'Find whoever keeps the signs lit.',
        lines: said('kade', [
          'Hey - hey! Don\'t run. Nobody runs on my street. You\'ll scare the signs.',
          'Kade. I fix the neon. Twelve years, every night, and not one customer. Feels honest work, though.',
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
    palette: { fog: 0x0f2a2e, wall: '#33484a', floor: '#2b3a3c', accent: 0xff8a3d, accent2: 0x4ff0d2, light: 0xffb27a, tint: 0x1d4a48, night: 0.85, weather: 'steam', grade: { shadowTint: 0x0c4a48, highlightTint: 0xffb47a, toning: 0.24, contrast: 1.14, saturation: 1.0 } },
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
        log: { title: 'VARGA - NOTE ON A PUMP', text: 'I opened the flood valves myself. It was the only way to slow the core down. Osei, I am sorry. Ren, if you read this: the water bought us eighteen years. Do not waste them.' },
        junoAfter: 'Eighteen years. That number again. Recording 0 was eighteen years before you were born.',
      },
      {
        kind: 'encounter', goal: 'Find Chief Osei.',
        lines: said('osei', [
          'Pressure at nine-forty and climbing. Seal the lower gallery. Seal it!',
          'Who is that? You are not on my shift. Nobody is on my shift anymore.',
          'She opened the valves. She saved the city and drowned my reactor in the same breath. I would have done the same.',
          'Go up the core well. The forest is above us. She went to the cabin. She always went to the cabin.',
        ]),
        junoAfter: 'That was an echo. Osei has been saying that to an empty room for eighteen years.',
      },
    ],
  },
  {
    key: 'forest', name: 'THE GLASS FOREST', title: 'The Garden That Kept Growing', theme: 'forest', feature: 'zerog', crew: crew('theo'),
    subtitle: 'A forest under a dome, still glowing, still growing, still waiting',
    palette: { fog: 0x14302a, wall: '#3c5a4c', floor: '#2d4436', accent: 0x9dff7a, accent2: 0xffd36a, light: 0xd8ffb0, tint: 0x2a5a44, night: 0.75, weather: 'fireflies', grade: { shadowTint: 0x1a4a34, highlightTint: 0xfff0b8, toning: 0.2, contrast: 1.08, saturation: 1.1 } },
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
        clue: 'cleared', crew: crew('varga'),
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
    palette: { fog: 0x1e1a1e, wall: '#45403f', floor: '#2c2a2b', accent: 0xff4a4a, accent2: 0xffc06a, light: 0xffa0a0, tint: 0x5a2a34, night: 0.9, weather: 'storm', grade: { shadowTint: 0x3a1830, highlightTint: 0xffb0a0, toning: 0.24, contrast: 1.16, saturation: 1.04 } },
    rooms: ['STORM DECK', 'THE SPIRE STAIR', 'ANTENNA FIELD', 'THE RELAY', 'LAST LANDING', 'THE BEACON'],
    motto: 'SAY IT ONCE AND THE WHOLE SKY HEARS',
    intro: [
      { who: 'JUNO', text: 'The tower. Storm on the glass, red lights everywhere. And Ren - it is here. The Observer. It got here first.' },
      { who: 'OBSERVER', text: 'It has been waiting at the top of the world. It knows the way you climb.' },
      { who: 'TICK', text: 'IT WATCHES FLOORS. YOU KNOW WHAT TO DO. PROBABLY.' },
    ],
    beats: [
      {
        kind: 'arrival', goal: 'Find Varga\'s relay log on the storm deck.',
        log: { title: 'VARGA - RELAY LOG', text: 'The broadcast that starts the cycle goes out from this tower every zero hour. I can stop it from here. I can also stop it from Station Zero, the right way, with a choice instead of a switch. I am not brave enough to choose for everyone.' },
        tick: 'THE OBSERVER PATROLS THE DECK. HIDE BEHIND THINGS. OR BE ON THE CEILING. OR WRITE IT A LAW.',
        junoAfter: 'She could have ended it here. She did not. She left it for someone to choose.',
      },
      {
        kind: 'log', goal: 'Find Varga\'s last instruction in the antenna field.',
        log: { title: 'VARGA - TO REN', text: 'Ren. You asked me to make you forget so that you could choose honestly. Go back down to Station Zero. Install the core. Wake the machine and look inside it. Then decide. I will be the light at the top of the tower when you need me.' },
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

export function makeZoneStory() {
  return {
    zones: true,
    seed: 'halcyon',
    cast,
    captain: cast[crew('varga')],
    truth: {},
    decks: ZONES.map((z, i) => ({ ...z, index: i, sectors: ZONE_SECTORS })),
  };
}
