// Real production screenshots; manual keyboard entry for repeatable, stationary comparison views.
import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.TIDAL_PREVIEW_URL??'http://127.0.0.1:4175/';
const dir=process.env.TIDAL_ART_DIR??'artifacts/qa/art-polish',label=process.env.TIDAL_ART_LABEL??'after';
if(!/^[a-z0-9-]+$/.test(label))throw new Error('Invalid capture label');
await mkdir(dir,{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[],external=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).origin!==new URL(url).origin)external.push(r.url());});
await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
const quality=()=>page.locator('#worldCanvas canvas').evaluate(c=>({scale:Number(c.parentElement.dataset.renderScale),width:c.width,height:c.height,cssWidth:c.clientWidth,cssHeight:c.clientHeight}));
try{
 await page.goto(url);await expect(page.locator('#planModal')).toBeVisible();await expect(page.locator('#testModeBadge')).toBeHidden();
 await page.waitForTimeout(1500);await page.screenshot({path:`${dir}/${label}-home.png`,fullPage:true});const home=await quality();
 await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:8000});
 await page.waitForTimeout(1600);await page.screenshot({path:`${dir}/${label}-hero.png`,fullPage:true});const hero=await quality();
 await expect(page.locator('#chopValue')).toHaveText('0/15');expect(errors).toEqual([]);expect(external).toEqual([]);
 const report={date:new Date().toISOString(),browser:browser.version(),label,bundles:await page.locator('script[type="module"]').evaluateAll(nodes=>nodes.map(n=>n.src)),
  scope:'production manual keyboard entry, normal countdown, no camera, screenshots are observations rather than a product-art approval',home,hero,
  gpu:await page.locator('#worldCanvas').getAttribute('data-gpu'),errors,external};
 await writeFile(`${dir}/${label}-capture.json`,JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser.close();}
