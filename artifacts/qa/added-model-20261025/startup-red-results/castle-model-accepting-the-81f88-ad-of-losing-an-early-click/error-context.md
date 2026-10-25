# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: castle-model.spec.ts >> accepting the plan waits for dynamic startup handlers instead of losing an early click
- Location: tests/e2e/castle-model.spec.ts:55:1

# Error details

```
Error: expect(locator).toBeDisabled() failed

Locator:  locator('#acceptPlan')
Expected: disabled
Received: enabled
Timeout:  7000ms

Call log:
  - Expect "toBeDisabled" locator('#acceptPlan') with timeout 7000ms
  - waiting for locator('#acceptPlan')
    18 × locator resolved to <button class="primary" id="acceptPlan">…</button>
       - unexpected value "enabled"

```

```yaml
- button "接受今天的任务 →"
```

# Test source

```ts
  1  | import {test,expect} from '../helpers/manualModeTest.js';
  2  | test.use({channel:'chromium'});
  3  | 
  4  | test('the supplied castle is a real grounded mesh in the farm and local NPR scene',async({page})=>{
  5  |  const errors:string[]=[],external:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  6  |  page.on('request',r=>{if(!['http://127.0.0.1:4173','null'].includes(new URL(r.url()).origin))external.push(r.url());});
  7  |  for(const url of ['/', '/?art=npr-sample']){
  8  |   await page.setViewportSize({width:1366,height:768});
  9  |   const response=page.waitForResponse(r=>r.url().endsWith('/assets/user-models/castle.fbx'));
  10 |   await page.goto(url);expect((await response).status()).toBe(200);
  11 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');
  12 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-castle','user-fbx');
  13 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-castle-triangles','60000');
  14 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-castle-position','-24.000,0.025,-9.000');
  15 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/0');
  16 |   const before=await page.locator('#worldCanvas').getAttribute('data-camera');await page.getByRole('button',{name:'城堡近景',exact:true}).click();
  17 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-view','castle');
  18 |   await expect(page.locator('#worldCanvas')).not.toHaveAttribute('data-camera',before!);
  19 |   await expect(page.locator('#chopValue')).toHaveText('0/15');
  20 |   const desktopCamera=await page.locator('#worldCanvas').getAttribute('data-camera');await page.setViewportSize({width:390,height:844});
  21 |   await expect(page.locator('#worldCanvas')).not.toHaveAttribute('data-camera',desktopCamera!);
  22 |   const control=await page.locator('#viewCastle').boundingBox(),title=await page.locator('.scene-head h1').boundingBox();
  23 |   expect(control!.y+control!.height).toBeLessThanOrEqual(title!.y);await page.locator('#viewReset').click();
  24 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-view','farm');
  25 |  }
  26 |  expect(errors).toEqual([]);expect(external).toEqual([]);
  27 | });
  28 | 
  29 | test('a delayed castle keeps the farm start gate closed and a missing castle fails explicitly',async({page})=>{
  30 |  let release=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
  31 |  await page.route('**/assets/user-models/castle.fbx',async route=>{await gate;await route.fulfill({status:404,body:'missing fixture'});});
  32 |  await page.goto('/',{waitUntil:'domcontentloaded'});
  33 |  try{await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','loading');}finally{release();}
  34 |  await expect(page.locator('#renderError')).toContainText('用户城堡模型加载失败');
  35 |  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','failed');
  36 |  await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  37 | });
  38 | 
  39 | 
  40 | test('starting exercise exits castle inspection and resizing keeps the exercise camera',async({page})=>{
  41 |  await page.goto('http://127.0.0.1:4174/?e2e=1');
  42 |  await page.getByRole('button',{name:'城堡近景',exact:true}).click();
  43 |  await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();
  44 |  await expect(page.locator('#statusTag')).toHaveText('训练中');
  45 |  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  46 |  const camera=await page.locator('#worldCanvas').getAttribute('data-camera');
  47 |  await page.setViewportSize({width:390,height:844});
  48 |  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  49 |  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-camera',camera!);
  50 |  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-view','farm');
  51 |  await expect(page.locator('#chopValue')).toHaveText('0/15');
  52 | });
  53 | 
  54 | 
  55 | test('accepting the plan waits for dynamic startup handlers instead of losing an early click',async({page})=>{
  56 |  let release=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
  57 |  await page.route('**/src/browser.ts',async route=>{await gate;await route.continue();});
  58 |  await page.goto('/',{waitUntil:'domcontentloaded'});
> 59 |  try{await expect(page.locator('#acceptPlan')).toBeDisabled();}finally{release();}
     |                                                ^ Error: expect(locator).toBeDisabled() failed
  60 |  await expect(page.locator('#acceptPlan')).toBeEnabled();await page.locator('#acceptPlan').click();
  61 |  await expect(page.locator('#setupModal')).toBeVisible();
  62 | });
  63 | 
```