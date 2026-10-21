import {expect,type Page} from '@playwright/test';
import {syntheticFrame,type SyntheticPose} from './syntheticPose.js';
import type {WorkerRequest,WorkerResponse} from '../../src/pose/types.js';
import {recognitionConfig} from '../../src/config/recognitionConfig.js';
declare global {interface Window {poseFixture:{pose:SyntheticPose;low:boolean;stalled:boolean;workers:number;maxWorkers:number;tracks:MediaStreamTrack[]}}}
/** Test-only fake video + synthetic points. Not actual MediaPipe inference or a physical camera. */
export async function installPoseFixture(page:Page){
  const poses=Object.fromEntries((['standing','raised','down','squat','press','hold'] as const).map(p=>[p,syntheticFrame(0,p).landmarks]));
  await page.addInitScript(poses=>{
    window.poseFixture={pose:'standing',low:false,stalled:false,workers:0,maxWorkers:0,tracks:[]};
    const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia=async constraints=>{const stream=await get(constraints);window.poseFixture.tracks.push(...stream.getTracks());return stream;};
    class FixtureWorker{
      onmessage:((e:MessageEvent<WorkerResponse>)=>void)|null=null;onerror=null;private epoch=0;private closed=false;
      constructor(){window.poseFixture.workers++;window.poseFixture.maxWorkers=Math.max(window.poseFixture.maxWorkers,window.poseFixture.workers);}
      postMessage(m:WorkerRequest){
        if(m.kind==='init'){this.epoch=m.sourceEpoch;this.reply({kind:'ready',sourceEpoch:this.epoch});}
        else if(m.kind==='dispose')this.reply({kind:'disposed'});
        else{m.bitmap.close();if(window.poseFixture.stalled)return;const landmarks=structuredClone(poses[window.poseFixture.pose]);if(window.poseFixture.low)landmarks[16].visibility=.1;
          this.reply({kind:'frame',sourceEpoch:this.epoch,requestId:m.requestId,frame:{frameId:m.requestId,capturedAtMs:m.capturedAtMs,width:m.width,height:m.height,landmarks,valid:true,inferenceMs:0}});}
      }
      private reply(data:WorkerResponse){queueMicrotask(()=>{if(!this.closed)this.onmessage?.({data} as MessageEvent<WorkerResponse>);});}
      terminate(){if(!this.closed){this.closed=true;window.poseFixture.workers--;}}
    }
    window.Worker=FixtureWorker as unknown as typeof Worker;
  },poses);
}
export async function setPose(page:Page,pose:SyntheticPose,ms=450){await page.evaluate(p=>{window.poseFixture.pose=p;},pose);await page.waitForTimeout(ms);}
/** Drive valid observed phases, not an assumed number of frames in a fixed sleep. */
export async function completeSyntheticChop(page:Page,count:number){
  await setPose(page,'raised',0);await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
  await setPose(page,'down',0);await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');
  // Keep the real minimum-cycle protection; 450ms of commanded down can become
  // only 396ms between confirmations after 15Hz sampling and smoothing.
  await page.waitForTimeout(recognitionConfig.chopMinCycleMs);
  await setPose(page,'raised',0);await expect(page.locator('#chopValue')).toHaveText(`${count}/15`);
}
export async function prepareCamera(page:Page){
  await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();await expect(page.locator('#calibrationCapture')).toBeEnabled();
  const steps:[SyntheticPose,string][]=[['standing','chop-raised'],['raised','chop-down'],['down','load-squat'],['squat','load-stand'],['standing','load-press'],['press','load-return'],['standing','carry-hold'],['hold','carry-release'],['standing','complete']];
  for(const [pose,next]of steps){await setPose(page,pose,150);await page.locator('#calibrationCapture').click();await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step',next);}
  await expect(page.locator('#beginCamera')).toBeEnabled();
}
