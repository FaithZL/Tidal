import {readFile} from 'node:fs/promises';
import {afterAll,afterEach,beforeAll,describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SampleCharacter} from '../../src/game/world/sampleCharacter.js';
import {NprPalette} from '../../src/game/world/nprMaterials.js';
import {WorldResources} from '../../src/game/world/resources.js';
import {CharacterSampleClock} from '../../src/game/world/characterSampleClock.js';

const directory=new URL('../../public/assets/character-motion/',import.meta.url);
let bodyText:string,idleBytes:ArrayBuffer,chopBytes:ArrayBuffer;
const cleanups:(()=>void)[]=[];
beforeAll(async()=>{
 const model=JSON.parse(await readFile(new URL('Male_Peasant.gltf',directory),'utf8'));
 const binary=await readFile(new URL('Male_Peasant.bin',directory));
 // Keep the source geometry, weights and inverse binds; only the unavailable Node image decoder is excluded.
 model.buffers[0].uri=`data:application/octet-stream;base64,${binary.toString('base64')}`;
 model.images=[];model.textures=[];model.materials=model.materials.map((m:{name:string})=>({name:m.name}));
 bodyText=JSON.stringify(model);
 const idle=await readFile(new URL('idle.glb',directory)),chop=await readFile(new URL('tree-chopping.glb',directory));
 idleBytes=idle.buffer.slice(idle.byteOffset,idle.byteOffset+idle.byteLength);chopBytes=chop.buffer.slice(chop.byteOffset,chop.byteOffset+chop.byteLength);
 vi.stubGlobal('ProgressEvent',class ProgressEvent{constructor(public type:string,public init:unknown){}});
});
afterEach(()=>cleanups.splice(0).forEach(cleanup=>cleanup()));
afterAll(()=>vi.unstubAllGlobals());

interface ShoulderRegion{innerX:number;minY:number}
async function fixture(untailoredSleeve=false):Promise<{actor:SampleCharacter;shoulderRegion:ShoulderRegion}>{
 const loader=new GLTFLoader(),body=await loader.parseAsync(bodyText,'');
 const sleeves=body.scene.getObjectByName('Male_Peasant_Arms_1') as T.SkinnedMesh,originalSleeve=sleeves.geometry;
 const sourcePositions=originalSleeve.getAttribute('position'),sourceRootX=Math.min(...Array.from({length:sourcePositions.count},(_,i)=>Math.abs(sourcePositions.getX(i))));
 const jointIndex=sleeves.skeleton.bones.findIndex(joint=>joint.name==='upperarm_l'),bindShoulder=new T.Vector3().setFromMatrixPosition(sleeves.skeleton.boneInverses[jointIndex].clone().invert());
 const capRadius=Math.abs(bindShoulder.x)-sourceRootX;
 const shoulderRegion={innerX:sourceRootX-.002,minY:bindShoulder.y-capRadius*2};
 const idle=await loader.parseAsync(idleBytes.slice(0),''),chop=await loader.parseAsync(chopBytes.slice(0),'');
 const resources=new WorldResources(),actor=new SampleCharacter(resources,new NprPalette(resources),body,idle,chop);
 if(untailoredSleeve)sleeves.geometry=originalSleeve;
 cleanups.push(()=>{actor.dispose();resources.dispose();});return {actor,shoulderRegion};
}
function triangles(mesh:T.SkinnedMesh,shoulderRegion?:ShoulderRegion):{shape:T.Triangle;bounds:T.Box3}[]{
 mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
 const positions=mesh.geometry.getAttribute('position'),index=mesh.geometry.index!;
 const points=Array.from({length:positions.count},(_,i)=>mesh.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(positions,i)).applyMatrix4(mesh.matrixWorld));
 return Array.from({length:index.count/3},(_,i)=>{
  const ids=[index.getX(i*3),index.getX(i*3+1),index.getX(i*3+2)];
  const bindX=ids.reduce((sum,j)=>sum+positions.getX(j),0)/3,bindY=ids.reduce((sum,j)=>sum+positions.getY(j),0)/3;
  const shape=new T.Triangle(points[index.getX(i*3)],points[index.getX(i*3+1)],points[index.getX(i*3+2)]);
  return {shape,bounds:new T.Box3().setFromPoints([shape.a,shape.b,shape.c]),bindX,bindY};
 }).filter(triangle=>!shoulderRegion||(Math.abs(triangle.bindX)>=shoulderRegion.innerX&&triangle.bindY>shoulderRegion.minY));
}
/** Physical triangle crossings, independent of lights, materials, polygonOffset and screenshots. */
function crossings(sleeve:T.SkinnedMesh,tunic:T.SkinnedMesh,shoulderRegion?:ShoulderRegion):number{
 // Region comes from the real source sleeve root and inverse-bind shoulder position, with 2mm seam tolerance.
 // The central chest is outside this shoulder-seam assertion; arm/torso contact is reported separately in QA.
 const outer=triangles(tunic,shoulderRegion),inner=triangles(sleeve),ray=new T.Ray(),hit=new T.Vector3(),unique=new Set<string>();
 for(const {shape:a,bounds:aa} of inner)for(const {shape:b,bounds:bb} of outer){
  if(!aa.intersectsBox(bb))continue;
  for(const [from,to] of [[a.a,a.b],[a.b,a.c],[a.c,a.a]]){
   const length=from.distanceTo(to);ray.origin.copy(from);ray.direction.copy(to).sub(from).normalize();
   if(ray.intersectTriangle(b.a,b.b,b.c,false,hit)&&hit.distanceTo(from)>.00001&&hit.distanceTo(from)<length-.00001){
    unique.add(hit.toArray().map(value=>value.toFixed(5)).join('/'));
   }
  }
 }
 return unique.size;
}

describe('sample garment shoulder continuity',()=>{
 it('detects the original source sleeves piercing the same shoulder-cap region without the structural tailoring',async()=>{
  const {actor,shoulderRegion}=await fixture(true),sleeve=actor.root.getObjectByName('Male_Peasant_Arms_1') as T.SkinnedMesh,tunic=actor.root.getObjectByName('Male_Peasant_Body') as T.SkinnedMesh;
  actor.sample(.8,null,0);expect(crossings(sleeve,tunic,shoulderRegion)).toBeGreaterThan(0);
 });
 it('preserves garment clearance through the production clock, including blends and the slow return through the source clip',async()=>{
  const {actor,shoulderRegion}=await fixture(),clock=new CharacterSampleClock(actor.clipDuration),sleeve=actor.root.getObjectByName('Male_Peasant_Arms_1') as T.SkinnedMesh,skin=actor.root.getObjectByName('Male_Peasant_Arms_2') as T.SkinnedMesh,tunic=actor.root.getObjectByName('Male_Peasant_Body') as T.SkinnedMesh;
  for(const time of [...Array.from({length:72},(_,i)=>i/10),4.15,4.4]){
   clock.time=time;const frame=clock.frame;actor.sample(frame.idleTime,frame.chopTime,frame.weight);
   expect(crossings(skin,sleeve),`forearm skin pierces cloth at clock ${time}s (${frame.phase})`).toBe(0);
   expect(crossings(sleeve,tunic,shoulderRegion),`brown sleeve pierces the shoulder cap at clock ${time}s (${frame.phase})`).toBe(0);
  }
 });
 it('keeps the covered forearm skin inside the brown cuff instead of showing alternating skin and cloth strips',async()=>{
  const {actor}=await fixture(),sleeve=actor.root.getObjectByName('Male_Peasant_Arms_1') as T.SkinnedMesh,skin=actor.root.getObjectByName('Male_Peasant_Arms_2') as T.SkinnedMesh;
  const hand=actor.root.getObjectByName('hand_l')!,length=hand.position.length();
  for(const [time,weight] of [[null,0],[0,.5],[0,1],[.16,1],[.35,1],[.55,1],[.8,1],[.9666667,1]] as const){
   actor.sample(.8,time,weight);
   expect(crossings(skin,sleeve),`skin cuts the sleeve at ${time}/${weight}`).toBe(0);
   expect(hand.position.length()).toBe(length);
  }
 });
 it('keeps the visible brown sleeves from cutting through the tunic during idle, raised arms and the real chop',async()=>{
  const {actor,shoulderRegion}=await fixture(),sleeve=actor.root.getObjectByName('Male_Peasant_Arms_1') as T.SkinnedMesh,tunic=actor.root.getObjectByName('Male_Peasant_Body') as T.SkinnedMesh;
  expect(sleeve.visible).toBe(true);expect(sleeve.geometry.index!.count/3).toBeGreaterThan(100);
  const bindBounds=new T.Box3().setFromBufferAttribute(sleeve.geometry.getAttribute('position'));
  expect(bindBounds.max.x).toBeGreaterThan(.49);expect(bindBounds.min.x).toBeLessThan(-.49);
  for(const [name,time,weight] of [['standing',null,0],['half raised',0,.5],['raised',0,1],['windup',.16,1],['swing',.35,1],['follow through',.55,1],['recovery',.8,1],['endpoint',.9666667,1]] as const){
   actor.sample(.8,time,weight);
   expect(crossings(sleeve,tunic,shoulderRegion),`${name}: brown sleeve edges pierce the actual skinned beige shoulder cap`).toBe(0);
  }
 });
});
