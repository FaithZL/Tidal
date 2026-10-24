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
 // The real mesh, skin weights, hierarchy and inverse binds are retained; Node has no image decoder.
 model.buffers[0].uri=`data:application/octet-stream;base64,${binary.toString('base64')}`;
 model.images=[];model.textures=[];model.materials=model.materials.map((m:{name:string})=>({name:m.name}));
 bodyText=JSON.stringify(model);
 const idle=await readFile(new URL('idle.glb',directory)),chop=await readFile(new URL('tree-chopping.glb',directory));
 idleBytes=idle.buffer.slice(idle.byteOffset,idle.byteOffset+idle.byteLength);chopBytes=chop.buffer.slice(chop.byteOffset,chop.byteOffset+chop.byteLength);
 vi.stubGlobal('ProgressEvent',class ProgressEvent{constructor(public type:string,public init:unknown){}});
});
afterEach(()=>cleanups.splice(0).forEach(cleanup=>cleanup()));
afterAll(()=>vi.unstubAllGlobals());
async function fixture():Promise<{actor:SampleCharacter;resources:WorldResources;garmentMap:T.Texture}>{
 const loader=new GLTFLoader(),body=await loader.parseAsync(bodyText,'');
 const tunic=body.scene.getObjectByName('Male_Peasant_Body') as T.SkinnedMesh,garmentMap=new T.Texture();
 (tunic.material as T.MeshStandardMaterial).map=garmentMap;
 const idle=await loader.parseAsync(idleBytes.slice(0),''),chop=await loader.parseAsync(chopBytes.slice(0),'');
 const resources=new WorldResources(),actor=new SampleCharacter(resources,new NprPalette(resources),body,idle,chop);
 cleanups.push(()=>{actor.dispose();resources.dispose();});return {actor,resources,garmentMap};
}
function mesh(actor:SampleCharacter,name:string):T.Mesh{
 const result=actor.root.getObjectByName(name);expect(result,`${name} is present`).toBeInstanceOf(T.Mesh);return result as T.Mesh;
}
function points(object:T.Mesh,relativeTo?:T.Object3D):T.Vector3[]{
 object.updateWorldMatrix(true,false);const transform=object.matrixWorld.clone();
 if(relativeTo){relativeTo.updateWorldMatrix(true,false);transform.premultiply(relativeTo.matrixWorld.clone().invert());}
 const positions=object.geometry.getAttribute('position');return Array.from({length:positions.count},(_,i)=>new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(transform));
}
function crossings(a:T.Mesh,b:T.Mesh):number{
 const verticesA=points(a),verticesB=points(b),indexA=a.geometry.index!,indexB=b.geometry.index!,ray=new T.Ray(),hit=new T.Vector3();let count=0;
 for(let i=0;i<indexA.count;i+=3){
  const aa=[verticesA[indexA.getX(i)],verticesA[indexA.getX(i+1)],verticesA[indexA.getX(i+2)]],boundsA=new T.Box3().setFromPoints(aa);
  for(let j=0;j<indexB.count;j+=3){
   const bb=[verticesB[indexB.getX(j)],verticesB[indexB.getX(j+1)],verticesB[indexB.getX(j+2)]];
   if(!boundsA.intersectsBox(new T.Box3().setFromPoints(bb)))continue;
   for(const [from,to] of [[aa[0],aa[1]],[aa[1],aa[2]],[aa[2],aa[0]]]){
    const length=from.distanceTo(to);ray.origin.copy(from);ray.direction.copy(to).sub(from).normalize();
    if(ray.intersectTriangle(bb[0],bb[1],bb[2],false,hit)&&hit.distanceTo(from)>.00001&&hit.distanceTo(from)<length-.00001)count++;
   }
  }
 }
 return count;
}
function garmentDistance(point:T.Vector3,garment:T.SkinnedMesh):number{
 const positions=garment.geometry.getAttribute('position'),index=garment.geometry.index!,triangle=new T.Triangle(),closest=new T.Vector3();let distance=Infinity;
 const vertices=Array.from({length:positions.count},(_,i)=>garment.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(positions,i)).applyMatrix4(garment.matrixWorld));
 for(let i=0;i<index.count;i+=3){triangle.set(vertices[index.getX(i)],vertices[index.getX(i+1)],vertices[index.getX(i+2)]);triangle.closestPointToPoint(point,closest);distance=Math.min(distance,closest.distanceTo(point));}
 return distance;
}

describe('reference-inspired local costume',()=>{
 it('attaches the soft collar, chest drape and compact rear pouch to their animated bones',async()=>{
  const {actor}=await fixture(),collar=mesh(actor,'sample-scarf-collar'),tails=mesh(actor,'sample-scarf-tails'),pouch=mesh(actor,'sample-waist-pouch');
  expect(collar.parent?.parent?.name).toBe('neck_01');expect(tails.parent?.parent?.name).toBe('spine_03');expect(pouch.parent?.parent?.name).toBe('pelvis');
  const start=points(collar)[0],local=points(collar,collar.parent!.parent!)[0];
  actor.sample(.4,.2,1);
  expect(points(collar)[0].distanceTo(start)).toBeGreaterThan(.03);
  expect(points(collar,collar.parent!.parent!)[0].distanceTo(local)).toBeLessThan(1e-6);
  const bounds=new T.Box3().setFromPoints(points(pouch));expect(bounds.getSize(new T.Vector3()).length()).toBeLessThan(.34);
  const relative=points(pouch,actor.root.getObjectByName('pelvis'));
  expect(Math.max(...relative.map(point=>point.z))).toBeLessThan(-.07);
 });

 it('keeps the folded collar out of the actual jaw across the presentation clock and detects a misplaced collar',async()=>{
  const {actor}=await fixture(),collar=mesh(actor,'sample-scarf-collar'),face=mesh(actor,'npr-farmer-head'),clock=new CharacterSampleClock(actor.clipDuration);
  for(const time of [...Array.from({length:36},(_,i)=>i/5),3.65,4.15,4.4]){
   clock.time=time;const frame=clock.frame;actor.sample(frame.idleTime,frame.chopTime,frame.weight);
   expect(crossings(collar,face),`collar crosses the real face at ${time}s (${frame.phase})`).toBe(0);
   const bounds=new T.Box3().setFromPoints(points(collar));
   expect([...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite)).toBe(true);
   expect(bounds.getSize(new T.Vector3()).length()).toBeLessThan(.45);
  }
  actor.sample(0,null,0);collar.position.y+=.15;actor.root.updateMatrixWorld(true);
  expect(crossings(collar,face),'the same physical intersection detector catches an upward displaced scarf').toBeGreaterThan(0);
 });

 it('keeps a real neck opening with varying folds instead of a closed shell or a floating plate',async()=>{
  const {actor}=await fixture(),collar=mesh(actor,'sample-scarf-collar'),vertices=points(collar,collar.parent!);
  const radii=vertices.map(point=>Math.hypot(point.x,point.z));
  expect(Math.min(...radii)).toBeGreaterThan(.055);expect(Math.max(...radii)).toBeLessThan(.15);
  expect(new Set(vertices.map(point=>point.y.toFixed(3))).size).toBeGreaterThan(12);
  expect(new T.Box3().setFromPoints(vertices).getSize(new T.Vector3()).y).toBeGreaterThan(.07);
 });

 it('lays the short scarf ends close to the actual deformed back instead of projecting as detached straps',async()=>{
  const {actor}=await fixture(),tails=mesh(actor,'sample-scarf-tails'),tunic=mesh(actor,'Male_Peasant_Body') as T.SkinnedMesh,clock=new CharacterSampleClock(actor.clipDuration);
  for(const time of[.8,3.4,3.95,4.95]){
   clock.time=time;const frame=clock.frame;actor.sample(frame.idleTime,frame.chopTime,frame.weight);tunic.skeleton.update();
   const vertices=points(tails),distances=[36,40,44,63,67,71,117,121,125,144,148,152].map(i=>garmentDistance(vertices[i],tunic));
   expect(Math.max(...distances),`scarf floats off the back at ${time}s`).toBeLessThan(.032);
  }
 });

 it('tapers each soft scarf drop to a narrow curved end instead of retaining two rectangular cutoffs',async()=>{
  const {actor}=await fixture(),tails=mesh(actor,'sample-scarf-tails'),vertices=points(tails,tails.parent!);
  for(const offset of[0,81]){
   const top=new T.Box3().setFromPoints(vertices.slice(offset,offset+9)).getSize(new T.Vector3()).x;
   const tip=new T.Box3().setFromPoints(vertices.slice(offset+72,offset+81)).getSize(new T.Vector3()).x;
   expect(tip/top).toBeLessThan(.25);
  }
 });

 it('holds both branches of the V harness close to the animated back with stable bone attachment and finite bounds',async()=>{
  const {actor}=await fixture(),harness=mesh(actor,'sample-back-harness'),tunic=mesh(actor,'Male_Peasant_Body') as T.SkinnedMesh,clock=new CharacterSampleClock(actor.clipDuration);
  expect(harness.parent?.parent?.name).toBe('spine_03');
  const start=points(harness),bone=actor.root.getObjectByName('spine_03')!,local=points(harness,bone);
  for(const time of[.8,3.4,3.95,4.95]){
   clock.time=time;const frame=clock.frame;actor.sample(frame.idleTime,frame.chopTime,frame.weight);tunic.skeleton.update();
   const vertices=points(harness),bounds=new T.Box3().setFromPoints(vertices);
   expect([...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite)).toBe(true);
   expect(bounds.getSize(new T.Vector3()).length()).toBeLessThan(.50);
   const distances=[0,12,27,42,57,72,87].map(i=>garmentDistance(vertices[i],tunic));
   expect(Math.max(...distances),`V harness floats off the back at ${time}s`).toBeLessThan(.032);
   expect(points(harness,bone)[0].distanceTo(local[0])).toBeLessThan(1e-6);
  }
  expect(points(harness)[0].distanceTo(start[0])).toBeGreaterThan(.02);
 });

 it('releases costume allocations once with the shared world and does not release them from an actor twice',async()=>{
  const {actor,resources}=await fixture(),costume=[mesh(actor,'sample-scarf-collar'),mesh(actor,'sample-scarf-tails'),mesh(actor,'sample-waist-pouch'),mesh(actor,'sample-back-harness')];
  const geometries=[...new Set(costume.map(object=>object.geometry))],materials=[...new Set(costume.flatMap(object=>Array.isArray(object.material)?object.material:[object.material]))];
  let geometryDisposals=0,materialDisposals=0;
  geometries.forEach(geometry=>geometry.addEventListener('dispose',()=>geometryDisposals++));materials.forEach(material=>material.addEventListener('dispose',()=>materialDisposals++));
  actor.dispose();actor.dispose();expect(geometryDisposals).toBe(0);expect(materialDisposals).toBe(0);
  resources.dispose();resources.dispose();expect(geometryDisposals).toBe(geometries.length);expect(materialDisposals).toBe(materials.length);
 });

 it('retains the original shared garment map and UVs while isolating the cloth retint to the sleeves and trousers',async()=>{
  const {actor,garmentMap}=await fixture(),tunic=mesh(actor,'Male_Peasant_Body'),sleeves=mesh(actor,'Male_Peasant_Arms_1'),trousers=mesh(actor,'Male_Peasant_Legs');
  const tunicMaterial=tunic.material as T.MeshToonMaterial,sleeveMaterial=sleeves.material as T.MeshToonMaterial,trouserMaterial=trousers.material as T.MeshToonMaterial;
  expect(sleeveMaterial).not.toBe(tunicMaterial);expect(trouserMaterial).not.toBe(tunicMaterial);expect(trouserMaterial).not.toBe(sleeveMaterial);
  for(const material of[tunicMaterial,sleeveMaterial,trouserMaterial])expect(material.map).toBe(garmentMap);
  const tunicUvs=Array.from(tunic.geometry.getAttribute('uv').array),sleeveUvs=Array.from(sleeves.geometry.getAttribute('uv').array);
  actor.sample(.5,.3,1);expect(Array.from(tunic.geometry.getAttribute('uv').array)).toEqual(tunicUvs);expect(Array.from(sleeves.geometry.getAttribute('uv').array)).toEqual(sleeveUvs);
  expect(sleeveMaterial.customProgramCacheKey()).not.toBe(tunicMaterial.customProgramCacheKey());expect(trouserMaterial.customProgramCacheKey()).not.toBe(tunicMaterial.customProgramCacheKey());
  let disposed=0;sleeveMaterial.addEventListener('dispose',()=>disposed++);trouserMaterial.addEventListener('dispose',()=>disposed++);
  actor.dispose();actor.dispose();expect(disposed).toBe(2);
 });
});
