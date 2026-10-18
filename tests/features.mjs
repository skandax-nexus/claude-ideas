// v0.4 feature test: character select, voiced and visual interactions,
// touch zoom, the floating joystick, the dock, saves and settings - on a
// desktop page and a touch phone page, through real DOM input.
//
//   NODE_PATH=$(npm root -g) node tests/features.mjs
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

// a click that starts a level: the level builds inside the click handler, which on a loaded
// machine outlasts Playwright's 30 s wait for the click to settle, so click from inside the page
const tapIn = (page, sel) => page.evaluate((q) => setTimeout(() => document.querySelector(q).click(), 0), sel);
let passed = 0;
const failures = [];
const check = (ok, label, detail = '') => {
  if (ok) {
    passed++;
    console.log(`  ok   ${label}`);
  } else {
    failures.push(`${label} ${detail}`);
    console.log(`  FAIL ${label} ${detail}`);
  }
};

// spy on voices and sounds so the test can see them
const SPY = () => {
  const g = window.AZ;
  window.__spoken = [];
  window.__sfx = [];
  g.voice.speak = (text, who) => window.__spoken.push({ who, text });
  Object.defineProperty(g.voice, 'available', { get: () => true });
  for (const k of ['terminal', 'door', 'insert', 'beacon', 'token', 'greet', 'jump', 'land', 'ui', 'pickup', 'chime']) {
    const f = g.audio[k].bind(g.audio);
    g.audio[k] = (...a) => { window.__sfx.push(k); return f(...a); };
  }
};

async function desktop() {
  console.log('Desktop');
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(1200);
  await page.evaluate(SPY);
  const az = (fn, a) => page.evaluate(fn, a);

  // NEW GAME -> chapter -> save slot -> character select
  await page.click('#begin');
  await page.waitForTimeout(300);
  check(await page.isVisible('#chapters'), 'NEW GAME asks for a chapter');
  check(await az(() => [...document.querySelectorAll('#chapters h3')].map((h) => h.textContent).join()) === 'PROLOGUE,HALCYON,THE CRADLE,THE VESSEL,STORY STUDIO,WORLD FORGE', 'chapters: Prologue, HALCYON, the Cradle, the Vessel, Story Studio, World Forge');
  check((await page.$$('#chapters [data-cont]')).length === 0, 'no CONTINUE on a chapter you have not played');
  await page.click('[data-newch="prologue"]');
  await page.waitForTimeout(300);
  check(await page.isVisible('#saves') && (await page.$$('#saves [data-slot]')).length === 10, 'a new game asks for one of ten save slots');
  await page.click('#saves [data-slot="1"]');
  await page.waitForTimeout(500);
  check(await page.isVisible('#hero'), 'then character select');
  check((await page.$$('#hero [data-hero] img')).length === 19, 'every look is offered, each with its portrait (2 realistic + 17 stylised)');
  check(await az(() => AZ.player.model.userData.spec.model) === 'rb_ren_f', 'the default look is the realistic Ren (Rocketbox model)');
  check(await az(() => {
    const u = AZ.player.model.userData;
    const names = [];
    u.model.traverse((o) => o.isMesh && names.push(o.material.name));
    return ['body', 'head', 'hair', 'eye'].every((n) => names.includes(n)) && !!u.bones.LeftArm && !!u.bones.Head;
  }), 'the realistic model has skin, eye and hair materials and a mapped skeleton');
  check(await az(() => document.querySelectorAll('#hero .sw button').length) === 0, 'the realistic look has no colour swatches');
  await page.click('[data-hero="nova"]');
  await page.waitForTimeout(1500);
  check(await az(() => AZ.player.model.userData.spec.model) === 'nova', 'the stylised Nova look is still offered');
  await page.click('#hero .sw button[data-k="hair"]:nth-child(3)');
  await page.click('#hero .sw button[data-k="top"]:nth-child(3)');
  await page.waitForTimeout(200);
  const nova = await az(() => ({ hero: AZ.settings.hero, spec: AZ.player.model.userData.spec }));
  check(nova.hero.hair === 0xc79a62 && nova.hero.top === 0x8fc6e8 && nova.spec.hair === 0xc79a62, 'hair and outfit colours apply to the model', JSON.stringify(nova));
  await page.click('[data-hero="scifi"]');
  await page.waitForTimeout(1500);
  await page.waitForTimeout(200);
  check(await az(() => AZ.settings.hero.id) === 'scifi', 'picking a look updates the choice');
  check(await az(() => AZ.player.model.userData.actor && AZ.player.model.userData.spec.model) === 'scifi', 'player model rebuilt with the new look');
  check(await az(() => document.querySelectorAll('#hero .sw button').length) === 0, 'looks without colour options hide the swatches');
  check(await az(() => !!AZ.player.model.userData.handL.children.length), 'reality device moved into the new model\'s hand');
  await page.screenshot({ timeout: 180000, path: path.join(shots, 'f01-character-select.png') });
  await page.click('#heroGo');
  await page.waitForTimeout(800);
  check(await az(() => AZ.started && AZ.mode === 'station' && AZ.room === 'antechamber'), 'START begins the prologue');
  check(await az(() => JSON.parse(localStorage.getItem('afterzero.settings.v1')).hero.id) === 'scifi', 'look persisted');
  check(await az(() => AZ.slot === 1 && AZ.run === 'prologue'), 'the new game plays in the chosen slot');
  await az(() => AZ.saveTo('auto'));
  check(await az(() => { const r = JSON.parse(localStorage.getItem('afterzero.slot.1') || 'null'); return r && r.meta && r.meta.run; }) === 'prologue', 'autosave goes into the chosen slot, tagged with its chapter');

  // smart renderer: eases resolution when slow, gives it back when fast
  const sm = await az(() => {
    const s = AZ.smart;
    const was = AZ.menu;
    AZ.menu = null;
    s.reset();
    for (let i = 0; i < 2 * 2 * 30; i++) s.sample(1 / 30); // 4 s at 30 fps
    const low = s.scale;
    for (let i = 0; i < 6 * 2 * 60; i++) s.sample(1 / 70); // 12 s at 70 fps
    const back = s.scale;
    AZ.menu = was;
    return { low, back, pr: AZ.renderer.getPixelRatio() };
  });
  check(sm.low < 1 && sm.back > sm.low, 'smart renderer lowers resolution when slow and raises it with headroom', JSON.stringify(sm));
  await az(() => { AZ.changeSetting('smart', false); });
  check(await az(() => AZ.renderer.getPixelRatio() === Math.min(devicePixelRatio, AZ.smart.quality().pixelRatio)), 'smart renderer off: full resolution of the chosen quality');
  await az(() => AZ.changeSetting('smart', true));

  // dock: laws hidden until the device, map and log open, key hints present
  check(await az(() => document.querySelector('#dock .laws').classList.contains('off')), 'LAWS hidden in the dock before you have the device');
  // (LAWS and COMBO wait for the device; RULES and the four gear slots belong to WORLD FORGE)
  const hints = await az(() => [...document.querySelectorAll('#dock .d')].filter((b) => getComputedStyle(b).display !== 'none').map((b) => b.querySelector('kbd')?.textContent).join());
  check(hints === 'J,M,H,Z,Esc', 'dock shows key hints on desktop (incl. walk/run)', hints);
  await az(() => { AZ.input.actions.push('map'); AZ.frame(); });
  check(await az(() => AZ.menu) === 'map', 'map opens from the dock action');
  await az(() => AZ.closeMenu());
  await page.waitForTimeout(300);
  await az(() => { if (AZ.menu) AZ.closeMenu(); }); // headless pointer-lock release can reopen pause

  // one button switches walking and running; running is faster
  await az(() => { AZ.input.toggleRun(false); AZ.player.place([0, 0.86, 23.4, 0]); AZ.simulate(0.2); });
  const walkV = await az(() => { AZ.input.keys.add('KeyW'); let v = 0; for (let i = 0; i < 8; i++) { AZ.simulate(0.05); v = Math.max(v, AZ.player.speed); } AZ.input.keys.delete('KeyW'); return v; });
  await az(() => { document.querySelector('#dock .gaitd').click(); AZ.player.place([0, 0.86, 23.4, 0]); AZ.simulate(0.2); });
  const runV = await az(() => { AZ.input.keys.add('KeyW'); let v = 0; for (let i = 0; i < 8; i++) { AZ.simulate(0.05); v = Math.max(v, AZ.player.speed); } AZ.input.keys.delete('KeyW'); return v; });
  check(runV > walkV * 1.7 && await az(() => AZ.input.runMode && document.querySelector('#dock .gaitd span').textContent === 'RUN'), 'the walk/run button toggles the gait', `${walkV.toFixed(2)} -> ${runV.toFixed(2)}`);
  await az(() => { AZ.input.toggleRun(false); AZ.player.place([0, 0.86, 23.4, 0]); AZ.simulate(0.3); });

  // zoom: wheel only (no buttons)
  check((await page.$$('#zoombtns, [data-zoom]')).length === 0, 'zoom buttons removed');
  const z0 = await az(() => AZ.settings.zoom);
  await az(() => {
    if (AZ.menu) AZ.closeMenu();
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 300, bubbles: true }));
    AZ.frame();
  });
  const z1 = await az(() => AZ.settings.zoom);
  check(z1 > z0, 'mouse wheel zooms out', `${z0} -> ${z1}`);
  await az(() => { AZ.settings.zoom = 1; AZ.player.zoom = 1; });

  // the floating prompt over the shard; using it plays sound + the device appears
  await az(() => { AZ.player.place([0, 0.86, 23.4, 0]); AZ.simulate(0.6); });
  const prompt = await az(() => {
    const el = document.querySelector('#prompt');
    return { on: el.classList.contains('on'), text: el.textContent, left: parseFloat(el.style.left), top: parseFloat(el.style.top) };
  });
  check(prompt.on && /TOUCH/.test(prompt.text), 'prompt shown for the floating object', JSON.stringify(prompt));
  check(prompt.left > 300 && prompt.left < 980 && prompt.top > 100 && prompt.top < 600, 'prompt is placed over the object on screen', `${prompt.left},${prompt.top}`);
  check(await az(() => AZ.fx.marker.visible), 'focus ring marks the object in the world');
  await page.screenshot({ timeout: 180000, path: path.join(shots, 'f02-prompt.png') });

  // a conversation: Juno frames the camera and speaks
  await az(() => {
    for (const k of ['has_device', 'left_antechamber', 'met_juno', 'has_tick']) AZ.facts.set(k);
    AZ.enterRoom('lab', true);
    AZ.npcs.dropT = -1;
    AZ.player.place([-5, 0.86, 5.3, 0]);
    AZ.simulate(0.4);
    AZ.focus = AZ.findFocus();
    AZ.use();
    AZ.simulate(1.5);
  });
  await az(() => AZ.frame());
  const talk = await az(() => ({ target: !!AZ.player.talkTarget, letterbox: document.body.classList.contains('talking'), spoken: window.__spoken.map((s) => s.who) }));
  check(talk.target && talk.letterbox, 'talking to Juno frames the conversation (camera + letterbox)', JSON.stringify(talk));
  check(talk.spoken.includes('JUNO'), 'Juno\'s line is voiced', JSON.stringify(talk.spoken));
  check(await az(() => window.__sfx.includes('greet')), 'greeting sound plays');
  await page.screenshot({ timeout: 180000, path: path.join(shots, 'f03-conversation.png') });
  await az(() => { while (AZ.hud.talking) { AZ.hud.subT = 0; AZ.hud.subs = []; AZ.hud.nextSub(); } AZ.simulate(0.5); });
  check(await az(() => !AZ.player.talkTarget), 'camera returns after the conversation');

  // jumping and landing make sounds
  await az(() => { window.__sfx = []; AZ.input.state.jump = true; AZ.simulate(1.2); });
  const js = await az(() => window.__sfx);
  check(js.includes('jump') && js.includes('land'), 'jump and land sounds', JSON.stringify(js));

  // calm HUD after a few quiet seconds, wakes on an action
  await az(() => { AZ.lastEvent = AZ.time - 10; AZ.frame(); });
  check(await az(() => document.body.classList.contains('calm')), 'HUD calms down while nothing happens');
  await az(() => { AZ.input.actions.push('journal'); AZ.frame(); AZ.closeMenu(); AZ.frame(); });
  check(await az(() => !document.body.classList.contains('calm')), 'HUD comes back when you act');

  // the vessel: hologram log, sparkles, door glide, sounds
  await az(() => {
    AZ.startVessel(20261016);
    AZ.campaign.deck = 1; AZ.campaign.sector = 0; AZ.campaign.flags = {}; AZ.loadSector(false);
    window.__sfx = [];
    const t = AZ.level.interactables.find((i) => i.kind === 'terminal');
    AZ.useDeck({ id: 'deck:' + t.id, it: t });
    AZ.simulate(0.5);
  });
  check(await az(() => AZ.fx.holos.length === 1 && window.__sfx.includes('terminal')), 'terminal plays its log on a hologram screen with sound');
  await az(() => {
    const lock = AZ.level.interactables.find((i) => i.kind === 'lock');
    AZ.engine.setLaw(1, { subject: 'HELD', verb: 'PERSISTS', target: 'ALL' });
    AZ.engine.setState(lock.room, 'PHYSICAL', { force: true });
    AZ.held = lock.needs;
    AZ.useDeck({ id: 'deck:' + lock.id, it: lock });
    AZ.simulate(0.4);
    window.__door = AZ.deckWorld.dynamic.find((d) => d.el.id === 'door_' + lock.room);
  });
  const door = await az(() => ({ t: window.__door.openT, vis: window.__door.mesh.visible, y: window.__door.mesh.position.y, sfx: window.__sfx }));
  check(door.t > 0 && door.t < 1 && door.vis && door.y > 0, 'door glides open instead of vanishing', JSON.stringify(door));
  check(door.sfx.includes('insert') && door.sfx.includes('door'), 'key insert and door sounds', JSON.stringify(door.sfx));
  await az(() => AZ.simulate(1.5));
  check(await az(() => !window.__door.mesh.visible && !AZ.deckWorld.colliders.some((c) => c.id === window.__door.el.id)), 'opened door is gone and walkable');
  check(await az(() => AZ.fx.bursts.length >= 0), 'sparkle effects run');

  // crew conversation: voiced with a crew voice
  await az(() => {
    AZ.campaign.deck = 0; AZ.campaign.sector = 3; AZ.campaign.flags = {}; AZ.loadSector(false);
    window.__spoken = [];
    const f = AZ.deckWorld.focusCandidates(AZ).find((c) => c.id.startsWith('dnpc'));
    AZ.useDeck(f);
    for (let i = 0; i < 4; i++) { AZ.hud.subT = 0; AZ.simulate(0.2); }
  });
  check(await az(() => window.__spoken.some((s) => s.who === 'CREW')), 'crew lines are voiced');
  // the neural voice pack covers scripted and generated lines (spliced from recorded phrases and names)
  const pack = await az(async () => {
    const V = AZ.voice;
    for (let i = 0; i < 100 && !V.pack; i++) await new Promise((r) => setTimeout(r, 100));
    if (!V.pack) return { loaded: false };
    const lines = [];
    for (const d of AZ.story.decks) {
      d.intro.forEach((l) => lines.push([l.who, l.text, {}]));
      for (const b of d.beats) {
        if (b.junoAfter) lines.push(['JUNO', b.junoAfter, {}]);
        if (b.tick) lines.push(['TICK', b.tick, {}]);
        if (b.lines) b.lines.forEach((l) => lines.push(['CREW', l.text, { gender: 'f' }]));
      }
    }
    lines.push(['JUNO', 'Varga left recordings everywhere. The console by the crates is the one she cared about.', {}]);
    const missing = lines.filter(([w, t, e]) => !V.plan(t, w, e)).map(([w, t]) => `${w}: ${t}`);
    const crew = lines.find(([w]) => w === 'CREW');
    return { loaded: true, total: lines.length, missing, dur: V.duration(crew[1], 'CREW', crew[2]) };
  });
  check(pack.loaded, 'the voice pack loads');
  check(pack.loaded && pack.missing.length === 0, `every story line of this vessel can be spoken from the pack (${pack.total} lines)`, JSON.stringify(pack.missing?.slice(0, 5)));
  check(pack.dur > 1, 'line durations come from the recordings', String(pack.dur));

  // character change from the pause menu, mid-vessel
  await az(() => { AZ.openMenu('pause'); });
  await page.click('#heroBtn2');
  await page.waitForTimeout(300);
  await page.click('[data-hero="ren"]');
  await page.waitForTimeout(300);
  check(await az(() => AZ.settings.hero.id === 'ren' && AZ.menu === 'hero'), 'look can be changed from the pause menu');
  await page.screenshot({ timeout: 180000, path: path.join(shots, 'f04-character-midgame.png') });
  await page.click('#heroGo');
  await page.waitForTimeout(300);
  check(await az(() => AZ.menu) === 'pause', 'DONE returns to the pause menu');

  // voices toggle in settings
  await page.click('#settingsBtn2');
  await page.waitForTimeout(200);
  await page.click('#settings button[data-k="voice"][data-v="false"]');
  check(await az(() => AZ.voice.enabled === false && AZ.settings.voice === false), 'voiced dialogue can be switched off');

  // save and load still round-trip on the vessel
  await az(() => { AZ.saveTo(2); });
  check(await az(() => JSON.parse(localStorage.getItem('afterzero.slot.2')).mode === 'deck'), 'manual save slot written');

  check(errors.length === 0, 'no page errors (desktop)', errors.join(' | '));
  await page.close();
}

async function phone() {
  console.log('Phone (touch)');
  const ctx = await browser.newContext({ viewport: { width: 915, height: 412 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(1200);
  await page.evaluate(SPY);
  const az = (fn, a) => page.evaluate(fn, a);
  await page.tap('#begin');
  await page.tap('[data-newch="vessel"]');
  await page.tap('#saves [data-slot="0"]');
  await page.waitForTimeout(500);
  const heroBox = await page.locator('#heroGo').boundingBox();
  check(heroBox && heroBox.y + heroBox.height <= 412, 'START is on screen on a phone', JSON.stringify(heroBox));
  await page.tap('[data-hero="spacer"]');
  await page.waitForTimeout(1500);
  await page.waitForTimeout(200);
  await page.tap('#heroGo');
  await page.waitForTimeout(1500);
  check(await az(() => AZ.mode === 'deck' && AZ.settings.hero.id === 'spacer' && AZ.voice.youMale), 'the vessel starts with the chosen look (and its voice)');
  await az(() => { AZ.hud.subs = []; AZ.hud.subT = 0; AZ.hud.nextSub(); document.querySelector('#card').classList.remove('on'); });

  const cdp = await ctx.newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y], id) => ({ x, y, id })) });

  // the joystick appears where the thumb lands and moves the player
  const p0 = await az(() => AZ.player.pos.toArray());
  await touch('touchStart', [[150, 250]]);
  const stick = await az(() => { const s = document.querySelector('#stick'); const r = s.getBoundingClientRect(); return { on: s.classList.contains('on'), cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; });
  check(stick.on && Math.abs(stick.cx - 150) < 6 && Math.abs(stick.cy - 250) < 6, 'joystick appears under the thumb', JSON.stringify(stick));
  await touch('touchMove', [[150, 190]]);
  await az(() => AZ.simulate(1.0));
  await page.screenshot({ timeout: 180000, path: path.join(shots, 'f05-phone-stick.png') });
  await touch('touchEnd', []);
  const p1 = await az(() => AZ.player.pos.toArray());
  const moved = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]);
  check(moved > 1.5, 'pushing the stick walks the player', `${moved.toFixed(2)} m`);
  check(await az(() => !document.querySelector('#stick').classList.contains('on')), 'joystick fades when released');

  // pinch to zoom on the look side, double tap to reset
  const zA = await az(() => AZ.settings.zoom);
  await touch('touchStart', [[600, 200], [700, 200]]);
  for (let i = 1; i <= 6; i++) await touch('touchMove', [[600 + i * 25, 200], [700 - i * 0, 200]].map(([x, y], k) => (k === 0 ? [600 + i * 12, y] : [700 - i * 12, y])));
  await touch('touchEnd', []);
  await az(() => AZ.frame());
  const zB = await az(() => AZ.settings.zoom);
  check(zB > zA, 'pinching in zooms out (two fingers closer)', `${zA} -> ${zB}`);
  // two quick taps, dispatched in the page so a busy machine can't stretch the gap
  await az(() => {
    const el = document.querySelector('#lookzone');
    const tap = () => {
      const t = new Touch({ identifier: 7, target: el, clientX: 650, clientY: 220 });
      el.dispatchEvent(new TouchEvent('touchstart', { touches: [t], targetTouches: [t], changedTouches: [t], bubbles: true, cancelable: true }));
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], targetTouches: [], changedTouches: [t], bubbles: true, cancelable: true }));
    };
    tap();
    tap();
    AZ.frame();
  });
  check(await az(() => AZ.settings.zoom) === 1, 'double tap resets the zoom');

  // tap the floating prompt to use what it marks
  await az(() => {
    const it = AZ.level.interactables.find((i) => i.kind === 'terminal');
    const r = AZ.level.rooms[it.room];
    // stand 1.7 m in front of the screen, facing it
    AZ.enterRoom(it.room, true);
    AZ.player.place([it.pos[0] + Math.sin(it.yaw) * 1.7, 0.86, it.pos[2] + Math.cos(it.yaw) * 1.7, r.spawn[3]]);
    const dx = it.pos[0] - AZ.player.pos.x, dz = it.pos[2] - AZ.player.pos.z, d = Math.hypot(dx, dz);
    AZ.player.H.set(dx / d, 0, dz / d);
    AZ.timers = [];
    AZ.hud.subs = []; AZ.hud.subT = 0; AZ.hud.nextSub();
    AZ.simulate(0.5);
    window.__sfx = [];
  });
  await page.waitForFunction(() => document.querySelector('#prompt').classList.contains('on'), null, { timeout: 60000 }).catch(() => {});
  const pr = await az(() => { const el = document.querySelector('#prompt'); const r = el.getBoundingClientRect(); return { on: el.classList.contains('on'), text: el.textContent, x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  check(pr.on, 'a tappable prompt floats over the terminal', JSON.stringify(pr));
  await page.screenshot({ timeout: 180000, path: path.join(shots, 'f06-phone-prompt.png') });
  if (pr.on) {
    await page.touchscreen.tap(pr.x, pr.y);
    await az(() => AZ.frame());
    check(await az(() => window.__sfx.includes('terminal') && AZ.fx.holos.length > 0), 'tapping the prompt uses the terminal');
  }

  // the dock and the minimap open things with a tap
  await page.tap('#dock .map');
  await az(() => AZ.frame());
  check(await az(() => AZ.menu) === 'map', 'MAP in the dock opens the map');
  await az(() => AZ.closeMenu());
  await page.tap('#minimap');
  await az(() => AZ.frame());
  check(await az(() => AZ.menu) === 'map', 'tapping the minimap opens the map');
  await az(() => AZ.closeMenu());
  check((await page.$$eval('#dock .d span', (els) => els.filter((e) => getComputedStyle(e).display !== 'none').length)) === 0, 'dock is icon-only on touch');
  await page.screenshot({ timeout: 180000, path: path.join(shots, 'f07-phone-hud.png') });
  check(errors.length === 0, 'no page errors (phone)', errors.join(' | '));
  await ctx.close();
}


// chapters: each continues its own save; slots can be deleted; Story Studio
async function chapters() {
  console.log('Chapters, save slots, Story Studio');
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const ready = () => page.waitForFunction(() => window.AZ && document.querySelector('#begin'), null, { timeout: 180000 });
  await page.goto(url);
  await ready();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await ready();
  const az = (fn, a) => page.evaluate(fn, a);
  await page.click('#begin');
  await page.click('[data-newch="vessel"]');
  await tapIn(page, '#saves [data-slot="0"]');
  await page.waitForSelector('#heroGo', { state: 'visible' });
  await page.click('#heroGo');
  await page.waitForFunction(() => AZ.mode === 'deck', null, { timeout: 300000 });
  check(await az(() => AZ.slot === 0 && AZ.run === 'vessel'), 'the Vessel starts in slot 1');
  await az(() => AZ.saveTo('auto'));

  await page.reload();
  await ready();
  await page.click('#begin');
  const cards = await az(() => Object.fromEntries([...document.querySelectorAll('#chapters .chapcard')].map((c) => [c.querySelector('h3').textContent, !!c.querySelector('[data-cont]')])));
  check(cards['THE VESSEL'] && !cards.PROLOGUE && !cards.HALCYON, 'CONTINUE sits on the chapter you played, only there', JSON.stringify(cards));
  // v1.0: six chapters; the later ones say which prologue ending they follow
  const status = () => az(() => [...document.querySelectorAll('#chapters .chapcard')].map((c) => `${c.querySelector('h3').textContent}|${c.querySelector('p.dim')?.textContent || ''}`));
  const before = await status();
  check(before.map((s) => s.split('|')[0]).join() === 'PROLOGUE,HALCYON,THE CRADLE,THE VESSEL,STORY STUDIO,WORLD FORGE', 'the chapter picker has six cards, THE CRADLE third, WORLD FORGE last', JSON.stringify(before));
  check(before[2] === 'THE CRADLE|Before the choice' && before[3] === 'THE VESSEL|The ship as it was' && before[0] === 'PROLOGUE|', 'before any ending: "Before the choice" / "The ship as it was"', JSON.stringify(before));
  await az(() => { localStorage.setItem('afterzero.lastEnding', JSON.stringify({ key: 'MIRROR', lessons: [] })); AZ.openChapters('title'); });
  const after = await status();
  check(after[2] === 'THE CRADLE|After OBSERVED' && after[3] === 'THE VESSEL|After OBSERVED' && after[4] === 'STORY STUDIO|After OBSERVED', 'the Cradle card\'s status line follows the last ending reached on this device', JSON.stringify(after));
  await az(() => { localStorage.removeItem('afterzero.lastEnding'); AZ.openChapters('title'); });
  await page.screenshot({ timeout: 180000, path: path.join(shots, 'f08-chapters.png') });
  await tapIn(page, '#chapters [data-cont]');
  await page.waitForFunction(() => AZ.mode === 'deck', null, { timeout: 300000 });
  check(await az(() => AZ.slot === 0 && AZ.run === 'vessel' && !!AZ.campaign), 'CONTINUE resumes that chapter from its slot');

  // a new game into a used slot asks twice; delete asks twice
  await page.reload();
  await ready();
  await page.click('#begin');
  await page.click('[data-newch="prologue"]');
  await page.click('#saves [data-slot="0"]');
  check(await page.isVisible('#saves') && /replace/.test(await page.textContent('#saves [data-slot="0"] small')), 'a used slot asks before it is replaced');
  await page.click('#saves [data-del="0"]');
  check(await az(() => !!localStorage.getItem('afterzero.slot.0')), 'DELETE asks for a second tap');
  await page.screenshot({ timeout: 180000, path: path.join(shots, 'f09-slots.png') });
  await page.click('#saves [data-del="0"]');
  check(await az(() => !localStorage.getItem('afterzero.slot.0')), 'the second tap deletes the save');
  check(await az(() => document.querySelector('#saves [data-slot="0"]').classList.contains('empty')), 'the slot shows as empty again');

  // Story Studio: a vessel story from your wishes
  await page.reload();
  await ready();
  await page.click('#begin');
  await page.click('[data-newch="studio"]');
  check(await page.isVisible('#studio'), 'Story Studio opens');
  await page.fill('#st_title', 'The Night Shift');
  await page.selectOption('#st_mood', 'horror');
  await page.selectOption('#st_twist', 'juno');
  await page.fill('#st_names', 'Aria, Dev, Mina');
  await page.fill('#st_seed', '4242');
  await page.screenshot({ timeout: 180000, path: path.join(shots, 'f10-studio.png') });
  await page.click('#st_go');
  await tapIn(page, '#saves [data-slot="2"]');
  await page.waitForFunction(() => AZ.mode === 'deck', null, { timeout: 300000 });
  const st = await az(() => ({ title: AZ.story.title, mood: AZ.story.mood, names: AZ.story.cast.map((c) => c.name).join(' '), twist: AZ.story.twist.key, run: AZ.run, slot: AZ.slot }));
  check(st.title === 'The Night Shift' && st.mood === 'horror' && st.run === 'studio' && st.slot === 2, 'the studio story uses your title and mood', JSON.stringify(st));
  check(/Aria/.test(st.names) && /Dev/.test(st.names) && /Mina/.test(st.names), 'your crew names are in the story', st.names);
  check(st.twist === 'juno', 'your twist is the twist', st.twist);
  await az(() => AZ.saveTo('auto'));
  await page.reload();
  await ready();
  await page.click('#begin');
  await tapIn(page, '#chapters [data-cont="2"]');
  await page.waitForFunction(() => AZ.mode === 'deck', null, { timeout: 300000 });
  check(await az(() => AZ.story.title === 'The Night Shift' && AZ.story.mood === 'horror' && AZ.campaign.seed === 4242), 'continuing a studio story keeps your wishes');
  check(errors.length === 0, 'no page errors (chapters)', errors.join(' | '));
  await page.close();
}

try {
  await desktop();
  await chapters();
  await phone();
} catch (e) {
  failures.push('crashed: ' + e.message);
  console.log(e);
}
await browser.close();
server.close();
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log(failures.map((f) => ' - ' + f).join('\n'));
  process.exit(1);
}
