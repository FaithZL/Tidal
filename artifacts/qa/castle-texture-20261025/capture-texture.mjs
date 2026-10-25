import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const output=process.env.TIDAL_TEXTURE_QA_DIR??'artifacts/qa/castle-texture-20261025/production';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium'}),results=[],errors=[],consoleErrors=[],failedResources=[],external=[],textures=[];
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}});
 await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')consoleErrors.push({message:m.text(),location:m.location()});});
 page.on('request',r=>{if(!['http://127.0.0.1:4176','null'].includes(new URL(r.url()).origin))external.push(r.url());});
 page.on('response',r=>{if(r.status()>=400)failedResources.push({url:r.url(),status:r.status()});if(r.url().endsWith('castle-soft-toon-v1.png'))textures.push({url:r.url(),status:r.status()});});
 for(const [name,route] of [['farm','/'],['npr','/?art=npr-sample']]){
  await page.goto('http://127.0.0.1:4176'+route);
  await page.waitForFunction(()=>document.getElementById('worldCanvas')?.dataset.assets==='ready');
  await page.locator('#cancelPlan').click();await page.locator('#viewCastle').click();await page.waitForTimeout(150);
  await page.screenshot({path:`${output}/${name}-castle.png`});
  for(let i=0;i<12;i++)await page.locator('#viewRight').click();
  await page.waitForTimeout(100);await page.screenshot({path:`${output}/${name}-back.png`});
  await page.locator('#viewCastle').click();
  results.push({name,...await page.locator('#worldCanvas').evaluate(e=>({...e.dataset})),cameraRequested:await page.locator('#cameraVideo').evaluate(v=>v.srcObject!==null)});
 }
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);
 await page.screenshot({path:`${output}/narrow-castle.png`});
 const browserIconErrors=consoleErrors.filter(e=>e.location.url==='http://127.0.0.1:4176/favicon.ico'&&e.message==='Failed to load resource: the server responded with a status of 404 (Not Found)');
 const unexpectedConsoleErrors=consoleErrors.filter(e=>!browserIconErrors.includes(e));
 const record={results,errors,consoleErrors,browserIconErrors,unexpectedConsoleErrors,failedResources,external,textures,input:'manual home; no camera requested',material:'New generated colors baked to original UV; original FBX unmodified'};
 await writeFile(output+'/capture.json',JSON.stringify(record,null,2)+'\n');
 if(errors.length||unexpectedConsoleErrors.length||failedResources.length||external.length||textures.length!==2||textures.some(t=>t.status!==200))throw new Error(JSON.stringify(record));
 console.log(JSON.stringify(record));
}finally{await browser.close();}
