import {test,expect} from '../helpers/manualModeTest.js';
test.use({channel:'chromium'});

test('the supplied castle is a real grounded mesh in the farm and local NPR scene',async({page})=>{
 const errors:string[]=[],external:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(!['http://127.0.0.1:4173','null'].includes(new URL(r.url()).origin))external.push(r.url());});
 for(const url of ['/', '/?art=npr-sample']){
  await page.setViewportSize({width:1366,height:768});
  const response=page.waitForResponse(r=>r.url().endsWith('/assets/user-models/castle.fbx'));
  await page.goto(url);expect((await response).status()).toBe(200);
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-castle','user-fbx');
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-castle-triangles','60000');
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-castle-position','-24.000,0.025,-9.000');
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/0');
  const before=await page.locator('#worldCanvas').getAttribute('data-camera');await page.getByRole('button',{name:'城堡近景',exact:true}).click();
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-view','castle');
  await expect(page.locator('#worldCanvas')).not.toHaveAttribute('data-camera',before!);
  await expect(page.locator('#chopValue')).toHaveText('0/15');
  const desktopCamera=await page.locator('#worldCanvas').getAttribute('data-camera');await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#worldCanvas')).not.toHaveAttribute('data-camera',desktopCamera!);
  const control=await page.locator('#viewCastle').boundingBox(),title=await page.locator('.scene-head h1').boundingBox();
  expect(control!.y+control!.height).toBeLessThanOrEqual(title!.y);await page.locator('#viewReset').click();
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-view','farm');
 }
 expect(errors).toEqual([]);expect(external).toEqual([]);
});

test('a delayed castle keeps the farm start gate closed and a missing castle fails explicitly',async({page})=>{
 let release=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/assets/user-models/castle.fbx',async route=>{await gate;await route.fulfill({status:404,body:'missing fixture'});});
 await page.goto('/',{waitUntil:'domcontentloaded'});
 try{await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','loading');}finally{release();}
 await expect(page.locator('#renderError')).toContainText('用户城堡模型加载失败');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','failed');
 await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
});


test('starting exercise exits castle inspection and resizing keeps the exercise camera',async({page})=>{
 await page.goto('http://127.0.0.1:4174/?e2e=1');
 await page.getByRole('button',{name:'城堡近景',exact:true}).click();
 await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();
 await expect(page.locator('#statusTag')).toHaveText('训练中');
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const camera=await page.locator('#worldCanvas').getAttribute('data-camera');
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-camera',camera!);
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-view','farm');
 await expect(page.locator('#chopValue')).toHaveText('0/15');
});


test('accepting the plan waits for dynamic startup handlers instead of losing an early click',async({page})=>{
 let release=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/src/browser.ts',async route=>{await gate;await route.continue();});
 await page.goto('/',{waitUntil:'domcontentloaded'});
 try{await expect(page.locator('#acceptPlan')).toBeDisabled();}finally{release();}
 await expect(page.locator('#acceptPlan')).toBeEnabled();await page.locator('#acceptPlan').click();
 await expect(page.locator('#setupModal')).toBeVisible();
});

test('a missing castle colour atlas fails explicitly and keeps the farm start gate closed',async({page})=>{
 await page.route('**/assets/user-models/castle-soft-toon-v1.png',route=>route.fulfill({status:404,body:'missing castle colour atlas'}));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#renderError')).toContainText('用户城堡模型加载失败');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','failed');
 await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
});

test('the farm waits for the actual castle colour atlas before accepting the plan',async({page})=>{
 let release=()=>{},requested=()=>{};
 const gate=new Promise<void>(resolve=>{release=resolve;}),textureRequested=new Promise<void>(resolve=>{requested=resolve;});
 await page.route('**/assets/user-models/castle-soft-toon-v1.png',async route=>{requested();await gate;await route.continue();});
 await page.goto('/',{waitUntil:'domcontentloaded'});await textureRequested;
 try{
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','loading');
  await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
 }finally{release();}
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');
 await expect(page.locator('#acceptPlan')).toBeEnabled();await page.locator('#acceptPlan').click();
 await expect(page.locator('#setupModal')).toBeVisible();
});
