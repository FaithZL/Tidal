# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: deployment.spec.ts >> production under /tidal/ >> the supplied character and house load locally under the same subpath
- Location: tests\e2e\deployment.spec.ts:113:3

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#motionStage')
Expected: "static"
Received: "derived-skeleton"
Timeout:  7000ms

Call log:
  - Expect "toHaveAttribute" locator('#motionStage') with timeout 7000ms
  - waiting for locator('#motionStage')
    - locator resolved to <main data-paints="2" id="motionStage" data-phase="idle" data-time="0.0000" data-assets="ready" data-view="character" data-blade="-2.2963,0.2412,1.9732" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main data-paints="3" id="motionStage" data-phase="idle" data-time="0.0167" data-assets="ready" data-view="character" data-blade="-2.2963,0.2413,1.9732" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main data-paints="6" id="motionStage" data-phase="idle" data-time="0.1000" data-assets="ready" data-view="character" data-blade="-2.2963,0.2417,1.9732" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main id="motionStage" data-paints="11" data-phase="idle" data-time="0.2000" data-assets="ready" data-view="character" data-blade="-2.2963,0.2423,1.9732" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main id="motionStage" data-paints="16" data-phase="idle" data-time="0.3166" data-assets="ready" data-view="character" data-blade="-2.2963,0.2429,1.9732" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main id="motionStage" data-paints="38" data-phase="idle" data-time="0.8167" data-assets="ready" data-view="character" data-blade="-2.2963,0.2452,1.9732" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main id="motionStage" data-paints="61" data-phase="idle" data-time="1.3500" data-assets="ready" data-view="character" data-blade="-2.2963,0.2468,1.9732" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main id="motionStage" data-paints="83" data-phase="idle" data-time="1.8500" data-assets="ready" data-view="character" data-blade="-2.2963,0.2472,1.9732" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main id="motionStage" data-paints="106" data-phase="idle" data-time="2.3833" data-assets="ready" data-view="character" data-blade="-2.2963,0.2464,1.9732" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main id="motionStage" data-paints="128" data-time="2.9166" data-assets="ready" data-phase="prepare" data-view="character" data-blade="-2.3545,2.3629,2.1225" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main id="motionStage" data-paints="150" data-time="3.4332" data-assets="ready" data-phase="prepare" data-view="character" data-blade="-2.3963,2.8640,0.8420" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main id="motionStage" data-paints="172" data-time="3.9498" data-assets="ready" data-phase="strike" data-view="character" data-blade="-2.2982,2.1808,2.2838" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main id="motionStage" data-paints="194" data-time="4.4665" data-assets="ready" data-phase="recover" data-view="character" data-blade="-2.2320,0.4291,2.4871" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main id="motionStage" data-paints="216" data-time="4.9999" data-assets="ready" data-phase="recover" data-view="character" data-blade="-2.3027,0.5846,2.3292" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main id="motionStage" data-paints="238" data-time="5.5165" data-assets="ready" data-phase="recover" data-view="character" data-blade="-2.2979,0.2415,1.9755" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main id="motionStage" data-paints="260" data-phase="idle" data-time="6.0498" data-assets="ready" data-view="character" data-blade="-2.2963,0.2364,1.9732" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"
    - locator resolved to <main id="motionStage" data-paints="283" data-phase="idle" data-time="6.5664" data-assets="ready" data-view="character" data-blade="-2.2963,0.2385,1.9732" data-motion-support="derived-skeleton">…</main>
    - unexpected value "derived-skeleton"

```

```yaml
- main
```

# Test source

```ts
  17  |   await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:4174/?e2e=1');await page.locator('#cancelPlan').click();
  18  |   for(const id of ['worldCanvas','actionBtn','modeBadge','statusTag','demoToggle'])await inViewport(page,`#${id}`);
  19  |   const canvas=await page.locator('#worldCanvas canvas').boundingBox();expect(canvas!.width/canvas!.height).toBeCloseTo(width/height,3);
  20  |   await page.locator('#actionBtn').click();await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();
  21  |   await page.locator('#beginDemo').scrollIntoViewIfNeeded();await inViewport(page,'#beginDemo');await page.locator('#beginDemo').click();
  22  |   await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#pauseBtn').click();
  23  |   for(const id of ['worldCanvas','actionBtn','modeBadge','statusTag','pauseBtn'])await inViewport(page,`#${id}`);
  24  |   await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/desktop-${width}x${height}.png`});
  25  |   await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:20000});
  26  |   await page.locator('#resultsHome').scrollIntoViewIfNeeded();await inViewport(page,'#resultsHome');await page.locator('#resultsHome').click();
  27  | });
  28  | 
  29  | test('audio requires explicit unlock, can mute and failure leaves the farm usable',async({page})=>{
  30  |   await page.addInitScript(()=>{
  31  |     const Original=window.AudioContext;let count=0;
  32  |     window.AudioContext=class extends Original{constructor(...args:ConstructorParameters<typeof AudioContext>){super(...args);document.body.dataset.audioContexts=String(++count);}};
  33  |   });
  34  |   await page.goto('/');await page.locator('#cancelPlan').click();expect(await page.locator('body').getAttribute('data-audio-contexts')).toBeNull();
  35  |   await expect(page.locator('#audioToggle')).toHaveAttribute('aria-pressed','false');await page.locator('#audioToggle').click();
  36  |   await expect(page.locator('#audioToggle')).toHaveAttribute('aria-pressed','true');await expect(page.locator('body')).toHaveAttribute('data-audio-contexts','1');
  37  |   await page.locator('#audioToggle').click();await expect(page.locator('#audioToggle')).toHaveAttribute('aria-pressed','false');
  38  |   await page.addInitScript(()=>{window.AudioContext=class{constructor(){throw new Error('test unavailable');}} as unknown as typeof AudioContext;});
  39  |   await page.reload();await page.locator('#cancelPlan').click();await page.locator('#audioToggle').click();
  40  |   await expect(page.locator('#audioToggle')).toContainText('不可用');await page.locator('#actionBtn').click();await expect(page.locator('#planModal')).toBeVisible();
  41  | });
  42  | 
  43  | test('ten camera start-exit-reset cycles release tracks workers timers and listeners without sustained heap growth',async({page,context})=>{
  44  |   test.setTimeout(90000);await installPoseFixture(page);
  45  |   await page.addInitScript(()=>{
  46  |     const active=new Set<number>(),set=window.setInterval.bind(window),clear=window.clearInterval.bind(window);
  47  |     window.setInterval=((fn:TimerHandler,delay?:number,...args:unknown[])=>{const id=set(fn,delay,...args);active.add(id);return id;}) as typeof window.setInterval;
  48  |     window.clearInterval=((id?:number)=>{if(id!==undefined)active.delete(id);clear(id);}) as typeof window.clearInterval;
  49  |     Object.defineProperty(window,'activeIntervals',{get:()=>active.size});
  50  |     const pending=new Set<number>(),later=window.setTimeout.bind(window),cancel=window.clearTimeout.bind(window);
  51  |     window.setTimeout=((handler:TimerHandler,delay?:number,...args:unknown[])=>{
  52  |       if(typeof handler!=='function')return later(handler,delay,...args);
  53  |       const id=later(()=>{pending.delete(id);handler.apply(window,args);},delay);pending.add(id);return id;
  54  |     }) as typeof window.setTimeout;
  55  |     window.clearTimeout=((id?:number)=>{if(id!==undefined)pending.delete(id);cancel(id);}) as typeof window.clearTimeout;
  56  |     Object.defineProperty(window,'activeTimeouts',{get:()=>pending.size});
  57  |   });
  58  |   await page.goto('/');const cdp=await context.newCDPSession(page);const samples=[];
  59  |   for(let cycle=1;cycle<=10;cycle++){
  60  |     await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();await expect(page.locator('#cameraFrames')).not.toHaveText('0');
  61  |     await page.locator('#backHome').click();await expect(page.locator('#planModal')).toBeVisible();await expect.poll(()=>page.evaluate(()=>window.poseFixture.workers)).toBe(0);
  62  |     const resources=await page.evaluate(()=>({tracks:window.poseFixture.tracks.map(t=>t.readyState),workers:window.poseFixture.workers,maxWorkers:window.poseFixture.maxWorkers,intervals:Reflect.get(window,'activeIntervals') as number,timeouts:Reflect.get(window,'activeTimeouts') as number}));
  63  |     expect(resources.tracks.every(s=>s==='ended')).toBe(true);expect(resources.maxWorkers).toBe(1);
  64  |     const track=await cdp.send('Runtime.evaluate',{expression:'window.poseFixture.tracks[0]',objectGroup:'lifecycle'});
  65  |     const listeners=await cdp.send('DOMDebugger.getEventListeners',{objectId:track.result.objectId!});
  66  |     await cdp.send('Runtime.releaseObjectGroup',{objectGroup:'lifecycle'});
  67  |     // Avoid the test harness itself retaining ended native tracks across cycles.
  68  |     await page.evaluate(()=>{window.poseFixture.tracks=[];});await cdp.send('HeapProfiler.collectGarbage');
  69  |     const heap=await cdp.send('Runtime.getHeapUsage'),dom=await cdp.send('Memory.getDOMCounters');
  70  |     samples.push({cycle,...resources,endedTrackListeners:listeners.listeners.map(l=>l.type),usedHeap:heap.usedSize,...dom});
  71  |   }
  72  |   await mkdir(output,{recursive:true});await writeFile(`${output}/ten-cycle-resources.json`,JSON.stringify({input:'fake video + synthetic Worker; actual UI/camera lifecycle',method:'ended tracks, live worker/interval counts, Chromium CDP after forced GC; 5MB trend guard',samples},null,2));
  73  |   expect(samples.every(s=>s.intervals===samples[0].intervals)).toBe(true);
  74  |   expect(samples.every(s=>s.timeouts<=samples[0].timeouts+1)).toBe(true);
  75  |   expect(samples.every(s=>s.endedTrackListeners.length===0)).toBe(true);
  76  |   expect(samples.at(-1)!.jsEventListeners).toBeLessThanOrEqual(samples[0].jsEventListeners+2);
  77  |   // A trend guard, not an exact memory promise; allow runtime/graphics caches to warm up.
  78  |   expect(samples.at(-1)!.usedHeap-samples[2].usedHeap).toBeLessThan(5_000_000);
  79  | });
  80  | 
  81  | test.describe('production under /tidal/',()=>{
  82  |   let server:ChildProcess;
  83  |   let url:string;
  84  |   test.beforeAll(async()=>{
  85  |     await promisify(execFile)(process.execPath,['node_modules/vite/bin/vite.js','build','--base','/tidal/','--outDir','dist-subpath'],{windowsHide:true});
  86  |     // Keep the user's production preview independent from isolated subpath QA.
  87  |     const port=await new Promise<number>((resolve,reject)=>{
  88  |       const probe=createServer();probe.once('error',reject);probe.listen(0,'127.0.0.1',()=>{
  89  |         const address=probe.address();if(!address||typeof address==='string'){probe.close();reject(new Error('Cannot allocate preview port'));return;}
  90  |         probe.close(error=>error?reject(error):resolve(address.port));
  91  |       });
  92  |     });
  93  |     url=`http://127.0.0.1:${port}/tidal/`;
  94  |     const expectedIndex=await readFile('dist-subpath/index.html','utf8');
  95  |     server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--base','/tidal/','--outDir','dist-subpath','--port',String(port),'--strictPort'],{windowsHide:true,stdio:'ignore'});
  96  |     for(let n=0;n<100;n++){
  97  |       if(server.exitCode!==null)throw new Error(`Subpath preview exited: ${server.exitCode}`);
  98  |       if(await fetch(url).then(async r=>r.ok&&(await r.text())===expectedIndex,()=>false))return;
  99  |       await new Promise(resolve=>setTimeout(resolve,100));
  100 |     }
  101 |     throw new Error('Subpath preview failed to start');
  102 |   });
  103 |   test.afterAll(()=>{server?.kill();});
  104 |   test('the isolated character review loads its bones and textures under the same subpath',async({page,context})=>{
  105 |     const local:string[]=[],outside:string[]=[];
  106 |     await context.route('**/*',route=>{const request=route.request().url();if(new URL(request).origin!==new URL(url).origin){outside.push(request);return route.abort();}local.push(request);return route.continue();});
  107 |     await page.goto(`${url}?art=character-motion&model=prototype`);await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
  108 |     expect(local.some(u=>u.includes('/tidal/assets/character-motion/Male_Peasant.gltf'))).toBe(true);
  109 |     expect(local.some(u=>u.includes('/tidal/assets/character-motion/tree-chopping.glb'))).toBe(true);
  110 |     expect(local.some(u=>u.endsWith('/T_Peasant_BaseColor.png'))).toBe(true);expect(outside).toEqual([]);
  111 |     await expect(page.locator('#worldCanvas')).toHaveCount(0);
  112 |   });
  113 |   test('the supplied character and house load locally under the same subpath',async({page,context})=>{
  114 |     const local:string[]=[],outside:string[]=[],errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  115 |     await context.route('**/*',route=>{const request=route.request().url();if(new URL(request).origin!==new URL(url).origin){outside.push(request);return route.abort();}local.push(request);return route.continue();});
  116 |     await page.goto(`${url}?art=character-motion`);await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
> 117 |     await expect(page.locator('#motionStage')).toHaveAttribute('data-motion-support','static');
      |                                                ^ Error: expect(locator).toHaveAttribute(expected) failed
  118 |     expect(local.some(request=>request.includes('/tidal/assets/user-models/character.fbx'))).toBe(true);
  119 |     expect(local.some(request=>request.includes('/tidal/assets/user-models/house.fbx'))).toBe(true);
  120 |     expect(local.some(request=>request.includes('/assets/character-motion/'))).toBe(false);expect(outside).toEqual([]);expect(errors).toEqual([]);
  121 |     await expect(page.getByRole('link',{name:'原动作样片对照'})).toHaveAttribute('href','/tidal/?art=character-motion&model=prototype');
  122 |     await expect(page.locator('#worldCanvas')).toHaveCount(0);
  123 |   });
  124 |   test('all local assets and real MediaPipe inference work with external requests blocked',async({page,context})=>{
  125 |     const requests:string[]=[],external:string[]=[],errors:string[]=[];
  126 |     page.on('pageerror',e=>errors.push(e.message));
  127 |     await context.route('**/*',route=>{const u=new URL(route.request().url());requests.push(u.href);if(u.origin!==new URL(url).origin){external.push(u.href);return route.abort();}return route.continue();});
  128 |     await page.goto(url);await expect.poll(()=>page.locator('.prize img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
  129 |     await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();await expect(page.locator('#cameraStatus')).toContainText('推理中',{timeout:35000});await expect(page.locator('#cameraFrames')).not.toHaveText('0');
  130 |     expect(requests.some(u=>u.includes('/tidal/models/'))).toBe(true);expect(requests.some(u=>u.includes('/tidal/mediapipe/')&&u.endsWith('.wasm'))).toBe(true);
  131 |     expect(external).toEqual([]);expect(errors).toEqual([]);await page.locator('#backHome').click();
  132 |     await mkdir(output,{recursive:true});await writeFile(`${output}/subpath.json`,JSON.stringify({url,browser:page.context().browser()!.version(),input:'Chromium fake video; real local MediaPipe CPU Worker, not a physical camera',external,errors,requests,result:'pass'},null,2));
  133 |   });
  134 |   for(const asset of ['models/pose_landmarker_lite.task','mediapipe/wasm/*.wasm'])test(`${asset} 404 reports failure and releases capture`,async({page})=>{
  135 |     await page.route(`**/tidal/${asset}`,route=>route.fulfill({status:404,body:'missing test asset'}));
  136 |     await page.goto(url);await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();
  137 |     await expect(page.locator('#cameraStatus')).toContainText(/失败|404|超时/,{timeout:35000});await expect(page.locator('#cameraStart')).toBeEnabled();
  138 |     expect(await page.locator('#cameraVideo').evaluate((v:HTMLVideoElement)=>v.srcObject)).toBeNull();await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  139 |   });
  140 | });
  141 | 
```