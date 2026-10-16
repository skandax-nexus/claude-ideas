// Procedural audio - no audio files needed to play. Every sound is
// synthesised into AudioClips at startup: a drone per reality state, room
// ambiences, a heartbeat that follows adrenaline, stingers, footsteps.
// Replace any clip by assigning one in the inspector.
using AfterZero.Core;
using UnityEngine;

namespace AfterZero.Runtime
{
    public class AudioDirector : MonoBehaviour
    {
        const int Rate = 22050;
        GameManager G;
        AudioSource droneA, droneB, ambience, heart, alarm, undertow, sfx;
        AudioClip dronePhysical, droneInverted, droneEcho, heartbeat, wind, hum, alarmClip, rumble;
        bool aActive = true;
        float heartTimer, stepDist, duck = 1f;
        Vector3 lastPos;

        void Awake()
        {
            G = GetComponent<GameManager>();
            dronePhysical = Drone("physical", 55f, 82.4f, 0.35f);
            droneInverted = Drone("inverted", 46.2f, 69.3f, 0.2f);
            droneEcho = Drone("echo", 65.4f, 98f, 0.6f);
            heartbeat = Heartbeat();
            wind = Noise("wind", 4f, 0.25f, 0.985f);
            hum = Drone("hum", 110f, 165f, 0.15f);
            alarmClip = Alarm();
            rumble = Noise("rumble", 3f, 0.6f, 0.995f);
            droneA = Src(true, 0.35f); droneB = Src(true, 0f);
            ambience = Src(true, 0.25f);
            heart = Src(false, 0.8f);
            alarm = Src(true, 0f);
            undertow = Src(true, 0f);
            sfx = Src(false, 1f);
            droneA.clip = dronePhysical; droneA.Play();
            alarm.clip = alarmClip;
            undertow.clip = rumble;
        }

        AudioSource Src(bool loop, float vol)
        {
            var s = gameObject.AddComponent<AudioSource>();
            s.loop = loop; s.volume = vol; s.playOnAwake = false; s.spatialBlend = 0; s.ignoreListenerPause = false;
            return s;
        }

        // --- synthesis -----------------------------------------------------------------
        static AudioClip Drone(string name, float f1, float f2, float bright)
        {
            int n = Rate * 4;
            var d = new float[n];
            float lp = 0;
            for (int i = 0; i < n; i++)
            {
                float t = i / (float)Rate;
                float s = Saw(t * f1) * 0.5f + Saw(t * f1 * 1.004f) * 0.4f + Saw(t * f2) * 0.3f + Mathf.Sin(t * f1 * 4 * Mathf.PI * 2) * 0.08f;
                lp += (s - lp) * (0.02f + bright * 0.08f);
                float swell = 0.8f + 0.2f * Mathf.Sin(t * Mathf.PI * 0.5f);
                d[i] = lp * 0.35f * swell;
            }
            return Clip(name, d, true);
        }

        static float Saw(float p) => 2f * (p - Mathf.Floor(p + 0.5f));

        static AudioClip Noise(string name, float sec, float vol, float smooth)
        {
            int n = (int)(Rate * sec);
            var d = new float[n];
            var rng = new System.Random(name.GetHashCode());
            float lp = 0, lp2 = 0;
            for (int i = 0; i < n; i++)
            {
                float w = (float)rng.NextDouble() * 2 - 1;
                lp = lp * smooth + w * (1 - smooth);
                lp2 = lp2 * 0.9f + lp * 0.1f;
                float t = i / (float)n;
                d[i] = lp2 * vol * 8f * (0.7f + 0.3f * Mathf.Sin(t * Mathf.PI * 2 * 2));
            }
            return Clip(name, d, true);
        }

        static AudioClip Heartbeat()
        {
            int n = (int)(Rate * 0.6f);
            var d = new float[n];
            for (int i = 0; i < n; i++)
            {
                float t = i / (float)Rate;
                float lub = t < 0.12f ? Mathf.Sin(t * 55 * Mathf.PI * 2) * Mathf.Exp(-t * 30) : 0;
                float t2 = t - 0.22f;
                float dub = t2 > 0 && t2 < 0.12f ? Mathf.Sin(t2 * 48 * Mathf.PI * 2) * Mathf.Exp(-t2 * 34) * 0.7f : 0;
                d[i] = (lub + dub) * 0.9f;
            }
            return Clip("heart", d, false);
        }

        static AudioClip Alarm()
        {
            int n = Rate * 2;
            var d = new float[n];
            for (int i = 0; i < n; i++)
            {
                float t = i / (float)Rate;
                float f = t % 1f < 0.5f ? 620 : 470;
                d[i] = Mathf.Sign(Mathf.Sin(t * f * Mathf.PI * 2)) * 0.08f * (t % 0.5f < 0.42f ? 1 : 0);
            }
            return Clip("alarm", d, true);
        }

        static AudioClip Tone(float f0, float f1, float dur, int wave, float vol)
        {
            int n = (int)(Rate * dur);
            var d = new float[n];
            float ph = 0;
            for (int i = 0; i < n; i++)
            {
                float k = i / (float)n;
                float f = Mathf.Lerp(f0, f1, k * k);
                ph += f / Rate;
                float s = wave == 0 ? Mathf.Sin(ph * Mathf.PI * 2) : wave == 1 ? Saw(ph) : Mathf.Sign(Mathf.Sin(ph * Mathf.PI * 2));
                d[i] = s * vol * Mathf.Min(1, k * 40) * (1 - k);
            }
            return Clip("tone", d, false);
        }

        static AudioClip Thump(float f, float dur, float noise)
        {
            int n = (int)(Rate * dur);
            var d = new float[n];
            var rng = new System.Random((int)(f * 100));
            for (int i = 0; i < n; i++)
            {
                float t = i / (float)Rate;
                float env = Mathf.Exp(-t * 18f);
                d[i] = (Mathf.Sin(t * f * Mathf.PI * 2) * (1 - noise) + ((float)rng.NextDouble() * 2 - 1) * noise) * env * 0.6f;
            }
            return Clip("thump", d, false);
        }

        static AudioClip Clip(string name, float[] d, bool loop)
        {
            var c = AudioClip.Create(name, d.Length, 1, Rate, false);
            c.SetData(d, 0);
            return c;
        }

        // cached one-shots
        AudioClip _sweepUp, _sweepDown, _deny, _land, _step, _sting, _cry, _slipIn, _slipOut;
        AudioClip SweepUp => _sweepUp ? _sweepUp : _sweepUp = Tone(80, 900, 0.5f, 1, 0.25f);
        AudioClip SweepDown => _sweepDown ? _sweepDown : _sweepDown = Tone(900, 60, 0.5f, 1, 0.25f);
        AudioClip DenyClip => _deny ? _deny : _deny = Tone(160, 120, 0.25f, 2, 0.12f);
        AudioClip LandClip => _land ? _land : _land = Thump(60, 0.35f, 0.4f);
        AudioClip StepClip => _step ? _step : _step = Thump(140, 0.09f, 0.85f);
        AudioClip StingClip => _sting ? _sting : _sting = Tone(70, 40, 1.2f, 1, 0.5f);
        AudioClip CryClip => _cry ? _cry : _cry = Tone(1200, 300, 0.9f, 0, 0.18f);
        AudioClip SlipIn => _slipIn ? _slipIn : _slipIn = Tone(1400, 90, 0.7f, 0, 0.3f);
        AudioClip SlipOut => _slipOut ? _slipOut : _slipOut = Tone(90, 900, 0.5f, 0, 0.2f);

        // --- API ------------------------------------------------------------------------------
        public void OnShift(string to)
        {
            Crossfade(to == RealityStates.Echo ? droneEcho : to == RealityStates.Inverted ? droneInverted : dronePhysical);
            sfx.PlayOneShot(to == RealityStates.Physical ? SweepDown : SweepUp, 0.8f);
        }

        public void OnRoom(RoomDef r, string state)
        {
            Crossfade(state == RealityStates.Echo ? droneEcho : state == RealityStates.Inverted ? droneInverted : dronePhysical);
            var clip = r.Ambience == "wind" || r.Ambience == "storm" ? wind : r.Ambience == "warm" ? hum : r.Ambience == "dread" ? rumble : hum;
            if (ambience.clip != clip) { ambience.clip = clip; ambience.Play(); }
            ambience.volume = r.Ambience == "storm" ? 0.5f : r.Ambience == "warm" ? 0.12f : 0.22f;
        }

        void Crossfade(AudioClip c)
        {
            var from = aActive ? droneA : droneB;
            var to = aActive ? droneB : droneA;
            if (from.clip == c) return;
            to.clip = c;
            to.Play();
            aActive = !aActive;
        }

        public void Sweep(bool up) => sfx.PlayOneShot(up ? SweepUp : SweepDown);
        public void Deny() => sfx.PlayOneShot(DenyClip, 0.7f);
        public void Blip(float f, float dur) => sfx.PlayOneShot(Tone(f, f, dur, 2, 0.06f));
        public void Chime(float pitch) { sfx.pitch = pitch; sfx.PlayOneShot(Tone(880, 1760, 0.35f, 0, 0.2f)); sfx.pitch = 1; }
        public void Pickup() => sfx.PlayOneShot(Tone(660, 1320, 0.15f, 0, 0.2f));
        public void Memory() => sfx.PlayOneShot(Tone(523, 784, 0.9f, 0, 0.22f));
        public void Land(float v) => sfx.PlayOneShot(LandClip, Mathf.Clamp01(v / 14f));
        public void Sting() => sfx.PlayOneShot(StingClip, 1f);
        public void ObserverCry() => sfx.PlayOneShot(CryClip, 0.6f);
        public void Slip(bool on) => sfx.PlayOneShot(on ? SlipIn : SlipOut, 0.8f);
        public void Voice(string who) { if (who != "NONE" && who != "OBSERVER") sfx.PlayOneShot(Tone(who == "TICK" ? 1400 : 300, who == "TICK" ? 1800 : 260, 0.05f, 2, 0.03f)); }
        public void Alarm(bool on) { if (on && !alarm.isPlaying) alarm.Play(); alarm.volume = on ? 0.35f : 0f; }
        public void Undertow(bool on) { if (on && !undertow.isPlaying) undertow.Play(); undertow.volume = on ? 0.7f : 0f; }
        public void Duck(bool on) => duck = on ? 0.35f : 1f;

        void Update()
        {
            if (G == null || G.Motor == null) return;
            float dt = Time.unscaledDeltaTime;
            var on = aActive ? droneA : droneB;
            var off = aActive ? droneB : droneA;
            on.volume = Mathf.MoveTowards(on.volume, 0.35f * duck, dt * 0.5f);
            off.volume = Mathf.MoveTowards(off.volume, 0f, dt * 0.5f);
            float pitch = G.Adrenaline.Slipping ? 0.6f : 1f;
            droneA.pitch = droneB.pitch = ambience.pitch = Mathf.Lerp(droneA.pitch, pitch, dt * 4f);

            // heartbeat follows adrenaline
            float level = G.Adrenaline.Level;
            if (level > 0.2f && G.Running)
            {
                heartTimer -= dt;
                if (heartTimer <= 0) { heart.volume = Mathf.Clamp01((level - 0.2f) * 1.4f) * duck; heart.PlayOneShot(heartbeat); heartTimer = 60f / G.Adrenaline.HeartRate; }
            }

            // footsteps
            if (G.Running && G.Motor.Grounded)
            {
                var p = G.Motor.transform.position;
                stepDist += Vector3.Distance(p, lastPos);
                float stride = G.Motor.Sprinting ? 2.4f : G.Motor.Crouching ? 1.2f : 1.8f;
                if (stepDist > stride) { stepDist = 0; sfx.pitch = Random.Range(0.85f, 1.15f); sfx.PlayOneShot(StepClip, G.Motor.Crouching ? 0.15f : G.Motor.Sprinting ? 0.5f : 0.3f); sfx.pitch = 1f; }
            }
            lastPos = G.Motor.transform.position;
        }
    }
}
