import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const baseURL='http://127.0.0.1:4176';
const browser=await chromium.launch({channel:'chromium',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(new URL(r.url()).origin!==baseURL)external.push(r.url());});
 await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 await page.goto(baseURL);
 await page.locator('#planModal').waitFor({state:'visible'});
 const result=await page.evaluate(()=>{
  const world=document.getElementById('worldCanvas'),canvas=world?.querySelector('canvas');
  return {gpu:world?.dataset.gpu,renderer:world?.dataset.renderer,renderScale:world?.dataset.renderScale,canvas:canvas?{width:canvas.width,height:canvas.height}:null,dpr:devicePixelRatio,inventory:world?.dataset.inventory,status:document.getElementById('statusTag')?.textContent,scripts:[...document.scripts].map(s=>s.src).filter(Boolean)};
 });
 if(!result.canvas||!result.renderer?.startsWith('Three.js')||errors.length||external.length)throw new Error(JSON.stringify({result,errors,external}));
 await page.screenshot({path:'artifacts/qa/source-lifecycle-20261025/production-main.png',fullPage:true});
 await writeFile('artifacts/qa/source-lifecycle-20261025/production-smoke.json',JSON.stringify({baseURL,...result,errors,external,input:'manual home; no camera requested',limitations:'Not real camera, performance or final art acceptance'},null,2));
 console.log(JSON.stringify(result));
}finally{await browser.close();}
