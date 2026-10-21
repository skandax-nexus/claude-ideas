# AFTERZERO: The Last Version of Earth — status

An honest account of what the v2.0 edition is today, measured against the creator's bible.
The bible describes a 25–30 hour campaign; this is a playable adaptation of all of it on the
AFTERZERO engine, with the Prologue written by hand and the rest generated around authored
story beats. How it works: [`DESIGN.md`](DESIGN.md).

## Built (by hand, playable, tested)

- **The edition layer.** Its own title (AFTERZERO / THE LAST VERSION OF EARTH, with its own
  backdrop), chapter list (Prologue, Acts I–IV, Finale, Cases), save namespace (`afterzero.lv.`),
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
  court; the north wing waits for Mission 12), Helix in VERSION 17, the Ring Hill 3,000 years ago,
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
- **The NPC system** of the supplement: trust, knowledge, quest state, temporal state, faction
  standing and evidence flags in the save; dialogue choices by intent (challenge / comfort /
  investigate / withdraw); barks; echoes standing in for people absent from a state; the case
  board (evidence journal).
- **The Prologue, fully authored**: Mission 1 The Last Normal Day (Rain City, the anomalies,
  Rook's call, the checkpoint, the Zero Second, the rescue, the voice, Mira), Mission 2 Helix Goes
  Dark (emergency light, the drone, three cells, the trustworthy officer, the unit that rewinds
  its damage, the drawing, the chamber), Mission 3 The First Switch (the three years of Helix, the
  anchor, the fracture), with every quoted line of the bible; **quest chain A** (Jun Park, Last
  Train Home: the station falls back to 8:13 every 41 seconds; reroute the relay there; the line
  or the evidence) and **quest chain D** (Iven Marr, The Technician's Key: shift notes, the
  past-state service panel, the 2049-only drone Iven keeps busy, the lock that resets on every
  switch, the raw log or the trapped team), each with both outcomes and a later consequence.
- **The story spine of Acts I–IV and the Finale**: for all 20 missions, the bible's setup, three
  beats with goals, its quoted lines, scenes and choices, and its mission ending; the Mission 10
  Echo Step unlock; the Mission 13 faction choice (destroy the stabilizer / free the people); the
  Mission 15 city choice; the Mission 21 ally (Sera, Anja, Iven, or nobody); the three endings
  (A The Fixed World, B The Infinite War, C Afterzero) and "Version one hundred and eighteen."
- **Optional quest chains B and C** (Tala and Niko's river; Mara's two records) as the Cases
  chapter.
- **Stealth and evasion stand in for combat** (watchers, cones, the lure, Echo Step decoys);
  see DESIGN.md.
- **Voices**: KAI (male), MIRA, WITNESS, ROOK, NIKO, SERA, ANJA, IVEN, JUN, TALA, MARA, ORREN,
  CHILD and the narrator each have a distinct Kokoro voice in `tools/voice-pack.py`;
  `tools/voice-pack.mjs` collects the edition's lines (808 lines, 1,165 unique recordings, about
  44 minutes). **The recordings are not rendered yet**: until they are, the game speaks the
  edition's lines with the device's speech synthesis where it has one, and shows subtitles always.
- **Tests**: `tests/lastversion.test.mjs` (unit, in `npm test`: 42 tests, 14 of them for the open
  places) and `tests/lastversion.mjs` (browser bot, 121 checks: the Prologue from NEW GAME through
  both quest chains into Act I, Missions 5, 11 (REVERSE: 15 checks), 13, 14 and 19 and the Finale
  to Ending C, the Museum's generated rooms walked with real movement, the save namespace, and the
  survey of Missions 1–8's places: 19 views, their hashes in the log, the closest two missions
  29 bits apart). Both pass; `npm test` passes (70). The Station Zero suites pass too:
  `tests/cradle.mjs` (167), `tests/smoke.mjs` and `tests/qa.mjs` (26). (Measured 2026-10-21 for
  the overhaul's U2.) `tests/forge.mjs` was not rerun for U2 (earlier in this container a click's
  navigation wait timed out after the save slot on the main branch's own code as well).

## Generated (playable, solvable by construction, not hand-tuned)

- **Nothing of the places since U3.** Every mission and both cases stand in an authored open place;
  the edition no longer imports `gen/ZoneGen.js` or `gen/LevelGen.js` (a unit test greps every
  edition file), and `dress.js` and the `P` palettes are removed. What is still seeded is the scatter
  inside each authored place (debris, grass, the order of facade tints), the same on every build.
- **Puzzles** in Acts II–IV are the places' own crossings (the 2026 stone arch over Mission 18's
  chasm, the 2049 lamp-post heads, the 2196 tilted floors; Mission 19's bridge seen only in its
  reflection, which holds in 2026 or once the reflection is brought back in step; the Museum's
  spiral, drowned in 2049) and the beats at their landmarks. The bible's bespoke mechanisms of
  those missions (the reflection lag, the arena's collapse order, the alignment of three memories,
  the slabs reversed into a stair) have their landmarks and geometry; their REVERSE processes and
  scenes are U6–U8's.

## Planned / not done

- **Scale.** The bible's campaign is 25–30 hours. A first playthrough of this edition is a few
  hours: the Prologue is roughly 40–60 minutes, each generated mission 10–20 minutes. Not measured
  with players.
- **Bespoke set pieces for Acts I–IV.** The Mission 9 "reach the tower before the reset" is a
  watcher reset, not a fail state; Mission 12's chase is a route with the Witness at its end, not
  a pursuit; Mission 13's battle and Mission 18's storms are watchers and weather; Mission 17's
  "security that mimics Kai" and Mission 21's elites are ordinary watchers; Mission 20's three
  memories are three years of one plot rather than an alignment puzzle; Mission 22's final causal
  puzzle is read from evidence rather than assembled. (Their places, landmarks and years exist since
  U3; the mechanisms come with U6–U8.)
- **The ten optional missions** of the bible's list (The Child in Three Photographs, The Train
  That Arrives Yesterday, …) are not built; the Child in the Station appears in Mission 1 only.
- **Rook as a person after Mission 2.** He speaks on the radio and in recordings; the
  supplement's exposure / persuasion confrontation is only in his dialogue lines.
- **Faction support** changes who answers in Mission 21 and what people say; it does not change
  patrol responses or open safe routes elsewhere (Jun's line in the Finale is the one safe route).
- **Music** is the engine's procedural score (a chord progression per state, ambience beds per
  region), not the bible's cues.
- **Voice recordings** not rendered (see above).
- **Device testing** of the Android build on phones has not been done in this session.
