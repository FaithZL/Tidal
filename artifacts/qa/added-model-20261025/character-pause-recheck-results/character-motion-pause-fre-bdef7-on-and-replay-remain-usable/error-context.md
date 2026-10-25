# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: character-motion.spec.ts >> pause freezes rendered bones; slow motion and replay remain usable
- Location: tests/e2e/character-motion.spec.ts:17:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic:
  - main [ref=e1]:
    - generic "可旋转的局部人物动作样片" [ref=e2]
  - banner:
    - text: TIDAL · CHARACTER MOTION STUDY
    - heading "人物动作局部样片" [level=1]
    - paragraph: 参考视频田园少年 · 原创头部与配饰 + CC0 服装骨骼，非 Leo 原模型。仅审阅局部造型、站立与挥砍；不进行运动识别或计数。
  - region "动作样片控制" [ref=e3]:
    - heading "站立 · 呼吸与重心" [level=2] [ref=e4]
    - paragraph [ref=e5]: 观察腰胯发力、手臂随动和回收缓冲。拖动画面旋转，滚轮缩放。
    - generic [ref=e6]:
      - button "重播动作" [ref=e7] [cursor=pointer]
      - button "继续" [active] [ref=e8] [cursor=pointer]
      - button "慢速 0.5×" [ref=e9] [cursor=pointer]
      - button "仅看站立" [ref=e10] [cursor=pointer]
      - button "面部特写" [ref=e11] [cursor=pointer]
    - generic [ref=e12]:
      - text: 逐帧检视
      - generic [ref=e13]: 0.62 s
      - slider "逐帧检视" [ref=e14]: "0.62"
    - paragraph [ref=e15]: 原创青年脸型与发型试装，非 Leo 模型。Leo 尚未购买，购买前再确认；本页只打磨人物局部。
    - link "← 返回既有农场样板" [ref=e16] [cursor=pointer]:
      - /url: /?art=npr-sample
  - generic: STAND → WIND UP → CHOP → RECOVER · 局部审阅
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | 
  3  | const url='/?art=character-motion&model=prototype';
  4  | 
  5  | test('the local motion sample identifies its prototype and never starts exercise input',async({page})=>{
  6  |  const requests:string[]=[];page.on('request',r=>requests.push(r.url()));
  7  |  await page.goto(url);
  8  |  await expect(page.getByRole('heading',{name:'人物动作局部样片'})).toBeVisible();
  9  |  await expect(page.locator('#motionSource')).toContainText('非 Leo 原模型');
  10 |  await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
  11 |  await expect(page.locator('#motionCanvas')).toBeVisible();
  12 |  await expect(page.locator('#worldCanvas')).toHaveCount(0);
  13 |  expect(requests.filter(u=>/mediapipe|pose_landmarker|pose-worker/.test(u))).toEqual([]);
  14 |  expect(requests.filter(u=>!u.startsWith('http://127.0.0.1:4173')&&!u.startsWith('data:'))).toEqual([]);
  15 | });
  16 | 
  17 | test('pause freezes rendered bones; slow motion and replay remain usable',async({page})=>{
  18 |  await page.goto(url);await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
  19 |  await expect.poll(async()=>Number(await page.locator('#motionStage').getAttribute('data-time'))).toBeGreaterThan(.1);
  20 |  await page.getByRole('button',{name:'暂停'}).click();
  21 |  const time=await page.locator('#motionStage').getAttribute('data-time');
  22 |  const before=await page.locator('#motionCanvas').screenshot();
  23 |  await page.waitForTimeout(250);
  24 |  expect(await page.locator('#motionStage').getAttribute('data-time')).toBe(time);
> 25 |  expect((await page.locator('#motionCanvas').screenshot()).equals(before)).toBe(true);
     |                                                                            ^ Error: expect(received).toBe(expected) // Object.is equality
  26 |  await page.getByRole('button',{name:'慢速 0.5×'}).click();
  27 |  await expect(page.getByRole('button',{name:'慢速 0.5×'})).toHaveAttribute('aria-pressed','true');
  28 |  await page.getByRole('button',{name:'重播动作'}).click();
  29 |  await expect(page.locator('#motionPhase')).toHaveText('站立 · 呼吸与重心');
  30 |  await expect.poll(async()=>Number(await page.locator('#motionStage').getAttribute('data-time'))).toBeGreaterThan(.05);
  31 |  await page.getByRole('button',{name:'仅看站立'}).click();
  32 |  await page.waitForTimeout(250);await expect(page.locator('#motionPhase')).toHaveText('站立 · 呼吸与重心');
  33 | });
  34 | 
  35 | test('bone asset failure is visible and disables replay',async({page})=>{
  36 |  await page.route('**/assets/character-motion/tree-chopping.glb',r=>r.abort('failed'));
  37 |  await page.goto(url);await expect(page.getByRole('alert')).toContainText('动作素材加载失败');
  38 |  await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','failed');
  39 |  await expect(page.getByRole('button',{name:'重播动作'})).toBeDisabled();
  40 | });
  41 | 
  42 | test('face inspection changes the real camera without changing a paused pose or saved input preference',async({page})=>{
  43 |  await page.goto(url);await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
  44 |  await page.getByRole('slider',{name:'逐帧检视'}).evaluate((element:HTMLInputElement)=>{element.value='.8';element.dispatchEvent(new Event('input',{bubbles:true}));});
  45 |  await expect(page.locator('#motionStage')).toHaveAttribute('data-time','0.8000');
  46 |  const before=await page.locator('#motionCanvas').screenshot(),preference=await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'));
  47 |  const face=page.getByRole('button',{name:'面部特写',exact:true});await face.click();
  48 |  await expect(face).toHaveAttribute('aria-pressed','true');
  49 |  await expect(page.locator('#motionStage')).toHaveAttribute('data-view','face');
  50 |  expect((await page.locator('#motionCanvas').screenshot()).equals(before)).toBe(false);
  51 |  await expect(page.locator('#motionStage')).toHaveAttribute('data-time','0.8000');
  52 |  await face.click();await expect(page.locator('#motionStage')).toHaveAttribute('data-view','full');
  53 |  expect(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'))).toBe(preference);
  54 | });
  55 | 
  56 | test('switching to idle while paused redraws the bones immediately',async({page})=>{
  57 |  await page.goto(url);await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
  58 |  await page.getByRole('slider',{name:'逐帧检视'}).evaluate((element:HTMLInputElement)=>{element.value='3.77';element.dispatchEvent(new Event('input',{bubbles:true}));});
  59 |  await expect(page.locator('#motionStage')).toHaveAttribute('data-time','3.7700');await page.waitForTimeout(150);
  60 |  const before=await page.locator('#motionCanvas').screenshot();
  61 |  const paints=Number(await page.locator('#motionStage').getAttribute('data-paints'));
  62 |  await page.getByRole('button',{name:'仅看站立'}).click();
  63 |  await expect(page.locator('#motionPhase')).toHaveText('站立 · 呼吸与重心');
  64 |  await expect.poll(async()=>Number(await page.locator('#motionStage').getAttribute('data-paints'))).toBeGreaterThan(paints);
  65 |  expect((await page.locator('#motionCanvas').screenshot()).equals(before)).toBe(false);
  66 | });
  67 | 
  68 | test('the review timeline selects an exact paused pose without advancing a workout',async({page})=>{
  69 |  await page.goto(url);await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
  70 |  const timeline=page.getByRole('slider',{name:'逐帧检视'});await expect(timeline).toBeEnabled();
  71 |  await timeline.evaluate((element:HTMLInputElement)=>{element.value='3.77';element.dispatchEvent(new Event('input',{bubbles:true}));});
  72 |  await expect(page.locator('#motionStage')).toHaveAttribute('data-time','3.7700');
  73 |  await expect(page.locator('#motionPhase')).toHaveText('挥砍 · 下挥发力');
  74 |  await expect(page.getByRole('button',{name:'继续',exact:true})).toBeVisible();
  75 |  await page.waitForTimeout(180);await expect(page.locator('#motionStage')).toHaveAttribute('data-time','3.7700');
  76 | });
  77 | 
  78 | test('the original farm cannot receive clicks before its dynamic module has installed handlers',async({page})=>{
  79 |  await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
  80 |  let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
  81 |  await page.route('**/src/browser.ts',async route=>{await gate;await route.continue();});
  82 |  await page.goto('/',{waitUntil:'domcontentloaded'});
  83 |  try{await expect(page.locator('body')).toHaveAttribute('inert','');}finally{release();}
  84 |  await expect(page.locator('body')).not.toHaveAttribute('inert','');
  85 |  await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
  86 |  await page.locator('#cancelPlan').click();await expect(page.locator('#planModal')).toBeHidden();
  87 | });
  88 | 
  89 | test('entry module download failure is explicit and leaves a usable reload link',async({page})=>{
  90 |  await page.route('**/src/browser.ts',r=>r.abort('failed'));
  91 |  await page.goto('/');await expect(page.getByRole('alert')).toContainText('演示启动失败');
  92 |  await expect(page.getByRole('link',{name:'重新加载'})).toBeVisible();
  93 |  await expect(page.locator('body')).not.toHaveAttribute('inert','');
  94 | });
  95 | 
```