import {createServer} from 'vite';
import {writeFile} from 'node:fs/promises';
import * as T from 'three';

const server=await createServer({configFile:false,server:{middlewareMode:true,watch:null}});
try{
 const {WorldResources}=await server.ssrLoadModule('/src/game/world/resources.ts');
 const {Character3D,makeCart,makeLog,makePine}=await server.ssrLoadModule('/src/game/world/models.ts');
 const r=new WorldResources(),player=new Character3D(r),npc=new Character3D(r,true);
 for(const actor of[player,npc])actor.update({position:{x:0,y:0,z:0},yaw:0,mode:'idle',pose:'idle',stride:0},false);
 const models={player:player.root,npc:npc.root,cart:makeCart(r).root,log:makeLog(r),pine:makePine(r).root};
 const budgets=Object.fromEntries(Object.entries(models).map(([name,root])=>{
  let meshes=0,triangles=0,mapped=0;root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3;if(o.material.map)mapped++;}});
  return[name,{meshes,triangles,mapped,bounds:new T.Box3().setFromObject(root).getSize(new T.Vector3()).toArray()}];
 }));
 await writeFile(new URL('./actor-budgets.json',import.meta.url),JSON.stringify(budgets,null,2)+'\n');
 console.log(JSON.stringify(budgets,null,2));r.dispose();
}finally{await server.close();}
