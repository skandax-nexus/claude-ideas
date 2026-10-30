// Saves are just facts, room states, laws and the Observer's memory -
// the world re-derives itself from them. The Observer's memory is also
// kept separately so it can follow the player into New Game+.
using System;
using System.Collections.Generic;
using System.IO;
using AfterZero.Core;
using UnityEngine;

namespace AfterZero.Runtime
{
    [Serializable]
    public class SaveData
    {
        public int Version = 1;
        public int Cycle = 42;
        public List<string> Facts = new List<string>();
        public List<string> Fired = new List<string>();
        public RealityEngine.Snapshot Engine;
        public ObserverBrain.Snapshot Brain;
        public string Room;
        public List<string> Log = new List<string>();
        public List<string> Timeline = new List<string>();
        public float PlayTime;
    }

    [Serializable]
    public class Legacy
    {
        public int Cycle = 42;
        public int Completions;
        public List<string> EndingsSeen = new List<string>();
        public ObserverBrain.Snapshot Brain;
    }

    public static class SaveSystem
    {
        static string Dir => Application.persistentDataPath;
        static string SavePath => Path.Combine(Dir, "afterzero.save.json");
        static string LegacyPath => Path.Combine(Dir, "afterzero.legacy.json");

        public static bool HasSave => File.Exists(SavePath);

        public static void Write(SaveData d) => WriteJson(SavePath, d);
        public static SaveData Read() => ReadJson<SaveData>(SavePath);
        public static void Delete() { try { if (File.Exists(SavePath)) File.Delete(SavePath); } catch (Exception e) { Debug.LogWarning(e.Message); } }

        public static Legacy ReadLegacy() => ReadJson<Legacy>(LegacyPath) ?? new Legacy();
        public static void WriteLegacy(Legacy l) => WriteJson(LegacyPath, l);

        static void WriteJson(string path, object o)
        {
            try
            {
                var tmp = path + ".tmp";
                File.WriteAllText(tmp, JsonUtility.ToJson(o));
                if (File.Exists(path)) File.Delete(path);
                File.Move(tmp, path);
            }
            catch (Exception e) { Debug.LogWarning("Save failed: " + e.Message); }
        }

        static T ReadJson<T>(string path) where T : class
        {
            try { return File.Exists(path) ? JsonUtility.FromJson<T>(File.ReadAllText(path)) : null; }
            catch (Exception e) { Debug.LogWarning("Save unreadable: " + e.Message); return null; }
        }
    }
}
