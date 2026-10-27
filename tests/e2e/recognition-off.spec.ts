import {test,expect,type Page} from '@playwright/test';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
async function thirdStep(page:Page){
 await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
}
async function cameraLive(page:Page){
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');
 await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(1);expect(await page.evaluate(()=>window.upperFixture.tracks.length)).toBe(1);
 expect(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='live'))).toBe(true);await expect(page.locator('#cameraVideo')).not.toHaveJSProperty('srcObject',null);
 await expect(page.locator('#cameraFrames')).not.toHaveText('0');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
 await expect(page.locator('#cameraTrackingStatus')).not.toContainText('识别已关闭');
}
async function recognizedRep(page:Page){
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');await page.waitForTimeout(400);
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#chopValue')).toHaveText('1/15');
}
test('third pose keeps recognition live but cannot override animation stop or count invalid motion',async({page})=>{
 await thirdStep(page);await page.locator('#setupAnimationStop').click();await page.evaluate(()=>{window.upperFixture.pose='hold';});await cameraLive(page);
 await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');await page.waitForTimeout(3500);await expect(page.locator('#setupModal')).toBeVisible();
 await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.evaluate(()=>{window.upperFixture.pose='raised';window.upperFixture.moved=true;window.upperFixture.low=true;});
 await page.waitForTimeout(1500);await cameraLive(page);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#finishUpperPreparation')).toBeDisabled();
 await page.evaluate(()=>{window.upperFixture.pose='hold';window.upperFixture.moved=false;window.upperFixture.low=false;});await expect(page.locator('#finishUpperPreparation')).toBeEnabled();
 await page.locator('#finishUpperPreparation').click();await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#statusTag')).not.toHaveText('训练中');
 await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('训练中');await cameraLive(page);await recognizedRep(page);
 expect(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'))).toBe('false');await expect(page.locator('#modeBadge')).toContainText('上半身');
 await page.locator('#resetBtn').click();await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);
 await expect(page.locator('#cameraVideo')).toHaveJSProperty('srcObject',null);await expect(page.locator('#upperBodyStepCount')).toContainText('0/3');await expect(page.locator('#chopValue')).toHaveText('0/15');
});
test('completion keeps the camera live but tutorial exit alone cannot authorize training',async({page})=>{
 await thirdStep(page);await page.locator('#setupTutorial').click();await page.evaluate(()=>{window.upperFixture.pose='hold';});await cameraLive(page);
 await expect(page.locator('#tutorialModal')).toBeVisible();await page.waitForTimeout(3500);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#statusTag')).not.toHaveText('训练中');
 await page.locator('#tutorialClose').click();await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#setupModal')).toBeVisible();
 await page.locator('#finishUpperPreparation').click();await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#setupModal')).toBeHidden();await cameraLive(page);
 await expect(page.locator('#modeBadge')).toContainText('上半身');await recognizedRep(page);
});
