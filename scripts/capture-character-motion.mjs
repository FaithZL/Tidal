import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const url=process.env.TIDAL_PREVIEW_URL??'http://127.0.0.1:4176/?art=character-motion&model=prototype';
const dir=process.env.TIDAL_ART_DIR??'artifacts/qa/video-character/final';await mkdir(dir,{recursive:true});
const browser=await chromium.launch(),errors=[],external=[],poses=[];
function observe(page){page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(new URL(r.url()).origin!==new URL(url).origin)external.push(r.url());});}
try{
 const context=await browser.newContext({viewport:{width:1366,height:900},recordVideo:{dir:`${dir}/raw-video`,size:{width:1366,height:900}}});
 const page=await context.newPage();observe(page);await page.goto(url);await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready',{timeout:15000});
 await page.getByRole('button',{name:'重播动作'}).click();
 await page.waitForTimeout(14300);
 const video=page.video();await context.close();await video.saveAs(`${dir}/stand-chop-recover.webm`);
 const still=await browser.newPage({viewport:{width:1366,height:900}});observe(still);await still.goto(url);
 await expect(still.locator('#motionStage')).toHaveAttribute('data-assets','ready',{timeout:15000});
 for(const [phase,time,label] of [['idle',.8,'standing'],['prepare',3.4,'windup'],['strike',3.95,'strike'],['recover',4.95,'recovery']]){
  await still.getByRole('slider',{name:'逐帧检视'}).evaluate((element,time)=>{element.value=String(time);element.dispatchEvent(new Event('input',{bubbles:true}));},time);
  await expect(still.locator('#motionStage')).toHaveAttribute('data-phase',phase);
  await expect(still.locator('#motionStage')).toHaveAttribute('data-time',Number(time).toFixed(4));
  await still.screenshot({path:`${dir}/${label}.png`,fullPage:true});
  poses.push({label,time:await still.locator('#motionStage').getAttribute('data-time'),phase:await still.locator('#motionPhase').textContent()});
 }
 const face=still.getByRole('button',{name:'面部特写',exact:true});
 if(await face.count()){
  await still.getByRole('slider',{name:'逐帧检视'}).evaluate(element=>{element.value='.8';element.dispatchEvent(new Event('input',{bubbles:true}));});
  await expect(still.locator('#motionStage')).toHaveAttribute('data-time','0.8000');
  const paints=Number(await still.locator('#motionStage').getAttribute('data-paints'));
  await face.click();await expect(still.locator('#motionStage')).toHaveAttribute('data-view','face');
  await expect.poll(async()=>Number(await still.locator('#motionStage').getAttribute('data-paints'))).toBeGreaterThan(paints);
  await still.screenshot({path:`${dir}/face-three-quarter.png`,fullPage:true});
  await still.screenshot({path:`${dir}/portrait.png`,clip:{x:485,y:205,width:420,height:600}});
  await still.mouse.move(620,450);await still.mouse.down();await still.mouse.move(680,450,{steps:12});await still.mouse.up();
  await still.screenshot({path:`${dir}/face-front.png`,fullPage:true});
  await face.click();await expect(still.locator('#motionStage')).toHaveAttribute('data-view','full');
  await still.mouse.move(600,450);await still.mouse.down();await still.mouse.move(1050,450,{steps:16});await still.mouse.up();
  await still.screenshot({path:`${dir}/back-standing.png`,fullPage:true});
  await still.getByRole('slider',{name:'逐帧检视'}).evaluate(element=>{element.value='3.4';element.dispatchEvent(new Event('input',{bubbles:true}));});
  await expect(still.locator('#motionStage')).toHaveAttribute('data-time','3.4000');
  await still.screenshot({path:`${dir}/back-windup.png`,fullPage:true});
 }
 await writeFile(`${dir}/capture.json`,JSON.stringify({date:new Date().toISOString(),url,browser:browser.version(),scope:'Actual isolated production Three.js sample. Original trial head, CC0 Quaternius garment/retargeted animation, NOT Leo. Normal preview clock, no camera, no exercise counts. Video is uninterrupted original-speed screen recording; stills select exact paused poses through the visible review timeline.',poses,errors,external,bundles:await still.locator('script[type=module]').evaluateAll(nodes=>nodes.map(n=>n.src))},null,2)+'\n');
 expect(errors).toEqual([]);expect(external).toEqual([]);console.log({poses,errors,external});
}finally{await browser.close();}
