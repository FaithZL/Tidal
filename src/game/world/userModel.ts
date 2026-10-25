import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
export type UserModelKind='character'|'house'|'castle';
export interface UserModel{readonly root:T.Group;readonly kind:UserModelKind;readonly motionSupport:'static';dispose():void}

/** Own imported resources independently from the world's cached procedural art. */
function allocations(source:T.Object3D):{geometries:Set<T.BufferGeometry>;materials:Set<T.Material>;textures:Set<T.Texture>}{
 const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
 source.traverse(object=>{if(!(object instanceof T.Mesh))return;geometries.add(object.geometry);
  for(const material of Array.isArray(object.material)?object.material:[object.material]){materials.add(material);for(const value of Object.values(material))if(value instanceof T.Texture)textures.add(value);}
 });return {geometries,materials,textures};
}
function release(source:T.Object3D):void{
 const owned=allocations(source),images=new Set<unknown>();
 owned.geometries.forEach(geometry=>geometry.dispose());owned.materials.forEach(material=>material.dispose());
 owned.textures.forEach(texture=>{images.add(texture.source.data);texture.dispose();});
 for(const value of images)if(value&&typeof value==='object'&&'close' in value&&typeof value.close==='function')value.close();
 source.clear();
}

/** Preserve the supplied shape/UVs; uniform scale and a separate parent establish farm coordinates. */
export function prepareUserModel(source:T.Group,kind:UserModelKind):UserModel{
 const root=new T.Group(),orientation=new T.Group();root.name=`user-${kind}-model`;orientation.rotation.y=kind==='castle'?0:-Math.PI/2;orientation.add(source);root.add(orientation);root.updateMatrixWorld(true);
 const owned=allocations(source);let vertices=0,invalid=false;
 source.traverse(object=>{if(object instanceof T.Mesh){const positions=object.geometry.getAttribute('position');if(positions){vertices+=positions.count;for(const value of positions.array)if(!Number.isFinite(value))invalid=true;}}});
 if(invalid){release(source);throw new Error('User FBX geometry contains invalid bounds');}
 const bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3());
 if(!vertices||bounds.isEmpty()||!size.toArray().every(Number.isFinite)||size.y<=0){release(source);throw new Error('User FBX has empty geometry or invalid bounds');}
 const origin=bounds.getCenter(new T.Vector3());origin.y=bounds.min.y;
 if(kind==='character'){
  // The supplied axe extends far beyond the body. Center on the actual soles,
  // rather than the all-mesh midpoint, so the actor stands on its world anchor.
  const soles=new T.Vector3(),point=new T.Vector3();let count=0;
  source.traverse(object=>{if(!(object instanceof T.Mesh))return;const positions=object.geometry.getAttribute('position');
   for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i).applyMatrix4(object.matrixWorld);if(point.y>bounds.min.y+size.y*.045)continue;soles.add(point);count++;}
  });if(count){origin.x=soles.x/count;origin.z=soles.z/count;}
 }
 const height={character:2.05,house:5.4,castle:12}[kind];
 const scale=height/size.y;orientation.scale.setScalar(scale);orientation.position.copy(origin).multiplyScalar(-scale);
 const replacements=new Map<T.Material,T.MeshToonMaterial>();
 source.traverse(object=>{
  if(!(object instanceof T.Mesh))return;object.castShadow=kind!=='castle';object.receiveShadow=kind!=='character';
  const styled=(Array.isArray(object.material)?object.material:[object.material]).map(material=>{
   const existing=replacements.get(material);if(existing)return existing;
   const phong=material instanceof T.MeshPhongMaterial?material:null;
   const toon=new T.MeshToonMaterial({name:`user-${kind}-${material.name}`,color:kind==='castle'&&phong&&!phong.map?phong.color:0xffffff,map:phong?.map??null,normalMap:phong?.normalMap??null,normalScale:new T.Vector2(.35,.35),side:material.side,transparent:material.transparent,opacity:material.opacity,alphaTest:material.alphaTest});
   // Deliberately omit Phong specular: FBX roughness/metallic are not silently
   // claimed as PBR maps. Source bytes stay intact in the user-supplied FBX.
   toon.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <gradientmap_pars_fragment>',`vec3 getGradientIrradiance(vec3 n,vec3 l){float t=smoothstep(0.15,0.83,dot(n,l)*0.5+0.5);return mix(vec3(0.64,0.68,0.73),vec3(1.0,0.97,0.89),t);}`);};
   toon.customProgramCacheKey=()=>`tidal-user-model-soft-toon-v1`;replacements.set(material,toon);return toon;
  });object.material=Array.isArray(object.material)?styled:styled[0];
 });
 owned.materials.forEach(material=>material.dispose());root.updateMatrixWorld(true);
 let disposed=false;
 return {root,kind,motionSupport:'static',dispose(){if(disposed)return;disposed=true;
  owned.geometries.forEach(geometry=>geometry.dispose());replacements.forEach(material=>material.dispose());
  const images=new Set<unknown>();owned.textures.forEach(texture=>{images.add(texture.source.data);texture.dispose();});
  for(const image of images)if(image&&typeof image==='object'&&'close' in image&&typeof image.close==='function')image.close();root.removeFromParent();root.clear();
 }};
}

/** Decode embedded images and the local castle color atlas before opening the visual/start gate. */
export async function loadUserModel(kind:UserModelKind,baseUrl:string):Promise<UserModel>{
 const directory=`${baseUrl.replace(/\/?$/,'/')}assets/user-models/`,url=`${directory}${kind}.fbx`;
 const prefix=`用户${{house:'房屋',character:'人物',castle:'城堡'}[kind]}模型加载失败`;
 const response=await fetch(url).catch(error=>{throw new Error(prefix,{cause:error});});if(!response.ok)throw new Error(`${prefix}（${response.status}）`);
 const bytes=await response.arrayBuffer().catch(error=>{throw new Error(prefix,{cause:error});}),manager=new T.LoadingManager(),urls=new Set<string>();let started=false,imageError='';
 let complete:()=>void=()=>{};const images=new Promise<void>(resolve=>{complete=resolve;});
 manager.onStart=()=>{started=true;};manager.onLoad=complete;manager.onError=url=>{imageError=url;};
 manager.setURLModifier(url=>{if(url.startsWith('blob:')){urls.add(url);return url;}if(url.startsWith('data:'))return url;throw new Error('用户模型引用了未内嵌的贴图，请补充本地贴图');});
 let source:T.Group|undefined;
 try{
  source=new FBXLoader(manager).parse(bytes,'');if(started)await images;
  if(imageError)throw new Error('用户模型内嵌贴图解码失败');
  if(kind==='castle'){
   const color=await fetch(`${directory}castle-soft-toon-v1.png`);if(!color.ok)throw new Error(`城堡颜色贴图加载失败（${color.status}）`);
   const imageUrl=URL.createObjectURL(await color.blob());urls.add(imageUrl);let texture!:T.Texture;
   const decoded=new Promise<void>((resolve,reject)=>{
    texture=new T.TextureLoader(manager).load(imageUrl,loaded=>{
     void(async()=>{const image:unknown=loaded.image;if(image&&typeof image==='object'&&'decode' in image&&typeof image.decode==='function')await image.decode();})()
      .then(resolve,()=>reject(new Error('城堡颜色贴图解码失败')));
    },undefined,()=>reject(new Error('城堡颜色贴图解码失败')));
   });
   texture.colorSpace=T.SRGBColorSpace;
   // Attach before awaiting decoding so failure and late cancellation share the
   // same resource owner as successful imports. The source FBX remains intact.
   source.traverse(object=>{if(object instanceof T.Mesh)for(const material of Array.isArray(object.material)?object.material:[object.material])if(material instanceof T.MeshPhongMaterial)material.map=texture;});
   await decoded;
  }
  return prepareUserModel(source,kind);
 }catch(error){if(started)await images;if(source)release(source);throw new Error(`${prefix}：${error instanceof Error?error.message:'无法读取模型或贴图'}`,{cause:error});}
 finally{urls.forEach(url=>URL.revokeObjectURL(url));}
}
