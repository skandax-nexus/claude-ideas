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
  assert.match(SRC, /const draining = out && this\.unstable && !outdoors && !this\.opening && !this\.cinema\?\.active && !g\.transitioning && !ending && !this\.storyLines\(\);/);
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
