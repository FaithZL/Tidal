import {readFile} from 'node:fs/promises';
import {afterEach,describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {prepareUserModel} from '../../src/game/world/userModel.js';
import {createUserCharacterRig} from '../../src/game/world/userCharacterRig.js';
import {UserCharacterMotion} from '../../src/game/world/userCharacterMotion.js';

afterEach(()=>vi.restoreAllMocks());
async function fixture(){
 vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation(()=>new T.Texture());vi.spyOn(console,'warn').mockImplementation(()=>{});
 const bytes=await readFile(new URL('../../public/assets/user-models/character.fbx',import.meta.url));
 const source=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const mesh=source.children.find((object):object is T.Mesh=>object instanceof T.Mesh)!;
 return {model:prepareUserModel(source,'character'),source,mesh};
}
function changedVertices(mesh:T.SkinnedMesh,indices:readonly number[],before:readonly T.Vector3[]):number{
 mesh.parent!.updateMatrixWorld(true);mesh.skeleton.update();
 return indices.filter((index,i)=>mesh.getVertexPosition(index,new T.Vector3()).distanceTo(before[i])>.015).length;
}
function components(geometry:T.BufferGeometry):number[][]{
 const points=geometry.getAttribute('position'),linked=new Map<string,number[]>(),keys:string[]=[],seen=new Set<number>(),result:number[][]=[];
 for(let i=0;i<points.count;i++){const key=new T.Vector3().fromBufferAttribute(points,i).toArray().map(v=>v.toFixed(5)).join('/');keys.push(key);const corners=linked.get(key)??[];corners.push(i);linked.set(key,corners);}
 for(let i=0;i<points.count;i+=3){if(seen.has(i))continue;const stack=[i],corners:number[]=[];seen.add(i);
  while(stack.length){const tri=stack.pop()!;for(let j=0;j<3;j++){const corner=tri+j;corners.push(corner);for(const neighbor of linked.get(keys[corner])!){const next=Math.floor(neighbor/3)*3;if(!seen.has(next)){seen.add(next);stack.push(next);}}}}result.push(corners);
 }return result;
}
describe('derived skeleton on the actual user character',()=>{
 it('binds a real articulated skeleton while retaining the original file metadata',async()=>{
  const {model}=await fixture(),rig=createUserCharacterRig(model);
  try{
   expect(model.motionSupport).toBe('static');expect(rig.motionSupport).toBe('derived-skeleton');expect(rig.root).toBe(model.root);
   expect(rig.mesh).toBeInstanceOf(T.SkinnedMesh);expect(rig.skeleton.bones).toHaveLength(17);
   expect(rig.bones.leftForeArm.parent).toBe(rig.bones.leftUpperArm);expect(rig.bones.leftShin.parent).toBe(rig.bones.leftThigh);
   expect(rig.bones.head.parent).toBe(rig.bones.neck);expect(rig.bones.leftUpperArm.parent).toBe(rig.bones.chest);
   const indices=rig.mesh.geometry.getAttribute('skinIndex'),weights=rig.mesh.geometry.getAttribute('skinWeight');
   expect(indices.count).toBe(14010);expect(weights.count).toBe(indices.count);
   const influenced=new Set<number>();
   for(let i=0;i<weights.count;i++){
    let sum=0;for(let j=0;j<4;j++){const weight=weights.getComponent(i,j),index=indices.getComponent(i,j);expect(Number.isFinite(weight)).toBe(true);expect(weight).toBeGreaterThanOrEqual(0);expect(index).toBeGreaterThanOrEqual(0);expect(index).toBeLessThan(17);sum+=weight;if(weight>.1)influenced.add(index);}
    expect(sum).toBeCloseTo(1,5);
   }
   expect(influenced.size).toBeGreaterThanOrEqual(15);
  }finally{rig.dispose();}
 });
 it('preserves every real source triangle, UV, texture and original mesh transform',async()=>{
  const {model,mesh}=await fixture(),positions=Array.from(mesh.geometry.getAttribute('position').array),uvs=Array.from(mesh.geometry.getAttribute('uv').array),matrix=mesh.matrix.clone(),sourceMaterial=mesh.material;
  model.root.updateMatrixWorld(true);const relative=model.root.matrixWorld.clone().invert().multiply(mesh.matrixWorld),sourcePoints=mesh.geometry.getAttribute('position');
  const rig=createUserCharacterRig(model);
  try{
   expect(rig.bodySourceCorners.length+rig.axeSourceCorners.length).toBe(14700);expect(rig.axeSourceCorners.length).toBe(230*3);
   expect(new Set([...rig.bodySourceCorners,...rig.axeSourceCorners]).size).toBe(14700);
   for(const [geometry,corners] of [[rig.mesh.geometry,rig.bodySourceCorners],[rig.axe.mesh.geometry,rig.axeSourceCorners]] as const){
    const sourceUv=mesh.geometry.getAttribute('uv'),uv=geometry.getAttribute('uv');
    corners.forEach((corner,index)=>{expect(uv.getX(index)).toBe(sourceUv.getX(corner));expect(uv.getY(index)).toBe(sourceUv.getY(corner));});
   }
   rig.root.updateMatrixWorld(true);rig.skeleton.update();
   for(let i=0;i<rig.bodySourceCorners.length;i+=137){const expected=new T.Vector3().fromBufferAttribute(sourcePoints,rig.bodySourceCorners[i]).applyMatrix4(relative),actual=rig.mesh.getVertexPosition(i,new T.Vector3());expect(actual.distanceTo(expected)).toBeLessThan(.000002);}
   expect(rig.mesh.material).toBe(sourceMaterial);expect(rig.axe.mesh.material).toBe(sourceMaterial);
   expect(Array.from(mesh.geometry.getAttribute('position').array)).toEqual(positions);expect(Array.from(mesh.geometry.getAttribute('uv').array)).toEqual(uvs);expect(mesh.matrix.equals(matrix)).toBe(true);
  }finally{rig.dispose();}
 });
 it('exposes +Y joint bases pointing to each anatomical child for the animation solver',async()=>{
  const {model}=await fixture(),rig=createUserCharacterRig(model);
  try{
   for(const name of ['pelvis','spine','chest','neck','leftUpperArm','leftForeArm','rightUpperArm','rightForeArm','leftThigh','leftShin','rightThigh','rightShin'] as const){
    const child=rig.bones[name].children.find((value):value is T.Bone=>value instanceof T.Bone)!;
    const direction=child.getWorldPosition(new T.Vector3()).sub(rig.bones[name].getWorldPosition(new T.Vector3())).normalize(),basis=new T.Vector3(0,1,0).applyQuaternion(rig.bones[name].getWorldQuaternion(new T.Quaternion()));
    expect(basis.distanceTo(direction),name).toBeLessThan(.000001);
   }
  }finally{rig.dispose();}
 });
 it('moves the actual forearm and shin skin when their bones bend instead of rocking the whole character',async()=>{
  const {model}=await fixture(),rig=createUserCharacterRig(model);
  try{
   const index=rig.mesh.geometry.getAttribute('skinIndex'),weight=rig.mesh.geometry.getAttribute('skinWeight');
   const affected=(bone:T.Bone)=>Array.from({length:index.count},(_,i)=>i).filter(i=>Array.from({length:4},(_,j)=>j).some(j=>index.getComponent(i,j)===rig.skeleton.bones.indexOf(bone)&&weight.getComponent(i,j)>.65));
   const arm=affected(rig.bones.leftForeArm),leg=affected(rig.bones.rightShin);expect(arm.length).toBeGreaterThan(40);expect(leg.length).toBeGreaterThan(40);
   const sample=(values:readonly number[])=>values.map(i=>rig.mesh.getVertexPosition(i,new T.Vector3()));
   const armBefore=sample(arm),legBefore=sample(leg),headOrigin=rig.bones.head.getWorldPosition(new T.Vector3()),rootOrigin=rig.root.position.clone();
   rig.bones.leftForeArm.rotateX(.35);rig.bones.rightShin.rotateX(-.3);
   expect(changedVertices(rig.mesh,arm,armBefore)).toBeGreaterThan(arm.length*.75);expect(changedVertices(rig.mesh,leg,legBefore)).toBeGreaterThan(leg.length*.75);
   expect(rig.bones.head.getWorldPosition(new T.Vector3()).distanceTo(headOrigin)).toBeLessThan(.00001);expect(rig.root.position.equals(rootOrigin)).toBe(true);
   rig.resetPose();rig.root.updateMatrixWorld(true);rig.skeleton.update();expect(changedVertices(rig.mesh,arm,armBefore)).toBe(0);
  }finally{rig.dispose();}
 });
 it('keeps the complete source axe rigid and exposes two shaft grip landmarks',async()=>{
  const {model}=await fixture(),rig=createUserCharacterRig(model);
  try{
   expect(rig.axe.root.parent).toBe(rig.root);expect(rig.axe.mesh).not.toBeInstanceOf(T.SkinnedMesh);
   const positions=rig.axe.mesh.geometry.getAttribute('position'),a=new T.Vector3().fromBufferAttribute(positions,0),b=new T.Vector3().fromBufferAttribute(positions,positions.count-1),distance=a.distanceTo(b);
   rig.axe.root.rotation.set(.7,-.4,.2);rig.root.updateMatrixWorld(true);
   expect(rig.axe.mesh.localToWorld(a.clone()).distanceTo(rig.axe.mesh.localToWorld(b.clone()))).toBeCloseTo(distance,6);
   expect(rig.axe.grips.upper.distanceTo(rig.axe.grips.lower)).toBeGreaterThan(.18);expect(rig.axe.grips.upper.distanceTo(rig.axe.blade)).toBeGreaterThan(.4);
   expect(rig.axe.mesh.geometry.getAttribute('skinWeight')).toBeUndefined();
  }finally{rig.dispose();}
 });
 it('attaches disconnected belt pouches to the pelvis instead of their nearby moving arms',async()=>{
  const {model}=await fixture(),rig=createUserCharacterRig(model);
  try{
   const pouches=components(rig.mesh.geometry).filter(corners=>corners.length===108*3);expect(pouches).toHaveLength(3);
   const selected=pouches.flat(),before=selected.map(index=>rig.mesh.getVertexPosition(index,new T.Vector3()));
   rig.bones.leftUpperArm.rotateX(.8);rig.bones.rightUpperArm.rotateX(-.7);
   expect(changedVertices(rig.mesh,selected,before)).toBe(0);
   rig.resetPose();rig.bones.pelvis.rotateY(.3);expect(changedVertices(rig.mesh,selected,before)).toBeGreaterThan(selected.length*.95);
  }finally{rig.dispose();}
 });
 it('keeps the actual soles rigid when the ankle articulates for foot locking',async()=>{
  const {model}=await fixture(),rig=createUserCharacterRig(model);
  try{
   const positions=rig.mesh.geometry.getAttribute('position');
   for(const [name,selected] of [
    ['leftFoot',Array.from({length:positions.count},(_,i)=>i).filter(i=>positions.getX(i)>.45&&positions.getY(i)<.16)],
    ['rightFoot',Array.from({length:positions.count},(_,i)=>i).filter(i=>positions.getX(i)<.1&&positions.getY(i)<.10)],
   ] as const){
    expect(selected.length).toBeGreaterThan(30);const before=selected.map(i=>rig.mesh.getVertexPosition(i,new T.Vector3()));
    rig.bones[name].rotateX(.55);rig.root.updateMatrixWorld(true);rig.skeleton.update();const after=selected.map(i=>rig.mesh.getVertexPosition(i,new T.Vector3()));
    for(let i=1;i<selected.length;i+=7)expect(after[0].distanceTo(after[i])).toBeCloseTo(before[0].distanceTo(before[i]),5);
    rig.resetPose();
   }
  }finally{rig.dispose();}
 });
 it('keeps nearby hand and knee surface edges attached to their own anatomical chains',async()=>{
  const {model}=await fixture(),rig=createUserCharacterRig(model),motion=new UserCharacterMotion(rig),positions=rig.mesh.geometry.getAttribute('position');
  try{
   const pairs=[[1844,1842],[706,707],[1927,1928]] as const;
   for(const time of [0,3.4,3.95,4.95]){
    motion.sample(time);rig.root.updateMatrixWorld(true);rig.skeleton.update();
    for(const [a,b] of pairs){
     const bind=new T.Vector3().fromBufferAttribute(positions,a).distanceTo(new T.Vector3().fromBufferAttribute(positions,b)),posed=rig.mesh.getVertexPosition(a,new T.Vector3()).distanceTo(rig.mesh.getVertexPosition(b,new T.Vector3()));
     expect(posed/bind,`source hand/knee edge ${a}/${b} at ${time}s`).toBeLessThan(2);
    }
   }
  }finally{rig.dispose();}
 });
 it('does not seed the chest bone from the actual skin beneath the jaw',async()=>{
  const {model}=await fixture(),rig=createUserCharacterRig(model);
  try{
   const indices=rig.mesh.geometry.getAttribute('skinIndex'),weights=rig.mesh.geometry.getAttribute('skinWeight');let chestWeight=0;
   // Independent source albedo audit identifies this exact surface corner as
   // skin under the jaw, not the blue chest garment behind it.
   for(let i=0;i<4;i++)if(rig.skeleton.bones[indices.getComponent(5299,i)]===rig.bones.chest)chestWeight+=weights.getComponent(5299,i);
   expect(chestWeight).toBeLessThan(.05);
  }finally{rig.dispose();}
 });
 for(const [side,time,a,b] of [['left',4.15,12940,12941],['right',0,2563,2564]] as const){
  it(`keeps the actual ${side} inner elbow surface from stretching across the joint`,async()=>{
   const {model}=await fixture(),rig=createUserCharacterRig(model),motion=new UserCharacterMotion(rig),positions=rig.mesh.geometry.getAttribute('position');
   try{
    const original=new T.Vector3().fromBufferAttribute(positions,a).distanceTo(new T.Vector3().fromBufferAttribute(positions,b));
    for(const sample of [time,0,3.4,3.95,4.15,4.95,5.6]){
     motion.sample(sample);rig.root.updateMatrixWorld(true);rig.skeleton.update();
     const deformed=rig.mesh.getVertexPosition(a,new T.Vector3()).distanceTo(rig.mesh.getVertexPosition(b,new T.Vector3()));
     expect(deformed/original,`${side} elbow ${a}/${b} at ${sample}s`).toBeLessThan(1.8);
    }
   }finally{rig.dispose();}
  });
 }
 it('excludes wrist and hand influence from the actual inner elbow skin',async()=>{
  const {model}=await fixture(),rig=createUserCharacterRig(model);
  try{
   const index=rig.mesh.geometry.getAttribute('skinIndex'),weight=rig.mesh.geometry.getAttribute('skinWeight');
   for(const [side,corners] of [['left',[12940,12941]],['right',[2563,2564]]] as const)for(const corner of corners){
    let hand=0;for(let j=0;j<4;j++)if(rig.skeleton.bones[index.getComponent(corner,j)]===rig.bones[`${side}Hand`])hand+=weight.getComponent(corner,j);
    expect(hand,`${side} hand leak at elbow ${corner}`).toBeLessThan(.005);
   }
  }finally{rig.dispose();}
 });
 it('keeps the shoulder sleeve from inheriting a forearm rotation through axial projection',async()=>{
  const {model}=await fixture(),rig=createUserCharacterRig(model),motion=new UserCharacterMotion(rig),positions=rig.mesh.geometry.getAttribute('position'),a=13263,b=13264;
  try{
   const original=new T.Vector3().fromBufferAttribute(positions,a).distanceTo(new T.Vector3().fromBufferAttribute(positions,b));
   for(const time of [2.9,3.4,3.9,4.15]){
    motion.sample(time);rig.root.updateMatrixWorld(true);rig.skeleton.update();
    expect(rig.mesh.getVertexPosition(a,new T.Vector3()).distanceTo(rig.mesh.getVertexPosition(b,new T.Vector3()))/original).toBeLessThan(2);
   }
  }finally{rig.dispose();}
 });
 it('confines forearm support to the distal upper arm instead of the shoulder sleeve',async()=>{
  const {model}=await fixture(),rig=createUserCharacterRig(model),index=rig.mesh.geometry.getAttribute('skinIndex'),weight=rig.mesh.geometry.getAttribute('skinWeight');
  try{
   for(const corner of [13263,13264]){
    let distal=0;for(let j=0;j<4;j++)if([rig.bones.leftForeArm,rig.bones.leftHand].includes(rig.skeleton.bones[index.getComponent(corner,j)]))distal+=weight.getComponent(corner,j);
    expect(distal,`left sleeve ${corner} inherits distal arm bones`).toBeLessThan(.025);
   }
  }finally{rig.dispose();}
 });
 it('owns only derived allocations and releases original model resources exactly once',async()=>{
  const {model,mesh}=await fixture(),sourceGeometryDisposed=vi.fn(),materialDisposed=vi.fn(),mapDisposed=vi.fn();
  mesh.geometry.addEventListener('dispose',sourceGeometryDisposed);const material=mesh.material as T.MeshToonMaterial;material.addEventListener('dispose',materialDisposed);material.map!.addEventListener('dispose',mapDisposed);
  const rig=createUserCharacterRig(model),bodyDisposed=vi.fn(),axeDisposed=vi.fn(),skeletonDispose=vi.spyOn(rig.skeleton,'dispose');rig.mesh.geometry.addEventListener('dispose',bodyDisposed);rig.axe.mesh.geometry.addEventListener('dispose',axeDisposed);
  rig.dispose();rig.dispose();model.dispose();
  for(const count of [sourceGeometryDisposed,materialDisposed,mapDisposed,bodyDisposed,axeDisposed,skeletonDispose])expect(count).toHaveBeenCalledTimes(1);expect(rig.root.children).toHaveLength(0);
 });
 it('rejects a house model rather than inventing character anatomy',()=>{
  const source=new T.Group();source.add(new T.Mesh(new T.BoxGeometry(),new T.MeshPhongMaterial()));const model=prepareUserModel(source,'house');
  try{expect(()=>createUserCharacterRig(model)).toThrow(/character|人物/i);}finally{model.dispose();}
 });
});
