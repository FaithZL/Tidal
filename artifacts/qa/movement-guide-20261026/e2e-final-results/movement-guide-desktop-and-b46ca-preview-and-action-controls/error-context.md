# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: movement-guide.spec.ts >> desktop and narrow layouts keep the skeleton separate from input preview and action controls
- Location: tests/e2e/movement-guide.spec.ts:36:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('#movementGuide')
Expected: visible
Received: hidden
Timeout:  7000ms

Call log:
  - Expect "toBeVisible" locator('#movementGuide') with timeout 7000ms
  - waiting for locator('#movementGuide')
    18 × locator resolved to <aside hidden="" data-step="1" data-time-ms="0" data-task="carry" id="movementGuide" aria-label="标准动作示范" class="movement-guide">…</aside>
       - unexpected value "hidden"

```

```yaml
- banner:
  - text: 本地测试加速模式 ▶ 自动模拟 · 非真实动作识别
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
  - text: 100%
  - complementary:
    - text: MISSION CONTROL 已完成
    - heading "劳作完成！" [level=2]
    - text: 🪓 已完成挥砍
    - strong: 15/15
    - text: 🪵 已装车木材
    - strong: 15/15
    - text: ⏱ 有效拉车
    - strong: 1.3/2s
    - text: 🌲 砍倒树木
    - strong: 3/3
    - text: 自动演示中，可随时暂停或关闭无摄像头测试。
    - button "自动模拟已开启" [disabled]
    - paragraph: 关闭测试后点继续，即可使用键盘
- button "向左旋转视角": ↶
- button "向右旋转视角": ↷
- button "城堡近景"
- button "全景视角"
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
  - strong: 00:10
  - text: 本局经过时间 · 含休息与暂停
  - strong: 00:11
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
  - text: 本次运行记录（输入来源见下方，不是生理测量） 挥砍 15 次 · 装车 15 次 · 有效持姿 1.3 秒 · 任务有效时间 10.1 秒 · 本局经过时间（含休息/暂停）11.9 秒 · 输入：含自动模拟（复用键盘模拟协议） 心率和卡路里：未接入测量设备，无法提供真实数据。66 天连续打卡与 500 卡等数据仅为原方案示意。
  - button "再看动作教学"
  - button "返回农场首页"
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {mkdir,writeFile} from 'node:fs/promises';
  3  | 
  4  | test.use({baseURL:'http://127.0.0.1:4174'});
  5  | const output='artifacts/qa/movement-guide-20261026';
  6  | const joints=(page:Page)=>page.locator('#movementGuide circle[data-joint]').evaluateAll(nodes=>nodes.map(node=>[node.getAttribute('data-joint'),node.getAttribute('cx'),node.getAttribute('cy')]));
  7  | async function begin(page:Page){
  8  |  await page.addInitScript(()=>{localStorage.setItem('tidal.demo.enabled','false');navigator.mediaDevices.getUserMedia=async()=>{throw new Error('Standard guide must not request a camera');};});
  9  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  10 | }
  11 | 
  12 | test('a standard skeleton moves independently while keyboard training waits and freezes on pause',async({page})=>{
  13 |  await begin(page);const guide=page.getByRole('complementary',{name:'标准动作示范',exact:true});
  14 |  await expect(guide).toBeVisible();await expect(guide).toHaveAttribute('data-task','chop');await expect(guide.locator('circle[data-joint]')).toHaveCount(14);
  15 |  await expect(guide).toHaveAttribute('data-step','2');const a=await joints(page);await page.waitForTimeout(400);expect(await joints(page)).not.toEqual(a);
  16 |  await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/0');
  17 |  await page.locator('#pauseBtn').click();const frozen=await joints(page),time=await guide.getAttribute('data-time-ms');await page.waitForTimeout(250);
  18 |  expect(await joints(page)).toEqual(frozen);await expect(guide).toHaveAttribute('data-time-ms',time!);
  19 |  await page.locator('#tutorialOpen').click();await expect(page.locator('#tutorialModal')).toBeVisible();await page.locator('#tutorialClose').click();
  20 |  await expect(page.locator('#statusTag')).toHaveText('已暂停');expect(await joints(page)).toEqual(frozen);
  21 |  await page.locator('#pauseBtn').click();await expect.poll(async()=>guide.getAttribute('data-time-ms')).not.toBe(time);
  22 |  await expect(page.locator('#chopValue')).toHaveText('0/15');
  23 | });
  24 | 
  25 | test('the guide switches through all tasks without changing the automatic inventory flow',async({page})=>{
  26 |  await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));await page.goto('/?e2e=1&art=npr-sample');
  27 |  const guide=page.locator('#movementGuide');await expect(guide).toHaveAttribute('data-task','chop');await expect(guide).toBeVisible();
  28 |  await expect(guide).toHaveAttribute('data-task','load',{timeout:25000});await expect(guide.locator('circle[data-joint]')).toHaveCount(14);
  29 |  await expect(guide).toHaveAttribute('data-task','carry',{timeout:25000});
  30 |  const hold=await joints(page);await page.waitForTimeout(220);expect(await joints(page)).toEqual(hold);
  31 |  await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});await expect(guide).toBeHidden();await expect(page.locator('#rewardLogs')).toHaveText('15');
  32 |  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
  33 |  await page.locator('#resultsHome').click();await expect(guide).toBeHidden();await page.waitForTimeout(300);await expect(page.locator('#chopValue')).toHaveText('0/15');
  34 | });
  35 | 
  36 | test('desktop and narrow layouts keep the skeleton separate from input preview and action controls',async({page})=>{
  37 |  await page.emulateMedia({reducedMotion:'reduce'});await begin(page);
  38 |  await page.locator('#demoToggle').click();await page.locator('#pauseBtn').click();
  39 |  const observations=[];
  40 |  for(const size of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:601,height:768},{width:620,height:768},{width:650,height:768},{width:390,height:844},{width:390,height:600}]){
> 41 |   await page.setViewportSize(size);const guide=page.locator('#movementGuide');await expect(guide).toBeVisible();
     |                                                                                                   ^ Error: expect(locator).toBeVisible() failed
  42 |   const time=await guide.getAttribute('data-time-ms');await page.waitForTimeout(100);await expect(guide).toHaveAttribute('data-time-ms',time!);
  43 |   const result=await page.evaluate(()=>{
  44 |    const box=(id:string)=>{const r=document.getElementById(id)!.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
  45 |    return {guide:box('movementGuide'),preview:box('livePreview'),action:box('actionBtn'),percent:box('scenePercent'),timeline:document.querySelector('.timeline')!.getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth};
  46 |   });
  47 |   const intersects=(a:typeof result.guide,b:typeof result.guide)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  48 |   expect(result.overflow).toBe(false);expect(result.guide.left).toBeGreaterThanOrEqual(0);expect(result.guide.right).toBeLessThanOrEqual(size.width);
  49 |   expect(result.guide.top).toBeGreaterThanOrEqual(0);expect(result.guide.bottom).toBeLessThanOrEqual(size.height);
  50 |   expect(intersects(result.guide,result.preview)).toBe(false);expect(intersects(result.guide,result.action)).toBe(false);expect(intersects(result.guide,result.timeline)).toBe(false);expect(intersects(result.guide,result.percent)).toBe(false);
  51 |   expect(intersects(result.percent,result.preview)).toBe(false);expect(result.percent.right).toBeLessThanOrEqual(size.width);
  52 |   observations.push({size,...result});await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/layout-${size.width}x${size.height}.png`});
  53 |  }
  54 |  await writeFile(`${output}/layout.json`,JSON.stringify(observations,null,2));
  55 | });
  56 | 
  57 | test('changing to reduced motion immediately shows a complete key pose instead of a half squat',async({page})=>{
  58 |  await page.route('**/movement-guide-motion-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><aside id="movementGuide"><b data-guide-task></b><svg></svg><span data-guide-step></span><small data-guide-note></small></aside>'}));
  59 |  await page.goto('/movement-guide-motion-fixture');
  60 |  const mid=await page.evaluate(async()=>{
  61 |   const modulePath='/src/ui/movementGuide.ts',controllerPath='/src/domain/sessionController.ts',configPath='/src/config/demoConfig.ts';
  62 |   const [{MovementGuide},{createSessionController},{createDemoConfig}]=await Promise.all([import(modulePath),import(controllerPath),import(configPath)]);
  63 |   const controller=createSessionController(createDemoConfig(),{nowMs:()=>0});controller.command({kind:'open-setup',mode:'keyboard'});controller.command({kind:'setup-ready'});
  64 |   const guide=new MovementGuide(document.getElementById('movementGuide')!);guide.sync({...controller.getSnapshot(),task:'load'},true);
  65 |   guide.update(1000);for(let time=1100;time<=2700;time+=100)guide.update(time);controller.dispose();
  66 |   return Number(document.querySelector('[data-joint="rightWrist"]')!.getAttribute('cy'));
  67 |  });
  68 |  expect(mid).toBeGreaterThan(130);expect(mid).toBeLessThan(180);
  69 |  await page.emulateMedia({reducedMotion:'reduce'});
  70 |  await expect.poll(async()=>Number(await page.locator('[data-joint="rightWrist"]').getAttribute('cy'))).toBeCloseTo(112.92,5);
  71 |  await expect(page.locator('#movementGuide')).toHaveAttribute('data-time-ms','0');await expect(page.locator('[data-guide-note]')).toContainText('关键姿态');
  72 | });
  73 | 
  74 | test('the real guide clears short hidden, paused and changed-context intervals without a hidden rAF',async({page})=>{
  75 |  await page.route('**/movement-guide-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><aside id="movementGuide"><b data-guide-task></b><svg></svg><span data-guide-step></span><small data-guide-note></small></aside>'}));
  76 |  await page.goto('/movement-guide-fixture');
  77 |  const result=await page.evaluate(async()=>{
  78 |   let hidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
  79 |   const modulePath='/src/ui/movementGuide.ts',controllerPath='/src/domain/sessionController.ts',configPath='/src/config/demoConfig.ts';
  80 |   const [{MovementGuide},{createSessionController},{createDemoConfig}]=await Promise.all([import(modulePath),import(controllerPath),import(configPath)]);
  81 |   const controller=createSessionController(createDemoConfig(),{nowMs:()=>0});controller.command({kind:'open-setup',mode:'keyboard'});controller.command({kind:'setup-ready'});
  82 |   const root=document.getElementById('movementGuide')!,guide=new MovementGuide(root),s=controller.getSnapshot();
  83 |   guide.sync(s,true);guide.update(1000);guide.update(1100);const before=root.dataset.timeMs;
  84 |   hidden=true;document.dispatchEvent(new Event('visibilitychange'));hidden=false;document.dispatchEvent(new Event('visibilitychange'));guide.update(1250);const afterHidden=root.dataset.timeMs;
  85 |   guide.sync({...s,pauseReasons:['user']},true);guide.update(1300);guide.sync(s,true);guide.update(1400);const afterPause=root.dataset.timeMs;
  86 |   guide.sync({...s,sourceEpoch:s.sourceEpoch+1},true);guide.update(1500);const afterEpoch=root.dataset.timeMs;
  87 |   guide.update(1600);guide.sync({...s,sessionId:'new-session'},true);guide.update(1700);const afterSession=root.dataset.timeMs;
  88 |   guide.sync({...s,phase:'rest',task:'load',taskRunId:'load-run'},true);guide.update(1800);const next={task:root.dataset.task,time:root.dataset.timeMs,copy:root.textContent};
  89 |   guide.dispose();controller.dispose();return {before,afterHidden,afterPause,afterEpoch,afterSession,next,disposed:root.hidden};
  90 |  });
  91 |  expect(result.before).toBe('100');expect(result.afterHidden).toBe(result.before);expect(result.afterPause).toBe(result.before);expect(result.afterEpoch).toBe('0');expect(result.afterSession).toBe('0');
  92 |  expect(result.next.task).toBe('load');expect(result.next.time).toBe('0');expect(result.next.copy).toContain('下一项');expect(result.disposed).toBe(true);
  93 | });
  94 | 
```