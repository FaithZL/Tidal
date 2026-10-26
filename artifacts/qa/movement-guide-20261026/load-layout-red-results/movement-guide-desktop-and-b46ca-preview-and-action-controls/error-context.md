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
    - generic [ref=e2]:
      - generic [ref=e3]: 本地测试加速模式
      - generic [ref=e4]: ▶ 自动模拟 · 非真实动作识别
      - switch "无摄像头测试：开" [checked] [active] [ref=e5] [cursor=pointer]
      - button "动作教学" [ref=e6] [cursor=pointer]
      - button "开启音效" [ref=e7] [cursor=pointer]
      - button "继续" [ref=e8] [cursor=pointer]
      - button "重新开始" [ref=e9] [cursor=pointer]
  - main [ref=e10]:
    - generic [ref=e11]:
      - generic:
        - generic:
          - generic: YOUR LITTLE WORLD
          - heading "把木材装上手推车" [level=1]
        - generic: 今日劳作 · 体验计划
      - generic [ref=e12]:
        - img "可旋转三维农场。地面15、车上0、到家0。" [ref=e13]:
          - generic "可旋转的三维农场，拖拽旋转、滚轮缩放" [ref=e14]
          - generic:
            - text: 用户人物/房屋 · 挥砍 / 装车 / 行走动作
            - link "原动作对照" [ref=e15] [cursor=pointer]:
              - /url: /?art=npr-sample&model=prototype
        - generic:
          - text: 已暂停
          - generic: 点击继续后恢复
        - generic: 0%
    - complementary [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e18]: MISSION CONTROL
        - generic [ref=e19]: 已暂停
      - heading "把木材装上手推车" [level=2] [ref=e20]
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: 🪓 已完成挥砍
          - strong [ref=e24]: 15/15
        - generic [ref=e25]:
          - generic [ref=e26]: 🪵 已装车木材
          - strong [ref=e27]: 0/15
        - generic [ref=e28]:
          - generic [ref=e29]: ⏱ 有效拉车
          - strong [ref=e30]: 0.0/2s
        - generic [ref=e31]:
          - generic [ref=e32]: 🌲 砍倒树木
          - strong [ref=e33]: 3/3
      - generic [ref=e34]:
        - generic [ref=e35]: 当前已暂停，按继续按钮恢复。
        - button "自动模拟已开启" [disabled] [ref=e36]
        - paragraph [ref=e37]: 关闭测试后点继续，即可使用键盘
  - generic "三维视角控制" [ref=e38]:
    - button "向左旋转视角" [ref=e39] [cursor=pointer]: ↶
    - button "向右旋转视角" [ref=e40] [cursor=pointer]: ↷
    - button "城堡近景" [ref=e41] [cursor=pointer]
    - button "全景视角" [ref=e42] [cursor=pointer]
  - complementary "标准动作示范":
    - img "装车标准动作骨骼示范"
    - generic:
      - generic: 装车
      - generic: 自然站立
  - complementary "运动状态画中画" [ref=e43]:
    - generic [ref=e44]: 合成骨架 · 自动模拟
    - generic [ref=e47]:
      - generic "脚本合成骨架，非摄像头识别" [ref=e48]
      - generic [ref=e49]:
        - generic [ref=e50]: 合成骨架 · 自动模拟
        - generic [ref=e51]: 非摄像头 / 非真实运动识别
    - generic [ref=e52]:
      - strong [ref=e53]: 已暂停 · 运动不计时
      - generic [ref=e54]: 深蹲 → 站起 → 推举 → 复位 · 15 次
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
  38 |  for(let rep=1;rep<=15;rep++){await page.locator('#actionBtn').click();await expect(page.locator('#chopValue')).toHaveText(`${rep}/15`);}
  39 |  await expect(page.locator('#missionTitle')).toHaveText('把木材装上手推车');await expect(page.locator('#statusTag')).toHaveText('训练中');
  40 |  await page.locator('#demoToggle').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  41 |  await expect(page.locator('#movementGuide')).toHaveAttribute('data-task','load');
  42 |  const observations=[];
  43 |  for(const size of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:601,height:768},{width:620,height:768},{width:650,height:768},{width:390,height:844},{width:390,height:600}]){
  44 |   await page.setViewportSize(size);const guide=page.locator('#movementGuide');await expect(guide).toBeVisible();
  45 |   const time=await guide.getAttribute('data-time-ms');await page.waitForTimeout(100);await expect(guide).toHaveAttribute('data-time-ms',time!);
  46 |   const result=await page.evaluate(()=>{
  47 |    const box=(id:string)=>{const r=document.getElementById(id)!.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
  48 |    return {guide:box('movementGuide'),preview:box('livePreview'),action:box('actionBtn'),percent:box('scenePercent'),timeline:document.querySelector('.timeline')!.getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth};
  49 |   });
  50 |   const intersects=(a:typeof result.guide,b:typeof result.guide)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  51 |   expect(result.overflow).toBe(false);expect(result.guide.left).toBeGreaterThanOrEqual(0);expect(result.guide.right).toBeLessThanOrEqual(size.width);
  52 |   expect(result.guide.top).toBeGreaterThanOrEqual(0);expect(result.guide.bottom).toBeLessThanOrEqual(size.height);
> 53 |   expect(intersects(result.guide,result.preview)).toBe(false);expect(intersects(result.guide,result.action)).toBe(false);expect(intersects(result.guide,result.timeline)).toBe(false);expect(intersects(result.guide,result.percent)).toBe(false);
     |                                                   ^ Error: expect(received).toBe(expected) // Object.is equality
  54 |   expect(intersects(result.percent,result.preview)).toBe(false);expect(result.percent.right).toBeLessThanOrEqual(size.width);
  55 |   observations.push({size,...result});await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/layout-${size.width}x${size.height}.png`});
  56 |  }
  57 |  await writeFile(`${output}/layout.json`,JSON.stringify(observations,null,2));
  58 | });
  59 | 
  60 | test('changing to reduced motion immediately shows a complete key pose instead of a half squat',async({page})=>{
  61 |  await page.route('**/movement-guide-motion-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><aside id="movementGuide"><b data-guide-task></b><svg></svg><span data-guide-step></span><small data-guide-note></small></aside>'}));
  62 |  await page.goto('/movement-guide-motion-fixture');
  63 |  const mid=await page.evaluate(async()=>{
  64 |   const modulePath='/src/ui/movementGuide.ts',controllerPath='/src/domain/sessionController.ts',configPath='/src/config/demoConfig.ts';
  65 |   const [{MovementGuide},{createSessionController},{createDemoConfig}]=await Promise.all([import(modulePath),import(controllerPath),import(configPath)]);
  66 |   const controller=createSessionController(createDemoConfig(),{nowMs:()=>0});controller.command({kind:'open-setup',mode:'keyboard'});controller.command({kind:'setup-ready'});
  67 |   const guide=new MovementGuide(document.getElementById('movementGuide')!);guide.sync({...controller.getSnapshot(),task:'load'},true);
  68 |   guide.update(1000);for(let time=1100;time<=2700;time+=100)guide.update(time);controller.dispose();
  69 |   return Number(document.querySelector('[data-joint="rightWrist"]')!.getAttribute('cy'));
  70 |  });
  71 |  expect(mid).toBeGreaterThan(130);expect(mid).toBeLessThan(180);
  72 |  await page.emulateMedia({reducedMotion:'reduce'});
  73 |  await expect.poll(async()=>Number(await page.locator('[data-joint="rightWrist"]').getAttribute('cy'))).toBeCloseTo(112.92,5);
  74 |  await expect(page.locator('#movementGuide')).toHaveAttribute('data-time-ms','0');await expect(page.locator('[data-guide-note]')).toContainText('关键姿态');
  75 | });
  76 | 
  77 | test('the real guide clears short hidden, paused and changed-context intervals without a hidden rAF',async({page})=>{
  78 |  await page.route('**/movement-guide-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><aside id="movementGuide"><b data-guide-task></b><svg></svg><span data-guide-step></span><small data-guide-note></small></aside>'}));
  79 |  await page.goto('/movement-guide-fixture');
  80 |  const result=await page.evaluate(async()=>{
  81 |   let hidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
  82 |   const modulePath='/src/ui/movementGuide.ts',controllerPath='/src/domain/sessionController.ts',configPath='/src/config/demoConfig.ts';
  83 |   const [{MovementGuide},{createSessionController},{createDemoConfig}]=await Promise.all([import(modulePath),import(controllerPath),import(configPath)]);
  84 |   const controller=createSessionController(createDemoConfig(),{nowMs:()=>0});controller.command({kind:'open-setup',mode:'keyboard'});controller.command({kind:'setup-ready'});
  85 |   const root=document.getElementById('movementGuide')!,guide=new MovementGuide(root),s=controller.getSnapshot();
  86 |   guide.sync(s,true);guide.update(1000);guide.update(1100);const before=root.dataset.timeMs;
  87 |   hidden=true;document.dispatchEvent(new Event('visibilitychange'));hidden=false;document.dispatchEvent(new Event('visibilitychange'));guide.update(1250);const afterHidden=root.dataset.timeMs;
  88 |   guide.sync({...s,pauseReasons:['user']},true);guide.update(1300);guide.sync(s,true);guide.update(1400);const afterPause=root.dataset.timeMs;
  89 |   guide.sync({...s,sourceEpoch:s.sourceEpoch+1},true);guide.update(1500);const afterEpoch=root.dataset.timeMs;
  90 |   guide.update(1600);guide.sync({...s,sessionId:'new-session'},true);guide.update(1700);const afterSession=root.dataset.timeMs;
  91 |   guide.sync({...s,phase:'rest',task:'load',taskRunId:'load-run'},true);guide.update(1800);const next={task:root.dataset.task,time:root.dataset.timeMs,copy:root.textContent};
  92 |   guide.dispose();controller.dispose();return {before,afterHidden,afterPause,afterEpoch,afterSession,next,disposed:root.hidden};
  93 |  });
  94 |  expect(result.before).toBe('100');expect(result.afterHidden).toBe(result.before);expect(result.afterPause).toBe(result.before);expect(result.afterEpoch).toBe('0');expect(result.afterSession).toBe('0');
  95 |  expect(result.next.task).toBe('load');expect(result.next.time).toBe('0');expect(result.next.copy).toContain('下一项');expect(result.disposed).toBe(true);
  96 | });
  97 | 
```