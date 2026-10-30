// End-to-end smoke test: boots the game in headless Chromium, plays the
// whole vertical slice through the real systems (shifts, laws, items,
// interactions) and fails on any page error. Screenshots go to
// tests/screens/ (or $SCREENS).
//
//   NODE_PATH=$(npm root -g) node tests/smoke.mjs
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

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}/index.html`;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const wait = (ms) => page.waitForTimeout(ms);
const az = (fn, arg) => page.evaluate(fn, arg);
const sim = (sec) => az((s) => window.AZ.simulate(s), sec);
const shot = async (name) => {
  await wait(700); // let a real frame render
  await page.screenshot({ timeout: 180000, path: path.join(shots, `${name}.png`) });
  console.log('  screenshot', name);
};
const fact = (k) => az((k) => window.AZ.facts.get(k), k);
const expect = async (k, label) => {
  const v = await fact(k);
  if (!v) throw new Error(`Expected fact ${k} (${label})`);
  console.log(`  ok  ${label}`);
};
// place the player: [x, y, z, yaw], optionally pitch
const place = (p, pitch = 0) => az(([p, pitch]) => {
  const g = window.AZ;
  g.player.place(p);
  g.player.pitch = pitch;
  const r = g.roomAt(g.player.pos);
  if (r !== g.room) g.enterRoom(r);
}, [p, pitch]);
const skipTalk = () => az(() => {
  const h = window.AZ.hud;
  while (h.talking) {
    h.subT = 0;
    h.nextSub();
  }
});

try {
  await page.goto(url);
  await wait(1500);
  await shot('00-title');
  await page.click('#begin');
  await page.click('[data-newch="prologue"]');
  await page.click('#saves [data-slot="0"]');
  await wait(600);
  await shot('00b-character-select');
  await page.click('[data-hero="real_m"]'); // a realistic look (Rocketbox model)
  await wait(1500);
  await page.click('#heroGo');
  await sim(1.2);
  await shot('01-antechamber');

  console.log('Chapter 1 - The Unknown');
  await place([0, 0.86, 23.6, 0], 0.05);
  await sim(0.2);
  await az(() => window.AZ.use());
  await sim(1.5);
  await shot('02-zero-g');
  await az(() => window.AZ.director.use('shard'));
  await sim(2.5);
  await expect('has_device', 'second touch inverts the room and binds the device');
  const g = await az(() => window.AZ.player.gravity);
  if (g !== 1) throw new Error('gravity should be inverted in the antechamber');
  await shot('03-inverted-door');
  // walk out through the door that only exists upside down
  await place([0, 3.6, 22.5, 0]);
  await az(() => window.AZ.input.keys.add('KeyW'));
  await sim(3.5);
  await az(() => window.AZ.input.keys.delete('KeyW'));
  await sim(1.2);
  await expect('left_antechamber', 'walked through the inverted door into the laboratory');
  await skipTalk();
  await shot('04-lab');

  console.log('Chapter 2 - The First Law');
  await place([0, 0.86, 7.3, Math.PI]);
  await az(() => window.AZ.director.use('r1'));
  await skipTalk();
  await expect('heard_varga', "Varga's warning");
  // the reversed shadow: face east, walk, then stand where it isn't
  await place([4, 0.86, 0, -Math.PI / 2]);
  await az(() => window.AZ.input.keys.add('KeyD'));
  await sim(1.8);
  await az(() => window.AZ.input.keys.delete('KeyD'));
  await expect('noticed_shadow', 'noticed the shadow moving against you');
  await shot('05-shadow');
  await place([4, 0.86, -6, -Math.PI / 2]);
  await sim(0.4);
  await az(() => window.AZ.shift('ECHO'));
  await sim(1.5);
  await expect('shadow_passage_open', 'stood where it isn\'t - the passage opens');
  await shot('06-echo-lab');
  await az(() => window.AZ.shift('PHYSICAL'));
  await place([13.5, 0.86, 6, -Math.PI / 2]);
  await sim(0.5);
  await expect('token_HELD', 'HELD MATTER token');
  await az(() => window.AZ.director.use('r0'));
  await skipTalk();
  await expect('heard_self', 'Recording 0 - your voice, before your birth');
  // the ceiling token: invert the lab and walk to it
  await place([-2, 0.86, -6, Math.PI / 2]);
  await az(() => window.AZ.shift('INVERTED'));
  await sim(1.8);
  await shot('07-lab-ceiling');
  await az(() => window.AZ.input.keys.add('KeyW'));
  await sim(1.6);
  await az(() => window.AZ.input.keys.delete('KeyW'));
  await sim(0.3);
  if (!(await fact('token_PERSISTS'))) {
    await place([-6, 9.1, -6, Math.PI / 2]);
    await sim(0.5);
  }
  await expect('token_PERSISTS', 'PERSISTS THROUGH token on the ceiling');
  await az(() => window.AZ.shift('ECHO'));
  await place([8.5, 0.86, -4.3, 0], -0.4);
  await sim(1.5);
  await az(() => window.AZ.use());
  const held = await az(() => window.AZ.held);
  if (held !== 'key') throw new Error(`expected to hold the echo key, holding ${held}`);
  console.log('  ok  picked up the key in the echo');
  await az(() => window.AZ.shift('PHYSICAL'));
  await sim(0.3);
  await expect('key_dissolved', 'the key dissolves outside the echo');
  // rewrite the device
  const r = await az(() => window.AZ.engine.setLaw(1, { subject: 'HELD', verb: 'PERSISTS', target: 'PHYSICAL' }));
  if (!r.ok) throw new Error('law rejected');
  await az(() => window.AZ.onLawInstalled(1, { subject: 'HELD' }));
  await az(() => window.AZ.openMenu('laws'));
  await sim(0.3);
  await shot('08-law-editor');
  await az(() => window.AZ.closeMenu());
  await az(() => window.AZ.shift('ECHO'));
  await place([8.5, 0.86, -4.3, 0], -0.4);
  await sim(0.8);
  await az(() => window.AZ.use());
  await az(() => window.AZ.shift('PHYSICAL'));
  await sim(0.4);
  if ((await az(() => window.AZ.held)) !== 'key') throw new Error('key should persist after the law');
  console.log('  ok  key persists into PHYSICAL after rewriting the law');

  console.log('Chapter 4 - The Contradiction');
  await place([3, 0.86, -10, 0]);
  await az(() => window.AZ.director.use('archive_lock'));
  await skipTalk();
  await expect('archive_open', 'the archive opens to evidence');
  await place([0, 0.86, -18, 0]);
  await sim(0.8);
  await az(() => window.AZ.director.use('custodian'));
  await skipTalk();
  await expect('custodian_remembers', 'the Custodian remembers a lab it denied');
  await shot('09-archive');
  await az(() => window.AZ.engine.setLaw(2, { subject: 'ECHOES', verb: 'SOLIDIFIES', target: 'ECHO' }));
  await az(() => window.AZ.shift('ECHO'));
  await place([0, 0.86, -23, 0]);
  await az(() => window.AZ.input.keys.add('KeyW'));
  await sim(2.4);
  await az(() => window.AZ.input.keys.delete('KeyW'));
  const z = await az(() => window.AZ.player.pos.z);
  const y = await az(() => window.AZ.player.pos.y);
  if (!(z < -30 && y > 0)) throw new Error(`should have crossed the echo bridge (z=${z.toFixed(1)}, y=${y.toFixed(1)})`);
  console.log('  ok  crossed the solidified echo bridge');
  await place([-6, 0.86, -32, 0]);
  await sim(0.3);
  await expect('token_ALL', 'ALL STATES token in the vault');
  await place([0, 0.86, -33.4, 0]);
  await shot('10-vault');
  await az(() => window.AZ.director.use('r2'));
  await skipTalk();
  await expect('vault_seen', "Varga's recording from after");

  console.log('HALCYON - the long way (played district by district in tests/halcyon.mjs)');
  await skipTalk();
  await sim(0.5);
  await page.waitForFunction(() => window.AZ.mode === 'deck' && window.AZ.campaign?.zones, null, { timeout: 30000 });
  console.log('  ok  the vault hatch leads up into HALCYON');
  await az(() => { document.querySelector('#card')?.classList.remove('on'); });
  await sim(1);
  await shot('10b-halcyon');
  await az(() => window.AZ.returnToStation());
  await skipTalk();
  if (!(await az(() => window.AZ.mode === 'station' && window.AZ.room === 'lab'))) throw new Error('should be back in the lab');
  console.log('  ok  the tower lift returns to Station Zero');

  console.log('Chapter 3 - The Observer');
  await place([-17.5, 0.86, 0, Math.PI / 2]);
  await sim(1.5);
  await shot('11-hall');
  await az(() => window.AZ.input.keys.add('KeyW'));
  await sim(2.5);
  await az(() => window.AZ.input.keys.delete('KeyW'));
  await sim(3);
  console.log('  observer mode:', await az(() => window.AZ.observer.mode), 'suspicion', (await az(() => window.AZ.observer.suspicion)).toFixed(2));
  await shot('12-observer');
  await az(() => window.AZ.observer.onCatch('PHYSICAL'));
  await wait(1600);
  if (!(await fact('times_caught'))) throw new Error('catch did not register');
  console.log('  ok  caught and returned to the hall entrance');
  await az(() => {
    window.AZ.facts.set('token_OBSERVER');
    window.AZ.facts.set('token_FREEZES');
  });
  await az(() => { window.AZ.held = 'core'; });

  console.log('Chapter 6/7 - Activation and the truth');
  await place([0, 0.86, 3.6, 0]);
  await az(() => window.AZ.director.use('machine'));
  await expect('core_installed', 'core installed');
  await skipTalk();
  await az(() => window.AZ.director.use('machine'));
  await az(() => window.AZ.director.use('machine'));
  await skipTalk();
  await expect('machine_activated', 'machine activated');
  await expect('observer_tethered', 'Observer tethered');
  await place([0, 0.86, 9, 0], 0.15);
  await sim(1.5);
  await shot('13-spaceship');
  await az(() => window.AZ.shift('ECHO'));
  await place([0, 0.86, 4.2, 0], 0.5);
  await sim(1.2);
  await shot('14-brain');
  await az(() => window.AZ.director.use('brain'));
  await skipTalk();
  await expect('brain_seen', 'the brain in the machine');
  await az(() => { window.AZ.observer.pos.set(-13.6, 0, 0); window.AZ.observer.path = []; });
  await az(() => window.AZ.director.use('observer'));
  await skipTalk();
  await expect('observer_faced', 'faced the Observer');
  await place([-8, 0.86, 0, -Math.PI / 2]);
  await az(() => window.AZ.shift('PHYSICAL'));
  await sim(1);
  await shot('15-tethered');
  const obj = await az(() => window.AZ.objectives.history.map((h) => h.text));
  console.log('  objectives:', obj.join(' -> '));
  if (obj.length !== 4) throw new Error('all four objective layers should have appeared');

  console.log('Chapter 8 - The Final Decision');
  await az(() => window.AZ.director.use('machine'));
  await sim(0.4);
  await shot('16-decision');
  const options = await page.$$eval('[data-end]', (b) => b.map((x) => x.dataset.end));
  console.log('  endings offered:', options.join(', '));
  if (!options.includes('MIRROR')) throw new Error('MIRROR ending should be available');
  await page.click('[data-end="MIRROR"]');
  await sim(0.5);
  await shot('17-ending');
  const report = await az(() => window.AZ.timeline.length);
  console.log('  ok  ending shown; timeline entries:', report);

  // v1.0: the ending leads on to THE CRADLE (or straight to the vessel), and is remembered
  const end = await az(() => ({
    cradle: !!document.querySelector('#toCradle'), vessel: !!document.querySelector('#toVessel'),
    line: document.querySelector('#toCradle small')?.textContent, last: localStorage.getItem('afterzero.lastEnding'),
  }));
  if (!end.cradle || !end.vessel || !/heard the station say your name/.test(end.line || '')) throw new Error('the ending should offer GO BENEATH and SKIP TO THE VESSEL: ' + JSON.stringify(end));
  if (!/"key":"MIRROR"/.test(end.last || '')) throw new Error('the ending should be remembered on this device: ' + end.last);
  console.log('  ok  GO BENEATH / SKIP TO THE VESSEL offered; the ending is remembered');
  await page.click('#toCradle');
  await sim(3);
  const cr = await az(() => ({
    mode: window.AZ.mode, set: window.AZ.campaign?.set, ending: window.AZ.campaign?.ending, after: window.AZ.story?.after?.key,
    run: window.AZ.run, level: window.AZ.level.id, card: document.querySelector('#card small').textContent,
  }));
  if (cr.mode !== 'deck' || cr.set !== 'cradle' || cr.ending !== 'MIRROR' || cr.after !== 'MIRROR' || cr.run !== 'cradle' || cr.level !== 'c0s0') throw new Error('GO BENEATH should start THE CRADLE after OBSERVED: ' + JSON.stringify(cr));
  console.log('  ok  GO BENEATH: THE CRADLE after OBSERVED,', cr.card);
  await skipTalk();
  await shot('17b-cradle');

  // reload: the save restores the world from facts
  await page.reload();
  await page.waitForFunction(() => window.AZ, null, { timeout: 300000 }); // CONTINUE shows once the game has read the saves
  await wait(1200);
  const cont = await page.isVisible('#continue');
  if (!cont) throw new Error('continue should be offered after a save');
  console.log('  ok  save found after reload');

  // mobile layout. The desktop page is done: close it, so two WebGL pages do not share the machine,
  // and tap inside the page with long waits (a busy machine can take more than 30 s to acknowledge
  // a Playwright tap), as tests/forge.mjs and features.mjs do
  await page.close();
  const mob = await browser.newPage({ viewport: { width: 915, height: 412 }, isMobile: true, hasTouch: true });
  mob.on('pageerror', (e) => errors.push(e.message));
  await mob.goto(url);
  await mob.waitForFunction(() => window.AZ, null, { timeout: 300000 }); // the characters load first
  await mob.evaluate(() => localStorage.clear());
  const tapIn = async (sel) => {
    await mob.waitForSelector(sel, { state: 'visible', timeout: 300000 });
    await mob.evaluate((q) => setTimeout(() => document.querySelector(q).click(), 0), sel);
  };
  await tapIn('#begin');
  await tapIn('[data-newch="prologue"]');
  await tapIn('#saves [data-slot="0"]');
  await tapIn('#heroGo');
  await mob.waitForFunction(() => window.AZ.started && !window.AZ.menu, null, { timeout: 300000 });
  await mob.waitForTimeout(1500);
  await mob.screenshot({ timeout: 240000, path: path.join(shots, '18-android-layout.png') });
  console.log('  screenshot 18-android-layout');
} catch (e) {
  errors.push(e.message);
  await shot('zz-failure').catch(() => {});
}

await browser.close();
server.close();
if (errors.length) {
  console.error('\nFAILED:\n' + errors.map((e) => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('\nSmoke test passed.');
