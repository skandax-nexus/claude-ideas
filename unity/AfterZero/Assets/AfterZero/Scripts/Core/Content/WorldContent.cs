// AFTERZERO - the vessel, as data. Unity coordinates: +x east, +y up, +z north.
// Decal RotY = direction the text faces (0 = faces +z / north).
// See docs/unity/WORLD_MAPS.md for annotated plans.
//
//                        ARCHIVE (z 22..56)
//                              |
//   OBSERVATION HALL ---- LAB HUB ---- DORMITORY ---- SPINE (60 m) ---> REACTOR CROWN ---> CORE
//   (x -70..-22)        (-16..16)     (22..62)       (66..90)          (y 52, x 96..150)  (150..172)
//                              |
//                        CRADLE (start)
using static AfterZero.Core.Effect;

namespace AfterZero.Core.Content
{
    public static class WorldContent
    {
        const float Lo = -30f, Hi = 30f;

        public static Blueprint Build()
        {
            var b = new Blueprint();
            Cradle(b);
            Lab(b);
            Hall(b);
            Archive(b);
            Dormitory(b);
            Spine(b);
            Crown(b);
            Core(b);
            Memories(b);
            return b;
        }

        static (float, float, float, float)[] O(params (float, float, float, float)[] o) => o;
        static LightDef Light(float x, float y, float z, string c, float i, float r, bool flicker = false) =>
            new LightDef { X = x, Y = y, Z = z, Color = c, Intensity = i, Range = r, Flicker = flicker };

        // ---------------------------------------------------------------------------
        // CRADLE - "The Unknown". No instructions, a floating object.
        // ---------------------------------------------------------------------------
        static void Cradle(Blueprint b)
        {
            var r = b.Room("cradle", "CRADLE", "I", new[] { 0f, 0.86f, -31f, 0f },
                new Box(-5, Lo, -34, 5, Hi, -23.6f), new Box(-1.5f, Lo, -23.6f, 1.5f, Hi, -16));
            r.Locked = true;
            r.Tint = "#8070ff";
            r.Lights.Add(Light(0, 4.2f, -29, "#8a6cff", 3f, 14));
            r.Lights.Add(Light(0, 4.2f, -20, "#6a7cff", 1.5f, 8));

            b.Shell("cradle", new Box(-5, 0, -34, 5, 5, -24), new Blueprint.ShellOptions
            {
                Open = { ['N'] = O((-1.5f, 1.5f, 0, 5)) }, Strip = "stripViolet",
            });
            b.Add("cradle", -1.5f, 0, -24, 1.5f, 5, -23.6f, "wallDark", when: "!@INVERTED", id: "cradle_seal");
            b.Corridor("cradle", 'z', new Box(-1.5f, 0, -23.6f, 1.5f, 5, -16.4f));
            for (float z = -22.6f; z < -16.4f; z += 1.4f) b.Add("cradle", -1.5f, 4.7f, z, 1.5f, 5, z + 0.2f, "stripViolet", solid: false);
            foreach (var (x, z, s) in new[] { (-3.6f, -26.2f, 0.5f), (3.8f, -27f, 0.6f), (-3.2f, -31.8f, 0.4f), (3.4f, -31f, 0.7f), (1f, -25.2f, 0.3f) })
                b.Add("cradle", x - s / 2, 0, z - s / 2, x + s / 2, s, z + s / 2, "crate", solid: false).Tag = "drift";

            b.Text("cradle", "SUBJECT HOLDING  -  CYCLE 42", 0, 3.6f, -33.95f, 0, 0.32f, "#b9a8ff");
            b.Text("cradle", "YOU HAVE BEEN HERE BEFORE", 0, 4.95f, -28, 0, 0.42f, "#ff8ad8", ceiling: true);

            b.Interactables.Add(new InteractableDef { Id = "shard", Room = "cradle", Kind = "shard", Prompt = "TOUCH", X = 0, Y = 1.7f, Z = -28, Radius = 2.8f, When = "!has_device" });
            b.Interactables.Add(new InteractableDef { Id = "other", Room = "cradle", Kind = "other", X = 0, Y = 5f, Z = -19.5f, Radius = 0, When = "shard_touch >= 2 && !other_gone" });
        }

        // ---------------------------------------------------------------------------
        // LAB - the hub. Changes meaning as the story progresses.
        // ---------------------------------------------------------------------------
        static void Lab(Blueprint b)
        {
            var r = b.Room("lab", "LABORATORY", "I", new[] { 0f, 0.86f, -12f, 0f },
                new Box(-16, Lo, -16, 16, Hi, 16), new Box(16, Lo, -9.5f, 22, Hi, -6.5f));
            r.Lights.Add(Light(0, 10.5f, 0, "#cfe6ff", 4f, 30));
            r.Lights.Add(Light(-10, 6, 8, "#ffd29a", 2.4f, 16));
            r.Lights.Add(Light(10, 6, -8, "#9fd8ff", 2.2f, 16));
            r.Lights.Add(Light(19, 2.6f, -8, "#9b7bff", 1.6f, 7));

            b.Shell("lab", new Box(-16, 0, -16, 16, 12, 16), new Blueprint.ShellOptions
            {
                Open =
                {
                    ['S'] = O((-1.5f, 1.5f, 0, 5)),
                    ['W'] = O((-2, 2, 0, 4.5f)),
                    ['N'] = O((-2, 2, 0, 4.5f)),
                    ['E'] = O((-9.5f, -6.5f, 0, 3), (-2, 2, 0, 4.5f)),
                },
                WallMat = { ['E'] = "glass", ['S'] = "glass" },
                Lining = { ['E'] = "!machine_activated", ['S'] = "!machine_activated" },
                Strip = "stripCool",
            });
            b.Add("lab", -1.5f, 0, -16.4f, 1.5f, 5, -16, "door", when: "left_cradle");
            b.Add("lab", -2, 0, 16, 2, 4.5f, 16.4f, "doorArchive", when: "!archive_open", id: "archive_door");
            b.Add("lab", 16, 0, -2, 16.4f, 4.5f, 2, "doorSecurity", when: "!lockdown", id: "dorm_door");
            b.Add("lab", 16, 0, -9.5f, 16.4f, 3, -6.5f, "wall", when: "!shadow_passage_open", id: "shadow_panel");
            b.Add("lab", 15.9f, 3, -9.6f, 15.93f, 3.06f, -6.4f, "stripFaint", when: "!shadow_passage_open", solid: false);
            b.Add("lab", 15.9f, 0, -9.6f, 15.93f, 3.06f, -9.54f, "stripFaint", when: "!shadow_passage_open", solid: false);
            b.Add("lab", 15.9f, 0, -6.46f, 15.93f, 3.06f, -6.4f, "stripFaint", when: "!shadow_passage_open", solid: false);

            // the Machine
            b.Add("lab", -2.5f, 0, -2.5f, 2.5f, 1, 2.5f, "metal", id: "machine_base");
            b.Add("lab", -0.6f, 1, -2.5f, 0.6f, 1.2f, -1.9f, "accent", solid: false);
            // furniture
            b.Add("lab", -11, 0, 9, -9, 1, 10, "metal");                // R1 console
            b.Add("lab", -15.6f, 0, -12, -14.6f, 4, -4, "shelf");
            b.Add("lab", 8, 0, -9, 12, 0.9f, -7, "metal");              // desk with the key's memory
            b.Add("lab", -10, 0, -10, -5, 1, -8.6f, "metal");
            b.Add("lab", 5, 0, 8, 9, 1, 9.2f, "metal");
            b.Add("lab", -14, 0, 12, -12.6f, 1.4f, 13.4f, "crate");
            b.Add("lab", -12.4f, 0, 12.4f, -11.4f, 0.9f, 13.4f, "crate");
            b.Add("lab", 12, 0, 12, 13.6f, 1.6f, 13.6f, "crate");
            b.Add("lab", -15.6f, 11.4f, -1, 15.6f, 11.6f, 1, "metal", solid: false); // gantry
            // ceiling alcove around the PERSISTS token
            b.Add("lab", -12, 10.4f, 11.8f, -6, 12, 12, "metal");
            b.Add("lab", -12, 10.4f, 6, -6, 12, 6.2f, "metal");
            b.Add("lab", -12.2f, 10.4f, 6, -12, 12, 12, "metal");

            // echo layer
            for (int i = 0; i < 6; i++)
            {
                float z = -14.5f + i * 2.1f, x = i % 2 == 0 ? -0.4f : 0.5f;
                b.Add("lab", x - 0.35f, 0, z, x + 0.35f, 0.02f, z + 0.6f, echo: true, solid: false);
            }
            b.Add("lab", -15, 0.9f, -3.5f, -14.6f, 3.2f, -1, echo: true, solid: false);
            b.Text("lab", "THE ROOM REMEMBERS", 0, 7, 15.95f, 180, 1.0f, "#5ff", echo: true);
            b.Text("lab", "STAND WHERE IT ISN'T", 15.88f, 4.5f, -4.5f, 270, 0.6f, "#5ff", echo: true);
            b.Text("lab", "DO NOT ACTIVATE", -15.95f, 6, 4, 90, 0.8f, "#5ff", echo: true);
            b.Text("lab", "LAB 0  -  FIELD CONTAINMENT", 0, 8, -15.88f, 0, 0.55f, "#cfe6ff", when: "!machine_activated");
            b.Text("lab", "VESSEL AFTERZERO  -  LIFE SUPPORT: 1 OCCUPANT", 0, 8, -15.88f, 0, 0.5f, "#ffb36a", when: "machine_activated");
            b.Text("lab", "ARCHIVE", 0, 5.4f, 15.95f, 180, 0.45f);
            b.Text("lab", "OBSERVATION", -15.95f, 5.4f, 0, 90, 0.45f, "#ff8a7a");
            b.Text("lab", "DORMITORY  -  SEALED BY ORDER OF CMDR. BAEL", 15.88f, 5.4f, 0, 270, 0.4f, "#ff6a5a", when: "!lockdown");

            // shadow passage (behind the east wall)
            b.Shell("lab", new Box(16.4f, 0, -9.5f, 22, 3, -6.5f), new Blueprint.ShellOptions { Skip = { 'W' }, Strip = "stripViolet" });
            b.Add("lab", 21.2f, 0, -8.6f, 21.9f, 1.1f, -7.4f, "metal");
            b.Text("lab", "RECORDING 0", 21.95f, 1.9f, -8, 270, 0.3f, "#c9b8ff");

            b.Interactables.Add(new InteractableDef { Id = "r1", Room = "lab", Kind = "terminal", Prompt = "PLAY RECORDING", X = -10, Y = 1.3f, Z = 8.3f });
            b.Interactables.Add(new InteractableDef { Id = "machine", Room = "lab", Kind = "machine", Prompt = "MACHINE", X = 0, Y = 1.3f, Z = -2.9f, Radius = 2.6f });
            b.Interactables.Add(new InteractableDef { Id = "archive_lock", Room = "lab", Kind = "panel", Prompt = "ARCHIVE PANEL", X = 3.5f, Y = 1.4f, Z = 15.7f, When = "!archive_open" });
            b.Interactables.Add(new InteractableDef { Id = "shadow", Room = "lab", Kind = "shadow", Prompt = "TOUCH THE SHADOW", X = 15, Y = 1, Z = 0, When = "@ECHO && !shadow_passage_open" });
            b.Interactables.Add(new InteractableDef { Id = "r0", Room = "lab", Kind = "terminal", Prompt = "PLAY RECORDING 0", X = 20.8f, Y = 1.3f, Z = -8 });
            b.Items.Add(new ItemDef { Id = "key", Room = "lab", Label = "LABORATORY KEY", X = 10, Y = 1.05f, Z = -8, Echo = true, When = "!archive_open" });
            b.Tokens.Add(new TokenDef { Token = "HELD", Room = "lab", X = 18.6f, Y = 1.1f, Z = -8 });
            b.Tokens.Add(new TokenDef { Token = "PERSISTS", Room = "lab", X = -9, Y = 11.15f, Z = 9 });

            b.Triggers.Add(new TriggerDef { Id = "enter_lab", Room = "lab", Box = new Box(-15, -5, -15, 15, 20, 14), Then = new[] { SetFact("left_cradle") } });
            b.Triggers.Add(new TriggerDef { Id = "juno_drop", Room = "lab", When = "!met_juno", Box = new Box(-15, -5, -12, 15, 20, 14), Then = new[] { Fire("juno_drop") } });

            // End of Act I: Bael's Wardens pour in through the archive door. They can't see the ceiling.
            b.Chases.Add(new ChaseDef
            {
                Id = "lockdown", Room = "lab", Kind = "drones", StartWhen = "lockdown && !act2", EndWhen = "act2",
                Count = 3, Speed = 4.6f, StartX = 0, Y = 7, Z = 13, Checkpoint = new[] { 0f, 0.86f, -8f, 0f },
            });
        }

        // ---------------------------------------------------------------------------
        // OBSERVATION HALL - the Observer's territory.
        // ---------------------------------------------------------------------------
        static void Hall(Blueprint b)
        {
            var r = b.Room("hall", "OBSERVATION HALL", "I", new[] { -19f, 0.86f, 0f, 270f },
                new Box(-70, Lo, -12, -22, Hi, 12), new Box(-22, Lo, -2, -16, Hi, 2));
            r.Tint = "#ff6050";
            r.Ambience = "dread";
            r.FogDensity = 0.03f;
            foreach (var x in new[] { -30f, -44f, -58f }) r.Lights.Add(Light(x, 8.5f, 0, "#ff5a4a", 3f, 24, true));
            r.Lights.Add(Light(-40, 2, 9, "#6a4a8a", 1.4f, 14));

            b.Shell("hall", new Box(-70, 0, -12, -22, 10, 12), new Blueprint.ShellOptions { Open = { ['E'] = O((-2, 2, 0, 4.5f)) }, Strip = "stripRed", Wall = "wallDark" });
            b.Corridor("hall", 'x', new Box(-21.6f, 0, -2, -16.4f, 4.5f, 2), "wallDark");

            var zone = new HuntZone
            {
                Id = "hall", Room = "hall", Area = new Box(-70, 0, -12, -16, 10, 12), EntranceX = -25, FarX = -63,
                Spawn = new[] { -58f, 0f, 0f }, Tether = new[] { 153f, 52f, 4f },
                Lanes = { ["north"] = (2.4f, 12f), ["centre"] = (-2.4f, 2.4f), ["south"] = (-12f, -2.4f) },
            };
            int n = 0;
            foreach (var x in new[] { -27f, -35f, -43f, -51f, -59f, -65f })
                foreach (var z in new[] { -6f, 6f })
                    zone.Cover.Add(new CoverDef { Id = "p" + (++n), X = x, Z = z });
            foreach (var x in new[] { -31f, -47f, -55f }) zone.Cover.Add(new CoverDef { Id = "p" + (++n), X = x, Z = 0 });
            foreach (var p in zone.Cover)
            {
                b.Add("hall", p.X - p.Half, 0, p.Z - p.Half, p.X + p.Half, 10, p.Z + p.Half, "pillar", id: p.Id);
                b.Add("hall", p.X - p.Half - 0.02f, 2, p.Z - p.Half - 0.02f, p.X + p.Half + 0.02f, 2.1f, p.Z + p.Half + 0.02f, "stripRed", solid: false);
            }
            b.HuntZones.Add(zone);

            b.Add("hall", -67.6f, 0, -0.6f, -66.4f, 1, 0.6f, "metal"); // core pedestal
            b.Text("hall", "OBSERVATION HALL  -  DO NOT RUN", -22.05f, 6, 0, 270, 0.45f, "#ff8a7a");
            b.Text("hall", "IT ONLY KNOWS WHAT YOU TEACH IT", -69.95f, 5, 0, 90, 0.8f, "#5ff", echo: true);
            b.Text("hall", "17 WAS HERE", -42.08f, 1.6f, 6, 90, 0.5f, "#5ff", echo: true);

            b.Items.Add(new ItemDef { Id = "core", Room = "hall", Label = "POWER CORE", X = -67, Y = 1.35f, Z = 0, When = "!core_installed" });
            b.Tokens.Add(new TokenDef { Token = "OBSERVER", Room = "hall", X = -25, Y = 1.1f, Z = 9 });
            b.Tokens.Add(new TokenDef { Token = "FREEZES", Room = "hall", X = -67, Y = 1.1f, Z = -9 });
            b.Triggers.Add(new TriggerDef { Id = "hall_seen", Room = "hall", Box = new Box(-70, -5, -12, -22, 20, 12), Then = new[] { SetFact("hall_seen") } });
            b.Triggers.Add(new TriggerDef { Id = "pell_name", Room = "hall", When = "@ECHO && quest_pell && !pell_name_seen", Box = new Box(-47, -1, 2, -38, 5, 10), Then = new[] { SetFact("pell_name_seen"), LogEntry("\"17 WAS HERE.\" Pell was real.") } });
        }

        // ---------------------------------------------------------------------------
        // ARCHIVE - "The laboratory has never existed."
        // ---------------------------------------------------------------------------
        static void Archive(Blueprint b)
        {
            var r = b.Room("archive", "ARCHIVE", "I", new[] { 0f, 0.86f, 24f, 0f },
                new Box(-14, Lo, 22, 14, Hi, 56), new Box(-2, Lo, 16, 2, Hi, 22));
            r.Tint = "#60f0d0";
            r.KillY = -6;
            r.Lights.Add(Light(0, 7.5f, 27, "#5af0d0", 3f, 22));
            r.Lights.Add(Light(0, 7.5f, 50, "#5ad0f0", 2.6f, 18));
            r.Lights.Add(Light(0, -5, 38, "#2060ff", 2f, 14));

            b.Shell("archive", new Box(-14, 0, 22, 14, 9, 56), new Blueprint.ShellOptions { Open = { ['S'] = O((-2, 2, 0, 4.5f)) }, NoFloor = true, Strip = "stripTeal" });
            b.Corridor("archive", 'z', new Box(-2, 0, 16.4f, 2, 4.5f, 21.6f));
            b.Add("archive", -14.4f, -0.4f, 21.6f, 14.4f, 0, 34, "floor");
            b.Add("archive", -14.4f, -0.4f, 42, 14.4f, 0, 56.4f, "floor");
            // the gap
            b.Add("archive", -14, -8.4f, 34, 14, -8, 42, "floorDark");
            b.Add("archive", -14.4f, -8, 34, -14, 0, 42, "wallDark");
            b.Add("archive", 14, -8, 34, 14.4f, 0, 42, "wallDark");
            b.Add("archive", -14, -8, 33.6f, 14, -0.4f, 34, "wallDark");
            b.Add("archive", -14, -8, 42, 14, -0.4f, 42.4f, "wallDark");
            b.Add("archive", -1.5f, -0.25f, 34, 1.5f, 0, 42, echo: true, id: "echo_bridge");
            b.Add("archive", -14, 2.6f, 37.8f, 14, 9, 38.2f, "shelf"); // blocks the ceiling route
            foreach (var x in new[] { -12f, -9f, 9f, 12f }) b.Add("archive", x - 0.5f, 0, 23.5f, x + 0.5f, 5, 31, "shelf");
            b.Add("archive", -1, 0, 53.6f, 1, 1, 54.6f, "metal");
            foreach (var x in new[] { -10f, 10f }) b.Add("archive", x - 1.2f, 0, 54.6f, x + 1.2f, 4, 55.6f, "shelf");
            b.Text("archive", "NO RECORD OF LABORATORY", 0, 6, 55.95f, 180, 0.55f, "#7ff0d0", when: "!custodian_remembers");
            b.Text("archive", "RECORDS RESTORED: LABORATORY (2 VISITS)", 0, 6, 55.95f, 180, 0.5f, "#7ff0d0", when: "custodian_remembers");
            b.Text("archive", "MEMORY IS LOAD-BEARING", 0, 2.6f, 33.9f, 0, 0.55f, "#5ff", echo: true);

            b.Interactables.Add(new InteractableDef { Id = "r2", Room = "archive", Kind = "terminal", Prompt = "PLAY RECORDING", X = 0, Y = 1.3f, Z = 53 });
            b.Tokens.Add(new TokenDef { Token = "ALL", Room = "archive", X = -8, Y = 1.1f, Z = 51 });
            b.Triggers.Add(new TriggerDef { Id = "archive_seen", Room = "archive", Box = new Box(-14, -5, 22, 14, 20, 34), Then = new[] { SetFact("archive_seen") } });
        }

        // ---------------------------------------------------------------------------
        // DORMITORY OF CYCLES - Act II hub. Warm, safe, full of people with your face.
        // ---------------------------------------------------------------------------
        static void Dormitory(Blueprint b)
        {
            var r = b.Room("dorm", "DORMITORY OF CYCLES", "II", new[] { 26f, 0.86f, 0f, 90f },
                new Box(22, Lo, -14, 62, Hi, 14), new Box(16, Lo, -2, 22, Hi, 2));
            r.Tint = "#ffb070";
            r.Ambience = "warm";
            r.FogDensity = 0.015f;
            foreach (var x in new[] { 30f, 42f, 54f }) r.Lights.Add(Light(x, 4.5f, 0, "#ffb070", 3f, 16));
            r.Lights.Add(Light(36, 1.2f, 0, "#ff8a40", 1.8f, 6, true)); // the "campfire" heater

            b.Shell("dorm", new Box(22, 0, -14, 62, 6, 14), new Blueprint.ShellOptions
            {
                Open = { ['W'] = O((-2, 2, 0, 4.5f)), ['E'] = O((-2, 2, 0, 4)) }, Strip = "stripWarm", Wall = "wallWarm",
            });
            b.Corridor("dorm", 'x', new Box(16.4f, 0, -2, 21.6f, 4.5f, 2));
            b.Add("dorm", 21.6f, 0, -2, 22, 4.5f, 2, "door", when: "act2"); // slams behind you
            b.Add("dorm", 62, 0, -2, 62.4f, 4, 2, "door", when: "!learned_cycle", id: "spine_hatch");

            int[] cycles = { 3, 9, 11, 17, 22, 26, 30, 33, 36, 38, 40, 42 };
            for (int i = 0; i < 6; i++)
            {
                float x = 26 + i * 6;
                foreach (var side in new[] { 1, -1 })
                {
                    float z0 = side > 0 ? 11 : -13.6f, z1 = side > 0 ? 13.6f : -11;
                    b.Add("dorm", x - 1, 0, z0, x + 1, 0.8f, z1, "bunk");
                    b.Add("dorm", x - 1, 1.9f, z0, x + 1, 2.1f, z1, "bunk");
                    b.Add("dorm", x - 1.05f, 0, side > 0 ? 13.4f : -13.6f, x + 1.05f, 2.4f, side > 0 ? 13.6f : -13.4f, "metal");
                    int c = cycles[i * 2 + (side > 0 ? 0 : 1)];
                    b.Text("dorm", c.ToString(), x, 2.8f, side > 0 ? 13.35f : -13.35f, side > 0 ? 180 : 0, 0.5f, c == 42 ? "#ffffff" : "#ffb070");
                }
            }
            b.Add("dorm", 34, 0, -1.5f, 38, 0.9f, 1.5f, "crate"); // table
            b.Text("dorm", "WE STAYED", 61.95f, 4, 6, 270, 0.6f, "#ffd0a0");
            b.Text("dorm", "THEY WENT INTO THE MACHINE: 1 2 4 5 6 7 8 10 12 13 14 15 16 18 19 20 21 23 24 25 27 28 29 31 32 34 35 37 39 41", 42, 4.2f, -13.95f, 0, 0.22f, "#5ff", echo: true);

            // bunk 42 is the last pair's south bunk (x = 56, z = -12)
            b.Interactables.Add(new InteractableDef { Id = "bunk42", Room = "dorm", Kind = "bunk", Prompt = "BUNK 42", X = 56, Y = 1, Z = -10.8f, When = "!seen_bunk42" });
            b.Triggers.Add(new TriggerDef { Id = "act2", Room = "dorm", When = "lockdown && !act2", Box = new Box(26, -5, -14, 62, 10, 14), Then = new[] { SetFact("act2"), Play("act2_safe") } });
        }

        // ---------------------------------------------------------------------------
        // HYDROPONIC SPINE - a 60 m shaft. Fall up, fall down, outrun the rising Undertow.
        // ---------------------------------------------------------------------------
        static void Spine(Blueprint b)
        {
            var r = b.Room("spine", "HYDROPONIC SPINE", "II", new[] { 68f, 0.86f, 0f, 90f },
                new Box(66, Lo, -12, 90, 70, 12), new Box(62, Lo, -2, 66, Hi, 2));
            r.Tint = "#80ffa0";
            r.Ambience = "wind";
            r.KillY = -10;
            r.FogDensity = 0.012f;
            for (float y = 6; y < 60; y += 14) r.Lights.Add(Light(78, y, 0, y > 40 ? "#a0d0ff" : "#80ffa0", 3f, 22));

            b.Shell("spine", new Box(66, 0, -12, 90, 60, 12), new Blueprint.ShellOptions
            {
                Open = { ['W'] = O((-2, 2, 0, 4)), ['E'] = O((-2, 2, 52, 56.5f)) }, Wall = "wallGreen", Strip = "stripGreen",
            });
            b.Corridor("spine", 'x', new Box(62.4f, 0, -2, 66, 4, 2), "wallGreen");
            // the tray: a hydroponic floor at 28 m with one gap in the north-east corner
            b.Add("spine", 66, 28, -12, 90, 28.6f, 6, "tray");
            b.Add("spine", 66, 28, 6, 84, 28.6f, 12, "tray");
            // planters on the tray (cover + decoration)
            for (float x = 69; x < 88; x += 5) b.Add("spine", x, 28.6f, -11, x + 2, 29.4f, -7, "planter");
            // vines hanging under the tray: memory-geometry
            for (float x = 70; x < 84; x += 4) b.Add("spine", x, 14, -1, x + 0.2f, 28, -0.8f, echo: true, solid: false);
            // landing at the top, under the east exit
            b.Add("spine", 84, 51.4f, -4, 90, 52, 4, "metal", id: "spine_landing");
            b.Text("spine", "CROWN ACCESS", 89.95f, 57.5f, 0, 270, 0.5f, "#a0d0ff");
            b.Text("spine", "FALL UP", 66.05f, 6, 6, 90, 0.8f, "#5ff", echo: true);
            b.Text("spine", "FALL DOWN WHERE YOU WANT TO LAND", 78, 58, 11.95f, 180, 0.5f, "#5ff", echo: true);

            b.Tokens.Add(new TokenDef { Token = "SLOWS", Room = "spine", X = 78, Y = 27.15f, Z = -6 });
            b.Interactables.Add(new InteractableDef { Id = "launch_log", Room = "spine", Kind = "terminal", Prompt = "READ LAUNCH LOG", X = 88.2f, Y = 53.3f, Z = -3, When = "!has_launch_log" });

            b.Triggers.Add(new TriggerDef { Id = "spine_entered", Room = "spine", Box = new Box(66, -5, -12, 90, 70, 12), Then = new[] { SetFact("spine_entered"), Play("spine_rise") }, When = "!spine_entered" });
            b.Triggers.Add(new TriggerDef { Id = "tick_name", Room = "spine", When = "!tick_named", Box = new Box(66, 18, -12, 90, 40, 12), Then = new[] { SetFact("tick_named"), Play("tick_name") } });
            b.Triggers.Add(new TriggerDef { Id = "spine_top", Room = "spine", Box = new Box(84, 51, -4, 90, 58, 4), Then = new[] { SetFact("spine_top") } });

            b.Chases.Add(new ChaseDef
            {
                Id = "spine_undertow", Room = "spine", Kind = "rise", StartWhen = "spine_entered && !spine_top", EndWhen = "spine_top",
                StartX = -14, EndX = 50, Speed = 0.9f, Checkpoint = new[] { 68f, 0.86f, 0f, 90f },
            });
        }

        // ---------------------------------------------------------------------------
        // REACTOR CROWN - Act III. The corridor un-happens behind you.
        // ---------------------------------------------------------------------------
        static void Crown(Blueprint b)
        {
            var r = b.Room("crown", "REACTOR CROWN", "III", new[] { 93f, 52.86f, 0f, 90f },
                new Box(90, 40, -2, 96, 70, 2), new Box(96, 40, -8, 150, 70, 8));
            r.Tint = "#ff9050";
            r.Ambience = "storm";
            r.KillY = 44;
            foreach (var x in new[] { 100f, 116f, 132f, 146f }) r.Lights.Add(Light(x, 60, 0, "#ff9050", 3f, 20, true));

            b.Shell("crown", new Box(96, 52, -8, 150, 62, 8), new Blueprint.ShellOptions
            {
                Open = { ['W'] = O((-2, 2, 52, 56.5f)), ['E'] = O((-3, 3, 52, 57)) }, NoFloor = true, Wall = "wallDark", Strip = "stripOrange",
            });
            b.Corridor("crown", 'x', new Box(90.4f, 52, -2, 96, 56.5f, 2), "wallDark");
            // floor with two gaps
            b.Add("crown", 96, 51.6f, -8.4f, 104, 52, 8.4f, "floor");
            b.Add("crown", 112, 51.6f, -8.4f, 126, 52, 8.4f, "floor");
            b.Add("crown", 134, 51.6f, -8.4f, 150.4f, 52, 8.4f, "floor");
            // G1 (104..112): ceiling route, or a shadow bridge for those who carry SHADOWS
            b.Elements.Add(new Element { Room = "crown", Box = new Box(104, 51.75f, -1.2f, 112, 52, 1.2f), Shadow = true, Mat = "shadow", Id = "shadow_bridge" });
            // hanging stacks force you back to the floor between the gaps
            b.Add("crown", 118, 54.5f, -8, 118.4f, 62, 8, "shelf");
            // G2 (126..134): only memory crosses it, and the ceiling is blocked
            b.Add("crown", 129.8f, 54.5f, -8, 130.2f, 62, 8, "shelf");
            b.Add("crown", 126, 51.75f, -1.5f, 134, 52, 1.5f, echo: true, id: "crown_bridge");
            // field anchor: the Undertow stops here
            b.Add("crown", 136, 52, -8, 136.3f, 52.1f, 8, "stripCool", solid: false);
            b.Add("crown", 146, 52, -8, 146.4f, 62, 8, "forcefield", when: "!bael_resolved", id: "bael_barrier");
            b.Text("crown", "FIELD ANCHOR", 136.2f, 60, 7.9f, 180, 0.5f, "#7fd8ff");

            b.Triggers.Add(new TriggerDef { Id = "crown_entered", Room = "crown", When = "!crown_entered", Box = new Box(92, 40, -8, 150, 70, 8), Then = new[] { SetFact("crown_entered"), Play("crown_enter") } });
            b.Chases.Add(new ChaseDef
            {
                Id = "crown_undertow", Room = "crown", Kind = "undertow", StartWhen = "crown_entered && !crown_safe", EndWhen = "crown_safe",
                StartX = 90, EndX = 135.5f, Speed = 2.0f, Y = 52, Checkpoint = new[] { 93f, 52.86f, 0f, 90f },
            });
            b.Triggers.Add(new TriggerDef { Id = "crown_safe", Room = "crown", Box = new Box(136.3f, 40, -8, 150, 70, 8), Then = new[] { SetFact("crown_safe") } });
            b.Chases.Add(new ChaseDef
            {
                Id = "bael_wardens", Room = "crown", Kind = "drones", StartWhen = "bael_fight && !bael_resolved", EndWhen = "bael_resolved",
                Count = 4, Speed = 5f, StartX = 146, Y = 58, Z = 0, Checkpoint = new[] { 138f, 52.86f, 0f, 90f },
            });
        }

        // ---------------------------------------------------------------------------
        // THE CORE - where time is thin. Varga, the brain, the Observer, the choice.
        // ---------------------------------------------------------------------------
        static void Core(Blueprint b)
        {
            var r = b.Room("core", "THE CORE", "III", new[] { 152f, 52.86f, 0f, 90f }, new Box(150, 40, -10, 172, 70, 10));
            r.Tint = "#ff8ac0";
            r.Ambience = "heart";
            r.Lights.Add(Light(160, 58, 0, "#ff8ac0", 4f, 22));
            r.Lights.Add(Light(166, 54, 6, "#ffc27a", 2f, 10));

            // the west wall is shared with the Crown's east wall; only fill what the Crown doesn't cover
            b.Shell("core", new Box(150.4f, 52, -10, 172, 66, 10), new Blueprint.ShellOptions { Skip = { 'W' }, WallMat = { ['E'] = "glass" }, Strip = "stripPink" });
            b.Add("core", 150, 52, -10, 150.4f, 66, -8);
            b.Add("core", 150, 52, 8, 150.4f, 66, 10);
            b.Add("core", 150, 62, -8, 150.4f, 66, 8);
            b.Add("core", 158, 52, -2, 162, 52.6f, 2, "metal");
            b.Add("core", 158, 52.6f, -2, 162, 57, 2, "glass", solid: true);
            b.Add("core", 155.5f, 52, -4.6f, 156.5f, 53.1f, -3.4f, "metal"); // decision terminal

            b.Interactables.Add(new InteractableDef { Id = "core_terminal", Room = "core", Kind = "terminal", Prompt = "THE CHOICE", X = 155.2f, Y = 53.4f, Z = -4, When = "core_entered" });
            b.Interactables.Add(new InteractableDef { Id = "brain", Room = "core", Kind = "brain", Prompt = "LOOK CLOSER", X = 160, Y = 55, Z = 0, Radius = 3.6f });
            b.Triggers.Add(new TriggerDef { Id = "core_entered", Room = "core", When = "!core_entered", Box = new Box(153, 40, -10, 172, 70, 10), Then = new[] { SetFact("core_entered"), Play("core_enter") } });
        }

        // ---------------------------------------------------------------------------
        // MEMORY FRAGMENTS - Ren's life, 12 pieces. Reward exploration of every state.
        // ---------------------------------------------------------------------------
        static void Memories(Blueprint b)
        {
            void M(string id, string room, float x, float y, float z, string title, string text, bool echo = false) =>
                b.Memories.Add(new MemoryDef { Id = id, Room = room, X = x, Y = y, Z = z, Title = title, Text = text, Echo = echo });

            M("m01", "cradle", 3.5f, 4.15f, -32, "First Steps", "Mum filmed me walking on the lab ceiling in a gravity harness. I was four. I laughed so hard I was sick.");
            M("m02", "lab", 9, 1.3f, -8.4f, "Toaster", "I built a drone out of a toaster and a smoke alarm. It ticked when it thought. So: TICK.", echo: true);
            M("m03", "lab", -11, 11.15f, 7, "Halo", "Mum let me name the machine. I called it Halo. She called it the Anchor and pretended I didn't hear.");
            M("m04", "lab", 19, 1.2f, -7, "Shadow Puppets", "I made shadow puppets on the lab wall. Mum said they looked like they were trying to get out.");
            M("m05", "hall", -50, 9.15f, -9, "Hide and Seek", "I always hid behind the same pillar. Mum always found me. \"Change it up, Ren.\"");
            M("m06", "archive", 8, 1.2f, 52, "Library Card", "The archive gave me a library card at six. I borrowed the same book about whales forty times.", echo: true);
            M("m07", "dorm", 58, 1, 10, "Nine", "Ninth birthday. Cake in zero-g. The candles floated off and we chased them around the mess.", echo: true);
            M("m08", "spine", 70, 29.4f, -9, "Rain", "Hydroponics smelled like rain. I'd never seen real rain. I pretended this was it.");
            M("m09", "spine", 86, 52.8f, 3, "Launch Eve", "The night before launch Mum said: if anything happens, I'll find a way to keep you. I thought she meant a photo.");
            M("m10", "crown", 108, 61.15f, 5, "The Sky Forgot", "The first time I saw the Undertow, the sky forgot its colour. Then it forgot it had ever had one.");
            M("m11", "crown", 130, 53, -6, "Last Words", "My last words were \"It's fine, Mum, it's only a tremor.\" I'd like different last words.", echo: true);
            M("m12", "core", 168, 53.2f, -7, "Seventeen", "Seventeen. Old enough to know she'd do anything. Young enough to think that was fine.");
        }
    }
}
