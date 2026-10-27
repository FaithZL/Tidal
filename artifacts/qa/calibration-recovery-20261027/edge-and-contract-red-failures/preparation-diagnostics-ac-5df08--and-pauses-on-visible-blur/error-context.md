# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: preparation-diagnostics.spec.ts >> actual active training still invalidates its profile and pauses on visible blur
- Location: tests/e2e/preparation-diagnostics.spec.ts:49:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#upperBodyPreparation')
Expected: "lowered"
Received: "complete"
Timeout:  7000ms

Call log:
  - Expect "toHaveAttribute" locator('#upperBodyPreparation') with timeout 7000ms
  - waiting for locator('#upperBodyPreparation')
    6 × locator resolved to <section data-ready="false" data-step="complete" aria-label="上半身自动准备" data-recovering="false" data-revalidating="true" id="upperBodyPreparation" class="upper-body-preparation">…</section>
      - unexpected value "complete"
    12 × locator resolved to <section data-ready="true" data-step="complete" aria-label="上半身自动准备" data-recovering="false" id="upperBodyPreparation" data-revalidating="false" class="upper-body-preparation">…</section>
       - unexpected value "complete"

```

```yaml
- banner:
  - text: T ✦ TIDAL FARM 每一次运动，都让世界生长 本地测试加速模式 📷 上半身识别 · 真机待验证
  - switch "无摄像头测试：关"
  - button "识别设置"
  - button "停止动画"
  - button "动作教学"
  - button "开启音效"
  - button "切换键盘"
  - button "重新标定"
  - button "继续"
  - button "重新开始"
- status: 追踪已恢复，动作模板已保存；当前仍暂停，请手动开始或继续。
- main:
  - text: YOUR LITTLE WORLD
  - heading "砍伐杉树" [level=1]
  - text: 今日劳作 · 体验计划
  - img "可旋转三维农场。地面0、车上0、到家0。":
    - text: 用户人物/房屋 · 挥砍 / 装车 / 行走动作
    - link "原动作对照":
      - /url: /?art=npr-sample&model=prototype
  - text: 已暂停 点击继续后恢复 计时与运动进度均已暂停。 0% 🪓 砍伐杉树 双手举起放下 🪵 木材装车 双手举起放下 🛒 运输木材 双臂前举持姿
  - complementary:
    - text: MISSION CONTROL 已暂停
    - heading "砍伐杉树" [level=2]
    - paragraph: 电脑前可坐着做：双手举起再放下完成一次；拉车双臂前举保持。只识别肩肘腕。
    - text: 🪓 已完成挥砍
    - strong: 0/15
    - text: 🪵 已装车木材
    - strong: 0/15
    - text: ⏱ 有效拉车
    - strong: 0.0/2s
    - text: 🌲 砍倒树木
    - strong: 0/3
    - text: ✧ 将运动变成资产 收集资源 · 升级农场 · 获得正反馈 当前已暂停，按继续按钮恢复。
    - button "由摄像头姿态控制" [disabled]
    - paragraph: Space不产生运动成果；可明确切换键盘
    - group: 输入诊断
- text: 拖拽旋转 · 滚轮缩放
- button "向左旋转视角": ↶
- button "向右旋转视角": ↷
- button "城堡近景"
- button "全景视角"
- complementary "标准动作示范":
  - text: 标准动作示范
  - img "砍树 · 上半身举手标准动作骨骼示范"
  - text: 砍树 · 上半身举手 双手放下 示范已暂停
- complementary "运动状态画中画":
  - text: 本机摄像头 · 标准 MOVE WITH TIDAL ● 匹配 ● 调整 ● 待判断
  - strong: 已暂停 · 运动不计时
  - text: 放下 → 双手举起 → 完整放下 · 15 次
- contentinfo:
  - status: 会话 session-1 · 已暂停
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {installPoseFixture} from '../helpers/browserPoseFixture.js';
  3  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  4  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  5  | async function thirdStep(page:Page){
  6  |  await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
  7  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();
  8  |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
  9  |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
  10 | }
  11 | test('reports the reset source independently of subsequent low confidence and names the current joint',async({page})=>{
  12 |  await thirdStep(page);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  13 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');
  14 |  await expect(page.locator('#upperBodyLastReset')).toContainText('页面进入后台');
  15 |  await expect(page.locator('#upperBodyLastReset')).toContainText('2/3 → 0/3');
  16 |  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));window.upperFixture.low=true;});
  17 |  await expect(page.locator('#upperBodyJointQuality')).toContainText('右手腕：不清晰');
  18 |  await expect(page.locator('#upperBodyLastReset')).toContainText('页面进入后台');
  19 |  await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#beginCamera')).toBeDisabled();
  20 | });
  21 | test('explains hold separation and sampling without changing preparation or counting',async({page})=>{
  22 |  await thirdStep(page);
  23 |  await expect(page.locator('#upperBodyHoldGate')).toContainText('与举起');
  24 |  await expect(page.locator('#upperBodyHoldGate')).toContainText('不足');
  25 |  await expect(page.locator('#upperBodySampleStatus')).toContainText('样本');
  26 |  await expect(page.locator('#upperBodyStepCount')).toContainText('2/3');await expect(page.locator('#chopValue')).toHaveText('0/15');
  27 | });
  28 | 
  29 | for(const fromDemo of [false,true])test(`visible blur keeps incomplete preparation checkpoints but cancels automatic start (${fromDemo?'demo entry':'initial setup'})`,async({page})=>{
  30 |  if(fromDemo){
  31 |   await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:12000});await page.locator('#cameraMode').click();await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
  32 |  }else await thirdStep(page);
  33 |  const countsBefore=await page.locator('#chopValue').textContent();
  34 |  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  35 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await expect(page.locator('#upperBodyStepCount')).toContainText('2/3');
  36 |  await expect(page.locator('#upperBodySuspendNotice')).toContainText('保留准备进度');
  37 |  await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
  38 |  await page.waitForTimeout(3600);await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');await expect(page.locator('#chopValue')).toHaveText(countsBefore!);
  39 | });
  40 | 
  41 | test('a completed profile still resets on blur and cannot silently start or count',async({page})=>{
  42 |  await thirdStep(page);await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  43 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');await expect(page.locator('#upperBodyLastReset')).toContainText('窗口失焦');await expect(page.locator('#upperBodyLastReset')).toContainText('3/3 → 0/3');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  44 | });
  45 | 
  46 | test('a later timeout replaces the visible-blur preservation notice with the real reset state',async({page})=>{
  47 |  await thirdStep(page);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#upperBodySuspendNotice')).toContainText('保留准备进度');await page.evaluate(()=>{window.upperFixture.low=true;});await page.waitForTimeout(3300);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');await expect(page.locator('#upperBodySuspendNotice')).not.toContainText('保留准备进度');await expect(page.locator('#upperBodySuspendNotice')).toContainText('自动开始已取消');await expect(page.locator('#upperBodyLastReset')).toContainText('有效数据中断超过3秒');
  48 | });
  49 | test('actual active training still invalidates its profile and pauses on visible blur',async({page})=>{
> 50 |  await thirdStep(page);await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});const before=await page.locator('#chopValue').textContent();await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');await expect(page.locator('#statusTag')).not.toHaveText('训练中');await expect(page.locator('#upperBodyLastReset')).toContainText('3/3 → 0/3');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText(before!);
     |                                                                                                                                                                                                                                                                                                                                                ^ Error: expect(locator).toHaveAttribute(expected) failed
  51 | });
  52 | test('full-body preparation keeps its original reset policy on visible blur',async({page})=>{
  53 |  await installPoseFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await page.locator('#cameraExerciseMode').selectOption('full-body');await page.locator('#cameraStart').click();await expect(page.locator('#calibrationCapture')).toBeEnabled();await page.locator('#calibrationCapture').click();await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step','chop-raised');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step','standing');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  54 | });
  55 | 
```