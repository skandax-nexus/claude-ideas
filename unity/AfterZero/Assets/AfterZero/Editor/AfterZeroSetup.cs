// One-click setup: AfterZero > Create Game Scene / Configure Project / Validate Content.
using System.IO;
using System.Linq;
using AfterZero.Core;
using AfterZero.Core.Content;
using AfterZero.Runtime;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;

namespace AfterZero.EditorTools
{
    public static class AfterZeroSetup
    {
        const string SceneDir = "Assets/AfterZero/Scenes";
        const string ScenePath = SceneDir + "/AfterZero.unity";

        [MenuItem("AfterZero/1. Configure Project (input, shaders, Android)", priority = 1)]
        public static void Configure()
        {
            // Legacy + new input both on, so the game's InputRouter works everywhere.
            var ps = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset").FirstOrDefault();
            if (ps != null)
            {
                var so = new SerializedObject(ps);
                var p = so.FindProperty("activeInputHandler");
                if (p != null) { p.intValue = 2; so.ApplyModifiedProperties(); }
            }

            // Materials are created at runtime, so make sure their shaders ship in builds.
            var gs = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/GraphicsSettings.asset").FirstOrDefault();
            if (gs != null)
            {
                var so = new SerializedObject(gs);
                var arr = so.FindProperty("m_AlwaysIncludedShaders");
                foreach (var name in new[] { "Universal Render Pipeline/Lit", "Universal Render Pipeline/Unlit", "Universal Render Pipeline/Particles/Unlit", "Standard", "Unlit/Color", "Particles/Standard Unlit", "GUI/Text Shader" })
                {
                    var sh = Shader.Find(name);
                    if (sh == null) continue;
                    bool present = false;
                    for (int i = 0; i < arr.arraySize; i++) if (arr.GetArrayElementAtIndex(i).objectReferenceValue == sh) present = true;
                    if (present) continue;
                    arr.InsertArrayElementAtIndex(arr.arraySize);
                    arr.GetArrayElementAtIndex(arr.arraySize - 1).objectReferenceValue = sh;
                }
                so.ApplyModifiedProperties();
            }

            PlayerSettings.companyName = "AfterZero";
            PlayerSettings.productName = "AFTERZERO";
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.AutoRotation;
            PlayerSettings.allowedAutorotateToPortrait = false;
            PlayerSettings.allowedAutorotateToPortraitUpsideDown = false;
            PlayerSettings.allowedAutorotateToLandscapeLeft = true;
            PlayerSettings.allowedAutorotateToLandscapeRight = true;
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
            PlayerSettings.Android.minSdkVersion = AndroidSdkVersions.AndroidApiLevel26;
            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, "com.afterzero.game");

            if (GraphicsSettings.currentRenderPipeline == null)
                Debug.LogWarning("AFTERZERO: no Universal Render Pipeline asset is active. The game runs, but without post-processing. " +
                                 "Recommended: create the project from Unity Hub's 'Universal 3D' template and copy Assets/AfterZero into it.");
            AssetDatabase.SaveAssets();
            Debug.Log("AFTERZERO: project configured. Unity may ask to restart to apply the input setting.");
        }

        [MenuItem("AfterZero/2. Create Game Scene", priority = 2)]
        public static void CreateScene()
        {
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var go = new GameObject("AFTERZERO");
            go.AddComponent<GameManager>();
            RenderSettings.skybox = null;
            RenderSettings.ambientMode = AmbientMode.Flat;
            Directory.CreateDirectory(SceneDir);
            EditorSceneManager.SaveScene(scene, ScenePath);
            var scenes = EditorBuildSettings.scenes.Where(s => s.path != ScenePath).ToList();
            scenes.Insert(0, new EditorBuildSettingsScene(ScenePath, true));
            EditorBuildSettings.scenes = scenes.ToArray();
            Debug.Log("AFTERZERO: scene created at " + ScenePath + ". Press Play.");
        }

        [MenuItem("AfterZero/3. Validate Content", priority = 3)]
        public static void Validate()
        {
            var bp = WorldContent.Build();
            var problems = bp.Validate(c => { try { Conditions.Compile(c); return true; } catch { return false; } }).ToList();
            foreach (var p in problems) Debug.LogError("AFTERZERO content: " + p);
            Debug.Log($"AFTERZERO: {bp.Rooms.Count} rooms, {bp.Elements.Count} elements, {StoryContent.Npcs.Count} characters, " +
                      $"{StoryContent.Scripts.Count} scripts, {bp.Memories.Count} memories, {problems.Count} problems.");
        }

        [MenuItem("AfterZero/Create World Theme Asset", priority = 20)]
        public static void CreateTheme()
        {
            var t = ScriptableObject.CreateInstance<WorldTheme>();
            foreach (var m in new[] { "wall", "wallDark", "floor", "ceil", "metal", "pillar", "shelf", "crate", "bunk", "glass", "door" })
                t.materials.Add(new WorldTheme.MaterialSlot { name = m });
            foreach (var k in new[] { "shard", "terminal", "machine", "brain", "observer", "warden", "npc:juno", "npc:ashe", "npc:bael", "npc:varga", "npc:custodian", "npc:tick" })
                t.props.Add(new WorldTheme.PrefabSlot { kind = k });
            Directory.CreateDirectory("Assets/AfterZero/Themes");
            AssetDatabase.CreateAsset(t, AssetDatabase.GenerateUniqueAssetPath("Assets/AfterZero/Themes/WorldTheme.asset"));
            Selection.activeObject = t;
        }

        [MenuItem("AfterZero/Delete Save Data", priority = 40)]
        public static void DeleteSaves()
        {
            foreach (var f in new[] { "afterzero.save.json", "afterzero.legacy.json" })
            {
                var p = Path.Combine(Application.persistentDataPath, f);
                if (File.Exists(p)) File.Delete(p);
            }
            PlayerPrefs.DeleteKey("afterzero.settings");
            Debug.Log("AFTERZERO: save data deleted.");
        }
    }
}
