// THE CRADLE (v1.0, between the prologue and the vessel) and the vessel after
// each prologue ending. For every ending (SEVERED, SUSTAINED, OBSERVED, and
// none: a chapter started before the choice) it plays the three districts
// through - the scene, the gate, the next district - checks how the drones
// behave, hears Juno's confession at the registry and Varga at row one, walks
// the night watch gate into the vessel and checks that Deck 1 opens in the
// world that ending made. Then the last scene on the Bridge for each ending,
// and THE CRADLE from the chapter menu after a page reload.
//   NODE_PATH=$(npm root -g) node tests/cradle.mjs
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
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
let passed = 0;
const failures = [];
const check = (ok, label, detail = '') => {
  if (ok) { passed++; console.log(`  ok   ${label}`); } else { failures.push(`${label} ${detail}`); console.log(`  FAIL ${label} ${detail}`); }
};
const az = (fn, a) => page.evaluate(fn, a);
const url = `http://localhost:${server.address().port}/index.html`;

await page.goto(url);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForFunction(() => window.AZ, null, { timeout: 180000 });
await az(() => { AZ.changeSetting('hero', { id: 'nova' }); AZ.begin('new'); });
await page.waitForTimeout(1200);
// every line anyone says, and every setback, is recorded
await az(() => {
  window.__said = [];
  const say = AZ.hud.say.bind(AZ.hud);
  AZ.hud.say = (lines, facts, done) => {
    window.__said.push(...lines.filter((l) => !l.when || facts.test(l.when)).map((l) => `${l.who}: ${l.text}`));
    return say(lines, facts, done);
  };
  window.__setbacks = 0;
  const setback = AZ.deckSetback.bind(AZ);
  AZ.deckSetback = (k) => { window.__setbacks++; return setback(k); };
});
const skip = () => az(() => { for (let i = 0; i < 120 && AZ.hud.talking; i++) { AZ.hud.subT = 0; AZ.simulate(0.1); } });

const ENDINGS = ['SEVER', 'SUSTAIN', 'MIRROR', null];
const AFTER = await page.evaluate(async () => (await import('./js/gen/StoryGen.js')).VESSEL_AFTER);
const OPEN = {
  SEVER: 'There you are. Smaller than I made you.',
  SUSTAIN: 'If you are hearing this, you kept him running.',
  MIRROR: 'Ren. Both of you.',
  null: 'If you are hearing this, you have not chosen yet.',
};
let districts = 0;

for (const e of ENDINGS) {
  const tag = e || 'NONE';
  console.log(`THE CRADLE after ${tag}`);
  const start = await az((e) => {
    AZ.observer.brain.lessons.clear();
    if (e === 'SUSTAIN') AZ.observer.brain.lessons.add('ceiling'); // the watchers learned to look up
    AZ.facts.set('ending', e);
    AZ.run = 'cradle';
    AZ.startZones(null, 'cradle', e);
    return {
      set: AZ.campaign.set, ending: AZ.campaign.ending, mode: AZ.story.after.sentinels, id: AZ.level.id,
      kicker: document.querySelector('#card small').textContent, sub: document.querySelector('#card p').textContent,
      intro: AZ.story.decks[0].intro.map((l) => l.text), weather: AZ.weather.kind,
    };
  }, e);
  const wantMode = { SEVER: 'still', SUSTAIN: 'learned', MIRROR: 'kin', NONE: 'hunt' }[tag];
  check(start.set === 'cradle' && start.ending === e && start.mode === wantMode && start.id === 'c0s0', `${tag}: the Cradle starts (${start.mode} watchers, level ${start.id})`, JSON.stringify(start));
  check(e ? start.kicker === `BENEATH STATION ZERO · AFTER ${AFTER[e].title}` : start.kicker === 'BENEATH STATION ZERO', `${tag}: the entry card reads "${start.kicker}" / "${start.sub}"`);
  check(start.weather === 'motes', `${tag}: pale motes drift in the pod light`);
  await az(() => AZ.simulate(3)); // the intro plays 2.6 s (game time) after the card
  const intro = await az(() => window.__said.slice());
  check(intro.some((l) => l.includes(start.intro[0])), `${tag}: the intro plays ("${start.intro[0].slice(0, 48)}...")`);
  await skip();

  for (let s = 0; s < 3; s++) {
    const label = `${tag} district ${s + 1}`;
    const info = await az((s) => {
      AZ.campaign.deck = 0; AZ.campaign.sector = s; AZ.campaign.flags = {};
      AZ.loadSector(true);
      document.querySelector('#card')?.classList.remove('on');
      AZ.hud.subs = []; AZ.hud.subT = 0; AZ.hud.nextSub();
      window.__said = [];
      const lv = AZ.level;
      return {
        id: lv.id, name: lv.rooms[AZ.room].name, beat: AZ.deckBeat().kind,
        gate: AZ.deckWorld.dynamic.find((d) => d.el.id?.startsWith('gate_'))?.mesh.visible,
        drones: lv.sentinels.length, tokens: lv.tokens.length,
        texts: lv.texts.map((t) => t.text),
        lids: lv.elements.filter((x) => x.mat === 'glassWall').map((x) => x.box[4] - x.box[1]),
        roots: lv.elements.filter((x) => x.mat === 'root' && x.box[4] === 22).length,
      };
    }, s);
    check(info.id === `c0s${s}` && info.gate === true, `${label} ${info.name} (${info.id}): the gate starts locked`);
    check(info.drones === s && info.tokens === 0 && !info.texts.includes('FOLLOW THE PINK LIGHTS'), `${label}: ${s} drone(s), no tokens, the Cradle's own signs`, JSON.stringify({ d: info.drones, t: info.tokens }));
    // lids: open (standing, 1.4 m) after SEVERED, closed (0.55 m) otherwise; Varga's own lid follows whether she is awake
    const podLids = info.lids.filter((h) => Math.abs(h - 1.4) < 0.01 || Math.abs(h - 0.55) < 0.01);
    check(podLids.length > 10 && podLids.every((h) => (e === 'SEVER' ? Math.abs(h - 1.4) < 0.01 : Math.abs(h - 0.55) < 0.01)), `${label}: ${podLids.length} pod lids, ${e === 'SEVER' ? 'all open' : 'all closed'}`);
    check(info.roots >= 12, `${label}: roots hang from the ceiling (${info.roots})`);
    if (s === 2) {
      check(info.texts.includes('NIGHT WATCH - FORWARD DECKS') && info.texts.includes('ROW ONE  -  I. VARGA'), `${label}: row one, and the night watch gate`);
    }
    const held = await az(() => {
      const ex = AZ.level.exit.box;
      AZ.player.place([0, 0.86, ex[5] + 6, 0]); AZ.simulate(0.2);
      AZ.input.keys.add('KeyW'); for (let i = 0; i < 40; i++) AZ.simulate(0.05); AZ.input.keys.delete('KeyW');
      return AZ.campaign.sector;
    });
    check(held === s, `${label}: the locked gate does not let you through`);

    // the drones, in the world the ending made
    if (s === 2) {
      const drone = await az((e) => {
        const ds = AZ.deckWorld.sentinels[0];
        const home = ds.pos.clone();
        const before = window.__setbacks;
        // stand right in front of it, in its cone
        AZ.engine.setState(AZ.room, 'PHYSICAL', { force: true });
        AZ.player.place([ds.pos.x + ds.dir.x * 3, 0.86, ds.pos.z + ds.dir.z * 3, 0]);
        let sus = 0, chased = false;
        for (let i = 0; i < 40; i++) { AZ.simulate(0.05); sus = Math.max(sus, ds.suspicion); chased = chased || ds.mode === 'chase'; }
        const moved = ds.pos.distanceTo(home);
        const to = AZ.player.pos.clone().sub(ds.pos).setY(0).normalize();
        const facing = to.dot(ds.dir);
        const caught = window.__setbacks - before;
        // now from the ceiling (INVERTED): HALCYON's drones never look up
        AZ.player.place([0, 0.86, -40, 0]);
        AZ.engine.setState(AZ.room, 'INVERTED', { force: true });
        for (let i = 0; i < 50; i++) AZ.simulate(0.05);
        ds.suspicion = 0; ds.mode = 'patrol';
        const y = AZ.player.pos.y;
        AZ.player.pos.x = ds.pos.x + ds.dir.x * 4; AZ.player.pos.z = ds.pos.z + ds.dir.z * 4;
        let upSus = 0;
        for (let i = 0; i < 16; i++) { AZ.simulate(0.05); upSus = Math.max(upSus, ds.suspicion); }
        AZ.engine.setState(AZ.room, 'PHYSICAL', { force: true });
        for (let i = 0; i < 40; i++) AZ.simulate(0.05);
        return { sus, chased, moved, facing, caught, eye: ds.model.userData.eyeMat.color.getHex(), y, upSus };
      }, e);
      if (e === 'SEVER') check(drone.moved < 0.01 && drone.sus === 0 && !drone.caught && drone.eye === 0x1a1a22 && drone.upSus === 0, `${label}: SEVERED drones stand dark and still and never see you`, JSON.stringify(drone));
      if (e === 'MIRROR') check(drone.sus === 0 && !drone.chased && !drone.caught && drone.facing > 0.8 && drone.eye === 0xb48cff, `${label}: OBSERVED drones stop and watch you, violet-eyed, and never chase`, JSON.stringify(drone));
      if (e === 'SUSTAIN') check(drone.sus > 0.3 && drone.y > 18 && drone.upSus > 0.3, `${label}: SUSTAINED drones hunt, and having learned to look up they see you on the ceiling`, JSON.stringify(drone));
      if (e === null) check(drone.sus > 0.3 && drone.y > 18 && drone.upSus === 0, `${label}: before the choice the drones hunt, and the ceiling hides you`, JSON.stringify(drone));
      await az(() => { AZ.deckWorld.sentinels.forEach((x) => x.reset()); window.__said = []; });
    }

    // do the scene
    const scene = await az(() => {
      const c = AZ.deckWorld.focusCandidates(AZ).find((f) => !f.id.includes('beacon') && !f.id.includes('frag_'));
      if (!c) return { ok: false };
      AZ.player.place([c.pos[0], Math.max(0.86, c.pos[1] - 0.6), c.pos[2] + 1.2, 0]); AZ.simulate(0.1);
      const beat = AZ.deckBeat();
      if (beat.kind === 'contradiction') { AZ.engine.setState(AZ.room, 'ECHO', { force: true }); AZ.simulate(0.1); }
      AZ.useDeck(c);
      const said = window.__said.slice();
      for (let i = 0; i < 120; i++) { AZ.hud.subT = 0; AZ.simulate(0.1); }
      if (beat.kind === 'contradiction') { AZ.engine.setState(AZ.room, 'PHYSICAL', { force: true }); AZ.simulate(0.1); }
      return { ok: !!AZ.deckWorld.flags.beat_done, kind: beat.kind, said, gate: AZ.deckWorld.dynamic.find((d) => d.el.id?.startsWith('gate_'))?.mesh.visible, clue: AZ.facts.get('clue_varga') };
    });
    check(scene.ok && scene.gate === false, `${label}: the ${scene.kind} scene opens the gate`);
    if (s === 0) check(scene.said.some((l) => l.startsWith('VARGA: Last log.')) && scene.said.some((l) => l.startsWith('JUNO: She asked for me.')), `${label}: Varga's last log plays in her own voice`, JSON.stringify(scene.said.slice(0, 3)));
    if (s === 1) {
      const juno = scene.said.filter((l) => l.startsWith('JUNO:'));
      check(juno.length === 3 && juno[0].includes('Osei\'s shift') && juno[2].includes('forty-two cycles'), `${label}: the registry plays Juno's confession, all three lines`, JSON.stringify(juno));
      check(scene.clue === 'cleared', `${label}: the record is corrected (clue on Varga, not anyone else)`);
    }
    if (s === 2) {
      const varga = scene.said.filter((l) => l.startsWith('VARGA:'));
      check(varga.length === 6 && varga[0].includes(OPEN[e]) && varga[3].includes('whose hands'), `${label}: Varga speaks her six lines at row one`, JSON.stringify(varga[0]));
    }
    if (s === 0) {
      const frag = await az(() => {
        const n = AZ.level.interactables.filter((i) => i.kind === 'fragment').length;
        const f = AZ.deckWorld.focusCandidates(AZ).find((c) => c.id.includes('frag_'));
        window.__said = [];
        AZ.useDeck(f);
        const said = window.__said.slice();
        for (let i = 0; i < 40; i++) { AZ.hud.subT = 0; AZ.simulate(0.1); }
        return { n, said };
      });
      check(frag.n === 3 && frag.said.length === 1 && frag.said[0].startsWith('NONE: '), 'three memory fragments per district, read by the narrator', JSON.stringify(frag));
    }
    if (e === 'SEVER' || e === null) {
      await az(() => { const vp = AZ.level.npcs[0]?.pos || [0, 0, -60]; AZ.player.place([vp[0] || 0, 0.86, (vp[2] || -60) + 7, 0]); AZ.simulate(0.3); });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(shots, `c0${s + 1}-cradle-${tag.toLowerCase()}.png`), timeout: 240000 });
    }
    // through the gate (the drones go back to their rounds first: this checks the gate, not them;
    // a catch during the scene freezes you for a moment, so wait for that to pass)
    await page.waitForFunction(() => !AZ.catching, null, { timeout: 30000 }).catch(() => {});
    await az(() => {
      for (const d of AZ.deckWorld.sentinels) { d.pos.copy(d.home); d.reset(); }
      const ex = AZ.level.exit.box;
      AZ.player.place([0, 0.86, ex[5] + 5, 0]); AZ.simulate(0.2);
      AZ.input.keys.add('KeyW'); for (let i = 0; i < 60; i++) AZ.simulate(0.05); AZ.input.keys.delete('KeyW');
    });
    await page.waitForFunction((s) => !AZ.campaign.zones || AZ.campaign.sector !== s, s, { timeout: 30000 }).catch(() => {});
    await page.waitForFunction(() => !AZ.transitioning, null, { timeout: 30000 }).catch(() => {});
    districts++;
    if (s < 2) {
      check(await az((s) => AZ.campaign.zones && AZ.campaign.sector === s + 1, s), `${label}: through the gate to district ${s + 2}`);
      continue;
    }
    // the night watch gate climbs to the forward decks
    const v = await az(() => ({
      mode: AZ.mode, zones: !!AZ.campaign.zones, run: AZ.run, ending: AZ.campaign.ending, seed: AZ.campaign.seed,
      kicker: document.querySelector('#card small').textContent,
      intro: AZ.story.decks[0].intro.map((l) => l.text), after: AZ.story.after.key, sentinels: AZ.story.after.sentinels,
      windows: AZ.level.elements.filter((x) => /^window/.test(x.mat)).map((x) => x.mat),
      dark: AZ.story.after.dark || 0,
      other: AZ.level.npcs.filter((n) => n.crew === 'other').length,
    }));
    const want = e ? AFTER[e].intro[0].text : null;
    check(v.mode === 'deck' && !v.zones && v.run === 'vessel' && v.ending === e && v.after === tag, `${tag}: NIGHT WATCH - FORWARD DECKS starts the vessel after ${tag}`, JSON.stringify({ ...v, intro: undefined }));
    check(e ? v.intro[0] === want && v.kicker === `DECK 1 OF 8 · AFTER ${AFTER[e].title}` : v.kicker === 'DECK 1 OF 8' && !Object.values(AFTER).some((a) => a.intro?.[0].text === v.intro[0]), `${tag}: Deck 1 opens with that ending's lines ("${v.intro[0].slice(0, 50)}...")`);
    check(v.windows.length > 0 && v.windows.every((m) => m === (e === 'SEVER' ? 'windowDark' : 'windowStars')), `${tag}: the window band is ${e === 'SEVER' ? 'black glass' : 'stars'}`, JSON.stringify(v.windows));
    check((e === 'SEVER') === (v.dark > 0) && (e === 'SUSTAIN') === (v.other > 0), `${tag}: ${e === 'SEVER' ? 'emergency light' : e === 'SUSTAIN' ? 'the Other hangs from the ceiling of the first room' : 'normal light, nobody extra aboard'}`, JSON.stringify({ dark: v.dark, other: v.other }));
    if (e === 'SEVER' || e === 'SUSTAIN') {
      await az(() => { document.querySelector('#card')?.classList.remove('on'); AZ.hud.subs = []; AZ.hud.subT = 0; AZ.hud.nextSub(); AZ.player.place([AZ.level.spawn[0], 0.86, AZ.level.spawn[2], AZ.level.spawn[3]]); AZ.simulate(0.3); });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(shots, `c04-vessel-${tag.toLowerCase()}.png`), timeout: 240000 });
    }
  }
}

// the last scene on the bridge, after each ending
console.log('The Bridge, after each ending');
for (const e of ENDINGS) {
  const tag = e || 'NONE';
  const r = await az((e) => {
    AZ.observer.brain.lessons.clear();
    if (e === 'SUSTAIN') ['ceiling', 'runner', 'patient'].forEach((l) => AZ.observer.brain.lessons.add(l));
    AZ.facts.set('verdict_right', false);
    AZ.startVessel(4242, null, null, e);
    AZ.campaign.deck = 7; AZ.campaign.sector = 3; AZ.campaign.flags = {};
    AZ.loadSector(false);
    AZ.hud.subs = []; AZ.hud.subT = 0; AZ.hud.nextSub();
    const juno = AZ.deckWorld.npcs.find((n) => n.n.id === 'guest_juno');
    const other = AZ.deckWorld.npcs.find((n) => n.n.id === 'guest_other');
    const before = { juno: juno ? juno.model.visible : null, other: other ? Math.abs(other.model.rotation.z - Math.PI) < 1e-6 : null };
    const culprit = AZ.story.truth.culprit;
    // a wrong name first
    window.__said = [];
    AZ.accuse((culprit + 1) % 7);
    const wrong = window.__said.slice();
    for (let i = 0; i < 60; i++) { AZ.hud.subT = 0; AZ.simulate(0.1); }
    window.__said = [];
    AZ.accuse(culprit);
    const coda = window.__said.slice();
    const menuDuring = AZ.menu;
    const junoAfter = juno ? juno.model.visible : null;
    for (let i = 0; i < 120 && AZ.menu !== 'ending'; i++) { AZ.hud.subT = 0; AZ.simulate(0.1); }
    const btn = document.querySelector('#newVessel');
    return {
      before, wrong, coda, menuDuring, junoAfter, menu: AZ.menu,
      again: btn ? btn.childNodes[0].textContent : null,
      paras: [...document.querySelectorAll('#ending .body p.dim')].map((p) => p.textContent),
      twist: document.querySelector('#ending .body h2')?.textContent,
    };
  }, e);
  const A = AFTER[tag];
  const codaText = A.coda.map((l) => `${l.who}: ${l.text}`);
  check(codaText.every((l) => r.coda.includes(l)) && r.menuDuring === null, `${tag}: the right name plays the last scene first (${A.coda.length} lines)`, JSON.stringify(r.coda.slice(0, 2)));
  check(r.menu === 'ending' && r.again === (A.again ? A.again[0] : 'CYCLE 43'), `${tag}: then the ending card, with ${r.again}`, JSON.stringify({ menu: r.menu, again: r.again }));
  check(A.coda.filter((l) => l.who === 'NONE').every((l) => r.paras.includes(l.text)), `${tag}: the scene's narration closes the ending card`);
  check(e === 'SEVER' ? r.wrong.some((l) => l.includes('Nothing folds back')) : r.wrong.some((l) => l.includes('The cycle notes your answer')), `${tag}: a wrong name ${e === 'SEVER' ? 'no longer folds back' : 'gives another chance'}`);
  if (e === 'SEVER') check(r.before.juno === false && r.junoAfter === true, 'SEVER: Juno walks in through the bridge door when the chair unlocks', JSON.stringify(r.before));
  else check(r.before.juno === null, `${tag}: no Juno in the verdict room`);
  check((e === 'SUSTAIN') === (r.before.other === true), `${tag}: ${e === 'SUSTAIN' ? 'the Other waits upside down above the chair' : 'nobody above the chair'}`);
  if (e === 'SUSTAIN') {
    await az(() => { AZ.closeMenu(); AZ.player.place([0, 0.86, AZ.level.interactables.find((i) => i.kind === 'chair').pos[2] + 5, 0]); AZ.simulate(0.3); });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(shots, 'c05-bridge-sustain.png'), timeout: 240000 });
  }
}

// THE CRADLE from the chapter menu, after a page reload: the last ending reached on this device
console.log('THE CRADLE from the chapter menu');
await page.evaluate(() => {
  localStorage.setItem('afterzero.lastEnding', JSON.stringify({ key: 'SUSTAIN', lessons: ['ceiling', 'runner'] }));
});
await page.reload();
await page.waitForFunction(() => window.AZ, null, { timeout: 180000 });
await az(() => AZ.begin('cradle'));
await page.waitForFunction(() => AZ.mode === 'deck', null, { timeout: 60000 }).catch(() => {});
const menu = await az(() => ({
  run: AZ.run, set: AZ.campaign?.set, ending: AZ.campaign?.ending, after: AZ.story?.after?.key, fact: AZ.facts.get('ending'),
  lessons: [...AZ.observer.brain.lessons], machine: AZ.facts.get('machine_activated') && AZ.facts.get('brain_seen'),
  law: JSON.stringify(AZ.engine.laws[1]), slot3: AZ.engine.unlocked >= 3,
}));
check(menu.run === 'cradle' && menu.set === 'cradle' && menu.ending === 'SUSTAIN' && menu.after === 'SUSTAIN' && menu.fact === 'SUSTAIN', 'NEW GAME on the Cradle card adopts the last ending reached on this device', JSON.stringify(menu));
check(menu.lessons.includes('ceiling') && menu.lessons.includes('runner') && menu.machine && /ECHOES/.test(menu.law) && menu.slot3, 'with what the Observer learned, the prologue played to the machine, ECHOES SOLIDIFY IN ECHO and three slots', JSON.stringify(menu));

check(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
server.close();
console.log(`\n${passed} passed, ${failures.length} failed (${districts} Cradle districts played)`);
if (failures.length) { for (const f of failures) console.log(' - ' + f); process.exit(1); }
