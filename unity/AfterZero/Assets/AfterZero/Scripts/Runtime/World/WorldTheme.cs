// Swap the greybox for real art without touching gameplay data.
// Create via Assets > Create > AfterZero > World Theme, then assign it to
// the GameManager. Material names match the Mat field of map elements
// ("wall", "floor", "pillar", ...); prop kinds match interactables, items
// and characters ("terminal", "machine", "observer", "npc:juno", ...).
using System;
using System.Collections.Generic;
using UnityEngine;

namespace AfterZero.Runtime
{
    [CreateAssetMenu(menuName = "AfterZero/World Theme", fileName = "WorldTheme")]
    public class WorldTheme : ScriptableObject
    {
        [Serializable] public struct MaterialSlot { public string name; public Material material; }
        [Serializable] public struct PrefabSlot { public string kind; public GameObject prefab; }

        public List<MaterialSlot> materials = new List<MaterialSlot>();
        public List<PrefabSlot> props = new List<PrefabSlot>();

        public bool TryGet(string name, out Material m)
        {
            foreach (var s in materials) if (s.name == name && s.material != null) { m = s.material; return true; }
            m = null;
            return false;
        }

        public GameObject Prop(string kind)
        {
            foreach (var s in props) if (s.kind == kind && s.prefab != null) return s.prefab;
            return null;
        }
    }
}
