import {expect,test} from 'vitest';
import * as T from 'three';
import {buildNprSampleEnvironment} from '../../src/game/world/nprEnvironment.js';
import {NprPalette} from '../../src/game/world/nprMaterials.js';
import {WorldResources} from '../../src/game/world/resources.js';

function sample(){const resources=new WorldResources(),root=buildNprSampleEnvironment(resources,new NprPalette(resources));root.updateMatrixWorld(true);return{resources,root};}
function instances(root:T.Group,names:readonly string[]):T.InstancedMesh[]{return names.map(name=>{const object=root.getObjectByName(name);expect(object,`${name} must be real instanced scenery`).toBeInstanceOf(T.InstancedMesh);return object as T.InstancedMesh;});}
function positions(mesh:T.InstancedMesh):T.Vector3[]{return Array.from({length:mesh.count},(_,i)=>{const matrix=new T.Matrix4();mesh.getMatrixAt(i,matrix);return new T.Vector3().setFromMatrixPosition(matrix.premultiply(mesh.matrixWorld));});}
function release(root:T.Group,resources:WorldResources){root.traverse(object=>{if(object instanceof T.InstancedMesh)object.dispose();});resources.dispose();}

test('composed meadow clumps populate the tree floor and foreground in irregular patches, with warm dry stems',()=>{
 const {root,resources}=sample();
 try{
  const grass=instances(root,['sample-meadow-grass','sample-dry-verge-grass']),points=grass.flatMap(positions);
  expect(points.length).toBeGreaterThanOrEqual(360);expect(points.length).toBeLessThanOrEqual(430);
  expect(points.filter(point=>point.z>1.5).length).toBeGreaterThan(95);
  expect(points.filter(point=>point.z< -2.5&&point.z> -8).length).toBeGreaterThan(100);
  expect(points.filter(point=>point.z< -10).length).toBeGreaterThan(55);
  expect(points.filter(point=>point.x< -6.5).length).toBeGreaterThan(90);
  expect(points.filter(point=>point.x>3).length).toBeGreaterThan(80);
  // Density varies across metre-scale cells instead of filling a regular lawn grid.
  const cells=new Map<string,number>();for(const point of points){const key=`${Math.floor(point.x/2)}/${Math.floor(point.z/2)}`;cells.set(key,(cells.get(key)??0)+1);}
  expect(Math.max(...cells.values())).toBeGreaterThan(14);expect(cells.size).toBeLessThan(70);
  expect(grass[0].geometry).toBe(grass[1].geometry);expect(grass[1].count).toBeGreaterThan(35);
  expect(grass.every(mesh=>mesh.instanceColor!==null)).toBe(true);
  const warm=new T.Color();grass[1].getColorAt(0,warm);expect(warm.r).toBeGreaterThan(warm.g);expect(warm.g).toBeGreaterThan(warm.b);
 }finally{release(root,resources);}
});

test('grass uses tapering bent ribbon surfaces and the work corner includes low leaves, daisies and rounded stones',()=>{
 const {root,resources}=sample();
 try{
  const [grass,leaves,flowers,stones]=instances(root,['sample-meadow-grass','sample-meadow-herbs','sample-meadow-daisies','sample-meadow-stones']);
  const geometry=grass.geometry,vertices=geometry.getAttribute('position');
  expect(geometry.getAttribute('color')).toBeDefined();expect(geometry.getAttribute('normal')).toBeDefined();
  // More than one bend per clump, broad lower ribbons and narrowing terminal points.
  expect(new Set(Array.from({length:vertices.count},(_,i)=>vertices.getY(i).toFixed(4))).size).toBeGreaterThanOrEqual(7);
  geometry.computeBoundingBox();expect(geometry.boundingBox!.getSize(new T.Vector3()).y).toBeGreaterThan(.28);
  expect((geometry.index?.count??vertices.count)/3).toBeGreaterThanOrEqual(24);
  const vertex=(i:number)=>new T.Vector3().fromBufferAttribute(vertices,i),base=vertex(0).add(vertex(1)).multiplyScalar(.5),body=vertex(2).add(vertex(7)).multiplyScalar(.5),tip=vertex(26);
  const upperWidth=vertex(14).distanceTo(vertex(19)),bodyWidth=vertex(2).distanceTo(vertex(7));
  expect(upperWidth).toBeLessThan(bodyWidth*.8);
  // A straight spike would follow the root-to-tip line at this height.
  const straight=base.clone().lerp(tip,(body.y-base.y)/(tip.y-base.y));body.y=straight.y;expect(body.distanceTo(straight)).toBeGreaterThan(.03);
  const levels=new Map<string,T.Vector3[]>();for(let i=0;i<vertices.count;i++){const key=vertices.getY(i).toFixed(4);levels.set(key,[...(levels.get(key)??[]),new T.Vector3().fromBufferAttribute(vertices,i)]);}
  expect([...levels.values()].some(points=>points.length>=4&&new T.Box3().setFromPoints(points).getSize(new T.Vector3()).length()>.1)).toBe(true);
  expect(leaves.count).toBeGreaterThanOrEqual(28);expect(flowers.count).toBeGreaterThanOrEqual(10);expect(stones.count).toBeGreaterThanOrEqual(12);
  leaves.geometry.computeBoundingBox();const leafSize=leaves.geometry.boundingBox!.getSize(new T.Vector3());expect(leafSize.x).toBeGreaterThan(leafSize.y*1.5);
  for(const mesh of[grass,leaves,flowers,stones]){expect(mesh.castShadow).toBe(false);expect(mesh.receiveShadow).toBe(true);expect(mesh.material).toBeInstanceOf(T.MeshToonMaterial);}
 }finally{release(root,resources);}
});

test('individual meadow blades stay slender relative to their curved height',()=>{
 const {root,resources}=sample();
 try{
  const [grass]=instances(root,['sample-meadow-grass']),vertices=grass.geometry.getAttribute('position');
  const vertex=(i:number)=>new T.Vector3().fromBufferAttribute(vertices,i),bodyWidth=vertex(2).distanceTo(vertex(7)),height=vertex(26).y;
  expect(height).toBeCloseTo(.34,5);expect(height/bodyWidth).toBeGreaterThan(5.7);
 }finally{release(root,resources);}
});

test('daisy heads and low herbs remain small accents at their actual ground scale',()=>{
 const {root,resources}=sample();
 try{
  const [flowers,herbs]=instances(root,['sample-meadow-daisies','sample-meadow-herbs']);
  for(const [mesh,centerX,centerZ,limit] of[[flowers,.04,.025,.125],[herbs,0,0,.29]] as const){
   const vertices=mesh.geometry.getAttribute('position');let radius=0;
   for(let i=0;i<vertices.count;i++)radius=Math.max(radius,Math.hypot(vertices.getX(i)-centerX,vertices.getZ(i)-centerZ));
   for(let i=0;i<mesh.count;i++){const matrix=new T.Matrix4();mesh.getMatrixAt(i,matrix);const worldRadius=radius*matrix.getMaxScaleOnAxis();expect(worldRadius).toBeLessThan(limit);expect(worldRadius).toBeGreaterThan(.045);}
  }
 }finally{release(root,resources);}
});

test('plants preserve the road, cottage walk and all three chopping footholds with bounded actual scenery cost',()=>{
 const {root,resources}=sample();
 try{
  const plants=instances(root,['sample-meadow-grass','sample-dry-verge-grass','sample-meadow-herbs','sample-meadow-daisies','sample-meadow-stones']);
  const clearRoad=new T.Box3(new T.Vector3(-6,.08,-1.175),new T.Vector3(10,2.5,1.175));
  const doorWalk=new T.Box3(new T.Vector3(.4,.08,-8.8),new T.Vector3(1.6,1,-1.175));
  const footholds=[[-4.75,1.35],[-7.75,-2.65],[-2.75,-5.65]];
  for(const mesh of plants){mesh.geometry.computeBoundingBox();for(let i=0;i<mesh.count;i++){
   const matrix=new T.Matrix4();mesh.getMatrixAt(i,matrix);matrix.premultiply(mesh.matrixWorld);const box=mesh.geometry.boundingBox!.clone().applyMatrix4(matrix),point=new T.Vector3().setFromMatrixPosition(matrix);
   expect(box.intersectsBox(clearRoad)).toBe(false);expect(box.intersectsBox(doorWalk)).toBe(false);
   for(const [x,z] of footholds)expect(Math.hypot(point.x-x,point.z-z)).toBeGreaterThan(.75);
  }}
  let drawables=0,triangles=0;root.traverse(object=>{if(object instanceof T.Mesh){drawables++;triangles+=(object.geometry.index?.count??object.geometry.getAttribute('position').count)/3*(object instanceof T.InstancedMesh?object.count:1);}});
  expect(drawables).toBeLessThan(50);expect(triangles).toBeLessThan(18000);
  const bounds=new T.Box3().setFromObject(root);expect(bounds.min.x).toBeGreaterThanOrEqual(-12);expect(bounds.max.x).toBeLessThanOrEqual(10);expect(bounds.min.z).toBeGreaterThanOrEqual(-20);expect(bounds.max.z).toBeLessThanOrEqual(4);
 }finally{release(root,resources);}
});

test('plant roots follow the actual sloped banks instead of sinking below or hiding inside them',()=>{
 const {root,resources}=sample();
 try{
  const banks=['sample-grass-bank-west','sample-grass-bank-back'].map(name=>root.getObjectByName(name)!);
  const ray=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0)),belowSlope:string[]=[],fullyBuried:string[]=[];
  let elevatedPlants=0,levelPlants=0;
  for(const mesh of instances(root,['sample-meadow-grass','sample-dry-verge-grass','sample-meadow-herbs','sample-meadow-daisies','sample-meadow-stones'])){
   mesh.geometry.computeBoundingBox();
   for(let i=0;i<mesh.count;i++){
    const matrix=new T.Matrix4();mesh.getMatrixAt(i,matrix);matrix.premultiply(mesh.matrixWorld);const point=new T.Vector3().setFromMatrixPosition(matrix);
    ray.ray.origin.set(point.x,4,point.z);const hit=ray.intersectObjects(banks,false)[0],surface=Math.max(.034,hit?.point.y??.034);
    expect(point.y).toBeLessThanOrEqual(surface+.003);
    if(surface>.064){
     elevatedPlants++;if(point.y<surface-.003)belowSlope.push(`${mesh.name}[${i}]: root=${point.y.toFixed(4)}, bank=${surface.toFixed(4)}`);
     if(mesh.geometry.boundingBox!.clone().applyMatrix4(matrix).max.y<surface)fullyBuried.push(`${mesh.name}[${i}]`);
    }else if(!hit){levelPlants++;expect(point.y).toBeCloseTo(.034,5);}
   }
  }
  expect(elevatedPlants).toBeGreaterThan(20);expect(levelPlants).toBeGreaterThan(200);
  expect(fullyBuried).toEqual([]);expect(belowSlope).toEqual([]);
 }finally{release(root,resources);}
});

test('meadow blending retains fully transparent outer vertices with metre-scale cool and warm transitions',()=>{
 const {root,resources}=sample();
 try{
  const meadow=root.getObjectByName('sample-painted-meadow') as T.Mesh<T.BufferGeometry,T.MeshToonMaterial>,position=meadow.geometry.getAttribute('position'),colors=meadow.geometry.getAttribute('color');
  expect(meadow.position.y).toBe(.032);expect(colors.itemSize).toBe(4);expect(meadow.material.transparent).toBe(true);expect(meadow.material.depthWrite).toBe(false);
  const luminance:number[]=[];for(let i=0;i<position.count;i++){
   if(Math.abs(position.getX(i))>=10.99||Math.abs(position.getZ(i))>=11.99)expect(colors.getW(i)).toBe(0);
   if(colors.getW(i)>.95)luminance.push(colors.getX(i)*meadow.material.color.r+colors.getY(i)*meadow.material.color.g+colors.getZ(i)*meadow.material.color.b);
  }
  expect(Math.max(...luminance)-Math.min(...luminance)).toBeGreaterThan(.32);
 }finally{release(root,resources);}
});
