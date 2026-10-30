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
