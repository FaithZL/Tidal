import * as T from 'three';
import type {WorldActor} from './types.js';
import type {UserModel} from './userModel.js';
export class UserStaticCharacter{
 readonly root=new T.Group();readonly motionSupport='static';readonly ready:Promise<void>;
 private model?:UserModel;private closed=false;private revision=0;private previous='';
 private readonly grip=new T.Vector3(0,.95,.45);private cancel!:(reason:Error)=>void;
 constructor(loading:Promise<UserModel>){
  this.root.name='user-static-character';
  this.ready=new Promise<void>((resolve,reject)=>{this.cancel=reject;
   void loading.then(model=>{
    if(this.closed){model.dispose();return;}this.model=model;this.root.add(model.root);this.revision++;resolve();
   },reject);
  });
 }
 get visualRevision():number{return this.revision;}
 update(actor:WorldActor):void{
  if(this.closed)return;const {position:p,yaw}=actor,key=`${p.x}/${p.y}/${p.z}/${yaw}`;
  if(key===this.previous)return;this.previous=key;this.root.position.set(p.x,p.y,p.z);this.root.rotation.y=yaw;this.root.updateMatrixWorld(true);this.revision++;
 }
 /** Approximate fixed grip of the supplied pose, not animated/finger contact. */
 handPosition():T.Vector3{return this.root.localToWorld(this.grip.clone());}
 dispose():void{if(this.closed)return;this.closed=true;this.cancel(new Error('User character loading cancelled'));this.model?.dispose();this.model=undefined;this.root.clear();}
}
