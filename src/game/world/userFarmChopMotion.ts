import * as T from 'three';
import type {WorldActor} from './types.js';
import type {UserCharacterRig} from './userCharacterRig.js';
import {UserCharacterMotion} from './userCharacterMotion.js';

/** Phase-bound reuse of the reviewed clip. A held input never starts another rep. */
export class UserFarmChopMotion{
 private readonly clip:UserCharacterMotion;private readonly placement:T.Vector3;private readonly offset:T.Vector3;
 private initialized=false;private pose='';private time=3.5;private from=3.5;private elapsed=0;private revision=0;private blending=false;
 constructor(private readonly rig:UserCharacterRig){
  this.placement=rig.root.position.clone();this.clip=new UserCharacterMotion(rig);
  this.clip.sample(4.15);
  // Existing actor/tree placement puts the near trunk surface at this local
  // point. Measure the real blade, then move the whole planted stance with it.
  this.offset=new T.Vector3(-.37,0,1.05).sub(rig.root.worldToLocal(this.clip.bladePosition()));this.offset.y=0;
  this.leave();
 }
 get visualRevision():number{return this.revision;}
 update(actor:WorldActor,deltaMs?:number):void{
  if(this.initialized&&deltaMs!==undefined&&(!Number.isFinite(deltaMs)||deltaMs<=0||deltaMs>100))return;
  const snapshot=!this.initialized||deltaMs===undefined,target=actor.pose==='chop-down'?4.15:actor.pose==='chop-return'?5.6:3.5;
  let next=target;
  if(snapshot){this.from=target;this.elapsed=260;this.blending=false;}
  let blend=1;
  if(!snapshot){
   if(actor.pose!==this.pose){
    if(this.blending||(target===5.6&&this.time<4.15)){this.clip.beginTransition();this.blending=true;}
    this.from=this.time;this.elapsed=0;
   }
   const duration=actor.pose==='chop-down'?110:actor.pose==='chop-return'?260:230;
   this.elapsed=Math.min(duration,this.elapsed+(deltaMs??0));const u=T.MathUtils.smoothstep(this.elapsed,0,duration);blend=u;
   if(!this.blending&&target===3.5&&this.from>4.15){
    // Complete the low recovery before raising again; never replay a downstroke
    // backwards through the tree to reach the next preparation.
    const distance=5.6-this.from+1.1,travel=distance*u;
    next=travel<=5.6-this.from?this.from+travel:2.4+travel-(5.6-this.from);
   }else next=T.MathUtils.lerp(this.from,target,u);
  }
  if(this.initialized&&next===this.time&&actor.pose===this.pose&&!snapshot)return;
  this.time=next;this.pose=actor.pose;this.initialized=true;
  this.rig.root.position.copy(this.placement).add(this.offset);
  if(this.blending){this.clip.sampleTransition(target,blend);if(blend===1)this.blending=false;}else this.clip.sample(this.time);
  this.revision++;
 }
 handPosition():T.Vector3{return this.clip.handPosition('left').add(this.clip.handPosition('right')).multiplyScalar(.5);}
 bladePosition():T.Vector3{return this.clip.bladePosition();}
 leave():void{this.clip.restoreHandGrip();this.rig.root.position.copy(this.placement);this.initialized=false;this.pose='';this.elapsed=0;this.blending=false;}
 reset():void{this.leave();this.time=this.from=3.5;this.revision++;}
}
