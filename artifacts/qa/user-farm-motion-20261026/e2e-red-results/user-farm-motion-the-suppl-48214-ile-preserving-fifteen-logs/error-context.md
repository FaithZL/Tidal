# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-farm-motion.spec.ts >> the supplied farm character chops and takes real steps through walk push pull while preserving fifteen logs
- Location: tests/e2e/user-farm-motion.spec.ts:31:1

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0.04
Received:   0

Call Log:
- Timeout 20000ms exceeded while waiting on the predicate
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
              - text: 用户人物/房屋 · 装车局部动作，其余静态
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
      - generic [ref=e94]: 挥砍 15 次 · 装车 15 次 · 有效持姿 1.3 秒 · 任务有效时间 4.3 秒 · 本局经过时间（含休息/暂停）5.3 秒 · 输入：含自动模拟（复用键盘模拟协议）
      - generic [ref=e95]: 心率和卡路里：未接入测量设备，无法提供真实数据。66 天连续打卡与 500 卡等数据仅为原方案示意。
    - button "返回农场首页" [ref=e96] [cursor=pointer]
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test';
  2  | import {mkdir,writeFile} from 'node:fs/promises';
  3  | 
  4  | const output='artifacts/qa/user-farm-motion-20261026',origin='http://127.0.0.1:4174';
  5  | interface MotionSample{mode:string;action:string;task:string;hand:number[];feet:number[];blade:number[];revision:string;inventory:string}
  6  | interface FarmMotionQA{samples:MotionSample[];cameraCalls:number;paused:boolean}
  7  | declare global{interface Window{farmMotionQA:FarmMotionQA}}
  8  | test.use({baseURL:origin,channel:'chromium'});
  9  | async function observe(page:Page,pause=false){
  10 |  const errors:string[]=[],external:string[]=[];
  11 |  page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{const address=new URL(request.url());if(address.protocol!=='data:'&&address.origin!==origin)external.push(address.href);});
  12 |  await page.addInitScript(({pause})=>{
  13 |   const qa:FarmMotionQA={samples:[],cameraCalls:0,paused:false};window.farmMotionQA=qa;
  14 |   navigator.mediaDevices.getUserMedia=async()=>{qa.cameraCalls++;throw new Error('Farm animation preview must not request a camera');};
  15 |   let observed:HTMLElement|null=null,last='';
  16 |   const collect=()=>{
  17 |    const world=document.getElementById('worldCanvas');if(!world)return;
  18 |    const numbers=(text:string|undefined)=>text?text.split(',').map(Number):[];
  19 |    const sample:MotionSample={mode:world.dataset.playerMode??'',action:world.dataset.action??'',task:document.getElementById('missionTitle')?.textContent??'',hand:numbers(world.dataset.hand),feet:numbers(world.dataset.footPose),blade:numbers(world.dataset.blade),revision:world.dataset.motionRevision??'',inventory:world.dataset.inventory??''};
  20 |    const key=JSON.stringify(sample);if(key!==last){qa.samples.push(sample);last=key;}
  21 |    if(pause&&!qa.paused&&sample.task.includes('砍')&&sample.action==='chop-down'&&document.getElementById('statusTag')?.textContent==='训练中'&&qa.samples.some(before=>before.task.includes('砍')&&before.hand.length===3&&sample.hand.length===3&&Math.abs(before.hand[1]-sample.hand[1])>.04)){
  22 |     const button=document.getElementById('pauseBtn');if(button instanceof HTMLButtonElement&&!button.disabled){qa.paused=true;button.click();}
  23 |    }
  24 |   };
  25 |   const frame=()=>{const world=document.getElementById('worldCanvas');if(world&&world!==observed){observed=world;new MutationObserver(collect).observe(world,{attributes:true,attributeFilter:['data-hand','data-foot-pose','data-blade','data-player-mode','data-action']});}collect();requestAnimationFrame(frame);};requestAnimationFrame(frame);
  26 |  },{pause});
  27 |  return {errors,external};
  28 | }
  29 | const range=(samples:MotionSample[],channel:'hand'|'feet'|'blade',index:number)=>{const values=samples.map(s=>s[channel][index]).filter(Number.isFinite);return values.length?Math.max(...values)-Math.min(...values):0;};
  30 | 
  31 | test('the supplied farm character chops and takes real steps through walk push pull while preserving fifteen logs',async({page})=>{
  32 |  const evidence=await observe(page);await page.goto('/?e2e=1&art=npr-sample');
> 33 |  await expect.poll(()=>page.evaluate(()=>{const heights=window.farmMotionQA.samples.filter(s=>s.task.includes('砍')).map(s=>s.hand[1]).filter(Number.isFinite);return heights.length?Math.max(...heights)-Math.min(...heights):0;}),{timeout:20000}).toBeGreaterThan(.04);
     |                                                                                                                                                                                                                                                     ^ Error: expect(received).toBeGreaterThan(expected)
  34 |  await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});
  35 |  const qa=await page.evaluate(()=>window.farmMotionQA),chop=qa.samples.filter(s=>s.task.includes('砍'));
  36 |  expect(range(chop,'blade',1)).toBeGreaterThan(.1);
  37 |  for(const mode of ['walk','push','pull']){
  38 |   const steps=qa.samples.filter(s=>s.mode===mode&&s.feet.length===6);expect(steps.length,mode).toBeGreaterThan(1);
  39 |   expect(Math.max(range(steps,'feet',1),range(steps,'feet',2),range(steps,'feet',4),range(steps,'feet',5)),mode).toBeGreaterThan(.025);
  40 |  }
  41 |  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-character','user-fbx-farm-motion');
  42 |  await expect(page.locator('#chopValue')).toHaveText('15/15');await expect(page.locator('#loadValue')).toHaveText('15/15');
  43 |  await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/15');
  44 |  expect(qa.cameraCalls).toBe(0);expect(evidence).toEqual({errors:[],external:[]});
  45 |  await mkdir(output,{recursive:true});await writeFile(`${output}/farm-motion.json`,JSON.stringify({input:'Existing automatic demo; no camera',...qa,...evidence},null,2));
  46 |  await page.screenshot({path:`${output}/farm-results.png`,fullPage:true});
  47 | });
  48 | 
  49 | test('pausing a real downstroke freezes blade feet and progress and reset clears the half action',async({page})=>{
  50 |  const evidence=await observe(page,true);await page.goto('/?e2e=1&art=npr-sample');
  51 |  await expect.poll(()=>page.evaluate(()=>window.farmMotionQA.paused),{timeout:20000}).toBe(true);
  52 |  await expect(page.locator('#statusTag')).toHaveText('已暂停');
  53 |  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  54 |  const world=page.locator('#worldCanvas'),attributes=['data-hand','data-blade','data-foot-pose','data-motion-revision','data-inventory'];
  55 |  const before=await Promise.all(attributes.map(name=>world.getAttribute(name))),count=await page.locator('#chopValue').textContent();
  56 |  expect(before.every(value=>value!==null)).toBe(true);await page.waitForTimeout(350);
  57 |  expect(await Promise.all(attributes.map(name=>world.getAttribute(name)))).toEqual(before);await expect(page.locator('#chopValue')).toHaveText(count!);
  58 |  await page.locator('#pauseBtn').click();await expect(page.locator('#resultsModal')).toBeVisible({timeout:25000});await expect(world).toHaveAttribute('data-inventory','0/0/15');
  59 |  await page.locator('#resultsHome').click();await expect(page.locator('#planModal')).toBeVisible();await expect(world).toHaveAttribute('data-inventory','0/0/0');
  60 |  expect((await page.evaluate(()=>window.farmMotionQA)).cameraCalls).toBe(0);expect(evidence).toEqual({errors:[],external:[]});
  61 |  await mkdir(output,{recursive:true});await writeFile(`${output}/farm-pause-reset.json`,JSON.stringify({before,count,...evidence},null,2));
  62 | });
  63 | 
```