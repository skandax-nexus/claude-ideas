#!/usr/bin/env node
// Renders a portrait of each of Ren's looks (world/People.js LOOKS) for the
// character screen's buttons: game/assets/looks/<id>.webp.
//   NODE_PATH=$(npm root -g) node tools/look-thumbs.mjs
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'game');
const out = path.join(root, 'assets', 'looks');
fs.mkdirSync(out, { recursive: true });
const PAGE = `<!doctype html><body style="margin:0;background:transparent"><canvas id=c></canvas><script type="module">
import * as THREE from './vendor/three.module.min.js';
import { RoomEnvironment } from './vendor/addons/environments/RoomEnvironment.js';
import { loadActors, makeActor } from './js/world/Actors.js';
import { LOOKS, heroLook } from './js/world/People.js';
const W = 240, H = 300;
const r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true });
r.setSize(W, H); r.setClearColor(0, 0); r.toneMapping = THREE.ACESFilmicToneMapping;
const sc = new THREE.Scene();
sc.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
const d = new THREE.DirectionalLight(0xffffff, 1.8); d.position.set(2, 4, 5); sc.add(d, new THREE.HemisphereLight(0xffffff, 0xaab, 0.8));
await loadActors(Object.values(LOOKS).map((l) => l.model));
const cam = new THREE.PerspectiveCamera(24, W / H, 0.1, 50);
window.shots = {};
for (const id of Object.keys(LOOKS)) {
  const a = makeActor(heroLook({ id }));
  a.rotation.y = -0.35;
  sc.add(a);
  for (let i = 0; i < 40; i++) a.userData.animate(1 / 60, 0, i / 60);
  // frame the head and upper body from the head bone, centred on it
  a.updateMatrixWorld(true);
  const hp = a.userData.head.getWorldPosition(new THREE.Vector3());
  cam.position.set(hp.x + 0.15, hp.y - 0.12, hp.z + 3.2); cam.lookAt(hp.x, hp.y - 0.36, hp.z);
  r.render(sc, cam);
  window.shots[id] = c.toDataURL('image/webp', 0.86);
  sc.remove(a);
}
window.DONE = true;
</script>`;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/__looks.html') return res.writeHead(200, { 'content-type': 'text/html' }).end(PAGE);
  const p = path.join(root, u);
  if (!p.startsWith(root) || !fs.existsSync(p)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto(`http://localhost:${server.address().port}/__looks.html`);
await page.waitForFunction(() => window.DONE, null, { timeout: 300000 });
for (const [id, url] of Object.entries(await page.evaluate(() => window.shots))) {
  fs.writeFileSync(path.join(out, `${id}.webp`), Buffer.from(url.split(',')[1], 'base64'));
  console.log(`assets/looks/${id}.webp`);
}
await browser.close();
server.close();
