import * as T from 'three';
import type {WorldActor} from './types.js';
import type {UserModel} from './userModel.js';
import {createUserCharacterRig,type UserCharacterRig} from './userCharacterRig.js';
import {UserLoadMotion} from './userLoadMotion.js';
import {UserFarmChopMotion} from './userFarmChopMotion.js';
import {UserWalkMotion} from './userWalkMotion.js';

/** The default retains the reviewed load-only sample; the farm opts into all motions. */
export class UserLoadCharacter{
 readonly root=new T.Group();readonly ready:Promise<void>;readonly motionSupport:'derived-load-only'|'derived-farm';
 private rig?:UserCharacterRig;private source?:T.Mesh;private motion?:UserLoadMotion;
 private chop?:UserFarmChopMotion;private walk?:UserWalkMotion;private mode='static';
 private closed=false;private revision=0;private previousPlacement='';private load=false;private snapshot=true;
 private readonly fixedGrip=new T.Vector3(0,.95,.45);private cancel!:(reason:Error)=>void;
 private pending?:{actor:WorldActor;chopping:boolean};
 constructor(loading:Promise<UserModel>,private readonly scope:'load'|'farm'='load'){
  this.motionSupport=scope==='farm'?'derived-farm':'derived-load-only';
  this.root.name='user-load-character';
  this.ready=new Promise<void>((resolve,reject)=>{this.cancel=reject;
   void loading.then(model=>{
    if(this.closed){model.dispose();return;}
    let rig:UserCharacterRig|undefined;
    try{
     // Save the unchanged mesh before the rig adds its derived skin and axe.
     const meshes:T.Mesh[]=[];model.root.traverse(object=>{if(object instanceof T.Mesh)meshes.push(object);});
     if(meshes.length!==1)throw new Error('用户人物装车绑定需要当前单网格原件');
     this.source=meshes[0];rig=createUserCharacterRig(model);this.rig=rig;this.motion=new UserLoadMotion(rig);
     if(this.scope==='farm'){this.chop=new UserFarmChopMotion(rig);this.walk=new UserWalkMotion(rig);}
     this.root.add(rig.root);this.showLoad(false);this.revision++;
     if(this.pending){const pending=this.pending;this.pending=undefined;this.update(pending.actor,pending.chopping);}
     resolve();
    }catch(error){
     if(rig)rig.dispose();else model.dispose();this.rig=undefined;this.source=undefined;this.motion=undefined;this.root.clear();
     reject(new Error(`用户人物模型加载失败：装车骨架绑定失败，${error instanceof Error?error.message:String(error)}`,{cause:error}));
    }
   },reject);
  });
 }
 get visualRevision():number{return this.revision;}
 update(actor:WorldActor,chopping:boolean,deltaMs?:number):void{
  if(this.closed)return;
  if(this.scope==='farm'&&!this.snapshot&&deltaMs!==undefined&&(!Number.isFinite(deltaMs)||deltaMs<=0||deltaMs>100))return;
  const {position:p,yaw}=actor,key=`${p.x}/${p.y}/${p.z}/${yaw}`;
  if(key!==this.previousPlacement){this.previousPlacement=key;this.root.position.set(p.x,p.y,p.z);this.root.rotation.y=yaw;this.root.updateMatrixWorld(true);this.revision++;}
  if(!this.rig||!this.motion){this.pending={actor:{...actor,position:{...p}},chopping};return;}
  if(this.scope==='farm'){
   const mode=actor.mode==='work'?(chopping?'chop':'load'):'walk',changed=mode!==this.mode;
   if(changed){this.chop?.leave();this.motion.reset();this.walk?.reset();this.mode=mode;this.revision++;}
   this.source!.visible=false;this.rig.mesh.visible=true;this.rig.axe.root.visible=mode==='chop';
   const motion=mode==='chop'?this.chop!:mode==='load'?this.motion:this.walk!,revision=motion.visualRevision;
   motion.update(actor,this.snapshot||changed?undefined:deltaMs);this.snapshot=false;this.load=mode==='load';
   if(motion.visualRevision!==revision)this.revision++;
   return;
  }
  const load=actor.mode==='work'&&!chopping,changed=load!==this.load;
  if(changed){this.showLoad(load);this.revision++;}
  if(!load){
   if(this.load)this.motion.reset();this.load=false;this.snapshot=true;return;
  }
  const revision=this.motion.visualRevision;
  this.motion.update(actor,this.snapshot||!this.load?undefined:deltaMs);this.load=true;this.snapshot=false;
  if(this.motion.visualRevision!==revision)this.revision++;
 }
 private showLoad(load:boolean):void{
  if(!this.rig||!this.source)return;this.source.visible=!load;this.rig.mesh.visible=load;this.rig.axe.root.visible=false;
 }
 handPosition():T.Vector3{
  if(this.scope==='farm'&&this.rig)return this.mode==='chop'?this.chop!.handPosition():this.mode==='load'?this.motion!.handPosition():this.walk!.handPosition();
  return this.load&&this.motion?this.motion.handPosition():this.root.localToWorld(this.fixedGrip.clone());
 }
 get landmarks():{leftFoot:T.Vector3;rightFoot:T.Vector3;blade?:T.Vector3}|undefined{
  if(!this.rig)return;return {leftFoot:this.rig.bones.leftFoot.getWorldPosition(new T.Vector3()),rightFoot:this.rig.bones.rightFoot.getWorldPosition(new T.Vector3()),blade:this.mode==='chop'?this.chop?.bladePosition():undefined};
 }
 resetPresentation():void{if(this.closed)return;this.snapshot=true;this.chop?.reset();this.walk?.reset();this.motion?.reset();this.revision++;}
 dispose():void{
  if(this.closed)return;this.closed=true;this.cancel(new Error('User character loading cancelled'));
  this.rig?.dispose();this.rig=undefined;this.motion=undefined;this.chop=undefined;this.walk=undefined;this.source=undefined;this.pending=undefined;this.root.clear();
 }
}
