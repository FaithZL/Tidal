import {readFile} from 'node:fs/promises';
import {afterAll,afterEach,beforeAll,describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {GLTFLoader,type GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {SampleCharacter,loadSampleCharacter} from '../../src/game/world/sampleCharacter.js';
import {NprPalette} from '../../src/game/world/nprMaterials.js';
import {WorldResources} from '../../src/game/world/resources.js';

const directory=new URL('../../public/assets/character-motion/',import.meta.url);
let bodyText:string,idleBytes:ArrayBuffer,chopBytes:ArrayBuffer;
const cleanups:(()=>void)[]=[];
beforeAll(async()=>{
 const model=JSON.parse(await readFile(new URL('Male_Peasant.gltf',directory),'utf8'));
 const binary=await readFile(new URL('Male_Peasant.bin',directory));
 // Node has no image decoder; keep the actual geometry, inverse binds, skin weights and bone hierarchy.
 model.buffers[0].uri=`data:application/octet-stream;base64,${binary.toString('base64')}`;
 model.images=[];model.textures=[];model.materials=model.materials.map((m:{name:string})=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:[.8,.7,.6,1]}}));
 bodyText=JSON.stringify(model);
 const idle=await readFile(new URL('idle.glb',directory)),chop=await readFile(new URL('tree-chopping.glb',directory));
 idleBytes=idle.buffer.slice(idle.byteOffset,idle.byteOffset+idle.byteLength);chopBytes=chop.buffer.slice(chop.byteOffset,chop.byteOffset+chop.byteLength);
 vi.stubGlobal('ProgressEvent',class ProgressEvent{constructor(public type:string,public init:unknown){}});
});
afterEach(()=>{cleanups.splice(0).forEach(cleanup=>cleanup());vi.restoreAllMocks();});
afterAll(()=>{vi.unstubAllGlobals();});
async function loaded():Promise<{body:GLTF;idle:GLTF;chop:GLTF}>{
 const loader=new GLTFLoader(),body=await loader.parseAsync(bodyText,'');
 const idle=await loader.parseAsync(idleBytes.slice(0),''),chop=await loader.parseAsync(chopBytes.slice(0),'');
 return {body,idle,chop};
}
async function fixture():Promise<{actor:SampleCharacter;body:GLTF;resources:WorldResources}>{
 const {body,idle,chop}=await loaded();
 const resources=new WorldResources(),actor=new SampleCharacter(resources,new NprPalette(resources),body,idle,chop);
 cleanups.push(()=>{actor.dispose();resources.dispose();});return {actor,body,resources};
}
function transforms(root:T.Object3D):number[]{const result:number[]=[];root.traverse(o=>{if(o instanceof T.Bone)result.push(...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray());});return result;}
function skins(root:T.Object3D):T.SkinnedMesh[]{const result:T.SkinnedMesh[]=[];root.traverse(o=>{if(o instanceof T.SkinnedMesh)result.push(o);});return result;}
function posedBounds(mesh:T.SkinnedMesh):T.Box3{
 const bounds=new T.Box3(),position=mesh.geometry.getAttribute('position');
 mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
 for(let i=0;i<position.count;i++)bounds.expandByPoint(mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(position,i)).applyMatrix4(mesh.matrixWorld));
 return bounds;
}
function attachOwnedBitmaps(body:GLTF):{bitmap:{closed:number;close:()=>void};textures:T.Texture[]}{
 const bitmap={closed:0,close(){this.closed++;}},texture=new T.Texture(bitmap),copy=texture.clone();
 const materials=[...new Set(skins(body.scene).flatMap(mesh=>Array.isArray(mesh.material)?mesh.material:[mesh.material]))];
 if(!(materials[0] instanceof T.MeshStandardMaterial)||!(materials[1] instanceof T.MeshStandardMaterial))throw new Error('Fixture must retain both garment materials');
 materials[0].map=texture;materials[1].map=copy;
 return {bitmap,textures:[texture,copy]};
}

describe('local skinned character sample',()=>{
 it('preserves the Peasant bone lengths while actual clips produce finite skinned bounds',async()=>{
  const {actor}=await fixture(),hand=actor.root.getObjectByName('hand_l')!;
  expect(skins(actor.root).length).toBeGreaterThan(0);
  const original=hand.position.toArray();expect(original[1]).toBeCloseTo(.2404201,5);
  for(const time of[0,.16,.35,.55,.8,actor.clipDuration]){
   actor.sample(.5,time,1);expect(hand.position.toArray()).toEqual(original);
   for(const mesh of skins(actor.root)){
    mesh.skeleton.update();mesh.computeBoundingBox();
    const bounds=mesh.boundingBox!;
    expect([...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite)).toBe(true);
    expect(bounds.getSize(new T.Vector3()).length()).toBeLessThan(4);
   }
  }
 });

 it('samples absolute time so paused and revisited frames have identical poses without moving the stage root',async()=>{
  const {actor}=await fixture();actor.root.position.set(3,0,-2);actor.root.rotation.y=.4;
  actor.sample(.2,.38,1);const pose=transforms(actor.root),hand=actor.handPosition().toArray();
  for(let i=0;i<20;i++)actor.sample(.2,.38,1);
  expect(transforms(actor.root)).toEqual(pose);expect(actor.handPosition().toArray()).toEqual(hand);
  actor.sample(1.1,.8,1);expect(transforms(actor.root)).not.toEqual(pose);
  actor.sample(.2,.38,1);expect(transforms(actor.root)).toEqual(pose);
  expect(actor.root.position.toArray()).toEqual([3,0,-2]);expect(actor.root.rotation.y).toBe(.4);
 });

 it('clamps the chop endpoint and returns fully to idle rather than looping the chop in the background',async()=>{
  const {actor}=await fixture();expect(actor.clipDuration).toBeCloseTo(.9666667,5);
  actor.sample(.7,actor.clipDuration,1);const end=transforms(actor.root);
  actor.sample(.7,actor.clipDuration+100,1);expect(transforms(actor.root)).toEqual(end);
  actor.sample(.7,null,0);const idle=transforms(actor.root);
  actor.sample(.7,.4,0);expect(transforms(actor.root)).toEqual(idle);
  actor.sample(.7,Number.NaN,Number.NaN);expect(transforms(actor.root)).toEqual(idle);
  expect(actor.root.getObjectByName('sample-axe')!.visible).toBe(true);
  expect(actor.bladePosition().y).toBeLessThan(actor.root.getObjectByName('hand_r')!.getWorldPosition(new T.Vector3()).y-.2);
 });

 it('holds the authored chop pose while the unused idle clock advances without accumulating contact corrections',async()=>{
  const {actor}=await fixture();actor.sample(.2,.38,1);const pose=transforms(actor.root);
  for(const idle of[.3,.4,.5,.6]){actor.sample(idle,.38,1);expect(transforms(actor.root)).toEqual(pose);}
 });

 it('keeps both palms on the rigid axe handle across the chop rather than assuming the source clip has contact',async()=>{
  const {actor}=await fixture();
  for(const time of[0,.16,.35,.55,.8,actor.clipDuration]){
   actor.sample(0,time,1);
   const left=actor.root.getObjectByName('hand_l')!,grip=actor.root.getObjectByName('sample-axe-left-grip')!;
   const palm=left.localToWorld(new T.Vector3(0,.065,0));
   expect(palm.distanceTo(grip.getWorldPosition(new T.Vector3())),`contact at ${time}s`).toBeLessThan(.035);
  }
  expect(actor.bladePosition().distanceTo(actor.handPosition())).toBeGreaterThan(.2);
 });

 it('attaches the original visible face to the animated head bone at a human scale',async()=>{
  const {actor}=await fixture();actor.sample(0,null,0);
  const head=actor.root.getObjectByName('npr-farmer-head-pivot')!;
  expect(head.parent?.name).toBe('Head');expect(head.getObjectByName('npr-farmer-eye-irises')).toBeDefined();
  const bounds=new T.Box3().setFromObject(head),size=bounds.getSize(new T.Vector3());
  expect(size.y).toBeGreaterThan(.38);expect(size.y).toBeLessThan(.65);
  expect(bounds.max.y).toBeGreaterThan(1.95);expect(bounds.max.y).toBeLessThan(2.35);
 });

 it('connects the jaw to the real deformed garment collar through an original neck across idle and windup',async()=>{
  const {actor}=await fixture(),neck=actor.root.getObjectByName('sample-character-neck');
  expect(neck).toBeInstanceOf(T.Mesh);
  const garment=actor.root.getObjectByName('Male_Peasant_Body') as T.SkinnedMesh;
  const face=actor.root.getObjectByName('npr-farmer-head')!;
  for(const [idle,chop,weight] of[[0,0,0],[.5,0,.5],[.5,0,1],[.5,.2,1],[.5,.65,1]]){
   actor.sample(idle,chop,weight);
   const body=posedBounds(garment),head=new T.Box3().setFromObject(face),join=new T.Box3().setFromObject(neck!);
   expect(join.min.y).toBeLessThan(body.max.y-.015);
   expect(join.max.y).toBeGreaterThan(head.min.y+.015);
  }
 });

 it('plants the actual skinned boot sole on the stage through breathing, windup and recovery without moving the caller root',async()=>{
  const {actor}=await fixture(),feet=actor.root.getObjectByName('Male_Peasant_Feet') as T.SkinnedMesh;
  for(const [idle,chop,weight] of[[0,0,0],[.7,0,0],[1.5,0,0],[2.4,0,0],[.5,0,.5],[.5,0,1],[.5,.2,1],[.5,.55,1],[.5,.9666667,1]]){
   actor.sample(idle,chop,weight);const sole=posedBounds(feet).min.y;
   expect(sole,`sole at idle=${idle}/chop=${chop}/blend=${weight}`).toBeGreaterThanOrEqual(-.005);
   expect(sole,`sole at idle=${idle}/chop=${chop}/blend=${weight}`).toBeLessThanOrEqual(.015);
   expect(actor.root.position.toArray()).toEqual([0,0,0]);
  }
 });

 it('releases imported skin geometry and materials once while leaving shared world materials alive',async()=>{
  const {actor,body,resources}=await fixture(),skin=skins(body.scene)[0];
  let geometryDisposed=0,materialDisposed=0,sharedDisposed=0;
  skin.geometry.addEventListener('dispose',()=>geometryDisposed++);
  const material=Array.isArray(skin.material)?skin.material[0]:skin.material;
  material.addEventListener('dispose',()=>materialDisposed++);
  const shared=new NprPalette(resources).material(0x704d35);shared.addEventListener('dispose',()=>sharedDisposed++);
  actor.dispose();actor.dispose();
  expect(geometryDisposed).toBe(1);expect(materialDisposed).toBe(1);expect(sharedDisposed).toBe(0);
  resources.dispose();expect(sharedDisposed).toBe(1);
 });

 it('releases a late successful model when a companion animation request fails',async()=>{
  const {body,idle}=await loaded(),resources=new WorldResources();cleanups.push(()=>resources.dispose());
  const {bitmap}=attachOwnedBitmaps(body);
  let disposed=0;skins(body.scene)[0].geometry.addEventListener('dispose',()=>disposed++);
  const lateBody=Promise.withResolvers<GLTF>();
  // Replace only network transport; all fulfilled resources remain the real local parsed model/clip.
  vi.spyOn(GLTFLoader.prototype,'loadAsync').mockImplementation(async url=>{
   if(url.endsWith('Male_Peasant.gltf'))return lateBody.promise;
   if(url.endsWith('idle.glb'))return idle;
   throw new Error('tree-chopping unavailable');
  });
  const pending=loadSampleCharacter(resources,new NprPalette(resources),'/sample/');
  queueMicrotask(()=>lateBody.resolve(body));
  await expect(pending).rejects.toThrow('tree-chopping unavailable');
  expect(disposed).toBe(1);expect(bitmap.closed).toBe(1);
 });

 it('closes each owned decoded bitmap once even when multiple imported textures share it',async()=>{
  const {body,idle,chop}=await loaded(),resources=new WorldResources(),{bitmap,textures}=attachOwnedBitmaps(body);
  let disposed=0;textures.forEach(texture=>texture.addEventListener('dispose',()=>disposed++));
  const actor=new SampleCharacter(resources,new NprPalette(resources),body,idle,chop);cleanups.push(()=>{actor.dispose();resources.dispose();});
  expect(bitmap.closed).toBe(0);actor.dispose();actor.dispose();
  expect(disposed).toBe(2);expect(bitmap.closed).toBe(1);
 });
});
