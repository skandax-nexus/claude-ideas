// Procedural mesh helpers: boxes with world-tiled UVs (merged per room and
// material to keep draw calls low on Android), plus shapes for props.
using System.Collections.Generic;
using UnityEngine;

namespace AfterZero.Runtime
{
    public static class Meshes
    {
        static readonly Vector3[] FaceNormals = { Vector3.right, Vector3.left, Vector3.up, Vector3.down, Vector3.forward, Vector3.back };

        /// Appends a box (center, size) to the buffers with UVs tiled every `tile` metres.
        public static void AppendBox(List<Vector3> v, List<Vector3> n, List<Vector2> uv, List<int> tri, Vector3 c, Vector3 s, float tile = 2f)
        {
            Vector3 h = s * 0.5f;
            for (int f = 0; f < 6; f++)
            {
                Vector3 nrm = FaceNormals[f];
                // two in-face axes (scaled to half extents) and the face's size in metres for UV tiling
                Vector3 u, w; float su, sv;
                if (f < 2) { u = new Vector3(0, 0, h.z); w = new Vector3(0, h.y, 0); su = s.z; sv = s.y; }
                else if (f < 4) { u = new Vector3(h.x, 0, 0); w = new Vector3(0, 0, h.z); su = s.x; sv = s.z; }
                else { u = new Vector3(h.x, 0, 0); w = new Vector3(0, h.y, 0); su = s.x; sv = s.y; }
                Vector3 center = c + Vector3.Scale(nrm, h);
                int b = v.Count;
                v.Add(center - u - w); v.Add(center + u - w); v.Add(center + u + w); v.Add(center - u + w);
                for (int k = 0; k < 4; k++) n.Add(nrm);
                uv.Add(new Vector2(0, 0)); uv.Add(new Vector2(su / tile, 0)); uv.Add(new Vector2(su / tile, sv / tile)); uv.Add(new Vector2(0, sv / tile));
                tri.Add(b); tri.Add(b + 1); tri.Add(b + 2); tri.Add(b); tri.Add(b + 2); tri.Add(b + 3);
            }
        }

        /// Unity front faces: Cross(b - a, c - a) points along the outward normal. Flip any triangle that doesn't.
        public static void FixWinding(List<Vector3> v, List<Vector3> n, List<int> t)
        {
            for (int i = 0; i < t.Count; i += 3)
            {
                Vector3 a = v[t[i]], b = v[t[i + 1]], c = v[t[i + 2]];
                Vector3 nn = n[t[i]] + n[t[i + 1]] + n[t[i + 2]];
                if (Vector3.Dot(Vector3.Cross(b - a, c - a), nn) < 0) { int tmp = t[i + 1]; t[i + 1] = t[i + 2]; t[i + 2] = tmp; }
            }
        }

        public static Mesh Box(Vector3 size, float tile = 2f)
        {
            var v = new List<Vector3>(); var n = new List<Vector3>(); var uv = new List<Vector2>(); var t = new List<int>();
            AppendBox(v, n, uv, t, Vector3.zero, size, tile);
            return Build(v, n, uv, t);
        }

        public static Mesh Build(List<Vector3> v, List<Vector3> n, List<Vector2> uv, List<int> t)
        {
            FixWinding(v, n, t);
            var m = new Mesh { indexFormat = v.Count > 65000 ? UnityEngine.Rendering.IndexFormat.UInt32 : UnityEngine.Rendering.IndexFormat.UInt16 };
            m.SetVertices(v);
            m.SetNormals(n);
            m.SetUVs(0, uv);
            m.SetTriangles(t, 0);
            m.RecalculateBounds();
            m.RecalculateTangents();
            return m;
        }

        public static Mesh Torus(float radius, float tube, int seg = 48, int sides = 10)
        {
            var v = new List<Vector3>(); var n = new List<Vector3>(); var uv = new List<Vector2>(); var t = new List<int>();
            for (int i = 0; i <= seg; i++)
            {
                float a = i / (float)seg * Mathf.PI * 2;
                Vector3 ring = new Vector3(Mathf.Cos(a), Mathf.Sin(a), 0);
                for (int j = 0; j <= sides; j++)
                {
                    float b = j / (float)sides * Mathf.PI * 2;
                    Vector3 dir = ring * Mathf.Cos(b) + Vector3.forward * Mathf.Sin(b);
                    v.Add(ring * radius + dir * tube);
                    n.Add(dir);
                    uv.Add(new Vector2(i / (float)seg * 8, j / (float)sides));
                }
            }
            for (int i = 0; i < seg; i++)
                for (int j = 0; j < sides; j++)
                {
                    int a = i * (sides + 1) + j, b = a + sides + 1;
                    t.Add(a); t.Add(a + 1); t.Add(b);
                    t.Add(b); t.Add(a + 1); t.Add(b + 1);
                }
            return Build(v, n, uv, t);
        }

        public static Mesh Octahedron(float r)
        {
            var p = new[] { Vector3.up, Vector3.down, Vector3.left, Vector3.right, Vector3.forward, Vector3.back };
            int[,] faces = { { 0, 4, 3 }, { 0, 3, 5 }, { 0, 5, 2 }, { 0, 2, 4 }, { 1, 3, 4 }, { 1, 5, 3 }, { 1, 2, 5 }, { 1, 4, 2 } };
            var v = new List<Vector3>(); var n = new List<Vector3>(); var uv = new List<Vector2>(); var t = new List<int>();
            for (int f = 0; f < 8; f++)
            {
                Vector3 a = p[faces[f, 0]] * r, b = p[faces[f, 1]] * r, c = p[faces[f, 2]] * r;
                Vector3 nn = Vector3.Cross(b - a, c - a).normalized;
                if (Vector3.Dot(nn, a + b + c) < 0) { var tmp = b; b = c; c = tmp; nn = -nn; }
                int i0 = v.Count;
                v.Add(a); v.Add(b); v.Add(c);
                n.Add(nn); n.Add(nn); n.Add(nn);
                uv.Add(Vector2.zero); uv.Add(Vector2.right); uv.Add(Vector2.up);
                t.Add(i0); t.Add(i0 + 1); t.Add(i0 + 2);
            }
            return Build(v, n, uv, t);
        }

        /// A lumpy sphere for the brain.
        public static Mesh Brain(float r)
        {
            var tmpGo = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            var src = tmpGo.GetComponent<MeshFilter>().sharedMesh;
            Object.DestroyImmediate(tmpGo);
            var verts = src.vertices;
            for (int i = 0; i < verts.Length; i++)
            {
                var p = verts[i] * (r * 2f);
                float k = 1 + Mathf.Sin(p.x * 11) * Mathf.Sin(p.y * 13) * Mathf.Sin(p.z * 9) * 0.06f;
                p *= k;
                p.x *= 1.25f;
                if (Mathf.Abs(p.x) < 0.06f && p.y > 0) p.y -= 0.1f;
                p.y *= 0.85f;
                verts[i] = p;
            }
            var m = Object.Instantiate(src);
            m.vertices = verts;
            m.RecalculateNormals();
            m.RecalculateBounds();
            return m;
        }
    }
}
