import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='artifacts/qa/character-refinement/final';await mkdir(dir,{recursive:true});
const browser=await chromium.launch(),errors=[];
try{
 const page=await browser.newPage({viewport:{width:1366,height:900}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4176/?art=character-motion');
 await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
 await page.getByRole('slider',{name:'逐帧检视'}).evaluate(element=>{element.value='3.4';element.dispatchEvent(new Event('input',{bubbles:true}));});
 await expect(page.locator('#motionStage')).toHaveAttribute('data-time','3.4000');
 const drag=async(dx,dy=0)=>{await page.mouse.move(600,450);await page.mouse.down();await page.mouse.move(600+dx,450+dy,{steps:16});await page.mouse.up();};
 const face=page.getByRole('button',{name:'面部特写',exact:true});await face.click();
 await page.mouse.move(600,450);await page.mouse.wheel(0,400);await drag(46);
 await page.screenshot({path:`${dir}/shoulder-front-quarter.png`});
 await drag(450);await page.screenshot({path:`${dir}/shoulder-rear-quarter.png`});
 await face.click();await page.mouse.move(600,450);await page.mouse.wheel(0,-900);await drag(90,-110);
 await page.screenshot({path:`${dir}/shoulder-low-front.png`});
 await drag(450);await page.screenshot({path:`${dir}/shoulder-low-rear.png`});
 await writeFile(`${dir}/angle-audit.json`,JSON.stringify({url:page.url(),scope:'Actual production sample; visible Orbit drag/wheel inputs; held windup. Front/rear and low viewpoints inspect garment seams, not a cloth simulation certification.',time:await page.locator('#motionStage').getAttribute('data-time'),phase:await page.locator('#motionStage').getAttribute('data-phase'),errors},null,2)+'\n');
 expect(errors).toEqual([]);
}finally{await browser.close();}
