import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4176/?art=character-motion');
 await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
 await page.getByRole('slider',{name:'逐帧检视'}).evaluate(element=>{element.value='.8';element.dispatchEvent(new Event('input',{bubbles:true}));});
 await expect(page.locator('#motionStage')).toHaveAttribute('data-time','0.8000');
 await page.getByRole('button',{name:'面部特写',exact:true}).click();
 await page.screenshot({path:'artifacts/qa/character-refinement/final/mobile-face.png'});
}finally{await browser.close();}
