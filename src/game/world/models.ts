import * as T from 'three';
import type {WorldActor} from './types.js';
import {WorldResources,place,segment} from './resources.js';
const c={skin:0xeac093,shirt:0xe9b65f,denim:0x426f78,boot:0x60513f,bark:0x886044,cream:0xffedc5,gold:0xecc372,green:0x509564};
function contact(parent:T.Object3D,r:WorldResources,w:number,d:number):void{const disk=r.cylinder(1,1,.008,0x657c46,24);disk.scale.set(w,1,d);place(parent,disk,0,.012,0);}
export class Character3D{
 readonly root=new T.Group();readonly hand=new T.Object3D();private torso=new T.Group();private arms:T.Mesh[]=[];private legs:T.Mesh[]=[];private hands:T.Mesh[]=[];private boots:T.Mesh[]=[];private axe:T.Group;
 constructor(r:WorldResources,robot=false){
  const root=this.root;contact(root,r,.43,.3);root.add(this.torso);
  const torso=this.torso;
  place(torso,r.box(.55,.62,.34,robot?0xeadfc0:c.shirt),0,1.23,0);
  place(torso,r.box(.46,.38,.37,robot?0x6e9a8b:c.denim),0,1.05,.015);
  for(const x of[-.17,.17]){place(torso,r.box(.07,.34,.045,c.denim),x,1.4,.2);place(torso,r.sphere(.032,c.gold),x,1.33,.24);}
  place(torso,r.box(.19,.13,.035,robot?0xf2cb65:0x7e9e9c),0,1.12,.22);
  place(torso,r.cylinder(.11,.13,.16,c.skin),0,1.6,0);
  place(torso,r.box(.46,.44,.4,robot?0xe9e4ca:c.skin),0,1.86,0);
  if(robot){
   place(torso,r.box(.37,.24,.035,0x294d45),0,1.9,.215);
   for(const x of[-.095,.095])place(torso,r.sphere(.047,0xa5edba),x,1.92,.25);
   place(torso,r.cylinder(.018,.018,.2,c.bark),0,2.15,0);place(torso,r.sphere(.065,c.gold),0,2.26,0);
  }else{
   place(torso,r.box(.48,.16,.41,c.bark),0,2.04,-.01);
   for(const x of[-.09,.09])place(torso,r.sphere(.025,0x303d36),x,1.9,.215);
   place(torso,r.box(.1,.018,.02,0x996f58),0,1.76,.215);
   place(torso,r.cylinder(.38,.4,.06,c.gold,24),0,2.1,0);
   place(torso,r.cylinder(.24,.29,.25,c.gold,16),0,2.25,0);
   place(torso,r.cylinder(.27,.29,.055,c.bark,16),0,2.14,0);
   const leaf=place(torso,r.sphere(.09,c.green),.23,2.28,.04);leaf.scale.set(.45,1,.6);
  }
  for(let i=0;i<4;i++)this.arms.push(place(root,r.cylinder(.065,.07,1,robot?0x769e8c:c.skin),0,0,0));
  for(let i=0;i<4;i++)this.legs.push(place(root,r.cylinder(.095,.105,1,c.denim),0,0,0));
  for(const x of[-.18,.18]){
   this.hands.push(place(root,r.sphere(.085,robot?0xe7dec0:c.skin),x,0,0));
   this.boots.push(place(root,r.box(.22,.16,.37,c.boot),x,.09,.08));
  }
  root.add(this.hand);this.axe=new T.Group();
  place(this.axe,r.cylinder(.026,.035,.9,0x9a6b3f),0,.24,0);
  place(this.axe,r.box(.28,.21,.08,0x9daeb2),.1,.65,0);place(this.axe,r.box(.045,.25,.09,0xd1dddc),.245,.65,0);
  this.hands[1].add(this.axe);this.axe.visible=false;
  root.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=true;});
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
 const g=new T.Group();const bark=place(g,r.cylinder(.16,.17,.86,0x9a683c,12),0,0,0);bark.rotation.z=Math.PI/2;
 for(const x of[-.435,.435]){
  const cut=place(g,r.cylinder(.145,.145,.012,0xf1cf8e,16),x,0,0);cut.rotation.z=Math.PI/2;
  const ring=place(g,r.cylinder(.085,.085,.014,0xd1a76b,12),x*1.02,0,0);ring.rotation.z=Math.PI/2;
 }
 g.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=true;});return g;
}
export function makeCart(r:WorldResources):{root:T.Group;wheels:T.Group[];ropes:T.Mesh[]}{
 const root=new T.Group();contact(root,r,1.1,.75);
 place(root,r.box(1.6,.16,1.1,0x805a38),0,.63,0);
 for(let i=0;i<5;i++)place(root,r.box(.29,.04,1.08,0xba8c4d),-.62+i*.31,.74,0);
 for(const z of[-.57,.57]){
  for(let i=0;i<3;i++)place(root,r.box(1.75,.1,.06,0xad8050),0,.86+i*.19,z);
  for(const x of[-.77,.77])place(root,r.box(.08,.7,.09,0x715c3e),x,.95,z);
 }
 for(const z of[-.35,.35]){
  const handle=place(root,r.box(.7,.075,.075,0x7d5b39),.8,.92,z);handle.rotation.z=.16;
  place(root,r.cylinder(.052,.052,.25,0x485443),1.05,1.04,z).rotation.z=Math.PI/2;
 }
 const wheels:T.Group[]=[];
 for(const z of[-.75,.75]){
  const wheel=place(root,new T.Group(),-.23,.38,z);wheels.push(wheel);
  const tire=place(wheel,r.cylinder(.35,.35,.16,0x3f5142,20),0,0,0);tire.rotation.x=Math.PI/2;
  const rim=place(wheel,r.cylinder(.26,.26,.18,0xc7a36a,16),0,0,0);rim.rotation.x=Math.PI/2;
  const hub=place(wheel,r.cylinder(.07,.07,.22,0x667665,12),0,0,0);hub.rotation.x=Math.PI/2;
  for(let a=0;a<4;a++)place(wheel,r.box(.04,.49,.2,0x6e7c68),0,0,0).rotation.z=a*Math.PI/4;
 }
 const ropes:T.Mesh[]=[];
 for(const x of[-.52,.52]){
  const points=[new T.Vector3(x,.68,-.62),new T.Vector3(x,1.66,-.52),new T.Vector3(x,1.7,.5),new T.Vector3(x,.68,.62),new T.Vector3(x,.68,-.62)];
  for(let i=1;i<points.length;i++){const rope=r.cylinder(.03,.03,1,0x726044,6);segment(rope,points[i-1],points[i]);root.add(rope);ropes.push(rope);}
  ropes.push(place(root,r.sphere(.075,0x726044),x,1.7,.1));
 }
 return{root,wheels,ropes};
}
export function makePine(r:WorldResources,size=1):{root:T.Group;crown:T.Group;trunk:T.Mesh}{
 const root=new T.Group(),crown=new T.Group();root.add(crown);
 const trunk=place(root,r.cylinder(.16,.25,2,0x896344,8),0,1,0);
 for(let i=0;i<3;i++)place(crown,r.cone(1.25-i*.24,2.4-i*.23,[0x426e47,0x57844d,0x73965a][i]),0,1.8+i*.8,0);
 root.scale.setScalar(size);return{root,crown,trunk};
}
