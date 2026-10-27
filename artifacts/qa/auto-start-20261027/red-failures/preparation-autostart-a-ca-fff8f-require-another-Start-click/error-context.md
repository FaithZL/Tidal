# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: preparation-autostart.spec.ts >> a camera permission blur during initialization does not require another Start click
- Location: tests/e2e/preparation-autostart.spec.ts:41:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('#statusTag')
Expected: "训练中"
Received: "已暂停"
Timeout:  10000ms

Call log:
  - Expect "toHaveText" locator('#statusTag') with timeout 10000ms
  - waiting for locator('#statusTag')
    24 × locator resolved to <span id="statusTag" class="subtag">已暂停</span>
       - unexpected value "已暂停"

```

```yaml
- text: 已暂停
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  3  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  4  | async function start(page:Page,blurDuringOpen=false){
  5  |  await installUpperBodyFixture(page);await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#acceptPlan')).toBeEnabled();
  6  |  await page.locator('#cameraMode').click();
  7  |  if(blurDuringOpen)await page.evaluate(()=>{const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async constraints=>{window.dispatchEvent(new Event('blur'));return get(constraints);};});
  8  |  await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
  9  | }
  10 | async function finishPoses(page:Page){
  11 |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
  12 |  await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
  13 | }
  14 | async function liveTraining(page:Page,expectedTracks=1){
> 15 |  await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});await expect(page.locator('#setupModal')).toBeHidden();
     |                                           ^ Error: expect(locator).toHaveText(expected) failed
  16 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-training','true');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
  17 |  await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(1);expect(await page.evaluate(()=>window.upperFixture.tracks.length)).toBe(expectedTracks);expect(await page.evaluate(()=>window.upperFixture.tracks.at(-1)!.readyState)).toBe('live');
  18 |  await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#modeBadge')).toContainText('上半身');
  19 | }
  20 | test('the frame that saves the third pose enters training immediately without a second start countdown',async({page})=>{
  21 |  await start(page);await page.evaluate(()=>{
  22 |   const node=document.getElementById('upperBodyPreparation')!;
  23 |   const observer=new MutationObserver(()=>{if(node.dataset.step==='complete'){observer.disconnect();requestAnimationFrame(()=>{node.dataset.startedAtCompletion=String(node.dataset.training==='true'&&document.getElementById('app')!.dataset.phase!=='setup');});}});
  24 |   observer.observe(node,{attributes:true,attributeFilter:['data-step']});
  25 |  });
  26 |  await finishPoses(page);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-started-at-completion','true');await liveTraining(page);
  27 | });
  28 | test('visible blur during preparation cannot revoke the automatic start after all poses are saved',async({page})=>{
  29 |  await start(page);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#upperBodyStepCount')).toContainText('1/3');
  30 |  await finishPoses(page);await liveTraining(page);await expect(page.locator('#upperBodySuspendNotice')).not.toContainText('手动');
  31 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
  32 |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');await page.waitForTimeout(400);
  33 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#chopValue')).toHaveText('1/15');
  34 | });
  35 | test('returning from a hidden preparation page preserves start intent but requires fresh complete poses',async({page})=>{
  36 |  await start(page);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  37 |  await page.waitForTimeout(400);await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');await expect(page.locator('#chopValue')).toHaveText('0/15');
  38 |  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));window.upperFixture.pose='lowered';});
  39 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await finishPoses(page);await liveTraining(page);
  40 | });
  41 | test('a camera permission blur during initialization does not require another Start click',async({page})=>{
  42 |  await start(page,true);await finishPoses(page);await liveTraining(page);
  43 | });
  44 | test('fresh preparation after a camera source error resumes automatically without a separate Continue click',async({page})=>{
  45 |  await start(page);await finishPoses(page);await liveTraining(page);
  46 |  await page.evaluate(()=>window.upperFixture.tracks[0].dispatchEvent(new Event('ended')));await expect(page.locator('#setupModal')).toBeVisible();
  47 |  await expect(page.locator('#cameraStatus')).toContainText('摄像头已断开');await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);await expect(page.locator('#chopValue')).toHaveText('0/15');
  48 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
  49 |  await finishPoses(page);await liveTraining(page,2);expect(await page.evaluate(()=>window.upperFixture.tracks[0].readyState)).toBe('ended');expect(await page.evaluate(()=>window.upperFixture.maxWorkers)).toBe(1);
  50 | });
  51 | 
```