# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: exercise-tutorial.spec.ts >> reopening under reduced motion initializes the selected step and traps focus on a narrow screen
- Location: tests/e2e/exercise-tutorial.spec.ts:52:1

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('#tutorialStepList button[aria-current="step"]')
Expected: 1
Received: 0
Timeout:  7000ms

Call log:
  - Expect "toHaveCount" locator('#tutorialStepList button[aria-current="step"]') with timeout 7000ms
  - waiting for locator('#tutorialStepList button[aria-current="step"]')
    18 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- generic:
  - generic [ref=e1]:
    - banner:
      - generic [ref=e2]:
        - generic [ref=e3]: 本地测试加速模式
        - generic [ref=e4]: ⌨ 键盘演示 · 非真实动作识别
        - switch "无摄像头测试：关" [ref=e5] [cursor=pointer]
        - button "动作教学" [ref=e6] [cursor=pointer]
        - button "开启音效" [ref=e7] [cursor=pointer]
        - button "重新开始" [ref=e8] [cursor=pointer]
    - main [ref=e9]:
      - generic [ref=e10]:
        - generic:
          - generic:
            - generic: YOUR LITTLE WORLD
            - heading "一座农场，等待你的第一步" [level=1]
          - generic: 今日劳作 · 体验计划
        - generic [ref=e11]:
          - img "可旋转三维农场。地面0、车上0、到家0。" [ref=e12]:
            - generic "可旋转的三维农场，拖拽旋转、滚轮缩放" [ref=e13]
            - generic:
              - text: 用户人物/房屋 · 挥砍 / 装车 / 行走动作
              - link "原动作对照" [ref=e14] [cursor=pointer]:
                - /url: /?art=npr-sample&model=prototype
          - generic: 0%
      - complementary [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e17]: MISSION CONTROL
          - generic [ref=e18]: 未开始
        - heading "农场计划" [level=2] [ref=e19]
        - generic [ref=e20]:
          - generic [ref=e21]: 准备开始今天的劳作。
          - button "等待任务开始" [disabled] [ref=e22]
          - paragraph [ref=e23]: 按 Space 完成一次动作循环（禁用自动重复）
    - generic "三维视角控制" [ref=e24]:
      - button "向左旋转视角" [ref=e25] [cursor=pointer]: ↶
      - button "向右旋转视角" [ref=e26] [cursor=pointer]: ↷
      - button "城堡近景" [ref=e27] [cursor=pointer]
      - button "全景视角" [ref=e28] [cursor=pointer]
  - dialog [ref=e29]:
    - generic [ref=e30]:
      - generic [ref=e31]: 禾
      - generic [ref=e32]:
        - text: 禾禾 · 农场管家
        - generic [ref=e33]: A LITTLE EVERY DAY
      - generic [ref=e34]: 今日
    - heading "农场今日劳作" [level=2] [ref=e35]
    - paragraph [ref=e36]: 从林间到谷仓，让每一次运动都留下收获。
    - generic [ref=e37]:
      - generic [ref=e38]: "01"
      - generic [ref=e39]:
        - generic [ref=e40]: 砍伐杉树
        - generic [ref=e41]: 挥砍 5 次 × 3 棵 · 共 15 次
    - generic [ref=e42]:
      - generic [ref=e43]: "02"
      - generic [ref=e44]:
        - generic [ref=e45]: 收集木材
        - generic [ref=e46]: 深蹲推举 15 次 · 装车 15 份木材
    - generic [ref=e47]:
      - generic [ref=e48]: "03"
      - generic [ref=e49]:
        - generic [ref=e50]: 推车回家
        - generic [ref=e51]: 持续持姿 2 秒 · 返回农场
    - generic [ref=e52]: 今日为预设训练计划 · 概念演示，非 AI 自动规划。
    - button "先看动作教学" [ref=e53] [cursor=pointer]
    - generic [ref=e54]:
      - button "稍后再说" [ref=e55] [cursor=pointer]
      - button "接受今天的任务 →" [ref=e56] [cursor=pointer]
  - dialog [ref=e58]:
    - banner [ref=e59]:
      - generic [ref=e60]:
        - text: LEARN THE MOVEMENT
        - heading "动作教学" [level=2] [ref=e61]
      - button "关闭教学" [active] [ref=e62] [cursor=pointer]: ×
    - paragraph [ref=e63]: 先看示范，再按准备页完成标定。教学不计训练成果。
    - navigation "教学动作" [ref=e64]:
      - button "挥砍" [pressed] [ref=e65] [cursor=pointer]
      - button "装车" [ref=e66] [cursor=pointer]
      - button "拉车持姿" [ref=e67] [cursor=pointer]
    - paragraph [ref=e68]: 先上肩准备，再下挥，最后回到上肩。完整复位后才计一次。
    - generic [ref=e69]:
      - generic [ref=e70]:
        - generic [ref=e71]: 动作示意 · 不计训练成果
        - img "挥砍：站稳与入镜，人体动作示意 原创人体示意，展示本应用的动作阶段，不计训练成果。固定机位，自然站立，让全身和举手范围都在画面内。 金色双圈与较大的关节点表示本步关注：头部、左脚踝、右脚踝。" [ref=e72]:
          - generic [ref=e73]:
            - generic [ref=e75]: 人体动作示意
            - generic [ref=e76]: 不计训练成果
            - generic [ref=e110]:
              - generic "颈部" [ref=e111]
              - generic "左肩" [ref=e112]
              - generic "左肘" [ref=e113]
              - generic "左手腕" [ref=e114]
              - generic "右肩" [ref=e115]
              - generic "右肘" [ref=e116]
              - generic "右手腕" [ref=e117]
              - generic "左髋" [ref=e118]
              - generic "右髋" [ref=e119]
              - generic "左膝" [ref=e120]
              - generic "左脚踝" [ref=e121]
              - generic "右膝" [ref=e122]
              - generic "右脚踝" [ref=e123]
            - generic [ref=e126]: 金色双圈：本步关注的关节
        - generic [ref=e127]: 正面示意 · 主手以本人左右为准
      - generic [ref=e128]:
        - text: 第 1 / 4 步
        - heading "站稳与入镜" [level=3] [ref=e129]
        - paragraph [ref=e130]: 固定机位，自然站立，让全身和举手范围都在画面内。
        - list "分步示范" [ref=e131]:
          - listitem [ref=e132]:
            - button "站稳与入镜" [ref=e133] [cursor=pointer]
          - listitem [ref=e134]:
            - button "上肩准备" [ref=e135] [cursor=pointer]
          - listitem [ref=e136]:
            - button "缓慢下挥" [ref=e137] [cursor=pointer]
          - listitem [ref=e138]:
            - button "回到上肩" [ref=e139] [cursor=pointer]
        - generic [ref=e140]:
          - heading "动作要点" [level=4] [ref=e141]
          - list [ref=e142]:
            - listitem [ref=e143]: 确认头顶、双手与脚部没有被画面裁切。
            - listitem [ref=e144]: 先用空载缓慢熟悉示意；动作范围以自己的舒适标定为准。
    - generic "教学播放控制" [ref=e145]:
      - button "上一步" [disabled] [ref=e146]
      - button "播放示范" [ref=e147] [cursor=pointer]
      - button "下一步" [ref=e148] [cursor=pointer]
      - button "重播" [ref=e149] [cursor=pointer]
      - generic [ref=e150]:
        - text: 播放速度
        - combobox "播放速度" [ref=e151] [cursor=pointer]:
          - option "1× 正常" [selected]
          - option "0.5× 慢动作"
          - option "0.25× 慢动作"
    - progressbar "教学示范进度" [ref=e152]
    - paragraph [ref=e153]: 示范用于说明本应用的动作顺序，以个人标定范围为准；不需要真实斧头或木材，也不检测器械重量。
```

# Test source

```ts
  1   | import {test as base,expect,type Page} from '@playwright/test';
  2   | import {mkdir,writeFile} from 'node:fs/promises';
  3   | import {installPoseFixture,prepareCamera,setPose,completeSyntheticChop} from '../helpers/browserPoseFixture.js';
  4   | 
  5   | const test=base.extend<{automaticDemo:boolean}>({
  6   |  automaticDemo:[false,{option:true}],
  7   |  page:async({page,automaticDemo},use)=>{await page.addInitScript(enabled=>localStorage.setItem('tidal.demo.enabled',String(enabled)),automaticDemo);await use(page);},
  8   | });
  9   | const output='artifacts/qa/exercise-tutorial-20261026';
  10  | const dialog=(page:Page)=>page.getByRole('dialog',{name:'动作教学',exact:true});
  11  | const joints=(page:Page)=>page.locator('#tutorialFigure circle[data-joint]').evaluateAll(nodes=>nodes.map(node=>[node.getAttribute('data-joint'),node.getAttribute('cx'),node.getAttribute('cy')]));
  12  | async function progress(page:Page){return {chop:await page.locator('#chopValue').textContent(),load:await page.locator('#loadValue').textContent(),carry:await page.locator('#carryValue').textContent(),inventory:await page.locator('#worldCanvas').getAttribute('data-inventory'),phase:await page.locator('#app').getAttribute('data-phase'),countdown:await page.locator('#countdown').textContent()};}
  13  | 
  14  | test.use({channel:'chromium',baseURL:'http://127.0.0.1:4174',launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
  15  | test('the pre-training tutorial explains all three movements without starting a session or camera',async({page})=>{
  16  |  await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new Error('Tutorial must not request a camera');};});
  17  |  await page.goto('/?e2e=1&art=npr-sample');
  18  |  await expect(page.getByRole('button',{name:'先看动作教学',exact:true})).toBeVisible();
  19  |  await page.getByRole('button',{name:'先看动作教学',exact:true}).click();
  20  |  const dialog=page.getByRole('dialog',{name:'动作教学',exact:true});await expect(dialog).toBeVisible();
  21  |  await expect(page.locator('#app')).toHaveAttribute('data-phase','home');
  22  |  for(const [name,count] of [['挥砍',4],['装车',5],['拉车持姿',3]] as const){await dialog.getByRole('button',{name,exact:true}).click();await expect(dialog.locator('#tutorialStepList button')).toHaveCount(count);await expect(dialog.locator('#tutorialTips li')).not.toHaveCount(0);}
  23  |  await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#loadValue')).toHaveText('0/15');
  24  |  await dialog.getByRole('button',{name:'关闭教学',exact:true}).click();await expect(page.locator('#planModal')).toBeVisible();
  25  | });
  26  | 
  27  | test('the preparation page returns unchanged and teaching does not leave a hidden setup pause',async({page})=>{
  28  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#acceptPlan').click();await page.locator('#setupTutorial').click();
  29  |  await expect(dialog(page)).toBeVisible();await expect(page.locator('#app')).toHaveAttribute('data-phase','setup');
  30  |  await page.keyboard.press('Escape');await expect(dialog(page)).toBeHidden();await expect(page.locator('#setupModal')).toBeVisible();await expect(page.locator('#setupTutorial')).toBeFocused();
  31  |  await page.locator('#beginDemo').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  32  |  await page.locator('#pauseBtn').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  33  | });
  34  | 
  35  | test('step selection changes real joints; pause slow motion and replay control only the teaching clock',async({page})=>{
  36  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#planTutorial').click();const steps=page.locator('#tutorialStepList button');
  37  |  await steps.nth(1).click();const raised=await joints(page);await steps.nth(2).click();expect(await joints(page)).not.toEqual(raised);
  38  |  await expect(page.locator('#tutorialFigure circle[data-joint]')).toHaveCount(14);await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','false');
  39  |  const frozen=await joints(page),time=await page.locator('#tutorialModal').getAttribute('data-time-ms');await page.waitForTimeout(250);expect(await joints(page)).toEqual(frozen);await expect(page.locator('#tutorialModal')).toHaveAttribute('data-time-ms',time!);
  40  |  const interval=async(speed:string)=>{
  41  |   await steps.nth(1).click();await page.locator('#tutorialSpeed').selectOption(speed);await page.locator('#tutorialPlay').click();
  42  |   const start=Number(await page.locator('#tutorialModal').getAttribute('data-time-ms'));await page.waitForTimeout(340);await page.locator('#tutorialPlay').click();
  43  |   return Number(await page.locator('#tutorialModal').getAttribute('data-time-ms'))-start;
  44  |  };
  45  |  const normal=await interval('1'),slow=await interval('0.5');expect(normal).toBeGreaterThan(200);expect(slow).toBeGreaterThan(70);expect(slow).toBeLessThan(normal*.75);
  46  |  await page.locator('#tutorialSpeed').selectOption('0.25');await expect(page.locator('#tutorialModal')).toHaveAttribute('data-speed','0.25');
  47  |  await page.locator('#tutorialReplay').click();await expect(page.locator('#tutorialModal')).toHaveAttribute('data-step','0');await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','true');
  48  |  await expect(page.locator('#chopValue')).toHaveText('0/15');await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/0');
  49  |  await mkdir(output,{recursive:true});await writeFile(`${output}/clock-observation.json`,JSON.stringify({normalMs:normal,halfSpeedMs:slow,input:'Independent tutorial clock; training never started'},null,2));
  50  | });
  51  | 
  52  | test('reopening under reduced motion initializes the selected step and traps focus on a narrow screen',async({page})=>{
  53  |  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});await page.goto('/?e2e=1&art=npr-sample');
  54  |  for(let i=0;i<2;i++){
> 55  |   await page.locator('#planTutorial').click();await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','false');await expect(page.locator('#tutorialStepList button[aria-current="step"]')).toHaveCount(1);
      |                                                                                                                                                                                                                ^ Error: expect(locator).toHaveCount(expected) failed
  56  |   await page.locator('#tutorialClose').focus();await page.keyboard.press('Shift+Tab');await expect(page.locator('#tutorialSpeed')).toBeFocused();await page.keyboard.press('Tab');await expect(page.locator('#tutorialClose')).toBeFocused();
  57  |   await page.keyboard.press('Escape');await expect(page.locator('#planTutorial')).toBeFocused();
  58  |  }
  59  |  await page.locator('#planTutorial').click();await page.locator('#tutorialTabs button[data-task="load"]').click();await page.locator('#tutorialStepList button').nth(1).click();
  60  |  await page.locator('#tutorialSpeed').scrollIntoViewIfNeeded();await expect(page.locator('#tutorialSpeed')).toBeVisible();
  61  |  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  62  |  expect(await page.locator('#tutorialFigure').evaluate(element=>element.getBoundingClientRect().width)).toBeGreaterThan(250);
  63  |  await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/tutorial-mobile.png`,fullPage:true});
  64  | });
  65  | 
  66  | test('playing a selected final step begins that step instead of replaying the entire lesson',async({page})=>{
  67  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#planTutorial').click();await page.locator('#tutorialTabs button[data-task="carry"]').click();
  68  |  await page.locator('#tutorialStepList button').last().click();await expect(page.locator('#tutorialModal')).toHaveAttribute('data-step','2');await page.locator('#tutorialPlay').click();
  69  |  await expect(page.locator('#tutorialModal')).toHaveAttribute('data-step','2');await expect(page.locator('#tutorialModal')).toHaveAttribute('data-playing','true');
  70  |  expect(Number(await page.locator('#tutorialModal').getAttribute('data-time-ms'))).toBeGreaterThanOrEqual(4000);
  71  | });
  72  | 
  73  | test('a short background interval with no hidden animation frame never fills tutorial playback',async({page})=>{
  74  |  await page.goto('/?e2e=1&art=npr-sample');await page.locator('#planTutorial').click();
  75  |  const elapsed=await page.evaluate(async()=>{
  76  |   const tutorial=document.getElementById('tutorialModal')!,descriptor=Object.getOwnPropertyDescriptor(document,'hidden');
  77  |   const before=Number(tutorial.dataset.timeMs);
  78  |   Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));
  79  |   // No rAF can run while this brief observed background interval is blocked.
  80  |   const end=performance.now()+100;while(performance.now()<end){/* deterministic scheduling fixture */}
  81  |   Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));
  82  |   await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
  83  |   const after=Number(tutorial.dataset.timeMs);
  84  |   if(descriptor)Object.defineProperty(document,'hidden',descriptor);else Reflect.deleteProperty(document,'hidden');
  85  |   return after-before;
  86  |  });
  87  |  expect(elapsed).toBeLessThan(40);
  88  | });
  89  | 
  90  | test.describe('automatic training',()=>{
  91  |  test.use({automaticDemo:true});
  92  |  test('opening before delayed assets suppresses behind-dialog autoplay without changing the preference',async({page})=>{
  93  |   let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
  94  |   await page.route('**/assets/user-models/castle.fbx',async route=>{await gate;await route.continue();});
  95  |   await page.goto('/?e2e=1&art=npr-sample',{waitUntil:'domcontentloaded'});
  96  |   try{await page.locator('#tutorialOpen').click();await expect(dialog(page)).toBeVisible();await page.locator('#tutorialClose').click();}finally{release();}
  97  |   await expect(page.locator('#worldCanvas')).toHaveAttribute('data-assets','ready');await page.waitForTimeout(350);
  98  |   await expect(page.locator('#app')).toHaveAttribute('data-phase','home');await expect(page.locator('#chopValue')).toHaveText('0/15');expect(await page.evaluate(()=>localStorage.getItem('tidal.demo.enabled'))).toBe('true');
  99  |  });
  100 |  test('replay pauses automatic training and Space P Escape cannot continue or reset it',async({page})=>{
  101 |   await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#statusTag')).toHaveText('训练中');await page.locator('#tutorialOpen').click();
  102 |   await expect(dialog(page)).toBeVisible();await expect(page.locator('#statusTag')).toHaveText('已暂停');const before=await progress(page);
  103 |   await page.locator('#tutorialReplay').focus();await page.keyboard.press('Space');await page.keyboard.press('KeyP');await page.waitForTimeout(400);expect(await progress(page)).toEqual(before);
  104 |   await page.keyboard.press('Escape');await expect(dialog(page)).toBeHidden();await expect(page.locator('#exitModal')).toBeHidden();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  105 |   await page.waitForTimeout(300);expect(await progress(page)).toEqual(before);await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});await expect(page.locator('#rewardLogs')).toHaveText('15');
  106 |  });
  107 |  test('opening during carry freezes effective hold time and does not fill the teaching interval on resume',async({page})=>{
  108 |   await page.goto('/?e2e=1&art=npr-sample');await expect(page.locator('#missionTitle')).toHaveText('推车返回农场',{timeout:25000});await expect(page.locator('#statusTag')).toHaveText('训练中');
  109 |   await expect.poll(async()=>parseFloat((await page.locator('#carryValue').textContent())??'0')).toBeGreaterThan(.1);await page.locator('#tutorialOpen').click();
  110 |   await expect(page.locator('#statusTag')).toHaveText('已暂停');const before=await progress(page);await page.waitForTimeout(700);expect(await progress(page)).toEqual(before);
  111 |   await page.locator('#tutorialClose').click();await page.waitForTimeout(250);expect(await progress(page)).toEqual(before);await page.locator('#pauseBtn').click();
  112 |   await expect(page.locator('#resultsModal')).toBeVisible({timeout:10000});await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
  113 |  });
  114 | });
  115 | 
  116 | test.describe('camera integration with synthetic test frames',()=>{
  117 |  test.setTimeout(90000);
  118 |  async function startCamera(page:Page){
  119 |   await installPoseFixture(page);await page.goto('/?e2e=1&art=npr-sample');await prepareCamera(page);await page.locator('#beginCamera').click();await expect(page.locator('#statusTag')).toHaveText('训练中');
  120 |  }
  121 |  test('replay keeps the same video tracks and worker and a partial chop cannot become a completed rep',async({page})=>{
  122 |   await startCamera(page);await setPose(page,'raised',0);await expect(page.locator('#inputDebug')).toContainText(' · ready ·');await setPose(page,'down',0);await expect(page.locator('#inputDebug')).toContainText(' · chop-down ·');
  123 |   const resources=await page.evaluate(()=>({ids:window.poseFixture.tracks.map(track=>track.id),workers:window.poseFixture.workers,max:window.poseFixture.maxWorkers}));
  124 |   await page.locator('#tutorialOpen').click();await expect(dialog(page)).toBeVisible();await expect(page.locator('#statusTag')).toHaveText('已暂停');
  125 |   await page.locator('#tutorialTabs button[data-task="carry"]').click();await page.waitForTimeout(400);await expect(page.locator('#chopValue')).toHaveText('0/15');
  126 |   expect(await page.evaluate(()=>({ids:window.poseFixture.tracks.map(track=>track.id),workers:window.poseFixture.workers,max:window.poseFixture.maxWorkers}))).toEqual(resources);
  127 |   expect(await page.evaluate(()=>window.poseFixture.tracks.every(track=>track.readyState==='live'))).toBe(true);
  128 |   await page.locator('#tutorialClose').click();await expect(page.locator('#statusTag')).toHaveText('已暂停');await page.locator('#pauseBtn').click();
  129 |   await setPose(page,'down',500);await expect(page.locator('#chopValue')).toHaveText('0/15');await completeSyntheticChop(page,1);await expect(page.locator('#chopValue')).toHaveText('1/15');
  130 |  });
  131 |  test('tracking loss while replaying still requires preparation after teaching closes',async({page})=>{
  132 |   await startCamera(page);await page.locator('#tutorialOpen').click();await page.evaluate(()=>{window.poseFixture.low=true;});
  133 |   await expect(page.locator('#beginCamera')).toBeDisabled({timeout:10000});await expect(dialog(page)).toBeVisible();
  134 |   await page.locator('#tutorialClose').click();await expect(page.locator('#setupModal')).toBeVisible();await expect(page.locator('#setupTutorial')).toBeFocused();
  135 |   await expect(page.locator('#demoToggle')).toHaveAttribute('aria-checked','false');await expect(page.locator('#beginCamera')).toBeDisabled();await expect(page.locator('#chopValue')).toHaveText('0/15');
  136 |   await mkdir(output,{recursive:true});await writeFile(`${output}/synthetic-camera-boundary.json`,JSON.stringify({input:'Fake video and authored pose landmarks; not physical camera',workers:await page.evaluate(()=>window.poseFixture.maxWorkers),result:'Preparation remains required; no simulated fallback'},null,2));
  137 |  });
  138 | });
  139 | 
```