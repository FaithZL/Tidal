# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: demo-toggle.spec.ts >> no-camera demo is explicit, completes the full farm flow and resets with its chosen preference without camera requests
- Location: tests\e2e\demo-toggle.spec.ts:6:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('#setupDemoToggle')
    - locator resolved to <button role="switch" id="setupDemoToggle" aria-checked="false" class="secondary demo-toggle">无摄像头测试：关</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
    114 × waiting for element to be visible, enabled and stable
        - element is not visible
      - retrying click action
        - waiting 500ms
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying
    - locator resolved to <button role="switch" id="setupDemoToggle" aria-checked="false" class="secondary demo-toggle">无摄像头测试：关</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [active]:
  - generic [ref=f1e1]:
    - banner:
      - generic:
        - generic:
          - text: T
          - generic: ✦
        - generic:
          - generic: TIDAL FARM
          - generic: 每一次运动，都让世界生长
      - generic [ref=f1e2]:
        - generic [ref=f1e3]: 本地测试加速模式
        - generic [ref=f1e4]: ⌨ 键盘演示 · 非真实动作识别
        - switch "无摄像头测试：关" [ref=f1e5] [cursor=pointer]
        - button "开启音效" [ref=f1e6] [cursor=pointer]
        - button "重新开始" [ref=f1e7] [cursor=pointer]
    - main [ref=f1e8]:
      - generic [ref=f1e9]:
        - generic:
          - generic:
            - generic: YOUR LITTLE WORLD
            - heading "一座农场，等待你的第一步" [level=1]
          - generic: 今日劳作 · 体验计划
        - generic [ref=f1e10]:
          - img "可旋转三维农场。地面0、车上0、到家0。" [ref=f1e11]:
            - generic "可旋转的三维农场，拖拽旋转、滚轮缩放" [ref=f1e12]
          - generic:
            - generic: 从一件小事开始，让这座农场苏醒。
            - generic: 0%
        - generic "训练任务阶段":
          - generic:
            - generic: 🪓
            - generic:
              - text: 砍伐杉树
              - generic: 壶铃挥砍
          - generic:
            - generic: 🪵
            - generic:
              - text: 木材装车
              - generic: 深蹲推举
          - generic:
            - generic: 🛒
            - generic:
              - text: 运输木材
              - generic: 持续持姿
      - complementary [ref=f1e13]:
        - generic [ref=f1e14]:
          - generic [ref=f1e15]: MISSION CONTROL
          - generic [ref=f1e16]: 未开始
        - heading "农场计划" [level=2] [ref=f1e17]
        - generic [ref=f1e18]:
          - generic [ref=f1e19]: 准备开始今天的劳作。
          - button "等待任务开始" [disabled] [ref=f1e20]
          - paragraph [ref=f1e21]: 按 Space 完成一次动作循环（禁用自动重复）
    - generic "三维视角控制" [ref=f1e22]:
      - generic [ref=f1e23]: 拖拽旋转 · 滚轮缩放
      - button "向左旋转视角" [ref=f1e24] [cursor=pointer]: ↶
      - button "向右旋转视角" [ref=f1e25] [cursor=pointer]: ↷
      - button "全景视角" [ref=f1e26] [cursor=pointer]
    - contentinfo:
      - status: 会话 session-1 · 未开始
  - dialog [ref=f1e27]:
    - generic [ref=f1e28]:
      - generic [ref=f1e29]: 禾
      - generic [ref=f1e30]:
        - text: 禾禾 · 农场管家
        - generic [ref=f1e31]: A LITTLE EVERY DAY
      - generic [ref=f1e32]: 今日
    - heading "农场今日劳作" [level=2] [ref=f1e33]
    - paragraph [ref=f1e34]: 从林间到谷仓，让每一次运动都留下收获。
    - generic [ref=f1e35]:
      - generic [ref=f1e36]: "01"
      - generic [ref=f1e37]:
        - generic [ref=f1e38]: 砍伐杉树
        - generic [ref=f1e39]: 挥砍 5 次 × 3 棵 · 共 15 次
    - generic [ref=f1e40]:
      - generic [ref=f1e41]: "02"
      - generic [ref=f1e42]:
        - generic [ref=f1e43]: 收集木材
        - generic [ref=f1e44]: 深蹲推举 15 次 · 装车 15 份木材
    - generic [ref=f1e45]:
      - generic [ref=f1e46]: "03"
      - generic [ref=f1e47]:
        - generic [ref=f1e48]: 推车回家
        - generic [ref=f1e49]: 持续持姿 2 秒 · 返回农场
    - generic [ref=f1e50]: 今日为预设训练计划 · 概念演示，非 AI 自动规划。
    - generic [ref=f1e51]:
      - button "稍后再说" [ref=f1e52] [cursor=pointer]
      - button "接受今天的任务 →" [ref=f1e53] [cursor=pointer]
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
> 16  |   await expect(toggle).toHaveAttribute('aria-checked', 'false');await toggle.click();
      |                                                                              ^ Error: locator.click: Test timeout of 60000ms exceeded.
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
  69  |   await page.evaluate(()=>new Promise<void>(resolve=>{
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