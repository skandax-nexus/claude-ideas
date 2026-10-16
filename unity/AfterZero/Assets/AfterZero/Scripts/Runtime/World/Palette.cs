// Materials for the greybox world, generated at runtime (URP Lit when the
// project uses URP, Standard otherwise). Any material can be replaced by
// assigning a WorldTheme asset - see WorldTheme.cs.
using System.Collections.Generic;
using UnityEngine;

namespace AfterZero.Runtime
{
    public static class Palette
    {
        static readonly Dictionary<string, Material> cache = new Dictionary<string, Material>();
        static Texture2D panelTex, floorTex, darkTex, crateTex, noiseTex;
        public static WorldTheme Theme;

        public static bool Urp => UnityEngine.Rendering.GraphicsSettings.currentRenderPipeline != null;

        static Shader LitShader => Shader.Find(Urp ? "Universal Render Pipeline/Lit" : "Standard");
        static Shader UnlitShader => Shader.Find(Urp ? "Universal Render Pipeline/Unlit" : "Unlit/Color");

        public static Material Get(string name)
        {
            if (cache.TryGetValue(name, out var m)) return m;
            if (Theme != null && Theme.TryGet(name, out var themed)) return cache[name] = themed;
            m = Create(name);
            m.name = "AZ_" + name;
            cache[name] = m;
            return m;
        }

        static Material Create(string name)
        {
            EnsureTextures();
            switch (name)
            {
                case "wall": return Lit(Hex("#b8c2cc"), panelTex, 0.25f, 0.1f);
                case "wallDark": return Lit(Hex("#7d8592"), darkTex, 0.3f, 0.15f);
                case "wallWarm": return Lit(Hex("#c8a890"), panelTex, 0.2f, 0.05f);
                case "wallGreen": return Lit(Hex("#8aa898"), panelTex, 0.25f, 0.1f);
                case "floor": return Lit(Hex("#9aa2aa"), floorTex, 0.45f, 0.3f);
                case "floorDark": return Lit(Hex("#4a5058"), darkTex, 0.3f, 0.2f);
                case "ceil": return Lit(Hex("#8a929a"), panelTex, 0.15f, 0.05f);
                case "metal": return Lit(Hex("#8a95a6"), darkTex, 0.65f, 0.7f);
                case "shelf": return Lit(Hex("#6b7480"), darkTex, 0.35f, 0.4f);
                case "pillar": return Lit(Hex("#a89898"), darkTex, 0.4f, 0.3f);
                case "crate": return Lit(Hex("#a08a60"), crateTex, 0.2f, 0f);
                case "bunk": return Lit(Hex("#7a6a5a"), crateTex, 0.15f, 0f);
                case "tray": return Lit(Hex("#5a7060"), floorTex, 0.4f, 0.3f);
                case "planter": return Lit(Hex("#3a6a40"), noiseTex, 0.1f, 0f);
                case "door": return Lit(Hex("#6d7a96"), darkTex, 0.6f, 0.6f, Hex("#0a1020"));
                case "doorArchive": return Lit(Hex("#4a8a80"), darkTex, 0.6f, 0.6f, Hex("#06302a"));
                case "doorSecurity": return Lit(Hex("#8a4040"), darkTex, 0.6f, 0.6f, Hex("#300808"));
                case "glass": return Glass();
                case "forcefield": return Additive(Hex("#ff5a40"), 0.35f);
                case "echo": return Additive(Hex("#4ff0ff"), 0.22f);
                case "echoSolid": return Additive(Hex("#7ff8ff"), 0.5f);
                case "shadow": return Unlit(Hex("#05060a"), 0.85f);
                case "shadowSolid": return Unlit(Hex("#120a1a"), 1f);
                case "accent": return Emissive(Hex("#6ff0ff"), 3f);
                case "stripCool": return Emissive(Hex("#7fd8ff"), 2.5f);
                case "stripViolet": return Emissive(Hex("#9a7bff"), 2.5f);
                case "stripRed": return Emissive(Hex("#ff4a3a"), 3f);
                case "stripTeal": return Emissive(Hex("#4af0c8"), 2.5f);
                case "stripWarm": return Emissive(Hex("#ffb070"), 2f);
                case "stripGreen": return Emissive(Hex("#80ffa0"), 2.5f);
                case "stripOrange": return Emissive(Hex("#ff9050"), 3f);
                case "stripPink": return Emissive(Hex("#ff8ac0"), 3f);
                case "stripFaint": return Additive(Hex("#9fdcff"), 0.35f);
                default: return Lit(Color.gray, panelTex, 0.3f, 0.1f);
            }
        }

        public static Color Hex(string hex)
        {
            if (hex.Length == 4) hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
            return ColorUtility.TryParseHtmlString(hex, out var c) ? c : Color.magenta;
        }

        public static Material Lit(Color c, Texture tex, float smooth, float metal, Color? emission = null)
        {
            var m = new Material(LitShader);
            m.color = c;
            m.SetColor("_BaseColor", c);
            if (tex != null) { m.SetTexture("_BaseMap", tex); m.mainTexture = tex; }
            m.SetFloat("_Smoothness", smooth);
            m.SetFloat("_Glossiness", smooth);
            m.SetFloat("_Metallic", metal);
            if (emission.HasValue)
            {
                m.EnableKeyword("_EMISSION");
                m.SetColor("_EmissionColor", emission.Value);
            }
            m.enableInstancing = true;
            return m;
        }

        public static Material Emissive(Color c, float intensity)
        {
            var m = Lit(c, null, 0.5f, 0f, c * intensity);
            m.globalIlluminationFlags = MaterialGlobalIlluminationFlags.RealtimeEmissive;
            return m;
        }

        public static Material Unlit(Color c, float alpha = 1f)
        {
            var m = new Material(UnlitShader);
            c.a = alpha;
            m.color = c;
            m.SetColor("_BaseColor", c);
            if (alpha < 1f) MakeTransparent(m, false);
            return m;
        }

        public static Material Additive(Color c, float alpha)
        {
            var m = new Material(UnlitShader);
            c.a = alpha;
            m.color = c;
            m.SetColor("_BaseColor", c);
            MakeTransparent(m, true);
            return m;
        }

        static Material Glass()
        {
            var m = Lit(new Color(0.15f, 0.22f, 0.3f, 0.18f), null, 0.95f, 0.1f);
            MakeTransparent(m, false);
            return m;
        }

        public static void MakeTransparent(Material m, bool additive)
        {
            m.SetFloat("_Surface", 1);
            m.SetFloat("_Blend", additive ? 2 : 0);
            m.SetFloat("_Mode", 3);
            m.SetOverrideTag("RenderType", "Transparent");
            m.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
            m.SetInt("_DstBlend", additive ? (int)UnityEngine.Rendering.BlendMode.One : (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
            m.SetInt("_ZWrite", 0);
            m.EnableKeyword("_SURFACE_TYPE_TRANSPARENT");
            m.EnableKeyword("_ALPHABLEND_ON");
            m.renderQueue = (int)UnityEngine.Rendering.RenderQueue.Transparent;
        }

        // --- procedural textures ----------------------------------------------------
        static void EnsureTextures()
        {
            if (panelTex != null) return;
            panelTex = Panel(128, new Color(0.72f, 0.75f, 0.79f), new Color(0.45f, 0.48f, 0.52f), true);
            floorTex = Grating(128);
            darkTex = Panel(128, new Color(0.42f, 0.45f, 0.5f), new Color(0.27f, 0.29f, 0.32f), true);
            crateTex = Panel(64, new Color(0.62f, 0.54f, 0.38f), new Color(0.35f, 0.29f, 0.18f), false);
            noiseTex = Noise(64);
        }

        static Texture2D NewTex(int s)
        {
            var t = new Texture2D(s, s, TextureFormat.RGBA32, true) { wrapMode = TextureWrapMode.Repeat, filterMode = FilterMode.Trilinear, anisoLevel = 4 };
            return t;
        }

        static Texture2D Panel(int s, Color baseC, Color line, bool bolts)
        {
            var t = NewTex(s);
            var px = new Color[s * s];
            var rng = new System.Random(s);
            for (int y = 0; y < s; y++)
                for (int x = 0; x < s; x++)
                {
                    float n = (float)rng.NextDouble() * 0.05f - 0.025f;
                    var c = baseC + new Color(n, n, n);
                    bool edge = x < 2 || y < 2 || x >= s - 2 || y >= s - 2 || y == s / 2;
                    bool bolt = bolts && ((x - 8) * (x - 8) + (y - 8) * (y - 8) < 5 || (x - s + 9) * (x - s + 9) + (y - 8) * (y - 8) < 5
                                 || (x - 8) * (x - 8) + (y - s + 9) * (y - s + 9) < 5 || (x - s + 9) * (x - s + 9) + (y - s + 9) * (y - s + 9) < 5);
                    px[y * s + x] = edge || bolt ? line : c;
                }
            t.SetPixels(px);
            t.Apply(true);
            return t;
        }

        static Texture2D Grating(int s)
        {
            var t = NewTex(s);
            var px = new Color[s * s];
            for (int y = 0; y < s; y++)
                for (int x = 0; x < s; x++)
                {
                    bool slot = (x % 16 > 2 && x % 16 < 13) && y > 4 && y < s - 4;
                    bool edge = x < 2 || y < 2 || x >= s - 2 || y >= s - 2;
                    px[y * s + x] = edge ? new Color(0.25f, 0.27f, 0.3f) : slot ? new Color(0.36f, 0.38f, 0.42f) : new Color(0.5f, 0.52f, 0.56f);
                }
            t.SetPixels(px);
            t.Apply(true);
            return t;
        }

        static Texture2D Noise(int s)
        {
            var t = NewTex(s);
            var px = new Color[s * s];
            for (int y = 0; y < s; y++)
                for (int x = 0; x < s; x++)
                {
                    float n = Mathf.PerlinNoise(x * 0.15f, y * 0.15f);
                    px[y * s + x] = new Color(0.4f + n * 0.4f, 0.6f + n * 0.3f, 0.35f + n * 0.3f);
                }
            t.SetPixels(px);
            t.Apply(true);
            return t;
        }
    }
}
