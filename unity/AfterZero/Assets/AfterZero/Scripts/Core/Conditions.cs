// AFTERZERO - condition language shared by all authored content.
//
//   machine_activated && !vault_seen
//   @ECHO || (times_caught >= 2 && !observer_tethered)
//
// Identifiers are facts (missing facts are 0). @STATE is true when the room
// being evaluated is in that reality state. Comparisons: == != >= <= > <.
// Conditions are compiled once into delegates and cached.
using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace AfterZero.Core
{
    public interface IConditionContext
    {
        int Fact(string name);
        string State { get; }
    }

    public delegate bool Condition(IConditionContext ctx);

    public static class Conditions
    {
        static readonly Regex Token = new Regex(@"\G\s*(&&|\|\||==|!=|>=|<=|[!()<>]|@[A-Z]+|[A-Za-z_][\w.]*|-?\d+)", RegexOptions.Compiled);
        static readonly Dictionary<string, Condition> Cache = new Dictionary<string, Condition>();
        public static readonly Condition Always = _ => true;

        public static Condition Compile(string src)
        {
            if (string.IsNullOrWhiteSpace(src)) return Always;
            lock (Cache)
            {
                if (Cache.TryGetValue(src, out var c)) return c;
                c = new Parser(src).Parse();
                Cache[src] = c;
                return c;
            }
        }

        public static bool Test(string src, IConditionContext ctx) => Compile(src)(ctx);

        delegate int Value(IConditionContext ctx);

        sealed class Parser
        {
            readonly string src;
            readonly List<string> t = new List<string>();
            int i;

            public Parser(string src)
            {
                this.src = src;
                int pos = 0;
                while (pos < src.Length)
                {
                    if (src.Substring(pos).Trim().Length == 0) break;
                    var m = Token.Match(src, pos);
                    if (!m.Success) throw new FormatException($"Bad condition near \"{src.Substring(pos)}\" in \"{src}\"");
                    t.Add(m.Groups[1].Value);
                    pos = m.Index + m.Length;
                }
            }

            string Peek => i < t.Count ? t[i] : null;
            string Next() => i < t.Count ? t[i++] : throw new FormatException($"Unexpected end of \"{src}\"");

            public Condition Parse()
            {
                var e = Or();
                if (i != t.Count) throw new FormatException($"Unexpected \"{t[i]}\" in \"{src}\"");
                return e;
            }

            Condition Or()
            {
                var e = And();
                while (Peek == "||") { Next(); var l = e; var r = And(); e = c => l(c) || r(c); }
                return e;
            }

            Condition And()
            {
                var e = Unary();
                while (Peek == "&&") { Next(); var l = e; var r = Unary(); e = c => l(c) && r(c); }
                return e;
            }

            Condition Unary()
            {
                if (Peek == "!") { Next(); var e = Unary(); return c => !e(c); }
                if (Peek == "(")
                {
                    Next();
                    var e = Or();
                    if (Next() != ")") throw new FormatException($"Expected ) in \"{src}\"");
                    return e;
                }
                return Compare();
            }

            Condition Compare()
            {
                var tok = Peek;
                if (tok != null && tok.StartsWith("@"))
                {
                    Next();
                    var s = tok.Substring(1);
                    return c => c.State == s;
                }
                var a = Val();
                var op = Peek;
                switch (op)
                {
                    case "==": Next(); { var b = Val(); return c => a(c) == b(c); }
                    case "!=": Next(); { var b = Val(); return c => a(c) != b(c); }
                    case ">=": Next(); { var b = Val(); return c => a(c) >= b(c); }
                    case "<=": Next(); { var b = Val(); return c => a(c) <= b(c); }
                    case ">": Next(); { var b = Val(); return c => a(c) > b(c); }
                    case "<": Next(); { var b = Val(); return c => a(c) < b(c); }
                }
                return c => a(c) != 0;
            }

            Value Val()
            {
                var tok = Next();
                if (char.IsDigit(tok[0]) || tok[0] == '-') { var n = int.Parse(tok); return _ => n; }
                if (tok == "true") return _ => 1;
                if (tok == "false") return _ => 0;
                if (!char.IsLetter(tok[0]) && tok[0] != '_') throw new FormatException($"Unexpected \"{tok}\" in \"{src}\"");
                return c => c.Fact(tok);
            }
        }
    }
}
