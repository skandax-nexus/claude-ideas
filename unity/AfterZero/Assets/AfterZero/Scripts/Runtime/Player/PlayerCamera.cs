// Camera with smoothed look, head-bob, landing dip, FOV kick, trauma shake
// and a barrel-roll around the facing direction when gravity flips (or an
// instant fade-cut for players who prefer it).
using UnityEngine;

namespace AfterZero.Runtime
{
    public class PlayerCamera : MonoBehaviour
    {
        public Camera Cam { get; private set; }
        public Vector3 Heading = Vector3.forward;  // horizontal facing
        public Vector3 Up = Vector3.up;            // animated camera up
        public float Pitch;                         // degrees
        public float BaseFov = 74f;
        public float RollSpeed = 220f;             // deg/s
        public bool InstantFlip;

        float bob, dip, dipVel, trauma, fovKick;
        Vector2 smoothLook;
        const float EyeHeight = 0.68f;

        public void Init(Camera cam)
        {
            Cam = cam;
            cam.fieldOfView = BaseFov;
            cam.nearClipPlane = 0.05f;
            cam.farClipPlane = 600f;
        }

        public void SetYaw(float yawDeg)
        {
            Heading = Quaternion.Euler(0, yawDeg, 0) * Vector3.forward;
            Pitch = 0;
        }

        public void Look(Vector2 deltaDeg, float smoothing)
        {
            smoothLook = smoothing <= 0 ? deltaDeg : Vector2.Lerp(smoothLook, deltaDeg, 1f - Mathf.Exp(-Time.unscaledDeltaTime / Mathf.Max(0.001f, smoothing)));
            var d = smoothing <= 0 ? deltaDeg : smoothLook;
            Heading = Quaternion.AngleAxis(d.x, Up) * Heading;
            Heading.y = 0;
            if (Heading.sqrMagnitude < 1e-5f) Heading = Vector3.forward;
            Heading.Normalize();
            Pitch = Mathf.Clamp(Pitch + d.y, -85f, 85f);
        }

        public Vector3 Right => Vector3.Cross(Up, Heading).normalized;
        public Vector3 Forward => (Quaternion.AngleAxis(-Pitch, Right) * Heading).normalized;

        public void AddTrauma(float t) => trauma = Mathf.Clamp01(trauma + t);
        public void Land(float impact) => dipVel -= Mathf.Clamp(impact * 0.04f, 0, 0.6f);

        public void Tick(PlayerMotor motor, float dt, float adrenaline)
        {
            // roll the camera "up" toward gravity's up, rotating about the heading
            Vector3 target = motor.GravityDir == 1 ? Vector3.down : motor.GravityDir == -1 ? Vector3.up : Up;
            if (InstantFlip) Up = target;
            else
            {
                float ang = Vector3.Angle(Up, target);
                if (ang > 0.01f)
                {
                    var axis = Vector3.Cross(Up, target);
                    float sign = axis.sqrMagnitude < 1e-6f || Vector3.Dot(axis, Heading) >= 0 ? 1f : -1f;
                    float step = Mathf.Min(ang, RollSpeed * dt * Mathf.Lerp(0.6f, 1.4f, Mathf.Sin(Mathf.Clamp01(ang / 180f) * Mathf.PI)));
                    Up = Quaternion.AngleAxis(sign * step, Heading) * Up;
                    if (ang - step < 0.05f) Up = target;
                }
            }
            Up = (Up - Vector3.Dot(Up, Heading) * Heading).normalized;

            // head bob, landing dip (spring), FOV kick
            if (motor.Grounded) bob += motor.Speed * dt * 1.9f;
            dipVel += (-dip * 90f - dipVel * 12f) * dt;
            dip += dipVel * dt;
            float targetKick = (motor.Sprinting ? 8f : 0f) + (motor.Sliding ? 6f : 0f) + adrenaline * 6f;
            fovKick = Mathf.Lerp(fovKick, targetKick, dt * 4f);
            Cam.fieldOfView = BaseFov + fovKick;

            float bobY = motor.Grounded ? Mathf.Sin(bob * 2f) * 0.035f * Mathf.Clamp01(motor.Speed / 4f) : 0f;
            float bobX = motor.Grounded ? Mathf.Cos(bob) * 0.025f * Mathf.Clamp01(motor.Speed / 4f) : 0f;
            float crouch = motor.Crouching ? -0.55f : 0f;

            // trauma shake (squared for feel)
            trauma = Mathf.Max(0, trauma - dt * 1.2f);
            float sh = trauma * trauma;
            float t = Time.unscaledTime * 22f;
            var shake = new Vector3((Mathf.PerlinNoise(t, 0) - 0.5f), (Mathf.PerlinNoise(0, t) - 0.5f), (Mathf.PerlinNoise(t, t) - 0.5f)) * sh * 3f;

            Vector3 fwd = Forward;
            Vector3 camUp = Quaternion.AngleAxis(-Pitch, Right) * Up;
            var rot = Quaternion.LookRotation(fwd, camUp) * Quaternion.Euler(shake.x, shake.y, shake.z * 2f);
            transform.SetPositionAndRotation(
                motor.transform.position + Up * (EyeHeight + bobY + dip + crouch) + Right * bobX,
                rot);
        }
    }
}
