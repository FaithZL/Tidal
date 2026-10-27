import {test,expect,type Page} from '@playwright/test';
import {installUpperBodyFixture,type UpperPose} from '../helpers/browserUpperBodyFixture.js';
import {mkdir,writeFile} from 'node:fs/promises';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
const output='artifacts/qa/upper-body-flow-20261026';
async function enter(page:Page,automatic=false){await installUpperBodyFixture(page);await page.addInitScript(auto=>localStorage.setItem('tidal.demo.enabled',String(auto)),automatic);await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await expect(page.locator('#setupModal')).toBeVisible();}
const pose=(page:Page,value:UpperPose)=>page.evaluate(value=>{window.upperFixture.pose=value;},value);
async function thirdStep(page:Page){await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised',{timeout:10000});await pose(page,'raised');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');}
async function prepare(page:Page){await thirdStep(page);await pose(page,'hold');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-finished','true');}
const state=(page:Page)=>page.evaluate(()=>({chop:document.getElementById('chopValue')!.textContent,load:document.getElementById('loadValue')!.textContent,carry:document.getElementById('carryValue')!.textContent,inventory:document.getElementById('worldCanvas')!.dataset.inventory}));
async function closed(page:Page){await expect(page.locator('#cameraFrames')).toHaveText('0');await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);expect(await page.locator('#cameraVideo').evaluate((v:HTMLVideoElement)=>v.srcObject===null)).toBe(true);await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#modeBadge')).toContainText('自动模拟');}

test('upper-body preparation closes recognition immediately and enters labelled automatic play without more clicks',async({page})=>{
 await enter(page);await expect(page.locator('#cameraExerciseMode')).toHaveValue('upper-body');expect(await page.evaluate(()=>window.upperFixture.tracks.length)).toBe(0);await prepare(page);await closed(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});
 await page.locator('#pauseBtn').click();const before=await state(page);await pose(page,'left-only');await page.waitForTimeout(800);expect(await state(page)).toEqual(before);await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','unavailable');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-ready','false');await expect(page.locator('#upperBodyStepCount')).toContainText('3/3');
 await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/upper-body-synthetic.png`});
});

test('unchanged posture and missing arm cannot finish automatic preparation',async({page})=>{
 await enter(page);await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.waitForTimeout(2500);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await expect(page.locator('#statusTag')).toHaveText('设备准备');await expect(page.locator('#beginCamera')).toBeDisabled();
 await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');await page.waitForTimeout(400);await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
});

test('automatic completion closes recognition but cannot override manual animation stop',async({page})=>{
 await enter(page);await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.locator('#setupAnimationStop').click();await pose(page,'raised');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await pose(page,'hold');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-finished','true');await closed(page);await expect(page.locator('#beginCamera')).toBeDisabled();await page.waitForTimeout(3500);await expect(page.locator('#app')).toHaveAttribute('data-phase','countdown');await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');
});

test('stopping at the automatic play countdown freezes progress while recognition stays closed',async({page})=>{
 await enter(page);await thirdStep(page);await page.evaluate(()=>{const app=document.getElementById('app')!;const observer=new MutationObserver(()=>{if(app.dataset.phase==='countdown'){document.getElementById('animationStop')!.click();observer.disconnect();}});observer.observe(app,{attributes:true,attributeFilter:['data-phase']});});await pose(page,'hold');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-finished','true');await closed(page);await expect(page.locator('#upperBodyCue')).not.toContainText('秒后');await page.waitForTimeout(3200);await expect(page.locator('#app')).toHaveAttribute('data-phase','countdown');await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');
});

test('an existing user pause is never owned by automatic preparation completion',async({page})=>{
 await installUpperBodyFixture(page);await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#pauseBtn').click();const before=await state(page);await page.locator('#cameraMode').click();await prepare(page);await closed(page);await page.waitForTimeout(3500);await expect(page.locator('#statusTag')).toHaveText('已暂停');expect(await state(page)).toEqual(before);
});

test('choosing camera from automatic play resumes only its own preparation pause after recognition closes',async({page})=>{
 await enter(page,true);const before=await state(page);await prepare(page);await closed(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});await expect.poll(async()=>parseInt((await page.locator('#chopValue').textContent())!)).toBeGreaterThan(parseInt(before.chop!));await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','true');expect(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'))).toBe('false');
});

test('three upper-body preparations lead to a camera-free automatic farm flow with carry pause preserved',async({page})=>{
 test.setTimeout(180000);await enter(page);await prepare(page);await closed(page);await page.evaluate(()=>{window.upperFixture.absent=true;window.upperFixture.pose='lowered';});await expect(page.locator('#missionTitle')).toContainText('装');await expect(page.locator('#chopValue')).toHaveText('15/15');await expect(page.locator('#missionTitle')).toContainText('返回');await expect(page.locator('#loadValue')).toHaveText('15/15');
 await expect(page.locator('#statusTag')).toHaveText('训练中');await expect.poll(async()=>parseFloat((await page.locator('#carryValue').textContent())!)).toBeGreaterThan(.1);await page.locator('#pauseBtn').click();const before=await state(page);await page.waitForTimeout(500);expect(await state(page)).toEqual(before);await page.evaluate(()=>{window.upperFixture.pose='hold';window.upperFixture.absent=false;});await page.waitForTimeout(250);expect(await state(page)).toEqual(before);await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');await expect(page.locator('#actualMetrics')).toContainText('自动模拟');await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);
 await mkdir(output,{recursive:true});await writeFile(`${output}/full-flow.json`,JSON.stringify({input:'Six authored upper landmarks for preparation only; fake video/Worker, camera stopped before automatic demo source begins',result:'15/15/synthetic hold,15 delivered; pause does not fill time; no physical camera accuracy acceptance'},null,2));
});
