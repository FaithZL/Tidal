// Production UI smoke only. No camera, fake video, Worker stub or accelerated clock.
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const url = process.env.TIDAL_PREVIEW_URL ?? 'http://127.0.0.1:4175/';
const output = process.env.TIDAL_QA_DIR ?? 'artifacts/qa/t06';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
const errors = [], external = [], poseRequests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => {
  if (new URL(request.url()).origin !== new URL(url).origin) external.push(request.url());
  if (/pose_landmarker|\/worker\/|\/mediapipe\//.test(request.url())) poseRequests.push(request.url());
});
try {
  await page.goto(url + '?e2e=1');
  await expect(page.locator('#testModeBadge')).toBeHidden();
  await expect(page.locator('#planCarry')).toContainText('60 秒');
  await page.locator('#acceptPlan').click();
  await page.locator('#calibrationPanel summary').click();
  await expect(page.locator('#calibrationCapture')).toBeDisabled();
  await expect(page.locator('#calibrationStatus')).toContainText('等待全身有效关键点');
  await expect(page.locator('#calibrationReadiness')).not.toContainText('已标定');
  await page.locator('#calibrationPanel').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${output}/production-calibration-waiting.png`, fullPage: true });
  await page.locator('#setupDemoToggle').click();
  await expect(page.locator('#calibrationPanel')).toBeHidden();
  await expect(page.locator('#demoPreviewSetup')).toBeVisible();
  await page.locator('#beginDemo').click();
  await expect(page.locator('#statusTag')).toHaveText('训练中', { timeout: 8000 });
  await expect(page.locator('#chopValue')).toHaveText('1/15', { timeout: 3000 });
  await page.locator('#pauseBtn').click();
  const progress = await page.locator('#chopValue').textContent();
  await page.waitForTimeout(600);
  await expect(page.locator('#chopValue')).toHaveText(progress);
  await page.screenshot({ path: `${output}/production-demo-paused.png`, fullPage: true });
  expect(errors).toEqual([]);expect(external).toEqual([]);expect(poseRequests).toEqual([]);
  const report = { date: new Date().toISOString(), browser: browser.version(), platform: process.platform,
    bundles: await page.locator('script[type="module"]').evaluateAll(nodes => nodes.map(node => node.src)),
    scope: 'production UI smoke: calibration disabled without camera; automatic demo starts and pauses; not a full session',
    physicalCamera: 'manual_pending; no camera requested', errors, external, poseRequests, result: 'pass' };
  await writeFile(`${output}/production-smoke.json`, JSON.stringify(report, null, 2) + '\n');console.log(report);
} finally { await browser.close(); }
