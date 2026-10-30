// The Observer: patrols the hall on the NavMesh, perceives the player by
// sight (cone + raycast line of sight) and hearing, and plans with the
// ObserverBrain's memory. Every lesson is announced; every lesson has a
// counter. After the player reaches the Core it stops hunting.
using System.Linq;
using AfterZero.Core;
using UnityEngine;
using UnityEngine.AI;

namespace AfterZero.Runtime
{
    public class ObserverAgent : MonoBehaviour
    {
        public ObserverBrain Brain { get; } = new ObserverBrain();
        public float Suspicion { get; private set; }
        public string Mode { get; private set; } = "patrol";

        GameManager G;
        HuntZone zone;
        NavMeshAgent agent;
        Humanoid.Rig rig;
        Light eyeLight;
        Material eyeMat;
        Transform head;

        float timer, lostTime, repath, hearCd, sightRange = 16f;
        Vector3 lastSeen, lookTarget;
        CoverDef inspectCover;
        bool frozen;
        string hidePillar; float hideT; bool hideRecorded;
        string crossingFrom; readonly System.Collections.Generic.Dictionary<string, int> crossingLanes = new System.Collections.Generic.Dictionary<string, int>();

        public static ObserverAgent Create(GameManager g, HuntZone zone)
        {
            var go = new GameObject("Observer");
            var o = go.AddComponent<ObserverAgent>();
            o.G = g;
            o.zone = zone;
            o.BuildBody();
            o.Brain.LessonLearned += (id, text) =>
            {
                g.Dialogue.Play(new[] { new Line("OBSERVER", text) });
                g.Log.Add("The Observer: " + text);
                g.Audio.ObserverCry();
            };
            o.ResetAgent();
            return o;
        }

        void BuildBody()
        {
            var themed = G.Theme != null ? G.Theme.Prop("observer") : null;
            if (themed != null) Instantiate(themed, transform, false);
            else
            {
                var body = Humanoid.Build("#7fd8ff", Humanoid.Style.Solid, 2.9f); // a sleek white sentinel
                body.transform.SetParent(transform, false);
                body.transform.localScale = new Vector3(0.75f, 1f, 0.75f); // too tall, too thin
                rig = body.GetComponent<Humanoid.Rig>();
                head = rig.Head;
            }
            var eye = new GameObject("Eye");
            eye.transform.SetParent(transform, false);
            eye.transform.localPosition = new Vector3(0, 2.72f, 0.16f);
            eye.transform.localScale = Vector3.one * 0.11f;
            eye.AddComponent<MeshFilter>().sharedMesh = PropFactory.Sphere;
            eyeMat = Palette.Emissive(Color.white, 6f);
            eye.AddComponent<MeshRenderer>().sharedMaterial = eyeMat;
            eyeLight = eye.AddComponent<Light>();
            eyeLight.type = LightType.Spot;
            eyeLight.spotAngle = 70;
            eyeLight.range = 16;
            eyeLight.intensity = 2.2f;
            eyeLight.shadows = LightShadows.None;
            eye.transform.localRotation = Quaternion.Euler(12, 0, 0);
            agent = gameObject.AddComponent<NavMeshAgent>();
            agent.radius = 0.45f;
            agent.height = 2.9f;
            agent.acceleration = 14f;
            agent.angularSpeed = 300f;
            agent.stoppingDistance = 0.3f;
            agent.autoBraking = true;
        }

        public void ResetAgent()
        {
            var s = zone.Spawn;
            var spawn = new Vector3(s[0], s[1], s[2]);
            if (NavMesh.SamplePosition(spawn, out var hit, 3f, NavMesh.AllAreas)) { agent.enabled = true; agent.Warp(hit.position); }
            else transform.position = spawn;
            Mode = "patrol";
            Suspicion = 0;
            timer = 0;
        }

        bool Tethered => G.Facts.Has("observer_tethered");

        /// 0..1 contribution to the player's adrenaline.
        public float Threat()
        {
            if (Tethered || G.Room != zone.Room) return 0f;
            float d = Vector3.Distance(transform.position, G.Motor.transform.position);
            return Mathf.Max(Suspicion, Mode == "chase" ? 1f : 0f, Mathf.Clamp01(1f - d / 16f) * 0.5f);
        }

        void Go(Vector3 p)
        {
            if (!agent.isOnNavMesh) return;
            if (NavMesh.SamplePosition(p, out var hit, 3f, NavMesh.AllAreas)) agent.SetDestination(hit.position);
        }

        bool Arrived => agent.isOnNavMesh && !agent.pathPending && agent.remainingDistance <= agent.stoppingDistance + 0.1f;

        void Update()
        {
            if (G == null || !G.Running) { if (agent && agent.isOnNavMesh) agent.isStopped = true; return; }
            if (Tethered) { UpdateTethered(); return; }
            if (!agent.isOnNavMesh) { if (Time.frameCount % 30 == 0) ResetAgent(); return; }

            float dt = Time.deltaTime;
            var hallState = G.Engine.State(zone.Room);
            float worldScale = G.Engine.WorldTimeScale(zone.Room);
            bool lawFreeze = (G.Engine.HasIn("observerFrozen", zone.Room) || worldScale == 0f) && !Brain.IgnoresFreeze;
            if (lawFreeze && !frozen) { Brain.RecordFreeze(); frozen = !Brain.IgnoresFreeze; }
            else if (!lawFreeze) frozen = false;

            bool inHall = G.Room == zone.Room && !G.Catching;
            var motor = G.Motor;
            if (inHall)
            {
                Brain.RecordStateTime(hallState, dt);
                Brain.RecordPace(motor.Sprinting, dt);
            }

            // perception
            var pp = motor.transform.position;
            var eye = transform.position + Vector3.up * 2.7f;
            var toP = pp - transform.position; toP.y = 0;
            float dist = toP.magnitude;
            bool ceilingHidden = motor.GravityDir == 1 && pp.y > zone.Area.Y0 + 3f && !Brain.SeesCeiling;
            bool echoHidden = false;
            bool sees = false, hears = false;
            if (inHall && !frozen)
            {
                float diff = G.Settings.Difficulty;
                float range = sightRange * (diff == 0 ? 0.75f : diff == 2 ? 1.15f : 1f);
                float angle = Vector3.Angle(transform.forward, toP);
                bool cone = dist < range && (angle < 52f || dist < 1.8f);
                bool los = cone && !Physics.Linecast(eye, pp + Vector3.up * 0.4f * -motor.GravityDir, out _, ~(1 << 2), QueryTriggerInteraction.Ignore);
                sees = los && !ceilingHidden && !echoHidden;
                hears = !ceilingHidden && motor.Speed > 0.6f && dist < Brain.HearingRadius(motor.Sprinting) * (motor.Crouching ? 0.5f : 1f);
                TrackHiding(dt, pp, dist, eye);
                TrackCrossing(pp);
            }

            if (sees)
            {
                float rate = (dist < 6 ? 2.6f : 1.1f) * (motor.Sprinting ? 1.5f : 1f) * (motor.Crouching ? 0.6f : 1f) / Mathf.Max(0.35f, Brain.ReactionTime / 0.8f);
                Suspicion = Mathf.Min(1.2f, Suspicion + dt * rate);
                lastSeen = pp;
                lostTime = 0;
            }
            else
            {
                Suspicion = Mathf.Max(0, Suspicion - dt * 0.25f);
                hearCd -= dt;
                if (hears && Mode != "chase" && hearCd <= 0)
                {
                    hearCd = 0.6f;
                    lastSeen = pp;
                    if (Mode != "search") Say("It turns toward the sound.");
                    Mode = "search";
                    timer = Brain.SearchDuration;
                    Go(pp);
                }
            }

            agent.isStopped = frozen;
            if (frozen) { Paint(Palette.Hex("#b6a6ff")); Animate(0); return; }

            if (sees && Suspicion >= 1f && Mode != "chase") { Mode = "chase"; repath = 0; Say("It sees you."); G.Audio.ObserverCry(); }

            float speed = 2.1f;
            switch (Mode)
            {
                case "chase":
                    speed = 5.0f;
                    repath -= dt;
                    if (!sees) lostTime += dt;
                    if (repath <= 0) { Go(lastSeen); repath = 0.3f; }
                    if (lostTime > 2.5f) { Mode = "search"; timer = Brain.SearchDuration; }
                    break;
                case "search":
                    speed = 2.8f;
                    if (Arrived) { timer -= dt; transform.Rotate(0, 80 * dt, 0); if (timer <= 0) Plan(); }
                    break;
                case "pause":
                    speed = 0;
                    timer -= dt;
                    Face(lookTarget, dt);
                    if (timer <= 0) Plan();
                    break;
                case "inspect":
                    speed = 2.6f;
                    if (Arrived)
                    {
                        Face(new Vector3(inspectCover.X, 0, inspectCover.Z), dt);
                        timer -= dt;
                        if (timer <= 0) Plan();
                    }
                    break;
                case "intercept":
                    speed = 2.4f;
                    if (Arrived) { Mode = "pause"; timer = 3.5f; lookTarget = transform.position + Vector3.right * 10f; }
                    break;
                default:
                    if (Arrived || !agent.hasPath) Plan();
                    break;
            }
            agent.speed = speed * worldScale * (G.Settings.Difficulty == 0 ? 0.85f : 1f);
            if (Mode == "chase" && sees) Face(pp, dt);

            // catch
            bool onCeiling = motor.GravityDir == 1;
            float reach = onCeiling ? (Brain.SeesCeiling ? 1.4f : -1f) : 1.2f;
            if (inHall && dist < reach && (Mode == "chase" || sees || dist < 0.9f)) { G.Caught("observer"); return; }

            Paint(Mode == "chase" ? Palette.Hex("#ff8a70") : Suspicion > 0.35f ? Palette.Hex("#ffc04a") : Palette.Hex("#7fd8ff"));
            Animate(agent.velocity.magnitude);
        }

        void Plan()
        {
            var plan = Brain.Decide(Time.time);
            if (plan.Type == "inspect")
            {
                inspectCover = zone.Cover.First(c => c.Id == plan.Spot);
                float sx = Mathf.Sign(inspectCover.X - transform.position.x);
                if (sx == 0) sx = 1;
                Mode = "inspect";
                timer = 3f;
                Go(new Vector3(inspectCover.X + sx * (inspectCover.Half + 1.3f), zone.Area.Y0, inspectCover.Z));
                Say("It walks straight to the pillar you keep hiding behind.");
            }
            else if (plan.Type == "intercept")
            {
                var (z0, z1) = zone.Lanes[plan.Lane];
                Mode = "intercept";
                Go(new Vector3(Random.Range(zone.FarX + 4, zone.EntranceX - 4), zone.Area.Y0, (z0 + z1) / 2));
            }
            else
            {
                Mode = "patrol";
                for (int i = 0; i < 20; i++)
                {
                    var p = new Vector3(Random.Range(zone.Area.X0 + 3, zone.EntranceX), zone.Area.Y0, Random.Range(zone.Area.Z0 + 2, zone.Area.Z1 - 2));
                    if (Mathf.Abs(p.x - transform.position.x) > 8 && NavMesh.SamplePosition(p, out var hit, 1.5f, NavMesh.AllAreas)) { agent.SetDestination(hit.position); break; }
                }
            }
        }

        void TrackHiding(float dt, Vector3 pp, float dist, Vector3 eye)
        {
            CoverDef near = null;
            foreach (var c in zone.Cover)
                if (Mathf.Abs(pp.x - c.X) < c.Half + 1.3f && Mathf.Abs(pp.z - c.Z) < c.Half + 1.3f) near = c;
            if (near == null || near.Id != hidePillar) { hidePillar = near?.Id; hideT = 0; hideRecorded = false; if (near == null) return; }
            if (hideRecorded || dist > 14 || G.Motor.Speed > 1.5f) return;
            // is the pillar between us?
            if (!Physics.Linecast(eye, pp, out var hit, ~(1 << 2), QueryTriggerInteraction.Ignore) || hit.collider == null) return;
            if (Mathf.Abs(hit.point.x - near.X) > near.Half + 0.3f || Mathf.Abs(hit.point.z - near.Z) > near.Half + 0.3f) return;
            hideT += dt;
            if (hideT < 1f) return;
            hideRecorded = true;
            Brain.RecordHide(near.Id);
            var r = Brain.HideReaction(near.Id);
            if (Mode == "chase") return;
            if (r == "pause") { Mode = "pause"; timer = 2.2f; lookTarget = new Vector3(near.X, 0, near.Z); agent.ResetPath(); Say("It pauses by the pillar."); }
            else if (r == "inspect") { Mode = "pause"; timer = 0.6f; lookTarget = new Vector3(near.X, 0, near.Z); Brain.Inspected[near.Id] = float.NegativeInfinity; Say("It looks directly at your pillar."); }
        }

        void TrackCrossing(Vector3 pp)
        {
            string lane = zone.Lanes.FirstOrDefault(l => pp.z >= l.Value.z0 && pp.z < l.Value.z1).Key;
            if (pp.x > zone.EntranceX)
            {
                if (crossingFrom == "far") Finish();
                crossingFrom = "near"; crossingLanes.Clear();
            }
            else if (pp.x < zone.FarX)
            {
                if (crossingFrom == "near") Finish();
                crossingFrom = "far"; crossingLanes.Clear();
            }
            else if (lane != null) { crossingLanes.TryGetValue(lane, out var n); crossingLanes[lane] = n + 1; }

            void Finish()
            {
                if (crossingLanes.Count == 0) return;
                Brain.RecordCrossing(crossingLanes.OrderByDescending(kv => kv.Value).First().Key);
            }
        }

        void UpdateTethered()
        {
            var t = zone.Tether;
            var target = new Vector3(t[0], t[1], t[2]);
            if (Mode != "tethered")
            {
                Mode = "tethered";
                if (NavMesh.SamplePosition(target, out var hit, 3f, NavMesh.AllAreas)) agent.Warp(hit.position);
                else { agent.enabled = false; transform.position = target; }
            }
            if (agent.enabled && agent.isOnNavMesh) agent.isStopped = true;
            var to = G.Motor.transform.position - transform.position; to.y = 0;
            if (to.sqrMagnitude > 0.1f) transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(to), Time.deltaTime * 2f);
            float pulse = 0.5f + Mathf.Max(0, Mathf.Sin(Time.time * 2.4f)) * 0.5f;
            Paint(new Color(1f, 0.4f + pulse * 0.4f, 0.6f + pulse * 0.3f));
            if (eyeLight) eyeLight.intensity = 0.8f;
            Animate(0);
        }

        void Face(Vector3 p, float dt)
        {
            var to = p - transform.position; to.y = 0;
            if (to.sqrMagnitude > 0.01f) transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(to), dt * 6f);
        }

        void Paint(Color c)
        {
            eyeMat.SetColor("_EmissionColor", c * 6f);
            if (eyeLight) eyeLight.color = c;
        }

        void Animate(float moving)
        {
            if (rig) rig.Pose(Time.time, moving / 2f, 0);
            if (head) head.localRotation = Quaternion.Euler(Brain.SeesCeiling && !Tethered ? -25 + Mathf.Sin(Time.time * 0.8f) * 10 : 0, 0, Mode == "pause" || Mode == "inspect" ? Mathf.Sin(Time.time * 1.3f) * 14 : 0);
        }

        void Say(string t)
        {
            if (G.Room == zone.Room && !G.Dialogue.Active) G.Dialogue.Play(new[] { new Line("OBSERVER", t) });
        }
    }
}
