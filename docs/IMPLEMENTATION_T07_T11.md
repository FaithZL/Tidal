# T07–T11 连续实施记录

**Goal:** 按用户2026-10-16授权，从现有T06增量推进至T11；每阶段验证、记录、提交并push到独立开发分支。
**Architecture:** PoseFrame → 校验/平滑 → 无领域依赖的识别器 → CameraActionSource补协议元数据 → SessionController。键盘与自动模拟保留；任何业务计数/库存/奖励仍只由原控制器写入。
**Tech Stack:** 现有锁定Phaser3.90.0 / TypeScript strict / Vite / MediaPipe0.10.32，原生DOM。
**Spec:** DEVELOPMENT_GUIDE §§5–9、T07–T11，ACCEPTANCE全部条目。使用executing-plans与TDD逐阶段执行。

## 全局约束与决定

- 基线e8f129a，工作区干净；新分支feature/t07-t11-completion，不合并main、不对外部署。
- 用户最新指示明确授权每阶段commit/push，覆盖此前“不自动push/停T06”；不再重复询问计划批准。
- 用户没有摄像头，真实准确率/动作负例/性能/真人整局保持manual_pending；T11只能交付证据化验收表，不能代签人工产品批准。
- 新阈值保持可配置实验值；合成夹具不伪装真人，回放仅tests；不新增后端或第三方服务。
- 连续阶段在同帧满足时可按顺序发事件；必须有此前蹲下证据，不要求站起到举手人为停顿。

## T07 砍树/装车识别

文件：src/pose/recognizers/{types,featureStream,repRecognizer,chopRecognizer,loadRecognizer}.ts、recognitionConfig.ts；tests/helpers/recognizerReplay.ts、两个recognizer单测。
接口：RecognitionEvent为不含SignalMeta的ExerciseSignal；Recognizer.update(frame, nowMs?)返回语义列表，reset/getDebug；RecognitionProfile携带T06基线与示例。识别器只发阶段/impact/完整复位事件。
- [x] RED：3次往返=3次、impact先于rep、重复/半次/超时/低置信度/断档/抖动/重置不计；Load连续站起上举合法。
- [x] GREEN：按标定差值归一化、120ms确认、Chop0.4–6秒/Load0.8–10秒周期，保持阶段；缺标定拒绝。
- [x] 全unit/type/lint/build，检查diff，更新PROGRESS；随后执行commit/push，结果追加下一阶段日志。

## T08 Carry代理

文件：carryRecognizer.ts、recognitionConfig.ts、carryRecognizer.test.ts、carryTiming.test.ts。
接口：同Recognizer，只发hold-sample；500ms进入、0.35D进入/0.55D退出，当前T06选侧特征原型，未证明真实持握。
- [ ] RED：不可分拒绝、抖动/无效/长gap退出、500ms不倒填；10+5+50秒、5/10/15/30Hz、暂停/代次/重复/60秒钳位。
- [ ] GREEN及unit/type/lint/build，文档/commit/push。

## T09 输入接线与资源生命周期

文件：input/{cameraActionSource,sourceManager}.ts、ui/{setupPanel,calibrationPanel}.ts、browser.ts、index.html；unit/sourceManager、cameraActionSource与e2e/source-lifecycle。
接口：CameraActionSource.start/stop/dispose、accept(frame,now)、setProfile；SourceManager切换按generation串行stop→start，旧回调不外发；SetupPanel提供有效标定与受epoch保护的帧订阅。
- [ ] RED：输入适配得相同权威结果；旧回调/异步切源/多暂停原因/重置隔离，摄像头模式无键盘自动成果；混合来源保留。
- [ ] GREEN：准备完成显式启动camera；训练丢跟踪暂停并要求重新准备，不静默切模拟；停止/重置/结束释放；提供摄像头→键盘显式切换。
- [ ] unit、目标与完整E2E/build、生产检查；文档/commit/push。真人整局manual_pending。

## T10 打磨与本地交付

文件：ui/audioFeedback.ts、样式与入口、tests/e2e/deployment.spec.ts、scripts生产子路径/离线验证、docs/DEMO_RUNBOOK.md。
- [ ] RED：声音须交互解锁/可静音、三尺寸关键按钮可访问、子路径模型/WASM/素材本地、连续10次生命周期无累计资源。
- [ ] GREEN：少量原创合成反馈音、可读模式标签/诊断；本地资源许可更新，无无用依赖。
- [ ] 干净npm ci→sync→verify→完整检查→实际dist；浏览器阻断外网但保留localhost完成模拟整局（区别物理断网）；证据/文档/commit/push。

## T11 验收交付

- [ ] 按ACCEPTANCE逐ID列环境/输入/预期/实际/证据/判定；补范围内bug的RED/GREEN。
- [ ] 核查无伪AI规划/健康指标/真机精度承诺；保存已验证与人工待办，L1与L2/L3区别。
- [ ] 全分支只读审查；必要修复后验证；更新路演手册/报告/进度，提交push。
- [ ] 硬件/指定演示者/人工美术节奏/A04/A06未获证据不标pass，不自动发布。

## Review focus

1. 异步来源start/stop交错与旧Worker回复：T09单测/E2E必须隔离旧代次。
2. 低置信度不能被平滑跨过去：T07/08负例。
3. 双动作连续过渡不强制暂停：T07 Load负例与正例。
4. 退出/失焦后不能补计持姿，来源不能洗白：T08/09回归。
5. 生产子路径和10次重启：T10浏览器实测；物理摄像头不在自动结果中。

## 执行日志

- 2026-10-16：基线typecheck、98/98单测通过；远端origin核实为FaithZL/Tidal.git，fetch成功。新分支从T06提交创建。
- T07：初始5失败/16通过；连续站起的一帧举手回归先失败后修复。最终120/120单测、typecheck/lint/build通过；未接浏览器游戏，E2E留T09。真人仍manual_pending。
