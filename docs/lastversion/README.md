# AFTERZERO: The Last Version of Earth

A separate edition of AFTERZERO built on the same engine: Kai Varen, the Chronolith,
three years of one world (Past 2026, Present 2049, Future 2196), REVERSE (from Mission 11, the
bible's inversion: hold one process backwards for a few seconds), the Witness, Mira.

- `AFTERZERO_Gameplay_Bible.pdf`: the creator's complete gameplay bible with the NPC supplement.
- `BIBLE.txt`: its text, for tools and agents.
- `DESIGN.md`: how the bible maps onto the engine (written during the build).
- `STATUS.md`: what is built, what is generated, what is still planned.
- `OVERHAUL.md`: the v2.1 overhaul spec that answers the player's feedback on v2.0 (U1–U8, all built; its
  "As built" notes say where the build differs).

v2.1 in one paragraph: 23 missions in 23 authored open places, each one map with soft quarters, threads and
side stories, a cold open and a hook; REVERSE, three years, Echo Step; 47 people of its own (Rocketbox-based) and
4 shared models, crowds and watchers; every line spoken from the edition's own packs, with a score of written themes played live; three endings with an epilogue line
per choice that mattered; and the CASE FILES, fourteen side stories and quest chains replayable from their
places. Free roam (the closing pass on "make it open world"): once a mission is done, TRAVEL on the case board (or
the map) goes back to its place, in any year opened there, to walk it with no story gates, its side stories and
fragments still there, and BACK TO THE STORY returns to where the story waits; after an ending, from the CASE FILES.
The code is in `game/js/editions/lastversion/` (`prologue.js`, `act1.js` … `act4.js`, `finale.js`,
`cases.js`, `roam.js`, `Threads.js`, `ledger.js`, `Runtime.js`, `places/`).

Build: `EDITION=lastversion bash android/build-apk.sh` (app "AFTERZERO: Last Version",
its own saves; 46,447,417 bytes when castfin round 1 built it, 2026-10-25 (45,259,406 in the release check before the casting passes), its models deflated, with seven voice packs under
`assets/voice/lv/`, the cases' empty one left out; not yet run on a phone); the default build stays the Station Zero
game (its APK's entries unchanged).

Tests: `npm test` (the edition's 145 unit tests among 173: `tests/lastversion.test.mjs` 143, `tests/lastversion-reach.test.mjs` 2) and `NODE_PATH=$(npm root -g) node tests/lastversion.mjs`
(the browser bot: NEW GAME to Ending C, Endings A and B, free roam's trips and back, the CASE FILES and a survey of the
23 places, 373 of 373 checks in 36.7 minutes in the release check; `LV_ONLY=roam` runs free roam's alone) and
`node tests/lastversion-audio.mjs` (the cards, the cold open and a conversation heard in real time; `LV_ROOT=` a built
web preview to play that instead) and `node tests/lastversion-garments.mjs` (the settlement's people dressed and posed
by the game itself, standing and walking: no leg through a tunic, leather at the feet, no PARAMEDIC on a technician;
`--fixtures` writes the poses the unit test wears them in).
Recording the voices: `VOICE_WORK=<dir> bash tools/voice-lv.sh <group>` (DESIGN.md "Voice and score").
