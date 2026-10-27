# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: animation-stop.spec.ts >> one click freezes the active world, teaching skeleton and outcomes, and explicit continue resumes
- Location: tests/e2e/animation-stop.spec.ts:11:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#worldCanvas')
Expected: "chop-down"
Received: "ready"
Timeout:  7000ms

Call log:
  - Expect "toHaveAttribute" locator('#worldCanvas') with timeout 7000ms
  - waiting for locator('#worldCanvas')
    - locator resolved to <div role="img" data-fallen="0" data-npc="idle" id="worldCanvas" data-rope="0.000" data-particles="8" data-assets="ready" data-action="ready" data-world-logs="0" data-render-scale="1" data-house="user-fbx" data-castle="user-fbx" data-inventory="0/0/0" data-player-mode="work" data-motion-revision="22" data-effects="impact,impact" data-renderer="Three.js r186" data-castle-triangles="60000" data-art="tidal-npr-sample-v2" data-cart-position="3.000,0.000" data-camera="1.415,3.525,11.331" aria-label="可旋转…>…</div>
    - unexpected value "ready"
    - locator resolved to <div role="img" data-fallen="0" data-npc="idle" id="worldCanvas" data-rope="0.000" data-particles="8" data-assets="ready" data-world-logs="0" data-render-scale="1" data-house="user-fbx" data-castle="user-fbx" data-inventory="0/0/0" data-player-mode="work" data-motion-revision="24" data-action="chop-return" data-renderer="Three.js r186" data-castle-triangles="60000" data-art="tidal-npr-sample-v2" data-cart-position="3.000,0.000" data-camera="1.415,3.525,11.331" aria-label="可旋转三维农场。地面0、车上0、到家0。" data…>…</div>
    - unexpected value "chop-return"
    - locator resolved to <div role="img" data-fallen="0" data-npc="idle" id="worldCanvas" data-rope="0.000" data-particles="8" data-assets="ready" data-world-logs="0" data-render-scale="1" data-house="user-fbx" data-castle="user-fbx" data-inventory="0/0/0" data-player-mode="work" data-motion-revision="27" data-action="chop-return" data-renderer="Three.js r186" data-castle-triangles="60000" data-art="tidal-npr-sample-v2" data-cart-position="3.000,0.000" data-camera="1.415,3.525,11.331" aria-label="可旋转三维农场。地面0、车上0、到家0。" data…>…</div>
    - unexpected value "chop-return"
    - locator resolved to <div role="img" data-fallen="0" data-npc="idle" id="worldCanvas" data-rope="0.000" data-particles="8" data-assets="ready" data-world-logs="0" data-render-scale="1" data-house="user-fbx" data-castle="user-fbx" data-inventory="0/0/0" data-player-mode="work" data-motion-revision="33" data-action="chop-return" data-renderer="Three.js r186" data-castle-triangles="60000" data-art="tidal-npr-sample-v2" data-cart-position="3.000,0.000" data-camera="1.415,3.525,11.331" aria-label="可旋转三维农场。地面0、车上0、到家0。" data…>…</div>
    - unexpected value "chop-return"
    - locator resolved to <div role="img" data-fallen="1" data-npc="idle" id="worldCanvas" data-rope="0.000" data-particles="8" data-assets="ready" data-world-logs="5" data-render-scale="1" data-house="user-fbx" data-castle="user-fbx" data-inventory="5/0/0" data-player-mode="work" data-motion-revision="40" data-action="chop-return" data-renderer="Three.js r186" data-castle-triangles="60000" data-art="tidal-npr-sample-v2" data-cart-position="3.000,0.000" data-camera="0.675,3.525,10.345" aria-label="可旋转三维农场。地面5、车上0、到家0。" data…>…</div>
    - unexpected value "chop-return"
    - locator resolved to <div role="img" data-fallen="2" data-npc="idle" id="worldCanvas" data-rope="0.000" data-particles="8" data-assets="ready" data-world-logs="10" data-render-scale="1" data-house="user-fbx" data-castle="user-fbx" data-inventory="10/0/0" data-player-mode="work" data-motion-revision="72" data-action="chop-return" data-renderer="Three.js r186" data-castle-triangles="60000" data-art="tidal-npr-sample-v2" data-camera="0.108,3.525,6.550" data-cart-position="3.000,0.000" aria-label="可旋转三维农场。地面10、车上0、到家0。" da…>…</div>
    - unexpected value "chop-return"
    - locator resolved to <div role="img" data-fallen="3" id="worldCanvas" data-npc="gather" data-rope="0.000" data-particles="0" data-assets="ready" data-action="ready" data-world-logs="15" data-render-scale="1" data-house="user-fbx" data-castle="user-fbx" data-inventory="15/0/0" data-player-mode="walk" data-effects="tree,tree" data-motion-revision="107" data-renderer="Three.js r186" data-castle-triangles="60000" data-art="tidal-npr-sample-v2" data-cart-position="3.000,0.000" data-hand="1.9542,0.8715,0.4687" data-camera="4…>…</div>
    - unexpected value "ready"
    - locator resolved to <div role="img" data-fallen="3" data-npc="idle" id="worldCanvas" data-rope="0.000" data-particles="0" data-assets="ready" data-world-logs="15" data-render-scale="1" data-house="user-fbx" data-castle="user-fbx" data-action="stand-up" data-inventory="14/1/0" data-player-mode="work" data-motion-revision="142" data-renderer="Three.js r186" data-castle-triangles="60000" data-art="tidal-npr-sample-v2" data-effects="tree,impact,log" data-camera="4.377,3.314,9.389" data-cart-position="0.000,0.000" aria-lab…>…</div>
    - unexpected value "stand-up"
    - locator resolved to <div role="img" data-fallen="3" data-npc="idle" id="worldCanvas" data-rope="0.000" data-particles="0" data-assets="ready" data-world-logs="15" data-render-scale="1" data-house="user-fbx" data-castle="user-fbx" data-inventory="9/6/0" data-player-mode="work" data-action="squat-down" data-motion-revision="172" data-renderer="Three.js r186" data-castle-triangles="60000" data-art="tidal-npr-sample-v2" data-camera="4.070,3.314,9.258" data-cart-position="0.000,0.000" aria-label="可旋转三维农场。地面9、车上6、到家0。" data…>…</div>
    - unexpected value "squat-down"
    - locator resolved to <div role="img" data-fallen="3" data-npc="idle" id="worldCanvas" data-rope="0.000" data-particles="0" data-assets="ready" data-action="ready" data-world-logs="15" data-render-scale="1" data-house="user-fbx" data-castle="user-fbx" data-inventory="4/11/0" data-player-mode="work" data-motion-revision="202" data-renderer="Three.js r186" data-castle-triangles="60000" data-art="tidal-npr-sample-v2" data-camera="4.070,3.314,9.258" data-cart-position="0.000,0.000" aria-label="可旋转三维农场。地面4、车上11、到家0。" data-ha…>…</div>
    - unexpected value "ready"
    - locator resolved to <div role="img" data-fallen="3" id="worldCanvas" data-npc="secure" data-rope="0.580" data-particles="0" data-assets="ready" data-action="ready" data-world-logs="15" data-render-scale="1" data-house="user-fbx" data-castle="user-fbx" data-inventory="0/15/0" data-player-mode="idle" data-motion-revision="227" data-renderer="Three.js r186" data-castle-triangles="60000" data-art="tidal-npr-sample-v2" data-effects="log,log,log,log" data-cart-position="0.000,0.000" data-camera="6.679,3.735,10.813" data-han…>…</div>
    - unexpected value "ready"
    - locator resolved to <div role="img" data-fallen="3" data-effects="" id="worldCanvas" data-npc="guide" data-rope="1.000" data-particles="0" data-assets="ready" data-action="ready" data-world-logs="15" data-render-scale="1" data-house="user-fbx" data-castle="user-fbx" data-inventory="0/15/0" data-player-mode="pull" data-motion-revision="247" data-renderer="Three.js r186" data-castle-triangles="60000" data-art="tidal-npr-sample-v2" data-cart-position="6.188,0.000" data-hand="7.2377,1.0400,0.0000" data-camera="9.349,3.735…>…</div>
    - unexpected value "ready"
    - locator resolved to <div role="img" data-fallen="3" data-effects="" id="worldCanvas" data-npc="guide" data-rope="1.000" data-particles="0" data-assets="ready" data-action="ready" data-world-logs="15" data-render-scale="1" data-house="user-fbx" data-castle="user-fbx" data-inventory="0/15/0" data-player-mode="pull" data-motion-revision="267" data-renderer="Three.js r186" data-castle-triangles="60000" data-art="tidal-npr-sample-v2" data-cart-position="21.557,0.000" data-hand="22.6069,1.0400,0.0000" data-camera="23.176,3.…>…</div>
    - unexpected value "ready"
    - locator resolved to <div role="img" data-fallen="3" data-effects="" id="worldCanvas" data-npc="guide" data-rope="1.000" data-particles="0" data-assets="ready" data-action="ready" data-world-logs="15" data-render-scale="1" data-house="user-fbx" data-castle="user-fbx" data-inventory="0/15/0" data-player-mode="pull" data-motion-revision="287" data-renderer="Three.js r186" data-castle-triangles="60000" data-art="tidal-npr-sample-v2" data-cart-position="36.942,0.000" data-hand="37.9915,1.0400,0.0000" data-camera="38.924,3.…>…</div>
    4 × unexpected value "ready"
      - locator resolved to <div role="img" data-fallen="3" data-effects="" id="worldCanvas" data-rope="1.000" data-particles="0" data-assets="ready" data-action="ready" data-npc="celebrate" data-world-logs="15" data-render-scale="1" data-house="user-fbx" data-castle="user-fbx" data-inventory="0/0/15" data-motion-revision="292" data-player-mode="celebrate" data-renderer="Three.js r186" data-castle-triangles="60000" data-art="tidal-npr-sample-v2" data-camera="47.765,3.525,9.981" data-cart-position="40.000,0.000" aria-label="可旋…>…</div>
    - unexpected value "ready"

```

```yaml
- img "可旋转三维农场。地面0、车上0、到家15。":
  - text: 用户人物/房屋 · 挥砍 / 装车 / 行走动作
  - link "原动作对照":
    - /url: /?art=npr-sample&model=prototype
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
> 13 |  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-action','chop-down');
     |                                             ^ Error: expect(locator).toHaveAttribute(expected) failed
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
  62 |  await page.locator('#tutorialOpen').click();await page.locator('#tutorialAnimationStop').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
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