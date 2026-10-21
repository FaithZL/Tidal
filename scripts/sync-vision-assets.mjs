import { mkdir, readdir, readFile, writeFile, copyFile, unlink } from 'node:fs/promises';
import { modelUrl, modelHash, hash, packageJson } from './vision-assets.mjs';
await mkdir('public/models', { recursive: true });
await mkdir('public/mediapipe/wasm', { recursive: true });
const modelPath = 'public/models/pose_landmarker_lite.task';
let model = await readFile(modelPath).catch(() => null);
if (!model || hash(model) !== modelHash) {
  const response = await fetch(modelUrl);
  if (!response.ok) throw new Error(`Model download: HTTP ${response.status}`);
  model = Buffer.from(await response.arrayBuffer());
  if (hash(model) !== modelHash) throw new Error('Model checksum mismatch; refusing unexpected model');
  await writeFile(modelPath, model);
}
const files = {};
const packageFiles = await readdir('node_modules/@mediapipe/tasks-vision/wasm');
for (const old of await readdir('public/mediapipe/wasm')) {
  if (/^vision_wasm_.*\.(js|wasm)$/.test(old) && !packageFiles.includes(old)) await unlink(`public/mediapipe/wasm/${old}`);
}
for (const file of await readdir('node_modules/@mediapipe/tasks-vision/wasm')) {
  if (!/\.(js|wasm)$/.test(file)) continue;
  await copyFile(`node_modules/@mediapipe/tasks-vision/wasm/${file}`, `public/mediapipe/wasm/${file}`);
  files[file] = hash(await readFile(`public/mediapipe/wasm/${file}`));
}
await writeFile('public/mediapipe/manifest.json', JSON.stringify({ version: packageJson.version, license: packageJson.license, modelUrl, modelSha256: modelHash, files }, null, 2) + '\n');
console.log(`Synced MediaPipe ${packageJson.version}; model ${modelHash}; ${Object.keys(files).length} runtime files`);
await mkdir('public/licenses',{recursive:true});
await copyFile('node_modules/three/LICENSE','public/licenses/three-LICENSE.txt');
console.log('Synced Three.js MIT license from the locked npm package');
