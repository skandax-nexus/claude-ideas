// Adrenaline model (pure logic, tuned in tests). Threat and near-misses push
// the meter up; calm lets it settle. A full meter unlocks a SLIP: a shift
// performed in bullet-time. Presentation (heartbeat, FOV, bloom) reads Level.
using System;

namespace AfterZero.Core
{
    public class Adrenaline
    {
        public float Level { get; private set; }      // 0..1
        public float SlipCharge { get; private set; } // 0..1, fills while Level is high
        public float SlipTimeLeft { get; private set; }
        public bool Slipping => SlipTimeLeft > 0f;

        public float RiseRate = 0.9f, DecayRate = 0.18f, ChargeRate = 0.35f;
        public float SlipDuration = 2.5f;     // real seconds
        public float SlipTimeScale = 0.35f;   // world speed while slipping

        public event Action SlipStarted, SlipEnded, NearMiss;

        /// <param name="threat">0..1 from danger sources (chase, proximity, collapse)</param>
        public void Tick(float dt, float threat)
        {
            threat = Math.Clamp(threat, 0f, 1f);
            if (threat > Level) Level = Math.Min(threat, Level + RiseRate * dt);
            else Level = Math.Max(threat, Level - DecayRate * dt);
            if (Level > 0.6f) SlipCharge = Math.Min(1f, SlipCharge + ChargeRate * dt * Level);
            if (SlipTimeLeft > 0f)
            {
                SlipTimeLeft -= dt;
                if (SlipTimeLeft <= 0f) { SlipTimeLeft = 0f; SlipEnded?.Invoke(); }
            }
        }

        public void Spike(float amount)
        {
            Level = Math.Min(1f, Level + amount);
            NearMiss?.Invoke();
        }

        public bool CanSlip => SlipCharge >= 1f && !Slipping;

        public bool TrySlip()
        {
            if (!CanSlip) return false;
            SlipCharge = 0f;
            SlipTimeLeft = SlipDuration;
            SlipStarted?.Invoke();
            return true;
        }

        /// Heart rate for audio, 60 calm .. 170 terrified.
        public float HeartRate => 60f + Level * 110f;
        /// Multiplier on world time (the player moves at full speed during a slip).
        public float TimeScale => Slipping ? SlipTimeScale : 1f;
    }
}
