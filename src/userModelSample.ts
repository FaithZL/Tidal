import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {loadUserModel,type UserModel,type UserModelKind} from './game/world/userModel.js';
import {createUserCharacterRig} from './game/world/userCharacterRig.js';
import {UserCharacterMotion} from './game/world/userCharacterMotion.js';
import {deriveUserChopContact} from './game/world/userChopContact.js';
import {CharacterSampleClock} from './game/world/characterSampleClock.js';
import '../web/character-sample.css';

// An isolated visual review. It never initializes session, pose or camera input.
const staticOnly=new URLSearchParams(location.search).get('model')==='static';
document.title='Tidal · 人物与房屋模型';document.body.className='character-sample user-model-sample';
const stage=document.createElement('main');stage.id='motionStage';stage.dataset.assets='loading';stage.dataset.view=staticOnly?'full':'character';stage.dataset.motionSupport=staticOnly?'static':'derived-skeleton';
const header=document.createElement('header');header.className='motion-heading';
header.innerHTML=`<small>TIDAL · SUPPLIED MODEL REVIEW</small><h1>人物与房屋模型</h1><p id="motionSource">${staticOnly?'用户提供的 FBX 人物与房屋 · 本地内嵌贴图。<br>源人物无骨骼、无动作片段，目前为固定挥砍姿势；本页不进行运动识别或计数。':'用户提供的源 FBX 为静态模型；当前使用本地派生骨骼与动作。<br>无摄像头演示，非真人输入；仅审阅站立、挥砍和回收，不进行运动识别或计数。'}</p>`;
const panel=document.createElement('section');panel.className='motion-panel';panel.setAttribute('aria-label','模型查看控制');
panel.innerHTML=`<h2 id="motionPhase">载入人物与房屋</h2><p>拖动画面旋转，滚轮或双指缩放。${staticOnly?'人物保持原模型姿势，近景按钮仅切换镜头。':'观察双脚支撑、腰胯发力与双手持斧；可以暂停并逐帧检视。'}</p><div class="motion-buttons model-view-buttons"><button id="modelCharacter" disabled>人物近景</button><button id="modelHouse" disabled>房屋近景</button><button id="modelTogether" disabled>同框查看</button>${staticOnly?'':'<button id="modelGrip" disabled>手肘特写</button>'}</div>${staticOnly?'':'<p class="motion-inspect-note">特写会暂停当前动作</p><div class="motion-buttons user-motion-buttons"><button id="motionReplay" disabled>重播动作</button><button id="motionPause" disabled>暂停</button><button id="motionSlow" aria-pressed="false" disabled>慢速 0.5×</button><button id="motionIdle" aria-pressed="false" disabled>仅看站立</button></div><label class="motion-scrub">逐帧检视 <span id="motionTime">0.00 s</span><input id="motionScrub" aria-label="逐帧检视" type="range" min="0" max="7.1" step="0.01" value="0" disabled></label>'}<p class="motion-note">${staticOnly?'此页保留原始静态造型对照，不使用整体晃动代替人体动作。':'人工标记关节并生成蒙皮，属于本地动作试作，不是原作者动画或动捕。农场无摄像头模拟开关与真实输入切换保持原设置。'}</p><a id="staticCompare">${staticOnly?'派生骨骼动作样片':'原静态造型对照'}</a><a id="prototypeCompare">原动作样片对照</a><a id="backToFarm">← 返回农场</a>`;
const footer=document.createElement('div');footer.className='motion-footer';footer.textContent=staticOnly?'SUPPLIED FBX · STATIC CHARACTER + HOUSE':'SUPPLIED FBX · LOCAL RIG · STAND → CHOP → RECOVER';
document.body.replaceChildren(stage,header,panel,footer);document.body.inert=false;document.body.dataset.boot='ready';
const base=import.meta.env.BASE_URL;
(document.getElementById('prototypeCompare') as HTMLAnchorElement).href=`${base}?art=character-motion&model=prototype`;
(document.getElementById('staticCompare') as HTMLAnchorElement).href=`${base}?art=character-motion${staticOnly?'':'&model=static'}`;
(document.getElementById('backToFarm') as HTMLAnchorElement).href=`${base}?art=npr-sample`;
const buttons=Array.from(panel.querySelectorAll('button')),events=new AbortController(),models=new Map<UserModelKind,UserModel>();
const scrub=document.getElementById('motionScrub') as HTMLInputElement|null;
const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
let renderer:T.WebGLRenderer|undefined,controls:OrbitControls|undefined,sun:T.DirectionalLight|undefined;
let rig:ReturnType<typeof createUserCharacterRig>|undefined,motion:UserCharacterMotion|undefined,clock:CharacterSampleClock|undefined;
let request=0,paints=0,disposed=false,failed=false,released=false,last=0,dirty=true;

function release():void{
 if(released)return;released=true;
 cancelAnimationFrame(request);request=0;events.abort();controls?.dispose();
 rig?.dispose();models.forEach(model=>{if(!rig||model.kind!=='character')model.dispose();});models.clear();geometries.forEach(geometry=>geometry.dispose());geometries.clear();materials.forEach(material=>material.dispose());materials.clear();
 sun?.shadow.dispose();renderer?.renderLists.dispose();renderer?.dispose();renderer?.forceContextLoss();
}
function fail():void{
 if(disposed||failed)return;failed=true;stage.dataset.assets='failed';buttons.forEach(button=>button.disabled=true);if(scrub)scrub.disabled=true;
 const error=document.createElement('p');error.id='motionError';error.setAttribute('role','alert');error.textContent='模型加载失败，或3D画面不可用。请刷新重试；未自动切换旧模型。';stage.appendChild(error);release();
}
window.addEventListener('pagehide',()=>{if(disposed)return;disposed=true;release();},{once:true});
// A page restored from BFCache owns no live renderer after pagehide: rebuild it.
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});

async function start():Promise<void>{
 try{
  renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  const canvas=renderer.domElement;canvas.id='motionCanvas';canvas.setAttribute('aria-label','可旋转的人物与房屋模型');stage.prepend(canvas);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fail();},{signal:events.signal});
  const scene=new T.Scene();scene.fog=new T.Fog(0xd5dfd2,24,55);
  const camera=new T.PerspectiveCamera(36,innerWidth/innerHeight,.05,100);
  controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.minDistance=2.5;controls.maxDistance=80;controls.maxPolarAngle=Math.PI*.49;
  const labels={idle:'站立 · 呼吸与重心',prepare:'挥砍 · 蓄力与转体',strike:'挥砍 · 下挥发力',recover:'回收 · 缓冲与复位'};
  const frame=(time:number):void=>{
   request=0;if(disposed||failed||!renderer)return;
   const delta=last?time-last:0;last=time;
   if(clock&&motion){
    const previous=clock.time;if(!document.hidden)clock.advance(delta);if(clock.time!==previous)dirty=true;
    if(dirty){const pose=motion.sample(clock.time,clock.idleOnly);stage.dataset.phase=pose.phase;stage.dataset.time=clock.time.toFixed(4);stage.dataset.blade=motion.bladePosition().toArray().map(value=>value.toFixed(4)).join(',');
     const phase=document.getElementById('motionPhase')!;if(phase.textContent!==labels[pose.phase])phase.textContent=labels[pose.phase];
     if(scrub)scrub.value=(clock.time%7.1).toFixed(2);document.getElementById('motionTime')!.textContent=`${(clock.time%7.1).toFixed(2)} s`;
    }
   }
   if(dirty&&!document.hidden){renderer.render(scene,camera);stage.dataset.paints=String(++paints);dirty=false;}
   if(clock)request=requestAnimationFrame(frame);
  };
  const redraw=():void=>{dirty=true;if(!disposed&&!failed&&!request)request=requestAnimationFrame(frame);};
  controls.addEventListener('change',redraw);
  document.addEventListener('visibilitychange',()=>{last=0;redraw();},{signal:events.signal});
  scene.add(new T.HemisphereLight(0xe1edf4,0x73815d,1.5));sun=new T.DirectionalLight(0xffe7c5,2.4);sun.position.set(-6,10,7);sun.target.position.set(0,1,0);scene.add(sun,sun.target);
  sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=sun.shadow.camera.bottom=-10;sun.shadow.camera.right=sun.shadow.camera.top=10;sun.shadow.camera.near=.1;sun.shadow.camera.far=35;sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;sun.shadow.intensity=.55;
  const groundGeometry=new T.CircleGeometry(28,64),groundMaterial=new T.MeshToonMaterial({color:0xb8c59e});geometries.add(groundGeometry);materials.add(groundMaterial);
  const ground=new T.Mesh(groundGeometry,groundMaterial);ground.rotation.x=-Math.PI/2;ground.position.y=-.018;ground.receiveShadow=true;scene.add(ground);
  let currentView:'character'|'house'|'full'|'grip'=staticOnly?'full':'character';
  const characterEnvelope=new T.Box3();
  const setView=(view:'character'|'house'|'full'|'grip'):void=>{
   if(!controls)return;currentView=view;const narrow=innerWidth<=700,bounds=new T.Box3();
   if(view==='grip'&&rig&&motion){
    // Freeze this inspection camera on the current real palms and elbows. It is
    // never updated by the animation loop or inferred from a generic head rig.
    bounds.expandByPoint(motion.handPosition('left')).expandByPoint(motion.handPosition('right'));
    bounds.expandByPoint(rig.bones.leftForeArm.getWorldPosition(new T.Vector3())).expandByPoint(rig.bones.rightForeArm.getWorldPosition(new T.Vector3())).expandByScalar(.12);
   }else models.forEach(model=>{if(view==='full'||model.kind===view)bounds.union(model.kind==='character'&&!characterEnvelope.isEmpty()?characterEnvelope:new T.Box3().setFromObject(model.root,true));});
   if(bounds.isEmpty())bounds.set(new T.Vector3(-6,0,-5),new T.Vector3(7,5.4,4));
   const close=view==='character'||view==='grip',center=bounds.getCenter(new T.Vector3()),direction=new T.Vector3(close?.35:.62,close?.19:.4,1).normalize();
   const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right);
   const headingBox=header.getBoundingClientRect(),panelBox=panel.getBoundingClientRect();
   // Frame inside the actual unoccluded area, including the mobile panel. The
   // camera stays aimed at the real model center; an off-axis projection moves
   // that center into the available screen rectangle without tilting the model.
   const left=narrow?18:36,rightEdge=narrow?innerWidth-18:Math.max(innerWidth*.55,panelBox.left-28);
   const top=Math.min(headingBox.bottom+24,innerHeight*.3),bottom=narrow?Math.max(top+100,panelBox.top-22):innerHeight-52;
   const width=Math.max(100,rightEdge-left),height=Math.max(100,bottom-top);
   camera.fov=narrow?50:36;camera.aspect=innerWidth/innerHeight;camera.clearViewOffset();camera.updateProjectionMatrix();
   const tangent=Math.tan(T.MathUtils.degToRad(camera.fov/2)),horizontal=tangent*camera.aspect*width/innerWidth,vertical=tangent*height/innerHeight;
   let distance=view==='grip'?.4:1;
   for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
    const corner=new T.Vector3(x,y,z).sub(center),depth=corner.dot(direction);
    distance=Math.max(distance,depth+Math.abs(corner.dot(right))/horizontal*1.12,depth+Math.abs(corner.dot(up))/vertical*1.12);
   }
   controls.maxDistance=Math.max(80,distance*1.4);camera.far=Math.max(100,distance+60);
   // Pulling back for a tall viewport must not bury the review assets in fog.
   if(scene.fog instanceof T.Fog){scene.fog.near=Math.max(24,distance+8);scene.fog.far=scene.fog.near+40;}
   controls.minDistance=view==='grip'?.3:view==='character'?1.2:4;controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,distance);
   camera.setViewOffset(innerWidth,innerHeight,innerWidth/2-(left+width/2),innerHeight/2-(top+height/2),innerWidth,innerHeight);
   stage.dataset.view=view;controls.update();redraw();
  };
  setView(currentView);
  window.addEventListener('resize',()=>{if(!renderer)return;renderer.setSize(innerWidth,innerHeight);setView(currentView);},{signal:events.signal});
  // Track every completion separately: a late success after its peer fails must
  // be disposed even though Promise.all has already rejected.
  const load=(kind:UserModelKind):Promise<UserModel>=>loadUserModel(kind,base).then(model=>{
   if(disposed||failed){model.dispose();throw new Error('Model review is no longer active');}
   models.set(kind,model);return model;
  });
  const [character,house]=await Promise.all([load('character'),load('house')]);
  if(disposed||failed)return;
  house.root.position.set(2.3,0,-1.4);
  if(!staticOnly){
   rig=createUserCharacterRig(character);motion=new UserCharacterMotion(rig);clock=new CharacterSampleClock(1);
   rig.root.position.set(-2.8,0,1.5);rig.root.updateMatrixWorld(true);
   motion.sample(4.15);const contact=deriveUserChopContact(rig),height=contact.surfaceY-.013;
   if(height<=0)throw new Error('工作木桩接触面低于地面，无法构造');
   const stumpGeometry=new T.CylinderGeometry(.2,.25,height,18),stumpMaterial=new T.MeshToonMaterial({color:0x92704e});geometries.add(stumpGeometry);materials.add(stumpMaterial);
   const stump=new T.Mesh(stumpGeometry,stumpMaterial);stump.position.set(contact.center.x,height/2,contact.center.z);stump.castShadow=true;stump.receiveShadow=true;scene.add(stump);
   const cutGeometry=new T.CylinderGeometry(contact.radius,contact.radius,.014,24),cutMaterial=new T.MeshToonMaterial({color:0xd6b781});geometries.add(cutGeometry);materials.add(cutMaterial);
   // The visible top, not the cylinder center, is the measured contact plane.
   // A 1mm hidden overlap joins the grounded wood body to the cut disc.
   const cut=new T.Mesh(cutGeometry,cutMaterial);cut.position.set(contact.center.x,contact.surfaceY-.007,contact.center.z);cut.receiveShadow=true;scene.add(cut);
   // Sample the actual skinned geometry once for a stable camera that includes
   // the whole windup. Camera framing never follows the character every frame.
   for(let i=0;i<=71;i++){
    motion.sample(i/10);rig.root.updateMatrixWorld(true);
    // The unchanged static source remains hidden under root for ownership only;
    // Box3 still visits invisible objects, so frame just the rendered skin/tool.
    characterEnvelope.union(new T.Box3().setFromObject(rig.mesh,true));
    characterEnvelope.union(new T.Box3().setFromObject(rig.axe.mesh,true));
   }
   motion.sample(0);scene.add(rig.root);
   const pause=document.getElementById('motionPause') as HTMLButtonElement,slow=document.getElementById('motionSlow') as HTMLButtonElement,idle=document.getElementById('motionIdle') as HTMLButtonElement;
   pause.addEventListener('click',()=>{if(!clock)return;clock.paused=!clock.paused;pause.textContent=clock.paused?'继续':'暂停';last=0;redraw();},{signal:events.signal});
   slow.addEventListener('click',()=>{if(!clock)return;clock.rate=clock.rate===1?.5:1;slow.setAttribute('aria-pressed',String(clock.rate===.5));},{signal:events.signal});
   idle.addEventListener('click',()=>{if(!clock)return;clock.idleOnly=!clock.idleOnly;idle.setAttribute('aria-pressed',String(clock.idleOnly));redraw();},{signal:events.signal});
   document.getElementById('motionReplay')!.addEventListener('click',()=>{clock?.replay();pause.textContent='暂停';idle.setAttribute('aria-pressed','false');last=0;redraw();},{signal:events.signal});
   scrub?.addEventListener('input',()=>{if(!clock)return;clock.time=Number(scrub.value);clock.paused=true;clock.idleOnly=false;pause.textContent='继续';idle.setAttribute('aria-pressed','false');redraw();},{signal:events.signal});
   document.getElementById('modelGrip')!.addEventListener('click',()=>{
    if(!clock||!motion)return;clock.paused=true;pause.textContent='继续';last=0;
    motion.sample(clock.time,clock.idleOnly);setView('grip');
   },{signal:events.signal});
  }else{character.root.position.set(-2.8,0,1.5);scene.add(character.root);}
  scene.add(house.root);setView(currentView);
  stage.dataset.assets='ready';if(staticOnly)document.getElementById('motionPhase')!.textContent='固定姿势 · 造型与材质审阅';buttons.forEach(button=>button.disabled=false);if(scrub)scrub.disabled=false;
  document.getElementById('modelCharacter')!.addEventListener('click',()=>setView('character'),{signal:events.signal});
  document.getElementById('modelHouse')!.addEventListener('click',()=>setView('house'),{signal:events.signal});
  document.getElementById('modelTogether')!.addEventListener('click',()=>setView('full'),{signal:events.signal});redraw();
 }catch(error){if(!disposed&&!failed){console.error(error);fail();}}
}
void start();
