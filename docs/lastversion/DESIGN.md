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
| Everything the edition changes | `game/js/editions/lastversion/`: `index.js` (title, states, labels, looks, speakers, engine options), `Runtime.js` (chapters, missions, objectives, scenes, choices, stability, Echo Step, anchors, the case board, endings), `prologue.js` (Missions 1–3), `acts.js` (Acts I–IV, the Finale, the endings, the optional cases), `npcs.js` (the people), `Build.js` (hand-built interiors and props), `dress.js` (what each year of a place looks like), `inversion.js` (REVERSE: input, targeting, charge, the rules, its HUD and sounds), `processes.js` (the things REVERSE can hold, and the mission landmarks they stand at). |
| Hooks in the shared code | `main.js` hands the game to the edition's runtime where the edition is on (`this.edition`), and nowhere else. `RealityEngine` takes a configurable state set. The generators take a few optional fields (`zone.themes`, `zone.names`, `zone.drones`, `zone.overlay`, `deck.mechs`, `story.mechDeck`, beat kinds `scene`, `choice`). Each hook is a no-op for the Station Zero game; `npm test` and the default suites prove it. The v2.1 overhaul's hooks so far: `main.js` settings text, comfort mode reads "Steadier camera, no flashes" when the edition is on (1 line, U1). REVERSE's moving colliders are edition-owned entries in `DeckWorld.temps` (`t: Infinity`, removed by the edition), so `DeckWorld.js` is not changed. |

Its own look: the title reads AFTERZERO / THE LAST VERSION OF EARTH in front of rain, a city's
glow and the black ring; the chapter list is PROLOGUE, ACT I–IV, FINALE, CASES; you are Kai
Varen (the realistic man in shirtsleeves, `real_m`) until you choose otherwise; the HUD names
the years: 2049, 2026, 2196 (at most three pips, only the mission's own years). There is no
law-writing device and no TICK in this edition: the dock says THINK, ECHO STEP and CASE, the
touch SHIFT button is YEAR (coloured by the year it will switch to), `L` and `J` open the CASE
BOARD. From Mission 11 a REVERSE chip sits beside the year card, with a ⟲ button on touch.

## The bible → the engine

### Three years (and no fourth state)

| Bible | Engine |
| --- | --- |
| Temporal State Switching: authored states of one location, not free date selection | `RealityEngine` runs on `['PRESENT', 'PAST', 'FUTURE']`, baseline `PRESENT`, with no law slots (`slots: 0`, `laws: []`) and only the past's own effects. Each mission lists the years its region was authored with (`states:`); `setAvailable` gives each room those, cycling (`Q`) visits only them, and a year a place does not have is refused ("This place does not have that year"). `1 2 3` pick by position; `4` is REVERSE. |
| Past: original structures, causes, objects that no longer exist | `PAST` is the residue state: echo geometry (the bridge that stood here, the stairs that were pulled down) is visible and holds weight (`stateEffects.PAST = { echoVisible, echoSolid }`); records show what they said first (contradiction beats). Items from the past are echo items. |
| Present: investigation, machinery, grounded stealth, human conflict | `PRESENT`: the place as built; locks read it (a key from another year must be anchored). Watchers patrol it. |
| Future: consequences, traversal through ruins, unstable zones | `FUTURE`: authored consequences (the parked lift across Helix's collapsed hall, the drained village, the third device), ivy, roof gardens, moss and fallen slabs on every place that has a 2196 (`dress.js`), and in unstable regions the Chronolith's stability drains. |
| Inverted: "temporarily reverses selected processes, subject to energy and stability limits"; "Inversion: reverse selected motion or mechanism; local and readable; no universal rewind of all consequences. Mission 11" | Not a year: a verb, **REVERSE** (below), unlocked in Mission 11. Kai aims at one process he can see and holds it running backwards while the Chronolith's charge lasts. Places that run backwards on their own (Mission 11's reversed wards) are a room override (`engine.setOverride(room, { timeReverse: true })`), not a state: their sweepers and patrols turn the other way and the intercom speaks backwards. Gravity never changes (`engine.gravity()` is always −1). |
| Each state looks and sounds different | `DeckWorld.setLook` tints the materials per state (warm stone then, cold steel now, moss and rust later) and puts the city's windows out in 2196 (nobody has power); in open districts `Runtime.stateFog` / `stateDensity` / `stateNight` give each year its own air and hour (2026 a warm sepia haze at dusk, 2196 a pale green mist), each year its own colour grade where the renderer grades, and `stateWeather` its weather (2196 pollen, 2026 dry); `audio/Synth.js` plays a different chord progression per state (The Need to Fix It, Living History, Beautiful Catastrophe) and an ambience bed per region. A mission can name its states for what they are there (Mission 5's village: THRIVING / ABANDONED / FLOODED; Mission 4: BEFORE THE FIRE / THE VILLAGE). |

### REVERSE: the bible's inversion as a local verb

`inversion.js` (the verb) and `processes.js` (the things), per OVERHAUL.md §7.

| What | How |
| --- | --- |
| Input | `R` (a capture-phase key listener that also stops the shared `R` → year switch; `Q` stays the year switch), `4`, the touch ⟲ button left of YEAR (60 px, a conic charge ring, REVERSE / RELEASE, hidden until it is unlocked, dim with no target; it binds its own touches), and the floating target label. One press starts a hold on the aimed process; a second press lets go (D5). |
| Targeting | Processes in Kai's room and year (their `when`), within reach (22 m outdoors, 14 m indoors), nearest the crosshair (10°, 16° on touch; ties to the nearer), in line of sight (`player.rayDistance`, best two only); on touch, also the nearest within 8 m in front. A silver ring and a label: "⟲ THE TRAY · 8 s", or "✕ NOT A PROCESS" / "✕ A MEMORY" on refusals. |
| Lifecycle | Start; the process runs from rest to its origin; holds there while the charge drains; warns in the last 1.5 s (faster ticks, a flicker); lets go and runs forward again. A hold also ends at a year switch, a snap back, walking off beyond reach × 1.6, or pressing on another target. A solid piece never seats into Kai: it hovers 0.3 m short. |
| Charge and stability | 8 s from Mission 11, 10 s after Mission 13, 12 s after Mission 18 (`campaign.inv`, saved). Weight (charge per second held): light 0.5, medium 1, heavy 1.5. Start: 0.5 s and 0.03 / 0.06 / 0.10 stability. Refused under 1 s of charge or 0.2 stability ("Not now. The Chronolith can't hold anything back."). In unstable regions a hold drains stability like being out of the present. Recharge 1.25 s/s after 1 s idle. Minimum hold 0.6 s. A wrong lock bolt costs 1.5 s and 0.03. |
| Rules (the case board's ABILITIES) | R1 One thing at a time. R2 It holds only while charged, then goes forward again. R3 What you do while it holds stays done. R4 If nothing pushes it forward, it stays reversed (settled; saved). R5 Reversing something already running backwards runs it forwards. R6 Never a person, never a memory. |
| Process kinds | `collapse` (bridge, stair, slab: pieces fly back in reverse fall order and seat as solid), `fall` (a lift car or a beam rises along its arc and carries Kai), `flow` (water, smoke, a spilled glass draws back), `burn` (char recedes; a burnt document is readable while held), `lock` (only the last-fitted bolt backs out; any other jams; settled), `ink` (the newest layer un-writes; settled), `recording` (plays forwards once; R5), `patrol` (a watcher moonwalks its last 8 s and un-sees Kai), `mechanism` (runs backwards), `projectile` (flies back to its origin and never lands; settled), plus authored refusals. At most 12 per level and 10 parts each; one merged mesh per process at rest. Facts: `rev_<id>` while held, `inv_<id>_done` when settled. |
| Moving colliders | Each solid piece is an edition-owned `deckWorld.temps` entry (`{ mesh: an empty Object3D, box, t: Infinity }`) whose box changes in place; the edition removes its own entries on release and unload, so none ever reaches expiry. |
| How it reads and sounds | Reversible things glint silver every ~4 s within 25 m once REVERSE is Kai's; the aimed one pulses; motes are drawn into the seams; a violet edge vignette while holding (comfort mode removes the flicker and the vignette); colour #c9b8ff. Procedural sounds through the game's mixer: a reversed tick on acquire, a reversed swell and material grains on start, a two-note drone and a reversed clock tick while holding (the music ducks to 0.35), a creak and forward grains on release, a ratchet-clack-deny on a jam, a dull stop on a refusal; an inverted watcher coming into view drops the music for 0.4 s. |
| HUD | `#state` is wrapped in an edition flex row (`#lvTop`, moving the node so HUD keeps its reference) with the REVERSE chip (`#lvReverse`: "⟲ 8s" with a charge ring, "⟲ THE TRAY 4.1" while holding); a thin charge ring round the crosshair when aiming or holding. CSS is injected as `<style id="lvInv">`, scoped to `body.lastversion`; `HUD.js` is not changed. |
| Saves | `campaign.inv` (charge, cap) and `deckWorld.flags` (settled processes, each lock bolt that is out). A v2.0 save is migrated in `resume()`: INVERTED rooms go to the baseline, INVERTED leaves every room's list, the law slots go, `campaign.inv` gets its default. Chapters started from the menu prime `has_inversion` from Act III (and `inv_cap` 10 for Act III, 12 from Act IV); Act II reaches it by playing Mission 11. |

**Documented deviation (D1).** The bible's art line "gravity changing only in readable zones" is
honoured only as objects whose fall reverses (a lift car rising, a tray going back onto its
trolley). Kai's own gravity never changes, as the player asked: no ceiling routes, no gravity
flip, no law device, law tokens or "MEMORY KEY" labels (keys from the past read "KEY (2026)").

**Mission 11, where it is taught** (in the hospital's current generated rooms; every piece is
placed by the landmark names of OVERHAUL.md §5 through room-relative anchors, `deck.anchors`, so
the open hospital of U3 can re-place it through `level.landmarks` / `level.sites`):

- Triage, the colonnade and the annex corridor run backwards on their own (reversed wards: a
  shimmer at the door, the intercom's "Temporal discontinuity." played backwards inside).
- In the records hall the charred third file un-burns three seconds in every ten, too short to
  read; standing by it, the Chronolith catches the rhythm: `has_inversion`, Kai's line, the R1/R2
  toast. The tutorial: the tray that fell off its trolley (fall), a spilled glass (flow), the
  burnt annex door (burn). Held, the file reads "ADMITTED BY: K. VAREN" in an older hand, which
  opens the way on. The flatline monitor by the empty bed refuses: "✕ NOT A PROCESS".
- Ward 32's door has a reversing lock of four bolts fitted RING, BAR, STAR, CRESCENT. Three clues
  give the order: the 2026 maintenance tag (readable in 2026), the twin lock in the reversed ward
  next door coming apart on its loop last-fitted first, and the intercom chime's four tones. Only
  the last-fitted bolt still in will back out (and stays out); a wrong one jams. When the last
  bolt is out, `inv_m11lock_done` opens the door and plays the lock scene.
- The sound that grows quieter, the returning hazards and Nurse Odile come with the Mission 11
  rewrite (U7).

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
| Temporal scavengers, elite enemies who rewind injuries, security that mimics Kai | Watchers; in a reversed ward their patrols run backwards, and from Mission 11 REVERSE can walk a watcher back through its last 8 seconds (a `patrol` process) so it forgets it saw Kai. |
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
  to what the mission's years can do (residue bridges and stairs only where there is a PAST,
  watchers and sweepers; never a gravity or ceiling puzzle), with routes the tests walk.
- The per-state decoration of every place (ivy, gardens, moss, fallen slabs, scaffolding,
  lanterns), merged into one mesh per kind and year, and never solid.

## The missions

| # | Mission | Act | Place | States | What happens |
| --- | --- | --- | --- | --- | --- |
| 1 | The Last Normal Day | Prologue | Rain City (authored overlay) | 2049 (+ 8:13) | Anomalies, Rook's call, checkpoint, the Zero Second, rescue, "Do not build the machine", Mira; chain A |
| 2 | Helix Goes Dark | Prologue | Helix (hand-built) | 2049 | Emergency light, drone, three cells, Iven, the trustworthy officer, the rewinding unit, the drawing, the chamber |
| 3 | The First Switch | Prologue | Helix (hand-built) | 2049 2026 2196 | The switch, cable/power, the parked lift, chain D, the anchor, the fracture |
| 4 | The Man from the Last Day | I | Settlement | 2049 2026 | Telling-stone, inscription residue, the elder; the access card |
| 5 | The Village That Never Existed | I | Settlement | 2026 2049 2196 | River (past), wall (middle), gate (latest); the buried machine |
| 6 | The Clockmaker's House | I | Workshop interior | 2026 2049 2196 | Repeating arms, the clockmaker, the mechanism; the recording |
| 7 | The Broken Observatory | I | Observatory | 2026 2049 2196 | Alignment, the dates, Mira's recording |
| 8 | The First Death | I | Helix, altered | 2026 2049 | Staff records, the corrupted log, containment; VERSION 17 |
| 9 | Nine Minutes to Zero | II | Loop City | 2049 2026 | Loop (82 s), clocks, the cancelled order, the engineer |
| 10 | Enemies Who Remember | II | Detention block | 2049 2026 | Intake log, Sera, the prisoners' choice; Echo Step |
| 11 | The Inverted Hospital | II | Hospital interior | 2049 2026 (+ reversed wards) | REVERSE unlocks: the tutorial, the charred file, the reversing lock; Mira's file |
| 12 | The Man Behind the Glass | II | Helix, three years deep | all three | The 2026 corridor, the route, the Witness and the second Chronolith |
| 13 | The Nine-Minute War | II | War zone | all three | Field orders, three devices in three years, the stabilizer (faction) |
| 14 | Welcome to 2196 | III | 2196 city | all three | The beacon's parts, Sera's safe path, the memorial |
| 15 | The City That Forgot Tomorrow | III | Locked city | 2196 2026 2049 | Loop (120 s), the fabricated record, Anja's lock (stabilize / free) |
| 16 | The Museum of Failed Worlds | III | Museum interior | 2196 2026 2049 | Three memories, comparison, the photograph |
| 17 | The Witness's Archive | III | Archive interior | all three | Recording 17 of 117, body lost / pattern persists, "They became the price." |
| 18 | The Fracture | III | Settlement / highway / tower | all three | Evacuate three houses, the canyon in the past, Mira's message |
| 19 | The Place Outside Time | IV | Liminal | all three | Symbols not markers, the bridge in the reflection, Mira |
| 20 | Mira's Memory | IV | Liminal memory | 2026 2049 2196 | The blue door, the first experiment, "I remember being your sister." |
| 21 | The Last Battle of the Continuum | IV | Command structure | all three | Standing order, the ally you earned, the Witness |
| 22 | The First Second | IV | Activation point | all three | The village's chain, evidence over memory, the final chamber |
| 23 | Afterzero | Finale | Rain City / settlement / ruin | all three | The Witness holds the route; Mira; Endings A, B, C |
| B | The Water That Remembers | Cases | Settlement | 2049 2026 2196 | The mural, three stone gates (optional) |
| C | Two Records, One Disaster | Cases | 2196 city | 2196 2026 2049 | Two first operators, both true (optional) |

## Tests

- `tests/lastversion.test.mjs` (in `npm test`): the state engine on three years (states per
  room, effects, no laws or law slots, gravity that never changes, anchors, save/restore, the
  v2.0 INVERTED save migration), no INVERTED, gravity or ceiling anywhere in the missions or their
  built levels, no law tokens or MEMORY KEY labels, the two tiers of hints, every REVERSE process
  record valid (aim and origin boxes inside its room, reach, weight, at most 12 per level and 10
  parts), the ten process kinds built and run headlessly, REVERSE never required before Mission
  11, Mission 11's tutorial, file, refusal and lock (its three clues list the order), a lock that
  comes apart last-fitted first and remembers settled bolts, moving colliders that never expire, string conditions, the edition's namespace and build settings, the
  speakers and their distinct voices, the 23 missions in order with their quoted lines, the
  Mission 10/13/23 choices, intents and conditions, and solvability by construction for every
  mission level (every obstacle has a state or the anchor that gets past it, every generated
  route uses only its room's states, every beat has something that completes it, every place
  can snap back to PRESENT, every prologue condition is set by something), the NPC state model,
  quest chains A and D, echoes.
- `tests/lastversion.mjs` (browser bot): the title, NEW GAME into the Prologue, Missions 1–3
  played through (both quest chains) into Act I, then Missions 5, 11 (REVERSE: R does nothing
  before it is taught, the unlock in the records, R and the touch ⟲ button start and release a
  hold, a year switch releases it, the refusal, the file readable only while held, a jammed bolt,
  a settled bolt through a save and a load, the lock opening Ward 32), 13, 14 and 19 and the
  Finale to an ending, a generated interior walked with real movement, the save namespace.
