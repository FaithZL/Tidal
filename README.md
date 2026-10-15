# Tidal · 映动农场（T05 检查点 + 可开关自动模拟）

项目仓库：[FaithZL/Tidal](https://github.com/FaithZL/Tidal)，分支 `main`。2026-10-16 按用户授权建立 Git，首次提交范围为现有 T05 与自动模拟功能。进度/测试文档中的“无 Git/未 push”属于此前开发轮次的历史记录。本次不进行部署。

在现有 TypeScript 领域逻辑与键盘原型上增量实现的 Phaser Web Demo：

**首页计划 → 5秒倒计时 → 15次挥砍 → 15秒休息 → 5秒倒计时 → 15次装车 → 15秒休息 → 5秒倒计时 → 60秒有效拉车 → 结算 → 返回首页重置。**

**没有摄像头也能直接看效果：接受计划 → 打开“无摄像头测试” → 开始自动模拟演示。** 准备页显示运动中的合成骨架；开始后自动完成砍树、装车、拉车与结算，农场人物/NPC沿用 T05 表现。正式时长约两分半，可暂停。开关默认关闭，返回首页/重新开始后关闭；训练中切换会先暂停，关闭后点“继续”即可恢复手动键盘。

该骨架是原创脚本示意，不是摄像头画面或 MediaPipe 推理结果；准备页不计成果，结算明确记录是否使用自动模拟。模拟模式不请求摄像头或加载姿态模型，也不产生假推理指标。以后接上摄像头可关闭测试并点“开启摄像头诊断”；**真实动作控制还需要后续 T06–T09，硬件接上不会自动具备动作识别。**

游戏画面由 Phaser 3.90.0 绘制，沿用原 DOM/CSS 界面。T05 在现有场景上增加原创暖色矢量农场、分层农夫、杉树/树桩、木材、手推车、菜畦与农舍，以及机器人伙伴“禾禾”。七种动作阶段可以分别保持；击中、倒树、木材飞行和有效拉车都有对应表现。

第一段休息时角色/伙伴归拢现有木材、推车靠近；第二段整理场地并固定货物。禾禾是**预设协作 NPC**，不是真人联机。`SessionController`仍是计数、计时、库存和奖励的唯一权威。自动演示新增独立输入源，复用原键盘语义协议；领域、配置、手动输入与已有测试未改动。原 E2E 保留；外发检测使用严格 URL 来源比较，正确识别 Phaser 本地 SVG 的同源 `blob:` 地址。

这是 T05 统一视觉实现，最终美术方向、动作节奏和多尺寸路演验收仍待产品人工批准；系统任务符号和音效完善留到 T10。未进入 T06 标定或 T07–T09 动作识别。

已知视觉细节：键盘装车 `load-return` 到完整提交约 135ms，手持木材会先回地面再飞入车，衔接仍可打磨；库存与计数不受影响。当前布局验证针对默认计划，未承诺任意数量的树木布局。

摄像头提供独立的 MediaPipe 关键点诊断，加载本地模型/WASM，显示视频、骨架和推理指标。**本轮没有实现三种运动识别、标定或真实持握识别；摄像头诊断不会增加训练次数。** 用户确认本机没有摄像头，本轮未做真机尝试；此前 T04 返回 `Not supported`，真机骨架验收继续为 `manual_pending`。

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
| `src/config`、`src/domain` | 沿用 T04 的时间/计数规则；本轮文件哈希未变；唯一业务权威 |
| `src/input/keyboardActionSource.ts` | 原语义动作源原样保留 |
| `src/input/autoDemoSource.ts`、`src/ui/syntheticPreview.ts` | 可取消的自动语义动作 + 原创合成骨架；不调用识别器，不写业务状态 |
| `src/game/FarmScene.ts`、`ActionAnimator.ts`、`actors` | 只读快照/效果；阶段保持、去重、暂停、旧上下文隔离与重置；actor 由场景释放 |
| `src/game/assets.ts`、`public/assets` | 本地原创 SVG/代码美术，来源说明与 SHA256 清单；assets:verify 同时检查 |
| `src/pose`、`src/ui/setupPanel.ts` | 摄像头、单在途Worker、骨架、错误与取消清理 |
| `src/browser.ts` | 手动/自动源绑定、开关、暂停/epoch隔离、来源标注、重置和页面释放 |
| `src/game/drawFarm.ts`、`web/index.html`、`web/js`、旧Python E2E | 接手历史对照，不再是运行/测试入口 |

最新结果与文件清单：[PROGRESS](docs/PROGRESS.md)、[TEST_REPORT](docs/TEST_REPORT.md)。版本、模型SHA与许可：[DEPENDENCIES](docs/DEPENDENCIES.md)。原创美术来源：[assets/README](public/assets/README.md)。T05 实际截图：[农场](artifacts/qa/t05/01-home.png)、[协作](artifacts/qa/t05/06-rest-gather.png)、[拉车](artifacts/qa/t05/13-carry.png)、[结算](artifacts/qa/t05/15-results.png)。

本次开关功能验证：44/44单测、20/20 E2E、typecheck/lint/build/assets校验全部通过；生产自动整局实际142.927秒，15次挥砍/15次装车/60秒Carry、结算/重置通过。[生产运行截图](artifacts/qa/demo-toggle/production-running.png)、[模拟准备页](artifacts/qa/demo-toggle/production-setup.png)、[生产报告](artifacts/qa/demo-toggle/production-auto-flow.json)。这些是实际浏览器中的模拟输入证据，物理摄像头仍 `manual_pending`。

A03数量（3棵×5次、已有12单位木材）、A04阶段同步、A06持姿代理、A07示例指标、A08预设计划、A09美术默认值均仍未确认。页面明确标记键盘输入/预设计划；心率和卡路里未接入，不伪造健康结果。不存在后端、账号、数据库、联机或LLM服务。

下一轮从 T06 关键点特征、标定和回放夹具继续，有摄像头后补 T02 真人骨架证据；T07–T09 再接运动识别。开发停在 T05 加用户要求的模拟演示附加功能。本地历史备份：开关改动前在 `.demo-toggle-baseline/`，T05 视觉改动前在 `.t04-baseline/`，更早交接在 `.handoff-baseline/`；这些目录不随 Git 分发。

首次克隆可运行 `git clone https://github.com/FaithZL/Tidal.git`，进入 `Tidal` 后执行上面的安装和启动命令。备份目录、`node_modules/`、`dist/`、Playwright临时结果与生成的Worker不入库；已记录的QA证据与本地模型/WASM入库，Worker由 `predev`/`build` 重建。
