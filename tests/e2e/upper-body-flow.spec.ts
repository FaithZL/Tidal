import {test,expect,type Page} from '@playwright/test';
import {installUpperBodyFixture,type UpperPose} from '../helpers/browserUpperBodyFixture.js';
import {mkdir,writeFile} from 'node:fs/promises';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
const output='artifacts/qa/upper-body-flow-20261026';
async function enter(page:Page,automatic=false){await installUpperBodyFixture(page);await page.addInitScript(auto=>localStorage.setItem('tidal.demo.enabled',String(auto)),automatic);await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await expect(page.locator('#setupModal')).toBeVisible();}
const pose=(page:Page,value:UpperPose)=>page.evaluate(value=>{window.upperFixture.pose=value;},value);
async function prepare(page:Page){await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised',{timeout:10000});await pose(page,'raised');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await pose(page,'hold');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');}
const state=(page:Page)=>page.evaluate(()=>({chop:document.getElementById('chopValue')!.textContent,load:document.getElementById('loadValue')!.textContent,carry:document.getElementById('carryValue')!.textContent,inventory:document.getElementById('worldCanvas')!.dataset.inventory}));
async function loop(page:Page,task:'chop'|'load',count:number){await pose(page,'lowered');await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await pose(page,'raised');await expect(page.locator('#inputDebug')).toContainText(task==='chop'?' · chop-down ·':' · press-up ·');await page.waitForTimeout(task==='chop'?400:800);await pose(page,'lowered');await expect(page.locator(task==='chop'?'#chopValue':'#loadValue')).toHaveText(`${count}/15`);}

test('upper body is the default formal camera plan and preparation starts training without capture/start clicks',async({page})=>{
 await enter(page);await expect(page.locator('#cameraExerciseMode')).toHaveValue('upper-body');expect(await page.evaluate(()=>window.upperFixture.tracks.length)).toBe(0);await prepare(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#modeBadge')).toContainText('上半身');
 await pose(page,'left-only');await page.waitForTimeout(800);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','adjust');await loop(page,'chop',1);
 await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/upper-body-synthetic.png`});
});

test('unchanged posture and missing arm cannot finish automatic preparation',async({page})=>{
 await enter(page);await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.waitForTimeout(2500);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await expect(page.locator('#statusTag')).toHaveText('设备准备');await expect(page.locator('#beginCamera')).toBeDisabled();
 await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');await page.waitForTimeout(400);await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
});

test('automatic preparation cannot override manual animation stop',async({page})=>{
 await enter(page);await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.locator('#setupAnimationStop').click();await pose(page,'raised');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await pose(page,'hold');await expect(page.locator('#beginCamera')).toBeEnabled();await page.waitForTimeout(3500);await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');
});

test('stopping during the automatic start countdown clears its pending message and never starts later',async({page})=>{
 await enter(page);await prepare(page);await expect(page.locator('#upperBodyCue')).toContainText('秒后');await page.locator('#setupAnimationStop').click();await expect(page.locator('#upperBodyCue')).not.toContainText('秒后');await page.waitForTimeout(3200);await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');await expect(page.locator('#chopValue')).toHaveText('0/15');
});

test('an existing user pause is never owned by automatic preparation',async({page})=>{
 await installUpperBodyFixture(page);await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#pauseBtn').click();const before=await state(page);await page.locator('#cameraMode').click();await prepare(page);await page.waitForTimeout(3500);await expect(page.locator('#statusTag')).toHaveText('已暂停');await expect(page.locator('#setupModal')).toBeVisible();expect(await state(page)).toEqual(before);
});

test('choosing camera from automatic play resumes only its own preparation pause',async({page})=>{
 await enter(page,true);const before=await state(page);await prepare(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});expect(await state(page)).toEqual(before);await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
});

test('upper-body full farm flow completes with no lower-body landmarks and carry never fills stopped time',async({page})=>{
 test.setTimeout(180000);await enter(page);await prepare(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});for(let i=1;i<=15;i++)await loop(page,'chop',i);await expect(page.locator('#missionTitle')).toContainText('装');await expect(page.locator('#statusTag')).toHaveText('训练中');for(let i=1;i<=15;i++)await loop(page,'load',i);
 await expect(page.locator('#missionTitle')).toContainText('返回');await expect(page.locator('#statusTag')).toHaveText('训练中');await pose(page,'hold');await expect.poll(async()=>parseFloat((await page.locator('#carryValue').textContent())!)).toBeGreaterThan(.1);await page.locator('#pauseBtn').click();const before=await state(page);await page.waitForTimeout(500);expect(await state(page)).toEqual(before);await page.locator('#pauseBtn').click();await page.waitForTimeout(250);expect(await state(page)).toEqual(before);await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);
 await mkdir(output,{recursive:true});await writeFile(`${output}/full-flow.json`,JSON.stringify({input:'Six authored upper landmarks; lower landmarks deliberately unavailable; fake video/Worker; actual recognizers/domain',result:'15/15/valid hold,15 delivered; no physical camera accuracy acceptance'},null,2));
});
