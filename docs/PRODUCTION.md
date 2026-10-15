# AFTERZERO — Production Plan

Principle: **prove the mechanic before building graphics, characters and levels.** The browser slice exists to answer design questions cheaply; Unreal Engine 5 is for the shipped Android game.

## Phase status

| Phase | Goal | Status | Where |
|---|---|---|---|
| 1. Prove the mechanic | One room, three states, one puzzle | ✅ Done | Antechamber + lab ceiling token |
| 2. Add suspense | One entity that reacts to movement and repeated hiding | ✅ Done | Observation Hall, `ObserverBrain` |
| 3. Narrative memory | A discovery in one state changes an object/event in another | ✅ Done | Shadow → passage; R1 rewrites itself; archive memory |
| 4. First twist | Evidence that contradicts the player's understanding | ✅ Done | Recording 0; Custodian; lab → spaceship → brain |
| 5. 10-minute demo | Connect systems into one polished sequence | ✅ Exceeded (≈25–40 min slice) | `game/` |
| 6. Test on Android | Frame rate, memory, load, touch, battery on real devices | 🟡 Ready to run (touch UI, PWA, mobile render settings in place) | see checklist below |
| 7. Expand the campaign | Remaining chapters and endings, in UE5 | ⏳ Next | `MAPS.md` §5 |

## Phase 6 checklist — Android device test

Run the slice on at least three devices (low / mid / high tier). For each, record:

- [ ] Frame rate in the lab (busiest room) and in the hall with the Observer chasing — target ≥ 30 fps.
- [ ] Time from tap to first frame (target < 4 s on mid-tier over Wi-Fi).
- [ ] Memory (Chrome `about:memory` / Android Studio profiler) — target < 400 MB for the web slice.
- [ ] Touch accuracy: can testers pick up the key and use the archive panel on the first try? Count misses.
- [ ] Battery drain over 30 minutes at 50 % brightness.
- [ ] Landscape lock / fullscreen works; safe areas (notches) don't cover controls.
- [ ] Audio starts after the first tap.

Web slice mobile settings already applied: pixel ratio capped at 1.25 on touch devices, no MSAA, no shadow maps, 4 point lights reused per room, static geometry merged per room/material, procedural textures (no image downloads), ~700 KB total JS.

## Phase 7 — campaign build in Unreal Engine 5

Order of work (each step playable):

1. **Port the core as data**: reality subsystem, law grammar data asset, narrative subsystem, condition parser (see `REALITY_ENGINE.md` §9). Re-create the four slice rooms as whitebox; content tables import from the web data.
2. **Re-run the slice playtest in UE5** (same three questions) before adding anything.
3. **Chapter 5 (Dormitory of Cycles)** — introduces `SHADOWS` and contradictory recordings.
4. **Chapter 6 (The Spine)** — the combination chapter; needs streaming between room level-instances.
5. **Chapter 7 (Hull walk)** — gravity laws as locomotion; seeing your earlier self through the windows.
6. **Chapter 8** — law-dependent endings.
7. Art pass (only now): Observer skeletal mesh, hologram material, lab layers, audio.

## Team (smallest viable)

| Role | Count | Notes |
|---|---|---|
| Designer / writer | 1 | Owns facts, laws, scripts, the playtest loop. |
| Gameplay programmer (UE5 C++) | 1–2 | Subsystems, Observer AI, movement with gravity. |
| Environment artist | 1 | Re-lighting and re-dressing the hub matters more than new rooms. |
| Audio | 0.5 | Drone per state, Observer, voice direction. |

## Risks

| Risk | Mitigation |
|---|---|
| Players never discover ECHO or the law editor | Playtest metrics: `seen_echo` and `wrote_law` timestamps. If late or missing, add an earlier, safer anomaly that requires them. |
| The Observer feels unfair | Every lesson has an in-world tell and a counter; never add a lesson without a counter. |
| Gravity flips cause motion sickness | Roll speed is ~0.75 s; add an option for an instant cut + fade. |
| Scope creep into a big world | One hub that changes meaning; new chapters reuse it. |
| Android performance in UE5 | Budget in `REALITY_ENGINE.md`; test on device from the first UE5 milestone, not at the end. |
