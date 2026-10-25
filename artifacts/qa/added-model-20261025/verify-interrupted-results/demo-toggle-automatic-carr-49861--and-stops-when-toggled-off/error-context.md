# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo-toggle.spec.ts >> automatic carry freezes on blur, resumes with fresh samples and stops when toggled off
- Location: tests/e2e/demo-toggle.spec.ts:64:1

# Error details

```
Error: page.evaluate: Test ended.
```

# Test source

```ts
  1   | import { expect, test } from '../helpers/manualModeTest.js';
  2   | import { mkdir } from 'node:fs/promises';
  3   | 
  4   | test.use({ baseURL: 'http://127.0.0.1:4174' });
  5   | 
  6   | test('no-camera demo is explicit, completes the full farm flow and resets with its chosen preference without camera requests', async ({ page }) => {
  7   |   const errors: string[] = [], requests: string[] = [];
  8   |   page.on('pageerror', e => errors.push(e.message));page.on('request', r => requests.push(r.url()));
  9   |   await page.addInitScript(() => {
  10  |     navigator.mediaDevices.getUserMedia = async () => {
  11  |       document.documentElement.dataset.cameraRequested = 'true';throw new Error('TEST: camera must not be requested');
  12  |     };
  13  |   });
  14  |   await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();
  15  |   const toggle = page.locator('#setupDemoToggle');
  16  |   await expect(toggle).toHaveAttribute('aria-checked', 'false');await toggle.click();
  17  |   await expect(toggle).toHaveAttribute('aria-checked', 'true');
  18  |   await expect(page.locator('#demoPreviewSetup')).toBeVisible();
  19  |   await expect(page.locator('#demoPreviewSetup')).toContainText('合成骨架');
  20  |   const first = await page.locator('#demoSetupCanvas').evaluate((c: HTMLCanvasElement) => c.toDataURL());
  21  |   await expect.poll(() => page.locator('#demoSetupCanvas').evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toBe(first);
  22  |   await expect(page.locator('#chopValue')).toHaveText('0/15');
  23  |   await mkdir('artifacts/qa/demo-toggle', { recursive: true });
  24  |   await page.screenshot({ path: 'artifacts/qa/demo-toggle/setup.png', fullPage: true });
  25  |   await page.locator('#beginDemo').click();await expect(page.locator('#demoPreviewGame')).toBeVisible();
  26  |   await expect(page.locator('#modeBadge')).toContainText('自动模拟');
  27  |   await page.screenshot({ path: 'artifacts/qa/demo-toggle/running.png', fullPage: true });
  28  |   await expect(page.locator('#resultsModal')).toBeVisible({ timeout: 30000 });
  29  |   await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#rewardCoins')).toHaveText('100');
  30  |   await expect(page.locator('#actualMetrics')).toContainText('自动模拟');
  31  |   await page.locator('#resultsHome').click();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked', 'true');
  32  |   await expect(page.locator('#planModal')).toBeVisible();await expect(page.locator('#statusTag')).toHaveText('未开始');
  33  |   await page.waitForTimeout(300);await expect(page.locator('#chopValue')).toHaveText('0/15');
  34  |   expect(requests.filter(url => /pose_landmarker|\/worker\/|\/mediapipe\//.test(url))).toEqual([]);
  35  |   expect(await page.locator('html').getAttribute('data-camera-requested')).toBeNull();
  36  |   expect(errors).toEqual([]);
  37  | });
  38  | 
  39  | test('turning demo off cancels partial input and pauses; manual mode can resume', async ({ page }) => {
  40  |   await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();
  41  |   await page.locator('#beginDemo').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  42  |   await page.locator('#demoToggle').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  43  |   const count = await page.locator('#chopValue').textContent();await page.waitForTimeout(450);
  44  |   await expect(page.locator('#chopValue')).toHaveText(count!);await expect(page.locator('#demoPreviewGame')).toBeHidden();
  45  |   await page.locator('#pauseBtn').click();await page.waitForTimeout(300);await expect(page.locator('#chopValue')).toHaveText(count!);
  46  |   await page.locator('#actionBtn').click();await expect(page.locator('#chopValue')).not.toHaveText(count!);
  47  |   await page.keyboard.press('Escape');await page.locator('#confirmExit').click();await page.locator('#acceptPlan').click();
  48  |   await expect(page.locator('#setupDemoToggle')).toHaveAttribute('aria-checked', 'false');
  49  | });
  50  | 
  51  | test('real camera stays separate after demo and errors never turn simulation back on', async ({ page }) => {
  52  |   await page.addInitScript(() => {
  53  |     navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('no camera', 'NotFoundError'); };
  54  |   });
  55  |   await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();
  56  |   await page.locator('#cameraStart').click();
  57  |   await expect(page.locator('#setupDemoToggle')).toHaveAttribute('aria-checked', 'false');
  58  |   await expect(page.locator('#demoPreviewSetup')).toBeHidden();
  59  |   await expect(page.locator('#cameraStatus')).toContainText('未找到摄像头');
  60  |   await expect(page.locator('#cameraFrames')).toHaveText('0');await expect(page.locator('#chopValue')).toHaveText('0/15');
  61  |   await page.waitForTimeout(300);await expect(page.locator('#setupDemoToggle')).toHaveAttribute('aria-checked', 'false');
  62  | });
  63  | 
  64  | test('automatic carry freezes on blur, resumes with fresh samples and stops when toggled off', async ({ page }) => {
  65  |   await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();
  66  |   await page.locator('#beginDemo').click();
  67  |   // Pause on the first sample. Backoff polling can consume most of the 1.3s test target,
  68  |   // letting results cover the switch before the test reaches its toggle-off assertion.
> 69  |   await page.evaluate(()=>new Promise<void>(resolve=>{
      |              ^ Error: page.evaluate: Test ended.
  70  |     const value=document.getElementById('carryValue')!;
  71  |     const observer=new MutationObserver(()=>{
  72  |       if(parseFloat(value.textContent!)>0){observer.disconnect();window.dispatchEvent(new Event('blur'));resolve();}
  73  |     });
  74  |     observer.observe(value,{childList:true});
  75  |   }));
  76  |   await expect(page.locator('#statusTag')).toHaveText('已暂停');
  77  |   const stopped = await page.locator('#carryValue').textContent();
  78  |   await page.waitForTimeout(400);await expect(page.locator('#carryValue')).toHaveText(stopped!);
  79  |   await page.locator('#pauseBtn').click();await expect(page.locator('#carryValue')).not.toHaveText(stopped!);
  80  |   await page.locator('#demoToggle').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  81  |   const off = await page.locator('#carryValue').textContent();
  82  |   await page.locator('#pauseBtn').click();await page.waitForTimeout(400);await expect(page.locator('#carryValue')).toHaveText(off!);
  83  |   await expect(page.locator('#resultsModal')).toBeHidden();
  84  | });
  85  | 
  86  | test('enabling simulation cancels a pending camera request and releases the late stream', async ({ page }) => {
  87  |   await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();
  88  |   await page.evaluate(() => {
  89  |     const canvas = document.createElement('canvas');canvas.width = 80;canvas.height = 60;
  90  |     canvas.getContext('2d')!.fillRect(0, 0, 80, 60);
  91  |     const stream = canvas.captureStream(5);
  92  |     Object.assign(window, { demoTestTracks: stream.getTracks() });
  93  |     navigator.mediaDevices.getUserMedia = () => {
  94  |       document.documentElement.dataset.cameraRequested = 'true';
  95  |       return new Promise(resolve => setTimeout(() => resolve(stream), 700));
  96  |     };
  97  |   });
  98  |   await page.locator('#cameraStart').click();await expect(page.locator('html')).toHaveAttribute('data-camera-requested', 'true');
  99  |   await page.locator('#setupDemoToggle').click();
  100 |   await expect.poll(() => page.evaluate(() => (window as Window & { demoTestTracks?: MediaStreamTrack[] }).demoTestTracks?.every(t => t.readyState === 'ended'))).toBe(true);
  101 |   await expect(page.locator('#setupDemoToggle')).toHaveAttribute('aria-checked', 'true');
  102 |   expect(await page.locator('#cameraVideo').evaluate((v: HTMLVideoElement) => v.srcObject)).toBeNull();
  103 |   await expect(page.locator('#cameraFrames')).toHaveText('0');await expect(page.locator('#chopValue')).toHaveText('0/15');
  104 | });
  105 | 
```