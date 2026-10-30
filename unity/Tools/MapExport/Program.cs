// Renders WorldContent to SVG: a whole-vessel plan, one plan per zone, and
// elevations for the vertical zones. Output folder is the first argument.
using System;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using AfterZero.Core;
using AfterZero.Core.Content;

static class Program
{
    static string F(float v) => v.ToString("0.##", CultureInfo.InvariantCulture);

    static string Fill(Element e) => e.Echo ? "none" : e.Shadow ? "#3a2050" : e.Mat switch
    {
        "floor" or "floorDark" or "tray" => "#2a3038",
        "ceil" => "none",
        "glass" => "#3a6a8a",
        "pillar" => "#a05050",
        "door" or "doorArchive" or "doorSecurity" or "forcefield" => "#e0a040",
        var m when m.StartsWith("strip") => "none",
        "crate" or "bunk" or "shelf" or "metal" or "planter" => "#5a6474",
        _ => "#9aa6b4",
    };

    static void Main(string[] args)
    {
        var dir = args.Length > 0 ? args[0] : "maps";
        Directory.CreateDirectory(dir);
        var bp = WorldContent.Build();
        Plan(bp, Path.Combine(dir, "vessel.svg"), null, -75, -40, 177, 60, 5f, "VESSEL AFTERZERO - FLOOR PLAN (all decks projected, 1 m grid)");
        foreach (var r in bp.Rooms.Values)
        {
            var b = r.Bounds.OrderByDescending(x => x.SX * x.SZ).First();
            float x0 = r.Bounds.Min(x => x.X0) - 3, x1 = r.Bounds.Max(x => x.X1) + 3, z0 = r.Bounds.Min(x => x.Z0) - 3, z1 = r.Bounds.Max(x => x.Z1) + 3;
            Plan(bp, Path.Combine(dir, $"{r.Id}.svg"), r.Id, x0, z0, x1, z1, Math.Min(22f, 900f / Math.Max(x1 - x0, z1 - z0)), $"{r.Name} - ACT {r.Act}");
        }
        Elevation(bp, Path.Combine(dir, "spine_elevation.svg"), "spine", 60, 95, -15, 65, "HYDROPONIC SPINE - ELEVATION (looking north)");
        Elevation(bp, Path.Combine(dir, "crown_elevation.svg"), "crown", 88, 172, 40, 68, "REACTOR CROWN + CORE - ELEVATION (looking north)", "core");
        Console.WriteLine("maps written to " + Path.GetFullPath(dir));
    }

    static void Plan(Blueprint bp, string path, string room, float x0, float z0, float x1, float z1, float s, string title)
    {
        float W = (x1 - x0) * s, H = (z1 - z0) * s + 60;
        var sb = new StringBuilder();
        sb.Append($"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {F(W)} {F(H)}' font-family='monospace'>");
        sb.Append($"<rect width='{F(W)}' height='{F(H)}' fill='#0b0f14'/>");
        float X(float x) => (x - x0) * s;
        float Z(float z) => 60 + (z1 - z) * s;   // north up
        for (float g = (float)Math.Ceiling(x0); g < x1; g += 1) if (s >= 8 || g % 5 == 0) sb.Append($"<line x1='{F(X(g))}' y1='60' x2='{F(X(g))}' y2='{F(H)}' stroke='#151c24' stroke-width='{(g % 10 == 0 ? 1.2 : 0.5)}'/>");
        for (float g = (float)Math.Ceiling(z0); g < z1; g += 1) if (s >= 8 || g % 5 == 0) sb.Append($"<line x1='0' y1='{F(Z(g))}' x2='{F(W)}' y2='{F(Z(g))}' stroke='#151c24' stroke-width='{(g % 10 == 0 ? 1.2 : 0.5)}'/>");
        var els = bp.Elements.Where(e => room == null || e.Room == room).OrderBy(e => e.Mat == "floor" || e.Mat == "floorDark" || e.Mat == "tray" ? 0 : 1).ToList();
        foreach (var e in els)
        {
            var b = e.Box;
            if (e.Mat == "ceil" || e.Mat.StartsWith("strip")) continue;
            float floorY = bp.Rooms[e.Room].Spawn[1] - 0.86f;
            if (b.Y0 > floorY + 6 && (room == null || !e.Solid)) continue; // overhead things clutter the plan
            string fill = Fill(e);
            string stroke = e.Echo ? "#4ff0ff" : e.When != null ? "#e0a040" : e.Shadow ? "#9a70d0" : "none";
            string dash = e.Echo || e.Shadow ? " stroke-dasharray='3 2'" : "";
            float op = e.Mat == "floor" || e.Mat == "floorDark" || e.Mat == "tray" ? 1f : 0.95f;
            sb.Append($"<rect x='{F(X(b.X0))}' y='{F(Z(b.Z1))}' width='{F(b.SX * s)}' height='{F(b.SZ * s)}' fill='{fill}' fill-opacity='{F(op)}' stroke='{stroke}' stroke-width='1'{dash}/>");
        }
        string Dot(float x, float z, string c, float r, string label = null) =>
            $"<circle cx='{F(X(x))}' cy='{F(Z(z))}' r='{F(r)}' fill='{c}'/>" + (label != null && s >= 6 ? $"<text x='{F(X(x) + r + 2)}' y='{F(Z(z) + 4)}' fill='{c}' font-size='{F(Math.Max(9, Math.Min(13, s * 0.6f)))}'>{label}</text>" : "");
        foreach (var r in bp.Rooms.Values.Where(r => room == null || r.Id == room)) sb.Append(Dot(r.Spawn[0], r.Spawn[2], "#ffffff", 4, "spawn"));
        foreach (var i in bp.Interactables.Where(i => room == null || i.Room == room)) sb.Append(Dot(i.X, i.Z, "#ffe066", 3.5f, i.Id));
        foreach (var t in bp.Tokens.Where(t => room == null || t.Room == room)) sb.Append(Dot(t.X, t.Z, "#9dff9d", 4, Laws.Tokens[t.Token].Label + (t.Y > 8 ? " (ceiling)" : "")));
        foreach (var m in bp.Memories.Where(m => room == null || m.Room == room)) sb.Append(Dot(m.X, m.Z, "#ffb84a", 3.5f, "memory: " + m.Title + (m.Echo ? " (echo)" : "")));
        foreach (var it in bp.Items.Where(i => room == null || i.Room == room)) sb.Append(Dot(it.X, it.Z, it.Echo ? "#4ff0ff" : "#ff9050", 4, it.Label));
        foreach (var n in StoryContent.Npcs.Where(n => room == null || n.Room == room)) sb.Append(Dot(n.X, n.Z, "#ff5ab4", 5, n.Name));
        foreach (var hz in bp.HuntZones.Where(h => room == null || h.Room == room)) sb.Append(Dot(hz.Spawn[0], hz.Spawn[2], "#ff3a2a", 6, "OBSERVER"));
        if (room == null)
            foreach (var r in bp.Rooms.Values)
            {
                var b = r.Bounds.OrderByDescending(x => x.SX * x.SZ).First();
                sb.Append($"<text x='{F(X(b.CX))}' y='{F(Z(b.CZ))}' fill='#ffffff' font-size='14' text-anchor='middle' opacity='0.85'>{r.Name}</text>");
            }
        sb.Append($"<text x='12' y='24' fill='#e8eef4' font-size='16'>{title}</text>");
        sb.Append("<text x='12' y='46' fill='#7b8794' font-size='11'>grey wall  red pillar  orange = conditional  cyan dashed = echo (memory)  purple dashed = shadow  yellow interactable  green law token  amber memory  pink character</text>");
        sb.Append("</svg>");
        File.WriteAllText(path, sb.ToString());
    }

    static void Elevation(Blueprint bp, string path, string room, float x0, float x1, float y0, float y1, string title, string also = null)
    {
        float s = Math.Min(14f, 1100f / (x1 - x0));
        float W = (x1 - x0) * s, H = (y1 - y0) * s + 60;
        var sb = new StringBuilder();
        sb.Append($"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {F(W)} {F(H)}' font-family='monospace'><rect width='{F(W)}' height='{F(H)}' fill='#0b0f14'/>");
        float X(float x) => (x - x0) * s;
        float Y(float y) => 60 + (y1 - y) * s;
        foreach (var e in bp.Elements.Where(e => (e.Room == room || e.Room == also) && !e.Mat.StartsWith("strip")))
        {
            var b = e.Box;
            if (b.Z1 < -3 || b.Z0 > 3) { if (!(b.SZ > 6)) continue; } // slice through the centre line
            string fill = e.Echo ? "none" : e.Shadow ? "#3a2050" : e.Mat == "ceil" ? "#4a5560" : Fill(e);
            string stroke = e.Echo ? "#4ff0ff" : e.Shadow ? "#9a70d0" : e.When != null ? "#e0a040" : "none";
            sb.Append($"<rect x='{F(X(b.X0))}' y='{F(Y(b.Y1))}' width='{F(b.SX * s)}' height='{F(b.SY * s)}' fill='{fill}' fill-opacity='0.85' stroke='{stroke}' stroke-dasharray='{(e.Echo || e.Shadow ? "3 2" : "none")}'/>");
        }
        foreach (var c in bp.Chases.Where(c => c.Room == room))
        {
            if (c.Kind == "rise") sb.Append($"<line x1='0' y1='{F(Y(c.StartX))}' x2='{F(W)}' y2='{F(Y(c.StartX))}' stroke='#a040ff' stroke-width='2' stroke-dasharray='6 4'/><text x='6' y='{F(Y(c.StartX) - 6)}' fill='#c080ff' font-size='12'>UNDERTOW rises {c.Speed} m/s</text>");
            if (c.Kind == "undertow") sb.Append($"<line x1='{F(X(c.StartX))}' y1='60' x2='{F(X(c.StartX))}' y2='{F(H)}' stroke='#a040ff' stroke-width='2' stroke-dasharray='6 4'/><text x='{F(X(c.StartX) + 4)}' y='{F(Y(c.Y + 12))}' fill='#c080ff' font-size='12'>UNDERTOW {c.Speed} m/s, stops at x={F(c.EndX)}</text>");
        }
        foreach (var t in bp.Tokens.Where(t => t.Room == room)) sb.Append($"<circle cx='{F(X(t.X))}' cy='{F(Y(t.Y))}' r='4' fill='#9dff9d'/><text x='{F(X(t.X) + 6)}' y='{F(Y(t.Y) + 4)}' fill='#9dff9d' font-size='11'>{Laws.Tokens[t.Token].Label}</text>");
        foreach (var m in bp.Memories.Where(m => m.Room == room || m.Room == also)) sb.Append($"<circle cx='{F(X(m.X))}' cy='{F(Y(m.Y))}' r='3.5' fill='#ffb84a'/>");
        sb.Append($"<text x='12' y='24' fill='#e8eef4' font-size='16'>{title}</text><text x='12' y='46' fill='#7b8794' font-size='11'>section through z=0; 1 px = {F(1 / s)} m</text></svg>");
        File.WriteAllText(path, sb.ToString());
    }
}
