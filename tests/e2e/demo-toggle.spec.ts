import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test.use({ baseURL: 'http://127.0.0.1:4174' });

test('no-camera demo is explicit, completes the full farm flow and resets off without camera requests', async ({ page }) => {
  const errors: string[] = [], requests: string[] = [];
  page.on('pageerror', e => errors.push(e.message));page.on('request', r => requests.push(r.url()));
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      document.documentElement.dataset.cameraRequested = 'true';throw new Error('TEST: camera must not be requested');
    };
  });
  await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();
  const toggle = page.locator('#setupDemoToggle');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#demoPreviewSetup')).toBeVisible();
  await expect(page.locator('#demoPreviewSetup')).toContainText('合成骨架');
  const first = await page.locator('#demoSetupCanvas').evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await expect.poll(() => page.locator('#demoSetupCanvas').evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toBe(first);
  await expect(page.locator('#chopValue')).toHaveText('0/15');
  await mkdir('artifacts/qa/demo-toggle', { recursive: true });
  await page.screenshot({ path: 'artifacts/qa/demo-toggle/setup.png', fullPage: true });
  await page.locator('#beginDemo').click();await expect(page.locator('#demoPreviewGame')).toBeVisible();
  await expect(page.locator('#modeBadge')).toContainText('自动模拟');
  await page.screenshot({ path: 'artifacts/qa/demo-toggle/running.png', fullPage: true });
  await expect(page.locator('#resultsModal')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#rewardCoins')).toHaveText('100');
  await expect(page.locator('#actualMetrics')).toContainText('自动模拟');
  await page.locator('#resultsHome').click();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked', 'false');
  await page.waitForTimeout(300);await expect(page.locator('#chopValue')).toHaveText('0/15');
  expect(requests.filter(url => /pose_landmarker|\/worker\/|\/mediapipe\//.test(url))).toEqual([]);
  expect(await page.locator('html').getAttribute('data-camera-requested')).toBeNull();
  expect(errors).toEqual([]);
});

test('turning demo off cancels partial input and pauses; manual mode can resume', async ({ page }) => {
  await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();
  await page.locator('#beginDemo').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  await page.locator('#demoToggle').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  const count = await page.locator('#chopValue').textContent();await page.waitForTimeout(450);
  await expect(page.locator('#chopValue')).toHaveText(count!);await expect(page.locator('#demoPreviewGame')).toBeHidden();
  await page.locator('#pauseBtn').click();await page.waitForTimeout(300);await expect(page.locator('#chopValue')).toHaveText(count!);
  await page.locator('#actionBtn').click();await expect(page.locator('#chopValue')).not.toHaveText(count!);
  await page.keyboard.press('Escape');await page.locator('#confirmExit').click();await page.locator('#acceptPlan').click();
  await expect(page.locator('#setupDemoToggle')).toHaveAttribute('aria-checked', 'false');
});

test('real camera stays separate after demo and errors never turn simulation back on', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('no camera', 'NotFoundError'); };
  });
  await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();
  await page.locator('#cameraStart').click();
  await expect(page.locator('#setupDemoToggle')).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('#demoPreviewSetup')).toBeHidden();
  await expect(page.locator('#cameraStatus')).toContainText('未找到摄像头');
  await expect(page.locator('#cameraFrames')).toHaveText('0');await expect(page.locator('#chopValue')).toHaveText('0/15');
  await page.waitForTimeout(300);await expect(page.locator('#setupDemoToggle')).toHaveAttribute('aria-checked', 'false');
});

test('automatic carry freezes on blur, resumes with fresh samples and stops when toggled off', async ({ page }) => {
  await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();
  await page.locator('#beginDemo').click();
  await expect.poll(async () => parseFloat((await page.locator('#carryValue').textContent())!), { timeout: 20000 }).toBeGreaterThan(0);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#statusTag')).toHaveText('已暂停');
  const stopped = await page.locator('#carryValue').textContent();
  await page.waitForTimeout(400);await expect(page.locator('#carryValue')).toHaveText(stopped!);
  await page.locator('#pauseBtn').click();await expect(page.locator('#carryValue')).not.toHaveText(stopped!);
  await page.locator('#demoToggle').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  const off = await page.locator('#carryValue').textContent();
  await page.locator('#pauseBtn').click();await page.waitForTimeout(400);await expect(page.locator('#carryValue')).toHaveText(off!);
  await expect(page.locator('#resultsModal')).toBeHidden();
});

test('enabling simulation cancels a pending camera request and releases the late stream', async ({ page }) => {
  await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();
  await page.evaluate(() => {
    const canvas = document.createElement('canvas');canvas.width = 80;canvas.height = 60;
    canvas.getContext('2d')!.fillRect(0, 0, 80, 60);
    const stream = canvas.captureStream(5);
    Object.assign(window, { demoTestTracks: stream.getTracks() });
    navigator.mediaDevices.getUserMedia = () => {
      document.documentElement.dataset.cameraRequested = 'true';
      return new Promise(resolve => setTimeout(() => resolve(stream), 700));
    };
  });
  await page.locator('#cameraStart').click();await expect(page.locator('html')).toHaveAttribute('data-camera-requested', 'true');
  await page.locator('#setupDemoToggle').click();
  await expect.poll(() => page.evaluate(() => (window as Window & { demoTestTracks?: MediaStreamTrack[] }).demoTestTracks?.every(t => t.readyState === 'ended'))).toBe(true);
  await expect(page.locator('#setupDemoToggle')).toHaveAttribute('aria-checked', 'true');
  expect(await page.locator('#cameraVideo').evaluate((v: HTMLVideoElement) => v.srcObject)).toBeNull();
  await expect(page.locator('#cameraFrames')).toHaveText('0');await expect(page.locator('#chopValue')).toHaveText('0/15');
});
