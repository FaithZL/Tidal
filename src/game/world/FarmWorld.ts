import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import type {DemoConfig} from '../../config/demoConfig.js';
import type {SessionController,SessionSnapshot} from '../../domain/types.js';
import {WorldChoreography} from './choreography.js';
import {WorldResources,place} from './resources.js';
import {Character3D,makeCart,makeLog,makePine} from './models.js';
import {buildEnvironment} from './environment.js';
import {AdaptiveResolution} from './adaptiveResolution.js';
import {NprPalette} from './nprMaterials.js';
import {NprCharacter3D,makeNprCart,makeNprLog,makeNprTree} from './nprModels.js';
import {buildNprSampleEnvironment} from './nprEnvironment.js';
import {loadUserModel} from './userModel.js';
import {UserHouseMount} from './userHouseMount.js';
import {UserStaticCharacter} from './userStaticCharacter.js';
import type {WorldActor} from './types.js';
export interface GameView{readonly ready?:Promise<void>;destroy(removeCanvas?:boolean):void;rotate(direction:number):void;resetView():void;focusCastle():void;setInteractionEnabled(enabled:boolean):void}
interface VisualActor{readonly root:T.Group;readonly visualRevision?:number;update(actor:WorldActor,chopping:boolean,deltaMs?:number):void;handPosition():T.Vector3}
/** Three owns rendering, never business progress. */
export class FarmWorld implements GameView{
 private readonly scene=new T.Scene();private readonly camera=new T.PerspectiveCamera(44,1,.1,220);
 private readonly renderer:T.WebGLRenderer;private readonly controls:OrbitControls;private readonly resources=new WorldResources();
 readonly ready?:Promise<void>;private palette?:NprPalette;private sampleBadge?:HTMLElement;private userHouse?:UserHouseMount;private userCastle?:UserHouseMount;private userCharacter?:UserStaticCharacter;
 private readonly sample=new URLSearchParams(location.search).get('art')==='npr-sample';
 private readonly choreography:WorldChoreography;private readonly player:VisualActor;private readonly npc:VisualActor;
 private readonly cart:ReturnType<typeof makeCart>;private readonly trees:ReturnType<typeof makePine>[]=[];private logs:T.Group[]=[];
 private chips:T.Mesh[]=[];private sun:T.DirectionalLight|null=null;
 private readonly resolution=new AdaptiveResolution(devicePixelRatio);private paintedLastFrame=false;
 private readonly resizeObserver:ResizeObserver;private readonly events=new AbortController();private subscriptions:(()=>void)[]=[];
 private snapshot:Readonly<SessionSnapshot>;private request=0;private lastTime=0;private lastPaint='';private lastPhase='home';private overview=true;private dirty=true;private disposed=false;private lost=false;
 constructor(private readonly parent:HTMLElement,controller:SessionController,config:Readonly<DemoConfig>,private readonly onError:(message:string)=>void){
  this.snapshot=controller.getSnapshot();this.choreography=new WorldChoreography(config);this.choreography.sync(this.snapshot);
  try{
  this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(this.resolution.ratio);parent.dataset.renderScale=String(this.resolution.ratio);this.renderer.outputColorSpace=T.SRGBColorSpace;
  this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.03;
  this.renderer.setClearColor(0xc5dce1);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.BasicShadowMap;
  this.renderer.domElement.setAttribute('aria-label','可旋转的三维农场，拖拽旋转、滚轮缩放');this.renderer.domElement.tabIndex=0;parent.appendChild(this.renderer.domElement);
  this.scene.background=new T.Color(0xc5dce1);this.scene.fog=new T.Fog(0xc5dce1,85,155);
  this.scene.add(new T.HemisphereLight(this.sample?0xe5f0f7:0xe0ecf4,this.sample?0x78936e:0x536b43,this.sample?1.6:1.1));
  const sun=place(this.scene,new T.DirectionalLight(0xffedd0,2),-18,35,14);sun.castShadow=true;sun.shadow.mapSize.set(512,512);
  this.sun=sun;
  sun.shadow.camera.left=-23;sun.shadow.camera.right=55;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;sun.shadow.camera.far=90;sun.shadow.bias=-.001;
  let sampleTextures:Promise<void>|undefined;
  if(this.sample){
   parent.dataset.assets='loading';
   sampleTextures=new Promise<void>((resolve,reject)=>{
    let pending=2,failed=false;
    const loaded=()=>{if(this.disposed||failed)return;if(--pending===0)resolve();};
    const failure=()=>{if(this.disposed||failed)return;failed=true;reject(new Error('美术样板贴图加载失败，请重新加载页面'));};
    const loader=new T.TextureLoader();
    const atlas=loader.load(`${import.meta.env.BASE_URL}assets/npr/pastoral-atlas-v1.png`,loaded,undefined,failure);
    const leaves=loader.load(`${import.meta.env.BASE_URL}assets/npr/leaf-bough-v2.png`,loaded,undefined,failure);
    this.palette=new NprPalette(this.resources,atlas,leaves);
   });
   this.renderer.setClearColor(0xb5d9e5);this.scene.background=new T.Color(0xb5d9e5);this.scene.fog=new T.Fog(0xc8dfe3,24,86);
   const skyGeometry=this.resources.geometry('npr-sky-dome',()=>{
    const geometry=new T.SphereGeometry(160,24,16),positions=geometry.getAttribute('position'),colors:number[]=[];
    const horizon=new T.Color(0xa9cfde),zenith=new T.Color(0x66aed7);
    for(let i=0;i<positions.count;i++){const color=horizon.clone().lerp(zenith,Math.sqrt(Math.max(0,positions.getY(i)/160)));colors.push(color.r,color.g,color.b);}
    geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));return geometry;
   });
   const sky=new T.Mesh(skyGeometry,this.resources.cachedMaterial('npr-sky',()=>new T.MeshBasicMaterial({side:T.BackSide,vertexColors:true,depthWrite:false,fog:false})));sky.renderOrder=-100;this.scene.add(sky);
   sun.color.set(0xfff3dd);sun.intensity=1.5;
   this.renderer.toneMappingExposure=.98;this.renderer.shadowMap.type=T.PCFShadowMap;
   sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-23;sun.shadow.camera.right=28;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;sun.shadow.normalBias=.025;
   this.sampleBadge=document.createElement('span');this.sampleBadge.className='npr-sample-label';parent.appendChild(this.sampleBadge);
  }
  this.scene.add(buildEnvironment(this.resources,this.sample?{excludeSampleZone:true}:undefined));
  parent.dataset.assets='loading';parent.dataset.castle='loading';
  this.userCastle=new UserHouseMount(this.scene,loadUserModel('castle',import.meta.env.BASE_URL),[-24,.025,-9]);
  if(this.palette){
   this.scene.add(buildNprSampleEnvironment(this.resources,this.palette,{omitCottage:true}));
   this.userHouse=new UserHouseMount(this.scene,loadUserModel('house',import.meta.env.BASE_URL));
  }
  const prototype=new URLSearchParams(location.search).get('model')==='prototype';
  if(this.palette&&!prototype){
   this.userCharacter=new UserStaticCharacter(loadUserModel('character',import.meta.env.BASE_URL));this.player=this.userCharacter;
  }else this.player=this.palette?new NprCharacter3D(this.resources,this.palette):new Character3D(this.resources);
  if(this.palette){
   const comparison=document.createElement('a');comparison.href=`${import.meta.env.BASE_URL}?art=npr-sample${prototype?'':'&model=prototype'}`;comparison.textContent=prototype?'查看导入人物':'原动作对照';
   this.sampleBadge!.append(prototype?'原动作人物对照 · 导入房屋 ':'用户人物/房屋 · 人物为无骨骼静态姿态 ',comparison);
  }
  this.ready=Promise.all([this.userCastle.ready,sampleTextures,this.userHouse?.ready,this.userCharacter?.ready]).then(()=>{
    if(this.disposed||this.lost)throw new Error('User scenery loading cancelled');
    const castle=this.scene.getObjectByName('user-castle-model');if(!castle)throw new Error('用户城堡模型加载失败：场景对象缺失');
    let triangles=0;castle.traverse(object=>{if(object instanceof T.Mesh)triangles+=(object.geometry.index?.count??object.geometry.getAttribute('position').count)/3;});
    parent.dataset.castle='user-fbx';parent.dataset.castleTriangles=String(triangles);parent.dataset.castlePosition=castle.position.toArray().map(value=>value.toFixed(3)).join(',');
    parent.dataset.assets='ready';this.dirty=true;
    if(this.palette){parent.dataset.house='user-fbx';parent.dataset.character=this.userCharacter?'user-fbx-static':'procedural-motion';}
   }).catch((error:unknown)=>{
    if(!this.disposed&&!this.lost){
     parent.dataset.assets='failed';parent.dataset.castle='failed';this.userCastle?.dispose();this.userHouse?.dispose();this.userCharacter?.dispose();
     const message=error instanceof Error&&/美术样板贴图加载失败|用户人物模型加载失败|用户城堡模型加载失败/.test(error.message)?error.message:'用户房屋模型加载失败，请检查本地模型与贴图后重新加载页面';
     this.reportError(message);
    }
    throw error;
   });
  this.npc=this.palette?new NprCharacter3D(this.resources,this.palette,true):new Character3D(this.resources,true);this.scene.add(this.player.root,this.npc.root);
  this.npc.root.scale.setScalar(.88);this.cart=this.palette?makeNprCart(this.resources,this.palette):makeCart(this.resources);this.scene.add(this.cart.root);
  for(let i=0;i<config.treeCount;i++){const tree=this.palette?makeNprTree(this.resources,this.palette):makePine(this.resources);this.trees.push(tree);this.scene.add(tree.root);}
  for(let i=0;i<8;i++){const chip=this.resources.box(.07,.1,.045,0xe4b66e);chip.visible=false;this.scene.add(chip);this.chips.push(chip);}
  this.camera.position.set(43,42,57);this.controls=new OrbitControls(this.camera,this.renderer.domElement);
  this.controls.target.set(14,0,0);if(this.sample){this.camera.position.set(8,5.5,12);this.controls.target.set(-2.5,1.2,-5);}
  this.controls.enableDamping=true;this.controls.dampingFactor=.12;this.controls.minDistance=this.sample?5:7;this.controls.maxDistance=85;
  this.controls.minPolarAngle=.3;this.controls.maxPolarAngle=Math.PI/2-.1;this.controls.enablePan=false;this.controls.update();
  this.controls.saveState();
  this.controls.addEventListener('change',()=>{this.dirty=true;});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(parent);this.resize();
  this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;this.controls.enabled=false;this.userCastle?.dispose();this.userHouse?.dispose();this.userCharacter?.dispose();this.parent.dataset.assets='failed';this.reportError('3D图形上下文已丢失，请重新加载页面后继续');},{signal:this.events.signal});
  this.subscriptions.push(controller.subscribe(s=>{this.snapshot=s;this.choreography.sync(s);}));
  this.subscriptions.push(controller.onEffect(e=>{
   this.snapshot=controller.getSnapshot();this.choreography.sync(this.snapshot);this.choreography.apply(e);
   // Reset effects precede snapshot subscriptions, so clear presentation state here explicitly.
   if(e.kind==='session-reset'){const f=this.choreography.frame;this.player.update(f.player,false);this.npc.update(f.npc,false);this.choreography.setHandAnchor(this.player.handPosition());}
   this.dirty=true;
  }));
  parent.dataset.renderer=`Three.js r${T.REVISION}`;parent.dataset.art=this.sample?'tidal-npr-sample-v2':'tidal-farm-3d-v2';
  const gl=this.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');parent.dataset.gpu=debug?String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)):'WebGL2 renderer unavailable';
  this.request=requestAnimationFrame(this.animate);
  }catch(error){this.destroy(true);throw error;}
 }
 private reportError(message:string):void{
  this.parent.dataset.error=message;
  let error=this.parent.querySelector<HTMLElement>('#renderError');
  if(!error){error=document.createElement('div');error.id='renderError';error.setAttribute('role','alert');this.parent.appendChild(error);}
  error.textContent=message;this.onError(message);
 }
 private resize():void{const width=this.parent.clientWidth,height=this.parent.clientHeight;if(!width||!height)return;this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);if(this.parent.dataset.view==='castle')this.focusCastle();this.dirty=true;}
 private animate=(now:number):void=>{
  if(this.disposed)return;this.request=requestAnimationFrame(this.animate);
  if(this.lost||document.hidden){this.lastTime=0;this.paintedLastFrame=false;this.resolution.observe(0,false);return;}
  const elapsed=this.lastTime?now-this.lastTime:0;
  const ratio=this.resolution.observe(elapsed,this.paintedLastFrame&&!this.snapshot.pauseReasons.length);this.paintedLastFrame=false;
  if(ratio!==this.renderer.getPixelRatio()){this.renderer.setPixelRatio(ratio);this.parent.dataset.renderScale=String(ratio);this.dirty=true;}
  const delta=Math.min(100,elapsed);this.lastTime=now;this.choreography.advance(delta);
  let f=this.choreography.frame;const motionDelta=this.snapshot.pauseReasons.length||elapsed>100?0:delta;
  const playerRevision=this.player.visualRevision,npcRevision=this.npc.visualRevision;
  this.player.update(f.player,this.snapshot.task==='chop',motionDelta);this.npc.update(f.npc,false,motionDelta);
  if(this.player.visualRevision!==playerRevision||this.npc.visualRevision!==npcRevision){
   this.dirty=true;if(this.sample)this.parent.dataset.motionRevision=String(this.player.visualRevision??0);
  }
  this.choreography.setHandAnchor(this.player.handPosition());f=this.choreography.frame;
  const state=this.snapshot,home=state.phase==='home'||state.phase==='setup';
  const phase=home?'home':`${state.task}`;
  if(this.lastPhase!==phase){
   if(this.parent.dataset.view==='castle'){this.parent.dataset.view='farm';this.setCastleFog(true);}
   this.lastPhase=phase;this.overview=home;const offset=this.camera.position.clone().sub(this.controls.target);
   this.controls.target.set(home?(this.sample?-2.5:14):state.task==='carry'?f.cart.x:f.player.position.x,home?(this.sample?1.2:0):1,home?(this.sample?-5:0):state.task==='carry'?f.cart.z:f.player.position.z);
   if(home){if(this.sample)this.camera.position.set(8,5.5,12);else this.camera.position.set(43,42,57);}else this.camera.position.copy(this.controls.target).add(offset.setLength(state.task==='carry'?13:state.task==='load'?11:12));this.dirty=true;
  }
  if(!home&&!this.overview&&!state.pauseReasons.length){const target=new T.Vector3(state.task==='carry'?f.cart.x:f.player.position.x,1,state.task==='carry'?f.cart.z:f.player.position.z);const shift=target.sub(this.controls.target).multiplyScalar(.09);if(shift.length()>.002){this.controls.target.add(shift);this.camera.position.add(shift);this.dirty=true;}}
  this.controls.update();
  const paint=JSON.stringify(f);if(paint!==this.lastPaint){
   this.lastPaint=paint;this.dirty=true;this.cart.root.position.set(f.cart.x,f.cart.y,f.cart.z);
   for(const wheel of this.cart.wheels)wheel.rotation.z=-f.cart.x/.35;
   for(let i=0;i<this.cart.ropes.length;i++)this.cart.ropes[i].visible=f.ropeProgress>(i/this.cart.ropes.length);
   f.trees.forEach((t,i)=>{
    const tree=this.trees[i];tree.root.position.set(t.position.x,t.position.y,t.position.z);tree.trunk.visible=!t.felled;
    tree.crown.visible=!t.felled||t.fallProgress<.8;tree.crown.rotation.z=t.felled?-Math.PI/2*t.fallProgress:0;
    tree.crown.scale.setScalar(t.felled?1-t.fallProgress*.5:1);
   });
   while(this.logs.length<f.logs.length){const log=this.palette?makeNprLog(this.resources,this.palette):makeLog(this.resources);this.scene.add(log);this.logs.push(log);}
   this.logs.forEach((log,i)=>{const item=f.logs[i];log.visible=!!item;if(!item)return;const p=item.position;log.position.set(p.x,p.y,p.z);log.rotation.set(item.rotation,item.location==='hand'?f.player.yaw:Math.PI/2,0);});
   const hit=f.effects.find(e=>e.kind==='impact'&&e.index>=0),hitTree=hit?f.trees[hit.index]:null;
   this.chips.forEach((chip,i)=>{chip.visible=!!hitTree;if(!hit||!hitTree)return;const a=i*Math.PI/4,t=hit.progress;chip.position.set(hitTree.position.x+Math.cos(a)*t*1.1,1.1+Math.sin(t*Math.PI)*.55-t*.5,hitTree.position.z+Math.sin(a)*t*1.1);chip.rotation.set(t*4,a,t*5);chip.scale.setScalar(1-t*.7);});
   this.parent.dataset.particles=hitTree?'8':'0';
   const values={action:f.action,fallen:String(state.choppedTrees),effects:f.effects.map(e=>e.kind).join(','),npc:state.phase==='rest'?(state.task==='load'?'gather':'secure'):state.phase==='results'?'celebrate':state.task==='carry'?'guide':'idle',inventory:`${state.groundLogs}/${state.cartLogs}/${state.deliveredLogs}`,cartPosition:`${f.cart.x.toFixed(3)},${f.cart.z.toFixed(3)}`,worldLogs:String(f.logs.length),rope:f.ropeProgress.toFixed(3),playerMode:f.player.mode};
   for(const[key,value]of Object.entries(values))if(this.parent.dataset[key]!==value)this.parent.dataset[key]=value;
   this.parent.setAttribute('aria-label',`可旋转三维农场。地面${state.groundLogs}、车上${state.cartLogs}、到家${state.deliveredLogs}。${state.pauseReasons.length?'已暂停':''}`);
  }
  if(this.dirty){
   this.renderer.render(this.scene,this.camera);this.dirty=false;this.paintedLastFrame=true;
   if(this.sample)this.parent.dataset.hand=this.player.handPosition().toArray().map(n=>n.toFixed(4)).join(',');
   this.parent.dataset.camera=this.camera.position.toArray().map(n=>n.toFixed(3)).join(',');
   const projected=new T.Vector3(-6,1,1).project(this.camera);this.parent.dataset.probe=projected.toArray().map(n=>n.toFixed(4)).join(',');
  }
 };
 rotate(direction:number):void{if(!this.controls.enabled||this.disposed)return;const offset=this.camera.position.clone().sub(this.controls.target);offset.applyAxisAngle(new T.Vector3(0,1,0),direction*.25);this.camera.position.copy(this.controls.target).add(offset);this.controls.update();this.dirty=true;}
 private setCastleFog(enabled:boolean):void{
  this.scene.getObjectByName('user-castle-model')?.traverse(object=>{if(object instanceof T.Mesh){
   for(const material of Array.isArray(object.material)?object.material:[object.material])if(material instanceof T.MeshToonMaterial&&material.fog!==enabled){material.fog=enabled;material.needsUpdate=true;}
  }});
 }
 resetView():void{if(this.disposed)return;this.overview=true;this.setCastleFog(true);this.controls.reset();this.parent.dataset.view='farm';this.dirty=true;}
 focusCastle():void{
  if(this.disposed||this.lost||!this.controls.enabled)return;
  const model=this.scene.getObjectByName('user-castle-model');if(!model)return;
  // Portrait framing backs the camera away; keep the inspected model readable
  // rather than letting the local NPR fog erase its untextured silhouette.
  this.setCastleFog(false);
  const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3()),radius=bounds.getSize(new T.Vector3()).length()*.5;
  const halfFov=Math.atan(Math.tan(T.MathUtils.degToRad(this.camera.fov*.5))*Math.min(1,this.camera.aspect));
  const distance=Math.min(this.controls.maxDistance,radius/Math.sin(halfFov)*1.15);
  this.overview=true;this.controls.target.copy(center);this.camera.position.copy(center).add(new T.Vector3(.8,.5,1).normalize().multiplyScalar(distance));this.controls.update();this.parent.dataset.view='castle';this.dirty=true;
 }
 setInteractionEnabled(enabled:boolean):void{this.controls.enabled=enabled&&!this.lost&&!this.disposed;}
 destroy(removeCanvas=true):void{
  if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.request);this.events.abort();this.resizeObserver?.disconnect();this.subscriptions.forEach(stop=>stop());
  this.controls?.dispose();this.choreography.dispose();this.userCastle?.dispose();this.userHouse?.dispose();this.userCharacter?.dispose();this.scene.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});this.sun?.shadow.dispose();this.scene.clear();this.resources.dispose();this.renderer?.dispose();this.renderer?.forceContextLoss();
  if(removeCanvas)this.renderer?.domElement.remove();this.sampleBadge?.remove();this.logs=[];this.chips=[];this.parent.dataset.disposed='true';
 }
}
