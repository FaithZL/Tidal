import {expect,test} from 'vitest';
import * as T from 'three';
import {buildEnvironment} from '../../src/game/world/environment.js';
import {WorldResources} from '../../src/game/world/resources.js';
import {NprPalette} from '../../src/game/world/nprMaterials.js';
import {buildNprSampleEnvironment} from '../../src/game/world/nprEnvironment.js';

function meshes(root:T.Object3D):T.Mesh[]{const result:T.Mesh[]=[];root.traverse(object=>{if(object instanceof T.Mesh)result.push(object);});return result;}
function release(root:T.Object3D,r:WorldResources):void{root.traverse(object=>{if(object instanceof T.InstancedMesh)object.dispose();});r.dispose();}

test('sample exclusion removes only the local barn while the default farm retains all three roofs',()=>{
 const r=new WorldResources(),legacy=buildEnvironment(r),sample=buildEnvironment(r,{excludeSampleZone:true});
 try{
  const roofs=(root:T.Group)=>meshes(root).filter(mesh=>mesh.geometry.type==='ExtrudeGeometry');
  expect(roofs(legacy)).toHaveLength(3);expect(roofs(sample)).toHaveLength(2);
  sample.updateMatrixWorld(true);
  expect(roofs(sample).map(mesh=>mesh.getWorldPosition(new T.Vector3()).x).sort((a,b)=>a-b)).toEqual([20,43]);
  for(const count of[72,130])expect(meshes(sample).filter(mesh=>mesh instanceof T.InstancedMesh&&mesh.count===count)).toHaveLength(count===72?6:1);
  const hayGeometry=r.cylinder(.6,.6,1.15,0xcdb568,12).geometry,hayPositions:T.Vector3[]=[];
  for(const mesh of meshes(sample))if(mesh.geometry===hayGeometry){
   for(let i=0;i<(mesh instanceof T.InstancedMesh?mesh.count:1);i++){
    const matrix=mesh.matrixWorld.clone();if(mesh instanceof T.InstancedMesh){const local=new T.Matrix4();mesh.getMatrixAt(i,local);matrix.multiply(local);}
    hayPositions.push(new T.Vector3().setFromMatrixPosition(matrix));
   }
  }
  expect(hayPositions).toHaveLength(18);expect(hayPositions.every(position=>position.x>=16)).toBe(true);
 }finally{release(legacy,r);release(sample,r);}
});

test('the local painted meadow adds broad cool green variation below the unchanged road contact plane',()=>{
 const r=new WorldResources(),root=buildNprSampleEnvironment(r,new NprPalette(r));
 try{
  const meadow=root.getObjectByName('sample-painted-meadow');expect(meadow).toBeInstanceOf(T.Mesh);
  const m=meadow as T.Mesh<T.BufferGeometry,T.MeshToonMaterial>,bounds=new T.Box3().setFromObject(m);
  expect(bounds.max.y).toBeLessThan(.0575);expect(bounds.min.y).toBeGreaterThan(.025);
  expect(bounds.min.x).toBeCloseTo(-12,3);expect(bounds.max.x).toBeCloseTo(10,3);
  expect(m.material.vertexColors).toBe(true);expect(m.material.color.g).toBeGreaterThan(m.material.color.r);
  const colors=m.geometry.getAttribute('color');expect(colors).toBeDefined();
  expect(colors.itemSize).toBe(4);expect(m.material.transparent).toBe(true);expect(m.material.depthWrite).toBe(false);
  expect(colors.getW(0)).toBe(0);expect(colors.getW(Math.floor(colors.count/2))).toBeCloseTo(1);
  expect(new Set(Array.from({length:colors.count},(_,i)=>[colors.getX(i),colors.getY(i),colors.getZ(i)].map(n=>n.toFixed(3)).join('/'))).size).toBeGreaterThan(30);
  expect(m.receiveShadow).toBe(true);expect(m.castShadow).toBe(false);
 }finally{release(root,r);}
});

test('the sample cottage is grounded, has real sloped overhanging roof panels and recessed window openings',()=>{
 const r=new WorldResources(),root=buildNprSampleEnvironment(r,new NprPalette(r));
 try{
  root.updateMatrixWorld(true);
  const wall=root.getObjectByName('sample-cottage-wall'),left=root.getObjectByName('sample-roof-west'),right=root.getObjectByName('sample-roof-east');
  expect(wall).toBeInstanceOf(T.Mesh);expect(left).toBeInstanceOf(T.Mesh);expect(right).toBeInstanceOf(T.Mesh);
  const walls=new T.Box3().setFromObject(wall!),roof=new T.Box3().setFromObject(left!).union(new T.Box3().setFromObject(right!));
  expect(walls.min.y).toBeCloseTo(.23,3);expect(roof.min.x).toBeLessThan(walls.min.x-.35);expect(roof.max.x).toBeGreaterThan(walls.max.x+.35);
  expect(roof.min.z).toBeLessThan(walls.min.z-.35);expect(roof.max.z).toBeGreaterThan(walls.max.z+.35);
  expect(Math.abs(left!.rotation.z)).toBeGreaterThan(.35);expect(left!.rotation.z).toBeCloseTo(-right!.rotation.z,5);
  const window=root.getObjectByName('sample-front-window-west'),reveal=root.getObjectByName('sample-front-reveal-west');
  expect(window).toBeInstanceOf(T.Mesh);expect(reveal).toBeInstanceOf(T.Mesh);
  const glassBox=new T.Box3().setFromObject(window!),revealBox=new T.Box3().setFromObject(reveal!);
  expect(glassBox.max.z).toBeLessThan(revealBox.max.z);expect(glassBox.max.z).toBeGreaterThan(walls.max.z);
  expect(root.getObjectByName('sample-entry-canopy')).toBeInstanceOf(T.Mesh);
 }finally{release(root,r);}
});

test('the local sample keeps road and work anchors clear within bounded scenery and finite rendering budgets',()=>{
 const r=new WorldResources(),root=buildNprSampleEnvironment(r,new NprPalette(r));
 try{
  root.updateMatrixWorld(true);const all=meshes(root),bounds=new T.Box3().setFromObject(root);
  expect(bounds.min.x).toBeGreaterThanOrEqual(-12.5);expect(bounds.max.x).toBeLessThanOrEqual(10);
  expect(bounds.min.z).toBeGreaterThanOrEqual(-20);expect(bounds.max.z).toBeLessThanOrEqual(4);
  expect(bounds.min.y).toBeGreaterThanOrEqual(.024);expect(bounds.max.y).toBeLessThan(6.5);
  // Curved meadow ribbons, low herbs and flowers increase real geometry; merged
  // cottage trim keeps the richer local sample below its revised draw budget.
  expect(all.length).toBeLessThan(50);
  expect(all.reduce((sum,mesh)=>sum+(mesh.geometry.index?.count??mesh.geometry.getAttribute('position').count)/3*(mesh instanceof T.InstancedMesh?mesh.count:1),0)).toBeLessThan(18000);
  const clearRoad=new T.Box3(new T.Vector3(-6,.08,-1.175),new T.Vector3(10,2.5,1.175));
  for(const mesh of all){
   if(mesh instanceof T.InstancedMesh){
    mesh.geometry.computeBoundingBox();
    for(let i=0;i<mesh.count;i++){const m=new T.Matrix4();mesh.getMatrixAt(i,m);m.premultiply(mesh.matrixWorld);expect(mesh.geometry.boundingBox!.clone().applyMatrix4(m).intersectsBox(clearRoad)).toBe(false);}
   }else expect(new T.Box3().setFromObject(mesh).intersectsBox(clearRoad)).toBe(false);
  }
  const bank=all.find(mesh=>mesh.name==='sample-grass-bank-west');expect(bank).toBeDefined();
  const positions=bank!.geometry.getAttribute('position'),heights=new Set(Array.from({length:positions.count},(_,i)=>positions.getY(i).toFixed(3)));
  expect(heights.size).toBeGreaterThan(8);expect(bank!.receiveShadow).toBe(true);
 }finally{release(root,r);}
});

test('sample surfaces share the palette and their resources release once with the existing world owner',()=>{
 const r=new WorldResources(),palette=new NprPalette(r),root=buildNprSampleEnvironment(r,palette),second=buildNprSampleEnvironment(r,palette);
 const materials=new Set<T.Material>(),geometries=new Set<T.BufferGeometry>(),counts=new Map<T.EventDispatcher,{count:number}>();
 try{
  for(const mesh of meshes(root)){
   expect(Array.isArray(mesh.material)).toBe(false);expect(mesh.material).toBeInstanceOf(T.MeshToonMaterial);expect(mesh.receiveShadow).toBe(true);
   materials.add(mesh.material as T.Material);geometries.add(mesh.geometry);
  }
  expect(meshes(root).length).toBeGreaterThan(20);expect(materials.size).toBeGreaterThan(5);expect(geometries.size).toBeGreaterThan(10);expect(materials.size).toBeLessThan(18);
  for(const material of materials)expect(meshes(second).some(mesh=>mesh.material===material)).toBe(true);
  for(const item of[...materials,...geometries]){const count={count:0};counts.set(item,count);item.addEventListener('dispose',()=>count.count++);}
  r.dispose();r.dispose();for(const counter of counts.values())expect(counter.count).toBe(1);
 }finally{release(root,r);release(second,r);}
});
