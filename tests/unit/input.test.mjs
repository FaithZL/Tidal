import { test } from 'vitest';
import assert from 'node:assert/strict';
import { KeyboardActionSource } from '../../src/input/keyboardActionSource.ts';
const wait=async ms=>new Promise(r=>setTimeout(r,ms));
const ctx=(task)=>({sessionId:'s1',taskRunId:'task1',sourceEpoch:1,task});

test('keyboard emits a full semantic chop cycle and rejects concurrent presses',async()=>{
 const events=[];const source=new KeyboardActionSource(.05);
 await source.start(ctx('chop'),e=>events.push(e));
 assert.equal(source.doRep(),true);
 assert.equal(source.doRep(),false);
 await wait(70);
 assert.deepEqual(events.map(e=>e.kind),['phase','phase','impact','phase','rep-completed']);
 assert.deepEqual(events.filter(e=>e.kind==='phase').map(e=>e.phase),['ready','chop-down','chop-return']);
 assert.ok(events.every(e=>e.sessionId==='s1'&&e.taskRunId==='task1'));
 assert.equal(source.doRep(),true);
 await wait(70);await source.stop();
 assert.equal(events.filter(e=>e.kind==='rep-completed').length,2);
});
test('load completes with all five phases',async()=>{
 const events=[];const source=new KeyboardActionSource(.05);
 await source.start(ctx('load'),e=>events.push(e));source.doRep();await wait(80);
 assert.deepEqual(events.filter(e=>e.kind==='phase').map(e=>e.phase),['ready','squat-down','stand-up','press-up','load-return']);
 assert.equal(events.at(-1).kind,'rep-completed');await source.stop();
});
test('stop cancels callbacks from the previous task',async()=>{
 const events=[];const source=new KeyboardActionSource(1);
 await source.start(ctx('chop'),e=>events.push(e));source.doRep();await wait(20);
 await source.stop();const prev=events.length;await wait(520);
 assert.equal(events.length,prev);
});
test('hold samples stop after key release and cannot be started twice',async()=>{
 const events=[];const source=new KeyboardActionSource(.1);
 await source.start(ctx('carry'),e=>events.push(e));source.holdStart();source.holdStart();
 await wait(120);source.holdEnd();const count=events.length;
 await wait(130);assert.equal(events.length,count);
 assert.ok(count>=3);assert.equal(events.at(-1).holding,false);
 await source.dispose();
});

test('stop racing an unfinished start cannot reactivate an old input source',async()=>{
 const source=new KeyboardActionSource(.05);
 const pending=source.start(ctx('chop'),()=>{});
 await source.stop();await pending;
 assert.equal(source.doRep(),false);assert.equal(source.currentTask,null);
});
