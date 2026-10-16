// Minimap (corner) and full map (M). North-up, drawn with 2D canvas from
// the level's room rectangles, so it works for Station Zero and for every
// generated sector. Rooms you have visited are filled; others are outlines.

const COLORS = {
  room: 'rgba(255,255,255,0.92)', roomEdge: '#9fb3c6', unseen: 'rgba(255,255,255,0.35)', cur: '#d9ecff',
  corridor: 'rgba(255,255,255,0.8)', player: '#ff7a63', npc: '#2f9a64', sentinel: '#4f9fe8', item: '#e0a43a',
  token: '#2fae6a', gate: '#7a5fd0', beacon: '#22aeb9', text: '#4f6170',
};

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
      if (labels && seen) {
        g.fillStyle = COLORS.text;
        g.font = '600 11px Inter, "Segoe UI", sans-serif';
        g.textAlign = 'center';
        g.fillText(r.name, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 4);
        if (r.kind && r.kind !== 'puzzle') {
          g.font = '600 9px Inter, sans-serif';
          g.fillStyle = COLORS.gate;
          g.fillText('★ STORY', (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 17);
        }
      }
    }
    if (map.gate) {
      const [x, y] = P(map.gate[0], map.gate[1]);
      g.fillStyle = COLORS.gate;
      g.beginPath();
      g.arc(x, y, 5, 0, Math.PI * 2);
      g.fill();
    }
    return P;
  }

  drawMarkers(g, P, markers) {
    for (const m of markers) {
      const [x, y] = P(m.x, m.z);
      g.fillStyle = COLORS[m.kind] || '#888';
      g.beginPath();
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
    g.clearRect(0, 0, w, h);
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const r of [...this.data.rooms.map((r) => r.rect), ...(this.data.corridors || [])]) {
      x0 = Math.min(x0, r[0]); z0 = Math.min(z0, r[1]); x1 = Math.max(x1, r[2]); z1 = Math.max(z1, r[3]);
    }
    const pad = 28;
    const scale = Math.min((w - pad * 2) / (x1 - x0 || 1), (h - pad * 2) / (z1 - z0 || 1));
    const P = this.drawWorld(g, this.data, cur, scale, (x0 + x1) / 2, (z0 + z1) / 2, w / 2, h / 2, true);
    this.drawMarkers(g, P, markers);
    this.drawPlayer(g, P, player);
  }
}
