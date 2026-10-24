import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const output=process.env.TIDAL_GRIP_QA_DIR??'artifacts/qa/user-grip/first-render';
await mkdir(output,{recursive:true});
const browser=await chromium.launch();const errors=[],external=[];
function observe(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{const u=new URL(r.url());if(u.origin!=='http://127.0.0.1:4176'&&u.protocol!=='blob:'&&u.protocol!=='data:')external.push(u.href);});}
try{
 const context=await browser.newContext({viewport:{width:1366,height:900}});
 const page=await context.newPage();observe(page);
 await page.goto('http://127.0.0.1:4176/?art=character-motion&rev=7');
 await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
 const samples=[];
 for(const [name,time] of [['stand',0],['raised',3.5],['impact',4.15],['rebound',4.28],['clear',4.7],['recover',5.15]]){
  await page.locator('#motionScrub').fill(String(time));
  await expect(page.getByRole('button',{name:'继续',exact:true})).toBeVisible();
  await expect(page.locator('#motionStage')).toHaveAttribute('data-time',time.toFixed(4));
  await page.screenshot({path:output+'/'+name+'.png'});
  samples.push({name,time,blade:await page.locator('#motionStage').getAttribute('data-blade')});
 }
 for(const [name,time] of [['stand-grip',0],['raised-grip',3.5],['impact-grip',4.15],['clear-grip',4.7]]){
  await page.locator('#motionScrub').fill(String(time));await expect(page.locator('#motionStage')).toHaveAttribute('data-time',time.toFixed(4));
  await page.getByRole('button',{name:'手肘特写',exact:true}).click();await expect(page.locator('#motionStage')).toHaveAttribute('data-view','grip');await page.screenshot({path:output+'/'+name+'.png'});
 }
 await page.mouse.move(530,420);await page.mouse.down();await page.mouse.move(700,420,{steps:20});await page.mouse.up();await page.screenshot({path:output+'/grip-side.png'});
 await page.getByRole('button',{name:'人物近景',exact:true}).click();await page.locator('#motionScrub').fill('0');await page.mouse.move(530,420);await page.mouse.down();await page.mouse.move(920,420,{steps:20});await page.mouse.up();await page.screenshot({path:output+'/stand-back.png'});
 await page.locator('#motionScrub').fill('3.5');await page.screenshot({path:output+'/raised-back.png'});
 await page.getByRole('button',{name:'房屋近景',exact:true}).click();await page.screenshot({path:output+'/house.png'});
 const entry=await page.locator('script[type=module]').evaluateAll(nodes=>nodes.map(node=>node.src));
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'人物近景',exact:true}).click();await page.locator('#motionScrub').fill('3.5');await page.screenshot({path:output+'/narrow-390x844.png'});
 await context.close();
 let recording=null;
 if(process.env.TIDAL_GRIP_RECORD==='1'){
  const videoContext=await browser.newContext({viewport:{width:1366,height:900},recordVideo:{dir:output+'/raw-video',size:{width:1366,height:900}}});
  const videoPage=await videoContext.newPage();observe(videoPage);await videoPage.goto('http://127.0.0.1:4176/?art=character-motion&rev=7');await expect(videoPage.locator('#motionStage')).toHaveAttribute('data-assets','ready');
  await videoPage.getByRole('button',{name:'重播动作',exact:true}).click();const start=Date.now();await videoPage.waitForTimeout(16000);
  recording={wallMs:Date.now()-start,previewTime:await videoPage.locator('#motionStage').getAttribute('data-time'),note:'Uninterrupted actual screen recording; normal presentation clock, no camera. Encoding rate is not game fps.'};
  const video=videoPage.video();await videoContext.close();await video.saveAs(output+'/stand-chop-recover.webm');
 }
 await writeFile(output+'/capture.json',JSON.stringify({date:new Date().toISOString(),browser:browser.version(),entry,source:'Actual production Three.js rig rendering; local synthetic animation, no camera',samples,recording,narrow:'Desktop Chromium viewport, not a real phone',errors,external},null,2));
 console.log({output,samples,recording,errors,external});expect(errors).toEqual([]);expect(external).toEqual([]);
}finally{await browser.close();}
