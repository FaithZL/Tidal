# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: countdown-continuity.spec.ts >> camera countdown keeps the same remaining numeral visible through early and repeated tracking interruptions
- Location: tests/e2e/countdown-continuity.spec.ts:5:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "5"
Received: "等待追踪"

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
      - generic [ref=e3]: 📷 上半身识别 · 真机待验证
      - switch "无摄像头测试：关" [ref=e4] [cursor=pointer]
      - button "识别设置" [ref=e5] [cursor=pointer]
      - button "停止动画" [ref=e6] [cursor=pointer]
      - button "动作教学" [ref=e7] [cursor=pointer]
      - button "开启音效" [ref=e8] [cursor=pointer]
      - button "切换键盘" [ref=e9] [cursor=pointer]
      - button "重新标定" [ref=e10] [cursor=pointer]
      - button "暂停" [ref=e11] [cursor=pointer]
      - button "重新开始" [ref=e12] [cursor=pointer]
  - status: 肩、肘或手腕不够清晰，请让六个关节保持可见；本局标定已保存，当前不计次、不计时。有效画面恢复后即可继续，无需重复准备。
  - main [ref=e13]:
    - generic [ref=e14]:
      - generic:
        - generic:
          - generic: YOUR LITTLE WORLD
          - heading "砍伐杉树" [level=1]
        - generic: 今日劳作 · 体验计划
      - generic [ref=e15]:
        - img "可旋转三维农场。地面0、车上0、到家0。" [ref=e16]:
          - generic "可旋转的三维农场，拖拽旋转、滚轮缩放" [ref=e17]
          - generic:
            - text: 用户人物/房屋 · 挥砍 / 装车 / 行走动作
            - link "原动作对照" [ref=e18] [cursor=pointer]:
              - /url: /?art=npr-sample&model=prototype
        - generic:
          - text: 等待追踪
          - generic: 重新入镜后自动继续
        - generic:
          - generic: 计时与运动进度均已暂停。
          - generic: 0%
      - generic "训练任务阶段":
        - generic:
          - generic: 🪓
          - generic:
            - text: 砍伐杉树
            - generic: 双手举起放下
        - generic:
          - generic: 🪵
          - generic:
            - text: 木材装车
            - generic: 双手举起放下
        - generic:
          - generic: 🛒
          - generic:
            - text: 运输木材
            - generic: 双臂前举持姿
    - complementary [ref=e19]:
      - generic [ref=e20]:
        - generic [ref=e21]: MISSION CONTROL
        - generic [ref=e22]: 已暂停
      - heading "砍伐杉树" [level=2] [ref=e23]
      - paragraph [ref=e24]: 电脑前可坐着做：双手举起再放下完成一次；拉车双臂前举保持。只识别肩肘腕。
      - generic [ref=e25]:
        - generic [ref=e26]:
          - generic [ref=e27]: 🪓 已完成挥砍
          - strong [ref=e28]: 0/15
        - generic [ref=e29]:
          - generic [ref=e30]: 🪵 已装车木材
          - strong [ref=e31]: 0/15
        - generic [ref=e32]:
          - generic [ref=e33]: ⏱ 有效拉车
          - strong [ref=e34]: 0.0/60s
        - generic [ref=e35]:
          - generic [ref=e36]: 🌲 砍倒树木
          - strong [ref=e37]: 0/3
      - generic [ref=e38]:
        - generic [ref=e39]: ✧
        - generic [ref=e40]:
          - text: 将运动变成资产
          - generic [ref=e41]: 收集资源 · 升级农场 · 获得正反馈
      - generic [ref=e42]:
        - generic [ref=e43]: 即将开始：砍伐杉树
        - button "由摄像头姿态控制" [disabled] [ref=e44]
        - paragraph [ref=e45]: Space不产生运动成果；可明确切换键盘
      - group [ref=e46]:
        - generic "输入诊断" [ref=e47] [cursor=pointer]
  - generic "三维视角控制" [ref=e48]:
    - generic [ref=e49]: 拖拽旋转 · 滚轮缩放
    - button "向左旋转视角" [ref=e50] [cursor=pointer]: ↶
    - button "向右旋转视角" [ref=e51] [cursor=pointer]: ↷
    - button "城堡近景" [ref=e52] [cursor=pointer]
    - button "全景视角" [ref=e53] [cursor=pointer]
  - complementary "标准动作示范":
    - img "砍树 · 上半身举手标准动作骨骼示范"
    - generic:
      - generic: 砍树 · 上半身举手
      - generic: 双手放下
    - generic: 示范已暂停
  - complementary "运动状态画中画" [ref=e54]:
    - generic [ref=e55]:
      - generic [ref=e57]: 本机摄像头 · 标准
      - generic [ref=e58]: MOVE WITH TIDAL
    - generic [ref=e60]:
      - generic "本机实时摄像头预览" [ref=e61]
      - generic "人体动作匹配骨架：绿色匹配，红色需调整，灰色待判断" [ref=e62]
      - generic "绿色匹配、红色需调整、灰色待判断":
        - generic: ● 匹配
        - generic: ● 调整
        - generic: ● 待判断
    - generic [ref=e63]:
      - strong [ref=e64]: 已暂停 · 运动不计时
      - generic [ref=e65]: 放下 → 双手举起 → 完整放下 · 15 次
  - contentinfo:
    - status: 肩、肘或手腕不够清晰，请让六个关节保持可见；本局标定已保存，当前不计次、不计时。有效画面恢复后即可继续，无需重复准备。
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  3  | 
  4  | test.use({baseURL:'http://127.0.0.1:4173',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  5  | test('camera countdown keeps the same remaining numeral visible through early and repeated tracking interruptions',async({page})=>{
  6  |  await installUpperBodyFixture(page);await page.goto('/?art=npr-sample');
  7  |  await expect(page.locator('#acceptPlan')).toBeEnabled();await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
  8  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
  9  |  await page.evaluate(()=>{window.upperFixture.pose='raised';});
  10 |  await expect(page.locator('#app')).toHaveAttribute('data-phase','countdown');
  11 |  for(const seconds of [5,4,3]){
  12 |   await expect(page.locator('#countdown')).toHaveText(`${seconds}做好准备，即将开始`);
  13 |   await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#countdown')).toContainText('等待追踪');
  14 |   // Losing tracking must never replace the remaining numeral with a new start/wait card.
> 15 |   await expect.poll(()=>page.locator('#countdown').evaluate(node=>node.firstChild?.textContent)).toBe(String(seconds));
     |                                                                                                  ^ Error: expect(received).toBe(expected) // Object.is equality
  16 |   await expect(page.locator('#countdown')).not.toHaveClass(/compact/);
  17 |   await page.waitForTimeout(350);await expect(page.locator('#countdown')).toContainText(String(seconds));
  18 |   await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#upperBodyStepCount')).toContainText('2/2');
  19 |   await expect(page.locator('#setupModal')).toBeHidden();
  20 |   await page.evaluate(()=>{window.upperFixture.low=false;});
  21 |   await expect(page.locator('#countdown')).toHaveText(`${seconds}做好准备，即将开始`);
  22 |  }
  23 |  await expect(page.locator('#statusTag')).toHaveText('训练中');
  24 |  await expect(page.locator('#countdown')).toBeHidden();
  25 |  await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#countdown')).toContainText('等待追踪');
  26 |  await page.evaluate(()=>{window.upperFixture.low=false;});await expect(page.locator('#statusTag')).toHaveText('训练中');
  27 |  await expect(page.locator('#app')).toHaveAttribute('data-phase','active');await expect(page.locator('#countdown')).toBeHidden();
  28 |  await expect(page.locator('#chopValue')).toHaveText('0/15');
  29 | });
  30 | 
```