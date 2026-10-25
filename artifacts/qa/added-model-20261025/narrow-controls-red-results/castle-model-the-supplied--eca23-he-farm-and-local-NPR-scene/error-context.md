# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: castle-model.spec.ts >> the supplied castle is a real grounded mesh in the farm and local NPR scene
- Location: tests/e2e/castle-model.spec.ts:4:1

# Error details

```
Error: expect(received).toBeLessThanOrEqual(expected)

Expected: <= 119
Received:    154
```

# Page snapshot

```yaml
- generic:
  - generic [ref=e1]:
    - banner:
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
          - generic: 0%
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
      - button "向左旋转视角" [ref=e22] [cursor=pointer]: ↶
      - button "向右旋转视角" [ref=e23] [cursor=pointer]: ↷
      - button "城堡近景" [active] [ref=e24] [cursor=pointer]
      - button "全景视角" [ref=e25] [cursor=pointer]
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
  8  |   await page.setViewportSize({width:1366,height:768});
  9  |   const response=page.waitForResponse(r=>r.url().endsWith('/assets/user-models/castle.fbx'));
  10 |   await page.goto(url);expect((await response).status()).toBe(200);
  11 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');
  12 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-castle','user-fbx');
  13 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-castle-triangles','60000');
  14 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-castle-position','-24.000,0.025,-9.000');
  15 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/0');
  16 |   const before=await page.locator('#worldCanvas').getAttribute('data-camera');await page.getByRole('button',{name:'城堡近景',exact:true}).click();
  17 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-view','castle');
  18 |   await expect(page.locator('#worldCanvas')).not.toHaveAttribute('data-camera',before!);
  19 |   await expect(page.locator('#chopValue')).toHaveText('0/15');
  20 |   const desktopCamera=await page.locator('#worldCanvas').getAttribute('data-camera');await page.setViewportSize({width:390,height:844});
  21 |   await expect(page.locator('#worldCanvas')).not.toHaveAttribute('data-camera',desktopCamera!);
  22 |   const control=await page.locator('#viewCastle').boundingBox(),title=await page.locator('.scene-head h1').boundingBox();
> 23 |   expect(control!.y+control!.height).toBeLessThanOrEqual(title!.y);await page.locator('#viewReset').click();
     |                                      ^ Error: expect(received).toBeLessThanOrEqual(expected)
  24 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-view','farm');
  25 |  }
  26 |  expect(errors).toEqual([]);expect(external).toEqual([]);
  27 | });
  28 | 
  29 | test('a delayed castle keeps the farm start gate closed and a missing castle fails explicitly',async({page})=>{
  30 |  let release=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
  31 |  await page.route('**/assets/user-models/castle.fbx',async route=>{await gate;await route.fulfill({status:404,body:'missing fixture'});});
  32 |  await page.goto('/',{waitUntil:'domcontentloaded'});
  33 |  try{await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','loading');}finally{release();}
  34 |  await expect(page.locator('#renderError')).toContainText('用户城堡模型加载失败');
  35 |  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','failed');
  36 |  await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  37 | });
  38 | 
```