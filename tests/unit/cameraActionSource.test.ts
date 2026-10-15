import {expect,test} from 'vitest';
import {CameraActionSource} from '../../src/input/cameraActionSource.js';
import {syntheticProfile} from '../helpers/recognizerReplay.js';
import {syntheticFrame} from '../helpers/syntheticPose.js';
import {sessionHarness} from '../helpers/sessionHarness.js';
import {inputContext} from '../../src/domain/sessionController.js';
import type {ExerciseSignal,InputContext} from '../../src/domain/types.js';
const context:InputContext={sessionId:'s',taskRunId:'r',sourceEpoch:1,task:'chop'};
test('camera cannot start without validated calibration, and no frames times out explicitly',async()=>{
  const camera=new CameraActionSource(()=>0),events:ExerciseSignal[]=[];
  await expect(camera.start(context,e=>events.push(e))).rejects.toThrow();
  camera.setProfile(syntheticProfile());await camera.start(context,e=>events.push(e));camera.tick(301);
  expect(events).toContainEqual(expect.objectContaining({kind:'tracking',status:'lost'}));
  await camera.stop();await expect(camera.start(context,()=>{})).rejects.toThrow();
});
test('camera full chop produces the same authoritative result and stop blocks late frames',async()=>{
  const h=sessionHarness();h.begin();h.controller.command({kind:'pause',reason:'user'});h.controller.command({kind:'switch-source',mode:'camera'});h.controller.command({kind:'resume',reason:'user'});
  const camera=new CameraActionSource(()=>h.clock.ms);camera.setProfile(syntheticProfile());const ctx=inputContext(h.controller.getSnapshot())!;
  const events:ExerciseSignal[]=[];await camera.start(ctx,e=>{events.push(e);h.controller.accept(e);});
  for(const pose of ['raised','down','raised'] as const)for(let i=0;i<8;i++){h.tick(50);camera.accept(syntheticFrame(h.clock.ms,pose));}
  expect(h.controller.getSnapshot()).toMatchObject({chopReps:1,choppedTrees:1,groundLogs:1,task:'load'});
  expect(events.every(e=>e.sessionId===ctx.sessionId&&e.taskRunId===ctx.taskRunId&&e.sourceEpoch===ctx.sourceEpoch)).toBe(true);
  expect(new Set(events.map(e=>e.seq)).size).toBe(events.length);
  const count=events.length;await camera.stop();camera.accept(syntheticFrame(h.clock.ms+50,'down'));expect(events).toHaveLength(count);
});
test('task change resets half-rep; a frame captured before new start cannot enter the new context',async()=>{
  let now=0;const camera=new CameraActionSource(()=>now),events:ExerciseSignal[]=[];camera.setProfile(syntheticProfile());
  await camera.start(context,e=>events.push(e));for(const pose of ['raised','down'] as const)for(let i=0;i<8;i++){now+=50;camera.accept(syntheticFrame(now,pose));}
  await camera.stop();now+=100;await camera.start({...context,taskRunId:'next',sourceEpoch:2},e=>events.push(e));events.length=0;
  camera.accept(syntheticFrame(now-50,'raised'));expect(events).toHaveLength(0);
  for(let i=0;i<12;i++){now+=50;camera.accept(syntheticFrame(now,'raised'));}
  expect(events.filter(e=>e.kind==='rep-completed')).toHaveLength(0);
});
test('domain camera setup requires explicit verified readiness and remains closed without it',()=>{
  const h=sessionHarness();h.controller.command({kind:'open-setup',mode:'camera'});h.controller.command({kind:'setup-ready'});
  expect(h.controller.getSnapshot().phase).toBe('setup');
  h.controller.command({kind:'setup-ready',calibrated:{chop:true,load:true,carry:false}});expect(h.controller.getSnapshot().phase).toBe('setup');
  h.controller.command({kind:'setup-ready',calibrated:{chop:true,load:true,carry:true}});expect(h.controller.getSnapshot().phase).toBe('countdown');
});
