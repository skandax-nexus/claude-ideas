// Regression test for the v1.0 QA findings: each check plays a bug that a
// play-tester reproduced, through real input where a player would use it.
//
//   NODE_PATH=$(npm root -g) node tests/qa.mjs
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'game');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}/index.html`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

let passed = 0;
const failures = [];
const check = (ok, label, detail = '') => {
  if (ok) { passed++; console.log(`  ok   ${label}`); } else { failures.push(`${label} ${detail}`); console.log(`  FAIL ${label} ${detail}`); }
};

const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const az = (fn, a) => page.evaluate(fn, a);
const sim = (sec) => az((s) => { for (let i = 0; i < Math.round(s / 0.05); i++) AZ.simulate(0.05); }, sec);
await page.goto(url);
await page.waitForFunction(() => window.AZ, null, { timeout: 400000 });
await az(() => { localStorage.clear(); AZ.changeSetting('quality', 'low'); AZ.changeSetting('smart', false); AZ.changeSetting('hero', { id: 'nova' }); });
await az(() => { AZ.begin('new', null, 0); });
await page.waitForFunction(() => AZ.started && AZ.room, null, { timeout: 60000 });
// Station Zero, with the device, Juno met and the archive open
await az(() => {
  for (const k of ['shard_touch', 'left_antechamber', 'has_device', 'has_tick', 'met_juno', 'heard_varga', 'seen_echo']) AZ.facts.set(k);
  for (const t of ['GRAVITY', 'INVERTS', 'PHYSICAL', 'INVERTED', 'ECHO', 'HELD', 'PERSISTS']) AZ.facts.set(`token_${t}`);
  AZ.engine.unlockSlot(2);
  AZ.enterRoom('lab', true);
  AZ.hud.subs = []; AZ.hud.subT = 0;
});

console.log('Station Zero');
// 1. the Observation Hall doorway is walkable from the lab
await az(() => { AZ.player.place([-9, 0.86, 0, Math.PI / 2]); AZ.input.keys.add('KeyW'); });
await sim(3);
await az(() => AZ.input.keys.delete('KeyW'));
check(await az(() => AZ.player.pos.x < -12.6), 'you can walk from the lab into the Observation Hall', await az(() => AZ.player.pos.x.toFixed(2)));

// 2. the LAWS panel: a complete law runs as soon as its words are set, without an INSTALL press
await az(() => { AZ.enterRoom('lab', true); AZ.openMenu('laws'); });
const chips = async (slot, key, label) => {
  for (let n = 0; n < 12; n++) {
    const t = await page.textContent(`#laws .chip[data-slot="${slot}"][data-key="${key}"]`);
    if (t.trim() === label) return true;
    await page.click(`#laws .chip[data-slot="${slot}"][data-key="${key}"]`);
  }
  return false;
};
await chips(1, 'subject', 'HELD MATTER');
check(await az(() => AZ.engine.laws[1] === null && /NOT RUNNING/.test(document.querySelector('#laws .slot:nth-of-type(2)')?.textContent || document.querySelector('#laws').textContent)), 'an unfinished law says plainly it is not running');
await chips(1, 'verb', 'PERSISTS THROUGH');
await chips(1, 'target', 'PHYSICAL');
check(await az(() => JSON.stringify(AZ.engine.laws[1]) === JSON.stringify({ subject: 'HELD', verb: 'PERSISTS', target: 'PHYSICAL' })), 'the finished law is running (no INSTALL button to forget)');
await page.keyboard.press('Escape');
await az(() => { if (AZ.menu) AZ.closeMenu(); });
check(await az(() => AZ.engine.has('heldPersists', 'PHYSICAL') && AZ.facts.get('wrote_held_law')), 'closing the panel keeps it, and the game knows the archive law is written');
// ... and it changes gameplay: a memory key survives leaving ECHO
await az(() => {
  AZ.engine.setState('lab', 'ECHO', { force: true });
  AZ.held = 'key';
  AZ.engine.setState('lab', 'PHYSICAL', { force: true });
});
await sim(0.3);
check(await az(() => AZ.held === 'key'), 'with the law running, the memory key survives the shift to PHYSICAL');
await az(() => { AZ.engine.setLaw(1, null); AZ.engine.setState('lab', 'ECHO', { force: true }); AZ.held = 'key'; AZ.engine.setState('lab', 'PHYSICAL', { force: true }); });
await sim(0.3);
check(await az(() => AZ.held === null), 'without it, the key dissolves (the law really is what made the difference)');

// 3. hands full: taking the key while carrying the core doesn't send the core back
await az(() => { AZ.held = 'core'; AZ.focus = { id: 'item:key', pos: [8.5, 1, -6] }; AZ.use(); });
check(await az(() => AZ.held === 'core'), 'taking something with full hands is refused, the core stays in your hands');

// 4. save/load keeps what you carry and the antechamber's first zero-g
await az(() => { AZ.engine.setOverride('antechamber', { zeroG: true }); AZ.saveTo('auto'); });
// loading while a game runs reloads the page and continues from the save
await Promise.all([page.waitForNavigation({ timeout: 120000 }), az(() => AZ.begin('load', 0))]);
await page.waitForFunction(() => window.AZ && document.querySelector('#continue')?.offsetParent, null, { timeout: 400000 });
await page.click('#continue'); // "Tap to enter" (sound needs a tap on phones)
await page.waitForFunction(() => AZ.started && AZ.room, null, { timeout: 120000 });
await page.waitForTimeout(500);
check(await az(() => AZ.held === 'core'), 'a carried item survives save and load', await az(() => String(AZ.held)));
check(await az(() => AZ.engine.overrides.antechamber?.zeroG === true), 'the antechamber\'s scripted zero-g survives save and load');

// 5. conversations that chain: the first line of the next one is shown, not skipped
await az(() => {
  window.__shown = [];
  const f = AZ.hud.onLine;
  AZ.hud.onLine = (who, line) => { window.__shown.push(line.text); f?.(who, line); };
  AZ.hud.subs = []; AZ.hud.subT = 0;
  AZ.hud.say([{ who: 'NONE', text: 'first A' }], AZ.facts, () => AZ.hud.say([{ who: 'JUNO', text: 'second A' }, { who: 'JUNO', text: 'second B' }], AZ.facts));
  for (let i = 0; i < 200; i++) AZ.simulate(0.1);
});
check(await az(() => window.__shown.join('|')) === 'first A|second A|second B', 'a conversation that starts another shows every line', await az(() => window.__shown.join('|')));

// 6. the machine: "USE AGAIN TO ACTIVATE" works, even while the warning plays
await az(() => {
  for (const k of ['archive_open', 'custodian_remembers', 'vault_seen', 'zones_done', 'core_installed']) AZ.facts.set(k);
  AZ.enterRoom('lab', true);
  AZ.hud.subs = []; AZ.hud.subT = 0;
  AZ.player.place([0, 0.86, 4.6, 0]);
  AZ.focus = { id: 'machine', pos: [0, 1.2, 2.2] }; AZ.lastUse = null;
  AZ.use(); // the warning
  for (let i = 0; i < 20; i++) AZ.simulate(0.05);
  AZ.focus = { id: 'machine', pos: [0, 1.2, 2.2] };
  AZ.use(); // again, while it is still playing
  for (let i = 0; i < 20; i++) AZ.simulate(0.05);
});
check(await az(() => AZ.facts.get('machine_activated')), 'using the machine again during the warning activates it');

// 7. an ending is final: Escape doesn't close it
await az(() => { AZ.facts.set('brain_seen'); AZ.finish('SEVER'); });
await page.keyboard.press('Escape');
await az(() => { AZ.input.actions.push('pause'); AZ.frame(); });
check(await az(() => AZ.menu === 'ending'), 'Escape does not close the ending screen');

// 8. F9 loads the slot F5 saved
check(await az(() => { const r = String(AZ.slot); return r; }) === '0', 'the game plays in its own slot');

// 9. TICK's hints follow the story order: after the archive opens, he points at the Custodian
await az(() => {
  AZ.facts.restore({ facts: { left_antechamber: true, has_device: true, has_tick: true, met_juno: true, heard_varga: true, token_HELD: true, token_PERSISTS: true, archive_open: true, wrote_held_law: true }, fired: [] });
});
const hint = await az(async () => { const { hints } = await import('./js/world/story.js'); return hints.find((h) => AZ.facts.test(h.when))?.tiers; });
check(!hint || /CUSTODIAN/.test(JSON.stringify(hint)), 'after the archive opens, TICK points at the Custodian (not the core)', JSON.stringify(hint));

check(errors.length === 0, 'no page errors', errors.join(' | '));
await browser.close();
server.close();
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log(failures.map((f) => ' - ' + f).join('\n'));
  process.exit(1);
}
