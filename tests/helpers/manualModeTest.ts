import { test as base } from '@playwright/test';

/** Existing keyboard/camera scenarios explicitly choose manual entry before navigation. */
export const test = base.extend<{ manualModePreference: void }>({
  manualModePreference: [async ({ page }, use) => {
    await page.addInitScript(() => {
      localStorage.setItem('tidal.demo.enabled', 'false');
    });
    await use();
  }, { auto: true }],
});

export { expect, type Page } from '@playwright/test';
