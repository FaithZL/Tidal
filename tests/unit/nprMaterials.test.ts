import {expect,test,vi} from 'vitest';
import * as T from 'three';
import {WorldResources} from '../../src/game/world/resources.js';
import {NprPalette,NPR_ATLAS_TILES} from '../../src/game/world/nprMaterials.js';

test('sample palette shares one original atlas but isolates surfaces and vertex color variants',()=>{
 const r=new WorldResources(),atlas=new T.Texture(),p=new NprPalette(r,atlas);
 const bark=p.material(0xffffff,'bark'),wood=p.material(0xffffff,'wood');
 expect(bark).toBeInstanceOf(T.MeshToonMaterial);expect(bark.map).toBe(atlas);expect(wood.map).toBe(atlas);
 expect(p.material(0xffffff,'bark')).toBe(bark);expect(wood).not.toBe(bark);
 expect(p.material(0xffffff,'bark',true)).not.toBe(bark);expect(p.material(0xffffff).map).toBeNull();
 expect(Object.values(NPR_ATLAS_TILES)).toHaveLength(6);
 expect(atlas.colorSpace).toBe(T.SRGBColorSpace);r.dispose();
});

test('soft lighting keeps broad transitions and atlas repeats remain inside an inset tile',()=>{
 const r=new WorldResources(),p=new NprPalette(r,new T.Texture()),m=p.material(0xffffff,'wood');
 const shader={uniforms:{},vertexShader:'',fragmentShader:'#include <gradientmap_pars_fragment>\n#include <map_fragment>'};
 // Exercise the real shader callback with the same includes used by r186.
 m.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
 expect(shader.fragmentShader).not.toContain('#include <gradientmap_pars_fragment>');
 expect(shader.fragmentShader).toContain('smoothstep( 0.22, 0.78');
 expect(shader.fragmentShader).toContain('fract( vMapUv )');
 expect(shader.fragmentShader).toContain('textureGrad( map, atlasUv');
 expect(shader.fragmentShader).toContain('dFdx( vMapUv ) * nprAtlasRect.zw');
 expect(shader.fragmentShader).toContain('nprAtlasRect');
 const uniforms=shader.uniforms as Record<string,{value:T.Vector4}>;
 expect(uniforms.nprAtlasRect.value.x).toBeGreaterThan(1/3);expect(uniforms.nprAtlasRect.value.z).toBeLessThan(1/3);
 expect(m.customProgramCacheKey()).toContain('tidal-soft-toon-v1');r.dispose();
});

test('shared NPR atlas and cached materials release exactly once with the world',()=>{
 const r=new WorldResources(),atlas=new T.Texture(),p=new NprPalette(r,atlas);
 const m=p.material(0xffffff,'bark');p.material(0xccddaa,'grass');new NprPalette(r,atlas).material(0xffffff,'bark');
 const td=vi.fn(),md=vi.fn();atlas.addEventListener('dispose',td);m.addEventListener('dispose',md);
 r.dispose();r.dispose();expect(td).toHaveBeenCalledTimes(1);expect(md).toHaveBeenCalledTimes(1);
 expect(new NprPalette(r).material(0xffffff,'bark')).not.toBe(m);r.dispose();
});

test('open leaf silhouettes use a separately owned cutout map and keep depth for natural overlap',()=>{
 const r=new WorldResources(),atlas=new T.Texture(),leaves=new T.Texture(),p=new NprPalette(r,atlas,leaves);
 const m=p.leaves();expect(m.map).toBe(leaves);expect(m.map).not.toBe(atlas);expect(m.alphaTest).toBeGreaterThan(.3);
 expect(m.side).toBe(T.DoubleSide);expect(m.transparent).toBe(false);expect(m.depthWrite).toBe(true);
 expect(p.leaves()).toBe(m);expect(leaves.colorSpace).toBe(T.SRGBColorSpace);
 const shader={uniforms:{},vertexShader:'',fragmentShader:'#include <gradientmap_pars_fragment>\n#include <map_fragment>'};
 m.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
 expect(shader.fragmentShader).not.toContain('nprAtlasRect');expect(shader.fragmentShader).toContain('#include <map_fragment>');
 const dispose=vi.fn();leaves.addEventListener('dispose',dispose);r.dispose();r.dispose();expect(dispose).toHaveBeenCalledTimes(1);
});
