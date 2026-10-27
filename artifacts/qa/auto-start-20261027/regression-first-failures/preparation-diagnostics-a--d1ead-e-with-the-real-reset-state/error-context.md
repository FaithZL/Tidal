# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: preparation-diagnostics.spec.ts >> a later timeout replaces the visible-blur preservation notice with the real reset state
- Location: tests/e2e/preparation-diagnostics.spec.ts:46:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#upperBodySuspendNotice')
Expected substring: "保留准备进度"
Received string:    "继续完成三步，保存后自动进入训练，无需点击开始。"
Timeout: 7000ms

Call log:
  - Expect "toContainText" locator('#upperBodySuspendNotice') with timeout 7000ms
  - waiting for locator('#upperBodySuspendNotice')
    18 × locator resolved to <p role="status" class="upper-body-suspend" id="upperBodySuspendNotice">继续完成三步，保存后自动进入训练，无需点击开始。</p>
       - unexpected value "继续完成三步，保存后自动进入训练，无需点击开始。"

```

```yaml
- status: 继续完成三步，保存后自动进入训练，无需点击开始。
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {installPoseFixture} from '../helpers/browserPoseFixture.js';
  3  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  4  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  5  | async function thirdStep(page:Page){
  6  |  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
  7  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
  8  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
  9  |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
  10 | }
  11 | test('reports the reset source independently of subsequent low confidence and names the current joint',async({page})=>{
  12 |  await thirdStep(page);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  13 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');
  14 |  await expect(page.locator('#upperBodyLastReset')).toContainText('页面进入后台');
  15 |  await expect(page.locator('#upperBodyLastReset')).toContainText('2/3 → 0/3');
  16 |  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));window.upperFixture.low=true;});
  17 |  await expect(page.locator('#upperBodyJointQuality')).toContainText('右手腕：不清晰');
  18 |  await expect(page.locator('#upperBodyLastReset')).toContainText('页面进入后台');
  19 |  await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#beginCamera')).toBeDisabled();
  20 | });
  21 | test('explains hold separation and sampling without changing preparation or counting',async({page})=>{
  22 |  await thirdStep(page);
  23 |  await expect(page.locator('#upperBodyHoldGate')).toContainText('与举起');
  24 |  await expect(page.locator('#upperBodyHoldGate')).toContainText('不足');
  25 |  await expect(page.locator('#upperBodySampleStatus')).toContainText('样本');
  26 |  await expect(page.locator('#upperBodyStepCount')).toContainText('2/3');await expect(page.locator('#chopValue')).toHaveText('0/15');
  27 | });
  28 | 
  29 | for(const fromDemo of [false,true])test(`visible blur keeps incomplete preparation checkpoints and automatic start (${fromDemo?'demo entry':'initial setup'})`,async({page})=>{
  30 |  if(fromDemo){
  31 |   await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:12000});await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
  32 |  }else await thirdStep(page);
  33 |  const countsBefore=await page.locator('#chopValue').textContent();
  34 |  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  35 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await expect(page.locator('#upperBodyStepCount')).toContainText('2/3');
  36 |  await expect(page.locator('#upperBodySuspendNotice')).toContainText('保留准备进度');
  37 |  await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
  38 |  await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#chopValue')).toHaveText(countsBefore!);
  39 | });
  40 | 
  41 | test('completed visibility loss preserves a deliberate animation stop and cannot start or count',async({page})=>{
  42 |  await thirdStep(page);await page.locator('#setupAnimationStop').click();await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  43 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');await page.waitForTimeout(3400);await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#chopValue')).toHaveText('0/15');
  44 | });
  45 | 
  46 | test('a later timeout replaces the visible-blur preservation notice with the real reset state',async({page})=>{
> 47 |  await thirdStep(page);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#upperBodySuspendNotice')).toContainText('保留准备进度');await page.evaluate(()=>{window.upperFixture.low=true;});await page.waitForTimeout(3300);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');await expect(page.locator('#upperBodySuspendNotice')).not.toContainText('保留准备进度');await expect(page.locator('#upperBodyLastReset')).toContainText('有效数据中断超过3秒');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
     |                                                                                                                                               ^ Error: expect(locator).toContainText(expected) failed
  48 |  await page.evaluate(()=>{window.upperFixture.low=false;window.upperFixture.pose='lowered';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#setupModal')).toBeHidden();
  49 | });
  50 | test('actual active training invalidates live readiness, saves calibration and pauses on visible blur',async({page})=>{
  51 |  await thirdStep(page);await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});const before=await page.locator('#chopValue').textContent();await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText(before!);
  52 | });
  53 | test('full-body preparation keeps its original reset policy on visible blur',async({page})=>{
  54 |  await installPoseFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraExerciseMode').selectOption('full-body');await page.locator('#cameraStart').click();await expect(page.locator('#calibrationCapture')).toBeEnabled();await page.locator('#calibrationCapture').click();await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step','chop-raised');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step','standing');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  55 | });
  56 | 
```