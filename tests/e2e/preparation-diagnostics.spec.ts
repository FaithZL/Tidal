import {test,expect,type Page} from '@playwright/test';
import {installPoseFixture} from '../helpers/browserPoseFixture.js';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
async function secondStep(page:Page){
 await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
}
test('reports the reset source independently of subsequent low confidence and names the current joint',async({page})=>{
 await secondStep(page);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');
 await expect(page.locator('#upperBodyLastReset')).toContainText('页面进入后台');
 await expect(page.locator('#upperBodyLastReset')).toContainText('1/2 → 0/2');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));window.upperFixture.low=true;});
 await expect(page.locator('#upperBodyJointQuality')).toContainText('右手腕：不清晰');
 await expect(page.locator('#upperBodyLastReset')).toContainText('页面进入后台');
 await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#beginCamera')).toBeDisabled();
});
test('explains insufficient raise range and sampling without changing preparation or counting',async({page})=>{
 await secondStep(page);
 await expect(page.locator('#upperBodyReason')).toContainText('肩上');
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
 await expect(page.locator('#upperBodySampleStatus')).toContainText('样本');
 await expect(page.locator('#upperBodyStepCount')).toContainText('1/2');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
});

for(const fromDemo of [false,true])test(`visible blur keeps incomplete preparation checkpoints and automatic start (${fromDemo?'demo entry':'initial setup'})`,async({page})=>{
 if(fromDemo){
  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:12000});await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
 }else await secondStep(page);
 const countsBefore=await page.locator('#chopValue').textContent();
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await expect(page.locator('#upperBodyStepCount')).toContainText('1/2');
 await expect(page.locator('#upperBodySuspendNotice')).toContainText('保留准备进度');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
 await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#upperBodyStepCount')).toContainText('2/2');await expect(page.locator('#chopValue')).toHaveText(countsBefore!);
});

test('completed visibility loss preserves a deliberate animation stop and cannot start or count',async({page})=>{
 await secondStep(page);await page.locator('#setupAnimationStop').click();await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');await expect(page.locator('#upperBodyStepCount')).toContainText('2/2');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');await page.waitForTimeout(3400);await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#chopValue')).toHaveText('0/15');
});

test('a later timeout replaces the visible-blur preservation notice with the real reset state',async({page})=>{
 await secondStep(page);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#upperBodySuspendNotice')).toContainText('保留准备进度');await page.evaluate(()=>{window.upperFixture.low=true;});await page.waitForTimeout(3300);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');await expect(page.locator('#upperBodySuspendNotice')).not.toContainText('保留准备进度');await expect(page.locator('#upperBodyLastReset')).toContainText('有效数据中断超过3秒');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.evaluate(()=>{window.upperFixture.low=false;window.upperFixture.pose='lowered';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#setupModal')).toBeHidden();
});
test('actual active training invalidates live readiness, saves calibration and pauses on visible blur',async({page})=>{
 await secondStep(page);await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});
 const before=await page.locator('#chopValue').textContent();
 // Sample the blur boundary in its event task, before the next valid camera frame restores tracking.
 const suspended=await page.evaluate(()=>{
  window.dispatchEvent(new Event('blur'));
  return {step:document.getElementById('upperBodyPreparation')!.dataset.step,
   ready:document.getElementById('upperBodyPreparation')!.dataset.ready,
   beginDisabled:(document.getElementById('beginCamera') as HTMLButtonElement).disabled};
 });
 expect(suspended).toEqual({step:'complete',ready:'false',beginDisabled:true});
 await expect(page.locator('#upperBodyStepCount')).toContainText('2/2');await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#chopValue')).toHaveText(before!);
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','true');
 await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#chopValue')).toHaveText(before!);
});
test('full-body preparation keeps its original reset policy on visible blur',async({page})=>{
 await installPoseFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraExerciseMode').selectOption('full-body');await page.locator('#cameraStart').click();await expect(page.locator('#calibrationCapture')).toBeEnabled();await page.locator('#calibrationCapture').click();await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step','chop-raised');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step','standing');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
});
