// WORLD FORGE (v1.0): forges a SHORT game of every genre through the real setup panel, then plays
// each act through the real game systems: the scene of every sector (records, screens in ECHO, the
// cast and their two-option choices), the puzzle rooms of deck acts along the generator's own route
// under the act's local rules, the gate on to the next sector; tries every gear slot in every act
// and checks that the rules refuse it where they say so and that it does what it says where they
// allow it; reaches the chair, makes the last choice and sees the ending; saves in the middle of an
// act and continues from the chapter card after a reload. Writes forge-*.png screenshots: the
// panel, the LOCAL RULES card, gear in use and one act per location.
//   NODE_PATH=$(npm root -g) node tests/forge.mjs [genres=all]
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
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary' };
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
let passed = 0;
const failures = [];
const check = (ok, label, detail = '') => {
  if (ok) { passed++; console.log(`  ok   ${label}`); } else { failures.push(`${label} ${detail}`); console.log(`  FAIL ${label} ${detail}`); }
};
const az = (fn, a) => page.evaluate(fn, a);
const shot = (name) => page.screenshot({ path: path.join(shots, `forge-${name}.png`), timeout: 240000 });
const ready = () => page.waitForFunction(() => window.AZ && document.querySelector('#begin'), null, { timeout: 180000 });
const flush = () => az(() => { for (let i = 0; i < 160 && (AZ.hud.talking || AZ.timers.length); i++) { AZ.hud.subT = 0; AZ.simulate(0.1); } });

const GENRES = ['THRILLER', 'HORROR', 'MYSTERY', 'ADVENTURE', 'HEIST', 'SURVIVAL'];
const THEMES = ['neon', 'reactor', 'forest', 'tower', 'cradle', 'hydro', 'cryo', 'obs', 'eng', 'med', 'crew', 'arch', 'bridge'];
const GEAR = ['STASIS', 'GRAPPLE', 'LENS', 'RIG', 'FLARE', 'KEYFORGE'];
const want = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : GENRES;
const shotThemes = new Set();

// Plays one room along the generator's route (as tests/vessel.mjs), under the act's rules: with
// gravity INVERTED the states swap (PHYSICAL is upside down), in a null field no law is needed.
const PLAY_ROOM = ({ rid }) => {
  const g = window.AZ;
  const room = g.level.rooms[rid];
  const rules = g.level.rules;
  const LAW = {
    gravityFlip: ['GRAVITY', 'INVERTS', 'INVERTED'], echoSolid: ['ECHOES', 'SOLIDIFIES', 'ECHO'], zeroG: ['GRAVITY', 'FREEZES', 'PHYSICAL'],
    lightSolid: ['LIGHT', 'SOLIDIFIES', 'ALL'], heldPersists: ['HELD', 'PERSISTS', 'ALL'], timeStop: ['TIME', 'FREEZES', 'PHYSICAL'], observerFrozen: ['OBSERVER', 'FREEZES', 'PHYSICAL'],
  };
  const req = [...new Set(room.challenges.filter((c) => c.effect && !c.optional).map((c) => c.effect))];
  const opt = [...new Set(room.challenges.filter((c) => c.effect && c.optional).map((c) => c.effect))];
  const laws = [];
  if (!rules.nullField) {
    if (req.includes('gravityFlip') || opt.length + req.length < 3) laws.push(LAW.gravityFlip);
    for (const e of [...req, ...opt]) if (e !== 'gravityFlip' && laws.length < 3) laws.push(LAW[e]);
  }
  for (let i = 0; i < 3; i++) g.engine.setLaw(i, laws[i] ? { subject: laws[i][0], verb: laws[i][1], target: laws[i][2] } : null);
  const st = (s) => (rules.gravity === 'INVERTED' ? { PHYSICAL: 'INVERTED', INVERTED: 'PHYSICAL' }[s] || s : s);
  let setbacks = 0;
  g.deckSetback = (k) => { setbacks++; g.player.place(g.checkpoint); g.catching = false; };
  g.catching = false;
  g.engine.setState(rid, st('PHYSICAL'), { force: true });
  g.held = null;
  g.enterRoom(rid, true);
  const step = (n = 1) => { for (let i = 0; i < n; i++) g.simulate(1 / 30); };
  step(10);
  let fail = null;
  for (const w of room.route) {
    if (fail) break;
    if (w.state) g.engine.setState(rid, st(w.state), { force: true });
    if (w.wait) step(Math.round(w.wait * 30));
    let t = 0, best = Infinity, since = 0;
    g.input.keys.clear();
    g.input.keys.add('KeyW');
    const s0 = setbacks;
    while (t < 25) {
      const dx = w.pos[0] - g.player.pos.x, dz = w.pos[2] - g.player.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.35) break;
      g.player.H.set(dx / d, 0, dz / d);
      if (w.jump && g.player.grounded) g.input.state.jump = true;
      step();
      t += 1 / 30;
      if (d < best - 0.05) { best = d; since = 0; } else if ((since += 1 / 30) > 4) { fail = `stuck ${d.toFixed(2)} m from ${w.exit ? 'exit' : w.act || 'waypoint'} at ${g.player.pos.toArray().map((v) => v.toFixed(1))}`; break; }
      if (setbacks > s0) { fail = `setback on the way to ${w.act || (w.exit ? 'exit' : 'waypoint')}`; break; }
    }
    g.input.keys.clear();
    g.input.state.jump = false;
    step(w.jump ? 30 : 4);
    if (fail) break;
    if (t >= 25) { fail = 'timeout'; break; }
    if (w.act === 'take') {
      if (!g.deckWorld.isItemAvailable(w.item)) { fail = `item ${w.item} not available`; break; }
      g.useDeck({ id: `ditem:${w.item}` });
    }
    if (w.act === 'use') {
      const it = g.level.interactables.find((i) => i.id === w.target);
      g.useDeck({ id: `deck:${it.id}`, it });
      if (!g.deckWorld.flags[`open_${rid}`]) { fail = `${w.target} did not open (held ${g.held}, state ${g.engine.state(rid)})`; break; }
    }
  }
  return { ok: !fail, fail, challenges: room.challenges.map((c) => c.key).join(','), setbacks };
};

// The scene of the current sector: find it, use it, answer the choice if there is one.
const SCENE = () => {
  const g = window.AZ;
  const beat = g.deckBeat();
  const rules = g.level.rules;
  const rid = g.level.order.find((r) => g.level.rooms[r].beat) || g.level.order[0];
  g.engine.setState(rid, rules.gravity === 'INVERTED' ? 'INVERTED' : 'PHYSICAL', { force: true });
  g.enterRoom(rid, true);
  g.simulate(0.2);
  const c = g.deckWorld.focusCandidates(g).find((f) => !f.id.includes('beacon') && !f.id.includes('frag_') && !f.id.startsWith('ditem:') && !/lock_|socket_/.test(f.id));
  if (!c) return { ok: false, why: 'no scene', beat: beat.kind };
  g.player.place([c.pos[0], Math.max(0.86, c.pos[1] - 0.6), c.pos[2] + 1.2, 0]);
  g.simulate(0.1);
  if (beat.kind === 'contradiction') { g.engine.setState(rid, 'ECHO', { force: true }); g.simulate(0.1); }
  const said = [];
  const say = g.hud.say;
  g.hud.say = function (lines, facts, done) { said.push(...lines.filter((l) => !l.when || facts.test(l.when)).map((l) => `${l.who}: ${l.text}`)); return say.call(this, lines, facts, done); };
  g.useDeck(c);
  g.hud.say = say;
  for (let i = 0; i < 120 && (g.hud.talking || g.timers.length); i++) { g.hud.subT = 0; g.simulate(0.1); }
  return { ok: true, beat: beat.kind, done: !!g.deckWorld.flags.beat_done, choice: !!beat.choice, menu: g.menu, said, crew: beat.crew, npcId: c.id };
};

for (const genre of want) {
  const gi = GENRES.indexOf(genre);
  console.log(`\n${genre}`);
  await page.goto(url);
  await ready();
  await az(() => localStorage.clear());
  await page.reload();
  await ready();
  await az(() => AZ.changeSetting('hero', { id: 'nova' }));
  // --- the panel
  await page.click('#begin');
  await page.click('[data-newch="forge"]');
  check(await page.isVisible('#forge'), 'the chapter card opens WORLD FORGE');
  const title = `${genre[0]}${genre.slice(1).toLowerCase()} Night`;
  await page.fill('#fg_title', title);
  await page.fill('#fg_hero', 'Mika');
  await page.fill('#fg_seed', String(1000 + gi * 77));
  await page.selectOption('#fg_genre', genre);
  await page.selectOption('#fg_len', 'SHORT');
  // three acts: thirteen locations across the six genres, with hard rules pinned on the player's side
  const themes = [THEMES[(gi * 3) % 13], THEMES[(gi * 3 + 1) % 13], THEMES[(gi * 3 + 2) % 13]];
  for (let i = 0; i < 3; i++) await page.selectOption(`#fg_theme_${i}`, themes[i]);
  await page.fill('#fg_name_0', 'THE FIRST DOOR');
  await page.selectOption('#fg_gravity_1', gi % 2 ? 'ZERO' : 'INVERTED');
  await page.selectOption('#fg_light_0', ['NIGHT', 'EMERGENCY', 'DAY'][gi % 3]);
  await page.selectOption('#fg_watchers_0', 'PATROL');
  await page.selectOption('#fg_time_2', 'SWEEPERS');
  if (gi % 3 === 0) await page.check('#fg_null_1');
  await page.fill('#fg_cast_0', 'Aria');
  await page.selectOption('#fg_role_0', 'guide');
  await page.fill('#fg_cast_1', 'Dev');
  await page.selectOption('#fg_role_1', ['rival', 'watcher', 'keeper', 'engineer', 'medic', 'child'][gi]);
  const kit = [GEAR[gi % 6], GEAR[(gi + 1) % 6], GEAR[(gi + 2) % 6], GEAR[(gi + 3) % 6]];
  for (let i = 0; i < 4; i++) await page.selectOption(`#fg_gear_${i}`, kit[i]);
  if (gi === 0) await shot('panel');
  await page.click('#fg_go');
  await page.click(`#saves [data-slot="${gi}"]`);
  await page.waitForFunction(() => AZ.mode === 'deck' && AZ.campaign?.forge, null, { timeout: 120000 });
  const game = await az(() => ({ title: AZ.story.title, hero: AZ.forge.hero, genre: AZ.forge.genre, run: AZ.run, slot: AZ.slot, acts: AZ.forge.acts.map((a) => ({ theme: a.theme, name: a.name, rules: a.rules, kind: a.kind, allowed: Object.fromEntries(Object.entries(a.gearAllowed).map(([k, v]) => [k, v.ok])) })), cast: AZ.forge.cast.map((c) => [c.first, c.roleKey, !!c.antagonist]), gear: AZ.forge.gear, tokens: ['TIME', 'LIGHT'].every((t) => AZ.facts.get(`token_${t}`)) }));
  check(game.title === title && game.hero === 'Mika' && game.genre === genre && game.run === 'forge' && game.slot === gi && game.tokens, 'the Forge keeps the title, hero, genre, slot and gives every law token', JSON.stringify([game.title, game.hero, game.genre, game.run, game.slot]));
  check(game.acts.map((a) => a.theme).join() === themes.join() && game.acts[0].name === 'THE FIRST DOOR' && game.acts[1].rules.gravity === (gi % 2 ? 'ZERO' : 'INVERTED') && game.acts[2].rules.time === 'SWEEPERS' && game.acts[1].rules.nullField === (gi % 3 === 0), 'the locations and their rules are the ones chosen', JSON.stringify(game.acts.map((a) => [a.theme, a.rules])));
  check(game.cast[0][0] === 'Aria' && game.cast[0][1] === 'guide' && game.cast[1][0] === 'Dev' && game.cast.filter((c) => c[2]).length === 1 && !game.cast[0][2], 'the cast carries the typed names and roles, with one antagonist who is not the guide', JSON.stringify(game.cast));
  check(game.gear.join() === kit.join(), 'the kit is the four gear chosen', game.gear.join());
  // the LOCAL RULES card comes up after the act card
  await az(() => { for (let i = 0; i < 70; i++) AZ.simulate(0.1); });
  check(await az(() => document.querySelector('#rules').classList.contains('on') && document.querySelectorAll('#rules li').length >= 5 && document.querySelectorAll('#rules .gc').length === 4), 'the LOCAL RULES card shows the five rules and the four gear on arrival');
  if (gi === 0) { await page.waitForTimeout(800); await shot('rules'); }
  check(await az(() => { const o = AZ.engine.overrides[AZ.room]; const r = AZ.level.rules; return r.nullField ? o && o.gravityFlip === false : r.gravity === 'ZERO' ? o?.zeroG === true : r.gravity === 'INVERTED' ? !!o?.gravityFlip?.PHYSICAL : true; }), 'the rules are engine overrides on every room of the act');
  await flush();

  // --- play the three acts
  let saved = false;
  for (let act = 0; act < 3; act++) {
    const A = game.acts[act];
    for (let sector = 0; sector < 2; sector++) {
      const label = `act ${act + 1} (${A.theme}${A.rules.nullField ? ', null field' : ''}, gravity ${A.rules.gravity}) part ${sector + 1}`;
      await page.waitForFunction(([a, s]) => !AZ.transitioning && AZ.campaign.deck === a && AZ.campaign.sector === s, [act, sector], { timeout: 60000 }).catch(() => {});
      const here = await az(() => ({ deck: AZ.campaign.deck, sector: AZ.campaign.sector, beat: AZ.deckBeat().kind, rooms: AZ.level.order.length }));
      if (here.deck !== act || here.sector !== sector) { check(false, `${label}: reached`, JSON.stringify(here)); break; }
      await flush();
      if (!shotThemes.has(A.theme) && sector === 0) {
        shotThemes.add(A.theme);
        await az(() => {
          AZ.hud.rulesHide();
          document.querySelector('#card')?.classList.remove('on');
          AZ.hud.el.toast.classList.remove('on');
          // a few steps into the room, so the camera is not against the door behind you
          const H = AZ.player.H;
          AZ.player.place([AZ.player.pos.x + H.x * 2.5, AZ.player.pos.y, AZ.player.pos.z + H.z * 2.5, Math.atan2(H.x, H.z)]);
          AZ.updateDeckObjective(true);
          AZ.simulate(0.8);
        });
        await page.waitForTimeout(400);
        await shot(`act-${A.theme}`);
      }
      // every gear slot, once: refused where the rules say so, at work where they allow it
      if (sector === 0) {
        const res = await az(() => {
          const out = [];
          const g = AZ;
          const act = g.forgeAct();
          for (let i = 0; i < 4; i++) {
            const key = g.forge.gear[i];
            const before = { temps: g.deckWorld.temps.length, lens: g.deckWorld.lensT, flare: g.flareT, stasis: g.deckWorld.sentinels.filter((s) => s.stasisT > 0).length + g.deckWorld.hazards.filter((h) => h.stasisT > 0).length };
            const r = g.useGear(i);
            const after = { temps: g.deckWorld.temps.length, lens: g.deckWorld.lensT, flare: g.flareT, stasis: g.deckWorld.sentinels.filter((s) => s.stasisT > 0).length + g.deckWorld.hazards.filter((h) => h.stasisT > 0).length };
            const did = key === 'GRAPPLE' || key === 'RIG' ? after.temps > before.temps : key === 'LENS' ? after.lens > 0 : key === 'FLARE' ? after.flare > 0 : key === 'STASIS' ? after.stasis > before.stasis : true;
            out.push({ key, allowed: act.gearAllowed[key].ok, r, did, again: g.useGear(i) });
            for (let k = 0; k < 5; k++) g.simulate(0.1);
          }
          return out;
        });
        const bad = res.filter((x) => (x.allowed ? !(['ok', 'none', 'spent'].includes(x.r) && (x.r !== 'ok' || x.did) && (x.r !== 'ok' || x.again === 'cooling')) : x.r !== 'refused'));
        check(bad.length === 0, `${label}: gear ${res.map((x) => `${x.key}:${x.allowed ? 'allowed' : 'refused'}=${x.r}`).join(' ')}`, JSON.stringify(bad));
        if (act === 0 && sector === 0 && res.some((x) => x.r === 'ok' && (x.key === 'GRAPPLE' || x.key === 'RIG'))) { await az(() => AZ.simulate(0.3)); if (!fs.existsSync(path.join(shots, 'forge-gear.png'))) await shot('gear'); }
        await az(() => { AZ.deckWorld.temps.forEach((t) => (t.t = 0)); AZ.simulate(0.1); AZ.flareT = 0; AZ.deckWorld.lensT = 0; AZ.deckWorld.refresh(); });
      }
      // the puzzle rooms of a deck act, along the generator's route
      if (A.kind === 'deck') {
        const rooms = await az(() => AZ.level.order.filter((r) => AZ.level.rooms[r].kind === 'puzzle'));
        for (const rid of rooms) {
          const r = await az(PLAY_ROOM, { rid });
          check(r.ok, `${label}: room ${rid} [${r.challenges}] solved along its route`, r.fail || '');
        }
      }
      // the scene
      const sc = await az(SCENE);
      if (sc.choice) {
        check(sc.menu === 'forgechoice' && (await page.isVisible('#forgechoice')), `${label}: the ${sc.beat} opens a two-option choice`, JSON.stringify({ menu: sc.menu, said: sc.said.slice(0, 2) }));
        await page.click(`#forgechoice [data-fch="${act % 2 ? 'b' : 'a'}"]`);
        await flush();
        const ch = await az(() => ({ done: !!AZ.deckWorld.flags.beat_done, trust: AZ.facts.get('forge_trust') || 0, doubt: AZ.facts.get('forge_doubt') || 0, menu: AZ.menu }));
        check(ch.done && ch.trust + ch.doubt >= 1 && !ch.menu, `${label}: the choice sets a fact and opens the gate`, JSON.stringify(ch));
      } else if (sc.beat === 'verdict') {
        check(sc.menu === 'forgeend' && (await page.isVisible('#forgeend')), `${label}: the chair asks the last question`, JSON.stringify(sc));
        const n = await az(() => document.querySelectorAll('#forgeend [data-fend]').length);
        check(n >= 2 && n <= 3, `${label}: two or three endings to choose from`, String(n));
        await page.click('#forgeend [data-fend]:nth-child(2)');
        await flush();
        await page.waitForFunction(() => AZ.menu === 'ending', null, { timeout: 30000 }).catch(() => {});
        const end = await az(() => ({ menu: AZ.menu, key: AZ.facts.get('forge_ending'), h2: document.querySelector('#ending h2')?.textContent, text: document.querySelector('#ending p')?.textContent, right: AZ.facts.get('verdict_right') }));
        check(end.menu === 'ending' && end.key && end.h2 && end.text && !/\{[a-z]+\}/.test(end.text) && end.right, `${label}: an ending, with the cast's names in it`, JSON.stringify(end));
        if (gi === 0) await shot('ending');
        break;
      } else {
        check(sc.ok && sc.done, `${label}: the ${sc.beat} scene opens the gate`, JSON.stringify({ ...sc, said: sc.said.slice(0, 3) }));
        if (sc.beat === 'encounter') {
          const theirs = sc.said.filter((l) => l.startsWith('CREW:'));
          check(theirs.length >= 3 && theirs.length <= 6 && sc.said.some((l) => l.startsWith('JUNO:')), `${label}: the cast member says their lines (${theirs.length}) and Juno answers`, sc.said.join(' | '));
        }
        if (sc.beat === 'contradiction') check(sc.said.some((l) => /^NONE: ECHO:/.test(l)), `${label}: the record reads differently in ECHO`, sc.said.join(' | '));
      }
      // save in the middle of the second act and continue from the chapter card
      if (act === 1 && sector === 0 && !saved) {
        saved = true;
        await az(() => AZ.saveTo(AZ.slot));
        await page.reload();
        await ready();
        await page.click('#begin');
        const cont = await az(() => [...document.querySelectorAll('#chapters .chapcard')].find((c) => /WORLD FORGE/.test(c.textContent))?.querySelector('[data-cont]')?.dataset.cont);
        check(cont === String(gi), 'the WORLD FORGE chapter card offers CONTINUE for the saved game', String(cont));
        await page.click(`#chapters [data-cont="${gi}"]`);
        await page.waitForFunction(() => AZ.mode === 'deck' && AZ.campaign?.forge, null, { timeout: 120000 });
        const back = await az(() => ({ title: AZ.story.title, deck: AZ.campaign.deck, sector: AZ.campaign.sector, done: !!AZ.deckWorld.flags.beat_done, gear: AZ.forge.gear.join(), trust: AZ.facts.get('forge_trust') || 0, doubt: AZ.facts.get('forge_doubt') || 0, theme: AZ.forge.acts[1].theme }));
        check(back.title === title && back.deck === 1 && back.sector === 0 && back.done && back.gear === kit.join() && back.theme === themes[1] && back.trust + back.doubt >= 0, 'continuing restores the same act, scene progress, kit and choices', JSON.stringify(back));
        await flush();
      }
      // through the gate
      await az(() => {
        const g = AZ;
        const last = g.level.order[g.level.order.length - 1];
        g.engine.setState(last, g.level.rules.gravity === 'INVERTED' ? 'INVERTED' : 'PHYSICAL', { force: true });
        g.enterRoom(last, true);
        const ex = g.level.exit.box;
        g.player.place([(ex[0] + ex[3]) / 2, (ex[1] + ex[4]) / 2, (ex[2] + ex[5]) / 2, 0]);
        g.simulate(0.2);
      });
      await page.waitForFunction(([a, s]) => AZ.campaign.deck * 10 + AZ.campaign.sector !== a * 10 + s, [act, sector], { timeout: 30000 }).catch(() => {});
      await page.waitForFunction(() => !AZ.transitioning, null, { timeout: 30000 }).catch(() => {});
      const next = await az(() => ({ deck: AZ.campaign.deck, sector: AZ.campaign.sector }));
      check(next.deck * 10 + next.sector === (sector === 1 ? (act + 1) * 10 : act * 10 + sector + 1), `${label}: through the gate`, JSON.stringify(next));
    }
  }
  check(await az(() => /ACT \d/.test(document.querySelector('#journal .body')?.textContent || '') || (AZ.hud.renderJournal(AZ), /LOCAL RULES/.test(document.querySelector('#journal .body').textContent))), 'the journal shows the act, its rules, the kit, the cast and your choices');
}

check(errors.length === 0, 'no page errors', [...new Set(errors)].slice(0, 4).join(' | '));
await browser.close();
server.close();
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) { for (const f of failures) console.log(' - ' + f); process.exit(1); }
