// Characters built from professionally modelled, rigged models (Mixamo
// skeleton) driven by motion-capture clips. Replaces the procedural humans
// for everyone you see: the player, Juno, the crew, the Custodian, the Other.
//
// - Locomotion blends idle / walk / run by speed, with the animation's pace
//   matched to the ground speed so feet don't slide.
// - Clips from any Mixamo-rigged model are retargeted onto any other through
//   world space, using each model's T-pose as the reference.
// - Extras on top of the mixer: the head turns to look at you, a nod or
//   head-shake while talking, a wave, a leap pose in the air.
// - Same userData API as world/humans.js (animate, setTalking, lookAt, wave,
//   setOpacity, handL, handR, head), so the rest of the game is unchanged.
//
// Drop more Mixamo-rigged .glb characters into assets/characters and add them
// to MODELS to grow the cast.
import * as THREE from '../../vendor/three.module.min.js';
import { GLTFLoader } from '../../vendor/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from '../../vendor/addons/utils/SkeletonUtils.js';

export const MODELS = {
  michelle: { file: 'Michelle.glb', ref: 'TPose', facing: 0, height: 1.68 },
  vanguard: { file: 'Soldier.glb', ref: 'TPose', facing: Math.PI, height: 1.82, native: { idle: 'Idle', walk: 'Walk', run: 'Run' } },
  xbot: { file: 'Xbot.glb', ref: null, facing: 0, height: 1.78 },
};
const SOURCE = 'xbot'; // the clip library: idle, walk, run, agree, headShake, sad_pose, sneak_pose
const WALK_SPEED = 1.45; // m/s covered by one second of the walk clip at timeScale 1
const RUN_SPEED = 3.9;

const loaded = {};
let ready = null;

export function actorsReady() {
  return !!ready && Object.keys(loaded).length === Object.keys(MODELS).length;
}

// Load every model once and bake its clip set. Resolves to true when the cast is available.
export function loadActors(base = 'assets/characters/') {
  if (ready) return ready;
  const loader = new GLTFLoader();
  ready = Promise.all(Object.entries(MODELS).map(async ([key, m]) => {
    // single-file builds (APK, preview) carry the models inline as data: URIs
    const g = await loader.loadAsync(globalThis.AZ_MODELS?.[m.file] || base + m.file);
    loaded[key] = { gltf: g, def: m };
  })).then(() => {
    const src = loaded[SOURCE];
    for (const [key, L] of Object.entries(loaded)) L.clips = buildClips(key, L, src);
    return true;
  }).catch((e) => {
    console.warn('Characters could not load; using the procedural cast', e);
    return false;
  });
  return ready;
}

const boneKey = (name) => name.replace(/^mixamorig[:_]?/, '');

function skinnedOf(root) {
  let s = null;
  root.traverse((o) => { if (o.isSkinnedMesh && !s) s = o; });
  return s;
}

function bonesByKey(root) {
  const m = {};
  root.traverse((o) => { if (o.isBone) m[boneKey(o.name)] = o; });
  return m;
}

// Pose a model in its reference pose (a T-pose clip, or the bind pose) and record world rotations.
function refPose(root, gltf, refName) {
  const mixer = new THREE.AnimationMixer(root);
  if (refName) {
    const c = gltf.animations.find((a) => a.name === refName);
    mixer.clipAction(c).play();
    mixer.update(0);
  }
  // without a T-pose clip the freshly loaded node transforms are the rest pose
  root.updateMatrixWorld(true);
  const rot = {}, pos = {};
  for (const [k, b] of Object.entries(bonesByKey(root))) {
    rot[k] = b.getWorldQuaternion(new THREE.Quaternion());
    pos[k] = b.getWorldPosition(new THREE.Vector3());
  }
  mixer.stopAllAction();
  return { rot, pos };
}

// Retarget one clip from the source model to the destination, through world space.
function retarget(srcRoot, srcRef, clip, dstRoot, dstRef, fps = 30) {
  const sb = bonesByKey(srcRoot), db = bonesByKey(dstRoot);
  const order = [];
  dstRoot.traverse((o) => { if (o.isBone && sb[boneKey(o.name)]) order.push(o); });
  const mixer = new THREE.AnimationMixer(srcRoot);
  const action = mixer.clipAction(clip);
  action.play();
  const n = Math.max(2, Math.round(clip.duration * fps) + 1);
  const times = new Float32Array(n);
  const qv = {}, hipY = new Float32Array(n * 3);
  for (const b of order) qv[b.name] = new Float32Array(n * 4);
  const hipRatio = dstRef.pos.Hips.y / Math.max(0.01, srcRef.pos.Hips.y);
  const tmp = new THREE.Quaternion(), pw = new THREE.Quaternion();
  for (let i = 0; i < n; i++) {
    const t = Math.min(clip.duration, (i / (n - 1)) * clip.duration);
    times[i] = t;
    mixer.setTime(t);
    srcRoot.updateMatrixWorld(true);
    for (const b of order) {
      const k = boneKey(b.name);
      const s = sb[k];
      // world delta from the reference pose, applied to the destination's reference
      const sw = s.getWorldQuaternion(new THREE.Quaternion());
      const want = sw.multiply(tmp.copy(srcRef.rot[k]).invert()).multiply(dstRef.rot[k]);
      b.parent.getWorldQuaternion(pw);
      b.quaternion.copy(pw.invert().multiply(want));
      b.updateMatrixWorld(true);
      b.quaternion.toArray(qv[b.name], i * 4);
    }
    // hips: keep only the vertical bob (clips are in place), scaled to the new body
    const sh = sb.Hips.getWorldPosition(new THREE.Vector3());
    const wantPos = dstRef.pos.Hips.clone();
    wantPos.y += (sh.y - srcRef.pos.Hips.y) * hipRatio;
    const local = db.Hips.parent.worldToLocal(wantPos.clone());
    local.toArray(hipY, i * 3);
  }
  mixer.stopAllAction();
  const tracks = order.map((b) => new THREE.QuaternionKeyframeTrack(`${b.name}.quaternion`, times, qv[b.name]));
  tracks.push(new THREE.VectorKeyframeTrack(`${db.Hips.name}.position`, times, hipY));
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

function inPlace(clip) {
  return clip.clone(); // the library clips are already in place; hips keep their vertical bob
}

function buildClips(key, L, src) {
  const out = {};
  const want = ['idle', 'walk', 'run', 'agree', 'headShake', 'sad_pose', 'sneak_pose'];
  if (key === SOURCE) {
    for (const n of want) out[n] = inPlace(src.gltf.animations.find((a) => a.name === n));
    return out;
  }
  const srcRoot = SkeletonUtils.clone(src.gltf.scene);
  const dstRoot = SkeletonUtils.clone(L.gltf.scene);
  const srcRef = refPose(srcRoot, src.gltf, MODELS[SOURCE].ref);
  const dstRef = refPose(dstRoot, L.gltf, L.def.ref);
  for (const n of want) {
    const native = L.def.native?.[n];
    if (native) out[n] = inPlace(L.gltf.animations.find((a) => a.name === native));
    else out[n] = retarget(srcRoot, srcRef, src.gltf.animations.find((a) => a.name === n), dstRoot, dstRef);
  }
  return out;
}

// --- one character instance -------------------------------------------------------

const _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _e = new THREE.Euler();

// spec: { model: 'michelle'|'vanguard'|'xbot', tint, hologram, glow, height }
export function makeActor(spec = {}) {
  const key = MODELS[spec.model] ? spec.model : 'michelle';
  const L = loaded[key];
  const root = new THREE.Group();
  const pivot = new THREE.Group(); // turns the model to face +Z and scales it to height
  root.add(pivot);
  const model = SkeletonUtils.clone(L.gltf.scene);
  pivot.add(model);
  pivot.rotation.y = L.def.facing;
  model.updateMatrixWorld(true);
  const bones = bonesByKey(model);
  const scale = (spec.height || L.def.height) / L.def.height;
  pivot.scale.setScalar(scale);

  // materials: shared per look; holograms glow, tints recolour armour
  const mats = [];
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = !spec.hologram;
    o.receiveShadow = !spec.hologram;
    o.frustumCulled = false; // skinned bounds don't follow the animation
    const list = Array.isArray(o.material) ? o.material : [o.material];
    const next = list.map((m) => {
      let n;
      if (spec.hologram) {
        n = new THREE.MeshStandardMaterial({ color: spec.glow || 0x8fe0ff, emissive: spec.glow || 0x8fe0ff, emissiveIntensity: 0.55, transparent: true, opacity: 0.55, depthWrite: false, roughness: 0.3 });
      } else {
        n = m.clone();
        if (spec.tint && !/visor/i.test(m.name)) n.color = new THREE.Color(spec.tint);
        n.envMapIntensity = 0.6;
      }
      mats.push(n);
      return n;
    });
    o.material = Array.isArray(o.material) ? next : next[0];
  });

  // animation
  const mixer = new THREE.AnimationMixer(model);
  const A = {};
  for (const [n, c] of Object.entries(L.clips)) A[n] = mixer.clipAction(c);
  for (const n of ['idle', 'walk', 'run']) {
    A[n].play();
    A[n].setEffectiveWeight(n === 'idle' ? 1 : 0);
  }
  // gestures play on top as additive layers
  const add = {};
  for (const n of ['agree', 'headShake']) {
    const c = L.clips[n].clone();
    THREE.AnimationUtils.makeClipAdditive(c);
    c.tracks = c.tracks.filter((t) => /Spine|Neck|Head|Shoulder|Arm|ForeArm|Hand/.test(t.name));
    add[n] = mixer.clipAction(c);
    add[n].setLoop(THREE.LoopOnce, 1);
    add[n].clampWhenFinished = false;
  }
  A.walk.time = 0;
  A.run.time = 0;

  // hands: attach points that cancel the skeleton's centimetre scale
  const hand = (b) => {
    const h = new THREE.Group();
    if (!b) return h;
    b.add(h);
    b.updateMatrixWorld(true);
    const ws = b.getWorldScale(new THREE.Vector3());
    h.scale.setScalar(1 / Math.max(1e-4, ws.x / scale));
    h.position.set(0, 9, 3); // palm
    return h;
  };
  const handL = hand(bones.LeftHand);
  const handR = hand(bones.RightHand);

  const w = { idle: 1, walk: 0, run: 0, air: 0 };
  let phase = 0, talking = false, talkT = 0, look = null, lastLook = null, waveT = -1;
  let lookK = 0;

  const U = root.userData;
  Object.assign(U, {
    model, bones, mixer, handL, handR, head: bones.Head, spec: { ...spec, model: key }, actor: true,
    setTalking(on) { talking = on; },
    lookAt(p) { look = p ? p.clone() : null; },
    wave() { waveT = 0; },
    setOpacity(a) { for (const m of mats) { m.transparent = a < 1 || !!spec.hologram; m.opacity = spec.hologram ? 0.55 * a : a; } },
    animate(dt, speed, t, airborne = false) {
      dt = Math.min(dt, 0.1);
      // locomotion weights, eased so states never snap
      const ease = 1 - Math.exp(-dt * 8);
      const tw = { idle: 0, walk: 0, run: 0, air: airborne ? 1 : 0 };
      if (!airborne) {
        if (speed < 0.15) tw.idle = 1;
        else if (speed < 2.6) { const k = Math.min(1, speed / 1.2); tw.idle = 1 - k; tw.walk = k; }
        else { const k = Math.min(1, (speed - 2.6) / 1.4); tw.walk = 1 - k; tw.run = k; }
      }
      for (const k of Object.keys(w)) w[k] += (tw[k] - w[k]) * (k === 'air' ? 1 - Math.exp(-dt * 10) : ease);
      // a shared stride phase keeps walk and run feet in step while blending,
      // advanced at the rate that matches the ground speed (no foot sliding)
      const wd = A.walk.getClip().duration, rd = A.run.getClip().duration;
      const rw = speed / WALK_SPEED / wd, rr = speed / RUN_SPEED / rd;
      const ws = w.walk + w.run;
      const rate = ws > 0.01 ? (w.walk * rw + w.run * rr) / ws : 0;
      phase = (phase + dt * THREE.MathUtils.clamp(rate, 0, 2.2)) % 1;
      A.walk.time = phase * wd;
      A.run.time = phase * rd;
      A.walk.timeScale = 0;
      A.run.timeScale = 0;
      // in the air: hold a stride at full extension (a leap)
      if (w.air > 0.01) A.run.time = A.run.getClip().duration * 0.25;
      A.idle.setEffectiveWeight(w.idle * (1 - w.air));
      A.walk.setEffectiveWeight(w.walk * (1 - w.air));
      A.run.setEffectiveWeight(Math.max(w.run * (1 - w.air), w.air));
      // talking: an occasional nod or shake layered on top
      if (talking) {
        talkT -= dt;
        if (talkT <= 0) {
          const g = Math.random() < 0.7 ? add.agree : add.headShake;
          g.reset().setEffectiveWeight(0.35 + Math.random() * 0.25).play();
          talkT = 2.2 + Math.random() * 1.8;
        }
      }
      mixer.update(dt);
      // after the mixer: head look-at and the wave, blended in smoothly (world space,
      // so they work the same on every skeleton)
      const head = bones.Head;
      lookK += ((look ? 1 : 0) - lookK) * (1 - Math.exp(-dt * 4));
      if (head && lookK > 0.01 && (look || lastLook)) {
        if (look) lastLook = look;
        root.updateMatrixWorld(true);
        const hp = head.getWorldPosition(new THREE.Vector3());
        const rootQ = root.getWorldQuaternion(new THREE.Quaternion());
        const dir = _v.copy(lastLook).sub(hp).applyQuaternion(rootQ.clone().invert()).normalize();
        const yaw = THREE.MathUtils.clamp(Math.atan2(dir.x, dir.z), -1.1, 1.1);
        const pitch = THREE.MathUtils.clamp(Math.asin(THREE.MathUtils.clamp(-dir.y, -1, 1)), -0.45, 0.4);
        const turn = new THREE.Quaternion().setFromEuler(_e.set(pitch, yaw, 0, 'YXZ'));
        const worldTurn = rootQ.clone().multiply(turn).multiply(rootQ.clone().invert());
        const pw = head.parent.getWorldQuaternion(new THREE.Quaternion());
        const headW = pw.clone().multiply(head.quaternion);
        const local = pw.invert().multiply(worldTurn.multiply(headW));
        head.quaternion.slerp(local, lookK * 0.8);
      }
      if (waveT >= 0) {
        waveT += dt;
        const k = Math.sin(Math.min(1, waveT / 1.8) * Math.PI);
        const arm = bones.RightArm, fore = bones.RightForeArm;
        if (arm && fore) {
          root.updateMatrixWorld(true);
          const rootQ = root.getWorldQuaternion(new THREE.Quaternion());
          const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(rootQ);
          const up = new THREE.Vector3(0, 1, 0).applyQuaternion(rootQ);
          const rot = (bone, axis, ang) => {
            const pw = bone.parent.getWorldQuaternion(new THREE.Quaternion());
            const bw = pw.clone().multiply(bone.quaternion);
            const nw = new THREE.Quaternion().setFromAxisAngle(axis, ang).multiply(bw);
            bone.quaternion.copy(pw.invert().multiply(nw));
            bone.updateMatrixWorld(true);
          };
          rot(arm, fwd, 1.25 * k); // raise the right arm out to the side
          rot(fore, fwd, 0.9 * k + Math.sin(waveT * 11) * 0.35 * k); // and wave the forearm
          void up;
        }
        if (waveT > 1.8) waveT = -1;
      }
    },
  });
  // aliases for older callers
  U.armR = bones.RightArm;
  U.torso = bones.Spine;
  U.hips = bones.Hips;
  return root;
}
