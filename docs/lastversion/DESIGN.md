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
| Its own app | `EDITION=lastversion bash android/build-apk.sh` builds "AFTERZERO: Last Version" (`com.afterzero.lastversion`, versionName 2.0.0, `AFTERZERO-LastVersion-v2.0.apk`) into `android/build-lastversion/`, with a preview `index.html` that sets `window.AZ_EDITION='lastversion'`. Each game carries only its own people: the edition the 41 character files of `casting.js` `MANIFEST` (its 37 Rocketbox people and the 4 shared models it uses), Station Zero every model but the edition's 37; the same lists go into each preview as glTF JSON. |
| Everything the edition changes | `game/js/editions/lastversion/`: `index.js` (title, states, labels, looks, speakers, engine options), `Runtime.js` (chapters, missions, objectives, scenes, choices, stability, Echo Step, anchors, the case board, endings), `prologue.js` (Missions 1–3), `act1.js` … `act4.js` and `finale.js` (Acts I–IV, the Finale, the endings; `acts.js` gathers them), `cases.js` (the CASE FILES), `roam.js` (free roam: a trip to a place already reached, beside the story), `Threads.js` and `ledger.js` (threads, quarters and the story's ledgers), `npcs.js` (the people), `Build.js` (hand-built interiors and props), `inversion.js` (REVERSE: input, targeting, charge, the rules, its HUD and sounds), `processes.js` (the things REVERSE can hold, and the mission landmarks they stand at), `casting.js` / `wardrobe.js` / `garments.js` / `crowds.js` / `watchers.js` (who is built from which model, what they wear, the clothes made for them, the crowds, the watchers), `voicelines.js` / `themes.js` / `score.js` / `cinema.js` / `voicefx.js` (every line the edition speaks and its lexicon, the score's written themes, the score and cues, staged moments, the voice's effect chains), `places/` (the open places under a real sky: the builder, the archetypes, the styles and materials, the years and skies, the horizon, the scenery, one spec per place). |
| Hooks in the shared code | `main.js` hands the game to the edition's runtime where the edition is on (`this.edition`), and nowhere else. `RealityEngine` takes a configurable state set. The generators take a few optional fields (`zone.themes`, `zone.names`, `zone.drones`, `zone.overlay`, `deck.mechs`, `story.mechDeck`, beat kinds `scene`, `choice`). Each hook is a no-op for the Station Zero game; `npm test` and the default suites prove it. The v2.1 overhaul's hooks so far: `main.js` settings text, comfort mode reads "Steadier camera, no flashes" when the edition is on (1 line, U1); `main.js` `updateTheme` takes the light from `edition.themeFor(state)` when it returns one (1 line, U2) and the sun's direction from `edition.sunDir()` (U2; since the 1.1.1 merge the sun's shadow frame is texel-snapped, so the hook re-aims that frame when the direction changes: 9 lines, none of which run without an edition). `entities/Player.js` is not changed: since 1.1.1 the engine itself climbs a ledge up to 0.35 m from the ground and follows the ground down a drop as deep, in both games, so the places are built to that rule (stair rises of 0.34 m, ramps in 0.25 m steps, kerbs of 0.15 m) and the edition's own `stepUp` hook is gone. REVERSE's moving colliders are edition-owned entries in `DeckWorld.temps` (`t: Infinity`, removed by the edition), so `DeckWorld.js` is not changed for them. U7 review: a `Sentinel` stands on `def.y` when its def has one (its eye 1.6 m above it) and then sees and catches only on that floor (`onFloor`): Mission 10's troopers on the testing chamber's floor under the yard, Mission 8's island drone on its terrace (12 lines added, 5 changed; Station Zero's sentinels have no `y`, so every one of its checks is the old one). U4 (casting): `world/People.js` takes a person's own `crew.model` first when it is loaded, calls a dresser the edition registers with `setCrewDresser(fn)` for everyone it builds (holograms too), uses `crew.height` when a person has one, and no longer lists the edition's people in `BY_NAME` (8 lines; Station Zero's crew carry no `model`, `height` or dresser); `main.js` filters the character screen's looks by `editionDef.looks` (3 lines), and at boot the edition loads Kai's model first whatever look an older v2.0 save chose and does not preload Station Zero's crew (its people load per chapter: 3 changed lines, each a no-op without `EDITION === 'lastversion'`). DeckWorld is not changed: watchers are swapped inside each sentinel after the level is built. U5 (voice and score): `audio/Voice.js` loads packs per base with progress (`loadVoicePack(base, onProgress, vocab)`), takes the edition's packs from `usePacks(bases, prefetch)` (`ready()`, `loading`), looks a line up across its packs (first hit wins; `get pack()` is the first), lets a line name its recorded voice (`extra.id`) and an effect chain (`extra.fx`: `pa`, `radio`, `recording`, `echo`; the chains are the edition's own, `voicefx.js`, handed over as `voice.effects`, and only the edition routes a line through them), plays through `audio.voiceBus` (`output()`), and, with the edition on only, never reads `speechSynthesis` or `AndroidTTS`, waits up to 2 s for a pack still loading and records a miss in `window.__voiceMiss`; `speak()` returns the line's length. Station Zero's path is the same: one pack, no `extra.id`, no fx, device speech as before, the 64-clip LRU kept. `audio/Synth.js` gains an ambience bus and a voice bus (gain 1: the same sound as straight to the master), mix levels (all 1 unless the edition sets them), `unlock()` (with `visibilitychange` suspend and resume and the iOS audio session), a `composer` hook (null: the built-in loop as before) that never bursts after a stall, and a `silence()` that ducks music, effects and ambience but not the voices and restores each to its own level (it no longer touches the master: the +3 dB and un-mute bugs are gone; only the edition calls it). `audio/voiceKey.js`: an empty vocab splices nothing (2 lines). `ui/Settings.js`: the edition's default mix (1 line, gated). `android/build-apk.sh`: the edition copies `voice/lv/**` only, the preview's 15 MB check runs per pack; since the release check the edition's APK deflates its models (`STORED=(-0 ogg)` in its branch: 52.6 MB with them stored, 45.3 MB deflated, within §10.2's 50 MB), while Station Zero's build stores them as before (`-0 glb -0 ogg`; its APK's entries, methods and CRCs compared before and after: identical). (U5 in all: `Voice.js` 161 code lines added and 45 removed, `Synth.js` 65 and 9, `voiceKey.js` 2, `Settings.js` 1; `npm test`, `tests/smoke.mjs`, `tests/qa.mjs` and `tests/cradle.mjs` show Station Zero unchanged, and its `voice.json` and `voice.ogg` keep their sha256.) |

Its own look: the title reads AFTERZERO / THE LAST VERSION OF EARTH in front of rain, a city's
glow and the black ring; the chapter list is PROLOGUE, ACT I–IV, FINALE, CASES; you are Kai
Varen (the realistic man in shirtsleeves, `real_m`) until you choose otherwise; the HUD names
the years: 2049, 2026, 2196 (at most three pips, only the mission's own years). There is no
law-writing device and no TICK in this edition: the dock says THINK, ECHO STEP and CASE, the
touch SHIFT button is YEAR (coloured by the year it will switch to), `L` and `J` open the CASE
BOARD. From Mission 11 a REVERSE chip sits beside the year card, with a ⟲ button on touch.

## Free roam (the open-world closing pass)

The bible's world is "connected open regions with authored missions rather than one giant undirected map", and the
player asked for an open world. The story keeps its order (twenty-three missions, one after another, each gated on its
own threads); free roam is beside it (`roam.js`, wired in `Runtime.js`).

- **Travel.** Once a mission is done (`<mkey>_done`; the Finale's road once an ending is reached) its place is on the
  case board's TRAVEL list, in story order, with a button for each year opened there; the map's TRAVEL button opens it.
  A year is opened at a place if Kai could stand in it there: Missions 1 and 2 came before the Chronolith (Mission 3), so
  Rain City and Helix's west wing are 2049 only; every later place has all its mission's years (`roamYears`). Each row
  says what is still there: side stories open, fragments found (from the case log, which has kept every fragment read
  since v2.0, or `fr_<id>`). Travel happens in the page behind a fade (`Runtime.go`), waiting behind a card for the
  place's chapter's people if they are not loaded; the arrival card and the objective ("Free roam: OLD TOWN, 2026.",
  what is open, the way back) are shown, never said, so no line is new. A trip can travel on to another place.
- **A trip** (`roamDeck`, one per story mission, kept out of `MISSIONS`): the mission's place as the story left it, with
  its people (their `when`s read the facts the story set), side stories, fragments, REVERSE processes and records. Gone:
  the way on and its gate, the watchers, the cold open, the hook, the moments a load plays again, the mission's frame
  code, its loop, its end, the stability drain (a trip's home year is the year it went to). The story's own threads stand
  as the props they are (`placeThreads` places a thread marked `inert` with `r: 0`, never offered: the appointment book
  still lies on the counter). A side story's threads wait only on its own threads (the story's are done). A node of the
  story's own said on a trip changes nothing (`roamFree`, read by `Runtime.playNode`): a decision is not made twice, a
  moment not played twice; the nodes a side story plays, or that set what a side story waits for, act as in the mission.
  A rule or zone stays only if it sets what a side story waits for, and one that has already happened is marked fired
  at the load; a fragment read before is laid as read.
- **Saves.** A trip saves in the story's own slot, with the story inside it (`campaign.roam.back`: the story's save
  without its facts, case log, timeline and play time, which the trip carries on; `campaign.roam.meta`: how the story's
  save was described). A save taken on a trip loads on the trip (Runtime.resume → start('roam')), and it is described
  as FREE ROAM · the place, under its story's chapter, so CONTINUE on that chapter's card goes back on the trip. BACK
  TO THE STORY (the case board) puts the story back in the page as it was kept, the engine's rooms in their years, with
  the trip's facts but its own (`lv_roam`), its case log and play time (`storyFromRoam`), and a card instead of
  PREVIOUSLY. After an ending the CASE FILES have a FREE ROAM tab (from the title too: the latest save becomes a trip in
  its own slot and loads); BACK then writes the finished campaign's save back as it was (with what the trip found) and
  the title opens the CASE FILES again.
- **What a trip proves** (tests): every story mission has a trip; every place in every opened year has no way on, no
  gate, no watchers and no main thread; a free player on each trip finishes every side story a player can finish in its
  mission and changes nothing outside the side stories, fragments and REVERSE; every place on a trip is walked from where
  the trip arrives, in its opened years, to everything it offers (`tests/lastversion-reach.mjs`, `allRoams`); the saves
  round trip; the bot travels to three places and back, through a save and a reload on the way.

## Places under an open sky

OVERHAUL.md §4. Every mission, from Rain City to Afterzero, and the two cases stand in an open place
with a real sky over it, its own horizon, its own light per year, and the quarters its beats happen
in. Nothing in them comes from ZoneGen, LevelGen, `dress.js` or a Vessel look: since U3 the edition
imports neither generator (a test greps for it), `dress.js` is gone and the `P` palettes with it.

| Piece | What it does |
| --- | --- |
| `places/index.js` | `PLACES` (the registry) and `buildPlace(key, story, sector, rt, { deck })`: a level in the shared format (DeckWorld runs it unchanged) plus `place`, `landmarks` (`{ name: [x, y, z, yaw] }`), `quarters` (`[{ name, area, spawn, threshold }]`), `years`, `crowd`, `sites` and `scenery` (`(root, rt) =>` the mounted place). Sector *i* loads the whole map and activates quarter *i*: its spawn, its beat at a landmark, its fragments and watchers, its exit at the quarter's threshold (D2 step 1). A mission with fewer sectors than the place has quarters maps each sector to its first quarter (`spec.sectors[mkey]`, e.g. Mission 18's `[0, 2, 3]`: the evacuation and the canyon are one sector) and leaves by the threshold of the last quarter it spans. A spec's `variants[mkey]` gives a mission its own quarters or years in a shared place (Helix's wings; the two old cases had their own until U8 made them replays of Missions 5 and 15). Also `themeFor(level, state)` and `sunDir(level, state)`. |
| `places/Place.js` | The builder a spec builds with: colliders (invisible boxes; one that exists only in some years or after some fact is a `ghost`, a DeckWorld conditional whose mesh the edition takes away), visual pieces (`level.vis`: box, turned box, cylinder, cone, gable, hip, dome, torus, plane, disc, ring sector (`fan`), sphere, vault; a material, a tint, the years, a fact condition), vegetation (`level.veg`), texts, landmarks, terrain heights, kept-clear rects, sites, deep water, traversal challenges (each names the years that answer it), interior rooms of a place (`P.room`: a ward that runs backwards, with `spec.outdoorFirst` the outdoor room comes first with every interior cut out of its bounds). `P.E(years, fn)` puts what `fn` builds into those years, `P.W(fact, fn)` behind a fact. `stageBeat` puts today's beats on their landmarks as things of the place (a telling-stone, a ledger on a lectern, a bronze plate, a phone booth, a glass case), never a Station Zero terminal. |
| `places/archetypes.js` | Parametric pieces: ground (with holes), terraces with retaining walls, stairs (rises of 0.34 m, walked up by the engine's 0.35 m step), ramps (stepped colliders under a smooth slope), water (deep, or wadeable at 0.6 m), walls with openings, railings, blocks (floors, facade, roof: flat, gable, hip, mansard; shopfronts, awnings, cornices, rooftop units), towers, roundhouses, longhouses, granaries, tents, canopies, colonnades, arches, bridges (humped), viaducts, cranes, rings of standing stones, square spiral stairs round a core, lattice masts, shipping containers, dish antennas, gantry cranes, signs (letters) and glyph panels (carved, for the ancient years), props (benches, bollards, lamp posts, tram poles, bus shelters, stalls, kiosks, booths, barriers, cars, scooters, planters, crates, barrels, phone booths, ad screens, looms, racks, pots, carts, cairns, fish racks, boats, fire pits, torches, floodlights, site huts, tarps, chillers), the seeded fill and the edges (the city going on, cliffs, hills, water, hedges, meadow; never a tall wall) with the invisible ring. |
| `places/styles.js` | One style per place: its materials, facade tints, roof, at most six vegetation kinds, its record kits and the palette DeckWorld lights its own few pieces with. |
| `places/materials.js` | Every material name a place uses, as data: a shared surface (painted into a canvas at first use, or one of the CC0 scans: asphalt, brick, concrete, pavement, rock, stone, water) and a tint, with tags (`modern`: lamps, neon, roads, kerbs, signs, never in an ancient year). Surfaces are shared by every place (one draw call per surface), tinted by vertex colour; a vertex's years are an attribute, so the vertex shader drops what is not of this year and small props beyond 90 m. Lit facades (brick, curtain glass, Helix panels, townhouses) carry a window mask that comes on with the year's `lit`. |
| `places/years.js` | The sky presets (the zenith, horizon and ground colours, the city glow, the sun, the moon, the stars, two cloud layers, lightning) and what a year adds: the hour, the sun's elevation and bearing (or the Notch's), the fog and its density, the night, the weather, the colour grade, the light probe, the hemisphere and the sun's colour. |
| `places/atlas.js` | The Valley of the Ring: each place's position, and the far features (the Ring Hill and what crowns it in each era, the Ridge and the observatory's glint, the Notch, the city's skylines, the harbour cranes, the sea, cooking smoke) at their true bearings from it. |
| `places/Sky.js` | One inverted sphere (r 420) following the camera, one shader: the preset's gradient, sun, moon, stars, one bright star, two scrolling cloud layers from a tileable noise painted once, the lightning flash, and the features a mission's sky carries, each with an optional condition: Mission 1's black ring-shaped hole in the clouds after the Zero Second (`ringHole`), Mission 11's sky drifting backwards over the rising rain (`reverse`), Mission 15's lock halo (`halo`), Mission 18's storm of times (`storm`: a wall cloud with a ring-shaped eye, bands of other times sweeping round, lightning coloured by the year), Mission 19's unbuilt city hanging upside down in construction lines (`unbuilt`), Mission 21's cloud sea with the lagoon city far below through its gaps (`cloudSea`), Mission 22's sky cut into wedges like a clock face and its eclipsed black sun (`wedges`, `eclipse`), and Afterzero's light that changes along the road (`route`) and its three ending skies (`preset`). Every uniform eases over about 1.2 s on a year switch. One draw call (the halo, the unbuilt city and the cloud sea are a mesh each). |
| `places/Horizon.js` | A band at r 380 painted per year from the atlas (hazed toward the year's horizon colour, lit windows where the year is lit, dark in 2196), and a ground skirt under the scene's fog. Two draw calls. |
| `places/Scenery.js` | Turns `level.vis` into one merged mesh per surface (and per fact condition), with world-projected UVs, vertex tints and the year mask; the vegetation instanced per kind (plane trees, lindens, birches, cypresses, olives, willows, blossom, bare trees, shrubs, grass, barley, reeds, ferns), the other years' instances scaled to nothing. `setEra(state)`, `refresh()` (fact conditions), `stats()`. |
| Surfaces and props (closing pass) | No plain colour in a place: the plain finishes carry wear (`matte` grime, `satin` worn paint, `metal` brushed and scratched, `cloth` weave and folds; near white, so the tint keeps its colour, and tileable), and DeckWorld's own doors and gates in a place wear their surface's picture. Props are what they are: wooden crates, cardboard boxes, aid crates, museum packing crates, washing machines, ridge tents, display cases with their exhibits, booths with counters and lit fascias, a desk on pedestals with a monitor, a console with its screen, shelves with goods; each mission's boxes differ (Mission 7's scavengers keep drums under a tarp, Mission 10's 2026 store bays boxes, Mission 17's 2026 array packing crates). Metal and timber railings are posts and rails you see through. A shop on a ground floor is a room behind its glass (`archetypes.shopRoom`): its floor, a ceiling of light panels, shelves of goods (or a café's counter and tables), the piers between shops; Mission 1's laundromat has an open door, washing machines and a bench, and the shop camera's feed on its back wall. Mission 11's rain in the discontinuity court is sheets of streaks that fall in the west and rise in the east (`rainDown` / `rainUp` scroll with the frame's time: `tickSurfaces`). |
| `places/kits.js`, `places/mount.js` | The kits records, fragments and set pieces wear (and the clockmaker's brass arm); mounting a place after DeckWorld has built it: the scenery, sky and horizon into the level's root, the `ghost` meshes taken away, doors and gates in place materials, deep water that walks Kai back to the last checkpoint, a hazard that is still in a year. |
| `places/specs/<key>.js` | One data spec per place: bounds, edges, years, quarters, which landmark each beat of each mission stands at, fragments, watchers' paths, crowd paths (for U4: `level.crowd`, each with its wardrobe era, the years it walks in, its role, path and size, within §4.7's 24 people with the named cast, or the place's own `people`: Rain City South's checkpoint holds 30; a crowd with `queue` stands in line along its path, facing its head), and `build(P)`. |

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
| 2 | `helix` (west wing) | 140 × 160 m | SECURITY · THE DARK CORRIDOR · POWER · CONDUIT & ARCHIVE · THE CHAMBER | 2049, night storm with lightning; inside, the emergency light a red wash over the storm's grey light through the windows and the lobby's glass roof (readable on a phone: at full strength it had read near black) |
| 3 | `helix` (east wing) | the same | THE CHAMBER · TEMPORAL LAB · THE DIG · MACHINE HALL · CONTROL | 2049 washed dawn with the sun in the Notch; 2026 hazy noon, the campus a frame, the dig, a crane; 2196 misty green dawn, the ruin |
| 4 | `valley_upper` | 200 × 200 m | THE FIRST FIRE · THE WATER STEPS · THE RING | THE VILLAGE golden late afternoon; BEFORE THE FIRE blue pre-dawn, tents, tall grass, meadow slopes across the terraces |
| 5 | `valley_river` (+ gorge) | 200 × 220 m | THE HEAD-STONE · THE RETAINING WALL · THE PRESSURE GATE · THE UPPER GORGE | THRIVING clear midday; ABANDONED grey overcast, roofs fallen; FLOODED low teal sky, water at +4 m, the roofs a route |
| 6 | `oldtown` | 120 × 140 m | SHOP FLOOR & CANAL STREET · THE GALLERIES · THE CLOCK ROOM / ROOF | 2049 autumn evening; 2026 spring morning (the hidden stair stands); 2196 winter, the canal iced, the arm rusted solid |
| 7 | `observatory` | 180 × 180 m | THE LOWER RING · THE INSTRUMENT STAIR · THE OUTER RING | THE FIRST SKY sunrise in the Notch, polished bronze, torches; 2049 blue hour, a bright star, the survey; 2196 golden wind, fallen rings |
| 8 | `helix_v17` (sameAs `helix`) | 140 × 160 m | STAFF RECORDS · THE CORRUPTED LOG · THE LAST TEN MINUTES | VERSION 17: a still grey-violet afternoon, the full ring, the river through the court, the containment cube; 2026: the young garden, the junior tour's marquee |
| 9 | `northbank` | 200 × 200 m | START · CLOCK A — OBSERVATION · CLOCK B — THE ENEMY ROUTE · CLOCK C — THE LOOP TRIGGER · THE CONTROL TOWER | 2049 the loop's windy grey morning over the river terraces, the funicular, the cathedral, the transmitter; 2026 the lighthouse under scaffold, the market's timber loggia |
| 10 | `dam` | 180 × 120 m | THE DETENTION BLOCK · POWER SYSTEMS · THE TESTING CHAMBER · THE YARD | 2049 snow at night, the moon over the gorge full on the face, each cell lit by a caged lamp, a bulkhead over each cell's mouth; 2026 the dam under construction at dusk, store bays, a scaffold stair |
| 11 | `hospital` | 160 × 140 m | TRIAGE & THE QUIET COLONNADE · RECORDS · WARD 32 | the pavilions and the open colonnade, the records hall, the reversed annex and the twin ward (interior rooms; the processes at their landmarks); 2026 the admission afternoon |
| 12 | `helix` (north wing) | 140 × 160 m | THE CHASE — 2049 · THE CORRIDOR THAT WAS — 2026 · THE RUIN — 2196 · THE SECOND CHAMBER | wind at sunset, violet work light in 2026, green-gold dusk in the ruin; the sunk terraces down to the second ring |
| 13 | `warport` | 240 × 200 m | THE BATTLEFIELD · THE THREE DEVICES · THE STABILIZER | 2049 battle smoke over the delta port, the trench, the container canyons; 2026 the working port and the rail yard; 2196 a meadow over the port, the channel a reed marsh |
| 14 | `drowned` | 220 × 220 m | THE OVERGROWN TOWERS · THE TRANSIT LINE · THE MEMORIAL | 2196 the lagoon over the avenues, the towers' curtain walls broken and grown over (terraces of hanging gardens with ivy along their edges and vines falling from them, sheets of creeper, roots over the podiums, trees on the broken crowns), the transit viaduct grassed; 2049 and 2026 the dry downtown, shops lit in the podiums |
| 15 | `lockcity` (bowl helper) | 220 × 220 m | THE STATION · THE SCHOOL & MARKET · THE ARCHIVE / THE LOCK | 2196 houses on the stadium's tiers under the lock halo, and spilt out of the north gate along the outer wall's ribbed and painted panels (pennants, creepers, lanterns, stalls); 2049 the relief camp's ridge tents and aid crates, an aid tent at the gate; 2026 floodlit match night, the club's banners down the wall, ticket kiosks |
| 16 | `sinkhole` (spiral helper) | 150 × 150 m | THE RIM & THE FIRST MEMORY · THE SPIRAL · THE COMPARISON HALL · THE PHOTOGRAPH | 2196 the museum at dusk, lanterns down the spiral, the lens hall; 2049 the flooded quarry lake and the Helix barge; 2026 the working quarry at dusty noon |
| 17 | `array` | 260 × 260 m | THE SHIFTING CORRIDOR · THE RECORDINGS · THE EARLIER ROOMS · THE ORIGINAL EXPERIMENT | 2049 frost under the Milky Way, red aircraft lights; 2026 heat haze, the array being built; 2196 sand dawn, dishes tilted; the drum racks stand differently each year |
| 18 | `fracture` (linear) | 120 × 420 m | THE ANCHOR SETTLEMENT · THE CANYON · THE FLOODED HIGHWAY · THE COLLAPSING SKYSCRAPER | the storm of times in every year; 2196 the scrap village on the interchange, the chasm, the buckled road, the tilted floors up to the tower; 2026 the river canyon and its stone arch; 2049 the flood, the lamp-post heads |
| 19 | `unwritten` (mirror helper) | 220 × 220 m | THE LOOPING ROAD · THE BRIDGE IN THE REFLECTION · THE DOOR THAT IS EVERYWHERE | high-key white-violet, rose or mint per year, no sun disc; the unbuilt city upside down in the sky; floating fragments and their reflections; edges that wrap |
| 20 | `memory` | 130 × 130 m | THE HOUSE · THE EXPERIMENT · THE WORLD WITHOUT KAI | 2026 the terrace and its gardens, a golden overexposed evening; the first experiment, Chamber One as the child in the chair remembers it round the whole plot (white panelled walls, a ceiling of light, a dark grid floor, the street only pencil lines, the remembered things in colour); adult Mira's seaside garden in the morning |
| 21 | `spire` | 160 × 160 m | THE ALLY / ARRIVAL · THE COMMAND STRUCTURE · THE ARENA · THE WITNESS | 2049 hard noon above the cloud sea; 2026 the tower's roof at the cloud line; 2196 the frosted ruin at a blue dusk |
| 22 | `firstsecond` (wedges helper; sameAs M1, M4, M6, M11, M3) | 160 × 160 m | THE VILLAGE'S CHAIN · THE CLOCKMAKER'S PATTERN & THE HOSPITAL'S LOCK · THE FINAL CHAMBER | the twin chamber (2026 at 16:02, 2049 at 05:40) under an eclipsed sun; five wedges of earlier places in their own light, the sky's wedges running into each other with no seam, each year lighting its own two; the chamber a building site under a tower crane in 2026, a beam from the ring into the eclipse in 2049, broken open and grown through by lindens in 2196 |
| 23 | `afterzero` (linear; sameAs M1, M4, M2, M14) | 100 × 360 m | THE OPENING STREETS · THE SETTLEMENT, AGAIN · THE HELIX LAB · 2196 · THE ORIGINAL CHRONOLITH | night rain over the quoted South Square, dusk over the settlement, pre-dawn over Helix, the first sunrise in the Notch at the ring; the three ending skies |
| B | `valley_river` (the gorge, variant `c_b`) | as Mission 5 | THE DRY CHANNEL · THE GATES | Mission 5's years |
| C | `lockcity` (the press tower, variant `c_c`) | as Mission 15 | THE FIRST ARCHIVE · THE SECOND ARCHIVE | Mission 15's years |

Documented deviations: the observatory's summit stands at 27.5 m, not the sheet's 30 m, because the
shared engine respawns anyone whose centre rises above y 30 (`main.js`), and a jump on the summit
must stay under it; for the same reason the Spire's walkable terraces stop at 24 m (its mast and the
citadel's ring rise above), and Mission 18's tower deck is at 26 m. Mission 20's plot is 130 m square
(the sheet's 90 m plot in the middle, the white memory boundary round it), so the place keeps §4.7's
short side. The two traverses (Missions 18 and 23) are `linear`: exempt from the 120 m short side,
held to §4.7's 100-120 × 360-420 m instead. The shared engine's vertical range (main.js respawns below
y -14 and above y 30) also compresses two drops: the dam stands 36 m from its turbine hall (-12 m) to
its crest (24 m), not the sheet's 60 m, and the Mission 16 sinkhole is 38 m deep (its rim at 26 m, its
floor at -12 m), not 45 m.

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

- The quiet colonnade, the annex behind the burnt door and the twin of Ward 32 (THE REVERSED WARD)
  run backwards on their own (reversed wards: a shimmer at the door, the intercom's "Temporal
  discontinuity." played backwards inside).
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

Every person looks like who they are: role, gender, age, era. Forty-seven Microsoft Rocketbox conversions
(MIT; `tools/rocketbox-to-glb.mjs --edition lastversion`, credited in `game/assets/characters/CREDITS.md`)
join the four Station Zero models the edition uses (Xbot, Kai's SHIRTSLEEVES look, two doctors' coats):
twenty-three named people at 1024 px (Mira, who is also Dr. Lin, young Kai, the Child, Rook, Niko, Niko as an old man,
Jun, Tala, Pryce, Dale, the Elder, Ezra, Rhea, Brask, Odile, the Florist, the Warden, Sera, Mara, Iven, the
Gardener, the Helix receptionist, the glazier), two only ever seen as light at 512 px (Tomas, Officer Haig) and
twenty-two crowd bodies at 512 px. No one but Kai wears a Station Zero character's face
(the U4 review took Juno's, Varga's, Kade's, Ren's FIELD JACKET and the airline captain out of the
edition). The converter learnt the children's and soldiers' prefixes (`cf001_`, `sm024_`), the
`_color_acu` / `_color_blue` maps, the children's Bip02 rig (renamed Bip01, so they animate and have
eyes), parts left out (`RB_DROP`: the pistols), a painted-out sleeve flag on the soldiers, and
`TRANSPLANT`: a piece of a map covered with plain cloth from the same map (the 38 on the boys' jersey), and
`EDITS`, one output's own maps changed before they are shrunk (`age`: the Elder's hair silvered on her head map and
hair cards, lines at the brow, eyes, mouth and neck drawn into her colour and normal maps, her skin and lips paler, a
few age spots; its bun is only the map's own hair islands, found off the face's piece by a flood fill, since the box
round them reaches the bottom of the neck's and chest's piece and silvered a corner of her breastbone; castfin round 1:
a tan whorl painted on the top of her scalp, where the map shows skin through the hair, silvered too and toned to the
silver round it (the tan diamond seen on the back of her head in the missions was not this, nor in any map: it was the
focus marker's glow through her head, below); `age_m`: the same for Niko as an old man on
Male_Adult_09's map, his black hair and tail grey to near-white, the lines of a man of seventy, a short grey beard
thinning to stubble on the cheeks; `tomas`: Tomas's hair sandy and freckles on the boy's
body young Kai has too, kept in his model though only his echo is ever seen, which shows no maps).

| Module | What it does |
| --- | --- |
| `npcs.js` | Every entry carries `model`, `variant`, `height`, `vid` (its recorded voice, U5) and `walk`. The checkpoint officer is Officer Pryce on `rb_security_f` (Helix black), not a doctor; Dr. Lin and adult Mira share one mesh in two wardrobes (her face is the fair clue); the Witness wears Kai's; Ward 32 holds a silent, flickering figure of Mira in a gown, and Nurse Odile speaks for the ward. Pronouns match the body and never change. `AMBIENT` gives each region its crowd roles' names and voice pools. |
| `casting.js` | `LV_MODELS` (registered into Actors' table when the runtime is built, so nothing loads at boot but Kai), `SHARED_MODELS`, `MANIFEST` (the APK's and preview's character files), `CHAPTER_CAST` (the models each chapter's people, crowds and watchers use; a unit test checks it against every level). A chapter's models load behind its card, one at a time with a frame between (`loadCast`); the title starts loading the chapter most likely to be played next, and a chapter's last mission the next chapter's. Actors has no release, so models stay loaded for the session. `lodUpdate` keeps the 16 nearest people within 40 m posing every frame, the rest within 70 m four times a second, anyone farther still. |
| `wardrobe.js` | `WARDROBE[model][variant]`: parts hidden (the stethoscope), colour rules per material map (a UV band, a lightness window, a hue and saturation selection; a new hue, saturation and lightness), hair tint, props (umbrella, lantern, staff, trowel, clipboard, loupe, lanyard, beret, visor, badge, a raincoat's hood fitted to its wearer's head, a trooper's helmet and plate carrier for Sera's disguise, the glazier's suction lifter, built from primitives once), an old back's bend (`stoop`, after every pose). Coats are recolours, not shells: Mira's yellow rain jacket and the toy boy's red one dye the tunic or jersey and its sleeves to the wrist. A recolour runs once per model, variant and map on the GPU (one quad into a mipmapped render target) and is cached; the copy is freed with the people who wore it. A render target has no image behind it, so a lost WebGL context (an app switch, memory pressure) would leave every dyed map black (castfix round 3: Niko's arms and neckline, the glazier's whole head): each recolour in use is drawn again from its source map when the context comes back (`redye`, on `webglcontextrestored`). Skin is protected by the person's own skin colour, sampled from their face, and by the corners of the body map that hold their hands (found once per model). Rain City's crowds are 15% darker (wet) and carry umbrellas. A rule may take only the body's feet (`feet`, castfin round 1): a mask of the body map drawn once per model from its own mesh (`feetOf`: the triangles whose corners are all on a foot's or a toe's bone, or low on a calf, the lowest eighth of the body as it is bound, 512 px), since Rocketbox puts the shoes somewhere else on every map; every variant with a tunic's skirt (the settlement's people, named and in the crowds: 212 variants) ends with `LEATHER`, which dyes them dark brown leather, the ankles over them as leg wraps (they wore Rocketbox's trainers and shoes under the hem, white soles, laces and a tunic's dye on them; a woman's raised heel keeps its shape, dark). The Helix technicians on the paramedic's body (`helix tech`) have the PARAMEDIC patch across the back and the star-of-life badges dyed out as slate (the paramedics keep theirs; a rule's lightness window reaches below 0, so the letters' black is taken too: at the window's soft edge at 0 a quarter of it stayed). A settlement child's tunic is one colour, its top (the boy's body's jersey, dyed) and its skirt (castfin round 2, `kidOutfit`): the outfit's tunic dye where that reads as cloth on the body's dark skin (an HSL lightness of 0.43 or more), else the outfit's first light dye, which changes places with it (the dark dye becomes the stripe's or the sash's; a belt of the tunic's new colour becomes the dark), else oat (a girl in walnut to the waist read bare-chested in the first fire's evening light; castfin round 1's light shirt over a dark skirt read as a T-shirt and a skirt, not a tunic). |
| `garments.js` | Clothes made for a body (the settlement's people, three thousand years ago, and the few today who need a coat or an apron): a variant's `garb` lists the pieces (a tunic's `skirt` and `bodice`, a `mantle`, a `cloak`, a `sash`, a `belt`, an `apron`, with a `bib` up the chest a work apron; a cloak `fit` to the body and hemmed at the knee is a lab coat, or a boy's school coat). Each is built once per model and outfit as rings round the body as it stands (castfix round 3: a fresh actor's first idle frames, the arms down at 71.5 degrees, where the bind pose has them out at 43), each ring following the body direction by direction (the convex hull of a cut through it at that height, as cloth stretched round it lies), a little out from it and falling free below the knee; each vertex is skinned to the body's skeleton by weight transfer (it takes the bone weights of the nearest body vertices under it, the skirt's front and back from the legs, its top from the hips) and taken back to the bind pose through that very skinning, so worn it comes back where it was cut and moves with the body. (Cut round the bind pose, a cloak stood off the shoulders and the back like a shell and the arms came down through a cape.) A long cloak is a cape gathered round the base of the neck, lying on the shoulders and over the tops of the arms, over the cloak's length, which is open down the front and lets the arms out at its sides; a mantle is cut the same way; the top ring of both is gathered round the neck alone. A bib lies on the chest below the shoulders and spans only its hollows down to the waist, held by a neck strap over the lapels and round the back of the neck (not round a ponytail modelled in the head's own mesh). A coat fitted to the body (the lab coats, Tomas's coat) is still cut round the bind pose: round the hanging arms its straight sides boxed them in. A tunic's skirt (castfin round 1) is cut round the four extents of the hips and legs at each height and round their own cut, direction by direction, over the whole height between a ring and its neighbours (cut round the standing body by the four extents alone, the ellipse passed inside a child's knees, which stand together, and the grey shorts showed through in shards); and the body under a skirt is drawn without the legs it covers (`covered`: one index of the body's own buffers per model and outfit, every triangle wholly on the thighs, the calves and the feet's bones between the skirt's top and 2 cm above its hem, 6 cm above a boy's knee-length hem, and on the hips below the waist, left out), since no cut keeps a stride's knee inside a skirt skinned to the legs it hangs over: what is drawn of the legs is the ankle and the foot stepping out from under the hem (and a boy's shins). A stripe along a hem has no ring of the band inside it (where the rings near a short skirt's hem are closer together than the stripe is deep, the band folded back over it in grey teeth) and its top ring lies on the line from the ring above to the hem. A cloak's length or an apron over a skirt (castfin round 2) moves as the skirt under it does: from 10 cm under the skirt's top down, each of its points takes the skin the skirt has straight in under it (the four corners of the skirt's grid round the same direction from the hips' axis, weighed as the point lies between them), down a cloak from a little lower on the skirt the nearer the cloak's hem (its hem as the skirt's hem, which a heel kicks out furthest); the skirt has a ring a centimetre under the piece's hem, and none of its triangles under the piece are drawn, short of a cloak's opening by 0.35 rad and of an apron's sides by 0.3, so what is left of a stride's push has nothing to push through; a cloak's length clears the skirt's pleats and its own folds, an apron stands 2.2 cm out from the skirt's folds. (Skinned from the body further out than the skirt, a cloak swung less than the legs and an apron hung from the hips at the knee: walking, the tunic came through the backs of cloaks and the fronts of aprons in patches.) The pieces are merged into one draw call per person, their dyes vertex colours over one woven map. Shapes are cached without their dyes (25-140 ms a model and outfit in the browser checks, the first outfit of a model the most: its standing pose is taken then), a new dye costs under a millisecond. `hairdo` moves one model's hair cards onto another's head (the settlement's girls wear its women's hair on the boy's body). `hairMass` (castfix round 2) gives a head whose hair is only painted a head of hair of its own: a shell from the crown to a hairline (the brow, over the ears, the nape), each direction a little out from the head's own surface, thickest at the crown, its edge cut into locks by a strand map; on an echo it is a brighter, denser light than the face under it, so the hair's shape shows. Holograms are dressed the same way. |
| `crowds.js` | `castLevel(level, deck)`: the named people in this mission's wardrobe (`story.cast` = copies of `CAST`, indices unchanged, then the level's own), the hand-placed passers-by by who they are (M1's toy child in a red raincoat, the trapped pair, M3's technicians, the settlement's craftswoman, storyteller, potter, mother, water keeper, astronomer and girls), and the crowds along `level.crowd` by era and role (present 2026/2049, ancient, 2196): no named face is ever in a crowd (`EXCEPTIONS` is empty: the settlement has six faces of its own and two old men, the receptionist and Officer Haig have their own), nor the face of someone placed by hand in the same place, one face walks at most four times a year in a place's crowds and each time in other clothes (`CAP`; troopers, prisoners and holograms aside), crowd faces never cross eras (but `rb_child_m2`), the Place Outside Time's echoes are people Kai has met in their own faces and names (`MET`), heights vary within 4% and paces within 8%, and a place's people stay within its budget (24, or its `people`). Each mission dresses its crowds from its own palette (`PALETTE`: the settlement's fire, water, sky, festival and ash dyes; today's rain, autumn, summer, ward, midday, winter, memory, grey and bright for the casual roles), so no two missions' crowds wear the same clothes; a role is cast on bodies dressed for it and named for it (`ROLE_NAMES`, unless the region names it: paramedics are the paramedic's body, researchers wear lab coats, technicians Helix's slate work clothes, never a T-shirt), and the old (`OLD`) walk slower and speak with old voices. Crowds walk their paths, bark from their region's pool and stop with the clocks where a mission says so (`crowdFreeze`). |
| `watchers.js` | After a level is built the Observer inside each sentinel is swapped, in place, for the mission's watcher (D14): the Helix security drone built from primitives (a heavier one for the unit that rewinds its damage), a Continuum trooper with a helmet torch, a scavenger watching by lantern (with the closed-circle badge in M7), the Unwritten's rust hoods, the Spire's elites with a lit visor, or M17's red hologram of the player's own look. Cones, eyes and suspicion stay DeckWorld's; a person walks by how far its sentinel moved. M18, M22 and M23 show the drone in their present and past fragments and a scavenger in 2196. |

The settlement's people are bare-headed bodies of their own (two men, two women, a grey-bearded old man and a bald
old sage; the boy's body for its children, with a woman's hair for its girls), dressed by `garments.js` in undyed
and earth-dyed wool and linen (tunics to the shin, mantles, cloaks, sashes, belts) and dyed per mission. The robe,
kurta, hijab and abaya avatars that read as present-day Gulf and Islamic dress are gone from the edition (the closing
pass; Rocketbox has nothing that reads as ancient, so the clothes are made, not chosen). Tala and the Elder are
reconverted from faces with their own hair, and Niko is on Adults/Male_Adult_09, his own black hair long and tied
back (Male_Adult_15, the kurta-and-taqiyah avatar whose woven cap the wardrobe only dyed dark, is gone: it read as a
prayer cap at talk distance). As the old man of Mission 7's cold open he is his own model of the same face
(`rb_niko_old`, `EDITS` `age_m`): his hair and tail grey to near-white, a short grey beard, the brow and eyes lined, his
skin paler, a staff (greying the young man's hair alone left a man of thirty with grey hair). The Elder is old in her face as well
as her bearing: her maps are aged at conversion (`EDITS` `age`), her hair cards stay silver in any light (her
wardrobe's rule, skin protection off: in Mission 4's dusk the crown samples a neutral grey, about RGB 100-145, where it
was near black), her back is bent after every pose (`stoop`), she walks at 0.8 with her staff, and her echoes in
Missions 19 and 22 carry the staff of their light (`holoProps`) and her pale hair cards. Her robe is dyed as cloth
everywhere but her hands (her aged face's paler skin, which the dye's skin guard is sampled from, is near the
cardigan's brown, and left it in squares). Seen from behind or above in Mission 4 she had a hard-edged tan patch on her
crown and a dark one on the hump of her cloak: neither was in her maps (the round-1 check saw the same patch with her
old maps and her re-edited ones; castfin round 2 took her hair cards, her head, the shadows and the marker's glow away in
turn, and only the glow made a difference). It was the focus marker
(`world/Fx.js`, shared with Station Zero: a pulsing ring and a soft white glow, a sprite, at whatever Kai can use),
which marks a person at head height, 1.5 m over their feet: its glow, through their head, whitened what lay behind its
plane and left what came forward of it unwashed, so any marked person had the edge of it on them, plainest on her white
hair. For a person (`person: true`, DeckWorld's people and Station Zero's Juno) the glow now sits 0.5 m behind them,
away from the camera, a halo round them; the ring stays round the point, and anything else is marked as before.

People who come back are dressed as no crowd is, anywhere in the campaign or the cases (a unit test walks every
level): the glazier Kai holds the frame for on Helix's roof (Mission 12), who is at the Spire's glass (Mission 21)
and on the road (Mission 23), has a face of her own (`rb_glazier`, Professions/Business_Female_04) in the one look
each time (copper hair, a petrol work jacket over a grey marl work top, charcoal trousers, a leather bib apron and tool
belt, a suction lifter), where she wore the technicians' paramedic body and slate (castfin round 1: the suit's jacket
hung open to her breastbone over bare skin and a pendant; the neckline is dyed as a crew-necked top, on her head map
and her body map); chosen as Mission 21's ally she holds the arena's gap and is no longer at the glider deck where Kai met her (castfix round 3; Rook, if he holds it, is no longer in the director's office, which then says its chair is empty: castfin round 1); Mission 14's ticket keeper, on the Finale's road
too, wears the 41's faded navy and the amber strap of his ticket bag, not the 'faded' khaki 2196's traders walk in.
Tomas Vale, thirteen, is on a child's body (Children/Male_Child_01, the body young Kai has) at 1.52 m, under a wool
coat to the knee (he was Adults/Male_Adult_01 scaled to 1.42 m, a small man). He is only ever an echo (Mission 15 and
the c_c and c_train replays), and an echo is one light with no maps, so the sandy hair and freckles in his model and
his brick school jersey never show, and the boy's hair is only painted: as light he was young Kai's bald head again.
His echo wears a head of hair of its own (`hairMass`): a shaggy mop, a ragged fringe to the brows and over the ears;
young Kai's echoes (Missions 11, 17, 20) wear a short crop, the brow clear (`holoOnly`: solid, in Mission 20's cold
open, his painted brown hair is his own). Mop and crop, the coat and 10 cm tell the two boys apart in their light.

Echoes show their nearest surface only (castfix round 2, `wardrobe.js holoDepth`): each skinned part of an echo is
first drawn into the depth buffer alone, after everything solid, then in its light where it is nearest, so the inside
of a mouth (an open grin), the backs of the eyes (a hollow face), the far side of the head and the body through its
clothes no longer show through. Hair cards and a hair mass are left out of the depth pass (their empty texels would
hide the face) and drawn over the head; an echo's surface is denser (0.72, from world/Actors.js's 0.55, which was seen
through two or three of its own layers), through its flicker too. Shared code is untouched.

### Voice and score (v2.1, U5; OVERHAUL.md §8)

Every line the edition says is heard from recorded voices, in the claude.ai preview and the APK alike;
nothing ever goes to `speechSynthesis` or AndroidTTS. The music is the edition's own: written themes (`themes.js`),
played live.

| Module | What it does |
| --- | --- |
| `voicelines.js` | One source of truth: `spokenLines()` walks every speaking path (the missions' data: intros, outros, cold opens, hooks, rules, scenes and their `_no` refusals, choices and the label Kai says when he picks one, beats, tasks, processes, thoughts, fragments, the lines of scripted moments kept as data (`spoken`), case-log lines; every built level: the people's lines, conversations, barks in the voice each was cast with, echoes, records, fragments, sockets, challenge thoughts; the tables: DIALOGUE, the people's barks and echoes, HINTS, the runtime's `LINES`, REVERSE's lines and rules; the cards and the ending sequence) into `{ who, text, extra: { id, fx, cue }, group, path }`. A CREW line names its recorded voice (`extra.id`: the person's `vid`, or the crowd voice crowds.js gave them). `voiceOf()`, the groups, `chapterCardLines`, `missionCardLines`, `choiceLine`, `endingLines`, `POSTCREDIT`, and the pronunciation lexicon (years, `h:mm`, dates, Act I–IV, Jun → Joon, Dr., 41-B, ordinals, kilometres, percent, every other number in words: the recording says it, the subtitle keeps the digits; since the closing pass a -teen number carries its stress on the -teen, `seven-teen`, which the voice model otherwise reads SEV-en-teen, close to seventy, and two names it reads wrong are spelled as said: Rhea → Reeya, Odile → Oh-deel). No line is a template: what depends on the year is authored per year (`LINES.task_PAST` …), the default echo is one authored line. `index.js` `allLines()` is a wrapper over it. |
| packs | `game/assets/voice/lv/<group>/voice.{json,ogg}`, groups `common` (the tables, the cards, every piece two groups share), `prologue`, `act1` … `act4`, `finale`, `cases` (empty since U8: every case file replays a story in its own mission's voice, `voiceGroup`, so it loads that mission's pack too). Whole sentences, nothing spliced (an empty vocab). The edition loads `common` and its chapter (`Runtime.voicePack`), prefetches the next chapter's in a chapter's last mission and lets the previous go. Station Zero's `assets/voice/voice.*` is not touched. |
| `themes.js` | The score's written music (closing pass; the bible §6): every cue the bible names written out as notes, each a melody, its harmony bar by bar (a voiced chord, its bass first) and a form of sections: the AFTERZERO Main Theme (78 BPM; the title, the CASE FILES), Kai: The Need to Fix It (92; the Prologue), The Past (82, chords built of fourths; Act I), Nine-Minute War (118, 4/4 against 7/8 with a gap and a reversed impact; Act II), 2196: Beautiful Catastrophe (70, lydian, the brass carrying the motif augmented; Act III), The Unwritten Second (48, fragments and silence; Act IV), Afterzero: Final Choice (62, the Main Theme reduced, then blooming; the Finale), and the characters' themes: Mira (Missions 11 and 20) and the Witness (Kai's motif slower and lower; Missions 12, 17 and 21). Every theme states the MOTIF, the bible's three notes (up a fourth, up a fourth, unresolved), each in its own way; Mission 8 hears Kai's theme again at Helix; Mission 16's museum plays the other themes' first phrases as exhibits; Ending A's cadence (IV, V, I in A major) is the only full major cadence in the game. Nothing in it is drawn at random. |
| `score.js` | The composer behind Synth's `composer` hook: it plays the mission's theme (`missionTheme`) note for note, round its form, in the mission's region (`MISSION_REGION`: tempo, key, the instrument that carries the tune in each year and what plays under it, by role: harmony, bass, figures from the chord, texture), so a place keeps its tune in every year on other instruments (Rain City: piano in 2049, plucked in 2026, strings in 2196), crossfading over 1.5 s when the year changes (the Loop City adds a layer per reset, the war drops a beat every nine bars, the locked city repeats its theme's first four bars until tomorrow is let in, a held REVERSE reverses the envelopes); the chapter's card plays its act's theme on the instrument it is known by, a mission's card the first bar of its own, the endings their own (`quotes` lists what each cue quoted, `played` the notes with their times); the cues (`title`, `chapter`, `card`, `reveal`, `consequence`, `cliff` (cut on the fade), `zero`, `fracture`, `pin`, `echoStep`, `reverse`, `loopReset`, `pa`, `ending:A/B/C`, `postcredit`; `heard` lists every cue played); the per-year beds of each region on the ambience bus (rain, traffic, walla from the crowd's own barks far off, water, wind, hum, fire, birds, drips, sirens; a mission's own `beds` win, a rainy year adds the rain); the mix rows (Dialogue, Music, Effects, Ambience, Sound captions: bracketed captions for the sounds that carry a clue, Mission 11's chime tone by tone); TAP FOR SOUND. |
| `voicefx.js` | What a line sounds like through, given to `Voice` as `voice.effects`: `pa` (band-limited, a presence peak, a slapback, a reverb send), `radio` (narrower, driven, a band-noise bed at −38 dB), `recording` (dull, ±0.3% wow, a crackle bed), `echo` (low-passed, 3% slower, a long delay and a large room). Each chain is built once and ends in the voice's output on the voice bus. |
| `cinema.js` | `play({ shots, lines, cue, letterbox }, then)`: shots through the existing `Player.cinema` hook (`'default'` stages the spawn: wide behind it easing in, then over the shoulder), letterbox bars, the lines through `hud.say`. A deliberate input skips the line being said and the shot it is in, and only that: a tap on the view, a click, Space, E, Enter or the SKIP button (a held key's repeats do not; movement keys, the touch stick's zone and the dock never do). One tap never ends a whole moment, an opening or a mission's spoken card (the closing pass: SKIP once ended the whole opening, so a player who tapped it to pass one line never heard the card); a moment with no line left and no shot after this one ends. Kai is held meanwhile: the input's poll reads no movement or jump (keys, stick, jump button), the actions that act in the world (use, the year, echo-step, the anchor, THINK, gear) are dropped and REVERSE does not start; pause, the map, the case board and saves pass. Staged with it: the cold opens, the cards, the hooks and outros, the endings, PREVIOUSLY, a thread's `cinema`, and the Prologue's Zero Second, the voice in every speaker and Mission 3's fracture. |
| `Runtime.js` | The first tap (capture listeners for `pointerup`, `touchend`, `mousedown`, `keydown`, `click`) wakes the sound (`Synth.unlock`), applies the player's volume and SOUND OFF (the title theme obeys them) and starts the title theme; TAP FOR SOUND shows only if a tap could not. A mission opens on the chapter's card when a chapter begins (its name and the bible's question, said by the narrator, cue `chapter`), then the mission's card ("Mission four. The Man from the Last Day." and its logline, cue `card`; LOADING VOICES nn% while its packs come), then the cold open: the mission's `coldOpen` (U6–U8) or today's intro, staged. Kai says the label of every choice; a choice with consequences plays its stinger. The station's speakers are the `PA` speaker with its two-tone chime; the voice in every speaker and the PA go through the `pa` chain, records through `recording`, Rook's calls in the Prologue through `radio`, echoes through `echo`. Outros are a character line under the `cliff` cue, cut on the fade. The ending: a flash, a second of silence (no crowd line in passing over it), the ending's music, the bible's text, what the ending adds, Kai's quote (C through the echo), the epilogue (`acts.js` `EPILOGUE`: a line per consequence set), four ticks, the VOICE "Version one hundred and eighteen." through the PA. Evidence pinned to the case board rings a two-note bell with a toast; the case board's ▶ reads the question (narrator) and Kai's log lines. |

Tools: `VOICE_WORK=<dir> bash tools/voice-lv.sh <group>` records one chapter group (or several, or `all`;
`check` renders nothing and names every stale pack): it runs `node tools/voice-pack.mjs <dir>/lv-script --edition
lastversion`, which writes `<group>/script.json` and `groups.json` (projected sizes; it fails over 12 MB a group or
22 MB in all, or on a CREW line without a voice), then `tools/voice-pack.py` per group (blend specs `'a*w+b*w'`,
the new VOICES of §8.4, an item's Opus bitrate: 16 kbps for speech, 12 for barks and thoughts; only what the cache
lacks is rendered; since the closing pass a recording is decoded back after Opus, as a browser decodes it, and levelled
lower and encoded again while it peaks above -0.5 dBFS, and the voices raised in pitch by resampling (the Child,
young Kai, the crowds' children) are slowed by the same factor, so they no longer speak 25-40% faster than the adults
round them), then `tools/voice-pack.py --check` on every pack (byte for byte what its script would give).
`tools/voice-ear.py` is a machine's ear over the packs: each clip cut from its pack, decoded as a browser decodes it
and heard back by Whisper (small.en, through sherpa-onnx), then judged (every number and name it should say heard,
by sound for a name, most of its other words, its decoded peak, its pace and gaps), on a sample across every pack
(numbers and names first), `--grep` for the clips that say a word, `--peaks` for every clip's decoded peak, or
`--rescore` to judge an earlier run again; it writes `ear.json` and a playable `ear.html` for a person.
`tools/score-render.mjs` renders the score offline (an OfflineAudioContext running the game's own Synth and Score
in headless Chromium) to WAV, with a page of players: each act's theme, a place in its three years, the character
themes and the cues, each measured (peak, loudness, silence, and whether the tune is heard: at each note, its own
pitch against the eleven semitones round it); it fails on a render that is silent, clips or buries its tune.
`tools/voice-audition.py` writes the audition page (new clips, playable, with what Kokoro said, its phonemes,
checks of each recording and, where pocketsphinx is installed, what a speech recogniser hears in it) to the
scratchpad before a pack is committed. The same person shares a base voice:
Kai, the Witness (and the VOICE, recorded as him) and young Kai on `am_eric`; Mira, Dr. Lin and the
Child on `af_river`. Every tier-2 person and each crowd voice (by sex and age) has a voice of its own.

### Threads and ledgers (v2.1, U6–U8; OVERHAUL.md §3.3, §9)

A rewritten mission is one map with soft quarters, not a chain of sectors behind gates. Each quarter holds
main threads (the story's way through) and side stories; the objective on the HUD is the first main thread not
yet done, with its *because* line under it, and THINK reads that thread's three hint tiers (a nudge, the place,
the answer). All 23 missions are written this way (the Prologue in U6, Acts I and II in U7, Acts III and IV and the
Finale in U8); the shim that made each legacy beat one thread in quarter *i* is still in `Threads.js`, but since U8
no mission or case uses it (chains B and C are replays of Missions 5 and 15).

| Module | What it does |
| --- | --- |
| `Threads.js` | The fifteen kinds (`go`, `talk`, `clue`, `residue`, `deduce`, `scene`, `choice`, `tasks`, `stealth`, `chase`, `cinema`, `invert`, since U7 `loop` and `playback`, and since U8 `hold`) and their default minutes (`MINUTES`); `quartersOf` (the mission's quarters or the shim's), `threadsOf`, `sidesOf`, `estimate` (what was the length model: cold open + main threads + hook = main; side stories = optional. Since the closing pass these minutes are authoring weights and nothing more: they overstated a player's time about five times against the bot's measured walks, so no length is claimed from them, and a mission's length is measured instead, "Lengths, measured" below); `placeThreads` (what a kind needs at its landmark: triggers, spots, deduction and record scenes, the chase's path; with the mission's `gateAfter` (every rewritten mission from Act I on, since the U7 review) a thread's own spot, trigger, deduction, record or playback answers only once every thread it comes after is done, and every thread those come after (a thread a player may walk past counts once its `until` holds), while the evidence a clue lists stays free to find; the cold open's `cast`, people who stand in its shot only while it plays); and the runtime class: the objective and its because line, the tracked side story, completion (each thread's fact `t_<mkey>_<id>`; what the thread carries is paid out once, `_paid`, even when its kind sets the fact itself), the year carried out of a room into the open place (`carryOut`), THINK's tiers, the furthest quarter (a toast and an autosave at each new one), the chase (DeckWorld's own path walker, paced so she keeps 10 m ahead and waits beyond 14 m; it never fails), staged `cinema` moments (each started once per load, never marked in the saved flags: a save taken while one plays loads with it still to come), deductions (a wrong answer is said and the question stays open; a right one without its evidence is not yet provable) and residue records (what a record says now, and in the past what it said first); `loop` (done once its resets happen while it is the objective) and `playback` (the recovered pieces put in order, one a use, then echoes that stand only while it plays re-enact the scene); `hold` (Mission 18's pylons: progress while Kai stays by it, one post at a time drifting out of phase and lapsing unless re-anchored in its own year, allies holding a post, a slower drift for the freed city; a chip under the objective; its seconds saved). A thread's completion is re-tested on every fact change and four times a second. A main thread a player can leave undone (a look at a photo, a clue set) carries an `until`, a fact the story sets once Kai has moved on: from then it is walked past, neither the objective nor THINK's, and it no longer holds the furthest quarter back (U6 review: Mission 1's photo, Mission 2's lobby, Mission 3's excavation office; a unit test walks Missions 1-3 with every such thread undone). |
| `ledger.js` | The campaign's ledgers in one place (§9.3–§9.7): `QUESTIONS` (each with the mission that opens it and the one that answers it; the case board shows the open ones as THE QUESTIONS), `CLUES` (C1–C12: plant, reinforce, payoff, each step a fact or a line of text in a named mission), `CONSEQUENCES` (every consequence fact, where it is set and where it is read), `CHOSEN` (what WHAT YOU CHOSE says for each), `PREVIOUSLY` (three lines per chapter, for a chapter's start and a loaded save), `EPILOGUE` (a line per consequence, read by the ending: Pryce, Dale and Iven's team since U6; nineteen lines since U8, Ending C's own letter among them). Unit tests hold them to the missions: every clue planted before its payoff, every consequence read later or listed as an epilogue line. |
| `Runtime.js` | A rewritten mission loads once (all its quarters), opens on its `coldOpen` (with `first` before the mission's card, the rest after), offers SKIP (the button, or Enter while the pointer is locked: a line and its shot a tap, as `cinema.js` says), and ends on its hook (`autoExit` where the story ends the mission rather than a gate; armed once a load, on the runtime, never in the saved flags). A load puts Kai at the checkpoint he saved at, in its room, after a PREVIOUSLY card (a mission's own, `PREVIOUSLY.<mkey>`, where it has one); only a save with no position (a mission the save format restarted) starts at the furthest quarter's spawn. A mission's `resumes` ({ when, until, fx }) replay, once a load's card is over, a moment that sets its facts in callbacks and that the save cut off (`afterResume`; each fx skips what is already set). A cold open with `stage` holds `co_<mkey>` while it plays, so the place can stage it (Mission 1's 05:40: a sky `preset`, a pulsing `beacon` window in Helix's crescent, crowds `!co_m01`). The case board has THE QUESTIONS, SIDE STORIES (a TRACK button puts that story's next thread under the objective), WHAT YOU CHOSE and ABILITIES. `time_<mkey>` stores each mission's play time (the ending sums them per chapter). Save format 24 (`campaign.lvFormat`; 22 for the Prologue's rewrite, 23 for Acts I and II, 24 for Acts III, IV, the Finale and the case files): an older save inside a mission rewritten since restarts it at its first quarter with its facts. A mission may have a home year (`home`: its rooms start in it, and stability drains away from it), scenes built when used (`nodes`), watchers that answer an afterimage (`onEcho`), and talks keyed by a person's own id (one person standing in several places). The CASE FILES screen (`caseFiles`) lists the fourteen stories with their state and replays one: `cases/<key>` starts the cases chapter at that replay, with the facts the player had (handed over the reload in `sessionStorage`, else the latest save's) and the story's own facts cleared, in the quarter it lives in, speaking from its mission's pack. Starting a chapter from the menu primes the facts a player would carry into it (`PRIMES`). A loop (`deck.loop: { period, variants, upward, until }`) resets the place every `period` seconds until `until` holds: the patrols walk the next variant's rounds, the crowds restart further along their routes, the rain falls upward for a second. While an opening or a staged moment plays, the watchers walk their rounds but see nobody. Authored triggers may ask for a year (`@FUTURE`). |

The Prologue as written (OVERHAUL.md §5, M1–M3): Mission 1 opens before its title on Helix at 05:40 (a card
opens Chamber One while Kai sleeps; his phone lights once), then 08:02 at door 4B; the avenue's anomalies read
together at the plaza clock ("Everything odd is running backwards toward the same minute: 8:14."); Officer Pryce at
the checkpoint ("Says here you badged into Chamber One at 05:40."); the florist who served an older Kai with a scar
ten minutes ago; the photo booth's three photographs; the Zero Second, the rescue in which the door glass cuts
Kai's wrist (`wrist_cut`), the voice in every speaker; the pursuit of the woman with Mira's face to the staff gate,
where she leaves a yellow raincoat (`raincoat`); chain A. Mission 2 opens on what the lobby kept of 05:38; Dr. Lin,
whom nobody remembers hiring and who has no shadow; the Site Zero print; the camera room; Dale's recording; the
junior pass (OVERRIDE 14-03-2026 16:02); chain D begins; Rook in person at the chamber door ("Did you think it was
for clocks?", `trust_rook`). Mission 3: the ring takes Kai's hand and the cut seals into a circle with a broken halo
(`wrist_mark`); the 2026 excavation office through a gap in the lab's wall that only 2026 has (`ev_site_zero`); the
2196 plaque; chain D's route; the fracture, after which the mission ends on its own.

Acts I and II as written (OVERHAUL.md §5, M4–M13; `act1.js`, `act2.js`): Mission 4 opens on the villagers' side at
night ("Then it is him again. Put a blanket over him."), then Kai wakes under the blanket; three pictograms, the
telling-stone, the meal at the first fire where the craftswoman, the storyteller and a girl speak of "the others" (the
grey one is the Witness) and the ash under the pot keeps the order cooking, feasting, nothing, cooking; the stele and
its residue, the three stones ("HE IS NOT LYING. HE IS EARLY."), the Elder's bible exchange, the under-chamber's panels
read from the ash, and the card (VAREN, K., grey at the temples); Niko's questions (`niko_told`) and the girl's stone
ring. Mission 5: Niko's bible exchange, the river turned at its head (thriving), the abandoned village's why (tallies,
names, cold hearths, and the hearth's echoes walking out: "Then they left because of me."), the wall braced, the
mural of what Kai told Niko, the gate released in the flood, the machine in the drained basin and Niko's choice
(`machine_buried`); chain B (Tala's three gorge gates, read off the mural cliff, `water_route`). Mission 6: the 1999
cold open, Ezra Moll ("Which version of the question are you asking?"), the arm's tally, the window's three faces,
the hidden stair deduced from the boards in two years, three clocks in three years, the recording; the Clockmaker's
Debt (`ezra_debt`) and Rook's gauge. Mission 7: the gnomon at the first sky, the star tube at 2049's blue hour, the
dates ring ("They didn't know when. They knew who."), the scavengers' camp (their stones come back), the outer ring,
the new star of 2196, and Mira's tape (`mira_tape`); the scavengers' cache, Niko's river clue. Mission 8: what changed
(the river court, the print case, the photo wall), the revised staff records, Lin's desk, the 2026 security log, Rook
confronted in his office (`rook_fate`: expose, persuade, record; his words follow `trust_rook` and `machine_buried`), the
boot print, the last ten minutes put in order and played back by echoes, Lin in the cube ("Because I am not the one
who died."), the breach that seals the cube round Kai and the way out through 2026, which has no cube, VERSION 17; Iven's testimony, the staff door (Pryce or Dale), the 2026 group photo. Mission 9: two loops
(each reset moves the patrols, burns one more shopfront on the quay, restarts the crowds further along, and the rain
falls upward), clocks A, B and C, the cancelled evacuation order, the transmitter whose carrier is the three notes,
Rhea, the tower at 08:13 ("To become me."); the evacuees warned with the order, the Child at the loop's edge. Mission
10: the Director as `rook_fate` made them, the cell block, Sera ("For ending it."), the power runs in two years, the
captured afterimage projector (Echo Step), the prisoners' choice, the yard; troopers that move their rounds and look
further after each catch; the intake records, the Director's office. Mission 11: the music box quieter as Kai
approaches, a gurney, an IV stand and a pane of glass that go back where they were, young Kai on the bench, REVERSE
taught in the records hall, the records compared, Nurse Odile (`odile_released`), the reversing lock, Ward 32 and Lin's
photograph; the photo board's two ages, Odile's echo, the intercom room. Mission 12: the roof chase (he waits at the
glass; it never fails), Corridor B in 2026, the route deduced from his stops, the Witness reversing the fallen stair
in Kai's own colour, Kai following by REVERSE, the beam, the voicemail, face to face at the second ring; Rook in the
corridor, the bouquet, the lunch-room whiteboard; a drone that can be patrol-reversed. Mission 13: the field orders,
a shell from each side reversed into its own gun (`ev_both_sides`), nobody fired first (a deduction), across the
battlefield (one Continuum patrol walks its round backwards), Sera and Brask, three devices in three years, the
stabilizer (`faction`, with `stabilizer_destroyed` or `civilians_freed`), the district thawing or not, REVERSE's cap at
10 s; the burial reversed (a scarred wrist, `ev_witness_cause`), the people who listened, the roll-call wall.

Acts III and IV and the Finale as written (OVERHAUL.md §5, M14–M23; `act3.js`, `act4.js`, `finale.js`). Nothing that
ends one of these missions answers before its story gets there (`gateAfter`, Threads.js, since the U8 review: a thread's
own spot, trigger, deduction, record or playback, the spots a tasks thread is finished at, the conversation nodes that
would complete a talk thread (a person with none open is not offered as a talk) and a REVERSE thread's process (its
`arm`) all wait on every thread before it; a thread whose condition holds early, a talk or evidence found first, is paid
(its fact, its lines, what it sets) only once every thread before it is, and a staged moment, a loop, a hold or a chase
starts only then; Mission 18's slabs are in sight from the start but `arm`ed only once the stabilizer holds; a test has
a free player do everything open, in any order and year, but one thread, and the mission never ends). A kit stands
whatever the story has reached; a kit whose spot belongs to one year (`@FUTURE`) stands only in it. Mission 14
opens in 2196 at home (Kai's own statue, in stone, on the memorial's plinth): the beacon's parts list, the bank's fallen lift car that carries Kai 24 m up its shaft when he
REVERSEs it from inside (or the tower that fell beside it, as a ramp), the capacitor, three stacked stones, the warning
and its residue (Sera's safe path), the transit bridge's span held up out of the lagoon, the memorial with Kai's name,
fresh white chrysanthemums and the core, Sera's question (`trust_sera`: deny, accept, ask) and the beacon; the
Survivor's Garden (the culvert in 2049, `garden_restored`), whose flowers (moss prints run forwards to a tear in the air,
a receipt for 08:04), the schoolroom's rhyme. Mission 15: the departure board, the station's noon reset (a loop), the
school and the market reliving the fourteenth (a flood, deduced from the silt and the well), Mara, the card whose
forged layer comes off under REVERSE while both archives stay original (`ev_dual_archive`, chain C), Anja's lock
(`city_freed` or `city_stabilized`); the Train That Arrives Yesterday (Jun's echo, the flaps, the next carriage).
Mission 16: three memories of one event (the second on a reel run backwards), the cases compared with the world they
came from, the Witness's museum deduced, the photograph (`photo_taken`); the Names beneath the City. Mission 17: the
recordings matched to Kai's own route, red copies of him replaying it (a counter-reverse), the earlier rooms in 2026, the
shredded sheet (RECORDING 117 OF 117), the reconstruction and its two sealed logs, "They became the price.", and the
memory at the console ("I pressed it."); the Unsent Letter (`letter`). Mission 18: Sera at the failing anchor, three
houses evacuated, the canyon in 2026, the flooded highway in 2049, the floor plan numbered in the order of the fall,
the stabilizer's three pylons held in phase for two minutes (the `hold`: REVERSE's cap rises to 12 s), the core's slabs
reversed last fallen first into a stair, the tilted floors, Mira's message; the potter's kiln, the Last Signal (Iven
out of a folding pocket of time). Mission 19: Orren's road, the clockmaker's mark where the road is real, the stones,
the badge, the bridge only in the reflection (in 2026, or the reflection's lag reversed into step), five blue doors
and the one with no shadow, Mira in person and who opens the door (`m20_lead`); Orren's three conversations, the
clockmaker's mark on his gallery. Mission 20: the kitchen in 2026 (the two children arguing at the fridge, staged for the cold open), the drawing, the boots, the night badge, the song,
the experiment from the chair ("I was that kind of nine."), the world without Kai (the late 41, a memorial for nobody,
Mira planting), three memories aligned on a board (any order that keeps each memory's own; Kai's tidy line refused),
the Child singing it down with Mira, "I remember being your sister."; every target refuses REVERSE (A MEMORY), Mira
answering the first try; the House with No Owner. Mission 21: the Director (by `rook_fate`: Rook or Pryce as a broadcast in the cold open, or nobody), elites that snap back
five seconds when an afterimage reaches them and stand stuck when their rewind is reversed, the kitchen door (for
`warned_evacuees`) or the stair alone, the cells (for `prisoners_held`), the arena falling, the first gap held by
REVERSE, the second by the ally Kai earned for thirty seconds or by 2196's frozen girder (`ally`), the wrists side by
side and the hesitations the tape, the photograph and the letter bring; Mara on the radio. Since the U8 review the
command structure is read before the arena (the timeline wall, the elites' field orders, the Director's desk with
whoever sits there by `rook_fate`, and the Witness's requisition: a 2026 console, a step stool, a child's chair) and
deduced (he is building Chamber One again, and needs Kai at its console, `ev_witness_plan`), and an elite walks across
the cells' terrace to the arena's bridge until its rewind is run forwards (`m21_door`).
Mission 22: the Witness standing at the station's microphone ("Kai Varen. Do not build the machine."), the village's chain put
in order, the clockmaker's arm reversed on its beat, Odile's rule, the seals out last fitted first (MACHINE, GATE,
WALL, RIVER), Iven's statement and the museum's card, the two logs run forwards ("RING: 16:02:00. CONSOLE BUTTON:
16:02:01."), the deduction ("I was a second late." "…No. I was a second early."), the reveal, the final chamber; the
Unwritten Record (what each ending costs). The Finale: the 41 on time, the opening streets (cleared by Jun's passengers
for `jun_line`), the street that fell held by the Witness while Kai crosses its 2026 half, the telling-stone (HE CAME
BACK) and Tala, the swap at the settlement's bridge (Kai holds it, the Witness crosses: "For once, you are on time."),
Rook's last transmission and Iven, the memorial, Sera and Anja, Mira ("Ask me."; "You kept my letter." if Kai kept it),
the choice of three endings with what each adds, the epilogue (a line per fact set; in Ending C, Mira's own line, then
"In the worlds he passed through, what he did stayed done." before the rest) and the voice in every speaker; the
consequences gallery. The opening streets' trigger spans the avenue, the strips beside the fallen street are closed by
fallen facades, and the street answers Kai's REVERSE only once the Witness has it. The endings are staged
(`finale.js` `ENDING_SHOTS`, Runtime.ending): the ring, each added line where it happens (A: the 41's board and Kai
under it; B: Sera at the seam where one world ends, someone on the other side; C: the 41's stop, Mira at a window box
on the South Square's shopfront), then the road for the quote and the epilogue, held over the clock's ticks and the
voice; Kai himself is never on screen (`cinema` `hidePlayer`: the game camera, which shows him by its distance, does
not run while a shot holds the view).

The closing pass, longer chapters and a stronger story (the player's points 4 and 5; 2026-10-24). The missions the
critic measured as short were given played threads, not narration: talks, records read in two years, REVERSE set pieces,
walks across the places' far ends, and side stories the bot plays. A real choice in Missions 12, 18, 20 and 22, each seen
again in a person or a place. Adult Mira speaks across the campaign (997 words in her own voice and 135 as Lin, from 303
and 93 before the pass), the Witness more (577 words, from 244), every word counted once; the campaign's own lines
grew from 15,569 words to 19,861. Every mission's crowd says lines of its own (`barks.js`).
- Mission 6: the cold open hears Ezra ask the Witness "Repeat for how long?" and the answer ("Until he comes. He will
  be early."); Ezra's appointment book on the counter, a record read in two years (V., every Tuesday since 1999; in
  2026, "PAID IN ADVANCE. DO NOT ASK HIS NAME."), and Ezra's echo at sixty-five in 2026, talking to the spot where
  Kai will stand (Mira came in once, at nine, for a watch that went backwards), before the clocks.
- Mission 7: at the first sky the astronomer who cut KAI into the outer ring tells who asked him to: a woman with no
  shadow at noon, "like you, if you had slept", and beside the name an M cut by another hand.
- Mission 9: Sergeant Brask at the funicular, the one soldier who remembers every loop, in person (who sent Rhea's team
  to the tower; three answers), before clock B.
- Mission 11: on the bench by the music box Kai sits with himself at twelve, finishing Mira's drawing while she laughs
  behind a door that is not open; he tells the boy she gets better, or draws the face on the sun the way she does
  (`m11_boy`; drawn, the face is on the fridge's drawing in Mission 20).
- Mission 13: before the stabilizer, the frozen block close to: every floor stopped halfway through something, and on
  the third, hanging where it broke away, a woman at a stove. Sera, on the radio: she is her mother ("Choose the way
  you would if she was nobody's."). The district after the choice shows the kettle: still steaming, or the woman in the
  smoke looking for her daughter.
- Mission 16: Mara at the rim, in a conversation of her own: the guest book (one name every morning, older each page,
  and under the last one STOP BRINGING ME HERE. M.) or the woman who stands at the raincoat case; then the woman is
  there across the hall, and gone when Kai reaches the glass.
- Mission 19: Mira's reflection walks ahead of Kai across the water from the bridge to a blue door (a walk at her
  pace), and it is the wrong one ("You always follow the one in the water. Look at the doors, Kai. Not at me."); her
  voice at the first chalk mark.
- Mission 10: the cold open goes on to the guard post, where the guard (Sera under a Continuum helmet) reads his fifth
  intake over the radio; on the crest an interview reel, Sergeant Brask questioning Dr. Lin the night of the Zero Second
  in their own voices ("I remember a kitchen. A boy who stopped a song too early."), which Kai now recognises; in the loop
  cells a prisoner whose loop lets him say a few words each time Kai speaks to him (four times: the woman with no shadow
  they held there, the hospital she asked for, her message "stop looking for me where I was"), before the prisoners'
  choice; Sera at her skiff, helmet off, with a choice of what Kai says; the flood pole (a side story): marked at the
  crest in 2026 by hand, signed W.
- Mission 12: the cold open is the Witness's own voice ("He comes up the east stair."), a second shot close on the
  flowers and the scar. The choice: where he tears into 2026 the roof cracks and a glazier's sunshade frame comes down
  across her way; Kai holds the frame up by REVERSE and loses him, or goes after him and finds the page he dropped (HE
  CHASES. HE ALWAYS CHASES. LET HIM SEE THE STAIR.) while she climbs down alone (`m12_glazier`). She is at the Spire in
  Mission 21 (a talk either way; saved, she can hold the second gap as the ally) and on the Finale's road at the lab. On
  the 2026 gangway he waits for Kai and casts no shadow (C9, "In this year I haven't happened yet"); his camp in the
  2196 ruin (a cot made with hospital corners, one cup, a wall of one child's handprints) and his tape recorder by the
  cot, running backwards: held, it is him rehearsing what he will say to Kai ("You were always early, and I was always
  late, and she was nine."); on the north roof the one planter he runs past without looking, Lin's (yellow
  chrysanthemums; in 2026, a nine-year-old's chalk sun with a face); on the gangway and face to face Kai asks him
  something (why he waits; the flowers, why he runs, or nothing); after it the
  second ring speaks in a woman's voice, waking ("Kai? Is that you? It's so dark in here.").
- Mission 14: the warden at the flickering street, in person: why he painted over Sera's safe path; the return beacon,
  built, wakes on a channel that has called for a hundred and forty years in Mira's voice ("Is it still Saturday?");
  THE LAST TICKET (a side story): the departures board on the 41's old platform and the man who keeps a ticket for the
  day it comes back; on the Finale's platform the 41 has come, and he is on it (`m14_ticket`).
- Mission 17: the far dishes keep her side, adult Mira in three of his worlds in her own voice ("Stop bringing me
  flowers. Bring me a door."), walked across the plateau before the corridors; the cold open hears her first; WHO PAID
  FOR THE ARRAY (a side story): a plaque, and under it in 2026 the foreman's page: cash, a grey man with a scarred wrist.
- Mission 18: the cold open has the settlement's own voices; the choice: a scavenger and his daughter ask for one of the
  pylons' cells for her lamp. Given, the hold's drift is as it was and the two of them sit by the third pylon; refused,
  the drift is slower and they walk back into the storm. On the Finale's road the lamp is in Sera's garden, lit or dark
  (`m18_scav`).
- Mission 20: the choice: in the world without him Mira hums the song and stops a note short; Kai hums the last note for
  her (she stands, turns, and asks if they have met) or lets her find it (`m20_note`). At the ring in the Finale she
  tells him which. "I remember being your sister" is a conversation now: a hundred and seventeen brothers, every one
  sorry, and what she wants instead (it is enough; who she is when she is not his sister; or "I don't know").
- Mission 21: the cold open begins on the summit, the Witness talking to Mira inside his ring ("You said that a hundred
  times. In a hundred voices. All of them yours."); Chamber One rebuilt on the summit from the requisition (the console,
  the stool, the child's chair), and Mira in the chair as a light, which she has outgrown, before the confrontation; THE
  GLAZIER and BRASK'S LAST ROUND (side stories; Brask is the loop-aware sergeant of Missions 9 and 13).
- Mission 22: the cold open goes on ("Every time I say it, he goes in."); the station wedge's microphone, from which he
  watched Kai run for the 41; the choice: Chamber One's log has an operator's line nobody signed; Kai signs it (VAREN,
  K. is written on the log, and HE SIGNED FOR IT at the foot of the memorial on the Finale's road) or leaves it blank
  (`m22_signed`); Ezra's echo after the arm, as Mission 6 left him (his Wednesday, his finished clock, or still
  Tuesday); beyond the opened chamber, Mira: "Come up when you're ready. Not before."
- The Finale plays as a climax in scenes: Mira at the ring in the cold open ("Don't run. Walk. I want to see you
  come."); the voice in every speaker is hers this time ("Kai Varen. Build nothing. Walk north."); the 41 back at its
  platform, with whoever Kai got off it waiting there; three storms stand
  on their ends along the road, each a world of hers that REVERSE runs forwards once in her voice; the Witness stops at
  the lab gate, where the ring would turn for his hand, and holds the road ("Don't fix it. Look at it." / "It's
  beautiful. Why is it beautiful?"); Mira comes down to the foot of the hill and walks back up it beside Kai (a walk, at
  his pace, talking on the way: a zone and a rule at two places on the path), at the top asks what he carried up (the
  tape, the photograph, Ezra's watch, the sun with a face, each as he chose), asks to be asked, and counts a second
  with him on the ring's arm (REVERSE on the third count); Sera in 2196 says how she lives with the frozen block
  (Mission 13), the Witness at the gate what Mira once told him ("I said: her. She said: wrong answer."); the choice,
  and before the ending's sequence its consequence: the sky turns with it, and Mira answers it (A, the ring comes apart
  in her hand; B, the sky breaks into panes and she walks into one; C, Kai steps into the ring and at the lab gate the
  Witness is not there any more). The consequences gallery has the ticket keeper and the scavenger's lamp.
- Mission 6: the cold open answers ("Repeat for how long?" / "Until he comes."); Ezra's appointment book, read now and in
  2026: V., every Tuesday since 1999, paid in advance. Cold opens with the characters' own voices in Missions 11 (Odile
  at the whiteboard), 13 (both sides giving the same order a second apart), 15 (Anja counting her notes) and 18.

Lengths, measured. A mission's length is what the browser bot measures with the game's own telemetry (`time_<mkey>`,
the full run of `tests/lastversion.mjs`): it walks every main thread, plays every line at its own length and the side
stories named for it, knows every coordinate and reads nothing twice, so a player will take longer. The bible's targets
(35 to 75 minutes a mission, 90 for the Finale, 25 to 30 hours in all) are not met: STATUS.md gives each mission's
measured minutes against its target.

## Authored and generated

**Written by hand**

- The Prologue, all of it, rewritten for U6 as threads in quarters (above). Mission 1 is Rain City South
  (an open place since U2) with an
  authored overlay — Kai's door, the anomalies (the toy, the backward clock, tomorrow's camera
  feed), Rook's call, the checkpoint, the station, the Zero Second and the train, the rescue,
  the voice in every speaker, Mira in the crowd, Jun's booth and relay 41-B (quest chain A).
  Missions 2 and 3 are hand-built Helix interiors (`Build.js` `Deck`): security, the dark
  corridor and its drone, the power room and the three cells, Iven's locker, the recordings and
  the officer's code, the conduit hall and the unit, the archive and the drawing, the chamber;
  then the Chronolith's first switch, the cable connected in 2026 and powered in 2049, the
  machine hall crossed in 2196, Iven's maintenance route (quest chain D) and the control room.
  Every bible line of these missions is spoken verbatim.
- Acts I and II, all of them, rewritten for U7 as threads in quarters (above).
- Acts III and IV and the Finale, all of them, rewritten for U8 as threads in quarters (above), with the three
  endings, the epilogue and the post-credit "Version one hundred and eighteen."
- The CASE FILES (`cases.js`): the fourteen stories and their states; chains B and C replayed from Missions 5 and 15
  (their old keys, so old saves load), and ten side stories replayed from their places. Since the U8 review a replay is
  gated as its mission is (`gateAfter`), keeps the mission rules that set what its threads wait for (the train's board),
  clears only what the story waits for and sets (not a shared conversation's first meeting; chain B's gate count), saves
  in a slot of its own (`case`, never listed: the finished campaign's slot and the autosave are never written), loads its
  own mission's chapter's people (its crowd wears only those faces) and does not fetch the empty cases pack.
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
| 4 | The Man from the Last Day | I | The Ring Hill (`valley_upper`) | THE VILLAGE, BEFORE THE FIRE | Pictograms, the telling-stone, the meal at the first fire, the stele, three stones, the Elder, the panels; the access card |
| 5 | The Village That Never Existed | I | The river bend and the gorge (`valley_river`) | THRIVING, ABANDONED, FLOODED | River (thriving), why they left (abandoned), wall, mural, gate (flooded); the machine buried or left; chain B |
| 6 | The Clockmaker's House | I | Old Town and the light-well house (`oldtown`) | 2026 2049 2196 | Ezra Moll, his appointment book, his 2026 echo, the arm, the hidden stair, three clocks; the recording; the Debt |
| 7 | The Broken Observatory | I | The Ridge (`observatory`) | THE FIRST SKY, 2049, 2196 | Three instruments in three years, the dates, the scavengers, the astronomer who cut the name; Mira's tape |
| 8 | The First Death | I | Helix in VERSION 17 (`helix_v17`) | 2049 (V17), 2026 | What changed, the log, Rook confronted (`rook_fate`), the boot print, the last ten minutes, Lin; VERSION 17 |
| 9 | Nine Minutes to Zero | II | Northbank (`northbank`) | 2049 2026 | Two loops (90 s), three clocks, the cancelled order, Brask who remembers, the transmitter, Rhea, the tower at 08:13 |
| 10 | Enemies Who Remember | II | The dam (`dam`) | 2049 2026 | The Director, the cell block, Sera, the power runs, Lin's interview reel, the projector (Echo Step), the prisoner who remembers, the prisoners, the yard, Sera at the skiff; the flood pole |
| 11 | The Inverted Hospital | II | Rain City General (`hospital`) | 2049 2026 (+ reversed wards) | The quieter sound, the boy on the bench (`m11_boy`), returning hazards, REVERSE taught, the records compared, Odile, the lock; Mira's file |
| 12 | The Man Behind the Glass | II | Helix, north wing (`helix`) | all three | The chase, the glazier or him (`m12_glazier`), Corridor B, no shadow in 2026, his camp and his tape recorder, the route, his stair then Kai's, the voicemail, face to face, the second Chronolith and the voice in it |
| 13 | The Nine-Minute War | II | The delta port (`warport`) | all three | Field orders, shells reversed (`ev_both_sides`), who fired first, three devices, the frozen block and Sera's mother, the stabilizer (faction) |
| 14 | Welcome to 2196 | III | Downtown (`drowned`) | 2196 (home) 2049 2026 | The lift car ridden up the bank, the beacon's parts, the warden, the warning's residue, the transit bridge held, the memorial (`trust_sera`), the beacon's voice; the Last Ticket, the Survivor's Garden |
| 15 | The City That Forgot Tomorrow | III | The lock city (`lockcity`) | 2196 (home) 2026 2049 | Noon resets (120 s), the fourteenth's flood, the card un-written and the dual archive (chain C), Anja's lock; the Train That Arrives Yesterday |
| 16 | The Museum of Failed Worlds | III | The sinkhole (`sinkhole`) | 2196 (home) 2026 2049 | Mara and the guest book, the woman at the raincoat case, the spiral, three memories (one reversed on its reel), the Witness's museum, the photograph; the Names beneath the City |
| 17 | The Witness's Archive | III | The array (`array`) | all three | Her recordings on the far dishes, recordings matched to Kai's route, red copies of him, Recording 117 of 117, the two logs, "They became the price.", "I pressed it."; who paid for the array, the Unsent Letter |
| 18 | The Fracture | III | The traverse to the coast (`fracture`) | 2196 (home) 2026 2049 | Three houses, the canyon in 2026, the highway in 2049, the scavenger's cell (`m18_scav`), the pylons held (12 s), the slab stair, Mira's message; the kiln, the Last Signal |
| 19 | The Place Outside Time | IV | The salt mirror (`unwritten`) | all three | The marks, the bridge in the reflection, Mira's reflection walking to the wrong door, the door with no shadow, Mira (`m20_lead`); Orren's three conversations |
| 20 | Mira's Memory | IV | One plot, three memories (`memory`) | 2026 (home) 2049 2196 | Nothing reversible; her side of the experiment, the world without Kai, her last note (`m20_note`), three memories aligned, the Child, "I remember being your sister." (a conversation with a choice); the House with No Owner |
| 21 | The Last Battle of the Continuum | IV | The Continuum Spire (`spire`) | all three | Elites who rewind, the command structure read, the arena's gaps, the ally you earned (`ally`, the glazier among them), Chamber One rebuilt on the summit, Mira in the chair, the wrists side by side; the glazier, Brask |
| 22 | The First Second | IV | The Ring Hill's wedges (`firstsecond`) | all three | The chain, the arm's beat, Ezra's echo after it, the microphone, the seals, the logs' second, "I was a second early.", Chamber One's log signed or blank (`m22_signed`), the final chamber, her voice beyond it; the Unwritten Record |
| 23 | Afterzero | Finale | The road to the ring (`afterzero`) | all three | Her voice in the speakers, the 41 at its platform, two holds (his street, Kai's bridge), three storms of her worlds, the Witness stays at the lab gate, Sera and the frozen block, Mira meets Kai and walks the hill with him talking, what he carried, "Ask me.", the second they count, Endings A, B, C each answered by her, the epilogue |
| FREE ROAM | Every place reached | beside the story | Each done mission's place, as the story left it | the years opened there (2049 only in Missions 1 and 2) | Walked with no story gates: its people, side stories, fragments, records and REVERSE; TRAVEL from the case board or the map, BACK TO THE STORY to the checkpoint left; after an ending, from the CASE FILES |
| B, C | The Water That Remembers; Two Records, One Disaster | CASE FILES | Mission 5's gorge (`c_b`); Mission 15's press tower (`c_c`) | their missions' years | Chains B and C replayed from their missions (the gates low, high, middle; the dual archive); old saves load into them |
| E–N | Ten side stories | CASE FILES | their missions' places | their missions' years | The Child, the Train, the Letter, the House, the Signal, the Names, the Debt, the Ninth Minute, the Garden, the Record, each replayed from its place with the facts the player had |

## Tests

- `tests/lastversion.test.mjs` (in `npm test`), since the open-world closing pass: a trip for every story mission, kept
  out of `MISSIONS`, with nothing that tells or ends the story; TRAVEL lists the missions done in story order, in their
  opened years, with what is still there; every place in every opened year built as a trip (no way on, no gate, no
  watchers, only side threads, the story's spots as `r: 0` props); a free player on each trip finishes every side story a
  player can finish in its mission (44 of 44) and changes nothing outside side stories, fragments and REVERSE (without
  `roamFree` it fails on Mission 11's first meeting with Odile); a story node said without acting, read fragments and past
  rules not laid again, a trip's save keeping the year switched to; the saves round trip (a trip, a trip from a trip,
  BACK with what was found, the format, REVERSE's cap); the case board opens after every mission of a campaign a free
  player walks, with everyone met (a standing may be a word: Sera's), and on a trip; and Kai walks into Rain City's
  pharmacy, café and grocer by their doors (their glass beside the door is glass). `tests/lastversion-reach.test.mjs` floods every trip from its arrival in
  its opened years too. Since the visual closing pass: Kai walks through Mission 1's laundromat door to within reach of the shop camera's feed, and the corner shop's glass stops him; the shops have their rooms and the laundromat its machines; the plain finishes carry wear; Mission 11's court rain is the falling and rising surfaces; Mission 20's 2049 is Chamber One (panels, ceiling of light, grid, pencil) with no white void; Mission 22 has a sky of soft wedges for each year, each lighting its own. Since the closing pass also: no crowd line is said in two missions (each
  mission's own pool, `barks.js`; a case replays its own); the Finale's processes (three storms of hers, the ring's
  counted arm) and its ending choices, each answered by Mira before the ending; the per-mission speech cap is 1,600 words
  with a crowd line counted once, the Finale's 2,600 (its endings, epilogue and post-credit among them); the length-model assertions (the Prologue 75–100 model minutes, each mission 25–42, the
  Finale 90 or less, declared minutes the model's) are gone, as the model no longer claims a length; up to 20 main
  threads a mission (the lengthened ones are fuller); the Finale's road may hold 34 people (its Witness and Mira stand in
  five places each, one at a time). Since U8: nothing that ends a mission of Acts III, IV or the
  Finale answers at its start (from each chapter's PRIMES, every spot, trigger and person that sets the mission's end is
  closed, and each thread's own interaction names the threads it comes after); every line authored in the missions'
  files is one `spokenLines()` walks (so a line said from code is recorded); the consequence ledger is global (every
  fact a choice sets is read later in the campaign); Acts III and IV and the Finale on threads (each Act
  mission 25–42 minutes, the Finale 90 or less, the main path 70% or more, declared minutes the model's), the global
  ledgers (every question answered in its mission with some of its evidence findable by then; every piece of evidence
  a deduction's right answer needs set earlier or on its own mission's main path; no main thread waiting on something
  only a side story sets), the hold, the moments of Acts III and IV (the alignment simulated: Kai's tidy line refused,
  an interleaving accepted), the Finale's holds, endings, epilogue and post-credit voice, and the CASE FILES (fourteen
  entries and their states, twelve replays each building from its place, nothing of a story done after a whole game
  once its facts are cleared); before U8: the state engine on three years (states per
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
  Act I and in Mission 11, and every year of a place gives `main.js` a full theme and a sun. Voice and
  score (U5): every `spokenLines()` entry plans fully from `common` and its own group's pack (no miss,
  never a CREW voice, every clip inside its file); the spoken text has no tags, key names, design notes,
  templates or digits the lexicon does not read, and no `say` call in the edition is built from a template;
  each pack is under 12 MB and the edition under 22 MB; Station Zero's `voice.json` and `voice.ogg` keep
  their sha256; each speaker has its own (spec, speed, pitch), Kai is a man, and the same person shares a
  base voice (Kai, the Witness, young Kai on `am_eric`; Mira, Lin, the Child on `af_river`); with the
  edition on, `Voice` never reads `speechSynthesis` or `AndroidTTS`, waits for a pack still loading and
  records a miss; the effect chains are the edition's (each `fx` through its own chain to the voice bus, the
  echo slower, beds under radio and records, wow on records) and Station Zero's voice plays every line dry;
  the cards, the choices Kai says and the ending sequence; every region of the score plays a minute in every
  year and every cue plays, on a stand-in audio graph. Threads and ledgers (U6): the Prologue as threads (one
  map each, its quarters, a cold open and a hook, every thread a known kind with a goal, a because line and three
  tiers, at a landmark of its place), the length model (the Prologue 75–100 minutes, the main path ≥ 70%), the
  clue ledger (every plant before its payoff), the consequence ledger, the bible's exchanges verbatim with their
  speakers and no design-note words, the speech budget, PREVIOUSLY and THE QUESTIONS from the common pack, the
  thread engine, a thread paid once, the year carried out of Mission 3's lab, the save-format migration, and
  Mission 3's walk out through the lab's 2026 frame to the dig. Acts I and II (U7): rewritten as threads, each
  mission 25–42 minutes in the length model with its main path ≥ 70%; the moments each sheet names and the choices
  it keeps; no mission starting with a thread already done (a chapter from the menu, with its PRIMES and faction
  neutral); every talk's person can be talked to; a staged moment kept in the load, not the save.
- `tests/lastversion-perf.mjs` (browser, read-only): what a place costs on an emulated phone
  (915×412 at 2.625, medium quality) at quarter 0 of each mission and year: full-frame and
  scene-pass draw calls and triangles, the static draws split into scenery, sky, horizon and
  DeckWorld's own, and JS time per frame; checks §4.7 (static draws ≤ 70, sky 1, horizon ≤ 4,
  triangles ≤ 300k). `PLACES=m01,m04` by default (any of `m01` … `m23`).
- `tests/lastversion-audio.mjs` (browser, real time, Chromium's autoplay policy on): from NEW GAME with the game's own
  frame loop, the first tap starts the AudioContext; the Prologue's card, the cold open and Mission 1's card, and the
  florist's conversation, each start decoded clips of the packs and carry signal on the voice's output, with the score
  under them; `speechSynthesis` is never asked and nothing misses. `LV_ROOT=<dir>` serves another build instead of
  `game/` (since the release check: `LV_ROOT=android/build-lastversion/preview`, the built web preview as published).
- `tests/lastversion-garments.mjs` (browser, since castfin round 1): fifteen people of the settlement and the story
  (five children on `rb_child_m2`, boys and girls, the settlement's men and women, `rb_elder_m`, `rb_sage_m`, Niko, old
  Niko, Tala, the Elder) made and dressed as the game does it and posed by its own idle and walk: standing, no leg the
  body still draws lies outside a tunic's skirt between its hem and its top; in a stride's phases at most 15% of those
  points (and 2) come through it, none deeper than 16 cm; the body under a long skirt is drawn without the legs it
  covers; every settlement person's shoes dyed a dark leather; no PARAMEDIC on a Helix technician. `--fixtures` writes
  `tests/fixtures/garment-poses.json` (the child's, a woman's and a man's bones standing and in three phases of the
  stride), in which a unit test in `tests/lastversion.test.mjs` wears the skirts of the real converted models without a
  browser: whole standing (with the old four-extent cut the child's knees come through), the legs they cover undrawn,
  leather at every settlement variant's feet, no technician lettered.
- `tests/lastversion.mjs` (browser bot): the title, NEW GAME into the Prologue, Missions 1–3
  played through (both quest chains) into Act I (since U6 Mission 1 is walked with real movement and every line
  at its own length, its time logged; the cold opens, SKIP by Enter and by a tap (a line a tap: the PREVIOUSLY card goes
  on with its next line, Mission 2's cold open is pressed through line by line to its card and the card's logline), Pryce's 05:40 line, `wrist_cut`
  and `wrist_mark`, the chase (about 180 m, followed) and the raincoat, an M1 save loading where it was taken, a Mission 3 save in the lab loading in the lab (U6 review), Rook at the chamber
  door, the excavation office, `time_<mkey>` and the case board's new sections; `LV_ONLY=prologue` stops there), then
  Acts I and II played thread by thread (U7: LVP walks each mission's objective, real movement where a straight walk
  gets there and placed elsewhere, every line at its own length, with side stories; each mission's time is its
  telemetry): a side story tracked from the case board; Mission 5's order (the river, the abandoned village's why,
  the gate, `machine_buried`) and chain B; Mission 8's confrontation (`rook_fate`) and VERSION 17; Mission 9's two
  loops with other patrols and the rain upward, then the transmitter, Rhea and the tower; Mission 10's troopers that
  see, catch and remember; Mission 11 (REVERSE: R does nothing before it is taught, the music box quieter toward its
  source, a returning gurney's setback, the unlock in the records, R and the touch ⟲ button start and release a hold,
  a year switch releases it, the refusal, the file readable only while held, a jammed bolt, a settled bolt through
  a save and a load, the lock opening Ward 32); Mission 12's chase that never fails and the Witness's stair before
  Kai's REVERSE; Mission 13's shells from each side (`ev_both_sides`) and the faction; then Acts III and IV and the Finale played
  thread by thread too (U8): Mission 14's lift car ridden 24 m up the bank with real movement, Mission 15's dual
  archive, the Museum's spiral walked from the rim to the floor, Mission 17's confession, Mission 18's pylons held and
  the slab stair climbed while it holds, Mission 19's bridge walked in 2026 (the water under it in 2049) and its
  wrapping edge, Mission 20's refusal (Mira's line) and the board's alignment (Kai's tidy line refused), Mission 21's
  elites thrown back and stuck, the arena's first gap crossed on its held slab and the second on 2196's girder,
  Mission 22's arm on its beat, the seals and the logs' second, the Finale's two holds to Ending C, its epilogue and
  the voice in every speaker; THE CASES opening the CASE FILES (fourteen stories, twelve replays) and one replayed
  from its place after the page reloads (Mission 14's garden, with the facts the run had), the save namespace, and the sound (with Chromium's autoplay policy on: the
  AudioContext runs after the first tap, a new game opens on the Prologue's and Mission 1's cards (cues
  `chapter`, `card`), the Zero Second ducks the music while the voice bus stays at 1, Ending C plays its
  cue, Kai's quote and the post-credit voice; over the whole run every line said plans from the packs,
  `__voiceMiss` is empty and `speechSynthesis` is never touched); then (the closing pass) Endings A and B, each from
  the save taken as the Finale's choice came up: loaded from the title, Kai to the ring, the choice clicked, and the
  game run by the wall clock in real time while the AudioContext plays it: its shots with Kai off screen (A: Kai in a
  body of his own under the 41's board; B: Sera on guard at the seam), every line's decoded clips started from the
  `finale` and `common` packs, the voice's output and the mix sampled (the voice heard, the music under it and between
  its lines), its cue quoting the Main Theme, the clock's ticks, the voice in every speaker and its overlay; then (the
  open-world closing pass) free roam: from the run's own save as Mission 16 arrived, loaded from the title, the map's and
  the case board's TRAVEL (fifteen places, Rain City and Helix's west wing in 2049 only), trips to Old Town in 2026 (no
  way on, no watchers, no gate, the story's threads as props; walked, a fragment read, 2196 by its key; a save taken on
  the trip, the page reloaded and the save loaded on the trip), the Broken Observatory and Rain City, each arriving under
  its FREE ROAM card with nothing of the place before over it (no fragment's count, no fragment's line), every line said
  from the packs, and BACK TO THE STORY at the checkpoint left with the objective as it was and the fragments kept; then, after an ending, a trip from the CASE FILES on the title and back to them with the
  finished save as it was (`LV_ONLY=roam` runs this alone from a new game taken to Mission 16; `LV_ROAM_SHOTS` keeps
  pictures). The
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
