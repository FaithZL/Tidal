# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: exercise-tutorial.spec.ts >> a short background interval with no hidden animation frame never fills tutorial playback
- Location: tests/e2e/exercise-tutorial.spec.ts:73:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "0.00"
Received: "150.00"
```

# Test source

```ts
  1   | import {test as base,expect,type Page} from '@playwright/test';
  2   | import {mkdir,writeFile,readFile} from 'node:fs/promises';
  3   | import {installPoseFixture,prepareCamera,setPose,completeSyntheticChop} from '../helpers/browserPoseFixture.js';
  4   | 
  5   | const test=base.extend<{automaticDemo:boolean}>({
  6   |  automaticDemo:[false,{option:true}],
  7   |  page:async({page,automaticDemo},use)=>{await page.addInitScript(enabled=>localStorage.setItem('tidal.demo.enabled',String(enabled)),automaticDemo);await use(page);},
  8   | });
  9   | const output='artifacts/qa/exercise-tutorial-20261026';
  10  | const dialog=(page:Page)=>page.getByRole('dialog',{name:'动作教学',exact:true});
  11  | const joints=(page:Page)=>page.locator('#tutorialFigure circle[data-joint]').evaluateAll(nodes=>nodes.map(node=>[node.getAttribute('data-joint'),node.getAttribute('cx'),node.getAttribute('cy')]));
  12  | async function progress(page:Page){return {chop:await page.locator('#chopValue').textContent(),load:await page.locator('#loadValue').textContent(),carry:await page.locator('#carryValue').textContent(),inventory:await page.locator('#worldCanvas').getAttribute('data-inventory'),phase:await page.locator('#app').getAttribute('data-phase'),countdown:await page.locator('#countdown').textContent()};}
  13  | 
  14  | test.use({channel:'chromium',baseURL:'http://127.0.0.1:4174',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  15  | test('the pre-training tutorial explains all three movements without starting a session or camera',async({page})=>{
  16  |  await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new Error('Tutorial must not request a camera');};});
  17  |  await page.goto('/?e2e=1&art=npr-sample');
  18  |  await expect(page.getByRole('button',{name:'先看动作教学',exact:true})).toBeVisible();
  19  |  await page.getByRole('button',{name:'先看动作教学',exact:true}).click();
  20  |  const dialog=page.getByRole('dialog',{name:'动作教学',exact:true});await expect(dialog).toBeVisible();
  21  |  await expect(page.locator('#app')).toHaveAttribute('data-phase','home');
  22  |  for(const [name,count] of [['挥砍',4],['装车',5],['拉车持姿',3]] as const){await dialog.getByRole('button',{name,exact:true}).click();await expect(dialog.locator('#tutorialStepList button')).toHaveCount(count);await expect(dialog.locator('#tutorialTips li')).not.toHaveCount(0);}
  23  |  await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#loadValue')).toHaveText('0/15');
  24  |  await dialog.getByRole('button',{name:'关闭教学',exact:true}).click();await expect(page.locator('#planModal')).toBeVisible();
  25  | });
  26  | 
  27  | test('the preparation page returns unchanged and teaching does not leave a hidden setup pause',async({page})=>{
  28  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#acceptPlan').click();await page.locator('#setupTutorial').click();
  29  |  await expect(dialog(page)).toBeVisible();await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');
  30  |  await page.keyboard.press('Escape');await expect(dialog(page)).toBeHidden();await expect(page.locator('#setupModal')).toBeVisible();await expect(page.locator('#setupTutorial')).toBeFocused();
  31  |  await page.locator('#beginDemo').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  32  |  await page.locator('#pauseBtn').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  33  | });
  34  | 
  35  | test('step selection changes real joints; pause slow motion and replay control only the teaching clock',async({page})=>{
  36  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#planTutorial').click();const steps=page.locator('#tutorialStepList button');
  37  |  await steps.nth(1).click();const raised=await joints(page);await steps.nth(2).click();expect(await joints(page)).not.toEqual(raised);
  38  |  await expect(page.locator('#tutorialFigure circle[data-joint]')).toHaveCount(14);await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','false');
  39  |  const frozen=await joints(page),time=await page.locator('#tutorialModal').getAttribute('data-time-ms');await page.waitForTimeout(250);expect(await joints(page)).toEqual(frozen);await expect(page.locator('#tutorialModal')).toHaveAttribute('data-time-ms',time!);
  40  |  const interval=async(speed:string)=>{
  41  |   await steps.nth(1).click();await page.locator('#tutorialSpeed').selectOption(speed);await page.locator('#tutorialPlay').click();
  42  |   const start=Number(await page.locator('#tutorialModal').getAttribute('data-time-ms'));await page.waitForTimeout(340);await page.locator('#tutorialPlay').click();
  43  |   return Number(await page.locator('#tutorialModal').getAttribute('data-time-ms'))-start;
  44  |  };
  45  |  const normal=await interval('1'),slow=await interval('0.5');expect(normal).toBeGreaterThan(200);expect(slow).toBeGreaterThan(70);expect(slow).toBeLessThan(normal*.75);
  46  |  await page.locator('#tutorialSpeed').selectOption('0.25');await expect(page.locator('#tutorialModal')).toHaveAttribute('data-speed','0.25');
  47  |  await page.locator('#tutorialReplay').click();await expect(page.locator('#tutorialModal')).toHaveAttribute('data-step','0');await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','true');
  48  |  await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/0');
  49  |  await mkdir(output,{recursive:true});await writeFile(`${output}/clock-observation.json`,JSON.stringify({normalMs:normal,halfSpeedMs:slow,input:'Independent tutorial clock; training never started'},null,2));
  50  | });
  51  | 
  52  | test('reopening under reduced motion initializes the selected step and traps focus on a narrow screen',async({page})=>{
  53  |  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});await page.goto('/?e2e=1&art=npr-sample');
  54  |  for(let i=0;i<2;i++){
  55  |   await page.locator('#planTutorial').click();await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','false');await expect(page.locator('#tutorialStepList button[aria-current="step"]')).toHaveCount(1);
  56  |   await page.locator('#tutorialClose').focus();await page.keyboard.press('Shift+Tab');await expect(page.locator('#tutorialSpeed')).toBeFocused();await page.keyboard.press('Tab');await expect(page.locator('#tutorialClose')).toBeFocused();
  57  |   await page.keyboard.press('Escape');await expect(page.locator('#planTutorial')).toBeFocused();
  58  |  }
  59  |  await page.locator('#planTutorial').click();await page.locator('#tutorialTabs button[data-task="load"]').click();await page.locator('#tutorialStepList button').nth(1).click();
  60  |  await page.locator('#tutorialSpeed').scrollIntoViewIfNeeded();await expect(page.locator('#tutorialSpeed')).toBeVisible();
  61  |  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  62  |  expect(await page.locator('#tutorialFigure').evaluate(element=>element.getBoundingClientRect().width)).toBeGreaterThan(250);
  63  |  await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/tutorial-mobile.png`,fullPage:true});
  64  | });
  65  | 
  66  | test('playing a selected final step begins that step instead of replaying the entire lesson',async({page})=>{
  67  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#planTutorial').click();await page.locator('#tutorialTabs button[data-task="carry"]').click();
  68  |  await page.locator('#tutorialStepList button').last().click();await expect(page.locator('#tutorialModal')).toHaveAttribute('data-step','2');await page.locator('#tutorialPlay').click();
  69  |  expect(await page.locator('#tutorialModal').getAttribute('data-step')).toBe('2');await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','true');
  70  |  expect(Number(await page.locator('#tutorialModal').getAttribute('data-time-ms'))).toBeGreaterThanOrEqual(4000);
  71  | });
  72  | 
  73  | test('a short background interval with no hidden animation frame never fills tutorial playback',async({page})=>{
  74  |  // Exercise the real panel with a legal browser schedule that emits no hidden
  75  |  // rAF. A normal wall-clock test can miss this when a long GPU frame is dropped.
  76  |  const html=await readFile('index.html','utf8'),markup=html.slice(html.indexOf('<div id="tutorialModal"'),html.indexOf('<script type="module" src="/src/entry.ts"'));
  77  |  await page.route('**/tutorial-frame-fixture',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><body>${markup}</body>`}));
  78  |  await page.goto('/tutorial-frame-fixture');
  79  |  const observation=await page.evaluate(async()=>{
  80  |   const callbacks:FrameRequestCallback[]=[];let hidden=false;
  81  |   window.requestAnimationFrame=callback=>{callbacks.push(callback);return callbacks.length;};window.cancelAnimationFrame=()=>{};
  82  |   Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
  83  |   const modulePath='/src/ui/exerciseTutorialPanel.ts',module=await import(modulePath);
  84  |   const root=document.getElementById('tutorialModal')!,panel=new module.ExerciseTutorialPanel(root,{onOpen(){},onClose(){return undefined;}});
  85  |   panel.open('chop');callbacks.shift()!(1000);const before=root.dataset.timeMs;
  86  |   hidden=true;document.dispatchEvent(new Event('visibilitychange'));
  87  |   hidden=false;document.dispatchEvent(new Event('visibilitychange'));
  88  |   callbacks.shift()!(1150);const after=root.dataset.timeMs;panel.dispose();return {before,after};
  89  |  });
> 90  |  expect(observation.after).toBe(observation.before);
      |                            ^ Error: expect(received).toBe(expected) // Object.is equality
  91  | });
  92  | 
  93  | test.describe('automatic training',()=>{
  94  |  test.use({automaticDemo:true});
  95  |  test('opening before delayed assets suppresses behind-dialog autoplay without changing the preference',async({page})=>{
  96  |   let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
  97  |   await page.route('**/assets/user-models/castle.fbx',async route=>{await gate;await route.continue();});
  98  |   await page.goto('/?e2e=1&art=npr-sample',{waitUntil:'domcontentloaded'});
  99  |   try{await page.locator('#tutorialOpen').click();await expect(dialog(page)).toBeVisible();await page.locator('#tutorialClose').click();}finally{release();}
  100 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');await page.waitForTimeout(350);
  101 |   await expect(page.locator('#app')).toHaveAttribute('data-phase','home');await expect(page.locator('#chopValue')).toHaveText('0/15');expect(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'))).toBe('true');
  102 |  });
  103 |  test('replay pauses automatic training and Space P Escape cannot continue or reset it',async({page})=>{
  104 |   await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#tutorialOpen').click();
  105 |   await expect(dialog(page)).toBeVisible();await expect(page.locator('#statusTag')).toHaveText('已暂停');const before=await progress(page);
  106 |   await page.locator('#tutorialReplay').focus();await page.keyboard.press('Space');await page.keyboard.press('KeyP');await page.waitForTimeout(400);expect(await progress(page)).toEqual(before);
  107 |   await page.keyboard.press('Escape');await expect(dialog(page)).toBeHidden();await expect(page.locator('#exitModal')).toBeHidden();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  108 |   await page.waitForTimeout(300);expect(await progress(page)).toEqual(before);await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});await expect(page.locator('#rewardLogs')).toHaveText('15');
  109 |  });
  110 |  test('opening during carry freezes effective hold time and does not fill the teaching interval on resume',async({page})=>{
  111 |   await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#missionTitle')).toHaveText('推车返回农场',{timeout:25000});await expect(page.locator('#statusTag')).toHaveText('训练中');
  112 |   await expect.poll(async()=>parseFloat((await page.locator('#carryValue').textContent())??'0')).toBeGreaterThan(.1);await page.locator('#tutorialOpen').click();
  113 |   await expect(page.locator('#statusTag')).toHaveText('已暂停');const before=await progress(page);await page.waitForTimeout(700);expect(await progress(page)).toEqual(before);
  114 |   await page.locator('#tutorialClose').click();await page.waitForTimeout(250);expect(await progress(page)).toEqual(before);await page.locator('#pauseBtn').click();
  115 |   await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
  116 |  });
  117 | });
  118 | 
  119 | test.describe('camera integration with synthetic test frames',()=>{
  120 |  test.setTimeout(90000);
  121 |  async function startCamera(page:Page){
  122 |   await installPoseFixture(page);await page.goto('/?e2e=1&art=npr-sample');await prepareCamera(page);await page.locator('#beginCamera').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  123 |  }
  124 |  test('replay keeps the same video tracks and worker and a partial chop cannot become a completed rep',async({page})=>{
  125 |   await startCamera(page);await setPose(page,'raised',0);await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await setPose(page,'down',0);await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');
  126 |   const resources=await page.evaluate(()=>({ids:window.poseFixture.tracks.map(track=>track.id),workers:window.poseFixture.workers,max:window.poseFixture.maxWorkers}));
  127 |   await page.locator('#tutorialOpen').click();await expect(dialog(page)).toBeVisible();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  128 |   await page.locator('#tutorialTabs button[data-task="carry"]').click();await page.waitForTimeout(400);await expect(page.locator('#chopValue')).toHaveText('0/15');
  129 |   expect(await page.evaluate(()=>({ids:window.poseFixture.tracks.map(track=>track.id),workers:window.poseFixture.workers,max:window.poseFixture.maxWorkers}))).toEqual(resources);
  130 |   expect(await page.evaluate(()=>window.poseFixture.tracks.every(track=>track.readyState==='live'))).toBe(true);
  131 |   await page.locator('#tutorialClose').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');await page.locator('#pauseBtn').click();
  132 |   await setPose(page,'down',500);await expect(page.locator('#chopValue')).toHaveText('0/15');await completeSyntheticChop(page,1);await expect(page.locator('#chopValue')).toHaveText('1/15');
  133 |  });
  134 |  test('tracking loss while replaying still requires preparation after teaching closes',async({page})=>{
  135 |   await startCamera(page);await page.locator('#tutorialOpen').click();await page.evaluate(()=>{window.poseFixture.low=true;});
  136 |   await expect(page.locator('#beginCamera')).toBeDisabled({timeout:10000});await expect(dialog(page)).toBeVisible();
  137 |   await page.locator('#tutorialClose').click();await expect(page.locator('#setupModal')).toBeVisible();await expect(page.locator('#setupTutorial')).toBeFocused();
  138 |   await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  139 |   await mkdir(output,{recursive:true});await writeFile(`${output}/synthetic-camera-boundary.json`,JSON.stringify({input:'Fake video and authored pose landmarks; not physical camera',workers:await page.evaluate(()=>window.poseFixture.maxWorkers),result:'Preparation remains required; no simulated fallback'},null,2));
  140 |  });
  141 | });
  142 | 
```