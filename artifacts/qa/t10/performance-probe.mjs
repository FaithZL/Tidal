// Diagnostic comparison only, not the 60-second acceptance measurement.
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1366,height:900}});
const results=[];
try{
  for(const [name,url]of [['blank','about:blank'],['farm-idle','http://127.0.0.1:4175/']]){
    await page.goto(url);
    if(name==='farm-idle')await page.locator('#cancelPlan').click();
    const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
    await page.waitForTimeout(2000);
    const before=await cdp.send('Performance.getMetrics');
    const sample=await page.evaluate(()=>new Promise(resolve=>{
      let start=0,previous=0;const values=[];
      const frame=now=>{if(!start)start=now;if(previous)values.push(now-previous);previous=now;
        if(now-start<10000){requestAnimationFrame(frame);return;}
        values.sort((a,b)=>a-b);resolve({fps:values.length*1000/(now-start),samples:values.length,p95:values[Math.floor(values.length*.95)],max:values.at(-1)});
      };requestAnimationFrame(frame);
    }));
    const after=await cdp.send('Performance.getMetrics');
    const metric=(set,name)=>set.metrics.find(x=>x.name===name)?.value??0;
    const renderer=await page.evaluate(()=>{const gl=document.createElement('canvas').getContext('webgl');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable';});
    results.push({name,sample,mainThreadTaskSeconds:metric(after,'TaskDuration')-metric(before,'TaskDuration'),renderer});await cdp.detach();
  }
  const report={date:new Date().toISOString(),browser:browser.version(),scope:'headless diagnostic; 2s warmup + 10s samples; not acceptance or physical-camera performance',results};
  await writeFile('artifacts/qa/t10/performance-probe.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser.close();}
