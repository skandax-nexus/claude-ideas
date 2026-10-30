# The Reprogrammable Reality Engine

This is the technical heart of AFTERZERO: how rooms change state, how the device's **laws** are compiled and queried, how the narrative remembers, and how the Observer learns. Every subsystem is plain data + small pure modules, unit-tested in Node (`npm test`) and portable to Unreal Engine 5.

```
                 ┌──────────────┐   facts changed    ┌───────────────┐
  interactions → │  FactStore   │ ─────────────────→ │  Objectives   │  (System 5)
  (Director)     │  + rules     │ ──┐                └───────────────┘
                 └──────────────┘   │ refresh()
                                    ▼
 ┌──────────────┐  shift / laws  ┌──────────────┐  colliders, visibility  ┌──────────┐
 │ RealityEngine│ ─────────────→ │    World     │ ──────────────────────→ │  Player  │
 │ rooms+laws   │                │ (conditions) │                         └──────────┘
 └──────┬───────┘                └──────────────┘
        │ gravity(room), has(effect, state)
        ▼
 ┌──────────────┐   perceives player, records habits   ┌───────────────┐
 │   Observer   │ ───────────────────────────────────→ │ ObserverBrain │  (System 2)
 └──────────────┘ ←─────────────── plans ───────────── └───────────────┘
```

| Module | File | Role |
|---|---|---|
| Condition language | `game/js/core/conditions.js` | Parses authored conditions once, evaluates fast. |
| Law language | `game/js/core/Laws.js` | Tokens, grammar, compiler, paradox rules. |
| Reality manager | `game/js/core/RealityEngine.js` | Per-room state, locks, scripted overrides, law slots. |
| Narrative manager | `game/js/core/FactStore.js` | Facts + once-rules + effects. |
| Hidden objective | `game/js/core/Objectives.js` | Layered objective with history. |
| Observer memory | `game/js/core/ObserverBrain.js` | Habits → lessons → plans. |
| Environment system | `game/js/world/World.js` | Map data → meshes + colliders; re-derives on change. |
| Authored content | `game/js/world/maps.js`, `story.js` | Rooms, elements, items, tokens, scripts, rules. |
| Director | `game/js/world/Director.js` | Authored moments (touch, play, speak, carry). |

---

## 1. Room states

```js
engine.state('lab')            // 'PHYSICAL' | 'INVERTED' | 'ECHO'
engine.cycle('lab')            // PHYSICAL → INVERTED → ECHO → PHYSICAL
engine.setState('lab', 'ECHO')
engine.lock('antechamber')     // the device has no effect here (yet)
engine.setOverride('antechamber', { zeroG: true })  // scripted, lawless behaviour
engine.gravity('lab')          // -1 down, +1 up, 0 weightless
```

The device always acts on **the room the player stands in**. Corridors belong to a room (they share its state), which is what lets the player leave the antechamber upside-down along the corridor's ceiling and drop into the lab.

## 2. The law language

A law is `SUBJECT VERB TARGET`. The engine compiles the installed laws into **effect sets** (`effect → set of states`). Game code never asks "is the room inverted?"; it asks "does a law say gravity flips in this room's state?".

| Subject + verb | Effect key | Queried by |
|---|---|---|
| `GRAVITY INVERTS IN` | `gravityFlip` | `engine.gravity(room)` → Player |
| `GRAVITY FREEZES IN` | `zeroG` | `engine.gravity(room)` → Player |
| `HELD MATTER PERSISTS THROUGH` | `heldPersists` | item-dissolve check in the main loop |
| `OBSERVER FREEZES IN` | `observerFrozen` | Observer update (until it learns immunity) |
| `ECHOES SOLIDIFY IN` | `echoSolid` | World: echo elements become colliders |
| `ECHOES PERSISTS THROUGH` | `echoVisible` | World: echo elements stay visible |

Targets: `PHYSICAL`, `INVERTED`, `ECHO`, `ALL STATES`.

Rules:
- **Syntax faults** (a subject/verb pair not in the grammar) are rejected with a message that teaches the grammar: `SYNTAX FAULT: "HELD MATTER INVERTS IN" MEANS NOTHING`.
- **Paradox resolution:** `zeroG` wins over `gravityFlip` in the same state; the device lists the paradox.
- **Slots** limit how many laws run at once (2, then 3). Choosing what *not* to run is part of the puzzle.
- **No softlocks:** PHYSICAL with no laws is always ordinary; the player can always clear a slot.

### Adding a law (3 steps)

1. Add a token in `TOKENS` (or reuse one).
2. Add a grammar entry: `'SHADOWS SOLIDIFIES': { effect: 'shadowSolid', text: 'Shadows become solid in rooms set to {T}.' }`.
3. Query it where it matters: `engine.has('shadowSolid', state)` / `engine.hasIn('shadowSolid', room)`.

Then place the token in `maps.js` (`tokens`) or grant it from the story (`game.grantToken('SHADOWS')`).

## 3. The condition language

Used by map elements, texts, interactables, items, dialogue lines, rules, objectives and endings.

```
!@INVERTED                         the element exists unless its room is inverted
machine_activated && @ECHO         only after activation, only in ECHO
shard_touch >= 2 && !other_gone    numeric comparisons
(a || b) && !c                     grouping
```

- Identifiers are **facts** (missing → false/0).
- `@STATE` is true when *the element's own room* is in that state.
- Conditions are compiled once and cached; re-evaluating the whole world is a few hundred closure calls.

## 4. World elements

```js
// maps.js
add('antechamber', [-1.5, 0, 17.6, 1.5, 4.5, 18], { mat: 'wallDark', when: '!@INVERTED' });   // a wall that leaves
add('archive', [-1.2, -0.25, -30, 1.2, 0, -24], { echo: true });                               // a bridge made of memory
add('lab', [12, 0, 4.5, 12.4, 3, 7.5], { mat: 'wall', when: '!shadow_passage_open' });         // a panel the shadow opens
```

| Flag | Meaning |
|---|---|
| (none) | Static: merged per room+material into one mesh, one draw call; static collider. |
| `when` | Exists only while the condition holds (visible + solid). |
| `echo` | Memory geometry: visible in ECHO or under `echoVisible`; solid only under `echoSolid`. |
| `solid: false` | Decorative. |

`World.refresh()` runs on every fact change, shift and law install, and rebuilds the active collider list. The player collides against axis-aligned boxes with per-axis resolution and substeps.

## 5. Narrative state (Systems 3 & 4)

```js
facts.set('machine_activated')
facts.test('machine_activated && heard_varga')
facts.addRules([{ id: 'tether', when: 'machine_activated', then: [{ set: { observer_tethered: true } }] }])
```

- Rules fire **once** when their condition becomes true and can chain (evaluated to a fixed point, max 16 passes).
- Non-`set` effects (e.g. `{ log: '…' }`) are forwarded to the game (Theory Log).
- Scripts are lists of `{ who, text, when }`; filtered at play time, so recordings grow new sentences as the world changes.
- Everything that matters is a fact, so **the save file is just facts + room states + laws + Observer memory**; the world re-derives itself on load.

## 6. The Observer (System 2)

Perception (`entities/Observer.js`): sight cone ≈100°, 15 m, line of sight blocked by pillars (slab test); hearing radius depends on running and on what it has learned; the ceiling hides you until it learns otherwise.

Suspicion builds while seen (faster up close, faster if running) and decays otherwise; at 1.0 it hunts. It searches the last known position when it loses you.

Memory and lessons (`core/ObserverBrain.js`):

| Observation | Lesson / reaction |
|---|---|
| hid behind pillar *p* while it was within 14 m and *p* blocked its view, for 1 s | count[p]++ → 2: *pause* · 3: *inspect from the far side* (with a 20 s cooldown per pillar) |
| crossed the hall mostly in lane *L* | 2 crossings → `lane`: guards *L* (60 % of plans) |
| INVERTED exposure ≥ 10 s, or caught while inverted | `ceiling`: sees and reaches the ceiling |
| frozen by law 3 times | `freeze`: ignores `OBSERVER FREEZES` |
| ran nearby for ≥ 8 s | `runner`: hearing radius 6 → 12 m |
| caught twice | `patient`: searches 7 s instead of 4 s |

Plans are chosen by `decide()`: inspect a habitual hiding spot → guard a habitual lane → patrol. Every lesson emits a one-line, in-world tell. The design rule: start with a few predictable rules, add complexity only after playtesting.

## 7. Hidden objectives (System 5)

`Objectives` holds ordered layers `{ when, text, because }`. The highest satisfied layer is shown; history keeps all previous layers with the reason they were replaced. Objectives never go backwards.

## 8. Testing & automation

- `npm test` — Node unit tests for conditions, facts, laws, engine, Observer brain, objectives, and *every authored condition in the story*.
- `npm run smoke` — headless Chromium plays the whole slice through the real systems and screenshots each beat.
- `window.AZ.simulate(seconds)` — deterministic fixed-step simulation without rendering, for bots and QA scripts.

---

## 9. Porting to Unreal Engine 5

The browser slice is the design prototype; the architecture maps one-to-one onto UE5 so the content (rooms, laws, scripts) can be ported as data.

| Web module | UE5 equivalent |
|---|---|
| `RealityEngine` | `UAZRealitySubsystem : UWorldSubsystem` — `TMap<FName, EAZRealityState>`, law slots, `GetGravity(RoomId)`, `OnShift` multicast delegate. |
| `Laws.js` grammar | `UAZLawGrammar : UDataAsset` — rows `{Subject, Verb, EffectTag}`; effects as `FGameplayTag`s (`Law.Effect.GravityFlip`). |
| Room bounds | `AAZRoomVolume : AVolume` with `RoomId`; player overlap sets current room. |
| Map elements with `when` / `echo` | `UAZStateComponent` on any actor: `Condition` string, `bEcho`; toggles visibility + collision on `OnShift` / `OnFactChanged`. |
| `conditions.js` | Same tiny parser in C++ (or `FGameplayTagQuery` for simple cases), compiled once at `BeginPlay`. |
| `FactStore` + rules | `UAZNarrativeSubsystem : UGameInstanceSubsystem` — `TMap<FName, FAZFactValue>`, rules from a `UDataTable`. |
| Scripts / recordings | `UDataTable` of lines with conditions → subtitle widget + `USoundWave`s. |
| `ObserverBrain` | `UAZObserverMemoryComponent` (pure C++), consumed by a Behavior Tree service; perception via `UAIPerceptionComponent` (sight + hearing). |
| Observer navigation | NavMesh + `MoveTo`; pillars as nav obstacles. |
| Player gravity | `UCharacterMovementComponent::SetGravityDirection` (UE 5.4+) + a camera roll interpolation; or a custom movement mode for ceiling walking. |
| `Objectives` | `UAZObjectiveSubsystem` + UMG widget with the glitch-rewrite material. |
| Save | `USaveGame` with facts, room states, laws and Observer memory — same shape as the web save. |

### Android budget (UE5, mid-range 2023 device)

| Item | Target |
|---|---|
| Frame rate | 30 fps locked (60 optional on high-end) |
| Draw calls | < 300 per frame (merge static meshes per room, as the web build does) |
| Triangles | < 300k visible |
| Lights | Baked static lighting + ≤ 2 dynamic lights per room; no dynamic shadows on the Observer except a blob |
| Post-processing | Mobile tonemapper only; state tint via material parameter collection, not full-screen passes |
| Memory | < 1.2 GB; stream rooms by level instance around the hub |
| Touch | Stick + look-drag + 3 buttons (USE / JUMP / SHIFT), 48 dp minimum targets |

Measure on real devices: frame rate, memory, load times, touch accuracy, battery drain over a 30-minute session.
