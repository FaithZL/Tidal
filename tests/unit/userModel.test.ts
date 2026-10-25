import {readFile} from 'node:fs/promises';
import {afterEach,describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {prepareUserModel,loadUserModel} from '../../src/game/world/userModel.js';

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
async function fixture(kind:'character'|'house'|'castle'):Promise<T.Group>{
 // Texture decoding is exercised by the browser tests. CPU tests retain the real
 // FBX geometry, object transforms, materials, map references and UVs.
 vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation(()=>new T.Texture());
 vi.spyOn(console,'warn').mockImplementation(()=>{});
 const bytes=await readFile(new URL(`../../public/assets/user-models/${kind}.fbx`,import.meta.url));
 return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
}
function deferred<Value>(){
 let resolve!:(value:Value)=>void;
 const promise=new Promise<Value>(yes=>{resolve=yes;});return {promise,resolve};
}
async function castleResponse(){
 const bytes=await readFile(new URL('../../public/assets/user-models/castle.fbx',import.meta.url));
 return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
}
describe('user-supplied static FBX model',()=>{
 for(const [kind,height,triangles] of [['character',2.05,4900],['house',5.4,4430],['castle',12,60000]] as const){
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
 it('preserves the textureless castle grey material and keeps its source geometry intact',async()=>{
  const source=await fixture('castle'),mesh=source.children.find(object=>object instanceof T.Mesh) as T.Mesh;
  const original=(mesh.material as T.MeshPhongMaterial).color.clone(),vertices=Array.from(mesh.geometry.getAttribute('position').array);
  const model=prepareUserModel(source,'castle');
  try{expect((mesh.material as T.MeshToonMaterial).color.equals(original)).toBe(true);expect((mesh.material as T.MeshToonMaterial).map).toBeNull();expect(mesh.castShadow).toBe(false);expect(Array.from(mesh.geometry.getAttribute('position').array)).toEqual(vertices);}finally{model.dispose();}
 });
 it('uses a white castle base for its supplied color map without changing source UVs',async()=>{
  const source=await fixture('castle'),mesh=source.children.find(object=>object instanceof T.Mesh) as T.Mesh;
  const original=mesh.material as T.MeshPhongMaterial,map=new T.Texture(),uv=Array.from(mesh.geometry.getAttribute('uv').array);original.map=map;
  const model=prepareUserModel(source,'castle');
  try{const styled=mesh.material as T.MeshToonMaterial;expect(styled.color.getHex()).toBe(0xffffff);expect(styled.map).toBe(map);expect(Array.from(mesh.geometry.getAttribute('uv').array)).toEqual(uv);}finally{model.dispose();}
 });
 it('waits for the local castle color response and complete image decoding, then owns the map once',async()=>{
  const fbx=await castleResponse(),body=deferred<Response>(),decoded=deferred<void>(),image={decode:()=>decoded.promise,close:vi.fn()},texture=new T.Texture(image),disposed=vi.fn();texture.addEventListener('dispose',disposed);
  vi.stubGlobal('fetch',vi.fn((url:string)=>url==='/tidal/assets/user-models/castle.fbx'?Promise.resolve(fbx):url==='/tidal/assets/user-models/castle-soft-toon-v1.png'?body.promise:Promise.reject(new Error('unexpected URL'))));
  vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:castle-color');const revoke=vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});
  vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation((_url,onLoad)=>{queueMicrotask(()=>onLoad?.(texture));return texture;});
  let ready=false;const loading=loadUserModel('castle','/tidal/').then(model=>{ready=true;return model;});
  await new Promise(resolve=>setTimeout(resolve,0));expect(ready).toBe(false);
  body.resolve(new Response('unit color fixture',{status:200}));await new Promise(resolve=>setTimeout(resolve,0));expect(ready).toBe(false);
  decoded.resolve();const model=await loading;
  try{let map:T.Texture|null=null;model.root.traverse(object=>{if(object instanceof T.Mesh)map=(object.material as T.MeshToonMaterial).map;});expect(map).toBe(texture);expect(texture.colorSpace).toBe(T.SRGBColorSpace);expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:castle-color');}finally{model.dispose();model.dispose();}
  expect(disposed).toHaveBeenCalledTimes(1);expect(image.close).toHaveBeenCalledTimes(1);
 });
 it('rejects a missing castle color image instead of returning the grey fallback',async()=>{
  const fbx=await castleResponse();vi.stubGlobal('fetch',vi.fn((url:string)=>Promise.resolve(url.endsWith('/castle.fbx')?fbx:new Response('missing',{status:404}))));
  await expect(loadUserModel('castle','/').then(model=>{model.dispose();return model;})).rejects.toThrow('用户城堡模型加载失败');
 });
 it('releases a castle image and its object URL when full decoding fails',async()=>{
  const fbx=await castleResponse(),image={decode:()=>Promise.reject(new Error('invalid PNG')),close:vi.fn()},texture=new T.Texture(image),disposed=vi.fn();texture.addEventListener('dispose',disposed);
  vi.stubGlobal('fetch',vi.fn((url:string)=>Promise.resolve(url.endsWith('/castle.fbx')?fbx:new Response('unit color fixture',{status:200}))));
  vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:bad-castle-color');const revoke=vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});
  vi.spyOn(T.TextureLoader.prototype,'load').mockImplementation((_url,onLoad)=>{queueMicrotask(()=>onLoad?.(texture));return texture;});
  await expect(loadUserModel('castle','/').then(model=>{model.dispose();return model;})).rejects.toThrow('用户城堡模型加载失败');
  expect(disposed).toHaveBeenCalledTimes(1);expect(image.close).toHaveBeenCalledTimes(1);expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:bad-castle-color');
 });
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
