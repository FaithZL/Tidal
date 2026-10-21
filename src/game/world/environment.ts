import * as T from 'three';
import {WorldResources,place} from './resources.js';
import {batchStaticMeshes} from './staticBatch.js';
function building(r:WorldResources,parent:T.Group,x:number,z:number,w:number,d:number,wall:number,roof:number):void{
 const b=place(parent,new T.Group(),x,0,z);
 place(b,r.box(w+.25,.3,d+.25,0xada17b),0,.15,0);place(b,r.box(w,2.8,d,wall),0,1.6,0);
 const shape=new T.Shape();shape.moveTo(-w*.6,0);shape.lineTo(0,1.7);shape.lineTo(w*.6,0);shape.closePath();
 const geo=r.geometry(`roof${w}/${d}`,()=>new T.ExtrudeGeometry(shape,{depth:d+.6,bevelEnabled:false}));
 place(b,r.mesh(geo,roof),0,2.95,-d*.5-.3);
 for(const side of[-1,1])for(let row=0;row<5;row++){
  const fraction=(row+.5)/5;place(b,r.box(.035,.035,d+.64,roof-0x080400),side*w*.6*fraction,4.69-1.7*fraction,0);
 }
 place(b,r.box(1.2,2,.08,0x765331),0,1.25,d*.5+.05);
 for(const side of[-1,1]){
  place(b,r.box(.09,2.16,.11,0xf5e1ad),side*.67,1.3,d*.5+.11);
  place(b,r.box(.75,.84,.08,0xe9d69e),side*w*.34,1.9,d*.5+.04);
  place(b,r.box(.55,.63,.1,0x80afac),side*w*.34,1.9,d*.5+.1);
  place(b,r.box(.04,.7,.12,0xf7e9bd),side*w*.34,1.9,d*.5+.15);
 }
 place(b,r.box(1.45,.1,.12,0xf5e1ad),0,2.4,d*.5+.12);
 const brace=place(b,r.box(.07,1.8,.1,0xd2b982),0,1.3,d*.5+.13);brace.rotation.z=.48;
 for(const side of[-1,1])place(b,r.box(.1,2.8,.12,0xf1dba8),side*w*.49,1.6,d*.5+.05);
 const chimney=place(b,r.box(.55,1.3,.6,0xac947b),w*.3,3.85,-d*.15);chimney.castShadow=true;
 b.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=true;});
}
/** Original procedural village. No remote model, image, font or texture request. */
export function buildEnvironment(r:WorldResources):T.Group{
 const root=new T.Group();
 place(root,r.box(108,.45,64,0x8eae67),15,-.25,0);
 place(root,r.box(105,.08,61,0xa7bd76),15,-.015,0);
 // Broad chalk path from clearing to the distant homestead.
 place(root,r.box(48,.045,2.35,0xd9c895),18,.035,0);
 place(root,r.box(3,.045,27,0xd6c18b),12,.04,0);
 for(let i=0;i<65;i++){
  const x=-7+i*.78,z=Math.sin(i*2.3)*.7;
  const stone=place(root,r.sphere(.08+(i%3)*.025,0xb8ad86),x,.06,z);stone.scale.y=.25;
 }
 building(r,root,43,-4,5.4,4.5,0xd9bc8c,0xa75e46);
 building(r,root,1,-13,5,4,0xae6b50,0x685c54);
 building(r,root,20,-14,4,3.5,0xe4c78d,0xb77952);
 // Crops in six fertile plots, with raised wooden boundaries and planted rows.
 const cropGeometry=r.geometry('crop',()=>new T.ConeGeometry(.13,.55,5));
 const colors=[0x789348,0xe1b956,0x618747,0x99ad53,0xc37b4e,0x65924b];
 for(let p=0;p<6;p++){
  const x=9+(p%3)*7.2,z=5.8+Math.floor(p/3)*7;
  place(root,r.box(5.8,.1,5.2,0x897044),x,.045,z);
  for(const side of[-1,1]){place(root,r.box(5.9,.09,.1,0xc6b17c),x,.15,z+side*2.65);place(root,r.box(.1,.09,5.3,0xc6b17c),x+side*3,.15,z);}
  const plants=new T.InstancedMesh(cropGeometry,r.material(colors[p]),72),matrix=new T.Matrix4();
  for(let i=0;i<72;i++){
   const cx=x-2.5+(i%9)*.63,cz=z-2+Math.floor(i/9)*.57;
   matrix.compose(new T.Vector3(cx,.36,cz),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),i*.6),new T.Vector3(1,1+(i%4)*.12,1));plants.setMatrixAt(i,matrix);
  }plants.receiveShadow=true;root.add(plants);
 }
 // Orchard: real rounded canopy and warm fruit.
 for(let i=0;i<12;i++){
  const x=29+(i%4)*2.7,z=5.5+Math.floor(i/4)*3.1;
  place(root,r.cylinder(.12,.2,1.45,0x8e6843,7),x,.72,z);
  const crown=place(root,r.sphere(1,0x698d4c),x,1.9,z);crown.scale.set(1,1.1,1);
  for(let j=0;j<4;j++)place(root,r.sphere(.12,i%2?0xe2ae4e:0xc67b4c),x+Math.cos(j*2)*.75,1.95+Math.sin(j*3)*.5,z+Math.sin(j*2)*.75);
 }
 // Fence rails and posts frame fields while leaving the long road open.
 for(let i=0;i<25;i++){
  const x=-14+i*2.65;
  for(const z of[-20,19]){
   place(root,r.box(.14,1.05,.14,0xcab282),x,.52,z);
   if(i<24)for(const y of[.38,.78])place(root,r.box(2.7,.085,.08,0xe4d09c),x+1.32,y,z);
  }
 }
 // Pond and waterside stones.
 const pond=place(root,r.cylinder(1,1,.055,0x7db6bc,48),35,.05,13);pond.scale.set(5,1,3.2);
 for(let i=0;i<25;i++){const a=i/25*Math.PI*2;const rock=place(root,r.sphere(.35+(i%3)*.08,0x9bada2),35+Math.cos(a)*5.1,.16,13+Math.sin(a)*3.3);rock.scale.y=.55;}
 for(let i=0;i<9;i++)place(root,r.box(.45,.08,1.5,0xc7a477),30+i*.45,.24,12.5);
 // Windmill creates a recognisable distant silhouette.
 const mill=place(root,r.cylinder(.5,.9,4.2,0xe1d2b0,8),28,2.1,-15);mill.castShadow=true;
 place(root,r.cone(1.05,1.5,0x94715b,8),28,4.8,-15);
 for(let i=0;i<4;i++){const sail=place(root,r.box(.23,3,.09,0xf1dfb4),28,3.9,-13.95);sail.rotation.z=i*Math.PI/4;}
 // Forest is instanced to keep the view inexpensive when orbiting.
 const treeGeo=r.geometry('forest-cone',()=>new T.ConeGeometry(1,3,7));const forest=new T.InstancedMesh(treeGeo,r.material(0x547e52),130),matrix=new T.Matrix4();
 for(let i=0;i<130;i++){
  const x=-25+(i%26)*3.25,z=i<78?-24-Math.floor(i/26)*3:22+Math.floor((i-78)/26)*3;
  const h=1.2+(i%7)*.12;matrix.compose(new T.Vector3(x,1.5*h,z),new T.Quaternion(),new T.Vector3(h,h,h));forest.setMatrixAt(i,matrix);
 }root.add(forest);
 // Layered distant terrain with a consistent sunlit face.
 for(let i=0;i<12;i++){
  const mountain=place(root,r.cone(7+(i%3)*2,10+(i%4)*2,[0x8ca997,0x98b0a1,0x718f83][i%3],5),-30+i*9,4,-43-(i%2)*6);mountain.rotation.y=i*.4;
 }
 for(let i=0;i<18;i++){
  const hay=place(root,r.cylinder(.6,.6,1.15,0xcdb568,12),3+(i%3)*1.2, .6+Math.floor(i/9)*1.1,-8-Math.floor(i/3)%3);hay.rotation.z=Math.PI/2;
 }
 batchStaticMeshes(root);return root;
}
