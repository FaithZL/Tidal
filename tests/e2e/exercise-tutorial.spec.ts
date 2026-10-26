import {test as base,expect,type Page} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {installPoseFixture,prepareCamera,setPose,completeSyntheticChop} from '../helpers/browserPoseFixture.js';

const test=base.extend<{automaticDemo:boolean}>({
 automaticDemo:[false,{option:true}],
 page:async({page,automaticDemo},use)=>{await page.addInitScript(enabled=>localStorage.setItem('tidal.demo.enabled',String(enabled)),automaticDemo);await use(page);},
});
const output='artifacts/qa/exercise-tutorial-20261026';
declare global{interface Window{tutorialMediaCalls:number}}
const dialog=(page:Page)=>page.getByRole('dialog',{name:'动作教学',exact:true});
const joints=(page:Page)=>page.locator('#tutorialFigure circle[data-joint]').evaluateAll(nodes=>nodes.map(node=>[node.getAttribute('data-joint'),node.getAttribute('cx'),node.getAttribute('cy')]));
async function progress(page:Page){return {chop:await page.locator('#chopValue').textContent(),load:await page.locator('#loadValue').textContent(),carry:await page.locator('#carryValue').textContent(),inventory:await page.locator('#worldCanvas').getAttribute('data-inventory'),phase:await page.locator('#app').getAttribute('data-phase'),countdown:await page.locator('#countdown').textContent()};}

test.use({channel:'chromium',baseURL:'http://127.0.0.1:4174',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
test('the pre-training tutorial explains all three movements without starting a session or camera',async({page})=>{
 await page.addInitScript(()=>{window.tutorialMediaCalls=0;navigator.mediaDevices.getUserMedia=async()=>{window.tutorialMediaCalls++;throw new Error('Tutorial must not request a camera');};});
 await page.goto('/?e2e=1&art=npr-sample');
 await expect(page.getByRole('button',{name:'先看动作教学',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'先看动作教学',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'动作教学',exact:true});await expect(dialog).toBeVisible();
 await expect(page.locator('#app')).toHaveAttribute('data-phase','home');
 for(const [name,count] of [['挥砍',4],['装车',5],['拉车持姿',3]] as const){await dialog.getByRole('button',{name,exact:true}).click();await expect(dialog.locator('#tutorialStepList button')).toHaveCount(count);await expect(dialog.locator('#tutorialTips li')).not.toHaveCount(0);}
 await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#loadValue')).toHaveText('0/15');
 await dialog.getByRole('button',{name:'关闭教学',exact:true}).click();await expect(page.locator('#planModal')).toBeVisible();
 expect(await page.evaluate(()=>window.tutorialMediaCalls)).toBe(0);await expect(page.locator('#worldCanvas canvas')).toHaveCount(1);
});

test('the preparation page returns unchanged and teaching does not leave a hidden setup pause',async({page})=>{
 await page.goto('/?e2e=1&art=npr-sample');await page.locator('#acceptPlan').click();await page.locator('#setupTutorial').click();
 await expect(dialog(page)).toBeVisible();await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');
 await page.keyboard.press('Escape');await expect(dialog(page)).toBeHidden();await expect(page.locator('#setupModal')).toBeVisible();await expect(page.locator('#setupTutorial')).toBeFocused();
 await page.locator('#beginDemo').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
 await page.locator('#pauseBtn').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
});

test('step selection changes real joints; pause slow motion and replay control only the teaching clock',async({page})=>{
 await page.goto('/?e2e=1&art=npr-sample');await page.locator('#planTutorial').click();const steps=page.locator('#tutorialStepList button');
 await steps.nth(1).click();const raised=await joints(page);await steps.nth(2).click();expect(await joints(page)).not.toEqual(raised);
 await expect(page.locator('#tutorialFigure circle[data-joint]')).toHaveCount(14);await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','false');
 const frozen=await joints(page),time=await page.locator('#tutorialModal').getAttribute('data-time-ms');await page.waitForTimeout(250);expect(await joints(page)).toEqual(frozen);await expect(page.locator('#tutorialModal')).toHaveAttribute('data-time-ms',time!);
 const interval=async(speed:string)=>{
  await steps.nth(1).click();await page.locator('#tutorialSpeed').selectOption(speed);await page.locator('#tutorialPlay').click();
  const start=Number(await page.locator('#tutorialModal').getAttribute('data-time-ms'));await page.waitForTimeout(340);await page.locator('#tutorialPlay').click();
  return Number(await page.locator('#tutorialModal').getAttribute('data-time-ms'))-start;
 };
 const normal=await interval('1'),slow=await interval('0.5');expect(normal).toBeGreaterThan(200);expect(slow).toBeGreaterThan(70);expect(slow).toBeLessThan(normal*.75);
 await page.locator('#tutorialSpeed').selectOption('0.25');await expect(page.locator('#tutorialModal')).toHaveAttribute('data-speed','0.25');
 await page.locator('#tutorialReplay').click();await expect(page.locator('#tutorialModal')).toHaveAttribute('data-step','0');await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','true');
 await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/0');
 await mkdir(output,{recursive:true});await writeFile(`${output}/clock-observation.json`,JSON.stringify({normalMs:normal,halfSpeedMs:slow,input:'Independent tutorial clock; training never started'},null,2));
});

test('reopening under reduced motion initializes the selected step and traps focus on a narrow screen',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});await page.goto('/?e2e=1&art=npr-sample');
 for(let i=0;i<2;i++){
  await page.locator('#planTutorial').click();await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','false');await expect(page.locator('#tutorialStepList button[aria-current="step"]')).toHaveCount(1);
  await page.locator('#tutorialClose').focus();await page.keyboard.press('Shift+Tab');await expect(page.locator('#tutorialSpeed')).toBeFocused();await page.keyboard.press('Tab');await expect(page.locator('#tutorialClose')).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('#planTutorial')).toBeFocused();
 }
 await page.locator('#planTutorial').click();await page.locator('#tutorialTabs button[data-task="load"]').click();await page.locator('#tutorialStepList button').nth(1).click();
 await page.locator('#tutorialSpeed').scrollIntoViewIfNeeded();await expect(page.locator('#tutorialSpeed')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.locator('#tutorialFigure').evaluate(element=>element.getBoundingClientRect().width)).toBeGreaterThan(250);
 await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/tutorial-mobile.png`,fullPage:true});
});

test('playing a selected final step begins that step instead of replaying the entire lesson',async({page})=>{
 await page.goto('/?e2e=1&art=npr-sample');await page.locator('#planTutorial').click();await page.locator('#tutorialTabs button[data-task="carry"]').click();
 await page.locator('#tutorialStepList button').last().click();await expect(page.locator('#tutorialModal')).toHaveAttribute('data-step','2');await page.locator('#tutorialPlay').click();
 expect(await page.locator('#tutorialModal').getAttribute('data-step')).toBe('2');await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','true');
 expect(Number(await page.locator('#tutorialModal').getAttribute('data-time-ms'))).toBeGreaterThanOrEqual(4000);
});

test('a short background interval with no hidden animation frame never fills tutorial playback',async({page})=>{
 // Exercise the real panel with a legal browser schedule that emits no hidden
 // rAF. A normal wall-clock test can miss this when a long GPU frame is dropped.
 const html=await readFile('index.html','utf8'),markup=html.slice(html.indexOf('<div id="tutorialModal"'),html.indexOf('<script type="module" src="/src/entry.ts"'));
 await page.route('**/tutorial-frame-fixture',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><body>${markup}</body>`}));
 await page.goto('/tutorial-frame-fixture');
 const observation=await page.evaluate(async()=>{
  const callbacks:FrameRequestCallback[]=[];let hidden=false;
  window.requestAnimationFrame=callback=>{callbacks.push(callback);return callbacks.length;};window.cancelAnimationFrame=()=>{};
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
  const modulePath='/src/ui/exerciseTutorialPanel.ts',module=await import(modulePath);
  const root=document.getElementById('tutorialModal')!,panel=new module.ExerciseTutorialPanel(root,{onOpen(){},onClose(){return undefined;}});
  panel.open('chop');callbacks.shift()!(1000);const before=root.dataset.timeMs;
  hidden=true;document.dispatchEvent(new Event('visibilitychange'));
  hidden=false;document.dispatchEvent(new Event('visibilitychange'));
  callbacks.shift()!(1150);const after=root.dataset.timeMs;panel.dispose();return {before,after};
 });
 expect(observation.after).toBe(observation.before);
});

test.describe('automatic training',()=>{
 test.use({automaticDemo:true});
 test('opening before delayed assets suppresses behind-dialog autoplay without changing the preference',async({page})=>{
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/assets/user-models/castle.fbx',async route=>{await gate;await route.continue();});
  await page.goto('/?e2e=1&art=npr-sample',{waitUntil:'domcontentloaded'});
  try{await page.locator('#tutorialOpen').click();await expect(dialog(page)).toBeVisible();await page.locator('#tutorialClose').click();}finally{release();}
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');await page.waitForTimeout(350);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','home');await expect(page.locator('#chopValue')).toHaveText('0/15');expect(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'))).toBe('true');
 });
 test('replay pauses automatic training and Space P Escape cannot continue or reset it',async({page})=>{
  await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#tutorialOpen').click();
  await expect(dialog(page)).toBeVisible();await expect(page.locator('#statusTag')).toHaveText('已暂停');const before=await progress(page);
  await page.locator('#tutorialReplay').focus();await page.keyboard.press('Space');await page.keyboard.press('KeyP');await page.waitForTimeout(400);expect(await progress(page)).toEqual(before);
  await page.keyboard.press('Escape');await expect(dialog(page)).toBeHidden();await expect(page.locator('#exitModal')).toBeHidden();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  await page.waitForTimeout(300);expect(await progress(page)).toEqual(before);await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});await expect(page.locator('#rewardLogs')).toHaveText('15');
  await page.locator('#resultsTutorial').click();await expect(dialog(page)).toBeVisible();await page.locator('#tutorialClose').click();await expect(page.locator('#resultsTutorial')).toBeFocused();await expect(page.locator('#rewardLogs')).toHaveText('15');
 });
 test('opening during carry freezes effective hold time and does not fill the teaching interval on resume',async({page})=>{
  await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#missionTitle')).toHaveText('推车返回农场',{timeout:25000});await expect(page.locator('#statusTag')).toHaveText('训练中');
  await expect.poll(async()=>parseFloat((await page.locator('#carryValue').textContent())??'0')).toBeGreaterThan(.1);await page.locator('#tutorialOpen').click();
  await expect(page.locator('#statusTag')).toHaveText('已暂停');const before=await progress(page);await page.waitForTimeout(700);expect(await progress(page)).toEqual(before);
  await page.locator('#tutorialClose').click();await page.waitForTimeout(250);expect(await progress(page)).toEqual(before);await page.locator('#pauseBtn').click();
  await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
 });
});

test.describe('camera integration with synthetic test frames',()=>{
 test.setTimeout(90000);
 async function startCamera(page:Page){
  await installPoseFixture(page);await page.goto('/?e2e=1&art=npr-sample');await prepareCamera(page);await page.locator('#beginCamera').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
 }
 test('replay keeps the same video tracks and worker and a partial chop cannot become a completed rep',async({page})=>{
  await startCamera(page);await setPose(page,'raised',0);await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await setPose(page,'down',0);await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');
  const resources=await page.evaluate(()=>({ids:window.poseFixture.tracks.map(track=>track.id),workers:window.poseFixture.workers,max:window.poseFixture.maxWorkers}));
  expect(resources.ids).toHaveLength(1);expect(resources.workers).toBe(1);expect(resources.max).toBe(1);
  await page.locator('#tutorialOpen').click();await expect(dialog(page)).toBeVisible();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  await page.locator('#tutorialTabs button[data-task="carry"]').click();await page.waitForTimeout(400);await expect(page.locator('#chopValue')).toHaveText('0/15');
  expect(await page.evaluate(()=>({ids:window.poseFixture.tracks.map(track=>track.id),workers:window.poseFixture.workers,max:window.poseFixture.maxWorkers}))).toEqual(resources);
  expect(await page.evaluate(()=>window.poseFixture.tracks.every(track=>track.readyState==='live'))).toBe(true);
  await page.locator('#tutorialClose').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');await page.locator('#pauseBtn').click();
  await setPose(page,'down',500);await expect(page.locator('#chopValue')).toHaveText('0/15');await completeSyntheticChop(page,1);await expect(page.locator('#chopValue')).toHaveText('1/15');
 });
 test('tracking loss while replaying still requires preparation after teaching closes',async({page})=>{
  await startCamera(page);await page.locator('#tutorialOpen').click();await page.evaluate(()=>{window.poseFixture.low=true;});
  await expect(page.locator('#beginCamera')).toBeDisabled({timeout:10000});await expect(dialog(page)).toBeVisible();
  await page.locator('#tutorialClose').click();await expect(page.locator('#setupModal')).toBeVisible();await expect(page.locator('#setupTutorial')).toBeFocused();
  await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  await mkdir(output,{recursive:true});await writeFile(`${output}/synthetic-camera-boundary.json`,JSON.stringify({input:'Fake video and authored pose landmarks; not physical camera',workers:await page.evaluate(()=>window.poseFixture.maxWorkers),result:'Preparation remains required; no simulated fallback'},null,2));
 });
});
