// Read-only CPU trajectory sampling of the actual supplied FBX and current motion.
// No browser, GPU, image decoding, model upload, source mutation or Git writes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';

const root=process.cwd(),output=process.argv[2]??'artifacts/qa/user-grip/motion-audit-baseline.json';
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
const sources={};
async function load(relative){
 const source=fs.readFileSync(path.join(root,relative),'utf8');sources[relative]=sha(source);
 let js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 js=js.replaceAll("from 'three'",`from '${pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href}'`)
  .replaceAll("from 'three/addons/loaders/FBXLoader.js'",`from '${pathToFileURL(path.join(root,'node_modules/three/examples/jsm/loaders/FBXLoader.js')).href}'`);
 return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
}
const warnings=[],warn=console.warn;console.warn=(...args)=>warnings.push(args.join(' '));
const originalLoad=T.TextureLoader.prototype.load;T.TextureLoader.prototype.load=function(){return new T.Texture();};
const bytes=fs.readFileSync(path.join(root,'public/assets/user-models/character.fbx'));
const {prepareUserModel}=await load('src/game/world/userModel.ts');
const {createUserCharacterRig}=await load('src/game/world/userCharacterRig.ts');
const {UserCharacterMotion}=await load('src/game/world/userCharacterMotion.ts');
let rig;
try{
 rig=createUserCharacterRig(prepareUserModel(new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),'character'));
 const motion=new UserCharacterMotion(rig);
 const landmarks=()=>Object.fromEntries(['pelvis','spine','chest','head','leftForeArm','rightForeArm','leftHand','rightHand'].map(name=>[name,rig.bones[name].getWorldPosition(new T.Vector3()).toArray()]));
 motion.sample(4.15);const impact=motion.bladePosition().clone(),stumpHeight=Math.max(.25,impact.y),cutTop=stumpHeight+.015;
 const samples=[];
 for(let i=0;i<=710;i++){
  const time=i/100,phase=motion.sample(time).phase,blade=motion.bladePosition(),position=rig.axe.mesh.geometry.getAttribute('position');
  let lowestInCylinder=Infinity,verticesUnderTop=0;
  for(let j=0;j<position.count;j++){
   const point=rig.axe.mesh.localToWorld(new T.Vector3().fromBufferAttribute(position,j));
   if(Math.hypot(point.x-impact.x,point.z-impact.z)>.202)continue;
   lowestInCylinder=Math.min(lowestInCylinder,point.y);if(point.y<cutTop-.001)verticesUnderTop++;
  }
  samples.push({time,phase,blade:blade.toArray(),hands:{left:motion.handPosition('left').toArray(),right:motion.handPosition('right').toArray()},joints:landmarks(),lowestAxeYInsideStump:Number.isFinite(lowestInCylinder)?lowestInCylinder:null,verticesUnderCutTop:verticesUnderTop});
 }
 const recover=samples.filter(sample=>sample.time>=4.15&&sample.time<=5.6),inside=recover.filter(sample=>Math.hypot(sample.blade[0]-impact.x,sample.blade[2]-impact.z)<.202);
 const minimum=inside.reduce((best,current)=>current.blade[1]<best.blade[1]?current:best,inside[0]);
 const chordStart=new T.Vector3(...recover[0].blade),chordEnd=new T.Vector3(...recover.at(-1).blade),axis=chordEnd.clone().sub(chordStart),length=axis.length();axis.normalize();
 const chordDeviation=Math.max(...recover.map(sample=>{const v=new T.Vector3(...sample.blade).sub(chordStart);return v.addScaledVector(axis,-T.MathUtils.clamp(v.dot(axis),0,length)).length();}));
 const out={date:'2026-10-22',method:'Actual normalized FBX + current runtime rig/motion in CPU; original textures stubbed only; not browser or finger collision proof.',sourceSha256:sources,fbxSha256:sha(bytes),warnings,workTarget:{centerXZ:[impact.x,impact.z],stumpHeight,visibleCutTop:cutTop,radius:.202},summary:{minimumBladeYInsideStump:{time:minimum.time,y:minimum.blade[1],belowWoodTop:stumpHeight-minimum.blade[1],belowVisibleCutTop:cutTop-minimum.blade[1]},maximumRecoveryChordDeviation:chordDeviation,sampleCount:samples.length},samples};
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(out,null,2));
 console.log(JSON.stringify({...out,samples:undefined},null,2));
}finally{rig?.dispose();T.TextureLoader.prototype.load=originalLoad;console.warn=warn;}
