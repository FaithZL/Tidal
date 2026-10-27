import {test,expect} from '@playwright/test';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
test('completing both preparation poses keeps the live camera counting while simulation stays off',async({page})=>{
 await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.evaluate(()=>{window.upperFixture.pose='raised';});
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
 await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(1);
 expect(await page.evaluate(()=>window.upperFixture.tracks.length)).toBe(1);expect(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='live'))).toBe(true);
 await expect(page.locator('#cameraVideo')).not.toHaveJSProperty('srcObject',null);
 await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#modeBadge')).toContainText('上半身');
 await page.waitForTimeout(1500);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#loadValue')).toHaveText('0/15');
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');await page.waitForTimeout(400);
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#chopValue')).toHaveText('1/15');
 await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#statusTag')).not.toHaveText('训练中');await page.waitForTimeout(500);await expect(page.locator('#chopValue')).toHaveText('1/15');await expect(page.locator('#upperBodyStepCount')).toContainText('2/2');
 await page.evaluate(()=>{window.upperFixture.low=false;});await expect(page.locator('#statusTag')).toHaveText('训练中');
 await page.locator('#demoToggle').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');await page.locator('#pauseBtn').click();await expect(page.locator('#modeBadge')).toContainText('自动模拟');
 await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);
 await expect.poll(async()=>parseInt(await page.locator('#chopValue').textContent()??'0')).toBeGreaterThan(1);
});
test('an unrecognized saved preference does not enable automatic play',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','invalid'));await page.goto('/?e2e=1');
 await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await page.waitForTimeout(500);await expect(page.locator('#app')).toHaveAttribute('data-phase','home');await expect(page.locator('#chopValue')).toHaveText('0/15');
});
