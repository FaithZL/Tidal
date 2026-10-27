# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: preparation-finish.spec.ts >> the finish shortcut cannot bypass lost tracking or an explicit animation stop
- Location: tests/e2e/preparation-finish.spec.ts:22:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#finishUpperPreparation')
Expected: visible
Timeout: 7000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('#finishUpperPreparation') with timeout 7000ms
  - waiting for locator('#finishUpperPreparation')

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
- status: 肩部位置或距离与准备时不匹配，请回到原位置；三步标定已保留；标定已保存 3/3，追踪恢复 0%，当前不计次、不计时。 已保存3/3；当前动作不计次、持姿不计时，请回到镜头内保持稳定，无需重做三个姿态。
- main:
  - text: YOUR LITTLE WORLD
  - heading "一座农场，等待你的第一步" [level=1]
  - text: 今日劳作 · 体验计划
  - img "可旋转三维农场。地面0、车上0、到家0。":
    - text: 用户人物/房屋 · 挥砍 / 装车 / 行走动作
    - link "原动作对照":
      - /url: /?art=npr-sample&model=prototype
  - text: 已暂停 点击继续后恢复 计时与运动进度均已暂停。 0% 🪓 砍伐杉树 双手举起放下 🪵 木材装车 双手举起放下 🛒 运输木材 双臂前举持姿
  - complementary:
    - text: MISSION CONTROL 已暂停
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
    - text: ✧ 将运动变成资产 收集资源 · 升级农场 · 获得正反馈 当前已暂停，按继续按钮恢复。
    - button "等待任务开始" [disabled]
    - paragraph: 按 Space 完成一次动作循环（禁用自动重复）
    - group: 输入诊断
- text: 拖拽旋转 · 滚轮缩放
- button "向左旋转视角": ↶
- button "向右旋转视角": ↷
- button "城堡近景"
- button "全景视角"
- contentinfo:
  - status: 肩部位置或距离与准备时不匹配，请回到原位置；三步标定已保留；标定已保存 3/3，追踪恢复 0%，当前不计次、不计时。
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
    - text: 无需点击采集 已完成 3/3
    - heading "标定已保存" [level=3]
    - paragraph: 请回到原位置和原距离，让肩、肘和双手入镜，稳定约1.2秒即可继续。需要更换位置时，可停止摄像头后重新开启准备。
    - progressbar "当前上半身姿态采集进度"
    - status: 肩部位置或距离与准备时不匹配，请回到原位置；三步标定已保留；标定已保存 3/3，追踪恢复 0%，当前不计次、不计时。
    - status: 窗口失焦，保留准备进度；自动开始已取消，完成后请手动开始或继续。
    - text: 左肩：可用 99% · 右肩：可用 99% · 左肘：可用 99% · 右肘：出框 99% · 左手腕：可用 99% · 右手腕：可用 99%
    - group: 查看采集状态
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
  - status: 肩部位置或距离与准备时不匹配，请回到原位置；三步标定已保留；标定已保存 3/3，追踪恢复 0%，当前不计次、不计时。
  - status: 推理中 · Worker / CPU · 完成标定后可选择姿态代理训练
  - text: 640×480 · 33 个关键点 · 15.1 Hz · 推理 p50/p95 0/0ms · 样本年龄 0ms · 人体关键点可用 已返回推理帧：175 人体关键点不能确认器械重量、真实持握、心率或卡路里。仅单人固定机位的姿态代理；真机验证待完成。
  - button "按提示准备，完成后自动开始" [disabled]
  - button "返回首页"
  - button "关闭摄像头并开始键盘演示 →"
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  3  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  4  | async function savedAfterBlur(page:Page){
  5  |  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
  6  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
  7  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await expect(page.locator('#finishUpperPreparation')).toBeHidden();
  8  |  await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));window.upperFixture.pose='raised';});
  9  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
  10 |  await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
  11 | }
  12 | test('completion offers a direct exit from preparation and keeps the same live camera for a real recognized rep',async({page})=>{
  13 |  await savedAfterBlur(page);await expect(page.locator('#finishUpperPreparation')).toBeVisible();await expect(page.locator('#finishUpperPreparation')).toBeEnabled();
  14 |  await expect(page.locator('#upperBodyCue')).toContainText('已保存');await expect(page.locator('#upperBodyCue')).toContainText('摄像头');
  15 |  await page.locator('#finishUpperPreparation').click();await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#statusTag')).toHaveText('训练中');
  16 |  expect(await page.evaluate(()=>window.upperFixture.tracks.length)).toBe(1);expect(await page.evaluate(()=>window.upperFixture.tracks[0].readyState)).toBe('live');
  17 |  await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#modeBadge')).toContainText('上半身');
  18 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
  19 |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');await page.waitForTimeout(400);
  20 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#chopValue')).toHaveText('1/15');
  21 | });
  22 | test('the finish shortcut cannot bypass lost tracking or an explicit animation stop',async({page})=>{
  23 |  await savedAfterBlur(page);await page.evaluate(()=>{window.upperFixture.moved=true;});
> 24 |  await expect(page.locator('#finishUpperPreparation')).toBeVisible();await expect(page.locator('#finishUpperPreparation')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
     |                                                        ^ Error: expect(locator).toBeVisible() failed
  25 |  await page.locator('#setupAnimationStop').click();await page.evaluate(()=>{window.upperFixture.moved=false;});await expect(page.locator('#finishUpperPreparation')).toBeEnabled({timeout:6000});
  26 |  await page.locator('#finishUpperPreparation').click();await expect(page.locator('#setupModal')).toBeHidden();await page.waitForTimeout(700);
  27 |  await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#chopValue')).toHaveText('0/15');
  28 | });
  29 | 
```