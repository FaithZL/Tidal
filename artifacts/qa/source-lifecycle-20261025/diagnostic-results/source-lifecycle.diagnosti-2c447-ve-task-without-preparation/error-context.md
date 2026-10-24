# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: source-lifecycle.diagnostic.spec.ts >> a stalled camera during rest cannot start the next active task without preparation
- Location: tests/e2e/source-lifecycle.diagnostic.spec.ts:68:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#inputDebug')
Timeout: 7000ms
- Expected substring  - 1
+ Received string     + 4

-  · ready ·
+ camera · run-1 · epoch 3 · stopped · 等待/有效输入
+ 游戏帧间隔 p95 16.8ms（最近120帧，非端到端延迟）
+ 640×480 · 33 个关键点 · 15.0 Hz · 推理 p50/p95 0/0ms · 样本年龄 0ms · 人体关键点可用
+ 右侧 · 置信度 0.99 · 膝 180.0° · 肘 61.0° · 腕相对髋 (0.12, -1.52) · 躯干 130px

Call log:
  - Expect "toContainText" locator('#inputDebug') with timeout 7000ms
  - waiting for locator('#inputDebug')
    3 × locator resolved to <small id="inputDebug">camera · run-1 · epoch 3 · unready · 等待/有效输入↵游戏帧间…</small>
      - unexpected value "camera · run-1 · epoch 3 · unready · 等待/有效输入
游戏帧间隔 p95 33.3ms（最近120帧，非端到端延迟）
640×480 · 33 个关键点 · 15.1 Hz · 推理 p50/p95 0/0ms · 样本年龄 1ms · 人体关键点可用
右侧 · 置信度 0.99 · 膝 180.0° · 肘 59.3° · 腕相对髋 (0.12, -1.50) · 躯干 130px"
    2 × locator resolved to <small id="inputDebug">camera · run-1 · epoch 3 · stopped · 等待/有效输入↵游戏帧间…</small>
      - unexpected value "camera · run-1 · epoch 3 · stopped · 等待/有效输入
游戏帧间隔 p95 33.4ms（最近120帧，非端到端延迟）
640×480 · 33 个关键点 · 15.0 Hz · 推理 p50/p95 0/0ms · 样本年龄 1ms · 人体关键点可用
特征不可用；不会补点或用默认角度继续。"
    - locator resolved to <small id="inputDebug">camera · run-1 · epoch 3 · stopped · 等待/有效输入↵游戏帧间…</small>
    - unexpected value "camera · run-1 · epoch 3 · stopped · 等待/有效输入
游戏帧间隔 p95 33.4ms（最近120帧，非端到端延迟）
640×480 · 33 个关键点 · 15.0 Hz · 推理 p50/p95 0/0ms · 样本年龄 0ms · 人体关键点可用
右侧 · 置信度 0.99 · 膝 180.0° · 肘 61.0° · 腕相对髋 (0.12, -1.52) · 躯干 130px"
    - locator resolved to <small id="inputDebug">camera · run-1 · epoch 3 · stopped · 等待/有效输入↵游戏帧间…</small>
    - unexpected value "camera · run-1 · epoch 3 · stopped · 等待/有效输入
游戏帧间隔 p95 33.4ms（最近120帧，非端到端延迟）
640×480 · 33 个关键点 · 15.0 Hz · 推理 p50/p95 0/0ms · 样本年龄 1ms · 人体关键点可用
右侧 · 置信度 0.99 · 膝 180.0° · 肘 61.0° · 腕相对髋 (0.12, -1.52) · 躯干 130px"
    - locator resolved to <small id="inputDebug">camera · run-1 · epoch 3 · stopped · 等待/有效输入↵游戏帧间…</small>
    - unexpected value "camera · run-1 · epoch 3 · stopped · 等待/有效输入
游戏帧间隔 p95 33.4ms（最近120帧，非端到端延迟）
640×480 · 33 个关键点 · 15.0 Hz · 推理 p50/p95 0/0ms · 样本年龄 0ms · 人体关键点可用
右侧 · 置信度 0.99 · 膝 180.0° · 肘 61.0° · 腕相对髋 (0.12, -1.52) · 躯干 130px"
    2 × locator resolved to <small id="inputDebug">camera · run-1 · epoch 3 · stopped · 等待/有效输入↵游戏帧间…</small>
      - unexpected value "camera · run-1 · epoch 3 · stopped · 等待/有效输入
游戏帧间隔 p95 16.8ms（最近120帧，非端到端延迟）
640×480 · 33 个关键点 · 15.0 Hz · 推理 p50/p95 0/0ms · 样本年龄 0ms · 人体关键点可用
右侧 · 置信度 0.99 · 膝 180.0° · 肘 61.0° · 腕相对髋 (0.12, -1.52) · 躯干 130px"
    2 × locator resolved to <small id="inputDebug">camera · run-1 · epoch 3 · stopped · 等待/有效输入↵游戏帧间…</small>
      - unexpected value "camera · run-1 · epoch 3 · stopped · 等待/有效输入
游戏帧间隔 p95 16.8ms（最近120帧，非端到端延迟）
640×480 · 33 个关键点 · 15.0 Hz · 推理 p50/p95 0/0ms · 样本年龄 1ms · 人体关键点可用
右侧 · 置信度 0.99 · 膝 180.0° · 肘 61.0° · 腕相对髋 (0.12, -1.52) · 躯干 130px"
    - locator resolved to <small id="inputDebug">camera · run-1 · epoch 3 · stopped · 等待/有效输入↵游戏帧间…</small>
    - unexpected value "camera · run-1 · epoch 3 · stopped · 等待/有效输入
游戏帧间隔 p95 16.8ms（最近120帧，非端到端延迟）
640×480 · 33 个关键点 · 15.0 Hz · 推理 p50/p95 0/0ms · 样本年龄 0ms · 人体关键点可用
右侧 · 置信度 0.99 · 膝 180.0° · 肘 61.0° · 腕相对髋 (0.12, -1.52) · 躯干 130px"
    - locator resolved to <small id="inputDebug">camera · run-1 · epoch 3 · stopped · 等待/有效输入↵游戏帧间…</small>
    - unexpected value "camera · run-1 · epoch 3 · stopped · 等待/有效输入
游戏帧间隔 p95 16.7ms（最近120帧，非端到端延迟）
640×480 · 33 个关键点 · 15.0 Hz · 推理 p50/p95 0/0ms · 样本年龄 1ms · 人体关键点可用
右侧 · 置信度 0.99 · 膝 180.0° · 肘 61.0° · 腕相对髋 (0.12, -1.52) · 躯干 130px"
    - locator resolved to <small id="inputDebug">camera · run-1 · epoch 3 · stopped · 等待/有效输入↵游戏帧间…</small>
    - unexpected value "camera · run-1 · epoch 3 · stopped · 等待/有效输入
游戏帧间隔 p95 16.8ms（最近120帧，非端到端延迟）
640×480 · 33 个关键点 · 15.0 Hz · 推理 p50/p95 0/0ms · 样本年龄 0ms · 人体关键点可用
右侧 · 置信度 0.99 · 膝 180.0° · 肘 61.0° · 腕相对髋 (0.12, -1.52) · 躯干 130px"
    - locator resolved to <small id="inputDebug">camera · run-1 · epoch 3 · stopped · 等待/有效输入↵游戏帧间…</small>
    - unexpected value "camera · run-1 · epoch 3 · stopped · 等待/有效输入
游戏帧间隔 p95 16.8ms（最近120帧，非端到端延迟）
640×480 · 33 个关键点 · 15.0 Hz · 推理 p50/p95 0/0ms · 样本年龄 1ms · 人体关键点可用
右侧 · 置信度 0.99 · 膝 180.0° · 肘 61.0° · 腕相对髋 (0.12, -1.52) · 躯干 130px"
    - locator resolved to <small id="inputDebug">camera · run-1 · epoch 3 · stopped · 等待/有效输入↵游戏帧间…</small>
    - unexpected value "camera · run-1 · epoch 3 · stopped · 等待/有效输入
游戏帧间隔 p95 16.8ms（最近120帧，非端到端延迟）
640×480 · 33 个关键点 · 15.0 Hz · 推理 p50/p95 0/0ms · 样本年龄 0ms · 人体关键点可用
右侧 · 置信度 0.99 · 膝 180.0° · 肘 61.0° · 腕相对髋 (0.12, -1.52) · 躯干 130px"

```

```yaml
- banner:
  - text: T ✦ TIDAL FARM 每一次运动，都让世界生长 本地测试加速模式 📷 摄像头姿态代理 · 真机待验证
  - switch "无摄像头测试：关"
  - button "开启音效"
  - button "切换键盘"
  - button "重新标定"
  - button "继续"
  - button "重新开始"
- main:
  - text: YOUR LITTLE WORLD
  - heading "砍伐杉树" [level=1]
  - text: 今日劳作 · 体验计划
  - img "可旋转三维农场。地面5、车上0、到家0。"
  - text: 已暂停 点击继续后恢复 计时与运动进度均已暂停。 33% 🪓 砍伐杉树 壶铃挥砍 🪵 木材装车 深蹲推举 🛒 运输木材 持续持姿
  - complementary:
    - text: MISSION CONTROL 已暂停
    - heading "砍伐杉树" [level=2]
    - paragraph: 按照标定动作完成完整循环；拉车只检测姿态持续性，不能证明实际持握。
    - text: 🪓 已完成挥砍
    - strong: 5/15
    - text: 🪵 已装车木材
    - strong: 0/15
    - text: ⏱ 有效拉车
    - strong: 0.0/2s
    - text: 🌲 砍倒树木
    - strong: 1/3
    - text: ✧ 将运动变成资产 收集资源 · 升级农场 · 获得正反馈 当前已暂停，按继续按钮恢复。
    - button "由摄像头姿态控制" [disabled]
    - paragraph: Space不产生运动成果；可明确切换键盘
    - group: 输入诊断
- text: 拖拽旋转 · 滚轮缩放
- button "向左旋转视角": ↶
- button "向右旋转视角": ↷
- button "全景视角"
- contentinfo:
  - status: 跟踪或标定已失效，请重新准备
- dialog "选择演示输入方式":
  - text: CHOOSE YOUR INPUT
  - heading "选择演示输入方式" [level=2]
  - paragraph: 键盘与模拟可完整演示。摄像头需完成标定后手动启动姿态代理；真机准确率尚待验证。
  - text: ⌨ 键盘演示模式 空格触发运动循环；拉车阶段长按空格 ✓
  - switch "无摄像头测试：关"
  - text: 打开可预览合成骨架，开始后自动完成农场流程。
  - button "开启摄像头诊断"
  - button "停止 / 取消"
  - status: 推理中 · Worker / CPU · 完成标定后可选择姿态代理训练
  - text: 640×480 · 33 个关键点 · 15.0 Hz · 推理 p50/p95 0/0ms · 样本年龄 0ms · 人体关键点可用 已返回推理帧：461
  - group:
    - text: 姿态标定 · T06
    - paragraph: 单人、固定机位，全身与举手范围可见。按舒适幅度示范；预览镜像，主手按本人左右选择。
    - text: 挥砍主手
    - combobox "挥砍主手":
      - option "右手（本人右侧）" [selected]
      - option "左手（本人左侧）"
    - status: 第 1/9 步 · 自然站立
    - paragraph: 全身入镜、相机固定，自然站立保持稳定。
    - progressbar "当前标定步骤采样进度"
    - button "采集自然站立 · 2秒"
    - button "重做标定"
    - paragraph
    - paragraph: 砍树：未标定 · 装车：未标定 · Carry：未标定
    - text: 右侧 · 置信度 0.99 · 膝 180.0° · 肘 61.0° · 腕相对髋 (0.12, -1.52) · 躯干 130px 实验参数，待真机调校；只保存本次内存。人体姿态不能证明器械重量或真实持握。完成标定后仍需手动启动。
  - text: 人体关键点不能确认器械重量、真实持握、心率或卡路里。仅单人固定机位的姿态代理；真机验证待完成。
  - button "使用标定恢复摄像头训练" [disabled]
  - button "返回首页"
  - button "关闭摄像头并切换键盘"
```

# Test source

```ts
  1  | import {expect,type Page} from '@playwright/test';
  2  | import {syntheticFrame,type SyntheticPose} from './syntheticPose.js';
  3  | import type {WorkerRequest,WorkerResponse} from '../../src/pose/types.js';
  4  | import {recognitionConfig} from '../../src/config/recognitionConfig.js';
  5  | declare global {interface Window {poseFixture:{pose:SyntheticPose;low:boolean;stalled:boolean;workers:number;maxWorkers:number;tracks:MediaStreamTrack[]}}}
  6  | /** Test-only fake video + synthetic points. Not actual MediaPipe inference or a physical camera. */
  7  | export async function installPoseFixture(page:Page){
  8  |   const poses=Object.fromEntries((['standing','raised','down','squat','press','hold'] as const).map(p=>[p,syntheticFrame(0,p).landmarks]));
  9  |   await page.addInitScript(poses=>{
  10 |     window.poseFixture={pose:'standing',low:false,stalled:false,workers:0,maxWorkers:0,tracks:[]};
  11 |     const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  12 |     navigator.mediaDevices.getUserMedia=async constraints=>{const stream=await get(constraints);window.poseFixture.tracks.push(...stream.getTracks());return stream;};
  13 |     class FixtureWorker{
  14 |       onmessage:((e:MessageEvent<WorkerResponse>)=>void)|null=null;onerror=null;private epoch=0;private closed=false;
  15 |       constructor(){window.poseFixture.workers++;window.poseFixture.maxWorkers=Math.max(window.poseFixture.maxWorkers,window.poseFixture.workers);}
  16 |       postMessage(m:WorkerRequest){
  17 |         if(m.kind==='init'){this.epoch=m.sourceEpoch;this.reply({kind:'ready',sourceEpoch:this.epoch});}
  18 |         else if(m.kind==='dispose')this.reply({kind:'disposed'});
  19 |         else{m.bitmap.close();if(window.poseFixture.stalled)return;const landmarks=structuredClone(poses[window.poseFixture.pose]);if(window.poseFixture.low)landmarks[16].visibility=.1;
  20 |           this.reply({kind:'frame',sourceEpoch:this.epoch,requestId:m.requestId,frame:{frameId:m.requestId,capturedAtMs:m.capturedAtMs,width:m.width,height:m.height,landmarks,valid:true,inferenceMs:0}});}
  21 |       }
  22 |       private reply(data:WorkerResponse){queueMicrotask(()=>{if(!this.closed)this.onmessage?.({data} as MessageEvent<WorkerResponse>);});}
  23 |       terminate(){if(!this.closed){this.closed=true;window.poseFixture.workers--;}}
  24 |     }
  25 |     window.Worker=FixtureWorker as unknown as typeof Worker;
  26 |   },poses);
  27 | }
  28 | export async function setPose(page:Page,pose:SyntheticPose,ms=450){await page.evaluate(p=>{window.poseFixture.pose=p;},pose);await page.waitForTimeout(ms);}
  29 | /** Drive valid observed phases, not an assumed number of frames in a fixed sleep. */
  30 | export async function completeSyntheticChop(page:Page,count:number){
> 31 |   await setPose(page,'raised',0);await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
     |                                                                            ^ Error: expect(locator).toContainText(expected) failed
  32 |   await setPose(page,'down',0);await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');
  33 |   // Keep the real minimum-cycle protection; 450ms of commanded down can become
  34 |   // only 396ms between confirmations after 15Hz sampling and smoothing.
  35 |   await page.waitForTimeout(recognitionConfig.chopMinCycleMs);
  36 |   await setPose(page,'raised',0);await expect(page.locator('#chopValue')).toHaveText(`${count}/15`);
  37 | }
  38 | export async function prepareCamera(page:Page){
  39 |   await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();await expect(page.locator('#calibrationCapture')).toBeEnabled();
  40 |   const steps:[SyntheticPose,string][]=[['standing','chop-raised'],['raised','chop-down'],['down','load-squat'],['squat','load-stand'],['standing','load-press'],['press','load-return'],['standing','carry-hold'],['hold','carry-release'],['standing','complete']];
  41 |   for(const [pose,next]of steps){await setPose(page,pose,150);await page.locator('#calibrationCapture').click();await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step',next);}
  42 |   await expect(page.locator('#beginCamera')).toBeEnabled();
  43 | }
  44 | 
```