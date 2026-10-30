# AFTERZERO 1.1.1 (the Station Zero edition): playtest report

Playtested 2026-10-28 (some sessions ran past midnight UTC into 2026-10-29) on commit 0f3dcc6: `game/index.html` with
no edition parameter, its title reading "V1.1.1". This is the edition of `AFTERZERO-v1.1.apk` (app "AFTERZERO 1.1",
versionName 1.1.1), published at [claude.ai/artifact/UoHrkWc9QD6USztzpRLcSg](https://claude.ai/artifact/UoHrkWc9QD6USztzpRLcSg).
The testers played the page served locally. The Last Version edition was played in the same round:
[lastversion/PLAYTEST-v2.1.1.md](lastversion/PLAYTEST-v2.1.1.md).

Nothing in the game was changed for this report. This edition had no earlier playtest report, so there is no
regression section.

## Method

- **Who played:** two AI playtest agents, each with a slice:
  - **Story:** one continuous campaign, as one player would play it:
    - the Prologue: Station Zero, all 12 HALCYON districts, home, the machine;
    - two endings (SEVERED, then OBSERVED from a save taken before the choice);
    - THE CRADLE after each ending, and the Vessel's first deck after each.

    21 browser sessions on one browser profile, so the game's own saves carried between them.
  - **Systems:**
    - the Vessel's decks 1–3 by touch, from a carried save; the Vessel's ending and CYCLE 43;
    - four WORLD FORGE games built by touch through the panel, one per genre, each played to its ending;
    - Story Studio; laws, the draft and ACTIVATE, law combos; the ten save slots; settings; portrait;
    - CPU frame time under a 4× CPU throttle.
- **How they played:** headless Chromium at phone size (915×412 landscape at 1.5×, touch; the Systems tester also
  412×915 portrait). All input was touch on the game's own controls: the stick, SHIFT, JUMP, WALK, the dock, the floating
  TAP prompts, the law word chips and ACTIVATE, the COMBO button and the menus. They read every line, used TICK at every
  tier, failed on purpose, and looked at their screenshots.
- **How much:** about 170 minutes of game time (Appendix B), about 540 screenshots by the testers and about 80 by the
  verifiers.
- **Helpers:**
  - **Story:** none that changed state. The tester read positions from the game to steer the stick (and planned paths
    over its colliders), stepped the clock, and logged each spoken line with a read-only wrapper.
  - **Systems:** after its touch bot failed in WORLD FORGE G1's second part, it used the repo's own Forge test helpers
    (play a puzzle room, stand at a scene, pass a gate) for the later puzzle rooms. Choices, endings, menus and the gear
    pad stayed touch. It used a jump to the Vessel's last deck to reach the ending, one direct use of the chair after a
    missed tap, and settings set by code to restore defaults and for the frame-time run.
- **Re-checks:** each tester's report went to a separate verifier agent. The verifier re-ran every high and medium
  finding by touch where it could, checked the rest against screenshots, logs and code, set the severity it judged
  right, and logged problems it saw on the way ("extra" findings).
- **Totals:** 31 findings reported and 3 more found by the verifiers (34). 1 is by design; none was tester error or
  failed to reproduce. The other 33 are 30 problems once duplicates are merged: **no blockers, 2 high, 8 medium, 16
  low, 4 polish.** Appendix A has every finding, its verdict and the item it went into.

**Limits, which matter when reading this:**
- No real phone was used, and the APK was not installed.
- The software renderer drew about 3.7 frames per second and chose the LOW quality preset itself. The testers advanced
  the game clock in steps while using real touch input, so frame rate and latency were not felt. The verifiers checked
  the visual findings on MEDIUM as well.
- CPU frame times are JavaScript time per frame under a 4× CPU throttle; SwiftShader says nothing about the GPU.
- Voice was checked by signal (every line planned from the voice pack, captions naming the right speaker), not by ear.

## Verdict

**What works:**
- **The story.** Station Zero's puzzles chain into each other: the mirrored shadow, Recording 0 in your own voice, the
  memory key that holds only once you write HELD MATTER PERSISTS THROUGH PHYSICAL. THE CRADLE's registry and Juno's
  confession are the emotional peak, and the endings reach forward into the Cradle and the Vessel.
- **Voice.** 340 of 340 story lines and 145 of 145 Forge lines were voiced from the pack, with matching captions. Only
  lines carrying a typed name fall back to the device voice, by design.
- **Systems on a phone.** Laws by word chips and ACTIVATE, combos and the COMBO button, the ten save slots with their
  replace and delete guards, and every CONTINUE resumed exactly. WORLD FORGE is deterministic: the same number and
  choices rebuilt the same game.
- **Stability.** No page errors in about two hours of story play. JavaScript per frame at 4× throttle stays under
  16 ms (p95) at LOW and under 24 ms at MEDIUM.

**What doesn't:**
- **WORLD FORGE's gear cannot be used on a phone:** the look zone sits on top of the gear pad.
- **Two of the Prologue's big images do not show:** the windows after activation are a pale void with no stars, and
  the Other, the first character to speak, is nearly invisible.
- **WORLD FORGE's SHORT games are thin:** 1–2 of the 4 cast met, no choice at all in HORROR and ADVENTURE, lines that
  repeat, and rules that do not show on screen (HUNT with no watchers, DAY under a night sky). Pronouns are random
  whatever the name.
- **HALCYON looks the same district after district,** and a drone can catch Ren while she listens to a story
  conversation.
- **Big panels do not fit a landscape phone:** the machine's choice and the end screen need scrolling.

**Average scores** across everything played (1–5): clarity 3.7, fun 3.0, visuals 2.9, audio 4.3.

**Top five problems:** H1, H2, M1, M2 and M5 below.

## Blockers

None. Both slices could be played on by touch.

## High (verified)

**H1. WORLD FORGE: the gear pad cannot be pressed on a phone.** *(Systems SZS-01)*
- **Where:** WORLD FORGE, any act, on touch, in landscape and portrait.
- **What happens:** the four round gear buttons above JUMP (STASIS, GRAPPLE, LENS, RIG, FLARE, KEY) sit under the look
  zone. At each button's centre the touch lands on the look zone, so taps never reach them: no toast, no cooldown, no
  effect (0 gear uses in 5 taps for the verifier, the same in portrait). Keyboard 5 works. The dock's gear buttons are
  hidden on touch, so a phone has no other way to use gear.
- **Why it matters:** the Forge's signature mechanic is gone on the platform it ships for. It is not a blocker,
  because Forge rooms can be solved with an empty kit.
- **Repro:** phone in landscape. NEW GAME > WORLD FORGE > BUILD A GAME, pick four gear, FORGE, any slot. In act 1 tap
  each gear button.
- **Cause:** `css/style.css:355` gives the look and stick zones z-index 1; `#gearpad` (`:618`) has none. Giving the pad
  a z-index above them, as `#buttons` has, would fix it. The rule predates WORLD FORGE.

**H2. Prologue: after activation, the lab's windows show a pale void instead of stars.** *(Story F1)*
- **Where:** Station Zero, the Laboratory after the machine is activated, the south and east glass walls.
- **What happens:** the walls become windows onto a flat pale grey-white sky. The white stars cannot be seen against
  it, and only a dim violet arc of the planet shows at the edge. Meanwhile Ren says "Stars. It's not a lab. It's
  moving."
- **Why it matters:** the Prologue's key reveal reads as "the walls went white" (STORY.md promises stars and a violet
  planet).
- **Repro:** play to the machine and tap MACHINE twice to activate it, then face the south wall, then the east. (Quick
  start used by the verifier: set the facts left_antechamber, has_device, has_tick, met_juno and core_installed, then
  `AZ.enterRoom('lab', true)`.)
- **Cause:** `main.js:2746` copies the fog colour into the scene background, and the lab's fog is #e4edf5
  (`maps.js:127`). It does not depend on the quality preset.

## Medium (verified)

**M1. HALCYON: the Glass Market drone catches Ren while she listens to Kade.** *(Story verifier X1; tester F15,
partly)*
- **Where:** HALCYON, Neon Meridian, district 3 (Glass Market), Kade's stall at (−19, −68.6).
- **What happens:** the drone keeps patrolling during conversations. Its loop takes about 22 s and Kade's talk about
  23 s. About 21 s in it gives chase, and at 22 s it catches Ren mid-line: a white fade, then Ren at the checkpoint
  while Kade's and Juno's lines play on. It happened in 2 of 2 full conversations. The tester's "blank pale frame" was
  this fade.
- **Why it matters:** listening to a story conversation is punished, with no warning.
- **Repro:** HALCYON, Glass Market. Reach the stall from its open south side (−19, −66), tap TALK TO KADE, stand still.
- **Cause:** the watchers' update in DeckWorld ignores a running conversation, and the game keeps simulating during
  one.

**M2. The Other is almost invisible.** *(Story F2)*
- **Where:** Prologue, the Antechamber corridor after the second touch (INVERTED).
- **What happens:** the first character to speak, a violet hologram of Ren standing upside down, is drawn at about 27%
  opacity in pale violet inside violet fog. At most a faint smudge in the doorway, never a face, so its lines come
  from an empty corridor. The same on LOW and MEDIUM.
- **Why it matters:** the game's first image, "you, wearing your face", is lost.
- **Repro:** NEW GAME > PROLOGUE. Tap TOUCH twice, then look north down the corridor while "You finally learned how to
  move the room." plays.

**M3. HALCYON's districts look like one street.** *(Story F3)*
- **Where:** the 12 HALCYON districts and THE CRADLE, on LOW and MEDIUM.
- **What happens:** every district except the Glass Forest opens on the same dark avenue: lamp posts, a dashed centre
  line, a crate on the left, the beacon on the right. The Drowned Reactor shows no steam, teal fog or orange alarms on
  arrival, and the Signal Tower adds only a red mast beam. THE CRADLE is the same avenue with lit pods. The fog colours
  and weather do differ in data, but not on screen. (The shared layout, spawn south and gate north, is documented
  design.)
- **Why it matters:** HALCYON.md promises industrial horror, a storm, and pods under roots. Across 12 districts the
  middle hour of the Prologue feels repetitive.
- **Repro:** compare the arrivals at Noodle Row, Turbine Floor, The Sump, Control Deck, Antenna Field and the Cradle's
  Well Floor.

**M4. WORLD FORGE: acts that say HUNT or PATROL usually have no watchers.** *(Systems SZS-02)*
- **Where:** Forge deck acts with WATCHERS PATROL or HUNT.
- **What happens:** over 300 SHORT games generated as the game does, 145 of 245 PATROL and 64 of 135 HUNT deck acts
  have no watcher in any part. In play, the HORROR game's HUNT and PATROL acts had none in all six parts, while TICK
  said "THE WATCHERS HERE HUNT. BE A WALL." and the rules card listed HUNT.
- **Why it matters:** an announced rule with nothing behind it undermines the Forge's rules (FORGE.md promises
  watcher segments in decks, and more of them for HUNT).
- **Repro:** Forge 777, HORROR, SHORT, act 1 Medbay with WATCHERS HUNT. Play act 1.
- **Cause:** `gen/Forge.js:437-439` adds a watcher only as a weighted middle segment; tuning only adjusts the ones
  that exist.

**M5. WORLD FORGE: SHORT games meet only 1–2 of their 4 cast, and some offer no choice.** *(Systems SZS-05)*
- **Where:** WORLD FORGE, SHORT length (3 acts of 2 parts).
- **What happens:** a SHORT act uses only the first two scenes of each act's plan, so the encounter or choice is often
  cut.
  - The THRILLER game met 2 of 4; Dev, the rival the player typed, never appears.
  - The HORROR game met 1 of 4 and offered no choice ("trusted 0 · doubted 0"); Maya, the typed child, never appears.
  - Over 200 games per genre: HORROR and ADVENTURE SHORT games never offer a choice, and in 80 to 200 of 200 games a
    typed pair is not fully met.

  FULL games meet all four and always have a choice.
- **Why it matters:** the README and FORGE.md promise choices that change the ending, and a cast made from the
  player's own names.
- **Repro:** Forge 777, HORROR, SHORT, cast Maya (Child) and Tomas (Keeper). Play to the end and read the ending's
  stats.

**M6. WORLD FORGE: lines repeat.** *(Systems SZS-06)*
- **What happens:**
  - Juno's "Alive. Down here. I did not think anyone was." closes every encounter, even a second meeting with the same
    person (`Forge.js:601`).
  - The THRILLER antagonist says the same three lines in two encounters in a row.
  - In the HORROR game the same log record plays in two parts, and "Whoever wrote that was not alone." comes four times.
- **Why it matters:** in a six-part game the repeats are easy to notice.
- **Repro:** Forge 4242, THRILLER, SHORT. Meet Priya in act 2 part 2 and again in act 3 part 1.

**M7. WORLD FORGE: the LIGHT rule does not show.** *(Systems SZS-07)*
- **What happens:** open acts set to DAY render under a black, starry sky, because they keep their district's night
  sky (`Forge.js:620-626`). A HORROR medbay set to NIGHT looks evenly white-lit; the verifier's side-by-side of the
  NIGHT and DAY values looked almost the same.
- **Why it matters:** the rules card says one thing and the screen shows another.
- **Repro:** Forge 2024, ADVENTURE, SHORT, act 1 Neon city with LIGHT DAY; Forge 777, HORROR, act 1 Medbay with
  LIGHT NIGHT.

**M8. Pronouns, and so bodies, are picked at random whatever the name.** *(Systems SZS-04)*
- **Where:** the WORLD FORGE cast, Story Studio and the Vessel's crews.
- **What happens:** `Forge.js:508` and `StoryGen.js:226` pick a pronoun at random, and the body model follows it. Seen:
  Priya "him", Bilal and Mateo "her", the typed Maya "him", Tomas "her", Kit "her", Ana "him", and Studio's typed Aria
  "him" ("If anyone left us a trail, it's him."). Neither panel has a pronoun field.
- **Why it matters:** names the player types are often cast against what they meant.
- **Repro:** Forge 4242, THRILLER, cast Aria (Guide) and Dev (Rival). Read the cast, or play to the encounters.

## Low and polish (verified)

### Low

**Phone layout**
- **L1. The machine's choice panel is taller than a landscape phone.** *(Story F4, partly)* *Where:* THE MACHINE's
  decision panel at 915×412. *What:* 471 px of content in a 379 px panel; MIRROR's subtitle sits under the MORE fade
  and NOT YET partly below the screen. A tap on NOT YET's visible strip did close the panel for the verifier. *Why:* the
  earned hidden ending is half hidden. *Repro:* reach the choice and look.
- **L2. The end screen's way forward starts under the fade.** *(Story F5)* *Where:* the SEVERED and OBSERVED end
  screens. *What:* GO BENEATH is cut by the MORE fade and SKIP TO THE VESSEL is below the panel (922 px of content in
  379). *Why:* the player has to find how to continue. *Repro:* finish the Prologue with any ending.
- **L3. Dock buttons are 44 × 38 px with 4 px gaps.** *(Story F13)* *Why:* below a 48 px thumb target. *Repro:*
  measure the dock in any chapter.
- **L4. The pause panel covers the dock's MENU spot.** *(Systems SZS-08)* *What:* a second tap on MENU to close the
  pause lands on the panel just below QUIT TO TITLE, which has no confirmation (it autosaves first). *Why:* the tester
  once quit to the title by accident. *Repro:* tap MENU, then the same spot again.
- **L5. The Forge's rules card overlaps the act card and the stick.** *(Systems SZS-11)* *What:* for about 7 s on
  arrival; in a null field the card still lists GRAVITY INVERTED and ECHOES SOLID, which do nothing there. *Repro:*
  Forge 2024, ADVENTURE, SHORT, arrive in act 2 (Glass forest, NULL FIELD).
- **L6. THE CRADLE's "Saving in slot N" toast is drawn over its chapter card.** *(Story F9)* *Repro:* finish the
  Prologue, tap GO BENEATH.

**Saves and labels**
- **L7. The Vessel card's "After {ending}" can name the wrong ending.** *(Story F8)* *What:* the line comes from the
  last ending reached on the device, while the card's CONTINUE resumes a Vessel save that may follow another ending
  (`main.js:732-737`). *Repro:* play the Vessel after SEVERED, then reach OBSERVED in another slot, then open NEW GAME.
- **L8. A save made before the machine's choice is overwritten once you continue from it.** *(Story F14)* *What:*
  continuing a manual save makes that slot the game's autosave, and the ending autosaves over it. *Why:* seeing
  another ending means replaying the 65-minute Prologue. *Repro:* SAVE GAME to slot 2 before the choice, quit,
  CONTINUE, choose, then open LOAD.
- **L9. With all ten slots full, a new chapter gets no slot.** *(Systems SZS-03, lowered from medium; its verifier's
  VSZS-X1)* *What:* CYCLE 43 starts a run kept only in the OLD AUTOSAVE, with no warning (CONTINUE still reaches it).
  By code, THE CRADLE or THE VESSEL from the Prologue's ending card autosave over the finished Prologue's own slot
  (`main.js:1036-1049`). *Why:* saves can be lost silently. *Repro:* fill all ten slots, finish a Vessel run, tap
  CYCLE 43, open LOAD.

**Places and puzzles**
- **L10. The archive gap has a hidden ledge that traps Ren.** *(Story F6)* *Where:* the Archive, the south lip of the
  gap. *What:* stopping at the edge leaves Ren 0.4 m below the floor (a wall box juts out under it, `maps.js:290`); the
  step-up cannot climb back, only sideways moves or JUMP get out. *Repro:* in PHYSICAL, walk lightly toward the gap
  from (3, −22), then push back toward the door.
- **L11. One law trivialises the Observation Hall.** *(Story F10)* *What:* without a law the Observer learned three
  lessons and caught Ren six times in two minutes; one ACTIVATE of OBSERVER FREEZES IN PHYSICAL froze it for the whole
  walk there and back, with no time limit, so the designed "it learns the freeze" step never comes. *Repro:* write the
  law at the door, ACTIVATE, walk to the core and back.
- **L12. Juno announces HALCYON's people with the Vessel's crew template.** *(Story F7)* *What:* "It might be Abena."
  (her own chief, whom she calls Osei) and "It might be Ilse." (which gives away Varga before the tower's reveal)
  (`main.js:1831`); Osei's prompt reads TALK TO ABENA. *Repro:* enter Glass Market, Control Deck, The Cabin Road or
  Last Landing.

**WORLD FORGE and the Vessel**
- **L13. The Forge's ending never uses the hero's typed name;** the THRILLER coda says "You trusted them, Ren".
  *(Systems SZS-10)* *Repro:* hero "Mika", Forge 4242, THRILLER, play to the end.
- **L14. A Forge objective says "The gate is open: THE WAY ON."** inside a room still locked by a key puzzle.
  *(Systems SZS-12)* *Repro:* Forge 4242, act 1 part 1, walk into WAKING HALL before taking the key.
- **L15. Rooms repeat.** *(Systems SZS-09)* *What:* GREENHOUSE 3 ends sector 2 and starts sector 3 of the Vessel's deck
  1 with the same layout; deck 2 reuses four rooms across sectors; Forge acts reuse deck rooms. *Repro:* Vessel slot
  seed 437131043, deck 1 sectors 2–3.
- **L16. "SHORT, about 40 minutes" is likely too long a promise.** *(Systems SZS-13, partly)* *What:* by touch a Forge
  part took 1.5–4 game minutes, so a six-part game is likely 15–25 minutes; not measured end to end by touch.

### Polish

- **P1. The conversation camera sometimes blocks the speaker:** at the lab's entrance Ren's head fills the bottom of the
  screen while Juno is small and far; TICK floats by the Custodian's head. *(Story F12)*
- **P2. Story Studio forgets every wish when opened again,** and the Forge panel's draft is lost on any reload (QUIT TO
  TITLE, a new start); only BACK TO THE FORGE keeps it. *(Systems SZS-14; its verifier's VSZS-X2)*
- **P3. "SHIRTSLEEVES" wraps as "SHIRTSLEEVE / S"** in the first YOUR LOOK picker. *(Systems SZS-15)*
- **P4. After CYCLE 43 the title says "CONTINUE · Tap to enter",** and the new cycle starts only after that tap; the
  label could say what it starts. *(Systems SZS-16)*

## What the testers liked

- **Voice:** 340 story lines and 145 Forge lines, all from the voice pack, with captions naming the right speaker.
- **Station Zero's puzzles:** the shadow that moves against you, "stand where it isn't", Recording 0 in your own voice,
  and the memory key that dissolves until you write the law.
- **Laws by touch:** word chips and ACTIVATE. An unactivated draft says "Not running yet. Press ACTIVATE…" and survives
  closing the panel. Combos are named from the phone keyboard and switched with the COMBO button.
- **TICK:** its three tiers (nudge, direction, answer) were right at every Station Zero, HALCYON and Vessel step.
- **Living documents:** recordings that grow new sentences, an objective that glitches as it rewrites itself, and open
  questions that close ("Not where. When.").
- **HALCYON:** walking the glass dome upside down, the echo bridges, the wanted screen and the memorial in ECHO, and
  the 33 fragments that build a sleeping city. Kade, Osei's echo, Theo and Varga's echo each land.
- **THE CRADLE:** the registry echo ("REN VARGA - SON OF ILSE VARGA - BODY LOST - MIND KEPT") and Juno's confession.
  Varga's first and last lines change with the ending.
- **Endings reach forward:** after SEVERED, the Cradle's drones are dark and the Vessel's windows black glass; after
  OBSERVED, violet watchers, stars, and a card that reads AFTER OBSERVED.
- **Fair setbacks, no dead ends:** the archive fall, leaving ECHO mid-bridge, the Observer's "It remembers you.", a
  drone catch, the canal. The Bridge gives another chance after a wrong accusation.
- **WORLD FORGE:** fully deterministic. The LOCAL RULES card, with green and struck-through gear and a reason for each,
  explains a place at a glance.
- **Saves:** the ten slots, "Tap again to replace this save", DELETE with SURE?, and every chapter card's CONTINUE.
  21 sessions and a mid-sector quit all resumed exactly.
- **Settings take effect at once:** quality, comfort, large subtitles and volume.

## Not covered

- **The SUSTAINED ending,** its Cradle and its Vessel opening (the pre-choice save had been overwritten: L8).
- **The Vessel after the Prologue's endings,** past its first log; the spoken Deck 1 intro after SEVERED.
- **The Vessel's decks 4–8 by input** (the ending was reached by a jump); no Vessel watchers were met on decks 1–3.
- **WORLD FORGE:** puzzle rooms by touch after G1's first part (repo helpers were used); FULL and EPIC lengths.
- **Story Studio** beyond deck 1, sector 2.
- **Other checks:**
  - one Cradle fragment per run (it needs a jump);
  - the HALCYON card's CONTINUE;
  - Voiced dialogue OFF;
  - rotation mid-game, and portrait in the Story slice;
  - MEDIUM and HIGH in the Story slice (the verifier used MEDIUM).
- **Not done anywhere:** a real phone, the APK installed, iOS, real GPU frame times, listening by ear, and a human
  player.

Evidence: `deep/sz-story`, `deep/sz-systems`, `deep/verify-sz-story` and `deep/verify-sz-systems` in the session's
scratch space: notes, logs, screenshots and saves.

## Appendix A: every finding and its verdict

Severity is the verifier's; the tester's is in brackets where it differs. Verdicts: confirmed, partly (real but
narrower or milder than reported), by design, extra (found by the verifier). "Item" is the merged problem above; "—"
means none.

### Story tester (Prologue, HALCYON, endings, THE CRADLE, the Vessel's opening)

| ID | Severity | Verdict | Item | Where | Finding |
| --- | --- | --- | --- | --- | --- |
| F1 | high | confirmed | H2 | The lab after activation | The windows show a pale void; the stars are invisible. |
| F2 | medium | confirmed | M2 | The Antechamber, INVERTED | The Other is drawn at 27% opacity in violet fog. |
| F3 | medium | confirmed | M3 | HALCYON and THE CRADLE | Every district except the forest looks like one dark avenue. |
| F4 | low (medium) | partly | L1 | The machine's choice panel | It needs a scroll; a tap on NOT YET's visible strip did close it for the verifier. |
| F5 | low | confirmed | L2 | The end screen | The way forward starts under the fade. |
| F6 | low | confirmed | L10 | The archive gap | A 0.4 m ledge below the floor traps Ren. |
| F7 | low | confirmed | L12 | HALCYON's people | Juno's "It might be Abena / Ilse". |
| F8 | low | confirmed | L7 | Chapter menu, THE VESSEL | The card names the device's last ending, not the save's. |
| F9 | low | confirmed | L6 | GO BENEATH > THE CRADLE | The toast is drawn over the chapter card. |
| F10 | low | confirmed | L11 | The Observation Hall | One freeze law trivialises the hall. |
| F11 | polish (low) | by design | — | The Vessel's first room | TICK repeats one nudge: hint tiers exist only for puzzle challenges. |
| F12 | polish | confirmed | P1 | The lab entrance, the archive | The conversation camera blocks the speaker. |
| F13 | low | confirmed | L3 | The HUD dock | 44 × 38 px buttons. |
| F14 | low | confirmed | L8 | Saves around the choice | A pre-choice save is overwritten. |
| F15 | low | partly | M1 | Glass Market, Kade | The "pale frame" was not a glitch but a catch fade: the drone caught Ren mid-talk. |
| X1 | medium | extra | M1 | Glass Market, Kade | The drone catches Ren during the Kade conversation. |

### Systems tester (the Vessel, WORLD FORGE, Story Studio, laws, slots, settings)

| ID | Severity | Verdict | Item | Where | Finding |
| --- | --- | --- | --- | --- | --- |
| SZS-01 | high | confirmed | H1 | WORLD FORGE, phone | The look zone covers the gear pad; gear cannot be used by touch. |
| SZS-02 | medium | confirmed | M4 | WORLD FORGE, PATROL and HUNT acts | Most have no watchers. |
| SZS-03 | low (medium) | confirmed | L9 | The Vessel's CYCLE 43, all slots full | The new run lives only in the OLD AUTOSAVE, unwarned. |
| SZS-04 | medium | confirmed | M8 | Forge, Studio and Vessel casts | Pronouns are random whatever the name; no pronoun field. |
| SZS-05 | medium | confirmed | M5 | WORLD FORGE, SHORT | 1–2 of 4 cast met; no choice in HORROR and ADVENTURE. |
| SZS-06 | medium | confirmed | M6 | WORLD FORGE encounters and logs | Lines repeat. |
| SZS-07 | medium | confirmed | M7 | WORLD FORGE, LIGHT | DAY looks like night; NIGHT looks lit. |
| SZS-08 | low | confirmed | L4 | The pause menu | The panel covers the MENU spot; QUIT has no confirmation. |
| SZS-09 | low | confirmed | L15 | The Vessel and Forge decks | Rooms repeat. |
| SZS-10 | low | confirmed | L13 | The Forge ending | The typed hero's name is never used. |
| SZS-11 | low | confirmed | L5 | Forge arrival | The rules card overlaps the act card and the stick. |
| SZS-12 | low | confirmed | L14 | Forge G1, WAKING HALL | "The gate is open" inside a locked room. |
| SZS-13 | low | partly | L16 | Forge SHORT label | "About 40 minutes" is likely too long; not measured end to end. |
| SZS-14 | polish | confirmed | P2 | Story Studio panel | It forgets the wishes. |
| SZS-15 | polish | confirmed | P3 | YOUR LOOK picker | "SHIRTSLEEVES" wraps mid-word. |
| SZS-16 | polish | confirmed | P4 | After CYCLE 43 | The title says "Tap to enter". |
| VSZS-X1 | low | extra | L9 | The Prologue's ending card, all slots full | THE CRADLE and THE VESSEL autosave over the finished Prologue. |
| VSZS-X2 | polish | extra | P2 | WORLD FORGE panel | Its draft is lost on any reload. |

## Appendix B: scores per mission (1–5)

Each tester scored what they played: clarity, fun, visuals, audio. Minutes are game time, inflated by the stepped
clock and the harness's path-finding. "By input" is whether the stretch was finished by touch from its real start.

| Tester | Stretch played | Minutes | By input | Clarity | Fun | Visuals | Audio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Story | Prologue, first half (the Antechamber to the HALCYON hatch) | 13 | yes | 4 | 4 | 3 | 5 |
| Story | Prologue, HALCYON (12 districts) and the lift home | 44 | yes | 4 | 3 | 2 | 5 |
| Story | Prologue, home, the machine and the choice (SEVERED, OBSERVED) | 8 | yes | 4 | 3 | 2 | 5 |
| Story | THE CRADLE after SEVERED | 11 | yes | 4 | 3 | 3 | 5 |
| Story | THE CRADLE after OBSERVED | 12 | yes | 4 | 3 | 3 | 5 |
| Story | The Vessel's opening after SEVERED | 2 | yes | 3 | 3 | 3 | 4 |
| Story | The Vessel's opening after OBSERVED | 2 | yes | 4 | 3 | 3 | 5 |
| Systems | The Vessel, decks 1–3 (deck 3 to sector 3) | 40 | yes | 4 | 3 | 3 | 4 |
| Systems | WORLD FORGE G1 THRILLER "Cold Ledger" (helpers after act 1 part 1) | 13 | no | 3 | 3 | 3 | 4 |
| Systems | WORLD FORGE G2 HORROR "The Quiet Ward" (helpers) | 4 | no | 3 | 2 | 2 | 4 |
| Systems | WORLD FORGE G3 HEIST "Vault of Hours" (helpers) | 4 | no | 3 | 3 | 3 | 4 |
| Systems | WORLD FORGE G4 ADVENTURE "Over the Glass" (helpers) | 3 | no | 3 | 2 | 2 | 4 |
| Systems | Story Studio "The Night Shift" (deck 1, sectors 1–2) | 4 | no | 4 | 3 | 3 | 3 |
| Systems | Laws, the draft and ACTIVATE, combos | 3 | yes | 5 | 4 | 4 | 4 |
| Systems | Ten save slots, CONTINUE on each card, settings | 6 | yes | 4 | 3 | 4 | 3 |

**Averages (1–5):**

| Rows | Rows scored | Minutes | By input | Clarity | Fun | Visuals | Audio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Story | 7 | 92 | 7 of 7 | 3.9 | 3.1 | 2.7 | 4.9 |
| Systems | 8 | 77 | 3 of 8 | 3.6 | 2.9 | 3.0 | 3.8 |
| **Everything** | **15** | **169** | **10 of 15** | **3.7** | **3.0** | **2.9** | **4.3** |
