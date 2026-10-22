// AFTERZERO: THE LAST VERSION OF EARTH (v2.0), played by a bot in the real game:
//   - the edition's title, chapter list, save slot and its own save namespace
//   - the Prologue from NEW GAME: Mission 1 (Rain City, the Zero Second, quest chain A with
//     Jun Park), Mission 2 (Helix in emergency light, the cells, the officer, the unit that
//     rewinds its damage), Mission 3 (the first switch, quest chain D with Iven Marr, the
//     anchor) and on into Act I
//   - Acts I and II played thread by thread from the Prologue's end to Act III (U7: LVP walks each mission's
//     objective, every line at its own length, with side stories; each mission's time is its telemetry):
//     Mission 5 (the river, the abandoned village's why, the gate, the machine buried or left; chain B),
//     Mission 8 (Rook confronted: rook_fate; the boot print; the last ten minutes; VERSION 17), Mission 9 (two
//     loops with other patrols, rain upward; the transmitter, Rhea, the tower), Mission 10 (troopers that see,
//     catch and remember; Echo Step), Mission 11 where REVERSE is taught (R does nothing before it, the music box
//     quieter as Kai approaches, a returning gurney's setback, the unlock in the records, R and the touch ⟲
//     button start and release a hold, a year switch releases it, the refusal, the charred file readable only
//     while held, a jammed bolt, a settled bolt through a save and a load, the lock that opens Ward 32;
//     LV_SHOT=<png> saves a screenshot of a hold), Mission 12 (a chase that never fails; the Witness's stair,
//     then Kai's REVERSE), Mission 13 (a shell from each side: ev_both_sides; the faction)
//   - Acts III and IV and the Finale played thread by thread (U8), with real movement where the sheets ask for it:
//     Mission 14 (2196 as home; the lift car that carries Kai up the bank), Mission 15 (the dual archive), Mission 16
//     (the spiral walked; three memories), Mission 17 (the confession), Mission 18 (the pylons' hold; the slab stair),
//     Mission 19 (the bridge in the reflection; the roads loop), Mission 20 (a memory refuses REVERSE; three memories
//     aligned), Mission 21 (the elites' rewind; the arena's gaps), Mission 22 (the arm's beat, the seals, the logs'
//     second), the Finale's two holds to Ending C, its epilogue and the voice in every speaker; then the CASE FILES
//     (fourteen stories) and one replayed from its place
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

// LV_ONLY=places: only the survey of the open places (at the end of this file); LV_ONLY=prologue: the Prologue
// from NEW GAME into Act I, and no further
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
  B.voices = [];
  const say = g.hud.say.bind(g.hud);
  B.planMiss = [];
  B.pending = 0;
  g.hud.say = (lines, facts, done) => {
    const ls = lines.filter((l) => !l.when || facts.test(l.when));
    B.said.push(...ls.map((l) => `${l.who}: ${l.text}`));
    B.voices.push(...ls.map((l) => ({ who: l.who, text: l.text, id: l.voice?.id || null, fx: l.voice?.fx || null })));
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
  // lines at their own length (nothing skipped): the game's time runs while anyone is talking
  B.talkOut = (max = 60) => { let t = 0; while (g.hud.talking && t < max) { g.simulate(0.1); t += 0.1; } return +t.toFixed(1); };
  // a walk through waypoints, with real movement; what is left of the last leg
  // (a choice clicked inside one evaluate can leave headless Chromium's pointer-lock change to open the pause menu)
  B.walk = (pts, secs = 30) => { if (g.menu === 'pause') g.closeMenu(); let left = 0; for (const [x, z] of pts) left = B.walkTo(x, z, secs); return +left.toFixed(2); };
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
    if (g.menu === 'pause') g.closeMenu();
    const held = g.deckWorld.sentinels.splice(0);
    const start = B.setbacks;
    let left = 0, n = 0;
    for (const [x, z] of pts) { left = B.walkTo(x, z, secs); if (left > 0.6 || B.setbacks > start) break; n++; }
    g.deckWorld.sentinels.push(...held);
    return { n, of: pts.length, left: +left.toFixed(2), at: g.player.pos.toArray().map((v) => +v.toFixed(2)), setbacks: B.setbacks - start, why: B.setbacks > start ? B.lastSetback : null,
      ...(n ? {} : { stopped: { menu: g.menu, talking: !!g.hud.talking, cinema: !!g.edition?.cinema?.active, playerCinema: !!g.player.cinema, catching: !!g.catching, transitioning: !!g.transitioning, paused: !!g.paused } }) };
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
  const moved = await page.waitForFunction((f) => !AZ.transitioning && JSON.stringify([AZ.campaign.chapter, AZ.campaign.deck, AZ.campaign.sector]) !== f, from, { timeout: 20000 }).then(() => true, () => false);
  if (!moved) check(false, `the campaign moved on from ${from} (it did not within 20 s)`); // (said here, not as a later mission's failure)
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
check(JSON.stringify(cards) === JSON.stringify(['PROLOGUE', 'ACT I', 'ACT II', 'ACT III', 'ACT IV', 'FINALE', 'CASE FILES']), 'its own chapter list', JSON.stringify(cards));
await page.click('#chapters [data-newch="prologue"]');
await page.waitForFunction(() => AZ.menu === 'saves', null, { timeout: 30000 });
await page.click('#saves [data-slot="0"]');
// (the Prologue's people may still be loading behind its card: the chapter starts once they are in)
await page.waitForFunction(() => AZ.started && AZ.room && AZ.mode === 'deck' && AZ.level?.place, null, { timeout: 300000 });
await az(() => { AZ.renderer.setAnimationLoop(null); }); // the bot drives time itself from here
// --- Mission 1: THE LAST NORMAL DAY, walked (OVERHAUL.md §11 U6: the timed run) -------------------------------------
// Kai walks every step with real movement, and every line plays at its own length (nothing is skipped): the simulated
// time from the new game to the staff gate is the bot's walk time for Mission 1, written to STATUS.md with the model's.
console.log('Mission 1: The Last Normal Day (walked, lines at their own length)');
const m1t0 = await az(() => AZ.time);
// the opening: the Prologue's card, the cold open before the title (Helix at 05:40), Mission 1's card, 08:02 at the door
await page.waitForFunction(() => { LVB.talkOut(1); return !AZ.edition.opening && !AZ.edition.cinema.active && AZ.voice.loading >= 1; }, null, { timeout: 180000, polling: 250 }).catch(() => {});
await az(() => LVB.talkOut(10));
const cardsSeen = await az(() => ({ heard: AZ.edition.score.heard.slice(), packs: AZ.voice.packs.map((p) => p.base), said: LVB.said.slice(0, 14) }));
check(['chapter', 'card'].every((c) => cardsSeen.heard.includes(c)) && cardsSeen.said.includes('NONE: The Prologue. The Zero Second.') && cardsSeen.said.includes('NONE: Mission one. The Last Normal Day.'),
  'a new game opens on the Prologue\'s card, then Mission 1\'s, both said and scored (cues chapter and card)', JSON.stringify(cardsSeen));
check(cardsSeen.packs.join() === 'assets/voice/lv/common/,assets/voice/lv/prologue/', 'the voices: the common pack and the Prologue\'s', JSON.stringify(cardsSeen.packs));
const cold = await az(() => ({ said: LVB.said.slice(0, 14), obj: document.querySelector('#objective .txt')?.textContent, why: document.querySelector('#objective .lvwhy')?.textContent }));
check(cold.said.indexOf('NONE: Rain City. 05:40.') >= 0 && cold.said.indexOf('NONE: Rain City. 05:40.') < cold.said.indexOf('NONE: Mission one. The Last Normal Day.')
  && cold.said.includes('NONE: At Helix Temporal Research, a card opens Chamber One. The name on the card is KAI VAREN.') && cold.said.includes('KAI: Twenty-three years today.'),
  'the cold open, before the title: at 05:40 a card opens Chamber One while Kai sleeps; then the card, and 08:02 at his door', JSON.stringify(cold.said));
check(cold.obj === 'Look at the photo by the door.' && cold.why === 'It is the anniversary. It always starts at the door.', 'the objective is the first thread, with its because line under it', JSON.stringify(cold));
const m1 = await az(() => ({ ...LVB.where(), state: AZ.engine.state(AZ.room), quarter: AZ.campaign.quarter }));
check(m1.chapter === 'prologue' && m1.deck === 0 && m1.state === 'PRESENT' && m1.quarter === 0, 'NEW GAME > PROLOGUE > slot 1 starts Mission 1 in the present, in its first quarter', JSON.stringify(m1));
const cast1 = await az(() => {
  const m = (id) => LVB.npc(id)?.model.userData.spec?.model;
  const crowd = AZ.deckWorld.npcs.filter((n) => n.n.crowd);
  return { guard: m('guard'), guardVariant: LVB.npc('guard')?.model.userData.lvVariant, toy: m('amb_child'), child: m('child'), mira: LVB.npc('mira')?.model.userData.lvVariant,
    crowd: crowd.length, visible: crowd.filter((n) => n.model.visible).length, walking: crowd.filter((n) => n.n.path).length, umbrellas: crowd.filter((n) => n.model.userData.umbrella).length, people: AZ.deckWorld.npcs.length };
});
check(cast1.guard === 'rb_security_f' && cast1.guardVariant === 'helix', 'Mission 1\'s checkpoint officer is a security officer in Helix black (rb_security_f), not a doctor', JSON.stringify(cast1));
check(cast1.toy === 'rb_child_m2' && cast1.child === 'rb_child_f', 'the toy child and the Child in the Station have children\'s bodies', JSON.stringify(cast1));
check(cast1.visible >= 10 && cast1.walking >= 8 && cast1.umbrellas >= 3 && cast1.people <= 24, 'Rain City\'s crowds walk Mission 1, umbrellas up (within 24 people)', JSON.stringify(cast1));
// the photo by the door, then up the avenue: the anomalies (a puddle, the toy, the pigeon)
const photo = await az(() => { const r = { walk: LVB.walk([[12.6, -3.2]]) }; r.use = LVB.use('photo'); LVB.talkOut(); return { ...r, ...LVB.f('ev_mira_photo', 't_m01_photo'), obj: AZ.edition.threads.current()?.id }; });
check(photo.ev_mira_photo && photo.t_m01_photo && photo.obj === 'anomalies', 'the photo by the door (ev_mira_photo); the objective moves on to the avenue\'s anomalies', JSON.stringify(photo));
const walked = await az(() => { const z0 = AZ.player.pos.z; const left = LVB.walk([[10.5, -14]]); return [z0, AZ.player.pos.z, AZ.level.place, AZ.room, left]; });
check(walked[1] < walked[0] - 6 && walked[2] === 'rain_south', 'you walk up the avenue of Rain City South (an open place under the sky)', JSON.stringify(walked));
const anomalies = await az(() => {
  const r = {};
  r.puddle = [LVB.walk([[10.5, -29.6]]), LVB.use('puddle'), LVB.talkOut()];
  r.toy = [LVB.walk([[2, -29.4], [-10, -29.4], [-16.4, -31]]), LVB.use('toy'), LVB.talkOut()];
  r.pigeon = [LVB.walk([[-11, -36.5]]), LVB.use('pigeon'), LVB.talkOut()];
  return { ...r, ...LVB.f('ev_puddle', 'ev_toy', 'ev_pigeon', 't_m01_anomalies'), obj: AZ.edition.threads.current()?.id };
});
check(anomalies.ev_puddle && anomalies.ev_toy && anomalies.ev_pigeon && anomalies.t_m01_anomalies && anomalies.obj === 'deduce', 'three of the avenue\'s anomalies: the ripple before the drop, the toy that un-falls, the pigeon that lands backwards', JSON.stringify(anomalies));
// the florist's side story (the market lane): an older Kai bought the flowers at 08:04
const florist = await az(() => { const r = { walk: LVB.walk([[-16, -29.4], [-23.6, -27.6]]) }; r.use = LVB.use('florist'); LVB.talkOut(); return { ...r, ...LVB.f('ev_florist'), said: LVB.said.some((l) => l.includes('Grey at the temples, same coat, a scar on the wrist.')) }; });
check(florist.ev_florist && florist.said, 'the florist: "You already came in. Ten minutes ago." An older man with a scar, a receipt for 08:04', JSON.stringify(florist));
// to the plaza: Rook calls on the way; the deduction at the clock
const rook = await az(() => { const left = LVB.walk([[-10, -29.4], [-9.5, -50], [-6, -66], [0, -74]]); LVB.talkOut(); return [AZ.facts.get('rook_message'), LVB.said.includes('ROOK: Kai. Where are you.'), left]; });
check(rook[0] && rook[1], 'Rook calls on the way into the plaza', JSON.stringify(rook));
const deduce = await az(() => {
  const r = { walk: LVB.walk([[1.4, -84.4]]) };
  r.use = LVB.use('deduce_deduce'); LVB.talkOut();
  r.menu = AZ.menu;
  r.wrong = LVB.choose('challenge'); LVB.talkOut();
  r.open = !AZ.facts.get('t_m01_deduce');
  LVB.use('deduce_deduce'); LVB.talkOut();
  r.right = LVB.choose('investigate'); LVB.talkOut();
  return { ...r, ...LVB.f('ev_minute_814', 't_m01_deduce'), said: LVB.said.includes('KAI: Everything odd is running backwards toward the same minute: 8:14.') };
});
check(deduce.menu === 'choice' && deduce.open && deduce.ev_minute_814 && deduce.t_m01_deduce && deduce.said, 'the deduction at the plaza clock: a wrong answer leaves it open; "Everything odd is running backwards toward the same minute: 8:14."', JSON.stringify(deduce));
// the checkpoint, with real input: look at Officer Pryce and press E
const toGuard = await az(() => { const left = LVB.walk([[0, -98], [-1.4, -105.4]]); const n = LVB.npc('guard').model.position; AZ.player.H.set(n.x - AZ.player.pos.x, 0, n.z - AZ.player.pos.z).normalize(); AZ.simulate(0.2); AZ.focus = AZ.findFocus(); if (AZ.menu === 'pause') AZ.closeMenu(); return { left, focus: AZ.focus?.id, menu: AZ.menu }; });
await page.keyboard.press('KeyE');
await frame();
await az(() => LVB.talkOut());
const guard = await az(() => [AZ.menu, [...document.querySelectorAll('#choice [data-choice] small')].map((s) => s.textContent), LVB.said.slice(-5)]);
check(guard[0] === 'choice' && ['INVESTIGATE', 'CHALLENGE', 'COMFORT', 'WITHDRAW'].every((k) => guard[1].includes(k)), 'talking to the officer offers four intents', JSON.stringify([toGuard, guard]));
check(guard[2].includes('CREW: Says here you badged into Chamber One at 05:40.') && guard[2].includes('KAI: At 05:40 I was asleep.'), 'Officer Pryce: "Says here you badged into Chamber One at 05:40." / "At 05:40 I was asleep."', JSON.stringify(guard[2]));
const pryceVoice = await az(() => LVB.voices.find((v) => v.text === 'Says here you badged into Chamber One at 05:40.'));
check(pryceVoice?.id === 'PRYCE', 'her line is said in Officer Pryce\'s own recorded voice', JSON.stringify(pryceVoice));
await page.click('#choice button.comfort', { timeout: 5000 }).catch((e) => console.log('  (comfort click)', e.message.split('\n')[0]));
check(await az(() => { LVB.talkOut(); return AZ.facts.get('checkpoint_passed') && AZ.facts.get('trust_guard') === 1; }), 'comfort gets you through and the officer trusts you more');
// the station: Jun and the board; then the minute comes
const station = await az(() => {
  const r = { walk: LVB.walk([[0, -110], [0, -128], [0, -136], [0, -148.5], [-20, -150.6], [-23.2, -150.6]]), quarter: AZ.campaign.quarter };
  r.use = LVB.use('jun');
  return r;
});
// (Jun's lines play out, but the duck is checked at the minute itself: the Zero Second may come while he talks)
await az(() => { for (let t = 0; AZ.hud.talking && !AZ.facts.get('zero_second') && t < 60; t += 0.1) AZ.simulate(0.1); });
for (let i = 0; i < 40 && !(await az(() => AZ.facts.get('zero_second'))); i++) await az(() => { AZ.simulate(0.1); });
await page.waitForTimeout(300); // (the duck is in the sound's own time)
const duck = await az(() => ({ voice: +AZ.audio.voiceBus.gain.value.toFixed(3), music: +AZ.audio.music.gain.value.toFixed(4), amb: +AZ.audio.amb.gain.value.toFixed(4), heard: AZ.edition.score.heard.includes('zero') }));
check(station.quarter === 2 && (await az(() => AZ.facts.get('jun_board'))), 'Jun Park: the board says the 41 arrives yesterday (LINE 41, the third quarter)', JSON.stringify(station));
check(duck.heard && duck.voice === 1 && duck.music < 0.05, 'the Zero Second\'s cue: the music ducks for a second while the voices stay at full level', JSON.stringify(duck));
const zero = await az(() => { LVB.talkOut(); AZ.simulate(4); LVB.talkOut(); return { ...LVB.f('zero_second', 'after_zero'), said: LVB.said.includes('NONE: All the clocks stop.'), train: AZ.deckWorld.dynamic.some((d) => d.el.mat === 'car' && d.mesh.visible) }; });
check(zero.zero_second && zero.after_zero && zero.said && zero.train, 'the Zero Second: the clocks stop and the 41 comes in', JSON.stringify(zero));
// quest chain A: Last Train Home
const jun = await az(() => { LVB.walk([[-23.2, -150.6]]); const u = LVB.use('jun'); LVB.talkOut(); return [u, AZ.menu, LVB.said.slice(-3)]; });
check(jun[1] === 'choice' && jun[2].some((l) => l.includes('The train keeps arriving.')), 'Jun Park: "The train keeps arriving..."', JSON.stringify(jun));
await az(() => { LVB.choose('investigate'); LVB.talkOut(); });
const relay = await az(() => {
  LVB.walk([[-27.4, -155.6]]);
  const u = LVB.use('relay');
  LVB.talkOut();
  let t = 0;
  // (the lines play at their own length, but the 8:13 minute is looked for while they do: it lasts seven seconds,
  // and the announcement and a passer-by's line after it can be longer than that)
  while (AZ.engine.state(AZ.room) !== 'PAST' && t < 50) {
    AZ.simulate(0.25);
    t += 0.25;
    for (let k = 0; k < 600 && AZ.hud.talking && AZ.engine.state(AZ.room) !== 'PAST'; k++) AZ.simulate(0.1);
  }
  const junEcho = !!LVB.npc('jun')?.isEcho;
  return { u, t, past: AZ.engine.state(AZ.room), junEcho, cands: !!LVB.cand('reroute'), quest: AZ.facts.get('quest_jun') };
});
check(relay.quest === 'active' && relay.past === 'PAST' && relay.cands, 'every 41 seconds the station falls back to 8:13, and the relay works there', JSON.stringify(relay));
check(relay.junEcho, 'Jun is not at 8:13 the way he is now: his echo stands in the booth');
const reroute = await az(() => {
  const u = LVB.use('reroute');
  LVB.talkOut();
  let t = 0;
  while (AZ.engine.state(AZ.room) !== 'PRESENT' && t < 12) { AZ.simulate(0.25); t += 0.25; }
  const v = LVB.use('relay_choice');
  LVB.talkOut();
  return [u, v, AZ.menu, LVB.f('jun_rerouted')];
});
check(reroute[2] === 'choice' && reroute[3].jun_rerouted, 'rerouted at 8:13; back in the present, the line or the evidence', JSON.stringify(reroute));
await az(() => { LVB.choose('comfort'); LVB.talkOut(); });
check(await az(() => AZ.facts.get('jun_line') && AZ.facts.get('quest_jun') === 'resolved'), 'quest chain A resolved: the passengers get off the 41');
// the rescue: on the second, the door glass opens Kai's wrist; Rook; the voice in every speaker; the woman
const rescued = await az(() => {
  LVB.walk([[-12, -156], [4.8, -160.4]]);
  LVB.use('trapped_a'); LVB.talkOut();
  LVB.walk([[13.6, -161.2]]);
  LVB.use('trapped_b'); LVB.talkOut();
  for (let t = 0; t < 40 && !AZ.facts.get('voice_heard'); t += 0.1) { AZ.simulate(0.1); LVB.talkOut(); }
  LVB.talkOut();
  return { ...LVB.f('rescued', 'wrist_cut', 'voice_heard'), said: LVB.said.includes('VOICE: Kai Varen. Do not build the machine.') && LVB.said.includes('ROOK: The event lasted one second.'), wrist: LVB.said.includes('NONE: The broken door glass opens your wrist on the way out. A clean curve, like a bracket.'), man: LVB.voices.find((v) => v.text === 'Your wrist—')?.id };
});
check(rescued.rescued && rescued.voice_heard && rescued.said, 'the rescue; "The event lasted one second."; every speaker: "Do not build the machine."', JSON.stringify(rescued));
check(rescued.wrist_cut && rescued.wrist && rescued.man === 'CROWD_M', 'on the second rescue the door glass opens Kai\'s wrist (wrist_cut); "Your wrist—" in the man\'s own voice', JSON.stringify(rescued));
// the pursuit: the woman walks ahead of Kai, waits while he is far, and is gone at the staff gate; the raincoat
const chase = await az(() => {
  const m = LVB.npc('mira');
  const r = { visible: m?.model.visible, start: m && [+m.model.position.x.toFixed(1), +m.model.position.z.toFixed(1)] };
  AZ.simulate(3);
  r.waited = m && Math.hypot(m.model.position.x - r.start[0], m.model.position.z - r.start[1]) < 0.3; // (Kai is 25 m away)
  LVB.walk([[26, -160], [29.5, -165], [29.5, -177.5], [12, -181]]);
  r.moved = Math.hypot(m.model.position.x - r.start[0], m.model.position.z - r.start[1]) > 1;
  let lead = 99;
  const steps = [[3, -185], [1, -192], [0.5, -200], [0.6, -210], [0.8, -217]];
  for (const [x, z] of steps) {
    LVB.walk([[x, z]]);
    if (m.model.visible) lead = Math.min(lead, Math.hypot(m.model.position.x - AZ.player.pos.x, m.model.position.z - AZ.player.pos.z));
  }
  for (let t = 0; t < 20 && !AZ.facts.get('mira_gone'); t += 0.1) AZ.simulate(0.1);
  LVB.talkOut();
  return { ...r, lead: +lead.toFixed(1), ...LVB.f('mira_gone', 't_m01_chase'), said: LVB.said.some((l) => l.includes('On the wet steps she leaves a yellow raincoat.')), coat: !!LVB.cand('raincoat') };
});
check(chase.visible && chase.waited && chase.moved && chase.mira_gone && chase.t_m01_chase && chase.said && chase.coat, 'the pursuit: the woman with Mira\'s face waits while Kai is far, walks ahead of him to the staff gate, and is gone; a yellow raincoat on the steps', JSON.stringify(chase));
const coat = await az(() => { LVB.walk([[1.0, -221.4]]); LVB.use('raincoat'); LVB.talkOut(); AZ.simulate(0.3); return { ...LVB.f('raincoat', 'beat_done'), gate: LVB.gate() }; });
check(coat.raincoat && coat.beat_done && coat.gate === false, 'the raincoat is Kai\'s now (raincoat); the staff gate opens', JSON.stringify(coat));
const m1t1 = await az(() => AZ.time);
const m1min = +((m1t1 - m1t0) / 60).toFixed(1);
console.log(`  (Mission 1 walked by the bot: ${m1min} min of game time, lines at their own length, with the florist and Last Train Home)`);
check(m1min > 5, `Mission 1, walked: ${m1min} min of game time`, String(m1min));
// a save and a load: the mission comes back at the furthest quarter it reached (LINE 41), after a PREVIOUSLY card
const resume = await az(() => {
  const q = AZ.campaign.quarter;
  AZ.saveTo(0);
  AZ.load(0);
  return q;
});
// the PREVIOUSLY card: a tap on SKIP (the button, as a touch screen has it) ends it at once
await page.waitForFunction(() => { LVB.step(0.05); return AZ.edition.opening?.previously && AZ.edition.cinema.active; }, null, { timeout: 120000, polling: 250 }).catch(() => {});
const skipTap = await az(() => { const b = document.querySelector('#lvSkip'); const shown = getComputedStyle(b).display !== 'none'; b.click(); AZ.simulate(0.1); return { shown, opening: !!AZ.edition.opening, cine: !!AZ.edition.cinema.active }; });
check(skipTap.shown && !skipTap.opening && !skipTap.cine, 'the SKIP button (a tap) ends the PREVIOUSLY card at once', JSON.stringify(skipTap));
await page.waitForFunction(() => { LVB.talkOut(1); return !AZ.edition.opening && !AZ.edition.cinema.active && AZ.voice.loading >= 1; }, null, { timeout: 120000, polling: 250 }).catch(() => {});
const back = await az(() => { const lm = LVB.lm('platform'); return { quarter: AZ.campaign.quarter, room: AZ.room, at: AZ.player.pos.toArray().map((v) => +v.toFixed(1)), d: Math.hypot(AZ.player.pos.x - lm[0], AZ.player.pos.z - lm[2]), prev: LVB.said.includes('NONE: Rain City, 2049.'), done: !!AZ.deckWorld.flags.beat_done, raincoat: AZ.facts.get('raincoat') }; });
check(resume === 2 && back.quarter === 2 && back.d < 1 && back.prev && back.done && back.raincoat, 'an M1 save loads at the furthest quarter reached (LINE 41), after a PREVIOUSLY card; its facts and flags kept', JSON.stringify({ resume, back }));
await az(() => { LVB.walk([[26, -158], [29.5, -165], [29.5, -177.5], [3, -185], [1, -192], [0.5, -205], [0.5, -225]]); LVB.skip(); }); // (the exit is past the staff gate, z < -222)
// Mission 2's opening: its cold open plays before its card; SKIP ends the whole opening at once
await page.waitForFunction(() => { LVB.step(0.1); return AZ.campaign.deck === 1 && !AZ.transitioning && AZ.edition.cinema.active && LVB.said.some((l) => l.startsWith('IVEN: Test')); }, null, { timeout: 180000, polling: 250 }).catch(() => {});
const skipBefore = await az(() => ({ deck: AZ.campaign.deck, opening: !!AZ.edition.opening, cine: !!AZ.edition.cinema.active, btn: getComputedStyle(document.querySelector('#lvSkip')).display }));
// (at play on a desktop the pointer is locked and the button cannot be clicked: Enter is SKIP's key)
await press('Enter');
await az(() => { AZ.simulate(0.3); });
const skipAfter = await az(() => ({ opening: !!AZ.edition.opening, cine: !!AZ.edition.cinema.active, card: document.querySelector('#card').classList.contains('on'), card2: LVB.said.includes('NONE: Mission two. Helix Goes Dark.') }));
check(skipBefore.deck === 1 && skipBefore.opening && skipBefore.cine && skipBefore.btn !== 'none' && !skipAfter.opening && !skipAfter.cine && !skipAfter.card && !skipAfter.card2,
  'the cold-open skip: SKIP (Enter) ends Mission 2\'s opening at once (its cold open and its card), and the mission starts', JSON.stringify({ skipBefore, skipAfter }));
await az(() => { AZ.simulate(0.3); LVB.skip(); });
check((await az(() => LVB.where())).deck === 1, 'through the staff gate, after the hook: Mission 2');
const hook1 = await az(() => LVB.said.includes('KAI: She died twenty-three years ago. I was at the funeral. I was twelve.') && LVB.said.includes('NONE: One voicemail. Received 05:40. Caller unknown.'));
check(hook1, 'the hook: "She died twenty-three years ago..." One voicemail, received 05:40, caller unknown');

// --- Mission 2: HELIX GOES DARK -------------------------------------------------------------------------------------
console.log('Mission 2: Helix Goes Dark');
const dark = await az(() => ({ dark: AZ.story.after.dark, room: AZ.room, ambience: AZ.edition.deck.ambience, skip: getComputedStyle(document.querySelector('#lvSkip')).display, said: LVB.said.slice(-4), opening: !!AZ.edition.opening,
  cold: LVB.said.includes('IVEN: Test\'s at 05:40 now? Who moved it?') && LVB.said.includes('ROOK: My office.') }));
check(dark.dark > 0 && dark.room === 'security', 'Helix under emergency light', JSON.stringify(dark));
check(dark.cold && dark.skip === 'none', 'Mission 2\'s cold open: what the lobby kept of 05:38, Iven and Rook', JSON.stringify(dark));
const m2 = await az(() => {
  const r = {};
  LVB.at('security', 0, -2.6);
  r.print = [LVB.go('print', 0, 1.2), LVB.use('print')]; LVB.skip();
  r.lin = LVB.use('lin'); LVB.skip();
  r.linSaid = LVB.said.some((l) => l.includes('Nobody remembers hiring me.'));
  r.shadow = LVB.said.includes('NONE: Under the emergency light she has no shadow. Nobody in the lobby would think to look.');
  r.intercom = LVB.use('intercom'); LVB.skip();
  r.peg = LVB.use('peg'); LVB.skip();
  return { ...r, ...LVB.f('ev_site_zero_print', 'lin_met', 'intercom_heard', 'ev_lin_peg') };
});
check(m2.ev_site_zero_print && m2.lin_met && m2.linSaid && m2.shadow && m2.intercom_heard, 'the lobby: the Site Zero print; Dr. Lin, whom nobody remembers hiring, with no shadow; Rook on the intercom', JSON.stringify(m2));
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
const officer = await az(() => {
  const r = {};
  LVB.at('records', 4, -3.6);
  LVB.use('rec_dale');
  AZ.simulate(0.2);
  r.holo = AZ.facts.get('holo_dale') && !!LVB.npc('holo_rec_dale')?.model.visible;
  r.voice = LVB.voices.find((v) => v.text.startsWith('Dale, chamber watch.'));
  LVB.skip();
  r.after = !AZ.facts.get('holo_dale');
  LVB.at('records', 5, -4); LVB.use('door_log'); LVB.skip();
  LVB.at('records', 0, -10.8); LVB.use('whose_code'); LVB.skip(); r.c = LVB.choose('Dale'); LVB.skip();
  return { ...r, ...LVB.f('officer_trusted', 'ev_door_log') };
});
check(officer.officer_trusted && officer.ev_door_log, 'the recordings, the roster and the door log name the officer to trust: Dale', JSON.stringify(officer));
check(officer.holo && officer.after && officer.voice?.id === 'DALE' && officer.voice?.fx === 'recording', 'Dale\'s statement plays in his own voice through the recording, his hologram over the recorder while it plays', JSON.stringify(officer));
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
const drawing = await az(() => { LVB.at('archive', -3, -10.4); LVB.use('pass'); LVB.skip(); LVB.at('archive', 0, -12); LVB.use('drawing'); LVB.skip(); return [LVB.said.includes('KAI: This drawing is twenty-three years old.'), LVB.f('drawing_seen', 'ev_junior_pass')]; });
check(drawing[0] && drawing[1].drawing_seen && drawing[1].ev_junior_pass, '"This drawing is twenty-three years old." / "I was twelve." The junior pass: OVERRIDE 14-03-2026 16:02');
// the glass lift into the oculus: walk in, and it carries Kai down into the chamber, where Rook is in the way
const lift = await az(() => { LVB.at('liftAtrium', 0, -5.5); for (let i = 0; i < 30; i++) AZ.simulate(0.05); return { room: AZ.room, y: +AZ.player.pos.y.toFixed(1), down: !!AZ.facts.get('lift_down') }; });
check(lift.room === 'chamber' && lift.y < -8 && lift.down, 'the glass lift carries Kai down into the chamber under the oculus', JSON.stringify(lift));
const blocked = await az(() => { const z0 = AZ.player.pos.z; const w = LVB.w('chamber', 0, -9); LVB.walkTo(w[0], w[1], 4); return { moved: +(z0 - AZ.player.pos.z).toFixed(2), rook: LVB.npc('rook_door')?.model.userData.spec?.model }; });
const rookDoor = await az(() => { LVB.use('rook_door'); LVB.skip(); const menu = AZ.menu; const opts = [...document.querySelectorAll('#choice [data-choice]')].map((b) => b.className); const c = LVB.choose('comfort'); LVB.skip(); return { menu, opts, c, ...LVB.f('rook_door', 'trust_rook'), said: LVB.said.includes('ROOK: Go in, then. You were always going to.') && LVB.said.includes('ROOK: Because you built the activation system, Kai. Did you think it was for clocks?') }; });
check(blocked.moved < 3 && blocked.rook === 'rb_rook', 'Rook, in person, stands in the chamber door; a security line holds Kai back', JSON.stringify(blocked));
check(rookDoor.menu === 'choice' && rookDoor.opts.includes('challenge') && rookDoor.rook_door && rookDoor.trust_rook === 1 && rookDoor.said, 'Rook at the chamber door: "Did you think it was for clocks?"; comfort sets trust_rook +1; "Go in, then. You were always going to."', JSON.stringify(rookDoor));
const chrono = await az(() => { LVB.at('chamber', 0, -6); LVB.use('chronolith_walk'); LVB.skip(); AZ.simulate(1.2); LVB.skip(); return { ...LVB.f('chronolith_seen', 'beat_done'), leaving: AZ.transitioning }; });
check(chrono.chronolith_seen && chrono.beat_done && chrono.leaving, 'the Chronolith chamber: touch nothing (and the mission ends on its own)', JSON.stringify(chrono));
await nextPlace();
check((await az(() => LVB.where())).deck === 2 && (await az(() => LVB.said.includes('NONE: In the black stone his reflection arrives half a second late.'))), 'Mission 2 ends on its own, on the hook (his reflection, half a second late): Mission 3');

// --- Mission 3: THE FIRST SWITCH ---------------------------------------------------------------------------------------
console.log('Mission 3: The First Switch');
const touch = await az(() => { for (let t = 0; t < 30 && !AZ.facts.get('first_cycle'); t += 0.2) { AZ.simulate(0.2); LVB.skip(); } return { ...LVB.f('has_chronolith', 'wrist_mark', 'first_cycle'), sealed: LVB.said.includes('KAI: It sealed it.'), said: LVB.said.includes('KAI: Which one is real?') }; });
check(touch.has_chronolith && touch.wrist_mark && touch.sealed, 'the cold open: the ring takes his hand, and the cut on his wrist seals into a circle with a broken halo (wrist_mark)', JSON.stringify(touch));
check(touch.first_cycle && touch.said, 'the first cycle: "Which one is real?" / "All of them."', JSON.stringify(touch));
await frame();
const pips = await az(() => [...document.querySelectorAll('#state .pip')].map((p) => p.textContent));
check(JSON.stringify(pips) === JSON.stringify(['12049', '22026', '32196']), 'the HUD names this place\'s three years', JSON.stringify(pips));
// up into the lab; in 2026 its south wall is only a frame: out across the court to Rook's dig, walked
const dig = await az(() => {
  const r = {};
  LVB.at('cable', 0, -3);
  AZ.simulate(0.2);
  r.lab = !!AZ.facts.get('t_m03_lab');
  r.glass = LVB.route([[40.8, -1]]).n === 0; // (2049: glass)
  AZ.edition.shift('PAST'); AZ.simulate(0.1);
  LVB.place(40.8, -6);
  r.out = LVB.route([[40.8, -1], [37, 0], [16, 14], [16, 31], [-5, 31]], 30);
  r.room = AZ.room;
  r.stab = +AZ.edition.stability.toFixed(2);
  r.digT = !!AZ.facts.get('t_m03_dig');
  r.log = [LVB.walk([[-10.4, 28.7]]), LVB.use('dig_log')]; LVB.skip();
  r.thermos = [LVB.use('dig_thermos')]; LVB.skip();
  r.polaroid = [LVB.use('dig_polaroid')]; LVB.skip();
  r.quarter = AZ.campaign.quarter;
  return { ...r, ...LVB.f('ev_site_zero', 'ev_thermos_er', 'ev_polaroid', 't_m03_office') };
});
check(dig.lab && dig.glass && dig.out.n === dig.out.of && dig.digT && dig.stab > 0.5, 'in 2049 the lab\'s south wall is glass; in 2026 it is a frame, and Kai walks out across the court to the dig (the court holds the Chronolith steady)', JSON.stringify(dig));
check(dig.ev_site_zero && dig.ev_thermos_er && dig.ev_polaroid && dig.t_m03_office && dig.quarter === 2, 'the 2026 excavation office: SITE ZERO, E. ROOK, found in a drained riverbed (ev_site_zero); the E.R. thermos; the Polaroid', JSON.stringify(dig));
const cable = await az(() => {
  const r = {};
  r.take = LVB.use('cable');
  r.held = AZ.held;
  r.back = LVB.route([[16, 31], [16, 14], [37, 0], [40.8, -1], [40.8, -6]], 30);
  LVB.at('cable', 4.4, -14); r.plug = LVB.use('cable_socket'); LVB.skip();
  return { ...r, ...LVB.f('cable_connected') };
});
check(cable.held === 'cable' && cable.back.n === cable.back.of && cable.cable_connected, 'the cable from the dig, carried back into the lab in 2026 and connected there', JSON.stringify(cable));
await press('Digit1');
check(await az(() => { LVB.at('cable', 0, -14.6); LVB.step(0.2); LVB.use('power'); LVB.skip(); return AZ.engine.state(AZ.room) === 'PRESENT' && AZ.facts.get('power_on'); }), 'key 1: 2049, and the power a 2026 cable carries comes on');
const cross = await az(() => {
  LVB.at('collapse', 0, -4.5);
  AZ.edition.shift('FUTURE');
  const before = AZ.edition.stability;
  const far = LVB.w('collapse', 0, -18.5);
  const left = LVB.walkTo(far[0], far[1], 10);
  const r = { left, y: AZ.player.pos.y, crossed: AZ.facts.get('crossed'), drained: AZ.edition.stability < before, setbacks: LVB.setbacks };
  LVB.skip();
  r.plaque = LVB.use('plaque'); LVB.skip();
  r.remember = LVB.said.includes('KAI: Remember what?');
  AZ.edition.shift('PRESENT');
  LVB.skip();
  return { ...r, ...LVB.f('ev_plaque2196') };
});
check(cross.crossed && cross.left < 1 && cross.y > 0.5 && cross.drained, 'in 2196 you walk across the collapsed hall on a parked lift, and stability drains', JSON.stringify(cross));
check(cross.ev_plaque2196 && cross.remember, 'the 2196 plaque: HELIX. WHERE THE FRACTURE BEGAN. WE REMEMBER. / "Remember what?"', JSON.stringify(cross));
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
  LVB.at('control', 0, -12.6); LVB.use('panel'); LVB.skip(); AZ.simulate(1.5); LVB.skip(); AZ.simulate(2.0); LVB.skip();
  return { ...LVB.f('open_control', 'fractured', 'fracture_done', 'beat_done'), said: LVB.said.includes('ROOK: That isn\'t a date. That\'s a number. Minus three thousand and—') && LVB.said.includes('KAI: Connected in 2026. Switched on in 2049. That should not work.') };
});
check(fracture.fractured && fracture.fracture_done && fracture.beat_done && fracture.said, 'the control panel: "Connected in 2026. Switched on in 2049." Rook reads a number, minus three thousand, and the facility fractures', JSON.stringify(fracture));
await nextPlace();
const act1 = await az(() => ({ ...LVB.where(), name: AZ.edition.deck.name, fell: LVB.said.includes('NONE: Kai Varen falls out of 2049 and lands somewhere older than the building.'), prev: LVB.said.includes('NONE: Kai Varen built a machine he was told not to build.') }));
check(act1.chapter === 'act1' && act1.deck === 0 && act1.name === 'THE MAN FROM THE LAST DAY' && act1.fell, 'the Prologue ends on its hook ("...lands somewhere older than the building"); Act I begins with Mission 4', JSON.stringify(act1));
check(act1.prev, 'Act I opens on its PREVIOUSLY card: "Kai Varen built a machine he was told not to build."', JSON.stringify(act1));
const crowd4 = await az(() => { const c = AZ.deckWorld.npcs.filter((n) => n.n.crowd && n.model.visible); return { n: c.length, models: [...new Set(c.map((n) => n.model.userData.spec?.model))] }; });
check(crowd4.n >= 5 && crowd4.models.every((m) => ['rb_robe_m', 'rb_tala', 'rb_child_f2'].includes(m)), 'the settlement\'s people walk Mission 4, in homespun (not the Elder\'s face: she is in this mission)', JSON.stringify(crowd4));
check(await az(() => AZ.facts.get('m01_done') && AZ.facts.get('m02_done') && AZ.facts.get('m03_done')), 'the three prologue missions are recorded as done');
const times = await az(() => ({ m01: AZ.facts.get('time_m01'), m02: AZ.facts.get('time_m02'), m03: AZ.facts.get('time_m03') }));
check(times.m01 > 0 && times.m02 > 0 && times.m03 > 0, 'telemetry: each mission\'s time is stored as it ends (time_<mkey>)', JSON.stringify(times));
// the case board: THE QUESTIONS, SIDE STORIES (with a track button), WHAT YOU CHOSE, ABILITIES
const board = await az(() => { const el = document.createElement('div'); AZ.edition.renderJournal(AZ, el); const h = [...el.querySelectorAll('h3')].map((x) => x.textContent); return { h, q: el.querySelector('.questions')?.textContent || '', chose: el.innerHTML.includes('Officer Pryce let you through on a long morning.') }; });
check(['THE QUESTIONS', 'ABILITIES', 'SIDE STORIES', 'WHAT YOU CHOSE'].every((x) => board.h.includes(x)) && /How can the machine predate its inventors\?/.test(board.q) && /Who used my card at 05:40/.test(board.q) && board.chose,
  'the case board: THE QUESTIONS (the Prologue\'s and Act I\'s), ABILITIES, SIDE STORIES, WHAT YOU CHOSE', JSON.stringify(board));
if (process.env.LV_ONLY === 'prologue') {
  check(errors.length === 0, 'no page errors', [...new Set(errors)].join(' | '));
  await browser.close();
  server.close();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) console.log(failures.map((f) => ' - ' + f).join('\n'));
  process.exit(failures.length ? 1 : 0);
}

// --- Acts I and II, played thread by thread (OVERHAUL.md §11 U7) -------------------------------------------------------
// Missions 4 to 13 in order, from the Prologue's end to Act III: each mission's main threads as its objective shows them
// (LVP below), real movement where a straight walk gets there (Kai is placed, and the metres counted, where stairs,
// terraces or a wall are in the way), every line at its own length, one side story or more in each. The time each
// mission took (time_<mkey>, the game's own telemetry) is the bot's walk time, written to STATUS.md with the model's.
console.log('Acts I and II: Missions 4 to 13, played thread by thread');
const PLAYER = () => {
  // LVP: a player for a rewritten mission, thread by thread (Threads.js): it walks to each thread's landmark with real
  // movement (placed where a straight walk cannot get there, and counted), uses what is there in the year it answers
  // in, plays every line at its own length, answers deductions from the evidence, puts recovered pieces in order,
  // REVERSEs processes by aiming at them, waits out loops and staged moments, and keeps a log.
  const g = AZ, B = LVB;
  const P = (window.LVP = { log: [], placed: 0, walked: 0, metres: 0, short: 0 });
  const th = () => g.edition.threads;
  P.deck = () => g.edition.deck;
  P.mk = () => g.edition.deck?.mkey;
  P.done = (t) => th().done(t);
  P.f = (k) => g.facts.get(k);
  P.year = (st) => {
    if (!st || g.engine.state(g.room) === st || !g.engine.statesOf(g.room).includes(st)) return;
    g.edition.shift(st);
    g.simulate(0.2);
  };
  P.present = () => P.year(g.engine.baseline);
  // the years a condition asks for (@PAST, !@PAST), in the mission's own years
  P.yearsOf = (...conds) => {
    const all = g.engine.statesOf(g.room);
    let ok = all.slice();
    for (const c of conds.filter(Boolean)) {
      for (const m of String(c).matchAll(/(!?)@(PAST|PRESENT|FUTURE)/g)) ok = ok.filter((s) => (m[1] ? s !== m[2] : s === m[2]));
    }
    return ok.length ? ok : all;
  };
  // out of the past before the Chronolith tires (as a player would: back to the present, and wait)
  P.rest = () => {
    if (g.edition.stability < 0.45) {
      P.present();
      for (let t = 0; t < 12 && g.edition.stability < 0.95; t += 0.5) g.simulate(0.5);
    }
  };
  // every line at its own length; a choice by the bot's policy
  P.pick = null;
  P.out = (max = 120) => {
    let t = 0;
    for (let k = 0; k < 40 && t < max; k++) {
      t += B.talkOut(max);
      if (g.menu === 'choice') {
        P.choose();
        continue;
      }
      if (g.menu === 'pause') g.closeMenu();
      if (!g.hud.talking) break;
    }
    return t;
  };
  P.choose = () => {
    const bs = [...document.querySelectorAll('#choice [data-choice]')];
    const want = P.pick ? P.pick(bs.map((b) => ({ cls: b.className, text: b.textContent }))) : 0;
    const b = typeof want === 'number' ? bs[want] || bs[0] : bs.find((x) => x.className.includes(want) || x.textContent.includes(want)) || bs[0];
    P.log.push(`  choice: ${b?.textContent}`);
    b?.click();
  };
  // walk to a point (real movement; the watchers held still: stealth is another check's business); placed if a straight
  // walk cannot reach it
  P.go = (pt, r = 1.4) => {
    if (g.menu === 'pause') g.closeMenu();
    const [x, y, z] = pt;
    const p0 = g.player.pos.clone();
    const d0 = Math.hypot(x - p0.x, z - p0.z);
    if (d0 <= r && Math.abs(p0.y - 0.86 - y) < 1.6) return 'here';
    const held = g.deckWorld.sentinels.splice(0);
    const s0 = B.setbacks;
    const left = B.walkTo(x, z, Math.min(90, d0 / 2.5 + 8));
    g.deckWorld.sentinels.push(...held);
    P.metres += Math.hypot(g.player.pos.x - p0.x, g.player.pos.z - p0.z);
    if (left <= r + 0.3 && Math.abs(g.player.pos.y - 0.86 - y) < 1.6 && B.setbacks === s0) {
      P.walked++;
      return 'walked';
    }
    B.place(x, z, y + 0.9);
    g.simulate(0.2);
    P.placed++;
    P.short += left; // (the metres a straight walk could not cover: stairs, terraces, a wall in the way)
    P.log.push(`  placed at ${x.toFixed(1)},${y.toFixed(1)},${z.toFixed(1)} (${left.toFixed(1)} m short)`);
    return 'placed';
  };
  // a candidate's spot: Kai stands 1.4 m short of it, toward where he is
  P.near = (pos, ground, d = 1.4) => {
    const dx = g.player.pos.x - pos[0], dz = g.player.pos.z - pos[2], l = Math.hypot(dx, dz) || 1;
    return [pos[0] + (dx / l) * d, ground, pos[2] + (dz / l) * d];
  };
  P.cand = (id) => g.deckWorld.focusCandidates(g).find((c) => c.id === `deck:${id}` || c.id === `dnpc:${id}`);
  // find a thing in some year (the years its conditions ask for first)
  P.find = (id, years) => {
    const now = g.engine.state(g.room);
    for (const st of [...(years || []), now, ...g.engine.statesOf(g.room)].filter((s, i, a) => a.indexOf(s) === i)) {
      P.year(st);
      const c = P.cand(id);
      if (c) return c;
    }
    P.year(now);
    return null;
  };
  P.use = (id, years, ground) => {
    P.rest();
    let c = P.find(id, years);
    if (!c) return `no ${id}`;
    const pos = c.npc ? [c.npc.model.position.x, c.npc.model.position.y, c.npc.model.position.z] : c.pos;
    const gy = ground ?? (c.npc ? pos[1] : pos[1] - 1.1);
    P.go(P.near(pos, gy, c.npc ? 1.6 : 1.3), 0.9);
    c = P.cand(id) || P.find(id, years);
    if (!c) return `lost ${id}`;
    g.focus = c;
    g.lastUse = null;
    g.use();
    P.out();
    return 'ok';
  };
  P.wait = (cond, secs = 60, dt = 0.25) => {
    let t = 0;
    while (t < secs && !cond()) {
      g.simulate(dt);
      t += dt;
      if (g.hud.talking || g.menu === 'choice') t += P.out();
    }
    return cond();
  };
  // REVERSE a process (a lock's bolt by name): stand where its aim is in view, aim, press
  P.rev = (id, part = null) => {
    const p = B.proc(id);
    if (!p) return `no process ${id}`;
    const years = P.yearsOf(p.rec.when);
    const inv = g.edition.inv;
    // (a tired Chronolith or an empty charge: back in the present until both come back, then into the process's year)
    if (g.edition.stability < 0.6 || inv.state.charge < Math.min(inv.cap, 5)) {
      P.present();
      P.wait(() => g.edition.stability > 0.9 && inv.state.charge >= Math.min(inv.cap, 6) && !inv.active, 16);
    }
    if (!years.includes(g.engine.state(g.room))) P.year(years[0]);
    const at = part ? p.rec.parts.find((x) => x.name === part)?.rest.p : inv.aimOf(p);
    const want = part ? `${id}:${part}` : id;
    let got = null;
    for (const [dx, dz] of [[0, 3], [2.4, 1.6], [-2.4, 1.6], [0, -3], [3, 0], [-3, 0], [0, 5], [4, 3], [-4, 3]]) {
      const a = part ? at : inv.aimOf(p);
      B.place(a[0] + dx, a[2] + dz, Math.max(0, (p.rec.anchor?.pos?.[1] ?? 0)) + 0.9);
      g.simulate(0.1);
      got = B.aim(part ? at : inv.aimOf(p));
      if (got === want) break;
    }
    if (got !== want) return `cannot aim at ${want} (${got})`;
    B.rev();
    return inv.active?.p === p ? 'held' : `not held (${inv.lastRelease || 'refused'})`;
  };
  P.release = () => {
    if (g.edition.inv.active) B.rev();
  };
  // the thread's landmark (a point thread's own position)
  P.at = (t) => (Array.isArray(t.at) ? t.at : g.level.landmarks?.[t.at]);
  P.npcOf = (id) => g.deckWorld.npcs.find((n) => (n.n.id === id || n.n.crew === id || n.crew?.id === id) && n.model.visible && !n.n.silent && !n.isEcho);
  P.npcAny = (id) => {
    const now = g.engine.state(g.room);
    for (const st of [now, ...g.engine.statesOf(g.room)]) {
      P.year(st);
      const n = P.npcOf(id);
      if (n) return n;
    }
    P.year(now);
    return null;
  };
  P.talk = (id) => {
    const n = P.npcAny(id);
    if (!n) return `no ${id}`;
    return P.use(n.n.id, [g.engine.state(g.room)], n.model.position.y);
  };
  // the default actions of each kind
  P.kinds = {
    go: (t) => { const a = P.at(t); P.go(a, Math.max(1, (t.r ?? 4) - 1.2)); g.simulate(0.3); },
    stealth: (t) => P.kinds.go(t),
    talk: (t) => { for (let i = 0; i < 4 && !P.done(t); i++) P.talk(t.npc); },
    scene: (t) => {
      const id = t.spot ? t.scene || t.id : t.scene;
      const sc = P.deck().scenes?.[t.scene];
      const years = P.yearsOf(t.spot?.when, sc?.when);
      for (let i = 0; i < 3 && !P.done(t); i++) P.use(id, years, P.at(t)?.[1]);
    },
    choice: (t) => P.kinds.scene(t),
    clue: (t) => {
      for (const s of t.spots || []) {
        if (P.done(t)) break;
        const sc = P.deck().scenes?.[s.scene || s.id];
        P.use(s.id, P.yearsOf(s.when, sc?.when), g.level.landmarks?.[s.at]?.[1]);
      }
      for (const k of t.of || []) { if (P.done(t)) break; if (/^(rev|inv)_/.test(k)) P.revDone(k); }
    },
    tasks: (t) => P.kinds.clue(t),
    residue: (t) => {
      const ground = P.at(t)?.[1];
      P.use(`residue_${t.id}`, [g.engine.baseline], ground);
      P.use(`residue_${t.id}`, ['PAST'], ground);
    },
    deduce: (t) => {
      const d = P.deck().deductions[t.deduction || t.id];
      const right = d.answers.find((a) => a.correct).label;
      const was = P.pick;
      P.pick = (opts) => opts.findIndex((o) => o.text.includes(right));
      P.use(`deduce_${t.id}`, null, P.at(t)?.[1]);
      P.pick = was;
    },
    playback: (t) => {
      const was = P.pick;
      for (let i = 0; i <= (t.entries || []).length && !P.done(t); i++) {
        const n = P.f(`pb_${P.mk()}_${t.id}_n`) || 0;
        const e = t.entries?.[n];
        P.pick = e ? (opts) => opts.findIndex((o) => o.text.includes(e.label)) : was;
        P.use(`playback_${t.id}`, P.yearsOf(t.spotWhen), P.at(t)?.[1]);
      }
      P.pick = was;
    },
    invert: (t) => P.revDone(`inv_${t.target}_done`),
    loop: (t) => P.wait(() => P.done(t), 300, 0.5),
    cinema: (t) => P.wait(() => P.done(t), 90),
    chase: (t) => {
      const n = B.npc(t.npc);
      let near = 99;
      for (let k = 0; k < 400 && !P.done(t); k++) {
        if (!n?.model.visible) { g.simulate(0.2); continue; }
        const m = n.model.position;
        near = Math.min(near, Math.hypot(m.x - g.player.pos.x, m.z - g.player.pos.z));
        const held = g.deckWorld.sentinels.splice(0);
        if (Math.hypot(m.x - g.player.pos.x, m.z - g.player.pos.z) > 5) B.walkTo(m.x, m.z, 0.5);
        else g.simulate(0.5);
        g.deckWorld.sentinels.push(...held);
        if (Math.abs(g.player.pos.y - m.y) > 2.5) { B.place(m.x, m.z + 2, m.y + 0.9); P.placed++; }
      }
      P.log.push(`  chase: nearest ${near.toFixed(1)} m`);
    },
  };
  // a REVERSE whose fact a thread counts (rev_<id> while held, inv_<id>_done when settled)
  P.revDone = (k) => {
    const id = k.replace(/^rev_|^inv_|_done$/g, '');
    const r = P.rev(id);
    P.log.push(`  reverse ${id}: ${r}`);
    P.wait(() => P.f(k) || !g.edition.inv.active, 14, 0.2);
    g.simulate(0.4);
    P.release();
    g.simulate(0.3);
  };
  // missions' own moments the default kinds cannot do: LVP.own[mkey][threadId](t)
  P.own = {
    m11: {
      // the file un-burns three seconds in ten: stand by it until the Chronolith catches the rhythm
      rhythm: () => { P.go(g.level.landmarks.charredFile, 1); P.wait(() => P.f('has_inversion'), 30); },
      practise: () => { P.log.push(`  reverse tray: ${P.rev('tray')}`); g.simulate(1.6); P.release(); g.simulate(0.4); },
      file: () => {
        for (let i = 0; i < 3 && !P.f('ev_admitted_by'); i++) {
          P.log.push(`  reverse charredFile: ${P.rev('charredFile')}`);
          g.simulate(1.2);
          const c = P.cand('p_charredFile');
          if (c) { g.focus = c; g.lastUse = null; g.use(); P.out(); }
          P.release();
          g.simulate(0.4);
        }
      },
      lock: () => {
        for (const b of ['CRESCENT', 'STAR', 'BAR', 'RING']) {
          P.log.push(`  bolt ${b}: ${P.rev('m11lock', b)}`);
          P.wait(() => !g.edition.inv.active, 6, 0.2);
          g.simulate(0.4);
        }
        P.wait(() => P.f('inv_m11lock_done'), 8);
      },
    },
    m12: {
      witnessStair: () => { P.year('FUTURE'); P.go(g.level.landmarks.collapsedStair, 2); P.wait(() => P.f('m12_stair_shown'), 40); },
      // Corridor B: the gangway at roof height that only 2026 has
      corridor: (t) => { P.year('PAST'); P.go(P.at(t), 2); g.simulate(0.3); },
    },
  };
  // one thread: the objective's (or a named one)
  P.step = (id = null) => {
    const T = th();
    const t = id ? T.byId[id] : T.current();
    if (!t) return { id: null, beat: !!g.deckWorld.flags.beat_done };
    const t0 = g.time;
    const p0 = P.placed, s0 = B.setbacks;
    P.log.push(`${P.mk()} ${t.id} (${t.kind})`);
    P.rest();
    const own = P.own[P.mk()]?.[t.id];
    try {
      if (own) own(t);
      else (P.kinds[t.kind] || (() => P.log.push('  (no action)')))(t);
    } catch (e) {
      P.log.push(`  ERR ${e.message}`);
    }
    P.out();
    // (back to the present only when the Chronolith tires: a player stays in a year while it serves; and the 2026
    // gangway is no floor in 2049)
    if (g.edition.stability < 0.6) P.present();
    g.simulate(0.2);
    return { id: t.id, kind: t.kind, done: P.done(t), secs: +(g.time - t0).toFixed(1), placed: P.placed - p0, setbacks: B.setbacks - s0 };
  };
  // a side story, thread by thread
  P.side = (sid) => {
    const T = th();
    const s = T.sides.find((x) => x.id === sid);
    const out = [];
    if (!s) return [`no side ${sid}`];
    for (const t of s.threads) {
      if (P.done(t)) continue;
      if (!T.available(t)) { out.push(`${t.id}: not up`); continue; }
      out.push(P.step(t.id));
    }
    return out;
  };
  return 'ok';
};
await az(PLAYER);
const WALK = {};
// one mission: its main threads in order (the side stories named, before the thread `before`, else before its last main
// thread: the mission ends with that one)
const playMission = async (mkey, { sides = [], before = null, at = {} } = {}) => {
  const here = await az(() => AZ.edition.deck?.mkey);
  check(here === mkey, `${mkey} begins`, String(here));
  if (here !== mkey) return { steps: [], ok: false };
  await az(() => { Object.assign(LVP, { placed: 0, walked: 0, metres: 0, short: 0, log: [] }); });
  const steps = [];
  const sidesDone = new Set();
  let sideSecs = 0;
  for (let i = 0; i < 40; i++) {
    const cur = await az(() => {
      const T = AZ.edition.threads, c = T.current();
      const mains = T.list.filter((t) => !t.side);
      return c ? { id: c.id, last: !mains.some((t) => t !== c && !T.done(t) && mains.indexOf(t) > mains.indexOf(c)) } : null;
    });
    if (!ok(cur) || !cur) break;
    if (before ? cur.id === before : cur.last) {
      for (const s of sides) {
        if (sidesDone.has(s)) continue;
        sidesDone.add(s);
        await page.waitForFunction(() => !AZ.catching && !AZ.transitioning, null, { timeout: 30000 }).catch(() => {});
        const r = await az((s) => { const a = AZ.time; const out = LVP.side(s); return { out, secs: AZ.time - a }; }, s);
        if (ok(r)) sideSecs += r.secs;
        steps.push({ side: s, r: ok(r) ? r.out : r });
      }
    }
    if (at[cur.id]) await at[cur.id]();
    // (a setback's fade ends on the page's own timer, which cannot run inside one evaluate: let it finish first, or
    // the player stands frozen through the next step and is put back at the checkpoint after it)
    await page.waitForFunction(() => !AZ.catching && !AZ.transitioning, null, { timeout: 30000 }).catch(() => {});
    const r = await az(() => LVP.step());
    if (!ok(r) || !r.id) { if (!ok(r)) steps.push(r); break; }
    steps.push(r);
    if (!r.done) break;
  }
  const end = await az((mk) => {
    const T = AZ.edition.threads;
    // (a thread whose condition never held, Mission 21's cells without prisoners, is not left undone)
    const left = T.on && T.deck.mkey === mk ? T.list.filter((t) => !t.side && !T.done(t) && !T.passed(t) && (!t.when || AZ.facts.test(t.when))).map((t) => t.id) : [];
    return { left, beat: !!AZ.deckWorld.flags.beat_done || AZ.edition.deck.mkey !== mk, placed: LVP.placed, walked: LVP.walked, metres: Math.round(LVP.metres), short: Math.round(LVP.short), log: LVP.log.slice(-6) };
  }, mkey);
  // (every side story named was played: one the mission's end overtook is not counted as played)
  const sidesOk = sides.every((sd) => steps.some((s) => s.side === sd)) && steps.filter((s) => s.side).every((s) => Array.isArray(s.r) && s.r.every((x) => typeof x === 'object' && x.done));
  check(end.left.length === 0 && end.beat, `${mkey}: every main thread done, in order, to its end`, JSON.stringify({ left: end.left, steps: steps.filter((s) => !s.done).slice(0, 3), log: end.log }));
  if (sides.length) check(sidesOk, `${mkey}: its side stories (${sides.join(', ')}) played to their outcome`, JSON.stringify(steps.filter((s) => s.side)));
  WALK[mkey] = { sideSecs: Math.round(sideSecs), setbacks: steps.reduce((a, x) => a + (x.setbacks || 0), 0), ...end };
  const fell = steps.flatMap((x) => (x.side ? (Array.isArray(x.r) ? x.r : []) : [x])).filter((x) => x.setbacks);
  if (fell.length) console.log(`  (${mkey}: setbacks in ${fell.map((x) => `${x.id} ${x.setbacks}`).join(', ')}; the last: ${await az(() => LVB.lastSetback)})`);
  return { steps, ...end };
};
// on to the next mission: its hook plays out (lines at their own length), the gate's fade, the next place, its opening
const finish = async () => {
  const from = await az(() => `${AZ.campaign.chapter}:${AZ.campaign.deck}`);
  for (let i = 0; i < 400; i++) {
    const r = await az(() => { AZ.simulate(0.2); LVB.talkOut(30); return { at: `${AZ.campaign.chapter}:${AZ.campaign.deck}`, tr: !!AZ.transitioning }; });
    if (!ok(r) || (r.at !== from && !r.tr)) break;
    if (r.tr) await page.waitForTimeout(150);
  }
  await page.waitForFunction(() => !AZ.transitioning, null, { timeout: 300000 }).catch(() => {});
  // (the next mission's card and cold open at their own length: its time starts as it loads)
  await page.waitForFunction(() => { LVB.talkOut(1); return !AZ.edition.opening && !AZ.edition.cinema.active && AZ.voice.loading >= 1; }, null, { timeout: 180000, polling: 250 }).catch(() => {});
  await az(() => LVB.talkOut(10));
};
const order = (steps, ...ids) => ids.every((id, i) => i === 0 || steps.findIndex((s) => s.id === ids[i - 1]) < steps.findIndex((s) => s.id === id)) && ids.every((id) => steps.some((s) => s.id === id && s.done));

// --- Mission 4: the case board's side stories can be tracked (TRACK puts the next step under the objective) ---------
const track = await az(() => {
  const el = document.createElement('div');
  AZ.edition.renderJournal(AZ, el);
  const b = [...el.querySelectorAll('.lvtrack')].find((x) => x.dataset.track === 'm04:cord');
  const r = { buttons: [...el.querySelectorAll('.lvtrack')].map((x) => x.dataset.track) };
  b?.click();
  AZ.simulate(0.1);
  r.track = AZ.campaign.track;
  r.side = document.querySelector('#objective .lvside')?.textContent || '';
  AZ.campaign.track = null;
  AZ.edition.objective(true);
  return r;
});
check(track.track === 'm04:cord' && /SIDE STORY · THE CHILD'S STONE RING/.test(track.side), 'the case board: a side story\'s TRACK button puts its next step under the objective', JSON.stringify(track));
const m4 = await playMission('m04', { sides: ['cord', 'niko'] });
check(order(m4.steps, 'meal', 'stele', 'frags', 'elder', 'panels', 'card') && (await az(() => AZ.facts.get('card_found') && AZ.facts.get('ev_ash_layers') && ['truth', 'story', 'none'].includes(AZ.facts.get('niko_told')))),
  'Mission 4: the meal at the first fire (the ash layers), the stele and the three stones, the Elder, the panels read from the ash, the card; Niko\'s question answered', JSON.stringify(m4.steps.map((s) => s.id || s.side)));
check(await az(() => LVB.said.includes('NONE: Under the ring, on a floor nobody has swept in three thousand years: a Helix access card. VAREN, K. ACCESS: ALL.')), 'the card under the ring: VAREN, K. ACCESS: ALL.');
await finish();

// --- Mission 5: the river, the abandoned village's why, the gate, the machine buried or left; chain B in the gorge --
const niko = await az(() => { AZ.edition.shift('FUTURE'); AZ.simulate(0.1); const e = !!LVB.npc('niko')?.isEcho; AZ.edition.shift('PRESENT'); AZ.simulate(0.1); return [e, !!LVB.npc('niko')?.isEcho]; });
check(niko[0] && !niko[1], 'Niko is himself in the present, an echo in the flooded future', JSON.stringify(niko));
// the river cuts the village: in the present the old footbridge is gone (into the water, back to the last anchor)
const fell = await az(() => { const at = AZ.player.pos.toArray(); const [x, , z] = LVB.lm('footbridgeS'); LVB.place(x, z); const s0 = LVB.setbacks; LVB.walkTo(x, LVB.lm('footbridgeN')[2], 8); const r = LVB.setbacks > s0 || AZ.player.pos.z > 1; LVB.at0 = at; return r; });
await page.waitForTimeout(1200); // the fall's fade and the walk back to the checkpoint
await page.waitForFunction(() => !AZ.catching, null, { timeout: 90000 }).catch(() => {});
const canal = await az(() => {
  const r = {};
  AZ.simulate(0.2);
  const [x, , z] = LVB.lm('footbridgeS'), n = LVB.lm('footbridgeN');
  LVB.place(x, z); AZ.edition.shift('PAST'); AZ.simulate(0.1); const s1 = LVB.setbacks;
  r.left = LVB.walkTo(n[0], n[2], 10); r.pastCrossed = LVB.setbacks === s1 && AZ.player.pos.z < n[2] + 1.5;
  AZ.edition.shift('PRESENT'); AZ.simulate(0.1);
  LVB.place(LVB.at0[0], LVB.at0[2], LVB.at0[1]); // (back where Kai stood)
  return r;
});
canal.presentFell = fell;
check(canal.presentFell && canal.pastCrossed, 'the river cuts the village in two; in the thriving year the footbridge still stands', JSON.stringify(canal));
const m5 = await playMission('m05', { sides: ['water'] });
const m5f = await az(() => ({ ...LVB.f('river_diverted', 'ev_tally', 'ev_names', 'ev_hearths', 'gate_released', 'machine_buried', 'water_route'), said: LVB.said.includes('KAI: Then they left because of me.') }));
check(order(m5.steps, 'divert', 'why', 'leave', 'gate', 'machine', 'bury') && m5f.river_diverted && m5f.ev_tally && m5f.ev_names && m5f.ev_hearths && m5f.said && m5f.gate_released && ['cairn', 'clay'].includes(m5f.machine_buried),
  'Mission 5: the river diverted (thriving), then the abandoned village\'s why (tallies, names, hearths: "Then they left because of me."), then the gate (flooded), then machine_buried', JSON.stringify({ m5f, steps: m5.steps.map((s) => s.id || s.side) }));
check(m5f.water_route === true, 'chain B in the gorge: Tala\'s three gates in their order open the water route', JSON.stringify(m5f));
await finish();

// --- Mission 6: Ezra Moll, the arm, the hidden stair, the escapement, the recording; the Clockmaker's Debt --------------
const m6 = await playMission('m06', { sides: ['debt'] });
check(order(m6.steps, 'ezra', 'arm', 'boards', 'stair', 'clocks', 'recording') && (await az(() => AZ.facts.get('clock_set') && ['release', 'finish'].includes(AZ.facts.get('ezra_debt')) && LVB.said.includes('CREW: Which version of the question are you asking?'))),
  'Mission 6: "Which version of the question are you asking?"; the stair deduced from the boards in two years; three clocks in three years; the Debt settled', JSON.stringify(m6.steps.map((s) => s.id || s.side)));
await finish();

// --- Mission 7: the three instruments in three years, the dates, Mira's tape; the scavengers' cache ------------------
const m7 = await playMission('m07', { sides: ['cache'] });
const m7f = await az(() => ({ ...LVB.f('align_sun', 'align_star', 'align_new', 'mira_tape', 'ev_cache'), said: LVB.said.includes('NIKO: They didn\'t know when. They knew who.'), tape: LVB.voices.find((v) => v.who === 'MIRA9')?.fx }));
check(m7f.align_sun && m7f.align_star && m7f.align_new && m7f.said && ['kept', 'left'].includes(m7f.mira_tape) && m7f.ev_cache, 'Mission 7: the sun, a star, the new star; "They didn\'t know when. They knew who."; Mira\'s tape kept or left', JSON.stringify(m7f));
await finish();
check(await az(() => LVB.voices.some((v) => v.who === 'MIRA9' && v.fx === 'recording' && v.text.startsWith('Kai, it\'s me. It\'s Friday.'))), 'its hook: Mira\'s tape, a nine-year-old\'s voice through the recording chain');

// --- Mission 8: the confrontation sets rook_fate; the boot print; the last ten minutes played back; VERSION 17 ------
const m8 = await playMission('m08', { sides: ['photo'], before: 'containment' });
const m8f = await az(() => ({ fate: AZ.facts.get('rook_fate'), ...LVB.f('ev_boot_mine', 'ev_ninth_minute', 'lin_gone', 'version_17'),
  rook: LVB.said.includes('ROOK: By me. Write it down. I have waited twenty-three years for somebody to make me say it.'),
  v17: LVB.said.includes('NONE: TIMELINE: VERSION 17. PRIOR VERSIONS: NO SURVIVING RECORD.'), lin: LVB.said.includes('CREW: Because I am not the one who died.') }));
check(['expose', 'persuade', 'record'].includes(m8f.fate) && m8f.rook && order(m8.steps, 'readLog', 'rook', 'boot', 'reconstruct'), 'Mission 8: Rook confronted in his office ("By me. Write it down."): rook_fate is set', JSON.stringify(m8f));
check(m8f.ev_boot_mine && m8f.ev_ninth_minute && m8f.lin_gone && m8f.lin, 'the boot print is Kai\'s; the last ten minutes played back in order; Lin: "Because I am not the one who died."', JSON.stringify(m8f));
check(m8f.version_17 && m8f.v17, 'VERSION 17: "TIMELINE: VERSION 17. PRIOR VERSIONS: NO SURVIVING RECORD."', JSON.stringify(m8f));
await finish();
const act2 = await az(() => ({ ...LVB.where(), name: AZ.edition.deck.name, card: LVB.said.includes('NONE: Act Two. The Nine-Minute War.') }));
check(act2.chapter === 'act2' && act2.deck === 0 && act2.name === 'NINE MINUTES TO ZERO' && act2.card, 'Act I ends on VERSION 17; Act II begins with its card ("Act Two. The Nine-Minute War.") and Mission 9', JSON.stringify(act2));

// --- Mission 9: two loops with different patrols (the rain falls upward at each reset), then the clocks, the transmitter,
// Rhea and the tower; warn the evacuees with the cancelled order --------------------------------------------------------
await az(() => {
  // each reset: where the patrols the loop moves now walk (their rounds), and the rain that falls upward for a moment
  const g = AZ, rt = g.edition, reset = rt.loopReset.bind(rt);
  window.LVLOOPS = [];
  rt.loopReset = () => {
    const n0 = g.facts.get('loops_m09') || 0;
    const r = reset();
    if ((g.facts.get('loops_m09') || 0) > n0) LVLOOPS.push({ n: g.facts.get('loops_m09'), up: !!rt.upward, fall: g.weather?.k?.fall, patrols: g.deckWorld.sentinels.filter((s) => /_q[12]s0$/.test(s.def.id)).map((s) => JSON.stringify(s.def.path)) });
    return r;
  };
});
const bark9 = await az(() => AZ.level.npcs.find((n) => n.id === 'brask9')?.barks?.[0]);
const m9 = await playMission('m09', { sides: ['warn'], before: 'transmitter' });
const loops = await az(() => ({ list: LVLOOPS, ...LVB.f('loops_m09', 'transmitter_cut', 'rhea_freed', 'ev_ninth_view', 'warned_evacuees'), tower: LVB.said.includes('WITNESS: To become me.') }));
loops.bark = bark9;
check(loops.list.length >= 2 && loops.list[0].patrols.join() !== loops.list[1].patrols.join() && loops.list.every((l) => l.up && l.fall < 0) && order(m9.steps, 'loop1', 'loop2', 'transmitter', 'rhea', 'tower'),
  'Mission 9: two loops, the patrols walking other rounds after each reset (the rain falling upward as the street goes back); then the transmitter, Rhea, the tower', JSON.stringify({ loops: loops.list, steps: m9.steps.map((s) => s.id || s.side) }));
check(loops.transmitter_cut && loops.rhea_freed && loops.ev_ninth_view && loops.tower && loops.warned_evacuees, 'the tower at 08:13: "You have nine minutes." / "To do what?" / "To become me."; the evacuees warned with the cancelled order', JSON.stringify(loops));
check(loops.bark === 'You did that already. No—you\'re about to do it. I hate that I know the difference.', 'Sergeant Brask\'s loop-aware bark, verbatim', JSON.stringify(loops.bark));
await finish();

// --- Mission 10: the Director is whoever rook_fate made them; the troopers see, catch, and remember; Echo Step -----------
const m10 = await az(() => {
  const ws = AZ.edition.watchers.list;
  const models = ws.map((w) => w.current?.actor?.userData.spec?.model || 'drone');
  const w = ws[0], s = w.s;
  s.mode = 'patrol'; s.suspicion = 0;
  // stand in its cone, four metres ahead of it, and let it look; then let it catch Kai
  LVB.place(s.pos.x + s.dir.x * 4, s.pos.z + s.dir.z * 4);
  let seen = 0;
  for (let i = 0; i < 40 && s.mode !== 'chase'; i++) { AZ.simulate(0.05); seen = Math.max(seen, s.suspicion); }
  const out = { mkey: AZ.edition.deck.mkey, models, variant: w.current?.actor?.userData.lvVariant, seen: +seen.toFixed(2), mode: s.mode, eye: w.g.userData.eyeMat.color.getHexString(), cone: w.g.userData.coneMat.opacity,
    director: LVB.said.filter((l) => /^(ROOK|CREW): (He didn't reset|The director said)|Hold him/.test(l)), range0: AZ.deckWorld.sentinels[0].def.range, s0: LVB.setbacks };
  for (let i = 0; i < 80 && LVB.setbacks === out.s0; i++) AZ.simulate(0.05);
  out.caught = LVB.setbacks > out.s0;
  return out;
});
await page.waitForTimeout(1200); // (the setback's fade is on the page's own timers)
await page.waitForFunction(() => !AZ.catching, null, { timeout: 90000 }).catch(() => {});
const remember = await az(() => { AZ.simulate(0.3); LVB.talkOut(); AZ.deckWorld.sentinels.forEach((x) => x.reset()); return { n: AZ.facts.get('m10_caught'), range: AZ.deckWorld.sentinels[0].def.range, said: LVB.said.includes('KAI: They moved. They remember where I went.') }; });
check(m10.mkey === 'm10' && m10.models.length >= 1 && m10.models.every((m) => m === 'rb_trooper') && m10.variant === 'continuum', 'Mission 10\'s watchers are Continuum troopers (rb_trooper, slate)', JSON.stringify(m10));
check(m10.seen >= 1 && m10.mode === 'chase' && m10.eye === 'ff8a70' && m10.cone > 0.1, 'a trooper\'s cone sees Kai in front of it: suspicion, then the chase', JSON.stringify(m10));
check(m10.caught && remember.n >= 1 && remember.range > m10.range0 && remember.said, 'Enemies who remember: after a catch the patrols start their rounds elsewhere and look further ("They moved.")', JSON.stringify({ m10, remember }));
check(m10.director.length === 1, 'the cold open: the Director, as rook_fate made them, watches the capture feed', JSON.stringify(m10.director));
const m10p = await playMission('m10', { sides: ['intake'], before: 'power' });
check(order(m10p.steps, 'escape', 'sera', 'power', 'projector', 'prisoners', 'yard') && (await az(() => AZ.facts.get('echo_step') && (AZ.facts.get('prisoners_freed') || AZ.facts.get('prisoners_held')) && LVB.said.includes('SERA: For ending it.'))),
  'Mission 10: Sera ("For ending it."), the two years\' power runs, the captured projector (Echo Step), the prisoners\' choice, the yard', JSON.stringify(m10p.steps.map((s) => s.id || s.side)));
await finish();

// --- Mission 11: THE INVERTED HOSPITAL: the sound that is quieter as you approach, the hazards that go back where they
// were, and REVERSE taught: R and the touch ⟲ button start and release a hold, a year switch releases it, the refusal, the
// charred file readable only while held, a jammed bolt, a settled bolt through a save and a load, the lock that opens Ward 32
console.log('Act II, Mission 11: The Inverted Hospital (REVERSE)');
const SHOT = process.env.LV_SHOT || null; // where to save the REVERSE screenshot (optional)
const hosp = await az(() => {
  const g = AZ, inv = g.edition.inv;
  const rev = g.level.order.filter((r) => g.engine.hasIn('timeReverse', r));
  return { name: g.edition.deck.name, rev: rev.length, gravity: rev.map((r) => g.engine.gravity(r)), years: g.engine.statesOf(g.room), on: inv.unlocked, chip: document.querySelector('#lvReverse')?.classList.contains('on'), btn: !!document.querySelector('#buttons #lvRevBtn'), pips: [...document.querySelectorAll('#state .pip')].length };
});
check(hosp.name === 'THE INVERTED HOSPITAL' && hosp.rev >= 3 && hosp.gravity.every((v) => v === -1) && JSON.stringify(hosp.years) === '["PRESENT","PAST"]' && !hosp.on && !hosp.chip && hosp.btn,
  'Mission 11: two years, wards that run backwards (gravity unchanged), and no REVERSE yet', JSON.stringify(hosp));
await press('KeyR');
const early = await az(() => ({ state: AZ.engine.state(AZ.room), active: !!AZ.edition.inv.active, has: !!AZ.facts.get('has_inversion') }));
check(early.state === 'PRESENT' && !early.active && !early.has, 'before it is taught, R reverses nothing (and is no longer a year switch)', JSON.stringify(early));
// the music box: the nearer, the quieter (the bible's sound that becomes quieter as Kai approaches)
const music = await az(() => {
  const g = AZ, mb = LVB.lm('musicBox');
  const at = (d) => { LVB.place(mb[0] - d, mb[2] + 2, 0.9); g.simulate(0.4); return +g.edition.m11.gain.toFixed(2); };
  return { far: at(34), mid: at(14), near: at(3) };
});
check(music.far > music.mid && music.mid > music.near && music.near < 0.3, 'the music box is quieter the nearer Kai comes to it, quietest at its source', JSON.stringify(music));
// a hazard that goes back where it was: stand where the gurney returns to, and it hits (a setback, not a fail)
const hazard = await az(() => {
  const g = AZ, h = g.edition.m11.hazards.find((x) => x.id === 'gurney'), lm = LVB.lm('gurneyRun');
  const s0 = LVB.setbacks;
  // its origin, ten metres up the run from the landmark (where it rolls back to)
  const c = Math.cos(lm[3]), s = Math.sin(lm[3]);
  LVB.place(lm[0] + -10 * s, lm[2] + -10 * c, 0.9);
  for (let t = 0; t < 9 && LVB.setbacks === s0; t += 0.1) g.simulate(0.1);
  return { hit: LVB.setbacks > s0, why: LVB.lastSetback, hits: g.facts.get('m11_hits'), was: h && h.id };
});
await page.waitForTimeout(1200);
await page.waitForFunction(() => !AZ.catching, null, { timeout: 90000 }).catch(() => {});
check(hazard.hit && hazard.why === 'hit' && hazard.hits >= 1, 'a gurney rolling back to where it was hits Kai: a setback to the last checkpoint, never a fail', JSON.stringify(hazard));
const m11a = [];
for (let i = 0; i < 8; i++) {
  const r = await az(() => { const c = AZ.edition.threads.current(); if (!c || c.id === 'practise') return { stop: true, id: c?.id }; return LVP.step(); });
  if (!ok(r) || r.stop) break;
  m11a.push(r);
}
// the records: the charred file un-burns three seconds in ten; the Chronolith catches the rhythm
const unlock = await az(() => {
  const g = AZ;
  const r = { saw: g.facts.get('m11_saw_file'), has: g.facts.get('has_inversion'), said: LVB.said.some((l) => l.includes('I can hold one thing. Only one, and only for a while.')), chip: document.querySelector('#lvReverse').classList.contains('on'), chipText: document.querySelector('#lvReverse span').textContent, ...LVB.inv() };
  r.board = (() => { const el = document.createElement('div'); g.edition.renderJournal(g, el); return el.innerHTML.includes('ABILITIES') && el.innerHTML.includes('R6'); })();
  r.steps = AZ.edition.threads.current()?.id;
  return r;
});
check(unlock.saw && unlock.has && unlock.said && unlock.chip && unlock.cap === 8 && /⟲ 8s/.test(unlock.chipText) && unlock.board && unlock.steps === 'practise',
  'in the records hall the Chronolith catches the ward\'s rhythm: has_inversion, Kai\'s line, the REVERSE chip (8 s), the case board\'s ABILITIES', JSON.stringify({ unlock, m11a }));
// R starts a hold on what the crosshair is on, and R again lets go
const tray = await az(() => {
  const p = LVB.proc('tray');
  LVB.place(p.rec.aim[0] - 0.4, p.rec.aim[2] + 2.4);
  return { aim: LVB.aim(p.rec.aim), ...LVB.inv() };
});
await press('KeyR');
const trayHeld = await az(() => { const r = { ...LVB.inv(), rev: AZ.facts.get('rev_tray') }; AZ.simulate(1.6); r.P = +LVB.proc('tray').P.toFixed(2); r.label = document.querySelector('#lvTarget').textContent; r.chip = document.querySelector('#lvReverse span').textContent; return r; });
await press('KeyR');
const trayOut = await az(() => ({ ...LVB.inv(), rev: AZ.facts.get('rev_tray'), practised: !!AZ.facts.get('t_m11_practise') }));
check(tray.aim === 'tray' && trayHeld.active === 'tray' && trayHeld.rev && trayHeld.P === 1 && trayHeld.charge <= tray.charge - 0.5 && /THE TRAY/.test(trayHeld.chip) && /⟲ THE TRAY/.test(trayHeld.label),
  'R on the fallen tray: it rises back onto its trolley and holds (charge spent, the chip and the label name it)', JSON.stringify({ tray, trayHeld }));
check(!trayOut.active && trayOut.why === 'press' && !trayOut.rev && trayOut.practised, 'R again lets it go: it falls forward again (and the practice is done)', JSON.stringify(trayOut));
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
  LVB.use('p_charredFile'); LVB.talkOut();
  r.before = !!g.facts.get('ev_admitted_by');
  r.aim = LVB.aim(p.rec.aim);
  LVB.rev();
  r.held = LVB.inv().active;
  g.simulate(1.2);
  LVB.use('p_charredFile'); LVB.talkOut();
  r.after = !!g.facts.get('ev_admitted_by');
  r.said = LVB.said.includes('NONE: ADMITTED BY: K. VAREN.');
  if (LVB.inv().active) LVB.rev();
  r.released = !LVB.inv().active;
  g.simulate(0.3);
  r.door = g.deckWorld.dynamic.find((d) => d.el.id === 'door_m11records')?.cond(g.deckWorld.ctx(g.room));
  return r;
});
check(!charred.before && charred.aim === 'charredFile' && charred.held === 'charredFile' && charred.after && charred.said && charred.released && charred.door === false,
  'the charred file reads only while it is held: ADMITTED BY: K. VAREN (and the way on opens)', JSON.stringify(charred));
// the records compared, Odile (the player's own threads), up to the lock
const m11b = [];
for (let i = 0; i < 6; i++) {
  const r = await az(() => { const c = AZ.edition.threads.current(); if (!c || c.id === 'lock') return { stop: true, id: c?.id }; return LVP.step(); });
  if (!ok(r) || r.stop) break;
  m11b.push(r);
}
check(m11b.some((s) => s.id === 'compare' && s.done) && m11b.some((s) => s.id === 'odile' && s.done) && (await az(() => AZ.facts.get('ev_missing_patient') && AZ.facts.get('odile_met') && LVB.said.includes('CREW: No. You wouldn\'t have let yourself.'))),
  'the records compared (VAREN, M., 9, in 2026; nobody in 2049); Nurse Odile: "No. You wouldn\'t have let yourself."', JSON.stringify(m11b));
// Ward 32's door: a reversing lock of four bolts, fitted RING, BAR, STAR, CRESCENT
const clue = await az(() => {
  const g = AZ, r = {};
  const tag = LVB.cand('maintTag');
  LVB.place(tag.pos[0] - 0.6, tag.pos[2] + 1.4);
  LVB.use('maintTag'); LVB.talkOut();
  r.now = !!g.facts.get('ev_lock_order');
  g.edition.shift('PAST'); g.simulate(0.1);
  LVB.use('maintTag'); LVB.talkOut();
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
  return { flag: AZ.deckWorld.flags.inv_m11lock_CRESCENT, out: p?.partOut.map((v, k) => (v === true ? p.rec.parts[k].name : null)).filter(Boolean), quarter: AZ.campaign.quarter, mk: AZ.edition.deck.mkey, inv: !!AZ.campaign.inv };
});
// (a load plays the PREVIOUSLY card: let it pass)
await page.waitForFunction(() => { LVB.talkOut(1); return !AZ.edition.opening && !AZ.edition.cinema.active && AZ.voice.loading >= 1; }, null, { timeout: 120000, polling: 250 }).catch(() => {});
check(reload.flag && JSON.stringify(reload.out) === '["CRESCENT"]' && reload.mk === 'm11' && reload.inv, 'a settled bolt survives a save and a load', JSON.stringify(reload));
const rest = [];
for (const n of ['STAR', 'BAR', 'RING']) rest.push(await bolt(n));
const opened = await az(() => {
  const g = AZ;
  LVB.talkOut();
  const d = g.deckWorld.dynamic.find((x) => x.el.id === 'door_m11ward32');
  const r = { done: g.facts.get('inv_m11lock_done'), shut: d?.cond(g.deckWorld.ctx(d.el.room)), said: LVB.said.some((l) => l.includes('Nothing pushes it back in.')) };
  const p = LVB.proc('m11lock'), w = LVB.lm('ward32');
  LVB.place(p.rec.aim[0], p.rec.aim[2] + 1.8);
  r.left = +LVB.walkTo(w[0], w[2], 12).toFixed(2);
  r.inWard = g.room === 'h_ward32';
  return r;
});
check(rest.every((r) => r.out.length >= 2) && opened.done && opened.shut === false && opened.said && opened.inWard,
  'CRESCENT, STAR, BAR, RING: inv_m11lock_done, and Ward 32 opens (walked into)', JSON.stringify({ rest, opened }));
const m11 = await playMission('m11', { sides: ['photo', 'echo'] });
check(await az(() => AZ.facts.get('ward32_read') && AZ.facts.get('child_step3') && AZ.facts.get('inv_odileEcho_done')), 'Ward 32: the bed, Lin\'s lanyard, the file; the photo board\'s two ages and Odile\'s echo run forwards (her side stories)');
await finish();
check(await az(() => LVB.said.includes('NONE: The file: VAREN, M., age 32. The record is twenty-three years old. The death date is blank. The photograph is Lin.') && LVB.voices.some((v) => v.who === 'WITNESS' && v.fx === 'pa' && v.text === 'Close the file, Kai.')),
  'its hook: VAREN, M., age 32, the death date blank, the photograph is Lin; the Witness on the ward speakers: "Close the file, Kai."');

// --- Mission 12: the chase never fails (he waits at the glass); the Witness holds the stair in Kai's colour, then Kai ---
const chase12 = await az(() => {
  const g = AZ, n = LVB.npc('witness_chase'), m = n.model.position;
  const r = { start: [+m.x.toFixed(1), +m.z.toFixed(1)] };
  // Kai far behind (25 m): he waits for him
  LVB.place(m.x - 25, m.z + 2, m.y + 0.9);
  g.simulate(3);
  r.waited = Math.hypot(m.x - r.start[0], m.z - r.start[1]) < 0.3;
  r.s0 = LVB.setbacks;
  return r;
});
const m12 = await playMission('m12', { sides: ['flowers', 'board'], before: 'ruin' });
const m12f = await az(() => ({ ...LVB.f('t_m12_chase', 'm12_stair_shown', 't_m12_stair', 'm12_faced', 'route_known'), scar: LVB.said.includes('WITNESS: The person you become when you refuse to let go.'),
  vm: LVB.voices.some((v) => v.who === 'WITNESS' && v.fx === 'radio' && v.text.startsWith('Kai Varen. If you are hearing this')), setbacks: LVB.setbacks }));
check(chase12.waited && m12f.t_m12_chase && m12.steps.find((s) => s.id === 'chase')?.done && m12.steps.find((s) => s.id === 'chase')?.setbacks === 0, 'Mission 12: the chase across the roofs never fails: he waits while Kai is far, and is never caught', JSON.stringify({ chase12, m12f }));
check(m12f.m12_stair_shown && m12f.t_m12_stair && order(m12.steps, 'witnessStair', 'stair', 'beam'), 'the Witness reverses the fallen stair in Kai\'s own colour and goes down it; Kai follows by REVERSE', JSON.stringify(m12.steps.map((s) => s.id || s.side)));
check(m12f.vm && m12f.scar && m12f.m12_faced && m12f.route_known, 'the voicemail plays (received 05:40); face to face: "The person you become when you refuse to let go."', JSON.stringify(m12f));
await finish();

// --- Mission 13: a shell reversed from each side pins ev_both_sides; nobody fired first; the faction is set --------------
const quay = await az(() => { const at = AZ.player.pos.toArray(); AZ.edition.shift('PRESENT'); LVB.place(0, 84); const r = LVB.route([[2.6, 80], [2.6, 68], [24, 60], [24, 14]]); LVB.place(at[0], at[2], at[1]); return r; });
check(quay.n === quay.of && !quay.setbacks, 'Mission 13, walked: from the quay trench through the gap in the sandbags, past the container canyons to their gate', JSON.stringify(quay));
const m13 = await playMission('m13', { sides: ['evidence'], before: 'stabilizer' });
const m13f = await az(() => ({ ...LVB.f('inv_shellA_done', 'inv_shellB_done', 'ev_both_sides', 'ev_nobody_first', 'ev_witness_cause'), faction: AZ.facts.get('faction'), cap: AZ.edition.inv.cap,
  north: LVB.said.includes('NONE: It climbs. Not south. North, over the Continuum line, back into a Continuum gun.'), sera: LVB.said.includes('SERA: The future that survives long enough to remember us.') }));
check(m13f.inv_shellA_done && m13f.inv_shellB_done && m13f.ev_both_sides && m13f.north && order(m13.steps, 'shells', 'firstShot'), 'Mission 13: a Continuum shell and an Unwritten shell reversed in flight, each back into its own gun: ev_both_sides', JSON.stringify(m13f));
check(m13f.ev_nobody_first && m13f.sera && ['unwritten', 'continuum'].includes(m13f.faction) && m13f.cap === 10, 'nobody fired first; Sera: "The future that survives long enough to remember us."; the faction is set and REVERSE holds 10 s', JSON.stringify(m13f));
check(m13f.ev_witness_cause, 'The Ninth Minute: Evidence: the burial reversed shows a scarred wrist (ev_witness_cause)', JSON.stringify(m13f));
await finish();
const act3 = await az(() => ({ ...LVB.where(), name: AZ.edition.deck.name }));
check(act3.chapter === 'act3' && act3.name === 'WELCOME TO 2196', 'Act II ends; Act III begins with Mission 14', JSON.stringify(act3));
// the bot's walk times: each mission's own telemetry (time_<mkey>), the model's minutes beside them
const walks = await az(() => Object.fromEntries(['m04', 'm05', 'm06', 'm07', 'm08', 'm09', 'm10', 'm11', 'm12', 'm13'].map((k) => [k, AZ.facts.get(`time_${k}`)])));
for (const [k, w] of Object.entries(WALK)) console.log(`  (${k} walked by the bot: ${((walks[k] || 0) / 60).toFixed(1)} min of game time, ${(w.sideSecs / 60).toFixed(1)} of it side stories; ${w.walked} walks, ${w.placed} placings over ${w.short} m a straight walk could not take; ${w.setbacks} setback frames)`);
check(Object.values(walks).every((t) => t > 120), 'telemetry: each of Missions 4-13 stores its time as it ends', JSON.stringify(walks));

// --- Acts III and IV and the Finale, played thread by thread (OVERHAUL.md §11 U8) -------------------------------------
// Missions 14 to 23 in order, as their objectives show them (LVP), with the moments the sheets name done with real
// movement: the lift car that carries Kai up the bank (M14), the dual archive (M15), the pylons' hold and the slab stair
// (M18), the bridge in the reflection (M19), three memories aligned (M20), the elites' rewind and the arena (M21), the
// evidence at the first second (M22); the Finale's two holds to Ending C, its epilogue and the voice in every speaker
console.log('Acts III and IV and the Finale: Missions 14 to 23, played thread by thread');
await az(() => {
  const g = AZ, B = LVB, P = LVP;
  const lm = (n) => g.level.landmarks[n];
  P.checks = {};
  // a hold (Mission 18): Kai stays by it; when a post drifts, he goes to it in its year and re-anchors it
  P.kinds.hold = (t) => {
    const T = g.edition.threads, a = lm(t.at);
    const home = () => P.go([a[0], a[1], a[2] - 4], 3);
    // (the watchers stand still: keeping the scavengers off is another check's business)
    const held = g.deckWorld.sentinels.splice(0);
    home();
    let anchored = 0, far = 0;
    for (let k = 0; k < 1600 && !P.done(t); k++) {
      g.simulate(0.25);
      if (g.hud.talking || g.menu) P.out();
      if (Math.hypot(g.player.pos.x - a[0], g.player.pos.z - a[2]) > (t.r ?? 30) - 4) { far++; home(); }
      const S = T.holds[t.id];
      const i = S ? S.posts.findIndex((q) => q.st !== 'ok') : -1;
      if (i >= 0) {
        const po = t.posts[i];
        P.use(`hold_${t.id}_${i}`, [po.year], lm(po.at)[1]);
        anchored++;
        home();
      }
    }
    g.deckWorld.sentinels.push(...held);
    P.checks.hold = { done: P.done(t), anchored, far, prog: g.facts.get(`hold_${P.mk()}_${t.id}`), posts: T.holds[t.id]?.posts.map((q) => q.st) };
  };
  // hold a process with REVERSE from where Kai stands (no stepping round it to aim)
  // (before a measured walk: nothing staged or said still playing, no menu, no setback's fade under way)
  P.ready = () => {
    if (g.menu === 'pause') g.closeMenu();
    P.out();
    P.wait(() => !g.edition.cinema?.active && !g.hud.talking && g.menu !== 'choice', 30, 0.2);
    if (g.menu === 'pause') g.closeMenu();
  };
  P.holdHere = (id) => {
    const p = B.proc(id);
    if (!p) return `no ${id}`;
    const got = B.aim(g.edition.inv.aimOf(p));
    if (got !== id) return `aim: ${got}`;
    B.rev();
    return g.edition.inv.active?.p === p ? 'held' : 'not held';
  };
  P.own.m14 = {
    // the bank's lift car: Kai stands in it, REVERSEs it, and it carries him up the shaft to the roof's landing
    lift: (t) => {
      P.ready();
      P.year('FUTURE');
      g.edition.stability = 1;
      g.edition.inv.state.charge = g.edition.inv.cap;
      const p = B.proc('liftCar'), r = p.rec.parts[0].rest.p;
      B.place(r[0], r[2], r[1] + 0.4 + 0.86);
      g.simulate(0.5);
      const y0 = g.player.pos.y - 0.86, s0 = B.setbacks;
      const held = P.holdHere('liftCar');
      let top = y0;
      for (let k = 0; k < 120 && g.edition.inv.active; k++) { g.simulate(0.1); top = Math.max(top, g.player.pos.y - 0.86); if (p.P >= 0.999) break; }
      // off the car, west over the sill, onto the roof terrace (still held)
      const left = B.walk([[-45.6, g.player.pos.z], [-47, 74], [lm('roofGarden')[0], lm('roofGarden')[2]]], 8);
      P.release();
      g.simulate(0.4);
      P.checks.lift = { held, y0: +y0.toFixed(1), top: +top.toFixed(1), y: +(g.player.pos.y - 0.86).toFixed(1), left, setbacks: B.setbacks - s0, done: P.done(t) };
      if (!P.done(t)) P.kinds.go(t);
    },
  };
  P.own.m15 = {
    // (the archive's cards and books: each reversed where it stands, and the dual archive pinned)
    ink: (t) => {
      for (const k of t.of) if (!P.f(k)) P.revDone(k);
      P.checks.ink = { dual: P.f('ev_dual_archive'), mara: P.f('quest_mara') };
    },
  };
  P.own.m17 = {
    echoes: (t) => { P.year('PAST'); P.go(lm(t.at), 2); g.simulate(0.4); },
  };
  P.own.m18 = {
    // the core's slabs: from the stump, hold them (they come back last fallen first) and climb the stair while it holds
    slabStair: (t) => {
      P.ready();
      P.year('FUTURE');
      g.edition.stability = 1;
      g.edition.inv.state.charge = g.edition.inv.cap;
      const s = lm('slabs');
      B.place(s[0] - 1.6, s[2], s[1] + 0.86);
      g.simulate(0.4);
      const s0 = B.setbacks, y0 = g.player.pos.y - 0.86;
      const held = P.holdHere('slabs');
      g.simulate(2.2); // (the stair comes back, last fallen first)
      const route = B.route([[s[0] + 3, s[2]], [s[0] + 7, s[2]], [s[0] + 10.6, s[2]], [6, 108]], 8);
      P.release();
      g.simulate(0.4);
      P.checks.slabs = { held, y0: +y0.toFixed(1), y: +(g.player.pos.y - 0.86).toFixed(1), route, setbacks: B.setbacks - s0, done: P.done(t) };
      if (!P.done(t)) P.revDone('rev_slabs');
    },
    // up the tilted floors to the tower's deck, walked
    climb: (t) => {
      P.ready();
      P.year('FUTURE');
      const r = B.route([[10, 112], [10, 138], [14, 144], [26, 146], [26, 176], [30, 180], [24, 186]], 20);
      P.checks.climb = { ...r, y: +(g.player.pos.y - 0.86).toFixed(1) };
      if (!P.done(t)) P.kinds.go(t);
    },
  };
  P.own.m19 = {
    // the bridge in the reflection, walked in 2026 (where it was)
    bridge: (t) => {
      P.ready();
      g.edition.stability = 1;
      P.year('PAST');
      B.place(0, -18);
      const past = B.route([[0, -30], [0, -38], [0, -42]]);
      past.y = +(g.player.pos.y - 0.86).toFixed(2);
      P.checks.mirror = { ...(P.checks.mirror || {}), past };
      g.simulate(0.4);
      if (!P.done(t)) P.kinds.go(t);
    },
  };
  P.own.m20 = {
    // the board: the six moments, one a use, in an order that keeps each memory's own (the house's, interleaved)
    align: (t) => {
      const order = ['She asks to see the ring turn.', 'The drawing goes on the fridge.', 'The 41 is late.', 'The ring turns.', 'The song, in the kitchen.', 'She plants the garden.'];
      const was = P.pick;
      const tried = [];
      for (let i = 0; i < 9 && !P.done(t); i++) {
        const next = order.find((l) => !tried.includes(l));
        // (Kai leading, the first time: his tidy version, which the board refuses)
        P.pick = (opts) => { const k = opts.findIndex((o) => o.text.includes('Mine first')); if (k >= 0 && !P.f('m20_tidy')) return k; tried.push(next); return opts.findIndex((o) => o.text.includes(next)); };
        P.use('align', null, lm('alignBoard')[1]);
      }
      P.pick = was;
      P.checks.align = { aligned: P.f('m20_aligned'), tidy: P.f('m20_tidy'), lead: P.f('m20_lead'), said: B.said.includes('MIRA: They\'re all mine.') };
    },
  };
  P.own.m21 = {
    // the elites: an afterimage throws one back five seconds; its rewind, reversed, leaves it stuck where it stands
    elites: (t) => {
      const out = {};
      P.year('PRESENT');
      const s = g.deckWorld.sentinels.find((x) => /_q0s0$/.test(x.def.id));
      g.edition.stability = 1;
      g.edition.echoCd = 0;
      for (let k = 0; k < 4 && !P.f('m21_snapped'); k++) {
        B.place(-70, 30);
        g.simulate(5.5); // (it walks: there is somewhere to throw it back to)
        B.place(s.pos.x + 3, s.pos.z + 3);
        const p0 = s.pos.clone();
        g.edition.echoCd = 0;
        g.edition.stability = 1;
        g.edition.echoStep();
        out.jump = +p0.distanceTo(s.pos).toFixed(1);
        P.out();
      }
      out.snapped = P.f('m21_snapped');
      for (let k = 0; k < 3 && !P.f('m21_stuck'); k++) {
        g.edition.inv.state.charge = g.edition.inv.cap;
        B.place(s.pos.x + 4, s.pos.z + 4);
        out.rev = P.holdHere('eliteA');
        const p1 = s.pos.clone();
        g.simulate(3);
        out.still = +p1.distanceTo(s.pos).toFixed(2);
        P.out();
      }
      out.stuck = P.f('m21_stuck');
      P.checks.elites = out;
    },
    // the first gap: hold the fallen slab and cross on it
    gapOne: (t) => {
      P.ready();
      g.edition.stability = 1;
      g.edition.inv.state.charge = g.edition.inv.cap;
      const a = lm('arenaGap1');
      P.year('PRESENT');
      B.place(a[0] + Math.sin(a[3]) * -2.4, a[2] + Math.cos(a[3]) * -2.4, a[1] + 0.86);
      g.simulate(0.3);
      const held = P.holdHere('arenaGap1');
      g.simulate(2);
      const m = lm('arenaMid');
      const route = B.route([[a[0] + Math.sin(a[3]) * 8.6, a[2] + Math.cos(a[3]) * 8.6], [m[0], m[2]]], 8);
      P.release();
      P.checks.gapOne = { held, route, y: +(g.player.pos.y - 0.86).toFixed(1), done: P.done(t) };
      if (!P.done(t)) P.kinds.go(t);
    },
    // the second gap: in 2196 a frozen girder lies across it
    gapTwo: (t) => {
      P.ready();
      P.year('FUTURE');
      g.edition.stability = 1;
      const route = B.route([[-15.1, -42.6], [-19.2, -41], [-23.2, -39.3], [-26.2, -37.3], [lm('summitStair')[0], lm('summitStair')[2]]], 8);
      P.checks.gapTwo = { route, y: +(g.player.pos.y - 0.86).toFixed(1), ally: P.f('ally') };
      g.simulate(0.3);
      if (!P.done(t)) P.kinds.go(t);
      P.present();
    },
  };
  P.own.m22 = {
    // the arm answers only on its counted beat: off the beat it jams; Kai tries again, on the turn
    arm: (t) => {
      let jams = 0;
      for (let k = 0; k < 12 && !P.f('inv_clockArm_done'); k++) {
        g.edition.inv.state.charge = g.edition.inv.cap;
        const j0 = P.f('inv_jams') || 0;
        P.log.push(`  reverse clockArm: ${P.rev('clockArm')}`);
        if ((P.f('inv_jams') || 0) > j0) jams++;
        P.wait(() => P.f('inv_clockArm_done') || !g.edition.inv.active, 4, 0.2);
        P.release();
        g.simulate(0.3 + (k % 3) * 0.37);
      }
      P.checks.arm = { done: P.f('inv_clockArm_done'), jams };
    },
    // the seals: last fitted, first out (MACHINE, GATE, WALL, RIVER)
    seals: () => {
      for (const b of ['MACHINE', 'GATE', 'WALL', 'RIVER']) {
        g.edition.inv.state.charge = g.edition.inv.cap;
        P.log.push(`  seal ${b}: ${P.rev('finalSeals', b)}`);
        P.wait(() => !g.edition.inv.active, 6, 0.2);
        g.simulate(0.4);
      }
      P.wait(() => P.f('inv_finalSeals_done'), 8);
    },
  };
  P.own.m23 = {
    // the street that fell: he holds its far half; in 2026 its near half still stands
    street: (t) => {
      P.ready();
      g.edition.stability = 1;
      const p = B.proc('streetCollapse');
      P.wait(() => p.P > 0.98, 6, 0.2);
      const held = p.heldBy;
      P.year('PAST');
      B.place(2, 140);
      const route = B.route([[2, 134], [2, 129], [2, 124], [2, 118], [2, 113]]);
      P.checks.street = { held, risen: +p.P.toFixed(2), route, y: +(g.player.pos.y - 0.86).toFixed(1), done: P.done(t) };
      P.present();
      if (!P.done(t)) P.kinds.go(t);
    },
    // the swap: Kai holds the settlement's bridge; the Witness crosses first, then Kai
    bridge: (t) => {
      P.ready();
      g.edition.stability = 1;
      g.edition.inv.state.charge = g.edition.inv.cap;
      P.present();
      B.place(1.5, 68.5);
      g.simulate(0.3);
      const held = P.holdHere('settlementBridge');
      g.simulate(1.6);
      const route = B.route([[0.5, 66], [0, 60], [0, 54], [0, 50]]);
      P.release();
      P.wait(() => P.done(t), 6);
      P.checks.bridge = { held, route, y: +(g.player.pos.y - 0.86).toFixed(1), witness: P.f('m23_witness_across'), done: P.done(t) };
      if (!P.done(t)) P.revDone('rev_settlementBridge');
    },
    // 2196: the memorial, then Sera (her talk is evidence too)
    city: (t) => {
      P.kinds.clue(t);
      if (!P.done(t)) P.talk('sera23');
      if (!P.done(t)) P.talk('anja23');
    },
  };
  return 'ok';
});
// the bot's choices from here: Sera told he came back, the city freed, the photograph taken, the letter carried, the door
// opened for Mira (Kai leads), nobody called at the arena, the anchor (Ending C)
await az(() => { LVP.pick = (opts) => { for (const want of ['I came back', 'Free it', 'Take it.', 'Carry it to him.', 'Open the door', 'Nobody', 'Become the anchor']) { const k = opts.findIndex((o) => o.text.includes(want)); if (k >= 0) return k; } return 0; }; });

// --- Mission 14 ------------------------------------------------------------------------------------------------------
console.log('Act III, Mission 14: Welcome to 2196');
const crowd14 = await az(() => { const c = AZ.deckWorld.npcs.filter((n) => n.n.crowd && n.model.visible); return { year: AZ.engine.state(AZ.room), n: c.length, models: [...new Set(c.map((n) => n.model.userData.spec?.model))] }; });
const faces14 = crowd14.year === 'FUTURE' ? ['rb_trader', 'rb_villager_f', 'rb_civ_f3', 'rb_scav', 'rb_child_m2'] : ['rb_civ_f1', 'rb_civ_f2', 'rb_civ_m1', 'rb_civ_m2', 'rb_courier', 'rb_contractor'];
check(crowd14.year === 'FUTURE' && crowd14.n >= 3 && crowd14.models.every((m) => faces14.includes(m)), 'Mission 14 opens in 2196, its home year; a crowd of survivors walks it', JSON.stringify(crowd14));
const drain14 = await az(() => {
  const z = AZ.edition.deck.mkey === 'm14' ? [6, -10] : null;
  LVB.place(z[0], z[1]);
  const a = AZ.edition.stability;
  AZ.simulate(4);
  const b = AZ.edition.stability;
  AZ.edition.stability = 1;
  LVB.place(0, 30);
  return { a, b };
});
check(drain14.b < drain14.a, 'in a shimmering patch of the 2196 street, the Chronolith\'s stability drains', JSON.stringify(drain14));
const m14 = await playMission('m14', { sides: ['garden'] });
const lift14 = await az(() => LVP.checks.lift);
check(lift14?.held === 'held' && lift14.top > 22 && Math.abs(lift14.y - 24) < 0.8 && !lift14.setbacks && lift14.done, 'Mission 14: Kai stands in the fallen lift car, REVERSEs it, rides it 24 m up the bank and steps off onto the roof', JSON.stringify(lift14));
const m14f = await az(() => ({ ...LVB.f('beacon_built', 'ev_memorial', 'ev_fresh_flowers', 'garden_restored'), sera: AZ.facts.get('trust_sera') }));
check(m14f.beacon_built && m14f.ev_memorial && m14f.garden_restored && ['deny', 'accept', 'ask'].includes(m14f.sera), 'the memorial with Kai\'s name; Sera\'s question answered (trust_sera); the beacon; the Survivor\'s Garden watered', JSON.stringify(m14f));
await finish();

// --- Mission 15 ------------------------------------------------------------------------------------------------------
console.log('Act III, Mission 15: The City That Forgot Tomorrow');
const m15 = await playMission('m15', { sides: ['train'] });
const m15f = await az(() => ({ ...LVP.checks.ink, ...LVB.f('inv_card14_done', 'inv_archiveA_done', 'inv_archiveB_done', 'ev_river_14', 'city_freed', 'city_stabilized'), jun: AZ.facts.get('quest_jun') }));
check(m15f.dual && m15f.mara === 'resolved' && m15f.inv_card14_done && m15f.inv_archiveA_done && m15f.inv_archiveB_done, 'Mission 15: the card\'s forgery un-written, the two archives both original: ev_dual_archive, chain C resolved', JSON.stringify(m15f));
check(m15f.ev_river_14 && (m15f.city_freed || m15f.city_stabilized) && m15f.jun === 'observed', 'the fourteenth was a flood; Anja\'s lock decided; the train that arrives yesterday', JSON.stringify(m15f));
await finish();

// --- Mission 16: the spiral, walked; the three memories, the photograph ---------------------------------------------
console.log('Act III, Mission 16: The Museum of Failed Worlds');
const spiral = await az(() => {
  const g = AZ;
  g.edition.shift('FUTURE');
  g.edition.stability = 1;
  const at = g.player.pos.toArray();
  const pts = [[0, 58], [0, 55]];
  for (let a = 96; a <= 624; a += 6) { const r = 55 - (18 * (a - 90)) / 540; pts.push([Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r]); }
  pts.push([0, -33], [0, -30], [3, -20], [3, -12], [1, -6]);
  const l = LVB.lm('rimGate');
  LVB.place(l[0], l[2], l[1] + 0.86);
  const r = LVB.route(pts, 12);
  r.y = +(g.player.pos.y - 0.86).toFixed(2);
  LVB.place(at[0], at[2], at[1]);
  return r;
});
check(spiral.n === spiral.of && !spiral.setbacks && Math.abs(spiral.y + 12) < 0.6, `the Museum's spiral, ${spiral.of} waypoints from the rim at 26 m down to the floor at -12 m`, JSON.stringify(spiral));
const m16 = await playMission('m16', { sides: ['names'] });
const m16f = await az(() => LVB.f('ev_memory_one', 'ev_memory_two', 'ev_memory_three', 'ev_museum_his', 'm16_photo', 'ev_erased'));
check(Object.values(m16f).every(Boolean), 'Mission 16: three memories (the second on its reel, REVERSEd), the Witness\'s museum, the photograph; the Names beneath the city', JSON.stringify(m16f));
await finish();

// --- Mission 17 ------------------------------------------------------------------------------------------------------
console.log('Act III, Mission 17: The Witness\'s Archive');
const m17 = await playMission('m17', { sides: ['letter'] });
const m17f = await az(() => ({ ...LVB.f('ev_two_logs', 'm17_price', 'ev_i_pressed'), letter: AZ.facts.get('letter'), said: LVB.said.includes('WITNESS: They became the price.') }));
check(m17f.ev_two_logs && m17f.m17_price && m17f.ev_i_pressed && m17f.said && m17f.letter, 'Mission 17: the two logs (sealed), "They became the price.", the memory at the console; the Unsent Letter', JSON.stringify(m17f));
await finish();

// --- Mission 18 ------------------------------------------------------------------------------------------------------
console.log('Act III, Mission 18: The Fracture');
const m18 = await playMission('m18', { sides: ['signal'], before: 'climb' });
const m18f = await az(() => ({ hold: LVP.checks.hold, slabs: LVP.checks.slabs, climb: LVP.checks.climb, ...LVB.f('m18_stabilized', 'ev_mira_message', 'last_signal'), cap: AZ.edition.inv.cap }));
check(m18f.hold?.done && m18f.hold.anchored >= 2 && m18f.m18_stabilized && m18f.cap === 12, 'Mission 18: the pylons held in phase, each re-anchored in its own year; the Chronolith holds twelve seconds', JSON.stringify(m18f.hold));
check(m18f.slabs?.held === 'held' && m18f.slabs.route.n === m18f.slabs.route.of && !m18f.slabs.setbacks && m18f.slabs.y > 11, 'the slab stair: the core\'s slabs reversed, last fallen first, and climbed while they hold, from the stump to the tilted floors', JSON.stringify(m18f.slabs));
check(m18f.ev_mira_message && m18f.last_signal, 'Mira\'s message on the tower\'s screen; the Last Signal (Iven out of the pocket)', JSON.stringify(m18f));
await finish();
const act4 = await az(() => ({ ...LVB.where(), name: AZ.edition.deck.name, card: LVB.said.includes('NONE: Act Four. The Unwritten Second.') }));
check(act4.chapter === 'act4' && act4.name === 'THE PLACE OUTSIDE TIME' && act4.card, 'Act III ends; Act IV begins with Mission 19, on its card', JSON.stringify(act4));

// --- Mission 19 ------------------------------------------------------------------------------------------------------
console.log('Act IV, Mission 19: The Place Outside Time');
const wrap19 = await az(() => { const at = AZ.player.pos.toArray(); LVB.place(106, 60); LVB.walkTo(112, 60, 3); const x = +AZ.player.pos.x.toFixed(1); LVB.place(at[0], at[2], at[1]); return x; });
check(wrap19 < -95, 'the roads loop: off the plain\'s east edge, back in from the west', String(wrap19));
// (in 2049 the bridge is only a reflection: into the water, and the setback's fade runs on the page's timers)
await az(() => { const at = AZ.player.pos.toArray(); AZ.edition.stability = 1; LVP.year('PRESENT'); LVB.place(0, -18); LVP.checks.mirror = { present: LVB.route([[0, -30], [0, -38]], 6), back: at }; });
await page.waitForTimeout(1200);
await page.waitForFunction(() => !AZ.catching, null, { timeout: 90000 }).catch(() => {});
await az(() => { const b = LVP.checks.mirror.back; LVB.place(b[0], b[2], b[1]); });
const m19 = await playMission('m19', { sides: ['orren'] });
const mirror19 = await az(() => LVP.checks.mirror);
check(mirror19?.past.n === mirror19.past.of && !mirror19.past.setbacks && Math.abs(mirror19.past.y) < 0.6 && mirror19.present.setbacks > 0, 'the bridge in the reflection: in 2049 only water; in 2026 walked over it', JSON.stringify(mirror19));
const m19f = await az(() => ({ ...LVB.f('ev_real_door', 'm19_orren3'), lead: AZ.facts.get('m20_lead'), said: LVB.said.some((l) => l.includes('the version of me that would forgive you')) }));
check(m19f.ev_real_door && m19f.lead === 'kai' && m19f.said && m19f.m19_orren3, 'the real door casts no shadow; Mira: "You\'ve been trying to reach the version of me that would forgive you."; Kai leads; Orren\'s three conversations', JSON.stringify(m19f));
await finish();

// --- Mission 20 ------------------------------------------------------------------------------------------------------
console.log('Act IV, Mission 20: Mira\'s Memory');
const refuse20 = await az(() => {
  const g = AZ, p = LVB.proc('fridge');
  g.edition.shift('PAST');
  const a = g.edition.inv.aimOf(p);
  LVB.place(a[0] + 2, a[2]);
  const got = LVB.aim(a);
  LVB.rev();
  LVB.talkOut();
  return { got, active: !!g.edition.inv.active, mira: LVB.said.includes('MIRA: Don\'t. Let it happen the way it happened.'), label: document.querySelector('#lvInvTarget')?.textContent || null };
});
check(refuse20.got === 'fridge' && !refuse20.active && refuse20.mira, 'REVERSE on a memory: refused, and Mira says "Don\'t. Let it happen the way it happened."', JSON.stringify(refuse20));
const m20 = await playMission('m20', { sides: ['house'] });
const align20 = await az(() => LVP.checks.align);
check(align20?.aligned && align20.tidy && align20.lead === 'kai' && align20.said, 'three memories aligned without forcing them into one: Kai\'s tidy line refused, each memory\'s own order kept, "They\'re all mine."', JSON.stringify(align20));
const m20f = await az(() => ({ ...LVB.f('ev_her_side', 'child_resolved', 'm20_sister', 'ev_no_owner'), said: LVB.said.includes('MIRA: I remember being your sister.') }));
check(Object.values(m20f).every(Boolean), 'her side of the experiment; the Child and Mira sing it down; "I remember being your sister."; the House with No Owner', JSON.stringify(m20f));
await finish();

// --- Mission 21 ------------------------------------------------------------------------------------------------------
console.log('Act IV, Mission 21: The Last Battle of the Continuum');
const m21 = await playMission('m21', { sides: ['radio'] });
const m21f = await az(() => ({ elites: LVP.checks.elites, gapOne: LVP.checks.gapOne, gapTwo: LVP.checks.gapTwo, ...LVB.f('arena_fallen', 'm21_wrists'), ally: AZ.facts.get('ally') }));
check(m21f.elites?.snapped && m21f.elites.stuck, 'the elites: an afterimage throws one back five seconds; its rewind REVERSEd leaves it stuck', JSON.stringify(m21f.elites));
check(m21f.arena_fallen && m21f.gapOne?.held === 'held' && m21f.gapOne.route.n === m21f.gapOne.route.of && m21f.gapTwo?.route.n === m21f.gapTwo.route.of && m21f.ally === 'none',
  'the arena falls: the first gap crossed on its slab, held; going alone, the second on 2196\'s frozen girder', JSON.stringify({ g1: m21f.gapOne, g2: m21f.gapTwo, ally: m21f.ally }));
check(m21f.m21_wrists, 'the two wrists, side by side', JSON.stringify(m21f));
await finish();

// --- Mission 22 ------------------------------------------------------------------------------------------------------
console.log('Act IV, Mission 22: The First Second');
const m22 = await playMission('m22', { sides: ['record'] });
const m22f = await az(() => ({ arm: LVP.checks.arm, ...LVB.f('ev_chain', 'inv_finalSeals_done', 'inv_twoLogs_done', 'ev_second_early', 'm22_reveal', 'm22_chamber', 'ev_unwritten_record'),
  logs: LVB.said.includes('NONE: Two logs, one second apart. RING: 16:02:00. CONSOLE BUTTON: 16:02:01.'), early: LVB.said.includes('WITNESS: …No. I was a second early.'), pa: LVB.voices.find((v) => v.text === 'Kai Varen. Do not build the machine.' && v.who === 'WITNESS')?.fx }));
check(m22f.ev_chain && m22f.arm?.done && m22f.inv_finalSeals_done, 'Mission 22: the chain inferred; the arm reversed on its beat; the seals undone last fitted first', JSON.stringify(m22f));
check(m22f.logs && m22f.ev_second_early && m22f.early && m22f.pa === 'pa', 'the deduction: the logs keep the second ("…No. I was a second early."), the warnings\' speaker fixed: the Witness at the microphone', JSON.stringify(m22f));
check(m22f.m22_reveal && m22f.m22_chamber && m22f.ev_unwritten_record, 'the reveal; the final chamber; the Unwritten Record', JSON.stringify(m22f));
await finish();

// --- the Finale ------------------------------------------------------------------------------------------------------
console.log('The Finale: Afterzero');
const fin = await az(() => ({ ...LVB.where(), name: AZ.edition.deck.name, drones: AZ.deckWorld.sentinels.filter((s) => /_q0s\d$/.test(s.def.id)).length, jun: AZ.facts.get('jun_line') }));
check(fin.chapter === 'finale' && fin.name === 'AFTERZERO' && (!fin.jun || fin.drones === 0), 'Act IV ends; the Finale begins (the passengers Kai got off the 41 have cleared the opening streets)', JSON.stringify(fin));
const m23 = await playMission('m23', { sides: ['gallery'], before: 'mira' });
const m23f = await az(() => ({ street: LVP.checks.street, bridge: LVP.checks.bridge, ...LVB.f('m23_asked'), ask: LVB.said.includes('MIRA: Ask me.'), time: LVB.said.includes('WITNESS: And, Kai. For once, you are on time.') }));
check(m23f.street?.held === 'witness' && m23f.street.route.n === m23f.street.route.of && m23f.street.y > -0.5, 'the street that fell: he holds its far half; in 2026 Kai walks the near half and steps onto what he holds', JSON.stringify(m23f.street));
check(m23f.bridge?.held === 'held' && m23f.bridge.witness && m23f.bridge.route.n === m23f.bridge.route.of && m23f.time, 'the swap: Kai holds the settlement\'s bridge, the Witness crosses, then Kai: "For once, you are on time."', JSON.stringify(m23f.bridge));
check(m23f.m23_asked && m23f.ask, 'Mira: "Ask me."', JSON.stringify(m23f));
for (let i = 0; i < 60 && !(await az(() => AZ.menu === 'ending')); i++) await az(() => { LVB.talkOut(30); AZ.simulate(0.5); });
const ending = await az(() => ({ menu: AZ.menu, text: document.querySelector('#ending .body')?.textContent || '', ending: AZ.facts.get('ending') }));
const endSaid = await az(() => ({ heard: AZ.edition.score.heard.filter((c) => /ending|postcredit/.test(c)), said: LVB.said.slice(-40) }));
check(endSaid.heard.includes('ending:C') && endSaid.heard.includes('postcredit') && endSaid.said.includes('KAI: I finally found a second that belongs to nobody.') && endSaid.said.includes('NONE: Rain City, a Tuesday. The 41 is late.') && endSaid.said.includes('KAI: Live.'),
  'Ending C: the bible\'s text, what it adds (a Tuesday, the 41 late, three notes, "Live."), Kai\'s quote', JSON.stringify(endSaid));
check(endSaid.said.some((l) => l === 'MIRA: There\'s a letter in my desk to a brother I never had. I keep meaning to send it.') && endSaid.said.includes('VOICE: Version one hundred and eighteen.') && !endSaid.said.some((l) => /post-credit/i.test(l)),
  'the epilogue, one line per fact set (Ending C: the letter to a brother she never had); then the voice in every speaker: "Version one hundred and eighteen."', JSON.stringify(endSaid.said.slice(-10)));
check(ending.menu === 'ending' && ending.ending === 'C' && /ENDING C/.test(ending.text) && /AFTERZERO/.test(ending.text), 'Ending C, Afterzero', JSON.stringify({ ...ending, text: ending.text.slice(0, 120) }));

// the bot's walk times, the game's own telemetry (time_<mkey>; the Finale's from its start to the ending), against the model
const walks2 = await az(() => ({ ...Object.fromEntries(['m14', 'm15', 'm16', 'm17', 'm18', 'm19', 'm20', 'm21', 'm22'].map((k) => [k, AZ.facts.get(`time_${k}`)])), m23: Math.round((AZ.playTime || 0) - (AZ.campaign.mStart || 0)) }));
for (const [k, w] of Object.entries(WALK)) if (walks2[k] != null) console.log(`  (${k} walked by the bot: ${((walks2[k] || 0) / 60).toFixed(1)} min of game time, ${(w.sideSecs / 60).toFixed(1)} of it side stories; ${w.walked} walks, ${w.placed} placings over ${w.short} m a straight walk could not take; ${w.setbacks} setback frames)`);
const chapters = await az(() => {
  const out = {};
  for (const [ch, ms] of Object.entries({ prologue: ['m01', 'm02', 'm03'], act1: ['m04', 'm05', 'm06', 'm07', 'm08'], act2: ['m09', 'm10', 'm11', 'm12', 'm13'], act3: ['m14', 'm15', 'm16', 'm17', 'm18'], act4: ['m19', 'm20', 'm21', 'm22'] })) out[ch] = +(ms.reduce((a, k) => a + (AZ.facts.get(`time_${k}`) || 0), 0) / 60).toFixed(1);
  out.finale = +(((AZ.playTime || 0) - (AZ.campaign.mStart || 0)) / 60).toFixed(1);
  return out;
});
console.log(`  (the bot's chapters, minutes of game time: ${JSON.stringify(chapters)})`);
check(Object.values(walks2).every((t) => t > 120), 'telemetry: each of Missions 14-23 stores its time as it ends (the Finale\'s at its ending)', JSON.stringify(walks2));

// --- CASE FILES -------------------------------------------------------------------------------------------------------
console.log('CASE FILES');
const caseFiles = await az(() => { document.querySelector('#lvCases').click(); return { menu: AZ.menu, n: document.querySelectorAll('#ending .caseFile').length, states: [...document.querySelectorAll('#ending .caseFile')].map((e) => e.dataset.state), replays: document.querySelectorAll('#ending [data-case]').length }; });
check(caseFiles.menu === 'ending' && caseFiles.n === 14 && caseFiles.replays === 12 && caseFiles.states.filter((s) => s !== 'open').length >= 6, 'THE CASES opens the CASE FILES: fourteen stories with their state, twelve replays', JSON.stringify(caseFiles));

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

// --- CASE FILES: a replay (after the run's voices are counted: it reloads the page) ---------------------------------
await page.evaluate(() => { window.__before = true; document.querySelector('#ending [data-case="c_garden"]').click(); });
await page.waitForFunction(() => !window.__before && window.AZ && AZ.pendingBoot && document.querySelector('#continue'), null, { timeout: 400000 });
await page.evaluate(() => setTimeout(() => document.querySelector('#continue').click(), 0));
await page.waitForFunction(() => AZ.started && AZ.mode === 'deck' && AZ.level?.place && AZ.edition.deck?.mkey === 'c_garden', null, { timeout: 300000 });
await az(() => { AZ.renderer.setAnimationLoop(null); });
const replay = await page.evaluate(() => ({ key: AZ.edition.deck.mkey, chapter: AZ.campaign.chapter, quarter: AZ.campaign.quarter, start: AZ.edition.deck.startQuarter, packs: AZ.voice.packs.map((p) => p.base),
  had: !!AZ.facts.get('m21_wrists') && AZ.facts.get('ending') === 'C', cleared: !AZ.facts.get('garden_restored'), replaying: AZ.facts.get('lv_replay') }));
check(replay.key === 'c_garden' && replay.chapter === 'cases' && replay.quarter === replay.start && replay.had && replay.cleared && replay.packs.some((p) => /act3/.test(p)),
  'a replay: the Survivor\'s Garden from its place, with the facts the player had (the story\'s own cleared), in Mission 14\'s voice', JSON.stringify(replay));

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
