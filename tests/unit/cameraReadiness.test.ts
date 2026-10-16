import {expect,test} from 'vitest';
import {sessionHarness} from '../helpers/sessionHarness.js';
function cameraTask(){
  const h=sessionHarness();h.controller.command({kind:'open-setup',mode:'camera'});
  h.controller.command({kind:'setup-ready',calibrated:{chop:true,load:true,carry:true}});h.tick(1);return h;
}
test('lost tracking does not freeze a rest, but the next countdown waits for fresh readiness',()=>{
  const h=cameraTask();
  for(const phase of ['ready','chop-down','chop-return'] as const)h.emit({kind:'phase',task:'chop',phase,repId:1,progress:1});
  h.emit({kind:'rep-completed',task:'chop',repId:1});
  h.controller.command({kind:'camera-readiness',ready:false});h.controller.command({kind:'pause',reason:'tracking'});
  h.tick(10);expect(h.controller.getSnapshot()).toMatchObject({phase:'rest',remainingMs:0,pauseReasons:[]});
  h.controller.command({kind:'camera-readiness',ready:true});h.tick(0);
  expect(h.controller.getSnapshot()).toMatchObject({phase:'countdown',remainingMs:1});
  h.tick(1);expect(h.controller.getSnapshot()).toMatchObject({phase:'active',task:'load'});
});
test('readiness cannot clear user/background pauses, and an invalid countdown restarts in full',()=>{
  const h=sessionHarness();h.controller.command({kind:'open-setup',mode:'camera'});h.controller.command({kind:'setup-ready',calibrated:{chop:true,load:true,carry:true}});
  h.controller.command({kind:'pause',reason:'user'});h.controller.command({kind:'pause',reason:'visibility'});
  h.controller.command({kind:'camera-readiness',ready:false});h.controller.command({kind:'pause',reason:'tracking'});
  h.controller.command({kind:'resume',reason:'tracking'});expect(h.controller.getSnapshot().pauseReasons).toContain('tracking');
  h.controller.command({kind:'camera-readiness',ready:true});h.controller.command({kind:'resume',reason:'tracking'});h.tick(1000);
  expect(h.controller.getSnapshot()).toMatchObject({phase:'countdown',remainingMs:1,pauseReasons:['user','visibility']});
  h.controller.command({kind:'resume',reason:'user'});h.controller.command({kind:'resume',reason:'visibility'});h.tick(1);
  expect(h.controller.getSnapshot().phase).toBe('active');
});
