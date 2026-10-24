import type {UserCharacterRig} from './userCharacterRig.js';
import * as T from 'three';
export interface UserChopContact{readonly center:T.Vector3;readonly surfaceY:number;readonly radius:number}
/** Measure an already sampled, current-world-matrix tool without changing its
 * pose, source geometry or resources. The finite cut disc is the viewer's work
 * target; the unchanged source shaft may extend far outside that disc. */
export function deriveUserChopContact(rig:Pick<UserCharacterRig,'axe'>):UserChopContact{
 const {axe}=rig,radius=.202,center=axe.blade.clone().applyMatrix4(axe.root.matrixWorld),position=axe.mesh.geometry.getAttribute('position');
 if(!position||!position.count||!center.toArray().every(Number.isFinite)||!axe.mesh.matrixWorld.elements.every(Number.isFinite))throw new Error('工作木桩接触几何无效');
 const point=new T.Vector3();let minimumY=Infinity;
 for(let i=0;i<position.count;i++){
  point.fromBufferAttribute(position,i).applyMatrix4(axe.mesh.matrixWorld);
  if(!point.toArray().every(Number.isFinite))throw new Error('工作木桩接触几何包含无效顶点');
  if(Math.hypot(point.x-center.x,point.z-center.z)<=radius)minimumY=Math.min(minimumY,point.y);
 }
 if(!Number.isFinite(minimumY))throw new Error('工作木桩接触圆内没有实际工具几何');
 const surfaceY=minimumY+.001;center.y=surfaceY;return {center,surfaceY,radius};
}
