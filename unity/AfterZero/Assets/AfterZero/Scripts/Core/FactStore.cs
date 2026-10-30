// Narrative manager: persistent facts + authored once-rules.
// Everything that matters is a fact, so the save file is just facts and
// the world re-derives itself from them on load.
using System;
using System.Collections.Generic;

namespace AfterZero.Core
{
    [Serializable]
    public class Effect
    {
        public string Set;      // fact to set
        public int Value = 1;   // value for Set
        public string Inc;      // fact to increment
        public string Log;      // theory-log entry
        public string Say;      // script id to play
        public string Token;    // law token to grant
        public string Event;    // free-form game event (handled by the Director)

        public static Effect SetFact(string k, int v = 1) => new Effect { Set = k, Value = v };
        public static Effect IncFact(string k) => new Effect { Inc = k };
        public static Effect LogEntry(string s) => new Effect { Log = s };
        public static Effect Play(string id) => new Effect { Say = id };
        public static Effect Grant(string token) => new Effect { Token = token };
        public static Effect Fire(string evt) => new Effect { Event = evt };
    }

    public class Rule
    {
        public string Id;
        public string When;
        public Effect[] Then;
        public bool Once = true;
        internal Condition Compiled;
    }

    public class FactStore : IConditionContext
    {
        readonly Dictionary<string, int> facts = new Dictionary<string, int>();
        readonly List<Rule> rules = new List<Rule>();
        readonly HashSet<string> fired = new HashSet<string>();
        bool evaluating, dirty;

        public event Action<string, int, int> Changed;     // key, new, old
        public event Action<Effect> EffectRaised;          // non-fact effects

        public string State => null;
        public int Fact(string name) => facts.TryGetValue(name, out var v) ? v : 0;
        public int this[string k] => Fact(k);
        public bool Has(string k) => Fact(k) != 0;
        public IReadOnlyDictionary<string, int> All => facts;

        public bool Test(string cond) => Conditions.Test(cond, this);
        public bool Test(string cond, string state) => Conditions.Test(cond, new StateView(this, state));

        public void Set(string k, int v = 1)
        {
            int old = Fact(k);
            if (old == v && facts.ContainsKey(k)) return;
            facts[k] = v;
            Changed?.Invoke(k, v, old);
            dirty = true;
            EvaluateRules();
        }

        public void Inc(string k, int n = 1) => Set(k, Fact(k) + n);

        public void AddRules(IEnumerable<Rule> rs)
        {
            foreach (var r in rs) { r.Compiled = Conditions.Compile(r.When); rules.Add(r); }
            EvaluateRules();
        }

        public void Apply(IEnumerable<Effect> effects)
        {
            if (effects == null) return;
            foreach (var e in effects)
            {
                if (e.Set != null) Set(e.Set, e.Value);
                else if (e.Inc != null) Inc(e.Inc);
                else EffectRaised?.Invoke(e);
            }
        }

        public void EvaluateRules()
        {
            if (evaluating) return;
            evaluating = true;
            try
            {
                for (int pass = 0; pass < 16; pass++)
                {
                    dirty = false;
                    foreach (var r in rules)
                    {
                        if (r.Once && fired.Contains(r.Id)) continue;
                        if (!r.Compiled(this)) continue;
                        fired.Add(r.Id);
                        Apply(r.Then);
                    }
                    if (!dirty) break;
                }
            }
            finally { evaluating = false; }
        }

        // --- persistence -----------------------------------------------------
        public List<string> SerializeFacts()
        {
            var l = new List<string>();
            foreach (var kv in facts) l.Add(kv.Key + "=" + kv.Value);
            return l;
        }

        public List<string> SerializeFired() => new List<string>(fired);

        public void Restore(IEnumerable<string> factPairs, IEnumerable<string> firedRules)
        {
            facts.Clear();
            fired.Clear();
            foreach (var p in factPairs)
            {
                int eq = p.LastIndexOf('=');
                if (eq > 0 && int.TryParse(p.Substring(eq + 1), out var v)) facts[p.Substring(0, eq)] = v;
            }
            foreach (var f in firedRules) fired.Add(f);
        }

        // Evaluate a condition as if inside a room with the given state.
        public readonly struct StateView : IConditionContext
        {
            readonly FactStore store;
            public StateView(FactStore s, string state) { store = s; State = state; }
            public int Fact(string name) => store.Fact(name);
            public string State { get; }
        }
    }
}
