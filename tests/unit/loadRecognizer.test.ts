import { expect, test } from 'vitest';
import { LoadRecognizer } from '../../src/pose/recognizers/loadRecognizer.js';
import { PoseReplay, syntheticProfile } from '../helpers/recognizerReplay.js';
import { syntheticFrame, replacePoint } from '../helpers/syntheticPose.js';
import { createRecognitionConfig } from '../../src/config/recognitionConfig.js';
test.each([false,true])('load completes with continuous stand/press=%s, ordered phases and single impact', continuous => {
  const p = new PoseReplay(new LoadRecognizer(syntheticProfile()));
  p.pose('standing').pose('squat');if (!continuous) p.pose('standing');p.pose('press').pose('standing',600);
  expect(p.reps).toHaveLength(1);
  const events=p.events.filter(e=>'repId' in e && e.repId===p.reps[0].repId);
  expect(events.filter(e=>e.kind==='phase').map(e=>e.phase)).toEqual(['ready','squat-down','stand-up','press-up','load-return']);
  expect(events.filter(e=>e.kind==='impact')).toHaveLength(1);
  expect(events.findIndex(e=>e.kind==='impact')).toBeLessThan(events.findIndex(e=>e.kind==='rep-completed'));
});
test.each(['only-squat','only-press','no-return','timeout','invalid','gap','jitter'] as const)('load rejects %s',kind=>{
  const r=new LoadRecognizer(syntheticProfile()),p=new PoseReplay(r);p.pose('standing');
  if(kind==='only-squat')p.pose('squat').pose('standing',2000);
  else if(kind==='only-press')p.pose('press').pose('standing',2000);
  else if(kind==='jitter'){for(let i=0;i<20;i++)p.pose(i%2?'standing':'squat',50);p.pose('press').pose('standing');}
  else{
    p.pose('squat');
    if(kind==='timeout')p.pose('squat',11000);
    if(kind==='invalid'){p.time+=50;r.update(replacePoint(syntheticFrame(p.time,'squat'),26,{visibility:.1}));}
    if(kind==='gap')p.time+=300;
    p.pose('press');if(kind!=='no-return')p.pose('standing',600);
  }
  expect(p.reps).toHaveLength(0);
});
test('load refuses missing example calibration',()=>{
  expect(()=>new LoadRecognizer({...syntheticProfile(),examples:{}})).toThrow();
});
test('one overhead frame exactly when standing confirms is not a confirmed press',()=>{
  const p=new PoseReplay(new LoadRecognizer(syntheticProfile(),createRecognitionConfig({smoothingTauMs:.001})));
  p.pose('standing').pose('squat').pose('standing',150).pose('press',50).pose('standing',1200);
  expect(p.events.filter(e=>e.kind==='impact')).toHaveLength(0);expect(p.reps).toHaveLength(0);
});
