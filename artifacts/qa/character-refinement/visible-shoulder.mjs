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
 const extension=Number(process.argv[2]??0); if(extension){ const p=body.scene.getObjectByName('Male_Peasant_Body').geometry.getAttribute('position'); for(let i=0;i<p.count;i++){const x=p.getX(i),amount=T.MathUtils.smoothstep(Math.abs(x),.20,.35)*T.MathUtils.smoothstep(p.getY(i),1.32,1.42)*extension;p.setX(i,x+Math.sign(x)*amount);}}
 const resources=new WorldResources(),actor=new SampleCharacter(resources,new NprPalette(resources),body,idle,chop),clock=new CharacterSampleClock(actor.clipDuration);
 const meshes=Object.fromEntries(['Male_Peasant_Arms_1','Male_Peasant_Arms_2','Male_Peasant_Body'].map(name=>[name,actor.root.getObjectByName(name)]));
 function triangles(mesh){
  mesh.updateWorldMatrix(true,false);mesh.skeleton.update();const p=mesh.geometry.getAttribute('position'),idx=mesh.geometry.index;
  const vertices=Array.from({length:p.count},(_,i)=>mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(p,i)).applyMatrix4(mesh.matrixWorld));
  return Array.from({length:idx.count/3},(_,i)=>{const a=vertices[idx.getX(i*3)],b=vertices[idx.getX(i*3+1)],c=vertices[idx.getX(i*3+2)];return{shape:new T.Triangle(a,b,c),bounds:new T.Box3().setFromPoints([a,b,c]),sourceX:(p.getX(idx.getX(i*3))+p.getX(idx.getX(i*3+1))+p.getX(idx.getX(i*3+2)))/3,ids:[idx.getX(i*3),idx.getX(i*3+1),idx.getX(i*3+2)]};});
 }
 function crosses(inner,outer){
  const ray=new T.Ray(),point=new T.Vector3(),hits=[];
  for(const a of inner)for(const b of outer){if(!a.bounds.intersectsBox(b.bounds))continue;
   for(const[from,to]of[[a.shape.a,a.shape.b],[a.shape.b,a.shape.c],[a.shape.c,a.shape.a]]){
    const length=from.distanceTo(to);ray.origin.copy(from);ray.direction.copy(to).sub(from).normalize();
    if(ray.intersectTriangle(b.shape.a,b.shape.b,b.shape.c,false,point)&&point.distanceTo(from)>.00001&&point.distanceTo(from)<length-.00001)hits.push({p:point.clone(),a:a.sourceX,b:b.sourceX,idsA:a.ids,idsB:b.ids});
   }
  }return hits;
 }
 const samples=[];
 for(const time of[.8,2.8,2.9,3.4,4.15,4.4,4.9,5.5]){
  clock.time=time;const frame=clock.frame;actor.sample(frame.idleTime,frame.chopTime,frame.weight);
  const posed=Object.fromEntries(Object.entries(meshes).map(([name,mesh])=>[name,triangles(mesh)])),sleeve=posed.Male_Peasant_Arms_1,skin=posed.Male_Peasant_Arms_2,tunic=posed.Male_Peasant_Body;
  
  const all=[...sleeve,...skin,...tunic],ray=new T.Ray(),point=new T.Vector3();
  const directions=[];for(const elevation of[-.3,0,.5,1])for(let j=0;j<24;j++)directions.push(new T.Vector3(Math.cos(j*Math.PI/12)*Math.cos(elevation),Math.sin(elevation),Math.sin(j*Math.PI/12)*Math.cos(elevation)));
  function visible(hits){return hits.map(record=>{ const hit=record.p;
   for(const direction of directions){
    ray.origin.copy(hit).addScaledVector(direction,3);ray.direction.copy(direction).negate();let blocked=false;
    for(const {shape,bounds}of all){if(!ray.intersectsBox(bounds))continue;if(ray.intersectTriangle(shape.a,shape.b,shape.c,false,point)&&ray.origin.distanceTo(point)<2.999){blocked=true;break;}}
    if(!blocked)return{point:hit.toArray(),direction:direction.toArray(),a:record.a,b:record.b,idsA:record.idsA,idsB:record.idsB};
   }return null;
  }).filter(Boolean);}
  const a=crosses(sleeve,tunic),b=crosses(skin,sleeve);
  samples.push({time:clock.time,phase:frame.phase,weight:frame.weight,chopTime:frame.chopTime,sleeveTunic:a.length,skinSleeve:b.length,visibleSleeveTunic:visible(a),visibleSkinSleeve:visible(b)});

 }
 const failures=samples.filter(s=>s.sleeveTunic||s.skinSleeve),report={description:'Actual model triangle edge crossings at 0.1s intervals of the production review clock. Textures omitted; no visual acceptance claim.',samples,failures};
 await writeFile(new URL('shoulder-visibility-extended.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({samples:samples.length,failures},null,2));
 actor.dispose();resources.dispose();
}finally{await server.close();}
