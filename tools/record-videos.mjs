// Records AFTERZERO videos from the real game, frame by frame:
//   gameplay trailer + character showcase, with the generated soundtrack.
//
//   NODE_PATH=$(npm root -g) FFMPEG=/path/to/ffmpeg node tools/record-videos.mjs [outDir] [gameplay|characters|all]
//
// Each shot is a small script run inside the page against window.AZ. The
// game is advanced with AZ.tickFrame(1/FPS), so output is deterministic and
// smooth even on a slow software renderer. Audio is rendered offline by the
// game's own Synth (AZSynth.renderWav) from a cue list that matches the shots.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'game');
const OUT = path.resolve(process.argv[2] || 'videos');
const WHICH = process.argv[3] || 'all';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FPS = 24, W = 960, H = 540;

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(ROOT) || !fs.existsSync(p)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));

// Page-side helpers: cinematic cards, orbit cameras, convenience actions.
const HELPERS = `
window.C = {
  card(html, kind = 'lower') {
    let el = document.getElementById('cine');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cine';
      document.body.appendChild(el);
      const st = document.createElement('style');
      st.textContent = \`
        #cine{position:fixed;inset:0;pointer-events:none;z-index:50;font-family:Inter,'Segoe UI',system-ui,sans-serif;color:#23303c}
        #cine .big{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
          background:radial-gradient(circle at 30% 20%,rgba(255,220,230,.85),transparent 55%),radial-gradient(circle at 75% 80%,rgba(190,235,240,.9),transparent 50%),rgba(240,245,250,.86)}
        #cine .big h1{font-size:76px;letter-spacing:.22em;margin:0;font-weight:800} #cine .big h1 span{color:#ff7a63}
        #cine .big p{font-size:20px;color:#5c6b79;margin:10px 0 0}
        #cine .lower{position:absolute;left:36px;bottom:36px;background:rgba(255,255,255,.92);border-radius:18px;padding:14px 22px;
          box-shadow:0 12px 30px rgba(40,60,90,.18);border-left:6px solid var(--c,#ff7a63)}
        #cine .lower b{display:block;font-size:26px;letter-spacing:.06em} #cine .lower span{font-size:15px;color:#5c6b79}
        #cine .chip{position:absolute;left:50%;transform:translateX(-50%);top:96px;background:rgba(255,255,255,.9);border-radius:999px;padding:8px 16px;font-weight:700;font-size:13px;letter-spacing:.12em;color:#5c6b79}\`;
      document.head.appendChild(st);
    }
    el.innerHTML = html ? (kind === 'big' ? '<div class="big">' + html + '</div>' : html) : '';
  },
  orbit(cx, cy, cz, r, h, a, ty = cy) {
    AZ.player.cinema = { pos: { x: cx + Math.sin(a) * r, y: cy + h, z: cz + Math.cos(a) * r }, target: { x: cx, y: ty, z: cz }, up: { x: 0, y: 1, z: 0 } };
  },
  cam(px, py, pz, tx, ty, tz) {
    AZ.player.cinema = { pos: { x: px, y: py, z: pz }, target: { x: tx, y: ty, z: tz }, up: { x: 0, y: 1, z: 0 } };
  },
  free() { AZ.player.cinema = null; },
  keys(...k) { AZ.input.keys.clear(); for (const x of k) AZ.input.keys.add(x); },
  quiet() { AZ.hud.subs = []; AZ.hud.subT = 0; AZ.hud.nextSub(); AZ.hud.el.toast.classList.remove('on'); AZ.hud.toastT = 0; },
  lerp(a, b, k) { return a + (b - a) * Math.max(0, Math.min(1, k)); },
  ease(k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); },
};`;

// --- the two films --------------------------------------------------------------
const PI = Math.PI;
const FILMS = {
  gameplay: {
    title: 'AFTERZERO-gameplay',
    shots: [
      { dur: 4, cues: [{ t: 0, state: 'PHYSICAL' }, { t: 0.5, fx: 'chime' }],
        setup: `AZ.hud.show(null); AZ.enterRoom('antechamber', true); C.card('<h1>AFTER<span>ZERO</span></h1><p>Rooms that rewrite their own rules.</p>', 'big');`,
        frame: `(t) => { C.orbit(0, 1.7, 21.5, 3.2, 0.6, 0.6 + t * 0.25); if (t > 3.2) C.card(''); }` },
      { dur: 6, cues: [{ t: 2.0, fx: 'sweep', args: [true] }, { t: 4.8, fx: 'sweep', args: [false] }, { t: 4.8, state: 'INVERTED' }],
        setup: `AZ.paused = false; C.free(); C.card('<div class="chip">THE FLOATING OBJECT</div>'); AZ.player.place([0, 0.86, 24.4, 0]); C.keys('KeyW');`,
        frame: `(t) => { if (t > 1.3 && !AZ._a) { AZ._a = 1; C.keys(); } if (t > 2.0 && !AZ._b) { AZ._b = 1; AZ.director.use('shard'); } if (t > 3.0 && !AZ._c) { AZ._c = 1; AZ.input.state.jump = true; } if (t > 4.8 && !AZ._d) { AZ._d = 1; AZ.director.use('shard'); } }` },
      { dur: 6, cues: [],
        setup: `C.card('<div class="chip">GRAVITY, INVERTED</div>');`,
        frame: `(t) => { if (t > 2.6 && !AZ._e) { AZ._e = 1; C.quiet(); AZ.player.place([0, 3.6, 21.5, 0]); C.keys('KeyW'); } }` },
      { dur: 7, cues: [{ t: 1.0, fx: 'chime' }],
        setup: `C.keys(); C.quiet(); AZ.player.place([0, 0.86, 9.5, 0]); AZ.enterRoom('lab'); AZ.facts.set('left_antechamber'); C.card('<div class="chip">MEET JUNO</div>');`,
        frame: `(t) => { if (t < 4) C.cam(-1.2, 2.0, 8.5, -5, C.lerp(6, 1.4, t / 1.2), 2.5); else C.free(); }` },
      { dur: 6, cues: [{ t: 3.6, fx: 'sweep', args: [true] }, { t: 3.6, state: 'ECHO' }, { t: 4.3, fx: 'chime' }],
        setup: `C.free(); C.quiet(); AZ.player.place([3, 0.86, -3, -PI / 2]); AZ.player.pitch = -0.1; C.keys('KeyD'); C.card('<div class="chip">THE SHADOW MOVES WRONG</div>');`.replace('PI', String(PI)),
        frame: `(t) => { if (t > 1.6 && !AZ._f) { AZ._f = 1; C.keys(); AZ.player.place([3, 0.86, -6, -${PI / 2}]); } if (t > 3.6 && !AZ._g) { AZ._g = 1; AZ.shift('ECHO'); } }` },
      { dur: 4, cues: [{ t: 0.3, fx: 'chime' }, { t: 1.8, fx: 'blip', args: [660, 0.1] }],
        setup: `C.card(''); for (const k of ['HELD','PERSISTS']) AZ.facts.set('token_' + k); AZ.openMenu('laws');`,
        frame: `(t) => { if (t > 1.6 && !AZ._h) { AZ._h = 1; AZ.engine.setLaw(1, { subject: 'HELD', verb: 'PERSISTS', target: 'PHYSICAL' }); AZ.hud.lawDraft = null; AZ.hud.renderLaws(AZ, 'LAW 2 INSTALLED'); } }` },
      { dur: 7, cues: [{ t: 0, state: 'PHYSICAL' }, { t: 0.2, threat: 0.7 }, { t: 3.5, fx: 'alert' }],
        setup: `AZ.closeMenu(); AZ.engine.setState('lab', 'PHYSICAL'); C.quiet(); AZ.player.place([-27.2, 0.86, -6.2, ${PI / 2}]); AZ.enterRoom('hall'); AZ.observer.sightRange = 0; AZ.observer.pos.set(-32.5, 0, -2.4); AZ.observer.mode = 'patrol'; AZ.observer.path = []; C.card('<div class="chip">THE OBSERVER LEARNS HOW YOU PLAY</div>');`,
        frame: `(t) => { C.cam(C.lerp(-21.5, -23.5, t / 7), C.lerp(4.6, 3.8, t / 7), C.lerp(-7.4, -7.0, t / 7), -30.5, 1.3, -3.6); if (t > 3.5) AZ.observer.suspicion = Math.min(0.9, (t - 3.5) * 0.4); }` },
      { dur: 6, cues: [{ t: 0, threat: 0 }, { t: 0.4, state: 'ECHO' }, { t: 0.4, fx: 'sweep', args: [true] }],
        setup: `C.free(); AZ.observer.suspicion = 0; for (const k of ['ECHOES','SOLIDIFIES']) AZ.facts.set('token_' + k); AZ.facts.set('archive_open'); AZ.facts.set('custodian_remembers'); AZ.engine.unlockSlot(3); AZ.engine.setLaw(2, { subject: 'ECHOES', verb: 'SOLIDIFIES', target: 'ECHO' }); C.quiet(); AZ.player.place([0, 0.86, -21.5, 0]); AZ.enterRoom('archive'); AZ.engine.setState('archive', 'ECHO'); C.keys('KeyW'); C.card('<div class="chip">WALK ON A MEMORY</div>');`,
        frame: `(t) => { if (t < 3.4) C.cam(6.5, 2.4, C.lerp(-23.5, -28, t / 3.4), 0, -0.4, C.lerp(-25, -30, t / 3.4)); else C.free(); if (t > 4.6) C.keys(); }` },
      { dur: 7, cues: [{ t: 0, state: 'PHYSICAL' }, { t: 1.0, fx: 'chime' }, { t: 1.6, fx: 'sweep', args: [true] }, { t: 1.9, fx: 'sweep', args: [false] }],
        setup: `C.keys(); C.quiet(); AZ.engine.setState('archive', 'PHYSICAL'); AZ.facts.set('core_installed'); AZ.player.place([0, 0.86, 7.5, 0]); AZ.enterRoom('lab'); C.card('<div class="chip">THE WALLS ARE WINDOWS</div>');`,
        frame: `(t) => { if (t > 1.0 && !AZ._i) { AZ._i = 1; AZ.director.use('machine'); AZ.director.use('machine'); } if (t > 2.2) { const k = C.ease((t - 2.2) / 4.8); C.cam(C.lerp(1.5, 7, k), C.lerp(2.2, 5.5, k), C.lerp(9, 10.5, k), 0, 3.4, -1); } }` },
      { dur: 4, cues: [{ t: 0.2, fx: 'chime' }],
        setup: `C.quiet(); C.card('<h1>AFTER<span>ZERO</span></h1><p>A calm puzzle adventure. Desktop, Android, browser.</p>', 'big');`,
        frame: `(t) => { C.orbit(0, 3.4, 0, 9, 1.5, 1 + t * 0.15); }` },
    ],
  },
  characters: {
    title: 'AFTERZERO-characters',
    shots: [
      { dur: 3, cues: [{ t: 0, state: 'PHYSICAL' }, { t: 0.3, fx: 'chime' }],
        setup: `AZ.hud.show(null); AZ.paused = false; AZ.facts.set('has_device'); AZ.facts.set('left_antechamber'); AZ.facts.set('met_juno'); AZ.facts.set('has_tick'); AZ.player.place([1.5, 0.86, 6, ${PI}]); AZ.enterRoom('lab'); C.card('<h1>THE <span>CAST</span></h1><p>Who you meet aboard the vessel.</p>', 'big');`,
        frame: `(t) => { C.orbit(0, 3, 2, 10, 2, t * 0.2); if (t > 2.6) C.card(''); }` },
      { dur: 5, cues: [{ t: 0.1, fx: 'pickup' }],
        setup: `C.quiet(); AZ.npcs.juno.position.set(-5, 0, 2.5); C.card('<div class="lower" style="--c:#ff7a63"><b>REN</b><span>Subject Zero. You. Waking up for the 42nd time.</span></div>');`,
        frame: `(t) => { const p = AZ.player.pos; C.orbit(p.x, p.y + 0.2, p.z, 2.8, 0.5, ${PI} + 0.6 - t * 0.35); }` },
      { dur: 6, cues: [{ t: 0.1, fx: 'pickup' }],
        setup: `C.quiet(); AZ.npcs.talkToJuno(); C.card('<div class="lower" style="--c:#2f9a64"><b>JUNO HALE</b><span>Engineer. Last one awake. Has been living on the ceiling.</span></div>');`,
        frame: `(t) => { const j = AZ.npcs.juno.position; C.orbit(j.x, 1.25, j.z, 2.6, 0.35, 0.9 + t * 0.25, 1.35); }` },
      { dur: 5, cues: [{ t: 0.1, fx: 'pickup' }, { t: 0.3, fx: 'blip', args: [988, 0.1] }],
        setup: `C.quiet(); AZ.npcs.hint(); C.card('<div class="lower" style="--c:#e0a818"><b>TICK</b><span>A drone Ren built at nine. Your hint system. Never judgy.</span></div>');`,
        frame: `(t) => { const k = AZ.npcs.tick.position; C.orbit(k.x, k.y, k.z, 1.3, 0.15, 2.5 + t * 0.4); }` },
      { dur: 6, cues: [{ t: 0.1, fx: 'pickup' }, { t: 0, state: 'PHYSICAL' }],
        setup: `C.quiet(); AZ.facts.set('archive_open'); AZ.player.place([0, 0.86, -17.5, 0]); AZ.enterRoom('archive'); AZ.director.use('custodian'); C.card('<div class="lower" style="--c:#1f9a86"><b>THE CUSTODIAN</b><span>Keeper of the archive. Believes only evidence.</span></div>');`,
        frame: `(t) => { C.orbit(0, 1.2, -20.5, 3.4, 0.8, 0.4 + t * 0.3, 1.3); }` },
      { dur: 6, cues: [{ t: 0.1, fx: 'pickup' }, { t: 3, fx: 'alert' }],
        setup: `C.quiet(); AZ.player.place([-18, 0.86, 6, ${PI / 2}]); AZ.enterRoom('hall'); AZ.observer.sightRange = 0; AZ.observer.pos.set(-31, 0, 2.5); AZ.observer.mode = 'pause'; AZ.observer.timer = 99; AZ.observer.lookTarget = { x: -26, z: 6 }; C.card('<div class="lower" style="--c:#4fa8d8"><b>THE OBSERVER</b><span>It learns how you hide, how you run, which laws you use.</span></div>');`,
        frame: `(t) => { AZ.observer.suspicion = t < 2 ? 0 : t < 4 ? 0.6 : 0; AZ.observer.mode = t > 4 && t < 5 ? 'chase' : 'pause'; AZ.observer.timer = 99; C.orbit(-31, 1.6, 2.5, 5, 0.8, 1.2 + t * 0.25, 2); }` },
      { dur: 5, cues: [{ t: 0.1, fx: 'pickup' }, { t: 0.1, state: 'INVERTED' }],
        setup: `C.quiet(); AZ.observer.mode = 'patrol'; AZ.facts.set('shard_touch', 2); AZ.facts.set('other_gone', false); AZ.player.place([0, 0.86, 23.5, 0]); AZ.enterRoom('antechamber'); C.card('<div class="lower" style="--c:#7a5fd0"><b>THE OTHER</b><span>Stands upside down. Knows your name. Is you, one cycle later.</span></div>');`,
        frame: `(t) => { C.cam(1.2, 1.4, 18.5 - t * 0.3, 0, 3.4, 14.5); }` },
      { dur: 3, cues: [{ t: 0, state: 'PHYSICAL' }, { t: 0.2, fx: 'chime' }],
        setup: `C.quiet(); C.card('<h1>AFTER<span>ZERO</span></h1><p>Every room has rules. Every character remembers.</p>', 'big');`,
        frame: `(t) => { C.orbit(0, 2, 21.5, 3, 1, t * 0.3); }` },
    ],
  },
};

async function record(film, browser) {
  const dir = path.join(OUT, film.title + '_frames');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${server.address().port}/index.html`);
  await page.waitForTimeout(1500);
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.evaluate(HELPERS);
  await page.addStyleTag({ content: '#objective{display:none!important}' }); // trailers: keep the frame clean
  await page.evaluate(() => { AZ.captureMode(); AZ.audio.start = () => {}; });
  let frame = 0, clock = 0;
  const cues = [];
  for (const [i, shot] of film.shots.entries()) {
    console.log(`  ${film.title}: shot ${i + 1}/${film.shots.length}`);
    for (const c of shot.cues || []) cues.push({ ...c, t: c.t + clock });
    await page.evaluate((src) => (0, eval)(src), `for (const k of ['_a','_b','_c','_d','_e','_f','_g','_h','_i']) delete AZ[k];` + shot.setup);
    const n = Math.round(shot.dur * FPS);
    for (let f = 0; f < n; f++) {
      await page.evaluate(([src, t, dt]) => { (0, eval)(src)(t); AZ.tickFrame(dt); }, [shot.frame, f / FPS, 1 / FPS]);
      await page.screenshot({ path: path.join(dir, String(frame++).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 88 });
    }
    clock += shot.dur;
  }
  // talk blips for every subtitle line are part of the game; add a soft cue track
  const wavB64 = await page.evaluate(async ([dur, cues]) => {
    const buf = await AZSynth.renderWav(dur, cues);
    let s = '';
    const b = new Uint8Array(buf);
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  }, [clock + 0.5, cues]);
  const wav = path.join(OUT, film.title + '.wav');
  fs.writeFileSync(wav, Buffer.from(wavB64, 'base64'));
  await page.close();
  const mp4 = path.join(OUT, film.title + '.mp4');
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, '%05d.jpg'), '-i', wav,
    '-af', `afade=t=in:d=0.8,afade=t=out:st=${Math.max(0, clock - 1.2)}:d=1.2`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', mp4]);
  console.log(`  wrote ${mp4} (${clock}s, ${frame} frames)${errors.length ? '  page errors: ' + errors.join(' | ') : ''}`);
  return mp4;
}

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
for (const [key, film] of Object.entries(FILMS)) if (WHICH === 'all' || WHICH === key) await record(film, browser);
await browser.close();
server.close();
