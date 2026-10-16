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
const WHICH = process.argv[3] || 'all'; // gameplay | characters | phone | all
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const STILLS = !!process.env.STILLS; // quick check: one still per shot, no video
const KOKORO = process.env.KOKORO_DIR; // optional: voice the dialogue with tools/voice-lines.py
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
        body.cine-lower #subs{left:auto;right:28px;bottom:36px;transform:none;width:330px;text-align:right}
        body.cine-lower #cine .lower{max-width:520px}
        body.cine-lower #subs .sub{font-size:13px;padding:10px 14px}
        body.cine-lower #prompt, body.cine-lower #toast{display:none}
        #cine .chip{position:absolute;left:50%;transform:translateX(-50%);top:96px;background:rgba(255,255,255,.9);border-radius:999px;padding:8px 16px;font-weight:700;font-size:13px;letter-spacing:.12em;color:#5c6b79}\`;
      document.head.appendChild(st);
    }
    el.innerHTML = html ? (kind === 'big' ? '<div class="big">' + html + '</div>' : html) : '';
    document.body.classList.toggle('cine-lower', !!html && html.includes('class="lower"')); // name cards: subtitles step aside
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
  // --- the vessel: find a generated room with a given challenge and play it
  vessel(seed) {
    if (AZ.mode !== 'deck' || AZ.campaign.seed !== seed) AZ.startVessel(seed);
    for (const t of ['TIME', 'LIGHT']) AZ.facts.set('token_' + t);
    AZ.transitioning = true;
  },
  find(pred, from = [0, 0]) {
    const { generateSector } = C.gen;
    for (let d = from[0]; d < 8; d++) for (let s = d === from[0] ? from[1] : 0; s < 4; s++) {
      const lv = generateSector(AZ.story, d, s, AZ.campaign.seed);
      for (const [i, rid] of lv.order.entries()) if (pred(lv.rooms[rid], lv)) return { deck: d, sector: s, idx: i };
    }
    return null;
  },
  LAW: {
    gravityFlip: ['GRAVITY', 'INVERTS', 'INVERTED'], echoSolid: ['ECHOES', 'SOLIDIFIES', 'ECHO'], zeroG: ['GRAVITY', 'FREEZES', 'PHYSICAL'],
    lightSolid: ['LIGHT', 'SOLIDIFIES', 'ALL'], heldPersists: ['HELD', 'PERSISTS', 'ALL'], timeStop: ['TIME', 'FREEZES', 'PHYSICAL'], observerFrozen: ['OBSERVER', 'FREEZES', 'PHYSICAL'],
  },
  play(where, { laws = true, from = 0, fromEnd = 0, sectorIntro = false } = {}) {
    const g = AZ;
    g.campaign.deck = where.deck; g.campaign.sector = where.sector; g.campaign.flags = {}; g.campaign.visited = [];
    g.loadSector(sectorIntro);
    if (!sectorIntro) document.querySelector('#card').classList.remove('on');
    C.quiet();
    const rid = g.level.order[where.idx];
    const room = g.level.rooms[rid];
    if (laws) {
      const req = [...new Set(room.challenges.filter((c) => c.effect && !c.optional).map((c) => c.effect))];
      const opt = [...new Set(room.challenges.filter((c) => c.effect && c.optional).map((c) => c.effect))];
      const L = [];
      if (req.includes('gravityFlip') || opt.length + req.length < 3) L.push(C.LAW.gravityFlip);
      for (const e of [...req, ...opt]) if (e !== 'gravityFlip' && L.length < 3) L.push(C.LAW[e]);
      for (let i = 0; i < 3; i++) g.engine.setLaw(i, L[i] ? { subject: L[i][0], verb: L[i][1], target: L[i][2] } : null);
    }
    g.engine.setState(rid, 'PHYSICAL', { force: true });
    g.held = null;
    g.enterRoom(rid, true);
    if (fromEnd) from = room.route.length - fromEnd;
    const w0 = room.route[from - 1];
    if (w0 && w0.pos) g.player.place([w0.pos[0], 0.86, w0.pos[2], room.spawn[3]]);
    C.bot = { room, rid, i: from, entered: false, wait: 0 };
    return room;
  },
  // one frame of the bot: steer along the route, shift states, take and use things
  step(dt) {
    const b = C.bot, g = AZ;
    if (!b || b.i >= b.room.route.length) { C.keys(); return; }
    const w = b.room.route[b.i];
    if (!b.entered) {
      b.entered = true;
      if (w.state && g.engine.state(b.rid) !== w.state) { g.shift(w.state); C.press('.shift'); }
      b.wait = w.wait || 0;
    }
    if (b.wait > 0) { b.wait -= dt; C.keys(); return; }
    const dx = w.pos[0] - g.player.pos.x, dz = w.pos[2] - g.player.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.4) {
      C.keys();
      if (w.act === 'take') g.useDeck({ id: 'ditem:' + w.item });
      if (w.act === 'use') { const it = g.level.interactables.find((x) => x.id === w.target); g.useDeck({ id: 'deck:' + it.id, it }); }
      b.i++;
      b.entered = false;
      return;
    }
    const want = new (g.player.H.constructor)(dx / d, 0, dz / d);
    g.player.H.lerp(want, Math.min(1, dt * 7)).normalize();
    C.keys('KeyW');
    if (w.jump && g.player.grounded) { g.input.state.jump = true; C.press('.jump'); }
  },
  // phone captures: the thumb stick and buttons move with what the bot does
  touchUi() {
    if (!document.body.classList.contains('touch')) return;
    const st = document.querySelector('#stick'), knob = st.querySelector('.knob'), zone = document.querySelector('#stickzone');
    const moving = AZ.input.keys.has('KeyW');
    st.classList.toggle('on', moving);
    st.style.left = '120px';
    st.style.top = (zone.clientHeight - 105) + 'px';
    knob.style.transform = moving ? 'translate(-50%, calc(-50% - 40px))' : 'translate(-50%, -50%)';
    for (const [sel, t] of Object.entries(C.pressed || {})) {
      const el = document.querySelector('#buttons ' + sel + ', ' + sel);
      if (el) el.classList.toggle('down', performance.now() - t < 160);
    }
  },
  press(sel) { (C.pressed ||= {})[sel] = performance.now(); },
  lerp(a, b, k) { return a + (b - a) * Math.max(0, Math.min(1, k)); },
  ease(k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); },
};`;

// --- the two films --------------------------------------------------------------
const PI = Math.PI;
const SEED = 20261016;
const chip = (t) => `C.card('<div class="chip">${t}</div>');`;
// A gameplay shot in a generated room: find a room with the challenge, let the bot play it.
const deckShot = (label, pred, dur, cues = [], opts = '{}') => ({
  dur, cues,
  setup: `C.vessel(${SEED}); const w = C.find(${pred}); if (!w) throw new Error('no room for ' + ${JSON.stringify(label)}); C.play(w, ${opts}); ${chip(label)}`,
  frame: `(t, dt) => { C.step(1 / 24); }`,
});
const FILMS = {
  gameplay: {
    title: 'AFTERZERO-gameplay',
    shots: [
      { dur: 3.5, cues: [{ t: 0, state: 'PHYSICAL' }, { t: 0.5, fx: 'chime' }],
        setup: `AZ.hud.show(null); AZ.enterRoom('antechamber', true); C.card('<h1>AFTER<span>ZERO</span></h1><p>Rooms that rewrite their own rules.</p>', 'big');`,
        frame: `(t) => { C.orbit(0, 1.7, 21.5, 3.2, 0.6, 0.6 + t * 0.25); if (t > 3.0) C.card(''); }` },
      { dur: 5, cues: [{ t: 2.0, fx: 'sweep', args: [true] }],
        setup: `AZ.paused = false; C.free(); ${chip('PROLOGUE · THE FLOATING OBJECT')} AZ.player.place([0, 0.86, 24.4, 0]); C.keys('KeyW');`,
        frame: `(t) => { if (t > 1.3 && !AZ._a) { AZ._a = 1; C.keys(); } if (t > 2.0 && !AZ._b) { AZ._b = 1; AZ.director.use('shard'); } if (t > 3.0 && !AZ._c) { AZ._c = 1; AZ.input.state.jump = true; } }` },
      { dur: 5, cues: [{ t: 0.2, fx: 'sweep', args: [false] }, { t: 0.2, state: 'INVERTED' }],
        setup: `AZ.director.use('shard'); ${chip('GRAVITY, INVERTED')}`,
        frame: `(t) => { if (t > 1.8 && !AZ._e) { AZ._e = 1; C.quiet(); AZ.player.place([0, 3.6, 21.5, 0]); C.keys('KeyW'); } }` },
      { dur: 5, cues: [{ t: 1.0, fx: 'chime' }],
        setup: `C.keys(); C.quiet(); AZ.player.place([0, 0.86, 9.5, 0]); AZ.enterRoom('lab'); AZ.facts.set('left_antechamber'); ${chip('MEET JUNO')}`,
        frame: `(t) => { if (t < 3.6) C.cam(-1.2, 2.0, 8.5, -5, C.lerp(6, 1.4, t / 1.2), 2.5); else C.free(); }` },
      { dur: 4, cues: [{ t: 0.2, fx: 'chime' }, { t: 0.2, state: 'PHYSICAL' }],
        setup: `C.keys(); C.vessel(${SEED}); C.play({ deck: 0, sector: 0, idx: 0 }); C.card('<h1>THE <span>VESSEL</span></h1><p>Eight generated decks &middot; a crew of seven &middot; one of them started the loop</p>', 'big');`,
        frame: `(t) => { const p = AZ.player.pos; C.orbit(p.x, 2.2, p.z - 5, 9, 2.5, t * 0.18, 1.5); }` },
      { dur: 5, cues: [{ t: 0.3, fx: 'chime' }],
        setup: `C.card(''); C.free(); C.play({ deck: 0, sector: 0, idx: 0 }, { sectorIntro: true });`,
        frame: `(t) => { C.step(1 / 24); }` },
      { dur: 5, cues: [{ t: 0.4, fx: 'terminal' }],
        setup: `C.vessel(${SEED}); C.play({ deck: 0, sector: 0, idx: 0 }, { laws: false }); const it = AZ.level.interactables.find((i) => i.kind === 'terminal'); const r = AZ.level.rooms[it.room]; AZ.player.place([it.pos[0] + 2.0 * Math.cos(r.spawn[3]), 0.86, it.pos[2] - 2.0 * Math.sin(r.spawn[3]) * 0, r.spawn[3]]); C.free(); ${chip('LOGS PLAY AS HOLOGRAMS')}`,
        frame: `(t) => { const it = AZ.level.interactables.find((i) => i.kind === 'terminal'); const p = AZ.player.pos; if (t > 0.4 && !AZ._a) { AZ._a = 1; AZ.useDeck({ id: 'deck:' + it.id, it }); } C.cam(p.x + (it.pos[0] - p.x) * 0.1 + 0.8, 2.3, p.z + 2.6, it.pos[0], 2.0, it.pos[2]); }` },
      deckShot('DECK 1 · WALK THE CEILING ACROSS THE GAP', `(r) => r.challenges[0] && r.challenges[0].key === 'pit:gravity'`, 8.5, [{ t: 1.5, fx: 'sweep', args: [true] }, { t: 1.5, state: 'INVERTED' }, { t: 6.5, fx: 'sweep', args: [false] }, { t: 6.5, state: 'PHYSICAL' }]),
      deckShot('DECK 2 · MEMORIES CAN CARRY WEIGHT', `(r) => r.challenges[0] && r.challenges[0].key === 'pit:echo'`, 7, [{ t: 1.2, fx: 'sweep', args: [true] }, { t: 1.2, state: 'ECHO' }], '{ from: 1 }'),
      deckShot('DECK 3 · STOP GRAVITY. FLOAT.', `(r) => r.challenges.some((c) => c.key === 'ledge:zerog')`, 8, [{ t: 0.4, fx: 'chime' }], '{ fromEnd: 4 }'),
      { dur: 3, cues: [{ t: 0.3, fx: 'chime' }, { t: 1.6, fx: 'blip', args: [660, 0.1] }],
        setup: `C.vessel(${SEED}); C.find(() => false); AZ.engine.setLaw(1, null); AZ.engine.setLaw(2, null); C.card(''); AZ.openMenu('laws');`,
        frame: `(t) => { if (t > 1.4 && !AZ._h) { AZ._h = 1; AZ.engine.setLaw(1, { subject: 'TIME', verb: 'FREEZES', target: 'PHYSICAL' }); AZ.hud.lawDraft = null; AZ.hud.renderLaws(AZ, 'LAW 2 INSTALLED'); } }` },
      Object.assign(deckShot('DECK 4 · TIME FREEZES IN PHYSICAL', `(r) => r.challenges[0] && r.challenges[0].key === 'sweepers'`, 7, [{ t: 0.2, threat: 0.3 }], '{ from: 0 }'), { setup: `AZ.closeMenu(); C.vessel(${SEED}); const w = C.find((r) => r.challenges[0] && r.challenges[0].key === 'sweepers', [3, 0]); C.play(w); ${chip('DECK 4 · TIME FREEZES IN PHYSICAL')}` }),
      Object.assign(deckShot('DECK 5 · THE SENTINELS WATCH THE FLOOR', '', 7, [{ t: 0.2, threat: 0.6 }, { t: 3, fx: 'alert' }]), {
        setup: `C.vessel(${SEED}); const w = C.find((r) => r.challenges[0] && r.challenges[0].key === 'sentinel', [4, 0]); C.play(w, { laws: false }); AZ.engine.setLaw(0, { subject: 'GRAVITY', verb: 'INVERTS', target: 'INVERTED' }); ${chip('DECK 5 · THE SENTINELS ONLY WATCH THE FLOOR')}`,
        frame: `(t) => { if (t > 1.6 && !AZ._a) { AZ._a = 1; AZ.shift('INVERTED'); } if (t > 2.4) { C.keys('KeyW'); } const s = AZ.deckWorld.sentinels[0]; if (s && t < 3.2) C.cam(AZ.player.pos.x + 3, 4.2, AZ.player.pos.z + 3, s.pos.x, 1.2, s.pos.z); else C.free(); }` }),
      deckShot('DECK 6 · HARD LIGHT HOLDS WHEN YOU TELL IT TO', `(r) => r.challenges.some((c) => c.key === 'ledge:light')`, 8, [{ t: 0.3, fx: 'chime' }], '{ fromEnd: 4 }'),
      { dur: 6.5, cues: [{ t: 0.2, fx: 'pickup' }],
        setup: `C.vessel(${SEED}); C.keys(); const w = C.find((r) => r.kind === 'encounter', [2, 0]); C.play(w, { laws: false }); const n = AZ.deckWorld.npcs[0]; AZ.player.place([n.model.position.x, 0.86, n.model.position.z, 0]); AZ.player.pos.addScaledVector(AZ.player.H, -2.6); AZ.player.place([AZ.player.pos.x, 0.86, AZ.player.pos.z, AZ.level.rooms[AZ.room].spawn[3]]); const f = AZ.deckWorld.focusCandidates(AZ).find((c) => c.id.startsWith('dnpc')); C.quiet(); AZ.useDeck(f); C.free(); C.card('<div class="chip">CREW TALK TO YOU · THE CAMERA FRAMES THE CONVERSATION</div>');`,
        frame: `(t) => { const m = AZ.deckWorld.npcs[0].model.position; const p = AZ.player.pos; const d = Math.hypot(m.x - p.x, m.z - p.z) || 1; AZ.player.H.set((m.x - p.x) / d, 0, (m.z - p.z) / d); }` },
      { dur: 5.5, cues: [{ t: 2.0, fx: 'sweep', args: [true] }, { t: 2.0, state: 'ECHO' }, { t: 2.6, fx: 'chime' }],
        setup: `C.vessel(${SEED}); const w = C.find((r) => r.kind === 'contradiction', [1, 0]); C.play(w, { laws: false }); const it = AZ.level.interactables.find((i) => i.kind === 'plaque'); AZ.player.place([it.pos[0], 0.86, it.pos[2], 0]); AZ.player.pos.lerp(new (AZ.player.pos.constructor)(...AZ.level.rooms[AZ.room].spawn), 0.12); AZ.player.place([AZ.player.pos.x, 0.86, AZ.player.pos.z, AZ.level.rooms[AZ.room].spawn[3]]); ${chip('THE RECORD SAYS ONE THING. THE ECHO REMEMBERS ANOTHER.')}`,
        frame: `(t) => { const it = AZ.level.interactables.find((i) => i.kind === 'plaque'); const p = AZ.player.pos; C.cam(p.x + (it.pos[0] - p.x) * 0.25, 2.6, p.z + (it.pos[2] - p.z) * 0.25 + 0.01, it.pos[0], 3.0, it.pos[2]); if (t > 2.0 && !AZ._b) { AZ._b = 1; AZ.shift('ECHO'); } if (t > 2.6 && !AZ._c) { AZ._c = 1; AZ.useDeck({ id: 'deck:' + it.id, it }); } }` },
      { dur: 4.5, cues: [{ t: 0.2, fx: 'blip', args: [520, 0.1] }],
        setup: `C.quiet(); C.card(''); C.free(); AZ.openMenu('map');`,
        frame: `(t) => { AZ.minimap.drawBig(AZ.player, AZ.room, AZ.mapMarkers()); }` },
      { dur: 5, cues: [{ t: 0.2, fx: 'chime' }],
        setup: `AZ.closeMenu(); C.vessel(${SEED}); C.play({ deck: 7, sector: 3, idx: AZ.story ? 0 : 0 }, { laws: false }); const lv = AZ.level; const rid = lv.order.find((r) => lv.rooms[r].kind === 'verdict'); AZ.enterRoom(rid, true); ${chip('DECK 8 · THE CHAIR DECIDES WHAT HAPPENED')}`,
        frame: `(t) => { const it = AZ.level.interactables.find((i) => i.kind === 'chair'); C.orbit(it.pos[0], 1.4, it.pos[2], 6.2, 2.2, t * 0.22, 0.8); }` },
      { dur: 4, cues: [{ t: 0.2, fx: 'chime' }],
        setup: `C.quiet(); C.card('<h1>AFTER<span>ZERO</span></h1><p>A 35-minute prologue &middot; a five-hour generated vessel &middot; a new crew every cycle</p>', 'big');`,
        frame: `(t) => { const it = AZ.level.interactables.find((i) => i.kind === 'chair'); C.orbit(it.pos[0], 1.4, it.pos[2], 7, 2.6, 1.1 + t * 0.15, 0.8); }` },
    ],
  },
  characters: {
    title: 'AFTERZERO-characters',
    shots: [
      { dur: 3, cues: [{ t: 0, state: 'PHYSICAL' }, { t: 0.3, fx: 'chime' }],
        setup: `AZ.hud.show(null); AZ.paused = false; AZ.facts.set('has_device'); AZ.facts.set('left_antechamber'); AZ.facts.set('met_juno'); AZ.facts.set('has_tick'); AZ.player.place([1.5, 0.86, 6, ${PI}]); AZ.enterRoom('lab'); C.card('<h1>THE <span>CAST</span></h1><p>Who you meet aboard the vessel.</p>', 'big');`,
        frame: `(t) => { C.orbit(0, 3, 2, 10, 2, t * 0.2); if (t > 2.6) C.card(''); }` },
      { dur: 7.5, cues: [0, 1.2, 2.4, 3.6, 4.8, 6.0].map((t) => ({ t, fx: 'blip', args: [880, 0.08] })),
        setup: `C.quiet(); C.card(''); AZ.player.place([1.5, 0.86, 6, ${PI}]); AZ.openHero('title');`,
        frame: `(t) => { const ids = ['ren', 'kai', 'asha', 'mira', 'leo', 'noor']; const i = Math.min(5, Math.floor(t / 1.2)); if (AZ._hero !== i) { AZ._hero = i; AZ.pickHero({ id: ids[i] }, 'title', null); } AZ.player.cinema = null; const p = AZ.player.pos; C.orbit(p.x - 0.7, p.y + 0.35, p.z, 2.6, 0.15, 0.5 + t * 0.12, 0.3); }` },
      { dur: 5, cues: [{ t: 0.1, fx: 'pickup' }],
        setup: `delete AZ._hero; AZ.changeSetting('hero', { id: 'ren' }); AZ.pickHero({ id: 'ren' }, 'title', null); AZ.menu = null; AZ.hud.show(null); C.quiet(); AZ.npcs.juno.position.set(-5, 0, 2.5); C.card('<div class="lower" style="--c:#ff7a63"><b>REN</b><span>Subject Zero. You. Explorer suit, waking up for the 42nd time.</span></div>');`,
        frame: `(t) => { const p = AZ.player.pos; C.orbit(p.x, p.y + 0.5, p.z, C.lerp(2.4, 1.5, t / 5), 0.1, 0.45 - t * 0.25, 0.45); }` },
      { dur: 6, cues: [{ t: 0.1, fx: 'pickup' }],
        setup: `C.quiet(); AZ.npcs.talkToJuno(); C.card('<div class="lower" style="--c:#2f9a64"><b>JUNO HALE</b><span>Engineer. Last one awake. Has been living on the ceiling.</span></div>');`,
        frame: `(t) => { const j = AZ.npcs.juno.position; C.orbit(j.x, 1.4, j.z, C.lerp(1.8, 1.35, t / 6), 0.1, 0.9 + t * 0.2, 1.36); }` },
      { dur: 4.5, cues: [{ t: 0.1, fx: 'pickup' }, { t: 0.3, fx: 'blip', args: [988, 0.1] }],
        setup: `C.quiet(); AZ.npcs.hint(); C.card('<div class="lower" style="--c:#e0a818"><b>TICK</b><span>A drone Ren built at nine. Your hint system. Never judgy.</span></div>');`,
        frame: `(t) => { const k = AZ.npcs.tick.position; C.orbit(k.x, k.y, k.z, 1.3, 0.15, 2.5 + t * 0.4); }` },
      { dur: 5.5, cues: [{ t: 0.1, fx: 'pickup' }, { t: 0, state: 'PHYSICAL' }],
        setup: `C.quiet(); AZ.facts.set('archive_open'); AZ.player.place([0, 0.86, -17.5, 0]); AZ.enterRoom('archive'); AZ.director.use('custodian'); C.card('<div class="lower" style="--c:#1f9a86"><b>THE CUSTODIAN</b><span>Keeper of the archive. A hologram that believes only evidence.</span></div>');`,
        frame: `(t) => { C.orbit(0, 1.5, -20.5, 3.0, 0.4, 0.4 + t * 0.3, 1.5); }` },
      { dur: 5.5, cues: [{ t: 0.1, fx: 'pickup' }, { t: 3, fx: 'alert' }],
        setup: `C.quiet(); AZ.player.place([-18, 0.86, 6, ${PI / 2}]); AZ.enterRoom('hall'); AZ.observer.sightRange = 0; AZ.observer.pos.set(-31, 0, 2.5); AZ.observer.mode = 'pause'; AZ.observer.timer = 99; AZ.observer.lookTarget = { x: -26, z: 6 }; C.card('<div class="lower" style="--c:#4fa8d8"><b>THE OBSERVER</b><span>It learns how you hide, how you run, which laws you use.</span></div>');`,
        frame: `(t) => { AZ.observer.suspicion = t < 2 ? 0 : t < 4 ? 0.6 : 0; AZ.observer.mode = t > 4 && t < 5 ? 'chase' : 'pause'; AZ.observer.timer = 99; C.orbit(-31, 1.6, 2.5, 5, 0.8, 1.2 + t * 0.25, 2); }` },
      { dur: 4.5, cues: [{ t: 0.1, fx: 'pickup' }, { t: 0.1, state: 'INVERTED' }],
        setup: `C.quiet(); AZ.observer.mode = 'patrol'; AZ.facts.set('shard_touch', 2); AZ.facts.set('other_gone', false); AZ.player.place([0.9, 0.86, 24.2, 0]); AZ.enterRoom('antechamber'); AZ.world.props.other.position.set(0, 4.4, 20.2); C.card('<div class="lower" style="--c:#7a5fd0"><b>THE OTHER</b><span>Stands upside down. Knows your name. Is you, one cycle later.</span></div>');`,
        frame: `(t) => { C.cam(-2.7, 2.2 + t * 0.08, 23.0 - t * 0.12, 0, 3.5, 20.2); }` },
      { dur: 4, cues: [{ t: 0.2, fx: 'chime' }],
        setup: `C.quiet(); C.vessel(${SEED}); C.play({ deck: 7, sector: 3, idx: 0 }, { laws: false }); const lv = AZ.level; const rid = lv.order.find((r) => lv.rooms[r].kind === 'verdict'); AZ.enterRoom(rid, true); C.card('<h1>THE <span>CREW</span></h1><p>Generated for every vessel: names, faces, costumes, secrets.</p>', 'big');`,
        frame: `(t) => { const it = AZ.level.interactables.find((i) => i.kind === 'chair'); C.orbit(it.pos[0], 1.5, it.pos[2], 6.5, 1.8, t * 0.25, 1.0); }` },
      ...[0, 1, 2].map((k) => ({
        dur: 5, cues: [{ t: 0.1, fx: 'pickup' }],
        setup: `C.vessel(${SEED}); const deck = [0, 3, 5][${k}]; const w = C.find((r) => r.kind === 'encounter', [deck, 0]); C.play(w, { laws: false }); const n = AZ.deckWorld.npcs[0]; n.talkT = 5; AZ.hud.say(n.n.lines.slice(0, 1), AZ.facts); const c = n.crew; C.card('<div class="lower" style="--c:' + c.color + '"><b>' + c.name.toUpperCase() + '</b><span>' + c.role + ' &middot; deck ' + (c.deck + 1) + (n.n.hologram ? ' &middot; only an echo remains' : ' &middot; still alive') + '</span></div>');`,
        frame: `(t) => { const m = AZ.deckWorld.npcs[0].model; if (C.a0 === undefined || t === 0) C.a0 = m.rotation.y; const a = C.a0 - 0.35 + t * 0.14; AZ.player.model.visible = false; AZ.npcs.tick.visible = false; AZ.player.place([m.position.x + Math.sin(a) * 2.2, 0.86, m.position.z + Math.cos(a) * 2.2, 0]); C.orbit(m.position.x, 1.42, m.position.z, C.lerp(1.9, 1.35, t / 5), 0.12, a, 1.38); }`,
      })),
      { dur: 3.5, cues: [{ t: 0, state: 'PHYSICAL' }, { t: 0.2, fx: 'chime' }],
        setup: `C.quiet(); AZ.player.model.visible = true; C.card('<h1>AFTER<span>ZERO</span></h1><p>Every room has rules. Every character remembers.</p>', 'big');`,
        frame: `(t) => { const m = AZ.deckWorld.npcs[0].model.position; C.orbit(m.x, 1.5, m.z, 4, 0.8, t * 0.3, 1.2); }` },
    ],
  },
};

FILMS.phone = { title: 'AFTERZERO-phone-gameplay', phone: true, shots: FILMS.gameplay.shots.slice(4).map((sh, i) => (i === 0 ? { ...sh, setup: 'AZ.hud.show(null); AZ.paused = false; AZ.menu = null; ' + sh.setup } : sh)) };

async function record(film, browser) {
  const dir = path.join(OUT, film.title + '_frames');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  // phone films: a 20:9 landscape touch screen, so the touch controls are what you see
  const ctx = film.phone
    ? await browser.newContext({ viewport: { width: 960, height: 432 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })
    : await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${server.address().port}/index.html`);
  await page.waitForTimeout(1500);
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.evaluate(HELPERS);
  await page.evaluate(async () => { C.gen = await import('./js/gen/LevelGen.js'); });
  await page.addStyleTag({ content: '*{backdrop-filter:none!important}#card{transition:none!important}#objective,#crosshair,#zoombtns{display:none!important}' + (film.title.includes('characters') ? '#minimap{display:none!important}' : '') }); // trailers: keep the frame clean
  await page.evaluate((q) => { AZ.captureMode(); AZ.audio.start = () => {}; AZ.started = true; AZ.saveTo = () => {}; AZ.changeSetting('quality', q); AZ.changeSetting('minimap', true); }, process.env.QUALITY || 'medium');
  // every spoken line is logged with its time; the voices are rendered offline afterwards
  await page.evaluate(() => {
    window.__lines = [];
    window.__clock = 0;
    AZ.voice.speak = () => {};
    AZ.voice.enabled = true;
    Object.defineProperty(AZ.voice, 'available', { get: () => true });
    const orig = AZ.hud.onLine;
    AZ.hud.onLine = (who, line) => {
      orig(who, line);
      if (line && line.text) window.__lines.push({ t: window.__clock, who, text: line.text, voice: line.voice || null, name: line.name || null });
    };
  });
  let frame = 0, clock = 0;
  const cues = [];
  for (const [i, shot] of film.shots.entries()) {
    console.log(`  ${film.title}: shot ${i + 1}/${film.shots.length}`);
    for (const c of shot.cues || []) cues.push({ ...c, t: c.t + clock });
    await page.evaluate((src) => (0, eval)(src), `for (const k of ['_a','_b','_c','_d','_e','_f','_g','_h','_i']) delete AZ[k];` + shot.setup);
    const n = Math.round(shot.dur * FPS);
    for (let f = 0; f < n; f++) {
      const skip = STILLS && f !== Math.floor(n * 0.6);
      await page.evaluate(([src, t, dt, skip, clk]) => { window.__clock = clk; (0, eval)(src)(t); AZ.tickFrame(dt, skip); C.touchUi(); }, [shot.frame, f / FPS, 1 / FPS, skip, clock + f / FPS]);
      if (skip) continue;
      await page.screenshot({ path: path.join(dir, String(frame++).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 88 });
    }
    clock += shot.dur;
  }
  if (STILLS) { fs.writeFileSync(path.join(OUT, film.title + '.lines.json'), JSON.stringify(await page.evaluate(() => window.__lines), null, 1)); await ctx.close(); console.log(`  stills in ${dir}${errors.length ? '  page errors: ' + errors.join(' | ') : ''}`); return; }
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
  const lines = await page.evaluate(() => window.__lines);
  const linesPath = path.join(OUT, film.title + '.lines.json');
  fs.writeFileSync(linesPath, JSON.stringify(lines, null, 1));
  await ctx.close();
  const mp4 = path.join(OUT, film.title + '.mp4');
  const fade = `afade=t=in:d=0.8,afade=t=out:st=${Math.max(0, clock - 1.2)}:d=1.2`;
  let audioArgs = ['-i', wav, '-af', fade];
  if (KOKORO && lines.length) {
    // voice every line, then duck the music under the voices
    const vox = path.join(OUT, film.title + '.voice.wav');
    execFileSync('python3', [path.join(path.dirname(fileURLToPath(import.meta.url)), 'voice-lines.py'), linesPath, vox, KOKORO], { stdio: 'inherit' });
    audioArgs = ['-i', wav, '-i', vox, '-filter_complex',
      `[1:a]aresample=32000,${fade}[m];[2:a]aresample=32000,apad,asplit[v1][v2];[m][v1]sidechaincompress=threshold=0.015:ratio=6:attack=20:release=450[d];[d][v2]amix=inputs=2:normalize=0:duration=first[a]`,
      '-map', '0:v', '-map', '[a]'];
  }
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, '%05d.jpg'), ...audioArgs,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', mp4]);
  console.log(`  wrote ${mp4} (${clock}s, ${frame} frames)${errors.length ? '  page errors: ' + errors.join(' | ') : ''}`);
  return mp4;
}

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
for (const [key, film] of Object.entries(FILMS)) if (WHICH === 'all' || WHICH === key) await record(film, browser);
await browser.close();
server.close();
