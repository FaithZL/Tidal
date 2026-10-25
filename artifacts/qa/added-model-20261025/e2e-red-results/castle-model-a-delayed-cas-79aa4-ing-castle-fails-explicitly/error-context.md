# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: castle-model.spec.ts >> a delayed castle keeps the farm start gate closed and a missing castle fails explicitly
- Location: tests/e2e/castle-model.spec.ts:22:1

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
    17 × locator resolved to <button class="primary" id="acceptPlan">…</button>
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
  8  |   const response=page.waitForResponse(r=>r.url().endsWith('/assets/user-models/castle.fbx'));
  9  |   await page.goto(url);expect((await response).status()).toBe(200);
  10 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');
  11 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-castle','user-fbx');
  12 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-castle-triangles','60000');
  13 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-castle-position','-10.000,0.025,-29.000');
  14 |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/0');
  15 |   const before=await page.locator('#worldCanvas').getAttribute('data-camera');await page.locator('#viewLeft').click();
  16 |   await expect(page.locator('#worldCanvas')).not.toHaveAttribute('data-camera',before!);
  17 |   await expect(page.locator('#chopValue')).toHaveText('0/15');
  18 |  }
  19 |  expect(errors).toEqual([]);expect(external).toEqual([]);
  20 | });
  21 | 
  22 | test('a delayed castle keeps the farm start gate closed and a missing castle fails explicitly',async({page})=>{
  23 |  let release=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;});
  24 |  await page.route('**/assets/user-models/castle.fbx',async route=>{await gate;await route.fulfill({status:404,body:'missing fixture'});});
  25 |  await page.goto('/',{waitUntil:'domcontentloaded'});
> 26 |  try{await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','loading');}finally{release();}
     |                                                ^ Error: expect(locator).toBeDisabled() failed
  27 |  await expect(page.locator('#renderError')).toContainText('用户城堡模型加载失败');
  28 |  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','failed');
  29 |  await expect(page.locator('#acceptPlan')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  30 | });
  31 | 
```