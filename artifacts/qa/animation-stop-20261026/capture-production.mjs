/** Normal production controls only. Synthetic farm/SVG screenshots; no camera/video. */
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:4176',output=resolve('artifacts/qa/animation-stop-20261026/production');
await mkdir(output,{recursive:true});const browser=await chromium.launch({channel:'chromium',headless:true});
const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1});
const errors=[],external=[],httpErrors=[],consoleErrors=[],frames=[];
try{
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});page.on('response',response=>{if(response.status()>=400)httpErrors.push({url:response.url(),status:response.status()});});
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.protocol!=='data:'&&url.origin!==origin){external.push(url.href);return route.abort();}return route.continue();});
 await page.addInitScript(()=>{localStorage.setItem('tidal.demo.enabled','true');window.animationCameraCalls=0;navigator.mediaDevices.getUserMedia=async()=>{window.animationCameraCalls++;throw new Error('No camera needed');};});
 const state=()=>page.evaluate(()=>{const world=document.getElementById('worldCanvas'),guide=document.getElementById('movementGuide');return {phase:document.getElementById('app').dataset.phase,chop:document.getElementById('chopValue').textContent,load:document.getElementById('loadValue').textContent,carry:document.getElementById('carryValue').textContent,inventory:world.dataset.inventory,hand:world.dataset.hand,foot:world.dataset.footPose,blade:world.dataset.blade,cart:world.dataset.cartPosition,guide:guide.dataset.timeMs};});
 const capture=async name=>{await page.screenshot({path:resolve(output,`${name}.png`)});frames.push({file:`${name}.png`,viewport:page.viewportSize(),state:await state()});};
 await page.goto(`${origin}/?art=npr-sample`);await page.waitForFunction(()=>document.getElementById('statusTag').textContent==='训练中');
 await page.waitForFunction(()=>document.getElementById('worldCanvas').dataset.action==='chop-down');await page.locator('#animationStop').click();const stopped=await state();
 await page.waitForTimeout(500);assert.deepEqual(await state(),stopped);assert.equal(await page.locator('#statusTag').textContent(),'已暂停');await capture('world-stopped');
 await page.locator('#animationStop').click();await page.waitForFunction(previous=>document.getElementById('chopValue').textContent!==previous,stopped.chop,{timeout:15000});await capture('world-resumed');
 await page.locator('#animationStop').click();await page.locator('#tutorialOpen').click();await page.locator('#tutorialAnimationStop').click();
 assert.equal(await page.locator('#statusTag').textContent(),'已暂停');const behind=await state();await page.waitForTimeout(450);assert.deepEqual(await state(),behind);assert.equal(await page.locator('#tutorialModal').getAttribute('data-playing'),'true');
 await page.locator('#tutorialAnimationStop').click();const time=await page.locator('#tutorialModal').getAttribute('data-time-ms');await page.waitForTimeout(350);assert.equal(await page.locator('#tutorialModal').getAttribute('data-time-ms'),time);await capture('teaching-stopped');
 await page.setViewportSize({width:390,height:844});await capture('mobile-teaching');assert.ok(await page.locator('#tutorialAnimationStop').isVisible());
 await page.locator('#tutorialClose').click();await capture('mobile-world');
 const layout=await page.evaluate(()=>{const button=document.getElementById('animationStop').getBoundingClientRect();const view=document.querySelector('.view-controls').getBoundingClientRect();return {button:button.toJSON(),view:view.toJSON(),width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth};});
 assert.equal(layout.overflow,false);assert.ok(layout.button.left>=0&&layout.button.right<=layout.width&&layout.button.bottom<layout.view.top);
 const cameraCalls=await page.evaluate(()=>window.animationCameraCalls);const report={input:'Normal production UI controls; no controller/clock mutation',media:'Synthetic PNGs only, no recording or physical camera',browser:browser.version(),frames,stopped,trainingBehindTeachingRemainsPaused:behind,teachingTimeFrozen:time,layout,cameraCalls,errors,external,consoleErrors,httpErrors,result:errors.length||external.length||cameraCalls||consoleErrors.length||httpErrors.length?'fail':'pass'};
 await writeFile(resolve(output,'production.json'),JSON.stringify(report,null,2)+'\n');assert.equal(report.result,'pass');console.log(JSON.stringify({result:report.result,frames:frames.length,cameraCalls,errors,external}));
}finally{await context.close();await browser.close();}
