/** Normal-speed local production QA. Records only the rendered 3D canvas, never a person/camera. */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {decodeRecordedFrames} from './decode-recorded-frames.mjs';

const base='http://127.0.0.1:4176';
const output=resolve(process.env.TIDAL_LOAD_QA_DIR??'artifacts/qa/user-load-polish-20261025/production');
const address=`${base}/?art=npr-sample`;
const phases=['ready','squat-down','stand-up','press-up','load-return'];
const errors=[],consoleErrors=[],external=[],httpErrors=[],poseRequests=[];
let browser,context;
await mkdir(output,{recursive:true});
try{
 browser=await chromium.launch({channel:'chromium',headless:true});
 context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1});
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push({text:message.text(),location:message.location()});});
 page.on('response',response=>{if(response.status()>=400)httpErrors.push({url:response.url(),status:response.status()});});
 await page.route('**/*',route=>{
  const url=route.request().url(),parsed=new URL(url);
  if(parsed.protocol!=='data:'&&parsed.origin!==base){external.push(url);void route.abort();return;}
  if(/pose_landmarker|\/worker\/|\/mediapipe\//.test(url))poseRequests.push(url);
  void route.continue();
 });
 await page.addInitScript(()=>{
  window.userLoadProduction={cameraCalls:0};
  navigator.mediaDevices.getUserMedia=async()=>{window.userLoadProduction.cameraCalls++;throw new Error('Production canvas QA must not request a camera');};
 });
 await page.goto(address,{waitUntil:'load'});
 await page.waitForFunction(()=>document.getElementById('app')?.dataset.phase==='active'&&
  document.getElementById('missionTitle')?.textContent?.includes('装')&&
  document.getElementById('statusTag')?.textContent==='训练中',null,{timeout:70000});
 assert.equal(await page.locator('#demoToggle').getAttribute('aria-checked'),'true');
 assert.equal(await page.locator('#worldCanvas').getAttribute('data-character'),'user-fbx-load-motion');
 const bounds=await page.locator('#worldCanvas canvas').boundingBox();assert.ok(bounds,'Missing real WebGL canvas');
 await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
 await page.mouse.wheel(0,-1000);await page.waitForTimeout(200);

 const recording=await page.evaluate(async()=>{
  const canvas=document.querySelector('#worldCanvas canvas');
  if(!(canvas instanceof HTMLCanvasElement)||typeof canvas.captureStream!=='function'||typeof MediaRecorder==='undefined')throw new Error('Canvas recording unavailable');
  const stream=canvas.captureStream(30),streamCreatedAt=performance.now(),mimeType=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));
  if(!mimeType){stream.getTracks().forEach(track=>track.stop());throw new Error('No supported WebM recorder');}
  const recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:5000000}),chunks=[],samples=[];
  let request=0,startedAt=0,startRequestedAt=0,eventStartedAt=0,stopRequestedAt=0;
  const sample=()=>{
   const world=document.getElementById('worldCanvas'),hand=world?.dataset.hand?.split(',').map(Number);
   samples.push({time:performance.now(),action:world?.dataset.action??'',hand:hand??[],
    motionRevision:world?.dataset.motionRevision??'',loadValue:document.getElementById('loadValue')?.textContent??'',
    inventory:world?.dataset.inventory??'',status:document.getElementById('statusTag')?.textContent??''});
   request=requestAnimationFrame(sample);
  };
  const done=new Promise((yes,no)=>{
   recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
   recorder.onerror=event=>no(new Error(`MediaRecorder failed: ${event.error?.message??'unknown error'}`));
   recorder.onstop=()=>yes(new Blob(chunks,{type:mimeType}));
   recorder.onstart=()=>{eventStartedAt=performance.now();sample();};
  });
  // The start event is asynchronous; it must not shift the wall-clock/video origin.
  startedAt=startRequestedAt=performance.now();
  recorder.start();
  const timer=setTimeout(()=>{stopRequestedAt=performance.now();if(recorder.state!=='inactive')recorder.stop();},3600);
  let blob;
  try{blob=await done;}finally{clearTimeout(timer);cancelAnimationFrame(request);stream.getTracks().forEach(track=>track.stop());}
  const endedAt=performance.now();window.userLoadRecordedBlob=blob;
  const data=await new Promise((yes,no)=>{const reader=new FileReader();reader.onload=()=>yes(String(reader.result).split(',')[1]);reader.onerror=()=>no(new Error('Unable to read recorded WebM'));reader.readAsDataURL(blob);});
  return {base64:data,mimeType,bytes:blob.size,streamCreatedAt,startRequestedAt,eventStartedAt,stopRequestedAt,
   startedAt,endedAt,elapsedMs:endedAt-startedAt,samples,
   canvas:{width:canvas.width,height:canvas.height},fpsRequested:30};
 });
 const {base64,...recordingMetadata}=recording;
 const videoBytes=Buffer.from(base64,'base64');
 await writeFile(resolve(output,'normal-load.webm'),videoBytes);
 await page.locator('#pauseBtn').click();
 await page.waitForFunction(()=>document.getElementById('statusTag')?.textContent==='已暂停');
 await page.evaluate(()=>new Promise(yes=>requestAnimationFrame(()=>requestAnimationFrame(yes))));
 const frozen=()=>page.evaluate(()=>({hand:document.getElementById('worldCanvas')?.dataset.hand,
  motionRevision:document.getElementById('worldCanvas')?.dataset.motionRevision,
  loadValue:document.getElementById('loadValue')?.textContent,inventory:document.getElementById('worldCanvas')?.dataset.inventory}));
 const paused=await frozen();await page.waitForTimeout(350);const afterPause=await frozen();assert.deepEqual(afterPause,paused,'Pause must freeze rendered hand and submitted load count');
 await page.screenshot({path:resolve(output,'normal-load-paused.png'),fullPage:true});

 // Select the second real input cycle, after its ready phase and before its second committed rep.
 const secondReady=recording.samples.find(sample=>sample.loadValue==='1/15'&&sample.action==='ready');
 assert.ok(secondReady,'Recording missed second-cycle ready; do not fabricate a replacement pose');
 const cycle=recording.samples.filter(sample=>sample.time>=secondReady.time&&sample.loadValue==='1/15');
 const selected=phases.map(phase=>{
  const sample=cycle.filter(item=>item.action===phase).at(-1);
  assert.ok(sample,`Recording missed second-cycle ${phase}`);
  assert.equal(sample.hand.length,3);assert.ok(sample.hand.every(Number.isFinite));
  return {phase,sample,requestedVideoTime:(sample.time-recording.startedAt)/1000};
 });
 const frames=await decodeRecordedFrames(page,videoBytes,selected,{fps:recording.fpsRequested});
 const frameMetadata=[];
 for(const frame of frames){const {png,...metadata}=frame;const file=`${frame.phase}.png`;await writeFile(resolve(output,file),Buffer.from(png,'base64'));frameMetadata.push({...metadata,file,source:'Decoded from normal-load.webm; not a new 3D render'});}
 const cameraCalls=await page.evaluate(()=>window.userLoadProduction.cameraCalls);
 const faviconHttp=httpErrors.filter(item=>item.url===`${base}/favicon.ico`&&item.status===404);
 const otherHttp=httpErrors.filter(item=>!faviconHttp.includes(item));
 const faviconConsole=consoleErrors.filter(item=>item.location.url===`${base}/favicon.ico`&&/Failed to load resource:.*404/.test(item.text));
 const otherConsole=consoleErrors.filter(item=>!faviconConsole.includes(item));
 const report={url:address,browser:browser.version(),input:'Existing default automatic demo, normal production timing; no controller/input/clock mutation',
  recording:'Actual WebGL canvas.captureStream(30) and MediaRecorder; synthetic 3D scene, no person or camera video',
  recordedAt:new Date().toISOString(),...recordingMetadata,frames:frameMetadata,paused,afterPause,cameraCalls,
  gpu:await page.locator('#worldCanvas').getAttribute('data-gpu'),renderScale:await page.locator('#worldCanvas').getAttribute('data-render-scale'),
  pageErrors:errors,external,poseRequests,httpErrors,consoleErrors,allowedFavicon404:{http:faviconHttp,console:faviconConsole},
  result:errors.length||external.length||poseRequests.length||cameraCalls||otherHttp.length||otherConsole.length?'fail':'pass'};
 await writeFile(resolve(output,'production.json'),JSON.stringify(report,null,2)+'\n');
 assert.equal(report.result,'pass','Production capture has errors; see retained production.json');
 console.log(JSON.stringify({output,result:report.result,videoBytes:recording.bytes,elapsedMs:recording.elapsedMs,
  frames:frameMetadata.map(frame=>({phase:frame.phase,time:frame.decodedVideoTime})),cameraCalls,pageErrors:errors,external,allowedFavicon404:report.allowedFavicon404}));
}finally{await context?.close();await browser?.close();}
