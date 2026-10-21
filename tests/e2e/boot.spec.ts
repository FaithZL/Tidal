import { test, expect } from '@playwright/test';

test('Three.js farm boots, plan cancels and reopens without starting a session', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#planChop')).toContainText('15 次');
  await expect(page.locator('#planCarry')).toContainText('60 秒');
  await page.locator('#cancelPlan').click();
  await expect(page.locator('#planModal')).toBeHidden();
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-renderer', 'Three.js r186');
  await expect(page.locator('#worldCanvas canvas')).toBeVisible();
  await expect(page.locator('#chopValue')).toHaveText('0/15');
  await page.locator('#actionBtn').click();
  await expect(page.locator('#planModal')).toBeVisible();
  expect(errors).toEqual([]);
});

test('ordinary builds ignore URL acceleration flags', async ({ page }) => {
  await page.goto('/?e2e=1');
  await expect(page.locator('#planCarry')).toContainText('60 秒');
  await expect(page.locator('#testModeBadge')).toBeHidden();
});
