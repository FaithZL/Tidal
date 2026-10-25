/**
 * Offline-only color bake for the supplied castle. Source FBX and UVs stay read-only.
 * Uses installed full Chromium, a loopback-only HTTP server and the locked Three.js.
 * Input atlas quadrants: top-left stone, top-right rock, bottom-left wood, bottom-right moss.
 * Region selection is a conservative geometric approximation, not authored material IDs.
 *
 * node scripts/bake-castle-texture.mjs --atlas public/assets/user-models/castle-materials-v1.png
 * Optional: --source FILE --output FILE --report FILE --size 2048 --padding 8 --no-wood
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {dirname,resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {chromium} from '@playwright/test';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),options={source:'public/assets/user-models/castle.fbx',atlas:'public/assets/user-models/castle-materials-v1.png',output:'public/assets/user-models/castle-soft-toon-v1.png',report:'artifacts/qa/castle-texture-20261025/bake-report.json',size:2048,padding:8,wood:true};
for(let i=0;i<args.length;i++){
 const name=args[i];
 if(name==='--help'){console.log('Bake castle colors to existing UVs. Options: --source FILE --atlas FILE --output PNG --report JSON --size 2048 --padding 8 --no-wood');process.exit(0);}
 if(name==='--no-wood'){options.wood=false;continue;}
 const key=name.slice(2);if(!name.startsWith('--')||!['source','atlas','output','report','size','padding'].includes(key)||!args[i+1])throw new Error(`Unknown/incomplete option: ${name}`);
 options[key]=['size','padding'].includes(key)?Number(args[++i]):args[++i];
}
if(!Number.isInteger(options.size)||options.size<256||options.size>4096||(options.size&(options.size-1)))throw new Error('--size must be a power of two from 256 to 4096');
if(!Number.isInteger(options.padding)||options.padding<0||options.padding>32)throw new Error('--padding must be 0..32');
for(const key of ['source','atlas','output','report'])options[key]=resolve(root,options[key]);
if(options.output===options.source||options.output===options.atlas||extname(options.output).toLowerCase()!=='.png')throw new Error('Output must be a separate PNG');
const sourceBytes=await readFile(options.source),atlasBytes=await readFile(options.atlas),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceSha=sha(sourceBytes),atlasSha=sha(atlasBytes);
if(atlasBytes.readUInt32BE(0)!==0x89504e47)throw new Error('Atlas must be PNG');
const atlasWidth=atlasBytes.readUInt32BE(16),atlasHeight=atlasBytes.readUInt32BE(20);
if(atlasWidth!==atlasHeight||atlasWidth%2)throw new Error('Atlas must be square with four equal quadrants');

// Structural parse only. The known castle has no source images; reject a different textured input.
const originalLoad=T.TextureLoader.prototype.load;let attemptedTexture=false;
T.TextureLoader.prototype.load=function(){attemptedTexture=true;return new T.Texture();};
let source;
try{source=new FBXLoader().parse(sourceBytes.buffer.slice(sourceBytes.byteOffset,sourceBytes.byteOffset+sourceBytes.byteLength),'');}
finally{T.TextureLoader.prototype.load=originalLoad;}
if(attemptedTexture)throw new Error('This bake expects an untextured source FBX');
source.updateMatrixWorld(true);
const bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3()),origin=bounds.getCenter(new T.Vector3());origin.y=bounds.min.y;
if(!Number.isFinite(size.y)||size.y<=0)throw new Error('Invalid source bounds');
const scale=12/size.y,positions=[],normals=[],uvs=[],triangleData=[];
source.traverse(object=>{
 if(!object.isMesh)return;
 const g=object.geometry,p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv'),ix=g.index;
 if(!p||!n||!uv)throw new Error('Source must contain positions, normals and UVs');
 const nm=new T.Matrix3().getNormalMatrix(object.matrixWorld),count=ix?.count??p.count;
 for(let i=0;i<count;i+=3){
  const points=[];
  for(let j=0;j<3;j++){
   const k=ix?ix.getX(i+j):i+j,v=new T.Vector3().fromBufferAttribute(p,k).applyMatrix4(object.matrixWorld).sub(origin).multiplyScalar(scale),normal=new T.Vector3().fromBufferAttribute(n,k).applyMatrix3(nm).normalize();
   const u=uv.getX(k),vUV=uv.getY(k);if(![v.x,v.y,v.z,normal.x,normal.y,normal.z,u,vUV].every(Number.isFinite))throw new Error('Non-finite source geometry');
   positions.push(...v.toArray());normals.push(...normal.toArray());uvs.push(u,vUV);points.push(v);
  }
  const face=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])),area=face.length()*.5,center=points[0].clone().add(points[1]).add(points[2]).multiplyScalar(1/3);face.normalize();
  triangleData.push({points,center,face,area});
 }
});
if(!positions.length||positions.length/9!==triangleData.length)throw new Error('No triangles found');

// Only existing, recessed, near-planar outward-facing patches can become wood.
// Approximate facade planes were measured from this FBX. Small speckles and broad walls are excluded.
const wood=new Float32Array(triangleData.length*3),candidates=new Set(),edgeMap=new Map();
const vertexKey=p=>`${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`;
for(let t=0;t<triangleData.length;t++){
 const d=triangleData[t],c=d.center,n=d.face;
 const right=n.x>.965&&6.95-c.x>.13&&6.95-c.x<.55&&c.z>-5.5&&c.z<5.5;
 const front=n.z>.965&&6.10-c.z>.13&&6.10-c.z<.60&&c.x>-5.8&&c.x<5.8;
 if(!options.wood||c.y<2.6||c.y>7.1||!(right||front)||d.area<1e-8)continue;
 candidates.add(t);
 for(const [a,b] of [[0,1],[1,2],[2,0]]){const aa=vertexKey(d.points[a]),bb=vertexKey(d.points[b]),key=aa<bb?`${aa}|${bb}`:`${bb}|${aa}`;if(!edgeMap.has(key))edgeMap.set(key,[]);edgeMap.get(key).push(t);}
}
const parent=Array.from({length:triangleData.length},(_,i)=>i),find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
for(const list of edgeMap.values())for(let i=1;i<list.length;i++){const a=find(list[0]),b=find(list[i]);if(a!==b)parent[b]=a;}
const components=new Map();for(const t of candidates){const k=find(t);if(!components.has(k))components.set(k,[]);components.get(k).push(t);}
const woodPatches=[];
for(const list of components.values()){
 const box=new T.Box3();let area=0;for(const t of list){triangleData[t].points.forEach(p=>box.expandByPoint(p));area+=triangleData[t].area;}
 const extent=box.getSize(new T.Vector3()),width=Math.max(extent.x,extent.z);
 if(area<.09||area>4.5||extent.y<.4||extent.y>3.8||width<.13||width>2.0)continue;
 list.forEach(t=>wood.fill(1,t*3,t*3+3));woodPatches.push({triangles:list.length,area,bounds:{min:box.min.toArray(),max:box.max.toArray()}});
}
const geometry={positions,normals,uvs,wood:Array.from(wood)};
const require=createRequire(import.meta.url),threeRoot=dirname(dirname(require.resolve('three')));
let browser;
const external=[],pageErrors=[];
const html=`<!doctype html><meta charset="utf-8"><script type="importmap">{"imports":{"three":"/vendor/build/three.module.js"}}</script><script type="module">
import * as T from 'three';
window.bake=async config=>{
 const data=await (await fetch('/geometry')).json(),atlas=await new T.TextureLoader().loadAsync('/atlas');
 atlas.colorSpace=T.NoColorSpace;atlas.flipY=true;atlas.generateMipmaps=false;atlas.minFilter=T.LinearFilter;atlas.magFilter=T.LinearFilter;
 const renderer=new T.WebGLRenderer({antialias:false,alpha:true,preserveDrawingBuffer:true});renderer.setSize(config.size,config.size,false);renderer.setPixelRatio(1);renderer.setClearColor(0,0);renderer.autoClear=true;
 const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info'),gpu=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):'unknown';
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(data.normals,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(data.uvs,2));geometry.setAttribute('wood',new T.Float32BufferAttribute(data.wood,1));
 const vertex='precision highp float;attribute vec3 position;attribute vec3 normal;attribute vec2 uv;attribute float wood;varying vec3 p;varying vec3 n;varying float w;void main(){p=position;n=normal;w=wood;gl_Position=vec4(uv*2.0-1.0,0.0,1.0);}';
 const fragment=
 'precision highp float;uniform sampler2D atlas;uniform float inset;varying vec3 p;varying vec3 n;varying float w;'+
 'vec3 fromSrgb(vec3 c){return mix(pow((c+0.055)/1.055,vec3(2.4)),c/12.92,step(c,vec3(0.04045)));}'+
 'vec3 toSrgb(vec3 c){c=max(c,vec3(0.0));return mix(1.055*pow(c,vec3(1.0/2.4))-0.055,c*12.92,step(c,vec3(0.0031308)));}'+
 'vec2 mirrored(vec2 uv){return 1.0-abs(mod(uv,2.0)-1.0);}'+
 'vec3 tile(vec2 uv,float id){vec2 off=id<0.5?vec2(0.0,0.5):id<1.5?vec2(0.5,0.5):id<2.5?vec2(0.0,0.0):vec2(0.5,0.0);vec2 local=mix(vec2(inset),vec2(1.0-inset),mirrored(uv));return fromSrgb(texture2D(atlas,off+local*0.5).rgb);}'+
 'vec3 projected(vec3 at,vec3 normal,float id,float frequency){vec3 weights=pow(abs(normal),vec3(8.0));weights/=max(dot(weights,vec3(1.0)),0.00001);return tile(at.zy*frequency,id)*weights.x+tile(at.xz*frequency,id)*weights.y+tile(at.xy*frequency,id)*weights.z;}'+
 'void main(){vec3 normal=normalize(n);float back=1.0-smoothstep(-5.0,-2.7,p.z);float peak=back*smoothstep(5.2,8.0,p.y);float rear=back*(1.0-smoothstep(7.5,9.5,p.y));float rock=clamp(max(peak,rear),0.0,1.0);vec3 stone=projected(p,normal,0.0,0.43),rocks=projected(p,normal,1.0,0.24),wood=projected(p,normal,2.0,0.43);vec3 color=mix(stone,rocks,rock);float noise=sin(p.x*1.8+sin(p.z*1.7))*sin(p.z*2.3+p.y);float moss=rock*smoothstep(0.45,0.9,normal.y)*(1.0-smoothstep(4.0,8.0,p.y))*smoothstep(0.25,0.7,noise)*0.20;color=mix(color,projected(p,normal,3.0,0.4),moss);color=mix(color,wood,step(0.5,w));gl_FragColor=vec4(toSrgb(color),1.0);}';
 const material=new T.RawShaderMaterial({uniforms:{atlas:{value:atlas},inset:{value:8/(config.atlasWidth/2)}},vertexShader:vertex,fragmentShader:fragment,side:T.DoubleSide,depthTest:false,depthWrite:false});
 const scene=new T.Scene(),mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);const camera=new T.Camera();
 const target=()=>new T.WebGLRenderTarget(config.size,config.size,{minFilter:T.NearestFilter,magFilter:T.NearestFilter,format:T.RGBAFormat,type:T.UnsignedByteType,depthBuffer:false,stencilBuffer:false});let a=target(),b=target();
 renderer.setRenderTarget(a);renderer.clear();renderer.render(scene,camera);
 const pixels=new Uint8Array(config.size*config.size*4);renderer.readRenderTargetPixels(a,0,0,config.size,config.size,pixels);let covered=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])covered++;
 if(covered<config.size*config.size*.05)throw new Error('UV bake produced insufficient coverage');
 const quadGeometry=new T.PlaneGeometry(2,2),quadScene=new T.Scene();
 const quadVertex='precision highp float;attribute vec3 position;attribute vec2 uv;varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.0,1.0);}';
 const dilate=new T.RawShaderMaterial({uniforms:{image:{value:a.texture},pixel:{value:new T.Vector2(1/config.size,1/config.size)}},vertexShader:quadVertex,fragmentShader:'precision highp float;uniform sampler2D image;uniform vec2 pixel;varying vec2 v;void main(){vec4 c=texture2D(image,v);if(c.a>0.5){gl_FragColor=c;return;}for(int y=-1;y<=1;y++){for(int x=-1;x<=1;x++){vec4 q=texture2D(image,v+vec2(float(x),float(y))*pixel);if(q.a>0.5){gl_FragColor=q;return;}}}gl_FragColor=vec4(0.0);}',depthTest:false,depthWrite:false});
 const quad=new T.Mesh(quadGeometry,dilate);quadScene.add(quad);
 for(let i=0;i<config.padding;i++){dilate.uniforms.image.value=a.texture;renderer.setRenderTarget(b);renderer.clear();renderer.render(quadScene,camera);[a,b]=[b,a];}
 const copy=new T.RawShaderMaterial({uniforms:{image:{value:a.texture}},vertexShader:quadVertex,fragmentShader:'precision highp float;uniform sampler2D image;varying vec2 v;void main(){vec4 c=texture2D(image,v);gl_FragColor=vec4(c.a>0.5?c.rgb:vec3(0.63,0.62,0.56),1.0);}',depthTest:false,depthWrite:false});quad.material=copy;renderer.setRenderTarget(null);renderer.clear();renderer.render(quadScene,camera);
 // WebGL top row is UV.y=1; PNG capture preserves that orientation for TextureLoader.flipY=true.
 const png=renderer.domElement.toDataURL('image/png');
 geometry.dispose();material.dispose();quadGeometry.dispose();dilate.dispose();copy.dispose();atlas.dispose();a.dispose();b.dispose();renderer.dispose();renderer.forceContextLoss();
 return {png,gpu,coveredTexels:covered,coverage:covered/(config.size*config.size),uvImageOrientation:'PNG top corresponds to UV y=1; runtime flipY=true',colorSpace:'Input PNG sRGB decoded, linear material blending, explicit sRGB encoded output; no Three tone mapping or second gamma pass'};
};
</script>`;
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/'){res.setHeader('content-type','text/html; charset=utf-8');res.end(html);return;}
  if(url.pathname==='/geometry'){res.setHeader('content-type','application/json');res.end(JSON.stringify(geometry));return;}
  if(url.pathname==='/atlas'){res.setHeader('content-type','image/png');res.end(atlasBytes);return;}
  if(url.pathname.startsWith('/vendor/')){const file=resolve(threeRoot,url.pathname.slice('/vendor/'.length));if(!file.startsWith(threeRoot+sep))throw new Error('Invalid local module path');res.setHeader('content-type','text/javascript');res.end(await readFile(file));return;}
  res.statusCode=404;res.end('Not found');
 }catch(error){res.statusCode=500;res.end(String(error));}
});
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({channel:'chromium',headless:true});const page=await browser.newPage();page.on('pageerror',error=>pageErrors.push(error.message));
 await page.route('**/*',route=>{const url=route.request().url();if(new URL(url).origin!==base){external.push(url);void route.abort();}else void route.continue();});
 await page.goto(base);await page.waitForFunction(()=>typeof window.bake==='function');
 const result=await page.evaluate(config=>window.bake(config),{size:options.size,padding:options.padding,atlasWidth});
 if(pageErrors.length||external.length)throw new Error(JSON.stringify({pageErrors,external}));
 const png=Buffer.from(result.png.split(',')[1],'base64');delete result.png;
 if(sha(await readFile(options.source))!==sourceSha||sha(await readFile(options.atlas))!==atlasSha)throw new Error('An input changed during baking');
 await mkdir(dirname(options.output),{recursive:true});await writeFile(options.output,png);
 const report={tool:'scripts/bake-castle-texture.mjs',source:{file:options.source,bytes:sourceBytes.length,sha256:sourceSha,unchanged:true},materials:{file:options.atlas,sha256:atlasSha,width:atlasWidth,height:atlasHeight,quadrants:['stone','rock','wood','moss'],insetPixels:8,repeat:'mirrored to soften source tile borders'},output:{file:options.output,bytes:png.length,sha256:sha(png),width:options.size,height:options.size,colorSpace:'sRGB',paddingPixels:options.padding},geometry:{triangles:triangleData.length,height:12,originalUvUnchanged:true},semanticMask:{method:'Approximate spatial rear-rock mask and only existing small recessed facade patches for wood; no invented window patterns',woodTriangles:Array.from(wood).filter(v=>v===1).length/3,woodPatches,limitation:'No authored material groups; boundaries and door/window identification require visual review'},browser:browser.version(),...result,pageErrors,external};
 await mkdir(dirname(options.report),{recursive:true});await writeFile(options.report,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:report.output,coverage:report.coverage,woodTriangles:report.semanticMask.woodTriangles,woodPatches:woodPatches.length,gpu:report.gpu,report:options.report}));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
