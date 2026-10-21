import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import type {DemoConfig} from '../../config/demoConfig.js';
import type {SessionController,SessionSnapshot} from '../../domain/types.js';
import {WorldChoreography} from './choreography.js';
import {WorldResources,place} from './resources.js';
import {Character3D,makeCart,makeLog,makePine} from './models.js';
import {buildEnvironment} from './environment.js';
import {AdaptiveResolution} from './adaptiveResolution.js';
export interface GameView{destroy(removeCanvas?:boolean):void;rotate(direction:number):void;resetView():void;setInteractionEnabled(enabled:boolean):void}
/** Three owns rendering, never business progress. */
export class FarmWorld implements GameView{
 private readonly scene=new T.Scene();private readonly camera=new T.PerspectiveCamera(44,1,.1,220);
 private readonly renderer:T.WebGLRenderer;private readonly controls:OrbitControls;private readonly resources=new WorldResources();
 private readonly choreography:WorldChoreography;private readonly player:Character3D;private readonly npc:Character3D;
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
  this.scene.add(new T.HemisphereLight(0xe0ecf4,0x536b43,1.1));
  const sun=place(this.scene,new T.DirectionalLight(0xffedd0,2),-18,35,14);sun.castShadow=true;sun.shadow.mapSize.set(512,512);
  this.sun=sun;
  sun.shadow.camera.left=-23;sun.shadow.camera.right=55;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;sun.shadow.camera.far=90;sun.shadow.bias=-.001;
  this.scene.add(buildEnvironment(this.resources));
  this.player=new Character3D(this.resources);this.npc=new Character3D(this.resources,true);this.scene.add(this.player.root,this.npc.root);
  this.npc.root.scale.setScalar(.88);this.cart=makeCart(this.resources);this.scene.add(this.cart.root);
  for(let i=0;i<config.treeCount;i++){const tree=makePine(this.resources);this.trees.push(tree);this.scene.add(tree.root);}
  for(let i=0;i<8;i++){const chip=this.resources.box(.07,.1,.045,0xe4b66e);chip.visible=false;this.scene.add(chip);this.chips.push(chip);}
  this.camera.position.set(43,42,57);this.controls=new OrbitControls(this.camera,this.renderer.domElement);
  this.controls.target.set(14,0,0);this.controls.enableDamping=true;this.controls.dampingFactor=.12;this.controls.minDistance=7;this.controls.maxDistance=85;
  this.controls.minPolarAngle=.3;this.controls.maxPolarAngle=Math.PI/2-.1;this.controls.enablePan=false;this.controls.update();
  this.controls.saveState();
  this.controls.addEventListener('change',()=>{this.dirty=true;});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(parent);this.resize();
  this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;this.controls.enabled=false;this.reportError('3D图形上下文已丢失，请重新加载页面后继续');},{signal:this.events.signal});
  this.subscriptions.push(controller.subscribe(s=>{this.snapshot=s;this.choreography.sync(s);}));
  this.subscriptions.push(controller.onEffect(e=>{this.snapshot=controller.getSnapshot();this.choreography.sync(this.snapshot);this.choreography.apply(e);this.dirty=true;}));
  parent.dataset.renderer=`Three.js r${T.REVISION}`;parent.dataset.art='tidal-farm-3d-v2';
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
 private resize():void{const width=this.parent.clientWidth,height=this.parent.clientHeight;if(!width||!height)return;this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);this.dirty=true;}
 private animate=(now:number):void=>{
  if(this.disposed)return;this.request=requestAnimationFrame(this.animate);
  if(this.lost||document.hidden){this.lastTime=0;this.paintedLastFrame=false;this.resolution.observe(0,false);return;}
  const elapsed=this.lastTime?now-this.lastTime:0;
  const ratio=this.resolution.observe(elapsed,this.paintedLastFrame&&!this.snapshot.pauseReasons.length);this.paintedLastFrame=false;
  if(ratio!==this.renderer.getPixelRatio()){this.renderer.setPixelRatio(ratio);this.parent.dataset.renderScale=String(ratio);this.dirty=true;}
  const delta=Math.min(100,elapsed);this.lastTime=now;this.choreography.advance(delta);
  let f=this.choreography.frame;this.player.update(f.player,this.snapshot.task==='chop');this.choreography.setHandAnchor(this.player.handPosition());f=this.choreography.frame;
  const state=this.snapshot,home=state.phase==='home'||state.phase==='setup';
  const phase=home?'home':`${state.task}`;
  if(this.lastPhase!==phase){
   this.lastPhase=phase;this.overview=home;const offset=this.camera.position.clone().sub(this.controls.target);
   this.controls.target.set(home?14:state.task==='carry'?f.cart.x:f.player.position.x,home?0:1,home?0:state.task==='carry'?f.cart.z:f.player.position.z);
   if(home)this.camera.position.set(43,42,57);else this.camera.position.copy(this.controls.target).add(offset.setLength(state.task==='carry'?13:state.task==='load'?11:12));this.dirty=true;
  }
  if(!home&&!this.overview&&!state.pauseReasons.length){const target=new T.Vector3(state.task==='carry'?f.cart.x:f.player.position.x,1,state.task==='carry'?f.cart.z:f.player.position.z);const shift=target.sub(this.controls.target).multiplyScalar(.09);if(shift.length()>.002){this.controls.target.add(shift);this.camera.position.add(shift);this.dirty=true;}}
  this.controls.update();
  const paint=JSON.stringify(f);if(paint!==this.lastPaint){
   this.lastPaint=paint;this.dirty=true;this.npc.update(f.npc,false);this.cart.root.position.set(f.cart.x,f.cart.y,f.cart.z);
   for(const wheel of this.cart.wheels)wheel.rotation.z=-f.cart.x/.35;
   for(let i=0;i<this.cart.ropes.length;i++)this.cart.ropes[i].visible=f.ropeProgress>(i/this.cart.ropes.length);
   f.trees.forEach((t,i)=>{
    const tree=this.trees[i];tree.root.position.set(t.position.x,t.position.y,t.position.z);tree.trunk.visible=!t.felled;
    tree.crown.visible=!t.felled||t.fallProgress<.8;tree.crown.rotation.z=t.felled?-Math.PI/2*t.fallProgress:0;
    tree.crown.scale.setScalar(t.felled?1-t.fallProgress*.5:1);
   });
   while(this.logs.length<f.logs.length){const log=makeLog(this.resources);this.scene.add(log);this.logs.push(log);}
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
   this.parent.dataset.camera=this.camera.position.toArray().map(n=>n.toFixed(3)).join(',');
   const projected=new T.Vector3(-6,1,1).project(this.camera);this.parent.dataset.probe=projected.toArray().map(n=>n.toFixed(4)).join(',');
  }
 };
 rotate(direction:number):void{if(!this.controls.enabled||this.disposed)return;const offset=this.camera.position.clone().sub(this.controls.target);offset.applyAxisAngle(new T.Vector3(0,1,0),direction*.25);this.camera.position.copy(this.controls.target).add(offset);this.controls.update();this.dirty=true;}
 resetView():void{if(this.disposed)return;this.overview=true;this.controls.reset();this.dirty=true;}
 setInteractionEnabled(enabled:boolean):void{this.controls.enabled=enabled&&!this.lost&&!this.disposed;}
 destroy(removeCanvas=true):void{
  if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.request);this.events.abort();this.resizeObserver?.disconnect();this.subscriptions.forEach(stop=>stop());
  this.controls?.dispose();this.choreography.dispose();this.scene.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});this.sun?.shadow.dispose();this.scene.clear();this.resources.dispose();this.renderer?.dispose();this.renderer?.forceContextLoss();
  if(removeCanvas)this.renderer?.domElement.remove();this.logs=[];this.chips=[];this.parent.dataset.disposed='true';
 }
}
