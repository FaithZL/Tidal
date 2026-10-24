import {afterEach,describe,expect,it} from 'vitest';
import * as T from 'three';
import {makeNprTree} from '../../src/game/world/nprVegetation.js';
import {NprPalette} from '../../src/game/world/nprMaterials.js';
import {WorldResources} from '../../src/game/world/resources.js';

const resources:WorldResources[]=[],roots:T.Object3D[]=[];
function create():{r:WorldResources;p:NprPalette}{const r=new WorldResources();resources.push(r);return{r,p:new NprPalette(r)};}
function tree(r:WorldResources,p:NprPalette):ReturnType<typeof makeNprTree>{const value=makeNprTree(r,p);roots.push(value.root);return value;}
function meshes(root:T.Object3D):T.Mesh[]{const values:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)values.push(o);});return values;}
function triangles(root:T.Object3D):number{return meshes(root).reduce((sum,m)=>sum+(m.geometry.index?.count??m.geometry.getAttribute('position').count)/3*(m instanceof T.InstancedMesh?m.count:1),0);}
afterEach(()=>{for(const root of roots)root.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});for(const r of resources)r.dispose();roots.length=resources.length=0;});

describe('leaf silhouette tree refinement',()=>{
 it('uses crossed bough cards throughout an irregular canopy instead of opaque round crown cores',()=>{
  const {r,p}=create(),value=tree(r,p),cards=meshes(value.crown).filter((m):m is T.InstancedMesh=>m instanceof T.InstancedMesh);
  expect(cards.length).toBeGreaterThan(0);
  const cardCount=cards.reduce((sum,m)=>sum+m.count,0);expect(cardCount).toBeGreaterThanOrEqual(100);expect(cardCount).toBeLessThanOrEqual(160);
  const centers:T.Vector3[]=[],matrix=new T.Matrix4();
  for(const card of cards){
   expect((card.geometry.index?.count??card.geometry.getAttribute('position').count)/3).toBeLessThanOrEqual(12);
   expect(card.material).toBeInstanceOf(T.MeshToonMaterial);
   expect((card.material as T.MeshToonMaterial).alphaTest).toBeGreaterThanOrEqual(.4);
   expect((card.material as T.MeshToonMaterial).side).toBe(T.DoubleSide);
   expect(card.instanceColor).not.toBeNull();
   for(let i=0;i<card.count;i++){card.getMatrixAt(i,matrix);expect(matrix.determinant()).toBeGreaterThan(0);centers.push(new T.Vector3().setFromMatrixPosition(matrix));}
  }
  // Small separate surfaces leave visible gaps around the forks; no crown-size solid core remains.
  expect(meshes(value.crown).filter(m=>!(m instanceof T.InstancedMesh)).every(m=>(m.material as T.Material).name.includes('bark'))).toBe(true);
  const positions=new T.Box3().setFromPoints(centers).getSize(new T.Vector3());
  expect(positions.x).toBeGreaterThan(2.6);expect(positions.z).toBeGreaterThan(2.3);expect(positions.y).toBeGreaterThan(1.2);
  expect(Math.min(...centers.map(c=>c.y))).toBeGreaterThan(2.5);
  const colors=cards[0].instanceColor!,lightness:number[]=[];
  for(let i=0;i<colors.count;i++)lightness.push(colors.getX(i)+colors.getY(i)+colors.getZ(i));
  expect(Math.max(...lightness)-Math.min(...lightness)).toBeGreaterThan(.25);
 });

 it('keeps the rooted trunk, broad canopy and instanced triangle submissions inside the interaction budget',()=>{
  const {r,p}=create(),value=tree(r,p),bounds=new T.Box3().setFromObject(value.root),size=bounds.getSize(new T.Vector3());
  expect(bounds.min.y).toBeCloseTo(0,6);expect(size.y).toBeGreaterThan(4.3);expect(size.y).toBeLessThan(4.9);
  expect(size.x).toBeGreaterThan(3.2);expect(size.x).toBeLessThan(4.15);expect(size.z).toBeGreaterThan(2.8);expect(size.z).toBeLessThan(4.15);
  expect(meshes(value.root).length).toBeLessThanOrEqual(12);expect(triangles(value.root)).toBeLessThanOrEqual(6500);
  const bases:T.Vector3[]=[],positions=value.trunk.geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++)if(positions.getY(i)<.025)bases.push(new T.Vector3().fromBufferAttribute(positions,i));
  const footing=new T.Box3().setFromPoints(bases).getSize(new T.Vector3());
  expect(footing.x).toBeGreaterThan(.9);expect(footing.z).toBeGreaterThan(.8);
 });

 it('limits overlapping alpha cards and preserves larger painted leaf shapes at the sample distance',()=>{
  const {r,p}=create(),value=tree(r,p),cards=meshes(value.crown).filter((m):m is T.InstancedMesh=>m instanceof T.InstancedMesh);
  const matrix=new T.Matrix4(),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();
  for(const card of cards)for(let i=0;i<card.count;i++){
   card.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);
   expect(scale.y).toBeGreaterThanOrEqual(.75);expect(scale.y).toBeLessThanOrEqual(.92);expect(scale.z).toBeGreaterThanOrEqual(.75);
  }
  expect(cards.reduce((sum,m)=>sum+m.count,0)).toBeLessThanOrEqual(160);
  expect(triangles(value.root)).toBeLessThanOrEqual(3100);
 });

 it('emits finite normals with outward-facing trunk sides and shares all owned geometry and materials',()=>{
  const {r,p}=create(),a=tree(r,p),b=tree(r,p),first=meshes(a.root),second=meshes(b.root);
  expect(first).toHaveLength(second.length);
  first.forEach((mesh,index)=>{
   expect(mesh.geometry).toBe(second[index].geometry);expect(mesh.material).toBe(second[index].material);
   const positions=mesh.geometry.getAttribute('position'),normals=mesh.geometry.getAttribute('normal');
   for(let i=0;i<positions.count;i++){
    const position=new T.Vector3().fromBufferAttribute(positions,i),normal=new T.Vector3().fromBufferAttribute(normals,i);
    expect(position.toArray().every(Number.isFinite)).toBe(true);expect(normal.length()).toBeCloseTo(1,4);
   }
  });
  const trunkPosition=a.trunk.geometry.getAttribute('position'),trunkNormal=a.trunk.geometry.getAttribute('normal');
  // The first ring starts on the +X trunk side; reversed winding turns the bark inside out.
  expect(trunkPosition.getX(0)).toBeGreaterThan(.2);expect(trunkNormal.getX(0)).toBeGreaterThan(.5);
  const ownedGeometries=[...new Set(first.map(m=>m.geometry))],ownedMaterials=[...new Set(first.flatMap(m=>Array.isArray(m.material)?m.material:[m.material]))];
  const disposalCounts=new Map<T.EventDispatcher,{count:number}>();
  for(const item of[...ownedGeometries,...ownedMaterials]){const counter={count:0};disposalCounts.set(item,counter);item.addEventListener('dispose',()=>{counter.count++;});}
  r.dispose();expect([...disposalCounts.values()].every(counter=>counter.count===1)).toBe(true);
 });

 it('keeps every visible part under the existing trunk and ground-pivot crown fall controls',()=>{
  const {r,p}=create(),value=tree(r,p);
  expect(value.trunk).toBeInstanceOf(T.Mesh);expect(value.trunk.visible).toBe(true);expect(value.trunk.parent).toBe(value.root);
  expect(value.crown.parent).toBe(value.root);expect(value.crown.position.toArray()).toEqual([0,0,0]);
  const standing=new T.Box3().setFromObject(value.crown).clone();
  value.trunk.visible=false;value.crown.rotation.z=-Math.PI*.35;value.crown.scale.setScalar(.65);value.root.updateMatrixWorld(true);
  const falling=new T.Box3().setFromObject(value.crown);
  expect(falling.max.x).toBeGreaterThan(standing.max.x);
  value.crown.visible=false;const visible:T.Mesh[]=[];value.root.traverseVisible(o=>{if(o instanceof T.Mesh)visible.push(o);});expect(visible).toHaveLength(0);
  value.trunk.visible=value.crown.visible=true;value.crown.rotation.z=0;value.crown.scale.setScalar(1);
  expect(new T.Box3().setFromObject(value.crown).equals(standing)).toBe(true);
 });
});
