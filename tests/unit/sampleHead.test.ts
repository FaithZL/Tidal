import {afterEach,describe,expect,it} from 'vitest';
import * as T from 'three';
import {createSampleHead} from '../../src/game/world/sampleHead.js';
import {NprPalette} from '../../src/game/world/nprMaterials.js';
import {WorldResources} from '../../src/game/world/resources.js';

const resources:WorldResources[]=[];
function makeHead():T.Group{const r=new WorldResources();resources.push(r);return createSampleHead(r,new NprPalette(r));}
function parts(root:T.Object3D):T.Mesh[]{const result:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)result.push(o);});return result;}
function sideBounds(mesh:T.Mesh,sign:number):T.Box3{
 const result=new T.Box3(),position=mesh.geometry.getAttribute('position');mesh.updateWorldMatrix(true,false);
 for(let i=0;i<position.count;i++){
  const vertex=new T.Vector3().fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld);
  if(vertex.x*sign>0)result.expandByPoint(vertex);
 }return result;
}
function visible(root:T.Object3D,x:number,y:number,rise=0,yaw=0,z=.13):T.Object3D|undefined{
 root.updateMatrixWorld(true);const target=new T.Vector3(x,y,z),origin=target.clone().add(new T.Vector3(Math.sin(yaw),rise,Math.cos(yaw)));
 return new T.Raycaster(origin,target.clone().sub(origin).normalize()).intersectObject(root,true)[0]?.object;
}
afterEach(()=>{resources.forEach(r=>r.dispose());resources.length=0;});

describe('isolated sample young-adult head',()=>{
 it('fits the existing head bone envelope with a visibly slimmer face than the old round head',()=>{
  const head=makeHead(),bounds=new T.Box3().setFromObject(head),size=bounds.getSize(new T.Vector3());
  expect(head.name).toBe('npr-farmer-head-pivot');
  expect(size.y).toBeGreaterThan(.4);expect(size.y).toBeLessThan(.6);
  expect(bounds.min.y).toBeGreaterThan(.015);expect(bounds.max.y).toBeLessThan(.58);
  const face=head.getObjectByName('npr-farmer-head')!;
  const faceSize=new T.Box3().setFromObject(face).getSize(new T.Vector3());
  // A broad round face reads as a child/toy once attached to the adult garment.
  expect(faceSize.x/faceSize.y).toBeLessThan(.76);
  expect(size.x).toBeLessThan(.37);
 });

 it('has almond eye openings instead of round bead-like eyes',()=>{
  const head=makeHead(),whites=head.getObjectByName('npr-farmer-eye-whites') as T.Mesh;
  for(const sign of[-1,1]){
   const size=sideBounds(whites,sign).getSize(new T.Vector3());
   expect(size.x/size.y).toBeGreaterThan(2.6);
   expect(size.x).toBeGreaterThan(.057);
   expect(size.y).toBeGreaterThan(.017);
  }
 });

 it('uses a short young-adult lower face instead of a long pointed chin',()=>{
  const head=makeHead(),face=head.getObjectByName('npr-farmer-head')!;
  const eyeCenter=new T.Box3().setFromObject(head.getObjectByName('npr-farmer-eye-whites')!).getCenter(new T.Vector3());
  const mouthCenter=new T.Box3().setFromObject(head.getObjectByName('npr-farmer-mouth')!).getCenter(new T.Vector3());
  const chin=new T.Box3().setFromObject(face).min.y;
  expect((eyeCenter.y-mouthCenter.y)/(mouthCenter.y-chin)).toBeLessThan(1.4);
  // Keep a distinct jaw below the mouth rather than satisfying the proportion by eliminating it.
  expect(mouthCenter.y-chin).toBeGreaterThan(.075);
 });

 it('keeps each gaze and lower forehead visible through hair from frontal, quarter and raised views',()=>{
  const head=makeHead(),irises=head.getObjectByName('npr-farmer-eye-irises') as T.Mesh;
  for(const sign of[-1,1]){
   const center=sideBounds(irises,sign).getCenter(new T.Vector3());
   for(const yaw of[0,-.42,.42])for(const rise of[0,.14])expect(visible(head,center.x,center.y,rise,yaw,center.z)?.name).toMatch(/^npr-farmer-eye/);
  }
  // The video-inspired loose fringe reaches the old .335 forehead point. The visible lower forehead
  // still has an open gap above the brows, while the two gaze checks above remain unchanged.
  expect(visible(head,0,.310)?.name).toBe('npr-farmer-head');
 });

 it('places the mouth over the jaw rather than inside the face',()=>{
  const head=makeHead(),mouth=head.getObjectByName('npr-farmer-mouth')!;
  const bounds=new T.Box3().setFromObject(mouth);
  for(const x of[-.01,0,.01]){
   // A slight curved lip can leave the exact bounding-box center empty; sample its actual central span.
   const rays=Array.from({length:17},(_,i)=>visible(head,x,T.MathUtils.lerp(bounds.min.y,bounds.max.y,i/16))?.name);
   expect(rays).toContain('npr-farmer-mouth');
  }
 });

 it('keeps the upper hair silhouette continuous without detached side arcs',()=>{
  const head=makeHead();head.updateMatrixWorld(true);
  const hair=new T.Group();
  for(const mesh of parts(head).filter(mesh=>mesh.name.startsWith('npr-farmer-hair')))hair.add(mesh.clone());
  for(const yaw of[0,-.42])for(const y of[.405,.435,.465,.490]){
   hair.rotation.y=yaw;hair.updateMatrixWorld(true);
   const hits=Array.from({length:241},(_,i)=>new T.Raycaster(new T.Vector3(-.24+i*.002,y,1),new T.Vector3(0,0,-1)).intersectObject(hair,true).length>0);
   const first=hits.indexOf(true),last=hits.lastIndexOf(true);expect(first).toBeGreaterThan(-1);
   // A surface that curls out and returns to the scalp leaves an air gap inside the visible silhouette.
   expect(hits.slice(first,last+1).every(Boolean),`air gap at hair height ${y}, yaw ${yaw}`).toBe(true);
  }
 });

 it('breaks the combed cap outline with several staggered side tufts',()=>{
  const head=makeHead(),hair=new T.Group();
  for(const mesh of parts(head).filter(mesh=>mesh.name.startsWith('npr-farmer-hair')))hair.add(mesh.clone());
  hair.updateMatrixWorld(true);
  let lobes=0;
  for(const sign of[-1,1]){
   const edges=Array.from({length:39},(_,row)=>{
    const y=.290+row*.005;
    for(let step=0;step<121;step++){
     const x=sign*(.24-step*.0015);
     if(new T.Raycaster(new T.Vector3(x,y,1),new T.Vector3(0,0,-1)).intersectObject(hair,true).length)return Math.abs(x);
    }
    return 0;
   });
   let last=-5;
   for(let i=3;i<edges.length-3;i++)if(i-last>=4&&edges[i]-(edges[i-3]+edges[i+3])/2>.004){lobes++;last=i;}
  }
  expect(lobes).toBeGreaterThanOrEqual(3);
 });

 it('has separate short nape tips in the rear silhouette instead of a straight cap edge',()=>{
  const head=makeHead(),hair=new T.Group();
  for(const mesh of parts(head).filter(mesh=>mesh.name.startsWith('npr-farmer-hair')))hair.add(mesh.clone());
  hair.updateMatrixWorld(true);
  const edge=Array.from({length:53},(_,column)=>{
   const x=-.13+column*.005;
   for(let row=0;row<81;row++){
    const y=.17+row*.002;
    if(new T.Raycaster(new T.Vector3(x,y,-1),new T.Vector3(0,0,1)).intersectObject(hair,true).length)return y;
   }
   return .34;
  });
  let tips=0,last=-5;
  for(let i=4;i<edge.length-4;i++)if(i-last>=5&&(edge[i-4]+edge[i+4])/2-edge[i]>.008){tips++;last=i;}
  expect(tips).toBeGreaterThanOrEqual(3);
 });

 it('keeps the nose short and softly projected at portrait scale',()=>{
  const head=makeHead(),nose=head.getObjectByName('npr-farmer-nose')!;
  const size=new T.Box3().setFromObject(nose).getSize(new T.Vector3());
  expect(size.y).toBeLessThan(.06);expect(size.z).toBeLessThan(.04);
 });

 it('creates finite lit surfaces within a modest head draw and triangle budget',()=>{
  const head=makeHead(),meshes=parts(head);expect(meshes.length).toBeGreaterThan(5);expect(meshes.length).toBeLessThanOrEqual(20);
  let triangles=0;
  for(const mesh of meshes){
   const position=mesh.geometry.getAttribute('position'),normal=mesh.geometry.getAttribute('normal');
   expect(position.array.every(Number.isFinite)).toBe(true);expect(normal.array.every(Number.isFinite)).toBe(true);
   for(let i=0;i<normal.count;i++)expect(new T.Vector3().fromBufferAttribute(normal,i).length()).toBeGreaterThan(.5);
   expect(mesh.material).toBeInstanceOf(T.MeshToonMaterial);
   triangles+=(mesh.geometry.index?.count??position.count)/3;
  }
  expect(triangles).toBeLessThan(10000);
 });

 it('shares static geometry and lets the resource owner release every head surface once',()=>{
  const r=new WorldResources(),p=new NprPalette(r),first=createSampleHead(r,p),second=createSampleHead(r,p);
  resources.push(r);
  const a=parts(first),b=parts(second);
  expect(a.map(m=>m.geometry.uuid)).toEqual(b.map(m=>m.geometry.uuid));
  expect(a.map(m=>m.material)).toEqual(b.map(m=>m.material));
  const geometries=new Set(a.map(m=>m.geometry)),materials=new Set(a.flatMap(m=>Array.isArray(m.material)?m.material:[m.material]));
  let geometryDisposals=0,materialDisposals=0;
  geometries.forEach(g=>g.addEventListener('dispose',()=>geometryDisposals++));materials.forEach(m=>m.addEventListener('dispose',()=>materialDisposals++));
  r.dispose();r.dispose();
  expect(geometryDisposals).toBe(geometries.size);expect(materialDisposals).toBe(materials.size);
 });
});
