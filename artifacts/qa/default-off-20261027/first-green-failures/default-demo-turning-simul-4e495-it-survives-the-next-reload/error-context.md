# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: default-demo.spec.ts >> turning simulation off survives reload, and explicitly enabling it survives the next reload
- Location: tests/e2e/default-demo.spec.ts:19:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('#statusTag')
Expected: "训练中"
Received: "未开始"
Timeout:  7000ms

Call log:
  - Expect "toHaveText" locator('#statusTag') with timeout 7000ms
  - waiting for locator('#statusTag')
    14 × locator resolved to <span id="statusTag" class="subtag">未开始</span>
       - unexpected value "未开始"

```

```yaml
- text: 未开始
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import {mkdir} from 'node:fs/promises';
  3  | test.use({baseURL:'http://127.0.0.1:4174'});
  4  | 
  5  | test('fresh visits and reloads leave simulation off without hidden progression or camera access',async({page})=>{
  6  |  const errors:string[]=[],poseRequests:string[]=[];
  7  |  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/pose_landmarker|\/worker\/|\/mediapipe\//.test(r.url()))poseRequests.push(r.url());});
  8  |  await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{document.documentElement.dataset.cameraRequested='true';throw new Error('camera must stay off');};});
  9  |  await page.goto('/?e2e=1');
  10 |  await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
  11 |  await expect(page.locator('#livePreview')).toBeHidden();await expect(page.locator('#planModal')).toBeVisible();
  12 |  await page.waitForTimeout(700);await expect(page.locator('#app')).toHaveAttribute('data-phase','home');await expect(page.locator('#chopValue')).toHaveText('0/15');
  13 |  await page.reload();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
  14 |  await page.waitForTimeout(700);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#resultsModal')).toBeHidden();
  15 |  await mkdir('artifacts/qa/default-off-20261027',{recursive:true});await page.screenshot({path:'artifacts/qa/default-off-20261027/initial-off.png'});
  16 |  expect(await page.locator('html').getAttribute('data-camera-requested')).toBeNull();expect(poseRequests).toEqual([]);expect(errors).toEqual([]);
  17 | });
  18 | 
  19 | test('turning simulation off survives reload, and explicitly enabling it survives the next reload',async({page})=>{
> 20 |  await page.goto('/?e2e=1');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await page.locator('#demoToggle').click();await page.reload();await expect(page.locator('#statusTag')).toHaveText('训练中');
     |                                                                                                                                                                                                                      ^ Error: expect(locator).toHaveText(expected) failed
  21 |  await page.locator('#demoToggle').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  22 |  const stopped=await page.locator('#chopValue').textContent();await page.waitForTimeout(350);await expect(page.locator('#chopValue')).toHaveText(stopped!);
  23 |  await page.reload();await expect(page.locator('#planModal')).toBeVisible();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
  24 |  await page.waitForTimeout(350);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#demoPreviewGame')).toBeHidden();
  25 |  await page.locator('#demoToggle').click();await page.reload();await expect(page.locator('#statusTag')).toHaveText('训练中');
  26 |  await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','true');await expect(page.locator('#demoPreviewGame')).toBeVisible();
  27 | });
  28 | 
  29 | test('choosing real camera opts out of autoplay even when the device fails and the page reloads',async({page})=>{
  30 |  await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{document.documentElement.dataset.cameraRequested='true';throw new DOMException('no physical camera','NotFoundError');};});
  31 |  await page.goto('/?e2e=1');await page.locator('#demoToggle').click();await page.reload();await expect(page.locator('#statusTag')).toHaveText('训练中');
  32 |  await page.locator('#resetBtn').click();await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();
  33 |  await expect(page.locator('#cameraStatus')).toContainText('未找到摄像头');await expect(page.locator('#setupDemoToggle')).toHaveAttribute('aria-checked','false');
  34 |  await page.reload();await expect(page.locator('#planModal')).toBeVisible();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
  35 |  await page.waitForTimeout(350);await expect(page.locator('#chopValue')).toHaveText('0/15');
  36 |  expect(await page.locator('html').getAttribute('data-camera-requested')).toBeNull();
  37 | });
  38 | 
  39 | test('blocked browser storage defaults off and still permits explicit session-local simulation',async({page})=>{
  40 |  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  41 |  await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError');}});});
  42 |  await page.goto('/?e2e=1');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#planModal')).toBeVisible();
  43 |  await page.locator('#demoToggle').click();await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  44 |  await page.locator('#demoToggle').click();await page.locator('#resetBtn').click();
  45 |  await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#planModal')).toBeVisible();
  46 |  await page.reload();await expect(page.locator('#statusTag')).toHaveText('未开始');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');expect(errors).toEqual([]);
  47 | });
  48 | 
  49 | test('a renderer initialization failure keeps default autoplay at home with no hidden progression',async({page})=>{
  50 |  await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));
  51 |  await page.addInitScript(()=>{window.ResizeObserver=class{constructor(){throw new Error('test initialization failure');}} as unknown as typeof ResizeObserver;});
  52 |  await page.goto('/?e2e=1');await expect(page.locator('#renderError')).toContainText('无法启动3D');
  53 |  await expect(page.locator('#planModal')).toBeVisible();await expect(page.locator('#acceptPlan')).toBeDisabled();
  54 |  await page.waitForTimeout(400);await expect(page.locator('#statusTag')).toHaveText('未开始');await expect(page.locator('#chopValue')).toHaveText('0/15');
  55 | });
  56 | 
```