# AFTERZERO: The Last Version of Earth — status

An honest account of what the edition is today (the v2.1 overhaul, U1–U8, on the v2.0 app), measured against the
creator's bible. The bible describes a 25–30 hour campaign; this is a playable adaptation of all of it on the
AFTERZERO engine, all 23 missions written by hand on threads (the Prologue in U6, Acts I and II in U7, Acts III and IV
and the Finale in U8), with the CASE FILES after an ending. How it works: [`DESIGN.md`](DESIGN.md).

**Each chapter's length, measured** (the release check, 2026-10-24, on `75b3e91` with the closing passes all in).
Minutes of game time against the bible's own targets (each mission's "Target duration"; a chapter's is the sum of its
missions', with the hours of its heading beside it). The bot's minutes are the game's own telemetry (`time_<mkey>`;
the Finale's from its start to the ending) in the release check's full run of `tests/lastversion.mjs` (373 checks,
373 passed, every line said (1,966) from the packs), beside the closing pass's run (`3eb6767`) and the runs before it.
Speech and words are each mission's own lines (threads, side stories, people, records and its card; not hints or
barks), each line once, with its speech measured from the recordings in the packs as they are now:

| Chapter | The bible (minutes) | The bot (closing pass → release check) | Of the bible | Speech of its own | Words of its own |
| --- | --- | --- | --- | --- | --- |
| Prologue | 120 (2 h in its heading) | 13.5 → 13.3 | 11% | 19.9 | 3,325 |
| Act I | 260 (5 h in its heading) | 44.0 → 44.1 | 17% | 22.8 | 4,017 |
| Act II | 320 (6 h in its heading) | 44.7 → 44.8 | 14% | 23.0 | 3,982 |
| Act III | 300 (6 h in its heading) | 52.2 → 52.2 | 17% | 23.2 | 3,992 |
| Act IV | 240 (5 h in its heading) | 35.0 → 35.0 | 15% | 17.4 | 3,181 |
| Finale | 90 (1.5 h in its heading) | 11.6 → 11.7 | 13% | 8.1 | 1,498 |
| The campaign | 1,330 (22.2 h; the bible's own total: about 25.5 h of main story) | 201.0 → 201.1 | 15% | 114.4 | 19,995 |

| Mission | | The bible | The bot (before → closing pass → release check) | Speech | Words |
| --- | --- | --- | --- | --- | --- |
| 1 | The Last Normal Day | 35 | 10.9 → 10.9 → 10.2 | 8.2 | 1,408 |
| 2 | Helix Goes Dark | 45 | (placed, lines skipped) | 6.5 | 1,069 |
| 3 | The First Switch | 40 | (placed, lines skipped) | 5.2 | 848 |
| 4 | The Man from the Last Day | 50 | 8.6 → 9.2 → 9.3 | 4.1 | 767 |
| 5 | The Village That Never Existed | 55 | 10.8 → 9.1 → 9.1 | 4.1 | 832 |
| 6 | The Clockmaker's House | 45 | 6.0 → 6.6 → 6.7 | 5.5 | 879 |
| 7 | The Broken Observatory | 65 | 7.3 → 9.9 → 9.7 | 3.9 | 722 |
| 8 | The First Death | 45 | 8.8 → 9.3 → 9.3 | 5.1 | 817 |
| 9 | Nine Minutes to Zero | 60 | 9.2 → 10.0 → 10.0 | 3.7 | 621 |
| 10 | Enemies Who Remember | 65 | 4.9 → 8.7 → 8.7 | 4.7 | 822 |
| 11 | The Inverted Hospital | 50 | 7.9 → 7.2 → 7.3 | 4.7 | 793 |
| 12 | The Man Behind the Glass | 70 | 7.0 → 8.4 → 8.4 | 5.1 | 896 |
| 13 | The Nine-Minute War | 75 | 7.8 → 10.5 → 10.5 | 4.8 | 850 |
| 14 | Welcome to 2196 | 50 | 7.0 → 10.6 → 10.6 | 6.1 | 1,109 |
| 15 | The City That Forgot Tomorrow | 65 | 11.3 → 9.4 → 9.4 | 4.5 | 776 |
| 16 | The Museum of Failed Worlds | 55 | 8.4 → 10.3 → 10.3 | 5.0 | 783 |
| 17 | The Witness's Archive | 70 | 7.6 → 10.8 → 10.8 | 3.8 | 645 |
| 18 | The Fracture | 60 | 10.4 → 11.1 → 11.1 | 3.9 | 679 |
| 19 | The Place Outside Time | 60 | 8.6 → 11.0 → 11.0 | 3.2 | 621 |
| 20 | Mira's Memory | 55 | 6.7 → 7.1 → 7.1 | 4.0 | 754 |
| 21 | The Last Battle of the Continuum | 75 | 6.1 → 9.2 → 9.2 | 5.6 | 1,041 |
| 22 | The First Second | 50 | 8.3 → 7.7 → 7.7 | 4.7 | 765 |
| 23 | Afterzero | 90 | 10.4 → 11.7 → 11.7 | 8.1 | 1,498 |

"Before" is the bot's earlier runs as this file recorded them (Missions 4–13 on 2026-10-22, 14–23 and the Finale on
2026-10-23, Mission 1 in the audit). Those runs carried a fault of the bot's that the closing pass found and fixed: when
a mission ended inside its own last step (a staged moment that plays itself, or a set piece whose end is the mission's),
the bot's loop went on into the next mission's first threads, and its wait for the next mission then let game time run
idle on that mission's clock. Some earlier minutes were too high for it: Missions 5, 11, 15 and 22 measure lower now (11
and 22 with more in them), and the closing pass's own first run, still with the fault, gave the Finale 10.4 where the
same Finale measured 9.8 once it was fixed. Missions 2 and 3 are placed beat to beat with their lines skipped, so they
are not measures (0.3 and 1.4 minutes in the release check). Mission 1's figure is its walk from the first step to its
end, lines at their own length (10.2; its telemetry, with the opening, about 11.6). Between the closing pass's run and
the release check's no line changed (`spokenLines()` gives the same 4,553 speakers, voices and texts on both commits)
and no mission moved by more than 0.7 minutes (Mission 1, 10.9 to 10.2). The words and speech are counted the same way
for every mission; the closing pass's table (19,861 words, 113.4 minutes) counted a few lines fewer with a filter it did
not record, and the same count as here on its own commit gives 19,995 words and 114.2 minutes: no line changed after it,
and the audio closing pass's re-recordings (`f623a68`) added 0.2 minutes.

What the numbers say. The bot plays the campaign in 201.1 minutes of game time, about a seventh of the bible's 22.2
hours of mission targets; every mission is below its target. Under ten bot minutes: Missions 4 (9.3), 5 (9.1), 6
(6.7), 7 (9.7), 8 (9.3), 10 (8.7), 11 (7.3), 12 (8.4), 15 (9.4), 20 (7.1), 21 (9.2), 22 (7.7): twelve of the nineteen
Act missions. The bot knows every coordinate, reads nothing twice, never looks around or gets lost, asks for no hint and
plays one to four side stories a mission; a player will take longer, and no player has been measured.

The length model is gone. Earlier versions of this file set each chapter's "target (model)" beside the bot: the sum of
each thread's authored minutes, 890 minutes or about 15 hours. Those minutes were set by their authors and never
measured, and they ran about five times the bot's; nothing here or in DESIGN.md gives them as an estimate any more.
`Threads.js` keeps `minutes` as authoring weights only, the unit tests no longer assert the model, and the bot no
longer measures Mission 1 against it (it needs nine minutes or more). Older entries below that cite "the model" are
history.

Every line the edition says, once each: 554 lines and 7,295 words in v2.0, 2,727 and 22,781 before the closing pass,
3,215 and 27,593 now (4,553 lines as `spokenLines()` walks them, a line said in several places counted each time),
in 5,143 recordings. Each mission's place is 1.7-6.8 ha (v2.0's generated rooms: 0.2-0.8 ha a sector).

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
  waiting at the staff gate, where she is gone (Rain City's faces walk at most twice a year in a place, 14 walkers in Mission 1: the knot is cast first); the cold open is 05:40 (the rain before dawn, one
  window pulsing in Helix's crescent across the river, no commuters yet; its first shots, which had looked into the
  Ring Hill's foot, look at the crescent from high over the plaza and the canal) and the title 08:02 again; THINK at the
  checkpoint no longer says any answer will do; the card names no weekday. The prologue, common and act1 packs were
  recorded for the changed lines (31 new recordings; `voice-lv.sh check`: all up to date). Already fixed by U7 and
  U8 when the review was read: the case board's SIDE STORIES and TRACK (by mission key; the bot tracks one in
  Mission 4), the because line on touch screens (smaller, two lines), the epilogue keyed to `rook_fate`, Kai's birth
  year, the per-chapter save format (`REWRITTEN_IN`), staged moments kept out of the saved flags, and the thread pass
  four times a second rather than every frame. Not done: the length the model claims (below, under Scale). Checked: `npm test` 139/139;
  the whole browser bot 319/319 (2026-10-23; an earlier run that day failed Mission 3's key C: a lock granted and
  lost after the lab's save and load reopened the pause menu between the key and its frame, and the bot's `press` now
  closes it again in the frame's own call; that run's Zero Second duck, sampled late on a machine just started, passed
  in every run since). No shared engine file changed.
- **Acts I and II after the U7 review** (2026-10-23; `git log 63212cf..`): nothing ends a mission before its story gets
  there. `gateAfter` is on for Missions 4-13, and the gate is the whole chain: a thread's own spot, trigger, deduction,
  record or playback waits on every thread before it, not only the ones it names (a talk or an evidence spot is free, so
  Rhea talked to first had opened Mission 9's tower, and Mission 13's devices, free to find, its stabilizer); a thread a
  player may walk past counts once its `until` holds. The unit test covers Acts I-IV and the Finale, including a staged
  moment's `after` (Mission 9's reset, Mission 13's district). Mission 9's two loop threads are walked past once the
  carrier is cut. People: Niko follows Kai through the years in person (Missions 5 and 7, `inPerson`); Sera stands at
  Mission 13's gate in 2049, where the war and Brask are, with an echo of her own elsewhere; Rook holds the 2026 gate in
  person; the Elder and Niko are not at Mission 4's ring before the fire; Ezra is himself in 2049, his echo at
  sixty-five in 2026 (`ezra26`, rb_ezra/ezra65) and nobody in the 2196 ruin; the man at the console in Mission 8's
  reconstruction wears a deep hood with his face in its shadow (rb_ren_m/hooded, worn by his hologram too), Mission 12
  is where it is seen. A test checks that every main conversation of Acts I and II is with someone met in person. The
  set pieces: Mission 6's escapement is three brass clocks, each answering in one year and only to the hour the shop
  window gives it (the window is required); Mission 8's reconstruction is the Prologue's morning (05:33 the test moved,
  05:40 the card on an empty corridor, 08:12 the man at the console, 08:13 the ring, 08:14 the missing second); Lin is
  spoken to inside the containment cube (its door stands open until then), the breach seals it round Kai, and the escape
  is a year switch: in 2049 the glass holds, 2026 has no cube, so he walks out through 2026 and comes back to 2049 at the
  version terminal (the terminal is 2049's), past the court's last drones, which rush to the sealed door and then hunt
  further and faster, and a drone of the island's own that circles the cube in 2049 (and stands still while Kai is in
  2026, so he can watch it go round from inside the glass and pick his moment);
  Mission 10's testing chamber and gorge have troopers on their own floors (`watch` paths may give a floor, `y`, and a
  `when`), the crossing waits on an Echo Step, the power cut blinds the gallery's and the crown's lamps only, and the
  released prisoners walk out of the cells; Mission 13's frozen block comes down and its people walk out past the silos
  when they are freed, or stand frozen with it when the stabilizer is destroyed, the choice's lines and the district's
  agree and the district is shot at the block, and the people who listened draw the canyon lane's patrol off with a
  flare (lit again after a load). The cold opens: Missions 4, 6, 7, 9 and 12 stage their people, Missions 6, 7, 11 and 12 are shot in their own
  year (`coldOpen.year`: every room that has it, each put back after; the Chronolith does not drain while an opening
  plays), Mission 12's from the rim of the 2196 sinkhole behind the Witness, Mission 11's inside the Ward 32 station.
  Crowds say their own lines (Old Town, V17, the Ridge's surveyors, the dam, the hospital, the port; Mission 14's 2049
  commuters keep their heads down), a test checks it. Saves: Mission 12's stair plays again after a load that cut it off
  (`resumes`); an older save restarting a mission from Act I on forgets what the old mission had set (the Prologue keeps
  its facts, U6's choice), and `water_route` from before U7 stays only with Tala's gates played; a playback's echoes are
  cleared at a load and its log line is written once; Mission 10's cells have floors. Nits: Mission 4's ash reads as a
  leaving, Tala's echo and second talk keep the cliff's order to itself, Rhea's rescue is the loop's last jump and her
  count follows the resets Kai saw, Mission 11's intercom story is offered only with the tape kept, the upward rain
  gives back the current year's weather, Mission 11's hazards make nothing per frame; a patrol REVERSE or Mission 21's
  elites wind back keeps its floor. Shared engine (one change, listed): `world/DeckWorld.js`'s Sentinel stands on `def.y`
  (0 when absent: its eye 1.6 m above it) and, when it has one, sees and catches only on its own floor (`onFloor`: Mission
  10's chamber troopers do not see Kai on the yard over their heads), so Station Zero, which never sets it, is unchanged
  (12 lines added, 5 changed); `node tests/smoke.mjs` passed and `node tests/qa.mjs` 26/26 after the last of it. The
  act1, act2, common, act3 and prologue packs were recorded for the changed lines (`voice-lv.sh check`: all up to date;
  since a container restart emptied the render cache it reads every clip as not rendered here, with 0 not in a pack, 0
  from older text and 0 no longer said). The model since: Mission 8 34 + 8 and Mission 10 31 + 6 minutes (Act I 192,
  Act II 199). The bot's survey lets a mission's opening end before its first view (a cold open shot in its own year
  puts the place back in its year as it ends, so three views had been taken in the wrong year: Missions 6, 7 and 12).
  Checked (2026-10-23): `npm test` 143/143; the whole browser bot (`node tests/lastversion.mjs`) 321 passed, 0 failed,
  with no page error: NEW GAME to Ending C, Missions 4-13 walked in 6.2-9.4 minutes of game time each but Mission 12's
  4.7 (Act I 42.5, Act II 36.1), every line said (1,648) from the packs, `speechSynthesis` never asked, and the
  survey's 1,657 pairs of views in different places (the closest 23 bits apart); Station Zero: `node tests/smoke.mjs`
  passed, `node tests/qa.mjs` 26/26.
- **Acts III and IV, the Finale and the CASE FILES after the U8 review** (2026-10-23; `git log 79407c9..`): nothing
  ends one of these missions, or a replay, before its story gets there. A thread is paid (its fact, its lines, what it
  sets) only once every thread before it is paid or walked past, so a talk or a piece of evidence found early is paid
  in the story's order, and a staged moment, a loop, a hold or a chase starts only when the story reaches it; a talk
  thread's completing conversation nodes, a tasks thread's spots and a REVERSE thread's process (`arm`) wait on the
  whole chain, and a person with no node open is not offered as a talk (Sera in Mission 14, Anja and Mara in 15, the
  Witness's hologram in 17). A unit test has a free player do everything open to them, in any order and any year,
  except what completes one main thread (158 threads withheld across Acts I-IV and the Finale, 16 in the replays; with
  nothing withheld it finishes 14 of the 20 missions and all 12 replays, so the check is not vacuous), and the mission
  never ends. (A gate never hid a kit, as the review feared: the kit is the place's and stands whatever the
  story has reached; a kit of one year's spot, the 2196 memorial's core, stands only in that year.) The story: Mira's
  body "did not survive the week" (M17's hook, agreeing with M8, M11 and M20); Mission 14's fragments are 2196's only
  (the memorial, its signs, the statue and the refusal already were); the kept letter is asked about in the Finale; Mira's
  side of the experiment has the hooded old man by the ring, and she asks about him; Ending C says Mira's own line, then
  "In the worlds he passed through, what he did stayed done.", before the lines that need Kai; the endings are staged
  (`ENDING_SHOTS`: the ring, each added line where it happens, then the road), and Kai is off screen from the first shot
  to the overlay, the clock's ticks and the voice included (`cinema` `hidePlayer`, the road's last shot held: the bot's
  per-step sample found him in every shot of Ending C, since the game camera shows him again by its distance in the 1.2 s
  before the moment and a shot never runs it); the Finale's streets trigger spans the avenue, fallen facades close the
  strips beside the pit, the street answers Kai's REVERSE only once the Witness has it, and the Witness crosses the bridge
  only if he held it; Mara says the photograph line; Mission 14's pupils are a girl and two boys in two bodies, and
  Tomas's look is his own. The mechanics: Mission 21 reads the command structure before the arena (the timeline wall,
  the field orders, the Director's desk with the Witness's requisition), deduces that he is building Chamber One again,
  and has an elite on the cells' terrace whose rewind is run forwards (the model 40 + 2; the bot 6.1 minutes, from 4.8:
  still the shortest of Act IV); Mission 18's east patrol walks 24 m from pylon two, and the bot now holds the stabilizer
  with its watchers on; Mission 22's arm shows its beat (it stands for the counts, ticks at each, turns on the third
  with a bell) and the bot reads it with no charge given back; the freed city's music changes; the hold's step does
  nothing in a mission with no hold and writes its chip only when it changes. The CASE FILES: a replay is gated as its
  mission is, keeps the mission rules that set what its threads wait for (the train's board), clears only what its story
  waits for and sets plus what the mission's code keeps for it (chain B's `gates_n`; Ezra's first meeting is not met
  again), saves in a slot of its own (`case`, never listed, so a finished campaign's slot and the autosave are never
  written), loads only its own mission's chapter's people, and neither fetches nor ships the empty cases pack. A unit
  test plays every replay to its end from a played campaign's facts; the bot plays the garden, chain B and the train to
  their CASE FILES return and checks the campaign's saves are untouched. Shared files: one, `android/build-apk.sh`, inside
  its `lastversion` branch only (an empty pack is not copied: 2 lines added, 1 changed); Station Zero's build is not
  touched. The changed lines were recorded (`voice-lv.sh check`: every pack up to date, 0 not rendered, 0 not in a
  pack). Checked (2026-10-23): `npm test` 149/149; the whole browser bot 334 passed, 1 failed, with no page error (NEW
  GAME to Ending C, then the CASE FILES and the survey; every line said, 1,661, from the packs, `speechSynthesis` never
  asked; 1,657 pairs of views in different places, the closest 21 bits apart): the failure was the Zero Second's music
  duck, a real-time sample taken late on a loaded machine (music 0.21, not under 0.05), which passed in the full run
  before (where the one failure was Kai on screen in Ending C, fixed since) and in a Prologue run after (81 passed, 0
  failed); Station Zero: `node tests/smoke.mjs` passed, `node tests/qa.mjs` 26/26.
- **The play-through and test audit** (2026-10-23; `git log a18e119..`): the campaign played and the packs checked
  again after the visual and casting tour. The whole browser bot on a18e119 (`node tests/lastversion.mjs`, 39.1 minutes on this
  box) passed 335 of 335 with no page error: NEW GAME to Ending C, the CASE FILES and their replays, the survey (1,657
  pairs of views in different places, the closest 22 bits apart); 1,633 lines said, every one from the packs,
  `speechSynthesis` never asked, the cues card, chapter, zero and ending:C played. The voices: the game's own lookup
  (`Voice.plan`, with the packs the runtime makes active for each line's chapter) over every line `spokenLines()` walks
  (3,905 lines, 2,788 distinct) misses none; `voice-lv.sh check` finds all eight packs up to date (4,170 recordings,
  every one of them said by some line); and of the 1,309 string literals in the edition's code that look like lines,
  the 48 not walked are signs, refusal labels and the ledger's clue matchers, none of them said. No pack was recorded
  again. The packs are 15.56 MB in all, the largest file act1's `voice.ogg` at 2.87 MB (the preview's limit is 15 MB a
  file); Station Zero's 13.98 MB pack is byte-identical (its sha256 is pinned in a test). New:
  `tests/lastversion-audio.mjs`, which plays from NEW GAME in real time with the game's own frame loop under Chromium's
  autoplay policy and listens on analysers on the voice's output and the master: the first tap starts the
  AudioContext; the Prologue's card, the cold open and Mission 1's card start decoded clips of the common and Prologue
  packs (21 buffers, the voice's output at 0.41 RMS at its peak, the mix at 0.23 with the chapter and card cues), and
  so does the florist's conversation (her lines and Kai's, from the Prologue's pack, 0.40 RMS); `speechSynthesis` 0
  calls, no miss; 10 of 10. Two unit tests: REVERSE reads as the one held process running backwards (a collapsed piece,
  a fallen car, a burnt door and a shell go back to where they were while held, are solid when seated, and go forward
  again when let go unless their kind settles; a flood drains and comes back; a mechanism turns in place, backwards
  while held), and no chapter is short (every mission at least 40 lines and 400 words of its own, 2.5 minutes of
  recorded speech, a place of 1.5 ha, six main threads, a side story, a cold open and a hook; the shortest, Mission
  12, says 42 lines, 443 words and 2.6 minutes). Fixed: Mira's raincoat carried two `head` rules, the later and older
  one silently overriding the rule the tour wrote for her hair under the hood (esbuild warned in both builds); and the
  bot's Zero Second duck, the check that had failed in earlier full runs, is sampled by the audio clock 0.3 s into the
  silence (its 300 ms timer fired after the page's other tasks, 602 ms in a probe, and read the music coming back; the
  game's duck was right): the Prologue run passed 81 of 81 twice after it. Checked:
  `npm test` 156/156; Station Zero: `node tests/smoke.mjs` passed, `node tests/qa.mjs` 26/26; `bash
  android/build-apk.sh` 51,396,546 bytes (Station Zero's voice only, no edition pack); `EDITION=lastversion bash
  android/build-apk.sh` 47,314,930 bytes (seven packs, 41 models; budget 50 MB), its preview 55.1 MB with no file over
  3.8 MB.
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
  of legacy beats any more. Nothing that ends one of these missions answers before its story gets there (`gateAfter`; as
  U8 left it, a thread's own spot, trigger, deduction, record or playback waited only for the threads it named, and a
  talk or a REVERSE done early paid its thread at once: the U8 review found that false, and since its fixes, below, the
  whole chain gates own interactions, talks and REVERSE, and threads are paid in the story's order; Mission 18's slabs
  are in sight from the start but answer REVERSE only once the stabilizer holds, `arm`). `Threads.js` gained `hold` (Mission 18's pylons: two minutes in phase, one pylon drifting at a
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
  M19 30 + 8, M20 30 + 10, M21 40 + 2 (34 + 6 before the U8 review), M22 30 + 8 (Act IV 158); the Finale 40 + 10 = 50.
  **Missions 14–23 walked by the bot** (the full run after the U8 review, 2026-10-23), in minutes of game time against
  the model's 38–42 (the Finale's 50): M14 7.0, M15 11.3, M16 8.4, M17 7.6, M18 10.4, M19 8.6, M20 6.7, M21 6.1 (4.8
  before the review), M22 8.3, the Finale 10.4, with one or two side stories each (0.3–1.9 minutes of them a mission).
  Speech: 658–1,000 words a mission (the budget is 1,000: M14 1,000, M15 983, M16 788, M17 658, M18 805, M19 674, M20
  733, M21 846, M22 754; the Finale 995 of 1,800 with its endings and epilogue). The packs were recorded for it
  (`tools/voice-lv.sh`, every group checked byte for byte against its script, last 2026-10-23; voice.ogg + voice.json):
  `common` 2.56 MB (640 recordings, 19.0 min), `prologue` 2.42 MB (600, 18.6 min), `act1` 2.91 MB (774, 23.0 min),
  `act2` 2.44 MB (713, 19.5 min), `act3` 2.74 MB (773, 21.6 min), `act4` 1.81 MB (501, 14.3 min), `finale` 0.69 MB
  (169, 5.3 min): 15.6 MB and 121 minutes of speech in 4,170 recordings (budgets: 12 MB a pack, 22 MB in all). `cases`
  is an empty pack now: every replay speaks from its own mission's pack, and the empty pack is neither fetched nor
  shipped.
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
- **The release check** (2026-10-24; `git log 75b3e91..`; every closing step committed before it). What was run on the
  finished overhaul, what it found and what was fixed; the version labels, app ids and the title's version text are as
  the closing passes left them (v2.0, `com.afterzero.lastversion`, versionName 2.0.0), for the release step to decide.
  *Voices.* Nothing was left to record: `VOICE_WORK=<dir> bash tools/voice-lv.sh check` finds all eight packs up to date
  (0 not rendered, 0 not in the pack, 0 from older text, 0 no longer said), no line has changed since the audio closing
  pass recorded them (`spokenLines()` gives the same 4,553 speakers, voices and texts on `3eb6767` and now), and the
  unit test that plans every spoken line through the packs finds 0 misses and no CREW voice. The packs as shipped
  (voice.ogg + voice.json, bytes): `common` 2,445,567 (600 recordings, 17.9 minutes), `prologue` 2,490,239 (624, 19.3),
  `act1` 3,377,811 (892, 27.0), `act2` 3,418,813 (980, 27.0), `act3` 3,406,517 (946, 26.9), `act4` 2,561,937 (716,
  20.2), `finale` 1,430,987 (385, 11.1), `cases` empty (2 bytes, neither fetched nor shipped): 19,131,873 bytes, 5,143
  recordings, 149.4 minutes as recorded. The largest file is `act2/voice.ogg`, 3,371,096 bytes (the preview's limit is
  15 MB a file); Station Zero's `voice.ogg` is 13,980,662 bytes and keeps its sha256. *The edition's APK* was over its
  budget: 52,644,494 bytes against OVERHAUL.md §10.2's 50 MB, its 49 models (29.1 MB) stored uncompressed (`aapt -0
  glb`). Its branch of `android/build-apk.sh` now deflates the models and stores only the Opus packs (`ecffaca`; a unit
  test holds both branches): 45,259,406 bytes, with the same 132 entries, CRCs and sizes (MainActivity streams every
  asset through `AssetManager.open`, which reads a deflated entry as well as a stored one; no phone has run it, below).
  Station Zero's build is unchanged: its APK was built before and after the change and its entries, methods, CRCs and
  sizes are identical. *Builds* (`bash android/build-apk.sh`; `EDITION=lastversion bash android/build-apk.sh`; not
  committed): Station Zero `AFTERZERO-v1.1.apk` (`com.afterzero.v1_1`) 51,453,890 bytes with 28 models, its preview 88
  files and 59,708,350 bytes, the largest its `voice.ogg`; the edition `AFTERZERO-LastVersion-v2.0.apk`
  (`com.afterzero.lastversion`) 45,259,406 bytes with 49 models (45 its own, 4 shared with Station Zero: Kai's body, two
  doctors' and Xbot's motion library) and 7 packs, its preview 121 files and 61,989,159 bytes with `assets/voice/lv/` (7
  packs), the largest file 3,797,328 bytes (Xbot as glTF JSON). *Checked:* `npm test` 169/169 (141 of them the
  edition's); the whole bot (`NODE_PATH=$(npm root -g) node tests/lastversion.mjs`, on `75b3e91`) 373 passed, 0 failed,
  with no page error, in 36.7 minutes: the campaign from NEW GAME to Ending C (its staging, the epilogue and the voice
  in every speaker, no crowd line over it), Endings A and B in real time from the save at the Finale's choice (89.8 and
  87.1 s, 24 and 23 lines, every line's decoded clips started from the `finale` and `common` packs, the voice's peak
  0.522 and 0.523, the music under it), the free-roam trips and back, the CASE FILES (fourteen stories, twelve replays,
  the Survivor's Garden replayed to its end), every line said (1,966) from the packs and `speechSynthesis` never asked,
  and the survey's 1,657 pairs of views in different places at least 21 bits apart (the threshold is 18; the closest
  Mission 4 before the fire and Mission 17 in 2049); its minutes are the table at the top. The real-time audio check
  (`node tests/lastversion-audio.mjs`) 10/10 from `game/` (10.1 minutes), and 10/10 served from the built web preview as
  it would be published (9.1 minutes; `LV_ROOT=android/build-lastversion/preview`, new in this check: the one bundled
  page with the edition flag, the models as glTF JSON, the packs under `assets/voice/lv/`): the first tap starts the
  AudioContext, the Prologue's card, the cold open and Mission 1's card are said from the packs and heard over the
  score, the florist's conversation is heard in her own recorded voice, nothing misses and `speechSynthesis` is never
  asked. Station Zero: `node tests/smoke.mjs` passed, `node tests/qa.mjs` 26/26, `node tests/cradle.mjs` 167/167 (twelve
  Cradle districts; 3.6, 0.9 and 2.4 minutes). Shared files changed by this check: `android/build-apk.sh` only (the
  edition's branch, above).
- **Free roam after the open-world closing pass** (2026-10-24; `git log b7f5b3d..`; the player's point 2, "make it
  open world"; DESIGN.md "Free roam"). Each of the critic's gaps was checked against the code first. *One bounded map per
  mission, story-gated quarters, a linear order and no travel* (real): the story keeps its order and its gates, and free
  roam is beside it (`roam.js`). Once a mission is done, the case board's TRAVEL (the map's TRAVEL button opens it) lists
  its place, in story order, with a button for each year opened there (Rain City and Helix's west wing in 2049 only:
  the Zero Second came before the Chronolith) and what is still there (side stories open, fragments found). A trip is
  that place as the story left it, in the page behind a fade: its people, side stories, fragments, records and REVERSE
  processes, with no way on, no gate, no watchers, no cold open, loop, frame code or stability drain, the story's own
  threads standing as props and its own nodes said without acting (a choice is not made twice). A trip saves in the
  story's slot with the story inside it, so a save taken on a trip loads on it; BACK TO THE STORY returns to the
  checkpoint left, the rooms in their years, with what the trip found; a trip travels on to another place; after an
  ending the CASE FILES have a FREE ROAM tab (from the title too) and BACK brings back the CASE FILES and the finished
  save as it was. No line is new (cards and objectives are shown, not said), so no pack was recorded. *Mission 1's
  shopfronts are facades you cannot enter* (stale in part): since the visual closing pass every shop is a room behind its
  glass and the laundromat is walked into; now the 24-hour pharmacy, the café and the plaza's grocer are walked into too,
  their shelves, tables and chairs solid (a doorway can be given per side). *Missions 10 and 2 mostly interior and dark on
  a phone* (already closed by the visual closing pass, f002096; checked): Mission 10 is the dam's face, its gallery ledge,
  crest and gorge under an open night sky, with the cells cut into the face; Mission 2 is Helix, the bible's facility,
  with windows, the court it opens onto, the lobby's glass roof and the roof terrace. Measured at 915 × 412, medium
  quality, SwiftShader (mean luminance of the frame, 0–1; measured again on `c3ca5a6`, the same to 0.01): Mission 2's lobby 0.28, dark corridor 0.24, west gallery 0.31, staff
  lounge 0.25; Mission 10's cell 0.17, gallery 0.11, guard post 0.10, cell block 0.13; Rain City's plaza in its 2049
  storm light 0.21 for comparison; each picture reads (the snow moonlit, the face's lamps, Helix's ceiling lights). *Mission 11's reversed
  rain as still filaments* (already closed by the visual closing pass; checked in the code: the court's rain surfaces
  scroll with the frame's time, `materials.js` `tickSurfaces` from `Scenery.update`, down in the west and up in the
  east). *Kai's own gravity never changes* (not a fault: the player's point 2 asked for no gravity inversion, OVERHAUL.md
  D1; the bible's "gravity changing only in readable zones" is honoured by things whose fall reverses under REVERSE).
  Found and fixed on the way, by the full bot's free-roam check: from Mission 14 on the case board did not open at all
  (Sera's standing, `trust_sera`, is a word, 'accept', 'deny' or 'ask', and the board's PEOPLE read every standing as a
  number: `TRUST['accept']` threw), so TRAVEL could not be reached there either; a word now reads as a standing, and a
  unit test opens the board after every mission of a walked campaign with everyone met, and on a trip. And by the full
  bot's pictures (`LV_ROAM_SHOTS`): a fragment's count read just before TRAVEL ("MEMORY FRAGMENT 1 / 4, THE BROKEN
  OBSERVATORY") waited under the case board and came up over Rain City's arrival, and Rain City's over the return to
  Mission 16; `Runtime.go` now clears the toast with the line it was saying, and the bot's check reads the arrival and the
  return for it (without the fix `LV_ONLY=roam` gave 14 passed, 2 failed, on trip 3 and BACK TO THE STORY; with it 16
  passed, 0 failed).
  Checked: `npm test` 169/169 (141 of them the edition's); the whole bot (`node tests/lastversion.mjs`, on `c3ca5a6`)
  373 passed, 0 failed, with no page error, in 45 minutes (the campaign from NEW GAME to Ending C, Endings A and B in real
  time, the free-roam trips and back, the CASE FILES and the survey of the 23 places; the run before the fix, on
  `19b255a`, 373 passed too, which is how the pictures were seen). The free-roam check alone (`LV_ONLY=roam`, about four
  minutes, from a new game taken to Mission 16) was run as it was built and after the fix; the full run includes it.
  Edition files and tests only (`git diff --name-only b7f5b3d..`: no shared engine file), so Station Zero is untouched
  and `tests/smoke.mjs` and `tests/qa.mjs` were not run for it.
- **Visuals after the closing pass** (2026-10-24; `git log f498f2d..`; the player's point 6 and the visual half of point 2;
  DESIGN.md "Places under an open sky", "Surfaces and props"). Each of the critic's gaps was checked against the code and
  a frame of it first (a survey of all 23 missions at 640 × 360 and close views of each gap, looked at in the pass), then
  closed. No plain colour in a place: the plain finishes carry wear (matte grime, satin worn paint, brushed metal, cloth),
  DeckWorld's doors and gates wear their surface, every kit is textured or rebuilt as its thing (no white cube left:
  Mission 11's wristband is a trolley with its tray, Mission 13's helmet sits on sandbags, Mission 19's chalk mark is on a
  slab, Mission 20's chair has legs), props are crates, cardboard boxes, aid crates, packing crates, washing machines,
  ridge tents and display cases and differ by mission (Missions 15, 16 and 20 had shared the same white boxes), metal and
  timber railings are posts and rails, and Mission 1's checkpoint barrier is glass leaves in a steel frame with the
  company's band, not a blank panel. Mission 1: the laundromat the story uses is walked into (its door, washing machines,
  a bench, the shop camera's feed on its back wall, the receipt dated tomorrow by the bench) and every other shopfront in a place is a
  room behind its glass (shelves of goods, a café's counter and tables, a ceiling of light; Missions 1, 6, 9 and 23).
  Mission 2 reads on a phone: its emergency light is a red wash (0.38, was 0.85) over the storm's light through the
  windows and the lobby's new glass roof, and each Helix room with windows has a daylight light. Mission 10: the moon
  in front of the face, the snow lit, a caged lamp in every cell and a bulkhead over each mouth. Mission 11's reversed
  rain moves: sheets of streaks that fall in the west and rise in the east, their pictures scrolling with the frame's
  time (measured in the page: both offsets change between frames). Mission 14's 2196 towers are broken curtain walls
  under real overgrowth (vines hanging from the garden terraces, ivy along their edges, sheets of creeper, roots over the
  podiums, trees on the crowns), the podiums dark shopfronts behind rusted shutters (lit shops in 2026 and 2049), the
  bank grown over, the viaduct grassed, the gantry rusted. Mission 15: the stadium's ribbed, painted and tagged precast
  walls, houses with doors, shutters and window boxes on the tiers, suburb houses with gables, ridge tents and aid
  crates in 2049, and the forecourt under the north wall dressed in each year (2196 houses against the wall, pennants,
  creepers, lanterns, stalls; 2026 banners, floodlights and kiosks; 2049 an aid tent and the evacuation sign). Missions
  19 and 20: Mission 20's 2049 is Chamber One as the child remembers it (white panels round the whole plot, a ceiling of
  light, a dark grid floor, the street in pencil lines), no longer a white fog void beside Mission 19's white plain: the
  survey's hashes of the two now differ by 111-112 bits (38-39 before). Mission 22: the sky's wedges run into one
  another with no seam, each year lights its own two, and the chamber is a building site under a crane in 2026, a beam
  into the eclipse in 2049 and grown through by lindens in 2196; from its spawn the largest mean difference of the sky between two years is now
  30-100 of 255 in a channel (12-24 before). Today's crowds were already dressed by place by the casting pass (`PALETTE`, ae89808,
  with its unit test). Checked: `npm test` 161/161 with the pass's own unit test (Kai walks through the laundromat's door to the feed, the corner
  shop's glass stops him, the worn finishes, the moving rain, the chamber, the soft wedges; each code step 160/160 on its
  own, the first from an export of its index); the
  places survey (`LV_ONLY=places node tests/lastversion.mjs`, at 640 × 360 with screenshots) 87 passed, 0 failed, its
  1,657 pairs of views in different places at least 21 bits apart (the threshold is 18); the whole bot (`node tests/lastversion.mjs`, 2026-10-24, on
  `f002096`) 358 passed, 0 failed, with no page error: the campaign to Ending C, Endings A and B in real time, every line
  said (1,966) from the packs, `speechSynthesis` never asked, its own survey's 1,657 pairs at least 22 bits apart. No shared runtime
  file changed (only the edition and its docs; Station Zero is untouched), so `tests/smoke.mjs` and `tests/qa.mjs` were
  not run for it. Not closed here: one bounded map per mission with no travel between places (the open-world closing
  step's), and Kai's own gravity, which never changes as the player asked (DESIGN.md, D1).
- **Voice and score after the closing pass** (2026-10-24; `git log 5d877ca..`; the player's point 1; DESIGN.md "Voice
  and score"). SKIP and Enter skip one line and the shot it is in, never the whole opening or the mission's spoken card
  (a tap once ended the whole opening, so a player who tapped to pass one line never heard the card): the unit test taps
  Mission 12's cold open through line by line, the card still said; the bot presses Mission 2's cold open through to
  its card and the card's logline, and taps one line of the PREVIOUSLY card. The score plays written music
  (`themes.js`): the bible's nine cues as themes, note for note, each in its act or for its character (the Prologue
  Kai's theme, Act I the Past, Act II the Nine-Minute War in 7/8 against 4/4, Act III 2196, Act IV the Unwritten
  Second, the Finale the Final Choice, Mira's in Missions 11 and 20, the Witness's in 12, 17 and 21, the museum's
  exhibits in 16), every one stating the bible's three-note motif; a place keeps its tune in every year on other
  instruments, a chapter's card announces its act's theme, a mission's card the first bar of its own, and Ending A's
  cadence is the only full major cadence in the game. `tools/score-render.mjs` renders it offline to WAV for a person
  to hear (26 renders) and measures it: no render silent or clipping (peaks 0.04-0.24), and the tune's own pitch among
  the two strongest at 72% of its notes or more (it found the string leads buried, at 12-28% strongest, and they now
  sit over their chords). The ear check is Whisper's (small.en through sherpa-onnx, `tools/voice-ear.py`), not
  pocketsphinx's: 929 distinct clips across the seven packs that have recordings (599 sampled, numbers and names first;
  every "seventeen"; every clip recorded again, heard after it was): every "seventeen" was heard as 17 (U5's "seventy"
  was the old recogniser's), every year, time and 41-B as the lexicon reads them. What it and a reading of every name's
  phonemes found, fixed and recorded again (289 recordings): a -teen number now carries its stress on the -teen
  ("seven-teen": the voice model read SEV-en-teen, close to seventy; 114 clips); Rhea was one syllable ("Ree", now
  "Reeya") and Odile was OH-dile (now "Oh-deel"); 66 clips peaked at full scale once decoded at 48 kHz (the renderer
  now decodes each recording back and levels it lower while it peaks above -0.5 dBFS; afterwards none of the 5,143 is
  at full scale, the highest 0.9989); the children's voices spoke 25-40% faster than the adults round them (their
  speed is now set back by their pitch factor; 107 clips). Still flagged by the machine: 15 clips of one to three words
  ("Kai" heard as "Kyle", "Anja." as "Liania", "The north loggia." as "The Norse Logia"), their phonemes all as written
  and their onsets unclipped, for a person's ear (below). The packs: 18.87 MB, the largest 3.37
  MB, all eight up to date byte for byte, Station Zero's untouched. Each mission's crowd says its own lines
  (`barks.js`, 3d2e463; its unit test finds no crowd line in two missions): the critic's repeated pools were already
  gone. The bot now plays Endings A and B as well as C: from a save taken as the Finale's choice comes up, loaded from
  the title, the choice clicked, and each ending run by the wall clock in real time while the AudioContext plays it
  (the game's update without the drawing, which SwiftShader cannot keep up with): its shots with Kai off screen, every
  line's decoded clips started from the packs, the voice's output and the mix sampled, its cue and the voice in every
  speaker. It found a crowd line said over the flash before every ending's first shot (now hushed). The title and the
  edition's APK read v2.0 / 2.0.0 again (3587bfb had set them to 2.1): the release step decides them.
  Checked: `npm test` 160/160; the whole bot (`node tests/lastversion.mjs`, 2026-10-24, on `7a6bd38`) 358 passed, 0
  failed, with no page error, in 33.7 minutes: Endings A and B in real time (84.3 and 86.7 s; 24 and 23 lines, every
  line's decoded clips started from the packs, the voice heard in 2,347 of 2,975 and 2,470 of 3,139 samples), Ending C
  with no crowd line over it, SKIP a line at a time in the PREVIOUSLY card and Mission 2's opening, every line said
  (1,966) from the packs, `speechSynthesis` never asked, the survey's 1,657 pairs of views at least 23 bits apart. The
  first full run (355 of 358) failed only the bot's own new crowd-line check, which counted the epilogue's people
  (who speak as CREW) as the crowd; it now looks for the place's crowd barks. The real-time audio check (`node
  tests/lastversion-audio.mjs`) 10/10: the Prologue's card, the cold open, Mission 1's card and the florist heard from
  the packs, scored. `node tools/score-render.mjs <dir>` 26/26. No shared runtime file changed in this pass (only the
  edition, its packs, the tools and the tests; Station Zero's pack keeps its sha256 in `npm test`), so `tests/smoke.mjs`
  and `tests/qa.mjs` were not run for it. The ear check's playable page and the score's WAVs are written by the tools
  (this pass's are in the session's scratchpad, not shipped).
- **Longer chapters and a stronger story after the closing pass** (2026-10-24; `git log 3d2e463..`; the player's
  points 4 and 5; DESIGN.md "The closing pass, longer chapters and a stronger story"). The missions the critic
  measured as short got played threads, not narration: Mission 10 the guard post, Lin's interview reel, a prisoner
  whose loop lets him say a little more each time, Sera at her skiff and the flood pole; Mission 12 the glazier's
  fallen frame (`m12_glazier`), Lin's planter on the north roof, the Witness on the gangway with no shadow, his camp
  and his tape recorder (REVERSE), a question face to face and Mira's voice in the second ring; Mission 14 the warden
  in person, the beacon calling in Mira's voice and THE LAST TICKET; Mission 17 Mira's side of the far dishes and WHO
  PAID FOR THE ARRAY; Mission 21 Chamber One rebuilt on the summit, Mira in the chair, the glazier and Brask's last
  round; and Missions 6, 7, 9, 11, 13, 16, 19, 20 and 22 a played thread each (Ezra's book and his 2026 echo, the
  astronomer who cut the name, Brask who remembers, the boy on the bench, the frozen block and Sera's mother, Mara's
  guest book and the woman at the raincoat case, Mira's reflection walking to the wrong door, the sister's
  conversation, Ezra's echo after the arm). The Finale plays in scenes: Mira at the ring in the cold open, her voice in
  the speakers, the 41 back at its platform, three storms of her worlds reversed, the Witness at the lab gate, Sera
  and the frozen block, Mira walking the hill with Kai and talking, what he carried, "Ask me.", the second counted
  on the ring's arm, and each ending's consequence (the sky, and her answer) before its sequence. A real choice in
  Missions 12, 18, 20 and 22, each seen again in a person or a place (the glazier at the Spire and on the road; the
  scavenger's lamp in Sera's garden; Mira at the ring; HE SIGNED FOR IT on the memorial), and in Missions 11 and 13
  (the sun on the fridge, the kettle in the district). Adult Mira says 997 words in her own voice and 135 as Lin (303
  and 93 before), the Witness 577 (244); the campaign's own lines grew from 15,569 words to 19,861, and every line the
  edition says from 22,781 to 27,593. Every mission's crowd says lines of its own (`barks.js`). Mission 1's glimpse
  of the woman stays distant and in rain (3587bfb). Recorded with `tools/voice-lv.sh`: all eight packs up to date,
  checked byte for byte, 19.1 MB in all (common 2.41, prologue 2.46, act1 3.32, act2 3.36, act3 3.35, act4 2.52,
  finale 1.41 MB; budget 15 MB a file). The bot found and fixed in itself: a mission that ends inside its last step
  no longer lets the bot's loop run into the next mission, Iven's statement is taken from him in person, Mission 16's
  case is read once it is whole, Mission 18's kiln is opened while the porch is held, and a side story named before a
  thread that was finished on the way is still played. Checked: `npm test` 159/159; `node tests/smoke.mjs` passed and
  `node tests/qa.mjs` 26/26 (the only shared file changed, `tools/voice-pack.mjs`, changed only its edition branch's
  size projection); the full bot (`node tests/lastversion.mjs`, on `3eb6767`) 337 of 337, every line said
  (1,974) from the packs, `speechSynthesis` never asked, the survey's 1,657 pairs of views at least 23 bits apart.
- **Casting after the closing pass** (2026-10-23; `git log 3587bfb..`; the player's point 3, casting, and the crowd
  half of point 6): the settlement (Missions 4, 5, 7, 22, 23 and Case B) dresses as people did three thousand years
  ago. The robe, kurta, hijab and abaya avatars that both U4 reviews and the player read as present-day Gulf and
  Islamic dress (`rb_robe_m`, `rb_robe_m2`, `rb_villager_f`, `rb_villager_f2`) are gone; its people are six
  bare-headed bodies of its own (two men, two women, a grey-bearded old man and a bald old sage) and the boy's body
  for its children (its girls with a woman's hair, moved onto the head), dressed by `garments.js` in undyed and
  earth-dyed wool and linen: tunics to the shin or the ankle, mantles, cloaks, sashes and belts, built from each
  body's own outline, skinned to its bones and woven-textured, one draw call a person (a shape about 30 ms once per
  model and outfit, a dye under a millisecond). Each place dyes them from its own palette (fire, water, sky, ash,
  festival), so Missions 4, 5, 7, 22 and 23 never dress alike. Tala (Female_Adult_11) and the Elder (Female_Adult_09,
  greyed) are reconverted with their own hair and dressed the same way, and so is Niko; the storyteller, the
  astronomer and the elders are old men (`rb_elder_m`, `rb_sage_m`), slower and in old voices. No crowd anywhere
  wears a named face (`EXCEPTIONS` is empty): the receptionist (`rb_desk_f`) and Officer Haig (`rb_haig`) have faces
  of their own, and Tomas a body of his own (`rb_tomas`, 1.42 m). Roles fit their bodies and their names: Helix's
  researchers wear lab coats (a fitted cloak), its technicians slate work clothes (Mission 3's technician no longer a
  woman in a grey T-shirt), paramedics are the paramedic, Loop City's cook (Mission 21) wears an apron, and a role is
  named from its own table, never the next name in another region's list (Mission 17's recordings named a man in
  Helix slate 'Nurse' and a doctor 'Student', Mission 13's Unwritten irregulars 'Gardener' and 'Medic'). Mission 1's
  checkpoint is crowded: the place holds 30 people (29 cast, 21 of them in its crowds, with two queues at Pryce's
  booth), and today's casual crowds wear their mission's colours (Rain City's dark wet coats in Mission 1, autumn in
  6, summer in 9, winter in 15 ...), one face at most four times a year in a place and each time in other clothes. The edition's models: 45 (49 files with the four shared, 29.1 MB; 41 and 27.4 MB
  before), after the converter learnt to leave out FBXLoader's node extras (a fifth of a model's bytes, read by
  nothing; the 33 older conversions stripped with `--strip`). The packs the recast crowds changed (common, act1,
  act2, act4) were recorded again: no misses. Checked: `npm test` 158/158, with two new casting tests (the
  settlement's people in their own faces and clothes, no head cloths; roles named and dressed for the part, Tomas's
  own body, the crowded checkpoint, crowds dressed by place); render sheets of every settlement body and outfit, the
  named settlement people and the recast present-day roles, and shots of Mission 1's checkpoint, Mission 4's fire,
  Mission 5 and Mission 7's ring, looked at in the pass; the whole browser bot (`node tests/lastversion.mjs`,
  2026-10-23) 337 passed, 0 failed, with no page error: Mission 1's checkpoint queue and Rain City's coats within the
  place's 30 people, the settlement's people in Mission 4 in their own faces and made clothes, the campaign to Ending
  C and the CASE FILES, every line said (1,612) from the packs, `speechSynthesis` never asked, and the survey's 1,657
  pairs of views in different places (the closest 23 bits apart). The edition's APK (`EDITION=lastversion bash
  android/build-apk.sh`, 2026-10-23, built to measure it) is 49,040,014 bytes: 49 character files (28 MB) and 7 voice
  packs (15 MB), 0.96 MB under the 50 MB budget (46,786,715 bytes on 2026-10-22). No shared runtime file
  changed (the converter and the models' CREDITS are offline; Station Zero's 28 model files are byte for byte as they
  were): `node tests/qa.mjs` 26/26; `node tests/smoke.mjs` passed on its second run (its first, on this shared
  machine, waited past its 30 s for HALCYON to build after the vault and stopped there).
- **Casting, the last four** (2026-10-24, on `157a488`; the player's "chose the character for npc perfectly"): a
  completeness check of the casting found four people still miscast, and they are recast. *Niko* wore Male_Adult_15,
  the kurta-and-taqiyah avatar, whose woven cap the wardrobe only dyed dark: close up it read as a brimless prayer cap,
  the present-day dress the closing pass took from everyone else in the settlement. He is `rb_niko` from
  Adults/Male_Adult_09 now, his own black hair long and tied back, in the same undyed tunic and woad mantle (his older
  self in Mission 7's cold open with the hair and its tail gone to salt and pepper), the same man in Missions 4, 5 and
  7, the cold opens and Case B. *The Elder* read as a dark-haired woman of about forty (her crown sampled near black,
  RGB 8-16, in Mission 4's light): her model's maps are aged at conversion (`tools/rocketbox-textures.py` EDITS
  `age`: her hair silvered on the head map and the hair cards, lines at the brow, eyes, mouth and neck drawn into the
  colour and normal maps, her skin and lips paler, a few age spots), her wardrobe keeps the cards silver whatever the
  light (its rule had skin protection on, which kept brown strands brown), her back is bent after every pose
  (`stoop`), and her echoes in Missions 19 and 22 carry her staff (`holoProps`). In the mission light her crown now
  samples a neutral grey: RGB 103-144 (saturation 0.04-0.05) in Mission 4's four shots, pale in her echoes (220-230 in
  Mission 19, 134-155 in Mission 22). *Tomas*, "a slight boy of about thirteen", was Adults/Male_Adult_01, a man in
  his twenties scaled to 1.42 m: he is on a child's body (Children/Male_Child_01, the body young Kai has, with his
  own sandy hair and freckles in his maps: EDITS `tomas`) at 1.52 m, in a brick school jersey under a wool coat to the
  knee that his echo wears too, so his outline in Mission 15 (and Cases C and the Train) is no crowd child's and not
  young Kai's. *The glazier* of Missions 12, 21 and 23 wore exactly the technicians' body and slate (`rb_medic_f/helix
  tech`): she is `rb_glazier` (Professions/Business_Female_04, a face no one else in the edition has), the same look
  each time: copper hair, a petrol work jacket (the suit's jacket dyed), charcoal trousers, a leather bib apron (a
  `bib` for `garments.js`'s apron) and tool belt, an orange suction lifter for the panes. A check of everyone who
  comes back found one more: Mission 14's ticket keeper, on the Finale's road too, walked in the 2196 traders'
  `faded` khaki; he wears his own `keeper` look (the 41's faded navy, the amber strap of his ticket bag). The
  paramedic body leaves Acts IV and the Finale's casts (only the glazier wore it there). The edition's models: 46
  (50 files with the four shared, 29.8 MB). *Checked:* `npm test` 170/170, with a new casting test (no one of the
  settlement on an avatar whose head is covered, with a hat material or a head prop; Niko's hair is hair; Tomas on a
  child's body at a boy's height; everyone met in two missions or more, replays counted, in looks no crowd anywhere
  wears, the hand-placed in one look; the glazier's body hers alone; the Elder's maps aged and her hair cards over 85%
  silver, the PNG decoded, Tala's under 20%); the cast dump changes only the glazier's and the keeper's rows (no crowd
  changed, so no pack: `voice-lv.sh check` reports all eight up to date); close, full-length and wide shots in each
  mission's own light of Niko (Missions 4, 5, 7, the cold opens and Case B), the Elder (Mission 4, her Mission 19 and 22
  echoes), Tomas (Mission 15), the glazier (Missions 12, 21, 23) and the keeper (14, 23), all looked at, with no page
  error in any of the eleven places loaded. The edition's APK (`EDITION=lastversion bash android/build-apk.sh`, built
  to measure it) is 45,849,315 bytes with the 50 models, 4.15 MB under the 50 MB budget; its preview 122 files and
  62,883,567 bytes. *Not changed:* an echo's face still shows its mouth and the back of its hair through it (every
  hologram's, the Elder's too: the bodies of light do not write depth); the whole browser bot was not run here.
- **Casting, a second look** (2026-10-24, on `78503de`; independent checks of the last four): four things they found
  are fixed. *Tomas and young Kai were one boy in light.* Tomas's child's body is young Kai's (Children/Male_Child_01),
  and both are only ever echoes, which are drawn in one light with no maps: Tomas's sandy hair, freckles and brick
  jersey never showed, and the boy's hair is only painted, so both read as the same bald cyan boy (Tomas only taller,
  in a coat). Adult hair cards moved onto him (`hairdo`) were tried and are only wisps in light. Each boy's echo now
  wears a head of hair of its own (`garments.js hairMass`: a shell over the skull from the crown to a hairline, a little
  out from the head's own surface, its edge cut into locks by a strand map, a brighter, denser light than the face):
  Tomas a shaggy mop with a ragged fringe to his brows and over his ears, young Kai a short crop with his brow clear
  (on his echoes only; solid, in Mission 20's cold open, his painted brown hair is his own). *Echoes showed the insides
  of their mouths* (an open grin on Tomas, a hollow face on the Elder's Mission 19 echo): every echo the edition dresses
  is now drawn as its nearest surface (`wardrobe.js holoDepth`: each skinned part first into the depth buffer alone,
  after everything solid, then in its light where it is nearest; cut-out hair is left out of the depth pass and drawn
  over the head), and its single surface is denser (0.72, where three of its own layers at 0.55 made about 0.8), its
  flicker too. Shared code (world/Actors.js) is untouched. *A white patch on the Elder's breastbone*, in her robe's
  neck at face and talk distance in all three Mission 4 placements: it was on her head map, which carries the neck
  and the upper chest; the `age` edit's box for her bun reached the bottom of that piece and silvered its corner. The
  bun is now only the map's own hair islands (a flood fill finds the face's piece and leaves it out), and she is
  reconverted. Her aged, paler face had also moved the skin colour the dye guards (sampled from the face) near her
  cardigan's brown, which left squares of it in her madder robe: her body is dyed as cloth everywhere but her hands.
  *Niko as an old man* (Mission 7's cold open) was a young face with grey hair: he is his own model of the same face
  now (`rb_niko_old`, Adults/Male_Adult_09, `tools/rocketbox-textures.py` EDITS `age_m`: white hair and tail, a short
  white beard thinning to stubble, lines at the brow, the eyes and the mouth, paler skin, a few age spots), so up close
  he is an old man and still Niko. The edition's models: 47 (51 files with the four shared, 30.48 MB; the unit test's
  budget for them is 31 MB now, from 30). *Checked:* `npm test` 171/171, with a new test (the two boys of one body each
  with hair of his own on his echo, a mop and a crop; the depth pass on a built echo: depth only, after the solid scene,
  for the skinned parts but not cut-out hair, its surface thickened once; the Elder's bun its own islands and her robe
  dyed as cloth; old Niko on Niko's face with aged maps, his cards over 60% grey, the young Niko's under 10%); the cast
  dump changes one row (Mission 7's cold open, `rb_niko_old/older`); `voice-lv.sh check` reports all eight packs up to
  date (no line changed). Close, full-length and wide shots in each mission's own light, all looked at, with no page
  error: Niko (Missions 4, 5, 7, the cold opens, Case B; the old man in Mission 7's), the Elder (Mission 4's three
  placements: her crown RGB 103-144, saturation 0.04-0.05, the patch gone; her echoes in Missions 19 and 22), Tomas
  (Mission 15, Cases C and the Train, each beginning at its own case so its own mission's people load), young Kai
  (Mission 11) and the glazier (Missions 12, 21, 23). The edition's APK is 46,439,225 bytes with the 51 models, 3.56 MB
  under the 50 MB budget; its preview 123 files, 63,788,421 bytes. *Not changed:* an echo still shows no maps (its
  freckles, its clothes' colours); the whole browser bot was not run here. (The shots' first Mission 4 run lost its
  WebGL context once: the machine's disk was full, 42 MB free; with room made, by removing the two APK build folders
  the build script recreates, every run was clean.)
- **Casting, round 3** (2026-10-24, on `13e3831` and the checkpoint `1c051ba`; a follow-up check of the second look):
  what it found is fixed. *The glazier's bib was a board*: a stiff flat panel with no neck strap, its top edge out in
  front of her throat from the side and a few centimetres off her chest below the bust (Missions 21 and 12). *The
  Elder's cloak stood off her shoulders and back like a shell* and did not follow her stoop; old Niko's cloak panels
  too. Both came from how every garment was cut: round the body's bind pose, where the converted models hold their
  arms out at 43 degrees, from four extents a height (an ellipse round the widest points), and worn with the arms down
  at 71.5. `garments.js` now cuts round the body as it stands (a fresh actor's first idle frames), each ring following
  the body direction by direction (the convex hull of a cut through it at that height), and takes each point back to
  the bind pose through the very skinning it is given, so worn it comes back where it was cut. A long cloak is a cape
  gathered round the base of the neck over the shoulders and the tops of the arms, over the cloak's length, open down
  the front, the arms out at its sides; the Elder's cape follows her bent back. Mantles are cut the same way, their top
  ring gathered round the neck alone (Niko's shirt showed in two patches between his neck and a mantle that lay out on
  his shoulders). The bib lies on the chest below the shoulders and spans only its hollows to the waist, held by a
  neck strap over her lapels, pulled taut, round the back of her neck (not round her ponytail: it is modelled in her
  head's own mesh, and a strap round it stood out behind her neck to its tip). The fitted coats (the lab coats,
  Tomas's coat) stay cut round the bind pose, as they were: round the hanging arms they boxed them in. *A lost WebGL
  context left every dyed map black* (already so before this round): a recolour lives only in a render target, which
  a restored context does not bring back, so Niko's arms and neckline came back black under his undyed face, the Elder's
  body too and the glazier's whole head (her hair bands are dyed). Every recolour in use is drawn again from its source
  map on `webglcontextrestored` (`wardrobe.js redye`); checked by losing and restoring the context (WEBGL_lose_context)
  with Niko, the Elder and the glazier in a plain scene and in Missions 4 and 12: black before the fix, right after it.
  *Mission 21's glazier stood in two places at once* when chosen as the ally, at the glider deck and at the arena's
  gap, 112 m and 18 m of height apart; Rook, persuaded and chosen, sat in the director's office as well. Each stands
  only where they are now (`!(ally == ...)` on the first place; the office's Rook line keeps its text and its voice).
  *Checked:* `npm test` 172/172, with a new test (on a body of rings whose bind pose has the arms out and which stands
  with them down: the way back to the bind pose is the skinning's inverse; the bib's top edge on the chest at the
  shoulders' height, the bib within 4.5 cm of the body, a strap behind the neck within 2.5 cm of it; the Elder's cape
  and Niko's and Tala's mantles within 3.5 cm of the shoulders; a dyed map drawn again on a restored context, and not
  once its wearers have gone; in Mission 21 every ally at the gap absent from where they were met); the cast dump
  changes two rows (Mission 21's glazier and Rook, their conditions); `voice-lv.sh check` reports all eight packs up to
  date. Shots in each mission's own light (talk framing, full, face, side, back and wide), all looked at, with no page
  error and no context lost unbidden in the eleven places loaded (Mission 21 twice): Niko (Missions 4, 5, 7, the cold opens, Case B), the Elder
  (Mission 4, her echoes in Missions 19 and 22), Tomas (Mission 15, Case C), the glazier (Missions 12, 21 in both
  cases, 23). The edition's APK is 46,443,321 bytes, 3.56 MB under the 50 MB budget; its preview 123 files, 63,798,682
  bytes. *Not changed:* a cloak's cape still ends in a small step over the cloak at the back (two layers of wool); the
  fitted coats are as they were; the whole browser bot was not run here. (The machine's disk had about 0.6 GB free:
  browser runs used a temporary folder in memory, and the round's own scratch renders were pruned.)
- **Casting, castfin round 1** (2026-10-25, on `887a35d`; a player's look at the settlement's people): what it found is
  fixed. *The settlement children's tunics broke at the knees* (all of `rb_child_m2`'s variants, Missions 4–7 and the
  cases): round 3's cut, worn standing, left grey shards of leg through the skirt. The skirt is now cut, ring by ring,
  round the legs' own cut direction by direction as the body stands (as the cloaks are), and the legs it covers are no
  longer drawn under it (`garments.js` `covered`: the triangles of thighs, calves and feet wholly inside it, the body's
  buffers shared); standing, no leg comes through on any child, man or woman checked; walking, what is left is the top of
  a shin at the hem as a stride lifts it, a few centimetres (before, a fifth of the legs came through, 26 cm deep). A
  short skirt's stripe no longer zigzags in grey teeth over its hem, and a girl in a dark tunic no longer reads bare:
  the children's jerseys are dyed a light shirt under it. *The settlement wore pale modern trainers*: every person with
  a tunic, named or in a crowd, has the shoes on their body's map (a mask from the model's own feet) dyed a dark
  leather (`wardrobe.js` `feetOf`, `LEATHER`); a woman's raised heel keeps its shape, dark. *Mission 7's Helix
  technicians wore PARAMEDIC across their backs*: the patch and the badges are dyed out, on every technician and
  surveyor in that slate, named or in a crowd (the paramedics, responders and ward staff in the paramedic's own uniform
  keep it). *The Elder had a tan diamond on the back of her crown*: a tan whorl on the top of her scalp is silvered in
  her maps (`rocketbox-textures.py`, `rb_elder.glb` converted again), which did not take the diamond away: it was the
  focus marker's glow through her head, not her maps (castfin round 2, below). *The glazier's jacket hung open in a V over bare skin*: she wears a grey work top
  under it. *Mission 21's office was silent with Rook away*: when the persuaded Rook holds the gap as Kai's ally, the
  office's empty-chair narration is said (its condition; its text unchanged). *Checked:* `npm test` 173/173, with a new
  test (the skirts of the real child's, woman's and man's models worn in the poses the game gives them, recorded by the
  new browser test: whole standing, failing with the old cut; the covered legs undrawn; leather at the feet; no lettered
  technician); `tests/lastversion-garments.mjs` passes for all fifteen people; `voice-lv.sh check` reports all eight
  packs up to date. Shots (standing and mid-stride, close and at talk distance, from behind), all looked at: the
  children of Missions 4–7, boys and girls, the settlement's men and women, `rb_elder_m`, `rb_sage_m`, Niko, old Niko,
  the Elder and the glazier; Missions 3, 4, 5, 7, 12, 21 (Rook the ally), 22, 23 and Case B loaded with no page error.
  The edition's APK is 46,447,417 bytes, 3.55 MB under the 50 MB budget; its preview 123 files, 63,802,719 bytes;
  Station Zero's build packs its same 28 models. *Not changed:* a woman's raised heel stays a heel; walking, a cloak and
  the tunic under it still meet at the back as before; a striding shin top can show at a hem; the whole browser bot was
  not run here.
- **Casting, castfin round 2** (2026-10-25, on `6384fbf`; the check of round 1, by eye in the missions): what it found is
  fixed. *The tan patch on the back of the Elder's head was still there in Mission 4*, seen from behind and above at
  0.5 to 2.6 m, and the re-edited maps changed nothing. It was never in her maps: taking her hair cards, her head, the
  shadows and the focus marker's glow away in turn, only the glow made a difference. The marker (`world/Fx.js`, shared
  with Station Zero: a ring and a soft white glow at whatever Kai can use) marks a person at head height, and its glow,
  a sprite through their head, whitened what lay behind its plane and left what came forward of it unwashed: a
  hard-edged darker patch on her silver crown, and the "dark blob" on the hump of her cloak. A person's glow now sits
  0.5 m behind them, away from the camera, a halo (`person: true` on DeckWorld's people and on Station Zero's Juno;
  `main.js` hands it to `Fx.focus`); anything else is marked as before. In Mission 4 at the round-1 check's five
  distances her crown is one silver and her cloak its own brown. *The docs said her crown was fixed*: they now say
  what was edited (a tan whorl on the top of her scalp, in her maps) and what the patch was. *The children's light
  shirt over a dark skirt read as a T-shirt and a skirt*: a settlement child's tunic is one colour again, top and skirt,
  and light enough to read as cloth on the body's dark skin (`wardrobe.js` `kidOutfit`: a dark tunic changes places with
  the outfit's first light dye, which keeps every colour of the outfit; 50 variants). *Walking, the tunic came through
  the backs of cloaks and the fronts of aprons* (the settlement's cloaked men, `rb_elder_m`, old Niko, the Elder, the
  craftswoman, the potter): a cloak's length and an apron over a tunic now take the skin of the tunic straight in under
  them (a cloak's hem the skin of the tunic's hem), the tunic has a ring a centimetre under their hem and is not drawn
  under them, and they clear its pleats (`garments.js`; standing they are as they were, side by side in the lab). In the
  game's own walk (frames 136 to 166, from behind, from three-quarters and from the sides), the backs of the cloaks and
  the fronts of the aprons are clean where round 1 showed the tunic in patches; what is left is at a hem: a heel can kick
  the tunic's hem out a little past a cloak's hem, and an apron's corner can show the tunic beside it for a frame.
  `build-apk.sh`'s comment counts the edition's 51 models. *Checked:* `npm test` 174/174, with a new test (the focus
  glow 0.5 m behind a person and at the point otherwise, a person marked as one in both editions; cloaks and aprons on
  the real bodies in the game's own poses: the tunic under them left out, their lower points skinned only to the tunic's
  bones, and no sampled point of the tunic 10 cm or more above their hem through them, standing or in three phases of the
  stride, where round 1's garments put 21 to 95 through in 13 of the 18 strides; every settlement child's top the skirt's dye);
  `tests/lastversion-garments.mjs` passes for all eighteen people (now with the potter, the craftswoman and a cloaked old
  man, and their poses recorded for the unit test); `voice-lv.sh check` reports all eight packs up to date; Station
  Zero's smoke test passes. Shots, all looked at (castfin/round2): the children of Missions 4 and 5 and Case B standing
  and walking (talk, full, face, knee, walking full, side, knee and at talk distance), boys and girls, and in the lab
  beside round 1's; the settlement's men and women, `rb_elder_m`, `rb_sage_m`, Niko, old Niko, the Elder and the
  glazier's bib standing beside round 1's (the same) and in Missions 4, 5 and 7; the settlement's feet walking (dark
  leather, no trainer); Mission 7's and Mission 3's technicians from behind (no lettering); the Elder from behind in
  Mission 4; the glazier close in Missions 12 and 21. Missions 3, 4, 5, 7, 12, 21 (the glazier the ally), 22, 23 and
  Case B loaded with no page error. The edition's APK is 46,447,417 bytes, 3.55 MB under the 50 MB budget; its preview
  123 files, 63,804,993 bytes; Station Zero's build packs its same 28 models. *Not changed:* the tunic's own front can
  fold in on itself at a stride, its inside showing darker for a frame (as before); a girl's long skirt can show a small
  dark crease at the knee mid-stride (as before); the whole browser bot was not run here.
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
  unchanged) and no edition pack. U5's ear check (superseded by the closing pass's: "Voice and score after the closing
  pass" above)
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

- **Scale.** The bible's campaign is 25–30 hours (its missions' own targets add up to 22.2). The bot plays this
  edition in about 201 minutes of game time (the table at the top), about a seventh of the targets; every mission is
  below its target, twelve of the nineteen Act missions still under ten minutes in the bot, and the Finale at 11.7 of
  its 90. Making the chapters as long as the bible asks is content still to write, and a player's time is still to
  measure. The length model the earlier entries quote (890 minutes) is not an estimate and is no longer given as one.
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
- **The settlement's wardrobe** no longer waits for a person's decision (U4 left it as one: Rocketbox's robe, kurta,
  hijab and abaya avatars recoloured, which both U4 reviews read as present-day Gulf and Islamic dress on a settlement
  3,000 years old). The closing pass decided it (Built, "Casting after the closing pass"): those avatars are gone and
  the settlement's people wear wool and linen made for bodies of their own; the last of them, Niko's kurta-and-cap
  avatar, went in the castfix pass (Built, "Casting, the last four"). A person's look at the render sheets of the made
  clothes is still welcome; nothing else of it is open.
- **Models stay loaded.** Each chapter loads its people behind its card, but Actors has no release, so
  a long session keeps the models of every chapter it has visited (at most the edition's 51: its 47 people and the 4
  shared models it uses).
- **Faction support** changes who answers in Mission 21 and what people say; it does not change
  patrol responses or open safe routes elsewhere (Jun's line in the Finale is the one safe route).
- **A human ear check** of the voices and the score has still not been done: nothing in this container can play
  sound to a listener. Since the closing pass the machine's ear is wider and fairer (Built, "Voice and score after the
  closing pass": Whisper over 929 clips of the seven packs, every "seventeen" heard as 17, nothing at full scale, 15
  very short clips still flagged with phonemes that read as written), and a person has what they need to listen: the
  ear check's playable page (flagged clips first) and the score's renders (`tools/score-render.mjs`: each act's
  theme, a place in its three years, the character themes, the cards, the Zero Second and the three endings). The U5
  reviews asked for a person's listen before the preview or the APK is published again: at least the 15 clips still
  flagged, the Zero Second, the cards' and endings' cues and one region of each kind.
- **The score** is written but synthesised: themes.js holds a theme per act and per character, note for note (melody,
  harmony bar by bar, form), all from the bible's motif, and score.js plays them live through Synth's oscillators and
  noise (0 bytes of assets). It is not a recorded score: no player or orchestra, and timbres a synthesiser makes
  (piano, strings, flute, brass and glass are approximations), which a composer's recorded stems could replace region
  by region (the bible §7 asks for stems). The crowd walla is the crowds' own barks far off.
- **Cold opens** of every mission are authored (shots, lines, hooks); since the closing pass the cold opens of
  Missions 6, 10, 11, 12, 13, 17, 18, 21, 22 and the Finale go on with lines of their own (the Witness, Sera, Mira,
  the settlement's voices) and Missions 10, 12, 17, 21, 22 and the Finale have a second shot; since the U7 review Missions 4, 6, 7, 9 and 12
  and three of Act IV's stage their own people (`coldOpen.cast`) and Missions 6, 7, 11 and 12 are shot in their own year
  (`coldOpen.year`); the others use whoever already stands in the shot, in the mission's starting year and light (no
  night or grade of their own: Mission 4's "at night" is the afternoon's); the case files' replays have none of their own.
- **Mission 9** has no 08:05-08:14 clock on the HUD (the tower's "08:13" is said, not timed), and Mission 4's cold open
  has no sleeping Kai in its shot (the edition has no lying pose; he is in the blanket house when the title comes).
- **A human playtest** of the rewritten campaign (do the deductions read fairly, do the chases feel like pursuits,
  does Mission 18's hold read as a defence and Mission 20's board as an alignment, how long a player takes) has not
  been done; the bot stands in for it.
- **Device testing** of the Android build on phones has not been done in this session.
- **The edition's APK and preview are built, not installed.** The release check built both (Built, "The release
  check": the edition's APK 45,259,406 bytes with its models deflated, within the 50 MB budget; its preview 61,989,159
  bytes in 121 files, none over 3.8 MB) and played the built preview's page in headless Chromium, but no phone has
  installed or run the APK, deflated models included, and the preview has not been published again (the release step
  publishes it; at 62.0 MB it fits one publish's 64 MB).
- **Free roam's limits.** A trip is a mission's place, so a place two missions used is two trips (Helix's three wings
  are three); it arrives at the mission's first quarter's spawn (Mission 6's is its cellar stair); its people say what
  the story left them saying (the story's own conversations are said again without acting, never a new line); it has
  no watchers, quests or recordings of its own; and shops are walked into only in Rain City (the laundromat, the pharmacy,
  the café, the grocer): elsewhere they are rooms behind glass.
- **Mission 14's arrival view** was not recomposed to frame the 2196 lagoon (a U3 review nit, deferred); since the
  visual closing pass the water shows through the viaduct's open railings, between the overgrown towers. (Mission 11's
  rain, the other half of that nit, moves since the same pass.)
