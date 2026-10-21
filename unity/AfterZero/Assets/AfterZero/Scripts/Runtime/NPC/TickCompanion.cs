// TICK: a little maintenance drone Ren built as a child. Follows you over
// your shoulder and is the game's hint system: ask once for a nudge, again
// for a direction, a third time for the answer. Never required, never judgy.
using AfterZero.Core;
using AfterZero.Core.Content;
using UnityEngine;

namespace AfterZero.Runtime
{
    public class TickCompanion : MonoBehaviour
    {
        GameManager G;
        Transform rotor;
        Material eye;
        string lastHint;
        int tier;
        float bob;

        public static TickCompanion Create(GameManager g)
        {
            var go = new GameObject("TICK");
            var t = go.AddComponent<TickCompanion>();
            t.G = g;
            var themed = g.Theme != null ? g.Theme.Prop("npc:tick") : null;
            if (themed != null) Instantiate(themed, go.transform, false);
            else
            {
                var body = new GameObject("Body");
                body.transform.SetParent(go.transform, false);
                body.AddComponent<MeshFilter>().sharedMesh = PropFactory.Sphere;
                body.AddComponent<MeshRenderer>().sharedMaterial = Palette.Lit(Palette.Hex("#c8a040"), null, 0.6f, 0.6f);
                body.transform.localScale = new Vector3(0.28f, 0.22f, 0.28f);
                var e = new GameObject("Eye");
                e.transform.SetParent(go.transform, false);
                e.transform.localPosition = new Vector3(0, 0.01f, 0.12f);
                e.transform.localScale = Vector3.one * 0.08f;
                e.AddComponent<MeshFilter>().sharedMesh = PropFactory.Sphere;
                t.eye = Palette.Emissive(Palette.Hex("#ffe066"), 3f);
                e.AddComponent<MeshRenderer>().sharedMaterial = t.eye;
                var r = new GameObject("Rotor");
                r.transform.SetParent(go.transform, false);
                r.transform.localPosition = Vector3.up * 0.13f;
                r.AddComponent<MeshFilter>().sharedMesh = Meshes.Torus(0.16f, 0.012f, 24, 4);
                r.AddComponent<MeshRenderer>().sharedMaterial = Palette.Get("metal");
                r.transform.localRotation = Quaternion.Euler(90, 0, 0);
                t.rotor = r.transform;
                var l = go.AddComponent<Light>();
                l.type = LightType.Point; l.range = 4; l.intensity = 0.8f; l.color = Palette.Hex("#ffe066"); l.shadows = LightShadows.None;
            }
            go.SetActive(false);
            return t;
        }

        void Update()
        {
            var cam = G.Cam;
            bob += Time.deltaTime;
            var target = cam.transform.position + cam.Right * 0.85f + cam.Up * (0.25f + Mathf.Sin(bob * 2.2f) * 0.05f) + cam.Heading * 0.9f;
            transform.position = Vector3.Lerp(transform.position, target, Time.deltaTime * 4f);
            var look = (G.Interactor.Focus?.Pos ?? cam.transform.position + cam.Forward * 5f) - transform.position;
            if (look.sqrMagnitude > 0.01f) transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(look, cam.Up), Time.deltaTime * 5f);
            if (rotor) rotor.Rotate(0, 0, 900 * Time.deltaTime, Space.Self);
            if (eye) eye.SetColor("_EmissionColor", Palette.Hex("#ffe066") * (2.5f + Mathf.Sin(Time.time * 6) * (HasHint ? 1.2f : 0.2f)));
        }

        bool HasHint => DialogueLogic.HintFor(StoryContent.Hints, G.Facts, 0) != null;

        public void GiveHint()
        {
            if (!G.Facts.Has("has_tick"))
            {
                G.Dialogue.Play(new[] { new Line("YOU", G.Facts.Has("has_device") ? "Think. What changed when I touched it?" : "...Look closer.") });
                return;
            }
            var first = DialogueLogic.HintFor(StoryContent.Hints, G.Facts, 0);
            if (first == null) { G.Dialogue.Play(new[] { new Line("TICK", "NO HINTS. YOU ARE DOING GREAT. PROBABLY.") }); return; }
            if (first != lastHint) { lastHint = first; tier = 0; }
            var text = DialogueLogic.HintFor(StoryContent.Hints, G.Facts, tier);
            tier = Mathf.Min(tier + 1, 2);
            G.Facts.Inc("hints_used");
            G.Audio.Blip(880, 0.08f);
            G.Dialogue.Play(new[] { new Line("TICK", text) });
        }
    }

    /// The reality device in the player's left hand, coloured by the room's state.
    public class DeviceView : MonoBehaviour
    {
        GameManager G;
        Transform shell, core;
        Material shellMat, coreMat;
        Vector3 sway;

        public void Init(GameManager g)
        {
            G = g;
            // third person: the device glows in the character's left hand
            transform.SetParent(g.Cam.ThirdPerson ? g.Avatar.Hand : g.Cam.transform, false);
            transform.localPosition = g.Cam.ThirdPerson ? Vector3.zero : new Vector3(-0.32f, -0.26f, 0.6f);
            transform.localScale = g.Cam.ThirdPerson ? Vector3.one * 1.6f : Vector3.one;
            core = Part("Core", 0.09f, coreMat = Palette.Emissive(Color.white, 3f));
            shell = Part("Shell", 0.16f, shellMat = Palette.Unlit(Palette.Hex("#9a7bff"), 0.55f));
        }

        Transform Part(string n, float s, Material m)
        {
            var go = new GameObject(n);
            go.transform.SetParent(transform, false);
            go.transform.localScale = Vector3.one * s;
            go.AddComponent<MeshFilter>().sharedMesh = PropFactory.Octa;
            var r = go.AddComponent<MeshRenderer>();
            r.sharedMaterial = m;
            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            go.layer = 2;
            return go.transform;
        }

        void LateUpdate()
        {
            if (G == null) return;
            bool on = G.Facts.Has("has_device");
            core.gameObject.SetActive(on);
            shell.gameObject.SetActive(on);
            if (!on) return;
            var s = G.RoomState;
            Color c = s == RealityStates.Echo ? Palette.Hex("#22aeb9") : s == RealityStates.Inverted ? Palette.Hex("#e86a9c") : Palette.Hex("#4f9fe8");
            if (G.Adrenaline.CanSlip || G.Adrenaline.Slipping) c = Color.Lerp(c, Palette.Hex("#ffd040"), 0.5f + Mathf.Sin(Time.unscaledTime * 10) * 0.5f);
            c.a = 0.5f;
            shellMat.SetColor("_BaseColor", c);
            shellMat.color = c;
            coreMat.SetColor("_EmissionColor", c * (G.Engine.IsLocked(G.Room) ? 0.5f : 3f));
            shell.Rotate(30 * Time.unscaledDeltaTime, 80 * Time.unscaledDeltaTime, 0);
            // weapon-style sway from look + motion
            var target = new Vector3(-G.Input.Look.x * 0.004f, -G.Input.Look.y * 0.004f, 0) + Vector3.up * Mathf.Sin(Time.time * 7f) * 0.006f * Mathf.Clamp01(G.Motor.Speed / 4f);
            sway = Vector3.Lerp(sway, target, Time.unscaledDeltaTime * 8f);
            if (!G.Cam.ThirdPerson) transform.localPosition = new Vector3(-0.32f, -0.26f, 0.6f) + sway;
        }
    }
}
