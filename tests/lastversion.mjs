// AFTERZERO: THE LAST VERSION OF EARTH (v2.0), played by a bot in the real game:
//   - the edition's title, chapter list, save slot and its own save namespace
//   - the Prologue from NEW GAME: Mission 1 (Rain City, the Zero Second, quest chain A with
//     Jun Park), Mission 2 (Helix in emergency light, the cells, the officer, the unit that
//     rewinds its damage), Mission 3 (the first switch, quest chain D with Iven Marr, the
//     anchor) and on into Act I
//   - one mission per act to its ending: Mission 5 (three states of one village), Mission 13
//     (three devices in three years, the faction choice), Mission 14 (2196: stability, the
//     snap back to the present), Mission 19 (the place outside time, Echo Step), and the
//     Finale to Ending C, where quest chain A's passengers have cleared the first street
//   - a generated interior (Mission 16) walked room by room with real movement and switches
//   NODE_PATH=$(npm root -g) node tests/lastversion.mjs
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
const url = `http://localhost:${server.address().port}/index.html?edition=lastversion`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

let passed = 0;
const failures = [];
const check = (ok, label, detail = '') => {
  if (ok) { passed++; console.log(`  ok   ${label}`); } else { failures.push(`${label} ${detail}`); console.log(`  FAIL ${label} ${detail}`); }
};
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
// run a function in the page; an exception comes back as 'ERR ...' with its stack
const az = (fn, arg) => page.evaluate(([src, a]) => {
  try { return (0, eval)(`(${src})`)(a); } catch (e) { return `ERR ${e.message} @ ${(e.stack || '').split('\n').slice(1, 4).join(' | ')}`; }
}, [fn.toString(), arg]);
const ok = (v) => !(typeof v === 'string' && v.startsWith('ERR'));
// one real frame: the keys pressed since the last one are handled
const frame = async () => {
  const r = await az(() => { AZ.frame(); return 'ok'; });
  if (!ok(r)) console.log('  (frame)', r);
};

await page.goto(url);
await page.evaluate(() => { try { localStorage.clear(); } catch { /* */ } });
await page.reload();
await page.waitForFunction(() => window.AZ, null, { timeout: 400000 });
await az(() => { AZ.changeSetting('quality', 'low'); AZ.changeSetting('smart', false); });

// --- the bot's hands, in the page ------------------------------------------------------------
await az(() => {
  const g = AZ;
  const B = (window.LVB = {});
  B.said = [];
  const say = g.hud.say.bind(g.hud);
  g.hud.say = (lines, facts, done) => { B.said.push(...lines.filter((l) => !l.when || facts.test(l.when)).map((l) => `${l.who}: ${l.text}`)); return say(lines, facts, done); };
  B.setbacks = 0;
  const setback = g.deckSetback.bind(g);
  g.deckSetback = (k) => { B.setbacks++; B.lastSetback = k; return setback(k); };
  B.step = (sec) => g.simulate(sec);
  B.skip = () => { for (let i = 0; i < 800 && g.hud.talking; i++) { g.hud.subT = 0; g.simulate(0.1); } };
  B.cand = (id) => g.deckWorld.focusCandidates(g).find((x) => x.id === id || x.id === `deck:${id}` || x.id === `dnpc:${id}` || x.id === `ditem:${id}`);
  B.use = (id) => {
    const c = B.cand(id);
    if (!c) return `no ${id}`;
    g.focus = c;
    g.lastUse = null;
    g.use();
    return 'ok';
  };
  B.place = (x, z, y = 0.86, yaw = 0) => { g.player.place([x, y, z, yaw]); g.simulate(0.05); };
  B.z0 = (id) => g.level.rooms[id].spawn[2] + 1.6;
  B.at = (id, x, z, y = 0.86) => B.place(g.level.rooms[id].spawn[0] + x, B.z0(id) + z, y);
  B.choose = (match) => {
    if (g.menu !== 'choice') return `no choice open (${g.menu})`;
    const bs = [...document.querySelectorAll('#choice [data-choice]')];
    const b = bs.find((x) => x.className.includes(match) || x.textContent.includes(match));
    if (!b) return `no option ${match}: ${bs.map((x) => x.textContent).join(' | ')}`;
    b.click();
    return 'ok';
  };
  B.state = (st) => { g.engine.setState(g.room, st, { force: true }); g.player.setGravity(g.engine.gravity(g.room)); g.simulate(0.1); };
  B.goMission = (deck, sector = 0) => { g.campaign.deck = deck; g.campaign.sector = sector; g.campaign.flags = {}; g.campaign.visited = []; g.loadSector(true); g.simulate(0.3); B.skip(); };
  B.exit = () => { const ex = g.level.exit.box; B.place((ex[0] + ex[3]) / 2, (ex[2] + ex[5]) / 2); g.simulate(0.3); B.skip(); };
  B.f = (...ks) => Object.fromEntries(ks.map((k) => [k, g.deckWorld.flags[k] ?? g.facts.get(k)]));
  B.where = () => ({ chapter: g.campaign?.chapter, deck: g.campaign?.deck, sector: g.campaign?.sector, room: g.room, done: !!g.deckWorld.flags.beat_done });
  B.npc = (id) => g.deckWorld.npcs.find((n) => n.n.id === id);
  B.gate = () => g.deckWorld.dynamic.find((d) => /^gate_/.test(d.el.id || ''))?.mesh.visible;
  // walk to a point with real movement (steering only), as the vessel bot does
  B.walkTo = (x, z, secs = 12, jump = false) => {
    g.input.keys.clear();
    g.input.keys.add('KeyW');
    const start = B.setbacks;
    let t = 0;
    while (t < secs) {
      const dx = x - g.player.pos.x, dz = z - g.player.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.4 || B.setbacks > start) break;
      g.player.H.set(dx / d, 0, dz / d);
      if (jump && g.player.grounded) g.input.state.jump = true;
      g.simulate(1 / 30);
      t += 1 / 30;
    }
    g.input.keys.clear();
    g.input.state.jump = false;
    return Math.hypot(x - g.player.pos.x, z - g.player.pos.z);
  };
  return 'ok';
});
// after a mission's last gate: the outro plays, the fade's timer moves on to the next place
const nextPlace = async () => {
  await page.waitForTimeout(1600);
  await az(() => { LVB.step(0.3); LVB.skip(); });
};

// --- the title -----------------------------------------------------------------------------
console.log('The title');
const title = await az(() => ({
  h1: document.querySelector('#title h1').textContent, sub: document.querySelector('#title .sub')?.textContent,
  ver: document.querySelector('#title .ver').textContent, edition: !!AZ.edition, hero: AZ.settings.hero?.id,
}));
check(title.h1 === 'AFTERZERO' && title.sub === 'THE LAST VERSION OF EARTH', 'the title reads AFTERZERO / THE LAST VERSION OF EARTH', JSON.stringify(title));
check(/v2\.0/.test(title.ver) && title.edition && title.hero === 'real_m', 'v2.0, the edition is on, and you are Kai (a realistic man)', JSON.stringify(title));
await page.click('#begin');
await page.waitForFunction(() => AZ.menu === 'chapters', null, { timeout: 30000 });
const cards = await az(() => [...document.querySelectorAll('#chapters .chapcard h3')].map((h) => h.textContent));
check(JSON.stringify(cards) === JSON.stringify(['PROLOGUE', 'ACT I', 'ACT II', 'ACT III', 'ACT IV', 'FINALE', 'CASES']), 'its own chapter list', JSON.stringify(cards));
await page.click('#chapters [data-newch="prologue"]');
await page.waitForFunction(() => AZ.menu === 'saves', null, { timeout: 30000 });
await page.click('#saves [data-slot="0"]');
await page.waitForFunction(() => AZ.started && AZ.room, null, { timeout: 120000 });
await az(() => { AZ.renderer.setAnimationLoop(null); }); // the bot drives time itself from here
const m1 = await az(() => ({ ...LVB.where(), card: document.querySelector('#card small')?.textContent, name: document.querySelector('#card h2, #card .t')?.textContent, state: AZ.engine.state(AZ.room) }));
check(m1.chapter === 'prologue' && m1.deck === 0 && m1.state === 'PRESENT', 'NEW GAME > PROLOGUE > slot 1 starts Mission 1 in the present', JSON.stringify(m1));

// --- Mission 1: THE LAST NORMAL DAY ---------------------------------------------------------
console.log('Mission 1: The Last Normal Day');
const walked = await az(() => { LVB.step(3); LVB.skip(); const z0 = AZ.player.pos.z; LVB.walkTo(0, -14, 4); return [z0, AZ.player.pos.z]; });
check(walked[1] < walked[0] - 6, 'you walk up the avenue', JSON.stringify(walked));
const toy = await az(() => { LVB.place(-6.0, -15.2); const u = LVB.use('toy'); LVB.skip(); return [u, LVB.f('ev_toy')]; });
check(toy[1].ev_toy, 'an optional anomaly: the toy that un-falls goes on the case board', JSON.stringify(toy));
const rook = await az(() => { LVB.place(0, -24); LVB.step(0.3); const s = LVB.said.join('\n'); LVB.skip(); return [AZ.facts.get('rook_message'), s.includes('ROOK: Kai. Where are you.')]; });
check(rook[0] && rook[1], 'Rook calls on the way', JSON.stringify(rook));
// the checkpoint officer, with real input: look at her and press E
await az(() => { LVB.place(2.0, -58.2, 0.86); AZ.player.H.set(0.4, 0, -1).normalize(); AZ.simulate(0.2); AZ.focus = AZ.findFocus(); });
await page.keyboard.press('KeyE');
await frame();
await az(() => LVB.skip());
const guard = await az(() => [AZ.menu, [...document.querySelectorAll('#choice [data-choice] small')].map((s) => s.textContent)]);
check(guard[0] === 'choice' && ['INVESTIGATE', 'CHALLENGE', 'COMFORT', 'WITHDRAW'].every((k) => guard[1].includes(k)), 'talking to the officer offers four intents', JSON.stringify(guard));
await page.click('#choice button.comfort');
check(await az(() => { LVB.skip(); return AZ.facts.get('checkpoint_passed') && AZ.facts.get('trust_guard') === 1; }), 'comfort gets you through and the officer trusts you more');
const zero = await az(() => { LVB.place(0, -80); LVB.step(0.2); LVB.step(5); LVB.skip(); return { ...LVB.f('zero_second', 'after_zero'), said: LVB.said.includes('NONE: All the clocks stop.'), train: AZ.deckWorld.dynamic.some((d) => d.el.mat === 'car' && d.mesh.visible) }; });
check(zero.zero_second && zero.after_zero && zero.said && zero.train, 'the Zero Second: the clocks stop and the 41 comes in', JSON.stringify(zero));
// quest chain A: Last Train Home
const jun = await az(() => { LVB.place(-11, -80); const u = LVB.use('jun'); LVB.skip(); return [u, AZ.menu, LVB.said.slice(-3)]; });
check(jun[1] === 'choice' && jun[2].some((l) => l.includes('The train keeps arriving.')), 'Jun Park: "The train keeps arriving..."', JSON.stringify(jun));
await az(() => { LVB.choose('investigate'); LVB.skip(); });
const relay = await az(() => {
  LVB.place(-13.2, -88);
  const u = LVB.use('relay');
  LVB.skip();
  let t = 0;
  while (AZ.engine.state(AZ.room) !== 'PAST' && t < 50) { AZ.simulate(0.25); t += 0.25; LVB.skip(); }
  const junEcho = !!LVB.npc('jun')?.isEcho;
  return { u, t, past: AZ.engine.state(AZ.room), junEcho, cands: !!LVB.cand('reroute'), quest: AZ.facts.get('quest_jun') };
});
check(relay.quest === 'active' && relay.past === 'PAST' && relay.cands, 'every 41 seconds the station falls back to 8:13, and the relay works there', JSON.stringify(relay));
check(relay.junEcho, 'Jun is not at 8:13 the way he is now: his echo stands in the booth');
const reroute = await az(() => {
  const u = LVB.use('reroute');
  LVB.skip();
  let t = 0;
  while (AZ.engine.state(AZ.room) !== 'PRESENT' && t < 12) { AZ.simulate(0.25); t += 0.25; }
  const v = LVB.use('relay_choice');
  LVB.skip();
  return [u, v, AZ.menu, LVB.f('jun_rerouted')];
});
check(reroute[2] === 'choice' && reroute[3].jun_rerouted, 'rerouted at 8:13; back in the present, the line or the evidence', JSON.stringify(reroute));
await az(() => { LVB.choose('comfort'); LVB.skip(); });
check(await az(() => AZ.facts.get('jun_line') && AZ.facts.get('quest_jun') === 'resolved'), 'quest chain A resolved: the passengers get off the 41');
const rescued = await az(() => {
  LVB.place(6.2, -87.2); LVB.use('trapped_a'); LVB.skip();
  LVB.place(3.9, -73); LVB.use('trapped_b'); LVB.skip();
  LVB.step(1.5); LVB.skip(); LVB.step(0.5); LVB.skip();
  return { ...LVB.f('rescued', 'voice_heard'), said: LVB.said.includes('VOICE: Kai Varen. Do not build the machine.') && LVB.said.includes('ROOK: The event lasted one second.') };
});
check(rescued.rescued && rescued.voice_heard && rescued.said, 'the rescue; "The event lasted one second."; every speaker: "Do not build the machine."', JSON.stringify(rescued));
const mira = await az(() => { LVB.place(0, -96.6); LVB.step(0.3); LVB.skip(); return { ...LVB.f('mira_gone', 'beat_done'), gate: LVB.gate() }; });
check(mira.mira_gone && mira.beat_done && mira.gate === false, 'the woman with Mira\'s face vanishes; the staff gate opens', JSON.stringify(mira));
await az(() => LVB.exit());
await nextPlace();
check((await az(() => LVB.where())).deck === 1, 'through the staff gate: Mission 2');

// --- Mission 2: HELIX GOES DARK ---------------------------------------------------------------
console.log('Mission 2: Helix Goes Dark');
const dark = await az(() => ({ dark: AZ.story.after.dark, room: AZ.room, ambience: AZ.edition.deck.ambience }));
check(dark.dark > 0 && dark.room === 'security', 'Helix under emergency light', JSON.stringify(dark));
const cells = await az(() => {
  const out = [];
  LVB.at('security', 0, -12); LVB.step(0.3); LVB.skip();
  LVB.at('corridor', 6.3, -12); out.push(LVB.use('cell_1')); LVB.at('power', -3, -14.5); out.push(LVB.use('socket_0'));
  LVB.at('power', -5.4, -9.5, 3.5); LVB.step(0.3); out.push(LVB.use('cell_2')); LVB.at('power', 0, -14.5); out.push(LVB.use('socket_1'));
  LVB.at('power', 4.0, -5.6); out.push(LVB.use('iven')); LVB.skip(); out.push(LVB.choose('comfort')); LVB.skip();
  LVB.at('power', 5.0, -5); out.push(LVB.use('shift_notes')); LVB.skip();
  LVB.at('power', 4.6, -10.2); LVB.step(0.2); out.push(LVB.use('cell_3')); LVB.at('power', 3, -14.5); out.push(LVB.use('socket_2')); LVB.skip();
  return { out, ...LVB.f('cells_in', 'lift_powered', 'quest_iven', 'ev_rook_log') };
});
check(cells.lift_powered && cells.cells_in === 3, 'three power cells restore the lift (one from Iven Marr\'s locker)', JSON.stringify(cells));
check(cells.quest_iven === 'active' && cells.ev_rook_log, 'quest chain D begins: Iven\'s shift notes say Rook moved the test');
const officer = await az(() => { LVB.at('records', 0, -10.8); LVB.use('whose_code'); LVB.skip(); const c = LVB.choose('Dale'); LVB.skip(); return [c, LVB.f('officer_trusted')]; });
check(officer[1].officer_trusted, 'the recordings name the officer to trust: Dale', JSON.stringify(officer));
const unit = await az(() => {
  LVB.at('conduit', -6.6, -19.2); LVB.use('breaker'); LVB.skip();
  const s = AZ.deckWorld.sentinels.find((x) => x.def.unit);
  const ox = AZ.level.rooms.conduit.spawn[0], z0 = LVB.z0('conduit');
  s.pos.set(ox + 6.5, 0, z0 - 4); s.dir.set(0, 0, -1); s.mode = 'patrol'; s.suspicion = 0;
  LVB.place(ox + 6.5, z0 - 11.5);
  for (let i = 0; i < 40 && s.mode !== 'chase'; i++) AZ.simulate(0.05);
  const saw = s.mode === 'chase';
  LVB.place(ox + 6.5, z0 - 21);
  for (let i = 0; i < 120 && !s.dead; i++) AZ.simulate(0.05);
  LVB.skip();
  return { saw, dead: !!s.dead, ...LVB.f('conduit_live', 'unit_down') };
});
check(unit.saw && unit.dead && unit.unit_down, 'the unit that rewinds its damage, lured through the live conduit, stays down', JSON.stringify(unit));
const drawing = await az(() => { LVB.at('archive', 0, -12); LVB.use('drawing'); LVB.skip(); return [LVB.said.includes('KAI: This drawing is twenty-three years old.'), LVB.f('drawing_seen')]; });
check(drawing[0] && drawing[1].drawing_seen, '"This drawing is twenty-three years old." / "I was twelve."');
const chrono = await az(() => { LVB.at('chamber', 0, -7); LVB.use('chronolith'); LVB.skip(); return LVB.f('chronolith_seen', 'beat_done'); });
check(chrono.chronolith_seen && chrono.beat_done, 'the Chronolith chamber');
await az(() => LVB.exit());
await nextPlace();
check((await az(() => LVB.where())).deck === 2, 'Mission 3');

// --- Mission 3: THE FIRST SWITCH ----------------------------------------------------------------
console.log('Mission 3: The First Switch');
const touch = await az(() => { LVB.at('chamber', 0, -8); LVB.use('touch'); LVB.skip(); return { ...LVB.f('has_chronolith'), pips: [...document.querySelectorAll('#state .pip')].map((p) => p.textContent), said: LVB.said.includes('KAI: Which one is real?') }; });
check(touch.has_chronolith && touch.said, 'touching the ring: "Which one is real?" / "All of them."', JSON.stringify(touch));
await frame();
const pips = await az(() => [...document.querySelectorAll('#state .pip')].map((p) => p.textContent));
check(JSON.stringify(pips) === JSON.stringify(['12049', '22026', '32196']), 'the HUD names this place\'s three years', JSON.stringify(pips));
// switch with the number keys
await az(() => LVB.at('cable', -4, -7.6));
await page.keyboard.press('Digit2');
await frame();
const cable = await az(() => {
  const st = AZ.engine.state(AZ.room);
  const a = LVB.use('cable');
  LVB.at('cable', 4.4, -14); const b = LVB.use('cable_socket'); LVB.skip();
  return [st, a, b, LVB.f('cable_connected')];
});
check(cable[0] === 'PAST' && cable[3].cable_connected, 'key 2: 2026, where the cable is; connected there', JSON.stringify(cable));
await page.keyboard.press('Digit1');
await frame();
check(await az(() => { LVB.at('cable', 0, -14.6); LVB.step(0.2); LVB.use('power'); LVB.skip(); return AZ.engine.state(AZ.room) === 'PRESENT' && AZ.facts.get('power_on'); }), 'key 1: 2049, and the power a 2026 cable carries comes on');
const cross = await az(() => {
  LVB.at('collapse', 0, -4.5);
  AZ.edition.shift('FUTURE');
  const before = AZ.edition.stability;
  const left = LVB.walkTo(AZ.level.rooms.collapse.spawn[0], LVB.z0('collapse') - 18.5, 10);
  const r = { left, y: AZ.player.pos.y, crossed: AZ.facts.get('crossed'), drained: AZ.edition.stability < before, setbacks: LVB.setbacks };
  AZ.edition.shift('PRESENT');
  LVB.skip();
  return r;
});
check(cross.crossed && cross.left < 1 && cross.y > 0.5 && cross.drained, 'in 2196 you walk across the collapsed hall on a parked lift, and stability drains', JSON.stringify(cross));
// quest chain D: the maintenance route
const route = await az(() => {
  const r = {};
  LVB.at('route', -3.2, -2.6); LVB.use('iven3'); LVB.skip();
  r.dialogue = AZ.menu === 'choice' ? 'choice' : 'lines';
  if (AZ.menu === 'choice') { LVB.choose('comfort'); LVB.skip(); }
  r.lured = AZ.deckWorld.sentinels.some((s) => s.def.room === 'route' && s.lure);
  AZ.edition.shift('PAST');
  AZ.simulate(0.1);
  r.ivenEcho = !!LVB.npc('iven3')?.isEcho;
  r.drone = AZ.deckWorld.sentinels.filter((s) => s.def.room === 'route').map((s) => s.model.visible);
  LVB.at('route', -6.2, -11); r.panel = LVB.use('service_panel'); LVB.skip();
  r.open = AZ.facts.get('maint_open');
  LVB.at('route', 5.4, -10.5); AZ.simulate(0.1);
  AZ.edition.shift('PRESENT'); AZ.simulate(0.1);
  r.reset = AZ.facts.get('maint_open') === false;
  LVB.at('route', 6.6, -13.8); r.term = LVB.use('iven_terminal'); LVB.skip();
  r.choice = AZ.menu;
  LVB.choose('comfort'); LVB.skip();
  r.saved = AZ.facts.get('iven_team_saved'); r.quest = AZ.facts.get('quest_iven');
  LVB.at('route', 4.6, -7.2); LVB.use('release'); LVB.skip();
  r.out = AZ.facts.get('maint_open');
  return r;
});
check(route.lured, 'Iven keeps the 2049 drone busy', JSON.stringify(route));
check(route.ivenEcho && route.drone.every((v) => v === false), 'in 2026 Iven is an echo and the drone has not been installed yet', JSON.stringify(route));
check(route.open && route.reset, 'the 2026 service panel opens the route; the lock resets the moment the year changes', JSON.stringify(route));
check(route.choice === 'choice' && route.saved && route.quest === 'resolved' && route.out, 'quest chain D resolved: Iven\'s team gets out', JSON.stringify(route));
await az(() => LVB.at('control', 4, -2.6));
const took = await az(() => { AZ.edition.shift('PAST'); AZ.simulate(0.1); return [LVB.use('keycard'), AZ.held, AZ.menu, AZ.paused]; });
check(took[1] === 'keycard', 'in 2026, the keycard on the desk', JSON.stringify(took));
await page.keyboard.press('KeyC');
await frame();
const anchored = await az(() => { AZ.edition.shift('PRESENT'); AZ.simulate(0.4); LVB.skip(); return [AZ.held, AZ.facts.get('anchored_once')]; });
check(anchored[0] === 'keycard' && anchored[1], 'key C anchors the 2026 keycard; it survives the switch to 2049', JSON.stringify(anchored));
const fracture = await az(() => {
  LVB.at('control', 2.2, -8.2); LVB.use('lock_control'); LVB.skip(); AZ.simulate(0.3);
  LVB.at('control', 0, -12.6); LVB.use('panel'); LVB.skip(); AZ.simulate(1.5);
  return LVB.f('open_control', 'fractured', 'beat_done');
});
check(fracture.fractured && fracture.beat_done, 'the control panel: the facility fractures', JSON.stringify(fracture));
await az(() => LVB.exit());
await nextPlace();
const act1 = await az(() => ({ ...LVB.where(), name: AZ.edition.deck.name }));
check(act1.chapter === 'act1' && act1.deck === 0 && act1.name === 'THE MAN FROM THE LAST DAY', 'the Prologue ends; Act I begins with Mission 4', JSON.stringify(act1));
check(await az(() => AZ.facts.get('m01_done') && AZ.facts.get('m02_done') && AZ.facts.get('m03_done')), 'the three prologue missions are recorded as done');

// --- Act I: Mission 5, THE VILLAGE THAT NEVER EXISTED -------------------------------------------------------
console.log('Act I, Mission 5: The Village That Never Existed');
const scene = async (label, sid, wrong, right, extra = () => true) => {
  const r = await az(([sid, wrong, right]) => {
    const c = LVB.cand(sid);
    if (!c) return `no scene ${sid}`;
    LVB.place(c.pos[0], c.pos[2] + 1.6);
    const out = {};
    if (wrong) { AZ.edition.shift(wrong); LVB.use(sid); LVB.skip(); out.refused = !AZ.deckWorld.flags.beat_done; }
    AZ.edition.shift(right); AZ.simulate(0.1);
    LVB.use(sid); LVB.skip();
    out.done = AZ.deckWorld.flags.beat_done;
    out.gate = LVB.gate();
    AZ.edition.shift('PRESENT'); AZ.simulate(0.1);
    return out;
  }, [sid, wrong, right]);
  check(ok(r) && r.done && r.gate === false && (!wrong || r.refused) && extra(r), label, JSON.stringify(r));
};
await az(() => LVB.goMission(1));
check((await az(() => AZ.edition.deck.name)) === 'THE VILLAGE THAT NEVER EXISTED', 'Mission 5');
const niko = await az(() => { AZ.edition.shift('FUTURE'); AZ.simulate(0.1); const n = LVB.npc('npc_' + AZ.room); const e = !!n?.isEcho; AZ.edition.shift('PRESENT'); AZ.simulate(0.1); return [e, !!LVB.npc('npc_' + AZ.room)?.isEcho]; });
check(niko[0] && !niko[1], 'Niko is himself in the present, an echo in the flooded future', JSON.stringify(niko));
await scene('the river is diverted in the earliest state (refused in the present)', 'scene_' + (await az(() => AZ.room)), 'PRESENT', 'PAST');
// the river cuts the village: walk the old bridge in the past
const canal = await az(() => {
  const r = {};
  AZ.edition.shift('PRESENT'); LVB.place(0, -46); const s0 = LVB.setbacks;
  LVB.walkTo(0, -62, 6); r.presentFell = LVB.setbacks > s0 || AZ.player.pos.z > -58;
  LVB.place(0, -46); AZ.edition.shift('PAST'); const s1 = LVB.setbacks;
  r.left = LVB.walkTo(0, -62, 8); r.pastCrossed = LVB.setbacks === s1 && AZ.player.pos.z < -58;
  AZ.edition.shift('PRESENT');
  return r;
});
check(canal.presentFell && canal.pastCrossed, 'the water cuts the village in two; in the past the bridge still stands', JSON.stringify(canal));
await az(() => LVB.exit());
await az(() => { AZ.simulate(0.3); LVB.skip(); });
await page.waitForTimeout(1300);
await az(() => { AZ.simulate(0.3); LVB.skip(); });
const s1 = await az(() => LVB.where());
check(s1.deck === 1 && s1.sector === 1, 'the gate leads on to the abandoned village', JSON.stringify(s1));
await scene('the retaining wall is braced in the middle state, after the river moved', 'scene_' + s1.room, 'FUTURE', 'PRESENT');
await az(() => LVB.exit());
await page.waitForTimeout(1300);
await az(() => { AZ.simulate(0.3); LVB.skip(); });
const s2 = await az(() => LVB.where());
await scene('the pressure gate is released in the latest state: the buried machine', 'scene_' + s2.room, 'PAST', 'FUTURE', () => true);
check(await az(() => LVB.said.some((l) => l.includes('Helix did not invent the machine. It found it.'))), 'Niko: Helix did not invent the machine; it found it');
await az(() => LVB.exit());
await nextPlace();
check(await az(() => AZ.facts.get('m05_done') && AZ.edition.deck.name === 'THE CLOCKMAKER\'S HOUSE'), 'Mission 5 ends; Mission 6 begins');

// --- Act II: Mission 13, THE NINE-MINUTE WAR --------------------------------------------------------------
console.log('Act II, Mission 13: The Nine-Minute War');
await az(() => { AZ.edition.start('act2'); AZ.simulate(0.2); LVB.skip(); LVB.goMission(4); });
check((await az(() => AZ.edition.deck.name)) === 'THE NINE-MINUTE WAR', 'Mission 13');
const roof = await az(() => {
  const c = AZ.deckWorld.focusCandidates(AZ).find((x) => x.it?.kind === 'terminal');
  LVB.place(c.pos[0], c.pos[2] + 1.4, c.pos[1] - 0.35);
  AZ.useDeck(c); LVB.skip();
  return { done: AZ.deckWorld.flags.beat_done, gate: LVB.gate() };
});
check(roof.done && roof.gate === false, 'the field order on the roof: both sides answer each other\'s fire', JSON.stringify(roof));
await az(() => LVB.exit());
await page.waitForTimeout(1300);
await az(() => { AZ.simulate(0.3); LVB.skip(); });
const devices = await az(() => {
  const out = [];
  for (const [i, st, wrong] of [[0, 'PAST', 'PRESENT'], [1, 'PRESENT', 'FUTURE'], [2, 'FUTURE', 'PAST']]) {
    const c = LVB.cand(`task_${i}`);
    if (!c) { out.push(`no task ${i}`); continue; }
    LVB.place(c.pos[0], c.pos[2] + 1.5);
    AZ.edition.shift(wrong); AZ.simulate(0.1); LVB.use(`task_${i}`); LVB.skip();
    const refused = !AZ.deckWorld.flags[`done_task_${i}`];
    AZ.edition.shift(st); AZ.simulate(0.1); LVB.use(`task_${i}`); LVB.skip();
    out.push({ i, refused, done: !!AZ.deckWorld.flags[`done_task_${i}`] });
  }
  AZ.edition.shift('PRESENT');
  return { out, done: AZ.deckWorld.flags.beat_done, gate: LVB.gate() };
});
check(devices.done && devices.out.every((d) => d.refused && d.done), 'three devices disabled, each only in its own year (2026, 2049, 2196)', JSON.stringify(devices));
await az(() => LVB.exit());
await page.waitForTimeout(1300);
await az(() => { AZ.simulate(0.3); LVB.skip(); });
const stab = await az(() => { const c = LVB.cand('choice_' + AZ.room); LVB.place(c.pos[0], c.pos[2] + 1.5); LVB.use('choice_' + AZ.room); LVB.skip(); return [AZ.menu, [...document.querySelectorAll('#choice button')].map((b) => b.textContent)]; });
check(stab[0] === 'choice' && stab[1].length === 2, 'the stabilizer: destroy it, or redirect it to free the trapped people', JSON.stringify(stab));
await az(() => { LVB.choose('challenge'); LVB.skip(); });
check(await az(() => AZ.facts.get('faction') === 'unwritten' && AZ.facts.get('stabilizer_destroyed') && AZ.deckWorld.flags.beat_done), 'the faction choice is recorded (Unwritten), and the campaign goes on');
await az(() => LVB.exit());
await nextPlace();
const act3 = await az(() => ({ ...LVB.where(), name: AZ.edition.deck.name }));
check(act3.chapter === 'act3' && act3.name === 'WELCOME TO 2196', 'Act II ends; Act III begins with Mission 14', JSON.stringify(act3));

// --- Act III: Mission 14, WELCOME TO 2196 ---------------------------------------------------------------
console.log('Act III, Mission 14: Welcome to 2196');
const drain = await az(() => {
  AZ.edition.shift('FUTURE');
  const a = AZ.edition.stability;
  AZ.simulate(4);
  const b = AZ.edition.stability;
  AZ.simulate(40);
  return { a, b, after: AZ.edition.stability, catching: !!AZ.catching, cls: document.querySelector('#state').className };
});
check(drain.b < drain.a, 'out of the present in an unstable place, the Chronolith\'s stability drains', JSON.stringify(drain));
await page.waitForTimeout(1200);
const snap = await az(() => { AZ.simulate(0.2); const s = LVB.said.slice(-3).join(' '); return { state: AZ.engine.state(AZ.room), stability: AZ.edition.stability, said: s.includes('The Chronolith let go of me') }; });
check(snap.state === 'PRESENT' && snap.said, 'at zero it snaps you back to the present at the last anchor', JSON.stringify(snap));
const recorder = await az(() => { const c = AZ.deckWorld.focusCandidates(AZ).find((x) => x.it?.kind === 'terminal'); LVB.place(c.pos[0], c.pos[2] + 1.4, c.pos[1] - 0.35); AZ.useDeck(c); LVB.skip(); return AZ.deckWorld.flags.beat_done; });
check(recorder, 'the beacon\'s part list, on a roof of the overgrown towers');
await az(() => LVB.exit());
await page.waitForTimeout(1300);
await az(() => { AZ.simulate(0.3); LVB.skip(); });
const residue = await az(() => {
  const c = AZ.deckWorld.focusCandidates(AZ).find((x) => x.it?.kind === 'plaque');
  LVB.place(c.pos[0], c.pos[2] + 1.5);
  AZ.edition.shift('PRESENT'); AZ.useDeck(c); LVB.skip();
  const before = AZ.deckWorld.flags.beat_done;
  AZ.edition.shift('PAST'); AZ.simulate(0.1); AZ.useDeck(c); LVB.skip();
  AZ.edition.shift('PRESENT');
  return { before: !!before, after: AZ.deckWorld.flags.beat_done, said: LVB.said.some((l) => l.includes('SAFE PATH WHEN THE WATER IS LOW')) };
});
check(!residue.before && residue.after && residue.said, 'the warning reads DO NOT CROSS; its residue in the past: a safe path, signed Sera', JSON.stringify(residue));
await az(() => LVB.exit());
await page.waitForTimeout(1300);
await az(() => { AZ.simulate(0.3); LVB.skip(); });
const sera = await az(() => { const n = LVB.npc('npc_' + AZ.room); LVB.place(n.model.position.x, n.model.position.z + 2); LVB.use('npc_' + AZ.room); LVB.skip(); const c = LVB.choose('investigate'); LVB.skip(); return [c, AZ.facts.get('ev_memorial'), AZ.deckWorld.flags.beat_done, LVB.said.some((l) => l.includes('We teach children your name'))]; });
check(sera[1] && sera[2] && sera[3], 'Sera at the memorial: "We teach children your name before they learn the names of the dead."', JSON.stringify(sera));
await az(() => LVB.exit());
await nextPlace();
check(await az(() => AZ.edition.deck.name === 'THE CITY THAT FORGOT TOMORROW'), 'Mission 14 ends; Mission 15 begins');

// --- a generated interior, walked: Mission 16, THE MUSEUM OF FAILED WORLDS -------------------------------------
console.log('Act III, Mission 16: a generated interior, walked room by room');
const walkRooms = await az(() => {
  const g = AZ;
  const out = [];
  for (let s = 0; s < g.story.decks[2].sectors; s++) {
    LVB.goMission(2, s);
    g.transitioning = true; // keep the bot inside this sector
    g.deckWorld.flags.beat_done = true; // the story room is the scene's business; here, the puzzles
    g.deckWorld.refresh();
    for (const rid of g.level.order) {
      const room = g.level.rooms[rid];
      if (!room.route?.length) continue;
      g.engine.setState(rid, 'PRESENT', { force: true });
      g.held = null;
      g.enterRoom(rid, true);
      g.simulate(0.3);
      const start = LVB.setbacks;
      let fail = null;
      for (const w of room.route) {
        if (w.state) { g.engine.setState(rid, w.state, { force: true }); g.player.setGravity(g.engine.gravity(rid)); }
        if (w.wait) g.simulate(w.wait);
        const left = LVB.walkTo(w.pos[0], w.pos[2], 20, !!w.jump);
        g.simulate(w.jump ? 1 : 0.15);
        if (LVB.setbacks > start) { fail = `setback (${LVB.lastSetback})`; break; }
        if (left > 0.6) { fail = `stuck ${left.toFixed(2)} m short (${w.act || (w.exit ? 'exit' : 'walk')}) at ${g.player.pos.toArray().map((v) => v.toFixed(1))}, ${g.engine.state(rid)}`; break; }
        if (w.act === 'take') {
          g.useDeck({ id: `ditem:${w.item}` });
          if (g.level.items.find((i) => i.id === w.item)?.echo) g.edition.anchor(); // what comes out of the past has to be anchored
        }
        if (w.act === 'use') {
          const it = g.level.interactables.find((i) => i.id === w.target);
          g.useDeck({ id: `deck:${it.id}`, it });
          if (!g.deckWorld.flags[`open_${rid}`]) { fail = `${w.target} did not open (held ${g.held})`; break; }
        }
      }
      LVB.skip();
      out.push({ s, rid, challenges: room.challenges.map((c) => c.key).join('+'), fail });
    }
  }
  g.transitioning = false;
  return out;
});
const walkedRooms = Array.isArray(walkRooms) ? walkRooms : [];
check(walkedRooms.length >= 6 && walkedRooms.every((r) => !r.fail), `the Museum's ${walkedRooms.length} generated rooms are walked through with switches and the anchor`, JSON.stringify(walkedRooms.filter((r) => r.fail).length ? walkedRooms.filter((r) => r.fail) : walkRooms));

// --- Act IV: Mission 19, THE PLACE OUTSIDE TIME --------------------------------------------------------------
console.log('Act IV, Mission 19: The Place Outside Time');
await az(() => { AZ.edition.start('act4'); AZ.simulate(0.2); LVB.skip(); });
check((await az(() => AZ.edition.deck.name)) === 'THE PLACE OUTSIDE TIME', 'Mission 19');
const echoStep = await az(() => {
  LVB.place(0, -10); AZ.edition.stability = 1;
  const p0 = AZ.player.pos.clone();
  AZ.player.H.set(0, 0, -1);
  AZ.edition.echoStep();
  return { moved: +(p0.z - AZ.player.pos.z).toFixed(2), decoy: !!AZ.deckWorld.decoy, ghost: !!AZ.edition.ghost?.visible, stability: AZ.edition.stability, cd: AZ.edition.echoCd };
});
check(echoStep.decoy && echoStep.ghost && echoStep.moved > 1 && echoStep.stability < 1 && echoStep.cd > 0, 'Echo Step: an afterimage the watchers follow, a step forward, a cost in stability', JSON.stringify(echoStep));
const outside = await az(() => {
  const r = {};
  let c = AZ.deckWorld.focusCandidates(AZ).find((x) => x.it?.kind === 'terminal');
  LVB.place(c.pos[0], c.pos[2] + 1.4, c.pos[1] - 0.35); AZ.useDeck(c); LVB.skip();
  r.s0 = AZ.deckWorld.flags.beat_done;
  return r;
});
check(outside.s0, 'the first symbol: the clockmaker\'s mark', JSON.stringify(outside));
await az(() => LVB.exit());
await page.waitForTimeout(1300);
await az(() => { AZ.simulate(0.3); LVB.skip(); });
const bridge = await az(() => { const c = AZ.deckWorld.focusCandidates(AZ).find((x) => x.it?.kind === 'plaque'); LVB.place(c.pos[0], c.pos[2] + 1.5); AZ.edition.shift('PAST'); AZ.simulate(0.1); AZ.useDeck(c); LVB.skip(); AZ.edition.shift('PRESENT'); return AZ.deckWorld.flags.beat_done; });
check(bridge, 'THERE IS NO BRIDGE / THERE IS A BRIDGE. YOU ARE STANDING ON IT');
await az(() => LVB.exit());
await page.waitForTimeout(1300);
await az(() => { AZ.simulate(0.3); LVB.skip(); });
const forgive = await az(() => { const n = LVB.npc('npc_' + AZ.room); LVB.place(n.model.position.x, n.model.position.z + 2); LVB.use('npc_' + AZ.room); LVB.skip(); return [AZ.deckWorld.flags.beat_done, LVB.said.some((l) => l.includes('the version of me that would forgive you'))]; });
check(forgive[0] && forgive[1], 'Mira: "You\'ve been trying to reach the version of me that would forgive you."', JSON.stringify(forgive));
await az(() => LVB.exit());
await nextPlace();
check(await az(() => AZ.facts.get('m19_done') && AZ.edition.deck.name === 'MIRA\'S MEMORY'), 'Mission 19 ends; Mission 20 begins');

// --- the Finale: AFTERZERO ------------------------------------------------------------------------------------
console.log('The Finale: Afterzero');
await az(() => { AZ.edition.start('finale'); AZ.simulate(0.2); LVB.skip(); });
const street = await az(() => ({ name: AZ.edition.deck.name, drones: AZ.deckWorld.sentinels.length, jun: !!LVB.npc('jun_safe') }));
check(street.name === 'AFTERZERO' && street.drones === 0 && street.jun, 'the passengers Kai got off the 41 have cleared the opening streets: no watchers, Jun waves you through', JSON.stringify(street));
for (let s = 0; s < 2; s++) {
  const r = await az(() => { const c = AZ.deckWorld.focusCandidates(AZ).find((x) => x.it?.kind === 'terminal'); LVB.place(c.pos[0], c.pos[2] + 1.4, c.pos[1] - 0.35); AZ.useDeck(c); LVB.skip(); return AZ.deckWorld.flags.beat_done; });
  check(r, s === 0 ? 'Rook\'s last transmission' : 'the Witness holds the route');
  await az(() => LVB.exit());
  await page.waitForTimeout(1300);
  await az(() => { AZ.simulate(0.3); LVB.skip(); });
}
const finale = await az(() => { const c = LVB.cand('choice_' + AZ.room); LVB.place(c.pos[0], c.pos[2] + 1.5); LVB.use('choice_' + AZ.room); LVB.skip(); return [AZ.menu, [...document.querySelectorAll('#choice button')].map((b) => b.className)]; });
check(finale[0] === 'choice' && finale[1].length === 3, 'at the original Chronolith: what to preserve, what to release (three endings)', JSON.stringify(finale));
await az(() => { LVB.choose('comfort'); LVB.skip(); AZ.simulate(1.5); LVB.skip(); AZ.simulate(0.5); });
const ending = await az(() => ({ menu: AZ.menu, text: document.querySelector('#ending .body')?.textContent || '', ending: AZ.facts.get('ending') }));
check(ending.menu === 'ending' && ending.ending === 'C' && /ENDING C/.test(ending.text) && /AFTERZERO/.test(ending.text), 'Ending C, Afterzero', JSON.stringify({ ...ending, text: ending.text.slice(0, 120) }));
check(/a second that belongs to nobody/.test(ending.text) && /Version one hundred and eighteen/.test(ending.text), '"I finally found a second that belongs to nobody." A voice: "Version one hundred and eighteen."');

// --- saves --------------------------------------------------------------------------------------------------------
const keys = await az(() => { AZ.saveTo(0); return Object.keys(localStorage); });
check(keys.includes('afterzero.lv.slot.0') && !keys.includes('afterzero.slot.0') && !keys.includes('afterzero.save.v1'), 'this edition saves under its own namespace (afterzero.lv.*)', JSON.stringify(keys));
check(errors.length === 0, 'no page errors', [...new Set(errors)].join(' | '));
await browser.close();
server.close();
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log(failures.map((f) => ' - ' + f).join('\n'));
  process.exit(1);
}
