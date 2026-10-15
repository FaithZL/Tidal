import { expect,test } from 'vitest';
import { CarryRecognizer } from '../../src/pose/recognizers/carryRecognizer.js';
import { syntheticProfile } from '../helpers/recognizerReplay.js';
import { syntheticFrame,type SyntheticPose } from '../helpers/syntheticPose.js';
import { sessionHarness } from '../helpers/sessionHarness.js';
import { inputContext } from '../../src/domain/sessionController.js';
function rig(hz=10){
  const h=sessionHarness();h.carry();const r=new CarryRecognizer(syntheticProfile()),dt=1000/hz;
  function sample(pose:SyntheticPose='hold'){const events=r.update(syntheticFrame(h.clock.ms,pose),h.clock.ms);events.forEach(h.emit);return events.some(e=>e.kind==='hold-sample'&&e.holding);}
  function warm(){let held=false;for(let i=0;i<60&&!held;i++){h.tick(dt);held=sample();}expect(held).toBe(true);}
  function run(ms:number,pose:SyntheticPose='hold'){const origin=h.clock.ms;for(let i=1;i<=Math.round(ms/dt);i++){h.tick(origin+i*dt-h.clock.ms);sample(pose);}}
  return {...h,r,dt,sample,warm,run};
}
test('10 seconds valid + 5 released + 50 valid credits exactly 60, once; entry delay is not credited',()=>{
  const h=rig();h.warm();expect(h.controller.getSnapshot().carryActiveMs).toBe(0);
  h.run(10000);expect(h.controller.getSnapshot().carryActiveMs).toBe(10000);
  h.run(5000,'standing');expect(h.controller.getSnapshot().carryActiveMs).toBe(10000);
  h.warm();expect(h.controller.getSnapshot().carryActiveMs).toBe(10000);
  h.run(50000);h.run(1000);
  expect(h.controller.getSnapshot()).toMatchObject({carryActiveMs:60000,phase:'results',deliveredLogs:1});
  expect(h.effects.filter(e=>e.kind==='rewards-granted')).toHaveLength(1);
});
test.each([5,10,15,30])('valid %i Hz observations have the same effective elapsed time',hz=>{
  const h=rig(hz);h.warm();h.run(10000);
  expect(h.controller.getSnapshot().carryActiveMs).toBeCloseTo(10000,7);
});
test('gap, duplicate/old epoch and independent pauses do not fill unobserved time',()=>{
  const h=rig();h.warm();h.run(1000);const old=inputContext(h.controller.getSnapshot())!;
  h.tick(500);h.sample();expect(h.controller.getSnapshot().carryActiveMs).toBe(1000);
  h.controller.command({kind:'pause',reason:'visibility'});h.controller.command({kind:'pause',reason:'user'});h.r.reset();
  h.run(3000);h.controller.command({kind:'resume',reason:'visibility'});h.run(1000);
  expect(h.controller.getSnapshot().carryActiveMs).toBe(1000);
  h.controller.command({kind:'resume',reason:'user'});h.r.reset();
  h.controller.accept({...old,kind:'hold-sample',task:'carry',holding:true,valid:true,seq:99999,capturedAtMs:h.clock.ms});
  h.warm();expect(h.controller.getSnapshot().carryActiveMs).toBe(1000);
  h.sample();expect(h.controller.getSnapshot().carryActiveMs).toBe(1000);
});
