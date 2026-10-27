import {afterEach,expect,test,vi} from 'vitest';
import * as model from '../../src/ui/exerciseTutorialModel.js';
import {MovementGuideClock} from '../../src/ui/movementGuideClock.js';
import {ExerciseTutorialPanel} from '../../src/ui/exerciseTutorialPanel.js';
import {MovementGuide} from '../../src/ui/movementGuide.js';
import {TutorialFigure} from '../../src/ui/tutorialFigure.js';
import type {TutorialLesson,TutorialJoint} from '../../src/ui/exerciseTutorialModel.js';
import type {TaskKind} from '../../src/domain/types.js';
import {createSessionController} from '../../src/domain/sessionController.js';
import {createDemoConfig} from '../../src/config/demoConfig.js';

// No external reference motion: these assertions cover the authored demonstration contract.
const upper=()=>{
 const lessons=(model as unknown as {upperBodyTutorialLessons?:Record<TaskKind,TutorialLesson>}).upperBodyTutorialLessons;
 expect(lessons,'upper-body lessons must be available without replacing original lessons').toBeDefined();return lessons!;
};
const setUpper=(clock:unknown,value:boolean)=>{
 const player=clock as {setUpperBodyEnabled?:(enabled:boolean)=>void};expect(typeof player.setUpperBodyEnabled).toBe('function');player.setUpperBodyEnabled!(value);
};
function advance(clock:{advance(delta:number):void},time:number){while(time>0){const delta=Math.min(time,200);clock.advance(delta);time-=delta;}}
const legs:TutorialJoint[]=['leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle'];

test('upper-body lessons use visible shoulders, elbows and wrists while all lower-body points stay neutral',()=>{
 const lessons=upper(),neutral=model.tutorialLessons.chop.steps[0].points;
 expect(Object.keys(lessons).sort()).toEqual(['carry','chop','load']);
 for(const lesson of Object.values(lessons)){
  expect(lesson.summary).toContain('上半身');
  for(const step of lesson.steps){
   for(const joint of legs)expect(step.points[joint]).toEqual(neutral[joint]);
   expect(step.highlight.every(joint=>/Shoulder|Elbow|Wrist/.test(joint))).toBe(true);
   for(const p of Object.values(step.points)){expect(Number.isFinite(p.x)&&Number.isFinite(p.y)).toBe(true);expect(p.x).toBeGreaterThan(0);expect(p.x).toBeLessThan(1);expect(p.y).toBeGreaterThan(0);expect(p.y).toBeLessThan(1);}
  }
 }
});

test.each(['chop','load'] as const)('%s upper-body demonstration raises both arms and fully returns without a squat',task=>{
 const [down,up,reset]=upper()[task].steps;expect(upper()[task].steps).toHaveLength(3);
 expect(reset.points).toEqual(down.points);
 for(const side of ['left','right'] as const){const wrist=`${side}Wrist` as const,shoulder=`${side}Shoulder` as const;expect(up.points[wrist].y).toBeLessThan(up.points[shoulder].y);expect(down.points[wrist].y-up.points[wrist].y).toBeGreaterThan(.3);}
 expect(upper()[task].summary).toContain('完整');
});

test('upper-body carry holds both arms in front and lowers them to demonstrate stopping',()=>{
 const [ready,hold,released]=upper().carry.steps;expect(ready.points).toEqual(hold.points);
 for(const side of ['left','right'] as const){const wrist=`${side}Wrist` as const;expect(released.points[wrist].y-hold.points[wrist].y).toBeGreaterThan(.15);}
 expect(released.cue).toContain('停止');
});

test('switching tutorial programs preserves task, pause and speed while resetting the old lesson position',()=>{
 const clock=new model.TutorialClock('load');clock.play();clock.setSpeed(.25);advance(clock,1800);clock.pause();
 setUpper(clock,true);expect(clock.frame).toMatchObject({task:'load',elapsedMs:0,playing:false,speed:.25});expect(clock.frame.points).toEqual(upper().load.steps[0].points);
 clock.advance(200);expect(clock.frame.elapsedMs).toBe(0);clock.play();clock.advance(200);expect(clock.frame.elapsedMs).toBe(50);
 const active=clock.frame;setUpper(clock,true);expect(clock.frame).toEqual(active);
 setUpper(clock,false);expect(clock.frame).toMatchObject({task:'load',elapsedMs:0,playing:true,speed:.25});expect(clock.frame.totalMs).toBe(7600);
});

test('upper-body tutorial selection and long gaps retain the existing local playback guards',()=>{
 const clock=new model.TutorialClock('chop');setUpper(clock,true);clock.selectStep(1);expect(clock.frame.points).toEqual(upper().chop.steps[1].points);expect(clock.frame.playing).toBe(false);
 clock.play();clock.advance(200);const observed=clock.frame;clock.advance(5000);expect(clock.frame).toEqual(observed);clock.advance(100);expect(clock.frame.elapsedMs).toBe(observed.elapsedMs+100);
 clock.setTask('carry');expect(clock.frame).toMatchObject({task:'carry',stepIndex:0,elapsedMs:0,playing:true});expect(clock.frame.totalMs).toBe(upper().carry.steps.reduce((sum,step)=>sum+step.durationMs,0));
});

test.each(['chop','load'] as const)('upper-body guide cycles %s down, up and return with stationary legs',task=>{
 const clock=new MovementGuideClock(task);setUpper(clock,true);const lesson=upper()[task];
 expect(clock.frame).toMatchObject({task,stepIndex:0,elapsedMs:0});
 advance(clock,lesson.steps[0].durationMs+lesson.steps[1].durationMs*.75);expect(clock.frame.points).toEqual(lesson.steps[1].points);
 advance(clock,lesson.steps[1].durationMs*.25+lesson.steps[2].durationMs*.75);expect(clock.frame.points).toEqual(lesson.steps[2].points);
 advance(clock,lesson.steps[2].durationMs*.25);expect(clock.frame).toMatchObject({stepIndex:0,elapsedMs:0});expect(clock.frame.points).toEqual(lesson.steps[0].points);
});

test('upper-body guide keeps the carry target stable and switching back restores the original full-body cycle',()=>{
 const clock=new MovementGuideClock('carry');setUpper(clock,true);
 for(let i=0;i<20;i++){expect(clock.frame.points).toEqual(upper().carry.steps[1].points);clock.advance(200);}
 clock.reset('load');setUpper(clock,false);expect(clock.frame.totalMs).toBe(7600);expect(clock.frame.points).toEqual(model.tutorialLessons.load.steps[4].points);
});

test('both visual players expose the upper-body program without introducing a new session writer',()=>{
 expect(typeof (ExerciseTutorialPanel.prototype as unknown as {setUpperBodyEnabled?:unknown}).setUpperBodyEnabled).toBe('function');
 expect(typeof (MovementGuide.prototype as unknown as {setUpperBodyEnabled?:unknown}).setUpperBodyEnabled).toBe('function');
});

class Node extends EventTarget {
 ownerDocument={createElementNS:(_ns:string,tag:string)=>new Node(tag)};
 children:Node[]=[];attributes=new Map<string,string>();textContent='';
 hidden=false;disabled=false;inert=false;isConnected=true;value:unknown='';dataset:Record<string,string>={};
 nodes=new Map<string,Node>();groups=new Map<string,Node[]>();
 constructor(readonly tag:string){super();}
 setAttribute(name:string,value:string){this.attributes.set(name,value);}
 getAttribute(name:string){return this.attributes.get(name)??null;}
 removeAttribute(name:string){this.attributes.delete(name);}
 append(...nodes:Node[]){this.children.push(...nodes);}
 replaceChildren(...nodes:Node[]){this.children=[...nodes];}
 querySelector(selector:string){return this.nodes.get(selector)??null;}
 querySelectorAll(selector:string){return this.groups.get(selector)??[];}
 getClientRects(){return [{}];}
 closest(){return null;}
 focus(){}
 remove(){}
}
function documentFixture(){
 const events=new EventTarget(),media=Object.assign(new EventTarget(),{matches:false});
 vi.stubGlobal('document',Object.assign(events,{createElementNS:(_ns:string,tag:string)=>new Node(tag),createElement:(tag:string)=>new Node(tag),body:{children:[]},activeElement:null,hidden:false}));
 vi.stubGlobal('HTMLElement',Node);vi.stubGlobal('Element',Node);vi.stubGlobal('HTMLButtonElement',Node);
 vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{});vi.stubGlobal('matchMedia',()=>media);
}
afterEach(()=>vi.unstubAllGlobals());
test('the SVG accessible description uses the active upper-body cue instead of the old squat instructions',()=>{
 const svg=new Node('svg'),figure=new TutorialFigure(svg as unknown as SVGSVGElement);const clock=new model.TutorialClock('load');setUpper(clock,true);clock.selectStep(1);
 const lesson=upper().load;(figure.draw as (frame:model.TutorialFrame,lesson?:TutorialLesson)=>void).call(figure,clock.frame,lesson);
 expect(svg.children.find(node=>node.tag==='title')!.textContent).toContain(lesson.steps[1].title);
 expect(svg.children.find(node=>node.tag==='desc')!.textContent).toContain(lesson.steps[1].cue);
 expect(svg.children.find(node=>node.tag==='desc')!.textContent).not.toContain('站起后');figure.dispose();
});

test('tutorial program switching displays the new steps while the unified stop remains effective',()=>{
 documentFixture();const root=new Node('div');root.hidden=true;
 for(const id of ['tutorialFigure','tutorialClose','tutorialPlay','tutorialReplay','tutorialPrev','tutorialNext','tutorialSpeed','tutorialStepList','tutorialSessionNote','tutorialSummary','tutorialProgress','tutorialStepCount','tutorialStepTitle','tutorialCue','tutorialTips'])root.nodes.set(`#${id}`,new Node(id==='tutorialFigure'?'svg':'button'));
 const opened=vi.fn(),panel=new ExerciseTutorialPanel(root as unknown as HTMLElement,{onOpen:opened,onClose:()=>undefined});panel.setUpperBodyEnabled(true);panel.open('load');
 expect(opened).toHaveBeenCalledOnce();expect(root.nodes.get('#tutorialSummary')!.textContent).toContain('上半身');expect(root.nodes.get('#tutorialStepList')!.children).toHaveLength(3);
 const animate=(now:number)=>(panel as unknown as {animate(now:number):void}).animate(now);animate(100);animate(200);expect(root.dataset.timeMs).toBe('100.00');
 panel.setSuspended(true);animate(400);animate(1000);expect(root.dataset.timeMs).toBe('100.00');expect(root.dataset.playing).toBe('false');
 root.nodes.get('#tutorialPlay')!.dispatchEvent(new Event('click'));root.nodes.get('#tutorialReplay')!.dispatchEvent(new Event('click'));expect(root.dataset.timeMs).toBe('100.00');
 panel.setUpperBodyEnabled(false);expect(root.nodes.get('#tutorialStepList')!.children).toHaveLength(5);expect(root.nodes.get('#tutorialPlay')!.disabled).toBe(true);expect(root.dataset.playing).toBe('false');
 panel.setUpperBodyEnabled(true);expect(root.nodes.get('#tutorialStepList')!.children).toHaveLength(3);panel.setSuspended(false);animate(5000);expect(root.dataset.timeMs).toBe('0.00');animate(5100);expect(root.dataset.timeMs).toBe('100.00');panel.dispose();
});

test('the visible upper-body guide keeps legs fixed and obeys authoritative pause without writing outcomes',()=>{
 documentFixture();const root=new Node('aside');root.hidden=true;
 for(const selector of ['svg','[data-guide-task]','[data-guide-step]','[data-guide-note]'])root.nodes.set(selector,new Node(selector==='svg'?'svg':'span'));
 const controller=createSessionController(createDemoConfig(),{nowMs:()=>0}),guide=new MovementGuide(root as unknown as HTMLElement);controller.command({kind:'open-setup',mode:'keyboard'});controller.command({kind:'setup-ready'});
 guide.setUpperBodyEnabled(true);guide.sync(controller.getSnapshot(),true);expect(root.nodes.get('[data-guide-task]')!.textContent).toContain('上半身');
 const svg=root.nodes.get('svg')!,knee=svg.children.find(node=>node.attributes.get('data-joint')==='rightKnee')!,initialKnee=knee.attributes.get('cy');
 guide.update(100);for(let now=200;now<=2900;now+=100)guide.update(now);expect(root.dataset.step).toBe('1');expect(knee.attributes.get('cy')).toBe(initialKnee);
 controller.command({kind:'pause',reason:'user'});guide.sync(controller.getSnapshot(),true);const paused=root.dataset.timeMs;guide.update(4000);guide.update(4100);expect(root.dataset.timeMs).toBe(paused);expect(root.nodes.get('[data-guide-note]')!.textContent).toBe('示范已暂停');
 expect(controller.getSnapshot()).toMatchObject({chopReps:0,loadReps:0,carryActiveMs:0,rewardsGranted:false});guide.dispose();controller.dispose();
});
