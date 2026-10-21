// Actual production build, normal timing. Camera is never used; the opt-out error is injected explicitly.
import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const root='artifacts/qa/default-demo/',url='http://127.0.0.1:4175/';
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1366,height:900}});
const errors=[],external=[],poseRequests=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(new URL(r.url()).origin!==new URL(url).origin)external.push(r.url());if(/pose_landmarker|\/worker\/|\/mediapipe\//.test(r.url()))poseRequests.push(r.url());});
await page.context().route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.abort());
await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{document.documentElement.dataset.cameraRequested='true';throw new DOMException('injected missing device','NotFoundError');};});
const start=Date.now();
try{
 await page.goto(url+'?e2e=1');await expect(page.locator('#testModeBadge')).toBeHidden();
 await expect(page.locator('#planCarry')).toContainText('60 秒');
 await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','true');
 await expect(page.locator('#statusTag')).toHaveText('倒计时');await expect(page.locator('#livePreview')).toBeVisible();
 await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:8000});await expect(page.locator('#chopValue')).not.toHaveText('0/15');
 expect(await page.locator('html').getAttribute('data-camera-requested')).toBeNull();
 await page.screenshot({path:root+'production-autostart.png'});
 await page.reload();await expect(page.locator('#statusTag')).toHaveText('倒计时');await expect(page.locator('#chopValue')).toHaveText('0/15');
 await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:8000});await expect(page.locator('#chopValue')).not.toHaveText('0/15');
 await page.locator('#demoToggle').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
 const frozen=await page.locator('#chopValue').textContent();await page.waitForTimeout(500);await expect(page.locator('#chopValue')).toHaveText(frozen);
 await page.reload();await expect(page.locator('#planModal')).toBeVisible();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
 await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();await expect(page.locator('#cameraStatus')).toContainText('未找到摄像头');
 await page.reload();await expect(page.locator('#planModal')).toBeVisible();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
 expect(await page.locator('html').getAttribute('data-camera-requested')).toBeNull();
 await page.screenshot({path:root+'production-manual-choice.png'});
 await page.locator('#demoToggle').click();await page.reload();await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:8000});
 await expect(page.locator('#demoPreviewGame')).toBeVisible();await page.screenshot({path:root+'production-reenabled.png'});
 expect(errors).toEqual([]);expect(external).toEqual([]);expect(poseRequests).toEqual([]);
 const report={date:new Date().toISOString(),browser:browser.version(),bundles:await page.locator('script[type="module"]').evaluateAll(nodes=>nodes.map(n=>n.src)),
  input:'authored synthetic skeleton + automatic simulated signals; injected NotFoundError only for camera-choice branch; no physical camera',
  timing:'production 5s countdown / 15s rests / 60s carry, ordinary build ignores ?e2e=1; short startup/reload smoke, not a complete production session or performance benchmark',
  assertions:['fresh visit automatically starts','reload starts a fresh automatic session','toggle off freezes then persists on reload','explicit camera failure stays manual after reload without another permission request','re-enable persists and restarts on reload'],
  durationSeconds:(Date.now()-start)/1000,errors,external,poseRequests,physicalCamera:'manual_pending',result:'pass'};
 await writeFile(root+'production-smoke.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser.close();}
