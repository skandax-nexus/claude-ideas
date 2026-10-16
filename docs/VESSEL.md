# The vessel: generated campaign (v0.3)

After the Station Zero prologue (about 35 minutes), you leave the lab for the rest of the ship. **The vessel is generated from a seed**: eight decks, four sectors each, with every room, crew member, log and lie derived from that one number. A save stores only the seed and your progress, so the same vessel is rebuilt exactly. CYCLE 43 (after the ending) or THE VESSEL on the title screen rolls a new seed.

Estimated length is about 5 hours on the vessel plus the prologue. The estimate is computed from the generated rooms in `campaignLength()`: it counts challenges with a per-challenge solve time, and `tests/gen.test.mjs` keeps it between 4 and 6 hours. It is an estimate, not a measured playtest.

## Decks

| # | Deck | Feature introduced | New law token |
|---|---|---|---|
| 1 | Hydroponics | gravity: ceiling crossings, doors on the ceiling | — |
| 2 | Cryo Bay | echoes: memory bridges and stairs, memory keys | — |
| 3 | Observatory | zero-g: drifting over gaps, floating up to ledges | — |
| 4 | Engineering | time sweepers | `TIME` (`TIME FREEZES IN ...`) |
| 5 | Medbay | sentinels that watch the floor | — |
| 6 | Crew Quarters | hard light | `HARD LIGHT` (`... SOLIDIFY IN ...`) |
| 7 | Archive Core | everything combined | — |
| 8 | The Bridge | the verdict | — |

## How a room is built (`game/js/gen/LevelGen.js`)

A room is a run of **segments** followed by an **exit**:

- **Segments**
  - **Pit:** a gap of at least 6.2 m, too far to jump. It is crossed on the ceiling, on an echo bridge, on hard light or in zero-g, and hanging stacks block the ceiling route when the ceiling isn't the answer.
  - **Time sweepers:** rotating beams, each with its own stretch of floor.
  - **Watched hall:** pillars and a patrolling sentinel.
- **Exits**
  - An open door.
  - A door on the ceiling.
  - A 4 m ledge, reached by echo or hard-light stairs or by zero-g.
  - A memory-key lock: the key exists only in ECHO and the lock reads only PHYSICAL, so you need `HELD MATTER PERSISTS THROUGH ...`.
  - A power-core socket: the core waits on the ceiling or on a high shelf.

Each challenge knows which law effect solves it. The planner never puts more distinct effects in a room than the device has slots. Sweepers and sentinels count too, even though you can also time or sneak past them. **So every room can be solved with laws alone.**

Rooms are joined by corridors that can turn left or right. Rooms never overlap, which is tested. Each room also carries a **solution route**, which TICK's hints are written to match.

## How the story is built (`game/js/gen/StoryGen.js`)

- **Crew:** seven members, one per deck. Each has a name, role, pronouns, personality, a claimed whereabouts on the night of the Zero Event, and is either alive or only an echo.
- **The hidden truth:**
  - **Culprit:** never on the first two decks.
  - **Victim.**
  - **Motive:** to keep someone alive, to hide the arrival, to undo a mistake, or the Observer's promise.
  - **Method.**
  - **Twist:** you helped; the Observer is the victim; Juno remembers every cycle; or the stars are an echo.
- **Four beats per deck:**
  1. **Arrival:** Juno on the radio, the crew member's first log.
  2. **Log:** their alibi.
  3. **Contradiction:** a wall record that reads differently in ECHO. Innocent crew are cleared, a red herring's wiped record is cleared by its echo, and the culprit's echo puts them at the core at 03:12.
  4. **Encounter:** the crew member, alive or as a hologram echo.
- **Discoveries rewrite earlier entries:** when an echo confirms or contradicts someone, the older log entries about them are annotated.
- **The verdict:** on the bridge you name who started the loop. A wrong answer plays back that person's alibi and lets you try again. The right one unlocks the ending and the twist.

## Testing

- `npm test` checks, for 40 seeds × 32 sectors:
  - determinism;
  - the slot budget, and that every law needed is owned by then;
  - three hint tiers per challenge;
  - no overlapping rooms, pit lengths;
  - a consistent mystery: exactly one guilty echo, no witness giving the culprit an alibi, no unfilled text;
  - the length estimate.
- `npm run vessel` is a **QA bot** that loads each sector in headless Chromium. It installs the laws each room needs and walks the solution route with the game's real physics: shifting states, taking keys and cores, using locks and sockets. It fails on any stuck point, setback or page error. At release it solved **540/540 rooms (6 seeds)**.
