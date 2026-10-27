# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: completed-recovery.spec.ts >> saved completed calibration survives outside before start and resumes its authorized automatic start
- Location: tests/e2e/completed-recovery.spec.ts:10:50

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#upperBodyPreparation')
Expected: "complete"
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
  - status: 请把双肩、双肘和双手都放进镜头
  - status: 最近重新准备：关节出框 · 3/3 → 0/3
  - text: 左肩：可用 99% · 右肩：可用 99% · 左肘：可用 99% · 右肘：可用 99% · 左手腕：可用 99% · 右手腕：出框 99%
  - group: 查看采集状态
  - text: 砍树 / 装车：双手放下 → 举起 → 放下。拉车：双臂前举保持。只识别上半身，不测器械重量。
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {installUpperBodyFixture,type UpperPose} from '../helpers/browserUpperBodyFixture.js';
  3  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  4  | const pose=(page:Page,value:UpperPose)=>page.evaluate(value=>{window.upperFixture.pose=value;},value);
  5  | async function prepare(page:Page){
  6  |  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await pose(page,'raised');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await pose(page,'hold');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
  7  | }
  8  | async function active(page:Page){await prepare(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});}
  9  | async function loop(page:Page,task:'chop'|'load',count:number){await pose(page,'lowered');await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await pose(page,'raised');await expect(page.locator('#inputDebug')).toContainText(task==='chop'?' · chop-down ·':' · press-up ·');await page.waitForTimeout(task==='chop'?400:800);await pose(page,'lowered');await expect(page.locator(task==='chop'?'#chopValue':'#loadValue')).toHaveText(`${count}/15`);}
  10 | for(const fault of ['outside','absent'] as const)test(`saved completed calibration survives ${fault} before start and resumes its authorized automatic start`,async({page})=>{
> 11 |  await prepare(page);await page.evaluate(fault=>{window.upperFixture[fault]=true;},fault);await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#upperBodyStep')).toContainText('标定已保存');await page.waitForTimeout(3300);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');await expect(page.locator('#chopValue')).toHaveText('0/15');
     |                                                                                                                                                                                                         ^ Error: expect(locator).toHaveAttribute(expected) failed
  12 |  await page.evaluate(fault=>{window.upperFixture[fault]=false;},fault);await page.waitForTimeout(500);await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:12000});await expect(page.locator('#chopValue')).toHaveText('0/15');
  13 | });
  14 | test('active loss drops the half rep, retains calibration, and resumes through a fresh source epoch',async({page})=>{
  15 |  await active(page);await pose(page,'lowered');await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await pose(page,'raised');await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');const epoch=(await page.locator('#inputDebug').textContent())!.match(/epoch (\d+)/)![1];await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#cameraTrackingStatus')).toContainText('标定已保存');await page.waitForTimeout(3300);await expect(page.locator('#chopValue')).toHaveText('0/15');
  16 |  await page.evaluate(()=>{window.upperFixture.low=false;});await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:6000});await expect(page.locator('#inputDebug')).not.toContainText(`epoch ${epoch} ·`);await pose(page,'lowered');await page.waitForTimeout(400);await expect(page.locator('#chopValue')).toHaveText('0/15');await loop(page,'chop',1);
  17 | });
  18 | test('visibility interrupts completed calibration without discarding it or authorizing automatic resume',async({page})=>{
  19 |  await prepare(page);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#beginCamera')).toBeDisabled();await page.waitForTimeout(3300);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await expect(page.locator('#beginCamera')).toBeEnabled({timeout:6000});await page.waitForTimeout(3400);await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');
  20 | });
  21 | test('a real anchor change or explicit camera stop still clears completed calibration',async({page})=>{
  22 |  await prepare(page);await page.evaluate(()=>{window.upperFixture.moved=true;});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');await expect(page.locator('#upperBodyLastReset')).toContainText('身体或机位变化');await expect(page.locator('#beginCamera')).toBeDisabled();await page.locator('#cameraStop').click();await expect(page.locator('#upperBodyStepCount')).toContainText('0/3');await expect(page.locator('#chopValue')).toHaveText('0/15');
  23 | });
  24 | 
```