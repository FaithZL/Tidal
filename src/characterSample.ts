import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {WorldResources,place} from './game/world/resources.js';
import {NprPalette} from './game/world/nprMaterials.js';
import {loadSampleCharacter} from './game/world/sampleCharacter.js';
import {CharacterSampleClock} from './game/world/characterSampleClock.js';
import '../web/character-sample.css';

document.title='Tidal · 人物动作局部样片';document.body.className='character-sample';
const stage=document.createElement('main');stage.id='motionStage';stage.dataset.assets='loading';stage.dataset.view='full';
const header=document.createElement('header');header.className='motion-heading';
header.innerHTML='<small>TIDAL · CHARACTER MOTION STUDY</small><h1>人物动作局部样片</h1><p id="motionSource">参考视频田园少年 · 原创头部与配饰 + CC0 服装骨骼，非 Leo 原模型。<br>仅审阅局部造型、站立与挥砍；不进行运动识别或计数。</p>';
const panel=document.createElement('section');panel.className='motion-panel';panel.setAttribute('aria-label','动作样片控制');
panel.innerHTML='<h2 id="motionPhase">准备动作素材</h2><p>观察腰胯发力、手臂随动和回收缓冲。拖动画面旋转，滚轮缩放。</p><div class="motion-buttons"><button id="motionReplay" disabled>重播动作</button><button id="motionPause" disabled>暂停</button><button id="motionSlow" aria-pressed="false" disabled>慢速 0.5×</button><button id="motionIdle" aria-pressed="false" disabled>仅看站立</button><button id="motionFace" aria-pressed="false" disabled>面部特写</button></div><label class="motion-scrub">逐帧检视 <span id="motionTime">0.00 s</span><input id="motionScrub" aria-label="逐帧检视" type="range" min="0" max="7.1" step="0.01" value="0" disabled></label><p class="motion-note">原创青年脸型与发型试装，非 Leo 模型。Leo 尚未购买，购买前再确认；本页只打磨人物局部。</p><a id="backToFarm">← 返回既有农场样板</a>';
const footer=document.createElement('div');footer.className='motion-footer';footer.textContent='STAND → WIND UP → CHOP → RECOVER · 局部审阅';
document.body.replaceChildren(stage,header,panel,footer);
document.body.inert=false;document.body.dataset.boot='ready';
const get=<E extends HTMLElement>(id:string):E=>document.getElementById(id) as E;
get<HTMLAnchorElement>('backToFarm').href=`${import.meta.env.BASE_URL}?art=npr-sample`;
const buttons=Array.from(panel.querySelectorAll('button'));
const scrub=get<HTMLInputElement>('motionScrub');
const resources=new WorldResources(),palette=new NprPalette(resources),events=new AbortController();
let renderer:T.WebGLRenderer|undefined,controls:OrbitControls|undefined,actor:Awaited<ReturnType<typeof loadSampleCharacter>>|undefined;
let request=0,last=0,paints=0,disposed=false,failed=false,dirty=true,clock:CharacterSampleClock|undefined;
function fail():void{
 if(disposed||failed)return;failed=true;stage.dataset.assets='failed';buttons.forEach(b=>b.disabled=true);scrub.disabled=true;
 const error=document.createElement('p');error.id='motionError';error.setAttribute('role','alert');error.textContent='动作素材加载失败，或3D画面不可用。请刷新重试；未切换替代角色或启动训练。';stage.appendChild(error);cancelAnimationFrame(request);
 events.abort();controls?.dispose();actor?.dispose();resources.dispose();renderer?.dispose();
}
function dispose():void{if(disposed)return;disposed=true;cancelAnimationFrame(request);events.abort();controls?.dispose();actor?.dispose();resources.dispose();renderer?.dispose();}
window.addEventListener('pagehide',dispose,{once:true});
document.addEventListener('visibilitychange',()=>{last=0;},{signal:events.signal});
async function start():Promise<void>{
 try{
  renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  const canvas=renderer.domElement;canvas.id='motionCanvas';canvas.setAttribute('aria-label','可旋转的局部人物动作样片');stage.prepend(canvas);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail();},{signal:events.signal});
  const scene=new T.Scene();scene.fog=new T.Fog(0xd4dfd4,11,26);
  const camera=new T.PerspectiveCamera(35,innerWidth/innerHeight,.05,60);camera.position.set(3.8,2.35,5.1);
  controls=new OrbitControls(camera,canvas);controls.target.set(0,1.05,0);controls.enablePan=false;controls.minDistance=2.5;controls.maxDistance=8;controls.maxPolarAngle=Math.PI*.49;controls.update();
  controls.addEventListener('change',()=>{dirty=true;});
  scene.add(new T.HemisphereLight(0xddeaf1,0x76815f,1.1));
  const sun=place(scene,new T.DirectionalLight(0xffe7c5,2.4),-3,4,2);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=sun.shadow.camera.bottom=-3;sun.shadow.camera.right=sun.shadow.camera.top=3;sun.shadow.camera.near=.1;sun.shadow.camera.far=15;sun.shadow.bias=-.0002;sun.shadow.normalBias=.006;
  sun.shadow.intensity=.6;
  const ground=place(scene,new T.Mesh(resources.geometry('motion-ground',()=>new T.CircleGeometry(22,64)),palette.material(0xb9c3a0)),0,-.016,0);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
  const ring=place(scene,new T.Mesh(resources.geometry('motion-plinth',()=>new T.CylinderGeometry(2.6,2.8,.07,64)),palette.material(0xcbd0aa)),0,-.055,0);ring.receiveShadow=true;
  // A single work target makes hand/tool contact readable; it never fells or creates inventory.
  const target=place(scene,resources.cylinder(.19,.25,.65,0x897150,14,'wood'),0,.325,1.05);target.castShadow=true;target.receiveShadow=true;
  const cut=place(scene,resources.cylinder(.195,.195,.015,0xd6bb89,20,'wood'),0,.657,1.05);cut.castShadow=true;
  actor=await loadSampleCharacter(resources,palette,import.meta.env.BASE_URL);
  if(disposed||failed){actor.dispose();resources.dispose();return;}
  // Place this one stationary review target at the actual blade's lowest downstroke.
  // It is art staging only: no tree-fall effect or inventory exists in this viewer.
  const contact=new T.Vector3(0,Infinity,0);
  for(let i=0;i<=12;i++){actor.sample(0,actor.clipDuration*.3*i/12,1);const point=actor.bladePosition();if(point.y<contact.y)contact.copy(point);}
  const height=Math.max(.25,contact.y);
  target.scale.y=height/.65;target.position.set(contact.x,height/2,contact.z);cut.position.set(contact.x,height+.008,contact.z);
  actor.sample(0,null,0);
  scene.add(actor.root);clock=new CharacterSampleClock(actor.clipDuration);stage.dataset.assets='ready';buttons.forEach(b=>b.disabled=false);scrub.disabled=false;
  const labels={idle:'站立 · 呼吸与重心',prepare:'挥砍 · 蓄力与转体',strike:'挥砍 · 下挥发力',recover:'回收 · 缓冲与复位'};
  const pause=get<HTMLButtonElement>('motionPause'),slow=get<HTMLButtonElement>('motionSlow'),idle=get<HTMLButtonElement>('motionIdle');
  pause.addEventListener('click',()=>{if(!clock)return;clock.paused=!clock.paused;pause.textContent=clock.paused?'继续':'暂停';},{signal:events.signal});
  slow.addEventListener('click',()=>{if(!clock)return;clock.rate=clock.rate===1?.5:1;slow.setAttribute('aria-pressed',String(clock.rate===.5));},{signal:events.signal});
  idle.addEventListener('click',()=>{if(!clock)return;clock.idleOnly=!clock.idleOnly;idle.setAttribute('aria-pressed',String(clock.idleOnly));dirty=true;},{signal:events.signal});
  const face=get<HTMLButtonElement>('motionFace'),fullPosition=new T.Vector3(),fullTarget=new T.Vector3();
  face.addEventListener('click',()=>{
   if(!actor||!controls)return;
   const close=face.getAttribute('aria-pressed')!=='true';
   if(close){
    fullPosition.copy(camera.position);fullTarget.copy(controls.target);
    const head=actor.root.getObjectByName('npr-farmer-head-pivot')!;
    const center=new T.Box3().setFromObject(head).getCenter(new T.Vector3());
    const narrow=innerWidth<=700;
    controls.minDistance=.55;controls.target.copy(center).y-=narrow?.15:0;
    camera.position.copy(center).add(new T.Vector3(.58,.07,narrow?1.65:1.3));
   }else{controls.minDistance=2.5;controls.target.copy(fullTarget);camera.position.copy(fullPosition);}
   face.setAttribute('aria-pressed',String(close));stage.dataset.view=close?'face':'full';controls.update();dirty=true;
  },{signal:events.signal});
  scrub.addEventListener('input',()=>{if(!clock)return;clock.time=Number(scrub.value);clock.paused=true;clock.idleOnly=false;pause.textContent='继续';idle.setAttribute('aria-pressed','false');dirty=true;},{signal:events.signal});
  get('motionReplay').addEventListener('click',()=>{clock?.replay();pause.textContent='暂停';idle.setAttribute('aria-pressed','false');},{signal:events.signal});
  window.addEventListener('resize',()=>{if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);dirty=true;},{signal:events.signal});
  function frame(time:number):void{
   if(disposed||failed||!clock||!actor||!renderer)return;
   const delta=last?time-last:0;last=time;const previousTime=clock.time;if(!document.hidden)clock.advance(delta);
   if(clock.time!==previousTime)dirty=true;
   const f=clock.frame;actor.sample(f.idleTime,f.chopTime,f.weight);stage.dataset.time=clock.time.toFixed(4);stage.dataset.phase=f.phase;
   stage.dataset.blade=actor.bladePosition().toArray().map(n=>n.toFixed(4)).join(',');
   scrub.value=(clock.time%7.1).toFixed(2);get('motionTime').textContent=`${(clock.time%7.1).toFixed(2)} s`;
   const phase=get('motionPhase');if(phase.textContent!==labels[f.phase])phase.textContent=labels[f.phase];
   if(dirty&&!document.hidden){renderer.render(scene,camera);dirty=false;stage.dataset.paints=String(++paints);}request=requestAnimationFrame(frame);
  }
  request=requestAnimationFrame(frame);
 }catch(error){console.error(error);fail();}
}
void start();
