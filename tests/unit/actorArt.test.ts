import {afterEach,describe,expect,it} from 'vitest';
import * as T from 'three';
import {Character3D,makeCart,makeLog,makePine} from '../../src/game/world/models.js';
import {WorldResources} from '../../src/game/world/resources.js';
import type {WorldActor} from '../../src/game/world/types.js';

const resources:WorldResources[]=[];
function resource():WorldResources{const r=new WorldResources();resources.push(r);return r;}
function meshes(root:T.Object3D):T.Mesh[]{const result:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)result.push(o);});return result;}
function triangles(root:T.Object3D):number{return meshes(root).reduce((sum,m)=>sum+(m.geometry.index?.count??m.geometry.getAttribute('position').count)/3,0);}
function mapped(mesh:T.Mesh):boolean{return mesh.material instanceof T.MeshLambertMaterial&&mesh.material.map!==null;}
function bevelled(mesh:T.Mesh):boolean{
 const normals=mesh.geometry.getAttribute('normal');
 for(let i=0;i<normals.count;i++)if(Math.abs(normals.getX(i))>.1&&Math.abs(normals.getX(i))<.95)return true;
 return false;
}
afterEach(()=>{for(const r of resources)r.dispose();resources.length=0;});

describe('farm actor art contracts',()=>{
 it('keeps soft contact decals above the raised road, including the scaled NPC',()=>{
  const r=resource(),npc=new Character3D(r,true);npc.root.scale.setScalar(.88);
  for(const root of[new Character3D(r).root,npc.root,makeCart(r).root]){
   const disk=meshes(root).find(m=>m.material instanceof T.MeshLambertMaterial&&m.material.transparent)!;
   const bounds=new T.Box3().setFromObject(disk);
   // Crossroads top: .04 + .045/2 = .0625; a lower decal is hidden by its depth buffer.
   expect(bounds.min.y).toBeGreaterThan(.0625);expect(bounds.max.y).toBeLessThan(.09);
  }
 });
 it('uses a transparent contact fade below each actor without casting another disk shadow',()=>{
  const r=resource(),roots=[new Character3D(r).root,new Character3D(r,true).root,makeCart(r).root];
  for(const root of roots){
   const disks=meshes(root).filter(m=>m.material instanceof T.MeshLambertMaterial&&m.material.transparent&&new T.Box3().setFromObject(m).getSize(new T.Vector3()).x>.8);
   expect(disks).toHaveLength(1);
   const material=disks[0].material;expect(material).toBeInstanceOf(T.MeshLambertMaterial);
   if(!(material instanceof T.MeshLambertMaterial))throw new Error('Contact disk must have one material');
   expect(material.transparent).toBe(true);expect(material.map).not.toBeNull();expect(material.depthWrite).toBe(false);
   expect(disks[0].castShadow).toBe(false);expect(disks[0].receiveShadow).toBe(false);
  }
 });

 it('keeps both cut faces and bark visible within the three-draw log budget',()=>{
  const log=makeLog(resource()),parts=meshes(log),size=new T.Box3().setFromObject(log).getSize(new T.Vector3());
  expect(parts.length).toBeLessThanOrEqual(3);
  expect(parts.filter(mapped)).toHaveLength(3);
  expect(size.x).toBeGreaterThan(.86);expect(size.x).toBeLessThan(.91);
  expect(size.y).toBeGreaterThan(.30);expect(size.y).toBeLessThan(.36);
  expect(size.z).toBeGreaterThan(.30);expect(size.z).toBeLessThan(.36);
  const faces=parts.filter(m=>Math.abs(m.position.x)>.42);
  expect(faces).toHaveLength(2);
  expect(faces[0].material).toBe(faces[1].material);
  expect(faces[0].material).not.toBe(parts.find(m=>m.position.x===0)?.material);
 });

 it.each([{robot:false,role:'farmer'},{robot:true,role:'robot helper'}])('gives the $role a rounded head and a fabric torso within its draw budget',({robot})=>{
  const actor=new Character3D(resource(),robot),parts=meshes(actor.root);
  actor.update({position:{x:0,y:0,z:0},yaw:0,mode:'idle',pose:'idle',stride:0},false);
  const torso=parts.filter(m=>{
   const bounds=new T.Box3().setFromObject(m),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
   return center.y>1.1&&center.y<1.45&&size.x>.4&&size.y>.4;
  });
  expect(torso.some(m=>mapped(m)&&bevelled(m))).toBe(true);
  const head=parts.filter(m=>{
   const bounds=new T.Box3().setFromObject(m),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
   return center.y>1.7&&center.y<2&&size.x>.4&&size.y>.35;
  });
  expect(head.some(bevelled)).toBe(true);
  expect(parts.length).toBeLessThanOrEqual(robot?44:50);
  expect(triangles(actor.root)).toBeLessThanOrEqual(robot?6500:7500);
 });

 it.each([
  {mode:'work',pose:'ready',chopping:true,position:{x:3,y:2,z:-4},yaw:Math.PI/2,want:[3.38,4.3,-4]},
  {mode:'work',pose:'chop-down',chopping:true,position:{x:0,y:0,z:0},yaw:0,want:[0,.85,.85]},
  {mode:'work',pose:'squat-down',chopping:false,position:{x:1,y:0,z:2},yaw:Math.PI,want:[1,.45,1.45]},
  {mode:'work',pose:'press-up',chopping:false,position:{x:0,y:0,z:0},yaw:0,want:[0,2.35,.48]},
  {mode:'push',pose:'idle',chopping:false,position:{x:0,y:0,z:0},yaw:0,want:[0,1.04,.5]},
  {mode:'pull',pose:'idle',chopping:false,position:{x:0,y:0,z:0},yaw:0,want:[0,1.04,-.55]},
  {mode:'secure',pose:'idle',chopping:false,position:{x:0,y:0,z:0},yaw:0,want:[0,1.85,.5]},
  {mode:'celebrate',pose:'idle',chopping:false,position:{x:0,y:0,z:0},yaw:0,want:[0,2.25,.1]},
 ] satisfies (Omit<WorldActor,'stride'>&{chopping:boolean;want:number[]})[])('preserves the $mode/$pose world hand anchor',fixture=>{
  const actor=new Character3D(resource());actor.update({...fixture,stride:.75},fixture.chopping);
  const anchor=actor.handPosition();
  anchor.toArray().forEach((value,i)=>expect(value).toBeCloseTo(fixture.want[i],7));
  expect(actor.root.position.toArray()).toEqual([fixture.position.x,fixture.position.y,fixture.position.z]);
 });

 it('keeps cart grips and cargo ropes at the choreography contact points while rounding its wooden rails',()=>{
  const cart=makeCart(resource()),parts=meshes(cart.root);
  expect(parts.length).toBeLessThanOrEqual(45);
  expect(cart.wheels).toHaveLength(2);expect(cart.ropes).toHaveLength(10);
  expect(cart.wheels.map(w=>w.position.toArray())).toEqual([[-.23,.38,-.75],[-.23,.38,.75]]);
  for(const z of[-.35,.35])expect(parts.some(m=>m.position.distanceTo(new T.Vector3(1.05,1.04,z))<.001)).toBe(true);
  const rails=parts.filter(m=>new T.Box3().setFromObject(m).getSize(new T.Vector3()).x>1.6&&m.position.y>.8);
  expect(rails.length).toBeGreaterThanOrEqual(6);
  expect(rails.every(m=>mapped(m)&&bevelled(m))).toBe(true);
  expect(triangles(cart.root)).toBeLessThan(5500);
 });

 it('shares lobed pine tiers and preserves the existing tree fall envelope',()=>{
  const r=resource(),tree=makePine(r),other=makePine(r,.8),tiers=meshes(tree.crown),size=new T.Box3().setFromObject(tree.root).getSize(new T.Vector3());
  expect(meshes(tree.root).length).toBeLessThanOrEqual(7);
  expect(triangles(tree.root)).toBeLessThan(1100);
  expect(tiers.length).toBeGreaterThanOrEqual(3);
  expect(new Set(tiers.map(m=>m.geometry)).size).toBe(1);
  expect(meshes(other.crown)[0].geometry).toBe(tiers[0].geometry);
  const vertices=tiers[0].geometry.getAttribute('position'),rings=new Map<number,number[]>();
  for(let i=0;i<vertices.count;i++){
   const radius=Math.hypot(vertices.getX(i),vertices.getZ(i));if(radius<.4)continue;
   const level=Math.round(vertices.getY(i)*1000),radii=rings.get(level)??[];radii.push(radius);rings.set(level,radii);
  }
  expect([...rings.values()].some(radii=>Math.max(...radii)-Math.min(...radii)>.12)).toBe(true);
  expect(size.y).toBeGreaterThan(4);expect(size.y).toBeLessThan(4.5);
  expect(size.x).toBeGreaterThan(2.2);expect(size.x).toBeLessThan(2.7);
 });
});
