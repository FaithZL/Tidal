import {afterEach,describe,expect,it} from 'vitest';
import * as T from 'three';
import {NprCharacter3D} from '../../src/game/world/nprModels.js';
import {NprPalette} from '../../src/game/world/nprMaterials.js';
import {WorldResources} from '../../src/game/world/resources.js';
import type {WorldActor} from '../../src/game/world/types.js';

const resources:WorldResources[]=[];
const idle:WorldActor={position:{x:0,y:0,z:0},yaw:0,mode:'idle',pose:'ready',stride:0};
const ready:WorldActor={...idle,mode:'work',pose:'ready'};
const down:WorldActor={...ready,pose:'chop-down'};
function farmer(r?:WorldResources):NprCharacter3D{
 const owned=r??new WorldResources();if(!r)resources.push(owned);return new NprCharacter3D(owned,new NprPalette(owned));
}
function handCenter(actor:NprCharacter3D):T.Vector3{
 return ['left','right'].map(side=>actor.root.getObjectByName(`npr-farmer-hand-${side}`)!.getWorldPosition(new T.Vector3())).reduce((sum,v)=>sum.add(v),new T.Vector3()).multiplyScalar(.5);
}
afterEach(()=>{resources.forEach(r=>r.dispose());resources.length=0;});

describe('fine farmer presentation motion',()=>{
 it('passes through an intermediate down-swing and reaches the original contact anchor by 60 ms',()=>{
  const actor=farmer();actor.update(ready,true);
  actor.update(down,true,20);
  expect(actor.handPosition().y).toBeGreaterThan(.85);expect(actor.handPosition().y).toBeLessThan(2.3);
  expect(actor.animating).toBe(true);
  actor.update(down,true,40);
  expect(actor.handPosition().toArray()).toEqual([0,.85,.85]);expect(actor.animating).toBe(false);
  const axe=actor.root.getObjectByName('npr-farmer-hand-right')!.children[0];
  expect(axe.rotation.x).toBeCloseTo(1.1,7);
 });

 it('freezes a partially observed motion on delta zero, even when a different action pose arrives',()=>{
  const actor=farmer();actor.update(ready,true);actor.update(down,true,15);
  const before=actor.handPosition().toArray(),revision=actor.visualRevision;
  const leg=actor.root.getObjectByName('npr-farmer-arm-left') as T.Mesh,position=leg.geometry.getAttribute('position') as T.BufferAttribute,version=position.version;
  for(let i=0;i<8;i++)actor.update({...down,pose:'chop-return'},true,0);
  expect(actor.handPosition().toArray()).toEqual(before);expect(actor.visualRevision).toBe(revision);expect(position.version).toBe(version);
 });

 it('does not catch up long, negative or invalid sampling intervals',()=>{
  const actor=farmer();actor.update(ready,true);const before=actor.handPosition().toArray();
  for(const delta of[101,1000,-10,Number.NaN,Number.POSITIVE_INFINITY]){
   actor.update(down,true,delta);expect(actor.handPosition().toArray()).toEqual(before);
  }
  actor.update(down,true,20);expect(actor.handPosition().y).toBeGreaterThan(.85);
 });

 it('is stable across frame partitions and keeps the root and held-log anchor tied to the rendered hands',()=>{
  const a=farmer(),b=farmer();a.update(ready,true);b.update(ready,true);
  const moved={...down,position:{x:3,y:.2,z:-4},yaw:Math.PI/2};
  a.update(moved,true,30);for(let i=0;i<3;i++)b.update(moved,true,10);
  expect(a.handPosition().distanceTo(b.handPosition())).toBeLessThan(1e-7);
  expect(a.root.position.toArray()).toEqual([3,.2,-4]);expect(a.root.rotation.y).toBe(Math.PI/2);
  expect(a.handPosition().distanceTo(handCenter(a))).toBeLessThan(1e-7);
  for(let i=0;i<6;i++){a.update(moved,true,10);expect(a.hand.position.y).toBeGreaterThanOrEqual(.85);expect(a.hand.position.y).toBeLessThanOrEqual(2.3);}
 });

 it('sequences squat, stand, press and release with a body hinge and an independently reacting head',()=>{
  const actor=farmer();actor.update({...ready,pose:'ready'},false);
  actor.update({...ready,pose:'squat-down'},false,70);
  const pivot=actor.root.getObjectByName('npr-farmer-body-pivot'),head=actor.root.getObjectByName('npr-farmer-head-pivot');
  expect(pivot).toBeDefined();expect(head).toBeDefined();expect(pivot!.rotation.x).toBeGreaterThan(0);
  expect(head!.rotation.x).toBeLessThan(0);expect(Math.abs(head!.rotation.x)).toBeLessThan(pivot!.rotation.x);
  expect(actor.handPosition().y).toBeGreaterThan(.45);expect(actor.handPosition().y).toBeLessThan(1.05);
  actor.update({...ready,pose:'squat-down'},false,70);expect(actor.handPosition().toArray()).toEqual([0,.45,.55]);
  for(const [pose,y,z] of[['stand-up',1.55,.48],['press-up',2.35,.48],['load-return',1.65,.48]] as const){
   actor.update({...ready,pose},false,70);expect(actor.animating).toBe(true);
   actor.update({...ready,pose},false,70);expect(actor.handPosition().toArray()).toEqual([0,y,z]);
   expect(actor.handPosition().distanceTo(handCenter(actor))).toBeLessThan(1e-7);
  }
 });

 it('lifts only the swing foot while the stance boot stays above the ground plane',()=>{
  const actor=farmer(),walking={...idle,mode:'walk',stride:Math.PI/2} as WorldActor;actor.update(walking,false,16);
  const boots=['left','right'].map(side=>actor.root.getObjectByName(`npr-farmer-boot-${side}`)!);
  const feet=boots.map(boot=>new T.Box3().setFromObject(boot).min.y);
  expect(Math.min(...feet)).toBeCloseTo(.03,5);expect(Math.max(...feet)).toBeGreaterThan(.09);
  expect(feet.every(y=>y>=.02999)).toBe(true);
 });

 it('settles without perpetual idle uploads and supports an explicit snap on reset',()=>{
  const actor=farmer();actor.update(ready,true);actor.update(down,true,20);
  actor.update(idle,false);expect(actor.handPosition().toArray()).toEqual([0,1.05,.23]);expect(actor.animating).toBe(false);
  const revision=actor.visualRevision;
  for(let i=0;i<20;i++)actor.update(idle,false,16);
  expect(actor.visualRevision).toBe(revision);
 });

 it('keeps transition clocks and deforming vertices independent between farmers',()=>{
  const r=new WorldResources();resources.push(r);const a=farmer(r),b=farmer(r);a.update(ready,true);b.update(ready,true);
  a.update(down,true,20);const before=a.handPosition().toArray();
  b.update({...ready,pose:'chop-return'},true,70);
  expect(a.handPosition().toArray()).toEqual(before);expect(b.handPosition().y).not.toBeCloseTo(a.handPosition().y,4);
 });
});
