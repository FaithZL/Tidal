import {readFile} from 'node:fs/promises';
import {afterEach,describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {prepareUserModel,loadUserModel} from '../../src/game/world/userModel.js';

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
async function fixture(kind:'character'|'house'):Promise<T.Group>{
 // Texture decoding is exercised by the browser tests. CPU tests retain the real
 // FBX geometry, object transforms, materials, map references and UVs.
 vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation(()=>new T.Texture());
 vi.spyOn(console,'warn').mockImplementation(()=>{});
 const bytes=await readFile(new URL(`../../public/assets/user-models/${kind}.fbx`,import.meta.url));
 return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
}
describe('user-supplied static FBX model',()=>{
 for(const [kind,height,triangles] of [['character',2.05,4900],['house',5.4,4430]] as const){
  it(`grounds and uniformly scales the actual ${kind} without inventing skin or animation`,async()=>{
   const source=await fixture(kind),model=prepareUserModel(source,kind);
   try{
    const bounds=new T.Box3().setFromObject(model.root),size=bounds.getSize(new T.Vector3());
    expect(bounds.min.y).toBeCloseTo(0,5);expect(size.y).toBeCloseTo(height,5);
    expect(model.kind).toBe(kind);expect(model.motionSupport).toBe('static');
    let count=0;model.root.traverse(object=>{if(object instanceof T.Mesh){expect(object).not.toBeInstanceOf(T.SkinnedMesh);count+=(object.geometry.index?.count??object.geometry.getAttribute('position').count)/3;}});
    expect(count).toBe(triangles);expect(source.animations).toHaveLength(0);
    expect([size.x,size.y,size.z].every(Number.isFinite)).toBe(true);
    if(kind==='house'){expect(Math.max(size.x,size.z)).toBeLessThan(9);expect(bounds.getCenter(new T.Vector3()).x).toBeCloseTo(0,5);}
   }finally{model.dispose();}
  });
 }
 it('preserves original texture and UVs while removing imported specular glare',async()=>{
  const source=await fixture('character'),mesh=source.children.find(object=>object instanceof T.Mesh) as T.Mesh;
  const original=mesh.material as T.MeshPhongMaterial,map=original.map,normal=original.normalMap,uv=Array.from(mesh.geometry.getAttribute('uv').array),model=prepareUserModel(source,'character');
  try{
   const material=mesh.material as T.MeshToonMaterial;
   expect(material).toBeInstanceOf(T.MeshToonMaterial);expect(material.map).toBe(map);expect(material.normalMap).toBe(normal);
   expect(Array.from(mesh.geometry.getAttribute('uv').array)).toEqual(uv);expect(material).not.toBe(original);
   expect(mesh.castShadow).toBe(true);expect(mesh.receiveShadow).toBe(false);
  }finally{model.dispose();}
 });
 it('releases original materials at conversion and owned maps/geometry once at disposal',async()=>{
  const source=await fixture('house'),mesh=source.children.find(object=>object instanceof T.Mesh) as T.Mesh;
  const original=mesh.material as T.MeshPhongMaterial,sourceDispose=vi.fn(),geometryDispose=vi.fn(),mapDispose=vi.fn();
  original.addEventListener('dispose',sourceDispose);mesh.geometry.addEventListener('dispose',geometryDispose);original.map!.addEventListener('dispose',mapDispose);
  const model=prepareUserModel(source,'house'),toonDispose=vi.fn();(mesh.material as T.Material).addEventListener('dispose',toonDispose);
  expect(sourceDispose).toHaveBeenCalledTimes(1);model.dispose();model.dispose();
  expect(geometryDispose).toHaveBeenCalledTimes(1);expect(mapDispose).toHaveBeenCalledTimes(1);expect(toonDispose).toHaveBeenCalledTimes(1);expect(model.root.children).toHaveLength(0);
 });
 it('rejects empty or invalid geometry rather than reporting a usable imported model',()=>{
  expect(()=>prepareUserModel(new T.Group(),'character')).toThrow(/empty|geometry|bounds/i);
  const invalid=new T.Group(),mesh=new T.Mesh(new T.BufferGeometry(),new T.MeshPhongMaterial());invalid.add(mesh);
  expect(()=>prepareUserModel(invalid,'house')).toThrow(/empty|geometry|bounds/i);
 });
 it('cleans up invalid imported geometry and materials when validation rejects it',()=>{
  vi.spyOn(console,'error').mockImplementation(()=>{});
  const source=new T.Group(),geometry=new T.BufferGeometry(),material=new T.MeshPhongMaterial(),disposed=vi.fn(),materialDisposed=vi.fn();
  geometry.setAttribute('position',new T.Float32BufferAttribute([NaN,0,0,0,1,0,1,0,0],3));source.add(new T.Mesh(geometry,material));
  geometry.addEventListener('dispose',disposed);material.addEventListener('dispose',materialDisposed);
  expect(()=>prepareUserModel(source,'character')).toThrow(/geometry|bounds/i);
  expect(disposed).toHaveBeenCalledTimes(1);expect(materialDisposed).toHaveBeenCalledTimes(1);
 });
 it('identifies a failed character request or malformed FBX as character rather than house failure',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('network failed')));
  await expect(loadUserModel('character','/tidal/')).rejects.toThrow('用户人物模型加载失败');
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('not an FBX',{status:200})));
  await expect(loadUserModel('character','/tidal/')).rejects.toThrow('用户人物模型加载失败');
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,arrayBuffer:()=>Promise.reject(new Error('body stream interrupted'))}));
  await expect(loadUserModel('character','/tidal/')).rejects.toThrow('用户人物模型加载失败');
 });
});
