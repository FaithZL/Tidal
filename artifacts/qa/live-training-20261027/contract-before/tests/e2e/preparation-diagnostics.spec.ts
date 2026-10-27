import {test,expect,type Page} from '@playwright/test';
import {installPoseFixture} from '../helpers/browserPoseFixture.js';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
async function thirdStep(page:Page){
 await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
}
test('reports the reset source independently of subsequent low confidence and names the current joint',async({page})=>{
 await thirdStep(page);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');
 await expect(page.locator('#upperBodyLastReset')).toContainText('页面进入后台');
 await expect(page.locator('#upperBodyLastReset')).toContainText('2/3 → 0/3');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));window.upperFixture.low=true;});
 await expect(page.locator('#upperBodyJointQuality')).toContainText('右手腕：不清晰');
 await expect(page.locator('#upperBodyLastReset')).toContainText('页面进入后台');
 await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#beginCamera')).toBeDisabled();
});
test('explains hold separation and sampling without changing preparation or counting',async({page})=>{
 await thirdStep(page);
 await expect(page.locator('#upperBodyHoldGate')).toContainText('与举起');
 await expect(page.locator('#upperBodyHoldGate')).toContainText('不足');
 await expect(page.locator('#upperBodySampleStatus')).toContainText('样本');
 await expect(page.locator('#upperBodyStepCount')).toContainText('2/3');await expect(page.locator('#chopValue')).toHaveText('0/15');
});

for(const fromDemo of [false,true])test(`visible blur keeps incomplete preparation checkpoints but cancels automatic start (${fromDemo?'demo entry':'initial setup'})`,async({page})=>{
 if(fromDemo){
  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:12000});await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
 }else await thirdStep(page);
 const countsBefore=await page.locator('#chopValue').textContent();
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await expect(page.locator('#upperBodyStepCount')).toContainText('2/3');
 await expect(page.locator('#upperBodySuspendNotice')).toContainText('保留准备进度');
 await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
 await page.waitForTimeout(3600);await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#chopValue')).toHaveText(countsBefore!);
});

test('completed visibility loss keeps recognition closed and cannot silently resume or count',async({page})=>{
 await thirdStep(page);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-finished','true');await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');await page.waitForTimeout(3400);await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#chopValue')).toHaveText('0/15');
});

test('a later timeout replaces the visible-blur preservation notice with the real reset state',async({page})=>{
 await thirdStep(page);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#upperBodySuspendNotice')).toContainText('保留准备进度');await page.evaluate(()=>{window.upperFixture.low=true;});await page.waitForTimeout(3300);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');await expect(page.locator('#upperBodySuspendNotice')).not.toContainText('保留准备进度');await expect(page.locator('#upperBodySuspendNotice')).toContainText('自动开始已取消');await expect(page.locator('#upperBodyLastReset')).toContainText('有效数据中断超过3秒');
});
test('manual play after recognition closure pauses on visible blur and cannot reopen recognition',async({page})=>{
 await thirdStep(page);await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#statusTag')).not.toHaveText('训练中');const before=await page.locator('#chopValue').textContent();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-finished','true');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#beginCamera')).toBeDisabled();await page.waitForTimeout(500);await expect(page.locator('#chopValue')).toHaveText(before!);await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);await expect(page.locator('#cameraFrames')).toHaveText('0');
});
test('full-body preparation keeps its original reset policy on visible blur',async({page})=>{
 await installPoseFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraExerciseMode').selectOption('full-body');await page.locator('#cameraStart').click();await expect(page.locator('#calibrationCapture')).toBeEnabled();await page.locator('#calibrationCapture').click();await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step','chop-raised');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step','standing');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
});
