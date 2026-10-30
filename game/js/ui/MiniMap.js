// Minimap (corner) and full map (M). North-up, drawn with 2D canvas from
// the level's room rectangles, so it works for Station Zero and for every
// generated sector. Rooms you have visited are filled; others are outlines.

const COLORS = {
  room: 'rgba(255,255,255,0.92)', roomEdge: '#9fb3c6', unseen: 'rgba(255,255,255,0.35)', cur: '#d9ecff',
  corridor: 'rgba(255,255,255,0.8)', player: '#ff7a63', npc: '#2f9a64', sentinel: '#4f9fe8', item: '#e0a43a',
  token: '#2fae6a', gate: '#7a5fd0', beacon: '#22aeb9', text: '#4f6170',
  rail: 'rgba(58,50,44,0.85)', path: 'rgba(255,238,200,0.95)', objective: '#f08a1c', quarry: '#e8b400',
  // (an edition's places: deep water this year, and the raised ways over it; v2.1.1 playtest L28)
  water: 'rgba(58,128,200,0.72)', deck: 'rgba(120,104,92,0.9)', wade: 'rgba(150,205,235,0.9)',
};
// (marks an edition puts on the full map only: where the objective is, who Kai is after; the corner map stays sparse)
const BIG_ONLY = new Set(['objective', 'quarry']);

export class MiniMap {
  constructor(mini, big) {
    this.mini = mini;
    this.big = big;
    this.data = null;
    this.visited = new Set();
  }

  setMap(data, visited = []) {
    this.data = data;
    this.visited = new Set(visited);
  }

  markVisited(id) {
    this.visited.add(id);
  }

  fit(canvas) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g, w, h };
  }

  drawWorld(g, map, cur, scale, ox, oz, cx, cy, labels) {
    const P = (x, z) => [cx + (x - ox) * scale, cy + (z - oz) * scale];
    for (const c of map.corridors || []) {
      const [a, b] = [P(c[0], c[1]), P(c[2], c[3])];
      g.fillStyle = COLORS.corridor;
      g.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
    }
    // (a map with water draws the rooms' names last, over it: the canals ran through THE OVERGROWN TOWERS' name)
    const water = typeof map.water === 'function' ? map.water() : map.water;
    const late = water?.length ? [] : null;
    for (const r of map.rooms) {
      const [a, b] = [P(r.rect[0], r.rect[1]), P(r.rect[2], r.rect[3])];
      const seen = this.visited.has(r.id);
      g.fillStyle = r.id === cur ? COLORS.cur : seen ? COLORS.room : COLORS.unseen;
      g.strokeStyle = COLORS.roomEdge;
      g.lineWidth = r.id === cur ? 2 : 1;
      g.beginPath();
      g.roundRect ? g.roundRect(a[0], a[1], b[0] - a[0], b[1] - a[1], 4) : g.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
      g.fill();
      if (!seen) g.setLineDash([4, 3]);
      g.stroke();
      g.setLineDash([]);
      if (labels && seen) (late ? late.push([r, a, b]) : this.roomLabel(g, r, a, b));
    }
    // deep water as the year has it (map.water: rects, or a function of now; an edition's places, THE LAST VERSION's
    // canals): what is left light between it and the buildings is ground, or water shallow enough to wade. A place's
    // wading ways (lines of kind 'wade') go under it: where a sidewalk crosses a canal, the canal is what is there
    this.drawLines(g, map, P, labels, true);
    if (water?.length) {
      g.fillStyle = COLORS.water;
      for (const w of water) {
        const [a, b] = [P(w[0], w[1]), P(w[2], w[3])];
        g.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
      }
    }
    // open districts: the buildings
    g.fillStyle = 'rgba(60,72,90,0.35)';
    for (const bk of map.blocks || []) {
      const [a, b] = [P(bk[0], bk[1]), P(bk[2], bk[3])];
      g.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
    }
    this.drawLines(g, map, P, labels, false);
    for (const [r, a, b] of late || []) this.roomLabel(g, r, a, b);
    if (map.gate) {
      const [x, y] = P(map.gate[0], map.gate[1]);
      g.fillStyle = COLORS.gate;
      g.beginPath();
      g.arc(x, y, 5, 0, Math.PI * 2);
      g.fill();
    }
    return P;
  }

  // lines: rails, and the ways over them (an edition's places: THE LAST VERSION's Line 41); a line with a `when` (a
  // year's) only while map.shows(when) holds: a span fallen in 2196, a crossing waded only then. wade: the wading ways
  // (drawn under the water; their names after it, with the rest), or the rest
  drawLines(g, map, P, labels, wade) {
    for (const l of map.lines || []) {
      const under = l.kind === 'wade';
      if ((under && !wade && !(labels && l.name)) || (!under && wade) || (l.when && map.shows && !map.shows(l.when))) continue;
      if (l.rect) {
        const [a, b] = [P(l.rect[0], l.rect[1]), P(l.rect[2], l.rect[3])];
        g.fillStyle = COLORS[l.kind] || COLORS.path;
        if (under === wade) g.fillRect(a[0], a[1], Math.max(2, b[0] - a[0]), Math.max(2, b[1] - a[1]));
        if (labels && l.name && !wade) {
          g.fillStyle = COLORS.text;
          g.font = '700 9px Inter, sans-serif';
          g.textAlign = 'center';
          g.fillText(l.name, (a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 4);
        }
      } else if (l.a && l.b && under === wade) {
        const [a, b] = [P(l.a[0], l.a[1]), P(l.b[0], l.b[1])];
        g.strokeStyle = COLORS[l.kind] || COLORS.rail;
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(a[0], a[1]);
        g.lineTo(b[0], b[1]);
        g.stroke();
      }
    }
  }

  roomLabel(g, r, a, b) {
    g.fillStyle = COLORS.text;
    g.font = '600 11px Inter, "Segoe UI", sans-serif';
    g.textAlign = 'center';
    g.fillText(r.name, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 4);
    if (r.kind && r.kind !== 'puzzle' && r.kind !== 'district') {
      g.font = '600 9px Inter, sans-serif';
      g.fillStyle = COLORS.gate;
      g.fillText('★ STORY', (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 17);
    }
  }

  drawMarkers(g, P, markers, big = false) {
    for (const m of markers) {
      if (!big && BIG_ONLY.has(m.kind)) continue;
      const [x, y] = P(m.x, m.z);
      g.fillStyle = COLORS[m.kind] || '#888';
      if (m.kind === 'objective') {
        // a ring with a dot: where the objective is
        g.strokeStyle = COLORS.objective;
        g.lineWidth = 3;
        g.beginPath();
        g.arc(x, y, 9, 0, Math.PI * 2);
        g.stroke();
        g.beginPath();
        g.arc(x, y, 3.5, 0, Math.PI * 2);
        g.fill();
        continue;
      }
      g.beginPath();
      if (m.kind === 'quarry') {
        g.moveTo(x, y - 7); g.lineTo(x + 6, y); g.lineTo(x, y + 7); g.lineTo(x - 6, y); g.closePath();
        g.fill();
        g.strokeStyle = '#fff';
        g.lineWidth = 1.5;
        g.stroke();
        continue;
      }
      if (m.kind === 'sentinel') {
        g.moveTo(x, y - 5); g.lineTo(x + 4, y + 4); g.lineTo(x - 4, y + 4); g.closePath();
      } else g.arc(x, y, m.kind === 'npc' ? 4 : 3, 0, Math.PI * 2);
      g.fill();
    }
  }

  drawPlayer(g, P, player) {
    const [x, y] = P(player.pos.x, player.pos.z);
    const a = Math.atan2(player.H.x, -player.H.z);
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.fillStyle = COLORS.player;
    g.strokeStyle = '#fff';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, -8); g.lineTo(6, 6); g.lineTo(0, 3); g.lineTo(-6, 6); g.closePath();
    g.stroke();
    g.fill();
    g.restore();
  }

  drawMini(player, cur, markers) {
    if (!this.data || !this.mini) return;
    const { g, w, h } = this.fit(this.mini);
    if (w < 20 || h < 20) return; // hidden
    g.clearRect(0, 0, w, h);
    g.save();
    g.beginPath();
    g.arc(w / 2, h / 2, w / 2 - 1, 0, Math.PI * 2);
    g.clip();
    g.fillStyle = 'rgba(228,237,245,0.75)';
    g.fillRect(0, 0, w, h);
    const P = this.drawWorld(g, this.data, cur, 3.2, player.pos.x, player.pos.z, w / 2, h / 2, false);
    this.drawMarkers(g, P, markers);
    this.drawPlayer(g, P, player);
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,0.9)';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(w / 2, h / 2, w / 2 - 1.5, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = COLORS.text;
    g.font = '700 10px Inter, sans-serif';
    g.textAlign = 'center';
    g.fillText('N', w / 2, 12);
  }

  drawBig(player, cur, markers) {
    if (!this.data || !this.big) return;
    const { g, w, h } = this.fit(this.big);
    if (w < 20 || h < 20) return;
    g.clearRect(0, 0, w, h);
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const r of [...this.data.rooms.map((r) => r.rect), ...(this.data.corridors || [])]) {
      x0 = Math.min(x0, r[0]); z0 = Math.min(z0, r[1]); x1 = Math.max(x1, r[2]); z1 = Math.max(z1, r[3]);
    }
    const pad = 28;
    const scale = Math.min((w - pad * 2) / (x1 - x0 || 1), (h - pad * 2) / (z1 - z0 || 1));
    const P = this.drawWorld(g, this.data, cur, scale, (x0 + x1) / 2, (z0 + z1) / 2, w / 2, h / 2, true);
    this.drawMarkers(g, P, markers, true);
    this.drawPlayer(g, P, player);
  }
}
