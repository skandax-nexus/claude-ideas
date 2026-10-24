// AFTERZERO: THE LAST VERSION OF EARTH - is it heard? In real time, with the game's own frame loop and Chromium's
// autoplay policy on (sound needs a user gesture), from NEW GAME:
//   - the first tap starts the AudioContext
//   - a cinematic (the Prologue's card, the cold open, Mission 1's card) starts audio: the voice plays decoded clips
//     of the edition's packs (AudioBufferSourceNodes with real buffers) and the voice's output carries signal, with
//     the score's music under it
//   - a conversation (the florist on the market lane: hers and Kai's lines) starts audio the same way
//   - speechSynthesis is never asked for anything, and nothing said misses the packs (__voiceMiss)
//   NODE_PATH=$(npm root -g) node tests/lastversion-audio.mjs
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
await page.route('**/*', (route) => {
  const u = new URL(route.request().url());
  return u.hostname === 'localhost' || u.hostname === '127.0.0.1' ? route.continue() : route.abort();
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

// before the game: the device's speech is watched, and every buffer source that starts is logged
await page.addInitScript(() => {
  window.__synthCalls = 0;
  try {
    const s = window.speechSynthesis;
    if (s) for (const k of ['speak', 'getVoices', 'cancel']) { const f = s[k].bind(s); s[k] = (...a) => { window.__synthCalls++; return f(...a); }; }
  } catch { /* no speech here */ }
  window.__starts = [];
  const start = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a) {
    window.__starts.push({ wall: performance.now(), dur: this.buffer ? +this.buffer.duration.toFixed(2) : 0, ch: this.buffer?.numberOfChannels || 0 });
    return start.apply(this, a);
  };
});
await page.goto(url);
await page.evaluate(() => { try { localStorage.clear(); } catch { /* */ } });
await page.reload();
await page.waitForFunction(() => window.AZ, null, { timeout: 400000 });
await page.evaluate(() => { AZ.changeSetting('quality', 'low'); AZ.changeSetting('smart', false); });

// --- the first tap ---------------------------------------------------------------------------------------------
console.log('The first tap');
const before = await page.evaluate(() => AZ.audio.ctx?.state || 'none');
await page.mouse.click(480, 120);
await page.waitForFunction(() => AZ.audio.ctx?.state === 'running', null, { timeout: 20000 }).catch(() => {});
const tapped = await page.evaluate(() => AZ.audio.ctx?.state);
check(before !== 'running' && tapped === 'running', 'the AudioContext runs after the first tap', JSON.stringify({ before, tapped }));

// the voice's own output and the whole mix, each into an analyser sampled every 25 ms; every line the voice plays logged
await page.evaluate(() => {
  const ctx = AZ.audio.ctx, v = AZ.voice;
  const tap = (node) => { const a = ctx.createAnalyser(); a.fftSize = 1024; node.connect(a); return a; };
  const voiceA = tap(v.output());
  const mixA = tap(AZ.audio.master);
  const buf = new Float32Array(1024);
  const rms = (a) => { a.getFloatTimeDomainData(buf); let s = 0; for (const x of buf) s += x * x; return Math.sqrt(s / buf.length); };
  window.__rms = [];
  setInterval(() => window.__rms.push({ wall: performance.now(), voice: rms(voiceA), mix: rms(mixA) }), 25);
  window.__plays = [];
  const play = v.playPlan.bind(v);
  v.playPlan = (plan, extra) => {
    const rec = { wall: performance.now(), keys: plan.filter((p) => p.key).map((p) => p.key), packs: [...new Set(plan.filter((p) => p.pack).map((p) => p.pack.base))], fx: extra?.fx || null, starts: 0 };
    window.__plays.push(rec);
    const n0 = window.__starts.length;
    return play(plan, extra).then((r) => { rec.starts = window.__starts.length - n0; rec.started = performance.now(); return r; });
  };
});

// what was heard in a window of wall-clock time: lines played from the packs, buffers started, the peak levels
const heard = (from, to = Infinity) => page.evaluate(([a, b]) => {
  const plays = window.__plays.filter((p) => p.wall >= a && p.wall <= b);
  const starts = window.__starts.filter((s) => s.wall >= a && s.wall <= b);
  const r = window.__rms.filter((x) => x.wall >= a && x.wall <= b);
  return {
    plays: plays.length, started: plays.filter((p) => p.starts > 0).length, clips: starts.filter((s) => s.dur > 0).length,
    keys: plays.slice(0, 8).map((p) => p.keys[0]), packs: [...new Set(plays.flatMap((p) => p.packs))],
    voicePeak: +Math.max(0, ...r.map((x) => x.voice)).toFixed(4), mixPeak: +Math.max(0, ...r.map((x) => x.mix)).toFixed(4),
    voiced: r.filter((x) => x.voice > 0.005).length, samples: r.length,
  };
}, [from, to]);

// --- a cinematic: NEW GAME opens on the Prologue's card, the cold open, Mission 1's card ------------------------------
console.log('A cinematic: the Prologue\'s card, the cold open, Mission 1\'s card');
await page.click('#begin');
await page.waitForFunction(() => AZ.menu === 'chapters', null, { timeout: 30000 });
await page.click('#chapters [data-newch="prologue"]');
await page.waitForFunction(() => AZ.menu === 'saves', null, { timeout: 30000 });
const t0 = await page.evaluate(() => performance.now());
await page.evaluate(() => setTimeout(() => document.querySelector('#saves [data-slot="0"]').click(), 0));
await page.waitForFunction(() => AZ.started && AZ.room && AZ.mode === 'deck' && AZ.level?.place, null, { timeout: 300000 });
// (real time: the cinematic is said while the game's own loop runs, as slowly as SwiftShader draws it; the Prologue's
// card, its question, then the cold open's first line)
const playedKey = (re) => page.waitForFunction((src) => window.__plays.some((p) => p.keys.some((k) => new RegExp(src).test(k)) && p.starts > 0), re.source, { timeout: 180000, polling: 500 }).then(() => true, () => false);
await playedKey(/^NONE\|the prologue/);
await playedKey(/^NONE\|rain city/);
// the cold open goes on line by line (Space skips one line, as a tap on the view does; Enter would end the whole
// opening, its card with it): then Mission 1's card is said
const hasKey = (src) => page.evaluate((x) => window.__plays.some((p) => p.keys.some((k) => new RegExp(x).test(k)) && p.starts > 0), src);
for (let i = 0; i < 80 && !(await hasKey('^NONE\\|mission one')); i++) {
  await page.evaluate(() => { if (AZ.menu === 'pause') AZ.closeMenu(); });
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);
}
await playedKey(/^NONE\|mission one/);
await page.waitForTimeout(1500);
const t1 = await page.evaluate(() => performance.now());
const cine = await heard(t0, t1);
const cineState = await page.evaluate(() => ({ cues: [...new Set(AZ.edition.score.heard)], opening: !!AZ.edition.opening, cinema: !!AZ.edition.cinema.active, packs: AZ.voice.packs.map((p) => p.base) }));
const cardPlays = await page.evaluate(([a, b]) => window.__plays.filter((p) => p.wall >= a && p.wall <= b && p.keys.some((k) => /^NONE\|(the prologue|rain city|mission one)/.test(k))).map((p) => ({ k: p.keys[0], starts: p.starts, packs: p.packs })), [t0, t1]);
console.log('  ', JSON.stringify({ cine, cineState, cardPlays }));
check(['the prologue', 'rain city', 'mission one'].every((k) => cardPlays.some((p) => p.k === `NONE|${k}`)) && cardPlays.every((p) => p.starts > 0 && p.packs.every((b) => /assets\/voice\/lv\/(common|prologue)\//.test(b))),
  'the cards are said from the edition\'s packs: each line\'s decoded clips start (the Prologue\'s card, the cold open, Mission 1\'s card)', JSON.stringify(cardPlays));
check(cine.clips >= 3 && cine.voicePeak > 0.01 && cine.voiced >= 8, 'the cinematic is heard: the voice\'s output carries signal while it plays', JSON.stringify(cine));
check(['chapter', 'card'].every((c) => cineState.cues.includes(c)) && cine.mixPeak > cine.voicePeak * 0.5, 'and it is scored: the chapter and card cues play, the mix carries the music under the voice', JSON.stringify({ cues: cineState.cues, mixPeak: cine.mixPeak }));

// --- a conversation: the florist on the market lane ---------------------------------------------------------------
console.log('A conversation: the florist');
// (the rest of the opening is skipped, a press of Enter (SKIP's key) a line, as a player may)
for (let i = 0; i < 40; i++) {
  const busy = await page.evaluate(() => !!(AZ.edition.opening || AZ.edition.cinema.active || AZ.transitioning));
  if (!busy) break;
  await page.evaluate(() => { if (AZ.menu === 'pause') AZ.closeMenu(); });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(750);
}
const t2 = await page.evaluate(() => (window.__t2 = performance.now()));
const talk = await page.evaluate(() => {
  const g = AZ;
  if (g.menu === 'pause') g.closeMenu();
  const c = g.deckWorld.focusCandidates(g).find((x) => x.id === 'dnpc:florist' || x.id === 'florist' || x.id === 'deck:florist');
  if (!c) return { err: 'no florist', ids: g.deckWorld.focusCandidates(g).map((x) => x.id).slice(0, 20), opening: !!g.edition.opening };
  g.player.place([c.pos[0], c.pos[1] + 0.2, c.pos[2] + 1.2, Math.PI]);
  g.focus = g.deckWorld.focusCandidates(g).find((x) => x.id === c.id) || c;
  g.lastUse = null;
  g.use();
  return { used: c.id, talking: !!g.hud.talking };
});
await page.waitForFunction(() => window.__plays.some((p) => p.keys.some((k) => /^FLORIST\|/.test(k)) && p.starts > 0), null, { timeout: 60000, polling: 250 }).catch(() => {});
// (the conversation runs at its own pace: up to 40 s for her lines and Kai's)
await page.waitForFunction(() => !AZ.hud.talking || window.__plays.some((p) => p.keys.some((k) => /^KAI\|/.test(k)) && p.starts > 0 && p.wall > window.__t2), null, { timeout: 40000, polling: 250 }).catch(() => {});
await page.waitForTimeout(1500);
const t3 = await page.evaluate(() => performance.now());
const conv = await heard(t2, t3);
const convPlays = await page.evaluate(([a, b]) => window.__plays.filter((p) => p.wall >= a && p.wall <= b).map((p) => ({ k: p.keys[0], starts: p.starts, packs: p.packs })), [t2, t3]);
const florist = await page.evaluate(() => ({ ev: !!AZ.facts.get('ev_florist'), said: AZ.hud.log?.slice?.(-3) }));
console.log('  ', JSON.stringify({ talk, conv, convPlays: convPlays.slice(0, 8), florist: florist.ev }));
check(!talk.err && convPlays.some((p) => /^FLORIST\|/.test(p.k) && p.starts > 0), 'the florist\'s lines are said in her own recorded voice: their decoded clips start', JSON.stringify({ talk, convPlays }));
check(convPlays.filter((p) => p.starts > 0).every((p) => p.packs.every((b) => /assets\/voice\/lv\/(common|prologue)\//.test(b))), 'from the edition\'s packs (common and the Prologue\'s)', JSON.stringify(convPlays));
check(conv.voicePeak > 0.01 && conv.voiced >= 8, 'the conversation is heard: the voice\'s output carries signal while she speaks', JSON.stringify(conv));

// --- never the device's speech, and nothing missed ----------------------------------------------------------------
const end = await page.evaluate(() => ({ synth: window.__synthCalls, miss: (window.__voiceMiss || []).slice(0, 8), misses: (window.__voiceMiss || []).length, plays: window.__plays.length, started: window.__plays.filter((p) => p.starts > 0).length }));
check(end.synth === 0, 'speechSynthesis is never asked for anything', JSON.stringify(end));
check(end.misses === 0, 'no line said misses the packs', JSON.stringify(end));
check(errors.length === 0, 'no page errors', [...new Set(errors)].join(' | '));

await browser.close();
server.close();
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) console.log(failures.map((f) => ' - ' + f).join('\n'));
process.exit(failures.length ? 1 : 0);
