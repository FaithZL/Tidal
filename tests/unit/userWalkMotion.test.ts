import {readFile} from 'node:fs/promises';
import {afterEach,expect,test,vi} from 'vitest';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {prepareUserModel} from '../../src/game/world/userModel.js';
import {createUserCharacterRig,type UserCharacterRig} from '../../src/game/world/userCharacterRig.js';
import {UserWalkMotion} from '../../src/game/world/userWalkMotion.js';
import type {WorldActor} from '../../src/game/world/types.js';

const cleanup:(()=>void)[]=[];
afterEach(()=>{cleanup.splice(0).forEach(dispose=>dispose());vi.restoreAllMocks();});
const actor:WorldActor={position:{x:0,y:0,z:0},yaw:0,mode:'walk',pose:'ready',stride:0};
async function fixture(){
 vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation(()=>new T.Texture());vi.spyOn(console,'warn').mockImplementation(()=>{});
 const bytes=await readFile(new URL('../../public/assets/user-models/character.fbx',import.meta.url));
 const model=prepareUserModel(new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),'character');
 const source=model.root.getObjectByProperty('isMesh',true) as T.Mesh,rig=createUserCharacterRig(model);cleanup.push(()=>rig.dispose());
 return {rig,motion:new UserWalkMotion(rig),source};
}
function localVertex(rig:UserCharacterRig,i:number):T.Vector3{
 return rig.root.worldToLocal(rig.mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(rig.mesh.matrixWorld));
}
function soles(rig:UserCharacterRig,side:'left'|'right'):number[]{
 const position=rig.mesh.geometry.getAttribute('position'),index=rig.mesh.geometry.getAttribute('skinIndex'),weight=rig.mesh.geometry.getAttribute('skinWeight');
 const chain=[rig.bones[`${side}Foot`],rig.bones[`${side}Shin`],rig.bones[`${side}Thigh`]].map(bone=>rig.skeleton.bones.indexOf(bone));
 const foot=Array.from({length:position.count},(_,i)=>i).filter(i=>Array.from({length:4},(_,j)=>chain.includes(index.getComponent(i,j))?weight.getComponent(i,j):0).reduce((a,b)=>a+b,0)>.8),floor=Math.min(...foot.map(i=>position.getY(i)));
 return foot.filter(i=>position.getY(i)<floor+.018);
}
function pose(rig:UserCharacterRig):number[][]{
 return rig.skeleton.bones.map(bone=>[...bone.position.toArray(),...bone.quaternion.toArray()]);
}
function palm(rig:UserCharacterRig,side:'left'|'right'):T.Vector3{return rig.bones[`${side}Hand`].localToWorld(rig.palms[side].clone());}

test('walking deforms the supplied skin with opposite forward and backward steps without editing its geometry',async()=>{
 const {rig,motion,source}=await fixture(),geometry=Array.from(rig.mesh.geometry.getAttribute('position').array),uv=Array.from(source.geometry.getAttribute('uv').array);
 motion.update(actor,16);const before=Array.from({length:rig.mesh.geometry.getAttribute('position').count},(_,i)=>localVertex(rig,i));
 const left=rig.bones.leftFoot.getWorldPosition(new T.Vector3()),right=rig.bones.rightFoot.getWorldPosition(new T.Vector3());
 motion.update({...actor,stride:Math.PI},16);
 expect(left.z-rig.bones.leftFoot.getWorldPosition(new T.Vector3()).z).toBeGreaterThan(.35);
 expect(rig.bones.rightFoot.getWorldPosition(new T.Vector3()).z-right.z).toBeGreaterThan(.35);
 expect(Math.max(...before.map((point,i)=>localVertex(rig,i).distanceTo(point)))).toBeGreaterThan(.2);
 expect(Array.from(rig.mesh.geometry.getAttribute('position').array)).toEqual(geometry);expect(Array.from(source.geometry.getAttribute('uv').array)).toEqual(uv);
});
for(const mode of ['walk','push','pull'] as const)test(`${mode} alternates the actual grounded and raised sole skin`,async()=>{
 const {rig,motion}=await fixture(),left=soles(rig,'left'),right=soles(rig,'right');expect(left.length).toBeGreaterThan(10);expect(right.length).toBeGreaterThan(10);
 motion.update({...actor,mode,stride:Math.PI/2},16);
 const low=(indices:number[])=>Math.min(...indices.map(i=>localVertex(rig,i).y));
 expect(low(left)).toBeGreaterThanOrEqual(-.02);expect(low(left)).toBeLessThan(.02);expect(low(right)).toBeGreaterThan(.045);
 motion.update({...actor,mode,stride:3*Math.PI/2},16);
 expect(low(right)).toBeGreaterThanOrEqual(-.02);expect(low(right)).toBeLessThan(.02);expect(low(left)).toBeGreaterThan(.045);
});
test('all observed gait samples keep both real shoes above the floor and preserve arm and leg lengths',async()=>{
 const {rig,motion}=await fixture(),left=soles(rig,'left'),right=soles(rig,'right');
 const chains=[['leftThigh','leftShin'],['leftShin','leftFoot'],['rightThigh','rightShin'],['rightShin','rightFoot'],['leftUpperArm','leftForeArm'],['leftForeArm','leftHand'],['rightUpperArm','rightForeArm'],['rightForeArm','rightHand']] as const;
 const lengths=chains.map(([a,b])=>rig.rest[a].worldPosition.distanceTo(rig.rest[b].worldPosition));
 for(const mode of ['walk','push','pull'] as const)for(let i=0;i<24;i++){
  motion.update({...actor,mode,stride:i*Math.PI/12},16);
  expect(Math.min(...[...left,...right].map(index=>localVertex(rig,index).y)),`${mode}/${i} shoe`).toBeGreaterThanOrEqual(-.02);
  for(const [j,[a,b]] of chains.entries())expect(rig.bones[a].getWorldPosition(new T.Vector3()).distanceTo(rig.bones[b].getWorldPosition(new T.Vector3()))).toBeCloseTo(lengths[j],6);
 }
});
for(const mode of ['push','pull'] as const)test(`${mode} fixes both actual palms to the existing handles under transformed and scaled parents`,async()=>{
 const {rig,motion}=await fixture(),parent=new T.Group();parent.position.set(3,.2,-4);parent.rotation.set(.07,.7,-.03);parent.scale.set(.85,.7,1.1);parent.add(rig.root);
 for(const stride of [0,Math.PI/2,Math.PI,3*Math.PI/2]){
  motion.update({...actor,mode,stride},16);
  for(const side of ['left','right'] as const){
   const expected=rig.root.localToWorld(new T.Vector3(side==='left'?.35:-.35,1.04,mode==='push'?.5:-.55));
   expect(palm(rig,side).distanceTo(expected)).toBeLessThan(.00001);
  }
  expect(motion.handPosition().distanceTo(palm(rig,'left').add(palm(rig,'right')).multiplyScalar(.5))).toBeLessThan(.000001);
 }
});
test('entering a push or pull while the torso is transitioning still reaches both handles',async()=>{
 const {rig,motion}=await fixture();motion.update({...actor,mode:'idle'},16);
 for(const mode of ['push','walk','pull','push'] as const)for(let i=0;i<12;i++){
  motion.update({...actor,mode,stride:i*.3},16);
  if(mode==='walk')continue;
  for(const side of ['left','right'] as const)expect(palm(rig,side).distanceTo(new T.Vector3(side==='left'?.35:-.35,1.04,mode==='push'?.5:-.55)),`${mode}/${i}/${side}`).toBeLessThan(.00001);
 }
});
test('walking swings real arms and has bounded pelvis and head follow',async()=>{
 const {rig,motion}=await fixture();motion.update({...actor,stride:Math.PI/2},16);const left=palm(rig,'left'),right=palm(rig,'right'),pelvis=rig.bones.pelvis.getWorldPosition(new T.Vector3()),head=rig.bones.head.getWorldPosition(new T.Vector3());
 motion.update({...actor,stride:3*Math.PI/2},16);
 expect(palm(rig,'left').z-left.z).toBeGreaterThan(.1);expect(right.z-palm(rig,'right').z).toBeGreaterThan(.1);
 expect(rig.bones.pelvis.getWorldPosition(new T.Vector3()).distanceTo(pelvis)).toBeGreaterThan(.02);
 expect(rig.bones.head.getWorldPosition(new T.Vector3()).distanceTo(head)).toBeLessThan(.15);
});
test('invalid intervals freeze exact bones and revision even when mode changes; reset permits a new snapshot',async()=>{
 const {rig,motion}=await fixture();motion.update(actor,16);motion.update({...actor,stride:.7},16);const before=pose(rig),revision=motion.visualRevision;
 for(const delta of [0,-1,101,1000,Number.NaN,Number.POSITIVE_INFINITY])motion.update({...actor,mode:'pull',stride:3},delta);
 expect(pose(rig)).toEqual(before);expect(motion.visualRevision).toBe(revision);
 motion.reset();motion.update({...actor,mode:'push'},0);expect(pose(rig)).not.toEqual(before);
 expect(palm(rig,'left').distanceTo(new T.Vector3(.35,1.04,.5))).toBeLessThan(.00001);
});
test('unchanged stride and settled neutral modes never acquire a free running animation clock',async()=>{
 const {rig,motion}=await fixture();motion.update({...actor,stride:1.2},16);const walking=pose(rig),walkRevision=motion.visualRevision;
 for(let i=0;i<20;i++)motion.update({...actor,stride:1.2},16);expect(pose(rig)).toEqual(walking);expect(motion.visualRevision).toBe(walkRevision);
 for(const mode of ['idle','secure','celebrate'] as const){
  motion.update({...actor,mode});const before=pose(rig),revision=motion.visualRevision;
  for(let i=0;i<20;i++)motion.update({...actor,mode,stride:i},16);
  expect(pose(rig)).toEqual(before);expect(motion.visualRevision).toBe(revision);
  expect(pose(rig).flat().every(Number.isFinite)).toBe(true);
 }
});
test('a stopped stride settles its observed handoff once and then freezes without walking in place',async()=>{
 const {rig,motion}=await fixture();motion.update({...actor,stride:Math.PI/2},16);
 for(let i=0;i<12;i++)motion.update({...actor,mode:'idle',stride:Math.PI/2},16);
 const before=pose(rig),revision=motion.visualRevision;
 for(let i=0;i<30;i++)motion.update({...actor,mode:'idle',stride:Math.PI/2},16);
 expect(pose(rig)).toEqual(before);expect(motion.visualRevision).toBe(revision);
 for(const side of ['left','right'] as const)expect(Math.min(...soles(rig,side).map(i=>localVertex(rig,i).y))).toBeGreaterThanOrEqual(-.02);
});
