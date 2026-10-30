// The Observer's memory. It only learns from what it plausibly witnessed and
// announces every lesson with an in-world tell, so the player can form a
// theory about what it knows - and exploit it. Optionally, its memory
// persists across playthroughs ("it remembers you from cycle 42").
using System;
using System.Collections.Generic;
using System.Linq;

namespace AfterZero.Core
{
    public class ObserverPlan
    {
        public string Type; // patrol | inspect | intercept | ambush
        public string Spot, Lane;
    }

    public class ObserverBrain
    {
        public static readonly Dictionary<string, string> LessonText = new Dictionary<string, string>
        {
            ["ceiling"] = "It tilts its head upward, toward the ceiling.",
            ["freeze"] = "It moved. It should not be able to move.",
            ["runner"] = "It is listening for your footsteps now.",
            ["lane"] = "It waits where you usually cross.",
            ["patient"] = "It lingers longer than before.",
            ["echo"] = "It watches the air where your echo was.",
            ["slip"] = "It flinches before you shift. It has learned the rhythm.",
        };

        public float CeilingAfter = 10f, RunnerAfter = 8f, EchoAfter = 14f;
        public int FreezeAfter = 3, SlipAfter = 4;

        public Dictionary<string, int> Hides = new Dictionary<string, int>();
        public Dictionary<string, int> Lanes = new Dictionary<string, int>();
        public Dictionary<string, float> StateTime = new Dictionary<string, float>();
        public Dictionary<string, float> Inspected = new Dictionary<string, float>();
        public float RunTime, SneakTime;
        public int Catches, Freezes, Slips;
        public readonly HashSet<string> Lessons = new HashSet<string>();

        public event Action<string, string> LessonLearned;      // id, text
        public event Action<string, string, int> HideReacted;   // reaction, spot, count

        public bool Learn(string lesson)
        {
            if (!Lessons.Add(lesson)) return false;
            LessonLearned?.Invoke(lesson, LessonText.TryGetValue(lesson, out var t) ? t : lesson);
            return true;
        }

        public string HideReaction(string spot)
        {
            Hides.TryGetValue(spot, out var n);
            return n >= 3 ? "inspect" : n >= 2 ? "pause" : "pass";
        }

        public int RecordHide(string spot)
        {
            Hides.TryGetValue(spot, out var n);
            Hides[spot] = ++n;
            HideReacted?.Invoke(HideReaction(spot), spot, n);
            return n;
        }

        public int RecordCrossing(string lane)
        {
            Lanes.TryGetValue(lane, out var n);
            Lanes[lane] = ++n;
            if (n >= 2) Learn("lane");
            return n;
        }

        public void RecordStateTime(string state, float dt)
        {
            StateTime.TryGetValue(state, out var t);
            StateTime[state] = t + dt;
            if (Get(StateTime, RealityStates.Inverted) >= CeilingAfter) Learn("ceiling");
            if (Get(StateTime, RealityStates.Echo) >= EchoAfter) Learn("echo");
        }

        public void RecordPace(bool running, float dt)
        {
            if (running) RunTime += dt; else SneakTime += dt;
            if (RunTime >= RunnerAfter) Learn("runner");
        }

        public void RecordFreeze()
        {
            if (++Freezes >= FreezeAfter) Learn("freeze");
        }

        public void RecordSlip()
        {
            if (++Slips >= SlipAfter) Learn("slip");
        }

        public void RecordCatch(string state)
        {
            Catches++;
            if (state == RealityStates.Inverted) Learn("ceiling");
            if (Catches >= 2) Learn("patient");
        }

        public bool SeesCeiling => Lessons.Contains("ceiling");
        public bool IgnoresFreeze => Lessons.Contains("freeze");
        public bool SeesEchoes => Lessons.Contains("echo");
        public float HearingRadius(bool running) => !running ? 2.5f : Lessons.Contains("runner") ? 12f : 6f;
        public float SearchDuration => Lessons.Contains("patient") ? 7f : 4f;
        /// Reaction delay before it commits to a chase (shorter once it knows your rhythm).
        public float ReactionTime => Lessons.Contains("slip") ? 0.35f : 0.8f;

        public string FavouriteLane()
        {
            string best = null; int n = 1;
            foreach (var kv in Lanes) if (kv.Value > n) { best = kv.Key; n = kv.Value; }
            return best;
        }

        public ObserverPlan Decide(float now, Func<double> rng = null)
        {
            rng ??= new Random().NextDouble;
            string target = null; int best = 0;
            foreach (var kv in Hides)
            {
                float last = Inspected.TryGetValue(kv.Key, out var l) ? l : float.NegativeInfinity;
                if (kv.Value >= 3 && now - last > 20f && kv.Value > best) { target = kv.Key; best = kv.Value; }
            }
            if (target != null)
            {
                Inspected[target] = now;
                return new ObserverPlan { Type = "inspect", Spot = target };
            }
            var lane = Lessons.Contains("lane") ? FavouriteLane() : null;
            if (lane != null && rng() < 0.6) return new ObserverPlan { Type = "intercept", Lane = lane };
            return new ObserverPlan { Type = "patrol" };
        }

        public IEnumerable<string> Summary() => Lessons.Select(l => LessonText.TryGetValue(l, out var t) ? t : l);

        static float Get(Dictionary<string, float> d, string k) => d.TryGetValue(k, out var v) ? v : 0f;

        // --- persistence (also used for cross-playthrough memory) -------------
        [Serializable]
        public class Snapshot
        {
            public List<string> Lessons = new List<string>();
            public List<string> Hides = new List<string>();
            public List<string> Lanes = new List<string>();
            public float RunTime, Inverted, Echo;
            public int Catches, Freezes, Slips;
        }

        public Snapshot Save() => new Snapshot
        {
            Lessons = Lessons.ToList(),
            Hides = Hides.Select(kv => kv.Key + "=" + kv.Value).ToList(),
            Lanes = Lanes.Select(kv => kv.Key + "=" + kv.Value).ToList(),
            RunTime = RunTime,
            Inverted = Get(StateTime, RealityStates.Inverted),
            Echo = Get(StateTime, RealityStates.Echo),
            Catches = Catches, Freezes = Freezes, Slips = Slips,
        };

        public void Restore(Snapshot s)
        {
            Lessons.Clear();
            foreach (var l in s.Lessons) Lessons.Add(l);
            Hides = Parse(s.Hides);
            Lanes = Parse(s.Lanes);
            RunTime = s.RunTime;
            StateTime[RealityStates.Inverted] = s.Inverted;
            StateTime[RealityStates.Echo] = s.Echo;
            Catches = s.Catches; Freezes = s.Freezes; Slips = s.Slips;
        }

        static Dictionary<string, int> Parse(List<string> l)
        {
            var d = new Dictionary<string, int>();
            foreach (var p in l) { var i = p.LastIndexOf('='); if (i > 0 && int.TryParse(p.Substring(i + 1), out var v)) d[p.Substring(0, i)] = v; }
            return d;
        }
    }
}
