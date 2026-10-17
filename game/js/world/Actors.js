// Characters built from modelled, rigged models driven by motion capture.
// Used for everyone you see: the player, Juno, the crew, the Custodian, the Other.
//
// Three kinds of rig share one runtime:
// - Mixamo models (Michelle, X Bot). X Bot's clips are the motion library.
// - VRM avatars (Nova): the library is retargeted onto them.
// - Quaternius modular people (the crew and some looks): their own clips.
// Bones are mapped onto Mixamo names (boneKey), so retargeting, hands, the head
// and the wave work the same on every rig.
//
// - Locomotion blends idle / walk / run by speed. Each clip's ground speed is
//   measured from its feet at load time, and playback is matched to how fast
//   the character actually moves, so feet don't slide.
// - On top of the mixer: the head turns to look at whoever you talk to, nods
//   while talking, a wave, a leap pose in the air. VRM faces blink and their
//   mouths move with the voice.
// - Same userData API as world/humans.js (animate, setTalking, lookAt, wave,
//   setOpacity, handL, handR, head), so the rest of the game is unchanged.
//
// Models are loaded on demand (loadActors(keys)); credits in assets/characters/CREDITS.md.
import * as THREE from '../../vendor/three.module.min.js';
import { GLTFLoader } from '../../vendor/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from '../../vendor/addons/utils/SkeletonUtils.js';
import { mergeVertices } from '../../vendor/addons/utils/BufferGeometryUtils.js';

const Q = { idle: 'Idle', walk: 'Walk', run: 'Run' }; // Quaternius clip names
const GEAR = /pistol|gun|rifle|sword|knife|axe/i; // props some outfits carry: not on this ship
export const MODELS = {
  // the motion library (and the Custodian's hologram)
  xbot: { file: 'Xbot.glb', rig: 'mixamo', height: 1.78 },
  // player looks
  nova: { file: 'Nova.glb', rig: 'vrm', height: 1.64, face: true },
  ren: { file: 'Michelle.glb', rig: 'mixamo', ref: 'TPose', height: 1.66 },
  scifi: { file: 'women_SciFi.glb', rig: 'quat', native: Q, height: 1.7, hide: GEAR },
  spacer: { file: 'men_Spacesuit.glb', rig: 'quat', native: Q, height: 1.8, hide: GEAR },
  // crew
  w_casual: { file: 'women_Casual.glb', rig: 'quat', native: Q, height: 1.66, hide: GEAR },
  w_suit: { file: 'women_Suit.glb', rig: 'quat', native: Q, height: 1.7, hide: GEAR },
  w_punk: { file: 'women_Punk.glb', rig: 'quat', native: Q, height: 1.68, hide: GEAR },
  w_worker: { file: 'women_Worker.glb', rig: 'quat', native: Q, height: 1.68, hide: GEAR },
  w_soldier: { file: 'women_Soldier.glb', rig: 'quat', native: Q, height: 1.72, hide: GEAR },
  w_adventurer: { file: 'women_Adventurer.glb', rig: 'quat', native: Q, height: 1.68, hide: GEAR },
  m_casual: { file: 'men_Casual_2.glb', rig: 'quat', native: Q, height: 1.8, hide: GEAR },
  m_hoodie: { file: 'men_Casual_Hoodie.glb', rig: 'quat', native: Q, height: 1.78, hide: GEAR },
  m_suit: { file: 'men_Suit.glb', rig: 'quat', native: Q, height: 1.82, hide: GEAR },
  m_punk: { file: 'men_Punk.glb', rig: 'quat', native: Q, height: 1.78, hide: GEAR },
  m_worker: { file: 'men_Worker.glb', rig: 'quat', native: Q, height: 1.8, hide: GEAR },
  m_swat: { file: 'men_Swat.glb', rig: 'quat', native: Q, height: 1.84, hide: GEAR },
  m_adventurer: { file: 'men_Adventurer.glb', rig: 'quat', native: Q, height: 1.8, hide: GEAR },
};
const SOURCE = 'xbot'; // clip library: idle, walk, run (+ poses)

const loaded = {};
const pending = {};
let base = 'assets/characters/';
let loader = null;

export function actorsReady(key) {
  return key ? !!loaded[key] : !!loaded[SOURCE];
}
export const actorLoaded = (key) => !!loaded[key];

export const loadErrors = [];

// glTF JSON copies (for hosts that don't serve .glb) carry their binary as a
// data: URI. Some hosts forbid fetching data: URIs, so decode it here and hand
// the loader an in-memory .glb instead.
async function fetchModel(url) {
  if (!url.endsWith('.json')) return loader.loadAsync(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const j = await res.json();
  const b64 = j.buffers[0].uri.slice(j.buffers[0].uri.indexOf(',') + 1);
  delete j.buffers[0].uri;
  const raw = atob(b64);
  const bin = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bin[i] = raw.charCodeAt(i);
  let js = new TextEncoder().encode(JSON.stringify(j));
  const jsLen = Math.ceil(js.length / 4) * 4, binLen = Math.ceil(bin.length / 4) * 4;
  const glb = new Uint8Array(12 + 8 + jsLen + 8 + binLen);
  const dv = new DataView(glb.buffer);
  dv.setUint32(0, 0x46546c67, true);
  dv.setUint32(4, 2, true);
  dv.setUint32(8, glb.length, true);
  dv.setUint32(12, jsLen, true);
  dv.setUint32(16, 0x4e4f534a, true);
  glb.fill(0x20, 20, 20 + jsLen);
  glb.set(js, 20);
  dv.setUint32(20 + jsLen, binLen, true);
  dv.setUint32(24 + jsLen, 0x004e4942, true);
  glb.set(bin, 28 + jsLen);
  js = null;
  return loader.parseAsync(glb.buffer, '');
}

// Load models (all of them by default). Resolves to true if every one loaded.
// (Hosts that can't serve .glb get glTF JSON copies: window.AZ_MODEL_EXT = '.json'.)
export function loadActors(keys = Object.keys(MODELS), dir) {
  if (dir) base = dir;
  if (!loader) {
    loader = new GLTFLoader(); // plain glTF only: no WebAssembly decoders (some hosts forbid them)
  }
  const one = (key) => {
    if (pending[key]) return pending[key];
    const m = MODELS[key];
    pending[key] = (async () => {
      // the clip library comes first: retargeted rigs need it
      if (key !== SOURCE && m.rig !== 'quat') await one(SOURCE);
      const g = await fetchModel(base + (globalThis.AZ_MODEL_EXT ? m.file.replace(/\.glb$/, globalThis.AZ_MODEL_EXT) : m.file));
      const L = { gltf: g, def: m, key };
      prepare(L);
      L.clips = buildClips(key, L, loaded[SOURCE]);
      L.speeds = measure(L);
      loaded[key] = L;
      return true;
    })().catch((e) => {
      console.warn(`Character ${key} could not load`, e);
      loadErrors.push(`${key}: ${e?.message || e}`);
      return false;
    });
    return pending[key];
  };
  return Promise.all([...new Set([SOURCE, ...keys])].filter((k) => MODELS[k]).map(one)).then((r) => r.every(Boolean));
}

// --- rigs ---------------------------------------------------------------------------

const VRM_BONES = {
  C_Hips: 'Hips', C_Spine: 'Spine', C_Chest: 'Spine1', C_UpperChest: 'Spine2', C_Neck: 'Neck', C_Head: 'Head',
  Shoulder: 'Shoulder', UpperArm: 'Arm', LowerArm: 'ForeArm', Hand: 'Hand', UpperLeg: 'UpLeg', LowerLeg: 'Leg', Foot: 'Foot', ToeBase: 'ToeBase',
  Thumb: 'HandThumb', Index: 'HandIndex', Middle: 'HandMiddle', Ring: 'HandRing', Little: 'HandPinky',
};
const QUAT_BONES = {
  Hips: 'Hips', Abdomen: 'Spine', Torso: 'Spine1', Chest: 'Spine2', Neck: 'Neck', Head: 'Head',
  Shoulder: 'Shoulder', UpperArm: 'Arm', LowerArm: 'ForeArm', Wrist: 'Hand', UpperLeg: 'UpLeg', LowerLeg: 'Leg', Foot: 'Foot',
  Thumb: 'HandThumb', Index: 'HandIndex', Middle: 'HandMiddle', Ring: 'HandRing', Pinky: 'HandPinky',
};

// a bone's name on the shared (Mixamo) skeleton, or null
function boneKey(name, rig) {
  if (rig === 'vrm') {
    const m = /^J_Bip_(C_\w+|[LR]_)([A-Za-z]*?)(\d?)$/.exec(name);
    if (!m) return null;
    if (m[1].startsWith('C_')) return VRM_BONES[m[1]] || null;
    const k = VRM_BONES[m[2]];
    return k ? (m[1] === 'L_' ? 'Left' : 'Right') + k + m[3] : null;
  }
  if (rig === 'quat') {
    const m = /^([A-Za-z]+?)(\d?)([LR]?)$/.exec(name);
    if (!m || !QUAT_BONES[m[1]]) return null;
    const side = m[3] === 'L' ? 'Left' : m[3] === 'R' ? 'Right' : '';
    if (!side && !['Hips', 'Abdomen', 'Torso', 'Chest', 'Neck', 'Head'].includes(m[1])) return null;
    return side + QUAT_BONES[m[1]] + m[2];
  }
  return name.replace(/^mixamorig[:_]?/, '');
}

function bonesByKey(root, rig) {
  const m = {};
  root.traverse((o) => {
    if (!o.isBone) return;
    const k = boneKey(o.name, rig);
    if (k && !m[k]) m[k] = o;
  });
  return m;
}

// per model, once: natural size, and what to hide
function prepare(L) {
  const s = L.gltf.scene;
  s.traverse((o) => {
    if (L.def.hide && (L.def.hide.test(o.name) || L.def.hide.test(o.material?.name || ''))) o.visible = false;
    // the low-poly cast is flat-shaded; weld its faces and smooth the normals so
    // skin and cloth read as rounded forms instead of facets
    if (L.def.rig === 'quat' && o.isMesh) {
      const g = new THREE.BufferGeometry();
      // plain float copies (the files are quantized and interleaved)
      for (const [name, a] of Object.entries(o.geometry.attributes)) {
        if (name === 'normal') continue;
        const arr = new Float32Array(a.count * a.itemSize);
        for (let i = 0; i < a.count; i++) for (let c = 0; c < a.itemSize; c++) arr[i * a.itemSize + c] = a.getComponent(i, c);
        g.setAttribute(name, new THREE.BufferAttribute(arr, a.itemSize));
      }
      if (o.geometry.index) g.setIndex(o.geometry.index.clone());
      for (const gr of o.geometry.groups) g.addGroup(gr.start, gr.count, gr.materialIndex);
      const m = mergeVertices(g, 1e-4);
      m.computeVertexNormals();
      o.geometry = m;
    }
  });
  // VRM node constraints (sleeves and twist bones follow the arms and legs)
  const nodes = L.gltf.parser.json.nodes;
  L.constraints = [];
  s.traverse((o) => {
    const c = o.userData.gltfExtensions?.VRMC_node_constraint?.constraint;
    if (!c) return;
    const kind = c.aim ? 'aim' : c.roll ? 'roll' : c.rotation ? 'rotation' : null;
    if (!kind) return;
    const d = c[kind];
    L.constraints.push({ kind, name: o.name, source: nodes[d.source].name, weight: d.weight ?? 1, axis: d.aimAxis || d.rollAxis });
  });
  L.constraints.sort((a, b) => (a.kind === 'aim' ? 0 : 1) - (b.kind === 'aim' ? 0 : 1));
  s.updateMatrixWorld(true);
  const box = new THREE.Box3();
  s.traverse((o) => { if (o.isMesh && o.visible) box.expandByObject(o); });
  L.nativeHeight = Math.max(0.01, box.max.y - box.min.y);
}

// Pose a model in its reference pose (a T-pose clip, or the rest pose) and record world transforms.
function refPose(root, gltf, refName, rig) {
  const mixer = new THREE.AnimationMixer(root);
  if (refName) {
    mixer.clipAction(gltf.animations.find((a) => a.name === refName)).play();
    mixer.update(0);
  }
  root.updateMatrixWorld(true);
  const rot = {}, pos = {};
  for (const [k, b] of Object.entries(bonesByKey(root, rig))) {
    rot[k] = b.getWorldQuaternion(new THREE.Quaternion());
    pos[k] = b.getWorldPosition(new THREE.Vector3());
  }
  mixer.stopAllAction();
  return { rot, pos };
}

// Retarget one clip from the source model to the destination, through world space.
function retarget(src, srcRef, clip, dst, dstRef, fps = 30) {
  const sb = bonesByKey(src.root, src.rig), db = bonesByKey(dst.root, dst.rig);
  const order = [];
  dst.root.traverse((o) => {
    const k = o.isBone && boneKey(o.name, dst.rig);
    if (k && sb[k] && db[k] === o) order.push(o);
  });
  const mixer = new THREE.AnimationMixer(src.root);
  mixer.clipAction(clip).play();
  const n = Math.max(2, Math.round(clip.duration * fps) + 1);
  const times = new Float32Array(n);
  const qv = {}, hipY = new Float32Array(n * 3);
  for (const b of order) qv[b.uuid] = new Float32Array(n * 4);
  const hipRatio = dstRef.pos.Hips.y / Math.max(0.01, srcRef.pos.Hips.y);
  const tmp = new THREE.Quaternion(), pw = new THREE.Quaternion();
  for (let i = 0; i < n; i++) {
    const t = Math.min(clip.duration, (i / (n - 1)) * clip.duration);
    times[i] = t;
    mixer.setTime(t);
    src.root.updateMatrixWorld(true);
    for (const b of order) {
      const k = boneKey(b.name, dst.rig);
      // world delta from the reference pose, applied to the destination's reference
      const want = sb[k].getWorldQuaternion(new THREE.Quaternion()).multiply(tmp.copy(srcRef.rot[k]).invert()).multiply(dstRef.rot[k]);
      b.parent.getWorldQuaternion(pw);
      b.quaternion.copy(pw.invert().multiply(want));
      b.updateMatrixWorld(true);
      b.quaternion.toArray(qv[b.uuid], i * 4);
    }
    // hips: keep only the vertical bob (clips are in place), scaled to the new body
    const sh = sb.Hips.getWorldPosition(new THREE.Vector3());
    const wantPos = dstRef.pos.Hips.clone();
    wantPos.y += (sh.y - srcRef.pos.Hips.y) * hipRatio;
    db.Hips.parent.worldToLocal(wantPos).toArray(hipY, i * 3);
  }
  mixer.stopAllAction();
  const tracks = order.map((b) => new THREE.QuaternionKeyframeTrack(`${b.name}.quaternion`, times, qv[b.uuid]));
  tracks.push(new THREE.VectorKeyframeTrack(`${db.Hips.name}.position`, times, hipY));
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

// in-place: drop any root motion on the hips' horizontal axes
function inPlace(clip, hipsName) {
  const c = clip.clone();
  for (const t of c.tracks) {
    if (t.name === `${hipsName}.position` || /^Root\.position$/.test(t.name)) {
      const v = t.values;
      for (let i = 3; i < v.length; i += 3) {
        v[i] = v[0];
        v[i + 2] = v[2];
      }
    }
  }
  return c;
}

function buildClips(key, L, src) {
  const out = {};
  const rig = L.def.rig;
  const hips = bonesByKey(L.gltf.scene, rig).Hips?.name;
  if (key === SOURCE) {
    for (const n of ['idle', 'walk', 'run']) out[n] = inPlace(L.gltf.animations.find((a) => a.name === n), hips);
    return out;
  }
  if (L.def.native) {
    for (const [n, name] of Object.entries(L.def.native)) out[n] = inPlace(L.gltf.animations.find((a) => a.name === name), hips);
    return out;
  }
  const s = { root: SkeletonUtils.clone(src.gltf.scene), rig: src.def.rig };
  const d = { root: SkeletonUtils.clone(L.gltf.scene), rig };
  const srcRef = refPose(s.root, src.gltf, src.def.ref, s.rig);
  const dstRef = refPose(d.root, L.gltf, L.def.ref, rig);
  for (const n of ['idle', 'walk', 'run']) out[n] = retarget(s, srcRef, src.gltf.animations.find((a) => a.name === n), d, dstRef);
  return out;
}

// How far one second of each gait carries the body, in body heights: from how far
// the feet sweep backwards relative to the hips (a stride is two sweeps).
function measure(L) {
  const root = SkeletonUtils.clone(L.gltf.scene);
  const b = bonesByKey(root, L.def.rig);
  const mixer = new THREE.AnimationMixer(root);
  const out = {};
  for (const n of ['walk', 'run']) {
    const clip = L.clips[n];
    mixer.stopAllAction();
    mixer.clipAction(clip).play();
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 40; i++) {
      mixer.setTime((i / 40) * clip.duration);
      root.updateMatrixWorld(true);
      const f = b.LeftFoot.getWorldPosition(new THREE.Vector3()).sub(b.Hips.getWorldPosition(new THREE.Vector3()));
      lo = Math.min(lo, f.z);
      hi = Math.max(hi, f.z);
    }
    out[n] = (2 * (hi - lo)) / clip.duration / L.nativeHeight;
  }
  // sane bounds (m/s for a 1.75 m person: walk 0.9-2.0, run 2.4-6)
  out.walk = THREE.MathUtils.clamp(out.walk || 0.8, 0.5, 1.15);
  out.run = THREE.MathUtils.clamp(out.run || 2.2, 1.4, 3.4);
  mixer.stopAllAction();
  return out;
}

// --- one character instance -------------------------------------------------------

// a soft rim light: edges facing away from the camera catch a little light, so
// characters separate from the walls behind them
function addRim(mat, color = 0xdff2ff, strength = 0.35) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.rimColor = { value: new THREE.Color(color) };
    sh.uniforms.rimStrength = { value: strength };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 rimColor;\nuniform float rimStrength;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float rimF = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
        totalEmissiveRadiance += rimColor * rimStrength * pow(rimF, 3.0);`);
  };
  mat.customProgramCacheKey = () => `rim${strength}`;
}

let blobTex = null;
function contactShadow(radius) {
  if (!blobTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(20,30,40,0.45)');
    gr.addColorStop(0.6, 'rgba(20,30,40,0.18)');
    gr.addColorStop(1, 'rgba(20,30,40,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    blobTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.015;
  m.renderOrder = -1;
  return m;
}

const _v = new THREE.Vector3(), _e = new THREE.Euler();

// world-space rotation of a bone around an axis (works on any rig)
function rotWorld(bone, axis, ang) {
  const pw = bone.parent.getWorldQuaternion(new THREE.Quaternion());
  const nw = new THREE.Quaternion().setFromAxisAngle(axis, ang).multiply(pw.clone().multiply(bone.quaternion));
  bone.quaternion.copy(pw.invert().multiply(nw));
  bone.updateMatrixWorld(true);
}

// spec: { model, tint, hologram, glow, height, hair, top, bottom }
export function makeActor(spec = {}) {
  let key = MODELS[spec.model] && loaded[spec.model] ? spec.model : null;
  if (!key) key = ['ren', 'nova', SOURCE].find((k) => loaded[k]);
  const L = loaded[key];
  const rig = L.def.rig;
  const root = new THREE.Group();
  const pivot = new THREE.Group(); // scales the model to its height
  root.add(pivot);
  const model = SkeletonUtils.clone(L.gltf.scene);
  pivot.add(model);
  const height = spec.height || L.def.height;
  const scale = height / L.nativeHeight;
  pivot.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const bones = bonesByKey(model, rig);

  // materials: holograms glow, looks recolour hair and clothes
  const mats = [];
  const faces = [];
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = !spec.hologram;
    o.receiveShadow = !spec.hologram;
    o.frustumCulled = false; // skinned bounds don't follow the animation
    if (o.morphTargetDictionary && Object.keys(o.morphTargetDictionary).some((k) => /Fcl_/.test(k))) faces.push(o);
    const list = Array.isArray(o.material) ? o.material : [o.material];
    const next = list.map((m) => {
      let n;
      if (spec.hologram) {
        n = new THREE.MeshStandardMaterial({ color: spec.glow || 0x8fe0ff, emissive: spec.glow || 0x8fe0ff, emissiveIntensity: 0.55, transparent: true, opacity: 0.55, depthWrite: false, roughness: 0.3 });
      } else {
        n = m.clone();
        const name = m.name || '';
        if (rig === 'vrm') {
          // anime skin and cloth: soft and matte
          n.roughness = 0.82;
          n.metalness = 0;
          n.envMapIntensity = 0.35;
          n.emissive?.setRGB(0, 0, 0); // MToon rim glow doesn't apply here
          if (/_SKIN$/.test(name)) n.color = new THREE.Color(0xffe9dc); // a little warmth under scene light
          if (/HAIR/i.test(name) && spec.hair !== undefined) n.color = new THREE.Color(spec.hair);
          if (/Tops/i.test(name) && spec.top !== undefined) n.color = new THREE.Color(spec.top);
          if (/Bottoms/i.test(name) && spec.bottom !== undefined) n.color = new THREE.Color(spec.bottom);
          if (/_(FACE|EYE)$/.test(name)) {
            n.transparent = true; // brows, lashes and highlights are cut-outs
            n.alphaTest = 0.4;
          }
        } else {
          if (spec.tint && !/visor|skin|face|eye|hair/i.test(name)) n.color = new THREE.Color(spec.tint);
          n.envMapIntensity = 0.6;
        }
      }
      if (!spec.hologram && n.isMeshStandardMaterial) addRim(n);
      mats.push(n);
      return n;
    });
    o.material = Array.isArray(o.material) ? next : next[0];
  });
  const morph = (re) => {
    const list = [];
    for (const f of faces) for (const [k, i] of Object.entries(f.morphTargetDictionary)) if (re.test(k)) list.push([f, i]);
    return (w) => { for (const [f, i] of list) f.morphTargetInfluences[i] = w; };
  };
  const blinkM = morph(/Fcl_EYE_Close$/), mouthA = morph(/Fcl_MTH_A$/), mouthO = morph(/Fcl_MTH_O$/), smile = morph(/Fcl_ALL_Joy$/);

  if (!spec.hologram) root.add(contactShadow(height * 0.24));

  // animation
  const mixer = new THREE.AnimationMixer(model);
  const A = {};
  for (const n of ['idle', 'walk', 'run']) {
    A[n] = mixer.clipAction(L.clips[n]);
    A[n].play();
    A[n].setEffectiveWeight(n === 'idle' ? 1 : 0);
    A[n].timeScale = n === 'idle' ? 1 : 0;
  }
  const walkSpeed = L.speeds.walk * height, runSpeed = L.speeds.run * height;

  // hands: attach points at the palm, cancelling the skeleton's own scale
  const hand = (b) => {
    const h = new THREE.Group();
    if (!b) return h;
    b.add(h);
    b.updateMatrixWorld(true);
    const ws = b.getWorldScale(new THREE.Vector3());
    h.scale.setScalar(1 / Math.max(1e-4, ws.x / scale));
    const finger = b.children.find((c) => c.isBone && /Middle/i.test(c.name)) || b.children.find((c) => c.isBone);
    if (finger) h.position.copy(finger.position).multiplyScalar(0.55);
    return h;
  };
  const handL = hand(bones.LeftHand);
  const handR = hand(bones.RightHand);

  // node constraints, bound to this instance's bones
  const AX = { PositiveX: [1, 0, 0], NegativeX: [-1, 0, 0], PositiveY: [0, 1, 0], NegativeY: [0, -1, 0], PositiveZ: [0, 0, 1], NegativeZ: [0, 0, -1], X: [1, 0, 0], Y: [0, 1, 0], Z: [0, 0, 1] };
  const cons = (L.constraints || []).map((c) => {
    const dst = model.getObjectByName(c.name), src = model.getObjectByName(c.source);
    return dst && src && { ...c, dst, src, rest: dst.quaternion.clone(), srcRest: src.quaternion.clone(), ax: new THREE.Vector3(...AX[c.axis]) };
  }).filter(Boolean);
  const solveConstraints = () => {
    const pw = new THREE.Quaternion(), a = new THREE.Vector3(), b = new THREE.Vector3(), q = new THREE.Quaternion();
    for (const c of cons) {
      if (c.kind === 'aim') {
        c.dst.parent.getWorldQuaternion(pw);
        const restW = pw.clone().multiply(c.rest);
        const from = c.ax.clone().applyQuaternion(restW);
        const to = c.src.getWorldPosition(a).sub(c.dst.getWorldPosition(b)).normalize();
        q.setFromUnitVectors(from, to).multiply(restW);
        c.dst.quaternion.copy(c.rest).slerp(pw.invert().multiply(q), c.weight);
      } else {
        // the source's twist around the axis, relative to its rest pose
        const d = c.srcRest.clone().invert().multiply(c.src.quaternion);
        const p = c.ax.clone().multiplyScalar(c.ax.dot(a.set(d.x, d.y, d.z)));
        q.set(p.x, p.y, p.z, d.w).normalize();
        c.dst.quaternion.copy(c.rest).multiply(new THREE.Quaternion().slerp(q, c.weight));
      }
      c.dst.updateMatrixWorld(true);
    }
  };

  const w = { idle: 1, walk: 0, run: 0, air: 0 };
  let phase = 0, talking = false, talkK = 0, talkT = 0, look = null, lastLook = null, waveT = -1, lookK = 0;
  let blinkT = 1 + Math.random() * 3, clock = Math.random() * 10;

  const U = root.userData;
  Object.assign(U, {
    model, bones, mixer, handL, handR, head: bones.Head, spec: { ...spec, model: key }, actor: true,
    setTalking(on) { talking = !!on; },
    lookAt(p) { look = p ? p.clone() : null; },
    wave() { waveT = 0; },
    setOpacity(a) { for (const m of mats) { m.transparent = a < 1 || !!spec.hologram || m.alphaTest > 0; m.opacity = spec.hologram ? 0.55 * a : a; } },
    animate(dt, speed, t, airborne = false) {
      dt = Math.min(dt, 0.1);
      clock += dt;
      // locomotion weights, eased so states never snap
      const ease = 1 - Math.exp(-dt * 8);
      const tw = { idle: 0, walk: 0, run: 0, air: airborne ? 1 : 0 };
      if (!airborne) {
        const mid = (walkSpeed + runSpeed) / 2;
        if (speed < 0.15) tw.idle = 1;
        else if (speed < mid) { const k = Math.min(1, speed / (walkSpeed * 0.8)); tw.idle = 1 - k; tw.walk = k; }
        else { const k = Math.min(1, (speed - mid) / (runSpeed - mid)); tw.walk = 1 - k; tw.run = k; }
      }
      for (const k of Object.keys(w)) w[k] += (tw[k] - w[k]) * (k === 'air' ? 1 - Math.exp(-dt * 10) : ease);
      // one stride phase for walk and run, advanced at the rate that matches the
      // ground speed, so the feet stay planted while the gaits blend
      const wd = A.walk.getClip().duration, rd = A.run.getClip().duration;
      const rw = speed / walkSpeed / wd, rr = speed / runSpeed / rd;
      const ws = w.walk + w.run;
      const rate = ws > 0.01 ? (w.walk * rw + w.run * rr) / ws : 0;
      phase = (phase + dt * THREE.MathUtils.clamp(rate, 0, 2.2)) % 1;
      A.walk.time = phase * wd;
      A.run.time = w.air > 0.01 ? rd * 0.25 : phase * rd; // in the air: a leap, mid-stride
      A.idle.setEffectiveWeight(w.idle * (1 - w.air));
      A.walk.setEffectiveWeight(w.walk * (1 - w.air));
      A.run.setEffectiveWeight(Math.max(w.run * (1 - w.air), w.air));
      mixer.update(dt);

      root.updateMatrixWorld(true);
      const rootQ = root.getWorldQuaternion(new THREE.Quaternion());
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(rootQ);
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(rootQ);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(rootQ);
      const head = bones.Head;

      // the head turns toward whoever you're talking to
      lookK += ((look ? 1 : 0) - lookK) * (1 - Math.exp(-dt * 4));
      if (head && lookK > 0.01 && (look || lastLook)) {
        if (look) lastLook = look;
        const hp = head.getWorldPosition(new THREE.Vector3());
        const dir = _v.copy(lastLook).sub(hp).applyQuaternion(rootQ.clone().invert()).normalize();
        const yaw = THREE.MathUtils.clamp(Math.atan2(dir.x, dir.z), -1.1, 1.1);
        const pitch = THREE.MathUtils.clamp(Math.asin(THREE.MathUtils.clamp(-dir.y, -1, 1)), -0.45, 0.4);
        const turn = new THREE.Quaternion().setFromEuler(_e.set(pitch, yaw, 0, 'YXZ'));
        const worldTurn = rootQ.clone().multiply(turn).multiply(rootQ.clone().invert());
        const pw = head.parent.getWorldQuaternion(new THREE.Quaternion());
        const local = pw.clone().invert().multiply(worldTurn.multiply(pw.multiply(head.quaternion)));
        head.quaternion.slerp(local, lookK * 0.8);
        head.updateMatrixWorld(true);
      }
      // talking: small nods and tilts in rhythm, the mouth moves
      talkK += ((talking ? 1 : 0) - talkK) * (1 - Math.exp(-dt * 6));
      if (talking) {
        talkT -= dt;
        if (talkT <= 0) talkT = 1.4 + Math.random() * 1.6;
      }
      if (head && talkK > 0.01) {
        const nod = (Math.sin(clock * 5.3) * 0.045 + Math.sin(clock * 2.1) * 0.03 + Math.max(0, Math.sin(talkT * 2.4)) * 0.05) * talkK;
        rotWorld(head, right, nod);
        rotWorld(head, fwd, Math.sin(clock * 1.3) * 0.04 * talkK);
      }
      if (faces.length) {
        const syl = Math.max(0, Math.sin(clock * 15.5) * 0.6 + Math.sin(clock * 9.1) * 0.4);
        mouthA(syl * 0.75 * talkK);
        mouthO(Math.max(0, Math.sin(clock * 6.3 + 1)) * 0.25 * talkK);
        smile(0.15 + 0.1 * (1 - talkK));
        blinkT -= dt;
        if (blinkT < 0) blinkT = 2.2 + Math.random() * 3.5;
        blinkM(blinkT < 0.13 ? Math.sin((blinkT / 0.13) * Math.PI) : 0);
      }
      // the wave: right arm out to the side, forearm waving
      if (waveT >= 0) {
        waveT += dt;
        const k = Math.sin(Math.min(1, waveT / 1.8) * Math.PI);
        const arm = bones.RightArm, fore = bones.RightForeArm;
        if (arm && fore) {
          rotWorld(arm, fwd, 1.25 * k);
          rotWorld(fore, fwd, 0.9 * k + Math.sin(waveT * 11) * 0.35 * k);
        }
        if (waveT > 1.8) waveT = -1;
      }
      if (cons.length) {
        root.updateMatrixWorld(true);
        solveConstraints();
      }
      void up;
    },
  });
  // aliases for older callers
  U.armR = bones.RightArm;
  U.torso = bones.Spine;
  U.hips = bones.Hips;
  U.animate(0, 0, 0, false);
  return root;
}
