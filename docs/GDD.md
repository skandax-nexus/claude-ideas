# AFTERZERO — Game Design Document

> **Pre-v1.0 design notes.** This describes the first vertical slice. The canon is [STORY.md](STORY.md): the brain in the machine is the first Ren, Dr. Ilse Varga's son (not a future copy of you), and the Observer is his mind looking out; the field holds the fold (there is no "Undertow"); Varga is met in HALCYON and THE CRADLE; Juno and TICK are part of the cast. Where this file disagrees, STORY.md is right.

> A sci-fi thriller in which the player does not just solve puzzles inside a world, but **discovers, tests and rewrites the laws that govern it.**

Status: playable vertical slice (Chapters 1–4 plus a compressed 6–8) in `game/`. This document covers the full two-hour game; anything marked **[SLICE]** is implemented and playable now.

---

## 1. Design pillars

1. **The game hides its own rules.** No tutorial, map or quest marker. Every mechanic is first met as an *anomaly*. The HUD shows only what the character could know.
2. **Every discovery changes what you can do as well as what you know.** Each revelation adds a capability (a law token, a state, a route), and each new capability leads to a new revelation.
3. **The world remembers.** Persistent facts rewrite rooms, recordings and characters. Going back to a place is a new experience.
4. **Fair, legible intelligence.** The Observer learns from what it plausibly saw, and tells you (subtly) what it learned, so you can out-think it.
5. **Honest misdirection.** The visible objective is always the best explanation of the evidence so far. It changes only when the evidence changes. There are no fake missions.

> This is a design hypothesis to test with players, not a claim that no game has used similar ideas. See §9 for the test plan.

---

## 2. The core mechanic: a programmable reality

### 2.1 Three states per room **[SLICE]**

Each room is always in one of three states. The device the player carries changes the state of **the room they are standing in**. Rooms keep their state when you leave, so you can set up one room and then use another.

| State | Default behaviour | What the player discovers |
|---|---|---|
| **PHYSICAL** | Normal gravity, solid matter | The initial route |
| **INVERTED** | Gravity reverses (because of a *law*, not because of the state itself) | Ceilings become floors; out-of-reach places become reachable |
| **ECHO** | Memory-geometry becomes visible: footprints, writing, removed furniture, past paths | Clues, secrets, objects that "used to be" |

A shift can change more than appearance. A wall exists only in some states (the antechamber exit). A shadow becomes a body (the lab). A bridge exists only as a memory (the archive). An enemy can become a doorway (Chapter 6).

### 2.2 The device runs on laws **[SLICE]**

The central innovation of AFTERZERO's design: **what each state does is not fixed. It is defined by laws the player can rewrite.**

A law is a three-token sentence: `SUBJECT · VERB · STATE`.

```
GRAVITY      INVERTS IN        INVERTED      <- the factory default
HELD MATTER  PERSISTS THROUGH  PHYSICAL      <- lets you carry memories into reality
OBSERVER     FREEZES IN        ECHO          <- stops the hunter... until it learns
ECHOES       SOLIDIFY IN       ECHO          <- walk on a bridge that only exists as memory
GRAVITY      FREEZES IN        ECHO          <- zero-g wherever you remember
```

- Tokens are found in the world (on ceilings, behind shadows, in the hunter's hall, from characters).
- The device has limited slots: 2 at first, 3 after the Archive.
- Invalid sentences are rejected with a *syntax fault* (`"HELD MATTER INVERTS IN" MEANS NOTHING`), which also teaches the grammar.
- Contradictory laws are resolved by an explicit **paradox rule** (zero-g overrides inversion), and the device reports the paradox.
- Removing the default gravity law is allowed. INVERTED then does nothing — this is a legitimate (and funny) discovery.

This turns every puzzle into a question with several answers: *which law, in which room, in which order?* It is also the backbone of the endings.

Full spec: [`REALITY_ENGINE.md`](REALITY_ENGINE.md).

### 2.3 Example: how the player discovers the first law without a tutorial **[SLICE]**

1. A floating object in a sealed room. The player touches it. **Gravity lets go**: debris drifts, a jump floats.
2. They touch it again. **The room turns over.** They fall to the ceiling, where upside-down writing now reads *YOU HAVE BEEN HERE BEFORE*.
3. **A door exists where a wall used to be.** It exists only while the room is inverted.
4. A violet figure, standing upside down like the player, says: *"You finally learned how to move the room. Now learn why it was moving you."*
5. The object is now in the player's hand. The only text the game ever shows here is the button.

---

## 3. Five systems that work together

### System 1 — Reality is programmable **[SLICE]**
Per-room state machine, data-authored. Each element of a room declares *when* it exists, using a small condition language (`!@INVERTED`, `machine_activated && @ECHO`). Laws decide gravity, persistence, solidity of memories and the Observer's freedom. No universe simulation is needed: transformations are authored per room. This is what keeps the mechanic achievable for a small team.

### System 2 — The Observer learns your habits **[SLICE]**
A tall, one-eyed entity patrols the Observation Hall. It records only what it could plausibly have witnessed:

| Habit recorded | Threshold | What it does next | The line the player sees |
|---|---|---|---|
| Hiding behind the same pillar | 2nd time | Pauses beside it | *It pauses by the pillar.* |
| | 3rd time | Walks to the far side of it | *It looks directly at your pillar.* |
| Crossing the hall by the same aisle | 2 crossings | Waits in that aisle | *It waits where you usually cross.* |
| Walking on the ceiling (INVERTED) | 10 s exposure, or caught while inverted | Scans the ceiling | *It tilts its head upward.* |
| Freezing it with an `OBSERVER FREEZES` law | 3rd use | Ignores the law | *It moved. It should not be able to move.* |
| Running near it | 8 s | Hearing radius doubles | *It is listening for your footsteps now.* |
| Being caught | 2 catches | Searches longer | *It lingers longer than before.* |

The point is not an unbeatable enemy. It is making the player **wonder whether it has learned something** — and then confirming it, so they can change strategy. The journal keeps a list: *THE OBSERVER HAS LEARNED*. ECHO reveals its past route as a trail of light, so planning is always possible.

Twist: the Observer was learning to *be* the player (§5).

### System 3 — Discoveries change earlier events **[SLICE]**
Recordings, signage and characters are lists of lines with conditions. Example — Varga's first recording:

- First listen: *"Whatever you do, do not activate the machine."*
- After activation, the same recording: *"…If you have already activated it, I am sorry."*
- After the vault: *"That last sentence was not there the first time you listened. I added it later. Much later."*

The lab's plaque changes from `LAB 0 – FIELD CONTAINMENT` to `VESSEL AFTERZERO – LIFE SUPPORT: 1 OCCUPANT`.

### System 4 — The player can create contradictions **[SLICE]**
Major facts are explicit variables (`archive_open`, `custodian_remembers`, …) linked by authored rules.

- The Custodian says: *"There is no laboratory. There has never been a laboratory."*
- The key to prove it exists **only as a memory** (ECHO). Carried out of ECHO, it dissolves.
- The player rewrites the device: `HELD MATTER PERSISTS THROUGH PHYSICAL`, carries the memory into reality and puts it in the door.
- The door opens. The Custodian now remembers the laboratory — and remembers *a different version of the player* entering it, older, carrying someone.

The player's actions change what the world considers true. Everything is authored rules (no procedural story generation), which keeps it debuggable and lets us time the revelations.

### System 5 — The game hides the real objective **[SLICE]**
The HUD shows **CURRENT UNDERSTANDING**, not a quest. It is rewritten (with a visible glitch) only when evidence changes:

| Layer | Objective | Because |
|---|---|---|
| 1 | Escape the structure. | I woke in a sealed room. |
| 2 | Find Dr. Ilse Varga. | Someone left a warning. |
| 3 | Stop the event you already caused. | Varga is recording from *after* something I do. |
| 4 | Decide what the catastrophe is holding back. | Stopping the machine may be worse. |

Old objectives stay in the log, struck through, with the reason they stopped being true.

---

## 4. The gameplay loop

**Explore → Notice an anomaly → Form a theory → Experiment → Change reality → Discover a consequence → Question your theory.**

The game supports each step:

| Step | Support in the game |
|---|---|
| Notice | Anomalies are visual and audible (a shadow moving the wrong way, writing on the ceiling, a sentence that wasn't there before). |
| Theory | The **Theory Log** records anomalies in the character's words; **Open Questions** stay open until evidence closes them. |
| Experiment | Shifts are instant and reversible; laws can be swapped freely. Failure is cheap. |
| Change reality | Room states persist; laws are global; facts are permanent. |
| Consequence | Rewritten recordings, characters who remember differently, rooms that change meaning. |
| Question | The objective is rewritten; old theories are visibly crossed out. |

### Worked example — the reversed shadow (≈7 minutes) **[SLICE]**

| Minute | Beat |
|---|---|
| 1 Explore | The player enters the abandoned laboratory. |
| 2 Notice | A shadow on the east wall moves **opposite** to them. |
| 3 Experiment | Move left; the shadow moves right. In ECHO the wall reads *STAND WHERE IT ISN'T*. |
| 4 Discover | Shifting to ECHO turns the shadow into a **physical body**, frozen where it was. |
| 5 Consequence | Stand so the shadow is on the faint door outline, then shift: it steps into the wall and **opens a passage**. |
| 6 Twist | Inside: a recording of **the player's own voice** explaining how to create the shadow — dated eighteen years before their birth. |
| 7 New question | *"If I made the shadow — who was I controlling?"* |

---

## 5. Story

### Premise
You wake in a sealed room on Station Zero. A floating object, no instructions. A scientist's warning. An archive that denies a laboratory exists. An entity in the hall that seems to be learning you.

### The truth (revealed in layers)
- Station Zero is not a station. It is the **vessel AFTERZERO**, moving.
- The machine at the centre of the "lab" is **life support for one occupant: a human brain**, which sustains a field that holds something shut (the *Undertow* — a collapse of causality).
- The **Observer** is that brain's body: a projection that learns the newest copy of the player, because the brain *is* a future copy of the player, and the loop needs the next one to take its place.
- **Dr. Ilse Varga** built the vessel. She is not missing; she records from *after*. Every cycle, she warns the new Subject Zero not to activate the machine — knowing that the only way out runs through it.
- **The Other** who speaks in the first room is the player, a cycle later.

### The lab, revisited five times (Section 7 of the brief) **[SLICE]**
The same location changes meaning without becoming a new level:

| Visit | Trigger | What the room is now |
|---|---|---|
| 1 | Start | An abandoned laboratory. |
| 2 | Machine activated | Walls are glass; stars move past: **a spaceship**. |
| 3 | ECHO after activation | A **human brain** inside the machine's ring. |
| 4 | Brain examined | Cables surface and run to the **Observer**, now standing in the doorway, its eye pulsing with the brain. |
| 5 | Final decision / Custodian | It was built **to keep that entity alive**. |

### Endings **[SLICE]**
| Ending | Requirement | Outcome |
|---|---|---|
| **SEVERED** | Always available | Pull the core. The ship stops. Something worse wakes up. |
| **SUSTAINED** | Always available | Leave it running; take Varga's place; the next Subject Zero wakes; you go to stand in the corridor, upside down. |
| **OBSERVED** | Faced the Observer + heard Recording 0 + Custodian remembers | Let it see you. The loop closes on your terms. |

The full game adds endings driven by laws installed at the moment of decision (e.g. `OBSERVER PERSISTS THROUGH ALL STATES`).

---

## 6. Structure of the two-hour game

Each chapter changes the meaning of the ones before. Every mechanic is introduced **safe → challenged → combined**.

| # | Chapter | Target | Main mechanic | Intended reaction | Slice |
|---|---|---|---|---|---|
| 1 | The Unknown | 10 min | Explore without instructions; the object; the inverted door | Curiosity | ✅ |
| 2 | The First Law | 15 min | Shifting states; ECHO clues; the shadow; first law tokens; rewriting the device | Discovery | ✅ |
| 3 | The Observer | 15 min | Outsmart an adaptive entity using states and laws | Suspense | ✅ |
| 4 | The Contradiction | 15 min | Carry memory into reality; change what characters remember | Confusion → insight | ✅ |
| 5 | The Other Self | 15 min | Investigate contradictory evidence about your own past cycles | Suspicion | — (see MAPS §5) |
| 6 | The Broken World | 20 min | Combine every mechanic; rooms with all three states in play at once | Mastery | partial (archive bridge) |
| 7 | The Truth | 15 min | Reinterpret earlier events; the lab's five layers | Surprise | ✅ (compressed) |
| 8 | The Final Decision | 15 min | Use discoveries and laws to determine the ending | Consequence | ✅ (3 endings) |
| | **Total** | **120 min** | | | slice ≈ 25–40 min |

These are development targets; real playtime is established by testing (§9).

---

## 7. What is in the playable slice

- 4 connected locations (Antechamber, Laboratory + hidden passage, Observation Hall, Archive + vault).
- All 5 systems working together, 6 law grammars, 13 law tokens, 3 laws slots.
- 5 characters (see [`CHARACTERS.md`](CHARACTERS.md)).
- 4 objective layers, 7 open questions, 17 theory-log anomalies, 3 endings.
- Desktop (keyboard/mouse) and Android (touch: stick, look-drag, buttons; fullscreen, upright or sideways; installable PWA).
- Autosave (facts, laws, room states, Observer memory).
- Built-in **playtest report**: time, discoveries, catches, lessons taught to the Observer, the objective history, a discovery timeline, and the three post-demo questions.

---

## 8. What makes it interesting without manipulating players

No timers that punish leaving, no streaks, no loot boxes, no artificial cliffhangers between sessions. Engagement must come from curiosity:
- every chapter ends on an **unanswered question the player can phrase**;
- every answer creates a **new capability**;
- failure is cheap and informative (being caught teaches the Observer *and* tells you what it learned).

---

## 9. Playtest plan

Measures (all captured by the built-in report):

| Measure | Source in the report | What it tells us |
|---|---|---|
| Completion rate | `ending` present | Can players understand and finish? |
| Puzzle-solving rate | `timeline` (seconds to each discovery) | Are mechanics understandable without hints? Where do people stall? |
| Session continuation | `another20` answer | Do players *want* to continue? |
| Replay rate | Ending distribution; returning saves | Do clues and endings motivate replays? |
| Player explanations | `happened`, `next` free text | Can players explain what they discovered and why it matters? |

Protocol: give the slice to people who have never seen it. Don't explain anything. After the ending, the game asks the three questions:
1. What do you think happened?
2. What do you want to investigate next?
3. Would you voluntarily play another 20 minutes?

**Red flags to watch:** a discovery that most players reach only by accident (the shadow placement); the law editor being opened but never used (players need a stronger reason to experiment); players never discovering ECHO without prompting.
