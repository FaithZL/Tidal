# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: source-lifecycle.spec.ts >> a stalled camera during rest cannot start the next active task without preparation
- Location: tests/e2e/source-lifecycle.spec.ts:41:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#inputDebug')
- Expected substring  - 1
+ Received string     + 4

-  · ready ·
+ camera · run-1 · epoch 3 · chop-down · 等待/有效输入
+ 游戏帧间隔 p95 16.8ms（最近120帧，非端到端延迟）
+ 640×480 · 33 个关键点 · 15.2 Hz · 推理 p50/p95 0/0ms · 样本年龄 0ms · 人体关键点可用
+ 右侧 · 置信度 0.99 · 膝 180.0° · 肘 168.7° · 腕相对髋 (0.19, 0.35) · 躯干 130px

Call log:
  - Expect "toContainText" locator('#inputDebug') with timeout 7000ms
  - waiting for locator('#inputDebug')
    3 × locator resolved to <small id="inputDebug">camera · run-1 · epoch 3 · chop-down · 等待/有效输入↵游戏…</small>
      - unexpected value "camera · run-1 · epoch 3 · chop-down · 等待/有效输入
游戏帧间隔 p95 16.8ms（最近120帧，非端到端延迟）
640×480 · 33 个关键点 · 15.2 Hz · 推理 p50/p95 0/0ms · 样本年龄 0ms · 人体关键点可用
右侧 · 置信度 0.99 · 膝 180.0° · 肘 168.7° · 腕相对髋 (0.19, 0.35) · 躯干 130px"
  - Test ended.

```

```yaml
- banner:
  - text: T ✦ TIDAL FARM 每一次运动，都让世界生长 本地测试加速模式 📷 摄像头姿态代理 · 真机待验证
  - switch "无摄像头测试：关"
  - button "开启音效"
  - button "切换键盘"
  - button "重新标定"
  - button "暂停"
  - button "重新开始"
- main:
  - text: YOUR LITTLE WORLD
  - heading "砍伐杉树" [level=1]
  - text: 今日劳作 · 体验计划
  - img "可旋转三维农场。地面5、车上0、到家0。"
  - text: 保持全身可见；停止持姿或跟踪失效时不推进。 40% 🪓 砍伐杉树 壶铃挥砍 🪵 木材装车 深蹲推举 🛒 运输木材 持续持姿
  - complementary:
    - text: MISSION CONTROL 训练中
    - heading "砍伐杉树" [level=2]
    - paragraph: 按照标定动作完成完整循环；拉车只检测姿态持续性，不能证明实际持握。
    - text: 🪓 已完成挥砍
    - strong: 6/15
    - text: 🪵 已装车木材
    - strong: 0/15
    - text: ⏱ 有效拉车
    - strong: 0.0/2s
    - text: 🌲 砍倒树木
    - strong: 1/3
    - text: ✧ 将运动变成资产 收集资源 · 升级农场 · 获得正反馈 准备开始今天的劳作。
    - button "由摄像头姿态控制" [disabled]
    - paragraph: Space不产生运动成果；可明确切换键盘
    - group: 输入诊断
- text: 拖拽旋转 · 滚轮缩放
- button "向左旋转视角": ↶
- button "向右旋转视角": ↷
- button "城堡近景"
- button "全景视角"
- complementary "运动状态画中画":
  - text: 本机摄像头 · 姿态代理 MOVE WITH TIDAL
  - strong: 复位 · 收回斧头
  - text: 挥砍 5 次 × 3 棵 · 共 15 次
- contentinfo:
  - status: 会话 session-1 · 训练中
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