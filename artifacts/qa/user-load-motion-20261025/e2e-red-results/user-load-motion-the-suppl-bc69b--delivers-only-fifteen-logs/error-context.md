# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-load-motion.spec.ts >> the supplied NPR character moves its real hand through load phases and delivers only fifteen logs
- Location: tests/e2e/user-load-motion.spec.ts:72:1

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0.04
Received:   0

Call Log:
- Timeout 25000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [active]:
  - generic [ref=e1]:
    - banner:
      - generic:
        - generic:
          - text: T
          - generic: ✦
        - generic:
          - generic: TIDAL FARM
          - generic: 每一次运动，都让世界生长
      - generic [ref=e2]:
        - generic [ref=e3]: 本地测试加速模式
        - generic [ref=e4]: ▶ 自动模拟 · 非真实动作识别
        - switch "无摄像头测试：开" [checked] [ref=e5] [cursor=pointer]
        - button "开启音效" [ref=e6] [cursor=pointer]
        - button "重新开始" [ref=e7] [cursor=pointer]
    - main [ref=e8]:
      - generic [ref=e9]:
        - generic:
          - generic:
            - generic: YOUR LITTLE WORLD
            - heading "今天的收获已装满手推车" [level=1]
          - generic: 今日收获 · 已完成
        - generic [ref=e10]:
          - img "可旋转三维农场。地面0、车上0、到家15。" [ref=e11]:
            - generic "可旋转的三维农场，拖拽旋转、滚轮缩放" [ref=e12]
            - generic:
              - text: 用户人物/房屋 · 人物为无骨骼静态姿态
              - link "原动作对照" [ref=e13] [cursor=pointer]:
                - /url: /?art=npr-sample&model=prototype
          - generic:
            - generic: 从一件小事开始，让这座农场苏醒。
            - generic: 100%
        - generic "训练任务阶段":
          - generic:
            - generic: 🪓
            - generic:
              - text: 砍伐杉树
              - generic: 壶铃挥砍
          - generic:
            - generic: 🪵
            - generic:
              - text: 木材装车
              - generic: 深蹲推举
          - generic:
            - generic: 🛒
            - generic:
              - text: 运输木材
              - generic: 持续持姿
      - complementary [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: MISSION CONTROL
          - generic [ref=e17]: 已完成
        - heading "劳作完成！" [level=2] [ref=e18]
        - paragraph [ref=e19]: 所有奖励均已结算。你可以返回首页重置并再次体验。
        - generic [ref=e20]:
          - generic [ref=e21]:
            - generic [ref=e22]: 🪓 已完成挥砍
            - strong [ref=e23]: 15/15
          - generic [ref=e24]:
            - generic [ref=e25]: 🪵 已装车木材
            - strong [ref=e26]: 15/15
          - generic [ref=e27]:
            - generic [ref=e28]: ⏱ 有效拉车
            - strong [ref=e29]: 1.3/2s
          - generic [ref=e30]:
            - generic [ref=e31]: 🌲 砍倒树木
            - strong [ref=e32]: 3/3
        - generic [ref=e33]:
          - generic [ref=e34]: ✧
          - generic [ref=e35]:
            - text: 将运动变成资产
            - generic [ref=e36]: 收集资源 · 升级农场 · 获得正反馈
        - generic [ref=e37]:
          - generic [ref=e38]: 自动演示中，可随时暂停或关闭无摄像头测试。
          - button "自动模拟已开启" [disabled] [ref=e39]
          - paragraph [ref=e40]: 关闭测试后点继续，即可使用键盘
        - group [ref=e41]:
          - generic "输入诊断" [ref=e42] [cursor=pointer]
    - generic "三维视角控制" [ref=e43]:
      - generic [ref=e44]: 拖拽旋转 · 滚轮缩放
      - button "向左旋转视角" [ref=e45] [cursor=pointer]: ↶
      - button "向右旋转视角" [ref=e46] [cursor=pointer]: ↷
      - button "城堡近景" [ref=e47] [cursor=pointer]
      - button "全景视角" [ref=e48] [cursor=pointer]
    - contentinfo:
      - status: 会话 session-1 · 已完成
  - dialog [ref=e50]:
    - generic [ref=e51]: ✦
    - generic [ref=e52]: THE HARVEST IS HERE
    - heading "恭喜！今天的农场劳作完成" [level=2] [ref=e53]
    - paragraph [ref=e54]: 你的每一次付出，都留下了实实在在的痕迹。
    - generic [ref=e55]:
      - generic [ref=e56]:
        - generic [ref=e57]: YOUR MOVEMENT
        - heading "运动成果" [level=3] [ref=e58]
        - generic [ref=e59]:
          - generic [ref=e60]:
            - generic [ref=e61]: 完整挥砍 / 次
            - strong [ref=e62]: "15"
          - generic [ref=e63]:
            - generic [ref=e64]: 复合装车 / 次
            - strong [ref=e65]: "15"
          - generic [ref=e66]:
            - generic [ref=e67]: 有效持姿 / 秒
            - strong [ref=e68]: "1.3"
          - generic [ref=e69]:
            - generic [ref=e70]: 任务有效时间
            - strong [ref=e71]: 00:04
          - generic [ref=e72]:
            - generic [ref=e73]: 本局经过时间 · 含休息与暂停
            - strong [ref=e74]: 00:05
      - generic [ref=e75]:
        - generic [ref=e76]: YOUR HARVEST
        - heading "农场收获" [level=3] [ref=e77]
        - generic [ref=e78]:
          - generic [ref=e79]:
            - generic [ref=e80]: 🪵 木材到家
            - strong [ref=e81]: "15"
          - generic [ref=e82]:
            - generic [ref=e83]: 🪙 游戏金币
            - strong [ref=e84]: "100"
          - generic [ref=e85]:
            - generic [ref=e86]: ⚡ 游戏体力
            - strong [ref=e87]: "100"
        - generic [ref=e88]:
          - img "农场叶芽徽章 T 恤" [ref=e89]
          - generic [ref=e90]:
            - text: 盲盒奖励：
            - generic [ref=e91]: 限定 T 恤
        - paragraph [ref=e92]: 木材已送达农舍。每一份收获，都来自本局完整提交的动作。
    - generic [ref=e93]:
      - text: 本次运行记录（输入来源见下方，不是生理测量）
      - generic [ref=e94]: 挥砍 15 次 · 装车 15 次 · 有效持姿 1.3 秒 · 任务有效时间 4.2 秒 · 本局经过时间（含休息/暂停）5.3 秒 · 输入：含自动模拟（复用键盘模拟协议）
      - generic [ref=e95]: 心率和卡路里：未接入测量设备，无法提供真实数据。66 天连续打卡与 500 卡等数据仅为原方案示意。
    - button "返回农场首页" [ref=e96] [cursor=pointer]
```

# Test source

```ts
  1   | import {test,expect,type Page} from '@playwright/test';
  2   | import {mkdir,writeFile} from 'node:fs/promises';
  3   | 
  4   | const origin='http://127.0.0.1:4174';
  5   | const output='artifacts/qa/user-load-motion-20261025';
  6   | const url='/?e2e=1&art=npr-sample';
  7   | const loadPhases=['ready','squat-down','stand-up','press-up','load-return'];
  8   | interface LoadMotionSample{
  9   |  action:string;hand:[number,number,number];revision:string;inventory:string;load:string;at:number;
  10  | }
  11  | interface LoadMotionQA{samples:LoadMotionSample[];pauseTriggered:boolean;cameraCalls:number}
  12  | declare global{interface Window{userLoadMotionQA:LoadMotionQA}}
  13  | 
  14  | test.use({baseURL:origin,channel:'chromium'});
  15  | test.setTimeout(60000);
  16  | 
  17  | /** Observe published real-world hand anchors; only the existing UI can pause the demo. */
  18  | async function observeLoadMotion(page:Page,pauseOnMotion=false):Promise<void>{
  19  |  await page.addInitScript(({pauseOnMotion})=>{
  20  |   const state:LoadMotionQA={samples:[],pauseTriggered:false,cameraCalls:0};
  21  |   window.userLoadMotionQA=state;
  22  |   navigator.mediaDevices.getUserMedia=async()=>{state.cameraCalls++;throw new Error('Automatic load sample must not request a camera');};
  23  |   let observed:HTMLElement|null=null,last='';
  24  |   const sample=(fromMutation:boolean)=>{
  25  |    const world=document.getElementById('worldCanvas');
  26  |    if(!world||document.getElementById('app')?.dataset.phase!=='active'||
  27  |     !document.getElementById('missionTitle')?.textContent?.includes('装')||world.dataset.playerMode!=='work')return;
  28  |    const parts=world.dataset.hand?.split(',').map(Number);
  29  |    if(!parts||parts.length!==3||!parts.every(Number.isFinite))return;
  30  |    const action=world.dataset.action??'';
  31  |    if(!['ready','squat-down','stand-up','press-up','load-return'].includes(action))return;
  32  |    const entry:LoadMotionSample={action,hand:[parts[0],parts[1],parts[2]],revision:world.dataset.motionRevision??'',
  33  |     inventory:world.dataset.inventory??'',load:document.getElementById('loadValue')?.textContent??'',at:performance.now()};
  34  |    const key=JSON.stringify([entry.action,entry.hand,entry.revision,entry.inventory,entry.load]);
  35  |    if(key!==last){last=key;state.samples.push(entry);}
  36  |    if(fromMutation&&pauseOnMotion&&!state.pauseTriggered&&entry.load==='0/15'&&action!=='ready'&&
  37  |     document.getElementById('statusTag')?.textContent==='训练中'&&
  38  |     state.samples.some(before=>Math.abs(before.hand[1]-entry.hand[1])>.04)){
  39  |     const pause=document.getElementById('pauseBtn');
  40  |     if(pause instanceof HTMLButtonElement&&!pause.disabled){state.pauseTriggered=true;pause.click();}
  41  |    }
  42  |   };
  43  |   const frame=()=>{
  44  |    const world=document.getElementById('worldCanvas');
  45  |    if(world&&observed!==world){
  46  |     observed=world;
  47  |     new MutationObserver(()=>sample(true)).observe(world,{attributes:true,
  48  |      attributeFilter:['data-action','data-hand','data-motion-revision','data-inventory','data-player-mode']});
  49  |    }
  50  |    sample(false);requestAnimationFrame(frame);
  51  |   };
  52  |   requestAnimationFrame(frame);
  53  |  },{pauseOnMotion});
  54  | }
  55  | 
  56  | function observeErrors(page:Page){
  57  |  const errors:string[]=[],external:string[]=[],poseRequests:string[]=[];
  58  |  page.on('pageerror',error=>errors.push(error.message));
  59  |  page.on('request',request=>{
  60  |   const address=request.url(),parsed=new URL(address);
  61  |   if(parsed.protocol!=='data:'&&parsed.origin!==origin)external.push(address);
  62  |   if(/pose_landmarker|\/worker\/|\/mediapipe\//.test(address))poseRequests.push(address);
  63  |  });
  64  |  return {errors,external,poseRequests};
  65  | }
  66  | 
  67  | function handHeightRange(samples:LoadMotionSample[]):number{
  68  |  const heights=samples.map(sample=>sample.hand[1]);
  69  |  return heights.length?Math.max(...heights)-Math.min(...heights):0;
  70  | }
  71  | 
  72  | test('the supplied NPR character moves its real hand through load phases and delivers only fifteen logs',async({page})=>{
  73  |  const evidence=observeErrors(page);await observeLoadMotion(page);await page.goto(url);
  74  |  // Fast demo phases are shorter than a rendered frame; require observable travel,
  75  |  // not the full normal-speed lift. RED must identify the static hand first.
  76  |  await expect.poll(()=>page.evaluate(()=>{
  77  |   const heights=window.userLoadMotionQA.samples.map(sample=>sample.hand[1]);
  78  |   return heights.length?Math.max(...heights)-Math.min(...heights):0;
> 79  |  }),{timeout:25000}).toBeGreaterThan(.04);
      |                      ^ Error: expect(received).toBeGreaterThan(expected)
  80  |  const world=page.locator('#worldCanvas');
  81  |  await expect(world).toHaveAttribute('data-character','user-fbx-load-motion');
  82  |  await expect(page.locator('.npr-sample-label')).toContainText('装车局部动作');
  83  |  await expect(page.locator('.npr-sample-label')).toContainText('其余静态');
  84  |  await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});
  85  |  const samples=await page.evaluate(()=>window.userLoadMotionQA.samples);
  86  |  expect(handHeightRange(samples)).toBeGreaterThan(.04);
  87  |  expect([...new Set(samples.map(sample=>sample.action))].sort()).toEqual([...loadPhases].sort());
  88  |  expect(new Set(samples.map(sample=>sample.revision)).size).toBeGreaterThan(1);
  89  |  for(const sample of samples){
  90  |   const inventory=sample.inventory.split('/').map(Number);
  91  |   expect(inventory).toHaveLength(3);expect(inventory.every(Number.isFinite)).toBe(true);
  92  |   expect(inventory.reduce((total,value)=>total+value,0)).toBe(15);
  93  |  }
  94  |  await expect(page.locator('#loadValue')).toHaveText('15/15');
  95  |  await expect(page.locator('#rewardLogs')).toHaveText('15');
  96  |  await expect(world).toHaveAttribute('data-inventory','0/0/15');
  97  |  await expect(page.locator('#actualMetrics')).toContainText('自动模拟');
  98  |  expect(await page.evaluate(()=>window.userLoadMotionQA.cameraCalls)).toBe(0);
  99  |  expect(evidence).toEqual({errors:[],external:[],poseRequests:[]});
  100 |  await mkdir(output,{recursive:true});
  101 |  await page.screenshot({path:`${output}/load-results.png`,fullPage:true});
  102 |  await writeFile(`${output}/load-motion.json`,JSON.stringify({input:'Existing automatic demo; no camera',samples,...evidence},null,2));
  103 | });
  104 | 
  105 | test('pausing the first moving load freezes the hand and count; resume and reset preserve inventory',async({page})=>{
  106 |  const evidence=observeErrors(page);await observeLoadMotion(page,true);await page.goto(url);
  107 |  await expect.poll(()=>page.evaluate(()=>window.userLoadMotionQA.pauseTriggered),{timeout:25000}).toBe(true);
  108 |  await expect(page.locator('#statusTag')).toHaveText('已暂停');
  109 |  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  110 |  const world=page.locator('#worldCanvas');
  111 |  const paused={hand:await world.getAttribute('data-hand'),revision:await world.getAttribute('data-motion-revision'),
  112 |   load:await page.locator('#loadValue').textContent(),inventory:await world.getAttribute('data-inventory')};
  113 |  expect(paused.hand).not.toBeNull();expect(paused.revision).not.toBeNull();expect(paused.load).toBe('0/15');
  114 |  expect(paused.inventory).toBe('15/0/0');
  115 |  await page.waitForTimeout(400);
  116 |  await expect(world).toHaveAttribute('data-hand',paused.hand!);
  117 |  await expect(world).toHaveAttribute('data-motion-revision',paused.revision!);
  118 |  await expect(page.locator('#loadValue')).toHaveText(paused.load!);
  119 |  await expect(world).toHaveAttribute('data-inventory',paused.inventory!);
  120 |  await mkdir(output,{recursive:true});
  121 |  await page.screenshot({path:`${output}/load-paused.png`,fullPage:true});
  122 |  await page.locator('#pauseBtn').click();
  123 |  await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});
  124 |  await expect(page.locator('#loadValue')).toHaveText('15/15');
  125 |  await expect(page.locator('#rewardLogs')).toHaveText('15');
  126 |  await expect(world).toHaveAttribute('data-inventory','0/0/15');
  127 |  await page.locator('#resultsHome').click();
  128 |  await expect(page.locator('#planModal')).toBeVisible();
  129 |  await expect(page.locator('#loadValue')).toHaveText('0/15');
  130 |  await expect(world).toHaveAttribute('data-inventory','0/0/0');
  131 |  await page.waitForTimeout(400);
  132 |  await expect(page.locator('#loadValue')).toHaveText('0/15');
  133 |  await expect(world).toHaveAttribute('data-inventory','0/0/0');
  134 |  expect(await page.evaluate(()=>window.userLoadMotionQA.cameraCalls)).toBe(0);
  135 |  expect(evidence).toEqual({errors:[],external:[],poseRequests:[]});
  136 |  await writeFile(`${output}/pause-resume-reset.json`,JSON.stringify({input:'Existing automatic demo and pause/reset UI',paused,
  137 |   samples:await page.evaluate(()=>window.userLoadMotionQA.samples),...evidence},null,2));
  138 | });
  139 | 
```