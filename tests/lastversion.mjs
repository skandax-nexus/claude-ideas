// AFTERZERO: THE LAST VERSION OF EARTH (v2.0), played by a bot in the real game:
//   - the edition's title, chapter list, save slot and its own save namespace
//   - the Prologue from NEW GAME: Mission 1 (Rain City, the Zero Second, quest chain A with
//     Jun Park), Mission 2 (Helix in emergency light, the cells, the officer, the unit that
//     rewinds its damage), Mission 3 (the first switch, quest chain D with Iven Marr, the
//     anchor) and on into Act I
//   - Mission 11, where REVERSE is taught: R does nothing before it, the unlock in the records,
//     R and the touch ⟲ button start and release a hold, a year switch releases it, the refusal,
//     the charred file readable only while held, a jammed bolt, a settled bolt through a save
//     and a load, the lock that opens Ward 32 (LV_SHOT=<png> saves a screenshot of a hold)
//   - one mission per act to its ending: Mission 5 (three states of one village), Mission 13
//     (three devices in three years, the faction choice), Mission 14 (2196: stability, the
//     snap back to the present), Mission 19 (the place outside time, Echo Step), and the
//     Finale to Ending C, where quest chain A's passengers have cleared the first street
//   - casting (OVERHAUL.md §6): Mission 1's checkpoint officer is a security officer (rb_security_f), the toy
//     child and the Child have children's bodies, Mission 10's watchers are Continuum troopers whose cones see,
//     crowds walk Missions 1, 4 and 14
//   - real walks through the open places: Mission 13's quay to the container canyons, Mission 14's viaduct,
//     the Museum's spiral (Mission 16) from the rim to the Comparison Hall, Mission 19's bridge that is only a
//     reflection (it holds in 2026) and its wrapping edge, and the Finale's road over the settlement's stream
//   - voice and score (OVERHAUL.md §8.11), with Chromium's autoplay policy on (a user gesture is needed for
//     sound): the AudioContext runs after the first tap; every line said plans from the packs and nothing
//     misses (__voiceMiss); speechSynthesis is never asked to speak; the cues card, chapter, zero and ending:C
//     play; the Zero Second ducks the music while the voices stay at full level
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
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=user-gesture-required'] });

let passed = 0;
const failures = [];
const check = (ok, label, detail = '') => {
  if (ok) { passed++; console.log(`  ok   ${label}`); } else { failures.push(`${label} ${detail}`); console.log(`  FAIL ${label} ${detail}`); }
};
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
// only the local server: web fonts and anything remote otherwise hang loads and screenshots
await page.route('**/*', (route) => {
  const u = new URL(route.request().url());
  return u.hostname === 'localhost' || u.hostname === '127.0.0.1' ? route.continue() : route.abort();
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
// run a function in the page; an exception comes back as 'ERR ...' with its stack
const az = (fn, arg) => page.evaluate(([src, a]) => {
  try { return (0, eval)(`(${src})`)(a); } catch (e) { return `ERR ${e.message} @ ${(e.stack || '').split('\n').slice(1, 4).join(' | ')}`; }
}, [fn.toString(), arg]);
const ok = (v) => !(typeof v === 'string' && v.startsWith('ERR'));
// a key, as a player presses it (headless, losing the pointer lock opens the pause menu: close it first)
const press = async (key) => {
  await az(() => { if (AZ.menu === 'pause') AZ.closeMenu(); });
  await page.keyboard.press(key);
  await frame();
};
// one real frame: the keys pressed since the last one are handled
const frame = async () => {
  const r = await az(() => { AZ.frame(); return 'ok'; });
  if (!ok(r)) console.log('  (frame)', r);
};

// LV_ONLY=places: only the survey of the open places (at the end of this file)
if (process.env.LV_ONLY === 'places') {
  await page.close();
  await survey();
  check(errors.length === 0, 'no page errors', [...new Set(errors)].join(' | '));
  await browser.close();
  server.close();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) console.log(failures.map((f) => ' - ' + f).join('\n'));
  process.exit(failures.length ? 1 : 0);
}

// the device's speech is never asked for anything (the edition speaks from its packs)
await page.addInitScript(() => {
  window.__synthCalls = 0;
  try {
    const s = window.speechSynthesis;
    if (s) for (const k of ['speak', 'getVoices', 'cancel']) { const f = s[k].bind(s); s[k] = (...a) => { window.__synthCalls++; return f(...a); }; }
  } catch { /* no speech here */ }
});
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
  B.planMiss = [];
  B.pending = 0;
  g.hud.say = (lines, facts, done) => {
    const ls = lines.filter((l) => !l.when || facts.test(l.when));
    B.said.push(...ls.map((l) => `${l.who}: ${l.text}`));
    // every line said has a plan in the packs (while a chapter's pack is still coming, it is counted, not judged)
    for (const l of ls) {
      if (g.voice.loading < 1) B.pending++;
      else if (!g.voice.plan(l.text, l.who, l.voice || {})) B.planMiss.push(`${l.who}${l.voice?.id ? `/${l.voice.id}` : ''}: ${l.text}`);
    }
    return say(lines, facts, done);
  };
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
  // a hand-built room's own frame (Build.js): x across, z from its entry wall, turned by its heading
  B.w = (id, x, z) => {
    const [sx, , sz, th] = g.level.rooms[id].spawn;
    const c = Math.cos(th), s = Math.sin(th), X = sx + 1.6 * s, Z = sz + 1.6 * c;
    return [X + x * c + z * s, Z - x * s + z * c];
  };
  B.z0 = (id) => g.level.rooms[id].spawn[2] + 1.6;
  B.at = (id, x, z, y = 0.86) => { const [wx, wz] = B.w(id, x, z); B.place(wx, wz, g.level.rooms[id].spawn[1] - 0.86 + y); };
  // stand by something to use (its focus point), dz metres off it
  B.go = (id, dx = 0, dz = 1.2) => { const c = B.cand(id); if (!c) return `no ${id}`; B.place(c.pos[0] + dx, c.pos[2] + dz, c.pos[1] + 0.2); g.simulate(0.3); return 'ok'; };
  B.lm = (name) => g.level.landmarks?.[name];
  B.choose = (match) => {
    if (g.menu !== 'choice') return `no choice open (${g.menu})`;
    const bs = [...document.querySelectorAll('#choice [data-choice]')];
    const b = bs.find((x) => x.className.includes(match) || x.textContent.includes(match));
    if (!b) return `no option ${match}: ${bs.map((x) => x.textContent).join(' | ')}`;
    b.click();
    return 'ok';
  };
  B.state = (st) => { g.engine.setState(g.room, st, { force: true }); g.simulate(0.1); };
  // turn the view (and so the crosshair) onto a point, from where Kai stands; returns what REVERSE would aim at
  B.aim = (p) => {
    const pl = g.player, cam = g.camera;
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    for (let i = 0; i < 24; i++) {
      pl.updateCamera(1);
      cam.updateMatrixWorld();
      const f = cam.getWorldDirection(cam.position.clone());
      const d = [p[0] - cam.position.x, p[1] - cam.position.y, p[2] - cam.position.z];
      const l = Math.hypot(...d);
      pl.look(-wrap(Math.atan2(d[0], d[2]) - Math.atan2(f.x, f.z)), -(Math.asin(d[1] / l) - Math.asin(f.y)));
    }
    pl.updateCamera(1);
    cam.updateMatrixWorld();
    const t = g.edition.inv.findTarget();
    return t ? `${t.p.rec.id}${t.part >= 0 ? ':' + t.p.rec.parts[t.part].name : ''}` : null;
  };
  B.proc = (id) => g.edition.inv.procs.find((p) => p.rec.id === id);
  B.rev = () => { if (g.menu === 'pause') g.closeMenu(); g.edition.inv.press(); }; // REVERSE, as R does
  B.inv = () => { const v = g.edition.inv; return { active: v.active ? v.active.p.rec.id : null, charge: +v.state.charge.toFixed(2), cap: v.cap, why: v.lastRelease || null }; };
  B.goMission = (deck, sector = 0) => { g.campaign.deck = deck; g.campaign.sector = sector; g.campaign.flags = {}; g.campaign.visited = []; g.loadSector(true); g.simulate(0.3); B.skip(); };
  B.exit = () => { const ex = g.level.exit.box; B.place((ex[0] + ex[3]) / 2, (ex[2] + ex[5]) / 2, ex[1] + 1 + 0.86); g.simulate(0.3); B.skip(); };
  // walk a list of [x, z] waypoints with real movement, the watchers held still (they are another check's business)
  B.route = (pts, secs = 20) => {
    const held = g.deckWorld.sentinels.splice(0);
    const start = B.setbacks;
    let left = 0, n = 0;
    for (const [x, z] of pts) { left = B.walkTo(x, z, secs); if (left > 0.6 || B.setbacks > start) break; n++; }
    g.deckWorld.sentinels.push(...held);
    return { n, of: pts.length, left: +left.toFixed(2), at: g.player.pos.toArray().map((v) => +v.toFixed(2)), setbacks: B.setbacks - start, why: B.setbacks > start ? B.lastSetback : null };
  };
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
// through the gate to the next place: the exit, then wait (up to 20 s) until the campaign has moved on and the
// transition's 900 ms fade is over, rather than for a fixed time a busy page can overrun
const onward = async () => {
  const from = await az(() => JSON.stringify([AZ.campaign.chapter, AZ.campaign.deck, AZ.campaign.sector]));
  await az(() => LVB.exit());
  await az(() => { AZ.simulate(0.3); LVB.skip(); });
  await page.waitForFunction((f) => !AZ.transitioning && JSON.stringify([AZ.campaign.chapter, AZ.campaign.deck, AZ.campaign.sector]) !== f, from, { timeout: 20000 }).catch(() => {});
  await az(() => { AZ.simulate(0.3); LVB.skip(); });
  await opening();
};
// after a mission's last gate: the outro plays, the fade's timer moves on to the next place
const nextPlace = async () => {
  await page.waitForTimeout(1600);
  await page.waitForFunction(() => !AZ.transitioning, null, { timeout: 300000 }).catch(() => {}); // (a new chapter's people load behind its card)
  await az(() => { LVB.step(0.3); LVB.skip(); });
  await opening();
};
// a chapter started out of order: its people first (casting.js loads them one at a time), then the chapter
const startChapter = async (ch) => {
  await page.evaluate((c) => AZ.edition.loadCast(c), ch);
  await az((c) => { AZ.edition.start(c); AZ.simulate(0.2); LVB.skip(); }, ch);
  await opening();
};
// a mission's opening (the chapter's card, the mission's card, the cold open) waits for its voices: let it play out
const opening = async () => {
  await page.waitForFunction(() => { LVB.step(0.2); LVB.skip(); return !AZ.edition.opening && !AZ.edition.cinema.active && AZ.voice.loading >= 1; }, null, { timeout: 120000, polling: 250 }).catch(() => {});
  await az(() => { LVB.step(0.2); LVB.skip(); });
};

// --- the title -----------------------------------------------------------------------------
console.log('The title');
const title = await az(() => ({
  h1: document.querySelector('#title h1').textContent, sub: document.querySelector('#title .sub')?.textContent,
  ver: document.querySelector('#title .ver').textContent, edition: !!AZ.edition, hero: AZ.settings.hero?.id,
}));
check(title.h1 === 'AFTERZERO' && title.sub === 'THE LAST VERSION OF EARTH', 'the title reads AFTERZERO / THE LAST VERSION OF EARTH', JSON.stringify(title));
check(/v2\.0/.test(title.ver) && title.edition && title.hero === 'real_m', 'v2.0, the edition is on, and you are Kai (a realistic man)', JSON.stringify(title));
// --- sound: the first tap (Chromium's autoplay policy: no sound before a user gesture) -----------------------
const before = await az(() => AZ.audio.ctx?.state || 'none');
await page.mouse.click(480, 120);
await page.waitForFunction(() => AZ.audio.ctx?.state === 'running', null, { timeout: 20000 }).catch(() => {});
const tapped = await az(() => ({ state: AZ.audio.ctx?.state, banner: document.querySelector('#lvSound')?.classList.contains('on'), composer: AZ.audio.composer === AZ.edition.score, packs: AZ.voice.packs.map((p) => p.base) }));
check(before !== 'running' && tapped.state === 'running' && !tapped.banner && tapped.composer, 'the AudioContext is running after the first tap (the score writes the music; no TAP FOR SOUND)', JSON.stringify({ before, ...tapped }));
await page.click('#begin');
await page.waitForFunction(() => AZ.menu === 'chapters', null, { timeout: 30000 });
const cards = await az(() => [...document.querySelectorAll('#chapters .chapcard h3')].map((h) => h.textContent));
check(JSON.stringify(cards) === JSON.stringify(['PROLOGUE', 'ACT I', 'ACT II', 'ACT III', 'ACT IV', 'FINALE', 'CASES']), 'its own chapter list', JSON.stringify(cards));
await page.click('#chapters [data-newch="prologue"]');
await page.waitForFunction(() => AZ.menu === 'saves', null, { timeout: 30000 });
await page.click('#saves [data-slot="0"]');
// (the Prologue's people may still be loading behind its card: the chapter starts once they are in)
await page.waitForFunction(() => AZ.started && AZ.room && AZ.mode === 'deck' && AZ.level?.place, null, { timeout: 300000 });
await az(() => { AZ.renderer.setAnimationLoop(null); }); // the bot drives time itself from here
await opening();
const cardsSeen = await az(() => ({ heard: AZ.edition.score.heard.slice(), packs: AZ.voice.packs.map((p) => p.base), said: LVB.said.slice(0, 6) }));
check(['chapter', 'card'].every((c) => cardsSeen.heard.includes(c)) && cardsSeen.said.includes('NONE: The Prologue. The Zero Second.') && cardsSeen.said.includes('NONE: Mission one. The Last Normal Day.'),
  'a new game opens on the Prologue\'s card, then Mission 1\'s, both said and scored (cues chapter and card)', JSON.stringify(cardsSeen));
check(cardsSeen.packs.join() === 'assets/voice/lv/common/,assets/voice/lv/prologue/', 'the voices: the common pack and the Prologue\'s', JSON.stringify(cardsSeen.packs));
const m1 = await az(() => ({ ...LVB.where(), card: document.querySelector('#card small')?.textContent, name: document.querySelector('#card h2, #card .t')?.textContent, state: AZ.engine.state(AZ.room) }));
check(m1.chapter === 'prologue' && m1.deck === 0 && m1.state === 'PRESENT', 'NEW GAME > PROLOGUE > slot 1 starts Mission 1 in the present', JSON.stringify(m1));

// --- Mission 1: THE LAST NORMAL DAY ---------------------------------------------------------
console.log('Mission 1: The Last Normal Day');
const walked = await az(() => { LVB.step(3); LVB.skip(); const z0 = AZ.player.pos.z; LVB.walkTo(11, -14, 4); return [z0, AZ.player.pos.z, AZ.level.place, AZ.room]; });
check(walked[1] < walked[0] - 6 && walked[2] === 'rain_south', 'you walk up the avenue of Rain City South (an open place under the sky)', JSON.stringify(walked));
const cast1 = await az(() => {
  const m = (id) => LVB.npc(id)?.model.userData.spec?.model;
  const crowd = AZ.deckWorld.npcs.filter((n) => n.n.crowd);
  return { guard: m('guard'), guardVariant: LVB.npc('guard')?.model.userData.lvVariant, toy: m('amb_child'), child: m('child'), mira: LVB.npc('mira')?.model.userData.lvVariant,
    crowd: crowd.length, visible: crowd.filter((n) => n.model.visible).length, walking: crowd.filter((n) => n.n.path).length, umbrellas: crowd.filter((n) => n.model.userData.umbrella).length, people: AZ.deckWorld.npcs.length };
});
check(cast1.guard === 'rb_security_f' && cast1.guardVariant === 'helix', 'Mission 1\'s checkpoint officer is a security officer in Helix black (rb_security_f), not a doctor', JSON.stringify(cast1));
check(cast1.toy === 'rb_child_m2' && cast1.child === 'rb_child_f', 'the toy child and the Child in the Station have children\'s bodies', JSON.stringify(cast1));
check(cast1.visible >= 10 && cast1.walking >= 8 && cast1.umbrellas >= 3 && cast1.people <= 24, 'Rain City\'s crowds walk Mission 1, umbrellas up (within 24 people)', JSON.stringify(cast1));
const toy = await az(() => { const u = LVB.go('toy'); LVB.use('toy'); LVB.skip(); return [u, LVB.f('ev_toy')]; });
check(toy[1].ev_toy, 'an optional anomaly: the toy that un-falls goes on the case board', JSON.stringify(toy));
const rook = await az(() => { const l = LVB.lm('rookCall'); LVB.place(l[0], l[2], l[1] + 0.86); LVB.step(0.3); const s = LVB.said.join('\n'); LVB.skip(); return [AZ.facts.get('rook_message'), s.includes('ROOK: Kai. Where are you.')]; });
check(rook[0] && rook[1], 'Rook calls on the way', JSON.stringify(rook));
// the checkpoint officer, with real input: look at her and press E
await az(() => { const n = LVB.npc('guard').model.position; LVB.place(n.x - 0.8, n.z + 2.2, n.y + 0.86); AZ.player.H.set(0.35, 0, -1).normalize(); AZ.simulate(0.2); AZ.focus = AZ.findFocus(); });
await page.keyboard.press('KeyE');
await frame();
await az(() => LVB.skip());
const guard = await az(() => [AZ.menu, [...document.querySelectorAll('#choice [data-choice] small')].map((s) => s.textContent)]);
check(guard[0] === 'choice' && ['INVESTIGATE', 'CHALLENGE', 'COMFORT', 'WITHDRAW'].every((k) => guard[1].includes(k)), 'talking to the officer offers four intents', JSON.stringify(guard));
await page.click('#choice button.comfort');
check(await az(() => { LVB.skip(); return AZ.facts.get('checkpoint_passed') && AZ.facts.get('trust_guard') === 1; }), 'comfort gets you through and the officer trusts you more');
await az(() => { const l = LVB.lm('platform'); LVB.place(l[0], l[2], l[1] + 0.86); LVB.step(0.2); });
await page.waitForTimeout(300); // (the duck is in the sound's own time)
const duck = await az(() => ({ voice: +AZ.audio.voiceBus.gain.value.toFixed(3), music: +AZ.audio.music.gain.value.toFixed(4), amb: +AZ.audio.amb.gain.value.toFixed(4), heard: AZ.edition.score.heard.includes('zero') }));
check(duck.heard && duck.voice === 1 && duck.music < 0.05, 'the Zero Second\'s cue: the music ducks for a second while the voices stay at full level', JSON.stringify(duck));
const zero = await az(() => { LVB.step(5); LVB.skip(); return { ...LVB.f('zero_second', 'after_zero'), said: LVB.said.includes('NONE: All the clocks stop.'), train: AZ.deckWorld.dynamic.some((d) => d.el.mat === 'car' && d.mesh.visible) }; });
check(zero.zero_second && zero.after_zero && zero.said && zero.train, 'the Zero Second: the clocks stop and the 41 comes in', JSON.stringify(zero));
// quest chain A: Last Train Home
const jun = await az(() => { const n = LVB.npc('jun').model.position; LVB.place(n.x + 2, n.z, n.y + 0.86); const u = LVB.use('jun'); LVB.skip(); return [u, AZ.menu, LVB.said.slice(-3)]; });
check(jun[1] === 'choice' && jun[2].some((l) => l.includes('The train keeps arriving.')), 'Jun Park: "The train keeps arriving..."', JSON.stringify(jun));
await az(() => { LVB.choose('investigate'); LVB.skip(); });
const relay = await az(() => {
  LVB.go('relay', 1.4, 0);
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
  for (const id of ['trapped_a', 'trapped_b']) { const n = LVB.npc(id).model.position; LVB.place(n.x + 1.4, n.z + 0.4, n.y + 0.86); LVB.use(id); LVB.skip(); }
  LVB.step(1.5); LVB.skip(); LVB.step(0.5); LVB.skip();
  return { ...LVB.f('rescued', 'voice_heard'), said: LVB.said.includes('VOICE: Kai Varen. Do not build the machine.') && LVB.said.includes('ROOK: The event lasted one second.') };
});
check(rescued.rescued && rescued.voice_heard && rescued.said, 'the rescue; "The event lasted one second."; every speaker: "Do not build the machine."', JSON.stringify(rescued));
const mira = await az(() => { const n = LVB.npc('mira').model.position; LVB.place(n.x, n.z + 2.5, n.y + 0.86); LVB.step(0.3); LVB.skip(); return { ...LVB.f('mira_gone', 'beat_done'), gate: LVB.gate() }; });
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
  const a = LVB.w('conduit', 6.5, -4), b = LVB.w('conduit', 6.5, -11.5), c = LVB.w('conduit', 6.5, -21);
  s.pos.set(a[0], 0, a[1]); s.dir.set(b[0] - a[0], 0, b[1] - a[1]).normalize(); s.mode = 'patrol'; s.suspicion = 0;
  LVB.place(b[0], b[1]);
  for (let i = 0; i < 40 && s.mode !== 'chase'; i++) AZ.simulate(0.05);
  const saw = s.mode === 'chase';
  LVB.place(c[0], c[1]);
  for (let i = 0; i < 120 && !s.dead; i++) AZ.simulate(0.05);
  LVB.skip();
  return { saw, dead: !!s.dead, ...LVB.f('conduit_live', 'unit_down') };
});
check(unit.saw && unit.dead && unit.unit_down, 'the unit that rewinds its damage, lured through the live conduit, stays down', JSON.stringify(unit));
const drawing = await az(() => { LVB.at('archive', 0, -12); LVB.use('drawing'); LVB.skip(); return [LVB.said.includes('KAI: This drawing is twenty-three years old.'), LVB.f('drawing_seen')]; });
check(drawing[0] && drawing[1].drawing_seen, '"This drawing is twenty-three years old." / "I was twelve."');
// the glass lift into the oculus: walk in, and it carries Kai down into the chamber
const lift = await az(() => { LVB.at('liftAtrium', 0, -5.5); for (let i = 0; i < 30; i++) AZ.simulate(0.05); return { room: AZ.room, y: +AZ.player.pos.y.toFixed(1), down: !!AZ.facts.get('lift_down') }; });
check(lift.room === 'chamber' && lift.y < -8 && lift.down, 'the glass lift carries Kai down into the chamber under the oculus', JSON.stringify(lift));
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
await press('Digit2');
const cable = await az(() => {
  const st = AZ.engine.state(AZ.room);
  const a = LVB.use('cable');
  LVB.at('cable', 4.4, -14); const b = LVB.use('cable_socket'); LVB.skip();
  return [st, a, b, LVB.f('cable_connected')];
});
check(cable[0] === 'PAST' && cable[3].cable_connected, 'key 2: 2026, where the cable is; connected there', JSON.stringify(cable));
await press('Digit1');
check(await az(() => { LVB.at('cable', 0, -14.6); LVB.step(0.2); LVB.use('power'); LVB.skip(); return AZ.engine.state(AZ.room) === 'PRESENT' && AZ.facts.get('power_on'); }), 'key 1: 2049, and the power a 2026 cable carries comes on');
const cross = await az(() => {
  LVB.at('collapse', 0, -4.5);
  AZ.edition.shift('FUTURE');
  const before = AZ.edition.stability;
  const far = LVB.w('collapse', 0, -18.5);
  const left = LVB.walkTo(far[0], far[1], 10);
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
await press('KeyC');
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
const crowd4 = await az(() => { const c = AZ.deckWorld.npcs.filter((n) => n.n.crowd && n.model.visible); return { n: c.length, models: [...new Set(c.map((n) => n.model.userData.spec?.model))] }; });
check(crowd4.n >= 5 && crowd4.models.every((m) => ['rb_robe_m', 'rb_tala', 'rb_child_f2'].includes(m)), 'the settlement\'s people walk Mission 4, in homespun (not the Elder\'s face: she is in this mission)', JSON.stringify(crowd4));
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
await opening(); // (its card and cold open hold Kai still: let them play out)
check((await az(() => AZ.edition.deck.name)) === 'THE VILLAGE THAT NEVER EXISTED', 'Mission 5');
const niko = await az(() => { AZ.edition.shift('FUTURE'); AZ.simulate(0.1); const n = LVB.npc('npc_' + AZ.room); const e = !!n?.isEcho; AZ.edition.shift('PRESENT'); AZ.simulate(0.1); return [e, !!LVB.npc('npc_' + AZ.room)?.isEcho]; });
check(niko[0] && !niko[1], 'Niko is himself in the present, an echo in the flooded future', JSON.stringify(niko));
await scene('the river is diverted in the earliest state (refused in the present)', 'scene_' + (await az(() => AZ.room)), 'PRESENT', 'PAST');
// the river cuts the village: walk the old bridge in the past
const fell = await az(() => { AZ.edition.shift('PRESENT'); const [x, , z] = LVB.lm('footbridgeS'); LVB.place(x, z); const s0 = LVB.setbacks; LVB.walkTo(x, LVB.lm('footbridgeN')[2], 8); return LVB.setbacks > s0 || AZ.player.pos.z > 1; });
await page.waitForTimeout(1200); // the fall's fade and the walk back to the checkpoint
const canal = await az(() => {
  const r = {};
  AZ.simulate(0.2);
  const [x, , z] = LVB.lm('footbridgeS'), n = LVB.lm('footbridgeN');
  LVB.place(x, z); AZ.edition.shift('PAST'); AZ.simulate(0.1); const s1 = LVB.setbacks;
  r.left = LVB.walkTo(n[0], n[2], 10); r.pastCrossed = LVB.setbacks === s1 && AZ.player.pos.z < n[2] + 1.5;
  AZ.edition.shift('PRESENT');
  return r;
});
canal.presentFell = fell;
check(canal.presentFell && canal.pastCrossed, 'the river cuts the village in two; in the thriving year the footbridge still stands', JSON.stringify(canal));
await onward();
const s1 = await az(() => LVB.where());
check(s1.deck === 1 && s1.sector === 1, 'the gate leads on to the abandoned village', JSON.stringify(s1));
await scene('the retaining wall is braced in the middle state, after the river moved', 'scene_' + s1.room, 'FUTURE', 'PRESENT');
await onward();
const s2 = await az(() => LVB.where());
await scene('the pressure gate is released in the latest state: the buried machine', 'scene_' + s2.room, 'PAST', 'FUTURE', () => true);
check(await az(() => LVB.said.some((l) => l.includes('Helix did not invent the machine. It found it.'))), 'Niko: Helix did not invent the machine; it found it');
await az(() => LVB.exit());
await nextPlace();
check(await az(() => AZ.facts.get('m05_done') && AZ.edition.deck.name === 'THE CLOCKMAKER\'S HOUSE'), 'Mission 5 ends; Mission 6 begins');

// --- Act II: Mission 11, THE INVERTED HOSPITAL: REVERSE -------------------------------------------------
console.log('Act II, Mission 11: The Inverted Hospital (REVERSE)');
const SHOT = process.env.LV_SHOT || null; // where to save the REVERSE screenshot (optional)
await startChapter('act2');
// Mission 10's watchers are Continuum troopers (the Observer inside each sentinel swapped for a person), and their cones see
const m10 = await az(() => {
  LVB.goMission(1);
  const ws = AZ.edition.watchers.list;
  const models = ws.map((w) => w.current?.actor?.userData.spec?.model || 'drone');
  const w = ws[0];
  const s = w.s;
  s.mode = 'patrol'; s.suspicion = 0;
  // stand in its cone, four metres ahead of it, and let it look
  LVB.place(s.pos.x + s.dir.x * 4, s.pos.z + s.dir.z * 4);
  const t0 = AZ.time;
  let seen = 0;
  for (let i = 0; i < 40 && s.mode !== 'chase'; i++) { AZ.simulate(0.05); seen = Math.max(seen, s.suspicion); }
  const out = { mkey: AZ.edition.deck.mkey, models, variant: w.current?.actor?.userData.lvVariant, observer: !!w.g.getObjectByProperty?.('name', 'observer'), seen: +seen.toFixed(2), mode: s.mode, eye: w.g.userData.eyeMat.color.getHexString(), cone: w.g.userData.coneMat.opacity, secs: +(AZ.time - t0).toFixed(2) };
  AZ.deckWorld.sentinels.forEach((x) => x.reset());
  return out;
});
check(m10.mkey === 'm10' && m10.models.length >= 1 && m10.models.every((m) => m === 'rb_trooper') && m10.variant === 'continuum', 'Mission 10\'s watchers are Continuum troopers (rb_trooper, slate)', JSON.stringify(m10));
check(m10.seen >= 1 && m10.mode === 'chase' && m10.eye === 'ff8a70' && m10.cone > 0.1, 'a trooper\'s cone sees Kai in front of it: suspicion, then the chase', JSON.stringify(m10));
await az(() => { LVB.goMission(2); });
await opening();
const hosp = await az(() => {
  const g = AZ, inv = g.edition.inv;
  const rev = g.level.order.filter((r) => g.engine.hasIn('timeReverse', r));
  return { name: g.edition.deck.name, rev: rev.length, gravity: rev.map((r) => g.engine.gravity(r)), years: g.engine.statesOf(g.room), on: inv.unlocked, chip: document.querySelector('#lvReverse')?.classList.contains('on'), btn: !!document.querySelector('#buttons #lvRevBtn'), pips: [...document.querySelectorAll('#state .pip')].length };
});
check(hosp.name === 'THE INVERTED HOSPITAL' && hosp.rev > 0 && hosp.gravity.every((v) => v === -1) && JSON.stringify(hosp.years) === '["PRESENT","PAST"]' && !hosp.on && !hosp.chip && hosp.btn,
  'Mission 11: two years, a ward that runs backwards (gravity unchanged), and no REVERSE yet', JSON.stringify(hosp));
await press('KeyR');
const early = await az(() => ({ state: AZ.engine.state(AZ.room), active: !!AZ.edition.inv.active, has: !!AZ.facts.get('has_inversion') }));
check(early.state === 'PRESENT' && !early.active && !early.has, 'before it is taught, R reverses nothing (and is no longer a year switch)', JSON.stringify(early));
// the records: the charred file un-burns three seconds in ten; the Chronolith catches the rhythm
await az(() => LVB.goMission(2, 1));
const unlock = await az(() => {
  const g = AZ, inv = g.edition.inv, file = LVB.proc('charredFile');
  if (!file) return 'no charred file';
  const r = { room: g.room === file.rec.room };
  LVB.place(file.rec.aim[0] + 1.1, file.rec.aim[2], 0.86, -Math.PI / 2);
  for (let t = 0; t < 4 && !g.facts.get('has_inversion'); t += 0.5) { g.simulate(0.5); LVB.skip(); }
  LVB.skip();
  g.simulate(0.2);
  Object.assign(r, { saw: g.facts.get('m11_saw_file'), has: g.facts.get('has_inversion'), said: LVB.said.some((l) => l.includes('I can hold one thing. Only one, and only for a while.')), chip: document.querySelector('#lvReverse').classList.contains('on'), chipText: document.querySelector('#lvReverse span').textContent, ...LVB.inv() });
  r.board = (() => { const el = document.createElement('div'); g.edition.renderJournal(g, el); return el.innerHTML.includes('ABILITIES') && el.innerHTML.includes('R6'); })();
  return r;
});
check(unlock.saw && unlock.has && unlock.said && unlock.chip && unlock.cap === 8 && /⟲ 8s/.test(unlock.chipText) && unlock.board,
  'in the records hall the Chronolith catches the ward\'s rhythm: has_inversion, Kai\'s line, the REVERSE chip (8 s), the case board\'s ABILITIES', JSON.stringify(unlock));
// R starts a hold on what the crosshair is on, and R again lets go
const tray = await az(() => {
  const g = AZ, p = LVB.proc('tray');
  LVB.place(p.rec.aim[0] - 0.4, p.rec.aim[2] + 2.4);
  return { aim: LVB.aim(p.rec.aim), ...LVB.inv() };
});
await press('KeyR');
const trayHeld = await az(() => { const r = { ...LVB.inv(), rev: AZ.facts.get('rev_tray') }; AZ.simulate(1.6); r.P = +LVB.proc('tray').P.toFixed(2); r.label = document.querySelector('#lvTarget').textContent; r.chip = document.querySelector('#lvReverse span').textContent; return r; });
await press('KeyR');
const trayOut = await az(() => ({ ...LVB.inv(), rev: AZ.facts.get('rev_tray') }));
check(tray.aim === 'tray' && trayHeld.active === 'tray' && trayHeld.rev && trayHeld.P === 1 && trayHeld.charge <= tray.charge - 0.5 && /THE TRAY/.test(trayHeld.chip) && /⟲ THE TRAY/.test(trayHeld.label),
  'R on the fallen tray: it rises back onto its trolley and holds (charge spent, the chip and the label name it)', JSON.stringify({ tray, trayHeld }));
check(!trayOut.active && trayOut.why === 'press' && !trayOut.rev, 'R again lets it go: it falls forward again', JSON.stringify(trayOut));
// the touch ⟲ button does the same (it binds its own touches)
const tap = await az(() => {
  const g = AZ, p = LVB.proc('waterGlass'), btn = document.querySelector('#lvRevBtn');
  LVB.place(p.rec.aim[0], p.rec.aim[2] + 2.2);
  const r = { aim: LVB.aim(p.rec.aim) };
  g.simulate(1.2);
  btn.dispatchEvent(new Event('touchstart', { bubbles: true, cancelable: true }));
  r.held = LVB.inv().active;
  g.simulate(0.2);
  r.text = btn.textContent;
  g.simulate(1.0);
  btn.dispatchEvent(new Event('touchstart', { bubbles: true, cancelable: true }));
  r.after = LVB.inv().active;
  g.simulate(0.2);
  r.text2 = btn.textContent;
  return r;
});
check(tap.aim === 'waterGlass' && tap.held === 'waterGlass' && /RELEASE/.test(tap.text) && !tap.after && /REVERSE/.test(tap.text2), 'the touch ⟲ button starts a hold (RELEASE) and lets it go', JSON.stringify(tap));
// a hold belongs to its year: switching year lets go
const annex = await az(() => {
  const g = AZ, p = LVB.proc('burntDoor');
  LVB.place(p.rec.aim[0] + 2.6, p.rec.aim[2] + 0.4);
  const r = { aim: LVB.aim(p.rec.aim) };
  g.simulate(1.2);
  LVB.rev();
  g.simulate(1.4);
  r.held = LVB.inv().active;
  r.P = +p.P.toFixed(2);
  return r;
});
if (SHOT) {
  await az(() => { AZ.frame(); AZ.frame(); });
  await page.screenshot({ path: SHOT, timeout: 240000 });
}
await press('Digit2');
const yearOff = await az(() => ({ year: AZ.engine.state(AZ.room), ...LVB.inv(), rev: AZ.facts.get('rev_burntDoor') }));
await press('Digit1');
check(annex.aim === 'burntDoor' && annex.held === 'burntDoor' && annex.P === 1 && yearOff.year === 'PAST' && !yearOff.active && yearOff.why === 'year' && !yearOff.rev,
  'the burnt annex door un-burns and stands while held; switching to 2026 lets it go', JSON.stringify({ annex, yearOff }));
// R6: never a person
const refuse = await az(() => {
  const g = AZ, p = LVB.proc('flatlineMonitor');
  LVB.place(p.rec.aim[0] + 1.8, p.rec.aim[2] + 1.2);
  const r = { aim: LVB.aim(p.rec.aim) };
  g.simulate(0.2);
  r.label = document.querySelector('#lvTarget').textContent;
  LVB.rev();
  LVB.skip();
  return { ...r, ...LVB.inv(), said: LVB.said.includes('KAI: Not a person. It won\'t take a person.') };
});
check(refuse.aim === 'flatlineMonitor' && /✕ NOT A PROCESS/.test(refuse.label) && !refuse.active && refuse.said, 'the flatline monitor: ✕ NOT A PROCESS, "Not a person. It won\'t take a person."', JSON.stringify(refuse));
// the file is readable only while it is held
const charred = await az(() => {
  const g = AZ, p = LVB.proc('charredFile');
  LVB.place(p.rec.aim[0] + 1.1, p.rec.aim[2] + 0.3);
  g.simulate(2.5); // the charge comes back
  const r = {};
  LVB.use('p_charredFile'); LVB.skip();
  r.before = !!g.facts.get('ev_admitted_by');
  r.aim = LVB.aim(p.rec.aim);
  LVB.rev();
  r.held = LVB.inv().active;
  g.simulate(1.2);
  LVB.use('p_charredFile'); LVB.skip();
  r.after = !!g.facts.get('ev_admitted_by');
  r.said = LVB.said.includes('NONE: ADMITTED BY: K. VAREN.');
  LVB.rev();
  r.released = !LVB.inv().active;
  g.simulate(0.3);
  r.door = g.deckWorld.dynamic.find((d) => d.el.id === 'door_m11records')?.cond(g.deckWorld.ctx(g.room));
  return r;
});
check(!charred.before && charred.aim === 'charredFile' && charred.held === 'charredFile' && charred.after && charred.said && charred.released && charred.door === false,
  'the charred file reads only while it is held: ADMITTED BY: K. VAREN (and the way on opens)', JSON.stringify(charred));
// Ward 32's door: a reversing lock of four bolts, fitted RING, BAR, STAR, CRESCENT
const ward32 = await az(() => { LVB.goMission(2, 2); return { ...LVB.where(), lock: !!LVB.proc('m11lock') }; });
check(ok(ward32) && ward32.sector === 2 && ward32.lock, 'on to Ward 32\'s door', JSON.stringify(ward32));
const clue = await az(() => {
  const g = AZ, r = {};
  const tag = LVB.cand('maintTag');
  LVB.place(tag.pos[0] - 0.6, tag.pos[2] + 1.4);
  LVB.use('maintTag'); LVB.skip();
  r.now = !!g.facts.get('ev_lock_order');
  g.edition.shift('PAST'); g.simulate(0.1);
  LVB.use('maintTag'); LVB.skip();
  r.then = !!g.facts.get('ev_lock_order');
  r.said = LVB.said.some((l) => l.includes('BOLTS FITTED IN ORDER: RING, BAR, STAR, CRESCENT'));
  g.edition.shift('PRESENT'); g.simulate(0.1);
  return r;
});
check(!clue.now && clue.then && clue.said, 'the 2026 maintenance tag gives the fitting order: RING, BAR, STAR, CRESCENT', JSON.stringify(clue));
const bolt = (name) => az((name) => {
  const g = AZ, p = LVB.proc('m11lock'), i = p.rec.parts.findIndex((x) => x.name === name);
  const at = p.rec.parts[i].rest.p;
  LVB.place(p.rec.aim[0], p.rec.aim[2] + 2.6);
  g.edition.stability = 1;
  const r = { aim: LVB.aim(at), before: +g.edition.inv.state.charge.toFixed(2) };
  LVB.rev();
  r.after = +g.edition.inv.state.charge.toFixed(2);
  g.simulate(1.4);
  r.out = p.partOut.map((v, k) => (v === true ? p.rec.parts[k].name : null)).filter(Boolean);
  g.simulate(2.0); // the charge comes back
  LVB.skip();
  return r;
}, name);
await az(() => { AZ.simulate(6); });
const jam = await bolt('RING');
check(jam.aim === 'm11lock:RING' && Math.abs(jam.before - jam.after - 1.5) < 0.05 && jam.out.length === 0, 'a wrong bolt (RING went in first) turns half back and jams: −1.5 s of charge', JSON.stringify(jam));
const first = await bolt('CRESCENT');
check(first.aim === 'm11lock:CRESCENT' && JSON.stringify(first.out) === '["CRESCENT"]', 'the last-fitted bolt, CRESCENT, backs out and stays out', JSON.stringify(first));
const reload = await az(() => {
  AZ.saveTo(2);
  AZ.load(2);
  AZ.simulate(0.3);
  LVB.skip();
  const p = LVB.proc('m11lock');
  return { flag: AZ.deckWorld.flags.inv_m11lock_CRESCENT, out: p?.partOut.map((v, k) => (v === true ? p.rec.parts[k].name : null)).filter(Boolean), sector: AZ.campaign.sector, inv: !!AZ.campaign.inv };
});
check(reload.flag && JSON.stringify(reload.out) === '["CRESCENT"]' && reload.sector === 2 && reload.inv, 'a settled bolt survives a save and a load', JSON.stringify(reload));
const rest = [];
for (const n of ['STAR', 'BAR', 'RING']) rest.push(await bolt(n));
const opened = await az(() => {
  const g = AZ;
  LVB.skip();
  const d = g.deckWorld.dynamic.find((x) => x.el.id === 'door_m11ward32');
  const r = { done: g.facts.get('inv_m11lock_done'), beat: !!g.deckWorld.flags.beat_done, shut: d?.cond(g.deckWorld.ctx(d.el.room)), said: LVB.said.some((l) => l.includes('Nothing pushes it back in.')) };
  const p = LVB.proc('m11lock');
  LVB.place(p.rec.aim[0], p.rec.aim[2] + 1.8);
  const ward = g.level.order[g.level.order.indexOf(p.rec.room) + 1];
  const w = g.level.rooms[ward].spawn;
  r.left = +LVB.walkTo(w[0], w[2] - 2, 12).toFixed(2);
  r.inWard = g.room === ward;
  return r;
});
check(rest.every((r) => r.out.length >= 2) && opened.done && opened.beat && opened.shut === false && opened.said && opened.inWard,
  'CRESCENT, STAR, BAR, RING: inv_m11lock_done, and Ward 32 opens (walked into)', JSON.stringify({ rest, opened }));

// --- Act II: Mission 13, THE NINE-MINUTE WAR --------------------------------------------------------------
console.log('Act II, Mission 13: The Nine-Minute War');
await startChapter('act2');
await az(() => { LVB.goMission(4); });
await opening(); // (Kai walks once the mission's card and cold open have played)
check((await az(() => AZ.edition.deck.name)) === 'THE NINE-MINUTE WAR', 'Mission 13');
const quay = await az(() => { AZ.edition.shift('PRESENT'); LVB.place(0, 84); return LVB.route([[2.6, 80], [2.6, 68], [24, 60], [24, 14]]); });
check(quay.n === quay.of && !quay.setbacks, 'Mission 13, walked: from the quay trench through the gap in the sandbags, past the container canyons to their gate', JSON.stringify(quay));
const roof = await az(() => {
  const c = AZ.deckWorld.focusCandidates(AZ).find((x) => x.it?.kind === 'terminal');
  LVB.place(c.pos[0], c.pos[2] + 1.4, c.pos[1] - 0.35);
  AZ.useDeck(c); LVB.skip();
  return { done: AZ.deckWorld.flags.beat_done, gate: LVB.gate() };
});
check(roof.done && roof.gate === false, 'the field order on the roof: both sides answer each other\'s fire', JSON.stringify(roof));
await onward();
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
await onward();
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
const crowd14 = await az(() => { const c = AZ.deckWorld.npcs.filter((n) => n.n.crowd && n.model.visible); return { year: AZ.engine.state(AZ.room), n: c.length, models: [...new Set(c.map((n) => n.model.userData.spec?.model))] }; });
const faces14 = crowd14.year === 'FUTURE' ? ['rb_trader', 'rb_villager_f', 'rb_civ_f3', 'rb_scav', 'rb_child_m2'] : ['rb_civ_f1', 'rb_civ_f2', 'rb_civ_m1', 'rb_civ_m2', 'rb_courier', 'rb_contractor'];
check(crowd14.n >= 3 && crowd14.models.every((m) => faces14.includes(m)), 'a crowd walks Mission 14, in its year\'s own faces (2196\'s survivors; 2049\'s commuters)', JSON.stringify(crowd14));
const drain = await az(() => {
  AZ.edition.shift('FUTURE');
  const a = AZ.edition.stability;
  AZ.simulate(4);
  const b = AZ.edition.stability;
  AZ.simulate(40);
  return { a, b, after: AZ.edition.stability, catching: !!AZ.catching, cls: document.querySelector('#state').className };
});
check(drain.b < drain.a, 'out of the present in an unstable place, the Chronolith\'s stability drains', JSON.stringify(drain));
// the snap back's fade runs on the page's own timers: wait for it (a page that has run for long may have its timers slowed)
await page.waitForTimeout(1200);
await page.waitForFunction(() => !AZ.catching, null, { timeout: 90000 }).catch(() => {});
const snap = await az(() => { AZ.simulate(0.2); const s = LVB.said.slice(-3).join(' '); return { state: AZ.engine.state(AZ.room), stability: AZ.edition.stability, said: s.includes('The Chronolith let go of me'), catching: !!AZ.catching }; });
check(snap.state === 'PRESENT' && snap.said, 'at zero it snaps you back to the present at the last anchor', JSON.stringify({ snap, drain }));
const viaduct = await az(() => { AZ.edition.stability = 1; const l = LVB.lm('arrivalPlatform'); LVB.place(l[0], l[2], l[1] + 0.86); const r = LVB.route([[l[0], 70], [l[0], 40]]); r.y = +(AZ.player.pos.y - 0.86).toFixed(2); return r; });
check(viaduct.n === viaduct.of && !viaduct.setbacks && Math.abs(viaduct.y - 8) < 0.6, 'Mission 14, walked: along the transit viaduct over the drowned avenues, 8 m up', JSON.stringify(viaduct));
const recorder = await az(() => { const c = AZ.deckWorld.focusCandidates(AZ).find((x) => x.it?.kind === 'terminal'); LVB.place(c.pos[0], c.pos[2] + 1.4, c.pos[1] - 0.35); AZ.useDeck(c); LVB.skip(); return AZ.deckWorld.flags.beat_done; });
check(recorder, 'the beacon\'s part list, on a roof of the overgrown towers');
await onward();
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
await onward();
const sera = await az(() => { const n = LVB.npc('npc_' + AZ.room); LVB.place(n.model.position.x, n.model.position.z + 2); LVB.use('npc_' + AZ.room); LVB.skip(); const c = LVB.choose('investigate'); LVB.skip(); return [c, AZ.facts.get('ev_memorial'), AZ.deckWorld.flags.beat_done, LVB.said.some((l) => l.includes('We teach children your name'))]; });
check(sera[1] && sera[2] && sera[3], 'Sera at the memorial: "We teach children your name before they learn the names of the dead."', JSON.stringify(sera));
await az(() => LVB.exit());
await nextPlace();
check(await az(() => AZ.edition.deck.name === 'THE CITY THAT FORGOT TOMORROW'), 'Mission 14 ends; Mission 15 begins');

// --- the Museum, walked: Mission 16, THE MUSEUM OF FAILED WORLDS ---------------------------------------------
// the sinkhole's spiral ramp, one and a half turns from the south rim (26 m) to the quarry's floor (-12 m), in 2196
// (in 2049 its lower turns are under the lake), with real movement, then across the floor into the Comparison Hall
console.log('Act III, Mission 16: the Museum\'s spiral, walked from the rim to the Comparison Hall');
const spiral = await az(() => {
  const g = AZ;
  LVB.goMission(2, 0);
  g.transitioning = true; // keep the bot inside this sector
  g.edition.shift('FUTURE');
  g.edition.stability = 1;
  const pts = [[0, 58], [0, 55]];
  for (let a = 96; a <= 624; a += 6) { const r = 55 - (18 * (a - 90)) / 540; pts.push([Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r]); }
  pts.push([0, -33], [0, -30], [3, -20], [3, -12], [1, -6]);
  const l = LVB.lm('rimGate');
  LVB.place(l[0], l[2], l[1] + 0.86);
  const drain = g.edition.unstable;
  g.edition.unstable = false; // (the walk takes longer than 2196 lets you stay; stability is Mission 14's check)
  const r = LVB.route(pts, 12);
  g.edition.unstable = drain;
  r.y = +(g.player.pos.y - 0.86).toFixed(2);
  r.board = Math.hypot(g.player.pos.x - LVB.lm('deductionBoard')[0], g.player.pos.z - LVB.lm('deductionBoard')[2]).toFixed(1);
  g.edition.shift('PRESENT');
  g.transitioning = false;
  return r;
});
check(spiral.n === spiral.of && !spiral.setbacks && Math.abs(spiral.y + 12) < 0.6 && +spiral.board < 3, `the Museum's spiral, ${spiral.of} waypoints from the rim at 26 m down to the Comparison Hall at -12 m`, JSON.stringify(spiral));

// --- Act IV: Mission 19, THE PLACE OUTSIDE TIME --------------------------------------------------------------
console.log('Act IV, Mission 19: The Place Outside Time');
await startChapter('act4');
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
await onward();
const bridge = await az(() => { const c = AZ.deckWorld.focusCandidates(AZ).find((x) => x.it?.kind === 'plaque'); LVB.place(c.pos[0], c.pos[2] + 1.5); AZ.edition.shift('PAST'); AZ.simulate(0.1); AZ.useDeck(c); LVB.skip(); AZ.edition.shift('PRESENT'); return AZ.deckWorld.flags.beat_done; });
check(bridge, 'THERE IS NO BRIDGE / THERE IS A BRIDGE. YOU ARE STANDING ON IT');
const mirror = await az(() => {
  const g = AZ, out = {};
  g.edition.stability = 1;
  g.edition.shift('PAST'); g.simulate(0.1);
  LVB.place(0, -18);
  out.past = LVB.route([[0, -30], [0, -38]]);
  out.past.y = +(g.player.pos.y - 0.86).toFixed(2);
  g.edition.shift('PRESENT'); g.simulate(0.1);
  LVB.place(0, -18);
  out.present = LVB.route([[0, -30], [0, -38]], 6);
  return out;
});
// (the water's setback fades on the page's timers: let it finish before walking on)
await page.waitForTimeout(1200);
await page.waitForFunction(() => !AZ.catching, null, { timeout: 90000 }).catch(() => {});
mirror.wrapX = await az(() => {
  // the plain's edges wrap: off the east edge, back in from the west
  LVB.place(106, 60);
  LVB.walkTo(112, 60, 3);
  return +AZ.player.pos.x.toFixed(1);
});
check(mirror.past.n === mirror.past.of && !mirror.past.setbacks && Math.abs(mirror.past.y) < 0.6 && mirror.present.setbacks > 0, 'the bridge in the reflection: walked over it in 2026; in 2049 there is only its reflection, and the water', JSON.stringify(mirror));
check(mirror.wrapX < -95, 'the roads loop: off the plain\'s east edge, back in from the west', JSON.stringify(mirror));
await onward();
const forgive = await az(() => { const n = LVB.npc('npc_' + AZ.room); LVB.place(n.model.position.x, n.model.position.z + 2); LVB.use('npc_' + AZ.room); LVB.skip(); return [AZ.deckWorld.flags.beat_done, LVB.said.some((l) => l.includes('the version of me that would forgive you'))]; });
check(forgive[0] && forgive[1], 'Mira: "You\'ve been trying to reach the version of me that would forgive you."', JSON.stringify(forgive));
await az(() => LVB.exit());
await nextPlace();
check(await az(() => AZ.facts.get('m19_done') && AZ.edition.deck.name === 'MIRA\'S MEMORY'), 'Mission 19 ends; Mission 20 begins');

// --- the Finale: AFTERZERO ------------------------------------------------------------------------------------
console.log('The Finale: Afterzero');
await startChapter('finale');
const street = await az(() => ({ name: AZ.edition.deck.name, drones: AZ.deckWorld.sentinels.length, jun: !!LVB.npc('jun_safe') }));
check(street.name === 'AFTERZERO' && street.drones === 0 && street.jun, 'the passengers Kai got off the 41 have cleared the opening streets: no watchers, Jun waves you through', JSON.stringify(street));
const road = await az(() => { AZ.edition.shift('PRESENT'); const l = LVB.lm('platform41'); LVB.place(l[0], l[2]); return LVB.route([[2, 150], [2, 116]]); });
check(road.n === road.of && !road.setbacks, 'the Finale, walked: up the quoted South Square to the seam where the asphalt ends', JSON.stringify(road));
for (let s = 0; s < 2; s++) {
  const r = await az(() => { const c = AZ.deckWorld.focusCandidates(AZ).find((x) => x.it?.kind === 'terminal'); LVB.place(c.pos[0], c.pos[2] + 1.4, c.pos[1] - 0.35); AZ.useDeck(c); LVB.skip(); return AZ.deckWorld.flags.beat_done; });
  check(r, s === 0 ? 'Rook\'s last transmission' : 'the Witness holds the route');
  if (s === 1) {
    const stream = await az(() => { LVB.place(0, 70); const r = LVB.route([[0, 60], [0, 50]]); r.y = +(AZ.player.pos.y - 0.86).toFixed(2); return r; });
    check(stream.n === stream.of && !stream.setbacks && stream.y > -0.3, 'over the settlement\'s stream on the bridge Kai holds', JSON.stringify(stream));
  }
  await onward();
}
const finale = await az(() => { const c = LVB.cand('choice_' + AZ.room); LVB.place(c.pos[0], c.pos[2] + 1.5); LVB.use('choice_' + AZ.room); LVB.skip(); return [AZ.menu, [...document.querySelectorAll('#choice button')].map((b) => b.className)]; });
check(finale[0] === 'choice' && finale[1].length === 3, 'at the original Chronolith: what to preserve, what to release (three endings)', JSON.stringify(finale));
await az(() => { LVB.choose('comfort'); LVB.skip(); AZ.simulate(1.5); LVB.skip(); AZ.simulate(0.5); });
for (let i = 0; i < 40 && !(await az(() => AZ.menu === 'ending')); i++) await az(() => { LVB.skip(); AZ.simulate(0.5); });
const ending = await az(() => ({ menu: AZ.menu, text: document.querySelector('#ending .body')?.textContent || '', ending: AZ.facts.get('ending') }));
const endSaid = await az(() => ({ heard: AZ.edition.score.heard.filter((c) => /ending|postcredit/.test(c)), said: LVB.said.slice(-12) }));
check(endSaid.heard.includes('ending:C') && endSaid.heard.includes('postcredit') && endSaid.said.includes('KAI: I finally found a second that belongs to nobody.') && endSaid.said.includes('VOICE: Version one hundred and eighteen.') && !endSaid.said.some((l) => /post-credit/i.test(l)),
  'Ending C is scored and said: the bible\'s text, "Live.", Kai\'s quote, the ticks, the voice (no stage direction read aloud)', JSON.stringify(endSaid));
check(ending.menu === 'ending' && ending.ending === 'C' && /ENDING C/.test(ending.text) && /AFTERZERO/.test(ending.text), 'Ending C, Afterzero', JSON.stringify({ ...ending, text: ending.text.slice(0, 120) }));
check(/a second that belongs to nobody/.test(ending.text) && /Version one hundred and eighteen/.test(ending.text), '"I finally found a second that belongs to nobody." A voice: "Version one hundred and eighteen."');

// --- the open places: all twenty-three missions, each under its own sky (OVERHAUL.md §4.8) ----------------------------
// At quarter 0's spawn, in every year the mission has: a frame rendered, a 16×16 average hash of it (written to this log),
// and the top quarter of the frame, which must be sky (or a ceiling's lights), never flat fog. Two missions in different
// places must differ by 18 bits or more in every pair of years; the same place in another year (sameAs) may look alike.
// Each mission is surveyed in a fresh page (a new game started the player's way, then that mission), small (384 x 216:
// the hash is taken at 16 x 16), with the real-time loop stopped before the game begins, so the only frames drawn are
// the ones the survey asks for, and the year's shaders compiled ahead without blocking. On a busy machine a headless
// SwiftShader page that keeps drawing grows by gigabytes (the pre-U2 build does the same), and the session's shared
// memory limit then kills it; a page per mission starts each one from nothing. LV_ONLY=places runs the survey alone;
// LV_PLACE_SHOTS=<folder> keeps a screenshot of every view; LV_SURVEY_W / LV_SURVEY_H set the page's size;
// LV_SURVEY_ONLY=m01,m04 surveys only those missions (the pair check then covers only them); LV_SURVEY_HASHES=<file>
// writes every view's hash and sky numbers to a JSON file.
async function survey() {
  console.log('The places: Missions 1 to 23 under their own skies');
  const SHOTS = process.env.LV_PLACE_SHOTS || null;
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const W = +(process.env.LV_SURVEY_W || 384), H = +(process.env.LV_SURVEY_H || 216);
  const ONLY = (process.env.LV_SURVEY_ONLY || '').split(',').filter(Boolean);
  const VIEWS = [['prologue', 0, 'm01'], ['prologue', 1, 'm02'], ['prologue', 2, 'm03'], ['act1', 0, 'm04'], ['act1', 1, 'm05'], ['act1', 2, 'm06'], ['act1', 3, 'm07'], ['act1', 4, 'm08'],
    ['act2', 0, 'm09'], ['act2', 1, 'm10'], ['act2', 2, 'm11'], ['act2', 3, 'm12'], ['act2', 4, 'm13'],
    ['act3', 0, 'm14'], ['act3', 1, 'm15'], ['act3', 2, 'm16'], ['act3', 3, 'm17'], ['act3', 4, 'm18'],
    ['act4', 0, 'm19'], ['act4', 1, 'm20'], ['act4', 2, 'm21'], ['act4', 3, 'm22'], ['finale', 0, 'm23']].filter(([, , key]) => !ONLY.length || ONLY.includes(key));
  const views = [];
  let lost = 0;
  for (const [ch, d, key] of VIEWS) {
    const sp = await browser.newPage({ viewport: { width: W, height: H } });
    await sp.route('**/*', (route) => {
      const u = new URL(route.request().url());
      return u.hostname === 'localhost' || u.hostname === '127.0.0.1' ? route.continue() : route.abort();
    });
    let crashed = false;
    sp.on('crash', () => { crashed = true; });
    sp.on('pageerror', (e) => errors.push(e.message));
    const run = (fn, arg) => (crashed ? Promise.resolve('ERR the page crashed') : sp.evaluate(([src, a]) => {
      try { return (0, eval)(`(${src})`)(a); } catch (e) { return `ERR ${e.message} @ ${(e.stack || '').split('\n').slice(1, 4).join(' | ')}`; }
    }, [fn.toString(), arg]).catch((e) => { if (/closed|crash/i.test(e.message)) crashed = true; return `ERR ${e.message.split('\n')[0]}`; }));
    await sp.goto(url);
    await sp.waitForFunction(() => window.AZ, null, { timeout: 400000 });
    await run(() => {
      AZ.changeSetting('quality', 'low');
      AZ.changeSetting('smart', false);
      // nothing on the page animates by itself (the dock's blinking hint), and nothing is drawn but what the survey asks for
      const st = document.createElement('style');
      st.textContent = '* { animation: none !important; transition: none !important; }';
      document.head.appendChild(st);
      AZ.renderer.setAnimationLoop(null);
      // a new game, started inside the page as a click does
      setTimeout(() => AZ.begin('lv:prologue', null, 0), 0);
      return 'ok';
    });
    await sp.waitForFunction(() => AZ.started && AZ.room && AZ.level?.place, null, { timeout: 300000 }).catch((e) => { crashed = crashed || /closed|crash/i.test(e.message); });
    if (!crashed && ch !== 'prologue') await sp.evaluate((c) => AZ.edition.loadCast(c), ch).catch(() => {}); // (the chapter's people first)
    const m = await run(([ch, d]) => {
      const g = AZ;
      g.renderer.setAnimationLoop(null);
      const skip = () => { for (let i = 0; i < 800 && g.hud.talking; i++) { g.hud.subT = 0; g.simulate(0.1); } };
      if (g.campaign?.chapter !== ch) { g.edition.start(ch); g.simulate(0.2); skip(); }
      g.campaign.deck = d; g.campaign.sector = 0; g.campaign.flags = {}; g.campaign.visited = [];
      g.loadSector(true);
      g.simulate(0.3);
      skip();
      const lv = g.level;
      return { place: lv.place, sameAs: lv.sameAs, states: g.edition.deck.states, quarter: lv.quarters?.[0]?.name, sky: !!g.edition.mounted?.sky, horizon: !!g.edition.mounted?.horizon };
    }, [ch, d]);
    if (!ok(m)) { check(false, `${key} loads`, m); lost++; await sp.close().catch(() => {}); continue; }
    check(m.place && m.sky && m.horizon, `${key}: ${m.place}, ${m.quarter}, with its sky and horizon`, JSON.stringify(m));
    for (const st of m.states) {
      // the year at once (sky, fog and light without easing); its shaders compiled without blocking the page; then a
      // couple of frames, each its own short call that waits for the GPU
      await run((st) => {
        const g = AZ;
        g.edition.inv?.release?.('year');
        g.engine.setState(g.room, st, { force: true });
        g.edition.weatherState = null;
        g.player.place(g.level.spawn);
        g.player.pitch = 0.05;
        g.simulate(0.1);
        g.updateTheme(1);
        return 'ok';
      }, st);
      await run(async () => { await AZ.renderer.compileAsync(AZ.scene, AZ.camera); return 'ok'; });
      for (let i = 0; i < 2; i++) await run(() => { const gl = AZ.renderer.getContext(); AZ.tickFrame(1 / 30); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); return 'ok'; });
      const v = await run(() => {
        const g = AZ;
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 36;
        const x = c.getContext('2d', { willReadFrequently: true });
        g.tickFrame(1 / 30);
        x.drawImage(g.renderer.domElement, 0, 0, 64, 36);
        const big = x.getImageData(0, 0, 64, 36).data;
        const h = document.createElement('canvas');
        h.width = h.height = 16;
        const hx = h.getContext('2d', { willReadFrequently: true });
        hx.drawImage(c, 0, 0, 16, 16);
        const px = hx.getImageData(0, 0, 16, 16).data;
        const lum = [];
        for (let i = 0; i < 256; i++) lum.push(0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]);
        const mean = lum.reduce((a, b) => a + b, 0) / 256;
        const bits = lum.map((l) => (l > mean ? 1 : 0)).join('');
        // the top quarter: its spread of light, and how far its average is from the fog's colour
        const top = [], rgb = [0, 0, 0];
        for (let y = 0; y < 9; y++) for (let i = 0; i < 64; i++) {
          const k = (y * 64 + i) * 4;
          top.push((0.299 * big[k] + 0.587 * big[k + 1] + 0.114 * big[k + 2]) / 255);
          rgb[0] += big[k]; rgb[1] += big[k + 1]; rgb[2] += big[k + 2];
        }
        const tm = top.reduce((a, b) => a + b, 0) / top.length;
        const sd = Math.sqrt(top.reduce((a, b) => a + (b - tm) ** 2, 0) / top.length);
        const fog = g.scene.fog.color.clone().convertLinearToSRGB();
        const fogD = Math.hypot(rgb[0] / top.length / 255 - fog.r, rgb[1] / top.length / 255 - fog.g, rgb[2] / top.length / 255 - fog.b);
        return { bits, sd: +sd.toFixed(4), fogD: +fogD.toFixed(3), year: g.engine.state(g.room) };
      });
      if (!ok(v)) { check(false, `${key} ${st} renders`, v); if (crashed) break; continue; }
      if (SHOTS) {
        // the place itself: the page's overlays (HUD, dock, minimap, subtitles; not the grade's tint and vignette) hidden for the picture
        await run(() => { for (const el of document.body.children) if (!el.contains(AZ.renderer.domElement) && !['tint', 'vignette'].includes(el.id)) { el.dataset.svyVis = el.style.visibility; el.style.visibility = 'hidden'; } return 'ok'; });
        await sp.screenshot({ path: path.join(SHOTS, `${key}_${st}.png`), timeout: 240000 }).catch((e) => console.log(`  (screenshot ${key} ${st}: ${e.message.split('\n')[0]})`));
        await run(() => { for (const el of document.body.children) if (el.dataset.svyVis !== undefined) { el.style.visibility = el.dataset.svyVis; delete el.dataset.svyVis; } return 'ok'; });
      }
      views.push({ key, place: m.place, sameAs: m.sameAs, st, ...v });
      console.log(`  hash ${key} ${st.padEnd(7)} ${v.bits.match(/.{4}/g).map((n) => parseInt(n, 2).toString(16)).join('')} sky sd ${v.sd} fog distance ${v.fogD}`);
      check(v.year === st && (v.sd >= 0.012 || v.fogD >= 0.05), `${key} ${st}: the top quarter is sky, not flat fog`, JSON.stringify({ sd: v.sd, fogD: v.fogD }));
    }
    if (crashed) lost++;
    await sp.close().catch(() => {});
  }
  check(!lost, 'every survey page stays up', `${lost} lost`);
  const alike = (a, b) => a.place === b.place || [].concat(a.sameAs || []).includes(b.place) || [].concat(b.sameAs || []).includes(a.place);
  const hd = (a, b) => [...a].reduce((n, c, i) => n + (c !== b[i] ? 1 : 0), 0);
  const pairs = [];
  for (const a of views) for (const b of views) {
    if (a.key >= b.key || alike(a, b)) continue;
    pairs.push({ a: `${a.key} ${a.st}`, b: `${b.key} ${b.st}`, d: hd(a.bits, b.bits) });
  }
  pairs.sort((x, y) => x.d - y.d);
  console.log(`  closest pairs: ${pairs.slice(0, 5).map((p) => `${p.a} / ${p.b}: ${p.d}`).join(', ')}`);
  if (process.env.LV_SURVEY_HASHES) fs.writeFileSync(process.env.LV_SURVEY_HASHES, JSON.stringify({ views, closest: pairs.slice(0, 20) }, null, 1));
  const want = ONLY.length ? 1 : 60;
  check(views.length >= want && (pairs.length || ONLY.length) && (pairs[0]?.d ?? 99) >= 18, `no two missions look alike: ${pairs.length} pairs of views in different places differ by 18 bits or more (closest ${pairs[0]?.d})`, JSON.stringify(pairs.slice(0, 5)));
}

// --- the voices, over the whole run ------------------------------------------------------------------------------
const heardAll = await az(() => ({ miss: (window.__voiceMiss || []).slice(0, 12), misses: (window.__voiceMiss || []).length, planMiss: LVB.planMiss.slice(0, 12), plans: LVB.planMiss.length, pending: LVB.pending, synth: window.__synthCalls, said: LVB.said.length, cues: [...new Set(AZ.edition.score.heard)] }));
check(heardAll.misses === 0 && heardAll.plans === 0 && heardAll.said > 200, `every line said (${heardAll.said}) is in the packs: no voice misses`, JSON.stringify(heardAll));
check(heardAll.synth === 0, 'speechSynthesis is never asked for anything', JSON.stringify(heardAll.synth));
check(['card', 'chapter', 'zero', 'ending:C'].every((c) => heardAll.cues.includes(c)), 'the cues card, chapter, zero and ending:C all played', JSON.stringify(heardAll.cues));

// --- saves --------------------------------------------------------------------------------------------------------
const keys = await az(() => { AZ.saveTo(0); return Object.keys(localStorage); });
check(keys.includes('afterzero.lv.slot.0') && !keys.includes('afterzero.slot.0') && !keys.includes('afterzero.save.v1'), 'this edition saves under its own namespace (afterzero.lv.*)', JSON.stringify(keys));
await page.close();
await survey();
check(errors.length === 0, 'no page errors', [...new Set(errors)].join(' | '));
await browser.close();
server.close();
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log(failures.map((f) => ' - ' + f).join('\n'));
  process.exit(1);
}
