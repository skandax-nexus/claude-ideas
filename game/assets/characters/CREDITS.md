# Character credits

| File | Model | Author | Licence |
| --- | --- | --- | --- |
| `Nova.glb` | VRM1_Constraint_Twist_Sample (slimmed with `tools/slim-vrm.py`) | pixiv Inc. — [vrm-c/vrm-specification samples](https://github.com/vrm-c/vrm-specification/tree/master/samples/VRM1_Constraint_Twist_Sample) | [VRM Public License 1.0](https://vrm.dev/licenses/1.0/) (commercial use, redistribution and modification allowed; credit not required) |
| `Michelle.glb`, `Xbot.glb` | Mixamo characters and animations, from the [three.js examples](https://github.com/mrdoob/three.js/tree/r169/examples/models/gltf) | Adobe Mixamo | Mixamo terms: royalty-free for use in games |
| `men_*.glb`, `women_*.glb` | Ultimate Modular Men / Women packs (meshopt copies from [nikitapage10/models](https://github.com/nikitapage10/models)) | [Quaternius](https://quaternius.com) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `rb_*.glb` | Avatars from the [Microsoft Rocketbox avatar library](https://github.com/microsoft/Microsoft-Rocketbox) (converted and shrunk with `tools/rocketbox-to-glb.mjs`; see the list below) | Microsoft (Rocketbox Studios) | [MIT](https://github.com/microsoft/Microsoft-Rocketbox/blob/master/LICENSE.md) (notice below) |

## Microsoft Rocketbox avatars

Each file is one avatar from `Assets/Avatars/` of the library, converted from its FBX and TGA textures: metres, welded vertices, colour textures 1024 px JPEG, normal and roughness maps 512 px, hair and lashes 1024 px PNG with alpha, accessories at half size. THE LAST VERSION OF EARTH's people (`node tools/rocketbox-to-glb.mjs --edition lastversion`) are converted the same way, its named characters at those sizes and its crowds at half (colour 512 px, normal and roughness 256 px); no one carries a gun (the pistols are left out), the soldiers' sleeve flags are painted out as blank patches, and the number 38 on `Male_Child_02`'s jersey is covered with plain cloth from the same map (`tools/rocketbox-textures.py` TRANSPLANT), and two outputs have their own maps edited (EDITS: the Elder's face aged, her hair silvered; Tomas's hair sandy and freckles on young Kai's body). FBXLoader's node extras are left out of the edition's files. The settlement's people (three thousand years ago) wear wool and linen made for their bodies in the game (`game/js/editions/lastversion/garments.js`) over these avatars' clothes.

| File | Rocketbox avatar | Used for |
| --- | --- | --- |
| `rb_ren_f.glb` | `Adults/Female_Adult_04` | Ren's look FIELD JACKET (the default); botanist, chief engineer |
| `rb_ren_m.glb` | `Adults/Male_Adult_08` | Ren's look SHIRTSLEEVES; counselor, archivist |
| `rb_juno.glb` | `Professions/Sports_Female_02` | Juno |
| `rb_pilot_f.glb` | `Professions/Pilot_Female_01` | navigator, captain; Abena Osei |
| `rb_captain_m.glb` | `Professions/Pilot_Male_01` | captain, navigator, counselor |
| `rb_doctor_f.glb` | `Professions/Medical_Female_02` | medic, cryo technician |
| `rb_doctor_m.glb` | `Professions/Medical_Male_03` | medic, cryo technician, archivist |
| `rb_engineer_m.glb` | `Professions/Construction_Male_04` | chief engineer; Kade Mori |
| `rb_office_f.glb` | `Professions/Business_Female_02` | counselor, archivist, botanist; Dr. Ilse Varga |
| `rb_gardener_m.glb` | `Professions/Gardener_Male_01` | botanist; Theo Lark |
| `rb_child_m.glb` | `Children/Male_Child_01` | THE LAST VERSION: young Kai (12) |
| `rb_mira.glb` | `Professions/Medical_Female_01` | THE LAST VERSION: Mira Varen; Dr. Lin (the same face); Ward 32's figure |
| `rb_child_f.glb` | `Children/Female_Child_01` | THE LAST VERSION: the Child in the Station |
| `rb_rook.glb` | `Professions/Business_Male_04` | THE LAST VERSION: Dr. Elias Rook |
| `rb_niko.glb` | `Adults/Male_Adult_09` | THE LAST VERSION: Niko (his own hair, long and tied back) |
| `rb_niko_old.glb` | `Adults/Male_Adult_09` | THE LAST VERSION: Niko as an old man, Mission 7's cold open (the same face aged in its maps: salt-and-pepper hair, lines, a short grey beard: `tools/rocketbox-textures.py` EDITS `age_m`) |
| `rb_jun.glb` | `Professions/Business_Male_02` | THE LAST VERSION: Jun Park |
| `rb_tala.glb` | `Adults/Female_Adult_11` | THE LAST VERSION: Tala, the water keeper |
| `rb_security_f.glb` | `Professions/Security_Female_01` | THE LAST VERSION: Officer Pryce (the pistol is left out) |
| `rb_security_m.glb` | `Professions/Security_Male_01` | THE LAST VERSION: Officer Dale |
| `rb_elder.glb` | `Adults/Female_Adult_09` | THE LAST VERSION: the Elder (her face aged and her hair silvered in her maps: `tools/rocketbox-textures.py` EDITS `age`) |
| `rb_ezra.glb` | `Adults/Male_Adult_03` | THE LAST VERSION: Ezra Moll, the Clockmaker |
| `rb_engineer_f.glb` | `Professions/Construction_Female_01` | THE LAST VERSION: Rhea Odum |
| `rb_soldier_m.glb` | `Professions/Military_Male_02` | THE LAST VERSION: Sergeant Brask (the sleeve flag is painted out) |
| `rb_odile.glb` | `Adults/Female_Adult_02` | THE LAST VERSION: Nurse Odile |
| `rb_florist.glb` | `Adults/Female_Adult_14` | THE LAST VERSION: the Florist |
| `rb_warden.glb` | `Professions/Police_Male_04` | THE LAST VERSION: the District Warden (the pistol is left out) |
| `rb_sera.glb` | `Adults/Female_Adult_07` | THE LAST VERSION: Sera Voss (and her Continuum guard disguise) |
| `rb_mara.glb` | `Professions/Business_Female_03` | THE LAST VERSION: Mara Quill, the archivist |
| `rb_iven.glb` | `Professions/Construction_Male_02` | THE LAST VERSION: Iven Marr |
| `rb_gardener_f.glb` | `Adults/Female_Adult_01` | THE LAST VERSION: the Gardener of 2196 |
| `rb_civ_f1.glb` | `Adults/Female_Adult_15` | THE LAST VERSION: commuters (2026/2049); the trapped woman |
| `rb_civ_f2.glb` | `Adults/Female_Adult_08` | THE LAST VERSION: commuters (2026/2049); the cook (M21) |
| `rb_civ_f3.glb` | `Adults/Female_Adult_12` | THE LAST VERSION: gardeners, medics, archivists (2196) |
| `rb_civ_m1.glb` | `Adults/Male_Adult_04` | THE LAST VERSION: commuters (2026/2049) |
| `rb_civ_m2.glb` | `Adults/Male_Adult_13` | THE LAST VERSION: shopkeepers, the Helix cleaner (2026/2049) |
| `rb_courier.glb` | `Professions/Delivery_Male_01` | THE LAST VERSION: couriers (2026/2049); the trapped man |
| `rb_contractor.glb` | `Professions/Construction_Male_07` | THE LAST VERSION: contractors, 2026 builders, Helix technicians |
| `rb_medic_f.glb` | `Professions/Medical_Female_03` | THE LAST VERSION: paramedics and responders; Helix technicians in slate |
| `rb_child_m2.glb` | `Children/Male_Child_02` | THE LAST VERSION: children (2049, 2196 and the settlement's boys, and its girls with a woman's hair); the toy child (the jersey's number painted out) |
| `rb_child_f2.glb` | `Children/Female_Child_02` | THE LAST VERSION: a schoolgirl of 2196 |
| `rb_trooper.glb` | `Professions/Military_Male_04` | THE LAST VERSION: Continuum troops and patrols (the sleeve flag is painted out) |
| `rb_scav.glb` | `Adults/Male_Adult_18` | THE LAST VERSION: scavengers (2196) |
| `rb_trader.glb` | `Professions/Wood_Male_01` | THE LAST VERSION: traders and engineers (2196) |
| `rb_surv_f.glb` | `Adults/Female_Adult_17` | THE LAST VERSION: gardeners, medics, archivists (2196) |
| `rb_civ_m3.glb` | `Adults/Male_Adult_14` | THE LAST VERSION: commuters, shopkeepers, transit staff, researchers, prisoners (2026/2049) |
| `rb_civ_f4.glb` | `Adults/Female_Adult_13` | THE LAST VERSION: commuters, couriers, transit staff, researchers, prisoners (2026/2049) |
| `rb_tomas.glb` | `Children/Male_Child_01` | THE LAST VERSION: Tomas Vale, Anja's son (an echo, at 1.52 m; the boy's body young Kai has, with his own sandy hair and freckles: EDITS `tomas`) |
| `rb_desk_f.glb` | `Professions/Business_Female_01` | THE LAST VERSION: Helix's receptionist |
| `rb_haig.glb` | `Adults/Female_Party_02` | THE LAST VERSION: Officer Haig's recorded statement |
| `rb_glazier.glb` | `Professions/Business_Female_04` | THE LAST VERSION: the glazier of Helix's roof (M12), the Spire (M21) and the road (M23) |
| `rb_elder_m.glb` | `Adults/Male_Adult_05` | THE LAST VERSION: the settlement's storyteller and elders |
| `rb_sage_m.glb` | `Professions/Business_Male_07` | THE LAST VERSION: the settlement's astronomer and sky-watching elders |
| `rb_vill_m.glb` | `Adults/Male_Adult_07` | THE LAST VERSION: the settlement's men |
| `rb_vill_m2.glb` | `Adults/Male_Adult_12` | THE LAST VERSION: the settlement's men |
| `rb_vill_f.glb` | `Adults/Female_Adult_05` | THE LAST VERSION: the settlement's women (and its girls' hair) |
| `rb_vill_f2.glb` | `Adults/Female_Adult_03` | THE LAST VERSION: the settlement's women (and its girls' hair) |

The crew never wear the model Ren is wearing.

```
MIT License

Copyright (c) 2020 Microsoft

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
