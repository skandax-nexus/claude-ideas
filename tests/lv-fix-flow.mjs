// THE LAST VERSION OF EARTH v2.1 playtest fixes, unit "flow" (docs/lastversion/PLAYTEST-v2.1.md): the post-game flow,
// saves and resume, played in the browser by touch at phone size (CDP touch events on the game's own buttons, the
// game's own animation loop running; a helper move or a fast-forward with the game's simulate where the walk itself is
// not the point, and named as such in the log):
//   case      Title > NEW GAME > CASE FILES > REPLAY (THE UNWRITTEN RECORD) starts the case: its card (CASE 14 OF 14,
//             "Case fourteen."), its opening ends, the stick moves Kai, the dock's MENU pauses (acts-3 F01, F18)
//   roam      Title > NEW GAME > CASE FILES > FREE ROAM > THE FRACTURE 2026: Kai walks there; MENU pauses (F01)
//   continue  Title > CONTINUE on a finished campaign: its ending's card, not the hilltop; THE CASES; REPLAY reloads to a
//             title button that says what it starts ("REPLAY · Case 14 of 14 ..."), and the case starts (X2, F18)
//   cold      a save taken during Mission 12's 2196 cold open (the app sent to the background, then QUIT) loads with
//             the opening again and the rooms in 2049, the Chronolith not draining (acts-1-2 F05)
//   street    the Finale: a save taken just past the street that fell loads past it, and no "let go" (acts-3 F06)
//   anchor    Mission 1: a load puts Kai where he last found something, not 110 m back at his door; a checkpoint
//             reached is saved; the app sent to the background saves (FT-11, SYS-06)
//   reverse   Mission 11: REVERSE is not given before the story reaches the file; watched from 6 m it is (SYS-09, F06)
//   snap      no "The Chronolith let go of me" inside a staged moment or after the next place's fade began (FT-14)
// LV_FLOW=case,roam,... runs only those (all by default); LV_FLOW_SHOTS=<dir> keeps JPEG screenshots there.
//   NODE_PATH=$(npm root -g) node tests/lv-fix-flow.mjs
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', 'game');
const FIX = (f) => fs.readFileSync(path.join(here, 'fixtures', f), 'utf8');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}/index.html?edition=lastversion`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-watchdog', '--autoplay-policy=user-gesture-required'] });
const SHOTS = process.env.LV_FLOW_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const ONLY = (process.env.LV_FLOW || '').split(',').filter(Boolean);
const want = (k) => !ONLY.length || ONLY.includes(k);

let passed = 0;
const failures = [];
const check = (ok, label, detail = '') => {
  if (ok) { passed++; console.log(`  ok   ${label}`); } else { failures.push(`${label} ${detail}`); console.log(`  FAIL ${label} ${detail}`); }
};
const log = (...a) => console.log('     ', ...a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))));

// --- one phone: a fresh context, its storage seeded once (a reload keeps what the game wrote) ------------------------
async function phone({ w = 915, h = 412, slots = {}, name }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url());
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1' ? route.continue() : route.abort();
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript((kv) => {
    try {
      if (!sessionStorage.getItem('__seeded')) {
        localStorage.clear();
        for (const [k, v] of Object.entries(kv)) localStorage.setItem(`afterzero.lv.slot.${k}`, v);
        sessionStorage.setItem('__seeded', '1');
      }
    } catch { /* no storage */ }
  }, slots);
  const cdp = await ctx.newCDPSession(page);
  const az = (fn, arg) => page.evaluate(([src, a]) => {
    try { return (0, eval)(`(${src})`)(a); } catch (e) { return `ERR ${e.message} @ ${(e.stack || '').split('\n').slice(1, 4).join(' | ')}`; }
  }, [fn.toString(), arg]);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const P = { page, ctx, az, errors, w, h, name };
  P.tapXY = async (x, y) => {
    await touch('touchStart', [{ x, y, id: 9, radiusX: 6, radiusY: 6, force: 1 }]);
    await page.waitForTimeout(50);
    await touch('touchEnd', []);
    await page.waitForTimeout(150);
  };
  // a thumb's drag (scrolls a panel), from y0 to y1 at x
  P.drag = async (x, y0, y1) => {
    await touch('touchStart', [{ x, y: y0, id: 7 }]);
    for (let i = 1; i <= 8; i++) { await touch('touchMove', [{ x, y: y0 + ((y1 - y0) * i) / 8, id: 7 }]); await page.waitForTimeout(25); }
    await touch('touchEnd', []);
    await page.waitForTimeout(400);
  };
  // the element on screen (dragging its panel, or the list it is in, as a thumb would), then a tap at the centre of
  // what shows of it; never a tap that would land on something else
  P.tapSel = async (sel) => {
    for (let i = 0; i < 24; i++) {
      const r = await az((s) => {
        const b = document.querySelector(s);
        if (!b || !b.getClientRects().length) return null;
        const q = b.getBoundingClientRect();
        // the visible box: the viewport, cut by every scrolling ancestor
        let c = { t: 0, b: innerHeight, l: 0, r: innerWidth };
        for (let a = b.parentElement; a; a = a.parentElement) {
          const st = getComputedStyle(a);
          if (!/(auto|scroll|hidden)/.test(st.overflowY + st.overflowX)) continue;
          const ar = a.getBoundingClientRect();
          c = { t: Math.max(c.t, ar.top), b: Math.min(c.b, ar.bottom), l: Math.max(c.l, ar.left), r: Math.min(c.r, ar.right) };
        }
        return { t: q.top, b: q.bottom, l: q.left, r: q.right, c };
      }, sel);
      if (!r) return { tapped: false, why: `no ${sel}` };
      const cy = (r.t + r.b) / 2, cx = Math.max(r.l, r.c.l + 2) / 2 + Math.min(r.r, r.c.r - 2) / 2;
      if (cy >= r.c.t + 2 && cy <= r.c.b - 2 && Math.min(r.b, r.c.b) - Math.max(r.t, r.c.t) >= Math.min(16, r.b - r.t)) {
        const y = (Math.max(r.t, r.c.t) + Math.min(r.b, r.c.b)) / 2;
        const under = await az(([x, y, s]) => !!document.elementFromPoint(x, y)?.closest(s), [cx, y, sel]);
        if (under) {
          await P.tapXY(cx, y);
          return { tapped: true, at: [Math.round(cx), Math.round(y)] };
        }
      }
      // drag the box it is in: from its middle by how far the element is off its middle (a thumb's stroke at most)
      const mid = (r.c.t + r.c.b) / 2, span = Math.max(40, (r.c.b - r.c.t) * 0.4);
      const dy = Math.max(-span, Math.min(span, mid - cy));
      await P.drag(Math.max(r.c.l + 20, Math.min(r.c.r - 20, cx)), mid, mid + (Math.abs(dy) < 8 ? -40 : dy));
    }
    return { tapped: false, why: `${sel} never on screen` };
  };
  // the left thumb on the stick: forward for `ms`
  P.stick = async (ms, fx = 0, fy = -1) => {
    const z = await az(() => { const r = document.querySelector('#stickzone').getBoundingClientRect(); return { x: r.left + r.width * 0.3, y: r.top + r.height * 0.6 }; });
    await touch('touchStart', [{ x: z.x, y: z.y, id: 1 }]);
    for (let i = 1; i <= 4; i++) { await touch('touchMove', [{ x: z.x + fx * 14 * i, y: z.y + fy * 14 * i, id: 1 }]); await page.waitForTimeout(30); }
    await page.waitForTimeout(ms);
    await touch('touchEnd', []);
  };
  // the dock's MENU tapped; whether the pause menu opened (and what else the tap did: in headless Chromium at 3-5 fps a
  // touchstart on the dock can arrive uncancelable, so its click lands on the pause menu's RESUME that opened under it)
  P.menuTap = async () => {
    await az(() => {
      window.__mlog = [];
      if (!AZ.__traced) {
        AZ.__traced = true;
        const o = AZ.openMenu.bind(AZ), c = AZ.closeMenu.bind(AZ);
        AZ.openMenu = (id) => { __mlog.push(`open ${id}`); return o(id); };
        AZ.closeMenu = () => { __mlog.push('close'); return c(); };
        window.addEventListener('touchstart', (e) => __mlog.push(`touchstart cancelable ${e.cancelable}`), true);
        window.addEventListener('click', (e) => __mlog.push(`click ${e.target.id || e.target.tagName}`), true);
      }
    });
    const tap = await P.tapSel('#dock [data-act="pause"]');
    await page.waitForTimeout(1500);
    const r = await az(() => ({ menu: AZ.menu, trace: window.__mlog.slice() }));
    return { tap, opened: r.menu === 'pause' || r.trace.includes('open pause'), ...r };
  };
  P.shot = async (n) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${name}_${n}.jpg`), type: 'jpeg', quality: 60 }).catch(() => {}); };
  P.probe = () => az(() => ({
    t: +AZ.time.toFixed(1), started: AZ.started, menu: AZ.menu, endingOn: document.querySelector('#ending')?.classList.contains('on'), mode: AZ.mode,
    chapter: AZ.campaign?.chapter, mkey: AZ.edition?.deck?.mkey, room: AZ.room, year: AZ.engine?.state?.(AZ.room), opening: !!AZ.edition?.opening, cinema: !!AZ.edition?.cinema?.active,
    talking: !!AZ.hud?.talking, pos: AZ.player?.pos?.toArray().map((v) => +v.toFixed(2)), stability: +(AZ.edition?.stability ?? 0).toFixed(2), playTime: Math.round(AZ.playTime || 0),
    subs: (document.querySelector('#subs')?.innerText || '').replace(/\s+/g, ' ').slice(0, 120),
    card: document.querySelector('#card')?.classList.contains('on') ? document.querySelector('#card').innerText.replace(/\s+/g, ' ').slice(0, 140) : '',
    obj: (document.querySelector('#objective')?.innerText || '').replace(/\s+/g, ' ').slice(0, 100),
  }));
  // the title, the first tap (sound)
  P.boot = async () => {
    await page.goto(url);
    await page.waitForFunction(() => window.AZ && AZ.edition && document.querySelector('#title'), null, { timeout: 400000 });
    await az(() => { AZ.changeSetting('quality', 'low'); AZ.changeSetting('smart', false); });
    await P.tapXY(w * 0.7, 40);
    await page.waitForTimeout(500);
  };
  // after a reload the page is a new one: wait for its title
  P.title = async () => {
    await page.waitForFunction(() => window.AZ && AZ.edition && document.querySelector('#title') && !AZ.started, null, { timeout: 400000 });
    await az(() => { AZ.changeSetting('quality', 'low'); AZ.changeSetting('smart', false); });
    await page.waitForTimeout(400);
  };
  // in a place, its people here (the chapter's card waits for them)
  P.inPlace = () => page.waitForFunction(() => AZ.started && AZ.mode === 'deck' && AZ.level?.place && !AZ.edition.castWaitFor, null, { timeout: 400000 }).then(() => true, () => false);
  // the opening (a card, PREVIOUSLY) over, on the game's own loop; SKIP tapped by touch now and then
  // (fast: the game's own simulate moves it on as the bot does, for a heavy place where the loop runs at 1 fps or less)
  P.openingOver = async (secs = 150, fast = false) => {
    const end = Date.now() + secs * 1000;
    let skips = 0;
    while (Date.now() < end) {
      if (fast) await az(() => AZ.simulate(1));
      const s = await az(() => ({ o: !!AZ.edition.opening || !!AZ.edition.cinema.active, skip: !!document.querySelector('#lvSkip')?.offsetParent }));
      if (!s.o) return { over: true, skips };
      if (s.skip && skips < 12) { await P.tapSel('#lvSkip'); skips++; }
      await page.waitForTimeout(1500);
    }
    return { over: false, skips };
  };
  // the app sent to the background (the home button): what Android's WebView does to the page
  P.background = () => az(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const r = { menu: AZ.menu };
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    return r;
  });
  P.close = async () => { await ctx.close(); };
  return P;
}
// a helper walk (not the finding: steering the heading as a look drag would, the move key held), with the game's simulate
const WALK = () => {
  window.FW = {
    walkTo: (x, z, secs = 20) => {
      const g = AZ;
      if (g.menu === 'pause') g.closeMenu();
      g.input.keys.add('KeyW');
      let t = 0;
      while (t < secs) {
        const dx = x - g.player.pos.x, dz = z - g.player.pos.z, d = Math.hypot(dx, dz);
        if (d < 0.5 || g.catching) break;
        g.player.H.set(dx / d, 0, dz / d);
        g.simulate(1 / 30);
        t += 1 / 30;
      }
      g.input.keys.clear();
      return +Math.hypot(x - g.player.pos.x, z - g.player.pos.z).toFixed(2);
    },
    said: [],
    sets: [],
  };
  const set = AZ.facts.set.bind(AZ.facts);
  AZ.facts.set = (k, v = true) => { if (/^(m11_saw_file|has_inversion|t_|ev_)/.test(k) && !k.endsWith('_paid') && AZ.facts.facts[k] !== v) FW.sets.push(`${k}=${v}`); return set(k, v); };
  const say = AZ.hud.say.bind(AZ.hud);
  AZ.hud.say = (lines, facts, done) => {
    for (const l of lines) if (!l.when || facts.test(l.when)) FW.said.push(`${l.who}: ${l.text}`);
    return say(lines, facts, done);
  };
  return 'ok';
};
const slotOf = (P, k) => P.az((s) => { const v = localStorage.getItem(`afterzero.lv.slot.${s}`); return v ? JSON.parse(v) : null; }, k);

// =====================================================================================================================
// F01, F18: the title's CASE FILES, REPLAY
async function caseFlow(w, h) {
  const P = await phone({ w, h, slots: { 1: FIX('lv-flow-endC.json') }, name: `case_${w}x${h}` });
  console.log(`Title > NEW GAME > CASE FILES > REPLAY (${w}x${h})`);
  try {
    await P.boot();
    log('tap NEW GAME', await P.tapSel('#begin'));
    await P.page.waitForTimeout(800);
    log('tap CASE FILES', await P.tapSel('#chapters [data-casefiles]'));
    await P.page.waitForTimeout(800);
    const list = await P.az(() => ({ menu: AZ.menu, rows: [...document.querySelectorAll('#ending .caseFile b')].map((b) => b.textContent) }));
    check(list.menu === 'ending' && list.rows.length === 14 && list.rows[13] === '14. THE UNWRITTEN RECORD', 'the CASE FILES from the title: fourteen numbered stories', JSON.stringify(list.rows.slice(-2)));
    await P.shot('casefiles');
    log('tap REPLAY', await P.tapSel('#ending [data-case="c_record"]'));
    const inPlace = await P.inPlace();
    const a = await P.probe();
    log('arrived', a);
    check(inPlace && a.chapter === 'cases' && a.mkey === 'c_record' && a.menu === null, 'the replay starts in the page with no menu left open (it was "ending", and nothing stepped)', JSON.stringify(a));
    await P.page.waitForFunction(() => /CASE 14 OF 14/.test(document.querySelector('#card')?.innerText || '') || !AZ.edition.opening, null, { timeout: 60000 }).catch(() => {});
    const card = await P.probe();
    await P.shot('card');
    check(/CASE FILES · CASE 14 OF 14/.test(card.card) && !/CASE N\b/.test(card.card), 'its card: CASE FILES · CASE 14 OF 14 (not "CASE N")', JSON.stringify(card.card));
    await P.page.waitForFunction(() => /Case fourteen\. The Unwritten Record\./.test(document.querySelector('#subs')?.innerText || ''), null, { timeout: 60000 }).catch(() => {});
    const said = await P.probe();
    check(/Case fourteen\. The Unwritten Record\./.test(said.subs) && (await P.az(() => !!AZ.voice.plan('Case fourteen. The Unwritten Record.', 'NONE'))), 'its spoken title: "Case fourteen. The Unwritten Record.", recorded', JSON.stringify(said.subs));
    const o = await P.openingOver();
    const b = await P.probe();
    check(o.over && !b.opening && b.menu === null, `its opening ends on the game's own loop (SKIP tapped ${o.skips} times)`, JSON.stringify(b));
    const p0 = b.pos;
    await P.stick(2500);
    await P.page.waitForTimeout(400);
    const p1 = (await P.probe()).pos;
    const moved = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]);
    check(moved > 0.5, `the stick walks Kai (${moved.toFixed(1)} m)`, JSON.stringify([p0, p1]));
    const m = await P.menuTap();
    log('tap MENU', m);
    check(m.opened, 'the dock\'s MENU pauses (the pause menu opens)', JSON.stringify(m));
    await P.shot('paused');
    check(!P.errors.length, 'no page errors', P.errors.join(' | '));
  } catch (e) { check(false, 'case flow ran', e.message); }
  await P.close();
}

// F01: the title's FREE ROAM
async function roamFlow(w, h) {
  const P = await phone({ w, h, slots: { 1: FIX('lv-flow-endC.json') }, name: `roam_${w}x${h}` });
  console.log(`Title > NEW GAME > CASE FILES > FREE ROAM > THE FRACTURE 2026 (${w}x${h})`);
  try {
    await P.boot();
    log('tap NEW GAME', await P.tapSel('#begin'));
    await P.page.waitForTimeout(800);
    log('tap CASE FILES', await P.tapSel('#chapters [data-casefiles]'));
    await P.page.waitForTimeout(800);
    log('tap FREE ROAM', await P.tapSel('#ending [data-tab="roam"]'));
    await P.page.waitForTimeout(600);
    const sel = await P.az(() => { const b = [...document.querySelectorAll('#ending [data-travel="m18"]')].find((x) => x.dataset.year === 'PAST'); if (!b) return null; b.id = '__trip'; return b.textContent; });
    log('trip', sel);
    await P.shot('roamtab');
    log('tap 2026', await P.tapSel('#__trip'));
    const inPlace = await P.inPlace();
    await P.page.waitForTimeout(2000);
    const a = await P.probe();
    log('arrived', a);
    check(inPlace && a.chapter === 'roam' && a.mkey === 'm18' && a.year === 'PAST' && a.menu === null, 'the trip arrives in 2026 with no menu left open', JSON.stringify(a));
    const p0 = a.pos;
    await P.stick(2500);
    await P.page.waitForTimeout(400);
    const p1 = (await P.probe()).pos;
    const moved = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]);
    check(moved > 0.5, `the stick walks Kai there (${moved.toFixed(1)} m)`, JSON.stringify([p0, p1]));
    await P.shot('walked');
    const m = await P.menuTap();
    log('tap MENU', m);
    check(m.opened, 'the dock\'s MENU pauses (the pause menu opens)', JSON.stringify(m));
    check(!P.errors.length, 'no page errors', P.errors.join(' | '));
  } catch (e) { check(false, 'roam flow ran', e.message); }
  await P.close();
}

// X2, F18: CONTINUE on a finished campaign, THE CASES, REPLAY from the game (a reload), the title's button
async function continueFlow(w, h) {
  const P = await phone({ w, h, slots: { 1: FIX('lv-flow-endC.json') }, name: `continue_${w}x${h}` });
  console.log(`Title > CONTINUE on a finished campaign (${w}x${h})`);
  try {
    await P.boot();
    log('title CONTINUE', await P.az(() => document.querySelector('#continue').innerText.replace(/\s+/g, ' ')));
    log('tap CONTINUE', await P.tapSel('#continue'));
    await P.inPlace();
    await P.page.waitForFunction(() => AZ.menu === 'ending', null, { timeout: 60000 }).catch(() => {});
    await P.page.waitForTimeout(1500);
    const a = await P.az(() => ({ menu: AZ.menu, on: document.querySelector('#ending').classList.contains('on'), h2: document.querySelector('#ending h2')?.textContent, buttons: [...document.querySelectorAll('#ending .body button')].map((b) => b.id), card: document.querySelector('#card')?.classList.contains('on') }));
    await P.shot('endingcard');
    check(a.menu === 'ending' && a.on && /^ENDING C/.test(a.h2 || '') && a.buttons.includes('lvCases') && a.buttons.includes('lvTitle') && !a.card, 'CONTINUE on a finished campaign opens its ending\'s card (THE CASES, BACK TO THE TITLE), not the hilltop', JSON.stringify(a));
    await P.page.waitForTimeout(6000);
    const still = await P.probe();
    check(still.menu === 'ending' && !still.opening, 'and it stays: no PREVIOUSLY, no "The next door is open" to walk to', JSON.stringify(still));
    const meta = (await slotOf(P, 1))?.meta;
    check(/ENDING C: AFTERZERO/.test(meta?.where || ''), 'its save now names the ending (the title\'s CONTINUE says so)', JSON.stringify(meta));
    log('tap THE CASES', await P.tapSel('#lvCases'));
    await P.page.waitForTimeout(800);
    const rows = await P.az(() => document.querySelectorAll('#ending .caseFile').length);
    check(rows === 14, 'THE CASES opens the CASE FILES', rows);
    await P.shot('casefiles');
    log('tap REPLAY', await P.tapSel('#ending [data-case="c_record"]'));
    await P.title();
    const btn = await P.az(() => ({ text: document.querySelector('#continue').innerText.replace(/\s+/g, ' '), shown: getComputedStyle(document.querySelector('#continue')).display !== 'none' }));
    await P.shot('title_replay');
    check(btn.shown && /^REPLAY/.test(btn.text) && /Case 14 of 14 · THE UNWRITTEN RECORD · Tap to start/.test(btn.text) && !/Tap to enter/.test(btn.text), 'after the reload the title\'s button says what it starts', JSON.stringify(btn));
    await P.tapXY(w * 0.7, 40);
    log('tap REPLAY on the title', await P.tapSel('#continue'));
    await P.inPlace();
    const c = await P.probe();
    check(c.chapter === 'cases' && c.mkey === 'c_record' && c.menu === null, 'the case starts', JSON.stringify(c));
    const o = await P.openingOver();
    check(o.over, 'and its opening ends');
    check(!P.errors.length, 'no page errors', P.errors.join(' | '));
  } catch (e) { check(false, 'continue flow ran', e.message); }
  await P.close();
}

// acts-1-2 F05: a save during Mission 12's 2196 cold open
async function coldFlow(w, h) {
  const P = await phone({ w, h, slots: { 1: FIX('lv-flow-m11end.json') }, name: `cold_${w}x${h}` });
  console.log(`Mission 12's cold open, saved by the app going to the background, then QUIT and CONTINUE (${w}x${h})`);
  try {
    await P.boot();
    log('tap CONTINUE', await P.tapSel('#continue'));
    await P.inPlace();
    await P.az(WALK);
    await P.openingOver(240, true);
    // (a helper move, as the playtest's verifier made it: Kai by the Ward 32 bed; then the file on it, tapped)
    const bed = await P.az(() => {
      const c = AZ.deckWorld.focusCandidates(AZ).find((x) => /FILE ON THE BED/i.test(x.prompt || ''));
      if (!c) return null;
      AZ.player.place([c.pos[0], c.pos[1] - 0.9 + 0.86, c.pos[2] + 1.6, 0]);
      for (let i = 0; i < 20 && AZ.focus?.prompt !== c.prompt; i++) AZ.simulate(0.1);
      return { prompt: c.prompt, at: c.pos, focus: AZ.focus?.prompt || null, pos: AZ.player.pos.toArray().map((v) => +v.toFixed(2)) };
    });
    log('by the bed (helper)', bed);
    await P.page.waitForFunction(() => /FILE ON THE BED/i.test(document.querySelector('#prompt')?.innerText || ''), null, { timeout: 30000 }).catch(() => {});
    log('tap the prompt', await P.tapSel('#prompt'));
    // the outro and the fade, fast-forwarded with the game's simulate until Mission 12's cold open is in 2196
    const cold = await P.page.waitForFunction(() => { AZ.simulate(0.3); AZ.hud.subT = Math.min(AZ.hud.subT, 0.2); return AZ.edition.deck?.mkey === 'm12' && AZ.edition.opening && AZ.engine.state(AZ.room) === 'FUTURE'; }, null, { timeout: 240000, polling: 300 }).then(() => true, () => false);
    const c0 = await P.probe();
    log('cold open', c0);
    check(cold && c0.year === 'FUTURE' && c0.opening, 'Mission 12\'s cold open plays, shot in 2196', JSON.stringify(c0));
    const bg = await P.background();
    const saved = await slotOf(P, 1);
    check(bg.menu === 'pause' && saved?.campaign?.deck === 3 && saved.campaign.opening?.mkey === 'm12', 'the app sent to the background pauses, and the game saves (the opening marked in the save)', JSON.stringify({ bg, opening: saved?.campaign?.opening }));
    log('tap QUIT', await P.tapSel('#quit'));
    await P.title();
    await P.tapXY(w * 0.7, 40);
    log('tap CONTINUE', await P.tapSel('#continue'));
    await P.inPlace();
    await P.az(WALK);
    const r0 = await P.probe();
    log('loaded', r0);
    check(r0.mkey === 'm12' && r0.opening && (/MISSION 12/.test(r0.card) || /^2196\. On the rim/.test(r0.subs)), 'the load plays Mission 12\'s opening again (its cold open, then its card), not the chase in 2196', JSON.stringify(r0));
    const o = await P.openingOver(300, true);
    const r1 = await P.probe();
    const label = await P.az(() => (document.querySelector('#state')?.innerText || '').replace(/\s+/g, ' '));
    check(o.over && r1.year === 'PRESENT', 'after it, the place is in 2049', JSON.stringify({ r1, label }));
    await P.az(() => AZ.simulate(12));
    const r2 = await P.probe();
    check(r2.stability >= r1.stability && r2.year === 'PRESENT' && !/DRAINING/.test(await P.az(() => document.querySelector('#state')?.innerText || '')), `and the Chronolith does not drain (stability ${r1.stability} -> ${r2.stability} over 12 s)`, JSON.stringify(r2));
    await P.shot('after');
    check(!P.errors.length, 'no page errors', P.errors.join(' | '));
  } catch (e) { check(false, 'cold flow ran', e.message); }
  await P.close();
}

// acts-3 F06: the street that fell
async function streetFlow(w, h) {
  // (the playtest's save, from just after the street fell, with the thread over the street not yet done: Kai crosses
  // it here, so the save after it is this build's)
  const d = JSON.parse(FIX('lv-flow-m23street.json'));
  for (const k of ['t_m23_street', 't_m23_street_paid']) delete d.facts.facts[k];
  const P = await phone({ w, h, slots: { 1: JSON.stringify(d) }, name: `street_${w}x${h}` });
  console.log(`The Finale: across the street that fell, saved, loaded (${w}x${h})`);
  try {
    await P.boot();
    log('tap CONTINUE', await P.tapSel('#continue'));
    await P.inPlace();
    await P.az(WALK);
    await P.openingOver(240, true);
    // (as the bot crosses it: in 2026 the near half stands, the Witness holds the far half; a helper walk)
    const crossed = await P.az(() => {
      const g = AZ, p = g.edition.inv.procs.find((x) => x.rec.id === 'streetCollapse');
      for (let i = 0; i < 40 && p && p.P < 0.98; i++) g.simulate(0.2);
      g.engine.setState(g.room, 'PAST', { force: true });
      g.edition.stability = 1;
      g.simulate(0.2);
      g.player.place([2, 0.86, 140, Math.PI]);
      g.simulate(0.3);
      for (const [x, z] of [[2, 134], [2, 129], [2, 124], [2, 118], [2, 113]]) FW.walkTo(x, z, 12);
      g.simulate(1);
      return { at: g.player.pos.toArray().map((v) => +v.toFixed(1)), street: g.facts.get('t_m23_street'), anchor: g.campaign.anchor, held: p?.heldBy, P: p && +p.P.toFixed(2) };
    });
    log('crossed (helper walk)', crossed);
    check(crossed.street && crossed.anchor?.pos?.[2] < 120, 'over the street: its thread done where Kai stands, and that place kept for a load', JSON.stringify(crossed));
    await P.az(() => { AZ.edition.stability = 0.37; AZ.simulate(0.5); });
    const bg = await P.background();
    log('background', bg);
    log('tap QUIT', await P.tapSel('#quit'));
    await P.title();
    await P.tapXY(w * 0.7, 40);
    log('tap CONTINUE', await P.tapSel('#continue'));
    await P.inPlace();
    await P.az(WALK);
    const r0 = await P.probe();
    log('loaded', r0);
    check(r0.pos[2] < 125 && Math.abs(r0.pos[2] - crossed.anchor.pos[2]) < 1.5, `the load puts Kai past the street (z ${r0.pos[2]}), not back at the platform (z 166)`, JSON.stringify(r0));
    await P.openingOver(240, true);
    await P.az(() => AZ.simulate(8));
    const r1 = await P.probe();
    const snapped = await P.az(() => FW.said.some((s) => /let go of me/.test(s)));
    check(!snapped && r1.pos[2] < 125, `and the Chronolith does not let go of him 6 s after (stability ${r0.stability} at the load)`, JSON.stringify(r1));
    await P.shot('loaded');
    check(!P.errors.length, 'no page errors', P.errors.join(' | '));
  } catch (e) { check(false, 'street flow ran', e.message); }
  await P.close();
}

// FT-11, SYS-06: Mission 1
async function anchorFlow(w, h) {
  const P = await phone({ w, h, slots: { 1: FIX('lv-flow-m01.json') }, name: `anchor_${w}x${h}` });
  console.log(`Mission 1: where a load puts Kai (${w}x${h})`);
  try {
    await P.boot();
    log('tap CONTINUE', await P.tapSel('#continue'));
    await P.inPlace();
    await P.az(WALK);
    await P.openingOver(240, true);
    const start = await P.probe();
    // to the pigeon on its ledge up the avenue (a helper walk), then its prompt tapped
    const lm = await P.az(() => AZ.level.landmarks.pigeonLedge);
    const walked = await P.az((p) => { FW.walkTo(p[0] + 3, p[2] + 2, 40); return AZ.player.pos.toArray().map((v) => +v.toFixed(1)); }, lm);
    log('walked to the pigeon (helper)', walked);
    await P.page.waitForFunction(() => /PIGEON/i.test(document.querySelector('#prompt')?.innerText || ''), null, { timeout: 20000 }).catch(() => {});
    log('tap the prompt', await P.tapSel('#prompt'));
    await P.page.waitForTimeout(1500);
    await P.az(() => { for (let i = 0; i < 300 && AZ.hud.talking; i++) AZ.simulate(0.1); });
    const found = await P.az(() => ({ ev: AZ.facts.get('ev_pigeon'), anchor: AZ.campaign.anchor, pos: AZ.player.pos.toArray().map((v) => +v.toFixed(1)) }));
    check(found.ev && found.anchor, 'the pigeon found by a tap: where Kai stood is kept', JSON.stringify(found));
    // on a few metres, then the app to the background: it saves; then QUIT
    await P.az(() => FW.walkTo(AZ.player.pos.x - 4, AZ.player.pos.z - 4, 6));
    const pt0 = await P.az(() => Math.round(AZ.playTime));
    await P.background();
    const s1 = await slotOf(P, 1);
    check(Math.abs((s1?.playTime || 0) - pt0) < 3 && s1?.campaign?.anchor, `the background saves, its play time with it (${Math.round(s1?.playTime || 0)} s of ${pt0})`, JSON.stringify({ playTime: s1?.playTime, pt0 }));
    log('tap QUIT', await P.tapSel('#quit'));
    await P.title();
    await P.tapXY(w * 0.7, 40);
    log('tap CONTINUE', await P.tapSel('#continue'));
    await P.inPlace();
    await P.az(WALK);
    const r0 = await P.probe();
    const d0 = Math.hypot(r0.pos[0] - found.anchor.pos[0], r0.pos[2] - found.anchor.pos[2]);
    const fromDoor = Math.hypot(r0.pos[0] - start.pos[0], r0.pos[2] - start.pos[2]);
    check(d0 < 1.5 && fromDoor > 20, `the load puts Kai where he found the pigeon (${d0.toFixed(1)} m from it, ${fromDoor.toFixed(0)} m from his door)`, JSON.stringify(r0));
    await P.openingOver(240, true);
    // into the plaza's quarter: its checkpoint is saved within seconds, with nothing found there; then the page dies
    const plaza = await P.az(() => { for (const [x, z] of [[-10, -29.4], [-9.5, -50], [-6, -66], [0, -74], [-6, -88]]) FW.walkTo(x, z, 25); AZ.simulate(4); return { cp: AZ.checkpoint, pos: AZ.player.pos.toArray().map((v) => +v.toFixed(1)), playTime: Math.round(AZ.playTime) }; });
    const s2 = await slotOf(P, 1);
    log('in the plaza (helper walk)', plaza, s2?.campaign?.pos);
    check(s2?.campaign?.pos?.[2] < -60 && Math.abs((s2?.playTime || 0) - plaza.playTime) < 6, 'the plaza\'s checkpoint, reached, is saved (and the play time)', JSON.stringify({ pos: s2?.campaign?.pos, playTime: s2?.playTime }));
    await P.page.reload();
    await P.title();
    await P.tapXY(w * 0.7, 40);
    log('tap CONTINUE', await P.tapSel('#continue'));
    await P.inPlace();
    const r1 = await P.probe();
    check(r1.pos[2] < -60 && r1.playTime >= plaza.playTime - 6, `after a reload Kai is in the plaza (z ${r1.pos[2]}), the play time kept (${r1.playTime} s)`, JSON.stringify(r1));
    await P.shot('plaza');
    check(!P.errors.length, 'no page errors', P.errors.join(' | '));
  } catch (e) { check(false, 'anchor flow ran', e.message); }
  await P.close();
}

// SYS-09, acts-1-2 F06: REVERSE in Mission 11
async function reverseFlow(w, h) {
  console.log(`Mission 11: REVERSE when the story reaches the file (${w}x${h})`);
  let P = await phone({ w, h, slots: { 1: FIX('lv-flow-m11q0.json') }, name: `reverse0_${w}x${h}` });
  try {
    await P.boot();
    log('tap CONTINUE', await P.tapSel('#continue'));
    await P.inPlace();
    await P.az(WALK);
    await P.openingOver(240, true);
    // (a helper move, as the tester's: into the annex at the charred file before the boy on the bench)
    const early = await P.az(() => {
      const f = AZ.level.landmarks.charredFile;
      AZ.player.place([f[0], f[1] + 0.86, f[2] + 1.2, 0]);
      for (let i = 0; i < 40; i++) AZ.simulate(0.1);
      for (let i = 0; i < 200 && AZ.hud.talking; i++) AZ.simulate(0.1);
      return { inv: !!AZ.facts.get('has_inversion'), saw: !!AZ.facts.get('m11_saw_file'), rule: !!AZ.deckWorld.flags.rule_unlock, obj: AZ.edition.objectiveText?.(), sets: FW.sets.filter((x) => /saw_file|inversion/.test(x)) };
    });
    log('at the file early (helper)', early);
    await P.page.waitForFunction(() => /READ THE FILE/i.test(document.querySelector('#prompt')?.innerText || ''), null, { timeout: 15000 }).catch(() => {});
    log('tap READ THE FILE', await P.tapSel('#prompt'));
    await P.page.waitForTimeout(1500);
    const tapped = await P.az(() => { for (let i = 0; i < 200 && AZ.hud.talking; i++) AZ.simulate(0.1); return { inv: !!AZ.facts.get('has_inversion'), rule: !!AZ.deckWorld.flags.rule_unlock, said: FW.said.slice(-3) }; });
    log('tapped', tapped);
    check(early.sets.includes('m11_saw_file=true') && !early.inv && !early.saw && !early.rule && !tapped.inv, 'at the file before the boy on the bench: its zone is reached, and no REVERSE (nor by tapping READ THE FILE)', JSON.stringify({ early, tapped }));
    // then the story reaches the file (a helper: the threads before it set as done), Kai still standing at it
    const later = await P.az(() => {
      for (const id of ['music', 'youngKai', 'boy', 'hazards']) AZ.facts.set(`t_m11_${id}`, true);
      for (let i = 0; i < 300 && !AZ.facts.get('has_inversion'); i++) AZ.simulate(0.1);
      return { inv: !!AZ.facts.get('has_inversion'), sets: FW.sets.filter((x) => /saw_file|inversion/.test(x)) };
    });
    check(later.inv && later.sets.filter((x) => x === 'm11_saw_file=true').length === 2, 'once the story is there, the zone counts again and REVERSE is given', JSON.stringify(later));
    check(!P.errors.length, 'no page errors', P.errors.join(' | '));
  } catch (e) { check(false, 'reverse flow (early) ran', e.message); }
  await P.close();
  P = await phone({ w, h, slots: { 1: FIX('lv-flow-m11q1.json') }, name: `reverse1_${w}x${h}` });
  try {
    await P.boot();
    log('tap CONTINUE', await P.tapSel('#continue'));
    await P.inPlace();
    await P.az(WALK);
    await P.openingOver(240, true);
    // the story at the file ("Watch the file that keeps un-burning"): Kai stands 6.5 m off it, outside its zone, and
    // looks at it (a helper move and a look as a drag would turn him)
    const stand = (dist) => P.az((d) => {
      const g = AZ, f = g.level.landmarks.charredFile;
      const yaw = f[3] || 0, dx = Math.sin(yaw + 0.6), dz = Math.cos(yaw + 0.6);
      g.player.place([f[0] + dx * d, f[1] + 0.86, f[2] + dz * d, 0]);
      g.simulate(0.2);
      for (let i = 0; i < 24; i++) {
        g.player.updateCamera(1);
        g.camera.updateMatrixWorld();
        const fw = g.camera.getWorldDirection(g.camera.position.clone());
        const v = [f[0] - g.camera.position.x, f[1] + 1 - g.camera.position.y, f[2] - g.camera.position.z];
        const l = Math.hypot(...v), wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
        g.player.look(-wrap(Math.atan2(v[0], v[2]) - Math.atan2(fw.x, fw.z)), -(Math.asin(v[1] / l) - Math.asin(fw.y)));
      }
      g.player.updateCamera(1);
      const inBox = g.level.triggers.some((t) => t.set?.m11_saw_file && g.player.pos.x >= t.box[0] && g.player.pos.x < t.box[3] && g.player.pos.z >= t.box[2] && g.player.pos.z < t.box[5]);
      return { d: +Math.hypot(g.player.pos.x - f[0], g.player.pos.z - f[2]).toFixed(1), inBox };
    }, dist);
    const far = await stand(10);
    await P.az(() => { for (let i = 0; i < 60; i++) AZ.simulate(0.1); });
    const farR = await P.az(() => !!AZ.facts.get('m11_saw_file'));
    check(!far.inBox && !farR, `from ${far.d} m, looking: not yet`, JSON.stringify(far));
    const near = await stand(6.5);
    await P.az(() => { for (let i = 0; i < 60; i++) { AZ.simulate(0.1); if (AZ.facts.get('m11_saw_file')) break; } });
    await P.az(() => { for (let i = 0; i < 300 && !AZ.facts.get('has_inversion'); i++) AZ.simulate(0.1); });
    const got = await P.az(() => ({ inv: !!AZ.facts.get('has_inversion'), saw: !!AZ.facts.get('m11_saw_file'), said: FW.said.filter((s) => /hold one thing|un-burns|file/i.test(s)).slice(-3) }));
    log('watched', near, got);
    check(!near.inBox && got.inv, `watched from ${near.d} m (outside the old 1.7 m zone): REVERSE is given`, JSON.stringify({ near, got }));
    await P.shot('reverse');
    check(!P.errors.length, 'no page errors', P.errors.join(' | '));
  } catch (e) { check(false, 'reverse flow (watch) ran', e.message); }
  await P.close();
}

// FT-14: the snap line
async function snapFlow(w, h) {
  const P = await phone({ w, h, slots: { 1: FIX('lv-flow-m11q1.json') }, name: `snap_${w}x${h}` });
  console.log(`No "let go of me" in a staged moment or the next place's fade (${w}x${h})`);
  try {
    await P.boot();
    log('tap CONTINUE', await P.tapSel('#continue'));
    await P.inPlace();
    await P.az(WALK);
    await P.openingOver(240, true);
    // Mission 11 is unstable: in 2026, low, a staged moment (an outro's kind) playing: it costs nothing
    const r = await P.az(() => {
      const g = AZ, e = g.edition;
      g.engine.setState(g.room, 'PAST', { force: true });
      e.stability = 0.05;
      e.cinema.play({ shots: null, lines: [{ who: 'NONE', text: 'A test moment.' }, { who: 'NONE', text: 'Another.' }] }, () => {});
      for (let i = 0; i < 30; i++) g.simulate(0.1);
      const during = +e.stability.toFixed(3);
      e.cinema.end(true);
      // a snap begun, then the way to the next place begins (its fade): no line, no move
      e.stability = 0;
      FW.said.length = 0;
      g.simulate(0.1);
      const began = !!g.catching;
      g.transitioning = true;
      return new Promise((res) => setTimeout(() => { const said = FW.said.slice(); g.transitioning = false; res({ during, began, said, catching: !!g.catching }); }, 1200));
    });
    check(r.during === 0.05, 'a staged moment does not drain the Chronolith', JSON.stringify(r));
    check(r.began && !r.said.some((s) => /let go of me/.test(s)) && !r.catching, 'a snap overtaken by the next place\'s fade says nothing and lets go', JSON.stringify(r));
    check(!P.errors.length, 'no page errors', P.errors.join(' | '));
  } catch (e) { check(false, 'snap flow ran', e.message); }
  await P.close();
}

const L = [915, 412], PT = [412, 915];
if (want('case')) await caseFlow(...L);
if (want('roam')) await roamFlow(...PT);
if (want('continue')) await continueFlow(...PT);
// (the other orientation of each, when named: LV_FLOW=continue-land,case-port,roam-land)
if (ONLY.includes('continue-land')) await continueFlow(...L);
if (ONLY.includes('case-port')) await caseFlow(...PT);
if (ONLY.includes('roam-land')) await roamFlow(...L);
if (want('cold')) await coldFlow(...L);
if (want('street')) await streetFlow(...L);
if (want('anchor')) await anchorFlow(...L);
if (want('reverse')) await reverseFlow(...L);
if (want('snap')) await snapFlow(...L);

await browser.close();
server.close();
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) console.log(failures.map((f) => ' - ' + f).join('\n'));
process.exit(failures.length ? 1 : 0);
