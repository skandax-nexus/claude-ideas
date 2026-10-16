// The Director runs authored moments: touching, playing, speaking, carrying,
// and story events (Juno's entrance, the lockdown, Bael's wardens).
// Persistent consequences always go through facts so saves re-derive them.
using System;
using System.Collections.Generic;
using System.Linq;
using AfterZero.Core;
using AfterZero.Core.Content;
using UnityEngine;

namespace AfterZero.Runtime
{
    public class Director
    {
        readonly GameManager G;
        readonly List<(float t, Action fn)> timers = new List<(float, Action)>();
        float armT, lookEast, baelTimer = -1;
        float shadowZ;
        const float ShadowWallX = 15.78f, ShadowPanelZ = -8f, ShadowRange = 12f, ShadowTolerance = 1.4f;
        public Vector3 ShadowPos => new Vector3(15.1f, 1f, shadowZ);

        static readonly string[] BaseTokens = { "GRAVITY", "INVERTS", "PHYSICAL", "INVERTED", "ECHO" };

        public Director(GameManager g)
        {
            G = g;
        }

        public void After(float sec, Action fn) => timers.Add((sec, fn));
        public void Say(string id, Action done = null) => G.Dialogue.Play(StoryContent.Scripts[id], done);

        // --- effects raised by rules, triggers and dialogue --------------------------------------
        public void HandleEffect(Effect e)
        {
            if (e.Log != null) { G.Log.Add(e.Log); G.Hud.Toast("<size=75%>THEORY LOG</size>\n" + e.Log, 4.5f); }
            if (e.Say != null) Say(e.Say);
            if (e.Token != null) G.GrantToken(e.Token);
            if (e.Event != null) Event(e.Event);
        }

        void Event(string id)
        {
            switch (id)
            {
                case "juno_drop":
                    G.Facts.Set("met_juno");
                    G.Facts.Set("has_tick");
                    G.Npcs.DropIn("juno");
                    G.Cam.AddTrauma(0.35f);
                    After(0.9f, () => Say("juno_drop", () => Say("tick_hello")));
                    break;
                case "unlock_slot_3": G.Engine.UnlockSlot(3); G.Hud.Toast("THIRD LAW SLOT UNLOCKED"); G.Audio.Chime(1.2f); break;
                case "unlock_slot_4": G.Engine.UnlockSlot(4); G.Hud.Toast("FOURTH LAW SLOT UNLOCKED"); G.Audio.Chime(1.3f); break;
                case "lockdown_start":
                    G.Audio.Alarm(true);
                    G.Atmos.Alarm(true);
                    G.Cam.AddTrauma(0.6f);
                    break;
                case "bael_wardens":
                    G.Facts.Set("bael_fight");
                    baelTimer = 25f;
                    break;
            }
        }

        // --- interactions ---------------------------------------------------------------------------
        public void Use(string id)
        {
            var F = G.Facts;
            switch (id)
            {
                case "shard": TouchShard(); break;
                case "r1": Say("r1", () => F.Set("heard_varga")); break;
                case "r0": Say("r0", () => F.Set("heard_self")); break;
                case "r2": Say("r2", () => F.Set("vault_seen")); break;
                case "machine": Machine(); break;
                case "archive_lock": ArchiveLock(); break;
                case "shadow": Say("shadow_cold"); break;
                case "bunk42": Say("bunk42", () => F.Set("seen_bunk42")); break;
                case "launch_log": F.Set("has_launch_log"); Say("launch_log"); G.Audio.Chime(0.8f); break;
                case "brain": G.Dialogue.Play(new[] { new Line("YOU", "That's me. Everything I am, in a jar, holding the ship together.") }); F.Set("brain_seen"); break;
                case "observer": Say("observer_face", () => F.Set("observer_faced")); break;
                case "core_terminal": G.OpenMenu("decision"); break;
            }
        }

        public void Talk(string npcId)
        {
            var npc = G.Npcs.Active.FirstOrDefault(a => a.Def.Id == npcId)?.Def;
            if (npc == null) return;
            var node = DialogueLogic.Pick(npc, G.Facts);
            G.Npcs.FaceTalk(npcId);
            if (node == null) { G.Dialogue.Play(new[] { new Line(SpeakerOf(npc), "...") }); return; }
            G.Dialogue.Converse(npc, node);
        }

        static string SpeakerOf(NpcDef n) => n.Id.StartsWith("juno") ? "JUNO" : n.Id.ToUpperInvariant();

        void TouchShard()
        {
            var F = G.Facts;
            int n = F["shard_touch"];
            if (n == 0)
            {
                F.Set("shard_touch", 1);
                G.Engine.SetOverride("cradle", "zeroG", true);
                G.Audio.Sweep(true);
                G.Hud.Flash(new Color(0.55f, 0.43f, 1f, 0.5f));
            }
            else if (n == 1)
            {
                G.Engine.SetOverride("cradle", "zeroG", null);
                G.Engine.Lock("cradle", false);
                foreach (var t in BaseTokens) F.Set("token_" + t);
                F.Set("has_device");
                F.Set("shard_touch", 2);
                G.Engine.SetState("cradle", RealityStates.Inverted);
                G.Audio.Sweep(false);
                G.Hud.Flash(new Color(1f, 0.35f, 0.7f, 0.55f));
                G.Cam.AddTrauma(0.4f);
                After(1.8f, () => Say("other_speaks"));
                After(2.6f, () => G.Hud.Toast(G.Input.IsTouch
                    ? "The object is part of you now.\n<size=80%>SHIFT changes the state of the room you stand in.</size>"
                    : "The object is part of you now.\n<size=80%>[Q] / right-click: shift the room   [1][2][3]: choose a state</size>", 6f));
            }
        }

        void Machine()
        {
            var F = G.Facts;
            if (!F.Has("core_installed"))
            {
                if (G.Held == "core") { G.Held = null; F.Set("core_installed"); G.Audio.Chime(0.9f); Say("machine_installed"); }
                else Say("machine_empty");
            }
            else if (!F.Has("machine_activated"))
            {
                if (armT > 0)
                {
                    armT = 0;
                    F.Set("machine_activated");
                    G.Atmos.OnShift();
                    G.Hud.Flash(new Color(1, 1, 1, 0.9f));
                    G.Cam.AddTrauma(0.7f);
                    G.Audio.Sweep(true);
                    Say("machine_activate");
                }
                else { armT = 4f; Say("machine_warn"); }
            }
            else G.Dialogue.Play(new[] { new Line("NONE", "The machine hums with the field. Whatever it's anchoring isn't here. It's further up.") });
        }

        void ArchiveLock()
        {
            var F = G.Facts;
            if (G.Held == "key")
            {
                if (G.Engine.State("lab") == RealityStates.Echo) { G.Audio.Deny(); Say("lock_echo_key"); }
                else { G.Held = null; F.Set("archive_open"); G.Audio.Chime(1f); Say("lock_open"); }
            }
            else { G.Audio.Deny(); Say("lock_no_key", () => F.Set("custodian_denied")); }
        }

        // --- reactions --------------------------------------------------------------------------------
        public void OnShift(string room, string from, string to)
        {
            var F = G.Facts;
            if (to == RealityStates.Echo) F.Set("seen_echo");
            if (room == "lab" && to == RealityStates.Echo && !F.Has("shadow_passage_open"))
            {
                F.Set("shadow_solid_seen");
                if (Mathf.Abs(shadowZ - ShadowPanelZ) < ShadowTolerance)
                    After(0.6f, () => { F.Set("shadow_passage_open"); G.Audio.Chime(1f); Say("shadow_opens"); });
            }
        }

        public void Tick(float dt)
        {
            var F = G.Facts;
            for (int i = timers.Count - 1; i >= 0; i--)
            {
                var (t, fn) = timers[i];
                t -= dt;
                if (t <= 0) { timers.RemoveAt(i); fn(); }
                else timers[i] = (t, fn);
            }
            if (armT > 0) armT -= dt;
            G.Dialogue.Update(Time.unscaledDeltaTime);

            // the Other dissolves when you come close
            if (F.Test("shard_touch >= 2 && !other_gone") && Vector3.Distance(G.Motor.transform.position, new Vector3(0, 4, -19.5f)) < 3f)
                F.Set("other_gone");

            // the mirrored shadow on the lab's east wall
            var p = G.Motor.transform.position;
            bool open = F.Has("shadow_passage_open");
            string lab = G.Engine.State("lab");
            if (G.Room == "lab" && lab != RealityStates.Echo)
            {
                shadowZ = Mathf.Clamp(-p.z, -ShadowRange, ShadowRange);
                if (G.Cam.Heading.x > 0.6f && G.Motor.Speed > 1f && p.x > -8 && !open)
                {
                    lookEast += dt;
                    if (lookEast > 1.2f) F.Set("noticed_shadow");
                }
            }
            if (G.World.Props.TryGetValue("shadow", out var sp))
            {
                sp.gameObject.SetActive(!open);
                var wall = sp.transform.Find("WallShadow");
                var body = sp.transform.Find("Body");
                if (wall) { wall.gameObject.SetActive(lab != RealityStates.Echo); wall.position = Vector3.Lerp(wall.position, new Vector3(ShadowWallX, 1f, shadowZ), dt * 10f); }
                if (body) { body.gameObject.SetActive(lab == RealityStates.Echo); body.position = new Vector3(15.1f, 0f, shadowZ); }
            }

            // Bael's last stand: survive the Wardens until the Undertow reaches the barrier
            if (baelTimer > 0 && !F.Has("bael_resolved"))
            {
                baelTimer -= dt;
                if (baelTimer <= 0) { F.Set("bael_dead"); F.Set("bael_resolved"); Say("bael_falls"); }
            }

            F.Set("observer_lessons", G.Observer.Brain.Lessons.Count);
        }
    }
}
