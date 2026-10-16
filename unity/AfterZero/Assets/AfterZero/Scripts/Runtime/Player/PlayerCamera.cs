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
        public float BaseFov = 62f;
        public float RollSpeed = 220f;             // deg/s
        public bool InstantFlip;
        [Header("Third person")]
        public bool ThirdPerson = true;
        public float Distance = 3.6f, Shoulder = 0.5f;
        Vector3 camPos; bool hasCamPos;
        public float CameraToHead { get; private set; } = 99f;

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
            if (!ThirdPerson)
            {
                transform.SetPositionAndRotation(motor.transform.position + Up * (EyeHeight + bobY + dip + crouch) + Right * bobX, rot);
                return;
            }
            // over-the-shoulder follow camera that never clips through walls
            var head = motor.transform.position + Up * (0.6f + crouch * 0.5f);
            var desired = head - fwd * Distance + camUp * 0.35f + Right * Shoulder;
            var dir = desired - head;
            float len = dir.magnitude;
            dir /= len;
            float dist = len;
            if (Physics.SphereCast(head, 0.22f, dir, out var hit, len, ~(1 << 2), QueryTriggerInteraction.Ignore)) dist = Mathf.Max(0.35f, hit.distance - 0.05f);
            if (dist < 1.8f)
            {
                // cramped: rise and look down over the shoulder instead
                var alt = (-fwd * 2f + camUp * 1.3f + Right * 0.3f);
                float altLen = alt.magnitude;
                alt /= altLen;
                float altDist = altLen;
                if (Physics.SphereCast(head, 0.22f, alt, out var h2, altLen, ~(1 << 2), QueryTriggerInteraction.Ignore)) altDist = Mathf.Max(0.35f, h2.distance - 0.05f);
                if (altDist > dist + 0.3f) { dir = alt; dist = altDist; }
            }
            var camTarget = head + dir * dist;
            if (!hasCamPos || (camPos - camTarget).sqrMagnitude > 36f) { camPos = camTarget; hasCamPos = true; }
            else camPos = Vector3.Lerp(camPos, camTarget, 1f - Mathf.Exp(-dt * 14f));
            if ((camPos - head).magnitude > dist + 0.05f) camPos = camTarget;
            CameraToHead = (camPos - head).magnitude;
            var aim = head + fwd * 6f;
            transform.SetPositionAndRotation(camPos, Quaternion.LookRotation(aim - camPos, camUp) * Quaternion.Euler(shake.x, shake.y, shake.z * 2f));
        }
    }
}
