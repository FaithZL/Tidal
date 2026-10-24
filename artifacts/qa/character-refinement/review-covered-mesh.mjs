import {readFile,writeFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true}});
try{
 const {SampleCharacter}=await server.ssrLoadModule('/src/game/world/sampleCharacter.ts');
 const {CharacterSampleClock}=await server.ssrLoadModule('/src/game/world/characterSampleClock.ts');
 const {WorldResources}=await server.ssrLoadModule('/src/game/world/resources.ts');
 const {NprPalette}=await server.ssrLoadModule('/src/game/world/nprMaterials.ts');
 globalThis.ProgressEvent=class{constructor(type,init){this.type=type;this.init=init;}};
 const dir=new URL('../../../public/assets/character-motion/',import.meta.url),model=JSON.parse(await readFile(new URL('Male_Peasant.gltf',dir),'utf8'));
 const binary=await readFile(new URL('Male_Peasant.bin',dir));model.buffers[0].uri=`data:application/octet-stream;base64,${binary.toString('base64')}`;
 model.images=[];model.textures=[];model.materials=model.materials.map(m=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:[.8,.7,.6,1]}}));
 const loader=new GLTFLoader(),body=await loader.parseAsync(JSON.stringify(model),'');
 const bytes=await Promise.all(['idle.glb','tree-chopping.glb'].map(name=>readFile(new URL(name,dir))));
 const [idle,chop]=await Promise.all(bytes.map(b=>loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')));
 const resources=new WorldResources(),actor=new SampleCharacter(resources,new NprPalette(resources),body,idle,chop),clock=new CharacterSampleClock(actor.clipDuration);
 const meshes=Object.fromEntries(['Male_Peasant_Arms_1','Male_Peasant_Arms_2','Male_Peasant_Body'].map(name=>[name,actor.root.getObjectByName(name)]));
 function triangles(mesh){
  mesh.updateWorldMatrix(true,false);mesh.skeleton.update();const p=mesh.geometry.getAttribute('position'),idx=mesh.geometry.index;
  const vertices=Array.from({length:p.count},(_,i)=>mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(mesh.matrixWorld));
  return Array.from({length:idx.count/3},(_,i)=>{const a=vertices[idx.getX(i*3)],b=vertices[idx.getX(i*3+1)],c=vertices[idx.getX(i*3+2)];return{shape:new T.Triangle(a,b,c),bounds:new T.Box3().setFromPoints([a,b,c])};});
 }
 function crosses(inner,outer){
  const ray=new T.Ray(),point=new T.Vector3();let count=0;
  for(const a of inner)for(const b of outer){if(!a.bounds.intersectsBox(b.bounds))continue;
   for(const[from,to]of[[a.shape.a,a.shape.b],[a.shape.b,a.shape.c],[a.shape.c,a.shape.a]]){
    const length=from.distanceTo(to);ray.origin.copy(from);ray.direction.copy(to).sub(from).normalize();
    if(ray.intersectTriangle(b.shape.a,b.shape.b,b.shape.c,false,point)&&point.distanceTo(from)>.00001&&point.distanceTo(from)<length-.00001)count++;
   }
  }return count;
 }
 const samples=[];
 for(let i=0;i<=71;i++){
  clock.time=i/10;const frame=clock.frame;actor.sample(frame.idleTime,frame.chopTime,frame.weight);
  const posed=Object.fromEntries(Object.entries(meshes).map(([name,mesh])=>[name,triangles(mesh)])),sleeve=posed.Male_Peasant_Arms_1,skin=posed.Male_Peasant_Arms_2,tunic=posed.Male_Peasant_Body;
  samples.push({time:clock.time,phase:frame.phase,weight:frame.weight,chopTime:frame.chopTime,sleeveTunic:crosses(sleeve,tunic),skinSleeve:crosses(skin,sleeve)});
 }
 const failures=samples.filter(s=>s.sleeveTunic||s.skinSleeve),report={description:'Actual model triangle edge crossings at 0.1s intervals of the production review clock. Textures omitted; no visual acceptance claim.',samples,failures};
 await writeFile(new URL('review-covered-mesh.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({samples:samples.length,failures},null,2));
 actor.dispose();resources.dispose();
}finally{await server.close();}
