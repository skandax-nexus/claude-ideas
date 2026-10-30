// Environment system: Blueprint -> GameObjects. Static geometry is merged
// per room and material (one draw call + one MeshCollider each). Elements
// with conditions, echoes and shadows stay separate so Refresh() can toggle
// their visibility and collision when facts, room states or laws change.
using System.Collections.Generic;
using System.Linq;
using AfterZero.Core;
using UnityEngine;
using UnityEngine.AI;

namespace AfterZero.Runtime
{
    public class LevelBuilder : MonoBehaviour
    {
        public Blueprint BP { get; private set; }
        GameManager G;

        class Dyn { public Element El; public GameObject Go; public MeshRenderer R; public Collider Col; public Condition Cond; public bool Collapsed; }
        class DecalView { public Decal D; public GameObject Go; public Condition Cond; }

        readonly List<Dyn> dynamics = new List<Dyn>();
        readonly List<DecalView> decals = new List<DecalView>();
        readonly List<(Element el, Transform t, float phase)> drifters = new List<(Element, Transform, float)>();
        readonly Dictionary<string, Transform> roots = new Dictionary<string, Transform>();
        readonly Dictionary<string, List<Light>> lights = new Dictionary<string, List<Light>>();
        readonly Dictionary<string, List<(MeshRenderer r, Collider c, Box box)>> staticChunks = new Dictionary<string, List<(MeshRenderer, Collider, Box)>>();
        public readonly Dictionary<string, Prop> Props = new Dictionary<string, Prop>();
        public readonly Dictionary<string, Prop> ItemProps = new Dictionary<string, Prop>();
        public readonly Dictionary<string, Prop> TokenProps = new Dictionary<string, Prop>();
        public readonly Dictionary<string, Prop> MemoryProps = new Dictionary<string, Prop>();

        public static Font BuiltinFont
        {
            get
            {
                Font f = null;
                try { f = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); } catch { }
                if (f == null) try { f = Resources.GetBuiltinResource<Font>("Arial.ttf"); } catch { }
                return f;
            }
        }

        public void Build(GameManager g, Blueprint bp)
        {
            G = g;
            BP = bp;
            foreach (var r in bp.Rooms.Values) roots[r.Id] = new GameObject("Room_" + r.Id).transform;
            foreach (var r in roots.Values) r.SetParent(transform, false);
            BuildGeometry();
            BuildDecals();
            BuildLights();
            BuildProps();
            BuildAtmosphere();
            BuildStarfield();
        }

        // Colliders register with physics at the end of the frame; bake the NavMesh after that.
        void Start()
        {
            BuildNavMesh();
            G.Observer?.ResetAgent();
        }

        // --- geometry ----------------------------------------------------------------
        void BuildGeometry()
        {
            var groups = new Dictionary<(string room, string mat, bool solid), List<Element>>();
            foreach (var e in BP.Elements)
            {
                if (e.When == null && !e.Echo && !e.Shadow && e.Tag == null)
                {
                    var k = (e.Room, e.Mat, e.Solid);
                    if (!groups.TryGetValue(k, out var l)) groups[k] = l = new List<Element>();
                    l.Add(e);
                }
                else BuildDynamic(e);
            }
            foreach (var kv in groups)
            {
                // split very large groups into chunks so the Undertow can "un-happen" pieces
                foreach (var chunk in Chunk(kv.Value, kv.Key.room == "crown" ? 1 : 400))
                {
                    var v = new List<Vector3>(); var n = new List<Vector3>(); var uv = new List<Vector2>(); var t = new List<int>();
                    foreach (var e in chunk) Meshes.AppendBox(v, n, uv, t, Center(e.Box), Size(e.Box));
                    var go = new GameObject($"{kv.Key.mat}{(kv.Key.solid ? "" : "_fx")}");
                    go.transform.SetParent(roots[kv.Key.room], false);
                    var mesh = Meshes.Build(v, n, uv, t);
                    go.AddComponent<MeshFilter>().sharedMesh = mesh;
                    var mr = go.AddComponent<MeshRenderer>();
                    mr.sharedMaterial = Palette.Get(kv.Key.mat);
                    if (kv.Key.mat == "ceil" || kv.Key.mat == "glass") mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off; // skylight passes through
                    Collider col = null;
                    if (kv.Key.solid) col = go.AddComponent<MeshCollider>();
                    go.isStatic = true;
                    if (!staticChunks.TryGetValue(kv.Key.room, out var list)) staticChunks[kv.Key.room] = list = new List<(MeshRenderer, Collider, Box)>();
                    list.Add((mr, col, Union(chunk.Select(c => c.Box))));
                }
            }
        }

        static IEnumerable<List<Element>> Chunk(List<Element> l, int size)
        {
            for (int i = 0; i < l.Count; i += size) yield return l.GetRange(i, Mathf.Min(size, l.Count - i));
        }

        void BuildDynamic(Element e)
        {
            var go = new GameObject(e.Id ?? (e.Echo ? "echo" : e.Shadow ? "shadow" : e.Mat));
            go.transform.SetParent(roots[e.Room], false);
            go.transform.position = Center(e.Box);
            go.AddComponent<MeshFilter>().sharedMesh = Meshes.Box(Size(e.Box));
            var mr = go.AddComponent<MeshRenderer>();
            mr.sharedMaterial = Palette.Get(e.Echo ? "echo" : e.Shadow ? "shadow" : e.Mat);
            if (e.Echo || e.Shadow) mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            Collider col = null;
            if (e.Solid)
            {
                var bc = go.AddComponent<BoxCollider>();
                bc.size = Size(e.Box);
                col = bc;
            }
            if (e.Tag == "drift") drifters.Add((e, go.transform, Random.value * 6f));
            dynamics.Add(new Dyn { El = e, Go = go, R = mr, Col = col, Cond = Conditions.Compile(e.When) });
        }

        public static Vector3 Center(Box b) => new Vector3(b.CX, b.CY, b.CZ);
        public static Vector3 Size(Box b) => new Vector3(b.SX, b.SY, b.SZ);

        static Box Union(IEnumerable<Box> boxes)
        {
            float x0 = float.MaxValue, y0 = float.MaxValue, z0 = float.MaxValue, x1 = float.MinValue, y1 = float.MinValue, z1 = float.MinValue;
            foreach (var b in boxes) { x0 = Mathf.Min(x0, b.X0); y0 = Mathf.Min(y0, b.Y0); z0 = Mathf.Min(z0, b.Z0); x1 = Mathf.Max(x1, b.X1); y1 = Mathf.Max(y1, b.Y1); z1 = Mathf.Max(z1, b.Z1); }
            return new Box(x0, y0, z0, x1, y1, z1);
        }

        // --- text decals ---------------------------------------------------------------
        void BuildDecals()
        {
            var font = BuiltinFont;
            foreach (var d in BP.Decals)
            {
                var go = new GameObject("Text_" + d.Text.Substring(0, Mathf.Min(12, d.Text.Length)));
                go.transform.SetParent(roots[d.Room], false);
                go.transform.position = new Vector3(d.X, d.Y, d.Z);
                go.transform.rotation = d.Ceiling ? Quaternion.Euler(-90, 0, 180) : Quaternion.Euler(0, d.RotY + 180f, 0);
                var tm = go.AddComponent<TextMesh>();
                tm.text = d.Text;
                tm.fontSize = 96;
                tm.characterSize = d.Size / 9.6f;
                tm.anchor = TextAnchor.MiddleCenter;
                tm.alignment = TextAlignment.Center;
                tm.color = Palette.Hex(d.Color);
                if (font != null)
                {
                    tm.font = font;
                    go.GetComponent<MeshRenderer>().sharedMaterial = font.material;
                }
                decals.Add(new DecalView { D = d, Go = go, Cond = Conditions.Compile(d.When) });
            }
        }

        // --- lights ----------------------------------------------------------------------
        void BuildLights()
        {
            foreach (var r in BP.Rooms.Values)
            {
                var list = lights[r.Id] = new List<Light>();
                int i = 0;
                foreach (var ld in r.Lights)
                {
                    var go = new GameObject("Light");
                    go.transform.SetParent(roots[r.Id], false);
                    go.transform.position = new Vector3(ld.X, ld.Y, ld.Z);
                    var l = go.AddComponent<Light>();
                    l.type = LightType.Point;
                    l.color = Palette.Hex(ld.Color);
                    l.intensity = ld.Intensity;
                    l.range = ld.Range;
                    l.shadows = i == 0 && G.Settings.Quality >= 2 ? LightShadows.Soft : LightShadows.None;
                    if (ld.Flicker) go.AddComponent<LightFlicker>();
                    list.Add(l);
                    i++;
                }
            }
        }

        /// Only the current room and its neighbours keep their lights on (mobile budget).
        public void SetActiveRooms(string current)
        {
            foreach (var kv in lights)
            {
                bool on = kv.Key == current || Neighbours(current).Contains(kv.Key);
                foreach (var l in kv.Value) l.enabled = on;
            }
        }

        static readonly Dictionary<string, string[]> Adjacent = new Dictionary<string, string[]>
        {
            ["cradle"] = new[] { "lab" }, ["lab"] = new[] { "cradle", "hall", "archive", "dorm" }, ["hall"] = new[] { "lab" },
            ["archive"] = new[] { "lab" }, ["dorm"] = new[] { "lab", "spine" }, ["spine"] = new[] { "dorm", "crown" },
            ["crown"] = new[] { "spine", "core" }, ["core"] = new[] { "crown" },
        };

        public static IEnumerable<string> Neighbours(string room) => room != null && Adjacent.TryGetValue(room, out var a) ? a : new string[0];

        // --- props ---------------------------------------------------------------------------
        void BuildProps()
        {
            foreach (var i in BP.Interactables)
            {
                var p = PropFactory.Interactable(i, G.Theme);
                if (p == null) continue;
                p.transform.SetParent(roots[i.Room], true);
                Props[i.Id] = p;
            }
            foreach (var it in BP.Items)
            {
                var p = PropFactory.Item(it, G.Theme);
                p.transform.SetParent(roots[it.Room], true);
                ItemProps[it.Id] = p;
            }
            foreach (var t in BP.Tokens)
            {
                var p = PropFactory.Token(t);
                p.transform.SetParent(roots[t.Room], true);
                TokenProps[t.Token] = p;
            }
            foreach (var m in BP.Memories)
            {
                var p = PropFactory.Memory(m);
                p.transform.SetParent(roots[m.Room], true);
                MemoryProps[m.Id] = p;
            }
        }

        void BuildAtmosphere()
        {
            foreach (var r in BP.Rooms.Values)
            {
                var b = r.Bounds[0];
                float floor = BP.Elements.Where(e => e.Room == r.Id && e.Mat == "floor").Select(e => e.Box.Y1).DefaultIfEmpty(0).Min();
                var center = new Vector3(b.CX, floor + 4f, b.CZ);
                var size = new Vector3(b.SX * 0.9f, 7f, b.SZ * 0.9f);
                var ps = PropFactory.Dust(Palette.Hex(r.Tint), center, size);
                ps.transform.SetParent(roots[r.Id], true);
            }
        }

        // Space outside the hull. It rides along with the camera at a fixed radius (so fog
        // never hides it) and only exists where the hull has turned out to be glass.
        void BuildStarfield()
        {
            var go = new GameObject("Starfield");
            go.transform.SetParent(transform, false);
            var sky = go.AddComponent<SkyFollow>();
            sky.G = G;
            var ps = go.AddComponent<ParticleSystem>();
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            var main = ps.main;
            main.loop = false; main.playOnAwake = false; main.maxParticles = 2500;
            main.startLifetime = 1e6f; main.startSpeed = 0; main.simulationSpace = ParticleSystemSimulationSpace.Local;
            var em = ps.emission; em.enabled = false;
            go.GetComponent<ParticleSystemRenderer>().sharedMaterial = PropFactory.ParticleMaterial();
            var ep = new ParticleSystem.EmitParams { applyShapeToPosition = false };
            for (int i = 0; i < 1600; i++)
            {
                ep.position = Random.onUnitSphere * Random.Range(46f, 52f);
                ep.startSize = Random.Range(0.06f, 0.22f);
                ep.startColor = Color.Lerp(Color.white, new Color(0.7f, 0.8f, 1f), Random.value);
                ep.startLifetime = 1e6f;
                ps.Emit(ep, 1);
            }
            var planet = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            Destroy(planet.GetComponent<Collider>());
            planet.name = "Planet";
            planet.transform.SetParent(go.transform, false);
            planet.transform.localPosition = new Vector3(30, -12, -28);
            planet.transform.localScale = Vector3.one * 14;
            planet.GetComponent<MeshRenderer>().sharedMaterial = Palette.Lit(Palette.Hex("#3a2a6a"), null, 0.2f, 0f, Palette.Hex("#1a0e3a"));
        }

        // Runtime navmesh for the Observer (hall) and its final position (core).
        void BuildNavMesh()
        {
            var sources = new List<NavMeshBuildSource>();
            var markups = new List<NavMeshBuildMarkup>();
            foreach (var zone in BP.HuntZones)
            {
                var a = zone.Area;
                var bounds = new Bounds(new Vector3(a.CX, a.CY, a.CZ), new Vector3(a.SX + 2, a.SY + 2, a.SZ + 2));
                NavMeshBuilder.CollectSources(bounds, ~0, NavMeshCollectGeometry.PhysicsColliders, 0, markups, sources);
                var data = NavMeshBuilder.BuildNavMeshData(NavMesh.GetSettingsByID(0), sources, bounds, Vector3.zero, Quaternion.identity);
                NavMesh.AddNavMeshData(data);
                sources.Clear();
                // the core floor, where the Observer ends up
                var t = zone.Tether;
                var cb = new Bounds(new Vector3(t[0], t[1], t[2]), new Vector3(12, 6, 12));
                NavMeshBuilder.CollectSources(cb, ~0, NavMeshCollectGeometry.PhysicsColliders, 0, markups, sources);
                NavMesh.AddNavMeshData(NavMeshBuilder.BuildNavMeshData(NavMesh.GetSettingsByID(0), sources, cb, Vector3.zero, Quaternion.identity));
                sources.Clear();
            }
        }

        // --- re-derive the world -----------------------------------------------------------------
        public void Refresh()
        {
            var facts = G.Facts;
            var eng = G.Engine;
            foreach (var d in dynamics)
            {
                var state = eng.State(d.El.Room);
                var ctx = new FactStore.StateView(facts, state);
                bool present = d.Cond(ctx) && !d.Collapsed;
                bool visible = present, solid = present && d.El.Solid;
                if (d.El.Echo)
                {
                    bool s = solid && eng.Has("echoSolid", state);
                    visible = present && (s || state == RealityStates.Echo || eng.Has("echoVisible", state));
                    solid = s;
                    d.R.sharedMaterial = Palette.Get(s ? "echoSolid" : "echo");
                }
                else if (d.El.Shadow)
                {
                    bool s = solid && eng.Has("shadowSolid", state);
                    solid = s;
                    d.R.sharedMaterial = Palette.Get(s ? "shadowSolid" : "shadow");
                }
                d.R.enabled = visible;
                if (d.Col != null) d.Col.enabled = solid;
            }
            foreach (var dv in decals)
            {
                var state = eng.State(dv.D.Room);
                bool on = dv.Cond(new FactStore.StateView(facts, state)) &&
                          (!dv.D.Echo || state == RealityStates.Echo || eng.Has("echoVisible", state));
                dv.Go.SetActive(on);
            }
            foreach (var i in BP.Interactables)
                if (Props.TryGetValue(i.Id, out var p) && i.Kind != "shadow")
                    p.gameObject.SetActive(facts.Test(i.When, eng.State(i.Room)));
        }

        public bool ItemAvailable(ItemDef it)
        {
            var state = G.Engine.State(it.Room);
            if (!G.Facts.Test(it.When, state)) return false;
            return !it.Echo || state == RealityStates.Echo || G.Engine.Has("echoVisible", state);
        }

        public bool MemoryVisible(MemoryDef m)
        {
            if (G.Facts.Has("mem_" + m.Id)) return false;
            var state = G.Engine.State(m.Room);
            return !m.Echo || state == RealityStates.Echo || G.Engine.Has("echoVisible", state);
        }

        // --- the Undertow: geometry behind the front stops existing -------------------------------
        public void Collapse(string room, float frontX, bool alongY = false)
        {
            foreach (var d in dynamics)
            {
                if (d.El.Room != room || d.Collapsed) continue;
                float edge = alongY ? d.El.Box.Y1 : d.El.Box.X1;
                if (edge < frontX - 0.5f) { d.Collapsed = true; d.R.enabled = false; if (d.Col) d.Col.enabled = false; }
            }
            if (staticChunks.TryGetValue(room, out var chunks))
                foreach (var (r, c, box) in chunks)
                {
                    float edge = alongY ? box.Y1 : box.X1;
                    if (edge < frontX - 0.5f && r.enabled) { r.enabled = false; if (c) c.enabled = false; }
                }
        }

        public void Uncollapse(string room)
        {
            foreach (var d in dynamics) if (d.El.Room == room) d.Collapsed = false;
            if (staticChunks.TryGetValue(room, out var chunks))
                foreach (var (r, c, _) in chunks) { r.enabled = true; if (c) c.enabled = true; }
            Refresh();
        }

        void Update()
        {
            if (G == null || !G.Running) return;
            int g = G.Engine.Gravity("cradle");
            float t = Time.time;
            foreach (var (el, tr, phase) in drifters)
            {
                float h = el.Box.SY / 2;
                float target = g == -1 ? h : g == 1 ? 5f - h : 1.1f + phase * 0.35f + Mathf.Sin(t * 0.7f + phase) * 0.25f;
                var p = tr.position;
                p.y = Mathf.Lerp(p.y, target, Time.deltaTime * (g == 0 ? 0.8f : 4f));
                tr.position = p;
                if (g == 0) tr.Rotate(0.3f, 0.2f, 0.1f);
            }
            foreach (var p in Props.Values) p.Animate(t);
            foreach (var p in TokenProps.Values) p.Animate(t);
            foreach (var p in MemoryProps.Values) p.Animate(t);
            foreach (var p in ItemProps.Values) p.Animate(t);
        }
    }

    public class LightFlicker : MonoBehaviour
    {
        Light l; float baseI, seed;
        void Awake() { l = GetComponent<Light>(); baseI = l.intensity; seed = Random.value * 100; }
        void Update()
        {
            float n = Mathf.PerlinNoise(seed, Time.time * 3f);
            l.intensity = baseI * (n > 0.15f ? 0.85f + n * 0.3f : 0.2f);
        }
    }

    public class SkyFollow : MonoBehaviour
    {
        public GameManager G;
        Renderer[] renderers;
        void Start() { renderers = GetComponentsInChildren<Renderer>(true); }
        void LateUpdate()
        {
            if (G == null || G.Cam == null) return;
            bool on = G.Facts.Has("machine_activated") && (G.Room == "lab" || G.Room == "core");
            foreach (var r in renderers) r.enabled = on;
            transform.position = G.Cam.transform.position;
            if (on) transform.Rotate(0, 0.6f * Time.deltaTime, 0); // the ship is moving
        }
    }
}
