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

/** Share immutable cottage trim by material without changing its authored silhouette. */
function mergeCottageDetails(r:WorldResources,details:T.Group):void{
 const groups=new Map<T.Material,T.Mesh[]>();
 for(const object of details.children)if(object instanceof T.Mesh&&!Array.isArray(object.material)){const meshes=groups.get(object.material)??[];meshes.push(object);groups.set(object.material,meshes);}
 details.updateMatrixWorld(true);let group=0;
 for(const [material,sources] of groups){
  const geometry=r.geometry(`npr-scenery/cottage-trim/${group++}`,()=>{
   const parts=sources.map(source=>{source.updateMatrix();return source.geometry.clone().applyMatrix4(source.matrix);}),merged=mergeGeometries(parts);parts.forEach(part=>part.dispose());
   if(!merged)throw new Error('Cottage trim must share geometry attributes');return merged;
  });
  sources.forEach(source=>source.removeFromParent());const combined=new T.Mesh(geometry,material);combined.castShadow=true;combined.receiveShadow=true;details.add(combined);
 }
}

function bankGeometry(width:number,depth:number,height:number):T.BufferGeometry{
 const geometry=new T.PlaneGeometry(width,depth,10,14).rotateX(-Math.PI/2),positions=geometry.getAttribute('position');
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),z=positions.getZ(i),envelope=Math.sin(Math.PI*(x/width+.5))*Math.sin(Math.PI*(z/depth+.5));
  positions.setY(i,.034+height*Math.max(0,envelope)*(1+.1*Math.sin(x*1.1+z*.7)));
 }
 geometry.computeVertexNormals();return geometry;
}

function meadowGeometry():T.BufferGeometry{
 const geometry=new T.PlaneGeometry(22,24,22,24).rotateX(-Math.PI/2),positions=geometry.getAttribute('position'),colors=new Float32Array(positions.count*4),base=new T.Color(0xa0be8e),edge=new T.Color(0xa9bd7e),interior=new T.Color(0xa3c68b),cool=new T.Color(0x739b78),dry=new T.Color(0xbbbd8a),shade=new T.Color();
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),z=positions.getZ(i),wx=x-1,wz=z-8;
  const ellipse=(cx:number,cz:number,rx:number,rz:number)=>Math.exp(-((wx-cx)**2/rx**2+(wz-cz)**2/rz**2)*1.4);
  const blend=T.MathUtils.clamp(Math.min(11-Math.abs(x),12-Math.abs(z))/(2.4+.55*Math.sin(x*.53+z*.39)),0,1);
  const canopy=Math.max(ellipse(-8.9,-3,3,3.5),ellipse(-4,-6,3.2,2.7),ellipse(-6,1,2.4,2.4));
  const sun=ellipse(6,-5,4,5)*.65+ellipse(-7,2.8,3.5,1.8)*.35,worn=ellipse(1,-5,.8,4.1)*.6;
  const dapple=1+.035*Math.sin(x*.51+z*.32)+.02*Math.cos(x*.21-z*.43);
  shade.copy(edge).lerp(interior,blend).lerp(cool,canopy*.68).lerp(dry,Math.min(.72,sun+worn)).multiplyScalar(dapple);
  colors.set([shade.r/base.r,shade.g/base.g,shade.b/base.b,blend*blend*(3-2*blend)],i*4);
 }
 geometry.setAttribute('color',new T.BufferAttribute(colors,4));return geometry;
}

/** Slender ribbons arch out of one small tussock; tips narrow after two visible bends. */
function grassGeometry():T.BufferGeometry{
 const vertices:number[]=[],uv:number[]=[],colors:number[]=[];
 const triangle=(a:T.Vector3,b:T.Vector3,c:T.Vector3)=>{
  for(const point of[a,b,c,c,b,a]){vertices.push(...point.toArray());uv.push(point.x+1,point.y*2);const color=new T.Color(0x6e7959).lerp(new T.Color(0xf0efc8),point.y/.43);colors.push(color.r,color.g,color.b);}
 };
 for(let blade=0;blade<3;blade++){
  const angle=blade*2.32+.2,h=[.34,.42,.30][blade],levels=blade===2?[0,.58]:[0,.4,.77];
  const rings=levels.map(t=>{
   const center=new T.Vector3(.12*t*t+.025,h*t,.14*t*t),width=.023*(1-t*.7)+.012*Math.sin(t*Math.PI),twist=t*.6;
   return[-1,1].map(side=>center.clone().add(new T.Vector3(side*width*Math.cos(twist),side*width*.12,side*width*Math.sin(twist))).applyAxisAngle(new T.Vector3(0,1,0),angle));
  });
  for(let i=0;i<rings.length-1;i++){triangle(rings[i][0],rings[i][1],rings[i+1][0]);triangle(rings[i][1],rings[i+1][1],rings[i+1][0]);}
  triangle(rings.at(-1)![0],rings.at(-1)![1],new T.Vector3(.145,h,.16).applyAxisAngle(new T.Vector3(0,1,0),angle));
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}

function herbGeometry(flower=false):T.BufferGeometry{
 const vertices:number[]=[],colors:number[]=[];
 const triangle=(a:T.Vector3,b:T.Vector3,c:T.Vector3,color:number)=>{const tint=new T.Color(color);for(const point of[a,b,c,c,b,a]){vertices.push(...point.toArray());colors.push(tint.r,tint.g,tint.b);}};
 if(flower){
  triangle(new T.Vector3(-.012,0,0),new T.Vector3(.012,0,0),new T.Vector3(.028,.32,.025),0x76915c);
  triangle(new T.Vector3(.012,0,0),new T.Vector3(.052,.32,.025),new T.Vector3(.028,.32,.025),0x76915c);
  for(let i=0;i<5;i++){
   const angle=i*Math.PI*2/5,point=(radius:number,offset=0)=>new T.Vector3(Math.cos(angle+offset)*radius+.04,.33-Math.max(0,radius-.05)*.16,Math.sin(angle+offset)*radius+.025);
   triangle(point(.025),point(.11,-.42),point(.19),0xf5f0da);triangle(point(.025),point(.19),point(.11,.42),0xf5f0da);
  }
  for(let i=0;i<6;i++)triangle(new T.Vector3(.04,.338,.025),new T.Vector3(.04+Math.cos(i*Math.PI/3)*.045,.338,.025+Math.sin(i*Math.PI/3)*.045),new T.Vector3(.04+Math.cos((i+1)*Math.PI/3)*.045,.338,.025+Math.sin((i+1)*Math.PI/3)*.045),0xd8b45c);
 }else for(let leaf=0;leaf<3;leaf++){
  const angle=leaf*2.2,rotate=(x:number,y:number,z:number)=>new T.Vector3(x,y,z).applyAxisAngle(new T.Vector3(0,1,0),angle);
  const base=rotate(0,.015,0),left=rotate(-.095,.075,.15),tip=rotate(.015,.11,.34),right=rotate(.095,.075,.15),ridge=rotate(0,.155,.16);
  triangle(base,left,ridge,0x6c935d);triangle(left,tip,ridge,0x88ac6c);triangle(tip,right,ridge,0x9cba76);triangle(right,base,ridge,0x7da063);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();return geometry;
}

type MeadowPoint={x:number;y:number;z:number;scale:number;yaw:number;dry:boolean};
/** Fixed patch envelopes leave the middle road, cottage approach and chopping footholds open. */
function meadowPoints():MeadowPoint[]{
 const patches=[[-8.8,2.7,2.1,.65,43],[-2.2,2.9,2.5,.55,38],[5.4,2.65,3.3,.68,39],[-9,-4.8,2,3.1,64],[-4.6,-6.5,2.5,2.1,61],[5.7,-5.4,2.7,2.6,49],[7,-13.1,1.7,3.2,28],[-8.5,-13.4,2.4,3.9,35],[-4.7,-17.5,3.5,1.25,23]];
 const points:MeadowPoint[]=[];
 for(let patch=0;patch<patches.length;patch++){
  const[cx,cz,rx,rz,count]=patches[patch];let placed=0;
  for(let attempt=0;placed<count&&attempt<count*50;attempt++){
   const seed=patch*1901+attempt*13,radius=Math.sqrt(noise(seed+31)),angle=noise(seed+43)*Math.PI*2;
   const x=cx+Math.cos(angle)*rx*radius,z=cz+Math.sin(angle)*rz*radius,scale=.66+noise(seed+67)*.63;
   // This is a composed clearing, including breathing room around trunks and actors.
   if(x< -11.55||x>9.55||z< -19.55||z>3.55||Math.abs(z)<1.66)continue;
   if(x>-.1&&x<2.1&&z> -9.5&&z< -1.1)continue;
   if(x> -2.7&&x<4.5&&z> -16.2&&z< -8.45)continue;
   if([[-6,1],[-9,-3],[-4,-6]].some(([tx,tz])=>Math.hypot(x-tx,z-tz)<.8))continue;
   if([[-4.75,1.35],[-7.75,-2.65],[-2.75,-5.65]].some(([tx,tz])=>Math.hypot(x-tx,z-tz)<1.1))continue;
   points.push({x,y:.034,z,scale,yaw:noise(seed+79)*Math.PI*2,dry:(patch<3||patch===8)&&noise(seed+83)>.56});placed++;
  }
 }
 return points;
}

function meadowPlants(r:WorldResources,palette:NprPalette,root:T.Group):void{
 const points=meadowPoints(),matrix=new T.Matrix4(),rotation=new T.Quaternion(),up=new T.Vector3(0,1,0),material=palette.material(0xffffff,'solid',true);
 // Sample only the authored low banks, once at construction. Plants reused by
 // herbs, flowers and stones inherit the same surface height without more rays.
 root.updateMatrixWorld(true);
 const banks=['sample-grass-bank-west','sample-grass-bank-back'].map(name=>root.getObjectByName(name)).filter((object):object is T.Mesh=>object instanceof T.Mesh);
 const terrainRay=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0));
 for(const point of points){terrainRay.ray.origin.set(point.x,4,point.z);point.y=Math.max(.034,terrainRay.intersectObjects(banks,false)[0]?.point.y??.034);}
 const add=(name:string,geometry:T.BufferGeometry,locations:MeadowPoint[],tint:(point:MeadowPoint,index:number)=>T.Color)=>{
  const plants=named(name,new T.InstancedMesh(geometry,material,locations.length));
  locations.forEach((point,index)=>{matrix.compose(new T.Vector3(point.x,point.y,point.z),rotation.setFromAxisAngle(up,point.yaw),new T.Vector3(point.scale,point.scale,point.scale));plants.setMatrixAt(index,matrix);plants.setColorAt(index,tint(point,index));});
  plants.receiveShadow=true;plants.computeBoundingSphere();root.add(plants);
 };
 const blades=r.geometry('npr-scenery/curved-grass-ribbons',grassGeometry);
 add('sample-meadow-grass',blades,points.filter(point=>!point.dry),(_,i)=>new T.Color([0xa6bc79,0x9fb97d,0xb3c98b,0x91aa72][i%4]));
 add('sample-dry-verge-grass',blades,points.filter(point=>point.dry),(_,i)=>new T.Color([0xd0b47e,0xc4af79,0xc6b785][i%3]));
 const corner=points.filter(point=>point.z> -8&&point.x<7),herbs=corner.filter((_,i)=>i%7===2).slice(0,32).map(point=>({...point,scale:point.scale*.85*.75}));
 add('sample-meadow-herbs',r.geometry('npr-scenery/broad-meadow-leaves',()=>herbGeometry()),herbs,()=>new T.Color(0xe6efd8));
 add('sample-meadow-daisies',r.geometry('npr-scenery/meadow-daisies',()=>herbGeometry(true)),corner.filter((_,i)=>i%17===5).slice(0,14).map(point=>({...point,scale:point.scale*.5})),()=>new T.Color(0xffffff));
 const stones=r.geometry('npr-scenery/meadow-stone',()=>{
  const geometry=new T.IcosahedronGeometry(.16,0),vertices=geometry.getAttribute('position'),colors:number[]=[];
  for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i);vertices.setXYZ(i,x*1.35,.086+y*.5,z);const tint=new T.Color(y>0?0xb4b39b:0x8b9683);colors.push(tint.r,tint.g,tint.b);}
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();return geometry;
 });
 add('sample-meadow-stones',stones,corner.filter((_,i)=>i%15===8).slice(0,18),()=>new T.Color(0xf0ecdc));
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
 mergeCottageDetails(r,details);
}

/** The first art sample deliberately occupies only the chopping/loading corner. */
export function buildNprSampleEnvironment(r:WorldResources,palette:NprPalette,options:{omitCottage?:boolean}={}):T.Group{
 const root=named('npr-sample-environment',new T.Group());
 const meadow=place(root,named('sample-painted-meadow',new T.Mesh(r.geometry('npr-scenery/painted-meadow',meadowGeometry),palette.material(0xa0be8e,'grass',true))),-1,.032,-8);meadow.receiveShadow=true;
 meadow.material.transparent=true;meadow.material.depthWrite=false;
 if(!options.omitCottage)cottage(r,palette,root);
 const west=place(root,named('sample-grass-bank-west',mesh(r,palette,'bank-west',()=>bankGeometry(3,8,.48),0x8da677,'grass',false)),-10.45,0,-11);
 west.receiveShadow=true;
 place(root,named('sample-grass-bank-back',mesh(r,palette,'bank-back',()=>bankGeometry(11.2,2.5,.34),0x96ad7e,'grass',false)),-1,0,-18);
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
 meadowPlants(r,palette,root);
 return root;
}
