import {test,expect,type Page} from '@playwright/test';
import {enableAutomaticDemo} from '../helpers/explicitAutoDemo.js';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
async function thirdStep(page:Page){
 await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
}
async function cameraClosed(page:Page){
  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
  await expect(page.locator('#cameraVideo')).toHaveJSProperty('srcObject',null,{timeout:500});
 await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);
 expect(await page.evaluate(()=>window.upperFixture.tracks.length)).toBe(1);
 expect(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);
 await expect(page.locator('#cameraVideo')).toHaveJSProperty('srcObject',null);
 await expect(page.locator('#cameraFrames')).toHaveText('0');await expect(page.locator('#cameraMetrics')).toHaveText('');
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-finished','true');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');
 await expect(page.locator('#cameraTrackingStatus')).toContainText('识别已关闭');
}
test('third pose immediately shuts down recognition even while animation playback is stopped',async({page})=>{
 await thirdStep(page);await page.locator('#setupAnimationStop').click();
 await page.evaluate(()=>{window.upperFixture.pose='hold';});await cameraClosed(page);
 await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.evaluate(()=>{window.upperFixture.pose='raised';window.upperFixture.moved=true;window.upperFixture.resized=true;window.upperFixture.low=true;});
 await page.waitForTimeout(1500);await cameraClosed(page);await expect(page.locator('#chopValue')).toHaveText('0/15');
 expect(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'))).toBe('false');
 await page.locator('#animationStop').click();await enableAutomaticDemo(page);await expect(page.locator('#resultsModal')).toBeVisible({timeout:15000});
 await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#actualMetrics')).toContainText('自动模拟');
 await expect(page.locator('#actualMetrics')).not.toContainText('摄像头姿态代理');
 expect(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'))).toBe('true');
 await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);
});
test('completion closes recognition immediately but keeps a tutorial pause until manual continuation',async({page})=>{
 await thirdStep(page);await page.locator('#setupTutorial').click();
 await page.evaluate(()=>{window.upperFixture.pose='hold';});await cameraClosed(page);
 await expect(page.locator('#tutorialModal')).toBeVisible();await page.waitForTimeout(500);await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.locator('#tutorialClose').click();await expect(page.locator('#statusTag')).not.toHaveText('训练中');
 await page.locator('#pauseBtn').click();await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#modeBadge')).toContainText('键盘');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
});
