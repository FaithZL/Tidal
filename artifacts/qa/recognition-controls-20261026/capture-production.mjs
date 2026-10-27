import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:4176',output='/Users/zero/work/ai_ws/Tidal/artifacts/qa/recognition-controls-20261026/production';
await mkdir(output,{recursive:true});const browser=await chromium.launch({channel:'chromium',headless:true});
const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1});
const errors=[],consoleErrors=[],external=[],httpErrors=[],screenshots=[];
try{
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});page.on('response',response=>{if(response.status()>=400)httpErrors.push({url:response.url(),status:response.status()});});
 await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.protocol!=='data:'&&url.origin!==origin){external.push(url.href);return route.abort();}return route.continue();});
 await page.addInitScript(()=>{window.cameraCalls=0;navigator.mediaDevices.getUserMedia=async()=>{window.cameraCalls++;throw new DOMException('Production UI review: no physical camera','NotAllowedError');};});
 const capture=async name=>{await page.screenshot({path:`${output}/${name}.png`});screenshots.push(`${name}.png`);};
 await page.goto(`${origin}/?art=npr-sample`);await page.waitForFunction(()=>document.getElementById('statusTag').textContent==='训练中');
 await page.locator('#cameraMode').click();assert.equal(await page.locator('#statusTag').textContent(),'已暂停');assert.equal(await page.locator('#recognitionLeniency').inputValue(),'3');await page.locator('[data-leniency="5"]').click();await page.locator('#recognitionControls').scrollIntoViewIfNeeded();await capture('settings-desktop');
 assert.equal(await page.locator('#beginCamera').isDisabled(),true);assert.equal(await page.evaluate(()=>window.cameraCalls),0);await page.reload();await page.waitForFunction(()=>document.body.dataset.boot==='ready');await page.locator('#cameraMode').click();assert.equal(await page.locator('#recognitionLeniency').inputValue(),'5');
 await page.locator('#cameraStart').click();await page.waitForFunction(()=>document.getElementById('cameraStatus').textContent.includes('权限被拒绝'));assert.equal(await page.locator('#beginCamera').isDisabled(),true);assert.equal(await page.locator('#demoToggle').getAttribute('aria-checked'),'false');await page.locator('#recognitionControls').scrollIntoViewIfNeeded();await capture('denied-explicit');
 await page.setViewportSize({width:390,height:844});await page.locator('#recognitionControls').scrollIntoViewIfNeeded();await capture('settings-mobile');const layout=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,range:document.getElementById('recognitionLeniency').getBoundingClientRect().toJSON()}));assert.equal(layout.overflow,false);assert.ok(layout.range.left>=0&&layout.range.right<=390);
 await page.locator('#beginCamera').scrollIntoViewIfNeeded();await capture('settings-mobile-bottom');assert.equal(await page.locator('#beginCamera').isVisible(),true);
 const report={input:'Normal production UI; no controller/clock mutation; explicit permission button denied by test stub',media:'Generated farm/UI PNGs; no real camera, recording or pose trajectories',browser:browser.version(),screenshots,layout,defaultLevel:3,persistedLevel:5,permissionCalls:await page.evaluate(()=>window.cameraCalls),errors,consoleErrors,httpErrors,external};
 await writeFile(`${output}/production.json`,JSON.stringify(report,null,2)+'\n');assert.deepEqual({errors,consoleErrors,httpErrors,external},{errors:[],consoleErrors:[],httpErrors:[],external:[]});assert.equal(report.permissionCalls,1);console.log(JSON.stringify({result:'pass',screenshots:screenshots.length,errors,consoleErrors,httpErrors,external,layout}));
}finally{await context.close();await browser.close();}
