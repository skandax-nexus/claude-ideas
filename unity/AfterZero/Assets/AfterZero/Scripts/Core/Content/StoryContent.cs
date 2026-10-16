// AFTERZERO - story content (data). See docs/unity/STORY_BIBLE.md.
//
// Lines are conditioned on facts, so recordings grow new sentences and
// characters react to everything the player has done. Facts named here
// are set by Director events, triggers, dialogue choices and rules.
using System.Collections.Generic;
using static AfterZero.Core.Effect;

namespace AfterZero.Core.Content
{
    public static class StoryContent
    {
        public static readonly Dictionary<string, Speaker> Speakers = new Dictionary<string, Speaker>
        {
            ["NONE"] = new Speaker("", "#cfd8e0"),
            ["YOU"] = new Speaker("YOU", "#ffffff"),
            ["OTHER"] = new Speaker("???", "#c7a2ff"),
            ["VARGA"] = new Speaker("DR. ILSE VARGA", "#ffc27a"),
            ["JUNO"] = new Speaker("JUNO HALE", "#7fe0a8"),
            ["TICK"] = new Speaker("TICK", "#ffe066"),
            ["CUSTODIAN"] = new Speaker("CUSTODIAN", "#6ff0d4"),
            ["ASHE"] = new Speaker("MOTHER ASHE", "#f0a0c8"),
            ["PELL"] = new Speaker("PELL", "#a0c8f0"),
            ["WREN"] = new Speaker("WREN", "#f0c8a0"),
            ["BAEL"] = new Speaker("CMDR. IDRIS BAEL", "#ff6a5a"),
            ["OBSERVER"] = new Speaker("", "#ff7a6a"),
            ["DEVICE"] = new Speaker("DEVICE", "#9dff9d"),
        };

        static Line L(string who, string text, string when = null) => new Line(who, text, when);

        // ------------------------------------------------------------------------
        // SCRIPTS (played by interactables, events and rules)
        // ------------------------------------------------------------------------
        public static readonly Dictionary<string, Line[]> Scripts = new Dictionary<string, Line[]>
        {
            // ACT I - WAKE ------------------------------------------------------------
            ["cradle_wake"] = new[]
            {
                L("NONE", "[ BODY PRINT COMPLETE. TAG: 2089.11.04 ]"),
            },
            ["other_speaks"] = new[]
            {
                L("OTHER", "You finally learned how to move the room."),
                L("OTHER", "Now learn why it was moving you."),
            },
            ["juno_drop"] = new[]
            {
                L("JUNO", "Don't scream. Please don't scream, it hears screaming."),
                L("JUNO", "...You don't remember me. You never do."),
                L("JUNO", "Juno. Engineer. Last one awake. I've been living on the ceiling for three weeks."),
                L("JUNO", "Here. Take TICK. He's been waiting for you longer than I have."),
            },
            ["tick_hello"] = new[]
            {
                L("TICK", "HELLO. I AM TICK. I FIX THINGS AND I REMEMBER THINGS."),
                L("TICK", "IF YOU ARE STUCK, ASK ME. I WILL NOT LAUGH. MUCH."),
            },
            ["r1"] = new[]
            {
                L("NONE", "[ RECORDING 1  -  LAB 0  -  CYCLE: UNREADABLE ]"),
                L("VARGA", "This is Dr. Ilse Varga. If the field is stable, you are hearing this from the lab terminal."),
                L("VARGA", "Whatever you do, do not activate the machine."),
                L("VARGA", "If you have already activated it, I am sorry.", "machine_activated"),
                L("VARGA", "That sentence was not there the first time you listened. I added it later. Much later.", "machine_activated && vault_seen"),
                L("YOU", "That sentence wasn't there before.", "machine_activated && heard_varga && !vault_seen"),
            },
            ["r0"] = new[]
            {
                L("NONE", "[ RECORDING 0  -  DATED 14 MARCH 2071 ]"),
                L("YOU", "If you're hearing this, you made the shadow. Good. Mum said you would."),
                L("YOU", "Stand where it isn't, and let the room remember you there."),
                L("YOU", "Things you take out of a memory don't survive leaving it. Unless you change the law."),
                L("YOU", "Your body tag says 2089. This recording says 2071. Don't let that slow you down."),
                L("YOU", "...Mum? Whose mother?", "noticed_shadow"),
            },
            ["r2"] = new[]
            {
                L("NONE", "[ RECORDING 2  -  VAULT  -  DATED: AFTER ]"),
                L("VARGA", "This one is recorded after the activation. It is always after."),
                L("VARGA", "You activate it. You always do. The way out runs through the machine, and you were always good at finding ways out."),
                L("VARGA", "Bael will come for you when you do. He believes he is saving the ship. Run to the dormitory."),
                L("VARGA", "I am at the top of the ship, where time is thin. Come up. Please. I need to see you once with your eyes open."),
            },
            ["lock_no_key"] = new[]
            {
                L("NONE", "ARCHIVE SEALED. QUERY: \"LABORATORY\" - NO RECORD."),
                L("CUSTODIAN", "There is no laboratory. There has never been a laboratory.", "!custodian_denied"),
                L("CUSTODIAN", "You are standing in nothing. Bring me something that says otherwise.", "!custodian_denied"),
                L("CUSTODIAN", "Still nothing. Evidence, or silence.", "custodian_denied"),
            },
            ["lock_echo_key"] = new[]
            {
                L("CUSTODIAN", "That key is a memory. Memories are not evidence."),
                L("CUSTODIAN", "Make it real, then show me."),
                L("TICK", "IT WANTS THE KEY TO EXIST IN THIS ROOM'S STATE. THE DEVICE HAS LAWS. LAWS CAN CHANGE.", "has_tick"),
            },
            ["lock_open"] = new[] { L("NONE", "KEY ACCEPTED: LABORATORY 0."), L("CUSTODIAN", "...") },
            ["custodian_first"] = new[]
            {
                L("CUSTODIAN", "The laboratory. Yes. I remember it now."),
                L("CUSTODIAN", "You came through that door before. You were older. You were carrying her."),
                L("JUNO", "...That was me. Cycle nine carried me out of the reactor fire. I never knew his face.", "has_tick"),
                L("CUSTODIAN", "You told me to forget the laboratory, so you would have to prove it to yourself."),
                L("CUSTODIAN", "You also told me to give you these. And to say: the bridge is load-bearing if you want it to be."),
            },
            ["machine_empty"] = new[]
            {
                L("NONE", "An empty socket. Something round and heavy belonged here."),
                L("JUNO", "The core's in the observation hall. So is the thing that guards it. Go slow. Go quiet.", "met_juno"),
            },
            ["machine_installed"] = new[] { L("NONE", "The core seats itself. The machine is waiting."), L("JUNO", "That's it. That's all it needs. One more push.", "met_juno") },
            ["machine_warn"] = new[]
            {
                L("VARGA", "Whatever you do, do not activate the machine."),
                L("JUNO", "She says that every cycle. She also built it. Your call.", "met_juno"),
                L("DEVICE", "USE AGAIN TO ACTIVATE."),
            },
            ["machine_activate"] = new[]
            {
                L("NONE", "The field opens. The walls are not walls."),
                L("YOU", "Stars. It's not a lab. It's moving."),
                L("BAEL", "Subject Zero. This is Commander Bael. Stand down."),
                L("BAEL", "Forty-two cycles. Every one ends exactly like this. This one ends with you."),
                L("JUNO", "Wardens! East door - I'm cutting it now. RUN!", "met_juno"),
            },
            ["lockdown_caught"] = new[] { L("BAEL", "Again. We do this until you stop."), L("TICK", "THEY CANNOT SEE THE CEILING. JUST SAYING.", "has_tick") },
            ["act2_safe"] = new[]
            {
                L("NONE", "The bulkhead slams shut behind you. Hands pull you down into the dark."),
                L("ASHE", "Easy, forty-two. Easy. You're among family here."),
            },

            // ACT II - CYCLES ------------------------------------------------------------
            ["bunk42"] = new[]
            {
                L("NONE", "Bunk 42. Your name tag is already on it. So is a jacket in your size, still folded."),
                L("YOU", "Somebody made this bed for me. Before I existed."),
            },
            ["juno_confession"] = new[]
            {
                L("JUNO", "I need to tell you something before you hear it from Ashe."),
                L("JUNO", "The Observer. It didn't used to learn. I installed its learning core. Varga asked me to."),
                L("JUNO", "She said it was the only way it could ever... recognise you. I didn't ask what that meant. I'm sorry."),
            },
            ["tick_name"] = new[]
            {
                L("TICK", "SCAN COMPLETE. VOICEPRINT MATCH: 99.2 PERCENT."),
                L("TICK", "...REN?"),
                L("TICK", "YOU BUILT ME WHEN YOU WERE NINE. YOU GAVE ME A NAME BECAUSE I MADE A SOUND. I HAVE MISSED YOU FOR FORTY-TWO CYCLES."),
                L("YOU", "Ren. That's... my name. That's my name."),
            },
            ["launch_log"] = new[]
            {
                L("NONE", "[ LAUNCH LOG  -  VESSEL AFTERZERO  -  2071 ]"),
                L("VARGA", "Field test four: when the anchor mind drifts, the Undertow gains. When the anchor is reunited with a body, it falls back."),
                L("VARGA", "Activation does not feed the Undertow. Drift does. Idris must never read this. He would kill the body to stop the drift, and the drift would win."),
            },
            ["spine_rise"] = new[] { L("JUNO", "The Undertow's in the Spine! Climb - however you can - CLIMB!") },

            // ACT III - ZERO ------------------------------------------------------------
            ["crown_enter"] = new[]
            {
                L("NONE", "The Reactor Crown. Behind you, the corridor begins to un-happen."),
                L("TICK", "DO NOT LOOK BACK. ALSO DO NOT STOP. ALSO RUN.", "has_tick"),
            },
            ["bael_block"] = new[]
            {
                L("BAEL", "Far enough. Forty-one times I failed to stop you. Not forty-two."),
                L("BAEL", "Every activation, the Undertow eats another deck. My wife was on deck nine."),
            },
            ["bael_evidence"] = new[]
            {
                L("YOU", "Read it. Varga's launch log. Activation doesn't feed it. Drift does."),
                L("BAEL", "...She knew. She knew and she let me hunt you."),
                L("BAEL", "Go. Before I change my mind. Before it changes it for me."),
            },
            ["bael_no_evidence"] = new[]
            {
                L("BAEL", "Words. Every cycle has words. Wardens - take it."),
            },
            ["bael_falls"] = new[] { L("NONE", "The Undertow reaches the barrier. Bael doesn't move. The barrier un-happens with him."), L("YOU", "...") },
            ["core_enter"] = new[]
            {
                L("VARGA", "You came up. You came all the way up."),
                L("VARGA", "Ren. Look at me. I'm so sorry. I couldn't let you go, so I made the whole ship hold on instead."),
                L("NONE", "Behind the glass, a human brain pulses with the field. In the doorway, the Observer has stopped hunting."),
                L("YOU", "That's me. In the glass. And that's me in the door. And this is me."),
            },
            ["observer_face"] = new[]
            {
                L("NONE", "It looks at you the way you look at a mirror."),
                L("YOU", "It learned how I hide. How I run. How I think."),
                L("YOU", "It was learning to be me, so it could come home."),
            },

            // events
            ["key_dissolves"] = new[] { L("NONE", "The key comes apart in your hand and drifts back into memory.") },
            ["caught"] = new[] { L("OBSERVER", "It remembers you.") },
            ["fell"] = new[] { L("NONE", "The ship returns you to where it last remembered you.") },
            ["shadow_cold"] = new[] { L("NONE", "It is cold, and solid, and waiting for something you have not done yet.") },
            ["shadow_opens"] = new[] { L("NONE", "The shadow steps into the wall. The wall remembers a door.") },
            ["first_token"] = new[] { L("DEVICE", "NEW LAW TOKEN. THE DEVICE CAN BE REWRITTEN.") },
            ["slip_ready"] = new[] { L("DEVICE", "ADRENAL SYNC. NEXT SHIFT WILL SLIP.") },
        };

        // ------------------------------------------------------------------------
        // NPCs (dialogue trees)
        // ------------------------------------------------------------------------
        public static readonly List<NpcDef> Npcs = new List<NpcDef>
        {
            new NpcDef
            {
                Id = "juno", Name = "Juno Hale", Color = "#7fe0a8", Model = "human", Role = "Engineer. Companion.",
                Room = "lab", X = -6, Y = 0, Z = -4, Yaw = 45, Appear = "met_juno && !act2",
                Nodes = new List<DialogueNode>
                {
                    new DialogueNode { Id = "trust", Once = true, When = "met_juno && !heard_varga",
                        Lines = new[] { L("JUNO", "Varga left recordings everywhere. The one by the bench is the one she cared about.") } },
                    new DialogueNode { Id = "ask", Once = true, When = "heard_varga",
                        Lines = new[] { L("JUNO", "So. You heard her. Don't activate the machine. What do you think?") },
                        Choices = new[]
                        {
                            new Choice { Text = "I trust Varga.", Then = new[] { SetFact("trust_varga") } },
                            new Choice { Text = "I trust you.", Then = new[] { SetFact("trust_juno") } },
                            new Choice { Text = "I trust what I can prove.", Then = new[] { SetFact("trust_evidence") } },
                        } },
                    new DialogueNode { Id = "core", When = "!core_installed",
                        Lines = new[] { L("JUNO", "Core's in the hall. The thing in there learns. Don't give it the same lesson twice.") } },
                    new DialogueNode { Id = "push", When = "core_installed && !machine_activated",
                        Lines = new[] { L("JUNO", "It's ready. I'm ready. Are you?") } },
                },
            },
            new NpcDef
            {
                Id = "juno2", Name = "Juno Hale", Color = "#7fe0a8", Model = "human",
                Room = "dorm", X = 30, Y = 0, Z = 6, Yaw = 200, Appear = "act2 && !crown_entered", Prompt = "TALK",
                Nodes = new List<DialogueNode>
                {
                    new DialogueNode { Id = "confess", Once = true, When = "act2", Then = new[] { SetFact("juno_confessed") },
                        Lines = Scripts["juno_confession"],
                        Choices = new[]
                        {
                            new Choice { Text = "You did what you had to.", Then = new[] { SetFact("forgave_juno") } },
                            new Choice { Text = "You made it hunt me.", Then = new[] { SetFact("blamed_juno") } },
                        } },
                    new DialogueNode { Id = "after", When = "forgave_juno",
                        Lines = new[] { L("JUNO", "The Spine's the only way up. I'll hold the hatch. Go.") } },
                    new DialogueNode { Id = "cold", When = "blamed_juno",
                        Lines = new[] { L("JUNO", "...Spine's east. I'll hold the hatch anyway.") } },
                },
            },
            new NpcDef
            {
                Id = "custodian", Name = "Custodian", Color = "#6ff0d4", Model = "hologram", Role = "Archive keeper.",
                Room = "archive", X = 0, Y = 0, Z = 26, Yaw = 180, Appear = "archive_open", Prompt = "SPEAK",
                Nodes = new List<DialogueNode>
                {
                    new DialogueNode { Id = "remember", Once = true, When = "archive_open", Lines = Scripts["custodian_first"],
                        Then = new[] { SetFact("custodian_remembers"), Grant("ECHOES"), Grant("SOLIDIFIES"), Fire("unlock_slot_3") } },
                    new DialogueNode { Id = "vault", When = "!vault_seen",
                        Lines = new[] { L("CUSTODIAN", "The vault is past the gap. The bridge exists only in memory. Memory can be made load-bearing.") } },
                    new DialogueNode { Id = "after", When = "vault_seen",
                        Lines = new[] { L("CUSTODIAN", "Varga's last recording is filed under AFTER. I do not understand the filing system. I keep it anyway.") } },
                },
            },
            new NpcDef
            {
                Id = "ashe", Name = "Mother Ashe", Color = "#f0a0c8", Model = "human_old", Role = "Cycle 9. Leader of the Dormitory.",
                Room = "dorm", X = 40, Y = 0, Z = 0, Yaw = 270, Appear = "act2",
                Nodes = new List<DialogueNode>
                {
                    new DialogueNode { Id = "welcome", Once = true, When = "act2", Then = new[] { SetFact("learned_cycle") },
                        Lines = new[]
                        {
                            L("ASHE", "I was the ninth. Pell was seventeen. Wren was thirty. You're forty-two."),
                            L("ASHE", "The ship prints us from the same memories, every time the field drifts. We're copies of one child."),
                            L("ASHE", "Most of us activate the machine and vanish into it. The ones who refuse end up here. We grow old. It's not the worst life."),
                        },
                        Choices = new[]
                        {
                            new Choice { Text = "Whose child?", Next = "whose" },
                            new Choice { Text = "Why did you refuse?", Next = "refuse" },
                        } },
                    new DialogueNode { Id = "whose", When = "false", Lines = new[] { L("ASHE", "Ask the drone. He's known all along. He just never had the right ears to tell.") } },
                    new DialogueNode { Id = "refuse", When = "false", Lines = new[] { L("ASHE", "Because I met the Observer in the hall and it looked at me like it knew me. I ran. I've been running for sixty years.") } },
                    new DialogueNode { Id = "slot", Once = true, When = "learned_cycle && tick_named",
                        Lines = new[]
                        {
                            L("ASHE", "Ren. Of course. Then you'll need this. Every one of us carries a piece of the law. This is mine."),
                        },
                        Then = new[] { Grant("UNDERTOW"), Fire("unlock_slot_4") } },
                    new DialogueNode { Id = "spine", When = "learned_cycle",
                        Lines = new[] { L("ASHE", "Up the Spine to the Crown. Varga is there. So is whatever is left of the first of us.") } },
                },
            },
            new NpcDef
            {
                Id = "pell", Name = "Pell", Color = "#a0c8f0", Model = "human", Role = "Cycle 17. Wants proof he existed.",
                Room = "dorm", X = 50, Y = 0, Z = -8, Yaw = 0, Appear = "act2",
                Nodes = new List<DialogueNode>
                {
                    new DialogueNode { Id = "ask", Once = true, When = "act2 && !pell_name_seen",
                        Lines = new[]
                        {
                            L("PELL", "I carved my name into a pillar in the observation hall. Seventeen. Big letters."),
                            L("PELL", "Nobody believes me. The ship erased it. Go see if it's still there... in the way things are still there."),
                        }, Then = new[] { SetFact("quest_pell") } },
                    new DialogueNode { Id = "wait", When = "quest_pell && !pell_name_seen",
                        Lines = new[] { L("PELL", "Hall. Pillar. Seventeen. Look at what the room remembers, not what it shows.") } },
                    new DialogueNode { Id = "thanks", Once = true, When = "pell_name_seen",
                        Lines = new[] { L("PELL", "It's still there? ...Then I was here. Then I was real. Take this - it never worked for me. Maybe you'll make it mean something.") },
                        Then = new[] { Grant("SHADOWS"), SetFact("pell_done") } },
                    new DialogueNode { Id = "idle", When = "pell_done", Lines = new[] { L("PELL", "Seventeen. Big letters.") } },
                },
            },
            new NpcDef
            {
                Id = "wren", Name = "Wren", Color = "#f0c8a0", Model = "human", Role = "Cycle 30. Terrified of the Observer.",
                Room = "dorm", X = 26, Y = 0, Z = -9, Yaw = 30, Appear = "act2",
                Nodes = new List<DialogueNode>
                {
                    new DialogueNode { Id = "fear", When = "observer_lessons < 2 && !wren_done",
                        Lines = new[] { L("WREN", "Did it look at you? In the hall? I still hear it when I close my eyes. Tell me what it knows. Tell me it doesn't know everything.") } },
                    new DialogueNode { Id = "tell", Once = true, When = "observer_lessons >= 2",
                        Lines = new[] { L("WREN", "It learned things from you? Then it can be taught. Then it's not a monster, it's a student.") },
                        Choices = new[]
                        {
                            new Choice { Text = "It learns what you show it. Nothing more.", Then = new[] { SetFact("wren_done"), Grant("TIME") } },
                            new Choice { Text = "It learns everything, eventually.", Then = new[] { SetFact("wren_done"), SetFact("wren_scared"), Grant("TIME") } },
                        } },
                    new DialogueNode { Id = "calm", When = "wren_done && !wren_scared", Lines = new[] { L("WREN", "A student. I can live with a student.") } },
                    new DialogueNode { Id = "scared", When = "wren_scared", Lines = new[] { L("WREN", "Everything. Eventually. Okay. Okay.") } },
                },
            },
            new NpcDef
            {
                Id = "bael", Name = "Cmdr. Idris Bael", Color = "#ff6a5a", Model = "human_officer", Role = "Security chief. Hunter.",
                Room = "crown", X = 142, Y = 52, Z = 0, Yaw = 270, Appear = "crown_entered && !bael_resolved", Prompt = "CONFRONT",
                Nodes = new List<DialogueNode>
                {
                    new DialogueNode { Id = "block", When = "crown_entered", Lines = Scripts["bael_block"],
                        Choices = new[]
                        {
                            new Choice { Text = "Show him Varga's launch log.", When = "has_launch_log", Then = new[] { SetFact("bael_convinced"), SetFact("bael_resolved"), Play("bael_evidence") } },
                            new Choice { Text = "\"Activation isn't what feeds it.\"", When = "!has_launch_log", Then = new[] { Play("bael_no_evidence"), Fire("bael_wardens") } },
                            new Choice { Text = "Run past him.", Then = new[] { Fire("bael_wardens") } },
                        } },
                },
            },
            new NpcDef
            {
                Id = "varga", Name = "Dr. Ilse Varga", Color = "#ffc27a", Model = "human_old", Role = "Creator. Mother.",
                Room = "core", X = 160, Y = 52, Z = 6, Yaw = 200, Appear = "core_entered",
                Nodes = new List<DialogueNode>
                {
                    new DialogueNode { Id = "why", Once = true, When = "core_entered",
                        Lines = new[]
                        {
                            L("VARGA", "You died at launch. Seventeen. I kept the part of you that thinks, and the ship learned to dream around it."),
                            L("VARGA", "When your mind drifts, the Undertow gains. When a body that remembers being you chooses to go on, it falls back."),
                            L("VARGA", "Forty-one of you chose for me. I won't choose for you again."),
                        } },
                    new DialogueNode { Id = "idle", When = "core_entered",
                        Lines = new[] { L("VARGA", "The terminal is yours. Whatever you decide, I'm proud of you. I've been proud of you forty-two times.") } },
                },
            },
        };

        // ------------------------------------------------------------------------
        // RULES - authored consequences + theory log
        // ------------------------------------------------------------------------
        public static readonly List<Rule> Rules = new List<Rule>
        {
            R("a1", "shard_touch >= 1", LogEntry("Touching the object changed the room, not me. Gravity let go.")),
            R("a2", "has_device", LogEntry("The object is in my hand now. It changes the state of whatever room I stand in.")),
            R("a3", "seen_echo", LogEntry("ECHO shows what happened here. Footprints. Writing. Things that are gone.")),
            R("a4", "met_juno", LogEntry("Juno has been hiding on the ceiling. She knew my face. I didn't know hers.")),
            R("a5", "noticed_shadow", LogEntry("The shadow on the east wall moves against me.")),
            R("a6", "shadow_passage_open", LogEntry("I stood where it wasn't. It stood where the door was.")),
            R("a7", "heard_self", LogEntry("Recording 0 is my voice, dated 2071. My body is tagged 2089. And I said \"Mum\".")),
            R("a8", "key_dissolved", LogEntry("Things I take from the echo don't survive leaving it.")),
            R("a9", "wrote_law", LogEntry("The device runs on laws. I can rewrite them. The world obeys.")),
            R("a10", "custodian_remembers", LogEntry("The archive remembers an older me carrying Juno out of a fire.")),
            R("a11", "vault_seen", LogEntry("Varga isn't missing. She's recording from after - from the top of the ship.")),
            R("a12", "machine_activated", LogEntry("The walls are windows. It's a ship. And someone called Bael wants me dead.")),
            R("a13", "learned_cycle", LogEntry("I'm the forty-second copy of the same child.")),
            R("a14", "tick_named", LogEntry("TICK knows my name. Ren. I built him when I was nine.")),
            R("a15", "has_launch_log", LogEntry("Activation doesn't feed the Undertow. Drift does. Bael has it backwards.")),
            R("a16", "core_entered", LogEntry("The brain in the glass is mine. The Observer is mine. Varga is my mother.")),
            R("a17", "observer_faced", LogEntry("The Observer was never hunting me. It was learning me, so it could come home.")),

            // consequences
            R("lockdown", "machine_activated", SetFact("lockdown"), Fire("lockdown_start")),
            R("tether", "core_entered", SetFact("observer_tethered")),
            R("name", "tick_named", SetFact("knows_name")),
        };

        static Rule R(string id, string when, params Effect[] then) => new Rule { Id = id, When = when, Then = then };

        // ------------------------------------------------------------------------
        // HIDDEN OBJECTIVE (System 5)
        // ------------------------------------------------------------------------
        public static readonly List<ObjectiveLayer> Objectives = new List<ObjectiveLayer>
        {
            O("left_cradle", "Get out of here.", "I woke in a sealed room. Nothing else made sense."),
            O("met_juno", "Help Juno restart the ship.", "She's alive, she's scared, and she knows this place."),
            O("heard_varga", "Find Dr. Ilse Varga.", "Someone left a warning. She might know what's going on."),
            O("machine_activated", "Escape Commander Bael.", "I did the one thing she told me not to. Now I'm hunted."),
            O("act2", "Learn what the cycles are.", "Forty-one people with my face live behind this door."),
            O("learned_cycle", "Reach the Reactor Crown.", "Varga is at the top of the ship. So are the answers."),
            O("crown_entered", "Get past Bael to the Core.", "The Undertow is eating the corridor behind me."),
            O("core_entered", "Decide what Ren is for.", "Mind, body, field, mother. Something has to give."),
        };

        static ObjectiveLayer O(string when, string text, string because) => new ObjectiveLayer { When = when, Text = text, Because = because };

        // ------------------------------------------------------------------------
        // TICK HINTS - first matching situation; 3 tiers (nudge, direction, answer)
        // ------------------------------------------------------------------------
        public static readonly List<Hint> Hints = new List<Hint>
        {
            H("!has_device", "THE FLOATING THING LOOKS TOUCHABLE.", "TOUCH IT. THEN TOUCH IT AGAIN.", "TOUCH THE OBJECT TWICE. WHEN THE ROOM FLIPS, WALK THROUGH THE NEW DOOR."),
            H("has_device && !left_cradle", "THE DOOR ONLY EXISTS IN ONE STATE.", "TRY THE ROOM UPSIDE DOWN.", "SHIFT TO INVERTED AND WALK OUT ALONG THE CEILING."),
            H("!heard_varga", "SOMEONE LEFT A MESSAGE.", "THE TERMINAL BY THE BENCH.", "PLAY THE RECORDING AT THE LAB TERMINAL."),
            H("!core_installed && !token_HELD", "THE SHADOW ON THE EAST WALL IS WRONG.", "IT MIRRORS YOU. IN ECHO IT BECOMES REAL. THE WALL HAS A DOOR OUTLINE.", "STAND SO THE SHADOW COVERS THE DOOR OUTLINE, THEN SHIFT TO ECHO."),
            H("!token_PERSISTS", "SOMETHING GLOWS NEAR THE CEILING.", "YOU CAN WALK ON CEILINGS.", "SHIFT THE LAB TO INVERTED AND WALK TO THE GLOW."),
            H("!archive_open && !wrote_law", "THE KEY ONLY EXISTS AS A MEMORY.", "MEMORIES DISSOLVE OUTSIDE ECHO. UNLESS A LAW SAYS OTHERWISE.", "WRITE: HELD MATTER PERSISTS THROUGH PHYSICAL. TAKE THE KEY IN ECHO, SHIFT, USE THE ARCHIVE PANEL."),
            H("!archive_open", "THE ARCHIVE WANTS EVIDENCE.", "CARRY THE KEY INTO THE PHYSICAL LAB.", "TAKE THE KEY IN ECHO, SHIFT TO PHYSICAL, USE THE ARCHIVE PANEL."),
            H("!core_installed", "THE MACHINE NEEDS A CORE. THE HALL HAS ONE.", "IT DOES NOT LOOK UP. AT FIRST. ECHO SHOWS WHERE IT WALKED.", "CROSS THE HALL ON THE CEILING, OR FREEZE IT WITH A LAW. VARY YOUR HIDING SPOTS."),
            H("archive_open && !vault_seen && custodian_remembers", "THE BRIDGE IS A MEMORY.", "MEMORIES CAN BE MADE SOLID.", "WRITE: ECHOES SOLIDIFY IN ECHO. SHIFT THE ARCHIVE TO ECHO AND WALK ACROSS."),
            H("core_installed && !machine_activated", "THE MACHINE IS READY.", "SOMEONE TOLD YOU NOT TO.", "USE THE MACHINE TWICE."),
            H("lockdown && !act2", "WARDENS CANNOT SEE THE CEILING.", "THE EAST DOOR IS OPEN. INVERT THE LAB.", "SHIFT TO INVERTED, RUN THE CEILING TO THE EAST DOOR, DROP INTO THE DORMITORY."),
            H("act2 && !learned_cycle", "THE OLD WOMAN IS IN CHARGE.", "TALK TO MOTHER ASHE.", "TALK TO ASHE IN THE MIDDLE OF THE DORMITORY."),
            H("learned_cycle && !spine_top", "UP. THE ONLY WAY IS UP.", "IN THE SPINE, FALL UPWARD, THEN FALL DOWN WHERE YOU WANT TO LAND.", "INVERT THE SPINE, CROSS UNDER THE TRAY TO THE GAP, REACH THE TOP, WALK OVER THE LANDING, SHIFT TO PHYSICAL."),
            H("crown_entered && !bael_resolved", "THE FLOOR HAS HOLES. THE CEILING DOES NOT.", "SOME SECTIONS NEED THE CEILING, SOME NEED THE FLOOR, SOME NEED MEMORY.", "INVERT FOR THE GAPS, PHYSICAL FOR THE HANGING STACKS, SOLID ECHOES FOR THE LAST BRIDGE. SLOW TIME IF YOU HAVE IT."),
            H("core_entered", "THIS IS YOUR CHOICE.", "LISTEN TO HER. LOOK AT IT.", "USE THE CORE TERMINAL WHEN YOU ARE READY."),
        };

        static Hint H(string when, params string[] tiers) => new Hint { When = when, Tiers = tiers };

        // ------------------------------------------------------------------------
        // ENDINGS
        // ------------------------------------------------------------------------
        public static readonly List<EndingDef> Endings = new List<EndingDef>
        {
            new EndingDef { Id = "SEVER", Title = "SEVERED", Choice = "Shut down the field.", Blurb = "Let Ren rest. Let the ship face what's coming.",
                Text = new[]
                {
                    "You lay your hand on the glass and turn the field off. The brain goes dark between one pulse and the next.",
                    "In the doorway, the Observer folds to the floor like a coat with no one in it. Your mother doesn't look away.",
                    "The windows fill with the Undertow. It reaches the ship and finds nothing left to un-happen: there is no cycle, no copy, no debt.",
                    "Down in the dormitory, forty-one people with your face hold hands in the dark. For the first time, nobody is waiting to be printed.",
                } },
            new EndingDef { Id = "SUSTAIN", Title = "SUSTAINED", Choice = "Keep the field running.", Blurb = "Take your mother's place. Keep everyone alive one cycle longer.",
                Text = new[]
                {
                    "You leave it running. The brain keeps its slow rhythm. The ship keeps moving.",
                    "Your mother shows you the recording booth. You begin: \"This is Ren. If the field is stable...\"",
                    "Far below, in a sealed room, somebody wakes up and sees a glowing object for the first time.",
                    "You go down to the corridor, stand upside down, and wait to tell them how to move the room.",
                } },
            new EndingDef { Id = "BECOME", Title = "OBSERVED", When = "observer_faced && heard_self && custodian_remembers", Choice = "Let the Observer see you.", Blurb = "Stop hiding. Come home.",
                Text = new[]
                {
                    "You walk to the doorway and stand where the Observer can see you. You do not hide.",
                    "It has learned how you hide, how you run, which laws you lean on. Now it learns the last thing: that you chose to be seen.",
                    "The field stops drifting. The Undertow falls back, deck by deck, and stays back.",
                    "There is one of you now. The ship knows your name, and so does your mother, and she gets to say it out loud.",
                } },
            new EndingDef { Id = "REWRITE", Title = "AFTER ZERO", When = "law_undertow_all && memories >= 10", Choice = "Rewrite the field itself.", Blurb = "UNDERTOW FREEZES IN ALL STATES. Make it true everywhere.",
                Text = new[]
                {
                    "You don't choose between mind, body and field. You open the device and write the one law nobody thought could be written.",
                    "UNDERTOW  FREEZES IN  ALL STATES. The ship believes you. Then the space around the ship believes the ship.",
                    "The cycles stop. The dormitory doors open. Pell finds his name on the pillar in daylight-coloured light.",
                    "Your mother turns the vessel around. The trip home will take nine years. You've never had nine years before.",
                } },
        };

        // ------------------------------------------------------------------------
        // OPEN QUESTIONS (journal)
        // ------------------------------------------------------------------------
        public static readonly (string q, string open, string closed, string a)[] Questions =
        {
            ("What is the floating object?", "shard_touch >= 1", "has_device", "A device that rewrites the room's state."),
            ("Why does the shadow move the wrong way?", "noticed_shadow", "heard_self", "Because a version of me made it."),
            ("Who is Juno?", "met_juno", "custodian_remembers", "Someone an older me saved."),
            ("Does the laboratory exist?", "custodian_denied", "custodian_remembers", "It does now."),
            ("Where is Varga?", "heard_varga", "vault_seen", "At the top of the ship. Recording from after."),
            ("Why does Bael want me dead?", "machine_activated", "has_launch_log", "He thinks activation feeds the Undertow."),
            ("Who am I?", "learned_cycle", "tick_named", "Ren. Forty-two times."),
            ("What does the Observer want?", "hall_seen", "observer_faced", "To come home."),
        };

        public static readonly string[] Discoveries =
        {
            "has_device", "met_juno", "seen_echo", "noticed_shadow", "shadow_passage_open", "heard_self", "heard_varga",
            "key_dissolved", "wrote_law", "archive_open", "custodian_remembers", "vault_seen", "core_installed",
            "machine_activated", "act2", "learned_cycle", "tick_named", "pell_done", "wren_done", "spine_top",
            "has_launch_log", "crown_entered", "bael_resolved", "core_entered", "observer_faced",
        };
    }
}
