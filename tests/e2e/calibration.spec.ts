import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { syntheticFrame, type SyntheticPose } from '../helpers/syntheticPose.js';
import type { WorkerRequest, WorkerResponse } from '../../src/pose/types.js';
test.use({ baseURL: 'http://127.0.0.1:4174', launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } });
declare global { interface Window { t06Fixture: { pose: SyntheticPose; low: boolean } } }
async function fixtureCamera(page: Page) {
  const poses = Object.fromEntries((['standing', 'raised', 'down', 'squat', 'press', 'hold'] as const).map(pose => [pose, syntheticFrame(0, pose).landmarks]));
  await page.addInitScript(poses => {
    window.t06Fixture = { pose: 'standing', low: false };
    class FixtureWorker {
      onmessage: ((e: MessageEvent<WorkerResponse>) => void) | null = null;
      onerror = null;
      private epoch = 0;
      private closed = false;
      postMessage(message: WorkerRequest): void {
        if (message.kind === 'init') { this.epoch = message.sourceEpoch;this.reply({ kind: 'ready', sourceEpoch: this.epoch }); }
        else if (message.kind === 'dispose') this.reply({ kind: 'disposed' });
        else {
          message.bitmap.close();const landmarks = structuredClone(poses[window.t06Fixture.pose]);
          if (window.t06Fixture.low) landmarks[16].visibility = .1;
          this.reply({ kind: 'frame', sourceEpoch: this.epoch, requestId: message.requestId,
            frame: { frameId: message.requestId, capturedAtMs: message.capturedAtMs, width: message.width, height: message.height, landmarks, valid: true, inferenceMs: 0 } });
        }
      }
      private reply(data: WorkerResponse): void { queueMicrotask(() => { if (!this.closed) this.onmessage?.({ data } as MessageEvent<WorkerResponse>); }); }
      terminate(): void { this.closed = true; }
    }
    window.Worker = FixtureWorker as unknown as typeof Worker;
  }, poses);
  await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();
  await expect(page.locator('#cameraStatus')).toContainText('推理中');await expect(page.locator('#calibrationCapture')).toBeEnabled();
}
async function capture(page: Page, pose: SyntheticPose, next: string) {
  await page.evaluate(pose => { window.t06Fixture.pose = pose; }, pose);await page.waitForTimeout(150);
  await page.locator('#calibrationCapture').click();
  await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step', next);
}
test('calibration requires camera points and automatic demo cannot pretend to calibrate', async ({ page }) => {
  await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();
  await expect(page.locator('#calibrationCapture')).toBeDisabled();await expect(page.locator('#calibrationStatus')).toContainText('等待');
  await page.locator('#setupDemoToggle').click();await expect(page.locator('#calibrationPanel')).toBeHidden();
  await page.waitForTimeout(500);await page.locator('#setupDemoToggle').click();
  await expect(page.locator('#calibrationCapture')).toBeDisabled();await expect(page.locator('#calibrationReadiness')).not.toContainText('已标定');
});
test('synthetic Worker fixture traverses real UI calibration, then invalidation clears readiness without counting', async ({ page }) => {
  const errors: string[] = [];page.on('pageerror', error => errors.push(error.message));await fixtureCamera(page);
  const sequence: [SyntheticPose, string][] = [['standing', 'chop-raised'], ['raised', 'chop-down'], ['down', 'load-squat'],
    ['squat', 'load-stand'], ['standing', 'load-press'], ['press', 'load-return'], ['standing', 'carry-hold'], ['hold', 'carry-release'], ['standing', 'complete']];
  for (const [pose, next] of sequence) await capture(page, pose, next);
  await expect(page.locator('#calibrationReadiness')).toHaveText('砍树：已标定 · 装车：已标定 · Carry：已标定');
  await expect(page.locator('#calibrationStatus')).toContainText('标定完成');await expect(page.locator('#chopValue')).toHaveText('0/15');
  await page.evaluate(() => {
    const badge = document.createElement('div');badge.textContent = 'QA：合成33点夹具 / 模拟Worker，非真人或模型准确率验收';
    badge.style.cssText = 'position:fixed;z-index:99;top:0;left:0;background:#5b3620;color:white;padding:8px;font-size:13px';document.body.appendChild(badge);
  });
  await mkdir('artifacts/qa/t06', { recursive: true });
  await page.locator('#calibrationPanel').scrollIntoViewIfNeeded();await page.screenshot({ path: 'artifacts/qa/t06/calibrated-synthetic.png', fullPage: true });
  await page.evaluate(() => { window.t06Fixture.low = true; });
  await expect(page.locator('#calibrationReadiness')).not.toContainText('已标定');await expect(page.locator('#calibrationCapture')).toBeDisabled();
  await expect(page.locator('#calibrationReason')).toContainText('主手');expect(errors).toEqual([]);
});
test('leaving setup, changing source or hiding the page cancels calibration sampling', async ({ page }) => {
  await fixtureCamera(page);await page.locator('#calibrationCapture').click();
  await page.locator('#backHome').click();await page.locator('#acceptPlan').click();
  await expect(page.locator('#calibrationCapture')).toBeDisabled();await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step', 'standing');
  await page.locator('#cameraStart').click();await expect(page.locator('#calibrationCapture')).toBeEnabled();
  await page.locator('#calibrationCapture').click();await page.locator('#setupDemoToggle').click();
  await page.waitForTimeout(400);await page.locator('#setupDemoToggle').click();await expect(page.locator('#calibrationCapture')).toBeDisabled();
  await page.locator('#cameraStart').click();await expect(page.locator('#calibrationCapture')).toBeEnabled();await page.locator('#calibrationCapture').click();
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true });document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(300);await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false });document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.locator('#calibrationCapture')).toBeEnabled();
  await page.waitForTimeout(2200);await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step', 'standing');
});
