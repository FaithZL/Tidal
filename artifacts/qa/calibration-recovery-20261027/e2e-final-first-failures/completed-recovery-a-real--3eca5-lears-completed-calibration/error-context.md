# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: completed-recovery.spec.ts >> a real anchor change or explicit camera stop still clears completed calibration
- Location: tests/e2e/completed-recovery.spec.ts:21:1

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
    18 × locator resolved to <section data-ready="false" data-step="lowered" aria-label="上半身自动准备" data-recovering="false" id="upperBodyPreparation" data-revalidating="false" class="upper-body-preparation">…</section>
       - unexpected value "lowered"

```

```yaml
- region "上半身自动准备":
  - text: 无需点击采集 已完成 0/3
  - heading "放下双手" [level=3]
  - paragraph: 坐稳或站稳，双手停在肩下、胸腹前，手腕留在画面内，保持片刻。
  - progressbar "当前上半身姿态采集进度"
  - status: 点击开启摄像头后，按提示自动采集，无需点击每一步。
  - text: 左肩：未检测到 · 右肩：未检测到 · 左肘：未检测到 · 右肘：未检测到 · 左手腕：未检测到 · 右手腕：未检测到
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
> 6  |  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await pose(page,'raised');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await pose(page,'hold');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
     |                                                                                                                                                                                                                                                                                                          ^ Error: expect(locator).toHaveAttribute(expected) failed
  7  | }
  8  | async function active(page:Page){await prepare(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});}
  9  | async function loop(page:Page,task:'chop'|'load',count:number){await pose(page,'lowered');await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await pose(page,'raised');await expect(page.locator('#inputDebug')).toContainText(task==='chop'?' · chop-down ·':' · press-up ·');await page.waitForTimeout(task==='chop'?400:800);await pose(page,'lowered');await expect(page.locator(task==='chop'?'#chopValue':'#loadValue')).toHaveText(`${count}/15`);}
  10 | for(const fault of ['outside','absent'] as const)test(`saved completed calibration survives ${fault} before start and resumes its authorized automatic start`,async({page})=>{
  11 |  await prepare(page);await page.evaluate(fault=>{window.upperFixture[fault]=true;},fault);await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#upperBodyStep')).toContainText('标定已保存');await page.waitForTimeout(3300);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');await expect(page.locator('#chopValue')).toHaveText('0/15');
  12 |  await page.evaluate(fault=>{window.upperFixture[fault]=false;},fault);await page.waitForTimeout(500);await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:12000});await expect(page.locator('#chopValue')).toHaveText('0/15');
  13 | });
  14 | test('active loss drops the half rep, retains calibration, and resumes through a fresh source epoch',async({page})=>{
  15 |  await active(page);await pose(page,'lowered');await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await pose(page,'raised');await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');const epoch=(await page.locator('#inputDebug').textContent())!.match(/epoch (\d+)/)![1];await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#cameraTrackingStatus')).toContainText('标定已保存');await page.waitForTimeout(3300);await expect(page.locator('#chopValue')).toHaveText('0/15');
  16 |  await page.evaluate(()=>{window.upperFixture.low=false;});await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:6000});await expect(page.locator('#inputDebug')).not.toContainText(`epoch ${epoch} ·`);await pose(page,'lowered');await page.waitForTimeout(400);await expect(page.locator('#chopValue')).toHaveText('0/15');await loop(page,'chop',1);
  17 | });
  18 | test('visibility interrupts completed calibration without discarding it or authorizing automatic resume',async({page})=>{
  19 |  await prepare(page);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#beginCamera')).toBeDisabled();await page.waitForTimeout(3300);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await expect(page.locator('#beginCamera')).toBeEnabled({timeout:6000});await page.waitForTimeout(3400);await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await page.locator('#beginCamera').click();await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#chopValue')).toHaveText('0/15');
  20 | });
  21 | test('a real anchor change or explicit camera stop still clears completed calibration',async({page})=>{
  22 |  await prepare(page);await page.evaluate(()=>{window.upperFixture.moved=true;});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');await expect(page.locator('#upperBodyLastReset')).toContainText('身体或机位变化');await expect(page.locator('#beginCamera')).toBeDisabled();await page.locator('#cameraStop').click();await expect(page.locator('#upperBodyStepCount')).toContainText('0/3');await expect(page.locator('#chopValue')).toHaveText('0/15');
  23 | });
  24 | 
  25 | test('initial countdown is restarted safely after lost tracking without forgetting calibration',async({page})=>{
  26 |  await prepare(page);await page.evaluate(()=>{const app=document.getElementById('app')!;const observer=new MutationObserver(()=>{if(app.dataset.phase==='countdown'){window.upperFixture.low=true;observer.disconnect();}});observer.observe(app,{attributes:true,attributeFilter:['data-phase']});});await page.locator('#beginCamera').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','countdown');await expect(page.locator('#cameraTrackingStatus')).toContainText('标定已保存');await page.waitForTimeout(700);await expect(page.locator('#app')).toHaveAttribute('data-phase','countdown');await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#chopValue')).toHaveText('0/15');await page.evaluate(()=>{window.upperFixture.low=false;});await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:6000});await expect(page.locator('#chopValue')).toHaveText('0/15');
  27 | });
  28 | test('a paused video feed recovers from fresh observations and never triggers recalibration',async({page})=>{
  29 |  await active(page);await page.locator('#cameraVideo').evaluate((video:HTMLVideoElement)=>video.pause());await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','unavailable');await expect(page.locator('#cameraFeedbackStatus')).toContainText('没有新数据');await page.waitForTimeout(500);await expect(page.locator('#chopValue')).toHaveText('0/15');await page.locator('#cameraVideo').evaluate((video:HTMLVideoElement)=>video.play());await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:6000});await expect(page.locator('#chopValue')).toHaveText('0/15');
  30 | });
  31 | test('tracking recovery cannot release a manual animation stop',async({page})=>{
  32 |  await active(page);await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#statusTag')).not.toHaveText('训练中');await page.locator('#animationStop').click();await page.evaluate(()=>{window.upperFixture.low=false;});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','true',{timeout:6000});await page.waitForTimeout(500);await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#chopValue')).toHaveText('0/15');await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#chopValue')).toHaveText('0/15');
  33 | });
  34 | test('rest waits for recovered tracking and carry interruption cannot fill missing hold time',async({page})=>{
  35 |  test.setTimeout(180000);await active(page);await page.evaluate(()=>{const app=document.getElementById('app')!;const observer=new MutationObserver(()=>{if(app.dataset.phase==='rest'){window.upperFixture.low=true;observer.disconnect();}});observer.observe(app,{attributes:true,attributeFilter:['data-phase']});});for(let i=1;i<=15;i++)await loop(page,'chop',i);await expect(page.locator('#app')).toHaveAttribute('data-phase','rest');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await page.waitForTimeout(800);await expect(page.locator('#app')).toHaveAttribute('data-phase','rest');await expect(page.locator('#loadValue')).toHaveText('0/15');await page.evaluate(()=>{window.upperFixture.low=false;});await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:6000});for(let i=1;i<=15;i++)await loop(page,'load',i);await expect(page.locator('#missionTitle')).toContainText('返回');await expect(page.locator('#statusTag')).toHaveText('训练中');await pose(page,'hold');await expect.poll(async()=>parseFloat((await page.locator('#carryValue').textContent())!)).toBeGreaterThan(.1);await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#statusTag')).not.toHaveText('训练中');const held=await page.locator('#carryValue').textContent();await page.waitForTimeout(1500);await expect(page.locator('#carryValue')).toHaveText(held!);await expect(page.locator('#resultsModal')).toBeHidden();await page.evaluate(()=>{window.upperFixture.low=false;});await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:6000});await expect(page.locator('#carryValue')).toHaveText(held!);await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');expect(await page.evaluate(()=>window.upperFixture.maxWorkers)).toBe(1);
  36 | });
  37 | 
  38 | test('active visibility recovery keeps the manual pause, then Continue binds a working fresh source',async({page})=>{
  39 |  await active(page);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','true',{timeout:6000});await page.waitForTimeout(500);await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#chopValue')).toHaveText('0/15');await page.locator('#pauseBtn').click();await expect(page.locator('#statusTag')).toHaveText('训练中');await loop(page,'chop',1);
  40 | });
  41 | 
  42 | test('manual setup Start after visibility recovery still respects an explicit animation stop',async({page})=>{
  43 |  await prepare(page);await page.locator('#setupAnimationStop').click();await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#beginCamera')).toBeEnabled({timeout:6000});await page.locator('#beginCamera').click();await page.waitForTimeout(600);await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#chopValue')).toHaveText('0/15');
  44 | });
  45 | test('explicit camera Stop discards saved calibration and cannot revive a pending automatic start',async({page})=>{
  46 |  await prepare(page);await page.locator('#cameraStop').click();await expect(page.locator('#upperBodyStepCount')).toContainText('0/3');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');await expect(page.locator('#beginCamera')).toBeDisabled();await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);await page.waitForTimeout(3400);await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');await expect(page.locator('#chopValue')).toHaveText('0/15');
  47 | });
  48 | 
```