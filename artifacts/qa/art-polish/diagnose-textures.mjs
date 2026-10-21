// Throwaway rendering-cost diagnosis. Removing maps is not a product-quality or acceptance result.
import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch(),results=[];
try{
 for(const mode of ['unchanged','no-surface-sampling']){
  const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  if(mode==='no-surface-sampling')await page.addInitScript(()=>{
   const source=WebGL2RenderingContext.prototype.shaderSource;
   WebGL2RenderingContext.prototype.shaderSource=function(shader,text){return source.call(this,shader,text.replace(/^#define USE_MAP\s*$/gm,''));};
  });
  await page.goto('http://127.0.0.1:4175/');await expect(page.locator('#statusTag')).toHaveText('休息时间',{timeout:30000});
  await page.waitForTimeout(1500);
  const measurement=await page.evaluate(()=>new Promise(resolve=>{let start=0,last=0;const dt=[];
   const frame=now=>{if(!start)start=now;if(last)dt.push(now-last);last=now;if(now-start<8000)requestAnimationFrame(frame);else{dt.sort((a,b)=>a-b);resolve({fps:dt.length*1000/(now-start),p95:dt[Math.floor(dt.length*.95)],samples:dt.length});}};requestAnimationFrame(frame);
  }));
  results.push({mode,measurement,scale:await page.locator('#worldCanvas').getAttribute('data-render-scale'),errors});
  expect(errors).toEqual([]);await page.close();
 }
 const report={date:new Date().toISOString(),scope:'normal-clock production, identical first-rest 8s samples; shader intervention is diagnostic only, not acceptance',results};
 await writeFile('artifacts/qa/art-polish/diagnose-textures.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser.close();}
