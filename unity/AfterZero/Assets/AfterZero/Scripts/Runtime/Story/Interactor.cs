// Picks the thing the player is most plausibly trying to use: interactables,
// items, NPCs and the Observer, scored by distance and how centred they are.
// Generous on purpose - aim assist for touch screens.
using AfterZero.Core;
using UnityEngine;

namespace AfterZero.Runtime
{
    public class Focus
    {
        public string Kind, Id, Prompt;
        public Vector3 Pos;
    }

    public class Interactor
    {
        readonly GameManager G;
        public Focus Focus { get; private set; }

        public Interactor(GameManager g) { G = g; }

        public void Update()
        {
            Focus = null;
            if (G.Catching) return;
            var eye = G.Cam.transform.position;
            var fwd = G.Cam.transform.forward;
            float best = float.MinValue;
            float assist = G.Input.IsTouch ? 0.45f : 0.6f;

            void Consider(string kind, string id, string prompt, Vector3 pos, float radius)
            {
                var v = pos - eye;
                float d = v.magnitude;
                if (d > radius) return;
                float dot = Vector3.Dot(v / Mathf.Max(d, 0.001f), fwd);
                if (dot < assist && d > 1.3f) return;
                float s = dot - d * 0.08f;
                if (s > best) { best = s; Focus = new Focus { Kind = kind, Id = id, Prompt = prompt, Pos = pos }; }
            }

            foreach (var i in G.BP.Interactables)
            {
                if (i.Radius <= 0 || !G.Facts.Test(i.When, G.Engine.State(i.Room))) continue;
                var pos = new Vector3(i.X, i.Y, i.Z);
                if (i.Id == "shadow") pos = G.Director.ShadowPos;
                Consider("interact", i.Id, i.Prompt, pos, i.Radius);
            }
            foreach (var it in G.BP.Items)
            {
                if (G.Held == it.Id || !G.World.ItemAvailable(it)) continue;
                Consider("item", it.Id, "TAKE " + it.Label, new Vector3(it.X, it.Y, it.Z), 2.4f);
            }
            foreach (var a in G.Npcs.Active)
                Consider("npc", a.Def.Id, a.Def.Prompt + "  " + a.Def.Name.ToUpperInvariant(), a.transform.position + Vector3.up * 1.5f, 3.2f);
            if (G.Facts.Test("observer_tethered && !observer_faced"))
                Consider("observer", "observer", "FACE IT", G.Observer.transform.position + Vector3.up * 2.2f, 4.5f);
        }

        public void Use()
        {
            var f = Focus;
            if (f == null) return;
            switch (f.Kind)
            {
                case "item":
                    G.Held = f.Id;
                    G.Audio.Pickup();
                    if (f.Id == "key") G.Facts.Set("key_taken");
                    break;
                case "npc": G.Director.Talk(f.Id); break;
                default: G.Director.Use(f.Id); break;
            }
        }
    }
}
