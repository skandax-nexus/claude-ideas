# AFTERZERO: The Last Version of Earth v2.1.1: playtest report

Playtested 2026-10-28 (some sessions ran past midnight UTC into 2026-10-29) on the v2.1.1 build: commit 0f3dcc6, its
built web preview (published at [the preview](https://claude.ai/artifact/HsWBbg3ppPShrBPVPaBhaE)) and
`AFTERZERO-LastVersion-v2.1.1.apk`. The testers played the built preview (`android/build-lastversion/preview`, served
locally), which carries the same page and voice packs as the APK. The Station Zero edition was played in the same round:
[PLAYTEST-v1.1.1.md](../PLAYTEST-v1.1.1.md).

Nothing in the game was changed for this report.

## Method

- **Who played:** seven AI playtest agents, each with a slice of the game:
  - **Prologue:** a first-time player, cold, from the title to Mission 4's first objective. Portrait for the first
    15 minutes, then landscape. One campaign over 16 sessions, quitting and pressing CONTINUE 15 times.
  - **Act I:** Missions 4–8, from Title > NEW GAME > ACT I, carried by the game's own saves into Mission 9.
  - **Act II:** Missions 9–13, carried from a real v2.1 save of Act I (it loaded cleanly into v2.1.1).
  - **Act III:** Missions 14–18, from Title > NEW GAME > ACT III.
  - **Act IV and Finale:** Missions 19–23 and all three endings, from Title > NEW GAME > ACT IV.
  - **Post-game:** the ending card, CONTINUE after an ending, six CASE FILES replays, free roam to six places, save
    slots, and NEW GAME over a finished campaign.
  - **Robustness:** reloads, rotation, backgrounding and tap-spamming at awkward moments in every act, edge walks,
    settings at their extremes, a 30-minute memory soak, and CPU frame time.
- **How they played:** headless Chromium at phone size (915×412 landscape at 1.5×, touch, also 412×915 portrait in
  the Prologue and Robustness slices). All input was touch on the game's own controls: the stick, look drags, the tap
  prompt, YEAR, ANCHOR, REVERSE, JUMP, SKIP, the dock and the choice buttons. They read every line, used THINK at every
  tier, failed on purpose, and looked at their screenshots.
- **How much:** more than 180 browser sessions; about 900 minutes of game time (Appendix B); about 2,200 screenshots
  by the testers and about 300 by the verifiers.
- **Helpers:** to steer the thumbs, the testers read game state (positions, colliders, a path planner); nothing was
  teleported or set except where listed in Appendix B:
  - Act II: a chapter start for Mission 13 with its own facts, and one placement in Mission 12.
  - Act III: a chapter jump from Mission 16 to 17, and another into Mission 18.
  - Act IV: three facts set (the Mission 12 glazier for Mission 21, Mission 20's note for one payoff check, and
    Orren's record unset once to re-check v2.1's F02).
  - Robustness and Post-game: started from other testers' saves; the Robustness tester opened the pause menu by code
    four times.
  - Prologue: the settings tried by touch were put back by code before NEW GAME.
- **Re-checks:** each tester's report went to a separate verifier agent. The verifier re-ran every high and medium
  finding by touch where it could, checked the rest against screenshots, logs and code, set the severity it judged
  right, and logged problems it saw on the way ("extra" findings). Each verifier also re-checked a sample of the v2.1
  report's findings.
- **Totals:** 124 findings reported and 16 more found by the verifiers (140). 8 were tester error, 13 are by design,
  none failed to reproduce. The other 118 are 98 problems once the same problem seen by several testers is merged:
  **no blockers, 6 high, 23 medium, 45 low, 24 polish.** Appendix A has every finding, its verdict and the item it
  went into.

**Limits, which matter when reading this:**
- No real phone was used, and the APK was not installed.
- The software renderer drew about 3.5 frames per second. Most testers advanced the game clock in steps after the
  opening, with real touch input; three ran the game's own frame loop at wall-clock pace. Frame rate and input
  latency were not felt. CPU frame times are measured on an emulated phone (4× CPU throttle) with the draw call
  replaced, so they say nothing about the GPU.
- Voice was checked by signal (each line's clip planned and started, captions matching), not by ear. A line that
  started counts as voiced even if it was cut off: see M21.
- The stepped clock made a few artefacts. Screenshots taken inside a 0.4 s CSS fade looked like the HUD staying up.
  Falls looked far deeper than a player would see, because the setback waits on a wall-clock timer (an extra finding
  about the test tools, not the game: Appendix A, VX-LVP-01). The verifiers rejected these.

## Verdict

**What works:**
- **The v2.1 fixes hold.** Of the v2.1 report's 87 findings, 79 were re-checked: 70 hold, 7 partly, 2 regressed. The
  Prologue is finishable by touch, CASE FILES from the title work, and the crowd no longer talks over everything.
- **Voice and stability.** Every line the testers triggered was planned from the recorded packs: 288 in the Prologue
  slice, 638 in Act I, more than 330 in Act III, about 250 in Act IV. There were 0 misses and no speech-synthesis
  fallback. The only page errors in the whole round were one score bug (L45).
- **Phone robustness.** Backgrounding the app at any moment pauses, saves within a second and resumes cleanly.
  Reloads land in sensible places, double taps never double-fire, memory is flat over 30 minutes (heap 31–36 MB), and
  CPU frame time at 4× throttle is 3–4 ms (v2.1: 25–33 ms).
- **The year puzzles and REVERSE.** Mission 3's YEAR and ANCHOR teaching, Mission 6's clocks, Mission 11's lock,
  Mission 13's shells, and Mission 18's three-year hold are the high points. Choices visibly carry forward to the
  Finale.

**What doesn't:**
- **Holes and traps on the main path.** Four of the six highs are a floor that is not there or a stair that throws
  Kai back: Mission 12's court dome, Mission 10's hall stair, Mission 2's terrace stair and Mission 16's cave floors.
  A fifth is Mission 10's yard checkpoint, which catches Kai again and again. Three mediums are geometry faults of the
  same kind (Missions 3, 5 and 22).
- **Touch gaps.** A phone cannot pick a year directly, so Mission 5's village drowns Kai on every tap and Mission
  12's gangway drops him 13 m. A look-drag skips story lines. Comfort mode still flashes.
- **Stealth with no teeth.** Mission 10's escape, Mission 8's escape and the Finale's avenue are passed by walking
  straight, and Mission 9's clock B has no patrol at all. Mission 18's hold patrol, a v2.1.1 fix, never appears.
- **The end of the game is fragile.** The ending is saved as finished the moment the choice is tapped, so a phone
  that kills the app during the ending loses the rest of it. Case replays end under the thumb, cut off their own
  closing lines, and are forgotten by CASE FILES.
- **Some big moments are still told, not shown:** Mission 9's tower, Mission 14's cold open, Mission 15's desk, the 41
  in the Finale's field, and short endings.

**Average scores** across everything played (1–5): clarity 3.6, fun 3.1, visuals 3.0, audio 3.9 (v2.1: 3.4, 2.8,
2.7, 3.2; the slices differ, so the comparison is rough).

**Top five problems:** H1 to H5 below.

## Blockers

None. Every slice could be played on by touch. The worst traps (H1, H2, H6) have a way out, but the player is not
told it.

## High (verified)

**H1. Mission 12: the Helix court's glass dome is not solid, and there is a 25 m hole under it.** *(Robustness LB-01)*
- **Where:** M12 The Man Behind the Glass, the Helix court floor, 2049, threads "follow" and "corridor".
- **What happens:** the court's oculus is a glass dome and rim with no collider, over a 24.8 × 24.8 m hole cut out of
  the court and hidden by a painted stone disc. Walking north toward the objective, Kai sinks through the glass at
  z ≈ 11–12, falls into a void and is set back to (0, 0.9, 26). The verifier fell four times, three in a row.
- **Why it matters:** the game itself puts Kai there. When stability runs out on the 2026 gangway, the snap lands him
  on the court floor facing away, and walking off the roof onto the court costs nothing. THINK there only says to
  cross the gangway. Walking round the dome avoids it, so it is not a hard softlock, but the floor that looks solid
  lies in the marker's direction. The Act II tester also lost more than 10 minutes here.
- **Repro:** CONTINUE the Act II tester's save `m12-deck.json`. Follow the objective onto the 2026 gangway until the
  Chronolith lets go. From (0, 0.9, 26) push the stick north along x ≈ 0.
- **Cause:** `places/specs/helix.js:200` cuts the hole, `:203` draws the court stone over it, and `:209-213` give the
  dome, ribs and rim no collider. Nothing in M12 sits under the hole (killY −16).

**H2. Mission 10: the hall stair has a 1 m hole at its top and cannot be climbed.** *(Act II A2-03, raised from
medium)*
- **Where:** M10 Enemies Who Remember, the gallery's stair down into the turbine hall (x −38..−34, z 1..2), 2049.
- **What happens:** the gallery floor ends at z 1 and the first step starts at z 1.98. Going down, Kai drops 12 m to
  the hall floor. Going up, walking and running both fall back at z 1.3. Only a JUMP timed on the top step reaches the
  gallery.
- **Why it matters:** it is the only way from the hall back up, and M10's checkpoint boxes (M6) send Kai into the hall
  early.
- **Repro:** any M10 state on the gallery: walk to (−36, 0, −1.5) and push south. Up: from (−36, −11.15, 24) walk
  north.
- **Cause:** `archetypes.stair` puts the first step at z 1.98–2.58, while `dam.js` cuts the gallery floor at z 1.

**H3. Mission 10: the yard checkpoint sits on the trooper's patrol line, so catches chain.** *(Act II A2-01)*
- **Where:** M10, THE YARD quarter, the gorge floor, 2049.
- **What happens:** the respawn (0, −11.1, 36) is 2 m from the trooper's line. After a catch, the "they remember" step
  moves him to an end of his two-point path, which can be 6 m in front of the respawn, facing it. Standing still: 6
  catches in 60 s, three within 4 s, with about 1.3 s of control after each fade.
- **Why it matters:** a checkpoint that catches you again. The only escape is to run straight back into the hall door.
- **Repro:** CONTINUE the save `m11-start3.json` (M10, yard thread). Walk out of the hall's south door, get caught
  once, then stand still.
- **Cause:** `dam.js` gorgeFloor; `act2.js` m10Step moves each patrol along its path after a catch.

**H4. Mission 7: the astronomer's conversation drains the Chronolith and snaps Kai off the summit.** *(Act I A4,
raised from medium)*
- **Where:** M7 The Broken Observatory, the summit (about 72, 28, −78), THE FIRST SKY.
- **What happens:** the talk's eight voiced lines run about 47 s, while the Chronolith lasts about 22 s out of the home
  year and is not paused for conversations. It runs out during his fourth line. Kai is snapped to the ground anchor in
  2049 while the astronomer's reveal keeps playing. The next objective is back on the summit in 2196, so the whole
  climb has to be done again (nine stick legs). A CONTINUE goes to the lower ring, about 95 m away and 28 m down.
- **Why it matters:** it happens to every player who listens instead of skipping.
- **Repro:** M7 after the tin (save `m07e1.json`). Climb to the summit, tap YEAR twice (THE FIRST SKY), tap THE
  ASTRONOMER and let it play.
- **Cause:** `Runtime.js:2125-2130` pauses the drain for openings, cinemas, transitions and a mission's end, never for
  a conversation; snapBack (`:2310`) does not wait for the talk.

**H5. Mission 2: the stair from the plant terrace to the staff lounge throws Kai back every time.** *(Prologue DP-01)*
- **Where:** M2 Helix Goes Dark, PLANT TERRACE > STAFF LOUNGE stair (x −49.5..−46.5, z −28..−34.4), 2049, during
  "Find the officer whose statement is the truth".
- **What happens:** on the way down, a fall setback fires at y 1.49 while Kai is still on the stair, and he is back on
  the terrace with no toast or line. It happens every time, and the same in the other direction. The lounge is in
  plain view through the doorway. The only way in is back through the gallery and round Helix Court, and THINK does
  not say so.
- **Why it matters:** a first-time player could easily give up here.
- **Repro:** Mission 2 after the lift is powered (save `s11.json`). Walk to (−48, 5.35, −27), face south, push the
  stick.
- **Cause:** `Build.js` sets a room's fall height to its floor minus 3 m (1.5 for the terrace). The terrace room's
  bounds include the stair going down (`prologue.js:709`), so `main.js:2453` resets Kai below 1.5 m.

**H6. Mission 16: holes in the spiral's cave floors drop Kai 24 m into the rock.** *(Act III LV3-01, partly; its
verifier's VX-03)*
- **Where:** M16 The Museum of Failed Worlds, the spiral's caves: alcove 2 (the coat case, about 29, 12, −46) and
  alcove 1 (the first memory), 2196.
- **What happens:** each cave stands on a 6 × 6 m square collider that does not cover the rotated cave, and the
  visible floor has none. On the way to the coat case Kai fell to the pit floor (y −11.75) in 2 of 3 tester approaches
  and in 4 of 4 verifier approaches that crossed a hole. No setback fires (the fall height is below the hidden slab),
  so he stands in a dark void inside the level. The way out is an unhinted JUMP onto a floor edge, then a 2 m entry at
  the ramp's foot (about 25 s of input). A probe found holes in alcove 1 as well (7 of 132 points), not walked.
- **Why it matters:** a visible floor beside a story object gives way. The tester could not get back and had to jump
  chapters.
- **Repro:** M16 save `s25_m16.json` (Kai at alcove 2). Walk 4.7 m by stick to the right of the coat case
  (30.6, −46.8), or from the ramp at (28.8, −41.8) to (28.8, −44.6).
- **Cause:** `sinkhole.js` spiral(): one `P.col` square per cave, plus a visual-only `P.plane`.

## Medium (verified)

**Touch and controls**

**M1. A phone cannot pick a year directly, and YEAR only cycles forward.** *(Act I A1, lowered from high; Act II A2-05)*
- **Where:** places with three years, on touch. Seen in Mission 5's village (ABANDONED) and on Mission 12's 2026
  gangway.
- **What happens:** the year pips are plain spans with no handler (`HUD.js:149`), and YEAR only steps forward. To
  reach a year the player must pass through the one in between.
  - In M5's village, before the wall is braced, FLOODED drowns Kai. Each tap gives a white flash and a silent setback
    to the gate, and the year is back to ABANDONED (4 of 4 taps, 3 of 3 for the verifier).
  - On the M12 gangway, going from 2026 to 2049 passes 2196, which has neither gangway nor roof: Kai drops 13 m, even
    with a quick double tap.
- **Why it matters:** the drowning loop is never explained, and keyboard digits pick any year while a phone cannot.
  Nothing is blocked: nothing in M5's village needs another year, and from the meadow 15 m east the cycle reaches
  THRIVING.
- **Repro:** M5 save `m05d.json`: in the village at (−20, 2.9, −28), tap YEAR. M12 save `m12e1.json`: at the gangway's
  end in 2026, tap YEAR twice.

**M2. A look-drag during a staged moment skips the line being said.** *(Prologue DP-04)*
- **Where:** every staged moment and cold open.
- **What happens:** the skip fires on any touch outside a list of controls, and the list leaves out the look zone
  (`cinema.js:110-123`). The first touch of a look-drag skips the line and cuts its voice. In the Prologue, Kai's "She
  died twenty-three years ago. I was at the funeral. I was twelve." was on screen for 0.1 s.
- **Why it matters:** a player who turns the view, or is steering when a hook starts, silently loses story lines.
- **Repro:** fresh device, NEW GAME > Prologue, landscape. When "Rain City. 05:40." shows, drag a thumb across the
  right half.

**M3. Comfort mode does not stop flashes.** *(Robustness LB-03; its verifier's VLB-X2)*
- **Where:** SETTINGS > Comfort mode ("Steadier camera, no flashes"). Seen in Mission 14's flicker zone; by code also
  Mission 21's tremors, the Prologue, the Finale and every ending.
- **What happens:** with Comfort ON, M14's flicker zone still fired a flash. The flash function has no comfort check,
  and only the YEAR, ECHO and three other calls check it. Ungated: `act3.js:138`, `act4.js:478`, `prologue.js:476`
  (white 0.7), `:492` (red 0.75), `:983` (red 0.5), `:1311` (white 0.95), `finale.js:224` and `:249` (white 0.95),
  `Runtime.js:2811` (every ending, white 0.9).
- **Why it matters:** an accessibility promise is broken, with full-screen flashes up to 95% white.
- **Repro:** M14 save `s06_m14.json`. SETTINGS > Comfort mode ON. Walk from (13, −22) to (6, −10).

**Holes and routes**

**M4. Mission 3: the 2026 dig has no east wall, so Kai falls under the world.** *(Prologue DP-02)*
- **Where:** M3 The First Switch, THE DIG, 2026 (the pit in Helix Court, x 14..18, z 21..29).
- **What happens:** the pit floor ends at x 14 and the court's slab is above Kai's head, with no wall between. Walking
  east off the pit floor drops him under the court, and a setback returns him to the site hut after about 12 m of
  falling.
- **Why it matters:** the objective sends the player there, and it happened twice on an ordinary walk.
- **Repro:** M3 save `s14.json`. YEAR to 2026, walk down to the pit floor (4.2, −2.1, 21.5), push toward (18.2, 24).

**M5. Mission 5: the drained basin's rim is not solid.** *(Act I A2)*
- **Where:** M5 The Village That Never Existed, the drained basin (THE PRESSURE GATE), ABANDONED.
- **What happens:** the 2.5 m stone rims are visual only (`valley_river.js:69`), and the meadow has the basin cut out
  of it. At floor level Kai walks under the meadow and falls out of the world, and the setback puts him about 55 m
  away. A second hole is at the north-east corner (−30, −3.6, 32).
- **Why it matters:** the rim looks like a wall.
- **Repro:** late M5 save. Go down the basin stair at x −46 to (−60, 40) and hold the stick north.

**M6. Mission 10: checkpoint boxes ignore height.** *(Act II A2-02)*
- **Where:** M10, the turbine hall's roof by the flood pole (0 m), and the hall's north strip.
- **What happens:** a quarter with no checkpoint box gets a box from 12 m below to 30 m above (`places/index.js:77`).
  So THE TESTING CHAMBER quarter takes in the whole roof. Walking to the flood pole moves the checkpoint 12 m down into
  the hall and changes the place label. A catch there drops Kai into the hall among the chamber's troopers before the
  power is cut, and later loads resume there. The other way round, the hall's north strip sets the checkpoint back to
  the cell, 12 m up.
- **Why it matters:** with H2, once Kai is in the hall the way back up needs a timed jump. It also causes one of the
  far resumes in L8.
- **Repro:** M10 save `m10b3.json`. Walk to the roof by the flood pole (28, 16), read the checkpoint, get caught by the
  gallery watcher.

**M7. Mission 12: the way back up to the roofs is long, costly and not signposted.** *(Act II A2-04; Robustness
verifier VLB-X3)*
- **Where:** M12, THE RUIN quarter, thread "panes"; and the court floor after a snap.
- **What happens:** "panes" needs two of the roof glass (2049, 13.5 m up), the 2026 gangway's hoarding (13.5 m up) and
  his footsteps. A load or a snap leaves Kai on the ground. The only way up is the 2026 scaffold stair at the far
  south end, about 110 m in 2026. That climb used 67–82% of the stability, and reading the hoarding used the rest.
  THINK names the clues, never the way up. After a snap Kai stands on the court floor facing away, and THINK only says
  to cross the gangway.
- **Why it matters:** a draining backtrack, repeated after each load (L8), with H1's hole in the obvious direction.
- **Repro:** M12 save `m12-end4.json`. Walk to the scaffold's foot (0, 71) in 2049, YEAR to 2026, run up and along
  the gangway.

**M8. Mission 12: the court's watchers see and catch Kai 13.5 m above them.** *(Act II verifier VX-A2-01)*
- **Where:** M12, the court patrols, against Kai on the 2026 gangway and the roofs.
- **What happens:** M12's watchers have no floor height. They count as "on Kai's floor" at any height, look 2 m up
  under him, and measure the catch distance flat. The tester was caught on the gangway's end with only court watchers
  below, losing the costly climb of M7.
- **Why it matters:** an unfair catch right after the act's most expensive climb.
- **Repro:** M12 save `m12-end4.json`. Climb the 2026 scaffold and walk the gangway while the drone patrols x −20..20,
  z −32..−20 below.
- **Status:** found from code and the tester's log; the verifier's own two climbs did not meet the patrol.

**M9. Mission 22: the station platform's stair is buried in the platform.** *(Act IV N1)*
- **Where:** M22 The First Second, the station wedge (Line 41 platform), all years.
- **What happens:** two of the stair's three steps are inside the 1 m platform. The one that sticks out leaves a
  0.67 m rise, above the 0.35 m Kai can step. Pushing into it slides him along the platform face. Only stick forward
  plus JUMP gets him up, and THINK never mentions jumping. The microphone up there is required.
- **Why it matters:** the visible stair invites climbing and fails. A 1 m ledge is a jump many players will try.
- **Repro:** M22 save `s16_m23.json`. Walk to (30, −38.6) under the LINE 41 sign and push forward.
- **Cause:** `places/specs/firstsecond.js:163` (the platform) and `:165` (the stair).

**Stealth and threats**

**M10. Mission 10's escape is passed by walking straight (and Mission 13's crossing nearly so).** *(Act II A2-08,
partly)*
- **Where:** M10's escape (cell to guard post); M13's crossing (battlefield to the canyon gate).
- **What happens:** M10's escape was done in 4.4 s with zero suspicion at three different start times. In M13 a
  straight push slid along the sandbags into the gap unseen when the sentry's back was turned. Through the gap at
  three phases: one catch and two near-misses (the sentry sees 26° each side, 9 m).
- **Why it matters:** two beats called stealth have little or no threat. v2.1.1 left M10's escape unchanged because
  v2.1's verifier thought it had teeth; it does not.
- **Repro:** M10 save `m10-start3.json`, walk straight at the guard post (2, −8). M13, walk straight at the canyon gate
  (22, 10).

**M11. Mission 18: the hold's patrol never appears, so v2.1.1's fix for it does nothing.** *(Act III verifier VX-01)*
- **Where:** M18 The Fracture, THE COLLAPSING SKYSCRAPER, the stabilizer hold, all years.
- **What happens:** the scavenger patrol added between the pylons waits for the fact `m18_repair`, but nothing sets
  it: the repair cinema sets `t_m18_repair`. The patrol stays invisible at (−12, 0, 170). Standing on its line for
  8 s: no catch. Two full 120 s holds: 0 catches.
- **Why it matters:** the hold has no patrol threat, and the fix counted as done in v2.1.1 is dead.
- **Repro:** M18 save `pre_scav2.json`. Choose either answer, walk to the stabilizer (18, 170), stand at (−2, 168).
- **Cause:** `act3.js:1050` (the patrol's condition) against `:1106-1111` and `Threads.js` stage().

**M12. Mission 9: clock B's "patrol route" has no patrol.** *(Act II A2-06)*
- **Where:** M9 Nine Minutes to Zero, CLOCK B — THE ENEMY ROUTE (clock B at 70.5, 12, −22).
- **What happens:** the objective says "on the patrol's route. They walk past it every forty seconds", and THINK says
  "Wait until the patrol has passed". No patrol path comes within about 50 m. Brask's "I'll be looking the other way at
  clock B" has no counterpart either.
- **Why it matters:** the hints send the player to wait for a patrol that never comes.
- **Repro:** M9 save `m09b.json`. Read the order board, talk to Brask, go up to clock B, look for watchers.

**Clues**

**M13. The CASE board lists more than a hundred clues by their internal ids.** *(Act I A3; its verifier's X2)*
- **Where:** the CASE board's EVIDENCE list, Acts I to the Finale.
- **What happens:** 23 Act I clues show as ids ("picto fire", "frag door", "ezra26", "lin desk17") and are pinned
  without the PINNED TO THE CASE BOARD toast. By count in code, 14 of 28 Act II clues, 31 of 46 in Act III, 25 of 35
  in Act IV and all 16 in the Finale have no label either (seen in a browser for Act I only).
- **Why it matters:** the case board is a core tool, and it reads as a debug list.
- **Repro:** in M8 after Lin, tap CASE and scroll to EVIDENCE.
- **Cause:** `Runtime.js:2539` falls back to the id when a clue has no label; `:563` toasts only labelled clues.

**M14. Mission 4: the ash clue on the board points to the wrong answer.** *(Act I A6)*
- **Where:** M4 The Man from the Last Day, the first fire and the panels deduction.
- **What happens:** the pinned clue reads "The ash: cooking, feasting, nothing, cooking" (`Runtime.js:251`). The
  narration says "cooking, feasting, a black burn, and on top a hearth swept clean and cold", and the right answer is
  "Built, plenty, burned, left." The board's version drops the burn, which is what separates the right answer from a
  wrong one.
- **Why it matters:** a player who reads the board is pointed away from the answer. A wrong pick costs one line.
- **Repro:** M4, tap SIT AT THE FIRST FIRE and read the toast; open CASE; then PIECE IT TOGETHER.

**Staging**

**M15. Mission 9: the tower's payoff is captions over rooftops.** *(Act II A2-07)*
- **Where:** M9, THE CONTROL TOWER's gallery, LOOK ACROSS THE RIVER.
- **What happens:** the lines describe the chamber's skylight and a man turning the ring and looking up. The camera
  stays behind Kai facing the other way, on rooftops, with the full HUD. The scene has no staged view, and no chamber
  is built across the river.
- **Why it matters:** Mission 9's climax is told, not shown.
- **Repro:** M9 save `m10-start2.json`. Climb the mast's stair, tap LOOK ACROSS THE RIVER.

**M16. Mission 14: the cold open's classroom shot frames an empty plaza.** *(Act III LV3-03)*
- **Where:** M14 Welcome to 2196, the cold open's "Sera's school" shot.
- **What happens:** while Sera and the children recite Kai's name, the camera looks at the memorial. The three pupils
  stand behind the camera and Sera is 33 m away. The frame shows a black slab, a canopy edge and a brown block.
- **Why it matters:** the act's opening speakers are not on screen.
- **Repro:** Title > NEW GAME > ACT III, watch without SKIP.
- **Cause:** `act3.js:161`, a shot with no cast.

**M17. Mission 15: at Tomas's desk the camera clips into the hut, and Tomas stands inside Kai.** *(Act III LV3-02;
its verifier's VX-02)*
- **Where:** M15 The City That Forgot Tomorrow, the school on the stand's rim, A DESK (−70.1, 14.6, −2.5), 2196.
- **What happens:** facing the desk, as a player does, a purple hut roof fills about 70% of the frame and hides Kai.
  Tomas's hologram stands on the spot the desk is used from, so he is inside Kai while the narrator says "One desk has
  a boy at it who is not quite there." Other headings are clear, which is why v2.1 could not reproduce it.
- **Why it matters:** the scene's subject is never framed. This is v2.1's Acts III–IV F08, never fixed.
- **Repro:** M15 save `s13_m15.json`. Read THE REGISTER, walk to (−71, −3.5), face the desk, tap A DESK.

**M18. Mission 23: the 41 in the field does not read as the 41, and Mission 21's summit is near-black.** *(Act IV N3,
partly; its verifier's X1)*
- **Where:** M23 THE SETTLEMENT, AGAIN, the bus in the field (about 6, 0, 100); Mission 21's summit.
- **What happens:** the bus is a plain box with one window strip: near-black at 2049's dusk, a flat dark-teal wall in
  2196, with no doors though the fragment says "its doors open". Its "41 SOUTH SQUARE" sign is 2.6 cm inside the box,
  so no number shows. The roundhouses read as silhouettes, and M21's summit pedestal and slabs are near-black. (The
  M23 ring summit is now lit and textured; it reads black only when backlit.)
- **Why it matters:** the Finale road's central callback is a black slab.
- **Repro:** M23 save `s19_m23.json`. Walk to (7, 107.5) and look at the bus's end.
- **Cause:** `afterzero.js:126` (the bus) and `:129` (the sign at z 105.95, inside the box's face at z 106).

**Endings, CASE FILES and saves**

**M19. The ending is saved as finished the moment the choice is tapped.** *(Robustness LB-02; its verifier's VLB-X1)*
- **Where:** M23, the ending choice (any ending).
- **What happens:** the "ending" fact is set before the flash, the ending's cinema, the hold and the post-credit
  (`Runtime.js:2806`; about 90 s in all). The slot reads "ENDING A: THE FIXED WORLD" 2 s after the tap. If the app is
  killed, crashes or reloads during the ending, CONTINUE opens the ending card: the rest of the ending, the epilogue
  and the post-credit never play, and nothing offers to replay them.
- **Why it matters:** on a phone, a kill during a 90 s sequence is likely, and the payoff of the whole game is lost.
- **Repro:** M23 save `s21_m23_prechoice.json`. Tap the ring, choose "Destroy the Chronolith.", reload within 10 s,
  CONTINUE.

**M20. A case replay ends under the thumb, and the release tap goes to the title.** *(Post-game PG-01)*
- **Where:** CASE FILES replays; seen in case 12, THE NINTH MINUTE.
- **What happens:** the case resolves while REVERSE is still held. The CASE FILES card opens at once, with BACK TO
  THE TITLE (no confirm) 6 px below where RELEASE and YEAR were. The tap that releases REVERSE reloads to the title
  (2 of 2 runs, and again for the verifier).
- **Why it matters:** an unwanted exit that, with M22, also throws away the only moment the solved state is shown.
- **Repro:** finished save. THE CASES > REPLAY 12. Read the casing at the wagon in 2026, hold REVERSE on THE BURIAL
  until it resolves, tap where RELEASE was (683, 344).

**M21. Case replays cut off their own closing lines.** *(Post-game verifier X-1)*
- **Where:** case 12 THE NINTH MINUTE and case 10 THE NAMES BENEATH THE CITY; by code also case 4.
- **What happens:** a replay leaves for CASE FILES 1.2 s after its last thread is done (`cases.js:70`), and opening the
  menu stops the voice. In case 12, Sera's "Somebody with your name did." never plays and the narrator is cut 1.4 s
  in. In case 10, Kai's closing line is cut 1.3 s in.
- **Why it matters:** the reveal is each case's one payoff. The "0 misses" voice counts count lines started, not
  lines heard to the end.
- **Repro:** finished save. REPLAY 10, walk behind the falls, tap A NAME, A NAME, NINETEEN NAMES, and listen.

**M22. CASE FILES forget the replays you finished.** *(Post-game PG-02)*
- **Where:** CASE FILES, from the title and in game, after a case replay.
- **What happens:** right after a replay the case's row reads CONSEQUENCE OBSERVED or RESOLVED. After the next
  CONTINUE it reads NOT STARTED again. A replay writes only its own slot and carries its facts in session storage; the
  finished campaign's slot is never written (by design), and no record of replays is kept.
- **Why it matters:** a player replaying the stories they missed never sees them marked as done.
- **Repro:** finished save. REPLAY 12 and play it. Read row 12. BACK TO THE TITLE > CONTINUE > THE CASES, read again.

**M23. After a case replay, the FREE ROAM tab does nothing.** *(Post-game PG-03)*
- **Where:** the CASE FILES card at the end of a case replay > FREE ROAM.
- **What happens:** the tab lists six places with year buttons that look live. Each tap only plays a deny sound,
  because the travel list is empty while the chapter is "cases".
- **Why it matters:** dead buttons. The way round is BACK TO THE TITLE > CONTINUE > THE CASES > FREE ROAM.
- **Repro:** finished save. REPLAY 5, tap THE PHOTO BOOTH; on CASE FILES tap FREE ROAM, then any year.

## Low and polish (verified)

### Low

**Phone UI and controls**
- **L1. Settings toggles are 30 px tall.** *(Prologue DP-09, Robustness LB-09)* *Where:* SETTINGS, title and pause.
  *What:* ON/OFF and choice buttons are 40–86 × 30 px, sliders 32 px; in portrait the panel uses only the lower half.
  *Why:* below a 44–48 px thumb target (taps did land). *Repro:* open SETTINGS and measure.
- **L2. In portrait, a prompt for something high covers the objective.** *(Prologue DP-07)* *Where:* M1 at 412×915
  (the plaza clock, the pigeon). *What:* the prompt pill is drawn on the CURRENT UNDERSTANDING card. *Why:* it hides
  the objective. *Repro:* portrait, stand 4 m from the plaza clock facing it.
- **L3. In a paused cinematic, SKIP sits on top of QUIT TO TITLE.** *(Robustness LB-05)* *Where:* any cinematic or
  recap, paused with the back key. *What:* SKIP stays above the pause panel and covers QUIT's right end; a tap there
  skips the cinematic under the menu instead of quitting. *Why:* a tap does something other than what it shows.
  *Repro:* back key during a PREVIOUSLY recap, tap QUIT near its right end (844, 343).
- **L4. No on-screen pause during cinematics.** *(Robustness LB-06)* *Where:* every cinematic and opening. *What:* the
  dock is hidden and only SKIP shows; only the back key pauses. *Why:* a phone browser has no back key for this.
  *Repro:* during the Prologue's opening, tap where MENU would be.
- **L5. YEAR stays lit where the place has only one year.** *(Robustness LB-10)* *Where:* M6's cellar and shop.
  *What:* the YEAR button is orange; taps only buzz, with no line or toast. *Why:* looks usable, gives no reason.
  *Repro:* M6 save `m06-start3.json`, tap YEAR six times in the cellar.
- **L6. NEW GAME over a finished campaign hides its warning.** *(Post-game PG-07)* *Where:* CHOOSE A SAVE SLOT at
  915×412. *What:* "Tap again to replace this save with a new game" sits under the MORE fade, and the second tap
  replaces the only finished campaign with its CASE FILES and free roam; it does not say what is lost. *Why:* an easy
  way to lose the post-game. *Repro:* finished save in a slot; NEW GAME > Prologue; tap that slot once.
- **L7. CASE FILES show 3 of 14 rows, and year buttons come in different orders.** *(Post-game PG-08)* *Where:* CASE
  FILES and FREE ROAM tabs at 915×412. *What:* reaching cases 10–13 takes 2–7 drags; years are ordered differently per
  place and the place name repeats. *Why:* slow and reads as random. *Repro:* finished save > THE CASES > FREE ROAM.

**Saves and resume**
- **L8. Some loads resume far from where the story left Kai.** *(Act I A14, Act II A2-09)* *Where and what:*
  - M8: after the island drone catches Kai, CONTINUE puts him back inside the sealed cube (the last story move was
    there).
  - M10: after the escape, Sera and the flood pole, CONTINUE puts him in his cell, because the anchor is dropped when
    its checkpoint (M6's wrong box) differs from the saved position.
  - M12: after the 2026 gangway, CONTINUE puts him on the ground, so M7's climb repeats after each load.

  *Why:* minutes of re-walking. (Other far resumes were ruled by design: the anchor is used only in its own year,
  Act III LV3-14 and Act IV C3.) *Repro:* M10 save `m10a2.json`; M12 save `m12-end.json`.
- **L9. A save made in 2026 loads with the meter already draining.** *(Robustness LB-11)* *Where:* M12. *What:* the
  save loads in 2026 at stability 0.57, and the Chronolith lets go 10–13 s after the recap. *Why:* a forced snap
  right after loading. *Repro:* CONTINUE `m12-deck.json` and wait.
- **L10. Every load replays the chapter's recap.** *(Act II A2-20, confirmed low; the Act I verifier, A13, and the
  Robustness verifier, LB-07, ruled the same behaviour by design.)* *Where:* every CONTINUE in Acts I and II. *What:*
  PREVIOUSLY uses a mission's own recap only for the Prologue's missions, so every load, even mid-Mission 13, replays
  the act's opening three lines and needs three SKIP taps. *Why:* it never recaps where the story stands. DESIGN.md
  asks for a recap per chapter; per-mission recaps would be content to add. *Repro:* CONTINUE any Act II save.

**Falls, water and edges**
- **L11. Falls and drownings return Kai without a word.** *(Act III LV3-07, Act IV C5; also the Prologue's DP-03,
  otherwise tester error)* *Where:* M14's canals, M19's channel, M23's pit, M1's towpath. *What:* a fall setback is a
  blip and a fade, and only a catch says a line (once per save); "Too deep to wade" exists only as an optional THINK
  challenge. *Why:* the player is not told what went wrong. *Repro:* M14, step off the poled crossing (−8.5, 1, 69)
  toward (−41.6, 65.5).
- **L12. In Mission 14, deep water looks like the water you wade in.** *(Robustness LB-08)* *Where:* the flooded
  streets, 2196. *What:* 6 of 10 straight runs ended in the drowning volume, which looks the same as the wadeable
  sidewalks. *Why:* the setbacks feel arbitrary. *Repro:* M14 save `s06_m14.json`, run in straight lines.
- **L13. Mission 14's viaduct landing has an open edge.** *(Act III LV3-08)* *Where:* the top of the viaduct's south
  stair, 8 m up. *What:* no railing on its west and south sides; a 3 s push from (29, 8.85, 103) ends in the lagoon.
  *Why:* an 8 m drop on the arrival route. *Repro:* push west-southwest from (29, 103).
- **L14. Mission 3: falling into the hall in 2049 counts as crossing it.** *(Prologue DP-05)* *Where:* M3, the machine
  hall. *What:* running straight across in 2049, Kai lands on the pit's debris past the crossing line; "Across. In a
  year that has not happened yet." plays and the objective moves on, then he is set back (`prologue.js:1324` checks
  distance, not height). *Why:* the story says he crossed when he fell. No softlock: the plaque still needs 2196.
  *Repro:* M3 save `s14.json`, after the power, run across in 2049.
- **L15. Mission 10's yard trooper walks through the hall's glass wall.** *(Act II verifier VX-A2-02)* *Where:* M10,
  the hall's south windows. *What:* watchers move without collision, so a chase started at the door goes through the
  glass and catches Kai inside. *Why:* the glass blocks sight but not the trooper. *Repro:* M10 yard thread; walk out
  and back in so he chases; run east inside along the windows.

**Hints, prompts and feedback**
- **L16. Mission 6: THINK and Kai still give the arm advice that gets you hit.** *(Act I A8)* *Where:* M6, "Get past
  the arm". *What:* THINK's second tier and Kai's hit line say "Go when it has passed." while the corrected toast says
  to count two and follow it (`act1.js:490`, `:507`). *Why:* two pieces of advice at once, one wrong. *Repro:* THINK
  twice, then walk into the arm.
- **L17. Two hints name the wrong place.** *(Act II A2-18)* *Where and what:* M10's yard objective says "Down the
  spillway to Sera's skiff", but the spillway is walled off and the way out is the hall's south door. M11's THINK puts
  the charred file "in the annex", but it lies in the records hall. *Why:* hints that mislead. *Repro:* read them.
- **L18. "Not yet. Something here is unfinished." plays on the last objective's own spot.** *(Act I A9; the Act IV
  tester's C6 was the same line)* *Where:* M4's chamber, M7's summit, M8's terminal. *What:* the exit warning fires
  when the exit is reached with anything open, and in Act I the exit sits on the last objective. *Why:* it reads as if
  something elsewhere was missed, just as the player is about to finish. *Repro:* walk to the chamber in M4 before
  piecing the panels.
- **L19. Things already used keep their prompt.** *(Act II A2-21, Act III LV3-13)* *Where and what:* M9's transmitter
  keeps the focus at the mast's foot after the cut, ahead of the tower's spot; M10's 2049 switch repeats its line;
  M18's KNOCK spots replay their scene (five times in one session). *Why:* clutter and repeats. *Repro:* M18, knock at
  the water keepers twice.
- **L20. Some spots answer in years where their thing does not exist.** *(Act III LV3-06, Act I A18)* *Where and
  what:* M14's stacked stones are read in 2049 and 2026 over bare asphalt (the stones exist only in 2196); M8's "TAP ·
  THE VERSION TERMINAL" shows in 2026 over empty floor. *Why:* narration about things the player cannot see.
  *Repro:* M14 in 2049, walk to (24, 0.9, 4), tap STACKED STONES.
- **L21. Two talks start before their thread.** *(Act II A2-19)* *Where and what:* M10's looper answers LISTEN three
  times before his thread, then the fourth line hides; M11's TALK TO ODILE before her thread plays her echo's line
  instead of a greeting. *Why:* lines out of order. *Repro:* M10, reach the loop cells before the projector, tap
  LISTEN.
- **L22. Mission 19: the solved deduction takes the focus from Mira.** *(Act IV C4)* *Where:* M19, the five doors.
  *What:* its PIECE IT TOGETHER prompt stays 2.4 m from Mira and a tap reopens the solved question. *Why:* tapping Mira
  does the wrong thing. *Repro:* solve the deduction, walk to Mira at about (13, −83).
- **L23. Mission 20: each correct pick on THREE MEMORIES closes the board silently.** *(Act IV C7)* *Where:* M20's
  board. *What:* no chime or count; the player re-taps the board five times ("The next moment."). v2.1.1's fix for
  this (F13) covers M22's wall, not this board. *Why:* no feedback. *Repro:* M20, tap THREE MEMORIES, pick "The 41 is
  late."
- **L24. Mission 11: a held file shows no READ prompt until Kai steps close.** *(Act II A2-10)* *Where:* the charred
  file. *What:* held from 2.6 m, no prompt; it appears at about 1.5 m, while REVERSE reaches 14 m. *Why:* the hint says
  "hold REVERSE, then read it". *Repro:* M11, aim at the file from (−53, −18), REVERSE, wait.
- **L25. Mission 11: the lock's label does not follow the crosshair.** *(Act II A2-11)* *Where:* Ward 32's lock.
  *What:* the four bolts are 0.68 m apart; aimed at CRESCENT the label said BAR, and the tap moved CRESCENT. *Why:*
  the player cannot trust the label. *Repro:* stand 2.6 m from the door, aim at CRESCENT.
- **L26. REVERSE holds cost stability without saying so.** *(Act II A2-14)* *Where:* unstable places from M11.
  *What:* holding the tray took stability from 1.00 to 0.81 in 3 s; nothing mentions it, and a medium-weight thing
  shows neither LIGHT nor HEAVY. *Why:* a hidden cost. *Repro:* M11, hold the tray 3 s and watch the meter.
- **L27. Mission 11: the monitor's refusal contradicts its label.** *(Act II A2-13)* *Where:* the flatline monitor.
  *What:* "✕ NOT A PROCESS", then Kai: "Not a person. It won't take a person." *Why:* the rule and the line disagree.
  *Repro:* aim REVERSE at the monitor.
- **L28. Mission 14's map shows no water.** *(Act III LV3-09)* *Where:* M14's MAP. *What:* a grey block grid with no
  canals, wading strips, viaduct, stairs or crossing. *Why:* the level's puzzle is which strips can be walked.
  *Repro:* tap MAP in M14.

**Story and casting**
- **L29. Crowd remarks that break the story.** *(Prologue DP-08, Act II A2-16, Act III LV3-05)* *Where and what:*
  - M1: after the 41 crashes, a paramedic says "Third clock this morning. I stopped checking." (his role has no lines
    of its own, so it uses the commuters').
  - M9: Brask's signature line ("You did that already. No - you're about to do it...") is in the crowd's pool; an
    evacuee says it before Kai meets Brask.
  - M14: survivors say the gardener's payoff ("The channel is running again...") before the garden is restored.

  *Why:* each undercuts a moment. *Repro:* stand about 45 s at M9's spawn.
- **L30. Mission 13: "REVERSE holds for ten seconds now." interrupts the act's main choice.** *(Act II A2-17)* *What:*
  it fires as the choice raises the cap, before Kai's own line. *Repro:* choose "Redirect it. Free the people."
- **L31. Mission 18: the scavenger choice changes nothing in the hold if the city was freed.** *(Act III LV3-11)*
  *What:* both answers give the same drift and the same closing line, so Sera's "Every cell he takes, the pylons
  drift faster" is untrue. (The patrol is missing too: M11.) *Why:* a choice with no effect. *Repro:* free the city in
  M15; in M18 choose each answer from `pre_scav2.json` and hold.
- **L32. Niko reads as a woman.** *(Act I A11)* *Where:* M4, M5, M7. *What:* written and voiced as a young man, he
  wears an ankle-length skirt and long tied hair; at phone distance the silhouette reads as a woman in a long dress.
  *Why:* it undercuts the character. *Repro:* talk to Niko at M4's water steps.
- **L33. Old Niko is only a silhouette.** *(Act I A12)* *Where:* M7's cold open. *What:* the act's one view of Niko
  aged is a 30 px backlit figure, indistinguishable from the astronomer. *Why:* the reveal cannot be read. *Repro:*
  watch the M7 cold open.

**Pacing and staging**
- **L34. Mission 8's stealth escape can be done entirely in 2026.** *(Act I A7)* *What:* the escape completes on
  reaching the terminal in any year, and 2026 has no drone. *Why:* the stealth beat is skipped. *Repro:* after Lin,
  YEAR to 2026, walk to the terminal (3.6, 11).
- **L35. The Finale's opening avenue has no threat, then a silent catch.** *(Act IV N6; its verifier's X2)* *What:*
  walking straight down the avenue finishes the stealth thread in 5–18 s. But a player who stands to listen to the
  Witness's three lines that start at once is caught about 7 s later and walked back to the platform, with no line,
  while the objective already reads "Over the street that fell". *Why:* no tension, then an unfair penalty. *Repro:*
  M23 save `s18_m23.json`, after THE 41, walk north to (0, 141) and stand.
- **L36. Mission 18's slab stair holds about 5 s.** *(Act III LV3-12)* *What:* the charge falls from 12 to 2.8 in about
  3 s; waiting 1–3 s after REVERSE drops Kai 6 m, and THINK does not say to run at once. *Why:* a fail that feels
  like a trick. *Repro:* M18 save `s22_m18.json`, REVERSE the slabs, wait 2 s, walk.
- **L37. Mission 9: two objectives of standing still, and blank clocks.** *(Act II A2-15)* *What:* the first two
  objectives are 75–90 s each of watching a reset, with no visible clock (the label stays "2049 · 08:05"); clocks A–C
  are blank discs. *Why:* a slow start. *Repro:* stand at M9's spawn.
- **L38. Mission 7: the astronomer's reveal is not staged as a conversation.** *(Act I verifier X1)* *What:* no
  letterbox, the full HUD, and the astronomer stands behind Kai, unseen during his own reveal. *Why:* the act's best
  monologue has no face. *Repro:* as H4.
- **L39. Mission 8: the reconstruction's payoff uses the play camera.** *(Act I A5, partly)* *What:* the two echoes
  are on screen but small and walking away; "a man turns the ring" is told, not shown. (They are not off-camera, as
  reported.) *Repro:* M8, RECONSTRUCT THE MORNING.
- **L40. The endings are short and mostly narration over held shots.** *(Act IV N4, partly)* *What:* each runs 47–65 s
  from the tap to the card. Each has its own staged beat and shots, so v2.1's fix holds, and the shared epilogue
  lines are by design. What remains is length. *Repro:* pick each ending from `s21_m23_prechoice.json`.
- **L41. Case replays are thin and end abruptly.** *(Post-game PG-05)* *What:* each was 45–90 s of play: one walk and
  one to three taps. Then CASE FILES snap open at row 1, the case's own row off screen, and the payoff is only narrated
  (the garden never runs with water). *Why:* the post-game feels slight. *Repro:* play case 13.

**Visuals**
- **L42. Mission 3: the lab barely changes between years.** *(Prologue DP-10)* *What:* from the default view the three
  years share walls and console; only the floor tint changes. The "2026 frame" is visible only facing the south wall.
  *Repro:* M3, tap YEAR through the years without turning.
- **L43. Mission 1: the view goes black by the fire escape.** *(Prologue DP-11)* *What:* at (47.7, −98) or
  (44.9, −77.5) the frame is black with the HUD, probably the camera inside the iron back plate (not verified).
  *Repro:* stop at one of those points.
- **L44. Mission 7 in 2049 is near-black.** *(Act I A15)* *What:* Niko 1.6 m away and the scavengers' camp, a stealth
  beat, are barely visible. (Seen at low quality only.) *Repro:* start M7 and look east of the instrument stair.

**Audio**
- **L45. A score bug throws page errors in Act IV.** *(Act IV C1, Robustness LB-04, Post-game PG-13)* *Where:* the Act
  IV theme (M19, M22 and their free roam, in 2026 and 2196). *What:* on a one-note chord the glass voice reads a note
  that is not there (`score.js:770`, `themes.js:131`) and throws. *Why:* a lost note each time, and the only page
  errors of the round. *Repro:* free roam to M22 in 2026 and walk for 2–3 minutes with the console open.

### Polish

- **P1. An empty grey pill sits at the top-left** in Missions 1–2 when there is no year to show. *(Prologue DP-12)*
  Repro: any moment in M1.
- **P2. The dock stays faintly visible over conversations** (at 0.2, from `style.css:305`), and its labels are low
  contrast over bright facades. *(Prologue DP-13)* Repro: talk to the florist.
- **P3. The Prologue card plays over Kai standing at his door at night,** seconds before the cold open says he is
  asleep four kilometres away. *(Prologue DP-14)* Repro: NEW GAME > Prologue.
- **P4. Some THINK tiers are still fragments:** M4 ("Whose blanket?", "A log stair."), M9 (Brask, the warning), M10
  ("Out of the cell."), M11's process hints ("The tray fell."). *(Act I A20, Act II A2-23)* Repro: THINK three times
  on those threads.
- **P5. Mission 6's 2026 and 2049 clocks are plain brass discs.** *(Act I A21)* Repro: the clock room in 2026.
- **P6. Mission 4's first fire is a flat orange pyramid.** *(Act I verifier X3)* Repro: the fire pit by the girl.
- **P7. Key objects look like placeholders:** M13's shells are flat white discs, Sera has a flat black square on her
  chest, M11's lock is a blue slab with four dots. *(Act II A2-24)*
- **P8. Mission 4's cistern:** Kai stands waist-deep inside the stone, and its top reads as cobbles. *(Act I A19)*
- **P9. Mission 14's roof garden** has an untextured cone tree, and its "weather station" is a small green box.
  *(Act III LV3-16)*
- **P10. A pure-black wall face** in the Finale's opening streets around (−40, 133). *(Robustness LB-20)*
- **P11. Invisible walls on open ground** at place edges: the M23 summit (x 49.7) and streets (x −49.7), M18's east edge
  over a pink void, M4's empty outer ring. *(Act IV N7, Robustness LB-17)*
- **P12. Two prompt pills stack** where a thing sits on a REVERSE process (M16's coat case, M17's shredded sheet).
  *(Act III LV3-15)*
- **P13. On touch, the because line is cut at two lines,** mid-word ("the Director's de..."). *(Robustness LB-15)*
- **P14. A double tap on CASE opens the board and closes it again.** *(Robustness LB-14)*
- **P15. ANCHOR with empty hands queues one line per press** (keyboard and pad only; the touch button appears only while
  carrying). *(Robustness LB-16)*
- **P16. The ending options are tagged CHALLENGE, INVESTIGATE and COMFORT,** not with what each ending is, and the
  header shows only the last narration line. *(Robustness LB-18)*
- **P17. The florist can be drawn 0.54 m from the camera;** v2.1.1's camera rule covers passers-by only. *(Robustness
  LB-19)*
- **P18. Ending A:** during "Kai Varen looks up at the board, and smiles at it." the board is not in the frame.
  *(Act IV verifier X3)*
- **P19. After an ending, trips still say "The story waits where you left it",** and BACK TO THE STORY returns to CASE
  FILES. *(Post-game PG-09, partly)*
- **P20. The ending card shows no FINALE time** (the Finale's time is never stored). *(Post-game PG-10)*
- **P21. Mission 14's gardener:** "Dry since before my mother..." / Kai: "I can." answers a question nobody asked.
  *(Post-game PG-11)*
- **P22. Orren still asks "Do you want the costs before you choose?"** in free roam after the ending. His hologram look
  is by design. *(Post-game PG-12, partly; Act IV C2 by design)*
- **P23. Mission 21's first quarter is named "THE ALLY / ARRIVAL".** *(Act IV C8)*
- **P24. Mission 6 may be short:** 12.5 game minutes against a 26-minute design, but measured by a script that knew
  every target. *(Act I A16, partly)*

## Regression check of the v2.1 findings

**79 of the 87 v2.1 findings were re-checked: 70 hold, 7 hold only partly, 2 regressed, 8 were not checked.** The
testers re-checked them in their slices, and the verifiers re-ran 32 of them themselves. The verifiers upheld every
"holds", turned seven of the testers' "partly" into "holds" (SYS-07, Acts I–II F01, F14, F16, F17 and X01, Acts
III–IV F05), and found one "partly" to be a regression (Acts III–IV F19). The results below are the verifiers' where
they re-ran a finding, the testers' otherwise.

| v2.1 group | Re-checked | Hold | Partly | Regressed | Not checked |
| --- | --- | --- | --- | --- | --- |
| First-time player (23) | 22 | 20 | 2 | 0 | FT-12 |
| Acts I–II (22) | 19 | 17 | 2 | 0 | F05, F08, F18 |
| Acts III–IV, Finale, CASE FILES, free roam (23) | 20 | 17 | 1 | 2 | F12, F15, F16 |
| Systems and phone ergonomics (19) | 18 | 16 | 2 | 0 | SYS-14 |
| **All (87)** | **79** | **70** | **7** | **2** | **8** |

**Regressed (the verifier's verdict):**
- **Acts III–IV F08, Mission 15's camera at Tomas's desk: regressed.** It now reproduces. It was never fixed: v2.1.1
  listed it as "not reproduced", because it depends on which way Kai faces. See M17.
- **Acts III–IV F19, the threats of Missions 18 and 21: regressed** (the Act III verifier; the Act IV verifier says
  partly for Mission 21). The patrol v2.1.1 added to Mission 18's hold never appears, because its fact is never set
  (M11). Mission 21's battle is still lines and two gaps, as v2.1.1 said.

**Partly (the verifier's verdict):**
- **FT-06, the Zero Second:** the 41 and the wreck are shown, but the pinned woman and the man in the door are small
  dark shapes in the play view, partly behind Kai.
- **FT-18, conversations:** framing, black bars and the hidden HUD work. The dock stays at 0.2 (P2), and the rescue's
  lines play over the full HUD. (The Act I and Act II verifiers found it holds: their testers' "HUD still up" came from
  screenshots inside the fade.)
- **Acts I–II F03, stealth crossings:** Mission 13 now has a real sandbag line; Mission 10's escape is still trivial
  (M10).
- **Acts I–II F07, Act II's payoffs:** the staged views exist, but the lock is still a slab and the shells are discs
  (P7), and Mission 9's tower is unstaged (M15).
- **Acts III–IV F04, dark climax places:** the Finale's ring summit is now lit and textured; the 41 in the field, the
  roundhouses and Mission 21's summit are still near-black (M18).
- **SYS-06, resume where the story last moved:** right in Missions 9, 11, 15 and 16; in Missions 10 and 12 the anchor
  is dropped when the checkpoint box and the spawn disagree (L8).
- **SYS-16, THINK in sentences:** Missions 11–13 are; Missions 4, 9 and 10 still have fragments (P4).

**Hold:**
- First-time player: FT-01, FT-02, FT-03, FT-04, FT-05, FT-07, FT-08, FT-09, FT-10, FT-11, FT-13, FT-14, FT-15, FT-16,
  FT-17, FT-19, FT-20, FT-21, VX-01, VX-02.
- Acts I–II: F01, F02, F04, F06, F09, F10, F11, F12, F13, F14, F15, F16, F17, F19, F20, X01, X02.
- Acts III–IV: F01, F02, F03, F05, F06, F07, F09, F10, F11, F13, F14, F17, F18, X1, X2, X3 (Mission 10's header;
  Mission 21's was not reached), X4.
- Systems: SYS-01, SYS-02, SYS-03, SYS-04, SYS-05, SYS-07, SYS-08, SYS-09, SYS-10, SYS-11, SYS-12, SYS-13, SYS-15,
  SYS-17, SYS-18, X-01.

**Notes on the holds:**
- **The two v2.1 blockers are fixed:** Mission 3's ANCHOR by touch (the toast, the glowing button, the lock accepting
  the card), and CASE FILES and free roam from the title.
- **The crowd fix holds:** about one remark in 30 s from beside Kai. The prompt showed in 180 of 180 samples with a
  remark up, and a tap on it acted (FT-04, SYS-07).
- **Mission 6's arm** is fair: following the toast crossed with 0 hits on the first try. But two of its lines still
  give the old advice (L16).
- **Mission 5's drain** is about 22 s; that is the same code as v2.1, not a regression.
- **Performance and memory:** CPU 3–4 ms a frame at 4× throttle (v2.1: 25–33 ms). Geometries and textures are flat
  from the second visit.

## What the testers liked

- **Voice.** Every line was voiced from the packs: 288 in the Prologue slice, 638 in Act I, more than 330 in Act III,
  about 250 in Act IV, with captions always matching. The first tap starts the sound under Chrome's real autoplay
  rules.
- **THINK.** It is the best onboarding device: three graded tiers ("Three wrong things is not weather" > "Which way are
  they all going?" > "Piece it together at the plaza clock"). The CASE and THINK tips arrive at the right moment on a
  fresh device.
- **Mission 3 teaches YEAR and ANCHOR superbly:** a coloured YEAR button, year pips, a CHRONOLITH DRAINING status, and
  the "Tap ANCHOR first, then YEAR" toast with a glowing button. The cross-year cable and keycard puzzles are fair and
  satisfying.
- **Year-split puzzles that make the Chronolith mean something:**
  - turning the river at its head in THRIVING (M5);
  - three clocks set by year and hour, and the 2026 servants' stair (M6);
  - the empty rack in 2049 against the 2026 server, and stepping out of the cube through 2026 (M8);
  - the shells reversing into their own guns (M13: "Nobody started it. It keeps starting.");
  - the lift-car ride (M14) and the three-year pylon hold (M18).
- **REVERSE is taught well in Mission 11.** The Ward 32 lock is a fair three-clue puzzle with a wrong-bolt jam.
- **Choices carry forward:**
  - the M5 mural shows what Kai told Niko in M4;
  - Rook says the ring was "dug out from under a cairn";
  - the M9 warning brings the listeners to M13, and the M10 release brings the freed prisoner;
  - the Finale's memorial, Mira's line, the glazier holding the gap, and the ally on the ending card.
- **Fair, quick failure:**
  - a wrong deduction is answered with a reason;
  - "ACCESS DENIED. ALERT." and Kai's explanation;
  - the drones' "It only watches the floor in front of it.";
  - "Off the count. With her, this time."
- **The writing:**
  - Mission 2's Lin with no shadow and the edited door log;
  - Ezra's "Fifty years of Tuesdays";
  - the astronomer's woman with no shadow, and Mira's tape;
  - Mara's guest book and the "INSTALLED: K. VAREN... VERSION 9" plate;
  - the Witness's "Because nobody fixed it.", and Mira's "Ask me".
- **Robustness:** background, reload, double taps, rotation and portrait were all handled cleanly. Memory is flat and
  CPU time is a tenth of v2.1's.
- **The post-game's title button** says exactly what it starts ("REPLAY · Case 13 of 14 · THE SURVIVOR'S GARDEN").
  CONTINUE on a finished save returns to the ending card.
- **Casting:** the settlement is period-correct, and the Elder, Ezra, Brask, Rhea and Sera fit their roles.

## Not covered

- **Story content not reached or not finished by input:**
  - M1's side story "Last Train Home", M3's Iven route, and the roof terrace in M1;
  - M12 from the "panes" clue to its end (the roof glass, the camp, his stair, the beam, the voicemail, the ring);
  - M16's comparison thread to its end, its deduction, the photograph choice and case 41;
  - most memory fragments in M5–M7 (the testers' path-finding);
  - M14's three memorial side stories, M17's two side stories, and M18's kiln and THE LAST SIGNAL;
  - M8's officer side, which needs Prologue facts;
  - case 11 (not finished by the tester), and cases 3, 4, 6 and 7 (not played).
- **Choices:** mostly one branch each. The M20 note and M22 "leave it blank" payoffs were seen through a set fact, and
  Mission 13 from a chapter start.
- **v2.1 checks not repeated:** FT-12, Acts I–II F05, F08 and F18, Acts III–IV F12, F15 and F16, SYS-14.
- **Settings and layouts:** portrait only in the Prologue and Robustness slices. Medium and high quality mostly not:
  the Act I runs forced low.
- **Not done anywhere:** a real phone, the APK installed, the Android back button inside the APK, iOS, real GPU frame
  times, listening by ear, and a human player.

Evidence: `deep/` in the session's scratch space, one folder per tester (`lv-prologue`, `lv-act1`, `lv-act2`,
`lv-act3`, `lv-act4-finale`, `lv-postgame`, `lv-breaker`) and one per verifier (`verify-<slice>`): notes, logs,
screenshots, contact sheets and the saves named in the repros.

## Appendix A: every finding and its verdict

Severity is the verifier's; the tester's is in brackets where it differs. Verdicts: confirmed, partly (real but
narrower or milder than reported), by design, tester error, extra (found by the verifier). "Item" is the merged problem
above; "—" means none.

### Prologue tester (Missions 1–4, first-time player)

| ID | Severity | Verdict | Item | Where | Finding |
| --- | --- | --- | --- | --- | --- |
| DP-01 | high | confirmed | H5 | M2, plant terrace to staff lounge stair | The stair silently throws Kai back to the terrace every time; the only way in is round Helix Court, unhinted. |
| DP-02 | medium | confirmed | M4 | M3, the 2026 dig | No east wall to the pit: walking east drops Kai under the court and out of the world. |
| DP-03 | polish (medium) | tester error | see L11 | M1, the canal by the towpath | "Falls through the water into a void": at real pace a short drop and reset; the void was the setback's white fade. Left: no splash or line. |
| DP-04 | medium | confirmed | M2 | All staged moments | A look-drag skips the line being said, as a tap does. |
| DP-05 | low | confirmed | L14 | M3, machine hall, 2049 | Falling into the pit counts as crossing the hall. |
| DP-06 | polish (low) | tester error | — | M1 start, CONTINUE after the opening | CONTINUE replays the opening only when the page dies without going hidden (the harness's quit); a phone that leaves the app gets the short card. |
| DP-07 | low | confirmed | L2 | M1, portrait | A prompt for a high target covers the objective card. |
| DP-08 | low | confirmed | L29 | M1, after the Zero Second | A paramedic says a commuter's line at the wreck. |
| DP-09 | low | confirmed | L1 | SETTINGS, portrait | Toggles are 30 px tall; the panel uses only the lower half. |
| DP-10 | low | confirmed | L42 | M3, temporal lab | The lab barely changes between years from the default view. |
| DP-11 | low | confirmed | L43 | M1, fire escape | The view goes black by the fire escape's back plate. |
| DP-12 | polish | confirmed | P1 | M1–M2 HUD | An empty grey pill at the top-left. |
| DP-13 | polish | confirmed | P2 | Conversations, dock | The dock stays ghosted over conversations; its labels are low contrast. |
| DP-14 | polish | confirmed | P3 | Prologue card | The card plays over Kai at his door, before "asleep, four kilometres away". |
| DP-15 | polish | by design | — | M4, first objective | Starts outdoors and ends in one tap: the start at the door is v2.1's F14 fix; the length is a pacing opinion. |
| VX-LVP-01 | polish | extra (test tools) | — | Setbacks under a stepped clock | The setback waits on a wall-clock timer, so a stepped clock lets Kai fall much further than a player would; it inflated DP-02 and DP-03. Not a game problem. |

### Act I tester (Missions 4–8)

| ID | Severity | Verdict | Item | Where | Finding |
| --- | --- | --- | --- | --- | --- |
| A1 | medium (high) | confirmed | M1 | M5, the village, ABANDONED | A YEAR tap drowns Kai in FLOODED and returns him, again and again; THRIVING cannot be picked by touch. |
| A2 | medium | confirmed | M5 | M5, the drained basin | The basin's rim is visual only; Kai walks under the meadow and falls out of the world. |
| A3 | medium | confirmed | M13 | CASE board, Act I | 23 Act I clues show as raw ids and are pinned without a toast. |
| A4 | high (medium) | confirmed | H4 | M7, the summit, THE FIRST SKY | The astronomer's talk drains the Chronolith; Kai is snapped off the summit mid-talk. |
| A5 | low (medium) | partly | L39 | M8, the reconstruction | The payoff uses the play camera and the echoes are small (on screen, not off-camera as reported). |
| A6 | medium | confirmed | M14 | M4, the first fire and the panels | The ash clue's label contradicts the narration and the right answer. |
| A7 | low | confirmed | L34 | M8, the escape | The stealth escape can be done entirely in 2026. |
| A8 | low | confirmed | L16 | M6, the arm | THINK's second tier and Kai's hit line still give the old advice. |
| A9 | low | confirmed | L18 | M4, M7, M8 exits | "Not yet. Something here is unfinished." plays at the last objective's own spot. |
| A10 | polish (low) | tester error | — | M4, first control | Card and CASE tip overlap: at real pace they do not (0 ms); the shot caught the card mid-fade. |
| A11 | low | confirmed | L32 | Niko (M4, M5, M7) | Niko reads as a woman at phone distance. |
| A12 | low | confirmed | L33 | M7 cold open | Old Niko is a 30 px silhouette. |
| A13 | polish (low) | by design | see L10 | Every CONTINUE in M4–M8 | PREVIOUSLY replays Act I's recap: a recap per chapter is the design. |
| A14 | low | confirmed | L8 | M8, the lockdown | After a catch, CONTINUE puts Kai back inside the sealed cube. |
| A15 | low | confirmed | L44 | M7, 2049 | The observatory at night is near-black. |
| A16 | polish (low) | partly | P24 | M6 | 12.5 game minutes against 26 designed; a scripted run understates a player's time. |
| A17 | polish | by design | — | M8, the boot thread | "Every intern gets a mug." is a callback to the Prologue's print. |
| A18 | polish | confirmed | L20 | M8, the terminal in 2026 | The terminal's prompt shows in 2026, where it is not built. |
| A19 | polish | confirmed | P8 | M4, the cistern | Kai clips waist-deep into the cistern. |
| A20 | polish | confirmed | P4 | M4 THINK | M4's THINK tiers are terse fragments. |
| A21 | polish | confirmed | P5 | M6, the clock room | The 2026 and 2049 clocks are plain brass discs. |
| X1 | low | extra | L38 | M7, the astronomer | His conversation is not staged as one; he stands behind Kai. |
| X2 | medium | extra | M13 | CASE board, Acts II to the Finale | 86 more clues have no label and would show as ids. |
| X3 | polish | extra | P6 | M4, the first fire | The fire is a flat orange pyramid. |

### Act II tester (Missions 9–13)

| ID | Severity | Verdict | Item | Where | Finding |
| --- | --- | --- | --- | --- | --- |
| A2-01 | high | confirmed | H3 | M10, the yard | The yard's respawn is on the trooper's line; catches chain (a bug, not a hard softlock). |
| A2-02 | medium | confirmed | M6 | M10, the flood-pole roof | Checkpoint boxes ignore height; the roof belongs to the hall's quarter. |
| A2-03 | high (medium) | confirmed | H2 | M10, the hall stair | A 1 m hole at the stair's top; it cannot be walked back up. |
| A2-04 | medium | confirmed | M7 | M12, "panes" | The way back up to the roofs costs most of the stability and is not hinted. |
| A2-05 | medium | confirmed | M1 | M12 gangway, touch | No direct year pick; 2026 to 2049 passes 2196 and drops Kai 13 m. |
| A2-06 | medium | confirmed | M12 | M9, clock B | "On the patrol's route", with no patrol within 50 m. |
| A2-07 | medium | confirmed | M15 | M9, the tower | The tower's payoff is captions over rooftops. |
| A2-08 | medium | partly | M10 | M10 escape, M13 crossing | M10's escape is trivial; M13's crossing has some teeth. |
| A2-09 | low | confirmed | L8 | M10 and M12 loads | Loads drop Kai in his cell (M10) or on the ground (M12). |
| A2-10 | low | confirmed | L24 | M11, the held file | No READ THE FILE prompt until about 1.5 m. |
| A2-11 | low | confirmed | L25 | M11, the lock | The bolt label does not follow the crosshair. |
| A2-12 | low | tester error | — | Talks in M9 and M10 | "Talks keep the HUD": screenshots inside the 0.4 s fade; at real pace it hides. |
| A2-13 | low | confirmed | L27 | M11, the monitor | NOT A PROCESS, then "Not a person." |
| A2-14 | low | confirmed | L26 | REVERSE in M11 | Holds drain stability unexplained; a medium weight has no word. |
| A2-15 | low | confirmed | L37 | M9, the loops | Two objectives of standing still; blank clock faces. |
| A2-16 | low | confirmed | L29 | M9, the crowd | Brask's signature line is in the crowd pool. |
| A2-17 | low | confirmed | L30 | M13, the stabilizer choice | The cap line interrupts the choice. |
| A2-18 | low | confirmed | L17 | M10 objective, M11 THINK | Two hints name the wrong place. |
| A2-19 | low | confirmed | L21 | M10 looper, M11 Odile | Talks fire before their thread. |
| A2-20 | low | confirmed | L10 | Every CONTINUE in Act II | PREVIOUSLY replays the same chapter recap. |
| A2-21 | low | confirmed | L19 | M9 transmitter, M10 switch | Used things keep their prompt. |
| A2-22 | polish (low) | by design | — | M13, the frozen block | People pace at the prompt and freeze for the scene, as designed; the shot was mid-fade. |
| A2-23 | polish | confirmed | P4 | M9 and M10 THINK | Some THINK tiers are fragments. |
| A2-24 | polish | confirmed | P7 | M13 shells, Sera, M11 lock | Key objects look like placeholders. |
| VX-A2-01 | medium | extra | M8 | M12, the court's watchers | Watchers with no floor catch Kai on the 13.5 m gangway (from code and the tester's log). |
| VX-A2-02 | low | extra | L15 | M10, the hall's glass wall | The trooper chases through the glass wall. |

### Act III tester (Missions 14–18)

| ID | Severity | Verdict | Item | Where | Finding |
| --- | --- | --- | --- | --- | --- |
| LV3-01 | high | partly | H6 | M16, spiral alcove 2 | Holes in the cave floor drop Kai 24 m; there is a way out by an unhinted jump, so not a softlock. |
| LV3-02 | medium | confirmed | M17 | M15, Tomas's desk | Facing the desk, the camera clips into the hut. |
| LV3-03 | medium | confirmed | M16 | M14 cold open | The classroom shot frames an empty plaza. |
| LV3-04 | polish (low) | by design | — | M14, after the beacon | The mission ends on its hook; its side stories stay open in free roam. |
| LV3-05 | low | confirmed | L29 | M14, the crowd | Survivors say the gardener's payoff line too early. |
| LV3-06 | low | confirmed | L20 | M14, the stones | Stone clues are read in years with no stones. |
| LV3-07 | low | confirmed | L11 | M14, the canals | Drowning returns Kai without a word. |
| LV3-08 | low | confirmed | L13 | M14, the viaduct landing | An open edge drops Kai 8 m. |
| LV3-09 | low | confirmed | L28 | M14 MAP | The map shows no water or routes. |
| LV3-10 | low | by design | — | M14 and M17, other years | Stability lasts about 22 s out of the home year, as tuned, with a visible meter. |
| LV3-11 | low | confirmed | L31 | M18, the choice | The choice changes nothing in the hold when the city was freed. |
| LV3-12 | low | confirmed | L36 | M18, the slab stair | The stair holds about 5 s. |
| LV3-13 | low | confirmed | L19 | M18, the knock spots | A knocked house replays its scene. |
| LV3-14 | low | by design | — | M14, a load after 2026 | The anchor is used only in its own year, so the load goes to the quarter's spawn. |
| LV3-15 | polish | confirmed | P12 | M16 and M17 prompts | Use and REVERSE prompts stack. |
| LV3-16 | polish | confirmed | P9 | M14, the roof garden | A cone tree, and a box for a weather station. |
| VX-01 | medium | extra | M11 | M18, the hold | The hold's patrol never appears (its fact is never set). |
| VX-02 | low | extra | M17 | M15, Tomas | Tomas stands on the desk's use spot, inside Kai. |
| VX-03 | medium | extra | H6 | M16, alcove 1 | Alcove 1's floor has holes too (a probe; not walked). |

### Act IV and Finale tester (Missions 19–23, endings)

| ID | Severity | Verdict | Item | Where | Finding |
| --- | --- | --- | --- | --- | --- |
| N1 | medium | confirmed | M9 | M22, the station stair | The stair is buried in the platform; the microphone needs an unprompted jump. |
| N2 | low | tester error | — | M23, the gallery spot at the bus | Reachable and usable from the bus's east side. |
| N3 | medium | partly | M18 | M23 bus and roundhouses; M21 summit | Black-box climax props; the M23 ring summit is lit now (black only when backlit). |
| N4 | low (medium) | partly | L40 | Endings A, B, C | Short; but each has its own staged beat, Kai appears and the ring animates; the shared epilogue is by design. |
| N5 | polish (low) | by design | — | Ending C epilogue | Sera's memorial line in C is bridged by a deliberate line. |
| N6 | low | confirmed | L35 | M23, the opening streets | The stealth avenue is crossed by walking straight. |
| N7 | polish | confirmed | P11 | M23, the summit | An invisible wall on open ground at x 49.7. |
| C1 | low | confirmed | L45 | Act IV score | The glass voice reads past a one-note chord: a page error. |
| C2 | polish | by design | see P22 | Orren | His mannequin look is his hologram, by design. |
| C3 | low | by design | — | M19, a load | The anchor is used only in its own year; otherwise the quarter's spawn. |
| C4 | low | confirmed | L22 | M19, the deduction by Mira | The solved deduction keeps the prompt and the focus. |
| C5 | low | confirmed | L11 | M19, the channel | Drowning is a silent fade-back. |
| C6 | polish | tester error | see L18 | M22, the evidence table | The "Not yet..." line came from walking over the exit, not from the tap. |
| C7 | low | confirmed | L23 | M20, the board | Correct picks close the board silently. |
| C8 | polish | confirmed | P23 | M21, the first quarter | Named "THE ALLY / ARRIVAL". |
| X1 | low | extra | M18 | M23, the 41 | The bus's sign is buried inside its body. |
| X2 | low | extra | L35 | M23, the opening streets | Standing to listen after the crossing gets Kai caught and walked back, silently. |
| X3 | polish | extra | P18 | Ending A | "Looks up at the board": the board is not in the frame. |

### Post-game tester (ending card, CASE FILES, free roam, slots)

| ID | Severity | Verdict | Item | Where | Finding |
| --- | --- | --- | --- | --- | --- |
| PG-01 | medium | confirmed | M20 | Case replays (case 12) | The case resolves under the thumb; the release tap hits BACK TO THE TITLE. |
| PG-02 | medium | confirmed | M22 | CASE FILES | Finished replays revert to NOT STARTED after the next CONTINUE. |
| PG-03 | medium | confirmed | M23 | CASE FILES after a replay | The FREE ROAM tab does nothing. |
| PG-04 | low | by design | — | A replay quit midway | A replay's own slot is never offered, so it restarts (DESIGN.md). |
| PG-05 | low | confirmed | L41 | Case replays 5, 8, 9, 12, 13 | 45–90 s each, then a snap to the top of the list. |
| PG-06 | polish (low) | tester error | — | The CASE BOARD tip | It shows once per device; each test session was a fresh profile. |
| PG-07 | low | confirmed | L6 | NEW GAME over a finished campaign | The replace warning is below the fold. |
| PG-08 | low | confirmed | L7 | CASE FILES and FREE ROAM tabs | 3 of 14 rows; the year order varies. |
| PG-09 | polish | partly | P19 | Trips after an ending | "The story waits..." wording; the load toast shows only on loads. |
| PG-10 | polish | confirmed | P20 | The ending card | No FINALE time. |
| PG-11 | polish | confirmed | P21 | M14, the gardener | "I can." answers nothing. |
| PG-12 | polish | partly | P22 | Orren, free roam after the ending | A pre-choice line after the ending (his look is by design). |
| PG-13 | polish | confirmed | L45 | Free roam, M22 | Score page errors. |
| X-1 | medium | extra | M21 | Case replays 12 and 10 (4 by code) | The closing reveal is cut off as the menu opens. |

### Robustness tester (reloads, rotation, background, spam, edges, settings, memory, performance)

| ID | Severity | Verdict | Item | Where | Finding |
| --- | --- | --- | --- | --- | --- |
| LB-01 | high | confirmed | H1 | M12, the Helix court | The glass dome is not solid; a 25 m hole lies below. |
| LB-02 | medium | confirmed | M19 | M23, the ending | A kill during the ending loses the rest of it. |
| LB-03 | medium | confirmed | M3 | Comfort mode | Story flashes are not gated. |
| LB-04 | low | confirmed | L45 | Act IV score | A page error in the Act IV theme. |
| LB-05 | low | confirmed | L3 | A paused cinematic | SKIP covers QUIT TO TITLE. |
| LB-06 | low | confirmed | L4 | Cinematics | No on-screen pause. |
| LB-07 | polish (low) | by design | see L10 | Every load | A three-line recap on each load (DESIGN.md). |
| LB-08 | low | confirmed | L12 | M14, the water | Deep water looks wadeable. |
| LB-09 | low | confirmed | L1 | SETTINGS | 30 px toggles. |
| LB-10 | low | confirmed | L5 | M6, the cellar | YEAR is lit and only buzzes. |
| LB-11 | low | confirmed | L9 | M12, a 2026 save | It loads with drained stability. |
| LB-12 | polish | by design | — | M6, TALK TO EZRA | The arrival line hides the prompt; only story lines hide it, by the FT-04 rule. |
| LB-13 | polish | tester error | — | M11, REVERSE toast | "R1 · R2" are rule numbers, not pad buttons. |
| LB-14 | polish | confirmed | P14 | The dock's CASE | A double tap opens and closes. |
| LB-15 | polish | confirmed | P13 | The objective on touch | The because line is cut mid-word. |
| LB-16 | polish | confirmed | P15 | ANCHOR, keyboard | The deny line repeats once per press. |
| LB-17 | polish | confirmed | P11 | Place edges | Invisible walls on open ground. |
| LB-18 | polish | confirmed | P16 | M23, the ending choice | Options are tagged by tone, not by ending. |
| LB-19 | polish | confirmed | P17 | M1, the florist | Drawn 0.54 m from the camera. |
| LB-20 | polish | confirmed | P10 | M23, the streets | A pure-black wall face. |
| VLB-X1 | medium | extra | M19 | M23, the ending | The finished save is written at the choice tap, before any backgrounding. |
| VLB-X2 | low | extra | M3 | M21, the tremor | One more ungated flash. |
| VLB-X3 | low | extra | M7 | M12, the court floor | After a snap, THINK does not name the scaffold stair. |

## Appendix B: scores per mission (1–5)

Each tester scored what they played: clarity, fun, visuals, audio. Minutes are game time from the testers' telemetry,
inflated by retries, harness path-finding and the stepped clock. "By input" is whether the stretch was finished by touch
from its real start (helper starts and jumps are named).

| Tester | Mission | Minutes | By input | Clarity | Fun | Visuals | Audio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prologue | M1 The Last Normal Day | 33.1 | yes | 4 | 3 | 3 | 4 |
| Prologue | M2 Helix Goes Dark | 16.8 | yes | 3 | 3 | 3 | 4 |
| Prologue | M3 The First Switch | 8.2 | yes | 4 | 4 | 3 | 4 |
| Prologue | M4 The Man from the Last Day (to its first objective) | 2 | yes | 4 | 2 | 3 | 4 |
| Act I | M4 The Man from the Last Day | 44 | yes | 3 | 3 | 3 | 4 |
| Act I | M5 The Village That Never Existed | 38 | yes | 3 | 3 | 3 | 4 |
| Act I | M6 The Clockmaker's House | 12.5 | yes | 4 | 4 | 3 | 4 |
| Act I | M7 The Broken Observatory | 35 | yes | 3 | 3 | 3 | 4 |
| Act I | M8 The First Death | 26 | yes | 4 | 4 | 3 | 4 |
| Act II | M9 Nine Minutes to Zero | 23 | yes | 4 | 3 | 3 | 4 |
| Act II | M10 Enemies Who Remember | 60 | yes | 3 | 2 | 3 | 4 |
| Act II | M11 The Inverted Hospital | 19 | yes | 4 | 4 | 3 | 4 |
| Act II | M12 The Man Behind the Glass (to the "panes" clue; one placement) | 30 | no | 2 | 3 | 3 | 4 |
| Act II | M13 The Nine-Minute War (helper start) | 13 | yes | 4 | 3 | 3 | 4 |
| Act III | M14 Welcome to 2196 | 29 | yes | 3 | 4 | 3 | 4 |
| Act III | M15 The City That Forgot Tomorrow | 11 | yes | 4 | 4 | 3 | 4 |
| Act III | M16 The Museum of Failed Worlds (to the coat case) | 25 | no | 3 | 3 | 4 | 4 |
| Act III | M17 The Witness's Archive (helper start) | 13 | yes | 3 | 3 | 3 | 4 |
| Act III | M18 The Fracture, run A ("Take one"; helper start) | 17 | yes | 4 | 4 | 3 | 4 |
| Act III | M18 The Fracture, run B ("Not tonight") | 4 | yes | 4 | 3 | 3 | 4 |
| Act IV | M19 The Place Outside Time | 37 | yes | 3 | 3 | 3 | 4 |
| Act IV | M20 Mira's Memory | 19 | yes | 4 | 4 | 3 | 4 |
| Act IV | M21 The Last Battle of the Continuum (one fact set) | 13 | yes | 4 | 3 | 2 | 4 |
| Act IV | M22 The First Second | 30 | yes | 3 | 3 | 3 | 4 |
| Act IV | M23 Finale: Afterzero | 30 | yes | 4 | 3 | 2 | 4 |
| Act IV | Endings A, B and C | 7 | yes | 4 | 3 | 3 | 4 |
| Post-game | Endings A, B, C, the ending card, CONTINUE after an ending | 14 | yes | 4 | 3 | 3 | 5 |
| Post-game | Case 13 The Survivor's Garden (M14) | 7 | yes | 4 | 2 | 3 | 4 |
| Post-game | Case 12 The Ninth Minute: Evidence (M13) | 6 | yes | 4 | 3 | 2 | 4 |
| Post-game | Case 9 The Last Signal (M18) | 3 | yes | 4 | 3 | 3 | 5 |
| Post-game | Case 8 The House with No Owner (M20) | 3 | yes | 4 | 3 | 2 | 4 |
| Post-game | Case 5 The Child in Three Photographs (M1) | 2 | yes | 5 | 2 | 3 | 4 |
| Post-game | Case 11 The Clockmaker's Debt (M6; not finished) | 12 | no | 3 | 2 | 3 | 3 |
| Post-game | Case 14 The Unwritten Record (free roam, M22) | 5 | yes | 4 | 3 | 3 | 4 |
| Post-game | Free roam trips (M18–M23) | 18 | yes | 4 | 3 | 3 | 3 |
| Post-game | Save slots, pause LOAD and SAVE, NEW GAME over a finished game | 10 | yes | 4 | 3 | 4 | 4 |
| Robustness | M1, the opening and HOME & MARKET | 30 | no | 4 | 3 | 3 | 4 |
| Robustness | M4, the settlement (edge walk) | 9 | no | 4 | 2 | 2 | 3 |
| Robustness | M6, the clockmaker's house | 14 | no | 3 | 3 | 3 | 4 |
| Robustness | M11, the inverted hospital | 14 | no | 4 | 4 | 3 | 4 |
| Robustness | M12, the chase | 20 | yes | 2 | 3 | 4 | 4 |
| Robustness | M14, Welcome to 2196 | 35 | no | 4 | 4 | 4 | 4 |
| Robustness | M15 (a reload under its card) | 3 | no | 4 | 3 | 3 | 4 |
| Robustness | M18, the fracture | 10 | no | 4 | 3 | 3 | 4 |
| Robustness | M21 | 15 | no | 3 | 3 | 4 | 4 |
| Robustness | M19, M20, M22 (free roam only) | 12 | no | 3 | 3 | 4 | 3 |
| Robustness | M23, the Finale and Ending A | 25 | yes | 4 | 3 | 3 | 4 |
| Robustness | Post-game hub and free roam (memory soak) | 38 | yes | 4 | 3 | 4 | 3 |

**Averages (1–5):**

| Rows | Rows scored | Minutes | By input | Clarity | Fun | Visuals | Audio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prologue | 4 | 60.1 | 4 of 4 | 3.8 | 3.0 | 3.0 | 4.0 |
| Act I | 5 | 155.5 | 5 of 5 | 3.4 | 3.4 | 3.0 | 4.0 |
| Act II | 5 | 145.0 | 4 of 5 | 3.4 | 3.0 | 3.0 | 4.0 |
| Act III | 6 | 99.0 | 5 of 6 | 3.5 | 3.5 | 3.2 | 4.0 |
| Act IV and Finale | 6 | 136.0 | 6 of 6 | 3.7 | 3.2 | 2.7 | 4.0 |
| Post-game | 10 | 80.0 | 9 of 10 | 4.0 | 2.7 | 2.9 | 4.0 |
| Robustness | 12 | 225.0 | 3 of 12 | 3.6 | 3.1 | 3.3 | 3.8 |
| The story slices (Prologue to Act IV) | 26 | 595.6 | 24 of 26 | 3.5 | 3.2 | 3.0 | 4.0 |
| **Everything** | **48** | **900.6** | **36 of 48** | **3.6** | **3.1** | **3.0** | **3.9** |
