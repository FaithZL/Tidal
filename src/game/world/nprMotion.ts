import type {WorldActor} from './types.js';

interface Pose{
 handY:number;handZ:number;squat:number;lean:number;twist:number;roll:number;hipZ:number;
 headPitch:number;headYaw:number;elbowOut:number;elbowLift:number;axePitch:number;axeRoll:number;gait:number;walk:number;
}
export interface NprMotionFrame extends Pose{
 hipX:number;rise:number;step:[number,number];lift:[number,number];footPitch:[number,number];handSwing:[number,number];toolVisible:boolean;
}
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;

function authored(actor:WorldActor,chopping:boolean):Pose{
 const {mode,pose}=actor,moving=mode==='walk'||mode==='push'||mode==='pull';
 const value:Pose={handY:1.05,handZ:.23,squat:0,lean:0,twist:0,roll:0,hipZ:0,headPitch:0,headYaw:0,elbowOut:.10,elbowLift:0,axePitch:0,axeRoll:0,gait:moving?1:0,walk:mode==='walk'?1:0};
 if(mode==='push'){value.handY=1.04;value.handZ=.5;value.lean=.12;value.headPitch=-.055;}
 else if(mode==='pull'){value.handY=1.04;value.handZ=-.55;value.lean=-.10;value.headPitch=.035;}
 else if(mode==='secure'){value.handY=1.85;value.handZ=.5;value.lean=.055;value.twist=.07;value.headPitch=-.055;}
 else if(mode==='celebrate'){value.handY=2.25;value.handZ=.1;value.lean=-.055;value.headPitch=-.07;value.elbowOut=.15;}
 else if(mode==='work'){
  if(chopping){
   value.handY=pose==='ready'?2.3:pose==='chop-down'?.85:1.7;value.handZ=pose==='chop-down'?.85:.38;
   if(pose==='ready'){value.lean=-.085;value.twist=-.16;value.roll=-.024;value.headPitch=-.07;value.headYaw=.045;value.axePitch=-.30;value.axeRoll=-.08;value.elbowOut=.14;}
   else if(pose==='chop-down'){value.lean=.21;value.twist=.17;value.roll=.025;value.hipZ=-.045;value.headPitch=.08;value.headYaw=-.06;value.axePitch=1.1;value.axeRoll=.10;value.elbowOut=.065;value.elbowLift=-.02;}
   else{value.lean=-.025;value.twist=-.06;value.headPitch=-.025;value.axePitch=-.10;value.elbowOut=.115;}
  }else{
   value.handY=pose==='squat-down'?.45:pose==='stand-up'?1.55:pose==='press-up'?2.35:pose==='load-return'?1.65:1.05;value.handZ=pose==='squat-down'?.55:.48;
   if(pose==='squat-down'){value.squat=.42;value.lean=.23;value.hipZ=-.085;value.headPitch=-.10;value.elbowOut=.12;}
   else if(pose==='stand-up'){value.lean=-.025;value.twist=-.035;value.headPitch=.04;value.elbowLift=.025;}
   else if(pose==='press-up'){value.lean=-.055;value.twist=.04;value.headPitch=-.115;value.elbowOut=.08;}
   else if(pose==='load-return'){value.lean=.045;value.twist=.075;value.headPitch=.045;value.elbowOut=.14;}
  }
 }
 return value;
}
function duration(actor:WorldActor,chopping:boolean):number{
 if(actor.mode==='work'&&chopping)return actor.pose==='chop-down'?60:actor.pose==='ready'?110:140;
 return actor.mode==='work'?140:160;
}
function frame(pose:Pose,stride:number,fine:boolean,toolVisible:boolean):NprMotionFrame{
 const result:NprMotionFrame={...pose,hipX:0,rise:0,step:[0,0],lift:[0,0],footPitch:[0,0],handSwing:[0,0],toolVisible};
 for(let i=0;i<2;i++){
  const sign=i?1:-1;
  if(fine){
   const u=((stride/(Math.PI*2)+i*.5)%1+1)%1;
   if(u<.5){const t=u*2;result.step[i]=mix(.25,-.25,t)*pose.gait;result.footPitch[i]=mix(-.10,.14,t)*pose.gait;}
   else{const t=(u-.5)*2;result.step[i]=mix(-.25,.25,smooth(t))*pose.gait;result.lift[i]=Math.sin(Math.PI*t)*.095*pose.gait;result.footPitch[i]=Math.sin(Math.PI*t*2)*.17*pose.gait;}
   result.handSwing[i]=sign*Math.sin(stride)*.105*pose.walk;
  }else{
   result.step[i]=Math.sin(stride)*.25*sign*pose.gait;
   result.handSwing[i]=Math.sin(stride+sign)*.1*pose.walk;
  }
 }
 if(fine){result.hipX=-Math.sin(stride)*.026*pose.gait;result.rise=-(Math.sin(stride)**2)*.014*pose.gait;result.roll+=Math.sin(stride)*.012*pose.gait;}
 return result;
}

/** Local presentation clock. It consumes only observed deltas and never submits exercise signals or advances a task. */
export class NprMotion{
 private current=authored({position:{x:0,y:0,z:0},yaw:0,mode:'idle',pose:'ready',stride:0},false);
 private from={...this.current};private to={...this.current};private initialized=false;private key='';private elapsed=0;private duration=0;private stride=0;private toolVisible=false;
 private value=frame(this.current,0,false,false);
 get animating():boolean{return this.initialized&&this.elapsed<this.duration;}
 advance(actor:WorldActor,chopping:boolean,deltaMs?:number):NprMotionFrame{
  // A first frame and the compatibility/reset path are explicit snapshots. Invalid observed intervals never catch up.
  if(this.initialized&&deltaMs!==undefined&&(!Number.isFinite(deltaMs)||deltaMs<=0||deltaMs>100))return this.value;
  const key=`${actor.mode}/${actor.pose}/${chopping}`,target=authored(actor,chopping),fine=deltaMs!==undefined;
  if(!this.initialized||!fine){
   this.initialized=true;this.key=key;this.current={...target};this.from={...target};this.to={...target};this.elapsed=this.duration=0;
  }else{
   if(key!==this.key){this.key=key;this.from={...this.current};this.to=target;this.elapsed=0;this.duration=duration(actor,chopping);}
   this.elapsed=Math.min(this.duration,this.elapsed+(deltaMs??0));
   const t=this.duration?this.elapsed/this.duration:1,eased=smooth(t);
   for(const channel of Object.keys(this.to) as (keyof Pose)[]){
    const delayed=channel==='headPitch'||channel==='headYaw'?smooth((t-.15)/.85):eased;
    this.current[channel]=mix(this.from[channel],this.to[channel],delayed);
   }
   if(t>=1)this.current={...this.to};
   if(t<1&&actor.mode==='work'){
    // The blade descends decisively; recovery and lifting travel on a broader arc, without a spring overshooting contact.
    if(chopping&&actor.pose==='chop-down'){
     this.current.handY=mix(this.from.handY,this.to.handY,1-(1-t)**3);
     this.current.handZ=mix(this.from.handZ,this.to.handZ,1-(1-t)**2);
    }else{
     this.current.handZ+=Math.sin(Math.PI*t)*(chopping?.055:.035);
    }
   }
  }
  if(target.gait)this.stride=Number.isFinite(actor.stride)?actor.stride:0;
  this.toolVisible=chopping&&actor.mode==='work';this.value=frame(this.current,this.stride,fine,this.toolVisible);return this.value;
 }
}
