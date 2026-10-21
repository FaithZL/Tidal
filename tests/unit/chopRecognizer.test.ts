import { expect, test } from 'vitest';
import { ChopRecognizer } from '../../src/pose/recognizers/chopRecognizer.js';
import { PoseReplay, syntheticProfile } from '../helpers/recognizerReplay.js';
import { replacePoint, syntheticFrame } from '../helpers/syntheticPose.js';
test('three full chop cycles emit ordered phases, one impact and one rep each', () => {
  const p = new PoseReplay(new ChopRecognizer(syntheticProfile()));
  for (let i = 0; i < 3; i++) p.pose('raised').pose('down').pose('raised');
  expect(p.reps).toHaveLength(3);
  for (const rep of p.reps) {
    const events = p.events.filter(e => 'repId' in e && e.repId === rep.repId);
    expect(events.filter(e => e.kind === 'phase').map(e => e.phase)).toEqual(['ready', 'chop-down', 'chop-return']);
    expect(events.filter(e => e.kind === 'impact')).toHaveLength(1);
    expect(events.findIndex(e => e.kind === 'impact')).toBeLessThan(events.findIndex(e => e.kind === 'rep-completed'));
  }
});

test('a 450ms pose window can be a sub-400ms cycle after 15Hz sampling and must not count', () => {
  const replay=(raisedAt:number)=>{
    const r=new ChopRecognizer(syntheticProfile()),observed=[];
    // Warm up raised, then sample a down window starting between observations.
    for(let time=0;time<=2904;time+=66){
      const events=r.update(syntheticFrame(time,time<2050||time>=raisedAt?'raised':'down'));
      observed.push({time,events,phase:r.getDebug().phase});
    }
    return observed;
  };
  const short=replay(2500),long=replay(2570);
  expect(short.find(row=>row.events.some(event=>event.kind==='phase'&&event.phase==='chop-down'))?.time).toBe(2310);
  expect(short.find(row=>row.time===2706)?.phase).toBe('unready'); // 396ms since confirmed down.
  expect(short.flatMap(row=>row.events).filter(event=>event.kind==='rep-completed')).toHaveLength(0);
  expect(short.flatMap(row=>row.events).filter(event=>event.kind==='tracking'&&event.status==='lost')).toHaveLength(0);
  expect(long.flatMap(row=>row.events).filter(event=>event.kind==='rep-completed')).toHaveLength(1);
});
test.each(['only-up', 'only-down', 'no-return', 'timeout', 'duplicate', 'gap', 'invalid', 'reset', 'jitter'] as const)('chop rejects %s without completing a partial cycle', kind => {
  const r = new ChopRecognizer(syntheticProfile()), p = new PoseReplay(r);
  if (kind === 'only-up') p.pose('raised', 3000);
  else if (kind === 'only-down') p.pose('down', 3000).pose('raised');
  else if (kind === 'no-return') p.pose('raised').pose('down', 3000);
  else if (kind === 'jitter') { p.pose('raised');for (let i=0;i<20;i++) p.pose(i%2?'raised':'down',50); }
  else {
    p.pose('raised').pose('down');
    if (kind === 'timeout') p.pose('down', 7000);
    if (kind === 'duplicate') r.update(syntheticFrame(p.time, 'down'));
    if (kind === 'gap') p.time += 300;
    if (kind === 'invalid') { p.time+=50;r.update(replacePoint(syntheticFrame(p.time, 'down'),16,{visibility:.1})); }
    if (kind === 'reset') r.reset();
    p.pose('raised');
  }
  expect(p.reps).toHaveLength(0);
});
test('chop needs usable calibration and rejects stale/future arrivals', () => {
  expect(() => new ChopRecognizer({ ...syntheticProfile(), examples: {} })).toThrow();
  const r = new ChopRecognizer(syntheticProfile());
  expect(r.update(syntheticFrame(10,'raised'),400)).toContainEqual(expect.objectContaining({kind:'tracking',status:'lost'}));
  expect(r.update(syntheticFrame(500,'raised'),400)).toContainEqual(expect.objectContaining({kind:'tracking',status:'lost'}));
});
