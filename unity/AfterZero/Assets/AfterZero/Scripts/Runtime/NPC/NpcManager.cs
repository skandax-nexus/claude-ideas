// Spawns NPCs when their Appear condition holds and removes them when it
// stops holding, so characters move through the story (Juno is in the lab
// in Act I and the dormitory in Act II) without any per-scene setup.
using System.Collections.Generic;
using System.Linq;
using AfterZero.Core;
using AfterZero.Core.Content;
using UnityEngine;

namespace AfterZero.Runtime
{
    public class NpcManager : MonoBehaviour
    {
        GameManager G;
        readonly Dictionary<string, NpcActor> actors = new Dictionary<string, NpcActor>();
        public IEnumerable<NpcActor> Active => actors.Values.Where(a => a != null && a.gameObject.activeSelf);

        public void Init(GameManager g) { G = g; }

        public void Reset()
        {
            foreach (var a in actors.Values) if (a) Destroy(a.gameObject);
            actors.Clear();
        }

        void Update()
        {
            if (G == null || !G.Running) return;
            foreach (var def in StoryContent.Npcs)
            {
                bool want = G.Facts.Test(def.Appear);
                actors.TryGetValue(def.Id, out var a);
                if (want && a == null) actors[def.Id] = Spawn(def);
                else if (!want && a != null) { Destroy(a.gameObject); actors.Remove(def.Id); }
            }
        }

        NpcActor Spawn(NpcDef def)
        {
            var go = new GameObject("NPC_" + def.Id);
            go.transform.SetParent(transform, false);
            go.transform.position = new Vector3(def.X, def.Y, def.Z);
            go.transform.rotation = Quaternion.Euler(0, def.Yaw, 0);
            var a = go.AddComponent<NpcActor>();
            a.Init(G, def);
            return a;
        }

        public void DropIn(string id)
        {
            var def = StoryContent.Npcs.First(n => n.Id == id);
            if (!actors.TryGetValue(id, out var a) || a == null) actors[id] = a = Spawn(def);
            a.DropFrom(def.Y + 11f);
        }

        public void FaceTalk(string id)
        {
            if (actors.TryGetValue(id, out var a) && a) a.Talk();
        }
    }

    public class NpcActor : MonoBehaviour
    {
        public NpcDef Def { get; private set; }
        GameManager G;
        Humanoid.Rig rig;
        float talk, dropFrom = float.NaN, dropT;
        TextMesh nameTag;

        public void Init(GameManager g, NpcDef def)
        {
            G = g;
            Def = def;
            var themed = g.Theme != null ? g.Theme.Prop("npc:" + def.Id) : null;
            if (themed != null) Instantiate(themed, transform, false);
            else
            {
                var style = def.Model == "hologram" ? Humanoid.Style.Hologram : def.Model == "human_old" ? Humanoid.Style.Old : def.Model == "human_officer" ? Humanoid.Style.Officer : Humanoid.Style.Solid;
                var body = Humanoid.Build(def.Color, style, def.Model == "human_officer" ? 1.9f : def.Model == "human_old" ? 1.7f : 1.8f);
                body.transform.SetParent(transform, false);
                rig = body.GetComponent<Humanoid.Rig>();
            }
            var cap = gameObject.AddComponent<CapsuleCollider>();
            cap.center = new Vector3(0, 0.9f, 0);
            cap.height = 1.8f;
            cap.radius = 0.3f;

            var tag = new GameObject("Name");
            tag.transform.SetParent(transform, false);
            tag.transform.localPosition = Vector3.up * 2.15f;
            nameTag = tag.AddComponent<TextMesh>();
            nameTag.text = def.Name.ToUpperInvariant();
            nameTag.fontSize = 64; nameTag.characterSize = 0.03f; nameTag.anchor = TextAnchor.MiddleCenter;
            nameTag.color = Palette.Hex(def.Color);
            var f = LevelBuilder.BuiltinFont;
            if (f) { nameTag.font = f; tag.GetComponent<MeshRenderer>().sharedMaterial = f.material; }
            tag.AddComponent<Billboard>();
        }

        public void DropFrom(float y)
        {
            dropFrom = y;
            dropT = 0;
            transform.position = new Vector3(Def.X, y, Def.Z);
            transform.rotation = Quaternion.Euler(0, Def.Yaw, 180);
        }

        public void Talk() => talk = 3f;

        void Update()
        {
            if (G == null) return;
            float dt = Time.deltaTime;
            if (!float.IsNaN(dropFrom))
            {
                // Juno lets go of the ceiling: fall and flip upright
                dropT += dt;
                float k = Mathf.Clamp01(dropT / 0.9f);
                transform.position = new Vector3(Def.X, Mathf.Lerp(dropFrom, Def.Y, k * k), Def.Z);
                transform.rotation = Quaternion.Euler(0, Def.Yaw, Mathf.Lerp(180, 0, Mathf.SmoothStep(0, 1, k)));
                if (k >= 1) { dropFrom = float.NaN; G.Cam.AddTrauma(0.25f); G.Audio.Land(8); }
                return;
            }
            var player = G.Motor.transform.position;
            var to = player - transform.position;
            to.y = 0;
            float d = to.magnitude;
            if (d < 7f && d > 0.1f)
            {
                var want = Quaternion.LookRotation(to.normalized, Vector3.up);
                transform.rotation = Quaternion.Slerp(transform.rotation, want, dt * 3f);
            }
            if (talk > 0) talk -= dt;
            if (rig) rig.Pose(Time.time, 0, G.Dialogue.Active && talk > 0 ? 1 : 0);
            if (nameTag) nameTag.gameObject.SetActive(d < 6f);
        }
    }
}
