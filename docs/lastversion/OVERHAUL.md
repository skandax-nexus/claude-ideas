# AFTERZERO: The Last Version of Earth — the v2.1 overhaul spec

This is the build spec for the overhaul that answers the player's feedback on v2.0. The lead
designer wrote it by merging five designs: the open world, inversion, casting, story and audio.
Where those designs disagreed, §2 says which way we went. The canon is `BIBLE.txt`, written by
the player. Where this spec adds to the bible it never contradicts it, and every quoted bible
line stays verbatim with the bible's speaker.

Checkout: `/home/user/v2-overhaul`, branch `lastversion-overhaul`, started from `3e729ff`.
The edition lives in `game/js/editions/lastversion/`. Without `?edition=lastversion` the game is
AFTERZERO 1.1 (Station Zero), and that game must not change.

**Contents**

1. The feedback and what answers it
2. Lead decisions (conflicts resolved)
3. Contracts between units
4. The world: places under an open sky
5. The mission table, then one sheet per mission
6. Casting
7. Inversion: the REVERSE verb
8. Audio
9. Story: spine, questions, ledgers, motifs, arcs, writing rules
10. Shared-file ledger and budgets
11. Implementation units 1–8
12. Risks

---

## 1. The feedback and what answers it

| Player said (abridged) | Outcome | Where |
| --- | --- | --- |
| "Audio is not available include the cinematic and conversation audio" | Every line and every cinematic is heard from recorded voices in the claude.ai preview and the APK, with music and ambience under cinematics. Audio unlocks on the first tap. Nothing ever uses `speechSynthesis` or AndroidTTS. | §8, U5; every later unit records its own lines |
| "make as open world as it don't have inverse option and laws, open sky will be good" | Three years only. No gravity flip, no laws. The bible's inversion becomes a local, readable REVERSE of one process, from Mission 11. Every place stands under a real sky. | §7, U1; §4, U2–U3 |
| "Chose the character for npc perfectly; 1st level it have doctor as gate keeping officer" | Every NPC is cast by role, gender, age and era. 31 new Rocketbox people, edition-only manifest. | §6, U4 |
| "Make each chapter little long it looks so short" | Every mission becomes one open map with 3–5 quarters, 6–10 main threads, 1–2 side stories, a cold open and a hook. 25–50 minutes each instead of 10–20. | §5, §9, U6–U8 |
| "Create a story stronger that attracts the player more" | A reconstructable spine, a clue ledger planted before every payoff, act-end twists, cliffhanger hooks, arcs, and choices you see again later. | §9, U6–U8 |
| "don't repeat the same visual again and again unless needed for past future and present" | 20 distinct places, each with its own style, sky, hour and weather. Places are deliberately the same only when they are the same place in another year (`sameAs`). Tests check this. | §4.8, U2–U3 |

---

## 2. Lead decisions (conflicts resolved)

- **D1. Three years and one local verb.**
  - The `INVERTED` state goes, with gravity flips, ceiling routes, law slots, law tokens, "MEMORY KEY" labels and the SHIFT/LAWS/TICK remnants.
  - The bible's "Inverted state … temporarily reverses selected processes" becomes **REVERSE** (§7). It is unlocked in Mission 11, as the bible says.
  - The world design's "INVERTED year preset" is dropped. A backwards-drifting sky appears only inside authored environmental reversal zones (M11's discontinuity courtyard, M23's collision zone).
  - Documented deviation: the bible's art line "gravity changing only in readable zones" is honoured only as objects whose fall reverses. Kai's own gravity never changes, per the player.
- **D2. One map per mission.**
  - Each mission is one place. The story design's "places" are that map's **quarters**.
  - U2–U3: sector *i* loads the whole map and activates quarter *i* (spawn plus set piece). This is the world design's step 1, with no runtime restructuring.
  - From U6 on, a rewritten mission is a single load. Quarters become soft thresholds driven by threads, and a resumed save spawns at the furthest quarter reached.
- **D3. Which place, where the designs differed.**
  - **M9 Loop City is Rain City North, "Northbank".** This is the hill quarter across the river from Helix, looping 08:05–08:14 of the Zero Second morning (story).
    - It is built with the world design's harbour-hill vocabulary: stair-streets, a funicular, the market loggia, cathedral steps, the transmitter on the headland.
    - The light is the 08:05 **sunbreak**: low gold sun under a lifting rain shelf, wet stone gleaming.
    - Helix's crescent and oculus are visible across the river, so Kai can see the man at the console.
    - It is not Port Calder.
  - **M10** is the Continuum's detention block inside the upper-gorge dam (world). **M21** is the Continuum Spire above the clouds (world). The story's "citadel bottom/top" becomes two Continuum holdings, and the Director's office is in the Spire.
  - **M11** is called Rain City General (story). It is built as the world design's garden-pavilion hospital, with a glass entrance atrium and Ward 32's roof garden and helipad.
  - **M15** is the stadium-bowl lock city in Rain City's eastern suburbs.
  - **M16** is the quarry-sinkhole museum (world). "The Names Beneath the City" catacomb runs from its floor under the city.
  - **M17** is the desert radio-telescope array (world). The game's only place above the clouds is M21.
  - **M8 (`helix_v17`)** is a full ring round a **water court through which M5's diverted river runs**. This merges the story's "river through the atrium" with the world design's "full ring". The court carries no memorial text, and the oculus is capped by the glass containment cube.
  - **M22** puts the **twin chamber** (2026 at 16:02 and 2049 at 05:40 as one room) at the centre of five wedges:
    - village terraces, golden evening;
    - the clockmaker's light well, autumn;
    - the hospital colonnade, noon;
    - the Line 41 station canopy at 08:14 in rain, with the PA microphone;
    - the 2196 Helix court at misty dawn, with Orren.
  - **Quest chains B and C move inside M5 and M15** (story).
    - M5's place gains an upstream **gorge quarter** in the world design's gorge vocabulary: three cascade gates, an aqueduct arch, the mural cliff.
    - Case C's two archives are in M15's press tower.
    - The `gorge` and `campus` places are not built.
    - The Cases chapter becomes **CASE FILES**, replaying side stories from their places.
- **D4.** M7's 2049 is **blue hour** with one bright star, not a Milky Way night, so it never looks like M17's desert night.
- **D5. REVERSE toggles; it is not held down.** One press starts the aimed process, the process holds while charge lasts, and a second press releases it. When the story design says "hold to reverse" it means this.
- **D6. Echo Step comes from M10's captured temporal weapon**, an afterimage projector (story). The inversion design's "Continuum rewinder" preview is dropped, so the player's inversion starts in M11 exactly. Enemy-side reversal stays as foreshadowing: M1's toy, M2's rewinding unit, M7's scavengers, M8's containment display.
- **D7. Casting changes against the casting design** (§6):
  - The checkpoint officer is **Officer Pryce** (id `guard`, her), and her M2 recording uses the same face.
  - **Dr. Lin and adult Mira share one mesh**, because face continuity is the fair clue, with different wardrobe.
  - The Clockmaker is **Ezra Moll** on `Male_Adult_03` (white-haired).
  - **Nurse Odile** (`Female_Adult_02`) and **the Florist** (`Female_Adult_14`) get new meshes.
  - M1's toy child wears a **red** raincoat, because yellow is Mira's colour.
  - The edition offers only Kai's realistic look.
- **D8. The same person always shares a base voice.** This story rule beats the audio table where they differ (§8.4):
  - LIN and CHILD are built on `af_river`, Mira's voice.
  - WITNESS and VOICE are built on `am_eric`, Kai's voice.
  - PRYCE takes the officer's voice.
- **D9. The audio pipeline (U5) comes before the story rewrite (U6–U8).** Each story unit then records its own chapter, so no build is silent. U1–U4 add only a few lines, and U5 records everything that exists at that point.
- **D10. One parametric place builder, not 20 kits.** It is `Place.js` plus an archetype library, a style table and one data spec per place. A place may add one custom helper of 150 lines or fewer for its signature structure: the M15 bowl, the M16 spiral, the M19 mirror bridge, the M22 wedges.
- **D11. No generated second answers.** The inversion design's `addInversionAnswers` is dropped, because U2–U3 retire ZoneGen and LevelGen for the edition. Every REVERSE puzzle is authored, and every required one is at M11 or later.
- **D12.** Speech budgets and per-chapter packs (§8.10) keep the voice inside the artifact and APK limits.
- **D13.** Edition CSS is injected by edition modules (`<style id="lv…">`, scoped to `body.lastversion`). `index.html` and `css/style.css` are not edited, including the story design's letterbox rules.
- **D14.** Watchers become people or drones by swapping the mesh inside each sentinel after the level is built, in edition code. DeckWorld is not changed. The casting design's 2-line DeckWorld hook is the fallback only (§10).
- **D15.** `Weather.js` is not changed. Snow, ash, leaves and spray use the fallbacks frost, motes, pollen and steam.
- **D16. Bible speakers fixed.**
  - M7: KAI "How could they know when I would be born?" / NIKO "They didn't know when. They knew who."
  - M22: KAI "You were trying to stop me from becoming you." / WITNESS "I was trying to find a version of me that didn't have to."
  - Every other quoted exchange keeps today's speakers.
- **D17. The version numbers:**
  - VERSION 17 counts the finished worlds.
  - 117 attempts in all, 100 of them UNFINISHED.
  - The archive's recording is "RECORDING 117 OF 117".
  - The post-credit voice says 118.
  - M8's staff record reads "VAREN, M. – junior programme – deceased 2026".
- **D18.** M8 is a still afternoon, so its receptionist says "good afternoon".
- **D19.** Patient 32 is replaced as a speaker by **Nurse Odile**. Ward 32's bed holds a silent, flickering figure of adult Mira in a gown.
- **D20.** The fresh white chrysanthemums at the 2196 memorial (M14) are **the Witness's** (C1), not Sera's. The inversion design's "footprints lead to Sera" becomes "footprints lead to a fracture scar and an 08:04 florist's receipt".
- **D21.** Chapter cards show **the bible's** chapter question. The case board's THE QUESTIONS section can add the story's sharper sub-questions.
- **D22. M11's unlock comes in the records quarter, after the quiet colonnade.** It follows the bible's beat order: sound, then hazards, then records, then lock. The story design's three triage objects (tray, water, burnt door) become the tutorial in the records hall.
- **D23.** The 2026 junior tour is **Saturday 14 March 2026** at 16:02. Mira's M7 recording says "It's Friday".

---

## 3. Contracts between units

These interfaces let eight units built in sequence fit together. Change one only by updating this
section in the same commit.

### 3.1 Place → level (U2–U3 provide; U1, U4, U6–U8 consume)

```js
// game/js/editions/lastversion/places/index.js
export const PLACES = { rain_south, helix, helix_v17, valley_upper, valley_river, oldtown,
  observatory, northbank, dam, hospital, warport, drowned, lockcity, sinkhole, array,
  fracture, unwritten, memory, spire, firstsecond, afterzero };      // specs: places/specs/<key>.js
export function buildPlace(key, story, si, rt, opts) // -> level in the shared format, plus:
level.place     = key
level.landmarks = { name: [x, y, z, yaw] }        // every name in the mission sheet (§5) MUST exist
level.quarters  = [{ name, area: [x0, z0, x1, z1], spawn: [x, y, z, yaw], threshold: { at, kind } }]
level.years     = { PRESENT: {...}, PAST: {...}, FUTURE: {...} } // sky preset, hour, sun, fog, density, night, weather, grade, ibl, hemi, sunColor
level.scenery   = (root, rt) => ({ setEra(state), update(dt, camera), dispose() })
level.crowd     = [{ era, years, region, role, path: [[x, z], ...], n, y?, when?, echo? }] // consumed by crowds.js (U4)
// era: the wardrobe (§6.3) 'present' | 'ancient' | 'future'; years: the states the crowd walks in; y: the path's
// height where it is not the ground; when: a fact condition (M1's EMS after the crash); echo: Tier-4 echoes
level.sites     = { processId: { at, parts: [...] } }   // geometry anchors for REVERSE processes (U1 API)
```

- A mission names its place with `place: 'rain_south'`, plus `wing:` for `helix`. This replaces `theme` / `deckKey` / `palette`.
- `Runtime.buildLevel` calls `buildPlace` when `deck.place` is set, and never calls ZoneGen or LevelGen for the edition after U3.
- Interactables are kind `'scene'` with an edition `model` (records are kit props, never Station Zero terminals). NPCs stand at landmarks. Tasks have authored positions.
- Landmark names are camelCase and unique per place. Missions may only reference names in their sheet.
- As built in U3 (documented in the U3 review): a quarter may name a height box, `cp: [x0, y0, z0, x1, y1, z1]`
  (y of Kai's centre), which replaces its `area` both for the quarter Kai is in and for its checkpoint: a pit or a
  wing whose quarters overlap in plan (Mission 16's rim, spiral, hall and photograph; Mission 12's chamber under the
  roofs; Mission 10's crown). `Threads.quarters()` takes the last quarter whose room, `cp` or `area` holds Kai, and
  moves the save's quarter on only once every main thread of the quarters before it is done, walked past or not up.
  Every quarter's spawn stands in its own quarter, and a main thread's landmark in its quarter, an earlier one or at
  the next one's threshold (unit-tested). `spec.sectors[mkey]` maps a multi-sector mission's sectors to quarters
  (unused since U6-U8 made every mission one map). `spec.outdoorFirst` + `P.room(...)` give a place interior rooms of
  its own (the hospital's wards), the outdoor room first. A trigger with `wrap: [dx, dz]` carries Kai across a wrapping
  edge (Mission 19), one with `to: [x, y, z, yaw]` somewhere else (Helix's glass lift). A mission may name a home
  year, `home: 'FUTURE'` (Missions 14-16 and 18; `'PAST'` for 20): its rooms start in it, stability drains outside
  it, a snap back returns to it. `level.heightAt(x, z)` is the highest terrain under a point (a tiered place sets
  each tier as its own ring). Every place is walked by `tests/lastversion-reach.mjs` (a flood fill from the spawn
  over its colliders, years and REVERSE parts) in the unit tests.

### 3.2 Processes (U1 provides; U6–U8 author)

The inversion module is `inversion.js` (class `Inversion`, owned as `rt.inv`), and process builders live in `processes.js`. A mission declares its processes:

```js
processes: [{ id: 'm11lock', kind: 'lock', at: 'ward32Door', label: 'THE LOCK', weight: 1, when: '@PRESENT',
  parts: [{ name: 'RING', order: 1 }, ...], settle: 'settled', refuse: null, hints: [3 tiers] }]
```

- Facts: `rev_<id>` while held, and `inv_<id>_done` when settled. A lock also saves each bolt that is out as `inv_<id>_<BOLT>`.
- A REVERSE thread is `{ kind: 'invert', target: '<processId>' }` (§3.3).
- Refusals (R6) are processes with `kind: 'refusal'`, `refuse: 'NOT A PROCESS' | 'A MEMORY'` (the label reads "✕ " plus it) and a `line`.
- As built in U1: `parts` entries are `{ name?, order?, shape, size, mat, at, rot?, rest: { at, rot }, solid?, text? }` in the anchor's frame (a lock may give `bolts: ['RING', ...]` instead); `props` are static boxes placed with the process; `scene` + `prompt` add a scene interactable at the aim; `ambient: { period, on }` runs a held-style process on its own rhythm; `required: true` marks a use the story needs (n ≥ 11 only).
- Until U3, a mission maps its §5 landmark names to rooms with `anchors: { name: { sector, room: 'story'|'before'|'after'|index, at: [x, y, z] | (room) => [...], yaw } | { sector, room, door: 'exit' } }`; `level.landmarks` / `level.sites` take precedence when a place provides them. The same names place `spots` (scenes with texts), `doors` (`when`-gated doorways), `zones` (trigger boxes), `displays` (the twin lock's loop) and `reversed` (rooms with `timeReverse`). Since U3 a piece of the place
  (a process, a spot, a door, a zone or a display) may carry `sector: i`: it is that sector's only (the whole place
  loads for every sector); with every mission one map since U6-U8, none does.

### 3.3 Threads (U6 provides; U6–U8 author)

```js
mission = { key, n, chapter, name, title, subtitle, place, wing?, states, labels, minutes: { main, optional },
  coldOpen: { shots: [{ cam: 'landmark', look: 'landmark', t }], cast: [{ id, at, yaw, path? }], lines, cue },
  quarters: [{ name, threads: [thread...], sides: [side...], barks }],
  talks: { npcId: [dialogue nodes] }, deductions: { id: { question, answers: [{ label, needs, correct, lines }], set } },
  processes: [...], hook: { shots, lines, cue }, outro /* = hook.lines */, music, beds }
thread = { id, kind, goal, because, at: 'landmark', when?, state?, done?, set?, ev?, after?, hints: [3], minutes }
side   = { id, name, giver, hook: lines, threads, outcome: { set }, case: 'c_<key>' }
```

Thread kinds:

| Kind | Built in | Purpose |
| --- | --- | --- |
| `go` | U6 | reach a landmark |
| `talk` | U6 | finish a conversation |
| `clue` | U6 | `need: n of [...]` |
| `residue` | U6 | read a contradiction |
| `deduce` | U6 | answer from the evidence |
| `scene` | U6 | an authored scene |
| `choice` | U6 | a choice by intent |
| `tasks` | U6 | several tasks, any order |
| `stealth` | U6 | cross unseen |
| `chase` | U6 | a 14 m leash; waits for Kai; never fails |
| `cinema` | U6 | a staged moment |
| `invert` | U6 | REVERSE a named process |
| `loop` | U7 | the M9/M15 resets |
| `playback` | U7 | echoes re-enacting a scene |
| `hold` | U8 | defend for a time |

Missions not yet rewritten run through a shim that turns each legacy beat into one thread in quarter *i*.

**As built (U6).** `game/js/editions/lastversion/Threads.js` and `ledger.js`; Missions 1–3 in `prologue.js` are
the first written to it. What U7–U8 author against:

- A thread's fact is `t_<mkey>_<id>`, set the first time the thread counts as done, with its `set`, `ev`
  (`ev_<ev>`), `log` and `say` paid out once (`t_<mkey>_<id>_paid`: a trigger, a chase's end, a staged
  moment, a deduction or a record sets the thread's fact itself). `done` is any condition (`'ev_relay || jun_rerouted'`); without one a
  `clue` / `tasks` counts `need` of `of`, an `invert` reads `inv_<target>_done`, and every other kind waits
  for its own fact. `after: [ids]` orders threads; `until` marks a thread walked past (a clue not found): it
  stops being the objective. A side story's fact is `side_<mkey>_<id>` (set once it is active).
- `placeThreads` builds what a kind needs at its landmark: a `go` / `stealth` trigger (radius `r`, 4 m), a
  `spot` or `spots` (a scene with `prompt`, `offset`, `r`, `model`, `kit`, `texts`), a `deduce` spot
  (scene `deduce:<id>`, only when `deductions[<id>]` exists), a `residue` record (scene `residue:<id>`:
  `record: { official, echo, after?, hint?, prompt?, log? }`, done when read in PAST), and a `chase` (`npc`
  walks `path` of landmarks or points through DeckWorld's own walker, `leash` 14 m, `ahead` 10 m, `speed`;
  she waits while Kai is beyond the leash, never fails, and sets the thread's fact at the end).
- `deductions: { id: { question: lines, answers: [{ intent, label, correct?, needs?, lines }], unproven?: lines,
  set, log, reveal? } }`: every answer is offered; a correct one without its evidence says `unproven`; a
  wrong one is said and the question stays open.
- `coldOpen: { shots, lines, cue, first?, title?: { shots?, lines, cue? }, set?, then?, minutes? }`. With
  `first` the cold open plays before the mission's card and `title.lines` after it. SKIP (`#lvSkip`, shown
  with the letterbox; Enter on a keyboard, where the locked pointer cannot reach the button) ends the whole
  opening at once; `set` is still set and `then` (a name in the
  mission's `fx`) still runs. `hook: { lines, cue, shots?, minutes? }` is the mission's last word (`outro`).
- `talks: { npcId: [nodes] }` as before; a node's `show: fact` holds that fact while the node plays (a
  recording's hologram). `autoExit: s` ends a mission `s` seconds after `beat_done` (no walk to a gate).
  `stableOutdoors: true` keeps the Chronolith's stability from draining in the open place (Mission 3's
  dig is outdoors); `carryOut: [roomIds]` gives the open place the year of the room Kai walks out of
  (Mission 3's lab, a frame in 2026, opens onto the court in 2026); only those rooms carry, and a room
  keeps its own year.
- A quarter is `{ name, threads, sides, barks }`; its `spawn` and `area` come from the place sheet. The
  furthest quarter reached is `campaign.quarter`: a toast and an autosave at each new one, and a load
  spawns there after a PREVIOUSLY card. `campaign.track = '<mkey>:<sideId>'` is the side story tracked
  from the case board (its next thread under the objective). Saves are `lvFormat` 22; an older save in a
  rewritten mission restarts that mission at quarter 0 with the facts it had.
- `time_<mkey>`: the seconds of play a mission took, set when it ends (the ending screen sums them per
  chapter).

**As built (U7).** Missions 4–13 are written to it in `act1.js` and `act2.js` (re-exported by `acts.js`). What U8
authors against, beyond U6's:

- `loop`: the mission's `loop: { period, variants: [{ watch: { '<q>s<k>': path } }], upward, until }` resets the
  place every `period` seconds until `until` holds (M9: the carrier cut). Each reset counts `loops_<mkey>`, moves
  the patrols (sentinel ids end `_q<i>s<k>` in a one-map mission) to the next variant's rounds, restarts the crowds
  further along their routes, and with `upward` the rain falls upward for a second; a `loop` thread is done once
  `loops` (1) resets happen while it is the objective. Pieces of the place may wait on the count (`P.W('loops_m09 >= 2',
  …)`: M9's burnt shopfronts).
- `playback`: `{ at, echoes: [{ crew, offset | at, path }], entries?: [{ label, lines }], question, next, wrong, lines,
  set, log }`; a spot `playback_<id>` (its `spotWhen` gates it), echoes that stand only while it plays (`pb_<mkey>_<id>`);
  with `entries` each use offers the pieces not yet placed, and only the next in order goes in.
- A staged `cinema` thread plays once per load (kept in `Threads.staged`, not the saved flags). A thread's completion is
  re-tested on every fact change and four times a second.
- Authored triggers and `zones` may ask for a year (`when: 't_m12_route && @FUTURE'`). While an opening or a staged
  moment plays, the watchers walk their rounds but see nobody.
- A passer-by placed with `ambient: true` and a `prompt` (cast by role, `AMBIENT_CAST`) gets `lines: []`, so DeckWorld
  offers the talk; what they say is the mission's `talks[<crew>]`.
- A thread's `done` must not hold at its chapter's start (a unit test primes each chapter as the menu does, with
  `faction: 'neutral'`): M13's stabilizer is done on `stabilizer_destroyed || civilians_freed`, not `faction`.
- Saves are `lvFormat` 23 (`REWRITTEN_IN`: a chapter's missions became one map in that format); an older save inside a
  mission of Act I or II restarts it at quarter 0 with its facts.

**As built (U8).** Missions 14–23 are written to it in `act3.js`, `act4.js` and `finale.js`, the case files in `cases.js`
(all re-exported by `acts.js`). Beyond U7's:

- `hold`: `{ at, r, secs, posts: [{ at, name, year, drift, anchor, wrongYear, steady }], drift, window, allies: { cond:
  postIndex }, slow: cond, lapse, while? }`. Progress (`hold_<mkey>_<id>`, seconds, saved) counts while Kai is within
  `r` of `at` and no post has lapsed; one post at a time drifts every `drift` s (half as long again when `slow` holds)
  and lapses after `window` s unless re-anchored by its scene (`hold:<id>:<i>`) in its own year; an ally's post never
  drifts. The HUD chip `#lvHold` shows it. Never a fail (M18's pylons).
- A mission's `home` year: its rooms start in it, and stability drains (and snaps back) away from it (M14–M16, M18:
  2196; M20: 2026).
- `nodes: { <scene>: (rt) => node }`: a scene built when it is used (M20's alignment board); its lines are listed in
  the mission's `spoken` so the packs record them. `onEcho(rt, pos)`: the watchers answer an afterimage (M21).
- Processes may carry `heldBy` (someone else holds it, scripted: the Witness, an ally; Kai cannot aim at it), `beat:
  { period, on }` with `offBeat` (M22's arm jams off its counted beat), `mode: 'rewind'` with `stuck` on a patrol
  (M21's elites: reversing the rewind leaves one stuck forward), and a refusal's `lineWho` and `once` (M20: Mira
  answers the first try). An `ink` process of one layer is an original: trying it settles it, and nothing comes off.
  `arm: cond` keeps a process in plain sight but out of REVERSE's reach until the story gets there (M18's slabs wait for
  the stabilizer).
- `gateAfter: true` (every mission of Acts III, IV and the Finale): a thread's own interaction (its `spot`, its `go` or
  `stealth` trigger, its deduction, record or playback) answers only once the threads in its `after` are done, so
  nothing that ends a mission can be used before the story reaches it; the evidence a clue or tasks thread lists in
  `spots` stays free to find (a unit test checks, from each chapter's PRIMES, that no spot, trigger or person that sets
  a mission's end answers at its start).
- `coldOpen.cast: [{ crew, at, off, turn, variant, hologram }]`: people who stand in the opening's shot only while it
  plays (the fact `co_<mkey>`, cleared at a load): M20's two children at the fridge, M21's Director as a broadcast,
  M22's Witness at the microphone.
- A case file is `replay(mission, sideId, o)` (or, for a story on the main path, `o.threads`: chain C is M15's `mara`
  and `ink`): the mission's place, people and what the side story uses, its threads
  in the quarter it lives in (`startQuarter`, where the replay spawns), `voiceGroup` (it speaks from the mission's pack:
  no new lines), and `clear` (the facts the story sets or waits for, unset when it starts, over the facts the player
  had). `c_b` and `c_c` are replays too (Mission 5's gorge, Mission 15's archive). Saves are `lvFormat` 24; a U7 save
  inside a mission of Acts III, IV or the Finale restarts it at quarter 0, and an older save in `c_b` or `c_c` starts its
  replay again where the story lives.

### 3.4 People (U4 provides; U5 voices; U6–U8 write lines)

An NPC entry (`npcs.js`) is:

```js
{ id, name, role, pronoun, era, voice, vid, model, variant, height, props, walk }
```

- `voice` is the speaker key. `vid` is the recorded voice id (§8.4).
- `model` and `variant` come from §6. Pronouns never change, so recorded voices keep matching.
- *As built in U4:* an entry is `{ id, first, name, role, pronoun, era, voice, vid, model, variant, height, walk, … }`; things carried are the variant's `props` (`wardrobe.js` `WARDROBE[model][variant]`), and `hologram` / `silent` / `flicker` mark Ward 32's figure, Tomas and Orren. `director` has no model of its own: `resolve: [{ when, as, variant, vid } | { when, chair }]` picks Rook (older), Pryce or an empty chair by `rook_fate` when a level is built. `NPCS.pryce` is a non-enumerable alias of `guard` (`ALIASES`, `npcOf`), so `CAST` has one Pryce.
- A level NPC may set `variant` (the mission's wardrobe for that person: M1's `mira` is `raincoat`). A mission may list `named: [ids]`: people who belong to it though no level of it places them yet (cold opens, echoes, an ally who may stand there), whose faces its crowds then never wear; and `crowdFreeze: '<condition>'` stops its crowds (M1: the clocks). `castLevel()` (`crowds.js`) gives the level `story.cast = level.cast` (copies of `CAST`, indices unchanged, then the hand-placed passers-by and the crowd, each with `model`, `variant`, `height`, `walk`, `era`, `crowdRole`).
- `AMBIENT[region]` carries `roles` (what a crowd role is called there) and `voices` (`{ f, m, old_f, old_m, child }`: §8.4's crowd voice ids, picked per person by sex and age into `voiceExtra.id`).
- A chapter's models are `casting.js` `CHAPTER_CAST[chapter]` (plus Kai and the motion library); a story unit that places a new person in a chapter adds their model there (a unit test checks every level's people against it).

### 3.5 Spoken lines (U5 provides)

- Every spoken line lives in data that `voicelines.spokenLines()` walks.
- No `say` / `hud.say` call in edition code may use a template string (lint test).
- A line may carry `voice: { id, fx, cue }`. `fx` is one of `pa`, `radio`, `recording` or `echo`.
- *As built in U5:* `spokenLines({ levels = true })` returns `[{ who, text, extra: { id, fx, cue }, group, path }]`;
  `voiceOf(who, extra)` is the recorded voice (`extra.id`, else `YOU` → `KAI`, `VOICE` → `WITNESS`, `MIRA9` → `CHILD`, else `who`).
  A CREW line with no `voice.id` takes the `vid` of the person saying it (the NPC, the beat's crew, the scene's `npc`); a line
  no person says carries its own `voice: { id }`. Lines a mission's code says live in its data as `spoken: { key: [lines] }`.
  A mission may give its card a `logline` (else `subtitle`), and override its music (`music: '<region>'`) and beds
  (`beds: { PRESENT: [...], ... }`); a choice may carry `say` (what Kai says instead of its label), `mute`, and
  `consequence: true` (the stinger). The station speakers are the `PA` speaker. `cinema.play({ shots, lines, cue,
  letterbox }, then)` calls `then` synchronously when the moment ends. Every new line is recorded by the unit that adds
  it, one command per group: `VOICE_WORK=$S bash tools/voice-lv.sh <group>` (§8.10). The effect chains are the edition's
  (`voicefx.js`, given to `Voice` as `voice.effects`); `Voice.js` only routes a line with an `fx` through them.

### 3.6 Facts the browser bot already relies on (keep the IDs)

`checkpoint_passed`, `trust_guard`, `zero_second`, `rescued_a`, `rescued_b`, `voice_heard`,
`mira_gone`, `cells_in`, `lift_powered`, `officer_trusted`, `drawing_seen`, `has_chronolith`,
`cable_connected`, `power_on`, `crossed`, `open_control`, `fractured`, `jun_*`, `iven_*`,
`echo_step`, `faction`, `quest_*`.

---

## 4. The world: places under an open sky

### 4.1 Rules (every place)

1. Every place stands under a real, visible, era-specific sky. There is no dome, and no wall taller than a person unless it is architecture or cliff.
2. Each mission is one connected open map. Its quarters hold the beats, and it has side spaces that reward curiosity: a roof terrace, an alley, a cave, a jetty.
3. Interiors exist only where the story needs them. They are built round atria, courtyards, light wells, oculi, roof terraces or broken walls, with real windows onto a modelled outside (§4.6).
4. No two missions share layout, architecture, props, palette, sky, weather or hour. The exception is a `sameAs` declared both ways: the same place in another year, or the deliberate quotations in M22 and M23.
5. PAST, PRESENT and FUTURE of one place share **one layout**. Years differ by conditional pieces with big silhouettes: roofs on or off, towers broken, water level, cranes. They never differ only by decals.
6. Nothing from Station Zero's look is used: no Vessel deck look, no ZoneGen or LevelGen shell, no HALCYON crystals or "SAVE MEMORY" beacon, no Station Zero terminals, and no generic `dress.js`.
7. Ancient years carry no lamp posts, neon, asphalt, kerbs or Latin signage. Their inscriptions are carved glyph textures.

### 4.2 The atlas: the Valley of the Ring

One geography serves the bible's connected regions. It makes continuity visible, and the continuity doubles as a fair clue.

- **The Ring Hill** is a knoll at a river bend.
  - 3,000 years ago the settlement's standing-stone ring crowns it (M4), and the river ran round its south foot.
  - Kai diverts the river (M5). The old channel dries and silts over, and this is **Site Zero**: in 2026 Helix digs the black ring out of that dry riverbed (M3's excavation) and builds its campus on the knoll. The chamber is cut down to Site Zero, and the oculus sits on the court above it.
  - M4's ring stands exactly above where M2's oculus will be, so the reveal is spatial.
- **The river** runs from the upstream gorge (M5 side story; its dam is M10), past the village bend (M5), and becomes the Old Town canal (M6) and the delta port (M13). It is the flooded highway's water in M18.
- **The Ridge** to the east carries the Observatory (M7). The quarry, later the sinkhole museum (M16), is on Rain City's eastern edge below it.
- **The coast:**
  - 3,000 years ago the sea is a thin line far south.
  - In 2049 it is the harbour.
  - In 2196 it has risen into downtown (M14), and the Spire (M21) stands on the tallest drowned tower.
- **The Notch** is a split peak to the north-east.
  - It is visible from M1 (faint), M3, M4, M5, M7, M9, M10 (directly above, snow-capped), M14 and M23.
  - M7's alignment puts the sunrise in it, and M23's first true sunrise rises in it.
- **Elsewhere** (no valley geography):
  - M17's desert mesas;
  - M19's mirror plain;
  - M20's memory plot (sea where the street was);
  - M21 above the cloud sea, with M14's lagoon glimpsed through gaps.

`places/atlas.js` stores each place's atlas position and bearing. `Horizon.js` draws the Ring Hill (per era), the Ridge, the Notch, era skylines and the sea at their true bearing from that position, so the same peaks recur where they should and nowhere else.

### 4.3 Generator architecture (new modules in `game/js/editions/lastversion/places/`)

| Module | Job |
| --- | --- |
| `index.js` | `PLACES` registry and `buildPlace(key, …)`. |
| `atlas.js` | Atlas positions and bearings; shared landmark silhouettes (the Notch, the Ring Hill per era, the Ridge). |
| `Place.js` | Turns a spec into a level in the shared format (§3.1). Pipeline: terrain (terraces as box colliders; ramps as stepped invisible colliders under a smooth visible mesh; water planes) → roads/paths → authored landmarks → authored plots filled by archetypes → seeded fill blocks → edges (cliff, water, rubble, hedge, viaduct, plus an invisible collider ring; never a tall wall) → set pieces per quarter → era props → crowd paths → checkpoints per quarter → traversal challenges (each names the year that answers it) → minimap blocks. |
| `archetypes.js` | Parametric pieces: `terrace`, `stair` (jumpable rise ≤ 0.35 m with stepUp, else ≤ 0.5 m), `ramp`, `wall` (with openings), `window`, `roof` (gable, hip, cone, flat, shell, glass lantern), `arch`, `colonnade`, `railing`, `water`, `bridge`, `viaduct`, `canopy`, `block` (footprint, floors, style, roof, window pattern, cornice), `tower`, `roundhouse`, `pavilion`, `shed`, `tent`, `container`, `crane`, `dish`, `ring` (standing stones / bronze armillary / black machined ring / broken halo), `sign` (text or carved glyphs), `prop` (bench, stall, booth, barrier, cart, lectern, cairn, phone booth, telling-stone…). `E(era, fn)` tags colliders `when:'@ERA'` and routes visible meshes to the era group. |
| `styles.js` | One style per place: materials, palette, roof, window pattern, cornice, vegetation kinds (≤ 6), prop set. |
| `materials.js` | Edition materials from the exported shared helpers (`pbr`, `relief`, `canvasTex`) and existing textures (asphalt, bark, brick, concrete, metal, moss, pavement, rock, rust, stone, water_normal). Canvas-painted: whitewash, terracotta, thatch, slate, sandstone, basalt, bronze, brass, composite panel, curtain-wall glass (lit and dark windows), hospital tile, cobbles, timber, corrugated iron, container colours, raw concrete, salt, snow, carved glyphs. No new binary assets. |
| `years.js` | Sky presets and per-place years (§4.5). |
| `Sky.js` | Inverted sphere (r 420), one ShaderMaterial (`fog:false`, `depthWrite:false`, renderOrder −10) following the camera. Uniforms: zenith, horizon and ground colours; sun direction, colour, size and glow; moon; canvas star field; two scrolling tileable cloud layers (cover, colour, shade, speed); lightning flash (reads `g.weather.flash`); storm bands (M18); wedge mask and eclipse (M22). Feature meshes: the black ring-hole in the clouds (M1 after the Zero Second), Anja's lock halo (M15), the upside-down unbuilt city in construction lines (M19), the storm wall with a ring eye (M18), the cloud sea (M21). On a year switch every uniform eases over about 1.2 s. One draw call plus features. |
| `Horizon.js` | Far ring at r 260–400 from a bearing profile (hills, Ridge, Notch, skyline cards with emissive windows, sea disc), plus a ground skirt from the bounds outward. `fog:false`, haze baked toward `years[state].horizon`. Two to four draw calls. |
| `Scenery.js` | Edition meshes merged per material and per era group (all / PAST / PRESENT / FUTURE); hidden era groups cost nothing. Instanced vegetation (cypress, olive, plane, linden, birch, reeds, mangrove, vine curtains, flowers). `setEra(state)`. Props beyond 90 m are skipped. |
| `specs/<key>.js` | One data spec per place (§4.4), 80–250 lines, plus the optional custom helper (≤ 150 lines). |

`Build.js` keeps hand-built rooms for Helix. Its `Deck` gains:

- `at: [x, z]` and `rot` (in 90° steps);
- `roof: 'solid' | 'glass' | 'open' | { PAST: 'open', … }`;
- per-wall `windows`.

These let the M2, M3 and M12 rooms sit round the Helix court inside the `helix` place.

The Chronolith gets edition models, replacing Station Zero's `makeMachineRing`:

- a stone ring with a bronze band (past);
- a black machined ring (Helix);
- a broken halo (2196).

### 4.4 Place spec format

```js
export default {
  key: 'rain_south', style: 'rain2049', atlas: [0, 600], sameAs: null,
  bounds: [-90, -230, 90, 12],
  edges: { N: 'hillStair', E: 'viaduct', W: 'canal', S: 'blocks' },
  terrain: [{ rect, y, mat }], roads: [{ kind: 'avenue'|'lane'|'path'|'canal'|'viaduct'|'stairStreet', w, path, y }],
  plots: [{ id, rect, arch: 'block', floors: 7, court: true, era: { PAST: { floors: 4, crane: true }, FUTURE: { broken: 0.6, ivy: 1 } } }],
  fill: { arch: 'block', density: 0.7 },
  landmarks: [{ id: 'plazaClock', arch: 'clockPillar', at: [6, -40], h: 6 }, ...],
  quarters: [{ name: 'HOME & MARKET', area: [...], spawn: [...], threshold: { at: 'marketGate', kind: 'barrier' } }],
  crowd: [{ era: 'present', region: 'rain', path: [...], n: 6 }],
  years: { PRESENT: { sky: 'rainMorning', hour: 8.2, sun: { elev: 10, az: 110, color }, fog: 0x6f7c8c, density: 1.6,
           night: 0.45, weather: 'rain', grade: {...}, ibl: 'night', hemi, sunColor }, PAST: {...} },
  backdrop: { skyline: 'rain2049', notch: 'faint', sea: 'S', helix: 'crescent' },
};
```

### 4.5 Years, sky and light

- A place's `years` drive fog colour, density and night through `Runtime.theme` (called first each frame). It sets `level.palette.fog`, `density` and `night` from `years[state]` and returns `stateFog` 0, with no shared change.
- Sun colour, sun intensity and hemisphere come through `edition.themeFor(state)`. Low-sun shadows come through `edition.sunDir()`. These are the two small `main.js` hooks in §10.
- The edition sets `player.stepUp = 0.35` (the `Player.js` hook in §10), so kerbs, terraces and ramps are walkable.
  *As built (U2, after the 1.1.1 merge):* the shared engine now climbs a ledge up to 0.35 m from the ground and follows the ground down as far, for both games, so there is no edition hook; every place is built to that rule.
- Walkable water is ≤ 0.6 m deep. Deeper water has an invisible blocker, or sends Kai back to the last checkpoint with a visible route nearby.

### 4.6 Interiors made open

1. An interior borders a modelled outside it can see: full-height glass, French windows or loggias.
2. It has at least one sky opening: an atrium, light well, oculus, courtyard, roof terrace, or a collapse in some year.
3. Rooms hang off a central open space (hub and spoke), never a 4 m corridor chain.
4. Each interior has its own materials and furniture vocabulary. `palette.look` is never a Vessel key.
5. Records, fragments and save points are kit props with the record text: a telling-stone, a ledger on a lectern, a bronze plate, a field-order board, a phone booth, a cairn.

### 4.7 Budgets (per place, checked by test or by `tests/perf.mjs`)

| Item | Budget |
| --- | --- |
| Visible static draw calls | ≤ 70 |
| Sky | 1 draw call |
| Horizon | ≤ 4 draw calls |
| Triangles | ≤ 300k |
| Colliders | ≤ 1,500 |
| Text meshes | ≤ 60 |
| NPCs (named + crowd) | ≤ 24 |
| Skinned actors animated at once | ≤ 16 (freeze beyond 40 m) |
| Instanced vegetation kinds | ≤ 6 |

- An open place is 120–260 m on its short side. Linear traverses (M18, M23) are 100–120 × 360–420 m.
- Every quarter is at least 2,500 m².

### 4.8 No two missions look alike

- **Signature.** The tuple [style, default sky preset, hour bucket, weather, primary landmark] is unique per mission unless `sameAs` is declared both ways.
- **Declared pairs:**
  - `helix` across M2, M3 and M12, plus `helix_v17` for M8;
  - M22 and M23 as composites quoting M1, M2, M3, M4, M6, M11 and M14.
- **Browser check:**
  - At quarter 0's spawn, in each authored year, a 16×16 average hash must differ by ≥ 18 bits between missions, except declared pairs.
  - The top 25% of the frame must not be flat fog colour.

---

## 5. The mission table

The overview comes first. The sheets after it carry the detail: place, open-sky district or
interior, look per year, the years available, REVERSE use, cast, beats from old to new, side
stories, target minutes and cinematic moments.

**Overview.** Years are listed default first. Target is main + optional minutes. "Bible" is the
bible's own target; "today" is the measured v2.0 length.

| # | Mission | Place | Open sky / interior | Years | REVERSE | Target | Bible | Today |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | The Last Normal Day | `rain_south` | open district | 2049 08:14 · "8:13" flicker | — (foreshadow) | 25+10=35 | 35 | 12–18 |
| 2 | Helix Goes Dark | `helix` west wing | interior round an open court; roof terrace; skybridge | 2049 | — (foreshadow) | 27+7=34 | 45 | 14–20 |
| 3 | The First Switch | `helix` east wing | interior + open service yard; 2026 roofless; 2196 ruin | 2049 · 2026 · 2196 | — | 22+6=28 | 40 | 10–15 |
| 4 | The Man from the Last Day | `valley_upper` | open terraces | THE VILLAGE · BEFORE THE FIRE | — | 28+8=36 | 50 | 10–20 |
| 5 | The Village That Never Existed | `valley_river` (+ gorge) | open river bend | THRIVING · ABANDONED · FLOODED | — | 28+10=38 | 55 | 10–20 |
| 6 | The Clockmaker's House | `oldtown` | canal street + light-well house | 2049 · 2026 · 2196 | — | 26+10=36 | 45 | 10–20 |
| 7 | The Broken Observatory | `observatory` | open plateau, rings | THE FIRST SKY · 2049 · 2196 | — (enemy-side) | 30+8=38 | 65 | 10–20 |
| 8 | The First Death | `helix_v17` | interior round a river court | 2049 V17 · 2026 | — (display plays back) | 30+8=38 | 45 | 10–20 |
| 9 | Nine Minutes to Zero | `northbank` | open hill quarter | 2049 08:05 loop · 2026 | — | 30+8=38 | 60 | 10–20 |
| 10 | Enemies Who Remember | `dam` | galleries on a dam face, open yard and gorge | 2049 · 2026 | — | 30+6=36 | 65 | 10–20 |
| 11 | The Inverted Hospital | `hospital` | pavilions round garden courts | 2049 · 2026 (+ reversed wards) | **UNLOCK**: tutorial ×3, file, lock | 28+8=36 | 50 | 10–20 |
| 12 | The Man Behind the Glass | `helix` north wing + roofs | roofs, open 2026 site, sinkhole | 2049 · 2026 · 2196 | stair (follow him), beam | 30+6=36 | 70 | 10–20 |
| 13 | The Nine-Minute War | `warport` | open port | 2049 · 2026 · 2196 | shell, burial, wall | 32+8=40 | 75 | 10–20 |
| 14 | Welcome to 2196 | `drowned` | open lagoon city | 2196 · 2049 · 2026 | lift car, transit bridge, prints | 30+8=38 | 50 | 10–20 |
| 15 | The City That Forgot Tomorrow | `lockcity` | open stadium bowl | 2196 · 2026 · 2049 | ink ×2, departure flaps | 30+10=40 | 65 | 10–20 |
| 16 | The Museum of Failed Worlds | `sinkhole` | open quarry, cave alcoves | 2196 · 2026 · 2049 | reel, case | 30+8=38 | 55 | 10–20 |
| 17 | The Witness's Archive | `array` | open desert, roofless hall | 2049 · 2026 · 2196 | recordings, patrols (mimics counter) | 32+6=38 | 70 | 10–20 |
| 18 | The Fracture | `fracture` | open traverse | 2196 · 2026 · 2049 | slabs, surge, porch | 32+8=40 | 60 | 10–20 |
| 19 | The Place Outside Time | `unwritten` | open mirror plain | 2049 · 2026 · 2196 | reflection lag | 30+8=38 | 60 | 10–20 |
| 20 | Mira's Memory | `memory` | house open to its garden | THE BLUE DOOR · THE FIRST EXPERIMENT · WITHOUT KAI | refused everywhere (R6) | 30+10=40 | 55 | 10–20 |
| 21 | The Last Battle of the Continuum | `spire` | open terraces above clouds | 2049 · 2026 · 2196 | the elites' rewind, arena bridges | 34+6=40 | 75 | 10–20 |
| 22 | The First Second | `firstsecond` | open radial composite | 2026 · 2049 · 2196 | seals, clock arm; memories refuse | 30+8=38 | 50 | 10–20 |
| 23 | Afterzero | `afterzero` | open route composite | 2026 · 2049 · 2196 | settlement bridge (+ the Witness's hold) | 40+10=50 | 90 | 10–20 |

**Totals.**

| Chapter | Minutes |
| --- | --- |
| Prologue | 97 |
| Act I | 186 |
| Act II | 186 |
| Act III | 194 |
| Act IV | 156 |
| Finale | 50 |
| **Main path** | about 11.5 h |
| **With side stories** | about 14.5 h |

Today's total is about 5–7 h.

**Chapter cards.** These show the bible's question (§8.9 has the audio):

| Card | Question |
| --- | --- |
| PROLOGUE — THE ZERO SECOND | "What happened, and why does the voice know Kai?" |
| ACT I — THE WORLD THAT REMEMBERS | "How can the machine predate its inventors?" |
| ACT II — THE NINE-MINUTE WAR | "Is the Witness protecting Kai or controlling him?" |
| ACT III — THE LAST VERSION OF EARTH | "What did the previous attempts cost?" |
| ACT IV — THE UNWRITTEN SECOND | "Can Mira be saved without repeating the catastrophe?" |
| FINALE — AFTERZERO | "What must be accepted rather than fixed?" |

**Reading a sheet**

- **Old** is today's build, measured.
- Threads are numbered `n.` with minutes in brackets.
- Lines marked **(bible)** are verbatim. Every other line given here is authored and should be used; writers fill the rest within the budgets of §8.10 (speech) and §9.8 (length).
- Speaker keys follow §8.4.

---

### M1 — THE LAST NORMAL DAY (Prologue)

**Place: `rain_south`** (style `rain2049`, atlas south of the Ring Hill).

- An open-sky district, 180 × 240 m and flat.
- A 2.4 m brick embankment carries the rail line, and a 16 m canal is crossed by the checkpoint bridge.
- Walk-in shopfronts (laundromat, noodle bar, florist) have street windows. The station is an open platform under a 70 m ribbed steel-and-glass arched canopy.
- Architecture:
  - 6–12-storey brick-and-glass mid-rises with lit shopfronts, and two 35–45 m glass towers by the station;
  - tram wires and ad screens ("HELIX: WE STUDY CLOCKS");
  - bus shelters, bollards, scooters, cars, gutters and puddles;
  - umbrella crowd paths.
- Backdrop:
  - Helix's white crescent and glowing oculus on the Ring Hill, 400 m north;
  - the Notch faint to the NE;
  - harbour cranes to the south;
  - skyline east and west.

**Years** (no year card in M1; the Chronolith is not yet his):

| Year | Look |
| --- | --- |
| PRESENT 2049, 08:14 | Dark overcast morning: zenith #2e3a4a, horizon #7d8a99, sun hidden ESE at 10°, fast clouds (cover 0.95), rain, fog #6f7c8c ×1.6. Shops #ffd9a8, LEDs #cfe4ff, Helix amber #ffc06a. |
| PAST "8:13" (the flicker) | Lighter rain, one low sunbreak east, clocks running, the 41 on the viaduct. |
| After the Zero Second | A black ring-shaped hole opens in the clouds over the station (Sky feature). |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 HOME & MARKET | `door4B` (spawn, stoop, `photoByDoor`), `marketLane`, `toyChild`, `floristStall`, `noodleAlley`, `laundromat` (the camera feed), `pocketPark`, `puddle`, `pigeonLedge` |
| Q1 TRANSIT PLAZA & CHECKPOINT | `plazaClock` (the backward clock on a 6 m cast-iron pillar), `tramStop`, `photoBooth`, `rookCall`, `checkpointBooth`, `checkpointQueue`, `towpath` (fragment), `fireEscape` → `roofTerrace` (optional anomaly, view of Helix) |
| Q2 LINE 41 | `platform`, `junBooth`, `relay41B`, `maintGate41B`, `boardSign`, `viaduct`, `carriageDoor`, `busDepot`, `staffGate` (Helix staff gate at the foot of the Ring Hill stair) |

**REVERSE.** None. As foreshadowing, the toy's jump back into the child's hand gets the REVERSE shimmer, the reversed swell and inward dust, and the backward clock a reversed tick.

**Cast:**

- **Named and tier-2:**
  - Kai;
  - Officer Pryce (`guard`, `rb_security_f/helix`);
  - Jun (`rb_jun`);
  - the woman (`rb_mira/raincoat`, always distant, in rain);
  - the Child after the Zero Second (`rb_child_f`, hologram, no shadow);
  - the toy child (`rb_child_m2/red raincoat`, silent);
  - the Florist (`rb_florist`);
  - the trapped woman (`rb_civ_f1/wet`) and the trapped man (`rb_courier`);
  - Rook (phone, fx `radio`);
  - the VOICE (WITNESS voice, fx `pa`).
- **Crowd:** 18 commuters (`rb_civ_f1`, `rb_civ_f2`, `rb_civ_m1`, `rb_civ_m2`, `rb_courier`), Helix contractors in the queue (`rb_contractor`) and platform staff (`rb_captain_m`), with umbrellas. After the crash, EMS crews (`rb_medic_f`).
- **Watchers:** none.

**Beats.**

*Old:* one district; a custom beat with 7 objectives (anomalies, Rook's call, checkpoint, station, Zero Second, rescue, voice and Mira) plus chain A.

*New:*

- **Cold open** [2]: cinema on Helix across the river before dawn; one window pulses.
  - NONE "Rain City. 05:40."
  - NONE "At Helix Temporal Research, a card opens Chamber One. The name on the card is KAI VAREN."
  - NONE "Kai Varen is asleep, four kilometres away. His phone lights once on the table. One voicemail. He does not wake."
  - Title card. Then 08:02 at door 4B:
  - KAI "Twenty-three years today."
  - KAI "I'll go after work. I always go after work."
  - KAI "The 41 is late. The 41 is never late."
- **Threads:**
  1. The photo by the door: a girl in yellow boots (`ev_mira_photo`). [2]
  2. The avenue's anomalies, 3 of 5 needed (keep the toy, the backward clock and tomorrow's camera feed; add a puddle that ripples before the drop lands and a pigeon that lands backwards). Then a deduction at the plaza: "Everything odd is running backwards toward the same minute: 8:14." [5]
  3. Rook's call (keep). [1]
  4. The checkpoint (Officer Pryce, Helix Security, 40s). All four intents get Kai through: investigate sets `ev_card_0540`, comfort sets `trust_guard`+1. [3]
     - PRYCE "Helix? Badge."
     - KAI "Varen. Temporal systems."
     - PRYCE "Says here you badged into Chamber One at 05:40."
     - KAI "At 05:40 I was asleep."
     - PRYCE "Then somebody's been sleepwalking with your card."
     - Investigate: KAI "Who else came through at 05:40?" PRYCE "Nobody. That's what bothers me. The door logged you. The camera logged an empty corridor."
  5. The station before zero: Jun and the board. [2]
  6. **The Zero Second** (cinema). [2]
  7. The rescue of two people (keep). On the second, the glass cuts his wrist (`wrist_cut`). [4]
     - NONE "The broken door glass opens your wrist on the way out. A clean curve, like a bracket."
     - MAN "Your wrist—"
     - KAI "It's nothing. Go."
  8. Rook's bible exchange (bible, keep speakers): "The event lasted one second." / "What event?" / "That's the problem. Every recording says it hasn't happened yet." Then the VOICE in every speaker and the woman. [2]
     - VOICE "Kai Varen. Do not build the machine." (bible)
     - KAI "She has our mother's face. She has Mira's eyes."
  9. **Pursuit** (chase): the woman walks a path 10–14 m ahead through the evacuating crowd and vanishes at `staffGate`. On the wet steps lies a yellow raincoat, an item Kai keeps (`raincoat`). [3]
  10. Hook. [2]
- **Hook:**
  - KAI "She died twenty-three years ago. I was at the funeral. I was twelve."
  - NONE "One voicemail. Received 05:40. Caller unknown." KAI "Not now."
  - NONE "The staff gate is open. Nobody is checking badges any more."
  - The voicemail plays in M12.

**Side stories:**

- Chain A, **Last Train Home** (keep, 8 min). Add Jun's 8:13 echo: JUN "Line 41, platform two, on time. On time."
- **The Florist** (3 min). It sets `ev_florist`, a receipt for 08:04. Ten minutes later Kai gets the scar.
  - FLORIST "White chrysanthemums. Same as every year."
  - KAI "Same as every year."
  - FLORIST "Funny. You already came in. Ten minutes ago."
  - KAI "I didn't."
  - FLORIST "Grey at the temples, same coat, a scar on the wrist. Paid cash. Said you would come in and say you didn't."
  - KAI "I don't have a scar."
  - FLORIST "Then he was a very good impression."
- **The Child** (2). She hums up, up, stop (`ev_three_notes`) and has no shadow.
- **The photo booth** (1). A strip of three photos of the Child dated 2026, 2049 and 2196. Opens the case **The Child in Three Photographs**.

**Choices → later:**

- Jun: line or evidence → M2 (with the evidence, Kai can put Rook's own order to him), M15 (The Train), M23.
- `trust_guard` → M8 (Pryce opens the staff door).

**Target:** 25 + 10 = 35 min (bible 35, today 12–18).

**Cinematic & audio:**

- Score region `rain_city` (92 BPM, A aeolian).
- Beds: rain, traffic hiss, crowd walla, PA chimes. PAST: the same two bars lowpassed, with a louder platform tick.
- Anomalies: the toy gets a reverse-bounce, the clock a reversed tick, the camera a static glitch.
- **Zero Second:** ticks stop; music, ambience and effects drop for 1 s while the narrator's "All the clocks stop." stays audible; then a low metallic resonance, the 41's horn doppler, brakes and impact.
- The VOICE plays through fx `pa`.
- The 41-second announcement moves to the PA speaker with a two-tone chime, and the "[ANNOUNCEMENT]" tag is removed from the text.
- The Mira glimpse plays her motif with reversed tails. The Child's song is played on a music box. The hook ends on the `cliff` cue.

**Must not look like:** M14 (the same city's downtown as a 2196 lagoon) or M9 (Northbank at the sunbreak). M22 and M23 quote it on purpose.

---

### M2 — HELIX GOES DARK (Prologue)

**Place: `helix`, `wing: 'west'`** (style `helix`).

- Footprint 140 × 140 m. Minutes after M1, at night in the storm.
- The crescent west wing (3 storeys, 18 m deep) wraps the 64 m round **Helix Court**: wet stone, a ring of young lindens, and at its centre the **oculus**, a 20 m glass-and-steel lens glowing #4f9fe8 from the chamber below.
- `Build.js` rooms are placed round the court (`at`/`rot`/`roof`/`windows`), with full-height glass on the court side. They follow the bible's M2 map (ENTRY → DARK CORRIDOR → POWER ROOM → LIFT, optional ARCHIVE).
- Materials: white composite panels, brushed steel, glass, black rubber floor. No yellow pillars, hazard stripes, pipe runs or gears.

**Years.** PRESENT 2049 only:

- sky zenith #0b0f16, horizon #2a2f3a, city glow #3a2a20;
- storm with lightning;
- emergency red #ff6a48 and amber #ffb36b inside;
- court bollards #9fd8ff.

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 SECURITY | `lobby` (double-height glass, turnstiles, terrazzo; lightning lights it), `lobbyIntercom`, `sitePrint` (the Site Zero print case), `linPeg`, `cameraRoom` (optional) |
| Q1 THE DARK CORRIDOR | `westGallery` (60 m curved, glass to the court, rain streaming; drone loop), `linDesk` |
| Q2 POWER | `plantTerrace` (roof, open sky in rain; chillers, cable trays; `cellA`, `cellB`, `cellC`; `ivenPost` under a canopy), `staffLounge` (records: recorders, roster, door log) |
| Q3 CONDUIT & ARCHIVE | `skybridge` (40 m glass bridge over the court at 8 m; `conduit`; look down at the court, up at the storm), `readingRoom` (old wood, one green lamp: Mira's file, `passDrawer`, the drawing) |
| Q4 THE CHAMBER | `liftAtrium` (glass lift into the oculus), `chamberDoor`, `chamber` (round, 24 m across, 12 m high, rain on the lens above the black ring) |

**REVERSE.** None. The security unit that rewinds its damage shows the REVERSE shimmer and sound on its body, as foreshadowing.

**Cast:**

- Dr. Lin (`researcher`, `rb_mira/lin`, speaker LIN, no shadow under emergency light).
- Iven (`rb_engineer_m`).
- Rook: intercom, then **in person** at the door (`rb_rook`).
- Recordings as holograms: Pryce (`rb_security_f`, the face from the checkpoint), Haig (`rb_civ_f2/home`), Dale (`rb_security_m`).
- A cleaner (crowd `rb_civ_m2/overall`, one bark).
- Watchers: the Helix security drone, plus a heavier drone for the damage-rewinding unit (both edition-built).

**Beats.**

*Old:* 7 hand-built rooms with the Vessel Engineering look, and 4 objectives (drone, cells, officer, unit) leading to the drawing and the chamber.

*New:*

- **Cold open** [2]: residue audio over the dark lobby. Kai is not there.
  - IVEN "Test's at 05:40 now? Who moved it?"
  - ROOK "My office."
  - IVEN "Then your office can sign for it. I'm not signing."
  - ROOK "Nobody is asking you to sign, Iven."
  - IVEN "Good. Nobody signs for it. Write that down."
  - NONE "05:40. Every light in the building goes out."
- **Threads:**
  1. Rook on the intercom (keep). [1]
  2. The lobby and the Site Zero print (`ev_site_zero_print`): "THE SITE ZERO PRINT — c. 1077 BC — ITS TREAD HAS NEVER BEEN EXPLAINED." KAI "Helix's mascot. Every intern gets a mug." [1]
  3. **Dr. Lin.** She replaces today's researcher. Kai is carrying the yellow raincoat, and Lin's peg is empty and dripping. [3]
     - LIN "Don't go to the lift. The lift is dead. Everything below three is dead."
     - KAI "Rook said system failure."
     - LIN "Rook said it twice. Systems don't scream, Kai. Something screamed."
     - KAI "Have we met?"
     - LIN "Everybody asks me that this morning. I've been here six weeks. Nobody remembers hiring me."
  4. The dark gallery and its drone (keep). [4]
  5. Power: three cells and Iven, chain D (keep). [6]
  6. Records: the three officer recordings, the roster, the door log, and the deduction (keep; `officer_trusted`). [4]
  7. The skybridge conduit and the rewinding unit (keep). [4]
  8. The archive: Mira's file and the drawing (keep), with the bible exchange "This drawing is twenty-three years old." / "Then someone has been using your credentials." / "I was twelve." New: the junior pass drawer, "VAREN, K. — JUNIOR PASS — CHAMBER ACCESS: NO", stamped "OVERRIDE 14-03-2026 16:02" (`ev_junior_pass`). [3]
  9. **Rook blocks the chamber door**, in person (bible: he blocks access). [3]
     - ROOK "The chamber is off limits."
     - KAI "You called me in."
     - ROOK "Because you built the activation system, Kai. Did you think it was for clocks?"
     - Intents:
       - challenge, which needs `jun_evidence` or the door log: KAI "You moved the test to 05:40." ROOK "I moved a test. I did not move a second. Something else did that."
       - investigate: KAI "Who used my card?" ROOK "Your card. Your access. Your machine. You tell me."
       - comfort: KAI "Elias. What happened?" ROOK "I don't know. That is the truth, and I hate it."
     - Every choice ends: ROOK "Go in, then. You were always going to." It sets `trust_rook` to −1/0/+1.
  10. Enter the chamber and touch nothing. [1]
- **Hook:**
  - NONE "A black ring, taller than the room should allow. It is not running. It is waiting."
  - KAI "Mira drew this. Before any of it was built."
  - NONE "In the black stone his reflection arrives half a second late."

**Side stories:**

- **Lin's desk** (2): a badge reading "PHOTO PENDING SINCE 2026", and a dream notebook: "the song again — up, up, down".
- **Iven's locker and team** (3, exists).
- **The camera room** (2): the 05:40 feed shows an empty corridor and a door opening by itself (`ev_empty_corridor`).
- A cleaner's bark: "The ring was humming at five. It hums a song."

**Choices → later:**

- The officer code → Dale in M8 and M10.
- `trust_rook` → the opening line of M8's confrontation.

**Target:** 27 + 7 = 34 (bible 45, today 14–20).

**Cinematic & audio:**

- Score `helix`, emergency layer: 84 BPM, D phrygian, bowed-metal drone, sparse piano, a two-note alarm every 8 bars.
- Bed: hum, distant alarm, a pump running backwards.
- Recordings play in the speakers' own voices with fx `recording`; Mira's file is a recording too.
- The drone has a servo whine and a scan chirp; the unit a reversed crunch.
- 3 of 3 cells plays a rising chord. The chamber gets the `reveal` cue.

**Must not look like:** M3 (dawn, three years), M8 (the V17 full ring at a still afternoon), M12 (north roofs at sunset).

---

### M3 — THE FIRST SWITCH (Prologue)

**Place: `helix`, `wing: 'east'`.** The court and the chamber are deliberately M2's, now seen in three years.

- **2026:** the campus under construction.
  - The east wing has no roof (sky through the slabs).
  - Bare concrete frame, rebar, scaffold stairs, a tower crane over the court, tarps.
  - The **open dig at Site Zero** below the unfinished chamber.
- **2196:** a ruin.
  - Roof slabs have fallen into the machine hall (the parked lift plus a slab ramp).
  - A linden grows through the oculus; ivy curtains, pools, birds.
  - The valley below is drowned, with the sea on the horizon.

**Years:**

| Year | Look |
| --- | --- |
| PRESENT 2049 | Cold washed dawn after the storm: zenith #6a8cc0, horizon #e8d8c8. The sun at 4° rises **in the Notch** (#ffcf9a), the first clear view of it, planted as a clue. Puddles, no rain. |
| PAST 2026 | Harsh hazy noon: sky #dfe6ea, white sun at 70°, dust motes, saturation 0.86. |
| FUTURE 2196 | Misty green dawn: fog #c8dcc8 ×2, sun 8° #e6ffe8, pollen, birdsong. |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE CHAMBER | `chamber`, `ringTouch` |
| Q1 TEMPORAL LAB | `temporalLab` (east wing ground floor, glass to the court), `cableSocket` (2026), `powerPanel` (2049) |
| Q2 THE DIG | `excavationHut` (2026 site hut on the open dig: `excavationLog`, `thermosER`, `footprints`, `polaroid`) |
| Q3 MACHINE HALL | `machineHall` (30 m high, gantry crane, floor collapsed into the plant level), `lift2196`, `plaque2196`, `serviceYard` (open, between the wing and the hillside; Iven's team; the 2049-only drone) |
| Q4 CONTROL | `controlRoom` (top floor, panoramic window over the valley, `keycard`, `controlPanel`) |

**REVERSE.** None.

**Cast:**

- Iven (`iven3`).
- His team: `tech_0` and `tech_2` on `rb_contractor/helix slate`, `tech_1` on `rb_civ_f2/coverall slate`. Iven's face is no longer cloned.
- 2026 builder echoes: `rb_contractor`.
- Rook on comms (fx `radio`).
- Watcher: the 2049-only drone.

**Beats.**

*Old:* 5 rooms with the eng look; puzzles cable (2026), power (2049), lift (2196), keycard (2026 plus the anchor), drone (2049 only).

*New:*

- **Cold open** [1]:
  - NONE "It is cold, and then it is every temperature it has ever been."
  - NONE "The cut on his wrist closes into a circle with a broken halo."
  - KAI "It sealed it." (`wrist_mark`)
- **Threads:**
  1. The first cycle, with the bible exchange "Which one is real?" / "All of them. That's why this is dangerous." (keep). [3]
  2. The cable in 2026, then the power in 2049 (keep). [4]
  3. **The 2026 excavation office**, four clues (`ev_site_zero`, pinned under Act I's question): [4]
     - "SITE ZERO — EXCAVATION LOG — E. ROOK: found in a riverbed drained long before any record";
     - a thermos marked E.R.;
     - two children's footprints in the plaster dust, one small, with a star tread (yellow boots);
     - a Polaroid of the ring half dug out.
  4. The machine hall, crossed by the 2196 lift (keep). [3]
  5. The 2196 plaque: "HELIX — WHERE THE FRACTURE BEGAN — WE REMEMBER." KAI "Remember what?" [1]
  6. Control: anchor the keycard (keep). [4]
  7. The panel and the fracture. [3]
     - KAI "Connected in 2026. Switched on in 2049. That should not work."
     - ROOK "It works. That is the problem."
- **Hook:**
  - ROOK (radio) "Kai, the chamber is reading a date. It's reading—"
  - KAI "Read it to me."
  - ROOK "That isn't a date. That's a number. Minus three thousand and—"
  - NONE "The floor remembers being earth. The walls remember being nothing."
  - NONE "Kai Varen falls out of 2049 and lands somewhere older than the building."

**Side stories:** Chain D, **The Technician's Key**: Iven's route, the team or the log (exists, 6).

**Choices → later:** Iven's team or the log → M8 (Iven in person or as a record), M18 (The Last Signal), M21 (ally either way).

**Target:** 22 + 6 = 28 (bible 40, today 10–15).

**Cinematic & audio:**

- `helix` with real per-year layers:
  - 2049: emergency fading to a cold dawn pad;
  - 2026: warm strings with distant construction;
  - 2196: wind, rain on the ring, glass tones.
- Each forced switch in the first cycle plays the transition signature and a 1.5 s layer crossfade.
- **The fracture:** a reversed whiteout swell, then 0.8 s of silence (the voice kept), then a falling glissando and a landing thud. Then `cliff` and the Act I chapter card.

**Must not look like:** M2 (night storm), M8, M12.

---

### M4 — THE MAN FROM THE LAST DAY (Act I)

**Place: `valley_upper`** (style `settlement`).

- The Ring Hill 3,000 years earlier. 200 × 200 m on four terraces (0 / 3 / 6 / 10 m) joined by stone stairs and ramps.
- Architecture:
  - stone footings and timber walls under 5–7 m conical thatch;
  - a longhouse, stilt granaries, dry-stone terrace walls;
  - looms, drying racks, pottery;
  - broken-halo marks inlaid in bronze on the lintels (impossible technology made part of the culture);
  - cypress, olive and barley terraces.
- No lamps and no Latin. Records are carved stones.
- Backdrop:
  - the river valley to the south, with no city;
  - the sea a thin line far south;
  - the Notch to the NE;
  - the Ridge to the east, where the observatory's rings glint (foreshadowing M7).

**Years:**

| Year | Look |
| --- | --- |
| PRESENT "THE VILLAGE" | Golden late afternoon: sun 14° W #ffb870, sky #6a9ad0 → #f6d7a8, cirrus, cooking-smoke columns, pollen, fog #d8c8a8 ×0.8. |
| PAST "BEFORE THE FIRE" | Blue pre-dawn: valley mist #9fb0c8 ×2.2, the last stars. No houses: the ring alone in tall grass, hide tents, the first campfire. The open meadow gives shortcuts across the terraces. |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE FIRST FIRE (lower terrace) | `blanketHouse` (spawn), `firePit`, `granary`, `lintelHouse` (fragment), `pictoFire`, `pictoWater`, `pictoRing`, `tellingStone` (on a house roof, reached by a log stair) |
| Q1 THE WATER STEPS (middle terrace) | `waterSteps` (fragment), `cistern`, `stele` (the contradiction), `grainStore` (fragment) |
| Q2 THE RING (summit) | `ring` (24 m ring of 9 m standing stones with a bronze band), `elderSeat`, `underStair`, `underChamber` (open to the sky through the ring; `panels` ×4; `card`), `childRingCord` (BEFORE THE FIRE only) |

**REVERSE.** None.

**Cast:**

- The Elder (`rb_elder`, madder wool, staff, slow walk).
- Niko (`rb_niko`, undyed linen).
- Crowd:
  - men on `rb_robe_m` (ochre, indigo, undyed, madder, plain head cloth);
  - women on the `rb_tala` mesh, recoloured umber or ochre (Tala does not appear in M4; she is first met in M5's cold open);
  - girls on `rb_child_f2` in linen.
  - *As built in the closing pass:* the settlement's own faces (§6.3), never a named one: `rb_vill_m`, `rb_vill_m2`, `rb_vill_f`, `rb_vill_f2`, the old `rb_elder_m` (the storyteller) and the boys and girls on `rb_child_m2`, in the `fire` dyes; the Elder (`rb_elder`, Adults/Female_Adult_09, her hair greyed) in a madder-red wool tunic to the ground under a dark cloak, with her staff.
- In THE VILLAGE: a craftsperson and a storyteller with lines (crowd voices). No watchers.

**Beats.**

*Old:* 3 settlement districts under a dome, with lamp posts, a "BRIDGE CLOSED" sign, neon nooks, a terminal for the telling-stone; arrival / contradiction / encounter.

*New:*

- **Cold open** [2], from the villagers' side at night:
  - NIKO "Elder. By the ring. A man. He fell out of the stars."
  - ELDER "Is there dust on him?"
  - NIKO "None."
  - ELDER "Then it is him again. Put a blanket over him. And do not tell him he has been here before. He never believes it."
  - Cut to golden late afternoon: Kai wakes under a blanket. NONE "He has slept through a day."
- **Threads:**
  1. Waking. Children follow him (bark: "You wear no dust, but the old story knows your face."). The mark on his wrist. [2]
  2. Learn the visual language: three pictograms (fire, water, and the circle with a broken halo, which is his mark). [3]
  3. The telling-stone on the roof (existing log; a climb). [3]
  4. The ring's inscription and its residue (existing contradiction). [3]
  5. The Elder at the ring, with the bible exchange: "You came before the first fire." / "I've never been here." / "That is what the others said." She recognises the mark. Intents follow. [3]
  6. Three inscription fragments as objects in three places (`lintelHouse`, `grainStore`, `waterSteps`; one is visible only BEFORE THE FIRE). They read "WHEN THE ONE WITH NO DUST RETURNS, SHOW HIM THE DOOR. / HE WILL SAY HE HAS NEVER BEEN HERE. / HE IS NOT LYING. HE IS EARLY." [5]
  7. **The meal at the first fire**, about "the others". The grey one is the Witness. [3]
     - CRAFTSPERSON "The first one came with a cut wrist, like yours, and asked for water."
     - STORYTELLER "One came grey, and would not speak, and sat by the ring until it took him."
     - CHILD (village girl, crowd voice) "One of them cried."
     - ELDER "Every one of them said: I have never been here."
  8. The under-chamber: order four carved panels (construction, prosperity, destruction, abandonment). The clue is the ash layers at the fire pit: cooking, feasting, nothing, cooking. [4]
  9. The card, then the hook. [2]
- **Hook:**
  - NONE "Under the ring, on a floor nobody has swept in three thousand years: a Helix access card. VAREN, K. ACCESS: ALL."
  - NONE "The photograph is worn. The man in it has grey at the temples."
  - KAI "That's me. That's me in twenty years."
  - NIKO "Now you have read it. Now you are not early any more."
  - The ring hums.
  - NIKO "It wakes when you come. Tomorrow it will show you the river."

**Side stories:**

- **The child's stone ring** (4): find the cord ring in BEFORE THE FIRE and give it back to the girl who lost it; it is the worn ring of the fragment "the child who wore it is three thousand years dead".
- **Niko's questions** (3): "What is it like, where you come from?" Answer with the truth, a story, or nothing (`niko_told` = truth / story / none).

**Choices → later:** `niko_told` → the M5 mural, a 2196 children's rhyme in M14, and the M22 wall.

**Target:** 28 + 8 = 36 (bible 50).

**Cinematic & audio:**

- Score `settlement` (82 BPM, E dorian; frame drum, breathy flute, plucks). THE VILLAGE has the full ensemble with walla; BEFORE THE FIRE has flute and wind only.
- Beds: water, fire crackle and birds; in the past, wind and water.
- The under-chamber card gets `reveal` and the low motif.

**Must not look like:** M5 (river bend, three centuries) or M7 (bronze and height).

---

### M5 — THE VILLAGE THAT NEVER EXISTED (Act I)

**Place: `valley_river`** (style `river`).

- The lower village at the river bend, 200 × 220 m, with a 14 m river.
- The Ring Hill rises directly over the lower basin, with its standing stones on the crest.
- An **upstream gorge quarter** (90 × 120 m) holds chain B: three stone gates on three cascade levels, an aqueduct arch, a painted-over mural cliff, ferns and dappled light.

**Years** (labels THRIVING / ABANDONED / FLOODED):

| Year | Look |
| --- | --- |
| PAST, THRIVING | Bright clear midday: sky #4f8fd8 → #d8ecf8, river #3f8fc0. Washing lines, boats, fish racks, water keepers. |
| PRESENT, ABANDONED | Flat grey overcast afternoon (#9aa0a4). Roofs collapsed, thatch gone, the dry channel a path. Weeds, crows, drizzle mist. |
| FUTURE, FLOODED | A water plane at +4 m over the lower village. Roof cones, the wall top and the gate tower stand out as the stepping route. Teal light, a low heavy sky with sun shafts (#9fd8c8), reeds. |

Persistent consequences are era swaps:

- river diverted → the low-bank houses stand in ABANDONED and FLOODED;
- wall braced → the flood has an edge;
- gate released → the basin is drained, exposing the machine.

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE HEAD-STONE | `weir`, `millRace`, `headStone` (the sluice), `waterMill` |
| Q1 THE RETAINING WALL | `wall80` (an 80 m timber-braced stone wall), `wallBrace`, `stiltHouses`, `jetties`, `tallyWall`, `coldHearths`, `muralWall` |
| Q2 THE PRESSURE GATE | `gateTower`, `basin`, `buriedMachine` (clean, humming panel after the release), `cairnSite` |
| Q3 THE UPPER GORGE (side) | `dryChannel`, `gate1`, `gate2`, `gate3`, `aqueduct`, `muralCliff` |

**REVERSE.** None.

**Cast:**

- Niko; Tala (side story).
- THRIVING crowd as in M4 (old and child included). In ABANDONED and FLOODED the same villagers are Tier-4 hologram echoes.
- No watchers.

**Beats.**

*Old:* 3 settlement districts identical to M4's, with a canal and echo bridge; scenes divert / wall / gate; no choice.

*New:*

- **Cold open** [1], night at the head-stone:
  - NIKO "The keepers said: never show him the river."
  - TALA "The keepers also said he always finds it."
  - NIKO "Then I would rather he found it with me."
- **Threads:**
  1. Niko follows Kai, with the bible exchange: "You keep changing the world." / "I'm trying to get home." / "Then stop changing it." [2]
  2. Divert the river at its head in THRIVING (keep). [4]
  3. **Why did they leave?** (ABANDONED): tally marks "THE RING TOOK THREE", a family's names on the wall stones, cold hearths. [6]
     - CRAFTSPERSON (echo) "It took the potter's son. He only touched it."
     - KAI "They didn't leave because of the flood. They left because the ring kept taking people."
     - NIKO "It took them when you came. Every time you came."
     - KAI "Then they left because of me."
  4. Brace the wall in ABANDONED (keep). [4]
  5. Release the gate in FLOODED (keep). [4]
  6. The mural in ABANDONED shows what Kai told Niko in M4. [2]
  7. Uncover the buried machine. [3]
  8. Niko's choice, the reveal and the hook. [3]
     - NIKO "Bury it again, or leave it for whoever comes?"
     - Bury it under a cairn in the broken-halo pattern, or leave it exposed (`machine_buried`).
- **Hook:**
  - NIKO "Helix did not invent the machine. It found it." (the bible ending)
  - KAI "You can't know that word."
  - NIKO "It is written on the card you carry."
  - The machine recognises the mark and the valley folds.
  - NONE "Ticking. Hundreds of clocks, none of them agreeing."
  - CLOCKMAKER (from upstairs) "You're early. You were expected in the ninth minute."

**Side stories:** Chain B, **The Water That Remembers** (10, moved here from the Cases). Follow the water marks, read the mural cliff, and align Tala's three stone gates without flooding the houses (THRIVING). It sets `water_route`.

- TALA "You ask where the river began. We ask who taught it to stay."
- KAI "A river cannot remember."
- NIKO "Then you have not listened long enough."

**Choices → later:**

- `machine_buried` → Rook's M8 log ("under a cairn somebody built with care" or "lying in the clay as if left for us") → M22's chain. Helix finds it either way; the first cause cannot be undone, which is the theme.
- `water_route` → M7 (Niko's extra clue), M14 (the garden channel runs), M18 (the canyon shortcut), M23 (Tala).

**Target:** 28 + 10 = 38 (bible 55).

**Cinematic & audio:**

- `settlement` per year:
  - THRIVING: full ensemble with crowd voices;
  - ABANDONED: drum alone, wind through empty houses;
  - FLOODED: the whole mix lowpassed to 600 Hz, with slosh and drips.
- Switching to FLOODED plays a water surge.
- Each of the three gorge gates sounds a note; the correct order plays the three-note motif.

**Must not look like:** M4 (no terraced summit, no golden evening).

---

### M6 — THE CLOCKMAKER'S HOUSE (Act I)

**Place: `oldtown`** (style `oldtown`). Rain City's Old Town on the old river terraces; M5's river is now a stone canal, a consequence made visible.

- **Exterior**, 120 × 140 m: a canal street, humpback bridges, plane trees, cobbles, and 4–5-storey townhouses with steep slate roofs, dormers, shutters and ground-floor workshops.
- **The house**, Ezra Moll's: a narrow 5-storey corner house (16 × 16 m, 24 m tall) topped by a clock tower with a 6 m exterior face.
  - Inside, an open 6 × 6 m light well runs from the cellar to a glass lantern roof, with galleries on every floor. The sky is always overhead.
  - The repeating brass arm sweeps across the well (the loop hazard).
  - A hidden stair stands in 2026 and was bricked up later.
  - The clock room and roof terrace sit behind the face.
- The cellar is the village's water steps (M5 link).

**Years** (states `['PRESENT','PAST','FUTURE']`):

| Year | Look |
| --- | --- |
| PRESENT 2049 | Autumn late afternoon into evening: sun 12° #f0a860, sky #7aa0c8, falling amber leaves (motes fallback), warm windows. |
| PAST 2026 | Spring morning: blossom, fresh paint, soft #f4ead8. |
| FUTURE 2196 | Winter: frost fog over an iced canal. The lantern is broken and vines hang down the well. The arm has rusted solid and becomes a bridge. A few lantern-lit windows (#c8d0d8). |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 SHOP FLOOR & CANAL STREET | `cellarStair` (spawn), `shopFloor`, `repeatArm`, `canalBridge`, `shopWindows` (three clock faces: 2026 morning, 2049 evening, 2196 noon) |
| Q1 THE GALLERIES | `lightWell`, `galleries`, `floorboards`, `hiddenStair`, `ezraBench` |
| Q2 THE CLOCK ROOM / ROOF | `clockRoom`, `clock2026`, `clock2049`, `clock2196`, `recordingCase`, `roofTerrace`, `clockFace`, `loopSpring` (the 2196 ruin, side story) |

**REVERSE.** None. The arm's repeat count is pinned as evidence, because M22 asks for it.

**Cast:**

- Ezra Moll, the Clockmaker (`rb_ezra`; a 2026 echo on `rb_ezra/ezra65`; a loupe prop).
- The older Kai recording as a `rb_ren_m/witness` hologram.
- Canal-street crowd: present-day civilians in 2049 and 2026 (`rb_civ_*`, `rb_courier`).
- No watchers.

**Beats.**

*Old:* LevelGen rooms with the Vessel "Clockwork Deck" look; arrival / encounter / escapement.

*New:*

- **Cold open** [1], sepia residue, 1999: a hooded man with a scarred wrist pays in advance. WITNESS "Set the arm to repeat. He'll need to learn it."
- **Threads:**
  1. Up through the cellar, which is the village's water steps. [2]
  2. Ezra, who calls Kai "child" throughout (C8), with the bible exchange: [3]
     - CLOCKMAKER "Sit down, child. You're early."
     - KAI "I've never been in this shop."
     - CLOCKMAKER "You said that in 1999 as well. You were greyer then."
     - CLOCKMAKER "You ask what time it is. Wrong question." (bible)
     - KAI "What's the right one?" (bible)
     - CLOCKMAKER "Which version of the question are you asking?" (bible)
  3. Watch the repeating arm and cross the shop floor. [5]
  4. The hidden staircase: compare the floorboards' wear in 2026 and 2049, then deduce. [5]
  5. The escapement: set three clocks in three years, read from the shop-window faces. [6]
  6. Find the recording (WITNESS voice, fx `recording`). [2]
  7. Hook. [2]
- **Hook:**
  - WITNESS (recording) "When the child returns, do not let him see the ninth minute." (bible)
  - KAI "What is the ninth minute?"
  - CLOCKMAKER "He said you'd ask. He said not to tell you. It's the minute before your sister—"
  - NONE "The arm completes its turn. The clockmaker straightens his apron."
  - CLOCKMAKER "Good evening. You're early."

**Side stories:**

- **The Clockmaker's Debt** (bible optional, 10). Find the loop's spring in the 2196 ruin, then choose: release him (a tomorrow) or let him finish his last clock (`ezra_debt`).
  - CLOCKMAKER "He asked me to keep the arm repeating until you came. An arm does not repeat on its own, child. Somebody has to repeat with it."
  - KAI "How long?"
  - CLOCKMAKER "Fifty years of Tuesdays. I liked Tuesdays."
- **Rook's gauge** (2): Ezra repaired Helix's ring gauge in 2026. CLOCKMAKER "A Dr. Rook. Very polite. Very frightened." (C7)

**Choices → later:** `ezra_debt` → M16 (his last clock in a case), M19 (his mark), M23 ("the clockmaker's clock, finished" or "Wednesday. Imagine that.").

**Target:** 26 + 10 = 36 (bible 45).

**Cinematic & audio:**

- Score `clockmaker` (72 BPM): three clocks at 60, 72 and 90 ticks a minute plus a music box playing a corrupted motif. PAST in sync, PRESENT out of sync, FUTURE one slow clock.
- Bed: workshop room tone and clockwork.
- The hidden stair: stone grind and a chime. The Witness line brings in his motif.

**Must not look like:** M1 (modern glass in rain) or any Vessel deck.

---

### M7 — THE BROKEN OBSERVATORY (Act I)

**Place: `observatory`** (style `observatory`). The eastern Ridge, with the village and the Ring Hill below to the west. A 180 × 180 m plateau of stepped stone terraces up to a summit platform at 30 m.

- **The Great Armillary:** a 50 m outer bronze ring on stone piers, carrying a walkable **exterior ring walkway** at 18 m.
- **The three instruments:**
  - the Sun Gnomon (lower terrace);
  - the Star Tube (a 20 m tower with a sighting tube);
  - the Horizon Ring (summit).
- Rotating stone platforms, and astronomers' houses whose flat roofs form the rooftop route.

**Years:**

| Year | Look |
| --- | --- |
| PAST "THE FIRST SKY" (3,000 years ago) | Sunrise **exactly in the Notch** (alignment one). Sky #2a3a6a → #ffb07a, polished bronze, torches. |
| PRESENT 2049 | **Blue hour** with one bright star, a thin moon, survey floodlights, tarps, scaffold walkways, site huts, ring segments lying in the grass. |
| FUTURE 2196 | Golden windy afternoon: tall grass, rings fallen down the slope (a fallen segment is a ramp), and drowned Rain City glinting on the coast. A new star stands in the sky: the Fracture's light. |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE LOWER RING | `gnomon`, `lowerRing`, `astronomerRoofs`, `nikoGuide` |
| Q1 THE INSTRUMENT STAIR | `rotatingPlatforms`, `starTube`, `datesRing` (residue), `scavengerCamp`, `cache` (side) |
| Q2 THE OUTER RING | `outerRingWalk` (18 m), `horizonRing`, `tinSpot` (at the foot of the outer ring) |

**REVERSE.** None for the player. Enemy-side: what the scavengers throw lands where it was a moment ago, with the shimmer.

**Cast:**

- Niko, and an older Niko in the cold open (`rb_niko/older`).
- An astronomer (`rb_robe_m/indigo`). *As built in the closing pass:* the old sage `rb_sage_m/astronomer`.
- Mira's recording (MIRA9 voice; `rb_child_f` hologram).
- Sky-watcher crowd in THE FIRST SKY: `rb_robe_m`, and women on the `rb_elder` mesh (the Elder is absent here). *As built in the closing pass:* the settlement's own faces in the `sky` dyes (§6.3), never the Elder's.
- **Watchers:** temporal scavengers on `rb_scav/lantern`, wearing the Continuum's closed-circle badge, the first sight of that faction.

**Beats.**

*Old:* a ZoneGen "tower" district (relay masts, neon, dome) at night; arrival / contradiction / encounter; no choice; the bible line altered.

*New:*

- **Cold open** [1], THE FIRST SKY: an astronomer and an older Niko align a ring. NIKO "There. The star that isn't up yet."
- **Threads:**
  1. The hill, with Niko as guide. [2]
  2. Instrument one: the sun in THE FIRST SKY throws the gnomon's shadow onto the second ring. [5]
  3. Rooftops, rotating platforms and the outer ring. [6]
  4. The scavengers (stealth); their throws snap back. [5]
  5. Instrument two: a star in 2049's blue hour. Instrument three: the new star in 2196. [5]
  6. The dates, through the existing residue, ending on the bible exchange. KAI "How could they know when I would be born?" NIKO "They didn't know when. They knew who." [3]
  7. Mira's hidden recording: a biscuit tin a nine-year-old buried at the 2026 dig, found in 2049 at `tinSpot`. [2]
  8. Hook. [2]
- **Hook** (MIRA9, fx `recording`):
  - "Kai, it's me. It's Friday. We're at the dig on the hill. The rings have numbers on them and one of them is your birthday."
  - "I asked Dr. Rook and he went white. Like milk."
  - "I think the rings know you. Not that you came. That you'd come back."
  - "Tomorrow I'm going to see the big ring turn. Don't tell Mum." Click.
  - This is the bible ending: the Chronolith has been anticipating Kai.

**Side stories:**

- With `water_route`, Niko's extra clue (3): NIKO "The keepers say the star rises when he stops being early."
- **The scavengers' cache** (3): Kai's keys, the florist's receipt and the raincoat's button, sold by "a man who looked like you, but tired".

**Choices → later:** keep the recording or leave it buried (`mira_tape`). Kept, it plays to Odile in M11 and to the Witness in M21. Left, it becomes an M16 case labelled "A BISCUIT TIN — VERSION 17 — LEFT BY K.V.".

**Target:** 30 + 8 = 38 (bible 65).

**Cinematic & audio:**

- Score `observatory` (60 BPM, lydian; glass harmonics, low cello, wind).
- Rings turning: a metal groan. Aligning the three instruments sounds three bells that complete the three-note motif.

**Must not look like:** M4 or M5 (no thatch or water; height, wind, bronze, sky) or M17 (a modern desert array at night).

---

### M8 — THE FIRST DEATH (Act I)

**Place: `helix_v17`** (style `helix`, `sameAs: helix`). The campus in VERSION 17.

- A **full ring** instead of the crescent: the altered layout, and a fair clue for players who remember M2 and M3.
- **The river now runs through the court**, because of M5. It is a water garden with stepping stones, and the old west wing is gone.
- The oculus is capped by a **glass containment cube**.
- 140 × 160 m.
- The boot-print case has moved to the riverside atrium.

**Years** (states `['PRESENT','PAST']`):

| Year | Look |
| --- | --- |
| PRESENT V17 | A still, grey-violet pre-storm afternoon with no wind and no birds: sky #8a8ea0 → #c8c4d0, saturation 0.78. Calm and wrong. |
| PAST 2026 (this version) | The ring already finished, a small young garden, warm light. |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 STAFF RECORDS | `receptionDesk`, `riverCourt`, `printCase`, `photoWall`, `recordsTerminal`, `linDesk` (north wing, glass to the court), `staffDoor` (Pryce, if trusted), `riverWall` (the climb otherwise) |
| Q1 THE CORRUPTED LOG | `serverRoom2026`, `securityOffice` (3rd floor, balcony over the court), `rookOffice` (window over the river) |
| Q2 THE LAST TEN MINUTES | `reconstruction` (echoes in the court and chamber), `containmentCube`, `versionTerminal`, `groupPhoto` (side) |

**REVERSE.** None. The containment chamber's "last ten minutes" display plays backwards: an environmental cue, not interactive.

**Cast:**

- Rook **in person** (`rb_rook`).
- Lin (`rb_mira/lin`).
- The receptionist (`rb_civ_f1/helix desk`; excluded from this mission's crowd).
- Pryce or Dale, depending on trust (`rb_security_f` / `rb_security_m`).
- Iven in person or as a record (M3).
- Altered staff: `rb_doctor_m` researchers (stethoscope hidden) and `rb_contractor` technicians.
- Watchers: Helix drones.

**Beats.**

*Old:* LevelGen "arch" rooms with the helix2 look (identical to M12); arrival / contradiction / containment; no choice; the record "VAREN, K. … deceased 2026".

*New:*

- **Cold open** [1]:
  - RECEPTIONIST "Helix Temporal, good afternoon. No, we have no Kai Varen. There was a Varen in the junior programme. Mira. She died in 2026."
  - NONE "The doors open. Kai Varen walks in. Outside, nothing moves. Not even the flags."
- **Threads:**
  1. What changed: the river through the court, the moved print case, the staff photo wall. [4]
  2. Staff records, revised: "VAREN, M. — junior programme — deceased 2026". Lin has no start date; her previous employer is "HELIX JUNIOR PROGRAMME 2026". Iven's entry follows the M3 choice. [3]
  3. The missing researcher at Lin's desk: three pencil arrows (up, up, down), PHOTO PENDING, the raincoat peg. KAI "She had no shadow. In the security room. I saw it and I didn't see it." [4]
  4. Recover the corrupted security log from the 2026 server room. [4]
  5. **Reconstruct the final ten minutes** (playback): Tier-4 echoes re-enact 05:30–05:40. Place four recovered log entries in order. At the ninth minute a man turns the ring, his face never shown, and Lin stands beside him. [6]
  6. **Confront Rook** in his office, with the river below the window. [5]
     - ROOK "You came back different. The building came back different. I assumed it was the building."
     - KAI "The test was moved to 05:40."
     - ROOK "By me. Write it down. I have waited twenty-three years for somebody to make me say it."
     - ROOK "We did not build it. We dug it out of a riverbed somebody drained three thousand years ago. There were boot prints in the clay." (plus a `machine_buried` variant)
     - ROOK "Your sister was in the programme. She wanted to see it turn. She was nine."
     - KAI "She died of a fever."
     - ROOK "That is what I signed."
     - ROOK "I kept her drawing. I could not throw it away and I could not look at it. So I pinned it where nobody goes."
     - The choice (`rook_fate`):
       - expose (challenge): KAI "Then I'll tell everyone what you signed." ROOK "Good. Somebody should."
       - persuade (comfort): KAI "Help me stop it happening again." ROOK "Again. Yes. I have always known it was again."
       - record (investigate): KAI "Say it to the camera." ROOK "For the record. My name is Elias Rook."
  7. The boot print (C4, C12).
     - NONE "Kai sets his boot beside the glass. The same tread. The same worn heel."
     - KAI "Three thousand years. It's mine." [1]
  8. Containment: Lin, and the escape from the cube. [5]
  9. VERSION 17, then the hook. [2]
- **Hook:**
  - LIN "Don't save me." KAI "Why?" LIN "Because I am not the one who died." (bible)
  - A hand with a ring-shaped scar rests on her shoulder, and she is gone.
  - Terminal: "TIMELINE: VERSION 17. PRIOR VERSIONS: NO SURVIVING RECORD." (bible ending)
  - KAI "Seventeen. Then where are the other sixteen?"
  - Outside, Rain City's lights go out block by block and come back in a different order.

**Side stories:**

- **Iven's testimony** (3): IVEN "The ring turned by itself. Then the boy hit the button. A second late." (C11)
- **The staff door** (2): Pryce or Dale opens it, depending on trust.
- **The 2026 junior programme group photo** (3): Mira in yellow boots, Kai at 12, a young Rook.

**Choices → later:** `rook_fate` → M10 (the Director), M12 (Corridor B), M21 (the Director's office), M23 (Rook's last transmission).

**Target:** 30 + 8 = 38 (bible 45).

**Cinematic & audio:**

- Deliberately M2's `helix` score again, because it is the same place in another version: detuned −30 cents, 76 BPM, one instrument missing.
- VERSION 17 gets `reveal`. The hook ends on `cliff`, then the Act II card.

**Must not look like:** M2 (night red), M3 (dawn), M11 (bright noon), M12 (sunset roofs).

---

### M9 — NINE MINUTES TO ZERO (Act II)

**Place: `northbank`** (style `northbank`). This is Loop City: Rain City North's 19th-century hill quarter across the river from Helix, replaying 08:05–08:14 of the Zero Second morning. The Continuum loops it to watch the ninth minute.

- 200 × 200 m, elevations 0–30 m.
- Pale limestone and brick terraces, slate and copper roofs, stair-streets and switchback lanes.
- A funicular, glass skyways between the terraces, the iron market loggia, the cathedral steps.
- The **Helix North transmitter**, 45 m, on the headland over the river mouth.
- Across the river to the south: Helix's crescent and oculus; the Notch to the NE; open sea and an island light to the west.
- The layout follows the bible's M9 map literally.

**Years:**

| Year | Look |
| --- | --- |
| PRESENT 2049, frozen 08:05–08:14 | **The sunbreak**: low gold sun 6° E under a lifting rain shelf, sky #9ec8f0 → #ffd9a8, wet stone gleaming, long shadows. At each reset the clouds jump back, gulls rewind, the funicular returns, and rain falls **upward for one second**. |
| PAST 2026 | Fewer floors, an older market, and the tower in scaffolding (still only the old lighthouse, with no transmitter fence): a different route. |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| START | `ferryQuay` (safe zone, spawn) |
| CLOCK A — OBSERVATION | `marketLoggia`, `clockA` |
| CLOCK B — THE ENEMY ROUTE | `funicularStation`, `funicularTrack` (patrol route), `orderBoard` (the cancelled evacuation order), `clockB` |
| CLOCK C — THE LOOP TRIGGER | `cathedralSteps`, `clockC`, `loopEdge` (the Child) |
| THE CONTROL TOWER | `transmitter`, `towerBase` (Rhea), `towerTop` (the view across the river into the oculus), `skyways` |

**REVERSE.** None; it is not yet unlocked.

**Cast:**

- Rhea Odum (`rb_engineer_f/rain-dark`, voice through fx `radio`).
- The Witness on the radio.
- The Child (`rb_child_f` hologram).
- Sergeant Brask (one loop-aware bark).
- Evacuees: present-day civilians, `dust` variant.
- Responders: `rb_medic_f`, `rb_contractor/utility`.
- **Watchers:** `rb_trooper/continuum` with helmet torches. Patrols move per loop variant.

**Beats.**

*Old:* a ZoneGen "city" district (pink and cyan neon rain night); arrival / contradiction / encounter; no choice.

*New:*

- **Cold open** [1]: 08:05:00, a woman drops her coffee. 08:05:00 again, she catches it. Again, she does not. KAI "It's the same morning. It's that morning."
- **Threads** (`loop`; each reset moves the patrols, burns one more shopfront, and nudges the civilians' routes):
  1. Loop 1: observe patrol A. [4]
  2. Loop 2: observe patrol B and the civilians' routes. [4]
  3. Clock A. [3]
  4. Clock B on the enemy route; the cancelled order (keep the residue). [4]
  5. Clock C. [3]
  6. Sabotage the transmitter, the Continuum's loop device. Its carrier tone is the three notes (C6). [4]
  7. Rescue Rhea. [3]
     - RHEA (radio) "Eleven. Twelve. Is anyone counting with me?"
     - RHEA "You again. You get here earlier every time."
  8. The tower at 08:13. [3]
     - NONE "Across the river, through the chamber skylight, a man at the console turns the ring. He looks up. He looks at you."
     - KAI "That's the ninth minute."
     - WITNESS (radio) "You have nine minutes." KAI "To do what?" WITNESS "To become me." (bible)
  9. The reset. [2]
- **Loop-aware bark (bible):** "You did that already. No—you're about to do it. I hate that I know the difference."
- **Hook:**
  - NONE "The city resets. Kai does not." (the bible ending)
  - KAI "I remember. I remember all of it."
  - SOLDIER (crowd voice, `CROWD_M2`) "That one didn't reset." Black.

**Side stories:**

- **Warn the evacuees** off the tower before 08:12 (6). They listen only if Kai quotes the cancelled order (`warned_evacuees`).
- **The Child in Three Photographs**, step 2 (2): she is the only person who does not loop. Hum the song and she steps off the loop's edge.

**Choices → later:** `warned_evacuees` → M13 (the people who listened open a route), M21 (a kitchen door).

**Target:** 30 + 8 = 38 (bible 60).

**Cinematic & audio:**

- Score `loop_city` (118 BPM pulse) with the bible's loop memory: each reset adds a layer (bass → pulse → piano cell → strings → choir).
- A reset plays a tape rewind and sirens.
- Beds: rain shelf, gulls, sirens, panic walla in loop crowd voices.

**Must not look like:** M1 (dark overcast street-level glass), M13 (a port in battle smoke).

---

### M10 — ENEMIES WHO REMEMBER (Act II)

**Place: `dam`** (style `dam`). The Continuum's detention block inside the hydroelectric dam that closes the upper gorge, with the snow-capped Notch directly above.

- 180 × 120 m, 60 m tall.
- Cells along **open-air galleries** on the downstream face (railings, the gorge below).
- Switch rooms in the dam's crown, and a floodlit **crest yard** with watchtowers.
- The turbine hall at the foot, with **15 m windows** onto the gorge.
- The spillway tunnel down to the gorge floor.

**Years** (states `['PRESENT','PAST']`):

| Year | Look |
| --- | --- |
| PRESENT 2049 | Night with falling snow (frost fallback): sodium and cold-LED floodlights striping the face, spillway mist, the moonlit Notch. Sky #0a1424 → #2a3a54, light #a8c0e8, accents #ffc44a and #ff6a48. |
| PAST 2026 | The dam under refurbishment at dusk: scaffold stairs on the face, workers' cabins, warm work lights, no prison, so the routes differ. |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE DETENTION BLOCK | `cell` (spawn), `galleries`, `guardPost`, `intakeRecords` (side) |
| Q1 POWER SYSTEMS | `switch2049`, `switch2026`, `crestYard`, `directorOffice` (side) |
| Q2 THE TESTING CHAMBER | `turbineHall`, `projector` (the captured weapon), `loopCells` (prisoners), `spillwayTunnel` |
| Q3 THE YARD | `gorgeFloor`, `seraSkiff` |

**REVERSE.** None. Echo Step unlocks here (bible).

**Cast:**

- Sera, disguised as a guard (`rb_juno/guard`, a Continuum-slate recolour) until she shows herself, then `rb_juno/resistance`.
- The Director of Continuity (cold open; resolved by `rook_fate`).
- Twelve prisoners: present-day civilians in grey detention overalls, flickering between solid and hologram. One is Dale (if he was trusted in M2) or old Rook (if exposed in M8).
- **Watchers:** `rb_trooper/continuum`. They remember Kai's last attempt and adjust after each catch.

**Beats.**

*Old:* LevelGen "cryo" (the Vessel Cryo Bay); arrival / encounter / prisoners choice; `prisoners_freed` was never read again.

*New:*

- **Cold open** [2]: the Director watches the M9 capture feed.
  - persuaded: ROOK (older) "He didn't reset. Every version resets. Bring me the one who doesn't."
  - exposed: PRYCE "The director said nobody could keep their memory through a reset. I'm the director now."
  - record: DIRECTOR (unseen, fx `radio`) "Hold him."
- **Threads:**
  1. Escape the cell block (stealth). [6]
  2. Sera. Bible exchange: "In my time, your face is on every memorial." / "For saving the world?" / "For ending it." Then intents. [3]
  3. Switch the power runs between 2049 and 2026 to blind the guards. [5]
  4. **The captured temporal weapon**, an afterimage projector, carries Kai across the testing chamber. This is where he learns Echo Step. [5]
  5. The prisoners: twelve people in unstable loops. The choice is kept, and is now read later. [4]
  6. The yard under the open sky; Sera's skiff; Echo Step unlocks (`echo_step`, bible ending). [4]
  7. Hook. [2]
- **Hook:**
  - SERA "Somebody at Rain City General is being put back together every morning. The readings come from Ward 32."
  - KAI "Thirty-two."
  - SERA "Means something to you?"
  - KAI "It's her age. It would be her age."

**Side stories:**

- **The intake records** (3): four earlier intakes of "Varen", four faces of Kai, one of them grey.
- **The Director's office** (3).

**Choices → later:**

- Freed prisoners fight for the Unwritten in M13, and one hands Kai the field orders. In M21 their cells are empty.
- Held prisoners are still in the cells in M21 and can be freed there (a second chance).

**Target:** 30 + 6 = 36 (bible 65).

**Cinematic & audio:**

- Score `detention` (100 BPM; muted percussion, a string ostinato on Kai's motif).
- Beds: wind, spillway roar, ventilation, cell doors.
- The Echo Step unlock gets its signature cue: a reversed afterimage whoosh with a motif fragment. The same sound plays on every Echo Step.

**Must not look like:** the Vessel Cryo Bay, or M21 (hard noon above the clouds).

---

### M11 — THE INVERTED HOSPITAL (Act II; REVERSE unlocks)

**Place: `hospital`** (style `hospital`). Rain City General, on the city's western slope.

- 160 × 140 m, 2–4 storeys.
- A glass entrance atrium. Five white modernist pavilions (render, ribbon windows, pilotis) linked by open-air colonnades round four garden courts (lawns, magnolias, a fountain, benches).
- An ambulance ramp, and a two-storey records hall under a skylight.
- **Ward 32** in the top pavilion, with a roof garden and helipad overlooking the city and the Ring Hill.
- Rooms open onto the courts through French windows.
- **Reversed wards** are bounded zones with a shimmer edge (`engine.setOverride(room, { timeReverse: true })`). They are not a year.

**Years** (states `['PRESENT','PAST']`):

| Year | Look |
| --- | --- |
| PRESENT 2049 | Bright overcast noon, high key: sky #e8eef2, fog #d8ecec ×0.6, white render, lawn #6aa060, accents #3f9cff and #e86a9c. |
| PAST 2026 | The warm afternoon Mira was admitted: younger trees, older signs, a children's wing with murals. |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 TRIAGE & THE QUIET COLONNADE | `atrium` (spawn), `triage`, `discontinuityCourt` (rain falls on one side and rises on the other; the sky drifts backwards over the rising half), `quietColonnade`, `gurneyRun`, `glassWindow`, `ivStand`, `musicBox`, `youngKaiBench` |
| Q1 RECORDS | `recordsHall`, `ledger2026`, `tray`, `waterGlass`, `burntDoor` (the annex door), `charredFile`, `flatlineMonitor`, `photoBoard` (side), `intercomRoom` (side) |
| Q2 WARD 32 | `odileStation`, `twinLock` (the reversed ward next door), `maintTag` (2026), `ward32Door`, `ward32` (the bed, Lin's lanyard, the file), `roofGarden` |

**REVERSE** (taught here). The unlock, the six rules and the processes:

| Process | Kind | Weight | Notes |
| --- | --- | --- | --- |
| `tray` | fall | light | tutorial |
| `waterGlass` | flow | light | tutorial |
| `burntDoor` | burn | medium | tutorial |
| `charredFile` | burn | light | readable while held |
| `m11lock` | lock | medium | settled; 4 bolts RING, BAR, STAR, CRESCENT |
| `odileEcho` | recording | light | R5, side |
| `flatlineMonitor` | refusal | — | "✕ NOT A PROCESS" |

**Cast:**

- Nurse Odile (`rb_odile/ward`), caught in the inverted ward since 2026.
- Ward 32's silent figure (`rb_mira/gown` hologram, flickering).
- Young Kai's residue (`rb_child_m`, no lines).
- Staff echoes: `rb_doctor_m` (stethoscope kept, it is a hospital) and `rb_medic_f`.
- The intercom.
- No watchers. The hazards are the threat.

**Beats.**

*Old:* LevelGen "med" (the Vessel Medbay); INVERTED/PRESENT/PAST states; arrival / contradiction / lock as text; the lock was a single click under `@INVERTED`.

*New:*

- **Cold open** [1], 2026: a nurse writes "VAREN, M., 9" on the ward whiteboard. The ink lifts off the board, letter by letter, back into the marker.
- **Threads:**
  1. Arrive through the atrium. The wards alternate forward and reversed. The intercom says "Temporal discontinuity." (bible), played reversed inside reversed wards. [3]
  2. **Follow the sound that becomes quieter as you approach** (bible): a music box playing the three-note song. Inside reversed wards its gain rises with distance (`gain = clamp(d / 25)`), so its source is the quietest point. With captions on, the sound clue has a visual pulse. [5]
  3. **Avoid hazards returning to their original positions** (bible) on 6–8 s cycles: a gurney rolls back up the colonnade, glass flies up into a window frame, an IV stand jumps upright. Each has a hit box (setback `hit`). [4]
  4. At the source, a residue with no lines: twelve-year-old Kai on a bench outside the children's wing, holding a drawing, beside the music box. [1]
  5. **Records.**
     - The charred third file in the reversed annex un-burns on the ward's cycle for 3 s in every 10, too short to read.
     - The Chronolith "catches the rhythm": `has_inversion` is set and the tutorial toast shows R1 and R2. KAI "The ward isn't broken. It's being held… I can hold one thing. Only one, and only for a while."
     - Practise on the tray, the glass and the burnt annex door.
     - Reverse the file and read it while it holds: "ADMITTED BY: K. VAREN", in an older hand.
     - [6]
  6. **Compare the medical records** (bible): the 2026 admission ledger lists VAREN, M., 9, admitted 14-03-2026 16:40; 2049's records hall has no Varen at all. That gives the missing patient. [4]
     - R6 temptation: the flatline monitor by an empty bed reads ✕ NOT A PROCESS. KAI "Not a person. It won't take a person."
  7. **Nurse Odile.** [3]
     - NURSE "They put me back together every morning. I would like, once, to stay apart."
     - KAI "Who puts you back together?"
     - NURSE "A man who sits with the girl in thirty-two. He always says thank you."
     - NURSE "There was a boy, once. Twelve. He would not let go of her hand. We took his fingers off one at a time."
     - KAI "I don't remember that."
     - NURSE "No. You wouldn't have let yourself."
  8. **Dismantle the reversing lock in the correct order** (bible).
     - Watch the twin lock in the reversed ward come apart on a loop, in fitting order reversed.
     - Read the 2026 maintenance tag (residue, the fitting order).
     - Hear the intercom chime play the four bolts' tones.
     - Then on Ward 32's door, reverse only the last-fitted bolt each time. It stays out (R4: "Nothing pushes a bolt back in."). A wrong bolt jams (−1.5 s charge, −0.03 stability).
     - [6]
  9. Ward 32: a bed that puts itself back together every morning, Lin's lanyard, the file. [2]
- **Hook:**
  - The file: VAREN, M., age 32; the record is 23 years old; the death date is blank (bible ending). The photograph is Lin.
  - KAI "Lin."
  - The intercom stops repeating "Temporal discontinuity."
  - WITNESS (fx `pa`) "Close the file, Kai."
  - Beyond the ward glass a man walks away, flickering between 2026 and 2049.

**Side stories:**

- **The Child in Three Photographs**, step 3 (6). The family-room photo board shows one person at 9, at 32 and as a blur as the years change: the bible's "a person whose age changes between temporal states".
- **Odile's shift echo** (2, R5): her 2026 echo walks backwards through her shift. Reverse it and she walks forwards and says "Thirty-two isn't missing. She's early."
- **The intercom room** (2). With `mira_tape`, play Mira's recording to Odile.

**Choices → later:** release Odile, or keep her together (`odile_released`) → M16 ("A NURSE'S WATCH — RELEASED"), M23 (she waves Kai on).

**Target:** 28 + 8 = 36 (bible 50).

**Cinematic & audio:**

- Score `hospital` (64 BPM; monitor beeps as the rhythm, reversed pads). Reversed wards play the music and room tone backwards.
- The REVERSE unlock cue. The lock clicks reversed.

**Must not look like:** the Vessel Medbay, M8, M21.

---

### M12 — THE MAN BEHIND THE GLASS (Act II)

**Place: `helix`, `wing: 'north'`** (`sameAs: helix`). The north wing and roofs at sunset, 140 × 160 m, roofs at 12–20 m.

- **2026:** a construction gangway bridges the court at roof height ("Corridor B"). It exists only in 2026.
- **2196:** the north wing has collapsed into a sinkhole. Overgrown terraces lead down into the hill, to **the second chamber**: a cavern under the north wing, open to the sky through the collapse, with a second black ring standing in a pool of river seepage.

**Years:**

| Year | Look |
| --- | --- |
| PRESENT 2049 | Sunset and wind: sun 3° #ff8a4a, sky #2a3a7a → #ff9a6a, long shadows (`sunDir`). |
| PAST 2026 | Dusk into night: sodium work lights #ffb050 under a violet sky. |
| FUTURE 2196 | Green-gold dusk with fireflies. |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE CHASE — 2049 | `northRoofs` (spawn), `plantDecks`, `skybridgeN`, `glassPanes` (where he stops) |
| Q1 THE CORRIDOR THAT WAS — 2026 | `gangway2026`, `lunchRoom2026`, `bouquet` |
| Q2 THE RUIN — 2196 | `collapsedStair`, `sinkTerraces`, `fallenBeam` |
| Q3 THE SECOND CHAMBER | `secondRing`, `fractureExit` |

**REVERSE:**

| Process | Kind | Weight | Notes |
| --- | --- | --- | --- |
| `collapsedStair` | collapse | medium | The Witness reverses it first, in Kai's own colour and sound, climbs, and releases it in front of Kai. Kai reverses it to follow. |
| `fallenBeam` | fall | medium | Blocks the second chamber's door in 2196. |
| `witnessSteps` | recording | light | His footsteps replayed backwards; reversing them reconstructs his route. |

From here on, watchers can be patrol-reversed.

**Cast:**

- The Witness **in person** (`rb_ren_m/witness`). While he stands in 2026 he has no shadow. He whistles the three notes slowly.
- Rook in the corridor, depending on `rook_fate`.
- `rb_contractor` builder echoes in 2026.
- Watchers: Helix drones.

**Beats.**

*Old:* LevelGen "eng" rooms identical to M8; arrival / contradiction / encounter; the "chase" was a route with him at the end.

*New:*

- **Cold open** [1]: the Witness at a 2196 window holding white chrysanthemums, watching a younger Kai arrive. He is seen from behind, and the scar is visible.
- **Threads:**
  1. **Chase through Helix in 2049** (bible). He walks a path, is never caught, and waits at the next pane of glass if Kai falls behind. No fail state. [5]
  2. The skybridge: he switches years, and Kai must follow. [3]
  3. **Use a corridor that existed only in 2026** (bible): the open-air construction gangway. [4]
  4. **Traverse the ruined facility in 2196** (bible): the collapsed stair (watch, then REVERSE) and the fallen beam. [4]
     - KAI "That's my… he does it the way I do it."
  5. **Reconstruct the Witness's route from repeated fragments** (bible). At every pane of glass he stopped and put his hand where Mira's reflection is. Evidence board. [5]
  6. The voicemail plays. [1]
     - NONE "In his pocket the phone plays the voicemail on its own. Received 05:40."
     - WITNESS (voicemail, fx `radio`) "Kai Varen. If you are hearing this, you went in anyway. You always go in anyway."
  7. **The second Chronolith**, face to face. [4]
     - KAI "Who are you?"
     - WITNESS "The person you become when you refuse to let go." (bible)
     - NONE "He lifts his wrist. A circle with a broken halo, thirty years older than yours."
     - WITNESS "You got yours at a train door. It aches when it rains. It always rains."
     - He escapes through a fracture (bible ending). [2]
- **Hook:**
  - Kai looks at his own wrist.
  - SERA (radio) "Varen. The war's started. Both sides are asking for you by name."

**Side stories:**

- **Rook in the corridor** (2), depending on `rook_fate`: he unlocks Corridor B; his confiscated badge opens it; or his confession plays in the corridor.
- **The dropped bouquet** in florist's paper (1).
- **The 2026 lunch-room whiteboard** (2): "SITE ZERO JUNIOR TOUR — SATURDAY 14 MARCH — 6 KIDS".

**Target:** 30 + 6 = 36 (bible 70).

**Cinematic & audio:**

- The Witness theme (54 BPM; Kai's motif slower and lower on bowed metal, irregular pulse) over the `helix` palette. Percussion rises with the chase.
- Each time he changes year: the state signature, and his motif bent.
- The scar gets `reveal`.

**Must not look like:** M2, M3, M8 (a different wing, height and hour).

---

### M13 — THE NINE-MINUTE WAR (Act II)

**Place: `warport`** (style `port`). Rain City's delta cargo port, 240 × 200 m, the largest field in the game.

- Container canyons, and two gantry cranes, one climbable.
- A rail yard with wagons.
- Trench and sandbag lines across the quay.
- A lifting bridge over the drowned channel.
- The grain-silo complex, "the Cathedral", holding the stabilizer.
- North of it, **the frozen district**: a residential block frozen mid-collapse, with the trapped population visible. The stabilizer's work is readable in the place itself.

**Years:**

| Year | Look |
| --- | --- |
| PRESENT 2049, the battle | Low sun through smoke (#ff8a3d), smoke columns, ash (motes fallback), flashes; sky #3a2a2a → #ff9a5a. |
| PAST 2026 | The working port on a sunny, windy day: coloured containers, gulls. The crater is a pond. |
| FUTURE 2196 | A meadow over the port: rusting cranes as monuments, wildflowers in the craters, a soft afternoon. |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE BATTLEFIELD | `quayTrench` (spawn), `containerCanyon`, `fieldOrders`, `shellZone`, `batteryA`, `batteryB`, `listenersRoute` (if warned) |
| Q1 THE THREE DEVICES | `deviceRail` (2026 rail yard), `deviceCrane` (crane cab, 2049), `deviceCrater` (crater field, 2196) |
| Q2 THE STABILIZER | `silos`, `stabilizer`, `frozenBlock`, `rollCall`, `burialSite` |

**REVERSE:**

| Process | Kind | Weight | Notes |
| --- | --- | --- | --- |
| `shellA`, `shellB` | projectile | light | Settled; each flies back to its battery and is tagged. Doing one from each side pins `ev_both_sides`. |
| `burial` | flow (soil) | light | Side story. |
| `shelterWall` | collapse | medium | Side story. |

"Inverted" Continuum watchers patrol in reverse, with the half-bar music cue. At the end the charge cap rises to 10 s (Sera's people retune the Chronolith with the stabilizer coil, whichever choice was made).

**Cast:**

- Sera; Sergeant Brask (`rb_soldier_m`).
- Faction A watchers: `rb_trooper/continuum`. Faction B: `rb_scav/unwritten`, rust hoods, irregulars from 2196.
- Trapped civilians: present-day, `dust` variant.
- Freed M10 prisoners, if any, among the Unwritten.

**Beats.**

*Old:* a ZoneGen "reactor" district in a storm; tasks at fixed avenue spots; the stabilizer choice.

*New:*

- **Cold open** [1]: a Continuum gun and an Unwritten gun fire in the same second. Both shells hang in the air, and one runs backwards.
- **Threads:**
  1. **Cross an active battlefield** (bible): stealth through a loop of fire. [6]
  2. The field orders (existing log), signed by nobody. [2]
  3. **REVERSE a shell in flight.** NONE "It climbs. Not south. North, over the Continuum line, back into a Continuum gun." Do one from each side, then deduce. This is the bible's "recognize that both factions are reacting to their own previous attacks". [4]
  4. **Disable three devices in different temporal states** (bible; existing tasks, now at authored positions). [9]
  5. The bible exchange with Sera ("This is not the future." / "What is it, then?" / "The future that survives long enough to remember us.", today's speakers), then Brask. [2]
     - KAI "Both sides are shooting at their own last attack."
     - SERGEANT "Then who fired first?"
     - KAI "Nobody. That's the point."
  6. The stabilizer choice (keep): destroy it, or redirect its energy to free the civilians (`faction`). [4]
  7. The district changes in front of Kai: it stays frozen, or the block thaws (the bible ending, staged). [2]
  8. Hook. [2]
- **Hook:**
  - The stabilizer's last pulse tears a fracture open.
  - SERA "You're coming with me."
  - KAI "Where?"
  - SERA "2196. Where they teach your name."

**Side stories:**

- **The Ninth Minute: Evidence** (bible optional, 8). The first device was buried in 2026 soil, its casing reading "HELIX — PROPERTY OF K. VAREN". REVERSE the burial and see the hand that buried it: a scarred wrist (`ev_witness_cause`; Act II's question answered "controlling"). SERA "Somebody with your name did."
- **The people who listened** (2), if warned in M9: they open a safe route.
- **The roll call** (3): reverse a collapsing wall to shelter the 212-name roll-call civilians.

**Choices → later:** `faction` → M18 (Unwritten fighters hold a pylon, or a quiet Continuum corridor), M21 (allies), M23.

**Target:** 32 + 8 = 40 (bible 75).

**Cinematic & audio:**

- Score `war` (118 BPM; layered percussion, string ostinati in changing meters, one beat dropped every nine bars, reversed impacts).
- Beds: artillery heard reversed and then forward, and battle walla.
- The faction choice gets the `consequence` stinger. The hook ends on `cliff`, then the Act III card.

**Must not look like:** M9 (a hill quarter at sunrise) or M18 (storm-of-times).

---

### M14 — WELCOME TO 2196 (Act III)

**Place: `drowned`** (style `drowned`, region Rain City; `sameAs` none, since it is downtown and not M1's South Square). 220 × 220 m, with one street grid shared by every year.

- **2196:**
  - The sea is 3 m higher and the avenues are lagoon canals.
  - 0.6 m wading strips run along the old sidewalks; the deep channels between them are blocked.
  - Towers of 30–90 m with hanging gardens and broken curtain walls.
  - The elevated Line 41 viaduct is the main walkway, with rope bridges and survivors' platforms.
- **Unstable zones** are shimmering patches where the scenery flickers between years.

**Years:**

| Year | Look |
| --- | --- |
| FUTURE 2196 | Misty pastel morning: sun shafts between the towers, sky #a8c8d8 → #f8e8c8, fog #b8c8b0 ×1.4, birds, pollen. |
| PRESENT 2049 | The same downtown, dry and busy at midday in light rain, with trains on the viaduct. |
| PAST 2026 | Half the towers are cranes and steel frames; sunny. |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE OVERGROWN TOWERS | `arrivalPlatform` (spawn), `partsList`, `bankTower`, `liftCar`, `roofGarden` (the capacitor), `fallenTower` (a ramp) |
| Q1 THE TRANSIT LINE | `viaduct`, `transitBridge`, `lowWaterPath`, `antenna`, `stackedStones`, `unstableZones` |
| Q2 THE MEMORIAL | `memorial` (the old Helix Plaza: "KAI VAREN, ARCHITECT OF THE FRACTURE"), `flowers`, `seraSchool`, `seraSteps`, `gardenChannel` (side), `mossPrints` (side), `kaiStatue` |

**REVERSE:**

| Process | Kind | Weight | Notes |
| --- | --- | --- | --- |
| `liftCar` | fall | heavy | Stand on it, reverse, ride up to the roof garden. |
| `transitBridge` | collapse | heavy, 9 pieces | The alternative to Sera's low-water path. |
| `mossPrints` | ink-like trail | light | Side story. |
| `memorial` | refusal | — | R6: "✕ NOT A PROCESS". |

**Cast:**

- Sera (`rb_juno/resistance`).
- Survivors: `rb_trader`, `rb_villager_f`, `rb_civ_f3`, `rb_child_m2/patched` (*closing pass:* `rb_surv_f`, Adults/Female_Adult_17, in place of `rb_villager_f`, whose face is the Elder's now).
- The Warden (`rb_warden`); the Gardener (`rb_ren_f/moss`).
- The schoolchildren (`CROWD_CHILD` voices).
- **Watchers:** `rb_scav`.
- The memorial statue of Kai: `rb_ren_m` in a stone material.

**Beats.**

*Old:* a ZoneGen "ruin" under a dome (shared with Case C); arrival / contradiction / encounter.

*New:*

- **Cold open** [2], Sera's school:
  - SERA "And the first name?"
  - CHILDREN "Kai Varen."
  - SERA "And what did he do?"
  - CHILDREN "He made the sky disagree with itself."
  - SERA "Good. Now the names of the dead. Slowly. Every one."
- **Threads:**
  1. The beacon's parts list (existing log). [2]
  2. **Traverse overgrown skyscrapers** (bible): the capacitor in the bank's roof garden, by REVERSING the fallen lift car. [6]
  3. **Ruined transit lines** (bible): the antenna on the lake line, by Sera's low-water path (existing residue) or the reversed transit bridge. [5]
  4. **Avoid unstable temporal zones** (bible; stability). [3]
  5. **Track survivors** (bible) by their stacked stones. [3]
  6. The memorial: fresh white chrysanthemums in florist's paper (C1), and the core. [3]
  7. Sera at the memorial: "We teach children your name before they learn the names of the dead." (bible). Then the choice (`trust_sera`): [4]
     - deny: SERA "Every version of you denies responsibility. I have met four. You are the first to look at the memorial before saying it."
     - accept: KAI "Then teach them this too: I came back." SERA "Nobody has ever said that. I don't know whether to write it down."
     - ask: KAI "What did I do?" SERA "Nobody knows. That's why we teach the name."
  8. Hook. [2]
- **Hook** (bible ending: every version of Kai denies responsibility):
  - SERA "Four versions of you have stood here. Every one said: I didn't do this."
  - KAI "What did the fifth say?"
  - SERA "There hasn't been a fifth. Not yet."
  - A bell from the east: Anja's city has missed noon.

**Side stories:**

- **The Survivor's Garden** (bible optional, 8). With `water_route` the channel already runs: GARDENER "The channel is running again. Nobody alive remembers who opened it." (bible bark). Otherwise open a 2049 culvert (`garden_restored`).
- **Whose flowers?** (3). REVERSE the moss footprints (a light trail, last step first) back to a fracture scar in a tower window. There is a chrysanthemum petal and a florist's receipt for 08:04, 2049 (C1).
- **The children's rhyme** made from Kai's M4 answer (1), and **the schoolbook** (1).

**Choices → later:**

- `trust_sera` → M18 (Sera's line at the Chronolith), M23 (the memorial gets "AND HE CAME BACK" in a child's hand, if accepted).
- `garden_restored` → M18 (evacuees shelter in the garden), M23.

**Target:** 30 + 8 = 38 (bible 50).

**Cinematic & audio:**

- Score `city2196` (Beautiful Catastrophe, 70 BPM; wide strings, distant brass, processed wind, sparse piano).
- Beds: wind, birds, insects, lagoon lapping.
- Below 0.3 stability: a low heartbeat and a rising whine.

**Must not look like:** M1 (South Square, rain, 2049), M15 (the stadium bowl), M21 (above the clouds).

---

### M15 — THE CITY THAT FORGOT TOMORROW (Act III)

**Place: `lockcity`** (style `stadium`, custom helper `bowl`). A 2196 survivors' city built into a ruined stadium in Rain City's eastern suburbs. The bowl is 180 m across.

- Houses stacked in tiers on the stands; the market on the pitch; the school in the main stand.
- The rail halt outside the north gate, on a raised platform.
- The central archive in the broken **press tower**: chain C's two archives and the museum display.
- **Anja's lock:** a slowly turning halo of light 60 m above the bowl, a ring in an open sky (Sky feature).
- The 120 s loop resets the routines.

**Years:**

| Year | Look |
| --- | --- |
| FUTURE 2196 | An eternal, identical late morning in pale gold-lilac: sky #c8c0e0 → #fff0d0, motes, bunting, laundry. |
| PAST 2026 | Match day, evening under floodlights, stands full. Vivid. |
| PRESENT 2049 | The empty stadium as an evacuation centre the day after the Zero Second, with tents and rain: the undocumented disaster's evidence. |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE STATION | `northGate` (spawn), `railHalt`, `departureBoard`, `evacTrain` |
| Q1 THE SCHOOL & MARKET | `school`, `register` (thirty names, one of them Tomas), `market`, `floodLine` |
| Q2 THE ARCHIVE / THE LOCK | `pressTower`, `archiveA`, `archiveB`, `card14`, `audioCylinder`, `museumDisplay`, `anjaDesk`, `lockConsole`, `lockHalo` |

**REVERSE:**

| Process | Kind | Weight | Notes |
| --- | --- | --- | --- |
| `card14` | ink | light | Settled. "CAUSE: HELIX TEST" un-writes first, so it was added last: the fabricated evidence. |
| `archiveA`, `archiveB` | ink | light | Neither un-writes, so both are original (chain C). |
| `departureBoard` | mechanism | light | Side: its flaps run backwards; reverse them to read tomorrow's departures, which are blank. |

**Cast:**

- Anja (`rb_doctor_f`, stethoscope hidden, worn coat); Mara (`rb_office_f/faded`); the Warden (`rb_warden`).
- Looping residents: `rb_villager_f`, `rb_civ_f3`, `rb_trader` (*closing pass:* `rb_surv_f` in place of `rb_villager_f`).
- Schoolchildren: `rb_child_m2`; Tomas is one child echo. *As built in the closing pass:* Tomas has a body of his own (`rb_tomas`, Adults/Male_Adult_01 at 1.42 m, `school`), and a schoolgirl (`rb_child_f2/faded`) sits with the boys. *As built in the castfix pass:* `rb_tomas` is a child's body (Children/Male_Child_01 with his own sandy hair and freckles, 1.52 m), in a school jersey under a coat to the knee. *As built in castfix round 2:* he is only ever an echo, which shows no maps, and young Kai's echo is the same body: Tomas's echo wears a shaggy mop of its own (`garments.js hairMass`), young Kai's a short crop, and echoes show only their nearest surface (`wardrobe.js holoDepth`).
- Station evacuees as holograms. Jun as an echo driving the evacuation train (side story).
- No watchers (wardens patrol, non-hostile).

**Beats.**

*Old:* a ZoneGen "ruin" (motes); log / contradiction / lock choice; both choices set the same fact.

*New:*

- **Cold open** [1]: ANJA "Check the lock at noon." She reads her own note: "YOU HAVE WRITTEN THIS NOTE 3,112 TIMES." She writes it again.
- **Threads** (`loop`):
  1. **The train station reliving an evacuation** (bible). [4]
  2. **The school reliving its abandonment** (bible): thirty names, the same ink every day. [5]
  3. **The market reliving an undocumented disaster** (bible): the 14th. It was a flood, the river again (C12). [5]
  4. **The central archive** (bible), with Mara. This is chain C, now on the main path. Separate causes, consequences and fabricated evidence (`card14`). Two first operators, Rook and Varen, are each true for a different branch (`ev_dual_archive`). [8]
     - MARA "A clean history is usually a history someone has cleaned."
     - KAI "Which record is true?"
     - MARA "Start with the question: true for whom?"
  5. Anja. [4]
     - KAI "How many worlds has the Chronolith cost?"
     - ANJA "That depends on whether you count the worlds that never finished becoming worlds." (bible)
     - ANJA "My son was in the market on the fourteenth. Every morning he isn't there, and every morning I don't know why. That is what the lock is for."
     - KAI "If I free the city—"
     - ANJA "Then tomorrow comes, and I'll know why. Ask me which I want. Then don't listen to the answer. I've changed it three thousand times."
  6. **Stabilize or free the city** (bible). The two choices now set **different** facts: `city_freed` / `city_stabilized`. [4]
  7. Hook. [2]
- **Hook:**
  - The lock's install record reads "INSTALLED: K. VAREN — WITNESS PROTOCOL — VERSION 9".
  - KAI "I built this?"
  - ANJA "No. He did."
  - MARA "If you want to know what the attempts cost, go under the city. We keep the failed worlds there."

**Side stories:** **The Train That Arrives Yesterday** (bible optional, 10). A passenger is missing across three station states: Jun Park, "missing 2049, last seen boarding the evacuation service". His echo drives the train. It sets `quest_jun='observed'`.

- With `jun_line`: JUN "Then I can stop apologizing."
- With `jun_evidence`: a second chance to open the next carriage; the passengers step out into 2196.
- Quote Jun's chain A line (bible): "The train keeps arriving. Nobody gets on. Nobody gets off. But I can hear them in the next carriage."

**Choices → later:**

- `city_freed` → M18 (the city's people help).
- `city_stabilized` → M21 (the lock holds a corridor).
- Both → M23 ("We planted things." or "Noon. The lock holds. I remember it's a lock.").

**Target:** 30 + 10 = 40 (bible 65).

**Cinematic & audio:**

- Score `locked_city`: a 4-bar phrase that repeats exactly, with no random notes, so you can hear the lock.
- At each reset: a school bell and a reverse swish. If the city is freed, the phrase finally changes.

**Must not look like:** M14 (lagoon towers), M16 (quarry).

---

### M16 — THE MUSEUM OF FAILED WORLDS (Act III)

**Place: `sinkhole`** (style `quarry`, custom helper `spiral`). The museum stays underground and keeps its sky.

- It is cut into the terraced walls of a circular quarry-sinkhole on Rain City's eastern edge (the quarry that built M6's Old Town): 120 m across and 45 m deep.
- Gallery alcoves (caves) line a 400 m spiral ramp. Its collider is a stair of 0.2 m rises under a smooth visible ramp.
- Hanging gardens, and a waterfall from the rim.
- At the bottom, a pool and the **Comparison Hall** under a 20 m glass lens.
- Behind the waterfall, the deepest alcove and the catacomb.

**Years:**

| Year | Look |
| --- | --- |
| FUTURE 2196 | Dusk: the rim golden, the depths blue, lanterns #ffc27a along the ramp, waterfall mist. |
| PAST 2026 | The quarry working at noon: dust, trucks, cut blocks. |
| PRESENT 2049 | The quarry flooded as a lake with a Helix storage barge. The lower alcoves are underwater and reached by pontoons. |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE RIM & THE FIRST MEMORY | `rimGate` (spawn), `entranceHall` (17 halls and 100 UNFINISHED cases), `alcove1` |
| Q1 THE SPIRAL | `alcove2`, `alcove3`, `pontoons`, `reel`, `shatteredCase` |
| Q2 THE COMPARISON HALL | `lensHall`, `deductionBoard` |
| Q3 THE PHOTOGRAPH | `waterfall`, `photoAlcove`, `catacomb`, `choiceCases` |

**REVERSE:**

| Process | Kind | Weight | Notes |
| --- | --- | --- | --- |
| `reel` | recording | light | One memory reel runs backwards; reverse it to watch it forwards (R5). |
| `shatteredCase` | collapse | light | Settled, side; reassembles and reveals "VERSION 41 — UNFINISHED". |

**Cast:**

- Mara (cold open).
- Memories only: holograms of `rb_mira`, `rb_ren_m/witness`, and the player's look.
- The photograph uses the Witness and Mira models.
- No watchers.

**Beats.**

*Old:* LevelGen "arch" (the Vessel Archive Core); arrival / contradiction / encounter.

*New:*

- **Cold open** [1]: Mara opens up at dawn and dusts 117 cases. One is new: a yellow raincoat, labelled VERSION 17.
- **Threads:**
  1. The entrance hall: seventeen halls for finished worlds, and a hundred cases each holding one object and labelled UNFINISHED (C5). [4]
  2. **Memory one** (bible "play three short memories"), version 4: Kai at the console. [4]
  3. **Memory two**, version 9: Mira at the console. MIRA (memory) "We had a thousand chances. We only needed one that was ours." (bible) [4]
  4. **Memory three**, version 16: nobody at the console; the ring turns by itself (C11). [4]
  5. **Compare artifacts with the current world** (bible), switching years: which objects exist in 2049 now? [5]
  6. **Determine which version best explains the museum** (bible). None alone: it was built by the one who kept all of them, the Witness. [4]
  7. **Find a photograph of older Kai and Mira** (bible); take it or leave it (`photo_taken`). [2]
  8. Hook. [2]
- **Hook** (bible ending: the museum proves the experiment was repeated many times):
  - The back of the photograph, in an older version of Kai's handwriting: "V. 117. She laughed today. Beginning again."
  - KAI "He kept coming back. He kept bringing her back."

**Side stories:**

- **The Names Beneath the City** (bible optional, 8): a catacomb of erased names under the city. Three of them match the M15 register and M1's commuters (`ev_erased`).
- **Cases for Kai's earlier choices** (2): the biscuit tin (if left), the nurse's watch, the clockmaker's clock.

**Choices → later:** `photo_taken` → M21 (showing it to the Witness stops the elites for a breath) or the Ending C epilogue (it is on Mira's table).

**Target:** 30 + 8 = 38 (bible 55).

**Cinematic & audio:**

- Score `museum`: glass and prepared piano playing earlier regions' motifs out of order.
- Each exhibit plays 2 s of its lost world when inspected. The waterfall is the bed at depth.

**Must not look like:** M17 (desert array), any Vessel deck.

---

### M17 — THE WITNESS'S ARCHIVE (Act III)

**Place: `array`** (style `desertArray`). A radio-telescope array on a high desert plateau. Mesas on the horizon make it a different world from the valley.

- 260 × 260 m, with nine 25 m dishes on rails.
- The **shifting corridors** are cable trenches and rows of recording-drum racks between the dishes. They rearrange by year, by construction.
- The half-roofless **control hall** holds a full-scale reconstruction of the original experiment.

**Years:**

| Year | Look |
| --- | --- |
| PRESENT 2049 | A cold, clear night with the Milky Way, red aircraft lights on the dishes, sky #141c34 → #2a3a6a, frost. |
| PAST 2026 | The array under construction in blazing afternoon heat: heat haze, ochre, cranes. |
| FUTURE 2196 | Dawn: the dishes tilted and drifted with sand, wind, the Witness's lanterns. |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE SHIFTING CORRIDOR | `arrival` (spawn), `cableTrenches`, `drumRacks` |
| Q1 THE RECORDINGS | `dish1` … `dish9` (tagged "n OF 117"), `shelves` (the physical objects), `mimicPatrol` |
| Q2 THE EARLIER ROOMS | `echoGate`, `earlierRooms` |
| Q3 THE ORIGINAL EXPERIMENT | `controlHall`, `reconstruction` (console, step stool, two logs), `letterDesk` (side) |

**REVERSE:**

| Process | Kind | Weight | Notes |
| --- | --- | --- | --- |
| `shredded` | ink/paper | light | Settled; reassembles to reveal "RECORDING 117 OF 117". |
| `fallingDish` | fall | heavy | |
| patrols | patrol | — | |

The mimics **counter-reverse** any held process in their cone, which releases it. Hold out of their sight, or patrol-reverse them first.

**Cast:**

- The Witness as an `rb_ren_m/witness` hologram (in the recordings).
- Recordings of Kai at 20, 30 and 45: KAI and WITNESS voices, fx `recording`.
- **Watchers:** "security that mimics Kai's combat behaviour" (bible). They are red (#ff6a48) holograms of the player's current look, and they **replay the player's own earlier route through this place**.

**Beats.**

*Old:* LevelGen "arch" rooms; arrival / contradiction / encounter.

*New:*

- **Cold open** [1]: "RECORDING 117 OF 117." WITNESS "Version one hundred and seventeen. She woke. She asked where you were. I did not have an answer she would accept. Beginning again."
- **Threads:**
  1. **Navigate shifting corridors** (bible): rooms reorder at each switch; navigate by the recordings' timestamps. [5]
  2. **Match recordings to physical evidence** (bible): Kai at 20 at Mira's grave, at 30 with the activation system, at 45 alone. Match each to its object on the shelves. [6]
  3. **Security that mimics Kai** (bible). [6]
  4. **Use temporal echoes to access earlier rooms** (bible). [4]
  5. **Reconstruct the original experiment** (bible): 2026, 16:02, the console, a child's step stool, and two logs (ring 16:02:00, button 16:02:01). They are planted here and **not read until M22**. [5]
  6. The bible exchange, verbatim: [2]
     - KAI "You kept bringing her back."
     - WITNESS "I kept finding a world where she could exist."
     - KAI "And what happened to those worlds?"
     - WITNESS "They became the price."
  7. The memory: twelve-year-old Kai presses the button. [2]
     - NONE "Chamber One, 2026, 16:02. A boy on a step stool at a console built for grown men. A girl in yellow boots, in the chair, laughing."
     - KAI "I pressed it."
     - WITNESS "You pressed it."
  8. Hook. [2]
- **Hook:**
  - KAI "I killed her."
  - MIRA (faint, from the ring) "No."
  - The archive's glass breaks, and storms stand on the horizon.
  - NONE "Mira's body did not survive the week. A pattern of her did. It stayed in the ring." (bible ending; U8 review: "the week" agrees with Rook's fever in M8, Ward 32 in M11 and the hospital bench in M20)

**Side stories:** **The Unsent Letter** (bible optional, 6): Mira's letter to "the man who keeps bringing me back". Deliver it or keep it (`letter`).

**Choices → later:** `letter` → M21 (delivered: the Witness reads it, and the confrontation changes) or M23 (kept: Mira asks if he ever read it).

**Target:** 32 + 6 = 38 (bible 70).

**Cinematic & audio:**

- Score `archive`: the Witness theme with overlapping recordings.
- Shifting corridors: stone and steel grind.
- The Mira-pattern reveal gets `reveal`. The hook ends on `cliff`.

**Must not look like:** M7 (ancient bronze), M16 (quarry).

---

### M18 — THE FRACTURE (Act III)

**Place: `fracture`** (style `fracture`). A 120 × 420 m traverse from the hills to the coast, under a planet-scale temporal storm.

| Quarter | Landmarks | What happens |
| --- | --- | --- |
| Q0 THE ANCHOR SETTLEMENT | `anchorMast`, `houseA`, `houseB`, `houseC`, `chronolithBench`, `garden` | A 2196 scrap village on a ruined motorway interchange: ramps are its streets, containers its houses, wind turbines turn. Evacuate three houses before the anchor mast fails. |
| Q1 THE CANYON | `canyonArch`, `waterShortcut` | A torn chasm in 2049 and 2196. In 2026 it is a narrow river canyon with a stone arch to cross. |
| Q2 THE FLOODED HIGHWAY | `highwaySign` ("HELIX NORTH 3 KM"), `lampPosts`, `surge` | In 2049 water covers the carriageway and the lamp-post heads are the stepping route. In 2196 it is dry and buckled. |
| Q3 THE COLLAPSING SKYSCRAPER | `slabs`, `floorFragment`, `pylon1`, `pylon2`, `pylon3`, `stabilizer`, `towerDeck`, `transmissionScreen`, `pocket` (side) | In 2196 its tilted floors are the climb, up to the 120 m lattice transmission tower on the coast. The stabilizer Sera repairs stands on the tower's base. |

**Sky (the only one of its kind):**

- a wall cloud with a ring-shaped eye;
- bands of different times moving across the sky (a band of starry night beside day);
- lightning coloured by year, wind and debris.

**Years** (states `['FUTURE','PAST','PRESENT']`): 2196, 2026, 2049. The storm stays; the land changes.

**REVERSE:**

| Process | Kind | Weight | Notes |
| --- | --- | --- | --- |
| `slabs` | collapse | heavy | Several pieces, reversed **last fallen first** to build a stair up the core: the hospital's lock rule at building scale. |
| `surge` | flow | heavy | About 5 s, or walk the lamp posts. |
| `porch` | collapse | medium | Side: frees the potter's kiln. |

At the end the charge cap rises to 12 s.

**Cast:**

- Sera; Mira's message (hologram, no shadow; fx `radio`).
- Iven, in the Last Signal.
- Evacuees: the 2196 crowd (water keepers, the potter, Sera's schoolchildren).
- Unwritten fighters or a quiet Continuum corridor, by `faction`.
- The city's people, if `city_freed`.
- **Watchers:** `rb_scav` in future fragments, a drone in present fragments.

**Beats.**

*Old:* 3 districts (settlement / rain / ruin, shared with M23); tasks / log / encounter.

*New:*

- **Cold open** [1]: storms stand like pillars. SERA, at the Chronolith with a manual: "This page is wrong. So is the next one."
- **Threads:**
  1. **Evacuate a settlement before its anchor fails** (bible; existing tasks). With `garden_restored`, the evacuees shelter in the garden. [8]
  2. **Cross a canyon that exists only in the past** (bible). With `water_route`, a shortcut. [4]
  3. **Navigate a flooded highway in the present** (bible). It is the river Kai taught to stay (C12). [5]
  4. **Traverse a collapsing future skyscraper** (bible). The fragment "floors numbered in the order they fall" is the clue. [6]
  5. **Defend a stabilizer while Sera repairs the Chronolith** (bible; `hold`): keep scavengers off three pylons for two minutes, switching years. With the Unwritten faction, fighters hold one pylon; with `city_freed`, the city's people help. Sera's line depends on `trust_sera`. [6]
  6. **Reach a planetary transmission tower** (bible), and Mira's message. [3]
     - MIRA "I remember the first world." KAI "Which one?" MIRA "The one before you tried to save me." (bible)
  7. Hook. [2]
- **Hook:**
  - MIRA "Come to the second that isn't on any clock. Come without fixing anything." (the bible ending: the Unwritten Second)
  - The tower's screen reads 00:00:00, then a time with no digits.

**Side stories:**

- **The Last Signal** (bible optional, 8): rescue Iven, or his team, from a collapsing pocket. Iven becomes an M21 ally whatever was chosen in M3.
- **The potter's kiln** (3).

**Target:** 32 + 8 = 40 (bible 60).

**Cinematic & audio:**

- Score `fracture`: all three eras' palettes overlapping.
- Beds per year: settlement water (2026), rain (2049), wind (2196). Temporal storms: a low rumble and reversed thunder at the pillars.
- The hook ends on `cliff`, then the Act IV card.

**Must not look like:** anything; this is the game's only storm-of-times sky.

---

### M19 — THE PLACE OUTSIDE TIME (Act IV)

**Place: `unwritten`** (style `salt`, custom helper `mirror`). A white salt-mirror plain: 2 cm of water reflecting the sky. 220 × 220 m with **wrapping edges**: walk off one side and return from the opposite one, so the roads loop (the bible's "roads loop").

- **Floating fragments** of earlier places at 2–12 m: the clockmaker's light-well gallery, an observatory ring segment, a Helix gallery, a piece of the station canopy. Paths join them.
- The **recurring symbols** (the clockmaker's mark, the observatory pattern, the Helix badge) are the only wayfinding. There are no objective markers.
- **The bridge visible only in reflections**: drawn mirrored below the water plane, with a collider above it and nothing visible above it.
- The same blue door stands alone in five places.
- The sky shows the unbuilt city hanging upside down in pale construction lines (Sky feature).

**Years.** High-key white-violet with no sun disc: sky #f4f0ff → #d8d0f0. 2049, 2026 and 2196 change which fragments exist and the mirror's tint.

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE LOOPING ROAD | `orrenRoad` (spawn), `clockMarks` |
| Q1 THE BRIDGE IN THE REFLECTION | `observatoryPattern`, `helixBadge`, `mirrorBridge`, `lagSite` |
| Q2 THE DOOR THAT IS EVERYWHERE | `door1` … `door5`, `realDoor`, `miraMeet` |

**REVERSE.** `reflectionLag` (mechanism, medium). Following the bible's "reflections moving out of sync", the reflection lags the world. Reverse the lag to sync it, and the bridge holds in this year too. The past-year bridge stays the other answer.

**Cast:**

- Orren (Xbot hologram, violet).
- Mira **in person**: `rb_mira/mira`, solid, her first appearance since M1.
- Echoes of people Kai has met: holograms of any model, deliberately.
- No watchers.

**Beats.**

*Old:* a ZoneGen "liminal" district (floating blocks, glass perimeter, dome); arrival / contradiction / encounter.

*New:*

- **Cold open** [1]: Orren sweeping a road that ends in sky. ORREN "Don't follow the footsteps. Follow what they refuse to step on." (bible bark)
- **Threads:**
  1. The clockmaker's mark: where it appears, the road is real. [6]
  2. The observatory pattern laid in stones. [5]
  3. The Helix badge set in glass. [4]
  4. **Cross a bridge visible only in reflections** (bible). [6]
  5. **Reach a door that appears in several locations** (bible). Deduction: the real door is the one with no shadow (C9). [5]
  6. Mira. [3]
     - MIRA "You've been trying to reach the version of me that would forgive you." (bible)
     - KAI "Is there one?"
     - MIRA "There's me. Start there."
     - The choice: open the door for her, or wait for her to open it (`m20_lead` = kai / mira).
  7. Hook. [1]
- **Hook** (bible ending):
  - MIRA "Saving me is not the same as understanding me, Kai. You keep solving the wrong puzzle."
  - She walks through the door alone, and it closes. It is a blue door.

**Side stories:** **Orren's three conversations** (rule discovery, 4). Is he a person, a memory or a pattern?

- ORREN "I was an anchor once. Or I will be. The tense is unkind here."
- ORREN "Which version of the question are you asking?"

**Choices → later:** `m20_lead` decides who leads in M20.

**Target:** 30 + 8 = 38 (bible 60).

**Cinematic & audio:**

- Score `liminal` (48 BPM or free time; glass, sub drone, bars of deliberate silence).
- Bed: near silence with faint bleeds of earlier places' ambience. Each floating fragment hums a pitch.

**Must not look like:** M20 (a garden in watercolour) or M22 (wedges).

---

### M20 — MIRA'S MEMORY (Act IV)

**Place: `memory`** (style `memory`). One 90 × 90 m plot, remembered three ways. The layout is shared, so the three memories can be aligned without being forced into one. The edges dissolve into white fog (the memory boundary, an invisible collider), and the sky is a watercolour wash.

**Years:**

| Year | Label | Look |
| --- | --- | --- |
| PAST | "THE HOUSE WITH THE BLUE DOOR" | A 2020s terrace house and back garden on a golden, overexposed summer evening, with a sprinkler and bikes. The kitchen opens to the garden through French doors, with the fridge drawing. |
| PRESENT | "THE FIRST EXPERIMENT" | The same plot overlaid by the 2026 Helix chamber: a white void with only the remembered objects in colour, walls dissolving, the child-sized chair. |
| FUTURE | "THE WORLD WITHOUT KAI" | The same plot as adult Mira's seaside garden in morning light. The sea is where the street was; Mira is planting; the 41 stop at the corner. |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE HOUSE | `kitchen` (spawn), `fridgeDrawing`, `yellowBoots`, `nightBadge`, `garden`, `blueDoor` |
| Q1 THE EXPERIMENT | `whiteChamber`, `childChair`, `console` |
| Q2 THE WORLD WITHOUT KAI | `seaGarden`, `miraPlanting`, `memorialNobody`, `stop41`, `alignBoard`, `houseNoOwner` (side) |

**REVERSE.** Refused everywhere: every target reads "✕ A MEMORY" (R6). The first attempt triggers MIRA "Don't. Let it happen the way it happened."

**Cast:**

- Young Mira (`rb_child_f`, now solid) and young Kai (`rb_child_m`).
- Adult Mira (`rb_mira/mira`).
- The Witness at the console (`rb_ren_m/witness`).
- In the world without Kai, adult Mira appears alone.

**Beats.**

*Old:* a ZoneGen "liminal" district (memory palette); log / contradiction / encounter.

*New:*

- **Cold open** [1], a kitchen in 2026:
  - KAI12 "It goes up, and then up again, and then it stops."
  - MIRA9 "It goes up, up, and then down."
  - KAI12 "Stops."
  - MIRA9 "Fine. Stops. For you."
- **Who leads** (from M19): if Kai leads, his tidy version comes first and the puzzle refuses it; if Mira leads, she shows him the hospital bench.
- **Threads:**
  1. **Explore Mira's childhood with Kai** (bible): the drawing on the fridge, the yellow boots, their mother's night-shift badge. [6]
  2. The song argument (C6). [2]
  3. **Replay the original experiment** (bible), from Mira's side. [5]
     - MIRA "You let me. I asked, and you let me. I was nine, Kai, not nothing."
     - KAI "I should have said no."
     - MIRA "Then I would have asked somebody else. I was that kind of nine."
  4. **Experience a discarded timeline where Mira survives but Kai disappears** (bible): the 41 is late, the memorial is for nobody, Mira at 32 plants a garden. [6]
  5. **Align three memories without forcing them into one perfect sequence** (bible). Any arrangement that keeps each memory's own order is accepted: "they are all hers". [6]
  6. The Child walks to adult Mira, and they hum it together, "and then down". This closes **The Child in Three Photographs**. [2]
     - MIRA "She's the part of me that stayed nine. She was waiting for someone to sing it right."
  7. The bible exchange: MIRA "I remember being your sister." KAI "That's not the same thing." MIRA "Would it be enough if I said it was?" [2]
  8. Hook. [1]
- **Hook:**
  - NONE "Mira is a reconstructed consciousness carrying memories from more than one possible life. None of them is false." (bible ending)
  - MIRA "Now he's going to try to fix it. He's already started."
  - Sirens from the Spire.

**Side stories:** **The House with No Owner** (bible optional, 8). In the world without Kai, the flat belongs to nobody on record. Inside are Mira's adult life alone, and a letter to a brother she never had (`ev_no_owner`, shown in the Ending C epilogue).

**Target:** 30 + 10 = 40 (bible 55).

**Cinematic & audio:**

- Score `memory` (64 BPM; felt piano, cello harmonics, reversed tails). Each memory has its own version:
  - childhood: the music box, the payoff for the Child's song;
  - the experiment: the cold `helix` palette;
  - the world without Kai: a warm full arrangement.

**Must not look like:** M19 (mirror plain).

---

### M21 — THE LAST BATTLE OF THE CONTINUUM (Act IV)

**Place: `spire`** (style `spire`). The Continuum Spire, a citadel on top of Rain City's tallest drowned tower, above the cloud layer.

- The cloud sea lies 10 m below the lowest terrace; through its gaps the M14 lagoon city shows far below.
- 160 × 160 m, 0–60 m high.
- Black basalt-and-glass terraces spiral up, with open-sided command halls and windbreaks.
- **The Arena:** a 70 m ring terrace round the transmitter mast. It collapses into the clouds during the causal puzzle.
- **The citadel's ring**, which the Witness turns.

**Years:**

| Year | Look |
| --- | --- |
| PRESENT 2049 (the citadel) | Hard noon above the clouds: zenith #1a3a7a, horizon #c8e0ff, a white cloud sea, wind. |
| PAST 2026 | The tower roof as it was, with a helipad and masts, at the cloud line. |
| FUTURE 2196 | The tower's ruin, with frost and broken glass, at a blue dusk. |

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE ALLY / ARRIVAL | `gliderDeck` (Sera), `lightBridge` (Anja), `serviceLift` (Iven), `kitchenDoor` (the people who listened), `stairsAlone` (nobody) |
| Q1 THE COMMAND STRUCTURE | `commandHalls`, `eliteRamps`, `cells`, `directorOffice` |
| Q2 THE ARENA | `arenaRing`, `arenaBridges` |
| Q3 THE WITNESS | `mast`, `citadelRing`, `witnessStand` |

**REVERSE:**

| Process | Kind | Weight | Notes |
| --- | --- | --- | --- |
| `eliteRewind` | patrol, R5 | medium | The elites rewind injuries and restore armour (bible). Hit by an Echo Step decoy, they snap back to where they stood 5 s earlier. Reversing their rewind leaves them stuck forward for 6 s, a window to slip past. Label "⟲ THE REWIND". |
| `arenaBridges` | collapse | heavy | The ring bridges fell in a known order; reassemble them last-fallen first. Only one can be held at a time; the earned ally holds a second for a scripted 30 s. |

**Cast:**

- The Director (by `rook_fate`).
- The Witness (`rb_ren_m/witness`).
- The ally in their own model: Sera, Anja, Iven, Rook (if persuaded), the people who listened, or nobody.
- The M10 prisoners, if they were held.
- Mara on the radio.
- **Watchers:** `rb_trooper/elite` (graphite, emissive visor).

**Beats.**

*Old:* LevelGen "bridge" (the Vessel Bridge with space windows); arrival / ally / encounter.

*New:*

- **Cold open** [1]: the Director addresses the Continuum. DIRECTOR "One permanent timeline. The Witness is building it for us."
- **Threads:**
  1. **Infiltrate the command structure** (bible). With `warned_evacuees`, a kitchen door opens. [6]
  2. **Fight elite enemies who rewind injuries and restore armour** (bible), played as decoy and reverse. [6]
  3. **Solve a multi-stage causal puzzle during an arena collapse** (bible): switch years, REVERSE, anchor. [8]
  4. **Call on an ally earned through earlier choices** (bible). Going alone always works. [3]
  5. Free the prisoners, if they were held in M10. [2]
  6. **Confront the Witness** (bible). The wrists side by side. The recording, the photograph or the letter, if carried, each gives him a beat of hesitation. [5]
  7. Hook. [2]
- **Hook:**
  - WITNESS "I was trying to find a version of me that didn't have to." KAI "And did you?" WITNESS "No." (bible)
  - He turns the citadel's ring, and the final experiment begins (bible ending).
  - Every clock in the citadel reads 05:40.

**Side stories:**

- **The Director's office** (3): Pryce, Rook, or an empty chair with a recorder.
- Mara on the radio (1): "Whatever you choose, I'll keep both records."

**Target:** 34 + 6 = 40 (bible 75).

**Cinematic & audio:**

- Score `command`: the war score colder, 110 BPM, with the Witness motif in the bass. The ally answers in their own voice.
- Wind across every terrace. The hook ends on `cliff`.

**Must not look like:** M10 (snowy night dam) or any Vessel deck.

---

### M22 — THE FIRST SECOND (Act IV)

**Place: `firstsecond`** (style `composite`, `sameAs` quotes of M1, M4, M6, M11 and M3; custom helper `wedges`).

- A radial place, 160 m across, on the Ring Hill at the First Second.
- At the centre, the **twin chamber**: 2026 at 16:02 and 2049 at 05:40 as one room, one half construction concrete and one half machined black. The final chamber lies under an **eclipsed black sun**.
- Five wedges surround it, each a fragment of an earlier place in its own year and light:

| Wedge | Fragment |
| --- | --- |
| `wedgeVillage` | the village terraces at golden evening; the causal-chain wall |
| `wedgeClock` | the clockmaker's light well in autumn; the arm |
| `wedgeHospital` | the hospital colonnade at noon; the lock |
| `wedgeStation` | the Line 41 canopy at 08:14 in rain; the PA microphone |
| `wedgeCourt` | the 2196 Helix court at misty dawn; Orren |

- The sky is divided into wedges like a clock face, converging at the zenith above the ring.

**Years.** 2026, 2049 and 2196 change the centre's half-states and which wedge is lit.

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE VILLAGE'S CHAIN | `wedgeVillage` (`chainWall`) |
| Q1 THE CLOCKMAKER'S PATTERN & THE HOSPITAL'S LOCK | `wedgeClock` (`clockArm`), `wedgeHospital` |
| Q2 THE FINAL CHAMBER | `twinChamber`, `finalSeals`, `evidenceTable` (two logs, Iven's testimony, museum memory three), `memoryCards`, `wedgeStation`, `wedgeCourt` (side) |

**REVERSE:**

| Process | Kind | Weight | Notes |
| --- | --- | --- | --- |
| `finalSeals` | lock | medium | M5's causal chain undone in reverse causal order (machine, gate, wall, river), with the hospital's lock rule (bible: "use inversion knowledge from the hospital"). |
| `clockArm` | mechanism | medium | Must be reversed on its counted beat (bible: "read a repeating pattern"). |
| `memoryCards` | refusal | — | "✕ A MEMORY". Physical records reverse to show their making, so the verb doubles as the test of "reliable evidence versus subjective memory". |

**Cast:**

- The Witness.
- Echoes from the settlement (the Elder), the clockmaker's house (Ezra), the hospital (Odile), each in its own era's models.
- Orren (side).

**Beats.**

*Old:* settlement plus two liminal districts; arrival / contradiction / encounter; the bible speakers reversed.

*New:*

- **Cold open** [1]: the station at 08:14, replayed. The Witness at the public-address microphone. WITNESS (fx `pa`) "Kai Varen. Do not build the machine." (C1 resolved)
- **Threads:**
  1. **Infer a causal chain from the ancient village** (bible): river, wall, gate, machine found. Kai assembles the chain. The wall also shows what Kai told Niko in M4. [5]
  2. **Read a repeating pattern learned in the clockmaker's house** (bible): the arm's count is the activation sequence. [5]
  3. **Use inversion knowledge from the hospital** (bible): the seals. [5]
  4. **Distinguish reliable evidence from subjective memory** (bible). Deduction from Iven's testimony (M8), museum memory three (M16) and the two logs (M17). [6]
     - NONE "Two logs, one second apart. RING: 16:02:00. CONSOLE BUTTON: 16:02:01."
     - KAI "It turned before I pressed it. I was a second late."
     - WITNESS "…No. I was a second early."
  5. The reveal, with the speakers fixed. [4]
     - KAI "You were trying to stop me from becoming you." (bible)
     - WITNESS "I was trying to find a version of me that didn't have to." (bible)
     - KAI "Every warning. Every voice in every speaker. That's what sent me in."
     - WITNESS "I know. I have known for a hundred and seventeen worlds. I kept thinking the next one would listen."
     - KAI "I'll sign for it."
  6. **Open the Chronolith's final chamber** (bible). [3]
  7. Hook. [2]
- **Hook** (bible ending: the Witness's attempts helped cause the Zero Second):
  - WITNESS "Then help me hold it open. Once. For her."
  - KAI "Not for her. For her to choose."

**Side stories:** **The Unwritten Record** (bible optional, 8). Orren's record of what each ending costs: A releases Mira; in B the boundaries are fought over; in C the anchor is a person. The final choice is then made knowing this.

**Target:** 30 + 8 = 38 (bible 50).

**Cinematic & audio:**

- Score `liminal`, with earlier places' ambiences fading in at their wedges (village water, workshop clocks, hospital beeps, station rain).
- The deduction gets `reveal`.

**Must not look like:** any single earlier place; its pieces are declared quotations.

---

### M23 — AFTERZERO (Finale)

**Place: `afterzero`** (style `composite`, `sameAs` quotes of M1, M4, M2 and M14).

- One 100 × 360 m road. It runs from M1's South Square (its exact layout fragment), through the settlement terraces, the Helix lab and the 2196 lagoon, to the Ring Hill and the original Chronolith.
- **Seams** where the years meet: asphalt turns to grass mid-street, and the 41 arrives through a field.
- The route the Witness holds is a corridor of still air through the storm.
- A **"rain rises" environmental zone** marks "inversion collides" (the sky drifts backwards over it).
- **Light progresses with the route:** night rain (the M1 quotation), then dusk (the settlement), then pre-dawn (Helix), then the game's first true **sunrise in the Notch** at the ring (M7's alignment pays off).
- **Ending skies:**
  - A: an ordinary clear morning, no ring.
  - B: the sky shattered into panes of different skies.
  - C: one warm light, no ring.

**Quarters & landmarks:**

| Quarter | Landmarks |
| --- | --- |
| Q0 THE OPENING STREETS | `platform41` (spawn), `streetCollapse`, `junPassengers` |
| Q1 THE SETTLEMENT, AGAIN | `tellingStone` (now with "HE CAME BACK", carved by Niko), `settlementBridge`, `tala` |
| Q2 THE HELIX LAB | `rookTransmission`, `ivenStatement` |
| Q3 2196 | `memorial2196`, `seraGarden`, `anja` |
| Q4 THE ORIGINAL CHRONOLITH | `originalRing`, `miraStands`, `endingChoice` |

**REVERSE.**

- `settlementBridge` (collapse, medium): Kai holds it.
- The Witness holds `streetCollapse` (scripted, his ring in Kai's colour). This is **the only moment with two holds at once**.

**Cast:**

- Mira; the Witness.
- Tala (if `water_route`); Mara; Jun (`jun_safe`); Sera; Anja; Iven; Rook's transmission.
- Each fragment's crowd uses its own era's table.
- Endings: Mira wakes as `rb_mira` (ending C), with no Kai.

**Beats.**

*Old:* rain / settlement / ruin districts (shared with M18); arrival / log / ending choice; one consequence (Jun's street).

*New:*

- **Cold open** [1]: the 41 arrives on time. Jun is on the platform, depending on M1.
- **Threads:**
  1. **Cross fragments of the opening streets** (bible): Jun's passengers clear them (exists), otherwise stealth. [6]
  2. **The settlement**: the telling-stone's new line; Tala, with `water_route`. [4]
  3. **The Helix laboratory**: Rook's last transmission (by `rook_fate`), and Iven. IVEN "Statement of Iven Marr. I signed for it." [4]
  4. **The future city**: Sera, and the memorial with "AND HE CAME BACK" if Kai accepted in M14. Anja (by M15). Sera's garden. [5]
  5. **Cooperate briefly with the Witness to hold open a route** (bible). [8]
     - Phase 1: he holds the collapsing street while Kai crosses by switching years.
     - Phase 2: they swap. Kai holds the settlement bridge while he crosses.
     - WITNESS "I will hold the route. Go to her."
     - KAI "Why now?"
     - WITNESS "Because this is the version where I ask."
     - WITNESS "And, Kai. For once, you are on time."
  6. **Reach Mira at the original Chronolith** (bible). She makes her own choice first. [4]
     - MIRA "Ask me."
     - KAI "Ask you what?"
     - MIRA "What I want. Nobody has. Not in a hundred and seventeen worlds."
     - KAI "What do you want?"
     - MIRA "A second that is mine. Not saved. Not fixed. Mine. Count it with me."
     - KAI "I thought the answer was to find the right world." MIRA "And now?" KAI "Now I think we kept asking the world to pay for our answer." (bible)
  7. **Choose what to preserve and what to release** (bible): the three endings, with their texts verbatim. [3]
  8. **Epilogue montage**: one line per consequence fact the player set (`ledger.EPILOGUE`). [3] Examples:
     - JUN "They all got off. I stopped apologizing."
     - GARDENER "The channel is running again. Nobody alive remembers who opened it."
     - CLOCKMAKER "Wednesday. Imagine that."
     - ANJA "We planted things."
     - NONE "Elias Rook testified for nine days. He said I signed it forty-one times."
  9. Post-credit: a clock ticks. VOICE (fx `pa`) "Version one hundred and eighteen." (bible) [1]
- **Ending additions** (after the bible text, before its quote):
  - **C:** NONE "Rain City, a Tuesday. The 41 is late." NONE "A woman plants something in a window box and hums three notes: up, up, and then down." KAI (very faint, fx `echo`) "Live."
  - **A:** NONE "The 41 is late." Kai smiles at it.
  - **B:** Sera at a boundary line, on guard.

**Side stories:** **The consequences gallery** (10). Visit the people your choices changed: Nurse Odile, the clockmaker, the twelve prisoners, the people who listened, Jun.

**Target:** 40 + 10 = 50 (the bible allows 90).

**Cinematic & audio:**

- Finale chapter card. The Main Theme returns in each region's palette as Kai crosses the fragments: Rain City piano, settlement flute, Helix metal, 2196 strings.
- Endings (§8.9):
  - A: the only full major cadence in the game.
  - B: the motif in two keys at once, never resolving.
  - C: piano and cello, string bloom, one breath of silence.

**Must not look like:** any single place; its pieces are declared quotations.

---

### CASE FILES (replaces the Cases chapter)

- The bible's ten optional missions and chains A–D now live inside missions:

| Story | Where |
| --- | --- |
| Chain A | M1 / M15 |
| Chain D | M2 / M3 / M8 / M18 / M21 |
| Chain B | M5 |
| Chain C | M15 / M16 |
| The Child in Three Photographs | M1 / M9 / M11 / M20 |
| The Train That Arrives Yesterday | M15 |
| The Unsent Letter | M17 |
| The House with No Owner | M20 |
| The Last Signal | M18 |
| The Names Beneath the City | M16 |
| The Clockmaker's Debt | M6 |
| The Ninth Minute: Evidence | M13 |
| The Survivor's Garden | M14 |
| The Unwritten Record | M22 |

- The CASE FILES screen lists each story with its bible state: not started / active / resolved / consequence observed. It replays a story from its place with the facts the player had.
- The keys `c_b` and `c_c` stay as replay entries, so old saves load. Add `c_child`, `c_train`, `c_letter`, `c_house`, `c_signal`, `c_names`, `c_debt`, `c_ninth`, `c_garden` and `c_record`.
- After an ending, "THE CASES" opens the case files instead of a closing card.
- The optional total is about 5 h 15 min, as the bible budgets.

---

### As built (U8): where Missions 14–23 and the case files differ from the sheets

- **M14:** the lift car is medium weight (1, at 3 m/s: a 24 m ride fits the 10 s charge, aimable from inside the car);
  the roof garden landmark is on the bank's terrace, west of the lift's landing.
- **M18:** the storm stands across the highway in 2026 and 2196, so 2049's lamp-post heads are the way; the slab stair
  replaces the first tilted floor (from the stump at 6 m there is no other way up), after the hold; the surge REVERSE
  is not built.
- **M19:** a second side story, THE CLOCKMAKER'S MARK (4 min: the gallery's arm reads `ezra_debt`), makes the optional 8.
  The reflection's lag is a mechanism that settles once reversed (R4), and the bridge then holds in every year.
- **M20:** the alignment is a board of six moments (two per memory), one placed a use; any interleaving that keeps each
  memory's order is accepted. Kai leading offers his tidy line first, which is refused; Mira leading, she speaks of the
  hospital bench (the place has no bench).
- **M21:** the elites walk the arrival deck (watchers patrol ground level). The arena drops three slabs: 270–285° and
  240–255° between the bridge and the summit stair, and 300–315°, which nothing spans, so the long way round is gone.
  The first gap is Kai's REVERSE; the second the earned ally's (a scripted 30 s hold) or 2196's frozen girder, or Kai's
  own REVERSE again. The kitchen door is a collider that lifts for `warned_evacuees`. Mara's radio (2) and the
  Director's office (4) are the optional 6.
- **M22:** the evidence table carries Iven's statement and the museum's card, so the deduction needs nothing from a
  side story (`inv_twoLogs_done && ev_iven_statement && ev_memory_card`); the arm's beat is 3 s with a 0.9 s window.
  The lexicon reads `16:02:00` as "sixteen oh two exactly".
- **M23:** the street that fell is a 6 m pit across the avenue (a stair out on its south side). In 2026 its south half
  is still the old street; the Witness holds the north half (his REVERSE, scripted, released once Kai is past). The
  settlement's timber bridge lies in the stream: Kai holds it while the Witness crosses, then crosses himself. The
  consequences gallery asks for three of its five people. The Finale's hook is the voice in every speaker; the
  epilogue has 21 lines (`ledger.EPILOGUE`), one per fact set.
- **M14:** the statue on the memorial's plinth is Kai's own body (`rb_ren_m`) in weathered stone, posed and then still.
- **M15:** the city's crowds speak for themselves (a resident's bread, a pupil's "Present, miss.", 2026's fans, 2049's
  evacuees); the other places whose crowds had no pool of their own (the 2026 builders downtown and at the array, the
  quarrymen, the 2049 drivers, Mira's neighbours and the walkers by her sea, the Spire's officers) got their own barks.
- **M18:** the slabs are in plain sight from the start but answer REVERSE only once the stabilizer holds (`arm`); the
  tower deck counts from then too.
- **M20–M22:** the cold opens stage their people (`coldOpen.cast`): the children at the fridge, the Director's
  broadcast (Rook, Pryce, or no one), the Witness at the station's microphone.
- **M23:** everyone on the road stands in every year (it is all of them at once), so nobody there is an echo; Mira is
  at the ring once the road has been walked to her (2196 done).
- **Epilogue:** Rook's testimony is said only where Kai exposed him (Iven's line with the raw log, else the narrator's);
  persuaded, Rook gives the drawing back. 21 lines in all.
- **CASE FILES:** the replays have no cold open or hook of their own (no new lines) and are lettered E–N after chains B
  and C, which are replays too now (Mission 5's gorge, Mission 15's archive, so chain B's gates are the same low, high,
  middle as in the mission); the chapters menu's card and THE CASES after an ending open the screen; a case ends back
  on it.

## 6. Casting

### 6.1 Rules

- Every NPC looks like who they are: role, gender, age, era.
- **Pronouns never change**, so the recorded voice genders stay right.
- **Named characters own their face.** A named character's model is never used in a crowd. The deliberate exceptions are all the same person:
  - echoes;
  - the Witness, built from Kai's model;
  - Ward 32's figure, built from Mira's model;
  - Lin and adult Mira (D7);
  - Haig, recording only.
- **Crowd faces never cross eras** (present 2026/2049, ancient, 2196): a repeated face reads as a clue in a time-travel mystery. The one exception is `rb_child_m2`, shared by 2049 and 2196, because Rocketbox has only four children.
- Neighbours in a crowd never share a model-and-variant pair. Height varies by up to 4%, walk speed by up to 8%, and hair is tinted.
- Props: umbrellas in Rain City, lanterns, staffs, clipboards, trowels.
- Rain City crowds are about 15% darker, to read as wet.
- Faction palettes (the bible's "faction variants"):
  - **Continuum:** slate blue-grey, helmeted;
  - **Unwritten:** rust-ochre, hooded;
  - **neutral survivors:** earth tones.
- The edition offers **Kai's realistic look only** (`looks: ['real_m']`). Kai is male in the bible and voiced male.

### 6.2 Named cast

Sizes are measured conversions; "~" is an estimate.

| Character (`id`) | Pr. | Model key — Rocketbox source | New? | Variant / wardrobe | H (m) | Voice `vid` | Missions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Kai Varen (`kai`, player) | he | `rb_ren_m` — Adults/Male_Adult_08 | — | `stone` for the M14 statue | 1.80 | KAI | all |
| Young Kai (`kai12`) | he | `rb_child_m` — Children/Male_Child_01 | 558 KB | brown hair | 1.42 | KAI12 | M11, M17, M20, M8 photo |
| Mira, adult (`mira`) | she | `rb_mira` — Professions/Medical_Female_01 | 745 KB | `mira`: tunic rose #c4566a, trousers denim, hair blonde; `raincoat`: tunic yellow, rain-dark (M1); `gown`: pale hospital blue (M11) | 1.68 | MIRA | M1, M11, M16, M18–M23 |
| Dr. Lin (`researcher`) | she | `rb_mira` (same mesh, D7) | 0 | `lin`: white tunic, hair dark-brown bun, ID lanyard prop | 1.66 | LIN | M2, M8; the M11 photo |
| The Child in the Station (`child`) | she | `rb_child_f` — Children/Female_Child_01 | 581 KB | pink top, blonde ponytail, yellow boots | 1.24 | CHILD (also MIRA9) | M1, M7 rec, M9, M11, M20 |
| The Witness (`witness`) | he | `rb_ren_m` | 0 | `witness`: silver hair, charcoal shirt, dark jeans, walk ×0.9 | 1.77 | WITNESS (VOICE on the PA) | M6 rec, M9 radio, M12, M17, M21–M23 |
| Sera Voss (`sera`) | she | `rb_juno` — Professions/Sports_Female_02 | — | `resistance`: vest top and cargo trousers in olive and dust | 1.70 | SERA | M10, M12 radio, M13, M14, M18, M21, M23 |
| Dr. Elias Rook (`rook`) | he | `rb_rook` — Professions/Business_Male_04 | 548 KB | waistcoat, shirtsleeves; `old` greyer (Director) | 1.80 | ROOK | M1 phone, M2, M3 radio, M8, M10/M21 if Director, M23 |
| Niko (`niko`) | he | `rb_niko` — Adults/Male_Adult_15 | 598 KB | undyed linen kurta, plain woven cap; `older` (beard greyed) | 1.76 | NIKO | M4, M5, M7 |
| Dr. Anja Vale (`anja`) | she | `rb_doctor_f` — Professions/Medical_Female_02 | — | stethoscope hidden, coat worn to sage off-white | 1.68 | ANJA | M15, M21, M23 |
| Iven Marr (`iven`) | he | `rb_engineer_m` — Professions/Construction_Male_04 | — | — | 1.80 | IVEN | M2, M3, M8, M18, M21, M23 |
| Jun Park (`jun`) | he | `rb_jun` — Professions/Business_Male_02 | 657 KB | navy transit blazer, line-41 amber tie | 1.74 | JUN | M1, M15, M23 |
| Tala (`tala`) | she | `rb_tala` — Adults/Female_Adult_06 | 625 KB | tunic indigo, scarf undyed | 1.66 | TALA | M5, M23 |
| Mara Quill (`mara`) | she | `rb_office_f` — Professions/Business_Female_02 | — | blazer faded brown, glasses | 1.68 | MARA | M15, M16, M21, M23 |
| Orren (`orren`) | he | Xbot hologram, violet #7a5fd0 | — | glow and shimmer distinct from Station Zero's Custodian | 1.80 | ORREN | M19, M22 |
| Officer Pryce (`guard`; `pryce` kept as an alias) | she | `rb_security_f` — Professions/Security_Female_01 | 632 KB (pistol dropped) | `helix`: black uniform and cap | 1.70 | PRYCE | M1, M2 rec, M8, M10/M21 if Director |
| Officer Dale (`dale`) | he | `rb_security_m` — Professions/Security_Male_01 | 710 KB | grey uniform | 1.80 | DALE | M2 rec, M8, M10 |
| Officer Haig (`haig`) | she | `rb_civ_f2` | 0 | `home`: T-shirt (recording only) | 1.67 | HAIG | M2 rec |
| The Elder (`elder`) | she | `rb_elder` — Adults/Female_Adult_10 | 461 KB | madder-red wool robe, staff in `handR`, walk ×0.8 | 1.60 | ELDER | M4, M22 echo |
| Ezra Moll, the Clockmaker (`clockmaker`) | he | `rb_ezra` — Adults/Male_Adult_03 | ~700 KB | tweed as a workshop dust coat, loupe; `ezra65` (2026 echo, grey-brown hair) | 1.74 | CLOCKMAKER | M6, M16 case, M22 echo, M23 |
| Rhea Odum (`engineer`) | she | `rb_engineer_f` — Professions/Construction_Female_01 | 673 KB | hi-vis, hard hat, `rain-dark` | 1.70 | RHEA | M9 |
| Sergeant Brask (`soldier`) | he | `rb_soldier_m` — Professions/Military_Male_02 | 872 KB | patrol cap, camo dyed Continuum slate; US flag patch painted out offline | 1.80 | SERGEANT | M9, M13 |
| Nurse Odile (`odile`, new) | she | `rb_odile` — Adults/Female_Adult_02 | ~600 KB | `ward`: sweater pale blue over white | 1.66 | ODILE | M11, M16 case, M22 echo, M23 |
| Ward 32's figure (`patient`) | she | `rb_mira/gown` hologram | 0 | silent, flickering | 1.68 | — | M11 |
| The Florist (`florist`, new) | she | `rb_florist` — Adults/Female_Adult_14 | ~600 KB | wrap cardigan, green apron | 1.64 | FLORIST | M1 |
| The receptionist (`receptionist`, new) | she | `rb_civ_f1` | 0 | `helix desk`; excluded from M8's crowd | 1.66 | RECEPTIONIST | M8 |
| District Warden (`warden`) | he | `rb_warden` — Professions/Police_Male_04 | 803 KB (pistol dropped) | faded charcoal, the wardens' red beret | 1.80 | WARDEN | M14, M15 |
| The Gardener, 2196 (`gardener`) | she | `rb_ren_f` — Adults/Female_Adult_04 | — | moss field trousers, trowel | 1.68 | GARDENER | M14, M23 |
| The Director of Continuity (`director`, new) | — | resolves by `rook_fate`: `rook/old`, `guard` (Pryce), or an empty chair with a recorder | 0 | — | — | ROOK / PRYCE / DIRECTOR | M10, M21 |
| Tomas, Anja's son | he | `rb_child_m2/patched` echo, silent | 0 | — | 1.30 | — | M15 |

*As built in the closing pass* (the player's casting note; the table above is U4's): Tala is `rb_tala` from Adults/Female_Adult_11 (her own hair, tied up), in an indigo tunic, an undyed mantle (the bible's undyed scarf, worn on the shoulders) and a madder belt; the Elder is `rb_elder` from Adults/Female_Adult_09, her hair greyed, in a madder-red wool tunic to the ground under a dark cloak, with her staff; Niko wears an undyed linen tunic and a woad mantle made by `garments.js` (his `older` greyer); none of them wears a head cloth. The receptionist has a face of her own (`rb_desk_f`, Professions/Business_Female_01, `helix desk`), and so does Officer Haig (`rb_haig`, Adults/Female_Party_02, `home`, a hologram in her recorded statement); Tomas is `rb_tomas` (Adults/Male_Adult_01, 1.42 m, `school`). No crowd wears any of these faces.

*As built in the castfix pass* (a completeness check of the player's "chose the character for npc perfectly"): Niko is `rb_niko` from Adults/Male_Adult_09, his own black hair long and tied back (Male_Adult_15's woven cap, dyed dark, still read as a prayer cap and is gone); the Elder's maps are aged at conversion (`tools/rocketbox-textures.py` EDITS `age`: silver hair, lines, paler skin), her back is bent (`stoop`) and her echoes carry her staff; Tomas is a child's body (Children/Male_Child_01, his own sandy hair and freckles, 1.52 m, a school jersey under a coat to the knee); the glazier of Missions 12, 21 and 23 is `rb_glazier` (Professions/Business_Female_04, `glazier`: copper hair, a petrol work jacket, a leather bib apron, a suction lifter), no longer the technicians' `rb_medic_f/helix tech`; the ticket keeper of Missions 14 and 23 wears `rb_trader/keeper`, not the traders' `faded`. Whoever comes back in two missions or more wears a look no crowd wears. *As built in castfix round 2:* Niko as an old man (Mission 7's cold open) is `rb_niko_old` (the same face, EDITS `age_m`: white hair, a short white beard, lines); the Elder's bun no longer silvers her breastbone and her robe is dyed as cloth; Tomas's and young Kai's echoes wear hair of their own (a mop, a crop), and every echo is drawn as its nearest surface.

### 6.3 Crowd wardrobe

**Present day** (Rain City, Helix, Northbank, the port, the hospital):

| Role | Model (Rocketbox source) |
| --- | --- |
| Commuters, f | `rb_civ_f1` (Adults/Female_Adult_15: blouse, skirt, boots), `rb_civ_f2` (Adults/Female_Adult_08: tee, jeans) |
| Commuters, m | `rb_civ_m1` (Adults/Male_Adult_04: leather jacket over a hoodie) |
| Shopkeeper, older | `rb_civ_m2` (Adults/Male_Adult_13: argyle vest) |
| Courier | `rb_courier` (Professions/Delivery_Male_01: flannel, beanie) |
| Contractors and 2026 builders | `rb_contractor` (Professions/Construction_Male_07: orange hi-vis, hard hat) |
| EMS and responders | `rb_medic_f` (Professions/Medical_Female_03: paramedic) |
| Transit staff | `rb_captain_m` (existing) |
| Helix researchers | `rb_doctor_m` (existing, stethoscope hidden) |
| Helix technicians | `rb_contractor` or `rb_civ_f2` in `helix slate` |
| Children | `rb_child_m2` (Children/Male_Child_02) |
| Continuum troops and patrols | `rb_trooper` (Professions/Military_Male_04: helmet, plate carrier) in `continuum` slate or `elite` graphite |

**Ancient** (the settlement, the river, the first sky):

| Role | Model |
| --- | --- |
| Men | `rb_robe_m` (Adults/Male_Adult_19) in ochre, indigo, undyed or madder, with the head cloth recoloured plain to remove the modern red check |
| Women | whichever named woman's mesh is absent from the mission (`rb_tala` in M4 and M7; `rb_elder` in M5 and M7), in umber, ochre or indigo |
| Children | `rb_child_f2` (Children/Female_Child_02) in linen |
| Crowd elders | darker `rb_robe_m` with a staff and a ×0.8 walk |

*As built in the closing pass* (both U4 reviews and the player read the robe, kurta, hijab and abaya avatars as present-day Gulf and Islamic dress; they are gone from the edition). Rocketbox has nothing that reads as ancient, so the settlement's clothes are made: `garments.js` tailors woven wool and linen to bare-headed bodies (a tunic's skirt and bodice, mantles, cloaks, sashes, belts), skinned to their own skeletons. The settlement's people, each in five outfits per palette:

| Role | Model (Rocketbox source) |
| --- | --- |
| Men | `rb_vill_m` (Adults/Male_Adult_07), `rb_vill_m2` (Adults/Male_Adult_12) |
| Women | `rb_vill_f` (Adults/Female_Adult_05), `rb_vill_f2` (Adults/Female_Adult_03); never a named woman's mesh |
| Elders, the storyteller, the astronomer | `rb_elder_m` (Adults/Male_Adult_05, grey-bearded), `rb_sage_m` (Professions/Business_Male_07, bald), slower, with old voices |
| Children | `rb_child_m2` (boys, and girls with a woman's hair moved onto the head by `hairdo`) |

Each mission dyes them from its own palette (`PALETTE` in `crowds.js`, `SETTLEMENT` in `wardrobe.js`): M4 `fire` (madder, ochre, undyed), M5 `water` (woad and undyed), M7 `sky` (the night sky-watchers' black wool, woad and plum), M22 `ash` (greyed, as the echo it is), M23 `fest` (the festival's saffron and madder); Case B replays M5's. Today's casual crowds do the same (`PRESENT_PALETTES`: M1 `rain`, M6 `autumn`, M9 `summer`, M11 `ward`, M14 `midday`, M15 `winter`, M20 `memory`, M22 `grey`, M23 `bright`).

**2196** (lagoon city, lock city, the museum, the fracture):

| Role | Model |
| --- | --- |
| Scavengers | `rb_scav` (Adults/Male_Adult_18, hood up) in grey, olive or rust |
| Traders and engineers | `rb_trader` (Professions/Wood_Male_01) |
| Gardeners, medics, archivists (f) | `rb_villager_f` (Adults/Female_Adult_09, cardigan), `rb_civ_f3` (Adults/Female_Adult_12, hoodie) |
| Children | `rb_child_m2`, patched recolours |
| Wardens in crowds | scavenger or trader meshes in the warden palette |

**The Unwritten Second:** holograms of people Kai has met, plus Orren.

Never use the burqa avatar (Female_Adult_16). Portray the settlement as sophisticated: it built the observatory and the water system. Someone must review the ancient wardrobe renders before the unit is done. (*Closing pass:* the robe avatars are gone, so no settlement person wears today's religious or regional dress; the render sheets of the made clothes were reviewed by eye in the pass, and a person's look at them is still welcome.)

### 6.4 Watchers

| Missions | Watcher |
| --- | --- |
| M2, M3, M8, M12, M18 (present fragments) | The Helix security drone, built from primitives in edition code (`watchers.js`), replacing Station Zero's Observer. M2's rewinding unit is a heavier drone. |
| M7, M14, M15, M18 (future fragments) | `rb_scav` with a lantern "eye"; in M7 with the Continuum circle badge |
| M9, M10, M13 (faction A) | `rb_trooper/continuum` with a helmet torch |
| M13 (faction B) | `rb_scav/unwritten` |
| M17 | A red #ff6a48 hologram of the player's current look, replaying the player's own earlier route |
| M21 | `rb_trooper/elite`, graphite with an emissive visor |
| M1, M4–M6, M11, M16, M19, M20, M22, M23 | none |

- A human watcher keeps the Observer's cone and suspicion. Its mesh is swapped inside the sentinel group after build (D14), and it is animated from its position delta in `edition.step`.
- The Observer robot model never appears in the edition.

### 6.5 Code

| Module | Job |
| --- | --- |
| `casting.js` (new) | `LV_MODELS` `{ key: { file, rig: 'rb', height } }`, registered into Actors' exported `MODELS` when the Runtime is constructed. That is after `main.js` computes its preload list, so models load lazily, with no `main.js` change. `CHAPTER_CAST` lists which models each chapter needs; they load behind the chapter card (`await loadActors(...)`), and the previous chapter's models are released where Actors allows. |
| `wardrobe.js` (new) | Variants: hide parts (`stetoskop`, pistols); recolour the "body" map by HSL rules (`{ band, lmin, lmax, hue, sat \| sset, light \| lset/lrange }`); hair tint; props on `userData.handR`. Skin protection uses each avatar's own skin colour, sampled from its head texture, because the fixed mask treats ochre and red cloth as skin. It runs **once per model and variant**, on the GPU (render-to-texture at 512 px) or in a Worker, then caches. Never on the main thread mid-play: the CPU canvas path took 0.3–1.7 s per texture. |
| `crowds.js` (new) | Era and region tables. `castCrowd(level, deck)` excludes named meshes present in the mission and rotates variants. `Runtime.buildLevel` sets `story.cast = CAST.concat(levelCast)` (CAST indices unchanged) and spawns the populations along `level.crowd` paths. |
| `watchers.js` (new) | `makeWatcher(kind, sd)`: the Helix drone, or a human actor plus wardrobe with the Observer's cone and a torch eye. |
| `world/People.js` (shared, ~8 lines, not on the perf pass's list) | `crewModelKey` takes `crew.model` first, if it is loaded. `makeCrewModel` calls a hook registered with `setCrewDresser(fn)` (for holograms too). Remove the edition rows from `BY_NAME`. |
| `main.js` (shared, ~2 lines at the LOOKS screen) | Filter LOOKS by `edition.looks`. |

### 6.6 Converter fixes and the manifest

The fixes, already tested in scratch copies:

1. Texture and material prefixes: the regex becomes `^[a-z]+\d+_`, in `tools/rocketbox-textures.py` and in `partOf()` (children's `cf001_` / `cm012_`, soldiers' `sm024_`).
2. Colour maps named `_color_acu` and `_color_blue` map to the plain colour map.
3. Bones renamed `Bip0N_` → `Bip01_` at import. Children are rigged as Bip02; without this they do not animate and have no eye triangles.
4. An `RB_DROP` per-entry part list (pistols).
5. An edition `AVATARS` set with per-entry texture size: named characters at 1024 px, crowd at 512 px.

Clone and build rules:

- Clone Rocketbox sparsely and blobless into the scratchpad, never into the repo. Do not run `git ls-tree -l` on the blobless clone.
- Add one `CREDITS.md` row (MIT, Microsoft Rocketbox) per new `rb_*`.

**Edition model manifest.** `android/build-apk.sh` with `EDITION=lastversion` copies only these models into the APK and the preview:

- existing: `rb_ren_m`, `rb_ren_f`, `rb_juno`, `rb_doctor_f`, `rb_doctor_m`, `rb_engineer_m`, `rb_office_f`, `rb_captain_m`, `Xbot`;
- 31 new: 16 named (`rb_child_m`, `rb_mira`, `rb_child_f`, `rb_rook`, `rb_niko`, `rb_jun`, `rb_tala`, `rb_security_f`, `rb_security_m`, `rb_elder`, `rb_ezra`, `rb_engineer_f`, `rb_soldier_m`, `rb_odile`, `rb_florist`, `rb_warden`) and 15 crowd (`rb_civ_f1`, `rb_civ_f2`, `rb_civ_f3`, `rb_civ_m1`, `rb_civ_m2`, `rb_courier`, `rb_contractor`, `rb_medic_f`, `rb_child_m2`, `rb_child_f2`, `rb_trooper`, `rb_robe_m`, `rb_scav`, `rb_trader`, `rb_villager_f`).
- *As built in the closing pass:* 45 edition models (`LV_MODELS`; 49 files with the shared four, 29.1 MB): the robe and villager avatars are gone, and the settlement's six (`rb_vill_m`, `rb_vill_m2`, `rb_vill_f`, `rb_vill_f2`, `rb_elder_m`, `rb_sage_m`), `rb_surv_f`, `rb_tomas`, `rb_desk_f` and `rb_haig` are new. Conversions leave out FBXLoader's node extras (a fifth of a model's bytes, read by nothing; `--strip` rewrote the older ones).

The stylised looks, the women's looks, Michelle, Nova, `rb_pilot_f` and `rb_gardener_m` are not shipped in the edition.

| Models | Size |
| --- | --- |
| New, total | ≈ 17 MB (named ≈ 10.4 MB, crowd ≈ 6.8 MB) |
| Removed from the edition APK | ≈ 23 MB |
| Net | ≈ −6 MB |

---

## 7. Inversion: the REVERSE verb

### 7.1 In one line

Three switchable years remain: PAST, PRESENT and FUTURE, on the existing engine. The bible's
"Inverted state" becomes a local verb, **REVERSE**, unlocked in Mission 11.

- Kai aims at one process he can see: something that fell, burned, flooded, was assembled, was written or walked.
- He holds it running backwards for a few seconds, paid for from a reversal charge and from Chronolith stability.
- Kai's own gravity never changes. No law, token, device or ceiling remains.

### 7.2 Engine changes (edition only)

- **`index.js`:**
  - `states: ['PRESENT','PAST','FUTURE']`, and drop INVERTED from `labels`.
  - `engineOptions(): { slots: 0, unlocked: 0, laws: [], states, baseline: 'PRESENT', residue: 'PAST', stateEffects: { PAST: { echoVisible: true, echoSolid: true } } }`. With this, `engine.gravity()` is always −1; `main.js` still calls it, harmlessly.
- **Authored reversal is not a state.**
  - In interiors: `engine.setOverride(rid, { timeReverse: true })` on chosen rooms (M11's reversed wards). It reuses DeckWorld's reversed watchers and sweepers.
  - In open places: edition "reversed zones" (boxes) in which authored cycle processes run backwards.
- **`Runtime.js`:**
  - `makeStory` mechs become `['echo','sentinel','time']`; drop the gravity clause in `fits()`.
  - Remove `unlockSlot(3)`.
  - Remove INVERTED from `shift()`, the flash, `stateNight`, `stateFog`, `stateDensity` and the grade.
  - `shift('4')` and `set:4` become `inv.trigger()`.
- **`dress.js`:** drop the `@INVERTED` debris and the "stardust" weather. `dress.js` is retired entirely in U2–U3.
- **`Build.js`:** effects `['echoSolid']`.
- **`resume()` migrates old saves:**
  - room states not in `LV.states` go to the baseline;
  - INVERTED is stripped from `engine.available`;
  - `campaign.inv` defaults to `{ cap: 8, charge: 8 }`.
- **PRIMES** (starting a chapter from the menu): `has_inversion` for Act III, Act IV, the Finale and the case files; `inv_cap` 10 from Act III and 12 from Act IV. Act II reaches the verb by playing M11.

### 7.3 Input, targeting, lifecycle

**Input:**

- Desktop:
  - **R**, through a window `keydown` listener in the capture phase. It is edition-only and ignores INPUT and TEXTAREA. It stops `KeyR`, so the shared KeyR→shift duplicate never fires; Q stays the year switch.
  - **4** is an alias.
  - Aim with the crosshair.
- Touch:
  - An edition-owned 60 px **⟲** button in `#buttons`, left of the YEAR button, with a conic charge ring.
  - It reads REVERSE, or RELEASE while a process is held. It is hidden until `has_inversion`, and dim with no target.
  - It binds its own touchstart, because Input binds `[data-act]` only at startup.
  - The floating target label is tappable too.
- **One press toggles** (D5): on a target it starts; while a process is held it releases.

**Targeting** (every frame, not in menus):

- Candidates are processes in Kai's room, available in this year (their `when`), within reach: 22 m outdoors, 14 m indoors.
- Pick the smallest angle between the camera's forward and the aim point: ≤ 10° on desktop, ≤ 16° on touch. Ties go to the nearer.
- Line of sight is checked with `player.rayDistance`, for the best two candidates only.
- Touch assist: the nearest process within 8 m in the front half of view.
- Shown: a silver ring and the label "⟲ THE BRIDGE · 4 s", or "✕ NOT A PROCESS" / "✕ A MEMORY" on authored refusals.

**Lifecycle:**

1. Start.
2. Reverse: the phase runs from rest to origin at its rate.
3. Hold at origin while the charge drains.
4. Warning at 1.5 s left.
5. Release: the process runs forward again from where it is.

A hold is also released by:

- switching year (a process belongs to its year);
- a snap-back;
- moving farther than reach × 1.6;
- aiming at a new target and pressing.

A piece never seats into Kai: it hovers 0.3 m short until he steps clear.

### 7.4 Rules

These are taught in M11, and each is one line on the case board's ABILITIES block.

| Rule | Text |
| --- | --- |
| R1 | One thing at a time. |
| R2 | It holds only while charged, then goes forward again. |
| R3 | What you do while it holds stays done: crossed, read, taken, opened. |
| R4 | If nothing pushes it forward, it stays reversed ("settled": a bolt backed out, ink un-written, a shell that never landed). Settled processes are saved. |
| R5 | Reversing something already running backwards runs it forwards: reversed wards, rewinding enemies, backwards recordings. |
| R6 | Never a person, never a memory. This is the theme: Kai's flaw is "believing every loss can be reversed". Authored refusals: the M11 flatline monitor, the M14 memorial, all of M20, the M22 memory cards. |

### 7.5 Energy and stability

| Item | Value |
| --- | --- |
| Charge capacity | 8 s from M11; **10 s** after M13 (the stabilizer coil retune, whichever choice was made); **12 s** after M18 (the transmission tower) |
| Weight (charge per second held) | light 0.5 (paper, ink, recording, smoke, bolt, shell); medium 1.0 (bridge of ≤ 6 pieces, stair, door, rope bridge, beam, patrol, mechanism); heavy 1.5 (lift car, slab, flood, bridge of > 6 pieces) |
| Start cost | 0.5 s of charge, plus stability 0.03 / 0.06 / 0.10 for light / medium / heavy |
| Refusal | under 1 s of charge, or stability below 0.2. KAI "Not now. The Chronolith can't hold anything back." |
| Unstable regions | a hold drains stability at the existing out-of-present rate (0.045/s) |
| Recharge | +1.25 s/s after 1 s idle (empty to full in 6.4 s) |
| Minimum hold | 0.6 s |
| Wrong lock bolt | −1.5 s of charge and −0.03 stability |
| Typical holds at 8 s | medium bridge ≈ 7.5 s; heavy lift ≈ 5 s; a document up to its 12 s cap |

### 7.6 Process kinds (`processes.js`)

Each builder returns level elements plus a record:

```js
{ id, kind, room, label, aim: [x, y, z], reach, weight, max, settle: 'held'|'settled', when, rate,
  parts: [{ rest: { p, q }, origin: { p, q }, box, order }], solid, fact: 'rev_<id>', done: 'inv_<id>_done',
  refuse, hints: [3], sound }
```

| Kind | Examples | At rest | Reversed | Released | Notes |
| --- | --- | --- | --- | --- | --- |
| `collapse` | bridge, stair, catwalk, scaffold, slab | Rubble with fall poses, the last to fall on top. | Pieces fly back in reverse fall order along their arcs (1.4 s) and seat as solid. | A 0.8 s creak and shake, then they fall in order over 1.2 s; each collider goes as its piece leaves. | held |
| `fall` | lift car, crate, statue, beam across a door | Fallen. | Rises along its arc at 2 m/s and carries Kai. | A 0.6 s groan, then it falls back. | held |
| `flow` | flood, surge, waterfall, smoke, steam, sand, soil | The water volume is a "fall" setback trigger; smoke blocks sight. | Drains, or draws back into its vent, in 1.2 s. | Refills in 1.5 s. | held |
| `burn` | rope bridge, ladder, wooden stair, door, document | Char. | Embers sink and the char recedes (1 s). Solid, or a scene with `when: 'rev_<id>'` becomes readable. | Re-ignites from the same point in 1.2 s. | held |
| `lock` | bolts or seals with an assembly order | Assembled. | Only the last-fitted remaining part backs out. Any other part turns half back, then snaps forward (a jam). | — | settled |
| `ink` | layered writing | All layers written. | The newest layer un-writes stroke by stroke (1.5 s), revealing the text under it. | Stays un-written; later lines can mention it. | settled |
| `recording` | a voice-pack line | Plays sample-reversed in a loop. | Plays forwards once, subtitled. | — | R5 |
| `patrol` | a watcher | Normal patrol. | The edition logs every watcher's pose 10×/s for 8 s and plays it backwards: the watcher moonwalks with its cone on its old heading, and its suspicion rewinds ("un-sees" Kai). | Patrols on from there. | via `stasisT` plus a pose override after `deckWorld.update` |
| `mechanism` | gears, rotating platforms, clock arms, fans, turnstiles, sweepers, reflection lag | Runs forwards. | Runs backwards at its speed. | Forwards again. | held |
| `projectile` | a shell or a thrown stone on an authored cycle | In flight. | Flies back up its arc to its origin, which is tagged with a marker and a case-board pin. | Never lands. | settled, local |

**Moving colliders.**

- The edition adds its own entries to `deckWorld.temps`: `{ mesh: an empty Object3D, box, t: Infinity }`.
- It mutates `box.min` and `box.max` in place each frame, and calls `refresh()` only when solidity changes.
- It removes its own entries on release and unload. An entry must never reach expiry: expiry calls `geometry.dispose()`, which would throw on an empty group.
- Fallback, only if the perf pass changes `temps`: a 2-line `extraColliders` hook in `DeckWorld.refresh` (§10).

**Budget:** ≤ 12 processes per level, ≤ 10 parts each, one merged mesh per process at rest.

### 7.7 How it reads

**Visual:**

- Affordance (only once unlocked): reversible things glint silver every ~4 s within 25 m and show a tell: dust falling up off rubble, a drip climbing, an ember sinking.
- Aimed: a silver-violet emissive pulse on the parts, a ring, and the label with the hold seconds.
- Reversing: particles drawn into the seams (pooled Points, ≤ 200), afterimage copies along each path, a contracting ring at the aim point.
- Holding: a thin violet edge vignette, with no world tint (it is not a world state). The shimmer flickers in the last 1.5 s.
- Release: the usual `fx.burst` (dust, splash or sparks).
- Colour #c9b8ff with a cyan fringe. **The Witness's reversals (M12, M23) use the identical colour and sound**, as a fair clue.
- Environmental reversal (M11's court, M23's zone) uses the same palette, dimmer: rain rising, glass flying back into frames, the sky's clouds drifting backwards over the zone.
- Comfort mode removes the flicker and the vignette.

**Audio** (procedural, through `g.audio.ctx` / `master` / `sfx`, `Synth.osc` and `Synth.noise`; no files):

| Moment | Sound |
| --- | --- |
| Acquire | a short reversed tick |
| Start | a reversed swell (0.5 s of noise, exponential attack, hard cut) plus reversed material grains (stone, water, fire, metal, pen), built once as AudioBuffers |
| Hold | a low two-note drone on the mood's root, plus a reversed clock tick every 0.5 s (0.25 s in the last 1.5 s) |
| Release | a 0.8 s creak, then the same grains forwards |
| Jam | a reversed ratchet, a forward clack, a deny |
| Refusal | a dull stop plus Kai's line |

- The music is ducked to 0.35 while holding.
- When an inverted watcher enters view, the music mutes for 0.4 s and the sequencer shifts half a bar (the bible's combat cue).
- Reversed wards play the intercom's "Temporal discontinuity." sample-reversed. `recording` processes play reversed until Kai reverses them.
- Subtitles carry sound tags such as "[the song grows quieter]" when captions are on.

### 7.8 HUD (what replaces the 4th pip)

- The year card shows only the mission's years with its labels (at most three pips) and the stability bar.
- From M11, a **REVERSE chip** sits beside the card:
  - idle: "⟲ 8s" with a charge ring;
  - while holding: "⟲ THE BRIDGE 4.1";
  - it brightens when a target is aimed, and dims in calm mode unless holding.
- No `HUD.js` change: the edition wraps `#state` in a flex row `#lvTop` (moving the node, so HUD keeps its reference) and adds `#lvReverse` beside it. CSS is injected as `<style id="lvInv">`, scoped to `body.lastversion`.
- A thin charge ring around `#crosshair` when aiming or holding.
- Touch: the ⟲ button. **SHIFT is relabelled YEAR** and coloured by the next year, not `--inverted` pink.
- Title keys: "Q switch year · 1 2 3 choose a year · R reverse". The blurb: "three years of one world".
- Case board: an ABILITIES block (year switching, the anchor, Echo Step, REVERSE with R1–R6 and the current cap).

### 7.9 Remnant removal (all at runtime, in edition code)

- Post-pass in `buildLevel` (until U3 retires the generators):
  - `level.tokens = []`;
  - keys relabelled `KEY (2026)` instead of "MEMORY KEY";
  - the ZoneGen dome kept only as a lid until U2/U3 replace the places.
- HINTS rewritten without ceiling, dome or "inverted", as two tier sets gated on `has_inversion`.
- `title()` relabels:
  - dock and touch aria-labels: Think, Echo Step, Switch year (no LAWS, TICK or "Next law combo");
  - the `#journal` h2 becomes CASE BOARD;
  - SHIFT becomes YEAR.
- `main.js` comfort-setting text becomes edition-aware: "Steadier camera, no flashes" (1 line, guarded by `this.edition`).
- `DESIGN.md`, `STATUS.md` and `README.md` drop "four temporal states", "walk the ceiling" and "gravity flips".

### 7.10 Integration

| Hook | What it does |
| --- | --- |
| `LastVersion` constructor | `this.inv = new Inversion(this)` |
| `buildLevel` | collects `deck.processes` (and per-quarter processes) and builds them at `level.sites` / landmarks |
| `onSectorLoaded` | `inv.load(level, deck)`: builds meshes into `deckWorld.root` and restores settled processes from flags |
| `step` | `inv.step(dt)` |
| `shift` | `inv.release('year')` |
| `snapBack` | `inv.release('snap')` |

- Facts: `rev_<id>` while held, `inv_<id>_done` when settled. Both are usable in scene `when` and in deck rules.
- Saves: `campaign.inv` and `deckWorld.flags`.
- Every refusal, hint and rule line is walked by `spokenLines()` (§8.2).

---

## 8. Audio

### 8.1 Why the player heard nothing

- **The preview.** The published preview (claude.ai/artifact/GDpG6YCybK2cj8P3gPXRrr) and the 2026-10-18 APKs ship the **pre-edition pack** (voice.json 86 KB, voice.ogg 6.3 MB). It has no KAI, MIRA, WITNESS or any other edition speaker.
  - All 682 unique edition lines fall through to `Voice.speakDevice` → `speechSynthesis`.
  - The claude.ai app's WebView has no `speechSynthesis`, so the preview is silent. On Android the lines get AndroidTTS: robotic, or nothing.
- **The `3e729ff` pack** (13.06 MB, 3,348 clips, 88.6 min) voices 567 of the 682 lines. 115 lines (17%) still miss:
  - 78 memory fragments;
  - 17 Kai hints in M2 and M3;
  - 4 M2 recordings;
  - 10 echo lines;
  - 3 task refusals;
  - 1 socket template;
  - Iven's M3 bark.
  - These miss because `tools/voice-pack.mjs` collects only `allLines()` plus a regex.
- **One voice for all minor characters.** Every `CREW` line is recorded only as CREW_n (`af_kore`, a woman). 12 named tier-2 NPCs, men included, speak in one female voice.
- **Text shown but never spoken:**
  - mission cards; chapter cards (none exist);
  - the three ending quotes;
  - choice labels (Kai never says what you chose);
  - the "because" lines.
- **Stage directions read aloud:** "[ANNOUNCEMENT]", "A post-credit clock begins ticking.", and outros that are bible summaries. Spoken hints name keys ("Press 2"), which is wrong on a phone.
- **Pronunciation:** "2049" is read as "two thousand forty-nine", "05:40" as "zero five forty", "Act II" as "act roman two".
- **Splicing:** 10 lines are split on Station Zero's vocabulary ("observatory", "the bridge", "Park").
- **The Zero Second:**
  - `Synth.silence()` ducks the master bus, which mutes the narration too.
  - It restores the master to `volume` instead of 0.7 × `volume`: about +3 dB after every Zero Second, and it un-mutes a muted game.
  - The VOICE is dry, not heard through a speaker.
- **Unlock and lifecycle:**
  - The AudioContext is created only in `begin()`; there is no resume path.
  - No `visibilitychange` handling.
  - On iOS there is no `audioSession`.
  - `Synth.schedule` bursts after a throttled background.
  - `Voice.clips` caches every decoded clip forever (~190 KB per second of speech).
- **Music:** one 4-chord loop per state, identical in every mission. One noise bed per mission.

**Release note (outside the units):** republishing the preview and rebuilding the APK with the `3e729ff` pack takes the edition from 0 to 567 of 682 lines voiced. Whoever ships should do it; this overhaul then takes it to 100%.

### 8.2 One source of truth: `voicelines.js` (new)

`spokenLines()` returns `[{ who, text, extra: { id, fx, cue }, group, path }]`. `group` is the pack group (§8.3); `path` locates the line in the data. It walks:

- **Static data:**
  - intro, outro, coldOpen, hook;
  - `rules.say`, scenes and their `_no` variants;
  - choices (lines and `after`);
  - beats, threads, sides, talks and deductions;
  - hints and process refusals and hints.
- **Every built level:**
  - NPC lines, dialogue, choices, barks, echo lines;
  - fragments, records, challenge hints, sockets.
- **Edition tables:** DIALOGUE, NPCS barks and echoes, AMBIENT barks rendered in each region's crowd voice pool, HINTS, Runtime LINES.
- **Cinematic lines:**
  - mission-card titles;
  - chapter-card lines;
  - choice labels spoken by Kai (`c.say || c.label`, unless `c.mute`);
  - the ending sequence, with the bible quotes as KAI;
  - the PA announcer.

Lint rules:

- **Templates are removed.** Socket, task-refusal and default-echo lines become authored per label.
- A lint test forbids `say(` / `hud.say(` with `${…}` in edition code.

Consumers:

- `tools/voice-pack.mjs --edition lastversion` and the unit tests both use it.
- `index.js` `allLines()` becomes a thin wrapper over it.
- The default (Station Zero) collector drops its edition section.

### 8.3 Packs per chapter

- Layout: `game/assets/voice/lv/<group>/voice.{json,ogg}`. The groups are `common`, `prologue`, `act1`, `act2`, `act3`, `act4`, `finale` and `cases`.
- A piece used by more than one group goes to `common`: DIALOGUE, barks, HINTS, LINES, cards and chapter cards.
- At runtime the edition loads `common` plus the current chapter, prefetches the next chapter during a chapter's last mission, and releases the previous one.
- Station Zero's `assets/voice/voice.*` stays byte-identical and is not rebuilt.
- The edition APK and preview copy only `voice/lv/**`.
- Edition packs use an **empty vocab**: whole sentences are recorded and nothing is spliced. This needs a 2-line guard in `voiceKey.js`; a non-empty vocab behaves exactly as before.

### 8.4 Voices (`tools/voice-pack.py`)

- `voice-pack.py` gains blend specs: `'a*w+b*w'` → `sum(w · get_voice_style(a))`. The cache-key formula stays the same, so unchanged voices reuse the cache.
- Every NPCS entry with lines gets a `vid`.
- No edition line may resolve to `CREW_*` (test).
- **D8 holds:** the same person shares a base voice.

**Principal cast**, unchanged unless noted:

| Speaker | Voice spec | Speed | Pitch | Note |
| --- | --- | --- | --- | --- |
| NONE (narrator) | `bf_emma` | .95 | 1 | |
| KAI | `am_eric` | .98 | .98 | |
| KAI12 (new) | `am_eric*0.5+am_puck*0.5` | 1.05 | 1.25 | young Kai |
| WITNESS | `am_eric*0.6+am_fenrir*0.4` | .88 | .90 | **changed**: Kai after years without sleep; re-render his clips |
| VOICE | same spec as WITNESS | .88 | .90 | always fx `pa` |
| MIRA | `af_river` | .96 | 1.02 | |
| LIN (new) | `af_river*0.7+af_heart*0.3` | 1.00 | .97 | Mira's base, disguised |
| CHILD (also MIRA9) | `af_river` | 1.02 | 1.20 | **changed** from `af_nicole`: she is the part of Mira that stayed nine |
| ROOK | `bm_lewis` | .94 | .95 | |
| NIKO | `am_echo` | 1 | 1.02 | |
| SERA | `af_jessica` | 1.02 | .98 | |
| ANJA | `bf_isabella` | .95 | 1 | |
| IVEN | `bm_fable` | 1 | .96 | |
| JUN | `bm_daniel` | 1.02 | 1 | |
| TALA | `af_aoede` | .95 | 1 | |
| MARA | `bf_lily` | .92 | .98 | |
| ORREN | `am_adam` | .86 | .88 | |

**Tier-2** (new ids):

| Speaker | Character | Voice spec | Speed | Pitch |
| --- | --- | --- | --- | --- |
| PRYCE | Officer Pryce (checkpoint, M2 recording, Director) | `af_sarah` | .97 | .96 |
| DALE | Officer Dale | `am_liam` | .97 | .96 |
| HAIG | Officer Haig | `af_sky*0.6+af_alloy*0.4` | 1.06 | 1.02 |
| ELDER | the Elder | `bf_alice*0.6+bf_emma*0.4` | .86 | .90 |
| CLOCKMAKER | Ezra Moll | `bm_george` | .88 | .90 |
| RHEA | Rhea Odum | `af_nova` | 1.02 | .98 |
| SERGEANT | Sergeant Brask | `am_onyx` | .95 | .94 |
| ODILE | Nurse Odile | `af_sarah*0.4+bf_lily*0.6` | .93 | .95 |
| WARDEN | the District Warden | `am_michael*0.5+am_onyx*0.5` | .95 | .95 |
| GARDENER | the Gardener | `af_kore` | .96 | 1.02 |
| FLORIST | the Florist | `af_bella*0.5+bf_alice*0.5` | .98 | 1 |
| RECEPTIONIST | Helix front desk | `af_kore*0.5+af_nova*0.5` | 1.02 | 1 |
| DIRECTOR | the unseen Director | `bm_lewis*0.5+am_onyx*0.5` | .90 | .90 |
| PA | the station announcer | `bf_alice` | .98 | 1 |

**Crowd pools.** The voice comes from casting's gender × age.

| Id | Voice spec | Speed | Pitch |
| --- | --- | --- | --- |
| CROWD_F | `af_bella` | 1 | 1 |
| CROWD_F2 | `af_kore*0.5+af_sarah*0.5` | 1 | .98 |
| CROWD_M | `am_michael` | .97 | 1 |
| CROWD_M2 | `am_puck` | .98 | .90 |
| CROWD_OLD_F | `bf_lily*0.5+bf_alice*0.5` | .90 | .92 |
| CROWD_OLD_M | `am_santa` | .90 | .95 |
| CROWD_CHILD | `af_nicole*0.6+am_puck*0.4` | 1.05 | 1.20 |

- `AMBIENT[region].voices` lists each region's pool.
- `Runtime.buildLevel` fills `n.voiceExtra = { id, gender }`, which DeckWorld's bark already passes on.
- The settlement's craftsperson, storyteller and village child (M4) speak from the pool.

### 8.5 Pronunciation lexicon (in `voicelines.js`)

The lexicon is applied to `say` for edition items only. Keys are unchanged, so subtitles keep their digits.

| Written | Spoken |
| --- | --- |
| 2049 / 2026 / 2196 (and 2017, 2031, 2061) | twenty forty-nine / twenty twenty-six / twenty-one ninety-six (and so on) |
| `h:mm` | words, a leading 0 read as "oh": 05:40 → "oh five forty", 08:14 → "eight fourteen", 16:02 → "sixteen oh two" |
| Act I–IV | Act One–Four |
| Jun | Joon |
| Dr. | Doctor |
| 41-B | forty-one B |
| 14TH | fourteenth |
| M.Q. | M. Q. |
| KM | kilometres |
| V. 117 | Version one hundred and seventeen |

- Bracketed tags are forbidden in spoken text (lint); they become speakers or fx.
- An **audition page** (an HTML list of the new clips, in the scratchpad) is used for an ear check before each pack commit.

### 8.6 `Voice.js` (shared; the Station Zero path is unchanged)

- **Loading packs:**
  - `loadVoicePack(base, onProgress)` is memoised per base and streams progress from `response.body`.
  - `voice.usePacks(bases, prefetch)` returns a promise; `ready()` and `loading` (0..1) report progress.
  - The constructor loads `assets/voice/` only when `EDITION !== 'lastversion'`.
  - `get pack()` returns `packs[0]` for the existing tests.
- **`plan()`:**
  - looks each piece up across the active packs; the first hit wins;
  - `extra.id` selects a recorded voice directly, overriding the CREW and gender rule.
- **`speak()`:**
  - returns the line's length in seconds;
  - **in the edition it never calls `speakDevice`**;
  - if a pack is still loading, the line waits (`pending`) and plays when the pack arrives, if that is within 2 s;
  - otherwise it records a miss (`window.__voiceMiss.push({ who, text })`, `console.warn`) and the subtitle carries the line.
- **Clip cache:** an LRU of at most 150 decoded clips (25–40 MB of PCM, worst case).
- **Effect chains**, chosen by `extra.fx`, built once, and ending in `this.out` → `audio.voiceBus` (*as built in U5:* the chains live in the edition, `editions/lastversion/voicefx.js`, handed to `Voice` as `voice.effects`; `Voice.js` only routes a line with an `fx` through them, and only in the edition):
  - `pa`: HP 300 Hz, LP 3.5 kHz, a +5 dB peak at 1.8 kHz, a 0.11 s slapback with feedback 0.3, and a reverb send. For station speakers, the announcer, the VOICE and the post-credit voice.
  - `radio`: HP 450 Hz, LP 3.2 kHz, a soft-clip waveshaper, and a −38 dB band-noise bed. For phones and comms, Rhea, Mira's transmission, the unseen Director.
  - `recording`: HP 200 Hz, LP 5.5 kHz, crackle, ±0.3% wow on `playbackRate`. For terminals, files, cylinders, the Witness's recordings, the archive and the voicemail.
  - `echo`: LP 2.4 kHz, reverb send 0.7, `playbackRate` 0.97, a 0.32 s delay with feedback 0.25. For NPC echoes, memories, and Ending C's "Live."
  - dry (default), which includes Kai's THINK hints.
- `fx`, `id` and `cue` travel inside `line.voice`, the extra that `main.js` already passes (`hud.onLine` → `voice.speak(text, who, line.voice)`), so `main.js` does not change. `Runtime.playNode` merges `{ gender, id: NPCS[id].vid, ...l.voice }`.

### 8.7 Unlock and lifecycle

- **`Synth.unlock()`** is called from the edition's `title()`, on window capture listeners for `pointerup`, `touchend`, `mousedown`, `keydown` and `click`. (Chromium does not treat a touch `pointerdown` as activation, and touch controls `preventDefault` on `touchstart`.) It keeps trying until `ctx.state === 'running'`:
  1. create the context if needed;
  2. `resume()` it;
  3. play a 1-sample silent buffer (iOS);
  4. set `navigator.audioSession.type = 'playback'` where available;
  5. start the title theme.
- If the context is still not running after a tap, an edition banner says "TAP FOR SOUND".
- On `visibilitychange`: `suspend()` when hidden, `resume()` when visible, with a fallback resume on the next tap.
- **Skip-ahead in `Synth.schedule`:** if `nextTime < currentTime − 0.3`, set `nextTime = currentTime + 0.05`. It never bursts.
- Opus decode is probed with the first clip. On failure (older iOS WebKit), the edition shows a one-time notice. An AAC fallback pack for the preview only is optional.

### 8.8 `Synth.js` (shared, small)

- New buses: `amb` (ambience beds connect to it instead of the master) and `voiceBus`.
- A `composer` hook: if set, `schedule()` calls `composer.step(synth, n, t)`, which returns the step length. Otherwise the built-in loop runs.
- **`silence(sec)` ducks music, effects and ambience, but not the voice**, and restores each to its own mix level. This fixes the +3 dB bug and the un-mute bug.
- `unlock()` and the skip-ahead (§8.7).
- With `composer = null` and bus gains of 1, Station Zero sounds the same.

### 8.9 Score and cinematic flow (`score.js`, `cinema.js`; procedural, 0 bytes of assets)

**Instruments:**

- built on Synth's public `osc` / `noise` / `pluck` / `bell` / `pad`;
- plus its own: felt piano, cello (saw → LP + vibrato), glass, bowed metal, frame drum, flute (sine + breath), tick, horn, brake, impact, water, crackle, birds, siren, and crowd walla (pack bark clips at −24 dB through LP and reverb).

**MOTIF** — the bible's three-note motif, which is also the Child's song: up a fourth, up a fourth, stop on an unresolved sus4.

| Where | Played as |
| --- | --- |
| Main Theme | piano |
| The Witness | slower and lower, on bowed metal |
| Mira | with reversed tails |
| The Child | a music box |

**REGIONS.** Each has PRESENT, PAST and FUTURE layers that crossfade over 1.5 s, with a `sweep()` as the signature transition, plus one shared location cell:

| Region | Missions | Cue | Tempo, mode | Instruments |
| --- | --- | --- | --- | --- |
| `rain_city` | M1 | Kai — The Need to Fix It | 92, A aeolian | dry piano cells, muted pulse, ticks drifting off-grid |
| `helix` | M2, M3, M8 (detuned), M12 (with the Witness theme) | | 84, D phrygian | bowed metal, sparse piano, two-note alarm pulse |
| `settlement` | M4, M5 | The Past | 82, E dorian | frame drum, breathy flute, plucks, water |
| `clockmaker` | M6 | | 72 | clock polyrhythm 60/72/90, music box |
| `observatory` | M7 | | 60, lydian | glass harmonics, low cello, wind |
| `loop_city` | M9 | Loop memory | 118 | one layer added per reset: bass → pulse → piano cell → strings → choir |
| `detention` | M10 | | 100 | muted percussion, a string ostinato on Kai's motif |
| `hospital` | M11 | | 64 | monitor beeps as rhythm, reversed pads |
| `war` | M13 | Nine-Minute War | 118, changing meters | layered percussion, string ostinati, a beat dropped every 9 bars, reversed impacts |
| `city2196` | M14 | Beautiful Catastrophe | 70 | wide strings, distant brass, processed wind, sparse piano |
| `locked_city` | M15 | | 70 | the 2196 palette in an exact 4-bar repeat |
| `museum` | M16 | | free | glass, prepared piano, other regions' motifs out of order |
| `archive` | M17 | The Witness | 54 | bowed bass, metallic resonance, overlapping recordings |
| `fracture` | M18 | | mixed | all three eras' palettes overlapping, reversed thunder |
| `liminal` | M19, M22 | The Unwritten Second | 48 or free | glass tones, sub drone, silence as rhythm, motif fragments |
| `memory` | M20 | Mira — Memory Without a Body | 64 | felt piano, cello harmonics, reversed tails |
| `command` | M21 | | 110 | the war score colder, the Witness motif in the bass |
| `finale` | M23 | Main Theme → Afterzero — Final Choice | 78 → 62 | the Main Theme through each region's palette; endings on piano and cello |

- **The held-REVERSE layer** reverses envelopes: swelling attacks, clipped tails.
- **BEDS** are per year, in mission data `beds: { PRESENT: [...], PAST: [...], FUTURE: [...] }`, and crossfade on `shift()`.
- The **mix** rows go in the edition's Settings: Dialogue, Music, Effects, Ambience, and "Sound captions" (bracketed captions for key audio clues, and the visual pulse for M11's sound puzzle).
  - `Settings.js` gets edition-gated defaults (1 line).
  - The rows are added by wrapping `g.openSettings`, and the levels applied by wrapping `g.applySettings`.

**CUES:**

| Cue | Sound |
| --- | --- |
| `title` | Main Theme loop |
| `chapter` | a 7 s theme phrase and a cello rise |
| `card` | a 0.8 s reversed swell → the motif in the mission's key → a low resonance |
| `reveal` | an m2 cluster, a 40 Hz drop, a 0.4 s dropout |
| `consequence` | the bible's low metallic resonance and a brief dropout |
| `cliff` | a rising cello and accelerating ticks, cut on the fade |
| `zero` | ticks stop → 1 s duck (voice kept) → resonance → horn doppler, brakes, impact |
| `fracture` | a reversed whiteout swell → 0.8 s silence → a falling glissando → a landing |
| `pin` | a two-note bell |
| `echoStep` | a reversed afterimage whoosh with a motif fragment (the M10 unlock and every use) |
| `reverse` | the hold loop and the release snap |
| `loopReset` | a tape rewind and a siren |
| `ending:A` | the only full major cadence in the game |
| `ending:B` | the motif in two keys at once, never agreeing |
| `ending:C` | piano and cello, a string bloom, one breath of silence |
| `postcredit` | four clock ticks |

**`cinema.js`** — `play(rt, { shots, lines, cast, cue, letterbox })`:

- drives `g.player.cinema` (Player.js:28, :216, an existing hook) and releases input;
- shows edition-CSS letterbox bars;
- speaks the lines through `hud.say` (the voice pack);
- a tap skips a shot.

It is used for cold opens, hooks, the Zero Second and the endings.

**Cinematic flow** (`Runtime.js`; no `main.js`, `HUD.js` or `DeckWorld.js` change):

- **`title()`:** attach the Score (`g.audio.composer`), the unlock listeners and the title theme. Wrap `hud.onLine` (set in `wire()` before `title()` runs) so that `line.cue` fires `Score.cue`.
- **Chapter card**, when a chapter starts (new game or rollover): `#card` shows the name, sub and bible question, with cue `chapter`. The narrator says, for example, "Act Two. The Nine-Minute War.", then the question.
- **Mission card:** cue `card`. The title is spoken ("Mission four. The Man from the Last Day."), then the logline is narrated, then the cold open.
  - The cold open waits for `g.voice.ready()` (the card shows "LOADING VOICES nn%" if needed) and for the card voice to finish.
- **Choices:** Kai says the chosen label, then the choice's lines. Choices with `consequence: true` play the stinger.
- **Voices and fx:** echoes use `echo`; records use the speaker's own voice with `recording`; Rook's call and comms use `radio`; station speakers use `pa`. "[ANNOUNCEMENT]" becomes the PA speaker with a two-tone chime.
- **Outros:** a character line, the `cliff` cue and a fade. No narrated design notes (lint).
- **`ending()`:**
  1. flash;
  2. `silence(1)`;
  3. the ending cue;
  4. the narrator reads `text[0]`;
  5. Kai speaks the quote `text[1]` (C with `echo`);
  6. the ending's added lines (§5, M23);
  7. the epilogue lines;
  8. `postcredit` ticks;
  9. VOICE "Version one hundred and eighteen." with `pa`;
  10. the overlay.
  - The narrated stage direction is removed.
- **Evidence:** the `pin` sound and a toast. The case board gets ▶ buttons: the question read by the narrator, log lines by Kai.
- **Spoken hints are device-neutral** ("switch to 2026"). Key names appear only in prompts.

### 8.10 Budgets and the render

**Speech budget:**

| Scope | Spoken words |
| --- | --- |
| Prologue | ≤ 4,200 |
| Each Act mission | ≤ 1,000 (main ≤ 750, optional ≤ 250) |
| Finale | ≤ 1,800, including the epilogue variants |
| `common` | ≤ 2,500 |
| **Edition total** | ≈ 160–175 min of speech |

**Encoding:** Opus mono at 16 kbps for speech (barks and hints may go to 12 kbps).

| Pack limit | Size |
| --- | --- |
| Each group file | < 12 MB |
| Edition total | < 22 MB |

**Render step**, per chapter, as soon as its lines freeze: one command per group (*as built in U5*, `tools/voice-lv.sh`):

```
cd /home/user/v2-overhaul; S=/tmp/claude-0/-home-user-claude-ideas/172dbda8-49ff-56a9-a901-22c181c25683/scratchpad
VOICE_WORK=$S bash tools/voice-lv.sh act1     # or prologue, act2 ... finale, cases, common; several at once; all
VOICE_WORK=$S bash tools/voice-lv.sh check    # render nothing: name every pack that is out of date
node --test tests/lastversion.test.mjs
```

- Each run writes the scripts again (`node tools/voice-pack.mjs $S/lv-script --edition lastversion`: `<group>/script.json` and
  `groups.json`), renders the named groups under `nice -n 19` (`tools/voice-pack.py <script> game/assets/voice/lv/<group> $S/tts
  ffmpeg $S/vcache`: only what the cache lacks is rendered), then checks every pack byte for byte against its script
  (`tools/voice-pack.py --check`) and names any that is still stale. A piece that two groups now share moves to `common`, so a
  story unit usually records its chapter and `common`.
- `$S/tts` holds Kokoro (`kokoro-v1.0.int8.onnx`, `voices-v1.0.bin`, from github.com/thewh1teagle/kokoro-onnx releases);
  `$S/vcache` is the recordings cache (keyed by voice, speed, pitch and the text said, so unchanged lines are never rendered twice).
- Before committing a pack: `python3 tools/voice-audition.py . $S/lv-script $S/vcache <since: epoch seconds> $S/audition.html 40`
  writes the audition page of the new clips (with pocketsphinx installed, each clip is also heard back by a speech recogniser).
- Kokoro int8 renders at about 0.19–0.27× real time on this shared box, so one minute of speech costs 4–5 minutes of CPU.
- Run the render in the background, cached and resumable, while you wire code. The unit's final commit waits for it, because the coverage test (§8.11) must pass.

### 8.11 Tests

**Unit tests** (`tests/lastversion.test.mjs`):

- (a) Every `spokenLines()` entry has a full plan in `common` plus its group's pack: 0 misses, no `CREW_*`.
- (b) Lint on spoken text:
  - no `[tags]`;
  - no "Press", " Q " or " C." key names;
  - no "post-credit", "the player", "Mission \d+ ends", "does not block" or "Access shortcut";
  - digits only in lexicon forms;
  - no template strings in edition `say` calls.
- (c) Each pack file is < 12 MB, and the edition total is < 22 MB.
- (d) Speakers:
  - a distinct (spec, speed, pitch) per speaker id;
  - KAI male;
  - a `vid` for every NPC with lines;
  - same-person groups share a base voice (KAI/WITNESS/VOICE/KAI12 on `am_eric`; MIRA/LIN/CHILD on `af_river`).
- (e) In the edition, `Voice.speak` never touches `speechSynthesis` or `AndroidTTS` (stubbed window).

**Browser bot** (`tests/lastversion.mjs`, run with `--autoplay-policy=user-gesture-required`):

- `audio.ctx` is running after the first tap on the title;
- every line actually said (`LVB.said`, with its extra) has a non-null `AZ.voice.plan`, and `__voiceMiss` is empty;
- the `speechSynthesis` spy counts 0;
- the `Score.cue` spy sees `card`, `chapter`, `zero` and `ending:C`;
- during the Zero Second, `voiceBus` gain is 1 while music is ducked.

---

## 9. Story: spine, questions, ledgers, motifs, arcs, writing rules

### 9.1 Fixed

- Every bible quote is spoken verbatim, by the bible's speaker (D16).
- The 23 missions keep their names, their order, their bible setup and their bible mission ending. Endings are **staged as scenes, never narrated as summaries**.
- The three endings' texts stay verbatim, and the post-credit line stays "Version one hundred and eighteen."
- Consequences without punishment: no choice blocks the campaign, and any reward a choice can lose has a second path to it.
- Every critical clue arrives on **two channels**: a spoken line plus an object, or a record plus behaviour.
- Lines are short in danger and longer only in safe places.
- Exposition comes through objects, contradictions and disagreement. Nobody gives speeches.

### 9.2 The spine (the writers' truth: never stated whole in the game, only reconstructable)

These go beyond the bible without contradicting it. The lead adopts them.

- **a. The ring was found.**
  - In 2026 Helix, under project lead Elias Rook (38), digs a black stone ring out of the dry riverbed at the foot of the Ring Hill: Site Zero.
  - Helix found it; it did not build it. Rain City is built over the Ancient Settlement.
  - The riverbed was drained 3,000 years ago by Kai himself (M5).
  - Helix's lobby has a mascot exhibit, the Site Zero print, a boot print in the clay. It is Kai's boot.
- **b. Experiment 1.**
  - Kai (12) and Mira (9) were in Helix's junior programme because their mother worked nights there.
  - On Saturday 14 March 2026 at 16:02, Mira wanted to see the ring turn. Kai used his junior pass to let her into Chamber One (the "credentials"). The ring turned.
  - Mira's body died; an incomplete neural pattern persisted in the ring (M17).
  - Rook signed "fever". Kai was told she died of a fever and buried the memory, but he remembers pressing the console button.
- **c. The machine.** Kai grew up and built the activation system: the machine the voice tells him not to build. In the first finished world he activated it to reach Mira, and that was the Zero Second. The Fracture followed, and 2196 is its consequence.
- **d. The Witness is that Kai.**
  - He has made 117 attempts to find a world where Mira can exist. Each attempt rebuilds her from the pattern and guides his younger self, and each attempt is itself a Zero Second.
  - 100 attempts collapsed before they "finished becoming worlds" (Anja's line): these are the museum's 100 UNFINISHED cases.
  - 17 attempts finished. Helix's system, which exists only in finished worlds, counts them: VERSION 17.
  - The 118th begins after the credits.
- **e. The central reveal (M22).**
  - The ring turned at 16:02:00 and the button was pressed at 16:02:01.
  - The Zero Second's reach-back from 2049, which is the Witness's own attempt, turned the ring one second before the boy pressed anything. "He is not lying. He is early." The Witness: "I was a second early."
  - His attempts to prevent the Zero Second helped cause it, and Mira's death.
- **f. Mira in two pieces.**
  - In V17 the Witness rebuilt Mira as an adult at 32, her age now, and placed her at Helix as Dr. Lin: no past, no shadow, a dreamer of a song and of a brother. She is the woman in M1's crowd.
  - The Child in the Station is the part of Mira's pattern that stayed nine.
- **g. The voice** in every speaker at 08:14 is the Witness, trying again to stop Kai. The warning is what sends Kai into the chamber.
- **h. Why the ring anticipates Kai.** Every version of Kai falls through the ring into its own past. The settlement built itself round a man with no dust who keeps arriving early. Who first made the ring is left open. ORREN "Nobody built it. It was left."

### 9.3 Questions and the reveal ladder

The case board gets a **THE QUESTIONS** section (`ledger.js` `QUESTIONS`). Each question shows the clues pinned under it, never the answer, until the mission where it pays off.

**Questions:**

| Chapter | Question |
| --- | --- |
| Prologue | "Who used my card at 05:40, and whose is the voice?" Partly answered in M6, M9 and M12; fully in M22. |
| Act I | "How can the machine predate its inventors?" (bible) and "Who is the woman with Mira's face?" |
| Act II | "Is the Witness protecting Kai or controlling him?" (bible). Answered "controlling" in M13's side story, "both" in M22. |
| Act III | "What did the previous attempts cost?" (bible) |
| Act IV | "Can Mira be saved without repeating the catastrophe?" (bible) |
| Finale | "What must be accepted rather than fixed?" (bible) |

**Act-end twists:**

| Where | Twist |
| --- | --- |
| Prologue | the chamber reads "minus three thousand" |
| Act I (M8) | the boot print is Kai's; Lin is "not the one who died"; VERSION 17; the city's lights come back in a different order |
| Act II midpoint (M11) | the file photograph is Lin, under the name VAREN, M., age 32 |
| Act II end | M12: the Witness is older Kai; M13: a scarred hand buried the first device |
| Act III | M16: 117 cases, 100 of them unfinished; M17: "I pressed it. I killed her." |
| Act IV | M20: "I asked"; M22: the one-second gap |

### 9.4 Clue ledger (plant → reinforce → payoff)

`ledger.js` `CLUES` holds these, and a test checks every plant comes before its payoff in campaign order.

| Clue | Plant | Reinforce | Payoff |
| --- | --- | --- | --- |
| **C1** The voice is the Witness | M1 cold open: the card at 05:40 and the voicemail; M1 florist: "you already came in, older, with a scar" | VOICE built on Kai's base voice; M6 recording; M9 "You have nine minutes"; M14 fresh chrysanthemums | M12 the voicemail plays; M22 cold open: the Witness at the PA microphone |
| **C2** The scar | M1 the carriage glass (`wrist_cut`); M3 the ring seals it into a broken halo (`wrist_mark`) | M4 the Elder recognises it; M7 "KAI" carved beside the circle | M12 the Witness's scar, 30 years older; M21 the wrists side by side |
| **C3** Lin is Mira | M1 the woman and the yellow raincoat; M2 the empty dripping LIN peg, no shadow, "up, up, down", PHOTO PENDING SINCE 2026, "nobody remembers hiring me" | M8: previous employer HELIX JUNIOR PROGRAMME 2026; she is in the reconstruction; "Don't save me" | M11 the file photograph; M17, M20 |
| **C4** The found ring | M2 the Site Zero print; M3 the 2026 excavation office | M4 the card; M5 Kai drains the riverbed, and Niko's line | M8 Rook's log ("boot prints in the clay") and Kai's boot beside the case; M22 the chain |
| **C5** The version count | M8 VERSION 17 | M15 "worlds that never finished becoming worlds"; M16 17 halls and 100 UNFINISHED | M17 RECORDING 117 OF 117; M22 117 attempts; the post-credit 118 |
| **C6** The three notes | M1 the Child sings up, up, stop (Kai's way); M2 Lin hums up, up, down (Mira's way) | M6 the clockmaker's chime; M9 the transmitter's carrier; M11 the music box; M12 the Witness whistles it slowly | M20 the argument, and the Child and Mira sing "and then down"; Ending C Mira hums it |
| **C7** Rook's secret | M1 the newspaper headline "WE STUDY CLOCKS, NOT MIRACLES"; M2 Iven's 05:38 intercom, "there is nothing before Helix" | M3 the excavation log and the E.R. thermos; M6 Ezra repaired his gauge; M7 "I asked Dr. Rook and he went white" | M8 the confrontation |
| **C8** The ninth minute | M6 "do not let him see the ninth minute" (the clockmaker calls Kai "child" throughout, so the child is Kai) | M8 at the ninth minute a man turns the ring | M9 Kai sees the man at the console; M12; M22 |
| **C9** Missing shadows (bible motif) | M1 the Child; M2 Lin | M18 Mira's hologram; M12 the Witness while he stands in 2026 | M19 the real door has no shadow |
| **C10** "Early" | M4 "HE IS NOT LYING. HE IS EARLY."; M6 "You're early." | the Witness's bark "You are early. You are always early."; M11 "She's early." | M22 "I was a second early."; M23 "For once, you are on time." |
| **C11** The credentials | M1 Pryce: badged in at 05:40 (`ev_card_0540`) | M2 "Then someone has been using your credentials." / "I was twelve.", and the junior pass "OVERRIDE 16:02"; M8 Iven: "a second late"; M16 memory three: nobody at the console; M17 two logs, not yet read | M22 the deduction |
| **C12** The river (the bible's defining player moment) | M5 Kai diverts it | M8 Helix rebuilt round the river court; M15 the 14th's flood; M18 the flooded highway is that river | M22 "every cause was you" |

### 9.5 Motifs and the voice rule

**Phrases that come back with a changed meaning:**

| Phrase | Path |
| --- | --- |
| "The 41 is late. The 41 is never late." | M1 → M9: "In here the 41 is always on time." → Endings A and C: "The 41 is late." |
| "Nobody signs for it." | Iven, M2 → M13: field orders signed by nobody → M22: KAI "I'll sign for it." → M23: IVEN "I signed for it." This is the accountability arc. |
| "Count with me." | Jun's 41 seconds → M9: RHEA "Is anyone counting with me?" → M23: MIRA "Count it with me." |
| "Don't fix it. Look at it." | Mira's bark → M19 → Kai to the Witness in M23 |
| "Which version of the question are you asking?" | the clockmaker (M6) → Orren (M19) → Kai to the Witness (M22) |
| White chrysanthemums | the florist (M1) → the Witness's bouquet (M12) → the 2196 memorial (M14) |
| Yellow boots | the photo (M1) → footprints in 2026 plaster (M3) → M17 → M20 |

**Voice rule (D8):** the same person shares a base voice. KAI, WITNESS, VOICE and KAI12 are on `am_eric`; MIRA, LIN and CHILD on `af_river`.

**Guard against a twist that is too easy:**

- Keep M1's glimpse distant and in rain.
- Lin wears different hair and clothes, and her voice is pitched slightly.
- Kai never comments on the likeness before M8.

### 9.6 Arcs

| Character | Arc |
| --- | --- |
| **Kai** | Control → obsession → accountability → acceptance. Prologue: "There's a cause. There's always a cause." / "after work". Act I: discovery, first guilt ("Then they left because of me."). Act II: obsession; he chooses evidence over people when he can, and hesitates after M12. Act III: the memorial, "I pressed it." Act IV: "I asked", "I'll sign for it", "Not for her. For her to choose." His movement grows less certain after the Witness reveal (bible): longer idle pauses from M12 on. |
| **Mira** | Mystery (M1 glimpse, M2 Lin, M7 tape) → evidence (M8, M11) → personhood (M16 memory, M17 letter, M18 message) → self-definition. She refuses the door he opens (M19), says "I asked" (M20), and "Ask me." (M23). She chooses before he does. |
| **The Witness** | Certainty (voice, recording, radio: M1–M9) → exposure (the M12 chase, the M13 device, the M17 archive) → cooperation (M22, the M23 route) → sacrifice (M23; in Ending C he never happens). |
| **Sera** | Distrust → conditional alliance → revised history: M10, M13, the M14 memorial, the M18 repair, M23. SERA "The record was short. I'm making it longer." |
| **Rook** | Never a simple villain. He hides the past (M2), is confronted (M8: expose, persuade or record), and the fate you chose shows in M10, M12, M21 and M23. He kept Mira's drawing for 23 years. |
| **Niko** | Chooses what knowledge to pass on (M4, M5, M7). He carves "HE CAME BACK" (M23). |
| **Anja** | Comfort or painful truth; her son Tomas died in the 14th's flood (M15); an ally (M21); M23. |
| **Iven** | Wants his team out and refuses to sign (M2); his testimony changes the first experiment (M8); the Last Signal (M18); an ally (M21); he signs (M23). |
| **Jun** | M1, The Train (M15), M23. |
| **Tala** | M5; her channel is seen in M14 and M18; M23. |
| **Mara** | M15, M16, a radio line before the end (M21), M23. |
| **Orren** | M19, M22. ORREN "I was an anchor once. Or I will be. The tense is unkind here." This foreshadows Ending C without confirming it. |
| **The Child** | M1, M9, M11, M20, where she finds her way home. |

### 9.7 Consequence ledger (choice → where it shows; nothing locks you out)

`ledger.js` `CONSEQUENCES` holds these. The test: every fact a choice sets is read later in campaign order, and is listed here.

| Fact (set in) | Shown in |
| --- | --- |
| `jun_line` / `jun_evidence` (M1) | M2 (evidence: Kai can put Rook's order to him); M15 The Train; M23 the cleared street and an epilogue line |
| `trust_guard` (M1) | M8 Pryce opens the staff door (otherwise the river-wall climb) |
| `officer_trusted` (M2) | M8 Dale on the door; M10 Dale among the prisoners |
| `trust_rook` (M2) | M8 the confrontation's first line |
| `iven_*` (M3) | M8 in person or record; M18 The Last Signal; M21 ally |
| `niko_told` (M4) | M5 the mural; M14 the rhyme; M22 the chain wall |
| `machine_buried` (M5) | M8 Rook's log wording; M22 |
| `water_route` (M5) | M7 Niko's clue; M14 the channel; M18 the shortcut; M23 Tala |
| `ezra_debt` (M6) | M16 case; M19 his mark; M23 epilogue |
| `mira_tape` (M7) | M11 Odile; M16 case (if left); M21 the Witness hesitates |
| `rook_fate` (M8) | M10 the Director; M12 Corridor B; M21 the office; M23 the transmission ("Elias Rook testified for nine days…" for expose) |
| `warned_evacuees` (M9) | M13 a safe route; M21 the kitchen door |
| `prisoners_freed` / `prisoners_held` (M10) | M13 eleven more Unwritten, the field orders; M21 empty cells, or free them there |
| `odile_released` (M11) | M16 the watch case; M23 she waves |
| `faction` (M13) | the district at once; M18 pylons; M21 allies; M23 |
| `trust_sera` (M14) | M18 her line; M23 "AND HE CAME BACK" |
| `garden_restored` (M14) | M18 shelter; M23 Sera's garden |
| `city_freed` / `city_stabilized` (M15) | M18 helpers / M21 a lock corridor; M23 a line |
| `quest_jun` (M15) | M23 a line |
| `photo_taken` (M16) | M21 hesitation / Ending C table |
| `letter` (M17) | M21 delivered / M23 asked |
| Last Signal (M18) | M21 Iven an ally regardless |
| `m20_lead` (M19) | M20 who leads |
| ally (M21) | M21 who arrives |
| ending (M23) | the epilogue shows one line per fact set |

### 9.8 Writing rules and the length model

**Mission anatomy:**

- a cold open (1–2 min of staged cinema, often from someone else's point of view);
- one place with 3–5 quarters;
- 6–10 main threads mixing talk, clue, residue, deduction, puzzle, stealth, traversal, playback, REVERSE and choice;
- 1–2 side stories;
- a hook (1–2 min) that ends on a question.

**Thread minutes** (`Threads.js` sums them for the length test):

| Thread | Minutes |
| --- | --- |
| cold open | 1–2 |
| talk | 2, plus 0.5 per choice |
| clue | 0.5–1 |
| residue | 3 |
| deduction | 2–4 |
| playback | 4–6 |
| temporal puzzle | 4–8 |
| stealth | 4–6 |
| traversal | 2–6 |
| chase | 5–6 |
| loop | 4 per loop |
| REVERSE set piece | 4–6 |
| hold | 5–6 |
| tasks | 2–3 each |
| side story | 6–12 |
| hook | 1–2 |

**Length test:**

- the Prologue totals 75–100 min;
- every Act mission totals 25–42;
- the Finale ≤ 90;
- main ≥ 70% of each mission's total.

**Speech budget:** §8.10.

**Forbidden in spoken text:** design-note words ("mission ending", "the player", "does not block", "later allies"), key names, and bracketed tags.

**Telemetry:** `time_<mkey>` is stored when each mission ends and shown in the ending stats, so real times can be measured (bible milestone 5).

**PREVIOUSLY card** (three lines from `ledger.PREVIOUSLY`) when a chapter starts or a save loads. Act I's: "Kai Varen built a machine he was told not to build. The ring under Helix knew his name. He fell."

**Save format:**

- The format version is bumped.
- An old mid-mission save restarts its mission at quarter 0 and keeps its facts.
- PRIMES default the new cross-mission facts when a chapter is started from the menu (for example `rook_fate: 'record'`, `water_route: false`).
- `EV_LABELS` gets the new evidence ids.

**File split:**

- `acts.js` becomes `act1.js`, `act2.js`, `act3.js`, `act4.js`, `finale.js` and `cases.js`.
- `acts.js` re-exports `ACT1`…`CASES` and `ENDINGS`, so imports stay stable.
- `prologue.js` keeps M01–M03 and their builders.

---

## 10. Shared-file ledger and budgets

### 10.1 Shared files this overhaul may touch

A separate smoothness pass is editing these shared files in another checkout: `main.js`,
`PostFX.js`, `SmartRenderer.js`, `HUD.js`, `Actors.js`, `DeckWorld.js`, `materials.js`,
`Weather.js`, `Player.js`, `Input.js`, `Fx.js`, `models.js`, `World.js` and `Observer.js`. Both
checkouts will be merged.

Rules:

- Every change below is small, contained, and a no-op for Station Zero.
- Each one is listed in the unit's commit body and in `DESIGN.md` under "Hooks in the shared code".
- Nothing else in the shared engine changes.

| File | Change | Lines | Unit | Edited by the perf pass? |
| --- | --- | --- | --- | --- |
| `game/js/main.js` | comfort-setting text edition-aware (`this.edition ? 'Steadier camera, no flashes' : …`) | 1 | U1 | **yes** |
| `game/js/main.js` | `updateTheme`: `const th = this.edition?.themeFor?.(s) ?? (THEMES[s] \|\| THEMES.PHYSICAL);` | 1 | U2 | **yes** |
| `game/js/main.js` | sun: `const sd = this.edition?.sunDir?.() ?? [6,24,9]; this.sun.position.set(p.x+sd[0], p.y+sd[1], p.z+sd[2]);` *As merged with 1.1.1's texel-snapped sun:* the hook re-aims the snapped shadow frame when `sunDir()` changes | 9 | U2 | **yes** |
| `game/js/main.js` | character screen: filter LOOKS by `this.edition?.looks` | 2 | U4 | **yes** |
| `game/js/entities/Player.js` | `moveAxis` edge-climb ≤ `this.stepUp` (default 0; the edition sets 0.35). *Superseded:* 1.1.1's engine climbs 0.35 m itself, so U2 ships no `Player.js` change | 0 | U2 | **yes** |
| `game/js/world/People.js` | `crewModelKey` uses `crew.model` first if loaded; `setCrewDresser(fn)` hook in `makeCrewModel`; drop the edition rows from `BY_NAME` | ≈ 8 | U4 | no |
| `game/js/audio/Voice.js` | edition packs per chapter, `extra.id`, fx chains, no device speech in the edition, pending-on-load, LRU, `voiceBus`. *As built:* 161 code lines added, 45 removed: per-base packs with streamed progress, `usePacks`/`ready`/`loading`, the lookup across packs, `extra.id`, the edition's pending-and-miss path, `output()` on the voice bus, and a hook that routes a line with `extra.fx` through the edition's chains (`voice.effects`, built in `editions/lastversion/voicefx.js`, so no chain code is shared); the 64-clip LRU of 1.1.1 is kept (within the ≤ 150 budget) | ≈ 80 | U5 | no |
| `game/js/audio/Synth.js` | `unlock()`, `composer` hook, skip-ahead, `amb` and `voiceBus` buses, `silence()` fix. *As built:* 65 code lines added, 9 removed (with the mix levels behind the edition's Dialogue, Music, Effects and Ambience rows) | ≈ 45 | U5 | no |
| `game/js/audio/voiceKey.js` | empty-vocab guard | 2 | U5 | no |
| `game/js/ui/Settings.js` | edition-gated mix defaults | 1 | U5 | no |
| `tools/rocketbox-to-glb.mjs`, `tools/rocketbox-textures.py` | prefixes, colour-map variants, Bip0N rename, `RB_DROP`, edition `AVATARS` | — | U4 | no |
| `tools/voice-pack.mjs`, `tools/voice-pack.py` | `--edition` mode, per-group scripts, VOICES and blends. *As built:* also `voice-pack.py --check`, and new `tools/voice-lv.sh` (one command per group) and `tools/voice-audition.py` | — | U5 | no |
| `android/build-apk.sh` | edition branch: model manifest (U4), `voice/lv/**` only (U5), for the APK and the preview | — | U4, U5 | no |
| *fallback only* `game/js/world/DeckWorld.js` | `extraColliders` hook in `refresh` (if `temps` changes) | 2 | U1 | **yes** |
| *fallback only* `game/js/world/DeckWorld.js` | `story.makeWatcher` hook (if the in-place mesh swap fails) | 1–2 | U4 | **yes** |

**Not touched:** `ZoneGen.js`, `LevelGen.js`, `DeckWorld.js` (except the fallbacks above), `DeckDecor.js`, `world/materials.js`, `HUD.js`, `Actors.js`, `models.js`, `PostFX.js`, `SmartRenderer.js`, `Weather.js`, `Input.js`, `Fx.js`, `World.js`, `Observer.js`, `index.html` and `css/style.css`.

Station Zero's `assets/voice/voice.*` stays byte-identical.

### 10.2 Budgets

| Budget | Limit |
| --- | --- |
| Place | §4.7 (≤ 70 visible static draw calls, ≤ 300k triangles, ≤ 1,500 colliders, ≤ 60 texts, ≤ 24 NPCs) |
| REVERSE | ≤ 12 processes and ≤ 200 particles per level |
| Speech | ≈ 160–175 min in the edition; per group < 12 MB; total < 22 MB (§8.10) |
| Models | ≈ 17 MB new, ≈ 23 MB removed from the edition |
| **Edition APK** | **≤ 50 MB** (today 43.4 MB): models ≈ 26 MB, voice ≈ 19 MB, the rest ≈ 5 MB. The build script prints the size, and the unit that changes it reports it. |
| Preview artifact | every file ≤ 15 MB. If the edition preview exceeds 64 MB in one publish, publish it in two calls to the same URL. |
| Phone memory | voice LRU ≤ 150 clips; one chapter's models loaded, plus `common`; crowd textures at 512 px |

---

## 11. Implementation units

**Rules for every unit:**

- Work only in `/home/user/v2-overhaul` on branch `lastversion-overhaul`. Never touch `/home/user/claude-ideas` or other worktrees.
- Commit each unit, or each coherent sub-step, with a clear subject and body, then a blank line and exactly:

  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Ue4GRDWw4nwLpWNowwHTHu
  ```

- Stage only your own files (never `git add -A`). Never stash, rebase, `reset --hard`, amend or push.
- **Before each commit:**
  - `node --check` every changed JS file;
  - `npm test` all-pass, run in `/home/user/v2-overhaul`;
  - when a shared file changed, also `node tests/cradle.mjs` (Station Zero).
- **Browser checks** follow the `tests/*.mjs` conventions:
  - `NODE_PATH=$(npm root -g)`;
  - Chromium flags `['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']`;
  - block non-localhost requests;
  - `window.AZ` is the game;
  - level-starting clicks are issued inside the page with `setTimeout(() => el.click(), 0)`, then `waitForFunction` with timeout 300000;
  - screenshots use timeout 240000.
- The machine has 4 cores and is shared: one browser at a time; never `pkill` or `killall` node or chromium; renders run under `nice -n 19`.
- Never claim a check you did not run. Write measured numbers into STATUS.md.
- Every new spoken line lives in data walked by `allLines()` / `spokenLines()`. From U5 on, the unit's final commit includes the recordings (coverage 0 misses).
- Update this spec's §3 in the same commit if an interface changes.

Lead order: **U1 → U2 → U3 → U4 → U5 → U6 → U7 → U8.**

- U2 and U3 depend on U1: no INVERTED, and no gravity routes.
- U4 needs the places' crowd paths.
- U5 records what U1–U4 added.
- U6–U8 author on top of everything and record their own chapters.

---

### U1 — Three years and REVERSE: remove gravity inversion and laws, add the bible's inversion

**Goal:** the edition has no INVERTED state, no gravity flip and no law remnants. REVERSE (§7) exists, unlocks in M11, and is playable on desktop and touch.

**Scope:**

1. **States and engine**
   - `index.js`: `states`, `labels`, `engineOptions` (§7.2).
   - Remove INVERTED and `'gravity'` from every mission's `states`, `mechs`, conditions and effects (`acts.js`, `prologue.js`, `npcs.js` `npcWhen`, `Build.js` effects).
   - `Runtime.js`: mechs and `fits()`, `unlockSlot(3)`, `shift()`, flash, `stateNight` / `stateFog` / `stateDensity`, the grade.
   - `dress.js`: INVERTED debris and stardust.
   - `shift('4')` / `set:4` → `inv.trigger()`.
2. **Remnants** (§7.9), runtime-only:
   - tokens emptied, "MEMORY KEY" relabelled, HINTS rewritten in two tiers;
   - in `title()`: the aria-labels, SHIFT → YEAR, CASE BOARD, the keys line, the blurb.
   - `main.js` comfort text (1 line).
3. **Save migration** in `resume()` (§7.2), and PRIMES.
4. **`inversion.js`** (new): input (R / 4 / the ⟲ touch button), targeting, the lifecycle, charge and stability, R1–R6, the REVERSE chip and the crosshair ring (`#lvTop` / `#lvReverse`, `<style id="lvInv">`), procedural sounds, patrol pose history, refusals, and the case-board ABILITIES block.
5. **`processes.js`** (new): the 10 kinds of §7.6 with merged rest meshes, and moving colliders through edition-owned `deckWorld.temps` entries (`t: Infinity`, removed by the edition).
6. **M11 core**, in M11's current rooms, placed by the landmark names of §5 (M11), mapped to room-relative anchors so U3 can re-place them:
   - reversed wards via `setOverride` (intercom played reversed inside);
   - the unlock in records (`has_inversion`, Kai's line, the R1/R2 toast);
   - the three tutorial objects;
   - the charred file ("ADMITTED BY: K. VAREN"), the flatline refusal;
   - the reversing lock: 4 bolts in order RING → BAR → STAR → CRESCENT fitted (clue texts: the 2026 maintenance tag; the twin lock's loop; the chime tones), a jam on a wrong bolt, settled bolts saved;
   - the lock scene's `when` becomes `inv_m11lock_done`.
   - The sound puzzle, hazards and Odile come in U7.
7. **Docs:** `DESIGN.md` (states, REVERSE, the bible deviation of D1), `STATUS.md` (HUD names), `README.md`.

**Files:**

- New: `game/js/editions/lastversion/inversion.js`, `processes.js`.
- Changed: `index.js`, `Runtime.js`, `acts.js`, `prologue.js`, `npcs.js`, `dress.js`, `Build.js` (all in `game/js/editions/lastversion/`); `game/js/main.js` (1 line); `tests/lastversion.test.mjs`; `tests/lastversion.mjs`; `docs/lastversion/{DESIGN,STATUS,README}.md`.

**Acceptance:**

- [ ] `npm test` passes. New unit tests:
  - `LV.states` has exactly 3 entries;
  - no "INVERTED" or `gravityFlip` in any mission's states, effects, conditions or labels;
  - no challenge key matches `/gravity|ceiling/` in any built level;
  - `engine.laws` is empty and slots are 0;
  - no `level.tokens`, and no "MEMORY KEY" label;
  - every process record is valid (aim inside its room, reach > 0, weight ∈ {0.5, 1, 1.5}, origin boxes inside the room bounds, ≤ 12 per level, ≤ 10 parts);
  - every process thread or rule that is required sits at `n ≥ 11`;
  - M11's three clue texts list the lock's order;
  - a v2.0 save with INVERTED room states migrates;
  - no edition `temps` entry can expire.
- [ ] `node tests/lastversion.mjs` passes, with the `setGravity` calls removed and the gravity expectations replaced. New checks:
  - in M11, `has_inversion` is set after records;
  - R starts and releases (`rt.inv.active`);
  - the touch ⟲ button starts and releases;
  - the charred file is readable only while held;
  - a wrong bolt jams (charge −1.5 s);
  - the right order sets `inv_m11lock_done` and opens Ward 32;
  - switching year releases a held process;
  - a settled bolt survives save and load.
- [ ] `node tests/cradle.mjs` passes.
- [ ] A screenshot of M11 with the REVERSE chip, the target label and a held process (scratchpad), looked at.
- [ ] `grep -n "INVERTED\|gravityFlip\|setGravity" game/js/editions/lastversion tests/lastversion*` shows only the migration code and the negative tests.

---

### U2 — Open-sky places, part 1: the generator core, and the Prologue and Act I places

**Goal:** a real sky, horizon and era-specific light; the place builder; and M1–M8 standing in their own places (`rain_south`, `helix` with all three wings, `helix_v17`, `valley_upper`, `valley_river` with the gorge, `oldtown`, `observatory`). No dome, ZoneGen, LevelGen or Vessel look in M1–M8.

**Scope:**

1. **The core** (§4.3): `places/index.js`, `atlas.js`, `Place.js`, `archetypes.js`, `styles.js`, `materials.js`, `years.js`, `Sky.js` (with the M1 ring-hole feature), `Horizon.js`, `Scenery.js`.
2. **Runtime wiring:**
   - `buildLevel` → `buildPlace` when `deck.place` is set, skipping `dressStates`;
   - `onSectorLoaded` mounts sky, horizon and scenery into `deckWorld.root` (disposed with it);
   - `theme()` drives fog, density and night from `years`, `scenery.setEra` and `sky.update`;
   - `index.js` exports `themeFor` and `sunDir`;
   - the edition sets `player.stepUp = 0.35`;
   - HINTS without the dome;
   - records as kit props;
   - D2 step 1: sector *i* ↔ quarter *i*.
3. **`Build.js`:** Deck `at` / `rot` / `roof` / `windows`, and the three edition Chronolith models.
4. **The seven place specs.** Every landmark named in the M1–M8 sheets exists in `level.landmarks`, and every quarter in `level.quarters`.
5. **Missions:**
   - M1's overlay is re-placed on `rain_south` landmarks;
   - M2 and M3 are built inside `helix` (no look `'eng'`);
   - M4–M8 get `place` + `quarters`, with today's beats activating per quarter and tasks and records at landmarks;
   - the `helix` north wing geometry is built now (M12 is wired in U3).
6. **Shared:** `main.js` `themeFor` (1 line) and `sunDir` (2 lines); `Player.js` `stepUp` (≤ 8 lines).

**Files:**

- New: `game/js/editions/lastversion/places/**`.
- Changed: `Runtime.js`, `index.js`, `Build.js`, `prologue.js`, `acts.js`; `game/js/main.js` (3 lines); `game/js/entities/Player.js` (≤ 8 lines); `tests/lastversion.test.mjs`; `tests/lastversion.mjs`; `docs/lastversion/DESIGN.md`.

**Acceptance:**

- [ ] `npm test` passes. New unit tests, for M1–M8:
  - open sky: no `dome`, `ceil` or `roots` element covers more than 15% of a place, unless the room declares `interior: true` and a sky opening;
  - no non-rock wall above 6 m on the bounds;
  - a sky preset for every authored year;
  - no ZoneGen, LevelGen or Vessel `look`;
  - the uniqueness signature (§4.8);
  - size and quarter area (§4.7);
  - eras share a layout (identical unconditioned footprint; ≥ 20 conditional big pieces per extra year);
  - ancient years (M4, M5, M7 PAST) carry no lamp, neon, road or sidewalk materials and no Latin signs;
  - every traversal challenge names an answer in its room's years;
  - collider, text and NPC budgets;
  - every sheet landmark exists.
- [ ] `node tests/lastversion.mjs`:
  - the Prologue path still passes, with its fact IDs;
  - per mission M1–M8, per year, a quarter-0 screenshot; 16×16 aHash distance ≥ 18 bits between non-`sameAs` missions; top-quarter sky variance above the threshold;
  - the hashes are written into the bot log.
- [ ] `node tests/cradle.mjs` passes (because of `main.js` and `Player.js`).
- [ ] `tests/perf.mjs` (or the perf harness) on M1 and M4: draw calls, triangles and frame time are written to STATUS.md, and M1 and M4 meet §4.7.
- [ ] Screenshots of M1 (both years), M3 (three years), M4 and M7, reviewed by eye for silhouette, sky and scale.

---

### U3 — Open-sky places, part 2: Acts II–IV and the Finale

**Goal:** M9–M23 in their own places. The edition no longer uses ZoneGen, LevelGen or `dress.js`. No two places look alike.

**Scope:**

1. **Place specs:** `northbank`, `dam`, `hospital`, `warport`, `drowned`, `lockcity` (`bowl` helper), `sinkhole` (`spiral` helper), `array`, `fracture` (storm sky: wall cloud, ring eye, time bands, coloured lightning), `unwritten` (`mirror` helper, wrapping edges, the reflection-only bridge), `memory`, `spire` (cloud sea), `firstsecond` (`wedges` helper, wedge sky, eclipse), `afterzero` (route light progression, the three ending skies).
2. **Sky features:** the M15 lock halo, the M19 unbuilt city, the M18 storm wall, the M21 cloud sea, the M22 wedges and eclipse.
3. **Missions:**
   - M9–M23 get `place` + `quarters`, with tasks and records at landmarks;
   - M12 is wired to the `helix` north wing;
   - the M11 processes from U1 are re-placed by landmark in `hospital`;
   - `c_b` uses M5's gorge quarter and `c_c` M15's press tower until U8.
4. **Retire for the edition:** ZoneGen and LevelGen calls, `dress.js`, and the `P` palettes.
5. **Bot routes:** update the walks through M13, M14, M19, the Museum and the Finale.

**Files:**

- New: `places/specs/*.js` for the 14 places above.
- Changed: `places/*` (Sky features), `Runtime.js`, `acts.js`.
- Removed or unused: `dress.js`.
- Tests: `tests/lastversion.test.mjs`, `tests/lastversion.mjs`. Docs: `docs/lastversion/DESIGN.md`, `STATUS.md`.

**Acceptance:**

- [ ] `npm test` passes, with the U2 place tests now **for every mission**, plus:
  - edition code paths import neither `gen/ZoneGen.js` nor `gen/LevelGen.js` (grep test);
  - every mission's default sky preset is unique except the M22/M23 composites;
  - linear places are exempt from the short-side rule.
- [ ] `node tests/lastversion.mjs` passes, including the updated routes. Screenshot hashes for every mission and year, with all non-`sameAs` pairs ≥ 18 bits apart; the sky-variance check passes.
- [ ] Perf numbers for M13 (largest), M14 and M18 are written into STATUS.md, all within §4.7.
- [ ] A contact sheet of all 23 missions' default views (scratchpad), reviewed by eye: no two read alike.

---

### U4 — Casting, crowds and watchers

**Goal:** every NPC looks like who they are (§6). Crowds appear in every mission. Watchers are people or Helix drones. The edition ships only its models.

**Scope:**

1. **Converter fixes** (§6.6). Sparse, blobless Rocketbox clone in the scratchpad. Convert the 31 avatars (named at 1024 px, crowd at 512 px) into `game/assets/characters/rb_*.glb`, with CREDITS rows.
2. **New modules:** `casting.js`, `wardrobe.js` (GPU or Worker recolour, face-sampled skin, hidden parts, props, cached per model and variant), `crowds.js`, `watchers.js`.
3. **`npcs.js`:**
   - every NPC gets `model`, `variant`, `height`, `vid` and `walk`;
   - renames: `guard` → Officer Pryce (`pryce` kept as an alias); `clockmaker` → Ezra Moll; `soldier` → Sergeant Brask;
   - new entries, with no lines yet beyond today's: `odile`, `florist`, `receptionist`, `director`, `kai12`, `tomas`;
   - `patient` becomes the silent `rb_mira/gown` figure;
   - AMBIENT gets roles and voice pools.
4. **Crowds** spawned from `level.crowd` in every mission (`ambient:` is finally read), with the era rules of §6.1.
5. **Watchers** per §6.4, by in-place mesh swap (D14); the red mimic hologram model for M17 (its route replay comes in U8).
6. **Shared:** `People.js` (≈ 8 lines) and `main.js` (2 lines, the LOOKS filter); `index.js` `looks: ['real_m']`.
7. **`android/build-apk.sh`:** the edition model manifest, for the APK and the preview.

**Files:**

- `tools/rocketbox-to-glb.mjs`, `tools/rocketbox-textures.py`.
- `game/assets/characters/rb_*.glb` (31 new), `CREDITS.md`.
- New: `game/js/editions/lastversion/{casting,wardrobe,crowds,watchers}.js`.
- Changed: `npcs.js`, `prologue.js`, `acts.js`, `Runtime.js`, `index.js`; `game/js/world/People.js`; `game/js/main.js`; `android/build-apk.sh`; tests; `DESIGN.md` (casting).

**Acceptance:**

- [ ] `npm test` passes. New unit tests:
  - every NPC's model file exists and its variant is defined;
  - pronoun matches the model's sex;
  - no named mesh appears in any crowd table, except the listed exceptions;
  - crowd eras are disjoint, except `rb_child_m2` in 2049/2196;
  - `guard` → `rb_security_f`;
  - Lin and Mira share a mesh;
  - every child role uses a child mesh;
  - `LV.looks` is `['real_m']`;
  - the manifest lists only edition models;
  - every new `rb_*` has a CREDITS row.
- [ ] `node tests/lastversion.mjs`:
  - M1's checkpoint officer's model key is `rb_security_f`;
  - the toy child and the Child use child meshes;
  - M10's watchers are `rb_trooper` with working cones;
  - crowds exist in M1, M4 and M14;
  - no main-thread frame over 150 ms during a chapter's cast load (perf harness).
- [ ] `node tests/cradle.mjs` passes (because of `People.js` and `main.js`).
- [ ] An in-engine render sheet of the named cast, and one ancient-wardrobe sheet (scratchpad), reviewed by eye. The ancient sheet is flagged for a human review.
- [ ] `EDITION=lastversion bash android/build-apk.sh` builds if the Android toolchain is present here; the printed APK size is reported. Without the toolchain, say so and list the files the edition branch would copy.

---

### U5 — Voice and score: every line heard, every cinematic scored

**Goal:** in the edition every spoken line plays from the edition's own recorded packs, with no device speech. Audio unlocks on the first tap. Cards, the Zero Second and the endings are cinematic and scored. Every line that exists after U1–U4 is recorded.

**Scope:**

1. **`voicelines.js`** (§8.2) with the lexicon (§8.5); templates replaced by authored lines; `allLines()` wraps it.
2. **Shared:**
   - `Voice.js` (§8.6);
   - `Synth.js` (§8.8);
   - `voiceKey.js` (the empty-vocab guard);
   - `Settings.js` (1 line).
3. **`score.js`** (motif, regions, cues, per-year beds; §8.9) and **`cinema.js`** (shots, letterbox, lines, tap to skip).
4. **The Runtime cinematic flow** (§8.9):
   - chapter and mission cards;
   - cold opens through `cinema.js`, from the existing intros until U6–U8 rewrite them;
   - choice labels spoken;
   - the PA speaker;
   - fx tags on recordings, radio and echoes;
   - the ending sequence;
   - the unlock listeners and the TAP FOR SOUND banner;
   - the mix rows.
5. **Tools:**
   - `tools/voice-pack.mjs --edition lastversion` (per-group scripts and `groups.json`; fails if a group projects over 12 MB);
   - `tools/voice-pack.py` (VOICES of §8.4, blend specs);
   - the audition page.
6. **Render** every current edition line into `game/assets/voice/lv/<group>/`. Re-render the WITNESS and CHILD clips and every tier-2 and crowd line in its own voice.
7. **`android/build-apk.sh`:** the edition ships `voice/lv/**` only.

**Files:**

- New: `game/js/editions/lastversion/{voicelines,score,cinema}.js`.
- Changed: `Runtime.js`, `index.js`, `npcs.js`, `prologue.js`, `acts.js`; `game/js/audio/{Voice,Synth,voiceKey}.js`; `game/js/ui/Settings.js`; `tools/voice-pack.{mjs,py}`; `android/build-apk.sh`.
- Generated: `game/assets/voice/lv/**`.
- Tests; `DESIGN.md` and `STATUS.md` (audio).

**Acceptance:**

- [ ] `npm test` passes, with the unit tests (a)–(e) of §8.11.
- [ ] Station Zero's `game/assets/voice/voice.{json,ogg}` sha256 is unchanged.
- [ ] `node tests/lastversion.mjs` passes with `--autoplay-policy=user-gesture-required` and the §8.11 bot checks:
  - context running after the first tap;
  - `__voiceMiss` empty;
  - `speechSynthesis` spy 0;
  - cues `card`, `chapter`, `zero` and `ending:C` seen;
  - `voiceBus` gain 1 during the Zero Second's duck.
- [ ] `node tests/cradle.mjs` passes; Station Zero's audio path is unchanged.
- [ ] An ear check of 40 random new clips on the audition page (pronunciation of years, times, Jun, Act numbers) is noted in the commit body.
- [ ] Pack sizes are written to STATUS.md: each < 12 MB, total < 22 MB.

---

### U6 — Story, part 1: the thread framework and the Prologue rewrite

**Goal:** missions become one map with soft quarters, threads, side stories, cold opens and hooks. The Prologue (M1–M3) is rewritten per §5 and recorded. Target 97 min.

**Scope:**

1. **`Threads.js`:** kinds `go`, `talk`, `clue`, `residue`, `deduce`, `scene`, `choice`, `tasks`, `stealth`, `chase`, `cinema` and `invert`, plus the legacy-beat shim.
   - The objective shows the first incomplete main thread's goal and "because" line.
   - Hints come from the thread's tiers.
   - Side threads show on the HUD only while tracked.
   - Things are placed at `level.landmarks`.
2. **Runtime:**
   - rewritten missions are a single load (D2), with resume at the furthest quarter and an autosave at each quarter;
   - the case board gains THE QUESTIONS, SIDE STORIES (with a track button), WHAT YOU CHOSE and ABILITIES;
   - the PREVIOUSLY card;
   - `time_<mkey>` telemetry;
   - PRIMES and `EV_LABELS`;
   - the save-format bump and migration.
3. **`ledger.js`:** QUESTIONS, CLUES, CONSEQUENCES, PREVIOUSLY and EPILOGUE, filled for the whole campaign as data (§9).
4. **M1–M3 rewritten** per their sheets:
   - cold opens and hooks;
   - the anomaly deduction, the checkpoint with Pryce, `wrist_cut` / `wrist_mark`;
   - the pursuit (chase) and the raincoat;
   - the florist, the photo booth;
   - Lin, the Site Zero print, the junior pass;
   - **Rook in person at the chamber door**;
   - the 2026 excavation office, the 2196 plaque;
   - chains A and D kept.
   - Keep the fact IDs of §3.6.
5. **Record** the `prologue` group and the `common` additions.

**Files:**

- New: `game/js/editions/lastversion/{Threads,ledger}.js`.
- Changed: `prologue.js`, `Runtime.js`, `npcs.js`, `index.js`, `Build.js`.
- Generated: `game/assets/voice/lv/{prologue,common}`.
- Tests; `STATUS.md`.

**Acceptance:**

- [ ] `npm test` passes. New unit tests:
  - the length model: Prologue 75–100 min, M1–M3 each in range, main ≥ 70%;
  - the clue ledger: every plant is before its payoff;
  - the consequence ledger, for rewritten missions: every choice fact is read later or listed for a later unit's mission;
  - bible quotes verbatim, with speakers;
  - no design-note words;
  - the speech budget;
  - coverage: 0 misses.
- [ ] `node tests/lastversion.mjs`, the Prologue path with its existing fact IDs plus:
  - the cold-open skip;
  - Pryce's 05:40 line;
  - `wrist_cut` and `wrist_mark`;
  - the raincoat;
  - Rook at the chamber door (`trust_rook` set);
  - the excavation office (`ev_site_zero`);
  - an M1 resume spawns at the furthest quarter.
- [ ] A timed play of M1 by the bot's walk (reported, with real movement) plus the length model's estimate, written to STATUS.md.

---

### U7 — Story, part 2: Acts I and II (M4–M13)

**Goal:** M4–M13 rewritten per their sheets and recorded. Chain B lives in M5. Loops, playback and the M11–M13 REVERSE set pieces work.

**Scope:**

1. Split `acts.js` into `act1.js` and `act2.js`; `acts.js` re-exports.
2. **`Threads.js`:**
   - `loop` (M9's per-loop variants: patrols, damage, routes; the upward rain at reset);
   - `playback` (M8's last ten minutes; M5's echoes).
3. **M4–M8:**
   - cold opens and hooks;
   - pictograms, the meal, the panels;
   - the M5 investigation and Niko's choice;
   - chain B in M5's gorge;
   - Ezra and the Debt;
   - the instruments and the tape;
   - **the M8 Rook confrontation** with `rook_fate`, and the boot print.
4. **M9–M13:**
   - the M9 loop and Rhea, the tower view;
   - the M10 Director variants and the projector (Echo Step);
   - M11 completed: the sound that gets quieter, returning hazards, Odile, the twin lock, the records compare, the Ward 32 figure;
   - the M12 chase with the Witness's own reversal, Corridor B, the voicemail;
   - the M13 shells (`ev_both_sides`), the burial, the roll-call wall, the charge cap 10 s.
5. Side stories and consequence facts per §9.7. Record the `act1` and `act2` groups.

**Files:**

- New: `game/js/editions/lastversion/{act1,act2}.js`.
- Changed: `acts.js`, `Threads.js`, `Runtime.js`, `npcs.js`, `ledger.js`.
- Generated: `game/assets/voice/lv/{act1,act2,common}`.
- Tests; `STATUS.md`.

**Acceptance:**

- [ ] `npm test` passes. The length model holds for M4–M13 (25–42 each); the ledgers hold for everything rewritten; coverage has 0 misses; budgets hold.
- [ ] `node tests/lastversion.mjs`:
  - M5: the river diverted, then the ABANDONED investigation, then the gate, then `machine_buried` set;
  - M8: the confrontation sets `rook_fate`; VERSION 17;
  - M9: two loops with different patrol positions, then the transmitter, then Rhea, then the tower;
  - M11: the full sequence from U1, plus the music-box gain falls toward the source, and a hazard hit causes a setback;
  - M12: the chase never fails, and the stair is followed by REVERSE;
  - M13: reversing a shell from each side pins `ev_both_sides`, and the faction is set.
- [ ] Lengths for M4–M13 (model plus the bot's walk times) are written to STATUS.md.

---

### U8 — Story, part 3: Acts III–IV, the Finale and the case files; final docs

**Goal:** M14–M23 rewritten and recorded. Chain C lives in M15. CASE FILES replace the Cases chapter. The whole campaign passes the ledgers. The docs describe v2.1 truthfully.

**Scope:**

1. `act3.js`, `act4.js`, `finale.js` and `cases.js`; `acts.js` re-exports.
2. **`Threads.js` `hold`** (M18 pylons).
3. **M14–M18:**
   - the lift-car ride, the transit bridge, the memorial and `trust_sera`, "whose flowers?";
   - the M15 loop, the ink on `card14` and on both archives (chain C), Anja's choice with distinct facts, The Train;
   - the M16 memories, reel and photograph, and the Names catacomb;
   - the M17 corridors, the mimics replaying the player's earlier route and counter-reversing, the two logs, the letter;
   - the M18 evacuation, the slabs in last-fallen order, the hold, the charge cap 12 s.
4. **M19–M23:**
   - the M19 symbols, the reflection-lag bridge, the shadowless door, `m20_lead`;
   - the M20 refusals and the three-memory alignment;
   - the M21 elites' rewind, the arena bridges and the ally;
   - the M22 seals, the arm and the one-second deduction, with the bible speakers fixed;
   - the M23 two holds, Mira's "Ask me", the endings with their additions, the epilogue montage, the post-credit.
5. **CASE FILES:** the screen and the replay keys (`c_b`, `c_c` and the ten new ones).
6. **Record** `act3`, `act4`, `finale` and `cases`.
7. **Final docs:** `DESIGN.md`, `STATUS.md` and `README.md` rewritten for v2.1, with measured lengths, sizes and test counts. This spec's §5 is updated where the build differs.

**Files:**

- New: `game/js/editions/lastversion/{act3,act4,finale,cases}.js`.
- Changed: `acts.js`, `Threads.js`, `Runtime.js`, `npcs.js`, `ledger.js`.
- Generated: `game/assets/voice/lv/{act3,act4,finale,cases,common}`.
- Tests; `docs/lastversion/{DESIGN,STATUS,README}.md`.

**Acceptance:**

- [ ] `npm test` passes, with the ledgers now global:
  - every choice fact is read later;
  - every question is answered in its mission;
  - every evidence a deduction needs is settable before it;
  - no main-path thread lives in a side story;
  - Finale ≤ 90 min;
  - coverage 0 misses for the whole edition;
  - pack and APK budgets hold.
- [ ] `node tests/lastversion.mjs`, the full bot (Prologue → Ending C), plus:
  - M14: the lift ride with real movement;
  - M15: `ev_dual_archive`;
  - M18: the slab stair;
  - M19: the reflection bridge;
  - M20: an accepted alignment;
  - M22: the deduction;
  - Ending C: the epilogue line for at least one set fact;
  - the post-credit VOICE;
  - CASE FILES lists 14 entries and replays one.
- [ ] `node tests/cradle.mjs` passes. The edition APK builds (if the toolchain is present) at ≤ 50 MB, and the preview file list contains `voice/lv/**`.
- [ ] STATUS.md shows each chapter's measured length against the target.

---

## 12. Risks

1. **Scope.**
   - The world design alone estimated 25–30 agent-days. D10 (one parametric builder) and the split into U2/U3 are the mitigation.
   - If U3 runs short, it ships simpler specs (fewer plots, the same rules) rather than falling back to ZoneGen.
   - The story's ~26,000 new words are capped by §8.10.
2. **Phone performance.** Maps are 4–10× larger, with a visible sky and more transparency.
   - The budgets of §4.7: merged era groups, instanced vegetation, fog-free horizon cards, props culled beyond 90 m, crowds at 512 px with frozen animation beyond 40 m.
   - Measure with `tests/perf.mjs` in U2, U3 and U4. Coordinate with the smoothness pass before merging.
3. **Merge conflicts with the smoothness pass.** `main.js` (6 lines) and `Player.js` (≤ 8 lines) are the only overlaps; the DeckWorld lines are fallbacks only. List them in each commit body.
4. **Box-only collision.** Ramps and terraces need stepped invisible colliders under smooth meshes. Without `stepUp`, every rise must be jumpable (≤ 0.5 m).
   - Walkable water is ≤ 0.6 m deep; deeper water needs a blocker and a visible route.
   - Riding a rising lift car can jitter above 2 m/s, so cap it there.
5. **Moving colliders** rely on `deckWorld.temps` internals. Edition entries never expire; the 2-line hook is the fallback.
6. **The render time.** About 160–175 min of edition speech at 4–5 CPU-minutes per minute is about 12–14 h in all, spread over U5–U8.
   - Freeze lines one chapter at a time, and render cached and resumable in the background under `nice -n 19`.
   - Late text changes re-render only the delta.
7. **Pack size and platforms.**
   - Per-chapter packs keep each file under 12 MB.
   - Older iOS WebKit may not decode Opus (probe, notice, optional AAC for the preview).
   - The iOS silent switch needs `audioSession`.
   - The Android WebView pauses timers (`visibilitychange`).
8. **Save compatibility.** v2.0 saves hold INVERTED states and old room ids. The migration (U1) and the format bump (U6) restart a mission at quarter 0 and keep the facts. Both have unit tests.
9. **Canon calls beyond the bible** (§9.2):
   - Kai at 12 let Mira in;
   - Lin is a rebuilt Mira;
   - Loop City is Rain City North;
   - Kai drained the riverbed;
   - the Child is the part of Mira that stayed nine;
   - 17 finished and 100 unfinished worlds;
   - Rook or Pryce as the Director.

   None contradicts the bible. If the player vetoes one, rewire the clue ledger around it; the ledger tests show what breaks.
10. **The twist too easy, or too hard.** Lin shares Mira's face and base voice, and the Witness shares Kai's. Keep the M1 glimpse distant, disguise Lin's hair and clothes, pitch her voice, and never let Kai remark on it before M8.
11. **Era sensitivity in the ancient wardrobe.** The only pre-modern-reading avatars wear contemporary South Asian and Gulf dress. They are recoloured into undyed, ochre, indigo and madder homespun; the burqa avatar is never used; the settlement is portrayed as sophisticated; and a human reviews the render sheet.
12. **Recolour quality.** The skin mask mistakes ochre and red cloth for skin. Sample each avatar's skin from its head texture, protect skin only on the body material, and use absolute saturation and lightness for black and white garments. Never on the main thread.
13. **Readable year switches on small screens.** Era differences must be big silhouettes, and the uniqueness checks run on phone-sized screenshots.
14. **Consistency debt.** The ledgers stay true only if every later edit updates `ledger.js`. Its tests fail loudly by design.
15. **Shipped builds.** Until the preview is republished and the APK rebuilt, the player's complaint stands whatever is built here (§8.1 release note).
