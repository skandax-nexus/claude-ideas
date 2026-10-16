// The player's visible body for the third-person camera: faces the way you
// move, stands on whichever surface gravity points at, and fades out when
// the camera is pressed up against it.
using UnityEngine;

namespace AfterZero.Runtime
{
    public class PlayerAvatar : MonoBehaviour
    {
        GameManager G;
        Humanoid.Rig rig;
        Renderer[] renderers;
        Vector3 facing = Vector3.forward;
        public Transform Hand { get; private set; }

        public static PlayerAvatar Create(GameManager g)
        {
            var go = new GameObject("PlayerAvatar");
            var a = go.AddComponent<PlayerAvatar>();
            a.G = g;
            var themed = g.Theme != null ? g.Theme.Prop("player") : null;
            if (themed != null) Instantiate(themed, go.transform, false);
            else
            {
                var body = Humanoid.Build("#ff8a6a", Humanoid.Style.Solid, 1.75f);
                body.transform.SetParent(go.transform, false);
                a.rig = body.GetComponent<Humanoid.Rig>();
                var hand = new GameObject("Hand");
                hand.transform.SetParent(a.rig.ArmL, false);
                hand.transform.localPosition = new Vector3(0, -0.66f, 0.08f);
                a.Hand = hand.transform;
            }
            if (a.Hand == null) a.Hand = go.transform;
            a.renderers = go.GetComponentsInChildren<Renderer>();
            foreach (var r in a.renderers) r.gameObject.layer = 2;
            return a;
        }

        void LateUpdate()
        {
            if (G == null || G.Motor == null) return;
            var m = G.Motor;
            var up = G.Cam.Up;
            var v = m.Velocity; v.y = 0;
            if (v.sqrMagnitude > 0.09f) facing = Vector3.Slerp(facing, v.normalized, 1f - Mathf.Exp(-Time.deltaTime * 10f));
            var f = Vector3.ProjectOnPlane(facing, up);
            if (f.sqrMagnitude < 1e-4f) f = G.Cam.Heading;
            transform.SetPositionAndRotation(m.transform.position - up * 0.85f, Quaternion.LookRotation(f.normalized, up));
            if (rig) rig.Pose(Time.time, m.Speed / 4f, 0);
            bool show = G.Cam.ThirdPerson && G.Cam.CameraToHead > 0.9f;
            foreach (var r in renderers) if (r) r.enabled = show;
        }
    }
}
