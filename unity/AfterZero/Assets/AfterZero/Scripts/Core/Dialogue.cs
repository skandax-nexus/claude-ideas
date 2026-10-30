// NPC conversations and the TICK hint system.
//
// An NPC has an ordered list of nodes. Talking to them plays the first node
// whose condition holds (and that hasn't been used up, if Once). A node can
// end in choices; each choice applies effects and may jump to another node.
// Because nodes are conditioned on facts, every NPC reacts to what you've
// done and discovered - nobody repeats the same line forever.
using System.Collections.Generic;
using System.Linq;

namespace AfterZero.Core
{
    public class Line
    {
        public string Who, Text, When;
        public Line(string who, string text, string when = null) { Who = who; Text = text; When = when; }
    }

    public class Choice
    {
        public string Text, When, Next;
        public Effect[] Then;
    }

    public class DialogueNode
    {
        public string Id, When;
        public bool Once;
        public Line[] Lines;
        public Choice[] Choices;
        public Effect[] Then;
    }

    public class NpcDef
    {
        public string Id, Name, Color = "#ffffff", Model = "human", Room, Appear, Role;
        public float X, Y, Z, Yaw;
        public string Prompt = "TALK";
        public List<DialogueNode> Nodes = new List<DialogueNode>();
    }

    public class Speaker
    {
        public string Name, Color;
        public Speaker(string n, string c) { Name = n; Color = c; }
    }

    public class Hint
    {
        public string When;
        public string[] Tiers; // nudge, direction, solution
    }

    public class EndingDef
    {
        public string Id, Title, When, Choice, Blurb;
        public string[] Text;
    }

    public static class DialogueLogic
    {
        public static DialogueNode Pick(NpcDef npc, FactStore facts)
        {
            foreach (var n in npc.Nodes)
            {
                if (n.Once && facts.Has(SeenKey(npc, n))) continue;
                if (facts.Test(n.When)) return n;
            }
            return null;
        }

        public static string SeenKey(NpcDef npc, DialogueNode n) => $"seen_{npc.Id}_{n.Id}";

        public static IEnumerable<Line> Filter(IEnumerable<Line> lines, FactStore facts) => lines.Where(l => facts.Test(l.When));

        public static IEnumerable<Choice> Available(DialogueNode n, FactStore facts) =>
            (n.Choices ?? new Choice[0]).Where(c => facts.Test(c.When));

        /// The hint for the first unsolved situation, at the requested tier (0..2).
        public static string HintFor(IEnumerable<Hint> hints, FactStore facts, int tier)
        {
            var h = hints.FirstOrDefault(x => facts.Test(x.When));
            if (h == null) return null;
            return h.Tiers[System.Math.Min(tier, h.Tiers.Length - 1)];
        }
    }
}
