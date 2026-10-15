// Opens the built artifact and uses normal 5/15/60 second defaults, without clock overrides.
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const url = process.env.TIDAL_PREVIEW_URL ?? 'http://127.0.0.1:4175/';
const output = process.env.TIDAL_QA_DIR ?? 'artifacts/qa';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [], external = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (new URL(request.url()).origin !== new URL(url).origin) external.push(request.url()); });
const start = Date.now();
try {
  await page.goto(url + '?e2e=1');
  await expect(page.locator('#planCarry')).toContainText('60 秒');
  await expect(page.locator('#testModeBadge')).toBeHidden();
  await page.locator('#cancelPlan').click();
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-renderer', 'Phaser 3.90.0');
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-art', 'tidal-farm-v1');
  await page.screenshot({ path: `${output}/production-home.png`, fullPage: true });
  await page.locator('#actionBtn').click();await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();
  await expect(page.locator('#statusTag')).toHaveText('倒计时');
  await expect(page.locator('#statusTag')).toHaveText('训练中', { timeout: 8_000 });
  for (const task of ['chop','load']) {
    for (let i=1;i<=15;i++) {
      await page.locator('#actionBtn').click();
      await expect(page.locator(`#${task}Value`)).toHaveText(`${i}/15`);
    }
    await expect(page.locator('#statusTag')).toHaveText('休息时间');
    console.log(`Production ${task}: 15 complete, real 15-second rest`);
    await expect(page.locator('#statusTag')).toHaveText('倒计时', { timeout: 18_000 });
    await expect(page.locator('#statusTag')).toHaveText('训练中', { timeout: 8_000 });
  }
  await page.locator('#actionBtn').focus();await page.keyboard.down('Space');
  console.log('Production carry: holding for the normal 60-second target');
  await expect(page.locator('#resultsModal')).toBeVisible({ timeout: 75_000 });await page.keyboard.up('Space');
  await expect(page.locator('#carryValue')).toHaveText('60.0/60s');
  await expect(page.locator('#rewardLogs')).toHaveText('15');
  await expect(page.locator('#rewardCoins')).toHaveText('100');
  await expect(page.locator('#rewardStamina')).toHaveText('100');
  const metrics = await page.locator('#actualMetrics').textContent();
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory', '0/0/15');
  await page.screenshot({ path: `${output}/production-results.png`, fullPage: true });
  await page.locator('#resultsHome').click();await expect(page.locator('#planModal')).toBeVisible();
  await expect(page.locator('#chopValue')).toHaveText('0/15');
  expect(errors).toEqual([]);expect(external).toEqual([]);
  const report = { date: '2026-10-15', browser: browser.version(), platform: process.platform,
    bundles: await page.locator('script[type="module"]').evaluateAll(nodes => nodes.map(node => node.src)),
    input: 'keyboard simulation; no camera', timing: 'production 5s countdown / 15s rests / 60s effective carry',
    durationSeconds: (Date.now()-start)/1000, metrics, errors, external, reset: 'pass', result: 'pass' };
  await writeFile(`${output}/production-flow.json`, JSON.stringify(report,null,2)+'\n');console.log(report);
} finally { await browser.close(); }
