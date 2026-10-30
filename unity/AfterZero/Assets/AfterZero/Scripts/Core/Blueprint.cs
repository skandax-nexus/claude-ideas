// World data model. Levels are authored as data (Content/WorldContent.cs)
// and turned into GameObjects by Runtime/World/LevelBuilder. Artists can
// replace any greybox element by mapping its Mat/Kind to a prefab in a
// WorldTheme asset - the gameplay data never changes.
using System;
using System.Collections.Generic;
using System.Linq;

namespace AfterZero.Core
{
    [Serializable]
    public struct Box
    {
        public float X0, Y0, Z0, X1, Y1, Z1;
        public Box(float x0, float y0, float z0, float x1, float y1, float z1)
        {
            X0 = Math.Min(x0, x1); Y0 = Math.Min(y0, y1); Z0 = Math.Min(z0, z1);
            X1 = Math.Max(x0, x1); Y1 = Math.Max(y0, y1); Z1 = Math.Max(z0, z1);
        }
        public float CX => (X0 + X1) / 2; public float CY => (Y0 + Y1) / 2; public float CZ => (Z0 + Z1) / 2;
        public float SX => X1 - X0; public float SY => Y1 - Y0; public float SZ => Z1 - Z0;
        public bool Contains(float x, float y, float z) => x >= X0 && x < X1 && y >= Y0 && y < Y1 && z >= Z0 && z < Z1;
        public bool Overlaps(Box b) => X0 < b.X1 && X1 > b.X0 && Y0 < b.Y1 && Y1 > b.Y0 && Z0 < b.Z1 && Z1 > b.Z0;
        public override string ToString() => $"[{X0},{Y0},{Z0} .. {X1},{Y1},{Z1}]";
    }

    public class Element
    {
        public string Room, Id, Mat = "wall", When, Tag;
        public Box Box;
        public bool Echo, Solid = true, Shadow;
    }

    public class Decal
    {
        public string Room, Text, Color = "#2f7f9e", When;
        public float X, Y, Z, RotY, Size = 0.5f;
        public bool Echo, Ceiling;
    }

    public class LightDef
    {
        public float X, Y, Z, Intensity = 2f, Range = 14f;
        public string Color = "#ffffff";
        public bool Flicker;
    }

    public class RoomDef
    {
        public string Id, Name, Act, Ambience = "hum", Tint = "#bfe0ff";
        public List<Box> Bounds = new List<Box>();
        public float[] Spawn;              // x, y, z, yaw(deg)
        public List<LightDef> Lights = new List<LightDef>();
        public float KillY = -40f;
        public bool Locked;                // device unresponsive at start
        public float FogDensity = 0.02f;
        public bool Contains(float x, float y, float z) => Bounds.Any(b => b.Contains(x, y, z));
    }

    public class InteractableDef
    {
        public string Id, Room, Kind, Prompt, When;
        public float X, Y, Z, Radius = 2.4f;
    }

    public class ItemDef
    {
        public string Id, Room, Label, When;
        public float X, Y, Z;
        public bool Echo;
    }

    public class TokenDef
    {
        public string Token, Room, When;
        public float X, Y, Z;
    }

    public class MemoryDef
    {
        public string Id, Room, Title, Text, When;
        public float X, Y, Z;
        public bool Echo;
    }

    public class TriggerDef
    {
        public string Id, Room, When;
        public Box Box;
        public Effect[] Then;
        public bool Repeat;
    }

    public class CoverDef
    {
        public string Id;
        public float X, Z, Half = 0.9f;
    }

    public class HuntZone
    {
        public string Id, Room;
        public Box Area;                       // walkable area (floor at Y0)
        public Dictionary<string, (float z0, float z1)> Lanes = new Dictionary<string, (float, float)>();
        public float EntranceX, FarX;
        public float[] Spawn, Tether;
        public List<CoverDef> Cover = new List<CoverDef>();
    }

    public class ChaseDef
    {
        public string Id, Room, Kind, StartWhen, EndWhen;   // Kind: drones | undertow
        public float StartX, EndX, Speed = 4f, Y, Z;
        public int Count = 3;
        public float[] Checkpoint;
    }

    public class Blueprint
    {
        public const float T = 0.4f;
        public readonly List<Element> Elements = new List<Element>();
        public readonly List<Decal> Decals = new List<Decal>();
        public readonly Dictionary<string, RoomDef> Rooms = new Dictionary<string, RoomDef>();
        public readonly List<InteractableDef> Interactables = new List<InteractableDef>();
        public readonly List<ItemDef> Items = new List<ItemDef>();
        public readonly List<TokenDef> Tokens = new List<TokenDef>();
        public readonly List<MemoryDef> Memories = new List<MemoryDef>();
        public readonly List<TriggerDef> Triggers = new List<TriggerDef>();
        public readonly List<HuntZone> HuntZones = new List<HuntZone>();
        public readonly List<ChaseDef> Chases = new List<ChaseDef>();

        public RoomDef RoomAt(float x, float y, float z) => Rooms.Values.FirstOrDefault(r => r.Contains(x, y, z));

        // --- authoring helpers --------------------------------------------------
        public Element Add(string room, Box b, string mat = "wall", string when = null, bool solid = true, bool echo = false, string id = null)
        {
            var e = new Element { Room = room, Box = b, Mat = mat, When = when, Solid = solid, Echo = echo, Id = id };
            Elements.Add(e);
            return e;
        }

        public Element Add(string room, float x0, float y0, float z0, float x1, float y1, float z1, string mat = "wall", string when = null, bool solid = true, bool echo = false, string id = null)
            => Add(room, new Box(x0, y0, z0, x1, y1, z1), mat, when, solid, echo, id);

        /// A wall along an axis with rectangular openings: (a0, a1, y0, y1) in wall-local "along" coordinates.
        public void Wall(string room, char axis, float f0, float f1, float a0, float a1, float y0, float y1, IEnumerable<(float, float, float, float)> openings, string mat, string when = null, bool solid = true)
        {
            void Mk(float s0, float s1, float h0, float h1)
            {
                if (s1 - s0 < 0.01f || h1 - h0 < 0.01f) return;
                if (axis == 'x') Add(room, s0, h0, f0, s1, h1, f1, mat, when, solid);
                else Add(room, f0, h0, s0, f1, h1, s1, mat, when, solid);
            }
            float cur = a0;
            foreach (var (o0, o1, oy0, oy1) in (openings ?? Enumerable.Empty<(float, float, float, float)>()).OrderBy(o => o.Item1))
            {
                Mk(cur, o0, y0, y1);
                Mk(o0, o1, y0, oy0);
                Mk(o0, o1, oy1, y1);
                cur = o1;
            }
            Mk(cur, a1, y0, y1);
        }

        public class ShellOptions
        {
            public Dictionary<char, (float, float, float, float)[]> Open = new Dictionary<char, (float, float, float, float)[]>();
            public string Wall = "wall", Floor = "floor", Ceil = "ceil", Strip;
            public Dictionary<char, string> WallMat = new Dictionary<char, string>();
            public Dictionary<char, string> Lining = new Dictionary<char, string>(); // side -> when (removable inner skin)
            public HashSet<char> Skip = new HashSet<char>();
            public bool NoFloor, NoCeil;
        }

        /// Room shell: floor, ceiling, and N(+z) S(-z) E(+x) W(-x) walls with openings.
        public void Shell(string room, Box r, ShellOptions o = null)
        {
            o ??= new ShellOptions();
            if (!o.NoFloor) Add(room, r.X0 - T, r.Y0 - T, r.Z0 - T, r.X1 + T, r.Y0, r.Z1 + T, o.Floor);
            if (!o.NoCeil) Add(room, r.X0 - T, r.Y1, r.Z0 - T, r.X1 + T, r.Y1 + T, r.Z1 + T, o.Ceil);
            var sides = new Dictionary<char, (char axis, float f0, float f1, float a0, float a1)>
            {
                ['N'] = ('x', r.Z1, r.Z1 + T, r.X0 - T, r.X1 + T),
                ['S'] = ('x', r.Z0 - T, r.Z0, r.X0 - T, r.X1 + T),
                ['E'] = ('z', r.X1, r.X1 + T, r.Z0, r.Z1),
                ['W'] = ('z', r.X0 - T, r.X0, r.Z0, r.Z1),
            };
            foreach (var kv in sides)
            {
                if (o.Skip.Contains(kv.Key)) continue;
                var (axis, f0, f1, a0, a1) = kv.Value;
                o.Open.TryGetValue(kv.Key, out var open);
                var mat = o.WallMat.TryGetValue(kv.Key, out var wm) ? wm : o.Wall;
                Wall(room, axis, f0, f1, a0, a1, r.Y0, r.Y1, open, mat);
                if (o.Lining.TryGetValue(kv.Key, out var liningWhen))
                {
                    bool inner0 = kv.Key == 'S' || kv.Key == 'W';
                    float i0 = inner0 ? f1 : f0 - 0.06f, i1 = inner0 ? f1 + 0.06f : f0;
                    float la0 = axis == 'x' ? a0 + T : a0, la1 = axis == 'x' ? a1 - T : a1;
                    Wall(room, axis, i0, i1, la0, la1, r.Y0, r.Y1, open, o.Wall, liningWhen, false);
                }
            }
            if (o.Strip != null)
            {
                Add(room, r.X0, r.Y0, r.Z0, r.X1, r.Y0 + 0.08f, r.Z0 + 0.05f, o.Strip, solid: false);
                Add(room, r.X0, r.Y0, r.Z1 - 0.05f, r.X1, r.Y0 + 0.08f, r.Z1, o.Strip, solid: false);
                Add(room, r.X0, r.Y0, r.Z0, r.X0 + 0.05f, r.Y0 + 0.08f, r.Z1, o.Strip, solid: false);
                Add(room, r.X1 - 0.05f, r.Y0, r.Z0, r.X1, r.Y0 + 0.08f, r.Z1, o.Strip, solid: false);
            }
        }

        /// Straight corridor with open ends along 'x' or 'z'.
        public void Corridor(string room, char axis, Box r, string mat = "wall")
        {
            if (axis == 'z')
            {
                Add(room, r.X0 - T, r.Y0 - T, r.Z0, r.X1 + T, r.Y0, r.Z1, "floor");
                Add(room, r.X0 - T, r.Y1, r.Z0, r.X1 + T, r.Y1 + T, r.Z1, "ceil");
                Add(room, r.X0 - T, r.Y0, r.Z0, r.X0, r.Y1, r.Z1, mat);
                Add(room, r.X1, r.Y0, r.Z0, r.X1 + T, r.Y1, r.Z1, mat);
            }
            else
            {
                Add(room, r.X0, r.Y0 - T, r.Z0 - T, r.X1, r.Y0, r.Z1 + T, "floor");
                Add(room, r.X0, r.Y1, r.Z0 - T, r.X1, r.Y1 + T, r.Z1 + T, "ceil");
                Add(room, r.X0, r.Y0, r.Z0 - T, r.X1, r.Y1, r.Z0, mat);
                Add(room, r.X0, r.Y0, r.Z1, r.X1, r.Y1, r.Z1 + T, mat);
            }
        }

        public Decal Text(string room, string text, float x, float y, float z, float rotY, float size = 0.5f, string color = "#2f7f9e", bool echo = false, string when = null, bool ceiling = false)
        {
            var d = new Decal { Room = room, Text = text, X = x, Y = y, Z = z, RotY = rotY, Size = size, Color = color, Echo = echo, When = when, Ceiling = ceiling };
            Decals.Add(d);
            return d;
        }

        public RoomDef Room(string id, string name, string act, float[] spawn, params Box[] bounds)
        {
            var r = new RoomDef { Id = id, Name = name, Act = act, Spawn = spawn };
            r.Bounds.AddRange(bounds);
            Rooms[id] = r;
            return r;
        }

        // --- validation (run by tests and by the editor builder) -------------------
        public IEnumerable<string> Validate(Func<string, bool> conditionParses)
        {
            foreach (var r in Rooms.Values)
            {
                if (r.Spawn == null) { yield return $"room {r.Id} has no spawn"; continue; }
                if (!r.Contains(r.Spawn[0], r.Spawn[1], r.Spawn[2])) yield return $"room {r.Id} spawn is outside its bounds";
                var body = new Box(r.Spawn[0] - 0.3f, r.Spawn[1] - 0.85f, r.Spawn[2] - 0.3f, r.Spawn[0] + 0.3f, r.Spawn[1] + 0.85f, r.Spawn[2] + 0.3f);
                foreach (var e in Elements.Where(e => e.Solid && !e.Echo && e.When == null))
                    if (e.Box.Overlaps(body)) yield return $"room {r.Id} spawn overlaps element {e.Box}";
            }
            foreach (var a in Rooms.Values)
                foreach (var b in Rooms.Values)
                    if (string.CompareOrdinal(a.Id, b.Id) < 0)
                        foreach (var ba in a.Bounds) foreach (var bb in b.Bounds)
                                if (ba.Overlaps(bb)) yield return $"rooms {a.Id} and {b.Id} overlap";
            foreach (var i in Interactables)
                if (!Rooms.ContainsKey(i.Room)) yield return $"interactable {i.Id} in unknown room {i.Room}";
            foreach (var t in Tokens)
                if (!Laws.Tokens.ContainsKey(t.Token)) yield return $"unknown token {t.Token}";
            var conds = Elements.Select(e => e.When).Concat(Decals.Select(d => d.When)).Concat(Interactables.Select(i => i.When))
                .Concat(Items.Select(i => i.When)).Concat(Triggers.Select(t => t.When)).Concat(Memories.Select(m => m.When))
                .Concat(Chases.SelectMany(c => new[] { c.StartWhen, c.EndWhen })).Where(c => !string.IsNullOrEmpty(c)).Distinct();
            foreach (var c in conds) if (!conditionParses(c)) yield return $"condition does not parse: {c}";
        }
    }
}
