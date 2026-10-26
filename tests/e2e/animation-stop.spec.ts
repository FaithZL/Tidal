import {test,expect,type Page} from '@playwright/test';
import {installPoseFixture,prepareCamera} from '../helpers/browserPoseFixture.js';

test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
const observe=(page:Page)=>page.evaluate(()=>{
 const world=document.getElementById('worldCanvas')!,guide=document.getElementById('movementGuide')!;
 return {phase:document.getElementById('app')!.dataset.phase,chop:document.getElementById('chopValue')!.textContent,load:document.getElementById('loadValue')!.textContent,carry:document.getElementById('carryValue')!.textContent,countdown:document.getElementById('countdown')!.textContent,inventory:world.dataset.inventory,hand:world.dataset.hand,foot:world.dataset.footPose,blade:world.dataset.blade,cart:world.dataset.cartPosition,guideTime:guide.dataset.timeMs,joints:Array.from(guide.querySelectorAll('[data-joint]')).map(node=>[node.getAttribute('cx'),node.getAttribute('cy')])};
});
async function enter(page:Page,automatic=true){await page.addInitScript(value=>localStorage.setItem('tidal.demo.enabled',String(value)),automatic);await page.goto('/?e2e=1&art=npr-sample');}

test('one click freezes the active world, teaching skeleton and outcomes, and explicit continue resumes',async({page})=>{
 await enter(page);await expect(page.locator('#statusTag')).toHaveText('训练中');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-action','chop-down');
 await expect(page.locator('#animationStop')).toBeVisible();await page.locator('#animationStop').click();await expect(page.locator('#animationStop')).toHaveText('继续播放');
 await expect(page.locator('#statusTag')).toHaveText('已暂停');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');
 const frozen=await observe(page);await page.waitForTimeout(450);expect(await observe(page)).toEqual(frozen);
 await page.keyboard.press('p');await expect(page.locator('#statusTag')).toHaveText('已暂停');expect(await observe(page)).toEqual(frozen);
 await page.keyboard.press('Shift+P');await expect(page.locator('#animationStop')).toHaveText('停止动画');await expect(page.locator('#statusTag')).toHaveText('训练中');
 await expect.poll(async()=>page.locator('#chopValue').textContent()).not.toBe(frozen.chop);
 await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});await expect(page.locator('#rewardLogs')).toHaveText('15');
});

test('stopping in teaching preserves a selected pose and cannot be bypassed by local playback or replay',async({page})=>{
 await enter(page,false);await page.locator('#planTutorial').click();
 await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','true');await page.locator('#tutorialAnimationStop').click();
 const time=await page.locator('#tutorialModal').getAttribute('data-time-ms');await page.waitForTimeout(300);await expect(page.locator('#tutorialModal')).toHaveAttribute('data-time-ms',time!);
 await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','false');await expect(page.locator('#tutorialPlay')).toBeDisabled();await expect(page.locator('#tutorialReplay')).toBeDisabled();
 await page.locator('#tutorialStepList button').nth(2).click();await expect(page.locator('#tutorialModal')).toHaveAttribute('data-step','2');await page.locator('#tutorialAnimationStop').click();
 await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','false');await page.locator('#tutorialPlay').click();await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','true');
 await page.locator('#tutorialClose').click();await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();
 await page.locator('#setupAnimationStop').click();const a=await page.locator('#demoSetupCanvas').evaluate((canvas:HTMLCanvasElement)=>canvas.toDataURL());await page.waitForTimeout(850);
 expect(await page.locator('#demoSetupCanvas').evaluate((canvas:HTMLCanvasElement)=>canvas.toDataURL())).toBe(a);await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');
 await page.keyboard.press('Shift+P');await expect(page.locator('#setupAnimationStop')).toHaveText('停止动画');
 await expect.poll(()=>page.locator('#demoSetupCanvas').evaluate((canvas:HTMLCanvasElement)=>canvas.toDataURL())).not.toBe(a);
});

test('stopping before assets prevents hidden autoplay and preserves the saved preference',async({page})=>{
 let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/assets/user-models/castle.fbx',async route=>{await pending;await route.continue();});
 await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));await page.goto('/?e2e=1&art=npr-sample',{waitUntil:'domcontentloaded'});
 try{await page.locator('#animationStop').click();}finally{release();}
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');await page.waitForTimeout(300);await expect(page.locator('#app')).toHaveAttribute('data-phase','home');
 expect(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'))).toBe('true');await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
 await page.locator('#animationStop').click();await page.locator('#resetBtn').click();await page.waitForTimeout(300);await expect(page.locator('#app')).toHaveAttribute('data-phase','home');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');
 await page.locator('#animationStop').click();await page.waitForTimeout(300);await expect(page.locator('#app')).toHaveAttribute('data-phase','home');
 await page.locator('#acceptPlan').click();await page.locator('#setupAnimationStop').click();await page.locator('#beginDemo').click();
 await expect(page.locator('#statusTag')).toHaveText('已暂停');await expect(page.locator('#app')).toHaveAttribute('data-phase','countdown');
 const countdown=await page.locator('#countdown').textContent();await page.waitForTimeout(250);await expect(page.locator('#countdown')).toHaveText(countdown!);await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
});

test('continue preserves an existing user pause and a visibility pause',async({page})=>{
 await enter(page);await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#pauseBtn').click();
 await page.locator('#animationStop').click();await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
 await page.locator('#pauseBtn').click();await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#animationStop').click();
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
 const frozen=await observe(page);await page.waitForTimeout(300);expect(await observe(page)).toEqual(frozen);
});

test('opening teaching or exit after stop transfers the user pause and never resumes training behind a dialog',async({page})=>{
 await enter(page);await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#animationStop').click();
 await page.locator('#tutorialOpen').click();await page.locator('#tutorialAnimationStop').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
 const before=await observe(page);await page.waitForTimeout(350);expect(await observe(page)).toEqual(before);await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','true');
 await page.locator('#tutorialClose').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');await page.locator('#pauseBtn').click();
 await page.locator('#animationStop').click();await page.keyboard.press('Escape');await expect(page.locator('#exitModal')).toBeVisible();await page.keyboard.press('Shift+P');
 await expect(page.locator('#statusTag')).toHaveText('已暂停');await page.locator('#cancelExit').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
 await page.locator('#pauseBtn').click();await page.locator('#animationStop').click();await page.locator('#demoToggle').click();await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
});

test('camera monitoring continues during animation stop and loss still requires preparation',async({page})=>{
 test.setTimeout(90000);await installPoseFixture(page);await enter(page,false);await prepareCamera(page);await page.locator('#beginCamera').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
 const resources=await page.evaluate(()=>({tracks:window.poseFixture.tracks.map(track=>track.id),workers:window.poseFixture.workers}));await page.locator('#animationStop').click();
 expect(resources.tracks).toHaveLength(1);expect(resources.workers).toBe(1);
 expect(await page.evaluate(()=>({tracks:window.poseFixture.tracks.map(track=>track.id),workers:window.poseFixture.workers}))).toEqual(resources);
 await page.evaluate(()=>{window.poseFixture.low=true;});await expect(page.locator('#setupModal')).toBeVisible({timeout:10000});await expect(page.locator('#beginCamera')).toBeDisabled();
 await page.locator('#setupAnimationStop').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#chopValue')).toHaveText('0/15');
});
