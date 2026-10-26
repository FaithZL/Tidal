import {readFile} from 'node:fs/promises';
import {afterEach,expect,test,vi} from 'vitest';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {prepareUserModel} from '../../src/game/world/userModel.js';
import {createUserCharacterRig,type UserCharacterRig} from '../../src/game/world/userCharacterRig.js';
import {UserCharacterMotion} from '../../src/game/world/userCharacterMotion.js';
import {deriveUserChopContact} from '../../src/game/world/userChopContact.js';
import {createUserHandGrip} from '../../src/game/world/userHandGrip.js';
const cleanup:(()=>void)[]=[];
afterEach(()=>{cleanup.splice(0).forEach(dispose=>dispose());vi.restoreAllMocks();});
async function fixture(){
 vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation(()=>new T.Texture());vi.spyOn(console,'warn').mockImplementation(()=>{});
 const bytes=await readFile(new URL('../../public/assets/user-models/character.fbx',import.meta.url));
 const rig=createUserCharacterRig(prepareUserModel(new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),'character'));
 cleanup.push(()=>rig.dispose());return {rig,motion:new UserCharacterMotion(rig)};
}
function points(rig:UserCharacterRig):T.Vector3[]{
 rig.root.updateMatrixWorld(true);rig.skeleton.update();const position=rig.mesh.geometry.getAttribute('position');
 return Array.from({length:position.count},(_,i)=>rig.mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(position,i)).applyMatrix4(rig.mesh.matrixWorld));
}
function landmarks(rig:UserCharacterRig,motion:UserCharacterMotion):T.Vector3[]{return [motion.bladePosition(),motion.handPosition('left'),motion.handPosition('right'),rig.bones.head.getWorldPosition(new T.Vector3()),rig.bones.leftForeArm.getWorldPosition(new T.Vector3())];}
function axePoints(rig:UserCharacterRig):T.Vector3[]{
 const position=rig.axe.mesh.geometry.getAttribute('position');return Array.from({length:position.count},(_,i)=>rig.axe.mesh.localToWorld(new T.Vector3().fromBufferAttribute(position,i)));
}
test('the real supplied body stands up and deforms at its own hips and arms instead of moving as one rigid statue',async()=>{
 const {rig,motion}=await fixture(),source=points(rig),bindHip=rig.bones.pelvis.position.y;
 motion.sample(0);const stand=points(rig);expect(rig.bones.pelvis.position.y).toBeGreaterThan(bindHip+.03);
 motion.sample(3.4);const raised=points(rig);
 expect(Math.max(...raised.map((point,i)=>point.distanceTo(stand[i])))).toBeGreaterThan(.25);
 const displacements=stand.map((point,i)=>point.clone().sub(source[i]));
 expect(displacements.some(point=>point.distanceTo(displacements[0])>.15)).toBe(true);
});
test('both feet and the actual low sole vertices stay planted throughout the local chop',async()=>{
 const {rig,motion}=await fixture();motion.sample(0);const baseline=points(rig),soles=baseline.map((point,i)=>({point,i})).filter(({point})=>point.y<.018);
 expect(soles.length).toBeGreaterThan(20);
 const feet=[rig.bones.leftFoot.getWorldPosition(new T.Vector3()),rig.bones.rightFoot.getWorldPosition(new T.Vector3())];
 for(let t=0;t<7.1;t+=.1){
  motion.sample(t);const current=points(rig);
  for(const {point,i} of soles)expect(current[i].distanceTo(point),`sole ${i} slides at ${t.toFixed(2)}`).toBeLessThan(.015);
  expect(rig.bones.leftFoot.getWorldPosition(new T.Vector3()).distanceTo(feet[0])).toBeLessThan(.0001);
  expect(rig.bones.rightFoot.getWorldPosition(new T.Vector3()).distanceTo(feet[1])).toBeLessThan(.0001);
 }
});
test('both palm markers keep contact with two different points of the actual rigid source handle',async()=>{
 const {rig,motion}=await fixture();
 for(let t=0;t<7.1;t+=.05){
  motion.sample(t);
  const left=rig.axe.root.localToWorld(rig.axe.grips.upper.clone()),right=rig.axe.root.localToWorld(rig.axe.grips.lower.clone());
  expect(motion.handPosition('left').distanceTo(left),`left ${t.toFixed(2)}`).toBeLessThan(.006);
  expect(motion.handPosition('right').distanceTo(right),`right ${t.toFixed(2)}`).toBeLessThan(.006);
  expect(left.distanceTo(right)).toBeGreaterThan(.18);
 }
});
test('the source axe remains rigid and recovery never repeats the high preparation',async()=>{
 const {rig,motion}=await fixture(),positions=rig.axe.mesh.geometry.getAttribute('position'),a=new T.Vector3().fromBufferAttribute(positions,0),b=new T.Vector3().fromBufferAttribute(positions,45);
 motion.sample(0);const length=rig.axe.mesh.localToWorld(a.clone()).distanceTo(rig.axe.mesh.localToWorld(b.clone()));
 motion.sample(3.5);const high=motion.bladePosition().y;expect(high).toBeGreaterThan(2);
 for(let t=4.4;t<7.1;t+=.05){motion.sample(t);expect(motion.bladePosition().y).toBeLessThan(high-.3);expect(rig.axe.mesh.localToWorld(a.clone()).distanceTo(rig.axe.mesh.localToWorld(b.clone()))).toBeCloseTo(length,6);}
});
test.each([2.4,3.35,3.65,4.15,4.2,4.27,4.28,4.4,4.7,5.6,7.1])('the actual hands blade and head are continuous across the %ss stage boundary',async boundary=>{
 const {rig,motion}=await fixture();motion.sample(boundary-.00001);const before=landmarks(rig,motion);motion.sample(boundary+.00001);
 landmarks(rig,motion).forEach((point,i)=>expect(point.distanceTo(before[i])).toBeLessThan(.0002));
});
test('motion respects scene placement and invalid time does not poison skin matrices',async()=>{
 const {rig,motion}=await fixture();motion.sample(.8);const local=motion.bladePosition();
 rig.root.position.set(3,.2,-2);rig.root.rotation.y=.4;motion.sample(.8);const expected=rig.root.localToWorld(local.clone());
 expect(motion.bladePosition().distanceTo(expected)).toBeLessThan(.00001);
 motion.sample(Number.NaN);expect(points(rig).every(point=>point.toArray().every(Number.isFinite))).toBe(true);
});
test('a direct cut from the raised pose to standing is detected as a visible jump',async()=>{
 const {motion}=await fixture();motion.sample(3.5);const high=motion.bladePosition();motion.sample(0);expect(motion.bladePosition().distanceTo(high)).toBeGreaterThan(.5);
});

test('uniform scene scaling keeps the real hands on the handle and both foot bones on their original support',async()=>{
 const {rig,motion}=await fixture();const parent=new T.Group();parent.position.set(2,.3,-1);parent.scale.setScalar(.9);parent.add(rig.root);rig.root.scale.setScalar(.8);rig.root.rotation.y=.4;
 for(const time of [0,1,3.5,4.15,4.8,6]){
  motion.sample(time);
  for(const side of ['left','right'] as const){
   const foot=side==='left'?'leftFoot':'rightFoot',grip=side==='left'?rig.axe.grips.upper:rig.axe.grips.lower;
   expect(motion.handPosition(side).distanceTo(rig.axe.root.localToWorld(grip.clone())),`${side} ${time}`).toBeLessThan(.006);
   expect(rig.bones[foot].getWorldPosition(new T.Vector3()).distanceTo(rig.root.localToWorld(rig.rest[foot].worldPosition.clone()))).toBeLessThan(.0001);
  }
 }
});

test('the entire sampled source axe clears the wood surface during recoil and recovery, instead of dragging through the stump',async()=>{
 const {rig,motion}=await fixture();motion.sample(4.15);const {center:hit,radius,surfaceY:top}=deriveUserChopContact(rig);
 const within=(point:T.Vector3)=>Math.hypot(point.x-hit.x,point.z-hit.z)<radius;
 for(let time=4.15;time<=5.6;time+=.01){
  motion.sample(time);for(const point of axePoints(rig).filter(within))expect(point.y,`axe inside wood at ${time.toFixed(2)}s`).toBeGreaterThanOrEqual(top-.002);
 }
});

test('the blade first lifts out of the wood before returning sideways to the low standing grip',async()=>{
 const {motion}=await fixture();motion.sample(4.15);const hit=motion.bladePosition();
 motion.sample(4.7);const clear=motion.bladePosition();expect(clear.y).toBeGreaterThan(hit.y+.10);expect(Math.hypot(clear.x-hit.x,clear.z-hit.z)).toBeLessThan(.12);
 motion.sample(5.2);const away=motion.bladePosition();expect(Math.hypot(away.x-hit.x,away.z-hit.z)).toBeGreaterThan(.23);
});

test('the blade holds contact while the upper body absorbs the strike, then makes a small controlled rebound',async()=>{
 const {rig,motion}=await fixture();motion.sample(4.15);const hit=motion.bladePosition(),head=rig.bones.head.getWorldPosition(new T.Vector3());
 motion.sample(4.19);expect(motion.bladePosition().distanceTo(hit)).toBeLessThan(.002);expect(rig.bones.head.getWorldPosition(new T.Vector3()).distanceTo(head)).toBeGreaterThan(.004);
 motion.sample(4.28);expect(motion.bladePosition().y).toBeGreaterThan(hit.y+.02);expect(motion.bladePosition().y).toBeLessThan(hit.y+.06);
});

test('the motion aligns each real hand grasp opening with the handle instead of centering the shaft on palm skin',async()=>{
 const {rig,motion}=await fixture(),grip=createUserHandGrip(rig);
 for(const time of [0,3.5,4.15,4.28,4.7,5.2]){
  motion.sample(time);
  for(const side of ['left','right'] as const){
   const hand=rig.bones[`${side}Hand`],expected=rig.axe.root.localToWorld((side==='left'?rig.axe.grips.upper:rig.axe.grips.lower).clone());
   expect(hand.localToWorld(grip.centers[side].clone()).distanceTo(expected),`${side} actual grasp opening at ${time}`).toBeLessThan(.006);
   const axis=new T.Vector3(0,1,0).applyQuaternion(grip.frames[side]).applyQuaternion(rig.rest[`${side}Hand`].worldQuaternion.clone().invert()).applyQuaternion(hand.getWorldQuaternion(new T.Quaternion()));
   const shaft=new T.Vector3(0,1,0).applyQuaternion(rig.axe.root.getWorldQuaternion(new T.Quaternion()));expect(axis.distanceTo(shaft)).toBeLessThan(.00001);
  }
 }
});

test.each([4.15,4.4])('head absorption eases its velocity across %ss without a small snap at the neck',async boundary=>{
 const {rig,motion}=await fixture(),epsilon=.0001;
 const at=(time:number)=>{motion.sample(time);return rig.bones.head.getWorldPosition(new T.Vector3());};
 const center=at(boundary),before=center.clone().sub(at(boundary-epsilon)).divideScalar(epsilon),after=at(boundary+epsilon).sub(center).divideScalar(epsilon);
 expect(before.distanceTo(after)).toBeLessThan(.01);
});

test('an interrupted stroke can retract without losing either real grasp or the planted feet',async()=>{
 const {rig,motion}=await fixture();motion.sample(3.8);motion.beginTransition();
 for(const blend of [0,.1,.25,.5,.75,1]){
  motion.sampleTransition(5.6,blend);
  for(const side of ['left','right'] as const){
   const foot=`${side}Foot` as const,grip=side==='left'?rig.axe.grips.upper:rig.axe.grips.lower;
   expect(motion.handPosition(side).distanceTo(rig.axe.root.localToWorld(grip.clone())),`${side} at ${blend}`).toBeLessThan(.006);
   expect(rig.bones[foot].getWorldPosition(new T.Vector3()).distanceTo(rig.root.localToWorld(rig.rest[foot].worldPosition.clone()))).toBeLessThan(.0001);
  }
 }
});
