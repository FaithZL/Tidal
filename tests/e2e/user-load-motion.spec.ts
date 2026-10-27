import {test,expect,type Page} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const origin='http://127.0.0.1:4174';
const output='artifacts/qa/user-load-motion-20261025';
const url='/?e2e=1&art=npr-sample';
const loadPhases=['ready','squat-down','stand-up','press-up','load-return'];
interface LoadMotionSample{
 action:string;hand:[number,number,number];revision:string;inventory:string;load:string;at:number;
}
interface LoadMotionQA{samples:LoadMotionSample[];pauseTriggered:boolean;cameraCalls:number}
declare global{interface Window{userLoadMotionQA:LoadMotionQA}}

test.use({baseURL:origin,channel:'chromium'});
test.setTimeout(60000);

/** Observe published real-world hand anchors; only the existing UI can pause the demo. */
async function observeLoadMotion(page:Page,pauseOnMotion=false):Promise<void>{
 await page.addInitScript(({pauseOnMotion})=>{
  localStorage.setItem('tidal.demo.enabled','true');
  const state:LoadMotionQA={samples:[],pauseTriggered:false,cameraCalls:0};
  window.userLoadMotionQA=state;
  navigator.mediaDevices.getUserMedia=async()=>{state.cameraCalls++;throw new Error('Automatic load sample must not request a camera');};
  let observed:HTMLElement|null=null,last='';
  const sample=(fromMutation:boolean)=>{
   const world=document.getElementById('worldCanvas');
   if(!world||document.getElementById('app')?.dataset.phase!=='active'||
    !document.getElementById('missionTitle')?.textContent?.includes('装')||world.dataset.playerMode!=='work')return;
   const parts=world.dataset.hand?.split(',').map(Number);
   if(!parts||parts.length!==3||!parts.every(Number.isFinite))return;
   const action=world.dataset.action??'';
   if(!['ready','squat-down','stand-up','press-up','load-return'].includes(action))return;
   const entry:LoadMotionSample={action,hand:[parts[0],parts[1],parts[2]],revision:world.dataset.motionRevision??'',
    inventory:world.dataset.inventory??'',load:document.getElementById('loadValue')?.textContent??'',at:performance.now()};
   const key=JSON.stringify([entry.action,entry.hand,entry.revision,entry.inventory,entry.load]);
   if(key!==last){last=key;state.samples.push(entry);}
   if(fromMutation&&pauseOnMotion&&!state.pauseTriggered&&entry.load==='0/15'&&action!=='ready'&&
    document.getElementById('statusTag')?.textContent==='训练中'&&
    state.samples.some(before=>Math.abs(before.hand[1]-entry.hand[1])>.04)){
    const pause=document.getElementById('pauseBtn');
    if(pause instanceof HTMLButtonElement&&!pause.disabled){state.pauseTriggered=true;pause.click();}
   }
  };
  const frame=()=>{
   const world=document.getElementById('worldCanvas');
   if(world&&observed!==world){
    observed=world;
    new MutationObserver(()=>sample(true)).observe(world,{attributes:true,
     attributeFilter:['data-action','data-hand','data-motion-revision','data-inventory','data-player-mode']});
   }
   sample(false);requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
 },{pauseOnMotion});
}

function observeErrors(page:Page){
 const errors:string[]=[],external:string[]=[],poseRequests:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{
  const address=request.url(),parsed=new URL(address);
  if(parsed.protocol!=='data:'&&parsed.origin!==origin)external.push(address);
  if(/pose_landmarker|\/worker\/|\/mediapipe\//.test(address))poseRequests.push(address);
 });
 return {errors,external,poseRequests};
}

function handHeightRange(samples:LoadMotionSample[]):number{
 const heights=samples.map(sample=>sample.hand[1]);
 return heights.length?Math.max(...heights)-Math.min(...heights):0;
}

test('the supplied NPR character moves its real hand through load phases and delivers only fifteen logs',async({page})=>{
 const evidence=observeErrors(page);await observeLoadMotion(page);await page.goto(url);
 // Fast demo phases are shorter than a rendered frame; require observable travel,
 // not the full normal-speed lift. RED must identify the static hand first.
 await expect.poll(()=>page.evaluate(()=>{
  const heights=window.userLoadMotionQA.samples.map(sample=>sample.hand[1]);
  return heights.length?Math.max(...heights)-Math.min(...heights):0;
 }),{timeout:25000}).toBeGreaterThan(.04);
 const world=page.locator('#worldCanvas');
 await expect(world).toHaveAttribute('data-character','user-fbx-farm-motion');
 await expect(page.locator('.npr-sample-label')).toContainText('装车');
 await expect(page.locator('.npr-sample-label')).toContainText('行走动作');
 await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});
 const samples=await page.evaluate(()=>window.userLoadMotionQA.samples);
 expect(handHeightRange(samples)).toBeGreaterThan(.04);
 expect([...new Set(samples.map(sample=>sample.action))].sort()).toEqual([...loadPhases].sort());
 expect(new Set(samples.map(sample=>sample.revision)).size).toBeGreaterThan(1);
 for(const sample of samples){
  const inventory=sample.inventory.split('/').map(Number);
  expect(inventory).toHaveLength(3);expect(inventory.every(Number.isFinite)).toBe(true);
  expect(inventory.reduce((total,value)=>total+value,0)).toBe(15);
 }
 await expect(page.locator('#loadValue')).toHaveText('15/15');
 await expect(page.locator('#rewardLogs')).toHaveText('15');
 await expect(world).toHaveAttribute('data-inventory','0/0/15');
 await expect(page.locator('#actualMetrics')).toContainText('自动模拟');
 expect(await page.evaluate(()=>window.userLoadMotionQA.cameraCalls)).toBe(0);
 expect(evidence).toEqual({errors:[],external:[],poseRequests:[]});
 await mkdir(output,{recursive:true});
 await page.screenshot({path:`${output}/load-results.png`,fullPage:true});
 await writeFile(`${output}/load-motion.json`,JSON.stringify({input:'Existing automatic demo; no camera',samples,...evidence},null,2));
});

test('pausing the first moving load freezes the hand and count; resume and reset preserve inventory',async({page})=>{
 const evidence=observeErrors(page);await observeLoadMotion(page,true);await page.goto(url);
 await expect.poll(()=>page.evaluate(()=>window.userLoadMotionQA.pauseTriggered),{timeout:25000}).toBe(true);
 await expect(page.locator('#statusTag')).toHaveText('已暂停');
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 const world=page.locator('#worldCanvas');
 const paused={hand:await world.getAttribute('data-hand'),revision:await world.getAttribute('data-motion-revision'),
  load:await page.locator('#loadValue').textContent(),inventory:await world.getAttribute('data-inventory')};
 expect(paused.hand).not.toBeNull();expect(paused.revision).not.toBeNull();expect(paused.load).toBe('0/15');
 expect(paused.inventory).toBe('15/0/0');
 await page.waitForTimeout(400);
 await expect(world).toHaveAttribute('data-hand',paused.hand!);
 await expect(world).toHaveAttribute('data-motion-revision',paused.revision!);
 await expect(page.locator('#loadValue')).toHaveText(paused.load!);
 await expect(world).toHaveAttribute('data-inventory',paused.inventory!);
 await mkdir(output,{recursive:true});
 await page.screenshot({path:`${output}/load-paused.png`,fullPage:true});
 await page.locator('#pauseBtn').click();
 await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});
 await expect(page.locator('#loadValue')).toHaveText('15/15');
 await expect(page.locator('#rewardLogs')).toHaveText('15');
 await expect(world).toHaveAttribute('data-inventory','0/0/15');
 await page.locator('#resultsHome').click();
 await expect(page.locator('#planModal')).toBeVisible();
 await expect(page.locator('#loadValue')).toHaveText('0/15');
 await expect(world).toHaveAttribute('data-inventory','0/0/0');
 await page.waitForTimeout(400);
 await expect(page.locator('#loadValue')).toHaveText('0/15');
 await expect(world).toHaveAttribute('data-inventory','0/0/0');
 expect(await page.evaluate(()=>window.userLoadMotionQA.cameraCalls)).toBe(0);
 expect(evidence).toEqual({errors:[],external:[],poseRequests:[]});
 await writeFile(`${output}/pause-resume-reset.json`,JSON.stringify({input:'Existing automatic demo and pause/reset UI',paused,
  samples:await page.evaluate(()=>window.userLoadMotionQA.samples),...evidence},null,2));
});
