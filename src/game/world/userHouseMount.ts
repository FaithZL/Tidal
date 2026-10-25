import type * as T from 'three';
import type {UserModel} from './userModel.js';

/** Own asynchronous imported scenery, defaulting to the cottage clearing. */
export class UserHouseMount{
 readonly ready:Promise<void>;
 private model:UserModel|null=null;
 private closed=false;
 private cancel!:(reason:Error)=>void;
 constructor(scene:T.Object3D,loading:Promise<UserModel>,placement:readonly[number,number,number]=[1,.025,-13]){
  this.ready=new Promise<void>((resolve,reject)=>{
   this.cancel=reject;
   void loading.then(model=>{
    if(this.closed){model.dispose();return;}
    this.model=model;model.root.position.set(...placement);scene.add(model.root);resolve();
   },reject);
  });
 }
 dispose():void{
  if(this.closed)return;this.closed=true;
  if(this.model){this.model.root.removeFromParent();this.model.dispose();this.model=null;}
  this.cancel(new Error('User house loading cancelled'));
 }
}
