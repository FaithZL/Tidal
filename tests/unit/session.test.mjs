import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createSessionController, inputContext } from '../../src/domain/sessionController.ts';
import { createDemoConfig } from '../../src/config/demoConfig.ts';

function harness(overrides={}){
 const clock={ms:0,nowMs(){return this.ms;}};
 const config=createDemoConfig(overrides);
 const controller=createSessionController(config,clock);
 const effects=[];
 controller.onEffect(e=>effects.push(e));
 let seq=0;
 function tick(ms){ clock.ms+=ms;controller.tick(clock.ms); }
 function send(kind,task,repId,phase){
   const ctx=inputContext(controller.getSnapshot());assert.ok(ctx);
   const data={...ctx,seq:++seq,capturedAtMs:clock.ms,kind,task,repId};
   if(phase) data.phase=phase,data.progress=0.5;
   if(kind==='hold-sample') data.holding=repId,data.valid=phase;
   controller.accept(data);
 }
 function rep(task,id){
   const phases=task==='chop'?['ready','chop-down','chop-return']:['ready','squat-down','stand-up','press-up','load-return'];
   for(const p of phases)send('phase',task,id,p);
   send('rep-completed',task,id);
 }
 function begin(){controller.command({kind:'open-setup',mode:'keyboard'});controller.command({kind:'setup-ready'});assert.equal(controller.getSnapshot().phase,'countdown');tick(config.startCountdownMs);assert.equal(controller.getSnapshot().phase,'active');}
 return {clock,config,controller,effects,tick,send,rep,begin};
}
function proceedThroughTasks(h){
 h.begin();for(let i=1;i<=h.config.chopRepTarget;i++) h.rep('chop',i);
 assert.equal(h.controller.getSnapshot().phase,'rest');
 h.tick(h.config.restMs);assert.equal(h.controller.getSnapshot().phase,'countdown');
 h.tick(h.config.startCountdownMs);assert.equal(h.controller.getSnapshot().task,'load');
 for(let i=1;i<=h.config.loadRepTarget;i++) h.rep('load',i);
 assert.equal(h.controller.getSnapshot().phase,'rest');
 h.tick(h.config.restMs);h.tick(h.config.startCountdownMs);
 assert.equal(h.controller.getSnapshot().task,'carry');
}

test('countdown boundary is precise and full chop cycle is required',()=>{
 const h=harness();h.controller.command({kind:'open-setup',mode:'keyboard'});h.controller.command({kind:'setup-ready'});
 h.tick(4999);assert.equal(h.controller.getSnapshot().phase,'countdown');assert.equal(h.controller.getSnapshot().remainingMs,1);
 h.tick(1);assert.equal(h.controller.getSnapshot().phase,'active');
 h.send('phase','chop',1,'ready');h.send('phase','chop',1,'chop-down');h.send('rep-completed','chop',1);
 assert.equal(h.controller.getSnapshot().chopReps,0);
 h.send('phase','chop',1,'chop-return');h.send('rep-completed','chop',1);
 assert.equal(h.controller.getSnapshot().chopReps,1);
});
test('repeated rep ids, old session, old epoch and stale events are ignored',()=>{
 const h=harness();h.begin();h.rep('chop',1);h.rep('chop',1);
 assert.equal(h.controller.getSnapshot().chopReps,1);
 const s=h.controller.getSnapshot();
 h.controller.accept({...inputContext(s),seq:100,capturedAtMs:h.clock.ms,kind:'rep-completed',task:'chop',repId:2});
 assert.equal(h.controller.getSnapshot().chopReps,1);
 h.controller.accept({...inputContext(s),seq:101,capturedAtMs:h.clock.ms-1000,kind:'rep-completed',task:'chop',repId:2});
 assert.equal(h.controller.getSnapshot().chopReps,1);
 h.controller.command({kind:'reset'});
 h.controller.accept({...inputContext(s),seq:110,capturedAtMs:h.clock.ms,kind:'rep-completed',task:'chop',repId:3});
 assert.equal(h.controller.getSnapshot().chopReps,0);
});
test('inventory conservation, exact rewards and return to home',()=>{
 const h=harness();proceedThroughTasks(h);
 let s=h.controller.getSnapshot();assert.equal(s.choppedTrees,3);assert.equal(s.chopReps,15);
 assert.equal(s.loadReps,15);assert.equal(s.groundLogs,0);assert.equal(s.cartLogs,15);
 const {controller, config}=h;
 for(let ms=0;ms<=config.carryTargetMs;ms+=100){
   if(ms>0) h.clock.ms+=100;
   h.send('hold-sample','carry',true,true);
 }
 s=controller.getSnapshot();
 assert.equal(s.phase,'results');assert.equal(s.deliveredLogs,15);assert.equal(s.groundLogs,0);assert.equal(s.cartLogs,0);
 assert.equal(s.rewardsGranted,true);
 assert.equal(h.effects.filter(e=>e.kind==='rewards-granted').length,1);
 controller.command({kind:'reset'});s=controller.getSnapshot();assert.equal(s.phase,'home');assert.equal(s.groundLogs,12);
 assert.equal(s.rewardsGranted,false);assert.equal(s.deliveredLogs,0);
});
test('hold timer stops when released; long sample gaps do not award phantom time',()=>{
 const h=harness({carryTargetMs:1000});proceedThroughTasks(h);
 h.send('hold-sample','carry',true,true);h.clock.ms+=100;h.send('hold-sample','carry',true,true);
 h.send('hold-sample','carry',false,true);
 h.clock.ms+=1000;h.send('hold-sample','carry',true,true);
 h.clock.ms+=1000;h.send('hold-sample','carry',true,true);
 assert.equal(h.controller.getSnapshot().carryActiveMs,100);
});
test('multiple pause reasons are independent and resume rotates input generation',()=>{
 const h=harness();h.begin();const ctx=inputContext(h.controller.getSnapshot());
 h.controller.command({kind:'pause',reason:'visibility'});h.controller.command({kind:'pause',reason:'user'});
 h.tick(2000);assert.equal(h.controller.getSnapshot().exerciseActiveMs,0);
 h.controller.command({kind:'resume',reason:'visibility'});assert.deepEqual(h.controller.getSnapshot().pauseReasons,['user']);
 h.controller.command({kind:'resume',reason:'user'});
 assert.ok(h.controller.getSnapshot().sourceEpoch>ctx.sourceEpoch);
 h.controller.accept({...ctx,seq:90,capturedAtMs:h.clock.ms,kind:'rep-completed',task:'chop',repId:1});
 assert.equal(h.controller.getSnapshot().chopReps,0);
});
test('completion cannot mint wood twice through reset or late signals',()=>{
 const h=harness({treeCount:1,repsPerTree:1,initialLogs:0,carryTargetMs:200});h.begin();h.rep('chop',1);
 assert.equal(h.controller.getSnapshot().groundLogs,1);
 const old=inputContext({...h.controller.getSnapshot(),phase:'active',task:'chop',taskRunId:'run-1'});
 h.tick(h.config.restMs);h.tick(h.config.startCountdownMs);h.rep('load',1);
 h.tick(h.config.restMs);h.tick(h.config.startCountdownMs);
 h.send('hold-sample','carry',true,true);h.clock.ms+=100;h.send('hold-sample','carry',true,true);
 h.clock.ms+=100;h.send('hold-sample','carry',true,true);
 assert.equal(h.controller.getSnapshot().deliveredLogs,1);
 if(old)h.controller.accept({...old,seq:100,capturedAtMs:h.clock.ms,kind:'rep-completed',task:'chop',repId:1});
 assert.equal(h.controller.getSnapshot().deliveredLogs,1);
 assert.equal(h.effects.filter(e=>e.kind==='rewards-granted').length,1);
});

test('a backwards clock tick cannot duplicate countdown time',()=>{
 const h=harness();h.controller.command({kind:'open-setup',mode:'keyboard'});h.controller.command({kind:'setup-ready'});
 h.tick(1000);h.controller.tick(500);h.controller.tick(1000);
 assert.equal(h.controller.getSnapshot().remainingMs,4000);
});

test('out-of-order capture timestamps cannot add hold time twice',()=>{
 const h=harness({carryTargetMs:1000});proceedThroughTasks(h);
 const c=inputContext(h.controller.getSnapshot());const t=h.clock.ms;
 const send=(seq,at)=>h.controller.accept({...c,seq,capturedAtMs:at,kind:'hold-sample',task:'carry',holding:true,valid:true});
 send(1,t);h.clock.ms+=100;send(2,t+100);send(3,t+50);h.clock.ms+=100;send(4,t+200);
 assert.equal(h.controller.getSnapshot().carryActiveMs,200);
});

test('final hold sample clamps both effective timers to the exact target',()=>{
 const h=harness({carryTargetMs:250});proceedThroughTasks(h);
 const before=h.controller.getSnapshot().exerciseActiveMs;
 for(let i=0;i<4;i++){if(i)h.clock.ms+=100;h.send('hold-sample','carry',true,true);}
 assert.equal(h.controller.getSnapshot().carryActiveMs,250);
 assert.equal(h.controller.getSnapshot().exerciseActiveMs-before,250);
});

test('every emitted snapshot conserves inventory across two full sessions',()=>{
 const h=harness({carryTargetMs:200});let checked=0;
 h.controller.subscribe(s=>{checked++;assert.equal(s.groundLogs+s.cartLogs+s.deliveredLogs,12+s.choppedTrees);});
 for(let round=0;round<2;round++){
   proceedThroughTasks(h);h.send('hold-sample','carry',true,true);
   h.clock.ms+=100;h.send('hold-sample','carry',true,true);h.clock.ms+=100;h.send('hold-sample','carry',true,true);
   assert.equal(h.controller.getSnapshot().phase,'results');h.controller.command({kind:'reset'});
 }
 assert.ok(checked>200);assert.equal(h.effects.filter(e=>e.kind==='rewards-granted').length,2);
});

test('10 seconds valid, 5 released and 50 valid yields exactly 60 effective seconds',()=>{
 const h=harness();proceedThroughTasks(h);
 const holds=ms=>{h.send('hold-sample','carry',true,true);for(let i=0;i<ms/100;i++){h.clock.ms+=100;h.send('hold-sample','carry',true,true);}};
 holds(10000);h.send('hold-sample','carry',false,true);h.clock.ms+=5000;holds(50000);
 assert.equal(h.controller.getSnapshot().carryActiveMs,60000);assert.equal(h.controller.getSnapshot().phase,'results');
});

test('wrong task run, old epoch, duplicate sequence and nonfinite times cannot complete a cycle',()=>{
 const h=harness();h.begin();const ctx=inputContext(h.controller.getSnapshot());
 for(const bad of [{taskRunId:'old'},{sourceEpoch:ctx.sourceEpoch-1},{capturedAtMs:NaN},{capturedAtMs:Infinity},{capturedAtMs:h.clock.ms+1000},{capturedAtMs:h.clock.ms-301}]){
   let seq=100;
   for(const phase of ['ready','chop-down','chop-return'])h.controller.accept({...ctx,kind:'phase',task:'chop',phase,progress:1,repId:1,capturedAtMs:h.clock.ms,seq:seq++,...bad});
   h.controller.accept({...ctx,kind:'rep-completed',task:'chop',repId:1,capturedAtMs:h.clock.ms,seq:seq++,...bad});
 }
 h.send('phase','chop',2,'ready');h.send('phase','chop',2,'chop-down');
 h.controller.accept({...ctx,seq:1,capturedAtMs:h.clock.ms,kind:'phase',task:'chop',repId:2,phase:'chop-return',progress:1});
 h.send('rep-completed','chop',2);assert.equal(h.controller.getSnapshot().chopReps,0);
 h.rep('chop',3);assert.equal(h.controller.getSnapshot().chopReps,1);
});

test('results freeze elapsed wall time at completion, including the final sample',()=>{
 const h=harness({carryTargetMs:200});proceedThroughTasks(h);
 h.send('hold-sample','carry',true,true);h.clock.ms+=200;h.send('hold-sample','carry',true,true);
 assert.equal(h.controller.getSnapshot().sessionElapsedMs,h.clock.ms);
 h.tick(5000);assert.equal(h.controller.getSnapshot().sessionElapsedMs,h.clock.ms-5000);
});

test('nonfinite phase progress cannot build a valid action cycle',()=>{
 const h=harness();h.begin();const ctx=inputContext(h.controller.getSnapshot());
 let seq=1;
 for(const phase of ['ready','chop-down','chop-return'])h.controller.accept({...ctx,seq:seq++,capturedAtMs:h.clock.ms,kind:'phase',task:'chop',repId:1,phase,progress:NaN});
 h.controller.accept({...ctx,seq:seq++,capturedAtMs:h.clock.ms,kind:'rep-completed',task:'chop',repId:1});
 assert.equal(h.controller.getSnapshot().chopReps,0);
});
