// Set-piece chases: Bael's Warden drones and the Undertow (a front that
// un-happens the corridor behind you, or rises through the Spine).
// The ChaseDirector starts/stops each ChaseDef from its conditions and
// returns the player to the chase's checkpoint when caught.
using System.Collections.Generic;
using System.Linq;
using AfterZero.Core;
using UnityEngine;

namespace AfterZero.Runtime
{
    public class ChaseDirector : MonoBehaviour
    {
        GameManager G;
        readonly Dictionary<string, List<GameObject>> running = new Dictionary<string, List<GameObject>>();
        public float Threat() => threat;
        float threat;

        public void Init(GameManager g) { G = g; }

        public void ResetAll()
        {
            foreach (var id in running.Keys.ToList()) Stop(G.BP.Chases.First(c => c.Id == id));
        }

        void Update()
        {
            if (G == null || !G.Running) return;
            threat = 0;
            foreach (var c in G.BP.Chases)
            {
                bool want = G.Facts.Test(c.StartWhen) && !G.Facts.Test(c.EndWhen);
                bool on = running.ContainsKey(c.Id);
                if (want && !on) Start(c);
                else if (!want && on) Stop(c);
            }
            foreach (var list in running.Values)
                foreach (var go in list)
                {
                    if (go == null) continue;
                    var d = go.GetComponent<WardenDrone>();
                    if (d) threat = Mathf.Max(threat, d.Threat());
                    var u = go.GetComponent<UndertowFront>();
                    if (u) threat = Mathf.Max(threat, u.Threat());
                }
        }

        void Start(ChaseDef c)
        {
            var list = new List<GameObject>();
            if (c.Kind == "drones")
            {
                for (int i = 0; i < c.Count; i++)
                {
                    var pos = new Vector3(c.StartX + (i - (c.Count - 1) / 2f) * 2.5f, c.Y, c.Z);
                    list.Add(WardenDrone.Create(G, c, pos).gameObject);
                }
                G.Audio.Alarm(true);
            }
            else list.Add(UndertowFront.Create(G, c).gameObject);
            running[c.Id] = list;
        }

        void Stop(ChaseDef c)
        {
            if (running.TryGetValue(c.Id, out var list)) foreach (var go in list) if (go) Destroy(go);
            running.Remove(c.Id);
            if (c.Kind != "drones") G.World.Uncollapse(c.Room);
            if (c.Kind == "drones" && !running.Values.SelectMany(l => l).Any(o => o && o.GetComponent<WardenDrone>())) { G.Audio.Alarm(false); G.Atmos.Alarm(false); }
        }

        /// Caught: back to the checkpoint, and the chase starts over.
        float restartIn;

        public void Caught(ChaseDef c)
        {
            G.Caught(c.Id == "lockdown" ? "lockdown" : c.Kind, c.Checkpoint);
            restartIn = 1.2f;
        }

        void LateUpdate()
        {
            if (restartIn <= 0) return;
            restartIn -= Time.unscaledDeltaTime;
            if (restartIn <= 0) RestartAll();
        }

        public static Box MainBounds(RoomDef r) => r.Bounds.OrderByDescending(b => b.SX * b.SY * b.SZ).First();

        void RestartAll()
        {
            foreach (var id in running.Keys.ToList())
            {
                var c = G.BP.Chases.First(x => x.Id == id);
                Stop(c);
                Start(c);
            }
        }
    }

    public class WardenDrone : MonoBehaviour
    {
        GameManager G;
        ChaseDef def;
        Vector3 home, vel;
        float seenFor, lostFor = 99, wander;
        Light spot;
        Material eyeMat;
        bool chasing;

        public static WardenDrone Create(GameManager g, ChaseDef c, Vector3 pos)
        {
            var go = new GameObject("Warden");
            go.transform.position = pos;
            var d = go.AddComponent<WardenDrone>();
            d.G = g; d.def = c; d.home = pos; d.wander = Random.value * 10f;
            var themed = g.Theme != null ? g.Theme.Prop("warden") : null;
            if (themed != null) Instantiate(themed, go.transform, false);
            else
            {
                var body = new GameObject("Body");
                body.transform.SetParent(go.transform, false);
                body.AddComponent<MeshFilter>().sharedMesh = PropFactory.Sphere;
                body.AddComponent<MeshRenderer>().sharedMaterial = Palette.Get("metal");
                body.transform.localScale = new Vector3(0.7f, 0.45f, 0.7f);
                var ring = new GameObject("Ring");
                ring.transform.SetParent(go.transform, false);
                ring.AddComponent<MeshFilter>().sharedMesh = Meshes.Torus(0.55f, 0.04f, 32, 6);
                ring.AddComponent<MeshRenderer>().sharedMaterial = Palette.Emissive(Palette.Hex("#ff3a2a"), 3f);
                ring.transform.localRotation = Quaternion.Euler(90, 0, 0);
            }
            var eye = new GameObject("Eye");
            eye.transform.SetParent(go.transform, false);
            eye.transform.localPosition = new Vector3(0, -0.1f, 0.3f);
            eye.transform.localScale = Vector3.one * 0.18f;
            eye.AddComponent<MeshFilter>().sharedMesh = PropFactory.Sphere;
            d.eyeMat = Palette.Emissive(Palette.Hex("#ff3a2a"), 5f);
            eye.AddComponent<MeshRenderer>().sharedMaterial = d.eyeMat;
            d.spot = eye.AddComponent<Light>();
            d.spot.type = LightType.Spot; d.spot.range = 18; d.spot.spotAngle = 55; d.spot.intensity = 3; d.spot.color = Palette.Hex("#ff5040"); d.spot.shadows = LightShadows.None;
            eye.transform.localRotation = Quaternion.Euler(25, 0, 0);
            return d;
        }

        public float Threat()
        {
            float dist = Vector3.Distance(transform.position, G.Motor.transform.position);
            return chasing ? 1f : Mathf.Clamp01(1f - dist / 20f) * 0.6f;
        }

        void Update()
        {
            if (G == null || !G.Running) return;
            float dt = Time.deltaTime * G.Engine.WorldTimeScale(def.Room);
            if (dt <= 0) return; // TIME FREEZES stops them cold
            var motor = G.Motor;
            var target = motor.transform.position + Vector3.up * 0.6f * -motor.GravityDir;
            var to = target - transform.position;
            float dist = to.magnitude;
            // Wardens are built to scan floors. They can't see someone walking on the ceiling.
            bool ceiling = motor.GravityDir == 1;
            bool los = dist < 20f && !ceiling && !Physics.Linecast(transform.position, target, ~(1 << 2), QueryTriggerInteraction.Ignore);
            if (los) { seenFor += dt; lostFor = 0; } else { lostFor += dt; seenFor = Mathf.Max(0, seenFor - dt); }
            chasing = seenFor > 0.35f || (chasing && lostFor < 2f);

            Vector3 goal;
            float speed = def.Speed * G.Settings.ThreatScale;
            if (chasing) goal = target;
            else
            {
                wander += dt * 0.4f;
                goal = home + new Vector3(Mathf.Sin(wander) * 8f, Mathf.Sin(wander * 1.7f) * 1.5f, Mathf.Cos(wander * 0.8f) * 8f);
                speed *= 0.45f;
            }
            var desired = (goal - transform.position).normalized * speed;
            // simple avoidance: steer away from what's ahead
            if (Physics.SphereCast(transform.position, 0.4f, vel.sqrMagnitude > 0.01f ? vel.normalized : transform.forward, out var hit, 2.2f, ~(1 << 2), QueryTriggerInteraction.Ignore))
                desired += hit.normal * speed;
            vel = Vector3.Lerp(vel, desired, dt * 2.5f);
            transform.position += vel * dt;
            if (vel.sqrMagnitude > 0.05f) transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(chasing ? to : vel), dt * 5f);
            transform.position += Vector3.up * Mathf.Sin(Time.time * 3f + wander) * 0.003f;
            eyeMat.SetColor("_EmissionColor", (chasing ? Palette.Hex("#ff2010") : Palette.Hex("#ffa040")) * 5f);
            spot.color = chasing ? Palette.Hex("#ff3020") : Palette.Hex("#ffb060");

            if (chasing && dist < 1.5f && !G.Catching) G.Chases.Caught(def);
        }
    }

    public class UndertowFront : MonoBehaviour
    {
        GameManager G;
        ChaseDef def;
        float front;
        Transform visual;
        bool rise;

        public static UndertowFront Create(GameManager g, ChaseDef c)
        {
            var go = new GameObject("Undertow_" + c.Id);
            var u = go.AddComponent<UndertowFront>();
            u.G = g; u.def = c; u.front = c.StartX; u.rise = c.Kind == "rise";
            var room = ChaseDirector.MainBounds(g.BP.Rooms[c.Room]);
            var v = GameObject.CreatePrimitive(PrimitiveType.Cube);
            Destroy(v.GetComponent<Collider>());
            v.transform.SetParent(go.transform, false);
            v.GetComponent<MeshRenderer>().sharedMaterial = Palette.Additive(Palette.Hex("#5a20a0"), 0.55f);
            if (u.rise) v.transform.localScale = new Vector3(room.SX, 0.6f, room.SZ);
            else v.transform.localScale = new Vector3(0.6f, 14f, room.SZ);
            u.visual = v.transform;
            var core = GameObject.CreatePrimitive(PrimitiveType.Cube);
            Destroy(core.GetComponent<Collider>());
            core.transform.SetParent(v.transform, false);
            core.transform.localScale = new Vector3(u.rise ? 1 : 3f, u.rise ? 3f : 1, 1);
            core.transform.localPosition = u.rise ? new Vector3(0, -2f, 0) : new Vector3(-2f, 0, 0);
            core.GetComponent<MeshRenderer>().sharedMaterial = Palette.Unlit(Palette.Hex("#08020f"), 0.92f);
            var sparks = PropFactory.Dust(Palette.Hex("#c080ff"), Vector3.zero, u.rise ? new Vector3(room.SX, 0.5f, room.SZ) : new Vector3(0.5f, 10f, room.SZ));
            sparks.transform.SetParent(go.transform, false);
            var em = sparks.emission; em.rateOverTime = 120;
            var main = sparks.main; main.startSpeed = 1.5f; main.startLifetime = 2.5f; main.startSize = new ParticleSystem.MinMaxCurve(0.04f, 0.14f);
            u.Place(room);
            g.Audio.Undertow(true);
            return u;
        }

        void Place(Box room)
        {
            transform.position = rise ? new Vector3(room.CX, front, room.CZ) : new Vector3(front, def.Y + 5f, room.CZ);
        }

        public float Threat()
        {
            var p = G.Motor.transform.position;
            float gap = rise ? p.y - front : p.x - front;
            return Mathf.Clamp01(1f - gap / 14f);
        }

        void OnDestroy() { if (G != null && G.Audio != null) G.Audio.Undertow(false); }

        void Update()
        {
            if (G == null || !G.Running) return;
            float dt = Time.deltaTime * G.Engine.WorldTimeScale(def.Room);
            // UNDERTOW FREEZES IN <state> holds it where it is
            if (G.Engine.HasIn("undertowHeld", def.Room)) dt = 0;
            front = Mathf.Min(def.EndX, front + def.Speed * G.Settings.ThreatScale * dt);
            Place(ChaseDirector.MainBounds(G.BP.Rooms[def.Room]));
            G.World.Collapse(def.Room, front, rise);
            visual.localRotation = Quaternion.Euler(0, 0, Mathf.Sin(Time.time * 7f) * 0.6f);

            var p = G.Motor.transform.position;
            bool touched = rise ? p.y - 0.85f < front : p.x - 0.35f < front;
            if (touched && !G.Catching && G.Room == def.Room) G.Chases.Caught(def);
        }
    }
}
