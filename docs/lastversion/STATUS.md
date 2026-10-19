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
- **Tests**: `tests/lastversion.test.mjs` (unit, in `npm test`: 28 tests) and `tests/lastversion.mjs`
  (browser bot, 91 checks: the Prologue from NEW GAME through both quest chains into Act I,
  Missions 5, 11 (REVERSE: 15 checks), 13, 14 and 19 and the Finale to Ending C, the Museum's
  generated rooms walked with real movement, the save namespace). Both pass; `npm test` passes
  (56), and the Station Zero suite `tests/cradle.mjs` passes (167). (Measured 2026-10-19 for
  the overhaul's U1.) In this container `tests/qa.mjs` (23 of its checks pass,
  then its last click times out) and `tests/forge.mjs` (a click's navigation wait times out
  after the save slot) also time out on the main branch's own code, side by side, so they are
  timing in this environment rather than this edition; they need a rerun on a quieter machine.

## Generated (playable, solvable by construction, not hand-tuned)

- **The places of Acts I–IV, the Finale and the Cases**: 64 generated levels (open districts and
  interiors) dressed per state, each with an authored beat. Every one is checked: each obstacle
  has a state or the anchor that gets past it, each generated route uses only its room's states,
  each beat has something that completes it, every place can snap back to the present.
- **Puzzles** are the generators' pits, ledges, keys, cores, sweepers and watchers, limited to
  what each mission's years can do. They serve the bible's verbs (cross in the past, carry a key
  out of 2026 and anchor it), but they are not the bible's specific
  puzzles: the observatory's three instruments aligned by sun and stars, the clockmaker's hidden
  staircase found by comparing room states, the hospital's sound that gets quieter as you
  approach, or the Unwritten Second's bridge seen only in reflections exist as beats and text, not
  as bespoke mechanisms. (Mission 11's reversing lock is now a real mechanism: REVERSE.)
- Room names inside generated interiors are drawn from each mission's list, so a room's name and
  its puzzle do not always match its story beat.

## Planned / not done

- **Scale.** The bible's campaign is 25–30 hours. A first playthrough of this edition is a few
  hours: the Prologue is roughly 40–60 minutes, each generated mission 10–20 minutes. Not measured
  with players.
- **Bespoke set pieces for Acts I–IV.** The Mission 9 "reach the tower before the reset" is a
  watcher reset, not a fail state; Mission 12's chase is a route with the Witness at its end, not
  a pursuit; Mission 13's battle and Mission 18's storms are watchers and weather; Mission 17's
  "security that mimics Kai" and Mission 21's elites are ordinary watchers; Mission 20's three
  memories are one district per memory rather than an alignment puzzle; Mission 22's final causal
  puzzle is read from evidence rather than assembled.
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
