#!/usr/bin/env node
// Converts one Microsoft Rocketbox avatar (MIT licence; github.com/microsoft/Microsoft-Rocketbox)
// into a plain glTF binary for the game: game/assets/characters/rb_*.glb.
//
//   NODE_PATH=<dir with three@0.169 in node_modules> node tools/rocketbox-to-glb.mjs \
//     <Assets/Avatars/.../Name_01 dir> <out.glb> [colour px (1024)] [normal px (512)]
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

const args = process.argv.slice(2);
if (args[0] === '--all' && args.length === 3) {
  // node tools/rocketbox-to-glb.mjs --all <Microsoft-Rocketbox checkout> <game/assets/characters>
  for (const [key, rel] of Object.entries(AVATARS)) await convert(path.join(args[1], 'Assets', 'Avatars', rel), path.join(args[2], `${key}.glb`));
} else if (args.length >= 2 && args[0] !== '--all') {
  await convert(...args);
} else {
  console.error('usage: node tools/rocketbox-to-glb.mjs <avatar dir> <out.glb> [colour px] [normal px]\n       node tools/rocketbox-to-glb.mjs --all <Rocketbox checkout> <out dir>');
  process.exit(1);
}

async function convert(dir, out, colorPx = '1024', normalPx = '512') {
  const name = path.basename(path.resolve(dir));
  const fbx = path.join(dir, 'Export', `${name}.fbx`);

  // 1. textures (python + PIL)
  const tex = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-tex-'));
  const py = spawnSync('python3', ['-I', path.join(path.dirname(fileURLToPath(import.meta.url)), 'rocketbox-textures.py'), path.join(dir, 'Textures'), tex, colorPx, normalPx], { encoding: 'utf8' });
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
  const drop = [];
  root.traverse((o) => { if (o.isLight || o.isCamera) drop.push(o); });
  for (const o of drop) o.removeFromParent();
  const meshes = [];
  root.traverse((o) => o.isSkinnedMesh && meshes.push(o));
  if (meshes.length !== 1) throw new Error(`${fbx}: expected one skinned mesh, found ${meshes.length}`);
  const mesh = meshes[0];
  root.updateMatrixWorld(true);
  if (!root.matrixWorld.equals(new THREE.Matrix4())) throw new Error('unexpected root transform');

  // 3. materials: one per part, plus the eyes
  const partOf = (m) => m.name.replace(/^[a-z]\d+_/, '');
  const srcMats = [].concat(mesh.material);
  const mats = srcMats.map((m) => {
    const part = partOf(m);
    return new THREE.MeshStandardMaterial({ name: part === 'opacity' ? 'hair' : part, roughness: 0.8, metalness: 0 });
  });
  const headIdx = srcMats.findIndex((m) => partOf(m) === 'head');
  const eyeIdx = mats.length;
  mats.push(new THREE.MeshStandardMaterial({ name: 'eye', roughness: 0.15, metalness: 0 }));

  // 4. geometry
  const g0 = mesh.geometry;
  g0.deleteAttribute('color');
  const nTri = g0.attributes.position.count / 3;
  if (g0.index || !Number.isInteger(nTri)) throw new Error('expected non-indexed triangles');
  const triMat = new Int32Array(nTri);
  for (const gr of g0.groups) for (let t = gr.start / 3; t < (gr.start + gr.count) / 3; t++) triMat[t] = gr.materialIndex;
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
  const order = [...Array(nTri).keys()].sort((a, b) => triMat[a] - triMat[b] || a - b);
  const g1 = new THREE.BufferGeometry();
  for (const [key, a] of Object.entries(g0.attributes)) {
    const arr = new a.array.constructor(a.array.length);
    order.forEach((t, i) => arr.set(a.array.subarray(t * 3 * a.itemSize, (t + 1) * 3 * a.itemSize), i * 3 * a.itemSize));
    g1.setAttribute(key, new THREE.BufferAttribute(arr, a.itemSize, a.normalized));
  }
  let start = 0;
  for (let i = 1; i <= nTri; i++) {
    if (i === nTri || triMat[order[i]] !== triMat[order[start]]) {
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
