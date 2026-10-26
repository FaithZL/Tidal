import {test,expect,type Page} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

test.use({baseURL:'http://127.0.0.1:4174'});
const output='artifacts/qa/movement-guide-20261026';
const joints=(page:Page)=>page.locator('#movementGuide circle[data-joint]').evaluateAll(nodes=>nodes.map(node=>[node.getAttribute('data-joint'),node.getAttribute('cx'),node.getAttribute('cy')]));
async function begin(page:Page){
 await page.addInitScript(()=>{localStorage.setItem('tidal.demo.enabled','false');navigator.mediaDevices.getUserMedia=async()=>{throw new Error('Standard guide must not request a camera');};});
 await page.goto('/?e2e=1&art=npr-sample');await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
}

test('a standard skeleton moves independently while keyboard training waits and freezes on pause',async({page})=>{
 await begin(page);const guide=page.getByRole('complementary',{name:'标准动作示范',exact:true});
 await expect(guide).toBeVisible();await expect(guide).toHaveAttribute('data-task','chop');await expect(guide.locator('circle[data-joint]')).toHaveCount(14);
 await expect(guide).toHaveAttribute('data-step','2');const a=await joints(page);await page.waitForTimeout(400);expect(await joints(page)).not.toEqual(a);
 await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/0');
 await page.locator('#pauseBtn').click();const frozen=await joints(page),time=await guide.getAttribute('data-time-ms');await page.waitForTimeout(250);
 expect(await joints(page)).toEqual(frozen);await expect(guide).toHaveAttribute('data-time-ms',time!);
 await page.locator('#tutorialOpen').click();await expect(page.locator('#tutorialModal')).toBeVisible();await page.locator('#tutorialClose').click();
 await expect(page.locator('#statusTag')).toHaveText('已暂停');expect(await joints(page)).toEqual(frozen);
 await page.locator('#pauseBtn').click();await expect.poll(async()=>guide.getAttribute('data-time-ms')).not.toBe(time);
 await expect(page.locator('#chopValue')).toHaveText('0/15');
});

test('the guide switches through all tasks without changing the automatic inventory flow',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));await page.goto('/?e2e=1&art=npr-sample');
 const guide=page.locator('#movementGuide');await expect(guide).toHaveAttribute('data-task','chop');await expect(guide).toBeVisible();
 await expect(guide).toHaveAttribute('data-task','load',{timeout:25000});await expect(guide.locator('circle[data-joint]')).toHaveCount(14);
 await expect(guide).toHaveAttribute('data-task','carry',{timeout:25000});
 const hold=await joints(page);await page.waitForTimeout(220);expect(await joints(page)).toEqual(hold);
 await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});await expect(guide).toBeHidden();await expect(page.locator('#rewardLogs')).toHaveText('15');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
 await page.locator('#resultsHome').click();await expect(guide).toBeHidden();await page.waitForTimeout(300);await expect(page.locator('#chopValue')).toHaveText('0/15');
});

test('desktop and narrow layouts keep the skeleton separate from input preview and action controls',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await begin(page);
 for(let rep=1;rep<=15;rep++){await page.locator('#actionBtn').click();await expect(page.locator('#chopValue')).toHaveText(`${rep}/15`);}
 await expect(page.locator('#missionTitle')).toHaveText('把木材装上手推车');await expect(page.locator('#statusTag')).toHaveText('训练中');
 await page.locator('#demoToggle').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
 await expect(page.locator('#movementGuide')).toHaveAttribute('data-task','load');
 const observations=[];
 for(const size of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:601,height:768},{width:620,height:768},{width:650,height:768},{width:390,height:844},{width:390,height:600}]){
  await page.setViewportSize(size);const guide=page.locator('#movementGuide');await expect(guide).toBeVisible();
  const time=await guide.getAttribute('data-time-ms');await page.waitForTimeout(100);await expect(guide).toHaveAttribute('data-time-ms',time!);
  const result=await page.evaluate(()=>{
   const box=(id:string)=>{const r=document.getElementById(id)!.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
   return {guide:box('movementGuide'),preview:box('livePreview'),action:box('actionBtn'),percent:box('scenePercent'),timeline:document.querySelector('.timeline')!.getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth};
  });
  const intersects=(a:typeof result.guide,b:typeof result.guide)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  expect(result.overflow).toBe(false);expect(result.guide.left).toBeGreaterThanOrEqual(0);expect(result.guide.right).toBeLessThanOrEqual(size.width);
  expect(result.guide.top).toBeGreaterThanOrEqual(0);expect(result.guide.bottom).toBeLessThanOrEqual(size.height);
  expect(intersects(result.guide,result.preview)).toBe(false);expect(intersects(result.guide,result.action)).toBe(false);expect(intersects(result.guide,result.timeline)).toBe(false);expect(intersects(result.guide,result.percent)).toBe(false);
  expect(intersects(result.percent,result.preview)).toBe(false);expect(result.percent.right).toBeLessThanOrEqual(size.width);
  observations.push({size,...result});await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/layout-${size.width}x${size.height}.png`});
 }
 await writeFile(`${output}/layout.json`,JSON.stringify(observations,null,2));
});

test('changing to reduced motion immediately shows a complete key pose instead of a half squat',async({page})=>{
 await page.route('**/movement-guide-motion-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><aside id="movementGuide"><b data-guide-task></b><svg></svg><span data-guide-step></span><small data-guide-note></small></aside>'}));
 await page.goto('/movement-guide-motion-fixture');
 const mid=await page.evaluate(async()=>{
  const modulePath='/src/ui/movementGuide.ts',controllerPath='/src/domain/sessionController.ts',configPath='/src/config/demoConfig.ts';
  const [{MovementGuide},{createSessionController},{createDemoConfig}]=await Promise.all([import(modulePath),import(controllerPath),import(configPath)]);
  const controller=createSessionController(createDemoConfig(),{nowMs:()=>0});controller.command({kind:'open-setup',mode:'keyboard'});controller.command({kind:'setup-ready'});
  const guide=new MovementGuide(document.getElementById('movementGuide')!);guide.sync({...controller.getSnapshot(),task:'load'},true);
  guide.update(1000);for(let time=1100;time<=2700;time+=100)guide.update(time);controller.dispose();
  return Number(document.querySelector('[data-joint="rightWrist"]')!.getAttribute('cy'));
 });
 expect(mid).toBeGreaterThan(130);expect(mid).toBeLessThan(180);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect.poll(async()=>Number(await page.locator('[data-joint="rightWrist"]').getAttribute('cy'))).toBeCloseTo(112.92,5);
 await expect(page.locator('#movementGuide')).toHaveAttribute('data-time-ms','0');await expect(page.locator('[data-guide-note]')).toContainText('关键姿态');
});

test('the real guide clears short hidden, paused and changed-context intervals without a hidden rAF',async({page})=>{
 await page.route('**/movement-guide-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><aside id="movementGuide"><b data-guide-task></b><svg></svg><span data-guide-step></span><small data-guide-note></small></aside>'}));
 await page.goto('/movement-guide-fixture');
 const result=await page.evaluate(async()=>{
  let hidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
  const modulePath='/src/ui/movementGuide.ts',controllerPath='/src/domain/sessionController.ts',configPath='/src/config/demoConfig.ts';
  const [{MovementGuide},{createSessionController},{createDemoConfig}]=await Promise.all([import(modulePath),import(controllerPath),import(configPath)]);
  const controller=createSessionController(createDemoConfig(),{nowMs:()=>0});controller.command({kind:'open-setup',mode:'keyboard'});controller.command({kind:'setup-ready'});
  const root=document.getElementById('movementGuide')!,guide=new MovementGuide(root),s=controller.getSnapshot();
  guide.sync(s,true);guide.update(1000);guide.update(1100);const before=root.dataset.timeMs;
  hidden=true;document.dispatchEvent(new Event('visibilitychange'));hidden=false;document.dispatchEvent(new Event('visibilitychange'));guide.update(1250);const afterHidden=root.dataset.timeMs;
  guide.sync({...s,pauseReasons:['user']},true);guide.update(1300);guide.sync(s,true);guide.update(1400);const afterPause=root.dataset.timeMs;
  guide.sync({...s,sourceEpoch:s.sourceEpoch+1},true);guide.update(1500);const afterEpoch=root.dataset.timeMs;
  guide.update(1600);guide.sync({...s,sessionId:'new-session'},true);guide.update(1700);const afterSession=root.dataset.timeMs;
  guide.sync({...s,phase:'rest',task:'load',taskRunId:'load-run'},true);guide.update(1800);const next={task:root.dataset.task,time:root.dataset.timeMs,copy:root.textContent};
  guide.dispose();controller.dispose();return {before,afterHidden,afterPause,afterEpoch,afterSession,next,disposed:root.hidden};
 });
 expect(result.before).toBe('100');expect(result.afterHidden).toBe(result.before);expect(result.afterPause).toBe(result.before);expect(result.afterEpoch).toBe('0');expect(result.afterSession).toBe('0');
 expect(result.next.task).toBe('load');expect(result.next.time).toBe('0');expect(result.next.copy).toContain('下一项');expect(result.disposed).toBe(true);
});
