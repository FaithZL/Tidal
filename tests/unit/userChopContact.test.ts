import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {deriveUserChopContact} from '../../src/game/world/userChopContact.js';

function fixture(){
 const root=new T.Group(),geometry=new T.BufferGeometry();
 // Low cutting vertex and high shaft are inside the real contact disc. A much
 // lower vertex elsewhere must not lower this finite work surface.
 geometry.setAttribute('position',new T.Float32BufferAttribute([.3,.498,-.2,.35,.51,-.1,.3,1.5,-.2,2,-3,2],3));
 const mesh=new T.Mesh(geometry),axe={root,mesh,grips:{lower:new T.Vector3(),upper:new T.Vector3()},blade:new T.Vector3(.3,.5,-.2),rest:{position:new T.Vector3(),quaternion:new T.Quaternion()}};
 root.add(mesh);root.updateMatrixWorld(true);
 return{rig:{axe},geometry,mesh,root};
}

describe('the local chopping work surface',()=>{
 it('aligns its visible top to the real lowest tool vertex inside the contact disc, with only a 1mm bite',()=>{
  const {rig,geometry,mesh}=fixture();
  try{
   const contact=deriveUserChopContact(rig);
   expect(contact.radius).toBe(.202);expect(contact.surfaceY).toBeCloseTo(.499,6);
   expect(contact.center.x).toBeCloseTo(.3,6);expect(contact.center.y).toBe(contact.surfaceY);expect(contact.center.z).toBeCloseTo(-.2,6);
   // A marker-only height (+15mm) would leave the visible tool buried already
   // at impact; the actual cutting point is exactly 1mm below this top.
   expect(contact.surfaceY-.498).toBeCloseTo(.001,6);
  }finally{geometry.dispose();(mesh.material as T.Material).dispose();}
 });

 it('measures posed world geometry through ancestor placement, rotation and uniform scaling without mutating it',()=>{
  const {rig,geometry,mesh,root}=fixture(),parent=new T.Group();parent.position.set(2,.4,-1);parent.rotation.y=Math.PI/2;parent.scale.setScalar(.5);parent.add(root);parent.updateMatrixWorld(true);
  const before=Array.from(geometry.getAttribute('position').array),matrix=root.matrixWorld.toArray(),blade=rig.axe.blade.toArray();
  try{
   const contact=deriveUserChopContact(rig);
   expect(contact.center.x).toBeCloseTo(1.9,6);expect(contact.center.z).toBeCloseTo(-1.15,6);expect(contact.surfaceY).toBeCloseTo(.650,6);
   expect(Array.from(geometry.getAttribute('position').array)).toEqual(before);expect(root.matrixWorld.toArray()).toEqual(matrix);expect(rig.axe.blade.toArray()).toEqual(blade);
  }finally{geometry.dispose();(mesh.material as T.Material).dispose();}
 });

 it('rejects empty or non-finite contact geometry rather than inventing a floating wood target',()=>{
  const {rig,geometry,mesh}=fixture();
  try{
   rig.axe.blade.set(50,.5,50);expect(()=>deriveUserChopContact(rig)).toThrow(/contact|接触|geometry|几何/i);
   rig.axe.blade.set(.3,NaN,-.2);expect(()=>deriveUserChopContact(rig)).toThrow(/contact|接触|geometry|几何/i);
   rig.axe.blade.set(.3,.5,-.2);geometry.setAttribute('position',new T.Float32BufferAttribute([],3));expect(()=>deriveUserChopContact(rig)).toThrow(/contact|接触|geometry|几何/i);
  }finally{geometry.dispose();(mesh.material as T.Material).dispose();}
 });
});
