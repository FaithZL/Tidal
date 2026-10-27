import {test,expect,type Page} from '@playwright/test';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
async function prepare(page:Page,explicitStop=false){
 await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
 if(explicitStop)await page.locator('#setupAnimationStop').click();
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
}
test('explicitly paused completed preparation keeps 2/2 and blocks start until returning to the original position',async({page})=>{
 await prepare(page,true);await page.evaluate(()=>{window.upperFixture.moved=true;});
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');await expect(page.locator('#upperBodyStepCount')).toContainText('2/2');
 await expect(page.locator('#upperBodyReason')).toContainText('位置');await expect(page.locator('#upperBodyCue')).toContainText('原位置');
 await page.waitForTimeout(3400);await expect(page.locator('#upperBodyStepCount')).toContainText('2/2');await expect(page.locator('#beginCamera')).toBeDisabled();
 await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.evaluate(()=>{window.upperFixture.moved=false;});await page.waitForTimeout(500);await expect(page.locator('#beginCamera')).toBeDisabled();
 await expect(page.locator('#beginCamera')).toBeEnabled();await expect(page.locator('#statusTag')).not.toHaveText('训练中');await page.locator('#beginCamera').click();await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:12000});await expect(page.locator('#chopValue')).toHaveText('0/15');
});
test('active position change cannot count or carry a half rep across recovery',async({page})=>{
 await prepare(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');
 const before=(await page.locator('#inputDebug').textContent())!.match(/epoch (\d+)/)![1];
 await page.evaluate(()=>{window.upperFixture.moved=true;});await expect(page.locator('#statusTag')).not.toHaveText('训练中');
 await expect(page.locator('#upperBodyStepCount')).toContainText('2/2');await expect(page.locator('#setupModal')).toBeHidden();
 await expect(page.locator('#cameraTrackingStatus')).toContainText('位置');await page.waitForTimeout(3400);await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.evaluate(()=>{window.upperFixture.moved=false;});await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:6000});
 await expect(page.locator('#inputDebug')).not.toContainText(`epoch ${before} ·`);
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');await page.waitForTimeout(400);
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#chopValue')).toHaveText('1/15');
});
test('returning to the original position cannot release a manual animation stop',async({page})=>{
 await prepare(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});
 await page.evaluate(()=>{window.upperFixture.moved=true;});await expect(page.locator('#statusTag')).not.toHaveText('训练中');
 await page.locator('#animationStop').click();await page.evaluate(()=>{window.upperFixture.moved=false;});
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','true',{timeout:6000});await page.waitForTimeout(500);
 await expect(page.locator('#upperBodyStepCount')).toContainText('2/2');await expect(page.locator('#statusTag')).not.toHaveText('训练中');
 await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
});
