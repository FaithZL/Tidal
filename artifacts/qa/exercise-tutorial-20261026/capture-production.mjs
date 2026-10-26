/** UI-only production teaching QA. Synthetic SVG/farm screenshots, no camera or video recording. */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';

const origin='http://127.0.0.1:4176',output=resolve('artifacts/qa/exercise-tutorial-20261026/production');
const errors=[],consoleErrors=[],external=[],httpErrors=[],poseRequests=[],frames=[];
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true});
const context=await browser.newContext({viewport:{width:1366,height:900},deviceScaleFactor:1});
try{
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')consoleErrors.push({text:message.text(),url:message.location().url});});
 page.on('response',response=>{if(response.status()>=400)httpErrors.push({url:response.url(),status:response.status()});});
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.protocol!=='data:'&&url.origin!==origin){external.push(url.href);return route.abort();}if(/pose_landmarker|\/worker\/|\/mediapipe\//.test(url.href))poseRequests.push(url.href);return route.continue();});
 await page.addInitScript(()=>{
  localStorage.setItem('tidal.demo.enabled','false');window.tutorialMediaCalls=0;
  navigator.mediaDevices.getUserMedia=async()=>{window.tutorialMediaCalls++;throw new Error('Teaching QA must not request a camera');};
 });
 await page.goto(`${origin}/?art=npr-sample`,{waitUntil:'load'});await page.waitForFunction(()=>document.getElementById('worldCanvas')?.dataset.assets==='ready');
 await page.locator('#planTutorial').click();
 const snapshot=()=>page.evaluate(()=>({phase:document.getElementById('app')?.dataset.phase,chop:document.getElementById('chopValue')?.textContent,load:document.getElementById('loadValue')?.textContent,carry:document.getElementById('carryValue')?.textContent,inventory:document.getElementById('worldCanvas')?.dataset.inventory}));
 const beforeTraining=await snapshot();assert.equal(beforeTraining.phase,'home');
 const selected=[['chop',1,'chop-ready'],['chop',2,'chop-down'],['load',1,'load-squat'],['load',3,'load-press'],['carry',1,'carry-hold'],['carry',2,'carry-release']];
 for(const [task,index,name] of selected){
  await page.locator(`#tutorialTabs button[data-task="${task}"]`).click();await page.locator('#tutorialStepList button').nth(index).click();
  assert.equal(await page.locator('#tutorialModal').getAttribute('data-playing'),'false');
  const points=await page.locator('#tutorialFigure circle[data-joint]').evaluateAll(nodes=>nodes.map(node=>({joint:node.getAttribute('data-joint'),x:Number(node.getAttribute('cx')),y:Number(node.getAttribute('cy')),highlighted:node.getAttribute('data-highlighted')})));
  assert.equal(points.length,14);assert.ok(points.every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y)));assert.ok(points.some(point=>point.highlighted==='true'));
  await page.screenshot({path:resolve(output,`${name}.png`),fullPage:true});frames.push({file:`${name}.png`,task,step:index,points});
 }
 const wrist=(name,joint)=>frames.find(frame=>frame.file===`${name}.png`).points.find(point=>point.joint===joint);
 assert.ok(wrist('chop-down','rightWrist').y>wrist('chop-ready','rightWrist').y+50);
 assert.ok(Math.hypot(wrist('carry-hold','rightWrist').x-wrist('carry-release','rightWrist').x,wrist('carry-hold','rightWrist').y-wrist('carry-release','rightWrist').y)>30);
 await page.locator('#tutorialTabs button[data-task="chop"]').click();await page.locator('#tutorialStepList button').nth(1).click();await page.locator('#tutorialSpeed').selectOption('0.5');await page.locator('#tutorialPlay').click();
 const start=Number(await page.locator('#tutorialModal').getAttribute('data-time-ms'));await page.waitForTimeout(700);await page.locator('#tutorialPlay').click();const slowDelta=Number(await page.locator('#tutorialModal').getAttribute('data-time-ms'))-start;
 assert.ok(slowDelta>150&&slowDelta<500,`Half speed observed ${slowDelta}ms in700ms`);await page.screenshot({path:resolve(output,'slow-motion.png'),fullPage:true});
 await page.locator('#tutorialClose').click();assert.deepEqual(await snapshot(),beforeTraining);
 await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();await page.locator('#beginDemo').click();await page.waitForFunction(()=>document.getElementById('statusTag')?.textContent==='训练中',null,{timeout:15000});
 await page.locator('#tutorialOpen').click();await page.waitForFunction(()=>document.getElementById('statusTag')?.textContent==='已暂停');const paused=await snapshot();await page.waitForTimeout(500);assert.deepEqual(await snapshot(),paused);
 await page.screenshot({path:resolve(output,'during-training.png'),fullPage:true});await page.locator('#tutorialClose').click();assert.equal(await page.locator('#statusTag').textContent(),'已暂停');
 await page.locator('#tutorialOpen').click();await page.locator('#tutorialTabs button[data-task="load"]').click();await page.locator('#tutorialStepList button').nth(1).click();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:resolve(output,'mobile-lesson.png'),fullPage:true});
 await page.locator('#tutorialSpeed').scrollIntoViewIfNeeded();await page.screenshot({path:resolve(output,'mobile-controls.png'),fullPage:true});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const cameraCalls=await page.evaluate(()=>window.tutorialMediaCalls),allowedHttp=httpErrors.filter(item=>item.url===`${origin}/favicon.ico`&&item.status===404),allowedConsole=consoleErrors.filter(item=>item.url===`${origin}/favicon.ico`&&/404/.test(item.text));
 const report={input:'Normal-speed production app; actual lesson/UI controls; no controller/clock mutation',media:'Only synthetic SVG/3D UI screenshots; no video recording, no person or camera',browser:browser.version(),frames,halfSpeedObservedMs:slowDelta,wallIntervalMs:700,beforeTraining,paused,cameraCalls,errors,consoleErrors,httpErrors,poseRequests,external,result:errors.length||external.length||cameraCalls||poseRequests.length||consoleErrors.length>allowedConsole.length||httpErrors.length>allowedHttp.length?'fail':'pass'};
 await writeFile(resolve(output,'production.json'),JSON.stringify(report,null,2)+'\n');assert.equal(report.result,'pass');console.log(JSON.stringify({result:report.result,frames:frames.length+4,halfSpeedObservedMs:slowDelta,cameraCalls,errors,external}));
}finally{await context.close();await browser.close();}
