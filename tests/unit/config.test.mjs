import { test } from 'vitest';
import assert from 'node:assert/strict';
import {createDemoConfig} from '../../src/config/demoConfig.ts';

test('default quantities reflect detailed demo sequence',()=>{
  const c=createDemoConfig();
  assert.equal(c.chopRepTarget,15);
  assert.equal(c.loadRepTarget,15);
  assert.equal(c.treeCount,3);
  assert.equal(c.carryTargetMs,60000);
  assert.equal(c.initialLogs,0);
  assert.equal(c.logsPerTree,5);
});
test('changing treeCount updates all derived quantities',()=>{
  const c=createDemoConfig({treeCount:4});
  assert.equal(c.chopRepTarget,20);
  assert.equal(c.loadRepTarget,20);
});
test('invalid quantities are rejected',()=>{
  assert.throws(()=>createDemoConfig({treeCount:-1}),RangeError);
  assert.throws(()=>createDemoConfig({treeCount:1.5}),RangeError);
  assert.throws(()=>createDemoConfig({initialLogs:-1}),RangeError);
  assert.throws(()=>createDemoConfig({carryTargetMs:0}),RangeError);
});
