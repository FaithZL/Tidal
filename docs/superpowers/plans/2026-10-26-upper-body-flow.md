# Upper Body Farm Flow Implementation Plan

**Goal:** 用户坐在电脑前完成上半身正式训练，自动准备并进入训练。
**Architecture:** 独立六点特征/自动准备与Recognizer接入原CameraActionSource/ExerciseSignal；原SessionController与全身链路不变；browser负责当前模式、自动许可和暂停所有权。
**Tech Stack:** 现有strict TypeScript、Three0.186.1、Vite、原生DOM/CSS，无新依赖。
**Spec:** `docs/superpowers/specs/2026-10-26-upper-body-flow-design.md`。

- [x] 六点Stream/三步自动准备：RED→GREEN、固定质量和连续样本/姿态差异保护。
- [x] 上半身Recognizer/CameraActionSource：RED→GREEN、完整双臂循环/持姿/反馈/配置清半次。
- [x] 上半身教学与标准示范：保留旧课程，按模式切换，不影响暂停和成果隔离。
- [x] 浏览器默认上半身与原全身选择、只点一次开启后的自动准备/开始、已有暂停保留；新增E2E先RED。
- [x] 新/旧相关测试、全unit/typecheck/lint/assets/build，实际生产UI检查；历史QA恢复与旧未提交工作保留、更新PROGRESS；不提交/push/部署。
