# T06 关键点特征、标定与回放实施记录

**Goal:** 在现有摄像头诊断旁实现可独立测试的特征流水线与会话内存标定；保留键盘和自动模拟，不接运动计数，不推送。

**Spec:** DEVELOPMENT_GUIDE §5、§6.2/6.3、§9、T06；ACCEPTANCE C02/C08/E05。用户确认无摄像头，真机 manual_pending。

**Architecture:** PoseFrame → 几何检查/时间低通 → 标定会话 → 只读准备页状态。所有业务仍属于 SessionController。ReplayPoseSource仅在tests中，synthetic骨架演示不向标定链路注入数据。现有main工作区干净，原目录本地分支feature/t06-pose-calibration；基线9932e0a。

## 约束与决定

- 不改领域、原键盘/自动输入、Phaser场景或依赖版本。
- 肩/髋中心在像素空间计算，距离用当前躯干长度归一化；左右始终是解剖左右，镜像只发生在CSS显示层。
- 两侧可用性分别计算；必须有完整躯干、头/脚在画面内和所选侧有效，不用零值补点。
- tau60ms、置信度0.6、样本最大间隔200ms/年龄300ms（复用领域默认值）；新增稳定性/位移/姿态差异阈值均为实验配置，非已验收运动标准。
- 标定站立2秒，示例每姿态600ms，Carry各2秒；按按钮逐步采集，避免提前实现T07识别器。只存内存中的必要采样窗口与汇总，不写浏览器存储或上传。
- 保存自然膝角、可用侧、主手、示例原型。Carry可分性仅作准备检查，实际持姿识别和有效计时仍属T08。
- 当前无摄像头游戏入口；标定就绪仅供后续任务消费。页面不会以标定完成冒充T07–T09完成。

## 步骤与接口

### 1. 几何、平滑和站立基线

文件：src/config/recognitionConfig.ts，src/pose/features.ts、smoothing.ts、calibration.ts；tests/unit/features.test.ts、smoothing.test.ts、calibration.test.ts。

接口：extractFeatures(frame, calibration, config?) → PoseFeatures|null；inspectPose(frame, config?) → 带拒绝原因的检查结果；calibrate(samples, config?, primarySide?) → CalibrationResult；PoseSmoother.update(frame) → 含断档原因的结果，reset()清历史。

- [x] 失败测试：宽高比、平移/缩放、左右独立；缺点/NaN/零向量/低置信度/裁切/微小躯干；不足2秒、抖动、乱序、长间隔。
- [x] 实现并运行目标单测、typecheck；证据保存artifacts/qa/t06/。

### 2. 分步标定与合成回放

文件：src/pose/calibrationSession.ts，tests/helpers/replayPoseSource.ts、syntheticPose.ts，tests/fixtures/poses.synthetic.json，tests/unit/calibrationSession.test.ts、replayPoseSource.test.ts。

接口：CalibrationSession.ingest(frame, nowMs)、beginCapture()、tick(nowMs)、reset()、setPrimarySide(side)、getSnapshot()；就绪对象区分chop/load/carry。ReplayPoseSource按注入时钟/timer回放，不进入生产模块。

- [x] 失败测试：逐步完成、无变化示例拒绝、Carry不可分、选侧变化、旧帧/未来帧/过期/缺失/相邻位移突变/尺寸变化失效、取消旧采样。
- [x] 实现并验证相同夹具重复回放结果一致，reset/stop后不再输出；来源metadata明确synthetic。

### 3. 准备页集成与交付

文件：src/ui/calibrationPanel.ts、setupPanel.ts，src/browser.ts、index.html、web/style.css；tests/e2e/calibration.spec.ts；README、PROGRESS、TEST_REPORT、SOURCES。

- [x] 浏览器失败测试：真实入口未就绪不能采样，合成Worker驱动完整准备过程但不计成果；无效时显示原因；离开准备页/切模拟/隐藏页面清除标定。
- [x] 实现，保留原模拟开关与真实错误提示。页面显示主手、当前步骤、进度、特征/拒绝原因、各任务标定状态。
- [x] 完整verify、assets:verify、打开生产构建、检查实际截图、只读审查、更新进度并停在T06。

## Review focus

1. 中间无效帧不可被滤波填平并贡献标定时间（步骤1/2测试）。
2. 旧采集帧、超长间隔、后台恢复不能连接上一段（步骤2/3测试）。
3. 换主手/明显换位/尺寸变化不能复用旧标定（步骤2测试）。
4. 预设自动骨架与测试回放不得作为真实摄像头就绪（步骤3 E2E）。
5. 不可分Carry或不完整示例只能拒绝对应标定，不得触发业务成果（步骤2/3测试）。

## 执行记录

- 2026-10-16：工作区干净；44/44单测、typecheck基线通过。已读取最新进度与T06契约。现有开发指南已给出范围及接口，按用户明确要求直接执行，不重复索要计划批准。
- 几何/基线5个失败、平滑5个失败、会话/回放14个失败、浏览器缺页面失败均实际运行后再实现；补充非法置信度/负时间/滤波退化/快照示例导出负例5失败后修复。日志见本轮证据目录。
- 最终 `npm run verify`：98/98单测、23/23 E2E（3.9分钟）、类型/lint/build通过；`assets:verify`通过。新增54项单测由只读审查独立复跑通过。
- `scripts/verify-t06-production.mjs`实际打开 `index-DaYWpBoR.js`，无摄像头标定不可用，模拟启动/首个动作/暂停通过；不是正式整局重跑。三张本轮截图已查看。
- 审查无Critical/Important；相邻帧突变检查不覆盖缓慢换位/同位换人，作为Minor明确记录，需手动重做。扩大为身份检测不在T06范围；不凭未经真机验证的髋位移阈值拒绝合法下蹲。
- 用户无摄像头，真人骨架/标定/参数/性能均manual_pending。保持T06检查点，下一轮T07；不push、不合并、不部署。
