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
const three=JSON.parse(await readFile('node_modules/three/package.json','utf8'));
if(project.dependencies.three!==three.version)throw new Error('Three.js package version mismatch');
if(hash(await readFile('public/licenses/three-LICENSE.txt'))!==hash(await readFile('node_modules/three/LICENSE')))throw new Error('Three.js license mismatch');
console.log(`Verified Three.js ${three.version} and its local MIT license`);
const npr=JSON.parse(await readFile('public/assets/npr/pastoral-atlas-v1.provenance.json','utf8'));
const atlas=await readFile('public/assets/npr/pastoral-atlas-v1.png');
if(hash(atlas)!==npr.image.sha256||atlas.readUInt32BE(16)!==1536||atlas.readUInt32BE(20)!==1024)throw new Error('NPR atlas checksum/dimensions mismatch');
console.log('Verified original generated NPR atlas (1536×1024, local sample only)');
const leafMeta=JSON.parse(await readFile('public/assets/npr/leaf-bough-v2.provenance.json','utf8'));
const leaf=await readFile('public/assets/npr/leaf-bough-v2.png');
if(hash(leaf)!==leafMeta.image.sha256||leaf.readUInt32BE(16)!==1254||leaf.readUInt32BE(20)!==1254||leaf[25]!==6)throw new Error('Leaf cutout checksum/RGBA dimensions mismatch');
console.log('Verified original generated RGBA leaf cutout (1254×1254)');
const motion=JSON.parse(await readFile('public/assets/character-motion/provenance.json','utf8'));
if(motion.license!=='CC0-1.0')throw new Error('Character prototype license metadata missing');
for(const file of motion.files){
 if(!/^[\w.-]+$/.test(file.file))throw new Error('Invalid character asset path');
 const bytes=await readFile(`public/assets/character-motion/${file.file}`);
 if(bytes.length!==file.bytes||hash(bytes)!==file.sha256)throw new Error(`Character asset mismatch: ${file.file}`);
}
console.log(`Verified ${motion.files.length} local CC0 character prototype files and retained licenses`);
const supplied=JSON.parse(await readFile('public/assets/user-models/provenance.json','utf8'));
if(supplied.assets.length!==3||new Set(supplied.assets.map(asset=>asset.file)).size!==3)throw new Error('Expected supplied character, house and castle metadata');
for(const asset of supplied.assets){
 if(!/^(character|house|castle)\.fbx$/.test(asset.file))throw new Error('Invalid user model asset path');
 const bytes=await readFile(`public/assets/user-models/${asset.file}`);
 if(bytes.length!==asset.bytes||hash(bytes)!==asset.sha256||bytes.readUInt32LE(23)!==7400)throw new Error(`User model mismatch: ${asset.file}`);
 if(asset.rig.bones!==0||asset.rig.skin!==false||asset.rig.animations!==0)throw new Error('User static model metadata does not match inspected source');
}
console.log('Verified 3 user-supplied static FBX originals (source permission recorded separately; not CC0)');
const castlePaint=JSON.parse(await readFile('public/assets/user-models/castle-soft-toon-v1.provenance.json','utf8'));
if(castlePaint.sourceModel.sha256!==supplied.assets.find(asset=>asset.kind==='castle')?.sha256)throw new Error('Castle texture source mismatch');
const paintSizes={'castle-materials-v1.png':1254,'castle-soft-toon-v1.png':2048};
if(castlePaint.images.length!==2||new Set(castlePaint.images.map(image=>image.file)).size!==2)throw new Error('Expected castle source material and baked atlas');
for(const image of castlePaint.images){
 if(!Object.hasOwn(paintSizes,image.file))throw new Error('Unexpected castle texture file');
 const bytes=await readFile(`public/assets/user-models/${image.file}`),size=paintSizes[image.file];
 if(bytes.length!==image.bytes||hash(bytes)!==image.sha256||bytes.readUInt32BE(0)!==0x89504e47||bytes.readUInt32BE(16)!==size||bytes.readUInt32BE(20)!==size||image.width!==size||image.height!==size||image.colorSpace!=='sRGB')throw new Error(`Castle texture mismatch: ${image.file}`);
}
if(castlePaint.generation.promptFile!=='castle-texture-prompt-v1.txt'||hash(await readFile('public/assets/user-models/castle-texture-prompt-v1.txt'))!==castlePaint.generation.promptSha256)throw new Error('Castle texture generation record mismatch');
if(hash(await readFile('scripts/bake-castle-texture.mjs'))!==castlePaint.bake.scriptSha256)throw new Error('Castle bake script provenance mismatch');
console.log('Verified generated castle materials and 2048x2048 local UV color atlas (original FBX unchanged)');
