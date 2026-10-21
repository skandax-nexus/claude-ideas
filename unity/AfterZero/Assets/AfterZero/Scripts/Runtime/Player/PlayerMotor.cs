// First-person movement tuned for feel: acceleration curves, coyote time,
// jump buffering, sprint, crouch-slide, air control, and gravity that can
// point down, up or nowhere. The CharacterController's capsule is always
// world-vertical, so walking on ceilings needs no special collision code.
using UnityEngine;

namespace AfterZero.Runtime
{
    [RequireComponent(typeof(CharacterController))]
    public class PlayerMotor : MonoBehaviour
    {
        [Header("Speeds")]
        public float WalkSpeed = 4.2f, SprintSpeed = 7.0f, CrouchSpeed = 2.2f, SlideSpeed = 9.5f;
        [Header("Feel")]
        public float GroundAccel = 60f, GroundDecel = 45f, AirAccel = 14f;
        public float JumpHeight = 1.25f, Gravity = 24f, MaxFall = 30f;
        public float CoyoteTime = 0.12f, JumpBuffer = 0.15f;
        public float FloatY = 1.25f;

        public CharacterController CC { get; private set; }
        public Vector3 Velocity;
        public int GravityDir = -1;        // -1 down, +1 up, 0 none
        public bool Grounded { get; private set; }
        public bool Sprinting { get; private set; }
        public bool Crouching { get; private set; }
        public bool Sliding => slideTime > 0;
        public float Speed => new Vector2(Velocity.x, Velocity.z).magnitude;
        public event System.Action<float> Landed; // impact speed

        float coyote, jumpBuffered, slideTime;
        bool wasGrounded;
        const float StandHeight = 1.7f, CrouchHeight = 1.0f;

        void Awake()
        {
            CC = GetComponent<CharacterController>();
            CC.height = StandHeight;
            CC.radius = 0.32f;
            CC.stepOffset = 0.35f;
            CC.slopeLimit = 50f;
            CC.skinWidth = 0.04f;
            CC.minMoveDistance = 0f;
        }

        public void Teleport(Vector3 pos)
        {
            CC.enabled = false;
            transform.position = pos;
            CC.enabled = true;
            Velocity = Vector3.zero;
        }

        public void RequestJump() => jumpBuffered = JumpBuffer;

        public void ToggleCrouch()
        {
            if (Crouching) { TryStand(); return; }
            Crouching = true;
            if (Sprinting && Grounded && Speed > WalkSpeed) slideTime = 0.75f;
        }

        void TryStand()
        {
            // only stand up if there is room overhead (in the current "up")
            float up = GravityDir == 1 ? -1 : 1;
            if (!Physics.SphereCast(transform.position, CC.radius * 0.9f, Vector3.up * up, out _, StandHeight - CrouchHeight + 0.1f, ~(1 << 2), QueryTriggerInteraction.Ignore))
                Crouching = false;
        }

        /// <param name="wish">desired direction on the horizontal plane (world space, length 0..1)</param>
        public void Tick(float dt, Vector3 wish, bool sprint)
        {
            if (sprint && Crouching && !Sliding) TryStand();
            Sprinting = sprint && !Crouching && wish.sqrMagnitude > 0.25f;

            float targetH = Crouching ? CrouchHeight : StandHeight;
            CC.height = Mathf.MoveTowards(CC.height, targetH, dt * 6f);
            CC.center = new Vector3(0, GravityDir == 1 ? (StandHeight - CC.height) / 2 : -(StandHeight - CC.height) / 2, 0);

            float speed = Sliding ? SlideSpeed * Mathf.Clamp01(slideTime / 0.75f) + CrouchSpeed : Crouching ? CrouchSpeed : Sprinting ? SprintSpeed : WalkSpeed;
            if (slideTime > 0) slideTime -= dt;

            Vector3 target = wish * speed;
            Vector3 h = new Vector3(Velocity.x, 0, Velocity.z);
            float accel = GravityDir == 0 ? AirAccel * 0.3f : Grounded ? (target.sqrMagnitude > h.sqrMagnitude ? GroundAccel : GroundDecel) : AirAccel;
            if (Sliding) accel = 6f;
            h = Vector3.MoveTowards(h, target, accel * dt);

            // vertical
            float vy = Velocity.y;
            if (GravityDir == 0)
            {
                vy += (FloatY - transform.position.y) * 0.9f * dt;
                vy *= Mathf.Pow(0.6f, dt);
                if (jumpBuffered > 0) { vy += 2.2f; jumpBuffered = 0; }
            }
            else
            {
                vy += GravityDir * Gravity * dt;
                vy = Mathf.Clamp(vy, -MaxFall, MaxFall);
                if (jumpBuffered > 0 && (Grounded || coyote > 0))
                {
                    vy = -GravityDir * Mathf.Sqrt(2f * Gravity * JumpHeight);
                    jumpBuffered = 0; coyote = 0;
                    if (Crouching) TryStand();
                }
            }
            jumpBuffered -= dt;

            Velocity = new Vector3(h.x, vy, h.z);
            var flags = CC.Move(Velocity * dt);

            bool hitDown = (flags & CollisionFlags.Below) != 0, hitUp = (flags & CollisionFlags.Above) != 0;
            Grounded = GravityDir == -1 ? hitDown : GravityDir == 1 && hitUp;
            if ((hitDown && Velocity.y < 0) || (hitUp && Velocity.y > 0))
            {
                if (Grounded && !wasGrounded) Landed?.Invoke(Mathf.Abs(Velocity.y));
                Velocity.y = Grounded ? GravityDir * 1.5f : 0f; // keep a little stick to the "floor"
            }
            if (Grounded) coyote = CoyoteTime; else coyote -= dt;
            wasGrounded = Grounded;
        }
    }
}
