import {expect,test} from 'vitest';
import {createDemoConfig} from '../../src/config/demoConfig.js';
import {createSessionController} from '../../src/domain/sessionController.js';
import type {GameEffect} from '../../src/domain/types.js';

function fixture(){
 const clock={ms:0,nowMs(){return this.ms;}};
 const controller=createSessionController(createDemoConfig(),clock);
 const effects:GameEffect[]=[];controller.onEffect(effect=>effects.push(effect));
 controller.command({kind:'open-setup',mode:'camera'});
 controller.command({kind:'setup-ready',calibrated:{chop:true,load:true,carry:true}});
 return {controller,clock,effects,tick(ms:number){clock.ms+=ms;controller.tick(clock.ms);}};
}

test('repeated tracking loss freezes the elapsed countdown instead of starting five seconds again',()=>{
 const {controller,tick,effects}=fixture();const sessionId=controller.getSnapshot().sessionId;
 tick(3000);
 for(const remainingMs of [2000,1500,1000]){
  controller.command({kind:'camera-readiness',ready:false});
  controller.command({kind:'pause',reason:'tracking'});tick(5000);
  expect(controller.getSnapshot()).toMatchObject({sessionId,phase:'countdown',remainingMs,chopReps:0});
  controller.command({kind:'camera-readiness',ready:false});
  controller.command({kind:'camera-readiness',ready:true});
  controller.command({kind:'resume',reason:'tracking'});tick(500);
 }
 tick(499);expect(controller.getSnapshot().phase).toBe('countdown');
 tick(1);expect(controller.getSnapshot().phase).toBe('active');
 const run=controller.getSnapshot().taskRunId;
 controller.command({kind:'setup-ready',calibrated:{chop:true,load:true,carry:true}});
 controller.command({kind:'camera-readiness',ready:false});controller.command({kind:'pause',reason:'tracking'});tick(5000);
 controller.command({kind:'camera-readiness',ready:true});controller.command({kind:'resume',reason:'tracking'});
 expect(controller.getSnapshot()).toMatchObject({sessionId,phase:'active',taskRunId:run,chopReps:0});
 expect(effects.filter(e=>e.kind==='task-changed').map(e=>e.kind==='task-changed'&&e.phase)).toEqual(['countdown','active']);
});

test('unready countdown cannot run before a pause callback and cannot backfill the lost interval',()=>{
 const {controller,tick}=fixture();tick(3000);
 controller.command({kind:'camera-readiness',ready:false});tick(8000);
 expect(controller.getSnapshot()).toMatchObject({phase:'countdown',remainingMs:2000});
 controller.command({kind:'camera-readiness',ready:true});tick(1999);
 expect(controller.getSnapshot()).toMatchObject({phase:'countdown',remainingMs:1});
 tick(1);expect(controller.getSnapshot().phase).toBe('active');
});

test('tracking recovery preserves remaining time without releasing user or visibility pauses',()=>{
 const {controller,tick}=fixture();tick(3000);
 for(const reason of ['user','visibility','tracking'] as const)controller.command({kind:'pause',reason});
 controller.command({kind:'camera-readiness',ready:false});tick(5000);
 controller.command({kind:'camera-readiness',ready:true});controller.command({kind:'resume',reason:'tracking'});tick(5000);
 expect(controller.getSnapshot()).toMatchObject({phase:'countdown',remainingMs:2000,pauseReasons:['user','visibility']});
 controller.command({kind:'resume',reason:'user'});controller.command({kind:'resume',reason:'visibility'});tick(2000);
 expect(controller.getSnapshot().phase).toBe('active');
});

test('readiness returning between render ticks cannot count the unobserved gap',()=>{
 const {controller,clock,tick}=fixture();tick(3000);
 controller.command({kind:'camera-readiness',ready:false});clock.ms+=8000;
 controller.command({kind:'camera-readiness',ready:true});tick(1);
 expect(controller.getSnapshot()).toMatchObject({phase:'countdown',remainingMs:1999});
});
