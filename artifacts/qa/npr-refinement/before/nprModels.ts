import * as T from 'three';
import {Character3D,makeCart,makeLog} from './models.js';
import {NprPalette,type NprSurface} from './nprMaterials.js';
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

/** Local art sample only: presentation poses and hand anchors match the established choreography. */
export class NprCharacter3D{
 readonly root:T.Group;readonly hand:T.Object3D;private torso=new T.Group();
 private arms:T.Mesh[]=[];private legs:T.Mesh[]=[];private hands:T.Mesh[]=[];private boots:T.Mesh[]=[];
 private axe?:T.Group;private robot?:Character3D;
 constructor(r:WorldResources,p:NprPalette,robot=false){
  if(robot){this.robot=new Character3D(r,true);this.root=this.robot.root;this.hand=this.robot.hand;repaint(this.root,p,'cloth');return;}
  this.root=new T.Group();this.hand=new T.Object3D();const root=this.root,torso=this.torso;root.add(torso,this.hand);
  const shadow=place(root,r.cylinder(1,1,.008,0x455b3d,24,'shadow'),0,.077,0);shadow.scale.set(.4,1,.27);shadow.castShadow=false;shadow.receiveShadow=false;
  const shirt=place(torso,shaped(sculpt(r,'farmer-shirt',[
   {y:-.29,x:.18,z:.13},{y:-.20,x:.205,z:.14},{y:.04,x:.255,z:.155},{y:.19,x:.278,z:.135},{y:.25,x:.22,z:.12},{y:.28,x:.08,z:.075},
  ]),p,0xd2c5a1,'cloth'),0,1.26,0);shirt.name='npr-farmer-shirt';
  const waist=place(torso,shaped(sculpt(r,'farmer-waist',[
   {y:-.14,x:.17,z:.12},{y:-.10,x:.205,z:.145},{y:.12,x:.19,z:.13},{y:.15,x:.18,z:.12},
  ]),p,0x506d70,'cloth'),0,.98,.005);waist.name='npr-farmer-trousers';
  const bib=place(torso,shaped(sculpt(r,'farmer-bib',[
   {y:-.14,x:.155,z:.025},{y:.10,x:.14,z:.025},{y:.15,x:.105,z:.015},
  ]),p,0x506d70,'cloth'),0,1.25,.142);bib.scale.z=.65;
  for(const sign of[-1,1]){
   const strap=place(torso,r.roundedBox(.048,.35,.024,.01,0x506d70,'cloth'),sign*.132,1.40,.144);strap.rotation.z=sign*-.14;repaint(strap,p,'cloth');
   const button=place(torso,solid(r,p,.021,0xb5a36b),sign*.119,1.30,.18);button.scale.z=.35;
   const collar=place(torso,r.roundedBox(.105,.085,.032,.012,0xddd3b7,'cloth'),sign*.073,1.505,.117);collar.rotation.z=sign*-.38;repaint(collar,p,'cloth');
  }
  place(torso,shaped(sculpt(r,'farmer-neck',[{y:-.09,x:.064,z:.065},{y:.10,x:.065,z:.062}]),p,0xd4a882),0,1.64,0);
  const head=place(torso,shaped(sculpt(r,'farmer-head',[
   {y:-.19,x:.045,z:.06,cz:.025},{y:-.15,x:.105,z:.103,cz:.02},{y:-.065,x:.142,z:.128},
   {y:.05,x:.157,z:.14,cz:-.008},{y:.125,x:.137,z:.125,cz:-.012},{y:.18,x:.075,z:.074,cz:-.012},{y:.185,x:.012,z:.016},
  ],20),p,0xe1b58d),0,1.9,0);head.name='npr-farmer-head';
  const hair=place(torso,shaped(sculpt(r,'farmer-hair',[
   {y:-.06,x:.145,z:.135,cz:-.025},{y:.03,x:.17,z:.146,cz:-.016},{y:.13,x:.145,z:.134,cz:-.02},{y:.18,x:.04,z:.05,cz:-.025},
  ]),p,0x51473b),0,1.965,0);hair.name='npr-farmer-hair';
  for(const sign of[-1,1]){
   const ear=place(torso,solid(r,p,.041,0xd8ac85),sign*.159,1.87,-.005);ear.scale.set(.55,1,.75);
   const eye=place(torso,solid(r,p,.018,0x43483c),sign*.058,1.925,.131);eye.scale.set(.85,.57,.32);
   const brow=place(torso,r.roundedBox(.045,.008,.009,.003,0x574c3b),sign*.06,1.958,.127);brow.rotation.z=sign*-.07;repaint(brow,p,'solid');
   const lock=place(torso,shaped(sculpt(r,'farmer-lock',[{y:-.07,x:.012,z:.017},{y:.02,x:.033,z:.035},{y:.10,x:.024,z:.028}],8),p,0x51473b),sign*.139,1.95,.035);lock.rotation.z=sign*-.2;
  }
  const nose=place(torso,solid(r,p,.027,0xd7a47e),0,1.89,.139);nose.scale.set(.58,.95,.9);
  const mouth=place(torso,r.roundedBox(.046,.006,.009,.002,0xa37d64),0,1.821,.116);repaint(mouth,p,'solid');
  const hat=place(torso,shaped(sculpt(r,'farmer-hat',[
   {y:0,x:.29,z:.255},{y:.025,x:.27,z:.24},{y:.035,x:.17,z:.16},{y:.17,x:.148,z:.142},{y:.205,x:.115,z:.11},{y:.21,x:.015,z:.015},
  ],24),p,0xc4ad73,'cloth'),0,2.075,-.005);hat.rotation.z=-.045;
  const band=place(torso,shaped(sculpt(r,'farmer-hat-band',[{y:0,x:.171,z:.16},{y:.035,x:.165,z:.157}],24),p,0x72745b,'cloth'),0,2.11,-.005);band.rotation.z=-.045;
  const limb=sculpt(r,'farmer-limb',[{y:-.5,x:.064,z:.061},{y:-.43,x:.075,z:.07},{y:.32,x:.083,z:.078},{y:.5,x:.075,z:.072}],12);
  const trouser=sculpt(r,'farmer-leg',[{y:-.5,x:.067,z:.07},{y:-.4,x:.081,z:.082},{y:.35,x:.099,z:.099},{y:.5,x:.087,z:.087}],12);
  for(let i=0;i<4;i++){this.arms.push(place(root,shaped(limb,p,i%2?0xdbb18c:0xd2c5a1,i%2?'solid':'cloth'),0,0,0));this.legs.push(place(root,shaped(trouser,p,0x506d70,'cloth'),0,0,0));}
  for(const x of[-.18,.18]){
   const hand=place(root,solid(r,p,.076,0xd7ad86),x,0,0);hand.scale.set(.84,1.04,.7);this.hands.push(hand);
   const boot=place(root,shaped(sculpt(r,'farmer-boot',[
    {y:-.07,x:.105,z:.145,cz:.025},{y:-.035,x:.11,z:.16,cz:.035},{y:.045,x:.093,z:.13,cz:.018},{y:.085,x:.065,z:.075,cz:-.025},
   ],12),p,0x625844),x,.09,.06);this.boots.push(boot);
  }
  this.axe=new T.Group();place(this.axe,r.cylinder(.022,.027,.9,0x9d8056,12,'wood'),0,.24,0);
  place(this.axe,r.roundedBox(.25,.19,.055,.018,0x82938f),.105,.65,0);place(this.axe,r.box(.035,.21,.06,0xb9c4bc),.24,.65,0);repaint(this.axe,p,'wood');
  this.hands[1].add(this.axe);this.axe.visible=false;
 }
 update(actor:WorldActor,chopping:boolean):void{
  if(this.robot){this.robot.update(actor,chopping);return;}
  const {position:p,yaw,mode,pose,stride}=actor;this.root.position.set(p.x,p.y,p.z);this.root.rotation.y=yaw;
  const squat=mode==='work'&&pose==='squat-down'?.42:0;this.torso.position.y=-squat;
  const moving=['walk','push','pull'].includes(mode),step=moving?Math.sin(stride)*.25:0;
  for(let i=0;i<2;i++){
   const sign=i?1:-1,x=sign*.18,z=step*sign;
   const hip=new T.Vector3(x,.95-squat,0),knee=new T.Vector3(x,.48-squat*.5,squat?.4:z*.55),ankle=new T.Vector3(x,.16,z);
   segment(this.legs[i*2],hip,knee);segment(this.legs[i*2+1],knee,ankle);this.boots[i].position.set(x,.09,z+.06);
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
   const sign=i?1:-1,x=sign*.3,shoulder=new T.Vector3(x,1.5-squat,0),hand=new T.Vector3(x,hy,hz+(moving&&mode==='walk'?Math.sin(stride+sign)*.1:0));
   const elbow=shoulder.clone().lerp(hand,.48);elbow.x+=sign*.1;elbow.z+=.1;
   segment(this.arms[i*2],shoulder,elbow);segment(this.arms[i*2+1],elbow,hand);this.hands[i].position.copy(hand);
  }
  this.hand.position.set(0,hy,hz);if(this.axe)this.axe.visible=chopping&&mode==='work';this.root.updateMatrixWorld(true);
 }
 handPosition():T.Vector3{return this.hand.getWorldPosition(new T.Vector3());}
}

export function makeNprCart(r:WorldResources,p:NprPalette):ReturnType<typeof makeCart>{
 const cart=makeCart(r);repaint(cart.root,p,'wood');cart.ropes.forEach(rope=>{rope.material=p.material(0xa68b5a,'cloth');});return cart;
}
export function makeNprLog(r:WorldResources,p:NprPalette):T.Group{const log=makeLog(r);repaint(log,p,'bark');for(const face of log.children)if(face instanceof T.Mesh&&Math.abs(face.position.x)>.42)face.material=p.material(0xcab082,'wood');return log;}

export function makeNprTree(r:WorldResources,p:NprPalette):{root:T.Group;crown:T.Group;trunk:T.Mesh}{
 const root=new T.Group(),crown=new T.Group();root.add(crown);
 const trunk=place(root,shaped(sculpt(r,'broadleaf-trunk',[
  {y:0,x:.26,z:.23},{y:.2,x:.205,z:.18},{y:1.1,x:.15,z:.15,cx:.04},{y:1.8,x:.115,z:.12,cx:-.025},{y:2.5,x:.055,z:.065,cx:.12},
 ],12),p,0x8c7858,'bark'),0,0,0);
 const branchGeometry=sculpt(r,'broadleaf-branch',[{y:-.5,x:.09,z:.09},{y:.5,x:.027,z:.027}],10);
 for(const [x,y,z] of[[-.65,3.1,.2],[.7,3.15,-.2],[.05,3.7,0],[-.15,3.15,-.75],[.1,3.15,.7]]){
  const branch=shaped(branchGeometry,p,0x8c7858,'bark');segment(branch,new T.Vector3(0,1.5,0),new T.Vector3(x,y,z));crown.add(branch);
 }
 const leafGeometry=r.geometry('npr-layered-broadleaf-cluster-v2',()=>{
  const geometry=new T.SphereGeometry(1,16,8),positions=geometry.getAttribute('position'),colors:number[]=[];
  for(let i=0;i<positions.count;i++){
   const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),angle=Math.atan2(z,x);
   // Broad scalloped leaf shelves, not uniformly inflated balls or high-frequency crumpled noise.
   const edge=1+.105*Math.sin(angle*5+.4)+.045*Math.cos(angle*9-y*2);
   positions.setXYZ(i,x*edge,y*.52+.035*Math.sin(angle*4)*(1-y*y),z*edge);
   const shade=.91+(y+1)*.045;colors.push(shade,shade,shade);
  }
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();return geometry;
 });
 const clusters=[
  {x:-.76,y:3.04,z:.1,sx:.8,sy:.92,sz:.75,c:0x83a171},
  {x:.67,y:3.17,z:-.15,sx:.86,sy:.92,sz:.69,c:0x8aa678},
  {x:-.1,y:3.65,z:-.22,sx:.88,sy:.91,sz:.83,c:0x9eb98a},
  {x:-.12,y:3.27,z:.74,sx:.85,sy:.88,sz:.68,c:0x8ca979},
  {x:.17,y:3.14,z:-.78,sx:.81,sy:.85,sz:.65,c:0x819e70},
  {x:-.79,y:3.57,z:-.35,sx:.66,sy:.83,sz:.69,c:0xa0b98c},
  {x:.79,y:3.61,z:.26,sx:.72,sy:.85,sz:.69,c:0x9eb888},
  {x:.1,y:4.0,z:.38,sx:.67,sy:.82,sz:.66,c:0xabc394},
 ];
 clusters.forEach((v,i)=>{const leaf=place(crown,shaped(leafGeometry,p,v.c,'foliage',true),v.x,v.y,v.z);leaf.name='npr-leaf-cluster';leaf.scale.set(v.sx,v.sy,v.sz);leaf.rotation.y=i*.89;leaf.rotation.z=(i%3-1)*.12;});
 for(let i=0;i<12;i++){
  const angle=i*Math.PI*2/12+.13,radius=1.15+(i%3)*.08;
  const tuft=place(crown,shaped(leafGeometry,p,i%3===0?0x9bb888:0x8fae7d,'foliage',true),Math.cos(angle)*radius,3.13+(i%4)*.13,Math.sin(angle)*radius*.8);
  tuft.name='npr-leaf-tuft';tuft.scale.set(.29+(i%2)*.05,.46,.28);tuft.rotation.y=angle;tuft.rotation.z=(i%3-1)*.16;
 }
 return{root,crown,trunk};
}
