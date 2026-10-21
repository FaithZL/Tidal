import * as T from 'three';
import type {WorldActor} from './types.js';
import {WorldResources,place,segment} from './resources.js';
const c={skin:0xeac093,shirt:0xe9b65f,denim:0x426f78,boot:0x60513f,bark:0x886044,cream:0xffedc5,gold:0xecc372,green:0x509564};
function contact(parent:T.Object3D,r:WorldResources,w:number,d:number):void{const disk=r.cylinder(1,1,.008,0x455b3d,24,'shadow');disk.scale.set(w,1,d);disk.castShadow=false;disk.receiveShadow=false;place(parent,disk,0,.077,0);}
export class Character3D{
 readonly root=new T.Group();readonly hand=new T.Object3D();private torso=new T.Group();private arms:T.Mesh[]=[];private legs:T.Mesh[]=[];private hands:T.Mesh[]=[];private boots:T.Mesh[]=[];private axe:T.Group;
 constructor(r:WorldResources,robot=false){
  const root=this.root;contact(root,r,.43,.3);root.add(this.torso);
  const torso=this.torso;
  place(torso,r.roundedBox(.55,.62,.36,.09,robot?0xeadfc0:c.shirt,'cloth'),0,1.23,0);
  place(torso,r.roundedBox(.48,.38,.39,.075,robot?0x6e9a8b:c.denim,'cloth'),0,1.05,.015);
  place(torso,r.roundedBox(.34,.29,.065,.035,robot?0x6e9a8b:c.denim,'cloth'),0,1.32,.19);
  for(const x of[-.17,.17]){
   place(torso,r.roundedBox(.065,.34,.05,.018,robot?0x6e9a8b:c.denim,'cloth'),x,1.4,.2);
   place(torso,r.sphere(.032,c.gold),x,1.33,.24);
  }
  place(torso,r.roundedBox(.19,.13,.04,.025,robot?0xf2cb65:0x7e9e9c,'cloth'),0,1.17,.238);
  place(torso,r.cylinder(.1,.12,.16,robot?0x8c9e87:c.skin),0,1.6,0);
  place(torso,r.roundedBox(.48,.47,.42,.115,robot?0xe9e4ca:c.skin),0,1.86,0);
  if(robot){
   place(torso,r.roundedBox(.38,.27,.05,.065,0x294d45),0,1.89,.215);
   for(const x of[-.095,.095]){
    place(torso,r.sphere(.043,0xb8edc0),x,1.92,.254);
    const ear=place(torso,r.cylinder(.065,.065,.075,0x6e9a8b),Math.sign(x)*.264,1.87,0);ear.rotation.z=Math.PI/2;
   }
   place(torso,r.roundedBox(.1,.025,.02,.009,0xc6dbb0),0,1.81,.25);
   place(torso,r.roundedBox(.49,.12,.43,.055,0x6e9a8b),0,2.065,-.015);
   place(torso,r.cylinder(.018,.018,.2,c.bark),0,2.2,0);place(torso,r.sphere(.065,c.gold),0,2.31,0);
  }else{
   place(torso,r.roundedBox(.49,.17,.43,.075,c.bark),0,2.035,-.015);
   for(const x of[-.105,.105]){
    place(torso,r.sphere(.027,0x303d36),x,1.91,.216);
    const ear=place(torso,r.sphere(.065,c.skin),Math.sign(x)*.253,1.865,0);ear.scale.set(.62,1,.85);
    const cheek=place(torso,r.sphere(.042,0xd99478),Math.sign(x)*.145,1.82,.207);cheek.scale.set(1,.65,.28);
    const collar=place(torso,r.roundedBox(.14,.065,.045,.018,c.cream,'cloth'),Math.sign(x)*.09,1.49,.194);collar.rotation.z=Math.sign(x)*.22;
   }
   const nose=place(torso,r.sphere(.052,c.skin),0,1.85,.23);nose.scale.set(.8,.85,1.15);
   place(torso,r.roundedBox(.1,.022,.023,.009,0x996f58),0,1.765,.213);
   place(torso,r.cylinder(.38,.4,.06,c.gold,24),0,2.1,0);
   place(torso,r.cylinder(.24,.29,.25,c.gold,16,'cloth'),0,2.25,0);
   place(torso,r.cylinder(.27,.29,.055,c.bark,16,'cloth'),0,2.14,0);
   const leaf=place(torso,r.sphere(.09,c.green),.23,2.28,.04);leaf.scale.set(.45,1,.6);
  }
  for(let i=0;i<4;i++)this.arms.push(place(root,r.cylinder(i%2?.065:.09,i%2?.07:.095,1,i%2?(robot?0xe9e4ca:c.skin):(robot?0x769e8c:c.shirt),12,i%2?'solid':'cloth'),0,0,0));
  for(let i=0;i<4;i++)this.legs.push(place(root,r.cylinder(.095,.105,1,robot?0x6e9a8b:c.denim,12,'cloth'),0,0,0));
  for(const x of[-.18,.18]){
   this.hands.push(place(root,r.sphere(.09,robot?0xe7dec0:c.cream,'cloth'),x,0,0));
   const boot=place(root,r.roundedBox(.23,.17,.38,.05,c.boot),x,.09,.08);this.boots.push(boot);
   place(boot,r.roundedBox(.245,.04,.395,.018,0x394b3f),0,-.065,0);
  }
  root.add(this.hand);this.axe=new T.Group();
  place(this.axe,r.cylinder(.026,.035,.9,0x9a6b3f,12,'wood'),0,.24,0);
  place(this.axe,r.roundedBox(.28,.21,.08,.025,0x9daeb2),.1,.65,0);place(this.axe,r.box(.045,.25,.09,0xd1dddc),.245,.65,0);
  this.hands[1].add(this.axe);this.axe.visible=false;
  root.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=!(o.material instanceof T.MeshLambertMaterial&&o.material.transparent);});
 }
 update(actor:WorldActor,chopping:boolean):void{
  const {position:p,yaw,mode,pose,stride}=actor;this.root.position.set(p.x,p.y,p.z);this.root.rotation.y=yaw;
  const squat=mode==='work'&&pose==='squat-down'?.42:0;
  this.torso.position.y=-squat;const moving=['walk','push','pull'].includes(mode),step=moving?Math.sin(stride)*.25:0;
  const vector=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
  for(let i=0;i<2;i++){
   const sign=i?1:-1,x=sign*.18,z=step*sign;
   const hip=vector(x,.95-squat,0),knee=vector(x,.48-squat*.5,squat? .4:z*.55),ankle=vector(x,.16,z);
   segment(this.legs[i*2],hip,knee);segment(this.legs[i*2+1],knee,ankle);this.boots[i].position.set(x,.09,z+.08);
  }
  let hy=1.05-squat,hz=.23;
  if(mode==='push'){hy=1.04;hz=.5;}
  else if(mode==='pull'){hy=1.04;hz=-.55;}
  else if(mode==='secure'){hy=1.85;hz=.5;}
  else if(mode==='celebrate'){hy=2.25;hz=.1;}
  else if(mode==='work'){
   if(chopping){hy=pose==='ready'?2.3:pose==='chop-down'?.85:1.7;hz=pose==='chop-down'?.85:.38;}
   else{hy=pose==='squat-down'?.45:pose==='stand-up'?1.55:pose==='press-up'?2.35:pose==='load-return'?1.65:1.05;hz=pose==='squat-down'?.55:.48;}
  }
  for(let i=0;i<2;i++){
   const sign=i?1:-1,x=sign*.3;const shoulder=vector(x,1.5-squat,0);
   const hand=vector(x,hy,hz+(moving&&mode==='walk'?Math.sin(stride+sign)*.1:0));
   const elbow=shoulder.clone().lerp(hand,.48);elbow.x+=sign*.1;elbow.z+=.1;
   segment(this.arms[i*2],shoulder,elbow);segment(this.arms[i*2+1],elbow,hand);this.hands[i].position.copy(hand);
  }
  this.hand.position.set(0,hy,hz);this.axe.visible=chopping&&mode==='work';
  this.root.updateMatrixWorld(true);
 }
 handPosition():T.Vector3{return this.hand.getWorldPosition(new T.Vector3());}
}
export function makeLog(r:WorldResources):T.Group{
 const g=new T.Group();const bark=place(g,r.cylinder(.16,.17,.86,0x9a683c,12,'bark'),0,0,0);bark.rotation.z=Math.PI/2;
 for(const x of[-.435,.435]){
  const cut=place(g,r.cylinder(.145,.145,.012,0xf1cf8e,16,'endgrain'),x,0,0);cut.rotation.z=Math.PI/2;
 }
 g.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=true;});return g;
}
export function makeCart(r:WorldResources):{root:T.Group;wheels:T.Group[];ropes:T.Mesh[]}{
 const root=new T.Group();contact(root,r,1.1,.75);
 place(root,r.roundedBox(1.6,.16,1.1,.035,0x805a38,'wood'),0,.63,0);
 for(let i=0;i<5;i++)place(root,r.roundedBox(.29,.04,1.08,.015,0xba8c4d,'wood'),-.62+i*.31,.74,0);
 for(const z of[-.57,.57]){
  for(let i=0;i<3;i++)place(root,r.roundedBox(1.75,.1,.06,.02,0xad8050,'wood'),0,.86+i*.19,z);
  for(const x of[-.77,.77])place(root,r.roundedBox(.08,.7,.09,.025,0x715c3e,'wood'),x,.95,z);
  const brace=place(root,r.roundedBox(1.08,.065,.045,.018,0x718d76,'wood'),0,1.05,z*1.08);brace.rotation.z=z<0?.32:-.32;
 }
 for(const z of[-.35,.35]){
  const handle=place(root,r.roundedBox(.7,.075,.075,.025,0x7d5b39,'wood'),.8,.92,z);handle.rotation.z=.16;
  place(root,r.cylinder(.052,.052,.25,0x485443,12,'cloth'),1.05,1.04,z).rotation.z=Math.PI/2;
 }
 const wheels:T.Group[]=[];
 for(const z of[-.75,.75]){
  const wheel=place(root,new T.Group(),-.23,.38,z);wheels.push(wheel);
  const tire=place(wheel,r.cylinder(.35,.35,.16,0x3f5142,20),0,0,0);tire.rotation.x=Math.PI/2;
  const rim=place(wheel,r.cylinder(.26,.26,.18,0xc7a36a,16,'wood'),0,0,0);rim.rotation.x=Math.PI/2;
  const hub=place(wheel,r.cylinder(.07,.07,.22,0x667665,12),0,0,0);hub.rotation.x=Math.PI/2;
  for(let a=0;a<3;a++)place(wheel,r.roundedBox(.045,.49,.2,.018,0x6e7c68,'wood'),0,0,0).rotation.z=a*Math.PI/3;
 }
 const ropes:T.Mesh[]=[];
 for(const x of[-.52,.52]){
  const points=[new T.Vector3(x,.68,-.62),new T.Vector3(x,1.66,-.52),new T.Vector3(x,1.7,.5),new T.Vector3(x,.68,.62),new T.Vector3(x,.68,-.62)];
  for(let i=1;i<points.length;i++){const rope=r.cylinder(.03,.03,1,0xa68b5a,6,'cloth');segment(rope,points[i-1],points[i]);root.add(rope);ropes.push(rope);}
  const knot=place(root,r.sphere(.075,0xa68b5a,'cloth'),x,1.7,.1);knot.scale.set(1,.75,1.15);ropes.push(knot);
 }
 return{root,wheels,ropes};
}
export function makePine(r:WorldResources,size=1):{root:T.Group;crown:T.Group;trunk:T.Mesh}{
 const root=new T.Group(),crown=new T.Group();root.add(crown);
 const trunk=place(root,r.cylinder(.16,.25,2,0x896344,10,'bark'),0,1,0);
 // Four overhanging tiers share one small geometry; alternating bough tips break up the perfect-cone silhouette.
 const foliage=r.geometry('pine-lobed-tier-v2',()=>{
  const positions:number[]=[],indices:number[]=[],sides=10;
  const levels=[{y:0,r:.55},{y:.12,r:1},{y:.52,r:.62},{y:.8,r:.3},{y:1,r:.035}];
  for(const level of levels)for(let i=0;i<sides;i++){
   const angle=i*Math.PI*2/sides,reach=level.r*(i%2?.84:1);
   positions.push(Math.cos(angle)*reach,level.y,Math.sin(angle)*reach);
  }
  for(let ring=0;ring<levels.length-1;ring++)for(let i=0;i<sides;i++){
   const a=ring*sides+i,b=ring*sides+(i+1)%sides,c=a+sides,d=b+sides;
   indices.push(a,c,b,b,c,d);
  }
  for(let i=1;i<sides-1;i++){indices.push(0,i,(i+1)%sides);const top=(levels.length-1)*sides;indices.push(top,top+i+1,top+i);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
 });
 const tiers=[{y:.9,r:1.25,h:1.65,c:0x3e704e},{y:1.65,r:1.08,h:1.65,c:0x4b8255},{y:2.4,r:.81,h:1.55,c:0x62975d},{y:3.1,r:.53,h:1.25,c:0x80a96a}];
 tiers.forEach((tier,i)=>{const branch=place(crown,r.mesh(foliage,tier.c),i%2?.025:-.025,tier.y,0);branch.scale.set(tier.r,tier.h,tier.r*.93);branch.rotation.y=i*.55;branch.castShadow=true;branch.receiveShadow=false;});
 root.scale.setScalar(size);return{root,crown,trunk};
}
