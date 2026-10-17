# HALCYON: the long way up

The middle of the prologue. Station Zero is the basement of HALCYON, a city-sized arcology under glass domes. After Varga's vault recording ("she is not missing, she is later"), a service hatch leads up. Ren follows Varga's trail through four districts to the Signal Tower, and a lift brings them back down to Station Zero to install the core, wake the machine and choose.

**Play time:** about two hours for the whole prologue.
- Station Zero: about 35 minutes.
- HALCYON: 12 districts at about 7 minutes each.

## The story

| # | Chapter | District scenes | What Ren learns |
| --- | --- | --- | --- |
| 1 | **Neon Meridian**: the city under glass | 1. Varga's recorder on a rooftop. 2. A wanted screen with Ren's face; in ECHO it shows Varga's. 3. Kade, the sign fixer | Someone rewrote who the villain was. Varga went to the reactor. "The lights are a map." |
| 2 | **The Drowned Reactor** | 1. The last shift log. 2. Varga's note on a pump. 3. Chief Osei's echo | Varga flooded the reactor herself to slow the core, and bought eighteen years. |
| 3 | **The Glass Forest** | 1. The gardener's log in the canopy. 2. A memorial: "lost" in the record, "asleep" in ECHO. 3. Theo at Varga's cabin | The people of Halcyon are asleep, not dead. Ren was Varga's student, helped build the machine, then asked to forget. |
| 4 | **The Signal Tower** | 1. Varga's relay log. 2. Her last instruction to Ren. 3. Varga's echo at the beacon | Varga could have stopped the cycle at the tower, but left the choice to Ren, made awake, in Station Zero. |

## Districts (gen/ZoneGen.js)

- Each district is one open map, 72 m wide and 108 m deep, under a glass dome 22 m up.
- Spawn is at the south end. The **north gate** stays locked until the district's scene is done.
- From the second district of each chapter (and throughout the reactor), **water** cuts the map in two.
- **Drones** (the Observer's sentinels) patrol the far side. They watch floors, never the dome.
- Buildings, trees, tanks and masts are placed by a seeded generator. The avenue, the scene and the gate are always kept clear.
- Every obstacle has at least two answers:

| Obstacle | Answers |
| --- | --- |
| A scene on a roof | INVERTED: fall up to the dome, walk over, shift back to drop. ECHOES SOLIDIFY IN ECHO: climb the remembered stairs. GRAVITY FREEZES: float up. |
| Water | ECHO bridge (with ECHOES SOLIDIFY IN ECHO), or walk over it on the dome. |
| Drones | Hide behind buildings, cross on the dome, or OBSERVER FREEZES IN (a state). |

## Code

- `gen/ZoneStory.js`: the authored chapters, in the vessel's story format.
- `gen/ZoneGen.js`: the open maps.
- `world/Weather.js`: rain, storm, steam, fireflies.
- `world/materials.js` (`zoneMaterials`): lit facades, neon, wet roads, water, the starry dome, bark, industrial walls.
- `main.js`:
  - `startZones` / `enterHalcyon` / `returnToStation` run the chapters on the vessel's runtime (`world/DeckWorld.js`).
  - Saves remember where in HALCYON you are.
- `tests/halcyon.mjs`: plays every district through, checks the gates, the dome, the echo bridge, the water and the lift home.
