import {test,expect,type Page} from '@playwright/test';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
async function savedAfterBlur(page:Page){
 await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await expect(page.locator('#finishUpperPreparation')).toBeHidden();
 await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));window.upperFixture.pose='raised';});
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
 await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
}
test('completion offers a direct exit from preparation and keeps the same live camera for a real recognized rep',async({page})=>{
 await savedAfterBlur(page);await expect(page.locator('#finishUpperPreparation')).toBeVisible();await expect(page.locator('#finishUpperPreparation')).toBeEnabled();
 await expect(page.locator('#upperBodyCue')).toContainText('已保存');await expect(page.locator('#upperBodyCue')).toContainText('摄像头');
 await page.locator('#finishUpperPreparation').click();await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#statusTag')).toHaveText('训练中');
 expect(await page.evaluate(()=>window.upperFixture.tracks.length)).toBe(1);expect(await page.evaluate(()=>window.upperFixture.tracks[0].readyState)).toBe('live');
 await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#modeBadge')).toContainText('上半身');
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');await page.waitForTimeout(400);
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#chopValue')).toHaveText('1/15');
});
test('the finish shortcut cannot bypass lost tracking or an explicit animation stop',async({page})=>{
 await savedAfterBlur(page);await page.evaluate(()=>{window.upperFixture.moved=true;});
 await expect(page.locator('#finishUpperPreparation')).toBeVisible();await expect(page.locator('#finishUpperPreparation')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.locator('#setupAnimationStop').click();await page.evaluate(()=>{window.upperFixture.moved=false;});await expect(page.locator('#finishUpperPreparation')).toBeEnabled({timeout:6000});
 await page.locator('#finishUpperPreparation').click();await expect(page.locator('#setupModal')).toBeHidden();await page.waitForTimeout(700);
 await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#chopValue')).toHaveText('0/15');
});
for(const paused of [false,true])test(`manual completion releases only the pause owned by preparation (existing user pause: ${paused})`,async({page})=>{
 await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));await page.goto('/?e2e=1&art=npr-sample');
 await expect(page.locator('#statusTag')).toHaveText('训练中');if(paused)await page.locator('#pauseBtn').click();
 await page.locator('#cameraMode').click();const before=await page.locator('#chopValue').textContent();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.evaluate(()=>{window.upperFixture.pose='raised';});
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await page.evaluate(()=>{window.upperFixture.pose='hold';});
 await expect(page.locator('#finishUpperPreparation')).toBeEnabled();await page.locator('#finishUpperPreparation').click();await expect(page.locator('#setupModal')).toBeHidden();
 await expect(page.locator('#statusTag')).toHaveText(paused?'已暂停':'训练中');await expect(page.locator('#chopValue')).toHaveText(before!);
 expect(await page.evaluate(()=>window.upperFixture.tracks[0].readyState)).toBe('live');
});
