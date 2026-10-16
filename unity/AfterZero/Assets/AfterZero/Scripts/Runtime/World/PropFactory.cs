// Procedural props, collectibles and character bodies. Every one of them can
// be replaced by a prefab in the WorldTheme ("shard", "terminal", "npc:juno").
using AfterZero.Core;
using UnityEngine;

namespace AfterZero.Runtime
{
    /// A visual with an optional idle animation.
    public class Prop : MonoBehaviour
    {
        public float BaseY;
        public float Spin, Bob;
        public Transform SpinPart;
        public System.Action<float> Custom;

        public void Animate(float t)
        {
            if (!isActiveAndEnabled) return;
            if (Spin != 0) (SpinPart ? SpinPart : transform).Rotate(0, Spin * Time.deltaTime, 0, Space.World);
            if (Bob != 0) { var p = transform.position; p.y = BaseY + Mathf.Sin(t * 1.6f + BaseY) * Bob; transform.position = p; }
            Custom?.Invoke(t);
        }
    }

    public static class PropFactory
    {
        static GameObject Part(Transform parent, Mesh mesh, Material mat, Vector3 pos, Vector3 scale, Quaternion? rot = null, bool shadows = true)
        {
            var go = new GameObject(mesh.name);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = pos;
            go.transform.localScale = scale;
            go.transform.localRotation = rot ?? Quaternion.identity;
            go.AddComponent<MeshFilter>().sharedMesh = mesh;
            var r = go.AddComponent<MeshRenderer>();
            r.sharedMaterial = mat;
            if (!shadows) r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            return go;
        }

        static Mesh prim(PrimitiveType t)
        {
            var go = GameObject.CreatePrimitive(t);
            var m = go.GetComponent<MeshFilter>().sharedMesh;
            Object.DestroyImmediate(go);
            return m;
        }

        static Mesh _sphere, _cube, _capsule, _cylinder, _quad, _octa, _brain;
        public static Mesh Sphere => _sphere ? _sphere : _sphere = prim(PrimitiveType.Sphere);
        public static Mesh Cube => _cube ? _cube : _cube = prim(PrimitiveType.Cube);
        public static Mesh Capsule => _capsule ? _capsule : _capsule = prim(PrimitiveType.Capsule);
        public static Mesh Cylinder => _cylinder ? _cylinder : _cylinder = prim(PrimitiveType.Cylinder);
        public static Mesh Quad => _quad ? _quad : _quad = prim(PrimitiveType.Quad);
        public static Mesh Octa => _octa ? _octa : _octa = Meshes.Octahedron(0.5f);

        static Prop Root(string name, Vector3 pos, WorldTheme theme, string kind)
        {
            var go = new GameObject(name);
            go.transform.position = pos;
            var p = go.AddComponent<Prop>();
            p.BaseY = pos.y;
            var prefab = theme != null ? theme.Prop(kind) : null;
            if (prefab != null) Object.Instantiate(prefab, go.transform, false);
            return p;
        }

        static bool Themed(Prop p) => p.transform.childCount > 0;

        public static Prop Interactable(InteractableDef i, WorldTheme theme)
        {
            var pos = new Vector3(i.X, i.Y, i.Z);
            switch (i.Kind)
            {
                case "shard":
                {
                    var p = Root("Shard", pos, theme, "shard");
                    if (!Themed(p))
                    {
                        Part(p.transform, Octa, Palette.Emissive(Palette.Hex("#e6ddff"), 4f), Vector3.zero, Vector3.one * 0.55f);
                        var shell = Part(p.transform, Octa, Palette.Additive(Palette.Hex("#9a7bff"), 0.35f), Vector3.zero, Vector3.one * 1.0f, shadows: false);
                        p.SpinPart = shell.transform;
                        var halo = Part(p.transform, Meshes.Torus(0.75f, 0.025f), Palette.Emissive(Palette.Hex("#b8a0ff"), 2f), Vector3.zero, Vector3.one, shadows: false);
                        p.Custom = t => halo.transform.localRotation = Quaternion.Euler(Mathf.Sin(t * 0.5f) * 45, t * 35, 0);
                    }
                    p.Spin = 60; p.Bob = 0.08f;
                    return p;
                }
                case "terminal":
                {
                    var p = Root("Terminal_" + i.Id, pos + Vector3.down * 0.3f, theme, "terminal");
                    if (!Themed(p))
                    {
                        Part(p.transform, Cube, Palette.Get("metal"), new Vector3(0, 0.15f, 0), new Vector3(1.0f, 0.65f, 0.06f), Quaternion.Euler(-30, 0, 0));
                        var screen = Part(p.transform, Quad, Palette.Emissive(Palette.Hex("#2ad8ff"), 1.6f), new Vector3(0, 0.15f, -0.035f), new Vector3(0.9f, 0.55f, 1), Quaternion.Euler(-30, 0, 0), false);
                        var r = screen.GetComponent<MeshRenderer>();
                        var mat = r.material;
                        p.Custom = t => mat.SetColor("_EmissionColor", Palette.Hex("#2ad8ff") * (1.4f + Mathf.Sin(t * 9) * 0.15f));
                    }
                    return p;
                }
                case "machine":
                {
                    var p = Root("Machine", new Vector3(0, 4.6f, 0), theme, "machine");
                    if (!Themed(p))
                    {
                        Part(p.transform, Meshes.Torus(3.2f, 0.28f, 64, 12), Palette.Get("metal"), Vector3.zero, Vector3.one);
                        var inner = Part(p.transform, Meshes.Torus(2.8f, 0.05f, 64, 6), Palette.Emissive(Palette.Hex("#6ff0ff"), 3f), Vector3.zero, Vector3.one, shadows: false);
                        for (int k = 0; k < 6; k++)
                        {
                            float a = k / 6f * 360f;
                            var q = Quaternion.Euler(0, 0, a);
                            Part(p.transform, Cube, Palette.Get("shelf"), q * new Vector3(3.2f, 0, 0), new Vector3(0.6f, 0.15f, 0.6f), q);
                        }
                        p.Custom = t => inner.transform.localRotation = Quaternion.Euler(0, 0, t * (GameManager.Instance != null && GameManager.Instance.Facts.Has("machine_activated") ? 140f : 15f));
                    }
                    return p;
                }
                case "panel":
                {
                    var p = Root("Panel_" + i.Id, new Vector3(i.X, i.Y, 15.95f), theme, "panel");
                    if (!Themed(p)) Part(p.transform, Quad, Palette.Emissive(Palette.Hex("#4af0c8"), 2f), Vector3.zero, new Vector3(0.6f, 0.8f, 1), Quaternion.Euler(0, 180, 0), false);
                    return p;
                }
                case "brain":
                {
                    var p = Root("Brain", pos, theme, "brain");
                    if (!Themed(p))
                    {
                        _brain = _brain ? _brain : Meshes.Brain(0.9f);
                        var brain = Part(p.transform, _brain, Palette.Lit(Palette.Hex("#d88aa0"), null, 0.6f, 0f, Palette.Hex("#5a1830")), Vector3.zero, Vector3.one, Quaternion.Euler(0, 90, 0));
                        var glow = Part(p.transform, Sphere, Palette.Additive(Palette.Hex("#ff6aa0"), 0.2f), Vector3.zero, Vector3.one * 2.4f, shadows: false);
                        p.Custom = t =>
                        {
                            float s = 1 + Mathf.Sin(t * 2.4f) * 0.04f;
                            brain.transform.localScale = Vector3.one * s;
                            glow.transform.localScale = Vector3.one * (2.3f + Mathf.Max(0, Mathf.Sin(t * 2.4f)) * 0.3f);
                        };
                    }
                    return p;
                }
                case "other":
                {
                    var p = Root("TheOther", pos, theme, "npc:other");
                    if (!Themed(p))
                    {
                        var body = Humanoid.Build("#c7a2ff", Humanoid.Style.Hologram, 1.8f);
                        body.transform.SetParent(p.transform, false);
                        body.transform.localRotation = Quaternion.Euler(0, 180, 180); // standing on the ceiling
                    }
                    return p;
                }
                case "shadow":
                {
                    var p = Root("Shadow", pos, theme, "shadow");
                    var body = Humanoid.Build("#05070a", Humanoid.Style.Shadow, 1.85f);
                    body.transform.SetParent(p.transform, false);
                    body.transform.localPosition = new Vector3(0, -1, 0);
                    body.transform.localRotation = Quaternion.Euler(0, 270, 0);
                    var wall = Part(p.transform, Quad, Palette.Unlit(Color.black, 0.75f), Vector3.zero, new Vector3(1.0f, 2.0f, 1), Quaternion.Euler(0, 90, 0), false);
                    wall.name = "WallShadow";
                    return p;
                }
                case "bunk":
                case "doc":
                default:
                {
                    var p = Root("Marker_" + i.Id, pos + Vector3.up * 0.6f, theme, i.Kind);
                    if (!Themed(p)) Part(p.transform, Octa, Palette.Emissive(Palette.Hex("#ffe066"), 2.5f), Vector3.zero, new Vector3(0.18f, 0.3f, 0.18f), shadows: false);
                    p.Spin = 90; p.Bob = 0.05f;
                    return p;
                }
            }
        }

        public static Prop Item(ItemDef it, WorldTheme theme)
        {
            var p = Root("Item_" + it.Id, new Vector3(it.X, it.Y, it.Z), theme, "item:" + it.Id);
            if (!Themed(p))
            {
                if (it.Id == "core")
                {
                    Part(p.transform, Sphere, Palette.Emissive(Palette.Hex("#ffb24a"), 3f), Vector3.zero, Vector3.one * 0.5f);
                    Part(p.transform, Octa, Palette.Get("metal"), Vector3.zero, Vector3.one * 0.75f);
                }
                else
                {
                    var m = it.Echo ? Palette.Additive(Palette.Hex("#7ff8ff"), 0.85f) : Palette.Emissive(Palette.Hex("#d8f0ff"), 1.5f);
                    Part(p.transform, Meshes.Torus(0.1f, 0.03f, 16, 6), m, Vector3.zero, Vector3.one, shadows: false);
                    Part(p.transform, Cube, m, new Vector3(0, -0.24f, 0), new Vector3(0.04f, 0.32f, 0.04f), shadows: false);
                    Part(p.transform, Cube, m, new Vector3(0.05f, -0.36f, 0), new Vector3(0.1f, 0.04f, 0.04f), shadows: false);
                }
            }
            p.Spin = 70; p.Bob = 0.04f;
            return p;
        }

        public static Prop Token(TokenDef t)
        {
            var p = Root("Token_" + t.Token, new Vector3(t.X, t.Y, t.Z), null, "token");
            Part(p.transform, Octa, Palette.Additive(Palette.Hex("#9dff9d"), 0.6f), Vector3.zero, Vector3.one * 0.45f, shadows: false);
            Part(p.transform, Octa, Palette.Emissive(Palette.Hex("#eaffea"), 3f), Vector3.zero, Vector3.one * 0.18f, shadows: false);
            var label = new GameObject("Label");
            label.transform.SetParent(p.transform, false);
            label.transform.localPosition = Vector3.up * 0.5f;
            var tm = label.AddComponent<TextMesh>();
            tm.text = Laws.Tokens[t.Token].Label;
            tm.fontSize = 64; tm.characterSize = 0.035f; tm.anchor = TextAnchor.MiddleCenter;
            tm.color = Palette.Hex("#9dff9d");
            var f = LevelBuilder.BuiltinFont;
            if (f) { tm.font = f; label.GetComponent<MeshRenderer>().sharedMaterial = f.material; }
            label.AddComponent<Billboard>();
            p.Spin = 80; p.Bob = 0.06f;
            return p;
        }

        public static Prop Memory(MemoryDef m)
        {
            var p = Root("Memory_" + m.Id, new Vector3(m.X, m.Y, m.Z), null, "memory");
            Part(p.transform, Sphere, Palette.Emissive(Palette.Hex("#ffd27a"), 4f), Vector3.zero, Vector3.one * 0.16f, shadows: false);
            Part(p.transform, Sphere, Palette.Additive(Palette.Hex("#ffb84a"), 0.18f), Vector3.zero, Vector3.one * 0.6f, shadows: false);
            var l = p.gameObject.AddComponent<Light>();
            l.type = LightType.Point; l.color = Palette.Hex("#ffc870"); l.range = 3f; l.intensity = 1.2f; l.shadows = LightShadows.None;
            p.Bob = 0.1f;
            return p;
        }

        public static ParticleSystem Dust(Color tint, Vector3 center, Vector3 size)
        {
            var go = new GameObject("Dust");
            go.transform.position = center;
            var ps = go.AddComponent<ParticleSystem>();
            ps.Stop(true, ParticleSystemStopBehavior.StopEmittingAndClear);
            var main = ps.main;
            main.loop = true;
            main.startLifetime = 12f;
            main.startSpeed = 0.05f;
            main.startSize = new ParticleSystem.MinMaxCurve(0.02f, 0.06f);
            main.startColor = new Color(tint.r, tint.g, tint.b, 0.5f);
            main.maxParticles = 180;
            main.simulationSpace = ParticleSystemSimulationSpace.World;
            var em = ps.emission; em.rateOverTime = 14f;
            var sh = ps.shape; sh.shapeType = ParticleSystemShapeType.Box; sh.scale = size;
            var noise = ps.noise; noise.enabled = true; noise.strength = 0.08f; noise.frequency = 0.2f;
            var col = ps.colorOverLifetime; col.enabled = true;
            var g = new Gradient();
            g.SetKeys(new[] { new GradientColorKey(Color.white, 0), new GradientColorKey(Color.white, 1) },
                      new[] { new GradientAlphaKey(0, 0), new GradientAlphaKey(1, 0.3f), new GradientAlphaKey(1, 0.7f), new GradientAlphaKey(0, 1) });
            col.color = g;
            var r = go.GetComponent<ParticleSystemRenderer>();
            r.sharedMaterial = ParticleMaterial();
            ps.Play();
            return ps;
        }

        static Material _particle;
        public static Material ParticleMaterial()
        {
            if (_particle) return _particle;
            var sh = Shader.Find(Palette.Urp ? "Universal Render Pipeline/Particles/Unlit" : "Particles/Standard Unlit");
            _particle = new Material(sh);
            Palette.MakeTransparent(_particle, true);
            _particle.SetColor("_BaseColor", Color.white);
            return _particle;
        }
    }

    public class Billboard : MonoBehaviour
    {
        void LateUpdate()
        {
            var cam = Camera.main;
            if (cam) transform.rotation = Quaternion.LookRotation(transform.position - cam.transform.position, cam.transform.up);
        }
    }

    /// Stylised humanoid bodies from primitives. Proportions per character keep
    /// silhouettes readable; swap for rigged models through the WorldTheme.
    public static class Humanoid
    {
        public enum Style { Solid, Hologram, Shadow, Old, Officer }

        public class Rig : MonoBehaviour
        {
            public Transform Head, Torso, ArmL, ArmR, LegL, LegR;
            public float Walk;
            public void Pose(float t, float moving, float talk)
            {
                Walk += Time.deltaTime * moving * 6f;
                float sw = moving > 0.05f ? Mathf.Sin(Walk) * 0.5f : 0f;
                if (LegL) { LegL.localRotation = Quaternion.Euler(sw * 50, 0, 0); LegR.localRotation = Quaternion.Euler(-sw * 50, 0, 0); }
                float gesture = talk > 0 ? Mathf.Sin(t * 5) * 12f * talk : 0f;
                if (ArmL) { ArmL.localRotation = Quaternion.Euler(-sw * 35 + gesture, 0, 6); ArmR.localRotation = Quaternion.Euler(sw * 35 - gesture * 0.5f, 0, -6); }
                if (Torso) Torso.localScale = new Vector3(1, 1 + Mathf.Sin(t * 1.8f) * 0.012f, 1);
            }
        }

        public static GameObject Build(string hex, Style style, float height = 1.8f)
        {
            var root = new GameObject("Body");
            var rig = root.AddComponent<Rig>();
            Color c = Palette.Hex(hex);
            Material skin, cloth, accent;
            switch (style)
            {
                case Style.Hologram:
                    skin = cloth = Palette.Additive(c, 0.45f); accent = Palette.Emissive(c, 2f); break;
                case Style.Shadow:
                    skin = cloth = Palette.Unlit(Palette.Hex("#05060a")); accent = Palette.Additive(Palette.Hex("#4ff0ff"), 0.5f); break;
                default:
                    skin = Palette.Lit(style == Style.Old ? Palette.Hex("#d8b8a0") : Palette.Hex("#c89a7a"), null, 0.3f, 0f);
                    cloth = Palette.Lit(style == Style.Officer ? Palette.Hex("#56667a") : Color.Lerp(c, Palette.Hex("#f4f7fa"), 0.3f), null, 0.35f, 0f);
                    accent = Palette.Emissive(c, 1.6f);
                    break;
            }
            float k = height / 1.8f;
            Transform P(string n, Mesh m, Material mat, Vector3 pos, Vector3 scale, Transform parent = null)
            {
                var go = new GameObject(n);
                go.transform.SetParent(parent ? parent : root.transform, false);
                go.transform.localPosition = pos * k;
                go.transform.localScale = scale * k;
                go.AddComponent<MeshFilter>().sharedMesh = m;
                var r = go.AddComponent<MeshRenderer>();
                r.sharedMaterial = mat;
                if (style != Style.Solid && style != Style.Old && style != Style.Officer) r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
                return go.transform;
            }
            Transform Pivot(string n, Vector3 pos)
            {
                var go = new GameObject(n);
                go.transform.SetParent(root.transform, false);
                go.transform.localPosition = pos * k;
                return go.transform;
            }
            rig.Torso = P("Torso", PropFactory.Capsule, cloth, new Vector3(0, 1.18f, 0), new Vector3(0.42f, 0.36f, 0.26f));
            P("Collar", PropFactory.Cylinder, accent, new Vector3(0, 1.48f, 0), new Vector3(0.2f, 0.02f, 0.2f));
            rig.Head = P("Head", PropFactory.Sphere, skin, new Vector3(0, 1.66f, 0), new Vector3(0.22f, 0.26f, 0.24f));
            if (style == Style.Solid || style == Style.Old || style == Style.Officer)
                P("Visor", PropFactory.Cube, accent, new Vector3(0, 0.05f, 0.42f), new Vector3(0.7f, 0.12f, 0.1f), rig.Head);
            rig.ArmL = Pivot("ArmL", new Vector3(-0.27f, 1.42f, 0));
            rig.ArmR = Pivot("ArmR", new Vector3(0.27f, 1.42f, 0));
            P("Arm", PropFactory.Capsule, cloth, new Vector3(0, -0.32f, 0), new Vector3(0.1f, 0.33f, 0.1f), rig.ArmL);
            P("Arm", PropFactory.Capsule, cloth, new Vector3(0, -0.32f, 0), new Vector3(0.1f, 0.33f, 0.1f), rig.ArmR);
            rig.LegL = Pivot("LegL", new Vector3(-0.11f, 0.84f, 0));
            rig.LegR = Pivot("LegR", new Vector3(0.11f, 0.84f, 0));
            P("Leg", PropFactory.Capsule, cloth, new Vector3(0, -0.42f, 0), new Vector3(0.14f, 0.42f, 0.14f), rig.LegL);
            P("Leg", PropFactory.Capsule, cloth, new Vector3(0, -0.42f, 0), new Vector3(0.14f, 0.42f, 0.14f), rig.LegR);
            if (style == Style.Old) rig.Torso.localRotation = Quaternion.Euler(8, 0, 0);
            return root;
        }
    }
}
