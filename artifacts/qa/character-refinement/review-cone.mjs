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
 const originalContact=actor.contact,upperR=actor.root.getObjectByName('upperarm_r');
 const worldQ=o=>o.getWorldQuaternion(new T.Quaternion());
 function setWorld(o,q){o.quaternion.copy(worldQ(o.parent).invert().multiply(q));o.updateWorldMatrix(false,true);}
 function aim(joint,current,target){const origin=joint.getWorldPosition(new T.Vector3()),from=current.clone().sub(origin).normalize(),to=target.clone().sub(origin).normalize();if(from.lengthSq()<.5||to.lengthSq()<.5)return;setWorld(joint,new T.Quaternion().setFromUnitVectors(from,to).multiply(worldQ(joint)));}
 function reach(upper,lower,hand,target,elbowPole,weight){
  const shoulder=upper.getWorldPosition(new T.Vector3()),elbow=lower.getWorldPosition(new T.Vector3()),wrist=hand.getWorldPosition(new T.Vector3());
  const a=shoulder.distanceTo(elbow),b=elbow.distanceTo(wrist),direction=target.clone().sub(shoulder),distance=T.MathUtils.clamp(direction.length(),Math.abs(a-b)+.001,a+b-.001);direction.normalize();
  const authored=elbow.clone().sub(shoulder).addScaledVector(direction,-elbow.clone().sub(shoulder).dot(direction)).normalize(),wanted=elbowPole.clone().addScaledVector(direction,-elbowPole.dot(direction)).normalize();
  const pole=authored.applyQuaternion(new T.Quaternion().identity().slerp(new T.Quaternion().setFromUnitVectors(authored,wanted),weight));if(pole.lengthSq()<.00001)pole.set(0,0,1).addScaledVector(direction,-direction.z);pole.normalize();
  const along=(a*a+distance*distance-b*b)/(2*distance),rise=Math.sqrt(Math.max(0,a*a-along*along));aim(upper,elbow,shoulder.clone().addScaledVector(direction,along).addScaledVector(pole,rise));aim(lower,hand.getWorldPosition(new T.Vector3()),target);
 }
 let minimum=.3,axisMode='radial',coneStats;
 function coneContact(blend){
  const shoulder=this.leftUpper.getWorldPosition(new T.Vector3()),opposite=upperR.getWorldPosition(new T.Vector3()),across=shoulder.clone().sub(opposite).normalize();
  const up=this.collar.getWorldPosition(new T.Vector3()).sub(shoulder.clone().add(opposite).multiplyScalar(.5)).normalize(),forward=new T.Vector3().crossVectors(across,up).normalize();
  const wrist=this.right.getWorldPosition(new T.Vector3()),vector=wrist.clone().sub(shoulder),distance=vector.length(),preferred=vector.clone().normalize();
  const elbow=this.leftLower.getWorldPosition(new T.Vector3()),originalWrist=this.left.getWorldPosition(new T.Vector3()),maximum=Math.min(.49,shoulder.distanceTo(elbow)+elbow.distanceTo(originalWrist)-.01);
  const length=this.leftGrip.position.length()*this.right.getWorldScale(new T.Vector3()).y;
  const maxDot=T.MathUtils.clamp((distance*distance+length*length-minimum*minimum)/(2*length*distance),-1,1),minDot=T.MathUtils.clamp((distance*distance+length*length-maximum*maximum)/(2*length*distance),-1,1);
  const authoredDirection=wrist.clone().sub(originalWrist).normalize(),wantedAxis=axisMode==='authored'?authoredDirection:axisMode==='forward'?preferred.clone().addScaledVector(forward,-.5).normalize():preferred.clone();
  const wantedCosine=wantedAxis.dot(preferred),cosine=T.MathUtils.clamp(wantedCosine,minDot,maxDot),tangent=wantedAxis.clone().addScaledVector(preferred,-wantedCosine);
  if(tangent.lengthSq()<1e-6)tangent.copy(forward).negate().addScaledVector(preferred,forward.dot(preferred));
  if(tangent.lengthSq()<1e-6)tangent.copy(across).addScaledVector(preferred,-across.dot(preferred));tangent.normalize();
  const axis=preferred.multiplyScalar(cosine).addScaledVector(tangent,Math.sqrt(Math.max(0,1-cosine*cosine))).normalize();
  const desiredShaft=new T.Vector3(0,-1,0).lerp(axis,blend).normalize(),currentShaft=new T.Vector3(0,0,1).applyQuaternion(worldQ(this.right));
  setWorld(this.right,new T.Quaternion().setFromUnitVectors(currentShaft,desiredShaft).multiply(worldQ(this.right)));this.root.updateMatrixWorld(true);if(blend===0)return;
  const wantedRotation=worldQ(this.right).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI)),leftRotation=worldQ(this.left).slerp(wantedRotation,blend);
  const palmOffset=new T.Vector3(0,.065,0).multiply(this.left.getWorldScale(new T.Vector3())).applyQuaternion(leftRotation),wantedWrist=this.leftGrip.getWorldPosition(new T.Vector3()).sub(palmOffset);
  coneStats={minimum,maximum,distance,length,predicted:Math.sqrt(distance*distance+length*length-2*length*distance*cosine),actualTarget:shoulder.distanceTo(wantedWrist)};
  const pole=forward.clone().addScaledVector(across,1.2);reach(this.leftUpper,this.leftLower,this.left,originalWrist.lerp(wantedWrist,blend),pole,blend);setWorld(this.left,leftRotation);
 }
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
 const reports=[];
 for(const mode of ['current','radial-.30','forward-.30','authored-.30','forward-.35','authored-.35']){
 minimum=mode.endsWith('.35')?.35:.3;axisMode=mode.split('-')[0];actor.contact=mode==='current'?originalContact:coneContact;actor.previous='';
 const samples=[];
 for(const time of [.8,2.8,2.9,3.4,3.77,3.9,4.15,4.4,4.7,4.9,5.1,5.5]){
  clock.time=time;const frame=clock.frame;actor.sample(frame.idleTime,frame.chopTime,frame.weight);
  const posed=Object.fromEntries(Object.entries(meshes).map(([name,mesh])=>[name,triangles(mesh)])),sleeve=posed.Male_Peasant_Arms_1,skin=posed.Male_Peasant_Arms_2,tunic=posed.Male_Peasant_Body;
  const palm=actor.left.localToWorld(new T.Vector3(0,.065,0)),contact=palm.distanceTo(actor.leftGrip.getWorldPosition(new T.Vector3()));
  samples.push({time:clock.time,phase:frame.phase,weight:frame.weight,chopTime:frame.chopTime,sleeveTunic:crosses(sleeve,tunic),skinSleeve:crosses(skin,sleeve),contact,shoulderWrist:actor.leftUpper.getWorldPosition(new T.Vector3()).distanceTo(actor.left.getWorldPosition(new T.Vector3())),cone:mode==='current'?undefined:coneStats});
 }
 let prior,peakBladeStep=0,maxGripError=0,minimumBlade=new T.Vector3(0,Infinity,0);
 for(let i=0;i<=426;i++){
  clock.time=i/60;const f=clock.frame;actor.sample(f.idleTime,f.chopTime,f.weight);const blade=actor.bladePosition();
  if(prior)peakBladeStep=Math.max(peakBladeStep,prior.distanceTo(blade));prior=blade;
  if(f.weight===1){const error=actor.left.localToWorld(new T.Vector3(0,.065,0)).distanceTo(actor.leftGrip.getWorldPosition(new T.Vector3()));maxGripError=Math.max(maxGripError,error);if(blade.y<minimumBlade.y)minimumBlade.copy(blade);}
 }
 reports.push({mode,samples,peakBladeStep,maxGripError,minimumBlade:minimumBlade.toArray()});
 }
 await writeFile(new URL('review-cone.json',import.meta.url),JSON.stringify(reports,null,2)+'\n');console.log(JSON.stringify(reports.map(r=>({mode:r.mode,peakBladeStep:r.peakBladeStep,maxGripError:r.maxGripError,minimumBlade:r.minimumBlade,crossings:r.samples.map(s=>({time:s.time,tunic:s.sleeveTunic,skin:s.skinSleeve,shoulderWrist:s.shoulderWrist}))})),null,2));
 actor.dispose();resources.dispose();
}finally{await server.close();}
