/** Normal production UI, authored skeleton screenshots only; no real camera/video. */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';

const origin='http://127.0.0.1:4176',output=resolve('artifacts/qa/movement-guide-20261026/production');
const errors=[],consoleErrors=[],external=[],httpErrors=[],poseRequests=[],frames=[];
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true});
const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1});
try{
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push({text:message.text(),url:message.location().url});});
 page.on('response',response=>{if(response.status()>=400)httpErrors.push({url:response.url(),status:response.status()});});
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.protocol!=='data:'&&url.origin!==origin){external.push(url.href);return route.abort();}if(/pose_landmarker|\/worker\/|\/mediapipe\//.test(url.href))poseRequests.push(url.href);return route.continue();});
 await page.addInitScript(()=>{localStorage.setItem('tidal.demo.enabled','false');window.guideCameraCalls=0;navigator.mediaDevices.getUserMedia=async()=>{window.guideCameraCalls++;throw new Error('Skeleton guide must not request a camera');};});
 const state=()=>page.evaluate(()=>({phase:document.getElementById('app').dataset.phase,chop:document.getElementById('chopValue').textContent,load:document.getElementById('loadValue').textContent,carry:document.getElementById('carryValue').textContent,inventory:document.getElementById('worldCanvas').dataset.inventory}));
 const joints=()=>page.locator('#movementGuide circle[data-joint]').evaluateAll(nodes=>nodes.map(node=>({joint:node.getAttribute('data-joint'),x:Number(node.getAttribute('cx')),y:Number(node.getAttribute('cy'))})));
 const capture=async name=>{const points=await joints();assert.equal(points.length,14);await page.screenshot({path:resolve(output,`${name}.png`)});frames.push({file:`${name}.png`,task:await page.locator('#movementGuide').getAttribute('data-task'),step:await page.locator('#movementGuide').getAttribute('data-step'),points,viewport:page.viewportSize()});};
 await page.goto(`${origin}/?art=npr-sample`);await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();
 await page.waitForFunction(()=>document.getElementById('statusTag').textContent==='训练中');
 await page.waitForFunction(()=>{const root=document.getElementById('movementGuide'),time=Number(root.dataset.timeMs);return root.dataset.task==='chop'&&time>=2950&&time<3380;});
 await page.locator('#pauseBtn').click();await capture('chop-down');const waiting=await state();assert.equal(waiting.chop,'0/15');assert.equal(waiting.inventory,'0/0/0');
 const frozen=await joints(),time=await page.locator('#movementGuide').getAttribute('data-time-ms');await page.waitForTimeout(400);assert.deepEqual(await joints(),frozen);assert.equal(await page.locator('#movementGuide').getAttribute('data-time-ms'),time);assert.deepEqual(await state(),waiting);
 await page.locator('#demoToggle').click();await page.locator('#pauseBtn').click();
 await page.waitForFunction(()=>document.getElementById('app').dataset.phase==='active'&&document.getElementById('movementGuide').dataset.task==='load',null,{timeout:120000});
 await page.waitForFunction(()=>{const time=Number(document.getElementById('movementGuide').dataset.timeMs);return time>=2350&&time<2780;});
 await page.locator('#pauseBtn').click();await capture('load-squat');
 const desktop=await joints();assert.ok(desktop.find(p=>p.joint==='leftKnee').x<80);assert.ok(desktop.find(p=>p.joint==='rightKnee').x>145);
 for(const viewport of [{width:1920,height:1080},{width:601,height:768},{width:390,height:844}]){await page.setViewportSize(viewport);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await capture(`layout-${viewport.width}x${viewport.height}`);}
 await page.setViewportSize({width:1366,height:768});await page.locator('#pauseBtn').click();
 await page.waitForFunction(()=>document.getElementById('app').dataset.phase==='active'&&document.getElementById('movementGuide').dataset.task==='carry',null,{timeout:120000});
 const hold=await joints();await page.waitForTimeout(400);assert.deepEqual(await joints(),hold);await page.locator('#pauseBtn').click();const carryPause=await state();await page.waitForTimeout(400);assert.deepEqual(await state(),carryPause);await capture('carry-hold');
 const cameraCalls=await page.evaluate(()=>window.guideCameraCalls);
 const unexpectedHTTP=httpErrors.filter(item=>!(item.url===`${origin}/favicon.ico`&&item.status===404));
 const unexpectedConsole=consoleErrors.filter(item=>!(item.url===`${origin}/favicon.ico`&&/404/.test(item.text)));
 const report={input:'Normal-speed production UI only; no clock/controller mutation',media:'Authored SVG and synthetic farm PNGs only; no video or real person',browser:browser.version(),frames,waiting,carryPause,cameraCalls,errors,consoleErrors,httpErrors,poseRequests,external,result:errors.length||external.length||cameraCalls||poseRequests.length||unexpectedConsole.length||unexpectedHTTP.length?'fail':'pass'};
 await writeFile(resolve(output,'production.json'),JSON.stringify(report,null,2)+'\n');assert.equal(report.result,'pass');console.log(JSON.stringify({result:report.result,frames:frames.length,cameraCalls,errors,external,carryPause}));
}finally{await context.close();await browser.close();}
