import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch(),observations=[],errors=[];
const url=process.env.TIDAL_PREVIEW_URL??'http://127.0.0.1:5174/?art=character-motion';
const prefix=process.env.TIDAL_REVIEW_PREFIX??'source';
try{
 const page=await browser.newPage({viewport:{width:1366,height:900}});
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(url);
 await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready',{timeout:15000});
 for(const [label,time,phase] of[['windup',3.4,'prepare'],['strike',3.95,'strike']]){
  if(await page.getByRole('button',{name:'面部特写',exact:true}).getAttribute('aria-pressed')==='true')await page.getByRole('button',{name:'面部特写',exact:true}).click();
  await page.getByRole('slider',{name:'逐帧检视'}).evaluate((element,time)=>{element.value=String(time);element.dispatchEvent(new Event('input',{bubbles:true}));},time);
  await expect(page.locator('#motionStage')).toHaveAttribute('data-phase',phase);
  await page.waitForTimeout(100);
  await page.screenshot({path:`artifacts/qa/character-refinement/${prefix}-${label}-full.png`});
  await page.getByRole('button',{name:'面部特写',exact:true}).click();
  await page.mouse.move(600,450);await page.mouse.wheel(0,400);await page.waitForTimeout(150);
  await page.mouse.down();await page.mouse.move(646,450,{steps:10});await page.mouse.up();await page.waitForTimeout(200);
  await page.screenshot({path:`artifacts/qa/character-refinement/${prefix}-${label}-shoulder-quarter.png`});
  observations.push({label,time:await page.locator('#motionStage').getAttribute('data-time'),phase:await page.locator('#motionStage').getAttribute('data-phase')});
 }
 await writeFile(`artifacts/qa/character-refinement/${prefix}-shoulder-preview.json`,JSON.stringify({url:page.url(),observations,errors},null,2)+'\n');
 expect(errors).toEqual([]);
}finally{await browser.close();}
