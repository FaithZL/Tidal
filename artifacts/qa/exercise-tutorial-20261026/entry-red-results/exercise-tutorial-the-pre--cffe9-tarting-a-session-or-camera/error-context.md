# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: exercise-tutorial.spec.ts >> the pre-training tutorial explains all three movements without starting a session or camera
- Location: tests/e2e/exercise-tutorial.spec.ts:4:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '先看动作教学', exact: true })

```

# Page snapshot

```yaml
- generic [active]:
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
        - button "开启音效" [ref=e6] [cursor=pointer]
        - button "重新开始" [ref=e7] [cursor=pointer]
    - main [ref=e8]:
      - generic [ref=e9]:
        - generic:
          - generic:
            - generic: YOUR LITTLE WORLD
            - heading "一座农场，等待你的第一步" [level=1]
          - generic: 今日劳作 · 体验计划
        - generic [ref=e10]:
          - img "可旋转三维农场。地面0、车上0、到家0。" [ref=e11]:
            - generic "可旋转的三维农场，拖拽旋转、滚轮缩放" [ref=e12]
            - generic:
              - text: 用户人物/房屋 · 挥砍 / 装车 / 行走动作
              - link "原动作对照" [ref=e13] [cursor=pointer]:
                - /url: /?art=npr-sample&model=prototype
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
      - complementary [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: MISSION CONTROL
          - generic [ref=e17]: 未开始
        - heading "农场计划" [level=2] [ref=e18]
        - generic [ref=e19]:
          - generic [ref=e20]: 准备开始今天的劳作。
          - button "等待任务开始" [disabled] [ref=e21]
          - paragraph [ref=e22]: 按 Space 完成一次动作循环（禁用自动重复）
    - generic "三维视角控制" [ref=e23]:
      - generic [ref=e24]: 拖拽旋转 · 滚轮缩放
      - button "向左旋转视角" [ref=e25] [cursor=pointer]: ↶
      - button "向右旋转视角" [ref=e26] [cursor=pointer]: ↷
      - button "城堡近景" [ref=e27] [cursor=pointer]
      - button "全景视角" [ref=e28] [cursor=pointer]
    - contentinfo:
      - status: 会话 session-1 · 未开始
  - dialog [ref=e29]:
    - generic [ref=e30]:
      - generic [ref=e31]: 禾
      - generic [ref=e32]:
        - text: 禾禾 · 农场管家
        - generic [ref=e33]: A LITTLE EVERY DAY
      - generic [ref=e34]: 今日
    - heading "农场今日劳作" [level=2] [ref=e35]
    - paragraph [ref=e36]: 从林间到谷仓，让每一次运动都留下收获。
    - generic [ref=e37]:
      - generic [ref=e38]: "01"
      - generic [ref=e39]:
        - generic [ref=e40]: 砍伐杉树
        - generic [ref=e41]: 挥砍 5 次 × 3 棵 · 共 15 次
    - generic [ref=e42]:
      - generic [ref=e43]: "02"
      - generic [ref=e44]:
        - generic [ref=e45]: 收集木材
        - generic [ref=e46]: 深蹲推举 15 次 · 装车 15 份木材
    - generic [ref=e47]:
      - generic [ref=e48]: "03"
      - generic [ref=e49]:
        - generic [ref=e50]: 推车回家
        - generic [ref=e51]: 持续持姿 2 秒 · 返回农场
    - generic [ref=e52]: 今日为预设训练计划 · 概念演示，非 AI 自动规划。
    - generic [ref=e53]:
      - button "稍后再说" [ref=e54] [cursor=pointer]
      - button "接受今天的任务 →" [ref=e55] [cursor=pointer]
```

# Test source

```ts
  1  | import {test,expect} from '../helpers/manualModeTest.js';
  2  | 
  3  | test.use({channel:'chromium',baseURL:'http://127.0.0.1:4174'});
  4  | test('the pre-training tutorial explains all three movements without starting a session or camera',async({page})=>{
  5  |  await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new Error('Tutorial must not request a camera');};});
  6  |  await page.goto('/?e2e=1&art=npr-sample');
> 7  |  await page.getByRole('button',{name:'先看动作教学',exact:true}).click();
     |                                                            ^ Error: locator.click: Test timeout of 60000ms exceeded.
  8  |  const dialog=page.getByRole('dialog',{name:'动作教学',exact:true});await expect(dialog).toBeVisible();
  9  |  await expect(page.locator('#app')).toHaveAttribute('data-phase','home');
  10 |  for(const name of ['挥砍','装车','拉车持姿']){await dialog.getByRole('button',{name,exact:true}).click();await expect(dialog.locator('#tutorialStepList button')).not.toHaveCount(0);}
  11 |  await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#loadValue')).toHaveText('0/15');
  12 |  await dialog.getByRole('button',{name:'关闭教学',exact:true}).click();await expect(page.locator('#planModal')).toBeVisible();
  13 | });
  14 | 
```