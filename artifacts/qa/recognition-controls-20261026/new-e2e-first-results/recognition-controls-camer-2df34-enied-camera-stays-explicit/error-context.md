# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recognition-controls.spec.ts >> camera entry pauses automatic play without permission and a denied camera stays explicit
- Location: tests/e2e/recognition-controls.spec.ts:13:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#demoToggle')
Expected: "false"
Received: "true"
Timeout:  7000ms

Call log:
  - Expect "toHaveAttribute" locator('#demoToggle') with timeout 7000ms
  - waiting for locator('#demoToggle')
    17 × locator resolved to <button role="switch" id="demoToggle" aria-checked="true" class="secondary demo-toggle">无摄像头测试：开</button>
       - unexpected value "true"

```

```yaml
- switch "无摄像头测试：开" [checked]
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {mkdir,writeFile} from 'node:fs/promises';
  3  | import {installPoseFixture,prepareCamera,setPose,completeSyntheticChop} from '../helpers/browserPoseFixture.js';
  4  | 
  5  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  6  | const output='artifacts/qa/recognition-controls-20261026';
  7  | async function enter(page:Page,automatic=false){await page.addInitScript(value=>localStorage.setItem('tidal.demo.enabled',String(value)),automatic);await page.goto('/?e2e=1&art=npr-sample');}
  8  | async function camera(page:Page){await installPoseFixture(page);await enter(page);await prepareCamera(page);await page.locator('#beginCamera').click();await expect(page.locator('#statusTag')).toHaveText('训练中');}
  9  | const resources=(page:Page)=>page.evaluate(()=>({tracks:window.poseFixture.tracks.map(track=>track.id),workers:window.poseFixture.workers,max:window.poseFixture.maxWorkers}));
  10 | const outcomes=(page:Page)=>page.evaluate(()=>({chop:document.getElementById('chopValue')!.textContent,load:document.getElementById('loadValue')!.textContent,carry:document.getElementById('carryValue')!.textContent,inventory:document.getElementById('worldCanvas')!.dataset.inventory}));
  11 | const palette=(page:Page)=>page.locator('#poseOverlay').evaluate((canvas:HTMLCanvasElement)=>{const pixels=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;const colors={green:0,red:0,gray:0};for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<200)continue;if(pixels[i]===119&&pixels[i+1]===227&&pixels[i+2]===160)colors.green++;if(pixels[i]===255&&pixels[i+1]===107&&pixels[i+2]===105)colors.red++;if(pixels[i]===155&&pixels[i+1]===174&&pixels[i+2]===180)colors.gray++;}return colors;});
  12 | 
  13 | test('camera entry pauses automatic play without permission and a denied camera stays explicit',async({page})=>{
  14 |  await page.addInitScript(()=>{(window as unknown as {cameraCalls:number}).cameraCalls=0;navigator.mediaDevices.getUserMedia=async()=>{(window as unknown as {cameraCalls:number}).cameraCalls++;throw new DOMException('Denied','NotAllowedError');};});
  15 |  await enter(page,true);await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#cameraMode')).toBeVisible();await page.locator('#cameraMode').click();
  16 |  await expect(page.locator('#setupModal')).toBeVisible();await expect(page.locator('#statusTag')).toHaveText('已暂停');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
  17 |  const before=await outcomes(page);await page.waitForTimeout(300);expect(await outcomes(page)).toEqual(before);expect(await page.evaluate(()=>(window as unknown as {cameraCalls:number}).cameraCalls)).toBe(0);
  18 |  await page.locator('#cameraStart').click();await expect(page.locator('#cameraStatus')).toContainText('权限被拒绝');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
> 19 |  await page.reload();await expect(page.locator('#app')).toHaveAttribute('data-phase','home');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
     |                                                                                                                                        ^ Error: expect(locator).toHaveAttribute(expected) failed
  20 | });
  21 | 
  22 | test('leniency is bounded, saved independently and accessible on a narrow preparation screen',async({page})=>{
  23 |  await page.addInitScript(()=>localStorage.setItem('tidal.recognition.leniency.v1','invalid'));await enter(page);await page.locator('#cameraMode').click();
  24 |  await expect(page.locator('#recognitionLeniency')).toHaveValue('3');await expect(page.locator('#recognitionLeniencyValue')).toContainText('标准');
  25 |  await page.locator('[data-leniency="5"]').click();await expect(page.locator('#recognitionLeniency')).toHaveValue('5');expect(await page.evaluate(()=>localStorage.getItem('tidal.recognition.leniency.v1'))).toBe('5');
  26 |  await page.locator('[data-leniency="1"]').click();await expect(page.locator('#recognitionLeniency')).toHaveValue('1');
  27 |  await page.locator('#recognitionLeniency').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#recognitionLeniency')).toHaveValue('2');
  28 |  await page.setViewportSize({width:390,height:844});await page.locator('#recognitionLeniency').scrollIntoViewIfNeeded();await expect(page.locator('#recognitionLeniency')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  29 |  await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/settings-mobile.png`});
  30 | });
  31 | 
  32 | test('real recognizer feedback paints matching arm green, missing preparation red and lost data neutral',async({page})=>{
  33 |  await camera(page);await setPose(page,'down',0);await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','adjust');await expect.poll(async()=>(await palette(page)).red).toBeGreaterThan(8);await expect(page.locator('#chopValue')).toHaveText('0/15');
  34 |  await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/feedback-red-synthetic.png`});
  35 |  await setPose(page,'raised',0);await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','matched');await expect.poll(async()=>(await palette(page)).green).toBeGreaterThan(8);
  36 |  await page.screenshot({path:`${output}/feedback-green-synthetic.png`});
  37 |  await page.evaluate(()=>{window.poseFixture.low=true;});await expect(page.locator('#setupModal')).toBeVisible({timeout:10000});await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','unavailable');
  38 |  await expect.poll(async()=>(await palette(page)).red+(await palette(page)).green).toBe(0);expect((await palette(page)).gray).toBeGreaterThan(8);
  39 | });
  40 | 
  41 | test('changing tolerance keeps calibration and device resources but drops a partial rep',async({page})=>{
  42 |  await camera(page);await setPose(page,'raised',0);await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await setPose(page,'down',0);await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');
  43 |  const before=await resources(page);expect(before.tracks).toHaveLength(1);expect(before.workers).toBe(1);await page.locator('#cameraMode').click();await page.locator('[data-leniency="5"]').click();
  44 |  await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step','complete');await expect(page.locator('#beginCamera')).toBeEnabled();await expect(page.locator('#statusTag')).toHaveText('已暂停');expect(await resources(page)).toEqual(before);
  45 |  await page.locator('#beginCamera').click();await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#statusTag')).toHaveText('已暂停');await page.locator('#pauseBtn').click();
  46 |  await setPose(page,'raised',500);await expect(page.locator('#chopValue')).toHaveText('0/15');await completeSyntheticChop(page,1);expect(await resources(page)).toEqual(before);
  47 | });
  48 | 
  49 | test('wide tolerance completes all real recognizer tasks and carry setting changes never fill paused time',async({page})=>{
  50 |  test.setTimeout(180000);await page.addInitScript(()=>localStorage.setItem('tidal.recognition.leniency.v1','5'));await camera(page);
  51 |  for(let rep=1;rep<=15;rep++)await completeSyntheticChop(page,rep);
  52 |  await expect(page.locator('#missionTitle')).toHaveText('把木材装上手推车');await expect(page.locator('#statusTag')).toHaveText('训练中');
  53 |  for(let rep=1;rep<=15;rep++){
  54 |   await setPose(page,'standing',0);await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await setPose(page,'squat',0);await expect(page.locator('#inputDebug')).toContainText(' · squat-down ·');
  55 |   await setPose(page,'standing',0);await expect(page.locator('#inputDebug')).toContainText(' · stand-up ·');await setPose(page,'press',0);await expect(page.locator('#inputDebug')).toContainText(' · press-up ·');await setPose(page,'standing',0);await expect(page.locator('#loadValue')).toHaveText(`${rep}/15`);
  56 |  }
  57 |  await expect(page.locator('#missionTitle')).toHaveText('推车返回农场');await expect(page.locator('#statusTag')).toHaveText('训练中');await setPose(page,'hold',0);await expect.poll(async()=>parseFloat((await page.locator('#carryValue').textContent())!)).toBeGreaterThan(.1);
  58 |  await page.locator('#cameraMode').click();const before=await outcomes(page);const device=await resources(page);await page.locator('[data-leniency="1"]').click();await page.waitForTimeout(600);expect(await outcomes(page)).toEqual(before);expect(await resources(page)).toEqual(device);
  59 |  await page.locator('#beginCamera').click();await page.locator('#pauseBtn').click();await page.waitForTimeout(250);expect(await outcomes(page)).toEqual(before);
  60 |  await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
  61 |  await writeFile(`${output}/full-flow-synthetic.json`,JSON.stringify({input:'Fake video and authored landmarks through actual recognizers; not physical camera',levels:[5,1],resources:device,result:'15 chop,15 load,carry completion; setting interval not credited'},null,2));
  62 | });
  63 | 
```