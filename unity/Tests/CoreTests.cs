using System;
using System.Collections.Generic;
using System.Linq;
using AfterZero.Core;
using AfterZero.Core.Content;
using Xunit;

public class ConditionTests
{
    class Ctx : IConditionContext
    {
        public Dictionary<string, int> F = new Dictionary<string, int>();
        public string State { get; set; }
        public int Fact(string n) => F.TryGetValue(n, out var v) ? v : 0;
    }

    [Fact]
    public void BooleanLogicStatesAndComparisons()
    {
        var c = new Ctx { F = { ["a"] = 1, ["n"] = 3 } };
        Assert.True(Conditions.Test("a && !b", c));
        Assert.True(Conditions.Test("b || (a && n >= 3)", c));
        Assert.False(Conditions.Test("n > 3", c));
        Assert.True(Conditions.Test("!missing", c));
        Assert.True(Conditions.Test("", c));
        c.State = "ECHO";
        Assert.True(Conditions.Test("@ECHO && a", c));
        Assert.False(Conditions.Test("!@ECHO", c));
        Assert.Throws<FormatException>(() => Conditions.Compile("a &&"));
        Assert.Throws<FormatException>(() => Conditions.Compile("a b"));
    }
}

public class FactTests
{
    [Fact]
    public void RulesFireOnceAndChain()
    {
        var fs = new FactStore();
        var raised = new List<Effect>();
        fs.EffectRaised += raised.Add;
        fs.AddRules(new[]
        {
            new Rule { Id = "r1", When = "a", Then = new[] { Effect.SetFact("b"), Effect.LogEntry("a happened") } },
            new Rule { Id = "r2", When = "b", Then = new[] { Effect.IncFact("count") } },
        });
        fs.Set("a");
        Assert.Equal(1, fs["b"]);
        Assert.Equal(1, fs["count"]);
        fs.Set("a", 0);
        fs.Set("a");
        Assert.Equal(1, fs["count"]);
        Assert.Single(raised);
    }

    [Fact]
    public void SaveRestoreKeepsFiredRules()
    {
        var fs = new FactStore();
        fs.AddRules(new[] { new Rule { Id = "r", When = "x", Then = new[] { Effect.IncFact("n") } } });
        fs.Set("x");
        var fs2 = new FactStore();
        fs2.Restore(fs.SerializeFacts(), fs.SerializeFired());
        fs2.AddRules(new[] { new Rule { Id = "r", When = "x", Then = new[] { Effect.IncFact("n") } } });
        Assert.Equal(1, fs2["n"]);
    }
}

public class LawTests
{
    [Fact]
    public void GrammarAcceptsAndRejects()
    {
        Assert.Equal("gravityFlip", Laws.Parse(new Law("GRAVITY", "INVERTS", "INVERTED")).Effect);
        Assert.Equal(3, Laws.Parse(new Law("HELD", "PERSISTS", "ALL")).States.Length);
        Assert.Contains("MEANS NOTHING", Laws.Parse(new Law("HELD", "INVERTS", "ECHO")).Error);
        Assert.False(Laws.Parse(new Law("INVERTS", "GRAVITY", "ECHO")).Ok);
        Assert.False(Laws.Parse(new Law("GRAVITY", null, "ECHO")).Ok);
        Assert.True(Laws.Parse(null).Ok);
    }

    [Fact]
    public void Paradoxes()
    {
        var (fx, p) = Laws.Compile(new[] { new Law("GRAVITY", "INVERTS", "ECHO"), new Law("GRAVITY", "FREEZES", "ALL"), new Law("TIME", "SLOWS", "ECHO"), new Law("TIME", "FREEZES", "ECHO") });
        Assert.DoesNotContain("ECHO", fx["gravityFlip"]);
        Assert.Contains("ECHO", fx["zeroG"]);
        Assert.Contains("ECHO", fx["timeStop"]);
        Assert.DoesNotContain("ECHO", fx["timeSlow"]);
        Assert.Equal(2, p.Count);
    }

    [Fact]
    public void EngineStatesLawsOverridesAndPersistence()
    {
        var e = new RealityEngine();
        Assert.Equal(-1, e.Gravity("lab"));
        e.Cycle("lab");
        Assert.Equal(1, e.Gravity("lab"));
        e.Cycle("lab");
        Assert.Equal("ECHO", e.State("lab"));
        Assert.True(e.SetLaw(0, new Law("GRAVITY", "INVERTS", "ECHO")).Ok);
        Assert.Equal(1, e.Gravity("lab"));
        Assert.False(e.SetLaw(2, new Law("TIME", "SLOWS", "ALL")).Ok);
        e.UnlockSlot(3);
        Assert.True(e.SetLaw(2, new Law("TIME", "SLOWS", "ALL")).Ok);
        Assert.Equal(0.5f, e.WorldTimeScale("lab"));
        e.Lock("cradle");
        Assert.False(e.Cycle("cradle"));
        e.SetOverride("cradle", "zeroG", true);
        Assert.Equal(0, e.Gravity("cradle"));
        e.SetOverride("cradle", "zeroG", null);
        Assert.Equal(-1, e.Gravity("cradle"));

        var e2 = new RealityEngine();
        e2.Restore(e.Save());
        Assert.Equal("ECHO", e2.State("lab"));
        Assert.Equal(1, e2.Gravity("lab"));
        Assert.True(e2.IsLocked("cradle"));
        Assert.Equal(3, e2.Unlocked);
    }
}

public class ObserverTests
{
    [Fact]
    public void HidingEscalates()
    {
        var b = new ObserverBrain();
        b.RecordHide("p3");
        Assert.Equal("pass", b.HideReaction("p3"));
        b.RecordHide("p3");
        Assert.Equal("pause", b.HideReaction("p3"));
        b.RecordHide("p3");
        Assert.Equal("inspect", b.HideReaction("p3"));
        var plan = b.Decide(100);
        Assert.Equal("inspect", plan.Type);
        Assert.Equal("p3", plan.Spot);
        Assert.NotEqual("inspect", b.Decide(105, () => 0.99).Type);
    }

    [Fact]
    public void LearnsAndPersistsAcrossPlaythroughs()
    {
        var b = new ObserverBrain();
        var learned = new List<string>();
        b.LessonLearned += (l, _) => learned.Add(l);
        b.RecordCrossing("south");
        b.RecordCrossing("south");
        Assert.Equal("intercept", b.Decide(0, () => 0).Type);
        for (int i = 0; i < 11; i++) b.RecordStateTime("INVERTED", 1);
        Assert.True(b.SeesCeiling);
        b.RecordFreeze(); b.RecordFreeze();
        Assert.False(b.IgnoresFreeze);
        b.RecordFreeze();
        Assert.True(b.IgnoresFreeze);
        b.RecordPace(true, 9);
        Assert.Equal(12f, b.HearingRadius(true));
        Assert.Equal(new[] { "lane", "ceiling", "freeze", "runner" }, learned);

        var next = new ObserverBrain();
        next.Restore(b.Save());
        Assert.True(next.SeesCeiling && next.IgnoresFreeze);
        Assert.Equal("south", next.FavouriteLane());
    }
}

public class AdrenalineTests
{
    [Fact]
    public void ThreatBuildsSlipCharge()
    {
        var a = new Adrenaline();
        bool started = false, ended = false;
        a.SlipStarted += () => started = true;
        a.SlipEnded += () => ended = true;
        Assert.False(a.TrySlip());
        for (int i = 0; i < 300; i++) a.Tick(1 / 30f, 1f);
        Assert.True(a.Level > 0.95f);
        Assert.True(a.CanSlip);
        Assert.True(a.TrySlip());
        Assert.True(started && a.Slipping && a.TimeScale < 1f);
        for (int i = 0; i < 90; i++) a.Tick(1 / 30f, 0f);
        Assert.True(ended);
        Assert.Equal(1f, a.TimeScale);
        Assert.True(a.Level < 0.7f);
    }
}

public class ContentTests
{
    static bool Parses(string c) { try { Conditions.Compile(c); return true; } catch (FormatException) { return false; } }

    [Fact]
    public void WorldValidates()
    {
        var bp = WorldContent.Build();
        var problems = bp.Validate(Parses).ToList();
        Assert.True(problems.Count == 0, string.Join("\n", problems));
        Assert.Equal(8, bp.Rooms.Count);
        Assert.Equal(12, bp.Memories.Count);
        foreach (var m in bp.Memories)
            Assert.True(bp.Rooms[m.Room].Contains(m.X, m.Y, m.Z), $"memory {m.Id} outside room {m.Room}");
        foreach (var t in bp.Tokens)
            Assert.True(bp.Rooms[t.Room].Contains(t.X, t.Y, t.Z), $"token {t.Token} outside room {t.Room}");
        foreach (var i in bp.Interactables)
            Assert.True(bp.Rooms[i.Room].Contains(i.X, i.Y, i.Z), $"interactable {i.Id} outside room {i.Room}");
        foreach (var n in StoryContent.Npcs)
            Assert.True(bp.Rooms[n.Room].Contains(n.X, n.Y + 0.9f, n.Z), $"npc {n.Id} outside room {n.Room}");
    }

    [Fact]
    public void NpcsAndTokensDontSpawnInsideSolids()
    {
        var bp = WorldContent.Build();
        var solids = bp.Elements.Where(e => e.Solid && !e.Echo && !e.Shadow && e.When == null).Select(e => e.Box).ToList();
        foreach (var n in StoryContent.Npcs)
        {
            var body = new Box(n.X - 0.3f, n.Y + 0.05f, n.Z - 0.3f, n.X + 0.3f, n.Y + 1.8f, n.Z + 0.3f);
            Assert.False(solids.Any(s => s.Overlaps(body)), $"npc {n.Id} is inside geometry");
        }
        foreach (var t in bp.Tokens)
        {
            var p = new Box(t.X - 0.2f, t.Y - 0.2f, t.Z - 0.2f, t.X + 0.2f, t.Y + 0.2f, t.Z + 0.2f);
            Assert.False(solids.Any(s => s.Overlaps(p)), $"token {t.Token} is inside geometry");
        }
    }

    [Fact]
    public void EveryStoryConditionParsesAndScriptsExist()
    {
        var conds = new List<string>();
        conds.AddRange(StoryContent.Rules.Select(r => r.When));
        conds.AddRange(StoryContent.Objectives.Select(o => o.When));
        conds.AddRange(StoryContent.Scripts.Values.SelectMany(l => l).Select(l => l.When));
        conds.AddRange(StoryContent.Hints.Select(h => h.When));
        conds.AddRange(StoryContent.Endings.Select(e => e.When));
        foreach (var q in StoryContent.Questions) { conds.Add(q.open); conds.Add(q.closed); }
        foreach (var n in StoryContent.Npcs)
        {
            conds.Add(n.Appear);
            foreach (var node in n.Nodes)
            {
                conds.Add(node.When);
                conds.AddRange(node.Lines.Select(l => l.When));
                if (node.Choices != null) conds.AddRange(node.Choices.Select(c => c.When));
            }
        }
        foreach (var c in conds.Where(c => !string.IsNullOrEmpty(c))) Assert.True(Parses(c), c);

        // every played script, speaker and choice target exists
        var effects = StoryContent.Rules.SelectMany(r => r.Then)
            .Concat(StoryContent.Npcs.SelectMany(n => n.Nodes).SelectMany(nd => (nd.Then ?? new Effect[0]).Concat((nd.Choices ?? new Choice[0]).SelectMany(c => c.Then ?? new Effect[0]))))
            .Concat(WorldContent.Build().Triggers.SelectMany(t => t.Then));
        foreach (var e in effects.Where(e => e.Say != null)) Assert.True(StoryContent.Scripts.ContainsKey(e.Say), e.Say);
        foreach (var e in effects.Where(e => e.Token != null)) Assert.True(Laws.Tokens.ContainsKey(e.Token), e.Token);
        foreach (var line in StoryContent.Scripts.Values.SelectMany(l => l).Concat(StoryContent.Npcs.SelectMany(n => n.Nodes).SelectMany(nd => nd.Lines)))
            Assert.True(StoryContent.Speakers.ContainsKey(line.Who), line.Who);
        foreach (var n in StoryContent.Npcs)
            foreach (var c in n.Nodes.Where(nd => nd.Choices != null).SelectMany(nd => nd.Choices).Where(c => c.Next != null))
                Assert.Contains(n.Nodes, nd => nd.Id == c.Next);
    }

    [Fact]
    public void DialogueReactsToFacts()
    {
        var fs = new FactStore();
        var wren = StoryContent.Npcs.First(n => n.Id == "wren");
        Assert.Equal("fear", DialogueLogic.Pick(wren, fs).Id);
        fs.Set("observer_lessons", 2);
        var node = DialogueLogic.Pick(wren, fs);
        Assert.Equal("tell", node.Id);
        fs.Set(DialogueLogic.SeenKey(wren, node));
        fs.Set("wren_done");
        Assert.Equal("calm", DialogueLogic.Pick(wren, fs).Id);
    }

    [Fact]
    public void HiddenObjectiveRewritesInOrder()
    {
        var fs = new FactStore();
        var o = new Objectives(StoryContent.Objectives, fs);
        var seen = new List<string>();
        o.Changed += l => seen.Add(l.Text);
        foreach (var l in StoryContent.Objectives) { fs.Set(l.When); o.Update(); }
        Assert.Equal(StoryContent.Objectives.Select(l => l.Text), seen);
    }

    [Fact]
    public void RecordingGrowsAfterActivation()
    {
        var fs = new FactStore();
        string Text() => string.Join(" ", DialogueLogic.Filter(StoryContent.Scripts["r1"], fs).Select(l => l.Text));
        Assert.DoesNotContain("already activated", Text());
        fs.Set("machine_activated");
        Assert.Contains("If you have already activated it, I am sorry.", Text());
    }

    [Fact]
    public void TickAlwaysHasAHintUntilTheEnd()
    {
        var fs = new FactStore();
        foreach (var f in StoryContent.Discoveries)
        {
            Assert.NotNull(DialogueLogic.HintFor(StoryContent.Hints, fs, 0));
            fs.Set(f);
        }
    }

    [Fact]
    public void SecretEndingNeedsTheUndertowLaw()
    {
        var fs = new FactStore();
        var rewrite = StoryContent.Endings.First(e => e.Id == "REWRITE");
        fs.Set("memories", 12);
        Assert.False(fs.Test(rewrite.When));
        fs.Set("law_undertow_all");
        Assert.True(fs.Test(rewrite.When));
    }
}
