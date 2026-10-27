import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test.use({baseURL:'http://127.0.0.1:4174'});

test('fresh visits and reloads leave simulation off without hidden progression or camera access',async({page})=>{
 const errors:string[]=[],poseRequests:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/pose_landmarker|\/worker\/|\/mediapipe\//.test(r.url()))poseRequests.push(r.url());});
 await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{document.documentElement.dataset.cameraRequested='true';throw new Error('camera must stay off');};});
 await page.goto('/?e2e=1');
 await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
 await expect(page.locator('#livePreview')).toBeHidden();await expect(page.locator('#planModal')).toBeVisible();
 await page.waitForTimeout(700);await expect(page.locator('#app')).toHaveAttribute('data-phase','home');await expect(page.locator('#chopValue')).toHaveText('0/15');
 await page.reload();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
 await page.waitForTimeout(700);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#resultsModal')).toBeHidden();
 await mkdir('artifacts/qa/default-off-20261027',{recursive:true});await page.screenshot({path:'artifacts/qa/default-off-20261027/initial-off.png'});
 expect(await page.locator('html').getAttribute('data-camera-requested')).toBeNull();expect(poseRequests).toEqual([]);expect(errors).toEqual([]);
});

test('turning simulation off survives reload, and explicitly enabling it survives the next reload',async({page})=>{
 await page.goto('/?e2e=1');await expect(page.locator('#acceptPlan')).toBeEnabled();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await page.locator('#demoToggle').click();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','true');await page.reload();await expect(page.locator('#statusTag')).toHaveText('训练中');
 await page.locator('#demoToggle').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
 const stopped=await page.locator('#chopValue').textContent();await page.waitForTimeout(350);await expect(page.locator('#chopValue')).toHaveText(stopped!);
 await page.reload();await expect(page.locator('#planModal')).toBeVisible();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
 await page.waitForTimeout(350);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#demoPreviewGame')).toBeHidden();
 await expect(page.locator('#acceptPlan')).toBeEnabled();await page.locator('#demoToggle').click();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','true');await page.reload();await expect(page.locator('#statusTag')).toHaveText('训练中');
 await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','true');await expect(page.locator('#demoPreviewGame')).toBeVisible();
});

test('choosing real camera opts out of autoplay even when the device fails and the page reloads',async({page})=>{
 await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{document.documentElement.dataset.cameraRequested='true';throw new DOMException('no physical camera','NotFoundError');};});
 await page.goto('/?e2e=1');await expect(page.locator('#acceptPlan')).toBeEnabled();await page.locator('#demoToggle').click();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','true');await page.reload();await expect(page.locator('#statusTag')).toHaveText('训练中');
 await page.locator('#resetBtn').click();await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();
 await expect(page.locator('#cameraStatus')).toContainText('未找到摄像头');await expect(page.locator('#setupDemoToggle')).toHaveAttribute('aria-checked','false');
 await page.reload();await expect(page.locator('#planModal')).toBeVisible();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
 await page.waitForTimeout(350);await expect(page.locator('#chopValue')).toHaveText('0/15');
 expect(await page.locator('html').getAttribute('data-camera-requested')).toBeNull();
});

test('blocked browser storage defaults off and still permits explicit session-local simulation',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError');}});});
 await page.goto('/?e2e=1');await expect(page.locator('#acceptPlan')).toBeEnabled();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#planModal')).toBeVisible();
 await page.locator('#demoToggle').click();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','true');await page.locator('#acceptPlan').click();await page.locator('#beginDemo').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
 await page.locator('#demoToggle').click();await page.locator('#resetBtn').click();
 await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#planModal')).toBeVisible();
 await page.reload();await expect(page.locator('#statusTag')).toHaveText('未开始');await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');expect(errors).toEqual([]);
});

test('a renderer initialization failure keeps default autoplay at home with no hidden progression',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('tidal.demo.enabled','true'));
 await page.addInitScript(()=>{window.ResizeObserver=class{constructor(){throw new Error('test initialization failure');}} as unknown as typeof ResizeObserver;});
 await page.goto('/?e2e=1');await expect(page.locator('#renderError')).toContainText('无法启动3D');
 await expect(page.locator('#planModal')).toBeVisible();await expect(page.locator('#acceptPlan')).toBeDisabled();
 await page.waitForTimeout(400);await expect(page.locator('#statusTag')).toHaveText('未开始');await expect(page.locator('#chopValue')).toHaveText('0/15');
});
