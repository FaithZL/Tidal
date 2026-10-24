import * as T from 'three';
import type {NprPalette} from './nprMaterials.js';
import type {WorldResources} from './resources.js';

/** Keep the imported pixels/UVs and their cloth shading while changing only this mesh's broad garment tone. */
export function retintSampleGarment(source:T.MeshToonMaterial,kind:'linen'|'tunic'|'trousers'|'boots'):T.MeshToonMaterial{
 const material=source.clone(),tint=new T.Color(kind==='linen'||kind==='tunic'?0xc7beaa:kind==='trousers'?0x6b715e:0x60462f);
 material.name=`${source.name}-${kind}`;
 material.onBeforeCompile=(shader,renderer)=>{
  source.onBeforeCompile(shader,renderer);
  shader.uniforms.sampleGarmentTint={value:tint};shader.uniforms.sampleGarmentAmount={value:kind==='boots'?.64:.91};
  shader.fragmentShader=`uniform vec3 sampleGarmentTint;\nuniform float sampleGarmentAmount;\n${shader.fragmentShader}`;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   #ifdef USE_MAP
    float sampleClothLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
    vec3 sampleRetinted=sampleGarmentTint*(.72+.85*sqrt(max(sampleClothLuma,.0001)));
    float sampleClothMask=${kind==='tunic'?'smoothstep(.12,.25,sampleClothLuma)*smoothstep(.012,.045,diffuseColor.r-diffuseColor.b)':'1.0'};
    diffuseColor.rgb=mix(diffuseColor.rgb,sampleRetinted,sampleGarmentAmount*sampleClothMask);
   #endif
  `);
 };
 material.customProgramCacheKey=()=>`${source.customProgramCacheKey()}/sample-garment-v1/${kind}`;
 return material;
}

function geometry(position:number[],index:number[]):T.BufferGeometry{
 const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(position,3));result.setIndex(index);result.computeVertexNormals();return result;
}
/** An open, uneven cloth wrap. The lower edge rests on the tunic; the upper edge leaves the real neck opening clear. */
function foldedCollar():T.BufferGeometry{
 const position:number[]=[],index:number[]=[],sides=40,rows=5;
 for(let row=0;row<rows;row++)for(let column=0;column<=sides;column++){
  const t=row/(rows-1),angle=column/sides*Math.PI*2,front=Math.sin(angle),fold=Math.sin(angle*5+.5)+.38*Math.sin(angle*9-.8);
  const radius=T.MathUtils.lerp(.111,.070,t)+Math.sin(t*Math.PI)*.014+fold*.0025;
  const lower=-.027-.010*Math.max(0,front)+.005*Math.cos(angle*2),upper=.052-.019*front+.004*Math.sin(angle*3);
  position.push(Math.cos(angle)*radius,T.MathUtils.lerp(lower,upper,t)+Math.sin(t*Math.PI)*fold*.006,Math.sin(angle)*radius*.89);
 }
 for(let row=0;row<rows-1;row++)for(let column=0;column<sides;column++){
  const a=row*(sides+1)+column,b=a+1,c=a+sides+1,d=c+1;index.push(a,c,b,b,c,d);
 }
 return geometry(position,index);
}
/** Two short folded ends lie down the upper back; they bend with the chest rather than with head turns. */
function scarfTails(parent:T.Object3D,tunic:T.SkinnedMesh):T.BufferGeometry{
 const position:number[]=[],index:number[]=[],rows=8,columns=8;
 for(const side of[-1,1]){
  const offset=position.length/3;
  for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++){
   const t=row/rows,u=column/columns*2-1,width=(side<0?.046:.038)*(1-.94*T.MathUtils.smoothstep(t,0,1));
   const center=side<0?-.032+.014*Math.sin(t*Math.PI)+.014*t:.025+.025*Math.sin(t*Math.PI)+.015*t;
   const y=-.027-t*(side<0?.143:.105)-Math.abs(u)*.010*t;
   const z=-.098-.051*Math.sin(t*Math.PI*.7)+Math.cos(u*Math.PI)*.007-Math.sin(t*Math.PI)*Math.sin(u*Math.PI*1.5)*.004;
   position.push(center+u*width,y,z);
   if(row<rows&&column<columns){const a=offset+row*(columns+1)+column,b=a+1,c=a+columns+1,d=c+1;index.push(a,b,c,b,d,c);}
  }
 }
 return fitBackSurface(geometry(position,index),parent,tunic,.008,.003);
}
/** Two slightly curved leather strips meet below the shoulder blades; all fitting happens once in bind space. */
function backHarness(parent:T.Object3D,tunic:T.SkinnedMesh):T.BufferGeometry{
 const position:number[]=[],index:number[]=[],rows=14,columns=4;
 for(const side of[-1,1]){
  const offset=position.length/3;
  for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++){
   const t=row/rows,u=column/columns*2-1,x=side*(.155*(1-t)**1.12+.008),y=-.012-.241*t;
   const tangent=new T.Vector2(-side*.174*Math.max(.01,1-t)**.12,-.241).normalize(),width=.017*(.94+.06*Math.sin(t*Math.PI));
   position.push(x-tangent.y*u*width,y+tangent.x*u*width,-.10-.045*t+Math.abs(u)*.001);
   if(row<rows&&column<columns){const a=offset+row*(columns+1)+column,b=a+1,c=a+columns+1,d=c+1;index.push(a,b,c,b,d,c);}
  }
 }
 return fitBackSurface(geometry(position,index),parent,tunic,.005,.002);
}
function fitBackSurface(result:T.BufferGeometry,parent:T.Object3D,tunic:T.SkinnedMesh,offset:number,fold:number):T.BufferGeometry{
 const points=result.getAttribute('position'),tunicPoints=tunic.geometry.getAttribute('position'),tunicIndex=tunic.geometry.index!;
 parent.updateWorldMatrix(true,false);tunic.updateWorldMatrix(true,false);tunic.skeleton.update();
 const vertices=Array.from({length:tunicPoints.count},(_,i)=>tunic.applyBoneTransform(i,new T.Vector3().fromBufferAttribute(tunicPoints,i)).applyMatrix4(tunic.matrixWorld));
 const triangle=new T.Triangle(),candidate=new T.Vector3(),closest=new T.Vector3(),normal=new T.Vector3(),inverse=parent.matrixWorld.clone().invert();
 // Fit the original small folds onto the actual bind-pose back, so the drape begins on fabric rather than behind it.
 for(let i=0;i<points.count;i++){
  const point=new T.Vector3().fromBufferAttribute(points,i).applyMatrix4(parent.matrixWorld);let nearest=Infinity;
  for(let j=0;j<tunicIndex.count;j+=3){
   triangle.set(vertices[tunicIndex.getX(j)],vertices[tunicIndex.getX(j+1)],vertices[tunicIndex.getX(j+2)]);triangle.closestPointToPoint(point,candidate);
   const distance=point.distanceToSquared(candidate);if(distance>=nearest)continue;nearest=distance;closest.copy(candidate);triangle.getNormal(normal);
  }
  closest.addScaledVector(normal,offset+Math.sin(i%9/8*Math.PI)*fold).applyMatrix4(inverse);points.setXYZ(i,closest.x,closest.y,closest.z);
 }
 result.computeVertexNormals();return result;
}
function pouchFlap():T.BufferGeometry{
 const position:number[]=[],index:number[]=[],rows=7,columns=10;
 for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++){
  const t=row/rows,u=column/columns*2-1;
  position.push(u*.092*(1-.17*t),.096-.103*t-Math.cos(u*Math.PI/2)*.010*t,-.038-Math.sin(t*Math.PI*.7)*.020);
  if(row<rows&&column<columns){const a=row*(columns+1)+column,b=a+1,c=a+columns+1,d=c+1;index.push(a,b,c,b,d,c);}
 }
 return geometry(position,index);
}
function mount(parent:T.Object3D,name:string,worldOrigin?:T.Vector3):T.Group{
 const group=new T.Group();group.name=name;parent.updateWorldMatrix(true,false);
 if(worldOrigin)group.position.copy(parent.worldToLocal(worldOrigin.clone()));
 // Author the small cloth surfaces upright in bind space, then retain the bone's animated orientation.
 group.quaternion.copy(parent.getWorldQuaternion(new T.Quaternion()).invert());parent.add(group);return group;
}

/** Original accessories for the isolated motion sample; shared allocations are owned by WorldResources. */
export function addSampleCostume(resources:WorldResources,palette:NprPalette,neck:T.Object3D,chest:T.Object3D,waist:T.Object3D,tunic:T.SkinnedMesh):void{
 const wrap=mount(neck,'sample-scarf-neck-mount'),drape=mount(chest,'sample-scarf-chest-mount',neck.getWorldPosition(new T.Vector3()));
 const cloth=palette.material(0x834333,'cloth');cloth.side=T.DoubleSide;
 const add=(parent:T.Object3D,name:string,shape:()=>T.BufferGeometry,material:T.Material):T.Mesh=>{
  const object=new T.Mesh(resources.geometry(`sample-costume-v1/${name}`,shape),material);object.name=name;object.castShadow=true;object.receiveShadow=false;parent.add(object);return object;
 };
 add(wrap,'sample-scarf-collar',foldedCollar,cloth);add(drape,'sample-scarf-tails',()=>scarfTails(drape,tunic),cloth);
 const leather=palette.material(0x61452e,'cloth');leather.side=T.DoubleSide;
 add(drape,'sample-back-harness',()=>backHarness(drape,tunic),leather);
 const pouch=mount(waist,'sample-pouch-waist-mount');pouch.position.add(waist.worldToLocal(waist.getWorldPosition(new T.Vector3()).add(new T.Vector3(.122,.047,-.166))));
 const body=resources.roundedBox(.172,.170,.072,.024,0x694a31);body.name='sample-waist-pouch';body.material=palette.material(0x694a31,'cloth');body.castShadow=true;body.receiveShadow=false;pouch.add(body);
 add(pouch,'sample-waist-pouch-flap',pouchFlap,palette.material(0x805b3a,'cloth'));
 const loop=resources.roundedBox(.032,.042,.012,.005,0x59412e);loop.material=palette.material(0x59412e);loop.position.set(0,.085,.013);loop.castShadow=true;pouch.add(loop);
 const clasp=resources.roundedBox(.022,.028,.008,.003,0xa68a52);clasp.material=palette.material(0xa68a52);clasp.position.set(0,.014,-.061);clasp.castShadow=true;pouch.add(clasp);
}
