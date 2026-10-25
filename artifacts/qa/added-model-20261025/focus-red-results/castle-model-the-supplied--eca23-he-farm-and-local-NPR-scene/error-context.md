# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: castle-model.spec.ts >> the supplied castle is a real grounded mesh in the farm and local NPR scene
- Location: tests/e2e/castle-model.spec.ts:4:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '城堡近景', exact: true })

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
        - generic [ref=e3]: ⌨ 键盘演示 · 非真实动作识别
        - switch "无摄像头测试：关" [ref=e4] [cursor=pointer]
        - button "开启音效" [ref=e5] [cursor=pointer]
        - button "重新开始" [ref=e6] [cursor=pointer]
    - main [ref=e7]:
      - generic [ref=e8]:
        - generic:
          - generic:
            - generic: YOUR LITTLE WORLD
            - heading "一座农场，等待你的第一步" [level=1]
          - generic: 今日劳作 · 体验计划
        - generic [ref=e9]:
          - img "可旋转三维农场。地面0、车上0、到家0。" [ref=e10]:
            - generic "可旋转的三维农场，拖拽旋转、滚轮缩放" [ref=e11]
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
      - complementary [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: MISSION CONTROL
          - generic [ref=e15]: 未开始
        - heading "农场计划" [level=2] [ref=e16]
        - generic [ref=e17]:
          - generic [ref=e18]: 准备开始今天的劳作。
          - button "等待任务开始" [disabled] [ref=e19]
          - paragraph [ref=e20]: 按 Space 完成一次动作循环（禁用自动重复）
    - generic "三维视角控制" [ref=e21]:
      - generic [ref=e22]: 拖拽旋转 · 滚轮缩放
      - button "向左旋转视角" [ref=e23] [cursor=pointer]: ↶
      - button "向右旋转视角" [ref=e24] [cursor=pointer]: ↷
      - button "全景视角" [ref=e25] [cursor=pointer]
    - contentinfo:
      - status: 会话 session-1 · 未开始
  - dialog [ref=e26]:
    - generic [ref=e27]:
      - generic [ref=e28]: 禾
      - generic [ref=e29]:
        - text: 禾禾 · 农场管家
        - generic [ref=e30]: A LITTLE EVERY DAY
      - generic [ref=e31]: 今日
    - heading "农场今日劳作" [level=2] [ref=e32]
    - paragraph [ref=e33]: 从林间到谷仓，让每一次运动都留下收获。
    - generic [ref=e34]:
      - generic [ref=e35]: "01"
      - generic [ref=e36]:
        - generic [ref=e37]: 砍伐杉树
        - generic [ref=e38]: 挥砍 5 次 × 3 棵 · 共 15 次
    - generic [ref=e39]:
      - generic [ref=e40]: "02"
      - generic [ref=e41]:
        - generic [ref=e42]: 收集木材
        - generic [ref=e43]: 深蹲推举 15 次 · 装车 15 份木材
    - generic [ref=e44]:
      - generic [ref=e45]: "03"
      - generic [ref=e46]:
        - generic [ref=e47]: 推车回家
        - generic [ref=e48]: 持续持姿 60 秒 · 返回农场
    - generic [ref=e49]: 今日为预设训练计划 · 概念演示，非 AI 自动规划。
    - generic [ref=e50]:
      - button "稍后再说" [ref=e51] [cursor=pointer]
      - button "接受今天的任务 →" [ref=e52] [cursor=pointer]
```

# Test source

```ts
  1  | import {test,expect} from '../helpers/manualModeTest.js';
  2  | test.use({channel:'chromium'});
  3  | 
  4  | test('the supplied castle is a real grounded mesh in the farm and local NPR scene',async({page})=>{
  5  |  const errors:string[]=[],external:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  6  |  page.on('request',r=>{if(!['http://127.0.0.1:4173','null'].includes(new URL(r.url()).origin))external.push(r.url());});
  7  |  for(const url of ['/', '/?art=npr-sample']){
  8  |   const response=page.waitForResponse(r=>r.url().endsWith('/assets/user-models/castle.fbx'));
  9  |   await page.goto(url);expect((await response).status()).toBe(200);
  10 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');
  11 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-castle','user-fbx');
  12 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-castle-triangles','60000');
  13 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-castle-position','-10.000,0.025,-29.000');
  14 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/0');
> 15 |   const before=await page.locator('#worldCanvas').getAttribute('data-camera');await page.getByRole('button',{name:'城堡近景',exact:true}).click();
     |                                                                                                                                       ^ Error: locator.click: Test timeout of 60000ms exceeded.
  16 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-view','castle');
  17 |   await expect(page.locator('#worldCanvas')).not.toHaveAttribute('data-camera',before!);
  18 |   await expect(page.locator('#chopValue')).toHaveText('0/15');await page.locator('#viewReset').click();
  19 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-view','farm');
  20 |  }
  21 |  expect(errors).toEqual([]);expect(external).toEqual([]);
  22 | });
  23 | 
  24 | test('a delayed castle keeps the farm start gate closed and a missing castle fails explicitly',async({page})=>{
  25 |  let release=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
  26 |  await page.route('**/assets/user-models/castle.fbx',async route=>{await gate;await route.fulfill({status:404,body:'missing fixture'});});
  27 |  await page.goto('/',{waitUntil:'domcontentloaded'});
  28 |  try{await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','loading');}finally{release();}
  29 |  await expect(page.locator('#renderError')).toContainText('用户城堡模型加载失败');
  30 |  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','failed');
  31 |  await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  32 | });
  33 | 
```