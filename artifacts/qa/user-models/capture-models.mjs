import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const output=process.env.TIDAL_MODEL_QA_DIR??'artifacts/qa/user-models/final',base='http://127.0.0.1:4176/';await mkdir(output,{recursive:true});
const browser=await chromium.launch(),errors=[],external=[];
try{
 const context=await browser.newContext({viewport:{width:1366,height:900}});await context.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','false'));
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('request',request=>{const u=new URL(request.url());if(u.origin!==new URL(base).origin&&u.protocol!=='blob:'&&u.protocol!=='data:')external.push(u.href);});
 await page.goto(base+'?art=character-motion&rev=5');await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');
 await expect.poll(async()=>Number(await page.locator('#motionStage').getAttribute('data-paints'))).toBeGreaterThan(0);
 const entry=await page.locator('script[type=module]').evaluateAll(nodes=>nodes.map(node=>node.src));
 for(const [button,view,name] of [['同框查看','full','together'],['人物近景','character','character'],['房屋近景','house','house']]){
  const before=Number(await page.locator('#motionStage').getAttribute('data-paints'));await page.getByRole('button',{name:button,exact:true}).click();
  await expect(page.locator('#motionStage')).toHaveAttribute('data-view',view);await expect.poll(async()=>Number(await page.locator('#motionStage').getAttribute('data-paints'))).toBeGreaterThan(before);
  await page.screenshot({path:output+'/'+name+'.png'});
 }
 await page.getByRole('button',{name:'人物近景',exact:true}).click();await page.mouse.move(530,420);await page.mouse.down();await page.mouse.move(950,420,{steps:20});await page.mouse.up();await page.screenshot({path:output+'/character-back.png'});
 await page.goto(base+'?art=npr-sample&rev=5');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');await page.locator('#cancelPlan').click();await expect(page.locator('#planModal')).toBeHidden();await page.screenshot({path:output+'/farm-local.png'});
 const farm={house:await page.locator('#worldCanvas').getAttribute('data-house'),character:await page.locator('#worldCanvas').getAttribute('data-character'),inventory:await page.locator('#worldCanvas').getAttribute('data-inventory')};
 await page.setViewportSize({width:390,height:844});await page.goto(base+'?art=character-motion&rev=5');await expect(page.locator('#motionStage')).toHaveAttribute('data-assets','ready');await page.screenshot({path:output+'/narrow-390x844.png'});
 expect(errors).toEqual([]);expect(external).toEqual([]);await writeFile(output+'/capture.json',JSON.stringify({date:new Date().toISOString(),browser:browser.version(),entry,source:'Actual production Three.js rendering of user-supplied FBX models; static pose, no camera or animation claim.',farm,errors,external,narrow:'Desktop Chromium viewport emulation only; not a real phone'},null,2)+'\n');console.log({entry,farm,errors,external});
}finally{await browser.close();}
