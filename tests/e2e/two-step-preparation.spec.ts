import {test,expect} from '@playwright/test';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});

test('only lowered and raised preparation are required before automatic live training',async({page})=>{
 await installUpperBodyFixture(page);await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#acceptPlan')).toBeEnabled();
 await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
 await page.evaluate(()=>{window.upperFixture.pose='left-only';});await page.waitForTimeout(1400);
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.evaluate(()=>{
  const node=document.getElementById('upperBodyPreparation')!;
  new MutationObserver(()=>{if(node.dataset.step==='hold')node.dataset.requestedThirdStep='true';}).observe(node,{attributes:true,attributeFilter:['data-step']});
  window.upperFixture.pose='raised';
 });
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
 await expect(page.locator('#upperBodyStepCount')).toContainText('2/2');
 expect(await page.locator('#upperBodyPreparation').getAttribute('data-requested-third-step')).toBeNull();
 await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#setupModal')).toBeHidden();
 await page.waitForTimeout(500);await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');await page.waitForTimeout(400);
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#chopValue')).toHaveText('1/15');
 await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-training','true');
 expect(await page.evaluate(()=>({tracks:window.upperFixture.tracks.length,state:window.upperFixture.tracks[0].readyState,workers:window.upperFixture.workers}))).toEqual({tracks:1,state:'live',workers:1});
});
