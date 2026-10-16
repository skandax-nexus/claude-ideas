// The law language run by the reality device:  SUBJECT  VERB  TARGET
//   GRAVITY  INVERTS IN  INVERTED        (factory default)
//   HELD MATTER  PERSISTS THROUGH  ALL STATES
// Installed laws compile into effect sets that gameplay code queries.
using System;
using System.Collections.Generic;
using System.Linq;

namespace AfterZero.Core
{
    public enum TokenKind { Subject, Verb, Target }

    public static class RealityStates
    {
        public const string Physical = "PHYSICAL", Inverted = "INVERTED", Echo = "ECHO";
        public static readonly string[] All = { Physical, Inverted, Echo };
    }

    public class LawToken
    {
        public string Id, Label;
        public TokenKind Kind;
        public string[] States; // targets only
    }

    [Serializable]
    public class Law
    {
        public string Subject, Verb, Target;
        public Law() { }
        public Law(string s, string v, string t) { Subject = s; Verb = v; Target = t; }
        public bool IsEmpty => Subject == null && Verb == null && Target == null;
        public override string ToString() => $"{Subject}|{Verb}|{Target}";
    }

    public class LawResult
    {
        public bool Ok, Empty;
        public string Effect, Error, Text;
        public string[] States;
    }

    public static class Laws
    {
        public static readonly Dictionary<string, LawToken> Tokens = new[]
        {
            T("GRAVITY", "GRAVITY", TokenKind.Subject),
            T("HELD", "HELD MATTER", TokenKind.Subject),
            T("OBSERVER", "OBSERVER", TokenKind.Subject),
            T("ECHOES", "ECHOES", TokenKind.Subject),
            T("SHADOWS", "SHADOWS", TokenKind.Subject),
            T("TIME", "TIME", TokenKind.Subject),
            T("UNDERTOW", "UNDERTOW", TokenKind.Subject),
            T("INVERTS", "INVERTS IN", TokenKind.Verb),
            T("FREEZES", "FREEZES IN", TokenKind.Verb),
            T("PERSISTS", "PERSISTS THROUGH", TokenKind.Verb),
            T("SOLIDIFIES", "SOLIDIFY IN", TokenKind.Verb),
            T("SLOWS", "SLOWS IN", TokenKind.Verb),
            T("PHYSICAL", "PHYSICAL", TokenKind.Target, RealityStates.Physical),
            T("INVERTED", "INVERTED", TokenKind.Target, RealityStates.Inverted),
            T("ECHO", "ECHO", TokenKind.Target, RealityStates.Echo),
            T("ALL", "ALL STATES", TokenKind.Target, RealityStates.All),
        }.ToDictionary(t => t.Id);

        // SUBJECT + VERB -> effect key. Anything not listed is a syntax fault.
        public static readonly Dictionary<string, (string effect, string text)> Grammar = new Dictionary<string, (string, string)>
        {
            ["GRAVITY INVERTS"] = ("gravityFlip", "Gravity reverses in rooms set to {T}."),
            ["GRAVITY FREEZES"] = ("zeroG", "Gravity stops in rooms set to {T}."),
            ["HELD PERSISTS"] = ("heldPersists", "Anything you carry survives a shift into {T}."),
            ["OBSERVER FREEZES"] = ("observerFrozen", "The Observer cannot move in rooms set to {T}."),
            ["ECHOES SOLIDIFIES"] = ("echoSolid", "Echoes become solid in rooms set to {T}."),
            ["ECHOES PERSISTS"] = ("echoVisible", "Echoes stay visible in rooms set to {T}."),
            ["SHADOWS SOLIDIFIES"] = ("shadowSolid", "Shadows become solid in rooms set to {T}."),
            ["TIME SLOWS"] = ("timeSlow", "Time runs at half speed in rooms set to {T}."),
            ["TIME FREEZES"] = ("timeStop", "Everything but you stops in rooms set to {T}."),
            ["UNDERTOW FREEZES"] = ("undertowHeld", "The Undertow cannot advance in rooms set to {T}."),
        };

        public static readonly string[] Effects = Grammar.Values.Select(g => g.effect).Distinct().ToArray();

        public static readonly Law[] Defaults = { new Law("GRAVITY", "INVERTS", "INVERTED"), null, null, null };

        static LawToken T(string id, string label, TokenKind k, params string[] states) =>
            new LawToken { Id = id, Label = label, Kind = k, States = states };

        public static string Describe(Law l) =>
            l == null ? "" : string.Join("  ", new[] { l.Subject, l.Verb, l.Target }.Select(t => t != null && Tokens.ContainsKey(t) ? Tokens[t].Label : "___"));

        public static LawResult Parse(Law law)
        {
            if (law == null || law.IsEmpty) return new LawResult { Ok = true, Empty = true };
            if (law.Subject == null || law.Verb == null || law.Target == null) return Fail("INCOMPLETE LAW");
            if (!Tokens.TryGetValue(law.Subject, out var s) || s.Kind != TokenKind.Subject) return Fail($"{law.Subject} IS NOT A SUBJECT");
            if (!Tokens.TryGetValue(law.Verb, out var v) || v.Kind != TokenKind.Verb) return Fail($"{law.Verb} IS NOT A VERB");
            if (!Tokens.TryGetValue(law.Target, out var t) || t.Kind != TokenKind.Target) return Fail($"{law.Target} IS NOT A STATE");
            if (!Grammar.TryGetValue($"{law.Subject} {law.Verb}", out var g))
                return Fail($"SYNTAX FAULT: \"{s.Label} {v.Label}\" MEANS NOTHING");
            return new LawResult { Ok = true, Effect = g.effect, States = t.States, Text = g.text.Replace("{T}", t.Label) };
        }

        static LawResult Fail(string e) => new LawResult { Ok = false, Error = e };

        public static (Dictionary<string, HashSet<string>> effects, List<string> paradoxes) Compile(IEnumerable<Law> laws)
        {
            var fx = Effects.ToDictionary(e => e, e => new HashSet<string>());
            foreach (var l in laws)
            {
                var r = Parse(l);
                if (r.Ok && !r.Empty) foreach (var s in r.States) fx[r.Effect].Add(s);
            }
            var paradoxes = new List<string>();
            foreach (var s in fx["zeroG"].ToList())
                if (fx["gravityFlip"].Remove(s)) paradoxes.Add($"PARADOX IN {s}: ZERO GRAVITY OVERRIDES INVERSION");
            foreach (var s in fx["timeStop"].ToList())
                if (fx["timeSlow"].Remove(s)) paradoxes.Add($"PARADOX IN {s}: STOPPED TIME OVERRIDES SLOWED TIME");
            return (fx, paradoxes);
        }
    }
}
