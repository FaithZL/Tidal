// Read-only topology audit; only QA JSON/Markdown output is written.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as T from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
T.TextureLoader.prototype.load = function (url) { const t=new T.Texture();t.name=String(url);return t; };
const file='public/assets/user-models/character.fbx';
const bytes=fs.readFileSync(file);
const source=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const root=new T.Group(), orientation=new T.Group();orientation.rotation.y=-Math.PI/2;orientation.add(source);root.add(orientation);root.updateMatrixWorld(true);
const bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3()),origin=bounds.getCenter(new T.Vector3());origin.y=bounds.min.y;
let soleCount=0;const soles=new T.Vector3(),point=new T.Vector3();
source.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){point.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);if(point.y>bounds.min.y+size.y*.045)continue;soles.add(point);soleCount++;}});
origin.x=soles.x/soleCount;origin.z=soles.z/soleCount;const scale=2.05/size.y;
orientation.scale.setScalar(scale);orientation.position.copy(origin).multiplyScalar(-scale);root.updateMatrixWorld(true);
const vertices=[],triangles=[],uvs=[];let offset=0;
source.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position,uv=o.geometry.attributes.uv;for(let i=0;i<a.count;i++){vertices.push(point.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).toArray());uvs.push(uv?[uv.getX(i),uv.getY(i)]:[0,0]);}const indices=o.geometry.index?.array??Array.from({length:a.count},(_,i)=>i);for(let i=0;i<indices.length;i+=3)triangles.push([indices[i]+offset,indices[i+1]+offset,indices[i+2]+offset]);offset+=a.count;});
function components(epsilon){
 const welded=[],keys=new Map(),originalToWeld=[];
 for(const v of vertices){const key=v.map(x=>Math.round(x/epsilon)).join(',');if(!keys.has(key)){keys.set(key,welded.length);welded.push(v);}originalToWeld.push(keys.get(key));}
 const parents=welded.map((_,i)=>i),find=i=>parents[i]===i?i:(parents[i]=find(parents[i]));const join=(a,b)=>{parents[find(a)]=find(b);};
 for(const t of triangles){const [a,b,c]=t.map(i=>originalToWeld[i]);join(a,b);join(a,c);}
 const groups=new Map();triangles.forEach((tri,ti)=>{const r=find(originalToWeld[tri[0]]);if(!groups.has(r))groups.set(r,{triangles:[],ids:new Set()});const c=groups.get(r);c.triangles.push(ti);tri.forEach(i=>c.ids.add(originalToWeld[i]));});
 return {epsilon,welded: welded.length,groups:[...groups.values()].map(c=>{const b=new T.Box3().setFromPoints([...c.ids].map(i=>new T.Vector3(...welded[i])));return {vertices:c.ids.size,triangles:c.triangles.length,bounds:{min:b.min.toArray(),max:b.max.toArray()},centroid:[...c.ids].map(i=>welded[i]).reduce((s,p)=>s.map((v,i)=>v+p[i]/c.ids.size),[0,0,0]),triangleIndices:c.triangles};}).sort((a,b)=>b.triangles-a.triangles)};
}
const componentRuns=[components(1e-6),components(1e-5),components(1e-4),components(.001)];
const normalizedBounds=new T.Box3().setFromPoints(vertices.map(v=>new T.Vector3(...v)));
const slices=[];for(let y=0;y<=2.051;y+=.1){const ps=vertices.filter(v=>Math.abs(v[1]-y)<.025);if(!ps.length)continue;const b=new T.Box3().setFromPoints(ps.map(v=>new T.Vector3(...v)));slices.push({y:+y.toFixed(2),count:ps.length,min:b.min.toArray(),max:b.max.toArray()});}
const out={date:'2026-10-22',scope:'Read-only actual Three.js FBX geometry normalized with current prepareUserModel transform; texture stubs; no GPU/browser. Axes X right, Y up, face +Z.',file,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),transform:{orientationY:-Math.PI/2,origin:origin.toArray(),scale,soleCount},positions:vertices.length,triangles:triangles.length,bounds:{min:normalizedBounds.min.toArray(),max:normalizedBounds.max.toArray()},componentRuns,slices};
fs.mkdirSync('artifacts/qa/user-rig',{recursive:true});fs.writeFileSync('artifacts/qa/user-rig/mesh-audit.json',JSON.stringify(out,null,2));
fs.writeFileSync('artifacts/qa/user-rig/normalized-geometry.json',JSON.stringify({vertices,triangles,uvs},null,0));
console.log(JSON.stringify({...out,componentRuns:out.componentRuns.map(r=>({...r,groups:r.groups.map(({triangleIndices,...g})=>g)}))},null,2));
