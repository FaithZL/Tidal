# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: default-off.spec.ts >> an unrecognized saved preference does not enable automatic play
- Location: tests/e2e/default-off.spec.ts:17:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#app')
Expected: "home"
Received: "results"
Timeout:  7000ms

Call log:
  - Expect "toHaveAttribute" locator('#app') with timeout 7000ms
  - waiting for locator('#app')
    2 × locator resolved to <div id="app" data-phase="countdown" data-animations-stopped="false" data-camera-exercise="upper-body">…</div>
      - unexpected value "countdown"
    5 × locator resolved to <div id="app" data-phase="active" data-animations-stopped="false" data-camera-exercise="upper-body">…</div>
      - unexpected value "active"
    - locator resolved to <div id="app" data-phase="countdown" data-animations-stopped="false" data-camera-exercise="upper-body">…</div>
    - unexpected value "countdown"
    3 × locator resolved to <div id="app" data-phase="active" data-animations-stopped="false" data-camera-exercise="upper-body">…</div>
      - unexpected value "active"
    - locator resolved to <div id="app" data-phase="countdown" data-animations-stopped="false" data-camera-exercise="upper-body">…</div>
    - unexpected value "countdown"
    2 × locator resolved to <div id="app" data-phase="active" data-animations-stopped="false" data-camera-exercise="upper-body">…</div>
      - unexpected value "active"
    4 × locator resolved to <div id="app" data-phase="results" data-animations-stopped="false" data-camera-exercise="upper-body">…</div>
      - unexpected value "results"

```

```yaml
- banner:
  - text: T ✦ TIDAL FARM 每一次运动，都让世界生长 本地测试加速模式 ▶ 自动模拟 · 非真实动作识别
  - switch "无摄像头测试：开" [checked]
  - button "摄像头识别" [disabled]
  - button "停止动画"
  - button "动作教学"
  - button "开启音效"
  - button "重新开始"
- main:
  - text: YOUR LITTLE WORLD
  - heading "今天的收获已装满手推车" [level=1]
  - text: 今日收获 · 已完成
  - img "可旋转三维农场。地面0、车上0、到家15。"
  - text: 从一件小事开始，让这座农场苏醒。 100% 🪓 砍伐杉树 壶铃挥砍 🪵 木材装车 深蹲推举 🛒 运输木材 持续持姿
  - complementary
- text: 拖拽旋转 · 滚轮缩放
- button "向左旋转视角": ↶
- button "向右旋转视角": ↷
- button "城堡近景"
- button "全景视角"
- contentinfo:
  - status: 会话 session-1 · 已完成
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  3  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  4  | test('completing all three poses leaves simulation off and waits for explicit manual input',async({page})=>{
  5  |  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
  6  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
  7  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.evaluate(()=>{window.upperFixture.pose='raised';});
  8  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await page.evaluate(()=>{window.upperFixture.pose='hold';});
  9  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-finished','true');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
  10 |  await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);await expect(page.locator('#cameraVideo')).toHaveJSProperty('srcObject',null);
  11 |  await expect(page.locator('#statusTag')).toHaveText('训练中');await page.evaluate(()=>{window.upperFixture.pose='raised';window.upperFixture.low=true;});
  12 |  await page.waitForTimeout(1500);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#loadValue')).toHaveText('0/15');
  13 |  await expect(page.locator('#modeBadge')).toContainText('键盘演示');await page.locator('#actionBtn').click();await expect(page.locator('#chopValue')).toHaveText('1/15');
  14 |  await page.locator('#demoToggle').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');await page.locator('#pauseBtn').click();await expect(page.locator('#modeBadge')).toContainText('自动模拟');
  15 |  await expect.poll(async()=>parseInt(await page.locator('#chopValue').textContent()??'0')).toBeGreaterThan(1);
  16 | });
  17 | test('an unrecognized saved preference does not enable automatic play',async({page})=>{
  18 |  await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','invalid'));await page.goto('/?e2e=1');
> 19 |  await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await page.waitForTimeout(500);await expect(page.locator('#app')).toHaveAttribute('data-phase','home');await expect(page.locator('#chopValue')).toHaveText('0/15');
     |                                                                                                                                                      ^ Error: expect(locator).toHaveAttribute(expected) failed
  20 | });
  21 | 
```