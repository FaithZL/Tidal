import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Character3D,makeCart,makeLog} from './models.js';
import {NprPalette,type NprSurface} from './nprMaterials.js';
import {NprMotion} from './nprMotion.js';
import {WorldResources,place,segment} from './resources.js';
import type {WorldActor} from './types.js';

type Ring={y:number;x:number;z:number;cx?:number;cz?:number};
/** Elliptical cross-sections keep silhouettes continuous instead of stacking toy blocks. */
function sculpt(r:WorldResources,key:string,rings:Ring[],sides=16):T.BufferGeometry{
 return r.geometry(`npr-${key}`,()=>{
  const vertices:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let j=0;j<rings.length;j++)for(let i=0;i<=sides;i++){
   const a=i/sides*Math.PI*2,ring=rings[j];
   vertices.push(Math.cos(a)*ring.x+(ring.cx??0),ring.y,Math.sin(a)*ring.z+(ring.cz??0));uv.push(i/sides,j/(rings.length-1));
  }
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<sides;i++){
   const a=j*(sides+1)+i,b=a+1,c=a+sides+1,d=c+1;indices.push(a,c,b,b,c,d);
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
 });
}
function shaped(g:T.BufferGeometry,p:NprPalette,color:number,surface:NprSurface='solid',vertexColors=false):T.Mesh{
 const mesh=new T.Mesh(g,p.material(color,surface,vertexColors));mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}
function solid(r:WorldResources,p:NprPalette,radius:number,color:number):T.Mesh{return shaped(r.geometry(`npr-sphere-${radius}`,()=>new T.SphereGeometry(radius,12,8)),p,color);}
function repaint(root:T.Object3D,p:NprPalette,surface:NprSurface):void{
 root.traverse(object=>{
  if(!(object instanceof T.Mesh)||!(object.material instanceof T.MeshLambertMaterial)||object.material.transparent)return;
  object.material=p.material(object.material.color.getHex(),object.material.map?surface:'solid');
 });
}

type Detail={geometry:T.BufferGeometry;position:[number,number,number];scale?:[number,number,number];rotation?:[number,number,number]};
/** Bake small collar / face / hair details by material, rather than drawing every button separately. */
function details(r:WorldResources,p:NprPalette,key:string,color:number,parts:Detail[],surface:NprSurface='solid'):T.Mesh{
 return shaped(r.geometry(`npr-detail-${key}`,()=>{
  const geometries=parts.map(part=>{
   const matrix=new T.Matrix4().compose(new T.Vector3(...part.position),new T.Quaternion().setFromEuler(new T.Euler(...part.rotation??[0,0,0])),new T.Vector3(...part.scale??[1,1,1]));
   return (part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone()).applyMatrix4(matrix);
  });
  const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
  if(!merged)throw new Error(`Cannot assemble farmer detail ${key}`);return merged;
 }),p,color,surface);
}

/** A small owned surface bends continuously through the elbow/knee; it has no open joining rings. */
class BentSurface{
 readonly mesh:T.Mesh;
 private curve=new T.CatmullRomCurve3([new T.Vector3(),new T.Vector3(),new T.Vector3()],false,'centripetal');
 private center=new T.Vector3();private tangent=new T.Vector3();private side=new T.Vector3();private front=new T.Vector3();
 constructor(r:WorldResources,p:NprPalette,owner:string,name:string,private rings:Ring[],color:number,surface:NprSurface='solid',private sides=12){
  // Animated vertices cannot be shared by independently posed actors. Ownership/disposal still belongs to WorldResources.
  const geometry=r.geometry(`npr-bend-${owner}-${name}`,()=>sculpt(r,`bend-template-${name}`,rings,sides).clone());
  this.mesh=shaped(geometry,p,color,surface);this.mesh.name=`npr-farmer-${name}`;
 }
 bend(a:T.Vector3,b:T.Vector3,c:T.Vector3):void{
  this.curve.points[0].copy(a);this.curve.points[1].copy(b);this.curve.points[2].copy(c);
  const position=this.mesh.geometry.getAttribute('position');
  this.rings.forEach((ring,j)=>{
   this.curve.getPoint(ring.y,this.center);this.curve.getTangent(ring.y,this.tangent);
   // All authored poses keep limbs roughly vertical or forward; X is a stable width axis through raised and squatting poses.
   this.side.set(1,0,0).addScaledVector(this.tangent,-this.tangent.x).normalize();this.front.crossVectors(this.side,this.tangent).normalize();
   for(let i=0;i<=this.sides;i++){
    const angle=i/this.sides*Math.PI*2,x=Math.cos(angle)*ring.x,z=Math.sin(angle)*ring.z;
    position.setXYZ(j*(this.sides+1)+i,this.center.x+this.side.x*x+this.front.x*z,this.center.y+this.side.y*x+this.front.y*z,this.center.z+this.side.z*x+this.front.z*z);
   }
  });
  position.needsUpdate=true;this.mesh.geometry.computeVertexNormals();this.mesh.geometry.computeBoundingBox();this.mesh.geometry.computeBoundingSphere();
 }
}

function openHair(r:WorldResources):T.BufferGeometry{
 return r.geometry('npr-farmer-open-hair-v3',()=>{
  const positions:number[]=[],uv:number[]=[],indices:number[]=[],sides=24,levels=5;
  for(let j=0;j<levels;j++)for(let i=0;i<=sides;i++){
   const angle=i/sides*Math.PI*2,front=Math.max(0,Math.sin(angle)),t=j/(levels-1);
   const hairline=1.875+.17*Math.pow(front,.65)+.05*(1-Math.abs(Math.sin(angle)))+.008*Math.cos(angle);
   const radius=[1,1.065,.92,.61,.015][j];
   positions.push(Math.cos(angle)*.171*radius-.008*t,hairline+(2.18-hairline)*t,Math.sin(angle)*.15*radius-.018);
   uv.push(i/sides,t);
  }
  for(let j=0;j<levels-1;j++)for(let i=0;i<sides;i++){
   const a=j*(sides+1)+i,b=a+1,c=a+sides+1,d=c+1;indices.push(a,c,b,b,c,d);
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
 });
}

/** Local art sample only: presentation poses and hand anchors match the established choreography. */
export class NprCharacter3D{
 readonly root:T.Group;readonly hand:T.Object3D;private torso=new T.Group();private bodyPivot=new T.Group();private headPivot=new T.Group();
 private arms:BentSurface[]=[];private sleeves:BentSurface[]=[];private legs:BentSurface[]=[];private cuffs:T.Mesh[]=[];private hands:T.Mesh[]=[];private boots:T.Mesh[]=[];
 private axe?:T.Group;private robot?:Character3D;private lastPoseKey='';private motion=new NprMotion();private revision=0;
 get animating():boolean{return !this.robot&&this.motion.animating;}
 get visualRevision():number{return this.revision;}
 constructor(r:WorldResources,p:NprPalette,robot=false){
  if(robot){this.robot=new Character3D(r,true);this.root=this.robot.root;this.hand=this.robot.hand;repaint(this.root,p,'cloth');return;}
  this.root=new T.Group();this.hand=new T.Object3D();const root=this.root,torso=this.torso;
  this.bodyPivot.name='npr-farmer-body-pivot';this.bodyPivot.position.y=.98;torso.position.y=-.98;this.bodyPivot.add(torso);root.add(this.bodyPivot,this.hand);
  const shadow=place(root,r.cylinder(1,1,.008,0x455b3d,24,'shadow'),0,.077,0);shadow.scale.set(.4,1,.27);shadow.castShadow=false;shadow.receiveShadow=false;
  const shirtColor=0xe7ddc2,skin=0xe7b895,trouserColor=0x686552,leather=0x75533b;
  const shirt=place(torso,shaped(sculpt(r,'farmer-shirt-v3',[
   {y:-.29,x:.19,z:.128},{y:-.245,x:.211,z:.143},{y:-.17,x:.223,z:.155},{y:.015,x:.251,z:.165},
   {y:.145,x:.291,z:.155},{y:.205,x:.303,z:.132},{y:.255,x:.221,z:.113},{y:.29,x:.083,z:.075},
  ]),p,shirtColor,'cloth'),0,1.265,0);shirt.name='npr-farmer-shirt';
  const waist=place(torso,shaped(sculpt(r,'farmer-waist-v3',[
   {y:-.16,x:.185,z:.125},{y:-.08,x:.222,z:.149},{y:.08,x:.218,z:.146},{y:.125,x:.20,z:.13},
  ]),p,trouserColor,'cloth'),0,.965,.005);waist.name='npr-farmer-trousers';
  const belt=place(torso,shaped(sculpt(r,'farmer-belt-v3',[
   {y:-.033,x:.217,z:.147},{y:-.023,x:.225,z:.153},{y:.024,x:.224,z:.151},{y:.034,x:.216,z:.146},
  ]),p,leather),0,1.008,.006);belt.name='npr-farmer-belt';belt.rotation.z=-.035;
  const rounded=(w:number,h:number,d:number,radius=.008):T.BufferGeometry=>r.roundedBox(w,h,d,radius,shirtColor).geometry;
  const sphere=r.geometry('npr-farmer-detail-sphere',()=>new T.SphereGeometry(1,12,8));
  const collarParts:Detail[]=[];
  for(const sign of[-1,1])collarParts.push({geometry:rounded(.10,.103,.025),position:[sign*.077,1.515,.111],rotation:[.15,0,sign*-.40]});
  collarParts.push({geometry:rounded(.028,.35,.015,.005),position:[0,1.292,.159],rotation:[-.025,0,-.025]},
   {geometry:rounded(.104,.024,.016,.005),position:[-.125,1.352,.145],rotation:[0,.12,.05]});
  const collar=details(r,p,'shirt-collar-v3',0xf1e6c9,collarParts,'cloth');collar.name='npr-farmer-collar';torso.add(collar);
  const fold=sculpt(r,'shirt-fold-v3',[{y:-.5,x:.003,z:.005},{y:-.25,x:.014,z:.008},{y:.25,x:.009,z:.008},{y:.5,x:.001,z:.002}],8);
  const folds=details(r,p,'shirt-folds-v3',0xc3b99d,[
   {geometry:fold,position:[-.16,1.105,.129],scale:[1,.14,1],rotation:[0,0,-.5]},
   {geometry:fold,position:[.16,1.135,.143],scale:[1,.17,1],rotation:[0,0,.45]},
   {geometry:fold,position:[-.205,1.345,.095],scale:[.8,.12,.8],rotation:[0,0,-.6]},
  ],'cloth');torso.add(folds);
  const scarf=details(r,p,'scarf-v3',0xa9573d,[
   {geometry:sculpt(r,'scarf-wrap-v3',[{y:-.034,x:.095,z:.091},{y:.005,x:.103,z:.086},{y:.04,x:.079,z:.075}],16),position:[0,1.575,-.006]},
   {geometry:sculpt(r,'scarf-tail-v3',[{y:-.12,x:.012,z:.014,cx:.018},{y:-.04,x:.049,z:.013},{y:.10,x:.035,z:.01}],10),position:[-.115,1.474,-.104],rotation:[-.18,0,-.28]},
  ],'cloth');scarf.name='npr-farmer-scarf';torso.add(scarf);
  const pouch=place(torso,shaped(sculpt(r,'farmer-pouch-v3',[
   {y:-.11,x:.053,z:.026},{y:-.08,x:.078,z:.052},{y:.065,x:.075,z:.048},{y:.095,x:.063,z:.032},
  ],12),p,leather),.245,.91,.095);pouch.name='npr-farmer-pouch';pouch.rotation.z=.12;
  const leatherDetails=details(r,p,'leather-details-v3',0x8d6848,[
   {geometry:rounded(.139,.072,.028,.012),position:[.247,.966,.139],rotation:[-.15,0,.12]},
   {geometry:rounded(.05,.11,.014),position:[-.12,1.0,.144],rotation:[0,0,-.05]},
   {geometry:rounded(.042,.11,.014),position:[.13,1.0,.144],rotation:[0,0,-.05]},
   {geometry:rounded(.048,.25,.023),position:[-.18,1.407,-.132],rotation:[0,-.12,-.18]},
   {geometry:rounded(.048,.25,.023),position:[.18,1.407,-.132],rotation:[0,.12,.18]},
  ]);torso.add(leatherDetails);
  const buckles:Detail[]=[{geometry:rounded(.067,.055,.016,.005),position:[.018,1.012,.161]},
   {geometry:sphere,position:[.251,.957,.161],scale:[.012,.012,.005]}];
  for(const y of[1.16,1.27,1.38])buckles.push({geometry:sphere,position:[.002,y,.177],scale:[.009,.009,.004]});
  torso.add(details(r,p,'brass-buttons-v3',0xc8ac6c,buckles));
  place(torso,shaped(sculpt(r,'farmer-neck-v3',[{y:-.08,x:.074,z:.071},{y:.10,x:.068,z:.068}]),p,skin),0,1.641,-.002);
  const headPartsStart=torso.children.length;
  const head=place(torso,shaped(sculpt(r,'farmer-head-v3',[
   {y:-.19,x:.042,z:.053,cz:.025},{y:-.155,x:.098,z:.094,cz:.019},{y:-.075,x:.139,z:.126,cz:.003},
   {y:.045,x:.151,z:.137,cz:-.006},{y:.12,x:.139,z:.126,cz:-.011},{y:.177,x:.082,z:.077,cz:-.014},{y:.185,x:.015,z:.017,cz:-.014},
  ],20),p,skin),0,1.9,0);head.name='npr-farmer-head';
  const hair=shaped(openHair(r),p,0x704d35);hair.name='npr-farmer-hair';torso.add(hair);
  const tuft=sculpt(r,'farmer-hair-tuft-v3',[
   {y:-.07,x:.003,z:.004,cx:-.013},{y:-.025,x:.034,z:.023,cx:-.008},{y:.03,x:.043,z:.032},{y:.07,x:.02,z:.019,cx:.01},
  ],10),tufts:Detail[]=[];
  // Side/back tufts interrupt the silhouette. Front locks stay at the temples, leaving the central brow open.
  for(let i=0;i<9;i++){
   const a=Math.PI*.7+i*Math.PI*1.6/8;
   tufts.push({geometry:tuft,position:[Math.cos(a)*.145,2.00+(i%3)*.025,Math.sin(a)*.125-.018],scale:[1,1.12,1],rotation:[Math.sin(a)*.32,0,Math.cos(a)*-.52]});
  }
  tufts.push({geometry:tuft,position:[-.111,2.083,.105],scale:[1.15,1.10,.9],rotation:[-.28,.12,-.76]},
   {geometry:tuft,position:[.137,2.034,.074],scale:[.8,1.25,.8],rotation:[-.25,-.12,.36]},
   {geometry:tuft,position:[-.055,2.148,-.025],scale:[.8,.82,.85],rotation:[0,0,-.70]});
  const hairTufts=details(r,p,'hair-tufts-v3',0x704d35,tufts);hairTufts.name='npr-farmer-hair-tufts';torso.add(hairTufts);
  const ears:Detail[]=[],eyeWhites:Detail[]=[],pupils:Detail[]=[],faceLines:Detail[]=[];
  for(const sign of[-1,1]){
   ears.push({geometry:sphere,position:[sign*.153,1.872,.002],scale:[.023,.039,.027]});
   eyeWhites.push({geometry:sphere,position:[sign*.058,1.925,.134],scale:[.027,.015,.010]});
   pupils.push({geometry:sphere,position:[sign*.058,1.925,.144],scale:[.010,.013,.0045]});
   faceLines.push({geometry:rounded(.048,.008,.009,.003),position:[sign*.059,1.959,.128],rotation:[0,0,sign*-.09]});
  }
  torso.add(details(r,p,'ears-v3',0xddad88,ears));
  const whites=details(r,p,'eye-whites-v3',0xf5edda,eyeWhites);whites.name='npr-farmer-eye-whites';torso.add(whites);
  const irises=details(r,p,'eye-irises-v3',0x514737,pupils);irises.name='npr-farmer-eye-irises';torso.add(irises);
  const brows=details(r,p,'brows-v3',0x76533b,faceLines);torso.add(brows);
  const nose=place(torso,shaped(sculpt(r,'farmer-nose-v3',[
   {y:-.020,x:.011,z:.014,cz:.004},{y:-.009,x:.018,z:.025,cz:.007},{y:.024,x:.007,z:.010},
  ],10),p,0xddac87),0,1.886,.139);nose.rotation.x=-.10;
  const mouth=place(torso,r.roundedBox(.042,.005,.008,.002,0xa77b64),0,1.823,.136);mouth.name='npr-farmer-mouth';repaint(mouth,p,'solid');
  const headParts=torso.children.slice(headPartsStart);this.headPivot.name='npr-farmer-head-pivot';this.headPivot.position.y=1.66;torso.add(this.headPivot);
  for(const part of headParts){part.position.y-=1.66;this.headPivot.add(part);}
  const armProfile:Ring[]=[{y:0,x:.068,z:.064},{y:.12,x:.083,z:.072},{y:.27,x:.080,z:.069},{y:.40,x:.071,z:.066},{y:.5,x:.072,z:.066},{y:.60,x:.073,z:.067},{y:.75,x:.063,z:.058},{y:.9,x:.050,z:.046},{y:1,x:.045,z:.044}];
  const sleeveProfile:Ring[]=[{y:0,x:.102,z:.099},{y:.09,x:.128,z:.115},{y:.20,x:.131,z:.119},{y:.32,x:.121,z:.110},{y:.40,x:.108,z:.101},{y:.44,x:.113,z:.106},{y:.47,x:.112,z:.104},{y:.49,x:.095,z:.091}];
  const legProfile:Ring[]=[{y:0,x:.107,z:.108},{y:.12,x:.123,z:.121},{y:.25,x:.124,z:.12},{y:.38,x:.109,z:.103},{y:.5,x:.101,z:.101},{y:.62,x:.104,z:.107},{y:.76,x:.099,z:.097},{y:.88,x:.083,z:.084},{y:1,x:.072,z:.076}];
  const cuffGeometry=sculpt(r,'farmer-cuff-v3',[{y:-.5,x:.084,z:.086},{y:-.34,x:.094,z:.096},{y:.34,x:.096,z:.097},{y:.5,x:.087,z:.089}],12);
  for(let i=0;i<2;i++){
   const side=i?'right':'left',x=(i?1:-1)*.18;
   const arm=new BentSurface(r,p,root.uuid,`arm-${side}`,armProfile,skin),sleeve=new BentSurface(r,p,root.uuid,`sleeve-${side}`,sleeveProfile,shirtColor,'cloth');
   const leg=new BentSurface(r,p,root.uuid,`leg-${side}`,legProfile,trouserColor,'cloth');
   this.arms.push(arm);this.sleeves.push(sleeve);this.legs.push(leg);root.add(arm.mesh,sleeve.mesh,leg.mesh);
   this.cuffs.push(place(root,shaped(cuffGeometry,p,0xb6ad8f,'cloth'),x,.3,0));
   const hand=place(root,solid(r,p,.073,skin),x,0,0);hand.scale.set(.84,1.03,.7);hand.name=`npr-farmer-hand-${side}`;this.hands.push(hand);
   const boot=place(root,shaped(sculpt(r,'farmer-boot-v3',[
    {y:-.13,x:.093,z:.15,cz:.037},{y:-.10,x:.101,z:.159,cz:.042},{y:-.06,x:.092,z:.146,cz:.036},
    {y:.005,x:.081,z:.103,cz:.011},{y:.12,x:.077,z:.081,cz:-.014},{y:.15,x:.084,z:.087,cz:-.012},
   ],14),p,0x684a35),x,.16,.035);boot.name=`npr-farmer-boot-${side}`;this.boots.push(boot);
  }
  this.axe=new T.Group();place(this.axe,r.cylinder(.022,.027,.9,0x9d8056,12,'wood'),0,.24,0);
  place(this.axe,r.roundedBox(.25,.19,.055,.018,0x82938f),.105,.65,0);place(this.axe,r.box(.035,.21,.06,0xb9c4bc),.24,.65,0);repaint(this.axe,p,'wood');
  this.hands[1].add(this.axe);this.axe.visible=false;
 }
 /** Omit delta for an explicit authored snapshot/reset; observed deltas animate locally, zero freezes the pose. */
 update(actor:WorldActor,chopping:boolean,deltaMs?:number):void{
  if(this.robot){
   const key=JSON.stringify(actor);
   if(key!==this.lastPoseKey){this.robot.update(actor,chopping);this.lastPoseKey=key;this.revision++;}return;
  }
  const {position:p,yaw}=actor;this.root.position.set(p.x,p.y,p.z);this.root.rotation.y=yaw;
  const f=this.motion.advance(actor,chopping,deltaMs),key=JSON.stringify(f);
  if(key===this.lastPoseKey){this.root.updateMatrixWorld(true);return;}this.lastPoseKey=key;this.revision++;
  this.bodyPivot.position.set(f.hipX,.98-f.squat+f.rise,f.hipZ);this.bodyPivot.rotation.set(f.lean,f.twist,f.roll);this.bodyPivot.updateMatrix();
  this.headPivot.rotation.set(f.headPitch,f.headYaw,-f.roll*.3);
  for(let i=0;i<2;i++){
   const sign=i?1:-1,x=sign*.18,z=f.step[i],boot=this.boots[i],angle=f.footPitch[i];
   if(!boot.geometry.boundingBox)boot.geometry.computeBoundingBox();const bounds=boot.geometry.boundingBox!;
   const minRotated=bounds.min.y*Math.cos(angle)-(angle>=0?bounds.max.z:bounds.min.z)*Math.sin(angle),bootY=.03-minRotated+f.lift[i];
   boot.position.set(x,bootY,z+.035);boot.rotation.x=angle;
   const hip=new T.Vector3(x,.95-.98,0).applyMatrix4(this.bodyPivot.matrix);
   const knee=new T.Vector3(x+f.hipX*.45,.48-f.squat*.5+f.rise*.5,f.squat/.42*.4+z*.55+f.hipZ*.2),ankle=new T.Vector3(x,bootY+.035*Math.sin(angle),z+.035-.035*Math.cos(angle));
   this.legs[i].bend(hip,knee,ankle);
   segment(this.cuffs[i],ankle.clone().lerp(knee,.33),ankle.clone().lerp(knee,.49));
  }
  for(let i=0;i<2;i++){
   const sign=i?1:-1,x=sign*.3,shoulder=new T.Vector3(x,1.5-.98,0).applyMatrix4(this.bodyPivot.matrix),hand=new T.Vector3(x,f.handY,f.handZ+f.handSwing[i]);
   const elbow=shoulder.clone().lerp(hand,.48);elbow.x+=sign*f.elbowOut;elbow.y+=f.elbowLift;elbow.z+=.1;
   this.arms[i].bend(shoulder,elbow,hand);this.sleeves[i].bend(shoulder,elbow,hand);this.hands[i].position.copy(hand);
  }
  this.hand.position.copy(this.hands[0].position).add(this.hands[1].position).multiplyScalar(.5);
  if(this.axe){this.axe.visible=f.toolVisible;this.axe.rotation.set(f.axePitch,0,f.axeRoll);}this.root.updateMatrixWorld(true);
 }
 handPosition():T.Vector3{return this.hand.getWorldPosition(new T.Vector3());}
}

export function makeNprCart(r:WorldResources,p:NprPalette):ReturnType<typeof makeCart>{
 const cart=makeCart(r);repaint(cart.root,p,'wood');cart.ropes.forEach(rope=>{rope.material=p.material(0xa68b5a,'cloth');});return cart;
}
export function makeNprLog(r:WorldResources,p:NprPalette):T.Group{const log=makeLog(r);repaint(log,p,'bark');for(const face of log.children)if(face instanceof T.Mesh&&Math.abs(face.position.x)>.42)face.material=p.material(0xcab082,'wood');return log;}

export {makeNprTree} from './nprVegetation.js';
