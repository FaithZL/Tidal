import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
const out='artifacts/qa/user-grip/compiled';fs.mkdirSync(out,{recursive:true});
for(const name of ['userModel','userCharacterRig','userHandGrip','userCharacterMotion']){
 let code=ts.transpileModule(fs.readFileSync(`src/game/world/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 code=code.replaceAll("'./userCharacterRig.js'","'./userCharacterRig.mjs'").replaceAll("'./userModel.js'","'./userModel.mjs'").replaceAll("'./userHandGrip.js'","'./userHandGrip.mjs'");fs.writeFileSync(`${out}/${name}.mjs`,code);
}
const {prepareUserModel}=await import(pathToFileURL(path.resolve(out,'userModel.mjs'))),{createUserCharacterRig}=await import(pathToFileURL(path.resolve(out,'userCharacterRig.mjs'))),{createUserHandGrip}=await import(pathToFileURL(path.resolve(out,'userHandGrip.mjs')));
T.TextureLoader.prototype.load=()=>new T.Texture();const bytes=fs.readFileSync('public/assets/user-models/character.fbx');
const rig=createUserCharacterRig(prepareUserModel(new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),'character'));
const grip=createUserHandGrip(rig),position=rig.mesh.geometry.attributes.position,normal=rig.mesh.geometry.attributes.normal,base=Array.from(position.array);grip.apply(.95);
const meta={frames:Object.fromEntries(Object.entries(grip.frames).map(([s,q])=>[s,q.toArray()])),centers:Object.fromEntries(Object.entries(grip.centers).map(([s,v])=>[s,v.clone().applyQuaternion(rig.rest[`${s}Hand`].worldQuaternion).add(rig.rest[`${s}Hand`].worldPosition).toArray()]))};
const result={...meta,base,position:Array.from(position.array),normal:Array.from(normal.array)};
grip.restore();const {UserCharacterMotion}=await import(pathToFileURL(path.resolve(out,'userCharacterMotion.mjs'))),motion=new UserCharacterMotion(rig);
const topology=JSON.parse(fs.readFileSync('artifacts/qa/user-grip/hand-topology.json','utf8'));
const indices=[...new Set([...topology.hands.left.cornerIds,...topology.hands.right.cornerIds])],samples=[];
for(const time of [0,3.5,3.95,4.15,4.28,4.7,5.15]){
 motion.sample(time);rig.root.updateMatrixWorld(true);rig.skeleton.update();
 samples.push({time,shaftFrame:rig.axe.root.getWorldQuaternion(new T.Quaternion()).toArray(),centers:{left:rig.axe.root.localToWorld(rig.axe.grips.upper.clone()).toArray(),right:rig.axe.root.localToWorld(rig.axe.grips.lower.clone()).toArray()},vertices:Object.fromEntries(indices.map(i=>[i,rig.mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(rig.mesh.matrixWorld).toArray()]))});
}
fs.writeFileSync('artifacts/qa/user-grip/corrective-inspection.json',JSON.stringify({...result,samples},null,0));rig.dispose();
