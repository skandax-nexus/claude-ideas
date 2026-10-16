// Android/iOS controls: a floating left stick, right-side look drag and
// thumb buttons. Multi-touch is read directly from Input.touches every frame
// (IMGUI only draws them), so you can run, look and shift at the same time.
using System.Collections.Generic;
using UnityEngine;

namespace AfterZero.Runtime
{
    public class MobileControls : MonoBehaviour
    {
        GameManager G;
        int stickId = -1, lookId = -1;
        Vector2 stickOrigin, stickPos, lastLook;
        readonly HashSet<int> buttonFingers = new HashSet<int>();
        readonly Dictionary<string, float> pressedAt = new Dictionary<string, float>();

        struct Btn { public string Name, Label; public Vector2 C; public float R; public Act A; public string Color; }
        readonly List<Btn> buttons = new List<Btn>();

        const float StickR = 120f;

        void Awake() { G = GetComponent<GameManager>(); }

        float Scale => Screen.height / 1080f;
        float VW => Screen.width / Scale;

        void Layout()
        {
            buttons.Clear();
            float w = VW, h = 1080f;
            bool device = G.Facts.Has("has_device");
            buttons.Add(new Btn { Name = "use", Label = "USE", C = new Vector2(w - 370, h - 330), R = 70, A = Act.Use, Color = "#ffffff" });
            buttons.Add(new Btn { Name = "jump", Label = "JUMP", C = new Vector2(w - 400, h - 140), R = 62, A = Act.Jump, Color = "#ffffff" });
            buttons.Add(new Btn { Name = "crouch", Label = "SLIDE", C = new Vector2(w - 580, h - 110), R = 52, A = Act.Crouch, Color = "#ffffff" });
            if (device)
            {
                string col = G.RoomState == "ECHO" ? "#4ff0ff" : G.RoomState == "INVERTED" ? "#ff5ab4" : "#e8f4ff";
                buttons.Add(new Btn { Name = "shift", Label = "SHIFT", C = new Vector2(w - 180, h - 180), R = 92, A = Act.Shift, Color = col });
                if (G.Adrenaline.CanSlip) buttons.Add(new Btn { Name = "slip", Label = "SLIP", C = new Vector2(w - 180, h - 400), R = 60, A = Act.Slip, Color = "#ffd040" });
            }
            float tx = w / 2 - 260;
            if (device) buttons.Add(new Btn { Name = "laws", Label = "LAWS", C = new Vector2(tx, 130), R = 40, A = Act.Laws, Color = "#9dff9d" });
            buttons.Add(new Btn { Name = "log", Label = "LOG", C = new Vector2(tx + 130, 130), R = 40, A = Act.Journal, Color = "#ffffff" });
            if (G.Facts.Has("has_tick")) buttons.Add(new Btn { Name = "hint", Label = "TICK", C = new Vector2(tx + 260, 130), R = 40, A = Act.Hint, Color = "#ffe066" });
            buttons.Add(new Btn { Name = "pause", Label = "II", C = new Vector2(tx + 390, 130), R = 40, A = Act.Pause, Color = "#ffffff" });
        }

        void Update()
        {
            if (!G.Input.IsTouch) return;
            if (!G.Running) { stickId = lookId = -1; buttonFingers.Clear(); G.Input.TouchStick = Vector2.zero; return; }
            Layout();
            float s = Scale;
            for (int i = 0; i < Input.touchCount; i++)
            {
                var t = Input.GetTouch(i);
                var p = new Vector2(t.position.x / s, (Screen.height - t.position.y) / s);
                switch (t.phase)
                {
                    case TouchPhase.Began:
                        bool hit = false;
                        foreach (var b in buttons)
                            if ((p - b.C).magnitude < b.R * 1.15f)
                            {
                                G.Input.Push(b.A);
                                pressedAt[b.Name] = Time.unscaledTime;
                                buttonFingers.Add(t.fingerId);
                                hit = true;
#if UNITY_ANDROID || UNITY_IOS
                                Handheld.Vibrate();
#endif
                                break;
                            }
                        if (hit) break;
                        if (p.x < VW * 0.4f && stickId < 0) { stickId = t.fingerId; stickOrigin = p; stickPos = p; }
                        else if (lookId < 0) { lookId = t.fingerId; lastLook = t.position; }
                        break;
                    case TouchPhase.Moved:
                    case TouchPhase.Stationary:
                        if (t.fingerId == stickId) stickPos = p;
                        else if (t.fingerId == lookId)
                        {
                            var delta = t.position - lastLook;
                            lastLook = t.position;
                            // pixels -> degrees, normalised for screen density
                            G.Input.TouchLook += delta / s;
                        }
                        break;
                    case TouchPhase.Ended:
                    case TouchPhase.Canceled:
                        if (t.fingerId == stickId) stickId = -1;
                        if (t.fingerId == lookId) lookId = -1;
                        buttonFingers.Remove(t.fingerId);
                        break;
                }
            }
            if (stickId >= 0)
            {
                var v = stickPos - stickOrigin;
                if (v.magnitude > StickR) { stickOrigin += v.normalized * (v.magnitude - StickR); v = stickPos - stickOrigin; } // the stick follows your thumb
                G.Input.TouchStick = new Vector2(v.x / StickR, -v.y / StickR);
            }
            else G.Input.TouchStick = Vector2.zero;
        }

        public void Draw(float w, float h, Texture2D white)
        {
            var c0 = GUI.color;
            // stick
            Vector2 o = stickId >= 0 ? stickOrigin : new Vector2(220, h - 230);
            Vector2 k = stickId >= 0 ? stickOrigin + Vector2.ClampMagnitude(stickPos - stickOrigin, StickR) : o;
            Circle(o, StickR, new Color(1, 1, 1, 0.07f), white);
            Circle(k, 48, new Color(1, 1, 1, 0.22f), white);
            var st = new GUIStyle { alignment = TextAnchor.MiddleCenter, fontSize = 20, fontStyle = FontStyle.Bold, font = LevelBuilder.BuiltinFont };
            foreach (var b in buttons)
            {
                bool down = pressedAt.TryGetValue(b.Name, out var at) && Time.unscaledTime - at < 0.15f;
                var col = Palette.Hex(b.Color);
                Circle(b.C, b.R, new Color(0, 0, 0, down ? 0.55f : 0.32f), white);
                Ring(b.C, b.R, new Color(col.r, col.g, col.b, 0.75f), white);
                st.normal.textColor = col;
                GUI.Label(new Rect(b.C.x - b.R, b.C.y - b.R, b.R * 2, b.R * 2), b.Label, st);
            }
            GUI.color = c0;
        }

        // cheap filled circle: stacked rects (no textures needed)
        static void Circle(Vector2 c, float r, Color col, Texture2D white)
        {
            GUI.color = col;
            int steps = Mathf.Clamp((int)(r / 6), 6, 20);
            for (int i = 0; i < steps; i++)
            {
                float y = -r + (i + 0.5f) * (2 * r / steps);
                float half = Mathf.Sqrt(Mathf.Max(0, r * r - y * y));
                GUI.DrawTexture(new Rect(c.x - half, c.y + y - r / steps, half * 2, 2 * r / steps), white);
            }
        }

        static void Ring(Vector2 c, float r, Color col, Texture2D white)
        {
            GUI.color = col;
            for (int i = 0; i < 48; i++)
            {
                float a = i / 48f * Mathf.PI * 2;
                GUI.DrawTexture(new Rect(c.x + Mathf.Cos(a) * r - 1.5f, c.y + Mathf.Sin(a) * r - 1.5f, 3, 3), white);
            }
        }
    }
}
