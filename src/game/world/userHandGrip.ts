import * as T from 'three';
import type {UserCharacterRig} from './userCharacterRig.js';
export interface UserHandGrip{
 readonly centers:{readonly left:T.Vector3;readonly right:T.Vector3};
 readonly frames:{readonly left:T.Quaternion;readonly right:T.Quaternion};
 apply(pressure:number):void;restore():void;
}
/** Local adapter on the supplied real hand mesh; the original FBX stays intact. */
export function createUserHandGrip(rig:UserCharacterRig):UserHandGrip{
 const geometry=rig.mesh.geometry,position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal');
 const basePosition=new Float32Array(position.array),baseNormal=new Float32Array(normal.array);
 const local=(side:'left'|'right',point:T.Vector3)=>point.sub(rig.rest[`${side}Hand`].worldPosition).applyQuaternion(rig.rest[`${side}Hand`].worldQuaternion.clone().invert());
 const centers={left:local('left',new T.Vector3(.468,.900,-.040)),right:local('right',new T.Vector3(.056,.578,.170))};
 const frames={left:new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(.010667,-.289890,.957).normalize()),right:new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(0,0,1))};
 const target=new Float32Array(basePosition),members=new Set<number>(),groups=new Map<string,number[]>();
 for(let i=0;i<position.count;i++){
  const key=`${position.getX(i).toFixed(6)}/${position.getY(i).toFixed(6)}/${position.getZ(i).toFixed(6)}`,corners=groups.get(key)??[];corners.push(i);groups.set(key,corners);
 }
 const handData=(['left','right']as const).map(side=>{
  const center=centers[side].clone().applyQuaternion(rig.rest[`${side}Hand`].worldQuaternion).add(rig.rest[`${side}Hand`].worldPosition),frame=frames[side],inverse=frame.clone().invert();
  const ids=geometry.getAttribute('skinIndex'),weights=geometry.getAttribute('skinWeight'),bones=new Set([rig.skeleton.bones.indexOf(rig.bones[`${side}Hand`]),rig.skeleton.bones.indexOf(rig.bones[`${side}ForeArm`])]);
  const allowed=(i:number)=>{let sum=0;for(let j=0;j<4;j++)if(bones.has(ids.getComponent(i,j)))sum+=weights.getComponent(i,j);return sum>.96&&position.getY(i)<(side==='left'?1.05:.72);};
  const points:T.Vector3[]=[],copies:number[][]=[],lookup=new Map<number,number>();
  for(const corners of groups.values())if(corners.some(allowed)){
   const i=corners[0],point=new T.Vector3().fromBufferAttribute(position,i).sub(center).applyQuaternion(inverse);
   if(Math.abs(point.y)>.16||Math.hypot(point.x,point.z)>.15)continue;
   const id=points.length;points.push(point);copies.push(corners);corners.forEach(corner=>lookup.set(corner,id));
  }
  const triangles:number[][]=[];
  for(let i=0;i<position.count;i+=3)if(lookup.has(i)&&lookup.has(i+1)&&lookup.has(i+2))triangles.push([lookup.get(i)!,lookup.get(i+1)!,lookup.get(i+2)!]);
  const original=points.map(point=>point.clone()),radius=.036;
  const faces=triangles.map(triangle=>{
   const [a,b,c]=triangle.map(id=>original[id]),cross=b.clone().sub(a).cross(c.clone().sub(a)),area=cross.length();return {normal:cross.normalize(),area};
  });
  // Resolve contact on actual triangle faces, including thumb caps that cross
  // the axis despite their individual vertices lying outside the shaft.
  for(let pass=0;pass<48;pass++){
   let moved=false;
   for(const triangle of triangles){
    const a=points[triangle[0]],b=points[triangle[1]],c=points[triangle[2]];
    if(Math.min(a.y,b.y,c.y)>.082||Math.max(a.y,b.y,c.y)<-.082)continue;
    const projected=[a,b,c],cross=(p:T.Vector3,q:T.Vector3)=>p.x*q.z-p.z*q.x;
    const signs=[cross(a,b),cross(b,c),cross(c,a)],area=signs[0]+signs[1]+signs[2];
    let distance=Infinity,nearX=0,nearZ=0;
    if(Math.abs(area)>1e-10&&(signs.every(value=>value>=0)||signs.every(value=>value<=0)))distance=0;
    for(let j=0;j<3;j++){
     const p=projected[j],q=projected[(j+1)%3],dx=q.x-p.x,dz=q.z-p.z,denominator=dx*dx+dz*dz,t=denominator?T.MathUtils.clamp(-(p.x*dx+p.z*dz)/denominator,0,1):0,x=p.x+t*dx,z=p.z+t*dz,r=Math.hypot(x,z);
     if(r<distance){distance=r;nearX=x;nearZ=z;}
    }
    if(distance>=radius)continue;
    let x=nearX,z=nearZ;if(distance<1e-8){x=(a.x+b.x+c.x)/3;z=(a.z+b.z+c.z)/3;}
    const length=Math.hypot(x,z);if(length<1e-8){x=side==='left'?1:-1;z=0;}else{x/=length;z/=length;}
    const needed=Math.max(...triangle.map(id=>radius-(points[id].x*x+points[id].z*z))),step=Math.min(.003,needed);
    for(const id of triangle){
     const point=points[id];point.x+=x*step;point.z+=z*step;
     const delta=point.clone().sub(original[id]);if(delta.length()>.042)point.copy(original[id]).add(delta.setLength(.042));moved=true;
    }
   }
   // Keep the original finger pad faces facing out. Surface contact alone can
   // turn a small folded cap inside out while still clearing the cylinder.
   for(let i=0;i<triangles.length;i++){
    const triangle=triangles[i],[a,b,c]=triangle.map(id=>points[id]),face=faces[i];if(face.area<1e-8)continue;
    const area=b.clone().sub(a).cross(c.clone().sub(a)).dot(face.normal),missing=face.area*.3-area;if(missing<=0)continue;
    const gradients=[b.clone().sub(c).cross(face.normal),c.clone().sub(a).cross(face.normal),a.clone().sub(b).cross(face.normal)],sum=gradients.reduce((total,gradient)=>total+gradient.lengthSq(),0);if(sum<1e-12)continue;
    for(let j=0;j<3;j++){
     const id=triangle[j],point=points[id];point.addScaledVector(gradients[j],missing/sum*.85);
     const delta=point.clone().sub(original[id]);if(delta.length()>.042)point.copy(original[id]).add(delta.setLength(.042));moved=true;
    }
   }
   if(!moved)break;
  }
  points.forEach((point,id)=>{
   if(point.distanceToSquared(original[id])<1e-14)return;
   const root=point.clone().applyQuaternion(frame).add(center);
   for(const i of copies[id]){target[i*3]=root.x;target[i*3+1]=root.y;target[i*3+2]=root.z;members.add(i);}
  });
  return {center,frame,inverse,points,original,copies,triangles};
 });
 const loose=new Float32Array(target),tight=new Float32Array(target);
 for(const data of handData)for(let id=0;id<data.points.length;id++){
  if(!data.copies[id].some(i=>members.has(i)))continue;
  const point=data.points[id].clone();point.x*=.96;point.z*=.96;point.applyQuaternion(data.frame).add(data.center);
  for(const i of data.copies[id]){tight[i*3]=point.x;tight[i*3+1]=point.y;tight[i*3+2]=point.z;}
 }
 const alteredTriangles:number[]=[];for(let i=0;i<position.count;i+=3)if(members.has(i)||members.has(i+1)||members.has(i+2))alteredTriangles.push(i);
 const normalMembers=new Set<number>();for(const i of alteredTriangles)for(let j=0;j<3;j++){
  const key=`${position.getX(i+j).toFixed(6)}/${position.getY(i+j).toFixed(6)}/${position.getZ(i+j).toFixed(6)}`;for(const corner of groups.get(key)!)normalMembers.add(corner);
 }
 const correctedNormals=(vertices:Float32Array):Float32Array=>{
  const result=new Float32Array(baseNormal),sums=new Map<string,T.Vector3>(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  for(let i=0;i<position.count;i+=3){
   if(!normalMembers.has(i)&&!normalMembers.has(i+1)&&!normalMembers.has(i+2))continue;
   a.fromArray(vertices,i*3);b.fromArray(vertices,(i+1)*3);c.fromArray(vertices,(i+2)*3);const face=b.sub(a).cross(c.sub(a));
   for(let j=0;j<3;j++){
    const corner=i+j,key=`${position.getX(corner).toFixed(6)}/${position.getY(corner).toFixed(6)}/${position.getZ(corner).toFixed(6)}`;
    if(!normalMembers.has(corner))continue;const sum=sums.get(key)??new T.Vector3();sum.add(face);sums.set(key,sum);
   }
  }
  for(const [key,sum]of sums){sum.normalize();for(const i of groups.get(key)!)if(normalMembers.has(i)){result[i*3]=sum.x;result[i*3+1]=sum.y;result[i*3+2]=sum.z;}}
  return result;
 };
 const looseNormal=correctedNormals(loose),tightNormal=correctedNormals(tight);let previous:number|undefined;
 return {centers,frames,
  apply(pressure){
   const value=Number.isFinite(pressure)?T.MathUtils.clamp(pressure,.85,1):.95;if(value===previous)return;previous=value;const blend=(value-.85)/.15;
   for(const i of members)for(let j=0;j<3;j++)position.setComponent(i,j,T.MathUtils.lerp(loose[i*3+j],tight[i*3+j],blend));
   const n=new T.Vector3();for(const i of normalMembers){n.set(T.MathUtils.lerp(looseNormal[i*3],tightNormal[i*3],blend),T.MathUtils.lerp(looseNormal[i*3+1],tightNormal[i*3+1],blend),T.MathUtils.lerp(looseNormal[i*3+2],tightNormal[i*3+2],blend)).normalize();normal.setXYZ(i,n.x,n.y,n.z);}
   position.needsUpdate=true;normal.needsUpdate=true;
  },
  restore(){position.array.set(basePosition);normal.array.set(baseNormal);position.needsUpdate=true;normal.needsUpdate=true;previous=undefined;},
 };
}
