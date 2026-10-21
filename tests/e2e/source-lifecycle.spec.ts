import {test,expect} from '../helpers/manualModeTest.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {installPoseFixture,prepareCamera,setPose,completeSyntheticChop} from '../helpers/browserPoseFixture.js';
test.use({baseURL:'http://127.0.0.1:4174',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
test('camera start stays disabled without calibration and simulation cannot enable it',async({page})=>{
  await page.goto('/?e2e=1');await page.locator('#acceptPlan').click();await expect(page.locator('#beginCamera')).toBeDisabled();
  await page.locator('#setupDemoToggle').click();await expect(page.locator('#beginCamera')).toBeHidden();
});
test('synthetic camera pipeline completes the farm through real recognizers and releases resources',async({page})=>{
  test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await installPoseFixture(page);
  await page.goto('/?e2e=1');await prepareCamera(page);await page.locator('#beginCamera').click();
  await expect(page.locator('#statusTag')).toHaveText('训练中');await expect(page.locator('#actionBtn')).toBeDisabled();
  await page.keyboard.press('Space');await expect(page.locator('#chopValue')).toHaveText('0/15');
  for(let i=1;i<=15;i++)await completeSyntheticChop(page,i);
  await expect(page.locator('#missionTitle')).toContainText('装');await expect(page.locator('#statusTag')).toHaveText('训练中');
  for(let i=1;i<=15;i++){await setPose(page,'standing');await setPose(page,'squat');await setPose(page,'press');await setPose(page,'standing',550);await expect(page.locator('#loadValue')).toHaveText(`${i}/15`);}
  await expect(page.locator('#statusTag')).toHaveText('训练中');await setPose(page,'hold',900);
  await page.locator('#pauseBtn').click();const carry=await page.locator('#carryValue').textContent();await page.waitForTimeout(500);await expect(page.locator('#carryValue')).toHaveText(carry!);
  await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});
  await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#systemStatus')).not.toContainText('请重新准备');
  await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
  await expect(page.locator('#actualMetrics')).toContainText('摄像头姿态代理');await expect.poll(()=>page.evaluate(()=>window.poseFixture.workers)).toBe(0);
  expect(await page.evaluate(()=>window.poseFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);expect(errors).toEqual([]);
  await page.evaluate(()=>{const b=document.createElement('div');b.textContent='QA 合成33点 / 模拟Worker → 真实识别器与领域；非真机验收';b.style.cssText='position:fixed;z-index:99;top:0;background:#5b3620;color:white;padding:8px';document.body.appendChild(b);});
  await mkdir('artifacts/qa/t09',{recursive:true});await page.screenshot({path:'artifacts/qa/t09/synthetic-camera-results.png',fullPage:true});
  await writeFile('artifacts/qa/t09/camera-flow.json',JSON.stringify({input:'authored synthetic points + fake video + Worker stub; real recognizers/domain',cameraHardware:'manual_pending',result:'pass',errors},null,2));
  await page.locator('#resultsHome').click();await expect(page.locator('#chopValue')).toHaveText('0/15');
});
test('tracking loss pauses, clears readiness and allows explicit keyboard fallback with honest mixed results',async({page})=>{
  test.setTimeout(70000);await installPoseFixture(page);await page.goto('/?e2e=1');await prepareCamera(page);await page.locator('#beginCamera').click();
  await expect(page.locator('#statusTag')).toHaveText('训练中');await setPose(page,'raised');await setPose(page,'down');
  await page.evaluate(()=>{window.poseFixture.low=true;});await expect(page.locator('#setupModal')).toBeVisible();
  await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#chopValue')).toHaveText('0/15');
  await page.locator('#beginDemo').click();await expect(page.locator('#setupModal')).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>window.poseFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.poseFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);
  await page.locator('#demoToggle').click();await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:30000});
  await expect(page.locator('#actualMetrics')).toContainText('混合');await expect(page.locator('#actualMetrics')).toContainText('模拟');
});

test('a stalled camera during rest cannot start the next active task without preparation',async({page})=>{
  test.setTimeout(70000);await installPoseFixture(page);await page.goto('/?e2e=1');await prepareCamera(page);await page.locator('#beginCamera').click();
  await expect(page.locator('#statusTag')).toHaveText('训练中');
  await page.evaluate(()=>{
    const count=document.getElementById('chopValue')!,status=document.getElementById('statusTag')!;
    const phases:string[]=[];
    const observer=new MutationObserver(()=>{
      if(count.textContent==='15/15')window.poseFixture.stalled=true;
      if(window.poseFixture.stalled&&phases.at(-1)!==status.textContent){phases.push(status.textContent!);document.body.dataset.stalledPhases=JSON.stringify(phases);}
    });
    observer.observe(count,{childList:true});observer.observe(status,{childList:true});
  });
  for(let i=1;i<=15;i++)await completeSyntheticChop(page,i);
  await page.waitForTimeout(800);
  // Even a brief active transition violates the next-task preparation gate.
  expect(await page.evaluate(()=>JSON.parse(document.body.dataset.stalledPhases!))).not.toContain('训练中');
  expect(await page.locator('#setupModal').isVisible()).toBe(true);
  await expect(page.locator('#loadValue')).toHaveText('0/15');
});
