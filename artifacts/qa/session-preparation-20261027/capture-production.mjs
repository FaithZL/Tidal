import {chromium,expect} from '@playwright/test';
import {installUpperBodyFixture} from '../../../tests/helpers/browserUpperBodyFixture.ts';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:4176',output=resolve('artifacts/qa/session-preparation-20261027/production');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const context=await browser.newContext({viewport:{width:1366,height:768}}),errors=[],consoleErrors=[],httpErrors=[],external=[],screenshots=[];
try{
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.protocol!=='data:'&&url.origin!==origin){external.push(url.href);return route.abort();}return route.continue();});
 await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto(`${origin}/?art=npr-sample`);await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
 await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-training','false');
 await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:18000});
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-training','true');
 await expect(page.locator('#upperBodyProgress')).toHaveJSProperty('hidden',true);
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');
 await page.evaluate(()=>{window.upperFixture.resized=true;});await expect(page.locator('#statusTag')).not.toHaveText('训练中');
 await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#setupModal')).toBeHidden();
 await expect(page.locator('#cameraTrackingStatus')).toContainText('无需重复准备');await expect(page.locator('#cameraTrackingStatus')).not.toContainText('恢复 0%');
 await page.waitForTimeout(1500);await expect(page.locator('#chopValue')).toHaveText('0/15');
 for(const [name,width,height] of [['runtime-waiting-desktop-synthetic.png',1366,768],['runtime-waiting-mobile-synthetic.png',390,844]]){
  await page.setViewportSize({width,height});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:resolve(output,name)});screenshots.push(name);
 }
 await page.setViewportSize({width:1366,height:768});
 await page.evaluate(()=>{window.upperFixture.resized=false;window.upperFixture.pose='lowered';});await expect(page.locator('#statusTag')).toHaveText('训练中');
 await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');await page.waitForTimeout(400);
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#chopValue')).toHaveText('1/15');
 await page.screenshot({path:resolve(output,'fresh-full-rep-synthetic.png')});screenshots.push('fresh-full-rep-synthetic.png');
 assert.equal(await page.evaluate(()=>window.upperFixture.maxWorkers),1);assert.equal(await page.evaluate(()=>window.upperFixture.tracks[0].readyState),'live');
 await page.reload();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-training','false');await expect(page.locator('#upperBodyStepCount')).toContainText('0/3');
 const report={input:'Normal production build; fake video and authored six landmarks, not physical-camera accuracy',result:'pass',initialPreparationRequired:true,sessionTemplateRetained:true,invalidFramesCannotCount:true,halfRepDiscarded:true,newFullRepCount:1,preparationProgressHidden:true,refreshRequiresNewPreparation:true,mobileOverflow:false,screenshots,errors,consoleErrors,httpErrors,external};
 await writeFile(resolve(output,'production.json'),JSON.stringify(report,null,2)+'\n');assert.deepEqual({errors,consoleErrors,httpErrors,external},{errors:[],consoleErrors:[],httpErrors:[],external:[]});console.log(JSON.stringify(report));
}finally{await context.close();await browser.close();}
