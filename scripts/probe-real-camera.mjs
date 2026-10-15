// Explicit manual diagnostic: no fake device, no screenshots, video or landmark files.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('artifacts/qa', { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ permissions: ['camera'] });
const page = await context.newPage();
const report = { date: '2026-10-15', browser: browser.version(), platform: process.platform,
  input: 'Real camera attempt, no fake device flags; no image/pose recording', status: '', metrics: '', released: false, result: 'manual_pending' };
try {
  await page.goto(process.env.TIDAL_PREVIEW_URL ?? 'http://127.0.0.1:4175/');
  await page.locator('#acceptPlan').click();await page.locator('#cameraStart').click();
  try { await page.waitForFunction(() => /推理中|拒绝|未找到|占用|失败|超时|不支持/.test(document.querySelector('#cameraStatus').textContent), undefined, { timeout: 35_000 }); }
  catch { report.wait = 'No ready/error terminal state within 35 seconds'; }
  report.status = await page.locator('#cameraStatus').textContent();
  if (report.status.includes('推理中')) await page.waitForTimeout(5000);
  report.metrics = await page.locator('#cameraMetrics').textContent();
  report.devices = await page.evaluate(async () => (await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput').map(d=>d.label));
} catch (error) { report.error=String(error); }
finally {
  await page.locator('#cameraStop').click().catch(()=>{});
  report.released = await page.locator('#cameraVideo').evaluate(v=>v.srcObject===null).catch(()=>false);
  await writeFile('artifacts/qa/real-camera-probe.json',JSON.stringify(report,null,2)+'\n');console.log(report);await browser.close();
}
