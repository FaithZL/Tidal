// Production diagnostic: normal clocks and explicit automatic simulation, never a camera accuracy test.
import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const output=process.env.TIDAL_PROFILE_OUTPUT??'artifacts/qa/performance/profile.json';
const duration=Number(process.env.TIDAL_PROFILE_WINDOW_MS??60000),warmup=Number(process.env.TIDAL_PROFILE_WARMUP_MS??10000);
const url=process.env.TIDAL_PREVIEW_URL??'http://127.0.0.1:4175/';
if(!Number.isFinite(duration)||duration<1000||!Number.isFinite(warmup)||warmup<0)throw new Error('Invalid sample window');
await mkdir(output.slice(0,output.lastIndexOf('/')),{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1366,height:900}});
const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).origin!==new URL(url).origin)external.push(r.url());});
await page.addInitScript(()=>{
 const counters={calls:0,renders:0,triangles:0,submitMs:0};window.tidalGLCounters=counters;
 for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){
  const original=WebGL2RenderingContext.prototype[name];
  WebGL2RenderingContext.prototype[name]=function(...args){
   const begin=performance.now();const result=Reflect.apply(original,this,args);counters.submitMs+=performance.now()-begin;counters.calls++;
   const count=name.startsWith('drawElements')?args[1]:args[2],instances=name.endsWith('Instanced')?args.at(-1):1;
   if(args[0]===this.TRIANGLES)counters.triangles+=count/3*instances;return result;
  };
 }
 const clear=WebGL2RenderingContext.prototype.clear;
 WebGL2RenderingContext.prototype.clear=function(mask){if(mask&this.COLOR_BUFFER_BIT)counters.renders++;return clear.call(this,mask);};
});
const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
const metric=(data,name)=>data.metrics.find(m=>m.name===name)?.value??0;
try{
 await page.goto(url);await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','true');
 await expect(page.locator('#testModeBadge')).toBeHidden();await page.waitForTimeout(warmup);
 const before=await cdp.send('Performance.getMetrics');
 const samples=await page.evaluate(ms=>new Promise(resolve=>{
  const rows=[],initial={...window.tidalGLCounters};let start=0,last=0,previous={...initial};
  const frame=now=>{
   if(!start)start=now;
   if(last){const c=window.tidalGLCounters;rows.push({dt:now-last,drawCalls:c.calls-previous.calls,renders:c.renders-previous.renders,
    triangles:c.triangles-previous.triangles,submitMs:c.submitMs-previous.submitMs,renderScale:Number(document.getElementById('worldCanvas').dataset.renderScale??1),phase:document.getElementById('app').dataset.phase,task:document.getElementById('stageTitle').textContent});previous={...c};}
   last=now;if(now-start<ms)requestAnimationFrame(frame);else resolve(rows);
  };requestAnimationFrame(frame);
 }),duration);
 const after=await cdp.send('Performance.getMetrics');
 function summarize(rows){
  const dt=rows.map(s=>s.dt).sort((a,b)=>a-b),sum=k=>rows.reduce((a,r)=>a+r[k],0),span=sum('dt'),renders=sum('renders');
  return{samples:rows.length,spanMs:span,fps:1000*rows.length/span,p50Ms:dt[Math.floor(dt.length*.5)],p95Ms:dt[Math.floor(dt.length*.95)],maxMs:dt.at(-1),
   over50:dt.filter(n=>n>50).length,colorClears:renders,drawCalls:sum('drawCalls'),drawCallsPerColorClear:renders?sum('drawCalls')/renders:0,
   trianglesPerColorClear:renders?sum('triangles')/renders:0,drawCallsPerAnimationFrame:sum('drawCalls')/rows.length,drawSubmissionMs:sum('submitMs'),
   minRenderScale:Math.min(...rows.map(r=>r.renderScale)),maxRenderScale:Math.max(...rows.map(r=>r.renderScale))};
 }
 const grouped={};for(const row of samples){const key=row.phase+'/'+row.task;(grouped[key]??=[]).push(row);}
 const cpu={};for(const key of ['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'])cpu[key]=metric(after,key)-metric(before,key);
 const report={date:new Date().toISOString(),browser:browser.version(),bundles:await page.locator('script[type="module"]').evaluateAll(nodes=>nodes.map(n=>n.src)),
  viewport:{width:1366,height:900,dpr:await page.evaluate(()=>devicePixelRatio)},renderer:await page.locator('#worldCanvas').getAttribute('data-renderer'),gpu:await page.locator('#worldCanvas').getAttribute('data-gpu'),
  method:'headless Chromium production, normal clocks, default automatic simulation, WebGL API counters including shadows; COLOR clears count render passes, not displayed frames; CPU submission time is not GPU execution time',warmupMs:warmup,requestedWindowMs:duration,
  targetFps:60,measurement:summarize(samples),byPhase:Object.fromEntries(Object.entries(grouped).map(([key,rows])=>[key,summarize(rows)])),cpu,
  raster:await page.locator('#worldCanvas canvas').evaluate(canvas=>({width:canvas.width,height:canvas.height,cssWidth:canvas.clientWidth,cssHeight:canvas.clientHeight})),
  physicalCamera:'manual_pending',errors,external};
 await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(report);expect(errors).toEqual([]);expect(external).toEqual([]);
}finally{await cdp.detach();await browser.close();}
