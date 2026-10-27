# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: preparation-diagnostics.spec.ts >> explains hold separation and sampling without changing preparation or counting
- Location: tests/e2e/preparation-diagnostics.spec.ts:20:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#upperBodyHoldGate')
Expected substring: "与举起"
Timeout: 7000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" locator('#upperBodyHoldGate') with timeout 7000ms
  - waiting for locator('#upperBodyHoldGate')

```

```yaml
- banner:
  - text: T ✦ TIDAL FARM 每一次运动，都让世界生长 本地测试加速模式 📷 上半身识别 · 真机待验证
  - switch "无摄像头测试：关"
  - button "摄像头识别"
  - button "停止动画"
  - button "动作教学"
  - button "开启音效"
  - button "重新开始"
- main:
  - text: YOUR LITTLE WORLD
  - heading "一座农场，等待你的第一步" [level=1]
  - text: 今日劳作 · 体验计划
  - img "可旋转三维农场。地面0、车上0、到家0。":
    - text: 用户人物/房屋 · 挥砍 / 装车 / 行走动作
    - link "原动作对照":
      - /url: /?art=npr-sample&model=prototype
  - text: 从一件小事开始，让这座农场苏醒。 0% 🪓 砍伐杉树 双手举起放下 🪵 木材装车 双手举起放下 🛒 运输木材 双臂前举持姿
  - complementary:
    - text: MISSION CONTROL 设备准备
    - heading "农场计划" [level=2]
    - paragraph: 运动与经营结合的概念验证：把日常动作转化为农场资源。
    - text: 🪓 已完成挥砍
    - strong: 0/15
    - text: 🪵 已装车木材
    - strong: 0/15
    - text: ⏱ 有效拉车
    - strong: 0.0/2s
    - text: 🌲 砍倒树木
    - strong: 0/3
    - text: ✧ 将运动变成资产 收集资源 · 升级农场 · 获得正反馈 准备开始今天的劳作。
    - button "等待任务开始" [disabled]
    - paragraph: 按 Space 完成一次动作循环（禁用自动重复）
    - group: 输入诊断
- text: 拖拽旋转 · 滚轮缩放
- button "向左旋转视角": ↶
- button "向右旋转视角": ↷
- button "城堡近景"
- button "全景视角"
- contentinfo:
  - status: 会话 session-1 · 设备准备
- dialog "选择演示输入方式":
  - text: CHOOSE YOUR INPUT
  - heading "选择演示输入方式" [level=2]
  - button "查看动作教学"
  - button "停止动画"
  - paragraph: 电脑前可坐着完成上半身训练。开启摄像头后按提示摆三个姿态，准备完成自动开始；真实识别准确率仍待验证。
  - text: 摄像头训练方案
  - combobox "摄像头训练方案":
    - option "电脑前 · 上半身（默认）" [selected]
    - option "原全身 · 挥砍 / 下蹲 / 持姿"
  - text: ⌨ 键盘演示模式 空格触发运动循环；拉车阶段长按空格 ✓
  - switch "无摄像头测试：关"
  - text: 打开可预览合成骨架，开始后自动完成农场流程。
  - button "开启摄像头识别"
  - button "停止 / 取消"
  - region "上半身自动准备":
    - text: 无需点击采集 已完成 2/3
    - heading "双臂前举" [level=3]
    - paragraph: 双手向前，保持舒适屈臂持姿；与刚才上举、放下姿态区分。
    - progressbar "当前上半身姿态采集进度"
    - status: 双臂前举持姿需与刚才举起、放下的位置区分
    - text: 砍树 / 装车：双手放下 → 举起 → 放下。拉车：双臂前举保持。只识别上半身，不测器械重量。
  - group "识别宽松度":
    - text: 识别宽松度 严格
    - status: 第 3 档 · 标准
    - text: 宽松
    - slider "识别宽松度": "3"
    - button "严格"
    - button "标准" [pressed]
    - button "宽松"
    - text: 按个人标定调整幅度与持姿容差，仍需完成动作并复位。训练中修改会暂停，已完成进度保留。颜色仅对照个人标定与当前步骤，不代表专业动作评分。
  - text: ● 匹配 ● 调整 ● 待判断
  - status: 请调整到双臂前举姿态
  - status: 推理中 · Worker / CPU · 完成标定后可选择姿态代理训练
  - text: 640×480 · 33 个关键点 · 15.1 Hz · 推理 p50/p95 0/0ms · 样本年龄 0ms · 人体关键点可用 已返回推理帧：147 人体关键点不能确认器械重量、真实持握、心率或卡路里。仅单人固定机位的姿态代理；真机验证待完成。
  - button "按提示准备，完成后自动开始" [disabled]
  - button "返回首页"
  - button "关闭摄像头并开始键盘演示 →"
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  3  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  4  | async function thirdStep(page:Page){
  5  |  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
  6  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
  7  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
  8  |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
  9  | }
  10 | test('reports the reset source independently of subsequent low confidence and names the current joint',async({page})=>{
  11 |  await thirdStep(page);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  12 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');
  13 |  await expect(page.locator('#upperBodyLastReset')).toContainText('窗口失焦');
  14 |  await expect(page.locator('#upperBodyLastReset')).toContainText('2/3 → 0/3');
  15 |  await page.evaluate(()=>{window.upperFixture.low=true;});
  16 |  await expect(page.locator('#upperBodyJointQuality')).toContainText('右手腕：不清晰');
  17 |  await expect(page.locator('#upperBodyLastReset')).toContainText('窗口失焦');
  18 |  await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#beginCamera')).toBeDisabled();
  19 | });
  20 | test('explains hold separation and sampling without changing preparation or counting',async({page})=>{
  21 |  await thirdStep(page);
> 22 |  await expect(page.locator('#upperBodyHoldGate')).toContainText('与举起');
     |                                                   ^ Error: expect(locator).toContainText(expected) failed
  23 |  await expect(page.locator('#upperBodyHoldGate')).toContainText('不足');
  24 |  await expect(page.locator('#upperBodySampleStatus')).toContainText('样本');
  25 |  await expect(page.locator('#upperBodyStepCount')).toContainText('2/3');await expect(page.locator('#chopValue')).toHaveText('0/15');
  26 | });
  27 | 
```