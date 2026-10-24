import {readFile} from 'node:fs/promises';
import {afterEach,expect,test,vi} from 'vitest';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {prepareUserModel} from '../../src/game/world/userModel.js';
import {createUserCharacterRig,type UserCharacterRig} from '../../src/game/world/userCharacterRig.js';
import {createUserHandGrip} from '../../src/game/world/userHandGrip.js';
import {UserCharacterMotion} from '../../src/game/world/userCharacterMotion.js';

const clean:(()=>void)[]=[];
afterEach(()=>{clean.splice(0).forEach(dispose=>dispose());vi.restoreAllMocks();});
async function fixture(){
 vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation(()=>new T.Texture());vi.spyOn(console,'warn').mockImplementation(()=>{});
 const bytes=await readFile(new URL('../../public/assets/user-models/character.fbx',import.meta.url)),source=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const sourceMesh=source.children.find((object):object is T.Mesh=>object instanceof T.Mesh)!;
 const original=Array.from(sourceMesh.geometry.getAttribute('position').array),rig=createUserCharacterRig(prepareUserModel(source,'character'));
 clean.push(()=>rig.dispose());return {rig,sourceMesh,original,grip:createUserHandGrip(rig)};
}
function rootCenter(rig:UserCharacterRig,side:'left'|'right',center:T.Vector3):T.Vector3{
 const rest=rig.rest[`${side}Hand`];return center.clone().applyQuaternion(rest.worldQuaternion).add(rest.worldPosition);
}
function handTriangles(rig:UserCharacterRig,side:'left'|'right'):number[]{
 const p=rig.mesh.geometry.getAttribute('position'),ids=rig.mesh.geometry.getAttribute('skinIndex'),weights=rig.mesh.geometry.getAttribute('skinWeight');
 const permitted=new Set([rig.skeleton.bones.indexOf(rig.bones[`${side}Hand`]),rig.skeleton.bones.indexOf(rig.bones[`${side}ForeArm`])]);
 const selected=(i:number)=>{let influence=0;for(let j=0;j<4;j++)if(permitted.has(ids.getComponent(i,j)))influence+=weights.getComponent(i,j);return influence>.96&&p.getY(i)<(side==='left'?1.05:.72);};
 const triangles:number[]=[];for(let i=0;i<p.count;i+=3)if(selected(i)&&selected(i+1)&&selected(i+2))triangles.push(i);return triangles;
}
/** Exact radial clearance of a triangle, after clipping it to a finite axial slab.
 * A face whose 2D projection covers the shaft axis has zero clearance even when
 * all three vertices lie outside it. This catches false marker/vertex passes. */
function surfaceClearance(rig:UserCharacterRig,side:'left'|'right',center:T.Vector3,frame:T.Quaternion,triangles:readonly number[]=handTriangles(rig,side),provider?:(index:number)=>T.Vector3):number{
 const p=rig.mesh.geometry.getAttribute('position'),inverse=frame.clone().invert();let minimum=Infinity;
 for(const first of triangles){
  let polygon=[0,1,2].map(offset=>(provider?provider(first+offset):new T.Vector3().fromBufferAttribute(p,first+offset)).sub(center).applyQuaternion(inverse));
  for(const [plane,sign] of [[-.065,1],[.065,-1]]){
   const clipped:T.Vector3[]=[];
   for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length],insideA=(a.y-plane)*sign>=0,insideB=(b.y-plane)*sign>=0;
    if(insideA)clipped.push(a);
    if(insideA!==insideB)clipped.push(a.clone().lerp(b,(plane-a.y)/(b.y-a.y)));
   }polygon=clipped;
  }
  if(polygon.length<2)continue;
  let positive=false,negative=false,area=0;
  for(let i=0;i<polygon.length;i++){
   const a=polygon[i],b=polygon[(i+1)%polygon.length],cross=a.x*b.z-a.z*b.x;
   area+=cross;
   if(cross>1e-10)positive=true;if(cross< -1e-10)negative=true;
   const dx=b.x-a.x,dz=b.z-a.z,denominator=dx*dx+dz*dz,t=denominator?T.MathUtils.clamp(-(a.x*dx+a.z*dz)/denominator,0,1):0;
   minimum=Math.min(minimum,Math.hypot(a.x+dx*t,a.z+dz*t));
  }
  if(Math.abs(area)>1e-10&&!(positive&&negative))minimum=0;
 }return minimum;
}
test('uses source grasp-axis centers rather than placing the handle inside the rough palm markers',async()=>{
 const {rig,grip}=await fixture();
 for(const side of ['left','right']as const){
  expect(grip.centers[side].distanceTo(rig.palms[side])).toBeGreaterThan(.04);
  const expected=side==='left'?new T.Vector3(.468,.900,-.040):new T.Vector3(.056,.578,.170);
  expect(rootCenter(rig,side,grip.centers[side]).distanceTo(expected)).toBeLessThan(.00001);
  expect(grip.frames[side].length()).toBeCloseTo(1,6);
 }
});
test('corrects the real finger and thumb triangle surfaces around the supplied handle, not only hand markers',async()=>{
 const {rig,grip}=await fixture();
 const selected={left:handTriangles(rig,'left'),right:handTriangles(rig,'right')};
 for(const side of ['left','right']as const){
  const center=rootCenter(rig,side,grip.centers[side]);
  expect(surfaceClearance(rig,side,center,grip.frames[side])).toBeLessThan(.025);
 }
 for(const pressure of [.85,.88,.95,1]){grip.apply(pressure);
 for(const side of ['left','right']as const){
  expect(selected[side].length).toBeGreaterThan(300);
  const center=rootCenter(rig,side,grip.centers[side]);
  // Actual original shaft cross-sections at the two grips reach radius .05094;
  // the approved constant .62 display scale makes it <.0316.
  expect(surfaceClearance(rig,side,center,grip.frames[side],selected[side]),`${side} source surface intersects the .62-scaled handle at pressure ${pressure}`).toBeGreaterThan(.0317);
 }}
});
test('changes only existing hand vertices by a bounded amount and preserves UVs source bytes and resource identities',async()=>{
 const {rig,grip,sourceMesh,original}=await fixture(),geometry=rig.mesh.geometry,p=geometry.getAttribute('position'),before=Array.from(p.array),uv=Array.from(geometry.getAttribute('uv').array),normal=Array.from(geometry.getAttribute('normal').array),material=rig.mesh.material,children=rig.root.children.length;
 grip.apply(.9);let moved=0,max=0;
 for(let i=0;i<p.count;i++){
  const prior=new T.Vector3(before[i*3],before[i*3+1],before[i*3+2]),distance=prior.distanceTo(new T.Vector3().fromBufferAttribute(p,i));
  if(distance<1e-8)continue;moved++;max=Math.max(max,distance);
  expect(prior.y<.73||(prior.x>.44&&prior.y<1.06)).toBe(true);
 }
 expect(moved).toBeGreaterThan(100);expect(max).toBeLessThan(.045);
 const currentNormal=geometry.getAttribute('normal');
 for(let i=0;i<p.count;i++)if(before[i*3+1]>1.06||(before[i*3]<.4&&before[i*3+1]>.73)){
  for(let j=0;j<3;j++)expect(currentNormal.getComponent(i,j)).toBe(normal[i*3+j]);
 }
 expect(Array.from(geometry.getAttribute('uv').array)).toEqual(uv);expect(Array.from(sourceMesh.geometry.getAttribute('position').array)).toEqual(original);
 expect(rig.mesh.geometry).toBe(geometry);expect(rig.mesh.material).toBe(material);expect(rig.root.children).toHaveLength(children);
 expect(Array.from(geometry.getAttribute('normal').array).every(Number.isFinite)).toBe(true);
 grip.restore();expect(Array.from(p.array)).toEqual(before);expect(Array.from(geometry.getAttribute('normal').array)).toEqual(normal);
});
test('pressure is deterministic idempotent and bounded even for invalid values',async()=>{
 const {rig,grip}=await fixture(),p=rig.mesh.geometry.getAttribute('position');
 grip.apply(.95);const once=Array.from(p.array),version=p.version;grip.apply(.95);expect(Array.from(p.array)).toEqual(once);expect(p.version).toBe(version);
 grip.apply(1);const tight=Array.from(p.array);expect(tight.some((v,i)=>Math.abs(v-once[i])>1e-5)).toBe(true);
 grip.apply(.95);expect(Array.from(p.array)).toEqual(once);
 for(const pressure of [NaN,Infinity,-1,2]){grip.apply(pressure);expect(Array.from(p.array).every(Number.isFinite)).toBe(true);}
});
test('keeps actual skinned finger surfaces clear of the real shaft throughout the integrated motion',async()=>{
 const {rig}=await fixture(),selected={left:handTriangles(rig,'left'),right:handTriangles(rig,'right')},motion=new UserCharacterMotion(rig);
 for(const time of [0,3.5,3.95,4.15,4.28,4.7,5.15]){
  motion.sample(time);rig.root.updateMatrixWorld(true);rig.skeleton.update();
  const frame=rig.axe.root.getWorldQuaternion(new T.Quaternion());
  for(const side of ['left','right']as const){
   const center=rig.axe.root.localToWorld(rig.axe.grips[side==='left'?'upper':'lower'].clone());
   const clearance=surfaceClearance(rig,side,center,frame,selected[side],index=>rig.mesh.getVertexPosition(index,new T.Vector3()).applyMatrix4(rig.mesh.matrixWorld));
   // The real displayed shaft is <=31.6 mm in radius; allow no more than
   // 1.5 mm of residual blending error rather than accepting gross overlap.
   expect(clearance,`${side} skinned hand at ${time}s`).toBeGreaterThan(.0301);
  }
 }
});
test('does not invert the actual finger pad triangles while opening a grip clearance',async()=>{
 const {rig,grip}=await fixture(),p=rig.mesh.geometry.getAttribute('position'),selected=[...handTriangles(rig,'left'),...handTriangles(rig,'right')];
 const before=selected.map(first=>[0,1,2].map(offset=>new T.Vector3().fromBufferAttribute(p,first+offset)));
 grip.apply(.95);
 selected.forEach((first,index)=>{
  const [a,b,c]=before[index],old=b.clone().sub(a).cross(c.clone().sub(a));if(old.lengthSq()<1e-12)return;
  const now=[0,1,2].map(offset=>new T.Vector3().fromBufferAttribute(p,first+offset));
  const current=now[1].sub(now[0]).cross(now[2].sub(now[0]));
  expect(current.length(),`collapsed source finger triangle ${first}`).toBeGreaterThan(old.length()*.12);
  expect(current.normalize().dot(old.normalize()),`source finger triangle ${first} inverted by corrective`).toBeGreaterThan(0);
 });
});
