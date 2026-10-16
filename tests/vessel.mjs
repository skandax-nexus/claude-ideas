// QA bot for the generated vessel: loads every sector of a few campaign
// seeds in headless Chromium and plays each room through the real game
// systems (physics, reality states, laws, items, locks, sockets), following
// the solution route the generator emits. Fails if any room cannot be
// finished, or on any page error.
//
//   NODE_PATH=$(npm root -g) node tests/vessel.mjs [seeds=2] [decks=0-7]
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'game');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));

const nSeeds = +(process.argv[2] || 2);
const [d0, d1] = (process.argv[3] || '0-7').split('-').map(Number);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => window.AZ);
await page.evaluate(() => {
  try { localStorage.clear(); } catch {}
  const g = window.AZ;
  g.renderer.setAnimationLoop(null); // the bot drives time itself
  g.started = true;
  g.audio.start = () => {};
  g.paused = false;
  g.hud.show(null);
});

// The bot, evaluated in the page.
const SOLVE = ({ seed, deck, sector }) => {
  const g = window.AZ;
  if (g.mode !== 'deck' || g.campaign.seed !== seed) g.startVessel(seed);
  g.campaign.deck = deck;
  g.campaign.sector = sector;
  g.campaign.flags = {};
  g.campaign.visited = [];
  g.loadSector(false);
  g.transitioning = true; // keep the bot inside this sector
  let setbacks = 0;
  // synchronous setbacks: timers can't fire while the bot holds the page
  let lastSetback = '';
  g.deckSetback = (k) => {
    setbacks++;
    lastSetback = k;
    g.player.place(g.checkpoint);
    g.catching = false;
  };
  g.catching = false;
  const LAW = {
    gravityFlip: ['GRAVITY', 'INVERTS', 'INVERTED'], echoSolid: ['ECHOES', 'SOLIDIFIES', 'ECHO'], zeroG: ['GRAVITY', 'FREEZES', 'PHYSICAL'],
    lightSolid: ['LIGHT', 'SOLIDIFIES', 'ALL'], heldPersists: ['HELD', 'PERSISTS', 'ALL'], timeStop: ['TIME', 'FREEZES', 'PHYSICAL'],
    observerFrozen: ['OBSERVER', 'FREEZES', 'PHYSICAL'],
  };
  for (const t of ['TIME', 'LIGHT']) g.facts.set(`token_${t}`);
  const out = [];
  const step = (n = 1) => { for (let i = 0; i < n; i++) g.simulate(1 / 30); };
  for (const rid of g.level.order) {
    const room = g.level.rooms[rid];
    const req = [...new Set(room.challenges.filter((c) => c.effect && !c.optional).map((c) => c.effect))];
    const opt = [...new Set(room.challenges.filter((c) => c.effect && c.optional).map((c) => c.effect))];
    // gravityFlip keeps slot 1; the rest fill in
    const laws = [];
    if (req.includes('gravityFlip') || opt.length + req.length < 3) laws.push(LAW.gravityFlip);
    for (const e of [...req, ...opt]) if (e !== 'gravityFlip' && laws.length < 3) laws.push(LAW[e]);
    for (let i = 0; i < 3; i++) g.engine.setLaw(i, laws[i] ? { subject: laws[i][0], verb: laws[i][1], target: laws[i][2] } : null);
    const missing = req.filter((e) => !g.engine.effects[e] || g.engine.effects[e].size === 0);
    g.engine.setState(rid, 'PHYSICAL', { force: true });
    g.held = null;
    g.enterRoom(rid, true);
    step(10);
    let fail = missing.length ? `laws missing ${missing}` : null;
    const startSet = setbacks;
    for (const w of room.route) {
      if (fail) break;
      if (w.state) g.engine.setState(rid, w.state, { force: true });
      if (w.wait) step(Math.round(w.wait * 30));
      let t = 0, best = Infinity, since = 0;
      g.input.keys.clear();
      g.input.keys.add('KeyW');
      while (t < 25) {
        const dx = w.pos[0] - g.player.pos.x, dz = w.pos[2] - g.player.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.35) break;
        g.player.H.set(dx / d, 0, dz / d);
        if (w.jump && g.player.grounded) g.input.state.jump = true;
        step();
        t += 1 / 30;
        if (d < best - 0.05) { best = d; since = 0; } else if ((since += 1 / 30) > 4) { fail = `stuck ${d.toFixed(2)} m from waypoint (${w.exit ? 'exit' : w.act || 'walk'}) at ${g.player.pos.toArray().map((v) => v.toFixed(1))}`; break; }
        if (setbacks > startSet) { fail = `setback (${lastSetback}) while walking to ${w.act || (w.exit ? 'exit' : 'waypoint')} (${g.player.pos.toArray().map((v) => v.toFixed(1))})`; break; }
      }
      g.input.keys.clear();
      g.input.state.jump = false;
      step(w.jump ? 30 : 4); // land before acting
      if (fail) break;
      if (t >= 25) { fail = 'timeout'; break; }
      if (w.act === 'take') {
        if (!g.deckWorld.isItemAvailable(w.item)) { fail = `item ${w.item} not available`; break; }
        const ip = g.level.items.find((i) => i.id === w.item).pos;
        const eye = g.player.eye();
        const dd = Math.hypot(ip[0] - eye.x, ip[1] - eye.y, ip[2] - eye.z);
        if (dd > 2.3) { fail = `item ${w.item} out of reach (${dd.toFixed(2)} m) player ${g.player.pos.toArray().map((v) => v.toFixed(2))} item ${ip}`; break; }
        g.useDeck({ id: `ditem:${w.item}` });
      }
      if (w.act === 'use') {
        const it = g.level.interactables.find((i) => i.id === w.target);
        g.useDeck({ id: `deck:${it.id}`, it });
        if (!g.deckWorld.flags[`open_${rid}`]) { fail = `${w.target} did not open (held ${g.held}, state ${g.engine.state(rid)})`; break; }
      }
    }
    const last = room.route[room.route.length - 1];
    if (!fail && last && Math.hypot(last.pos[0] - g.player.pos.x, last.pos[2] - g.player.pos.z) > 1.0) fail = 'did not reach the exit';
    out.push({ rid, kind: room.kind, challenges: room.challenges.map((c) => c.key).join(','), ok: !fail, fail });
  }
  return out;
};

let failed = 0, total = 0;
const seeds = Array.from({ length: nSeeds }, (_, i) => 101 + i * 7717);
for (const seed of seeds) {
  for (let deck = d0; deck <= d1; deck++) {
    for (let sector = 0; sector < 4; sector++) {
      const res = await page.evaluate(SOLVE, { seed, deck, sector });
      for (const r of res) {
        total++;
        if (!r.ok) {
          failed++;
          console.log(`  FAIL seed ${seed} ${r.rid} [${r.challenges}] ${r.fail}`);
        }
      }
    }
    console.log(`  seed ${seed} deck ${deck + 1}: done`);
  }
}
console.log(`${total - failed}/${total} rooms solved by the bot`);
if (errors.length) console.log('page errors:\n  ' + [...new Set(errors)].join('\n  '));
await browser.close();
server.close();
process.exit(failed || errors.length ? 1 : 0);
