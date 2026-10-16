// Post-processing (URP): ACES tonemapping, bloom on emissives, per-state
// colour grading, film grain, and pulses of chromatic aberration and lens
// distortion on shifts and slips. Adrenaline tightens the vignette.
// Compiles to a no-op when URP isn't installed (AZ_URP is defined by the
// runtime asmdef's versionDefines).
using AfterZero.Core;
using UnityEngine;
#if AZ_URP
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
#endif

namespace AfterZero.Runtime
{
    public class PostFX : MonoBehaviour
    {
        GameManager G;
        float pulse;
        string state = RealityStates.Physical;
#if AZ_URP
        Volume volume;
        Bloom bloom;
        Vignette vignette;
        ChromaticAberration chroma;
        ColorAdjustments color;
        LensDistortion lens;
        FilmGrain grain;
#endif

        public void Init(Camera cam)
        {
            G = GetComponent<GameManager>();
#if AZ_URP
            var data = cam.GetUniversalAdditionalCameraData();
            data.renderPostProcessing = true;
            data.antialiasing = G.Settings.Quality >= 1 ? AntialiasingMode.SubpixelMorphologicalAntiAliasing : AntialiasingMode.FastApproximateAntialiasing;
            var go = new GameObject("PostFX Volume");
            go.transform.SetParent(transform, false);
            volume = go.AddComponent<Volume>();
            volume.isGlobal = true;
            var profile = ScriptableObject.CreateInstance<VolumeProfile>();
            volume.profile = profile;
            var tone = profile.Add<Tonemapping>(true); tone.mode.Override(TonemappingMode.ACES);
            bloom = profile.Add<Bloom>(true); bloom.intensity.Override(0.9f); bloom.threshold.Override(0.95f); bloom.scatter.Override(0.65f);
            vignette = profile.Add<Vignette>(true); vignette.intensity.Override(0.3f); vignette.smoothness.Override(0.45f);
            chroma = profile.Add<ChromaticAberration>(true); chroma.intensity.Override(0.05f);
            color = profile.Add<ColorAdjustments>(true); color.postExposure.Override(0.2f); color.contrast.Override(12f); color.saturation.Override(0f);
            lens = profile.Add<LensDistortion>(true); lens.intensity.Override(0f);
            grain = profile.Add<FilmGrain>(true); grain.intensity.Override(G.Settings.Quality == 0 ? 0f : 0.18f); grain.type.Override(FilmGrainLookup.Thin1);
#endif
        }

        public void OnShift(string to) { state = to; Pulse(0.6f); }
        public void Pulse(float amount) { if (G == null || !G.Settings.ReduceFlashes) pulse = Mathf.Max(pulse, amount); }

        void Update()
        {
            if (G == null) return;
            float dt = Time.unscaledDeltaTime;
            pulse = Mathf.Max(0, pulse - dt * 1.6f);
#if AZ_URP
            if (volume == null) return;
            float adr = G.Adrenaline.Level;
            bool slip = G.Adrenaline.Slipping;
            Color tint = state == RealityStates.Echo ? new Color(0.75f, 1f, 1.05f) : state == RealityStates.Inverted ? new Color(1.08f, 0.85f, 0.98f) : Color.white;
            if (slip) tint = Color.Lerp(tint, new Color(1.1f, 0.95f, 0.7f), 0.6f);
            color.colorFilter.Override(Color.Lerp(color.colorFilter.value, tint, dt * 4f));
            color.saturation.Override(Mathf.Lerp(color.saturation.value, state == RealityStates.Echo ? -35f : slip ? -20f : adr * 15f, dt * 3f));
            vignette.intensity.Override(0.28f + adr * 0.22f + (slip ? 0.15f : 0f));
            vignette.color.Override(state == RealityStates.Inverted ? new Color(0.3f, 0f, 0.15f) : adr > 0.6f ? new Color(0.35f, 0f, 0f) : Color.black);
            chroma.intensity.Override(0.05f + pulse * 0.7f + adr * 0.25f + (slip ? 0.35f : 0f));
            lens.intensity.Override(-pulse * 0.35f + (slip ? -0.18f : 0f));
            bloom.intensity.Override(0.9f + pulse * 1.5f + (G.Facts.Has("machine_activated") && G.Room == "lab" ? 0.4f : 0f));
#endif
        }
    }

    /// Fog, ambient light and alarms, tinted by room and reality state.
    public class Atmosphere : MonoBehaviour
    {
        GameManager G;
        Color fogTarget, ambientTarget;
        float densityTarget = 0.02f;
        bool alarm;

        void Awake()
        {
            G = GetComponent<GameManager>();
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
        }

        public void OnRoom(RoomDef r) { densityTarget = r.FogDensity; OnShift(); }

        public void OnShift()
        {
            if (G == null || G.Room == null) return;
            var r = G.BP.Rooms[G.Room];
            var tint = Palette.Hex(r.Tint);
            var s = G.Engine.State(G.Room);
            Color baseFog = s == RealityStates.Echo ? Palette.Hex("#02161c") : s == RealityStates.Inverted ? Palette.Hex("#180812") : Palette.Hex("#0a0e14");
            fogTarget = Color.Lerp(baseFog, tint * 0.15f, 0.25f);
            ambientTarget = Color.Lerp(s == RealityStates.Echo ? Palette.Hex("#1a4a58") : s == RealityStates.Inverted ? Palette.Hex("#4a2038") : Palette.Hex("#3a4250"), tint * 0.4f, 0.3f);
            if (s == RealityStates.Echo) densityTarget = r.FogDensity * 1.6f; else densityTarget = r.FogDensity;
            if (G.Facts.Has("machine_activated") && (G.Room == "lab" || G.Room == "core")) densityTarget = 0.006f;
        }

        public void Alarm(bool on) => alarm = on;

        void Update()
        {
            float k = Time.unscaledDeltaTime * 3f;
            var amb = ambientTarget;
            if (alarm) amb = Color.Lerp(amb, new Color(0.6f, 0.05f, 0.05f), 0.5f + 0.5f * Mathf.Sin(Time.unscaledTime * 6f));
            RenderSettings.fogColor = Color.Lerp(RenderSettings.fogColor, fogTarget, k);
            RenderSettings.ambientLight = Color.Lerp(RenderSettings.ambientLight, amb, k);
            RenderSettings.fogDensity = Mathf.Lerp(RenderSettings.fogDensity, densityTarget, k);
            if (G != null && G.Cam != null && G.Cam.Cam != null)
            {
                G.Cam.Cam.clearFlags = CameraClearFlags.SolidColor;
                G.Cam.Cam.backgroundColor = RenderSettings.fogColor;
                // once the machine runs, open space becomes visible through the glass
                if (G.Facts.Has("machine_activated")) G.Cam.Cam.backgroundColor = Color.Lerp(RenderSettings.fogColor, Color.black, 0.6f);
            }
        }
    }
}
