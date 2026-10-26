import * as T from 'three';
import type {UserCharacterRig,UserBoneName} from './userCharacterRig.js';
import type {WorldActor} from './types.js';
import {NprMotion} from './nprMotion.js';

type Side='left'|'right';
interface Shoe{indices:number[];offsets:T.Vector3[]}
/** Stride is supplied by the world; this module never advances it or a task. */
export class UserWalkMotion{
 private motion=new NprMotion();private initialized=false;private previous='';private revision=0;
 private readonly shoes:Record<Side,Shoe>;
 constructor(private readonly rig:UserCharacterRig){this.shoes={left:this.shoe('left'),right:this.shoe('right')};}
 get visualRevision():number{return this.revision;}
 update(actor:WorldActor,deltaMs?:number):void{
  if(this.initialized&&deltaMs!==undefined&&(!Number.isFinite(deltaMs)||deltaMs<=0||deltaMs>100))return;
  // Snapshots also use the authored stance/swing cycle, without adding time.
  if(deltaMs===undefined)this.motion=new NprMotion();
  const frame=this.motion.advance(actor,false,this.initialized&&deltaMs!==undefined?deltaMs:16),key=JSON.stringify(frame);
  if(this.initialized&&key===this.previous)return;this.initialized=true;this.previous=key;
  const rig=this.rig;rig.root.updateWorldMatrix(true,true);rig.resetPose();
  // The source bind pose puts its shoulders far behind the cart grips. A
  // shared upright stance keeps both grips reachable during mode handoffs.
  rig.bones.pelvis.position.x+=frame.hipX;rig.bones.pelvis.position.y+=-.035+frame.rise;rig.bones.pelvis.position.z+=.22+frame.lean*.3;
  this.rotate('pelvis',0,frame.twist*.15,frame.roll);
  this.rotate('spine',(-.12+frame.lean)*.6,frame.twist*.4,0);this.rotate('chest',(-.12+frame.lean)*.4,frame.twist*.45,0);
  this.rotate('neck',-.03+frame.headPitch*.4,frame.headYaw*.3,0);this.rotate('head',frame.headPitch*.3,frame.headYaw*.4,0);
  rig.root.updateMatrixWorld(true);
  for(const [i,side] of (['left','right'] as const).entries()){
   const foot=`${side}Foot` as const,rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),frame.footPitch[i]).multiply(rig.rest[foot].worldQuaternion);
   const shoe=this.shoes[side],bottom=Math.min(...shoe.offsets.map(offset=>offset.clone().applyQuaternion(rotation).y));
   const target=new T.Vector3(side==='left'?.40:-.08,-bottom+frame.lift[i],frame.lean*.3+frame.step[i]);
   this.solve(`${side}Thigh`,`${side}Shin`,foot,target,new T.Vector3(side==='left'?.5:-.2,.45,.65));this.rotation(foot,rotation);
   // Blend weights near the ankle can differ slightly from a rigid shoe. Use
   // its actual low skin to keep the observed stance above the same floor.
   rig.skeleton.update();
   const floor=Math.min(...shoe.indices.map(index=>this.vertex(index).y)),correction=frame.lift[i]-floor;
   if(Math.abs(correction)>.00001){target.y+=correction;this.solve(`${side}Thigh`,`${side}Shin`,foot,target,new T.Vector3(side==='left'?.5:-.2,.45,.65));this.rotation(foot,rotation);}
  }
  for(const [i,side] of (['left','right'] as const).entries()){
   const hand=`${side}Hand` as const,sign=side==='left'?1:-1,gripping=actor.mode==='push'||actor.mode==='pull';
   const pitch=gripping?(actor.mode==='push'?-Math.PI/2:Math.PI/2):0;
   const rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),pitch).multiply(rig.rest[hand].worldQuaternion);
   const target=gripping?new T.Vector3(sign*.35,1.04,actor.mode==='push'?.5:-.55):new T.Vector3(.16+sign*.34,Math.min(1.86,frame.handY*.83),frame.handZ*.65+frame.handSwing[i]*1.3);
   target.sub(rig.palms[side].clone().applyQuaternion(rotation));
   this.solve(`${side}UpperArm`,`${side}ForeArm`,hand,target,new T.Vector3(side==='left'?1.15:-.85,1.15,.15));this.rotation(hand,rotation);
  }
  rig.root.updateMatrixWorld(true);rig.skeleton.update();this.revision++;
 }
 reset():void{this.motion=new NprMotion();this.initialized=false;this.previous='';this.rig.resetPose();this.revision++;}
 handPosition():T.Vector3{return this.rig.bones.leftHand.localToWorld(this.rig.palms.left.clone()).add(this.rig.bones.rightHand.localToWorld(this.rig.palms.right.clone())).multiplyScalar(.5);}
 private shoe(side:Side):Shoe{
  const rig=this.rig,geometry=rig.mesh.geometry,positions=geometry.getAttribute('position'),indices=geometry.getAttribute('skinIndex'),weights=geometry.getAttribute('skinWeight');
  const chain=[`${side}Foot`,`${side}Shin`,`${side}Thigh`].map(name=>rig.skeleton.bones.indexOf(rig.bones[name as UserBoneName])),corners:number[]=[];
  for(let i=0;i<positions.count;i++){
   let weight=0;for(let j=0;j<4;j++)if(chain.includes(indices.getComponent(i,j)))weight+=weights.getComponent(i,j);
   if(positions.getY(i)<.3&&weight>.5)corners.push(i);
  }
  const foot=rig.rest[`${side}Foot`],inverse=foot.worldQuaternion.clone().invert();
  return {indices:corners,offsets:corners.map(index=>new T.Vector3().fromBufferAttribute(positions,index).sub(foot.worldPosition).applyQuaternion(inverse))};
 }
 private vertex(index:number):T.Vector3{
  const rig=this.rig;return rig.root.worldToLocal(rig.mesh.getVertexPosition(index,new T.Vector3()).applyMatrix4(rig.mesh.matrixWorld));
 }
 private point(name:UserBoneName):T.Vector3{return this.rig.root.worldToLocal(this.rig.bones[name].getWorldPosition(new T.Vector3()));}
 /** Skeletal rotations stay in root coordinates so scaled parents cannot shear IK targets. */
 private orientation(bone:T.Object3D|null):T.Quaternion{
  const result=new T.Quaternion();while(bone&&bone!==this.rig.root){result.premultiply(bone.quaternion);bone=bone.parent;}return result;
 }
 private rotation(name:UserBoneName,rotation:T.Quaternion):void{
  const bone=this.rig.bones[name];bone.quaternion.copy(this.orientation(bone.parent).invert().multiply(rotation));bone.updateWorldMatrix(false,true);
 }
 private rotate(name:UserBoneName,x:number,y:number,z:number):void{
  const rig=this.rig,bone=rig.bones[name],parent=bone.parent instanceof T.Bone?bone.parent:null;
  const parentName=parent?Object.keys(rig.bones).find(key=>rig.bones[key as UserBoneName]===parent) as UserBoneName:undefined,basis=parentName?rig.rest[parentName].worldQuaternion:new T.Quaternion();
  bone.quaternion.premultiply(basis.clone().invert().multiply(new T.Quaternion().setFromEuler(new T.Euler(x,y,z))).multiply(basis));
 }
 private aim(name:UserBoneName,child:UserBoneName,target:T.Vector3):void{
  const bone=this.rig.bones[name],start=this.point(name),current=this.point(child).sub(start).normalize(),desired=target.clone().sub(start).normalize();
  this.rotation(name,new T.Quaternion().setFromUnitVectors(current,desired).multiply(this.orientation(bone)));
 }
 private solve(upper:UserBoneName,middle:UserBoneName,end:UserBoneName,target:T.Vector3,pole:T.Vector3):void{
  const start=this.point(upper),mid=this.point(middle),finish=this.point(end),a=mid.distanceTo(start),b=finish.distanceTo(mid),direction=target.clone().sub(start),distance=T.MathUtils.clamp(direction.length(),Math.abs(a-b)+.000001,a+b-.000001);direction.normalize();
  const bend=pole.clone().sub(start);bend.addScaledVector(direction,-bend.dot(direction)).normalize();
  const cosine=T.MathUtils.clamp((a*a+distance*distance-b*b)/(2*a*distance),-1,1),joint=start.clone().addScaledVector(direction,a*cosine).addScaledVector(bend,a*Math.sqrt(1-cosine*cosine));
  this.aim(upper,middle,joint);this.aim(middle,end,target);
 }
}
