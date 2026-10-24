# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: keyboard-flow.spec.ts >> repeat keys, control focus and a reset during animation cannot add an extra rep
- Location: tests\e2e\keyboard-flow.spec.ts:52:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('#acceptPlan')
    - locator resolved to <button class="primary" id="acceptPlan">…</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is not stable
  - retrying click action
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying

```

# Page snapshot

```yaml
- alert [ref=e2]:
  - paragraph [ref=e3]: 演示启动失败，请检查本地服务并重新加载。
  - link "重新加载" [ref=e4] [cursor=pointer]:
    - /url: http://127.0.0.1:4174/?e2e=1
```

# Test source

```ts
  1   | import { test, expect, type Page } from '../helpers/manualModeTest.js';
  2   | import { mkdir } from 'node:fs/promises';
  3   | test.use({ baseURL: 'http://127.0.0.1:4174' });
  4   | 
  5   | async function begin(page: Page) {
> 6   |   await page.locator('#acceptPlan').click(); await page.locator('#beginDemo').click();
      |                                     ^ Error: locator.click: Test timeout of 60000ms exceeded.
  7   |   await expect(page.locator('#statusTag')).toHaveText('倒计时');
  8   |   await expect(page.locator('#statusTag')).toHaveText('训练中');
  9   | }
  10  | async function reps(page: Page, name: 'chop' | 'load') {
  11  |   for (let i = 1; i <= 15; i++) {
  12  |     await page.locator('#actionBtn').click();
  13  |     await expect(page.locator(`#${name}Value`)).toHaveText(`${i}/15`);
  14  |   }
  15  |   await expect(page.locator('#statusTag')).toHaveText('休息时间');
  16  |   await expect(page.locator('#statusTag')).toHaveText('倒计时');
  17  |   await expect(page.locator('#statusTag')).toHaveText('训练中');
  18  | }
  19  | test('two complete keyboard sessions with pauses, conserved inventory and reset', async ({ page }) => {
  20  |   const errors: string[] = [];page.on('pageerror', e => errors.push(e.message));
  21  |   await mkdir('artifacts/qa', { recursive: true });
  22  |   await page.goto('/?e2e=1');
  23  |   await expect(page.locator('#testModeBadge')).toBeVisible();
  24  |   for (let round = 0; round < 2; round++) {
  25  |     await begin(page);
  26  |     await page.locator('#pauseBtn').click();
  27  |     await expect(page.locator('#statusTag')).toHaveText('已暂停');
  28  |     await page.locator('#pauseBtn').evaluate((button: HTMLButtonElement) => button.blur());
  29  |     await page.keyboard.press('Space');await page.waitForTimeout(150);
  30  |     await expect(page.locator('#chopValue')).toHaveText('0/15');
  31  |     await page.locator('#pauseBtn').click();
  32  |     await expect(page.locator('#statusTag')).toHaveText('训练中');
  33  |     await reps(page,'chop');await reps(page,'load');
  34  |     await page.locator('#actionBtn').focus();
  35  |     await page.keyboard.down('Space');await page.waitForTimeout(350);await page.keyboard.up('Space');
  36  |     const released = await page.locator('#carryValue').textContent();
  37  |     await page.waitForTimeout(250);await expect(page.locator('#carryValue')).toHaveText(released!);
  38  |     await page.keyboard.down('Space');await expect(page.locator('#resultsModal')).toBeVisible();await page.keyboard.up('Space');
  39  |     await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#rewardCoins')).toHaveText('100');
  40  |     await page.keyboard.press('Space');await expect(page.locator('#rewardLogs')).toHaveText('15');
  41  |     await expect(page.locator('#actualMetrics')).toContainText('键盘模拟');
  42  |     await expect(page.locator('#actualMetrics')).toContainText('任务有效时间');
  43  |     await expect(page.locator('#actualMetrics')).toContainText('本局经过时间');
  44  |     if (round === 0) await page.screenshot({ path: 'artifacts/qa/keyboard-results.png', fullPage: true });
  45  |     await page.locator('#resultsHome').click();await expect(page.locator('#planModal')).toBeVisible();
  46  |     await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#loadValue')).toHaveText('0/15');
  47  |     await expect(page.locator('#rewardLogs')).toHaveText('0');
  48  |   }
  49  |   expect(errors).toEqual([]);
  50  | });
  51  | 
  52  | test('repeat keys, control focus and a reset during animation cannot add an extra rep', async ({ page }) => {
  53  |   await page.goto('/?e2e=1');await begin(page);
  54  |   await page.locator('#actionBtn').focus();
  55  |   await page.keyboard.down('Space');await page.keyboard.down('Space');await page.keyboard.up('Space');
  56  |   await expect(page.locator('#chopValue')).toHaveText('1/15');
  57  |   await page.waitForTimeout(200);await expect(page.locator('#chopValue')).toHaveText('1/15');
  58  |   await page.evaluate(() => {
  59  |     const input = document.createElement('input');input.id='focus-test';document.body.appendChild(input);input.focus();
  60  |   });
  61  |   await page.keyboard.press('Space');await page.keyboard.press('p');
  62  |   await expect(page.locator('#statusTag')).toHaveText('训练中');
  63  |   await expect(page.locator('#chopValue')).toHaveText('1/15');
  64  |   await page.locator('#actionBtn').click();await page.locator('#resetBtn').click();
  65  |   await page.waitForTimeout(300);await expect(page.locator('#chopValue')).toHaveText('0/15');
  66  | });
  67  | 
  68  | test('pointer cancel and blur release carry; returning requires explicit continue', async ({ page }) => {
  69  |   await page.goto('/?e2e=1');await begin(page);await reps(page,'chop');await reps(page,'load');
  70  |   const button=page.locator('#actionBtn');
  71  |   await button.hover();await page.mouse.down();await page.waitForTimeout(250);
  72  |   await button.dispatchEvent('pointercancel');await page.mouse.up();
  73  |   const stopped=await page.locator('#carryValue').textContent();await page.waitForTimeout(250);
  74  |   await expect(page.locator('#carryValue')).toHaveText(stopped!);
  75  |   await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  76  |   await expect(page.locator('#statusTag')).toHaveText('已暂停');
  77  |   await expect(page.locator('#pauseBtn')).toHaveText('继续');
  78  |   await page.waitForTimeout(300);await expect(page.locator('#carryValue')).toHaveText(stopped!);
  79  |   await page.locator('#pauseBtn').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  80  | });
  81  | 
  82  | test('Escape opens an exit confirmation; cancel preserves progress and existing pause', async ({ page }) => {
  83  |   await page.goto('/?e2e=1');await begin(page);
  84  |   await page.locator('#actionBtn').click();await expect(page.locator('#chopValue')).toHaveText('1/15');
  85  |   await page.keyboard.press('Escape');await expect(page.locator('#exitModal')).toBeVisible();
  86  |   await expect(page.locator('#statusTag')).toHaveText('已暂停');
  87  |   await page.locator('#cancelExit').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  88  |   await expect(page.locator('#chopValue')).toHaveText('1/15');
  89  |   await page.locator('#pauseBtn').click();await page.keyboard.press('Escape');
  90  |   await page.locator('#cancelExit').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  91  |   await page.keyboard.press('Escape');await page.locator('#confirmExit').click();
  92  |   await expect(page.locator('#planModal')).toBeVisible();await expect(page.locator('#chopValue')).toHaveText('0/15');
  93  | });
  94  | 
  95  | test('P works after clicking pause but cannot resume behind the exit dialog', async ({ page }) => {
  96  |   await page.goto('/?e2e=1');await begin(page);await page.locator('#pauseBtn').click();
  97  |   await page.keyboard.press('p');await expect(page.locator('#statusTag')).toHaveText('训练中');
  98  |   await page.keyboard.press('Escape');await expect(page.locator('#exitModal')).toBeVisible();
  99  |   await page.keyboard.press('p');await expect(page.locator('#statusTag')).toHaveText('已暂停');
  100 | });
  101 | 
```