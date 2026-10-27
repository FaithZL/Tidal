import {test,expect} from '@playwright/test';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';

test.use({baseURL:'http://127.0.0.1:4173',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
test('camera countdown keeps the same remaining numeral visible through early and repeated tracking interruptions',async({page})=>{
 await installUpperBodyFixture(page);await page.goto('/?art=npr-sample');
 await expect(page.locator('#acceptPlan')).toBeEnabled();await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});
 await expect(page.locator('#app')).toHaveAttribute('data-phase','countdown');
 for(const seconds of [5,4,3]){
  await expect(page.locator('#countdown')).toHaveText(`${seconds}做好准备，即将开始`);
  await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#countdown')).toContainText('等待追踪');
  // Losing tracking must never replace the remaining numeral with a new start/wait card.
  await expect.poll(()=>page.locator('#countdown').evaluate(node=>node.firstChild?.textContent)).toBe(String(seconds));
  await expect(page.locator('#countdown')).not.toHaveClass(/compact/);
  await page.waitForTimeout(350);await expect(page.locator('#countdown')).toContainText(String(seconds));
  await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#upperBodyStepCount')).toContainText('2/2');
  await expect(page.locator('#setupModal')).toBeHidden();
  await page.evaluate(()=>{window.upperFixture.low=false;});
  await expect(page.locator('#countdown')).toHaveText(`${seconds}做好准备，即将开始`);
 }
 await expect(page.locator('#statusTag')).toHaveText('训练中');
 await expect(page.locator('#countdown')).toBeHidden();
 await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#countdown')).toContainText('等待追踪');
 await page.evaluate(()=>{window.upperFixture.low=false;});await expect(page.locator('#statusTag')).toHaveText('训练中');
 await expect(page.locator('#app')).toHaveAttribute('data-phase','active');await expect(page.locator('#countdown')).toBeHidden();
 await expect(page.locator('#chopValue')).toHaveText('0/15');
});
