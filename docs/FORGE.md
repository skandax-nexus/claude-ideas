# WORLD FORGE: build your own game

The sixth chapter card reads **WORLD FORGE - Build your own game**. The panel says: *"The Forge builds it on this device from your choices: it is not a chat AI, it recombines the game's own story parts around what you choose, and plans every puzzle so it can be solved under each location's rules."* You fill in the panel, press **FORGE**, pick one of the ten save slots, and play a complete new game that the existing engine renders: open acts are districts under a glass dome (the HALCYON and Cradle generator), deck acts are chains of rooms (the Vessel generator).

The Forge is offline and deterministic: **the same Forge number and the same choices always build the same game.** Everything in the panel is optional except the Forge number, and that can be random.

Code: `game/js/gen/Forge.js` (pure, seeded with `gen/rng.js`). Tests: `tests/forge.test.mjs` (unit) and `tests/forge.mjs` (browser).

## What the player can choose

| Field | Choices | What it does |
| --- | --- | --- |
| **Genre** | THRILLER, HORROR, MYSTERY, ADVENTURE, HEIST, SURVIVAL | The cast's moods, the plot grammar, the line banks, the weather and film grade, how dark it is, how many watchers, how often TICK jokes, the floor of the threat music, and the style of the ending. |
| **Title** | up to 40 characters | On the act cards, the save slots, the journal and the ending. |
| **Hero's name** | up to 16 characters | The journal and the ending. The station still calls you Ren. |
| **Forge number** | any number, or RANDOM | The seed. |
| **Length** | SHORT (3 acts), FULL (5), EPIC (8) | SHORT acts have two parts (districts or sectors), FULL and EPIC acts have three. |
| **The world** | one location per act: Neon city, Drowned reactor, Glass forest, Signal tower, Sleeping cradle (open districts) or Garden deck, Cryo bay, Observatory, Engineering, Medbay, Crew quarters, Archive core, The bridge (decks); a name for each | The Forge picks unused locations for anything left blank and writes a one-line description for the act card. |
| **Local rules** | per act: gravity NORMAL / INVERTED / ZERO; echoes HIDDEN / VISIBLE / SOLID; time NORMAL / SWEEPERS; watchers NONE / PATROL / HUNT; light DAY / NIGHT / EMERGENCY; NULL FIELD | See *Rules* below. The genre weights the ones the Forge picks (a HORROR act is usually dark and hunted, an ADVENTURE act usually bright and empty). The Forge puts at most one null field in a game on its own, never in the first or last act. |
| **The cast** | up to 8 names and roles: Guide, Rival, Witness, Keeper, Engineer, Medic, Child of the city, Watcher in disguise | Typed names are spoken by the device's own voice. Each person gets a realistic model by role and pronoun, a mood from the genre, a secret and lines. The genre picks the antagonist among the roles it likes (never the first person you meet). |
| **The kit** | four of: STASIS PULSE, GRAPPLE LINE, ECHO LENS, LIGHT RIG, SIGNAL FLARE, KEY FORGE | Reality tools, not weapons: AFTERZERO has no combat. See *Gear*. |

A Forge game starts with every law token (GRAVITY, ECHOES, HELD MATTER, OBSERVER, TIME, HARD LIGHT and the verbs and states), so the puzzle of a location is its rules, not a missing word.

## How the Forge builds a game

`forgeGame(seed, choices)` returns `{ title, genre, hero, length, acts, cast, truth, gear, endings }`; `makeForgeStory(game)` turns it into a story the runtime already plays (zones for open acts, decks for deck acts); `tuneLevel(level, act)` applies the act's rules to a generated level; `rulesOverride(rules)` is what the reality engine installs on every room; `checkSolvable(level, act, kit)` is the solvability check the tests run.

1. **The cast.** Typed names and roles first, Forge names (from the Vessel's name pools) for the rest; at least three people, one more for every three acts. Each gets a pronoun, a mood trait from the genre (reusing the Vessel's `MOOD_TRAITS`), the secret of their role, a colour and whether they are alive (the antagonist always is).
2. **The shape.** Three acts: a setup, a twist, a finale. Five: setup, two complications, twist, finale. Eight: setup, five complications, twist, finale.
3. **Each act.** A location (chosen or picked unused; the Cradle is never auto-picked for the finale), a name, a blurb, its rules (chosen or drawn from the genre's weights), the gear the rules allow, its scenes (from the genre's grammar for that part of the story), the person you meet there (the guide first, then the rest of the cast in turn, the antagonist at the twist and the finale), and, for deck acts, a plan for every puzzle room made within the rules.
4. **The scenes.** Each part of an act has one scene, as in HALCYON and the Vessel: `arrival` (a record on a landmark; on a roof in a district), `log` (a second record), `contradiction` (a record that reads differently in ECHO; at the twist it is about the antagonist and the toast says THE RECORD LIED, elsewhere RECORD CORRECTED), `encounter` (a cast member, 3-6 lines: a greeting from their mood, their role's line, the genre's witness or antagonist line, a line that depends on what you chose before, a closer), `choice` (an encounter that ends with a two-option choice) and `verdict` (the finale's chair).
5. **Choices.** Each option carries a tag, `trust` or `doubt`. Choosing sets `forge_choice_<act>` and counts `forge_trust` or `forge_doubt`. Later encounters say a different line depending on which is ahead, and the ending's coda is Juno's trust line or her doubt line.
6. **The finale.** The last scene is a chair. Sitting in it asks the genre's last question with two or three options; each is an ending whose text names the antagonist and the place. The game remembers the ending and offers BACK TO THE FORGE.

### The genres' grammars

Scenes per part of the story (an act takes the first two or three of its list; the finale the last ones):

| Genre | Setup | Complication | Twist | Finale | Antagonist | Last question |
| --- | --- | --- | --- | --- | --- | --- |
| THRILLER | arrival, encounter, log | log, contradiction, choice | contradiction, choice, log | log, encounter, verdict | the one who lied: a rival, keeper or witness | Who rewrote the schedule, and what happens to them? Expose them / make a deal / walk away |
| HORROR | arrival, log, encounter | log, choice, contradiction | log, contradiction, choice | log, encounter, verdict | the one who stayed: a watcher in disguise, a child of the city or a keeper | What do you do with the thing that stayed? Face it / stay with it / seal it in |
| MYSTERY | arrival, encounter, contradiction | contradiction, log, choice | contradiction, choice, log | log, encounter, verdict | the culprit: a keeper, engineer, medic or rival | Whose record was the lie? Name them / name them and burn both records / file the echo beside the record |
| ADVENTURE | arrival, encounter, log | log, choice, encounter | log, contradiction, choice | log, encounter, verdict | the rival: a rival, guide or engineer | The last gate opens for one. Go first / open it for both / let them go |
| HEIST | arrival, encounter, log | choice, log, contradiction | contradiction, choice, log | log, encounter, verdict | the one who lied: an engineer, rival or keeper | What is in the vault, and who leaves with it? Take it / split it / leave it |
| SURVIVAL | arrival, log, encounter | log, choice, contradiction | log, choice, contradiction | log, encounter, verdict | the one who stayed: a keeper, medic or engineer | Where does the last pump's air go? Everyone / you / fix the pump whatever it costs |

What else the genre sets: the cast's moods (THRILLER dry, nervous, formal; HORROR nervous, dreamy; MYSTERY formal, dry, dreamy; ADVENTURE warm, dreamy; HEIST dry, formal, warm; SURVIVAL nervous, warm, dry), the weather (rain, storm, motes, fireflies, frost, steam, pollen), the film grade (HORROR desaturated and contrasty, ADVENTURE saturated), the floor of the threat music (HORROR 0.3, THRILLER and SURVIVAL 0.2, HEIST 0.15, ADVENTURE 0.1, MYSTERY 0.05) and the rules it leans to (HEIST likes sweepers, SURVIVAL emergency light, HORROR hunters and the dark, ADVENTURE daylight and no watchers).

## Rules: what each does and how the engine runs it

Every room of an act carries the act's rules as reality-engine overrides (`RealityEngine.setOverride`); a law the device runs cannot undo a local rule. On arrival the HUD shows the **LOCAL RULES** card (K, or RULES in the dock, shows it again; the journal lists it too), TICK says a line about the rule that matters most, and the gear chips on the card show what works here.

| Rule | Value | What it does | How |
| --- | --- | --- | --- |
| GRAVITY | NORMAL | Down is down. | no override |
| | INVERTED | The floor is the ceiling: PHYSICAL is upside down, INVERTED and ECHO are upright. Shift to INVERTED to stand on the floor. | `gravityFlip: { PHYSICAL: true, INVERTED: false, ECHO: false }` (state-keyed override) |
| | ZERO | Nothing has weight; you drift at the room's float height. | `zeroG: true` |
| ECHOES | HIDDEN | Memories show only in ECHO. | no override |
| | VISIBLE | Memories show in every state (they are not solid). | `echoVisible: true` |
| | SOLID | Memories are solid in every state. | `echoSolid: true` |
| TIME | NORMAL | Nothing sweeps the floor. | - |
| | SWEEPERS | Beams turn through the halls: one in every story room of a deck act, two across the avenue of a district, and more sweeper puzzles. Jump them, or freeze time. | hazards added by the generators; `TIME FREEZES` still works |
| WATCHERS | NONE | Nobody watches. | no sentinels are generated |
| | PATROL | Watchers walk their rounds and only look along the floor. | one drone per district, two from the second district; sentinel puzzle segments in decks |
| | HUNT | Watchers hunt: more of them, range x1.3, speed x1.25, a wider cone. | `tuneLevel` |
| LIGHT | DAY | Full light. | palette night 0.2 (open) / 0.08 (deck) |
| | NIGHT | Dark. | palette night 1.0 / 0.85 |
| | EMERGENCY | Red emergency light. | palette night 0.6 and emergency 0.7 (main.js `emergency()`) |
| NULL FIELD | on | No law and no gear works here. The way through is movement. | every effect overridden to false; deck puzzles are only sweepers and watchers with open exits; the district's recorder waits on a plinth in the street, the bridge over the water is real |

**Solvability.** A deck act's puzzle rooms are planned by the Forge within its rules: under ZERO only pits (you float), zero-g ledges, key locks and open exits (a core socket sits on the floor, below the float height, and no state brings you down); under INVERTED no key locks (the lock is on the floor, PHYSICAL is upside down); under a null field only sweepers and watchers; never more than three distinct law effects in one room. `checkSolvable` checks every generated room: no required effect in a null field, at most three, nothing unreachable in zero gravity, no key lock upside down, no watchers where the rules say none. `tests/forge.test.mjs` runs it over 300 seeds x 6 genres with the lengths cycled (1800 games, about 21,000 sectors) and `tests/forge.mjs` walks the generator's own routes through the rooms in a browser.

## Gear: what each does and where it works

One press (keys 5-8 on a keyboard, the gear pad on a phone), a cooldown shown as a ring on the button. Each reuses something the engine already does.

| Gear | What it does | Cooldown | Reuses |
| --- | --- | --- | --- |
| STASIS PULSE | Freezes the nearest watcher and the nearest sweeper in the room for 6 s. | 20 s | the `observerFrozen` / `timeStop` behaviour, per sentinel and hazard |
| GRAPPLE LINE | A hard-light line across one gap in front of you, up to 8 m, for 8 s. It lies on the surface you stand on (the ceiling, if you are on it). | 15 s | a temporary solid hard-light collider |
| ECHO LENS | Shows every echo for 10 s, in any state (they are not solid). | 25 s | `echoVisible` |
| LIGHT RIG | A hard-light stair in front of you for 8 s (six steps, 4.5 m up; down from the ceiling if you are on it). | 20 s | temporary hard-light colliders |
| SIGNAL FLARE | Lights the dark for 20 s and lures every watcher in the room to the flare. | 40 s | the sky and emergency light, the sentinels' patrol target |
| KEY FORGE | Makes the memory key in your hand real, once per location, so the lock takes it in PHYSICAL without HELD MATTER PERSISTS. | once per act | the key item |

Where each works (`gearRule(gear, rules)`; the rules card lists it):

| Gear | Null field | ZERO gravity | INVERTED gravity | Echoes VISIBLE / SOLID | NIGHT | EMERGENCY | DAY with no watchers | HUNT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STASIS PULSE | no | yes | yes | yes | yes | yes | yes (nothing to freeze unless sweepers) | lasts 4 s |
| GRAPPLE LINE | no | **no** (useless without weight) | runs along what you stand on | yes | yes | yes | yes | yes |
| ECHO LENS | no | yes | yes | **no** (already visible) | yes | yes | yes | yes |
| LIGHT RIG | no | **no** (stairs need weight) | yes | yes | **12 s** | yes | yes | yes |
| SIGNAL FLARE | no | yes | yes | yes | yes | **30 s** | **no** (daylight, nobody to distract) | yes |
| KEY FORGE | no | yes | yes | yes | yes | yes | yes | yes |

Every one of the 324 rule combinations is checked against all six gear in `tests/forge.test.mjs`.

## Voice

The Forge writes about 150 new fixed lines in the game's voice (Juno, TICK, the records, the cast); `tools/voice-pack.mjs` collects them (cast lines are recorded once, in the neutral crew voice, which the other crew voices fall back on), and the pack stays under 2,200 recordings. Names the player types, and the few lines that carry them, are spoken by the device's own voice.

## Saves and the chapter card

A Forge game autosaves into its slot like any chapter; the WORLD FORGE card offers CONTINUE for its latest save. The save keeps the Forge number and the choices (the game is rebuilt from them), the act and part, the scene's progress, the choices made, which keys were forged and the kit. Cooldowns reset on load.
