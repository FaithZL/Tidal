import {chromium,expect} from '@playwright/test';
import {installUpperBodyFixture} from '../../../tests/helpers/browserUpperBodyFixture.ts';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:4176',output=resolve('artifacts/qa/preparation-feedback-20261026/production');
await mkdir(output,{recursive:true});const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});const context=await browser.newContext({viewport:{width:1366,height:768}});
const errors=[],consoleErrors=[],external=[],httpErrors=[],screenshots=[];
try{
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.protocol!=='data:'&&url.origin!==origin){external.push(url.href);return route.abort();}return route.continue();});
 await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));await page.goto(`${origin}/?art=npr-sample`);await page.locator('#cameraMode').click();await page.evaluate(()=>{window.upperFixture.pose='left-only';});await page.locator('#cameraStart').click();await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','adjust');await expect(page.locator('#upperBodyReason')).toContainText('放下');
 const capture=async(locator,name)=>{await locator.screenshot({path:resolve(output,`${name}.png`)});screenshots.push(`${name}.png`);};
 await capture(page.locator('#cameraPreview'),'preparation-red-green-synthetic');await capture(page.locator('#upperBodyPreparation'),'preparation-target-synthetic');
 await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','unavailable');await expect(page.locator('#cameraFeedbackStatus')).toContainText('不够清晰');await expect(page.locator('#upperBodyReason')).toContainText('不够清晰');await capture(page.locator('#upperBodyPreparation'),'quality-reason-synthetic');
 const qualityMessage=await page.locator('#cameraFeedbackStatus').textContent();await page.evaluate(()=>{window.upperFixture.low=false;});await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','adjust');await page.evaluate(()=>{window.upperFixture.stalled=true;});await expect(page.locator('#cameraFeedbackStatus')).toContainText('没有新数据');await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','unavailable');await expect(page.locator('#chopValue')).toHaveText('0/15');
 const report={input:'Normal production build; fake video and authored six-point fixture, not physical camera or MediaPipe accuracy',screenshots,qualityMessage,staleMessage:await page.locator('#cameraFeedbackStatus').textContent(),result:'pass',errors,consoleErrors,httpErrors,external};await writeFile(resolve(output,'production.json'),JSON.stringify(report,null,2)+'\n');assert.deepEqual({errors,consoleErrors,httpErrors,external},{errors:[],consoleErrors:[],httpErrors:[],external:[]});console.log(JSON.stringify(report));
}finally{await context.close();await browser.close();}
