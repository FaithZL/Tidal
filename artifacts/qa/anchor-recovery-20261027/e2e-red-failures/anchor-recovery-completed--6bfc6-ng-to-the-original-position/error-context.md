# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: anchor-recovery.spec.ts >> completed preparation keeps 3/3 after a position change but starts only after returning to the original position
- Location: tests/e2e/anchor-recovery.spec.ts:11:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#upperBodyCue')
Expected substring: "原位置"
Received string:    "坐稳或站稳，双手停在肩下、胸腹前，手腕留在画面内，保持片刻。"
Timeout: 7000ms

Call log:
  - Expect "toContainText" locator('#upperBodyCue') with timeout 7000ms
  - waiting for locator('#upperBodyCue')
    18 × locator resolved to <p id="upperBodyCue">坐稳或站稳，双手停在肩下、胸腹前，手腕留在画面内，保持片刻。</p>
       - unexpected value "坐稳或站稳，双手停在肩下、胸腹前，手腕留在画面内，保持片刻。"

```

```yaml
- paragraph: 坐稳或站稳，双手停在肩下、胸腹前，手腕留在画面内，保持片刻。
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  3  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  4  | async function prepare(page:Page){
  5  |  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
  6  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
  7  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
  8  |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
  9  |  await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
  10 | }
  11 | test('completed preparation keeps 3/3 after a position change but starts only after returning to the original position',async({page})=>{
  12 |  await prepare(page);await page.evaluate(()=>{window.upperFixture.moved=true;});
  13 |  await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');
> 14 |  await expect(page.locator('#upperBodyReason')).toContainText('位置');await expect(page.locator('#upperBodyCue')).toContainText('原位置');
     |                                                                                                                 ^ Error: expect(locator).toContainText(expected) failed
  15 |  await page.waitForTimeout(3400);await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#beginCamera')).toBeDisabled();
  16 |  await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');await expect(page.locator('#chopValue')).toHaveText('0/15');
  17 |  await page.evaluate(()=>{window.upperFixture.moved=false;});await page.waitForTimeout(500);await expect(page.locator('#beginCamera')).toBeDisabled();
  18 |  await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:12000});await expect(page.locator('#chopValue')).toHaveText('0/15');
  19 | });
  20 | test('active position change cannot count or carry a half rep across recovery',async({page})=>{
  21 |  await prepare(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});
  22 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
  23 |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');
  24 |  const before=(await page.locator('#inputDebug').textContent())!.match(/epoch (\d+)/)![1];
  25 |  await page.evaluate(()=>{window.upperFixture.moved=true;});await expect(page.locator('#statusTag')).not.toHaveText('训练中');
  26 |  await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#setupModal')).toBeHidden();
  27 |  await expect(page.locator('#cameraTrackingStatus')).toContainText('位置');await page.waitForTimeout(3400);await expect(page.locator('#chopValue')).toHaveText('0/15');
  28 |  await page.evaluate(()=>{window.upperFixture.moved=false;});await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:6000});
  29 |  await expect(page.locator('#inputDebug')).not.toContainText(`epoch ${before} ·`);
  30 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await expect(page.locator('#chopValue')).toHaveText('0/15');
  31 |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');await page.waitForTimeout(400);
  32 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#chopValue')).toHaveText('1/15');
  33 | });
  34 | 
```