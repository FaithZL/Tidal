# Tidal · 映动农场（T06 检查点 + 可开关自动模拟）

项目仓库：[FaithZL/Tidal](https://github.com/FaithZL/Tidal)。本轮在本地 `feature/t06-pose-calibration` 分支增量开发，基线 `9932e0a`；不推送、不合并、不部署。`main` 的首次提交为 T05 与自动模拟功能，进度/测试文档中的“无 Git”属于此前轮次的历史记录。

在现有 TypeScript 领域逻辑与键盘原型上增量实现的 Phaser Web Demo：

**首页计划 → 5秒倒计时 → 15次挥砍 → 15秒休息 → 5秒倒计时 → 15次装车 → 15秒休息 → 5秒倒计时 → 60秒有效拉车 → 结算 → 返回首页重置。**

**没有摄像头也能直接看效果：接受计划 → 打开“无摄像头测试” → 开始自动模拟演示。** 准备页显示运动中的合成骨架；开始后自动完成砍树、装车、拉车与结算，农场人物/NPC沿用 T05 表现。正式时长约两分半，可暂停。开关默认关闭，返回首页/重新开始后关闭；训练中切换会先暂停，关闭后点“继续”即可恢复手动键盘。

该骨架是原创脚本示意，不是摄像头画面或 MediaPipe 推理结果；准备页不计成果，也不参与标定，结算明确记录是否使用自动模拟。模拟模式不请求摄像头或加载姿态模型，也不产生假推理指标。以后接上摄像头可关闭测试并点“开启摄像头诊断”进行关键点诊断和分步标定；**真实动作控制还需要后续 T07–T09，硬件接上不会自动具备动作识别。**

游戏画面由 Phaser 3.90.0 绘制，沿用原 DOM/CSS 界面。T05 在现有场景上增加原创暖色矢量农场、分层农夫、杉树/树桩、木材、手推车、菜畦与农舍，以及机器人伙伴“禾禾”。七种动作阶段可以分别保持；击中、倒树、木材飞行和有效拉车都有对应表现。

第一段休息时角色/伙伴归拢现有木材、推车靠近；第二段整理场地并固定货物。禾禾是**预设协作 NPC**，不是真人联机。`SessionController`仍是计数、计时、库存和奖励的唯一权威。自动演示新增独立输入源，复用原键盘语义协议；领域、配置、手动输入与已有测试未改动。原 E2E 保留；外发检测使用严格 URL 来源比较，正确识别 Phaser 本地 SVG 的同源 `blob:` 地址。

游戏保留 T05 统一视觉，最终美术方向、动作节奏和多尺寸路演验收仍待产品人工批准；系统任务符号和音效完善留到 T10。T06 增加关键点特征、时间低通、准备页标定与测试专用回放，尚未进入 T07–T09 动作识别。

已知视觉细节：键盘装车 `load-return` 到完整提交约 135ms，手持木材会先回地面再飞入车，衔接仍可打磨；库存与计数不受影响。当前布局验证针对默认计划，未承诺任意数量的树木布局。

摄像头提供独立的 MediaPipe 关键点诊断，加载本地模型/WASM，显示视频、骨架和推理指标。**T06 标定只作准备，不增加训练次数，也不启用摄像头游戏入口。** 用户确认本机没有摄像头，本轮未做真机尝试；真人骨架、标定可用性、阈值和准确率继续为 `manual_pending`。

## 安装和启动

实际验证环境：Windows，Node **24.14.0**、npm **11.9.0**。建议使用 Node 24；不依赖全局 TypeScript。Windows重新安装前先停止正在运行的Vite开发/预览服务，避免原生模块被占用。

```powershell
npm ci
npm run assets:sync
npm run assets:verify
npm run dev
```

打开终端显示的本机地址（默认 `http://127.0.0.1:5173/`）。`predev`会先重建classic姿态Worker。`assets:sync`从锁定npm包复制WASM；模型缺失/校验不符时才从固定官方地址下载，并验证SHA-256。

构建与本地预览：

```powershell
npm run build
npm run preview
```

默认预览地址 `http://127.0.0.1:4173/`。`dist/`是静态产物；摄像头使用localhost或HTTPS，不使用双击HTML方式运行。本轮没有对外部署。

## 操作

- 首页可取消并重新打开预设训练计划，点击接受进入准备页。
- 无摄像头：打开测试开关，再点“开始自动模拟演示”。开启前/开启中均有明确模拟标记；自动模式下手动动作按钮与 Space 不叠加计数。
- 全局测试开关可在训练中切换，会先暂停。关闭后点击“继续”回到键盘；保持打开时点击“继续”恢复自动演示。失焦/后台也会暂停，不补计离开时间。
- 点击“关闭摄像头并开始键盘演示”进入完整流程。
- `Space`或动作按钮：一次挥砍/装车循环，复位后计数；自动重复与重叠动作不多计。
- 拉车时长按`Space`或按住按钮，松开、失焦或`pointercancel`即停止。
- `P`或暂停按钮：暂停/继续。页面切后台会暂停，返回后需主动继续；输入框中的按键保留原行为。
- `Esc`：退出确认；取消保留进度，确认返回首页并重置。
- 结算区区分任务有效时间、含休息/暂停的会话时间；奖励每局只提交一次。

摄像头手动检查：接受计划 → 开启摄像头诊断 → 允许视频权限 → 等待本地模型。请在桌面Chrome/Edge、单人、全身可见的条件下检查视频与骨架同步；记录设备、浏览器、分辨率和诊断数值。停止/取消/返回首页后检查摄像头指示灯关闭。失败会显示原因，并提供重试/停止/显式键盘入口。只请求视频，本机内存处理，不录像、不上传或默认保存真实姿态。

## T06 标定（有摄像头后再手动验证）

开启诊断后展开“姿态标定 · T06”，保持相机固定、全身与举手范围入镜，主手按本人左右选择（镜像预览不会交换解剖左右）。有效关键点到达后才可采样。

1. 点击采集自然站立，稳定保持 2 秒，记录躯干尺度、可用侧和自然膝角。
2. 依提示分别采集挥砍上肩、下方位置；蹲下、站起、举手、复位，各保持 0.6 秒。按舒适幅度示范，不要求负重或强行达到默认角度。
3. 分别采集 Carry 持姿和放下后姿态，各 2 秒。差异不足会显示“不可区分”，不会通过 Carry 标定。

界面显示步骤、采样进度、拒绝原因、主手侧角度/相对腕位置，以及砍树/装车/Carry 的独立标定状态。离开准备页、停止摄像头、切换模拟、失焦/后台、换主手、低置信度、采样断档、明显位置/尺度跳变会清除旧标定；恢复后须重新采集。只有当前采样窗口保留原始点，完成/失败后清空；汇总特征仅存内存，不写浏览器存储或上传。

所有阈值集中在 `src/config/recognitionConfig.ts`，均为待真机调校的实验参数：置信度 0.6、低通 tau 60ms、最大样本间隔 200ms、最大帧年龄 300ms。位置/尺度检查仅检测相邻帧突变，缓慢换位或同位置换人需手动重做标定；这不等于身份识别或通用多人隔离。头脚边界检查仅依据指定关键点。2D 角度用于固定视角下的特征判断，不能作为医学量角或真实器械持握/重量证明。

## 测试

```powershell
npx playwright install chromium
npm run typecheck
npm run lint
npm run test:unit
npm run test:e2e
npm run build
```

`npm run verify`串行执行类型、lint、单测、E2E和构建；资源校验另用`assets:verify`。Playwright自动启动4173普通开发服务与4174专用测试模式，请保持两端口空闲。

E2E仅在`vite --mode e2e`且URL含`?e2e=1`时加速等待，仍需15次挥砍和15次装车。普通开发与生产构建忽略该URL开关，保持5/15/60秒。合成摄像头只验证推理与生命周期，不代表真人准确率。

T06 检查：

```powershell
npm run test:unit -- tests/unit/features.test.ts tests/unit/calibration.test.ts tests/unit/smoothing.test.ts tests/unit/calibrationSession.test.ts tests/unit/replayPoseSource.test.ts tests/unit/recognitionConfig.test.ts
npm run test:e2e -- tests/e2e/calibration.spec.ts
```

`tests/fixtures/poses.synthetic.json` 为人工编写的 33 点夹具，非真人采集、非模型输出。`ReplayPoseSource` 只在测试中按时间戳回放，不打包到正式摄像头入口。T06 浏览器测试使用合成视频和模拟 Worker，验证真实页面/标定逻辑的连接；它不能验证 MediaPipe 推理准确率。已有真实 MediaPipe 处理合成视频的测试仍保留，两类证据分开记录。

本轮生产检查：先 `npm run build` 并保持 `npm run preview -- --port 4175 --strictPort` 运行，另一终端执行 `node scripts/verify-t06-production.mjs`。检查实际dist的无摄像头标定禁用、模拟启动和暂停；保存截图及JSON到 `artifacts/qa/t06/`，不是完整生产整局或真机验收。

T05 相关检查：

```powershell
npm run test:unit -- tests/unit/actionAnimator.test.ts
npm run test:e2e -- tests/e2e/visual-states.spec.ts
npm run test:unit -- tests/unit/autoDemoSource.test.ts
npm run test:e2e -- tests/e2e/demo-toggle.spec.ts
```

视觉 E2E 使用普通构建、真实键盘动作源和 Playwright 受控时钟。重复动作按阶段重放；休息跳转时钟，Carry 保持相邻 100ms 采样；不是实时墙钟或真人验收。保存 15 张浏览器截图到 `artifacts/qa/t05/`。暂停截图做 SHA256 一致性检查；状态检查覆盖倒树、两段 NPC 过场、木材转移、松开停止、到家和重置。截图还需实际查看，不能只凭文件生成判断视觉效果。

正式时长构建验收（另开终端保持预览服务）：

```powershell
npm run preview -- --port 4175 --strictPort
# 另一终端：
$env:TIDAL_QA_DIR = 'artifacts/qa/t05'
node scripts/verify-production.mjs
```

此脚本实际等待正式时长，保存首页/结算截图和JSON报告到`TIDAL_QA_DIR`（默认`artifacts/qa/`）。需要实际设备诊断时可运行`node scripts/probe-real-camera.mjs`；只保存状态、设备名称和汇总指标，不保存画面或关键点。

验证自动模拟的生产整局：保持上述 4175 预览服务，在另一终端运行 `node scripts/verify-auto-demo.mjs`。默认保存到 `artifacts/qa/demo-toggle/`，也支持 `TIDAL_QA_DIR`、`TIDAL_PREVIEW_URL`；不使用加速时钟，仍是明确标记的脚本输入，不是真机运动验收。

## 模块与证据

| 模块 | 状态 |
|---|---|
| `src/config/demoConfig.ts`、`src/domain` | 沿用 T04 的时间/计数规则，原文件未改；唯一业务权威 |
| `src/config/recognitionConfig.ts` | T06 新增可配置实验阈值，不改变原游戏计划 |
| `src/input/keyboardActionSource.ts` | 原语义动作源原样保留 |
| `src/input/autoDemoSource.ts`、`src/ui/syntheticPreview.ts` | 可取消的自动语义动作 + 原创合成骨架；不调用识别器，不写业务状态 |
| `src/game/FarmScene.ts`、`ActionAnimator.ts`、`actors` | 只读快照/效果；阶段保持、去重、暂停、旧上下文隔离与重置；actor 由场景释放 |
| `src/game/assets.ts`、`public/assets` | 本地原创 SVG/代码美术，来源说明与 SHA256 清单；assets:verify 同时检查 |
| `src/pose/features.ts`、`smoothing.ts`、`calibration.ts`、`calibrationSession.ts` | 像素几何、按时间低通、站立基线、分步示例与失效清理；不发业务成果 |
| `src/pose` 既有摄像头/Worker、`src/ui/setupPanel.ts`、`calibrationPanel.ts` | 视频与本地推理、骨架、标定准备页、错误与生命周期清理 |
| `tests/helpers`、`tests/fixtures` | 来源明确的合成点和回放；只供测试 |
| `src/browser.ts` | 手动/自动源绑定、开关、暂停/epoch隔离、来源标注、重置和页面释放 |
| `src/game/drawFarm.ts`、`web/index.html`、`web/js`、旧Python E2E | 接手历史对照，不再是运行/测试入口 |

最新结果与文件清单：[PROGRESS](docs/PROGRESS.md)、[TEST_REPORT](docs/TEST_REPORT.md)。版本、模型SHA与许可：[DEPENDENCIES](docs/DEPENDENCIES.md)。原创美术来源：[assets/README](public/assets/README.md)。T05 实际截图：[农场](artifacts/qa/t05/01-home.png)、[协作](artifacts/qa/t05/06-rest-gather.png)、[拉车](artifacts/qa/t05/13-carry.png)、[结算](artifacts/qa/t05/15-results.png)。

T06 本轮验证：**98/98 单测、23/23 E2E、typecheck/lint/build/assets 校验通过**，生产准备页/模拟启动/暂停检查通过；保留全部旧逻辑与旧测试。[合成数据标定截图](artifacts/qa/t06/calibrated-synthetic.png)、[生产准备页](artifacts/qa/t06/production-calibration-waiting.png)、[生产检查报告](artifacts/qa/t06/production-smoke.json)。没有摄像头，真机仍 `manual_pending`；没有重跑正式墙钟生产整局或 npm ci/assets:sync。

此前 T05 开关功能验证：44/44单测、20/20 E2E、typecheck/lint/build/assets校验通过；生产自动整局实际142.927秒，15次挥砍/15次装车/60秒Carry、结算/重置通过。[生产运行截图](artifacts/qa/demo-toggle/production-running.png)、[模拟准备页](artifacts/qa/demo-toggle/production-setup.png)、[生产报告](artifacts/qa/demo-toggle/production-auto-flow.json)。这是历史模拟输入证据，物理摄像头仍 `manual_pending`；本轮结果见最新 PROGRESS。

A03数量（3棵×5次、已有12单位木材）、A04阶段同步、A06持姿代理、A07示例指标、A08预设计划、A09美术默认值均仍未确认。页面明确标记键盘输入/预设计划；心率和卡路里未接入，不伪造健康结果。不存在后端、账号、数据库、联机或LLM服务。

开发停在 T06。下一轮从 T07 砍树与装车识别器继续，消费标定汇总和明确来源的回放夹具；T08 做 Carry，T09 再接摄像头业务输入。有摄像头后补 T02/T06 真人证据。本地历史备份：开关改动前在 `.demo-toggle-baseline/`，T05 视觉改动前在 `.t04-baseline/`，更早交接在 `.handoff-baseline/`；这些目录不随 Git 分发。

首次克隆可运行 `git clone https://github.com/FaithZL/Tidal.git`，进入 `Tidal` 后执行上面的安装和启动命令。备份目录、`node_modules/`、`dist/`、Playwright临时结果与生成的Worker不入库；已记录的QA证据与本地模型/WASM入库，Worker由 `predev`/`build` 重建。
