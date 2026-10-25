// THE LAST VERSION OF EARTH: the settlement's clothes on the bodies that wear them, in the browser (castfin round 1).
// Every person here is made and dressed as the game makes and dresses them (Actors.makeActor, casting.makeDresser: the
// wardrobe's dyes and garments.js's clothe, its pieces cut round the body as it stands, restInfo), then posed by the
// game's own idle and walk:
//   - the tunic's skirt (garments.js's own, built alone round restInfo, worn on the same skeleton): standing (after 3, 40
//     and 100 idle frames) no leg the body still draws lies outside it between its hem and its top; walking (a stride's
//     phases, frames 130 to 172 at 1.2 m/s) at most LV_WALK_SHARE (15%, and 2 points) of those leg points through it
//     (outside it, 5 cm or more above its hem there, with the skirt under them: not a foot stepping out from under the
//     hem) and none deeper than LV_WALK_DEPTH (16 cm). (What is left is the top of a shin the body still draws, at the
//     hem as a stride lifts it; before this round, a stride put a fifth of the legs through, 26 cm deep.)
//   - the body under a long skirt is drawn without the legs it covers (garments.js covered), its own buffers shared;
//   - the settlement's feet (wardrobe.js feetOf and LEATHER): a mask on the body's map, and the texels under it dyed a
//     dark leather (their lightness 0.3 at most on average, at most 2% of them above 0.45);
//   - the Helix technicians on the paramedic's body: no PARAMEDIC across the back (the patch is one even slate).
// With --fixtures it also writes tests/fixtures/garment-poses.json: the bones of the child's, a woman's and a man's body
// as the game poses them standing (restInfo's three idle frames) and in three phases of the stride, which the unit test
// (tests/lastversion.test.mjs) wears the skirts in without a browser.
//   NODE_PATH=$(npm root -g) node tests/lastversion-garments.mjs [--fixtures]
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', 'game');
const WRITE = process.argv.includes('--fixtures');
const SHARE = +(process.env.LV_WALK_SHARE || 0.15), DEPTH = +(process.env.LV_WALK_DEPTH || 0.16);
const PEOPLE = [
  ['rb_child_m2', 'fire_girl1'], ['rb_child_m2', 'fire_boy2'], ['rb_child_m2', 'water_girl4'], ['rb_child_m2', 'water_boy3'], ['rb_child_m2', 'girl_m4'],
  ['rb_vill_f', 'fire1'], ['rb_vill_f2', 'water2'], ['rb_vill_m', 'fire1'], ['rb_vill_m2', 'sky2'], ['rb_elder_m', 'storyteller'], ['rb_sage_m', 'astronomer'],
  ['rb_niko', 'niko'], ['rb_niko_old', 'older'], ['rb_tala', 'tala'], ['rb_elder', 'elder'],
];
const FIXTURES = { rb_child_m2: 'fire_girl1', rb_vill_f: 'fire1', rb_vill_m: 'fire1' };
// (LV_ONLY=rb_child_m2,rb_vill_f: those people alone)
if (process.env.LV_ONLY) PEOPLE.splice(0, PEOPLE.length, ...PEOPLE.filter(([m, v]) => process.env.LV_ONLY.split(',').some((k) => `${m}/${v}`.startsWith(k))));
const STRIDE = [136, 148, 160];

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.opus': 'audio/ogg' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-watchdog'] });
const page = await (await browser.newContext({ viewport: { width: 400, height: 300 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route('**/*', (r) => (new URL(r.request().url()).hostname === 'localhost' ? r.continue() : r.abort()));
await page.goto(`http://localhost:${server.address().port}/index.html?edition=lastversion`);
await page.waitForFunction(() => window.AZ && AZ.renderer, null, { timeout: 300000 });

const out = await page.evaluate(async ([people, fixtures, stride, debug, share, depth]) => {
  AZ.renderer.setAnimationLoop(null);
  const THREE = await import('/vendor/three.module.min.js');
  const C = await import('/js/editions/lastversion/casting.js');
  const A = await import('/js/world/Actors.js');
  const G = await import('/js/editions/lastversion/garments.js');
  const W = await import('/js/editions/lastversion/wardrobe.js');
  C.registerModels();
  await A.loadActors(['xbot', 'rb_medic_f', ...new Set(people.map((p) => p[0]))]);
  const dresser = C.makeDresser(() => AZ.renderer);
  const LEGS = /^Bip01_(Pelvis|[LR]_(Thigh|Calf))$/;
  const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const rc = new THREE.Raycaster();
  // a texture's texels, read back from the GPU
  const texels = (t) => {
    const w = t.image.width, h = t.image.height, rt = new THREE.WebGLRenderTarget(w, h), sc = new THREE.Scene();
    const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { m: { value: t } }, vertexShader: 'varying vec2 u; void main() { u = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: 'uniform sampler2D m; varying vec2 u; void main() { gl_FragColor = texture2D(m, u); }' }));
    q.frustumCulled = false;
    sc.add(q);
    AZ.renderer.setRenderTarget(rt);
    AZ.renderer.render(sc, new THREE.Camera());
    AZ.renderer.setRenderTarget(null);
    const px = new Uint8Array(w * h * 4);
    AZ.renderer.readRenderTargetPixels(rt, 0, 0, w, h, px);
    rt.dispose();
    return { w, h, px };
  };
  const bonesOf = (body) => Object.fromEntries(body.skeleton.bones.map((b) => [b.name, [...b.quaternion.toArray(), ...b.position.toArray()].map((x) => Math.round(x * 1e5) / 1e5)]));
  const res = [], poses = {};
  for (const [model, variant] of people) {
    const row = { model, variant, fails: [], notes: [] };
    res.push(row);
    let a = A.makeActor({ model, height: C.LV_MODELS[model]?.height });
    a = dresser(a, { model, variant });
    const U = a.userData, garb = W.WARDROBE[model][variant].garb;
    let body = null;
    a.traverse((o) => { if (o.isSkinnedMesh && !body && [].concat(o.material)[0]?.name === 'body') body = o; });
    const info = G._dbg.restInfo(model);
    if (!info) { row.fails.push('no restInfo'); continue; }
    if (!U.garment) row.fails.push('not clothed');
    const bare = body.geometry;
    let fresh = null;
    A.makeActor({ model }).traverse((o) => { if (o.isSkinnedMesh && !fresh && [].concat(o.material)[0]?.name === 'body') fresh = o.geometry; });
    if (!(bare.userData.covered > 0) || bare === fresh || bare.attributes.position !== fresh.attributes.position) row.fails.push('the legs under the skirt are drawn (or the body\'s buffers copied)');
    row.notes.push(`${bare.userData.covered || 0} triangles covered of ${(bare.index.count / 3 + (bare.userData.covered || 0))}`);
    // the skirt alone, as clothe cut it (round restInfo), on the same skeleton
    const sk = G._dbg.build(info, { skirt: garb.skirt });
    const m = new THREE.SkinnedMesh(sk.g, mat);
    m.bind(body.skeleton, body.bindMatrix);
    m.position.copy(body.position); m.quaternion.copy(body.quaternion); m.scale.copy(body.scale);
    body.parent.add(m);
    const names = body.skeleton.bones.map((b) => b.name);
    const si = bare.attributes.skinIndex, sw = bare.attributes.skinWeight, bp = bare.attributes.position;
    const drawn = new Uint8Array(bp.count);
    for (let k = 0; k < bare.index.count; k++) drawn[bare.index.getX(k)] = 1;
    const legs = [];
    for (let i = 0; i < bp.count; i++) {
      if (!drawn[i]) continue;
      let best = 0;
      for (let c = 1; c < 4; c++) if (sw.getComponent(i, c) > sw.getComponent(i, best)) best = c;
      if (LEGS.test(names[si.getComponent(i, best)])) legs.push(i);
    }
    const pelvis = body.skeleton.bones[names.indexOf('Bip01_Pelvis')];
    const v = new THREE.Vector3(), w = new THREE.Vector3(), down = new THREE.Vector3(0, -1, 0);
    let done = 0;
    const phases = [['idle', 3, 0], ['idle', 40, 0], ['idle', 100, 0]];
    for (let f = 130; f <= 172; f += 3) phases.push(['walk', f, 1.2]);
    if (fixtures[model] === variant) phases.push(...stride.filter((f) => !phases.some((p) => p[1] === f)).map((f) => ['walk', f, 1.2]));
    phases.sort((p, q) => p[1] - q[1]);
    let worst = '';
    for (const [kind, f, speed] of phases) {
      for (; done < f; done++) U.animate(1 / 30, speed, done / 30, false);
      a.updateMatrixWorld(true);
      if (fixtures[model] === variant && (f === 3 || stride.includes(f))) (poses[model] ||= {})[f === 3 ? 'stand' : `stride${f}`] = bonesOf(body);
      const gp = sk.g.attributes.position, P = new Float32Array(gp.count * 3);
      let y0 = Infinity, y1 = -Infinity;
      for (let i = 0; i < gp.count; i++) {
        m.applyBoneTransform(i, v.fromBufferAttribute(gp, i)).applyMatrix4(m.matrixWorld);
        P.set([v.x, v.y, v.z], i * 3);
        y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
      }
      const pc = pelvis.getWorldPosition(new THREE.Vector3());
      const bin = (x, z) => ((Math.floor(((Math.atan2(x - pc.x, z - pc.z) + Math.PI) / (2 * Math.PI)) * 16) % 16) + 16) % 16;
      const hemAt = new Float32Array(16).fill(Infinity);
      for (let i = 0; i < gp.count; i++) { const b = bin(P[i * 3], P[i * 3 + 2]); hemAt[b] = Math.min(hemAt[b], P[i * 3 + 1]); }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.BufferAttribute(P, 3));
      sg.setIndex(sk.g.index);
      sg.computeBoundingSphere();
      const smesh = new THREE.Mesh(sg, mat);
      smesh.updateMatrixWorld(true);
      let n = 0, outside = 0, deep = 0;
      for (const i of legs) {
        body.applyBoneTransform(i, v.fromBufferAttribute(bp, i)).applyMatrix4(body.matrixWorld);
        if (v.y > y1 - 0.04) continue;
        const b = bin(v.x, v.z);
        if (v.y < Math.max(...[hemAt[b], hemAt[(b + 1) % 16], hemAt[(b + 15) % 16]].filter(Number.isFinite), -1) + 0.05) continue; // (under the hem, or at it)
        n++;
        const d = new THREE.Vector3(v.x - pc.x, 0, v.z - pc.z), L = d.length();
        if (L < 1e-4) continue;
        rc.set(w.set(pc.x, v.y, pc.z), d.normalize());
        rc.far = L;
        const hits = rc.intersectObject(smesh, false);
        if (!(hits.length % 2)) continue;
        // (through the cloth, not below it: the skirt is there under the point, as it is under a knee that came through
        // its front; a foot stepping out behind the hem has only the ground under it)
        rc.set(w.copy(v), down);
        rc.far = 2;
        if (!rc.intersectObject(smesh, false).length) continue;
        outside++;
        deep = Math.max(deep, L - hits[hits.length - 1].distance);
        if (debug) { let best = 0; for (let c = 1; c < 4; c++) if (sw.getComponent(i, c) > sw.getComponent(i, best)) best = c; row.notes.push(`${kind}${f} v${i} ${names[si.getComponent(i, best)]} bind y ${info.q[i * 3 + 1].toFixed(3)} world y ${v.y.toFixed(3)} out ${(100 * (L - hits[hits.length - 1].distance)).toFixed(1)} cm`); }
      }
      sg.dispose();
      const tag = `${kind}${f}: ${outside}/${n}${outside ? ` (${(deep * 100).toFixed(1)} cm)` : ''}`;
      if (kind === 'idle' && outside) row.fails.push(`standing, ${tag}`);
      if (kind === 'walk' && (outside > Math.max(2, n * share) || deep > depth)) row.fails.push(`walking, ${tag}`);
      if (kind === 'walk' && outside > (+worst.split(': ')[1]?.split('/')[0] || 0)) worst = tag;
    }
    row.notes.push(`worst stride ${worst || 'clean'}`);
    m.removeFromParent();
    // the feet: a mask, and the dyed body map dark leather under it
    const feet = W.feetOf(model, a);
    if (!feet) row.fails.push('no feet mask');
    else {
      const map = texels(body.material.map), mk = texels(feet);
      let k = 0, sum = 0, hi = 0;
      for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
        const my = Math.floor((y / map.h) * mk.h), mx = Math.floor((x / map.w) * mk.w);
        if (mk.px[(my * mk.w + mx) * 4] < 250) continue;
        // (read back linear: its HSL lightness in sRGB, as the wardrobe's rules give it)
        const i = (y * map.w + x) * 4, c = [0, 1, 2].map((j) => { const u = map.px[i + j] / 255; return u <= 0.0031308 ? 12.92 * u : 1.055 * u ** (1 / 2.4) - 0.055; });
        const l = (Math.max(...c) + Math.min(...c)) / 2;
        k++; sum += l; if (l > 0.45) hi++;
      }
      row.notes.push(`feet: ${k} texels, lightness ${(sum / Math.max(1, k)).toFixed(3)}, ${hi} light`);
      if (!k || sum / k > 0.3 || hi > k * 0.02) row.fails.push(`the feet not dark leather (${k} texels, mean lightness ${(sum / Math.max(1, k)).toFixed(3)}, ${hi} light)`);
    }
  }
  // the technicians: the paramedic's PARAMEDIC patch across the back, one even slate
  {
    const row = { model: 'rb_medic_f', variant: 'helix tech', fails: [], notes: [] };
    res.push(row);
    let a = A.makeActor({ model: 'rb_medic_f' });
    a = dresser(a, { model: 'rb_medic_f', variant: 'helix tech' });
    let body = null;
    a.traverse((o) => { if (o.isSkinnedMesh && !body && [].concat(o.material)[0]?.name === 'body') body = o; });
    const t = texels(body.material.map);
    const ls = [];
    for (let y = Math.ceil(0.285 * t.h); y < 0.333 * t.h; y++) for (let x = Math.ceil(0.4 * t.w); x < 0.594 * t.w; x++) { const i = (y * t.w + x) * 4; ls.push((t.px[i] + t.px[i + 1] + t.px[i + 2]) / 765); }
    const mean = ls.reduce((s, x) => s + x, 0) / ls.length, sd = Math.sqrt(ls.reduce((s, x) => s + (x - mean) ** 2, 0) / ls.length);
    row.notes.push(`patch: mean ${mean.toFixed(3)}, sd ${sd.toFixed(4)}`);
    if (sd > 0.01) row.fails.push(`the back's patch is not plain (sd ${sd.toFixed(4)})`);
  }
  return { res, poses };
}, [PEOPLE, FIXTURES, STRIDE, !!process.env.LV_DEBUG, SHARE, DEPTH]);

let failed = 0;
for (const r of out.res) {
  console.log(`${r.fails.length ? 'FAIL' : 'ok  '} ${r.model}/${r.variant}: ${r.notes.join('; ')}${r.fails.length ? `\n     ${r.fails.join('\n     ')}` : ''}`);
  failed += r.fails.length ? 1 : 0;
}
if (WRITE) {
  fs.mkdirSync(path.join(here, 'fixtures'), { recursive: true });
  const f = path.join(here, 'fixtures', 'garment-poses.json');
  fs.writeFileSync(f, `${JSON.stringify({ about: 'tests/lastversion-garments.mjs --fixtures: each body\'s bones (local quaternion x y z w, position x y z) as the game poses them: stand (restInfo\'s three idle frames), stride<n> (after n frames at 30 a second, the first 100 standing, the rest walking at 1.2 m/s)', variants: FIXTURES, poses: out.poses })}\n`);
  console.log(`wrote ${path.relative(path.join(here, '..'), f)} (${fs.statSync(f).size} bytes)`);
}
if (errors.length) { console.log('page errors:', errors); failed++; }
await browser.close();
server.close();
console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
