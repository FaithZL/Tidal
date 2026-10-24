import {test,expect} from '../helpers/manualModeTest.js';
test.use({baseURL:'http://127.0.0.1:4174'});

test('unchanged homepage HUD retains text nodes and does not mutate on every animation frame',async({page})=>{
 await page.goto('/?e2e=1');
 // Measure steady-state HUD work after the new dynamic entry has finished startup.
 await expect(page.locator('body')).toHaveAttribute('data-boot','ready');
 await expect(page.locator('#planModal')).toBeVisible();
 const result=await page.evaluate(()=>new Promise<{mutations:number;retained:boolean}>(resolve=>{
  const nodes=['modeBadge','missionTitle','missionText','planModal','pauseBtn','rewardLogs','countdown'].map(id=>document.getElementById(id)!);
  const children=nodes.map(n=>n.firstChild);let mutations=0,frames=0;
  const observer=new MutationObserver(records=>{mutations+=records.length;});
  for(const node of nodes)observer.observe(node,{attributes:true,childList:true,subtree:true});
  const frame=()=>{if(++frames<20)requestAnimationFrame(frame);else{observer.disconnect();resolve({mutations,retained:nodes.every((n,i)=>n.firstChild===children[i])});}};
  requestAnimationFrame(frame);
 }));
 expect(result.mutations).toBe(0);expect(result.retained).toBe(true);
 await expect(page.locator('#chopValue')).toHaveText('0/15');
});

test('HUD optimization still shows action phases immediately and commits exactly one rep',async({page})=>{
 await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();
 await expect(page.locator('#statusTag')).toHaveText('训练中');
 await page.evaluate(()=>{
  const values:string[]=[];Reflect.set(window,'movementTexts',values);
  new MutationObserver(()=>values.push(document.getElementById('liveMovementState')!.textContent!))
   .observe(document.getElementById('liveMovementState')!,{childList:true,subtree:true});
 });
 await page.locator('#actionBtn').click();await expect(page.locator('#chopValue')).toHaveText('1/15');
 const values=await page.evaluate(()=>Reflect.get(window,'movementTexts') as string[]);
 expect(values.some(v=>v.includes('下挥'))).toBe(true);expect(values.some(v=>v.includes('复位'))).toBe(true);
 await page.waitForTimeout(200);await expect(page.locator('#chopValue')).toHaveText('1/15');
});
