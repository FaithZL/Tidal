# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: movement-guide.spec.ts >> desktop and narrow layouts keep the skeleton separate from input preview and action controls
- Location: tests/e2e/movement-guide.spec.ts:36:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: false
Received: true
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner:
    - generic:
      - generic:
        - text: T
        - generic: ✦
      - generic:
        - generic: TIDAL FARM
        - generic: 每一次运动，都让世界生长
    - generic [ref=e2]:
      - generic [ref=e3]: 本地测试加速模式
      - generic [ref=e4]: ▶ 自动模拟 · 非真实动作识别
      - switch "无摄像头测试：开" [checked] [ref=e5] [cursor=pointer]
      - button "动作教学" [ref=e6] [cursor=pointer]
      - button "开启音效" [ref=e7] [cursor=pointer]
      - button "暂停" [active] [ref=e8] [cursor=pointer]
      - button "重新开始" [ref=e9] [cursor=pointer]
  - main [ref=e10]:
    - generic [ref=e11]:
      - generic:
        - generic:
          - generic: YOUR LITTLE WORLD
          - heading "砍伐杉树" [level=1]
        - generic: 今日劳作 · 体验计划
      - generic [ref=e12]:
        - img "可旋转三维农场。地面5、车上0、到家0。" [ref=e13]:
          - generic "可旋转的三维农场，拖拽旋转、滚轮缩放" [ref=e14]
          - generic:
            - text: 用户人物/房屋 · 挥砍 / 装车 / 行走动作
            - link "原动作对照" [ref=e15] [cursor=pointer]:
              - /url: /?art=npr-sample&model=prototype
        - generic:
          - generic: 自动模拟正在演示农场劳作，非真实运动成果。
          - generic: 33%
      - generic "训练任务阶段":
        - generic:
          - generic: 🪓
          - generic:
            - text: 砍伐杉树
            - generic: 壶铃挥砍
        - generic:
          - generic: 🪵
          - generic:
            - text: 木材装车
            - generic: 深蹲推举
        - generic:
          - generic: 🛒
          - generic:
            - text: 运输木材
            - generic: 持续持姿
    - complementary [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e18]: MISSION CONTROL
        - generic [ref=e19]: 训练中
      - heading "砍伐杉树" [level=2] [ref=e20]
      - paragraph [ref=e21]: 脚本自动完成动作循环，合成骨架同步展示阶段。进度和奖励均为演示数据。
      - generic [ref=e22]:
        - generic [ref=e23]:
          - generic [ref=e24]: 🪓 已完成挥砍
          - strong [ref=e25]: 5/15
        - generic [ref=e26]:
          - generic [ref=e27]: 🪵 已装车木材
          - strong [ref=e28]: 0/15
        - generic [ref=e29]:
          - generic [ref=e30]: ⏱ 有效拉车
          - strong [ref=e31]: 0.0/2s
        - generic [ref=e32]:
          - generic [ref=e33]: 🌲 砍倒树木
          - strong [ref=e34]: 1/3
      - generic [ref=e35]:
        - generic [ref=e36]: 自动演示中，可随时暂停或关闭无摄像头测试。
        - button "自动模拟已开启" [disabled] [ref=e37]
        - paragraph [ref=e38]: 关闭测试后点继续，即可使用键盘
      - group [ref=e39]:
        - generic "输入诊断" [ref=e40] [cursor=pointer]
  - generic "三维视角控制" [ref=e41]:
    - generic [ref=e42]: 拖拽旋转 · 滚轮缩放
    - button "向左旋转视角" [ref=e43] [cursor=pointer]: ↶
    - button "向右旋转视角" [ref=e44] [cursor=pointer]: ↷
    - button "城堡近景" [ref=e45] [cursor=pointer]
    - button "全景视角" [ref=e46] [cursor=pointer]
  - complementary "标准动作示范":
    - img "挥砍标准动作骨骼示范"
    - generic:
      - generic: 挥砍
      - generic: 上肩准备
    - generic: 关键姿态 · 详细步骤见动作教学
  - complementary "运动状态画中画" [ref=e47]:
    - generic [ref=e48]:
      - generic [ref=e50]: 合成骨架 · 自动模拟
      - generic [ref=e51]: MOVE WITH TIDAL
    - generic [ref=e52]:
      - generic "脚本合成骨架，非摄像头识别" [ref=e53]
      - generic [ref=e54]:
        - generic [ref=e55]: 合成骨架 · 自动模拟
        - generic [ref=e56]: 非摄像头 / 非真实运动识别
    - generic [ref=e57]:
      - strong [ref=e58]: 复位 · 收回斧头
      - generic [ref=e59]: 挥砍 5 次 × 3 棵 · 共 15 次
  - contentinfo:
    - status: 会话 session-1 · 训练中
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
  41 |   await page.setViewportSize(size);const guide=page.locator('#movementGuide');await expect(guide).toBeVisible();
  42 |   const time=await guide.getAttribute('data-time-ms');await page.waitForTimeout(100);await expect(guide).toHaveAttribute('data-time-ms',time!);
  43 |   const result=await page.evaluate(()=>{
  44 |    const box=(id:string)=>{const r=document.getElementById(id)!.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
  45 |    return {guide:box('movementGuide'),preview:box('livePreview'),action:box('actionBtn'),percent:box('scenePercent'),timeline:document.querySelector('.timeline')!.getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth};
  46 |   });
  47 |   const intersects=(a:typeof result.guide,b:typeof result.guide)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  48 |   expect(result.overflow).toBe(false);expect(result.guide.left).toBeGreaterThanOrEqual(0);expect(result.guide.right).toBeLessThanOrEqual(size.width);
  49 |   expect(result.guide.top).toBeGreaterThanOrEqual(0);expect(result.guide.bottom).toBeLessThanOrEqual(size.height);
> 50 |   expect(intersects(result.guide,result.preview)).toBe(false);expect(intersects(result.guide,result.action)).toBe(false);expect(intersects(result.guide,result.timeline)).toBe(false);expect(intersects(result.guide,result.percent)).toBe(false);
     |                                                                                                                                                                                                                                       ^ Error: expect(received).toBe(expected) // Object.is equality
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