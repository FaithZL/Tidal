# True 3D Farm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native execution or superpowers:subagent-driven-development if selected. Execute one verified task at a time; steps use checkboxes.

**Goal:** 在现有Tidal中交付可旋转真3D农场、紧凑通知/摄像头PiP和可信的木材劳作表现。

**Architecture:** 领域与输入模块保持权威，Three.js仅订阅快照和效果。复用ActionAnimator的阶段/暂停/去重语义，由独立3D表现数据与网格层解释世界位置和木材归属；DOM承担可读界面。

**Tech Stack:** TypeScript strict、Vite、本地MediaPipe0.10.32；Three.js与类型包在接入时精确锁定，npm锁文件。无新增服务。

**Spec:** [用户已确认的设计](3D_FARM_DESIGN.md)，2026-10-21回复“按这份3D设计继续”。

## Global Constraints

- 不重写SessionController、ExerciseSignal、原识别器与来源隔离；保留全部有效负例。
- 三棵树各5段、初始木材0、每棵5次挥砍、总装车15；60秒有效Carry与40世界单位路线分开。
- 摄像头视频、track和Worker只有一套；自动模拟仍可开关且始终标识来源。
- 计划通知宽约368px，不全屏遮挡农场；PiP宽约280px；运动成果与游戏收获等宽。
- 真实WebGL 3D、Orbit旋转/缩放/重置；上下文异常须显式报错，释放所有图形资源和监听。
- 只做本地原创模型/材质，不使用付费/外发服务；真机与人工美术验收继续manual_pending。
- 使用开发分支，逐任务验证后提交；最终回归后push，不合并main、不部署公网。

## Review Focus

1. 一局切源/暂停/重置发生在飞木中途：旧半次木材不能残留或重复显示（任务2）。
2. Orbit拖拽与HUD/对话框交互：不能误触动作键或改变领域进度（任务3、5）。
3. PiP布局切换不能重开摄像头、停止原视频或复制Worker（任务4、5）。
4. 最后一次装车紧接休息：已提交飞木应连续到车内，绑绳不能提前或重复造木（任务2、3）。
5. Resize/WebGL异常与页面释放：不能继续隐形运行或累计GPU资源（任务3、6）。

## Task 1: 数量与库存配置

**Files:** `src/config/demoConfig.ts`；`tests/unit/{config.test.mjs,session.test.mjs}`；`tests/helpers/sessionHarness.ts`，其他明确单木段夹具。

**Interfaces:** `createDemoConfig(overrides): Readonly<DemoConfig>`签名保持；默认`initialLogs=0,logsPerTree=5`，派生`chopRepTarget=15,loadRepTarget=15`。

- [x] RED：默认0/5、4棵总装20，第5/10/15次砍树库存5/10/15，第16次不增；实际运行并保存失败输出。
- [x] GREEN：只修改配置默认值，原守恒公式与控制器不变；单木段时序夹具显式设`logsPerTree:1`，重置默认库存断言改0。
- [x] 运行`npm run test:unit`与typecheck；原去重/奖励/无效时序负例全部保留，提交本任务。

## Task 2: 可测试3D动作编排

**Files:** 新增`src/game/world/{types,choreography}.ts`、`tests/unit/worldChoreography.test.ts`；按需小改`ActionAnimator.ts`与其回归。

**Interfaces:** `WorldChoreography(config)`提供`sync(snapshot):void`、`apply(effect):void`、`advance(deltaMs):void`、`setHandAnchor(position:Vec3):void`、`get frame():WorldFrame`、`dispose():void`。`Vec3={x:number;y:number;z:number}`；`WorldFrame`含人物/车/NPC位姿、按ID区分的木段归属/位置、树倒进度、绳索进度、Carry比例。该类不持有控制器写接口。

- [x] RED：5段ID唯一；地面+手持+飞行+车上+到家总量守恒；推进表现时间不会造资源；手部抛木首点等于传入锚点，无地面闪回。
- [x] RED：推车时人物与把手恒定接触/同位移；绑绳跟休息进度/暂停；40单位行程只跟有效Carry比例；旧epoch/reset清理半次，最终提交跨休息保留。
- [x] GREEN：复用既有阶段和幂等效果，增加三段推车路线、临时/已提交飞木交接、绳索和远距离映射；不发业务事件。
- [x] 运行目标单测、全部单测与typecheck，检查纯表现边界，提交本任务。

## Task 3: 真实3D世界与镜头

**Files:** 新增`src/game/world/{FarmWorld,models,resources}.ts`（可按职责拆分）；修改`src/game/createGame.ts`；新增`tests/e2e/world3d.spec.ts`。

**Interfaces:** `createGame(parent,controller,config):GameView`；`GameView`提供`destroy(removeCanvas?:boolean):void`、`rotate(direction:number):void`、`resetView():void`、`setInteractionEnabled(enabled:boolean):void`。保留worldCanvas的库存/阶段诊断属性以便验证；新增实际相机方位诊断，不能用虚假标记替代网格渲染。

- [x] RED：旧实现不能提供Three真实画布/旋转，拖拽后相机方位和世界点投影必须改变；reset恢复全景且不改次数。此浏览器用例由主执行者串行运行。
- [x] GREEN：安装精确版本Three与类型包，制作原创体积农舍/农田/树林/栅栏、关节人物/机器人、手推车与五段木材；首屏能看到完整农场与远处终点。
- [x] 使用手节点世界变换传给编排；飞木弧线、倒树切段、车轮/接触动作、货堆绳索按WorldFrame更新。几何/材质共享、植被实例化、像素比受限，避免无界分配。
- [x] OrbitControls只绑定画布；跟随时整体平移camera/target并保留旋转偏移，准备/结果/退出时可禁用。显式处理WebGL不可用/丢失，dispose释放资源与动画循环。
- [x] typecheck/lint/build及目标浏览器验证，实际查看全景/旋转/阶段截图；提交本任务。

## Task 4: 全景HUD、通知卡与单路PiP

**Files:** `index.html`、`web/world.css`、`src/browser.ts`、`src/ui/gamePreview.ts`、`tests/e2e/world3d.spec.ts`；旧`style.css`保留追溯。

**Interfaces:** 保留现有按钮/指标/摄像头/标定ID；增加`viewLeft/viewRight/viewReset`、`gamePreviewHost/liveMovementState/livePrescription`、`exerciseResults/gameRewards`。同一视频节点在共用预览层按当前阶段定位，不新建设备会话。

- [x] RED：首页农场无遮挡、计划卡约368px；三尺寸关键控件可见；运行中真实PiP有动作状态/配置处方，自动模式显示合成来源。
- [x] RED：准备→训练→重标定仍为同一video/srcObject/track，捕获调用不增加、Worker峰值1；失败时不切假画面，结束reset仍释放。
- [x] GREEN：全屏自适应3D视口、紧凑通知和浮动HUD；九步标定可滚动访问；真实和合成PiP按实际来源显示，状态从快照/已接受效果读取。
- [x] 绑定视角控制、模态交互禁用；保持Space/P/Esc语义及所有来源标签。运动与游戏两列等宽，次数/有效时长同等奖励字号，未测健康指标不伪造。
- [x] 主执行者串行跑新增布局/PiP与原摄像头目标E2E，查看截图，提交本任务。

## Task 5: 回归与生产验证

**Files:** 相关原`tests/e2e/{boot,deployment,visual-states,...}.spec.ts`；`scripts/verify-auto-demo.mjs`；本轮`artifacts/qa/3d/`。

- [x] 仅适配已改变的Phaser渲染器名称、固定16:9比例与初始库存12，保留业务/标定/释放断言；新增HUD不遮挡旋转及飞木、绑绳可见性断言。
- [x] 停止本项目冲突服务后实际`npm ci`，运行assets:sync、assets:verify、typecheck、lint、全部unit/E2E、build；不同时跑两套浏览器，不在E2E期间改应用源码。
- [x] localhost实际打开新dist，正常5/15/60时长自动整局/结算/重置，外源路由阻断；观察预热后至少60秒帧间隔并如实报告软件/硬件路径，不能复用旧2D性能。
- [x] 十轮设备/3D生命周期与资源趋势、子路径/模型WASM负例回归。真实摄像头、扬声器、最终视觉批准继续manual_pending。
- [x] 一次全分支独立只读审查，范围内Critical/Important先复现再修复；必要回归后提交，不做无理由反复全套重测。

## Task 6: 文档与分支交付

**Files:** `README.md`、`AGENTS.md`、`docs/{PROGRESS,DEVELOPMENT_GUIDE,TEST_REPORT,SOURCES,DEPENDENCIES,DEMO_RUNBOOK}.md`及资源许可记录。

- [x] 更新用户已确认的真3D范围与每树5段/初始0，原文需求与追加要求分别可追溯；旧T11记录作为历史保存。
- [x] 写明新版本实际命令/结果/截图、未测项与新启动方法；列出3D旋转、单路PiP、显式备用切换与健康数据限制。
- [x] 检查diff、证据路径和工作区，完成小提交，push开发分支并核对远端；不合并main、不部署。

## 自审与执行方式

已核对规格每节均由任务覆盖，模块接口一致，五类风险有对应断言。建议Native：动作数据、网格、HUD和浏览器用例紧密依赖，统一实现能减少接口来回；结束做一次独立审查。也可选择Subagent-driven逐任务实现/审查。当前目录已是开发分支且干净；可在当前目录新建3D开发分支执行，若用户选择隔离工作区则用原生worktree工具建立。
