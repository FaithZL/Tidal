import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4176/?art=character-motion&rev=6');await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
 await page.locator('#motionScrub').fill('0');await expect(page.locator('#motionStage')).toHaveAttribute('data-time','0.0000');
 await page.mouse.move(520,530);const before=Number(await page.locator('#motionStage').getAttribute('data-paints'));await page.mouse.wheel(0,-550);await expect.poll(async()=>Number(await page.locator('#motionStage').getAttribute('data-paints'))).toBeGreaterThan(before);
 await page.screenshot({path:'artifacts/qa/user-rig/final/elbow-stand-close.png'});
 await page.locator('#motionScrub').fill('4.15');await expect(page.locator('#motionStage')).toHaveAttribute('data-time','4.1500');await page.screenshot({path:'artifacts/qa/user-rig/final/elbow-impact-close.png'});
 await writeFile('artifacts/qa/user-rig/final/close-capture.json',JSON.stringify({date:new Date().toISOString(),source:'Actual same production build; zoomed with visible OrbitControls wheel, paused review timeline',entry:await page.locator('script[type=module]').evaluateAll(n=>n.map(e=>e.src)),errors},null,2));expect(errors).toEqual([]);
}finally{await browser.close();}
