import {test,expect} from '@playwright/test';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';

// Use the normal five-second countdown, not the accelerated 180ms E2E mode.
test.use({baseURL:'http://127.0.0.1:4173',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
test('repeated tracking loss never rewinds entry or repeats the saved two-step preparation',async({page})=>{
 await installUpperBodyFixture(page);await page.goto('/?art=npr-sample');
 await expect(page.locator('#acceptPlan')).toBeEnabled();await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
 await page.evaluate(()=>{
  const app=document.getElementById('app')!,countdown=document.getElementById('countdown')!;
  const phases:string[]=[app.dataset.phase!],numbers:number[]=[];
  new MutationObserver(()=>{
   const phase=app.dataset.phase!;if(phases.at(-1)!==phase)phases.push(phase);
   const text=countdown.firstChild?.textContent??'';if(/^\d+$/.test(text))numbers.push(Number(text));
   app.dataset.observedPhases=JSON.stringify(phases);app.dataset.observedCountdown=JSON.stringify(numbers);
  }).observe(app,{subtree:true,attributes:true,attributeFilter:['data-phase'],childList:true});
  window.upperFixture.pose='raised';
 });
 for(const seconds of [4,3,2]){
  await expect(page.locator('#countdown')).toHaveText(`${seconds}做好准备，即将开始`);
  await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#countdown')).toContainText('等待追踪');
  await page.waitForTimeout(400);await expect(page.locator('#chopValue')).toHaveText('0/15');
  await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#upperBodyStepCount')).toContainText('2/2');
  await page.evaluate(()=>{window.upperFixture.low=false;});
  await expect.poll(async()=>Number((await page.locator('#countdown').textContent())?.match(/^\d+/)?.[0]??Infinity)).toBeLessThanOrEqual(seconds);
  const numbers=JSON.parse((await page.locator('#app').getAttribute('data-observed-countdown'))!) as number[];
  expect(numbers.every((n,i)=>i===0||n<=numbers[i-1])).toBe(true);
 }
 await expect(page.locator('#statusTag')).toHaveText('训练中');
 await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#countdown')).toContainText('等待追踪');
 await page.evaluate(()=>{window.upperFixture.low=false;window.upperFixture.pose='lowered';});await expect(page.locator('#statusTag')).toHaveText('训练中');
 await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');await page.waitForTimeout(400);
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#chopValue')).toHaveText('1/15');
 expect(JSON.parse((await page.locator('#app').getAttribute('data-observed-phases'))!)).toEqual(['setup','countdown','active']);
 await expect(page.locator('#upperBodyStepCount')).toContainText('2/2');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-training','true');
 await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
 expect(await page.evaluate(()=>({tracks:window.upperFixture.tracks.length,state:window.upperFixture.tracks[0].readyState,workers:window.upperFixture.workers}))).toEqual({tracks:1,state:'live',workers:1});
});
