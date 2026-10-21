// Reality manager: every room has a state, and the installed laws decide
// what each state does. Rooms can be locked (the device has no effect) or
// carry scripted overrides (e.g. the first, lawless zero-g moment).
using System;
using System.Collections.Generic;
using System.Linq;

namespace AfterZero.Core
{
    public class RealityEngine
    {
        readonly Dictionary<string, string> rooms = new Dictionary<string, string>();
        readonly HashSet<string> locked = new HashSet<string>();
        readonly Dictionary<string, Dictionary<string, bool>> overrides = new Dictionary<string, Dictionary<string, bool>>();
        Dictionary<string, HashSet<string>> effects;

        public readonly int Slots;
        public int Unlocked { get; private set; }
        public Law[] InstalledLaws { get; }
        public List<string> Paradoxes { get; private set; } = new List<string>();

        public event Action<string, string, string> Shifted; // room, from, to
        public event Action LawsChanged;

        public RealityEngine(int slots = 4, int unlocked = 2, Law[] laws = null)
        {
            Slots = slots;
            Unlocked = unlocked;
            laws ??= Laws.Defaults;
            InstalledLaws = new Law[slots];
            for (int i = 0; i < slots && i < laws.Length; i++)
                InstalledLaws[i] = laws[i] == null ? null : new Law(laws[i].Subject, laws[i].Verb, laws[i].Target);
            Recompile();
        }

        public string State(string room) => room != null && rooms.TryGetValue(room, out var s) ? s : RealityStates.Physical;
        public bool IsLocked(string room) => room != null && locked.Contains(room);

        public bool SetState(string room, string s, bool force = false)
        {
            if (Array.IndexOf(RealityStates.All, s) < 0) throw new ArgumentException("Unknown state " + s);
            if (!force && IsLocked(room)) return false;
            var from = State(room);
            if (from == s) return false;
            rooms[room] = s;
            Shifted?.Invoke(room, from, s);
            return true;
        }

        public bool Cycle(string room)
        {
            int i = Array.IndexOf(RealityStates.All, State(room));
            return SetState(room, RealityStates.All[(i + 1) % RealityStates.All.Length]);
        }

        public void Lock(string room, bool v = true)
        {
            if (v) locked.Add(room); else locked.Remove(room);
        }

        public void SetOverride(string room, string effect, bool? value)
        {
            if (!overrides.TryGetValue(room, out var o)) overrides[room] = o = new Dictionary<string, bool>();
            if (value.HasValue) o[effect] = value.Value; else o.Remove(effect);
            LawsChanged?.Invoke();
        }

        // --- laws --------------------------------------------------------------
        public LawResult SetLaw(int slot, Law law)
        {
            if (slot >= Unlocked) return new LawResult { Ok = false, Error = "SLOT LOCKED" };
            var r = Laws.Parse(law);
            if (!r.Ok) return r;
            InstalledLaws[slot] = law == null || law.IsEmpty ? null : new Law(law.Subject, law.Verb, law.Target);
            Recompile();
            LawsChanged?.Invoke();
            return r;
        }

        public void UnlockSlot(int n)
        {
            Unlocked = Math.Min(Slots, Math.Max(Unlocked, n));
            Recompile();
            LawsChanged?.Invoke();
        }

        void Recompile()
        {
            var (fx, p) = Laws.Compile(InstalledLaws.Take(Unlocked));
            effects = fx;
            Paradoxes = p;
        }

        public bool Has(string effect, string state) => effects.TryGetValue(effect, out var s) && s.Contains(state);

        public bool HasIn(string effect, string room)
        {
            if (room != null && overrides.TryGetValue(room, out var o) && o.TryGetValue(effect, out var v)) return v;
            return Has(effect, State(room));
        }

        /// -1 normal, +1 reversed, 0 weightless
        public int Gravity(string room)
        {
            if (room == null) return -1;
            if (HasIn("zeroG", room)) return 0;
            if (HasIn("gravityFlip", room)) return 1;
            return -1;
        }

        /// Time scale for everything except the player in this room.
        public float WorldTimeScale(string room)
        {
            if (HasIn("timeStop", room)) return 0f;
            if (HasIn("timeSlow", room)) return 0.5f;
            return 1f;
        }

        // --- persistence ----------------------------------------------------------
        [Serializable]
        public class Snapshot
        {
            public List<string> Rooms = new List<string>();
            public List<string> Locked = new List<string>();
            public List<string> Laws = new List<string>();
            public int Unlocked;
        }

        public Snapshot Save()
        {
            var s = new Snapshot { Unlocked = Unlocked };
            foreach (var kv in rooms) s.Rooms.Add(kv.Key + "=" + kv.Value);
            s.Locked.AddRange(locked);
            foreach (var l in InstalledLaws) s.Laws.Add(l == null ? "" : l.ToString());
            return s;
        }

        public void Restore(Snapshot s)
        {
            rooms.Clear();
            locked.Clear();
            foreach (var r in s.Rooms) { var p = r.Split('='); if (p.Length == 2) rooms[p[0]] = p[1]; }
            foreach (var l in s.Locked) locked.Add(l);
            for (int i = 0; i < Slots; i++)
            {
                var str = i < s.Laws.Count ? s.Laws[i] : "";
                var p = str.Split('|');
                InstalledLaws[i] = p.Length == 3 ? new Law(p[0], p[1], p[2]) : null;
            }
            Unlocked = s.Unlocked;
            Recompile();
        }
    }
}
