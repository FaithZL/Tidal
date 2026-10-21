import { test, expect, type Page } from '../helpers/manualModeTest.js';
import { mkdir } from 'node:fs/promises';
test.use({ baseURL: 'http://127.0.0.1:4174' });

async function begin(page: Page) {
  await page.locator('#acceptPlan').click(); await page.locator('#beginDemo').click();
  await expect(page.locator('#statusTag')).toHaveText('倒计时');
  await expect(page.locator('#statusTag')).toHaveText('训练中');
}
async function reps(page: Page, name: 'chop' | 'load') {
  for (let i = 1; i <= 15; i++) {
    await page.locator('#actionBtn').click();
    await expect(page.locator(`#${name}Value`)).toHaveText(`${i}/15`);
  }
  await expect(page.locator('#statusTag')).toHaveText('休息时间');
  await expect(page.locator('#statusTag')).toHaveText('倒计时');
  await expect(page.locator('#statusTag')).toHaveText('训练中');
}
test('two complete keyboard sessions with pauses, conserved inventory and reset', async ({ page }) => {
  const errors: string[] = [];page.on('pageerror', e => errors.push(e.message));
  await mkdir('artifacts/qa', { recursive: true });
  await page.goto('/?e2e=1');
  await expect(page.locator('#testModeBadge')).toBeVisible();
  for (let round = 0; round < 2; round++) {
    await begin(page);
    await page.locator('#pauseBtn').click();
    await expect(page.locator('#statusTag')).toHaveText('已暂停');
    await page.locator('#pauseBtn').evaluate((button: HTMLButtonElement) => button.blur());
    await page.keyboard.press('Space');await page.waitForTimeout(150);
    await expect(page.locator('#chopValue')).toHaveText('0/15');
    await page.locator('#pauseBtn').click();
    await expect(page.locator('#statusTag')).toHaveText('训练中');
    await reps(page,'chop');await reps(page,'load');
    await page.locator('#actionBtn').focus();
    await page.keyboard.down('Space');await page.waitForTimeout(350);await page.keyboard.up('Space');
    const released = await page.locator('#carryValue').textContent();
    await page.waitForTimeout(250);await expect(page.locator('#carryValue')).toHaveText(released!);
    await page.keyboard.down('Space');await expect(page.locator('#resultsModal')).toBeVisible();await page.keyboard.up('Space');
    await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#rewardCoins')).toHaveText('100');
    await page.keyboard.press('Space');await expect(page.locator('#rewardLogs')).toHaveText('15');
    await expect(page.locator('#actualMetrics')).toContainText('键盘模拟');
    await expect(page.locator('#actualMetrics')).toContainText('任务有效时间');
    await expect(page.locator('#actualMetrics')).toContainText('本局经过时间');
    if (round === 0) await page.screenshot({ path: 'artifacts/qa/keyboard-results.png', fullPage: true });
    await page.locator('#resultsHome').click();await expect(page.locator('#planModal')).toBeVisible();
    await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#loadValue')).toHaveText('0/15');
    await expect(page.locator('#rewardLogs')).toHaveText('0');
  }
  expect(errors).toEqual([]);
});

test('repeat keys, control focus and a reset during animation cannot add an extra rep', async ({ page }) => {
  await page.goto('/?e2e=1');await begin(page);
  await page.locator('#actionBtn').focus();
  await page.keyboard.down('Space');await page.keyboard.down('Space');await page.keyboard.up('Space');
  await expect(page.locator('#chopValue')).toHaveText('1/15');
  await page.waitForTimeout(200);await expect(page.locator('#chopValue')).toHaveText('1/15');
  await page.evaluate(() => {
    const input = document.createElement('input');input.id='focus-test';document.body.appendChild(input);input.focus();
  });
  await page.keyboard.press('Space');await page.keyboard.press('p');
  await expect(page.locator('#statusTag')).toHaveText('训练中');
  await expect(page.locator('#chopValue')).toHaveText('1/15');
  await page.locator('#actionBtn').click();await page.locator('#resetBtn').click();
  await page.waitForTimeout(300);await expect(page.locator('#chopValue')).toHaveText('0/15');
});

test('pointer cancel and blur release carry; returning requires explicit continue', async ({ page }) => {
  await page.goto('/?e2e=1');await begin(page);await reps(page,'chop');await reps(page,'load');
  const button=page.locator('#actionBtn');
  await button.hover();await page.mouse.down();await page.waitForTimeout(250);
  await button.dispatchEvent('pointercancel');await page.mouse.up();
  const stopped=await page.locator('#carryValue').textContent();await page.waitForTimeout(250);
  await expect(page.locator('#carryValue')).toHaveText(stopped!);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#statusTag')).toHaveText('已暂停');
  await expect(page.locator('#pauseBtn')).toHaveText('继续');
  await page.waitForTimeout(300);await expect(page.locator('#carryValue')).toHaveText(stopped!);
  await page.locator('#pauseBtn').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
});

test('Escape opens an exit confirmation; cancel preserves progress and existing pause', async ({ page }) => {
  await page.goto('/?e2e=1');await begin(page);
  await page.locator('#actionBtn').click();await expect(page.locator('#chopValue')).toHaveText('1/15');
  await page.keyboard.press('Escape');await expect(page.locator('#exitModal')).toBeVisible();
  await expect(page.locator('#statusTag')).toHaveText('已暂停');
  await page.locator('#cancelExit').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  await expect(page.locator('#chopValue')).toHaveText('1/15');
  await page.locator('#pauseBtn').click();await page.keyboard.press('Escape');
  await page.locator('#cancelExit').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  await page.keyboard.press('Escape');await page.locator('#confirmExit').click();
  await expect(page.locator('#planModal')).toBeVisible();await expect(page.locator('#chopValue')).toHaveText('0/15');
});

test('P works after clicking pause but cannot resume behind the exit dialog', async ({ page }) => {
  await page.goto('/?e2e=1');await begin(page);await page.locator('#pauseBtn').click();
  await page.keyboard.press('p');await expect(page.locator('#statusTag')).toHaveText('训练中');
  await page.keyboard.press('Escape');await expect(page.locator('#exitModal')).toBeVisible();
  await page.keyboard.press('p');await expect(page.locator('#statusTag')).toHaveText('已暂停');
});
