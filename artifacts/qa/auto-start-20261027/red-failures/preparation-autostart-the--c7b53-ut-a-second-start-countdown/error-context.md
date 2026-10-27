# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: preparation-autostart.spec.ts >> the frame that saves the third pose enters training immediately without a second start countdown
- Location: tests/e2e/preparation-autostart.spec.ts:20:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#upperBodyPreparation')
Expected: "true"
Received: "false"
Timeout:  7000ms

Call log:
  - Expect "toHaveAttribute" locator('#upperBodyPreparation') with timeout 7000ms
  - waiting for locator('#upperBodyPreparation')
    9 × locator resolved to <section data-ready="true" data-step="complete" aria-label="上半身自动准备" data-training="false" data-recovering="false" id="upperBodyPreparation" data-revalidating="false" class="upper-body-preparation" data-started-at-completion="false">…</section>
      - unexpected value "false"
    9 × locator resolved to <section data-ready="true" data-step="complete" aria-label="上半身自动准备" data-training="true" data-recovering="false" id="upperBodyPreparation" data-revalidating="false" class="upper-body-preparation" data-started-at-completion="false">…</section>
      - unexpected value "false"

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
  - button "暂停"
  - button "重新开始"
- main:
  - text: YOUR LITTLE WORLD
  - heading "砍伐杉树" [level=1]
  - text: 今日劳作 · 体验计划
  - img "可旋转三维农场。地面0、车上0、到家0。":
    - text: 用户人物/房屋 · 挥砍 / 装车 / 行走动作
    - link "原动作对照":
      - /url: /?art=npr-sample&model=prototype
  - text: 保持全身可见；停止持姿或跟踪失效时不推进。 0% 🪓 砍伐杉树 双手举起放下 🪵 木材装车 双手举起放下 🛒 运输木材 双臂前举持姿
  - complementary:
    - text: MISSION CONTROL 训练中
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
    - text: ✧ 将运动变成资产 收集资源 · 升级农场 · 获得正反馈 准备开始今天的劳作。
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
  - text: 砍树 · 上半身举手 放下完成复位 上半身示意 · 坐着可做
- complementary "运动状态画中画":
  - text: 本机摄像头 · 标准 MOVE WITH TIDAL ● 匹配 ● 调整 ● 待判断
  - strong: 双臂动作过渡中
  - text: 放下 → 双手举起 → 完整放下 · 15 次
- contentinfo:
  - status: 会话 session-1 · 训练中
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  3  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  4  | async function start(page:Page,blurDuringOpen=false){
  5  |  await installUpperBodyFixture(page);await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#acceptPlan')).toBeEnabled();
  6  |  await page.locator('#cameraMode').click();
  7  |  if(blurDuringOpen)await page.evaluate(()=>{const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async constraints=>{window.dispatchEvent(new Event('blur'));return get(constraints);};});
  8  |  await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
  9  | }
  10 | async function finishPoses(page:Page){
  11 |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');
  12 |  await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
  13 | }
  14 | async function liveTraining(page:Page){
  15 |  await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});await expect(page.locator('#setupModal')).toBeHidden();
  16 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-training','true');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
  17 |  await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(1);expect(await page.evaluate(()=>window.upperFixture.tracks.length)).toBe(1);expect(await page.evaluate(()=>window.upperFixture.tracks[0].readyState)).toBe('live');
  18 |  await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#modeBadge')).toContainText('上半身');
  19 | }
  20 | test('the frame that saves the third pose enters training immediately without a second start countdown',async({page})=>{
  21 |  await start(page);await page.evaluate(()=>{
  22 |   const node=document.getElementById('upperBodyPreparation')!;
  23 |   const observer=new MutationObserver(()=>{if(node.dataset.step==='complete'){observer.disconnect();requestAnimationFrame(()=>{node.dataset.startedAtCompletion=String(node.dataset.training==='true'&&document.getElementById('app')!.dataset.phase!=='setup');});}});
  24 |   observer.observe(node,{attributes:true,attributeFilter:['data-step']});
  25 |  });
> 26 |  await finishPoses(page);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-started-at-completion','true');await liveTraining(page);
     |                                                                              ^ Error: expect(locator).toHaveAttribute(expected) failed
  27 | });
  28 | test('visible blur during preparation cannot revoke the automatic start after all poses are saved',async({page})=>{
  29 |  await start(page);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#upperBodyStepCount')).toContainText('1/3');
  30 |  await finishPoses(page);await liveTraining(page);await expect(page.locator('#upperBodySuspendNotice')).not.toContainText('手动');
  31 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
  32 |  await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');await page.waitForTimeout(400);
  33 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#chopValue')).toHaveText('1/15');
  34 | });
  35 | test('returning from a hidden preparation page preserves start intent but requires fresh complete poses',async({page})=>{
  36 |  await start(page);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  37 |  await page.waitForTimeout(400);await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');await expect(page.locator('#chopValue')).toHaveText('0/15');
  38 |  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));window.upperFixture.pose='lowered';});
  39 |  await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await finishPoses(page);await liveTraining(page);
  40 | });
  41 | test('a camera permission blur during initialization does not require another Start click',async({page})=>{
  42 |  await start(page,true);await finishPoses(page);await liveTraining(page);
  43 | });
  44 | 
```