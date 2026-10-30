// THE LAST VERSION OF EARTH v2.1.1 playtest fixes, unit lv-runtime (docs/lastversion/PLAYTEST-v2.1.1.md): the Chronolith,
// saves and resume, the case board, the post-game, REVERSE's feedback and the score, checked without a browser (the
// browser proofs by touch are listed in docs/lastversion/STATUS.md).
//   H4 the Chronolith holds while the story talks to Kai; M19 an ending is finished once its card is up, and a save
//   taken while it played loads to it again; P20 the Finale's time.
//   node --test tests/fix2-lv-runtime.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { RealityEngine } from '../game/js/core/RealityEngine.js';
import { FactStore } from '../game/js/core/FactStore.js';
import { LV } from '../game/js/editions/lastversion/index.js';
import { LastVersion } from '../game/js/editions/lastversion/Runtime.js';
import { finished } from '../game/js/editions/lastversion/roam.js';
import { NS } from '../game/js/core/Edition.js';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const SRC = read('../game/js/editions/lastversion/Runtime.js');

// a runtime on a stand-in game (no browser): the chapter's story, as the runtime makes it
function runtime(chapter = 'act2', deck = 0, extra = {}) {
  const game = { engine: new RealityEngine(LV.engineOptions()), facts: new FactStore(), story: null, deckWorld: { flags: {} }, ...extra };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory(chapter);
  game.campaign = { lv: true, chapter, deck, sector: 0, quarter: 0, flags: {} };
  return rt;
}

// --- H4: the Chronolith while the story talks ----------------------------------------------------------------------
test('H4: the Chronolith does not drain while the story talks to Kai (a conversation, a scene, narration); a bark, a PA or a THINK hint is not the story', () => {
  // the drain's condition carries the story's lines (as it carries an opening, a cinema and a transition)
  assert.match(SRC, /const draining = out && this\.unstable && !outdoors && !this\.opening && !this\.cinema\?\.active && !g\.transitioning && !ending && !this\.storyLines\(\) && this\.loadHold === false;/);
  // and a snap back is only ever started by the drain
  assert.match(SRC, /if \(draining && this\.stability <= 0 && !g\.catching\) this\.snapBack\(\);/);
  const rt = runtime('act1');
  const line = (o) => ({ who: 'CREW', text: 'x', dur: 3, ...o });
  rt.g.hud = { subT: 0, cur: null, subs: [] };
  assert.equal(rt.storyLines(), false, 'nothing said');
  rt.g.hud = { subT: 2, cur: line(), subs: [line(), line(), { done() {} }] };
  assert.equal(rt.storyLines(), true, 'a conversation, its lines up and waiting');
  rt.g.hud = { subT: 0, cur: null, subs: [line()] };
  assert.equal(rt.storyLines(), true, 'a line waiting is the story still');
  for (const k of ['bark', 'ambient', 'hint']) {
    rt.g.hud = { subT: 2, cur: line({ [k]: true }), subs: [] };
    assert.equal(rt.storyLines(), false, `a ${k} line drains as before`);
  }
});

// --- M19: the ending, saved as finished once it has been seen -------------------------------------------------------
test('M19: the ending is playing from its choice to its card; a save taken meanwhile is not a finished story and loads to the ending again', () => {
  const rt = runtime('finale');
  const f = rt.g.facts;
  rt.start = () => {};
  // the choice tapped: its own set makes it the ending (finale.js), and the runtime marks it playing
  rt.apply({ set: { ending: 'A' }, ending: 'A' }, null);
  assert.equal(f.get('ending'), 'A');
  assert.equal(f.get('ending_playing'), 'A');
  // a save of it: not finished (the slot, the title's CONTINUE, NEW GAME's warning), and it loads to the ending again
  assert.equal(finished(f.facts), false);
  rt.chapter = 'finale';
  assert.equal(rt.endingDone(), null);
  rt.resume({ lv: true, chapter: 'finale', deck: 0, sector: 0, flags: {}, lvFormat: 24 });
  assert.equal(rt.finishedLoad, false, 'not to its card alone');
  assert.equal(rt.endingCut, 'A', 'to the ending again');
  assert.match(SRC, /else if \(resumed && this\.endingCut\) this\.endingAgain\(this\.endingCut\);/);
  // the card up: finished, saved so (endingCard saves), and a load opens the card
  assert.match(SRC, /const show = \(\) => \{\s*g\.facts\.set\('ending_playing', false\);\s*this\.endingCard\(key\);\s*\};/);
  f.set('ending_playing', false);
  assert.equal(finished(f.facts), true);
  assert.equal(rt.endingDone(), 'A');
  rt.resume({ lv: true, chapter: 'finale', deck: 0, sector: 0, flags: {}, lvFormat: 24 });
  assert.equal(rt.finishedLoad, true);
  assert.equal(rt.endingCut, null);
  // a v2.1.1 finished save (no ending_playing) is finished as it was
  const old = new FactStore({ ending: 'C' });
  assert.equal(finished(old.facts), true);
  // only the Finale's save is a finished story (a replay's or a trip's carrying the fact is not)
  assert.equal(rt.endingDone('cases'), null);
});

// --- P20: the Finale's time ----------------------------------------------------------------------------------------
test('P20: the Finale\'s time is stored when its ending begins (it has no gate), so the card shows FINALE', () => {
  assert.match(SRC, /if \(mk && c\?\.mStart != null && !g\.facts\.get\(`time_\$\{mk\}`\)\) g\.facts\.set\(`time_\$\{mk\}`, Math\.max\(0, Math\.round\(\(g\.playTime \|\| 0\) - c\.mStart\)\)\);/);
  const rt = runtime('finale');
  const g = rt.g;
  rt.chapter = 'finale';
  g.playTime = 4000;
  g.campaign.mStart = 3340;
  // ending() with what it needs to run its first steps here
  g.hud = { flash() {}, durFn: null };
  g.audio = { silence() {} };
  g.after = () => {};
  rt.score = { cue() {} };
  rt.hushBarks = () => {};
  rt.ending('A');
  assert.equal(g.facts.get('time_m23'), 660);
  assert.equal(g.facts.get('ending_playing'), 'A');
});

// --- M20-M23, L41: a case replay's end -----------------------------------------------------------------------------
test('M21: a replay leaves for the CASE FILES only once its closing lines and moment are over', () => {
  const rt = runtime('cases', 0);
  const g = rt.g;
  const timers = [];
  g.after = (t, fn) => timers.push(fn);
  let exited = 0;
  rt.exitReached = () => exited++;
  rt.chapter = 'cases';
  rt.cinema = { active: null };
  g.deckWorld.flags.beat_done = true;
  let talking = true;
  rt.storyLines = () => talking;
  rt.autoExit();
  assert.equal(timers.length, 1);
  timers.shift()(); // (autoExit's 1.2 s: the reveal still said)
  assert.equal(exited, 0, 'not under its own lines');
  assert.equal(timers.length, 1, 'it waits on');
  talking = false;
  timers.shift()();
  assert.equal(exited, 1, 'then the case closes');
});

test('M22: a replay closed is recorded with the finished campaign it was opened from; the CASE FILES show it after the next CONTINUE', () => {
  const store = new Map();
  globalThis.window = { localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) } };
  try {
    const fin = { facts: { facts: { ending: 'A' } }, campaign: { lv: true, chapter: 'finale', deck: 0 }, meta: { where: 'THE LAST VERSION · ENDING A: THE FIXED WORLD' } };
    store.set(`${NS}slot.1`, JSON.stringify(fin));
    const rt = runtime('cases', 0);
    rt.g.started = true;
    rt.g.campaign.chapter = 'cases';
    rt.g.facts.set('lv_replay_from', 1);
    assert.equal(rt.caseOrigin(), 1);
    const ninth = { id: 'ninth' };
    assert.equal(rt.recordCase(ninth, 'active'), false, 'only a case resolved or observed');
    assert.ok(rt.recordCase(ninth, 'observed'));
    assert.ok(rt.recordCase(ninth, 'resolved'), 'never lowered');
    const saved = JSON.parse(store.get(`${NS}slot.1`));
    assert.deepEqual(saved.campaign.caseRecord, { ninth: 'observed' });
    assert.deepEqual(saved.facts.facts, { ending: 'A' }, 'the campaign\'s facts are left as they were');
    assert.deepEqual(rt.caseRecord(1), { ninth: 'observed' });
    // a story not finished keeps no record (a replay opened from an ordinary save)
    store.set(`${NS}slot.2`, JSON.stringify({ ...fin, facts: { facts: {} } }));
    rt.g.facts.set('lv_replay_from', 2);
    assert.equal(rt.recordCase(ninth, 'observed'), false);
    // the finished campaign loaded again: its campaign carries the record (a save of it, a trip from it, keep it)
    const fr = runtime('finale', 0);
    fr.g.started = true;
    fr.g.campaign.caseRecord = { ninth: 'observed' };
    assert.deepEqual(fr.caseRecord(fr.caseOrigin()), { ninth: 'observed' });
  } finally {
    delete globalThis.window;
  }
  // the rows take the higher of the facts' state and the record's
  assert.match(SRC, /const st = CASE_ORDER\[Math\.max\(CASE_ORDER\.indexOf\(caseState\(f, c\)\), CASE_ORDER\.indexOf\(rec\[c\.id\] \|\| 'open'\)\)\];/);
  // and the replay hands its origin over the reload, as it hands the facts
  assert.match(SRC, /window\.sessionStorage\.setItem\(CASE_FROM, JSON\.stringify\(from \?\? null\)\);/);
  assert.match(SRC, /g\.facts\.set\('lv_replay_from', from \?\? latestSave\(\)\?\.slot \?\? false\);/);
});

test('M20 / L41 / M23: a closed case lets REVERSE go, holds a closing beat, opens the CASE FILES on its row with a guard; BACK TO THE TITLE asks twice in a game; FREE ROAM travels from the finished save', () => {
  assert.match(SRC, /this\.inv\?\.release\?\.\('done'\);/);
  assert.match(SRC, /g\.hud\.card\('CASE CLOSED', file\.name,/);
  assert.match(SRC, /this\.caseFiles\(null, \{ focus: file\.id, guard: true \}\);/);
  assert.match(SRC, /if \(row\?\.scrollIntoView\) row\.scrollIntoView\(\{ block: 'center' \}\);/);
  assert.match(SRC, /el\?\.classList\.add\('lvguard'\);/);
  assert.match(SRC, /if \(g\.started && g\.confirmTap && !g\.confirmTap\(b\)\) \{\s*b\.textContent = 'TAP AGAIN: BACK TO THE TITLE';/);
  assert.match(SRC, /g\.campaign\.chapter !== 'cases' \? this\.travel\(b\.dataset\.travel, b\.dataset\.year\) : this\.travelFromTitle\(b\.dataset\.travel, b\.dataset\.year, from\)/);
});

test('L41: the garden replay closes on its outcome: 2196, the channel by the garden running', async () => {
  const { CASES } = await import('../game/js/editions/lastversion/cases.js');
  const garden = CASES.find((c) => c.key === 'c_garden');
  assert.equal(garden.close.year, 'FUTURE');
  assert.equal(garden.close.at, 'gardenChannel');
  assert.ok(garden.states.includes('FUTURE'));
  for (const c of CASES.filter((x) => x.key !== 'c_garden')) assert.equal(c.close, null, `${c.key} closes where it is`);
});

// --- P19: a trip after an ending ----------------------------------------------------------------------------------
test('P19: after an ending a trip says the story is over and goes back to the CASE FILES', async () => {
  const { roamMeta } = await import('../game/js/editions/lastversion/roam.js');
  assert.equal(roamMeta({ deck: 20, roam: { year: 'PRESENT', meta: { where: 'THE LAST VERSION · ENDING A: THE FIXED WORLD' } } }, 'PRESENT').chapter, '2049 · after ENDING A: THE FIXED WORLD');
  assert.match(roamMeta({ deck: 6, roam: { year: 'PRESENT', meta: { where: 'THE LAST VERSION · THE BROKEN OBSERVATORY' } } }, 'PRESENT').chapter, /the story waits at THE BROKEN OBSERVATORY$/);
  assert.match(SRC, /this\.storyOver\(\) \? 'BACK TO THE CASE FILES' : 'BACK TO THE STORY'/);
  assert.match(SRC, /The story is over: BACK TO THE CASE FILES on the case board\./);
});

// --- M13, M14: the case board's clues ------------------------------------------------------------------------------
test('M13: every clue a mission pins (an ev_ fact in its data or its code) has words on the case board, never its id; M14: the ash says the burn', async () => {
  const { MISSIONS, evLabel } = await import('../game/js/editions/lastversion/Runtime.js');
  const ids = new Set();
  const add = (k) => { if (typeof k === 'string' && k.startsWith('ev_')) ids.add(k.slice(3)); };
  const node = (n) => {
    if (!n || typeof n !== 'object') return;
    Object.keys(n.set || {}).forEach(add);
    if (n.ev) add(`ev_${n.ev}`);
    (n.choices || []).forEach(node);
    (n.answers || []).forEach(node);
  };
  for (const list of Object.values(MISSIONS)) for (const d of list) {
    for (const q of d.quarters || []) for (const t of [...(q.threads || []), ...(q.sides || []).flatMap((s) => s.threads || [])]) {
      for (const c of String(t.done || '').match(/\bev_\w+/g) || []) add(c);
      Object.keys(t.set || {}).forEach(add);
    }
    Object.values(d.scenes || {}).forEach(node);
    Object.values(d.talks || {}).forEach((ns) => ns.forEach(node));
    Object.values(d.deductions || {}).forEach(node);
    for (const r of [...(d.rules || []), ...(d.zones || [])]) Object.keys(r.set || {}).forEach(add);
  }
  for (const f of ['prologue', 'act1', 'act2', 'act3', 'act4', 'finale', 'processes']) for (const m of read(`../game/js/editions/lastversion/${f}.js`).matchAll(/\bev_([a-z0-9_]+)/g)) ids.add(m[1]);
  assert.ok(ids.size > 190, `${ids.size} clues`);
  const missing = [...ids].filter((k) => !evLabel(k));
  assert.deepEqual(missing, [], 'every clue named');
  for (const k of ids) assert.ok(!/^[a-z0-9_]+$/.test(evLabel(k)), `${k} reads as words`);
  // the board and the pin toast both read them
  assert.match(SRC, /const label = \(k\) => evLabel\(k\) \|\| k\.replace\(\/_\/g, ' '\);/);
  assert.match(SRC, /if \(evLabel\(key\)\) this\.g\.hud\.toast\(`<small>PINNED TO THE CASE BOARD<\/small><br>\$\{evLabel\(key\)\}`, 2600\);/);
  // M14: the ash clue as the first fire says it (the burn is what tells the right answer, "Built, plenty, burned, left.")
  assert.match(evLabel('ash_layers'), /burn/);
  assert.ok(!/nothing/.test(evLabel('ash_layers')));
});

// --- L45: the score's chords --------------------------------------------------------------------------------------
test('L45: every theme\'s every chord, under every layer at every beat, asks only finite notes (a two-note chord threw in Act IV)', async () => {
  const { Score } = await import('../game/js/editions/lastversion/score.js');
  const { THEMES, section } = await import('../game/js/editions/lastversion/themes.js');
  const bad = [];
  const rec = (where) => (...a) => { for (const x of a) if (typeof x === 'number' && !Number.isFinite(x)) bad.push(where); };
  const sc = Object.create(Score.prototype);
  Object.defineProperty(sc, 'a', { value: { osc: rec('osc'), pluck: rec('pluck'), bell: rec('bell') } });
  for (const f of ['strings', 'choir', 'brass', 'flute', 'cello', 'piano', 'glass', 'musicbox', 'noise', 'tick', 'drum', 'metal']) sc[f] = rec(f);
  sc.rand = () => 0.5;
  const synth = { osc: rec('synth') };
  const LAYERS = ['pad', 'strings', 'choir', 'brass', 'revpad', 'flute', 'bass', 'cello', 'sub', 'piano', 'pluck', 'glass', 'bell', 'prepared', 'musicbox',
    'pulse', 'ticks', 'perc', 'drum', 'ostinato', 'alarm', 'beeps', 'clock', 'metal'];
  let chords = 0;
  const roots = [48, 50, 52, 53, 55, 57, 60];
  for (const [key, th] of Object.entries(THEMES)) for (const sk of Object.keys(th.sections || {})) {
    const sec = section(key, sk);
    sec.bars.forEach((bar, bi) => {
      if (!bar.chord) return;
      chords++;
      for (const root of roots) for (let beat = 0; beat < bar.len; beat++) for (const b of [bi, bi + 1]) {
        sc.accompany(LAYERS, { t: 0, sec, bar, bi: b, beat, len: 0.3, barSec: 2.4, root, dest: null, v: 0.05, energy: 0.5, rev: false, synth, irregular: b % 2 === 0 });
      }
    });
  }
  assert.ok(chords > 100, `${chords} chords played`);
  assert.deepEqual([...new Set(bad)], [], 'no non-finite note');
  // the Unwritten Second's two-note chord is one of them
  assert.ok(section('unwritten', 'B').bars.some((b) => b.chord?.length === 2));
});

// --- saves and resume: L8, L9, L10 --------------------------------------------------------------------------------
test('L8: a setback (a catch, a fall, deep water) or a snap drops the anchor: a load starts where it left Kai, not where it caught him', () => {
  const rt = runtime('act1', 4);
  const g = rt.g;
  g.campaign.anchor = { mkey: 'm08', sector: 0, room: 'r', year: 'PRESENT', pos: [0, 1.3, 4.8, 0], cp: [30, 1.06, 12] };
  rt.setbackWhy('caught');
  assert.equal(g.campaign.anchor, undefined);
  assert.match(SRC, /g\.player\.place\(g\.checkpoint\);\s*delete g\.campaign\.anchor;/, 'and the Chronolith\'s snap back');
  assert.match(read('../game/js/main.js'), /const why = this\.edition\?\.setbackWhy\?\.\(kind\) \|\| null;/, 'main asks the edition at every setback');
});

test('L9: a load gives the Chronolith back in full, and it holds until Kai moves or switches the year (a 2026 save at 0.57 let go of Kai 10-13 s after its recap)', () => {
  assert.match(SRC, /if \(resumed && !deck\.roam\) this\.stability = c\.stability = 1;\s*\/\/[^\n]*\n\s*this\.loadHold = resumed && !deck\.roam \? null : false;/);
  assert.match(SRC, /if \(this\.loadHold && Math\.hypot\(p\.x - this\.loadHold\[0\], p\.z - this\.loadHold\[1\]\) > 0\.75\) this\.loadHold = false;/);
  assert.match(SRC, /this\.loadHold = false; \/\/ \(a year switched is play/);
});

test('L8: reaching a checkpoint keeps where Kai stands as the place a load puts him (the anchor then matches the save\'s checkpoint)', () => {
  assert.match(SRC, /if \(this\.cpSeen !== undefined && !g\.catching && !g\.transitioning\) \{\s*this\.markAnchor\(\);\s*g\.dirty = true;\s*\}/);
});

test('L10: a load inside a mission of Acts I and II recaps that mission (three lines each, said from its chapter\'s pack); a chapter still opens on its act\'s', async () => {
  const { PREVIOUSLY } = await import('../game/js/editions/lastversion/ledger.js');
  const { RECAPS } = await import('../game/js/editions/lastversion/recaps.js');
  const { spokenLines } = await import('../game/js/editions/lastversion/voicelines.js');
  const spoken = spokenLines();
  for (const n of [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]) {
    const mk = `m${String(n).padStart(2, '0')}`;
    assert.equal(RECAPS[mk]?.length, 3, `${mk}: three lines`);
    assert.deepEqual(PREVIOUSLY[mk], RECAPS[mk]);
    const ch = n <= 8 ? 'act1' : 'act2';
    for (const t of RECAPS[mk]) assert.ok(spoken.some((e) => e.group === ch && e.who === 'NONE' && e.text === t), `${mk} said from ${ch}: ${t}`);
  }
  assert.ok(!/village three thousand years old/.test(PREVIOUSLY.m13.join(' ')), 'mid-Mission 13 is not the act\'s opening');
  // a load picks the mission's own; a chapter's start, its act's
  assert.match(SRC, /const \[k\] = this\.previouslySteps\(this\.chapter, PREVIOUSLY\[mk\] \? mk : null\);/);
  assert.match(SRC, /if \(first && this\.chapter !== 'prologue'\) steps\.push\(\.\.\.this\.previouslySteps\(this\.chapter\)\);/);
});

// --- L11, L18 ------------------------------------------------------------------------------------------------------
test('L11: a fall and deep water say what took Kai back; L18: the gate says nothing is unfinished when Kai stands at the thing still open', () => {
  const rt = runtime('act3', 0);
  const g = rt.g;
  g.player = { pos: { x: -41, y: 0.5, z: 65 } };
  Object.defineProperty(rt, 'level', { value: { outdoorRoom: 'r', drowns: [{ box: [-50, -12, 60, -30, 1.2, 70], when: '@FUTURE', room: 'r' }] }, configurable: true });
  g.engine.setAvailable('r', ['PRESENT', 'PAST', 'FUTURE']);
  g.engine.setState('r', 'FUTURE', { force: true });
  assert.match(rt.setbackWhy('fall'), /TOO DEEP/);
  g.engine.setState('r', 'PRESENT', { force: true });
  assert.match(rt.setbackWhy('fall'), /A FALL/, 'the same spot in a dry year is a fall');
  assert.equal(rt.setbackWhy('caught'), null, 'a catch says its own line');
  assert.equal(rt.setbackWhy('hit'), null);
  assert.match(SRC, /if \(at && p && Math\.hypot\(at\[0\] - p\.x, at\[2\] - p\.z\) < 12\) return;\s*if \(!this\.gateWarned\) this\.say/);
});

// --- L24, L25, L26: REVERSE's feedback -------------------------------------------------------------------------------
test('L24: a thing REVERSE holds is read from where it is held; L25: the tap acts on the bolt the label names; L26: every weight named, the stability cost said', async () => {
  const { Inversion } = await import('../game/js/editions/lastversion/inversion.js');
  // L24: the held file's READ prompt reaches as far as the hold does; nothing else does
  const rt = runtime('act2', 2);
  const file = { rec: { id: 'charredFile', reach: 14 } };
  rt.inv = { active: { p: file } };
  assert.equal(rt.focusReach({ id: 'deck:p_charredFile', r: 2.2 }), 14);
  assert.equal(rt.focusReach({ id: 'deck:p_other', r: 2.2 }), 2.2);
  rt.inv = { active: null };
  assert.equal(rt.focusReach({ id: 'deck:p_charredFile', r: 2.2 }), 2.2, 'not held: as before');
  assert.match(read('../game/js/main.js'), /if \(d > \(this\.edition\?\.focusReach\?\.\(c\) \?\? c\.r\)\) continue;/);
  // L25: the shown bolt is the one tapped
  const lock = { rec: { id: 'm11lock', kind: 'lock', label: 'THE LOCK', weight: 1, max: 8, parts: [{ name: 'BAR', order: 2 }, { name: 'CRESCENT', order: 1 }] }, partOut: [false, false] };
  let started = null;
  const inv = Object.assign(Object.create(Inversion.prototype), {
    g: { started: true, menu: null, paused: false, mode: 'deck', campaign: { lv: true }, facts: { get: (k) => k === 'has_inversion' } }, rt: {}, active: null,
    target: { p: lock, part: 1, pos: [0, 0, 0] }, findTarget: () => ({ p: lock, part: 0, pos: [0, 0, 0] }), start: (t) => (started = t),
  });
  inv.press();
  assert.equal(started.part, 1, 'CRESCENT, as the label said, not BAR found a moment later');
  // L26: a medium weight is named; the case board says a hold costs the Chronolith
  const med = { rec: { id: 'door', label: 'THE ANNEX DOOR', weight: 1, max: 8, aim: [0, 1, 0] } };
  const inv2 = Object.assign(Object.create(Inversion.prototype), { g: { facts: { get: () => true }, campaign: { inv: { charge: 8, cap: 8 } } }, active: null, target: { p: med, part: -1, pos: [0, 1, 0] } });
  assert.equal(inv2.hudState().label, '⟲ THE ANNEX DOOR · MEDIUM · 8 s');
  const INV = read('../game/js/editions/lastversion/inversion.js');
  assert.match(INV, /In an unstable place a hold drains the Chronolith too: watch its meter\./);
  assert.match(INV, /In an unstable place a hold drains the Chronolith too\.<ul class="rules">/);
});
