# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: upper-body-flow.spec.ts >> stopping during the automatic start countdown clears its pending message and never starts later
- Location: tests/e2e/upper-body-flow.spec.ts:27:1

# Error details

```
Error: expect(locator).not.toContainText(expected) failed

Locator: locator('#upperBodyCue')
Expected substring: not "秒后"
Received string: "准备完成，3 秒后进入训练。"
Timeout: 7000ms

Call log:
  - Expect "not toContainText" locator('#upperBodyCue') with timeout 7000ms
  - waiting for locator('#upperBodyCue')
    18 × locator resolved to <p id="upperBodyCue">准备完成，3 秒后进入训练。</p>
       - unexpected value "准备完成，3 秒后进入训练。"

```

```yaml
- paragraph: 准备完成，3 秒后进入训练。
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {installUpperBodyFixture,type UpperPose} from '../helpers/browserUpperBodyFixture.js';
  3  | import {mkdir,writeFile} from 'node:fs/promises';
  4  | test.use({baseURL:'http://127.0.0.1:4174',channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  5  | const output='artifacts/qa/upper-body-flow-20261026';
  6  | async function enter(page:Page,automatic=false){await installUpperBodyFixture(page);await page.addInitScript(auto=>localStorage.setItem('tidal.demo.enabled',String(auto)),automatic);await page.goto('/?e2e=1&art=npr-sample');await page.locator('#cameraMode').click();await expect(page.locator('#setupModal')).toBeVisible();}
  7  | const pose=(page:Page,value:UpperPose)=>page.evaluate(value=>{window.upperFixture.pose=value;},value);
  8  | async function prepare(page:Page){await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised',{timeout:10000});await pose(page,'raised');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await pose(page,'hold');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','complete');}
  9  | const state=(page:Page)=>page.evaluate(()=>({chop:document.getElementById('chopValue')!.textContent,load:document.getElementById('loadValue')!.textContent,carry:document.getElementById('carryValue')!.textContent,inventory:document.getElementById('worldCanvas')!.dataset.inventory}));
  10 | async function loop(page:Page,task:'chop'|'load',count:number){await pose(page,'lowered');await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await pose(page,'raised');await expect(page.locator('#inputDebug')).toContainText(task==='chop'?' · chop-down ·':' · press-up ·');await page.waitForTimeout(task==='chop'?400:800);await pose(page,'lowered');await expect(page.locator(task==='chop'?'#chopValue':'#loadValue')).toHaveText(`${count}/15`);}
  11 | 
  12 | test('upper body is the default formal camera plan and preparation starts training without capture/start clicks',async({page})=>{
  13 |  await enter(page);await expect(page.locator('#cameraExerciseMode')).toHaveValue('upper-body');expect(await page.evaluate(()=>window.upperFixture.tracks.length)).toBe(0);await prepare(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#modeBadge')).toContainText('上半身');
  14 |  await pose(page,'left-only');await page.waitForTimeout(800);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','adjust');await loop(page,'chop',1);
  15 |  await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/upper-body-synthetic.png`});
  16 | });
  17 | 
  18 | test('unchanged posture and missing arm cannot finish automatic preparation',async({page})=>{
  19 |  await enter(page);await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.waitForTimeout(2500);await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await expect(page.locator('#statusTag')).toHaveText('设备准备');await expect(page.locator('#beginCamera')).toBeDisabled();
  20 |  await page.evaluate(()=>{window.upperFixture.low=true;});await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','lowered');await page.waitForTimeout(400);await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  21 | });
  22 | 
  23 | test('automatic preparation cannot override manual animation stop',async({page})=>{
  24 |  await enter(page);await page.locator('#cameraStart').click();await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','raised');await page.locator('#setupAnimationStop').click();await pose(page,'raised');await expect(page.locator('#upperBodyPreparation')).toHaveAttribute('data-step','hold');await pose(page,'hold');await expect(page.locator('#beginCamera')).toBeEnabled();await page.waitForTimeout(3500);await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#animationStop')).toHaveAttribute('aria-pressed','true');
  25 | });
  26 | 
  27 | test('stopping during the automatic start countdown clears its pending message and never starts later',async({page})=>{
> 28 |  await enter(page);await prepare(page);await expect(page.locator('#upperBodyCue')).toContainText('秒后');await page.locator('#setupAnimationStop').click();await expect(page.locator('#upperBodyCue')).not.toContainText('秒后');await page.waitForTimeout(3200);await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');await expect(page.locator('#chopValue')).toHaveText('0/15');
     |                                                                                                                                                                                                          ^ Error: expect(locator).not.toContainText(expected) failed
  29 | });
  30 | 
  31 | test('an existing user pause is never owned by automatic preparation',async({page})=>{
  32 |  await installUpperBodyFixture(page);await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#pauseBtn').click();const before=await state(page);await page.locator('#cameraMode').click();await prepare(page);await page.waitForTimeout(3500);await expect(page.locator('#statusTag')).toHaveText('已暂停');await expect(page.locator('#setupModal')).toBeVisible();expect(await state(page)).toEqual(before);
  33 | });
  34 | 
  35 | test('choosing camera from automatic play resumes only its own preparation pause',async({page})=>{
  36 |  await enter(page,true);const before=await state(page);await prepare(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});expect(await state(page)).toEqual(before);await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
  37 | });
  38 | 
  39 | test('upper-body full farm flow completes with no lower-body landmarks and carry never fills stopped time',async({page})=>{
  40 |  test.setTimeout(180000);await enter(page);await prepare(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});for(let i=1;i<=15;i++)await loop(page,'chop',i);await expect(page.locator('#missionTitle')).toContainText('装');await expect(page.locator('#statusTag')).toHaveText('训练中');for(let i=1;i<=15;i++)await loop(page,'load',i);
  41 |  await expect(page.locator('#missionTitle')).toContainText('返回');await expect(page.locator('#statusTag')).toHaveText('训练中');await pose(page,'hold');await expect.poll(async()=>parseFloat((await page.locator('#carryValue').textContent())!)).toBeGreaterThan(.1);await page.locator('#pauseBtn').click();const before=await state(page);await page.waitForTimeout(500);expect(await state(page)).toEqual(before);await page.locator('#pauseBtn').click();await page.waitForTimeout(250);expect(await state(page)).toEqual(before);await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);
  42 |  await mkdir(output,{recursive:true});await writeFile(`${output}/full-flow.json`,JSON.stringify({input:'Six authored upper landmarks; lower landmarks deliberately unavailable; fake video/Worker; actual recognizers/domain',result:'15/15/valid hold,15 delivered; no physical camera accuracy acceptance'},null,2));
  43 | });
  44 | 
```