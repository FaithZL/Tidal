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
 const dir=new URL('../../../public/assets/character-motion/',import.meta.url);
 const model=JSON.parse(await readFile(new URL('Male_Peasant.gltf',dir),'utf8'));
 const binary=await readFile(new URL('Male_Peasant.bin',dir));model.buffers[0].uri=`data:application/octet-stream;base64,${binary.toString('base64')}`;
 model.images=[];model.textures=[];model.materials=model.materials.map(m=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:[.8,.7,.6,1]}}));
 const loader=new GLTFLoader(),body=await loader.parseAsync(JSON.stringify(model),'');
 const bytes=await Promise.all(['idle.glb','tree-chopping.glb'].map(name=>readFile(new URL(name,dir))));
 const [idle,chop]=await Promise.all(bytes.map(b=>loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')));
 const resources=new WorldResources(),actor=new SampleCharacter(resources,new NprPalette(resources),body,idle,chop),clock=new CharacterSampleClock(actor.clipDuration);
 const names=['hand_l','hand_r','foot_l','foot_r','pelvis','Head','sample-axe','sample-axe-left-grip'];
 const objects=Object.fromEntries(names.map(n=>[n,actor.root.getObjectByName(n)]));
 const missing=names.filter(n=>!objects[n]);if(missing.length)throw new Error(`Missing: ${missing}`);
 const originalContact=actor.contact;
 let contactBasis;
 actor.contact=function(blend){
  const shoulder=this.leftUpper.getWorldPosition(new T.Vector3()),wrist=this.right.getWorldPosition(new T.Vector3());
  const target=new T.Vector3(0,-1,0).lerp(wrist.clone().sub(shoulder).normalize(),blend).normalize(),axis=new T.Vector3(0,0,1).applyQuaternion(this.right.getWorldQuaternion(new T.Quaternion()));
  contactBasis={dot:axis.dot(target),sourceAxis:axis.toArray(),targetAxis:target.toArray()};originalContact.call(this,blend);
 };
 function snapshot(time){
  clock.time=time;const frame=clock.frame;actor.sample(frame.idleTime,frame.chopTime,frame.weight);
  const points=Object.fromEntries(names.map(n=>[n,objects[n].getWorldPosition(new T.Vector3()).toArray()]));
  points.blade=actor.bladePosition().toArray();points.leftPalm=objects.hand_l.localToWorld(new T.Vector3(0,.065,0)).toArray();
  return{time,phase:frame.phase,weight:frame.weight,chopTime:frame.chopTime,points,axeQuaternion:objects['sample-axe'].getWorldQuaternion(new T.Quaternion()).toArray(),contact:new T.Vector3(...points.leftPalm).distanceTo(new T.Vector3(...points['sample-axe-left-grip'])),basis:contactBasis};
 }
 const boundary=[2.4,3.35,3.65,3.9,4.2,5.6,7.1].map(time=>{
  const before=snapshot(time-1e-5),after=snapshot(time+1e-5),deltas=Object.fromEntries(Object.keys(before.points).map(n=>[n,new T.Vector3(...before.points[n]).distanceTo(new T.Vector3(...after.points[n]))]));
  return{time,deltas,axeRadians:new T.Quaternion(...before.axeQuaternion).angleTo(new T.Quaternion(...after.axeQuaternion))};
 });
 const frames=Array.from({length:427},(_,i)=>snapshot(i/60));
 let peakStep={distance:0};for(let i=1;i<frames.length;i++){
  const d=new T.Vector3(...frames[i].points.blade).distanceTo(new T.Vector3(...frames[i-1].points.blade));if(d>peakStep.distance)peakStep={distance:d,from:frames[i-1].time,to:frames[i].time};
 }
 const target=new T.Vector3(0,Infinity,0);for(let i=0;i<=12;i++){actor.sample(0,actor.clipDuration*.3*i/12,1);const p=actor.bladePosition();if(p.y<target.y)target.copy(p);}
 const belowTarget=frames.filter(f=>f.time>=3.65&&f.time<5.6).map(f=>({time:f.time,phase:f.phase,blade:f.points.blade,below:target.y-f.points.blade[1],horizontal:Math.hypot(target.x-f.points.blade[0],target.z-f.points.blade[2])})).filter(f=>f.below>0&&f.horizontal<.2);
 const spans={};for(const name of['foot_l','foot_r']){
  const section=frames.filter(f=>f.time>=2.4&&f.time<=5.6).map(f=>f.points[name]);
  const bounds=new T.Box3().setFromPoints(section.map(p=>new T.Vector3(...p))),size=bounds.getSize(new T.Vector3());spans[name]={min:bounds.min.toArray(),max:bounds.max.toArray(),span:size.toArray()};
 }
 const dense=Array.from({length:101},(_,i)=>snapshot(3.73+i/1000));
 const denseSteps=dense.slice(1).map((f,i)=>({time:f.time,blade:new T.Vector3(...f.points.blade).distanceTo(new T.Vector3(...dense[i].points.blade)),wrist:new T.Vector3(...f.points.hand_r).distanceTo(new T.Vector3(...dense[i].points.hand_r)),angle:new T.Quaternion(...f.axeQuaternion).angleTo(new T.Quaternion(...dense[i].axeQuaternion)),dot:f.basis.dot})).sort((a,b)=>b.blade-a.blade);
 const report={description:'Diagnostic on actual local model, inverse binds, weights and animation; image textures omitted in Node. No browser/real-camera or aesthetic acceptance claim.',clipDuration:actor.clipDuration,boundary,peakStep,densePeaks:denseSteps.slice(0,10),denseFrames:dense.filter(f=>f.time>=3.765&&f.time<=3.785),footSpans:spans,target:target.toArray(),maxBelowTarget:belowTarget.sort((a,b)=>b.below-a.below).slice(0,3),landmarks:frames.filter(f=>[.8,2.4,3.35,3.65,3.75,3.9,4.2,4.5,4.7,5.1,5.5,5.6].some(t=>Math.abs(t-f.time)<.001)),maxContactDuringFullGrip:Math.max(...frames.filter(f=>f.weight>.999).map(f=>f.contact))};
 await writeFile(new URL('review-motion.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 function worldQ(o){return o.getWorldQuaternion(new T.Quaternion());}
 function setWorld(o,q){o.quaternion.copy(worldQ(o.parent).invert().multiply(q));o.updateWorldMatrix(false,true);}
 function aim(joint,current,target){const origin=joint.getWorldPosition(new T.Vector3()),from=current.clone().sub(origin).normalize(),to=target.clone().sub(origin).normalize();if(from.lengthSq()<.5||to.lengthSq()<.5)return;setWorld(joint,new T.Quaternion().setFromUnitVectors(from,to).multiply(worldQ(joint)));}
 function reach(upper,lower,hand,target){
  const shoulder=upper.getWorldPosition(new T.Vector3()),elbow=lower.getWorldPosition(new T.Vector3()),wrist=hand.getWorldPosition(new T.Vector3());
  const a=shoulder.distanceTo(elbow),b=elbow.distanceTo(wrist),direction=target.clone().sub(shoulder),distance=T.MathUtils.clamp(direction.length(),Math.abs(a-b)+.001,a+b-.001);direction.normalize();
  const pole=elbow.clone().sub(shoulder).addScaledVector(direction,-elbow.clone().sub(shoulder).dot(direction));if(pole.lengthSq()<.00001)pole.set(0,0,1).addScaledVector(direction,-direction.z);pole.normalize();
  const along=(a*a+distance*distance-b*b)/(2*distance),rise=Math.sqrt(Math.max(0,a*a-along*along));aim(upper,elbow,shoulder.clone().addScaledVector(direction,along).addScaledVector(pole,rise));aim(lower,hand.getWorldPosition(new T.Vector3()),target);
 }
 const rightLower=actor.root.getObjectByName('lowerarm_r');
 function candidateContact(blend){
  const wrist=this.right.getWorldPosition(new T.Vector3()),elbow=rightLower.getWorldPosition(new T.Vector3()),direction=wrist.clone().sub(elbow).normalize();
  const desiredShaft=new T.Vector3(0,-1,0).lerp(direction,blend).normalize(),currentShaft=new T.Vector3(0,0,1).applyQuaternion(worldQ(this.right));
  setWorld(this.right,new T.Quaternion().setFromUnitVectors(currentShaft,desiredShaft).multiply(worldQ(this.right)));this.root.updateMatrixWorld(true);if(blend<=.001)return;
  const wantedRotation=worldQ(this.right).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI)),leftRotation=worldQ(this.left).slerp(wantedRotation,blend);
  const palmOffset=new T.Vector3(0,.065,0).multiply(this.left.getWorldScale(new T.Vector3())).applyQuaternion(leftRotation),wantedWrist=this.leftGrip.getWorldPosition(new T.Vector3()).sub(palmOffset),originalWrist=this.left.getWorldPosition(new T.Vector3());
  reach(this.leftUpper,this.leftLower,this.left,originalWrist.lerp(wantedWrist,blend));setWorld(this.left,leftRotation);
 }
 const comparisons=[];
 for(const mode of ['original-.25s','forearm-.25s','original-.4s','forearm-.4s','original-.5s']){
  actor.contact=mode.startsWith('forearm')?candidateContact:originalContact;actor.previous='';const duration=mode.endsWith('.5s')?.5:mode.endsWith('.4s')?.4:.25;
  const steps=[];let previous;
  for(let i=0;i<=60;i++){
   const time=3.65+i/60,sourceTime=3.65+Math.min(.25,(time-3.65)*.25/duration),f=snapshot(sourceTime);
   if(previous)steps.push({time,blade:new T.Vector3(...f.points.blade).distanceTo(new T.Vector3(...previous.points.blade)),wrist:new T.Vector3(...f.points.hand_r).distanceTo(new T.Vector3(...previous.points.hand_r)),contact:f.contact});previous=f;
  }
  comparisons.push({mode,peakBladeStep:Math.max(...steps.map(s=>s.blade)),peakWristStep:Math.max(...steps.map(s=>s.wrist)),maxContact:Math.max(...steps.map(s=>s.contact))});
 }
 await writeFile(new URL('review-candidates.json',import.meta.url),JSON.stringify(comparisons,null,2)+'\n');console.log(JSON.stringify(comparisons,null,2));
 actor.dispose();resources.dispose();
}finally{await server.close();}
