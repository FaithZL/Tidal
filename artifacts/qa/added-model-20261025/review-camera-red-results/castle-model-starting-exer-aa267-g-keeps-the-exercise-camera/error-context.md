# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: castle-model.spec.ts >> starting exercise exits castle inspection and resizing keeps the exercise camera
- Location: tests/e2e/castle-model.spec.ts:40:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#worldCanvas')
Expected: "2.233,5.364,10.079"
Received: "22.460,35.062,49.075"
Timeout:  7000ms

Call log:
  - Expect "toHaveAttribute" locator('#worldCanvas') with timeout 7000ms
  - waiting for locator('#worldCanvas')
    18 × locator resolved to <div role="img" data-fallen="0" data-effects="" data-npc="idle" id="worldCanvas" data-rope="0.000" data-particles="0" data-view="castle" data-assets="ready" data-action="ready" data-world-logs="0" data-render-scale="1" data-castle="user-fbx" data-inventory="0/0/0" data-player-mode="work" data-art="tidal-farm-3d-v2" data-renderer="Three.js r186" data-castle-triangles="60000" data-cart-position="3.000,0.000" aria-label="可旋转三维农场。地面0、车上0、到家0。" data-camera="22.460,35.062,49.075" data-probe="0.6544,-0.44…>…</div>
       - unexpected value "22.460,35.062,49.075"

```

```yaml
- img "可旋转三维农场。地面0、车上0、到家0。"
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
> 49 |  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-camera',camera!);
     |                                             ^ Error: expect(locator).toHaveAttribute(expected) failed
  50 |  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-view','farm');
  51 |  await expect(page.locator('#chopValue')).toHaveText('0/15');
  52 | });
  53 | 
```