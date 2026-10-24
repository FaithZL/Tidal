import * as T from 'three';
import {GLTFLoader,type GLTF} from 'three/addons/loaders/GLTFLoader.js';
import type {NprPalette} from './nprMaterials.js';
import type {WorldResources} from './resources.js';
import {createSampleHead} from './sampleHead.js';
import {addSampleCostume,retintSampleGarment} from './sampleCostume.js';

function bone(root:T.Object3D,name:string):T.Object3D{
 const object=root.getObjectByName(name);if(!object)throw new Error(`Character sample is missing bone ${name}`);return object;
}
function worldQuaternion(object:T.Object3D):T.Quaternion{return object.getWorldQuaternion(new T.Quaternion());}
function finiteTime(time:number):number{return Number.isFinite(time)?Math.max(0,time):0;}
/** GLTFLoader owns decoded bitmap images separately from WebGL texture allocations. */
function releaseOwnedTextures(textures:Iterable<T.Texture>):void{
 const images=new Set<unknown>();
 for(const texture of new Set(textures)){images.add(texture.source.data);texture.dispose();}
 for(const image of images)if(image&&typeof image==='object'&&'close' in image&&typeof image.close==='function')image.close();
}
function releaseLoaded(assets:readonly GLTF[]):void{
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>(),skeletons=new Set<T.Skeleton>();
 for(const asset of assets)asset.scene.traverse(object=>{
  if(!(object instanceof T.Mesh))return;geometries.add(object.geometry);if(object instanceof T.SkinnedMesh)skeletons.add(object.skeleton);
  for(const material of Array.isArray(object.material)?object.material:[object.material]){
   materials.add(material);for(const value of Object.values(material))if(value instanceof T.Texture)textures.add(value);
  }
 });
 skeletons.forEach(skeleton=>skeleton.dispose());geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());releaseOwnedTextures(textures);
}

/** Keep the garment's bind lengths; transfer rotations through the two rigs' world-space rest bases. */
function fitClip(source:GLTF,target:T.Object3D,name:string):T.AnimationClip{
 const clip=source.animations.find(clip=>clip.name===name);if(!clip)throw new Error(`Character sample is missing animation ${name}`);
 source.scene.updateMatrixWorld(true);target.updateMatrixWorld(true);
 const names=clip.tracks.filter(track=>track.name.endsWith('.quaternion')).map(track=>track.name.slice(0,-11));
 const sourceBones=new Map(names.map(name=>[name,bone(source.scene,name)]));
 const targetBones=new Map(names.map(name=>[name,bone(target,name)]));
 const sourceRest=new Map(names.map(name=>[name,worldQuaternion(sourceBones.get(name)!)]));
 const targetRest=new Map(names.map(name=>[name,worldQuaternion(targetBones.get(name)!)]));
 const parentRest=new Map(names.map(name=>[name,worldQuaternion(targetBones.get(name)!.parent!)]));
 const values=new Map(names.map(name=>[name,[] as number[]]));
 const times=[...new Set(clip.tracks.flatMap(track=>Array.from(track.times)))].sort((a,b)=>a-b);
 const mixer=new T.AnimationMixer(source.scene),action=mixer.clipAction(clip);action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();
 const sourcePelvis=bone(source.scene,'pelvis'),targetPelvis=bone(target,'pelvis');
 const sourcePosition=sourcePelvis.position.clone(),targetPosition=targetPelvis.position.clone(),pelvisValues:number[]=[];
 const heightRatio=targetPosition.length()/sourcePosition.length();
 for(const time of times){
  action.enabled=true;action.time=time;mixer.update(0);source.scene.updateMatrixWorld(true);
  const desired=new Map<string,T.Quaternion>();
  for(const name of names){
   desired.set(name,worldQuaternion(sourceBones.get(name)!).multiply(sourceRest.get(name)!.clone().invert()).multiply(targetRest.get(name)!));
  }
  for(const name of names){
   const parent=targetBones.get(name)!.parent!,parentRotation=desired.get(parent.name)??parentRest.get(name)!;
   const local=parentRotation.clone().invert().multiply(desired.get(name)!).normalize();values.get(name)!.push(...local.toArray());
  }
  pelvisValues.push(...sourcePelvis.position.clone().sub(sourcePosition).multiplyScalar(heightRatio).add(targetPosition).toArray());
 }
 mixer.stopAllAction();mixer.uncacheRoot(source.scene);
 const tracks:T.KeyframeTrack[]=names.map(name=>new T.QuaternionKeyframeTrack(`${name}.quaternion`,times,values.get(name)!));
 tracks.push(new T.VectorKeyframeTrack('pelvis.position',times,pelvisValues));
 return new T.AnimationClip(name,clip.duration,tracks);
}

function setWorldQuaternion(object:T.Object3D,rotation:T.Quaternion):void{
 object.quaternion.copy(worldQuaternion(object.parent!).invert().multiply(rotation));object.updateWorldMatrix(false,true);
}
function aimJoint(joint:T.Object3D,current:T.Vector3,target:T.Vector3):void{
 const origin=joint.getWorldPosition(new T.Vector3()),from=current.clone().sub(origin).normalize(),to=target.clone().sub(origin).normalize();
 if(from.lengthSq()<.5||to.lengthSq()<.5)return;
 setWorldQuaternion(joint,new T.Quaternion().setFromUnitVectors(from,to).multiply(worldQuaternion(joint)));
}

/** Analytic two-bone reach blends the authored elbow towards the presentation pole without changing bind lengths. */
function reach(upper:T.Object3D,lower:T.Object3D,hand:T.Object3D,target:T.Vector3,elbowPole:T.Vector3,weight:number):void{
 const shoulder=upper.getWorldPosition(new T.Vector3()),elbow=lower.getWorldPosition(new T.Vector3()),wrist=hand.getWorldPosition(new T.Vector3());
 const a=shoulder.distanceTo(elbow),b=elbow.distanceTo(wrist),direction=target.clone().sub(shoulder),distance=T.MathUtils.clamp(direction.length(),Math.abs(a-b)+.001,a+b-.001);direction.normalize();
 const authored=elbow.clone().sub(shoulder).addScaledVector(direction,-elbow.clone().sub(shoulder).dot(direction)).normalize();
 const wanted=elbowPole.clone().addScaledVector(direction,-elbowPole.dot(direction)).normalize();
 const pole=authored.applyQuaternion(new T.Quaternion().identity().slerp(new T.Quaternion().setFromUnitVectors(authored,wanted),weight));
 if(pole.lengthSq()<.00001)pole.set(0,0,1).addScaledVector(direction,-direction.z);pole.normalize();
 const along=(a*a+distance*distance-b*b)/(2*distance),rise=Math.sqrt(Math.max(0,a*a-along*along));
 const wantedElbow=shoulder.clone().addScaledVector(direction,along).addScaledVector(pole,rise);
 aimJoint(upper,elbow,wantedElbow);aimJoint(lower,hand.getWorldPosition(new T.Vector3()),target);
}

/** Weld positions only for topology discovery: UV splits in the source must not turn into extra garment openings. */
function boundaryLoops(geometry:T.BufferGeometry):number[][]{
 const positions=geometry.getAttribute('position'),index=geometry.index!,welded=new Map<string,number>(),ids:number[]=[],edges=new Map<string,{a:number;b:number;count:number}>();
 for(let i=0;i<positions.count;i++){
  const key=new T.Vector3().fromBufferAttribute(positions,i).toArray().map(value=>value.toFixed(5)).join('/');
  if(!welded.has(key))welded.set(key,i);ids.push(welded.get(key)!);
 }
 for(let i=0;i<index.count;i+=3)for(let j=0;j<3;j++){
  const a=ids[index.getX(i+j)],b=ids[index.getX(i+(j+1)%3)],key=a<b?`${a}/${b}`:`${b}/${a}`,edge=edges.get(key);
  if(edge)edge.count++;else edges.set(key,{a,b,count:1});
 }
 const remaining=[...edges.values()].filter(edge=>edge.count===1),loops:number[][]=[];
 while(remaining.length){
  const edge=remaining.pop()!,loop=new Set([edge.a,edge.b]);let changed=true;
  while(changed){changed=false;for(let i=remaining.length-1;i>=0;i--)if(loop.has(remaining[i].a)||loop.has(remaining[i].b)){
   loop.add(remaining[i].a);loop.add(remaining[i].b);remaining.splice(i,1);changed=true;
  }}
  loops.push([...loop]);
 }
 return loops;
}
function adjacentRing(geometry:T.BufferGeometry,loop:number[]):number[]{
 const positions=geometry.getAttribute('position'),index=geometry.index!,key=(i:number):string=>new T.Vector3().fromBufferAttribute(positions,i).toArray().map(value=>value.toFixed(5)).join('/');
 const existing=new Set(loop.map(key)),next=new Map<string,number>();
 for(let i=0;i<index.count;i+=3){
  const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];if(!ids.some(id=>existing.has(key(id))))continue;
  for(const id of ids)if(!existing.has(key(id)))next.set(key(id),id);
 }
 if(next.size!==loop.length)throw new Error('Character sample is missing its rolled cuff rim');return [...next.values()];
}

/**
 * The modular CC0 sleeves continue underneath the tunic from x≈.15 to its cuff at x≈.30.
 * Their different shoulder weights make the two cloth surfaces cross even in the source bind pose.
 * Tailor that overlap away: each brown sleeve starts inside the actual 18-vertex rolled rim,
 * inherits its skin weights and continues to the original elbow cuff. The small radial clearance
 * leaves room for the existing leather strap; UVs reuse the original sleeve texture strip.
 */
function joinedSleeves(sleeves:T.SkinnedMesh,tunic:T.SkinnedMesh):T.BufferGeometry{
 const source=sleeves.geometry,cap=tunic.geometry,sourcePositions=source.getAttribute('position'),capPositions=cap.getAttribute('position');
 const caps=boundaryLoops(cap).filter(loop=>loop.length===18),cuffs=boundaryLoops(source).filter(loop=>loop.length===18);
 const center=(geometry:T.BufferGeometry,loop:number[]):T.Vector3=>loop.reduce((sum,i)=>sum.add(new T.Vector3().fromBufferAttribute(geometry.getAttribute('position'),i)),new T.Vector3()).multiplyScalar(1/loop.length);
 const positions:number[]=[],uvs:number[]=[],indices:number[]=[],skinIndices:number[]=[],skinWeights:number[]=[];
 const segments=6,count=18;
 for(const side of[-1,1]){
  const opening=caps.find(loop=>center(cap,loop).x*side>.2),ends=cuffs.filter(loop=>center(source,loop).x*side>0).sort((a,b)=>Math.abs(center(source,b).x)-Math.abs(center(source,a).x));
  if(!opening||ends.length!==2)throw new Error('Character sample sleeve topology does not match its CC0 source');
  const start=adjacentRing(cap,opening);
  const end=ends[0],originalRoot=ends[1],startCenter=center(cap,start),endCenter=center(source,end);
  const ordered=(geometry:T.BufferGeometry,loop:number[],origin:T.Vector3):number[]=>loop.sort((a,b)=>{
   const p=geometry.getAttribute('position');return Math.atan2(p.getZ(a)-origin.z,p.getY(a)-origin.y)-Math.atan2(p.getZ(b)-origin.z,p.getY(b)-origin.y);
  });
  ordered(cap,start,startCenter);ordered(source,end,endCenter);
  const sourceUv=source.getAttribute('uv'),uvRange=(loop:number[]):{u:number;min:number;max:number}=>({u:loop.reduce((sum,i)=>sum+sourceUv.getX(i),0)/loop.length,min:Math.min(...loop.map(i=>sourceUv.getY(i))),max:Math.max(...loop.map(i=>sourceUv.getY(i)))});
  const rootUv=uvRange(originalRoot),cuffUv=uvRange(end),offset=positions.length/3;
  const weights=(geometry:T.BufferGeometry,i:number):Map<number,number>=>{
   const result=new Map<number,number>(),joints=geometry.getAttribute('skinIndex'),weights=geometry.getAttribute('skinWeight');
   for(let j=0;j<4;j++)if(weights.getComponent(i,j)>0)result.set(joints.getComponent(i,j),weights.getComponent(i,j));return result;
  };
  for(let row=0;row<=segments;row++)for(let column=0;column<=count;column++){
   const fraction=row/segments,j=column%count,position=new T.Vector3().fromBufferAttribute(capPositions,start[j]).lerp(new T.Vector3().fromBufferAttribute(sourcePositions,end[j]),fraction);
   // Leave radial room under the rolled rim and its leather strap before widening towards the original elbow cuff.
   const ringCenter=startCenter.clone().lerp(endCenter,fraction),inset=(1-fraction)*.06+Math.sin(Math.PI*fraction)*.3;
   position.y=T.MathUtils.lerp(position.y,ringCenter.y,inset);position.z=T.MathUtils.lerp(position.z,ringCenter.z,inset);
   positions.push(...position.toArray());uvs.push(T.MathUtils.lerp(rootUv.u,cuffUv.u,fraction),T.MathUtils.lerp(T.MathUtils.lerp(rootUv.min,rootUv.max,column/count),T.MathUtils.lerp(cuffUv.min,cuffUv.max,column/count),fraction));
   const blended=new Map<number,number>();
   for(const [joint,weight] of weights(cap,start[j]))blended.set(joint,weight*(1-fraction));
   for(const [joint,weight] of weights(source,end[j]))blended.set(joint,(blended.get(joint)??0)+weight*fraction);
   const influences=[...blended].sort((a,b)=>b[1]-a[1]).slice(0,4),total=influences.reduce((sum,pair)=>sum+pair[1],0);
   for(let k=0;k<4;k++){skinIndices.push(influences[k]?.[0]??0);skinWeights.push((influences[k]?.[1]??0)/total);}
   if(row<segments&&column<count){const a=offset+row*(count+1)+column,b=a+1,c=a+count+1,d=c+1;indices.push(...(side>0?[a,b,c,b,d,c]:[a,c,b,b,c,d]));}
  }
 }
 const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(positions,3));result.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
 result.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIndices,4));result.setAttribute('skinWeight',new T.Float32BufferAttribute(skinWeights,4));result.setIndex(indices);result.computeVertexNormals();return result;
}
/** Remove the source forearm's hidden overlap under the elbow cuff, preserving the visible forearm and all fingers. */
function fittedForearms(skin:T.SkinnedMesh,sleeves:T.SkinnedMesh):T.BufferGeometry{
 const original=skin.geometry,result=original.clone(),positions=result.getAttribute('position'),joints=result.getAttribute('skinIndex'),weights=result.getAttribute('skinWeight');
 const sleevePositions=sleeves.geometry.getAttribute('position'),sleeveJoints=sleeves.geometry.getAttribute('skinIndex'),sleeveWeights=sleeves.geometry.getAttribute('skinWeight');
 const skinLoops=boundaryLoops(original),sleeveLoops=boundaryLoops(sleeves.geometry),center=(geometry:T.BufferGeometry,loop:number[]):T.Vector3=>loop.reduce((sum,i)=>sum.add(new T.Vector3().fromBufferAttribute(geometry.getAttribute('position'),i)),new T.Vector3()).multiplyScalar(1/loop.length);
 for(const side of[-1,1]){
  const root=skinLoops.find(loop=>center(original,loop).x*side>0),cuff=sleeveLoops.filter(loop=>center(sleeves.geometry,loop).x*side>0).sort((a,b)=>Math.abs(center(sleeves.geometry,b).x)-Math.abs(center(sleeves.geometry,a).x))[0];
  if(!root||!cuff)throw new Error('Character sample is missing the forearm cuff');
  const rootCenter=center(original,root),cuffCenter=center(sleeves.geometry,cuff),start=Math.max(...root.map(i=>Math.abs(positions.getX(i))));
  const angle=(p:T.Vector3,center:T.Vector3):number=>Math.atan2(p.z-center.z,p.y-center.y);
  const ring=cuff.map(i=>({i,angle:angle(new T.Vector3().fromBufferAttribute(sleevePositions,i),cuffCenter)})).sort((a,b)=>a.angle-b.angle);
  for(let i=0;i<positions.count;i++){
   const point=new T.Vector3().fromBufferAttribute(positions,i);if(point.x*side<=0||Math.abs(point.x)>=.57)continue;
   const fraction=T.MathUtils.smoothstep(Math.abs(point.x),start,.57),theta=angle(point,rootCenter);
   let right=ring.findIndex(p=>p.angle>theta);if(right<0)right=0;const left=(right+ring.length-1)%ring.length;
   const a=ring[left],b=ring[right],angleA=a.angle,angleB=b.angle+(right===0?Math.PI*2:0),alpha=((theta<angleA?theta+Math.PI*2:theta)-angleA)/(angleB-angleA);
   const anchor=new T.Vector3().fromBufferAttribute(sleevePositions,a.i).lerp(new T.Vector3().fromBufferAttribute(sleevePositions,b.i),alpha);
   anchor.y=T.MathUtils.lerp(anchor.y,cuffCenter.y,.04);anchor.z=T.MathUtils.lerp(anchor.z,cuffCenter.z,.04);anchor.x+=side*.003;
   point.lerp(anchor,1-fraction);positions.setXYZ(i,point.x,point.y,point.z);
   const influences=new Map<number,number>();
   for(let j=0;j<4;j++){
    influences.set(joints.getComponent(i,j),(influences.get(joints.getComponent(i,j))??0)+weights.getComponent(i,j)*fraction);
    for(const [id,share] of [[a.i,1-alpha],[b.i,alpha]])influences.set(sleeveJoints.getComponent(id,j),(influences.get(sleeveJoints.getComponent(id,j))??0)+sleeveWeights.getComponent(id,j)*share*(1-fraction));
   }
   const selected=[...influences].sort((a,b)=>b[1]-a[1]).slice(0,4),total=selected.reduce((sum,pair)=>sum+pair[1],0);
   for(let j=0;j<4;j++){joints.setComponent(i,j,selected[j]?.[0]??0);weights.setComponent(i,j,(selected[j]?.[1]??0)/total);}
  }
 }
 result.computeVertexNormals();return result;
}

/** Isolated visual sample; its caller owns the presentation clock. */
export class SampleCharacter{
 readonly root=new T.Group();readonly clipDuration:number;
 private readonly mixer:T.AnimationMixer;private readonly idle:T.AnimationAction;private readonly chop:T.AnimationAction;
 private readonly left:T.Object3D;private readonly right:T.Object3D;private readonly leftUpper:T.Object3D;private readonly leftLower:T.Object3D;private readonly rightUpper:T.Object3D;
 private readonly body:T.Group;private readonly bodyBaseY:number;private readonly feet:T.SkinnedMesh[]=[];
 private readonly neck:T.Mesh;private readonly head:T.Object3D;private readonly collar:T.Object3D;
 private readonly axe=new T.Group();private readonly leftGrip=new T.Object3D();private readonly blade=new T.Object3D();
 private readonly geometries=new Set<T.BufferGeometry>();private readonly materials=new Set<T.Material>();private readonly textures=new Set<T.Texture>();private readonly skeletons=new Set<T.Skeleton>();
 private previous='';private disposed=false;
 constructor(resources:WorldResources,palette:NprPalette,body:GLTF,idle:GLTF,chop:GLTF){
  this.root.name='local-character-motion-sample';
  const idleClip=fitClip(idle,body.scene,'Idle_Loop'),chopClip=fitClip(chop,body.scene,'TreeChopping_Loop');this.clipDuration=chopClip.duration;
  this.body=body.scene;this.bodyBaseY=body.scene.position.y;this.root.add(body.scene);body.scene.scale.multiplyScalar(1.06);body.scene.updateMatrixWorld(true);
  const sleeves=bone(body.scene,'Male_Peasant_Arms_1'),tunic=bone(body.scene,'Male_Peasant_Body'),skin=bone(body.scene,'Male_Peasant_Arms_2');
  if(!(sleeves instanceof T.SkinnedMesh)||!(tunic instanceof T.SkinnedMesh)||!(skin instanceof T.SkinnedMesh))throw new Error('Character sample is missing its skinned garment');
  this.geometries.add(skin.geometry);skin.geometry=fittedForearms(skin,sleeves);
  this.geometries.add(sleeves.geometry);sleeves.geometry=joinedSleeves(sleeves,tunic);
  this.left=bone(body.scene,'hand_l');this.right=bone(body.scene,'hand_r');this.leftUpper=bone(body.scene,'upperarm_l');this.leftLower=bone(body.scene,'lowerarm_l');this.rightUpper=bone(body.scene,'upperarm_r');
  const replacements=new Map<T.Material,T.Material>();
  body.scene.traverse(object=>{
   if(!(object instanceof T.Mesh))return;this.geometries.add(object.geometry);object.castShadow=true;object.receiveShadow=false;object.frustumCulled=false;
   if(object instanceof T.SkinnedMesh){this.skeletons.add(object.skeleton);if(object.name==='Male_Peasant_Feet')this.feet.push(object);}
   const original=Array.isArray(object.material)?object.material:[object.material];
   const materials=original.map(material=>{
    const result=replacements.get(material);if(result)return result;
    const standard=material instanceof T.MeshStandardMaterial?material:null;
    const toon=new T.MeshToonMaterial({name:`sample-${material.name}`,color:standard?.color??new T.Color(0xffffff),map:standard?.map??null,side:material.side,alphaTest:material.alphaTest,transparent:material.transparent,opacity:material.opacity});
    toon.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <gradientmap_pars_fragment>',`vec3 getGradientIrradiance(vec3 n,vec3 l){float t=smoothstep(0.15,0.83,dot(n,l)*0.5+0.5);return mix(vec3(0.64,0.68,0.73),vec3(1.0,0.97,0.89),t);}`);};
    toon.customProgramCacheKey=()=>`tidal-character-soft-toon-v1`;
    for(const value of Object.values(material))if(value instanceof T.Texture)this.textures.add(value);
    replacements.set(material,toon);this.materials.add(toon);return toon;
   });
   const kind=object.name==='Male_Peasant_Arms_1'?'linen':object.name==='Male_Peasant_Body'?'tunic':object.name==='Male_Peasant_Legs'?'trousers':object.name==='Male_Peasant_Feet'?'boots':null;
   const styled=materials.map(material=>{if(!kind)return material;const result=retintSampleGarment(material as T.MeshToonMaterial,kind);this.materials.add(result);return result;});
   object.material=Array.isArray(object.material)?styled:styled[0];
  });
  replacements.forEach((_replacement,original)=>original.dispose());
  const head=createSampleHead(resources,palette),headBone=bone(body.scene,'Head');
  head.position.set(0,-.065,0);head.scale.set(.84,.86,.86);head.quaternion.copy(worldQuaternion(headBone).invert());headBone.add(head);
  // Broad toon lighting keeps the face readable; the character still casts its full shadow onto the stage.
  head.traverse(object=>{if(object instanceof T.Mesh)object.receiveShadow=false;});
  this.head=head;this.collar=bone(body.scene,'neck_01');
  addSampleCostume(resources,palette,this.collar,bone(body.scene,'spine_03'),bone(body.scene,'pelvis'),tunic);
  this.neck=resources.cylinder(.055,.071,1,0xe7bf98,16);this.neck.material=palette.material(0xe7bf98);this.neck.name='sample-character-neck';this.neck.castShadow=true;this.neck.receiveShadow=false;this.root.add(this.neck);
  this.axe.name='sample-axe';this.axe.position.set(0,.065,0);this.axe.rotation.x=Math.PI/2;this.right.add(this.axe);
  const shaft=resources.cylinder(.022,.026,.95,0x977347,12,'wood');shaft.position.y=.13;shaft.castShadow=true;this.axe.add(shaft);
  const metal=resources.roundedBox(.3,.22,.06,.022,0x7f9699);metal.material=palette.material(0x8fabae);metal.position.set(.11,.57,0);metal.castShadow=true;this.axe.add(metal);
  const edge=resources.roundedBox(.04,.23,.065,.01,0xc3d1cd);edge.material=palette.material(0xc3d1cd);edge.position.set(.26,.57,0);edge.castShadow=true;this.axe.add(edge);
  this.leftGrip.name='sample-axe-left-grip';this.leftGrip.position.y=-.3;this.blade.position.set(.28,.57,0);this.axe.add(this.leftGrip,this.blade);
  this.mixer=new T.AnimationMixer(body.scene);this.idle=this.mixer.clipAction(idleClip);this.chop=this.mixer.clipAction(chopClip);
  for(const action of[this.idle,this.chop]){action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();}
  this.sample(0,null,0);
 }
 sample(idleTimeSec:number,chopTimeSec:number|null,weight:number):void{
  if(this.disposed)return;
  const idleTime=finiteTime(idleTimeSec)%this.idle.getClip().duration,chopTime=Math.min(this.clipDuration,finiteTime(chopTimeSec??0));
  const blend=chopTimeSec===null||!Number.isFinite(weight)?0:T.MathUtils.clamp(weight,0,1),key=`${blend===1?0:idleTime}/${blend===0?0:chopTime}/${blend}`;
  if(this.previous===key){this.root.updateMatrixWorld(true);return;}this.previous=key;
  this.idle.enabled=this.chop.enabled=true;this.idle.time=idleTime;this.chop.time=chopTime;this.idle.setEffectiveWeight(1-blend);this.chop.setEffectiveWeight(blend);
  this.body.position.y=this.bodyBaseY;this.mixer.update(0);this.root.updateMatrixWorld(true);
  this.contact(blend);this.groundFeet();this.joinNeck();
  this.root.updateMatrixWorld(true);
 }
 private groundFeet():void{
  const inverse=this.root.matrixWorld.clone().invert(),vertex=new T.Vector3();let lowest=Infinity;
  for(const mesh of this.feet){
   const positions=mesh.geometry.getAttribute('position');
   for(let i=0;i<positions.count;i++){
    mesh.applyBoneTransform(i,vertex.fromBufferAttribute(positions,i)).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);lowest=Math.min(lowest,vertex.y);
   }
  }
  if(Number.isFinite(lowest))this.body.position.y-=lowest;this.root.updateMatrixWorld(true);
 }
 private joinNeck():void{
  const inverse=this.root.matrixWorld.clone().invert(),start=this.collar.getWorldPosition(new T.Vector3()).applyMatrix4(inverse),end=this.head.localToWorld(new T.Vector3(0,.12,-.015)).applyMatrix4(inverse);
  const direction=end.clone().sub(start);this.neck.position.copy(start).add(end).multiplyScalar(.5);this.neck.scale.y=direction.length();this.neck.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
 }
 private contact(blend:number):void{
  // Orient the rigid shaft, then solve the other arm onto its lower grip.
  const shoulder=this.leftUpper.getWorldPosition(new T.Vector3()),opposite=this.rightUpper.getWorldPosition(new T.Vector3()),across=shoulder.clone().sub(opposite).normalize();
  const up=this.collar.getWorldPosition(new T.Vector3()).sub(shoulder.clone().add(opposite).multiplyScalar(.5)).normalize(),forward=new T.Vector3().crossVectors(across,up).normalize();
  const wrist=this.right.getWorldPosition(new T.Vector3());
  const desiredShaft=new T.Vector3(0,-1,0).lerp(wrist.clone().sub(shoulder).normalize(),blend).normalize(),currentShaft=new T.Vector3(0,0,1).applyQuaternion(worldQuaternion(this.right));
  const desiredRotation=new T.Quaternion().setFromUnitVectors(currentShaft,desiredShaft).multiply(worldQuaternion(this.right));
  setWorldQuaternion(this.right,desiredRotation);this.root.updateMatrixWorld(true);if(blend===0)return;
  const wantedRotation=worldQuaternion(this.right).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI));
  const leftRotation=worldQuaternion(this.left).slerp(wantedRotation,blend);
  const palmOffset=new T.Vector3(0,.065,0).multiply(this.left.getWorldScale(new T.Vector3())).applyQuaternion(leftRotation);
  const wantedWrist=this.leftGrip.getWorldPosition(new T.Vector3()).sub(palmOffset),originalWrist=this.left.getWorldPosition(new T.Vector3());
  const elbowPole=forward.addScaledVector(across,1.2);
  reach(this.leftUpper,this.leftLower,this.left,originalWrist.lerp(wantedWrist,blend),elbowPole,blend);setWorldQuaternion(this.left,leftRotation);
 }
 handPosition():T.Vector3{return this.left.localToWorld(new T.Vector3(0,.065,0)).add(this.right.localToWorld(new T.Vector3(0,.065,0))).multiplyScalar(.5);}
 bladePosition():T.Vector3{return this.blade.getWorldPosition(new T.Vector3());}
 dispose():void{
  if(this.disposed)return;this.disposed=true;this.mixer.stopAllAction();this.mixer.uncacheRoot(this.mixer.getRoot());
  this.skeletons.forEach(skeleton=>skeleton.dispose());this.geometries.forEach(geometry=>geometry.dispose());this.materials.forEach(material=>material.dispose());releaseOwnedTextures(this.textures);this.root.clear();
 }
}
export async function loadSampleCharacter(resources:WorldResources,palette:NprPalette,baseUrl:string):Promise<SampleCharacter>{
 const directory=`${baseUrl.replace(/\/?$/,'/')}assets/character-motion/`,loader=new GLTFLoader();
 const results=await Promise.allSettled([loader.loadAsync(`${directory}Male_Peasant.gltf`),loader.loadAsync(`${directory}idle.glb`),loader.loadAsync(`${directory}tree-chopping.glb`)]);
 const loaded=results.filter((result):result is PromiseFulfilledResult<GLTF>=>result.status==='fulfilled').map(result=>result.value);
 const failure=results.find(result=>result.status==='rejected');
 if(failure?.status==='rejected'){releaseLoaded(loaded);throw failure.reason;}
 const [body,idle,chop]=loaded;
 try{return new SampleCharacter(resources,palette,body,idle,chop);}catch(error){releaseLoaded(loaded);throw error;}
}
