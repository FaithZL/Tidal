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
const model=JSON.parse(await readFile(new URL('Male_Peasant.gltf',dir),'utf8'));
const bytes=await readFile(new URL('Male_Peasant.bin',dir));model.buffers[0].uri=`data:application/octet-stream;base64,${bytes.toString('base64')}`;
model.images=[];model.textures=[];model.materials=model.materials.map(m=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:[.8,.7,.6,1]}}));
const loader=new GLTFLoader(),body=await loader.parseAsync(JSON.stringify(model),'');
const idle=await readFile(new URL('idle.glb',dir)),chop=await readFile(new URL('tree-chopping.glb',dir));
const resources=new WorldResources();
const bodySkin=body.scene.getObjectByName('Male_Peasant_Body'),arms=body.scene.getObjectByName('Male_Peasant_Arms_1');
const capFit=Number(process.argv[3]??0);
const extension=Number(process.argv[4]??0);
if(extension){
 const p=bodySkin.geometry.getAttribute('position'),joints=bodySkin.geometry.getAttribute('skinIndex'),weights=bodySkin.geometry.getAttribute('skinWeight'),ap=arms.geometry.getAttribute('position'),aj=arms.geometry.getAttribute('skinIndex'),aw=arms.geometry.getAttribute('skinWeight');
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),amount=T.MathUtils.smoothstep(Math.abs(x),.20,.35)*T.MathUtils.smoothstep(p.getY(i),1.32,1.42)*extension;p.setX(i,x+Math.sign(x)*amount);
  if(amount<.00001||process.argv[5]!=='weights')continue;
  const point=new T.Vector3().fromBufferAttribute(p,i),nearest=Array.from({length:ap.count},(_,i)=>({i,d:new T.Vector3().fromBufferAttribute(ap,i).distanceToSquared(point)})).sort((a,b)=>a.d-b.d).slice(0,3),sum=nearest.reduce((sum,p)=>sum+1/Math.max(.000001,p.d),0),map=new Map();
  for(let j=0;j<4;j++)map.set(joints.getComponent(i,j),(map.get(joints.getComponent(i,j))??0)+weights.getComponent(i,j)*(1-amount/extension));
  for(const a of nearest)for(let j=0;j<4;j++)map.set(aj.getComponent(a.i,j),(map.get(aj.getComponent(a.i,j))??0)+aw.getComponent(a.i,j)*(1/Math.max(.000001,a.d)/sum)*amount/extension);
  const list=[...map].sort((a,b)=>b[1]-a[1]).slice(0,4),total=list.reduce((s,p)=>s+p[1],0);for(let j=0;j<4;j++){joints.setComponent(i,j,list[j]?.[0]??0);weights.setComponent(i,j,(list[j]?.[1]??0)/total);}
 }
}
if(capFit){
 const p=bodySkin.geometry.getAttribute('position'),joints=bodySkin.geometry.getAttribute('skinIndex'),weights=bodySkin.geometry.getAttribute('skinWeight');
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),influence=T.MathUtils.smoothstep(Math.abs(x),.10,.25)*T.MathUtils.smoothstep(y,1.32,1.42)*capFit;if(influence<=0)continue;
  const upper=bodySkin.skeleton.bones.findIndex(b=>b.name===`upperarm_${x>0?'l':'r'}`),map=new Map();
  for(let j=0;j<4;j++)map.set(joints.getComponent(i,j),(map.get(joints.getComponent(i,j))??0)+weights.getComponent(i,j)*(1-influence));map.set(upper,(map.get(upper)??0)+influence);
  const list=[...map].sort((a,b)=>b[1]-a[1]).slice(0,4),total=list.reduce((s,p)=>s+p[1],0);for(let j=0;j<4;j++){joints.setComponent(i,j,list[j]?.[0]??0);weights.setComponent(i,j,(list[j]?.[1]??0)/total);}
 }
}
function vertices(mesh,posed){mesh.updateWorldMatrix(true,false);mesh.skeleton.update();const p=mesh.geometry.getAttribute('position');return Array.from({length:p.count},(_,i)=>{const v=new T.Vector3().fromBufferAttribute(p,i);return posed?mesh.applyBoneTransform(i,v).applyMatrix4(mesh.matrixWorld):v;});}
function triangles(mesh,verts){const idx=mesh.geometry.index;return Array.from({length:idx.count/3},(_,i)=>{const ids=[idx.getX(i*3),idx.getX(i*3+1),idx.getX(i*3+2)],tri=new T.Triangle(...ids.map(j=>verts[j]));return{tri,ids,box:new T.Box3().setFromPoints(ids.map(j=>verts[j])),i};});}
function intersections(posed){
 const va=vertices(arms,posed),vb=vertices(bodySkin,posed),ta=triangles(arms,va),tb=triangles(bodySkin,vb),ray=new T.Ray(),point=new T.Vector3(),hits=[];
 const unique=new Set();
 for(const a of ta){for(const b of tb){if(!a.box.intersectsBox(b.box))continue;
 for(const [from,to] of [[a.tri.a,a.tri.b],[a.tri.b,a.tri.c],[a.tri.c,a.tri.a]]){
  ray.origin.copy(from);ray.direction.copy(to).sub(from).normalize();const length=from.distanceTo(to);
  if(ray.intersectTriangle(b.tri.a,b.tri.b,b.tri.c,false,point)&&point.distanceTo(from)>1e-7&&point.distanceTo(from)<length-1e-7){
   const key=point.toArray().map(v=>v.toFixed(5)).join('/');if(unique.has(key))continue;unique.add(key);hits.push({armFace:a.i,bodyFace:b.i,position:point.toArray(),armIds:a.ids,bodyIds:b.ids});
  }
 }
 }}return hits;
}
const fit=Number(process.argv[2]??1);
if(fit!==1){
 const p=arms.geometry.getAttribute('position');
 for(let i=0;i<p.count;i++){
  const v=new T.Vector3().fromBufferAttribute(p,i),sign=Math.sign(v.x),upper=arms.skeleton.bones.find(b=>b.name===`upperarm_${sign>0?'l':'r'}`),lower=arms.skeleton.bones.find(b=>b.name===`lowerarm_${sign>0?'l':'r'}`);
  const a=new T.Vector3().setFromMatrixPosition(arms.skeleton.boneInverses[arms.skeleton.bones.indexOf(upper)].clone().invert()),b=new T.Vector3().setFromMatrixPosition(arms.skeleton.boneInverses[arms.skeleton.bones.indexOf(lower)].clone().invert()),axis=b.clone().sub(a).normalize(),center=a.clone().addScaledVector(axis,v.clone().sub(a).dot(axis));
  const influence=1-T.MathUtils.smoothstep(Math.abs(v.x),.35,.45);v.lerp(center,influence*(1-fit));p.setXYZ(i,v.x,v.y,v.z);
 }
}
const report={fit,rest:intersections(false),poses:[]};
const actor=new SampleCharacter(resources,new NprPalette(resources),body,await loader.parseAsync(idle.buffer.slice(idle.byteOffset,idle.byteOffset+idle.byteLength),''),await loader.parseAsync(chop.buffer.slice(chop.byteOffset,chop.byteOffset+chop.byteLength),''));
for(const [name,t,weight]of[['idle',null,0],['raised',0,1],['swing',.35,1],['recovery',.8,1]]){actor.sample(.8,t,weight);report.poses.push({name,intersections:intersections(true),bones:['spine_03','upperarm_l','lowerarm_l','hand_l','upperarm_r','lowerarm_r','hand_r'].map(name=>({name,p:body.scene.getObjectByName(name).getWorldPosition(new T.Vector3()).toArray()}))});}
const p=arms.geometry.getAttribute('position'),wi=arms.geometry.getAttribute('skinIndex'),ww=arms.geometry.getAttribute('skinWeight');
report.armInnerVertices=Array.from({length:p.count},(_,i)=>i).filter(i=>Math.abs(p.getX(i))<.38).map(i=>({i,p:new T.Vector3().fromBufferAttribute(p,i).toArray(),weights:Array.from({length:4},(_,j)=>({name:arms.skeleton.bones[wi.getComponent(i,j)].name,w:ww.getComponent(i,j)}))}));
await writeFile(new URL(`shoulder-crossings-${fit}.json`,import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({rest:report.rest.length,poses:report.poses.map(p=>({name:p.name,crossings:p.intersections.length,example:p.intersections.slice(0,3)})),inner:report.armInnerVertices.length},null,2));
actor.dispose();resources.dispose();await server.close();
