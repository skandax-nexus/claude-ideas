# AFTERZERO: The Last Version of Earth — status

An honest account of what the edition is today (the v2.1 overhaul, U1–U8, on the v2.0 app), measured against the
creator's bible. The bible describes a 25–30 hour campaign; this is a playable adaptation of all of it on the
AFTERZERO engine, all 23 missions written by hand on threads (the Prologue in U6, Acts I and II in U7, Acts III and IV
and the Finale in U8), with the CASE FILES after an ending. How it works: [`DESIGN.md`](DESIGN.md).

**Each chapter's length** (minutes; the model is the length model of §9.8, main path + side stories, which is each
sheet's target; the bot's is the game's own telemetry for the full run of `tests/lastversion.mjs` on 2026-10-22, 312 checks, all pass):

| Chapter | Target (model) | The bot |
| --- | --- | --- |
| Prologue | 97 (74 + 23) | 12.1 (Mission 1 walked in 9.7; Missions 2 and 3 by the Prologue's own checks, which place Kai beat to beat) |
| Act I | 191 (150 + 41) | 42.8 |
| Act II | 198 (161 + 37) | 34.0 |
| Act III | 194 (154 + 40) | 43.0 |
| Act IV | 156 (124 + 32) | 28.1 |
| Finale | 50 (40 + 10; the sheet allows 90) | 7.5 |
| The campaign | 886 (703 + 183), about 15 hours | 167.5, under 3 hours |

The bot knows every coordinate, reads nothing twice, never looks around or gets lost, asks for no hint and plays one
or two side stories a mission; the model, not the bot, is the estimate of a player's time, and neither has been
measured with a player.

## Built (by hand, playable, tested)

- **The edition layer.** Its own title (AFTERZERO / THE LAST VERSION OF EARTH, with its own
  backdrop), chapter list (Prologue, Acts I–IV, Finale, CASE FILES), save namespace (`afterzero.lv.`),
  settings, default look (Kai Varen, a realistic man), HUD names (the year pips 2049 / 2026 /
  2196, the REVERSE chip from Mission 11, YEAR on the touch switch button, the ⟲ touch button,
  THINK / ECHO STEP / CASE in the dock, the CASE BOARD), its own Android build (`EDITION=lastversion bash android/build-apk.sh`: app
  "AFTERZERO: Last Version", `com.afterzero.lastversion`, versionName 2.0.0,
  `AFTERZERO-LastVersion-v2.0.apk`, preview page with `window.AZ_EDITION='lastversion'`, published
  at [claude.ai/artifact/GDpG6YCybK2cj8P3gPXRrr](https://claude.ai/artifact/GDpG6YCybK2cj8P3gPXRrr)). The
  default build and every Station Zero chapter are unchanged.
- **Three years** (2026, 2049, 2196), authored per region; per-year looks (tint, hour, weather,
  decoration, music); the Chronolith stability meter with the snap back to PRESENT at the last
  anchor; causal anchors (`C`); Echo Step (`X`, unlocked in Mission 10); local loops. No gravity
  flip, no ceiling routes, no laws, law slots, law tokens or memory keys (v2.1, U1).
- **REVERSE** (v2.1, U1; the bible's inversion as a local verb, DESIGN.md): `R`, `4` or the touch
  ⟲ button holds one aimed process backwards while the Chronolith's charge lasts (8 s, 10 s after
  Mission 13, 12 s after Mission 18), with the six rules on the case board, the REVERSE chip and
  crosshair ring, procedural sounds, and ten process kinds in `processes.js`. It is taught in
  Mission 11, in the hospital's current rooms: reversed wards, the unlock in the records, the
  tray / glass / annex-door tutorial, the charred file readable only while held, the flatline
  refusal, and Ward 32's four-bolt reversing lock with its three clues. v2.0 saves that stood in
  an INVERTED room are migrated on load. Mission 11's sound puzzle, hazards and Nurse Odile, and
  every later mission's processes, come with the story rewrite (U6–U8).
- **Open places under a real sky** (v2.1, U2; DESIGN.md "Places under an open sky"): Missions 1–8
  stand in seven authored places (`places/specs/`): Rain City South, Helix (three wings round the
  court; the north wing is Mission 12's since U3), Helix in VERSION 17, the Ring Hill 3,000 years ago,
  the river bend with its upstream gorge, Old Town with Ezra Moll's light-well house, and the
  Ridge's observatory. Each has its own sky per year (a shader dome with sun, moon, stars, two
  cloud layers, lightning and Mission 1's ring-shaped hole), a horizon painted from one valley
  atlas (the Ring Hill, the Ridge, the Notch, the city, the sea at their true bearings), light,
  fog, weather and grade per year, years that differ by big pieces on one layout, and quarters
  the beats happen in (sector *i* is quarter *i*). Records and fragments are things of their place
  (telling-stones, ledgers, bronze plates, glass cases), never terminals or crystals. No ZoneGen,
  LevelGen, `dress.js` or Vessel look in Missions 1–8. What a place costs, measured with
  `tests/lastversion-perf.mjs` (an emulated phone: 915×412 at 2.625, medium quality, SwiftShader in
  this container; 2026-10-21) at quarter 0 of each year: **Mission 1** (2049 and "8:13") 27 visible
  static draw calls (24 merged scenery surfaces, the sky, two for the horizon), 193k triangles in
  the scene pass (the whole frame with its shadow passes: 274 draw calls, 366–374k triangles; the
  people, props and signs are the other draw calls), 11.8–11.9 ms of JavaScript a frame on
  average (17.8–19.3 ms p95); **Mission 4** (THE VILLAGE and BEFORE THE FIRE) 20–25 static draw
  calls, 22–24k triangles (37–41k for the whole frame), 3.2–3.3 ms of JavaScript (5.4–5.7 ms
  p95). Both are within §4.7 (≤ 70 static draw calls, a sky of 1, a horizon of ≤ 4, ≤ 300k
  triangles). The JavaScript times are SwiftShader's, at a tenth of the pixel ratio, for
  comparison between places rather than a phone's frame time.
- **The places after the U2 review** (2026-10-22; `git log 1ad80e4^..`): quarter checkpoints keep to their quarter
  (a quarter's `cp` box, a pad at every spawn; a quarter that is one of Helix's rooms gets no outdoor checkpoint), and
  deep water never sends Kai back under water (Mission 5's FLOODED: the setback also takes the place back to a dry
  year). The sun that rises in the Notch stands in its gap (Missions 3, 7 and 23); Missions 4, 6 and 7 have their own
  light (no shared golden sun or twilight; a unit test compares every year of Missions 1–8 with every other place's).
  Mission 4's pictograms stand on stones and its lintel is a doorway of THE VILLAGE only; Helix's wing storeys stand on
  the rooms, and a raised room stands on the wing's own storeys. Helix Court is Mission 2's hub (the lobby, the dark
  gallery and the staff lounge open onto it), the plant terrace is on the first-floor roof (4.5 m) and Mission 3's
  control room on the north wing's top floor (9 m); the conduit hall stays a ground-floor glass hall (its unit is a
  DeckWorld Sentinel, which the shared engine keeps on the ground). Mission 7's turntables turn: at the first sky each
  gangway stops across its gap 6 s in every 20 (`places/turntables.js`), in 2049 they are seized, by 2196 fallen, and
  the astronomers' roofs come down to the first. Mission 6's scissor stair stops at the third floor; the clock room is
  up the servants' stair, which stands in 2026 only (the deduced hidden stair is the way up). Mission 1's Rook's call
  spans the street wall to wall; Mission 8's second quarter spawns at the foot of the office stair, and a plaque on its
  river garden says the river was drained and led back (Rook's "drained riverbed" is a clue there). Mission 3's 2196
  line says what the year shows (re-recorded). The first switch into a year paints and fetches nothing on its frame
  (every year's horizon painted and every probe asked for at the load). **What a place costs now**, the whole frame
  counted (§4.7; `tests/lastversion-perf.mjs` checks it too): a place's people are culled again (world/Actors.js draws
  them unculled; they were 145k of Mission 1's 161k shadow triangles), so Mission 1 is 235–239 draw calls and 229k
  triangles for the whole frame (was 286 and 345–352k; 175k in the scene pass, 27 static draws), Mission 4 191 and
  197k (THE VILLAGE) and 71 and 37k (BEFORE THE FIRE), Mission 8 165–169 and 141k. Merging the scenery per 100 m cell
  was measured (22 more draw calls for 9k fewer triangles) and not kept. Not done: walk-in shop interiors in Mission 1
  (the shopfronts are facades) and colliders for the "8:13" tram (a flicker of the past Kai may be standing in).
  Checked: `npm test` 128/128; the whole browser bot (`node tests/lastversion.mjs`, 2026-10-22) 313 passed, 0 failed,
  with no page error (Mission 7's gangway ridden at the first sky with real movement, 2 m up to 4 m, and seized in
  2049; the survey's 1,657 pairs of views in different places, the closest 32 bits apart). Two earlier runs each
  failed one check that is now sampled right: the Zero Second's duck was read after two round trips to the page (on a
  busy machine past its one second; a page-side probe showed the music at 0.0001 from 0.1 to 0.9 s and back at 0.11
  by 1.1 s), and the gangway's sweep was counted from wherever its turn happened to be. No shared file changed.
- **Open places for Acts II–IV, the Finale and the cases** (v2.1, U3; DESIGN.md "Places under an
  open sky"): Missions 9–23 stand in fourteen more authored places and Helix's north wing:
  Northbank (the loop's river terraces, funicular and transmitter), the dam (cells cut into its face
  under the Notch), Rain City General (pavilions, the open colonnade, the reversed wards as interior
  rooms of the place, U1's Mission 11 processes at its landmarks), Helix's north wing (Mission 12's
  rooftop chase, the 2026 corridor, the 2196 sinkhole and the second ring), the delta port (trench,
  container canyons, rail yard, gantry crane, crater field), drowned downtown (the 2196 lagoon, the
  transit viaduct, the memorial), the lock city in a stadium bowl (tiers of houses under the lock
  halo), the sinkhole museum (a spiral ramp one and a half turns down), the radio-telescope array
  (racks that stand differently each year), the Fracture (a 420 m traverse under the storm of times),
  the salt mirror outside time (wrapping edges, a bridge seen only in its reflection, the unbuilt
  city upside down in the sky), Mira's memory (one plot three ways), the Continuum Spire above the
  cloud sea, the First Second (five wedges of earlier places round the twin chamber under an
  eclipse, the sky cut to match) and Afterzero's road (the light changing along it from night rain
  to the first sunrise in the Notch, the three ending skies). Case B uses Mission 5's gorge and Case
  C Mission 15's press tower. The edition no longer runs ZoneGen or LevelGen; `dress.js` and the `P`
  palettes are gone. The survey of all 23 missions' quarter-0 views (61 views) puts every pair of
  different places at least 21 bits apart (merged survey runs after the fixes in the second U3
  commit; the full bot's own survey is below). What the largest places cost, measured with
  `tests/lastversion-perf.mjs` (the same emulated phone, medium quality, SwiftShader; 2026-10-21) at
  quarter 0 of each year: **Mission 13** (the delta port, 240 × 200 m) 14–18 visible static draw calls
  (11–15 merged scenery surfaces, the sky, two for the horizon), 58–63k triangles in the scene pass
  (75–83 draw calls and 84–90k triangles for the whole frame), 3.7–4.5 ms of JavaScript a frame on
  average (6.1–8.1 ms p95); **Mission 14** (drowned downtown) 19–21 static draw calls, 29–30k
  triangles (51–52k for the whole frame), 3.2–3.8 ms (5.2–6.0 ms p95); **Mission 18** (the Fracture,
  120 × 420 m) 15–18 static draw calls, 19k triangles (30–31k for the whole frame), 3.4–3.9 ms
  (5.1–6.8 ms p95). All within §4.7 (≤ 70 static draw calls, a sky of 1, a horizon of ≤ 4, ≤ 300k
  triangles).
- **The places after the U3 review** (2026-10-22; `git log 90ad79a..`): every mission can be walked, and a test proves
  it. `tests/lastversion-reach.mjs` floods each mission's colliders from its spawn in every year it has (a step, a jump,
  a year switch where the body fits, Helix's lift, the wrapping edges, a REVERSE part that carries Kai, drowning
  water) and must reach every interaction, person, crowd, thread trigger and process, an unstable mission with no
  stretch over 60 m outside its home year; nobody may stand on nothing (`tests/lastversion-reach.test.mjs`, in worker
  threads, about 50 s). What it found was fixed: Mission 9's transmitter (two houses stood on it; the gallery floor
  covered the stair), Mission 15's press tower (its only opening faced a 7 m drop; the bowl's nested terrain put the
  pitch's stalls and people at the rim's 13.6 m), the gorge stairs of Mission 5 and Case B (they ended inside the
  terraces), Mission 14's antenna platform (railed off), a cairn inside a tower and the bank's fragment inside the bank,
  Mission 18's floor plan inside the stump, Mission 19's gallery trigger (the railed light well), and fragments out of
  reach in Missions 1, 4, 7, 10, 21 and 22. Mission 14's memorial, statue and school are 2196's (in 2026 and 2049 the
  Helix Plaza: a fountain and the company's entrance canopy). Quarters are where they say: vertical places name height
  boxes (`cp`), threshold spawns belong to the quarter they open, and the save's quarter moves on only once the story
  has reached it (a unit test checks every spawn and main thread). Watchers patrol open ground (a unit test samples
  every path). Checked: `npm test` 131/131; the whole browser bot (`node tests/lastversion.mjs`, 2026-10-22) 313
  passed, 0 failed, with no page error (the survey's 1,657 pairs of views in different places, the closest 22 bits
  apart). No shared file changed.
- **The cast after the U4 review** (2026-10-22; `git log 4579986..`): crowd walkers keep to the ground (each route
  is followed over the level's solid boxes when it is cast, a step of at most 0.4 m, never into a wall or off a
  ledge; seventeen paths moved onto open ground; a unit test walks all 329 walkers leg by leg in every year). A
  chapter's waiting card never stays over play: it is cleared when the wait ends (a resumed save with its people
  cold), drawn over the fade between chapters, a stalled model gives up after 90 s, and whoever is still missing
  stands in as a hologram of their height, never as a doctor (the bot loads a cold Act II save and checks it).
  The CHARACTER buttons are hidden: Kai has one look, and the screen was Station Zero's. Ward 32's figure stands in
  its ward once the lock is open, in 2049 only; recolour source maps are let go after their recolours; Mission 22
  has no watchers; the settlement's crowd no longer says Niko's line before he does. The cast: Sera, Mara, Iven
  and the Gardener wear their own faces (`rb_sera`, `rb_mara`, `rb_iven`, `rb_gardener_f`), and Juno's, Varga's,
  Kade's, Ren's FIELD JACKET and the airline captain are out of the edition; two more 2026/2049 crowd faces
  (`rb_civ_m3`, `rb_civ_f4`) widen every working role; one face walks at most twice a year in a place's crowds,
  and never one placed by hand there; the Place Outside Time's echoes are people Kai has met, by name; Mission 5's
  villagers are echoes in FLOODED too, Mission 10's twelve prisoners flicker in the loop cells until released,
  Loop City's evacuees wear dust, the lock city's are holograms. The costumes: Mira's yellow rain jacket and the toy
  boy's red one (recoloured sleeves to the wrist, a hood fitted to the head), Odile in a navy skirt and white shoes,
  Sera's Continuum disguise with a trooper's helmet (its visor raised) and a plate carrier, and the boys' jersey
  without its 38 (painted out of the map at conversion). The packs the recast crowds changed (common, act1, act3,
  act4) were recorded again: no misses. The edition's APK (`EDITION=lastversion bash android/build-apk.sh`,
  2026-10-22) is 46,786,715 bytes with every line recorded: 27.4 MB of people (41 files), 15.0 MB of voice, 3.2 MB
  under the 50 MB budget; its preview is 54.6 MB with no file over 4 MB. Checked: `npm test` 133/133; the whole
  browser bot (`node tests/lastversion.mjs`, 2026-10-22) 315 passed, 0 failed, with no page error: the campaign from
  NEW GAME to Ending C, a save loaded before its chapter's people, the wait over the fade, every line said (1,551)
  from the packs, `speechSynthesis` never asked, and the survey's 1,657 pairs of views in different places (the
  closest 26 bits apart). No shared runtime file changed (a comment in
  `android/build-apk.sh`; `tools/rocketbox-textures.py` gained TRANSPLANT, used only for `Male_Child_02`, which
  Station Zero does not carry). Still open: the settlement's wardrobe (below), and the cast-load check of
  `tests/lastversion-perf.mjs`, which counts only tasks over 50 ms and ran on a desktop CPU.
- **The voice and score after the U5 review** (2026-10-22; `git log ff12d75..`): a staged moment holds Kai and only a
  deliberate input skips its lines (a tap on the view, a click, Space or E; Enter or SKIP the whole moment): movement
  keys, the touch stick and the dock never skip, the stick no longer walks Kai out of the shot (the poll reads no
  movement while a moment plays), and the actions that act in the world (use, the year, echo-step, the anchor, THINK,
  REVERSE) wait; the bot holds the stick, presses W and the year key in one and checks nothing moved or was skipped.
  The Zero Second is staged as the bible's central cinematic (the stopped clock's face, then the wreck of the 41 from
  the platform's east end), and so are the voice in every speaker, the woman at the far end (from the track bed) and
  Mission 3's fracture. The line walk builds each mission that adjusts its place after a choice with its facts
  granted, so a consequence's lines are recorded (U8 had already moved Jun's Finale payoff into Mission 23's scenes;
  the records, calls and statements the review heard narrated are in their speakers' voices since U6-U8, and a test
  keeps them so). A host that compresses the packs no longer silences the edition (the loader's buffer grows); a line
  passed over while its pack loads is still a miss if the packs lack it; the pa and echo reverb sends follow the
  Dialogue row; the music cues follow the Music row; percussion and the fire's crackle are on their own buses; the
  noise is made once per audio context (no buffer per bed, line or flute note); the station chime sounds before the
  announcement; the fracture's swell is heard before its silence; Mission 13's card reads 'The Nine-Minute War'. An
  opening cut short hides its card and a dropped outro leaves no gate shut (a player's load reloads the page first, so
  only an in-page load, the bots', reached either). Shared: `game/js/audio/Voice.js` (two edition-only paths; Station
  Zero: `node tests/smoke.mjs` passed, `node tests/qa.mjs` 26/26). No line changed, so no pack was re-recorded
  (`voice-lv.sh check`: all up to date). Checked: `npm test` 135/135; the whole browser bot (`node
  tests/lastversion.mjs`, 2026-10-22) 317 passed, 0 failed, with no page error: NEW GAME to Ending C, every line
  said (1,596) from the packs (those said while a pack loaded judged once it came), `speechSynthesis` never asked,
  and the survey's 1,657 pairs of views in different places (the closest 25 bits apart). Still open: the human ear
  check (below).
- **The Prologue after the U6 review** (2026-10-22/23; `git log 54a6a06..`): a load in a rewritten mission puts Kai at
  the checkpoint he saved at, in its room (the furthest quarter's spawn alone could strand him: Mission 3 saved in the
  lab after the power loaded on the court with the lab's 2026 frame shut; only a save the format restarted, with no
  position, starts there now). A moment that sets its facts in callbacks and that a save cut off plays again once
  the load's card is over (a mission's `resumes`): Mission 1's Zero Second and its rescue (the wrist, Rook, the voice
  in every speaker; without it Mira never appeared), Mission 3's first cycle and fracture; a pre-U6 save past the
  pursuit gets `wrist_cut` and its objective is the raincoat. The auto exit lives on the runtime, not in the saved
  flags. A thread a player can skip is walked past once the story moves on (Mission 1's photo, Mission 2's lobby,
  Mission 3's excavation office, which no longer pins SITE ZERO without its log); a unit test walks Missions 1-3 with
  each left undone. A load in Missions 2 and 3 recaps its own mission. The story: the plaza deduction names only the
  anomalies Kai found (the roof's pulsing window is a sight, not one of them) and opens on Kai's "There's a cause.
  There's always a cause."; Pryce's 05:52 statement read a door log the director's office had cleaned at 05:50, and
  at 08:14 her own badge record had his card (Kai notices; her code fails for the cleaned log); in 2026 the chamber's
  cradle stands empty and the ring is in the ground at the dig, as its log says; the pursuit runs about 180 m (down
  the stair, across the concourse, through the bus depot, back along the fence) and ends in the knot of Helix's people
  waiting at the staff gate, where she is gone (Rain City's faces allow 13 walkers: the knot is cast first); the cold open is 05:40 (the rain before dawn, one
  window pulsing in Helix's crescent across the river, no commuters yet; its first shots, which had looked into the
  Ring Hill's foot, look at the crescent from high over the plaza and the canal) and the title 08:02 again; THINK at the
  checkpoint no longer says any answer will do; the card names no weekday. The prologue, common and act1 packs were
  recorded for the changed lines (31 new recordings; `voice-lv.sh check`: all up to date). Already fixed by U7 and
  U8 when the review was read: the case board's SIDE STORIES and TRACK (by mission key; the bot tracks one in
  Mission 4), the because line on touch screens (smaller, two lines), the epilogue keyed to `rook_fate`, Kai's birth
  year, the per-chapter save format (`REWRITTEN_IN`), staged moments kept out of the saved flags, and the thread pass
  four times a second rather than every frame. Not done: the length the model claims (below, under Scale). Checked: `npm test` 139/139;
  the whole browser bot BOTRESULT. No shared engine file changed.
- **The NPC system** of the supplement: trust, knowledge, quest state, temporal state, faction
  standing and evidence flags in the save; dialogue choices by intent (challenge / comfort /
  investigate / withdraw); barks; echoes standing in for people absent from a state; the case
  board (evidence journal).
- **The story's threads, and the Prologue rewritten on them** (v2.1, U6; DESIGN.md "Threads and ledgers";
  OVERHAUL.md §3.3, §5 M1–M3, §9): `Threads.js` (twelve thread kinds, side stories tracked from the case board, the
  objective with its *because* line, THINK's three tiers per thread, the chase, staged moments, deductions and
  residue records; every mission not yet rewritten runs through the legacy-beat shim) and `ledger.js` (the
  campaign's questions, clues C1–C12, consequences, what WHAT YOU CHOSE says, PREVIOUSLY and the epilogue lines).
  Missions 1–3 are one map each with soft quarters (3, 5 and 5), a cold open and a hook; a save loads where it was
  taken (since the U6 review; its furthest quarter before) after a PREVIOUSLY card, each new quarter autosaves, and the case board has THE QUESTIONS, SIDE
  STORIES (TRACK), WHAT YOU CHOSE and ABILITIES. Mission 1: the 05:40 cold open before the title, the photo, the
  avenue's anomalies read together at the plaza clock, the florist's older Kai, the photo booth, Officer Pryce's
  05:40 line, Jun and the board, the Zero Second, the rescue that cuts Kai's wrist (`wrist_cut`), the voice, the
  pursuit of the woman with Mira's face (a chase that waits for him) and her yellow raincoat. Mission 2: what the
  lobby kept of 05:38, Dr. Lin with no shadow, the Site Zero print, the camera room, the three officers'
  recordings in their own voices, Iven, the unit, the junior pass, and Rook in person at the chamber door
  (`trust_rook`). Mission 3: the touch and `wrist_mark`, the first cycle, the lab whose wall is a frame in 2026
  onto the court and Rook's 2026 excavation office (`ev_site_zero`), the 2196 plaque, chain D, the fracture.
  The length model (§9.8): Mission 1 25 + 10 minutes (main + side), Mission 2 27 + 7, Mission 3 22 + 6; the
  Prologue 97 minutes, 76% of it main. **Mission 1 walked by the bot** (`tests/lastversion.mjs`, real movement,
  every line at its own length, with the florist and Last Train Home, 2026-10-21): **10.4 minutes** of game
  time against the model's 35 (9.7 in the whole bot's run): the bot knows every coordinate, reads nothing twice, never looks around or
  gets lost, and skips no line but asks for no hint. The packs were re-recorded for it: `prologue` 604
  recordings (2.39 MB, 4,142 words of the 4,200 budget), `common` 668 (2.55 MB, 2,236 words), `finale` 62
  (0.33 MB), and `act1`, `act2`, `act4` and `cases` re-packed from the cache for lines that moved between
  groups; the edition's voice is 9.0 MB.
- **Acts I and II, rewritten on threads** (v2.1, U7, 2026-10-22; DESIGN.md "Acts I and II as written"; OVERHAUL.md §5
  M4–M13, §9.7, §11 U7): `act1.js` (Missions 4–8) and `act2.js` (Missions 9–13), re-exported by `acts.js`. Each mission
  is one map with its sheet's soft quarters, a cold open, main threads with their *because* lines and three hint tiers,
  side stories on the case board, and a hook into the next. `Threads.js` gained `loop` (Mission 9's resets: each moves
  the patrols to the next round, burns one more shopfront on the quay, restarts the crowds further along, and the rain
  falls upward for a second) and `playback` (Mission 5's villagers walking out of the hearth's echo; Mission 8's last ten
  minutes put in order and re-enacted by echoes). The choices the sheets keep are set and read later (§9.7):
  `niko_told`, `machine_buried`, `water_route` (chain B, moved into Mission 5's gorge), `ezra_debt`, `mira_tape`,
  `rook_fate` (who directs Mission 10, its office and its cells, and Mission 12's corridor follow it),
  `warned_evacuees`, `prisoners_freed` / `prisoners_held`, `odile_released`, `faction`. REVERSE's set pieces: Mission 11's tutorial, file and lock, the music box
  quieter the nearer Kai comes, a gurney, an IV stand and a pane that go back where they were (a hit is a setback),
  Odile's echo; Mission 12's chase that never fails, the fallen stair the Witness reverses in Kai's colour before Kai
  follows, the beam, his footsteps, a drone that can be patrol-reversed; Mission 13's shells from each side
  (`ev_both_sides`), the burial (`ev_witness_cause`), the roll-call wall, a patrol, and a charge cap of 10 s after it.
  Mission 10's troopers remember: after a catch they start their rounds elsewhere and look further ("They moved.").
  Rook is in his office in Mission 8, young Kai on Mission 11's bench. The length model (§9.8, main + side minutes):
  M4 29 + 7 = 36, M5 30 + 10 = 40, M6 26 + 10 = 36, M7 32 + 6 = 38, M8 33 + 8 = 41 (Act I 191); M9 33 + 8 = 41, M10
  30 + 6 = 36, M11 32 + 8 = 40, M12 34 + 5 = 39, M13 32 + 10 = 42 (Act II 198); every main path is 72–87% of its
  mission. **Missions 4–13 walked by the bot** (`tests/lastversion.mjs`, 2026-10-22: real movement where a straight walk gets there, Kai placed past stairs,
  terraces and walls, every line at its own length, one or two side stories a mission), in minutes of game time
  against the model: M4 8.6 of 36, M5 10.8 of 40, M6 6.0 of 36, M7 7.3 of 38, M8 8.8 of 41 (Act I 41.5 of 191); M9
  9.2 of 41, M10 4.9 of 36, M11 7.9 of 40, M12 7.0 of 39, M13 7.8 of 42 (Act II 36.8 of 198), a fifth of the model.
  The bot knows every coordinate, reads nothing twice, never looks around or gets lost, asks for no hint, plays 0.3–3.5
  minutes of side stories where the model counts 5–10, and was placed 66 times over 1,796 m a straight walk could not
  take; the model, not the bot, is the estimate of a player's time, and neither has been measured with a player.
  Speech: 516–1,000 words a mission (the budget is 1,000: M4 1,000, M5 948, M6 927, M7 778, M8 973, M9 734, M10 516,
  M11 856, M12 557, M13 832). The packs were recorded for it (`tools/voice-lv.sh`): `act1` 739 recordings (2.80 MB),
  `act2` 655 (2.29 MB), `common` 605 (2.43 MB), and the other groups re-packed for lines that moved; the edition's
  voice is 11.8 MB (budgets: 12 MB a pack, 22 MB in all), the Station Zero pack unchanged. An audition page of 40 of
  the new clips was written (`tools/voice-audition.py`, machine-checked: 1 flagged, a mural-cliff line that peaks at
  full scale); nobody has listened to it.
- **The Prologue, fully authored** (before U6; rewritten above): Mission 1 The Last Normal Day (Rain City, the anomalies,
  Rook's call, the checkpoint, the Zero Second, the rescue, the voice, Mira), Mission 2 Helix Goes
  Dark (emergency light, the drone, three cells, the trustworthy officer, the unit that rewinds
  its damage, the drawing, the chamber), Mission 3 The First Switch (the three years of Helix, the
  anchor, the fracture), with every quoted line of the bible; **quest chain A** (Jun Park, Last
  Train Home: the station falls back to 8:13 every 41 seconds; reroute the relay there; the line
  or the evidence) and **quest chain D** (Iven Marr, The Technician's Key: shift notes, the
  past-state service panel, the 2049-only drone Iven keeps busy, the lock that resets on every
  switch, the raw log or the trapped team), each with both outcomes and a later consequence.
- **Acts III and IV and the Finale, rewritten on threads** (v2.1, U8, 2026-10-22; DESIGN.md "Acts III and IV and the
  Finale as written"; OVERHAUL.md §5 M14–M23 and its "As built (U8)" notes): `act3.js` (Missions 14–18), `act4.js` (19–22)
  and `finale.js` (23, the endings, the post-credit voice), re-exported by `acts.js`; no mission or case runs on the shim
  of legacy beats any more. Nothing that ends one of these missions answers before its story gets there (`gateAfter`: a
  thread's own spot, trigger, deduction, record or playback waits for the threads it comes after; Mission 18's slabs are
  in sight from the start but answer REVERSE only once the stabilizer holds, `arm`). `Threads.js` gained `hold` (Mission 18's pylons: two minutes in phase, one pylon drifting at a
  time, re-anchored in its own year; the Unwritten hold one, the freed city slows the drift). Missions may have a home
  year (2196 for 14–16 and 18, 2026 for 20), scenes built when used (Mission 20's board), watchers that answer an
  afterimage (Mission 21's elites snap back five seconds) and talks by a person's own id. REVERSE's new set pieces: the
  bank's lift car ridden 24 m up its shaft, the transit bridge's span, the moss prints (M14); the card's forged layer and
  two original archives, the departure board (M15); the memory on its reel, a shattered case (M16); the shredded sheet,
  the mimics' counter-reverse (M17); the core's slabs as a stair, the potter's porch (M18); the reflection's lag (M19);
  every memory refusing, Mira answering the first try (M20); the elites' rewind, the arena's fallen slabs, an ally's
  thirty-second hold (M21); the clockmaker's arm on its beat, the seals last fitted first, the two logs (M22); the street
  the Witness holds and the bridge Kai holds (the Finale). The choices the sheets keep are set and read later:
  `trust_sera`, `garden_restored`, `city_freed` / `city_stabilized`, `photo_taken`, `letter`, `last_signal`, `m20_lead`,
  `ally`, `ending`; the epilogue has 21 lines, one per fact set (Ending C adds the letter to a brother Mira never had;
  Rook's testimony is said only where Kai exposed him). Three cold opens stage their people while they play (the
  children at Mission 20's fridge, the Director's broadcast in 21, the Witness at the station's microphone in 22);
  Mission 14's statue is Kai's own body in stone; the people on the Finale's road stand in every year, never as echoes;
  and the crowds of the lock city, the quarry, the array, the drowned city's 2026 builders, the fracture's drivers,
  Mira's street and the Spire speak their own lines instead of another mission's.
  The length model (main + side minutes): M14 30 + 8, M15 30 + 10, M16 30 + 8, M17 32 + 6, M18 32 + 8 (Act III 194);
  M19 30 + 8, M20 30 + 10, M21 34 + 6, M22 30 + 8 (Act IV 156); the Finale 40 + 10 = 50. **Missions 14–23 walked by the
  bot** (the full run, 2026-10-22), in minutes of game time against the model's 38–40 (the Finale's 50): M14 7.2, M15
  9.3, M16 10.0, M17 6.1, M18 10.4, M19 8.6, M20 6.6, M21 4.8, M22 8.1, the Finale 7.5, with one or two side stories each
  (0.2–1.9 minutes of them a mission). Speech: 612–1,000 words a
  mission (the budget is 1,000: M14 1,000, M15 986, M16 774, M17 657, M18 779, M19 674, M20 712, M21 612, M22 663; the
  Finale 965 of 1,800 with its endings and epilogue). The packs were recorded for it (`tools/voice-lv.sh`, every group
  checked byte for byte against its script, 2026-10-22; voice.ogg + voice.json): `common` 2.52 MB (636 recordings, 18.7
  min), `prologue` 2.39 MB (593, 18.4 min), `act1` 2.82 MB (740, 22.1 min), `act2` 2.27 MB (650, 18.0 min), `act3`
  2.72 MB (767, 21.4 min), `act4` 1.64 MB (456, 12.9 min), `finale` 0.67 MB (163, 5.1 min): 15.0 MB and 117 minutes of
  speech in 4,005 recordings (budgets: 12 MB a pack, 22 MB in all). `cases` is an empty pack now: every replay speaks from
  its own mission's pack.
- **Casting, crowds and watchers** (v2.1, U4; DESIGN.md "Casting, crowds and watchers"): every
  person is cast by role, gender, age and era. Mission 1's checkpoint officer is Officer Pryce, a
  security officer in Helix black (`rb_security_f`), no longer a doctor; Dr. Lin and Mira share one face
  in two wardrobes; the Witness wears Kai's; the Child, young Kai, Tomas and every crowd child have
  children's bodies; Ward 32's bed holds a silent, flickering figure of Mira and Nurse Odile speaks
  for the ward. 31 Microsoft Rocketbox avatars (MIT, `game/assets/characters/CREDITS.md`) were
  converted for it: 18.3 MB (16 named at 1024 px, 11.2 MB; 15 crowd bodies at 512 px, 7.1 MB); since the U4
  review 37 (20 named, 14.3 MB; 17 crowd bodies, 8.0 MB), and no one but Kai wears a Station Zero face.
  Wardrobes are GPU recolours cached per model, variant and map, with the person's own skin kept.
  Crowds walk every mission's place (24 people at most with the named), by era (2026/2049, the
  settlement, 2196) and role, never wearing a named face or another era's; Rain City's carry
  umbrellas and stop with the clocks. Watchers are Helix drones, Continuum troopers, scavengers with
  lanterns, the Unwritten, the Spire's elites or Mission 17's red mimics; the Observer robot is gone
  from the edition. The edition's APK and preview carry only its 40 character files (27.3 MB; the
  23.9 MB of Station Zero's own looks and crew stay out; 41 files and 27.4 MB since the U4 review), and
  Station Zero's build carries exactly the 28 files it shipped in 1.1.1. Measured 2026-10-21 in this container:
  `EDITION=lastversion bash android/build-apk.sh` built `AFTERZERO-LastVersion-v2.0.apk` at
  45,712,284 bytes (budget 50 MB), and its preview at 53.3 MB with no file over 15 MB (the largest is
  the 14 MB voice pack); a chapter's people loading behind its card (`CAST_LOAD`, the game running in
  Mission 1) took 3.7 s for Act I's 17 models, 3.4 s for Act II's, 2.1 s for Act III's, with at most
  84, 96 and 80 ms of main-thread work in any one frame (budget 150 ms; Acts IV, the Finale and the
  cases then found everything loaded); with its crowds Mission 1 costs 27 static draw calls and
  180k triangles in the scene pass (262 draw calls and 343–350k triangles for the whole frame,
  11.4–11.5 ms of JavaScript on average, 15.0–16.4 ms p95), Mission 4's THE VILLAGE 25 and 86k
  (8.0 ms) and BEFORE THE FIRE 20 and 22k (4.1 ms): all within §4.7.
- **The CASE FILES** (v2.1, U8; `cases.js`; replaces the Cases chapter): fourteen stories (chains A–D, the Child in
  Three Photographs, the Train That Arrives Yesterday, the Unsent Letter, the House with No Owner, the Last Signal, the
  Names Beneath the City, the Clockmaker's Debt, the Ninth Minute: Evidence, the Survivor's Garden, the Unwritten
  Record) with their bible state (not started, active, resolved, consequence observed). Chains B and C keep their
  keys (`c_b`, `c_c`, at their old index, so old saves load) and since U8's last step replay their missions: chain B in
  Mission 5's gorge (Tala's gates low, high, middle, as in the mission), chain C in Mission 15's archive (Mara, the
  card's forged layer, the dual archive); an older save in either starts its replay where the story lives. The ten side
  stories replay from their places (`c_child` … `c_record`): the mission's place and people, the story's threads in the quarter it lives in, the facts
  the player had with the story's own cleared, and the mission's own voice pack (no new lines). THE CASES after an
  ending and the chapter menu's CASE FILES card open the screen; a replay ends back on it.
- **Stealth and evasion stand in for combat** (watchers, cones, the lure, Echo Step decoys);
  see DESIGN.md.
- **Voices and score** (v2.1, U5; DESIGN.md "Voice and score"): every line the edition says is heard
  from the edition's own recorded packs, in the claude.ai preview and the APK alike, and nothing goes to
  `speechSynthesis` or AndroidTTS any more. `voicelines.js` walks every speaking path (2,248 lines said
  from 1,875 recordings in 29 voices: the narrator, the thirteen principal speakers (the Witness on Kai's
  voice, the Child on Mira's), seven tier-2 people and Dr. Lin (on Mira's voice), the station PA, and six
  crowd voices by sex and age; young Kai, Dale, Haig, the Warden, the Florist, the receptionist and the
  Director have voices ready for the lines U6–U8 give them); templates are gone (the default echo, the socket, the tasks' refusals are authored), spoken hints
  name no keys, outros are character lines, the pronunciation lexicon reads years, times, dates, the Acts,
  Jun, Dr., 41-B and every number in words, and capitals as words. The packs (measured 2026-10-21, Opus
  16 kbps for speech, 12 for barks and thoughts; voice.ogg + voice.json): `common` 2.54 MB (670
  recordings, 19.4 min), `prologue` 1.88 MB (391, 13.9 min), `act1` 0.97 MB (189, 7.1 min), `act2`
  1.16 MB (251, 8.7 min), `act3` 0.79 MB (160, 5.8 min), `act4` 0.56 MB (125, 4.1 min), `finale` 0.31 MB
  (56, 2.3 min), `cases` 0.16 MB (33, 1.1 min): 8.37 MB and 62 minutes in all (budgets: 12 MB a pack,
  22 MB in all). 1,026 of the recordings were rendered for U5 (Kokoro int8, about 70 minutes of CPU on
  this box); the rest came from the cache unchanged. Station Zero's `voice.json` and `voice.ogg` are
  byte-identical (their sha256 is pinned in a test). The sound wakes on the first tap (TAP FOR SOUND if it
  cannot); the score is the edition's own (the three-note motif, a region per mission with a layer per
  year, the cues, beds per place and year); each mission opens on its card (and a new chapter on its own),
  said and scored, then a staged cold open; Kai says what he chooses; the PA, the records, Rook's calls and
  the echoes each have their sound; the endings are scored and said to the post-credit voice. The mix
  (Dialogue, Music, Effects, Ambience, Sound captions) is in the settings; the first tap also applies the
  player's volume and SOUND OFF, so the title theme obeys them. Recording is one command per chapter group
  (`VOICE_WORK=<dir> bash tools/voice-lv.sh act1`; `check` names stale packs; DESIGN.md "Voice and score"):
  every pack was checked byte for byte against the current scripts (all eight up to date). The edition's
  APK (`EDITION=lastversion bash android/build-apk.sh`, 2026-10-21) carries `voice/lv/**` and no other
  voice: 39,995,471 bytes (U4's was 45,712,284 with Station Zero's 14 MB pack in it), its preview 47.6 MB
  with no file over 14 MB; Station Zero's APK carries its own `voice.json` and `voice.ogg` (sha256
  unchanged) and no edition pack. The ear check
  (2026-10-21) was a machine's, not a person's (this container has no audio output): the audition page
  (`tools/voice-audition.py`) took 40 of the 1,026 clips rendered for U5, half of them years, times, Jun
  and the Acts, and checked each one's length for its text, level, gaps, the phonemes Kokoro read it as,
  and what a speech recogniser (pocketsphinx, US English) heard in it. 31 passed outright; the 9 flagged
  were all read right by Kokoro's phonemes and misheard by the recogniser on short clips ("Act Two"), the
  British narrator, the low Clockmaker ("Wednesday" heard as "one story") or "seventeen" as "seventy"; one
  peaks at full scale once decoded (23 of the 1,026 do; the game's float mix does not clip them). Every
  year, time, "41-B" and percentage the recogniser caught was the lexicon's reading ("twenty twenty six",
  "twenty one ninety six", "forty one b", "eleven percent", "oh five forty"). Over all 1,026 clips the
  recogniser found a median 80% of the words; the 159 under 50% (mostly the British narrator and one- or
  two-word clips) all have phonemes that read as written and a speaking pace (5 to 24 characters a second,
  but one crowd child's line at 25). An earlier automatic pass caught "KAI + MIRA" spelled out as letters and "-3"
  read without its minus (both fixed and re-rendered). The audition page for a human listen stays in the
  session's scratchpad (not shipped).
- **Tests** (U8, 2026-10-22): `tests/lastversion.test.mjs` has 88 tests (`npm test`: 116, all pass), the new ones: Acts
  III and IV and the Finale as threads with the length model (each Act mission 25–42 minutes, the Finale 90 or less, the
  main path 70% or more, declared minutes the model's); the global ledgers (every question answered in its mission with
  some of its evidence findable by then, every piece of evidence a deduction needs set earlier or on its own main path, no
  main thread waiting on a side story, and every fact a choice sets read later in the campaign); nothing that ends a
  mission of Acts III, IV or the Finale answering at its start (checked from each chapter's PRIMES, and shown to fail on a
  mission left ungated); every line authored in the missions' files walked by `spokenLines()` (so a line said from code is
  recorded); the hold; the moments of Acts III and IV; the Finale's holds, endings, epilogue and post-credit voice; the
  CASE FILES (fourteen stories and their states, twelve replays, `c_b` and `c_c` among them, each building from its
  place with nothing of its story done once its facts are cleared); and the voice coverage over all 23 missions (0
  misses). The whole browser bot (`node tests/lastversion.mjs`, 28.7 minutes on this box) passes 312 checks with no page
  error: the Prologue from NEW GAME, Acts I to IV and the Finale thread by thread to Ending C (Mission 14's lift ride
  with real movement, Mission 15's `ev_dual_archive`, Mission 18's hold and slab stair, Mission 19's reflection bridge,
  Mission 20's refusal and accepted alignment, Mission 21's elites and arena, Mission 22's deduction, the Finale's two
  holds, Ending C's added lines and an epilogue line for a fact the run set, the post-credit VOICE), THE CASES opening
  the CASE FILES (14 entries, 12 replays) and one replayed from its place after a reload, and the survey of all 23 places
  (1,657 pairs of views in different places, the closest 26 bits apart); over the run 1,583 lines were said, every one
  from the packs, `speechSynthesis` never asked, and the cues card, chapter, zero and ending:C all played. Between its
  steps the bot now waits out a setback's fade (it ends on the page's own timer). `c_b` and `c_c` were also replayed
  from the CASE FILES screen with no game behind them (chain B's gates, chain C's dual archive). Station Zero:
  `tests/cradle.mjs` 167/0 (U8 changed no shared file). The edition's APK (`EDITION=lastversion bash
  android/build-apk.sh`, 2026-10-22) is 46,680,143 bytes (budget 50 MB), with `voice/lv/**` (eight groups, 15 MB) and no
  other voice; its preview is 54.5 MB with no file over 10 MB.
- **Tests** (U7, 2026-10-22): `tests/lastversion.test.mjs` has 79 tests (`npm test`: 107, all pass), the new ones:
  Acts I and II as threads with the length model (each mission 25–42 minutes, its main path 70% or more, its declared
  minutes the model's, no empty quarter); a mission started from the chapter menu has none of its threads done (its
  PRIMES, `faction` neutral: Mission 13 once ended on arrival); a staged moment kept in the load, not the save; Act I's
  and Act II's sheet moments and kept choices. The ledgers (clues planted before their payoff, every consequence read
  later), the bible's quoted lines, the speech budget and the voice coverage (0 misses) now run over Missions 1–13. The
  browser bot (`node tests/lastversion.mjs`) plays Acts I and II thread by thread from the Prologue's end to Act III
  (LVP: real movement where a straight walk gets there, Kai placed where stairs, terraces or a wall are in the way and
  the metres counted, every line at its own length, one or two side stories a mission), with the unit's checks: Mission
  5's river diverted, then the abandoned village's why, the gate and `machine_buried`; Mission 8's confrontation
  setting `rook_fate` and VERSION 17; Mission 9's two loops with the patrols on other rounds, then the transmitter,
  Rhea and the tower; Mission 11's U1 sequence, the music box's gain falling toward its source and a returning gurney's
  setback; Mission 12's chase with no setback and the Witness's stair before Kai's REVERSE; Mission 13's shells from
  each side (`ev_both_sides`) and `faction`. The whole bot (the Prologue, Acts I and II, Missions 14, 16 and 19,
  the Finale to Ending C, and the survey of all 23 places) passes 273 checks with no page error, every line said (963)
  in the packs and `speechSynthesis` never asked (U6's run: 226); in it Mission 1 took 9.7 minutes. Its Mission 1
  relay check now looks for 8:13 while lines play (the seven-second minute could pass inside one talk-out once a
  passer-by spoke after the announcement). U7 changed no shared file.
- **Tests** (U6, 2026-10-21): `tests/lastversion.test.mjs` has 74 tests (`npm test`: 102, all pass), the new
  ones: the Prologue as threads (one map each, quarters, a cold open and a hook, every thread a known kind and
  three hint tiers); the length model (Prologue 75–100 minutes, each mission in range, the main path ≥ 70%); the
  clue ledger (every plant before its payoff, in the missions' own facts and lines); the consequence ledger
  (every fact a rewritten mission's choices set is read later or listed for a later mission); the bible's quoted
  exchanges verbatim with their speakers, and no design-note words; the speech budget; PREVIOUSLY and THE
  QUESTIONS from the common pack; the thread engine (objective, because, tiers, walked-past clues, deductions,
  tracking); a thread paid once when its kind sets its own fact, and a year carried out of Mission 3's lab into
  the court; the save format (a pre-U6 save restarts its rewritten mission at quarter 0 with its facts); and
  Mission 3's routes walked with the game's physics (out through the lab's 2026 frame to the dig and back; not in
  2049). The coverage test plans every line from the packs (0 misses). The browser bot's Prologue run
  (`LV_ONLY=prologue`, the Prologue into Act I) passes 77 checks, keeping the Prologue's fact IDs (§3.6), the new
  ones: the cold open before the title, the objective with its because line, the three anomalies and the
  deduction (a wrong answer leaves it open), the florist, Officer Pryce's 05:40 line in her own recorded voice,
  `wrist_cut` and "Your wrist—" in the man's voice, the chase and the raincoat, an M1 save that loads at its
  furthest quarter (since the U6 review: where it was taken) after a PREVIOUSLY card (a tap on SKIP ends that card), SKIP (Enter) ending Mission 2's
  whole opening, Mission 2's cold open, Lin with no shadow, Dale's statement in his voice with his hologram, the
  junior pass, Rook at the chamber door setting `trust_rook`, `wrist_mark`, the lab's 2026 frame and the
  excavation office (`ev_site_zero`), the 2196 plaque, `time_<mkey>` stored as each mission ends, Act I's
  PREVIOUSLY card, and the case board's new sections. The whole bot (`node tests/lastversion.mjs`: the Prologue,
  Missions 5, 11, 13, 14, 16 and 19, the Finale to Ending C, and the survey of all 23 places) passes 226 checks
  with no page error (U5's run: 199); in it Mission 1 took the bot 9.7 minutes. U6 changed no shared file.
- **Tests** (U5, 2026-10-21): `tests/lastversion.test.mjs` has 64 tests (`npm test`: 92, all pass), the
  eight new ones for voice and score: every `spokenLines()` entry plans fully from `common` and its own
  group's pack (2,248 lines, no CREW voice), the spoken-text lint, the pack budgets and Station Zero's
  pinned sha256, a distinct voice per speaker with the same person on one base voice, no device speech
  in the edition (a loading pack waited for, a miss recorded), the effect chains (the edition's only;
  Station Zero plays dry), the cards, choices and ending sequence, and the score on a stand-in audio
  graph. The browser bot, now run with Chromium's `--autoplay-policy=user-gesture-required`, passes 199
  checks, the new ones: the AudioContext runs after the first tap; a new game opens on the Prologue's
  card and Mission 1's, said and scored, with the common and Prologue packs; the Zero Second ducks the
  music while the voice bus stays at 1; Ending C is scored and said through the post-credit voice; over
  the run 254 lines were said, every one from the packs, `__voiceMiss` stayed empty, `speechSynthesis`
  was never asked for anything, and the cues card, chapter, zero and ending:C all played (it waits for
  each mission's card and cold open before walking Kai, as a player would). Station Zero after U5's
  shared changes: `tests/smoke.mjs` passes, `tests/qa.mjs` 26/0, `tests/cradle.mjs` 167/0.
- **Tests** (U4, 2026-10-21): `tests/lastversion.test.mjs` had 56 tests (`npm test`: 84, all pass), the
  twelve new ones for casting: every person's model file and variant, pronouns that match the body,
  no named face in a crowd, crowd eras that never share a face (but `rb_child_m2`), Pryce on
  `rb_security_f`, Lin and Mira on one mesh, children on children's bodies, the settlement's women on
  whichever named woman's mesh is absent, crowds in every mission within 24 people, the watchers'
  kinds, every chapter's models, `LV.looks`, a manifest of only the edition's models each worn by
  someone with a CREDITS row and a converter entry, and every wardrobe rule in range. The browser bot
  passes 191 checks, the new ones: Mission 1's officer on `rb_security_f`, the toy child and the Child
  on children's bodies, Rain City's crowd walking with umbrellas, the settlement's people in Mission 4,
  Mission 10's troopers whose cones see Kai, and Mission 14's crowd in its year's faces; the survey's
  closest two views of different places are 21 bits apart. Before U4: `tests/lastversion.test.mjs` (unit, in `npm test`: 44 tests; the place tests now cover
  every mission and both cases: every sheet's quarters and landmarks, the generators gone (a grep over
  the edition's files), a default sky of its own per mission (M22 and M23 excepted), the linear
  exemption, the budgets, and walked routes through the new places with the game's physics) and
  `tests/lastversion.mjs` (browser bot, 184 checks: the Prologue from NEW GAME through both quest
  chains into Act I, Missions 5, 11 (REVERSE: 15 checks), 13, 14 and 19 and the Finale to Ending C,
  with real walks through Mission 13's quay, Mission 14's viaduct, the Museum's spiral, Mission 19's
  reflection bridge and wrapping edge and the Finale's road, the save namespace, and the survey of all
  23 missions' places: 61 views, their hashes in the log, every top quarter a sky, the closest two
  views of different places 22 bits apart). Both pass, and `npm test` passes (72). (Measured
  2026-10-21 for the overhaul's U3.) U3 changed no shared file (only `game/js/editions/lastversion/`,
  its tests and docs), so the Station Zero suites were not rerun for it; they passed for U2.

## Generated (playable, solvable by construction, not hand-tuned)

- **Nothing of the places since U3.** Every mission and both cases stand in an authored open place;
  the edition no longer imports `gen/ZoneGen.js` or `gen/LevelGen.js` (a unit test greps every
  edition file), and `dress.js` and the `P` palettes are removed. What is still seeded is the scatter
  inside each authored place (debris, grass, the order of facade tints), the same on every build.
- **Puzzles** are authored per mission (U6–U8): the places' own crossings (the 2026 stone arch over Mission 18's
  chasm, the 2049 lamp-post heads, the 2196 tilted floors; Mission 19's bridge seen only in its reflection; the
  Museum's spiral) and the bible's mechanisms at their landmarks (the reflection's lag, the arena's fallen slabs, the
  board of three memories, the slab stair, the seals, the arm's beat). Nothing about them is generated.

## Planned / not done

- **Scale.** The bible's campaign is 25–30 hours. The length model of this edition is 886 minutes (about 15
  hours, 703 of them the main path), the bot plays it in 167.5 minutes of game time (the table at the top), and
  no player has been measured. The model's minutes are each thread's own, set by its author (the U6 review: Mission
  1 walked by the bot in 10.4 minutes against 35); the bot now fails Mission 1 if its walk falls under a third of the
  model's main path (0.40 on 2026-10-22, after the pursuit grew to 180 m), but making the chapters as long as the
  model says is content still to write, mission by mission, and a player's time still to measure.
- **What the set pieces are not.** The game has no combat and no fail states: Mission 9's reset, Mission 18's hold
  and Mission 21's arena never fail (a lapse or a fall is a setback to the last anchor); Mission 13's battle and
  Mission 18's storms are watchers and weather; Mission 21's elites are watchers that rewind, not fighters; Mission
  18's surge REVERSE was not built (the hold and the slab stair carry the tower). The bible's ten optional missions
  are side stories of their missions (§5's table), each a few minutes rather than the bible's half hour, and the
  CASE FILES replay them.
- **Rook after Mission 8** is what `rook_fate` made him: in Corridor B (Mission 12), the Director or an empty chair
  (Missions 10 and 21), an ally at the Spire if persuaded, and a last transmission on the Finale's road; he is never
  fought.
- **People** are all placed since U8 (the Warden and the Gardener in Missions 14 and 15, Tomas and Jun's echo in 15,
  young Kai and the Child in 17 and 20, the Director as `rook_fate` made them in 21, the Elder's, Ezra's and Odile's
  echoes in 22, the people Kai's choices changed along the Finale's road). Mission 22 has no watchers since the U4
  review; the Finale still carries a few of the fragments' kind (a drone or a scavenger), where the spec has none,
  and Jun's line clears them (U8 built the Finale's opening streets on them).
- **The settlement's wardrobe waits for a person's decision** (OVERHAUL.md §6.3 makes it a condition of U4 being
  done, and it has not been made). Its people are Rocketbox's robe, kurta and head-cloth avatars recoloured in
  ochre, indigo, madder and undyed linen; both U4 reviews read them as present-day Islamic and Gulf dress (Tala's
  lace-fringed hijab, the Elder's khimar and abaya, thobes with ghutras, Niko's kurta and taqiyah) on a fictional
  settlement 3,000 years old: an anachronism, and a risk of reading as a stereotype of a living religion. Rocketbox
  has nothing else that reads as ancient (its other avatars wear modern clothes), so the options are a person's to
  weigh: keep them, hide the men's head cloths (`keffiyeh` is its own part) and accept the rest, or bring other
  meshes from elsewhere for the Elder, Tala, Niko and the settlement's crowd (and record the choice here). The
  render sheet is in the U4 review's report. Until then the settlement's crowd also stays on three faces (the men's
  robe, the girls' linen, and the women on whichever of Tala's or the Elder's meshes the mission does not place),
  each at most twice a year in a place.
- **Models stay loaded.** Each chapter loads its people behind its card, but Actors has no release, so
  a long session keeps the models of every chapter it has visited (at most the edition's 41).
- **Faction support** changes who answers in Mission 21 and what people say; it does not change
  patrol responses or open safe routes elsewhere (Jun's line in the Finale is the one safe route).
- **A human ear check** of the U5 voices (the audition page above), and of the score's regions and cues,
  has not been done: nothing in this container can play sound to a listener. The machine check above
  stands in for it. Both U5 reviews ask for it before the preview or the APK is published again: at least the 9
  clips the machine flagged (one heard 'seventeen' as 'seventy', which the Version 17 and 17/117 reveals rest on),
  the clips the review found peaking at full scale once decoded (23 of U5's 1,026; each is levelled to -1 dB before
  Opus, and the playback chain has headroom, so one the voice model clipped would need re-rendering, not a limiter),
  the Zero Second,
  the card and ending cues, and one region of each kind.
- **The score** is procedural (Synth's oscillators and noise, 0 bytes of assets): the bible's cues are
  there by name and shape, not as composed music; the crowd walla is the crowds' own barks far off.
- **Cold opens** of every mission are authored (shots, lines, hooks); three of Act IV's stage their own people
  (`coldOpen.cast`), the others use whoever already stands in the shot; the case files' replays have none of their own.
- **Acts I and II are not gated yet.** `gateAfter` (U8) is on for Acts III, IV and the Finale only; in Acts I and II a
  thread's own spot or trigger still answers before the threads it comes after (U7's review found missions that one
  interaction out of order ends: 6, 7, 8, 9, 10 and 13). Turning it on there, and checking each mission's bot route, is
  U7's fix.
- **A human playtest** of the rewritten campaign (do the deductions read fairly, do the chases feel like pursuits,
  does Mission 18's hold read as a defence and Mission 20's board as an alignment, are the model's minutes what a
  player takes) has not been done; the bot and the length model stand in for it.
- **Device testing** of the Android build on phones has not been done in this session.
- **Mission 11's discontinuity court** shows its rain as still filaments (falling on the west half, rising on the
  east is drawn, not animated; only the clouds drift backwards there), and Mission 14's arrival view was not
  recomposed to frame the 2196 lagoon (U3 review nits, deferred).
