// Production UI replay with normal clocks. Only generated game imagery is recorded; no camera is opened.
import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
const dir='artifacts/qa/npr-refinement',url='http://127.0.0.1:4176/?art=npr-sample';
await mkdir(`${dir}/raw-video`,{recursive:true});
const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1366,height:900},recordVideo:{dir:`${dir}/raw-video`,size:{width:1366,height:900}}});
await context.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
const page=await context.newPage(),video=page.video(),errors=[],external=[],poseRequests=[];
const begin=Date.now();
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).origin!==new URL(url).origin)external.push(r.url());if(/pose_landmarker|\/worker\/|\/mediapipe\//.test(r.url()))poseRequests.push(r.url());});
try{
 await page.goto(url);await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-art','tidal-npr-sample-v2');await expect(page.locator('#testModeBadge')).toBeHidden();
 await page.locator('#cancelPlan').click();await page.waitForTimeout(500);await page.screenshot({path:`${dir}/showcase.png`});
 await page.locator('#actionBtn').click();await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();
 await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:9000});
 const chopAt=Date.now()-begin;
 for(let i=1;i<=15;i++){
  await page.locator('#actionBtn').click();await expect(page.locator('#chopValue')).toHaveText(`${i}/15`);
  if(i===1)await page.screenshot({path:`${dir}/chop.png`});await page.waitForTimeout(140);
 }
 await expect(page.locator('#stageTitle')).toHaveText('把木材装上手推车');
 await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:26000});
 const loadAt=Date.now()-begin;
 for(let i=1;i<=3;i++){await page.locator('#actionBtn').click();await expect(page.locator('#loadValue')).toHaveText(`${i}/15`);await page.waitForTimeout(180);}
 await page.locator('#pauseBtn').click();await page.waitForTimeout(350);await page.screenshot({path:`${dir}/load.png`});
 const report={date:new Date().toISOString(),url,bundles:await page.locator('script[type="module"]').evaluateAll(nodes=>nodes.map(n=>n.src)),
  browser:browser.version(),scope:'actual production keyboard UI, normal5s countdown/15s rest;15chops+3loads then pause, no acceleration/no physical camera; video encoding overhead means not an FPS benchmark',
  durationMs:Date.now()-begin,chopStartsMs:chopAt,loadStartsMs:loadAt,
  raster:await page.locator('#worldCanvas canvas').evaluate(c=>({width:c.width,height:c.height,scale:c.parentElement.dataset.renderScale})),gpu:await page.locator('#worldCanvas').getAttribute('data-gpu'),errors,external,poseRequests};
 expect(errors).toEqual([]);expect(external).toEqual([]);expect(poseRequests).toEqual([]);
 await writeFile(`${dir}/motion-capture.json`,JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{
 await context.close();if(video)await copyFile(await video.path(),`${dir}/motion-preview.webm`);await browser.close();
}
