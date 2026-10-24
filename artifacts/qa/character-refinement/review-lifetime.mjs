import {readFile,writeFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true}});
try{
 const {SampleCharacter}=await server.ssrLoadModule('/src/game/world/sampleCharacter.ts');
 const {WorldResources}=await server.ssrLoadModule('/src/game/world/resources.ts');
 const {NprPalette}=await server.ssrLoadModule('/src/game/world/nprMaterials.ts');
 globalThis.ProgressEvent=class{constructor(type,init){this.type=type;this.init=init;}};
 const dir=new URL('../../../public/assets/character-motion/',import.meta.url),model=JSON.parse(await readFile(new URL('Male_Peasant.gltf',dir),'utf8'));
 const binary=await readFile(new URL('Male_Peasant.bin',dir));model.buffers[0].uri=`data:application/octet-stream;base64,${binary.toString('base64')}`;
 model.images=[];model.textures=[];model.materials=model.materials.map(m=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:[.8,.7,.6,1]}}));
 const loader=new GLTFLoader(),body=await loader.parseAsync(JSON.stringify(model),'');
 const bytes=await Promise.all(['idle.glb','tree-chopping.glb'].map(name=>readFile(new URL(name,dir))));
 const [idle,chop]=await Promise.all(bytes.map(b=>loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')));
 const disposals=new Map(),observe=(item,name)=>{let key=name;for(let i=2;disposals.has(key);i++)key=`${name}(${i})`;disposals.set(key,0);item.addEventListener('dispose',()=>disposals.set(key,disposals.get(key)+1));};
 const originals=new Set(),originalMaterials=new Set();body.scene.traverse(o=>{if(o instanceof T.Mesh){if(!originals.has(o.geometry)){originals.add(o.geometry);observe(o.geometry,`imported:${o.name}`);}for(const material of Array.isArray(o.material)?o.material:[o.material])originalMaterials.add(material);}});
 for(const material of originalMaterials)observe(material,`importedMaterial:${material.name}`);
 const resources=new WorldResources(),palette=new NprPalette(resources),actor=new SampleCharacter(resources,palette,body,idle,chop);
 body.scene.traverse(o=>{if(o instanceof T.Mesh&&!originals.has(o.geometry))observe(o.geometry,`replacement:${o.name}`);});
 const shared=palette.material(0xe7bf98);observe(shared,'sharedWorldSkinMaterial');
 actor.dispose();actor.dispose();const afterActor=Object.fromEntries(disposals);resources.dispose();resources.dispose();const afterWorld=Object.fromEntries(disposals);
 const report={description:'Actual parsed geometry/material ownership; textures omitted because Node has no image decoder. Actor and WorldResources each disposed twice.',afterActor,afterWorld};
 await writeFile(new URL('review-lifetime.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await server.close();}
