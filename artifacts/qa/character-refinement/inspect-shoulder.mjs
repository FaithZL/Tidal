import {readFile,writeFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true}});
const {SampleCharacter}=await server.ssrLoadModule('/src/game/world/sampleCharacter.ts');
const {WorldResources}=await server.ssrLoadModule('/src/game/world/resources.ts');
const {NprPalette}=await server.ssrLoadModule('/src/game/world/nprMaterials.ts');
globalThis.ProgressEvent=class{constructor(type,init){this.type=type;this.init=init;}};
const dir=new URL('../../../public/assets/character-motion/',import.meta.url);
export async function load(){
 const model=JSON.parse(await readFile(new URL('Male_Peasant.gltf',dir),'utf8'));
 const bytes=await readFile(new URL('Male_Peasant.bin',dir));model.buffers[0].uri=`data:application/octet-stream;base64,${bytes.toString('base64')}`;
 model.images=[];model.textures=[];model.materials=model.materials.map(m=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:[.8,.7,.6,1]}}));
 const loader=new GLTFLoader(),body=await loader.parseAsync(JSON.stringify(model),'');
 const idle=await readFile(new URL('idle.glb',dir)),chop=await readFile(new URL('tree-chopping.glb',dir));
 const resources=new WorldResources();
 const actor=new SampleCharacter(resources,new NprPalette(resources),body,await loader.parseAsync(idle.buffer.slice(idle.byteOffset,idle.byteOffset+idle.byteLength),''),await loader.parseAsync(chop.buffer.slice(chop.byteOffset,chop.byteOffset+chop.byteLength),''));
 return{actor,resources,body};
}
const {actor,resources,body}=await load();
const meshNames=[];body.scene.traverse(o=>{if(o.isSkinnedMesh){const p=o.geometry.getAttribute('position');meshNames.push({name:o.name,parent:o.parent.name,vertices:p.count,triangles:o.geometry.index.count/3,material:o.material.name,bounds:[new T.Box3().setFromBufferAttribute(p).min.toArray(),new T.Box3().setFromBufferAttribute(p).max.toArray()]});}});
const skeleton=body.scene.getObjectByName('Male_Peasant_Body').skeleton;
const report={meshes:meshNames,bones:skeleton.bones.map((b,i)=>({i,name:b.name,position:b.position.toArray()}))};
await writeFile(new URL('shoulder-inspection.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));actor.dispose();resources.dispose();await server.close();

