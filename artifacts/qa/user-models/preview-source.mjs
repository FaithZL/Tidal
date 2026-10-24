// Read-only local FBX inspection. No source asset is modified or uploaded.
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {chromium} from '@playwright/test';
const names=['modelf23d8a6f4b3801','model4e87ceb4739501'];
const source='C:/Users/Zero/xwechat_files/zhuling6376_d513/msg/file/2026-10/';
const vendor=resolve('node_modules/three'),out=resolve('artifacts/qa/user-models/source-preview');await mkdir(out,{recursive:true});
const html=`<html><head><style>body{margin:0;background:#d1dce1}canvas{display:block}p{position:absolute;top:8px;left:24px;font:20px sans-serif;color:#234}</style><script type="importmap">{"imports":{"three":"/vendor/build/three.module.js","three/addons/":"/vendor/examples/jsm/"}}</script></head><body><p id="label">Source FBX — inspection only</p><script type="module">
import * as T from 'three';import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color(0xcbdde3);scene.add(new T.HemisphereLight(0xe7f1ff,0x776c50,2));const sun=new T.DirectionalLight(0xffe3bd,2.6);sun.position.set(-3,5,4);scene.add(sun);
const camera=new T.PerspectiveCamera(35,innerWidth/innerHeight,.01,100);const manager=new T.LoadingManager();let texturesDone;const waiting=new Promise(r=>texturesDone=r);manager.onLoad=()=>texturesDone();manager.onError=u=>{document.body.dataset.error=u;};
const model=await new FBXLoader(manager).loadAsync('/model/'+new URLSearchParams(location.search).get('id'));await waiting;
const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),meshes=[];let bones=0;
model.traverse(o=>{if(o.isBone)bones++;if(o.isMesh){const mats=Array.isArray(o.material)?o.material:[o.material];meshes.push({name:o.name,type:o.type,vertices:o.geometry.attributes.position.count,triangles:(o.geometry.index?.count??o.geometry.attributes.position.count)/3,materials:mats.map(m=>({name:m.name,color:m.color?.getHexString(),map:!!m.map,normalMap:!!m.normalMap,bumpMap:!!m.bumpMap}))});}});
const scale=3/Math.max(size.x,size.y,size.z);model.scale.multiplyScalar(scale);model.position.sub(center.multiplyScalar(scale));model.position.y+=size.y*scale/2;scene.add(model);
const plane=new T.Mesh(new T.PlaneGeometry(40,40),new T.MeshLambertMaterial({color:0xa3b38f}));plane.rotation.x=-Math.PI/2;plane.position.y=-.01;scene.add(plane);
camera.position.set(4,2.4,5);camera.lookAt(0,size.y*scale*.5,0);renderer.render(scene,camera);
window.inspection={size:size.toArray(),bones,animations:model.animations.length,meshes,scale};window.turn=angle=>{model.rotation.y=angle;renderer.render(scene,camera);};document.body.dataset.ready='true';
</script></body></html>`;
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');let data,type='text/javascript';if(url.pathname==='/'){data=html;type='text/html';}else if(url.pathname.startsWith('/model/')){const id=Number(url.pathname.split('/').at(-1));if(![0,1].includes(id))throw Error('invalid id');data=await readFile(source+names[id]+'.fbx');type='application/octet-stream';}else if(url.pathname.startsWith('/vendor/')){const path=resolve(vendor,url.pathname.slice(8));if(!path.startsWith(vendor+sep))throw Error('invalid path');data=await readFile(path);}else{res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':type});res.end(data);}catch(e){res.writeHead(500).end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch(),results=[];
try{const page=await browser.newPage({viewport:{width:1200,height:900}});page.on('pageerror',e=>console.error(e));
for(let id=0;id<2;id++){await page.goto('http://127.0.0.1:'+server.address().port+'/?id='+id);await page.waitForFunction(()=>document.body.dataset.ready==='true',{timeout:20000});const info=await page.evaluate(()=>window.inspection);console.log(names[id],JSON.stringify(info));results.push({file:names[id]+'.fbx',...info});await page.screenshot({path:out+'/'+names[id]+'-front.png'});await page.evaluate(()=>window.turn(Math.PI));await page.screenshot({path:out+'/'+names[id]+'-back.png'});}
await writeFile(out+'/scene-info.json',JSON.stringify(results,null,2)+'\n');
}finally{await browser.close();server.close();}
