# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: animation-stop.spec.ts >> one click freezes the active world, teaching skeleton and outcomes, and explicit continue resumes
- Location: tests/e2e/animation-stop.spec.ts:11:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#animationStop')
Expected: visible
Timeout: 7000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('#animationStop') with timeout 7000ms
  - waiting for locator('#animationStop')

```

```yaml
- banner:
  - text: T ✦ TIDAL FARM 每一次运动，都让世界生长 本地测试加速模式 ▶ 自动模拟 · 非真实动作识别
  - switch "无摄像头测试：开" [checked]
  - button "动作教学"
  - button "开启音效"
  - button "重新开始"
- main:
  - text: YOUR LITTLE WORLD
  - heading "今天的收获已装满手推车" [level=1]
  - text: 今日收获 · 已完成
  - img "可旋转三维农场。地面0、车上0、到家15。":
    - text: 用户人物/房屋 · 挥砍 / 装车 / 行走动作
    - link "原动作对照":
      - /url: /?art=npr-sample&model=prototype
  - text: 从一件小事开始，让这座农场苏醒。 100% 🪓 砍伐杉树 壶铃挥砍 🪵 木材装车 深蹲推举 🛒 运输木材 持续持姿
  - complementary:
    - text: MISSION CONTROL 已完成
    - heading "劳作完成！" [level=2]
    - paragraph: 所有奖励均已结算。你可以返回首页重置并再次体验。
    - text: 🪓 已完成挥砍
    - strong: 15/15
    - text: 🪵 已装车木材
    - strong: 15/15
    - text: ⏱ 有效拉车
    - strong: 1.3/2s
    - text: 🌲 砍倒树木
    - strong: 3/3
    - text: ✧ 将运动变成资产 收集资源 · 升级农场 · 获得正反馈 自动演示中，可随时暂停或关闭无摄像头测试。
    - button "自动模拟已开启" [disabled]
    - paragraph: 关闭测试后点继续，即可使用键盘
    - group: 输入诊断
- text: 拖拽旋转 · 滚轮缩放
- button "向左旋转视角": ↶
- button "向右旋转视角": ↷
- button "城堡近景"
- button "全景视角"
- contentinfo:
  - status: 会话 session-1 · 已完成
- dialog "恭喜！今天的农场劳作完成":
  - text: ✦ THE HARVEST IS HERE
  - heading "恭喜！今天的农场劳作完成" [level=2]
  - paragraph: 你的每一次付出，都留下了实实在在的痕迹。
  - text: YOUR MOVEMENT
  - heading "运动成果" [level=3]
  - text: 完整挥砍 / 次
  - strong: "15"
  - text: 复合装车 / 次
  - strong: "15"
  - text: 有效持姿 / 秒
  - strong: "1.3"
  - text: 任务有效时间
  - strong: 00:04
  - text: 本局经过时间 · 含休息与暂停
  - strong: 00:05
  - text: YOUR HARVEST
  - heading "农场收获" [level=3]
  - text: 🪵 木材到家
  - strong: "15"
  - text: 🪙 游戏金币
  - strong: "100"
  - text: ⚡ 游戏体力
  - strong: "100"
  - img "农场叶芽徽章 T 恤"
  - text: 盲盒奖励： 限定 T 恤
  - paragraph: 木材已送达农舍。每一份收获，都来自本局完整提交的动作。
  - text: 本次运行记录（输入来源见下方，不是生理测量） 挥砍 15 次 · 装车 15 次 · 有效持姿 1.3 秒 · 任务有效时间 4.2 秒 · 本局经过时间（含休息/暂停）5.3 秒 · 输入：含自动模拟（复用键盘模拟协议） 心率和卡路里：未接入测量设备，无法提供真实数据。66 天连续打卡与 500 卡等数据仅为原方案示意。
  - button "再看动作教学"
  - button "返回农场首页"
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {installPoseFixture,prepareCamera} from '../helpers/browserPoseFixture.js';
  3  | 
  4  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  5  | const observe=(page:Page)=>page.evaluate(()=>{
  6  |  const world=document.getElementById('worldCanvas')!,guide=document.getElementById('movementGuide')!;
  7  |  return {phase:document.getElementById('app')!.dataset.phase,chop:document.getElementById('chopValue')!.textContent,load:document.getElementById('loadValue')!.textContent,carry:document.getElementById('carryValue')!.textContent,countdown:document.getElementById('countdown')!.textContent,inventory:world.dataset.inventory,hand:world.dataset.hand,foot:world.dataset.footPose,blade:world.dataset.blade,cart:world.dataset.cartPosition,guideTime:guide.dataset.timeMs,joints:Array.from(guide.querySelectorAll('[data-joint]')).map(node=>[node.getAttribute('cx'),node.getAttribute('cy')])};
  8  | });
  9  | async function enter(page:Page,automatic=true){await page.addInitScript(value=>localStorage.setItem('tidal.demo.enabled',String(value)),automatic);await page.goto('/?e2e=1&art=npr-sample');}
  10 | 
  11 | test('one click freezes the active world, teaching skeleton and outcomes, and explicit continue resumes',async({page})=>{
  12 |  await enter(page);await expect(page.locator('#statusTag')).toHaveText('训练中');
> 13 |  await expect(page.locator('#animationStop')).toBeVisible();await page.locator('#animationStop').click();await expect(page.locator('#animationStop')).toHaveText('继续播放');
     |                                               ^ Error: expect(locator).toBeVisible() failed
  14 |  await expect(page.locator('#statusTag')).toHaveText('已暂停');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');
  15 |  const frozen=await observe(page);await page.waitForTimeout(450);expect(await observe(page)).toEqual(frozen);
  16 |  await page.keyboard.press('p');await expect(page.locator('#statusTag')).toHaveText('已暂停');expect(await observe(page)).toEqual(frozen);
  17 |  await page.keyboard.press('Shift+P');await expect(page.locator('#animationStop')).toHaveText('停止动画');await expect(page.locator('#statusTag')).toHaveText('训练中');
  18 |  await expect.poll(async()=>page.locator('#chopValue').textContent()).not.toBe(frozen.chop);
  19 |  await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});await expect(page.locator('#rewardLogs')).toHaveText('15');
  20 | });
  21 | 
  22 | test('stopping in teaching preserves a selected pose and cannot be bypassed by local playback or replay',async({page})=>{
  23 |  await enter(page,false);await page.locator('#planTutorial').click();
  24 |  await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','true');await page.locator('#tutorialAnimationStop').click();
  25 |  const time=await page.locator('#tutorialModal').getAttribute('data-time-ms');await page.waitForTimeout(300);await expect(page.locator('#tutorialModal')).toHaveAttribute('data-time-ms',time!);
  26 |  await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','false');await expect(page.locator('#tutorialPlay')).toBeDisabled();await expect(page.locator('#tutorialReplay')).toBeDisabled();
  27 |  await page.locator('#tutorialStepList button').nth(2).click();await expect(page.locator('#tutorialModal')).toHaveAttribute('data-step','2');await page.locator('#tutorialAnimationStop').click();
  28 |  await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','false');await page.locator('#tutorialPlay').click();await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','true');
  29 |  await page.locator('#tutorialClose').click();await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();
  30 |  await page.locator('#setupAnimationStop').click();const a=await page.locator('#demoSetupCanvas').evaluate((canvas:HTMLCanvasElement)=>canvas.toDataURL());await page.waitForTimeout(850);
  31 |  expect(await page.locator('#demoSetupCanvas').evaluate((canvas:HTMLCanvasElement)=>canvas.toDataURL())).toBe(a);await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');
  32 |  await page.keyboard.press('Shift+P');await expect(page.locator('#setupAnimationStop')).toHaveText('停止动画');
  33 |  await expect.poll(()=>page.locator('#demoSetupCanvas').evaluate((canvas:HTMLCanvasElement)=>canvas.toDataURL())).not.toBe(a);
  34 | });
  35 | 
  36 | test('stopping before assets prevents hidden autoplay and preserves the saved preference',async({page})=>{
  37 |  let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});
  38 |  await page.route('**/assets/user-models/castle.fbx',async route=>{await pending;await route.continue();});
  39 |  await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));await page.goto('/?e2e=1&art=npr-sample',{waitUntil:'domcontentloaded'});
  40 |  try{await page.locator('#animationStop').click();}finally{release();}
  41 |  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');await page.waitForTimeout(300);await expect(page.locator('#app')).toHaveAttribute('data-phase','home');
  42 |  expect(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'))).toBe('true');await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  43 |  await page.locator('#animationStop').click();await page.locator('#resetBtn').click();await page.waitForTimeout(300);await expect(page.locator('#app')).toHaveAttribute('data-phase','home');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');
  44 |  await page.locator('#animationStop').click();await page.waitForTimeout(300);await expect(page.locator('#app')).toHaveAttribute('data-phase','home');
  45 | });
  46 | 
  47 | test('continue preserves an existing user pause and a visibility pause',async({page})=>{
  48 |  await enter(page);await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#pauseBtn').click();
  49 |  await page.locator('#animationStop').click();await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  50 |  await page.locator('#pauseBtn').click();await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#animationStop').click();
  51 |  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  52 |  const frozen=await observe(page);await page.waitForTimeout(300);expect(await observe(page)).toEqual(frozen);
  53 | });
  54 | 
  55 | test('camera monitoring continues during animation stop and loss still requires preparation',async({page})=>{
  56 |  test.setTimeout(90000);await installPoseFixture(page);await enter(page,false);await prepareCamera(page);await page.locator('#beginCamera').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  57 |  const resources=await page.evaluate(()=>({tracks:window.poseFixture.tracks.map(track=>track.id),workers:window.poseFixture.workers}));await page.locator('#animationStop').click();
  58 |  expect(await page.evaluate(()=>({tracks:window.poseFixture.tracks.map(track=>track.id),workers:window.poseFixture.workers}))).toEqual(resources);
  59 |  await page.evaluate(()=>{window.poseFixture.low=true;});await expect(page.locator('#setupModal')).toBeVisible({timeout:10000});await expect(page.locator('#beginCamera')).toBeDisabled();
  60 |  await page.locator('#setupAnimationStop').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#chopValue')).toHaveText('0/15');
  61 | });
  62 | 
```