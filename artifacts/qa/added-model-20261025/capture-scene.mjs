import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chromium'}),results=[],errors=[],external=[];
const output='artifacts/qa/added-model-20261025/production';await mkdir(output,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}});
 await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['http://127.0.0.1:4176','null'].includes(new URL(r.url()).origin))external.push(r.url());});
 for(const [name,url] of [['farm','/'],['npr','/?art=npr-sample']]){
  await page.goto('http://127.0.0.1:4176'+url);await page.waitForFunction(()=>document.getElementById('worldCanvas')?.dataset.assets==='ready');
  await page.screenshot({path:`${output}/${name}-overview.png`});
  await page.locator('#cancelPlan').click();await page.getByRole('button',{name:'城堡近景',exact:true}).click();await page.waitForTimeout(100);
  await page.screenshot({path:`${output}/${name}-castle.png`});
  results.push({name,...await page.locator('#worldCanvas').evaluate(e=>({...e.dataset})),cameraRequested:await page.locator('#cameraVideo').evaluate(v=>v.srcObject!==null)});
 }
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);await page.screenshot({path:`${output}/narrow-castle.png`});
 if(errors.length||external.length)throw new Error(JSON.stringify({errors,external}));
 await writeFile(output+'/capture.json',JSON.stringify({results,errors,external,input:'manual home, no camera requested',newSource:'model2b63561bfbee01.fbx; source has no textures',secondSource:'modelabd4643519d001.fbx; no textures, not substituted'},null,2));console.log(JSON.stringify({results,errors,external}));
}finally{await browser.close();}
