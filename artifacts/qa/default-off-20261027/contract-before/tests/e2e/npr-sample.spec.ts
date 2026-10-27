import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test.use({baseURL:'http://127.0.0.1:4174'});
const sample='/?e2e=1&art=npr-sample';

test('NPR sample waits for its real local atlas before autoplay or manual start',async({page})=>{
 let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/assets/npr/pastoral-atlas-v1.png',async route=>{await gate;await route.continue();});
 await page.goto(sample,{waitUntil:'domcontentloaded'});
 try{
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-art','tidal-npr-sample-v2');
  await expect(page.locator('#acceptPlan')).toBeDisabled();await page.waitForTimeout(350);
  await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#statusTag')).toHaveText('未开始');
 }finally{release();}
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');
 await expect(page.locator('#chopValue')).not.toHaveText('0/15');
});

test('the separate leaf cutout must also finish before the sample can start',async({page})=>{
 let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});let requested=false;
 await page.route('**/assets/npr/leaf-bough-v2.png',async route=>{requested=true;await gate;await route.continue();});
 await page.goto(sample,{waitUntil:'domcontentloaded'});
 try{
  await expect.poll(()=>requested).toBe(true);await page.waitForTimeout(300);
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','loading');await expect(page.locator('#acceptPlan')).toBeDisabled();
  await expect(page.locator('#chopValue')).toHaveText('0/15');
 }finally{release();}
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');await expect(page.locator('#chopValue')).not.toHaveText('0/15');
});

test('a missing leaf cutout is explicit failure, not a blank tree or fallback autoplay',async({page})=>{
 await page.route('**/assets/npr/leaf-bough-v2.png',route=>route.abort('failed'));
 await page.goto(sample);await expect(page.locator('#renderError')).toContainText('美术样板贴图加载失败');
 await page.waitForTimeout(300);await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
});

test('NPR missing texture fails visibly and cannot advance a hidden session',async({page})=>{
 await page.route('**/assets/npr/pastoral-atlas-v1.png',route=>route.abort('failed'));
 await page.goto(sample);await expect(page.locator('#renderError')).toContainText('美术样板贴图加载失败');
 await page.waitForTimeout(400);await expect(page.locator('#acceptPlan')).toBeDisabled();
 await expect(page.locator('#statusTag')).toHaveText('未开始');await expect(page.locator('#chopValue')).toHaveText('0/15');
});

test('reset while sample assets load cancels the deferred automatic start',async({page})=>{
 let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/assets/npr/pastoral-atlas-v1.png',async route=>{await gate;await route.continue();});
 await page.goto(sample,{waitUntil:'domcontentloaded'});
 try{await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','loading');await page.locator('#resetBtn').click();}finally{release();}
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');await page.waitForTimeout(600);
 await expect(page.locator('#statusTag')).toHaveText('未开始');await expect(page.locator('#chopValue')).toHaveText('0/15');
 await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','true');await expect(page.locator('#acceptPlan')).toBeEnabled();
});

test('late atlas completion cannot revive controls after graphics context loss and reset',async({page})=>{
 let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/assets/npr/pastoral-atlas-v1.png',async route=>{await gate;await route.continue();});
 await page.goto(sample,{waitUntil:'domcontentloaded'});
 try{
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','loading');
  await page.locator('#worldCanvas canvas').dispatchEvent('webglcontextlost',{cancelable:true});
  await expect(page.locator('#renderError')).toContainText('上下文已丢失');await page.locator('#resetBtn').click();
 }finally{release();}
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','failed');await page.waitForTimeout(400);
 await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
 await expect(page.locator('#statusTag')).toHaveText('未开始');
});

test('sample keeps explicit real camera selection and never falls back to simulation on device failure',async({page})=>{
 await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('no physical camera','NotFoundError');};});
 await page.goto(sample);await expect(page.locator('#statusTag')).toHaveText('训练中');
 await page.locator('#resetBtn').click();await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#cameraStatus')).toContainText('未找到摄像头');await expect(page.locator('#setupDemoToggle')).toHaveAttribute('aria-checked','false');
 await page.reload();await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');
 await page.waitForTimeout(350);await expect(page.locator('#planModal')).toBeVisible();await expect(page.locator('#chopValue')).toHaveText('0/15');
 await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
});

test('a rendered chop blends between poses, freezes mid-swing on pause and resumes without duplicate credit',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto('/?art=npr-sample&model=prototype');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');
 await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();
 await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:8000});
 await page.evaluate(()=>{
  const world=document.getElementById('worldCanvas')!,before=world.dataset.motionRevision;
  const observer=new MutationObserver(()=>{
   if(world.dataset.action==='chop-down'&&world.dataset.motionRevision!==before){observer.disconnect();document.getElementById('pauseBtn')!.click();}
  });
  observer.observe(world,{attributes:true,attributeFilter:['data-action','data-motion-revision']});
 });
 await page.keyboard.press('Space');await expect(page.locator('#statusTag')).toHaveText('已暂停');
 await page.waitForTimeout(70);const revision=await page.locator('#worldCanvas').getAttribute('data-motion-revision');expect(revision).not.toBeNull();
 const pixels=await page.locator('#worldCanvas canvas').screenshot();
 await page.waitForTimeout(300);await expect(page.locator('#worldCanvas')).toHaveAttribute('data-motion-revision',revision!);
 expect(await page.locator('#worldCanvas canvas').screenshot()).toEqual(pixels);
 await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.locator('#pauseBtn').click();await page.locator('#actionBtn').focus();await page.keyboard.press('Space');await expect(page.locator('#chopValue')).toHaveText('1/15');
 await page.waitForTimeout(350);await expect(page.locator('#chopValue')).toHaveText('1/15');
});

test('reset during a partial swing immediately snaps the rendered hands to the new home pose',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto('/?art=npr-sample&model=prototype');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');
 await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();
 await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:8000});
 await page.evaluate(()=>{
  const world=document.getElementById('worldCanvas')!;
  const observer=new MutationObserver(()=>{
   if(world.dataset.action==='chop-down'){
    observer.disconnect();document.getElementById('resetBtn')!.click();
    requestAnimationFrame(()=>{document.documentElement.dataset.handAfterReset=world.dataset.hand;});
   }
  });observer.observe(world,{attributes:true,attributeFilter:['data-action']});
 });
 await page.locator('#actionBtn').focus();await page.keyboard.press('Space');
 await expect(page.locator('#statusTag')).toHaveText('未开始');
 // The actual rendered hand must already be the new idle pose at the first frame, not easing out of the old swing.
 await expect(page.locator('html')).toHaveAttribute('data-hand-after-reset','1.7700,1.0500,4.0000');
 await expect(page.locator('#chopValue')).toHaveText('0/15');
});

test('local NPR sample keeps pause, input switch, inventory and complete simulated results',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{localStorage.setItem('tidal.demo.enabled','false');navigator.mediaDevices.getUserMedia=async()=>{throw new Error('no physical camera in this test');};});
 await page.goto(sample);await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');
 await page.locator('#cancelPlan').click();await mkdir('artifacts/qa/npr-refinement',{recursive:true});
 await page.screenshot({path:'artifacts/qa/npr-refinement/home.png'});
 const before=await page.locator('#worldCanvas').getAttribute('data-camera');await page.locator('#viewRight').click();
 await expect(page.locator('#worldCanvas')).not.toHaveAttribute('data-camera',before!);
 await page.locator('#viewReset').click();await page.locator('#actionBtn').click();await page.locator('#acceptPlan').click();
 await page.locator('#setupDemoToggle').click();await page.locator('#beginDemo').click();
 await expect(page.locator('#chopValue')).not.toHaveText('0/15');await page.locator('#pauseBtn').click();
 const count=await page.locator('#chopValue').textContent();await page.waitForTimeout(400);await expect(page.locator('#chopValue')).toHaveText(count!);
 await page.screenshot({path:'artifacts/qa/npr-refinement/chop-paused.png'});await page.locator('#pauseBtn').click();
 await expect(page.locator('#loadValue')).not.toHaveText('0/15');await page.screenshot({path:'artifacts/qa/npr-refinement/load.png'});
 await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});
 await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#rewardCoins')).toHaveText('100');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
 await expect(page.locator('#resultChop')).toHaveText('15');await expect(page.locator('#resultLoad')).toHaveText('15');
 await page.screenshot({path:'artifacts/qa/npr-refinement/results.png'});
 await page.locator('#resultsHome').click();await expect(page.locator('#chopValue')).toHaveText('0/15');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/0');
 await page.waitForTimeout(350);await expect(page.locator('#statusTag')).toHaveText('未开始');expect(errors).toEqual([]);
});
