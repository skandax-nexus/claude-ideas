// THE LAST VERSION OF EARTH v2.1 playtest fixes, the follow-up after the seven units' reviews (docs/lastversion/STATUS.md,
// "follow-up"): what each reviewer found still open or newly broken, checked here without a browser.
//   barks: Line 41's PA is the place's own line, not the story's (FT-04); passers-by never fill the screen (SYS-18)
//   touch: the dock acts on a tap (a look drag from it turns the view), a lost touch end lets go, SKIP 48 px, the watchers'
//     meter under the minimap, the case board opens at its top, the quarter forgotten between missions, a bolt's chip
//   flow: the Finale past the street that fell (F06), a page that did not unload saves again, the file watched through a
//     wall, Sound captions on
//   perf: a person dressed or hung with a prop is computed by the next matrix pass; dormant watchers are not posed
//   missionsA: the map's tracks, crossing, objective and quarry (FT-08), the staff gate's objective, the arm's spot, the
//     stones' landing (F16), the prompt clear of a toast (F14), cached materials left alone by echoes
//   missionsB: the sandbag line cannot be jumped, a catch is no crossing, a story prompt no escape from a chase, the
//     district patrol off the frozen block's spot, the hold's patrol, the tremor's cost, THINK's tiers (SYS-16)
//   staging: the ring reveal clear of Rook, the conversation camera out of the wreck, the braziers out of the ending's
//     shot, a moment's facts never loaded, the frozen block's people stopped while it is shown, the window's faces
//   the resumed step: Mission 6's canal street puts Kai back on his own bank, Mission 4's cold open at night, the
//     stepping stones' footing round, a shadow from a ledge
//   node --test tests/lv-fix-followup.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../game/vendor/three.module.min.js';
import { RealityEngine } from '../game/js/core/RealityEngine.js';
import { FactStore } from '../game/js/core/FactStore.js';
import { compileCondition } from '../game/js/core/conditions.js';
import { HUD } from '../game/js/ui/HUD.js';
import { Input } from '../game/js/ui/Input.js';
import { DeckWorld, CAMERA_CLEAR } from '../game/js/world/DeckWorld.js';
import { Player } from '../game/js/entities/Player.js';
import { LV } from '../game/js/editions/lastversion/index.js';
import { LastVersion, MISSIONS, momentFacts } from '../game/js/editions/lastversion/Runtime.js';
import { Threads, threadsOf, shortLabel } from '../game/js/editions/lastversion/Threads.js';
import { Inversion } from '../game/js/editions/lastversion/inversion.js';
import { M01, M02 } from '../game/js/editions/lastversion/prologue.js';
import { M21 } from '../game/js/editions/lastversion/act4.js';
import { M23, ENDING_SHOTS } from '../game/js/editions/lastversion/finale.js';
import { camBlockHit } from '../game/js/editions/lastversion/cinema.js';
import { attach } from '../game/js/editions/lastversion/wardrobe.js';
import { Watchers } from '../game/js/editions/lastversion/watchers.js';
import { M04, M06 } from '../game/js/editions/lastversion/act1.js';
import { PLACES } from '../game/js/editions/lastversion/places/index.js';
import { lodBudget } from '../game/js/world/Actors.js';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const CSS = read('../game/css/style.css');
const MAIN = read('../game/js/main.js');
const RT = read('../game/js/editions/lastversion/Runtime.js');

// a mission's level, built the way the runtime builds it (Runtime.buildLevel with a stand-in game)
function build(ch, deck) {
  const game = { engine: new RealityEngine(LV.engineOptions()), facts: new FactStore(), story: null };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: game, def: LV });
  game.story = rt.makeStory(ch);
  return rt.buildLevel({ lv: true, chapter: ch, deck, sector: 0, flags: {} });
}
const solids = (level, state = 'PRESENT', facts = {}) => level.elements.filter((e) => e.solid && (!e.when || compileCondition(e.when)({ fact: (k) => facts[k], state })));
// Kai with the game's own physics (entities/Player.js): walks [x, z] waypoints, or jumps on the way (jumpAt: metres from
// the waypoint at which he presses JUMP)
function kai(level, start, facts = {}, state = 'PRESENT') {
  const cols = solids(level, state, facts).map((e) => ({ min: e.box.slice(0, 3), max: e.box.slice(3) }));
  const p = Object.assign(Object.create(Player.prototype), { pos: new THREE.Vector3(start[0], start[1] + 0.86, start[2]), vel: new THREE.Vector3(), H: new THREE.Vector3(0, 0, -1), U: new THREE.Vector3(0, 1, 0), gravity: -1, grounded: false, half: new THREE.Vector3(0.3, 0.85, 0.3), topSpeed: null, stepOff: 0, airT: 0, _canStep: false, comfort: true, pitch: 0, facing: new THREE.Vector3(0, 0, -1), colliders: [] });
  const trace = [];
  const walk = (route, { jumpAt = null, secs = 30 } = {}) => {
    for (const [x, z] of route) {
      let jumped = false;
      for (let t = 0; t < secs; t += 1 / 30) {
        const dx = x - p.pos.x, dz = z - p.pos.z, d = Math.hypot(dx, dz);
        if (d < 0.45) break;
        p.H.set(dx / d, 0, dz / d);
        const jump = jumpAt != null && !jumped && d < jumpAt && p.grounded;
        if (jump) jumped = true;
        p.update(1 / 30, { forward: 1, strafe: 0, run: false, jump, slow: false }, cols);
        trace.push([p.pos.x, p.pos.y, p.pos.z]);
      }
    }
    return p;
  };
  return { p, walk, trace };
}

// --- barks: FT-04, SYS-18 ------------------------------------------------------------------------------------------------
test('FT-04: Line 41\'s PA is the station\'s own line: it never hides the prompt nor shields Kai, a tap on the prompt cuts it, a story line does not', () => {
  const pa = M01_PA();
  assert.ok(pa.length && pa.every((l) => l.ambient && l.who === 'PA'), 'the announcement is marked ambient');
  const hud = Object.assign(Object.create(HUD.prototype), { subs: [], subT: 0, speakers: {}, el: { subs: { innerHTML: '' } } });
  hud.say(pa, new FactStore());
  assert.ok(hud.talking && !hud.storyTalking, 'up, but not the story: the prompt stays (main.js showFocus)');
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: { hud } });
  assert.equal(rt.storyLines(), false, 'nor does it keep the watchers off Kai');
  // a story line queues behind it (nothing cuts the PA but a tap that acts)
  hud.say([{ who: 'KAI', text: 'The relay.' }], new FactStore());
  assert.ok(hud.cur.ambient && hud.subs.length === 1 && hud.storyTalking);
  hud.subs = [];
  let skipped = 0;
  hud.onSkip = () => skipped++;
  hud.hushBarks();
  assert.ok(hud.cur?.ambient && skipped === 0, 'a bark\'s hush leaves it');
  hud.hushBarks(true);
  assert.ok(!hud.talking && skipped === 1, 'a tap on the prompt that acts cuts it (main.js use: hushBarks(true))');
  assert.match(MAIN, /if \(!f\) return;\s*this\.hud\.hushBarks\?\.\(true\);/);
});
function M01_PA() {
  const src = read('../game/js/editions/lastversion/prologue.js');
  const m = src.match(/announcement: \[\{ who: 'PA', text: '([^']+)', voice: \{ fx: 'pa', cue: 'pa' \}, ambient: true \}\]/);
  return m ? [{ who: 'PA', text: m[1], voice: { fx: 'pa', cue: 'pa' }, ambient: true }] : [];
}

test('SYS-18: a passer-by who would fill the screen is not drawn, upright sooner than sideways; an umbrella counts; a talker never in a shot or a talk', () => {
  const w = Object.create(DeckWorld.prototype);
  const cam = (aspect) => {
    const c = new THREE.PerspectiveCamera(aspect < 1 ? 96 : 70, aspect, 0.05, 600);
    c.position.set(0, 1.6, 0);
    c.lookAt(0, 1.2, -6); // (Kai 3.6 m ahead, as the game's camera follows him)
    c.updateMatrixWorld();
    return c;
  };
  const person = (x, z, umbrella = false) => ({ n: { n: { height: 1.75 } }, m: { position: new THREE.Vector3(x, 0, z), userData: { umbrella } } });
  const fills = (c, x, z, u = false) => { const q = person(x, z, u); return w.fillsCamera(q.n, q.m, c, false); };
  const land = cam(915 / 412), port = cam(412 / 915);
  // straight under the camera, and inside the old 1.3 m: never drawn
  assert.ok(fills(land, 0.4, -0.6) && fills(port, 0.4, -0.6));
  // crossing in front of the camera at 1.5 m (the review's walker: 9% of a landscape screen, 16% upright)
  assert.ok(fills(land, -0.6, -1.5), 'landscape, crossing 1.5 m in front');
  assert.ok(fills(port, -0.4, -1.9), 'upright, 1.9 m in front: a narrow view fills sooner');
  // beside Kai, 3.4 m off: drawn either way
  assert.ok(!fills(land, -1.0, -3.4) && !fills(port, -1.0, -3.4), 'someone beside Kai stays drawn');
  // an umbrella's canopy reaches past the body: the same walker, with one, is hidden further off
  let ok = false;
  for (let d = 1.4; d < 3.2 && !ok; d += 0.1) ok = fills(land, 1.1, -d, true) && !fills(land, 1.1, -d, false);
  assert.ok(ok, 'an umbrella is counted');
  // but as a disc over the head, not a wall from the feet up: one 2.6 m ahead, its canopy at the top of the view, is drawn
  assert.ok(!fills(land, 0, -2.6, true), 'an umbrella 2.6 m ahead stays drawn sideways');
  // hidden, they are drawn again only well clear (no blinking at the edge)
  assert.ok(CAMERA_CLEAR.clear < CAMERA_CLEAR.cover && CAMERA_CLEAR.far > CAMERA_CLEAR.near);
  // a camera with no projection (a test's stand-in) keeps the distance rule
  assert.equal(w.fillsCamera(person(0, -0.8).n, person(0, -0.8).m, { position: new THREE.Vector3(0, 1.6, 0) }, false), true);
  assert.equal(w.fillsCamera(person(0, -5).n, person(0, -5).m, { position: new THREE.Vector3(0, 1.6, 0) }, false), false);
  // someone Kai can talk to is hidden by it only while the game's own camera follows him (v2.1.1 playtest P17), never in a
  // shot or a conversation's framing (the conversation camera stands close to them)
  assert.match(read('../game/js/world/DeckWorld.js'), /const named = talker && !!g\.edition && !g\.player\?\.cinema;\s*if \(cam && \(\(!talker && \(n\.n\.ambient \|\| n\.n\.path\)\) \|\| named\) && !n\.n\.flicker\) \{/);
});

// --- touch ---------------------------------------------------------------------------------------------------------------
function el() {
  const ls = {}, cls = new Set();
  return {
    ls, style: {}, classList: { add: (c) => cls.add(c), remove: (...c) => c.forEach((x) => cls.delete(x)), contains: (c) => cls.has(c), toggle: (c, on = !cls.has(c)) => (on ? cls.add(c) : cls.delete(c), on) },
    addEventListener(t, f) { (ls[t] ||= []).push(f); },
    fire(t, e) { for (const f of ls[t] || []) f({ type: t, preventDefault() {}, stopPropagation() {}, ...e }); },
  };
}
test('SYS-13 review: the dock acts on a tap (a look drag from it turns the view); a touch whose end was lost does not hold a control', () => {
  const src = read('../game/js/ui/Input.js');
  assert.match(src, /if \(b\.hasAttribute\('data-tap'\) \|\| b\.closest\('#dock'\)\) \{\s*this\.tapOrLook\(b, \(\) => \{/);
  const input = Object.assign(Object.create(Input.prototype), { look: { dx: 0, dy: 0 }, touchSensitivity: 0.0065, activity() {} });
  const b = el();
  let fired = 0;
  input.tapOrLook(b, () => fired++);
  const t = (id, x, y, live = [id]) => ({ changedTouches: [{ identifier: id, clientX: x, clientY: y }], touches: live.map((i) => ({ identifier: i })) });
  // a look drag from the dock's place: the view turns, nothing opens
  b.fire('touchstart', t(1, 370, 528));
  for (let k = 1; k <= 5; k++) b.fire('touchmove', t(1, 370 - k * 20, 528));
  b.fire('touchend', t(1, 270, 528, []));
  assert.equal(fired, 0);
  assert.ok(input.look.dx < -0.5, 'turned the view');
  // a touch whose end never came (the system took the gesture): the next touch is a tap of its own
  b.fire('touchstart', t(2, 370, 528));
  b.fire('touchstart', t(3, 371, 529, [3]));
  b.fire('touchend', t(3, 371, 529, []));
  assert.equal(fired, 1, 'a lost end lets the control go');
  // a second finger while the first is down is not a new tap
  b.fire('touchstart', t(4, 370, 528));
  b.fire('touchstart', t(5, 300, 300, [4, 5]));
  b.fire('touchend', t(5, 300, 300, [4]));
  b.fire('touchend', t(4, 370, 528, []));
  assert.equal(fired, 2);
});

test('SYS-13 / SYS-15 / F10 review: SKIP is 48 px, the case board\'s play buttons 44; the watchers\' meter sits under the minimap, clear of the year card', () => {
  assert.match(CSS, /body\.lastversion\.touch #lvSkip \{ min-height: 48px;/);
  assert.match(CSS, /body\.lastversion\.touch \.lvplay \{ min-width: 44px; min-height: 44px; \}/);
  // (in the top row a long place name ran under it: now right-aligned under the minimap, its word under its track, and the
  // CARRYING label steps down under it while it shows)
  assert.match(CSS, /body\.lastversion\.touch #eye \{ top: calc\(max\(12px, env\(safe-area-inset-top\)\) \+ 104px\); left: auto; right: calc\(max\(16px, env\(safe-area-inset-right\)\) \+ 2px\); transform: none;/);
  assert.match(CSS, /body\.lastversion\.touch #eye::after \{ left: auto; right: 0; top: calc\(100% \+ 5px\); transform: none; \}/);
  assert.match(CSS, /body\.lastversion\.touch:not\(\.lvnoeye\):has\(#eye\.on\) #held \{ top: 150px; \}/);
  assert.doesNotMatch(CSS, /body\.lastversion\.touch #eye \{ top: max\(18px, env\(safe-area-inset-top\)\); left: calc\(50% - 30px\); \}/);
});

test('touch review: the case board opens at its top; the quarter is found again in each mission; a bolt\'s chip says it runs; the prompt is measured again on a rotation', () => {
  // (reset once the panel is shown: a hidden panel takes no scroll, and Chrome kept 3938 px across the close)
  assert.match(MAIN, /this\.hud\.show\(id\);\s*if \(id === 'journal'\) \{[\s\S]{0,400}?if \(panel\) panel\.scrollTop = 0;\s*\}/);
  const th = Object.assign(Object.create(Threads.prototype), { rt: { g: {} } });
  th.here = 3;
  th.attach({ key: 'x' }, { quarters: [] });
  assert.equal(th.here, null, 'the last mission\'s quarter is not this one\'s');
  const lock = { rec: { id: 'm11lock', kind: 'lock', label: 'THE LOCK', weight: 1, max: 8, parts: [{ name: 'BAR' }, { name: 'CRESCENT', rest: { p: [2, 1, 1] } }] } };
  const inv = Object.assign(Object.create(Inversion.prototype), { g: { facts: { get: (k) => k === 'has_inversion' }, campaign: { inv: { charge: 8, cap: 8 } } }, active: { p: lock, part: 1, t: 0.5, lock: true }, target: null });
  const h = inv.hudState();
  assert.equal(h.chipNum, '…', 'upright the chip shows only this: it was blank');
  assert.equal(h.chip, '⟲ THE LOCK · CRESCENT ', 'the chip\'s key as before');
  assert.match(read('../game/js/ui/HUD.js'), /window\.addEventListener\('resize', \(\) => \{ this\._promptW = 0; this\._toastBox = null;[^}]*\}\);/);
});

// --- flow: acts-3 F06, the street that fell -----------------------------------------------------------------------------
test('acts-3 F06 review: past the street, a snap, a catch or a fall puts Kai at the seam; a load behind the pit puts him there; THINK says how to cross back', () => {
  const facts = new FactStore();
  const placed = [];
  const level = { outdoorRoom: 'road', landmarks: { seam41: [0, 0, 108, Math.PI] } };
  const g = { facts, room: 'road', checkpoint: [-5, 0.86, 166, Math.PI], player: { pos: new THREE.Vector3(-5, 0.86, 166), place: (p) => { placed.push(p); g.player.pos.set(p[0], p[1], p[2]); } }, hud: { say() {} } };
  const rt = { g, level, inv: { procs: [] }, deck: M23, pendingResume: null };
  M23.step(rt, 0.1);
  assert.deepEqual(g.checkpoint, [-5, 0.86, 166, Math.PI], 'before the street: the platform');
  facts.set('t_m23_streets');
  facts.set('t_m23_street');
  g.player.pos.set(2, 0.86, 118.9);
  M23.step(rt, 0.1);
  assert.deepEqual(g.checkpoint, [0, 0.86, 108, Math.PI], 'past the street: the seam, ground every year has (Runtime.snapBack and every setback use it)');
  assert.equal(placed.length, 0, 'in play, Kai is never moved');
  // the playtest's own save: crossed, but loading on the platform behind the pit
  g.checkpoint = [-5, 0.86, 166, Math.PI];
  g.player.pos.set(-5, 0.86, 166);
  rt.pendingResume = M23;
  M23.step(rt, 0.1);
  M23.step(rt, 0.1);
  assert.equal(placed.length, 1, 'a load behind the pit puts him at the seam, once');
  assert.ok(g.player.pos.z < 119 && g.checkpoint[2] === 108);
  // walked back over the pit: THINK says how to cross again (Runtime.hint, a thought marked over)
  const over = M23.hints.find((h) => h.over);
  assert.ok(over && facts.test(over.when) && over.tiers.length === 3 && /REVERSE the street/.test(over.tiers[2]));
  g.player.pos.set(0, 0.86, 150);
  assert.equal(over.test(rt), true, 'behind the pit');
  g.player.pos.set(0, 0.86, 100);
  assert.equal(over.test(rt), false, 'past it: the settlement\'s own tiers');
  assert.match(RT, /const over = deck\?\.thoughts\?\.find\(\(x\) => x\.over && g\.facts\.test\(x\.when \|\| 'true'\) && \(!x\.test \|\| x\.test\(this\)\)\);/);
});

test('flow review: watching the file counts only with it in sight; Sound captions on in THE LAST VERSION; the music box\'s cue captioned', () => {
  assert.match(RT, /if \(\(_v\.x \* dx \+ _v\.y \* dy \+ _v\.z \* dz\) \/ d < 0\.75 \|\| !seen\(\)\) \{/);
  assert.match(RT, /return g\.player\.rayDistance\(eye, to\.divideScalar\(dv\), dv\) >= dv - 1\.2;/);
  assert.match(read('../game/js/ui/Settings.js'), /EDITION === 'lastversion' \? \{ hero: \{ id: 'real_m' \}, mix: \{ voice: 1, music: 0\.8, sfx: 1, amb: 0\.85 \}, captions: true \}/);
  assert.match(read('../game/js/editions/lastversion/act2.js'), /rt\.score\?\.capText\(S\.gain < 0\.3 \? 'the music box, very quiet: close' : 'a music box, quieter as you come closer'\)/);
});

// --- perf ----------------------------------------------------------------------------------------------------------------
test('perf review: a prop hung on a person, or a person dressed, is computed by the next matrix pass; a dormant watcher is posed on waking', () => {
  const actor = new THREE.Group();
  const hand = new THREE.Bone();
  actor.add(hand);
  actor.userData = { handR: hand, stale: false, posed: false };
  attach(actor, 'handR', new THREE.Group());
  assert.equal(actor.userData.stale, true, 'attach marks the person stale (world/Actors.js ACTOR_LOD)');
  assert.match(read('../game/js/editions/lastversion/wardrobe.js'), /U\.lvVariant = variant;\s*\/\/[^\n]*\n[^\n]*\n\s*U\.stale = true;\s*return actor;/);
  // the watchers' people: not posed while dormant, posed for the time missed as they wake
  const calls = [];
  const actorU = { dormant: true, animate: (dt, speed, t) => calls.push(+dt.toFixed(2)) };
  const g = new THREE.Group();
  const rec = { g, last: new THREE.Vector3(), speed: 0, t: 0, current: { actor: { userData: actorU } } };
  const w = Object.assign(Object.create(Watchers.prototype), { list: [rec] });
  for (let i = 0; i < 10; i++) w.update(0.1);
  assert.equal(calls.length, 0, 'dormant: not posed');
  assert.ok(Math.abs(actorU.lodDt - 1) < 1e-9);
  const dw = Object.create(DeckWorld.prototype);
  dw.wake({ userData: Object.assign(actorU, { model: { visible: false } }) }, null, 5);
  assert.deepEqual(calls, [1], 'woken: posed once for the second missed, before that frame is drawn');
  actorU.dormant = false;
  w.update(0.1);
  assert.deepEqual(calls, [1, 0.1]);
});

// --- missionsA -----------------------------------------------------------------------------------------------------------
const M1L = build('prologue', 0), M2L = build('prologue', 1), M6L = build('act1', 2), M8L = build('act1', 4);
test('FT-08 review: Line 41\'s map draws its tracks, the barrow crossing and the stairs; the full map marks the objective, and in a pursuit the quarry', () => {
  const lines = M1L.map.lines || [];
  assert.equal(lines.filter((l) => l.kind === 'rail').length, 2, 'two tracks');
  assert.ok(lines.some((l) => l.kind === 'path' && l.name === 'CROSSING' && l.rect[0] === 27 && l.rect[2] === 32), 'the barrow crossing');
  const MM = read('../game/js/ui/MiniMap.js');
  assert.match(MM, /for \(const l of map\.lines \|\| \[\]\)/);
  assert.match(MM, /if \(!big && BIG_ONLY\.has\(m\.kind\)\) continue;/, 'the objective and the quarry on the full map only');
  assert.match(MAIN, /if \(this\.edition\?\.mapMarkers\) out\.push\(\.\.\.this\.edition\.mapMarkers\(\)\);/);
  const go = { kind: 'go', box: [-2.6, -226.6, 2.6, -224.4] };
  const mira = { n: { id: 'mira', chase: {} }, model: { visible: true, position: new THREE.Vector3(10, 1, -170) } };
  const rt = (t) => Object.assign(Object.create(LastVersion.prototype), { level: M1L, _threads: { on: true, current: () => t }, g: { deckWorld: { npcs: [mira] } } });
  assert.deepEqual(rt(go).mapMarkers(), [{ x: 0, z: -225.5, kind: 'objective' }]);
  assert.deepEqual(rt({ kind: 'chase' }).mapMarkers(), [{ x: 10, z: -170, kind: 'quarry' }]);
  const at = rt({ kind: 'scene', at: 'staffGate' }).mapMarkers()[0];
  assert.ok(at.kind === 'objective' && Math.abs(at.z + 224) < 0.01, 'a thread at a landmark');
});

test('FT-15 review: the raincoat opens the staff gate and the gate is the objective until Kai is through it', () => {
  assert.equal(M01.done, 'raincoat');
  const gate = threadsOf(M01).find((t) => t.id === 'gate');
  const facts = new FactStore();
  facts.set('raincoat');
  const mk = (current) => Object.defineProperty(Object.assign(Object.create(LastVersion.prototype), { _threads: { on: true, current }, g: { facts, deckWorld: { flags: { beat_done: true } } } }), 'deck', { value: M01 });
  const rt = mk(() => gate);
  assert.deepEqual(rt.objectiveParts(), [gate.goal, gate.because], 'not the general "next door is open"');
  const rt2 = mk(() => null);
  assert.match(rt2.objectiveParts()[0], /next door is open/i, 'with no exit thread, as before');
});

test('M6 review: WATCH THE ARM is offered from the counter\'s side, outside the brass ring, until the arm has been watched', () => {
  const spot = M6L.interactables.find((i) => i.id === 'arm');
  const [px, , pz] = M6L.landmarks.repeatArm;
  assert.ok(spot && Math.hypot(spot.pos[0] - px, spot.pos[2] - pz) > 2.3 + 0.8, `the prompt floats ${Math.hypot(spot.pos[0] - px, spot.pos[2] - pz).toFixed(1)} m from the post`);
  assert.ok(/!ev_arm_count/.test(spot.when), spot.when);
  const facts = new FactStore();
  facts.set('ezra_met');
  facts.set('t_m06_cellar');
  facts.set('t_m06_ezra');
  facts.set('ev_arm_count');
  assert.equal(compileCondition(spot.when)(facts.ctx('PRESENT')), false, 'watched: no longer offered');
});

test('F16 review: off the last stone toward the terminal, diagonally, Kai lands on stone (the tester\'s route), both banks', () => {
  for (const sz of [1, -1]) {
    // (from the fourth stone, over the last one toward the terminal, as the tester walked)
    const K = kai(M8L, [0.12, 0.15, sz * 13.7]);
    K.walk([[0.3, sz * 12.8], [3.6, sz * 11.6], [4.2, sz * 11.2]]);
    assert.ok(Math.hypot(K.p.pos.x - 4.2, K.p.pos.z - sz * 11.2) < 0.6, `at the terminal (${K.p.pos.x.toFixed(2)}, ${K.p.pos.z.toFixed(2)})`);
    const low = Math.min(...K.trace.map((q) => q[1]));
    assert.ok(low > 0.86 - 0.05, `never into the water (lowest feet ${(low - 0.86).toFixed(2)} m)`);
  }
});

test('F14 review: the prompt keeps clear of a toast that is up', () => {
  const hud = Object.assign(Object.create(HUD.prototype), { toastT: 2, el: { toast: { getBoundingClientRect: () => ({ left: 300, right: 600, top: 60, bottom: 130, height: 70 }) } } });
  assert.deepEqual(hud.toastBox(), { left: 300, right: 600, top: 60, bottom: 130 });
  hud.toastT = 0;
  assert.equal(hud.toastBox(), null, 'gone with the toast');
  assert.match(MAIN, /if \(tb && x \+ half > tb\.left && x - half < tb\.right && y - 46 < tb\.bottom && y > tb\.top\) y = Math\.min\(h - 60, Math\.round\(tb\.bottom \+ 52\)\);/);
});

test('missionsA review: an echo never writes a material the wardrobe caches for everyone, nor disposes one the living wear', () => {
  const src = read('../game/js/editions/lastversion/echoes.js');
  assert.match(src, /if \(!m\?\.isMeshStandardMaterial \|\| m\.alphaTest > 0 \|\| !r\?\.map \|\| m\.userData\?\.keep\) return;/);
  assert.match(src, /for \(const m of \[\]\.concat\(x\.material\)\) if \(m && !m\.userData\?\.keep\) m\.dispose\?\.\(\);/);
});

// --- missionsB -----------------------------------------------------------------------------------------------------------
const M13L = build('act2', 4), M18L = build('act3', 4);
test('F03 review: the sandbag line cannot be jumped; a catch in the arrival box is no crossing; a catch at the gate walks Kai back to the shells', () => {
  const line = solids(M13L).find((e) => e.box[0] === 26 && e.box[2] === 23.4);
  assert.ok(line && line.box[4] >= 1.8, `the line is ${line?.box[4]} m high`);
  for (const x of [80, 34, 60]) {
    const K = kai(M13L, [x, 0, 30]);
    K.walk([[x, 16]], { jumpAt: 1.3, secs: 8 });
    assert.ok(K.p.pos.z > 24.5, `a JUMP at x ${x} does not clear it (z ${K.p.pos.z.toFixed(2)})`);
  }
  assert.match(RT, /if \(t\.unseen && g\.catching\) return;/);
  // caught by the canyon gate before the crossing is done: the checkpoint the gate's quarter gave is the shells'
  const shells = M13L.checkpoints.find((c) => c.id === 'shells');
  const gate = M13L.landmarks.canyonGate;
  const facts = new FactStore();
  const g = { facts, room: M13L.outdoorRoom, checkpoint: [gate[0], gate[1] + 0.86, gate[2], 0], camera: null, engine: { state: () => 'PAST' }, deckWorld: { sentinels: [], npcs: [] } };
  const M13 = MISSIONS.act2.find((m) => m.key === 'm13');
  M13.step({ g, level: M13L, cinema: null }, 0.1);
  assert.equal(g.checkpoint, shells.spawn, 'walked back to the shells');
  facts.set('t_m13_cross');
  g.checkpoint = [gate[0], gate[1] + 0.86, gate[2], 0];
  M13.step({ g, level: M13L, cinema: null }, 0.1);
  assert.equal(g.checkpoint[2], gate[2], 'crossed: the gate is the next quarter\'s, as before');
});

test('F04 review: lines Kai started keep new eyes off him, but a chase already on goes on; the district patrol walks wide of the frozen block\'s spot', () => {
  assert.match(RT, /const all = this\.stagedT > 0;\s*for \(const s of g\.deckWorld\.sentinels\) \{\s*if \(!all && s\.mode === 'chase'\) continue;/);
  assert.match(RT, /this\.spotT = g\.time; \/\/ \(what it says next was started at a spot: storyHolds\)/);
  const pat = M13L.sentinels.find((s) => s.id.endsWith('_q2s1'));
  const spot = [M13L.landmarks.frozenBlock[0] + 10, M13L.landmarks.frozenBlock[2] + 18.5];
  const d = Math.min(...pat.path.map((a, i) => {
    const b = pat.path[(i + 1) % pat.path.length], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((spot[0] - a[0]) * dx + (spot[1] - a[1]) * dz) / l2));
    return Math.hypot(spot[0] - (a[0] + t * dx), spot[1] - (a[1] + t * dz));
  }));
  assert.ok(d > 8, `${d.toFixed(1)} m from the spot`);
  // and no story moment is started while a watcher of the room is on Kai's heels (a staged scene ends every chase)
  const toasts = [];
  const sent = { dead: false, mode: 'chase', def: { room: 'r' } };
  const rt = Object.assign(Object.create(LastVersion.prototype), { g: { room: 'r', time: 5, deckWorld: { sentinels: [sent] }, audio: {}, hud: { toast: (t) => toasts.push(t) } } });
  rt.scene = () => { throw new Error('a scene started mid-chase'); };
  rt.talk = () => { throw new Error('a talk started mid-chase'); };
  assert.equal(rt.useDeck({ id: 'deck:block', it: { kind: 'scene', id: 'block' } }), true);
  assert.equal(rt.useDeck({ id: 'dnpc:sera', npc: {} }), true);
  assert.equal(toasts.length, 2);
  assert.match(toasts[0], /Lose them first/);
  sent.mode = 'patrol';
  let started = 0;
  rt.scene = () => { started++; };
  assert.equal(rt.useDeck({ id: 'deck:block', it: { kind: 'scene', id: 'block' } }), true);
  assert.equal(started, 1, 'with nobody chasing, the scene plays');
});

test('F19 review: Mission 18\'s hold has a scavenger between the pylons (15 m clear of each); Mission 21\'s tremor shakes a held gap\'s hold', () => {
  const sc = M18L.sentinels.find((s) => /m18_repair && !m18_stabilized/.test(s.when || ''));
  assert.ok(sc, 'a patrol only while Sera works');
  for (const k of ['pylon1', 'pylon2', 'pylon3']) {
    const [x, , z] = M18L.landmarks[k];
    for (const [px, pz] of sc.path) assert.ok(Math.hypot(px - x, pz - z) >= 15, `${k}: ${Math.hypot(px - x, pz - z).toFixed(1)} m`);
  }
  const facts = new FactStore();
  facts.set('arena_fallen');
  const st = { charge: 8, cap: 10 };
  const rt = { g: { facts }, level: { landmarks: {} }, inv: { active: { p: { rec: { id: 'arenaGap1', weight: 1 } } }, state: st }, m21Quake: 0 };
  M21.step(rt, 0.1);
  assert.ok(Math.abs(st.charge - 6.5) < 1e-9, `the hold lost 1.5 s (${st.charge})`);
});

test('SYS-16 review: no THINK tier of Missions 6 to 23 is a fragment of three words or fewer', () => {
  const short = [];
  for (const ms of Object.values(MISSIONS)) for (const m of ms) {
    if (!/^m(0[6-9]|1\d|2[0-3])$/.test(m.key)) continue;
    for (const q of m.quarters || []) for (const t of [...(q.threads || []), ...(q.sides || []).flatMap((s) => s.threads || [])]) {
      for (const h of t.hints || []) if (h.split(/\s+/).length <= 3) short.push(`${m.key}.${t.id}: ${h}`);
    }
  }
  assert.deepEqual(short, []);
});

test('missionsB review: a playback\'s header names each placed piece by its time or first sentence', () => {
  assert.equal(shortLabel('05:33. Test moved to 05:40. Director\'s office.'), '05:33.');
  assert.equal(shortLabel('The river is diverted.'), 'The river is diverted.');
  assert.equal(shortLabel('08:13. The ring turns. At 08:14, one second missing.'), '08:13.');
});

// --- staging -------------------------------------------------------------------------------------------------------------
test('FT-18 review: the ring reveal\'s first shot is taken from a side with nobody in it (Rook at the door)', () => {
  const rook = M2L.npcs.find((n) => n.id === 'rook_door');
  const ring = M2L.landmarks.chamber;
  // Kai between Rook and the ring, 3.5 m in front of Rook, as he walks up to it
  const ux = ring[0] - rook.pos[0], uz = ring[2] - rook.pos[2], l = Math.hypot(ux, uz);
  const p = new THREE.Vector3(rook.pos[0] + (ux / l) * 3.5, rook.pos[1] + 0.86, rook.pos[2] + (uz / l) * 3.5);
  const rt = { level: M2L, g: { player: { pos: p, rayDistance: (o, d, m) => m }, deckWorld: { npcs: [{ model: { visible: true, position: new THREE.Vector3(...rook.pos) } }] } } };
  const shots = M02.coldOpen ? null : null; void shots;
  const reveal = read('../game/js/editions/lastversion/prologue.js').includes('export function m02Reveal');
  assert.ok(reveal);
  return import('../game/js/editions/lastversion/prologue.js').then(({ m02Reveal }) => {
    const [first] = m02Reveal(rt);
    const seg = (a, b, q) => {
      const v = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l2 = v[0] ** 2 + v[1] ** 2 + v[2] ** 2;
      let best = Infinity;
      for (const h of [0.4, 1.1, 1.7]) {
        const w = [q[0] - a[0], q[1] + h - a[1], q[2] - a[2]];
        const t = Math.max(0, Math.min(1, (w[0] * v[0] + w[1] * v[1] + w[2] * v[2]) / l2));
        best = Math.min(best, Math.hypot(w[0] - t * v[0], w[1] - t * v[1], w[2] - t * v[2]));
      }
      return best;
    };
    assert.ok(seg(first.cam, first.look, rook.pos) > 0.9, `Rook ${seg(first.cam, first.look, rook.pos).toFixed(2)} m from the line to the ring`);
  });
});

test('FT-06 review: the conversation camera keeps out of the leaning wreck (camera blocks round its carriages)', () => {
  const blocks = M1L.camBlocks || [];
  assert.equal(blocks.length, 9, 'three a carriage');
  assert.ok(blocks.every((b) => b.when === 'after_zero && !@PAST'));
  const man = M1L.npcs.find((n) => n.id === 'trapped_b');
  // from Kai's head, 2 m in front of the man, toward the carriage beyond him (where the reverse shot stood): blocked
  const O = new THREE.Vector3(man.pos[0] - 0.5, man.pos[1] + 1.6, man.pos[2] + 2.2);
  const to = new THREE.Vector3(man.pos[0], man.pos[1] + 1.6, man.pos[2] - 1.2).sub(O);
  const len = to.length();
  const hit = camBlockHit(M1L, () => true, O, to.divideScalar(len), len);
  assert.ok(hit < len - 0.3, `blocked at ${hit.toFixed(2)} of ${len.toFixed(2)} m`);
  assert.equal(camBlockHit(M1L, () => false, O, to, len), len, 'not before the wreck');
  assert.match(read('../game/js/editions/lastversion/cinema.js'), /const hit = Math\.min\(pl\.rayDistance\(O, d, len\), camBlockHit\(this\.rt\?\.level,/);
});

test('staging review: the summit\'s braziers stand out of the endings\' ring shots', () => {
  const src = read('../game/js/editions/lastversion/places/specs/afterzero.js');
  const m = src.match(/for \(const \[x, z\] of (\[\[-4\.6, -126\.2\][^\n]*\]\]) \)? ?\{/) || src.match(/for \(const \[x, z\] of (\[\[-4\.6, -126\.2\], [^\n]*?\]\])\) \{/);
  const braziers = JSON.parse(m[1]);
  const cams = [ENDING_SHOTS.A[0], ENDING_SHOTS.B[0], ENDING_SHOTS.C[0]].flatMap((s) => [s.cam, s.to]);
  for (const [bx, bz] of braziers) for (const c of cams) assert.ok(Math.hypot(c[0] - bx, c[2] - bz) > 3.5, `brazier ${bx}, ${bz} ${Math.hypot(c[0] - bx, c[2] - bz).toFixed(1)} m from ${c}`);
  // the second pair out of the ring shots' view, from where each starts and ends: more than 60 degrees off the way the
  // camera looks (a landscape phone's view is 55 degrees either side, an upright one's less)
  for (const s of [ENDING_SHOTS.A[0], ENDING_SHOTS.C[0]]) for (const c of [s.cam, s.to]) {
    const f = [s.look[0] - c[0], s.look[2] - c[2]], fl = Math.hypot(...f);
    for (const [bx, bz] of braziers.slice(2)) {
      const v = [bx - c[0], bz - c[2]], cos = (f[0] * v[0] + f[1] * v[1]) / (fl * Math.hypot(...v));
      assert.ok(cos < 0.5, `brazier ${bx}, ${bz}: ${((Math.acos(cos) * 180) / Math.PI).toFixed(0)} degrees off the view`);
    }
  }
});

test('staging review: a moment\'s facts are never loaded; the frozen block\'s people stand while it is shown; Ward 32\'s bed plays no scene; the window\'s faces', () => {
  const mf = momentFacts();
  for (const k of ['m23_beat', 'm13_block_view', 'm11_ward_view', 'holo_pryce', 'm06_window_view']) assert.ok(mf.has(k), k);
  assert.match(RT, /for \(const k of momentFacts\(\)\) if \(this\.g\.facts\.facts\[k\]\) delete this\.g\.facts\.facts\[k\];/);
  const lobby = M13L.npcs.filter((n) => n.crowd && /!civilians_freed/.test(n.when || ''));
  assert.ok(lobby.length && lobby.every((n) => /m13_block_view/.test(n.freezeWhen || '')), 'the lobby stands still while THE FROZEN BLOCK is shown');
  const bed = build('act2', 2).interactables.find((i) => i.id === 'ward32_things');
  assert.ok(bed && bed.r === 0 && bed.scene == null, 'a prop: no reach, no scene');
  const years = M6L.texts.filter((t) => ['2026', '2049', '2196'].includes(t.text) && Math.abs(t.pos[2] + 15.68) < 0.05);
  assert.equal(years.length, 3, 'under each face its year');
  assert.match(read('../game/js/editions/lastversion/act1.js'), /rt\.cinema\?\.watchShow\?\.\('m06_window_view', m06WindowShots\);/);
});

// --- the resumed step --------------------------------------------------------------------------------------------------
test('M6 review: on the canal street a setback puts Kai on the bank he was on, where he was; in front of the house, at the shop door', () => {
  const arm = M6L.hazards.find((h) => h.lvKit === 'brassArm');
  const sr = M6L.landmarks.streetReturn;
  const at = (x, z, y = 0.86) => {
    const g = { facts: new FactStore(), room: arm.room, catching: false, checkpoint: [9.8, -3.14, -30.6, Math.PI], deckWorld: { hazards: [{ hz: arm, angle: 0 }] },
      player: { pos: new THREE.Vector3(x, y, z), half: new THREE.Vector3(0.3, 0.85, 0.3), grounded: true }, engine: { hasIn: () => false, statesOf: () => ['PRESENT'] }, hud: {}, audio: {}, after() {} };
    M06.step({ g, deck: M06, level: M6L }, 1 / 30);
    return g.checkpoint.map((v) => +(+v).toFixed(2));
  };
  assert.deepEqual(at(-40, -9.5), [-40, 0.86, -9, sr[3]], 'the south bank, 56 m up the street: there, not the shop door');
  assert.deepEqual(at(-40, 9.5), [-40, 0.86, 9, +(sr[3] + Math.PI).toFixed(2)], 'the north bank: its own side');
  assert.deepEqual(at(58, -9), [50, 0.86, -9, sr[3]], 'as far as the street goes');
  assert.deepEqual(at(16, -12), [sr[0], 0.86, sr[2], sr[3]], 'in front of the house: outside the shop door, as before');
  assert.deepEqual(at(12, -20).slice(0, 3), [M6L.landmarks.shopReturn[0], 0.86, M6L.landmarks.shopReturn[2]], 'the shop floor: by the counter, as before');
});

test('F14 review: Mission 4\'s cold open by the ring is staged at night (its sky, its light, its air), the afternoon after it', () => {
  const co = M04.coldOpen;
  assert.ok(co.stage && co.night >= 0.6 && co.first, 'staged: co_m04 holds from the start, and comes off behind the title card');
  const f = PLACES.valley_upper.skyFeatures.m04.find((x) => x.kind === 'preset');
  assert.ok(f && f.when === 'co_m04' && f.sky === 'milkyWay', 'a starry sky while it plays');
  const facts = new FactStore();
  const rt = Object.defineProperty(Object.assign(Object.create(LastVersion.prototype), { g: { facts } }), 'deck', { value: M04 });
  assert.equal(rt.stateNight('PRESENT', 0.05), 0.05, 'the afternoon');
  facts.set('co_m04', true);
  assert.equal(rt.stateNight('PRESENT', 0.05), co.night, 'night while it plays');
  assert.match(RT, /if \(coNight\) pal\.fog = _fogC\.setHex\(y\.fog\)\.lerp\(_nightC, Math\.min\(1, coNight \* 1\.2\)\)\.getHex\(\);/, 'the air darkens with it');
  assert.match(RT, /const want = Math\.max\(0\.05, 1 - coNight \* 1\.15\);/, 'and the horizon\'s painted band');
});

test('F16 review: a stepping stone\'s footing is its round, not a square over the water (Mission 8)', () => {
  const stones = [[17.15, -0.12], [16.0, 0.14], [14.85, -0.1], [13.7, 0.12], [12.6, 0]];
  for (const sz of [1, -1]) for (const [z, x] of stones) {
    const cz = sz * z;
    const cols = M8L.elements.filter((e) => e.solid && e.box[4] === 0.15 && Math.abs((e.box[0] + e.box[3]) / 2 - x) < 0.01 && Math.abs((e.box[2] + e.box[5]) / 2 - cz) < 0.01);
    assert.equal(cols.length, 3, `stone ${x}, ${cz}`);
    for (const c of cols) for (const cx of [c.box[0], c.box[3]]) for (const czz of [c.box[2], c.box[5]]) assert.ok(Math.hypot(cx - x, czz - cz) <= 0.951, `a corner ${Math.hypot(cx - x, czz - cz).toFixed(2)} m from the stone's middle (its stone 0.95)`);
  }
});

test('perf review: someone up on a ledge, out of view, whose shadow falls on the ground in view, stays awake', () => {
  const camera = new THREE.PerspectiveCamera(62, 915 / 412, 0.05, 600);
  camera.position.set(0, 1.6, 0);
  camera.lookAt(0, 1.6, -10);
  camera.updateMatrixWorld();
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  sun.position.set(0, 20, 20); // (behind the camera, 45 degrees up: a shadow falls ahead of it)
  sun.target.position.set(0, 0, 0);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18 });
  const w = Object.assign(Object.create(DeckWorld.prototype), { root: new THREE.Group(), npcs: [], sentinels: [], lodOn: true });
  const root = new THREE.Group();
  root.position.set(0, 20, -4); // (on a ledge 20 m up, 4 m ahead: far above the view; its shadow lands about 25 m ahead)
  Object.assign(root.userData, { actor: true, model: new THREE.Group(), spec: {}, animate() {} });
  lodBudget(root, []);
  w.root.add(root);
  w.npcs.push({ n: {}, model: root });
  w.viewLod({ camera, sun, renderer: { shadowMap: { enabled: true } }, time: 1 });
  assert.equal(root.userData.dormant, false, 'its shadow on the street ahead: kept (the sweep went only to its own feet: it slept, and its shadow popped in)');
  assert.match(read('../game/js/world/DeckWorld.js'), /const up = _sd\.y, low = Math\.min\(y0, this\.lodFloor \?\? y0\);/);
});
