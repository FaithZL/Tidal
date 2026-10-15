import { readFile, readdir } from 'node:fs/promises';
import { modelHash, hash, packageJson } from './vision-assets.mjs';
const manifest = JSON.parse(await readFile('public/mediapipe/manifest.json', 'utf8'));
const project = JSON.parse(await readFile('package.json', 'utf8'));
if (manifest.version !== packageJson.version || project.dependencies['@mediapipe/tasks-vision'] !== packageJson.version) throw new Error('MediaPipe JS/WASM version mismatch');
if (hash(await readFile('public/models/pose_landmarker_lite.task')) !== modelHash) throw new Error('Model checksum mismatch');
const names = (await readdir('node_modules/@mediapipe/tasks-vision/wasm')).filter(n => /\.(js|wasm)$/.test(n));
for (const name of names) {
  const actual = hash(await readFile(`public/mediapipe/wasm/${name}`));
  if (actual !== manifest.files[name] || actual !== hash(await readFile(`node_modules/@mediapipe/tasks-vision/wasm/${name}`))) throw new Error(`Missing/mismatched WASM asset: ${name}`);
}
console.log(`Verified model and ${names.length} MediaPipe ${packageJson.version} runtime files`);
const art = JSON.parse(await readFile('public/assets/manifest.json', 'utf8'));
for (const name of ['farm-landscape.svg', 'harvest-shirt.svg']) {
  if (hash(await readFile(`public/assets/${name}`)) !== art.files[name]) throw new Error(`Missing/mismatched farm asset: ${name}`);
}
console.log(`Verified 2 original farm SVG assets (${art.revision})`);
