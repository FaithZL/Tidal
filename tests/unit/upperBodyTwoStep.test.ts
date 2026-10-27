import {expect,test} from 'vitest';
import {UpperBodyPreparation,type UpperBodyProfile} from '../../src/pose/upperBody.js';
import {UpperBodyRecognizer} from '../../src/pose/recognizers/upperBodyRecognizer.js';
import {CameraActionSource} from '../../src/input/cameraActionSource.js';
import {createLeniencyConfig} from '../../src/config/recognitionTolerance.js';
import {upperFrame,upperProfile,type UpperPose} from '../helpers/upperBodyPose.js';
import type {PoseFrame} from '../../src/pose/types.js';
import type {RecognitionEvent} from '../../src/pose/recognizers/types.js';

function observe(p:UpperBodyPreparation,pose:UpperPose,start=0,duration=1200){
 for(let time=start;time<=start+duration;time+=100)p.accept(upperFrame(time,pose),time);
 return start+duration+100;
}
function prepared(){
 const preparation=new UpperBodyPreparation(undefined,3000,true,2);
 const time=observe(preparation,'lowered');const next=observe(preparation,'raised',time);
 return {preparation,time:next};
}
const profile=():UpperBodyProfile=>({...upperProfile(),hold:null});

/** Authored front-view observations with an independently selected projected elbow angle. */
function front(time:number,left=.5,right=left,angle=110,lateral=.05):PoseFrame{
 const frame=upperFrame(time,'hold'),p=profile();
 for(const [side,index,sign] of [['left',11,-1],['right',12,1]] as const){
  const q=side==='left'?left:right,shoulder={x:frame.landmarks[index].x*640,y:frame.landmarks[index].y*480};
  const wrist={x:shoulder.x+sign*lateral*180,y:shoulder.y+(p.lowered[side].y-q*(p.lowered[side].y-p.raised[side].y))*180};
  const dx=wrist.x-shoulder.x,dy=wrist.y-shoulder.y,length=Math.hypot(dx,dy);
  const height=length/(2*Math.tan(angle*Math.PI/360));
  const elbow={x:(shoulder.x+wrist.x)/2-sign*dy/length*height,y:(shoulder.y+wrist.y)/2+sign*dx/length*height};
  Object.assign(frame.landmarks[index+2],{x:elbow.x/640,y:elbow.y/480});
  Object.assign(frame.landmarks[index+4],{x:wrist.x/640,y:wrist.y/480});
 }
 return frame;
}
function feed(r:UpperBodyRecognizer,make:(time:number)=>PoseFrame,start=0,end=800):RecognitionEvent[]{
 const events:RecognitionEvent[]=[];
 for(let time=start;time<=end;time+=50)events.push(...r.update(make(time),time));
 return events;
}
function frontHeight(time:number,left=.15,right=left,angle=110,lateral=.05):PoseFrame{
 return front(time,(170/180-left)/(290/180),(170/180-right)/(290/180),angle,lateral);
}
function lowerCameraFrame(frame:PoseFrame):PoseFrame{
 for(const point of frame.landmarks)point.y+=130/480;
 return frame;
}

test('two-step preparation completes from observed lowered and raised samples without a hold target',()=>{
 const p=new UpperBodyPreparation(undefined,3000,true,2);
 expect(p.getSnapshot()).toMatchObject({totalSteps:2,completedSteps:0});
 const next=observe(p,'lowered');expect(p.getSnapshot()).toMatchObject({step:'raised',completedSteps:1,ready:false});
 observe(p,'lowered',next);expect(p.getProfile()).toBeNull();
 observe(p,'raised',next+1300);expect(p.getSnapshot()).toMatchObject({step:'complete',completedSteps:2,totalSteps:2,ready:true});
 const saved=p.getProfile()!;expect(saved.hold).toBeNull();expect(p.getDiagnostics().hold).toBeNull();
 for(const side of ['left','right'] as const){
  expect(saved.lowered[side].y).toBeCloseTo(170/180,12);expect(saved.raised[side].y).toBeCloseTo(-120/180,12);
  expect(saved.lowered[side].elbowDeg).toBeCloseTo(180,12);expect(saved.raised[side].elbowDeg).toBeCloseTo(180,12);
 }
 saved.lowered.left.y=999;expect(p.getProfile()!.lowered.left.y).not.toBe(999);
 expect(p.startTraining()).toBe(true);expect(p.getSnapshot().training).toBe(true);
});

test('both stable arms and the original sample window remain required before two-step completion',()=>{
 const p=new UpperBodyPreparation(undefined,3000,true,2);let time=observe(p,'lowered');
 for(let at=time;at<time+1500;at+=100){
  const mixed=upperFrame(at,'raised'),lower=upperFrame(at,'lowered');
  for(const index of [12,14,16])mixed.landmarks[index]=lower.landmarks[index];
  p.accept(mixed,at);
 }
 expect(p.getSnapshot()).toMatchObject({step:'raised',completedSteps:1,ready:false});time+=1500;
 observe(p,'raised',time,1100);expect(p.getProfile()).toBeNull();
 p.accept(upperFrame(time+1200,'raised'),time+1200);expect(p.getSnapshot().ready).toBe(true);
});

test.each(['low','gap','moved','resized','hidden'] as const)('completed two-step training preserves 2/2 on %s and explicit reset reports 2/2',fault=>{
 const {preparation:p,time}=prepared();expect(p.startTraining()).toBe(true);const saved=p.getSavedProfile();
 const frame=upperFrame(time,'lowered');let now=time;
 if(fault==='low')frame.landmarks[16].visibility=.1;
 if(fault==='moved')for(const point of frame.landmarks)point.x+=.3;
 if(fault==='resized')frame.width*=2;
 if(fault==='gap'){frame.capturedAtMs+=201;frame.frameId+=201;now+=201;}
 if(fault==='hidden')p.suspendTracking('page-hidden');else p.accept(frame,now);
 expect(p.getSnapshot()).toMatchObject({step:'complete',totalSteps:2,completedSteps:2,ready:false,training:true});
 expect(p.getSavedProfile()).toEqual(saved);expect(p.getProfile()).toBeNull();
 p.accept(upperFrame(now+100,'lowered'),now+100);expect(p.getProfile()).toEqual(saved);
 p.reset('camera-stop');expect(p.getSnapshot()).toMatchObject({completedSteps:0,totalSteps:2,training:false});
 expect(p.getDiagnostics().lastReset).toMatchObject({completedSteps:2,fromStep:'complete',reason:'camera-stop'});
});

test('the default legacy preparation still requires a real third sample',()=>{
 const p=new UpperBodyPreparation(undefined,3000,true);const time=observe(p,'lowered');observe(p,'raised',time);
 expect(p.getSnapshot()).toMatchObject({step:'hold',totalSteps:3,completedSteps:2,ready:false});
});

test('a two-step profile validates every camera task without inventing a third personal posture',()=>{
 const {preparation}=prepared(),source=new CameraActionSource(()=>0);
 expect(preparation.getProfile()).not.toBeNull();expect(()=>source.setUpperBodyProfile(preparation.getProfile()!)).not.toThrow();
});

test.each(['chop','load'] as const)('two-step %s still needs a complete lowered-raised-lowered loop',task=>{
 const r=new UpperBodyRecognizer(profile(),task);const events=feed(r,t=>upperFrame(t,'lowered'));
 events.push(...feed(r,t=>upperFrame(t,'raised'),850,2050));expect(events.filter(e=>e.kind==='rep-completed')).toHaveLength(0);
 events.push(...feed(r,t=>upperFrame(t,'lowered'),2100,2900));expect(events.filter(e=>e.kind==='rep-completed')).toHaveLength(1);
 expect(events.filter(e=>e.kind==='impact')).toHaveLength(1);
});

test('standard front hold confirms both observed arms and releases immediately without using smooth history',()=>{
 const r=new UpperBodyRecognizer(profile(),'carry');
 expect(feed(r,front,0,450).at(-1)).toMatchObject({holding:false,valid:true});
 expect(r.update(front(500)).at(-1)).toMatchObject({holding:true,valid:true});expect(r.getFeedback()?.status).toBe('matched');
 expect(r.update(front(550,0,.5)).at(-1)).toMatchObject({holding:false,valid:true});
 expect(r.getFeedback()?.joints[15]).toBe('adjust');expect(r.getFeedback()?.joints[16]).toBe('matched');
 expect(feed(r,front,600,1000).at(-1)).toMatchObject({holding:false,valid:true});
});

test.each(['lowered','raised','one-arm','straight','sideways'] as const)('standard front hold cannot start from %s observations',bad=>{
 const r=new UpperBodyRecognizer(profile(),'carry');
 const events=feed(r,t=>bad==='lowered'||bad==='raised'?upperFrame(t,bad):bad==='one-arm'?front(t,.5,0):bad==='straight'?front(t,.5,.5,175):front(t,.5,.5,110,1));
 expect(events.filter(e=>e.kind==='hold-sample'&&e.holding)).toHaveLength(0);
 expect(events.some(e=>e.kind==='tracking'&&e.status==='lost')).toBe(false);
});

test.each([1,2,3,4,5])('standard front hold uses level %s entry and exit bands without accepting endpoints',level=>{
 const config=createLeniencyConfig(level),warm=new UpperBodyRecognizer(profile(),'carry',config),cold=new UpperBodyRecognizer(profile(),'carry',config);
 expect(feed(warm,front).at(-1)).toMatchObject({holding:true});
 const drift=.15+(config.holdEnterRatio+config.holdExitRatio)/2;
 expect(feed(warm,t=>frontHeight(t,drift),850,1800).at(-1)).toMatchObject({holding:true});
 expect(feed(cold,t=>frontHeight(t,drift),850,1800).at(-1)).toMatchObject({holding:false});
 expect(warm.update(upperFrame(1850,'raised')).at(-1)).toMatchObject({holding:false});
});

test.each(['left','right','both'] as const)('front hold stays at shoulder/chest height with an asymmetric %s calibration range',side=>{
 const preparation=new UpperBodyPreparation(undefined,3000,true,2);
 for(const [start,low] of [[0,true],[1300,false]] as const)for(let time=start;time<=start+1200;time+=100){
  const y=(arm:'left'|'right')=>side==='both'||side===arm?low?.30:-1.40:low?170/180:-120/180;
  preparation.accept(lowerCameraFrame(frontHeight(time,y('left'),y('right'),180)),time);
 }
 expect(preparation.getSnapshot()).toMatchObject({step:'complete',ready:true});
 const r=new UpperBodyRecognizer(preparation.getProfile()!,'carry');
 const events=feed(r,t=>lowerCameraFrame(frontHeight(t,.10)));
 expect(events.some(e=>e.kind==='tracking'&&e.status==='lost')).toBe(false);
 expect(events.at(-1)).toMatchObject({holding:true,valid:true});
});

test.each(['lowered','raised'] as const)('standard shoulder band still rejects the sampled %s pose when its elbows are already bent',endpoint=>{
 const p=profile();
 for(const [side,sign] of [['left',-1],['right',1]] as const){
  p.lowered[side]={x:sign*.05,y:.3,elbowDeg:110};p.raised[side]={x:sign*.05,y:-.1,elbowDeg:110};
 }
 const r=new UpperBodyRecognizer(p,'carry'),y=endpoint==='lowered'?.3:-.1;
 const events=feed(r,t=>frontHeight(t,y));
 expect(events.some(e=>e.kind==='tracking'&&e.status==='lost')).toBe(false);
 expect(events.filter(e=>e.kind==='hold-sample'&&e.holding)).toHaveLength(0);
});

test.each(['low','gap','stale','duplicate'] as const)('standard front hold %s loss cannot bridge confirmation',fault=>{
 const r=new UpperBodyRecognizer(profile(),'carry');expect(feed(r,front).at(-1)).toMatchObject({holding:true});
 let time=fault==='duplicate'?800:fault==='gap'?1100:850;const frame=front(time);let now=time;
 if(fault==='low')frame.landmarks[15].visibility=.1;if(fault==='stale')now+=301;
 expect(r.update(frame,now)).toContainEqual(expect.objectContaining({kind:'hold-sample',holding:false,valid:false}));
 time=now+50;
 if(fault==='stale'){
  expect(r.update(front(time))).toContainEqual(expect.objectContaining({kind:'tracking',status:'lost',message:'gap'}));time+=50;
 }
 expect(feed(r,front,time,time+450).at(-1)).toMatchObject({holding:false});
 expect(r.update(front(time+500)).at(-1)).toMatchObject({holding:true});
});

test.each(['missing-hold','bad-lowered','insufficient-range','invalid-reference'] as const)('two-step profiles still reject %s before training',fault=>{
 const p=profile();
 if(fault==='missing-hold')Reflect.deleteProperty(p,'hold');
 if(fault==='bad-lowered')p.lowered.left.y=NaN;
 if(fault==='insufficient-range')p.raised.right.y=p.lowered.right.y;
 if(fault==='invalid-reference')p.reference.width=0;
 expect(()=>new UpperBodyRecognizer(p,'carry')).toThrow();
});
