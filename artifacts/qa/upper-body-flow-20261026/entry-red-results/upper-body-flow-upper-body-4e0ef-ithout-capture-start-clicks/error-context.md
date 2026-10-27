# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: upper-body-flow.spec.ts >> upper body is the default formal camera plan and preparation starts training without capture/start clicks
- Location: tests/e2e/upper-body-flow.spec.ts:12:1

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator: locator('#cameraExerciseMode')
Expected: "upper-body"
Timeout: 7000ms
Error: element(s) not found

Call log:
  - Expect "toHaveValue" locator('#cameraExerciseMode') with timeout 7000ms
  - waiting for locator('#cameraExerciseMode')

```

```yaml
- banner:
  - text: T ✦ TIDAL FARM 每一次运动，都让世界生长 本地测试加速模式 📷 摄像头姿态代理 · 真机待验证
  - switch "无摄像头测试：关"
  - button "摄像头识别"
  - button "停止动画"
  - button "动作教学"
  - button "开启音效"
  - button "重新开始"
- main:
  - text: YOUR LITTLE WORLD
  - heading "一座农场，等待你的第一步" [level=1]
  - text: 今日劳作 · 体验计划
  - img "可旋转三维农场。地面0、车上0、到家0。":
    - text: 用户人物/房屋 · 挥砍 / 装车 / 行走动作
    - link "原动作对照":
      - /url: /?art=npr-sample&model=prototype
  - text: 从一件小事开始，让这座农场苏醒。 0% 🪓 砍伐杉树 壶铃挥砍 🪵 木材装车 深蹲推举 🛒 运输木材 持续持姿
  - complementary:
    - text: MISSION CONTROL 设备准备
    - heading "农场计划" [level=2]
    - paragraph: 运动与经营结合的概念验证：把日常动作转化为农场资源。
    - text: 🪓 已完成挥砍
    - strong: 0/15
    - text: 🪵 已装车木材
    - strong: 0/15
    - text: ⏱ 有效拉车
    - strong: 0.0/2s
    - text: 🌲 砍倒树木
    - strong: 0/3
    - text: ✧ 将运动变成资产 收集资源 · 升级农场 · 获得正反馈 准备开始今天的劳作。
    - button "等待任务开始" [disabled]
    - paragraph: 按 Space 完成一次动作循环（禁用自动重复）
    - group: 输入诊断
- text: 拖拽旋转 · 滚轮缩放
- button "向左旋转视角": ↶
- button "向右旋转视角": ↷
- button "城堡近景"
- button "全景视角"
- contentinfo:
  - status: 会话 session-1 · 设备准备
- dialog "选择演示输入方式":
  - text: CHOOSE YOUR INPUT
  - heading "选择演示输入方式" [level=2]
  - button "查看动作教学"
  - button "停止动画"
  - paragraph: 键盘与模拟可完整演示。摄像头需完成标定后手动启动姿态代理；真机准确率尚待验证。
  - text: ⌨ 键盘演示模式 空格触发运动循环；拉车阶段长按空格 ✓
  - switch "无摄像头测试：关"
  - text: 打开可预览合成骨架，开始后自动完成农场流程。
  - button "开启摄像头识别"
  - button "停止 / 取消"
  - group "识别宽松度":
    - text: 识别宽松度 严格
    - status: 第 3 档 · 标准
    - text: 宽松
    - slider "识别宽松度": "3"
    - button "严格"
    - button "标准" [pressed]
    - button "宽松"
    - text: 按个人标定调整幅度与持姿容差，仍需完成动作并复位。训练中修改会暂停，已完成进度保留。颜色仅对照个人标定与当前步骤，不代表专业动作评分。
  - text: ● 匹配 ● 调整 ● 待判断
  - status: 暂无法判断
  - status: 点击开启诊断才请求视频权限；仅在本机处理。
  - text: 已返回推理帧：0
  - group: 姿态标定 · T06
  - text: 人体关键点不能确认器械重量、真实持握、心率或卡路里。仅单人固定机位的姿态代理；真机验证待完成。
  - button "完成标定后开始摄像头训练" [disabled]
  - button "返回首页"
  - button "关闭摄像头并开始键盘演示 →"
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
> 13 |  await enter(page);await expect(page.locator('#cameraExerciseMode')).toHaveValue('upper-body');expect(await page.evaluate(()=>window.upperFixture.tracks.length)).toBe(0);await prepare(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});await expect(page.locator('#setupModal')).toBeHidden();await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#modeBadge')).toContainText('上半身');
     |                                                                      ^ Error: expect(locator).toHaveValue(expected) failed
  14 |  await pose(page,'left-only');await page.waitForTimeout(800);await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#cameraPreview')).toHaveAttribute('data-feedback','adjust');await loop(page,'chop',1);
  15 |  await mkdir(output,{recursive:true});await page.screenshot({path:`output`});
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
  27 | test('choosing camera from automatic play resumes only its own preparation pause',async({page})=>{
  28 |  await enter(page,true);const before=await state(page);await prepare(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});expect(await state(page)).toEqual(before);await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');
  29 | });
  30 | 
  31 | test('upper-body full farm flow completes with no lower-body landmarks and carry never fills stopped time',async({page})=>{
  32 |  test.setTimeout(180000);await enter(page);await prepare(page);await expect(page.locator('#statusTag')).toHaveText('训练中',{timeout:10000});for(let i=1;i<=15;i++)await loop(page,'chop',i);await expect(page.locator('#missionTitle')).toContainText('装');await expect(page.locator('#statusTag')).toHaveText('训练中');for(let i=1;i<=15;i++)await loop(page,'load',i);
  33 |  await expect(page.locator('#missionTitle')).toContainText('返回');await expect(page.locator('#statusTag')).toHaveText('训练中');await pose(page,'hold');await expect.poll(async()=>parseFloat((await page.locator('#carryValue').textContent())!)).toBeGreaterThan(.1);await page.locator('#pauseBtn').click();const before=await state(page);await page.waitForTimeout(500);expect(await state(page)).toEqual(before);await page.locator('#pauseBtn').click();await page.waitForTimeout(250);expect(await state(page)).toEqual(before);await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});await expect(page.locator('#rewardLogs')).toHaveText('15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');await expect.poll(()=>page.evaluate(()=>window.upperFixture.workers)).toBe(0);expect(await page.evaluate(()=>window.upperFixture.tracks.every(t=>t.readyState==='ended'))).toBe(true);
  34 |  await mkdir(output,{recursive:true});await writeFile(`${output}/full-flow.json`,JSON.stringify({input:'Six authored upper landmarks; lower landmarks deliberately unavailable; fake video/Worker; actual recognizers/domain',result:'15/15/valid hold,15 delivered; no physical camera accuracy acceptance'},null,2));
  35 | });
  36 | 
```