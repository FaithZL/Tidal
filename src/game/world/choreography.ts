import type {DemoConfig} from '../../config/demoConfig.js';
import type {GameEffect,SessionSnapshot} from '../../domain/types.js';
import type {Vec3,WorldFrame} from './types.js';
import {ActionAnimator} from '../ActionAnimator.js';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const mix=(a:number,b:number,t:number)=>a+(b-a)*clamp(t);
export const treeLocations:readonly Vec3[]=[{x:-6,y:0,z:1},{x:-9,y:0,z:-3},{x:-4,y:0,z:-6}];
export function worldTreePosition(index:number):Vec3{const p=treeLocations[index%treeLocations.length];return{x:p.x-Math.floor(index/treeLocations.length)*3,y:0,z:p.z-Math.floor(index/treeLocations.length)*3};}
interface Flight{from:Vec3;elapsed:number;committed:boolean}
/** Visual ownership only. The snapshot is the sole source of permanent timber. */
export class WorldChoreography{
 private readonly animator:ActionAnimator;
 private snapshot:Readonly<SessionSnapshot>|null=null;
 private hand:Vec3={x:-1.1,y:2.25,z:0};
 private flights=new Map<number,Flight>();
 private committed=new Set<number>();
 private loadRep='';private heldLog:number|null=null;
 private disposed=false;
 constructor(private readonly config:Readonly<DemoConfig>){this.animator=new ActionAnimator(config);}
 sync(s:Readonly<SessionSnapshot>):void{
  if(this.disposed)return;
  if(this.snapshot?.sessionId!==s.sessionId){this.flights.clear();this.committed.clear();this.heldLog=null;this.loadRep='';this.hand={x:-1.1,y:2.25,z:0};}
  else if(this.snapshot.sourceEpoch!==s.sourceEpoch||this.snapshot.taskRunId!==s.taskRunId){
   this.heldLog=null;this.loadRep='';
   for(const[id,f]of this.flights)if(!f.committed)this.flights.delete(id);
  }
  this.snapshot=s;this.animator.sync(s);
  if(s.phase==='home'||s.phase==='results')this.flights.clear();
 }
 apply(e:GameEffect):void{
  const s=this.snapshot;
  if(this.disposed||!s||e.sessionId!==s.sessionId)return;
  if(e.kind==='session-reset'){this.flights.clear();this.animator.apply(e);return;}
  if(s.pauseReasons.length||s.phase!=='active'||e.taskRunId!==s.taskRunId||e.sourceEpoch!==s.sourceEpoch||('task'in e&&e.task!==s.task))return;
  this.animator.apply(e);
  if(e.kind==='action-phase'&&e.task==='load'){
   const key=`${e.taskRunId}/${e.sourceEpoch}/${e.repId}`;
   if(key!==this.loadRep){
    // A recognizer can reject a completed-looking cycle without changing epoch.
    for(const[id,f]of this.flights)if(!f.committed)this.flights.delete(id);
    this.loadRep=key;this.heldLog=s.groundLogs>0?s.deliveredLogs+s.cartLogs:null;
   }
  }
  if(e.kind==='action-phase'&&e.task==='load'&&e.phase==='load-return'&&s.groundLogs>0){
   const id=s.deliveredLogs+s.cartLogs;
   if(!this.flights.has(id))this.flights.set(id,{from:{...this.hand},elapsed:0,committed:false});
  }
  if(e.kind==='log-loaded'){
   const id=s.deliveredLogs+e.cartLogs-1;
   if(this.committed.has(id))return;this.committed.add(id);
   if(this.heldLog===id)this.heldLog=null;
   const f=this.flights.get(id);
   if(f)f.committed=true;
   else this.flights.set(id,{from:{...this.hand},elapsed:0,committed:true});
  }
 }
 advance(delta:number):void{
  if(this.disposed||this.snapshot?.pauseReasons.length||!Number.isFinite(delta)||delta<0)return;
  this.animator.advance(delta);
  for(const[id,f]of this.flights){f.elapsed+=delta;if(f.committed&&f.elapsed>=600)this.flights.delete(id);}
 }
 setHandAnchor(p:Vec3):void{if([p.x,p.y,p.z].every(Number.isFinite))this.hand={...p};}
 dispose():void{this.disposed=true;this.snapshot=null;this.flights.clear();this.committed.clear();this.animator.dispose();}
 get frame():WorldFrame{
  const s=this.snapshot,old=this.animator.frame,pose=old.action;
  const f:WorldFrame={player:{position:{x:2,y:0,z:4},yaw:-Math.PI/2,mode:'idle',pose,stride:0},npc:{position:{x:1,y:0,z:-2},yaw:0,mode:'idle',pose:'ready',stride:0},cart:{x:3,y:0,z:0},logs:[],trees:Array.from({length:this.config.treeCount},(_,i)=>({position:worldTreePosition(i),felled:false,fallProgress:0})),ropeProgress:0,carryProgress:0,action:pose,effects:old.effects.map(e=>({kind:e.kind,index:e.index,progress:e.progress}))};
  if(!s)return f;
  const rest=clamp(1-s.remainingMs/this.config.restMs);
  f.trees=f.trees.map((t,i)=>({...t,felled:i<s.choppedTrees,fallProgress:i<s.choppedTrees?old.effects.find(e=>e.kind==='tree'&&e.index===i)?.progress??1:0}));
  if(s.task==='chop'){
   const tree=worldTreePosition(Math.min(s.choppedTrees,this.config.treeCount-1));
   f.player={position:{x:tree.x+1.25,y:0,z:tree.z+.35},yaw:-Math.PI/2,mode:'work',pose,stride:0};
  }
  if(s.task==='load'){
   f.cart={x:0,y:0,z:0};f.player={position:{x:-1.6,y:0,z:.1},yaw:Math.PI/2,mode:'work',pose,stride:0};
   if(s.phase==='rest'){
    const push=clamp((rest-.25)/.4);f.cart.x=mix(3,0,push);
    if(rest<.25)f.player={position:{x:mix(-2,4.55,rest/.25),y:0,z:mix(1.5,0,rest/.25)},yaw:Math.PI/2,mode:'walk',pose:'ready',stride:rest*35};
    else if(rest<.65)f.player={position:{x:f.cart.x+1.55,y:0,z:0},yaw:-Math.PI/2,mode:'push',pose:'ready',stride:push*20};
    else f.player={position:{x:mix(1.55,-1.6,(rest-.65)/.35),y:0,z:Math.sin(clamp((rest-.65)/.35)*Math.PI)*1.7+.1},yaw:-Math.PI/2,mode:'walk',pose:'ready',stride:rest*30};
    f.npc={position:{x:-3+Math.sin(rest*Math.PI*4)*1.5,y:0,z:-1.5+Math.cos(rest*Math.PI*4)},yaw:rest*Math.PI*4,mode:'walk',pose:'ready',stride:rest*40};
   }
  }
  if(s.task==='carry'||s.phase==='results'){
   const p=s.phase==='results'?1:clamp(s.carryActiveMs/this.config.carryTargetMs);f.carryProgress=p;f.cart={x:40*p,y:0,z:0};
   f.player={position:{x:f.cart.x+1.6,y:0,z:0},yaw:Math.PI/2,mode:s.phase==='rest'?'idle':s.phase==='results'?'celebrate':'pull',pose:'ready',stride:p*240};
   f.ropeProgress=s.phase==='rest'?rest:1;
   f.npc={position:s.phase==='rest'?{x:Math.cos(rest*Math.PI*2)*1.1,y:0,z:Math.sin(rest*Math.PI*2)*1.1}:{x:f.cart.x-1.5,y:0,z:-1.1},yaw:s.phase==='rest'?-rest*Math.PI*2-Math.PI/2:Math.PI/2,mode:s.phase==='rest'?'secure':s.phase==='results'?'celebrate':'walk',pose:'ready',stride:p*220};
  }
  const total=this.config.initialLogs+s.choppedTrees*this.config.logsPerTree;
  for(let id=0;id<total;id++){
   let location:'ground'|'hand'|'flight'|'cart'|'delivered'='ground';
   const col=id%5,row=Math.floor(id/5);let position:Vec3={x:-2.2+(id%3)*.32,y:.2+Math.floor((id%5)/3)*.3,z:-.8-row*.52};
   if(id<s.deliveredLogs){location='delivered';position={x:43+(id%5)*.4,y:.25+Math.floor(id/5)*.35,z:-2.9};}
   else if(id<s.deliveredLogs+s.cartLogs){location='cart';position={x:f.cart.x+(col-2)*.3,y:.9+row*.3,z:0};}
   else{
    const ti=Math.min(this.config.treeCount-1,Math.floor((id-this.config.initialLogs)/this.config.logsPerTree));const t=worldTreePosition(Math.max(0,ti));
    const scatter={x:t.x+.2+(id%5)*.45,y:.22,z:t.z+.5+(id%2)*.45};
    const gathering=s.task==='load'&&s.phase==='rest'?clamp((rest-.12-(id%5)*.04)/.75):s.task==='chop'||s.phase==='home'||s.phase==='setup'?0:1;
    position={x:mix(scatter.x,position.x,gathering),y:position.y,z:mix(scatter.z,position.z,gathering)};
    const tree=f.trees[ti];if(tree?.fallProgress<1){const p=tree.fallProgress;position={x:t.x+Math.sin(p*Math.PI/2)*((id%5)*.45+.3),y:mix(.6+(id%5)*.5,.22,p),z:t.z+.4};}
    if(s.task==='load'&&s.phase==='active'&&id===this.heldLog&&['squat-down','stand-up','press-up','load-return'].includes(pose)){location='hand';position={...this.hand};}
   }
   const flight=this.flights.get(id);
   if(flight){
    location='flight';const p=clamp(flight.elapsed/600),to={x:f.cart.x+(col-2)*.3,y:.9+row*.3,z:0};
    position={x:mix(flight.from.x,to.x,p),y:mix(flight.from.y,to.y,p)+Math.sin(p*Math.PI)*1.15,z:mix(flight.from.z,to.z,p)};
   }
   f.logs.push({id,location,position,rotation:flight?clamp(flight.elapsed/600)*Math.PI*2:0});
  }
  return f;
 }
}
