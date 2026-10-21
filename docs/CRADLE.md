# THE CRADLE: where Halcyon sleeps (v1.0)

The chapter between the prologue and the Vessel. The ladder behind the vault goes down as well as up: below Station Zero, around the lower core well, is the long-sleep hold where HALCYON's million sleep in rows under the roots of the Glass Forest. Varga sleeps in row one. Juno finally says who the Custodian saw you carry, and you meet Varga: awake, dreaming, or saying your name, depending on the ending you chose at the machine.

**Play order:** PROLOGUE (Station Zero, HALCYON, home, the machine, an ending), then THE CRADLE (one zone, three districts, about 25 minutes), then THE VESSEL. The prologue's end screen offers **GO BENEATH** (the Cradle) and **SKIP TO THE VESSEL**. The Cradle's last gate, **NIGHT WATCH - FORWARD DECKS**, starts the Vessel in the world the same ending made.

**From the chapter menu:** the Cradle card ("Beneath Station Zero, where Halcyon sleeps") has CONTINUE and NEW GAME. Its status line says which ending it will follow: the last one reached on this device (`afterzero.lastEnding`), or "Before the choice". A new game there counts the prologue as played to the machine (slot 2 holds ECHOES SOLIDIFY IN ECHO, all three slots open).

## Told four ways

| | SEVERED | SUSTAINED | OBSERVED | none (before the choice) |
| --- | --- | --- | --- | --- |
| Card | BENEATH STATION ZERO · AFTER SEVERED | · AFTER SUSTAINED | · AFTER OBSERVED | BENEATH STATION ZERO |
| Subtitle | Below the station, a sleeping city opens its eyes | Below the station, the city you are keeping asleep | Below the station, a city that heard your name | Below the forest, below the station, a city asleep in rows |
| Pods | every lid stands open, pod lights white | closed, amber | closed, amber | closed, amber |
| Varga | awake, by her open pod | her dream (a hologram over a closed pod) | awake | her dream |
| Drones | `still`: dark-eyed, never move or see | `learned`: hunt with the hall's lessons | `kin`: violet-eyed, stop to watch you, never chase | `hunt` |

The ending comes from the save (`campaign.ending`), the end screen, or the last ending on the device. If you sustained the field but the Observer learned nothing in the hall, the drones simply hunt.

## The districts (gen/ZoneGen.js, theme `cradle`)

The district shell is HALCYON's (68 m × 108 m, ceiling 22 m, spawn in the south, gate in the north wall), so every HALCYON answer works here: walk the ceiling INVERTED, climb remembered stairs or cross a remembered walkway with ECHOES SOLIDIFY IN ECHO, float with zero-g, freeze drones with OBSERVER FREEZES IN.

- **Floor:** stone. The aisle's raised edges are steel grating, its centre line a dashed violet guide light.
- **Walls:** rusted hull plates. **Ceiling:** the underside of the Glass Forest, a mat of roots (walkable when INVERTED).
- **Hanging roots:** up to 24 per district, 4 to 12 m long (never lower than 10 m), one in five only a memory. They keep out of the avenue, the scene and every stack, so every ceiling walk has a straight path.
- **Pod banks** (low plinths with two rows of pods; cover from the drones) and **pod stacks** (6 to 14 m tiers of glowing pods, signed ROW 12, MERIDIAN WARD, REACTOR WARD, FOREST WARD, QUIET - SLEEPERS, DO NOT WAKE, DORMANCY 98%, NIGHT WATCH) take the place of buildings. Lids are decided when the district is built, so they merge into one mesh.
- **The core well** comes down the middle, with the reactor's flood water still falling down its face. The machine's cables run along the aisle.
- **Water** (districts 2 and 3) is the reactor's flood water, come down the well: WALKWAY FLOODED.
- **Light:** night 0.95, the warehouse sky, pale violet motes drifting in pod light, row lamps.
- **No tokens.** Level ids `c0s0`..`c0s2`, generated from `Rng.from('cradle', 0, si)`, so HALCYON's twelve districts are untouched.

| # | District | Scene | Drones |
| --- | --- | --- | --- |
| 1 | THE WELL FLOOR | Varga's last log on top of the arrival pod stack (motto: SLEEP IS A PROMISE TO WAKE) | 0 |
| 2 | THE REGISTRY | the sleep registry, read plainly and in ECHO; Juno's confession | 1 |
| 3 | ROW ONE | Varga's pod in a lit nook (ROW ONE - I. VARGA); the night watch gate | 2 |

## The lines

**Openings**
- SEVERED. JUNO: "The lab went dark when you pulled the core. And something down the ladder is breathing, Ren. Hundreds of somethings." / "Varga said they sleep below the forest. That means below us. The ladder behind the vault goes down. It always did." TICK: "THE DEVICE STILL WORKS. IT CARRIES A SMALL FIELD OF ITS OWN. THE WATCHERS DO NOT. THEY ARE STANDING VERY STILL."
- SUSTAINED. JUNO: "The new one found the door. You were good at that part. Upside down and everything." / the ladder line. TICK: "EVERYONE DOWN HERE IS ASLEEP. I WILL USE MY INSIDE VOICE. THIS IS MY INSIDE VOICE."
- OBSERVED. YOU: "I know this ladder. I've carried someone down it." JUNO: "Ren? You sound different. Older, at the edges. Go slow. It goes a long way down." TICK: "THE DRONES DOWN HERE KNOW YOUR NAME. I CAN TELL. NOBODY TELLS ME ANYTHING."
- None. JUNO: "You came down without choosing. That's allowed. The machine will wait. It's good at waiting." / the ladder line. TICK: the inside voice.

**District 1.** *VARGA - LAST LOG - 14 MARCH 2071* (in her own voice): "Last log. The city is down here, every pod green. I chose not to choose at the tower, so I will not stay awake to choose here. Row one. When the water runs out, the field will wake a new Ren. Tell Juno I am sorry." TICK: "ROW ONE IS AT THE FAR END. I COUNTED. THERE ARE A LOT OF ROWS." JUNO: "She asked for me. Eighteen years, and she was under our feet the whole time. Keep going, Ren."

**District 2.** The registry reads *SLEEP REGISTRY - SUBJECT ZERO - WOKEN DAY 6570 - NO PARENT ON RECORD*; in ECHO, *REN VARGA - SON OF ILSE VARGA - BODY LOST 14 MARCH 2071 - MIND KEPT* (RECORD CORRECTED). YOU: "The registry says nobody made me. The echo says Ren Varga, Ilse Varga's son. Body lost. Mind kept. The one in the machine is him. I'm made of him." Then Juno's confession:
> JUNO: "Ren. I was on Osei's shift that night. Lower gallery. When the valves opened, the water came in like a wall."
> JUNO: "You came down for me. Nobody else did. You carried me all the way to the lab."
> JUNO: "That's the her. The Custodian saw you carry me. I made it. You didn't. I've wanted to say that for forty-two cycles."

**District 3.** Juno: "Someone's in there. Ren - be gentle. It might be Ilse." Varga speaks six lines: an opening per ending, four shared lines, a closing per ending.
- Openings: SEVERED "There you are. Smaller than I made you. Come here. Let me look at you." SUSTAINED "If you are hearing this, you kept him running. I understand. I kept him for eighteen years." OBSERVED "Ren. Both of you. I can hear it in the way you walk." None "If you are hearing this, you have not chosen yet. Good. Look first."
- Shared: "The one in the machine is my son. The first Ren. I opened the valves, and he went into the water for Juno." / "He carried her all the way to the lab. Then I could not let him go. That was my terrible decision." / "That night the control deck opened for my name, on his badge. He could not stop the fold. So he made it ask, every cycle: whose hands?" / "Someone always answers. Never the same hands twice. You are made of him, Ren. You do not have to be him."
- Closings: SEVERED "You let him go. I never could. Go forward and see whose hands were last. Then come back and help me wake the rest." SUSTAINED "I am asleep, Ren. Let me sleep. Go forward and see whose hands it is this time. Then decide how long you can keep doing this." OBSERVED "You did not end him and you did not keep him. You let him in. Go forward. The ship will listen to you now." None "The machine is still waiting upstairs. Go forward first, if you like. See whose hands. Then choose it awake."
- Juno after: SEVERED "She's awake. Ren, she's actually awake. Go on - I'll keep her company on the radio." SUSTAINED and none "That was her dream talking. She's still asleep in there. Go on. The gate goes forward." OBSERVED "She knew you. Both of you. Go on - I'll stay on the line with her."

**The nine fragments** (three per district, read by the narrator): the footprints going in and none coming out; Kade's empty pod propped open with a wrench (NOT TONIGHT. SOMEBODY HAS TO KEEP THE LIGHTS ON. K. MORI); S. MORI asleep with a tiny OPEN sign taped to the glass; the control deck's door log (03:04: KEY ACCEPTED - VARGA. Badge on record: R. VARGA-ZERO); the dream monitor wired to the station terminals; the half-built TICK in a child's toolbox; eight warm, empty NIGHT WATCH pods whose names change every cycle; the unredacted broadcast word, AGAIN; the lab tag LIFE SUPPORT, ONE OCCUPANT, R. VARGA, the occupant's consent line blank.

**TICK's hints** (`CRADLE_HINTS`): the roof ("THE RECORDER IS ON TOP OF THE PODS." ...), the water ("THE WATER CUTS THE ROW IN TWO." ...) and, before the choice, the drones ("THE DRONES WATCH THE AISLES. ONLY THE AISLES." ...). After an ending the drones use the watchers' hints (`HINTS['sentinel:still' | 'sentinel:learned' | 'sentinel:kin']`), shared with the Vessel.

## Code

- `gen/ZoneStory.js`: `makeCradleStory(ending)`, `CRADLE_FRAGMENTS`, `CRADLE_HINTS`.
- `gen/ZoneGen.js`: the `cradle` theme (`podBlock`, `cradlePod`, `cradleCeiling`).
- `world/materials.js`: `stone`, `roots`, `root`, `pods`, `podLight`; `world/Weather.js`: `motes`.
- `main.js`: `startZones(saved, 'cradle', ending)`, `beginCradle()`, `adoptLastEnding()`, the night watch gate in `completeSector()`.
- `ui/Saves.js`: `CHAPTERS.cradle`, `rememberEnding()`, `lastEnding()`.
- `tests/cradle.mjs`: plays the three districts after every ending and walks into the Vessel; `tests/gen.test.mjs` checks the generated districts.
