import {test,expect,type Page} from '@playwright/test';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
async function active(page:Page){
 await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
 await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});
}
async function loop(page:Page,task:'chop'|'load',count:number){
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(task==='chop'?' · chop-down ·':' · press-up ·');
 await page.waitForTimeout(task==='chop'?400:800);await page.evaluate(()=>{window.upperFixture.pose='lowered';});
 await expect(page.locator(task==='chop'?'#chopValue':'#loadValue')).toHaveText(`${count}/15`);
}
test('a rejected runtime frame cannot erase this session calibration or carry a half rep across recovery',async({page})=>{
 await active(page);await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');
 await page.evaluate(()=>{window.upperFixture.resized=true;});await expect(page.locator('#statusTag')).not.toHaveText('训练中');
 await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#setupModal')).toBeHidden();
 await expect(page.locator('#cameraTrackingStatus')).not.toContainText('1200');await expect(page.locator('#upperBodyProgress')).toHaveJSProperty('hidden',true);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-training','true');
 await page.waitForTimeout(1500);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');
 await page.evaluate(()=>{window.upperFixture.resized=false;window.upperFixture.pose='lowered';});
 await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await expect(page.locator('#chopValue')).toHaveText('0/15');
 await loop(page,'chop',1);await expect(page.locator('#setupModal')).toBeHidden();
});
test('one initial preparation survives both task transitions and carry loss while only valid motions earn progress',async({page})=>{
 test.setTimeout(180000);await active(page);
 await page.evaluate(()=>{const app=document.getElementById('app')!;const observer=new MutationObserver(()=>{if(app.dataset.phase==='rest')window.upperFixture.resized=true;});observer.observe(app,{attributes:true,attributeFilter:['data-phase']});});
 for(const task of ['chop','load'] as const){
  for(let i=1;i<=15;i++)await loop(page,task,i);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','rest');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');
  await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#setupModal')).toBeHidden();
  await page.waitForTimeout(700);await expect(page.locator('#app')).toHaveAttribute('data-phase','rest');
  await page.evaluate(()=>{window.upperFixture.resized=false;window.upperFixture.pose='lowered';});await expect(page.locator('#statusTag')).toHaveText('训练中');
  await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');
 }
 await expect(page.locator('#missionTitle')).toContainText('返回');await page.evaluate(()=>{window.upperFixture.pose='hold';});
 await expect.poll(async()=>parseFloat((await page.locator('#carryValue').textContent())!)).toBeGreaterThan(.1);
 await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#statusTag')).not.toHaveText('训练中');const before=await page.locator('#carryValue').textContent();
 await page.waitForTimeout(700);await expect(page.locator('#carryValue')).toHaveText(before!);await expect(page.locator('#setupModal')).toBeHidden();
 await page.evaluate(()=>{window.upperFixture.low=false;window.upperFixture.pose='lowered';});await expect(page.locator('#statusTag')).toHaveText('训练中');await page.waitForTimeout(400);await expect(page.locator('#carryValue')).toHaveText(before!);
 await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});
 await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
 expect(await page.evaluate(()=>window.upperFixture.maxWorkers)).toBe(1);await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);
});
