# Recognition Controls Implementation Plan

**Goal:** 现有摄像头识别可从界面直达、调宽松度，并显示绿/红部位提示。
**Architecture:** 不可变容差factory注入CameraActionSource，现有recognizer只加只读feedback；browser通过原暂停/换epoch完成设置事务，SetupPanel按feedback绘制。
**Tech Stack:** 现有strict TypeScript、MediaPipe、原生DOM/CSS、Three.js0.186.1，无新依赖。
**Spec:** `docs/superpowers/specs/2026-10-26-recognition-controls-design.md`。

## Constraints / Review Focus

不改完整复位/时效/置信度/采样空档/库存规则；反馈不写成果，不自动申请摄像头、不静默退模拟。主手/遮挡/过渡不误着色；调档中半次与持姿候选不能拼接；原所有暂停原因与动画停止保留；历史QA按SHA恢复。

### Task 1: 容差和source
- [x] 新factory五档、标准精确默认，先RED再实现。
- [x] CameraActionSource统一注入配置，变化清上下文/profile，重建前由browser复验标定；真实缩幅正例及所有档负例、固定保护与半次测试通过。

### Task 2: 只读颜色反馈
- [x] 新纯assessRecognitionFeedback及测试，先RED；当前任务/阶段的主手臂、主侧膝和髋部独立反馈，过渡/未知灰。
- [x] Recognizer.getFeedback只保留最新有效特征，失效/reset清空；不改原计次事件序列。

### Task 3: UI与事务
- [x] 新E2E先跑缺少入口RED；新增偏好容错单测。
- [x] 顶栏摄像头入口、准备页滑块/按钮、设置状态、返回训练和实时颜色图例；SetupPanel按反馈画点/线。
- [x] 应用设置暂停、同源换epoch、复用有效标定并保持暂停；不重开轨道/Worker、不误解除停止动画/跟踪暂停。
- [x] 新E2E验证偏好/边界/颜色像素与缺失中性、摄像头失败、半次中改档、完整三任务/成果守恒。

### Task 4: 验证与交付
- [x] typecheck/lint/全unit、新与相关旧E2E、assets:verify/build；独立只读审查，缺陷RED→GREEN。
- [x] 正常生产构建实际打开UI，桌面/窄屏控件可达，合成颜色证据不当真人验收。
- [x] 恢复历史QA原SHA、更新PROGRESS/指南/验收/来源，保留清理提交与旧ignored证据，不提交/push/部署。
