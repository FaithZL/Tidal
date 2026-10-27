/** Normal production UI only: no landmark fixture, controller access, clock mutation or physical camera. */
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';

const origin='http://127.0.0.1:4176';
const output=resolve('artifacts/qa/upper-body-flow-20261026/production');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true});
const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1});
const errors=[],consoleErrors=[],external=[],httpErrors=[],screenshots=[],layouts=[],observations={};
let failure=null;
try{
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 page.on('response',response=>{if(response.status()>=400)httpErrors.push({url:response.url(),status:response.status()});});
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.protocol!=='data:'&&url.origin!==origin){external.push(url.href);return route.abort();}
  return route.continue();
 });
 await page.addInitScript(()=>{
  window.productionCameraCalls=0;
  navigator.mediaDevices.getUserMedia=async()=>{window.productionCameraCalls++;throw new DOMException('Production UI review: no physical camera','NotAllowedError');};
 });
 const calls=()=>page.evaluate(()=>window.productionCameraCalls);
 const outcomes=()=>page.evaluate(()=>({
  chop:document.getElementById('chopValue').textContent,
  load:document.getElementById('loadValue').textContent,
  carry:document.getElementById('carryValue').textContent,
  inventory:document.getElementById('worldCanvas').dataset.inventory,
 }));
 const capture=async name=>{assert.ok(screenshots.length<5);await page.screenshot({path:resolve(output,`${name}.png`)});screenshots.push({file:`${name}.png`,viewport:page.viewportSize()});};
 const layout=async(selector,name)=>{
  await page.locator(selector).scrollIntoViewIfNeeded();
  const value=await page.locator(selector).evaluate(element=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,bounds:element.getBoundingClientRect().toJSON()}));
  assert.equal(value.overflow,false);assert.ok(value.bounds.left>=0&&value.bounds.right<=value.width);assert.ok(value.bounds.top>=0&&value.bounds.bottom<=page.viewportSize().height);
  layouts.push({name,selector,...value});
 };
 await page.goto(`${origin}/?art=npr-sample`);
 await page.waitForFunction(()=>document.getElementById('statusTag').textContent==='训练中');
 await page.locator('#cameraMode').click();
 assert.equal(await page.locator('#statusTag').textContent(),'已暂停');
 assert.equal(await page.locator('#cameraExerciseMode').inputValue(),'upper-body');
 await page.waitForFunction(()=>!document.getElementById('upperBodyPreparation').hidden&&document.getElementById('calibrationPanel').hidden);
 assert.equal(await calls(),0);
 observations.beforePreparation=await outcomes();
 observations.defaultMode=await page.locator('#cameraExerciseMode').inputValue();
 observations.initialPreparation={step:await page.locator('#upperBodyStep').textContent(),cue:await page.locator('#upperBodyCue').textContent(),note:await page.locator('#upperBodyPreparation small').textContent()};
 assert.equal(observations.initialPreparation.step,'放下双手');
 assert.match(observations.initialPreparation.note,/只识别上半身/);
 assert.match(await page.locator('#setupModal').textContent(),/三个姿态/);
 assert.equal(await page.locator('#beginCamera').isDisabled(),true);
 await layout('#upperBodyPreparation','desktop-upper-preparation');
 await capture('upper-body-desktop');

 await page.locator('#setupTutorial').click();
 await page.locator('#tutorialTabs [data-task="load"]').click();
 assert.equal(await page.locator('#tutorialModal').getAttribute('data-program'),'upper-body');
 assert.equal(await page.locator('#tutorialStepList button').count(),3);
 assert.match(await page.locator('#tutorialSummary').textContent(),/上半身/);
 observations.teaching=[];
 for(let index=0;index<3;index++){
  await page.locator('#tutorialStepList button').nth(index).click();
  const step={title:await page.locator('#tutorialStepTitle').textContent(),cue:await page.locator('#tutorialCue').textContent()};
  assert.doesNotMatch(`${step.title} ${step.cue}`,/下蹲|蹲下/);observations.teaching.push(step);
 }
 await page.locator('#tutorialStepList button').nth(1).click();
 await capture('upper-body-teaching');
 await page.locator('#tutorialClose').click();
 assert.equal(await calls(),0);

 await page.locator('#cameraExerciseMode').selectOption('full-body');
 await page.waitForFunction(()=>document.getElementById('upperBodyPreparation').hidden&&!document.getElementById('calibrationPanel').hidden);
 if(!await page.locator('#calibrationPanel').evaluate(element=>element.open))await page.locator('#calibrationPanel summary').click();
 assert.equal(await page.locator('#calibrationPanel').getAttribute('data-step'),'standing');
 assert.equal(await page.locator('#calibrationCapture').isDisabled(),true);
 assert.match(await page.locator('#calibrationCapture').textContent(),/采集自然站立/);
 assert.equal(await page.locator('#calibrationSide').isVisible(),true);
 observations.legacyFullBody={step:await page.locator('#calibrationPanel').getAttribute('data-step'),button:await page.locator('#calibrationCapture').textContent(),sideSelectorVisible:true};
 await page.locator('#calibrationInstruction').scrollIntoViewIfNeeded();
 await capture('full-body-manual-desktop');
 assert.equal(await calls(),0);
 await page.locator('#cameraExerciseMode').selectOption('upper-body');
 await page.waitForFunction(()=>!document.getElementById('upperBodyPreparation').hidden&&document.getElementById('calibrationPanel').hidden);
 assert.equal(await calls(),0);
 observations.modeRoundTripPermissionCalls=await calls();
 assert.deepEqual(await outcomes(),observations.beforePreparation);

 await page.setViewportSize({width:390,height:844});
 await layout('#cameraExerciseMode','mobile-mode-choice');
 await layout('#upperBodyPreparation','mobile-upper-preparation');
 await capture('upper-body-mobile');
 await page.locator('#cameraStart').click();
 await page.waitForFunction(()=>document.getElementById('cameraStatus').textContent.includes('权限被拒绝'));
 assert.equal(await calls(),1);
 assert.equal(await page.locator('#demoToggle').getAttribute('aria-checked'),'false');
 assert.equal(await page.locator('#beginCamera').isDisabled(),true);
 observations.permissionError=await page.locator('#cameraStatus').textContent();
 await layout('#beginCamera','mobile-manual-start-fallback');
 await capture('denied-mobile-bottom');
 observations.afterUI=await outcomes();
 assert.deepEqual(observations.afterUI,observations.beforePreparation);
 observations.permissionCalls=await calls();
 assert.deepEqual({errors,consoleErrors,httpErrors,external},{errors:[],consoleErrors:[],httpErrors:[],external:[]});
}catch(error){failure=error instanceof Error?error.stack:String(error);}
finally{
 const report={result:failure?'fail':'pass',input:'Normal built production UI; explicit camera request denied by local test stub; no landmarks/controller/clock mutation',media:'Generated farm/UI PNGs only; no physical camera, recording or saved real pose data',limits:'This capture checks the initial large preparation cue, declared three-pose instructions, teaching steps and legacy manual UI. Actual automatic raised/hold progression and counting are covered separately by authored-landmark E2E, not by this permission-denied capture.',browser:browser.version(),screenshots,layouts,observations,errors,consoleErrors,httpErrors,external,failure};
 await writeFile(resolve(output,'production.json'),JSON.stringify(report,null,2)+'\n');
 await context.close();await browser.close();
 console.log(JSON.stringify({result:report.result,screenshots:screenshots.length,errors,consoleErrors,httpErrors,external,permissionCalls:observations.permissionCalls,failure}));
}
if(failure)throw new Error(failure);
