import type {Page} from '@playwright/test';
import type {WorkerRequest,WorkerResponse} from '../../src/pose/types.js';
export type UpperPose='lowered'|'raised'|'hold'|'left-only';
declare global{interface Window{upperFixture:{pose:UpperPose;low:boolean;stalled:boolean;outside?:boolean;absent?:boolean;moved?:boolean;resized?:boolean;tracks:MediaStreamTrack[];workers:number;maxWorkers:number}}}
/** Fake video + six authored upper-body landmarks; excluded lower body is deliberately unavailable. */
export async function installUpperBodyFixture(page:Page){
 const points=(pose:UpperPose)=>Array.from({length:33},(_,i)=>{
  const low=[[.35,.45],[.65,.45],[.29,.60],[.71,.60],[.30,.78],[.70,.78]];
  const high=[[.35,.45],[.65,.45],[.26,.30],[.74,.30],[.31,.10],[.69,.10]];
  const hold=[[.35,.45],[.65,.45],[.25,.58],[.75,.58],[.36,.43],[.64,.43]];
  const p=i>=11&&i<=16?(pose==='hold'?hold:pose==='raised'?high:pose==='left-only'&&[11,13,15].includes(i)?high:low)[i-11]:[.5,1.2];
  return {x:p[0],y:p[1],z:0,visibility:i>=11&&i<=16?.99:0,presence:i>=11&&i<=16?.99:0};
 });
 const poses=Object.fromEntries((['lowered','raised','hold','left-only'] as const).map(p=>[p,points(p)]));
 await page.addInitScript(poses=>{
  window.upperFixture={pose:'lowered',low:false,stalled:false,tracks:[],workers:0,maxWorkers:0};
  const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async c=>{const stream=await get(c);window.upperFixture.tracks.push(...stream.getTracks());return stream;};
  class UpperWorker{
   onmessage:((event:MessageEvent<WorkerResponse>)=>void)|null=null;onerror=null;private epoch=0;private closed=false;
   constructor(){window.upperFixture.workers++;window.upperFixture.maxWorkers=Math.max(window.upperFixture.maxWorkers,window.upperFixture.workers);}
   postMessage(m:WorkerRequest){if(m.kind==='init'){this.epoch=m.sourceEpoch;this.reply({kind:'ready',sourceEpoch:this.epoch});}else if(m.kind==='dispose')this.reply({kind:'disposed'});else{m.bitmap.close();if(window.upperFixture.stalled)return;const landmarks=structuredClone(poses[window.upperFixture.pose]);if(window.upperFixture.low)landmarks[16].visibility=.1;if(window.upperFixture.outside)landmarks[16].x=1.02;if(window.upperFixture.moved)for(const p of landmarks)p.x+=.3;if(window.upperFixture.absent)landmarks.length=0;this.reply({kind:'frame',sourceEpoch:this.epoch,requestId:m.requestId,frame:{frameId:m.requestId,capturedAtMs:m.capturedAtMs,width:window.upperFixture.resized?m.width*2:m.width,height:m.height,valid:!window.upperFixture.absent,landmarks,inferenceMs:0}});}}
   private reply(data:WorkerResponse){queueMicrotask(()=>{if(!this.closed)this.onmessage?.({data} as MessageEvent<WorkerResponse>);});}
   terminate(){if(!this.closed){this.closed=true;window.upperFixture.workers--;}}
  }
  window.Worker=UpperWorker as unknown as typeof Worker;
 },poses);
}
