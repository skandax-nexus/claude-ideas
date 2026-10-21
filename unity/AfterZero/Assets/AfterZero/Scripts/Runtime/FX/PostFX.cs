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
            bloom = profile.Add<Bloom>(true); bloom.intensity.Override(0.5f); bloom.threshold.Override(1.05f); bloom.scatter.Override(0.7f);
            vignette = profile.Add<Vignette>(true); vignette.intensity.Override(0.12f); vignette.smoothness.Override(0.6f);
            chroma = profile.Add<ChromaticAberration>(true); chroma.intensity.Override(0.05f);
            color = profile.Add<ColorAdjustments>(true); color.postExposure.Override(0.1f); color.contrast.Override(-6f); color.saturation.Override(-4f);
            lens = profile.Add<LensDistortion>(true); lens.intensity.Override(0f);
            grain = profile.Add<FilmGrain>(true); grain.intensity.Override(0f);
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
            // gentle grading: soft tints per state, nothing that strains the eyes
            Color tint = state == RealityStates.Echo ? new Color(0.94f, 1f, 1f) : state == RealityStates.Inverted ? new Color(1f, 0.95f, 0.98f) : Color.white;
            if (slip) tint = Color.Lerp(tint, new Color(1f, 0.97f, 0.9f), 0.5f);
            color.colorFilter.Override(Color.Lerp(color.colorFilter.value, tint, dt * 4f));
            color.saturation.Override(Mathf.Lerp(color.saturation.value, state == RealityStates.Echo ? -10f : -4f, dt * 3f));
            vignette.intensity.Override(0.12f + adr * 0.12f + (slip ? 0.08f : 0f));
            vignette.color.Override(adr > 0.6f ? Palette.Hex("#7a3a30") : Palette.Hex("#203040"));
            chroma.intensity.Override(pulse * 0.25f + (slip ? 0.15f : 0f));
            lens.intensity.Override(-pulse * 0.15f + (slip ? -0.1f : 0f));
            bloom.intensity.Override(0.5f + pulse * 0.6f);
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
            // a soft "skylight" sun: lights and grounds the third-person character
            var sun = new GameObject("Sun").AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = Palette.Hex("#fff3e0");
            sun.intensity = 0.9f;
            sun.shadows = G != null && G.Settings.Quality == 0 ? LightShadows.None : LightShadows.Soft;
            sun.shadowStrength = 0.55f;
            sun.transform.rotation = Quaternion.Euler(70f, 30f, 0f);
        }

        public void OnRoom(RoomDef r) { densityTarget = r.FogDensity; OnShift(); }

        public void OnShift()
        {
            if (G == null || G.Room == null) return;
            var r = G.BP.Rooms[G.Room];
            var tint = Palette.Hex(r.Tint);
            var s = G.Engine.State(G.Room);
            // bright, soft looks: daylight, rose dusk, mint memory
            Color baseFog = s == RealityStates.Echo ? Palette.Hex("#d8f2f0") : s == RealityStates.Inverted ? Palette.Hex("#f5e3ec") : Palette.Hex("#e4edf5");
            fogTarget = Color.Lerp(baseFog, tint, 0.08f);
            ambientTarget = Color.Lerp(s == RealityStates.Echo ? Palette.Hex("#c8ecea") : s == RealityStates.Inverted ? Palette.Hex("#f0d8e4") : Palette.Hex("#d8e2ec"), tint, 0.12f);
            densityTarget = r.FogDensity * (s == RealityStates.Echo ? 0.8f : 0.6f);
            if (G.Facts.Has("machine_activated") && (G.Room == "lab" || G.Room == "core")) densityTarget = 0.006f;
        }

        public void Alarm(bool on) => alarm = on;

        void Update()
        {
            float k = Time.unscaledDeltaTime * 3f;
            var amb = ambientTarget;
            if (alarm) amb = Color.Lerp(amb, Palette.Hex("#ffd0c0"), 0.25f + 0.25f * Mathf.Sin(Time.unscaledTime * 3f));
            RenderSettings.fogColor = Color.Lerp(RenderSettings.fogColor, fogTarget, k);
            RenderSettings.ambientLight = Color.Lerp(RenderSettings.ambientLight, amb, k);
            RenderSettings.fogDensity = Mathf.Lerp(RenderSettings.fogDensity, densityTarget, k);
            if (G != null && G.Cam != null && G.Cam.Cam != null)
            {
                G.Cam.Cam.clearFlags = CameraClearFlags.SolidColor;
                G.Cam.Cam.backgroundColor = RenderSettings.fogColor;
                // once the machine runs, open space becomes visible through the glass
                if (G.Facts.Has("machine_activated") && (G.Room == "lab" || G.Room == "core")) G.Cam.Cam.backgroundColor = Palette.Hex("#1a2a4a");
            }
        }
    }
}
