import * as T from 'three';
/** Shared local geometry/materials; owned and disposed by one FarmWorld. */
export class WorldResources{
 private geometries=new Map<string,T.BufferGeometry>();private materials=new Map<number,T.MeshLambertMaterial>();
 material(color:number):T.MeshLambertMaterial{let m=this.materials.get(color);if(!m){m=new T.MeshLambertMaterial({color});this.materials.set(color,m);}return m;}
 geometry(key:string,make:()=>T.BufferGeometry):T.BufferGeometry{let g=this.geometries.get(key);if(!g){g=make();this.geometries.set(key,g);}return g;}
 box(w:number,h:number,d:number,c:number):T.Mesh{return this.mesh(this.geometry(`b${w}/${h}/${d}`,()=>new T.BoxGeometry(w,h,d)),c);}
 cylinder(top:number,bottom:number,h:number,c:number,sides=12):T.Mesh{return this.mesh(this.geometry(`c${top}/${bottom}/${h}/${sides}`,()=>new T.CylinderGeometry(top,bottom,h,sides)),c);}
 sphere(r:number,c:number):T.Mesh{return this.mesh(this.geometry(`s${r}`,()=>new T.SphereGeometry(r,12,8)),c);}
 cone(r:number,h:number,c:number,sides=8):T.Mesh{return this.mesh(this.geometry(`p${r}/${h}/${sides}`,()=>new T.ConeGeometry(r,h,sides)),c);}
 mesh(g:T.BufferGeometry,c:number):T.Mesh{const m=new T.Mesh(g,this.material(c));m.receiveShadow=true;return m;}
 dispose():void{for(const g of this.geometries.values())g.dispose();for(const m of this.materials.values())m.dispose();this.geometries.clear();this.materials.clear();}
}
export function place<O extends T.Object3D>(parent:T.Object3D,object:O,x:number,y:number,z:number):O{object.position.set(x,y,z);parent.add(object);return object;}
export function segment(mesh:T.Mesh,a:T.Vector3,b:T.Vector3):void{const direction=b.clone().sub(a),length=direction.length();mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=Math.max(.001,length);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());}
