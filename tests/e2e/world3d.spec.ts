import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {installPoseFixture,prepareCamera} from '../helpers/browserPoseFixture.js';
test.use({launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
test('real 3D farm renders and orbiting changes camera and projected geometry without adding exercise',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-renderer',/^Three.js/);
 await page.locator('#cancelPlan').click();const world=page.locator('#worldCanvas');
 const initial=await world.getAttribute('data-camera'),projected=await world.getAttribute('data-probe');
 const canvas=page.locator('#worldCanvas canvas'),box=(await canvas.boundingBox())!;
 await page.mouse.move(box.x+box.width*.45,box.y+box.height*.45);await page.mouse.down();
 await page.mouse.move(box.x+box.width*.65,box.y+box.height*.48,{steps:15});await page.mouse.up();
 await expect(world).not.toHaveAttribute('data-camera',initial!);await expect(world).not.toHaveAttribute('data-probe',projected!);
 await expect(page.locator('#chopValue')).toHaveText('0/15');
 await mkdir('artifacts/qa/3d',{recursive:true});await page.screenshot({path:'artifacts/qa/3d/orbit.png'});
 expect(errors).toEqual([]);
});
test('full farm homepage has a small notification and results give exercise and rewards equal space',async({page})=>{
 await page.goto('http://127.0.0.1:4174/?e2e=1');
 const world=(await page.locator('#worldCanvas').boundingBox())!,card=(await page.locator('#planModal .modal').boundingBox())!;
 expect(world.width).toBe(page.viewportSize()!.width);expect(world.height).toBe(page.viewportSize()!.height);expect(card.width).toBeLessThanOrEqual(390);
 await page.screenshot({path:'artifacts/qa/3d/home.png'});
 await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();await page.locator('#beginDemo').click();
 await expect(page.locator('#livePreview')).toBeVisible();await expect(page.locator('#livePrescription')).toContainText('5 次 × 3');
 await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});
 const exercise=(await page.locator('#exerciseResults').boundingBox())!,rewards=(await page.locator('#gameRewards').boundingBox())!;
 expect(Math.abs(exercise.width-rewards.width)).toBeLessThan(2);
 await expect(page.locator('#resultChop')).toHaveText('15');await expect(page.locator('#resultLoad')).toHaveText('15');
 await expect(page.locator('#actualMetrics')).toContainText('自动模拟');await page.screenshot({path:'artifacts/qa/3d/results.png'});
});
test('camera PiP reuses the same playing video and stream during training and re-preparation',async({page})=>{
 test.setTimeout(60000);await installPoseFixture(page);await page.goto('http://127.0.0.1:4174/?e2e=1');await prepareCamera(page);
 await page.locator('#cameraVideo').evaluate((v:HTMLVideoElement)=>{Reflect.set(window,'originalVideo',v);Reflect.set(window,'originalStream',v.srcObject);});
 await page.locator('#beginCamera').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
 await expect(page.locator('#gamePreviewHost #cameraVideo')).toBeVisible();await expect(page.locator('#livePrescription')).toContainText('5 次 × 3');
 const before=await page.locator('#cameraVideo').evaluate((v:HTMLVideoElement)=>v.currentTime);
 await expect.poll(()=>page.locator('#cameraVideo').evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(before);
 expect(await page.locator('#cameraVideo').evaluate((v:HTMLVideoElement)=>v===Reflect.get(window,'originalVideo')&&v.srcObject===Reflect.get(window,'originalStream'))).toBe(true);
 expect(await page.evaluate(()=>window.poseFixture.tracks.length)).toBe(1);expect(await page.evaluate(()=>window.poseFixture.maxWorkers)).toBe(1);
 await page.evaluate(()=>{const note=document.createElement('div');note.textContent='QA：合成视频 + 人工关键点 / 测试Worker，非真人或模型准确率验收';note.style.cssText='position:fixed;top:0;left:0;z-index:99;pointer-events:none;background:#493c26;color:white;padding:4px;font-size:11px';document.body.appendChild(note);});
 await page.screenshot({path:'artifacts/qa/3d/camera-pip-synthetic.png'});
 await page.locator('#recalibrate').click();await expect(page.locator('#setupPreviewHost #cameraVideo')).toBeVisible();
 expect(await page.evaluate(()=>window.poseFixture.tracks.length)).toBe(1);await page.locator('#backHome').click();
 await expect.poll(()=>page.evaluate(()=>window.poseFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.poseFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);
});
test('pause stops automatic camera drift and reset view restores the farm overview during a task',async({page})=>{
 await page.goto('http://127.0.0.1:4174/?e2e=1');const world=page.locator('#worldCanvas');
 await expect(world).toHaveAttribute('data-camera',/.+/);const overview=await world.getAttribute('data-camera');
 await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();await page.locator('#beginDemo').click();
 await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#pauseBtn').click();await page.waitForTimeout(50);
 const paused=await world.getAttribute('data-camera');await page.waitForTimeout(400);await expect(world).toHaveAttribute('data-camera',paused!);
 await page.locator('#viewReset').click();await expect(world).toHaveAttribute('data-camera',overview!);await expect(page.locator('#statusTag')).toHaveText('已暂停');
});
test('losing WebGL context pauses the session and shows a visible recovery error',async({page})=>{
 await page.goto('http://127.0.0.1:4174/?e2e=1');await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();
 await expect(page.locator('#statusTag')).toHaveText('训练中');
 await page.locator('#worldCanvas canvas').dispatchEvent('webglcontextlost',{cancelable:true});
 await expect(page.locator('#renderError')).toContainText('重新加载');await expect(page.locator('#statusTag')).toHaveText('已暂停');await expect(page.locator('#actionBtn')).toBeDisabled();
});
