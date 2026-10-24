# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: source-lifecycle.diagnostic.spec.ts >> a stalled camera during rest cannot start the next active task without preparation
- Location: tests/e2e/source-lifecycle.diagnostic.spec.ts:76:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('#chopValue')
Expected: "1/15"
Received: "0/15"
Timeout:  7000ms

Call log:
  - Expect "toHaveText" locator('#chopValue') with timeout 7000ms
  - waiting for locator('#chopValue')
    18 × locator resolved to <strong id="chopValue">0/15</strong>
       - unexpected value "0/15"

```

```yaml
- strong: 0/15
```

# Test source

```ts
  1  | import {expect,type Page} from '@playwright/test';
  2  | import {syntheticFrame,type SyntheticPose} from './syntheticPose.js';
  3  | import type {WorkerRequest,WorkerResponse} from '../../src/pose/types.js';
  4  | import {recognitionConfig} from '../../src/config/recognitionConfig.js';
  5  | declare global {interface Window {poseFixture:{pose:SyntheticPose;low:boolean;stalled:boolean;workers:number;maxWorkers:number;tracks:MediaStreamTrack[]}}}
  6  | /** Test-only fake video + synthetic points. Not actual MediaPipe inference or a physical camera. */
  7  | export async function installPoseFixture(page:Page){
  8  |   const poses=Object.fromEntries((['standing','raised','down','squat','press','hold'] as const).map(p=>[p,syntheticFrame(0,p).landmarks]));
  9  |   await page.addInitScript(poses=>{
  10 |     window.poseFixture={pose:'standing',low:false,stalled:false,workers:0,maxWorkers:0,tracks:[]};
  11 |     const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  12 |     navigator.mediaDevices.getUserMedia=async constraints=>{const stream=await get(constraints);window.poseFixture.tracks.push(...stream.getTracks());return stream;};
  13 |     class FixtureWorker{
  14 |       onmessage:((e:MessageEvent<WorkerResponse>)=>void)|null=null;onerror=null;private epoch=0;private closed=false;
  15 |       constructor(){window.poseFixture.workers++;window.poseFixture.maxWorkers=Math.max(window.poseFixture.maxWorkers,window.poseFixture.workers);}
  16 |       postMessage(m:WorkerRequest){
  17 |         if(m.kind==='init'){this.epoch=m.sourceEpoch;this.reply({kind:'ready',sourceEpoch:this.epoch});}
  18 |         else if(m.kind==='dispose')this.reply({kind:'disposed'});
  19 |         else{m.bitmap.close();if(window.poseFixture.stalled)return;const landmarks=structuredClone(poses[window.poseFixture.pose]);if(window.poseFixture.low)landmarks[16].visibility=.1;
  20 |           this.reply({kind:'frame',sourceEpoch:this.epoch,requestId:m.requestId,frame:{frameId:m.requestId,capturedAtMs:m.capturedAtMs,width:m.width,height:m.height,landmarks,valid:true,inferenceMs:0}});}
  21 |       }
  22 |       private reply(data:WorkerResponse){queueMicrotask(()=>{if(!this.closed)this.onmessage?.({data} as MessageEvent<WorkerResponse>);});}
  23 |       terminate(){if(!this.closed){this.closed=true;window.poseFixture.workers--;}}
  24 |     }
  25 |     window.Worker=FixtureWorker as unknown as typeof Worker;
  26 |   },poses);
  27 | }
  28 | export async function setPose(page:Page,pose:SyntheticPose,ms=450){await page.evaluate(p=>{window.poseFixture.pose=p;},pose);await page.waitForTimeout(ms);}
  29 | /** Drive valid observed phases, not an assumed number of frames in a fixed sleep. */
  30 | export async function completeSyntheticChop(page:Page,count:number){
  31 |   await setPose(page,'raised',0);await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
  32 |   await setPose(page,'down',0);await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');
  33 |   // Keep the real minimum-cycle protection; 450ms of commanded down can become
  34 |   // only 396ms between confirmations after 15Hz sampling and smoothing.
  35 |   await page.waitForTimeout(recognitionConfig.chopMinCycleMs);
> 36 |   await setPose(page,'raised',0);await expect(page.locator('#chopValue')).toHaveText(`${count}/15`);
     |                                                                           ^ Error: expect(locator).toHaveText(expected) failed
  37 | }
  38 | export async function prepareCamera(page:Page){
  39 |   await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();await expect(page.locator('#calibrationCapture')).toBeEnabled();
  40 |   const steps:[SyntheticPose,string][]=[['standing','chop-raised'],['raised','chop-down'],['down','load-squat'],['squat','load-stand'],['standing','load-press'],['press','load-return'],['standing','carry-hold'],['hold','carry-release'],['standing','complete']];
  41 |   for(const [pose,next]of steps){await setPose(page,pose,150);await page.locator('#calibrationCapture').click();await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step',next);}
  42 |   await expect(page.locator('#beginCamera')).toBeEnabled();
  43 | }
  44 | 
```