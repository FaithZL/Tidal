import {expect,test} from 'vitest';
import * as T from 'three';
import {buildNprSampleEnvironment} from '../../src/game/world/nprEnvironment.js';
import {NprPalette} from '../../src/game/world/nprMaterials.js';
import {WorldResources} from '../../src/game/world/resources.js';
import {UserHouseMount} from '../../src/game/world/userHouseMount.js';

function deferred<T>():{promise:Promise<T>;resolve:(value:T)=>void;reject:(reason:Error)=>void}{
 let resolve!:(value:T)=>void,reject!:(reason:Error)=>void;
 const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};
}
function house(){
 const root=new T.Group();let disposed=0;
 root.add(new T.Mesh(new T.BoxGeometry(6,5.4,4),new T.MeshBasicMaterial()));
 return {kind:'house' as const,root,dispose(){disposed++;},get disposed(){return disposed;}};
}

test('a user cottage replaces only the procedural cottage, retaining the local meadow and bushes',()=>{
 const r=new WorldResources(),palette=new NprPalette(r);
 const legacy=buildNprSampleEnvironment(r,palette),replacement=buildNprSampleEnvironment(r,palette,{omitCottage:true});
 try{
  expect(legacy.getObjectByName('sample-cottage-wall')).toBeDefined();
  expect(replacement.getObjectByName('sample-cottage-wall')).toBeUndefined();
  expect(replacement.getObjectByName('sample-painted-meadow')).toBeDefined();
  expect(replacement.getObjectByName('sample-grass-bank-west')).toBeDefined();
 }finally{for(const root of[legacy,replacement])root.traverse(object=>{if(object instanceof T.InstancedMesh)object.dispose();});r.dispose();}
});

test('the model gate stays pending until the actual user house is attached at the cottage clearing',async()=>{
 const scene=new T.Scene(),loading=deferred<ReturnType<typeof house>>(),mount=new UserHouseMount(scene,loading.promise);
 let ready=false;void mount.ready.then(()=>{ready=true;});await Promise.resolve();
 expect(ready).toBe(false);expect(scene.children).toHaveLength(0);
 const model=house();loading.resolve(model);await mount.ready;
 expect(ready).toBe(true);expect(scene.children).toEqual([model.root]);
 expect(model.root.position.toArray()).toEqual([1,.025,-13]);expect(model.disposed).toBe(0);
 mount.dispose();expect(scene.children).toHaveLength(0);expect(model.disposed).toBe(1);mount.dispose();expect(model.disposed).toBe(1);
});

test('destroy or context loss during loading rejects the gate and disposes a late house without mounting it',async()=>{
 const scene=new T.Scene(),loading=deferred<ReturnType<typeof house>>(),mount=new UserHouseMount(scene,loading.promise);
 const cancelled=expect(mount.ready).rejects.toThrow(/cancelled/);mount.dispose();await cancelled;
 const model=house();loading.resolve(model);await Promise.resolve();await Promise.resolve();
 expect(scene.children).toHaveLength(0);expect(model.disposed).toBe(1);mount.dispose();expect(model.disposed).toBe(1);
});

test('a failed model rejects readiness and cannot silently mount the procedural fallback',async()=>{
 const scene=new T.Scene(),loading=deferred<ReturnType<typeof house>>(),mount=new UserHouseMount(scene,loading.promise);
 const failed=expect(mount.ready).rejects.toThrow('missing texture');loading.reject(new Error('missing texture'));await failed;
 expect(scene.children).toHaveLength(0);mount.dispose();
});
