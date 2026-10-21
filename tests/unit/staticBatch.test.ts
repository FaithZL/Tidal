import {expect,test} from 'vitest';
import * as T from 'three';
import {buildEnvironment} from '../../src/game/world/environment.js';
import {WorldResources} from '../../src/game/world/resources.js';
import {batchStaticMeshes} from '../../src/game/world/staticBatch.js';

function meshes(root:T.Object3D):T.Mesh[]{
 const result:T.Mesh[]=[];
 root.traverse(object=>{if(object instanceof T.Mesh)result.push(object);});
 return result;
}
function triangles(root:T.Object3D):number{
 return meshes(root).reduce((sum,mesh)=>sum+(mesh.geometry.index?.count??mesh.geometry.getAttribute('position').count)/3*(mesh instanceof T.InstancedMesh?mesh.count:1),0);
}
function expanded(root:T.Object3D):{mesh:T.Mesh;matrix:T.Matrix4}[]{
 root.updateMatrixWorld(true);
 return meshes(root).flatMap(mesh=>{
  if(!(mesh instanceof T.InstancedMesh))return[{mesh,matrix:mesh.matrixWorld.clone()}];
  return Array.from({length:mesh.count},(_,index)=>{
   const local=new T.Matrix4();mesh.getMatrixAt(index,local);
   return{mesh,matrix:new T.Matrix4().multiplyMatrices(mesh.matrixWorld,local)};
  });
 });
}
function expectMatrix(actual:T.Matrix4,expected:T.Matrix4):void{
 actual.elements.forEach((value,index)=>expect(value).toBeCloseTo(expected.elements[index],4));
}
function release(root:T.Object3D,r:WorldResources):void{
 root.traverse(object=>{if(object instanceof T.InstancedMesh)object.dispose();});r.dispose();
}

// The polished environment may change silhouettes, but must retain the farm's
// population and spatial extent within finite geometry and submission budgets.
test('the complete farm keeps its planted plots and forest within finite rendering budgets',()=>{
 const r=new WorldResources(),root=buildEnvironment(r);
 try{
  const drawables=meshes(root);
  expect(triangles(root)).toBeLessThanOrEqual(42000);
  expect(expanded(root).length).toBeGreaterThanOrEqual(1031);
  const originalInstances=drawables.filter((mesh):mesh is T.InstancedMesh=>mesh instanceof T.InstancedMesh&&(mesh.count===72||mesh.count===130));
  expect(originalInstances.map(mesh=>mesh.count).sort((a,b)=>a-b)).toEqual([72,72,72,72,72,72,130]);
  expect(drawables.length).toBeLessThanOrEqual(150);
  const items=expanded(root);
  for(const [w,d,x,z] of[[5.4,4.5,43,-4],[5,4,1,-13],[4,3.5,20,-14]]){
   const foundation=items.find(item=>item.mesh.geometry===r.box(w+.25,.3,d+.25,0xada17b).geometry);
   expect(foundation).toBeDefined();expectMatrix(foundation!.matrix,new T.Matrix4().makeTranslation(x,.15,z));
  }
  expect(items.filter(item=>item.mesh.geometry===r.cylinder(.12,.2,1.45,0x8e6843,7).geometry)).toHaveLength(12);
  expect(items.filter(item=>item.mesh.geometry===r.cylinder(.6,.6,1.15,0xcdb568,12).geometry)).toHaveLength(18);
  expect(items.some(item=>item.mesh.geometry===r.cylinder(1,1,.055,0x7db6bc,48).geometry&&item.matrix.elements[12]===35)).toBe(true);
  expect(items.some(item=>item.mesh.geometry===r.cylinder(.5,.9,4.2,0xe1d2b0,8).geometry&&item.matrix.elements[12]===28)).toBe(true);
  expect(items.some(item=>item.mesh.geometry===r.box(48,.045,2.35,0xd9c895,'path').geometry&&item.matrix.elements[12]===18)).toBe(true);
 }finally{release(root,r);}
});

test('batching preserves the farm fence and nested house transforms, materials and shadows',()=>{
 const r=new WorldResources(),root=buildEnvironment(r);
 try{
  const items=expanded(root),railGeometry=r.box(2.7,.085,.08,0xe4d09c).geometry;
  const rails=items.filter(item=>item.mesh.geometry===railGeometry);
  expect(rails).toHaveLength(96);
  for(const position of[[-12.68,.38,-20],[-12.68,.78,19],[48.27,.38,-20],[48.27,.78,19]]){
   const rail=rails.find(item=>item.matrix.elements[12]>position[0]-.0001&&item.matrix.elements[12]<position[0]+.0001&&Math.abs(item.matrix.elements[13]-position[1])<.0001&&Math.abs(item.matrix.elements[14]-position[2])<.0001);
   expect(rail).toBeDefined();
   expect(rail!.mesh.material).toBe(r.material(0xe4d09c,'wood'));
   expect(rail!.mesh.castShadow).toBe(false);expect(rail!.mesh.receiveShadow).toBe(true);
   expectMatrix(rail!.matrix,new T.Matrix4().makeTranslation(position[0],position[1],position[2]));
  }
  const foundationGeometry=r.box(5.65,.3,4.75,0xada17b).geometry;
  const foundation=items.find(item=>item.mesh.geometry===foundationGeometry);
  expect(foundation).toBeDefined();
  expectMatrix(foundation!.matrix,new T.Matrix4().makeTranslation(43,.15,-4));
  expect(foundation!.mesh.material).toBe(r.material(0xada17b,'stone'));
  expect(foundation!.mesh.castShadow).toBe(true);expect(foundation!.mesh.receiveShadow).toBe(true);
 }finally{release(root,r);}
});

test('planted crops and forest remain inside their original regions after batching',()=>{
 const r=new WorldResources(),root=buildEnvironment(r);
 try{
  root.updateMatrixWorld(true);
  const crops=meshes(root).filter((mesh):mesh is T.InstancedMesh=>mesh instanceof T.InstancedMesh&&mesh.count===72);
  const forest=meshes(root).find((mesh):mesh is T.InstancedMesh=>mesh instanceof T.InstancedMesh&&mesh.count===130);
  expect(crops).toHaveLength(6);expect(forest).toBeDefined();
  const matrix=new T.Matrix4();
  crops.forEach((crop,p)=>{
   for(let i=0;i<72;i++){
    crop.getMatrixAt(i,matrix);
    expect(matrix.elements[12]).toBeGreaterThanOrEqual(6+(p%3)*7.2);
    expect(matrix.elements[12]).toBeLessThanOrEqual(12+(p%3)*7.2);
    expect(matrix.elements[14]).toBeGreaterThanOrEqual(3.15+Math.floor(p/3)*7);
    expect(matrix.elements[14]).toBeLessThanOrEqual(8.45+Math.floor(p/3)*7);
   }
   expect(crop.receiveShadow).toBe(true);expect(crop.castShadow).toBe(false);
  });
  for(let i=0;i<130;i++){
   forest!.getMatrixAt(i,matrix);
   expect(matrix.elements[12]).toBeGreaterThanOrEqual(-26);expect(matrix.elements[12]).toBeLessThanOrEqual(58);
   expect(Math.abs(matrix.elements[14])).toBeGreaterThanOrEqual(21);expect(Math.abs(matrix.elements[14])).toBeLessThanOrEqual(31);
  }
  expect(forest!.receiveShadow).toBe(false);expect(forest!.castShadow).toBe(false);
 }finally{release(root,r);}
});

test('static batching preserves transformed scenery and keeps material, shadow and hidden boundaries',()=>{
 const r=new WorldResources(),root=new T.Group();root.position.set(3,2,-1);root.rotation.y=.6;
 const nested=new T.Group();nested.position.set(1,3,5);nested.rotation.z=.4;root.add(nested);
 const a=r.box(1,2,3,0xff0000);a.position.set(4,1,-2);a.scale.set(2,.5,1);a.castShadow=true;nested.add(a);
 const b=r.box(1,2,3,0xff0000);b.position.set(3,2,1);b.rotation.y=.8;b.castShadow=true;root.add(b);
 const blue=r.box(1,2,3,0x0000ff);blue.castShadow=true;root.add(blue);
 const noCast=r.box(1,2,3,0xff0000);root.add(noCast);
 const noReceive=r.box(1,2,3,0xff0000);noReceive.castShadow=true;noReceive.receiveShadow=false;root.add(noReceive);
 const hidden=new T.Group();hidden.visible=false;hidden.add(r.box(1,2,3,0xff0000),r.box(1,2,3,0xff0000));root.add(hidden);
 const existing=new T.InstancedMesh(a.geometry,a.material,2);existing.setMatrixAt(0,new T.Matrix4().makeTranslation(9,4,1));existing.setMatrixAt(1,new T.Matrix4().makeTranslation(2,6,-4));root.add(existing);
 const describe=()=>expanded(root).map(({mesh,matrix})=>JSON.stringify({
  geometry:mesh.geometry.uuid,material:Array.isArray(mesh.material)?mesh.material.map(material=>material.uuid):mesh.material.uuid,
  cast:mesh.castShadow,receive:mesh.receiveShadow,matrix:matrix.elements.map(value=>Math.round(value*10000)/10000)
 })).sort();
 try{
  const before=describe();batchStaticMeshes(root);
  expect(describe()).toEqual(before);
  const created=meshes(root).filter(mesh=>mesh instanceof T.InstancedMesh&&mesh!==existing);
  expect(created).toHaveLength(1);expect((created[0] as T.InstancedMesh).count).toBe(2);
  expect(created[0].material).toBe(a.material);expect(created[0].geometry).toBe(a.geometry);
  expect(meshes(root)).toContain(existing);expect(blue.parent).toBe(root);expect(noCast.parent).toBe(root);expect(noReceive.parent).toBe(root);
  expect(hidden.children).toHaveLength(2);expect(a.parent).toBeNull();expect(b.parent).toBeNull();
 }finally{release(root,r);}
});

test('nearby scenery shares root-local spatial batches while distant scenery is frustum culled',()=>{
 const r=new WorldResources(),root=new T.Group();root.position.set(15.5,0,0);
 for(const x of[.1,.9,32.1,32.9]){
  const stone=r.sphere(.2,0xaaaaaa);stone.position.set(x,0,1);root.add(stone);
 }
 try{
  batchStaticMeshes(root);root.updateMatrixWorld(true);
  const camera=new T.OrthographicCamera(-3,3,3,-3,.1,40);camera.position.set(16,3,10);camera.lookAt(16,0,1);camera.updateMatrixWorld(true);
  const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  const submitted=meshes(root).filter(mesh=>frustum.intersectsObject(mesh)).reduce((count,mesh)=>count+(mesh instanceof T.InstancedMesh?mesh.count:1),0);
  // Seeing one end of a long repeated row must not submit its invisible far end.
  expect(submitted).toBe(2);
  const batches=meshes(root).filter((mesh):mesh is T.InstancedMesh=>mesh instanceof T.InstancedMesh);
  expect(batches).toHaveLength(2);expect(batches.map(mesh=>mesh.count)).toEqual([2,2]);
  expect(batches.every(mesh=>mesh.boundingSphere!==null&&mesh.boundingSphere.radius<1)).toBe(true);
 }finally{release(root,r);}
});
