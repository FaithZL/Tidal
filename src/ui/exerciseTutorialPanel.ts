import type {TaskKind} from '../domain/types.js';
import {TutorialClock,tutorialLessons,upperBodyTutorialLessons} from './exerciseTutorialModel.js';
import {TutorialFigure} from './tutorialFigure.js';

interface TutorialHooks{onOpen():void;onClose():HTMLElement|undefined}
/** A local teaching player. Its only session boundary is the caller's pause hook. */
export class ExerciseTutorialPanel{
 private readonly clock=new TutorialClock();private readonly figure:TutorialFigure;
 private readonly events=new AbortController();private readonly background=new Map<HTMLElement,boolean>();
 private origin?:HTMLElement;private request=0;private lastTime:number|null=null;private lastStep='';private lastFrame='';private suspended=false;private disposed=false;
 private upperBody=false;
 constructor(private readonly root:HTMLElement,private readonly hooks:TutorialHooks){
  this.figure=new TutorialFigure(this.node<SVGSVGElement>('tutorialFigure'));
  const options={signal:this.events.signal};
  this.node('tutorialClose').addEventListener('click',()=>this.close(),options);
  this.node('tutorialPlay').addEventListener('click',()=>{
   if(this.suspended)return;
   if(this.clock.frame.playing)this.clock.pause();else{this.clock.play();if(!this.clock.frame.playing)this.clock.replay();}this.render();
  },options);
  this.node('tutorialReplay').addEventListener('click',()=>{if(this.suspended)return;this.clock.replay();this.lastTime=null;this.render();},options);
  for(const [id,direction] of [['tutorialPrev',-1],['tutorialNext',1]] as const)this.node(id).addEventListener('click',()=>{this.clock.selectStep(this.clock.frame.stepIndex+direction);this.render();},options);
  this.node<HTMLSelectElement>('tutorialSpeed').addEventListener('change',()=>{
   const value=this.node<HTMLSelectElement>('tutorialSpeed').value;this.clock.setSpeed(value==='0.25'?.25:value==='0.5'?.5:1);this.render();
  },options);
  for(const button of Array.from(this.root.querySelectorAll<HTMLButtonElement>('#tutorialTabs button')))button.addEventListener('click',()=>{
   const task=button.dataset.task;if(task==='chop'||task==='load'||task==='carry')this.setTask(task);
  },options);
  this.node('tutorialStepList').addEventListener('click',event=>{
   const target=event.target;if(!(target instanceof Element))return;const button=target.closest<HTMLButtonElement>('button[data-step]');
   if(button){this.clock.selectStep(Number(button.dataset.step));this.render();}
  },options);
  root.addEventListener('keydown',event=>this.keydown(event),options);
  root.addEventListener('click',event=>{if(event.target===root)this.close();},options);
  document.addEventListener('visibilitychange',()=>{this.lastTime=null;},options);
 }
 get isOpen():boolean{return !this.root.hidden;}
 private get lessons(){return this.upperBody?upperBodyTutorialLessons:tutorialLessons;}
 setUpperBodyEnabled(enabled:boolean):void{
  if(this.disposed||this.upperBody===enabled)return;
  this.upperBody=enabled;this.clock.setUpperBodyEnabled(enabled);this.lastTime=null;this.lastStep='';this.lastFrame='';
  this.root.dataset.program=enabled?'upper-body':'full-body';
  if(this.isOpen)this.populateLesson();
 }
 setSuspended(suspended:boolean):void{
  if(this.disposed||typeof suspended!=='boolean'||this.suspended===suspended)return;
  this.suspended=suspended;this.lastTime=null;if(this.isOpen)this.render();
 }
 open(task:TaskKind='chop',duringTraining=false):void{
  if(this.disposed||this.isOpen)return;
  this.origin=document.activeElement instanceof HTMLElement?document.activeElement:undefined;
  this.root.hidden=false;
  for(const sibling of Array.from(document.body.children))if(sibling instanceof HTMLElement&&sibling!==this.root){this.background.set(sibling,sibling.inert);sibling.inert=true;}
  this.node('tutorialSessionNote').textContent=duringTraining?'训练已暂停。关闭教学后点击“继续”；若标定失效，请按原提示重新准备。':'教学不计训练成果，关闭后返回原页面。开始摄像头训练前仍需完成标定。';
  this.setTask(task);this.hooks.onOpen();this.node<HTMLButtonElement>('tutorialClose').focus();
  this.lastTime=null;this.request=requestAnimationFrame(this.animate);
 }
 close():void{
  if(!this.isOpen)return;
  this.root.hidden=true;this.clock.pause();cancelAnimationFrame(this.request);this.request=0;this.lastTime=null;
  for(const [element,inert] of this.background)element.inert=inert;this.background.clear();
  const destination=this.hooks.onClose()??this.origin;
  if(destination?.isConnected&&!destination.inert&&!destination.closest('[inert]')&&destination.getClientRects().length&&!(destination instanceof HTMLButtonElement&&destination.disabled))destination.focus();
 }
 private setTask(task:TaskKind):void{
  this.clock.setTask(task);if(matchMedia('(prefers-reduced-motion: reduce)').matches)this.clock.selectStep(0);
  this.lastTime=null;this.lastStep='';this.lastFrame='';
  this.populateLesson();
 }
 private populateLesson():void{
  const task=this.clock.frame.task,lesson=this.lessons[task];this.node('tutorialSummary').textContent=lesson.summary;
  const steps=lesson.steps.map((step,index)=>{const item=document.createElement('li'),button=document.createElement('button');button.type='button';button.dataset.step=String(index);button.textContent=step.title;item.append(button);return item;});
  this.node('tutorialStepList').replaceChildren(...steps);
  for(const button of Array.from(this.root.querySelectorAll<HTMLButtonElement>('#tutorialTabs button')))button.setAttribute('aria-pressed',String(button.dataset.task===task));
  this.render();
 }
 private animate=(now:number):void=>{
  if(this.disposed||!this.isOpen)return;
  if(document.hidden||this.suspended)this.lastTime=null;
  else{if(this.lastTime!==null)this.clock.advance(now-this.lastTime);this.lastTime=now;}
  this.render();
  this.request=requestAnimationFrame(this.animate);
 };
 private render():void{
  const frame=this.clock.frame,playing=frame.playing&&!this.suspended,key=`${frame.task}/${frame.stepIndex}/${frame.stepProgress}/${frame.elapsedMs}/${frame.playing}/${frame.speed}/${this.suspended}`;
  if(key===this.lastFrame)return;this.lastFrame=key;
  const lesson=this.lessons[frame.task],step=lesson.steps[frame.stepIndex],stepKey=`${frame.task}/${frame.stepIndex}`;
  this.root.dataset.task=frame.task;this.root.dataset.timeMs=frame.elapsedMs.toFixed(2);this.root.dataset.playing=String(playing);
  this.root.dataset.speed=String(frame.speed);this.root.dataset.step=String(frame.stepIndex);
  this.node<HTMLButtonElement>('tutorialPlay').textContent=playing?'暂停示范':'播放示范';
  this.node<HTMLButtonElement>('tutorialPlay').disabled=this.suspended;this.node<HTMLButtonElement>('tutorialReplay').disabled=this.suspended;
  this.node<HTMLButtonElement>('tutorialPrev').disabled=frame.stepIndex===0;this.node<HTMLButtonElement>('tutorialNext').disabled=frame.stepIndex===lesson.steps.length-1;
  this.node<HTMLSelectElement>('tutorialSpeed').value=String(frame.speed);this.node<HTMLProgressElement>('tutorialProgress').value=frame.elapsedMs/frame.totalMs;
  if(stepKey!==this.lastStep){
   this.lastStep=stepKey;this.node('tutorialStepCount').textContent=`第 ${frame.stepIndex+1} / ${lesson.steps.length} 步`;
   this.node('tutorialStepTitle').textContent=step.title;this.node('tutorialCue').textContent=step.cue;
   this.node('tutorialTips').replaceChildren(...step.tips.map(tip=>{const item=document.createElement('li');item.textContent=tip;return item;}));
   for(const button of Array.from(this.root.querySelectorAll<HTMLButtonElement>('#tutorialStepList button'))){if(Number(button.dataset.step)===frame.stepIndex)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');}
  }
  this.figure.draw(frame,lesson);
 }
 private keydown(event:KeyboardEvent):void{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.close();return;}
  if(event.key!=='Tab')return;
  const focusable=Array.from(this.root.querySelectorAll<HTMLElement>('button:not(:disabled),select,[tabindex="0"]')).filter(node=>node.getClientRects().length>0);
  const first=focusable[0],last=focusable.at(-1);if(!first||!last)return;
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
 private node<T extends Element=HTMLElement>(id:string):T{
  const node=this.root.querySelector<T>(`#${id}`);if(!node)throw new Error(`Missing tutorial element ${id}`);return node;
 }
 dispose():void{if(this.disposed)return;this.close();this.disposed=true;this.events.abort();this.figure.dispose();}
}
