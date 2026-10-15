import { expect,test } from 'vitest';
import { CarryRecognizer } from '../../src/pose/recognizers/carryRecognizer.js';
import { PoseReplay,syntheticProfile } from '../helpers/recognizerReplay.js';
import { syntheticFrame,replacePoint } from '../helpers/syntheticPose.js';
test('hold requires 500ms continuous observations; release is immediate and reentry is fresh',()=>{
  const r=new CarryRecognizer(syntheticProfile()),p=new PoseReplay(r);p.pose('hold',500);
  expect(p.events.some(e=>e.kind==='hold-sample'&&e.holding)).toBe(false);
  p.pose('hold',100);expect(p.events.at(-1)).toMatchObject({kind:'hold-sample',holding:true,valid:true});
  p.pose('standing',50);expect(p.events.at(-1)).toMatchObject({kind:'hold-sample',holding:false,valid:true});
  p.pose('hold',400);expect(p.events.at(-1)).toMatchObject({holding:false});
});
test('identical or insufficiently separated prototypes cannot enable hold',()=>{
  const p=syntheticProfile();p.examples['carry-release']=p.examples['carry-hold'];
  expect(()=>new CarryRecognizer(p)).toThrow();
});
test.each(['missing','gap','duplicate','reset','future','stale'] as const)('holding exits on %s and does not bridge history',kind=>{
  const r=new CarryRecognizer(syntheticProfile()),p=new PoseReplay(r);p.pose('hold',800);
  expect(p.events.at(-1)).toMatchObject({holding:true});
  let frame=syntheticFrame(p.time+50,'hold'),now=frame.capturedAtMs;
  if(kind==='missing')frame=replacePoint(frame,16,{visibility:.1});
  if(kind==='gap'){frame=syntheticFrame(p.time+300,'hold');now=frame.capturedAtMs;}
  if(kind==='duplicate')frame=syntheticFrame(p.time,'hold');
  if(kind==='reset')r.reset();
  if(kind==='future')now-=100;
  if(kind==='stale')now+=301;
  const result=r.update(frame,now);expect(result.some(e=>e.kind==='hold-sample'&&e.holding)).toBe(false);
});
test('alternating hold/release cannot accumulate the confirmation window',()=>{
  const p=new PoseReplay(new CarryRecognizer(syntheticProfile()));
  for(let i=0;i<50;i++)p.pose(i%2?'hold':'standing',100);
  expect(p.events.some(e=>e.kind==='hold-sample'&&e.holding)).toBe(false);
});
test('hysteresis keeps an established hold in the middle band but cannot enter from that band',()=>{
  const warm=new CarryRecognizer(syntheticProfile()),cold=new CarryRecognizer(syntheticProfile());new PoseReplay(warm).pose('hold',800);
  for(let t=850;t<=1800;t+=50){
    const hold=syntheticFrame(t,'hold'),release=syntheticFrame(t,'standing');
    const middle={...hold,landmarks:hold.landmarks.map((p,i)=>({...p,x:p.x+.45*(release.landmarks[i].x-p.x),y:p.y+.45*(release.landmarks[i].y-p.y)}))};
    expect(warm.update(middle).at(-1)).toMatchObject({holding:true});
    expect(cold.update(middle).at(-1)).toMatchObject({holding:false});
  }
});
