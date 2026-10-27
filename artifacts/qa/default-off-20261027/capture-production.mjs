import {chromium,expect} from '@playwright/test';
import {installUpperBodyFixture} from '../../../tests/helpers/browserUpperBodyFixture.ts';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:4176',output=resolve('artifacts/qa/default-off-20261027/production');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const context=await browser.newContext({viewport:{width:1366,height:768}}),errors=[],consoleErrors=[],httpErrors=[],external=[],screenshots=[];
try{
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.protocol!=='data:'&&url.origin!==origin){external.push(url.href);return route.abort();}return route.continue();});
 await installUpperBodyFixture(page);await page.goto(`${origin}/?art=npr-sample`);await expect(page.locator('#acceptPlan')).toBeEnabled();
 await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#app')).toHaveAttribute('data-phase','home');
 assert.equal(await page.evaluate(()=>window.upperFixture.tracks.length),0);await page.waitForTimeout(1000);await expect(page.locator('#chopValue')).toHaveText('0/15');
 for(const [name,width,height] of [['default-off-desktop.png',1366,768],['default-off-mobile.png',390,844]]){
  await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:resolve(output,name)});screenshots.push(name);
 }
 await page.setViewportSize({width:1366,height:768});await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
 await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-finished','true');
 await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#cameraVideo')).toHaveJSProperty('srcObject',null);await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);
 assert.equal(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='ended')),true);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});
 await page.evaluate(()=>{window.upperFixture.low=true;window.upperFixture.pose='raised';});await page.waitForTimeout(1000);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#modeBadge')).toContainText('键盘演示');
 await page.screenshot({path:resolve(output,'after-three-still-off.png')});screenshots.push('after-three-still-off.png');
 await page.locator('#actionBtn').click();await expect(page.locator('#chopValue')).toHaveText('1/15');
 await page.locator('#demoToggle').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');await page.locator('#pauseBtn').click();await expect.poll(async()=>parseInt(await page.locator('#chopValue').textContent()??'0')).toBeGreaterThan(1);
 assert.equal(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled')),'true');await page.locator('#demoToggle').click();await page.reload();await expect(page.locator('#acceptPlan')).toBeEnabled();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#app')).toHaveAttribute('data-phase','home');
 const report={input:'Normal production build; fresh profile, then fake video and authored landmarks for preparation',result:'pass',defaultOff:true,noInitialCameraRequest:true,noAutomaticProgress:true,threePoseCompletionKeepsDemoOff:true,cameraAndWorkerStopped:true,manualInputCountsOne:true,explicitEnableWorks:true,manualOffSurvivesReload:true,mobileOverflow:false,screenshots,errors,consoleErrors,httpErrors,external};
 await writeFile(resolve(output,'production.json'),JSON.stringify(report,null,2)+'\n');assert.deepEqual({errors,consoleErrors,httpErrors,external},{errors:[],consoleErrors:[],httpErrors:[],external:[]});console.log(JSON.stringify(report));
}finally{await context.close();await browser.close();}
