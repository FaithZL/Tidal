# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: source-lifecycle.spec.ts >> a stalled camera during rest cannot start the next active task without preparation
- Location: tests\e2e\source-lifecycle.spec.ts:40:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('#chopValue')
Expected: "13/15"
Received: "12/15"
Timeout:  7000ms

Call log:
  - Expect "toHaveText" locator('#chopValue') with timeout 7000ms
  - waiting for locator('#chopValue')
    18 × locator resolved to <strong id="chopValue">12/15</strong>
       - unexpected value "12/15"

```

```yaml
- strong: 12/15
```

# Test source

```ts
  1  | import {test,expect} from '../helpers/manualModeTest.js';
  2  | import {mkdir,writeFile} from 'node:fs/promises';
  3  | import {installPoseFixture,prepareCamera,setPose} from '../helpers/browserPoseFixture.js';
  4  | test.use({baseURL:'http://127.0.0.1:4174',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  5  | test('camera start stays disabled without calibration and simulation cannot enable it',async({page})=>{
  6  |   await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();await expect(page.locator('#beginCamera')).toBeDisabled();
  7  |   await page.locator('#setupDemoToggle').click();await expect(page.locator('#beginCamera')).toBeHidden();
  8  | });
  9  | test('synthetic camera pipeline completes the farm through real recognizers and releases resources',async({page})=>{
  10 |   test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await installPoseFixture(page);
  11 |   await page.goto('/?e2e=1');await prepareCamera(page);await page.locator('#beginCamera').click();
  12 |   await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#actionBtn')).toBeDisabled();
  13 |   await page.keyboard.press('Space');await expect(page.locator('#chopValue')).toHaveText('0/15');
  14 |   for(let i=1;i<=15;i++){await setPose(page,'raised');await setPose(page,'down');await setPose(page,'raised',500);await expect(page.locator('#chopValue')).toHaveText(`${i}/15`);}
  15 |   await expect(page.locator('#missionTitle')).toContainText('装');await expect(page.locator('#statusTag')).toHaveText('训练中');
  16 |   for(let i=1;i<=15;i++){await setPose(page,'standing');await setPose(page,'squat');await setPose(page,'press');await setPose(page,'standing',550);await expect(page.locator('#loadValue')).toHaveText(`${i}/15`);}
  17 |   await expect(page.locator('#statusTag')).toHaveText('训练中');await setPose(page,'hold',900);
  18 |   await page.locator('#pauseBtn').click();const carry=await page.locator('#carryValue').textContent();await page.waitForTimeout(500);await expect(page.locator('#carryValue')).toHaveText(carry!);
  19 |   await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});
  20 |   await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#systemStatus')).not.toContainText('请重新准备');
  21 |   await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
  22 |   await expect(page.locator('#actualMetrics')).toContainText('摄像头姿态代理');await expect.poll(()=>page.evaluate(()=>window.poseFixture.workers)).toBe(0);
  23 |   expect(await page.evaluate(()=>window.poseFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);expect(errors).toEqual([]);
  24 |   await page.evaluate(()=>{const b=document.createElement('div');b.textContent='QA 合成33点 / 模拟Worker → 真实识别器与领域；非真机验收';b.style.cssText='position:fixed;z-index:99;top:0;background:#5b3620;color:white;padding:8px';document.body.appendChild(b);});
  25 |   await mkdir('artifacts/qa/t09',{recursive:true});await page.screenshot({path:'artifacts/qa/t09/synthetic-camera-results.png',fullPage:true});
  26 |   await writeFile('artifacts/qa/t09/camera-flow.json',JSON.stringify({input:'authored synthetic points + fake video + Worker stub; real recognizers/domain',cameraHardware:'manual_pending',result:'pass',errors},null,2));
  27 |   await page.locator('#resultsHome').click();await expect(page.locator('#chopValue')).toHaveText('0/15');
  28 | });
  29 | test('tracking loss pauses, clears readiness and allows explicit keyboard fallback with honest mixed results',async({page})=>{
  30 |   test.setTimeout(70000);await installPoseFixture(page);await page.goto('/?e2e=1');await prepareCamera(page);await page.locator('#beginCamera').click();
  31 |   await expect(page.locator('#statusTag')).toHaveText('训练中');await setPose(page,'raised');await setPose(page,'down');
  32 |   await page.evaluate(()=>{window.poseFixture.low=true;});await expect(page.locator('#setupModal')).toBeVisible();
  33 |   await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#chopValue')).toHaveText('0/15');
  34 |   await page.locator('#beginDemo').click();await expect(page.locator('#setupModal')).toBeHidden();
  35 |   await expect.poll(()=>page.evaluate(()=>window.poseFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.poseFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);
  36 |   await page.locator('#demoToggle').click();await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:30000});
  37 |   await expect(page.locator('#actualMetrics')).toContainText('混合');await expect(page.locator('#actualMetrics')).toContainText('模拟');
  38 | });
  39 |
  40 | test('a stalled camera during rest cannot start the next active task without preparation',async({page})=>{
  41 |   test.setTimeout(70000);await installPoseFixture(page);await page.goto('/?e2e=1');await prepareCamera(page);await page.locator('#beginCamera').click();
  42 |   await expect(page.locator('#statusTag')).toHaveText('训练中');
  43 |   await page.evaluate(()=>{
  44 |     const count=document.getElementById('chopValue')!,status=document.getElementById('statusTag')!;
  45 |     const phases:string[]=[];
  46 |     const observer=new MutationObserver(()=>{
  47 |       if(count.textContent==='15/15')window.poseFixture.stalled=true;
  48 |       if(window.poseFixture.stalled&&phases.at(-1)!==status.textContent){phases.push(status.textContent!);document.body.dataset.stalledPhases=JSON.stringify(phases);}
  49 |     });
  50 |     observer.observe(count,{childList:true});observer.observe(status,{childList:true});
  51 |   });
  52 |   for(let i=1;i<=15;i++){
  53 |     await setPose(page,'raised');await setPose(page,'down');await setPose(page,'raised',i===15?0:500);
> 54 |     await expect(page.locator('#chopValue')).toHaveText(`${i}/15`);
     |                                              ^ Error: expect(locator).toHaveText(expected) failed
  55 |   }
  56 |   await page.waitForTimeout(800);
  57 |   // Even a brief active transition violates the next-task preparation gate.
  58 |   expect(await page.evaluate(()=>JSON.parse(document.body.dataset.stalledPhases!))).not.toContain('训练中');
  59 |   expect(await page.locator('#setupModal').isVisible()).toBe(true);
  60 |   await expect(page.locator('#loadValue')).toHaveText('0/15');
  61 | });
  62 |
```
