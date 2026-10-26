# Movement Guide Implementation Plan

**Goal:** 在截图红框加入当前动作的线条骨骼标准示范。
**Architecture:** 复用tutorialLessons坐标，独立纯循环时钟和SVG显示，接入现有browser更新循环。
**Tech Stack:** strict TypeScript、原生DOM/SVG/CSS；现有Three.js 0.186.1不变。
**Spec:** `docs/superpowers/specs/2026-10-26-movement-guide-design.md`。

## Global Constraints

- 当前main和未提交教学成果增量开发；无commit/push/部署、安装或素材变更。
- 只消费SessionSnapshot；示范不能产生输入或训练成果。
- QA先备份，旧输出重生成先另存本轮再恢复原SHA。

## Review Focus

- 循环边界不能跳回入镜/要求持姿时反复放下。
- 没有hidden rAF的短后台不能补算动画。
- 暂停/源epoch/任务切换及时清时间基准与缓存。
- 窄屏避免挡住输入预览与左侧训练按钮。
- 同时保留完整教学和输入骨架各自的语义/资源所有权。

### Task 1: 纯示范循环

**Files:** `src/ui/movementGuideClock.ts`、`tests/unit/movementGuideClock.test.ts`。
**Interfaces:** MovementGuideClock(task='chop'), frame{task,stepIndex,title,elapsedMs,totalMs,points}, reset(task), advance(deltaMs)。
- [x] 写语义失败测试并运行；挥砍[1,2,3]、装车[0,1,2,3,4]、持姿[1]，复用来源步骤时长；75%段长到目标后保持。
- [x] 最小实现：平滑连续回环，拒绝非有限/非正/超200ms增量；reset清零；范围测试通过。

### Task 2: 常驻骨骼与接入

**Files:** `src/ui/movementGuide.ts`、`src/browser.ts`、`index.html`、`web/movement-guide.css`、`tests/e2e/movement-guide.spec.ts`。
**Interfaces:** MovementGuide(root), sync(snapshot,enabled), update(now), dispose()；不自建rAF。
- [x] 新E2E先运行红测，确认缺少示范入口。
- [x] SVG使用14点、绿线/金节点/深绿网格；按只读任务切换，rest显示下一项，暂停/后台清时间，context变化reset。
- [x] 原rAF更新与pagehide销毁；响应式卡片避开旧PiP、timeline与按钮，减少动态时关键帧定格。
- [x] 新E2E检验实际节点、三任务、无输入无成果、暂停/恢复、短后台/context及窄屏。

### Task 3: 回归与交付

- [x] typecheck、lint、全unit、新E2E及教学/输入来源相关E2E；不改旧断言。
- [x] build并打开正常速度生产构建，查看动作与桌面/窄屏截图；不录真人，不请求摄像头。
- [x] 独立只读审查，检查diff，恢复QA原SHA，更新PROGRESS/来源/验证记录，保持未提交。
