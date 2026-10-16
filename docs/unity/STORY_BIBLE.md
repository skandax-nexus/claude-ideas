# AFTERZERO — Story Bible (Unity version)

> **Every time the ship forgets you, you wake up again. This is cycle 42.**

This is the rebuilt story for the Unity version. Everything here is implemented as data in
`unity/AfterZero/Assets/AfterZero/Scripts/Core/Content/StoryContent.cs` (scripts, NPC dialogue, rules, objectives, hints, endings) and `WorldContent.cs` (where things happen).

---

## 1. The one-sentence story

A mother who couldn't let her child die built a ship that holds on for her, and the child — printed again and again from memory — has to decide what holding on is worth.

## 2. Why this story is stronger than the prototype's

| Prototype | Unity version |
|---|---|
| Abstract mystery ("who is the Observer?") | **A personal mystery with a name:** *who am I, and who made me?* |
| One voice on recordings | **Seven characters** who want different things and react to what you do |
| The scientist is an idea | The scientist is **your mother**, alive at the top of the ship |
| Threat is one entity | Three threats with **different rules**: the Observer (learns), the Wardens (hunt), the Undertow (erases) |
| Twists explain the world | Twists **change your relationships**: Juno, Bael, TICK, the Observer and Ashe all mean something different by the end |
| Three endings | **Four endings**, one of them secret and earned through the law system and exploration |

Theme: **holding on vs. letting go.** Every character is a different answer to it.

## 3. Backstory (what really happened)

- **2071.** Dr. Ilse Varga discovers the **Undertow**: a front of causal collapse that *un-happens* things. Planets, colours, memories, the fact that something ever existed.
- She builds **Vessel AFTERZERO**, an ark inside a *reality field* that lets rooms hold alternate states (PHYSICAL / INVERTED / ECHO). The field needs a living mind as its anchor.
- On launch day her child, **Ren (17)**, is killed in the reactor tremor. Ilse preserves Ren's brain. The field works — anchored to Ren.
- A mind without a body **drifts**. When it drifts, the Undertow gains. So the ship **prints a body from Ren's memories** — *Subject Zero* — and lets it live through the ship until it reaches the machine. A body that remembers being Ren and *chooses to go on* re-anchors the mind.
- Each subject who activates the machine is absorbed into it. The **Observer** is that accumulated mind's projection, learning the newest copy so that, one day, it can stop drifting and come home.
- Some subjects refused. They live in the **Dormitory of Cycles** and grow old.
- **Commander Idris Bael**, security chief, lost his wife when the Undertow ate deck 9. He believes activation feeds the Undertow and has hunted every subject for 41 cycles. He is wrong — and Varga let him be wrong.
- Varga lives in **the Core** at the top of the ship, where time runs thin. Forty-one cycles have aged her three years. Her recordings come "from after".

## 4. The cast

| Character | Wants | Fears | Arc | Systems they drive |
|---|---|---|---|---|
| **Ren / Subject Zero** (you) | To get out | Being a copy | Escape → rescue → stop it → choose | Every system |
| **Juno Hale** — engineer, 30s, lives on the ceiling | To save the ship | That she made the Observer a monster | Ally → confession → forgiven or blamed | Hub NPC, hints, dialogue choices (`trust_*`, `forgave_juno`) |
| **TICK** — maintenance drone Ren built at nine | You | Nothing; he's a drone | Comic helper → *"...REN?"* | 3-tier hint system |
| **The Custodian** — archive AI | Proof | Being wrong | Denies the lab → remembers a different you | Contradiction system; unlocks law slot 3 |
| **Mother Ashe** — cycle 9, now old | Peace for the copies | The Observer's face | Gatekeeper → gives you her piece of the law | Unlocks slot 4 + `UNDERTOW` token |
| **Pell** — cycle 17 | Proof he existed | Being erased | Side quest: find "17 WAS HERE" in ECHO | Gives `SHADOWS` token |
| **Wren** — cycle 30 | To stop being afraid | The Observer | Side quest: tell her what it learned (needs 2+ lessons) | Gives `TIME` token |
| **Cmdr. Idris Bael** | To end the cycles | Losing another deck | Hunter → convinced by evidence, or consumed | Wardens chase; evidence choice |
| **Dr. Ilse Varga** — your mother | You, alive | Choosing for you again | Warning voice → alive at the Core | Recordings that change (System 3) |
| **The Observer** | To come home | — | Hunter → mirror | Adaptive AI (System 2) |
| **The Other** — you, one cycle later | — | — | The first voice you hear; your future if you SUSTAIN | Framing |

## 5. Structure: three acts, eight chapters

| Act | Chapter | Location | Main mechanic | Emotional beat | Ends on |
|---|---|---|---|---|---|
| **I — WAKE** | 1 The Unknown | Cradle | Touch the object; the inverted door | Curiosity | *"Now learn why it was moving you."* |
| | 2 The First Law | Lab | Shifting, ECHO, the shadow, rewriting laws | Discovery; Juno drops from the ceiling | Recording 0 — your voice, "Mum" |
| | 3 The Observer | Observation Hall | Stealth vs. an entity that learns | Suspense | You bring the core back |
| | 4 The Contradiction | Archive | Carry memory into reality; solid echoes | Confusion → insight | Varga is recording "from after" |
| | — Lockdown | Lab → Dormitory | **Chase:** Wardens; escape along the ceiling | **Adrenaline** | The bulkhead slams; *"You're among family."* |
| **II — CYCLES** | 5 The Other Selves | Dormitory | Dialogue, side quests, new laws | Belonging; grief | Juno's confession; you're the 42nd |
| | 6 The Spine | Hydroponic Spine | **Vertical chase:** fall up, fall down, outrun the rising Undertow | **Adrenaline**; TICK says *"REN?"* | Varga's launch log: Bael is wrong |
| **III — ZERO** | 7 The Crown | Reactor Crown | **Chase:** the corridor un-happens behind you; floor/ceiling/memory sections | **Adrenaline**; confrontation | Bael stands down — or doesn't |
| | 8 The Decision | The Core | The choice | Love; consequence | One of four endings |

Target length: 3–4 hours first playthrough; 25 minutes for Act I.

## 6. Twist ladder (each one changes what you can do)

1. **The Other** speaks from upside down → you learn rooms can be turned.
2. **Juno drops from the ceiling** → people can *live* on ceilings; you get TICK (hints).
3. **Recording 0** is your voice, dated before your body was printed, and you say "Mum" → you made the shadow; you get `HELD MATTER`.
4. **The Custodian remembers a different you** carrying Juno → law slot 3, `ECHOES SOLIDIFY`.
5. **Varga records "from after"** → the objective becomes *stop the event you already caused.*
6. **The lab is a ship** (activation) → Bael's lockdown; first chase.
7. **You're cycle 42** → the dormitory; Ashe's law; side quests.
8. **TICK recognises you: "REN?"** → you have a name. Ashe gives you her law.
9. **Varga's launch log** → evidence that turns Bael.
10. **The brain is yours; the Observer is yours; Varga is your mother** → the choice.

## 7. Hidden objective (System 5)

| Layer | Objective | Because |
|---|---|---|
| 1 | Get out of here. | I woke in a sealed room. |
| 2 | Help Juno restart the ship. | She's alive, scared, and knows this place. |
| 3 | Find Dr. Ilse Varga. | Someone left a warning. |
| 4 | Escape Commander Bael. | I did the one thing she told me not to. |
| 5 | Learn what the cycles are. | Forty-one people with my face live behind this door. |
| 6 | Reach the Reactor Crown. | Varga is at the top of the ship. |
| 7 | Get past Bael to the Core. | The Undertow is eating the corridor behind me. |
| 8 | Decide what Ren is for. | Mind, body, field, mother. Something has to give. |

## 8. Choices that matter

| Choice | Where | Remembered as | Pays off |
|---|---|---|---|
| Trust Varga / Juno / evidence | Juno, Act I | `trust_varga`, `trust_juno`, `trust_evidence` | Juno's and Varga's later lines; journal |
| Forgive or blame Juno | Dormitory | `forgave_juno` / `blamed_juno` | Her farewell; Act III support |
| Calm or scare Wren | Dormitory | `wren_scared` | Her lines; both still give `TIME` |
| Show Bael the launch log / argue / run | Crown | `bael_convinced` / `bael_fight` / `bael_dead` | Wardens fight or not; Bael lives or not |
| What law you have installed at the Core | Core | `law_undertow_all` | Unlocks the secret ending |

## 9. Endings

| Ending | Requirement | Outcome |
|---|---|---|
| **SEVERED** | always | Ren rests; the field goes dark; the Undertow finds nothing left to un-happen; the copies are free. |
| **SUSTAINED** | always | You take your mother's place; the next subject wakes; you go stand upside down in the corridor. |
| **OBSERVED** | faced the Observer + heard Recording 0 + Custodian remembers | Body and mind reunite; the field stops drifting; your mother gets to say your name out loud. |
| **AFTER ZERO** (secret) | `UNDERTOW FREEZES IN ALL STATES` installed + 10/12 memories | You rewrite the field's law itself; the cycles stop; the ship turns for home. Nine years. You've never had nine years before. |

Locked endings show as `? ? ?` with a hint ("Some laws have never been written. Some memories are still out there."), which motivates a second playthrough.

## 10. Memory fragments (collectibles)

Twelve glowing fragments of Ren's life, placed in every state (floor, ceiling, echo) across all eight zones: *First Steps, Toaster, Halo, Shadow Puppets, Hide and Seek, Library Card, Nine, Rain, Launch Eve, The Sky Forgot, Last Words, Seventeen.* Read in order, they tell the story of a kid and their mother on a ship — and set up every twist before it lands.

## 11. Tone rules for writers

- Short lines. Characters interrupt themselves. Nobody explains the plot.
- Every twist must be **fair**: set up by at least one earlier line, decal or memory.
- Every NPC line is conditioned on facts. Nobody repeats a line once you've done the thing it's about.
- The Observer never speaks. It is described.
- Humour belongs to TICK and Juno, and stops at the Core.
