import {test,expect,type Page} from '@playwright/test';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
import {mkdir} from 'node:fs/promises';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
const output='artifacts/qa/preparation-recovery-20261027';
async function start(page:Page){await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');}
const pose=(page:Page,value:'lowered'|'raised'|'hold')=>page.evaluate(value=>{window.upperFixture.pose=value;},value);

test('brief loss at step two pauses sampling and resumes the same step without restarting completed evidence',async({page})=>{
 await start(page);await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#upperBodyReason')).toContainText('不够清晰');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await expect(page.locator('#upperBodyStepCount')).toContainText('1/3');await expect(page.locator('#upperBodyReason')).toContainText('保留');await expect(page.locator('#beginCamera')).toBeDisabled();
 await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/recovering-synthetic.png`});await page.waitForTimeout(400);await page.evaluate(()=>{window.upperFixture.low=false;});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await pose(page,'raised');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
 await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-recovering','true');await expect(page.locator('#upperBodyStepCount')).toContainText('2/3');await page.waitForTimeout(300);await page.evaluate(()=>{window.upperFixture.low=false;});await pose(page,'hold');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-finished','true');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});await expect(page.locator('#modeBadge')).toContainText('键盘');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
});

test('sustained loss clears the checkpoint and cannot turn partial preparation into readiness',async({page})=>{
 await start(page);await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-recovering','true');await page.waitForTimeout(3300);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');await expect(page.locator('#upperBodyStepCount')).toContainText('0/3');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
});
