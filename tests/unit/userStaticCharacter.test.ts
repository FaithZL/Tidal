import {expect,test,vi} from 'vitest';
import * as T from 'three';
import {UserStaticCharacter} from '../../src/game/world/userStaticCharacter.js';
import type {UserModel} from '../../src/game/world/userModel.js';
import type {WorldActor} from '../../src/game/world/types.js';
function deferred(){let resolve!:(model:UserModel)=>void;const promise=new Promise<UserModel>(yes=>{resolve=yes;});return {promise,resolve};}
function model():UserModel{const root=new T.Group();root.add(new T.Mesh(new T.BoxGeometry(.6,2,.6),new T.MeshBasicMaterial()));return {root,kind:'character',motionSupport:'static',dispose:vi.fn()};}
const actor:WorldActor={position:{x:2,y:0,z:4},yaw:Math.PI/2,mode:'work',pose:'chop-down',stride:0};
test('the imported fixed-pose character follows only the world placement and uses its own grip marker',async()=>{
 const asset=model(),character=new UserStaticCharacter(Promise.resolve(asset));await character.ready;
 character.update(actor);const marker=character.handPosition();expect(character.root.position.toArray()).toEqual([2,0,4]);
 expect(marker.x).toBeGreaterThan(2);expect(marker.y).toBeGreaterThan(.5);expect(marker.z).toBeCloseTo(4);
 const before=asset.root.matrix.clone(),revision=character.visualRevision;
 character.update({...actor,pose:'chop-return'});expect(character.visualRevision).toBe(revision);expect(asset.root.matrix.equals(before)).toBe(true);
 expect(character.motionSupport).toBe('static');character.dispose();expect(asset.dispose).toHaveBeenCalledTimes(1);
});
test('a late character after cancellation is released rather than mounted or counted',async()=>{
 const loading=deferred(),character=new UserStaticCharacter(loading.promise);const rejected=expect(character.ready).rejects.toThrow(/cancelled/);
 character.dispose();await rejected;const asset=model();loading.resolve(asset);await Promise.resolve();
 expect(asset.dispose).toHaveBeenCalledTimes(1);expect(character.root.children).toHaveLength(0);character.dispose();expect(asset.dispose).toHaveBeenCalledTimes(1);
});
