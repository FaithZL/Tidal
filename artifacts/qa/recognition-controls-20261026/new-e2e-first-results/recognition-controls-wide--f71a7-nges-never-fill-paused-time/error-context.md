# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recognition-controls.spec.ts >> wide tolerance completes all real recognizer tasks and carry setting changes never fill paused time
- Location: tests/e2e/recognition-controls.spec.ts:49:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('#chopValue')
Expected: "9/15"
Received: "0/15"
Timeout:  7000ms

Call log:
  - Expect "toHaveText" locator('#chopValue') with timeout 7000ms
  - waiting for locator('#chopValue')
    2 × locator resolved to <strong id="chopValue">8/15</strong>
      - unexpected value "8/15"
    15 × locator resolved to <strong id="chopValue">0/15</strong>
       - unexpected value "0/15"

```

```yaml
- banner:
  - text: T ✦ TIDAL FARM 每一次运动，都让世界生长 本地测试加速模式 ⌨ 键盘演示 · 非真实动作识别
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
  - text: 从一件小事开始，让这座农场苏醒。 0% 🪓 砍伐杉树 壶铃挥砍 🪵 木材装车 深蹲推举 🛒 运输木材 持续持姿
  - complementary:
    - text: MISSION CONTROL 未开始
    - heading "农场计划" [level=2]
    - text: 准备开始今天的劳作。
    - button "等待任务开始" [disabled]
    - paragraph: 按 Space 完成一次动作循环（禁用自动重复）
- text: 拖拽旋转 · 滚轮缩放
- button "向左旋转视角": ↶
- button "向右旋转视角": ↷
- button "城堡近景"
- button "全景视角"
- contentinfo:
  - status: 会话 session-1 · 未开始
- dialog "农场今日劳作":
  - text: 禾 禾禾 · 农场管家 A LITTLE EVERY DAY 今日
  - heading "农场今日劳作" [level=2]
  - paragraph: 从林间到谷仓，让每一次运动都留下收获。
  - text: 01 砍伐杉树 挥砍 5 次 × 3 棵 · 共 15 次 02 收集木材 深蹲推举 15 次 · 装车 15 份木材 03 推车回家 持续持姿 2 秒 · 返回农场 今日为预设训练计划 · 概念演示，非 AI 自动规划。
  - button "先看动作教学"
  - button "稍后再说"
  - button "接受今天的任务 →"
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
  31 |   await setPose(page,'raised',0);await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
  32 |   await setPose(page,'down',0);await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');
  33 |   // Keep the real minimum-cycle protection; 450ms of commanded down can become
  34 |   // only 396ms between confirmations after 15Hz sampling and smoothing.
  35 |   await page.waitForTimeout(recognitionConfig.chopMinCycleMs);
> 36 |   await setPose(page,'raised',0);await expect(page.locator('#chopValue')).toHaveText(`${count}/15`);
     |                                                                           ^ Error: expect(locator).toHaveText(expected) failed
  37 | }
  38 | export async function prepareCamera(page:Page){
  39 |   await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();await expect(page.locator('#calibrationCapture')).toBeEnabled();
  40 |   const steps:[SyntheticPose,string][]=[['standing','chop-raised'],['raised','chop-down'],['down','load-squat'],['squat','load-stand'],['standing','load-press'],['press','load-return'],['standing','carry-hold'],['hold','carry-release'],['standing','complete']];
  41 |   for(const [pose,next]of steps){await setPose(page,pose,150);await page.locator('#calibrationCapture').click();await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step',next);}
  42 |   await expect(page.locator('#beginCamera')).toBeEnabled();
  43 | }
  44 | 
```