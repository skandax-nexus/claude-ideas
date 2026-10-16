# AFTERZERO — Art & Audio Direction (v0.2)

Feedback on v0.1: *"It plays like Doom, it's hard on the eyes, and it sounds like a horror game."*
v0.2 changes the whole presentation, in both the playable web build (`game/`) and the Unity project (`unity/`).

## Camera: third person

| Before | Now |
|---|---|
| First person, corridor tunnel vision | **Over-the-shoulder third person**: you see Ren, the room and what's around corners |
| Camera inside the head | Camera follows smoothly, **never clips through walls** (ray/sphere casts pull it in), and rises over the shoulder in cramped rooms |
| Gravity flip spun your view | Your **character** flips onto the ceiling; the camera rolls around them (or cuts instantly in Comfort mode) |

Files: `game/js/entities/Player.js`, `unity/.../Player/PlayerCamera.cs`, `PlayerAvatar.cs`.

## Look: soft, bright, low-contrast

- **Palette:** off-white panels, warm light-grey floors, sand-coloured pillars, light wood, pastel accents. Matte surfaces with no harsh specular highlights.
- **Light:** bright sky and ground ambient light plus a soft overhead "skylight" sun with soft shadows that ground every character. Room lights are warm and pale, with no red emergency lighting.
- **Reality states read as gentle moods, not darkness:** PHYSICAL = daylight blue · INVERTED = rose dusk · ECHO = mint memory.
- **No eye strain:** no dark vignette, scanlines, film grain or heavy chromatic aberration. Post-processing is mild ACES tonemapping and a light bloom.
- **Interface:** white glass cards, rounded pills, a clean sans-serif typeface, dark ink text at a comfortable size, and state indicators that use shape plus colour (■ ▲ ●).

## Characters

**v0.3:** every character is now a procedurally built human (`game/js/world/humans.js`).

- **Body:** realistic proportions, built from lofted limbs and torso on a joint skeleton.
- **Face:** sculpted, with eyes, lids that blink, brows, lips and a jaw that moves when they talk.
- **Costumes:** futuristic, with fabric weave and seams, clearcoat armour plates and glowing seam lines.
- **Cast:** Ren, Juno, Varga, the Custodian and the Other are presets. Every generated crew member gets a seeded random body, skin tone, hair, costume and palette. Echoes are rendered as holograms.
- **Cost:** about 13k triangles and 6 draw calls per character.

The table below is the v0.2 design brief that v0.3 builds on.

| Character | Design |
|---|---|
| **Ren** (you) | White suit, coral backpack, dark hair; the reality device glows in the left hand |
| **Juno Hale** | Green jacket, auburn hair; drops from the ceiling to meet you, turns to face you, talks with gestures |
| **TICK** | Round yellow drone with one big friendly eye and a spinning rotor; floats over your shoulder; the eye blinks when there's a hint for you |
| **The Custodian** | Translucent teal hologram with bright edges |
| **The Observer** | Redesigned from a dark creature into a **sleek white sentinel** with a glowing visor. Visor and vision cone colours: calm sky-blue → curious amber → coral when it spots you → lavender when frozen |
| **The Other** | Soft violet hologram, upside down |

## Music & sound: calm and melodic

The soundtrack is generated live (the web build uses WebAudio; Unity synthesises loops at startup), so it needs no audio files.

- **A warm four-chord loop at 76 BPM** with soft pads, a marimba-like pluck melody, round bass and bell tones, all in a gentle reverb.
- **Each reality state has its own key and mood:** *Daylight* (C major) · *Upside Dream* (D Lydian) · *Memory* (E♭, more bells).
- **Danger adds energy, not dread:** when the Observer is suspicious or a chase is on, the plucks get busier and the filter opens. The heartbeat and horror drones are gone.
- **Effects are musical:** a harp glissando when you shift rooms, a marimba "ding-dong" on pickups, a bell arpeggio for discoveries, a soft rising three-note figure when the Observer spots you, soft footsteps, and per-character "voice" plucks on dialogue lines. Music ducks under dialogue.

Files: `game/js/audio/Synth.js`, `unity/.../FX/AudioDirector.cs`.

## Videos

`tools/record-videos.mjs` records the real game frame by frame and renders the matching soundtrack offline with the game's own synth:

- **Gameplay trailer (57 s):** waking up, zero-g, the gravity flip, meeting Juno, the reversed shadow, rewriting a law, the Observer's hall, walking on a memory, the walls becoming windows.
- **Character showcase (39 s):** Ren, Juno, TICK, the Custodian, the Observer, the Other.

```bash
NODE_PATH=$(npm root -g) FFMPEG=/path/to/ffmpeg node tools/record-videos.mjs videos all
```
