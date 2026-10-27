# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: preparation-feedback.spec.ts >> a single invalid active frame retains its reason when returning to preparation without later frames
- Location: tests/e2e/preparation-feedback.spec.ts:20:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#setupModal')
Expected: visible
Received: hidden
Timeout:  7000ms

Call log:
  - Expect "toBeVisible" locator('#setupModal') with timeout 7000ms
  - waiting for locator('#setupModal')
    18 × locator resolved to <div hidden="" id="setupModal" class="modal-backdrop">…</div>
       - unexpected value "hidden"

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
- status: 肩、肘或手腕不够清晰，请让六个关节保持可见；标定已保存 3/3，追踪恢复 0%，当前不计次、不计时。 已保存3/3；当前动作不计次、持姿不计时，请回到镜头内保持稳定，无需重做三个姿态。
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
  - status: 肩、肘或手腕不够清晰，请让六个关节保持可见；标定已保存 3/3，追踪恢复 0%，当前不计次、不计时。
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  3  | import {mkdir} from 'node:fs/promises';
  4  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  5  | const output='artifacts/qa/preparation-feedback-20261026';
  6  | async function setup(page:Page){await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await expect(page.locator('#setupModal')).toBeVisible();await page.evaluate(()=>{window.upperFixture.pose='left-only';});await page.locator('#cameraStart').click();await expect(page.locator('#cameraFrames')).not.toHaveText('0');}
  7  | const palette=(page:Page)=>page.locator('#poseOverlay').evaluate((canvas:HTMLCanvasElement)=>{const data=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data,result={green:0,red:0};for(let i=0;i<data.length;i+=4){if(data[i+3]<200)continue;if(data[i]===119&&data[i+1]===227&&data[i+2]===160)result.green++;if(data[i]===255&&data[i+1]===107&&data[i+2]===105)result.red++;}return result;});
  8  | 
  9  | test('lowered-hand preparation shows matching arm green and unlowered arm red before training',async({page})=>{
  10 |  await setup(page);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','adjust');await expect(page.locator('#upperBodyReason')).toContainText('放下');await expect.poll(async()=>(await palette(page)).red).toBeGreaterThan(8);await expect.poll(async()=>(await palette(page)).green).toBeGreaterThan(8);await expect(page.locator('#chopValue')).toHaveText('0/15');
  11 |  await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/preparation-partial-synthetic.png`});
  12 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','matched');await expect.poll(async()=>(await palette(page)).red).toBe(0);await expect.poll(async()=>(await palette(page)).green).toBeGreaterThan(8);await expect(page.locator('#statusTag')).toHaveText('设备准备');await expect(page.locator('#chopValue')).toHaveText('0/15');
  13 | });
  14 | 
  15 | test('preparation reveals quality failures and a stalled feed clears old colors without another frame',async({page})=>{
  16 |  await setup(page);await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#upperBodyReason')).toContainText('不够清晰');await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','unavailable');await expect.poll(async()=>(await palette(page)).green+(await palette(page)).red).toBe(0);
  17 |  await page.evaluate(()=>{window.upperFixture.low=false;});await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','adjust');await page.evaluate(()=>{window.upperFixture.stalled=true;});await expect(page.locator('#upperBodyReason')).toContainText('没有新数据');await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','unavailable');await expect.poll(async()=>(await palette(page)).green+(await palette(page)).red).toBe(0);await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  18 | });
  19 | 
  20 | test('a single invalid active frame retains its reason when returning to preparation without later frames',async({page})=>{
  21 |  await setup(page);await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await page.evaluate(()=>{window.upperFixture.pose='hold';});await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});
  22 |  await page.evaluate(()=>{const frames=document.getElementById('cameraFrames')!;const observer=new MutationObserver(()=>{window.upperFixture.stalled=true;observer.disconnect();});observer.observe(frames,{childList:true});window.upperFixture.low=true;});
> 23 |  await expect(page.locator('#setupModal')).toBeVisible();await expect(page.locator('#upperBodyReason')).toContainText('不够清晰');await expect(page.locator('#cameraFeedbackStatus')).toContainText('不够清晰');await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','unavailable');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
     |                                            ^ Error: expect(locator).toBeVisible() failed
  24 | });
  25 | 
```