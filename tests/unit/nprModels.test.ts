import {afterEach,describe,expect,it} from 'vitest';
import * as T from 'three';
import {NprCharacter3D,makeNprCart,makeNprLog,makeNprTree} from '../../src/game/world/nprModels.js';
import {NprPalette} from '../../src/game/world/nprMaterials.js';
import {WorldResources} from '../../src/game/world/resources.js';
import type {WorldActor} from '../../src/game/world/types.js';

const owned:WorldResources[]=[];
function setup():{r:WorldResources;p:NprPalette}{const r=new WorldResources();owned.push(r);return{r,p:new NprPalette(r)};}
function meshes(root:T.Object3D):T.Mesh[]{const list:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)list.push(o);});return list;}
function triangleCount(root:T.Object3D):number{return meshes(root).reduce((sum,m)=>sum+(m.geometry.index?.count??m.geometry.getAttribute('position').count)/3,0);}
afterEach(()=>{owned.forEach(r=>r.dispose());owned.length=0;});

describe('local NPR actor sample',()=>{
 it('sculpts an adult farmer with a tapered torso and six-head proportions rather than a rounded box head',()=>{
  const {r,p}=setup(),actor=new NprCharacter3D(r,p);actor.update({position:{x:0,y:0,z:0},yaw:0,mode:'idle',pose:'idle',stride:0},false);
  const head=actor.root.getObjectByName('npr-farmer-head') as T.Mesh;
  const torso=actor.root.getObjectByName('npr-farmer-shirt') as T.Mesh;
  expect(head).toBeInstanceOf(T.Mesh);expect(torso).toBeInstanceOf(T.Mesh);
  const headSize=new T.Box3().setFromObject(head).getSize(new T.Vector3());
  expect(headSize.y).toBeGreaterThan(.34);expect(headSize.y).toBeLessThan(.40);
  expect(2.2/headSize.y).toBeGreaterThan(5.5);expect(2.2/headSize.y).toBeLessThan(6.5);
  expect(head.geometry.type).not.toBe('RoundedBoxGeometry');
  const normals=head.geometry.getAttribute('normal');
  // Ring winding must face outward; inward triangles disappear with the standard front-side material.
  expect(normals.getX(3*21)).toBeGreaterThan(.7);
  const pos=torso.geometry.getAttribute('position'),radii=new Set<number>();
  for(let i=0;i<pos.count;i++)if(Math.abs(pos.getZ(i))<.005)radii.add(Math.round(Math.abs(pos.getX(i))*1000));
  expect(radii.size).toBeGreaterThan(3);
  expect(actor.root.getObjectByName('npr-farmer-hair')).toBeDefined();
  expect(meshes(actor.root).length).toBeLessThanOrEqual(54);expect(triangleCount(actor.root)).toBeLessThan(10000);
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
  const {r,p}=setup(),actor=new NprCharacter3D(r,p);actor.update({...fixture,stride:.75},fixture.chopping);
  actor.handPosition().toArray().forEach((value,i)=>expect(value).toBeCloseTo(fixture.want[i],7));
 });
 it('preserves the robot identity, cart grip and wheel contacts, cut faces and reusable resources',()=>{
  const {r,p}=setup(),robot=new NprCharacter3D(r,p,true),cart=makeNprCart(r,p),log=makeNprLog(r,p),another=makeNprLog(r,p);
  expect(meshes(robot.root).some(m=>m.material instanceof T.MeshToonMaterial)).toBe(true);
  expect(cart.wheels.map(w=>w.position.toArray())).toEqual([[-.23,.38,-.75],[-.23,.38,.75]]);expect(cart.ropes).toHaveLength(10);
  for(const z of[-.35,.35])expect(meshes(cart.root).some(m=>m.position.distanceTo(new T.Vector3(1.05,1.04,z))<.001)).toBe(true);
  expect(meshes(log)).toHaveLength(3);expect(meshes(log).filter(m=>Math.abs(m.position.x)>.42)).toHaveLength(2);
  expect(meshes(log)[0].geometry).toBe(meshes(another)[0].geometry);expect(meshes(log)[0].material).toBe(meshes(another)[0].material);
 });
 it('uses individual leaf silhouettes and visible forks within the existing tree interaction envelope',()=>{
  const {r,p}=setup(),tree=makeNprTree(r,p),other=makeNprTree(r,p),size=new T.Box3().setFromObject(tree.root).getSize(new T.Vector3());
  expect(tree.trunk).toBeInstanceOf(T.Mesh);expect(tree.crown.parent).toBe(tree.root);
  const leaves=meshes(tree.crown).filter((m):m is T.InstancedMesh=>m instanceof T.InstancedMesh);
  const boughCount=leaves.reduce((sum,m)=>sum+m.count,0);expect(boughCount).toBeGreaterThanOrEqual(100);expect(boughCount).toBeLessThanOrEqual(160);
  expect(leaves[0].material).toBeInstanceOf(T.MeshToonMaterial);expect((leaves[0].material as T.MeshToonMaterial).alphaTest).toBeGreaterThanOrEqual(.4);
  expect(leaves[0].geometry).toBe(meshes(other.crown).find(m=>m instanceof T.InstancedMesh)?.geometry);
  expect(meshes(tree.crown).some(m=>!(m instanceof T.InstancedMesh)&&(m.material as T.Material).name.includes('bark'))).toBe(true);
  expect(size.y).toBeGreaterThan(4.3);expect(size.y).toBeLessThan(4.9);
  expect(size.x).toBeGreaterThan(3.2);expect(size.x).toBeLessThan(4.15);
  const submittedTriangles=meshes(tree.root).reduce((sum,m)=>sum+(m.geometry.index?.count??m.geometry.getAttribute('position').count)/3*(m instanceof T.InstancedMesh?m.count:1),0);
  expect(submittedTriangles).toBeLessThanOrEqual(6500);expect(meshes(tree.root).length).toBeLessThanOrEqual(12);
  tree.trunk.visible=false;tree.crown.visible=false;
  const visible:T.Mesh[]=[];tree.root.traverseVisible(o=>{if(o instanceof T.Mesh)visible.push(o);});expect(visible).toHaveLength(0);
  for(const root of[tree.root,other.root])root.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});
 });
});
