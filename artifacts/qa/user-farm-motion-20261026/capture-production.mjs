/** Actual normal-speed production playback. Only synthetic WebGL canvas is recorded. */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {decodeRecordedFrames} from '../user-load-polish-20261025/decode-recorded-frames.mjs';
const origin='http://127.0.0.1:4176',output=resolve('artifacts/qa/user-farm-motion-20261026/production');
const errors=[],consoleErrors=[],external=[],httpErrors=[],recordings=[];
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true});
const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1});
try{
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')consoleErrors.push({text:message.text(),url:message.location().url});});
 page.on('response',response=>{if(response.status()>=400)httpErrors.push({url:response.url(),status:response.status()});});
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.protocol!=='data:'&&url.origin!==origin){external.push(url.href);return route.abort();}return route.continue();});
 await page.addInitScript(()=>{
  window.farmProductionCameraCalls=0;
  navigator.mediaDevices.getUserMedia=async()=>{window.farmProductionCameraCalls++;throw new Error('Synthetic scene QA must not request a camera');};
 });
 await page.goto(`${origin}/?art=npr-sample`,{waitUntil:'load'});
 await page.waitForFunction(()=>document.getElementById('worldCanvas')?.dataset.character==='user-fbx-farm-motion');
 const active=task=>page.waitForFunction(task=>document.getElementById('app')?.dataset.phase==='active'&&document.getElementById('missionTitle')?.textContent?.includes(task),task,{timeout:90000});
 const closer=async()=>{const bounds=await page.locator('#worldCanvas canvas').boundingBox();assert.ok(bounds);await page.mouse.move(bounds.x+bounds.width*.5,bounds.y+bounds.height*.5);await page.mouse.wheel(0,-500);};
 const record=async(name,duration,selectors)=>{
  const recording=await page.evaluate(async duration=>{
   const canvas=document.querySelector('#worldCanvas canvas');if(!(canvas instanceof HTMLCanvasElement))throw new Error('Missing WebGL canvas');
   const stream=canvas.captureStream(30),mimeType=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));if(!mimeType)throw new Error('No recorder');
   const recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:4000000}),chunks=[],samples=[];let request=0,eventStartedAt=0,stopRequestedAt=0;
   const sample=()=>{const world=document.getElementById('worldCanvas');samples.push({time:performance.now(),phase:world?.dataset.action,mode:world?.dataset.playerMode,hand:world?.dataset.hand,feet:world?.dataset.footPose,blade:world?.dataset.blade,revision:world?.dataset.motionRevision,inventory:world?.dataset.inventory,chop:document.getElementById('chopValue')?.textContent,load:document.getElementById('loadValue')?.textContent});request=requestAnimationFrame(sample);};
   const done=new Promise((yes,no)=>{recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};recorder.onstart=()=>{eventStartedAt=performance.now();};recorder.onerror=()=>no(new Error('MediaRecorder error'));recorder.onstop=()=>yes(new Blob(chunks,{type:mimeType}));});
   const startedAt=performance.now();sample();recorder.start();const timer=setTimeout(()=>{stopRequestedAt=performance.now();recorder.stop();},duration);let blob;
   try{blob=await done;}finally{clearTimeout(timer);cancelAnimationFrame(request);stream.getTracks().forEach(track=>track.stop());}
   const data=await new Promise((yes,no)=>{const reader=new FileReader();reader.onload=()=>yes(String(reader.result).split(',')[1]);reader.onerror=no;reader.readAsDataURL(blob);});
   return {data,startedAt,eventStartedAt,stopRequestedAt,endedAt:performance.now(),samples,mimeType,bytes:blob.size};
  },duration);
  const {data,...metadata}=recording,bytes=Buffer.from(data,'base64');await writeFile(resolve(output,`${name}.webm`),bytes);await writeFile(resolve(output,`${name}-recording.json`),JSON.stringify(metadata,null,2));
  // captureStream emits only painted frames. A held clip can be static for
  // many rAF samples; choose a real rendered revision rather than a hold time.
  const painted=metadata.samples.filter((sample,i)=>i===0||sample.revision!==metadata.samples[i-1].revision);
  const selected=selectors.map(({label,mode,phase})=>{
   const matches=painted.filter(sample=>(!mode||sample.mode===mode)&&(!phase||sample.phase===phase));
   assert.ok(matches.length,`Missed ${label}; do not fabricate a pose`);
   const sample=matches[Math.floor(matches.length*.6)];return {phase:label,sample,requestedVideoTime:(sample.time-metadata.startedAt)/1000};
  });
  const frames=await decodeRecordedFrames(page,bytes,selected),saved=[];
  for(const {png,...frame} of frames){const file=`${name}-${frame.phase}.png`;await writeFile(resolve(output,file),Buffer.from(png,'base64'));saved.push({...frame,file,source:`Decoded from ${name}.webm`});}
  recordings.push({name,...metadata,frames:saved});console.log(JSON.stringify({name,bytes:metadata.bytes,frames:saved.map(f=>f.file)}));
 };
 await active('砍');await closer();
 await record('chop',3600,[{label:'ready',phase:'ready'},{label:'impact',phase:'chop-down'},{label:'return',phase:'chop-return'}]);
 await page.waitForFunction(()=>document.getElementById('app')?.dataset.phase==='rest'&&document.getElementById('worldCanvas')?.dataset.playerMode==='walk',null,{timeout:40000});
 await closer();await record('walk-push',14000,[{label:'walk',mode:'walk'},{label:'push',mode:'push'}]);
 await active('装');await closer();await record('load',3600,[{label:'squat',phase:'squat-down'},{label:'raise',phase:'press-up'}]);
 await page.waitForFunction(()=>document.getElementById('app')?.dataset.phase==='active'&&document.getElementById('worldCanvas')?.dataset.playerMode==='pull',null,{timeout:90000});
 await closer();await record('pull',3600,[{label:'step',mode:'pull'}]);
 await page.locator('#pauseBtn').click();await page.waitForFunction(()=>document.getElementById('statusTag')?.textContent==='已暂停');
 const snapshot=()=>page.evaluate(()=>{const world=document.getElementById('worldCanvas');return {hand:world?.dataset.hand,feet:world?.dataset.footPose,revision:world?.dataset.motionRevision,inventory:world?.dataset.inventory,carry:document.getElementById('carryValue')?.textContent};});
 await page.evaluate(()=>new Promise(yes=>requestAnimationFrame(()=>requestAnimationFrame(yes))));const paused=await snapshot();await page.waitForTimeout(350);const after=await snapshot();assert.deepEqual(after,paused);
 await page.screenshot({path:resolve(output,'pull-paused.png'),fullPage:true});
 const cameraCalls=await page.evaluate(()=>window.farmProductionCameraCalls),allowedHttp=httpErrors.filter(item=>item.url===`${origin}/favicon.ico`&&item.status===404),allowedConsole=consoleErrors.filter(item=>item.url===`${origin}/favicon.ico`&&/404/.test(item.text));
 const report={input:'Existing normal-speed production automatic demo; no input/controller/clock mutation',recording:'WebGL canvas.captureStream only; synthetic scene, no person/audio/camera',browser:browser.version(),recordings,paused,after,cameraCalls,errors,consoleErrors,httpErrors,external,gpu:await page.locator('#worldCanvas').getAttribute('data-gpu'),result:errors.length||external.length||cameraCalls||consoleErrors.length>allowedConsole.length||httpErrors.length>allowedHttp.length?'fail':'pass'};
 await writeFile(resolve(output,'production.json'),JSON.stringify(report,null,2)+'\n');assert.equal(report.result,'pass');console.log(JSON.stringify({result:report.result,cameraCalls,errors,external}));
}finally{await context.close();await browser.close();}
