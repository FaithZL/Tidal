import {test,expect,type Page} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {installPoseFixture,prepareCamera,setPose,completeSyntheticChop} from '../helpers/browserPoseFixture.js';

test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
const output='artifacts/qa/recognition-controls-20261026';
async function enter(page:Page,automatic=false){await page.addInitScript(value=>{if(!sessionStorage.getItem('recognition-fixture-entered')){localStorage.setItem('tidal.demo.enabled',String(value));sessionStorage.setItem('recognition-fixture-entered','true');}},automatic);await page.goto('/?e2e=1&art=npr-sample');}
async function camera(page:Page){await installPoseFixture(page);await enter(page);await prepareCamera(page);await page.locator('#beginCamera').click();await expect(page.locator('#statusTag')).toHaveText('训练中');}
const resources=(page:Page)=>page.evaluate(()=>({tracks:window.poseFixture.tracks.map(track=>track.id),workers:window.poseFixture.workers,max:window.poseFixture.maxWorkers}));
const outcomes=(page:Page)=>page.evaluate(()=>({chop:document.getElementById('chopValue')!.textContent,load:document.getElementById('loadValue')!.textContent,carry:document.getElementById('carryValue')!.textContent,inventory:document.getElementById('worldCanvas')!.dataset.inventory}));
const palette=(page:Page)=>page.locator('#poseOverlay').evaluate((canvas:HTMLCanvasElement)=>{const pixels=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;const colors={green:0,red:0,gray:0};for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<200)continue;if(pixels[i]===119&&pixels[i+1]===227&&pixels[i+2]===160)colors.green++;if(pixels[i]===255&&pixels[i+1]===107&&pixels[i+2]===105)colors.red++;if(pixels[i]===155&&pixels[i+1]===174&&pixels[i+2]===180)colors.gray++;}return colors;});

test('camera entry is gated while its application handlers are still loading',async({page})=>{
 let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});await page.route('**/src/browser.ts*',async route=>{await pending;await route.continue();});
 try{await enter(page);await expect(page.locator('#cameraMode')).toBeDisabled();}finally{release();}
 await expect(page.locator('#cameraMode')).toBeEnabled();await page.locator('#cameraMode').click();await expect(page.locator('#setupModal')).toBeVisible();
});

test('camera entry pauses automatic play without permission and a denied camera stays explicit',async({page})=>{
 await page.addInitScript(()=>{(window as unknown as {cameraCalls:number}).cameraCalls=0;navigator.mediaDevices.getUserMedia=async()=>{(window as unknown as {cameraCalls:number}).cameraCalls++;throw new DOMException('Denied','NotAllowedError');};});
 await enter(page,true);await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#cameraMode')).toBeVisible();await page.locator('#cameraMode').click();
 await expect(page.locator('#setupModal')).toBeVisible();await expect(page.locator('#statusTag')).toHaveText('已暂停');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
 const before=await outcomes(page);await page.waitForTimeout(300);expect(await outcomes(page)).toEqual(before);expect(await page.evaluate(()=>(window as unknown as {cameraCalls:number}).cameraCalls)).toBe(0);
 await page.locator('#cameraStart').click();await expect(page.locator('#cameraStatus')).toContainText('权限被拒绝');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
 await page.reload();await expect(page.locator('#app')).toHaveAttribute('data-phase','home');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
});

test('leniency is bounded, saved independently and accessible on a narrow preparation screen',async({page})=>{
 await page.addInitScript(()=>{if(!sessionStorage.getItem('recognition-fixture-invalid')){localStorage.setItem('tidal.recognition.leniency.v1','invalid');sessionStorage.setItem('recognition-fixture-invalid','true');}});await enter(page);await page.locator('#cameraMode').click();await expect(page.locator('#setupModal')).toBeVisible();
 await expect(page.locator('#recognitionLeniency')).toHaveValue('3');await expect(page.locator('#recognitionLeniencyValue')).toContainText('标准');
 await page.locator('[data-leniency="5"]').click();await expect(page.locator('#recognitionLeniency')).toHaveValue('5');expect(await page.evaluate(()=>localStorage.getItem('tidal.recognition.leniency.v1'))).toBe('5');
 await page.locator('[data-leniency="1"]').click();await expect(page.locator('#recognitionLeniency')).toHaveValue('1');
 await page.locator('#recognitionLeniency').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#recognitionLeniency')).toHaveValue('2');
 await page.reload();await page.locator('#cameraMode').click();await expect(page.locator('#recognitionLeniency')).toHaveValue('2');
 await page.locator('[data-leniency="1"]').click();const slider=(await page.locator('#recognitionLeniency').boundingBox())!;
 await page.mouse.move(slider.x+8,slider.y+slider.height/2);await page.mouse.down();await page.mouse.move(slider.x+slider.width-8,slider.y+slider.height/2,{steps:12});await page.waitForTimeout(180);await page.mouse.up();
 await expect(page.locator('#recognitionLeniency')).toHaveValue('5');expect(await page.evaluate(()=>localStorage.getItem('tidal.recognition.leniency.v1'))).toBe('5');
 await page.setViewportSize({width:390,height:844});await page.locator('#recognitionLeniency').scrollIntoViewIfNeeded();await expect(page.locator('#recognitionLeniency')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/settings-mobile.png`});
});

test('real recognizer feedback paints matching arm green, missing preparation red and lost data neutral',async({page})=>{
 await camera(page);await setPose(page,'down',0);await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','adjust');await expect.poll(async()=>(await palette(page)).red).toBeGreaterThan(8);await expect(page.locator('#chopValue')).toHaveText('0/15');
 await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/feedback-red-synthetic.png`});
 await setPose(page,'raised',0);await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','matched');await expect.poll(async()=>(await palette(page)).green).toBeGreaterThan(8);
 await page.screenshot({path:`${output}/feedback-green-synthetic.png`});
 await page.evaluate(()=>{window.poseFixture.low=true;});await expect(page.locator('#setupModal')).toBeVisible({timeout:10000});await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','unavailable');
 await expect.poll(async()=>(await palette(page)).red+(await palette(page)).green).toBe(0);expect((await palette(page)).gray).toBeGreaterThan(8);
 await page.locator('[data-leniency="5"]').click();await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#statusTag')).toHaveText('已暂停');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
});

test('changing tolerance keeps calibration and device resources but drops a partial rep',async({page})=>{
 await camera(page);await setPose(page,'raised',0);await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await setPose(page,'down',0);await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');
 const before=await resources(page);expect(before.tracks).toHaveLength(1);expect(before.workers).toBe(1);await page.locator('#cameraMode').click();await page.locator('[data-leniency="5"]').click();
 await expect(page.locator('#calibrationPanel')).toHaveAttribute('data-step','complete');await expect(page.locator('#beginCamera')).toBeEnabled();await expect(page.locator('#statusTag')).toHaveText('已暂停');expect(await resources(page)).toEqual(before);
 await page.locator('#beginCamera').click();await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#statusTag')).toHaveText('已暂停');await page.locator('#pauseBtn').click();
 await setPose(page,'raised',500);await expect(page.locator('#chopValue')).toHaveText('0/15');await completeSyntheticChop(page,1);expect(await resources(page)).toEqual(before);
 await page.locator('#animationStop').click();await page.locator('#cameraMode').click();await page.locator('[data-leniency="1"]').click();await page.locator('#beginCamera').click();await page.locator('#animationStop').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');await expect(page.locator('#chopValue')).toHaveText('1/15');expect(await resources(page)).toEqual(before);
});

test('a stalled camera clears the last green feedback without another frame',async({page})=>{
 await camera(page);await setPose(page,'raised',0);await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','matched');await expect.poll(async()=>(await palette(page)).green).toBeGreaterThan(8);
 await page.evaluate(()=>{window.poseFixture.stalled=true;});await expect(page.locator('#setupModal')).toBeVisible();await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','unavailable');await expect.poll(async()=>(await palette(page)).red+(await palette(page)).green).toBe(0);await expect(page.locator('#chopValue')).toHaveText('0/15');
});

test('wide tolerance completes all real recognizer tasks and carry setting changes never fill paused time',async({page})=>{
 test.setTimeout(180000);await page.addInitScript(()=>localStorage.setItem('tidal.recognition.leniency.v1','5'));await camera(page);
 for(let rep=1;rep<=15;rep++)await completeSyntheticChop(page,rep);
 await expect(page.locator('#missionTitle')).toHaveText('把木材装上手推车');await expect(page.locator('#statusTag')).toHaveText('训练中');
 for(let rep=1;rep<=15;rep++){
  await setPose(page,'standing',0);await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await setPose(page,'squat',0);await expect(page.locator('#inputDebug')).toContainText(' · squat-down ·');
  await setPose(page,'standing',0);await expect(page.locator('#inputDebug')).toContainText(' · stand-up ·');await setPose(page,'press',0);await expect(page.locator('#inputDebug')).toContainText(' · press-up ·');await setPose(page,'standing',0);await expect(page.locator('#loadValue')).toHaveText(`${rep}/15`);
 }
 await expect(page.locator('#missionTitle')).toHaveText('推车返回农场');await expect(page.locator('#statusTag')).toHaveText('训练中');await setPose(page,'hold',0);await expect.poll(async()=>parseFloat((await page.locator('#carryValue').textContent())!)).toBeGreaterThan(.1);
 await page.locator('#cameraMode').click();const before=await outcomes(page);const device=await resources(page);await page.locator('[data-leniency="1"]').click();await page.waitForTimeout(600);expect(await outcomes(page)).toEqual(before);expect(await resources(page)).toEqual(device);
 await page.locator('#beginCamera').click();await page.locator('#pauseBtn').click();await page.waitForTimeout(250);expect(await outcomes(page)).toEqual(before);
 await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
 await writeFile(`${output}/full-flow-synthetic.json`,JSON.stringify({input:'Fake video and authored landmarks through actual recognizers; not physical camera',levels:[5,1],resources:device,result:'15 chop,15 load,carry completion; setting interval not credited'},null,2));
});
