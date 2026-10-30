// HUD + menus (IMGUI, resolution-independent: laid out on a 1080-tall
// virtual canvas). Deliberately sparse during play - no map, no markers:
// only what the character could know. Everything is skinned from code.
using System;
using System.Collections.Generic;
using System.Linq;
using AfterZero.Core;
using AfterZero.Core.Content;
using UnityEngine;

namespace AfterZero.Runtime
{
    public class Hud : MonoBehaviour
    {
        GameManager G;
        float S, W;
        const float H = 1080f;

        // state
        string objective = "", objectiveShown = "";
        float glitchT = -1;
        readonly List<(string text, float t, float dur)> toasts = new List<(string, float, float)>();
        MemoryDef memory; int memoryN, memoryTotal; float memoryT;
        Color flash; float flashT;
        float fade; int fadeDir; Action fadeMid;
        EndingDef ending; string[] answers = { "", "", "" }; string another = ""; bool copied;
        Law[] draft; string lawFlash = "";
        int journalTab; Vector2 scroll;
        string settingsReturn;

        // styles
        GUIStyle panel, panelSoft, label, small, tiny, title, huge, button, buttonBig, chip, sub, center, prompt;
        Texture2D white, round;

        void Awake() { G = GetComponent<GameManager>(); }

        // --- API ---------------------------------------------------------------------------------------
        public void SetObjective(string text, bool animate)
        {
            objective = text ?? "";
            if (animate) glitchT = 0; else objectiveShown = objective;
        }

        public void Toast(string text, float dur = 3.2f) { toasts.Add((text, Time.unscaledTime, dur)); if (toasts.Count > 3) toasts.RemoveAt(0); }
        public void ShowMemory(MemoryDef m, int n, int total) { memory = m; memoryN = n; memoryTotal = total; memoryT = Time.unscaledTime; }
        public void Flash(Color c) { if (G.Settings.ReduceFlashes) c.a *= 0.3f; flash = c; flashT = Time.unscaledTime; }
        public void FadeOut(Action mid) { fadeMid = mid; fadeDir = 1; }
        public void ShowEnding(EndingDef e) { ending = e; answers = new[] { "", "", "" }; another = ""; copied = false; }

        public void OnMenuOpened(string id)
        {
            if (id == "laws") { draft = G.Engine.InstalledLaws.Select(l => l == null ? new Law() : new Law(l.Subject, l.Verb, l.Target)).ToArray(); lawFlash = ""; }
            scroll = Vector2.zero;
        }

        void Update()
        {
            float dt = Time.unscaledDeltaTime;
            if (fadeDir != 0)
            {
                fade += fadeDir * dt * 2.2f;
                if (fade >= 1 && fadeDir == 1) { fade = 1; fadeDir = -1; var m = fadeMid; fadeMid = null; m?.Invoke(); }
                if (fade <= 0 && fadeDir == -1) { fade = 0; fadeDir = 0; }
            }
            if (glitchT >= 0)
            {
                glitchT += dt;
                int n = Mathf.Max(objective.Length, objectiveShown.Length);
                int k = Mathf.FloorToInt(glitchT / 1.2f * n);
                const string glyphs = "!<>-_\\/[]{}=+*^?#01";
                var sb = new System.Text.StringBuilder();
                for (int i = 0; i < n; i++)
                    sb.Append(i < k ? (i < objective.Length ? objective[i] : ' ') : UnityEngine.Random.value < 0.6f ? glyphs[UnityEngine.Random.Range(0, glyphs.Length)] : (i < objectiveShown.Length ? objectiveShown[i] : ' '));
                objectiveShown = sb.ToString();
                if (k >= n) { glitchT = -1; objectiveShown = objective; }
            }
        }

        // --- styles --------------------------------------------------------------------------------------
        void Styles()
        {
            if (panel != null) return;
            white = Texture2D.whiteTexture;
            round = RoundedTex(32, 12, new Color(1f, 1f, 1f, 0.92f), new Color(0.75f, 0.8f, 0.86f, 0.6f));
            var roundSoft = RoundedTex(32, 12, new Color(1f, 1f, 1f, 0.9f), new Color(0, 0, 0, 0));
            var btn = RoundedTex(32, 14, new Color(1, 1, 1, 0.95f), new Color(0.78f, 0.83f, 0.88f, 0.9f));
            var btnHover = RoundedTex(32, 14, new Color(0.93f, 0.97f, 1f, 1f), new Color(0.31f, 0.62f, 0.91f, 1f));
            var btnOn = RoundedTex(32, 8, new Color(0.6f, 1f, 0.6f, 0.85f), new Color(0.6f, 1f, 0.6f, 1f));
            var font = LevelBuilder.BuiltinFont;
            GUIStyle Mk(int size, FontStyle fs = FontStyle.Normal, TextAnchor a = TextAnchor.UpperLeft)
            {
                var s = new GUIStyle { fontSize = size, fontStyle = fs, alignment = a, richText = true, wordWrap = true, font = font };
                s.normal.textColor = new Color(0.14f, 0.19f, 0.24f);
                return s;
            }
            label = Mk(26); small = Mk(21); tiny = Mk(17); title = Mk(30, FontStyle.Bold); huge = Mk(110, FontStyle.Normal, TextAnchor.MiddleCenter);
            sub = Mk(30, FontStyle.Normal, TextAnchor.MiddleCenter); center = Mk(26, FontStyle.Normal, TextAnchor.MiddleCenter);
            prompt = Mk(22, FontStyle.Bold, TextAnchor.MiddleCenter);
            panel = new GUIStyle { normal = { background = round }, border = new RectOffset(12, 12, 12, 12), padding = new RectOffset(22, 22, 16, 16) };
            panelSoft = new GUIStyle(panel) { normal = { background = roundSoft } };
            button = Mk(24, FontStyle.Bold, TextAnchor.MiddleCenter);
            button.normal.background = btn; button.hover.background = btnHover; button.active.background = btnOn;
            button.hover.textColor = new Color(0.14f, 0.19f, 0.24f); button.active.textColor = Color.white;
            button.border = new RectOffset(10, 10, 10, 10); button.padding = new RectOffset(14, 14, 10, 10);
            buttonBig = new GUIStyle(button) { fontSize = 30 };
            chip = new GUIStyle(button) { fontSize = 19 };
        }

        static Texture2D RoundedTex(int s, int r, Color fill, Color edge)
        {
            var t = new Texture2D(s, s, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, filterMode = FilterMode.Bilinear };
            for (int y = 0; y < s; y++)
                for (int x = 0; x < s; x++)
                {
                    float dx = Mathf.Max(0, Mathf.Max(r - x, x - (s - 1 - r))), dy = Mathf.Max(0, Mathf.Max(r - y, y - (s - 1 - r)));
                    float d = Mathf.Sqrt(dx * dx + dy * dy);
                    float a = Mathf.Clamp01(r - d + 0.5f);
                    bool border = d > r - 1.5f || x == 0 || y == 0 || x == s - 1 || y == s - 1;
                    var c = border && dx + dy > 0 || x < 1 || y < 1 || x > s - 2 || y > s - 2 ? edge : fill;
                    if (edge.a == 0) c = fill;
                    c.a *= a;
                    t.SetPixel(x, y, c);
                }
            t.Apply();
            return t;
        }

        void Box(Rect r, Color c) { var o = GUI.color; GUI.color = c; GUI.DrawTexture(r, white); GUI.color = o; }

        // --- draw ------------------------------------------------------------------------------------------
        void OnGUI()
        {
            if (G == null) return;
            Styles();
            S = Screen.height / H;
            W = Screen.width / S;
            GUI.matrix = Matrix4x4.Scale(new Vector3(S, S, 1));

            if (G.Menu == null || G.Menu == "choice") DrawHud();
            switch (G.Menu)
            {
                case "title": Title(); break;
                case "pause": Pause(); break;
                case "settings": SettingsMenu(); break;
                case "laws": LawsMenu(); break;
                case "journal": Journal(); break;
                case "choice": Choices(); break;
                case "decision": Decision(); break;
                case "ending": Ending(); break;
            }
            if (flashT > 0)
            {
                float a = 1 - (Time.unscaledTime - flashT) / 0.7f;
                if (a > 0) Box(new Rect(0, 0, W, H), new Color(flash.r, flash.g, flash.b, flash.a * a));
            }
            if (fade > 0) Box(new Rect(0, 0, W, H), new Color(0, 0, 0, fade));
        }

        void DrawHud()
        {
            var F = G.Facts;
            float t = Time.unscaledTime;
            // crosshair + prompt
            var f = G.Interactor.Focus;
            Box(new Rect(W / 2 - 2, H / 2 - 2, 4, 4), new Color(1, 1, 1, f != null ? 0.95f : 0.55f));
            if (f != null && !G.Dialogue.Blocking)
            {
                var txt = (G.Input.IsTouch ? "" : "[E]  ") + f.Prompt;
                GUI.Label(new Rect(W / 2 - 400, H * 0.58f, 800, 40), $"<color=#23303c>{txt}</color>", prompt);
            }

            // reality state (shape + colour + number, colour-blind safe)
            if (F.Has("has_device"))
            {
                var room = G.BP.Rooms[G.Room];
                bool locked = G.Engine.IsLocked(G.Room);
                GUI.Label(new Rect(28, 22, 600, 30), $"<color=#7b8794>{room.Name}{(locked ? "  <color=#e2574a>(UNRESPONSIVE)</color>" : "")}</color>", small);
                string[] glyph = { "■", "▲", "●" };
                string[] col = { "#4f9fe8", "#e86a9c", "#22aeb9" };
                for (int i = 0; i < 3; i++)
                {
                    bool cur = RealityStates.All[i] == G.RoomState;
                    var r = new Rect(28 + i * 175, 56, 165, 42);
                    if (cur) Box(r, Palette.Hex(col[i]) * new Color(1, 1, 1, 0.9f));
                    else Box(r, new Color(1, 1, 1, 0.7f));
                    GUI.Label(r, cur ? $"<color=#ffffff><b>{glyph[i]} {i + 1} {RealityStates.All[i]}</b></color>" : $"<color=#7b8794>{glyph[i]} {i + 1} {RealityStates.All[i]}</color>", center);
                }
                // adrenaline + slip
                var a = G.Adrenaline;
                var bar = new Rect(28, 108, 515, 8);
                Box(bar, new Color(1, 1, 1, 0.75f));
                Box(new Rect(bar.x, bar.y, bar.width * a.Level, bar.height), Color.Lerp(Palette.Hex("#7fd8ff"), Palette.Hex("#ff8a70"), a.Level));
                Box(new Rect(bar.x, bar.y + 12, bar.width * a.SlipCharge, 4), Palette.Hex("#ffc04a"));
                if (a.CanSlip) GUI.Label(new Rect(28, 128, 515, 30), $"<color=#c98418{(Mathf.Sin(t * 8) > 0 ? "ff" : "88")}>SLIP READY  {(G.Input.IsTouch ? "" : "[V]")}</color>", small);
                if (a.Slipping) GUI.Label(new Rect(28, 128, 515, 30), "<color=#c98418>SLIPPING</color>", small);
            }

            // current understanding
            if (!string.IsNullOrEmpty(objectiveShown))
            {
                GUI.Label(new Rect(W - 640, 22, 612, 26), "<color=#7b8794><size=17>CURRENT UNDERSTANDING</size></color>", new GUIStyle(small) { alignment = TextAnchor.UpperRight });
                var col = glitchT >= 0 ? "#4f9fe8" : "#23303c";
                GUI.Label(new Rect(W - 640, 48, 612, 40), $"<color={col}>{objectiveShown}</color>", new GUIStyle(label) { alignment = TextAnchor.UpperRight });
            }

            // the Observer's attention
            if (G.Room == "hall" && !F.Has("observer_tethered"))
            {
                float s = Mathf.Min(1, G.Observer.Suspicion);
                var r = new Rect(W / 2 - 60, 24, 120, 26);
                Box(r, new Color(1, 1, 1, 0.8f));
                Box(new Rect(r.x + 3, r.y + 3, (r.width - 6) * s, r.height - 6), Color.Lerp(Palette.Hex("#7fd8ff"), Palette.Hex("#ff8a70"), s));
                GUI.Label(new Rect(W / 2 - 100, 52, 200, 24), $"<color=#5c6b79>{(G.Observer.Mode == "chase" ? "IT SEES YOU" : s > 0.35f ? "IT NOTICED SOMETHING" : "")}</color>", new GUIStyle(tiny) { alignment = TextAnchor.UpperCenter });
            }

            // held item, TICK
            if (G.Held != null)
            {
                var it = G.BP.Items.First(i => i.Id == G.Held);
                GUI.Label(new Rect(W - 640, H - 70, 612, 30), $"<color=#7b8794>CARRYING </color><color={(it.Echo ? "#22aeb9" : "#ffffff")}>{it.Label}</color>", new GUIStyle(small) { alignment = TextAnchor.UpperRight });
            }
            if (F.Has("has_tick") && !G.Input.IsTouch)
                GUI.Label(new Rect(W - 640, H - 40, 612, 26), "<color=#b07a0888>[H] ASK TICK   [L] LAWS   [J] LOG</color>", new GUIStyle(tiny) { alignment = TextAnchor.UpperRight });

            // subtitles
            var d = G.Dialogue;
            if (d.Current != null)
            {
                string shown = d.Current.Text.Substring(0, Mathf.Clamp(Mathf.FloorToInt(d.Shown), 0, d.Current.Text.Length));
                bool narr = d.Current.Who == "NONE" || d.Current.Who == "OBSERVER";
                string name = string.IsNullOrEmpty(d.Speaker) ? "" : $"<color={d.SpeakerColor}><size=18><b>{d.Speaker}</b></size></color>\n";
                string body = narr ? $"<i>{shown}</i>" : shown;
                var st = new GUIStyle(sub) { fontSize = Mathf.RoundToInt(30 * G.Settings.SubtitleScale) };
                float w = Mathf.Min(1100, W - 80);
                float h = st.CalcHeight(new GUIContent(name + body), w - 44) + 32;
                float y = G.Input.IsTouch ? H * 0.62f - h : H - 170 - h;
                GUI.Box(new Rect(W / 2 - w / 2, y, w, h), GUIContent.none, panelSoft);
                GUI.Label(new Rect(W / 2 - w / 2 + 22, y + 16, w - 44, h - 32), $"<color={(narr ? "#4a5866" : d.SpeakerColor)}>{name}{body}</color>", st);
            }

            // toasts
            float ty = H * 0.2f;
            foreach (var (text, t0, dur) in toasts.ToList())
            {
                float age = t - t0;
                if (age > dur) { toasts.Remove((text, t0, dur)); continue; }
                float a = Mathf.Clamp01(Mathf.Min(age * 4, (dur - age) * 2));
                var c = GUI.color; GUI.color = new Color(1, 1, 1, a);
                float w = 720, h = center.CalcHeight(new GUIContent(text), w - 40) + 28;
                GUI.Box(new Rect(W / 2 - w / 2, ty, w, h), GUIContent.none, panel);
                GUI.Label(new Rect(W / 2 - w / 2 + 20, ty + 14, w - 40, h - 28), text, center);
                GUI.color = c;
                ty += h + 10;
            }

            // memory fragment
            if (memory != null)
            {
                float age = t - memoryT;
                if (age > 7f) memory = null;
                else
                {
                    float a = Mathf.Clamp01(Mathf.Min(age * 3, (7f - age) * 2));
                    var c = GUI.color; GUI.color = new Color(1, 1, 1, a);
                    var r = new Rect(W / 2 - 420, H * 0.34f, 840, 200);
                    GUI.Box(r, GUIContent.none, panel);
                    GUI.Label(new Rect(r.x + 24, r.y + 16, r.width - 48, 30), $"<color=#c98418><size=18>MEMORY {memoryN} / {memoryTotal}</size></color>", small);
                    GUI.Label(new Rect(r.x + 24, r.y + 44, r.width - 48, 40), $"<color=#8a5a10><b>{memory.Title}</b></color>", title);
                    GUI.Label(new Rect(r.x + 24, r.y + 92, r.width - 48, 100), memory.Text, label);
                    GUI.color = c;
                }
            }

            if (G.Input.IsTouch) G.Mobile.Draw(W, H, white);
        }

        // --- menus -------------------------------------------------------------------------------------------
        Rect Panel(float w, float h) => new Rect(W / 2 - w / 2, H / 2 - h / 2, w, h);

        void Title()
        {
            Box(new Rect(0, 0, W, H), new Color(0.94f, 0.96f, 0.98f, 0.62f));
            GUI.Label(new Rect(0, 150, W, 140), "<color=#23303c><b>AFTER</b></color><color=#ff7a63><b>ZERO</b></color>", huge);
            GUI.Label(new Rect(0, 300, W, 40), "<color=#7b8794>Every time the ship forgets you, you wake up again.</color>", center);
            float y = 400;
            if (Btn(new Rect(W / 2 - 220, y, 440, 70), "BEGIN", buttonBig)) G.NewGame();
            y += 84;
            if (SaveSystem.HasSave && Btn(new Rect(W / 2 - 220, y, 440, 70), "CONTINUE", buttonBig)) G.Continue();
            if (SaveSystem.HasSave) y += 84;
            if (G.Legacy.Completions > 0 && Btn(new Rect(W / 2 - 220, y, 440, 70), $"CYCLE {G.Legacy.Cycle}  (NEW GAME+)", buttonBig)) G.NewGame(true);
            if (G.Legacy.Completions > 0) y += 84;
            if (Btn(new Rect(W / 2 - 220, y, 440, 60), "SETTINGS", button)) { settingsReturn = "title"; G.OpenMenu("settings"); }
            y += 74;
            if (!Application.isMobilePlatform && Btn(new Rect(W / 2 - 220, y, 440, 60), "QUIT", button)) Application.Quit();
            string controls = G.Input.IsTouch
                ? "Left thumb: move    Right thumb: look    SHIFT: change the room    USE: interact"
                : "WASD move   MOUSE look   SPACE jump   SHIFT run   C crouch/slide   E use   Q / RMB shift   1 2 3 choose state   V slip   L laws   J log   H hint";
            GUI.Label(new Rect(40, H - 110, W - 80, 30), $"<color=#7b8794>{controls}</color>", new GUIStyle(small) { alignment = TextAnchor.MiddleCenter });
            if (G.Legacy.EndingsSeen.Count > 0)
                GUI.Label(new Rect(40, H - 70, W - 80, 30), $"<color=#e86a9c88>ENDINGS FOUND: {G.Legacy.EndingsSeen.Count} / {StoryContent.Endings.Count}</color>", new GUIStyle(small) { alignment = TextAnchor.MiddleCenter });
        }

        void Pause()
        {
            var r = Panel(520, 520);
            GUI.Box(r, GUIContent.none, panel);
            GUI.Label(new Rect(r.x, r.y + 24, r.width, 40), "<b>PAUSED</b>", center);
            float y = r.y + 90;
            if (Btn(new Rect(r.x + 40, y, r.width - 80, 64), "RESUME", buttonBig)) G.CloseMenu(); y += 78;
            if (Btn(new Rect(r.x + 40, y, r.width - 80, 56), "LOG", button)) G.OpenMenu("journal"); y += 68;
            if (G.Facts.Has("has_device") && Btn(new Rect(r.x + 40, y, r.width - 80, 56), "DEVICE LAWS", button)) G.OpenMenu("laws"); y += 68;
            if (Btn(new Rect(r.x + 40, y, r.width - 80, 56), "SETTINGS", button)) { settingsReturn = "pause"; G.OpenMenu("settings"); } y += 68;
            if (Btn(new Rect(r.x + 40, y, r.width - 80, 56), "SAVE AND QUIT TO TITLE", button)) { G.Save(); G.OpenMenu("title"); }
        }

        void SettingsMenu()
        {
            var s = G.Settings;
            var r = Panel(820, 880);
            GUI.Box(r, GUIContent.none, panel);
            GUI.Label(new Rect(r.x, r.y + 20, r.width, 40), "<b>SETTINGS</b>", center);
            float y = r.y + 80, x = r.x + 40, w = r.width - 80;
            float Slider(string name, float v, float min, float max, string fmt)
            {
                GUI.Label(new Rect(x, y, w * 0.45f, 36), name, small);
                v = GUI.HorizontalSlider(new Rect(x + w * 0.45f, y + 12, w * 0.4f, 24), v, min, max);
                GUI.Label(new Rect(x + w * 0.88f, y, w * 0.12f, 36), v.ToString(fmt), small);
                y += 52;
                return v;
            }
            bool Toggle(string name, bool v)
            {
                if (Btn(new Rect(x, y, w, 46), (v ? "<color=#2f9a64>ON </color>  " : "<color=#7b8794>OFF</color>  ") + name, chip)) v = !v;
                y += 56;
                return v;
            }
            s.MouseSensitivity = Slider("Mouse sensitivity", s.MouseSensitivity, 0.3f, 6f, "0.0");
            s.TouchSensitivity = Slider("Touch sensitivity", s.TouchSensitivity, 0.05f, 0.5f, "0.00");
            s.LookSmoothing = Slider("Look smoothing", s.LookSmoothing, 0f, 0.12f, "0.00");
            s.SubtitleScale = Slider("Subtitle size", s.SubtitleScale, 0.8f, 1.6f, "0.0");
            s.Volume = Slider("Volume", s.Volume, 0f, 1f, "0.0");
            s.InvertY = Toggle("Invert look", s.InvertY);
            s.InstantFlip = Toggle("Comfort: cut instead of rolling the camera when gravity flips", s.InstantFlip);
            s.ReduceFlashes = Toggle("Reduce flashes", s.ReduceFlashes);
            s.ObserverRemembers = Toggle("New Game+: the Observer remembers what you taught it", s.ObserverRemembers);
            GUI.Label(new Rect(x, y, w, 30), "<color=#7b8794>DIFFICULTY</color>", small); y += 34;
            string[] diffs = { "STORY", "NORMAL", "HARD" };
            for (int i = 0; i < 3; i++) if (Btn(new Rect(x + i * (w / 3), y, w / 3 - 8, 48), (s.Difficulty == i ? "<color=#2f9a64>" : "") + diffs[i] + (s.Difficulty == i ? "</color>" : ""), chip)) s.Difficulty = i;
            y += 60;
            GUI.Label(new Rect(x, y, w, 30), "<color=#7b8794>GRAPHICS</color>", small); y += 34;
            string[] q = { "LOW (BATTERY)", "MEDIUM", "HIGH" };
            for (int i = 0; i < 3; i++) if (Btn(new Rect(x + i * (w / 3), y, w / 3 - 8, 48), (s.Quality == i ? "<color=#2f9a64>" : "") + q[i] + (s.Quality == i ? "</color>" : ""), chip)) s.Quality = i;
            y += 66;
            if (Btn(new Rect(x, r.yMax - 84, w, 60), "DONE", buttonBig))
            {
                s.Save(); s.Apply();
                G.Cam.InstantFlip = s.InstantFlip;
                G.OpenMenu(settingsReturn ?? "pause");
            }
        }

        void LawsMenu()
        {
            var eng = G.Engine;
            var owned = Laws.Tokens.Keys.Where(k => G.Facts.Has("token_" + k)).ToList();
            var r = Panel(Mathf.Min(1180, W - 60), 860);
            GUI.Box(r, GUIContent.none, panel);
            GUI.Label(new Rect(r.x + 28, r.y + 20, 600, 40), "<b>DEVICE LAWS</b>", title);
            if (Btn(new Rect(r.xMax - 90, r.y + 18, 62, 50), "X", button)) G.CloseMenu();
            GUI.Label(new Rect(r.x + 28, r.y + 64, r.width - 56, 30), "<color=#7b8794>The device does what its laws say. Tap a token to cycle it, then install the law.</color>", small);
            float y = r.y + 110, x = r.x + 28, w = r.width - 56;
            for (int i = 0; i < eng.Slots; i++)
            {
                if (i >= eng.Unlocked)
                {
                    GUI.Label(new Rect(x, y, w, 44), $"<color=#7b8794>SLOT {i + 1}  -  LOCKED. {(i == 2 ? "Someone in the archive holds the key." : "Someone who stayed behind holds the key.")}</color>", small);
                    y += 60;
                    continue;
                }
                var d = draft[i];
                float cw = (w - 260) / 3f;
                GUI.Label(new Rect(x, y + 8, 30, 40), $"<color=#7b8794>{i + 1}</color>", label);
                d.Subject = ChipCycle(new Rect(x + 34, y, cw - 8, 54), d.Subject, TokenKind.Subject, owned, "#2f9a64");
                d.Verb = ChipCycle(new Rect(x + 34 + cw, y, cw - 8, 54), d.Verb, TokenKind.Verb, owned, "#c98418");
                d.Target = ChipCycle(new Rect(x + 34 + cw * 2, y, cw - 8, 54), d.Target, TokenKind.Target, owned, "#22aeb9");
                var installed = eng.InstalledLaws[i];
                bool active = (installed?.ToString() ?? new Law().ToString()) == d.ToString() || (installed == null && d.IsEmpty);
                if (Btn(new Rect(x + 34 + cw * 3, y, 150, 54), active ? "<color=#2f9a64>ACTIVE</color>" : "INSTALL", chip))
                {
                    var law = d.IsEmpty ? null : new Law(d.Subject, d.Verb, d.Target);
                    var res = eng.SetLaw(i, law);
                    if (res.Ok) { G.OnLawInstalled(law); lawFlash = law == null ? $"SLOT {i + 1} CLEARED" : $"<color=#2f9a64>LAW {i + 1} INSTALLED</color>"; }
                    else { G.Audio.Deny(); lawFlash = $"<color=#e2574a>{res.Error}</color>"; }
                }
                if (Btn(new Rect(x + 34 + cw * 3 + 160, y, 54, 54), "×", chip)) draft[i] = new Law();
                var p = Laws.Parse(d.IsEmpty ? null : d);
                GUI.Label(new Rect(x + 34, y + 58, w, 28), p.Ok ? $"<color=#7b8794>{(p.Empty ? "EMPTY SLOT" : p.Text)}</color>" : $"<color=#e2574a>{p.Error}</color>", tiny);
                y += 96;
            }
            if (lawFlash != "") GUI.Label(new Rect(x, y, w, 30), lawFlash, small);
            y += 36;
            foreach (var px in eng.Paradoxes) { GUI.Label(new Rect(x, y, w, 26), $"<color=#e2574a>{px}</color>", tiny); y += 26; }
            GUI.Label(new Rect(x, y, w, 30), "<color=#7b8794>TOKENS FOUND</color>", small);
            y += 32;
            GUI.Label(new Rect(x, y, w, 90), string.Join("   ", owned.Select(k => $"<color={(Laws.Tokens[k].Kind == TokenKind.Subject ? "#2f9a64" : Laws.Tokens[k].Kind == TokenKind.Verb ? "#c98418" : "#22aeb9")}>{Laws.Tokens[k].Label}</color>")) + $"\n<color=#7b8794><size=16>{owned.Count} / {Laws.Tokens.Count} tokens</size></color>", small);
        }

        string ChipCycle(Rect r, string current, TokenKind kind, List<string> owned, string color)
        {
            var opts = new List<string> { null };
            opts.AddRange(owned.Where(k => Laws.Tokens[k].Kind == kind));
            string text = current == null ? "<color=#7b8794>+</color>" : $"<color={color}>{Laws.Tokens[current].Label}</color>";
            if (Btn(r, text, chip)) return opts[(opts.IndexOf(current) + 1) % opts.Count];
            return current;
        }

        void Journal()
        {
            var r = Panel(Mathf.Min(1180, W - 60), 900);
            GUI.Box(r, GUIContent.none, panel);
            if (Btn(new Rect(r.xMax - 90, r.y + 18, 62, 50), "X", button)) G.CloseMenu();
            string[] tabs = { "UNDERSTANDING", "QUESTIONS", "THEORY LOG", "OBSERVER", "MEMORIES" };
            float tw = (r.width - 140) / tabs.Length;
            for (int i = 0; i < tabs.Length; i++)
                if (Btn(new Rect(r.x + 24 + i * tw, r.y + 18, tw - 8, 50), journalTab == i ? $"<color=#23303c><b>{tabs[i]}</b></color>" : $"<color=#7b8794>{tabs[i]}</color>", chip)) { journalTab = i; scroll = Vector2.zero; }
            var lines = new List<string>();
            var F = G.Facts;
            switch (journalTab)
            {
                case 0:
                    for (int i = 0; i < G.Objectives.History.Count; i++)
                    {
                        var h = G.Objectives.History[i];
                        bool last = i == G.Objectives.History.Count - 1;
                        lines.Add(last ? $"<b>{h.Text}</b>\n<color=#7b8794><size=18>{h.Because}</size></color>" : $"<color=#7b8794>~ {h.Text} ~</color>\n<color=#555f6a><size=18>{h.Because}</size></color>");
                    }
                    break;
                case 1:
                    foreach (var q in StoryContent.Questions.Where(q => F.Test(q.open)))
                        lines.Add(F.Test(q.closed) ? $"<color=#7b8794>{q.q}</color>\n<color=#2f9a64><size=18>{q.a}</size></color>" : $"<b>{q.q}</b>");
                    break;
                case 2: lines.AddRange(G.Log.AsEnumerable().Reverse()); break;
                case 3:
                    lines.AddRange(G.Observer.Brain.Summary().Select(s => $"<color=#b04a3e><i>{s}</i></color>"));
                    if (lines.Count == 0) lines.Add(F.Has("hall_seen") ? "<color=#7b8794>It has not learned anything about you. Yet.</color>" : "<color=#7b8794>-</color>");
                    break;
                case 4:
                    foreach (var m in G.BP.Memories)
                        lines.Add(F.Has("mem_" + m.Id) ? $"<color=#c98418><b>{m.Title}</b></color>\n{m.Text}" : "<color=#555f6a>? ? ?</color>");
                    break;
            }
            if (lines.Count == 0) lines.Add("<color=#7b8794>Nothing yet. Look closer.</color>");
            var view = new Rect(r.x + 30, r.y + 86, r.width - 60, r.height - 110);
            float innerW = view.width - 30;
            float total = lines.Sum(l => label.CalcHeight(new GUIContent(l), innerW) + 18);
            scroll = GUI.BeginScrollView(view, scroll, new Rect(0, 0, innerW, total));
            float yy = 0;
            foreach (var l in lines) { float h = label.CalcHeight(new GUIContent(l), innerW); GUI.Label(new Rect(0, yy, innerW, h), l, label); yy += h + 18; }
            GUI.EndScrollView();
        }

        void Choices()
        {
            var d = G.Dialogue;
            if (d.Choices == null) { G.CloseMenu(); return; }
            float w = Mathf.Min(1000, W - 80);
            float y = H - 120 - d.Choices.Length * 76;
            for (int i = 0; i < d.Choices.Length; i++)
            {
                if (Btn(new Rect(W / 2 - w / 2, y, w, 64), $"{i + 1}.  {d.Choices[i].Text}", button)) d.Choose(i);
                y += 76;
            }
            for (int i = 0; i < d.Choices.Length; i++)
                if (Event.current.type == EventType.KeyDown && Event.current.keyCode == KeyCode.Alpha1 + i) d.Choose(i);
        }

        void Decision()
        {
            var opts = StoryContent.Endings.ToList();
            var r = Panel(Mathf.Min(1100, W - 60), 760);
            GUI.Box(r, GUIContent.none, panel);
            GUI.Label(new Rect(r.x, r.y + 24, r.width, 40), "<b>THE CORE</b>", center);
            GUI.Label(new Rect(r.x + 40, r.y + 70, r.width - 80, 70), "<color=#7b8794>The field keeps one mind alive. The mind keeps the ship alive. The Undertow waits for either to let go.</color>", center);
            float y = r.y + 160;
            foreach (var e in opts)
            {
                bool ok = G.Facts.Test(e.When);
                var label = ok ? $"<b>{e.Choice}</b>\n<size=18><color=#7b8794>{e.Blurb}</color></size>"
                               : $"<color=#555f6a><b>? ? ?</b>\n<size=18>{(e.Id == "REWRITE" ? "Some laws have never been written. Some memories are still out there." : "You haven't looked at everything yet.")}</size></color>";
                GUI.enabled = ok;
                if (Btn(new Rect(r.x + 40, y, r.width - 80, 104), label, button)) G.Finish(e.Id);
                GUI.enabled = true;
                y += 118;
            }
            if (Btn(new Rect(r.x + 40, r.yMax - 60, r.width - 80, 44), "NOT YET", chip)) G.CloseMenu();
        }

        void Ending()
        {
            if (ending == null) return;
            Box(new Rect(0, 0, W, H), new Color(0.95f, 0.97f, 0.99f, 0.95f));
            var r = Panel(Mathf.Min(1200, W - 60), 1000);
            float x = r.x + 30, w = r.width - 60, y = r.y + 20;
            GUI.Label(new Rect(x, y, w, 60), $"<color=#e86a9c><size=48>{ending.Title}</size></color>", title); y += 76;
            foreach (var p in ending.Text) { float h = label.CalcHeight(new GUIContent(p), w); GUI.Label(new Rect(x, y, w, h), p, label); y += h + 12; }
            var F = G.Facts;
            int found = StoryContent.Discoveries.Count(dd => F.Has(dd));
            GUI.Label(new Rect(x, y, w, 30), $"<color=#7b8794>{G.PlayTime / 60f:0} min   •   {found}/{StoryContent.Discoveries.Length} discoveries   •   {F["memories"]}/12 memories   •   caught {F["times_caught"]}x   •   {G.Observer.Brain.Lessons.Count} lessons taught to the Observer   •   {F["hints_used"]} hints</color>", tiny);
            y += 44;
            GUI.Label(new Rect(x, y, w, 30), "<color=#7b8794>THREE QUESTIONS (stay on this device; copy the report to share)</color>", small); y += 34;
            string[] qs = { "What do you think happened?", "What do you want to investigate next?" };
            for (int i = 0; i < 2; i++)
            {
                GUI.Label(new Rect(x, y, w, 28), qs[i], small); y += 28;
                answers[i] = GUI.TextArea(new Rect(x, y, w, 56), answers[i], 400); y += 64;
            }
            GUI.Label(new Rect(x, y, w, 28), "Would you voluntarily play another 20 minutes?", small); y += 32;
            string[] yn = { "YES", "MAYBE", "NO" };
            for (int i = 0; i < 3; i++) if (Btn(new Rect(x + i * 160, y, 150, 48), another == yn[i] ? $"<color=#2f9a64>{yn[i]}</color>" : yn[i], chip)) another = yn[i];
            y += 64;
            if (Btn(new Rect(x, y, w / 3 - 10, 60), copied ? "COPIED" : "COPY PLAYTEST REPORT", button))
            {
                GUIUtility.systemCopyBuffer = Report(found);
                copied = true;
            }
            if (Btn(new Rect(x + w / 3, y, w / 3 - 10, 60), $"BEGIN CYCLE {G.Legacy.Cycle}", button)) G.NewGame(true);
            if (Btn(new Rect(x + 2 * w / 3, y, w / 3 - 10, 60), "TITLE", button)) G.OpenMenu("title");
        }

        string Report(int found)
        {
            var F = G.Facts;
            var o = new ReportData
            {
                ending = ending.Id,
                minutes = Mathf.Round(G.PlayTime / 6f) / 10f,
                discoveries = $"{found}/{StoryContent.Discoveries.Length}",
                memories = F["memories"],
                timesCaught = F["times_caught"],
                hintsUsed = F["hints_used"],
                slips = F["slips"],
                observerLessons = G.Observer.Brain.Lessons.ToArray(),
                objectives = G.Objectives.History.Select(h => h.Text).ToArray(),
                timeline = G.Timeline.ToArray(),
                happened = answers[0], next = answers[1], another20 = another,
                difficulty = G.Settings.DifficultyName, cycle = G.Cycle,
                platform = Application.platform.ToString(),
            };
            return JsonUtility.ToJson(o, true);
        }

        [Serializable]
        class ReportData
        {
            public string ending; public float minutes; public string discoveries; public int memories, timesCaught, hintsUsed, slips;
            public string[] observerLessons, objectives, timeline; public string happened, next, another20, difficulty, platform; public int cycle;
        }

        bool Btn(Rect r, string text, GUIStyle st) => GUI.Button(r, text, st);
    }
}
