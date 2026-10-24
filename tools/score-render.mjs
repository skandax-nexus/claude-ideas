// THE LAST VERSION OF EARTH: the score, rendered offline to WAV so a person can listen to it without playing the game
// (nothing in a build container can play sound to a listener). In headless Chromium, an OfflineAudioContext runs the
// game's own Synth and Score (score.js, themes.js): each act's theme in a mission of that act, a place in its three
// years, the character themes, and the cues (the chapter cards, a mission's card, the Zero Second, a reveal, a cliff,
// the three endings). Each is measured as it renders (peak, loudness, how much of it is silence, the notes the composer
// played and on what, and whether the tune is heard over what plays under it: at each note, its own pitch against the
// eleven semitones round it) and written as a WAV, with a page of players.
//
//   NODE_PATH=$(npm root -g) node tools/score-render.mjs <out dir> [seconds=36] [--only=name,name]
//
// writes <out>/<name>.wav (stereo, 32 kHz, 16-bit), <out>/score.json and <out>/score.html. Exit status 1 if a render is
// silent, clips (a peak at full scale), buries its tune (its own pitch not among the two strongest at 60% of its notes)
// or fails.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'game');
const out = process.argv[2];
if (!out) { console.log('usage: node tools/score-render.mjs <out dir> [seconds] [--only=a,b]'); process.exit(2); }
const SECS = +(process.argv.find((a) => /^\d+$/.test(a)) || 36);
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
fs.mkdirSync(out, { recursive: true });

// what is rendered: a mission's music in a year (its region and theme, as the game plays it), or a cue on its own
const ITEMS = [
  { name: 'title-main-theme', title: true, label: 'The title: AFTERZERO Main Theme' },
  { name: 'm01-kai-2049', mission: 'm01', year: 'PRESENT', label: 'Mission 1, Rain City in 2049: Kai, The Need to Fix It (the Prologue)' },
  { name: 'm01-kai-2026', mission: 'm01', year: 'PAST', label: 'Mission 1, the same place in 2026: the same tune, plucked' },
  { name: 'm01-kai-2196', mission: 'm01', year: 'FUTURE', label: 'Mission 1, the same place in 2196: the same tune, on strings' },
  { name: 'm04-past', mission: 'm04', year: 'PRESENT', label: 'Mission 4, the settlement: The Past (Act I)' },
  { name: 'm09-war-loop', mission: 'm09', year: 'PRESENT', label: 'Mission 9, Loop City: Nine-Minute War (Act II)' },
  { name: 'm13-war', mission: 'm13', year: 'PRESENT', label: 'Mission 13, the war zone: Nine-Minute War in 7/8 against 4/4' },
  { name: 'm11-mira', mission: 'm11', year: 'PRESENT', label: 'Mission 11, the hospital: Mira, Memory Without a Body' },
  { name: 'm12-witness', mission: 'm12', year: 'PRESENT', label: 'Mission 12, Helix: The Witness' },
  { name: 'm14-2196', mission: 'm14', year: 'FUTURE', label: 'Mission 14, 2196: Beautiful Catastrophe (Act III)' },
  { name: 'm16-museum', mission: 'm16', year: 'PRESENT', label: 'Mission 16, the museum: the other themes as exhibits' },
  { name: 'm19-unwritten', mission: 'm19', year: 'PRESENT', label: 'Mission 19, outside time: The Unwritten Second (Act IV)' },
  { name: 'm23-final', mission: 'm23', year: 'PRESENT', label: 'The Finale: Afterzero, Final Choice' },
  ...['prologue', 'act1', 'act2', 'act3', 'act4', 'finale'].map((ch) => ({ name: `cue-chapter-${ch}`, cue: 'chapter', opts: { chapter: ch }, secs: 9, label: `The chapter card: ${ch}` })),
  { name: 'cue-card-m11', cue: 'card', mission: 'm11', secs: 8, label: 'A mission\'s card (Mission 11: Mira\'s theme\'s first bar)' },
  { name: 'cue-zero', cue: 'zero', mission: 'm01', secs: 8, label: 'The Zero Second (over Rain City\'s music)', music: true },
  { name: 'cue-reveal', cue: 'reveal', mission: 'm08', secs: 7, label: 'A reveal' },
  { name: 'cue-cliff', cue: 'cliff', mission: 'm03', secs: 10, label: 'A cliffhanger' },
  { name: 'cue-ending-A', cue: 'ending:A', mission: 'm23', secs: 14, label: 'Ending A, The Fixed World: the only full major cadence' },
  { name: 'cue-ending-B', cue: 'ending:B', mission: 'm23', secs: 16, label: 'Ending B, The Infinite War: two keys a tritone apart' },
  { name: 'cue-ending-C', cue: 'ending:C', mission: 'm23', secs: 20, label: 'Ending C, Afterzero: reduced, a bloom, a breath, one note' },
].filter((it) => !ONLY.length || ONLY.includes(it.name));

const PAGE = `<!doctype html><meta charset="utf-8"><script type="module">
import { Synth } from './js/audio/Synth.js';
import { Score } from './js/editions/lastversion/score.js';
window.render = async (it, secs) => {
  const sr = 32000;
  const oc = new OfflineAudioContext(2, Math.round(sr * secs), sr);
  const synth = new Synth(oc);
  const facts = { get: () => null };
  const rt = { g: { audio: synth, facts, voice: null }, inv: null, wallaLines: () => [], chapter: it.opts?.chapter || null };
  const score = new Score(rt);
  if (it.mission) score.enter({ mkey: it.mission, key: it.mission }, it.year || 'PRESENT', null);
  else score.title();
  score.setBeds([]); // (the music alone: no rain, wind or walla)
  if (it.cue) score.cue(it.cue, it.opts || {});
  if (!it.cue || it.music) {
    let t = it.cue ? 0.02 : 0.1, n = 0;
    while (t < secs - 2.5) t += Math.max(0.05, score.step(synth, n++, t));
  }
  const buf = await oc.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  let peak = 0, sum = 0, quiet = 0, frames = 0, nan = 0;
  const win = Math.round(sr * 0.05);
  for (let i = 0; i < L.length; i += win) {
    let s = 0;
    for (let j = i; j < Math.min(L.length, i + win); j++) {
      const a = L[j], b = R[j];
      if (!Number.isFinite(a) || !Number.isFinite(b)) { nan++; continue; }
      peak = Math.max(peak, Math.abs(a), Math.abs(b));
      s += a * a + b * b;
    }
    sum += s;
    frames++;
    if (Math.sqrt(s / (2 * win)) < 0.001) quiet++;
  }
  const pcm = new Int16Array(L.length * 2);
  for (let i = 0; i < L.length; i++) {
    pcm[2 * i] = Math.max(-32767, Math.min(32767, Math.round((L[i] || 0) * 32767)));
    pcm[2 * i + 1] = Math.max(-32767, Math.min(32767, Math.round((R[i] || 0) * 32767)));
  }
  let bin = '';
  const u8 = new Uint8Array(pcm.buffer);
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  const notes = score.played;
  // is the tune heard? At each note the composer played, the energy of its pitch (its fundamental and octave, over the
  // quarter second after it starts) against the eleven semitones round it: the share of notes whose own pitch is the
  // strongest of the twelve, and among the two strongest (a legato tune's last note still rings as the next begins; a
  // tune buried under its accompaniment scores low on both)
  const goertzel = (x, from, n, f) => {
    const w = (2 * Math.PI * f) / sr, c = 2 * Math.cos(w);
    let s1 = 0, s2 = 0;
    for (let i = from; i < from + n && i < x.length; i++) { const s0 = x[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * (i - from)) / (n - 1))) + c * s1 - s2; s2 = s1; s1 = s0; } // (Hann-windowed)
    return s1 * s1 + s2 * s2 - c * s1 * s2;
  };
  const mono = new Float32Array(L.length);
  for (let i = 0; i < L.length; i++) mono[i] = 0.5 * (L[i] + R[i]);
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
  let top1 = 0, top2 = 0, judged = 0;
  for (const nt of notes) {
    if (nt.t == null || nt.t + 0.3 > secs) continue;
    const from = Math.round((nt.t + 0.03) * sr), n = Math.round(0.25 * sr);
    const e = [];
    for (let k = -6; k < 6; k++) e.push({ k, v: goertzel(mono, from, n, mf(nt.midi + k)) + goertzel(mono, from, n, 2 * mf(nt.midi + k)) });
    e.sort((a, b) => b.v - a.v);
    judged++;
    if (e[0].k === 0) top1++;
    if (e[0].k === 0 || e[1].k === 0) top2++;
  }
  return {
    sr, secs, peak: +peak.toFixed(4), rms: +Math.sqrt(sum / (2 * L.length)).toFixed(4), silent: +(quiet / frames).toFixed(3), nan,
    theme: score.themeKey, region: score.regionKey, quotes: score.quotes,
    notes: notes.length, instruments: [...new Set(notes.map((x) => x.ins))], themes: [...new Set(notes.map((x) => x.theme))],
    tune: notes.filter((x) => x.t != null).map((x) => [+x.t.toFixed(3), x.midi, x.ins]), heard: judged ? { notes: judged, strongest: +(top1 / judged).toFixed(2), top2: +(top2 / judged).toFixed(2) } : null, b64: btoa(bin),
  };
};
window.ready = true;
</script>`;

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/__score.html') return res.writeHead(200, { 'content-type': 'text/html' }).end(PAGE);
  const p = path.join(root, u);
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
await page.route('**/*', (route) => {
  const h = new URL(route.request().url()).hostname;
  return h === 'localhost' || h === '127.0.0.1' ? route.continue() : route.abort();
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://localhost:${server.address().port}/__score.html`);
await page.waitForFunction(() => window.ready, null, { timeout: 60000 });

const wav = (b64, sr) => {
  const data = Buffer.from(b64, 'base64');
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 4, 28);
  h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
};
const rows = [];
let bad = 0;
for (const it of ITEMS) {
  const secs = it.secs || SECS;
  const r = await page.evaluate(([x, s]) => window.render(x, s), [it, secs]).catch((e) => ({ err: e.message.split('\n')[0] }));
  if (r.err) { bad++; console.log(`FAIL ${it.name}: ${r.err}`); rows.push({ ...it, err: r.err }); continue; }
  fs.writeFileSync(path.join(out, `${it.name}.wav`), wav(r.b64, r.sr));
  delete r.b64;
  const why = [];
  if (r.peak < 0.01 || r.rms < 0.002) why.push('silent');
  if (r.peak >= 0.999) why.push(`clips (peak ${r.peak})`);
  if (r.nan) why.push(`${r.nan} samples not finite`);
  if (r.heard && r.heard.notes >= 5 && r.heard.top2 < 0.6) why.push(`the tune is buried (its own pitch among the two strongest at ${Math.round(r.heard.top2 * 100)}% of its notes)`);
  if (why.length) bad++;
  rows.push({ ...it, ...r, why });
  const tune = r.heard ? ` tune heard: ${Math.round(r.heard.strongest * 100)}% strongest, ${Math.round(r.heard.top2 * 100)}% top two of ${r.heard.notes}` : '';
  console.log(`${why.length ? 'FAIL' : 'ok  '} ${it.name.padEnd(20)} ${secs}s peak ${r.peak.toFixed(3)} rms ${r.rms.toFixed(4)} silent ${(r.silent * 100).toFixed(0)}% ${r.notes} notes on ${r.instruments.join('/')} (${r.themes.join(', ')})${tune}${why.length ? ' ' + why.join('; ') : ''}`);
}
await browser.close();
server.close();
fs.writeFileSync(path.join(out, 'score.json'), JSON.stringify({ seconds: SECS, rows, errors }, null, 1));
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
fs.writeFileSync(path.join(out, 'score.html'), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Score renders</title>
<style>body{font:15px system-ui,sans-serif;margin:16px;max-width:880px;background:#f5f4f0;color:#222}li{margin:10px 0}small{color:#555}audio{width:100%;max-width:520px;display:block}</style>
<h1>THE LAST VERSION OF EARTH: the score, rendered</h1><p>Each clip is the game's own Synth and Score run in an OfflineAudioContext: the written themes (themes.js) played by the composer (score.js), music only.</p>
<ol>${rows.map((r) => `<li><b>${esc(r.label)}</b><br><small>${r.err ? esc(r.err) : `${r.secs} s · peak ${r.peak} · ${r.notes} notes on ${esc(r.instruments.join(', '))}`}</small><audio controls preload="none" src="${r.name}.wav"></audio></li>`).join('')}</ol>`);
if (errors.length) console.log('page errors:', [...new Set(errors)].join(' | '));
console.log(`${rows.length} rendered, ${bad} failed -> ${out}`);
process.exit(bad || errors.length ? 1 : 0);
