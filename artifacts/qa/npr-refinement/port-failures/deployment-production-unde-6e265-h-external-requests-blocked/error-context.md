# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: deployment.spec.ts >> production under /tidal/ >> all local assets and real MediaPipe inference work with external requests blocked
- Location: tests\e2e\deployment.spec.ts:90:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

Call Log:
- Timeout 7000ms exceeded while waiting on the predicate
```

# Test source

```ts
  1   | import {test,expect,type Page} from '../helpers/manualModeTest.js';
  2   | import {spawn,execFile,type ChildProcess} from 'node:child_process';
  3   | import {promisify} from 'node:util';
  4   | import {mkdir,writeFile} from 'node:fs/promises';
  5   | import {installPoseFixture} from '../helpers/browserPoseFixture.js';
  6   | 
  7   | test.use({launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  8   | const output='artifacts/qa/3d/deployment';
  9   | async function inViewport(page:Page,selector:string){
  10  |   const box=await page.locator(selector).boundingBox(),v=page.viewportSize()!;
  11  |   expect(box,selector).not.toBeNull();expect(box!.x,selector).toBeGreaterThanOrEqual(0);expect(box!.y,selector).toBeGreaterThanOrEqual(0);
  12  |   expect(box!.x+box!.width,selector).toBeLessThanOrEqual(v.width);expect(box!.y+box!.height,selector).toBeLessThanOrEqual(v.height);
  13  | }
  14  | 
  15  | for(const [width,height]of [[1280,720],[1366,768],[1920,1080]])test(`desktop ${width}x${height} keeps controls visible through a complete simulated session`,async({page})=>{
  16  |   await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:4174/?e2e=1');await page.locator('#cancelPlan').click();
  17  |   for(const id of ['worldCanvas','actionBtn','modeBadge','statusTag','demoToggle'])await inViewport(page,`#${id}`);
  18  |   const canvas=await page.locator('#worldCanvas canvas').boundingBox();expect(canvas!.width/canvas!.height).toBeCloseTo(width/height,3);
  19  |   await page.locator('#actionBtn').click();await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();
  20  |   await page.locator('#beginDemo').scrollIntoViewIfNeeded();await inViewport(page,'#beginDemo');await page.locator('#beginDemo').click();
  21  |   await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#pauseBtn').click();
  22  |   for(const id of ['worldCanvas','actionBtn','modeBadge','statusTag','pauseBtn'])await inViewport(page,`#${id}`);
  23  |   await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/desktop-${width}x${height}.png`});
  24  |   await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:20000});
  25  |   await page.locator('#resultsHome').scrollIntoViewIfNeeded();await inViewport(page,'#resultsHome');await page.locator('#resultsHome').click();
  26  | });
  27  | 
  28  | test('audio requires explicit unlock, can mute and failure leaves the farm usable',async({page})=>{
  29  |   await page.addInitScript(()=>{
  30  |     const Original=window.AudioContext;let count=0;
  31  |     window.AudioContext=class extends Original{constructor(...args:ConstructorParameters<typeof AudioContext>){super(...args);document.body.dataset.audioContexts=String(++count);}};
  32  |   });
  33  |   await page.goto('/');await page.locator('#cancelPlan').click();expect(await page.locator('body').getAttribute('data-audio-contexts')).toBeNull();
  34  |   await expect(page.locator('#audioToggle')).toHaveAttribute('aria-pressed','false');await page.locator('#audioToggle').click();
  35  |   await expect(page.locator('#audioToggle')).toHaveAttribute('aria-pressed','true');await expect(page.locator('body')).toHaveAttribute('data-audio-contexts','1');
  36  |   await page.locator('#audioToggle').click();await expect(page.locator('#audioToggle')).toHaveAttribute('aria-pressed','false');
  37  |   await page.addInitScript(()=>{window.AudioContext=class{constructor(){throw new Error('test unavailable');}} as unknown as typeof AudioContext;});
  38  |   await page.reload();await page.locator('#cancelPlan').click();await page.locator('#audioToggle').click();
  39  |   await expect(page.locator('#audioToggle')).toContainText('不可用');await page.locator('#actionBtn').click();await expect(page.locator('#planModal')).toBeVisible();
  40  | });
  41  | 
  42  | test('ten camera start-exit-reset cycles release tracks workers timers and listeners without sustained heap growth',async({page,context})=>{
  43  |   test.setTimeout(90000);await installPoseFixture(page);
  44  |   await page.addInitScript(()=>{
  45  |     const active=new Set<number>(),set=window.setInterval.bind(window),clear=window.clearInterval.bind(window);
  46  |     window.setInterval=((fn:TimerHandler,delay?:number,...args:unknown[])=>{const id=set(fn,delay,...args);active.add(id);return id;}) as typeof window.setInterval;
  47  |     window.clearInterval=((id?:number)=>{if(id!==undefined)active.delete(id);clear(id);}) as typeof window.clearInterval;
  48  |     Object.defineProperty(window,'activeIntervals',{get:()=>active.size});
  49  |     const pending=new Set<number>(),later=window.setTimeout.bind(window),cancel=window.clearTimeout.bind(window);
  50  |     window.setTimeout=((handler:TimerHandler,delay?:number,...args:unknown[])=>{
  51  |       if(typeof handler!=='function')return later(handler,delay,...args);
  52  |       const id=later(()=>{pending.delete(id);handler.apply(window,args);},delay);pending.add(id);return id;
  53  |     }) as typeof window.setTimeout;
  54  |     window.clearTimeout=((id?:number)=>{if(id!==undefined)pending.delete(id);cancel(id);}) as typeof window.clearTimeout;
  55  |     Object.defineProperty(window,'activeTimeouts',{get:()=>pending.size});
  56  |   });
  57  |   await page.goto('/');const cdp=await context.newCDPSession(page);const samples=[];
  58  |   for(let cycle=1;cycle<=10;cycle++){
  59  |     await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();await expect(page.locator('#cameraFrames')).not.toHaveText('0');
  60  |     await page.locator('#backHome').click();await expect(page.locator('#planModal')).toBeVisible();await expect.poll(()=>page.evaluate(()=>window.poseFixture.workers)).toBe(0);
  61  |     const resources=await page.evaluate(()=>({tracks:window.poseFixture.tracks.map(t=>t.readyState),workers:window.poseFixture.workers,maxWorkers:window.poseFixture.maxWorkers,intervals:Reflect.get(window,'activeIntervals') as number,timeouts:Reflect.get(window,'activeTimeouts') as number}));
  62  |     expect(resources.tracks.every(s=>s==='ended')).toBe(true);expect(resources.maxWorkers).toBe(1);
  63  |     const track=await cdp.send('Runtime.evaluate',{expression:'window.poseFixture.tracks[0]',objectGroup:'lifecycle'});
  64  |     const listeners=await cdp.send('DOMDebugger.getEventListeners',{objectId:track.result.objectId!});
  65  |     await cdp.send('Runtime.releaseObjectGroup',{objectGroup:'lifecycle'});
  66  |     // Avoid the test harness itself retaining ended native tracks across cycles.
  67  |     await page.evaluate(()=>{window.poseFixture.tracks=[];});await cdp.send('HeapProfiler.collectGarbage');
  68  |     const heap=await cdp.send('Runtime.getHeapUsage'),dom=await cdp.send('Memory.getDOMCounters');
  69  |     samples.push({cycle,...resources,endedTrackListeners:listeners.listeners.map(l=>l.type),usedHeap:heap.usedSize,...dom});
  70  |   }
  71  |   await mkdir(output,{recursive:true});await writeFile(`${output}/ten-cycle-resources.json`,JSON.stringify({input:'fake video + synthetic Worker; actual UI/camera lifecycle',method:'ended tracks, live worker/interval counts, Chromium CDP after forced GC; 5MB trend guard',samples},null,2));
  72  |   expect(samples.every(s=>s.intervals===samples[0].intervals)).toBe(true);
  73  |   expect(samples.every(s=>s.timeouts<=samples[0].timeouts+1)).toBe(true);
  74  |   expect(samples.every(s=>s.endedTrackListeners.length===0)).toBe(true);
  75  |   expect(samples.at(-1)!.jsEventListeners).toBeLessThanOrEqual(samples[0].jsEventListeners+2);
  76  |   // A trend guard, not an exact memory promise; allow runtime/graphics caches to warm up.
  77  |   expect(samples.at(-1)!.usedHeap-samples[2].usedHeap).toBeLessThan(5_000_000);
  78  | });
  79  | 
  80  | test.describe('production under /tidal/',()=>{
  81  |   let server:ChildProcess;
  82  |   const url='http://127.0.0.1:4176/tidal/';
  83  |   test.beforeAll(async()=>{
  84  |     await promisify(execFile)(process.execPath,['node_modules/vite/bin/vite.js','build','--base','/tidal/','--outDir','dist-subpath'],{windowsHide:true});
  85  |     server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--base','/tidal/','--outDir','dist-subpath','--port','4176','--strictPort'],{windowsHide:true,stdio:'ignore'});
  86  |     for(let n=0;n<100;n++){if(await fetch(url).then(r=>r.ok,()=>false))return;await new Promise(resolve=>setTimeout(resolve,100));}
  87  |     throw new Error('Subpath preview failed to start');
  88  |   });
  89  |   test.afterAll(()=>{server?.kill();});
  90  |   test('all local assets and real MediaPipe inference work with external requests blocked',async({page,context})=>{
  91  |     const requests:string[]=[],external:string[]=[],errors:string[]=[];
  92  |     page.on('pageerror',e=>errors.push(e.message));
  93  |     await context.route('**/*',route=>{const u=new URL(route.request().url());requests.push(u.href);if(u.origin!==new URL(url).origin){external.push(u.href);return route.abort();}return route.continue();});
> 94  |     await page.goto(url);await expect.poll(()=>page.locator('.prize img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
      |                                                                                                                                               ^ Error: expect(received).toBe(expected) // Object.is equality
  95  |     await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();await expect(page.locator('#cameraStatus')).toContainText('推理中',{timeout:35000});await expect(page.locator('#cameraFrames')).not.toHaveText('0');
  96  |     expect(requests.some(u=>u.includes('/tidal/models/'))).toBe(true);expect(requests.some(u=>u.includes('/tidal/mediapipe/')&&u.endsWith('.wasm'))).toBe(true);
  97  |     expect(external).toEqual([]);expect(errors).toEqual([]);await page.locator('#backHome').click();
  98  |     await mkdir(output,{recursive:true});await writeFile(`${output}/subpath.json`,JSON.stringify({url,browser:page.context().browser()!.version(),input:'Chromium fake video; real local MediaPipe CPU Worker, not a physical camera',external,errors,requests,result:'pass'},null,2));
  99  |   });
  100 |   for(const asset of ['models/pose_landmarker_lite.task','mediapipe/wasm/*.wasm'])test(`${asset} 404 reports failure and releases capture`,async({page})=>{
  101 |     await page.route(`**/tidal/${asset}`,route=>route.fulfill({status:404,body:'missing test asset'}));
  102 |     await page.goto(url);await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();
  103 |     await expect(page.locator('#cameraStatus')).toContainText(/失败|404|超时/,{timeout:35000});await expect(page.locator('#cameraStart')).toBeEnabled();
  104 |     expect(await page.locator('#cameraVideo').evaluate((v:HTMLVideoElement)=>v.srcObject)).toBeNull();await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  105 |   });
  106 | });
  107 | 
```