// Isolated production visual QA; genuine UI dismissal, no accelerated clocks or pose input.
import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[],external=[];
try{
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).origin!=='http://127.0.0.1:4176')external.push(r.url());});
 await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto('http://127.0.0.1:4176/?art=npr-sample');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');
 await expect(page.locator('#testModeBadge')).toBeHidden();await page.locator('#cancelPlan').click();await page.waitForTimeout(500);
 await expect(page.locator('#chopValue')).toHaveText('0/15');await page.screenshot({path:'artifacts/qa/npr-sample/showcase.png'});
 const raster=await page.locator('#worldCanvas canvas').evaluate(c=>({width:c.width,height:c.height,scale:c.parentElement.dataset.renderScale}));
 expect(errors).toEqual([]);expect(external).toEqual([]);
 await writeFile('artifacts/qa/npr-sample/showcase.json',JSON.stringify({date:new Date().toISOString(),browser:browser.version(),raster,scope:'production manual home after dismissing plan; no camera, zero reps; not FPS or art acceptance',errors,external},null,2)+'\n');
}finally{await browser.close();}
