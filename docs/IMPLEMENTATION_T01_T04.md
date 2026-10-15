# T01–T04 增量实施记录（2026-10-15）

依据：DEVELOPMENT_GUIDE.md 第0–9节与T01–T04、用户本轮接手指令。

目标：保留已有配置、领域状态机和键盘源，以 Phaser 3.90.0 替换渲染，建立 Vite/npm 锁定工程；提供摄像头关键点诊断和浏览器完整键盘流程。

架构：SessionController 是业务权威；FarmScene 只读取快照/效果；CameraService → PoseWorkerClient → PoseFrame 只用于本轮诊断，不发运动计数。

执行：本会话直接实施。用户已明确要求先核对后开始实现，不再重复设计审批。沿用开发指南的任务计划，不另建替代产品方案。

- [x] 核对：无 Git；src/tests 已存在。原 npm 脚本首次因缺 tsc 失败；安装原 TypeScript 5.8.3 后 typecheck、13 项单测通过。
- [x] T01：锁定依赖/标准脚本；迁移测试到 Vitest（保留原断言）；boot 测试先证明缺 Phaser，再接入 Vite/Phaser/DOM。
- [x] T02实现：权限/缺模型/取消初始化浏览器负例；Worker 并发、乱序、停止清理测试；本地资源与 SHA 校验。真实设备返回Not supported，真机验收manual_pending。
- [x] T03：保留原测试，补时间倒序、暂停、旧事件、有效持姿精确钳位、逐次库存守恒等负例，失败后最小修复。
- [x] T04：Playwright 完整两轮、暂停/焦点/长按/取消/重置；生产构建禁用 URL 测试加速；产物按正式5/15/60秒跑通并截图。
- [x] 最终：npm ci → 资源同步/校验 → typecheck/lint/unit/e2e/build；26单测、14 E2E通过；复核差异；更新 README/PROGRESS/TEST_REPORT。

重点复核：迟到权限/图像回调释放；多暂停原因与恢复不补时；重复/过期/逆序输入；库存守恒/奖励一次；构建与运行资源同版且无 CDN。

决策：没有 Git，使用 .handoff-baseline 保存接手文件副本供差异复核，不伪造提交。沿用已有 browser.ts/UI 样式；新增文件仅承担 Phaser 和摄像头职责。原 Canvas 文件保留为历史对照但退出运行入口。

产品假设 A03/A04/A06/A07/A08/A09 仍未确认，维持可配置与可见标签。T05–T11 不在本轮范围。

## 执行决策与红绿记录

- T01 boot先失败：原Canvas不含Phaser渲染、普通URL能把Carry改为2秒；迁移后通过。
- 原13项测试断言保留，测试runner改为Vitest，直接导入TS；不再依赖历史web/js编译副本。
- T02先使用1.1.1，但浏览器网络断言暴露遥测；改锁0.10.32，classic Worker用Vite单独打包，未改第三方源码。CPU路径显式展示，GPU未验证。
- 摄像头与Worker的取消竞争先由测试复现，加入epoch检查，迟到stream/bitmap释放；不因等待用户授权而自动开始键盘。
- 领域回归先复现倒退时钟、乱序采集时间、末帧有效时间超额、结算墙钟漏最后一帧、NaN阶段仍计数，最小修复后重跑全套。
- 键盘start/stop异步竞争与原生按钮重复空格先复现，再修复；单独保留输入框与按钮本身的空格语义。
- P键按钮焦点问题由独立只读审查提出，并经浏览器失败测试确认；修复时同时禁止退出确认后方的快捷键恢复。
- 路径映射：保留browser.ts内原有syncSource作为本轮源管理，不另写第二套SourceManager；实现ActionSource可编译契约。CameraActionSource及混合来源接入归T09。
- 本机无Git，故技能内Git工作树/提交/合并步骤不适用；以基线副本与source.diff完成差异复核。
- Windows第一次npm ci被仍运行的preview锁住Rolldown原生模块，停止该预览进程后npm ci成功。未修改系统权限或用force绕过。
