import {test,expect,type Page} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const output='artifacts/qa/user-farm-motion-20261026',origin='http://127.0.0.1:4174';
interface MotionSample{mode:string;action:string;task:string;hand:number[];feet:number[];blade:number[];revision:string;inventory:string}
interface FarmMotionQA{samples:MotionSample[];cameraCalls:number;paused:boolean}
declare global{interface Window{farmMotionQA:FarmMotionQA}}
test.use({baseURL:origin,channel:'chromium'});
async function observe(page:Page,pause=false){
 const errors:string[]=[],external:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{const address=new URL(request.url());if(address.protocol!=='data:'&&address.origin!==origin)external.push(address.href);});
 await page.addInitScript(({pause})=>{
  const qa:FarmMotionQA={samples:[],cameraCalls:0,paused:false};window.farmMotionQA=qa;
  navigator.mediaDevices.getUserMedia=async()=>{qa.cameraCalls++;throw new Error('Farm animation preview must not request a camera');};
  let observed:HTMLElement|null=null,last='';
  const collect=()=>{
   const world=document.getElementById('worldCanvas');if(!world)return;
   const numbers=(text:string|undefined)=>text?text.split(',').map(Number):[];
   const sample:MotionSample={mode:world.dataset.playerMode??'',action:world.dataset.action??'',task:document.getElementById('missionTitle')?.textContent??'',hand:numbers(world.dataset.hand),feet:numbers(world.dataset.footPose),blade:numbers(world.dataset.blade),revision:world.dataset.motionRevision??'',inventory:world.dataset.inventory??''};
   const key=JSON.stringify(sample);if(key!==last){qa.samples.push(sample);last=key;}
   if(pause&&!qa.paused&&sample.task.includes('砍')&&sample.action==='chop-down'&&document.getElementById('statusTag')?.textContent==='训练中'&&qa.samples.some(before=>before.task.includes('砍')&&before.hand.length===3&&sample.hand.length===3&&Math.abs(before.hand[1]-sample.hand[1])>.04)){
    const button=document.getElementById('pauseBtn');if(button instanceof HTMLButtonElement&&!button.disabled){qa.paused=true;button.click();}
   }
  };
  const frame=()=>{const world=document.getElementById('worldCanvas');if(world&&world!==observed){observed=world;new MutationObserver(collect).observe(world,{attributes:true,attributeFilter:['data-hand','data-foot-pose','data-blade','data-player-mode','data-action']});}collect();requestAnimationFrame(frame);};requestAnimationFrame(frame);
 },{pause});
 return {errors,external};
}
const range=(samples:MotionSample[],channel:'hand'|'feet'|'blade',index:number)=>{const values=samples.map(s=>s[channel][index]).filter(Number.isFinite);return values.length?Math.max(...values)-Math.min(...values):0;};

test('the supplied farm character chops and takes real steps through walk push pull while preserving fifteen logs',async({page})=>{
 const evidence=await observe(page);await page.goto('/?e2e=1&art=npr-sample');
 await expect.poll(()=>page.evaluate(()=>{const heights=window.farmMotionQA.samples.filter(s=>s.task.includes('砍')).map(s=>s.hand[1]).filter(Number.isFinite);return heights.length?Math.max(...heights)-Math.min(...heights):0;}),{timeout:20000}).toBeGreaterThan(.04);
 await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});
 const qa=await page.evaluate(()=>window.farmMotionQA),chop=qa.samples.filter(s=>s.task.includes('砍'));
 expect(range(chop,'blade',1)).toBeGreaterThan(.1);
 for(const mode of ['walk','push','pull']){
  const steps=qa.samples.filter(s=>s.mode===mode&&s.feet.length===6);expect(steps.length,mode).toBeGreaterThan(1);
  expect(Math.max(range(steps,'feet',1),range(steps,'feet',2),range(steps,'feet',4),range(steps,'feet',5)),mode).toBeGreaterThan(.025);
 }
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-character','user-fbx-farm-motion');
 await expect(page.locator('#chopValue')).toHaveText('15/15');await expect(page.locator('#loadValue')).toHaveText('15/15');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
 expect(qa.cameraCalls).toBe(0);expect(evidence).toEqual({errors:[],external:[]});
 await mkdir(output,{recursive:true});await writeFile(`${output}/farm-motion.json`,JSON.stringify({input:'Existing automatic demo; no camera',...qa,...evidence},null,2));
 await page.screenshot({path:`${output}/farm-results.png`,fullPage:true});
});

test('pausing a real downstroke freezes blade feet and progress and reset clears the half action',async({page})=>{
 const evidence=await observe(page,true);await page.goto('/?e2e=1&art=npr-sample');
 await expect.poll(()=>page.evaluate(()=>window.farmMotionQA.paused),{timeout:20000}).toBe(true);
 await expect(page.locator('#statusTag')).toHaveText('已暂停');
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 const world=page.locator('#worldCanvas'),attributes=['data-hand','data-blade','data-foot-pose','data-motion-revision','data-inventory'];
 const before=await Promise.all(attributes.map(name=>world.getAttribute(name))),count=await page.locator('#chopValue').textContent();
 expect(before.every(value=>value!==null)).toBe(true);await page.waitForTimeout(350);
 expect(await Promise.all(attributes.map(name=>world.getAttribute(name)))).toEqual(before);await expect(page.locator('#chopValue')).toHaveText(count!);
 await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});await expect(world).toHaveAttribute('data-inventory','0/0/15');
 await page.locator('#resultsHome').click();await expect(page.locator('#planModal')).toBeVisible();await expect(world).toHaveAttribute('data-inventory','0/0/0');
 expect((await page.evaluate(()=>window.farmMotionQA)).cameraCalls).toBe(0);expect(evidence).toEqual({errors:[],external:[]});
 await mkdir(output,{recursive:true});await writeFile(`${output}/farm-pause-reset.json`,JSON.stringify({before,count,...evidence},null,2));
});
