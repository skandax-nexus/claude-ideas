# AFTERZERO: The Last Version of Earth — design

How the creator's gameplay bible (`BIBLE.txt`, `AFTERZERO_Gameplay_Bible.pdf`) maps onto the
AFTERZERO engine, and which parts of the edition are written by hand and which are generated.
What is finished and what is not is in [`STATUS.md`](STATUS.md).

## The edition layer

The Last Version is a separate game built from the same sources as the Station Zero game.

| What | Where |
| --- | --- |
| Which game a page is | `game/js/core/Edition.js`: `window.AZ_EDITION = 'lastversion'` (set by the edition's build) or `?edition=lastversion` on the URL. Without either, the page is the Station Zero game, unchanged. |
| Its own saves and settings | Every key under `afterzero.lv.` (`Edition.js` `NS`, used by `ui/Saves.js` and `ui/Settings.js`). The two games never see each other's saves. |
| Its own app | `EDITION=lastversion bash android/build-apk.sh` builds "AFTERZERO: Last Version" (`com.afterzero.lastversion`, versionName 2.0.0, `AFTERZERO-LastVersion-v2.0.apk`) into `android/build-lastversion/`, with a preview `index.html` that sets `window.AZ_EDITION='lastversion'`. Each game carries only its own people: the edition the 40 character files of `casting.js` `MANIFEST` (its 31 Rocketbox people and the 9 shared models it uses), Station Zero every model but the edition's 31; the same lists go into each preview as glTF JSON. |
| Everything the edition changes | `game/js/editions/lastversion/`: `index.js` (title, states, labels, looks, speakers, engine options), `Runtime.js` (chapters, missions, objectives, scenes, choices, stability, Echo Step, anchors, the case board, endings), `prologue.js` (Missions 1–3), `acts.js` (Acts I–IV, the Finale, the endings, the optional cases), `npcs.js` (the people), `Build.js` (hand-built interiors and props), `inversion.js` (REVERSE: input, targeting, charge, the rules, its HUD and sounds), `processes.js` (the things REVERSE can hold, and the mission landmarks they stand at), `casting.js` / `wardrobe.js` / `crowds.js` / `watchers.js` (who is built from which model, what they wear, the crowds, the watchers), `places/` (the open places under a real sky: the builder, the archetypes, the styles and materials, the years and skies, the horizon, the scenery, one spec per place). |
| Hooks in the shared code | `main.js` hands the game to the edition's runtime where the edition is on (`this.edition`), and nowhere else. `RealityEngine` takes a configurable state set. The generators take a few optional fields (`zone.themes`, `zone.names`, `zone.drones`, `zone.overlay`, `deck.mechs`, `story.mechDeck`, beat kinds `scene`, `choice`). Each hook is a no-op for the Station Zero game; `npm test` and the default suites prove it. The v2.1 overhaul's hooks so far: `main.js` settings text, comfort mode reads "Steadier camera, no flashes" when the edition is on (1 line, U1); `main.js` `updateTheme` takes the light from `edition.themeFor(state)` when it returns one (1 line, U2) and the sun's direction from `edition.sunDir()` (U2; since the 1.1.1 merge the sun's shadow frame is texel-snapped, so the hook re-aims that frame when the direction changes: 9 lines, none of which run without an edition). `entities/Player.js` is not changed: since 1.1.1 the engine itself climbs a ledge up to 0.35 m from the ground and follows the ground down a drop as deep, in both games, so the places are built to that rule (stair rises of 0.34 m, ramps in 0.25 m steps, kerbs of 0.15 m) and the edition's own `stepUp` hook is gone. REVERSE's moving colliders are edition-owned entries in `DeckWorld.temps` (`t: Infinity`, removed by the edition), so `DeckWorld.js` is not changed. U4 (casting): `world/People.js` takes a person's own `crew.model` first when it is loaded, calls a dresser the edition registers with `setCrewDresser(fn)` for everyone it builds (holograms too), uses `crew.height` when a person has one, and no longer lists the edition's people in `BY_NAME` (8 lines; Station Zero's crew carry no `model`, `height` or dresser); `main.js` filters the character screen's looks by `editionDef.looks` (3 lines), and at boot the edition loads Kai's model first whatever look an older v2.0 save chose and does not preload Station Zero's crew (its people load per chapter: 3 changed lines, each a no-op without `EDITION === 'lastversion'`). DeckWorld is not changed: watchers are swapped inside each sentinel after the level is built. |

Its own look: the title reads AFTERZERO / THE LAST VERSION OF EARTH in front of rain, a city's
glow and the black ring; the chapter list is PROLOGUE, ACT I–IV, FINALE, CASES; you are Kai
Varen (the realistic man in shirtsleeves, `real_m`) until you choose otherwise; the HUD names
the years: 2049, 2026, 2196 (at most three pips, only the mission's own years). There is no
law-writing device and no TICK in this edition: the dock says THINK, ECHO STEP and CASE, the
touch SHIFT button is YEAR (coloured by the year it will switch to), `L` and `J` open the CASE
BOARD. From Mission 11 a REVERSE chip sits beside the year card, with a ⟲ button on touch.

## Places under an open sky

OVERHAUL.md §4. Every mission, from Rain City to Afterzero, and the two cases stand in an open place
with a real sky over it, its own horizon, its own light per year, and the quarters its beats happen
in. Nothing in them comes from ZoneGen, LevelGen, `dress.js` or a Vessel look: since U3 the edition
imports neither generator (a test greps for it), `dress.js` is gone and the `P` palettes with it.

| Piece | What it does |
| --- | --- |
| `places/index.js` | `PLACES` (the registry) and `buildPlace(key, story, sector, rt, { deck })`: a level in the shared format (DeckWorld runs it unchanged) plus `place`, `landmarks` (`{ name: [x, y, z, yaw] }`), `quarters` (`[{ name, area, spawn, threshold }]`), `years`, `crowd`, `sites` and `scenery` (`(root, rt) =>` the mounted place). Sector *i* loads the whole map and activates quarter *i*: its spawn, its beat at a landmark, its fragments and watchers, its exit at the quarter's threshold (D2 step 1). A mission with fewer sectors than the place has quarters maps each sector to its first quarter (`spec.sectors[mkey]`, e.g. Mission 18's `[0, 2, 3]`: the evacuation and the canyon are one sector) and leaves by the threshold of the last quarter it spans. A spec's `variants[mkey]` gives a mission its own quarters or years in a shared place (Helix's wings, the two cases). Also `themeFor(level, state)` and `sunDir(level, state)`. |
| `places/Place.js` | The builder a spec builds with: colliders (invisible boxes; one that exists only in some years or after some fact is a `ghost`, a DeckWorld conditional whose mesh the edition takes away), visual pieces (`level.vis`: box, turned box, cylinder, cone, gable, hip, dome, torus, plane, disc, ring sector (`fan`), sphere, vault; a material, a tint, the years, a fact condition), vegetation (`level.veg`), texts, landmarks, terrain heights, kept-clear rects, sites, deep water, traversal challenges (each names the years that answer it), interior rooms of a place (`P.room`: a ward that runs backwards, with `spec.outdoorFirst` the outdoor room comes first with every interior cut out of its bounds). `P.E(years, fn)` puts what `fn` builds into those years, `P.W(fact, fn)` behind a fact. `stageBeat` puts today's beats on their landmarks as things of the place (a telling-stone, a ledger on a lectern, a bronze plate, a phone booth, a glass case), never a Station Zero terminal. |
| `places/archetypes.js` | Parametric pieces: ground (with holes), terraces with retaining walls, stairs (rises of 0.34 m, walked up by the engine's 0.35 m step), ramps (stepped colliders under a smooth slope), water (deep, or wadeable at 0.6 m), walls with openings, railings, blocks (floors, facade, roof: flat, gable, hip, mansard; shopfronts, awnings, cornices, rooftop units), towers, roundhouses, longhouses, granaries, tents, canopies, colonnades, arches, bridges (humped), viaducts, cranes, rings of standing stones, square spiral stairs round a core, lattice masts, shipping containers, dish antennas, gantry cranes, signs (letters) and glyph panels (carved, for the ancient years), props (benches, bollards, lamp posts, tram poles, bus shelters, stalls, kiosks, booths, barriers, cars, scooters, planters, crates, barrels, phone booths, ad screens, looms, racks, pots, carts, cairns, fish racks, boats, fire pits, torches, floodlights, site huts, tarps, chillers), the seeded fill and the edges (the city going on, cliffs, hills, water, hedges, meadow; never a tall wall) with the invisible ring. |
| `places/styles.js` | One style per place: its materials, facade tints, roof, at most six vegetation kinds, its record kits and the palette DeckWorld lights its own few pieces with. |
| `places/materials.js` | Every material name a place uses, as data: a shared surface (painted into a canvas at first use, or one of the CC0 scans: asphalt, brick, concrete, pavement, rock, stone, water) and a tint, with tags (`modern`: lamps, neon, roads, kerbs, signs, never in an ancient year). Surfaces are shared by every place (one draw call per surface), tinted by vertex colour; a vertex's years are an attribute, so the vertex shader drops what is not of this year and small props beyond 90 m. Lit facades (brick, curtain glass, Helix panels, townhouses) carry a window mask that comes on with the year's `lit`. |
| `places/years.js` | The sky presets (the zenith, horizon and ground colours, the city glow, the sun, the moon, the stars, two cloud layers, lightning) and what a year adds: the hour, the sun's elevation and bearing (or the Notch's), the fog and its density, the night, the weather, the colour grade, the light probe, the hemisphere and the sun's colour. |
| `places/atlas.js` | The Valley of the Ring: each place's position, and the far features (the Ring Hill and what crowns it in each era, the Ridge and the observatory's glint, the Notch, the city's skylines, the harbour cranes, the sea, cooking smoke) at their true bearings from it. |
| `places/Sky.js` | One inverted sphere (r 420) following the camera, one shader: the preset's gradient, sun, moon, stars, one bright star, two scrolling cloud layers from a tileable noise painted once, the lightning flash, and the features a mission's sky carries, each with an optional condition: Mission 1's black ring-shaped hole in the clouds after the Zero Second (`ringHole`), Mission 11's sky drifting backwards over the rising rain (`reverse`), Mission 15's lock halo (`halo`), Mission 18's storm of times (`storm`: a wall cloud with a ring-shaped eye, bands of other times sweeping round, lightning coloured by the year), Mission 19's unbuilt city hanging upside down in construction lines (`unbuilt`), Mission 21's cloud sea with the lagoon city far below through its gaps (`cloudSea`), Mission 22's sky cut into wedges like a clock face and its eclipsed black sun (`wedges`, `eclipse`), and Afterzero's light that changes along the road (`route`) and its three ending skies (`preset`). Every uniform eases over about 1.2 s on a year switch. One draw call (the halo, the unbuilt city and the cloud sea are a mesh each). |
| `places/Horizon.js` | A band at r 380 painted per year from the atlas (hazed toward the year's horizon colour, lit windows where the year is lit, dark in 2196), and a ground skirt under the scene's fog. Two draw calls. |
| `places/Scenery.js` | Turns `level.vis` into one merged mesh per surface (and per fact condition), with world-projected UVs, vertex tints and the year mask; the vegetation instanced per kind (plane trees, lindens, birches, cypresses, olives, willows, blossom, bare trees, shrubs, grass, barley, reeds, ferns), the other years' instances scaled to nothing. `setEra(state)`, `refresh()` (fact conditions), `stats()`. |
| `places/kits.js`, `places/mount.js` | The kits records, fragments and set pieces wear (and the clockmaker's brass arm); mounting a place after DeckWorld has built it: the scenery, sky and horizon into the level's root, the `ghost` meshes taken away, doors and gates in place materials, deep water that walks Kai back to the last checkpoint, a hazard that is still in a year. |
| `places/specs/<key>.js` | One data spec per place: bounds, edges, years, quarters, which landmark each beat of each mission stands at, fragments, watchers' paths, crowd paths (for U4: `level.crowd`, each with its wardrobe era, the years it walks in, its role, path and size, within §4.7's 24 people with the named cast), and `build(P)`. |

**Runtime.** `buildLevel` calls `buildPlace` for every mission (the mission's own rooms, Helix's,
are built first by its `rooms(P, …)` and the place builds round them); a mission without a place is
an error, not a generated district. `onSectorLoaded` mounts the place; `theme()` (every frame)
sets the palette's fog, density and night from the year, and on a year switch the sky, the
horizon, the scenery, the lit windows, the weather, the colour grade and the light probe;
`themeFor` and `sunDir` give `main.js` the year's light and a sun that throws long shadows when it
is low. `stateFog` is 0 in a place (the year's own fog colour, all of it). Kerbs, terrace steps and
ramps are walked, not jumped: the engine climbs 0.35 m from the ground, and every rise is built to
that. An authored trigger can carry Kai somewhere (`to: [x, y, z, yaw]`, a short fade): Helix's
glass lift takes him down into the chamber under the oculus. A trigger can also wrap (`wrap: [dx, dz]`):
Mission 19's plain sends Kai off its east edge and back in from the west, seamlessly, so its roads loop.

**`Build.js`** keeps the hand-built rooms for Helix. A room can be placed and turned (`at`, `rot` in
quarter turns, `y` its floor), leave by a side wall (`exit: 'E' | 'W'`), climb to the next room on a
stair corridor, have a roof per year (`'solid' | 'glass' | 'open'` or `{ PAST: 'open', … }`) and
windows per wall (`'full'` or spans); inside a place its surfaces are drawn by the place's scenery in
place materials, its year pieces go to the year groups. The Chronolith has three edition models: a
ring of dressed stone with a bronze band (the past), the black machined ring with bronze glyphs
(Helix), and the broken halo of 2196 (one model can carry several and follow the year: the mount
calls its `setEra` on every year switch). The stone ring stands inside the village's standing
stones in Mission 4 ("the ring in the middle of the village is stone, and it is the same ring"),
the black ring in Helix's chamber in Missions 2 and 3, and in Mission 3's 2196 it is the halo.

| Mission | Place | Size | Quarters | Years and look |
| --- | --- | --- | --- | --- |
| 1 | `rain_south` | 180 × 242 m | HOME & MARKET · TRANSIT PLAZA & CHECKPOINT · LINE 41 | 2049 08:14, dark overcast, fast cloud, rain; "8:13" lighter rain and a sunbreak, the morning's traffic; after the Zero Second a black ring-shaped hole in the clouds |
| 2 | `helix` (west wing) | 140 × 160 m | SECURITY · THE DARK CORRIDOR · POWER · CONDUIT & ARCHIVE · THE CHAMBER | 2049, night storm with lightning, emergency red inside |
| 3 | `helix` (east wing) | the same | THE CHAMBER · TEMPORAL LAB · THE DIG · MACHINE HALL · CONTROL | 2049 washed dawn with the sun in the Notch; 2026 hazy noon, the campus a frame, the dig, a crane; 2196 misty green dawn, the ruin |
| 4 | `valley_upper` | 200 × 200 m | THE FIRST FIRE · THE WATER STEPS · THE RING | THE VILLAGE golden late afternoon; BEFORE THE FIRE blue pre-dawn, tents, tall grass, meadow slopes across the terraces |
| 5 | `valley_river` (+ gorge) | 200 × 220 m | THE HEAD-STONE · THE RETAINING WALL · THE PRESSURE GATE · THE UPPER GORGE | THRIVING clear midday; ABANDONED grey overcast, roofs fallen; FLOODED low teal sky, water at +4 m, the roofs a route |
| 6 | `oldtown` | 120 × 140 m | SHOP FLOOR & CANAL STREET · THE GALLERIES · THE CLOCK ROOM / ROOF | 2049 autumn evening; 2026 spring morning (the hidden stair stands); 2196 winter, the canal iced, the arm rusted solid |
| 7 | `observatory` | 180 × 180 m | THE LOWER RING · THE INSTRUMENT STAIR · THE OUTER RING | THE FIRST SKY sunrise in the Notch, polished bronze, torches; 2049 blue hour, a bright star, the survey; 2196 golden wind, fallen rings |
| 8 | `helix_v17` (sameAs `helix`) | 140 × 160 m | STAFF RECORDS · THE CORRUPTED LOG · THE LAST TEN MINUTES | VERSION 17: a still grey-violet afternoon, the full ring, the river through the court, the containment cube; 2026: the young garden, the junior tour's marquee |
| 9 | `northbank` | 200 × 200 m | START · CLOCK A — OBSERVATION · CLOCK B — THE ENEMY ROUTE · CLOCK C — THE LOOP TRIGGER · THE CONTROL TOWER | 2049 the loop's windy grey morning over the river terraces, the funicular, the cathedral, the transmitter; 2026 the lighthouse under scaffold, the market's timber loggia |
| 10 | `dam` | 180 × 120 m | THE DETENTION BLOCK · POWER SYSTEMS · THE TESTING CHAMBER · THE YARD | 2049 dusk under the Notch (near and high), sodium light, cells cut into the face; 2026 the dam under construction, a scaffold stair |
| 11 | `hospital` | 160 × 140 m | TRIAGE & THE QUIET COLONNADE · RECORDS · WARD 32 | the pavilions and the open colonnade, the records hall, the reversed annex and the twin ward (interior rooms; the processes at their landmarks); 2026 the admission afternoon |
| 12 | `helix` (north wing) | 140 × 160 m | THE CHASE — 2049 · THE CORRIDOR THAT WAS — 2026 · THE RUIN — 2196 · THE SECOND CHAMBER | wind at sunset, violet work light in 2026, green-gold dusk in the ruin; the sunk terraces down to the second ring |
| 13 | `warport` | 240 × 200 m | THE BATTLEFIELD · THE THREE DEVICES · THE STABILIZER | 2049 battle smoke over the delta port, the trench, the container canyons; 2026 the working port and the rail yard; 2196 a meadow over the port, the channel a reed marsh |
| 14 | `drowned` | 220 × 220 m | THE OVERGROWN TOWERS · THE TRANSIT LINE · THE MEMORIAL | 2196 the lagoon over the avenues, forests on the towers, the transit viaduct; 2049 and 2026 the dry downtown |
| 15 | `lockcity` (bowl helper) | 220 × 220 m | THE STATION · THE SCHOOL & MARKET · THE ARCHIVE / THE LOCK | 2196 houses on the stadium's tiers under the lock halo; 2049 the relief camp's tents; 2026 floodlit match night |
| 16 | `sinkhole` (spiral helper) | 150 × 150 m | THE RIM & THE FIRST MEMORY · THE SPIRAL · THE COMPARISON HALL · THE PHOTOGRAPH | 2196 the museum at dusk, lanterns down the spiral, the lens hall; 2049 the flooded quarry lake and the Helix barge; 2026 the working quarry at dusty noon |
| 17 | `array` | 260 × 260 m | THE SHIFTING CORRIDOR · THE RECORDINGS · THE EARLIER ROOMS · THE ORIGINAL EXPERIMENT | 2049 frost under the Milky Way, red aircraft lights; 2026 heat haze, the array being built; 2196 sand dawn, dishes tilted; the drum racks stand differently each year |
| 18 | `fracture` (linear) | 120 × 420 m | THE ANCHOR SETTLEMENT · THE CANYON · THE FLOODED HIGHWAY · THE COLLAPSING SKYSCRAPER | the storm of times in every year; 2196 the scrap village on the interchange, the chasm, the buckled road, the tilted floors up to the tower; 2026 the river canyon and its stone arch; 2049 the flood, the lamp-post heads |
| 19 | `unwritten` (mirror helper) | 220 × 220 m | THE LOOPING ROAD · THE BRIDGE IN THE REFLECTION · THE DOOR THAT IS EVERYWHERE | high-key white-violet, rose or mint per year, no sun disc; the unbuilt city upside down in the sky; floating fragments and their reflections; edges that wrap |
| 20 | `memory` | 130 × 130 m | THE HOUSE · THE EXPERIMENT · THE WORLD WITHOUT KAI | 2026 the terrace and its gardens, a golden overexposed evening; the first experiment, a white void with the remembered things in colour; adult Mira's seaside garden in the morning |
| 21 | `spire` | 160 × 160 m | THE ALLY / ARRIVAL · THE COMMAND STRUCTURE · THE ARENA · THE WITNESS | 2049 hard noon above the cloud sea; 2026 the tower's roof at the cloud line; 2196 the frosted ruin at a blue dusk |
| 22 | `firstsecond` (wedges helper; sameAs M1, M4, M6, M11, M3) | 160 × 160 m | THE VILLAGE'S CHAIN · THE CLOCKMAKER'S PATTERN & THE HOSPITAL'S LOCK · THE FINAL CHAMBER | the twin chamber (2026 at 16:02, 2049 at 05:40) under an eclipsed sun; five wedges of earlier places in their own light, the sky cut to match; the years change which wedge is lit |
| 23 | `afterzero` (linear; sameAs M1, M4, M2, M14) | 100 × 360 m | THE OPENING STREETS · THE SETTLEMENT, AGAIN · THE HELIX LAB · 2196 · THE ORIGINAL CHRONOLITH | night rain over the quoted South Square, dusk over the settlement, pre-dawn over Helix, the first sunrise in the Notch at the ring; the three ending skies |
| B | `valley_river` (the gorge, variant `c_b`) | as Mission 5 | THE DRY CHANNEL · THE GATES | Mission 5's years |
| C | `lockcity` (the press tower, variant `c_c`) | as Mission 15 | THE FIRST ARCHIVE · THE SECOND ARCHIVE | Mission 15's years |

Documented deviations: the observatory's summit stands at 27.5 m, not the sheet's 30 m, because the
shared engine respawns anyone whose centre rises above y 30 (`main.js`), and a jump on the summit
must stay under it; for the same reason the Spire's walkable terraces stop at 24 m (its mast and the
citadel's ring rise above), and Mission 18's tower deck is at 26 m. Mission 20's plot is 130 m square
(the sheet's 90 m plot in the middle, the white memory boundary round it), so the place keeps §4.7's
short side. The two traverses (Missions 18 and 23) are `linear`: exempt from the 120 m short side,
held to 100 × 300 m instead.

## The bible → the engine

### Three years (and no fourth state)

| Bible | Engine |
| --- | --- |
| Temporal State Switching: authored states of one location, not free date selection | `RealityEngine` runs on `['PRESENT', 'PAST', 'FUTURE']`, baseline `PRESENT`, with no law slots (`slots: 0`, `laws: []`) and only the past's own effects. Each mission lists the years its region was authored with (`states:`); `setAvailable` gives each room those, cycling (`Q`) visits only them, and a year a place does not have is refused ("This place does not have that year"). `1 2 3` pick by position; `4` is REVERSE. |
| Past: original structures, causes, objects that no longer exist | `PAST` is the residue state: echo geometry (the bridge that stood here, the stairs that were pulled down) is visible and holds weight (`stateEffects.PAST = { echoVisible, echoSolid }`); records show what they said first (contradiction beats). Items from the past are echo items. |
| Present: investigation, machinery, grounded stealth, human conflict | `PRESENT`: the place as built; locks read it (a key from another year must be anchored). Watchers patrol it. |
| Future: consequences, traversal through ruins, unstable zones | `FUTURE`: authored consequences (the parked lift across Helix's collapsed hall, the drained village, the third device), ivy, roof gardens, moss and fallen slabs built into every place that has a 2196 (its spec's year pieces), and in unstable regions the Chronolith's stability drains. |
| Inverted: "temporarily reverses selected processes, subject to energy and stability limits"; "Inversion: reverse selected motion or mechanism; local and readable; no universal rewind of all consequences. Mission 11" | Not a year: a verb, **REVERSE** (below), unlocked in Mission 11. Kai aims at one process he can see and holds it running backwards while the Chronolith's charge lasts. Places that run backwards on their own (Mission 11's reversed wards) are a room override (`engine.setOverride(room, { timeReverse: true })`), not a state: their sweepers and patrols turn the other way and the intercom speaks backwards. Gravity never changes (`engine.gravity()` is always −1). |
| Each state looks and sounds different | `DeckWorld.setLook` tints the materials per state (warm stone then, cold steel now, moss and rust later) and puts the city's windows out in 2196 (nobody has power); in open districts `Runtime.stateFog` / `stateDensity` / `stateNight` give each year its own air and hour (2026 a warm sepia haze at dusk, 2196 a pale green mist), each year its own colour grade where the renderer grades, and `stateWeather` its weather (2196 pollen, 2026 dry); `audio/Synth.js` plays a different chord progression per state (The Need to Fix It, Living History, Beautiful Catastrophe) and an ambience bed per region. A mission can name its states for what they are there (Mission 5's village: THRIVING / ABANDONED / FLOODED; Mission 4: BEFORE THE FIRE / THE VILLAGE). |

### REVERSE: the bible's inversion as a local verb

`inversion.js` (the verb) and `processes.js` (the things), per OVERHAUL.md §7.

| What | How |
| --- | --- |
| Input | `R` (a capture-phase key listener that also stops the shared `R` → year switch; `Q` stays the year switch), `4`, the touch ⟲ button left of YEAR (60 px, a conic charge ring, REVERSE / RELEASE, hidden until it is unlocked, dim with no target; it binds its own touches), and the floating target label. One press starts a hold on the aimed process; a second press lets go (D5). |
| Targeting | Processes in Kai's room and year (their `when`), within reach (22 m outdoors, 14 m indoors), nearest the crosshair (10°, 16° on touch; ties to the nearer), in line of sight (`player.rayDistance`, best two only); on touch, also the nearest within 8 m in front. A silver ring and a label: "⟲ THE TRAY · 8 s", or "✕ NOT A PROCESS" / "✕ A MEMORY" on refusals. |
| Lifecycle | Start; the process runs from rest to its origin; holds there while the charge drains; warns in the last 1.5 s (faster ticks, a flicker); lets go and runs forward again. A hold also ends at a year switch, a snap back, walking off beyond reach × 1.6, or pressing on another target. A solid piece never seats into Kai: it hovers 0.3 m short. |
| Charge and stability | 8 s from Mission 11, 10 s after Mission 13, 12 s after Mission 18 (`campaign.inv`, saved). Weight (charge per second held): light 0.5, medium 1, heavy 1.5. Start: 0.5 s and 0.03 / 0.06 / 0.10 stability. Refused under 1 s of charge or 0.2 stability ("Not now. The Chronolith can't hold anything back."). In unstable regions a hold drains stability like being out of the present. Recharge 1.25 s/s after 1 s idle. Minimum hold 0.6 s. A wrong lock bolt costs 1.5 s and 0.03. |
| Rules (the case board's ABILITIES) | R1 One thing at a time. R2 It holds only while charged, then goes forward again. R3 What you do while it holds stays done. R4 If nothing pushes it forward, it stays reversed (settled; saved). R5 Reversing something already running backwards runs it forwards. R6 Never a person, never a memory. |
| Process kinds | `collapse` (bridge, stair, slab: pieces fly back in reverse fall order and seat as solid), `fall` (a lift car or a beam rises along its arc and carries Kai), `flow` (water, smoke, a spilled glass draws back), `burn` (char recedes; a burnt document is readable while held), `lock` (only the last-fitted bolt backs out; any other jams; settled), `ink` (the newest layer un-writes; settled), `recording` (plays forwards once; R5), `patrol` (a watcher moonwalks its last 8 s and un-sees Kai), `mechanism` (runs backwards), `projectile` (flies back to its origin and never lands; settled), plus authored refusals. At most 12 per level and 10 parts each; one merged mesh per process at rest. Facts: `rev_<id>` while held, `inv_<id>_done` when settled. |
| Moving colliders | Each solid piece is an edition-owned `deckWorld.temps` entry (`{ mesh: an empty Object3D, box, t: Infinity }`) whose box changes in place; the edition removes its own entries on release and unload, so none ever reaches expiry. |
| How it reads and sounds | Reversible things glint silver every ~4 s within 25 m once REVERSE is Kai's; the aimed one pulses; motes are drawn into the seams; a violet edge vignette while holding (comfort mode removes the flicker and the vignette); colour #c9b8ff. Procedural sounds through the game's mixer: a reversed tick on acquire, a reversed swell and material grains on start, a two-note drone and a reversed clock tick while holding (the music ducks to 0.35), a creak and forward grains on release, a ratchet-clack-deny on a jam, a dull stop on a refusal; an inverted watcher coming into view drops the music for 0.4 s. |
| HUD | `#state` is wrapped in an edition flex row (`#lvTop`, moving the node so HUD keeps its reference) with the REVERSE chip (`#lvReverse`: "⟲ 8s" with a charge ring, "⟲ THE TRAY 4.1" while holding); a thin charge ring round the crosshair when aiming or holding. CSS is injected as `<style id="lvInv">`, scoped to `body.lastversion`; `HUD.js` is not changed. |
| Saves | `campaign.inv` (charge, cap) and `deckWorld.flags` (settled processes, each lock bolt that is out). A v2.0 save is migrated in `resume()`: INVERTED rooms go to the baseline, INVERTED leaves every room's list, the law slots go, `campaign.inv` gets its default. Chapters started from the menu prime `has_inversion` from Act III (and `inv_cap` 10 for Act III, 12 from Act IV); Act II reaches it by playing Mission 11. |

**Documented deviation (D1).** The bible's art line "gravity changing only in readable zones" is
honoured only as objects whose fall reverses (a lift car rising, a tray going back onto its
trolley). Kai's own gravity never changes, as the player asked: no ceiling routes, no gravity
flip, no law device, law tokens or "MEMORY KEY" labels (keys from the past read "KEY (2026)").

**Mission 11, where it is taught** (in the hospital's current generated rooms; every piece is
placed by the landmark names of OVERHAUL.md §5 through room-relative anchors, `deck.anchors`, so
the open hospital of U3 can re-place it through `level.landmarks` / `level.sites`):

- Triage, the colonnade and the annex corridor run backwards on their own (reversed wards: a
  shimmer at the door, the intercom's "Temporal discontinuity." played backwards inside).
- In the records hall the charred third file un-burns three seconds in every ten, too short to
  read; standing by it, the Chronolith catches the rhythm: `has_inversion`, Kai's line, the R1/R2
  toast. The tutorial: the tray that fell off its trolley (fall), a spilled glass (flow), the
  burnt annex door (burn). Held, the file reads "ADMITTED BY: K. VAREN" in an older hand, which
  opens the way on. The flatline monitor by the empty bed refuses: "✕ NOT A PROCESS".
- Ward 32's door has a reversing lock of four bolts fitted RING, BAR, STAR, CRESCENT. Three clues
  give the order: the 2026 maintenance tag (readable in 2026), the twin lock in the reversed ward
  next door coming apart on its loop last-fitted first, and the intercom chime's four tones. Only
  the last-fitted bolt still in will back out (and stays out); a wrong one jams. When the last
  bolt is out, `inv_m11lock_done` opens the door and plays the lock scene.
- The sound that grows quieter, the returning hazards and Nurse Odile come with the Mission 11
  rewrite (U7).

### Signature systems

| Bible | Engine |
| --- | --- |
| Chronolith stability (quiet HUD) | `Runtime.stability` (0–1). Out of the present in an unstable region it drains (0.045/s, about 22 s from full); in the present it refills (0.1/s). Echo Step costs 0.25, an anchor 0.15. The meter is a thin bar under the year pips, shown only when you are out of the present or below full, with "CHRONOLITH DRAINING" / "UNSTABLE" when it matters. At zero the Chronolith lets go: a fade, the room snaps back to PRESENT, you stand at the last checkpoint ("the last anchor") with half stability. |
| Causal anchors: selected objects persist between states after a deliberate action | `C` anchors what you carry: the engine's global `heldPersists` effect holds while that object is in your hands. Without it, something taken out of the past comes apart when the year changes. |
| Temporal residue | Contradiction beats: a record (plaque, public screen, field order, archive card) reads one thing in every state and something else in the past; reading the residue pins evidence and opens the way on. |
| Echo Step (from Mission 10): afterimage that distracts enemies or crosses a gap; consumes stability | `X`, unlocked by Mission 10's choice (every branch sets `echo_step`): an afterimage of Kai stays where he stood for 4 s and the watchers chase it (`DeckWorld.setDecoy`), and Kai steps up to 5 m forward where the ground holds; 8 s cooldown, 0.25 stability, refused below 0.3. |
| Local loops | `deck.loop` (Mission 9: 82 s, Mission 15: 120 s): the street resets, the watchers go back to their rounds, Kai keeps what he knows ("The street resets. You do not."). Mission 1's station falls back to 8:13 every 41 seconds with the announcement (quest chain A is solved in that minute). Mission 6's sweeping arms repeat on a rhythm to be learned. |
| Persistent consequences | Facts carried across missions: the river diverted in the earliest state shapes the later states of the village (Mission 5); the stabilizer choice sets your faction (Mission 13) and with it who answers in Mission 21; Jun's passengers (Mission 1) clear the Finale's first street of watchers; Iven's team or Iven's log (Mission 3) decide whether Iven can be your ally; Anja's lock (Mission 15) likewise. |
| Inspect objects; evidence journal / case board, not a checklist | The case board (`J`): where you are and the act's question, every piece of evidence pinned (`ev_*`), the people you met with their trust, knowledge and quest state, what you chose, and the case log. |
| Quiet HUD | The year pips with the stability bar, the objective ("current understanding"), the interaction prompt, the watcher meter when one is near. |

### Combat → stealth and evasion

The engine has no combat, and this edition adds none. The bible's fights are played as readable
stealth and evasion with watchers (`Sentinel`: a cone of sight along the floor, suspicion, a
chase, and a walk back to the last checkpoint when it reaches you):

| Bible | Here |
| --- | --- |
| Malfunctioning security drones (Mission 2), Continuum guards (Mission 10), patrols (Missions 9, 13) | Watchers on patrol loops; stay out of the cone, use pillars and alleys, cross in a year where the watcher does not exist (Mission 3's drone was installed after 2026), or Echo Step. |
| "A security unit that rewinds damage; lure it into a damaged power conduit" (Mission 2) | A watcher that cannot be outlasted: throw the breaker, let it see you, lead it through the live conduit; it stays down (`conduit`, `onSentinelDown`). |
| Temporal scavengers, elite enemies who rewind injuries, security that mimics Kai | Watchers; in a reversed ward their patrols run backwards, and from Mission 11 REVERSE can walk a watcher back through its last 8 seconds (a `patrol` process) so it forgets it saw Kai. |
| Faction battle (Mission 13) | Three devices disabled in three different years while the battle repeats, then the choice. |

This keeps the bible's "readable combat: temporal powers alter positioning and timing" — every
encounter is about where you are, when, and in which year — and its NPC rule "avoid making every
encounter end in lethal combat".

### People (the NPC supplement)

| Supplement | Engine |
| --- | --- |
| State model: trust, knowledge, quest state, temporal state, faction standing, evidence flags | Facts: `trust_<id>` (−1 hostile, 0 guarded, 1 cooperative), `know_<id>` (0 unaware … 3 informed), `quest_<id>` (active / resolved), `faction` (neutral / continuum / unwritten), `ev_<flag>`; the temporal state is each person's `temporal` list in `npcs.js`. Saved with the game. |
| Dialogue choices express intent | A choice panel with CHALLENGE / COMFORT / INVESTIGATE / WITHDRAW on every option; a choice can change trust, knowledge, a quest, the faction, evidence, facts. |
| Barks | Short lines in passing, from the bible's list and each region's ambient population; one at a time across a place, never over a conversation or a menu. |
| Unavailable in a state → an echo, a recording, a changed location | Someone who exists only in some of a place's states leaves an echo (a translucent impression) in the others; talking to it plays what the year kept of them (Jun at 8:13, Iven in 2026, Niko in the flooded future, Tala, the Witness). The person a story beat is about is always met in person, and no main-story person is ever only an echo. |
| Roster | Kai, Mira, the Witness, Sera Voss, Dr. Elias Rook, Niko, Dr. Anja Vale, Iven Marr, Tala, Jun Park, Mara Quill, Orren, the Child in the Station, plus the Elder, Ezra Moll the clockmaker, Officers Pryce (the checkpoint, id `guard`, `pryce` an alias), Dale and Haig, Dr. Lin, Rhea Odum, Sergeant Brask, Nurse Odile, Ward 32's figure, the Florist, the Helix receptionist, the District Warden, the Gardener, the Director of Continuity (whoever `rook_fate` made them), young Kai and Tomas, and the crowds of Rain City, Helix, the settlement, Loop City, 2196 and the Unwritten Second. |
| Quest chains A–D | A (Jun, Last Train Home) and D (Iven, The Technician's Key) are part of the Prologue; B (Tala and Niko, The Water That Remembers) and C (Mara, Two Records, One Disaster) are the optional CASES chapter. Each has both outcomes, and none is in a mission's completion condition. |

### Casting, crowds and watchers (v2.1, U4; OVERHAUL.md §6)

Every person looks like who they are: role, gender, age, era. Thirty-one Microsoft Rocketbox avatars
(MIT; `tools/rocketbox-to-glb.mjs --edition lastversion`, credited in `game/assets/characters/CREDITS.md`)
join the nine Station Zero models the edition uses: sixteen named people at 1024 px (Mira, who is
also Dr. Lin, young Kai, the Child, Rook, Niko, Jun, Tala, Pryce, Dale, the Elder, Ezra, Rhea, Brask,
Odile, the Florist, the Warden) and fifteen crowd bodies at 512 px. The converter learnt the children's
and soldiers' prefixes (`cf001_`, `sm024_`), the `_color_acu` / `_color_blue` maps, the children's
Bip02 rig (renamed Bip01, so they animate and have eyes), parts left out (`RB_DROP`: the pistols) and
a painted-out sleeve flag on the soldiers.

| Module | What it does |
| --- | --- |
| `npcs.js` | Every entry carries `model`, `variant`, `height`, `vid` (its recorded voice, U5) and `walk`. The checkpoint officer is Officer Pryce on `rb_security_f` (Helix black), not a doctor; Dr. Lin and adult Mira share one mesh in two wardrobes (her face is the fair clue); the Witness wears Kai's; Ward 32 holds a silent, flickering figure of Mira in a gown, and Nurse Odile speaks for the ward. Pronouns match the body and never change. `AMBIENT` gives each region its crowd roles' names and voice pools. |
| `casting.js` | `LV_MODELS` (registered into Actors' table when the runtime is built, so nothing loads at boot but Kai), `SHARED_MODELS`, `MANIFEST` (the APK's and preview's character files), `CHAPTER_CAST` (the models each chapter's people, crowds and watchers use; a unit test checks it against every level). A chapter's models load behind its card, one at a time with a frame between (`loadCast`); the title starts loading the chapter most likely to be played next, and a chapter's last mission the next chapter's. Actors has no release, so models stay loaded for the session. `lodUpdate` keeps the 16 nearest people within 40 m posing every frame, the rest within 70 m four times a second, anyone farther still. |
| `wardrobe.js` | `WARDROBE[model][variant]`: parts hidden (the stethoscope), colour rules per material map (a UV band, a lightness window, a hue and saturation selection; a new hue, saturation and lightness), hair tint, props (umbrella, lantern, staff, trowel, clipboard, loupe, lanyard, beret, visor, badge, built from primitives once). A recolour runs once per model, variant and map on the GPU (one quad into a mipmapped render target) and is cached; the copy is freed with the people who wore it. Skin is protected by the person's own skin colour, sampled from their face, and by the corners of the body map that hold their hands (found once per model). Rain City's crowds are 15% darker (wet) and carry umbrellas. |
| `crowds.js` | `castLevel(level, deck)`: the named people in this mission's wardrobe (`story.cast` = copies of `CAST`, indices unchanged, then the level's own), the hand-placed passers-by by who they are (M1's toy child in a red raincoat, the trapped pair, M3's technicians), and the crowds along `level.crowd` by era and role (present 2026/2049, ancient, 2196): a named face is never in a crowd (the mission's own people and `deck.named` are left out; the settlement's women wear whichever named woman's mesh is absent), crowd faces never cross eras (but `rb_child_m2`), neighbours never share a model and variant, heights vary within 4% and paces within 8%, and a place's people stay within 24. Crowds walk their paths, bark from their region's pool and stop with the clocks where a mission says so (`crowdFreeze`). |
| `watchers.js` | After a level is built the Observer inside each sentinel is swapped, in place, for the mission's watcher (D14): the Helix security drone built from primitives (a heavier one for the unit that rewinds its damage), a Continuum trooper with a helmet torch, a scavenger watching by lantern (with the closed-circle badge in M7), the Unwritten's rust hoods, the Spire's elites with a lit visor, or M17's red hologram of the player's own look. Cones, eyes and suspicion stay DeckWorld's; a person walks by how far its sentinel moved. M18, M22 and M23 show the drone in their present and past fragments and a scavenger in 2196. |

The settlement's wardrobe (Rocketbox's robe, kurta and head-cloth avatars recoloured in ochre, indigo,
madder and undyed linen) is flagged for a human review: render sheets in the U4 report.

## Authored and generated

**Written by hand**

- The Prologue, all of it. Mission 1 is Rain City: a generated district (theme `rain`) with an
  authored overlay — Kai's door, the anomalies (the toy, the backward clock, tomorrow's camera
  feed), Rook's call, the checkpoint, the station, the Zero Second and the train, the rescue,
  the voice in every speaker, Mira in the crowd, Jun's booth and relay 41-B (quest chain A).
  Missions 2 and 3 are hand-built Helix interiors (`Build.js` `Deck`): security, the dark
  corridor and its drone, the power room and the three cells, Iven's locker, the recordings and
  the officer's code, the conduit hall and the unit, the archive and the drawing, the chamber;
  then the Chronolith's first switch, the cable connected in 2026 and powered in 2049, the
  machine hall crossed in 2196, Iven's maintenance route (quest chain D) and the control room.
  Every bible line of these missions is spoken verbatim.
- For every mission of Acts I–IV and the Finale: its setup (intro), its three beats with their
  goals, the bible's quoted lines, the scenes and choices, the memory fragments, and its mission
  ending (outro); the Mission 13 faction choice; the Mission 10 Echo Step unlock; the ally call in
  Mission 21; the three endings and the post-credit "Version one hundred and eighteen."
- The people: roster, wants and fears, temporal states, dialogue with intents, echoes, barks.
- The open places of every mission (`places/specs/`): every building, terrace, bridge, tree and
  year piece, and the sky, horizon and light of every year.

**Generated**

- Only the seeded scatter inside the authored places (each place's own generator, `rng(key)`: the
  same every time): debris, the order of facade tints, where the grass and flowers fall. Since U3
  the edition runs neither `gen/ZoneGen.js` nor `gen/LevelGen.js` (the Station Zero game and World
  Forge still do); `dress.js` and the `P` palettes are retired.

## The missions

| # | Mission | Act | Place | States | What happens |
| --- | --- | --- | --- | --- | --- |
| 1 | The Last Normal Day | Prologue | Rain City South (`rain_south`, open place) | 2049 (+ 8:13) | Anomalies, Rook's call, checkpoint, the Zero Second, rescue, "Do not build the machine", Mira; chain A |
| 2 | Helix Goes Dark | Prologue | Helix, west wing (`helix`, rooms round the court) | 2049 | Emergency light, drone, three cells, Iven, the trustworthy officer, the rewinding unit, the drawing, the chamber |
| 3 | The First Switch | Prologue | Helix, east wing (`helix`) | 2049 2026 2196 | The switch, cable/power, the parked lift, chain D, the anchor, the fracture |
| 4 | The Man from the Last Day | I | The Ring Hill (`valley_upper`) | THE VILLAGE, BEFORE THE FIRE | Telling-stone, inscription residue, the elder; the access card |
| 5 | The Village That Never Existed | I | The river bend and the gorge (`valley_river`) | THRIVING, ABANDONED, FLOODED | River (past), wall (middle), gate (latest); the buried machine |
| 6 | The Clockmaker's House | I | Old Town and the light-well house (`oldtown`) | 2026 2049 2196 | Repeating arms, the clockmaker, the mechanism; the recording |
| 7 | The Broken Observatory | I | The Ridge (`observatory`) | THE FIRST SKY, 2049, 2196 | Alignment, the dates, Mira's recording |
| 8 | The First Death | I | Helix in VERSION 17 (`helix_v17`) | 2049 (V17), 2026 | Staff records, the corrupted log, containment; VERSION 17 |
| 9 | Nine Minutes to Zero | II | Northbank (`northbank`) | 2049 2026 | Loop (82 s), clocks, the cancelled order, the engineer |
| 10 | Enemies Who Remember | II | The dam (`dam`) | 2049 2026 | Intake log, Sera, the prisoners' choice; Echo Step |
| 11 | The Inverted Hospital | II | Rain City General (`hospital`) | 2049 2026 (+ reversed wards) | REVERSE unlocks: the tutorial, the charred file, the reversing lock; Mira's file |
| 12 | The Man Behind the Glass | II | Helix, north wing (`helix`) | all three | The 2026 corridor, the route, the Witness and the second Chronolith |
| 13 | The Nine-Minute War | II | The delta port (`warport`) | all three | Field orders, three devices in three years, the stabilizer (faction) |
| 14 | Welcome to 2196 | III | Downtown (`drowned`) | all three | The beacon's parts, Sera's safe path, the memorial |
| 15 | The City That Forgot Tomorrow | III | The lock city (`lockcity`) | 2196 2026 2049 | Loop (120 s), the fabricated record, Anja's lock (stabilize / free) |
| 16 | The Museum of Failed Worlds | III | The sinkhole (`sinkhole`) | 2196 2026 2049 | Three memories, comparison, the photograph |
| 17 | The Witness's Archive | III | The array (`array`) | all three | Recording 17 of 117, body lost / pattern persists, "They became the price." |
| 18 | The Fracture | III | The traverse to the coast (`fracture`) | all three | Evacuate three houses, the canyon in the past, Mira's message |
| 19 | The Place Outside Time | IV | The salt mirror (`unwritten`) | all three | Symbols not markers, the bridge in the reflection, Mira |
| 20 | Mira's Memory | IV | One plot, three memories (`memory`) | 2026 2049 2196 | The blue door, the first experiment, "I remember being your sister." |
| 21 | The Last Battle of the Continuum | IV | The Continuum Spire (`spire`) | all three | Standing order, the ally you earned, the Witness |
| 22 | The First Second | IV | The Ring Hill's wedges (`firstsecond`) | all three | The village's chain, evidence over memory, the final chamber |
| 23 | Afterzero | Finale | The road to the ring (`afterzero`) | all three | The Witness holds the route; Mira; Endings A, B, C |
| B | The Water That Remembers | Cases | The gorge (`valley_river`, `c_b`) | 2049 2026 2196 | The mural, three stone gates (optional) |
| C | Two Records, One Disaster | Cases | The press tower (`lockcity`, `c_c`) | 2196 2026 2049 | Two first operators, both true (optional) |

## Tests

- `tests/lastversion.test.mjs` (in `npm test`): the state engine on three years (states per
  room, effects, no laws or law slots, gravity that never changes, anchors, save/restore, the
  v2.0 INVERTED save migration), no INVERTED, gravity or ceiling anywhere in the missions or their
  built levels, no law tokens or MEMORY KEY labels, the two tiers of hints, every REVERSE process
  record valid (aim and origin boxes inside its room, reach, weight, at most 12 per level and 10
  parts), the ten process kinds built and run headlessly, REVERSE never required before Mission
  11, Mission 11's tutorial, file, refusal and lock (its three clues list the order), a lock that
  comes apart last-fitted first and remembers settled bolts, moving colliders that never expire, string conditions, the edition's namespace and build settings, the
  speakers and their distinct voices, the 23 missions in order with their quoted lines, the
  Mission 10/13/23 choices, intents and conditions, and solvability by construction for every
  mission level (every obstacle has a state or the anchor that gets past it, every level is a
  place and any route it carries uses only its room's states, every beat has something that completes it, every place
  can snap back to PRESENT, every prologue condition is set by something), the NPC state model,
  quest chains A and D, echoes. The places (every mission and both cases): every sheet landmark and quarter
  exists (and sector *i* spawns in its quarter), the edition imports neither generator and `dress.js` is gone (a grep
  over every edition file), every mission's default sky is its own (the M22 and M23 composites excepted), the sky stays open (roof cover at most 15%, no wall over 6 m along the bounds but rock,
  an invisible ring at the edge), no generator, Vessel or engineered look, a sky preset, hour,
  fog, sun and era for every year, a unique signature unless `sameAs`, a short side of at least
  120 m (the two linear traverses: 100 × 300 m) and quarters of at least 2,500 m², one layout per place with at least 20 big conditional
  pieces per extra year, nothing modern (lamp, neon, road, Latin text) in an ancient year, every
  traversal challenge naming an answer in its room's years with two hints, the collider, text and
  NPC budgets, known materials and kits and no terminals; and Kai walks the places with the game's
  own physics (`Player.update`, the engine's 0.35 m step from the ground): the stairs, fire
  escape, scissor stair, terraces, ramps, bridges and stepping stones carry him, Mission 18's stone arch
  (2026), lamp-post heads (2049) and tilted floors up to the tower's deck (2196), Mission 19's
  reflection bridge (2026, or in step) and the stair to the fifth door, the Museum's whole spiral, the
  Spire from the kitchen door to the arena and the summit, the First Second's terraces and Afterzero's
  whole road; Mission 5's footbridge holds only in the thriving year, and the wrong year does not carry
  him over Mission 18's chasm or Mission 19's channel. THINK answers in every sector of the Prologue and
  Act I and in Mission 11, and every year of a place gives `main.js` a full theme and a sun.
- `tests/lastversion-perf.mjs` (browser, read-only): what a place costs on an emulated phone
  (915×412 at 2.625, medium quality) at quarter 0 of each mission and year: full-frame and
  scene-pass draw calls and triangles, the static draws split into scenery, sky, horizon and
  DeckWorld's own, and JS time per frame; checks §4.7 (static draws ≤ 70, sky 1, horizon ≤ 4,
  triangles ≤ 300k). `PLACES=m01,m04` by default (any of `m01` … `m23`).
- `tests/lastversion.mjs` (browser bot): the title, NEW GAME into the Prologue, Missions 1–3
  played through (both quest chains) into Act I, then Missions 5, 11 (REVERSE: R does nothing
  before it is taught, the unlock in the records, R and the touch ⟲ button start and release a
  hold, a year switch releases it, the refusal, the file readable only while held, a jammed bolt,
  a settled bolt through a save and a load, the lock opening Ward 32), 13, 14 and 19 and the
  Finale to an ending, real walks through the places (Mission 13's quay to the container canyons,
  Mission 14's viaduct, the Museum's spiral from the rim to the Comparison Hall, Mission 19's
  reflection bridge in 2026 and the water under it in 2049, its wrapping edge, the Finale's road and
  the settlement's bridge), the save namespace. The
  Prologue's routes start at the places' landmarks, and Helix's glass lift carries Kai down into
  the chamber. A survey renders quarter 0 of all 23 missions in every year (61 views): a 16×16 average hash per
  view (logged), at least 18 bits between missions that are not the same place, and a sky in the
  top quarter that is not one flat colour (or is fog). Each mission is surveyed in its own small
  page (384×216 by default), with the render loop stopped before the game begins and the year's
  shaders compiled ahead (`compileAsync`). `LV_ONLY=places` runs the survey alone; `LV_SURVEY_ONLY`
  (mission keys), `LV_SURVEY_W` / `LV_SURVEY_H`, `LV_PLACE_SHOTS` (a folder for the pictures) and
  `LV_SURVEY_HASHES` (a JSON file of every view's hash and sky numbers) narrow, enlarge or keep it. Each mission's quarter-0 spawn is composed to show what the place is: the
  door of 4B on the wet avenue, the dark lobby, the chamber under the oculus, the village lane
  down to the first fire, the river at the weir, the light well from the cellar stair, the dates
  ring against the Great Armillary, and the VERSION 17 atrium seen from its doors. On a loaded
  shared machine Chromium raises its own browser, GPU and renderer processes back to nice −8
  while the Playwright client stays at 19, and the first frame of a place can take minutes;
  holding every process of the test at nice 19 (a watcher that renices the tree) helps.
