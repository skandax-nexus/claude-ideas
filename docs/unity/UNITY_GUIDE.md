# AFTERZERO in Unity — Setup, Architecture, Art & Android

## Status (read this first)

- **The Unity project contains the complete game code and content**: about 6,600 lines of C# in 34 files covering the core systems, 8 zones of level data, 11 characters, 4 endings, AI, chases, UI, audio and post-processing.
- **The code compiles** against Unity's engine assemblies (2021.3 reference build) with 0 errors and 0 warnings, and the engine-independent core passes **17 automated tests** in .NET 8 (`unity/Tests`).
- **It has not been opened or played in the Unity Editor yet.** Unity can't run in the environment it was written in. Expect a short round of in-editor tuning (light intensities, speeds, a few positions) the first time you press Play.
- The URP post-processing block (`PostFX.cs`, compiled only when URP is installed) and the Editor menu script were written against the URP 17 / Unity 6 APIs but couldn't be compile-checked here.
- **There is no art yet.** Everything is procedural greybox with real lighting, emissive materials, fog, particles and post-processing. Real art plugs in through `WorldTheme` without touching gameplay (see *Art pipeline*).

## Open it (5 minutes)

**Recommended** (gets URP post-processing set up correctly):

1. Install **Unity 6 LTS** (6000.0.x) with **Android Build Support** through Unity Hub.
2. Unity Hub → *New project* → **Universal 3D** template.
3. Copy `unity/AfterZero/Assets/AfterZero` into the new project's `Assets/` folder.
4. Menu **AfterZero → 1. Configure Project**. This enables legacy and new input, ships the runtime shaders, and sets Android to landscape, IL2CPP and ARM64. Restart if Unity asks.
5. Menu **AfterZero → 2. Create Game Scene**, then press **Play**.

**Alternative:** open `unity/AfterZero` directly as a project. It runs in the Built-in pipeline (no post-processing) until you assign a URP asset in *Project Settings → Graphics*.

Useful menus: **AfterZero → 3. Validate Content** (runs the same checks as the tests), **Create World Theme Asset**, **Delete Save Data**.

## Controls

| | Keyboard / mouse | Android |
|---|---|---|
| Move / look | WASD / mouse | left floating stick / drag on the right |
| Sprint / crouch-slide | Shift / C (C while sprinting = slide) | push stick fully / SLIDE |
| Jump | Space | JUMP |
| Use / talk / skip line | E or left-click | USE |
| Shift the room's state | Q or right-click; 1/2/3 pick a state | SHIFT |
| Slip (bullet-time shift, when charged) | V or middle-click | SLIP (appears when ready) |
| Device laws / log / ask TICK / pause | L / J / H / Esc | top bar |

## Architecture

```
Assets/AfterZero/
  Scripts/Core/            AfterZero.Core (no UnityEngine dependency, unit-tested in .NET)
    Conditions.cs          condition language: "machine_activated && @ECHO"
    FactStore.cs           facts + once-rules + effects (the narrative manager)
    Laws.cs                SUBJECT VERB TARGET law language, grammar, paradoxes
    RealityEngine.cs       per-room states, locks, overrides, law slots, gravity, time scale
    ObserverBrain.cs       habit memory -> lessons -> plans (+ cross-playthrough memory)
    Objectives.cs          hidden objective layers (System 5)
    Adrenaline.cs          threat -> adrenaline -> SLIP charge
    Blueprint.cs           level data model + authoring helpers + validation
    Dialogue.cs            NPC dialogue trees, choices, TICK hints, endings
    Content/StoryContent.cs   all words: scripts, NPCs, rules, objectives, hints, endings
    Content/WorldContent.cs   all places: 8 zones, props, tokens, memories, triggers, chases
  Scripts/Runtime/         AfterZero.Runtime
    Game/GameManager.cs    the loop; wires every system; save/load; New Game+
    World/LevelBuilder.cs  Blueprint -> merged meshes, colliders, lights, props, NavMesh
    World/Palette.cs       runtime URP/Standard materials + procedural textures
    World/PropFactory.cs   procedural props, collectibles, humanoid bodies
    World/WorldTheme.cs    ScriptableObject to swap in real materials & prefabs
    Player/                InputRouter (keys/mouse/touch), PlayerMotor, PlayerCamera
    AI/ObserverAgent.cs    NavMesh stalker with perception + ObserverBrain
    AI/Chases.cs           ChaseDirector, WardenDrone, UndertowFront
    NPC/                   NpcManager/NpcActor, TickCompanion (hints), DeviceView
    Story/                 Director (authored moments), DialogueRunner, Interactor
    FX/                    AudioDirector (procedural audio), PostFX (URP), Atmosphere
    UI/                    Hud (all menus), MobileControls (multi-touch)
  Editor/AfterZeroSetup.cs one-click project/scene setup + content validation
```

**Data-driven by design.** Rooms, doors, puzzles, characters, dialogue and endings are all data. Most content changes touch only the two `Content/*.cs` files, and the tests catch broken references (an unknown script, speaker, token or condition) before Unity even opens.

**The world re-derives itself.** Any change to facts, room states or laws calls `LevelBuilder.Refresh()`, which re-evaluates every conditional element. Saves store facts, states, laws and Observer memory, and nothing else.

## Making it look great (art pipeline)

The greybox is meant to be readable, not final. To reach a premium look:

1. **Lighting first, it's the cheapest big win.** Keep one shadowed key light per room (already set up), add **Adaptive Probe Volumes** and a **reflection probe** per zone, enable **SSAO** in the URP renderer, and use HDR plus the bloom already configured.
2. **Materials.** *AfterZero → Create World Theme Asset*, fill the material slots (wall, floor, metal, pillar…) with PBR materials from your art set (sci-fi kits on the Unity Asset Store work well), and assign the theme to the `GameManager`.
3. **Props and characters.** In the same theme, map prop kinds (`terminal`, `machine`, `brain`, `observer`, `warden`, `npc:juno`, …) to prefabs. Rigged characters with Animator controllers can replace `Humanoid.Build`; the `NpcActor` still handles placement, facing and dialogue.
4. **Kit-bash the shells.** Use the generated geometry as collision and blockout, then dress it with modular wall and ceiling meshes on a non-colliding layer.
5. **VFX.** Swap the procedural particle systems for VFX Graph on PC and keep particles on mobile. The echo, shadow and Undertow looks are single materials (`echo`, `shadow`, Undertow front) and are easy to replace with shader-graph effects.

## Android build

1. Run *AfterZero → 1. Configure Project* (landscape, IL2CPP, ARM64, API 26+).
2. *File → Build Profiles → Android → Switch Platform → Build*.
3. In the game, pick *Settings → Graphics → LOW (BATTERY)* on older phones. That turns off shadows, sets 30 fps and disables film grain.

Performance budget (mid-range 2023 phone):

| Item | Target | How the project meets it |
|---|---|---|
| Frame rate | 30 fps locked (60 on high) | `Settings.Apply()` sets `targetFrameRate` per quality |
| Draw calls | < 300 | static geometry merged per room and material |
| Lights | ≤ 4 active per frame | only the current and adjacent rooms' lights are enabled |
| Shadows | 1 light, ≤ 25 m | first light per room; off on LOW |
| Audio | 0 MB of files | every sound is synthesised at startup |
| Install size | small | no textures or meshes shipped until art lands |

Test on real devices: frame rate in the Crown chase, memory, load time, touch accuracy (picking up the key, the archive panel) and battery over 30 minutes.

## Testing

```bash
cd unity/Tests && dotnet test     # 17 tests: conditions, facts, laws, engine, Observer, adrenaline,
                                  # objectives, dialogue, and full content validation
```

The content tests check that every room's spawn point is clear of walls and inside its own room, that rooms don't overlap, that every condition parses, that every script, speaker, token and dialogue jump target exists, that NPCs and tokens aren't buried in geometry, that TICK always has a hint, and that the secret ending is gated correctly.

## Known gaps and next steps

1. **First in-editor pass:** press Play, play Act I, and tune light intensities, chase speeds and the Observer's sight range. Then fix whatever real physics turns up.
2. Replace the IMGUI HUD with UI Toolkit or uGUI and TextMeshPro for final art. The `Hud` API is already a clean seam.
3. Voice acting: the `DialogueRunner` already has a `Voice(who)` hook in `AudioDirector`.
4. Localisation: all strings live in `StoryContent.cs`; move them to string tables.
5. Accessibility already in: remappable sensitivity, invert-Y, comfort camera mode (instant flip), reduce flashes, subtitle size, Story difficulty, shape-plus-colour state indicators.
