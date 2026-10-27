# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: default-off.spec.ts >> completing all three poses leaves simulation off and waits for explicit manual input
- Location: tests/e2e/default-off.spec.ts:4:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#demoToggle')
Expected: "false"
Received: "true"
Timeout:  7000ms

Call log:
  - Expect "toHaveAttribute" locator('#demoToggle') with timeout 7000ms
  - waiting for locator('#demoToggle')
    18 × locator resolved to <button role="switch" id="demoToggle" aria-checked="true" class="secondary demo-toggle">无摄像头测试：开</button>
       - unexpected value "true"

```

```yaml
- switch "无摄像头测试：开" [checked]
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  3  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  4  | test('completing all three poses leaves simulation off and waits for explicit manual input',async({page})=>{
  5  |  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
  6  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
  7  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.evaluate(()=>{window.upperFixture.pose='raised';});
  8  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await page.evaluate(()=>{window.upperFixture.pose='hold';});
> 9  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-finished','true');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
     |                                                                                                                                        ^ Error: expect(locator).toHaveAttribute(expected) failed
  10 |  await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);await expect(page.locator('#cameraVideo')).toHaveJSProperty('srcObject',null);
  11 |  await expect(page.locator('#statusTag')).toHaveText('训练中');await page.evaluate(()=>{window.upperFixture.pose='raised';window.upperFixture.low=true;});
  12 |  await page.waitForTimeout(1500);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#loadValue')).toHaveText('0/15');
  13 |  await expect(page.locator('#modeBadge')).toContainText('键盘演示');await page.locator('#actionBtn').click();await expect(page.locator('#chopValue')).toHaveText('1/15');
  14 |  await page.locator('#demoToggle').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');await page.locator('#pauseBtn').click();await expect(page.locator('#modeBadge')).toContainText('自动模拟');
  15 |  await expect.poll(async()=>parseInt(await page.locator('#chopValue').textContent()??'0')).toBeGreaterThan(1);
  16 | });
  17 | test('an unrecognized saved preference does not enable automatic play',async({page})=>{
  18 |  await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','invalid'));await page.goto('/?e2e=1');
  19 |  await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await page.waitForTimeout(500);await expect(page.locator('#app')).toHaveAttribute('data-phase','home');await expect(page.locator('#chopValue')).toHaveText('0/15');
  20 | });
  21 | 
```