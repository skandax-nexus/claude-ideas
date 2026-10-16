# AFTERZERO

**A sci-fi thriller in which you don't just solve puzzles inside the world — you discover, test and rewrite the laws that govern it.**

You wake in a sealed room with a floating object and no instructions. Touch it and gravity lets go. Touch it again and the room turns over, and a door appears where a wall used to be. The object becomes a device that changes the state of whatever room you stand in (**PHYSICAL**, **INVERTED**, **ECHO**). Then you find out that the device runs on *laws*, and that you can rewrite them.

This repository contains:

- **`unity/AfterZero/` - the Unity 6 (URP) version** with a stronger story, 11 characters, 8 zones (~245 m × 60 m), three adrenaline chase set-pieces, a hint companion, New Game+ and Android touch controls. Start with [`docs/unity/UNITY_GUIDE.md`](docs/unity/UNITY_GUIDE.md).
- **`game/` - the original browser prototype** (Three.js): a playable 3D vertical slice for desktop and Android browsers.
- **`docs/`** - the design for the full game.

## v0.2: calm redesign

Third-person camera, a bright low-contrast look that's easy on the eyes, a new melodic soundtrack in place of the horror drones, Juno and TICK as on-screen characters, a friendlier Observer, and gameplay and character videos. See [docs/ART_AND_AUDIO.md](docs/ART_AND_AUDIO.md).

## Unity version

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
npm test                                   # core systems (Node 20+)
NODE_PATH=$(npm root -g) npm run smoke     # full playthrough in headless Chromium (needs playwright)
```

## Design principle

> Make the player feel that every discovery changes not only what they know, but what they can do.
