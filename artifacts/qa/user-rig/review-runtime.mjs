// Independent, read-only CPU rig inspection. Transpiled snapshots are QA-only.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
const out='artifacts/qa/user-rig/review-runtime';fs.mkdirSync(out,{recursive:true});const snapshots={};
for(const name of ['userModel','userCharacterRig','userCharacterMotion']){
 const input=fs.readFileSync(`src/game/world/${name}.ts`,'utf8');
 snapshots[name]=crypto.createHash('sha256').update(input).digest('hex');
 let code=ts.transpileModule(input,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 code=code.replaceAll("'./userCharacterRig.js'","'./userCharacterRig.mjs'").replaceAll("'./userModel.js'","'./userModel.mjs'");
 fs.writeFileSync(`${out}/${name}.mjs`,code);
}
const {prepareUserModel}=await import(pathToFileURL(path.resolve(out,'userModel.mjs')));
const {createUserCharacterRig,USER_BONE_NAMES}=await import(pathToFileURL(path.resolve(out,'userCharacterRig.mjs')));
const {UserCharacterMotion}=await import(pathToFileURL(path.resolve(out,'userCharacterMotion.mjs')));
T.TextureLoader.prototype.load=()=>new T.Texture();const bytes=fs.readFileSync('public/assets/user-models/character.fbx');
const rig=createUserCharacterRig(prepareUserModel(new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),'character'));
const motion=new UserCharacterMotion(rig),geometry=rig.mesh.geometry,pos=geometry.attributes.position,skin=geometry.attributes.skinIndex,weight=geometry.attributes.skinWeight;
const restPoints=Array.from({length:pos.count},(_,i)=>new T.Vector3().fromBufferAttribute(pos,i));
const samples=[];
const regions={
 rightPalm:(p)=>p.y>.50&&p.y<.69&&p.x>0&&p.x<.19&&p.z>.14,
 rightThigh:(p)=>p.y>.45&&p.y<.72&&p.x<-.03&&p.z<.14,
 leftPalm:(p)=>p.y>.80&&p.y<1.04&&p.x>.45&&p.z>-.15,
 shoulderRight:(p)=>p.y>1.2&&p.y<1.48&&p.x<-.06,
 shoulderLeft:(p)=>p.y>1.28&&p.y<1.6&&p.x>.33,
};
const regionWeights={};
for(const [name,contains]of Object.entries(regions)){
 const corners=restPoints.flatMap((p,i)=>contains(p)?[i]:[]),means=Array.from({length:17},()=>0);
 for(const i of corners)for(let j=0;j<4;j++)means[skin.getComponent(i,j)]+=weight.getComponent(i,j)/corners.length;
 regionWeights[name]={corners:corners.length,average:Object.fromEntries(means.map((v,i)=>[USER_BONE_NAMES[i],+v.toFixed(6)]).filter(([,v])=>v>.001))};
}
for(const time of [0,.8,2.9,3.4,3.9,4.15,4.4,4.95,5.6]){
 motion.sample(time);rig.root.updateMatrixWorld(true);rig.skeleton.update();
 const points=restPoints.map((p,i)=>rig.mesh.applyBoneTransform(i,p.clone()));
 const distortions=[];let ratioOver2=0,ratioOver3=0;
 for(let i=0;i<pos.count;i+=3)for(let j=0;j<3;j++){
  const a=i+j,b=i+(j+1)%3,original=restPoints[a].distanceTo(restPoints[b]);if(original<.01)continue;
  const deformed=points[a].distanceTo(points[b]),ratio=deformed/original;
  if(ratio>2)ratioOver2++;if(ratio>3)ratioOver3++;
  if(ratio>2)distortions.push({ratio:+ratio.toFixed(4),original:+original.toFixed(4),cornerA:a,cornerB:b,restA:restPoints[a].toArray(),restB:restPoints[b].toArray(),weightsA:Object.fromEntries([0,1,2,3].map(j=>[USER_BONE_NAMES[skin.getComponent(a,j)],+weight.getComponent(a,j).toFixed(5)])),weightsB:Object.fromEntries([0,1,2,3].map(j=>[USER_BONE_NAMES[skin.getComponent(b,j)],+weight.getComponent(b,j).toFixed(5)]))});
 }
 distortions.sort((a,b)=>b.ratio-a.ratio);
 const contacts=Object.fromEntries(['left','right'].map(side=>[side,motion.handPosition(side).distanceTo(rig.axe.root.localToWorld(rig.axe.grips[side==='left'?'upper':'lower'].clone()))]));
 const worstByRegion={};for(const edge of distortions){const y=(edge.restA[1]+edge.restB[1])/2,key=y>1.6?'head-neck':y>1.18?'shoulders':y>.78?'waist-elbows':y>.42?'hands-knees':'boots';if(!worstByRegion[key])worstByRegion[key]=edge;}
 const probeEdges=[[706,707],[1844,1842],[1927,1928]].map(([a,b])=>({a,b,ratio:points[a].distanceTo(points[b])/restPoints[a].distanceTo(restPoints[b]),weightsA:Object.fromEntries([0,1,2,3].map(j=>[USER_BONE_NAMES[skin.getComponent(a,j)],+weight.getComponent(a,j).toFixed(5)])),weightsB:Object.fromEntries([0,1,2,3].map(j=>[USER_BONE_NAMES[skin.getComponent(b,j)],+weight.getComponent(b,j).toFixed(5)]))}));
 samples.push({time,contacts,ratioOver2,ratioOver3,worstByRegion,probeEdges,worstEdges:distortions.slice(0,10)});
}
const result={date:'2026-10-22',snapshots,method:'CPU current TS source transpiled to independent QA snapshots; actual FBX; rest-edge stretch is a diagnostic, not full collision/naturalness proof.',regionWeights,samples};
fs.writeFileSync('artifacts/qa/user-rig/review-runtime.json',JSON.stringify(result,null,2));console.log(JSON.stringify({snapshots,regionWeights,samples:samples.map(({worstEdges,...s})=>({...s,worst:worstEdges[0]}))},null,2));rig.dispose();
