// Unified input: keyboard/mouse, gamepad (legacy axes) and touch.
// Uses the legacy Input Manager so it works in any project without setup
// (Project Settings > Player > Active Input Handling: "Both" or "Input Manager").
using System.Collections.Generic;
using UnityEngine;

namespace AfterZero.Runtime
{
    public enum Act { Use, Shift, Slip, Jump, Laws, Journal, Hint, Pause, SetPhysical, SetInverted, SetEcho, Crouch }

    public class InputRouter
    {
        public Vector2 Move;          // x strafe, y forward
        public Vector2 Look;          // degrees this frame
        public bool Sprint, CrouchHeld;
        readonly Queue<Act> actions = new Queue<Act>();
        public bool IsTouch => Input.touchSupported && Application.isMobilePlatform;

        // touch state (driven by MobileControls)
        public Vector2 TouchStick;
        public Vector2 TouchLook;
        public bool TouchSprint;

        public void Push(Act a) => actions.Enqueue(a);
        public bool Next(out Act a) { if (actions.Count > 0) { a = actions.Dequeue(); return true; } a = default; return false; }
        public void Clear() => actions.Clear();

        public void Poll(Settings s, bool cursorLocked)
        {
            float f = 0, x = 0;
            if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow)) f += 1;
            if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow)) f -= 1;
            if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) x += 1;
            if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) x -= 1;
            Move = new Vector2(x, f);
            Sprint = Input.GetKey(KeyCode.LeftShift) || Input.GetKey(KeyCode.RightShift);
            CrouchHeld = Input.GetKey(KeyCode.LeftControl) || Input.GetKey(KeyCode.C);
            Look = Vector2.zero;
            if (cursorLocked)
                Look = new Vector2(Input.GetAxisRaw("Mouse X"), Input.GetAxisRaw("Mouse Y") * (s.InvertY ? -1 : 1)) * s.MouseSensitivity;

            if (TouchStick.sqrMagnitude > 0.001f)
            {
                Move = TouchStick;
                Sprint = TouchSprint || TouchStick.magnitude > 0.95f;
            }
            if (TouchLook.sqrMagnitude > 0)
            {
                Look += TouchLook * s.TouchSensitivity * (s.InvertY ? new Vector2(1, -1) : Vector2.one);
                TouchLook = Vector2.zero;
            }

            if (Input.GetKeyDown(KeyCode.E) || Input.GetKeyDown(KeyCode.F) || (cursorLocked && Input.GetMouseButtonDown(0))) Push(Act.Use);
            if (Input.GetKeyDown(KeyCode.Q) || (cursorLocked && Input.GetMouseButtonDown(1))) Push(Act.Shift);
            if (Input.GetKeyDown(KeyCode.V) || (cursorLocked && Input.GetMouseButtonDown(2))) Push(Act.Slip);
            if (Input.GetKeyDown(KeyCode.Space)) Push(Act.Jump);
            if (Input.GetKeyDown(KeyCode.LeftControl) || Input.GetKeyDown(KeyCode.C)) Push(Act.Crouch);
            if (Input.GetKeyDown(KeyCode.L) || Input.GetKeyDown(KeyCode.Tab)) Push(Act.Laws);
            if (Input.GetKeyDown(KeyCode.J)) Push(Act.Journal);
            if (Input.GetKeyDown(KeyCode.H)) Push(Act.Hint);
            if (Input.GetKeyDown(KeyCode.Escape) || Input.GetKeyDown(KeyCode.P)) Push(Act.Pause);
            if (Input.GetKeyDown(KeyCode.Alpha1)) Push(Act.SetPhysical);
            if (Input.GetKeyDown(KeyCode.Alpha2)) Push(Act.SetInverted);
            if (Input.GetKeyDown(KeyCode.Alpha3)) Push(Act.SetEcho);
        }
    }
}
