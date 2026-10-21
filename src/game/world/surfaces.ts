import * as T from 'three';

export type SurfaceKind='solid'|'wood'|'bark'|'endgrain'|'roof'|'soil'|'path'|'cloth'|'stone'|'grass'|'water'|'shadow';
const size=128,tau=Math.PI*2;
const fract=(n:number)=>n-Math.floor(n);

/** Original, deterministic small surface maps. No DOM, image request or per-frame generation. */
export function makeSurface(kind:Exclude<SurfaceKind,'solid'>):T.DataTexture{
 const data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/(size-1),v=y/(size-1),noise=fract(Math.sin(x*127.1+y*311.7)*43758.5453);
  let shade=.96,alpha=255;
  switch(kind){
   case 'wood':{
    const grain=(1+Math.sin(u*tau*10+.65*Math.sin(v*tau*2)))/2;
    const knot=Math.hypot((u-.36)*2.2,(v-.57)*.7);
    shade=.97-.16*Math.pow(grain,8)-.025*noise-.06*Math.pow((1+Math.sin(knot*95))/2,8)*Math.exp(-knot*8);break;
   }
   case 'bark':{
    const groove=(1+Math.sin(u*tau*13+.7*Math.sin(v*tau*3)))/2;
    shade=.95-.24*Math.pow(groove,5)-.045*noise;break;
   }
   case 'endgrain':{
    const dx=u-.5,dy=v-.5,angle=Math.atan2(dy,dx),radius=Math.hypot(dx,dy);
    const rings=(1+Math.sin(radius*80+.65*Math.sin(angle*4)+.2*Math.sin(angle*9)))/2;
    const crack=Math.abs(Math.sin(angle*3+.4))<.025&&radius>.24;
    shade=.98-.24*Math.pow(rings,6)-.025*noise-(crack?.18:0);break;
   }
   case 'roof':{
    const row=Math.floor(v*6),tx=fract(u*5+(row%2)*.5),ty=fract(v*6);
    shade=tx>.94||ty>.88?.62:.94-.09*ty-.025*noise;break;
   }
   case 'soil':shade=.85+.09*Math.sin(u*tau*9)-.055*noise;break;
   case 'path':shade=.94+.035*Math.sin(u*tau*3+Math.sin(v*tau*2))-.045*noise;break;
   case 'cloth':shade=.97-.045*(.5+.5*Math.cos(u*tau*24)*Math.cos(v*tau*24))-.015*noise;break;
   case 'stone':shade=.88+.065*Math.sin(u*tau*2+Math.cos(v*tau*3))-.055*noise;break;
   case 'grass':shade=.95+.035*Math.sin(u*tau*3)*Math.cos(v*tau*2)-.035*noise;break;
   case 'water':shade=.91+.065*Math.sin(u*tau*3+v*tau*2)+.025*Math.sin(v*tau*9);break;
   case 'shadow':shade=1;alpha=Math.round(255*Math.pow(Math.max(0,1-Math.hypot((u-.5)*2,(v-.5)*2)),1.4));break;
  }
  const i=(y*size+x)*4,value=Math.round(Math.min(1,Math.max(0,shade))*255);
  data[i]=data[i+1]=data[i+2]=value;data[i+3]=alpha;
 }
 const texture=new T.DataTexture(data,size,size,T.RGBAFormat);
 texture.name=`tidal-original-${kind}`;texture.colorSpace=T.SRGBColorSpace;
 texture.wrapS=texture.wrapT=kind==='shadow'?T.ClampToEdgeWrapping:T.RepeatWrapping;
 texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapNearestFilter;texture.magFilter=T.LinearFilter;
 texture.needsUpdate=true;return texture;
}
