# Animation Stop Implementation Plan

**Goal:** 手动一键冻结/继续动画与相应训练成果。
**Architecture:** 现有controller user暂停管训练，页面全局停止标志管渲染和独立播放器。继续只移除本次拥有的暂停原因。
**Tech Stack:** 现有strict TypeScript/原生DOM/CSS/Three.js0.186.1，无新依赖。
**Spec:** `docs/superpowers/specs/2026-10-26-animation-stop-design.md`。

## Constraints / Review Focus

保留旧暂停/P、所有未提交工作及QA；不采集真实摄像头，不改识别阈值、领域计次/库存规则。重点检查资源加载前停止、已暂停时重复停止、教学内可达、短后台/停播间隔、摄像头失效仍需准备、重置不自动开局。

### Task 1: 失败用例
- [x] 新`tests/e2e/animation-stop.spec.ts`先跑缺少入口RED；覆盖实际节点/角色/库存冻结、继续、快捷键、教学/准备播放器、自动开局与其他暂停原因。

### Task 2: 最小接入
- [x] `index.html`常驻按钮和教学入口、`web/animation-stop.css`；browser全局停止开关、user原因所有权、Shift+P和默认开局门禁。
- [x] FarmWorld/createGame增加表现冻结门禁，保留视角操作；SyntheticPreview、ExerciseTutorialPanel加setSuspended并清时间基准，教学本地播放不能绕过停止。
- [x] 新E2E通过；审查/负例真实失败后最小修复。

### Task 3: 验证与交付
- [x] typecheck/lint/完整unit、新E2E和暂停/教学/来源相关回归，旧断言保留。
- [x] build，正常速度生产画面验证停止/继续，桌面与窄屏截图；独立只读审查。
- [x] 恢复历史QA的原SHA，记录真实结果/限制并更新PROGRESS，不提交/push/部署。
