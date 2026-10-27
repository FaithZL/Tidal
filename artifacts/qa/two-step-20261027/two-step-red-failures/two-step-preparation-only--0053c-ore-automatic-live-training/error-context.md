# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: two-step-preparation.spec.ts >> only lowered and raised preparation are required before automatic live training
- Location: tests/e2e/two-step-preparation.spec.ts:5:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#upperBodyPreparation')
Expected: "complete"
Received: "hold"
Timeout:  7000ms

Call log:
  - Expect "toHaveAttribute" locator('#upperBodyPreparation') with timeout 7000ms
  - waiting for locator('#upperBodyPreparation')
    7 × locator resolved to <section data-step="raised" data-ready="false" aria-label="上半身自动准备" data-training="false" data-recovering="false" id="upperBodyPreparation" data-revalidating="false" class="upper-body-preparation">…</section>
      - unexpected value "raised"
    11 × locator resolved to <section data-step="hold" data-ready="false" aria-label="上半身自动准备" data-training="false" data-recovering="false" id="upperBodyPreparation" data-revalidating="false" class="upper-body-preparation" data-requested-third-step="true">…</section>
       - unexpected value "hold"

```

```yaml
- region "上半身自动准备":
  - text: 无需点击采集 已完成 2/3
  - heading "双臂前举" [level=3]
  - paragraph: 双手向前，保持舒适屈臂持姿；与刚才上举、放下姿态区分。
  - progressbar "当前上半身姿态采集进度"
  - status: 双臂前举持姿需与刚才举起、放下的位置区分
  - text: 左肩：可用 99% · 右肩：可用 99% · 左肘：可用 99% · 右肘：可用 99% · 左手腕：可用 99% · 右手腕：可用 99%
  - group: 查看采集状态
  - text: 砍树 / 装车：双手放下 → 举起 → 放下。拉车：双臂前举保持。只识别上半身，不测器械重量。
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  3  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  4  | 
  5  | test('only lowered and raised preparation are required before automatic live training',async({page})=>{
  6  |  await installUpperBodyFixture(page);await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#acceptPlan')).toBeEnabled();
  7  |  await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
  8  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
  9  |  await page.evaluate(()=>{window.upperFixture.pose='left-only';});await page.waitForTimeout(1400);
  10 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await expect(page.locator('#chopValue')).toHaveText('0/15');
  11 |  await page.evaluate(()=>{
  12 |   const node=document.getElementById('upperBodyPreparation')!;
  13 |   new MutationObserver(()=>{if(node.dataset.step==='hold')node.dataset.requestedThirdStep='true';}).observe(node,{attributes:true,attributeFilter:['data-step']});
  14 |   window.upperFixture.pose='raised';
  15 |  });
> 16 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
     |                                                      ^ Error: expect(locator).toHaveAttribute(expected) failed
  17 |  await expect(page.locator('#upperBodyStepCount')).toContainText('2/2');
  18 |  expect(await page.locator('#upperBodyPreparation').getAttribute('data-requested-third-step')).toBeNull();
  19 |  await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#setupModal')).toBeHidden();
  20 |  await page.waitForTimeout(500);await expect(page.locator('#chopValue')).toHaveText('0/15');
  21 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
  22 |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');await page.waitForTimeout(400);
  23 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#chopValue')).toHaveText('1/15');
  24 |  await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-training','true');
  25 |  expect(await page.evaluate(()=>({tracks:window.upperFixture.tracks.length,state:window.upperFixture.tracks[0].readyState,workers:window.upperFixture.workers}))).toEqual({tracks:1,state:'live',workers:1});
  26 | });
  27 | 
```