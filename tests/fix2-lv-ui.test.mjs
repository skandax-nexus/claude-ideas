// THE LAST VERSION OF EARTH v2.1.1 playtest fixes, unit lv-ui (docs/lastversion/PLAYTEST-v2.1.1.md): the phone's UI,
// controls and HUD, checked here without a browser (the browser proofs by touch are in docs/lastversion/STATUS.md).
//   M1 YEAR picks a year in a place with three; M2 a look-drag never skips a line; M3 Comfort mode stops every flash;
//   L1 settings 44 px; L2 the prompt clear of the objective; L3 SKIP never over a menu; L4 a pause during cinematics;
//   L5 a place with one year says so; L6 a finished story's slot says what a new game loses; L7 CASE FILES and FREE ROAM;
//   L28 the map's water and ways by year; P1 no empty year pill; P2 the dock hidden in talks; P12 the REVERSE label clear
//   of the use prompt; P13 the because line whole; P14 a double tap opens a panel once; P15 ANCHOR's empty-hands line
//   once; P17 named people clear of the camera.
//   node --test tests/fix2-lv-ui.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { RealityEngine } from '../game/js/core/RealityEngine.js';
import { FactStore } from '../game/js/core/FactStore.js';
import { HUD } from '../game/js/ui/HUD.js';
import { MiniMap } from '../game/js/ui/MiniMap.js';
import { LastVersion } from '../game/js/editions/lastversion/Runtime.js';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const CSS = read('../game/css/style.css');
const MAIN = read('../game/js/main.js');
const CINEMA = read('../game/js/editions/lastversion/cinema.js');
const RUNTIME = read('../game/js/editions/lastversion/Runtime.js');
const INV = read('../game/js/editions/lastversion/inversion.js');

// a Runtime with just what its verbs read: the facts, the years engine, a HUD that records, the sounds
function rt({ states = ['PRESENT', 'PAST', 'FUTURE'], chrono = true } = {}) {
  const facts = new FactStore();
  if (chrono) facts.set('has_chronolith');
  const engine = new RealityEngine({ slots: 0, unlocked: 0, laws: [], states: ['PRESENT', 'PAST', 'FUTURE'], baseline: 'PRESENT', residue: 'PAST' });
  engine.setAvailable('r', states);
  const said = [], toasts = [], denied = [];
  const g = {
    facts, engine, room: 'r', time: 0, settings: { comfort: false }, log: [],
    hud: { toast: (t) => toasts.push(t), flash() {}, toastT: 0 }, audio: { deny: () => denied.push(1), sweep() {}, chime() {} },
    heldItem: () => null,
  };
  const r = Object.assign(Object.create(LastVersion.prototype), { g, inv: null, label: (s) => ({ PRESENT: '2049', PAST: '2026', FUTURE: '2196' })[s] });
  r.say = (l) => said.push(l);
  r.home = () => 'PRESENT';
  r.yearPick = { opened: 0, toggle() { this.opened++; }, close() {} };
  return { r, g, said, toasts, denied };
}

test('M1: YEAR opens the picker where the place has three years, and switches where it has two; a picked year is gone to straight', () => {
  const a = rt();
  a.r.yearButton();
  assert.equal(a.r.yearPick.opened, 1, 'three years: the picker');
  assert.equal(a.g.engine.state('r'), 'PRESENT', 'the picker opening changes nothing');
  a.r.shift('FUTURE');
  assert.equal(a.g.engine.state('r'), 'FUTURE', 'from 2049 to 2196 directly');
  a.r.shift('PAST');
  assert.equal(a.g.engine.state('r'), 'PAST', 'and back to 2026 without passing 2049 (the M12 gangway)');
  const b = rt({ states: ['PRESENT', 'PAST'] });
  b.r.yearButton();
  assert.equal(b.r.yearPick.opened, 0);
  assert.equal(b.g.engine.state('r'), 'PAST', 'two years: one tap switches, as Q does');
  // the touch YEAR button asks for 'year' (main.js -> yearButton); Q stays 'shift'
  assert.match(MAIN, /else if \(a === 'year'\) \(this\.edition\?\.yearButton \? this\.edition\.yearButton\(\) : this\.shift\(\)\);/);
  assert.match(RUNTIME, /for \(const el of document\.querySelectorAll\('#buttons \.shift'\)\) el\.dataset\.act = 'year';/);
});

test('L5: a place with one year: YEAR greyed (ONE YEAR), a tap says why, once while the toast shows, over another toast', () => {
  const a = rt({ states: ['PRESENT'] });
  a.g.hud.toastT = 2; // ('Memory restored.' up: the reason still shows)
  a.r.yearButton();
  assert.equal(a.toasts.length, 1);
  assert.match(a.toasts[0], /Only one year here: the year cannot change\./);
  assert.equal(a.denied.length, 1);
  a.r.yearButton();
  assert.equal(a.toasts.length, 1, 'a second tap at once: the buzz, not the toast again');
  a.g.time = 3;
  a.r.yearButton();
  assert.equal(a.toasts.length, 2, 'later, said again');
  assert.equal(a.g.engine.state('r'), 'PRESENT');
  assert.match(CSS, /body\.lastversion\.touch\.lvoneyear #buttons \.b\.shift span::after \{ content: "ONE YEAR";/);
});

test('P15: ANCHOR with empty hands says its line once, then only the buzz for 8 s', () => {
  const a = rt();
  for (let i = 0; i < 6; i++) a.r.anchor();
  assert.equal(a.said.length, 1);
  assert.equal(a.denied.length, 6);
  a.g.time = 8.5;
  a.r.anchor();
  assert.equal(a.said.length, 2);
});

test('M3: Comfort mode stops every flash: the HUD\'s tint, the lightning, the stage effects, a flickering figure, the year switch', () => {
  const classes = [];
  const h = Object.assign(Object.create(HUD.prototype), { el: { tint: { style: {}, classList: { add: (c) => classes.push(c), remove() {} }, offsetWidth: 0 } } });
  h.comfort = true;
  h.flash('rgba(255,255,255,0.95)');
  assert.deepEqual(classes, [], 'no flash with Comfort on, whoever asks (the story\'s own up to 95% white)');
  h.comfort = false;
  h.flash('#fff');
  assert.ok(classes.includes('flash'));
  assert.match(MAIN, /this\.hud\.comfort = !!s\.comfort;\s*if \(this\.weather\) this\.weather\.comfort = !!s\.comfort;/);
  assert.match(read('../game/js/world/Weather.js'), /this\.flash = this\.comfort \? 0 : 1;/);
  const fx = read('../game/js/editions/lastversion/stagefx.js');
  assert.match(fx, /this\.flare = this\.calm \? 0 :/);
  assert.match(fx, /&& !this\.calm \? \(1 - f \/ 0\.9\) \* 0\.9 : 0;/);
  assert.match(CINEMA, /fx\.calm = !!this\.g\.settings\?\.comfort;/);
  assert.match(RUNTIME, /if \(n\.n\.flicker\) n\.model\.userData\.setOpacity\?\.\(g\.settings\.comfort \? 0\.7 :/);
  // every hud.flash in the edition goes through HUD.flash (no other way to the tint)
  for (const f of fs.readdirSync(new URL('../game/js/editions/lastversion/', import.meta.url)).filter((x) => x.endsWith('.js'))) {
    assert.doesNotMatch(read(`../game/js/editions/lastversion/${f}`), /el\.tint|#tint/, f);
  }
});

test('M2: a staged moment\'s line is skipped by a tap that lifts where it landed, never by a look-drag', () => {
  assert.match(CINEMA, /const TAP_SLOP = 12, TAP_MS = 700;/);
  assert.match(CINEMA, /window\.addEventListener\('pointermove', \(e\) => \{\s*if \(down && e\.pointerId === down\.id && Math\.hypot\(e\.clientX - down\.x, e\.clientY - down\.y\) > TAP_SLOP\) down = null;/);
  assert.match(CINEMA, /if \(Math\.hypot\(e\.clientX - d\.x, e\.clientY - d\.y\) > TAP_SLOP \|\| performance\.now\(\) - d\.t > TAP_MS\) return;\s*this\.skip\(\);/);
  assert.doesNotMatch(CINEMA, /window\.addEventListener\('pointerdown', skip, true\)/, 'the old skip on the first touch is gone');
});

test('L3, L4, P2: a pause button in cinematics and talks; SKIP and it never over a menu; the dock hidden in a talk, ink labels', () => {
  assert.match(CINEMA, /body\.lastversion\.menu #lvSkip, body\.lastversion\.menu #lvPause \{ display: none !important; \}/);
  assert.match(CINEMA, /body\.lastversion\.lvcine #lvPause, body\.lastversion\.talking #lvPause \{ display: flex; \}/);
  assert.match(CINEMA, /width: 48px; height: 48px;/);
  assert.match(CINEMA, /body\.lastversion\.talking #stickzone #stick,\s*body\.lastversion\.talking #dock \{\s*opacity: 0 !important;/);
  assert.match(CSS, /body\.lastversion\.touch #dock \.d \{ color: var\(--ink\); \}/);
});

test('P14: a second toggle of the panel just opened (350 ms) does not close it again', () => {
  assert.match(MAIN, /this\.menuOpenT = typeof performance !== 'undefined' \? performance\.now\(\) : 0;/);
  assert.match(MAIN, /const fresh = this\.menu && typeof performance !== 'undefined' && performance\.now\(\) - \(this\.menuOpenT \|\| 0\) < 350;/);
  assert.match(MAIN, /if \(this\.menu === a\) \{ if \(!fresh\) this\.closeMenu\(\); \}/);
});

test('L1, P1, P13: settings 44 px on a phone; no empty year pill; the because line not clamped', () => {
  assert.match(CSS, /body\.lastversion\.touch #settings \.seg button \{ min-height: 44px;/);
  assert.match(CSS, /body\.lastversion\.touch #settings \.setting input\[type=range\] \{ height: 44px; \}/);
  assert.match(CSS, /body\.lastversion\.calm #state:not\(\.on\) \{ opacity: 0; \}/);
  assert.doesNotMatch(RUNTIME, /#objective \.lvwhy \{[^}]*line-clamp/);
});

test('L2: the prompt is placed below the objective card when it would cover it; the card\'s box is read once per change', () => {
  let reads = 0;
  const el = { classList: { contains: (c) => c === 'on' }, getBoundingClientRect: () => { reads++; return { left: 16, right: 263, top: 102, bottom: 185, height: 83 }; } };
  const h = Object.assign(Object.create(HUD.prototype), { el: { objective: el } });
  assert.deepEqual(h.objectiveBox(), { left: 16, right: 263, top: 102, bottom: 185 });
  h.objectiveBox();
  assert.equal(reads, 1, 'cached');
  h.objectiveChanged();
  h.objectiveBox();
  assert.equal(reads, 2);
  assert.match(MAIN, /const ob = this\.hud\.objectiveBox\?\.\(\);\s*if \(ob && x \+ half > ob\.left && x - half < ob\.right && y - 46 < ob\.bottom && y > ob\.top\) y = Math\.min\(h - 60, Math\.round\(ob\.bottom \+ 52\)\);/);
});

test('L6: a new game over a finished story says what it loses, and the row is scrolled into view', () => {
  const r = Object.create(LastVersion.prototype);
  assert.match(r.slotLoss({ facts: { facts: { ending: 'A' } } }), /its ending, CASE FILES and free roam are lost/);
  assert.equal(r.slotLoss({ facts: { facts: {} } }), null);
  assert.match(MAIN, /this\.edition\?\.slotLoss\?\.\(data\) \|\| 'Tap again to replace this save with a new game';\s*b\.scrollIntoView\?\.\(\{ block: 'center', behavior: 'smooth' \}\);/);
});

test('L7: FREE ROAM lists the years in one order, 2026 2049 2196, and the mission\'s name only where it is not the place\'s', () => {
  const r = Object.create(LastVersion.prototype);
  const row = (o) => ({ key: 'm18', n: 18, mission: 'THE FRACTURE', placeName: 'THE FRACTURE', years: ['FUTURE', 'PAST', 'PRESENT'], names: { PAST: '2026', PRESENT: '2049', FUTURE: '2196' }, sides: 0, fragments: 0, ...o });
  const html = r.travelRows([row(), row({ key: 'm19', n: 19, mission: 'THE PLACE OUTSIDE TIME', placeName: 'THE UNWRITTEN SECOND' })], undefined, null, 'div');
  const years = [...html.matchAll(/data-year="(\w+)"/g)].map((m) => m[1]);
  assert.deepEqual(years, ['PAST', 'PRESENT', 'FUTURE', 'PAST', 'PRESENT', 'FUTURE']);
  assert.match(html, /<b>THE FRACTURE<\/b> <small>Mission 18<\/small>/, 'not THE FRACTURE Mission 18 · THE FRACTURE');
  assert.match(html, /Mission 19 &middot; THE PLACE OUTSIDE TIME/);
  // CASE FILES on a phone held sideways: compact columns
  assert.match(CSS, /body\.lastversion #ending \.caseFiles \{ grid-template-columns: repeat\(auto-fill, minmax\(250px, 1fr\)\);/);
});

test('L28: the map draws a place\'s deep water in its year, wading ways under it, raised ways over it, a year\'s lines only then', () => {
  // the Runtime's water: level.drowns whose year holds now
  const a = rt();
  const level = { outdoorRoom: 'r', drowns: [{ box: [-7, -12, -110, 7, 1.4, 67], when: '@FUTURE', room: 'r' }, { box: [0, -12, 0, 1, 1, 1], when: null }] };
  assert.deepEqual(a.r.mapWater(level), [[0, 0, 1, 1]], 'in 2049 only the water of every year');
  a.g.engine.setState('r', 'FUTURE');
  assert.deepEqual(a.r.mapWater(level), [[-7, -110, 7, 67], [0, 0, 1, 1]]);
  // MiniMap: what is drawn, in order
  const ops = [];
  let fill = '';
  const g = { set fillStyle(v) { fill = v; }, get fillStyle() { return fill; }, strokeStyle: '', lineWidth: 1, font: '', textAlign: '',
    fillRect: (x, y, w, h) => ops.push(['rect', fill, Math.round(x), Math.round(y)]), fillText: (t) => ops.push(['text', t]),
    beginPath() {}, roundRect() {}, rect() {}, fill() {}, stroke() {}, setLineDash() {}, moveTo() {}, lineTo() {}, arc() {} };
  const mm = new MiniMap(null, null);
  mm.visited.add('d');
  let year = 'FUTURE';
  const map = {
    rooms: [{ id: 'd', rect: [-50, -50, 50, 50], name: 'THE TOWERS', kind: 'district' }],
    water: () => (year === 'FUTURE' ? [[-7, -50, 7, 50]] : []),
    shows: (w) => (w === '@FUTURE' ? year === 'FUTURE' : w === '!@FUTURE' ? year !== 'FUTURE' : true),
    lines: [{ kind: 'wade', rect: [-11, -50, -7, 50], when: '@FUTURE' }, { kind: 'wade', rect: [-7, 10, 7, 14], name: 'CROSSING', when: '@FUTURE' },
      { kind: 'deck', rect: [28, -50, 35, 50] }, { kind: 'deck', rect: [28, -5, 35, 5], when: '!@FUTURE' }],
  };
  mm.drawWorld(g, map, 'd', 1, 0, 0, 0, 0, true);
  const kinds = ops.filter((o) => o[0] === 'rect').map((o) => o[1]);
  const W = 'rgba(58,128,200,0.72)', WADE = 'rgba(150,205,235,0.9)', DECK = 'rgba(120,104,92,0.9)';
  assert.deepEqual(kinds, [WADE, WADE, W, DECK], '2196: the wading ways, then the deep water over them, then the viaduct (its fallen span not drawn)');
  const texts = ops.filter((o) => o[0] === 'text').map((o) => o[1]);
  assert.deepEqual(texts, ['CROSSING', 'THE TOWERS'], 'names after the water: the crossing\'s, then the room\'s');
  ops.length = 0;
  year = 'PRESENT';
  mm.drawWorld(g, map, 'd', 1, 0, 0, 0, 0, true);
  assert.deepEqual(ops.filter((o) => o[0] === 'rect').map((o) => o[1]), [DECK, DECK], '2049: no water, no wading; the whole viaduct');
  assert.deepEqual(ops.filter((o) => o[0] === 'text').map((o) => o[1]), ['THE TOWERS']);
  // the key names only what the open map draws
  assert.match(RUNTIME, /<span class="lg lvwater" style="display:none">Deep water<\/span><span class="lg lvwade" style="display:none">Wading<\/span><span class="lg lvdeck" style="display:none">Raised way<\/span>/);
  assert.match(RUNTIME, /if \(level\.map\) level\.map\.shows = \(when\) => g\.facts\.test\(when, g\.engine\.state\(level\.outdoorRoom \|\| g\.room\)\);/);
});

test('P12: the REVERSE label goes clear of the use prompt when the thing to use stands on the process', () => {
  assert.match(INV, /if \(Math\.abs\(x - px\) < \(this\.labelW \+ pw\) \/ 2 && lBot > py - ph && lTop < py\) \{\s*y = py - ph - 6 \+ Math\.round\(0\.5 \* lh\);\s*if \(y - 1\.5 \* lh < 8\) y = Math\.round\(py \+ 6 \+ 1\.5 \* lh\);/);
  // the label's box after the move never meets the pill's (pill: py-46..py; label: y-1.5lh..y-0.5lh)
  for (const py of [60, 120, 200, 300]) {
    const ph = 46, lh = 30;
    let y = py - ph - 6 + Math.round(0.5 * lh);
    if (y - 1.5 * lh < 8) y = Math.round(py + 6 + 1.5 * lh);
    const lTop = y - 1.5 * lh, lBot = y - 0.5 * lh;
    assert.ok(lBot <= py - ph || lTop >= py, `pill at ${py}`);
  }
});

test('P17: someone Kai can talk to is not drawn while the game\'s own camera is inside them; in a shot or a talk they are', () => {
  const dw = read('../game/js/world/DeckWorld.js');
  assert.match(dw, /const named = talker && !!g\.edition && !g\.player\?\.cinema;/);
  assert.match(dw, /\} else if \(talker && n\.camHid\) this\.clearOfCamera\(n, false\);/);
});
