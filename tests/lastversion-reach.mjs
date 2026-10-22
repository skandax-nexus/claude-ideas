// THE LAST VERSION OF EARTH: can Kai get there? A flood fill over a built level (no browser), used by the unit
// tests (tests/lastversion.test.mjs) and as a report: `node tests/lastversion-reach.mjs [mkey,mkey...]`.
//
// Over-approximate, so what it cannot reach nobody can: a 0.5 m grid of standing heights per year, moved by a step
// (0.35 m up, any drop), a jump (1.15 m up, or across a gap of up to 4 m landing no higher than 1 m), a year switch
// where the body fits, a trigger that carries Kai somewhere (Helix's glass lift) and a wrapping edge. A collider that
// waits on a fact holds Kai up if it stands with every fact unset or with every fact set, and stops him only if it
// stands both ways; a REVERSE process's solid parts hold him up where they rest and where they go back to. Drowning
// water (both ways) and the place's kill height end a path. The targets: every interaction, every person, every
// trigger a thread waits on, and every process's aim within its reach.
import { compileCondition } from '../game/js/core/conditions.js';

const HW = 0.3, BODY = 1.7, EYE = 0.85 + 0.68;

export function reachability(level, deck, o = {}) {
  const C = o.cell || 0.5;
  const states = (deck.states || ['PRESENT']).filter((s) => (!level.years || level.years[s]) && (!o.years || o.years.includes(s)));
  const [bx0, bz0, bx1, bz1] = level.bounds;
  const nx = Math.ceil((bx1 - bx0) / C), nz = Math.ceil((bz1 - bz0) / C), N = nx * nz;
  const killY = Math.min(...Object.values(level.rooms).map((r) => r.killY ?? -3));
  const cond = new Map();
  const holds = (when, st, val) => {
    if (!when) return true;
    let f = cond.get(when);
    if (!f) cond.set(when, (f = compileCondition(when)));
    return !!f({ fact: () => val, state: st });
  };
  // the cells whose footprint (± HW round the centre) a box overlaps
  const span = (lo, hi, b0, n) => [Math.max(0, Math.ceil((lo - HW - b0) / C - 0.5 + 1e-9)), Math.min(n - 1, Math.floor((hi + HW - b0) / C - 0.5 - 1e-9))];
  const per = {};
  for (const st of states) {
    const tops = new Array(N), blk = new Array(N);
    const add = (arr, b, v) => {
      const [i0, i1] = span(b[0], b[3], bx0, nx), [j0, j1] = span(b[2], b[5], bz0, nz);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) (arr[i * nz + j] ||= []).push(v);
    };
    for (const e of level.elements) {
      if (!e.solid) continue;
      const a = holds(e.when, st, false), b = holds(e.when, st, true);
      if (a || b) add(tops, e.box, e.box[4]);
      if (a && b) add(blk, e.box, [e.box[1], e.box[4]]);
    }
    for (const p of level.processes || []) {
      if (p.when && !holds(p.when, st, false) && !holds(p.when, st, true)) continue;
      for (const part of p.parts) {
        if (!part.solid) continue;
        add(tops, part.box, part.box[4]);
        const d = part.rest.p.map((v, k) => v - part.origin.p[k]);
        add(tops, [part.box[0] + d[0], part.box[1] + d[1], part.box[2] + d[2], part.box[3] + d[0], part.box[4] + d[1], part.box[5] + d[2]], part.box[4] + d[1]);
      }
    }
    for (let k = 0; k < N; k++) if (tops[k]) tops[k] = [...new Set(tops[k])].sort((a, b) => b - a);
    const drowns = (level.drowns || []).filter((d) => holds(d.when, st, false) && holds(d.when, st, true)).map((d) => d.box);
    per[st] = { tops, blk, drowns };
  }
  const xOf = (i) => bx0 + (i + 0.5) * C, zOf = (j) => bz0 + (j + 0.5) * C;
  const clear = (st, k, h, top = h + BODY) => {
    const l = per[st].blk[k];
    if (l) for (const [y0, y1] of l) if (y0 < top && y1 > h + 0.02) return false;
    return true;
  };
  const drowned = (st, x, z, h) => per[st].drowns.some((b) => x >= b[0] && x <= b[3] && z >= b[2] && z <= b[5] && h + 0.85 <= b[4]);
  const land = (st, k, h) => {
    for (const t of per[st].tops[k] || []) if (t <= h + 0.351 && clear(st, k, t)) return t;
    return null;
  };
  const S = states.length;
  const start = o.from || level.spawn; // (a spawn's y is the feet's + 0.86, as Player.place takes it)
  const home = o.state || (deck.home && states.includes(deck.home) ? deck.home : states.includes('PRESENT') ? 'PRESENT' : states[0]);
  // o.budget: how far Kai may walk at a stretch outside the home year of an unstable mission (its stability drains
  // there): each node keeps the shortest such stretch it is reached with, and a stretch over the budget goes no further
  const budget = o.budget ?? Infinity, homeI = states.indexOf(home);
  const best = new Map(), nodes = [], queue = [[]];
  let cur = 0, seg = 0;
  const push = (i, j, h, si, d = C) => {
    if (h < killY) return;
    const st = states[si];
    if (drowned(st, xOf(i), zOf(j), h)) return;
    const key = ((si * N + i * nz + j) * 8192) + Math.round((h + 40) * 50);
    const sg = budget === Infinity || si === homeI ? 0 : seg + d;
    if (sg > budget) return;
    const was = best.get(key);
    if (was !== undefined && was <= sg) return;
    if (was === undefined) nodes.push([i, j, h, si]);
    best.set(key, sg);
    const b = Math.round(sg / C);
    (queue[b] ||= []).push([i, j, h, si, sg, key]);
    if (b < cur) cur = b;
  };
  const cellOf = (x, z) => [Math.floor((x - bx0) / C), Math.floor((z - bz0) / C)];
  {
    const [i, j] = cellOf(start[0], start[2]);
    const h = land(home, i * nz + j, start[1] - 0.86 + 0.3);
    if (h === null) return { nodes: 0, missing: [`no ground at the spawn ${start}`], reached: () => false };
    push(i, j, h, homeI);
  }
  const carriers = (level.triggers || []).filter((t) => t.to || t.wrap);
  // a solid part REVERSE moves carries whoever stands on it (the bank's lift car up its shaft)
  const rides = [];
  for (const p of level.processes || []) {
    for (const part of p.parts) {
      if (!part.solid) continue;
      const d = part.origin.p.map((v, k) => v - part.rest.p[k]);
      if (Math.hypot(...d) < 0.5) continue;
      const b = part.box;
      const rest = [b[0] - d[0], b[1] - d[1], b[2] - d[2], b[3] - d[0], b[4] - d[1], b[5] - d[2]];
      rides.push({ when: p.when, rest, d });
    }
  }
  const DIR = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const heads = [];
  for (;;) {
    while (cur < queue.length && (heads[cur] || 0) >= (queue[cur]?.length || 0)) cur++;
    if (cur >= queue.length) break;
    const [i, j, h, si, sg, key] = queue[cur][(heads[cur] = (heads[cur] || 0) + 1) - 1];
    if (best.get(key) !== sg) continue; // (reached since with a shorter stretch)
    seg = sg;
    const st = states[si], k = i * nz + j, x = xOf(i), z = zOf(j);
    for (let s2 = 0; s2 < S; s2++) {
      if (s2 === si || !clear(states[s2], k, h)) continue;
      const t = land(states[s2], k, h);
      if (t !== null) push(i, j, t, s2, 0);
    }
    for (const t of carriers) {
      const b = t.box;
      if (!(x >= b[0] && x <= b[3] && z >= b[2] && z <= b[5] && h + 0.85 >= b[1] && h + 0.85 <= b[4])) continue;
      const [tx, tz] = t.to ? [t.to[0], t.to[2]] : [x + t.wrap[0], z + t.wrap[1]];
      const [ti, tj] = cellOf(tx, tz);
      if (ti < 0 || tj < 0 || ti >= nx || tj >= nz) continue;
      const th = land(st, ti * nz + tj, (t.to ? t.to[1] - 0.86 : h) + 0.3);
      if (th !== null) push(ti, tj, th, si, 0);
    }
    for (const r of rides) {
      const b = r.rest;
      if (!(x > b[0] && x < b[3] && z > b[2] && z < b[5] && Math.abs(h - b[4]) < 0.05) || (r.when && !holds(r.when, st, false) && !holds(r.when, st, true))) continue;
      const [ti, tj] = cellOf(x + r.d[0], z + r.d[2]);
      if (ti >= 0 && tj >= 0 && ti < nx && tj < nz) push(ti, tj, h + r.d[1], si, 0);
    }
    for (const [di, dj] of DIR) {
      // walk, step, drop, and jumps across gaps of up to 8 cells
      for (let n = 1; n <= 8; n++) {
        const ii = i + di * n, jj = j + dj * n;
        if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) break;
        const kk = ii * nz + jj;
        let any = false;
        for (const t of per[st].tops[kk] || []) {
          if (t > h + (n === 1 ? 1.15 : 1.0)) continue;
          if (!clear(st, kk, t)) continue;
          if (n === 1 && t > h + 0.35 && !clear(st, k, h, t + BODY)) continue; // headroom to jump
          if (t <= h + 0.351 && !clear(st, kk, Math.max(t, h - 0.01), Math.max(t, h) + BODY)) continue; // walking off: the body passes at h
          push(ii, jj, t, si, n * C);
          any = true;
          break;
        }
        if (n === 1 && !any && clear(st, kk, h)) {
          const t = land(st, kk, h);
          if (t !== null) push(ii, jj, t, si);
        }
        if (n > 1 && any) break;
        if (!clear(st, kk, h + 0.3, h + 0.3 + BODY)) break;
      }
    }
    if (nodes.length > 6e6) break;
  }
  // the standing heights reached in each cell, and in which year
  const byCell = new Map();
  for (const [i, j, h, si] of nodes) {
    const k = i * nz + j;
    let l = byCell.get(k);
    if (!l) byCell.set(k, (l = []));
    l.push([h, si]);
  }
  const cells = (x0, z0, x1, z1, f) => {
    for (let i = Math.max(0, Math.floor((x0 - bx0) / C)); i <= Math.min(nx - 1, Math.floor((x1 - bx0) / C)); i++) {
      for (let j = Math.max(0, Math.floor((z0 - bz0) / C)); j <= Math.min(nz - 1, Math.floor((z1 - bz0) / C)); j++) {
        for (const [h, si] of byCell.get(i * nz + j) || []) if (f(xOf(i), zOf(j), h, states[si])) return true;
      }
    }
    return false;
  };
  // within r of a point (eye height), in any year or in `only`
  const near = (pos, r, only) => cells(pos[0] - r, pos[2] - r, pos[0] + r, pos[2] + r, (x, z, h, st) => (!only || only.includes(st)) && Math.hypot(x - pos[0], h + EYE - pos[1], z - pos[2]) <= r);
  // (the runtime tests the body's centre: Runtime.step's triggers)
  const inBox = (b) => cells(b[0], b[2], b[3], b[5], (x, z, h) => x >= b[0] && x < b[3] && z >= b[2] && z < b[5] && h + 0.86 >= b[1] && h + 0.86 < b[4]);
  const yearsOf = (when) => {
    if (!when) return null;
    const ok = states.filter((st) => holds(when, st, false) || holds(when, st, true));
    return ok.length && ok.length < states.length ? ok : null;
  };
  const missing = [];
  for (const it of level.interactables) {
    if (!(it.r > 0)) continue;
    if (!near(it.pos, it.r, yearsOf(it.when))) missing.push({ what: 'interaction', id: it.id, kind: it.kind, at: it.pos, r: it.r });
  }
  for (const n of level.npcs) {
    if (!near([n.pos[0], n.pos[1] + 1.5, n.pos[2]], 3.2)) missing.push({ what: n.crowd ? 'crowd' : n.silent ? 'silent person' : 'person', id: n.id, crew: n.crew, at: n.pos });
  }
  for (const t of level.triggers || []) {
    if (t.to || t.wrap || !Object.keys(t.set || {}).some((f) => f.startsWith('t_'))) continue;
    if (!inBox(t.box)) missing.push({ what: 'trigger', id: Object.keys(t.set).join(','), at: t.box });
  }
  for (const p of level.processes || []) if (!near(p.aim, p.reach)) missing.push({ what: 'process', id: p.id, at: p.aim });
  return { nodes: nodes.length, missing, near, inBox };
}

// people who stand on nothing: each person's feet (and a crowd's, where it starts its walk) on the top of a solid, in
// some year, within 0.45 m below or 0.3 m above
export function floating(level) {
  const tops = [];
  for (const e of level.elements) if (e.solid) tops.push(e.box);
  for (const p of level.processes || []) for (const part of p.parts) if (part.solid) tops.push(part.box);
  return level.npcs.filter((n) => {
    const [x, y, z] = n.pos;
    return !tops.some((b) => x >= b[0] - 0.2 && x <= b[3] + 0.2 && z >= b[2] - 0.2 && z <= b[5] + 0.2 && b[4] >= y - 0.45 && b[4] <= y + 0.3);
  }).map((n) => ({ id: n.id, crew: n.crew, at: n.pos.map((v) => +(+v).toFixed(2)), crowd: !!n.crowd, hologram: !!n.hologram }));
}

// a stretch outside the home year of an unstable mission (metres at a walk, 3.9 m/s): 60 m is about 15 s, two thirds of
// the 22 s a full Chronolith lasts there (Runtime.step: 0.045 a second)
export const DRAIN_BUDGET = 60;

// one mission's level, checked: what cannot be reached (for an unstable mission, within DRAIN_BUDGET of the home
// year at a stretch), and who stands on nothing. A silent person (a figure in a cold open, a hologram on a far deck)
// need not be walked to.
export async function checkMissions(jobs) {
  const { LV } = await import('../game/js/editions/lastversion/index.js');
  const { LastVersion, MISSIONS } = await import('../game/js/editions/lastversion/Runtime.js');
  const { RealityEngine } = await import('../game/js/core/RealityEngine.js');
  const { FactStore } = await import('../game/js/core/FactStore.js');
  const out = [];
  const stories = {};
  for (const [ch, d] of jobs) {
    if (!stories[ch]) {
      const game = { engine: new RealityEngine(LV.engineOptions()), facts: new FactStore(), story: null };
      const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
      game.story = rt.makeStory(ch);
      stories[ch] = rt;
    }
    const rt = stories[ch];
    const deck = rt.g.story.decks[d];
    const level = rt.buildLevel({ lv: true, chapter: ch, deck: d, sector: 0, flags: {} });
    const t0 = Date.now();
    const r = reachability(level, deck, deck.unstable ? { budget: DRAIN_BUDGET } : {});
    out.push({ mkey: deck.mkey, unstable: !!deck.unstable, nodes: r.nodes, ms: Date.now() - t0, missing: r.missing, floating: floating(level) });
  }
  return out;
}

// every mission and case file, as [chapter, deck] pairs
export async function allMissions() {
  const { MISSIONS } = await import('../game/js/editions/lastversion/Runtime.js');
  return Object.entries(MISSIONS).flatMap(([ch, decks]) => decks.map((_, d) => [ch, d]));
}

// a worker of the unit test (tests/lastversion-reach.test.mjs)
const { isMainThread, parentPort, workerData } = await import('node:worker_threads');
if (!isMainThread && workerData?.reach) parentPort.postMessage(await checkMissions(workerData.reach));

// the report
if (isMainThread && import.meta.url === `file://${process.argv[1]}`) {
  const only = process.argv[2] ? process.argv[2].split(',') : null;
  for (const r of await checkMissions(await allMissions())) {
    if (only && !only.includes(r.mkey)) continue;
    console.log(`${r.mkey}: ${r.nodes} nodes, ${r.ms} ms${r.unstable ? ` (at most ${DRAIN_BUDGET} m at a stretch outside its home year)` : ''}${r.missing.length + r.floating.length ? '' : ' ok'}`);
    for (const m of r.missing) console.log(`   - ${m.what} ${m.id}${m.crew ? ` (${m.crew})` : ''} at ${m.at.map((v) => +(+v).toFixed(1))}`);
    for (const f of r.floating) console.log(`   - stands on nothing: ${f.id} (${f.crew}${f.hologram ? ', hologram' : ''}) at ${f.at}`);
  }
}
