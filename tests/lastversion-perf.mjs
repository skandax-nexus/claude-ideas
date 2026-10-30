// THE LAST VERSION OF EARTH: what the open places cost (OVERHAUL.md §4.7), measured the way
// tests/perf.mjs measures (read-only: it changes nothing in the game). On an emulated phone
// (landscape 915x412 CSS px, devicePixelRatio 2.625, touch: the game's own touch defaults, medium
// quality), smart renderer off, at quarter 0's spawn of each mission in each of its years:
//   - one full-size frame (every pass: shadows, scene, composer): draw calls and triangles
//   - the scene pass alone: draw calls, split into the place's static scenery (merged surfaces,
//     instanced vegetation), the sky and the horizon, and everything else (people, props, texts)
//   - JS time per frame (step, worlds, theme, render submission) over PLACES_FRAMES frames, rendered at
//     PLACES_TINY of the pixel ratio so SwiftShader's rasterisation does not count (as tests/perf.mjs)
// Budgets checked (§4.7): visible static draw calls ≤ 70, sky 1, horizon ≤ 4, triangles ≤ 300k in the scene pass and in
// the whole frame (the shadow passes too).
//   NODE_PATH=$(npm root -g) node tests/lastversion-perf.mjs
//   env: PLACES=m01,m04 (missions; any of m01 .. m23)  PLACES_FRAMES=120  PLACES_TINY=0.1  PLACES_QUALITY=medium
// CAST_LOAD=act3 (any chapter, or a comma list): before the places, with the game running in real time in Mission 1
//   (at the tiny render scale), that chapter's people load as they do behind its card (casting.js, one model at a
//   time); the main thread's work in each frame (the long tasks between two frames) may not exceed 150 ms
//   (OVERHAUL.md §11 U4). The frame gaps are printed too: SwiftShader's compositing alone makes them ~0.5 s here.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'game');
const WANT = (process.env.PLACES || 'm01,m04').split(',').filter(Boolean);
const FRAMES = +(process.env.PLACES_FRAMES || 120);
const TINY = +(process.env.PLACES_TINY || 0.1);
const QUALITY = process.env.PLACES_QUALITY || 'medium';
const MISSIONS = {
  m01: ['prologue', 0], m02: ['prologue', 1], m03: ['prologue', 2], m04: ['act1', 0], m05: ['act1', 1], m06: ['act1', 2], m07: ['act1', 3], m08: ['act1', 4],
  m09: ['act2', 0], m10: ['act2', 1], m11: ['act2', 2], m12: ['act2', 3], m13: ['act2', 4], m14: ['act3', 0], m15: ['act3', 1], m16: ['act3', 2],
  m17: ['act3', 3], m18: ['act3', 4], m19: ['act4', 0], m20: ['act4', 1], m21: ['act4', 2], m22: ['act4', 3], m23: ['finale', 0],
};
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2.625, hasTouch: true, isMobile: true });
const page = await context.newPage();
await page.route('**/*', (route) => {
  const u = new URL(route.request().url());
  return u.hostname === 'localhost' || u.hostname === '127.0.0.1' ? route.continue() : route.abort();
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://localhost:${server.address().port}/index.html?edition=lastversion`);
await page.waitForFunction(() => window.AZ, null, { timeout: 300000 });
const az = (fn, arg) => page.evaluate(([src, a]) => {
  try { return (0, eval)(`(${src})`)(a); } catch (e) { return `ERR ${e.message} @ ${(e.stack || '').split('\n').slice(1, 4).join(' | ')}`; }
}, [fn.toString(), arg]);
await az((q) => { AZ.changeSetting('quality', q); AZ.changeSetting('smart', false); }, QUALITY);
// start the edition the way a player does: inside the page, then wait for the level
await az(() => { setTimeout(() => AZ.begin('lv:prologue', null, 0), 0); });
await page.waitForFunction(() => AZ.started && AZ.room && AZ.level?.place, null, { timeout: 300000 });
await az(() => {
  const g = AZ;
  g.renderer.setAnimationLoop(null);
  const r = g.renderer, orig = r.setPixelRatio;
  window.__pr = r.getPixelRatio();
  window.__scale = 1;
  r.setPixelRatio = function (v) { window.__pr = v; return orig.call(this, v * window.__scale); };
  window.__setScale = (s) => { window.__scale = s; r.setPixelRatio(window.__pr); g.resize(); };
  window.__drain = () => { const gl = r.getContext(); const px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
});
const results = [];
let castFail = 0;
for (const ch of (process.env.CAST_LOAD || '').split(',').filter(Boolean)) {
  // the real-time loop runs again while the chapter's people load; every frame's length is measured
  const r = await page.evaluate(async ([ch, TINY]) => {
    const g = AZ;
    // (rendered at a tiny scale, as the JS frame times below: SwiftShader's rasterisation is not the main thread's)
    window.__setScale(TINY);
    g.renderer.setAnimationLoop((t) => g.loop(t));
    const before = (await import('/js/world/Actors.js')).MODELS;
    const keys = (await import('/js/editions/lastversion/casting.js')).castOf(ch).filter((k) => before[k]);
    const frames = [];
    const long = [];
    const stamps = [], tasks = [];
    let last = performance.now(), on = true;
    const tick = () => { const t = performance.now(); frames.push(t - last); stamps.push(t); last = t; if (on) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    const obs = new PerformanceObserver((l) => { for (const e of l.getEntries()) { long.push(Math.round(e.duration)); tasks.push([e.startTime, e.duration]); } });
    obs.observe({ type: 'longtask' });
    // the same loop with nothing loading, first: what a frame costs here anyway
    await new Promise((res) => setTimeout(res, 1500));
    const base = frames.splice(0).sort((a, b) => b - a);
    const baseLong = long.splice(0).sort((a, b) => b - a);
    stamps.splice(0);
    tasks.splice(0);
    const t0 = performance.now();
    const ok = await g.edition.loadCast(ch);
    const ms = performance.now() - t0;
    await new Promise((res) => setTimeout(res, 300));
    on = false;
    obs.disconnect();
    g.renderer.setAnimationLoop(null);
    window.__setScale(1);
    frames.sort((a, b) => b - a);
    // the main thread's own work in each frame: the long tasks (over 50 ms) that ran between two frames, plus 16 ms
    // for the shorter ones; SwiftShader's rasterisation and compositing (a frame here takes ~0.5 s idle) is not in it
    let mainWorst = 0;
    for (let i = 0; i < stamps.length; i++) {
      const a = i ? stamps[i - 1] : t0, b = stamps[i];
      mainWorst = Math.max(mainWorst, 16 + tasks.filter(([st]) => st >= a && st < b).reduce((x, [, d]) => x + d, 0));
    }
    return { ch, ok, mainWorst: Math.round(mainWorst), models: keys.length, ms: Math.round(ms), frames: frames.length, worst: frames.slice(0, 5).map((f) => Math.round(f)), longTasks: long.sort((a, b) => b - a).slice(0, 5),
      base: { frames: base.length, worst: base.slice(0, 3).map((f) => Math.round(f)), longTasks: baseLong.slice(0, 3) } };
  }, [ch, TINY]);
  console.log(`cast load ${ch}: ${r.models} models in ${r.ms} ms, ${r.frames} frames: main thread at most ${r.mainWorst} ms in one frame; frame gaps ${r.worst.join(', ')} ms, longest tasks ${r.longTasks.join(', ')} ms | idle before: ${r.base.frames} frames in 1.5 s, worst ${r.base.worst.join(', ')} ms, longest tasks ${r.base.longTasks.join(', ') || '-'} ms`);
  if (!r.ok || r.mainWorst > 150) { castFail++; console.log(`FAIL cast load ${ch}: ${r.ok ? `${r.mainWorst} ms of main-thread work in one frame` : 'a model did not load'}`); }
  results.push({ key: `cast:${ch}`, cast: r });
}
for (const key of WANT) {
  const [ch, d] = MISSIONS[key] || [];
  if (!ch) continue;
  await page.evaluate((c) => AZ.edition.loadCast(c), ch); // (the chapter's people first, as its card does)
  const states = await az(([ch, d]) => {
    const g = AZ;
    if (g.campaign.chapter !== ch) g.edition.start(ch);
    g.campaign.deck = d; g.campaign.sector = 0; g.campaign.flags = {}; g.campaign.visited = [];
    g.loadSector(true);
    g.simulate(0.3);
    for (let i = 0; i < 600 && g.hud.talking; i++) { g.hud.subT = 0; g.simulate(0.1); }
    return g.edition.deck.states;
  }, [ch, d]);
  if (!Array.isArray(states)) { console.log(key, states); continue; }
  for (const st of states) {
    const m = await az(([st, FRAMES, TINY]) => {
      const g = AZ, r = g.renderer, info = r.info;
      g.engine.setState(g.room, st, { force: true });
      g.edition.weatherState = null;
      g.player.place(g.level.spawn);
      window.__setScale(1);
      for (let i = 0; i < 10; i++) { g.tickFrame(1 / 30); window.__drain(); } // (each frame waits for the GPU: queued frames pile up)
      // one full frame, every pass
      info.autoReset = false;
      info.reset();
      g.postfx.render();
      const full = { calls: info.render.calls, triangles: info.render.triangles };
      // the scene pass alone, its draw calls split by what drew them
      const mounted = g.edition.mounted;
      const scen = mounted?.stats() || { calls: 0, tris: 0 };
      const auto = r.shadowMap.autoUpdate;
      r.shadowMap.autoUpdate = false;
      info.reset();
      r.render(g.scene, g.camera);
      const scene = { calls: info.render.calls, triangles: info.render.triangles };
      r.shadowMap.autoUpdate = auto;
      info.autoReset = true;
      const skyDraws = mounted?.sky?.mesh.visible ? 1 : 0;
      const horizonDraws = [mounted?.horizon?.band, mounted?.horizon?.skirt].filter((o) => o?.visible).length;
      // DeckWorld's own static pieces (merged per material, never conditional)
      let dwStatic = 0;
      g.deckWorld.root.children.forEach((o) => { if (o.isMesh && o.visible && o.name !== 'lvSky' && o.name !== 'lvHorizon' && !o.material?.isShaderMaterial && o.geometry?.attributes?.position?.count > 200 && !o.isSkinnedMesh) dwStatic++; });
      // JS per frame at a tiny render scale
      window.__setScale(TINY);
      for (let i = 0; i < 5; i++) { g.tickFrame(1 / 60); window.__drain(); }
      const times = [];
      for (let i = 0; i < FRAMES; i++) {
        const t0 = performance.now();
        g.tickFrame(1 / 60);
        times.push(performance.now() - t0);
        window.__drain();
      }
      window.__setScale(1);
      times.sort((a, b) => a - b);
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      return { full, scene, scenery: scen, skyDraws, horizonDraws, deckWorldStatic: dwStatic, staticDraws: scen.calls + skyDraws + horizonDraws + dwStatic, frameMs: { avg: +avg.toFixed(2), p50: +times[times.length >> 1].toFixed(2), p95: +times[Math.floor(times.length * 0.95)].toFixed(2) }, colliders: g.deckWorld.colliders.length, texts: g.level.texts.length, npcs: g.level.npcs.length };
    }, [st, FRAMES, TINY]);
    if (typeof m === 'string') { console.log(key, st, m); errors.push(m); continue; }
    results.push({ key, year: st, ...m });
    console.log(`${key} ${st.padEnd(7)} full frame ${m.full.calls} draws ${m.full.triangles} tris | scene pass ${m.scene.calls} draws ${m.scene.triangles} tris | static ${m.staticDraws} (scenery ${m.scenery.calls}, sky ${m.skyDraws}, horizon ${m.horizonDraws}, deck ${m.deckWorldStatic}) | JS frame ${m.frameMs.avg} ms avg, ${m.frameMs.p95} p95`);
  }
}
let fail = castFail;
for (const r of results.filter((x) => !x.cast)) {
  const bad = [];
  if (r.staticDraws > 70) bad.push(`${r.staticDraws} static draws`);
  if (r.skyDraws !== 1) bad.push(`sky ${r.skyDraws}`);
  if (r.horizonDraws > 4) bad.push(`horizon ${r.horizonDraws}`);
  if (r.scene.triangles > 300000) bad.push(`${r.scene.triangles} triangles`);
  if (r.full.triangles > 300000) bad.push(`${r.full.triangles} triangles in the whole frame (its shadow passes too)`); // (§4.7 counts the whole frame)
  if (bad.length) { fail++; console.log(`FAIL ${r.key} ${r.year}: ${bad.join(', ')}`); }
}
if (errors.length) console.log('page errors:', [...new Set(errors)].join(' | '));
console.log(JSON.stringify({ quality: QUALITY, viewport: '915x412@2.625', frames: FRAMES, renderScale: TINY, results }, null, 1).slice(0, 200));
fs.writeFileSync(process.env.PLACES_OUT || '/dev/null', JSON.stringify({ quality: QUALITY, results }, null, 1));
await browser.close();
server.close();
console.log(fail || errors.length ? `\n${fail} over budget, ${errors.length} errors` : `\n${results.length} views within §4.7`);
if (fail || errors.length) process.exit(1);
