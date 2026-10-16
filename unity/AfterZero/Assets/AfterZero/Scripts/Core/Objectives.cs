// System 5: the objective the player sees is the best explanation of the
// evidence so far. Layers only move forward; old ones stay in the log,
// struck through, with the reason they stopped being true.
using System;
using System.Collections.Generic;

namespace AfterZero.Core
{
    public class ObjectiveLayer
    {
        public string When, Text, Because;
        internal Condition Compiled;
    }

    public class Objectives
    {
        readonly List<ObjectiveLayer> layers = new List<ObjectiveLayer>();
        readonly FactStore facts;
        public int Current { get; private set; } = -1;
        public readonly List<ObjectiveLayer> History = new List<ObjectiveLayer>();
        public event Action<ObjectiveLayer> Changed;

        public Objectives(IEnumerable<ObjectiveLayer> ls, FactStore facts)
        {
            this.facts = facts;
            foreach (var l in ls) { l.Compiled = Conditions.Compile(l.When); layers.Add(l); }
        }

        public string Text => Current >= 0 ? layers[Current].Text : "";

        public void Update(bool silent = false)
        {
            int idx = -1;
            for (int i = 0; i < layers.Count; i++) if (layers[i].Compiled(facts)) idx = i;
            if (idx <= Current) return;
            for (int i = Current + 1; i <= idx; i++) if (layers[i].Compiled(facts)) History.Add(layers[i]);
            Current = idx;
            if (!silent) Changed?.Invoke(layers[idx]);
        }
    }
}
