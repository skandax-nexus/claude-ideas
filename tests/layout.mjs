// Layout check: with everything on screen at once (dialogue, a toast, a prompt,
// the objective, the minimap, held item, touch controls), no two HUD pieces
// overlap, on desktop and phone/tablet sizes. Also checks open menus don't sit
// under the HUD. Screenshots go to tests/screens/layout-*.png.
//   NODE_PATH=$(npm root -g) node tests/layout.mjs
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'game');
const shots = process.env.SCREENS || path.join(path.dirname(fileURLToPath(import.meta.url)), 'screens');
fs.mkdirSync(shots, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const url = process.env.URL || `http://localhost:${server.address().port}/index.html`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

const SIZES = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'laptop', width: 1024, height: 600 },
  { name: 'phone-wide', width: 915, height: 412, touch: true },
  { name: 'phone', width: 844, height: 390, touch: true },
  { name: 'phone-small', width: 667, height: 375, touch: true },
  { name: 'tablet', width: 1024, height: 768, touch: true },
  { name: 'phone-upright', width: 390, height: 844, touch: true },
  { name: 'phone-upright-small', width: 360, height: 740, touch: true },
  { name: 'tablet-upright', width: 768, height: 1024, touch: true },
];
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
// the prompt floats over whatever you can use, so it isn't part of the fixed layout
const HUD = ['#state', '#dock', '#objective', '#minimap', '#held', '#stick', '#buttons', '#subs .sub', '#toast'];

let failures = 0;
for (const s of SIZES.filter((x) => !only || only.includes(x.name))) {
  const ctx = await browser.newContext({ viewport: { width: s.width, height: s.height }, isMobile: !!s.touch, hasTouch: !!s.touch });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.AZ, null, { timeout: 60000 });
  await page.evaluate(() => {
    AZ.changeSetting('hero', { id: 'ren' });
    AZ.changeSetting('minimap', true);
    AZ.begin('vessel');
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    document.querySelector('#card')?.classList.remove('on');
    AZ.hud.subs = [];
    AZ.hud.subT = 0;
    AZ.hud.say([{ who: 'JUNO', text: 'Juno here. I\'m on the radio now - the hatch behind you sealed, but I can hear you. Talk to me if it gets strange, alright?' }], AZ.facts);
    AZ.hud.toast('<small>THEORY LOG</small><br>The echo matches the record. Somebody was there too.', 60000);
    AZ.held = 'key';
    AZ.hud.objective('HYDROPONICS · Find the way to the next sector, then talk to whoever is left.', false);
    AZ.frame?.();
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => document.getAnimations().forEach((a) => { try { a.finish(); } catch { a.cancel(); } }));
  const boxes = await page.evaluate((sel) => {
    const out = [];
    for (const q of sel) {
      for (const el of document.querySelectorAll(q)) {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05 || r.width < 2 || r.height < 2 || !el.textContent.trim() && !el.children.length && q !== '#minimap') continue;
        out.push({ q, x: r.x, y: r.y, w: r.width, h: r.height });
      }
    }
    return out;
  }, HUD);
  const bad = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > 2 && oy > 2) bad.push(`${a.q} x ${b.q} (${Math.round(ox)}x${Math.round(oy)})`);
    }
    const a = boxes[i];
    if (a.x < -1 || a.y < -1 || a.x + a.w > s.width + 1 || a.y + a.h > s.height + 1) bad.push(`${a.q} off screen`);
  }
  await page.screenshot({ timeout: 240000, path: path.join(shots, `layout-${s.name}.png`) });
  console.log(`${bad.length ? 'FAIL' : 'ok  '} ${s.name} ${s.width}x${s.height}  [${boxes.map((b) => b.q).join(' ')}]${bad.length ? '\n       ' + bad.join('\n       ') : ''}`);
  failures += bad.length ? 1 : 0;
  await ctx.close();
}
await browser.close();
server.close();
console.log(failures ? `\n${failures} layout(s) with overlaps` : '\nNo overlaps.');
process.exit(failures ? 1 : 0);
