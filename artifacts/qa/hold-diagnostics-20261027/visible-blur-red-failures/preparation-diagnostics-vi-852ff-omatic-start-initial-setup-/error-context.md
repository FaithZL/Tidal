# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: preparation-diagnostics.spec.ts >> visible blur keeps incomplete preparation checkpoints but cancels automatic start (initial setup)
- Location: tests/e2e/preparation-diagnostics.spec.ts:28:36

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#upperBodyPreparation')
Expected: "hold"
Received: "lowered"
Timeout:  7000ms

Call log:
  - Expect "toHaveAttribute" locator('#upperBodyPreparation') with timeout 7000ms
  - waiting for locator('#upperBodyPreparation')
    18 × locator resolved to <section data-step="lowered" aria-label="上半身自动准备" data-recovering="false" id="upperBodyPreparation" class="upper-body-preparation">…</section>
       - unexpected value "lowered"

```

```yaml
- region "上半身自动准备":
  - text: 无需点击采集 已完成 0/3
  - heading "放下双手" [level=3]
  - paragraph: 坐稳或站稳，双手停在肩下、胸腹前，手腕留在画面内，保持片刻。
  - progressbar "当前上半身姿态采集进度"
  - status: 请将双手放下到肩膀下方，手腕仍留在画面内
  - status: 最近重新准备：窗口失焦 · 2/3 → 0/3
  - text: 左肩：可用 99% · 右肩：可用 99% · 左肘：可用 99% · 右肘：可用 99% · 左手腕：可用 99% · 右手腕：可用 99%
  - group: 查看采集状态
  - text: 砍树 / 装车：双手放下 → 举起 → 放下。拉车：双臂前举保持。只识别上半身，不测器械重量。
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  3  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  4  | async function thirdStep(page:Page){
  5  |  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
  6  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
  7  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
  8  |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
  9  | }
  10 | test('reports the reset source independently of subsequent low confidence and names the current joint',async({page})=>{
  11 |  await thirdStep(page);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  12 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');
  13 |  await expect(page.locator('#upperBodyLastReset')).toContainText('页面进入后台');
  14 |  await expect(page.locator('#upperBodyLastReset')).toContainText('2/3 → 0/3');
  15 |  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));window.upperFixture.low=true;});
  16 |  await expect(page.locator('#upperBodyJointQuality')).toContainText('右手腕：不清晰');
  17 |  await expect(page.locator('#upperBodyLastReset')).toContainText('页面进入后台');
  18 |  await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#beginCamera')).toBeDisabled();
  19 | });
  20 | test('explains hold separation and sampling without changing preparation or counting',async({page})=>{
  21 |  await thirdStep(page);
  22 |  await expect(page.locator('#upperBodyHoldGate')).toContainText('与举起');
  23 |  await expect(page.locator('#upperBodyHoldGate')).toContainText('不足');
  24 |  await expect(page.locator('#upperBodySampleStatus')).toContainText('样本');
  25 |  await expect(page.locator('#upperBodyStepCount')).toContainText('2/3');await expect(page.locator('#chopValue')).toHaveText('0/15');
  26 | });
  27 | 
  28 | for(const fromDemo of [false,true])test(`visible blur keeps incomplete preparation checkpoints but cancels automatic start (${fromDemo?'demo entry':'initial setup'})`,async({page})=>{
  29 |  if(fromDemo){
  30 |   await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:12000});await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
  31 |  }else await thirdStep(page);
  32 |  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
> 33 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await expect(page.locator('#upperBodyStepCount')).toContainText('2/3');
     |                                                      ^ Error: expect(locator).toHaveAttribute(expected) failed
  34 |  await expect(page.locator('#upperBodySuspendNotice')).toContainText('保留准备进度');
  35 |  await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
  36 |  await page.waitForTimeout(3600);await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#chopValue')).toHaveText('0/15');
  37 | });
  38 | 
```