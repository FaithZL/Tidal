// Throwaway A/B diagnostic on the same immutable production bundle, not product settings or acceptance.
import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch(),results=[];
try{
 for(const mode of ['unchanged','no-backdrop-blur','half-render-resolution']){
  const page=await browser.newPage({viewport:{width:1366,height:900}});
  if(mode==='no-backdrop-blur')await page.route('**/*.css',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\n*{backdrop-filter:none!important}'});});
  if(mode==='half-render-resolution')await page.addInitScript(()=>Object.defineProperty(window,'devicePixelRatio',{value:.5}));
  await page.goto('http://127.0.0.1:4175/');await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:8000});
  // The first rest is a continuously moving scene with unchanged normal production clocks.
  await expect(page.locator('#statusTag')).toHaveText('休息时间',{timeout:30000});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');const before=await cdp.send('Performance.getMetrics');
  const measurement=await page.evaluate(()=>new Promise(resolve=>{let start=0,last=0;const dt=[];
   const frame=now=>{if(!start)start=now;if(last)dt.push(now-last);last=now;if(now-start<8000)requestAnimationFrame(frame);else{dt.sort((a,b)=>a-b);resolve({fps:dt.length*1000/(now-start),p95:dt[Math.floor(dt.length*.95)],samples:dt.length});}};requestAnimationFrame(frame);
  }));
  const after=await cdp.send('Performance.getMetrics'),metric=(set,name)=>set.metrics.find(m=>m.name===name)?.value??0;
  results.push({mode,measurement,taskSeconds:metric(after,'TaskDuration')-metric(before,'TaskDuration'),scriptSeconds:metric(after,'ScriptDuration')-metric(before,'ScriptDuration')});await cdp.detach();await page.close();
 }
 const report={date:new Date().toISOString(),browser:browser.version(),scope:'8s first-rest A/B diagnosis, normal production bundle; no fake frame rate or acceptance claim',results};
 await writeFile('artifacts/qa/performance/diagnose.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser.close();}
