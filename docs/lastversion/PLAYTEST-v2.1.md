# AFTERZERO: The Last Version of Earth v2.1: playtest report

Playtested 2026-10-25 on the published v2.1 web build (commit 5108310, the same build as
[the preview](https://claude.ai/artifact/HsWBbg3ppPShrBPVPaBhaE) and `AFTERZERO-LastVersion-v2.1.apk`).

**Fix status:** v2.1.1 carries the fixes for this report; see [Fix status (v2.1.1)](#fix-status-v211) for every finding.

## Method

- **Who played:** four AI playtest agents, each with a slice of the game:
  - a first-time player (title to Mission 4);
  - Acts I–II (Missions 4–13);
  - Acts III–IV, the Finale, all three endings, CASE FILES and free roam;
  - systems and phone ergonomics (portrait and landscape, settings, saves, performance, a 20-minute soak).
- **How they played:** in headless Chromium at phone size (915×412 landscape, also 412×915 portrait), using touch input on
  the game's own controls. They read every line, used THINK, and looked at their screenshots, more than 1,000 in all.
- **Re-checks:** each tester's report went to a separate verifier agent. The verifier tried to reproduce every blocker, high
  and medium finding from its repro steps, checked the rest against screenshots and code, and set the severity it judged
  right. The verifiers also logged problems they saw while reproducing ("extra" findings).
- **Totals:** 78 findings reported and 9 more found by the verifiers. 2 did not reproduce and 4 are by design. Many of the
  rest are the same problem seen by several testers, so they are merged in the lists below. Appendix A has every finding
  and its verdict.

**Limits, which matter when reading this:**
- No real phone was used. The software renderer drew 3–5 frames per second, so after the opening the testers advanced the
  game clock in steps (as the repo's bot does) while still using real touch inputs.
- Frame rate, input latency and timing were therefore not felt in real time. Performance figures are CPU-side
  measurements on an emulated phone (4× CPU throttle).
- Voice was checked by signal (every line's clip started, at matching length, with captions matching), not by ear.
- The testers' walking scripts sometimes needed a helper move to get somewhere. Each such case was either reported as
  "I could not work out how to progress" or dropped as a harness limit. The verifiers rejected findings caused by the
  harness itself.

## Verdict

**What works:**
- **Story and voice are the strongest part.** Every one of about 2,400 lines the testers heard was voiced from the
  recorded packs, with matching captions and no misses.
- **Strong opening and writing.** Mission 1's hook works, and the Acts III–IV writing lands.
- **Systems and safety nets.** THINK, the deductions, REVERSE's feedback and the soft setbacks are good.
- **No crashes.** There were no page errors in more than 100 browser sessions, including a 20-minute soak.

**What doesn't:**
- **Two blockers stop a phone player:**
  - the Prologue cannot be finished by touch (Mission 3);
  - CASE FILES opened from the title softlocks.
- **Constant crowd chatter.** One code bug makes passers-by talk from anywhere, every few seconds, for the whole game.
  Because a talking line hides the tap prompt, this also makes interacting unreliable on a phone.
- **Fiddly on a phone.** Unreadable "because" lines, a prompt that runs off the screen in portrait, title buttons below
  the fold, tiny buttons, and no explanation of the dock.
- **Big moments are told, not shown.** The Zero Second, the frozen block, the climax and the endings are narrated over
  the normal gameplay view. The final places are dim black shapes.

**Average scores** across everything played (1–5): clarity 3.4, fun 2.8, visuals 2.7, audio 3.2.

## Blockers (confirmed)

1. **The Prologue cannot be finished on a phone (Mission 3, control room).**
   - The lock needs the 2026 keycard carried into 2049 with the causal anchor, and the anchor has no touch control: it
     exists only on the keyboard C key (`game/js/ui/Input.js:31`; `Runtime.js` `anchor()`; `prologue.js:965-970`).
   - A touch player takes the keycard, taps YEAR, and the keycard is gone.
   - Reproduced exactly by the verifier.
2. **CASE FILES from the title softlocks (after any ending).**
   - Title → NEW GAME → CASE FILES → REPLAY a case, or a FREE ROAM trip, leaves the game in its ending menu state with
     the overlay hidden. The case never starts, SKIP and pause do nothing, and only a reload escapes.
   - The same flows from the in-game ending card work.
   - A related problem makes it worse: CONTINUE on a finished save puts Kai back on the Finale hilltop with "The next door
     is open. Keep going." and nothing to do, and the ending card never returns. So after leaving the ending card, the
     title is the only way into CASE FILES, and that way is broken.

## High (confirmed)

3. **Crowd barks ignore distance, loop tiny pools, and hide the tap prompt.**
   - Found separately by all four testers and two verifiers; the most-felt problem in the game.
   - **Root cause:** in `game/js/world/DeckWorld.js` (about lines 562–596) the bark's distance check uses the shared
     scratch vector `_v` after the walking code has overwritten it with a unit direction. So any walking person barks
     from anywhere, one remark about every 9 s, all mission.
   - **Repetition:** pools are 1–7 lines, so lines repeat dozens of times:
     - "Is it still the same minute out there?" about 45 times in 12 minutes in M13;
     - "Same bread as yesterday." 30–41 times per M15 session;
     - a 2026 commuter's line during the walk up the hill with Mira.
   - **Hidden prompt:** while any line is showing, the floating tap prompt, the only touch way to interact, is hidden.
     Measured at the M1 plaza clock, it was hidden in about half the samples, so taps on things often do nothing.
4. **Mission 6: the brass arm keeps throwing Kai back, unexplained.**
   - The arm's full 14.4 m bar sweeps everything within 7.2 m of its pivot every 2.9 s. That covers Ezra, the ledger, the
     gauge, both stairs, and the top of the cellar steps, which is the only way from the spawn and checkpoint into the
     shop.
   - Each hit silently returns Kai to the cellar: one tester was caught 42 times. A thread does ask you to get past the
     arm, but covering the exit and the people before it is introduced is not intended.
   - The only reliable answer is switching to 2196, where the arm is rusted still.
5. **Mission 2: the stair to the second power cell is buried in a chiller tank.**
   - Its first three steps are inside the tank's collider (`prologue.js:554-566`). The first exposed step is 1.3 m up,
     above Kai's jump.
   - The verifier found an unmarked route that works with the stick and jump, so it is not a hard blocker, but few
     players will find it.

## Medium (confirmed or partly confirmed)

**Phone UI**
- **The objective's "because" line is unreadable** on most scenes (10.5 px dark slate italic, no shadow or backing). It
  is also low contrast on M19's white world.
- **In portrait the floating prompt runs off the screen edge.** It is clamped by its centre to 90 px from the edge but is
  175–242 px wide. It can also overshoot in landscape.
- **On the landscape title with a save**, CONTINUE pushes NEW GAME to the bottom edge and LOAD GAME and SETTINGS off
  screen, with no hint that the card scrolls.
- **Controls onboarding is missing on phones.** The touch hints sit below the title's fold, the dock is four unlabelled
  icons, and nothing teaches THINK or the CASE board.

**Story staging**
- **The Zero Second (Mission 1) does not show what the narration says.** The train stands intact, and the "pinned" woman
  and the man "caught in a door" stand upright beside Kai.
- **The cold open's "Kai Varen is asleep" shot** flies the camera through a building facade: a black frame with
  floating window panels (`prologue.js:112`).
- **Act II's big payoffs are caption-only or too small to see.** The shell climbing home, the hanging kitchen, Lin's
  lanyard and file, and the lock's bolts.
- **In M13 the "trapped" people of the frozen block** pace the open street in front of the frozen glass.
- **Climax places read as dim black slabs** against a pastel sky (Spire summit, the first-second chamber, the original
  Chronolith). The verifier noted the ring is meant to be black metal, but the climactic hilltop is murky at default
  quality.
- **The endings undersell the climax.** The choice's spectacle is narrated over the unchanged gameplay view, with the HUD
  still saying "The next door is open. Keep going." (The shared epilogue lines across the three endings are by design.)
- **The Finale's choice header shows a line the player never earned:** "Orren's record: released…" when Orren's
  side story was never done. Choice headers ignore their line's condition; two more Act II choices do the same.

**Mission bugs**
- **M12:** saving during the 2196 cold open (or backgrounding the app there) resumes play in 2196 with the Chronolith
  draining, under a "THE CHASE — 2049" quarter.
- **M13:** a patrol can catch Kai while the frozen-block scene lines are still playing, and the stealth crossings
  finish in seconds without patrol contact.

**Performance**
- **CPU per frame on an emulated mid-range phone (4× throttle) is 25–33 ms,** with a p90 of 37–46 ms, in M1's crowded
  avenue. That caps a phone near 30–40 fps before any GPU work. About two thirds is world-matrix and skeleton updates
  over a large scene graph.
- **Memory:** in the soak the JS heap levelled off, but three.js geometries and textures grew by about 35 and 40 per
  round of missions (partly confirmed: not all of it is a leak).

## Low and polish (selection; all are in Appendix A)

**Resume and saving**
- Resuming puts Kai at the last quarter checkpoint, not where he stood. This is by design, but before a quarter's
  threads are done in M1 that is 110 m back.
- In the Finale, a save taken past the fallen street reloads behind it.
- The top-left place name never changes after a mission's first quarter.

**Controls**
- The largest button on screen, YEAR, is lit and tappable from the first second, though it does nothing before
  Mission 3.
- The REVERSE button and the floating prompt sit where a right-thumb look-drag starts, so a drag can fire them.
- CASE FILES buttons are small: REPLAY 71×29 px, year buttons 49×24 px.
- The ending card and the title cut off their lower buttons in landscape.
- Settings and the case board scroll their close button away.

**Feedback and wording**
- The watcher meter is an unlabelled white bar.
- REVERSE's first use never says how to use it, and two different second counts show at once.
- Later THINK hints are curt fragments.
- In M22 a correct wall pick gives no feedback.

**Mission details**
- In M1 the chase start has Mira out of sight behind the train.
- M4's "house you woke in" is not marked on the map.
- In M13 the only routes through the trench are not signposted.
- In M10 the narration mentions a visor Sera does not wear.
- In M23 a flat white rectangle floats in the sky.
- On every mission load, a missing "xbot" model logs a warning.
- The published page's meta description still talks about "laws".

**Not confirmed or by design**
- **Not reproduced:** the M15 camera swallowed by the school awning, and a silent first bark after a chapter load.
- **By design:** SKIP ends one line or shot (there is no skip-all), loading from the pause menu goes through the title,
  and the Finale shows empty payoffs on a chapter-select start.

## What the testers liked

- **Voice.** 915 of 915 lines in the first-time run, 504 of 504 in Acts III–Finale, and every line in the systems runs
  started their own recorded clip. Captions always matched, `speechSynthesis` was never used, and the first tap starts
  the sound under Chrome's real autoplay rules. The volume sliders really move the mix.
- **Mission 1's hook:**
  - the florist's "you already came in" and the scar;
  - the door glass opening Kai's wrist;
  - "Kai Varen. Do not build the machine." in every speaker;
  - the woman with Mira's face.
- **Writing in Acts III–IV:**
  - "every cause was me";
  - the Witness's "Because nobody fixed it.";
  - Mira asking to be asked;
  - Odile's "They put me back together every morning";
  - M13's "Nobody started it. It keeps starting."
- **Puzzles:**
  - Mission 1's plaza deduction;
  - Mission 2's officers' recordings checked against the door log;
  - Mission 11's lock ("last fitted, first out");
  - Mission 13's three devices, each answering in its own year (the best use of YEAR plus REVERSE).
- **REVERSE on touch is clear and rich:** a chip, a label over the target, a ring, a vignette and a RELEASE button. A
  hold survives rotating the phone.
- **THINK hints:** three tiers per objective, the last always enough to solve it.
- **Soft failure:** being caught or hit walks Kai back with a line, never a dead end.
- **Autosave:** each new quarter saves, and CONTINUE brings back the right place, objective and facts.
- **Casting:** the settlement looks of its era. The Elder reads as an old woman and Niko as a young man, and the glazier
  is recognised and pays off as an ally.
- **Free roam from the story** works cleanly, there and back to the same spot.

## Not covered

- Missions 17 and 20 were not played, and Missions 5, 7, 9, 10, 12 and 14 only in part.
- Optional side stories were mostly skipped, and only some choices were tried.
- The Finale was played on chapter-start facts, so most consequence payoffs showed their empty versions.
- No real Android device, no APK back button, no iOS, no real GPU frame times, and no listening by ear.

## Fix status (v2.1.1)

v2.1.1 is an update of v2.1 (the same app, `com.afterzero.lastversion.v2_1`, installed over it with its saves;
versionName 2.1.1, versionCode 211) carrying the fixes for this report. They were made on 2026-10-26 and 2026-10-27 in
seven units (barks, touch, flow, perf, missionsA, missionsB, staging), each checked by an independent reviewer by touch
at 915x412 and 412x915, then in a follow-up on what the reviewers found still open, then in the release check
([STATUS.md](STATUS.md): the "v2.1 playtest fixes" entries and "v2.1.1").

Of the 87 findings: **81 fixed, 1 partly, 0 not fixed, 4 by design** (left as they are) and
1 not reproduced (unchanged). Partly: Mission 21's last battle (acts-3-finale F19) is still lines and two gaps,
though the tremors now cost hold time. Still not done anywhere: a real phone, and listening by ear.

**Re-checked on the built v2.1.1 preview** (`android/build-lastversion/preview`, served locally, the same page and packs as
the APK), by touch at 915x412, 2026-10-27, by each finding's own repro:
- **FT-01** (blocker), from the tester's s37 (one placement into the CONTROL room, as its verifier did): YEAR to 2026,
  TAKE KEYCARD tapped; the tip "KEYCARD (2026) comes apart when the year changes. Tap ANCHOR first, then YEAR."; ANCHOR
  shown at [653,314,60,60] and on top; a drag starting on it turns the view (0.546 rad) and does not anchor; a tap
  anchors the card; YEAR to 2049 keeps it; the CARD LOCK prompt tapped opens the lock.
- **acts-3-finale F01** (blocker), the tester's finished save p35 in slot 1, the game's own loop: Title > NEW GAME >
  CASE FILES > REPLAY THE UNWRITTEN RECORD: no menu left open, "Case fourteen. The Unwritten Record." then the opening
  ends, the stick walks Kai 15.8 m, the dock's MENU pauses. FREE ROAM > THE FRACTURE 2026: Kai walks 19.4 m in 2026,
  MENU pauses. No page errors.
- **FT-03** (high), the tester's s40 (Mission 4), standing 60 s: one remark, from 1.68 m, voiced (the playtest: 7 from
  3-45 m). Walking with the crowd 180 s: three, 30 s apart, from 1.86-3.17 m, all voiced.
- **FT-04**, the tester's s7, at the plaza clock: the prompt shown in 180 of 180 samples over 45 s (the playtest: hidden
  in about half). With a commuter's remark up beside Kai the prompt stays on top; a tap on it cuts the remark and opens
  the deduction ("KAI: A toy that falls up."); after a wrong answer it is back in 5 s.
- **acts-1-2 F02 / X02** (high), Act I NEW GAME, a jump to Mission 6: three climbs up the cellar steps, 0 hits ("These
  steps went down to a river once" said whole); Ezra talked to and 20 s by his counter, 0 hits; the book read, 0 hits.
  Walking straight into the arm: knocked back to the counter, with the toast and "Go when it has passed." Crossings
  started as the corrected toast says, from the counter's line 1 m from the post: 2.0 and 2.2 s after an end passed got
  across; 0.5 s (the first toast's advice) was hit, and so were 2.5 and 2.8 s with the stick pushed part way (a slow
  count is too late there). In 2196 the arm is still and the stair is walked to with 0 hits.
- **FT-02** (high), the tester's s22: from the terrace floor up the gantry stair by the stick alone (2.6 m), TAKE POWER
  CELL tapped, cell 2 held; pushed west into the steps Kai stops at their face (VX-01).
- Evidence: `fix/release/` in the session's scratch space (logs `rv_*.log`, `barks/*.json`, `missions/logs/rm2.log`,
  `rm6.log`, `rm6b.log`, screenshots `shots/`).

### First-time player

| ID | Status | What changed |
| --- | --- | --- |
| FT-01 | fixed | An ANCHOR touch button beside YEAR (and a tap on the CARRYING label) anchors the held echo item; a tip says to anchor before YEAR. Re-checked on the built preview. |
| FT-02 | fixed | Each step of the gantry stair reaches the floor and the chiller tank stands beside it; the stair is walked up by the stick. Re-checked on the built preview. |
| FT-03 | fixed | The bark distance uses its own numbers (not the overwritten `_v`): only within 4.5 m on Kai's floor, at most one a place every 30 s and one a person every 60 s. Re-checked on the built preview. |
| FT-04 | fixed | Barks and Line 41's PA no longer hide the prompt; a tap on it cuts the bark and acts. Only story lines hide it. Re-checked on the built preview. |
| FT-05 | fixed | The woman waits at the east end of Kai's own platform, in sight, and sets off only when he is within 14 m and sees her. |
| FT-06 | fixed | The Zero Second is shown: the 41 rushing at the camera, the wreck, the woman pinned under the bench and the man caught in a door. The impact itself is a flash and a cut. |
| FT-07 | fixed | The because line is light with a halo on a dark plate. The mission card covering the objective was not reproduced and is unchanged. |
| FT-08 | fixed | The map names the quarter (LINE 41), draws the platforms, both tracks, the barrow crossing and the stairs, and marks the objective and the quarry. |
| FT-09 | fixed | Touch hints above the fold, a labelled dock (CASE, MAP, THINK, MENU), one-time tips for THINK and the CASE board. |
| FT-10 | fixed | The "asleep" shot is taken from across the avenue, outside every facade (0 of 64 frames inside a collider). |
| FT-11 | by design | Resuming at the quarter checkpoint stays the rule, but a load now puts Kai where the story last moved (the toy, the raincoat), not 110 m back. |
| FT-12 | fixed | A story line cuts a bark instead of queuing behind it, and a rule's lines cut off by a save are said again after the load. |
| FT-13 | fixed | Cell one sits on a 1.1 m cabinet, at chest height; its prompt shows at the default view. |
| FT-14 | fixed | PREVIOUSLY reads "Now Helix has gone dark" (recorded); no Chronolith drain or snap during an opening, a staged moment or a transition. |
| FT-15 | fixed | After the raincoat the objective is "Go in through the staff gate" with its because line; the gate has a lamp and a STAFF ENTRANCE sign. |
| FT-16 | fixed | YEAR is greyed with NOT YET until Kai holds the Chronolith. |
| FT-17 | fixed | The departures board is lettered and lit on its platform face: "LINE 41 - 08:14 - ARRIVING YESTERDAY". |
| FT-18 | fixed | Conversations frame whoever speaks, hide the HUD and use black bars; the ring reveal is shot from a side with nobody in it. |
| FT-19 | fixed | The case board opens on WHERE YOU ARE, THE QUESTIONS and EVIDENCE; TRAVEL is one line until a mission is done. |
| FT-20 | fixed | The prompt keeps its words while it fades; an empty "TAP ·" pill cannot show. |
| FT-21 | fixed | The edition's APK and preview carry their own description and title; game/index.html stays Station Zero's. |
| VX-01 | fixed | The stair is solid to the floor; there is no gap under it. |
| VX-02 | fixed | The chase waits until Kai is within 14 m and has a line of sight to her. |

### Acts I–II

| ID | Status | What changed |
| --- | --- | --- |
| F01 | fixed | Same root-cause fix as FT-03 plus rests per line and person. The M11 "Thirty-two isn't missing" repeats were REVERSE replaying the Odile echo, not a bark, and are unchanged. |
| F02 | fixed | The arm turns on a post between the counter and the stair, 2.3 m each way; Ezra, the counter and the cellar steps are out of its reach; the first hit is explained. v2.1.1: the toast's advice corrected (count two after an end passes, then follow it). Re-checked on the built preview. |
| F03 | fixed | M13's crossing is a stealth beat: a 1.9 m sandbag line with one gap and a sentry; a catch never counts as crossing. M10's escape is unchanged (its verifier found it already had teeth); M13's way round in 2026 costs stability by design. |
| F04 | fixed | Story lines Kai started keep new eyes off him while he stays within 4 m; no scene starts mid-chase ("NOT NOW"); the patrol walks 8.5 m from the spot. |
| F05 | fixed | A save inside a cold open replays the opening and puts every room back in its own year. |
| F06 | fixed | The charred file counts when watched in sight from within 8 m for 4 s; Sound captions are on by default in this edition. |
| F07 | fixed | The shell climbs home on camera, the hanging kitchen and the kneeling man are framed, Lin's file and lanyard and the lock's four bolts get close-ups, M6's three faces are shown one by one. v2.1.1: the lock's close-up no longer breaks in once a bolt has been tried. |
| F08 | fixed | REVERSE (and its label) act on a still tap; a drag that starts on them turns the view. |
| F09 | fixed | The place label names the quarter Kai is in. |
| F10 | fixed | The watchers' meter has an eye icon and a word (WATCHER NEAR, NOTICING YOU, SEEN) and sits under the minimap. |
| F11 | fixed | While a bolt backs out, the chip and label name that bolt. |
| F12 | fixed | "The guard turns her face to the light." (re-recorded). |
| F13 | fixed | The escapement's lines wait for the last clock's lines; the floorboard spots stop taking the deduction's focus once read. |
| F14 | fixed | Kai wakes at the blanket house's door, facing it; the cold open is at night; the talk camera frames the speaker; the prompt keeps clear of a toast. |
| F15 | fixed | M9's quay patrol walks east of the ferry steps; 200 s at the spawn with no catch. |
| F16 | fixed | Broad touching stones with round footings and a landing at each end; Rook's office is a room; echoes carry their person's textures. |
| F17 | fixed | The far bank differs by year (farm, ruin, flood); the gate channel has parapets and a stair out. The Chronolith's drain in other years is by design. |
| F18 | fixed | The trench gap is clear and lit; the raised bridge is barred and signed to the rail bridge; the quays are railed. |
| F19 | fixed | No warning for a model fetch the page itself cancels on reload; a real missing file still warns. |
| F20 | fixed | Not reproduced in the playtest; barks now wait for the voice pack, fades and transitions, and a line the packs cannot say is never shown. |
| X01 | fixed | The trapped people pace inside a lit lobby behind the frozen glass, and stand still while it is shown. |
| X02 | fixed | The top of the cellar steps is out of the arm's reach; a hit on the shop floor returns Kai by the counter. Re-checked on the built preview. |

### Acts III–IV, Finale, endings, CASE FILES, free roam

| ID | Status | What changed |
| --- | --- | --- |
| F01 | fixed | Title > CASE FILES > REPLAY or a FREE ROAM trip closes the ending menu before the game begins; the case and the trip play. Re-checked on the built preview. |
| F02 | fixed | A choice header is the node's own header or the last line actually said; a line whose condition failed is never used. |
| F03 | fixed | Same fix as FT-03, plus a line rests 4 minutes after it is heard and never comes twice in a row; no barks over a story line, cinema, menu or fade. |
| F04 | fixed | The hilltop is lit (braziers, lights, no black rock slabs) and the rings and chambers carry lit seams. The large faces stay dark at low quality; their outlines carry them. |
| F05 | fixed | Each choice plays its own staged beat with the HUD hidden before the ending shots. The shared epilogue lines and street are by design. |
| F06 | fixed | Past the fallen street a snap or a catch puts Kai at the seam; a save made past it loads where he stood (v2.1.1: that place had been lost to the seam checkpoint), an old save at the seam; THINK tells how to cross back. |
| F07 | fixed | Single-room missions name the current quarter. |
| F08 | not reproduced | Unchanged: its verifier could not reproduce the camera inside the school's awning. |
| F09 | fixed | A signed wading crossing in 2196 reaches the lift car without 2049; THINK names the route. |
| F10 | fixed | THE CASES and BACK TO THE TITLE are pinned at the ending card's foot, in view at 915x412 and upright. |
| F11 | fixed | REPLAY, tabs, year buttons, TRAVEL, BACK TO THE STORY and TRACK are at least 44 px tall. |
| F12 | fixed | The prompt acts on a still tap; a drag that starts on it turns the view. |
| F13 | fixed | A right pick chimes, shows "n / 4 in order" and reopens the next pick at once. |
| F14 | fixed | The objective sits on a dark plate with a haloed because line; calm mode keeps it at 0.85. |
| F15 | by design | Chapter-select facts give the Finale's empty payoffs; unchanged. |
| F16 | fixed | No bark during a fade, a transition or a pack reload; a line the active packs cannot say is never shown. |
| F17 | fixed | The painted hill crown that made the white bar is gone (the M18 bar was the old watcher meter, restyled). |
| F18 | fixed | "CASE 14 OF 14" and a voiced "Case fourteen."; the title button after REPLAY says what it starts. |
| F19 | partly | M21's tremors now cost a held gap 1.5 s and M18 has a patrol between the pylons, but the last battle is still lines and two gaps. |
| X1 | fixed | Same root cause as FT-03. |
| X2 | fixed | CONTINUE on a finished save opens the ending card (THE CASES, BACK TO THE TITLE); the slot names the ending. v2.1.1: only a Finale save counts as finished; a save of another chapter plays on. |
| X3 | fixed | Same fix as F02 (M10's prisoners, M21's soldier). |
| X4 | fixed | The lift car rests nearly level, 0.2 m above the sidewalk; Kai walks onto it. |

### Systems and phone ergonomics

| ID | Status | What changed |
| --- | --- | --- |
| SYS-01 | fixed | Static scenery skips the matrix pass, unseen people sleep, far walkers update every second frame: about 40-59% less CPU per frame at 4x throttle (not measured on a phone). |
| SYS-02 | fixed | Skeletons and props hung on people are released at a mission change; geometries and textures stay flat from the second lap. |
| SYS-03 | fixed | Same as FT-07. |
| SYS-04 | fixed | A compact landscape title: CONTINUE, NEW GAME, LOAD and SETTINGS all in view at 915x412; tall panels show a MORE cue. |
| SYS-05 | fixed | The prompt is clamped by its measured width and the safe areas; long labels wrap. |
| SYS-06 | fixed | The checkpoint change autosaves within 3 s, the app going to the background saves, and a load resumes where the story last moved. A manual SAVE GAME still stores the checkpoint (by design). |
| SYS-07 | fixed | Same as FT-04. |
| SYS-08 | fixed | Panel headers and their × stay pinned while scrolling; a tap outside a panel closes it. |
| SYS-09 | fixed | REVERSE is refused until the thread that teaches it, and its zone re-arms. |
| SYS-10 | fixed | The unlock toast says how (aim, tap REVERSE, tap RELEASE); the label says LIGHT or HEAVY, and HOLDING while held. |
| SYS-11 | fixed | Same as FT-16. |
| SYS-12 | fixed | The objective panel and the prompt clamp respect the left safe area. |
| SYS-13 | fixed | Dock buttons 56x48 and labelled, a column by the right thumb upright that acts on a tap (a drag looks); SKIP 96x48; REVERSE clear of the stick. |
| SYS-14 | by design | SKIP ends one line or shot; unchanged. |
| SYS-15 | fixed | Same as F10 (Acts I-II). |
| SYS-16 | fixed | THINK tiers from M5 on are sentences that go from a nudge to the place to the action (none of three words or fewer from M6 on); recorded. |
| SYS-17 | by design | Loading from the pause menu goes through the title; unchanged. |
| SYS-18 | fixed | A passer-by is not drawn within 1.3 m of the camera or while covering more than 8% of the view (an umbrella counted). |
| X-01 | fixed | The selected Sound captions option is dark with white text. |

## Appendix A: every finding and its verdict

Severity is the verifier's. Verdicts: confirmed, partly (real but narrower or milder than reported), not reproduced, by design, tester error. "Extra" rows were found by the verifier while reproducing.


### First-time player (title to Mission 4)

| ID | Severity | Verdict | Where | Finding |
| --- | --- | --- | --- | --- |
| FT-01 | blocker | confirmed | Mission 3 (m03), CONTROL room, objective 'Open the control room: the l | The causal anchor has no touch control (keyboard C only), so a phone player cannot carry the 2026 keycard to the 2049 lock and cannot finish the Prologue. |
| FT-02 | high | partly | Mission 2 (m02), PLANT TERRACE, objective 'Restore the lift: three cel | The gantry holding power cell 2 cannot be climbed: the stair's lower steps are inside the chiller tank. The first exposed step is 1.3 m (jump reaches about 1.15 m), and the cell is out of reach from the floor, so the lift cannot get its 3rd cell. |
| FT-03 | high | confirmed | All missions with walking crowds (seen in M1 Rain City and station, M2 | Passer-by remarks ignore distance: the bark check uses the shared vector _v after the path-walking code has overwritten it. Any walking NPC barks from anywhere, one remark every 9 s for the whole mission. |
| FT-04 | medium | confirmed | All missions, touch: the floating interaction prompt (e.g. M1 plaza cl | The prompt, the only touch target for interacting, is hidden whenever anyone is talking, including those passers-by. With FT-03 it is gone about half the time, and taps on things fail. |
| FT-05 | low | partly | Mission 1, LINE 41 platform, objective 'Follow the woman with Mira's f | The chase begins with Mira standing out of sight behind the train, reachable only round the platform's east end (about 45 m detour). THINK tier 1 says 'Keep her in sight' while she is not in sight. |
| FT-06 | medium | confirmed | Mission 1, LINE 41 (the Zero Second and the rescue) | The central set piece does not show what the narration says. The 41 sits intact beside the platform, the 'trapped' people stand upright next to Kai, and the crowd keeps chatting. |
| FT-07 | medium | partly | HUD, all missions (touch), CURRENT UNDERSTANDING block | The objective's 'because' line (10.5 px italic, no backing card on touch) is unreadable over bright window-lit backgrounds. The mission card also covers the objective when control returns. |
| FT-08 | low | partly | Mission 1 MAP (dock MAP / minimap), all quarters | The full map draws the whole of Mission 1 as one rectangle labelled HOME & MARKET, even at the station, with no objective, exit-route or station layout. It cannot help find the chase route or the staff gate. |
| FT-09 | medium | confirmed | Title screen and HUD dock (touch) | Onboarding of the controls is missing on phones. The title's touch hints are below the fold of the scrolling title panel. Dock buttons are unlabeled 44x38 px icons (CASE/MAP/THINK/MENU labels hidden), THINK is a stopwatch icon, and nothing in-game introduces THINK or the CASE board. |
| FT-10 | medium | confirmed | Prologue cold open, shot 'Kai Varen is asleep, four kilometres away... | The camera sits inside or behind a building facade. The frame is black with large floating cream window rectangles and the street visible through the wall. |
| FT-11 | low | by design | Save/CONTINUE in Missions 1-3 | CONTINUE puts Kai back at the quarter's checkpoint, not where he stopped. On a phone that is interrupted often this means re-walking long stretches, after a PREVIOUSLY card every time. |
| FT-12 | low | confirmed | Mission 1, TRANSIT PLAZA (Rook's call) after a reload | A story line queued behind a passer-by remark is lost if the game is closed and reopened before it plays. The rule's flag is already saved, so Rook's call never plays, yet the next objective's 'because' says 'Rook said come in now'. |
| FT-13 | low | confirmed | Mission 2, DARK CORRIDOR, cell one in the east alcove | The cell sits on a 2.4 m box, and its prompt appears only if the player tilts the view up. With the default view the prompt never showed in 3 attempts. |
| FT-14 | low | confirmed | Mission 2/3 PREVIOUSLY cards and the Act I opening | Continuity slips. The Mission 2 resume card says 'Tonight Helix has gone dark, and Kai Varen is inside it' although it is the morning after 8:14. Kai's stability-snap line 'The Chronolith let go of me. Back to the present, back to the last anchor.' plays inside the Act I chapter opening, between 'He fell.' and 'Act One.' |
| FT-15 | low | confirmed | Mission 1 end, staff gate | After the raincoat the objective becomes the generic 'The next door is open. Keep going.' with no 'because' line, and nothing in the world marks the gate except the minimap's purple dot. Waiting there does nothing until you walk into the gate. |
| FT-16 | low | confirmed | Missions 1-2 HUD | The largest button on screen, the orange YEAR, is shown from the first second, though it cannot be used until Mission 3. |
| FT-17 | low | partly | Mission 1, Line 41 canopy | The departures board the story hinges on ('the board says the 41 arrives yesterday') is an unlit black slab floating under the canopy, with no readable text. |
| FT-18 | polish | confirmed | Conversations and cinematic shots (M1 Pryce and Jun, M2 ring reveal) | Conversation framing often faces Kai with the speaker small behind him. Stick, YEAR and the objective stay over the letterboxed frame. Conversation letterbox bars are light grey while cinematics use black. A bald foreground head blocks the bottom of the ring reveal. |
| FT-19 | polish | confirmed | CASE board on phone | The CASE board opens on 'WHERE YOU ARE' and a 'TRAVEL / Free roam ... Finish a mission to travel back' paragraph. Evidence, side stories and questions need scrolling, which is confusing in Mission 1 when nothing can be travelled to yet. |
| FT-20 | polish | confirmed | Prompt pill, M4 village (and elsewhere when a line starts) | The prompt sometimes shows as 'TAP ·' with an empty label while fading. |
| FT-21 | polish | confirmed | Published index.html meta | The page's meta description still says 'a sci-fi thriller where you discover, test and rewrite the laws of the world'; laws were removed in v2.1. The page <title> is generic 'AFTERZERO'. |
| VX-01 | low | extra | Mission 2 (m02), PLANT TERRACE, gantry stair | The gantry stair is built from floating 0.3 m slabs with nothing under them. Kai can walk under its top steps into a sealed gap behind the stair and the chiller, and that gap is where the only working route up begins (see FT-02). |
| VX-02 | low | extra | Mission 1 (m01), LINE 41, chase start | The woman's chase starts as soon as Kai is within its 14 m leash, even when he is stuck on the track bed behind the train and cannot see her. She walks off down the north stair out of view, then waits. |

### Acts I–II (Missions 4–13)

| ID | Severity | Verdict | Where | Finding |
| --- | --- | --- | --- | --- |
| F01 | high | confirmed | game/js/world/DeckWorld.js NPC update (about lines 560-597); main.js s | Crowd barks fire at any distance and repeat a tiny pool every few seconds. While a bark shows, the TAP prompt is hidden. |
| F02 | high | confirmed | M6 oldtown, the brass arm (places/kits.js brassArm full bar; DeckWorld | The brass arm's full 14.4 m bar sweeps every point within 7.2 m of its pivot about every 2.85 s, covering Ezra, the ledger, echo26, the gauge, the cellar stair top and the gallery stair foot. Each hit silently sends Kai back to the cellar. |
| F03 | medium | partly | M13 thread 'cross' (act2.js, design minutes 6); M10 thread 'escape' | Stealth crossings complete in seconds with no patrol contact. |
| F04 | medium | confirmed | M13 quarter THE STABILIZER, frozen block spot (70,1.2,-59.5) | A patrol catches Kai while the frozen-block scene lines are still playing. |
| F05 | medium | confirmed | Runtime.js cold open (about 1151-1205): toYear(null) only runs in fini | A save taken during M12's 2196 cold open resumes gameplay in 2196 with the Chronolith draining, although the quarter is 'THE CHASE — 2049'. (Plausible; I reproduced it only with a helper save.) |
| F06 | low | partly | M11 REVERSE unlock (charredFile zone box [-1.5,-0.5,-1.9,1.7,3,1.9] se | REVERSE unlocks only when Kai walks within about 1.7 m of the charred file. Watching it from 3.8 m for 30 s does nothing. The music-box objective relies on sound, but sound captions are off by default. |
| F07 | medium | confirmed | M13 shells and frozen block; M11 lock and Ward 32; M6 clock faces | The big payoffs are caption-only or too small to see: the shell climbing home, the frozen floors and hanging kitchen, Lin's lanyard, file and photo, and the lock's four bolts. |
| F08 | low | partly | #lvRevBtn position (inversion.js CSS), about x 650-716 and y 312-378 C | The REVERSE button sits where a right-thumb look drag naturally starts. A drag that begins on it fires REVERSE and does not turn the camera. |
| F09 | low | confirmed | main.js:2462 hud.setState(..., room.name, ...). Open places use one ro | The top-left place label always shows the first quarter's name. |
| F10 | low | confirmed | #eye watchers' meter (Runtime.js 1855-1864, cinema.js lvnoeye) | The watcher meter is a plain white pill at top centre with no icon or label. It appears whenever a watcher is within 30 m. |
| F11 | low | confirmed | M11 lock, REVERSE chip (inversion.js target chip while active.lock) | While a bolt is backing out, the chip already names the next bolt. |
| F12 | low | confirmed | M10 Sera talk at the guard post | The narration says 'The guard lifts her visor.' but Sera has no helmet or visor. |
| F13 | low | confirmed | M6 clocks puzzle (act1.js HOURS/clockNode about 501-508) | The rule's success lines appear before 'KAI: Noon.' and the clock line. The boards_now prompt takes the deduce spot. |
| F14 | low | partly | M4 valley_upper | 'The house you woke in' is not marked. The map and minimap do not help find it. Kai stands between the camera and Niko or the Elder in talks. The cold open says night over a daylight scene. A toast overlaps the prompt. |
| F15 | low | confirmed | M9 Rain City North spawn (0,0.9,87) | A watcher catches Kai at the spawn while the objective is 'Watch the street through one reset'. |
| F16 | low | confirmed | M8 river and terrace | Rook's 'office' is an open terrace. Echoes of Lin and Ezra are plain white mannequins. The river stones between (1.6,-1,14.4) and the bank cause repeated falls. Drones cover the south bank approach. |
| F17 | low | confirmed | M5 valley_river | From the start view the three years look nearly the same. The gate channel trench traps Kai. In other years the Chronolith drains in about 35 s, which cuts exploration short. |
| F18 | low | confirmed | M13 warport: trench wall z 70-71.6 (gap at x -4..4) and dock channel z | The only routes (an 8 m gap in a long sandbag line, and the rail bridge east of the raised lift bridge) are not signposted. Heading straight for the next objective dumps Kai into the channel. |
| F19 | polish | confirmed | casting.js xbot entry ('Xbot.glb'); the preview ships Xbot.json | Every mission load logs 'warning: Character xbot could not load TypeError: Failed to fetch'. |
| F20 | polish | not reproduced | Voice pack loading at chapter start (act2) | The first crowd bark after a chapter load can play silent because the pack is still loading. |
| X01 | medium | extra | M13 THE STABILIZER quarter, frozen block street (warport.js:47-48 crow | The 'trapped' civilians of the frozen block pace on the open street in front of the frozen glass, not behind it. They are visible walking freely while the narration says 'Behind the frozen glass, every floor stopped halfway through something', and they share the street with the z=-60 patrol. |
| X02 | medium | extra | M6 oldtown, cellar steps to shop floor (spawn and checkpoint (9.8,-3.1 | The top of the cellar steps, the only way from the M6 spawn and checkpoint into the shop, lies inside the brass arm's 7.2 m sweep. Every return from a hit has to time the arm again on the stairs, before the game has introduced the arm. Hits also cut off Kai's 'cellar' line and leave no hint. (Supports F02; listed separately because it hits the very first objective.) |

### Acts III–IV, Finale, endings, CASE FILES, free roam

| ID | Severity | Verdict | Where | Finding |
| --- | --- | --- | --- | --- |
| F01 | blocker | confirmed | Title screen > NEW GAME > CASE FILES (after any ending): REPLAY of any | Starting a case replay or a free-roam trip from the title's CASE FILES leaves AZ.menu === 'ending' (overlay hidden). The case opening never advances and Kai cannot move; SKIP, the stick and pause do nothing. |
| F02 | medium | confirmed | M23 Finale, THE ORIGINAL CHRONOLITH, the ending choice | The choice header shows 'Orren's record: released. Fought over. A person.' to a player who never read Orren's record (ev_unwritten_record unset). The header takes the node's last line without checking its 'when' condition. |
| F03 | medium | confirmed | M14 (survivors), M15 (residents), M22 (commuters), M23 (commuters, the | Ambient crowd barks fire every 9 s from pools of 1-5 lines, without end. In M15 every resident says the one line 'Same bread as yesterday.', and in the Finale commuter barks keep playing on the hill and at the ending choice. |
| F04 | medium | partly | M21 summit (Chamber One rebuilt), M22 twin chamber and seals, M23 the  | The climactic places are built from flat pure-black untextured slabs, rings and blocks that read as missing materials. The final hilltop is a black silhouette in every shot, including the ending shots. |
| F05 | medium | partly | M23 ending choice and Endings A/B/C | The endings undersell the climax. The choice's spectacle is only narrated over the unchanged gameplay camera, with the HUD and the objective 'The next door is open. Keep going.' still up. All three endings reuse the same epilogue lines and the same dark Rain City street shots. |
| F06 | low | confirmed | M23 Finale, after the street that fell (save or quit before reaching t | A save taken after crossing the fallen street reloads Kai at the platform start, on the far side of the collapsed street. THINK only talks about the telling-stone, so nothing tells the player they must REVERSE the street themselves. The save was also taken in 2026 at low stability, so the Chronolith 'lets go' about 6 s after loading. |
| F07 | low | confirmed | Every single-room mission: M15, M19, M21, M22, M23 | The place name in the top-left badge is the room name, which is the first quarter's name, and it never changes as quarters advance. |
| F08 | low | not reproduced | M15, the school on the stadium rim (Tomas's desk) | Near Tomas's desk the third-person camera ends up inside the school's purple awning or wall: the screen turns solid purple or is mostly blocked. During 'One desk has a boy at it who is not quite there' Tomas is not in frame. |
| F09 | low | partly | M14 Welcome to 2196, thread 'Up to the bank's roof garden' | I could not work out how to reach the bank roof by input; the earlier attempt also failed. The 'fallen tower is a ramp' route was not walkable, and the lift car route needs about 110 m in 2049, where stability lasts about 22 s. |
| F10 | low | partly | Ending card (all endings) and title screen with a CONTINUE save, lands | The ending card shows only the top edge of THE CASES. BACK TO THE TITLE is off-screen. A tap on the button's centre hit the backdrop and did nothing. The title card hides most of NEW GAME and all of LOAD and SETTINGS until you scroll it. |
| F11 | low | confirmed | CASE FILES, FREE ROAM tab, case board TRAVEL, map TRAVEL button | Touch targets well under thumb size (CSS px): REPLAY 71x29, year buttons 49-51x24, map TRAVEL 71x25, BACK TO THE STORY 147x24. |
| F12 | low | confirmed | All missions: the floating TAP prompt (button#prompt data-act=use) | The floating prompt fires USE on touchstart and sits in the right-thumb look area, so a look-drag that starts on it triggers the interaction instead of turning the camera. |
| F13 | low | confirmed | M22 THE CHAIN WALL (playback ordering; the same pattern applies to oth | Each pick closes the menu. A correct pick gives no feedback (mute, no line), so the player has to guess it worked and tap the wall again, four times. |
| F14 | low | partly | M19 The Place Outside Time (white salt plain); partly M21 under a pale | The white HUD objective, the because-line and italic subtitles sit on a near-white world and are hard to read. |
| F15 | low | by design | M23 Finale (played from the Act IV chapter start) | On chapter-select facts the Finale road's payoffs mostly come out empty, so the 'people your choices changed' stretch shows almost no people. |
| F16 | low | confirmed | Free roam: BACK TO THE STORY (into the Finale) | The first crowd bark after returning from a trip has no voice plan (unvoiced), because it fires during the return fade while the chapter pack reloads. |
| F17 | polish | confirmed | M23 Finale sky over the hill (also seen over M18) | A flat white rectangle floats in the sky. It stays with the UI hidden, so it is a world object; it reads as a glitch rather than 'a hole in the sky'. |
| F18 | polish | partly | Case replay title card; title after REPLAY from the in-game CASE FILES | The card 'CASE FILES · CASE N' (the 14th letter) reads like a placeholder. After REPLAY reloads the page, the button that starts the case is labelled 'CONTINUE · Tap to enter'. |
| F19 | polish | partly | M21 The Last Battle of the Continuum; M18 hold | The 'last battle' is dialogue and two gaps, and the M18 patrol never caught Kai in a 2-minute hold. The threats feel nominal. |
| X1 | medium | extra | game/js/world/DeckWorld.js:562-601 (every mission with walking crowds: | The crowd bark 'in passing' distance check never works for walking NPCs. The distance vector d is the shared scratch vector _v, which the walk code overwrites with a unit-length direction before the bark test (d.length() < 5). So every walker barks from anywhere in the place, every 9 s. |
| X2 | medium | extra | Title > CONTINUE on a finished campaign (save written by the ending, e | After an ending, CONTINUE puts Kai back on the Finale hilltop with the stale objective 'The next door is open. Keep going.' and nothing to do. The ending card (the only in-game route to CASE FILES) never returns, so with F01 the case replays cannot be reached at all once the player leaves the ending card. |
| X3 | low | extra | act2.js ACT2[1].scenes.prisoners (M10) and act4.js ACT4[2].talks.soldi | Same defect as F02 in two more nodes: the choice header shows the node's last line even when its 'when' condition is false ('So is an old man. Elias Rook.' when rook_fate == "expose"; 'You freed the district. My people hate you for it. I don't, yet.' when faction == "unwritten"). |
| X4 | low | extra | M14 Welcome to 2196, the bank lift car at [-41.6,0.15,69.5] in 2196 | The fallen lift car cannot be walked onto; Kai is blocked at its edge and must JUMP to board it. Switching from 2049 to 2196 while standing on its spot pushes Kai to [-39.8,1,69.5]. The process hint says 'Stand in it, REVERSE it', and the bot teleports into the car. |

### Systems and phone ergonomics

| ID | Severity | Verdict | Where | Finding |
| --- | --- | --- | --- | --- |
| SYS-01 | medium | confirmed | M1 Rain City South avenue (crowd) and M14 drowned downtown, quality ME | On an emulated phone CPU (4x throttle), the CPU work of one frame alone is about 25–33 ms (p90 37–46 ms), capping a mid-range phone near 30–40 fps before any GPU work. About 45% of it is world-matrix updates. |
| SYS-02 | low | partly | Act I, Missions 4–8, one page over 20.6 minutes | three.js geometries and textures are not all released on mission change: the same mission holds about 35 more geometries and 40 more textures on each lap, while the JS heap levels off. |
| SYS-03 | medium | confirmed | Every mission, objective panel (top left, CURRENT UNDERSTANDING) | The objective's 'because' line (.lvwhy) is dark slate italic 10.5 px with no text shadow, over the 3D scene, so it is unreadable on most backgrounds. The lines around it are white with a dark halo. |
| SYS-04 | medium | confirmed | Title screen with a save, landscape phone 915x412 | With a save present, CONTINUE pushes NEW GAME to the bottom edge and LOAD GAME and SETTINGS off screen. Nothing shows that the card scrolls. |
| SYS-05 | medium | confirmed | Portrait 412x915, any interaction prompt (seen in M1) | The floating interaction prompt runs off the right edge in portrait. main.js placePrompt clamps its centre to [90, w-90], but prompts are 175–242 px wide (longer labels exist). |
| SYS-06 | low | partly | M1 HOME & MARKET → plaza; also any save, quit or reload | A reload, CONTINUE or manual SAVE GAME restores Kai to the last checkpoint, not where he stood. Before the current quarter's story threads are done, that checkpoint stays at the mission start, so you can lose minutes of walking. The slot just says 'Saved just now', and play time goes backwards. |
| SYS-07 | medium | confirmed | M1 avenue and plaza (crowded places) | The interaction prompt only shows while nobody is talking, so passers-by's barks and queued lines hide it. A tap aimed at it during a bark does nothing. |
| SYS-08 | low | confirmed | Settings (title and pause) and the case board, landscape phone | The close (×) button scrolls away with the panel's content. Tapping outside does not close it. Only the Android back key (Escape) does, so in a phone browser you must scroll back to the top to close. |
| SYS-09 | low | partly | M11 The Inverted Hospital, records annex (charred file) | REVERSE can be granted out of order. Reaching the charred file before the first quarter is finished triggers the unlock, because the zone and its rule ignore thread gating. The objective still says 'Sit with the boy on the bench' and the 'READ THE FILE' prompt is offered. |
| SYS-10 | low | confirmed | M11 REVERSE unlock and first hold | REVERSE's introduction never says how to use it (aim, tap REVERSE, tap RELEASE), and two different second counts appear at once: the charge chip and the object's hold time. |
| SYS-11 | low | confirmed | M1 (before the Chronolith), right thumb cluster | The YEAR button, the largest control on screen (96 px, lit orange), is fully active-looking in Mission 1 before Kai can change years. The first tap gives one line; later taps silently deny. |
| SYS-12 | low | confirmed | Landscape with a left-side cutout (safe-area-inset-left), all missions | The objective panel ignores safe-area-inset-left in landscape (CSS left: 16px), while the year panel, REVERSE chip and stick move with the inset. Its first characters sit under a left cutout. |
| SYS-13 | low | partly | Portrait 412x915 HUD; dock and SKIP everywhere | In portrait the dock (CASE, MAP, THINK, MENU) moves to the top centre, out of thumb reach. RELEASE/REVERSE sits 6 px from the stick ring. Dock buttons (44x38) and SKIP (79x28) are below a 48 dp touch target. |
| SYS-14 | polish | by design | Prologue opening and every cold open | SKIP only ends the current line or shot, by design. There is no skip-all, so the Prologue's opening needs 11 SKIP taps (51–64 s) even when the player skips everything, and every replay repeats it. |
| SYS-15 | polish | confirmed | M12 roofs (and any place with a patrol within 30 m) | The watchers' suspicion meter (#eye) appears as an empty white bar with no label at top centre whenever a patrol is within 30 m, and it is unclear what it is. |
| SYS-16 | polish | confirmed | THINK in M5, M8, M11, M12, M14 (M1's are good) | THINK hints in later missions are curt fragments that mostly restate the objective, so a stuck player gets little from the first two tiers. |
| SYS-17 | polish | by design | Pause → LOAD GAME (in game) | Loading a slot from the pause menu reloads the page to the title, which shows 'Tap to enter'. A second tap is needed to actually load. |
| SYS-18 | polish | confirmed | M1 Rain City South avenue | Crowd walkers pass through the camera, and a passer-by's head fills the bottom-left of the screen. |
| X-01 | low | extra | SETTINGS (from the title or pause), SOUND section, 'Sound captions' ro | The selected option of the edition's Sound captions toggle is white text on a 70% white background, so the chosen state (ON or OFF) is unreadable. Every other toggle shows its selection in dark ink. |

## Appendix B: scores per mission (1–5)

Each tester scored what they played: clarity, fun, visuals, audio. Minutes are game time from telemetry, inflated by the harness (see Method).

| Tester | Mission | Minutes | By input | Clarity | Fun | Visuals | Audio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| first-time | Title, settings, NEW GAME, Prologue card + cold open + Missi | 1.5 | yes | 4 | 3 | 3 | 5 |
| first-time | Mission 1 - The Last Normal Day (Rain City South, transit pl | 24.2 | yes | 3 | 4 | 3 | 3 |
| first-time | Mission 2 - Helix Goes Dark (Helix west wing, court, plant t | 24.1 | yes | 3 | 3 | 2 | 2 |
| first-time | Mission 3 - The First Switch (chamber, temporal lab, dig, ma | 8.6 | yes | 3 | 3 | 2 | 4 |
| first-time | Mission 4 - The Man from the Last Day (start only, THE FIRST | 1.6 | yes | 4 | 3 | 3 | 4 |
| acts-1-2 | M4 The Village That Knew His Face (valley_upper) | 35 | yes | 3 | 3 | 3 | 2 |
| acts-1-2 | M5 (valley_river, tower and gate) | 12 | yes | 2 | 2 | 3 | 3 |
| acts-1-2 | M6 The Clockmaker's House (oldtown) | 40 | yes | 3 | 2 | 2 | 3 |
| acts-1-2 | M7 | 4 | yes | 3 | 3 | 3 | 3 |
| acts-1-2 | M8 (river, Rook) | 30 | yes | 3 | 3 | 3 | 3 |
| acts-1-2 | M9 Nine Minutes to Zero (Rain City North) | 6 | yes | 3 | 2 | 4 | 3 |
| acts-1-2 | M10 Detention Block (dam) | 3 | yes | 3 | 3 | 2 | 2 |
| acts-1-2 | M11 Ward 32 (hospital) | 15 | yes | 4 | 3 | 2 | 3 |
| acts-1-2 | M12 The Man Behind the Glass (helix north) | 1 | no | 2 | 3 | 3 | 3 |
| acts-1-2 | M13 The Nine-Minute War (warport) | 22 | yes | 4 | 3 | 2 | 2 |
| acts-3-finale | M14 Welcome to 2196 (earlier sessions re-checked + my lift a | 14 | yes | 3 | 2 | 3 | 3 |
| acts-3-finale | M15 The City That Forgot Tomorrow (earlier full play re-chec | 27 | yes | 4 | 3 | 3 | 2 |
| acts-3-finale | M16 The Museum of Failed Worlds | 6 | yes | 4 | 3 | 3 | 4 |
| acts-3-finale | M18 The Fracture (earlier play re-checked) | 25 | yes | 3 | 3 | 2 | 3 |
| acts-3-finale | M19 The Place Outside Time | 7 | yes | 4 | 3 | 3 | 4 |
| acts-3-finale | M21 The Last Battle of the Continuum (earlier play + Mira an | 27 | yes | 4 | 3 | 2 | 3 |
| acts-3-finale | M22 The First Second | 14 | yes | 4 | 3 | 2 | 3 |
| acts-3-finale | M23 Finale: Afterzero | 26 | yes | 4 | 3 | 2 | 3 |
| acts-3-finale | Endings A, B, C, epilogue, post-credit | 9 | yes | 4 | 2 | 2 | 4 |
| acts-3-finale | CASE FILES and case replay (THE UNWRITTEN RECORD) | 8 | yes | 3 | 2 | 3 | 4 |
| acts-3-finale | Free roam TRAVEL | 5 | yes | 4 | 3 | 3 | 3 |
| systems | M1 The Last Normal Day (Rain City South avenue, plaza, check | 75 | yes | 4 | 3 | 3 | 4 |
| systems | M9 Nine Minutes to Zero (Rain City North) | 3 | yes | 3 | 3 | 3 | 4 |
| systems | M10 Enemies Who Remember (detention block in the dam) | 5 | no | 4 | 3 | 3 | 4 |
| systems | M11 The Inverted Hospital (atrium, courts, records) | 14 | yes | 3 | 3 | 3 | 4 |
| systems | M12 The Man Behind the Glass (Helix north wing roofs) | 8 | yes | 3 | 2 | 3 | 3 |
| systems | M14 Welcome to 2196 (drowned downtown) | 20 | yes | 3 | 3 | 4 | 4 |
| systems | M4-M8 Act I (soak: house, village, clockmaker, observatory,  | 20.6 | yes | 3 | 3 | 3 | 3 |
