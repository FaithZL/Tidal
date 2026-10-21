import {expect,test} from 'vitest';
import * as T from 'three';
import {buildEnvironment} from '../../src/game/world/environment.js';
import {WorldResources} from '../../src/game/world/resources.js';

function meshes(root:T.Object3D):T.Mesh[]{
 const result:T.Mesh[]=[];root.traverse(object=>{if(object instanceof T.Mesh)result.push(object);});return result;
}
function release(root:T.Object3D,r:WorldResources):void{
 root.traverse(object=>{if(object instanceof T.InstancedMesh)object.dispose();});r.dispose();
}

// A map on the meadow costs texture sampling across most of the screen; a flat
// replacement loses the intended mottling. Verify cheap detail on the real mesh.
test('the full meadow keeps gentle deterministic vertex detail without texture sampling',()=>{
 const r=new WorldResources(),root=buildEnvironment(r),otherResources=new WorldResources(),other=buildEnvironment(otherResources);
 try{
  const meadow=meshes(root).find(mesh=>mesh.material instanceof T.MeshLambertMaterial&&mesh.material.color.getHex()===0xa7bd76);
  const repeated=meshes(other).find(mesh=>mesh.material instanceof T.MeshLambertMaterial&&mesh.material.color.getHex()===0xa7bd76);
  expect(meadow).toBeDefined();expect(repeated).toBeDefined();
  const material=meadow!.material as T.MeshLambertMaterial;
  expect(material.map).toBeNull();expect(material.vertexColors).toBe(true);expect(meadow!.receiveShadow).toBe(true);
  root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(meadow!);
  expect(bounds.min.x).toBeCloseTo(-37.5,5);expect(bounds.max.x).toBeCloseTo(67.5,5);
  expect(bounds.min.z).toBeCloseTo(-30.5,5);expect(bounds.max.z).toBeCloseTo(30.5,5);
  expect(bounds.min.y).toBeCloseTo(.025,5);expect(bounds.max.y).toBeCloseTo(.025,5);
  const colors=meadow!.geometry.getAttribute('color'),positions=meadow!.geometry.getAttribute('position');
  expect(colors).toBeDefined();expect(colors.count).toBe(positions.count);
  const shades=new Set<string>();
  for(let i=0;i<colors.count;i++){
   const values=[colors.getX(i),colors.getY(i),colors.getZ(i)];
   for(const value of values){expect(Number.isFinite(value)).toBe(true);expect(value).toBeGreaterThanOrEqual(.8);expect(value).toBeLessThanOrEqual(1);}
   shades.add(values.map(value=>value.toFixed(4)).join('/'));
   const worldPosition=new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(meadow!.matrixWorld);
   expect(worldPosition.y).toBeCloseTo(.025,5);
  }
  expect(shades.size).toBeGreaterThanOrEqual(32);
  expect((meadow!.geometry.index?.count??positions.count)/3).toBeLessThanOrEqual(672);
  expect(Array.from(colors.array)).toEqual(Array.from(repeated!.geometry.getAttribute('color').array));
 }finally{release(root,r);release(other,otherResources);}
});

// Replacing all crops with the same cone, or omitting per-plant tint, must fail:
// six flat color blocks cannot provide the approved varied planting appearance.
test('the real farm contains distinct crop silhouettes with deterministic varied plants',()=>{
 const r=new WorldResources(),root=buildEnvironment(r),otherResources=new WorldResources(),other=buildEnvironment(otherResources);
 try{
  const crops=meshes(root).filter((mesh):mesh is T.InstancedMesh=>mesh instanceof T.InstancedMesh&&mesh.count===72);
  const repeated=meshes(other).filter((mesh):mesh is T.InstancedMesh=>mesh instanceof T.InstancedMesh&&mesh.count===72);
  expect(crops).toHaveLength(6);
  expect(new Set(crops.map(crop=>crop.geometry.uuid)).size).toBeGreaterThanOrEqual(3);
  crops.forEach((crop,p)=>{
   expect(crop.instanceColor).not.toBeNull();
   const colors=new Set<string>(),scales=new Set<string>(),rotations=new Set<string>();
   for(let i=0;i<72;i++){
    const color=new T.Color(),matrix=new T.Matrix4(),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();
    crop.getColorAt(i,color);colors.add(color.getHexString());crop.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);
    scales.add(scale.toArray().map(value=>value.toFixed(3)).join('/'));rotations.add(rotation.toArray().map(value=>value.toFixed(3)).join('/'));
    const repeatedMatrix=new T.Matrix4(),repeatedColor=new T.Color();repeated[p].getMatrixAt(i,repeatedMatrix);repeated[p].getColorAt(i,repeatedColor);
    expect(matrix.elements).toEqual(repeatedMatrix.elements);expect(color.getHexString()).toBe(repeatedColor.getHexString());
   }
   expect(colors.size).toBeGreaterThanOrEqual(8);expect(scales.size).toBeGreaterThanOrEqual(8);expect(rotations.size).toBeGreaterThanOrEqual(8);
  });
 }finally{release(root,r);release(other,otherResources);}
});

// Removing the layered boughs reduces the forest to the old two-height cone.
test('the forest has layered tree silhouettes and individual tint variation',()=>{
 const r=new WorldResources(),root=buildEnvironment(r);
 try{
  const forest=meshes(root).find((mesh):mesh is T.InstancedMesh=>mesh instanceof T.InstancedMesh&&mesh.count===130);
  expect(forest).toBeDefined();const vertices=forest!.geometry.getAttribute('position');
  expect(new Set(Array.from({length:vertices.count},(_,i)=>vertices.getY(i).toFixed(3))).size).toBeGreaterThanOrEqual(5);
  expect(forest!.instanceColor).not.toBeNull();
  const colors=new Set<string>();for(let i=0;i<130;i++){const color=new T.Color();forest!.getColorAt(i,color);colors.add(color.getHexString());}
  expect(colors.size).toBeGreaterThanOrEqual(8);
 }finally{release(root,r);}
});

// Assert the rendered material at the homestead, rather than a texture helper:
// dropping the facade, roof or wood surface maps must be consumer-visible here.
test('the homestead renders local patterned roof, woodwork and stone foundation',()=>{
 const r=new WorldResources(),root=buildEnvironment(r);
 try{
  root.updateMatrixWorld(true);
  for(const [geometry,x,y,z] of[
   [r.box(1.2,2,.08,0x765331).geometry,43,1.25,-1.7],
   [r.box(5.65,.3,4.75,0xada17b).geometry,43,.15,-4],
  ] as const){
   let found:T.Mesh|undefined;
   for(const mesh of meshes(root)){
    if(mesh.geometry!==geometry)continue;
    for(let i=0;i<(mesh instanceof T.InstancedMesh?mesh.count:1);i++){
     const matrix=mesh.matrixWorld.clone();if(mesh instanceof T.InstancedMesh){const local=new T.Matrix4();mesh.getMatrixAt(i,local);matrix.multiply(local);}
     if(Math.abs(matrix.elements[12]-x)<.001&&Math.abs(matrix.elements[13]-y)<.001&&Math.abs(matrix.elements[14]-z)<.001)found=mesh;
    }
   }
   expect(found).toBeDefined();expect((found!.material as T.MeshLambertMaterial).map).toBeInstanceOf(T.DataTexture);
  }
  const roofs=meshes(root).filter(mesh=>mesh.geometry.type==='ExtrudeGeometry');
  expect(roofs).toHaveLength(3);expect(roofs.every(mesh=>(mesh.material as T.MeshLambertMaterial).map instanceof T.DataTexture)).toBe(true);
 }finally{release(root,r);}
});

// A straight path may remain walkable, but removing its verge detail must fail.
test('the long road has irregular grassy verges outside its clear walk surface',()=>{
 const r=new WorldResources(),root=buildEnvironment(r);
 try{
  root.updateMatrixWorld(true);const edgePositions:T.Vector3[]=[];
  for(const mesh of meshes(root)){
   if(!(mesh instanceof T.InstancedMesh)||mesh.count<20||mesh.count===72||mesh.count===130)continue;
   mesh.geometry.computeBoundingBox();const size=mesh.geometry.boundingBox!.getSize(new T.Vector3());if(size.y<.15||size.y>.7)continue;
   for(let i=0;i<mesh.count;i++){
    const matrix=new T.Matrix4();mesh.getMatrixAt(i,matrix);matrix.premultiply(mesh.matrixWorld);const position=new T.Vector3().setFromMatrixPosition(matrix);
    if(position.x>=-6&&position.x<=42&&Math.abs(position.z)>=1.2&&Math.abs(position.z)<=1.85)edgePositions.push(position);
   }
  }
  expect(edgePositions.length).toBeGreaterThanOrEqual(40);
  expect(new Set(edgePositions.map(position=>Math.abs(position.z).toFixed(2))).size).toBeGreaterThanOrEqual(8);
  expect(edgePositions.some(position=>position.z<0)).toBe(true);expect(edgePositions.some(position=>position.z>0)).toBe(true);
 }finally{release(root,r);}
});
