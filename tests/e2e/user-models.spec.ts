import {test,expect} from '@playwright/test';

test('the supplied character exposes local derived-bone motion and keeps the house review usable',async({page})=>{
 const errors:string[]=[],external:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{const url=new URL(request.url());if(!['http://127.0.0.1:4173','null'].includes(url.origin))external.push(url.href);});
 await page.goto('/?art=character-motion');
 await expect(page.getByRole('heading',{name:'人物与房屋模型'})).toBeVisible();
 await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
 await expect(page.locator('#motionStage')).toHaveAttribute('data-motion-support','derived-skeleton');
 await expect(page.locator('#motionSource')).toContainText('本地派生骨骼');
 await expect(page.locator('#motionSource')).toContainText('非真人输入');
 await expect(page.getByRole('button',{name:'重播动作'})).toBeEnabled();
 await expect(page.locator('#motionStage')).toHaveAttribute('data-view','character');
 const before=await page.locator('#motionCanvas').screenshot();
 await page.getByRole('button',{name:'房屋近景',exact:true}).click();
 await expect(page.locator('#motionStage')).toHaveAttribute('data-view','house');
 expect((await page.locator('#motionCanvas').screenshot()).equals(before)).toBe(false);
 await page.getByRole('button',{name:'人物近景',exact:true}).click();
 await expect(page.locator('#motionStage')).toHaveAttribute('data-view','character');
 expect(errors).toEqual([]);expect(external).toEqual([]);
 await expect(page.locator('#worldCanvas')).toHaveCount(0);
 expect(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'))).toBeNull();
 await page.getByRole('link',{name:'← 返回农场'}).click();
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-character','user-fbx-farm-motion');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-house','user-fbx');
});

test('derived user bones really move, freeze on pause and scrub without changing the saved mock preference',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));
 await page.goto('/?art=character-motion');await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
 const timeline=page.getByRole('slider',{name:'逐帧检视'});
 await timeline.evaluate((element:HTMLInputElement)=>{element.value='.8';element.dispatchEvent(new Event('input',{bubbles:true}));});
 await expect(page.locator('#motionStage')).toHaveAttribute('data-time','0.8000');
 await expect(page.locator('#motionStage')).toHaveAttribute('data-phase','idle');
 const idle=await page.locator('#motionCanvas').screenshot();
 await timeline.evaluate((element:HTMLInputElement)=>{element.value='3.4';element.dispatchEvent(new Event('input',{bubbles:true}));});
 await expect(page.locator('#motionStage')).toHaveAttribute('data-time','3.4000');
 await expect(page.locator('#motionStage')).toHaveAttribute('data-phase','prepare');
 const raised=await page.locator('#motionCanvas').screenshot();expect(raised.equals(idle)).toBe(false);
 await page.waitForTimeout(250);expect((await page.locator('#motionCanvas').screenshot()).equals(raised)).toBe(true);
 await expect(page.locator('#motionStage')).toHaveAttribute('data-time','3.4000');
 await page.getByRole('button',{name:'仅看站立',exact:true}).click();
 await expect(page.locator('#motionStage')).toHaveAttribute('data-phase','idle');
 expect((await page.locator('#motionCanvas').screenshot()).equals(raised)).toBe(false);
 await page.getByRole('button',{name:'慢速 0.5×'}).click();
 await expect(page.getByRole('button',{name:'慢速 0.5×'})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'重播动作'}).click();
 await expect.poll(async()=>Number(await page.locator('#motionStage').getAttribute('data-time'))).toBeGreaterThan(.05);
 await page.getByRole('button',{name:'暂停',exact:true}).click();
 const time=await page.locator('#motionStage').getAttribute('data-time'),paused=await page.locator('#motionCanvas').screenshot();
 await page.waitForTimeout(250);await expect(page.locator('#motionStage')).toHaveAttribute('data-time',time!);
 expect((await page.locator('#motionCanvas').screenshot()).equals(paused)).toBe(true);
 expect(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'))).toBe('true');
 await expect(page.locator('#worldCanvas')).toHaveCount(0);
});

test('the original supplied fixed pose remains an explicitly static comparison',async({page})=>{
 await page.goto('/?art=character-motion&model=static');await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
 await expect(page.locator('#motionStage')).toHaveAttribute('data-motion-support','static');
 await expect(page.locator('#motionSource')).toContainText('固定挥砍姿势');
 await expect(page.getByRole('button',{name:'重播动作'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'手肘特写',exact:true})).toHaveCount(0);
 await expect(page.getByRole('link',{name:'派生骨骼动作样片'})).toBeVisible();
});

test('hand and elbow inspection pauses the current pose and returns to stable full character framing',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto('/?art=character-motion');await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
 const timeline=page.getByRole('slider',{name:'逐帧检视'});
 await timeline.evaluate((element:HTMLInputElement)=>{element.value='4.15';element.dispatchEvent(new Event('input',{bubbles:true}));});
 await expect(page.locator('#motionStage')).toHaveAttribute('data-time','4.1500');
 const before=await page.locator('#motionCanvas').screenshot();
 const inspect=page.getByRole('button',{name:'手肘特写',exact:true});await expect(inspect).toBeVisible();await inspect.click();
 await expect(page.locator('#motionStage')).toHaveAttribute('data-view','grip');
 await expect(page.getByRole('button',{name:'继续',exact:true})).toBeEnabled();
 await expect(page.locator('#motionStage')).toHaveAttribute('data-time','4.1500');
 const close=await page.locator('#motionCanvas').screenshot();expect(close.equals(before)).toBe(false);
 await page.waitForTimeout(250);expect((await page.locator('#motionCanvas').screenshot()).equals(close)).toBe(true);
 await page.mouse.move(520,330);await page.mouse.down();await page.mouse.move(650,350,{steps:8});await page.mouse.up();
 expect((await page.locator('#motionCanvas').screenshot()).equals(close)).toBe(false);
 await expect(page.locator('#motionStage')).toHaveAttribute('data-time','4.1500');
 await page.getByRole('button',{name:'人物近景',exact:true}).click();
 await expect(page.locator('#motionStage')).toHaveAttribute('data-view','character');
 await expect(page.locator('#motionStage')).toHaveAttribute('data-time','4.1500');
 expect(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'))).toBe('false');
});

test('a supplied FBX failure is visible and never silently uses the old model',async({page})=>{
 await page.route('**/assets/user-models/character.fbx',route=>route.fulfill({status:404,body:'missing fixture'}));
 await page.goto('/?art=character-motion');
 await expect(page.getByRole('alert')).toContainText('模型加载失败');
 await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','failed');
 await expect(page.getByRole('link',{name:'原动作样片对照'})).toBeVisible();
 await expect(page.getByRole('button',{name:'人物近景',exact:true})).toBeDisabled();
});

test('the farm waits for both supplied models and marks the derived farm character without changing inventory',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/assets/user-models/character.fbx',async route=>{await gate;await route.continue();});
 await page.goto('/?art=npr-sample',{waitUntil:'domcontentloaded'});
 try{await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','loading');await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');}finally{release();}
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-character','user-fbx-farm-motion');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-house','user-fbx');
 await expect(page.locator('.npr-sample-label')).toContainText('挥砍 / 装车 / 行走动作');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/0');
});

test('a supplied house failure keeps the farm start gate closed',async({page})=>{
 await page.route('**/assets/user-models/house.fbx',route=>route.fulfill({status:404,body:'missing fixture'}));
 await page.goto('/?art=npr-sample');await expect(page.locator('#renderError')).toContainText('用户房屋模型加载失败');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','failed');
 await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
});

async function trackEmbeddedUrls(page:import('@playwright/test').Page){
 await page.addInitScript(()=>{
  const created:string[]=[],revoked:string[]=[],create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
  URL.createObjectURL=blob=>{const url=create(blob);created.push(url);return url;};
  URL.revokeObjectURL=url=>{revoked.push(url);revoke(url);};
  Reflect.set(window,'modelEmbeddedUrls',{created,revoked});
 });
}
test('all eight embedded-image object URLs are revoked after actual browser decoding',async({page})=>{
 await trackEmbeddedUrls(page);await page.goto('/?art=character-motion');await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
 const urls=await page.evaluate(()=>Reflect.get(window,'modelEmbeddedUrls') as {created:string[];revoked:string[]});
 expect(urls.created).toHaveLength(8);expect(new Set(urls.revoked)).toEqual(new Set(urls.created));
});

test('a late model cannot reopen a viewer after context loss and still revokes its image URLs',async({page})=>{
 await trackEmbeddedUrls(page);let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/assets/user-models/house.fbx',async route=>{await gate;await route.continue();});
 await page.goto('/?art=character-motion',{waitUntil:'domcontentloaded'});
 try{
  await expect.poll(()=>page.evaluate(()=>Reflect.get(window,'modelEmbeddedUrls')?.revoked.length??0)).toBe(4);
  await page.locator('#motionCanvas').dispatchEvent('webglcontextlost',{cancelable:true});
  await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','failed');
 }finally{release();}
 await expect.poll(()=>page.evaluate(()=>Reflect.get(window,'modelEmbeddedUrls')?.revoked.length??0)).toBe(8);
 await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','failed');
 await expect(page.getByRole('button',{name:'同框查看',exact:true})).toBeDisabled();
});
