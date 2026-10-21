import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {makeSurface,type SurfaceKind} from './surfaces.js';
export type {SurfaceKind} from './surfaces.js';
/** Shared local geometry/materials; owned and disposed by one FarmWorld. */
export class WorldResources{
 private geometries=new Map<string,T.BufferGeometry>();private materials=new Map<string,T.MeshLambertMaterial>();private textures=new Map<SurfaceKind,T.DataTexture>();
 material(color:number,surface:SurfaceKind='solid',vertexColors=false):T.MeshLambertMaterial{
  const key=`${color}/${surface}/${vertexColors}`;let m=this.materials.get(key);
  if(!m){
   let map:T.DataTexture|null=null;
   if(surface!=='solid'){map=this.textures.get(surface)??makeSurface(surface);this.textures.set(surface,map);}
   m=new T.MeshLambertMaterial({color,map,vertexColors,transparent:surface==='shadow',depthWrite:surface!=='shadow',opacity:surface==='shadow'?.5:1});
   this.materials.set(key,m);
  }return m;
 }
 geometry(key:string,make:()=>T.BufferGeometry):T.BufferGeometry{let g=this.geometries.get(key);if(!g){g=make();this.geometries.set(key,g);}return g;}
 box(w:number,h:number,d:number,c:number,surface:SurfaceKind='solid'):T.Mesh{
  const geometry=this.geometry(`${surface==='path'?'path':'b'}${w}/${h}/${d}`,()=>{
   const box=new T.BoxGeometry(w,h,d);
   if(surface==='path'){
    const uv=box.getAttribute('uv');
    for(let i=0;i<uv.count;i++){const face=Math.floor(i/4);uv.setXY(i,uv.getX(i)*(face<2?d:w)/2,uv.getY(i)*(face===2||face===3?d:h)/2);}
   }return box;
  });return this.mesh(geometry,c,surface);
 }
 roundedBox(w:number,h:number,d:number,radius:number,c:number,surface:SurfaceKind='solid'):T.Mesh{return this.mesh(this.geometry(`rounded${w}/${h}/${d}/${radius}`,()=>new RoundedBoxGeometry(w,h,d,1,radius)),c,surface);}
 cylinder(top:number,bottom:number,h:number,c:number,sides=12,surface:SurfaceKind='solid'):T.Mesh{return this.mesh(this.geometry(`c${top}/${bottom}/${h}/${sides}`,()=>new T.CylinderGeometry(top,bottom,h,sides)),c,surface);}
 sphere(r:number,c:number,surface:SurfaceKind='solid'):T.Mesh{return this.mesh(this.geometry(`s${r}`,()=>new T.SphereGeometry(r,12,8)),c,surface);}
 cone(r:number,h:number,c:number,sides=8,surface:SurfaceKind='solid'):T.Mesh{return this.mesh(this.geometry(`p${r}/${h}/${sides}`,()=>new T.ConeGeometry(r,h,sides)),c,surface);}
 mesh(g:T.BufferGeometry,c:number,surface:SurfaceKind='solid',vertexColors=false):T.Mesh{const m=new T.Mesh(g,this.material(c,surface,vertexColors));m.receiveShadow=true;return m;}
 dispose():void{for(const g of this.geometries.values())g.dispose();for(const m of this.materials.values())m.dispose();for(const t of this.textures.values())t.dispose();this.geometries.clear();this.materials.clear();this.textures.clear();}
}
export function place<O extends T.Object3D>(parent:T.Object3D,object:O,x:number,y:number,z:number):O{object.position.set(x,y,z);parent.add(object);return object;}
export function segment(mesh:T.Mesh,a:T.Vector3,b:T.Vector3):void{const direction=b.clone().sub(a),length=direction.length();mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=Math.max(.001,length);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());}
