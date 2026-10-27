// v2.1 playtest fixes, unit "flow": the post-game flow, saves and resume (docs/lastversion/PLAYTEST-v2.1.md).
//   acts-3 F01: the title's CASE FILES leave no menu open when a replay or a trip starts in the page;
//   acts-3 X2: a finished campaign loads to its ending's card; F18: a case file by its number ("Case fourteen", CASE
//   14 OF 14), the title's button after a reload says what it starts; acts-1-2 F05: an opening cut by a save is marked
//   and plays again; acts-3 F06, FT-11, SYS-06: a load at the place Kai last did something (when it still stands as it
//   did), a checkpoint reached saved, the app's background saving; SYS-09, acts-1-2 F06: REVERSE given only once the
//   story reaches the thread that teaches it, and for watching the thing from where it shows; FT-14: Mission 2's
//   PREVIOUSLY, and no snap line once the next place's fade began.
// The browser checks of the same, by touch at phone size, are tests/lv-fix-flow.mjs.
//   node --test tests/lv-fix-flow.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { RealityEngine } from '../game/js/core/RealityEngine.js';
import { FactStore } from '../game/js/core/FactStore.js';
import { LV } from '../game/js/editions/lastversion/index.js';
import { LastVersion, MISSIONS, CASE_SLOT } from '../game/js/editions/lastversion/Runtime.js';
import { CASES, CASE_FILES } from '../game/js/editions/lastversion/cases.js';
import { PREVIOUSLY } from '../game/js/editions/lastversion/ledger.js';
import { missionCardLines } from '../game/js/editions/lastversion/voicelines.js';
import { factOf } from '../game/js/editions/lastversion/Threads.js';

const SRC = fs.readFileSync(new URL('../game/js/editions/lastversion/Runtime.js', import.meta.url), 'utf8');
const fixture = (f) => JSON.parse(fs.readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8'));

// a runtime on a stand-in game (no browser): the chapter's story, a level of a mission built as the runtime builds it
function runtime(chapter = 'act2', deck = 0, extra = {}) {
  const game = { engine: new RealityEngine(LV.engineOptions()), facts: new FactStore(), story: null, deckWorld: { flags: {} }, ...extra };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory(chapter);
  game.campaign = { lv: true, chapter, deck, sector: 0, quarter: 0, flags: {} };
  return rt;
}

// --- F18: a case file by its number ------------------------------------------------------------------------------------
test('F18: every replay has its CASE FILES number (1-14), named so on its card, its spoken title and the menus', () => {
  const nos = CASES.map((c) => c.no);
  assert.equal(new Set(nos).size, CASES.length, 'each its own number');
  for (const c of CASES) {
    assert.equal(CASE_FILES[c.no - 1].key, c.key, `${c.key} is case ${c.no} in the CASE FILES`);
    assert.ok(typeof c.n === 'string', `${c.key} keeps its letter (old saves)`);
  }
  const record = CASES.find((c) => c.key === 'c_record');
  assert.equal(record.no, 14);
  assert.equal(missionCardLines(record)[0].text, 'Case fourteen. The Unwritten Record.');
  assert.equal(missionCardLines(CASES.find((c) => c.key === 'c_b'))[0].text, 'Case three. The Water That Remembers.');
  // the card's kicker, the chapter list, the save's chapter (no more "CASE N")
  assert.match(SRC, /CASE \$\{deck\.no \?\? deck\.n\}\$\{deck\.no \? ` OF \$\{CASE_FILES\.length\}` : ''\}/);
  assert.match(SRC, /'Case ' \+ \(m\.no \?\? m\.n\)/);
  assert.match(SRC, /`Case \$\{d\?\.no \?\? d\?\.n\}`/);
  // the missions keep "Mission four." as they were
  assert.equal(missionCardLines(MISSIONS.act1[0])[0].text.split('.')[0], 'Mission four');
});

// --- F01: no menu left open --------------------------------------------------------------------------------------------
test('F01: a replay or a trip started from the title\'s CASE FILES closes them first; a chapter never starts under a title menu', () => {
  // (the CASE FILES are the 'ending' menu: main.frame steps only with no menu open, and begin() in this page left it)
  assert.match(SRC, /if \(!g\.started\) g\.menu = null;\s*g\.begin\(`lv:cases\//);
  assert.match(SRC, /g\.menu = null; \/\/ \(the CASE FILES close as the trip starts in this page[^\n]*\n\s*g\.begin\('load', latest\.slot\)/);
  // start() itself, for any other way in
  const rt = runtime();
  rt.g.menu = 'ending';
  rt.ownLook = () => {};
  rt.waitForCast = () => 'waiting';
  rt.start('act2'); // (the cast is not here: it waits, after the menu is closed)
  assert.equal(rt.g.menu, null);
  rt.g.menu = 'pause';
  try { rt.start('act2', null, true); } catch { /* (the rest of start() needs the browser's world: the menu is decided before it) */ }
  assert.equal(rt.g.menu, 'pause', 'a pause opened while the cast came is left alone');
});

// --- X2: a finished campaign -------------------------------------------------------------------------------------------
test('X2: a finished campaign loads to its ending\'s card; a case replay\'s save or a trip\'s does not', () => {
  const rt = runtime('finale');
  rt.start = () => {};
  rt.g.facts.set('ending', 'C');
  rt.resume({ lv: true, chapter: 'finale', deck: 0, sector: 0, flags: {}, lvFormat: 24 });
  assert.equal(rt.finishedLoad, true);
  for (const chapter of ['cases', 'roam']) {
    rt.resume({ lv: true, chapter, deck: 0, sector: 0, flags: {}, lvFormat: 24, roam: { back: { campaign: { chapter: 'finale' } } } });
    assert.equal(rt.finishedLoad, false, chapter);
  }
  rt.g.facts.set('ending', false);
  rt.resume({ lv: true, chapter: 'finale', deck: 0, sector: 0, flags: {}, lvFormat: 24 });
  assert.equal(rt.finishedLoad, false, 'the Finale before its choice loads as it was');
  // its save says what it is
  rt.g.facts.set('ending', 'C');
  rt.chapter = 'finale';
  const meta = rt.saveMeta();
  assert.match(meta.where, /^THE LAST VERSION · ENDING C: AFTERZERO$/);
  // the card waits for begin() to have closed every panel (a microtask), and the loaded save's PREVIOUSLY is not played
  assert.match(SRC, /else if \(resumed && this\.finishedLoad\) this\.postGame\(\);\s*else if \(resumed\) this\.previously\(\);/);
  assert.match(SRC, /queueMicrotask\(open\)/);
  // the playtest's finished save is one
  const end = fixture('lv-flow-endC.json');
  assert.equal(end.facts.facts.ending, 'C');
  assert.equal(end.campaign.chapter, 'finale');
});

// --- acts-1-2 F05: an opening cut by a save ----------------------------------------------------------------------------
test('acts-1-2 F05: an opening marks the save until it is over (with its rooms\' own years); a load replays it', () => {
  // (Mission 12's cold open is shot in 2196: the rooms' own years are kept with the mark)
  assert.equal(MISSIONS.act2.find((m) => m.key === 'm12').coldOpen.year, 'FUTURE');
  assert.match(SRC, /camp\.opening = \{ mkey: deck\.mkey, home \};/);
  assert.match(SRC, /const finish = \(\) => \{\s*this\.hideCard\(\);\s*this\.opening = null;\s*delete camp\.opening;/);
  assert.match(SRC, /const cut = resumed && c\.opening\?\.mkey === deck\.mkey && !this\.finishedLoad \? c\.opening : null;/);
  assert.match(SRC, /if \(cut\) \{\s*for \(const \[r, y\] of Object\.entries\(cut\.home \|\| \{\}\)\)/);
  // a new mission starts with no mark and no anchor of the last one
  assert.match(SRC, /if \(intro\) \{\s*g\.held = null;\s*delete c\.opening;\s*delete c\.anchor;/);
});

// --- FT-11, SYS-06, acts-3 F06: where a load puts Kai ------------------------------------------------------------------
function anchorRig() {
  const rt = runtime('prologue', 0);
  const g = rt.g;
  const placed = [];
  g.room = 'm01_rain_south';
  g.checkpoint = [12.2, 1.01, -2, 0];
  g.player = { pos: { x: -20.5, y: 1.0, z: -40.25 }, H: { x: 0, z: -1 }, grounded: true, gravity: -1, place: (p) => placed.push(p) };
  g.engine.setAvailable(g.room, ['PRESENT', 'PAST', 'FUTURE']);
  g.engine.setState(g.room, 'PRESENT', { force: true });
  rt.level = { place: true };
  return { rt, g, placed };
}
test('FT-11 / SYS-06: where Kai stood when the story moved is kept, and a load puts him there while it still stands', () => {
  const { rt, g, placed } = anchorRig();
  rt.markAnchor();
  const a = g.campaign.anchor;
  assert.deepEqual(a.pos.slice(0, 3), [-20.5, 1, -40.25]);
  assert.deepEqual(a.cp, [12.2, 1.01, -2]);
  assert.equal(a.year, 'PRESENT');
  assert.equal(a.room, 'm01_rain_south');
  assert.equal(a.mkey, 'm01');
  // a load from the same checkpoint, the room in the same year: there
  g.campaign.pos = [12.2, 1.01, -2, 0];
  assert.equal(rt.toAnchor(), true);
  assert.deepEqual(placed.pop().slice(0, 3), [-20.5, 1, -40.25]);
  assert.ok(rt.anchorWatch && rt.anchorWatch.t > 0, 'and a fall from it, in the first seconds, goes to the checkpoint');
  // not when the checkpoint is a later one, the room is in another year, or it is another mission's or room's
  g.campaign.pos = [10.8, 1.01, -78, 0];
  assert.equal(rt.toAnchor(), false, 'a checkpoint reached after it');
  g.campaign.pos = [12.2, 1.01, -2, 0];
  g.engine.setState(g.room, 'PAST', { force: true });
  assert.equal(rt.toAnchor(), false, 'the room in another year');
  g.engine.setState(g.room, 'PRESENT', { force: true });
  g.room = 'elsewhere';
  assert.equal(rt.toAnchor(), false, 'another room');
  g.room = 'm01_rain_south';
  g.campaign.anchor = { ...a, mkey: 'm02' };
  assert.equal(rt.toAnchor(), false, 'another mission');
  assert.equal(placed.length, 0);
});
test('FT-11 / SYS-06: a load that finds Kai falling from his anchor puts him at the checkpoint; the watch waits out the card', () => {
  const { rt, g, placed } = anchorRig();
  rt.anchorWatch = { y: 1, t: 3 };
  rt.opening = { previously: true };
  rt.cinema = { active: true };
  for (let i = 0; i < 50; i++) rt.anchorStep(0.1); // (5 s of the PREVIOUSLY card: not counted)
  assert.ok(rt.anchorWatch, 'still watched once the card is over');
  rt.opening = null;
  rt.cinema = { active: false };
  g.player.pos.y = -2; // (the platform he stood on is down again)
  rt.anchorStep(0.1);
  assert.deepEqual(placed.pop(), g.checkpoint);
  assert.equal(rt.anchorWatch, null);
  // standing: 3 s of play, then no more watching
  rt.anchorWatch = { y: 1, t: 3 };
  g.player.pos.y = 1;
  for (let i = 0; i < 31; i++) rt.anchorStep(0.1);
  assert.equal(rt.anchorWatch, null);
  assert.equal(placed.length, 0);
  assert.match(SRC, /this\.anchorStep\(dt\);\s*this\.watchStep\(dt\);/);
});
test('FT-11 / SYS-06: no anchor in the air, during a catch, a transition or an opening', () => {
  for (const [what, set] of [['in the air', (g) => { g.player.grounded = false; }], ['a catch', (g) => { g.catching = true; }], ['a transition', (g) => { g.transitioning = true; }], ['a load restoring', (g) => { g.restoring = true; }], ['an opening', (g, rt) => { rt.opening = {}; }]]) {
    const { rt, g } = anchorRig();
    set(g, rt);
    rt.markAnchor();
    assert.equal(g.campaign.anchor, undefined, what);
  }
  // the facts that move it: a thread done, evidence, a fragment (never a thread's _paid mark)
  assert.match(SRC, /if \(v && \/\^\(t_\|ev_\|fr_\)\/\.test\(k\) && !k\.endsWith\('_paid'\)\) this\.markAnchor\(\);/);
});
test('SYS-06: a checkpoint reached is saved; the app sent to the background saves, but never while the page unloads', () => {
  assert.match(SRC, /if \(g\.checkpoint !== this\.cpSeen\) \{\s*if \(this\.cpSeen !== undefined && !g\.catching && !g\.transitioning\) g\.dirty = true;/);
  const { rt, g } = anchorRig();
  let saves = 0;
  Object.assign(g, { started: true, saveTo: () => (++saves, true) });
  assert.equal(rt.saveOnHide(), true);
  for (const [what, set] of [['unloading', (r) => { r.unloading = true; }], ['between two places', (r) => { r.g.transitioning = true; }], ['a catch', (r) => { r.g.catching = true; }], ['a cast on its way', (r) => { r.castWaitFor = 'act2'; }]]) {
    const r = anchorRig().rt;
    Object.assign(r.g, { started: true, saveTo: () => (++saves, true) });
    set(r);
    assert.equal(r.saveOnHide(), false, what);
  }
  assert.equal(saves, 1);
  // (follow-up review: a page that did not go after all saves again, an unload let go or back from the back-forward cache)
  assert.match(SRC, /window\.addEventListener\('beforeunload', \(\) => \{\s*this\.unloading = true;\s*setTimeout\(\(\) => \{ this\.unloading = false; \}, 1500\);\s*\}\);/);
  assert.match(SRC, /window\.addEventListener\('pageshow', \(\) => \{ this\.unloading = false; \}\);/);
});
test('acts-3 F06: a load gives the Chronolith a moment (stability at least 0.6), and the street\'s save is past it', () => {
  assert.match(SRC, /if \(resumed && !deck\.roam\) this\.stability = c\.stability = Math\.max\(this\.stability, 0\.6\);/);
  // the Finale's 'street' thread ends past the pit (z 104-119; the pit at about 131, the platform at 166)
  const street = MISSIONS.finale[0].quarters[0].threads.find((t) => t.id === 'street');
  assert.ok(street.box[3] <= 119 && street.box[1] >= 104, JSON.stringify(street.box));
});

// --- SYS-09, acts-1-2 F06: REVERSE when the story reaches it -----------------------------------------------------------
function m11() {
  const di = MISSIONS.act2.findIndex((m) => m.key === 'm11');
  const rt = runtime('act2', di);
  const deck = rt.g.story.decks[di];
  const level = rt.buildLevel(rt.g.campaign);
  return { rt, deck, level };
}
test('SYS-09: in Mission 11 REVERSE waits for its thread ("Watch the file"), after the courts', () => {
  const { rt, deck } = m11();
  const t = rt.reverseThread();
  assert.equal(t.id, 'rhythm');
  assert.equal(rt.reverseOpen(), false, 'before the boy on the bench and the courts');
  rt.g.facts.set(factOf(deck, { id: 'hazards' }), true);
  assert.equal(rt.reverseOpen(), true, 'once the story is at the records');
  rt.g.facts.set(factOf(deck, { id: 'hazards' }), false);
  rt.g.facts.set('has_inversion', true);
  assert.equal(rt.reverseOpen(), true, 'and always once he has it');
  // a mission with no such thread never waits
  const other = runtime('act3', 0);
  other.g.story.decks[0] && other.buildLevel(other.g.campaign);
  assert.equal(other.reverseThread(), null);
  assert.equal(other.reverseOpen(), true);
});
test('SYS-09: a rule that gave REVERSE early has not happened: it waits, and what the zone set for it is unset', () => {
  const { rt, level } = m11();
  const g = rt.g;
  const rule = rt.deck.rules.find((r) => r.id === 'unlock');
  const zi = level.triggers.findIndex((z) => z.set?.m11_saw_file);
  assert.ok(zi >= 0, 'the zone at the charred file');
  g.deckWorld.flags[`trig_${zi}`] = true;
  g.deckWorld.flags.rule_unlock = true;
  g.facts.set('m11_saw_file', true);
  rt.reverseHeld = true;
  rt.unfire(rule);
  assert.equal(g.deckWorld.flags.rule_unlock, undefined, 'the rule waits to fire again');
  assert.equal(g.facts.get('m11_saw_file'), false, 'what the zone set is unset');
  assert.equal(g.deckWorld.flags[`trig_${zi}`], true, 'the zone stays spent while Kai stands in it (no firing every step)');
  assert.equal(g.deckWorld.flags[`rearm_${zi}`], true, 'and is marked to be armed again (in the saved flags)');
  assert.equal(rt.reverseHeld, false);
  // before the story is there it stays spent; once it is (the courts crossed), it is armed again
  rt.cinema = { active: false };
  g.room = level.triggers[zi].room;
  g.player = { pos: { x: 1e4, y: 0, z: 1e4 } };
  rt.watchStep(0.1);
  assert.equal(g.deckWorld.flags[`trig_${zi}`], true);
  g.facts.set(factOf(rt.deck, { id: 'hazards' }), true);
  rt.watchStep(0.1);
  assert.equal(g.deckWorld.flags[`trig_${zi}`], undefined, 'armed again');
  assert.equal(g.deckWorld.flags[`rearm_${zi}`], undefined);
  // the rules' loop: a fx that did not give REVERSE puts its rule back
  assert.match(SRC, /this\.reverseHeld = false;\s*if \(r\.then\) deck\.fx\?\.\[r\.then\]\?\.\(this\);\s*if \(this\.reverseHeld\) this\.unfire\(r\);/);
  // the unlock itself waits (the constructor wraps inv.unlock)
  assert.match(SRC, /this\.inv\.unlock = \(\) => \{\s*if \(!this\.reverseOpen\(\)\) \{\s*this\.reverseHeld = true;\s*return;\s*\}\s*unlock\(\);/);
});
test('acts-1-2 F06: watching the file for 4 s from within 8 m counts as reaching its zone', () => {
  const { rt, deck, level } = m11();
  const g = rt.g;
  g.facts.set(factOf(deck, { id: 'hazards' }), true);
  const lm = level.landmarks.charredFile;
  const zi = level.triggers.findIndex((z) => z.set?.m11_saw_file);
  const z = level.triggers[zi];
  g.room = z.room || 'h_annex';
  rt.cinema = { active: false };
  // 6.5 m off the file, outside its zone, looking at it
  const at = (d, look = true) => {
    const p = { x: lm[0] + d, y: (lm[1] || 0) + 0.86, z: lm[2] };
    g.player = { pos: p };
    g.camera = { position: { x: p.x, y: p.y + 0.8, z: p.z }, getWorldDirection: (v) => { const dx = look ? lm[0] - p.x : 0, dz = look ? lm[2] - p.z : 1, dy = (lm[1] || 0) + 1 - (p.y + 0.8), l = Math.hypot(dx, dy, dz); v.x = dx / l; v.y = dy / l; v.z = dz / l; return v; } };
  };
  at(6.5);
  assert.ok(!(g.player.pos.x >= z.box[0] && g.player.pos.x < z.box[3]), 'outside the zone');
  for (let i = 0; i < 30; i++) rt.watchStep(0.1);
  assert.equal(g.facts.get('m11_saw_file'), undefined, 'not after 3 s');
  for (let i = 0; i < 12; i++) rt.watchStep(0.1);
  assert.equal(g.facts.get('m11_saw_file'), true, 'after 4 s');
  assert.equal(g.deckWorld.flags[`trig_${zi}`], true);
  // not looking, or too far, or before the story is there: nothing
  for (const [what, setup] of [['looking away', () => at(6.5, false)], ['from 10 m', () => at(10)], ['before the courts', () => { at(6.5); g.facts.set(factOf(deck, { id: 'hazards' }), false); }]]) {
    g.facts.set('m11_saw_file', false);
    g.facts.set(factOf(deck, { id: 'hazards' }), true);
    delete g.deckWorld.flags[`trig_${zi}`];
    rt.watchT = 0;
    setup();
    for (let i = 0; i < 80; i++) rt.watchStep(0.1);
    assert.equal(g.facts.get('m11_saw_file'), false, what);
  }
});

// --- FT-14 -------------------------------------------------------------------------------------------------------------
test('FT-14: Mission 2\'s PREVIOUSLY is the morning of the crash; no snap line once the next place began', () => {
  for (const l of PREVIOUSLY.m02) assert.ok(!/tonight/i.test(l), l);
  assert.equal(PREVIOUSLY.m02[2], 'Now Helix has gone dark, and Kai Varen is inside it.');
  // the Chronolith does not drain during a staged moment or a transition, and a snap overtaken by either says nothing
  assert.match(SRC, /const draining = out && this\.unstable && !outdoors && !this\.opening && !this\.cinema\?\.active && !g\.transitioning && !ending;/);
  // (nor between a mission's end and the exit it takes on its own: Mission 3's fracture leaves the room in 2026)
  assert.match(SRC, /const ending = this\.deck\?\.autoExit != null && !!g\.deckWorld\.flags\.beat_done;/);
  assert.ok(MISSIONS.prologue.find((m) => m.key === 'm03').autoExit > 0);
  assert.match(SRC, /if \(this\.deck !== deck \|\| g\.transitioning \|\| !g\.campaign\?\.lv\) \{\s*g\.catching = false;\s*return;\s*\}/);
  assert.match(SRC, /if \(!this\.opening && !this\.cinema\?\.active\) this\.say\(LINES\.snap\);/);
});

// --- the save slot of a replay is still its own -----------------------------------------------------------------------
test('a case replay still saves in its own slot', () => {
  assert.equal(CASE_SLOT, 'case');
  assert.match(SRC, /g\.begin\(`lv:cases\/\$\{b\.dataset\.case\}`, null, CASE_SLOT\);/);
});
