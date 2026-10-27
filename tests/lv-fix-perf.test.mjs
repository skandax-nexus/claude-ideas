// v2.1 playtest fixes, unit "perf" (docs/lastversion/PLAYTEST-v2.1.md): phone performance and memory.
//   systems SYS-01: the CPU side of a frame in a crowded place, two thirds of it world matrices and skeletons over a
//     large scene graph: scenery that never moves has its matrices computed once (world/statics.js), and the people's
//     matrix budget (world/Actors.js ACTOR_LOD) with DeckWorld's view LOD (VIEW_LOD: nobody out of view, or whose
//     shadow is out of view, is posed or drawn; nobody still is recomputed; a far walker every second frame);
//   systems SYS-02: what a mission built is released when it unloads: the people's skeletons' bone textures and the
//     props on their bones (releaseActor, DeckWorld.dispose/freeLeft).
// The before/after CPU-frame numbers (the tester's own measure, 4x CPU throttle, MEDIUM) and the 3-lap memory run are
// browser runs from the unit's scratch scripts (STATUS).
//   node --test tests/lv-fix-perf.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../game/vendor/three.module.min.js';
import { ACTOR_LOD, lodBudget, releaseActor } from '../game/js/world/Actors.js';
import { DeckWorld, VIEW_LOD } from '../game/js/world/DeckWorld.js';
import { freezeStatic } from '../game/js/world/statics.js';
import { Scenery } from '../game/js/editions/lastversion/places/Scenery.js';

// a person as makeActor builds one, in miniature: root > pivot > model > (bone chain, a skinned mesh, a prop on a
// bone), and the contact shadow on the root; posed by animate() (which marks the bones as moved, as makeActor's does)
function person(at = [0, 0, 0], { hologram = false } = {}) {
  const root = new THREE.Group(), pivot = new THREE.Group(), model = new THREE.Group();
  root.add(pivot);
  pivot.add(model);
  const hips = new THREE.Bone(), head = new THREE.Bone();
  hips.position.y = 1;
  head.position.y = 0.6;
  hips.add(head);
  const geo = new THREE.BoxGeometry(0.4, 1.7, 0.3);
  geo.userData.modelGeo = true; // (the loaded model's own: shared by every clone)
  const body = new THREE.SkinnedMesh(geo, new THREE.MeshBasicMaterial());
  model.add(hips, body);
  const sk = new THREE.Skeleton([hips, head]);
  body.bind(sk);
  const prop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial());
  head.add(prop); // (a lamp on the head, as watchers.js hangs one: wardrobe.attach)
  const blob = hologram ? null : new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial());
  if (blob) {
    blob.userData.ownGeometry = true;
    root.add(blob);
  }
  root.position.set(...at);
  const U = root.userData;
  const posed = [];
  Object.assign(U, {
    actor: true, model, blob, spec: { hologram },
    animate(dt) { posed.push(dt); head.rotation.x += 0.1; U.posed = true; },
  });
  lodBudget(root, [sk]);
  return { root, U, model, hips, head, body, sk, prop, blob, posed };
}
// the renderer's whole-scene matrix pass, as main.js runs it (ACTOR_LOD.pass set around it)
function pass(scene) {
  ACTOR_LOD.pass = true;
  try { scene.updateMatrixWorld(); } finally { ACTOR_LOD.pass = false; }
}
const headY = (p) => p.head.matrixWorld.elements[13];
const headRot = (p) => p.head.matrixWorld.elements[5];
// did the skeleton's bone matrices get computed by this update() call?
function skelComputes(sk) {
  sk.boneMatrices.fill(-7);
  sk.update();
  return sk.boneMatrices[0] !== -7;
}

test('SYS-01 statics: scenery built where it stays has its matrices computed once and is skipped by the frame pass', () => {
  const scene = new THREE.Scene(), place = new THREE.Group();
  scene.add(place);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
  wall.position.set(4, 2, -3);
  wall.rotation.y = 0.5;
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial());
  plaque.position.z = 0.6;
  wall.add(plaque);
  place.add(wall);
  freezeStatic(wall);
  // its world matrices are right from the start (the first frame draws it where it is)
  const want = new THREE.Matrix4().compose(new THREE.Vector3(4, 2, -3), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.5, 0)), new THREE.Vector3(1, 1, 1));
  assert.ok(wall.matrixWorld.equals(want), 'its world matrix computed at once');
  assert.ok(Math.abs(plaque.matrixWorld.elements[12] - (4 + Math.sin(0.5) * 0.6)) < 1e-9, "its children's too");
  wall.traverse((o) => {
    assert.equal(o.matrixAutoUpdate, false);
    assert.equal(o.matrixWorldAutoUpdate, false);
  });
  // the frame's pass leaves it be (it is never recomposed nor multiplied again); its visibility is still its own
  const before = wall.matrixWorld.clone();
  wall.position.x = 99; // (a frozen piece must not move: if it did, it would not be drawn there)
  scene.updateMatrixWorld();
  assert.ok(wall.matrixWorld.equals(before), 'the pass skips it');
  wall.visible = false;
  scene.updateMatrixWorld();
  assert.equal(wall.visible, false);
});

test('SYS-01 statics: a place\'s scenery (Scenery.js) is frozen, and its years still show and hide its plants', () => {
  const root = new THREE.Group();
  let state = 'PRESENT';
  const level = { vis: [], veg: [{ k: 'shrub', x: 2, y: 0, z: 3, s: 1.5, e: ['PRESENT'] }] };
  const s = new Scenery(level, root, () => ({ state, fact: () => false }));
  s.root.traverse((o) => {
    assert.equal(o.matrixAutoUpdate, false, `${o.type} frozen`);
    assert.equal(o.matrixWorldAutoUpdate, false, `${o.type} frozen`);
  });
  const inst = s.veg[0].inst, m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  s.setEra('PRESENT');
  inst.getMatrixAt(0, m);
  m.decompose(p, q, sc);
  assert.ok(Math.abs(sc.x - 1.5) < 1e-6 && Math.abs(p.x - 2) < 1e-6, 'the plant stands in its year');
  state = 'PAST';
  s.setEra('PAST');
  inst.getMatrixAt(0, m);
  m.decompose(p, q, sc);
  assert.ok(sc.x < 1e-6, 'and is gone in another (the instance matrices still change: only the object is frozen)');
  // the editions' code: DeckWorld freezes its merged surfaces, plaques, light pools and trees; Scenery its root
  const dw = fs.readFileSync('game/js/world/DeckWorld.js', 'utf8');
  assert.match(dw, /for \(const o of statics\) \{\s*if \(!o\.parent\) root\.add\(o\);\s*freezeStatic\(o\);/);
  assert.match(fs.readFileSync('game/js/editions/lastversion/places/Scenery.js', 'utf8'), /freezeStatic\(this\.root\)/);
});

test('SYS-01 matrix budget: a person still and unposed is not recomputed; posed, moved, woken or asked directly, they are', () => {
  const scene = new THREE.Scene();
  const a = person([0, 0, -5]);
  scene.add(a.root);
  a.U.lodManaged = true;
  pass(scene);
  const y0 = headY(a);
  assert.ok(Math.abs(y0 - 1.6) < 1e-9, 'the first pass computes everyone');
  // the bones move without a pose (nothing the game does: the check that the pass really skips them)
  a.head.rotation.x = 0.7;
  const r0 = headRot(a);
  pass(scene);
  assert.equal(headRot(a), r0, 'still and unposed: their bones stand as they were computed');
  // a new pose (animate): the next pass computes it
  a.U.animate(1 / 30);
  pass(scene);
  assert.notEqual(headRot(a), r0, 'posed: recomputed');
  // they walk (their root moves): recomputed
  a.root.position.x = 1;
  pass(scene);
  assert.ok(Math.abs(a.head.matrixWorld.elements[12] - 1) < 1e-9, 'moved: recomputed');
  // someone's own call (wardrobe.attach, mount.js) recomputes everything, as three does
  a.head.rotation.x = 0.2;
  const r1 = headRot(a);
  a.root.updateMatrixWorld(true);
  assert.notEqual(headRot(a), r1, 'a direct call recomputes');
  // people DeckWorld does not manage (the player, Station Zero's crew, the watchers) are recomputed every pass
  const b = person([2, 0, -5]);
  scene.add(b.root);
  pass(scene);
  b.head.rotation.x = 0.9;
  const rb = headRot(b);
  pass(scene);
  assert.notEqual(headRot(b), rb, 'unmanaged: every pass');
  // the budget off (ACTOR_LOD.enabled): three's own pass
  ACTOR_LOD.enabled = false;
  try {
    a.head.rotation.x = 1.1;
    const r2 = headRot(a);
    pass(scene);
    assert.notEqual(headRot(a), r2, 'off: every pass');
  } finally { ACTOR_LOD.enabled = true; }
});

test('SYS-01 matrix budget: hidden and dormant people are skipped, and the first pass that draws them computes them', () => {
  const scene = new THREE.Scene();
  const a = person([0, 0, -5]);
  scene.add(a.root);
  a.U.lodManaged = true;
  pass(scene);
  for (const [why, set, unset] of [
    ['hidden', () => { a.root.visible = false; }, () => { a.root.visible = true; }],
    ['dormant', () => { a.U.dormant = true; }, () => { a.U.dormant = false; }],
  ]) {
    set();
    a.root.position.z -= 1; // they walk on (their root's own matrix is kept: casting.js ranks people by it)
    a.U.animate(1 / 30);
    pass(scene);
    assert.ok(Math.abs(a.root.matrixWorld.elements[14] - a.root.position.z) < 1e-9, `${why}: the root's own matrix is current`);
    assert.ok(Math.abs(a.head.matrixWorld.elements[14] - a.root.position.z) > 0.5, `${why}: the bones are left`);
    unset();
    a.U.posed = false; // (no new pose since: only "stale" brings them up to date)
    pass(scene);
    assert.ok(Math.abs(a.head.matrixWorld.elements[14] - a.root.position.z) < 1e-9, `${why}: computed on the first pass that draws them`);
  }
});

test('SYS-01 matrix budget: a far walker holding a pose is drawn every second frame; the skeleton only when its bones moved', () => {
  const scene = new THREE.Scene();
  const a = person([0, 0, -60]);
  scene.add(a.root);
  a.U.lodManaged = true;
  pass(scene);
  a.U.lodEvery = 2;
  let updates = 0;
  for (let i = 0; i < 10; i++) {
    a.root.position.z -= 0.05; // walking (1.5 m/s at 30 fps), the pose held (casting.js: beyond 70 m)
    const mv = a.U.mv;
    pass(scene);
    if (a.U.mv !== mv) updates++;
    assert.ok(Math.abs(a.head.matrixWorld.elements[14] - a.root.position.z) <= 0.05 + 1e-9, 'never more than a frame behind');
  }
  assert.equal(updates, 5, 'every second frame');
  // posed, they are computed every frame whatever the distance
  updates = 0;
  for (let i = 0; i < 4; i++) {
    a.U.animate(1 / 30);
    const mv = a.U.mv;
    pass(scene);
    if (a.U.mv !== mv) updates++;
  }
  assert.equal(updates, 4);
  // the skeleton's matrices: computed once after the bones were, not again until they are
  assert.equal(skelComputes(a.sk), true, 'after a pass that moved the bones');
  assert.equal(skelComputes(a.sk), false, 'not again (a second mesh of theirs, the shadow pass, the next still frame)');
  pass(scene); // (still, unposed: skipped)
  assert.equal(skelComputes(a.sk), false, 'still: their bone matrices stand');
  a.U.animate(1 / 30);
  pass(scene);
  assert.equal(skelComputes(a.sk), true, 'posed again: computed');
  ACTOR_LOD.enabled = false;
  try { assert.equal(skelComputes(a.sk), true, 'the budget off: every call'); } finally { ACTOR_LOD.enabled = true; }
});

// --- DeckWorld's view LOD ---------------------------------------------------------------------------------------
// the camera at eye height looking down -Z (a phone in landscape), the sun low behind it (+Z), its shadow camera as
// main.js has it
function stage({ lodOn = true } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, 915 / 412, 0.05, 600);
  camera.position.set(0, 1.6, 0);
  camera.lookAt(0, 1.6, -10);
  camera.updateMatrixWorld();
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  sun.position.set(0, 5, 30);
  sun.target.position.set(0, 0, 0);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18 });
  const w = Object.assign(Object.create(DeckWorld.prototype), { scene, root: new THREE.Group(), npcs: [], sentinels: [], lodOn });
  scene.add(w.root);
  const g = { camera, sun, renderer: { shadowMap: { enabled: true } }, time: 10 };
  const add = (at, opts) => {
    const p = person(at, opts);
    w.root.add(p.root);
    const n = { n: {}, model: p.root, p };
    w.npcs.push(n);
    return n;
  };
  return { w, g, scene, camera, sun, add };
}

test('SYS-01 view LOD: nobody out of view (nor their shadow) is posed or drawn; in view again, they are posed first', () => {
  const { w, g, scene, camera, add } = stage();
  const ahead = add([0, 0, -10]); // in view
  const behind = add([0, 0, 30]); // behind the camera; its shadow (the sun behind it) falls behind the camera too
  const shade = add([0, 0, 5]); // behind the camera, 5 m off, but its long low-sun shadow reaches the street in view
  const holo = add([0, 0, 5], { hologram: true }); // the same place, a figure of light: no shadow
  const close = add([0, 0, 3]); // behind, within VIEW_LOD.near: kept (the camera swings round fast)
  w.viewLod(g);
  const U = (n) => n.model.userData;
  assert.equal(U(ahead).dormant, false);
  assert.equal(U(behind).dormant, true, 'out of view: dormant');
  assert.equal(behind.p.model.visible, false, 'its body is not drawn (nor in the shadow pass)');
  assert.equal(behind.p.blob.visible, false, 'nor its contact shadow');
  assert.equal(U(shade).dormant, false, 'its shadow in view: kept');
  assert.equal(U(holo).dormant, true, 'a hologram casts none');
  assert.equal(U(close).dormant, false, `within ${VIEW_LOD.near} m: kept`);
  // a dormant person is not posed (DeckWorld.updatePeople adds the time they miss); the frame pass skips them
  pass(scene);
  behind.lodDt = 0.4;
  behind.lodSpeed = 1.2;
  // the camera turns round: they are posed for the time they missed before this frame is drawn, and drawn
  camera.lookAt(0, 1.6, 10);
  camera.updateMatrixWorld();
  w.viewLod(g);
  assert.equal(U(behind).dormant, false);
  assert.equal(behind.p.model.visible, true);
  assert.equal(behind.p.blob.visible, true);
  assert.deepEqual(behind.p.posed.slice(-1), [0.4], 'posed for the 0.4 s they missed');
  assert.equal(behind.lodDt, 0);
  assert.equal(U(ahead).dormant, true, 'and the one now behind sleeps');
  // the edition's switch off (Station Zero; main.js lodOn): everyone awake and drawn
  w.lodOn = false;
  w.viewLod(g);
  for (const n of w.npcs) {
    assert.equal(U(n).dormant, false);
    assert.equal(n.p.model.visible, true);
    assert.equal(U(n).lodManaged, false);
  }
});

test('SYS-01 view LOD: a far walker in view is drawn every second frame; near, every frame', () => {
  const { w, g, add } = stage();
  const far = add([0, 0, -(VIEW_LOD.far + 20)]);
  const near = add([0, 0, -12]);
  w.viewLod(g);
  assert.equal(far.model.userData.lodEvery, 2);
  assert.equal(near.model.userData.lodEvery, 1);
  assert.equal(far.model.userData.lodManaged, true);
});

test('SYS-01 view LOD: a dormant passer-by\'s contact shadow comes back with them, the camera inside them or not', () => {
  const { w, g, camera, add } = stage();
  const n = add([0, 0, 30]);
  w.viewLod(g);
  assert.equal(n.p.blob.visible, false, 'dormant: hidden');
  // the camera inside them (DeckWorld.clearOfCamera hides what is shown of them) as they wake
  w.clearOfCamera(n, true);
  camera.lookAt(0, 1.6, 10);
  camera.updateMatrixWorld();
  w.viewLod(g);
  assert.equal(n.p.blob.visible, false, 'not while the camera is inside them');
  w.clearOfCamera(n, false);
  assert.equal(n.p.blob.visible, true, 'back with the rest of them');
  assert.ok(n.model.children.every((c) => c.visible));
});

// --- SYS-02: what a place built is released when it goes ---------------------------------------------------------
test('SYS-02 release: a person\'s bone textures, contact shadow and bone props go with the place; shared model geometry stays', () => {
  const a = person();
  a.sk.computeBoneTexture();
  const gone = new Set();
  const watch = (o, k) => o.addEventListener('dispose', () => gone.add(k));
  watch(a.sk.boneTexture, 'boneTexture');
  watch(a.blob.geometry, 'blob');
  watch(a.body.geometry, 'model');
  watch(a.prop.geometry, 'prop');
  const geos = releaseActor(a.root, new Set());
  assert.ok(gone.has('boneTexture') && a.sk.boneTexture === null, 'the skeleton\'s bone texture');
  assert.ok(gone.has('blob'), 'the contact shadow\'s own plane');
  assert.ok(!gone.has('model') && !geos.has(a.body.geometry), 'the loaded model\'s geometry is shared: kept');
  assert.ok(!gone.has('prop') && geos.has(a.prop.geometry), 'a prop on a bone: noted, freed once the next place is built');
});

test('SYS-02 dispose/freeLeft: a prop the next place does not use is freed, one it uses is kept', () => {
  const scene = new THREE.Scene();
  const w = Object.assign(Object.create(DeckWorld.prototype), { scene, mats: {}, level: {}, glows: [] });
  const root = (w.root = new THREE.Group());
  scene.add(root);
  const a = person(), b = person();
  root.add(a.root, b.root);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
  root.add(wall);
  a.sk.computeBoneTexture();
  b.sk.computeBoneTexture();
  const gone = new Set();
  for (const [o, k] of [[a.sk.boneTexture, 'boneA'], [b.sk.boneTexture, 'boneB'], [a.prop.geometry, 'propA'], [b.prop.geometry, 'propB'], [wall.geometry, 'wall']]) o.addEventListener('dispose', () => gone.add(k));
  w.dispose();
  assert.ok(gone.has('boneA') && gone.has('boneB') && gone.has('wall'));
  assert.ok(!gone.has('propA') && !gone.has('propB'), 'props wait for the next place');
  // the next place: someone in it holds the same lantern (a shared prop) as b did
  const next = new THREE.Group();
  next.add(new THREE.Mesh(b.prop.geometry, new THREE.MeshBasicMaterial()));
  scene.add(next);
  w.freeLeft();
  assert.ok(gone.has('propA'), 'a prop nobody uses now: freed');
  assert.ok(!gone.has('propB'), 'one still in use: kept');
  assert.equal(w.leftGeo, null);
});

test('SYS-01/02 wiring: main.js runs the frame pass under the budget, the view LOD before every draw, on in THE LAST VERSION', () => {
  const src = fs.readFileSync('game/js/main.js', 'utf8');
  assert.match(src, /this\.scene\.updateMatrixWorld = function \(force\) \{\s*ACTOR_LOD\.pass = true;\s*try \{\s*scenePass\.call\(this, force\);\s*\} finally \{\s*ACTOR_LOD\.pass = false;/);
  const draws = [...src.matchAll(/this\.postfx\.render\(\);/g)].map((m) => m.index);
  assert.equal(draws.length, 2, 'the loop and the frame capture');
  for (const at of draws) assert.match(src.slice(at - 120, at), /if \(this\.mode === 'deck'\) this\.deckWorld\.viewLod\(this\);/, 'viewLod just before each draw');
  assert.match(src, /this\.deckWorld\.lodOn = !!c\.lv;/);
});
