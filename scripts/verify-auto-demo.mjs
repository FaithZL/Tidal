// Production artifact, real wall-clock defaults, explicit synthetic input. No camera or clock mocks.
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const url = process.env.TIDAL_PREVIEW_URL ?? 'http://127.0.0.1:4175/';
const output = process.env.TIDAL_QA_DIR ?? 'artifacts/qa/demo-toggle';
const blockExternal = process.env.TIDAL_BLOCK_EXTERNAL === '1';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
if(blockExternal)await page.context().route('**/*',route=>new URL(route.request().url()).origin===new URL(url).origin?route.continue():route.abort());
await page.addInitScript(()=>{
  // Explicit manual-entry scenario; fresh-visit autoplay is covered separately.
  localStorage.setItem('tidal.demo.enabled','false');
  const samples=[];let previous=0,started=0;
  const sample=now=>{if(!started)started=now;if(previous&&now-started>=10000)samples.push(now-previous);previous=now;requestAnimationFrame(sample);};
  requestAnimationFrame(sample);window.tidalFrameIntervals=samples;
});
const errors = [], external = [], poseRequests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => {
  if (new URL(request.url()).origin !== new URL(url).origin) external.push(request.url());
  if (/pose_landmarker|\/worker\/|\/mediapipe\//.test(request.url())) poseRequests.push(request.url());
});
const start = Date.now();
try {
  await page.goto(url + '?e2e=1');
  await expect(page.locator('#testModeBadge')).toBeHidden();
  await expect(page.locator('#planCarry')).toContainText('60 秒');
  await page.locator('#acceptPlan').click();await page.locator('#setupDemoToggle').click();
  await expect(page.locator('#demoPreviewSetup')).toBeVisible();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${output}/production-setup.png`, fullPage: true });
  await page.locator('#beginDemo').click();
  await expect(page.locator('#statusTag')).toHaveText('倒计时');
  await expect(page.locator('#statusTag')).toHaveText('训练中', { timeout: 8000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${output}/production-running.png`, fullPage: true });
  for (const task of ['chop', 'load']) {
    await expect(page.locator(`#${task}Value`)).toHaveText('15/15', { timeout: 30000 });
    await expect(page.locator('#statusTag')).toHaveText('休息时间');
    console.log(`Automatic ${task}: 15 complete, real 15-second rest`);
    await expect(page.locator('#statusTag')).toHaveText('倒计时', { timeout: 18000 });
    await expect(page.locator('#statusTag')).toHaveText('训练中', { timeout: 8000 });
  }
  console.log('Automatic carry: normal 60-second target, adjacent hold samples');
  await page.waitForTimeout(5000);
  await page.screenshot({path:`${output}/production-carry.png`,fullPage:true});
  const renderQuality=await page.locator('#worldCanvas canvas').evaluate(canvas=>({
    scale:Number(canvas.parentElement.dataset.renderScale??1),width:canvas.width,height:canvas.height,
    cssWidth:canvas.clientWidth,cssHeight:canvas.clientHeight
  }));
  await expect(page.locator('#resultsModal')).toBeVisible({ timeout: 75000 });
  await expect(page.locator('#carryValue')).toHaveText('60.0/60s');
  await expect(page.locator('#rewardLogs')).toHaveText('15');
  await expect(page.locator('#rewardCoins')).toHaveText('100');
  await expect(page.locator('#rewardStamina')).toHaveText('100');
  await expect(page.locator('#actualMetrics')).toContainText('自动模拟');
  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory', '0/0/15');
  const metrics = await page.locator('#actualMetrics').textContent();
  const intervals=await page.evaluate(()=>window.tidalFrameIntervals),sorted=[...intervals].sort((a,b)=>a-b);
  const spanMs=intervals.reduce((a,b)=>a+b,0);
  expect(spanMs).toBeGreaterThanOrEqual(60000);
  const rendering={method:'requestAnimationFrame intervals after 10s warmup; headless Chromium, automatic simulation, not physical-camera performance',samples:intervals.length,spanMs,
    fps:1000*intervals.length/spanMs,p50Ms:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],maxMs:sorted.at(-1),over50Ms:intervals.filter(ms=>ms>50).length};
  await page.screenshot({ path: `${output}/production-results.png`, fullPage: true });
  await page.locator('#resultsHome').click();await expect(page.locator('#planModal')).toBeVisible();
  await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked', 'true');
  await page.waitForTimeout(300);await expect(page.locator('#chopValue')).toHaveText('0/15');
  expect(errors).toEqual([]);expect(external).toEqual([]);expect(poseRequests).toEqual([]);
  const report = { date: new Date().toISOString(), browser: browser.version(), platform: process.platform,
    bundles: await page.locator('script[type="module"]').evaluateAll(nodes => nodes.map(node => node.src)),
    input: 'explicit automatic simulation + authored skeleton; no camera',
    timing: 'production 5s countdown / 15s rests / 60s effective carry; real wall clock',
    network:blockExternal?'all non-localhost origins blocked by browser routing; not a physical network disconnect':'no routing block; observed request origins',rendering,renderQuality,
    renderer:await page.locator('#worldCanvas').getAttribute('data-renderer'),gpu:await page.locator('#worldCanvas').getAttribute('data-gpu'),
    durationSeconds: (Date.now() - start) / 1000, metrics, errors, external, poseRequests, reset: 'pass', result: 'pass' };
  await writeFile(`${output}/production-auto-flow.json`, JSON.stringify(report, null, 2) + '\n');console.log(report);
} finally { await browser.close(); }
