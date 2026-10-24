import {readFile} from 'node:fs/promises';
import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
globalThis.ProgressEvent=class{};
const dir=new URL('../../../public/assets/character-motion/',import.meta.url),m=JSON.parse(await readFile(new URL('Male_Peasant.gltf',dir),'utf8')),bin=await readFile(new URL('Male_Peasant.bin',dir));
m.buffers[0].uri=`data:application/octet-stream;base64,${bin.toString('base64')}`;m.images=[];m.textures=[];m.materials=m.materials.map(m=>({name:m.name}));
const gltf=await new GLTFLoader().parseAsync(JSON.stringify(m),'');
for(const name of['Male_Peasant_Arms_1','Male_Peasant_Arms_2','Male_Peasant_Body']){
 const mesh=gltf.scene.getObjectByName(name),g=mesh.geometry,p=g.getAttribute('position'),idx=g.index,keys=new Map(),ids=[];
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(x=>x.toFixed(5)).join('/');if(!keys.has(key))keys.set(key,i);ids[i]=keys.get(key);}
 const edges=new Map();for(let i=0;i<idx.count;i+=3){const v=[ids[idx.getX(i)],ids[idx.getX(i+1)],ids[idx.getX(i+2)]];for(let j=0;j<3;j++){const a=v[j],b=v[(j+1)%3],key=a<b?`${a}/${b}`:`${b}/${a}`;edges.set(key,(edges.get(key)||0)+1);}}
 const boundary=[...edges].filter(e=>e[1]===1).map(e=>e[0].split('/').map(Number));
 const sets=[];while(boundary.length){const first=boundary.pop(),s=new Set(first);let changed;do{changed=false;for(let i=boundary.length-1;i>=0;i--){if(boundary[i].some(v=>s.has(v))){boundary[i].forEach(v=>s.add(v));boundary.splice(i,1);changed=true;}}}while(changed);sets.push(s);}
 console.log(name,sets.map(s=>{const v=[...s].map(i=>new T.Vector3().fromBufferAttribute(p,i)),box=new T.Box3().setFromPoints(v);return{count:s.size,min:box.min.toArray(),max:box.max.toArray(),ids:[...s]};}));
 const wi=g.getAttribute('skinIndex'),ww=g.getAttribute('skinWeight');
 for(const id of name.includes('Body')?[182,196,273,544,532,1067]:[393,354,2,35,329,343])console.log({id,p:new T.Vector3().fromBufferAttribute(p,id).toArray(),weights:Array.from({length:4},(_,j)=>({name:mesh.skeleton.bones[wi.getComponent(id,j)].name,w:ww.getComponent(id,j)}))});
}
const mesh=gltf.scene.getObjectByName('Male_Peasant_Arms_1'),p=mesh.geometry.getAttribute('position'),uv=mesh.geometry.getAttribute('uv');console.log('uv cuff',Array.from({length:p.count},(_,i)=>i).filter(i=>p.getX(i)>.495&&p.getX(i)<.512).map(i=>({i,p:[p.getY(i),p.getZ(i)],uv:[uv.getX(i),uv.getY(i)]})));
const tunic=gltf.scene.getObjectByName('Male_Peasant_Body'),gp=tunic.geometry.getAttribute('position'),gi=tunic.geometry.index;
for(const id of[535,1068,533,1069,532,1067,525,1072,1071,523,1073,531,534,527,528,529,526,524]){const ns=new Set();for(let i=0;i<gi.count;i+=3){const ids=[gi.getX(i),gi.getX(i+1),gi.getX(i+2)];if(ids.includes(id))ids.forEach(v=>{if(v!==id)ns.add(v);});}console.log('capneighbor',id,[gp.getX(id),gp.getY(id),gp.getZ(id)],[...ns].map(i=>({i,p:[gp.getX(i),gp.getY(i),gp.getZ(i)]})));}
const inner=[535,1068,533,1069,532,1067,525,1072,1071,523,1073,531,534,527,528,529,526,524],qs=new Set(inner.map(i=>[gp.getX(i),gp.getY(i),gp.getZ(i)].map(v=>v.toFixed(5)).join('/'))),outer=new Set();
for(let i=0;i<gi.count;i+=3){const ids=[gi.getX(i),gi.getX(i+1),gi.getX(i+2)];if(ids.some(j=>qs.has([gp.getX(j),gp.getY(j),gp.getZ(j)].map(v=>v.toFixed(5)).join('/'))))ids.forEach(j=>{if(!qs.has([gp.getX(j),gp.getY(j),gp.getZ(j)].map(v=>v.toFixed(5)).join('/')))outer.add(j);});}
console.log('outerring',outer.size,[...outer]);


