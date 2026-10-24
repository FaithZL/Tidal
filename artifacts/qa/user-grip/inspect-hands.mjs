// Read-only CPU inspection of supplied hand topology. Product/public are untouched.
import fs from 'node:fs';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {prepareUserModel} from '../user-rig/review-runtime/userModel.mjs';
import {createUserCharacterRig,USER_BONE_NAMES} from '../user-rig/review-runtime/userCharacterRig.mjs';
T.TextureLoader.prototype.load=()=>new T.Texture();
const bytes=fs.readFileSync('public/assets/user-models/character.fbx'),source=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const rig=createUserCharacterRig(prepareUserModel(source,'character'));
const geometry=rig.mesh.geometry,p=geometry.getAttribute('position'),s=geometry.getAttribute('skinIndex'),w=geometry.getAttribute('skinWeight'),uv=geometry.getAttribute('uv');
const vertices=Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i),p.getZ(i)]),uvs=Array.from({length:p.count},(_,i)=>[uv.getX(i),uv.getY(i)]);
const hands={};
for(const side of ['left','right']){
 const boneNames=[`${side}Hand`,`${side}ForeArm`],boneIndices=boneNames.map(n=>USER_BONE_NAMES.indexOf(n));
 const forearm=USER_BONE_NAMES.indexOf(`${side}ForeArm`),hand=USER_BONE_NAMES.indexOf(`${side}Hand`);
 const weights=vertices.map((point,i)=>{let hw=0,fw=0;for(let j=0;j<4;j++){const id=s.getComponent(i,j);if(id===hand)hw+=w.getComponent(i,j);if(id===forearm)fw+=w.getComponent(i,j);}return {hand:hw,forearm:fw};});
 const selected=weights.map((v,i)=>(v.hand+v.forearm>.96)&&(vertices[i][1]<(side==='left'?1.05:.72))&&v.hand>.1);
 const triangles=[];for(let i=0;i<vertices.length;i+=3)if(selected[i]&&selected[i+1]&&selected[i+2])triangles.push([i,i+1,i+2]);
 const cornerIds=[...new Set(triangles.flat())],keys=new Map(),points=[];
 for(const i of cornerIds){const key=vertices[i].map(v=>v.toFixed(6)).join('/');if(!keys.has(key)){keys.set(key,points.length);points.push({point:vertices[i],firstBodyCorner:i,sourceCorner:rig.bodySourceCorners[i],uv:uvs[i],weights:weights[i]});}}
 hands[side]={scope:'Selected by previous verified geodesic hand/forearm weights only for CPU topology analysis; no new skinning is applied.',boneIndices,triangles,points,cornerIds};
}
fs.mkdirSync('artifacts/qa/user-grip',{recursive:true});fs.writeFileSync('artifacts/qa/user-grip/hand-topology.json',JSON.stringify({vertices,uvs,sourceCorners:rig.bodySourceCorners,hands},null,2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(hands).map(([side,h])=>[side,{triangles:h.triangles.length,uniquePositions:h.points.length,bounds:new T.Box3().setFromPoints(h.points.map(v=>new T.Vector3(...v.point))).getSize(new T.Vector3()).toArray()}])),null,2));rig.dispose();
