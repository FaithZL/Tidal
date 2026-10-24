import * as T from 'three';
import type {WorldResources} from './resources.js';

export type NprSurface='solid'|'cloth'|'bark'|'wood'|'roof'|'plaster'|'grass'|'foliage';
/** Atlas coordinates use WebGL's bottom-left origin. Inset prevents neighboring tile bleed. */
export const NPR_ATLAS_TILES={bark:[0,1],wood:[1,1],roof:[2,1],plaster:[0,0],grass:[1,0],foliage:[2,0]} as const;
const softGradient=`
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
 float level = dot( normal, lightDirection ) * 0.5 + 0.5;
 float lit = smoothstep( 0.22, 0.78, level );
 return mix( vec3( 0.59, 0.65, 0.72 ), vec3( 1.0, 0.97, 0.88 ), lit );
}`;

/** Soft toon only for the approved local sample; legacy materials remain unchanged. */
export class NprPalette{
 constructor(private readonly resources:WorldResources,private readonly atlas?:T.Texture){
  if(atlas){resources.trackTexture(atlas);atlas.colorSpace=T.SRGBColorSpace;atlas.wrapS=atlas.wrapT=T.ClampToEdgeWrapping;
   atlas.minFilter=T.LinearMipmapNearestFilter;atlas.magFilter=T.LinearFilter;atlas.generateMipmaps=true;}
 }
 material(color:number,surface:NprSurface='solid',vertexColors=false):T.MeshToonMaterial{
  const tile=surface==='solid'||surface==='cloth'?null:NPR_ATLAS_TILES[surface];
  return this.resources.cachedMaterial(`npr-v1/${this.atlas?.uuid??'none'}/${surface}/${color}/${vertexColors}`,()=>{
   const material=new T.MeshToonMaterial({color,map:tile?this.atlas??null:null,vertexColors});
   material.name=`npr-${surface}`;material.userData.nprSurface=surface;
   material.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <gradientmap_pars_fragment>',softGradient);
    if(tile&&this.atlas){
     // 8px inset at the minimum supported 512px tile size, robust under mipmaps.
     const pad=.016;shader.uniforms.nprAtlasRect={value:new T.Vector4((tile[0]+pad)/3,(tile[1]+pad)/2,(1-pad*2)/3,(1-pad*2)/2)};
     shader.fragmentShader=`uniform vec4 nprAtlasRect;\n${shader.fragmentShader}`;
     shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      #ifdef USE_MAP
       vec2 atlasUv = nprAtlasRect.xy + fract( vMapUv ) * nprAtlasRect.zw;
       vec4 paint = textureGrad( map, atlasUv, dFdx( vMapUv ) * nprAtlasRect.zw, dFdy( vMapUv ) * nprAtlasRect.zw );
       diffuseColor.rgb *= mix( vec3( 1.0 ), paint.rgb, 0.46 );
       diffuseColor.a *= paint.a;
      #endif
     `);
    }
   };
   material.customProgramCacheKey=()=>`tidal-soft-toon-v1/${!!tile&&!!this.atlas}`;
   return material;
  });
 }
}
