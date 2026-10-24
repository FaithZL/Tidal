# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: source-lifecycle.spec.ts >> synthetic camera pipeline completes the farm through real recognizers and releases resources
- Location: tests/e2e/source-lifecycle.spec.ts:10:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('#loadValue')
Expected: "9/15"
Received: "8/15"
Timeout:  7000ms

Call log:
  - Expect "toHaveText" locator('#loadValue') with timeout 7000ms
  - waiting for locator('#loadValue')
    18 × locator resolved to <strong id="loadValue">8/15</strong>
       - unexpected value "8/15"

```

```yaml
- strong: 8/15
```

# Test source

```ts
  1  | import {test,expect} from '../helpers/manualModeTest.js';
  2  | import {mkdir,writeFile} from 'node:fs/promises';
  3  | import {installPoseFixture,prepareCamera,setPose,completeSyntheticChop} from '../helpers/browserPoseFixture.js';
  4  | // Keep real rendering and wall-clock input gates; reduce software-GL raster load for this input lifecycle suite.
  5  | test.use({deviceScaleFactor:0.5,baseURL:'http://127.0.0.1:4174',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  6  | test('camera start stays disabled without calibration and simulation cannot enable it',async({page})=>{
  7  |   await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();await expect(page.locator('#beginCamera')).toBeDisabled();
  8  |   await page.locator('#setupDemoToggle').click();await expect(page.locator('#beginCamera')).toBeHidden();
  9  | });
  10 | test('synthetic camera pipeline completes the farm through real recognizers and releases resources',async({page})=>{
  11 |   test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await installPoseFixture(page);
  12 |   await page.goto('/?e2e=1');await prepareCamera(page);await page.locator('#beginCamera').click();
  13 |   await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#actionBtn')).toBeDisabled();
  14 |   await page.keyboard.press('Space');await expect(page.locator('#chopValue')).toHaveText('0/15');
  15 |   for(let i=1;i<=15;i++)await completeSyntheticChop(page,i);
  16 |   await expect(page.locator('#missionTitle')).toContainText('装');await expect(page.locator('#statusTag')).toHaveText('训练中');
> 17 |   for(let i=1;i<=15;i++){await setPose(page,'standing');await setPose(page,'squat');await setPose(page,'press');await setPose(page,'standing',550);await expect(page.locator('#loadValue')).toHaveText(`${i}/15`);}
     |                                                                                                                                                                                             ^ Error: expect(locator).toHaveText(expected) failed
  18 |   await expect(page.locator('#statusTag')).toHaveText('训练中');await setPose(page,'hold',900);
  19 |   await page.locator('#pauseBtn').click();const carry=await page.locator('#carryValue').textContent();await page.waitForTimeout(500);await expect(page.locator('#carryValue')).toHaveText(carry!);
  20 |   await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});
  21 |   await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#systemStatus')).not.toContainText('请重新准备');
  22 |   await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
  23 |   await expect(page.locator('#actualMetrics')).toContainText('摄像头姿态代理');await expect.poll(()=>page.evaluate(()=>window.poseFixture.workers)).toBe(0);
  24 |   expect(await page.evaluate(()=>window.poseFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);expect(errors).toEqual([]);
  25 |   await page.evaluate(()=>{const b=document.createElement('div');b.textContent='QA 合成33点 / 模拟Worker → 真实识别器与领域；非真机验收';b.style.cssText='position:fixed;z-index:99;top:0;background:#5b3620;color:white;padding:8px';document.body.appendChild(b);});
  26 |   await mkdir('artifacts/qa/t09',{recursive:true});await page.screenshot({path:'artifacts/qa/t09/synthetic-camera-results.png',fullPage:true});
  27 |   await writeFile('artifacts/qa/t09/camera-flow.json',JSON.stringify({input:'authored synthetic points + fake video + Worker stub; real recognizers/domain',cameraHardware:'manual_pending',result:'pass',errors},null,2));
  28 |   await page.locator('#resultsHome').click();await expect(page.locator('#chopValue')).toHaveText('0/15');
  29 | });
  30 | test('tracking loss pauses, clears readiness and allows explicit keyboard fallback with honest mixed results',async({page})=>{
  31 |   test.setTimeout(70000);await installPoseFixture(page);await page.goto('/?e2e=1');await prepareCamera(page);await page.locator('#beginCamera').click();
  32 |   await expect(page.locator('#statusTag')).toHaveText('训练中');await setPose(page,'raised');await setPose(page,'down');
  33 |   await page.evaluate(()=>{window.poseFixture.low=true;});await expect(page.locator('#setupModal')).toBeVisible();
  34 |   await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#chopValue')).toHaveText('0/15');
  35 |   await page.locator('#beginDemo').click();await expect(page.locator('#setupModal')).toBeHidden();
  36 |   await expect.poll(()=>page.evaluate(()=>window.poseFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.poseFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);
  37 |   await page.locator('#demoToggle').click();await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:30000});
  38 |   await expect(page.locator('#actualMetrics')).toContainText('混合');await expect(page.locator('#actualMetrics')).toContainText('模拟');
  39 | });
  40 | 
  41 | test('a stalled camera during rest cannot start the next active task without preparation',async({page})=>{
  42 |   test.setTimeout(70000);await installPoseFixture(page);await page.goto('/?e2e=1');await prepareCamera(page);await page.locator('#beginCamera').click();
  43 |   await expect(page.locator('#statusTag')).toHaveText('训练中');
  44 |   await page.evaluate(()=>{
  45 |     const count=document.getElementById('chopValue')!,status=document.getElementById('statusTag')!;
  46 |     const phases:string[]=[];
  47 |     const observer=new MutationObserver(()=>{
  48 |       if(count.textContent==='15/15')window.poseFixture.stalled=true;
  49 |       if(window.poseFixture.stalled&&phases.at(-1)!==status.textContent){phases.push(status.textContent!);document.body.dataset.stalledPhases=JSON.stringify(phases);}
  50 |     });
  51 |     observer.observe(count,{childList:true});observer.observe(status,{childList:true});
  52 |   });
  53 |   for(let i=1;i<=15;i++)await completeSyntheticChop(page,i);
  54 |   await page.waitForTimeout(800);
  55 |   // Even a brief active transition violates the next-task preparation gate.
  56 |   expect(await page.evaluate(()=>JSON.parse(document.body.dataset.stalledPhases!))).not.toContain('训练中');
  57 |   expect(await page.locator('#setupModal').isVisible()).toBe(true);
  58 |   await expect(page.locator('#loadValue')).toHaveText('0/15');
  59 | });
  60 | 
```