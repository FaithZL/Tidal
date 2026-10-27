import {test,expect,type Page} from '@playwright/test';
import {installUpperBodyFixture} from '../helpers/browserUpperBodyFixture.js';
test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
async function start(page:Page,blurDuringOpen=false){
 await installUpperBodyFixture(page);await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#acceptPlan')).toBeEnabled();
 await page.locator('#cameraMode').click();
 if(blurDuringOpen)await page.evaluate(()=>{const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async constraints=>{window.dispatchEvent(new Event('blur'));return get(constraints);};});
 await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
}
async function finishPoses(page:Page){
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');
}
async function liveTraining(page:Page,expectedTracks=1){
 await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});await expect(page.locator('#setupModal')).toBeHidden();
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-training','true');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
 await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(1);expect(await page.evaluate(()=>window.upperFixture.tracks.length)).toBe(expectedTracks);expect(await page.evaluate(()=>window.upperFixture.tracks.at(-1)!.readyState)).toBe('live');
 await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#modeBadge')).toContainText('上半身');
}
test('the frame that saves the second pose enters training immediately without a second start countdown',async({page})=>{
 await start(page);await page.evaluate(()=>{
  const node=document.getElementById('upperBodyPreparation')!;
  const observer=new MutationObserver(()=>{if(node.dataset.step==='complete'){observer.disconnect();requestAnimationFrame(()=>{node.dataset.startedAtCompletion=String(node.dataset.training==='true'&&document.getElementById('app')!.dataset.phase!=='setup');});}});
  observer.observe(node,{attributes:true,attributeFilter:['data-step']});
 });
 await finishPoses(page);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-started-at-completion','true');await liveTraining(page);
});
test('visible blur during preparation cannot revoke the automatic start after all poses are saved',async({page})=>{
 await start(page);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#upperBodyStepCount')).toContainText('1/2');
 await finishPoses(page);await liveTraining(page);await expect(page.locator('#upperBodySuspendNotice')).not.toContainText('手动');
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#inputDebug')).toContainText(' · ready ·');
 await page.evaluate(()=>{window.upperFixture.pose='raised';});await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');await page.waitForTimeout(400);
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await expect(page.locator('#chopValue')).toHaveText('1/15');
});
test('returning from a hidden preparation page preserves start intent but requires fresh complete poses',async({page})=>{
 await start(page);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForTimeout(400);await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));window.upperFixture.pose='lowered';});
 await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await finishPoses(page);await liveTraining(page);
});
test('a camera permission blur during initialization does not require another Start click',async({page})=>{
 await start(page,true);await finishPoses(page);await liveTraining(page);
});
test('fresh preparation after a camera source error resumes automatically without a separate Continue click',async({page})=>{
 await start(page);await finishPoses(page);await liveTraining(page);
 await page.evaluate(()=>window.upperFixture.tracks[0].dispatchEvent(new Event('ended')));await expect(page.locator('#setupModal')).toBeVisible();
 await expect(page.locator('#cameraStatus')).toContainText('摄像头已断开');await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.evaluate(()=>{window.upperFixture.pose='lowered';});await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');
 await finishPoses(page);await liveTraining(page,2);expect(await page.evaluate(()=>window.upperFixture.tracks[0].readyState)).toBe('ended');expect(await page.evaluate(()=>window.upperFixture.maxWorkers)).toBe(1);
});
