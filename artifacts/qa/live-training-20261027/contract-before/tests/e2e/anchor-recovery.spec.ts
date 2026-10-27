import {test,expect,type Page} from '@playwright/test';
import {enableAutomaticDemo} from '../helpers/explicitAutoDemo.js';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
async function prepare(page:Page,paused=false){
 await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
 if(paused)await page.locator('#setupAnimationStop').click();
 await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-finished','true');
 await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);
}
async function closed(page:Page,completed=true){await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');await expect(page.locator('#upperBodyStepCount')).toContainText(completed?'3/3':'0/3');await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#cameraFrames')).toHaveText('0');expect(await page.locator('#cameraVideo').evaluate((video:HTMLVideoElement)=>video.srcObject===null)).toBe(true);if(completed)await expect(page.locator('#cameraTrackingStatus')).toContainText('识别已关闭');else await expect(page.locator('#cameraTrackingStatus')).toHaveText('');}
test('completed preparation closes recognition so later position changes do not require returning to the anchor',async({page})=>{
 await prepare(page);await closed(page);await enableAutomaticDemo(page);await page.evaluate(()=>{window.upperFixture.moved=true;});await closed(page,false);
 await expect(page.locator('#modeBadge')).toContainText('自动模拟');await expect.poll(async()=>parseInt((await page.locator('#chopValue').textContent())!)).toBeGreaterThan(0);
 await page.evaluate(()=>{window.upperFixture.moved=false;});await closed(page,false);expect(await page.evaluate(()=>window.upperFixture.maxWorkers)).toBe(1);
});
test('a position change and later half or full motion cannot count once recognition has closed',async({page})=>{
 await prepare(page,true);await closed(page);await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await page.waitForTimeout(400);
 await page.evaluate(()=>{window.upperFixture.pose='raised';window.upperFixture.moved=true;});await page.waitForTimeout(400);
 await page.evaluate(()=>{window.upperFixture.moved=false;window.upperFixture.pose='lowered';});await page.waitForTimeout(400);
 await expect(page.locator('#chopValue')).toHaveText('0/15');await closed(page);await expect(page.locator('#statusTag')).not.toHaveText('训练中');
});
test('returning to the original position after closure cannot release a manual animation stop',async({page})=>{
 await prepare(page,true);await page.evaluate(()=>{window.upperFixture.moved=true;});await page.waitForTimeout(300);await page.evaluate(()=>{window.upperFixture.moved=false;});await page.waitForTimeout(500);
 await closed(page);await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#modeBadge')).toContainText('键盘');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);
});
