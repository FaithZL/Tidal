import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {WorldResources,place} from './resources.js';
import {type NprPalette,type NprSurface} from './nprMaterials.js';
import {batchStaticMeshes} from './staticBatch.js';

function noise(seed:number):number{const value=Math.sin(seed*71.93+5.17)*19237.13;return value-Math.floor(value);}

function mesh(r:WorldResources,palette:NprPalette,key:string,make:()=>T.BufferGeometry,color:number,surface:NprSurface='solid',cast=true):T.Mesh{
 const object=new T.Mesh(r.geometry(`npr-scenery/${key}`,make),palette.material(color,surface));object.castShadow=cast;object.receiveShadow=true;return object;
}
function box(r:WorldResources,p:NprPalette,w:number,h:number,d:number,color:number,surface:NprSurface='solid'):T.Mesh{
 return mesh(r,p,`box/${w}/${h}/${d}`,()=>new T.BoxGeometry(w,h,d),color,surface);
}
function named<O extends T.Object3D>(name:string,object:O):O{object.name=name;return object;}

function bankGeometry(width:number,depth:number,height:number):T.BufferGeometry{
 const geometry=new T.PlaneGeometry(width,depth,10,14).rotateX(-Math.PI/2),positions=geometry.getAttribute('position');
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),z=positions.getZ(i),envelope=Math.sin(Math.PI*(x/width+.5))*Math.sin(Math.PI*(z/depth+.5));
  positions.setY(i,.034+height*Math.max(0,envelope)*(1+.1*Math.sin(x*1.1+z*.7)));
 }
 geometry.computeVertexNormals();return geometry;
}

function meadowGeometry():T.BufferGeometry{
 const geometry=new T.PlaneGeometry(22,24,16,18).rotateX(-Math.PI/2),positions=geometry.getAttribute('position'),colors=new Float32Array(positions.count*4),base=new T.Color(0xa0be8e),edge=new T.Color(0xa7bd76),interior=new T.Color(0x94b884),shade=new T.Color();
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),z=positions.getZ(i),blend=Math.max(0,Math.min(1,Math.min(11-Math.abs(x),12-Math.abs(z))/3)),dapple=1+.04*Math.sin(x*.43+z*.31)+.025*Math.cos(x*.24-z*.39);
  shade.copy(edge).lerp(interior,blend).multiplyScalar(dapple);colors.set([shade.r/base.r,shade.g/base.g,shade.b/base.b,blend*blend*(3-2*blend)],i*4);
 }
 geometry.setAttribute('color',new T.BufferAttribute(colors,4));return geometry;
}

/** Three bent blades give the verge volume without alpha textures or cards. */
function grassGeometry():T.BufferGeometry{
 const vertices:number[]=[],uv:number[]=[];
 for(let blade=0;blade<3;blade++){
  const angle=blade*Math.PI*2/3,h=.26+blade*.035,w=.052;
  const points=[new T.Vector3(-w,0,0),new T.Vector3(w,0,0),new T.Vector3(.018,h*.65,.045),new T.Vector3(.04,h,.075)];
  points.forEach(point=>point.applyAxisAngle(new T.Vector3(0,1,0),angle));
  for(const index of[0,1,2,0,2,3,2,1,0,3,2,0]){vertices.push(...points[index].toArray());uv.push(index===0?0:index===1?1:.5,index<2?0:index===2?.65:1);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}

function cottage(r:WorldResources,p:NprPalette,parent:T.Group):void{
 const home=place(parent,named('sample-cottage',new T.Group()),1,0,-13),details=new T.Group();home.add(details);
 place(home,named('sample-cottage-foundation',box(r,p,5.86,.205,4.66,0x9e9987)),0,.1275,0);
 const walls=place(home,named('sample-cottage-wall',box(r,p,5.6,2.9,4.4,0xd8c8a7,'plaster')),0,1.68,0);
 walls.castShadow=true;
 const gable=r.geometry('npr-scenery/cottage-gable',()=>{
  const s=new T.Shape();s.moveTo(-2.8,0);s.lineTo(-2.8,.21);s.lineTo(0,1.55);s.lineTo(2.8,.21);s.lineTo(2.8,0);s.closePath();
  return new T.ExtrudeGeometry(s,{depth:4.4,bevelEnabled:false});
 });
 const gableMesh=place(home,new T.Mesh(gable,p.material(0xd8c8a7,'plaster')),0,3.12,-2.2);gableMesh.receiveShadow=true;gableMesh.castShadow=true;
 const run=3.25,rise=1.55,slope=Math.hypot(run,rise),pitch=Math.atan2(rise,run);
 for(const side of[-1,1]){
  const roof=place(home,named(side<0?'sample-roof-west':'sample-roof-east',box(r,p,slope,.12,5.3,0xa7775c,'roof')),side*run*.5,3.1+rise*.5,0);roof.rotation.z=-side*pitch;
  // Sparse raised tile courses read at orbit distance without noisy micro-detail.
  for(let row=1;row<5;row++){
   const t=row/5,course=place(details,box(r,p,.045,.045,5.3,0xa7775c,'roof'),side*run*t,3.16+rise*(1-t),0);course.rotation.z=-side*pitch;
  }
  const fascia=place(details,box(r,p,slope+.04,.15,.13,0x8a755c,'wood'),side*run*.5,3.06+rise*.5,2.66);fascia.rotation.z=-side*pitch;
  const back=fascia.clone();back.position.z=-2.66;details.add(back);
 }
 place(details,box(r,p,.19,.15,5.42,0xa7775c,'roof'),0,4.7,0);
 // The lower apron, corner posts and separated sill make the cottage feel built.
 for(const z of[-2.23,2.23])place(details,box(r,p,5.67,.26,.1,0x8a755c,'wood'),0,.38,z);
 for(const x of[-2.77,2.77]){
  place(details,box(r,p,.12,.26,4.4,0x8a755c,'wood'),x,.38,0);
  for(const z of[-2.24,2.24])place(details,box(r,p,.15,2.84,.15,0x8a755c,'wood'),x,1.74,z);
 }
 place(details,box(r,p,5.65,.13,.16,0x8a755c,'wood'),0,3.08,2.24);
 place(home,named('sample-door-reveal',box(r,p,1.28,2.16,.16,0x625c4c)),0,1.3,2.25);
 place(home,named('sample-door',box(r,p,1.07,2.02,.12,0x9a8667,'wood')),0,1.26,2.35);
 for(const x of[-.65,.65])place(details,box(r,p,.105,2.2,.24,0x8a755c,'wood'),x,1.3,2.3);
 place(details,box(r,p,1.4,.11,.24,0x8a755c,'wood'),0,2.41,2.3);
 place(details,box(r,p,.045,.17,.035,0x595d55),.38,1.33,2.43);
 for(const side of[-1,1]){
  const x=side*1.74,reveal=place(home,named(`sample-front-reveal-${side<0?'west':'east'}`,box(r,p,1.17,1.2,.22,0x8a755c,'wood')),x,1.94,2.27);
  reveal.castShadow=true;
  place(home,named(`sample-front-window-${side<0?'west':'east'}`,box(r,p,.95,.98,.025,0x6e8b8d)),x,1.94,2.34);
  for(const offset of[-.53,.53])place(details,box(r,p,.09,1.19,.13,0xb8a485,'wood'),x+offset,1.94,2.4);
  for(const y of[1.39,2.49])place(details,box(r,p,1.18,.09,.15,0xb8a485,'wood'),x,y,2.4);
  place(details,box(r,p,.055,1.02,.08,0xb8a485,'wood'),x,1.94,2.4);place(details,box(r,p,.99,.055,.08,0xb8a485,'wood'),x,1.94,2.4);
  place(details,box(r,p,1.28,.12,.44,0x9e9987),x,1.31,2.41);
 }
 // Shallow portico frames the door instead of an oversized detached porch.
 const canopy=place(home,named('sample-entry-canopy',box(r,p,1.75,.12,1.25,0xa7775c,'roof')),0,2.65,2.72);canopy.rotation.x=.12;
 for(const x of[-.74,.74])place(details,box(r,p,.095,2.4,.095,0x8a755c,'wood'),x,1.4,3.17);
 place(home,box(r,p,1.85,.15,1.55,0xb5ab92),0,.1,2.87);
 for(let row=0;row<2;row++)place(details,box(r,p,.35,.105,.35,0xb5ab92),0,.0775,3.85+row*.5);
 // One broad chimney, cap and low-frequency masonry courses, no noisy brick grid.
 place(home,box(r,p,.5,1.45,.62,0xd8c8a7,'plaster'),1.6,4.03,-.65);
 place(details,box(r,p,.68,.12,.8,0x938c7b),1.6,4.8,-.65);
 batchStaticMeshes(details);
}

/** The first art sample deliberately occupies only the chopping/loading corner. */
export function buildNprSampleEnvironment(r:WorldResources,palette:NprPalette):T.Group{
 const root=named('npr-sample-environment',new T.Group());
 const meadow=place(root,named('sample-painted-meadow',new T.Mesh(r.geometry('npr-scenery/painted-meadow',meadowGeometry),palette.material(0xa0be8e,'grass',true))),-1,.032,-8);meadow.receiveShadow=true;
 meadow.material.transparent=true;meadow.material.depthWrite=false;
 cottage(r,palette,root);
 const west=place(root,named('sample-grass-bank-west',mesh(r,palette,'bank-west',()=>bankGeometry(3.6,8,.65),0x82945f,'grass',false)),-10.5,0,-11);
 west.receiveShadow=true;
 place(root,named('sample-grass-bank-back',mesh(r,palette,'bank-back',()=>bankGeometry(11.2,2.5,.46),0x8b9a67,'grass',false)),-1,0,-18);
 const shrubs=new T.Group();root.add(shrubs);
 const shrubGeometry=r.geometry('npr-scenery/shrub',()=>{
  const parts=[[-.42,0,.04,.62],[.16,.19,-.07,.83],[.66,-.08,.15,.51],[-.08,-.1,.57,.54]].map(([x,y,z,radius])=>{
   const g=new T.IcosahedronGeometry(radius,1),positions=g.getAttribute('position');
   for(let i=0;i<positions.count;i++){
    const vx=positions.getX(i),vy=positions.getY(i),vz=positions.getZ(i),scale=1+.1*Math.sin(vx*8+vy*2+vz*5);
    positions.setXYZ(i,vx*scale+x,vy*scale+y,vz*scale+z);
   }g.computeVertexNormals();return g;
  });
  const combined=mergeGeometries(parts);parts.forEach(part=>part.dispose());if(!combined)throw new Error('Shrub part geometry must share attributes');return combined;
 });
 for(let i=0;i<12;i++){
  const side=i<7?-1:1,x=side<0?-10.5+noise(i+25)*1.4:5.1+noise(i+25)*1.8,z=-16+noise(i+35)*8,scale=.42+noise(i+45)*.4;
  const shrub=place(shrubs,new T.Mesh(shrubGeometry,palette.material(i%3===0?0x6f8455:0x7f915d,'foliage')),x,.034+scale*.45,z);
  shrub.scale.set(scale,scale*.45,scale*.8);shrub.rotation.y=noise(i+55)*Math.PI;shrub.castShadow=true;shrub.receiveShadow=true;
 }
 batchStaticMeshes(shrubs);
 const matrix=new T.Matrix4(),rotation=new T.Quaternion(),up=new T.Vector3(0,1,0);
 // Keep the walkable road clear. Patches sit just outside its existing verge.
 const grassCount=72,tufts=new T.InstancedMesh(r.geometry('npr-scenery/grass-blades',grassGeometry),palette.material(0x87975f,'grass'),grassCount);
 for(let i=0;i<grassCount;i++){
  const x=-10+noise(i+65)*18,z=(i%2?1:-1)*(1.62+noise(i+75)*.68),scale=.75+noise(i+85)*.8;
  matrix.compose(new T.Vector3(x,.034,z),rotation.setFromAxisAngle(up,noise(i+95)*Math.PI*2),new T.Vector3(scale,scale,scale));tufts.setMatrixAt(i,matrix);
 }
 tufts.name='sample-roadside-grass';tufts.receiveShadow=true;root.add(tufts);
 return root;
}
