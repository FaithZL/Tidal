import * as T from 'three';

/** Batch immutable scenery only; geometry/material ownership stays with WorldResources. */
export function batchStaticMeshes(root:T.Group):void{
 root.updateMatrixWorld(true);
 const groups=new Map<string,T.Mesh[]>(),rootInverse=root.matrixWorld.clone().invert(),local=new T.Matrix4();
 root.traverseVisible(object=>{
  if(!(object instanceof T.Mesh)||object instanceof T.InstancedMesh||Array.isArray(object.material))return;
  // Keep long roads/fences independently cullable in close views.
  local.multiplyMatrices(rootInverse,object.matrixWorld);
  const cellX=Math.floor(local.elements[12]/16),cellZ=Math.floor(local.elements[14]/16);
  const key=`${object.geometry.uuid}/${object.material.uuid}/${object.castShadow}/${object.receiveShadow}/${cellX}/${cellZ}`;
  const group=groups.get(key)??[];group.push(object);groups.set(key,group);
 });
 for(const sources of groups.values()){
  if(sources.length<2)continue;
  const first=sources[0],batch=new T.InstancedMesh(first.geometry,first.material,sources.length);
  batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;
  const matrix=new T.Matrix4();
  sources.forEach((source,index)=>{
   batch.setMatrixAt(index,matrix.multiplyMatrices(rootInverse,source.matrixWorld));
   source.removeFromParent();
  });
  batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();root.add(batch);
 }
}
