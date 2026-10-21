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
  - **Motive:** to keep someone alive, to hide the arrival, to undo a mistake, or the dreamers' promise.
  - **Method.**
  - **Twist:** you helped; the watcher that followed you is the victim; Juno remembers every cycle; or the stars in the windows were never outside.
- **Four beats per deck:**
  1. **Arrival:** Juno on the radio, the crew member's first log.
  2. **Log:** their alibi.
  3. **Contradiction:** a wall record that reads differently in ECHO. Innocent crew are cleared, a red herring's wiped record is cleared by its echo, and the culprit's echo puts them at the core at 03:12.
  4. **Encounter:** the crew member, alive or as a hologram echo.
- **Discoveries rewrite earlier entries:** when an echo confirms or contradicts someone, the older log entries about them are annotated.
- **The verdict:** on the bridge you name whose hands were on the first law. A wrong answer plays back that person's alibi and lets you try again. The right one unlocks the ending and the twist.

## The night watch and the two signatures (v1.0)

The Vessel is the forward night of the ark. Every cycle the fold wakes eight sleepers from THE CRADLE into the night watch (seven crew and a captain) and gives them the roles and eleven years of memories, which is why every story number has a new crew. The core's first law takes a **key** and a pair of **hands**. The key was written at 03:04 on 14 March 2071 by the first Ren, on a badge that read VARGA, so that the fold has to be chosen again every cycle. The hands at the core at 03:12 are new every cycle: they are the culprit's. The Bridge reconstruction says so on every run, the chair asks *"Whose hands were on the first law at 03:12?"*, and the YOU HELPED twist names both signatures.

v1.0 also makes every story number agree with itself: the victim is met as an echo when the twist is THE WATCHER'S NAME and alive when the motive is to keep them alive (with both, the motive says the fold keeps what was uploaded of them; no rng draw, so every seed keeps its truth), and innocent echoes say ON THE RADIO WITH a witness, so nobody is in two places at once.

## The vessel after each prologue ending (`VESSEL_AFTER`, v1.0)

`makeStory(seed, wish, { ending })` takes the prologue ending (`'SEVER' | 'SUSTAIN' | 'MIRROR' | null`) and exposes its switches as `story.after`. They are applied after every rng draw: a story number deals the same crew, culprit, victim, motive, method, twist and red herring whatever the ending, and its sectors keep their layout (the window band is the only new geometry).

| field | none | SEVERED | SUSTAINED | OBSERVED |
|---|---|---|---|---|
| `sentinels` (DeckWorld `Sentinel` mode) | `hunt` | `still`: dark eye, no cone, never moves or sees | `learned`: the hall's lessons (`ceiling`: INVERTED no longer hides you; `runner`: running within 7 m is heard; `patient`: chases 4 s instead of 2.2 s) | `kin`: violet eye, patrols, stops to watch you, never chases |
| sentinel hints | `HINTS.sentinel` | `HINTS['sentinel:still']` | `HINTS['sentinel:learned']` | `HINTS['sentinel:kin']` |
| `windows` (a band high on the west wall of every story room) | stars | `dark`: black glass | stars | stars |
| `dark` (emergency light) | 0 | 0.45 | 0 | 0 |
| aboard | Juno on the radio | Juno walks into the verdict room when the chair unlocks | the Other, upside down in every deck's first story room and above the chair | Juno on the radio |
| Deck 1 card | DECK 1 OF 8 | · AFTER SEVERED | · AFTER SUSTAINED | · AFTER OBSERVED |
| replay button | CYCLE 43 | TELL IT AGAIN | FOLD AGAIN | CYCLE 43 ("The ship will listen") |

Deck 1 opens with the ending's own lines (its `{trail}` line is the existing recorded crew line), and after the right name the Bridge plays the ending's last scene before the ending card; its narration closes the card. After SEVERED a wrong name no longer "folds back", and THE WATCHER'S NAME and THE WINDOWS are told in the past tense. OBSERVER FREEZES IN works in every mode and watched halls stay optional, so no room loses its answer.

Where the ending comes from (`main.startVessel`): a save's own `campaign.ending` (v0.9 saves have none and play as before), else the Cradle's gate or the replay button, else `facts.ending` (set at the machine, or adopted from `afterzero.lastEnding` when a chapter starts from the menu). If the ending is SUSTAINED but the Observer learned nothing, the watchers simply hunt.

## Testing

- `npm test` checks, for 40 seeds × 32 sectors:
  - determinism;
  - the slot budget, and that every law needed is owned by then;
  - three hint tiers per challenge;
  - no overlapping rooms, pit lengths;
  - a consistent mystery: exactly one guilty echo, no witness giving the culprit an alibi, no unfilled text;
  - the length estimate;
  - (v1.0) for 200 seeds × 4 endings: the same truth and cast, no unfilled text in the ending's opening, coda or twist, the victim's state, radio alibis, the two-signature reconstruction; for 8 seeds × 4 endings × 32 sectors: identical layouts and sentinels, one window band per story room, Juno and the Other only where they belong, and the right watcher hints.
- `npm run vessel` is a **QA bot** that loads each sector in headless Chromium. It installs the laws each room needs and walks the solution route with the game's real physics: shifting states, taking keys and cores, using locks and sockets. It fails on any stuck point, setback or page error. At release it solved **540/540 rooms (6 seeds)**. Since v1.0 it also replays the watched decks (Medbay to the Bridge) after each ending, with the hardest SUSTAINED lessons.
- `tests/cradle.mjs` walks from THE CRADLE into Deck 1 after each ending and plays the Bridge's last scene for each.
