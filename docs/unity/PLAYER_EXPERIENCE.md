# AFTERZERO — Player Experience: Adrenaline, Friendliness, and Why People Keep Playing

You asked for a game that's smooth, player-friendly, adrenaline-pumping and loved by players everywhere. This document maps each of those words to specific systems in the Unity build.

## 1. Smooth

| Problem in the prototype | Unity solution | Where |
|---|---|---|
| Movement felt stiff | Acceleration/deceleration curves, sprint, crouch-slide, air control | `PlayerMotor` |
| Missed jumps at edges | **Coyote time** (0.12 s) and **jump buffering** (0.15 s) | `PlayerMotor` |
| Gravity flip was jarring | Eased barrel-roll around your facing direction, or an instant cut (comfort setting) | `PlayerCamera` |
| Camera was static | Head-bob, spring landing dip, speed FOV kick, trauma-based shake, optional look smoothing | `PlayerCamera` |
| Falls killed momentum | Generous checkpoints; falls return you in under a second | `GameManager.Respawn` |
| Touch was imprecise | Floating stick that follows your thumb, aim-assisted interaction, 60–90 px buttons, haptics | `MobileControls`, `Interactor` |

## 2. Adrenaline

Adrenaline is **a system, not a mood**:

```
threat (Observer suspicion and distance, Wardens chasing, Undertow gap)
      -> Adrenaline.Level (rises fast, decays slowly)
      -> heartbeat audio (60 -> 170 bpm), FOV kick, red vignette, chromatic aberration
      -> SLIP charge fills while adrenaline is high
      -> SLIP: your next shift happens in bullet-time (world at 35 % speed, you at 85 %)
```

Being in danger charges the tool that gets you out of danger. Near-misses feel great because they pay you back.

**Three set-piece chases, three different rules:**

| Chase | Threat | Counter-play |
|---|---|---|
| **Lockdown** (end of Act I) | Bael's Warden drones flood the lab | Wardens can't see the ceiling: invert and run the ceiling to the dormitory door |
| **The Spine** (Act II) | The Undertow rises from below | Fall *up* through the shaft; `TIME SLOWS` halves it |
| **The Crown** (Act III) | The corridor un-happens behind you | Alternate ceiling, floor and memory sections; `UNDERTOW FREEZES` stops it cold |

Pacing alternates spike and breather: tense hall → calm archive → **lockdown** → safe dormitory → **Spine** → **Crown** → quiet Core.

## 3. Player-friendly

- **TICK, the hint drone.** Ask once for a nudge, again for a direction, a third time for the answer. TICK always has a hint (enforced by an automated test), and hints are tracked for the playtest report, never punished.
- **Story difficulty:** slower Observer and chases, shorter sight range. Hard makes everything sharper.
- **No dead ends:** every catch and fall returns you to a checkpoint seconds away, and chases restart cleanly.
- **Comfort and accessibility:** instant-flip camera, reduce flashes, subtitle size, invert look, sensitivity sliders, and state indicators that use **shape + number + colour** (■ ▲ ●) for colour-blind players.
- **Choices pause the world.** You never have to pick an answer while being hunted.
- **Autosave** on every meaningful change, plus save-on-pause for phones.

## 4. Why people keep playing (and why it's not a trap)

Every hook here is driven by **curiosity, mastery and attachment**:

| Hook | Mechanic |
|---|---|
| *"What happens next?"* | Every chapter ends on a question the player can phrase; the objective visibly rewrites itself |
| *"I can do that better."* | The Observer learns you, so the next encounter is genuinely different; chases reward mastery of laws |
| *"What else is there?"* | 12 memory fragments in every state, 16 law tokens, two side quests, locked endings shown as `? ? ?` |
| *"I care about them."* | NPCs remember your choices; TICK; your mother at the top of the ship |
| *"One more cycle."* | **New Game+ (Cycle 43)**: the Observer remembers the lessons you taught it in your last playthrough |

What the game will **never** do: energy timers, loot boxes, daily-login rewards, streak punishments, artificial cliffhangers between sessions, or monetised hints. We want people to love it, not feel trapped by it.

## 5. Measuring "loved"

At the end, the game asks the three playtest questions and copies a JSON report: time, discoveries, memories, catches, hints used, slips, Observer lessons, the objective history, a discovery timeline, difficulty, platform and cycle. Use it to find where players stall (timeline gaps), where they lean on TICK (hints), and whether they'd play 20 more minutes.
