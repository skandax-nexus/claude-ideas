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
- **Casting, crowds and watchers** (v2.1, U4; DESIGN.md "Casting, crowds and watchers"): every
  person is cast by role, gender, age and era. Mission 1's checkpoint officer is Officer Pryce, a
  security officer in Helix black (`rb_security_f`), no longer a doctor; Dr. Lin and Mira share one face
  in two wardrobes; the Witness wears Kai's; the Child, young Kai, Tomas and every crowd child have
  children's bodies; Ward 32's bed holds a silent, flickering figure of Mira and Nurse Odile speaks
  for the ward. 31 Microsoft Rocketbox avatars (MIT, `game/assets/characters/CREDITS.md`) were
  converted for it: 18.3 MB (16 named at 1024 px, 11.2 MB; 15 crowd bodies at 512 px, 7.1 MB).
  Wardrobes are GPU recolours cached per model, variant and map, with the person's own skin kept.
  Crowds walk every mission's place (24 people at most with the named), by era (2026/2049, the
  settlement, 2196) and role, never wearing a named face or another era's; Rain City's carry
  umbrellas and stop with the clocks. Watchers are Helix drones, Continuum troopers, scavengers with
  lanterns, the Unwritten, the Spire's elites or Mission 17's red mimics; the Observer robot is gone
  from the edition. The edition's APK and preview carry only its 40 character files (27.3 MB; the
  23.9 MB of Station Zero's own looks and crew stay out), and Station Zero's build carries exactly
  the 28 files it shipped in 1.1.1. Measured 2026-10-21 in this container:
  `EDITION=lastversion bash android/build-apk.sh` built `AFTERZERO-LastVersion-v2.0.apk` at
  45,712,284 bytes (budget 50 MB), and its preview at 53.3 MB with no file over 15 MB (the largest is
  the 14 MB voice pack); a chapter's people loading behind its card (`CAST_LOAD`, the game running in
  Mission 1) took 3.7 s for Act I's 17 models, 3.4 s for Act II's, 2.1 s for Act III's, with at most
  84, 96 and 80 ms of main-thread work in any one frame (budget 150 ms; Acts IV, the Finale and the
  cases then found everything loaded); with its crowds Mission 1 costs 27 static draw calls and
  180k triangles in the scene pass (262 draw calls and 343–350k triangles for the whole frame,
  11.4–11.5 ms of JavaScript on average, 15.0–16.4 ms p95), Mission 4's THE VILLAGE 25 and 86k
  (8.0 ms) and BEFORE THE FIRE 20 and 22k (4.1 ms): all within §4.7.
- **Optional quest chains B and C** (Tala and Niko's river; Mara's two records) as the Cases
  chapter.
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
- **Puzzles** in Acts II–IV are the places' own crossings (the 2026 stone arch over Mission 18's
  chasm, the 2049 lamp-post heads, the 2196 tilted floors; Mission 19's bridge seen only in its
  reflection, which holds in 2026 or once the reflection is brought back in step; the Museum's
  spiral, drowned in 2049) and the beats at their landmarks. The bible's bespoke mechanisms of
  those missions (the reflection lag, the arena's collapse order, the alignment of three memories,
  the slabs reversed into a stair) have their landmarks and geometry; their REVERSE processes and
  scenes are U6–U8's.

## Planned / not done

- **Scale.** The bible's campaign is 25–30 hours. A first playthrough of this edition is a few
  hours: the Prologue is roughly 40–60 minutes, each later mission 10–20 minutes. Not measured
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
- **People cast but not yet placed** (U4 gave them a face; U6–U8 put them in their missions): Rook in
  person (M2, M8), Officers Dale and Haig and Pryce's M2 recording, the receptionist, the District
  Warden and the Gardener (M14, M15), young Kai (M11, M17, M20), Tomas (M15), the Director of
  Continuity (M10, M21). Missions 22 and 23 still carry watchers from their v2.0 beats (the fragment's
  drone or scavenger), where the spec has none.
- **The settlement's wardrobe** (Rocketbox's robe, kurta and head-cloth avatars recoloured in ochre,
  indigo, madder and undyed linen) waits for a human review of its render sheet.
- **Models stay loaded.** Each chapter loads its people behind its card, but Actors has no release, so
  a long session keeps the models of every chapter it has visited (at most the edition's 40).
- **Faction support** changes who answers in Mission 21 and what people say; it does not change
  patrol responses or open safe routes elsewhere (Jun's line in the Finale is the one safe route).
- **A human ear check** of the U5 voices (the audition page above), and of the score's regions and cues,
  has not been done: nothing in this container can play sound to a listener. The machine check above
  stands in for it.
- **The score** is procedural (Synth's oscillators and noise, 0 bytes of assets): the bible's cues are
  there by name and shape, not as composed music; the crowd walla is the crowds' own barks far off.
- **Cold opens** are today's intros staged with a default camera (behind and over Kai's shoulder);
  authored shots, hooks and the story's cold opens come with U6–U8, which record their own lines.
- **Device testing** of the Android build on phones has not been done in this session.
