// Plays lines one after another with a typewriter, then shows choices.
// Lines never block movement; choices pause the world so nobody has to
// pick an answer while being hunted.
using System;
using System.Collections.Generic;
using System.Linq;
using AfterZero.Core;
using AfterZero.Core.Content;
using UnityEngine;

namespace AfterZero.Runtime
{
    public class DialogueRunner
    {
        readonly GameManager G;
        readonly Queue<(Line line, Action done)> queue = new Queue<(Line, Action)>();
        public Line Current { get; private set; }
        public float Shown { get; private set; }     // characters revealed
        float hold;
        Action currentDone;

        public Choice[] Choices { get; private set; }
        NpcDef choiceNpc;

        public bool Active => Current != null || queue.Count > 0;
        public bool Blocking => Choices != null;

        public DialogueRunner(GameManager g) { G = g; }

        public void Play(IEnumerable<Line> lines, Action done = null)
        {
            var list = DialogueLogic.Filter(lines, G.Facts).ToList();
            for (int i = 0; i < list.Count; i++) queue.Enqueue((list[i], i == list.Count - 1 ? done : null));
            if (list.Count == 0) done?.Invoke();
            if (Current == null) Next();
        }

        public void Skip()
        {
            if (Current == null) return;
            if (Shown < Current.Text.Length) Shown = Current.Text.Length;
            else hold = 0;
        }

        void Next()
        {
            var d = currentDone;
            currentDone = null;
            Current = null;
            d?.Invoke();
            if (queue.Count == 0) return;
            var (line, done) = queue.Dequeue();
            Current = line;
            currentDone = done;
            Shown = 0;
            hold = 1.4f + line.Text.Length * 0.035f;
            G.Audio.Voice(line.Who);
        }

        public void Update(float dt)
        {
            if (Current == null) { if (queue.Count > 0) Next(); return; }
            if (Shown < Current.Text.Length) Shown = Mathf.Min(Current.Text.Length, Shown + dt * 55f);
            else { hold -= dt; if (hold <= 0) Next(); }
        }

        public string Speaker => Current == null ? null : StoryContent.Speakers.TryGetValue(Current.Who, out var s) ? s.Name : "";
        public string SpeakerColor => Current == null ? "#ffffff" : StoryContent.Speakers.TryGetValue(Current.Who, out var s) ? s.Color : "#ffffff";

        // --- NPC conversations -------------------------------------------------------------
        public void Converse(NpcDef npc, DialogueNode node)
        {
            if (node.Once) G.Facts.Set(DialogueLogic.SeenKey(npc, node));
            Play(node.Lines, () =>
            {
                G.Facts.Apply(node.Then);
                var choices = DialogueLogic.Available(node, G.Facts).ToArray();
                if (choices.Length > 0)
                {
                    Choices = choices;
                    choiceNpc = npc;
                    G.OpenMenu("choice");
                }
            });
        }

        public void Choose(int i)
        {
            if (Choices == null || i < 0 || i >= Choices.Length) return;
            var c = Choices[i];
            var npc = choiceNpc;
            Choices = null;
            choiceNpc = null;
            G.CloseMenu();
            Play(new[] { new Line("YOU", c.Text.Trim('"')) }, () =>
            {
                G.Facts.Apply(c.Then);
                if (c.Next != null)
                {
                    var node = npc.Nodes.FirstOrDefault(n => n.Id == c.Next);
                    if (node != null) Converse(npc, node);
                }
            });
        }

        public void Clear()
        {
            queue.Clear();
            Current = null;
            currentDone = null;
            Choices = null;
        }
    }
}
