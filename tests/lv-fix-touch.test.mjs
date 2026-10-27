// v2.1 playtest fixes, unit "touch": touch controls, HUD readability and phone layout.
//   FT-01: the causal anchor by touch (an ANCHOR button while Kai carries something from another year, the CARRYING
//     label, a tip the first times it is needed); acts-1-2 F08 / acts-3 F12: the prompt and REVERSE act on a tap, and a
//     drag that starts on them turns the view; acts-1-2 F11 / SYS-10: REVERSE's chip and label name what is held, and
//     say why a light thing outlasts the charge; acts-1-2 F09 / acts-3 F07: the place label follows the quarter;
//     FT-19: the case board opens on the questions; FT-20: a prompt fades out with its words; FT-09 / FT-16: tips and
//     YEAR greyed before the Chronolith; and the layout rules the browser checks measured (SYS-03/04/05/08/12/13/15, X-01,
//     acts-3 F10/F11/F14).
//   node --test tests/lv-fix-touch.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Input } from '../game/js/ui/Input.js';
import { HUD } from '../game/js/ui/HUD.js';
import { Tips } from '../game/js/ui/Tips.js';
import { Inversion } from '../game/js/editions/lastversion/inversion.js';
import { LastVersion, MISSIONS, ORDER } from '../game/js/editions/lastversion/Runtime.js';
import { LV } from '../game/js/editions/lastversion/index.js';
import { FactStore } from '../game/js/core/FactStore.js';
import { RealityEngine } from '../game/js/core/RealityEngine.js';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const CSS = read('../game/css/style.css');
const HTML = read('../game/index.html');

// --- a minimal DOM: elements with listeners and classes, enough for Input, HUD and Tips ------------------------------
function el(tag = 'div') {
  const ls = {};
  const cls = new Set();
  return {
    tag, ls, style: {}, textContent: '', offsetWidth: 0, children: {},
    classList: { add: (c) => cls.add(c), remove: (...c) => c.forEach((x) => cls.delete(x)), contains: (c) => cls.has(c), toggle: (c, on = !cls.has(c)) => (on ? cls.add(c) : cls.delete(c), on) },
    addEventListener(t, f) { (ls[t] ||= []).push(f); },
    fire(t, e) { for (const f of ls[t] || []) f({ type: t, preventDefault() {}, stopPropagation() {}, ...e }); },
    querySelector(s) { return this.children[s] || null; },
  };
}
const touch = (id, x, y) => ({ changedTouches: [{ identifier: id, clientX: x, clientY: y }] });

test('FT-01 / F08 / F12: a tap-only control fires on a still tap, and a drag from it turns the view instead', () => {
  const input = Object.assign(Object.create(Input.prototype), { look: { dx: 0, dy: 0 }, touchSensitivity: 0.0065, activity() {} });
  const b = el('button');
  let fired = 0;
  input.tapOrLook(b, () => fired++);
  // a tap that wanders a few pixels (a thumb) still taps, on touchend
  b.fire('touchstart', touch(7, 600, 300));
  assert.equal(fired, 0, 'nothing on touchstart');
  assert.ok(b.classList.contains('down'));
  b.fire('touchmove', touch(7, 606, 303));
  b.fire('touchend', touch(7, 606, 303));
  assert.equal(fired, 1, 'a still tap fires on touchend');
  assert.equal(input.look.dx, 0, 'and turns nothing');
  // a drag: the view turns by the whole drag (from where it landed), and nothing fires
  b.fire('touchstart', touch(8, 600, 300));
  for (let k = 1; k <= 6; k++) b.fire('touchmove', touch(8, 600 - k * 15, 300));
  b.fire('touchend', touch(8, 510, 300));
  assert.equal(fired, 1, 'a drag never fires the control');
  assert.ok(Math.abs(input.look.dx - (-90 * 0.0065)) < 1e-9, `the view turned by the whole drag (${input.look.dx})`);
  assert.ok(!b.classList.contains('down'));
  // a cancelled touch fires nothing
  b.fire('touchstart', touch(9, 600, 300));
  b.fire('touchcancel', touch(9, 600, 300));
  assert.equal(fired, 1);
  assert.ok(Input.TAP_SLOP >= 8 && Input.TAP_SLOP <= 16);
  // a scripted touch with no touch list (the bot's new Event('touchstart') then 'touchend') is a tap too
  b.fire('touchstart', {});
  b.fire('touchend', {});
  assert.equal(fired, 2);
});

test('FT-01: the markup has an ANCHOR touch button; the prompt, the CARRYING label and ANCHOR act on a tap', () => {
  assert.match(HTML, /<button id="prompt" data-act="use" data-tap>/);
  assert.match(HTML, /<div id="held" data-act="anchor" data-tap><\/div>/);
  assert.match(HTML, /<button data-act="anchor" data-tap class="b anchor"[^>]*>.*<span>ANCHOR<\/span><\/button>/);
  // hidden but in THE LAST VERSION while an echo thing is in hand; above the look zone; labelled when anchored
  assert.match(CSS, /#buttons \.anchor \{ display: none; \}/);
  assert.match(CSS, /body\.lastversion\.touch\.lvcarry #buttons \.b\.anchor \{ display: flex;/);
  assert.match(CSS, /body\.lastversion\.touch\.lvcarry #held \{ pointer-events: auto; z-index: 3;/);
  assert.match(CSS, /body\.lastversion\.lvanchored #buttons \.b\.anchor span::after \{ content: "ANCHORED";/);
  // the case board says how too
  const inv = Object.assign(Object.create(Inversion.prototype), { g: { facts: { get: (k) => k === 'has_chronolith' } } });
  assert.match(inv.abilitiesHtml(), /The ANCHOR button \(or the CARRYING label\) shows while you carry one/);
});

// --- Tips: the anchor's tip and button state, THINK's and the CASE board's one-time tips ------------------------------
function tipsWorld() {
  const nodes = { '#buttons .anchor': el('button'), '#dock .hint': el('button'), '#dock .journal': el('button') };
  const body = el('body');
  globalThis.document = { body, querySelector: (s) => nodes[s] || null };
  const toasts = [];
  const facts = new FactStore();
  facts.set('has_chronolith');
  const items = { keycard: { id: 'keycard', label: 'KEYCARD (2026)', echo: true }, plain: { id: 'plain', label: 'A NOTE' } };
  const g = {
    started: true, mode: 'deck', campaign: { lv: true }, facts, held: null, touch: true, settings: {}, menu: null,
    edition: { anchored: null, lastObjective: 'Open the control room.', cinema: { active: false } },
    hud: { toastT: 0, storyTalking: false, toast(t, ms) { toasts.push(t); this.toastT = ms / 1000; } },
    heldItem() { return items[this.held] || null; },
  };
  const tips = new Tips(g);
  const run = (secs, dt = 0.25) => { for (let t = 0; t < secs; t += dt) { g.hud.toastT = Math.max(0, g.hud.toastT - dt); tips.update(dt); } };
  return { g, tips, run, toasts, body, nodes };
}

test('FT-01 / FT-16: the HUD classes: lvcarry with an echo thing in hand, lvanchored, lvnoyear before the Chronolith', () => {
  const { g, run, body, nodes } = tipsWorld();
  run(0.5);
  assert.ok(!body.classList.contains('lvcarry') && !body.classList.contains('lvnoyear'));
  g.held = 'plain';
  run(0.5);
  assert.ok(!body.classList.contains('lvcarry'), 'a thing of this year needs no anchor');
  g.held = 'keycard';
  run(0.5);
  assert.ok(body.classList.contains('lvcarry') && !body.classList.contains('lvanchored'));
  assert.ok(nodes['#buttons .anchor'].classList.contains('lvteach'), 'ANCHOR glows until it has been used once');
  g.edition.anchored = 'keycard';
  g.facts.set('anchored_once');
  run(0.5);
  assert.ok(body.classList.contains('lvanchored'));
  assert.ok(!nodes['#buttons .anchor'].classList.contains('lvteach'));
  g.facts.set('has_chronolith', false);
  run(0.5);
  assert.ok(body.classList.contains('lvnoyear') && !body.classList.contains('lvcarry'), 'no Chronolith: YEAR greyed, no anchor');
  // outside THE LAST VERSION's play nothing is set
  g.started = false;
  run(0.5);
  assert.ok(!body.classList.contains('lvnoyear'));
});

test('FT-01: the anchor tip comes each time an unanchored thing from another year comes into hand, until Kai has anchored once', () => {
  const { g, run, toasts } = tipsWorld();
  g.settings.tips = { think: true, case: true };
  g.held = 'keycard';
  run(1);
  assert.equal(toasts.length, 1);
  assert.match(toasts[0], /CAUSAL ANCHOR.*KEYCARD \(2026\) comes apart when the year changes.*Tap ANCHOR first, then YEAR/);
  run(10);
  assert.equal(toasts.length, 1, 'once per pickup');
  g.held = null;
  run(1);
  g.held = 'keycard';
  run(1);
  assert.equal(toasts.length, 2, 'again when it is taken again (it came apart)');
  g.facts.set('anchored_once');
  g.held = null;
  run(1);
  g.held = 'keycard';
  run(5);
  assert.equal(toasts.length, 2, 'never once Kai has anchored');
  // a toast already up goes first, briefly; on a keyboard it says C
  const k = tipsWorld();
  k.g.touch = false;
  k.g.settings.tips = { think: true, case: true };
  k.g.hud.toastT = 10;
  k.g.held = 'keycard';
  k.run(1.5);
  assert.equal(k.toasts.length, 0);
  k.g.hud.toastT = 10;
  k.run(2);
  assert.equal(k.toasts.length, 1);
  assert.match(k.toasts[0], /Press C to anchor it first/);
});

test('FT-09: THINK\'s tip after 45 s stuck on one objective, the CASE board\'s at the first evidence; once per device', () => {
  const { g, tips, run, toasts, nodes } = tipsWorld();
  run(30);
  g.edition.lastObjective = 'Something new.'; // progress: the clock starts again
  run(30);
  assert.equal(toasts.length, 0);
  g.hud.storyTalking = true; // (time in a conversation is not time stuck)
  run(30);
  assert.equal(toasts.length, 0);
  g.hud.storyTalking = false;
  run(20);
  assert.equal(toasts.length, 1);
  assert.match(toasts[0], /^<small>THINK<\/small>.*Tap THINK/);
  assert.ok(nodes['#dock .hint'].classList.contains('lvteach'));
  assert.equal(g.settings.tips.think, true);
  tips.used('hint');
  assert.ok(!nodes['#dock .hint'].classList.contains('lvteach'), 'used: its glow stops');
  g.hud.toastT = 0;
  g.facts.set('ev_receipt');
  run(2);
  assert.equal(toasts.length, 2);
  assert.match(toasts[1], /THE CASE BOARD.*Tap CASE to read it/);
  assert.ok(nodes['#dock .journal'].classList.contains('lvteach'));
  run(11);
  assert.ok(!nodes['#dock .journal'].classList.contains('lvteach'), 'the glow ends by itself');
  // a second device-run with the tips seen: nothing
  const again = tipsWorld();
  again.g.settings.tips = { ...g.settings.tips };
  again.g.facts.set('ev_receipt');
  again.run(120);
  assert.equal(again.toasts.length, 0);
});

// --- the prompt: its words stay while it fades (FT-20); its width is measured once per text (SYS-05) ------------------
test('FT-20 / SYS-05: the prompt fades out with its words, and its width is measured once per new text', () => {
  const p = el('button');
  const txt = el('span');
  p.children['.txt'] = txt;
  let reads = 0;
  Object.defineProperty(p, 'offsetWidth', { get: () => (reads++, 40 + txt.textContent.length * 9) });
  const hud = Object.assign(Object.create(HUD.prototype), { el: { prompt: p } });
  hud.prompt('LOOK AT THE CLOCK');
  assert.ok(p.classList.contains('on'));
  assert.equal(hud.promptWidth(), 40 + 17 * 9);
  hud.promptWidth();
  assert.equal(reads, 1, 'one layout read per text');
  hud.prompt('');
  assert.ok(!p.classList.contains('on'));
  assert.equal(txt.textContent, 'LOOK AT THE CLOCK', 'no bare "TAP ·" while it fades');
  hud.prompt('THE RELAY: THE LINE, OR THE EVIDENCE');
  assert.equal(txt.textContent, 'THE RELAY: THE LINE, OR THE EVIDENCE');
  assert.equal(hud.promptWidth(), 40 + 36 * 9);
  assert.equal(reads, 2);
  // and an empty pill never says TAP; on a phone it wraps inside the screen
  assert.match(CSS, /body\.touch #prompt \.txt:empty::before \{ content: none; \}/);
  assert.match(CSS, /body\.touch #prompt \{ width: max-content; max-width: calc\(100vw - 24px/);
  // main.js clamps the pill's centre by half its measured width, inside the safe area
  const main = read('../game/js/main.js');
  assert.match(main, /const half = Math\.min\(w \/ 2, this\.hud\.promptWidth\(\) \/ 2 \+ 8\);/);
  assert.ok(!/clamp\(\(v\.x \* 0\.5 \+ 0\.5\) \* w, 90, w - 90\)/.test(main), 'the fixed 90 px clamp is gone');
});

// --- REVERSE: the chip and label (SYS-10, acts-1-2 F11) ---------------------------------------------------------------
test('SYS-10 / F11: REVERSE names what it holds; a bolt backing out is named until it is out, never the next one', () => {
  const lock = { rec: { id: 'm11lock', kind: 'lock', label: 'THE LOCK', weight: 1, max: 8, parts: [{ name: 'BAR', rest: { p: [1, 1, 1] } }, { name: 'CRESCENT', rest: { p: [2, 1, 1] } }] } };
  const file = { rec: { id: 'charredFile', label: 'THE CHARRED FILE', weight: 0.5, max: 12, aim: [0, 1, 0] } };
  const crate = { rec: { id: 'crate', label: 'THE CRATE', weight: 1.5, max: 12, aim: [3, 1, 0] } };
  const inv = Object.assign(Object.create(Inversion.prototype), { g: { facts: { get: (k) => k === 'has_inversion' }, campaign: { inv: { charge: 8, cap: 8 } } }, active: null, target: null });
  // aiming at a light thing: one number on the chip (the charge), and the label says why its own is larger
  inv.target = { p: file, part: -1, pos: file.rec.aim };
  let h = inv.hudState();
  assert.equal(h.chip, '⟲ 8s');
  assert.equal(h.label, '⟲ THE CHARRED FILE · LIGHT · 12 s');
  inv.target = { p: crate, part: -1, pos: crate.rec.aim };
  assert.equal(inv.hudState().label, '⟲ THE CRATE · HEAVY · 5 s');
  // holding it: the chip counts, the label names it without a second count
  inv.target = { p: file, part: -1, pos: file.rec.aim };
  inv.active = { p: file, part: -1, t: 1, left: 11.4 };
  h = inv.hudState();
  assert.equal(h.chip, '⟲ THE CHARRED FILE 11.4');
  assert.equal(h.label, '⟲ THE CHARRED FILE · HOLDING');
  assert.ok(h.hold);
  // a bolt backing out while the crosshair finds the next: both name the bolt being held
  inv.active = { p: lock, part: 1, t: 0.5, lock: true };
  inv.target = { p: lock, part: 0, pos: [1, 1, 1] };
  h = inv.hudState();
  assert.equal(h.chip, '⟲ THE LOCK · CRESCENT ');
  assert.equal(h.label, '⟲ THE LOCK · CRESCENT · BACKING OUT');
  assert.deepEqual(h.pos, [2, 1, 1], 'over the bolt being held');
  assert.ok(!h.aim && !h.hold, 'REVERSE dims: a bolt finishes by itself');
  // the unlock says how
  const src = read('../game/js/editions/lastversion/inversion.js');
  assert.match(src, /Aim at something moving and tap ⟲ REVERSE: it runs backwards and holds\. Tap RELEASE to let go\./);
  assert.match(src, /Light things hold longer, heavy ones less\./);
  // the button and the label act on a tap (Input.tapOrLook), the label above the look zone; upright, above YEAR
  assert.match(src, /this\.bindTap\(this\.btn, press\);/);
  assert.match(src, /this\.bindTap\(this\.label, press\);/);
  assert.match(src, /body\.lastversion\.touch #lvTarget \{ pointer-events: auto;[^}]*z-index: 3;/);
  assert.match(src, /@media \(orientation: portrait\) \{ body\.lastversion\.touch #lvRevBtn \{ left: 16px; bottom: 162px; \} \}/);
});

// --- the place label (acts-1-2 F09, acts-3 F07) -------------------------------------------------------------------------
test('F09 / F07: the place label is the quarter Kai is in; a room of its own keeps its name', () => {
  const qs = [{ name: 'THE BATTLEFIELD', area: [0, 0, 1, 1], room: 'out' }, { name: 'THE THREE DEVICES', area: [0, 0, 1, 1], room: 'out' }, { name: 'THE STABILIZER', area: [0, 0, 1, 1], room: 'out' }, { name: 'THE CRANE CAB', room: 'cab' }];
  const rt = Object.assign(Object.create(LastVersion.prototype), { level: { quarters: qs, outdoorRoom: 'out' }, _threads: { on: true, here: 2 }, g: { room: 'out', campaign: { quarter: 1 } } });
  assert.equal(rt.placeLabel({ name: 'THE BATTLEFIELD' }), 'THE STABILIZER');
  rt.threads.here = undefined;
  assert.equal(rt.placeLabel({ name: 'THE BATTLEFIELD' }), 'THE THREE DEVICES', 'before the first check: the saved quarter');
  rt.g.room = 'cab';
  assert.equal(rt.placeLabel({ name: 'CAB' }), 'THE CRANE CAB');
  rt.g.room = 'shed';
  assert.equal(rt.placeLabel({ name: 'THE SHED' }), 'THE SHED');
  rt.threads.on = false;
  rt.g.room = 'out';
  assert.equal(rt.placeLabel({ name: 'THE BATTLEFIELD' }), 'THE BATTLEFIELD');
  assert.match(read('../game/js/main.js'), /this\.edition\.placeLabel\?\.\(room\) \|\| room\.name/);
});

// --- the case board's first view (FT-19) --------------------------------------------------------------------------------
test('FT-19: the case board opens on the questions and the evidence; TRAVEL after them (one line until a mission is done)', () => {
  delete globalThis.document; // (the Tips tests' stand-in: the board renders without a DOM, as lastversion.test.mjs does)
  const engine = new RealityEngine(LV.engineOptions());
  const f = new FactStore();
  f.set('faction', 'neutral');
  const game = { engine, facts: f, story: null, log: [], run: 'prologue', voice: null, campaign: { lv: true, chapter: 'prologue', deck: 0, sector: 0, quarter: 0, flags: {} }, deckWorld: { flags: {} } };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory('prologue');
  rt.chapter = 'prologue';
  rt.level = rt.buildLevel(game.campaign);
  const el = { innerHTML: '', querySelectorAll: () => [], querySelector: () => null };
  rt.renderJournal(game, el);
  const h3 = [...el.innerHTML.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((m) => m[1]);
  assert.deepEqual(h3.slice(0, 3), ['WHERE YOU ARE', 'THE QUESTIONS', 'EVIDENCE']);
  assert.ok(h3.indexOf('TRAVEL') > h3.indexOf('PEOPLE') && h3.indexOf('TRAVEL') < h3.indexOf('CASE LOG'), h3.join(' / '));
  assert.ok(!/No story gates/.test(el.innerHTML), 'no free-roam paragraph before free roam is possible');
  assert.match(el.innerHTML, /Free roam opens once a mission is done/);
  assert.ok(ORDER.length && MISSIONS.prologue.length);
});

// --- the layout the browser checks measured --------------------------------------------------------------------------
test('layout: the because line, the objective plate and safe area, YEAR greyed, dock labels, panels, targets, captions', () => {
  const rt = read('../game/js/editions/lastversion/Runtime.js');
  // FT-07 / SYS-03 / F14: the because line light with the goal's halo, on a dark plate
  assert.match(rt, /body\.lastversion #objective \.lvwhy \{[^}]*color: #e8eef5; text-shadow: var\(--halo\);/);
  assert.match(CSS, /body\.lastversion #objective \{ padding: 6px 10px 7px; border-radius: 12px; background: linear-gradient\(90deg, rgba\(8, 14, 22, 0\.5\)/);
  // SYS-12
  assert.match(CSS, /#objective \{ left: max\(16px, env\(safe-area-inset-left\)\); \}/);
  // FT-16 / SYS-11
  assert.match(CSS, /body\.lastversion\.touch\.lvnoyear #buttons \.b\.shift \{[^}]*opacity: 0\.5;/);
  // FT-09 / SYS-13: the dock labelled, 48 px; upright, a column by the right thumb; SKIP 44 px tall
  assert.match(CSS, /body\.lastversion\.touch #dock \.d span \{ display: block;/);
  assert.match(CSS, /body\.lastversion\.touch #dock \.d \{[^}]*min-width: 56px; min-height: 48px;/);
  assert.match(CSS, /body\.lastversion\.touch #dock \{ top: auto; left: auto; transform: none; right: max\(10px, env\(safe-area-inset-right\)\);[^}]*flex-direction: column;/);
  assert.match(CSS, /body\.lastversion\.touch #lvSkip \{ min-height: 48px;/);
  // SYS-15 / F10: the watchers' meter has an icon and a word
  assert.match(CSS, /body\.lastversion #eye::after \{ content: "WATCHER NEAR";/);
  assert.match(CSS, /body\.lastversion #eye\.alert::after \{ content: "SEEN";/);
  // SYS-08: headers stay; a 'more' cue; a tap beside the panel closes it (main.js)
  assert.match(CSS, /#settings \.panel > header, #saves \.panel > header, #journal \.panel > header[^{]*\{\s*position: sticky; top: -18px;/);
  assert.match(CSS, /\.overlay:not\(#hero\) \.panel\.more::after \{ content: "▾  MORE"; position: sticky;/);
  assert.match(read('../game/js/main.js'), /document\.querySelectorAll\('#settings, #saves, #journal, #laws, #chapters, #map'\)/);
  // SYS-04 / F10: the short landscape title; the ending card's buttons pinned
  assert.match(CSS, /@media \(max-height: 520px\) and \(orientation: landscape\) \{\s*body\.lastversion #title \.panel \{ padding: 12px 16px 10px;/);
  assert.match(CSS, /body\.lastversion #ending #lvTitle \{ position: sticky; bottom: 0;/);
  // acts-3 F11: thumb-sized targets
  assert.match(CSS, /body\.lastversion\.touch #ending \.caseFile button,[^{]*\{\s*min-height: 44px; min-width: 64px; \}/);
  // X-01: a selected option is dark in every settings row
  assert.match(CSS, /\.overlay\.side \.panel \.seg button\.sel:not\(\.chip\):not\(\.install\):not\(\.clear\):not\(\.txtb\) \{ background: var\(--ink\); color: #fff;/);
});
