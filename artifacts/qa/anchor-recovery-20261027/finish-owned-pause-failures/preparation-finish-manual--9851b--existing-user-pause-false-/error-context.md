# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: preparation-finish.spec.ts >> manual completion releases only the pause owned by preparation (existing user pause: false)
- Location: tests/e2e/preparation-finish.spec.ts:29:34

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('#statusTag')
Expected: "训练中"
Received: "已暂停"
Timeout:  7000ms

Call log:
  - Expect "toHaveText" locator('#statusTag') with timeout 7000ms
  - waiting for locator('#statusTag')
    18 × locator resolved to <span id="statusTag" class="subtag">已暂停</span>
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
  4  | async function savedAfterBlur(page:Page){
  5  |  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
  6  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
  7  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await expect(page.locator('#finishUpperPreparation')).toBeHidden();
  8  |  await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));window.upperFixture.pose='raised';});
  9  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
  10 |  await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
  11 | }
  12 | test('completion offers a direct exit from preparation and keeps the same live camera for a real recognized rep',async({page})=>{
  13 |  await savedAfterBlur(page);await expect(page.locator('#finishUpperPreparation')).toBeVisible();await expect(page.locator('#finishUpperPreparation')).toBeEnabled();
  14 |  await expect(page.locator('#upperBodyCue')).toContainText('已保存');await expect(page.locator('#upperBodyCue')).toContainText('摄像头');
  15 |  await page.locator('#finishUpperPreparation').click();await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#statusTag')).toHaveText('训练中');
  16 |  expect(await page.evaluate(()=>window.upperFixture.tracks.length)).toBe(1);expect(await page.evaluate(()=>window.upperFixture.tracks[0].readyState)).toBe('live');
  17 |  await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#modeBadge')).toContainText('上半身');
  18 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
  19 |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');await page.waitForTimeout(400);
  20 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#chopValue')).toHaveText('1/15');
  21 | });
  22 | test('the finish shortcut cannot bypass lost tracking or an explicit animation stop',async({page})=>{
  23 |  await savedAfterBlur(page);await page.evaluate(()=>{window.upperFixture.moved=true;});
  24 |  await expect(page.locator('#finishUpperPreparation')).toBeVisible();await expect(page.locator('#finishUpperPreparation')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  25 |  await page.locator('#setupAnimationStop').click();await page.evaluate(()=>{window.upperFixture.moved=false;});await expect(page.locator('#finishUpperPreparation')).toBeEnabled({timeout:6000});
  26 |  await page.locator('#finishUpperPreparation').click();await expect(page.locator('#setupModal')).toBeHidden();await page.waitForTimeout(700);
  27 |  await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#chopValue')).toHaveText('0/15');
  28 | });
  29 | for(const paused of [false,true])test(`manual completion releases only the pause owned by preparation (existing user pause: ${paused})`,async({page})=>{
  30 |  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));await page.goto('/?e2e=1&art=npr-sample');
  31 |  await expect(page.locator('#statusTag')).toHaveText('训练中');if(paused)await page.locator('#pauseBtn').click();
  32 |  await page.locator('#cameraMode').click();const before=await page.locator('#chopValue').textContent();await page.locator('#cameraStart').click();
  33 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.evaluate(()=>{window.upperFixture.pose='raised';});
  34 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await page.evaluate(()=>{window.upperFixture.pose='hold';});
  35 |  await expect(page.locator('#finishUpperPreparation')).toBeEnabled();await page.locator('#finishUpperPreparation').click();await expect(page.locator('#setupModal')).toBeHidden();
> 36 |  await expect(page.locator('#statusTag')).toHaveText(paused?'已暂停':'训练中');await expect(page.locator('#chopValue')).toHaveText(before!);
     |                                           ^ Error: expect(locator).toHaveText(expected) failed
  37 |  expect(await page.evaluate(()=>window.upperFixture.tracks[0].readyState)).toBe('live');
  38 | });
  39 | 
```