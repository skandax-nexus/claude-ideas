// THE LAST VERSION OF EARTH: the archetype library (OVERHAUL.md §4.3). Parametric pieces a place
// spec builds with: terrain (ground, terraces, stairs, ramps, water), walls and railings, buildings
// (blocks, towers, roundhouses, longhouses, granaries, tents, pavilions), structures (colonnades,
// arches, bridges, viaducts, canopies, cranes, rings), props and signs, a seeded fill and the edges.
// Each emits colliders and visual pieces through the builder (Place.js); P.E(era, fn) puts
// everything fn builds into those years. Rects are [x0, z0, x1, z1]; y is up; north is -z.
const PI = Math.PI;
const norm = ([x0, z0, x1, z1]) => [Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)];

// --- terrain ---------------------------------------------------------------------------------------------
// a slab of ground at y (its top), registered as terrain
export function ground(P, rect, y, m, o = {}) {
  const [x0, z0, x1, z1] = norm(rect);
  P.setTerrain(x0, z0, x1, z1, y);
  P.box([x0, y - (o.depth ?? 0.6), z0, x1, y, z1], m, { ...o, noShadow: 1 });
}

// ground with holes cut in it (a chamber under a court, a stair coming up through it): the rect is
// split along the holes' edges and every cell outside the holes is laid
export function groundHoles(P, rect, holes, y, m, o = {}) {
  const [x0, z0, x1, z1] = norm(rect);
  const hs = holes.map(norm).filter((h) => h[0] < x1 && h[2] > x0 && h[1] < z1 && h[3] > z0);
  const xs = [...new Set([x0, x1, ...hs.flatMap((h) => [h[0], h[2]]).filter((v) => v > x0 && v < x1)])].sort((a, b) => a - b);
  const zs = [...new Set([z0, z1, ...hs.flatMap((h) => [h[1], h[3]]).filter((v) => v > z0 && v < z1)])].sort((a, b) => a - b);
  for (let i = 0; i < xs.length - 1; i++) {
    // merge the cells of a column into runs
    let run = null;
    for (let j = 0; j < zs.length - 1; j++) {
      const cx = (xs[i] + xs[i + 1]) / 2, cz = (zs[j] + zs[j + 1]) / 2;
      const hole = hs.some((h) => cx > h[0] && cx < h[2] && cz > h[1] && cz < h[3]);
      if (!hole) run = run ? [run[0], zs[j + 1]] : [zs[j], zs[j + 1]];
      if ((hole || j === zs.length - 2) && run) {
        P.box([xs[i], y - (o.depth ?? 0.6), run[0], xs[i + 1], y, run[1]], m, { noShadow: 1 });
        run = null;
      }
    }
  }
  P.setTerrain(x0, z0, x1, z1, y);
}

// a raised terrace with retaining walls on its open sides (sides: 'NESW' which to face)
export function terrace(P, rect, y, m, o = {}) {
  const [x0, z0, x1, z1] = norm(rect);
  const base = o.base ?? 0;
  P.setTerrain(x0, z0, x1, z1, y);
  P.col([x0, base - 0.6, z0, x1, y, z1]);
  P.plane(x0, z0, x1, z1, y + 0.01, m, { noShadow: 1 });
  const wm = o.wall || P.style.base || 'drystone';
  const sides = o.sides ?? 'NESW';
  const t = 0.5;
  if (sides.includes('N')) P.vbox([x0, base - 0.6, z0, x1, y, z0 + t], wm);
  if (sides.includes('S')) P.vbox([x0, base - 0.6, z1 - t, x1, y, z1], wm);
  if (sides.includes('W')) P.vbox([x0, base - 0.6, z0, x0 + t, y, z1], wm);
  if (sides.includes('E')) P.vbox([x1 - t, base - 0.6, z0, x1, y, z1], wm);
  if (o.cap) {
    // a coping course along the open edges
    if (sides.includes('S')) P.vbox([x0, y, z1 - 0.6, x1, y + 0.25, z1], o.cap);
    if (sides.includes('N')) P.vbox([x0, y, z0, x1, y + 0.25, z0 + 0.6], o.cap);
  }
}

// a straight stair from (x0, y0, z0) to (x1, y1, z1), w wide; rises of at most 0.34 m (the engine walks up 0.35 m from the ground)
export function stair(P, x0, z0, y0, x1, z1, y1, w, m, o = {}) {
  const rise = Math.abs(y1 - y0);
  const n = Math.max(1, Math.ceil(rise / (o.rise || 0.34)));
  const dx = (x1 - x0) / n, dz = (z1 - z0) / n, dy = (y1 - y0) / n;
  const along = Math.abs(dx) > Math.abs(dz) ? 'x' : 'z';
  const hw = w / 2;
  for (let i = 0; i < n; i++) {
    const cx = x0 + dx * (i + 0.5), cz = z0 + dz * (i + 0.5);
    const top = y0 + dy * (i + 1);
    const lo = Math.min(y0, y1) - 0.3;
    const tx = Math.abs(dx) / 2 + 0.02, tz = Math.abs(dz) / 2 + 0.02;
    const b = along === 'x' ? [cx - tx, lo, cz - hw, cx + tx, dy > 0 ? top : y0 + dy * i, cz + hw] : [cx - hw, lo, cz - tz, cx + hw, dy > 0 ? top : y0 + dy * i, cz + tz];
    P.box(b, m, { noShadow: 1, ...o });
  }
  if (o.rail) {
    for (const s of [-1, 1]) {
      const ox = along === 'x' ? 0 : s * (hw + 0.05), oz = along === 'x' ? s * (hw + 0.05) : 0;
      const len = Math.hypot(x1 - x0, z1 - z0);
      const ang = Math.atan2(y1 - y0, len);
      P.obox((x0 + x1) / 2 + ox, (y0 + y1) / 2 + 0.95, (z0 + z1) / 2 + oz, along === 'x' ? Math.hypot(len, rise) : 0.06, 0.06, along === 'x' ? 0.06 : Math.hypot(len, rise), 0, o.rail, { rz: along === 'x' ? Math.sign(dx) * ang : 0, rx: along === 'z' ? -Math.sign(dz) * ang : 0, noShadow: 1 });
    }
  }
  return n;
}

// a ramp over a rect rising y0 → y1 toward dir ('N' -z, 'S' +z, 'E' +x, 'W' -x): a smooth visual slope
// over stepped invisible colliders (0.25 m a step, walked up by the engine's 0.35 m step)
export function ramp(P, rect, y0, y1, dir, m, o = {}) {
  const [x0, z0, x1, z1] = norm(rect);
  const alongX = dir === 'E' || dir === 'W';
  const len = alongX ? x1 - x0 : z1 - z0;
  const n = Math.max(2, Math.ceil(Math.abs(y1 - y0) / 0.25));
  for (let i = 0; i < n; i++) {
    const f0 = i / n, f1 = (i + 1) / n;
    const top = y0 + (y1 - y0) * (i + 1) / n;
    let b;
    if (dir === 'S') b = [x0, Math.min(y0, y1) - 0.5, z0 + len * f0, x1, top, z0 + len * f1];
    else if (dir === 'N') b = [x0, Math.min(y0, y1) - 0.5, z1 - len * f1, x1, top, z1 - len * f0];
    else if (dir === 'E') b = [x0 + len * f0, Math.min(y0, y1) - 0.5, z0, x0 + len * f1, top, z1];
    else b = [x1 - len * f1, Math.min(y0, y1) - 0.5, z0, x1 - len * f0, top, z1];
    P.col(b);
  }
  const ang = Math.atan2(y1 - y0, len);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, cy = (y0 + y1) / 2;
  const hyp = Math.hypot(len, y1 - y0);
  const th = 0.4;
  if (alongX) P.obox(cx, cy - th / 2, cz, hyp, th, z1 - z0, 0, m, { rz: dir === 'E' ? ang : -ang, noShadow: 1 });
  else P.obox(cx, cy - th / 2, cz, x1 - x0, th, hyp, 0, m, { rx: dir === 'S' ? -ang : ang, noShadow: 1 });
  if (o.terrain !== false) P.setTerrain(x0, z0, x1, z1, Math.max(y0, y1) - 0.01);
}

// water at surface y over a rect: deep water has no floor (falling in sends Kai back to the
// checkpoint, under the room's killY) unless wade: a floor 0.6 m under the surface
export function water(P, rect, y, m = 'water', o = {}) {
  const [x0, z0, x1, z1] = norm(rect);
  P.plane(x0, z0, x1, z1, y, m, { noShadow: 1 });
  if (o.bed !== false) P.vbox([x0, y - (o.depth ?? 2.5) - 0.4, z0, x1, y - (o.depth ?? 2.5), z1], o.bedMat || 'mud', { noShadow: 1 });
  if (o.wade) P.col([x0, y - 1.2, z0, x1, y - 0.6, z1]);
}

// --- walls -------------------------------------------------------------------------------------------------
// a wall from (x0, z0) to (x1, z1), h high and t thick, standing on y; openings: [[from, to, y0, y1]] along it
export function wall(P, x0, z0, x1, z1, h, t, m, o = {}) {
  const y = o.y ?? 0;
  const len = Math.hypot(x1 - x0, z1 - z0);
  const ux = (x1 - x0) / len, uz = (z1 - z0) / len;
  const ry = Math.atan2(ux, uz);
  const spans = [];
  const ops = (o.openings || []).slice().sort((a, b) => a[0] - b[0]);
  let u = 0;
  for (const [a, b, oy0 = 0, oy1 = h] of ops) {
    if (a > u) spans.push([u, a, 0, h]);
    if (oy0 > 0) spans.push([a, b, 0, oy0]);
    if (oy1 < h) spans.push([a, b, oy1, h]);
    u = b;
  }
  if (u < len) spans.push([u, len, 0, h]);
  const axis = Math.abs(ux) < 1e-6 || Math.abs(uz) < 1e-6;
  for (const [a, b, h0, h1] of spans) {
    const ca = (a + b) / 2;
    const cx = x0 + ux * ca, cz = z0 + uz * ca;
    if (axis) {
      const hx = Math.abs(ux) * (b - a) / 2 + Math.abs(uz) * t / 2, hz = Math.abs(uz) * (b - a) / 2 + Math.abs(ux) * t / 2;
      P.box([cx - hx, y + h0, cz - hz, cx + hx, y + h1, cz + hz], m, o);
    } else {
      P.obox(cx, y + h0, cz, t, h1 - h0, b - a, ry, m, { ...o, solid: false });
      // a diagonal wall collides as short axis-aligned segments
      const n = Math.max(1, Math.ceil((b - a) / 1.5));
      for (let i = 0; i < n; i++) {
        const c = a + (b - a) * (i + 0.5) / n;
        const px = x0 + ux * c, pz = z0 + uz * c, r = Math.max(t / 2, (b - a) / n / 2 * 0.75);
        if (o.solid !== false) P.col([px - r, y + h0, pz - r, px + r, y + h1, pz + r], o);
      }
    }
  }
}

// a railing or parapet: a low wall whose collider is taller (nobody climbs over it)
export function railing(P, x0, z0, x1, z1, h, m, o = {}) {
  const y = o.y ?? 0;
  wall(P, x0, z0, x1, z1, h, o.t ?? 0.2, m, { ...o, solid: false, y });
  if (o.solid !== false) wall(P, x0, z0, x1, z1, o.block ?? 1.6, 0.3, m, { ...o, vis: false, y });
}

// --- buildings ----------------------------------------------------------------------------------------------
// a block: footprint rect, standing on y, h tall (or floors × fh); a facade material and tint; a roof
// (flat with a parapet, gable along its longer side, hip, mansard or none); an optional lit shopfront
// on one side, a cornice, rooftop units; walkable flat roof when o.roofWalk
export function block(P, o) {
  const [x0, z0, x1, z1] = norm(o.rect);
  const y = o.y ?? P.heightAt((x0 + x1) / 2, (z0 + z1) / 2);
  const h = o.h ?? (o.floors || 4) * (o.fh || 3.4);
  const m = o.facade || P.style.facade;
  const t = o.tint ?? P.rng.pick(P.style.tints || [0xffffff]);
  const W = x1 - x0, D = z1 - z0;
  P.box([x0, y, z0, x1, y + h, z1], m, { t, solid: o.solid !== false });
  P.blocks.push([x0, z0, x1, z1]);
  P.reserve(x0, z0, x1, z1);
  const roof = o.roof || 'flat';
  const rm = o.roofMat || P.style.roof;
  if (roof === 'flat') {
    P.vbox([x0 - 0.15, y + h, z0 - 0.15, x1 + 0.15, y + h + 0.3, z1 + 0.15], rm);
    if (o.parapet !== false) for (const b of [[x0 - 0.15, z0 - 0.15, x1 + 0.15, z0 + 0.15], [x0 - 0.15, z1 - 0.15, x1 + 0.15, z1 + 0.15], [x0 - 0.15, z0, x0 + 0.15, z1], [x1 - 0.15, z0, x1 + 0.15, z1]]) P.vbox([b[0], y + h + 0.3, b[1], b[2], y + h + 1.0, b[3]], o.trim || P.style.trim || 'concrete');
    if (o.roofWalk) P.col([x0, y + h, z0, x1, y + h + 0.3, z1]);
    for (let k = o.units ?? (W * D > 150 ? P.rng.int(1, 3) : 0); k > 0; k--) {
      const ux = P.rng.float(x0 + 1.5, x1 - 2.5), uz = P.rng.float(z0 + 1.5, z1 - 2.5);
      P.vbox([ux, y + h + 0.3, uz, ux + 1.4, y + h + 1.4, uz + 1.0], 'steel', { prop: 1 });
    }
  } else if (roof === 'gable') {
    const along = o.ridge || (W >= D ? 'x' : 'z');
    const rh = o.roofH ?? Math.min(W, D) * 0.45;
    if (along === 'x') P.gable((x0 + x1) / 2, y + h, (z0 + z1) / 2, D + 0.6, W + 0.6, rh, PI / 2, rm);
    else P.gable((x0 + x1) / 2, y + h, (z0 + z1) / 2, W + 0.6, D + 0.6, rh, 0, rm);
    if (o.dormers) for (let i = 0; i < o.dormers; i++) {
      const f = (i + 0.5) / o.dormers;
      if (along === 'x') P.obox(x0 + W * f, y + h + 0.2, z1 - 0.2 - D * 0.18, 1.4, 1.5, 1.6, 0, m, { t });
      else P.obox(x1 - 0.2 - W * 0.18, y + h + 0.2, z0 + D * f, 1.6, 1.5, 1.4, 0, m, { t });
    }
    if (o.chimney) P.vbox([x0 + W * 0.25, y + h, z0 + D * 0.3, x0 + W * 0.25 + 0.8, y + h + rh + 1.0, z0 + D * 0.3 + 0.8], o.chimneyMat || 'brickWall');
  } else if (roof === 'hip') {
    P.hip((x0 + x1) / 2, y + h, (z0 + z1) / 2, W + 0.6, D + 0.6, o.roofH ?? Math.min(W, D) * 0.35, 0, rm);
  } else if (roof === 'mansard') {
    P.hip((x0 + x1) / 2, y + h, (z0 + z1) / 2, W + 0.4, D + 0.4, o.roofH ?? 3.2, 0, rm, { top: 0.72 });
  }
  if (o.cornice) P.vbox([x0 - 0.3, y + h - 0.5, z0 - 0.3, x1 + 0.3, y + h - 0.1, z1 + 0.3], o.cornice === true ? P.style.trim : o.cornice);
  if (o.shop) {
    for (const side of [].concat(o.shop.side || 'W')) {
      const sm = o.shop.mat || 'shopLit';
      const g = 0.06, inset = Math.min(1.2, (side === 'W' || side === 'E' ? D : W) * 0.12);
      if (side === 'W') P.vbox([x0 - g - 0.04, y + 0.3, z0 + inset, x0 - g, y + 3.2, z1 - inset], sm);
      if (side === 'E') P.vbox([x1 + g, y + 0.3, z0 + inset, x1 + g + 0.04, y + 3.2, z1 - inset], sm);
      if (side === 'N') P.vbox([x0 + inset, y + 0.3, z0 - g - 0.04, x1 - inset, y + 3.2, z0 - g], sm);
      if (side === 'S') P.vbox([x0 + inset, y + 0.3, z1 + g, x1 - inset, y + 3.2, z1 + g + 0.04], sm);
      // the shopfront's frame: mullions every 2.4 m or so and a transom, so it reads as windows and a door
      {
        const alongZ = side === 'W' || side === 'E';
        const a0 = (alongZ ? z0 : x0) + inset, a1 = (alongZ ? z1 : x1) - inset, n = Math.max(1, Math.round((a1 - a0) / 2.4));
        const f = side === 'W' ? x0 - g - 0.1 : side === 'E' ? x1 + g + 0.1 : side === 'N' ? z0 - g - 0.1 : z1 + g + 0.1;
        const bar = (u0, u1, v0, v1) => P.vbox(alongZ ? [f - 0.05, v0, u0, f + 0.05, v1, u1] : [u0, v0, f - 0.05, u1, v1, f + 0.05], o.shop.frame || 'ironDark', { prop: 1, noShadow: 1 });
        for (let i = 0; i <= n; i++) {
          const u = a0 + ((a1 - a0) * i) / n;
          bar(u - 0.07, u + 0.07, y + 0.3, y + 3.2);
        }
        bar(a0, a1, y + 2.45, y + 2.55);
        bar(a0, a1, y + 0.25, y + 0.45);
      }
      if (o.shop.awning) {
        const am = o.shop.awning;
        if (side === 'W') P.vbox([x0 - 1.6, y + 3.3, z0 + inset, x0, y + 3.45, z1 - inset], am, { prop: 1 });
        if (side === 'E') P.vbox([x1, y + 3.3, z0 + inset, x1 + 1.6, y + 3.45, z1 - inset], am, { prop: 1 });
        if (side === 'N') P.vbox([x0 + inset, y + 3.3, z0 - 1.6, x1 - inset, y + 3.45, z0], am, { prop: 1 });
        if (side === 'S') P.vbox([x0 + inset, y + 3.3, z1, x1 - inset, y + 3.45, z1 + 1.6], am, { prop: 1 });
      }
      const [gx, gz] = side === 'W' ? [x0 - 1.4, (z0 + z1) / 2] : side === 'E' ? [x1 + 1.4, (z0 + z1) / 2] : side === 'N' ? [(x0 + x1) / 2, z0 - 1.4] : [(x0 + x1) / 2, z1 + 1.4];
      if (o.shop.glow !== false) P.glow(gx, y + 0.02, gz, 3.2, o.shop.color ?? 0xffd9a8);
    }
  }
  return { x0, z0, x1, z1, y, h };
}

// a tall glass tower with a crown
export function tower(P, o) {
  const b = block(P, { ...o, facade: o.facade || P.style.tower, roof: 'flat', parapet: false, units: 0, cornice: false });
  const { x0, z0, x1, z1, y, h } = b;
  P.vbox([x0 + 1, y + h, z0 + 1, x1 - 1, y + h + 2.5, z1 - 1], o.crown || 'steel');
  if (o.mast) P.cyl((x0 + x1) / 2, y + h + 2.5, (z0 + z1) / 2, 0.15, o.mast, 'steel', { seg: 6 });
  return b;
}

// a roundhouse: stone footing, timber or wattle wall, a conical thatch roof; a door facing ry
export function roundhouse(P, o) {
  const { x, z, r = 3.5, h = 2.4, roofH = 4.5, ry = 0 } = o;
  const y = o.y ?? P.heightAt(x, z);
  P.cyl(x, y, z, r + 0.15, 0.7, o.footing || 'drystone', { seg: 14 });
  P.cyl(x, y + 0.7, z, r, h - 0.7, o.wall || 'wattle', { seg: 14 });
  P.cone(x, y + h, z, r + 1.1, roofH, o.roof || P.style.roof || 'thatch', { seg: 14 });
  P.col([x - r * 0.8, y, z - r * 0.8, x + r * 0.8, y + h, z + r * 0.8]);
  // the door: a dark opening on the facing side
  P.obox(x + Math.sin(ry) * (r + 0.02), y, z + Math.cos(ry) * (r + 0.02), 1.1, 1.9, 0.12, ry, 'shadow');
  P.blocks.push([x - r, z - r, x + r, z + r]);
  P.reserve(x - r - 1, z - r - 1, x + r + 1, z + r + 1);
}

// a longhouse: stone footing, timber walls, a long thatched gable
export function longhouse(P, o) {
  const [x0, z0, x1, z1] = norm(o.rect);
  const y = o.y ?? P.heightAt((x0 + x1) / 2, (z0 + z1) / 2);
  const W = x1 - x0, D = z1 - z0;
  P.box([x0, y, z0, x1, y + 0.8, z1], o.footing || 'drystone');
  P.box([x0 + 0.2, y + 0.8, z0 + 0.2, x1 - 0.2, y + (o.h || 2.8), z1 - 0.2], o.wall || 'timber');
  const along = W >= D ? 'x' : 'z';
  if (along === 'x') P.gable((x0 + x1) / 2, y + (o.h || 2.8), (z0 + z1) / 2, D + 1.4, W + 1.0, o.roofH || D * 0.7, PI / 2, o.roof || 'thatch');
  else P.gable((x0 + x1) / 2, y + (o.h || 2.8), (z0 + z1) / 2, W + 1.4, D + 1.0, o.roofH || W * 0.7, 0, o.roof || 'thatch');
  P.blocks.push([x0, z0, x1, z1]);
  P.reserve(x0 - 1, z0 - 1, x1 + 1, z1 + 1);
}

// a stilt granary: four posts, a raised store, a small cone roof
export function granary(P, o) {
  const { x, z, s = 2.4 } = o;
  const y = o.y ?? P.heightAt(x, z);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.cyl(x + dx * s * 0.42, y, z + dz * s * 0.42, 0.14, 1.6, 'timber', { seg: 6, solid: true });
  P.box([x - s / 2, y + 1.6, z - s / 2, x + s / 2, y + 3.4, z + s / 2], o.wall || 'wattle');
  P.cone(x, y + 3.4, z, s * 0.9, 2.2, o.roof || 'thatch', { seg: 10 });
}

// a hide tent: a cone of skins on poles
export function tent(P, o) {
  const { x, z, r = 2.2, h = 3.2 } = o;
  const y = o.y ?? P.heightAt(x, z);
  P.cone(x, y, z, r, h, o.m || 'hide', { seg: 9, solid: true });
  P.cyl(x, y + h - 0.2, z, 0.05, 0.9, 'timber', { seg: 4, rx: 0.2 });
}

// a canopy or pavilion: posts and a roof slab (glass, timber or steel)
export function canopy(P, o) {
  const [x0, z0, x1, z1] = norm(o.rect);
  const y = o.y ?? P.heightAt((x0 + x1) / 2, (z0 + z1) / 2);
  const h = o.h ?? 3.2;
  const sx = o.span ?? 6;
  const nx = Math.max(1, Math.round((x1 - x0) / sx)), nz = Math.max(1, Math.round((z1 - z0) / sx));
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
    if (o.edgeOnly && i > 0 && i < nx && j > 0 && j < nz) continue;
    const px = x0 + ((x1 - x0) * i) / nx, pz = z0 + ((z1 - z0) * j) / nz;
    P.cyl(px, y, pz, o.post ?? 0.14, h, o.postMat || 'steel', { seg: 8, solid: true });
  }
  P.vbox([x0 - 0.3, y + h, z0 - 0.3, x1 + 0.3, y + h + (o.thick ?? 0.2), z1 + 0.3], o.roof || 'glassRoof');
  if (o.walk) P.col([x0, y + h, z0, x1, y + h + 0.2, z1]);
}

// a colonnade of columns from a to b, with an entablature
export function colonnade(P, x0, z0, x1, z1, n, h, r, m, o = {}) {
  const y = o.y ?? P.heightAt(x0, z0);
  for (let i = 0; i < n; i++) {
    const f = n === 1 ? 0.5 : i / (n - 1);
    P.cyl(x0 + (x1 - x0) * f, y, z0 + (z1 - z0) * f, r, h, m, { seg: 12, solid: true });
  }
  if (o.beam !== false) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    P.obox((x0 + x1) / 2, y + h, (z0 + z1) / 2, r * 2.4, o.beamH ?? 0.7, len + r * 2, Math.atan2(x1 - x0, z1 - z0), o.beamMat || m);
  }
}

// an arch: two piers and a lintel (or a rounded head) w wide, h tall, d deep, turned ry
export function arch(P, x, z, w, h, d, ry, m, o = {}) {
  const y = o.y ?? P.heightAt(x, z);
  const c = Math.cos(ry), s = Math.sin(ry);
  const pw = o.pier ?? 0.9;
  for (const side of [-1, 1]) {
    const px = x + c * side * (w / 2 + pw / 2), pz = z - s * side * (w / 2 + pw / 2);
    P.obox(px, y, pz, pw, h, d, ry, m, { solid: true });
  }
  P.obox(x, y + h, z, w + pw * 2, o.head ?? 1.0, d, ry, m);
  if (o.round) P.torus(x, y + h - 0.05, z, w / 2, 0.35, m, { arc: PI, ry, seg: 16 });
}

// a bridge from (x0, z0) to (x1, z1), w wide, its deck at y; parapets; optional hump (rise at the middle)
export function bridge(P, x0, z0, x1, z1, w, y, m, o = {}) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const ux = (x1 - x0) / len, uz = (z1 - z0) / len;
  const hump = o.hump || 0;
  const n = hump ? 8 : 1;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * len, b = ((i + 1) / n) * len;
    const yy = y + hump * Math.sin(PI * ((i + 0.5) / n));
    const cx = x0 + ux * (a + b) / 2, cz = z0 + uz * (a + b) / 2;
    const hx = Math.abs(ux) * (b - a) / 2 + Math.abs(uz) * w / 2 + 0.01, hz = Math.abs(uz) * (b - a) / 2 + Math.abs(ux) * w / 2 + 0.01;
    P.box([cx - hx, yy - (o.thick ?? 0.6), cz - hz, cx + hx, yy, cz + hz], m, { noShadow: 0 });
    if (o.parapet !== false) for (const s of [-1, 1]) {
      const px = cx + uz * s * (w / 2 - 0.15), pz = cz - ux * s * (w / 2 - 0.15);
      const phx = Math.abs(ux) * (b - a) / 2 + Math.abs(uz) * 0.15, phz = Math.abs(uz) * (b - a) / 2 + Math.abs(ux) * 0.15;
      P.vbox([px - phx, yy, pz - phz, px + phx, yy + (o.parapetH ?? 1.0), pz + phz], o.parapetMat || m);
      P.col([px - phx, yy, pz - phz, px + phx, yy + 1.6, pz + phz]);
    }
  }
  // piers under the deck
  if (o.piers) for (let i = 1; i < o.piers; i++) {
    const f = i / o.piers, cx = x0 + (x1 - x0) * f, cz = z0 + (z1 - z0) * f;
    P.obox(cx, o.footY ?? y - 4, cz, w - 0.4, (y - 0.6) - (o.footY ?? y - 4), 1.6, Math.atan2(ux, uz), m, { solid: true });
  }
}

// a viaduct: a raised deck on piers with arches, from a to b at height h
export function viaduct(P, x0, z0, x1, z1, h, w, m, o = {}) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const ux = (x1 - x0) / len, uz = (z1 - z0) / len;
  const span = o.span ?? 9;
  const n = Math.max(1, Math.round(len / span));
  const ry = Math.atan2(ux, uz);
  const y = o.y ?? 0;
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    P.obox(x0 + (x1 - x0) * f, y, z0 + (z1 - z0) * f, w, h - 1.2, 1.6, ry, m, { solid: o.solid !== false });
  }
  P.obox((x0 + x1) / 2, y + h - 1.2, (z0 + z1) / 2, w, 1.2, len + 1.6, ry, m);
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n;
    // (o.under: the arches hang under the deck between the piers)
    if (o.under) P.torus(x0 + (x1 - x0) * f, y + h - 1.2, z0 + (z1 - z0) * f, (len / n - 1.6) / 2, 0.35, m, { arc: PI, ry: ry + PI / 2, rz: PI, seg: 10 });
    else P.torus(x0 + (x1 - x0) * f, y + h - 1.6 - (span - 1.6) / 2 * 0.0, z0 + (z1 - z0) * f, (span - 1.6) / 2, 0.35, m, { arc: PI, ry: ry + PI / 2, seg: 10 });
  }
  if (o.walk) P.col([Math.min(x0, x1) - w / 2, y + h - 1.2, Math.min(z0, z1) - w / 2, Math.max(x0, x1) + w / 2, y + h, Math.max(z0, z1) + w / 2]);
}

// a tower crane: mast, jib, counter-jib, cab
export function crane(P, x, z, h, jib, ry, o = {}) {
  const y = o.y ?? P.heightAt(x, z);
  const m = o.m || 'craneYellow';
  P.obox(x, y, z, 1.6, h, 1.6, 0, m, { solid: true });
  const c = Math.sin(ry), s = Math.cos(ry);
  P.obox(x + c * jib / 2, y + h, z + s * jib / 2, 1.2, 1.1, jib, ry, m);
  P.obox(x - c * 6, y + h, z - s * 6, 1.4, 1.2, 12, ry, m);
  P.obox(x - c * 10, y + h - 1.6, z - s * 10, 2.2, 1.8, 2.6, ry, 'concrete');
  P.obox(x, y + h + 1.1, z, 0.6, 6, 0.6, 0, m);
  P.obox(x + c * 1.4, y + h - 2.2, z + s * 1.4, 1.6, 2.0, 1.8, ry, 'steel');
  if (o.hook !== false) P.obox(x + c * jib * 0.7, y + h - 14, z + s * jib * 0.7, 0.06, 14, 0.06, 0, 'steel');
}

// a ring of standing stones (R radius, n stones h tall) with an optional bronze band
export function ringStones(P, x, y, z, R, n, h, o = {}) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2;
    const sx = x + Math.cos(a) * R, sz = z + Math.sin(a) * R;
    const w = o.w ?? 2.2, d = o.d ?? 1.2;
    P.obox(sx, y, sz, w, h * (0.92 + 0.16 * Math.sin(i * 2.3)), d, -a + PI / 2, o.m || 'standingStone', { solid: true, shrink: 0.8 });
  }
  if (o.band) P.torus(x, y + h * 0.78, z, R, 0.22, o.band, { rx: PI / 2, seg: 64 });
  if (o.lintels) for (let i = 0; i < n; i += 2) {
    const a = ((i + 0.5) / n) * PI * 2;
    P.obox(x + Math.cos(a) * R, y + h, z + Math.sin(a) * R, (2 * PI * R) / n + 1, 0.8, 1.2, -a + PI / 2, o.m || 'standingStone');
  }
}

// --- signs and props -------------------------------------------------------------------------------------------
// a written sign on a board (a level text); ancient places use glyphs() instead
export function sign(P, text, x, y, z, rotY, o = {}) {
  const w = o.board ?? Math.max(1, text.length * (o.size || 0.4) * 0.62 + 0.4);
  const h = (o.size || 0.4) * 1.6;
  const fx = Math.sin(rotY) * 0.06, fz = Math.cos(rotY) * 0.06;
  if (o.board !== 0) P.obox(x - fx, y - h / 2, z - fz, w, h, 0.08, rotY, o.boardMat || 'signBoard', { prop: o.prop });
  return P.text(text, [x + fx * 0.4, y, z + fz * 0.4], rotY, { size: o.size || 0.4, color: o.color || '#f4ead8', when: o.when, e: o.e, w: o.w });
}

// a panel of carved glyphs (no letters): the ancient places' inscriptions
export function glyphs(P, x, y, z, w, h, ry, o = {}) {
  P.obox(x, y, z, w, h, o.d ?? 0.35, ry, o.m || 'glyphStone', { solid: o.solid, prop: o.prop });
}

// small things: each a few pieces, culled beyond 90 m (Scenery.js); solid when large enough to bump into
export function prop(P, kind, x, z, ry = 0, o = {}) {
  const y = o.y ?? P.heightAt(x, z);
  const S = (b, m, q = {}) => P.vbox(b, m, { prop: 1, ...q });
  const C = (b) => o.solid !== false && P.col(b);
  const c = Math.cos(ry), s = Math.sin(ry);
  const at = (dx, dz) => [x + dx * c + dz * s, z - dx * s + dz * c];
  const ob = (dx, dy, dz, w, h, d, m, q = {}) => {
    const [px, pz] = at(dx, dz);
    P.obox(px, y + dy, pz, w, h, d, ry, m, { prop: 1, ...q });
  };
  // the AABB of a turned rectangle (half sizes hw across, hd deep), h high
  const rb = (hw, hd, h, dx = 0, dz = 0) => {
    const [px, pz] = at(dx, dz);
    const ex = Math.abs(c) * hw + Math.abs(s) * hd, ez = Math.abs(s) * hw + Math.abs(c) * hd;
    return [px - ex, y, pz - ez, px + ex, y + h, pz + ez];
  };
  switch (kind) {
    case 'bench':
      ob(0, 0.42, 0, 1.8, 0.08, 0.5, 'wood');
      ob(0, 0.5, -0.24, 1.8, 0.45, 0.06, 'wood');
      ob(-0.8, 0, 0, 0.08, 0.42, 0.5, 'ironDark');
      ob(0.8, 0, 0, 0.08, 0.42, 0.5, 'ironDark');
      C(rb(0.9, 0.3, 0.5));
      break;
    case 'bollard':
      P.cyl(x, y, z, 0.12, 0.9, o.m || 'steel', { seg: 8, prop: 1 });
      if (o.lit) P.cyl(x, y + 0.7, z, 0.13, 0.12, o.lit, { seg: 8, prop: 1 });
      C([x - 0.15, y, z - 0.15, x + 0.15, y + 0.9, z + 0.15]);
      break;
    case 'lampPost':
      P.cyl(x, y, z, 0.09, 4.6, 'ironDark', { seg: 6, prop: 1 });
      ob(0.5, 4.5, 0, 1.1, 0.1, 0.12, 'ironDark');
      ob(1.0, 4.35, 0, 0.5, 0.18, 0.32, 'lampGlow');
      P.glow(at(1.0, 0)[0], y + 0.02, at(1.0, 0)[1], 3.2, o.color ?? 0xffd8a0, 4.3);
      C([x - 0.12, y, z - 0.12, x + 0.12, y + 4.4, z + 0.12]);
      break;
    case 'tramPole':
      P.cyl(x, y, z, 0.12, 7, 'ironDark', { seg: 6, prop: 1 });
      C([x - 0.14, y, z - 0.14, x + 0.14, y + 7, z + 0.14]);
      break;
    case 'busShelter':
      ob(0, 0, -0.9, 3.6, 2.5, 0.06, 'glass');
      ob(-1.8, 0, 0, 0.06, 2.5, 1.8, 'glass');
      ob(0, 2.5, 0, 3.8, 0.12, 2.0, 'steel');
      ob(0, 0.45, -0.7, 2.6, 0.06, 0.4, 'steel');
      ob(1.8, 0.4, -0.85, 0.1, 2.0, 1.0, 'adLit');
      C(rb(1.9, 0.2, 2.5, 0, -0.9));
      break;
    case 'stall': {
      ob(0, 0, 0, 2.4, 0.9, 1.2, o.m || 'wood');
      ob(0, 0.9, 0.1, 2.3, 0.15, 1.0, o.goods || 'produce');
      for (const dx of [-1.15, 1.15]) ob(dx, 0, -0.5, 0.08, 2.4, 0.08, 'steel');
      ob(0, 2.4, 0, 2.8, 0.08, 1.8, o.awning || 'awningRed');
      C(rb(1.3, 0.7, 1.0));
      break;
    }
    case 'kiosk':
      ob(0, 0, 0, 2.2, 2.6, 2.2, o.m || 'kioskGreen');
      ob(0, 2.6, 0, 2.6, 0.2, 2.6, 'ironDark');
      C([x - 1.1, y, z - 1.1, x + 1.1, y + 2.6, z + 1.1]);
      break;
    case 'booth':
      ob(0, 0, 0, 2.2, 2.6, 2.0, o.m || 'helixWhite');
      ob(0, 1.0, 1.01, 1.8, 1.2, 0.04, 'glass');
      ob(0, 2.6, 0, 2.6, 0.25, 2.4, 'steel');
      C(rb(1.1, 1.0, 2.6));
      break;
    case 'barrier':
      ob(0, 0, 0, o.w ?? 3, 1.0, 0.25, o.m || 'barrierStripe');
      C(rb((o.w ?? 3) / 2, 0.3, 1.0));
      break;
    case 'car': {
      const m = o.m || P.rng.pick(['carRed', 'carGrey', 'carBlue', 'carWhite']);
      ob(0, 0.3, 0, 1.9, 0.7, 4.3, m);
      ob(0, 1.0, -0.2, 1.7, 0.55, 2.3, 'carGlass');
      for (const [dx, dz] of [[-0.85, -1.4], [0.85, -1.4], [-0.85, 1.4], [0.85, 1.4]]) ob(dx, 0, dz, 0.25, 0.62, 0.62, 'tyre');
      C(rb(1.0, 2.2, 1.5));
      break;
    }
    case 'scooter':
      ob(0, 0.3, 0, 0.35, 0.5, 1.4, 'carRed');
      ob(0, 0.8, -0.55, 0.5, 0.06, 0.06, 'steel');
      break;
    case 'planter':
      ob(0, 0, 0, 1.4, 0.7, 1.4, 'concrete');
      ob(0, 0.7, 0, 1.2, 0.35, 1.2, 'hedge');
      C([x - 0.7, y, z - 0.7, x + 0.7, y + 0.8, z + 0.7]);
      break;
    case 'crate':
      ob(0, 0, 0, 1.1, 0.9, 1.1, o.m || 'wood');
      C([x - 0.6, y, z - 0.6, x + 0.6, y + 0.9, z + 0.6]);
      break;
    case 'barrel':
      P.cyl(x, y, z, 0.42, 1.0, o.m || 'wood', { seg: 10, prop: 1 });
      C([x - 0.4, y, z - 0.4, x + 0.4, y + 1.0, z + 0.4]);
      break;
    case 'bin':
      P.cyl(x, y, z, 0.3, 0.95, 'ironDark', { seg: 8, prop: 1 });
      break;
    case 'phoneBooth':
      ob(0, 0, 0, 1.1, 2.4, 1.1, 'boothRed');
      ob(0, 0.9, 0.56, 0.8, 1.3, 0.02, 'glass');
      C([x - 0.55, y, z - 0.55, x + 0.55, y + 2.4, z + 0.55]);
      break;
    case 'adScreen':
      ob(0, 0, 0, 0.3, 2.8, 0.3, 'steel');
      ob(0, 2.8, 0, o.w ?? 4, o.h ?? 2.2, 0.25, 'adLit');
      C([x - 0.2, y, z - 0.2, x + 0.2, y + 2.8, z + 0.2]);
      break;
    case 'loom':
      ob(0, 0, 0, 1.6, 1.9, 0.12, 'timber');
      ob(0, 0.5, 0.05, 1.4, 1.2, 0.04, 'cloth');
      break;
    case 'rack':
      for (const dx of [-1.2, 1.2]) ob(dx, 0, 0, 0.1, 2.0, 0.1, 'timber');
      ob(0, 1.9, 0, 2.6, 0.08, 0.08, 'timber');
      ob(0, 0.9, 0, 2.2, 1.0, 0.04, o.goods || 'cloth');
      break;
    case 'pots':
      for (let i = 0; i < 4; i++) P.cyl(x + Math.cos(i * 1.7) * 0.6, y, z + Math.sin(i * 1.7) * 0.6, 0.28 + (i % 2) * 0.08, 0.5 + (i % 3) * 0.12, 'terracottaPot', { seg: 8, prop: 1 });
      break;
    case 'cart':
      ob(0, 0.5, 0, 1.4, 0.5, 2.2, 'timber');
      for (const dx of [-0.8, 0.8]) P.cyl(at(dx, 0)[0], y + 0.5, at(dx, 0)[1], 0.5, 0.12, 'timber', { seg: 10, rz: PI / 2, ry, prop: 1 });
      C(rb(0.8, 1.1, 1.0));
      break;
    case 'cairn':
      for (let i = 0; i < 5; i++) P.sphere(x, y + 0.25 + i * 0.32, z, 0.55 - i * 0.09, 'riverStone', { sy: 0.6, prop: 1 });
      C([x - 0.5, y, z - 0.5, x + 0.5, y + 1.2, z + 0.5]);
      break;
    case 'fishRack':
      for (const dx of [-1.5, 0, 1.5]) ob(dx, 0, 0, 0.1, 2.2, 0.1, 'timber');
      ob(0, 2.0, 0, 3.4, 0.06, 0.06, 'timber');
      ob(0, 1.2, 0, 3.0, 0.7, 0.04, 'fish');
      break;
    case 'boat':
      ob(0, 0, 0, 1.4, 0.5, 4.4, 'timber', { rx: 0 });
      ob(0, 0.5, 0, 1.0, 0.1, 3.6, 'shadow');
      break;
    case 'firePit':
      P.cyl(x, y, z, 1.4, 0.35, 'drystone', { seg: 12, prop: 1 });
      P.cone(x, y + 0.2, z, 0.8, 0.9, o.fire === false ? 'ash' : 'fireGlow', { seg: 8, prop: 1 });
      if (o.fire !== false) P.glow(x, y + 0.02, z, 5, 0xff9a40);
      C([x - 1.2, y, z - 1.2, x + 1.2, y + 0.4, z + 1.2]);
      break;
    case 'torch':
      P.cyl(x, y, z, 0.07, 2.2, 'timber', { seg: 5, prop: 1 });
      P.cone(x, y + 2.2, z, 0.16, 0.45, 'fireGlow', { seg: 6, prop: 1 });
      P.glow(x, y + 0.02, z, 2.6, 0xffa050, 2.4);
      break;
    case 'floodlight':
      P.cyl(x, y, z, 0.08, 4.2, 'steel', { seg: 5, prop: 1 });
      ob(0, 4.2, 0, 0.9, 0.5, 0.4, 'lampGlow');
      P.glow(x, y + 0.02, z, 4.5, 0xe8f0ff, 4.4);
      break;
    case 'siteHut':
      ob(0, 0, 0, 6, 2.7, 2.6, 'siteCabin');
      ob(0, 2.7, 0, 6.2, 0.12, 2.8, 'steel');
      ob(1.2, 1.0, 1.31, 1.4, 0.9, 0.04, 'windowWarm');
      C(rb(3, 1.4, 2.7));
      break;
    case 'tarp':
      ob(0, 0, 0, o.w ?? 4, 0.6, o.d ?? 3, 'tarp');
      break;
    case 'chiller':
      ob(0, 0, 0, 3.0, 1.9, 1.6, 'steel');
      P.cyl(at(-0.7, 0)[0], y + 1.9, at(-0.7, 0)[1], 0.6, 0.25, 'ironDark', { seg: 12, prop: 1 });
      P.cyl(at(0.7, 0)[0], y + 1.9, at(0.7, 0)[1], 0.6, 0.25, 'ironDark', { seg: 12, prop: 1 });
      C([x - 1.6, y, z - 1.6, x + 1.6, y + 1.9, z + 1.6]);
      break;
    default:
      ob(0, 0, 0, 1, 1, 1, o.m || 'wood');
  }
}

// --- fill and edges -------------------------------------------------------------------------------------------
// fill a strip with a row of blocks, front to the street side ('W','E','N','S'), skipping reserved rects
export function fill(P, rect, o = {}) {
  const [x0, z0, x1, z1] = norm(rect);
  const alongX = o.along ? o.along === 'x' : x1 - x0 >= z1 - z0;
  const len = alongX ? x1 - x0 : z1 - z0;
  let u = 0;
  const out = [];
  while (u < len - 3) {
    const w = Math.min(len - u, P.rng.float(o.minW ?? 8, o.maxW ?? 16));
    const gap = o.gap ?? 0;
    const r = alongX ? [x0 + u, z0, x0 + u + w - gap, z1] : [x0, z0 + u, x1, z0 + u + w - gap];
    u += w;
    if (!P.isFree(r[0], r[1], r[2], r[3])) continue;
    if (o.skip && P.rng.chance(o.skip)) continue;
    const floors = P.rng.int(o.floors?.[0] ?? 3, o.floors?.[1] ?? 6);
    out.push(block(P, { rect: r, floors, fh: o.fh, facade: o.facade, roof: o.roof, roofMat: o.roofMat, shop: o.shop ? { ...o.shop } : null, cornice: o.cornice, tint: o.tint, dormers: o.dormers, chimney: o.chimney, parapet: o.parapet, units: o.units, solid: o.solid }));
  }
  return out;
}

// the edges of a place: an invisible ring (nobody walks off the map), and what you see there:
// blocks of the city going on, a canal, a viaduct, a hill or a cliff, a hedge, rubble; never a tall wall
export function edges(P, spec) {
  const [x0, z0, x1, z1] = P.spec.bounds;
  const t = 1, H = 40;
  P.col([x0 - t, -12, z0 - t, x0, H, z1 + t]);
  P.col([x1, -12, z0 - t, x1 + t, H, z1 + t]);
  P.col([x0 - t, -12, z0 - t, x1 + t, H, z0]);
  P.col([x0 - t, -12, z1, x1 + t, H, z1 + t]);
  for (const [side, kind] of Object.entries(spec || {})) {
    const strip = side === 'N' ? [x0 - 30, z0 - 40, x1 + 30, z0 - 2] : side === 'S' ? [x0 - 30, z1 + 2, x1 + 30, z1 + 40] : side === 'W' ? [x0 - 40, z0 - 30, x0 - 2, z1 + 30] : [x1 + 2, z0 - 30, x1 + 40, z1 + 30];
    const [sx0, sz0, sx1, sz1] = strip;
    if (kind === 'blocks') {
      const front = side === 'N' ? [sx0, sz1 - 14, sx1, sz1] : side === 'S' ? [sx0, sz0, sx1, sz0 + 14] : side === 'W' ? [sx1 - 14, sz0, sx1, sz1] : [sx0, sz0, sx0 + 14, sz1];
      fill(P, front, { floors: [5, 11], solid: false, minW: 10, maxW: 20, along: side === 'N' || side === 'S' ? 'x' : 'z' });
    } else if (kind === 'cliff' || kind === 'hill' || kind === 'hillStair') {
      const up = kind !== 'cliff';
      for (let i = 0; i < 9; i++) {
        const f = i / 8;
        const cx = side === 'N' || side === 'S' ? sx0 + (sx1 - sx0) * f : (sx0 + sx1) / 2;
        const cz = side === 'N' || side === 'S' ? (sz0 + sz1) / 2 : sz0 + (sz1 - sz0) * f;
        const h = up ? P.rng.float(12, 26) : P.rng.float(4, 9);
        P.obox(cx, up ? -2 : -h - 2, cz, side === 'N' || side === 'S' ? 30 : 38, h + 2, side === 'N' || side === 'S' ? 38 : 30, P.rng.float(-0.3, 0.3), up ? (P.style.hill || 'rockGrass') : 'rock', { rx: P.rng.float(-0.08, 0.08) });
      }
    } else if (kind === 'water' || kind === 'canal' || kind === 'sea') {
      P.plane(sx0, sz0, sx1, sz1, -1.6, 'water', { noShadow: 1 });
    } else if (kind === 'hedge') {
      const b = side === 'N' ? [sx0, sz1 - 2, sx1, sz1] : side === 'S' ? [sx0, sz0, sx1, sz0 + 2] : side === 'W' ? [sx1 - 2, sz0, sx1, sz1] : [sx0, sz0, sx0 + 2, sz1];
      P.vbox([b[0], 0, b[1], b[2], 2.2, b[3]], 'hedge');
    } else if (kind === 'meadow' || kind === 'slope') {
      P.plane(sx0, sz0, sx1, sz1, -0.05, P.style.ground || 'meadow', { noShadow: 1 });
    }
  }
}

// --- (U3) pieces for Acts II-IV and the Finale ----------------------------------------------------------------
// a square stair spiralling up round a core (a tower, a lighthouse, a lattice mast): flights of `per` steps
// along each side, a landing at each corner; half is the half width of the core's square, w the flight width
export function spiralStair(P, cx, cz, y0, y1, half, w, m, o = {}) {
  const per = o.per ?? 6, rise = (y1 - y0) / Math.max(1, Math.round((y1 - y0) / 0.33));
  const r = half + w / 2;
  // the corners, anticlockwise from the south-west (start), and the flights along the sides between them
  const corners = [[cx - r, cz + r], [cx + r, cz + r], [cx + r, cz - r], [cx - r, cz - r]];
  let y = y0, side = o.start ?? 0;
  while (y < y1 - 0.01) {
    const [ax, az] = corners[side % 4], [bx, bz] = corners[(side + 1) % 4];
    // the landing at the corner
    P.box([ax - w / 2, y - 0.3, az - w / 2, ax + w / 2, y, az + w / 2], m, { noShadow: 1 });
    const n = Math.min(per, Math.round((y1 - y) / rise));
    const dx = (bx - ax) / (per + 1), dz = (bz - az) / (per + 1);
    for (let i = 1; i <= n; i++) {
      const sx = ax + dx * i, sz = az + dz * i, top = y + rise * i;
      const hx = Math.abs(dx) > 0.01 ? Math.abs(dx) / 2 + 0.02 : w / 2, hz = Math.abs(dz) > 0.01 ? Math.abs(dz) / 2 + 0.02 : w / 2;
      P.box([sx - hx, top - 0.3, sz - hz, sx + hx, top, sz + hz], m, { noShadow: 1 });
    }
    y += rise * n;
    side++;
    if (n < per) {
      const [ex, ez] = [ax + dx * (n + 1), az + dz * (n + 1)];
      P.box([ex - w / 2 - 0.4, y - 0.3, ez - w / 2 - 0.4, ex + w / 2 + 0.4, y, ez + w / 2 + 0.4], m, { noShadow: 1 });
      return [ex, y, ez];
    }
  }
  const [lx, lz] = corners[side % 4];
  P.box([lx - w / 2, y - 0.3, lz - w / 2, lx + w / 2, y, lz + w / 2], m, { noShadow: 1 });
  return [lx, y, lz];
}

// a lattice mast tapering from `base` to `top` half widths over h: four legs, braces, platforms; solid legs
export function lattice(P, x, z, y0, h, base, top, m, o = {}) {
  const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const at = (f, sx, sz) => { const w = base + (top - base) * f; return [x + sx * w, z + sz * w]; };
  for (const [sx, sz] of legs) {
    const [x0, z0] = at(0, sx, sz), [x1, z1] = at(1, sx, sz);
    const len = Math.hypot(x1 - x0, h, z1 - z0);
    P.obox((x0 + x1) / 2, y0, (z0 + z1) / 2, 0.36, len, 0.36, 0, m, { rx: -Math.atan2(z1 - z0, h), rz: Math.atan2(x1 - x0, h) });
    if (o.solid !== false) P.col([x0 - 0.3, y0, z0 - 0.3, x0 + 0.3, y0 + Math.min(h, 4), z0 + 0.3]);
  }
  const n = o.bays ?? Math.max(3, Math.round(h / 6));
  for (let i = 1; i <= n; i++) {
    const f = i / n, y = y0 + h * f;
    const w = base + (top - base) * f;
    for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) {
      const [xa, za] = [x + a[0] * w, z + a[1] * w], [xb, zb] = [x + b[0] * w, z + b[1] * w];
      P.obox((xa + xb) / 2, y - 0.12, (za + zb) / 2, Math.abs(xb - xa) + 0.2 || 0.2, 0.2, Math.abs(zb - za) + 0.2 || 0.2, 0, m, { noShadow: 1 });
    }
    // a cross brace on two faces
    const wp = base + (top - base) * ((i - 0.5) / n), dy = h / n;
    P.obox(x, y - dy, z - wp, 0.12, Math.hypot(wp * 2, dy), 0.12, 0, m, { rz: Math.atan2(wp * 2, dy), noShadow: 1 });
    P.obox(x - wp, y - dy, z, 0.12, Math.hypot(wp * 2, dy), 0.12, 0, m, { rx: Math.atan2(wp * 2, dy), noShadow: 1 });
  }
  if (o.beacon) P.cyl(x, y0 + h, z, 0.3, 0.6, o.beacon, { seg: 8 });
}

// a shipping container (12 x 2.6 x 2.6), turned ry, standing on y; solid; a stack of n
export function container(P, x, z, ry, m, o = {}) {
  const y = o.y ?? P.heightAt(x, z);
  const n = o.n ?? 1, L = o.len ?? 12, W = 2.5, H = 2.6;
  for (let i = 0; i < n; i++) {
    const mm = Array.isArray(m) ? m[i % m.length] : m;
    P.obox(x, y + i * H, z, W, H - 0.04, L, ry + (i % 2 ? 0.03 : 0), mm, { solid: true, shrink: 0.98 });
  }
  P.blocks.push([x - L / 2, z - L / 2, x + L / 2, z + L / 2].map((v) => Math.round(v)));
}

// a dish antenna on a pedestal: a bowl of radius r opening toward the sky, its axis tilted by tilt toward
// bearing az (degrees); the rim at the bowl's lip, the feed on the axis
export function dish(P, x, z, r, o = {}) {
  const y = o.y ?? P.heightAt(x, z);
  const m = o.m || 'dishWhite';
  P.cyl(x, y, z, 1.6, 1.4, o.base || 'hallConcrete', { seg: 10, solid: true });
  P.obox(x, y + 1.4, z, 1.6, r * 0.75, 1.6, 0, o.yoke || 'steel', { solid: true });
  const t = o.tilt ?? 0.7, a = ((o.az ?? 180) * Math.PI) / 180;
  // (YXZ: turn to face the bearing, then tilt; the axis (sin t sin a, cos t, -sin t cos a))
  const ax = [Math.sin(t) * Math.sin(a), Math.cos(t), -Math.sin(t) * Math.cos(a)];
  const ry = Math.PI - a, hub = y + 1.4 + r * 0.75, d = r * 0.36;
  P.cyl(x, hub, z, r * 0.16, d, m, { r2: r, seg: 20, rx: t, ry });
  P.torus(x + ax[0] * d, hub + ax[1] * d, z + ax[2] * d, r, 0.18, m, { rx: Math.PI / 2 + t, ry, seg: 32 });
  const f = r * 0.85;
  P.cyl(x + ax[0] * f, hub + ax[1] * f - 0.6, z + ax[2] * f, 0.35, 1.2, o.feed || 'steel', { seg: 8 });
  P.cyl(x, hub, z, 0.12, f, o.feed || 'steel', { seg: 5, rx: t, ry }); // (the feed's boom)
  if (o.light) P.sphere(x + ax[0] * f, hub + ax[1] * f + 0.8, z + ax[2] * f, 0.22, o.light);
}

// a gantry crane over a quay: two legs on rails, a beam, a cab; `cab` a climbable stair to the cab platform
export function gantry(P, x, z, span, h, ry, o = {}) {
  const m = o.m || 'craneRed';
  const c = Math.cos(ry), s = Math.sin(ry);
  for (const k of [-1, 1]) {
    const lx = x + c * k * span / 2, lz = z - s * k * span / 2;
    P.obox(lx, 0, lz, 1.4, h, 1.4, ry, m, { solid: true });
    P.obox(lx, 0, lz, 4, 1.2, 1.6, ry, m, { solid: true });
  }
  P.obox(x, h, z, span + 6, 2.2, 2.4, ry + Math.PI / 2, m);
  P.obox(x + s * 18, h + 1.2, z + c * 18, 2.2, 1.6, 34, ry, m);
  P.obox(x, h - 3, z, 3, 2.8, 3, ry, o.cabMat || 'steel');
}
