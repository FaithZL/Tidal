# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: animation-stop.spec.ts >> opening teaching or exit after stop transfers the user pause and never resumes training behind a dialog
- Location: tests/e2e/animation-stop.spec.ts:60:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('#statusTag')
Expected: "已暂停"
Received: "已完成"
Timeout:  7000ms

Call log:
  - Expect "toHaveText" locator('#statusTag') with timeout 7000ms
  - waiting for locator('#statusTag')
    6 × locator resolved to <span id="statusTag" class="subtag">训练中</span>
      - unexpected value "训练中"
    - locator resolved to <span id="statusTag" class="subtag">休息时间</span>
    - unexpected value "休息时间"
    3 × locator resolved to <span id="statusTag" class="subtag">训练中</span>
      - unexpected value "训练中"
    - locator resolved to <span id="statusTag" class="subtag">倒计时</span>
    - unexpected value "倒计时"
    2 × locator resolved to <span id="statusTag" class="subtag">训练中</span>
      - unexpected value "训练中"
    5 × locator resolved to <span id="statusTag" class="subtag">已完成</span>
      - unexpected value "已完成"

```

```yaml
- text: 已完成
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
  13 |  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-action','chop-down');
  14 |  await expect(page.locator('#animationStop')).toBeVisible();await page.locator('#animationStop').click();await expect(page.locator('#animationStop')).toHaveText('继续播放');
  15 |  await expect(page.locator('#statusTag')).toHaveText('已暂停');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');
  16 |  const frozen=await observe(page);await page.waitForTimeout(450);expect(await observe(page)).toEqual(frozen);
  17 |  await page.keyboard.press('p');await expect(page.locator('#statusTag')).toHaveText('已暂停');expect(await observe(page)).toEqual(frozen);
  18 |  await page.keyboard.press('Shift+P');await expect(page.locator('#animationStop')).toHaveText('停止动画');await expect(page.locator('#statusTag')).toHaveText('训练中');
  19 |  await expect.poll(async()=>page.locator('#chopValue').textContent()).not.toBe(frozen.chop);
  20 |  await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});await expect(page.locator('#rewardLogs')).toHaveText('15');
  21 | });
  22 | 
  23 | test('stopping in teaching preserves a selected pose and cannot be bypassed by local playback or replay',async({page})=>{
  24 |  await enter(page,false);await page.locator('#planTutorial').click();
  25 |  await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','true');await page.locator('#tutorialAnimationStop').click();
  26 |  const time=await page.locator('#tutorialModal').getAttribute('data-time-ms');await page.waitForTimeout(300);await expect(page.locator('#tutorialModal')).toHaveAttribute('data-time-ms',time!);
  27 |  await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','false');await expect(page.locator('#tutorialPlay')).toBeDisabled();await expect(page.locator('#tutorialReplay')).toBeDisabled();
  28 |  await page.locator('#tutorialStepList button').nth(2).click();await expect(page.locator('#tutorialModal')).toHaveAttribute('data-step','2');await page.locator('#tutorialAnimationStop').click();
  29 |  await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','false');await page.locator('#tutorialPlay').click();await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','true');
  30 |  await page.locator('#tutorialClose').click();await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();
  31 |  await page.locator('#setupAnimationStop').click();const a=await page.locator('#demoSetupCanvas').evaluate((canvas:HTMLCanvasElement)=>canvas.toDataURL());await page.waitForTimeout(850);
  32 |  expect(await page.locator('#demoSetupCanvas').evaluate((canvas:HTMLCanvasElement)=>canvas.toDataURL())).toBe(a);await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');
  33 |  await page.keyboard.press('Shift+P');await expect(page.locator('#setupAnimationStop')).toHaveText('停止动画');
  34 |  await expect.poll(()=>page.locator('#demoSetupCanvas').evaluate((canvas:HTMLCanvasElement)=>canvas.toDataURL())).not.toBe(a);
  35 | });
  36 | 
  37 | test('stopping before assets prevents hidden autoplay and preserves the saved preference',async({page})=>{
  38 |  let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});
  39 |  await page.route('**/assets/user-models/castle.fbx',async route=>{await pending;await route.continue();});
  40 |  await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));await page.goto('/?e2e=1&art=npr-sample',{waitUntil:'domcontentloaded'});
  41 |  try{await page.locator('#animationStop').click();}finally{release();}
  42 |  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');await page.waitForTimeout(300);await expect(page.locator('#app')).toHaveAttribute('data-phase','home');
  43 |  expect(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'))).toBe('true');await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  44 |  await page.locator('#animationStop').click();await page.locator('#resetBtn').click();await page.waitForTimeout(300);await expect(page.locator('#app')).toHaveAttribute('data-phase','home');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');
  45 |  await page.locator('#animationStop').click();await page.waitForTimeout(300);await expect(page.locator('#app')).toHaveAttribute('data-phase','home');
  46 |  await page.locator('#acceptPlan').click();await page.locator('#setupAnimationStop').click();await page.locator('#beginDemo').click();
  47 |  await expect(page.locator('#statusTag')).toHaveText('已暂停');await expect(page.locator('#app')).toHaveAttribute('data-phase','countdown');
  48 |  const countdown=await page.locator('#countdown').textContent();await page.waitForTimeout(250);await expect(page.locator('#countdown')).toHaveText(countdown!);await expect(page.locator('#chopValue')).toHaveText('0/15');
  49 |  await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  50 | });
  51 | 
  52 | test('continue preserves an existing user pause and a visibility pause',async({page})=>{
  53 |  await enter(page);await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#pauseBtn').click();
  54 |  await page.locator('#animationStop').click();await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  55 |  await page.locator('#pauseBtn').click();await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#animationStop').click();
  56 |  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  57 |  const frozen=await observe(page);await page.waitForTimeout(300);expect(await observe(page)).toEqual(frozen);
  58 | });
  59 | 
  60 | test('opening teaching or exit after stop transfers the user pause and never resumes training behind a dialog',async({page})=>{
  61 |  await enter(page);await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#animationStop').click();
> 62 |  await page.locator('#tutorialOpen').click();await page.locator('#tutorialAnimationStop').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
     |                                                                                                                                            ^ Error: expect(locator).toHaveText(expected) failed
  63 |  const before=await observe(page);await page.waitForTimeout(350);expect(await observe(page)).toEqual(before);await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','true');
  64 |  await page.locator('#tutorialClose').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');await page.locator('#pauseBtn').click();
  65 |  await page.locator('#animationStop').click();await page.keyboard.press('Escape');await expect(page.locator('#exitModal')).toBeVisible();await page.keyboard.press('Shift+P');
  66 |  await expect(page.locator('#statusTag')).toHaveText('已暂停');await page.locator('#cancelExit').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  67 |  await page.locator('#pauseBtn').click();await page.locator('#animationStop').click();await page.locator('#demoToggle').click();await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  68 | });
  69 | 
  70 | test('camera monitoring continues during animation stop and loss still requires preparation',async({page})=>{
  71 |  test.setTimeout(90000);await installPoseFixture(page);await enter(page,false);await prepareCamera(page);await page.locator('#beginCamera').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  72 |  const resources=await page.evaluate(()=>({tracks:window.poseFixture.tracks.map(track=>track.id),workers:window.poseFixture.workers}));await page.locator('#animationStop').click();
  73 |  expect(resources.tracks).toHaveLength(1);expect(resources.workers).toBe(1);
  74 |  expect(await page.evaluate(()=>({tracks:window.poseFixture.tracks.map(track=>track.id),workers:window.poseFixture.workers}))).toEqual(resources);
  75 |  await page.evaluate(()=>{window.poseFixture.low=true;});await expect(page.locator('#setupModal')).toBeVisible({timeout:10000});await expect(page.locator('#beginCamera')).toBeDisabled();
  76 |  await page.locator('#setupAnimationStop').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#chopValue')).toHaveText('0/15');
  77 | });
  78 | 
```