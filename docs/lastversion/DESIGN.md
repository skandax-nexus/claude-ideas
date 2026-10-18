# AFTERZERO: The Last Version of Earth — design

How the creator's gameplay bible (`BIBLE.txt`, `AFTERZERO_Gameplay_Bible.pdf`) maps onto the
AFTERZERO engine, and which parts of the edition are written by hand and which are generated.
What is finished and what is not is in [`STATUS.md`](STATUS.md).

## The edition layer

The Last Version is a separate game built from the same sources as the Station Zero game.

| What | Where |
| --- | --- |
| Which game a page is | `game/js/core/Edition.js`: `window.AZ_EDITION = 'lastversion'` (set by the edition's build) or `?edition=lastversion` on the URL. Without either, the page is the Station Zero game, unchanged. |
| Its own saves and settings | Every key under `afterzero.lv.` (`Edition.js` `NS`, used by `ui/Saves.js` and `ui/Settings.js`). The two games never see each other's saves. |
| Its own app | `EDITION=lastversion bash android/build-apk.sh` builds "AFTERZERO: Last Version" (`com.afterzero.lastversion`, versionName 2.0.0, `AFTERZERO-LastVersion-v2.0.apk`) into `android/build-lastversion/`, with a preview `index.html` that sets `window.AZ_EDITION='lastversion'`. |
| Everything the edition changes | `game/js/editions/lastversion/`: `index.js` (title, states, labels, looks, speakers, engine options), `Runtime.js` (chapters, missions, objectives, scenes, choices, stability, Echo Step, anchors, the case board, endings), `prologue.js` (Missions 1–3), `acts.js` (Acts I–IV, the Finale, the endings, the optional cases), `npcs.js` (the people), `Build.js` (hand-built interiors and props), `dress.js` (what each year of a place looks like). |
| Hooks in the shared code | `main.js` hands the game to the edition's runtime where the edition is on (`this.edition`), and nowhere else. `RealityEngine` takes a configurable state set. The generators take a few optional fields (`zone.themes`, `zone.names`, `zone.drones`, `zone.overlay`, `deck.mechs`, `story.mechDeck`, beat kinds `scene`, `choice`). Each hook is a no-op for the Station Zero game; `npm test` and the default suites prove it. |

Its own look: the title reads AFTERZERO / THE LAST VERSION OF EARTH in front of rain, a city's
glow and the black ring; the chapter list is PROLOGUE, ACT I–IV, FINALE, CASES; you are Kai
Varen (the realistic man in shirtsleeves, `real_m`) until you choose otherwise; the HUD names
the states by year: 2049, 2026, 2196, INVERTED. There is no law-writing device in this edition
(`L` opens the case board).

## The bible → the engine

### The four temporal states

| Bible | Engine |
| --- | --- |
| Temporal State Switching: authored states of one location, not free date selection | `RealityEngine` runs on `['PRESENT', 'PAST', 'FUTURE', 'INVERTED']`, baseline `PRESENT`. Each mission lists the states its region was authored with (`states:`); `setAvailable` gives each room those, cycling (`Q`) visits only them, and a state a place does not have is refused ("This place does not have that year"). `1 2 3 4` pick by position. |
| Past: original structures, causes, objects that no longer exist | `PAST` is the residue state: echo geometry (the bridge that stood here, the stairs that were pulled down) is visible and holds weight (`stateEffects.PAST = { echoVisible, echoSolid }`); records show what they said first (contradiction beats). Items from the past are echo items. |
| Present: investigation, machinery, grounded stealth, human conflict | `PRESENT`: the place as built; locks read it (a key from another year must be anchored). Watchers patrol it. |
| Future: consequences, traversal through ruins, unstable zones | `FUTURE`: authored consequences (the parked lift across Helix's collapsed hall, the drained village, the third device), ivy, roof gardens, moss and fallen slabs on every place that has a 2196 (`dress.js`), and in unstable regions the Chronolith's stability drains. |
| Inverted: temporarily reverses selected processes, within energy and stability limits | `INVERTED` (`stateEffects.INVERTED = { gravityFlip, timeReverse }`): the floor and ceiling trade places in readable zones, sweeping beams and patrol loops run backwards, the hospital's lock comes apart in the order it was assembled, debris hangs where it will land. It drains stability in unstable regions like any state out of the present. |
| Each state looks and sounds different | `DeckWorld.setLook` tints the materials per state (warm stone then, cold steel now, moss and rust later, violet inverted); `Runtime.stateNight` gives each year its own hour (2026 at dusk, 2196 in a pale dawn); `stateWeather` swaps the weather (2196 pollen, inverted stardust, 2026 dry); `audio/Synth.js` plays a different chord progression per state (The Need to Fix It, Living History, Beautiful Catastrophe) and an ambience bed per region. |

### Signature systems

| Bible | Engine |
| --- | --- |
| Chronolith stability (quiet HUD) | `Runtime.stability` (0–1). Out of the present in an unstable region it drains (0.045/s, about 22 s from full); in the present it refills (0.1/s). Echo Step costs 0.25, an anchor 0.15. The meter is a thin bar under the year pips, shown only when you are out of the present or below full, with "CHRONOLITH DRAINING" / "UNSTABLE" when it matters. At zero the Chronolith lets go: a fade, the room snaps back to PRESENT, you stand at the last checkpoint ("the last anchor") with half stability. |
| Causal anchors: selected objects persist between states after a deliberate action | `C` anchors what you carry: the engine's global `heldPersists` effect holds while that object is in your hands. Without it, something taken out of the past comes apart when the year changes. |
| Temporal residue | Contradiction beats: a record (plaque, public screen, field order, archive card) reads one thing in every state and something else in the past; reading the residue pins evidence and opens the way on. |
| Echo Step (from Mission 10): afterimage that distracts enemies or crosses a gap; consumes stability | `X`, unlocked by Mission 10's choice (every branch sets `echo_step`): an afterimage of Kai stays where he stood for 4 s and the watchers chase it (`DeckWorld.setDecoy`), and Kai steps up to 5 m forward where the ground holds; 8 s cooldown, 0.25 stability, refused below 0.3. |
| Local loops | `deck.loop` (Mission 9: 82 s, Mission 15: 120 s): the street resets, the watchers go back to their rounds, Kai keeps what he knows ("The street resets. You do not."). Mission 1's station falls back to 8:13 every 41 seconds with the announcement (quest chain A is solved in that minute). Mission 6's sweeping arms repeat on a rhythm to be learned. |
| Persistent consequences | Facts carried across missions: the river diverted in the earliest state shapes the later states of the village (Mission 5); the stabilizer choice sets your faction (Mission 13) and with it who answers in Mission 21; Jun's passengers (Mission 1) clear the Finale's first street of watchers; Iven's team or Iven's log (Mission 3) decide whether Iven can be your ally; Anja's lock (Mission 15) likewise. |
| Inspect objects; evidence journal / case board, not a checklist | The case board (`J`): where you are and the act's question, every piece of evidence pinned (`ev_*`), the people you met with their trust, knowledge and quest state, what you chose, and the case log. |
| Quiet HUD | The year pips with the stability bar, the objective ("current understanding"), the interaction prompt, the watcher meter when one is near. |

### Combat → stealth and evasion

The engine has no combat, and this edition adds none. The bible's fights are played as readable
stealth and evasion with watchers (`Sentinel`: a cone of sight along the floor, suspicion, a
chase, and a walk back to the last checkpoint when it reaches you):

| Bible | Here |
| --- | --- |
| Malfunctioning security drones (Mission 2), Continuum guards (Mission 10), patrols (Missions 9, 13) | Watchers on patrol loops; stay out of the cone, use pillars and alleys, cross in a year where the watcher does not exist (Mission 3's drone was installed after 2026), or Echo Step. |
| "A security unit that rewinds damage; lure it into a damaged power conduit" (Mission 2) | A watcher that cannot be outlasted: throw the breaker, let it see you, lead it through the live conduit; it stays down (`conduit`, `onSentinelDown`). |
| Temporal scavengers, elite enemies who rewind injuries, security that mimics Kai | Watchers; in INVERTED their patrols run backwards. |
| Faction battle (Mission 13) | Three devices disabled in three different years while the battle repeats, then the choice. |

This keeps the bible's "readable combat: temporal powers alter positioning and timing" — every
encounter is about where you are, when, and in which year — and its NPC rule "avoid making every
encounter end in lethal combat".

### People (the NPC supplement)

| Supplement | Engine |
| --- | --- |
| State model: trust, knowledge, quest state, temporal state, faction standing, evidence flags | Facts: `trust_<id>` (−1 hostile, 0 guarded, 1 cooperative), `know_<id>` (0 unaware … 3 informed), `quest_<id>` (active / resolved), `faction` (neutral / continuum / unwritten), `ev_<flag>`; the temporal state is each person's `temporal` list in `npcs.js`. Saved with the game. |
| Dialogue choices express intent | A choice panel with CHALLENGE / COMFORT / INVESTIGATE / WITHDRAW on every option; a choice can change trust, knowledge, a quest, the faction, evidence, facts. |
| Barks | Short lines in passing, from the bible's list and each region's ambient population; one at a time across a place, never over a conversation or a menu. |
| Unavailable in a state → an echo, a recording, a changed location | Someone who exists only in some of a place's states leaves an echo (a translucent impression) in the others; talking to it plays what the year kept of them (Jun at 8:13, Iven in 2026, Niko in the flooded future, Tala, the Witness). The person a story beat is about is always met in person, and no main-story person is ever only an echo. |
| Roster | Kai, Mira, the Witness, Sera Voss, Dr. Elias Rook, Niko, Dr. Anja Vale, Iven Marr, Tala, Jun Park, Mara Quill, Orren, the Child in the Station, plus the settlement's elder, the clockmaker, officers, technicians, soldiers and the ambient populations of Rain City, Helix, the settlement, Loop City, 2196 and the Unwritten Second. |
| Quest chains A–D | A (Jun, Last Train Home) and D (Iven, The Technician's Key) are part of the Prologue; B (Tala and Niko, The Water That Remembers) and C (Mara, Two Records, One Disaster) are the optional CASES chapter. Each has both outcomes, and none is in a mission's completion condition. |

## Authored and generated

**Written by hand**

- The Prologue, all of it. Mission 1 is Rain City: a generated district (theme `rain`) with an
  authored overlay — Kai's door, the anomalies (the toy, the backward clock, tomorrow's camera
  feed), Rook's call, the checkpoint, the station, the Zero Second and the train, the rescue,
  the voice in every speaker, Mira in the crowd, Jun's booth and relay 41-B (quest chain A).
  Missions 2 and 3 are hand-built Helix interiors (`Build.js` `Deck`): security, the dark
  corridor and its drone, the power room and the three cells, Iven's locker, the recordings and
  the officer's code, the conduit hall and the unit, the archive and the drawing, the chamber;
  then the Chronolith's first switch, the cable connected in 2026 and powered in 2049, the
  machine hall crossed in 2196, Iven's maintenance route (quest chain D) and the control room.
  Every bible line of these missions is spoken verbatim.
- For every mission of Acts I–IV and the Finale: its setup (intro), its three beats with their
  goals, the bible's quoted lines, the scenes and choices, the memory fragments, and its mission
  ending (outro); the Mission 13 faction choice; the Mission 10 Echo Step unlock; the ally call in
  Mission 21; the three endings and the post-credit "Version one hundred and eighteen."
- The people: roster, wants and fears, temporal states, dialogue with intents, echoes, barks.
- What each year of a place looks like (`dress.js` rules) and sounds like.

**Generated**

- The places of Acts I–IV, the Finale and the cases: open districts from `gen/ZoneGen.js`
  (themes `settlement`, `tower`, `city`, `reactor`, `ruin`, `rain`, `liminal`) and interiors from
  `gen/LevelGen.js` (Helix, the clockmaker's workshop, the detention block, the hospital, the
  museum, the archive, the command structure), seeded per chapter (`lv-<chapter>`).
- Their puzzles: the generators' pits, ledges, keys, cores, sweepers and watchers, restricted
  to what the mission's states can do (no gravity puzzle without INVERTED, no residue puzzle
  without PAST), with routes the tests walk.
- The per-state decoration of every place (ivy, gardens, moss, fallen slabs, scaffolding,
  lanterns, hanging debris), merged into one mesh per kind and year, and never solid.

## The missions

| # | Mission | Act | Place | States | What happens |
| --- | --- | --- | --- | --- | --- |
| 1 | The Last Normal Day | Prologue | Rain City (authored overlay) | 2049 (+ 8:13) | Anomalies, Rook's call, checkpoint, the Zero Second, rescue, "Do not build the machine", Mira; chain A |
| 2 | Helix Goes Dark | Prologue | Helix (hand-built) | 2049 | Emergency light, drone, three cells, Iven, the trustworthy officer, the rewinding unit, the drawing, the chamber |
| 3 | The First Switch | Prologue | Helix (hand-built) | 2049 2026 2196 | The switch, cable/power, the parked lift, chain D, the anchor, the fracture |
| 4 | The Man from the Last Day | I | Settlement | 2049 2026 | Telling-stone, inscription residue, the elder; the access card |
| 5 | The Village That Never Existed | I | Settlement | 2026 2049 2196 | River (past), wall (middle), gate (latest); the buried machine |
| 6 | The Clockmaker's House | I | Workshop interior | 2026 2049 2196 | Repeating arms, the clockmaker, the mechanism; the recording |
| 7 | The Broken Observatory | I | Observatory | all four | Alignment, the dates, Mira's recording |
| 8 | The First Death | I | Helix, altered | 2026 2049 Inv | Staff records, the corrupted log, containment; VERSION 17 |
| 9 | Nine Minutes to Zero | II | Loop City | 2049 2026 Inv | Loop (82 s), clocks, the cancelled order, the engineer |
| 10 | Enemies Who Remember | II | Detention block | 2049 2026 Inv | Intake log, Sera, the prisoners' choice; Echo Step |
| 11 | The Inverted Hospital | II | Hospital interior | Inv 2049 2026 | The quiet sound, Mira's file, the reversing lock |
| 12 | The Man Behind the Glass | II | Helix, three years deep | all four | The 2026 corridor, the route, the Witness and the second Chronolith |
| 13 | The Nine-Minute War | II | War zone | all four | Field orders, three devices in three years, the stabilizer (faction) |
| 14 | Welcome to 2196 | III | 2196 city | all four | The beacon's parts, Sera's safe path, the memorial |
| 15 | The City That Forgot Tomorrow | III | Locked city | 2196 2026 2049 | Loop (120 s), the fabricated record, Anja's lock (stabilize / free) |
| 16 | The Museum of Failed Worlds | III | Museum interior | 2196 2026 2049 | Three memories, comparison, the photograph |
| 17 | The Witness's Archive | III | Archive interior | all four | Recording 17 of 117, body lost / pattern persists, "They became the price." |
| 18 | The Fracture | III | Settlement / highway / tower | all four | Evacuate three houses, the canyon in the past, Mira's message |
| 19 | The Place Outside Time | IV | Liminal | all four | Symbols not markers, the bridge in the reflection, Mira |
| 20 | Mira's Memory | IV | Liminal memory | 2026 2049 2196 | The blue door, the first experiment, "I remember being your sister." |
| 21 | The Last Battle of the Continuum | IV | Command structure | all four | Standing order, the ally you earned, the Witness |
| 22 | The First Second | IV | Activation point | all four | The village's chain, evidence over memory, the final chamber |
| 23 | Afterzero | Finale | Rain City / settlement / ruin | all four | The Witness holds the route; Mira; Endings A, B, C |
| B | The Water That Remembers | Cases | Settlement | 2049 2026 2196 | The mural, three stone gates (optional) |
| C | Two Records, One Disaster | Cases | 2196 city | 2196 2026 2049 | Two first operators, both true (optional) |

## Tests

- `tests/lastversion.test.mjs` (in `npm test`): the state engine (states per room, effects,
  anchors, save/restore), string conditions, the edition's namespace and build settings, the
  speakers and their distinct voices, the 23 missions in order with their quoted lines, the
  Mission 10/13/23 choices, intents and conditions, and solvability by construction for every
  mission level (every obstacle has a state or the anchor that gets past it, every generated
  route uses only its room's states, every beat has something that completes it, every place
  can snap back to PRESENT, every prologue condition is set by something), the NPC state model,
  quest chains A and D, echoes.
- `tests/lastversion.mjs` (browser bot): the title, NEW GAME into the Prologue, Missions 1–3
  played through (both quest chains) into Act I, then Missions 5, 13, 14 and 19 and the Finale
  to an ending, a generated interior walked with real movement, the save namespace.
