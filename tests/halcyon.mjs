// HALCYON (the open districts in the middle of the prologue): plays every
// district through - the scene, the gate, the next district - and the lift
// home to Station Zero; checks the two ways over the obstacles (the dome when
// INVERTED, the echo bridge with ECHOES SOLIDIFY IN ECHO), and the way in from
// Varga's vault recording. Since v1.0 also: the screens correct Varga's record
// (RECORD CORRECTED, not Kade's or Theo's), Juno's line after each screen plays,
// and Varga's recorders and tower echo speak in her own voice.
//   NODE_PATH=$(npm root -g) node tests/halcyon.mjs
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
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
let passed = 0;
const failures = [];
const check = (ok, label, detail = '') => {
  if (ok) { passed++; console.log(`  ok   ${label}`); } else { failures.push(`${label} ${detail}`); console.log(`  FAIL ${label} ${detail}`); }
};
const az = (fn, a) => page.evaluate(fn, a);

await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForFunction(() => window.AZ, null, { timeout: 180000 });
await az(() => { AZ.changeSetting('hero', { id: 'nova' }); AZ.begin('new'); });
await page.waitForTimeout(1200);

// the way in: Varga's vault recording, then the hatch
await az(() => {
  for (const k of ['left_antechamber', 'has_device', 'heard_varga', 'archive_open', 'custodian_remembers', 'wrote_law']) AZ.facts.set(k);
  AZ.enterRoom('archive', true);
  AZ.director.use('r2');
  for (let i = 0; i < 30; i++) { AZ.hud.subT = 0; AZ.simulate(0.1); }
});
await page.waitForFunction(() => AZ.mode === 'deck' && AZ.campaign?.zones, null, { timeout: 30000 }).catch(() => {});
check(await az(() => AZ.mode === 'deck' && AZ.campaign?.zones && AZ.facts.get('vault_seen')), 'Varga\'s vault recording leads up into HALCYON');

const sim = (sec) => az((s) => { for (let i = 0; i < Math.round(s / 0.05); i++) AZ.simulate(0.05); }, sec);
let total = 0;
for (let z = 0; z < 4; z++) {
  for (let s = 0; s < 3; s++) {
    const label = `district ${z + 1}.${s + 1}`;
    await az(([z, s]) => {
      AZ.campaign.deck = z; AZ.campaign.sector = s; AZ.campaign.flags = {};
      AZ.loadSector(true);
      document.querySelector('#card')?.classList.remove('on');
      AZ.hud.subs = []; AZ.hud.subT = 0; AZ.hud.nextSub();
    }, [z, s]);
    const info = await az(() => ({ name: AZ.level.rooms[AZ.room].name, beat: AZ.deckBeat().kind, gate: AZ.deckWorld.dynamic.find((d) => d.el.id?.startsWith('gate_'))?.mesh.visible }));
    check(info.gate === true, `${label} ${info.name}: the north gate starts locked`);
    // the gate holds before the scene is done
    const held = await az(() => {
      const ex = AZ.level.exit.box;
      AZ.player.place([0, 0.86, ex[5] + 6, 0]); AZ.simulate(0.2);
      AZ.input.keys.add('KeyW'); for (let i = 0; i < 40; i++) AZ.simulate(0.05); AZ.input.keys.delete('KeyW');
      return AZ.campaign.deck * 10 + AZ.campaign.sector;
    });
    check(held === z * 10 + s, `${label}: the locked gate does not let you through`);
    // do the scene (teleport next to it, use it, let the dialogue play)
    const scene = await az(() => {
      const c = AZ.deckWorld.focusCandidates(AZ).find((f) => !f.id.includes('beacon') && !f.id.includes('frag_'));
      if (!c) return { ok: false };
      AZ.player.place([c.pos[0], Math.max(0.86, c.pos[1] - 0.6), c.pos[2] + 1.2, 0]); AZ.simulate(0.1);
      const beat = AZ.deckBeat();
      if (beat.kind === 'contradiction') { AZ.engine.setState(AZ.room, 'ECHO', { force: true }); AZ.simulate(0.1); }
      const said = [], say = AZ.hud.say;
      AZ.hud.say = function (lines, facts, done) { said.push(...lines.map((l) => `${l.who}: ${l.text}`)); return say.call(this, lines, facts, done); };
      AZ.useDeck(c);
      AZ.hud.say = say;
      const toast = document.querySelector('#toast').innerHTML;
      for (let i = 0; i < 80; i++) { AZ.hud.subT = 0; AZ.simulate(0.1); }
      if (beat.kind === 'contradiction') { AZ.engine.setState(AZ.room, 'PHYSICAL', { force: true }); AZ.simulate(0.1); }
      return { ok: !!AZ.deckWorld.flags.beat_done, kind: beat.kind, gate: AZ.deckWorld.dynamic.find((d) => d.el.id?.startsWith('gate_'))?.mesh.visible, toast, said, logWho: beat.log?.who, junoAfter: [].concat(beat.junoAfter || []), clues: ['kade', 'osei', 'theo', 'varga'].filter((k) => AZ.facts.get(`clue_${k}`)) };
    });
    check(scene.ok && scene.gate === false, `${label}: the ${scene.kind} scene opens the gate`);
    if (scene.kind === 'contradiction') {
      check(/RECORD CORRECTED/.test(scene.toast) && /Dr\. Ilse Varga/.test(scene.toast) && scene.clues.join() === 'varga', `${label}: the screen corrects Varga's record (not ${z === 0 ? 'Kade' : 'Theo'}'s)`, JSON.stringify({ toast: scene.toast, clues: scene.clues }));
      check(scene.junoAfter.length && scene.junoAfter.every((t) => scene.said.includes(`JUNO: ${t}`)), `${label}: Juno's line after the screen plays`, JSON.stringify(scene.said.filter((l) => l.startsWith('JUNO'))));
    }
    if (scene.kind === 'encounter' && z === 3) check(scene.said[0]?.startsWith('VARGA: There you are.'), `${label}: Varga's echo at the top of the tower speaks in her own voice`, String(scene.said[0]));
    if (scene.logWho === 'VARGA') check(scene.said[0]?.startsWith('VARGA: '), `${label}: Varga's recorder speaks in her own voice`, String(scene.said[0]));
    if (z === 0 && s === 0) {
      const frag = await az(() => {
        const n = AZ.level.interactables.filter((i) => i.kind === 'fragment').length;
        const f = AZ.deckWorld.focusCandidates(AZ).find((c) => c.id.includes('frag_'));
        AZ.useDeck(f);
        for (let i = 0; i < 40; i++) { AZ.hud.subT = 0; AZ.simulate(0.1); }
        return { n, got: AZ.facts.get('fragments'), left: AZ.deckWorld.focusCandidates(AZ).filter((c) => c.id.includes('frag_')).length };
      });
      check(frag.n === 3 && frag.got === 1 && frag.left === 2, 'three memory fragments per district; picking one up logs it', JSON.stringify(frag));
    }
    if (z === 0 && s === 0) await page.screenshot({ path: path.join(shots, 'h01-neon-meridian.png'), timeout: 240000 });
    if (z === 2 && s === 2) await page.screenshot({ path: path.join(shots, 'h02-glass-forest-theo.png'), timeout: 240000 });
    // walk through the gate
    const next = await az(() => {
      const ex = AZ.level.exit.box;
      AZ.player.place([0, 0.86, ex[5] + 5, 0]); AZ.simulate(0.2);
      AZ.input.keys.add('KeyW'); for (let i = 0; i < 60; i++) AZ.simulate(0.05); AZ.input.keys.delete('KeyW');
      return true;
    });
    await page.waitForFunction(([z, s]) => AZ.mode === 'station' || AZ.campaign.deck * 10 + AZ.campaign.sector !== z * 10 + s, [z, s], { timeout: 30000 }).catch(() => {});
    await page.waitForFunction(() => !AZ.transitioning, null, { timeout: 30000 }).catch(() => {});
    const after = await az(() => ({ mode: AZ.mode, room: AZ.room, deck: AZ.campaign?.deck, sector: AZ.campaign?.sector }));
    const want = z === 3 && s === 2 ? after.mode === 'station' && after.room === 'lab' : after.deck * 10 + after.sector === (s === 2 ? (z + 1) * 10 : z * 10 + s + 1);
    check(next && want, `${label}: through the gate${z === 3 && s === 2 ? ', the lift goes home to Station Zero' : ''}`, JSON.stringify(after));
    total++;
  }
}
check(await az(() => AZ.facts.get('zones_done') && AZ.facts.rulesEnabled), 'back in Station Zero, the station\'s story picks up again');

// the obstacles have more than one answer
await az(() => { AZ.startZones({ zones: true, deck: 0, sector: 0, flags: {}, visited: [] }); });
await page.waitForTimeout(500);
const roof = await az(() => {
  const t = AZ.level.interactables.find((i) => i.kind === 'terminal');
  AZ.player.place([0, 0.86, -3, 0]); AZ.simulate(0.2);
  AZ.engine.setState(AZ.room, 'INVERTED', { force: true });
  for (let i = 0; i < 60; i++) AZ.simulate(0.05);
  const onDome = AZ.player.pos.y;
  // walk the dome to above the roof, then let go
  AZ.player.pos.x = t.pos[0]; AZ.player.pos.z = t.pos[2] + 1.5; AZ.simulate(0.1);
  AZ.engine.setState(AZ.room, 'PHYSICAL', { force: true });
  for (let i = 0; i < 80; i++) AZ.simulate(0.05);
  return { onDome, y: AZ.player.pos.y, roof: t.pos[1] };
});
check(roof.onDome > 18 && Math.abs(roof.y - (roof.roof - 1.65 + 0.4 + 0.86)) < 0.6, 'INVERTED: fall up to the dome, cross it, drop onto the recorder\'s roof', JSON.stringify(roof));
const stairs = await az(() => {
  AZ.engine.setLaw(1, { subject: 'ECHOES', verb: 'SOLIDIFIES', target: 'ECHO' });
  AZ.engine.setState(AZ.room, 'ECHO', { force: true });
  AZ.simulate(0.2);
  const steps = AZ.deckWorld.dynamic.filter((d) => d.kind === 'echo');
  return steps.length && steps.every((d) => d.mesh.material === AZ.deckWorld.mats.echoSolid);
});
check(stairs, 'ECHOES SOLIDIFY IN ECHO: the remembered stairs are solid');
await az(() => { AZ.engine.setLaw(1, null); AZ.engine.setState(AZ.room, 'PHYSICAL', { force: true }); AZ.campaign.sector = 1; AZ.loadSector(false); });
const canal = await az(() => {
  AZ.engine.setLaw(1, { subject: 'ECHOES', verb: 'SOLIDIFIES', target: 'ECHO' });
  AZ.engine.setState(AZ.room, 'ECHO', { force: true });
  AZ.player.place([0, 0.86, -46, 0]); AZ.simulate(0.2);
  AZ.input.keys.add('KeyW'); for (let i = 0; i < 70; i++) AZ.simulate(0.05); AZ.input.keys.delete('KeyW');
  return true;
}).then(async () => { await page.waitForTimeout(2500); return az(() => { AZ.simulate(0.1); return { z: AZ.player.pos.z, y: AZ.player.pos.y }; }); });
check(canal.z < -58 && canal.y > 0.5, 'ECHO bridge: walk over the water on the remembered bridge', JSON.stringify(canal));
const swim = await az(() => {
  AZ.engine.setLaw(1, null);
  AZ.engine.setState(AZ.room, 'PHYSICAL', { force: true });
  AZ.player.place([0, 0.86, -46, 0]); AZ.simulate(0.2);
  AZ.input.keys.add('KeyW'); for (let i = 0; i < 70; i++) AZ.simulate(0.05); AZ.input.keys.delete('KeyW');
  return true;
}).then(async () => { await page.waitForTimeout(2500); return az(() => { AZ.simulate(0.1); return { z: AZ.player.pos.z, y: AZ.player.pos.y }; }); });
check(swim.z > -50, 'without a law, the water sends you back to the bank', JSON.stringify(swim));
await page.screenshot({ path: path.join(shots, 'h03-reactor-or-city.png'), timeout: 240000 });

check(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
server.close();
console.log(`\n${passed} passed, ${failures.length} failed (${total} districts played)`);
if (failures.length) { for (const f of failures) console.log(' - ' + f); process.exit(1); }
