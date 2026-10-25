import * as T from 'three';
import type {UserCharacterRig,UserBoneName} from './userCharacterRig.js';
import type {WorldActor} from './types.js';
import {NprMotion} from './nprMotion.js';

/** Load-only presentation on the supplied skin. No clip clock or exercise events. */
export class UserLoadMotion{
 private motion=new NprMotion();private initialized=false;private previousPose='';private phaseMs=0;private previous='';private revision=0;
 private readonly hand=new T.Vector2();private readonly fromHand=new T.Vector2();
 private wrist=0;private fromWrist=0;
 private followLean=0;private fromLean=0;
 constructor(private readonly rig:UserCharacterRig){}
 get visualRevision():number{return this.revision;}
 update(actor:WorldActor,deltaMs?:number):void{
  if(this.initialized&&deltaMs!==undefined&&(!Number.isFinite(deltaMs)||deltaMs<=0||deltaMs>100))return;
  const snapshot=!this.initialized||deltaMs===undefined;
  const returning=actor.pose==='load-return',target=this.handTarget(actor.pose),duration=returning?360:actor.pose==='stand-up'?170:140,targetWrist=-.6*T.MathUtils.smoothstep(target.x,1.2,2.35*.83);
  if(snapshot){this.hand.copy(target);this.fromHand.copy(target);this.wrist=this.fromWrist=targetWrist;this.followLean=this.fromLean=0;this.phaseMs=duration;}
  else{
   if(actor.pose!==this.previousPose){this.fromHand.copy(this.hand);this.fromWrist=this.wrist;this.fromLean=this.followLean;this.phaseMs=0;}
   this.phaseMs=Math.min(duration,this.phaseMs+(deltaMs??0));
   if(returning){
    // Match the departing timber briefly before folding the arms back down.
    const follow=this.fromHand.clone().add(new T.Vector2(.08,.11)),forward=new T.Vector2(1.65*.83,this.fromHand.y+.40);
    if(this.phaseMs<=80)this.hand.copy(this.fromHand).lerp(follow,T.MathUtils.smoothstep(this.phaseMs,0,80));
    else if(this.phaseMs<=140)this.hand.copy(follow).lerp(forward,T.MathUtils.smoothstep(this.phaseMs,80,140));
    else this.hand.copy(forward).lerp(target,T.MathUtils.smoothstep(this.phaseMs,140,360));
    this.wrist=T.MathUtils.lerp(this.fromWrist,targetWrist,T.MathUtils.smoothstep(this.phaseMs,140,360));
    this.followLean=T.MathUtils.lerp(this.fromLean,.10,T.MathUtils.smoothstep(this.phaseMs,0,80))*(1-T.MathUtils.smoothstep(this.phaseMs,140,360));
   }else{const blend=T.MathUtils.smoothstep(this.phaseMs,0,duration);this.hand.copy(this.fromHand).lerp(target,blend);this.wrist=T.MathUtils.lerp(this.fromWrist,targetWrist,blend);this.followLean=T.MathUtils.lerp(this.fromLean,0,blend);}
  }
  this.previousPose=actor.pose;this.initialized=true;
  const f=this.motion.advance(actor,false,snapshot?undefined:deltaMs),key=`${JSON.stringify(f)}/${this.hand.x}/${this.hand.y}/${this.wrist}/${this.followLean}`;
  if(!snapshot&&key===this.previous)return;this.previous=key;
  const rig=this.rig;rig.root.updateWorldMatrix(true,true);rig.resetPose();
  const squat=Math.min(.32,f.squat*.72),straighten=-.48+f.lean*.7+this.followLean;
  rig.bones.pelvis.position.y+=.055-squat;rig.bones.pelvis.position.z+=-.025+f.hipZ*.5;
  this.rotate('pelvis',-.035,f.twist*.15);this.rotate('spine',straighten*.6,f.twist*.4);this.rotate('chest',straighten*.4,f.twist*.45);
  this.rotate('neck',-.08+f.headPitch*.4,0);this.rotate('head',-.025+f.headPitch*.3,-f.twist*.25);
  rig.root.updateMatrixWorld(true);
  const rootRotation=rig.root.getWorldQuaternion(new T.Quaternion()),rootScale=rig.root.getWorldScale(new T.Vector3());
  for(const side of ['left','right'] as const){
   const foot=`${side}Foot` as const;
   this.solve(`${side}Thigh`,`${side}Shin`,foot,rig.root.localToWorld(rig.rest[foot].worldPosition.clone()),rig.root.localToWorld(new T.Vector3(side==='left'?.5:-.15,.5,.65)));
   this.worldRotation(foot,rootRotation.clone().multiply(rig.rest[foot].worldQuaternion));
  }
  // One displayed hand channel owns every phase handoff, including an early
  // next rep. The body interpolator never overwrites this reach or height.
  const handY=this.hand.x,handZ=this.hand.y;
  for(const side of ['left','right'] as const){
   const hand=`${side}Hand` as const,sign=side==='left'?1:-1;
   const rotation=rootRotation.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),this.wrist)).multiply(rig.rest[hand].worldQuaternion);
   const target=rig.root.localToWorld(new T.Vector3(.16+sign*.23,handY,handZ));
   target.sub(rig.palms[side].clone().multiply(rootScale).applyQuaternion(rotation));
   this.solve(`${side}UpperArm`,`${side}ForeArm`,hand,target,rig.root.localToWorld(new T.Vector3(side==='left'?1.2:-.8,1.1,.35)));
   this.worldRotation(hand,rotation);
  }
  rig.root.updateMatrixWorld(true);rig.skeleton.update();this.revision++;
 }
 handPosition():T.Vector3{
  const rig=this.rig;
  return rig.bones.leftHand.localToWorld(rig.palms.left.clone()).add(rig.bones.rightHand.localToWorld(rig.palms.right.clone())).multiplyScalar(.5);
 }
 reset():void{this.motion=new NprMotion();this.initialized=false;this.previousPose='';this.phaseMs=0;this.hand.set(0,0);this.fromHand.set(0,0);this.wrist=this.fromWrist=this.followLean=this.fromLean=0;this.previous='';this.rig.resetPose();this.revision++;}
 private handTarget(phase:WorldActor['pose']):T.Vector2{
  if(phase==='squat-down')return new T.Vector2(.45*.83,.55*.65+.05);
  if(phase==='stand-up')return new T.Vector2(1.55*.83,.48*.65+.05);
  if(phase==='press-up')return new T.Vector2(2.35*.83,.48*.65+.05+.22);
  return new T.Vector2(1.05*.83,.48*.65+.05);
 }
 private rotate(name:UserBoneName,x:number,y:number):void{
  const rig=this.rig,bone=rig.bones[name],parent=bone.parent instanceof T.Bone?bone.parent:null;
  const parentName=parent?Object.keys(rig.bones).find(key=>rig.bones[key as UserBoneName]===parent) as UserBoneName:undefined;
  const basis=parentName?rig.rest[parentName].worldQuaternion:new T.Quaternion();
  bone.quaternion.premultiply(basis.clone().invert().multiply(new T.Quaternion().setFromEuler(new T.Euler(x,y,0))).multiply(basis));
 }
 private worldRotation(name:UserBoneName,rotation:T.Quaternion):void{
  const bone=this.rig.bones[name],parent=bone.parent!.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(parent.invert().multiply(rotation));bone.updateWorldMatrix(false,true);
 }
 private aim(name:UserBoneName,child:UserBoneName,target:T.Vector3):void{
  const bone=this.rig.bones[name],start=bone.getWorldPosition(new T.Vector3()),current=this.rig.bones[child].getWorldPosition(new T.Vector3()).sub(start).normalize(),desired=target.clone().sub(start).normalize();
  this.worldRotation(name,new T.Quaternion().setFromUnitVectors(current,desired).multiply(bone.getWorldQuaternion(new T.Quaternion())));
 }
 private solve(upper:UserBoneName,middle:UserBoneName,end:UserBoneName,target:T.Vector3,pole:T.Vector3):void{
  const bones=this.rig.bones,start=bones[upper].getWorldPosition(new T.Vector3()),middlePoint=bones[middle].getWorldPosition(new T.Vector3()),endPoint=bones[end].getWorldPosition(new T.Vector3());
  const a=middlePoint.distanceTo(start),b=endPoint.distanceTo(middlePoint),direction=target.clone().sub(start),distance=T.MathUtils.clamp(direction.length(),Math.abs(a-b)+.000001,a+b-.000001);direction.normalize();
  const bend=pole.clone().sub(start);bend.addScaledVector(direction,-bend.dot(direction)).normalize();
  const cosine=T.MathUtils.clamp((a*a+distance*distance-b*b)/(2*a*distance),-1,1),elbow=start.clone().addScaledVector(direction,a*cosine).addScaledVector(bend,a*Math.sqrt(1-cosine*cosine));
  this.aim(upper,middle,elbow);this.aim(middle,end,target);
 }
}
