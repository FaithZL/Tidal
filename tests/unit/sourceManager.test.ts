import {expect,test} from 'vitest';
import {SourceManager} from '../../src/input/sourceManager.js';
import type {ActionSource} from '../../src/input/types.js';
import type {ExerciseSignal,InputContext,InputMode} from '../../src/domain/types.js';
const context:InputContext={sessionId:'s',taskRunId:'r',sourceEpoch:1,task:'chop'};
const signal:ExerciseSignal={...context,kind:'tracking',status:'ready',seq:1,capturedAtMs:1};
class FakeSource implements ActionSource{
  emit:((e:ExerciseSignal)=>void)|null=null;log:string[]=[];block:Promise<void>=Promise.resolve();
  constructor(readonly mode:InputMode){}
  async start(_c:InputContext,emit:(e:ExerciseSignal)=>void){this.emit=emit;this.log.push('start');await this.block;}
  async stop(){this.log.push('stop');}
  async dispose(){await this.stop();}
}
test('switch stops the previous source and suppresses its old callback, while retaining mixed history',async()=>{
  const m=new SourceManager(),a=new FakeSource('camera'),b=new FakeSource('keyboard'),events:ExerciseSignal[]=[];
  await m.switchTo(a,context,e=>events.push(e));const old=a.emit!;await m.switchTo(b,{...context,sourceEpoch:2},e=>events.push(e));
  old(signal);b.emit!(signal);expect(events).toHaveLength(1);expect(a.log).toEqual(['start','stop']);
  expect([...m.usedModes]).toEqual(['camera','keyboard']);await m.dispose();b.emit!(signal);expect(events).toHaveLength(1);
  m.resetHistory();expect(m.usedModes.size).toBe(0);
});
test('an unresolved old start cannot delay switching or pollute a newer source',async()=>{
  const m=new SourceManager(),a=new FakeSource('camera'),b=new FakeSource('keyboard');let release!:()=>void;
  a.block=new Promise<void>(resolve=>{release=resolve;});const events:ExerciseSignal[]=[];
  const first=m.switchTo(a,context,e=>events.push(e));await new Promise(resolve=>setTimeout(resolve,0));
  await m.switchTo(b,{...context,sourceEpoch:2},e=>events.push(e));release();await first;
  a.emit!(signal);b.emit!(signal);expect(events).toHaveLength(1);expect(a.log).toContain('stop');
});
test('queued switches wait for previous stop and only the latest starts',async()=>{
  const m=new SourceManager(),a=new FakeSource('camera'),b=new FakeSource('keyboard'),c=new FakeSource('camera');
  await m.switchTo(a,context,()=>{});let release!:()=>void;
  a.stop=()=>new Promise<void>(resolve=>{release=resolve;});
  const second=m.switchTo(b,context,()=>{}),third=m.switchTo(c,context,()=>{});
  await new Promise(resolve=>setTimeout(resolve,0));expect(b.log).toEqual([]);expect(c.log).toEqual([]);
  release();await Promise.all([second,third]);expect(b.log).toEqual([]);expect(c.log).toEqual(['start']);
});
