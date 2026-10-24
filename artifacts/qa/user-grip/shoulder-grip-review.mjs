import fs from 'node:fs';
import crypto from 'node:crypto';
import {createServer} from 'vite';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
const server=await createServer({server:{middlewareMode:true},appType:'custom'}),warnings=[];
const snapshots=Object.fromEntries(['userCharacterRig','userCharacterMotion','userHandGrip'].map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(`src/game/world/${name}.ts`)).digest('hex')]));
T.TextureLoader.prototype.load=()=>new T.Texture();console.warn=(...args)=>warnings.push(args.join(' '));
const {prepareUserModel}=await server.ssrLoadModule('/src/game/world/userModel.ts'),{createUserCharacterRig}=await server.ssrLoadModule('/src/game/world/userCharacterRig.ts'),{UserCharacterMotion}=await server.ssrLoadModule('/src/game/world/userCharacterMotion.ts');
const bytes=fs.readFileSync('public/assets/user-models/character.fbx'),rig=createUserCharacterRig(prepareUserModel(new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),''),'character'));
try{
 const geometry=rig.mesh.geometry,position=geometry.getAttribute('position'),ids=geometry.getAttribute('skinIndex'),weights=geometry.getAttribute('skinWeight'),base=Array.from({length:position.count},(_,i)=>new T.Vector3().fromBufferAttribute(position,i)),motion=new UserCharacterMotion(rig),samples=[];
 const upper=new T.Line3(rig.rest.leftUpperArm.worldPosition,rig.rest.leftForeArm.worldPosition);
 for(const time of [0,.8,2.9,3.4,3.9,4.15,4.4,4.7,4.95,5.6]){
  motion.sample(time);const points=base.map((_,i)=>rig.mesh.getVertexPosition(i,new T.Vector3())),pairs=[[13263,13264],[12940,12941],[2563,2564]],probes=pairs.map(([a,b])=>({a,b,ratio:points[a].distanceTo(points[b])/base[a].distanceTo(base[b]),upperProjection:[a,b].map(i=>upper.closestPointToPointParameter(base[i],false)),weights:[a,b].map(i=>Object.fromEntries([0,1,2,3].map(j=>[rig.skeleton.bones[ids.getComponent(i,j)].name,weights.getComponent(i,j)])))}));
  const shoulderEdges=[];
  for(let i=0;i<position.count;i+=3)for(let j=0;j<3;j++){
   const a=i+j,b=i+(j+1)%3,original=base[a].distanceTo(base[b]),y=(base[a].y+base[b].y)/2;if(original<.01||y<1.18||y>1.65)continue;
   const ratio=points[a].distanceTo(points[b])/original;if(ratio>1.8)shoulderEdges.push({a,b,ratio});
  }
  shoulderEdges.sort((a,b)=>b.ratio-a.ratio);samples.push({time,probes,shoulderEdges:shoulderEdges.slice(0,10)});
 }
 const result={date:'2026-10-22',method:'Actual real user FBX, current TS Vite SSR load; CPU skin/geometry only, no browser. Source bind positions copied before corrective application; original hand geometry may be locally corrected by Motion.',snapshots,warnings,samples};
 const output=process.env.TIDAL_SHOULDER_REVIEW??'artifacts/qa/user-grip/shoulder-grip-review.json';fs.writeFileSync(output,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{rig.dispose();await server.close();}
