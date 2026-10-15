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
- [x] RED：不可分拒绝、抖动/无效/长gap退出、500ms不倒填；10+5+50秒、5/10/15/30Hz、暂停/代次/重复/60秒钳位。
- [x] GREEN及unit/type/lint/build，标定3项E2E回归，文档/commit/push。

## T09 输入接线与资源生命周期

文件：input/{cameraActionSource,sourceManager}.ts、ui/{setupPanel,calibrationPanel}.ts、browser.ts、index.html；unit/sourceManager、cameraActionSource与e2e/source-lifecycle。
接口：CameraActionSource.start/stop/dispose、accept(frame,now)、setProfile；SourceManager切换按generation串行stop→start，旧回调不外发；SetupPanel提供有效标定与受epoch保护的帧订阅。
- [x] RED：输入适配得相同权威结果；旧回调/异步切源/多暂停原因/重置隔离，摄像头模式无键盘自动成果；混合来源保留。
- [x] GREEN：准备完成显式启动camera；训练丢跟踪暂停并要求重新准备，不静默切模拟；停止/重置/结束释放；提供摄像头→键盘显式切换。
- [x] unit、目标与完整E2E/build；追加停帧回归RED/GREEN。文档完成后commit/push；真人整局manual_pending。

## T10 打磨与本地交付

文件：ui/audioFeedback.ts、样式与入口、tests/e2e/deployment.spec.ts、scripts生产子路径/离线验证、docs/DEMO_RUNBOOK.md。
- [x] RED：声音须交互解锁/可静音、三尺寸关键按钮可访问、子路径模型/WASM/素材本地、连续10次生命周期无累计资源。
- [x] GREEN：少量原创合成反馈音、可读模式标签/诊断；本地资源许可更新，无新增依赖。
- [x] 干净npm ci→sync→verify→完整检查→实际dist；浏览器阻断外网但保留localhost完成模拟整局（区别物理断网）；证据/文档完成，随后commit/push。

## T11 验收交付

- [x] 按ACCEPTANCE逐ID列环境/输入/预期/实际/证据/判定；范围内bug的RED/GREEN已记录。
- [x] 核查无伪AI规划/健康指标/真机精度承诺；保存已验证与人工待办，L1与L2/L3区别。
- [x] 一次全分支只读审查；P2修复后验证；更新路演手册/报告/进度，随后提交push。
- [x] 硬件/指定演示者/人工美术节奏/A04/A06未获证据不标pass，不自动发布。此勾选只说明如实记录，不表示真机通过。

## Review focus

1. 异步来源start/stop交错与旧Worker回复：T09单测/E2E必须隔离旧代次。
2. 低置信度不能被平滑跨过去：T07/08负例。
3. 双动作连续过渡不强制暂停：T07 Load负例与正例。
4. 退出/失焦后不能补计持姿，来源不能洗白：T08/09回归。
5. 生产子路径和10次重启：T10浏览器实测；物理摄像头不在自动结果中。

## 执行日志

- 2026-10-16：基线typecheck、98/98单测通过；远端origin核实为FaithZL/Tidal.git，fetch成功。新分支从T06提交创建。
- T07：初始5失败/16通过；连续站起的一帧举手回归先失败后修复。最终120/120单测、typecheck/lint/build通过；未接浏览器游戏，E2E留T09。真人仍manual_pending。
- T07 commit/push成功：98aaba9，origin/feature/t07-t11-completion，main未改变。
- T08：初始14失败/1通过，RMS门限一致性回归1失败；修复后137/137单测、3/3标定E2E、type/lint/build通过。采用与T06一致的选侧5维原型，而非未标定的双侧特征；真机适用性仍manual_pending。
- T08 commit/push成功：85df391。
- T09：149/149单测、26/26全套E2E、type/lint/build通过；新增第27项停帧过渡用例先失败再通过，随后149单测/type/lint/build再通过。重置/结算资源回调改读权威快照，避免上一帧状态触发误准备。没有真机，T09软件接线通过，真人检查保留manual_pending。
- T09 commit/push成功：872b34c；实际生产冒烟通过。
- T10：音效4单测先失败后通过，1280×720动作按钮超屏/无音效按钮先失败；三尺寸及音效浏览器转绿。十轮检查发现每轮遗留ended监听器，CDP逐track证实，AbortController清理后0遗留、总监听稳定90。子路径/资源404通过，Vite已重写HTML静态图片，无需改动路径。
- T10干净npm ci首次EPERM：本项目旧5173开发服务锁定原生模块；核实路径后停止该进程，重装成功。assets:sync/verify、153单测/type/lint通过。完整E2E捕获旧自动Carry测试的退避轮询竞态：暂停时已0.9秒，1.3秒测试目标很快结算遮挡按钮；保留全部断言，改为首样本同步失焦，待最终回归。
- 全部软件功能实现后启动一次fresh-context全分支只读审查（e8f129a至T10工作区），与末轮回归独立进行；不运行重复E2E、不调度额外实现代理。T11表按49个ID逐项列明，真人/产品批准不代签。
- 一次审查发现1个P2（无其他发现）：Load准备未检查髋部下移。两项新回归先失败，再共享校验与可重采提示；相关32项通过。最终完整verify退出0：155单测、35 E2E（7.4分钟）、type/lint/build通过。生产墙钟与阻断外源验证进行中。
- T10生产检查退出0：正常时长142.983秒整局及重置，0外源/页面异常/姿态请求。132.211秒稳态rAF平均40.06fps、p95 33.4ms，不能据此宣称60fps目标/真人性能已通过。物理断网另待现场验证。
- T10 commit/push成功：d4d086f。P01约60fps目标保留fail；短对照确认当前SwiftShader软件渲染路径，未测硬件GPU。T11软件文档收尾，49项33pass/1fail/15manual_pending，人工签字与L2/L3仍未完成。
