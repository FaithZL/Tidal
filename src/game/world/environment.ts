import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {WorldResources,place} from './resources.js';
import {batchStaticMeshes} from './staticBatch.js';

/** Stable variation without a runtime random source or per-frame allocations. */
function variation(seed:number):number{const value=Math.sin(seed*127.1+311.7)*43758.5453;return value-Math.floor(value);}
function merged(parts:T.BufferGeometry[]):T.BufferGeometry{
 const expanded=parts.map(part=>part.index?part.toNonIndexed():part),geometry=mergeGeometries(expanded);
 parts.forEach(part=>part.dispose());expanded.forEach((part,i)=>{if(part!==parts[i])part.dispose();});
 if(!geometry)throw new Error('Scenery geometry attributes must match');return geometry;
}
/** A folded diamond leaf has volume and stays readable from orbiting views. */
function leaf(width:number,height:number,bend:number):T.BufferGeometry{
 const geometry=new T.BufferGeometry(),front=[0,0,0,-width,height*.48,bend,0,height,bend*.3,0,0,0,0,height,bend*.3,width,height*.48,bend];
 // Back faces are explicit so shared opaque crop materials need no global changes.
 const back=[...front.slice(6,9),...front.slice(3,6),...front.slice(0,3),...front.slice(15,18),...front.slice(12,15),...front.slice(9,12)];
 geometry.setAttribute('position',new T.Float32BufferAttribute([...front,...back],3));
 geometry.setAttribute('uv',new T.Float32BufferAttribute(Array.from({length:12},(_,i)=>[i%3===1?0:i%3===2?1:.5,i%3===0?0:1]).flat(),2));geometry.computeVertexNormals();return geometry;
}
function cropGeometry(r:WorldResources,kind:number):T.BufferGeometry{
 return r.geometry(`garden-crop-${kind}`,()=>{
  const parts:T.BufferGeometry[]=[];
  if(kind===0){
   parts.push(new T.IcosahedronGeometry(.19,0).scale(1,.65,1).translate(0,.15,0));
   for(let i=0;i<4;i++)parts.push(leaf(.13,.31,.15).rotateY(i*Math.PI*.5).translate(0,.1,0));
  }else if(kind===1){
   for(let i=0;i<3;i++){
    const x=(i-1)*.075,z=i===1?.055:-.035,h=.44+i*.045;
    parts.push(new T.ConeGeometry(.018,h,3).translate(x,h*.5,z));
    parts.push(new T.ConeGeometry(.057,.21,4).translate(x,h+.075,z));
   }
  }else{
   parts.push(new T.ConeGeometry(.085,.17,5).rotateZ(Math.PI).translate(0,.11,0));
   for(let i=0;i<3;i++)parts.push(leaf(.105,.47,.12).rotateY(i*Math.PI*2/3).translate(0,.16,0));
  }
  return merged(parts);
 });
}
function building(r:WorldResources,parent:T.Group,x:number,z:number,w:number,d:number,wall:number,roof:number):void{
 const b=place(parent,new T.Group(),x,0,z);
 place(b,r.box(w+.25,.3,d+.25,0xada17b,'stone'),0,.15,0);place(b,r.roundedBox(w,2.8,d,.06,wall),0,1.6,0);
 const shape=new T.Shape();shape.moveTo(-w*.6,0);shape.lineTo(0,1.7);shape.lineTo(w*.6,0);shape.closePath();
 const geo=r.geometry(`roof${w}/${d}`,()=>new T.ExtrudeGeometry(shape,{depth:d+.6,bevelEnabled:false}));
 place(b,r.mesh(geo,roof,'roof'),0,2.95,-d*.5-.3);
 for(const side of[-1,1])for(let row=0;row<5;row++){
  const fraction=(row+.5)/5;place(b,r.box(.035,.035,d+.64,roof-0x080400,'roof'),side*w*.6*fraction,4.69-1.7*fraction,0);
 }
 place(b,r.box(.15,.15,d+.74,0xe6c38b,'wood'),0,4.63,0);
 place(b,r.box(1.45,.16,.65,0xb9aa85,'stone'),0,.35,d*.5+.28);
 place(b,r.box(1.2,2,.08,0x765331,'wood'),0,1.25,d*.5+.05);
 for(const side of[-1,1]){
  place(b,r.box(.09,2.16,.11,0xf5e1ad,'wood'),side*.67,1.3,d*.5+.11);
  place(b,r.box(.75,.84,.08,0xe9d69e,'wood'),side*w*.34,1.9,d*.5+.04);
  place(b,r.box(.55,.63,.1,0x80afac),side*w*.34,1.9,d*.5+.1);
  place(b,r.box(.04,.7,.12,0xf7e9bd,'wood'),side*w*.34,1.9,d*.5+.15);
  for(const shutter of[-1,1])place(b,r.box(.2,.84,.13,0x76927d,'wood'),side*w*.34+shutter*.48,1.9,d*.5+.1);
  place(b,r.box(.94,.2,.3,0x9d7750,'wood'),side*w*.34,1.36,d*.5+.19);
  for(let i=0;i<3;i++)place(b,r.mesh(r.geometry('flower',()=>new T.IcosahedronGeometry(.115,0)),0xe2ad6e),side*w*.34+(i-1)*.26,1.52,d*.5+.22);
 }
 place(b,r.box(1.45,.1,.12,0xf5e1ad,'wood'),0,2.4,d*.5+.12);
 const brace=place(b,r.box(.07,1.8,.1,0xd2b982,'wood'),0,1.3,d*.5+.13);brace.rotation.z=.48;
 for(const side of[-1,1])place(b,r.box(.1,2.8,.12,0xf1dba8,'wood'),side*w*.49,1.6,d*.5+.05);
 const chimney=place(b,r.box(.55,1.3,.6,0xac947b,'stone'),w*.3,3.85,-d*.15);chimney.castShadow=true;
 b.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=true;});
}
/** Original procedural village. No remote model, image, font or texture request. */
export function buildEnvironment(r:WorldResources,options:{excludeSampleZone?:boolean}={}):T.Group{
 const root=new T.Group();
 place(root,r.box(108,.45,64,0x8eae67,'soil'),15,-.25,0);
 // Broad meadow detail is interpolated from a small shared grid, avoiding a
 // texture lookup over most of the viewport while keeping soft grassy patches.
 const meadowGeometry=r.geometry('meadow-vertex-grid-105/61/24/14',()=>{
  const geometry=new T.PlaneGeometry(105,61,24,14).rotateX(-Math.PI/2),positions=geometry.getAttribute('position'),colors=new Float32Array(positions.count*3);
  for(let i=0;i<positions.count;i++){
   const x=positions.getX(i),z=positions.getZ(i),shade=.9+.035*Math.sin(x*.17+z*.13)+.025*Math.cos(z*.3-x*.07)+(variation(i+1600)-.5)*.02;
   colors.set([shade,shade,shade],i*3);
  }geometry.setAttribute('color',new T.BufferAttribute(colors,3));return geometry;
 });
 place(root,r.mesh(meadowGeometry,0xa7bd76,'solid',true),15,.025,0);
 // Broad chalk path from clearing to the distant homestead.
 place(root,r.box(48,.045,2.35,0xd9c895,'path'),18,.035,0);
 place(root,r.box(3,.045,27,0xd6c18b,'path'),12,.04,0);
 const rockGeometry=r.geometry('scenery-rock',()=>new T.IcosahedronGeometry(1,0));
 for(let i=0;i<65;i++){
  const x=-7+i*.78,z=Math.sin(i*2.3)*.7;
  const size=.08+(i%3)*.025,stone=place(root,r.mesh(rockGeometry,0xb8ad86,'stone'),x,.06,z);stone.scale.set(size,size*.25,size);stone.rotation.y=i*1.7;
 }
 const grassGeometry=r.geometry('roadside-grass',()=>merged([leaf(.035,.26,.06),leaf(.035,.22,.06).rotateY(Math.PI*.67),leaf(.035,.29,.06).rotateY(Math.PI*1.33)]));
 const verges=new T.InstancedMesh(grassGeometry,r.material(0x769747,'grass'),96),vergeMatrix=new T.Matrix4();
 for(let i=0;i<96;i++){
  const x=-5.5+variation(i+40)*47,z=(i%2?1:-1)*(1.3+variation(i+80)*.45),scale=.75+variation(i+120)*.5;
  vergeMatrix.compose(new T.Vector3(x,.06,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),variation(i+160)*Math.PI*2),new T.Vector3(scale,scale,scale));verges.setMatrixAt(i,vergeMatrix);
  verges.setColorAt(i,new T.Color().setHSL(.2+variation(i+200)*.05,.3,.72+variation(i+240)*.14));
 }verges.receiveShadow=true;root.add(verges);
 building(r,root,43,-4,5.4,4.5,0xd9bc8c,0xa75e46);
 if(!options.excludeSampleZone)building(r,root,1,-13,5,4,0xae6b50,0x685c54);
 building(r,root,20,-14,4,3.5,0xe4c78d,0xb77952);
 // Crops in six fertile plots, with raised wooden boundaries and planted rows.
 const colors=[0x789348,0xe1b956,0x618747,0x99ad53,0xc37b4e,0x65924b];
 for(let p=0;p<6;p++){
  const x=9+(p%3)*7.2,z=5.8+Math.floor(p/3)*7;
  place(root,r.box(5.8,.1,5.2,0x897044,'soil'),x,.045,z);
  for(const side of[-1,1]){place(root,r.box(5.9,.09,.1,0xc6b17c,'wood'),x,.15,z+side*2.65);place(root,r.box(.1,.09,5.3,0xc6b17c,'wood'),x+side*3,.15,z);}
  const plants=new T.InstancedMesh(cropGeometry(r,p%3),r.material(colors[p],'grass'),72),matrix=new T.Matrix4();
  for(let i=0;i<72;i++){
   const seed=p*72+i,cx=x-2.5+(i%9)*.63+(variation(seed+300)-.5)*.12,cz=z-2+Math.floor(i/9)*.57+(variation(seed+400)-.5)*.12,scale=.82+variation(seed+500)*.3;
   matrix.compose(new T.Vector3(cx,.13,cz),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),variation(seed+600)*Math.PI*2),new T.Vector3(scale,.85+variation(seed+700)*.35,scale));plants.setMatrixAt(i,matrix);
   plants.setColorAt(i,new T.Color().setHSL(.18+variation(seed+800)*.05,.16+variation(seed+900)*.16,.72+variation(seed+1000)*.15));
  }plants.receiveShadow=true;root.add(plants);
 }
 // Orchard: real rounded canopy and warm fruit.
 for(let i=0;i<12;i++){
  const x=29+(i%4)*2.7,z=5.5+Math.floor(i/4)*3.1;
  place(root,r.cylinder(.12,.2,1.45,0x8e6843,7,'bark'),x,.72,z);
  const crown=place(root,r.sphere(1,0x698d4c,'grass'),x,1.9,z);crown.scale.set(1,1.1,1);
  for(let j=0;j<4;j++)place(root,r.sphere(.12,i%2?0xe2ae4e:0xc67b4c),x+Math.cos(j*2)*.75,1.95+Math.sin(j*3)*.5,z+Math.sin(j*2)*.75);
 }
 // Fence rails and posts frame fields while leaving the long road open.
 for(let i=0;i<25;i++){
  const x=-14+i*2.65;
  for(const z of[-20,19]){
   place(root,r.box(.14,1.05,.14,0xcab282,'wood'),x,.52,z);
   if(i<24)for(const y of[.38,.78])place(root,r.box(2.7,.085,.08,0xe4d09c,'wood'),x+1.32,y,z);
  }
 }
 // Pond and waterside stones.
 const pond=place(root,r.cylinder(1,1,.055,0x7db6bc,48,'water'),35,.05,13);pond.scale.set(5,1,3.2);
 for(let i=0;i<25;i++){const a=i/25*Math.PI*2,size=.35+(i%3)*.08,rock=place(root,r.mesh(rockGeometry,0x9bada2,'stone'),35+Math.cos(a)*5.1,.16,13+Math.sin(a)*3.3);rock.scale.set(size,size*.55,size);rock.rotation.y=i*.8;}
 for(let i=0;i<9;i++)place(root,r.box(.45,.08,1.5,0xc7a477,'wood'),30+i*.45,.24,12.5);
 // Windmill creates a recognisable distant silhouette.
 const mill=place(root,r.cylinder(.5,.9,4.2,0xe1d2b0,8,'stone'),28,2.1,-15);mill.castShadow=true;
 place(root,r.cone(1.05,1.5,0x94715b,8,'roof'),28,4.8,-15);
 for(let i=0;i<4;i++){const sail=place(root,r.box(.23,3,.09,0xf1dfb4,'cloth'),28,3.9,-13.95);sail.rotation.z=i*Math.PI/4;}
 // Forest is instanced to keep the view inexpensive when orbiting.
 const treeGeo=r.geometry('forest-layered',()=>merged([new T.CylinderGeometry(.12,.18,1,6).translate(0,.5,0),new T.ConeGeometry(1,2.1,7).translate(0,1.55,0),new T.ConeGeometry(.72,1.8,7).rotateY(.4).translate(0,2.65,0)]));const forest=new T.InstancedMesh(treeGeo,r.material(0x547e52,'grass'),130),matrix=new T.Matrix4();
 for(let i=0;i<130;i++){
  const x=-25+(i%26)*3.25,z=i<78?-24-Math.floor(i/26)*3:22+Math.floor((i-78)/26)*3;
  const h=1.2+(i%7)*.12;matrix.compose(new T.Vector3(x,.02,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),variation(i+1100)*Math.PI*2),new T.Vector3(h*(.86+variation(i+1200)*.22),h,h));forest.setMatrixAt(i,matrix);
  forest.setColorAt(i,new T.Color().setHSL(.25+variation(i+1300)*.07,.15+variation(i+1400)*.18,.7+variation(i+1500)*.16));
 }root.add(forest);
 // Layered distant terrain with a consistent sunlit face.
 for(let i=0;i<12;i++){
  const mountain=place(root,r.cone(7+(i%3)*2,10+(i%4)*2,[0x8ca997,0x98b0a1,0x718f83][i%3],5),-30+i*9,4,-43-(i%2)*6);mountain.rotation.y=i*.4;
 }
 for(let i=0;i<18;i++){
  // The approved local sample opens the porch sightline without deleting bales.
  const hay=place(root,r.cylinder(.6,.6,1.15,0xcdb568,12,'wood'),(options.excludeSampleZone?17:3)+(i%3)*1.2, .6+Math.floor(i/9)*1.1,(options.excludeSampleZone?-17:-8)-Math.floor(i/3)%3);hay.rotation.z=Math.PI/2;
 }
 batchStaticMeshes(root);return root;
}
