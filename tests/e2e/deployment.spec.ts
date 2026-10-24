import {test,expect,type Page} from '../helpers/manualModeTest.js';
import {spawn,execFile,type ChildProcess} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createServer} from 'node:net';
import {installPoseFixture} from '../helpers/browserPoseFixture.js';

test.use({launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
const output='artifacts/qa/3d/deployment';
async function inViewport(page:Page,selector:string){
  const box=await page.locator(selector).boundingBox(),v=page.viewportSize()!;
  expect(box,selector).not.toBeNull();expect(box!.x,selector).toBeGreaterThanOrEqual(0);expect(box!.y,selector).toBeGreaterThanOrEqual(0);
  expect(box!.x+box!.width,selector).toBeLessThanOrEqual(v.width);expect(box!.y+box!.height,selector).toBeLessThanOrEqual(v.height);
}

for(const [width,height]of [[1280,720],[1366,768],[1920,1080]])test(`desktop ${width}x${height} keeps controls visible through a complete simulated session`,async({page})=>{
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:4174/?e2e=1');await page.locator('#cancelPlan').click();
  for(const id of ['worldCanvas','actionBtn','modeBadge','statusTag','demoToggle'])await inViewport(page,`#${id}`);
  const canvas=await page.locator('#worldCanvas canvas').boundingBox();expect(canvas!.width/canvas!.height).toBeCloseTo(width/height,3);
  await page.locator('#actionBtn').click();await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();
  await page.locator('#beginDemo').scrollIntoViewIfNeeded();await inViewport(page,'#beginDemo');await page.locator('#beginDemo').click();
  await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#pauseBtn').click();
  for(const id of ['worldCanvas','actionBtn','modeBadge','statusTag','pauseBtn'])await inViewport(page,`#${id}`);
  await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/desktop-${width}x${height}.png`});
  await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:20000});
  await page.locator('#resultsHome').scrollIntoViewIfNeeded();await inViewport(page,'#resultsHome');await page.locator('#resultsHome').click();
});

test('audio requires explicit unlock, can mute and failure leaves the farm usable',async({page})=>{
  await page.addInitScript(()=>{
    const Original=window.AudioContext;let count=0;
    window.AudioContext=class extends Original{constructor(...args:ConstructorParameters<typeof AudioContext>){super(...args);document.body.dataset.audioContexts=String(++count);}};
  });
  await page.goto('/');await page.locator('#cancelPlan').click();expect(await page.locator('body').getAttribute('data-audio-contexts')).toBeNull();
  await expect(page.locator('#audioToggle')).toHaveAttribute('aria-pressed','false');await page.locator('#audioToggle').click();
  await expect(page.locator('#audioToggle')).toHaveAttribute('aria-pressed','true');await expect(page.locator('body')).toHaveAttribute('data-audio-contexts','1');
  await page.locator('#audioToggle').click();await expect(page.locator('#audioToggle')).toHaveAttribute('aria-pressed','false');
  await page.addInitScript(()=>{window.AudioContext=class{constructor(){throw new Error('test unavailable');}} as unknown as typeof AudioContext;});
  await page.reload();await page.locator('#cancelPlan').click();await page.locator('#audioToggle').click();
  await expect(page.locator('#audioToggle')).toContainText('不可用');await page.locator('#actionBtn').click();await expect(page.locator('#planModal')).toBeVisible();
});

test('ten camera start-exit-reset cycles release tracks workers timers and listeners without sustained heap growth',async({page,context})=>{
  test.setTimeout(90000);await installPoseFixture(page);
  await page.addInitScript(()=>{
    const active=new Set<number>(),set=window.setInterval.bind(window),clear=window.clearInterval.bind(window);
    window.setInterval=((fn:TimerHandler,delay?:number,...args:unknown[])=>{const id=set(fn,delay,...args);active.add(id);return id;}) as typeof window.setInterval;
    window.clearInterval=((id?:number)=>{if(id!==undefined)active.delete(id);clear(id);}) as typeof window.clearInterval;
    Object.defineProperty(window,'activeIntervals',{get:()=>active.size});
    const pending=new Set<number>(),later=window.setTimeout.bind(window),cancel=window.clearTimeout.bind(window);
    window.setTimeout=((handler:TimerHandler,delay?:number,...args:unknown[])=>{
      if(typeof handler!=='function')return later(handler,delay,...args);
      const id=later(()=>{pending.delete(id);handler.apply(window,args);},delay);pending.add(id);return id;
    }) as typeof window.setTimeout;
    window.clearTimeout=((id?:number)=>{if(id!==undefined)pending.delete(id);cancel(id);}) as typeof window.clearTimeout;
    Object.defineProperty(window,'activeTimeouts',{get:()=>pending.size});
  });
  await page.goto('/');const cdp=await context.newCDPSession(page);const samples=[];
  for(let cycle=1;cycle<=10;cycle++){
    await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();await expect(page.locator('#cameraFrames')).not.toHaveText('0');
    await page.locator('#backHome').click();await expect(page.locator('#planModal')).toBeVisible();await expect.poll(()=>page.evaluate(()=>window.poseFixture.workers)).toBe(0);
    const resources=await page.evaluate(()=>({tracks:window.poseFixture.tracks.map(t=>t.readyState),workers:window.poseFixture.workers,maxWorkers:window.poseFixture.maxWorkers,intervals:Reflect.get(window,'activeIntervals') as number,timeouts:Reflect.get(window,'activeTimeouts') as number}));
    expect(resources.tracks.every(s=>s==='ended')).toBe(true);expect(resources.maxWorkers).toBe(1);
    const track=await cdp.send('Runtime.evaluate',{expression:'window.poseFixture.tracks[0]',objectGroup:'lifecycle'});
    const listeners=await cdp.send('DOMDebugger.getEventListeners',{objectId:track.result.objectId!});
    await cdp.send('Runtime.releaseObjectGroup',{objectGroup:'lifecycle'});
    // Avoid the test harness itself retaining ended native tracks across cycles.
    await page.evaluate(()=>{window.poseFixture.tracks=[];});await cdp.send('HeapProfiler.collectGarbage');
    const heap=await cdp.send('Runtime.getHeapUsage'),dom=await cdp.send('Memory.getDOMCounters');
    samples.push({cycle,...resources,endedTrackListeners:listeners.listeners.map(l=>l.type),usedHeap:heap.usedSize,...dom});
  }
  await mkdir(output,{recursive:true});await writeFile(`${output}/ten-cycle-resources.json`,JSON.stringify({input:'fake video + synthetic Worker; actual UI/camera lifecycle',method:'ended tracks, live worker/interval counts, Chromium CDP after forced GC; 5MB trend guard',samples},null,2));
  expect(samples.every(s=>s.intervals===samples[0].intervals)).toBe(true);
  expect(samples.every(s=>s.timeouts<=samples[0].timeouts+1)).toBe(true);
  expect(samples.every(s=>s.endedTrackListeners.length===0)).toBe(true);
  expect(samples.at(-1)!.jsEventListeners).toBeLessThanOrEqual(samples[0].jsEventListeners+2);
  // A trend guard, not an exact memory promise; allow runtime/graphics caches to warm up.
  expect(samples.at(-1)!.usedHeap-samples[2].usedHeap).toBeLessThan(5_000_000);
});

test.describe('production under /tidal/',()=>{
  let server:ChildProcess;
  let url:string;
  test.beforeAll(async()=>{
    await promisify(execFile)(process.execPath,['node_modules/vite/bin/vite.js','build','--base','/tidal/','--outDir','dist-subpath'],{windowsHide:true});
    // Keep the user's production preview independent from isolated subpath QA.
    const port=await new Promise<number>((resolve,reject)=>{
      const probe=createServer();probe.once('error',reject);probe.listen(0,'127.0.0.1',()=>{
        const address=probe.address();if(!address||typeof address==='string'){probe.close();reject(new Error('Cannot allocate preview port'));return;}
        probe.close(error=>error?reject(error):resolve(address.port));
      });
    });
    url=`http://127.0.0.1:${port}/tidal/`;
    const expectedIndex=await readFile('dist-subpath/index.html','utf8');
    server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--base','/tidal/','--outDir','dist-subpath','--port',String(port),'--strictPort'],{windowsHide:true,stdio:'ignore'});
    for(let n=0;n<100;n++){
      if(server.exitCode!==null)throw new Error(`Subpath preview exited: ${server.exitCode}`);
      if(await fetch(url).then(async r=>r.ok&&(await r.text())===expectedIndex,()=>false))return;
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    throw new Error('Subpath preview failed to start');
  });
  test.afterAll(()=>{server?.kill();});
  test('the isolated character review loads its bones and textures under the same subpath',async({page,context})=>{
    const local:string[]=[],outside:string[]=[];
    await context.route('**/*',route=>{const request=route.request().url();if(new URL(request).origin!==new URL(url).origin){outside.push(request);return route.abort();}local.push(request);return route.continue();});
    await page.goto(`${url}?art=character-motion&model=prototype`);await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
    expect(local.some(u=>u.includes('/tidal/assets/character-motion/Male_Peasant.gltf'))).toBe(true);
    expect(local.some(u=>u.includes('/tidal/assets/character-motion/tree-chopping.glb'))).toBe(true);
    expect(local.some(u=>u.endsWith('/T_Peasant_BaseColor.png'))).toBe(true);expect(outside).toEqual([]);
    await expect(page.locator('#worldCanvas')).toHaveCount(0);
  });
  test('the supplied character and house load locally under the same subpath',async({page,context})=>{
    const local:string[]=[],outside:string[]=[],errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    await context.route('**/*',route=>{const request=route.request().url();if(new URL(request).origin!==new URL(url).origin){outside.push(request);return route.abort();}local.push(request);return route.continue();});
    await page.goto(`${url}?art=character-motion`);await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
    await expect(page.locator('#motionStage')).toHaveAttribute('data-motion-support','derived-skeleton');
    expect(local.some(request=>request.includes('/tidal/assets/user-models/character.fbx'))).toBe(true);
    expect(local.some(request=>request.includes('/tidal/assets/user-models/house.fbx'))).toBe(true);
    expect(local.some(request=>request.includes('/assets/character-motion/'))).toBe(false);expect(outside).toEqual([]);expect(errors).toEqual([]);
    await expect(page.getByRole('link',{name:'原动作样片对照'})).toHaveAttribute('href','/tidal/?art=character-motion&model=prototype');
    await expect(page.locator('#worldCanvas')).toHaveCount(0);
  });
  test('all local assets and real MediaPipe inference work with external requests blocked',async({page,context})=>{
    const requests:string[]=[],external:string[]=[],errors:string[]=[];
    page.on('pageerror',e=>errors.push(e.message));
    await context.route('**/*',route=>{const u=new URL(route.request().url());requests.push(u.href);if(u.origin!==new URL(url).origin){external.push(u.href);return route.abort();}return route.continue();});
    await page.goto(url);await expect.poll(()=>page.locator('.prize img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
    await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();await expect(page.locator('#cameraStatus')).toContainText('推理中',{timeout:35000});await expect(page.locator('#cameraFrames')).not.toHaveText('0');
    expect(requests.some(u=>u.includes('/tidal/models/'))).toBe(true);expect(requests.some(u=>u.includes('/tidal/mediapipe/')&&u.endsWith('.wasm'))).toBe(true);
    expect(external).toEqual([]);expect(errors).toEqual([]);await page.locator('#backHome').click();
    await mkdir(output,{recursive:true});await writeFile(`${output}/subpath.json`,JSON.stringify({url,browser:page.context().browser()!.version(),input:'Chromium fake video; real local MediaPipe CPU Worker, not a physical camera',external,errors,requests,result:'pass'},null,2));
  });
  for(const asset of ['models/pose_landmarker_lite.task','mediapipe/wasm/*.wasm'])test(`${asset} 404 reports failure and releases capture`,async({page})=>{
    await page.route(`**/tidal/${asset}`,route=>route.fulfill({status:404,body:'missing test asset'}));
    await page.goto(url);await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();
    await expect(page.locator('#cameraStatus')).toContainText(/失败|404|超时/,{timeout:35000});await expect(page.locator('#cameraStart')).toBeEnabled();
    expect(await page.locator('#cameraVideo').evaluate((v:HTMLVideoElement)=>v.srcObject)).toBeNull();await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  });
});
