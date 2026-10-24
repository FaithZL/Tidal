import {afterEach,describe,expect,it} from 'vitest';
import * as T from 'three';
import {NprCharacter3D} from '../../src/game/world/nprModels.js';
import {NprPalette} from '../../src/game/world/nprMaterials.js';
import {WorldResources} from '../../src/game/world/resources.js';

const resources:WorldResources[]=[];
function farmer():NprCharacter3D{
 const r=new WorldResources();resources.push(r);
 const actor=new NprCharacter3D(r,new NprPalette(r));
 actor.update({position:{x:0,y:0,z:0},yaw:0,mode:'idle',pose:'idle',stride:0},false);
 return actor;
}
function meshes(root:T.Object3D):T.Mesh[]{const result:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)result.push(o);});return result;}
function frontSurface(root:T.Object3D,x:number,y:number,rise=0):T.Object3D|undefined{
 // Slightly elevated views are the actual orbit-camera use case: a closed cap can hide eyes even when frontal rays work.
 const target=new T.Vector3(x,y,.15),origin=target.clone().add(new T.Vector3(0,rise,1));
 return new T.Raycaster(origin,target.clone().sub(origin).normalize()).intersectObject(root,true)[0]?.object;
}
afterEach(()=>{resources.forEach(r=>r.dispose());resources.length=0;});

describe('NPR farmer refinement',()=>{
 it('leaves a visible forehead instead of a solid dark fringe across the front of the face',()=>{
  const actor=farmer(),head=actor.root.getObjectByName('npr-farmer-head');
  expect(head).toBeDefined();
  for(const [x,y] of[[0,1.99],[-.04,1.98],[.04,1.98]]){
   expect(frontSurface(actor.root,x,y)?.uuid).toBe(head?.uuid);
  }
 });

 it('keeps both eyes visible from the front and a modestly elevated orbit view',()=>{
  const actor=farmer();
  for(const x of[-.058,.058])for(const rise of[0,.22]){
   expect(frontSurface(actor.root,x,1.925,rise)?.name).toMatch(/^npr-farmer-eye/);
  }
 });

 it('keeps the mouth in front of the jaw surface rather than burying it inside the head',()=>{
  const actor=farmer();
  expect(frontSurface(actor.root,0,1.823)?.name).toBe('npr-farmer-mouth');
 });

 it('gives working clothes a rolled sleeve, waist belt and pouch silhouette rather than an uninterrupted overalls tube',()=>{
  const actor=farmer(),parts=meshes(actor.root);
  const sleeve=parts.find(m=>m.name==='npr-farmer-sleeve-left');
  expect(sleeve).toBeDefined();
  const sleeveSize=new T.Box3().setFromObject(sleeve!).getSize(new T.Vector3());
  expect(sleeveSize.x).toBeGreaterThan(.2);
  const belt=actor.root.getObjectByName('npr-farmer-belt'),pouch=actor.root.getObjectByName('npr-farmer-pouch');
  expect(belt).toBeInstanceOf(T.Mesh);expect(pouch).toBeInstanceOf(T.Mesh);
  const pouchBounds=new T.Box3().setFromObject(pouch!);
  expect(pouchBounds.max.x).toBeGreaterThan(.27);
  expect(pouchBounds.max.y-pouchBounds.min.y).toBeGreaterThan(.15);
 });

 it('keeps one continuous trouser surface through each knee in straight and bent poses',()=>{
  const actor=farmer();
  for(const [mode,pose] of[['idle','idle'],['work','squat-down']] as const){
   actor.update({position:{x:0,y:0,z:0},yaw:0,mode,pose,stride:0},false);
   for(const side of['left','right']){
    const leg=actor.root.getObjectByName(`npr-farmer-leg-${side}`) as T.Mesh|undefined;
    expect(leg).toBeInstanceOf(T.Mesh);
    const geometry=leg!.geometry,positions=geometry.getAttribute('position');
    // A knee must be part of the same connected surface as thigh and shin, without an open joining ring.
    const adjacency=new Map<number,Set<number>>(),indices=geometry.index!.array;
    for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){
     const index=indices[i+j],next=indices[i+(j+1)%3],links=adjacency.get(index)??new Set<number>();
     links.add(next);adjacency.set(index,links);
    }
    const visited=new Set<number>(),pending=[0];
    while(pending.length){const index=pending.pop()!;if(visited.has(index))continue;visited.add(index);pending.push(...adjacency.get(index)??[]);}
    expect(visited.size).toBe(positions.count);
    const bounds=new T.Box3().setFromObject(leg!);
    expect(bounds.max.y-bounds.min.y).toBeGreaterThan(mode==='idle'?.72:.48);
    expect(positions.array.every(Number.isFinite)).toBe(true);
   }
  }
 });

 it('keeps the farmer close to 2.2 world units with shared static details inside the local model budget',()=>{
  const actor=farmer(),parts=meshes(actor.root),bounds=new T.Box3().setFromObject(actor.root);
  expect(bounds.max.y).toBeGreaterThan(2.12);expect(bounds.max.y).toBeLessThan(2.25);
  expect(parts.length).toBeLessThanOrEqual(60);
  expect(parts.reduce((sum,m)=>sum+(m.geometry.index?.count??m.geometry.getAttribute('position').count)/3,0)).toBeLessThan(12000);
  const other=farmer();
  expect(actor.root.getObjectByName('npr-farmer-shirt') instanceof T.Mesh).toBe(true);
  // Shared resources are tested in the original model contract; this budget includes all visible detail draws.
  expect(meshes(other.root).length).toBe(parts.length);
 });

 it('owns deforming vertices per actor while sharing static clothing and materials',()=>{
  const r=new WorldResources();resources.push(r);const p=new NprPalette(r),first=new NprCharacter3D(r,p),second=new NprCharacter3D(r,p);
  const idle={position:{x:0,y:0,z:0},yaw:0,mode:'idle',pose:'idle',stride:0} as const;
  first.update(idle,false);second.update(idle,false);
  const leg=(actor:NprCharacter3D):T.Mesh=>actor.root.getObjectByName('npr-farmer-leg-left') as T.Mesh;
  const shirt=(actor:NprCharacter3D):T.Mesh=>actor.root.getObjectByName('npr-farmer-shirt') as T.Mesh;
  const preserved=Array.from(leg(second).geometry.getAttribute('position').array);
  expect(leg(first).geometry.uuid).not.toBe(leg(second).geometry.uuid);
  expect(shirt(first).geometry.uuid).toBe(shirt(second).geometry.uuid);
  expect(leg(first).material).toBe(leg(second).material);
  first.update({...idle,mode:'work',pose:'squat-down'},false);
  expect(Array.from(leg(second).geometry.getAttribute('position').array)).toEqual(preserved);
  expect(Array.from(leg(first).geometry.getAttribute('position').array)).not.toEqual(preserved);
 });

 it('does not upload new animated vertices or normals for an unchanged idle pose',()=>{
  const actor=farmer(),leg=actor.root.getObjectByName('npr-farmer-leg-left') as T.Mesh;
  const positions=leg.geometry.getAttribute('position') as T.BufferAttribute,normals=leg.geometry.getAttribute('normal') as T.BufferAttribute;
  const before=[positions.version,normals.version];
  actor.update({position:{x:2,y:0,z:-3},yaw:.8,mode:'idle',pose:'idle',stride:25},false);
  expect([positions.version,normals.version]).toEqual(before);
  expect(actor.root.position.toArray()).toEqual([2,0,-3]);
 });
});
