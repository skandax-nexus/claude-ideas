# Character credits

| File | Model | Author | Licence |
| --- | --- | --- | --- |
| `Nova.glb` | VRM1_Constraint_Twist_Sample (slimmed with `tools/slim-vrm.py`) | pixiv Inc. — [vrm-c/vrm-specification samples](https://github.com/vrm-c/vrm-specification/tree/master/samples/VRM1_Constraint_Twist_Sample) | [VRM Public License 1.0](https://vrm.dev/licenses/1.0/) (commercial use, redistribution and modification allowed; credit not required) |
| `Michelle.glb`, `Xbot.glb` | Mixamo characters and animations, from the [three.js examples](https://github.com/mrdoob/three.js/tree/r169/examples/models/gltf) | Adobe Mixamo | Mixamo terms: royalty-free for use in games |
| `men_*.glb`, `women_*.glb` | Ultimate Modular Men / Women packs (meshopt copies from [nikitapage10/models](https://github.com/nikitapage10/models)) | [Quaternius](https://quaternius.com) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `rb_*.glb` | Avatars from the [Microsoft Rocketbox avatar library](https://github.com/microsoft/Microsoft-Rocketbox) (converted and shrunk with `tools/rocketbox-to-glb.mjs`; see the list below) | Microsoft (Rocketbox Studios) | [MIT](https://github.com/microsoft/Microsoft-Rocketbox/blob/master/LICENSE.md) (notice below) |

## Microsoft Rocketbox avatars

Each file is one avatar from `Assets/Avatars/` of the library, converted from its FBX and TGA textures: metres, welded vertices, colour textures 1024 px JPEG, normal and roughness maps 512 px, hair and lashes 1024 px PNG with alpha, accessories at half size.

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
