# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: session-preparation.spec.ts >> a rejected runtime frame cannot erase this session calibration or carry a half rep across recovery
- Location: tests/e2e/session-preparation.spec.ts:17:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#upperBodyStepCount')
Expected substring: "3/3"
Received string:    "已完成 0/3"
Timeout: 7000ms

Call log:
  - Expect "toContainText" locator('#upperBodyStepCount') with timeout 7000ms
  - waiting for locator('#upperBodyStepCount')
    18 × locator resolved to <b id="upperBodyStepCount">已完成 0/3</b>
       - unexpected value "已完成 0/3"

```

```yaml
- text: 已完成 0/3
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  3  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  4  | async function active(page:Page){
  5  |  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
  6  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
  7  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
  8  |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
  9  |  await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});
  10 | }
  11 | async function loop(page:Page,task:'chop'|'load',count:number){
  12 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
  13 |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(task==='chop'?' · chop-down ·':' · press-up ·');
  14 |  await page.waitForTimeout(task==='chop'?400:800);await page.evaluate(()=>{window.upperFixture.pose='lowered';});
  15 |  await expect(page.locator(task==='chop'?'#chopValue':'#loadValue')).toHaveText(`${count}/15`);
  16 | }
  17 | test('a rejected runtime frame cannot erase this session calibration or carry a half rep across recovery',async({page})=>{
  18 |  await active(page);await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
  19 |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');
  20 |  await page.evaluate(()=>{window.upperFixture.resized=true;});await expect(page.locator('#statusTag')).not.toHaveText('训练中');
> 21 |  await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#setupModal')).toBeHidden();
     |                                                    ^ Error: expect(locator).toContainText(expected) failed
  22 |  await expect(page.locator('#cameraTrackingStatus')).not.toContainText('1200');await expect(page.locator('#upperBodyProgress')).toBeHidden();
  23 |  await page.waitForTimeout(1500);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');
  24 |  await page.evaluate(()=>{window.upperFixture.resized=false;window.upperFixture.pose='lowered';});
  25 |  await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await expect(page.locator('#chopValue')).toHaveText('0/15');
  26 |  await loop(page,'chop',1);await expect(page.locator('#setupModal')).toBeHidden();
  27 | });
  28 | test('one initial preparation survives both task transitions and carry loss while only valid motions earn progress',async({page})=>{
  29 |  test.setTimeout(180000);await active(page);
  30 |  await page.evaluate(()=>{const app=document.getElementById('app')!;const observer=new MutationObserver(()=>{if(app.dataset.phase==='rest')window.upperFixture.resized=true;});observer.observe(app,{attributes:true,attributeFilter:['data-phase']});});
  31 |  for(const task of ['chop','load'] as const){
  32 |   for(let i=1;i<=15;i++)await loop(page,task,i);
  33 |   await expect(page.locator('#app')).toHaveAttribute('data-phase','rest');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');
  34 |   await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#setupModal')).toBeHidden();
  35 |   await page.waitForTimeout(700);await expect(page.locator('#app')).toHaveAttribute('data-phase','rest');
  36 |   await page.evaluate(()=>{window.upperFixture.resized=false;window.upperFixture.pose='lowered';});await expect(page.locator('#statusTag')).toHaveText('训练中');
  37 |   await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');
  38 |  }
  39 |  await expect(page.locator('#missionTitle')).toContainText('返回');await page.evaluate(()=>{window.upperFixture.pose='hold';});
  40 |  await expect.poll(async()=>parseFloat((await page.locator('#carryValue').textContent())!)).toBeGreaterThan(.1);
  41 |  await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#statusTag')).not.toHaveText('训练中');const before=await page.locator('#carryValue').textContent();
  42 |  await page.waitForTimeout(700);await expect(page.locator('#carryValue')).toHaveText(before!);await expect(page.locator('#setupModal')).toBeHidden();
  43 |  await page.evaluate(()=>{window.upperFixture.low=false;window.upperFixture.pose='lowered';});await expect(page.locator('#statusTag')).toHaveText('训练中');await page.waitForTimeout(400);await expect(page.locator('#carryValue')).toHaveText(before!);
  44 |  await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});
  45 |  await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
  46 |  expect(await page.evaluate(()=>window.upperFixture.maxWorkers)).toBe(1);await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);
  47 | });
  48 | 
```