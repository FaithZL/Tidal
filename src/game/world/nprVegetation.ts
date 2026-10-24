import * as T from 'three';
import type {NprPalette} from './nprMaterials.js';
import type {WorldResources} from './resources.js';

type WoodRing={x:number;y:number;z:number;radius:number;depth?:number};
type WoodPath={rings:WoodRing[];sides:number};

/** Several tapered, curved limbs share one owned mesh, including their end caps. */
function woodGeometry(r:WorldResources,key:string,paths:WoodPath[]):T.BufferGeometry{
 return r.geometry(key,()=>{
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];
  for(const {rings,sides} of paths){
   const offset=positions.length/3;
   const point=(i:number)=>new T.Vector3(rings[i].x,rings[i].y,rings[i].z);
   for(let j=0;j<rings.length;j++){
    const ring=rings[j],tangent=point(Math.min(j+1,rings.length-1)).sub(point(Math.max(0,j-1))).normalize();
    if(ring.y===0)tangent.set(0,1,0);
    const right=new T.Vector3(tangent.y,-tangent.x,0).normalize(),forward=new T.Vector3().crossVectors(right,tangent).normalize();
    for(let i=0;i<=sides;i++){
     const angle=i/sides*Math.PI*2;
     const position=point(j).addScaledVector(right,Math.cos(angle)*ring.radius).addScaledVector(forward,Math.sin(angle)*(ring.depth??ring.radius));
     positions.push(position.x,position.y,position.z);uv.push(i/sides,ring.y*.8);
    }
   }
   for(let j=0;j<rings.length-1;j++)for(let i=0;i<sides;i++){
    const a=offset+j*(sides+1)+i,b=a+1,c=a+sides+1,d=c+1;indices.push(a,c,b,b,c,d);
   }
   // Caps use separate vertices so the bark retains its rounded side normals.
   for(const end of[0,rings.length-1]){
    const center=positions.length/3,ringOffset=offset+end*(sides+1),ring=rings[end];
    positions.push(ring.x,ring.y,ring.z);uv.push(.5,.5);
    for(let i=0;i<=sides;i++){
     const source=(ringOffset+i)*3;positions.push(positions[source],positions[source+1],positions[source+2]);uv.push(.5+Math.cos(i/sides*Math.PI*2)*.5,.5+Math.sin(i/sides*Math.PI*2)*.5);
    }
    for(let i=0;i<sides;i++)if(end===0)indices.push(center,center+1+i,center+2+i);else indices.push(center,center+2+i,center+1+i);
   }
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
 });
}

/** Folded intersecting cards carry actual painted leaf edges, with no opaque canopy core. */
function boughGeometry(r:WorldResources):T.BufferGeometry{
 return r.geometry('npr-leaf-bough-cross-v3',()=>{
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let plane=0;plane<2;plane++){
   const offset=positions.length/3,rotation=new T.Matrix4().makeRotationY(plane*Math.PI/2);
   for(let y=0;y<2;y++)for(let x=0;x<3;x++){
    const point=new T.Vector3((x-1)*.5,y-.5,x===1?.065:0).applyMatrix4(rotation);
    positions.push(point.x,point.y,point.z);uv.push(x*.5,y);
   }
   for(let x=0;x<2;x++){const a=offset+x,b=a+1,c=a+3,d=c+1;indices.push(a,b,c,b,d,c);}
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
 });
}

const bole:WoodRing[]=[
 {x:0,y:0,z:0,radius:.30,depth:.27},{x:.015,y:.19,z:-.012,radius:.24,depth:.215},
 {x:.05,y:.68,z:-.025,radius:.185,depth:.175},{x:.025,y:1.27,z:0,radius:.153,depth:.145},
 {x:-.045,y:1.82,z:.028,radius:.122},{x:.07,y:2.32,z:.065,radius:.084},
 {x:.13,y:2.72,z:.04,radius:.045},
];
const canopies=[
 {x:-.83,y:3.18,z:.05,rx:.64,ry:.36,rz:.60},
 {x:.78,y:3.30,z:-.12,rx:.66,ry:.38,rz:.56},
 {x:-.08,y:3.91,z:-.18,rx:.66,ry:.39,rz:.62},
 {x:-.17,y:3.38,z:.79,rx:.63,ry:.38,rz:.60},
 {x:.17,y:3.31,z:-.84,rx:.63,ry:.35,rz:.58},
 {x:-.84,y:3.68,z:-.38,rx:.57,ry:.35,rz:.56},
 {x:.83,y:3.78,z:.33,rx:.57,ry:.37,rz:.57},
 {x:.10,y:4.10,z:.34,rx:.54,ry:.33,rz:.51},
];

/** Local sample: root-owned trunk and ground-pivot crown retain the existing fall interface. */
export function makeNprTree(r:WorldResources,p:NprPalette):{root:T.Group;crown:T.Group;trunk:T.Mesh}{
 const root=new T.Group(),crown=new T.Group();root.add(crown);root.name='npr-broadleaf-tree';
 const trunkPaths:WoodPath[]=[{rings:bole,sides:14}];
 for(let i=0;i<6;i++){
  const angle=i*Math.PI/3+.19,length=.64+(i%3)*.055;
  trunkPaths.push({sides:8,rings:[
   {x:Math.cos(angle)*.11,y:.35,z:Math.sin(angle)*.11,radius:.245,depth:.19},
   {x:Math.cos(angle)*.32,y:.17,z:Math.sin(angle)*.32,radius:.14,depth:.105},
   {x:Math.cos(angle)*length,y:.045,z:Math.sin(angle)*length,radius:.035,depth:.032},
  ]});
 }
 const bark=p.material(0x9a8262,'bark'),trunk=new T.Mesh(woodGeometry(r,'npr-rooted-curved-trunk-v3',trunkPaths),bark);
 trunk.name='npr-rooted-trunk';trunk.castShadow=trunk.receiveShadow=true;root.add(trunk);
 // A slightly inset bole is hidden by the standing trunk and supplies the falling crown's stem.
 const branchPaths:WoodPath[]=[{sides:12,rings:bole.slice(1).map(ring=>({...ring,radius:ring.radius*.94,depth:(ring.depth??ring.radius)*.94}))}];
 canopies.forEach((lobe,index)=>{
  const fork={x:.03,y:1.65+(index%3)*.19,z:.025},bend={x:lobe.x*.46,y:2.58+(index%2)*.16,z:lobe.z*.43};
  branchPaths.push({sides:9,rings:[
   {...fork,radius:.108-index*.005},{...bend,radius:.069-index*.0025},
   {x:lobe.x*.83,y:lobe.y-.18,z:lobe.z*.83,radius:.037},
   {x:lobe.x,y:lobe.y+.12,z:lobe.z,radius:.014},
  ]});
  for(const sign of[-1,1])branchPaths.push({sides:6,rings:[
   {x:lobe.x*.68,y:lobe.y-.38,z:lobe.z*.68,radius:.031},
   {x:lobe.x+sign*.28,y:lobe.y-.05,z:lobe.z+sign*.17,radius:.016},
   {x:lobe.x+sign*.48,y:lobe.y+.15,z:lobe.z+sign*.25,radius:.004},
  ]});
 });
 const branches=new T.Mesh(woodGeometry(r,'npr-tapered-forks-v3',branchPaths),bark);branches.name='npr-visible-forks';branches.castShadow=branches.receiveShadow=true;crown.add(branches);
 const boughsPerCanopy=16;
 const leaves=new T.InstancedMesh(boughGeometry(r),p.leaves(),canopies.length*boughsPerCanopy);leaves.name='npr-tree-leaf-boughs';leaves.castShadow=true;leaves.receiveShadow=false;
 const dummy=new T.Object3D(),color=new T.Color();
 canopies.forEach((lobe,lobeIndex)=>{
  for(let i=0;i<boughsPerCanopy;i++){
   const index=lobeIndex*boughsPerCanopy+i,angle=i*2.399963229728653+lobeIndex*.71;
   const level=1-2*(i+.5)/boughsPerCanopy,ring=Math.sqrt(1-level*level),depth=.67+(i%5)*.066;
   dummy.position.set(lobe.x+Math.cos(angle)*ring*lobe.rx*depth,lobe.y+level*lobe.ry,lobe.z+Math.sin(angle)*ring*lobe.rz*depth);
   // Upper twigs stand more upright, keeping the larger leaves inside the interaction envelope.
   const tipTilt=T.MathUtils.clamp((4.20-dummy.position.y)/.4,0,1);
   dummy.rotation.set((.48+Math.sin(angle*1.3)*.45)*tipTilt,angle+.37*lobeIndex,Math.cos(angle*.7)*.65*tipTilt);
   const size=.76+(i%4)*.05;dummy.scale.set(size*(.95+(i%3)*.07),size,size);dummy.updateMatrix();leaves.setMatrixAt(index,dummy.matrix);
   const edge=.5+.5*Math.cos(angle-.7),height=(dummy.position.y-2.8)/1.7;
   const light=T.MathUtils.clamp(.42*edge+.35*height+(i%4===0?.15:0),0,1);
   color.setRGB(.57+light*.41,.68+light*.30,.52+light*.28);leaves.setColorAt(index,color);
  }
 });
 leaves.instanceMatrix.needsUpdate=true;if(leaves.instanceColor)leaves.instanceColor.needsUpdate=true;leaves.computeBoundingBox();leaves.computeBoundingSphere();crown.add(leaves);
 return{root,crown,trunk};
}
