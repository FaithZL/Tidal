import {test,expect,type Page} from '@playwright/test';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
async function thirdStepAfterBlur(page:Page){
 await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await expect(page.locator('#finishUpperPreparation')).toBeHidden();
 await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));window.upperFixture.pose='raised';});
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
}
async function closed(page:Page){await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-finished','true');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#cameraTrackingStatus')).toContainText('识别已关闭');await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);expect(await page.locator('#cameraVideo').evaluate((v:HTMLVideoElement)=>v.srcObject===null)).toBe(true);}
test('completion exits preparation and closes recognition even when visibility cancelled automatic start',async({page})=>{
 await thirdStepAfterBlur(page);await page.evaluate(()=>{window.upperFixture.pose='hold';});await closed(page);
 await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#upperBodyCue')).toContainText('关闭');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await page.waitForTimeout(400);await page.evaluate(()=>{window.upperFixture.pose='lowered';});await page.waitForTimeout(400);await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.locator('#pauseBtn').click();await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#modeBadge')).toContainText('键盘');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');expect(await page.evaluate(()=>window.upperFixture.tracks.length)).toBe(1);
});
test('incomplete preparation cannot bypass tracking and completion cannot override an animation stop',async({page})=>{
 await thirdStepAfterBlur(page);await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');await expect(page.locator('#finishUpperPreparation')).toBeHidden();await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.locator('#setupAnimationStop').click();await page.evaluate(()=>{window.upperFixture.low=false;window.upperFixture.pose='hold';});await closed(page);await page.waitForTimeout(700);
 await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#chopValue')).toHaveText('0/15');
});
for(const paused of [false,true])test(`automatic completion releases only the pause owned by preparation (existing user pause: ${paused})`,async({page})=>{
 await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));await page.goto('/?e2e=1&art=npr-sample');
 await expect(page.locator('#statusTag')).toHaveText('训练中');if(paused)await page.locator('#pauseBtn').click();
 await page.locator('#cameraMode').click();const before=await page.locator('#chopValue').textContent();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.evaluate(()=>{window.upperFixture.pose='raised';});
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await page.evaluate(()=>{window.upperFixture.pose='hold';});await closed(page);
 await expect(page.locator('#statusTag')).toHaveText(paused?'已暂停':'训练中');
 await page.waitForTimeout(700);await expect(page.locator('#chopValue')).toHaveText(before!);
 await expect(page.locator('#modeBadge')).toContainText('键盘');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
});
