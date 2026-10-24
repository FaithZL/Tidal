import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1366,height:900}});
 await page.goto('http://127.0.0.1:5174/?art=character-motion');
 await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready',{timeout:15000});
 await page.getByRole('slider',{name:'逐帧检视'}).evaluate(element=>{element.value='.8';element.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.getByRole('button',{name:'面部特写',exact:true}).click();
 await expect(page.locator('#motionStage')).toHaveAttribute('data-view','face');
 await page.waitForTimeout(150);
 await page.screenshot({path:'artifacts/qa/character-refinement/head-preview-three-quarter.png'});
}finally{await browser.close();}
