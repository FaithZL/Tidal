import {afterEach,expect,test,vi} from 'vitest';
import {createDemoConfig} from '../../src/config/demoConfig.js';
import {createLeniencyConfig} from '../../src/config/recognitionTolerance.js';
import {createSessionController} from '../../src/domain/sessionController.js';
import {UpperBodyPreparation} from '../../src/pose/upperBody.js';
import {UpperBodyRecognizer} from '../../src/pose/recognizers/upperBodyRecognizer.js';
import type {RecognitionEvent} from '../../src/pose/recognizers/types.js';
import type {PoseFrame} from '../../src/pose/types.js';
import {TutorialClock,upperBodyTutorialLessons} from '../../src/ui/exerciseTutorialModel.js';
import {MovementGuide} from '../../src/ui/movementGuide.js';
import {TutorialFigure} from '../../src/ui/tutorialFigure.js';

class SvgNode extends EventTarget {
  ownerDocument={createElementNS:(_ns:string,tag:string)=>new SvgNode(tag)};
  children:SvgNode[]=[];attributes=new Map<string,string>();textContent='';
  hidden=false;dataset:Record<string,string>={};nodes=new Map<string,SvgNode>();
  constructor(readonly tag:string){super();}
  setAttribute(name:string,value:string){this.attributes.set(name,value);}
  getAttribute(name:string){return this.attributes.get(name)??null;}
  append(...nodes:SvgNode[]){this.children.push(...nodes);}
  replaceChildren(...nodes:SvgNode[]){this.children=[...nodes];}
  querySelector(selector:string){return this.nodes.get(selector)??null;}
  remove(){}
}
afterEach(()=>vi.unstubAllGlobals());

const armJoints=['leftShoulder','rightShoulder','leftElbow','rightElbow','leftWrist','rightWrist'] as const;
type Pose='lowered'|'raised'|'hold';
type Renderer='tutorial'|'guide';

/** Authored illustration pixels become synthetic observations; no real camera/video is used. */
function observedSvg(svg:SvgNode,time:number):PoseFrame {
  const [, ,width,height]=svg.getAttribute('viewBox')!.split(' ').map(Number);
  const flatten=(node:SvgNode):SvgNode[]=>[node,...node.children.flatMap(flatten)];
  const nodes=flatten(svg);
  const landmarks=Array.from({length:33},(_,index)=>{
    const joint=armJoints[index-11];
    if(!joint)return {x:NaN,y:NaN,z:NaN,visibility:0,presence:0};
    const dot=nodes.find(node=>node.getAttribute('data-joint')===joint)!;
    return {x:Number(dot.getAttribute('cx'))/width,y:Number(dot.getAttribute('cy'))/height,z:0,visibility:.99,presence:.99};
  });
  return {frameId:time+1,capturedAtMs:time,width,height,landmarks,valid:true,inferenceMs:0};
}

function renderPose(renderer:Renderer,pose:Pose):PoseFrame {
  const svg=new SvgNode('svg');
  if(renderer==='tutorial'){
    const task=pose==='hold'?'carry':'chop',step=pose==='lowered'?0:1;
    const clock=new TutorialClock(task);clock.setUpperBodyEnabled(true);clock.selectStep(step);
    const figure=new TutorialFigure(svg as unknown as SVGSVGElement);
    figure.draw({...clock.frame,points:upperBodyTutorialLessons[task].steps[step].points},upperBodyTutorialLessons[task]);
    const frame=observedSvg(svg,0);figure.dispose();return frame;
  }
  vi.stubGlobal('document',Object.assign(new EventTarget(),{hidden:false,createElementNS:(_ns:string,tag:string)=>new SvgNode(tag)}));
  vi.stubGlobal('matchMedia',()=>Object.assign(new EventTarget(),{matches:false}));
  const root=new SvgNode('aside');root.nodes.set('svg',svg);
  for(const selector of ['[data-guide-task]','[data-guide-step]','[data-guide-note]'])root.nodes.set(selector,new SvgNode('span'));
  const controller=createSessionController(createDemoConfig(),{nowMs:()=>0});
  controller.command({kind:'open-setup',mode:'keyboard'});controller.command({kind:'setup-ready'});
  const guide=new MovementGuide(root as unknown as HTMLElement);guide.setUpperBodyEnabled(true);
  guide.sync({...controller.getSnapshot(),task:pose==='hold'?'carry':'chop'},true);
  if(pose==='raised')for(let now=0;now<=2800;now+=100)guide.update(now);
  const frame=observedSvg(svg,0);guide.dispose();controller.dispose();return frame;
}

function replay(renderer:Renderer,level:number){
  const frames={lowered:renderPose(renderer,'lowered'),raised:renderPose(renderer,'raised'),hold:renderPose(renderer,'hold')};
  let time=0;
  const frame=(pose:Pose):PoseFrame=>({...frames[pose],frameId:++time*50+1,capturedAtMs:time*50});
  const config=createLeniencyConfig(level),preparation=new UpperBodyPreparation(config,3000,true,2);
  for(const pose of ['lowered','raised'] as const)for(let i=0;i<26;i++){
    const sample=frame(pose);preparation.accept(sample,sample.capturedAtMs);
  }
  expect(preparation.getSnapshot()).toMatchObject({step:'complete',completedSteps:2,totalSteps:2,ready:true});
  const profile=preparation.getProfile()!;expect(profile.hold).toBeNull();
  const recognizer=new UpperBodyRecognizer(profile,'carry',config);
  const feed=(pose:Pose,count=20)=>{
    const events:RecognitionEvent[]=[];
    for(let i=0;i<count;i++)events.push(...recognizer.update(frame(pose)));
    expect(events.some(event=>event.kind==='tracking'&&event.status==='lost')).toBe(false);
    expect(events.at(-1)).toMatchObject({kind:'hold-sample',valid:true});
    return events;
  };
  return {recognizer,feed};
}

for(const renderer of ['tutorial','guide'] as const){
  test.each([1,2,3,4,5])(`${renderer} rendered front-hold pose starts carry after two-step preparation at leniency %s`,level=>{
    const r=replay(renderer,level);
    expect(r.feed('hold',10).at(-1)).toMatchObject({holding:false});
    expect(r.feed('hold',2).at(-1)).toMatchObject({holding:true});
    expect(r.recognizer.getFeedback()?.status).toBe('matched');
    expect(r.feed('lowered',1).at(-1)).toMatchObject({holding:false});
    expect(r.feed('hold',20).at(-1)).toMatchObject({holding:true});
    expect(r.feed('raised',1).at(-1)).toMatchObject({holding:false});
  });
  test.each([1,2,3,4,5])(`${renderer} illustrated released and raised poses never start carry at leniency %s`,level=>{
    for(const pose of ['lowered','raised'] as const){
      const r=replay(renderer,level);
      expect(r.feed(pose).some(event=>event.kind==='hold-sample'&&event.holding)).toBe(false);
    }
  });
}
