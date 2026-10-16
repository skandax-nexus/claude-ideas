# AFTERZERO

**A sci-fi thriller in which you don't just solve puzzles inside the world — you discover, test and rewrite the laws that govern it.**

You wake in a sealed room with a floating object and no instructions. Touch it and gravity lets go. Touch it again and the room turns over, and a door appears where a wall used to be. The object becomes a device that changes the state of whatever room you stand in (**PHYSICAL**, **INVERTED**, **ECHO**). Then you find out that the device runs on *laws*, and that you can rewrite them.

This repository contains:

- **`unity/AfterZero/` - the Unity 6 (URP) version** with a stronger story, 11 characters, 8 zones (~245 m × 60 m), three adrenaline chase set-pieces, a hint companion, New Game+ and Android touch controls. Start with [`docs/unity/UNITY_GUIDE.md`](docs/unity/UNITY_GUIDE.md).
- **`game/` - the browser game** (Three.js): the Station Zero prologue plus the generated vessel campaign, for desktop and Android browsers.
- **`docs/`** - the design for the full game.

## v0.6: modelled, motion-captured characters

Everyone you see is now a professionally modelled, rigged character (Mixamo models from the three.js examples, in `game/assets/characters`) animated with motion capture (`game/js/world/Actors.js`):

- **Cast:** Ren is Michelle (shades, headphones, a real face). Kai, Asha, Leo and Mira wear Vanguard armour, in any suit colour. Noor is a synthetic, and Juno wears green armour. The Custodian, the Other and crew echoes are glowing holograms.
- **Motion:** idle, walk and run blend smoothly by speed, with the stride matched to ground speed so feet don't slide. There's a leap pose in the air, nods and head-shakes while talking, a head that turns to whoever you're talking to, and a wave.
- **Retargeting:** clips are retargeted between skeletons through world space, so any Mixamo-rigged `.glb` added to `MODELS` joins the cast.
- **Fallback:** if the models can't load, the procedural humans (`humans.js`) stand in. The APK and the single-file preview carry the models inline.

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
NODE_PATH=$(npm root -g) npm run features  # v0.4 features on desktop and a touch phone: characters, voices, prompts, zoom, stick, dock
```

## Design principle

> Make the player feel that every discovery changes not only what they know, but what they can do.
