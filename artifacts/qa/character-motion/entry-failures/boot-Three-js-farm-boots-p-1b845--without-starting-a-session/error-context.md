# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: boot.spec.ts >> Three.js farm boots, plan cancels and reopens without starting a session
- Location: tests\e2e\boot.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeHidden() failed

Locator:  locator('#planModal')
Expected: hidden
Received: visible
Timeout:  7000ms

Call log:
  - Expect "toBeHidden" locator('#planModal') with timeout 7000ms
  - waiting for locator('#planModal')
    16 × locator resolved to <div id="planModal" class="notification-wrap">…</div>
       - unexpected value "visible"

```

```yaml
- dialog "农场今日劳作":
  - text: 禾 禾禾 · 农场管家 A LITTLE EVERY DAY 今日
  - heading "农场今日劳作" [level=2]
  - paragraph: 从林间到谷仓，让每一次运动都留下收获。
  - text: 01 砍伐杉树 挥砍 5 次 × 3 棵 · 共 15 次 02 收集木材 深蹲推举 15 次 · 装车 15 份木材 03 推车回家 持续持姿 60 秒 · 返回农场 今日为预设训练计划 · 概念演示，非 AI 自动规划。
  - button "稍后再说"
  - button "接受今天的任务 →"
```

# Test source

```ts
  1  | import { test, expect } from '../helpers/manualModeTest.js';
  2  | 
  3  | test('Three.js farm boots, plan cancels and reopens without starting a session', async ({ page }) => {
  4  |   const errors: string[] = [];
  5  |   page.on('pageerror', error => errors.push(error.message));
  6  |   await page.goto('/');
  7  |   await expect(page.locator('#planChop')).toContainText('15 次');
  8  |   await expect(page.locator('#planCarry')).toContainText('60 秒');
  9  |   await page.locator('#cancelPlan').click();
> 10 |   await expect(page.locator('#planModal')).toBeHidden();
     |                                            ^ Error: expect(locator).toBeHidden() failed
  11 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-renderer', 'Three.js r186');
  12 |   await expect(page.locator('#worldCanvas canvas')).toBeVisible();
  13 |   await expect(page.locator('#chopValue')).toHaveText('0/15');
  14 |   await page.locator('#actionBtn').click();
  15 |   await expect(page.locator('#planModal')).toBeVisible();
  16 |   expect(errors).toEqual([]);
  17 | });
  18 | 
  19 | test('ordinary builds ignore URL acceleration flags', async ({ page }) => {
  20 |   await page.goto('/?e2e=1');
  21 |   await expect(page.locator('#planCarry')).toContainText('60 秒');
  22 |   await expect(page.locator('#testModeBadge')).toBeHidden();
  23 | });
  24 | 
```