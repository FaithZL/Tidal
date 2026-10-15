# Tidal 开发进度（2026-10-15，本轮接手完成）

## 本轮结论

在原有源码基础上增量补齐T04键盘检查点。Phaser/Vite/npm锁文件已接入；真实浏览器键盘流程已通过；T02摄像头代码、模型与Worker推理已具备，但**真人骨架验收为manual_pending**。没有进入T05–T11，也没有将关键点诊断写成三种运动识别完成。

本地目录不是Git仓库。已用`.handoff-baseline/`保留接手文件，`artifacts/qa/source.diff`记录源码差异；未创建commit、未push、未合并、未对外部署。本轮没有重新查询GitHub，历史“远端空仓库”的说法不作为当前远端状态。

## 任务状态

| 任务 | 状态 | 本轮证据与边界 |
|---|---|---|
| T01 工程与首页 | pass | Phaser 3.90.0、Vite、TS strict、锁文件、标准脚本；首页取消/重开与生产禁止URL加速测试通过 |
| T02 摄像头/关键点 | implemented / manual_pending | 本地模型与同版WASM、classic Worker、骨架与指标、错误/取消/释放；合成摄像头推理通过。真实设备返回Not supported，未获得真人关键点 |
| T03 领域规则 | pass（本轮键盘规则） | 保留原逻辑与有效测试，新增乱序/非法输入、精确计时、暂停隔离、两局库存守恒、奖励一次性回归。摄像头跟踪心跳与混合来源接入仍在T09 |
| T04 完整键盘流程 | pass，停在检查点 | 两轮加速E2E与一轮正式5/15/60秒构建流程均通过；暂停/恢复/焦点/自动重复/pointercancel/Esc/重置通过 |
| T05–T11 | not_started | 最终美术、标定、三类识别、真人整局、性能/离线彩排等未进入 |

## 基线与环境复测

- 已读AGENTS、README、指南0–9节及T01–T04、ACCEPTANCE、SOURCES；核实src/tests存在并修正AGENTS旧文案。
- Node 24.14.0、npm 11.9.0、Windows、Chromium 156.0.8078.4。
- 首次原`npm run typecheck`和`test:unit`因未安装tsc失败；安装原TypeScript 5.8.3后，原类型检查与13/13单测通过。
- npm registry、浏览器下载和实际浏览器运行均成功，历史EAI_AGAIN与ERR_BLOCKED_BY_ADMINISTRATOR不再成立。
- npm ci第一次被仍运行的Vite preview锁住Windows Rolldown原生模块，停止本轮预览进程后重跑成功。没有修改权限或使用force。

## 最终实际命令与结果

| 命令/操作 | 实际结果 |
|---|---|
| `npm ci` | pass，安装137包，审计0漏洞 |
| `npm run assets:sync` | pass，锁定0.10.32，4个运行文件及固定SHA模型 |
| `npm run assets:verify` | pass；另对WASM loader注入损坏，校验以非零退出拒绝，恢复后再次通过 |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run test:unit` | **26/26 pass**，5个测试文件；原13断言保留 |
| `npm run test:e2e` | **14/14 pass**，约1.2分钟；非空测试集 |
| `npm run build` | pass；主JS约1.224MB（gzip329KB），Vite仍提示大于500KB；未隐藏警告 |
| `npm run verify` | pass，串行执行typecheck/lint/unit/e2e/build，完整日志见下 |
| `node scripts/verify-production.mjs` | pass，正式5秒倒计时/15秒休息/60.0秒Carry，实际143.136秒，15木材/100金币/100体力、重置成功；无pageerror或外部请求 |
| 最终dist浏览器冒烟 | pass，加载`index-W_CbjmMk.js`；Phaser首页、默认60秒、合成视频实际模型推理、关闭释放；无pageerror/外部请求 |
| `node scripts/probe-real-camera.mjs` | **manual_pending**，不带fake-device参数，设备返回`Not supported`；停止后srcObject为null，未保存画面或关键点 |
| `npm audit` | pass，0漏洞 |

证据：

- `artifacts/qa/final-verify.log`：最终完整检查日志。
- `artifacts/qa/production-flow.json`：正式时长整局报告。
- `artifacts/qa/production-home.png`、`production-results.png`：实际浏览器截图，已查看。
- `artifacts/qa/final-build-smoke.json`：最终dist实际运行与模型推理报告。
- `artifacts/qa/real-camera-probe.json`：真实设备尝试，明确manual_pending。
- `artifacts/qa/assets-negative-check.txt`：损坏资源负例结果；`source.diff`：源码差异。
- `playwright-report/index.html`：当前14用例报告。

## 改动文件

- 工程：`package.json`、`package-lock.json`、`tsconfig.json`、`vite.config.ts`、`vite.worker.config.ts`、`vitest.config.ts`、`playwright.config.ts`、`eslint.config.mjs`、`.gitignore`。
- 沿用/修改：`src/browser.ts`、`src/config/demoConfig.ts`、`src/domain/sessionController.ts`、`src/input/keyboardActionSource.ts`、`web/style.css`。
- 新增表现与契约：`index.html`、`src/game/createGame.ts`、`FarmScene.ts`、`src/input/types.ts`、`src/vite-env.d.ts`。
- 摄像头：`src/pose/types.ts`、`cameraService.ts`、`poseWorkerClient.ts`、`pose.worker.ts`、`src/ui/setupPanel.ts`。
- 资源：`scripts/vision-assets.mjs`、`sync-vision-assets.mjs`、`verify-assets.mjs`、`public/models`、`public/mediapipe`、`public/licenses`；生成Worker位于`public/worker`。
- 测试：原3个`tests/unit/*.test.mjs`迁Vitest并保留断言；新增`cameraService.test.ts`、`poseWorkerClient.test.ts`和3个`tests/e2e/*.spec.ts`；`scripts/verify-production.mjs`、`probe-real-camera.mjs`。
- 文档：`AGENTS.md`、`README.md`、根目录`PROGRESS.md`入口、本文件、`TEST_REPORT.md`、`DEPENDENCIES.md`、`IMPLEMENTATION_T01_T04.md`。

原Canvas源码、旧web/index与Python测试保留作交接对照，没有继续作为运行入口。领域源码仅做局部修正；快照/库存/计时仍只由SessionController修改。

## 重要修复与决策

先写失败测试并实际运行，再修复：时钟倒退重复扣时、采集时间逆序导致Carry多计、末帧有效时长超额、结算漏最后一帧墙钟、NaN阶段仍计数、异步start/stop复活、按钮重复空格、即时取消摄像头、P焦点与Esc退出确认。

MediaPipe1.1.1初测会尝试发送遥测，未用于交付；换成0.10.32后同一网络回归通过。只用CPU Worker路径，未宣称GPU通过。具体版本、下载地址、SHA和Apache/MIT许可见DEPENDENCIES。

独立只读代码审查发现P键被按钮焦点屏蔽，已由浏览器失败测试确认并修复；相关新测试通过。无未处理Critical/Important审查项。更完整的Worker超时/强制终止矩阵留给T09；当前已有超时/清理防护，不等于这些未测分支已验收。

## 未确认假设和未验证项

A03（3棵×5次、已有12单位木材）、A04阶段同步、A06持姿代理、A07示例指标、A08预设计划、A09美术方向均仍**未确认**。默认数值由配置派生，不写成用户确认。相机不证明重量或真实持握；无真实心率/卡路里。

待人工：真实摄像头视频+人体骨架同步、真机60秒性能、指示灯释放、不同机位/遮挡。键盘与合成视频测试不覆盖这些。最终美术/声音、摄像头整局动作识别、10轮真机资源检查、外网断开与子路径发布验收仍未完成。

## 启动和下一步

`npm ci` → `npm run assets:sync` → `npm run assets:verify` → `npm run dev`，打开终端本机地址。完整测试方式见README。

用户手动摄像头验证：接受计划 → 开启摄像头诊断 → 允许视频 → 检查全身骨架随动作变化和诊断指标 → 停止/返回首页检查指示灯关闭。记录机器、浏览器、摄像头、分辨率、光照和结果；无需上传视频。

本轮停在T04。下一轮T05统一视觉与阶段表现，同时补T02真机证据；然后按T06标定、T07重复动作、T08持姿、T09集成顺序继续。
