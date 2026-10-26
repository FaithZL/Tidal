import type {SessionSnapshot} from '../domain/types.js';
import type {TutorialJoint} from './exerciseTutorialModel.js';
import {tutorialLessons} from './exerciseTutorialModel.js';
import {MovementGuideClock} from './movementGuideClock.js';
import {setAttribute,setProperty} from './domUpdates.js';

const ns='http://www.w3.org/2000/svg';
const links:readonly (readonly [TutorialJoint,TutorialJoint])[]=[
 ['head','neck'],['neck','leftShoulder'],['leftShoulder','leftElbow'],['leftElbow','leftWrist'],
 ['neck','rightShoulder'],['rightShoulder','rightElbow'],['rightElbow','rightWrist'],
 ['leftShoulder','leftHip'],['rightShoulder','rightHip'],['leftHip','rightHip'],
 ['leftHip','leftKnee'],['leftKnee','leftAnkle'],['rightHip','rightKnee'],['rightKnee','rightAnkle'],
];

/** Authored standard poses only: no camera, recognizer or training write access. */
export class MovementGuide {
 private readonly clock=new MovementGuideClock();
 private readonly events=new AbortController();
 private readonly reduced=matchMedia('(prefers-reduced-motion: reduce)');
 private readonly svg:SVGSVGElement;
 private readonly taskLabel:HTMLElement;
 private readonly stepLabel:HTMLElement;
 private readonly note:HTMLElement;
 private readonly bones:SVGLineElement[]=[];
 private readonly joints=new Map<TutorialJoint,SVGCircleElement>();
 private readonly head=document.createElementNS(ns,'circle');
 private context='';
 private playing=false;
 private lastTime:number|null=null;
 private disposed=false;
 private poseKey='';

 constructor(private readonly root:HTMLElement){
  this.svg=root.querySelector('svg')!;
  this.taskLabel=root.querySelector('[data-guide-task]')!;
  this.stepLabel=root.querySelector('[data-guide-step]')!;
  this.note=root.querySelector('[data-guide-note]')!;
  this.svg.setAttribute('viewBox','0 0 224 260');
  const grid=document.createElementNS(ns,'path');let path='';
  for(let x=0;x<=224;x+=22.4)path+=`M${x} 0V260`;
  for(let y=0;y<=260;y+=26)path+=`M0 ${y}H224`;
  grid.setAttribute('d',path);grid.setAttribute('stroke','#28504c');grid.setAttribute('stroke-width','1');
  this.svg.append(grid);
  for(let i=0;i<links.length;i++){
   const line=document.createElementNS(ns,'line');line.setAttribute('stroke','#8bdcb1');line.setAttribute('stroke-width','4');line.setAttribute('stroke-linecap','round');this.svg.append(line);this.bones.push(line);
  }
  this.head.setAttribute('r','10');this.head.setAttribute('stroke','#8bdcb1');this.head.setAttribute('stroke-width','3');this.head.setAttribute('fill','none');this.svg.append(this.head);
  for(const joint of Object.keys(this.clock.frame.points) as TutorialJoint[]){
   const dot=document.createElementNS(ns,'circle');dot.setAttribute('data-joint',joint);dot.setAttribute('r','3.4');dot.setAttribute('fill','#efd28f');this.svg.append(dot);this.joints.set(joint,dot);
  }
  document.addEventListener('visibilitychange',()=>{this.lastTime=null;},{signal:this.events.signal});
  this.reduced.addEventListener('change',()=>{
   this.lastTime=null;
   if(this.reduced.matches){this.clock.reset(this.clock.frame.task);this.poseKey='';if(!this.root.hidden)this.paint();}
   if(this.playing)setProperty(this.note,'textContent',this.reduced.matches?'关键姿态 · 详细步骤见动作教学':'动作示意 · 按个人标定范围跟做');
  },{signal:this.events.signal});
 }

 sync(s:Readonly<SessionSnapshot>,enabled:boolean):void{
  if(this.disposed)return;
  const visible=enabled&&s.task!==null&&['countdown','active','rest'].includes(s.phase);
  setProperty(this.root,'hidden',!visible);
  const context=`${s.sessionId}/${s.taskRunId}/${s.sourceEpoch}/${s.task}`;
  if(context!==this.context){this.context=context;this.clock.reset(s.task??'chop');this.lastTime=null;this.poseKey='';}
  const playing=visible&&!s.pauseReasons.length;
  if(playing!==this.playing){this.playing=playing;this.lastTime=null;}
  setProperty(this.taskLabel,'textContent',`${s.phase==='rest'?'下一项 · ':''}${tutorialLessons[s.task??'chop'].title}`);
  setProperty(this.note,'textContent',s.pauseReasons.length?'示范已暂停':this.reduced.matches?'关键姿态 · 详细步骤见动作教学':'动作示意 · 按个人标定范围跟做');
  if(visible)this.paint();
 }

 update(now:number):void{
  if(this.disposed)return;
  if(!this.playing||this.root.hidden||document.hidden||this.reduced.matches||!Number.isFinite(now)){this.lastTime=null;return;}
  const delta=this.lastTime===null?0:now-this.lastTime;this.lastTime=now;
  this.clock.advance(delta);this.paint();
 }

 private paint():void{
  const frame=this.clock.frame;
  setProperty(this.root.dataset,'task',frame.task);setProperty(this.root.dataset,'step',String(frame.stepIndex));
  setProperty(this.root.dataset,'timeMs',String(frame.elapsedMs));
  setProperty(this.stepLabel,'textContent',frame.title);
  const poseKey=JSON.stringify(frame.points);if(poseKey===this.poseKey)return;this.poseKey=poseKey;
  const x=(joint:TutorialJoint)=>String(12+frame.points[joint].x*200),y=(joint:TutorialJoint)=>String(8+frame.points[joint].y*244);
  for(let i=0;i<links.length;i++){
   const [a,b]=links[i],line=this.bones[i];
   setAttribute(line,'x1',x(a));setAttribute(line,'y1',y(a));setAttribute(line,'x2',x(b));setAttribute(line,'y2',y(b));
  }
  for(const [joint,dot] of this.joints){setAttribute(dot,'cx',x(joint));setAttribute(dot,'cy',y(joint));}
  setAttribute(this.head,'cx',x('head'));setAttribute(this.head,'cy',y('head'));
  setAttribute(this.svg,'aria-label',`${tutorialLessons[frame.task].title}标准动作骨骼示范`);
 }

 dispose():void{if(this.disposed)return;this.disposed=true;this.events.abort();this.root.hidden=true;this.svg.replaceChildren();this.joints.clear();this.bones.length=0;}
}
