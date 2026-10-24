import {test,expect} from '@playwright/test';

const url='/?art=character-motion&model=prototype';

test('the local motion sample identifies its prototype and never starts exercise input',async({page})=>{
 const requests:string[]=[];page.on('request',r=>requests.push(r.url()));
 await page.goto(url);
 await expect(page.getByRole('heading',{name:'人物动作局部样片'})).toBeVisible();
 await expect(page.locator('#motionSource')).toContainText('非 Leo 原模型');
 await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
 await expect(page.locator('#motionCanvas')).toBeVisible();
 await expect(page.locator('#worldCanvas')).toHaveCount(0);
 expect(requests.filter(u=>/mediapipe|pose_landmarker|pose-worker/.test(u))).toEqual([]);
 expect(requests.filter(u=>!u.startsWith('http://127.0.0.1:4173')&&!u.startsWith('data:'))).toEqual([]);
});

test('pause freezes rendered bones; slow motion and replay remain usable',async({page})=>{
 await page.goto(url);await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
 await expect.poll(async()=>Number(await page.locator('#motionStage').getAttribute('data-time'))).toBeGreaterThan(.1);
 await page.getByRole('button',{name:'暂停'}).click();
 const time=await page.locator('#motionStage').getAttribute('data-time');
 const before=await page.locator('#motionCanvas').screenshot();
 await page.waitForTimeout(250);
 expect(await page.locator('#motionStage').getAttribute('data-time')).toBe(time);
 expect((await page.locator('#motionCanvas').screenshot()).equals(before)).toBe(true);
 await page.getByRole('button',{name:'慢速 0.5×'}).click();
 await expect(page.getByRole('button',{name:'慢速 0.5×'})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'重播动作'}).click();
 await expect(page.locator('#motionPhase')).toHaveText('站立 · 呼吸与重心');
 await expect.poll(async()=>Number(await page.locator('#motionStage').getAttribute('data-time'))).toBeGreaterThan(.05);
 await page.getByRole('button',{name:'仅看站立'}).click();
 await page.waitForTimeout(250);await expect(page.locator('#motionPhase')).toHaveText('站立 · 呼吸与重心');
});

test('bone asset failure is visible and disables replay',async({page})=>{
 await page.route('**/assets/character-motion/tree-chopping.glb',r=>r.abort('failed'));
 await page.goto(url);await expect(page.getByRole('alert')).toContainText('动作素材加载失败');
 await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','failed');
 await expect(page.getByRole('button',{name:'重播动作'})).toBeDisabled();
});

test('face inspection changes the real camera without changing a paused pose or saved input preference',async({page})=>{
 await page.goto(url);await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
 await page.getByRole('slider',{name:'逐帧检视'}).evaluate((element:HTMLInputElement)=>{element.value='.8';element.dispatchEvent(new Event('input',{bubbles:true}));});
 await expect(page.locator('#motionStage')).toHaveAttribute('data-time','0.8000');
 const before=await page.locator('#motionCanvas').screenshot(),preference=await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'));
 const face=page.getByRole('button',{name:'面部特写',exact:true});await face.click();
 await expect(face).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#motionStage')).toHaveAttribute('data-view','face');
 expect((await page.locator('#motionCanvas').screenshot()).equals(before)).toBe(false);
 await expect(page.locator('#motionStage')).toHaveAttribute('data-time','0.8000');
 await face.click();await expect(page.locator('#motionStage')).toHaveAttribute('data-view','full');
 expect(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'))).toBe(preference);
});

test('switching to idle while paused redraws the bones immediately',async({page})=>{
 await page.goto(url);await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
 await page.getByRole('slider',{name:'逐帧检视'}).evaluate((element:HTMLInputElement)=>{element.value='3.77';element.dispatchEvent(new Event('input',{bubbles:true}));});
 await expect(page.locator('#motionStage')).toHaveAttribute('data-time','3.7700');await page.waitForTimeout(150);
 const before=await page.locator('#motionCanvas').screenshot();
 const paints=Number(await page.locator('#motionStage').getAttribute('data-paints'));
 await page.getByRole('button',{name:'仅看站立'}).click();
 await expect(page.locator('#motionPhase')).toHaveText('站立 · 呼吸与重心');
 await expect.poll(async()=>Number(await page.locator('#motionStage').getAttribute('data-paints'))).toBeGreaterThan(paints);
 expect((await page.locator('#motionCanvas').screenshot()).equals(before)).toBe(false);
});

test('the review timeline selects an exact paused pose without advancing a workout',async({page})=>{
 await page.goto(url);await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
 const timeline=page.getByRole('slider',{name:'逐帧检视'});await expect(timeline).toBeEnabled();
 await timeline.evaluate((element:HTMLInputElement)=>{element.value='3.77';element.dispatchEvent(new Event('input',{bubbles:true}));});
 await expect(page.locator('#motionStage')).toHaveAttribute('data-time','3.7700');
 await expect(page.locator('#motionPhase')).toHaveText('挥砍 · 下挥发力');
 await expect(page.getByRole('button',{name:'继续',exact:true})).toBeVisible();
 await page.waitForTimeout(180);await expect(page.locator('#motionStage')).toHaveAttribute('data-time','3.7700');
});

test('the original farm cannot receive clicks before its dynamic module has installed handlers',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/src/browser.ts',async route=>{await gate;await route.continue();});
 await page.goto('/',{waitUntil:'domcontentloaded'});
 try{await expect(page.locator('body')).toHaveAttribute('inert','');}finally{release();}
 await expect(page.locator('body')).not.toHaveAttribute('inert','');
 await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
 await page.locator('#cancelPlan').click();await expect(page.locator('#planModal')).toBeHidden();
});

test('entry module download failure is explicit and leaves a usable reload link',async({page})=>{
 await page.route('**/src/browser.ts',r=>r.abort('failed'));
 await page.goto('/');await expect(page.getByRole('alert')).toContainText('演示启动失败');
 await expect(page.getByRole('link',{name:'重新加载'})).toBeVisible();
 await expect(page.locator('body')).not.toHaveAttribute('inert','');
});
