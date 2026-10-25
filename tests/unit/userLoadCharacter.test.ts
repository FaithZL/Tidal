import {readFile} from 'node:fs/promises';
import {afterEach,expect,test,vi} from 'vitest';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {prepareUserModel,type UserModel} from '../../src/game/world/userModel.js';
import {UserLoadCharacter} from '../../src/game/world/userLoadCharacter.js';
import type {WorldActor} from '../../src/game/world/types.js';

const cleanup:(()=>void)[]=[];
afterEach(()=>{cleanup.splice(0).forEach(dispose=>dispose());vi.restoreAllMocks();});
const actor:WorldActor={position:{x:2,y:.2,z:4},yaw:.4,mode:'work',pose:'ready',stride:0};
async function fixture(){
 vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation(()=>new T.Texture());vi.spyOn(console,'warn').mockImplementation(()=>{});
 const bytes=await readFile(new URL('../../public/assets/user-models/character.fbx',import.meta.url));
 const source=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const mesh=source.children.find((object):object is T.Mesh=>object instanceof T.Mesh)!;
 const model=prepareUserModel(source,'character');cleanup.push(()=>model.dispose());return {model,source:mesh};
}
async function character(){
 const asset=await fixture(),value=new UserLoadCharacter(Promise.resolve(asset.model));cleanup.push(()=>value.dispose());await value.ready;return {...asset,value};
}
function palms(root:T.Object3D):T.Vector3{
 const left=root.getObjectByName('user-leftHand')!,right=root.getObjectByName('user-rightHand')!;
 // The original mesh's two palm centers are the measured hand-chain endpoints.
 return left.localToWorld(new T.Vector3(0,Math.hypot(.14,.01),0)).add(right.localToWorld(new T.Vector3(0,Math.hypot(.085,.14,.02),0))).multiplyScalar(.5);
}

test('loading binds the actual FBX and load phases use the rendered two-palm center in world space',async()=>{
 const {value,source}=await character();value.update({...actor,pose:'squat-down'},false);
 const skin=value.root.getObjectByName('user-derived-skinned-body') as T.SkinnedMesh;
 expect(value.motionSupport).toBe('derived-load-only');expect(skin).toBeInstanceOf(T.SkinnedMesh);expect(skin.skeleton.bones).toHaveLength(17);
 expect(source.visible).toBe(false);expect(skin.visible).toBe(true);expect(value.root.getObjectByName('user-rigid-source-axe')!.visible).toBe(false);
 expect(value.root.position.toArray()).toEqual([2,.2,4]);expect(value.root.rotation.y).toBe(.4);
 expect(value.handPosition().distanceTo(palms(value.root))).toBeLessThan(.00001);
 const low=value.handPosition();value.update({...actor,pose:'press-up'},false);
 expect(value.handPosition().y).toBeGreaterThan(low.y+.65);expect(value.handPosition().distanceTo(palms(value.root))).toBeLessThan(.00001);
});

test('load poses deform the real body while preserving source geometry UVs and materials',async()=>{
 const {value,source}=await character(),positions=Array.from(source.geometry.getAttribute('position').array),uv=Array.from(source.geometry.getAttribute('uv').array),material=source.material;
 value.update({...actor,pose:'ready'},false);const skin=value.root.getObjectByName('user-derived-skinned-body') as T.SkinnedMesh;expect(skin).toBeInstanceOf(T.SkinnedMesh);
 const before=Array.from({length:skin.geometry.getAttribute('position').count},(_,i)=>skin.getVertexPosition(i,new T.Vector3()));
 value.update({...actor,pose:'squat-down'},false);const moved=before.filter((point,i)=>skin.getVertexPosition(i,new T.Vector3()).distanceTo(point)>.05);
 expect(moved.length).toBeGreaterThan(500);expect(skin.material).toBe(material);
 expect(Array.from(source.geometry.getAttribute('position').array)).toEqual(positions);expect(Array.from(source.geometry.getAttribute('uv').array)).toEqual(uv);
 for(const mode of ['walk','push','pull','idle','celebrate'] as const){
  value.update({...actor,mode},false);expect(source.visible).toBe(true);expect(skin.visible).toBe(false);expect(value.root.getObjectByName('user-rigid-source-axe')!.visible).toBe(false);
  expect(value.handPosition().distanceTo(value.root.localToWorld(new T.Vector3(0,.95,.45)))).toBeLessThan(.00001);
 }
 value.update({...actor,pose:'chop-down'},true);expect(source.visible).toBe(true);expect(skin.visible).toBe(false);
});

test('zero invalid and long motion intervals freeze the body until an explicit presentation reset snaps the next state',async()=>{
 const {value}=await character();value.update(actor,false);value.update({...actor,pose:'squat-down'},false,70);
 const hand=value.handPosition(),revision=value.visualRevision;
 for(const delta of [0,-1,101,1000,NaN,Infinity]){value.update({...actor,pose:'press-up'},false,delta);expect(value.handPosition().distanceTo(hand)).toBeLessThan(.000001);expect(value.visualRevision).toBe(revision);}
 value.resetPresentation();value.update({...actor,pose:'press-up'},false,0);expect(value.handPosition().y).toBeGreaterThan(hand.y+.5);expect(value.visualRevision).toBeGreaterThan(revision);
});

test('disposing the load adapter releases its skin skeleton and original model resources only once',async()=>{
 const {value,source,model}=await character(),skin=value.root.getObjectByName('user-derived-skinned-body') as T.SkinnedMesh,axe=value.root.getObjectByName('user-source-axe-mesh') as T.Mesh;expect(skin).toBeInstanceOf(T.SkinnedMesh);expect(axe).toBeInstanceOf(T.Mesh);
 const released=[vi.fn(),vi.fn(),vi.fn(),vi.fn(),vi.fn()],original=model.dispose;model.dispose=vi.fn(()=>original());
 source.geometry.addEventListener('dispose',released[0]);(source.material as T.Material).addEventListener('dispose',released[1]);(source.material as T.MeshToonMaterial).map!.addEventListener('dispose',released[2]);skin.geometry.addEventListener('dispose',released[3]);axe.geometry.addEventListener('dispose',released[4]);const skeletonDispose=vi.spyOn(skin.skeleton,'dispose');
 value.dispose();value.dispose();for(const listener of released)expect(listener).toHaveBeenCalledTimes(1);expect(skeletonDispose).toHaveBeenCalledTimes(1);expect(model.dispose).toHaveBeenCalledTimes(1);expect(value.root.children).toHaveLength(0);
});

test('a model arriving after cancellation is disposed once and never mounted',async()=>{
 const {model}=await fixture(),dispose=vi.spyOn(model,'dispose');let resolve!:(model:UserModel)=>void;
 const value=new UserLoadCharacter(new Promise(yes=>{resolve=yes;})),rejected=expect(value.ready).rejects.toThrow(/cancelled/);value.dispose();await rejected;
 resolve(model);await Promise.resolve();await Promise.resolve();expect(dispose).toHaveBeenCalledTimes(1);expect(value.root.children).toHaveLength(0);value.dispose();expect(dispose).toHaveBeenCalledTimes(1);
});

test('failed binding rejects readiness and releases the imported asset instead of mounting a static fallback',async()=>{
 const root=new T.Group(),dispose=vi.fn(),value=new UserLoadCharacter(Promise.resolve({root,kind:'character',motionSupport:'static',dispose}));cleanup.push(()=>value.dispose());
 await expect(value.ready).rejects.toThrow(/用户人物|绑定|网格/);expect(dispose).toHaveBeenCalledTimes(1);expect(value.root.children).toHaveLength(0);
});
