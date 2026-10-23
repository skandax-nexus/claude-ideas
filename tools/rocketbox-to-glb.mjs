#!/usr/bin/env node
// Converts one Microsoft Rocketbox avatar (MIT licence; github.com/microsoft/Microsoft-Rocketbox)
// into a plain glTF binary for the game: game/assets/characters/rb_*.glb.
//
//   NODE_PATH=<dir with three@0.169 in node_modules> node tools/rocketbox-to-glb.mjs \
//     <Assets/Avatars/.../Name_01 dir> <out.glb> [colour px (1024)] [normal px (512)] [drop parts]
//   ... --all <Rocketbox checkout> <out dir>                         (Station Zero's set, AVATARS)
//   ... --edition lastversion <Rocketbox checkout> <out dir> [keys]  (THE LAST VERSION's people,
//       LV_AVATARS: named characters at 1024 px, crowds at 512 px)
//   ... --strip <file.glb ...>                                       (an older conversion without its node extras)
//
// - Any Rocketbox avatar: texture and material prefixes are letters then digits (f004_, the
//   children's cf001_ / cm012_, the soldiers' sm024_); children are rigged as Bip02 and their bones
//   are renamed Bip01_ (the game's rig, and the eye bones); RB_DROP lists parts whose triangles are
//   left out (the pistols).
//
// - Geometry: the FBX's single skinned mesh, centimetres -> metres, vertex colours
//   dropped, UVs flipped to glTF's top-left origin, triangles sorted so each
//   material is one draw call, vertices welded.
// - The eyeballs (triangles carried by the eye bones) get their own material
//   ("eye"), so the game can shade them glossy while the face stays skin.
// - Core glTF only (no extensions, no decoders): UVs as normalised uint16,
//   joints as uint8, weights as normalised uint8.
// - Textures from tools/rocketbox-textures.py (JPEG colour/normal/roughness,
//   PNG with alpha for hair, lashes and glasses), embedded in the binary.
// Credits and licence: game/assets/characters/CREDITS.md
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const threeDir = path.join(path.dirname(require.resolve('three')), '..'); // three r169 (NODE_PATH)
const THREE = await import(pathToFileURL(path.join(threeDir, 'build/three.module.js')).href);
const { FBXLoader } = await import(pathToFileURL(path.join(threeDir, 'examples/jsm/loaders/FBXLoader.js')).href);
const { GLTFExporter } = await import(pathToFileURL(path.join(threeDir, 'examples/jsm/exporters/GLTFExporter.js')).href);
const { mergeVertices } = await import(pathToFileURL(path.join(threeDir, 'examples/jsm/utils/BufferGeometryUtils.js')).href);

// The game's set: output name -> Rocketbox avatar (Assets/Avatars/<...>).
export const AVATARS = {
  rb_ren_f: 'Adults/Female_Adult_04', // Ren: leather jacket, khakis, boots
  rb_ren_m: 'Adults/Male_Adult_08', // Ren: rolled-up shirt, jeans
  rb_juno: 'Professions/Sports_Female_02', // Juno: vest top, work trousers
  rb_pilot_f: 'Professions/Pilot_Female_01', // navigator, captain
  rb_captain_m: 'Professions/Pilot_Male_01', // captain, navigator
  rb_doctor_f: 'Professions/Medical_Female_02', // medic, cryo technician
  rb_doctor_m: 'Professions/Medical_Male_03', // medic, cryo technician
  rb_engineer_m: 'Professions/Construction_Male_04', // chief engineer, Kade
  rb_office_f: 'Professions/Business_Female_02', // counselor, archivist, Varga
  rb_gardener_m: 'Professions/Gardener_Male_01', // botanist, Theo
};

// THE LAST VERSION OF EARTH's people (docs/lastversion/OVERHAUL.md §6): output name ->
// { src: Rocketbox avatar, px: colour texture size (normal and roughness maps at half) }.
// Named characters own their face at 1024 px; crowd people are small on screen, at 512 px.
export const LV_AVATARS = {
  // named (16)
  rb_child_m: { src: 'Children/Male_Child_01', px: 1024 }, // young Kai
  rb_mira: { src: 'Professions/Medical_Female_01', px: 1024 }, // Mira; Dr. Lin (same face)
  rb_child_f: { src: 'Children/Female_Child_01', px: 1024 }, // the Child in the Station
  rb_rook: { src: 'Professions/Business_Male_04', px: 1024 }, // Dr. Elias Rook
  rb_niko: { src: 'Adults/Male_Adult_15', px: 1024 }, // Niko
  rb_jun: { src: 'Professions/Business_Male_02', px: 1024 }, // Jun Park
  rb_tala: { src: 'Adults/Female_Adult_11', px: 1024 }, // Tala: her hair tied up (closing: Female_Adult_06 wore a hijab)
  rb_security_f: { src: 'Professions/Security_Female_01', px: 1024 }, // Officer Pryce
  rb_security_m: { src: 'Professions/Security_Male_01', px: 1024 }, // Officer Dale
  rb_elder: { src: 'Adults/Female_Adult_09', px: 1024 }, // the Elder, her hair greyed (closing: Female_Adult_10 wore a khimar and abaya)
  rb_ezra: { src: 'Adults/Male_Adult_03', px: 1024 }, // Ezra Moll, the Clockmaker
  rb_engineer_f: { src: 'Professions/Construction_Female_01', px: 1024 }, // Rhea Odum
  rb_soldier_m: { src: 'Professions/Military_Male_02', px: 1024 }, // Sergeant Brask
  rb_odile: { src: 'Adults/Female_Adult_02', px: 1024 }, // Nurse Odile
  rb_florist: { src: 'Adults/Female_Adult_14', px: 1024 }, // the Florist
  rb_warden: { src: 'Professions/Police_Male_04', px: 1024 }, // the District Warden
  // (U4 review) the named who wore Station Zero's faces: Juno's, Varga's, Kade's, Ren's FIELD JACKET
  rb_sera: { src: 'Adults/Female_Adult_07', px: 1024 }, // Sera Voss: a belted leather jacket, boots
  rb_mara: { src: 'Professions/Business_Female_03', px: 1024 }, // Mara Quill: a worn skirt suit
  rb_iven: { src: 'Professions/Construction_Male_02', px: 1024 }, // Iven Marr: overalls, a hard hat
  rb_gardener_f: { src: 'Adults/Female_Adult_01', px: 1024 }, // the Gardener of 2196: shirtsleeves, jeans
  // crowd (15)
  rb_civ_f1: { src: 'Adults/Female_Adult_15', px: 512 }, // commuter: blouse, skirt, boots
  rb_civ_f2: { src: 'Adults/Female_Adult_08', px: 512 }, // commuter: tee, jeans
  rb_civ_f3: { src: 'Adults/Female_Adult_12', px: 512 }, // 2196: hoodie
  rb_civ_m1: { src: 'Adults/Male_Adult_04', px: 512 }, // commuter: leather jacket over a hoodie
  rb_civ_m2: { src: 'Adults/Male_Adult_13', px: 512 }, // shopkeeper, older: argyle vest
  rb_courier: { src: 'Professions/Delivery_Male_01', px: 512 }, // courier: flannel, beanie
  rb_contractor: { src: 'Professions/Construction_Male_07', px: 512 }, // contractor: hi-vis, hard hat
  rb_medic_f: { src: 'Professions/Medical_Female_03', px: 512 }, // paramedic
  rb_child_m2: { src: 'Children/Male_Child_02', px: 512 }, // children (2049 and 2196)
  rb_child_f2: { src: 'Children/Female_Child_02', px: 512 }, // the settlement's children
  rb_trooper: { src: 'Professions/Military_Male_04', px: 512 }, // Continuum troops: helmet, plate carrier
  rb_scav: { src: 'Adults/Male_Adult_18', px: 512 }, // 2196 scavengers, hood up
  rb_trader: { src: 'Professions/Wood_Male_01', px: 512 }, // 2196 traders and engineers
  rb_surv_f: { src: 'Adults/Female_Adult_17', px: 512 }, // 2196 gardeners, medics, archivists (Female_Adult_09 is the Elder's now)
  // (U4 review) more faces for 2026/2049, so a crowd is not copies of a few
  rb_civ_m3: { src: 'Adults/Male_Adult_14', px: 512 }, // an older man: shirt, khakis
  rb_civ_f4: { src: 'Adults/Female_Adult_13', px: 512 }, // a woman in a waistcoat and jeans
  // (closing) the settlement's own people, three thousand years ago: faces with their own hair (no head cloths: the robe,
  // kurta, hijab and abaya avatars are gone from the edition), dressed in wool and linen by garments.js; two old men
  rb_elder_m: { src: 'Adults/Male_Adult_05', px: 512 }, // an old man, grey-bearded: the storyteller and the elders
  rb_sage_m: { src: 'Professions/Business_Male_07', px: 512 }, // an old man, bald: the astronomer, the sky-watchers' elders
  rb_vill_m: { src: 'Adults/Male_Adult_07', px: 512 }, // the settlement's men
  rb_vill_m2: { src: 'Adults/Male_Adult_12', px: 512 },
  rb_vill_f: { src: 'Adults/Female_Adult_05', px: 512 }, // the settlement's women (and their daughters' hair: garments.js hairdo)
  rb_vill_f2: { src: 'Adults/Female_Adult_03', px: 512 },
  // (closing) Tomas Vale, Anja's son, an echo in a school of 2196: a body of his own, a slight young face at 1.42 m
  rb_tomas: { src: 'Adults/Male_Adult_01', px: 512 },
  // (closing) the two tier-2 women who wore commuters' faces have their own: Helix's receptionist, Officer Haig at home
  rb_desk_f: { src: 'Professions/Business_Female_01', px: 1024 }, // a dark suit, a white shirt: Helix's front desk
  rb_haig: { src: 'Adults/Female_Party_02', px: 512 }, // off shift, at home: her recorded statement, a hologram (M2)
};
// parts left out of a conversion: nobody in the game carries a gun
export const RB_DROP = { rb_security_f: ['pistol'], rb_warden: ['pistol'] };

const args = process.argv.slice(2);
if (args[0] === '--all' && args.length === 3) {
  // node tools/rocketbox-to-glb.mjs --all <Microsoft-Rocketbox checkout> <game/assets/characters>
  for (const [key, rel] of Object.entries(AVATARS)) await convert(path.join(args[1], 'Assets', 'Avatars', rel), path.join(args[2], `${key}.glb`));
} else if (args[0] === '--edition' && args[1] === 'lastversion' && args.length >= 4) {
  // node tools/rocketbox-to-glb.mjs --edition lastversion <checkout> <game/assets/characters> [keys]
  const keys = args.length > 4 ? args.slice(4) : Object.keys(LV_AVATARS);
  for (const key of keys) {
    const a = LV_AVATARS[key];
    if (!a) throw new Error(`${key} is not in LV_AVATARS`);
    await convert(path.join(args[2], 'Assets', 'Avatars', a.src), path.join(args[3], `${key}.glb`), String(a.px), String(a.px / 2), (RB_DROP[key] || []).join(','));
  }
} else if (args[0] === '--strip' && args.length >= 2) {
  // node tools/rocketbox-to-glb.mjs --strip <file.glb ...>: rewrite converted models without FBXLoader's node extras
  // (what a conversion now leaves out), the binary chunk as it was
  for (const f of args.slice(1)) {
    const b = fs.readFileSync(f);
    const jl = b.readUInt32LE(12);
    const json = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
    for (const n of json.nodes || []) delete n.extras;
    for (const m of json.meshes || []) delete m.extras;
    let js = Buffer.from(JSON.stringify(json));
    js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
    const rest = b.subarray(20 + jl);
    const head = Buffer.alloc(20);
    head.writeUInt32LE(0x46546c67, 0);
    head.writeUInt32LE(2, 4);
    head.writeUInt32LE(20 + js.length + rest.length, 8);
    head.writeUInt32LE(js.length, 12);
    head.writeUInt32LE(0x4e4f534a, 16);
    fs.writeFileSync(f, Buffer.concat([head, js, rest]));
    console.log(`${f}: ${(b.length / 1024).toFixed(0)} -> ${((20 + js.length + rest.length) / 1024).toFixed(0)} KB`);
  }
} else if (args.length >= 2 && !args[0].startsWith('--')) {
  await convert(...args);
} else {
  console.error('usage: node tools/rocketbox-to-glb.mjs <avatar dir> <out.glb> [colour px] [normal px] [drop parts]\n       node tools/rocketbox-to-glb.mjs --all <Rocketbox checkout> <out dir>\n       node tools/rocketbox-to-glb.mjs --edition lastversion <Rocketbox checkout> <out dir> [keys]\n       node tools/rocketbox-to-glb.mjs --strip <file.glb ...>');
  process.exit(1);
}

async function convert(dir, out, colorPx = '1024', normalPx = '512', dropParts = '') {
  const drop = new Set(dropParts.split(',').filter(Boolean));
  const name = path.basename(path.resolve(dir));
  const fbx = path.join(dir, 'Export', `${name}.fbx`);

  // 1. textures (python + PIL)
  const tex = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-tex-'));
  const py = spawnSync('python3', ['-I', path.join(path.dirname(fileURLToPath(import.meta.url)), 'rocketbox-textures.py'), path.join(dir, 'Textures'), tex, colorPx, normalPx, [...drop].join(',')], { encoding: 'utf8' });
  if (py.status !== 0) throw new Error(py.stderr);
  const parts = JSON.parse(py.stdout.trim().split('\n').pop());

  // 2. parse the FBX (textures are attached later, so skip loading them)
  THREE.TextureLoader.prototype.load = () => new THREE.Texture();
  globalThis.FileReader = class {
    readAsArrayBuffer(b) { b.arrayBuffer().then((r) => { this.result = r; this.onloadend?.(); }); }
  };
  const warn = console.warn;
  console.warn = () => {}; // "TGA loader not found" for every texture
  const buf = fs.readFileSync(fbx);
  const root = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
  console.warn = warn;
  root.animations = [];
  const gone = [];
  root.traverse((o) => { if (o.isLight || o.isCamera) gone.push(o); });
  for (const o of gone) o.removeFromParent();
  // children are rigged as Bip02: the game's rig (and its eye and face bones) is Bip01
  root.traverse((o) => { o.name = o.name.replace(/^Bip0\d(?=_|$)/, 'Bip01'); });
  const meshes = [];
  root.traverse((o) => o.isSkinnedMesh && meshes.push(o));
  if (meshes.length !== 1) throw new Error(`${fbx}: expected one skinned mesh, found ${meshes.length}`);
  const mesh = meshes[0];
  root.updateMatrixWorld(true);
  if (!root.matrixWorld.equals(new THREE.Matrix4())) throw new Error('unexpected root transform');

  // 3. materials: one per part, plus the eyes
  const partOf = (m) => m.name.replace(/^[a-z]+\d+_/, '');
  const srcMats = [].concat(mesh.material);
  // a dropped part's triangles are left out, and its material with them
  const keep = srcMats.map((m) => !drop.has(partOf(m)));
  if (drop.size && keep.every(Boolean)) throw new Error(`${fbx}: none of the parts ${[...drop]} found`);
  const remap = [];
  const mats = [];
  srcMats.forEach((m, i) => {
    if (!keep[i]) return;
    remap[i] = mats.length;
    const part = partOf(m);
    mats.push(new THREE.MeshStandardMaterial({ name: part === 'opacity' ? 'hair' : part, roughness: 0.8, metalness: 0 }));
  });
  const headIdx = remap[srcMats.findIndex((m) => partOf(m) === 'head')];
  const eyeIdx = mats.length;
  mats.push(new THREE.MeshStandardMaterial({ name: 'eye', roughness: 0.15, metalness: 0 }));

  // 4. geometry
  const g0 = mesh.geometry;
  g0.deleteAttribute('color');
  const nTri = g0.attributes.position.count / 3;
  if (g0.index || !Number.isInteger(nTri)) throw new Error('expected non-indexed triangles');
  const triMat = new Int32Array(nTri);
  for (const gr of g0.groups) for (let t = gr.start / 3; t < (gr.start + gr.count) / 3; t++) triMat[t] = keep[gr.materialIndex] ? remap[gr.materialIndex] : -1;
  const bones = mesh.skeleton.bones;
  if (bones.length > 255) throw new Error('too many bones for uint8 joints');
  const eyeBones = new Set(['Bip01_LEye', 'Bip01_REye'].map((n) => bones.findIndex((b) => b.name === n)).filter((i) => i >= 0));
  const si = g0.attributes.skinIndex, sw = g0.attributes.skinWeight;
  const dominant = (v) => {
    let best = 0;
    for (let k = 1; k < 4; k++) if (sw.getComponent(v, k) > sw.getComponent(v, best)) best = k;
    return si.getComponent(v, best);
  };
  let eyes = 0;
  for (let t = 0; t < nTri; t++) {
    if (triMat[t] === headIdx && [0, 1, 2].every((k) => eyeBones.has(dominant(t * 3 + k)))) {
      triMat[t] = eyeIdx;
      eyes++;
    }
  }
  // sort triangles by material: one contiguous group (one draw call) per material
  const order = [...Array(nTri).keys()].filter((t) => triMat[t] >= 0).sort((a, b) => triMat[a] - triMat[b] || a - b);
  const nKept = order.length;
  const g1 = new THREE.BufferGeometry();
  for (const [key, a] of Object.entries(g0.attributes)) {
    const arr = new a.array.constructor(nKept * 3 * a.itemSize);
    order.forEach((t, i) => arr.set(a.array.subarray(t * 3 * a.itemSize, (t + 1) * 3 * a.itemSize), i * 3 * a.itemSize));
    g1.setAttribute(key, new THREE.BufferAttribute(arr, a.itemSize, a.normalized));
  }
  let start = 0;
  for (let i = 1; i <= nKept; i++) {
    if (i === nKept || triMat[order[i]] !== triMat[order[start]]) {
      g1.addGroup(start * 3, (i - start) * 3, triMat[order[start]]);
      start = i;
    }
  }
  // glTF UVs start at the top left
  const uv = g1.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
  // centimetres -> metres
  const S = 0.01;
  g1.scale(S, S, S);
  const g = mergeVertices(g1, 1e-4);
  g.computeBoundingBox();
  g.computeBoundingSphere();

  // quantise within core glTF: uv uint16 (normalised), joints uint8, weights uint8 (normalised)
  let uvOk = true;
  for (let i = 0; i < g.attributes.uv.array.length; i++) {
    const v = g.attributes.uv.array[i];
    if (v < -1e-4 || v > 1 + 1e-4) uvOk = false;
  }
  if (uvOk) {
    const a = g.attributes.uv.array;
    g.setAttribute('uv', new THREE.BufferAttribute(Uint16Array.from(a, (v) => Math.round(Math.min(1, Math.max(0, v)) * 65535)), 2, true));
  }
  const n = g.attributes.position.count;
  const ji = new Uint8Array(n * 4), wi = new Uint8Array(n * 4);
  for (let v = 0; v < n; v++) {
    const w = [0, 1, 2, 3].map((k) => g.attributes.skinWeight.getComponent(v, k));
    const sum = w.reduce((x, y) => x + y, 0) || 1;
    const q = w.map((x) => Math.round((x / sum) * 255));
    const big = q.indexOf(Math.max(...q));
    q[big] += 255 - q.reduce((x, y) => x + y, 0);
    for (let k = 0; k < 4; k++) {
      ji[v * 4 + k] = q[k] ? g.attributes.skinIndex.getComponent(v, k) : 0;
      wi[v * 4 + k] = q[k];
    }
  }
  g.setAttribute('skinIndex', new THREE.BufferAttribute(ji, 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(wi, 4, true));

  // 5. skeleton and bind matrices to metres (S M S^-1 keeps every bind exactly)
  const Sm = new THREE.Matrix4().makeScale(S, S, S), Si = new THREE.Matrix4().makeScale(1 / S, 1 / S, 1 / S);
  root.traverse((o) => { if (o !== root) o.position.multiplyScalar(S); });
  const boneInverses = mesh.skeleton.boneInverses.map((m) => Sm.clone().multiply(m).multiply(Si));
  const bindMatrix = Sm.clone().multiply(mesh.bindMatrix).multiply(Si);
  mesh.geometry = g;
  mesh.material = mats;
  mesh.bind(new THREE.Skeleton(bones, boneInverses), bindMatrix);
  mesh.name = name;
  root.name = name;
  root.updateMatrixWorld(true);

  // 6. export, then embed the textures into the binary
  const glb = Buffer.from(await new GLTFExporter().parseAsync(root, { binary: true, animations: [] }));
  const jsonLen = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + jsonLen).toString('utf8'));
  let bin = glb.subarray(20 + jsonLen + 8, 20 + jsonLen + 8 + glb.readUInt32LE(20 + jsonLen));
  const chunks = [bin];
  let binLen = bin.length;
  // (FBXLoader's per-node extras, its transform data and original names, are a fifth of a converted model's bytes and
  // nothing reads them: left out)
  for (const n of json.nodes || []) delete n.extras;
  for (const m of json.meshes || []) delete m.extras;
  json.images = [];
  json.textures = [];
  json.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }];
  const texCache = {};
  const texture = (file) => {
    if (texCache[file] !== undefined) return texCache[file];
    const data = fs.readFileSync(path.join(tex, file));
    const pad = (4 - (binLen % 4)) % 4;
    if (pad) { chunks.push(Buffer.alloc(pad)); binLen += pad; }
    json.bufferViews.push({ buffer: 0, byteOffset: binLen, byteLength: data.length });
    chunks.push(data);
    binLen += data.length;
    json.images.push({ bufferView: json.bufferViews.length - 1, mimeType: file.endsWith('.png') ? 'image/png' : 'image/jpeg' });
    json.textures.push({ sampler: 0, source: json.images.length - 1 });
    return (texCache[file] = json.textures.length - 1);
  };
  for (const m of json.materials) {
    const part = m.name === 'hair' ? 'opacity' : m.name === 'eye' ? 'head' : m.name;
    const p = parts[part];
    if (!p) throw new Error(`no textures for material ${m.name}`);
    const pbr = (m.pbrMetallicRoughness ||= {});
    pbr.baseColorTexture = { index: texture(p.color) };
    delete pbr.baseColorFactor;
    pbr.metallicFactor = 0;
    if (m.name === 'eye') {
      pbr.roughnessFactor = 0.15;
      continue;
    }
    if (p.rough) {
      pbr.metallicRoughnessTexture = { index: texture(p.rough) };
      pbr.metallicFactor = 1; // the map's blue channel (0) is the metalness
      pbr.roughnessFactor = 1;
    } else pbr.roughnessFactor = p.alpha ? 0.6 : 0.8;
    if (p.normal) m.normalTexture = { index: texture(p.normal) };
    if (p.alpha) {
      m.alphaMode = 'MASK';
      m.alphaCutoff = 0.35;
      m.doubleSided = true;
    }
  }
  const pad = (4 - (binLen % 4)) % 4;
  if (pad) { chunks.push(Buffer.alloc(pad)); binLen += pad; }
  json.buffers = [{ byteLength: binLen }];
  json.asset = { version: '2.0', generator: 'AFTERZERO tools/rocketbox-to-glb.mjs', copyright: 'Microsoft Rocketbox avatar library (MIT licence)' };
  delete json.extensionsUsed;
  delete json.extensionsRequired;
  bin = Buffer.concat(chunks);
  let js = Buffer.from(JSON.stringify(json));
  js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)]);
  const head = Buffer.alloc(20);
  head.writeUInt32LE(0x46546c67, 0);
  head.writeUInt32LE(2, 4);
  head.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  head.writeUInt32LE(js.length, 12);
  head.writeUInt32LE(0x4e4f534a, 16);
  const binHead = Buffer.alloc(8);
  binHead.writeUInt32LE(bin.length, 0);
  binHead.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(out, Buffer.concat([head, js, binHead, bin]));
  fs.rmSync(tex, { recursive: true, force: true });
  const box = new THREE.Box3().setFromObject(root);
  console.log(`${out}: ${(fs.statSync(out).size / 1024).toFixed(0)} KB, ${g.index.count / 3} tris, ${n} verts, ${eyes} eye tris, ${mats.map((m) => m.name)}, height ${(box.max.y - box.min.y).toFixed(2)} m, bones ${bones.length}`);
}
