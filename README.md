# AFTERZERO

**A sci-fi thriller in which you don't just solve puzzles inside the world — you discover, test and rewrite the laws that govern it.**

You wake in a sealed room with a floating object and no instructions. Touch it and gravity lets go. Touch it again and the room turns over, and a door appears where a wall used to be. The object becomes a device that changes the state of whatever room you stand in (**PHYSICAL**, **INVERTED**, **ECHO**). Then you find out that the device runs on *laws*, and that you can rewrite them.

This repository contains:

- **`unity/AfterZero/` - the Unity 6 (URP) version** with a stronger story, 11 characters, 8 zones (~245 m × 60 m), three adrenaline chase set-pieces, a hint companion, New Game+ and Android touch controls. Start with [`docs/unity/UNITY_GUIDE.md`](docs/unity/UNITY_GUIDE.md).
- **`game/` - the browser game** (Three.js): the two-hour prologue (Station Zero and the open districts of HALCYON), THE CRADLE beneath it, and the generated vessel campaign, for desktop and Android browsers.
- **`docs/`** - the design for the full game. The whole story, level by level, is in [`docs/STORY.md`](docs/STORY.md).

## Versions

Each version is kept separately. It has its own git commit, its own Android app and its own web preview. A new version installs beside the old one, with its own icon and its own saves, and does not replace it.

| Version | Status | Commit | Android app | Web preview |
| --- | --- | --- | --- | --- |
| **v1.0** | in development | this branch | `AFTERZERO-v1.0.apk`, app "AFTERZERO 1.0" (`com.afterzero.v1_0`) | new artifact, published with the first v1.0 build |
| **v0.9** | saved | `293d857` (tag `v0.9.0`) | `AFTERZERO-v0.9.apk`, app "AFTERZERO" (`com.afterzero.preview`) | [claude.ai/artifact/6m2ucDKS4hUW5bE818FZQz](https://claude.ai/artifact/6m2ucDKS4hUW5bE818FZQz) |

`android/build-apk.sh` takes the version from `versionName` in `android/AndroidManifest.xml`. To start a new version, raise `versionCode` and `versionName` and change the app label there. The script then names the APK and the app id from it.

To rebuild a saved version, check out its commit and run the script.

## v1.0: one story, THE CRADLE, and a Vessel that remembers your choice

The prologue, HALCYON and the Vessel are now one story with one truth. The whole of it, level by level, is in [`docs/STORY.md`](docs/STORY.md).

- **The truth, said out loud.**
  - The brain in the machine is the first Ren, Dr. Ilse Varga's son, and you are the forty-second Ren the field has grown from him.
  - The "her" the Custodian saw you carry is Juno: on the night of the Zero Event the first Ren carried her out of the flooded reactor, and he did not survive it.
  - The R. VARGA-ZERO badge was his, and the reactor's doors, keyed to the name VARGA, opened for him at 03:04.
  - The core's first law takes a key and a pair of hands. He wrote the key so the fold has to be chosen again every cycle; whoever puts their hands on the law at 03:12 is that cycle's culprit. So every story number still has its own culprit.
- **THE CRADLE, a new chapter** ([`docs/CRADLE.md`](docs/CRADLE.md)) between the prologue and the Vessel.
  - Three districts of sleeping pods beneath Station Zero, under the roots of the Glass Forest, about 25 minutes: Varga's last log, the sleep registry (where Juno finally confesses), and row one, where you meet Varga.
  - It is told four ways: after SEVERED (the lids stand open, Varga is awake, the drones stand dark and still), after SUSTAINED (Varga's dream, drones that hunt with what you taught the Observer), after OBSERVED (Varga awake, violet drones that only watch) and before the choice.
  - The prologue's end screen now offers **GO BENEATH** or **SKIP TO THE VESSEL**, and the Cradle's last gate, NIGHT WATCH - FORWARD DECKS, leads into the Vessel. The chapter menu has a fifth card, THE CRADLE, with its own CONTINUE.
- **The Vessel after each ending.** The ending you chose at the machine changes how Deck 1 opens, the watchers (still, learned or kin), the windows (stars, or black glass after SEVERED), the light (emergency light after SEVERED), who is aboard (Juno on the Bridge after SEVERED, the Other hanging from the ceiling after SUSTAINED), the last scene on the Bridge and the replay button (CYCLE 43, TELL IT AGAIN or FOLD AGAIN). A story number still deals the same crew and the same truth whatever you chose. The game remembers your last ending on the device, so chapters started from the menu play in that world (their cards say "After SEVERED", and so on).
- **Plot holes fixed.** Kade's eighteen years; two drones in Neon Meridian; the Observer's drones (not the Observer) at the tower; Juno is the last one awake "down here"; Varga speaks in her own voice everywhere; HALCYON's screens correct Varga's record and Juno's lines after them now play; the journal and map speak of districts in HALCYON; the victim always fits the twist and motive; alibis are "on the radio", so nobody is in two places at once; the twists and motives no longer contradict the machine's one occupant; the SUBJECT HOLDING sign remembers CYCLE 42 in ECHO.
- **Voice.** About 340 new recordings (the voice pack grows from 1681 to 1946 unique pieces): the Cradle, the Vessel's openings and Bridge scenes for each ending, the watchers' hints, Varga's re-voiced logs, the "It might be ..." lines recorded whole, and the Other in your own (male or female) voice.
- **Tests:** `node tests/cradle.mjs` plays the Cradle's three districts after every ending and walks into the Vessel, and plays the Bridge's last scene for each ending; `tests/vessel.mjs` replays the watched decks after each ending; `npm test` checks every ending against 200 story numbers and keeps HALCYON's twelve districts unchanged.

## v0.9: chapters, save slots, Story Studio, smart renderer

- **NEW GAME asks for a chapter:** **Prologue**, **HALCYON**, **The Vessel** or **Story Studio**.
  - Each chapter card has its own **CONTINUE** button, which resumes that chapter's latest save.
- **Save slots:**
  - A new game asks for one of three slots and autosaves there as you play.
  - A slot that is already in use asks before it is replaced.
  - **DELETE** removes a save after a second tap ("SURE?").
- **Story Studio:** describe the vessel story you want and the game builds it on the device, with no connection.
  - **What you can set:** a title, a mood (thriller, horror, mystery, hopeful), why the time loop exists, the final twist, your crew's names and a story number.
  - **How it is built:**
    - The crew, clues, rooms and culprit are generated around your choices.
    - The same number and choices always tell the same story.
    - It is a rule-based story generator, not a chat AI: it recombines hand-written story parts and does not write new prose.
- **Smart renderer:** the game watches its real frame rate while you play and keeps it smooth on its own.
  - **When it slows:** it first lowers the resolution (down to 60%), then the effects.
  - **When there is headroom:** it raises them again, but never above the quality you chose in Settings.
  - On by default; switch it off in Settings.

## v0.8: HALCYON - a two-hour prologue with open districts

Station Zero turns out to be the basement of **HALCYON**, a city-sized arcology. Varga's vault recording sends Ren up the long way. Four open districts, each a different kind of film, sit between the vault and the machine, and the prologue now runs about two hours. See [docs/HALCYON.md](docs/HALCYON.md).

| Chapter | Feel | Districts | Who you meet |
| --- | --- | --- | --- |
| **Neon Meridian** | Rain-soaked noir city under a glass sky, drones on the streets | Meridian Square, The Overpass, Night Station | Kade, who fixes the neon |
| **The Drowned Reactor** | Industrial horror, black water, orange alarms | Turbine Floor, The Sump, Control Deck | Chief Osei's echo |
| **The Glass Forest** | Glowing forest under a dome, quiet and eerie | The Canopy, The Still Pond, The Cabin Road | Theo, who kept the garden |
| **The Signal Tower** | Storm and lightning, the Observer hunting | Storm Deck, Antenna Field, Last Landing | Varga's echo |

- **Open maps:** each district is one big open space (72 × 108 m) of streets, buildings, water, trees or masts. Every obstacle has more than one answer:
  - Fall up to the glass dome (INVERTED), walk across it, then drop onto a roof or past the water.
  - The old stairs and bridges are memories: ECHOES SOLIDIFY IN ECHO.
  - Float up in zero gravity, or freeze the drones with a law.
- **Atmosphere:** lit windows and neon, wet roads that catch the light, rain, steam, fireflies, lightning.
- **Real-world look:**
  - CC0 photo-scanned surfaces from ambientCG and Poly Haven: asphalt, paving, concrete, rusty metal, bark, moss and rock (`game/assets/textures`).
  - Lighting and reflections from real sky photos.
  - A film grade for each chapter, smoother edges, and bloom only on real light sources.
  - Street lamps with pools of light, sidewalks, road markings, cars, rooftop equipment, and real trees in the forest.
- **Controls:** one **WALK/RUN** button (Z on desktop), and running is faster.
- **Characters:** smoother, rim-lit and grounded. Every model can be Ren's look (17 in all), each with its portrait.
- **Story:** 229 new voiced lines, from the same neural voices.
- **Test:** `npm run halcyon` plays all 12 districts through and checks the alternative solutions.

## v0.7: you hear every line, a cleaner screen, one Ren with many looks

- **Voiced dialogue that always plays**
  - Every line is spoken with natural neural voices (Kokoro TTS), recorded into a voice pack (`game/assets/voice`, built by `tools/voice-pack.mjs` + `tools/voice-pack.py`).
  - Scripted lines are recorded whole. Generated vessel lines are spliced from recorded phrases plus every crew name, place and deck, so the crew of any seed can speak.
  - It plays through the game's own audio, so it works wherever the music does (the old build relied on the device's text-to-speech, which many phones and the app's WebView don't have). Device speech remains the fallback.
- **Transparent captions:** dialogue, toasts, the objective and the in-world log screens float over the scene as light text with a soft dark outline, with no cards behind them.
- **Nothing overlaps:** the dock moved to the bottom centre, the objective sits under the room state, and the minimap sits in the top corner on phones. `npm run layout` checks every HUD piece against every other on desktop, laptop, three phone sizes and a tablet.
- **One character, many looks:** you are always Ren; the character screen changes how Ren looks.
  - **Nova:** an anime-style VRM avatar with blinking eyes, a mouth that moves while talking, and hair and outfit colour choices.
  - **Street** (Michelle), **Flight suit** and **Spacesuit**. Ren's voice follows the look.
  - Each look's button shows its portrait (`game/assets/looks`, rendered by `tools/look-thumbs.mjs`).
  - Models are plain glTF (no WebAssembly decoders), so they load on hosts that forbid WebAssembly; `tools/unpack-meshopt.mjs` unpacks meshopt-compressed downloads.
- **New cast** (`game/js/world/Actors.js`, `People.js`):
  - The crew and Juno are modelled people in everyday and work clothes (Quaternius, CC0); echoes are holograms of them.
  - All rigs (Mixamo, VRM, Quaternius) map onto one skeleton. Walk and run speeds are measured from each clip's feet, so steps match movement.
  - Credits are in `game/assets/characters/CREDITS.md`.
- **APK:** the game is served from inside the APK at `https://afterzero.app/`, so it can load the models and the voice pack offline.

## v0.4: choose your character, voiced interactions, controls that stay out of the way

- **Character select:** six heroes (Ren the explorer, Kai the pilot, Asha the engineer, Mira the medic, Leo from security, Noor the scientist), each with adjustable skin tone, hair colour, hairstyle and suit colour.
  - The choice is previewed live in 3D and can be changed any time from the title or pause menu.
- **Voiced dialogue**
  - Every line can be spoken aloud: through the browser's speech engine on the web, or Android's own text-to-speech in the APK.
  - Each character gets their own voice, including a generated voice for every crew member, and the music ducks under speech.
  - The videos are voiced offline with the Kokoro neural TTS (`tools/voice-lines.py`).
- **Interactions you can see and hear**
  - **Prompts:** the use prompt floats over the object itself, with a soft ring marking it (tap it on touch screens).
  - **Conversations:** the camera eases into an over-the-shoulder shot, with a soft letterbox.
  - **Logs:** they play on hologram screens.
  - **Doors** glide open. Pickups, tokens, saves and records sparkle.
  - **Sounds:** each action has its own sound — terminals, doors, key and core inserts, beacons, tokens, greetings, jumps, landings and menus.
- **Zoom by touch:** pinch on phones and the mouse wheel on desktop. Double-tap the look area to reset. There are no zoom buttons.
- **Integrated controls**
  - **Joystick:** appears under your left thumb anywhere on the left side.
  - **Buttons:** a slim jump button and a SHIFT button that shows the current state.
  - **The dock:** one quiet strip of icons for laws, log, map, TICK and the menu, with key hints on desktop.
  - **Calm HUD:** dims while you play and brightens when something happens.

## v0.3: the vessel (about 5½ hours of play)

The browser game is now a full campaign: the 35-minute **Station Zero** prologue, then **the vessel** — 8 generated decks with 4 sectors each, about 5 hours of play. See [docs/VESSEL.md](docs/VESSEL.md).

- **Generated levels.** Every room is built from a seed, out of the following parts:
  - **Pits**, crossed on the ceiling, on an echo bridge, on hard light, or in zero-g.
  - **Ledges** reached by stairs or zero-g, and **doors on the ceiling**.
  - **Locks** opened with **memory keys** and **power-core sockets**.
  - **Time sweepers** and **watched halls** with sentinels.

  Every room can be solved within the device's three law slots. A QA bot plays every generated room with real physics to prove it.
- **A generated story.** Seven crew members (names, roles, faces, personalities), one of whom started the loop.
  - Each deck has logs, a record whose official version and **echo** version disagree, and an encounter.
  - A suspects board in your log, and a final **verdict** on the bridge with a twist that differs from seed to seed.
- **Two new laws.** `TIME FREEZES IN ...` stops sweepers. `HARD LIGHT SOLIDIFY IN ...` makes gold outlines walkable.
- **Real-proportion humans** in futuristic costumes (explorer, engineer, scientist, security, pilot, medic, robe), with faces, blinking, talking, looking at you and waving. Holograms are used for echoes.
- **Comfort and controls**
  - **Camera:** zoom with the wheel, a pinch or the +/- buttons; four views (close, standard, far, overview), cycled with V.
  - **Comfort mode:** instant gravity flips and a steadier camera.
  - **Settings:** field of view, look sensitivity and invert Y.
- **Saving:** three save slots plus an autosave, F5/F9 quick save and load, and memory beacons that save in story rooms.
- **Maps:** a minimap and a full map (M) for both the station and every generated sector.
- **Graphics presets:** ambient occlusion (HIGH), soft bloom (MEDIUM and HIGH), image-based lighting, and bump-mapped panels. LOW is picked automatically on software renderers.

| | Desktop | Android |
|---|---|---|
| Zoom / camera view | mouse wheel, V | pinch, double-tap to reset |
| Map / save / load | M, F5, F9, pause menu | dock MAP or tap the minimap, pause menu |

## v0.2: calm redesign

Third-person camera, a bright low-contrast look that's easy on the eyes, a new melodic soundtrack in place of the horror drones, Juno and TICK as on-screen characters, a friendlier Observer, and gameplay and character videos. See [docs/ART_AND_AUDIO.md](docs/ART_AND_AUDIO.md).

## Unity version

> The v0.3 features (generated vessel, new humans, saves, maps, camera zoom) are in the browser game, which is also what the Android APK wraps. The Unity project is still at v0.2.

| Doc | What's in it |
|---|---|
| [UNITY_GUIDE.md](docs/unity/UNITY_GUIDE.md) | Status, 5-minute setup, architecture, art pipeline, Android build |
| [STORY_BIBLE.md](docs/unity/STORY_BIBLE.md) | The rebuilt story: cast, three acts, twist ladder, choices, four endings |
| [WORLD_MAPS.md](docs/unity/WORLD_MAPS.md) | Every zone, with plans rendered from the actual level data |
| [PLAYER_EXPERIENCE.md](docs/unity/PLAYER_EXPERIENCE.md) | Smoothness, adrenaline, player-friendliness, and ethical engagement |

```bash
cd unity/Tests && dotnet test     # 17 tests over the core systems and all story/level content
```

## Play

```bash
npm start            # serves game/ on http://localhost:8080
```

Or serve the `game/` folder with any static web server (it's plain ES modules, so there's no build step). On Android, open the URL in Chrome in landscape and use *Add to Home screen* to install it as a full-screen app.

| | Desktop | Android |
|---|---|---|
| Move / look | WASD + mouse | left stick + right-side drag |
| Use / skip line | E or left-click | USE |
| Shift the room | Q or right-click; 1 / 2 / 3 to choose | SHIFT |
| Jump / run | Space / Shift | JUMP / push the stick fully |
| Device laws | L or Tab | LAWS |
| Log (theory log, questions, Observer) | J | LOG |

The game gives you no tutorial on purpose. Look closer.

## What's in the slice

- **The five systems from the design, all working together:**
  1. *Programmable reality*: per-room states plus a law language (`GRAVITY INVERTS IN INVERTED`, `HELD MATTER PERSISTS THROUGH PHYSICAL`, `ECHOES SOLIDIFY IN ECHO`, …) that you compose from tokens you find.
  2. *The Observer*: an adaptive entity that learns your hiding spots, aisles, ceiling-walking, running and the laws you use on it, and tells you when it has learned something.
  3. *Discoveries change earlier events*: recordings gain sentences, signs change, and the lab turns into a spaceship.
  4. *Contradictions*: carry a memory into reality to change what the archive believes.
  5. *A hidden objective* that is rewritten as the evidence changes.
- **Four locations:** Antechamber → Laboratory (the hub, which changes meaning five times) → Observation Hall → Archive & Vault, plus a hidden passage.
- **Five characters:** you, Dr. Ilse Varga, the Observer, the Custodian, the Other.
- **Three endings**, autosave, procedural audio, and a built-in **playtest report** that includes the three post-demo questions.

## Repository

```
game/                    the playable slice (Three.js r169, vendored; no build step)
  js/core/               pure, unit-tested systems: conditions, laws, reality engine,
                         facts & rules, Observer brain, objectives
  js/world/              maps (data), story (data), world builder, director, models
  js/entities/           player controller (gravity + camera roll), Observer
  js/ui/ js/audio/       HUD, law editor, journal, touch input, procedural audio
docs/
  GDD.md                 game design document: pillars, systems, loop, 2-hour structure
  MAPS.md                level designs for the slice and the full campaign
  CHARACTERS.md          the cast and how each one drives a system
  REALITY_ENGINE.md      engine spec: law language, conditions, Observer AI, UE5 port
  PRODUCTION.md          phases, Android test checklist, team, risks
tests/
  core.test.mjs          unit tests for the core systems (npm test)
  smoke.mjs              headless browser playthrough of the whole slice (npm run smoke)
```

## Tests

```bash
npm test                                   # core systems + generator invariants over many seeds (Node 20+)
NODE_PATH=$(npm root -g) npm run smoke     # full prologue playthrough in headless Chromium (needs playwright)
NODE_PATH=$(npm root -g) npm run vessel    # QA bot plays every generated room of 2 seeds (pass a seed count to test more)
NODE_PATH=$(npm root -g) npm run features  # features on desktop and a touch phone: chapters, slots, Story Studio, smart renderer, looks, voice pack, zoom, stick
NODE_PATH=$(npm root -g) npm run layout    # no HUD piece overlaps another, on nine screen sizes
NODE_PATH=$(npm root -g) npm run halcyon   # plays HALCYON's 12 open districts and the lift home
```

## Design principle

> Make the player feel that every discovery changes not only what they know, but what they can do.
