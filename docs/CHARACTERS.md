# AFTERZERO — Characters

Five characters. Each one is a different way of *knowing* things, which is the theme of the game.

| Character | Knows… | Role in the systems |
|---|---|---|
| **Subject Zero** (you) | only what they have seen | the theory-maker |
| **Dr. Ilse Varga** | what happens *after* | System 3: recordings that change |
| **The Observer** | how *you* behave | System 2: adaptive entity |
| **The Custodian** | only what has been *proven* | System 4: contradictions |
| **The Other** | everything, too late | Framing device / Chapter 1 + endings |

---

## Subject Zero — the player

- **Who they think they are:** a person who woke in a sealed room with no memory of arriving.
- **Who they are:** the newest copy in a loop the vessel runs to keep its life-support system occupied. Every copy is a little better at finding ways out; that is exactly why the loop works.
- **Voice:** dry, curious, brief. They narrate anomalies in the Theory Log in the first person (*"The shadow on the east wall moves against me."*). They never explain the plot; they guess, and they're allowed to be wrong.
- **Visual (first person):** only the device is ever seen — a small octahedral shard in the left hand, its wireframe shell coloured by the current state (white / magenta / cyan).
- **Arc:** *escape* → *rescue someone* → *stop what I caused* → *choose what to hold back*.

## Dr. Ilse Varga — the scientist who records from after

- **Role:** built the vessel and its field. Heard only through recordings. She is not missing; she is *later*.
- **Mechanic:** her recordings are condition-driven scripts. The same terminal gains sentences after the player changes the world (*"If you have already activated it, I am sorry."*).
- **Voice:** precise, tired, kind; apologises in advance. Speaks to the player as if she knows them — because she has met many of them.
- **Visual:** never seen in the slice. In the full game, ECHO shows her as a warm amber silhouette at terminals, always facing slightly away.
- **Secret (Chapter 5):** previous copies of the player disagree about whether to trust her. Both sides are partly right: she lies to every copy, but only about one thing — what "it" is.

## The Observer — the entity that learns you

- **Role:** the hunter of the Observation Hall. Too tall (2.9 m), too thin, one eye.
- **Behaviour (see `game/js/core/ObserverBrain.js`):**
  - perceives by sight (cone, line of sight blocked by pillars) and hearing (running is loud);
  - remembers pillars you hide behind, aisles you cross by, how often you run, how long you spend on the ceiling, which laws you use on it;
  - escalates fairly: *walks past → pauses → inspects*; never omniscient;
  - tells you, in one italic line, every time it learns something.
- **Visual language:** eye white (calm) → amber (suspicious) → red (hunting) → blue (frozen) → pink, pulsing with the brain (tethered). A faint vision cone makes its attention readable. Head tilts up once it has learned the ceiling.
- **Truth:** it is the body of the brain in the machine — a future Subject Zero — learning the newest copy so it can become them. After activation it stops hunting and stands in the doorway.
- **Design rule:** the player must always be able to understand and outsmart it. If a lesson makes it unbeatable, the lesson is wrong.

## The Custodian — the archive that only believes evidence

- **Role:** the archive's keeper, a teal wireframe hologram that flickers.
- **Mechanic:** its beliefs are facts (`custodian_denied`, `custodian_remembers`). It cannot be argued with through dialogue options — only through physical evidence brought into the right reality.
- **Voice:** formal, absolute, a little wounded when corrected. *"There is no laboratory. There has never been a laboratory."* → *"The laboratory. Yes. I remember it now."*
- **Contradiction beat:** once convinced, it remembers *a different version of you* — older, bleeding, carrying someone — who told it to forget the laboratory so that you would have to prove it.
- **Function:** unlocks the third law slot and the `ECHOES` / `SOLIDIFY IN` tokens; later serves as the game's most honest hint system (its lines are conditioned on what you've done).

## The Other — you, one cycle later

- **Role:** the violet silhouette that stands upside-down in the antechamber corridor and speaks the first line of the game: *"You finally learned how to move the room. Now learn why it was moving you."*
- **Mechanic:** appears only after the second touch; dissolves when approached. It is upside-down because it is standing the way the player now stands.
- **Payoff:** in the **SUSTAINED** ending, the player walks to that corridor, stands upside-down and waits to say the line to the next copy.

---

## Character production notes

- All characters in the slice are **primitive-built and emissive** (no textures, no rigs) so they read well at low resolution and cost almost nothing on mobile GPUs.
- For the Unreal Engine version: the Observer gets a proper skeletal mesh with procedural IK on long limbs and head-tracking; the Custodian and the Other use a shared hologram material with a vertex-noise flicker; Varga's ECHO silhouette uses the same material in amber.
- Voice: Varga and the player need voice actors; the Custodian can be synthesized (it is meant to sound slightly *wrong*); the Observer never speaks.
