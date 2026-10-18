// THE LAST VERSION OF EARTH: what each temporal state of a place looks like.
//
// The generators build one place; this pass authors its other years on top, as
// decoration only (nothing here collides, so no route a puzzle needs can change):
//   PAST (2026, or the thriving settlement)  scaffolding and site barriers on the buildings,
//                                            lanterns on poles, bare young saplings
//   FUTURE (2196, the beautiful catastrophe)  vines down the facades, gardens on the roofs,
//                                            moss over the streets and floors, fallen slabs
//   INVERTED                                  debris hanging in the air where it will land,
//                                            or has landed - reality behaving incorrectly
// PRESENT is the place as the generator made it. Each state also brings its own
// weather (main.js eases the tint; the runtime swaps the weather). Pieces of one
// kind in one state are merged into a single mesh (DeckWorld's `dress` elements).
import { Rng } from '../../gen/rng.js';

const BUILDING = new Set(['facade', 'industrial', 'stone', 'glassWall', 'bark', 'pods']);

// the weather each state brings to an open district (interiors keep their own)
export function stateWeather(state, palette) {
  if (state === 'FUTURE') return 'pollen';
  if (state === 'INVERTED') return 'stardust';
  if (state === 'PAST') return palette.weather === 'rain' || palette.weather === 'storm' ? null : palette.weather || null;
  return palette.weather || null;
}

export function dressStates(level, states, seed = 'lv') {
  const has = (s) => states.includes(s);
  if (!has('PAST') && !has('FUTURE') && !has('INVERTED')) return 0;
  const rng = Rng.from(seed, level.id, 'dress');
  const out = [];
  const add = (box, mat, when, room) => out.push({ box, mat, when, room, solid: false, dress: true });
  if (level.zone) {
    const rid = level.order[0];
    const room = level.rooms[rid];
    const [bx0, , bz0, bx1, bH, bz1] = room.bounds[0];
    const bldg = level.elements.filter((e) => !e.when && !e.echo && BUILDING.has(e.mat) && e.box[4] - e.box[1] >= 4 && e.box[3] - e.box[0] >= 3 && e.box[5] - e.box[2] >= 3);
    for (const e of bldg) {
      const [x0, y0, z0, x1, y1, z1] = e.box;
      const h = y1 - y0;
      // the face toward the avenue (x = 0)
      const fx = Math.abs(x0) < Math.abs(x1) ? x0 : x1, out1 = fx === x0 ? -1 : 1;
      if (has('FUTURE')) {
        const n = 1 + rng.int(0, 2);
        for (let k = 0; k < n; k++) {
          const zc = rng.float(z0 + 0.6, z1 - 0.6), w = rng.float(0.5, 1.4), len = h * rng.float(0.45, 0.95);
          add([fx + out1 * 0.02 - 0.09, y1 - len, zc - w, fx + out1 * 0.02 + 0.09, y1, zc + w], 'leaf', '@FUTURE', rid);
        }
        if (rng.chance(0.55)) add([x0 + 0.3, y1, z0 + 0.3, x1 - 0.3, y1 + 0.35, z1 - 0.3], 'moss', '@FUTURE', rid);
        if (rng.chance(0.35)) {
          const sx = fx + out1 * rng.float(1.5, 3.5), sz = rng.float(z0, z1);
          add([sx - 1.6, 0, sz - 0.5, sx + 1.6, 0.35, sz + 0.5], 'industrial', '@FUTURE', rid); // a fallen slab
        }
      }
      if (has('PAST') && rng.chance(0.4)) {
        // scaffolding on the street face: poles, two decks of planks
        const sx = fx + out1 * 0.9, za = z0, zb = z1;
        const top = Math.min(h, 9);
        for (const zz of [za + 0.3, (za + zb) / 2, zb - 0.3]) add([sx - 0.07, 0, zz - 0.07, sx + 0.07, top, zz + 0.07], 'trimDark', '@PAST', rid);
        for (const yy of [top * 0.45, top * 0.9]) add([sx - 0.45, yy - 0.08, za, sx + 0.45, yy, zb], 'crate', '@PAST', rid);
      }
    }
    // the streets
    for (let k = 0; k < 26; k++) {
      const x = rng.float(bx0 + 4, bx1 - 4), z = rng.float(bz0 + 6, bz1 - 6), w = rng.float(0.8, 2.6), d = rng.float(0.8, 3.2);
      if (has('FUTURE')) add([x - w, 0.005, z - d, x + w, 0.04, z + d], 'moss', '@FUTURE', rid);
      if (has('INVERTED') && k < 22) {
        const y = rng.float(2.2, Math.min(9, bH - 2)), s = rng.float(0.15, 0.55);
        add([x - s, y - s * 0.6, z - s, x + s, y + s * 0.6, z + s], k % 3 ? 'prop' : 'trimDark', '@INVERTED', rid);
      }
      if (has('PAST') && k < 10) {
        const lx = rng.chance(0.5) ? -6.2 : 6.2, lz = rng.float(bz0 + 8, -6);
        add([lx - 0.06, 0, lz - 0.06, lx + 0.06, 2.6, lz + 0.06], 'trimDark', '@PAST', rid);
        add([lx - 0.2, 2.6, lz - 0.2, lx + 0.2, 2.95, lz + 0.2], 'lamp', '@PAST', rid);
      }
    }
  } else {
    // interiors: a dressing per room, inside its map rectangle
    for (const r of level.map.rooms) {
      const room = level.rooms[r.id];
      const [x0, z0, x1, z1] = r.rect;
      const H = room?.H || 6;
      const W = x1 - x0, D = z1 - z0;
      if (W < 3 || D < 3) continue;
      for (let k = 0; k < 6; k++) {
        const x = rng.float(x0 + 1, x1 - 1), z = rng.float(z0 + 1, z1 - 1);
        if (has('FUTURE')) {
          add([x - rng.float(0.5, 1.6), 0.005, z - rng.float(0.5, 1.8), x + rng.float(0.5, 1.6), 0.03, z + rng.float(0.5, 1.8)], 'moss', '@FUTURE', r.id);
          if (k < 3) add([x - 0.25, H - rng.float(1.2, 2.6), z - 0.06, x + 0.25, H - 0.02, z + 0.06], 'leaf', '@FUTURE', r.id); // hanging vines
        }
        if (has('INVERTED') && k < 5) {
          const y = rng.float(2.4, Math.max(2.6, H - 1)), s = rng.float(0.12, 0.4);
          add([x - s, y - s * 0.6, z - s, x + s, y + s * 0.6, z + s], 'prop', '@INVERTED', r.id);
        }
      }
      if (has('PAST')) {
        // a corner of the room still being built
        const cx = rng.chance(0.5) ? x0 + 0.5 : x1 - 0.5, cz = rng.chance(0.5) ? z0 + 0.5 : z1 - 0.5;
        add([cx - 0.06, 0, cz - 0.06, cx + 0.06, H - 0.1, cz + 0.06], 'trimDark', '@PAST', r.id);
        add([cx - 0.7, 0, cz - 0.5, cx + 0.7, 0.9, cz + 0.5], 'crate', '@PAST', r.id);
      }
    }
  }
  level.elements.push(...out);
  return out.length;
}
