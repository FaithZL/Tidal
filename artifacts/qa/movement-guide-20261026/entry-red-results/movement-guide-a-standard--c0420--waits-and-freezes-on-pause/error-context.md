# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: movement-guide.spec.ts >> a standard skeleton moves independently while keyboard training waits and freezes on pause
- Location: tests/e2e/movement-guide.spec.ts:12:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('complementary', { name: '标准动作示范', exact: true })
Expected: visible
Timeout: 7000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('complementary', { name: '标准动作示范', exact: true }) with timeout 7000ms
  - waiting for getByRole('complementary', { name: '标准动作示范', exact: true })

```

```yaml
- banner:
  - text: T ✦ TIDAL FARM 每一次运动，都让世界生长 本地测试加速模式 ⌨ 键盘演示 · 非真实动作识别
  - switch "无摄像头测试：关"
  - button "动作教学"
  - button "开启音效"
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
  - text: 空格触发一次“上举 → 下挥 → 复位”，完整循环后记数。 0% 🪓 砍伐杉树 壶铃挥砍 🪵 木材装车 深蹲推举 🛒 运输木材 持续持姿
  - complementary:
    - text: MISSION CONTROL 训练中
    - heading "砍伐杉树" [level=2]
    - paragraph: 空格触发一次“上举 → 下挥 → 复位”，完整循环后记数。
    - text: 🪓 已完成挥砍
    - strong: 0/15
    - text: 🪵 已装车木材
    - strong: 0/15
    - text: ⏱ 有效拉车
    - strong: 0.0/2s
    - text: 🌲 砍倒树木
    - strong: 0/3
    - text: ✧ 将运动变成资产 收集资源 · 升级农场 · 获得正反馈 空格触发一次“上举 → 下挥 → 复位”，完整循环后记数。
    - button "🪓 模拟一次挥砍"
    - paragraph: 按 Space 完成一次动作循环（禁用自动重复）
    - group: 输入诊断
- text: 拖拽旋转 · 滚轮缩放
- button "向左旋转视角": ↶
- button "向右旋转视角": ↷
- button "城堡近景"
- button "全景视角"
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
> 14 |  await expect(guide).toBeVisible();await expect(guide).toHaveAttribute('data-task','chop');await expect(guide.locator('circle[data-joint]')).toHaveCount(14);
     |                      ^ Error: expect(locator).toBeVisible() failed
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
  40 |  for(const size of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:390,height:844}]){
  41 |   await page.setViewportSize(size);const guide=page.locator('#movementGuide');await expect(guide).toBeVisible();
  42 |   const time=await guide.getAttribute('data-time-ms');await page.waitForTimeout(100);await expect(guide).toHaveAttribute('data-time-ms',time!);
  43 |   const result=await page.evaluate(()=>{
  44 |    const box=(id:string)=>{const r=document.getElementById(id)!.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
  45 |    return {guide:box('movementGuide'),preview:box('livePreview'),action:box('actionBtn'),timeline:document.querySelector('.timeline')!.getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth};
  46 |   });
  47 |   const intersects=(a:typeof result.guide,b:typeof result.guide)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  48 |   expect(result.overflow).toBe(false);expect(result.guide.left).toBeGreaterThanOrEqual(0);expect(result.guide.right).toBeLessThanOrEqual(size.width);
  49 |   expect(result.guide.top).toBeGreaterThanOrEqual(0);expect(result.guide.bottom).toBeLessThanOrEqual(size.height);
  50 |   expect(intersects(result.guide,result.preview)).toBe(false);expect(intersects(result.guide,result.action)).toBe(false);expect(intersects(result.guide,result.timeline)).toBe(false);
  51 |   observations.push({size,...result});await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/layout-${size.width}x${size.height}.png`});
  52 |  }
  53 |  await writeFile(`${output}/layout.json`,JSON.stringify(observations,null,2));
  54 | });
  55 | 
  56 | test('the real guide clears short hidden, paused and changed-context intervals without a hidden rAF',async({page})=>{
  57 |  await page.route('**/movement-guide-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><aside id="movementGuide"><b data-guide-task></b><svg></svg><span data-guide-step></span><small data-guide-note></small></aside>'}));
  58 |  await page.goto('/movement-guide-fixture');
  59 |  const result=await page.evaluate(async()=>{
  60 |   let hidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
  61 |   const modulePath='/src/ui/movementGuide.ts',controllerPath='/src/domain/sessionController.ts',configPath='/src/config/demoConfig.ts';
  62 |   const [{MovementGuide},{createSessionController},{createDemoConfig}]=await Promise.all([import(modulePath),import(controllerPath),import(configPath)]);
  63 |   const controller=createSessionController(createDemoConfig(),{nowMs:()=>0});controller.command({kind:'open-setup',mode:'keyboard'});controller.command({kind:'setup-ready'});
  64 |   const root=document.getElementById('movementGuide')!,guide=new MovementGuide(root),s=controller.getSnapshot();
  65 |   guide.sync(s,true);guide.update(1000);guide.update(1100);const before=root.dataset.timeMs;
  66 |   hidden=true;document.dispatchEvent(new Event('visibilitychange'));hidden=false;document.dispatchEvent(new Event('visibilitychange'));guide.update(1250);const afterHidden=root.dataset.timeMs;
  67 |   guide.sync({...s,pauseReasons:['user']},true);guide.update(1300);guide.sync(s,true);guide.update(1400);const afterPause=root.dataset.timeMs;
  68 |   guide.sync({...s,sourceEpoch:s.sourceEpoch+1},true);guide.update(1500);const afterEpoch=root.dataset.timeMs;
  69 |   guide.update(1600);guide.sync({...s,sessionId:'new-session'},true);guide.update(1700);const afterSession=root.dataset.timeMs;
  70 |   guide.sync({...s,phase:'rest',task:'load',taskRunId:'load-run'},true);guide.update(1800);const next={task:root.dataset.task,time:root.dataset.timeMs,copy:root.textContent};
  71 |   guide.dispose();controller.dispose();return {before,afterHidden,afterPause,afterEpoch,afterSession,next,disposed:root.hidden};
  72 |  });
  73 |  expect(result.before).toBe('100');expect(result.afterHidden).toBe(result.before);expect(result.afterPause).toBe(result.before);expect(result.afterEpoch).toBe('0');expect(result.afterSession).toBe('0');
  74 |  expect(result.next.task).toBe('load');expect(result.next.time).toBe('0');expect(result.next.copy).toContain('下一项');expect(result.disposed).toBe(true);
  75 | });
  76 | 
```