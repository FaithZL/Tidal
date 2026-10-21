import {expect,test,vi} from 'vitest';
import * as T from 'three';
import {WorldResources} from '../../src/game/world/resources.js';

// Removing surface maps must fail through the real consumer material, not an asset label.
test('wood and endgrain are shared local textures with visible nonuniform surface detail',()=>{
 const r=new WorldResources();
 try{
  const wood=r.material(0x9a683c,'wood'),cut=r.material(0x9a683c,'endgrain');
  expect(wood.map).toBeInstanceOf(T.DataTexture);expect(cut.map).toBeInstanceOf(T.DataTexture);
  expect(r.material(0x9a683c,'wood')).toBe(wood);expect(wood).not.toBe(cut);
  expect(r.material(0xc9a363,'wood').map).toBe(wood.map);
  const pixels=wood.map!.image.data as Uint8Array;
  expect(new Set(pixels.filter((_,index)=>index%4===0)).size).toBeGreaterThan(20);
  expect(Array.from(pixels.filter((_,index)=>index%4===3)).every(alpha=>alpha===255)).toBe(true);
  expect(wood.map!.image.width).toBeLessThanOrEqual(128);expect(wood.map!.colorSpace).toBe(T.SRGBColorSpace);
  expect(r.material(0x9a683c).map).toBeNull();
 }finally{r.dispose();}
});

test('new textured resources release each shared texture once and can be recreated after disposal',()=>{
 const r=new WorldResources();const wood=r.material(0x9a683c,'wood'),other=r.material(0x876543,'wood');
 expect(wood.map).not.toBeNull();const map=wood.map!,textureDispose=vi.fn(),materialDispose=vi.fn();
 map.addEventListener('dispose',textureDispose);wood.addEventListener('dispose',materialDispose);
 expect(other.map).toBe(map);r.dispose();r.dispose();
 expect(textureDispose).toHaveBeenCalledTimes(1);expect(materialDispose).toHaveBeenCalledTimes(1);
 const fresh=r.material(0x9a683c,'wood');expect(fresh).not.toBe(wood);expect(fresh.map).not.toBe(map);r.dispose();
});

test('rounded hero geometry preserves dimensions, finite normals and a small triangle budget',()=>{
 const r=new WorldResources();
 try{
  const head=r.roundedBox(.46,.44,.4,.075,0xeac093),same=r.roundedBox(.46,.44,.4,.075,0xffffff);
  expect(same.geometry).toBe(head.geometry);head.geometry.computeBoundingBox();
  const size=head.geometry.boundingBox!.getSize(new T.Vector3());
  expect(size.x).toBeCloseTo(.46);expect(size.y).toBeCloseTo(.44);expect(size.z).toBeCloseTo(.4);
  const normals=head.geometry.getAttribute('normal');
  expect(Array.from(normals.array).every(Number.isFinite)).toBe(true);
  expect(Array.from(normals.array).some(value=>Math.abs(value)>.1&&Math.abs(value)<.9)).toBe(true);
  expect(head.geometry.getAttribute('position').count/3).toBeLessThanOrEqual(108);
 }finally{r.dispose();}
});

test('long paths tile dirt at world scale instead of stretching one patch across the entire route',()=>{
 const r=new WorldResources();
 try{
  const road=r.box(48,.045,2.35,0xd9c895,'path'),cross=r.box(3,.045,27,0xd6c18b,'path');
  const range=(mesh:T.Mesh,start:number,axis:'X'|'Y')=>{
   const uv=mesh.geometry.getAttribute('uv');return Math.max(...Array.from({length:4},(_,i)=>axis==='X'?uv.getX(start+i):uv.getY(start+i)));
  };
  // Box top is vertices8..11; a two-world-unit tile repeats24 times along48 units.
  expect(range(road,8,'X')).toBeCloseTo(24);expect(range(road,8,'Y')).toBeCloseTo(1.175);
  expect(range(cross,8,'X')).toBeCloseTo(1.5);expect(range(cross,8,'Y')).toBeCloseTo(13.5);
  expect((road.material as T.MeshLambertMaterial).map).toBe((cross.material as T.MeshLambertMaterial).map);
  expect(r.box(48,.045,2.35,0xd9c895).geometry).not.toBe(road.geometry);
 }finally{r.dispose();}
});

test('vertex-painted ground cannot alter the shared plain material used by unpainted objects',()=>{
 const r=new WorldResources();
 try{
  const painted=r.material(0xa7bd76,'solid',true),plain=r.material(0xa7bd76);
  expect(painted.vertexColors).toBe(true);expect(plain.vertexColors).toBe(false);
  expect(painted).not.toBe(plain);expect(painted.map).toBeNull();
  expect(r.material(0xa7bd76,'solid',true)).toBe(painted);
 }finally{r.dispose();}
});
