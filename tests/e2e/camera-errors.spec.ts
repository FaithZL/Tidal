import { test, expect } from '../helpers/manualModeTest.js';

test.use({ launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } });

async function cameraPage(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('#acceptPlan').click();
  await page.locator('#cameraStart').click();
}

test('denied permission is explicit and does not silently start keyboard', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('denied', 'NotAllowedError'); };
  });
  await cameraPage(page);
  await expect(page.locator('#cameraStatus')).toContainText('权限');
  await expect(page.locator('#statusTag')).toHaveText('设备准备');
  await expect(page.locator('#chopValue')).toHaveText('0/15');
  await expect(page.locator('#cameraStart')).toBeEnabled();
});

test('missing model is visible and closes the video tracks', async ({ page }) => {
  await page.route('**/models/pose_landmarker_lite.task', route => route.fulfill({ status: 404 }));
  await cameraPage(page);
  await expect(page.locator('#cameraStatus')).toContainText('模型', { timeout: 35_000 });
  await expect(page.locator('#cameraStatus')).toContainText('404');
  await expect.poll(() => page.locator('#cameraVideo').evaluate((v: HTMLVideoElement) => v.srcObject === null)).toBe(true);
});

test('local Worker model performs inference on synthetic camera; reset releases capture', async ({ page }) => {
  const external: string[] = [];
  // Phaser rasterizes the local SVG through a same-origin blob URL; this is not a network upload.
  page.on('request', request => { if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') external.push(request.url()); });
  await cameraPage(page);
  await expect(page.locator('#cameraStatus')).toContainText('推理中', { timeout: 35_000 });
  await expect.poll(() => page.locator('#cameraFrames').textContent(), { timeout: 15_000 }).not.toBe('0');
  await expect(page.locator('#chopValue')).toHaveText('0/15');
  await page.locator('#backHome').click();
  await expect(page.locator('#planModal')).toBeVisible();
  await expect.poll(() => page.locator('#cameraVideo').evaluate((v: HTMLVideoElement) => v.srcObject === null)).toBe(true);
  expect(external).toEqual([]);
});

test('immediate cancel never opens a late camera and retry remains possible', async ({ page }) => {
  await page.goto('/');await page.locator('#acceptPlan').click();
  await page.evaluate(() => {
    document.getElementById('cameraStart')!.click();
    document.getElementById('cameraStop')!.click();
  });
  await page.waitForTimeout(500);
  await expect(page.locator('#cameraStatus')).toContainText('已关闭');
  await expect.poll(() => page.locator('#cameraVideo').evaluate((v: HTMLVideoElement) => v.srcObject === null)).toBe(true);
  await expect(page.locator('#cameraStart')).toBeEnabled();
});

for (const [name, text] of [['NotFoundError', '未找到'], ['NotReadableError', '占用'], ['NotSupportedError', '不支持']]) {
  test(`camera ${name} has an actionable device error`, async ({ page }) => {
    await page.addInitScript(name => {
      navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Not supported', name); };
    }, name);
    await cameraPage(page);
    await expect(page.locator('#cameraStatus')).toContainText(text);
    await expect(page.locator('#cameraStart')).toBeEnabled();
    await expect(page.locator('#statusTag')).toHaveText('设备准备');
  });
}
