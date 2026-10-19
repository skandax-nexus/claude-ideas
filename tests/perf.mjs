// Performance harness (read-only: it measures, it changes nothing in the game).
//
// Plays representative scenes on an emulated phone (landscape 915x412 CSS px, devicePixelRatio
// 2.625, touch, so no MSAA on the canvas and the game's own touch defaults) and records, per scene,
// at HIGH and LOW in full and at MEDIUM (the touch default) in brief, smart renderer off:
//   - what the GPU is asked to do in one full-size frame: draw calls, triangles, GL calls split by
//     render target with their sizes (shadow maps, composer passes), shader programs, geometries,
//     textures; lights by type (lit / shadow-casting), meshes (visible / in view / skinned /
//     transparent / shadow-casting), animated characters (all / visible / in view), canvas size
//   - JS CPU per frame by phase over FRAMES frames with rendering stubbed (game logic), then the
//     render CPU on its own (three.js traversal, sorting, uniforms, submission; composer passes)
//   - allocation pressure (V8 sampling heap profiler: KB per frame and the hottest allocators)
//   - DOM work per frame (mutations, style recalcs, layouts), backdrop blurs and CSS animations
//   - the real animation loop while walking (W held): frame JS, long tasks, GC (trace), lazily
//     compiled shaders, style/layout; frame intervals are compositor-bound under SwiftShader
//   - main-thread stalls, shader compiles and texture uploads per transition (rooms, reality
//     states, sectors / districts / acts, menus, quality changes, smart renderer steps)
//   - the smart renderer fed synthetic frame times: changes and flip-flops per minute
//
// SwiftShader (software GL on this machine's CPU) is not a phone GPU. Its GPU process lags behind
// and blocks JS at random points, so: every rendered frame is measured with the GPU process idle
// (one pixel read back between frames; gl.finish() does not wait here), and all frames but the one
// full-size census frame render at PERF_TINY of the game's pixel ratio (every setPixelRatio is
// scaled, the game's own calls included). Counts are exact; CPU times are this x86 machine's (a
// mid-range phone is several times slower); SwiftShader times are reported only as "swiftshader*".
// Deterministic: seeded Math.random, fixed seeds and spots, fixed dt, the same walk every run.
//
//   NODE_PATH=$(npm root -g) node tests/perf.mjs            (about 20 minutes)
//   env: PERF_OUT=path (default the scratchpad's perf/perf-baseline.json)
//        PERF_SCENES=station_antechamber,station_lab,halcyon_neon,halcyon_reactor,cradle,vessel_medbay,forge
//        PERF_QUALITIES=high,low  PERF_LIGHT_QUALITIES=medium  PERF_FRAMES=240  PERF_RENDER_CPU_FRAMES=90
//        PERF_RENDER_FRAMES=1  PERF_TINY=0.1  PERF_WALK=15  PERF_WALK_QUALITY=low  PERF_DPR=2.625
//        PERF_VIEW=915x412  PERF_NO_HDR=1 (the claude.ai preview: JPG skies)  PERF_SKIP_WALK=1  PERF_SKIP_SMART=1
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', 'game');
const OUT = process.env.PERF_OUT || '/tmp/claude-0/-home-user-claude-ideas/172dbda8-49ff-56a9-a901-22c181c25683/scratchpad/perf/perf-baseline.json';
const ALL_SCENES = ['station_antechamber', 'station_lab', 'halcyon_neon', 'halcyon_reactor', 'vessel_medbay', 'cradle', 'forge'];
const SCENES = (process.env.PERF_SCENES || ALL_SCENES.join(',')).split(',').filter(Boolean);
const QUALITIES = (process.env.PERF_QUALITIES || 'high,low').split(',').filter(Boolean);
const FRAMES = +(process.env.PERF_FRAMES || 240);
const RENDER_FRAMES = +(process.env.PERF_RENDER_FRAMES || 1); // full-size SwiftShader frames (seconds each at HIGH)
const RENDER_CPU_FRAMES = +(process.env.PERF_RENDER_CPU_FRAMES || 90);
const TINY = +(process.env.PERF_TINY || 0.1); // render scale for everything that is not about pixels
const LIGHT_QUALITIES = (process.env.PERF_LIGHT_QUALITIES ?? 'medium').split(',').filter(Boolean); // census + render CPU only
const WALK = +(process.env.PERF_WALK || 15);
const WALK_QUALITY = process.env.PERF_WALK_QUALITY || 'low'; // LOW has no shadow maps: the loop is then paced by the main thread, not by SwiftShader
const DPR = +(process.env.PERF_DPR || 2.625);
const [VW, VH] = (process.env.PERF_VIEW || '915x412').split('x').map(Number);
const T0 = Date.now();
const log = (...a) => console.error(`[${((Date.now() - T0) / 1000).toFixed(0).padStart(4)}s]`, ...a);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const url = `http://localhost:${port}/index.html`;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info'] });
const context = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR, hasTouch: true, isMobile: true });
// only the local server: web fonts and anything remote otherwise hang screenshots and loads
await context.route('**/*', (route) => {
  const u = new URL(route.request().url());
  return u.hostname === 'localhost' || u.hostname === '127.0.0.1' ? route.continue() : route.abort();
});
await context.addInitScript(({ noHdr }) => {
  // the same random stream every run (actor blinks, idle variation, default seeds)
  let s = 0x9e3779b9;
  Math.random = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  if (noHdr) window.AZ_NO_HDR = 1;
  // every long task of the page, from the start: [startTime, duration]
  window.__LT = [];
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__LT.push([e.startTime, e.duration]); }).observe({ type: 'longtask' });
  } catch { /* no long task API */ }
}, { noHdr: !!process.env.PERF_NO_HDR });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const cdp = await context.newCDPSession(page);
await cdp.send('Performance.enable');
const az = (fn, a) => page.evaluate(fn, a);

const results = {
  meta: {
    date: new Date().toISOString(), viewport: `${VW}x${VH}`, dpr: DPR, touch: true, hdr: !process.env.PERF_NO_HDR, frames: FRAMES, renderFrames: RENDER_FRAMES, renderCpuFrames: RENDER_CPU_FRAMES, renderScale: TINY, lightQualities: LIGHT_QUALITIES, walkSec: WALK, walkQuality: WALK_QUALITY,
    gl: 'SwiftShader (software): GPU-side timings are not a phone GPU; counts (draws, triangles, programs, lights) are exact',
    load: fs.existsSync('/proc/loadavg') ? fs.readFileSync('/proc/loadavg', 'utf8').trim() : null,
  },
  boot: {}, scenes: {}, transitions: [], smart: {}, skipped: [], errors,
};

// --- in-page instrumentation ---------------------------------------------------------------------
const HELPERS = () => {
  const P = (window.__P = { cur: null, frames: [], wrapped: [], turn: 0, fixedDt: null });
  const now = () => performance.now();
  P.wrap = (obj, name, label) => {
    if (!obj || typeof obj[name] !== 'function' || obj[name].__orig) return;
    const orig = obj[name];
    const own = Object.prototype.hasOwnProperty.call(obj, name);
    const cl = '#' + label; // precomputed: the wrapper itself allocates nothing per call
    const f = function () {
      const t0 = now();
      try {
        return orig.apply(this, arguments);
      } finally {
        const c = P.cur;
        if (c) {
          c[label] = (c[label] || 0) + (now() - t0);
          c[cl] = (c[cl] || 0) + 1;
        }
      }
    };
    f.__orig = orig;
    obj[name] = f;
    P.wrapped.push({ obj, name, own, orig });
  };
  P.unwrapAll = () => {
    for (const w of P.wrapped.reverse()) {
      if (w.own) w.obj[w.name] = w.orig;
      else delete w.obj[w.name];
    }
    P.wrapped = [];
  };
  // every per-frame method worth timing (nested: a parent's time includes its children)
  P.instrument = () => {
    const g = window.AZ;
    const W = (o, names, pre) => names.forEach((n) => P.wrap(o, n, `${pre}${n}`));
    W(g, ['updateHudMood', 'step', 'updateWorlds', 'updateTheme', 'updateLamps', 'stepDeck', 'stepStation', 'findFocus', 'placePrompt', 'saveTo', 'mapMarkers', 'runTimers', 'enterRoom', 'updateDeckObjective', 'applyQuality', 'resize'], '');
    W(g.player, ['update', 'updateCamera', 'updateModel'], 'player.');
    W(g.minimap, ['drawMini'], 'minimap.');
    W(g.hud, ['update', 'setState', 'prompt', 'held', 'eye', 'say', 'toast'], 'hud.');
    W(g.postfx, ['render'], 'postfx.');
    W(g.renderer, ['render'], 'renderer.');
    W(g.renderer.shadowMap, ['render'], 'shadowMap.');
    W(g.deckWorld, ['update', 'refresh'], 'deckWorld.');
    if (g.deckWorld.decor) W(g.deckWorld.decor, ['update'], 'decor.');
    W(g.world, ['update', 'refresh'], 'world.');
    W(g.npcs, ['update'], 'npcs.');
    W(g.observer, ['update'], 'observer.');
    W(g.weather, ['update'], 'weather.');
    W(g.fx, ['update', 'focus'], 'fx.');
    W(g.director, ['update'], 'director.');
    W(g.input, ['poll', 'consumeActions'], 'input.');
    W(g.audio, ['setThreat', 'setDuck', 'footstep', 'setState'], 'audio.');
    W(g.objectives, ['update'], 'objectives.');
    for (const p of g.postfx.composer?.passes || []) P.wrap(p, 'render', `pass.${p.constructor.name}`);
    // every animated character (player, Juno, crew, watchers): mixer + face + look-at, per frame
    g.scene.traverse((o) => { if (o.userData?.mixer && typeof o.userData.animate === 'function') P.wrap(o.userData, 'animate', 'actor.animate'); });
    const s0 = g.deckWorld.sentinels?.[0];
    if (s0) P.wrap(Object.getPrototypeOf(s0), 'update', 'sentinel.update');
  };
  // frame(): one record per frame (phase times, heap, programs, textures)
  P.hookFrame = () => {
    const g = window.AZ;
    if (g.frame.__orig) return;
    const orig = g.frame;
    const f = function () {
      if (P.turn) g.input.look.dx += P.turn; // the walk turns slowly: new things come into view
      if (P.bare) return orig.call(this); // allocation profiling: no records, no timers
      P.cur = {};
      const t0 = now();
      try {
        return orig.call(this);
      } finally {
        const c = P.cur;
        c.frame = now() - t0;
        c.t = t0;
        c.heap = performance.memory?.usedJSHeapSize || 0;
        c.programs = g.renderer.info.programs.length;
        c.textures = g.renderer.info.memory.textures;
        P.frames.push(c);
        P.cur = null;
      }
    };
    f.__orig = orig;
    g.frame = f;
    const clock = g.clock, getDelta = clock.getDelta.__orig || clock.getDelta;
    clock.getDelta = function () {
      const d = getDelta.call(this);
      return P.fixedDt ?? d;
    };
    clock.getDelta.__orig = getDelta;
  };
  P.stats = (arr) => {
    const a = arr.filter((v) => Number.isFinite(v)).sort((x, y) => x - y);
    if (!a.length) return null;
    const sum = a.reduce((s, v) => s + v, 0);
    const q = (p) => a[Math.min(a.length - 1, Math.floor(p * a.length))];
    return { avg: +(sum / a.length).toFixed(3), p50: +q(0.5).toFixed(3), p95: +q(0.95).toFixed(3), max: +a[a.length - 1].toFixed(3) };
  };
  // per-phase summary of a run of frame records
  P.summarize = (frames) => {
    const labels = new Set();
    for (const f of frames) for (const k of Object.keys(f)) if (!k.startsWith('#') && !['t', 'heap', 'programs', 'textures'].includes(k)) labels.add(k);
    const out = {};
    for (const l of labels) {
      const s = P.stats(frames.map((f) => f[l] || 0));
      const calls = frames.reduce((n, f) => n + (f[`#${l}`] || 0), 0) / frames.length;
      out[l] = { ...s, callsPerFrame: +calls.toFixed(2) };
    }
    return out;
  };
  // GL calls of one call to fn(), split by framebuffer (render target) and viewport size
  P.glCount = (fn) => {
    const gl = window.AZ.renderer.getContext();
    const proto = Object.getPrototypeOf(gl);
    const names = Object.getOwnPropertyNames(proto).filter((k) => k !== 'constructor' && typeof Object.getOwnPropertyDescriptor(proto, k).value === 'function');
    const counts = {};
    const segs = [];
    const fbIds = new Map();
    let seg = null;
    for (const k of names) {
      const orig = proto[k];
      gl[k] = function (...a) {
        counts[k] = (counts[k] || 0) + 1;
        if (k === 'bindFramebuffer' && a[0] !== gl.READ_FRAMEBUFFER) {
          const fb = a[1];
          if (fb && !fbIds.has(fb)) fbIds.set(fb, fbIds.size + 1);
          seg = { fb: fb ? fbIds.get(fb) : 0, vp: null, draws: 0, clears: 0 };
          segs.push(seg);
        } else if (k === 'viewport' && seg && !seg.vp) seg.vp = `${a[2]}x${a[3]}`;
        else if (k.startsWith('draw')) {
          if (!seg) segs.push((seg = { fb: '?', vp: null, draws: 0, clears: 0 }));
          seg.draws++;
        } else if (k === 'clear' && seg) seg.clears++;
        return orig.apply(gl, a);
      };
    }
    try {
      fn();
    } finally {
      for (const k of names) delete gl[k];
    }
    const merged = [];
    for (const s of segs) {
      const last = merged[merged.length - 1];
      if (last && last.fb === s.fb && (!s.vp || last.vp === s.vp)) { last.draws += s.draws; last.clears += s.clears; } else if (s.draws || s.clears) merged.push({ ...s });
    }
    const sum = (re) => Object.entries(counts).filter(([k]) => re.test(k)).reduce((n, [, v]) => n + v, 0);
    return {
      total: Object.values(counts).reduce((n, v) => n + v, 0),
      draws: sum(/^draw/), useProgram: counts.useProgram || 0, uniforms: sum(/^uniform/), bindTexture: counts.bindTexture || 0,
      bufferUploads: sum(/^buffer(Sub)?Data$/), textureUploads: sum(/^tex(Sub)?Image|^compressedTex/), blits: counts.blitFramebuffer || 0,
      bindFramebuffer: counts.bindFramebuffer || 0, getters: sum(/^get/),
      targets: merged.slice(0, 40),
      top: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12),
    };
  };
  // what the scene asks of the GPU
  P.census = () => {
    const g = window.AZ;
    const scene = g.scene;
    const lights = {};
    let shadowLights = 0;
    const meshes = { total: 0, visible: 0, inView: 0, skinned: 0, skinnedVisible: 0, instanced: 0, instances: 0, transparent: 0, castShadow: 0, receiveShadow: 0, noCull: 0, sprites: 0, points: 0, lines: 0 };
    const mats = new Set(), matTypes = {}, geos = new Set(), texs = new Set();
    let tris = 0, mixers = 0, mixersVisible = 0, mixersInView = 0, actions = 0, bones = 0, morph = 0;
    const isVisible = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    // frustum test with the camera as last rendered
    const cam = g.camera;
    cam.updateMatrixWorld();
    const m = cam.projectionMatrix.clone().multiply(cam.matrixWorldInverse);
    const e = m.elements;
    const planes = [
      [e[3] - e[0], e[7] - e[4], e[11] - e[8], e[15] - e[12]], [e[3] + e[0], e[7] + e[4], e[11] + e[8], e[15] + e[12]],
      [e[3] + e[1], e[7] + e[5], e[11] + e[9], e[15] + e[13]], [e[3] - e[1], e[7] - e[5], e[11] - e[9], e[15] - e[13]],
      [e[3] - e[2], e[7] - e[6], e[11] - e[10], e[15] - e[14]], [e[3] + e[2], e[7] + e[6], e[11] + e[10], e[15] + e[14]],
    ].map(([a, b, c, d]) => { const l = Math.hypot(a, b, c); return [a / l, b / l, c / l, d / l]; });
    const inView = (o) => {
      if (!o.frustumCulled) return true;
      const geo = o.geometry;
      if (!geo) return true;
      if (!geo.boundingSphere) geo.computeBoundingSphere();
      const bs = geo.boundingSphere;
      if (!bs || !Number.isFinite(bs.radius)) return true;
      const c = bs.center.clone().applyMatrix4(o.matrixWorld);
      const sc = o.matrixWorld.getMaxScaleOnAxis();
      const r = bs.radius * sc * (o.isInstancedMesh || o.isSkinnedMesh ? 4 : 1);
      return planes.every(([a, b, cc, d]) => a * c.x + b * c.y + cc * c.z + d > -r);
    };
    scene.traverse((o) => {
      if (o.userData?.mixer) {
        mixers++;
        actions += o.userData.mixer._actions?.filter((x) => x.isRunning()).length || 0;
        // a character is animated every frame whether or not it can be seen: how many can be?
        const c = o.getWorldPosition(new o.position.constructor());
        c.y += 0.9;
        if (isVisible(o) && planes.every(([a, b, cc, d]) => a * c.x + b * c.y + cc * c.z + d > -1.2)) mixersInView++;
        if (isVisible(o)) mixersVisible++;
      }
      if (o.isLight) {
        if (!isVisible(o)) return;
        const k = o.isLightProbe ? 'LightProbe' : o.type;
        lights[k] = lights[k] || { n: 0, lit: 0, shadow: 0 };
        lights[k].n++;
        if (o.intensity > 0) lights[k].lit++;
        if (o.castShadow) { lights[k].shadow++; shadowLights++; }
        return;
      }
      if (o.isSprite) meshes.sprites++;
      if (o.isPoints) meshes.points++;
      if (o.isLine) meshes.lines++;
      if (!o.isMesh) return;
      meshes.total++;
      if (o.isSkinnedMesh) { meshes.skinned++; bones += o.skeleton?.bones.length || 0; }
      if (o.morphTargetInfluences?.length) morph++;
      if (!isVisible(o)) return;
      meshes.visible++;
      if (o.isSkinnedMesh) meshes.skinnedVisible++;
      if (o.isInstancedMesh) { meshes.instanced++; meshes.instances += o.count; }
      if (o.castShadow) meshes.castShadow++;
      if (o.receiveShadow) meshes.receiveShadow++;
      if (!o.frustumCulled) meshes.noCull++;
      if (inView(o)) meshes.inView++;
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      for (const mt of ms) {
        if (!mt) continue;
        if (mt.transparent) { meshes.transparent++; }
        if (!mats.has(mt)) {
          mats.add(mt);
          matTypes[mt.type] = (matTypes[mt.type] || 0) + 1;
          for (const v of Object.values(mt)) if (v && v.isTexture) texs.add(v);
        }
      }
      if (o.geometry) {
        geos.add(o.geometry);
        const idx = o.geometry.index, pos = o.geometry.attributes.position;
        tris += ((idx ? idx.count : pos ? pos.count : 0) / 3) * (o.isInstancedMesh ? o.count : 1);
      }
    });
    let texBytes = 0;
    for (const t of texs) {
      const im = t.image;
      const w = im?.width || im?.videoWidth || 0, h = im?.height || im?.videoHeight || 0;
      texBytes += w * h * 4 * (t.generateMipmaps !== false ? 1.33 : 1) * (t.isCubeTexture ? 6 : 1);
    }
    const info = g.renderer.info;
    const progNames = {};
    for (const p of info.programs) { const k = P.progKind(p); progNames[k] = (progNames[k] || 0) + 1; }
    // expensive things in the page around the canvas: visible blurred panels, running CSS animations
    const blur = [];
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.backdropFilter && cs.backdropFilter !== 'none' && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0 && el.offsetWidth) {
        blur.push(`${el.id ? `#${el.id}` : el.tagName.toLowerCase()}${el.classList.length ? `.${[...el.classList].join('.')}` : ''} ${cs.backdropFilter} ${el.offsetWidth}x${el.offsetHeight}`);
      }
    }
    const v2 = { x: g.renderer.domElement.width, y: g.renderer.domElement.height };
    return {
      lights, shadowLights,
      meshes, uniqueMaterials: mats.size, materialTypes: matTypes, uniqueGeometries: geos.size, sceneTriangles: Math.round(tris),
      sceneTextures: texs.size, sceneTextureMB: +(texBytes / 1048576).toFixed(1),
      mixers, mixersVisible, mixersInView, runningActions: actions, skinnedBones: bones, morphMeshes: morph,
      programs: info.programs.length, programNames: progNames,
      memory: { ...info.memory },
      canvas: { css: `${innerWidth}x${innerHeight}`, buffer: `${v2.x}x${v2.y}`, pixelRatio: +g.renderer.getPixelRatio().toFixed(3), devicePixelRatio: devicePixelRatio, megapixels: +((v2.x * v2.y) / 1e6).toFixed(2) },
      shadowMap: g.renderer.shadowMap.enabled ? g.sun.shadow.mapSize.x : 0,
      composer: g.postfx.composer ? g.postfx.composer.passes.map((p) => p.constructor.name) : null,
      env: !!g.scene.environment, fog: g.scene.fog?.density,
      dom: { elements: document.getElementsByTagName('*').length, visibleBackdropBlur: blur.length, backdropBlur: blur.slice(0, 8), animations: document.getAnimations().filter((a) => a.playState === 'running').length,
        running: document.getAnimations().filter((a) => a.playState === 'running').slice(0, 8).map((a) => { const el = a.effect?.target; return `${a.animationName || a.transitionProperty || 'anim'} ${el ? (el.id ? `#${el.id}` : `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`) : ''}${Number.isFinite(a.effect?.getTiming?.().iterations) ? '' : ' (infinite)'}`; }) },
      jsHeapMB: +((performance.memory?.usedJSHeapSize || 0) / 1048576).toFixed(1),
    };
  };
  // a program's kind: the built-in shader (standard, physical, basic...) or the material's name
  P.progKind = (p) => {
    // WebGLProgram: type = the material's type (MeshStandardMaterial, ShaderMaterial...), name = material.name
    const type = String(p.type || 'unknown').replace(/^Mesh|Material$/g, '');
    return p.name ? `${type}:${p.name}` : type;
  };
  // GL time of one call to fn(): where a stall goes (shader compile/link, texture upload, buffers)
  P.glTime = (fn) => {
    const gl = window.AZ.renderer.getContext();
    const proto = Object.getPrototypeOf(gl);
    const names = Object.getOwnPropertyNames(proto).filter((k) => k !== 'constructor' && typeof Object.getOwnPropertyDescriptor(proto, k).value === 'function');
    const ms = {}, n = {}, ups = [];
    for (const k of names) {
      const orig = proto[k];
      gl[k] = function () {
        const t0 = performance.now();
        const r = orig.apply(gl, arguments);
        ms[k] = (ms[k] || 0) + performance.now() - t0;
        n[k] = (n[k] || 0) + 1;
        if (k === 'texStorage2D') ups.push(`${arguments[3]}x${arguments[4]}${arguments[1] > 1 ? ' mip' : ''}`);
        else if (k === 'texImage2D' && arguments[1] === 0) {
          const a = arguments, src = a[a.length - 1];
          ups.push(a.length >= 9 ? `${a[3]}x${a[4]} raw` : `${src?.width || src?.videoWidth}x${src?.height || src?.videoHeight} ${src?.constructor?.name || ''}`);
        }
        return r;
      };
    }
    try {
      fn();
    } finally {
      for (const k of names) delete gl[k];
    }
    const sum = (re) => +Object.entries(ms).filter(([k]) => re.test(k)).reduce((s, [, v]) => s + v, 0).toFixed(1);
    return {
      glMs: sum(/./), compileMs: sum(/^(compileShader|linkProgram|getProgramParameter|getShaderParameter|getProgramInfoLog|getShaderInfoLog|attachShader|createProgram|getUniformLocation|getActiveUniform|getActiveAttrib|getAttribLocation)$/),
      uploadMs: sum(/^(tex(Sub)?Image2D|texStorage2D|generateMipmap|compressedTex.*|texImage3D|texSubImage3D|texStorage3D)$/), bufferMs: sum(/^buffer(Sub)?Data$/), drawMs: sum(/^draw/),
      programsLinked: n.linkProgram || 0, uploads: ups.length, uploadSizes: ups.slice(0, 12),
      top: Object.entries(ms).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${v.toFixed(1)}ms x${n[k]}`),
    };
  };
  // Wait until the GPU process has caught up, so a measurement does not pay for earlier frames.
  // gl.finish() returns at once here (ANGLE/SwiftShader in Chromium's GPU process); reading one
  // pixel back really waits for every queued command.
  P.px = new Uint8Array(4);
  P.drain = () => {
    const gl = window.AZ.renderer.getContext();
    const rfb = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING);
    if (rfb) gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, P.px);
    if (rfb) gl.bindFramebuffer(gl.READ_FRAMEBUFFER, rfb);
  };
  // frames, each started with the GPU process idle: the frame's JS time is then its CPU cost
  // (three.js submits asynchronously), and the drain after it is SwiftShader's time
  P.syncFrames = (n) => {
    const g = window.AZ;
    P.gpuWait = P.gpuWait || [];
    for (let i = 0; i < n; i++) {
      g.frame();
      const t0 = now();
      P.drain();
      P.gpuWait.push(now() - t0);
    }
  };
  // Render scale: SwiftShader rasterises on this machine's CPU, so a full-size frame at HIGH costs
  // seconds. Every pixel ratio the game sets (SmartRenderer.apply on quality changes included) is
  // multiplied by P.renderScale: CPU-side work (traversal, sorting, uniforms, draw submission, shader
  // compiles, uploads) stays the same, rasterisation shrinks. Full size only where pixels matter.
  P.renderScale = 1;
  P.hookPixelRatio = () => {
    const r = window.AZ.renderer;
    if (r.setPixelRatio.__orig) return;
    const orig = r.setPixelRatio;
    P.prWanted = r.getPixelRatio();
    const f = function (v) {
      P.prWanted = v;
      return orig.call(this, v * P.renderScale);
    };
    f.__orig = orig;
    r.setPixelRatio = f;
  };
  P.setRenderScale = (s) => {
    P.renderScale = s;
    window.AZ.renderer.setPixelRatio(P.prWanted);
    window.AZ.resize();
  };
  // the same spot and heading for every measurement in a scene
  P.savePose = () => {
    const p = window.AZ.player;
    P.pose = { pos: p.pos.clone(), H: p.H.clone(), facing: p.facing.clone(), pitch: p.pitch, room: window.AZ.room };
  };
  P.restorePose = () => {
    const g = window.AZ, p = g.player, s = P.pose;
    if (!s) return;
    p.pos.copy(s.pos); p.vel.set(0, 0, 0); p.H.copy(s.H); p.facing.copy(s.facing); p.pitch = s.pitch; p.camPos = null;
    if (g.room !== s.room) g.enterRoom(s.room);
    p.updateCamera(1);
  };
  // wall time of whole rendered frames, GPU process included (gl.finish): SwiftShader, not a phone
  P.wallFrames = (n) => {
    const g = window.AZ, out = [];
    P.fixedDt = 1 / 60;
    P.drain();
    for (let i = 0; i < n; i++) {
      const t0 = now();
      g.frame();
      P.drain();
      out.push(now() - t0);
    }
    P.fixedDt = null;
    return out.map((v) => Math.round(v));
  };
  // one rendered frame's renderer.info (with the composer, autoReset would keep only the last pass)
  P.renderInfo = () => {
    const g = window.AZ, info = g.renderer.info;
    info.autoReset = false;
    info.reset();
    const gl = P.glCount(() => g.postfx.render());
    const r = { calls: info.render.calls, triangles: info.render.triangles, points: info.render.points, lines: info.render.lines };
    info.autoReset = true;
    return { ...r, gl };
  };
  // DOM work: mutations seen by a MutationObserver
  P.mutations = 0;
  P.mo = new MutationObserver((list) => { P.mutations += list.length; });
  P.mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
  // a transition: the call, then the frames after it (shader compiles and uploads land in frame 1)
  // The JS-visible block (the call + the first frame: compiles, uploads and their sync points);
  // the GPU process is drained before and between frames, and its catch-up (SwiftShader) is
  // reported apart.
  P.transition = (fn) => {
    const g = window.AZ, info = g.renderer.info;
    P.drain();
    const p0 = info.programs.length, t0x = info.memory.textures, g0 = info.memory.geometries;
    const a = now();
    let glCall = null;
    glCall = P.glTime(fn);
    const b = now();
    void document.body.offsetHeight; // style + layout the DOM change, as the next frame would
    const c = now();
    const gl1 = P.glTime(() => g.frame());
    const d = now();
    P.drain();
    const d2 = now();
    const p1 = info.programs.length;
    const kinds = {};
    for (const p of info.programs.slice(p0)) { const k = P.progKind(p); kinds[k] = (kinds[k] || 0) + 1; }
    g.frame();
    const e = now();
    P.drain();
    const e2 = now();
    g.frame();
    const f = now();
    P.drain();
    P.lastTransitionEnd = now();
    return {
      call_ms: +(b - a).toFixed(1), layout_ms: +(c - b).toFixed(1), frame1_ms: +(d - c).toFixed(1), frame2_ms: +(e - d2).toFixed(1), frame3_ms: +(f - e2).toFixed(1),
      ms_blocked: +(d - a).toFixed(1), swiftshader_after_frame1_ms: +(d2 - d).toFixed(1),
      programs_added: info.programs.length - p0, programs_added_frame1: p1 - p0, textures_added: info.memory.textures - t0x, geometries_added: info.memory.geometries - g0,
      new_programs: kinds, gl_call: glCall, gl_frame1: gl1,
    };
  };
};

// run N frames in page with fixed dt, chunked so no single evaluate is huge
async function runFrames(n, { render = true, turn = 0, walk = true } = {}) {
  await az(({ render, turn, walk }) => {
    const g = window.AZ, P = window.__P;
    P.fixedDt = 1 / 60;
    P.turn = turn;
    if (walk) g.input.keys.add('KeyW');
    P.savedRender = P.savedRender || null;
    if (!render) {
      // logic only: the render call is replaced by nothing (its cost is measured separately)
      P.realRender = g.postfx.render;
      g.postfx.render = function () {};
    }
  }, { render, turn, walk });
  let left = n;
  if (render) await az(() => window.__P.drain());
  while (left > 0) {
    const k = Math.min(30, left);
    if (render) await az((k) => window.__P.syncFrames(k), k);
    else await az((k) => { for (let i = 0; i < k; i++) window.AZ.frame(); }, k);
    left -= k;
  }
  await az(({ render }) => {
    const g = window.AZ, P = window.__P;
    if (!render && P.realRender) { g.postfx.render = P.realRender; P.realRender = null; }
    g.input.keys.delete('KeyW');
    P.fixedDt = null;
    P.turn = 0;
  }, { render });
}

const settle = async () => {
  // quiet the HUD (cards, subtitles) and let one-off timers (intro lines) play out in game time
  await az(() => {
    const g = window.AZ;
    for (let i = 0; i < 40; i++) { g.hud.subT = 0; g.simulate(0.1); }
    g.hud.subs = []; g.hud.subT = 0; g.hud.nextSub?.();
    document.querySelector('#card')?.classList.remove('on');
    g.timers = [];
  });
};
const waitSky = async () => {
  // the district's sky (HDR parse + light probe on the CPU, then PMREM on the GPU) loads
  // asynchronously after the build: on a phone that is a hitch in the first seconds of play
  const name = await az(() => window.AZ.postfx.envName || null);
  if (!name) return { sky: null, ms: 0 };
  const t = Date.now();
  await page.waitForFunction((n) => window.AZ.postfx.skies?.[n] || !window.AZ.postfx.q?.env, name, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(300); // let the long task observer deliver
  const lt = await az(() => {
    const t0 = window.__P.lastTransitionEnd || 0;
    return window.__LT.filter(([s]) => s >= t0).map(([, d]) => Math.round(d));
  });
  return { sky: name, ms: Date.now() - t, hdr: !process.env.PERF_NO_HDR, longTasksAfterBuild: lt.slice(0, 8), maxLongTaskMs: Math.max(0, ...lt) };
};

async function heapProfile(fn, frames) {
  await cdp.send('HeapProfiler.enable');
  await cdp.send('HeapProfiler.collectGarbage');
  try {
    await cdp.send('HeapProfiler.startSampling', { samplingInterval: 4096, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true });
  } catch {
    await cdp.send('HeapProfiler.startSampling', { samplingInterval: 4096 });
  }
  await fn();
  const { profile } = await cdp.send('HeapProfiler.stopSampling');
  const by = new Map();
  let total = 0;
  const walk = (n) => {
    const cf = n.callFrame;
    const key = `${cf.functionName || '(anon)'} ${(cf.url || '').split('/').slice(-2).join('/')}:${cf.lineNumber + 1}`;
    if (n.selfSize) { by.set(key, (by.get(key) || 0) + n.selfSize); total += n.selfSize; }
    for (const c of n.children || []) walk(c);
  };
  walk(profile.head);
  const top = [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => ({ fn: k, kbPerFrame: +(v / 1024 / frames).toFixed(1) }));
  return { kbPerFrame: +(total / 1024 / frames).toFixed(1), mbPerSec60: +((total / frames) * 60 / 1048576).toFixed(2), top };
}

async function metrics() {
  const { metrics: m } = await cdp.send('Performance.getMetrics');
  return Object.fromEntries(m.map((x) => [x.name, x.value]));
}

// --- measuring one scene at one quality ----------------------------------------------------------
// light: only what the GPU is asked to do and the render CPU (for the phone default, MEDIUM)
async function measureQuality(scene, q, { light = false } = {}) {
  const out = {};
  // switch quality (the cost of the switch itself is a transition)
  const prevQ = await az(() => window.AZ.settings.quality);
  if (prevQ !== q) {
    const tr = await az((q) => window.__P.transition(() => window.AZ.changeSetting('quality', q)), q);
    results.transitions.push({ name: `${scene}: quality ${prevQ} -> ${q}`, ...tr, renderScale: TINY });
  }
  await az(() => { const P = window.__P; P.restorePose(); P.unwrapAll(); P.instrument(); });
  // warm up at the small buffer: compile what is in view, upload textures
  await runFrames(4, { render: true, walk: false });
  // one full-size frame: draw calls, triangles, render targets and their sizes, then the census
  await az(() => window.__P.setRenderScale(1));
  out.render = await az(() => window.__P.renderInfo());
  out.census = await az(() => window.__P.census());
  // whole frames at full size, GPU process included (SwiftShader: software rasterisation, NOT phone GPU time)
  out.swiftshaderFullFrameWallMs = await az((n) => window.__P.wallFrames(n), RENDER_FRAMES);
  await az((s) => window.__P.setRenderScale(s), TINY);
  // render CPU: three.js traversal, sorting, uniforms and draw submission, at the small buffer
  await az(() => { window.__P.restorePose(); window.__P.frames = []; window.__P.gpuWait = []; });
  await runFrames(light ? 60 : RENDER_CPU_FRAMES, { render: true, turn: 0.004 });
  out.renderCpu = await az(() => {
    const P = window.__P, s = P.summarize(P.frames);
    return Object.fromEntries(Object.entries(s).filter(([k]) => /^(frame|postfx\.render|renderer\.render|shadowMap\.render|pass\.|actor\.animate|updateTheme|updateWorlds|step$)/.test(k)));
  });
  // SwiftShader's own time per frame at the small buffer: what does not shrink with resolution (shadow maps)
  out.swiftshaderSmallFrameMs = await az(() => window.__P.stats(window.__P.gpuWait));
  if (light) return out;
  // game logic, rendering stubbed: what a phone's CPU runs per frame besides rendering
  await az(() => window.__P.restorePose());
  const m0 = await metrics();
  const mut0 = await az(() => { window.__P.frames = []; return window.__P.mutations; });
  await runFrames(FRAMES, { render: false, turn: 0.004 });
  const m1 = await metrics();
  const logic = await az((mut0) => {
    const P = window.__P;
    const fr = P.frames;
    const heap = fr.map((f) => f.heap);
    let drops = 0, grow = 0;
    for (let i = 1; i < heap.length; i++) { const d = heap[i] - heap[i - 1]; if (d < -262144) drops++; else if (d > 0) grow += d; }
    return { phases: P.summarize(fr), frames: fr.length, heapDrops: drops, heapGrowKBPerFrame: +(grow / 1024 / fr.length).toFixed(1), domMutationsPerFrame: +((P.mutations - mut0) / fr.length).toFixed(1), programsAdded: fr.length ? fr[fr.length - 1].programs - fr[0].programs : 0 };
  }, mut0);
  logic.recalcStylePerFrame = +((m1.RecalcStyleCount - m0.RecalcStyleCount) / FRAMES).toFixed(2);
  logic.layoutPerFrame = +((m1.LayoutCount - m0.LayoutCount) / FRAMES).toFixed(2);
  logic.recalcStyleMsPerFrame = +(((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000) / FRAMES).toFixed(3);
  logic.layoutMsPerFrame = +(((m1.LayoutDuration - m0.LayoutDuration) * 1000) / FRAMES).toFixed(3);
  out.logic = logic;
  // allocation pressure, without any instrumentation in the way (rendering included: three.js allocates too)
  await az(() => { const P = window.__P; P.unwrapAll(); P.bare = true; P.restorePose(); });
  const AF = Math.min(FRAMES, 60), AL = Math.min(FRAMES, 120);
  out.alloc = await heapProfile(() => runFrames(AF, { render: true, turn: 0.004 }), AF);
  await az(() => window.__P.restorePose());
  out.allocLogicOnly = await heapProfile(() => runFrames(AL, { render: false, turn: 0.004 }), AL);
  await az(() => { const P = window.__P; P.bare = false; P.instrument(); P.restorePose(); });
  return out;
}

// the real animation loop while walking (W held through the keyboard), turning slowly
async function walk(scene, sec) {
  if (process.env.PERF_SKIP_WALK || !sec) return null;
  await az(() => {
    const P = window.__P, g = window.AZ;
    P.restorePose();
    P.unwrapAll();
    P.instrument();
    P.frames = [];
    P.turn = 0.006;
    P.long = [];
    P.lo = new PerformanceObserver((l) => { for (const e of l.getEntries()) P.long.push({ t: e.startTime, d: e.duration }); });
    P.lo.observe({ type: 'longtask' });
    P.mut0 = P.mutations;
    P.prog0 = g.renderer.info.programs.length;
    g.renderer.setAnimationLoop(() => g.frame());
  });
  const m0 = await metrics();
  await browser.startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-v8.gc'] });
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(sec * 1000);
  await page.keyboard.up('KeyW');
  const trace = await browser.stopTracing();
  const m1 = await metrics();
  const res = await az(() => {
    const P = window.__P, g = window.AZ;
    g.renderer.setAnimationLoop(null);
    P.lo.disconnect();
    P.turn = 0;
    const fr = P.frames;
    const iv = fr.slice(1).map((f, i) => f.t - fr[i].t);
    const span = fr.length > 1 ? (fr[fr.length - 1].t - fr[0].t) / 1000 : 1;
    // which phase each long frame spent its time in
    const PH = ['step', 'updateWorlds', 'updateTheme', 'minimap.drawMini', 'postfx.render', 'shadowMap.render', 'saveTo', 'deckWorld.update', 'npcs.update', 'world.update', 'player.update', 'findFocus', 'hud.setState', 'updateHudMood', 'enterRoom', 'deckWorld.refresh', 'world.refresh'];
    const longFrames = fr.filter((f) => f.frame > 50).map((f) => ({ ms: +f.frame.toFixed(1), top: PH.filter((k) => f[k]).sort((a, b) => f[b] - f[a]).slice(0, 3).map((k) => `${k} ${f[k].toFixed(1)}`) }));
    const progs = fr.map((f) => f.programs);
    const progFrames = fr.filter((f, i) => i && f.programs > fr[i - 1].programs).map((f) => ({ ms: +f.frame.toFixed(1), added: f.programs - fr[fr.indexOf(f) - 1].programs }));
    const lt = P.long;
    const pos = g.player.pos;
    return {
      frames: fr.length, fps: +(fr.length / span).toFixed(1), interval: P.stats(iv), frameJs: P.stats(fr.map((f) => f.frame)),
      over33: iv.filter((v) => v > 33.4).length, over50: iv.filter((v) => v > 50).length, over100: iv.filter((v) => v > 100).length,
      // a gap the frame's own JS does not explain: the main thread waited (GPU process / SwiftShader JIT, GC, other tasks)
      gapsNotJs: iv.filter((v, i) => v > 50 && fr[i].frame < 20).length,
      gapsNotJsMs: Math.round(iv.reduce((s, v, i) => s + (v > 50 && fr[i].frame < 20 ? v - fr[i].frame : 0), 0)),
      longTasks: { n: lt.length, totalMs: Math.round(lt.reduce((s, e) => s + e.d, 0)), maxMs: Math.round(Math.max(0, ...lt.map((e) => e.d))) },
      longFramesTop: longFrames.sort((a, b) => b.ms - a.ms).slice(0, 6),
      programsAddedWhileWalking: progs.length ? progs[progs.length - 1] - P.prog0 : 0, compileFrames: progFrames.slice(0, 8),
      phases: Object.fromEntries(Object.entries(P.summarize(fr)).filter(([k]) => /^(frame|step|updateWorlds|updateTheme|minimap\.drawMini|postfx\.render|renderer\.render|shadowMap\.render|hud\.update|updateHudMood|saveTo|player\.updateCamera|player\.update|findFocus|actor\.animate|deckWorld\.update|world\.update|npcs\.update|enterRoom)$/.test(k))),
      domMutationsPerFrame: +((P.mutations - P.mut0) / Math.max(1, fr.length)).toFixed(1),
      heap: P.stats(fr.map((f) => f.heap / 1048576)),
      endPos: [+pos.x.toFixed(2), +pos.y.toFixed(2), +pos.z.toFixed(2)],
    };
  });
  const frames = res.frames || 1;
  res.recalcStylePerFrame = +((m1.RecalcStyleCount - m0.RecalcStyleCount) / frames).toFixed(2);
  res.layoutPerFrame = +((m1.LayoutCount - m0.LayoutCount) / frames).toFixed(2);
  res.styleLayoutMsPerFrame = +((((m1.RecalcStyleDuration - m0.RecalcStyleDuration) + (m1.LayoutDuration - m0.LayoutDuration)) * 1000) / frames).toFixed(2);
  res.scriptMsPerSec = +(((m1.ScriptDuration - m0.ScriptDuration) * 1000) / WALK).toFixed(1);
  res.taskMsPerSec = +(((m1.TaskDuration - m0.TaskDuration) * 1000) / WALK).toFixed(1);
  // GC events from the trace (renderer main thread)
  try {
    const ev = JSON.parse(trace.toString()).traceEvents;
    const main = new Set(ev.filter((e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain').map((e) => `${e.pid}:${e.tid}`));
    const gc = { minor: 0, major: 0, minorMs: 0, majorMs: 0, maxMs: 0 };
    // one name per GC: the timeline's MinorGC / MajorGC, or V8's own events when those are missing
    const onMain = ev.filter((e) => main.has(`${e.pid}:${e.tid}`) && e.ph === 'X');
    const timeline = onMain.some((e) => e.name === 'MinorGC' || e.name === 'MajorGC');
    const MINOR = timeline ? ['MinorGC'] : ['V8.GC_SCAVENGER', 'V8.GC_MC_SCAVENGER', 'V8.GC_MINOR_MARK_SWEEPER'];
    const MAJOR = timeline ? ['MajorGC'] : ['V8.GC_MARK_COMPACTOR'];
    for (const e of onMain) {
      const d = (e.dur || 0) / 1000;
      if (MINOR.includes(e.name)) { gc.minor++; gc.minorMs += d; gc.maxMs = Math.max(gc.maxMs, d); }
      if (MAJOR.includes(e.name)) { gc.major++; gc.majorMs += d; gc.maxMs = Math.max(gc.maxMs, d); }
    }
    gc.source = timeline ? 'timeline' : 'v8.gc';
    gc.minorMs = +gc.minorMs.toFixed(1); gc.majorMs = +gc.majorMs.toFixed(1); gc.maxMs = +gc.maxMs.toFixed(1);
    gc.perSec = +((gc.minor + gc.major) / WALK).toFixed(2);
    res.gc = gc;
  } catch (e) {
    res.gc = { error: e.message };
  }
  return res;
}

async function measureScene(name, reach) {
  const t = Date.now();
  log(`scene ${name}: reaching`);
  let reached;
  try {
    reached = await reach();
  } catch (e) {
    results.skipped.push(`${name}: ${e.message.split('\n')[0]}`);
    log(`  skipped: ${e.message.split('\n')[0]}`);
    return;
  }
  const sky = await waitSky();
  await settle();
  await az(() => window.__P.savePose());
  const sc = (results.scenes[name] = { reached, sky, qualities: {} });
  for (const q of QUALITIES) {
    log(`  ${name} @ ${q}`);
    sc.qualities[q] = await measureQuality(name, q);
  }
  for (const q of LIGHT_QUALITIES.filter((x) => !QUALITIES.includes(x))) {
    log(`  ${name} @ ${q} (census + render CPU)`);
    sc.qualities[q] = await measureQuality(name, q, { light: true });
  }
  // walk in the real loop (at the phone default quality)
  const wq = WALK && !process.env.PERF_SKIP_WALK ? WALK_QUALITY : null;
  const cur = await az(() => window.AZ.settings.quality);
  if (wq && cur !== wq) {
    const tr = await az((q) => window.__P.transition(() => window.AZ.changeSetting('quality', q)), wq);
    results.transitions.push({ name: `${name}: quality ${cur} -> ${wq}`, ...tr, renderScale: TINY });
  }
  if (wq) {
    log(`  ${name}: walking ${WALK}s @ ${wq}`);
    sc.walk = await walk(name, WALK);
    if (sc.walk) { sc.walk.quality = wq; sc.walk.renderScale = TINY; }
  }
  // back to the first quality for what comes next
  const now = await az(() => window.AZ.settings.quality);
  if (now !== QUALITIES[0]) {
    const tr = await az((q) => window.__P.transition(() => window.AZ.changeSetting('quality', q)), QUALITIES[0]);
    results.transitions.push({ name: `${name}: quality ${now} -> ${QUALITIES[0]}`, ...tr, renderScale: TINY });
  }
  await az(() => window.__P.restorePose());
  sc.wallSec = Math.round((Date.now() - t) / 1000);
}

const trans = async (name, fn, arg) => {
  const r = await az(([src, arg]) => {
    const f = new Function('arg', `return (${src})(arg)`);
    return window.__P.transition(() => f(arg));
  }, [fn.toString(), arg]);
  results.transitions.push({ name, ...r, renderScale: TINY });
  log(`  transition ${name}: blocked ${r.ms_blocked} ms, +${r.programs_added} programs`);
  return r;
};

// --- boot ----------------------------------------------------------------------------------------
log(`booting (${VW}x${VH} @${DPR}x, touch)`);
let t = Date.now();
await page.goto(url);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForFunction(() => window.AZ, null, { timeout: 300000 });
results.boot.toGameMs = Date.now() - t;
await az(() => window.AZ.renderer.setAnimationLoop(null)); // the title backdrop is not measured
await az(HELPERS);
// what this page chose on its own (software GL is detected and starts on LOW; a phone starts on MEDIUM)
results.boot.defaults = await az(() => ({ touch: window.AZ.touch, quality: window.AZ.settings.quality, smart: window.AZ.settings.smart, pixelRatio: window.AZ.renderer.getPixelRatio(), antialias: window.AZ.renderer.getContextAttributes().antialias, renderer: (() => { const gl = window.AZ.renderer.getContext(); const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : ''; })(), parallelShaderCompile: !!window.AZ.renderer.getContext().getExtension('KHR_parallel_shader_compile') }));
await az((s) => {
  const g = window.AZ, P = window.__P;
  P.hookPixelRatio();
  P.renderScale = s;
  g.changeSetting('smart', false);
  g.changeSetting('hero', { id: 'nova' });
  g.changeSetting('quality', 'high');
}, TINY);
await az(() => window.__P.hookFrame());
t = Date.now();
await az(() => { window.AZ.renderer.setAnimationLoop(null); window.AZ.begin('new'); });
await page.waitForFunction(() => window.AZ.started && window.AZ.room, null, { timeout: 300000 });
results.boot.beginMs = Date.now() - t;
results.boot.firstFrame = await az(() => window.__P.transition(() => {}));
log(`booted: game ${results.boot.toGameMs} ms, begin ${results.boot.beginMs} ms, first frame ${results.boot.firstFrame.frame1_ms} ms (+${results.boot.firstFrame.programs_added} programs)`);

// --- scenes, in story order (each start* builds on the last), with the transitions between them
const want = new Set(SCENES);
const STATION_FACTS = ['shard_touch', 'left_antechamber', 'has_device', 'has_tick', 'met_juno', 'heard_varga', 'seen_echo'];

if (want.has('station_antechamber')) {
  await measureScene('station_antechamber', async () => az(() => { const g = window.AZ; g.enterRoom('antechamber', true); return { mode: g.mode, room: g.room }; }));
}
if (want.has('station_lab') || want.has('station_antechamber')) {
  await az((facts) => {
    const g = window.AZ;
    for (const k of facts) g.facts.set(k);
    for (const t of ['GRAVITY', 'INVERTS', 'PHYSICAL', 'INVERTED', 'ECHO', 'HELD', 'PERSISTS']) g.facts.set(`token_${t}`);
    g.engine.unlockSlot(2);
    g.engine.lock('antechamber', false);
  }, STATION_FACTS);
  await trans('station: enter room antechamber -> lab', () => { window.AZ.enterRoom('lab', true); window.AZ.hud.subs = []; });
}
if (want.has('station_lab')) {
  await measureScene('station_lab', async () => az(() => { const g = window.AZ; if (g.room !== 'lab') g.enterRoom('lab', true); return { mode: g.mode, room: g.room }; }));
}
// transitions in Station Zero at the first quality
if (want.has('station_lab')) {
  await az(() => { window.__P.unwrapAll(); window.__P.instrument(); });
  for (const s of ['ECHO', 'INVERTED', 'PHYSICAL', 'ECHO', 'PHYSICAL']) await trans(`station lab: reality state -> ${s}`, (s) => window.AZ.engine.setState(window.AZ.room, s, { force: true }), s);
  await trans('station: enter room lab -> hall', () => window.AZ.enterRoom('hall', true));
  await trans('station: enter room hall -> lab', () => window.AZ.enterRoom('lab', true));
  for (const m of ['pause', 'laws', 'journal', 'map']) {
    await trans(`menu open ${m}`, (m) => window.AZ.openMenu(m), m);
    await trans(`menu close ${m}`, () => window.AZ.closeMenu());
  }
  await trans('quality high -> low', () => window.AZ.changeSetting('quality', 'low'));
  await trans('quality low -> high', () => window.AZ.changeSetting('quality', 'high'));
  await trans('quality high -> low (2nd)', () => window.AZ.changeSetting('quality', 'low'));
  await trans('quality low -> high (2nd)', () => window.AZ.changeSetting('quality', 'high'));
  await az(() => { window.AZ.settings.smart = true; window.AZ.smart.reset(); });
  await trans('smart setScale 0.9', () => window.AZ.smart.setScale(0.9));
  await trans('smart setScale 0.6', () => window.AZ.smart.setScale(0.6));
  await trans('smart setScale 1.0', () => window.AZ.smart.setScale(1));
  await trans('smart setLevel high -> medium', () => window.AZ.smart.setLevel('medium', 'perf'));
  await trans('smart setLevel medium -> low', () => window.AZ.smart.setLevel('low', 'perf'));
  await trans('smart setLevel low -> medium', () => window.AZ.smart.setLevel('medium', 'perf'));
  await trans('smart setLevel medium -> high', () => window.AZ.smart.setLevel('high', 'perf'));
  await az(() => { const g = window.AZ; g.settings.smart = false; g.smart.reset(); g.applyQuality(); g.hud.toastT = 0; document.querySelector('#toast')?.classList.remove('on'); });
}

// HALCYON: from the station, as the vault recording would
const toHalcyon = async () => {
  await az(() => { for (const k of ['archive_open', 'custodian_remembers', 'wrote_law', 'vault_seen']) window.AZ.facts.set(k); });
  const r = await trans('station -> HALCYON (startZones, Neon Meridian 1)', () => window.AZ.startZones({ zones: true, deck: 0, sector: 0, flags: {}, visited: [] }));
  return r;
};
let inHalcyon = false;
if (want.has('halcyon_neon')) {
  await measureScene('halcyon_neon', async () => {
    await toHalcyon();
    inHalcyon = true;
    return az(() => ({ mode: window.AZ.mode, level: window.AZ.level.id, name: window.AZ.level.rooms[window.AZ.room].name }));
  });
  await az(() => { window.__P.unwrapAll(); window.__P.instrument(); });
  for (const s of ['ECHO', 'INVERTED', 'PHYSICAL']) await trans(`halcyon neon: reality state -> ${s}`, (s) => window.AZ.engine.setState(window.AZ.room, s, { force: true }), s);
  await trans('halcyon: next district (neon 1 -> neon 2)', () => { const g = window.AZ; g.campaign.sector = 1; g.campaign.flags = {}; g.loadSector(true); });
  await trans('menu open map (district)', () => window.AZ.openMenu('map'));
  await trans('menu close map (district)', () => window.AZ.closeMenu());
}
if (want.has('halcyon_reactor')) {
  await measureScene('halcyon_reactor', async () => {
    if (!inHalcyon) { await toHalcyon(); inHalcyon = true; }
    await trans('halcyon: next chapter (-> Drowned Reactor 1)', () => { const g = window.AZ; g.campaign.deck = 1; g.campaign.sector = 0; g.campaign.flags = {}; g.loadSector(true); });
    return az(() => ({ mode: window.AZ.mode, level: window.AZ.level.id, name: window.AZ.level.rooms[window.AZ.room].name }));
  });
}
if (want.has('cradle')) {
  await measureScene('cradle', async () => {
    await trans('-> THE CRADLE (startZones cradle)', () => { const g = window.AZ; g.run = 'cradle'; g.startZones(null, 'cradle', null); });
    await trans('cradle: next district (1 -> 3, two drones)', () => { const g = window.AZ; g.campaign.sector = 2; g.campaign.flags = {}; g.loadSector(true); });
    return az(() => ({ mode: window.AZ.mode, level: window.AZ.level.id, name: window.AZ.level.rooms[window.AZ.room].name, drones: window.AZ.level.sentinels.length }));
  });
}
if (want.has('vessel_medbay')) {
  await measureScene('vessel_medbay', async () => {
    await trans('-> the Vessel (startVessel 101, deck 1)', () => window.AZ.startVessel(101, null, null, null));
    await trans('vessel: load deck 5 (Medbay) sector 1', () => { const g = window.AZ; g.campaign.deck = 4; g.campaign.sector = 0; g.campaign.flags = {}; g.campaign.visited = []; g.loadSector(true); });
    return az(() => ({ mode: window.AZ.mode, level: window.AZ.level.id, deck: window.AZ.story.decks[window.AZ.campaign.deck].name, rooms: window.AZ.level.order.length, watchers: window.AZ.level.sentinels?.length }));
  });
  if (results.scenes.vessel_medbay) {
    await az(() => { window.__P.unwrapAll(); window.__P.instrument(); });
    await trans('vessel: enter next room', () => { const g = window.AZ; g.enterRoom(g.level.order[1], true); });
    for (const s of ['ECHO', 'INVERTED', 'PHYSICAL']) await trans(`vessel: reality state -> ${s}`, (s) => window.AZ.engine.setState(window.AZ.room, s, { force: true }), s);
    await trans('vessel: next sector (Medbay 1 -> 2)', () => { const g = window.AZ; g.campaign.sector = 1; g.campaign.flags = {}; g.campaign.visited = []; g.loadSector(true); });
  }
}
if (want.has('forge')) {
  await measureScene('forge', async () => {
    await trans('-> WORLD FORGE act 1 (startForge 4242, SHORT HORROR)', () => { const g = window.AZ; g.run = 'forge'; g.startForge(4242, null, { genre: 'HORROR', length: 'SHORT' }); });
    return az(() => ({ mode: window.AZ.mode, level: window.AZ.level.id, act: window.AZ.forgeAct().name, theme: window.AZ.forgeAct().theme }));
  });
}

// --- the smart renderer, fed synthetic frame times -------------------------------------------------
if (!process.env.PERF_SKIP_SMART) {
  log('smart renderer: synthetic frame times');
  const PATTERNS = {
    'steady 16.7 ms': { kind: 'fixed', ms: [16.7] },
    'steady 19 ms': { kind: 'fixed', ms: [19] },
    'alternating 17/21 ms': { kind: 'fixed', ms: [17, 21] },
    'steady 21 ms': { kind: 'fixed', ms: [21] },
    'steady 25 ms': { kind: 'fixed', ms: [25] },
    '16.7 ms + 150 ms hitch every 2 s': { kind: 'hitch', ms: 16.7, hitch: 150, every: 2 },
    // frame time that follows the renderer's own choices: cpu + gpu(preset) * scale^2
    'GPU-bound model: 6 + {high 22, medium 9, low 5} * scale^2': { kind: 'model', cpu: 6, gpu: { high: 22, medium: 9, low: 5 } },
    'GPU-bound model: 8 + {high 12, medium 8, low 5} * scale^2': { kind: 'model', cpu: 8, gpu: { high: 12, medium: 8, low: 5 } },
    'GPU-bound model + 300 ms compile hitch after each preset change': { kind: 'model', cpu: 6, gpu: { high: 22, medium: 9, low: 5 }, hitchAfterLevel: 300 },
    'thermal: 8 + {12, 8, 5} * scale^2 * (1 -> 1.6 over the minute)': { kind: 'model', cpu: 8, gpu: { high: 12, medium: 8, low: 5 }, thermal: 0.6 },
  };
  for (const [name, pat] of Object.entries(PATTERNS)) {
    results.smart[name] = await az(({ pat, sec }) => {
      const g = window.AZ, s = g.smart, P = window.__P;
      P.unwrapAll();
      g.renderer.setAnimationLoop(null);
      if (g.menu) g.closeMenu();
      g.paused = false;
      g.settings.smart = true;
      g.settings.quality = 'high';
      s.reset();
      s.acc = 0; s.frames = 0;
      g.applyQuality();
      const count = { applyQuality: 0, setPixelRatio: 0, setSize: 0, composerRebuild: 0, toast: 0 };
      const patch = (o, n, k) => { const f = o[n]; o[n] = function (...a) { count[k]++; return f.apply(this, a); }; return () => { o[n] = f; }; };
      const undo = [patch(g, 'applyQuality', 'applyQuality'), patch(g.renderer, 'setPixelRatio', 'setPixelRatio'), patch(g.renderer, 'setSize', 'setSize'), patch(g.postfx, 'apply', 'composerRebuild'), patch(g.hud, 'toast', 'toast')];
      const events = [];
      let t = 0, i = 0, last = `${s.level}@${s.scale}`, hitchNext = 0, lastHitch = 0;
      while (t < sec) {
        let ms;
        if (pat.kind === 'fixed') ms = pat.ms[i % pat.ms.length];
        else if (pat.kind === 'hitch') { ms = t - lastHitch >= pat.every ? ((lastHitch = t), pat.hitch) : pat.ms; }
        else {
          const lvl = s.quality().label.toLowerCase();
          ms = pat.cpu + pat.gpu[lvl] * s.scale * s.scale * (1 + (pat.thermal || 0) * (t / sec));
          if (hitchNext) { ms += hitchNext; hitchNext = 0; }
        }
        s.sample(ms / 1000);
        t += ms / 1000;
        i++;
        const now = `${s.level}@${s.scale}`;
        if (now !== last) {
          const [l0] = last.split('@');
          if (pat.hitchAfterLevel && l0 !== s.level) hitchNext = pat.hitchAfterLevel;
          events.push({ t: +t.toFixed(1), to: now, fps: +(s.fps || 0).toFixed(1) });
          last = now;
        }
      }
      undo.forEach((u) => u());
      // flips: a change that undoes the change before it
      let flips = 0;
      const states = ['high@1', ...events.map((e) => e.to)];
      for (let k = 2; k < states.length; k++) if (states[k] === states[k - 2]) flips++;
      const res = { perMinute: { changes: events.length, scaleOrLevelFlips: flips, ...count }, final: last, events: events.slice(0, 30) };
      g.settings.smart = false;
      s.reset();
      g.applyQuality();
      g.hud.toastT = 0;
      document.querySelector('#toast')?.classList.remove('on');
      return res;
    }, { pat, sec: 60 });
  }
  await az(() => window.AZ.changeSetting('quality', 'high'));
}

// --- write and summarise -------------------------------------------------------------------------
results.meta.wallSec = Math.round((Date.now() - T0) / 1000);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(results, null, 1));

const r1 = (v) => (v == null ? null : +(+v).toFixed(1));
const summary = { out: OUT, wallSec: results.meta.wallSec, view: `${VW}x${VH}@${DPR}`, renderScale: TINY, boot: { defaults: results.boot.defaults, firstFrameMs: results.boot.firstFrame?.ms_blocked, firstFramePrograms: results.boot.firstFrame?.programs_added }, scenes: {}, transitions: {}, smart: {}, skipped: results.skipped, errors: errors.slice(0, 5) };
for (const [name, sc] of Object.entries(results.scenes)) {
  const o = (summary.scenes[name] = { sky: sc.sky?.sky ? `${sc.sky.sky} ${sc.sky.ms}ms, max long task ${sc.sky.maxLongTaskMs}ms` : null });
  for (const [q, m] of Object.entries(sc.qualities)) {
    const c = m.census, rc = m.renderCpu || {};
    const e = (o[q] = {
      draws: m.render.calls, tris: m.render.triangles, gl: m.render.gl.total, targets: m.render.gl.targets.length, progs: c.programs, geos: c.memory.geometries, texs: c.memory.textures,
      lights: Object.entries(c.lights).map(([k, v]) => `${k.replace('Light', '')}:${v.n}${v.lit !== v.n ? `(${v.lit}lit)` : ''}${v.shadow ? `(${v.shadow}sh)` : ''}`).join(' '),
      meshes: `${c.meshes.visible}v/${c.meshes.inView}inview/${c.meshes.skinnedVisible}sk/${c.meshes.transparent}tr/${c.meshes.castShadow}cast`,
      buffer: `${c.canvas.buffer}@${c.canvas.pixelRatio}`, mixers: c.mixers, mixersInView: c.mixersInView,
      renderCpuMs: { avg: r1(rc['postfx.render']?.avg), p95: r1(rc['postfx.render']?.p95) }, renderCallsPerFrame: rc['renderer.render']?.callsPerFrame, shadowCpuMs: r1(rc['shadowMap.render']?.avg), actorsMs: r1(rc['actor.animate']?.avg),
      shadowMapPasses: c.shadowMap ? m.render.gl.targets.filter((t) => t.vp === `${c.shadowMap}x${c.shadowMap}`).length : 0,
      sceneTextureMB: c.sceneTextureMB, jsHeapMB: c.jsHeapMB,
      swiftshaderFrameMs: { full: m.swiftshaderFullFrameWallMs, small: r1(m.swiftshaderSmallFrameMs?.avg) },
    });
    if (m.logic) {
      const ph = m.logic.phases;
      Object.assign(e, {
        logicMs: { avg: r1(ph.frame?.avg), p95: r1(ph.frame?.p95) },
        step: r1(ph.step?.avg), worlds: r1(ph.updateWorlds?.avg), theme: r1(ph.updateTheme?.avg), mini: r1(ph['minimap.drawMini']?.avg), actors: r1(ph['actor.animate']?.avg), hudMood: r1(ph.updateHudMood?.avg),
        allocKBf: m.alloc.kbPerFrame, allocLogicKBf: m.allocLogicOnly.kbPerFrame, domMutF: m.logic.domMutationsPerFrame, styleF: m.logic.recalcStylePerFrame, layoutF: m.logic.layoutPerFrame,
      });
    }
  }
  if (sc.walk) {
    const w = sc.walk;
    o.walk = { q: w.quality, frameJsMs: w.frameJs && { avg: r1(w.frameJs.avg), p95: r1(w.frameJs.p95), max: r1(w.frameJs.max) }, longFrames: w.longFramesTop?.length || 0, fps_compositorBound: w.fps, intervalP95: r1(w.interval?.p95), gapsNotJs: w.gapsNotJs, longTasks: w.longTasks, gc: w.gc && { n: (w.gc.minor || 0) + (w.gc.major || 0), ms: r1((w.gc.minorMs || 0) + (w.gc.majorMs || 0)), max: w.gc.maxMs }, newPrograms: w.programsAddedWhileWalking, styleF: w.recalcStylePerFrame, layoutF: w.layoutPerFrame };
  }
}
// GPU objects left behind by switching presets back and forth (each pair ends where it started)
const sumOf = (re) => {
  const ts = results.transitions.filter((x) => re.test(x.name));
  return { transitions: ts.length, textures: ts.reduce((n, x) => n + x.textures_added, 0), geometries: ts.reduce((n, x) => n + x.geometries_added, 0), programs: ts.reduce((n, x) => n + x.programs_added, 0) };
};
summary.leakCheck = { qualityRoundTrips_high_low_high_x2: sumOf(/^quality (high|low) -> (low|high)/), smartSetLevel_high_med_low_med_high: sumOf(/^smart setLevel/) };
for (const tr of results.transitions) summary.transitions[tr.name] = `${tr.ms_blocked}ms (call ${tr.call_ms}, frame1 ${tr.frame1_ms}; compile ${tr.gl_frame1?.compileMs ?? '?'}+${tr.gl_call?.compileMs ?? 0}, upload ${tr.gl_frame1?.uploadMs ?? '?'}+${tr.gl_call?.uploadMs ?? 0}) +${tr.programs_added}p +${tr.textures_added}tex`;
for (const [k, v] of Object.entries(results.smart)) summary.smart[k] = `${v.perMinute.changes} changes, ${v.perMinute.scaleOrLevelFlips} flips, ${v.perMinute.applyQuality} applyQuality, ${v.perMinute.setSize} setSize -> ${v.final}`;
console.log(JSON.stringify(summary, null, 1));
await browser.close();
server.close();
