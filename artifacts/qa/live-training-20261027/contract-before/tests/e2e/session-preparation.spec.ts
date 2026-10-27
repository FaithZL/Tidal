import {test,expect,type Page} from '@playwright/test';
import {enableAutomaticDemo} from '../helpers/explicitAutoDemo.js';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
async function complete(page:Page,paused=false){
 await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
 if(paused)await page.locator('#setupAnimationStop').click();
 await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-finished','true');
 await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);
}
async function closed(page:Page,completed=true){await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#cameraFrames')).toHaveText('0');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');await expect(page.locator('#upperBodyStepCount')).toContainText(completed?'3/3':'0/3');if(completed)await expect(page.locator('#cameraTrackingStatus')).toContainText('识别已关闭');else await expect(page.locator('#cameraTrackingStatus')).toHaveText('');expect(await page.locator('#cameraVideo').evaluate((v:HTMLVideoElement)=>v.srcObject===null)).toBe(true);}
test('a resized frame and later rep cannot be recognized after the three preparations finish',async({page})=>{
 await complete(page,true);await closed(page);await expect(page.locator('#upperBodyProgress')).toHaveJSProperty('hidden',true);
 await page.evaluate(()=>{window.upperFixture.resized=true;window.upperFixture.pose='raised';});await page.waitForTimeout(1500);await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.evaluate(()=>{window.upperFixture.resized=false;window.upperFixture.pose='lowered';});await page.waitForTimeout(400);await expect(page.locator('#chopValue')).toHaveText('0/15');await closed(page);await expect(page.locator('#modeBadge')).toContainText('键盘');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
});
test('both task transitions and carry finish as labelled automatic play without any later recognition',async({page})=>{
 test.setTimeout(180000);await complete(page);await closed(page);await enableAutomaticDemo(page);await expect(page.locator('#modeBadge')).toContainText('自动模拟');
 await page.evaluate(()=>{window.upperFixture.resized=true;window.upperFixture.low=true;window.upperFixture.absent=true;});
 await expect(page.locator('#missionTitle')).toContainText('装');await expect(page.locator('#chopValue')).toHaveText('15/15');await closed(page,false);
 await expect(page.locator('#missionTitle')).toContainText('返回');await expect(page.locator('#loadValue')).toHaveText('15/15');await closed(page,false);
 await expect.poll(async()=>parseFloat((await page.locator('#carryValue').textContent())!)).toBeGreaterThan(.1);await page.locator('#pauseBtn').click();const before=await page.locator('#carryValue').textContent();
 await page.waitForTimeout(700);await expect(page.locator('#carryValue')).toHaveText(before!);await expect(page.locator('#setupModal')).toBeHidden();
 await page.evaluate(()=>{window.upperFixture.low=false;window.upperFixture.pose='hold';});await page.waitForTimeout(400);await expect(page.locator('#carryValue')).toHaveText(before!);
 await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});
 await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');await expect(page.locator('#actualMetrics')).toContainText('自动模拟');
 expect(await page.evaluate(()=>window.upperFixture.maxWorkers)).toBe(1);await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);
});
