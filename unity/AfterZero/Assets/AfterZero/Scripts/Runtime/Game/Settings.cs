// Player-facing options. Saved in PlayerPrefs as JSON.
using System;
using UnityEngine;

namespace AfterZero.Runtime
{
    [Serializable]
    public class Settings
    {
        public float MouseSensitivity = 2.0f;   // degrees per mouse unit
        public float TouchSensitivity = 0.16f;  // degrees per pixel
        public float LookSmoothing = 0.025f;    // seconds; 0 = raw
        public bool InvertY;
        public bool InstantFlip;                // cut instead of camera roll (motion comfort)
        public float SubtitleScale = 1f;
        public int Difficulty = 1;              // 0 Story, 1 Normal, 2 Hard
        public int Quality = 1;                 // 0 Low, 1 Medium, 2 High
        public float Volume = 0.8f;
        public bool ObserverRemembers = true;   // carry the Observer's lessons into New Game+
        public bool ReduceFlashes;

        const string Key = "afterzero.settings";

        public static Settings Load()
        {
            try
            {
                var s = PlayerPrefs.GetString(Key, "");
                if (!string.IsNullOrEmpty(s)) return JsonUtility.FromJson<Settings>(s);
            }
            catch (Exception e) { Debug.LogWarning("Settings unreadable: " + e.Message); }
            var d = new Settings();
            if (Application.isMobilePlatform) { d.Quality = 0; d.LookSmoothing = 0.04f; }
            return d;
        }

        public void Save()
        {
            PlayerPrefs.SetString(Key, JsonUtility.ToJson(this));
            PlayerPrefs.Save();
        }

        public void Apply()
        {
            AudioListener.volume = Volume;
            QualitySettings.vSyncCount = Application.isMobilePlatform ? 0 : 1;
            Application.targetFrameRate = Application.isMobilePlatform ? (Quality >= 2 ? 60 : 30) : -1;
            QualitySettings.shadowDistance = Quality == 0 ? 0 : Quality == 1 ? 25 : 45;
            QualitySettings.antiAliasing = Quality >= 2 ? 4 : Quality == 1 ? 2 : 0;
        }

        public string DifficultyName => Difficulty == 0 ? "STORY" : Difficulty == 2 ? "HARD" : "NORMAL";
        public float ThreatScale => Difficulty == 0 ? 0.7f : Difficulty == 2 ? 1.2f : 1f;
    }
}
