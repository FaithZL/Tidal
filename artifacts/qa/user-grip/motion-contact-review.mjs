// Independent read-only CPU audit; no browser, model rewrite or GPU upload.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createServer} from 'vite';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const files=['userModel','userCharacterRig','userCharacterMotion','userChopContact'];
const snapshots=Object.fromEntries(files.map(name=>[name,sha(`src/game/world/${name}.ts`)]));
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
const {prepareUserModel}=await server.ssrLoadModule('/src/game/world/userModel.ts');
const {createUserCharacterRig}=await server.ssrLoadModule('/src/game/world/userCharacterRig.ts');
const {UserCharacterMotion}=await server.ssrLoadModule('/src/game/world/userCharacterMotion.ts');
const {deriveUserChopContact}=await server.ssrLoadModule('/src/game/world/userChopContact.ts');
const savedLoad=T.TextureLoader.prototype.load,savedWarn=console.warn,warnings=[];
T.TextureLoader.prototype.load=()=>new T.Texture();console.warn=(...args)=>warnings.push(args.join(' '));
let rig;
try{
 const bytes=fs.readFileSync('public/assets/user-models/character.fbx');
 rig=createUserCharacterRig(prepareUserModel(new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),'character'));
 const motion=new UserCharacterMotion(rig);motion.sample(4.15);const contact=deriveUserChopContact(rig),position=rig.axe.mesh.geometry.getAttribute('position');
 const divisions=12,meshSamples=[];
 for(let index=0;index<position.count;index+=3){
  const a=new T.Vector3().fromBufferAttribute(position,index),b=new T.Vector3().fromBufferAttribute(position,index+1),c=new T.Vector3().fromBufferAttribute(position,index+2);
  for(let j=0;j<=divisions;j++)for(let k=0;k<=divisions-j;k++)meshSamples.push(a.clone().multiplyScalar(1-(j+k)/divisions).addScaledVector(b,j/divisions).addScaledVector(c,k/divisions));
 }
 const p=new T.Vector3();let minimum=Infinity,worst=null,belowTolerance=0,measured=0;
 for(let step=0;step<=690;step++){
  const time=3.65+step*.005;motion.sample(time);
  for(let index=0;index<meshSamples.length;index++){
   p.copy(meshSamples[index]).applyMatrix4(rig.axe.mesh.matrixWorld);
   if(Math.hypot(p.x-contact.center.x,p.z-contact.center.z)>contact.radius)continue;measured++;
   const clearance=p.y-contact.surfaceY;
   if(clearance<minimum){minimum=clearance;worst={time,clearance,point:p.toArray(),sample:index};}
   if(clearance<-.002)belowTolerance++;
  }
 }
 const at=time=>{motion.sample(time);return {blade:motion.bladePosition(),head:rig.bones.head.getWorldPosition(new T.Vector3())};};
 const velocities=[2.4,3.35,3.65,4.15,4.2,4.27,4.28,4.4,4.7,5.6,7.1].map(time=>{
  const delta=.0001,before=at(time-delta),center=at(time),after=at(time+delta);
  const speeds={};for(const key of ['blade','head'])speeds[key]={incoming:before[key].distanceTo(center[key])/delta,outgoing:center[key].distanceTo(after[key])/delta,velocityChange:center[key].clone().sub(before[key]).sub(after[key].clone().sub(center[key])).length()/delta};
  return {time,...speeds};
 });
 const result={date:'2026-10-22',method:'Actual supplied FBX, CPU Three transforms, empty Texture stubs. 230 original axe triangles sampled at 12 barycentric divisions per triangle, every 5ms from3.65to7.10s. Denser probe than vertices but not exact analytic collision proof.',snapshots,sourceSha:sha('public/assets/user-models/character.fbx'),warnings,contact:{center:contact.center.toArray(),surfaceY:contact.surfaceY,radius:contact.radius},meshSamples:meshSamples.length,measured,minimum,worst,belowTolerance,velocities};
 fs.writeFileSync('artifacts/qa/user-grip/motion-contact-review.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
}finally{rig?.dispose();T.TextureLoader.prototype.load=savedLoad;console.warn=savedWarn;await server.close();}
