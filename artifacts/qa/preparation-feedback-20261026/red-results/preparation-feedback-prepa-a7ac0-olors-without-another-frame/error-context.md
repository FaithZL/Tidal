# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: preparation-feedback.spec.ts >> preparation reveals quality failures and a stalled feed clears old colors without another frame
- Location: tests/e2e/preparation-feedback.spec.ts:15:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#upperBodyReason')
Expected substring: "不够清晰"
Received string:    "等待上半身有效关键点；不要求腿部入镜。"
Timeout: 7000ms

Call log:
  - Expect "toContainText" locator('#upperBodyReason') with timeout 7000ms
  - waiting for locator('#upperBodyReason')
    18 × locator resolved to <p role="status" id="upperBodyReason">等待上半身有效关键点；不要求腿部入镜。</p>
       - unexpected value "等待上半身有效关键点；不要求腿部入镜。"

```

```yaml
- status: 等待上半身有效关键点；不要求腿部入镜。
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
  3  | import {mkdir} from 'node:fs/promises';
  4  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  5  | const output='artifacts/qa/preparation-feedback-20261026';
  6  | async function setup(page:Page){await installUpperBodyFixture(page);await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await expect(page.locator('#setupModal')).toBeVisible();await page.evaluate(()=>{window.upperFixture.pose='left-only';});await page.locator('#cameraStart').click();await expect(page.locator('#cameraFrames')).not.toHaveText('0');}
  7  | const palette=(page:Page)=>page.locator('#poseOverlay').evaluate((canvas:HTMLCanvasElement)=>{const data=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data,result={green:0,red:0};for(let i=0;i<data.length;i+=4){if(data[i+3]<200)continue;if(data[i]===119&&data[i+1]===227&&data[i+2]===160)result.green++;if(data[i]===255&&data[i+1]===107&&data[i+2]===105)result.red++;}return result;});
  8  | 
  9  | test('lowered-hand preparation shows matching arm green and unlowered arm red before training',async({page})=>{
  10 |  await setup(page);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','adjust');await expect(page.locator('#upperBodyReason')).toContainText('放下');await expect.poll(async()=>(await palette(page)).red).toBeGreaterThan(8);await expect.poll(async()=>(await palette(page)).green).toBeGreaterThan(8);await expect(page.locator('#chopValue')).toHaveText('0/15');
  11 |  await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/preparation-partial-synthetic.png`});
  12 |  await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','matched');await expect.poll(async()=>(await palette(page)).red).toBe(0);await expect.poll(async()=>(await palette(page)).green).toBeGreaterThan(8);await expect(page.locator('#statusTag')).toHaveText('设备准备');await expect(page.locator('#chopValue')).toHaveText('0/15');
  13 | });
  14 | 
  15 | test('preparation reveals quality failures and a stalled feed clears old colors without another frame',async({page})=>{
> 16 |  await setup(page);await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#upperBodyReason')).toContainText('不够清晰');await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','unavailable');await expect.poll(async()=>(await palette(page)).green+(await palette(page)).red).toBe(0);
     |                                                                                                                            ^ Error: expect(locator).toContainText(expected) failed
  17 |  await page.evaluate(()=>{window.upperFixture.low=false;});await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','adjust');await page.evaluate(()=>{window.upperFixture.stalled=true;});await expect(page.locator('#upperBodyReason')).toContainText('没有新数据');await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','unavailable');await expect.poll(async()=>(await palette(page)).green+(await palette(page)).red).toBe(0);await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  18 | });
  19 | 
```