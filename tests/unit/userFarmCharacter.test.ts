import {readFile} from 'node:fs/promises';
import {afterEach,expect,test,vi} from 'vitest';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {prepareUserModel} from '../../src/game/world/userModel.js';
import {UserLoadCharacter} from '../../src/game/world/userLoadCharacter.js';
import type {WorldActor} from '../../src/game/world/types.js';

const disposals:(()=>void)[]=[];
afterEach(()=>{disposals.splice(0).forEach(dispose=>dispose());vi.restoreAllMocks();});
const actor:WorldActor={position:{x:-4.75,y:0,z:1.35},yaw:-Math.PI/2,mode:'work',pose:'ready',stride:0};
async function fixture(){
 vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation(()=>new T.Texture());vi.spyOn(console,'warn').mockImplementation(()=>{});
 const bytes=await readFile(new URL('../../public/assets/user-models/character.fbx',import.meta.url));
 const model=prepareUserModel(new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),'character');
 const source=model.root.getObjectByProperty('isMesh',true) as T.Mesh;
 const value=new UserLoadCharacter(Promise.resolve(model),'farm');disposals.push(()=>value.dispose());await value.ready;
 const skin=value.root.getObjectByName('user-derived-skinned-body') as T.SkinnedMesh;
 return {value,source,skin};
}
function node(root:T.Object3D,name:string):T.Vector3{return root.getObjectByName(name)!.getWorldPosition(new T.Vector3());}
function settle(value:UserLoadCharacter,state:WorldActor,chopping:boolean){for(let i=0;i<30;i++)value.update(state,chopping,16);}

test('farm scope articulates the actual axe and hands for the existing chop phases',async()=>{
 const {value,source,skin}=await fixture();value.update(actor,true);const high=value.handPosition();
 expect(source.visible).toBe(false);expect(skin.visible).toBe(true);expect(value.root.getObjectByName('user-rigid-source-axe')!.visible).toBe(true);
 settle(value,{...actor,pose:'chop-down'},true);const low=value.handPosition();
 expect(high.y-low.y).toBeGreaterThan(.5);expect(value.root.getObjectByName('user-rigid-source-axe')!.visible).toBe(true);
 const blade=value.landmarks!.blade!;expect(Math.hypot(blade.x+6,blade.z-1)).toBeGreaterThan(.17);expect(Math.hypot(blade.x+6,blade.z-1)).toBeLessThan(.27);expect(blade.y).toBeGreaterThan(.3);expect(blade.y).toBeLessThan(.5);
 const hold=skin.skeleton.bones.map(bone=>bone.matrixWorld.toArray());settle(value,{...actor,pose:'chop-down'},true);
 expect(skin.skeleton.bones.map(bone=>bone.matrixWorld.toArray())).toEqual(hold);
 settle(value,{...actor,pose:'chop-return'},true);expect(value.handPosition().distanceTo(low)).toBeGreaterThan(.15);
});

test('explicit chop snapshots stay at their requested phase instead of replaying the start of the stroke',async()=>{
 const {value}=await fixture();
 for(const pose of ['ready','chop-down','chop-return'] as const){
  value.resetPresentation();value.update({...actor,pose},true,0);const before=value.handPosition();
  for(let i=0;i<8;i++)value.update({...actor,pose},true,16);
  expect(value.handPosition().distanceTo(before),pose).toBeLessThan(.000001);
 }
});

test('farm walk push and pull move the real feet instead of sliding the static source pose',async()=>{
 const {value,source,skin}=await fixture();
 for(const mode of ['walk','push','pull'] as const){
  const state={...actor,mode,stride:0};value.resetPresentation();value.update(state,false);
  const before=node(value.root,'user-leftFoot');
  value.update({...state,stride:Math.PI/2},false,16);
  expect(source.visible).toBe(false);expect(skin.visible).toBe(true);
  expect(node(value.root,'user-leftFoot').distanceTo(before),mode).toBeGreaterThan(.08);
  expect(value.root.getObjectByName('user-rigid-source-axe')!.visible).toBe(false);
 }
});

test('leaving a chop restores derived hand geometry and keeps the proven load pose unchanged',async()=>{
 const {value,source,skin}=await fixture(),sourcePositions=Array.from(source.geometry.getAttribute('position').array),uv=Array.from(source.geometry.getAttribute('uv').array);
 const load={...actor,pose:'press-up' as const};value.update(load,false);const positions=Array.from(skin.geometry.getAttribute('position').array),normal=Array.from(skin.geometry.getAttribute('normal').array),hand=value.handPosition();
 value.update(actor,true);settle(value,{...actor,pose:'chop-down'},true);value.update({...actor,mode:'walk'},false,16);value.update(load,false);
 expect(Array.from(skin.geometry.getAttribute('position').array)).toEqual(positions);expect(Array.from(skin.geometry.getAttribute('normal').array)).toEqual(normal);
 expect(value.handPosition().distanceTo(hand)).toBeLessThan(.000001);
 expect(Array.from(source.geometry.getAttribute('position').array)).toEqual(sourcePositions);expect(Array.from(source.geometry.getAttribute('uv').array)).toEqual(uv);expect(skin.material).toBe(source.material);
});

test('invalid or paused samples cannot change farm mode or its displayed bones before an explicit reset',async()=>{
 const {value,skin}=await fixture();value.update(actor,true);value.update({...actor,pose:'chop-down'},true,30);
 const before=skin.skeleton.bones.map(bone=>bone.matrixWorld.toArray()),revision=value.visualRevision,axe=value.root.getObjectByName('user-rigid-source-axe')!;
 for(const delta of [0,-1,101,NaN,Infinity])value.update({...actor,mode:'walk',stride:2},false,delta);
 expect(skin.skeleton.bones.map(bone=>bone.matrixWorld.toArray())).toEqual(before);expect(value.visualRevision).toBe(revision);expect(axe.visible).toBe(true);
 value.resetPresentation();value.update({...actor,mode:'walk',stride:0},false,0);expect(axe.visible).toBe(false);expect(value.handPosition().toArray().every(Number.isFinite)).toBe(true);
});

for(const downMs of [16,50,67])test(`an early return after ${downMs}ms cannot finish an unobserved strike`,async()=>{
 const {value}=await fixture();value.update({...actor,pose:'chop-down'},true);const hit=value.landmarks!.blade!;
 value.update(actor,true);value.update({...actor,pose:'chop-down'},true,downMs);
 expect(value.landmarks!.blade!.distanceTo(hit)).toBeGreaterThan(.2);
 for(let elapsed=0;elapsed<300;elapsed+=16){
  value.update({...actor,pose:'chop-return'},true,16);
  expect(value.landmarks!.blade!.distanceTo(hit),`return ${elapsed}ms`).toBeGreaterThan(.2);
 }
});

test('interrupting an early recovery still starts the new preparation at the displayed hand pose',async()=>{
 const {value}=await fixture();value.update(actor,true);value.update({...actor,pose:'chop-down'},true,50);
 for(let elapsed=0;elapsed<80;elapsed+=16)value.update({...actor,pose:'chop-return'},true,16);
 const hand=value.handPosition();value.update(actor,true,2);expect(value.handPosition().distanceTo(hand)).toBeLessThan(.025);
});
