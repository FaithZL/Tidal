# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: movement-guide.spec.ts >> changing to reduced motion immediately shows a complete key pose instead of a half squat
- Location: tests/e2e/movement-guide.spec.ts:57:1

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 112.92
Received: 150.26465681044556

Expected precision:    5
Expected difference: < 0.000005
Received difference:   37.34465681044556

Call Log:
- Timeout 7000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- complementary [ref=e2]:
  - text: 装车
  - img "装车标准动作骨骼示范" [ref=e3]
  - text: 舒适下蹲动作示意 · 按个人标定范围跟做
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
> 70 |  await expect.poll(async()=>Number(await page.locator('[data-joint="rightWrist"]').getAttribute('cy'))).toBeCloseTo(112.92,5);
     |                                                                                                         ^ Error: expect(received).toBeCloseTo(expected, precision)
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