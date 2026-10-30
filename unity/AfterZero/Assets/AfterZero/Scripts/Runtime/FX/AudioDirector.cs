// AFTERZERO soundtrack + sound effects, synthesised at startup (no files).
// Calm and melodic: warm pads, a marimba-like pluck, bells and a round bass
// on a slow four-chord loop. Each reality state has its own key and colour;
// danger brings in an "energy" layer (busier plucks) instead of horror.
// Replace any clip by assigning one in the inspector.
using AfterZero.Core;
using UnityEngine;

namespace AfterZero.Runtime
{
    public class AudioDirector : MonoBehaviour
    {
        const int Rate = 22050;
        const float Bpm = 76f;
        static float StepSec => 60f / Bpm / 2f;   // eighth notes

        // chords as MIDI notes (root first), four bars per loop - same moods as the web build
        static readonly int[][] Physical = { new[] { 48, 55, 64, 71, 74 }, new[] { 45, 52, 60, 67, 71 }, new[] { 41, 48, 57, 64, 69 }, new[] { 43, 50, 59, 64, 69 } };
        static readonly int[][] Inverted = { new[] { 50, 57, 66, 69, 76 }, new[] { 47, 54, 62, 66, 73 }, new[] { 43, 50, 59, 66, 71 }, new[] { 45, 52, 61, 66, 73 } };
        static readonly int[][] Echo = { new[] { 51, 58, 67, 70, 74 }, new[] { 48, 55, 63, 67, 74 }, new[] { 44, 51, 60, 67, 72 }, new[] { 46, 53, 62, 65, 70 } };

        GameManager G;
        AudioSource musicA, musicB, energy, ambience, alarm, undertow, sfx;
        AudioClip musPhysical, musInverted, musEcho, energyClip, wind, hum, alarmClip, rumble;
        bool aActive = true;
        float stepDist, duck = 1f;
        Vector3 lastPos;
        System.Random rng = new System.Random(7);

        void Awake()
        {
            G = GetComponent<GameManager>();
            musPhysical = Music("daylight", Physical, 0.2, 0.32);
            musInverted = Music("upside-dream", Inverted, 0.35, 0.3);
            musEcho = Music("memory", Echo, 0.75, 0.26);
            energyClip = Music("energy", Physical, 0, 0.9, padLevel: 0f, bassLevel: 0.6f, octave: 24);
            wind = Noise("air", 4f, 0.12f, 0.99f);
            hum = Noise("room", 4f, 0.05f, 0.995f);
            alarmClip = SoftAlert();
            rumble = Noise("undertow", 3f, 0.25f, 0.993f);
            musicA = Src(true, 0.5f); musicB = Src(true, 0f);
            energy = Src(true, 0f);
            ambience = Src(true, 0.15f);
            alarm = Src(true, 0f);
            undertow = Src(true, 0f);
            sfx = Src(false, 1f);
            musicA.clip = musPhysical; musicA.Play();
            energy.clip = energyClip; energy.Play();
            alarm.clip = alarmClip;
            undertow.clip = rumble;
        }

        AudioSource Src(bool loop, float vol)
        {
            var s = gameObject.AddComponent<AudioSource>();
            s.loop = loop; s.volume = vol; s.playOnAwake = false; s.spatialBlend = 0;
            return s;
        }

        static float Mtof(int m) => 440f * Mathf.Pow(2f, (m - 69) / 12f);

        // --- synthesis ------------------------------------------------------------------
        AudioClip Music(string name, int[][] chords, double bellChance, double pluckDensity, float padLevel = 1f, float bassLevel = 1f, int octave = 12)
        {
            int steps = 32;
            int n = Mathf.CeilToInt(steps * StepSec * Rate);
            var d = new float[n];
            for (int s = 0; s < steps; s++)
            {
                int bar = s / 8, beat = s % 8;
                var chord = chords[bar];
                int t0 = Mathf.RoundToInt(s * StepSec * Rate);
                if (beat == 0)
                {
                    for (int k = 1; k < chord.Length; k++) Pad(d, t0, StepSec * 8.2f, Mtof(chord[k]), 0.03f * padLevel);
                    Pluck(d, t0, StepSec * 6, Mtof(chord[0] - 12), 0.12f * bassLevel, 2.2f, false);
                }
                if (rng.NextDouble() < pluckDensity || beat == 0)
                {
                    int note = chord[1 + rng.Next(chord.Length - 1)] + octave + (rng.NextDouble() < 0.4 ? 12 : 0);
                    Pluck(d, t0, 0.6f, Mtof(note), 0.07f, 9f, true);
                }
                if (pluckDensity > 0.8 && rng.NextDouble() < 0.6)
                    Pluck(d, t0 + Mathf.RoundToInt(StepSec * 0.5f * Rate), 0.4f, Mtof(chord[1 + rng.Next(4)] + octave + 12), 0.04f, 12f, true);
                if (beat == 6 && rng.NextDouble() < bellChance) Bell(d, t0, Mtof(chord[2] + 24), 0.05f);
            }
            Reverb(d);
            Normalise(d, 0.7f);
            return Clip(name, d);
        }

        static void Pad(float[] d, int t0, float dur, float f, float v)
        {
            int n = Mathf.Min(d.Length - t0, Mathf.RoundToInt((dur + 1.5f) * Rate));
            float ph1 = 0, ph2 = 0;
            for (int i = 0; i < n; i++)
            {
                float t = i / (float)Rate;
                float env = Mathf.Clamp01(t / 1.4f) * (t < dur ? 1f : Mathf.Exp(-(t - dur) * 3f));
                ph1 += f * 0.997f / Rate; ph2 += f * 1.003f / Rate;
                float tri = 1f - 4f * Mathf.Abs((ph1 % 1f) - 0.5f);
                d[(t0 + i) % d.Length] += (tri * 0.6f + Mathf.Sin(ph2 * Mathf.PI * 2f) * 0.6f) * v * env;
            }
        }

        static void Pluck(float[] d, int t0, float dur, float f, float v, float decay, bool partial)
        {
            int n = Mathf.Min(d.Length, Mathf.RoundToInt(dur * Rate));
            for (int i = 0; i < n; i++)
            {
                float t = i / (float)Rate;
                float env = Mathf.Min(1f, t * 250f) * Mathf.Exp(-t * decay);
                float s = Mathf.Sin(t * f * Mathf.PI * 2f) + (partial ? Mathf.Sin(t * f * 4f * Mathf.PI * 2f) * 0.25f * Mathf.Exp(-t * 40f) : 0f);
                d[(t0 + i) % d.Length] += s * v * env;
            }
        }

        static void Bell(float[] d, int t0, float f, float v)
        {
            int n = Mathf.Min(d.Length, Mathf.RoundToInt(2.5f * Rate));
            for (int i = 0; i < n; i++)
            {
                float t = i / (float)Rate;
                float s = Mathf.Sin(t * f * Mathf.PI * 2f) * Mathf.Exp(-t * 1.6f) + Mathf.Sin(t * f * 2.76f * Mathf.PI * 2f) * 0.35f * Mathf.Exp(-t * 3f);
                d[(t0 + i) % d.Length] += s * v * Mathf.Min(1f, t * 200f);
            }
        }

        static void Reverb(float[] d)
        {
            // a few feedback delays: cheap, warm, seamless around the loop
            int[] taps = { (int)(0.113f * Rate), (int)(0.171f * Rate), (int)(0.229f * Rate) };
            var wet = new float[d.Length];
            foreach (var tap in taps)
                for (int pass = 0; pass < 2; pass++)
                    for (int i = 0; i < d.Length; i++) wet[(i + tap) % d.Length] += (d[i] + wet[i] * 0.5f) * 0.18f;
            for (int i = 0; i < d.Length; i++) d[i] += wet[i];
        }

        static void Normalise(float[] d, float peak)
        {
            float m = 0.0001f;
            foreach (var x in d) m = Mathf.Max(m, Mathf.Abs(x));
            for (int i = 0; i < d.Length; i++) d[i] *= peak / m;
        }

        AudioClip Noise(string name, float sec, float vol, float smooth)
        {
            int n = (int)(Rate * sec);
            var d = new float[n];
            float lp = 0, lp2 = 0;
            for (int i = 0; i < n; i++)
            {
                lp = lp * smooth + ((float)rng.NextDouble() * 2 - 1) * (1 - smooth);
                lp2 = lp2 * 0.9f + lp * 0.1f;
                d[i] = lp2 * vol * 8f * (0.7f + 0.3f * Mathf.Sin(i / (float)n * Mathf.PI * 4));
            }
            return Clip(name, d);
        }

        static AudioClip SoftAlert()
        {
            int n = Rate * 2;
            var d = new float[n];
            Pluck(d, 0, 0.8f, Mtof(76), 0.12f, 4f, true);
            Pluck(d, Rate, 0.8f, Mtof(72), 0.12f, 4f, true);
            return Clip("alert", d);
        }

        static AudioClip Notes(float gap, float v, float decay, params int[] midi)
        {
            int n = Mathf.RoundToInt((gap * midi.Length + 1.2f) * Rate);
            var d = new float[n];
            for (int i = 0; i < midi.Length; i++) Pluck(d, Mathf.RoundToInt(i * gap * Rate), 1.2f, Mtof(midi[i]), v, decay, true);
            return Clip("notes", d);
        }

        static AudioClip Bells(float gap, float v, params int[] midi)
        {
            int n = Mathf.RoundToInt((gap * midi.Length + 2.6f) * Rate);
            var d = new float[n];
            for (int i = 0; i < midi.Length; i++) Bell(d, Mathf.RoundToInt(i * gap * Rate), Mtof(midi[i]), v);
            return Clip("bells", d);
        }

        static AudioClip Clip(string name, float[] d)
        {
            var c = AudioClip.Create(name, d.Length, 1, Rate, false);
            c.SetData(d, 0);
            return c;
        }

        // cached one-shots
        AudioClip _up, _down, _deny, _pick, _chime, _mem, _land, _sting, _cry, _slipIn, _slipOut, _step, _voice;
        AudioClip Up => _up ? _up : _up = Notes(0.035f, 0.08f, 7f, 60, 64, 67, 71, 72, 76, 79, 83, 84, 88);
        AudioClip Down => _down ? _down : _down = Notes(0.035f, 0.08f, 7f, 88, 84, 83, 79, 76, 72, 71, 67, 64, 60);
        AudioClip DenyClip => _deny ? _deny : _deny = Notes(0.12f, 0.1f, 10f, 57, 55);
        AudioClip PickClip => _pick ? _pick : _pick = Notes(0.07f, 0.12f, 9f, 76, 83);
        AudioClip ChimeClip => _chime ? _chime : _chime = Bells(0.08f, 0.08f, 72, 76, 79, 84);
        AudioClip MemClip => _mem ? _mem : _mem = Bells(0.12f, 0.08f, 67, 71, 74, 79, 83);
        AudioClip LandClip => _land ? _land : _land = Notes(0f, 0.12f, 18f, 43);
        AudioClip StingClip => _sting ? _sting : _sting = Bells(0.14f, 0.07f, 76, 72, 69, 64);
        AudioClip CryClip => _cry ? _cry : _cry = Notes(0.09f, 0.09f, 8f, 69, 73, 76);
        AudioClip SlipIn => _slipIn ? _slipIn : _slipIn = Bells(0.05f, 0.06f, 84, 79, 76, 72);
        AudioClip SlipOut => _slipOut ? _slipOut : _slipOut = Bells(0.05f, 0.06f, 72, 76, 79, 84);
        AudioClip StepClip => _step ? _step : _step = Noise("step", 0.06f, 0.6f, 0.6f);
        AudioClip VoiceClip => _voice ? _voice : _voice = Notes(0f, 0.04f, 20f, 74);

        // --- API ----------------------------------------------------------------------------
        AudioClip MusicFor(string s) => s == RealityStates.Echo ? musEcho : s == RealityStates.Inverted ? musInverted : musPhysical;

        public void OnShift(string to)
        {
            Crossfade(MusicFor(to));
            sfx.PlayOneShot(to == RealityStates.Physical ? Down : Up, 0.8f);
        }

        public void OnRoom(RoomDef r, string state)
        {
            Crossfade(MusicFor(state));
            var clip = r.Ambience == "wind" || r.Ambience == "storm" ? wind : hum;
            if (ambience.clip != clip) { ambience.clip = clip; ambience.Play(); }
            ambience.volume = r.Ambience == "storm" ? 0.25f : 0.1f;
        }

        void Crossfade(AudioClip c)
        {
            var from = aActive ? musicA : musicB;
            var to = aActive ? musicB : musicA;
            if (from.clip == c) return;
            to.clip = c;
            to.timeSamples = from.isPlaying ? from.timeSamples % c.samples : 0; // stay on the beat
            to.Play();
            aActive = !aActive;
        }

        public void Sweep(bool up) => sfx.PlayOneShot(up ? Up : Down);
        public void Deny() => sfx.PlayOneShot(DenyClip, 0.7f);
        public void Blip(float f, float dur) => sfx.PlayOneShot(PickClip, 0.5f);
        public void Chime(float pitch) { sfx.pitch = pitch; sfx.PlayOneShot(ChimeClip); sfx.pitch = 1; }
        public void Pickup() => sfx.PlayOneShot(PickClip);
        public void Memory() => sfx.PlayOneShot(MemClip);
        public void Land(float v) => sfx.PlayOneShot(LandClip, Mathf.Clamp01(v / 14f));
        public void Sting() => sfx.PlayOneShot(StingClip, 0.9f);
        public void ObserverCry() => sfx.PlayOneShot(CryClip, 0.7f);
        public void Slip(bool on) => sfx.PlayOneShot(on ? SlipIn : SlipOut, 0.8f);
        public void Voice(string who) { if (who != "NONE" && who != "OBSERVER") { sfx.pitch = who == "TICK" ? 1.6f : who == "VARGA" ? 0.8f : 1f; sfx.PlayOneShot(VoiceClip); sfx.pitch = 1; } }
        public void Alarm(bool on) { if (on && !alarm.isPlaying) alarm.Play(); alarm.volume = on ? 0.12f : 0f; }
        public void Undertow(bool on) { if (on && !undertow.isPlaying) undertow.Play(); undertow.volume = on ? 0.35f : 0f; }
        public void Duck(bool on) => duck = on ? 0.4f : 1f;

        void Update()
        {
            if (G == null || G.Motor == null) return;
            float dt = Time.unscaledDeltaTime;
            var on = aActive ? musicA : musicB;
            var off = aActive ? musicB : musicA;
            bool talking = G.Dialogue != null && G.Dialogue.Active;
            float target = 0.5f * duck * (talking ? 0.6f : 1f);
            on.volume = Mathf.MoveTowards(on.volume, target, dt * 0.4f);
            off.volume = Mathf.MoveTowards(off.volume, 0f, dt * 0.4f);
            // danger adds energy, never dread
            energy.volume = Mathf.MoveTowards(energy.volume, Mathf.Clamp01((G.Adrenaline.Level - 0.25f) * 1.3f) * 0.35f * duck, dt * 0.6f);
            if (energy.isPlaying && on.isPlaying && Mathf.Abs(energy.timeSamples - on.timeSamples % energy.clip.samples) > Rate / 10) energy.timeSamples = on.timeSamples % energy.clip.samples;
            float pitch = G.Adrenaline.Slipping ? 0.85f : 1f;
            musicA.pitch = musicB.pitch = energy.pitch = Mathf.Lerp(musicA.pitch, pitch, dt * 4f);

            // soft footsteps
            if (G.Running && G.Motor.Grounded)
            {
                var p = G.Motor.transform.position;
                stepDist += Vector3.Distance(p, lastPos);
                float stride = G.Motor.Sprinting ? 2.4f : G.Motor.Crouching ? 1.2f : 1.8f;
                if (stepDist > stride) { stepDist = 0; sfx.pitch = Random.Range(0.85f, 1.15f); sfx.PlayOneShot(StepClip, G.Motor.Crouching ? 0.1f : 0.22f); sfx.pitch = 1f; }
            }
            lastPos = G.Motor.transform.position;
        }
    }
}
