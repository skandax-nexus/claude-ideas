// AFTERZERO - the game loop. Owns the core systems (facts, reality engine,
// objectives, adrenaline), builds the world from WorldContent, and wires the
// player, Observer, NPCs, chases, director, audio, post-processing and HUD.
using System.Collections.Generic;
using System.Linq;
using AfterZero.Core;
using AfterZero.Core.Content;
using UnityEngine;

namespace AfterZero.Runtime
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Tooltip("Optional: replace greybox materials and props with real art.")]
        public WorldTheme Theme;

        // core
        public FactStore Facts { get; private set; }
        public RealityEngine Engine { get; private set; }
        public Objectives Objectives { get; private set; }
        public Adrenaline Adrenaline { get; private set; }
        public Blueprint BP { get; private set; }
        public Settings Settings { get; private set; }
        public InputRouter Input { get; private set; }
        public Legacy Legacy { get; private set; }

        // systems
        public LevelBuilder World { get; private set; }
        public PlayerMotor Motor { get; private set; }
        public PlayerCamera Cam { get; private set; }
        public Interactor Interactor { get; private set; }
        public ObserverAgent Observer { get; private set; }
        public Director Director { get; private set; }
        public DialogueRunner Dialogue { get; private set; }
        public Hud Hud { get; private set; }
        public AudioDirector Audio { get; private set; }
        public PostFX Post { get; private set; }
        public ChaseDirector Chases { get; private set; }
        public NpcManager Npcs { get; private set; }
        public TickCompanion Tick { get; private set; }
        public MobileControls Mobile { get; private set; }
        public Atmosphere Atmos { get; private set; }

        // state
        public string Room { get; private set; }
        public string Held;
        public string Menu { get; private set; } = "title";
        public bool Running => Menu == null;
        public readonly List<string> Log = new List<string>();
        public readonly List<string> Timeline = new List<string>();
        public float PlayTime;
        public int Cycle = 42;
        public string RoomState => Engine.State(Room);
        public bool Catching { get; private set; }

        float saveTimer;
        bool dirty;

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            Settings = Settings.Load();
            Settings.Apply();
            Legacy = SaveSystem.ReadLegacy();
            Palette.Theme = Theme;
            Input = new InputRouter();
            NewState();

            BP = WorldContent.Build();
            World = new GameObject("World").AddComponent<LevelBuilder>();
            World.Build(this, BP);

            var player = new GameObject("Player") { layer = 2 }; // Ignore Raycast: perception rays pass through us
            Motor = player.AddComponent<PlayerMotor>();
            var camGo = new GameObject("PlayerCamera") { tag = "MainCamera" };
            var cam = camGo.AddComponent<Camera>();
            camGo.AddComponent<AudioListener>();
            Cam = camGo.AddComponent<PlayerCamera>();
            Cam.Init(cam);
            Interactor = new Interactor(this);

            Atmos = gameObject.AddComponent<Atmosphere>();
            Audio = gameObject.AddComponent<AudioDirector>();
            Post = gameObject.AddComponent<PostFX>();
            Post.Init(cam);
            Hud = gameObject.AddComponent<Hud>();
            Mobile = gameObject.AddComponent<MobileControls>();
            Dialogue = new DialogueRunner(this);
            Director = new Director(this);
            Npcs = new GameObject("NPCs").AddComponent<NpcManager>();
            Npcs.Init(this);
            Chases = new GameObject("Chases").AddComponent<ChaseDirector>();
            Chases.Init(this);
            Observer = ObserverAgent.Create(this, BP.HuntZones[0]);
            Tick = TickCompanion.Create(this);
            new GameObject("DeviceView").AddComponent<DeviceView>().Init(this);

            Wire();
            Motor.Landed += v => { if (v > 6) { Cam.Land(v); Audio.Land(v); } };
            EnterRoom("cradle", true);
            World.Refresh();
            Cam.InstantFlip = Settings.InstantFlip;
            SetCursor(true); // title screen
        }

        void NewState()
        {
            Facts = new FactStore();
            Engine = new RealityEngine(4, 2);
            Objectives = new Objectives(StoryContent.Objectives, Facts);
            Adrenaline = new Adrenaline();
            Log.Clear();
            Timeline.Clear();
            PlayTime = 0;
        }

        void Wire()
        {
            Facts.EffectRaised += e => Director.HandleEffect(e);
            Facts.Changed += (k, v, old) =>
            {
                if (v != 0 && StoryContent.Discoveries.Contains(k) && !Timeline.Any(t => t.StartsWith(k + "@")))
                    Timeline.Add($"{k}@{Mathf.RoundToInt(PlayTime)}");
                World.Refresh();
                Objectives.Update();
                dirty = true;
            };
            Engine.Shifted += (room, from, to) =>
            {
                World.Refresh();
                Director.OnShift(room, from, to);
                if (room == Room) { Audio.OnShift(to); Post.OnShift(to); Atmos.OnShift(); }
                dirty = true;
            };
            Engine.LawsChanged += () => { World.Refresh(); dirty = true; };
            Objectives.Changed += l => { Hud.SetObjective(l.Text, true); Audio.Chime(0.6f); };
            Adrenaline.SlipStarted += () => { Audio.Slip(true); Post.Pulse(1f); };
            Adrenaline.SlipEnded += () => Audio.Slip(false);
            Facts.AddRules(StoryContent.Rules);
        }

        // --- game flow -------------------------------------------------------------------
        public void NewGame(bool plus = false)
        {
            SaveSystem.Delete();
            Facts.Restore(new string[0], new string[0]);
            Engine.Restore(new RealityEngine(4, 2).Save());
            Engine.Lock("cradle");
            Engine.SetOverride("cradle", "zeroG", null);
            Log.Clear(); Timeline.Clear(); PlayTime = 0;
            Cycle = plus ? Legacy.Cycle : 42;
            if (plus && Settings.ObserverRemembers && Legacy.Brain != null) Observer.Brain.Restore(Legacy.Brain);
            else Observer.Brain.Restore(new ObserverBrain().Save());
            Facts.Set("cycle", Cycle);
            Facts.EvaluateRules();
            Held = null;
            Npcs.Reset();
            Chases.ResetAll();
            Observer.ResetAgent();
            World.Uncollapse("crown");
            World.Uncollapse("spine");
            EnterRoom("cradle", true);
            World.Refresh();
            Objectives.Update(true);
            Hud.SetObjective(Objectives.Text, false);
            Director.Say("cradle_wake");
            if (plus && Settings.ObserverRemembers && Legacy.Brain != null && Legacy.Brain.Lessons.Count > 0)
                Hud.Toast($"CYCLE {Cycle}. THE OBSERVER REMEMBERS YOU.");
            CloseMenu();
        }

        public void Continue()
        {
            if (!Load()) { NewGame(); return; }
            Hud.Toast("Memory restored.");
            CloseMenu();
        }

        public void OpenMenu(string id)
        {
            if (id == "laws" && !Facts.Has("has_device")) return;
            Menu = id;
            Hud.OnMenuOpened(id);
            SetCursor(true);
            Time.timeScale = 0f;
            Audio.Duck(true);
        }

        public void CloseMenu()
        {
            Menu = null;
            SetCursor(false);
            Time.timeScale = Adrenaline.TimeScale;
            Audio.Duck(false);
        }

        void SetCursor(bool free)
        {
            if (Input.IsTouch) return;
            Cursor.lockState = free ? CursorLockMode.None : CursorLockMode.Locked;
            Cursor.visible = free;
        }

        public void EnterRoom(string id, bool place)
        {
            var r = BP.Rooms[id];
            Room = id;
            if (place) PlaceAt(r.Spawn);
            World.SetActiveRooms(id);
            Atmos.OnRoom(r);
            Audio.OnRoom(r, Engine.State(id));
            Post.OnShift(Engine.State(id));
            dirty = true;
        }

        public void PlaceAt(float[] spawn)
        {
            Motor.GravityDir = Engine.Gravity(BP.RoomAt(spawn[0], spawn[1], spawn[2])?.Id ?? Room);
            float y = spawn[1];
            Motor.Teleport(new Vector3(spawn[0], y, spawn[2]));
            Cam.SetYaw(spawn.Length > 3 ? spawn[3] : 0);
            Cam.Up = Motor.GravityDir == 1 ? Vector3.down : Vector3.up;
        }

        // --- player actions -----------------------------------------------------------------
        public void Shift(string to = null)
        {
            if (!Facts.Has("has_device")) return;
            if (Engine.IsLocked(Room)) { Audio.Deny(); Hud.Toast("THE DEVICE DOESN'T RESPOND HERE."); return; }
            bool ok = to != null ? Engine.SetState(Room, to) : Engine.Cycle(Room);
            if (!ok) return;
            if (Adrenaline.Slipping) Observer.Brain.RecordSlip();
        }

        public void TrySlip()
        {
            if (!Facts.Has("has_device")) return;
            if (Adrenaline.TrySlip()) { Hud.Toast("SLIP"); Facts.Inc("slips"); }
            else Audio.Deny();
        }

        public void GrantToken(string t)
        {
            if (Facts.Has("token_" + t)) return;
            Facts.Set("token_" + t);
            Audio.Chime(1f);
            Hud.Toast($"LAW TOKEN  <b><color=#9dff9d>{Laws.Tokens[t].Label}</color></b>\n<size=80%>{(Input.IsTouch ? "LAWS" : "[L]")} to rewrite the device</size>");
            if (!Facts.Has("first_token")) { Facts.Set("first_token"); Director.Say("first_token"); }
        }

        public void OnLawInstalled(Law law)
        {
            Audio.Blip(520, 0.2f);
            bool isDefault = law != null && law.Subject == "GRAVITY" && law.Verb == "INVERTS" && law.Target == "INVERTED";
            if (law != null && !isDefault) Facts.Set("wrote_law");
            Facts.Set("law_undertow_all", Engine.InstalledLaws.Take(Engine.Unlocked).Any(l => l != null && l.Subject == "UNDERTOW" && l.Verb == "FREEZES" && l.Target == "ALL") ? 1 : 0);
        }

        public void Caught(string by, float[] checkpoint = null)
        {
            if (Catching) return;
            Catching = true;
            Facts.Inc("times_caught");
            Cam.AddTrauma(0.8f);
            Audio.Sting();
            Adrenaline.Spike(1f);
            Hud.FadeOut(() =>
            {
                Held = null;
                if (by == "observer")
                {
                    Observer.Brain.RecordCatch(RoomState);
                    Observer.ResetAgent();
                    EnterRoom("hall", true);
                    Director.Say("caught");
                }
                else
                {
                    if (by == "lockdown") Director.Say("lockdown_caught");
                    PlaceAt(checkpoint ?? BP.Rooms[Room].Spawn);
                    var r = BP.RoomAt(Motor.transform.position.x, Motor.transform.position.y, Motor.transform.position.z);
                    if (r != null) EnterRoom(r.Id, false);
                }
                Catching = false;
            });
        }

        public void Respawn(string msg)
        {
            if (Held == "key") Held = null;
            PlaceAt(BP.Rooms[Room].Spawn);
            if (msg != null) Director.Say(msg);
        }

        public void Finish(string endingId)
        {
            var e = StoryContent.Endings.First(x => x.Id == endingId);
            Facts.Set("ending_" + endingId);
            Legacy.Completions++;
            if (!Legacy.EndingsSeen.Contains(endingId)) Legacy.EndingsSeen.Add(endingId);
            Legacy.Cycle = Cycle + 1;
            Legacy.Brain = Observer.Brain.Save();
            SaveSystem.WriteLegacy(Legacy);
            SaveSystem.Delete();
            Hud.ShowEnding(e);
            OpenMenu("ending");
        }

        // --- save / load ------------------------------------------------------------------------
        public void Save()
        {
            if (Facts.Has("ending_SEVER") || Facts.Has("ending_SUSTAIN") || Facts.Has("ending_BECOME") || Facts.Has("ending_REWRITE")) return;
            SaveSystem.Write(new SaveData
            {
                Cycle = Cycle,
                Facts = Facts.SerializeFacts(),
                Fired = Facts.SerializeFired(),
                Engine = Engine.Save(),
                Brain = Observer.Brain.Save(),
                Room = Room,
                Log = new List<string>(Log),
                Timeline = new List<string>(Timeline),
                PlayTime = PlayTime,
            });
        }

        public bool Load()
        {
            var d = SaveSystem.Read();
            if (d == null) return false;
            Facts.Restore(d.Facts, d.Fired);
            Engine.Restore(d.Engine);
            Observer.Brain.Restore(d.Brain);
            Log.Clear(); Log.AddRange(d.Log);
            Timeline.Clear(); Timeline.AddRange(d.Timeline);
            PlayTime = d.PlayTime;
            Cycle = d.Cycle;
            Held = null;
            Npcs.Reset();
            Chases.ResetAll();
            Observer.ResetAgent();
            var room = d.Room != null && BP.Rooms.ContainsKey(d.Room) ? d.Room : "lab";
            if (room == "cradle" && Facts.Has("left_cradle")) room = "lab";
            if (room == "crown" && Facts.Has("crown_safe")) PlaceAt(new[] { 138f, 52.86f, 0f, 90f });
            EnterRoom(room, room != "crown" || !Facts.Has("crown_safe"));
            World.Refresh();
            Objectives.Update(true);
            Hud.SetObjective(Objectives.Text, false);
            return true;
        }

        // --- main loop ------------------------------------------------------------------------------
        void Update()
        {
            Input.Poll(Settings, Cursor.lockState == CursorLockMode.Locked);
            while (Input.Next(out var a)) HandleAction(a);
            if (!Running) return;

            float dt = Adrenaline.Slipping ? Time.unscaledDeltaTime * 0.85f : Time.deltaTime;
            dt = Mathf.Min(dt, 0.05f);
            PlayTime += Time.unscaledDeltaTime;

            // movement
            Motor.GravityDir = Engine.Gravity(Room);
            var wish = Cam.Heading * Input.Move.y + Cam.Right * Input.Move.x;
            wish.y = 0;
            if (wish.sqrMagnitude > 1) wish.Normalize();
            if (Catching || Dialogue.Blocking) wish = Vector3.zero;
            Motor.Tick(dt, wish, Input.Sprint);
            Cam.Look(Input.Look, Settings.LookSmoothing);
            Cam.Tick(Motor, Time.unscaledDeltaTime, Adrenaline.Level);

            var p = Motor.transform.position;
            var room = BP.RoomAt(p.x, p.y, p.z);
            if (room != null && room.Id != Room) EnterRoom(room.Id, false);
            var cur = BP.Rooms[Room];
            if (p.y < cur.KillY || p.y < -60 || p.y > 90) Respawn("fell");

            RunTriggers(p);
            Pickups(p);
            Director.Tick(dt);
            Interactor.Update();

            // adrenaline: the scariest thing nearby decides how hard your heart beats
            float threat = Mathf.Max(Observer.Threat(), Chases.Threat());
            Adrenaline.Tick(Time.unscaledDeltaTime, threat * Settings.ThreatScale);
            Time.timeScale = Adrenaline.TimeScale;
            if (Adrenaline.CanSlip && !Facts.Has("slip_hinted")) { Facts.Set("slip_hinted"); Director.Say("slip_ready"); }

            saveTimer -= Time.unscaledDeltaTime;
            if (dirty && saveTimer <= 0) { Save(); dirty = false; saveTimer = 4f; }
        }

        void HandleAction(Act a)
        {
            switch (a)
            {
                case Act.Pause:
                    if (Menu == null) OpenMenu("pause");
                    else if (Menu != "title" && Menu != "ending" && Menu != "choice") CloseMenu();
                    return;
                case Act.Laws:
                case Act.Journal:
                    var id = a == Act.Laws ? "laws" : "journal";
                    if (Menu == id) CloseMenu();
                    else if (Menu == null || Menu == "laws" || Menu == "journal") OpenMenu(id);
                    return;
            }
            if (!Running) return;
            switch (a)
            {
                case Act.Use: if (Dialogue.Active && Interactor.Focus == null) Dialogue.Skip(); else Interactor.Use(); break;
                case Act.Shift: Shift(); break;
                case Act.SetPhysical: Shift(RealityStates.Physical); break;
                case Act.SetInverted: Shift(RealityStates.Inverted); break;
                case Act.SetEcho: Shift(RealityStates.Echo); break;
                case Act.Slip: TrySlip(); break;
                case Act.Jump: Motor.RequestJump(); break;
                case Act.Crouch: Motor.ToggleCrouch(); break;
                case Act.Hint: Tick.GiveHint(); break;
            }
        }

        void RunTriggers(Vector3 p)
        {
            foreach (var t in BP.Triggers)
            {
                if (t.Room != Room || !t.Box.Contains(p.x, p.y, p.z)) continue;
                if (!Facts.Test(t.When, RoomState)) continue;
                bool changes = t.Then.Any(e => e.Set == null || Facts[e.Set] != e.Value);
                if (changes) Facts.Apply(t.Then);
            }
        }

        void Pickups(Vector3 p)
        {
            foreach (var t in BP.Tokens)
            {
                if (Facts.Has("token_" + t.Token) || !Facts.Test(t.When)) continue;
                if (Vector3.Distance(p, new Vector3(t.X, t.Y, t.Z)) < 1.4f) GrantToken(t.Token);
            }
            foreach (var m in BP.Memories)
            {
                if (!World.MemoryVisible(m)) continue;
                if (Vector3.Distance(p, new Vector3(m.X, m.Y, m.Z)) < 1.5f)
                {
                    Facts.Set("mem_" + m.Id);
                    Facts.Inc("memories");
                    Audio.Memory();
                    Hud.ShowMemory(m, Facts["memories"], BP.Memories.Count);
                }
            }
            if (Held != null)
            {
                var it = BP.Items.First(i => i.Id == Held);
                var s = RoomState;
                if (it.Echo && s != RealityStates.Echo && !Engine.Has("heldPersists", s))
                {
                    Held = null;
                    Facts.Set("key_dissolved");
                    Director.Say("key_dissolves");
                }
            }
        }

        void LateUpdate()
        {
            bool tickOn = Facts.Has("has_tick");
            if (Tick.gameObject.activeSelf != tickOn) Tick.gameObject.SetActive(tickOn);
            foreach (var kv in World.ItemProps) kv.Value.gameObject.SetActive(Held != kv.Key && World.ItemAvailable(BP.Items.First(i => i.Id == kv.Key)));
            foreach (var kv in World.TokenProps) kv.Value.gameObject.SetActive(!Facts.Has("token_" + kv.Key));
            foreach (var m in BP.Memories) World.MemoryProps[m.Id].gameObject.SetActive(World.MemoryVisible(m));
        }

        void OnApplicationPause(bool paused)
        {
            if (paused && Running) { Save(); OpenMenu("pause"); }
        }

        void OnApplicationQuit()
        {
            if (Menu != "title") Save();
            Settings.Save();
        }
    }
}
