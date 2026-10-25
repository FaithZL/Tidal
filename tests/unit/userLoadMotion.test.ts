import {readFile} from 'node:fs/promises';
import {afterEach,expect,test,vi} from 'vitest';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {prepareUserModel} from '../../src/game/world/userModel.js';
import {createUserCharacterRig,type UserCharacterRig} from '../../src/game/world/userCharacterRig.js';
import {UserLoadMotion} from '../../src/game/world/userLoadMotion.js';
import type {WorldActor} from '../../src/game/world/types.js';

const cleanup:(()=>void)[]=[];
afterEach(()=>{cleanup.splice(0).forEach(dispose=>dispose());vi.restoreAllMocks();});
const actor:WorldActor={position:{x:0,y:0,z:0},yaw:0,mode:'work',pose:'ready',stride:0};
async function fixture(){
 vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation(()=>new T.Texture());vi.spyOn(console,'warn').mockImplementation(()=>{});
 const bytes=await readFile(new URL('../../public/assets/user-models/character.fbx',import.meta.url));
 const model=prepareUserModel(new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),'character');
 const source=model.root.getObjectByProperty('isMesh',true) as T.Mesh,rig=createUserCharacterRig(model);cleanup.push(()=>rig.dispose());
 return {rig,motion:new UserLoadMotion(rig),source};
}
function points(rig:UserCharacterRig):T.Vector3[]{
 rig.root.updateMatrixWorld(true);rig.skeleton.update();const position=rig.mesh.geometry.getAttribute('position');
 return Array.from({length:position.count},(_,i)=>rig.mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(rig.mesh.matrixWorld));
}
test('load stages articulate the actual supplied body and palms while preserving source geometry and UVs',async()=>{
 const {rig,motion,source}=await fixture(),positions=Array.from(source.geometry.getAttribute('position').array),uv=Array.from(source.geometry.getAttribute('uv').array);
 motion.update(actor);const ready=points(rig),hand=motion.handPosition();
 motion.update({...actor,pose:'squat-down'});const squat=points(rig),low=motion.handPosition();
 expect(low.y).toBeLessThan(hand.y-.15);expect(Math.max(...squat.map((point,i)=>point.distanceTo(ready[i])))).toBeGreaterThan(.15);
 const hip=rig.bones.pelvis.position.y;motion.update({...actor,pose:'stand-up'});const standing=motion.handPosition();
 expect(rig.bones.pelvis.position.y-hip).toBeGreaterThan(.2);expect(standing.y).toBeGreaterThan(low.y+.2);
 motion.update({...actor,pose:'press-up'});expect(motion.handPosition().y).toBeGreaterThan(standing.y+.3);
 expect(Array.from(source.geometry.getAttribute('position').array)).toEqual(positions);expect(Array.from(source.geometry.getAttribute('uv').array)).toEqual(uv);expect(rig.mesh.material).toBe(source.material);
});
test('load IK keeps both foot contacts and the actual low sole vertices on their original supports',async()=>{
 const {rig,motion}=await fixture();motion.update(actor);const baseline=points(rig),soles=baseline.map((point,i)=>({point,i})).filter(({point})=>point.y<.018);
 expect(soles.length).toBeGreaterThan(20);
 for(const pose of ['squat-down','stand-up','press-up','load-return','ready'] as const){
  motion.update({...actor,pose});const current=points(rig);
  for(const side of ['left','right'] as const){const foot=`${side}Foot` as const;expect(rig.bones[foot].getWorldPosition(new T.Vector3()).distanceTo(rig.root.localToWorld(rig.rest[foot].worldPosition.clone()))).toBeLessThan(.0001);}
  for(const {point,i} of soles)expect(current[i].distanceTo(point),`${pose} sole ${i}`).toBeLessThan(.02);
  expect(Math.min(...current.map(point=>point.y))).toBeGreaterThan(-.025);
 }
});
test('release follows forward before the actual hands settle back down instead of replaying a chop',async()=>{
 const {motion}=await fixture();motion.update({...actor,pose:'press-up'});const high=motion.handPosition();
 for(let i=0;i<4;i++)motion.update({...actor,pose:'load-return'},30);const forward=motion.handPosition();
 expect(forward.z).toBeGreaterThan(high.z+.15);
 for(let i=0;i<8;i++)motion.update({...actor,pose:'load-return'},30);const returned=motion.handPosition();
 expect(returned.z).toBeLessThan(forward.z-.1);expect(returned.y).toBeLessThan(high.y-.3);
});
test('returning to ready after a settled throw does not pop the palms back upward',async()=>{
 const {motion}=await fixture();motion.update({...actor,pose:'press-up'});
 for(let i=0;i<12;i++)motion.update({...actor,pose:'load-return'},30);
 const settled=motion.handPosition();let previous=settled;
 for(let i=0;i<12;i++){
  motion.update(actor,16);const next=motion.handPosition();
  expect(next.distanceTo(previous)).toBeLessThan(.08);expect(next.y).toBeLessThan(settled.y+.05);previous=next;
 }
});
for(const duration of [120,135,240])test(`a new action after ${duration}ms of return continues from the displayed forward reach`,async()=>{
 const {motion}=await fixture();motion.update({...actor,pose:'press-up'});
 for(let elapsed=0;elapsed<duration;elapsed+=30)motion.update({...actor,pose:'load-return'},Math.min(30,duration-elapsed));
 const before=motion.handPosition();motion.update(actor,16);
 expect(motion.handPosition().distanceTo(before)).toBeLessThan(.08);
});
for(const duration of [128,140,210])test(`the next squat after ${duration}ms ready continues from the current palm position`,async()=>{
 const {motion}=await fixture();motion.update({...actor,pose:'press-up'});
 for(let elapsed=0;elapsed<135;elapsed+=30)motion.update({...actor,pose:'load-return'},Math.min(30,135-elapsed));
 for(let elapsed=0;elapsed<duration;elapsed+=16)motion.update(actor,Math.min(16,duration-elapsed));
 const before=motion.handPosition();motion.update({...actor,pose:'squat-down'},16);
 expect(motion.handPosition().distanceTo(before)).toBeLessThan(.08);
});
test('zero and unobserved intervals freeze the exact skin pose until a valid sample or explicit reset',async()=>{
 const {rig,motion}=await fixture();motion.update(actor);motion.update({...actor,pose:'squat-down'},30);const before=points(rig),revision=motion.visualRevision;
 for(const delta of [0,-1,101,1000,Number.NaN,Number.POSITIVE_INFINITY])motion.update({...actor,pose:'press-up'},delta);
 expect(points(rig).map(point=>point.toArray())).toEqual(before.map(point=>point.toArray()));expect(motion.visualRevision).toBe(revision);
 motion.reset();motion.update({...actor,pose:'press-up'},0);expect(motion.handPosition().y).toBeGreaterThan(1.6);
 expect(motion.visualRevision).toBeGreaterThan(revision);
});
test('the held log anchor is the actual two-palm midpoint under translated rotated and scaled parents',async()=>{
 const {rig,motion}=await fixture(),parent=new T.Group();parent.position.set(3,.2,-4);parent.rotation.y=.7;parent.scale.setScalar(.85);parent.add(rig.root);
 for(const pose of ['ready','squat-down','stand-up','press-up','load-return'] as const){
  motion.update({...actor,pose});const expected=rig.bones.leftHand.localToWorld(rig.palms.left.clone()).add(rig.bones.rightHand.localToWorld(rig.palms.right.clone())).multiplyScalar(.5);
  expect(motion.handPosition().distanceTo(expected)).toBeLessThan(.000001);expect(expected.toArray().every(Number.isFinite)).toBe(true);
 }
});
test('the raised actual log clears the supplied head skin instead of crossing the face',async()=>{
 const {rig,motion}=await fixture(),index=rig.mesh.geometry.getAttribute('skinIndex'),weight=rig.mesh.geometry.getAttribute('skinWeight'),head=rig.skeleton.bones.indexOf(rig.bones.head);
 const headVertices=Array.from({length:index.count},(_,i)=>i).filter(i=>Array.from({length:4},(_,j)=>j).some(j=>index.getComponent(i,j)===head&&weight.getComponent(i,j)>.5));
 expect(headVertices.length).toBeGreaterThan(100);
 motion.update({...actor,pose:'stand-up'});
 for(let elapsed=20;elapsed<=160;elapsed+=20){
  motion.update({...actor,pose:'press-up'},20);const center=motion.handPosition(),direction=new T.Vector3(1,0,0).applyQuaternion(rig.root.getWorldQuaternion(new T.Quaternion()));
  // The existing log has a .86m axis and .17m maximum radius. This samples the
  // actual head skin vertices; it is a clearance proxy, not full mesh collision.
  const axis=new T.Line3(center.clone().addScaledVector(direction,-.43),center.clone().addScaledVector(direction,.43)),closest=new T.Vector3();
  const clearance=Math.min(...headVertices.map(i=>{const point=rig.mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(rig.mesh.matrixWorld);return axis.closestPointToPoint(point,true,closest).distanceTo(point)-.17;}));
  expect(clearance,`head/log skin clearance at ${elapsed}ms`).toBeGreaterThan(.02);
 }
});
test('the released palms follow the upward throw for the first 80ms before lowering to recover',async()=>{
 const {motion}=await fixture();motion.update({...actor,pose:'press-up'});const released=motion.handPosition();
 for(let elapsed=10;elapsed<=80;elapsed+=10){motion.update({...actor,pose:'load-return'},10);expect(motion.handPosition().y,`palm height at ${elapsed}ms`).toBeGreaterThanOrEqual(released.y-.025);}
 expect(motion.handPosition().z).toBeGreaterThan(released.z+.02);
});
test('standing begins with the hips before the supported palms finish lifting the load',async()=>{
 const {rig,motion}=await fixture();motion.update({...actor,pose:'squat-down'});const lowHip=rig.bones.pelvis.position.y,lowHand=motion.handPosition().y;
 motion.update({...actor,pose:'stand-up'});const highHip=rig.bones.pelvis.position.y,highHand=motion.handPosition().y;
 motion.update({...actor,pose:'squat-down'});motion.update({...actor,pose:'stand-up'},100);
 const hipProgress=(rig.bones.pelvis.position.y-lowHip)/(highHip-lowHip),handProgress=(motion.handPosition().y-lowHand)/(highHand-lowHand);
 expect(hipProgress-handProgress).toBeGreaterThan(.12);
});
test('interrupting the new torso follow-through preserves the displayed head position',async()=>{
 const {rig,motion}=await fixture();motion.update({...actor,pose:'press-up'});
 for(let i=0;i<4;i++)motion.update({...actor,pose:'load-return'},30);
 const before=rig.bones.head.getWorldPosition(new T.Vector3());motion.update(actor,2);
 expect(rig.bones.head.getWorldPosition(new T.Vector3()).distanceTo(before)).toBeLessThan(.01);
});
