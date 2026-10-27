import {expect,test} from 'vitest';
import {createDemoConfig} from '../../src/config/demoConfig.js';
import {createSessionController} from '../../src/domain/sessionController.js';
import type {GameEffect} from '../../src/domain/types.js';

function fixture(){
 const clock={ms:0,nowMs(){return this.ms;}};
 const controller=createSessionController(createDemoConfig(),clock),effects:GameEffect[]=[];
 controller.onEffect(e=>effects.push(e));
 controller.command({kind:'open-setup',mode:'camera'});
 controller.command({kind:'setup-ready',calibrated:{chop:true,load:true,carry:true}});
 return {clock,controller,effects};
}

test('usable countdown intervals between render ticks are retained once, without charging tracking gaps',()=>{
 const {clock,controller,effects}=fixture();
 for(let i=0;i<10;i++){
  clock.ms+=100;controller.command({kind:'camera-readiness',ready:false});
  controller.command({kind:'pause',reason:'tracking'});
  expect(controller.getSnapshot()).toMatchObject({phase:'countdown',remainingMs:5000-(i+1)*100,chopReps:0});
  clock.ms+=500;controller.tick(clock.ms);
  controller.command({kind:'camera-readiness',ready:true});controller.command({kind:'resume',reason:'tracking'});
 }
 expect(controller.getSnapshot().remainingMs).toBe(4000);
 clock.ms+=3999;controller.tick(clock.ms);expect(controller.getSnapshot().phase).toBe('countdown');
 clock.ms++;controller.tick(clock.ms);expect(controller.getSnapshot().phase).toBe('active');
 expect(effects.filter(e=>e.kind==='task-changed').map(e=>e.kind==='task-changed'&&e.phase)).toEqual(['countdown','active']);
});

test('a pause callback before readiness loss saves only the elapsed countdown and keeps manual pauses',()=>{
 const {clock,controller}=fixture();clock.ms=125;
 controller.command({kind:'pause',reason:'tracking'});
 controller.command({kind:'camera-readiness',ready:false});
 controller.command({kind:'pause',reason:'user'});controller.command({kind:'pause',reason:'visibility'});
 clock.ms=5000;controller.tick(clock.ms);
 controller.command({kind:'camera-readiness',ready:true});controller.command({kind:'resume',reason:'tracking'});
 clock.ms=9000;controller.tick(clock.ms);
 expect(controller.getSnapshot()).toMatchObject({phase:'countdown',remainingMs:4875,pauseReasons:['user','visibility'],chopReps:0});
});

test('finishing elapsed countdown at a loss edge cannot start a task until fresh readiness returns',()=>{
 const {clock,controller,effects}=fixture();clock.ms=4999;controller.tick(clock.ms);clock.ms=5000;
 controller.command({kind:'camera-readiness',ready:false});
 expect(controller.getSnapshot()).toMatchObject({phase:'countdown',remainingMs:0,taskRunId:null});
 clock.ms=9000;controller.tick(clock.ms);expect(controller.getSnapshot().phase).toBe('countdown');
 controller.command({kind:'camera-readiness',ready:true});controller.tick(clock.ms);
 expect(controller.getSnapshot().phase).toBe('active');
 expect(effects.filter(e=>e.kind==='task-changed'&&e.phase==='active')).toHaveLength(1);
});

test('a long unobserved render gap cannot be backfilled by a loss or pause callback',()=>{
 for(const kind of ['readiness','pause']){
  const {clock,controller}=fixture();clock.ms=5000;
  controller.command(kind==='readiness'?{kind:'camera-readiness',ready:false}:{kind:'pause',reason:'tracking'});
  expect(controller.getSnapshot()).toMatchObject({phase:'countdown',remainingMs:5000,taskRunId:null});
 }
});
