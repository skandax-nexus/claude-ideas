// Core system tests: run with `node --test tests/`
import test from 'node:test';
import assert from 'node:assert/strict';
import { compileCondition } from '../game/js/core/conditions.js';
import { FactStore } from '../game/js/core/FactStore.js';
import { RealityEngine } from '../game/js/core/RealityEngine.js';
import { parseLaw, compileLaws } from '../game/js/core/Laws.js';
import { ObserverBrain } from '../game/js/core/ObserverBrain.js';
import { Objectives } from '../game/js/core/Objectives.js';
import { rules, objectiveLayers, scripts, questions, endings } from '../game/js/world/story.js';

const ctx = (facts, state = null) => ({ fact: (k) => facts[k], state });

test('conditions: boolean logic, states, comparisons', () => {
  const f = { a: true, b: false, n: 3 };
  assert.equal(compileCondition('a && !b')(ctx(f)), true);
  assert.equal(compileCondition('b || (a && n >= 3)')(ctx(f)), true);
  assert.equal(compileCondition('n > 3')(ctx(f)), false);
  assert.equal(compileCondition('@ECHO && a')(ctx(f, 'ECHO')), true);
  assert.equal(compileCondition('!@INVERTED')(ctx(f, 'INVERTED')), false);
  assert.equal(compileCondition('missing')(ctx(f)), false);
  assert.equal(compileCondition('')(ctx(f)), true);
  assert.throws(() => compileCondition('a &&'));
  assert.throws(() => compileCondition('a b'));
});

test('every authored condition in the story parses', () => {
  const conds = [
    ...rules.map((r) => r.when),
    ...objectiveLayers.map((l) => l.when),
    ...Object.values(scripts).flat().map((l) => l.when).filter(Boolean),
    ...questions.flatMap((q) => [q.open, q.closed]),
    endings.MIRROR.when,
  ];
  for (const c of conds) assert.doesNotThrow(() => compileCondition(c), c);
});

test('facts: rules fire once and chain', () => {
  const fs = new FactStore();
  const effects = [];
  fs.onEffect = (e) => effects.push(e);
  fs.addRules([
    { id: 'r1', when: 'a', then: [{ set: { b: true } }, { log: 'a happened' }] },
    { id: 'r2', when: 'b', then: [{ inc: 'count' }] },
  ]);
  fs.set('a');
  assert.equal(fs.get('b'), true);
  assert.equal(fs.get('count'), 1);
  fs.set('a', false);
  fs.set('a', true);
  assert.equal(fs.get('count'), 1, 'once-rules do not refire');
  assert.deepEqual(effects, [{ log: 'a happened' }]);
});

test('facts: serialize/restore keeps fired rules', () => {
  const fs = new FactStore();
  fs.addRules([{ id: 'r', when: 'x', then: [{ inc: 'n' }] }]);
  fs.set('x');
  const fs2 = new FactStore();
  fs2.restore(fs.serialize());
  fs2.addRules([{ id: 'r', when: 'x', then: [{ inc: 'n' }] }]);
  assert.equal(fs2.get('n'), 1);
});

test('laws: grammar accepts valid laws and rejects nonsense', () => {
  assert.equal(parseLaw({ subject: 'GRAVITY', verb: 'INVERTS', target: 'INVERTED' }).effect, 'gravityFlip');
  assert.deepEqual(parseLaw({ subject: 'HELD', verb: 'PERSISTS', target: 'ALL' }).states, ['PHYSICAL', 'INVERTED', 'ECHO']);
  assert.equal(parseLaw({ subject: 'HELD', verb: 'INVERTS', target: 'ECHO' }).ok, false);
  assert.equal(parseLaw({ subject: 'INVERTS', verb: 'GRAVITY', target: 'ECHO' }).ok, false);
  assert.equal(parseLaw({ subject: 'GRAVITY', verb: null, target: 'ECHO' }).ok, false);
  assert.equal(parseLaw(null).ok, true);
});

test('laws: paradox - zero gravity overrides inversion', () => {
  const { effects, paradoxes } = compileLaws([
    { subject: 'GRAVITY', verb: 'INVERTS', target: 'ECHO' },
    { subject: 'GRAVITY', verb: 'FREEZES', target: 'ALL' },
  ]);
  assert.equal(effects.gravityFlip.has('ECHO'), false);
  assert.equal(effects.zeroG.has('ECHO'), true);
  assert.equal(paradoxes.length, 1);
});

test('reality engine: room states, locks, overrides, gravity from laws', () => {
  const e = new RealityEngine();
  assert.equal(e.gravity('lab'), -1);
  e.cycle('lab');
  assert.equal(e.state('lab'), 'INVERTED');
  assert.equal(e.gravity('lab'), 1, 'default law inverts gravity in INVERTED');
  e.cycle('lab');
  assert.equal(e.state('lab'), 'ECHO');
  assert.equal(e.gravity('lab'), -1);
  // rewrite the law: gravity now inverts in ECHO instead
  assert.equal(e.setLaw(0, { subject: 'GRAVITY', verb: 'INVERTS', target: 'ECHO' }).ok, true);
  assert.equal(e.gravity('lab'), 1);
  // locked slot
  assert.equal(e.setLaw(2, { subject: 'HELD', verb: 'PERSISTS', target: 'ALL' }).ok, false);
  e.unlockSlot(3);
  assert.equal(e.setLaw(2, { subject: 'HELD', verb: 'PERSISTS', target: 'ALL' }).ok, true);
  assert.equal(e.has('heldPersists', 'PHYSICAL'), true);
  // locks and overrides
  e.lock('antechamber');
  assert.equal(e.cycle('antechamber'), false);
  e.setOverride('antechamber', { zeroG: true });
  assert.equal(e.gravity('antechamber'), 0);
  e.setOverride('antechamber', null);
  assert.equal(e.gravity('antechamber'), -1);
  // round-trip
  const e2 = new RealityEngine();
  e2.restore(e.serialize());
  assert.equal(e2.state('lab'), 'ECHO');
  assert.equal(e2.gravity('lab'), 1);
});

test('observer brain: hiding escalation pass -> pause -> inspect', () => {
  const b = new ObserverBrain();
  b.recordHide('p3');
  assert.equal(b.hideReaction('p3'), 'pass');
  b.recordHide('p3');
  assert.equal(b.hideReaction('p3'), 'pause');
  b.recordHide('p3');
  assert.equal(b.hideReaction('p3'), 'inspect');
  assert.deepEqual(b.decide(100), { type: 'inspect', spot: 'p3' });
  // does not obsess: cooldown before inspecting the same spot again
  assert.notEqual(b.decide(105, () => 0.99).type, 'inspect');
});

test('observer brain: learns lanes, ceiling, freeze immunity, running', () => {
  const lessons = [];
  const b = new ObserverBrain({ ceilingAfter: 10, freezeAfter: 3, runnerAfter: 8 });
  b.onLesson = (l) => lessons.push(l);
  b.recordCrossing('south');
  assert.equal(b.favouriteLane(), null);
  b.recordCrossing('south');
  assert.equal(b.favouriteLane(), 'south');
  assert.deepEqual(b.decide(0, () => 0), { type: 'intercept', lane: 'south' });
  for (let i = 0; i < 11; i++) b.recordStateTime('INVERTED', 1);
  assert.equal(b.seesCeiling(), true);
  b.recordFreeze();
  b.recordFreeze();
  assert.equal(b.ignoresFreeze(), false);
  b.recordFreeze();
  assert.equal(b.ignoresFreeze(), true);
  assert.equal(b.hearingRadius(true), 6);
  b.recordPace(true, 9);
  assert.equal(b.hearingRadius(true), 12);
  assert.deepEqual(lessons, ['lane', 'ceiling', 'freeze', 'runner']);
});

test('objectives: hidden objective is rewritten as evidence arrives', () => {
  const fs = new FactStore();
  const o = new Objectives(objectiveLayers, fs);
  const seen = [];
  o.onChange = (l) => seen.push(l.text);
  o.update();
  assert.equal(o.text, '');
  fs.set('left_antechamber');
  o.update();
  fs.set('heard_varga');
  o.update();
  fs.set('vault_seen');
  o.update();
  fs.set('brain_seen');
  o.update();
  assert.deepEqual(seen, objectiveLayers.map((l) => l.text));
  assert.equal(o.history.length, 4);
});

test('System 3: recording R1 grows a new sentence after activation', () => {
  const fs = new FactStore();
  const lines = () => scripts.r1.filter((l) => !l.when || fs.test(l.when)).map((l) => l.text);
  const before = lines();
  assert.ok(!before.some((t) => t.includes('already activated')));
  fs.set('machine_activated');
  assert.ok(lines().some((t) => t.includes('If you have already activated it, I am sorry.')));
});
