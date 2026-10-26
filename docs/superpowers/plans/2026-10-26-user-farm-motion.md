# User Farm Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task. This session uses parallel isolated file ownership for locomotion, with integration and final review in the parent. Steps use checkbox tracking.

**Goal:** 补现有用户人物挥砍与walk/push/pull动作，保留装车。

**Architecture:** 一个模型、一套17骨架；旧UserLoadCharacter默认load行为保留，可选farm范围组合阶段挥砍与步行动作。FarmWorld仅读权威编排、挂接实际手/脚/刀尖诊断；旧局部样片不改变。

**Tech Stack:** Three.js0.186.1、TypeScript strict、Vite/npm、原生DOM。

**Spec:** ../specs/2026-10-26-user-farm-motion-design.md；用户2026-10-26确认现有挥砍和行走范围，沿用3D_FARM_DESIGN及DEVELOPMENT_GUIDE§7.1。

## Global Constraints

- 不改SessionController、ExerciseSignal、识别器、计次/库存/有效持姿时长或既有路径。
- 不改源FBX、UV/贴图、rig绑定、许可、依赖和锁文件；保留旧样片及load默认兼容。
- 暂停/无效/超过100ms间隔不得推进；显式复位允许重新采样。真实摄像头不申请、不采集。
- 保留原未提交工作与历史QA，测试前备份，生成文件转存本轮后恢复原SHA。
- 不commit/push/部署。现有本机main及工作区为用户指定基线，直接增量处理。

## Review Focus

1. 过早ready/return或漏掉某一渲染帧时，不跳姿势或自由循环（任务1）。
2. 挥砍与装车共享rig后，握指几何不能污染抛木（任务1）。
3. 推拉转向、尺度父节点与窄屏下，手锚仍来自实际身体（任务2、3）。
4. 暂停/长间隔发生在换mode时，不能推进身体或步态（任务1、2）。
5. 旧epoch、重置、迟到模型与销毁仍清理且只释放一次（任务3）。

## Task 1: 阶段挥砍及可选farm适配

Files: src/game/world/userFarmChopMotion.ts (new), userCharacterMotion.ts, userLoadCharacter.ts; tests/unit/userFarmCharacter.test.ts (new)。

Interfaces: UserFarmChopMotion(rig).update(actor,deltaMs?), reset(), leave(), handPosition(), bladePosition(), visualRevision；UserLoadCharacter(loading,scope:'load'|'farm'='load')。

- [x] RED：真实FBX在farm的chop-down仍静态；准备到触木的真实手/刀尖应有>.5m运动。实际运行失败日志。
- [x] 实现有限阶段推进；准备保持高举、下挥停触点、回收先清离再回位；早切从当前显示时间接续。
- [x] 校准树干落点；进入/退出挥砍显式恢复握指几何。单rig单所有者。
- [x] GREEN：真实双握点、足底/肢长、阶段停留/早切/无效间隔、装车往返几何、默认load兼容与释放负例通过。

## Task 2: 行走与推拉

Files: src/game/world/userWalkMotion.ts (new), tests/unit/userWalkMotion.test.ts (new)。独立文件由子代理负责。

Interfaces: UserWalkMotion(rig).update(actor:WorldActor,deltaMs?:number), reset(), handPosition():T.Vector3, visualRevision。

- [x] RED：实际足部需随stride交替前后/抬起，原静态入口失败证据由任务1共同提供。
- [x] 用现有NprMotion产生迈步，真实腿IK保持长度、脚底不穿地，步行摆臂；push手掌本地[±.35,1.04,.5]、pull[±.35,1.04,-.55]，与既有车把相符。
- [x] GREEN：真实足部前后变化>.15m、抬脚>.04m，肢长不变；push/pull固定双掌、暂停/异常间隔冻结、变换父节点及reset有限。

## Task 3: 农场接入及验证

Files: FarmWorld.ts; tests/e2e/user-farm-motion.spec.ts(new), user-load-motion.spec.ts, user-models.spec.ts; docs/SOURCES.md、public/assets/user-models/README.md、PROGRESS.md、artifacts/qa/user-farm-motion-20261026/。

- [x] RED：浏览器真实刀尖与足部诊断应变化，原静态失败，不只检查标签。
- [x] FarmWorld启用farm范围和准确标签，发布实际骨骼诊断；旧E2E只替换被新范围取代的标签，保留全部业务断言。
- [x] 运行typecheck/lint、全部unit、动作/模型/城堡相关E2E、assets:verify/build；记录实际退出码。完整verify既有prototype截图失败保留。
- [x] 正常速度生产构建看挥砍、步行、推/拉与装车，合成画布截图/录像，确认没有摄像头申请。
- [x] 独立只读审查；范围内问题先复现再最小修复；恢复历史QA并核对原未提交文件SHA。
- [x] 更新真实记录及未验项，保留开发服务以供用户看动画，无提交/推送/部署。
