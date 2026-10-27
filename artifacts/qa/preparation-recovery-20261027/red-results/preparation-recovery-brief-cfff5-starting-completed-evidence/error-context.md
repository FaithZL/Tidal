# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: preparation-recovery.spec.ts >> brief loss at step two pauses sampling and resumes the same step without restarting completed evidence
- Location: tests/e2e/preparation-recovery.spec.ts:9:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#upperBodyPreparation')
Expected: "raised"
Received: "lowered"
Timeout:  7000ms

Call log:
  - Expect "toHaveAttribute" locator('#upperBodyPreparation') with timeout 7000ms
  - waiting for locator('#upperBodyPreparation')
    18 × locator resolved to <section data-step="lowered" aria-label="上半身自动准备" id="upperBodyPreparation" class="upper-body-preparation">…</section>
       - unexpected value "lowered"

```

```yaml
- region "上半身自动准备":
  - text: 无需点击采集 上半身自动准备
  - heading "放下双手" [level=3]
  - paragraph: 坐稳或站稳，双手停在肩下、胸腹前，手腕留在画面内，保持片刻。
  - progressbar "当前上半身姿态采集进度"
  - status: 肩、肘或手腕不够清晰，请让六个关节保持可见
  - text: 砍树 / 装车：双手放下 → 举起 → 放下。拉车：双臂前举保持。只识别上半身，不测器械重量。
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  3  | import {mkdir} from 'node:fs/promises';
  4  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  5  | const output='artifacts/qa/preparation-recovery-20261027';
  6  | async function start(page:Page){await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');}
  7  | const pose=(page:Page,value:'lowered'|'raised'|'hold')=>page.evaluate(value=>{window.upperFixture.pose=value;},value);
  8  | 
  9  | test('brief loss at step two pauses sampling and resumes the same step without restarting completed evidence',async({page})=>{
> 10 |  await start(page);await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#upperBodyReason')).toContainText('不够清晰');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await expect(page.locator('#upperBodyStepCount')).toContainText('1/3');await expect(page.locator('#upperBodyReason')).toContainText('保留');await expect(page.locator('#beginCamera')).toBeDisabled();
     |                                                                                                                                                                                                      ^ Error: expect(locator).toHaveAttribute(expected) failed
  11 |  await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/recovering-synthetic.png`});await page.waitForTimeout(400);await page.evaluate(()=>{window.upperFixture.low=false;});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await pose(page,'raised');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
  12 |  await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-recovering','true');await expect(page.locator('#upperBodyStepCount')).toContainText('2/3');await page.waitForTimeout(300);await page.evaluate(()=>{window.upperFixture.low=false;});await pose(page,'hold');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});await expect(page.locator('#chopValue')).toHaveText('0/15');
  13 | });
  14 | 
  15 | test('sustained loss clears the checkpoint and cannot turn partial preparation into readiness',async({page})=>{
  16 |  await start(page);await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-recovering','true');await page.waitForTimeout(3300);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');await expect(page.locator('#upperBodyStepCount')).toContainText('0/3');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  17 | });
  18 | 
```