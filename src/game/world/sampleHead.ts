import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {NprPalette} from './nprMaterials.js';
import type {WorldResources} from './resources.js';

type Section={y:number;x:number;z:number;cz:number};
const faceSections:readonly Section[]=[
 {y:.080,x:.027,z:.040,cz:.005},{y:.095,x:.052,z:.061,cz:.003},
 {y:.130,x:.084,z:.082,cz:-.003},{y:.180,x:.108,z:.100,cz:-.008},
 {y:.232,x:.128,z:.113,cz:-.014},{y:.286,x:.133,z:.116,cz:-.015},
 {y:.351,x:.130,z:.112,cz:-.019},{y:.411,x:.102,z:.096,cz:-.022},
 {y:.444,x:.044,z:.054,cz:-.025},{y:.452,x:.004,z:.007,cz:-.025},
];

function surface(sections:readonly Section[],sides=40):T.BufferGeometry{
 const position:number[]=[],uv:number[]=[],index:number[]=[];
 for(let j=0;j<sections.length;j++)for(let i=0;i<=sides;i++){
  const angle=i/sides*Math.PI*2,ring=sections[j];
  position.push(Math.cos(angle)*ring.x,ring.y,Math.sin(angle)*ring.z+ring.cz);uv.push(i/sides,j/(sections.length-1));
 }
 for(let j=0;j<sections.length-1;j++)for(let i=0;i<sides;i++){
  const a=j*(sides+1)+i,b=a+1,c=a+sides+1,d=c+1;index.push(a,c,b,b,c,d);
 }
 return geometry(position,index,uv);
}
function geometry(position:number[],index:number[],uv?:number[]):T.BufferGeometry{
 const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(position,3));
 if(uv)result.setAttribute('uv',new T.Float32BufferAttribute(uv,2));result.setIndex(index);result.computeVertexNormals();return result;
}
function faceFront(x:number,y:number):number{
 let a=faceSections[0],b=faceSections[1];
 for(let i=1;i<faceSections.length;i++)if(y>=faceSections[i-1].y){a=faceSections[i-1];b=faceSections[i];}
 const t=T.MathUtils.clamp((y-a.y)/(b.y-a.y),0,1),width=T.MathUtils.lerp(a.x,b.x,t),depth=T.MathUtils.lerp(a.z,b.z,t);
 return T.MathUtils.lerp(a.cz,b.cz,t)+depth*Math.sqrt(Math.max(.001,1-(x/width)**2));
}
/** Small curved facial patches follow the cheek plane, so outer eye corners do not float over the face. */
function patch(cx:number,cy:number,width:number,height:number,depth:number,almond=false,sign=1):T.BufferGeometry{
 const position=[cx,cy,faceFront(cx,cy)+depth+.0015],index:number[]=[],sides=40;
 for(let i=0;i<=sides;i++){
  const angle=i/sides*Math.PI*2,u=Math.cos(angle),v=Math.sin(angle),x=cx+u*width;
  const y=cy+(almond?Math.sign(v)*Math.abs(v)**1.45:v)*height+(almond?sign*u*.003:0);
  position.push(x,y,faceFront(x,y)+depth);
 }
 for(let i=0;i<sides;i++)index.push(0,i+1,i+2);return geometry(position,index);
}
function curve(points:readonly T.Vector3[],radius:number):T.BufferGeometry{
 return new T.TubeGeometry(new T.CatmullRomCurve3([...points]),20,radius,6,false);
}
function faceLine(points:readonly[number,number][],depth:number,radius:number):T.BufferGeometry{
 return curve(points.map(([x,y])=>new T.Vector3(x,y,faceFront(x,y)+depth)),radius);
}
function ellipsoid(position:T.Vector3,scale:T.Vector3):T.BufferGeometry{
 return new T.SphereGeometry(1,20,14).scale(scale.x,scale.y,scale.z).translate(position.x,position.y,position.z);
}
function hairline(angle:number):number{
 return .247+.127*Math.max(0,Math.sin(angle))-.028*Math.max(0,-Math.sin(angle))+.009*Math.sin(3*angle+.6)+.005*Math.cos(5*angle);
}
function scalpPoint(angle:number,t:number):T.Vector3{
 const q=Math.sin(t*Math.PI/2),radius=Math.max(.004,Math.cos(t*Math.PI/2))*(.985+.04*Math.sin(Math.PI*t)+.025*Math.sin(3*angle+1)*(1-t));
 const base=hairline(angle);
 return new T.Vector3(Math.cos(angle)*.151*radius-.008*q,base+(.518-base)*q+.006*Math.sin(2*angle+.8)*Math.sin(Math.PI*t),Math.sin(angle)*.139*radius-.025);
}
/** A closed scalp shell supports every overlapping tuft, including the less visible back of the head. */
function hairCap():T.BufferGeometry{
 const position:number[]=[],uv:number[]=[],index:number[]=[],sides=48,levels=9,stride=sides+1,shell=levels*stride;
 for(let layer=0;layer<2;layer++)for(let j=0;j<levels;j++)for(let i=0;i<=sides;i++){
  const point=scalpPoint(i/sides*Math.PI*2,j/(levels-1));
  if(layer){point.x*=.956;point.z=-.025+(point.z+.025)*.956;point.y-=.006;}
  position.push(point.x,point.y,point.z);uv.push(i/sides,j/(levels-1));
 }
 for(let layer=0;layer<2;layer++)for(let j=0;j<levels-1;j++)for(let i=0;i<sides;i++){
  const a=layer*shell+j*stride+i,b=a+1,c=a+stride,d=c+1;
  index.push(...(layer?[a,b,c,b,d,c]:[a,c,b,b,c,d]));
 }
 for(let i=0;i<sides;i++){
  const top=(levels-1)*stride+i;
  index.push(i,i+1,i+shell,i+1,i+shell+1,i+shell,top,top+shell,top+1,top+1,top+shell,top+shell+1);
 }
 return geometry(position,index,uv);
}
function onScalp(point:T.Vector3):T.Vector3{
 const y=point.y>.48?.48+(point.y-.48)*.55:point.y;
 const angle=Math.atan2(point.z+.025,point.x+.006),base=hairline(angle);
 let low=0,high=.995;
 for(let i=0;i<12;i++){const mid=(low+high)/2;if(scalpPoint(angle,mid).y<y)low=mid;else high=mid;}
 const result=scalpPoint(angle,(low+high)/2);
 // Fringe and nape ends continue down from the scalp; their roots remain inside the supporting shell.
 if(y<base)result.y=y;return result;
}
/** Broad roots overlap the shell; only the tapered final third lifts into an irregular windblown tip. */
function lock(points:readonly[number,number,number][],width:number,thickness:number,tip:readonly[number,number,number]=[0,0,0]):T.BufferGeometry{
 const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),position:number[]=[],uv:number[]=[],index:number[]=[],steps=11,sides=6;
 const bases=Array.from({length:steps+1},(_,j)=>onScalp(path.getPoint(j/steps)));
 const offsets=Array.from({length:steps+1},(_,j)=>new T.Vector3(...tip).multiplyScalar(T.MathUtils.smoothstep(j/steps,.60,1)*.5));
 const centers=bases.map((point,j)=>point.clone().add(offsets[j]));
 for(let j=0;j<=steps;j++){
  const t=j/steps,center=centers[j],tangent=centers[Math.min(steps,j+1)].clone().sub(centers[Math.max(0,j-1)]).normalize();
  const outward=new T.Vector3(center.x/.15,(center.y-.30)/.23,(center.z+.025)/.15).normalize();
  const across=new T.Vector3().crossVectors(outward,tangent).normalize(),normal=new T.Vector3().crossVectors(tangent,across).normalize();
  const taper=Math.max(.015,Math.sin(Math.PI*(.10+t*.90))**.67),rise=Math.sin(Math.PI*t),tipTaper=1-T.MathUtils.smoothstep(t,.76,1)*.75;
  // The inner side of a lifted tip still reaches its scalp support, making a solid tapered tuft.
  const depth=thickness*(.65+.35*rise)*Math.sqrt(taper)+Math.max(0,offsets[j].dot(normal))*tipTaper;
  for(let i=0;i<=sides;i++){
   const angle=i/sides*Math.PI*2,vertex=center.clone().addScaledVector(across,Math.cos(angle)*width*taper).addScaledVector(normal,Math.sin(angle)*depth);
   position.push(vertex.x,vertex.y,vertex.z);uv.push(i/sides,t);
  }
 }
 for(let j=0;j<steps;j++)for(let i=0;i<sides;i++){
  const a=j*(sides+1)+i,b=a+1,c=a+sides+1,d=c+1;index.push(a,b,c,b,d,c);
 }return geometry(position,index,uv);
}

/** Original head for the isolated motion sample only. Chin=.080, tousled crown≈.54; neutral face looks along +Z. */
export function createSampleHead(resources:WorldResources,palette:NprPalette):T.Group{
 const root=new T.Group();root.name='npr-farmer-head-pivot';
 const add=(name:string,color:number,make:()=>T.BufferGeometry):T.Mesh=>{
  const mesh=new T.Mesh(resources.geometry(`character-sample-head-v1/${name}`,make),palette.material(color));
  mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=false;root.add(mesh);return mesh;
 };
 const merge=(name:string,color:number,make:()=>T.BufferGeometry[]):T.Mesh=>add(name,color,()=>{
  const parts=make(),flat=parts.map(part=>part.index?part.toNonIndexed():part);
  const merged=mergeGeometries(flat,false);flat.forEach(part=>part.dispose());parts.filter(part=>!flat.includes(part)).forEach(part=>part.dispose());
  if(!merged)throw new Error(`Cannot create original sample head ${name}`);return merged;
 });
 const skin=0xedc4a3,hair=0x69432d;
 add('npr-farmer-head',skin,()=>surface(faceSections));
 merge('npr-farmer-ears',skin,()=>[-1,1].map(sign=>ellipsoid(new T.Vector3(sign*.137,.229,-.014),new T.Vector3(.019,.034,.021))));
 merge('npr-farmer-ear-folds',0xd4a584,()=>[-1,1].map(sign=>ellipsoid(new T.Vector3(sign*.143,.230,.003),new T.Vector3(.009,.021,.004))));
 merge('npr-farmer-eye-whites',0xf3eee1,()=>[-1,1].map(sign=>patch(sign*.059,.286,.035,.0115,.0045,true,sign)));
 merge('npr-farmer-eye-irises',0x62412a,()=>[-1,1].map(sign=>patch(sign*.059,.286,.0125,.0121,.007)));
 merge('npr-farmer-eye-color',0x966f43,()=>[-1,1].map(sign=>patch(sign*.059,.2835,.009,.0085,.009)));
 merge('npr-farmer-eye-pupils',0x30251e,()=>[-1,1].map(sign=>patch(sign*.059,.286,.0048,.010,.011)));
 merge('npr-farmer-eye-glints',0xfff6de,()=>[-1,1].map(sign=>patch(sign*.059-.0038,.291,.0023,.0027,.013)));
 merge('npr-farmer-eye-upper-lids',0x695447,()=>[-1,1].map(sign=>faceLine([
  [sign*.025,.284],[sign*.039,.293],[sign*.061,.298],[sign*.080,.295],[sign*.094,.289],
 ],.0075,.0022)));
 merge('npr-farmer-eye-lower-lids',0xbb9075,()=>[-1,1].map(sign=>faceLine([
  [sign*.027,.283],[sign*.045,.276],[sign*.067,.277],[sign*.087,.283],
 ],.0058,.00095)));
 merge('npr-farmer-brows',0x62422f,()=>[-1,1].map(sign=>faceLine([
  [sign*.029,.315],[sign*.049,.320],[sign*.070,.320],[sign*.091,.315],
 ],.006,.0025)));
 add('npr-farmer-nose',0xe4b994,()=>surface([
  {y:.224,x:.006,z:.003,cz:.103},{y:.230,x:.010,z:.006,cz:.106},{y:.238,x:.010,z:.009,cz:.106},
  {y:.249,x:.005,z:.006,cz:.103},{y:.263,x:.002,z:.003,cz:.101},
 ],20));
 merge('npr-farmer-mouth',0xac7e6b,()=>[faceLine([[-.021,.178],[-.011,.176],[0,.175],[.012,.176],[.021,.178]],.006,.00135)]);
 add('npr-farmer-lower-lip',0xe2b399,()=>patch(0,.168,.014,.0024,.004));
 add('npr-farmer-hair',hair,hairCap);
 // A loose crown, staggered side tufts and overlapping bangs replace the tidy side-part helmet.
 merge('npr-farmer-hair-layers',0x754b31,()=>[
  lock([[-.055,.525,-.055],[-.020,.535,-.020],[.020,.527,.025],[.067,.504,.028]],.035,.018,[.012,.009,.002]),
  lock([[.032,.520,-.079],[.012,.533,-.055],[-.039,.523,-.025],[-.091,.489,.016]],.031,.016,[-.010,.005,.003]),
  lock([[-.055,.518,-.018],[-.089,.506,.043],[-.093,.436,.108],[-.074,.342,.132]],.031,.010,[-.010,-.007,.009]),
  lock([[-.023,.523,-.006],[.004,.507,.071],[.016,.433,.137],[.033,.329,.142]],.030,.011,[-.008,-.009,.010]),
  lock([[.013,.517,-.035],[.063,.493,.057],[.082,.432,.110],[.109,.351,.096]],.030,.011,[.014,-.010,.008]),
  lock([[-.050,.519,-.070],[-.087,.510,-.033],[-.124,.461,.008],[-.144,.415,.033]],.032,.012,[-.020,-.004,.004]),
  lock([[-.093,.476,-.012],[-.132,.435,.022],[-.148,.390,.039],[-.142,.359,.036]],.027,.011,[-.022,-.005,.004]),
  lock([[-.116,.410,-.051],[-.150,.369,-.030],[-.145,.319,-.017],[-.141,.277,.002]],.025,.009,[-.022,-.004,.003]),
  lock([[.026,.512,-.079],[.096,.470,-.073],[.141,.427,-.028],[.151,.396,-.006]],.029,.011,[.023,-.005,.001]),
  lock([[.102,.443,-.034],[.148,.393,.002],[.149,.349,.010],[.145,.321,.006]],.026,.010,[.022,-.005,.005]),
  lock([[.079,.460,-.113],[.127,.400,-.103],[.142,.321,-.073],[.133,.253,-.041]],.026,.011,[.019,-.006,.002]),
  lock([[-.055,.434,-.145],[-.064,.397,-.153],[-.036,.353,-.165],[-.016,.309,-.168]],.030,.011,[.010,-.005,-.008]),
  // Short overlapping back rows leave three unequal nape tips, rather than crown-to-neck ribbons.
  lock([[-.080,.441,-.110],[-.127,.408,-.104],[-.145,.376,-.086],[-.146,.348,-.077]],.030,.012,[-.018,-.004,-.002]),
  lock([[.023,.457,-.121],[.089,.425,-.135],[.119,.385,-.123],[.133,.353,-.104]],.029,.012,[.018,-.004,-.003]),
  lock([[-.089,.341,-.133],[-.110,.296,-.140],[-.104,.247,-.136],[-.116,.214,-.121]],.028,.011,[-.016,-.008,-.005]),
  lock([[-.022,.325,-.162],[-.045,.282,-.169],[-.034,.239,-.169],[-.044,.197,-.160]],.027,.011,[-.012,-.008,-.010]),
  lock([[.045,.339,-.150],[.074,.293,-.154],[.064,.243,-.150],[.088,.207,-.141]],.028,.011,[.013,-.007,-.009]),
 ]);
 merge('npr-farmer-hair-shaded-layers',0x623e2b,()=>[
  lock([[-.090,.380,-.121],[-.121,.349,-.117],[-.127,.301,-.105],[-.114,.256,-.110]],.027,.009,[-.014,-.004,-.006]),
  lock([[.070,.402,-.131],[.106,.369,-.131],[.118,.324,-.119],[.104,.282,-.107]],.027,.009,[.015,-.005,-.006]),
  lock([[-.093,.470,.005],[-.125,.423,.065],[-.114,.373,.107],[-.102,.310,.108]],.024,.010,[-.004,-.004,.008]),
  lock([[.078,.475,.012],[.111,.416,.069],[.119,.357,.084],[.126,.294,.063]],.024,.009,[.010,-.004,.005]),
 ]);
 merge('npr-farmer-hair-soft-strands',0x805436,()=>[
  lock([[-.049,.524,-.014],[-.069,.509,.056],[-.062,.463,.111],[-.060,.433,.129]],.011,.004),
  lock([[.005,.524,-.055],[.052,.502,-.005],[.093,.462,.055],[.125,.437,.049]],.010,.004,[.010,.001,.002]),
  lock([[-.091,.477,-.073],[-.129,.426,-.064],[-.148,.399,-.033],[-.150,.374,-.022]],.010,.004,[-.006,.001,0]),
 ]);
 return root;
}
