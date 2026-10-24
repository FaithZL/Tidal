# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: source-lifecycle.diagnostic.spec.ts >> synthetic camera pipeline completes the farm through real recognizers and releases resources
- Location: tests/e2e/source-lifecycle.diagnostic.spec.ts:37:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('#loadValue')
Expected: "1/15"
Received: "0/15"
Timeout:  7000ms

Call log:
  - Expect "toHaveText" locator('#loadValue') with timeout 7000ms
  - waiting for locator('#loadValue')
    18 × locator resolved to <strong id="loadValue">0/15</strong>
       - unexpected value "0/15"

```

```yaml
- strong: 0/15
```

# Test source

```ts
  1  | import {test,expect} from '../helpers/manualModeTest.js';
  2  | import {mkdir,writeFile} from 'node:fs/promises';
  3  | import {installPoseFixture,prepareCamera,setPose,completeSyntheticChop} from '../helpers/browserPoseFixture.js';
  4  | 
  5  | // Temporary read-only instrumentation, removed after investigation.
  6  | const diagnosticRecords = new Map<string,string[]>();
  7  | test.beforeEach(async ({page},info)=>{
  8  |   const records:string[]=[];diagnosticRecords.set(info.title,records);
  9  |   page.on('console',message=>{if(message.text().startsWith('TIDAL_DIAG '))records.push(message.text().slice(11));});
  10 |   await page.route('**/src/pose/poseWorkerClient.ts',async route=>{
  11 |     const response=await route.fetch();let body=await response.text();
  12 |     body=body.replace('void this.bitmap(video).then((bitmap) => {',`const bitmapStart=performance.now();
  13 |       void this.bitmap(video).then((bitmap) => {
  14 |         if(performance.now()-bitmapStart>100)console.log('TIDAL_DIAG '+JSON.stringify({bitmapMs:performance.now()-bitmapStart,capturedAtMs,now:performance.now()}));`);
  15 |     await route.fulfill({response,body});
  16 |   });
  17 |   await page.route('**/src/pose/calibrationSession.ts',async route=>{
  18 |     const response=await route.fetch();let body=await response.text();
  19 |     body=body.replace('ingest(frame, nowMs) {',`ingest(frame, nowMs) {
  20 |       const ring=globalThis.__tidalFrames??=[];
  21 |       ring.push({nowMs,id:frame.frameId,captured:frame.capturedAtMs,gap:this.lastSeen?frame.capturedAtMs-this.lastSeen.time:null,age:nowMs-frame.capturedAtMs,pose:window.poseFixture.pose,videoTime:document.getElementById('cameraVideo').currentTime,step:this.stepIndex});
  22 |       if(ring.length>12)ring.shift();`);
  23 |     body=body.replace('invalidate(reason) {',`invalidate(reason) {
  24 |       if(reason)console.log('TIDAL_DIAG '+JSON.stringify({reason,now:performance.now(),frames:globalThis.__tidalFrames,stack:new Error().stack}));`);
  25 |     await route.fulfill({response,body});
  26 |   });
  27 | });
  28 | test.afterEach(async ({},info)=>{
  29 |   await writeFile('artifacts/qa/source-lifecycle-20261025/diagnostic-'+info.line+'.json',JSON.stringify(diagnosticRecords.get(info.title),null,2));
  30 | });
  31 | 
  32 | test.use({baseURL:'http://127.0.0.1:4174',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  33 | test('camera start stays disabled without calibration and simulation cannot enable it',async({page})=>{
  34 |   await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();await expect(page.locator('#beginCamera')).toBeDisabled();
  35 |   await page.locator('#setupDemoToggle').click();await expect(page.locator('#beginCamera')).toBeHidden();
  36 | });
  37 | test('synthetic camera pipeline completes the farm through real recognizers and releases resources',async({page})=>{
  38 |   test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await installPoseFixture(page);
  39 |   await page.goto('/?e2e=1');await prepareCamera(page);await page.locator('#beginCamera').click();
  40 |   await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#actionBtn')).toBeDisabled();
  41 |   await page.keyboard.press('Space');await expect(page.locator('#chopValue')).toHaveText('0/15');
  42 |   for(let i=1;i<=15;i++)await completeSyntheticChop(page,i);
  43 |   await expect(page.locator('#missionTitle')).toContainText('装');await expect(page.locator('#statusTag')).toHaveText('训练中');
> 44 |   for(let i=1;i<=15;i++){await setPose(page,'standing');await setPose(page,'squat');await setPose(page,'press');await setPose(page,'standing',550);await expect(page.locator('#loadValue')).toHaveText(`${i}/15`);}
     |                                                                                                                                                                                             ^ Error: expect(locator).toHaveText(expected) failed
  45 |   await expect(page.locator('#statusTag')).toHaveText('训练中');await setPose(page,'hold',900);
  46 |   await page.locator('#pauseBtn').click();const carry=await page.locator('#carryValue').textContent();await page.waitForTimeout(500);await expect(page.locator('#carryValue')).toHaveText(carry!);
  47 |   await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});
  48 |   await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#systemStatus')).not.toContainText('请重新准备');
  49 |   await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
  50 |   await expect(page.locator('#actualMetrics')).toContainText('摄像头姿态代理');await expect.poll(()=>page.evaluate(()=>window.poseFixture.workers)).toBe(0);
  51 |   expect(await page.evaluate(()=>window.poseFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);expect(errors).toEqual([]);
  52 |   await page.evaluate(()=>{const b=document.createElement('div');b.textContent='QA 合成33点 / 模拟Worker → 真实识别器与领域；非真机验收';b.style.cssText='position:fixed;z-index:99;top:0;background:#5b3620;color:white;padding:8px';document.body.appendChild(b);});
  53 |   await mkdir('artifacts/qa/t09',{recursive:true});await page.screenshot({path:'artifacts/qa/t09/synthetic-camera-results.png',fullPage:true});
  54 |   await writeFile('artifacts/qa/t09/camera-flow.json',JSON.stringify({input:'authored synthetic points + fake video + Worker stub; real recognizers/domain',cameraHardware:'manual_pending',result:'pass',errors},null,2));
  55 |   await page.locator('#resultsHome').click();await expect(page.locator('#chopValue')).toHaveText('0/15');
  56 | });
  57 | test('tracking loss pauses, clears readiness and allows explicit keyboard fallback with honest mixed results',async({page})=>{
  58 |   test.setTimeout(70000);await installPoseFixture(page);await page.goto('/?e2e=1');await prepareCamera(page);await page.locator('#beginCamera').click();
  59 |   await expect(page.locator('#statusTag')).toHaveText('训练中');await setPose(page,'raised');await setPose(page,'down');
  60 |   await page.evaluate(()=>{window.poseFixture.low=true;});await expect(page.locator('#setupModal')).toBeVisible();
  61 |   await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#chopValue')).toHaveText('0/15');
  62 |   await page.locator('#beginDemo').click();await expect(page.locator('#setupModal')).toBeHidden();
  63 |   await expect.poll(()=>page.evaluate(()=>window.poseFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.poseFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);
  64 |   await page.locator('#demoToggle').click();await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:30000});
  65 |   await expect(page.locator('#actualMetrics')).toContainText('混合');await expect(page.locator('#actualMetrics')).toContainText('模拟');
  66 | });
  67 | 
  68 | test('a stalled camera during rest cannot start the next active task without preparation',async({page})=>{
  69 |   test.setTimeout(70000);await installPoseFixture(page);await page.goto('/?e2e=1');await prepareCamera(page);await page.locator('#beginCamera').click();
  70 |   await expect(page.locator('#statusTag')).toHaveText('训练中');
  71 |   await page.evaluate(()=>{
  72 |     const count=document.getElementById('chopValue')!,status=document.getElementById('statusTag')!;
  73 |     const phases:string[]=[];
  74 |     const observer=new MutationObserver(()=>{
  75 |       if(count.textContent==='15/15')window.poseFixture.stalled=true;
  76 |       if(window.poseFixture.stalled&&phases.at(-1)!==status.textContent){phases.push(status.textContent!);document.body.dataset.stalledPhases=JSON.stringify(phases);}
  77 |     });
  78 |     observer.observe(count,{childList:true});observer.observe(status,{childList:true});
  79 |   });
  80 |   for(let i=1;i<=15;i++)await completeSyntheticChop(page,i);
  81 |   await page.waitForTimeout(800);
  82 |   // Even a brief active transition violates the next-task preparation gate.
  83 |   expect(await page.evaluate(()=>JSON.parse(document.body.dataset.stalledPhases!))).not.toContain('训练中');
  84 |   expect(await page.locator('#setupModal').isVisible()).toBe(true);
  85 |   await expect(page.locator('#loadValue')).toHaveText('0/15');
  86 | });
  87 | 
```