# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: default-off.spec.ts >> completing all three poses keeps the live camera counting while simulation stays off
- Location: tests/e2e/default-off.spec.ts:4:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 0

Call Log:
- Timeout 7000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner:
    - generic:
      - generic:
        - text: T
        - generic: ✦
      - generic:
        - generic: TIDAL FARM
        - generic: 每一次运动，都让世界生长
    - generic [ref=e2]:
      - generic [ref=e3]: 本地测试加速模式
      - generic [ref=e4]: ⌨ 键盘演示 · 非真实动作识别
      - switch "无摄像头测试：关" [ref=e5] [cursor=pointer]
      - button "摄像头识别" [ref=e6] [cursor=pointer]
      - button "停止动画" [ref=e7] [cursor=pointer]
      - button "动作教学" [ref=e8] [cursor=pointer]
      - button "开启音效" [ref=e9] [cursor=pointer]
      - button "暂停" [ref=e10] [cursor=pointer]
      - button "重新开始" [ref=e11] [cursor=pointer]
  - status: 三步识别已完成，摄像头与动作识别已关闭，不再检测你的动作。
  - main [ref=e12]:
    - generic [ref=e13]:
      - generic:
        - generic:
          - generic: YOUR LITTLE WORLD
          - heading "砍伐杉树" [level=1]
        - generic: 今日劳作 · 体验计划
      - generic [ref=e14]:
        - img "可旋转三维农场。地面0、车上0、到家0。" [ref=e15]:
          - generic "可旋转的三维农场，拖拽旋转、滚轮缩放" [ref=e16]
          - generic:
            - text: 用户人物/房屋 · 挥砍 / 装车 / 行走动作
            - link "原动作对照" [ref=e17] [cursor=pointer]:
              - /url: /?art=npr-sample&model=prototype
        - generic:
          - generic: 空格触发一次“上举 → 下挥 → 复位”，完整循环后记数。
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
    - complementary [ref=e18]:
      - generic [ref=e19]:
        - generic [ref=e20]: MISSION CONTROL
        - generic [ref=e21]: 训练中
      - heading "砍伐杉树" [level=2] [ref=e22]
      - paragraph [ref=e23]: 空格触发一次“上举 → 下挥 → 复位”，完整循环后记数。
      - generic [ref=e24]:
        - generic [ref=e25]:
          - generic [ref=e26]: 🪓 已完成挥砍
          - strong [ref=e27]: 0/15
        - generic [ref=e28]:
          - generic [ref=e29]: 🪵 已装车木材
          - strong [ref=e30]: 0/15
        - generic [ref=e31]:
          - generic [ref=e32]: ⏱ 有效拉车
          - strong [ref=e33]: 0.0/2s
        - generic [ref=e34]:
          - generic [ref=e35]: 🌲 砍倒树木
          - strong [ref=e36]: 0/3
      - generic [ref=e37]:
        - generic [ref=e38]: ✧
        - generic [ref=e39]:
          - text: 将运动变成资产
          - generic [ref=e40]: 收集资源 · 升级农场 · 获得正反馈
      - generic [ref=e41]:
        - generic [ref=e42]: 空格触发一次“上举 → 下挥 → 复位”，完整循环后记数。
        - button "🪓 模拟一次挥砍" [ref=e43] [cursor=pointer]
        - paragraph [ref=e44]: 按 Space 完成一次动作循环（禁用自动重复）
      - group [ref=e45]:
        - generic "输入诊断" [ref=e46] [cursor=pointer]
  - generic "三维视角控制" [ref=e47]:
    - generic [ref=e48]: 拖拽旋转 · 滚轮缩放
    - button "向左旋转视角" [ref=e49] [cursor=pointer]: ↶
    - button "向右旋转视角" [ref=e50] [cursor=pointer]: ↷
    - button "城堡近景" [ref=e51] [cursor=pointer]
    - button "全景视角" [ref=e52] [cursor=pointer]
  - complementary "标准动作示范":
    - img "挥砍标准动作骨骼示范"
    - generic:
      - generic: 挥砍
      - generic: 缓慢下挥
    - generic: 动作示意 · 按个人标定范围跟做
  - contentinfo:
    - status: 会话 session-1 · 训练中
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  3  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  4  | test('completing all three poses keeps the live camera counting while simulation stays off',async({page})=>{
  5  |  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
  6  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
  7  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.evaluate(()=>{window.upperFixture.pose='raised';});
  8  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await page.evaluate(()=>{window.upperFixture.pose='hold';});
  9  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
> 10 |  await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(1);
     |                                                                        ^ Error: expect(received).toBe(expected) // Object.is equality
  11 |  expect(await page.evaluate(()=>window.upperFixture.tracks.length)).toBe(1);expect(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='live'))).toBe(true);
  12 |  await expect(page.locator('#cameraVideo')).not.toHaveJSProperty('srcObject',null);
  13 |  await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#modeBadge')).toContainText('上半身');
  14 |  await page.waitForTimeout(1500);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#loadValue')).toHaveText('0/15');
  15 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
  16 |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');await page.waitForTimeout(400);
  17 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#chopValue')).toHaveText('1/15');
  18 |  await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#statusTag')).not.toHaveText('训练中');await page.waitForTimeout(500);await expect(page.locator('#chopValue')).toHaveText('1/15');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');
  19 |  await page.evaluate(()=>{window.upperFixture.low=false;});await expect(page.locator('#statusTag')).toHaveText('训练中');
  20 |  await page.locator('#demoToggle').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');await page.locator('#pauseBtn').click();await expect(page.locator('#modeBadge')).toContainText('自动模拟');
  21 |  await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);
  22 |  await expect.poll(async()=>parseInt(await page.locator('#chopValue').textContent()??'0')).toBeGreaterThan(1);
  23 | });
  24 | test('an unrecognized saved preference does not enable automatic play',async({page})=>{
  25 |  await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','invalid'));await page.goto('/?e2e=1');
  26 |  await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await page.waitForTimeout(500);await expect(page.locator('#app')).toHaveAttribute('data-phase','home');await expect(page.locator('#chopValue')).toHaveText('0/15');
  27 | });
  28 | 
```