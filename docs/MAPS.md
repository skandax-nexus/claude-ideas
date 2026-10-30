# AFTERZERO — Maps & Level Design

Every map is built around one rule: **a location should change more when the player's understanding changes than when the player walks somewhere new.** Each room has three authored states (PHYSICAL / INVERTED / ECHO), and its elements also react to story facts.

Legend used in the plans below:

```
#  wall            .  floor           D  door (conditional)     T  terminal / recording
P  pillar          K  key (memory)    C  power core             *  law token
O  Observer        ~  pit / void      =  memory bridge (ECHO)   S  spawn
^  ceiling-only    ?  hidden panel    @  character              M  the Machine
```

---

## Station Zero — slice overview  **[SLICE]**

```
                              N (-z)
                  +-------------------------------+
                  |  T   VAULT   *ALL      (z-36) |
                  |~~~~~~~~~~ = ~~~~~~~~~~~~~~~~~~|  <- gap; bridge exists only as memory
                  |~~~~~~~~~~ = ~~~~~~~~~~~~~~~~~~|     ceiling route blocked by hanging stacks
                  | ##    ##   @CUSTODIAN  ##  ## |
                  | ##    ##               ##  ## |  ARCHIVE (20 x 20, h 8)
                  +--------------| |--------------+
                                 |D|  <- sealed until the lab is proven to exist
  +--------------------------+  +-----------------------+
  | *FRZ       O             |  |  ^*PER        K(echo) |----+
  | C  P   P     P    P  P   |==D         (M)           ?  T |  hidden passage (shadow)
  |    P     P      P        |  |  T                *   |----+
  | *OBS                     |  |   LABORATORY 24x24 h10|
  +--------------------------+  +-----------| |---------+
   OBSERVATION HALL 34 x 16, h 9            |D|  <- seals behind you
                                     +-------------+
                                     |   ANTECHAMBER  |  8 x 8, h 4.5
                                     |    (shard)  S  |
                                     +-------------+
                              S (+z)
```

The lab is the hub. Every other room is one short corridor away, so the player keeps passing through it — which lets it change meaning five times without a loading screen.

---

## 1. The Antechamber — "The Unknown"  **[SLICE]**

```
          z=12  to the laboratory
          +---+
          |   |   corridor (part of the antechamber: shares its state)
          |   |   ribs hang from the ceiling -> they become "floor markings" when inverted
  z=18 +--#####--+   <- this wall exists in every state except INVERTED
       |         |
       |    ◇    |   the floating object (shard) at head height
       |         |   ceiling text: YOU HAVE BEEN HERE BEFORE (readable only upside-down)
       |  S      |
  z=26 +---------+
```

| State | What changes |
|---|---|
| Start (locked) | The device does not exist yet; the room cannot be shifted. |
| Touch 1 | Scripted `zeroG` override: debris lifts and tumbles; a jump floats. |
| Touch 2 → INVERTED | The player falls to the ceiling, the camera rolls; the north wall is gone; the Other stands upside-down in the corridor. |
| Exiting | Walking along the corridor ceiling, the player crosses into the lab (PHYSICAL) and drops 3 m to its floor. A door seals behind them. |

Design intent: teach *"touching the object changes the room, not me"* and *"some things only exist in some states"* without a single word of instruction.

---

## 2. The Laboratory — the hub that changes meaning  **[SLICE]**

```
                     ARCHIVE (sealed)
      +-------------------D-------------------+
      |   "THE ROOM REMEMBERS" (echo)   [lock]|
      |  ##########                   ______  |
      |  #shelf  #   ^[*PERSISTS]     |desk|K |   K = laboratory key, exists only in ECHO
 OBS  D  #(echo  #   (ceiling alcove) |____|  |
 HALL |  # gap)  #                            ?===+  hidden passage behind the shadow
      |  ######       .----(M)----.           |T0 |  Recording 0 + *HELD MATTER
      |              (  machine    )   shadow~|===+
      |               '-----------'    on wall|
      |         footprints (echo)             |
      |   [T1]  |                     [bench] |
      |  crates |                             |
      +-------------------D-------------------+
                     from the antechamber
```

### Puzzles in this room

| Puzzle | Mechanics combined | Solution path(s) |
|---|---|---|
| **The reversed shadow** | Observation, ECHO, positioning | The shadow mirrors your z position. In ECHO it freezes into a body. Stand at z ≈ −6 so it stands on the faint outline at z ≈ +6, then shift. |
| **The ceiling token** | INVERTED + gravity law | `PERSISTS THROUGH` glows 9 m up inside a hanging frame. Invert the lab and walk to it on the ceiling. |
| **The memory key** | ECHO item + law rewrite | Pick up the key in ECHO; leaving ECHO dissolves it. Write `HELD MATTER PERSISTS THROUGH PHYSICAL` (or `ALL STATES`) and carry it to the archive lock. |
| **The machine** | Item from another room + story choice | Bring the core from the hall; the first USE plays Varga's warning, the second activates. |

### Five layers of the same room

| Layer | Condition | Changes |
|---|---|---|
| 1. Abandoned lab | start | Panels, benches, sign `LAB 0 – FIELD CONTAINMENT`. |
| 2. Spaceship | `machine_activated` | Interior skin of east/south walls removed → glass; stars and a planet outside; the starfield slowly turns; lights breathe amber; sign becomes `VESSEL AFTERZERO – LIFE SUPPORT: 1 OCCUPANT`. |
| 3. Brain | `machine_activated && @ECHO` | A human brain floats inside the ring. |
| 4. Connected entity | `brain_seen` | Cables surface across the floor to the west door, where the Observer now stands, eye pulsing in time with the brain. |
| 5. Life support | `brain_seen` (+ Custodian, ending) | Characters and endings reframe the room as a system built to keep the entity alive. |

---

## 3. The Observation Hall — "The Observer"  **[SLICE]**

```
 x=-50                                                        x=-16
  +-----------------------------------------------------------+
  | *FREEZES                     north lane (z -8..-2.4)       |
  |      P10        P7        P4             P1                |
  | C        P9        P6        P3                    *OBS?   ===  corridor to lab
  |      P11        P8        P5             P2                |
  |                              south lane (z 2.4..8)  *OBS   |
  +-----------------------------------------------------------+
   ECHO: "IT ONLY KNOWS WHAT YOU TEACH IT"     sign: "DO NOT RUN"
```

- 11 full-height pillars (cover in both PHYSICAL and INVERTED).
- 3 lanes (north / centre / south) that the Observer can learn.
- The power core sits on a pedestal at the far end; `FREEZES IN` is beside it, `OBSERVER` near the entrance.
- Navigation: a 1 m grid A* with string-pulling over the hall and its corridor.

| State | Effect on the encounter |
|---|---|
| PHYSICAL | Pure stealth: pillars, sight cone (≈100°, 15 m), hearing (running is loud). |
| INVERTED | You walk on the ceiling; the Observer doesn't look up — **until it learns to** (10 s of exposure, or catching you there). |
| ECHO | Its past route appears as a trail of light — you can predict it. With `OBSERVER FREEZES IN ECHO` it stops — **for two uses**. |

Intended arc in one visit: easy ceiling route → it learns the ceiling → freeze law → it learns the freeze → finally the player has to genuinely vary their hiding spots and lanes, using ECHO to read it.

---

## 4. The Archive — "The Contradiction"  **[SLICE]**

```
  z=-36 +------------------------------------+
        | [shelf]      T2        [shelf]  *ALL|   VAULT: Varga's recording "from after"
  z=-30 |~~~~~~~~~~~~~~~~ = ~~~~~~~~~~~~~~~~~~|
        |~~~~~~~~~~~~~~~~ = ~~~~~~~~~~~~~~~~~~|   6 m deep gap; falling returns you to the entrance
        |=======hanging stacks (y 2.4..8)=====|   blocks the ceiling route over the gap
  z=-24 |~~~~~~~~~~~~~~~~ = ~~~~~~~~~~~~~~~~~~|
        | ##   ##       @custodian    ##   ## |
        | ##   ##                     ##   ## |
  z=-16 +----------------| |-----------------+
                          corridor to the lab
```

- The **Custodian** first speaks through the sealed door: *"There is no laboratory."*
- After the memory key opens the door, it **remembers differently** and gives `ECHOES` + `SOLIDIFY IN` and the third law slot.
- The bridge `=` is memory-geometry: visible in ECHO, solid only under an `ECHOES SOLIDIFY` law. Any target state works (`… IN ECHO`, `… IN PHYSICAL`, `… IN ALL STATES`) — the player chooses how to cross.
- Shifting mid-bridge to a state where it isn't solid drops you into the gap. (This is intentional and funny the first time.)

---

## 5. Full-campaign locations (beyond the slice)

### Chapter 5 — The Other Self: **The Dormitory of Cycles**
```
  +---------------------------------------------+
  | [bunk 1] [bunk 2] [bunk 3] ... [bunk 9]     |   nine identical bunks, nine cycles
  |   T        T        T            T          |   each bunk has a recording by a previous you
  |                                             |
  |  ECHO: each bunk shows who slept there,     |
  |  and what they did wrong                    |
  +---------------------------------------------+
```
- **New law token:** `SHADOWS` (subject) — e.g. `SHADOWS SOLIDIFY IN INVERTED`.
- Recordings contradict each other (cycle 3 says trust Varga; cycle 7 says she is the Observer). The player must find **physical evidence** to decide which recording is true — evidence that can only be carried with the right persistence law.
- Twist: one bunk is still warm. Someone is in this cycle with you.

### Chapter 6 — The Broken World: **The Spine**
A 120 m vertical shaft through the vessel. Rooms along it are in *different states at once*; the player sets each room's state on the way up or down and has to plan the order (a room left INVERTED is a ceiling-walk shortcut on the way back; a room left in ECHO keeps its memory bridges).
```
   [Reactor ring]   INVERTED: the ring becomes a racetrack around the shaft
        |
   [Hydroponics]    ECHO: the dead garden is alive; vines = memory ladders
        |
   [Cargo]          PHYSICAL: crates; the Observer's second hunting ground
        |
   [Lab level] ─── the hub, seen from below through the glass floor
```
- "**An enemy may become a doorway**": a second Observer-type entity, frozen with `OBSERVER FREEZES`, is the only solid platform across the reactor ring.
- All five systems are combined. Target 20 minutes.

### Chapter 7 — The Truth: **The Lab, from the outside**
A spacewalk around the vessel's hull with gravity laws as the only movement tool (`GRAVITY FREEZES IN PHYSICAL` = drift; `GRAVITY INVERTS` = walk on the hull). The player looks *into* the lab through the windows and sees **themselves** at minute 30 of the game — the moment the shadow moved the wrong way. They were the shadow.

### Chapter 8 — The Final Decision: **The Machine**
Back in the hub. The endings depend on facts *and on the laws installed at the moment of choice*:

| Laws installed | Extra ending option |
|---|---|
| `OBSERVER PERSISTS THROUGH ALL STATES` | **Release** — let the Observer leave the field and walk the ship as a person. |
| `ECHOES PERSISTS THROUGH ALL STATES` | **Remember** — everyone keeps every cycle's memories. |
| `GRAVITY FREEZES IN ALL STATES` | **Drift** — stop the ship; the Undertow arrives in silence. |

---

## 6. Level-design rules we follow

1. **One new idea per room, combined later.** Safe introduction → challenged → combined.
2. **Every state of every room must be worth visiting.** If ECHO shows nothing in a room, add a memory there.
3. **Readable silhouettes.** Interactables glow; nothing important is hidden in darkness *unless* darkness is the clue.
4. **Short loops back to the hub.** No room is more than one corridor from the lab.
5. **No dead ends that require reloading.** Fall into the archive gap → you are returned to its entrance; get caught → you are returned to the hall's entrance with the core back on its pedestal.
6. **Reuse and re-light, don't re-build.** Changing meaning is cheaper than building new space — essential for an Android-sized game.
