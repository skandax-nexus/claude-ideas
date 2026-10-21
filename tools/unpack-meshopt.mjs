#!/usr/bin/env node
// Rewrites meshopt-compressed .glb models as plain glTF binaries, so they load
// without the WebAssembly meshopt decoder (some hosts, like the web preview,
// don't allow WebAssembly). Needs @gltf-transform/core, @gltf-transform/extensions
// and meshoptimizer (pass their node_modules with NODE_PATH).
//   NODE_PATH=... node tools/unpack-meshopt.mjs game/assets/characters
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const req = createRequire(path.join(process.env.NODE_PATH || '.', 'x.js'));
const { NodeIO } = req('@gltf-transform/core');
const { ALL_EXTENSIONS, EXTMeshoptCompression } = req('@gltf-transform/extensions');
const { MeshoptDecoder } = req('meshoptimizer');

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const dir = process.argv[2];
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.glb'))) {
  const file = path.join(dir, f);
  const json = JSON.parse(fs.readFileSync(file).subarray(20, 20 + fs.readFileSync(file).readUInt32LE(12)).toString());
  if (!(json.extensionsUsed || []).includes('EXT_meshopt_compression')) continue;
  const doc = await io.read(file);
  for (const e of doc.getRoot().listExtensionsUsed()) if (e instanceof EXTMeshoptCompression) e.dispose();
  const before = fs.statSync(file).size;
  await io.write(file, doc);
  console.log(`${f}: ${(before / 1e6).toFixed(2)} MB -> ${(fs.statSync(file).size / 1e6).toFixed(2)} MB`);
}
