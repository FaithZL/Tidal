# Tidal · 映动农场

在现有源码上增量实现的真3D农场运动Web Demo：Three.js0.186.1 + TypeScript + 本地MediaPipe。仓库：[FaithZL/Tidal](https://github.com/FaithZL/Tidal)，当前分支`feature/3d-farm-experience`。用户已批准真3D设计及验证后提交/push；不合并主分支、不对外部署。旧Phaser3.90.0源码和依赖保留追溯，当前入口只运行Three.js。

**首次打开或刷新即可看效果：无摄像头模拟默认开启，自动进入正常倒计时和完整农场流程。** 合成骨架和农场自动运行，正式时长约两分半。开关保留，关闭后暂停自动输入，并记住选择；再次刷新会留在手动首页。重新开启后刷新可恢复自动演示。重置/结算返回首页保留开关偏好，但不会自动再开一局。模拟不请求摄像头、不调用识别器、不参与标定，结算始终保留模拟来源。

偏好仅在当前浏览器同源localStorage保存一个布尔值（`tidal.demo.enabled`），不保存进度、视频或姿态；刷新建立新会话。浏览器禁用存储时仍可演示和关闭，但无法跨刷新记住关闭选择。音效仍默认静音，不自动请求摄像头权限。

流程：计划 → 5秒倒计时 → 15次挥砍 → 15秒休息 → 5秒倒计时 → 15次装车 → 15秒休息 → 5秒倒计时 → 60秒有效持姿 → 结算 → 重置。所有计数、库存和奖励均由 SessionController 管理。NPC“禾禾”为预设协作，不是真人联机。

T06 特征/标定、T07 砍树/装车识别、T08 持姿代理、T09 摄像头输入接线已实现。当前使用人工编写的关键点回放和浏览器合成视频验证软件路径；**没有物理摄像头，真人准确率、标定可用性和完整真人流程仍为 manual_pending。** 接上摄像头后须先标定，再手动选择摄像头训练；不会静默切换模拟。持姿代理不能证明器械重量或真实持握。

当前首页展示完整原创3D农场与紧凑计划通知；拖拽旋转、滚轮缩放、按钮恢复全景。训练时右下PiP展示同一摄像头视频/骨架或明确标注的合成骨架，以及动作阶段和训练处方。人物推车、每树5段、从手部抛木、NPC绑绳，Carry按有效时间连续前进40世界单位（示意距离，非实测米数）。结果等宽展示运动数据与游戏奖励。音效默认关闭，可点击启用/静音。

操作步骤见[路演手册](docs/DEMO_RUNBOOK.md)，当前逐项证据和人工待办见[验收报告](docs/TEST_REPORT.md)。旧2D的155单测/35E2E及40.06fps记录已归档到[历史报告](docs/history/T11_2D_TEST_REPORT.md)，不作为当前3D性能或真机证据。

上一轮真3D验证（`03e249a`）：170/170单测、42/42浏览器E2E、typecheck/lint/build、干净安装与资源校验通过。正式整局142.219秒；SwiftShader软件渲染预热后平均39.59fps/p95 33.4ms，**约60fps目标未达**，硬件GPU未测。49验收ID为33通过/1失败/15人工待验；这些整局性能数值属于当时构建，不冒作本轮默认启动性能。

本轮默认启动验证：**170/170单测、47/47浏览器E2E（6.2分钟）、typecheck/lint/build/assets校验通过**。正式`dist`首次启动/刷新/关闭记忆/摄像头错误后不切模拟/重新开启冒烟通过（18.339秒、0页面异常/外源/姿态资源请求），未重复做完整生产整局或性能基准。主包`index-DNN17GvQ.js`675.90KB/gzip177.91KB，体积提示保留。日志和截图见`artifacts/qa/default-demo/`。

本轮为T11之后用户追加的真3D体验升级，保留原领域逻辑、识别器与有效负例测试。L2/L3真机与最终美术签字仍未通过。获得摄像头后按手册复测，保留模拟开关并显式切换输入，无需重写领域逻辑。

## 安装与启动

实际环境：Windows、Node 24.14.0、npm 11.9.0。重新安装前停止本项目 Vite 服务，避免原生模块被占用。

```powershell
git clone https://github.com/FaithZL/Tidal.git
cd Tidal
git switch feature/3d-farm-experience
npm ci
npm run assets:sync
npm run assets:verify
npm run dev
```

开发默认地址为 `http://127.0.0.1:5173/`。`predev` 重建本地 classic Worker；模型、WASM、素材均在本地，模型缺失时 `assets:sync` 才从固定地址下载并校验 SHA-256。JS/WASM 同为锁定 MediaPipe 0.10.32。

```powershell
npm run build
npm run preview -- --port 4175 --strictPort
```

访问 `http://127.0.0.1:4175/` 查看实际 `dist/`。摄像头需 localhost 或 HTTPS，不能双击 HTML；预览服务不是公网部署。

## 操作与摄像头恢复

- 键盘：Space 或动作按钮触发完整挥砍/装车循环，复位才计次；Carry 长按 Space/按钮，松开停止。
- 镜头：拖拽场景旋转、滚轮缩放；顶部场景按钮左右旋转/恢复全景。镜头操作不增加运动成果，暂停时停止自动跟随。
- P 或暂停按钮暂停/继续；切后台后必须主动继续，不补算离开时间。Esc 退出确认，取消保留成果，确认重置。
- 摄像头：关闭“无摄像头测试” → 重新开始 → 接受计划 → 开启摄像头诊断 → 允许视频 → 完成下方九步标定 → 手动点击摄像头训练。选择摄像头会记住关闭模拟；失败或刷新后也不会自动切回模拟或自动申请视频权限。准备页和仅诊断时不计成果；摄像头训练时Space不产生运动成果。
- 丢跟踪、采样超时、关键点低置信度或机位明显跳变会清除当前半次动作并要求重新准备。用户暂停和后台暂停独立保留，不能靠标定成功自动解除。
- 休息时可以离开镜头，正常休息会结束；下一项须重新就绪才开始完整倒计时。
- 摄像头失败可重试，或明确点击“关闭摄像头并切换键盘”。切源保留已提交成果、清除半次动作，暂停后点击继续；结算记录混合来源。
- 重置、返回首页、结算和页面释放会停止摄像头与 Worker。只请求视频，本机内存处理，不录音、不录像、不上传或默认保存真实关键点。
- 图形无法启动或上下文丢失时，显示错误并锁定恢复/动作入口，需重新加载；不会继续隐形训练。

## 标定与识别范围

单人、固定机位、全身与举手范围入镜。主手按本人左右选择，镜像预览不交换解剖左右。

1. 自然站立稳定 2 秒。
2. 挥砍上肩、下方；装车蹲下、站起、举手、复位，各示范 0.6 秒。
3. Carry 持姿、放下各 2 秒。姿态差异不足则拒绝自动 Carry。

标定汇总只存本次内存；停止、后台、换主手、无效关键点或明显位置/尺度跳变会清除，需重做。位置检查只检测相邻帧突变；缓慢换位或同位置换人需主动重新标定，不具备身份识别能力。所有参数在 `src/config/recognitionConfig.ts`，均为待真机调校的实验值。识别器按完整复位提交一次，impact 只驱动表现；Carry 需 500ms 确认，确认时间不倒填，只累计相邻有效样本。

游戏使用阶段同步。A03数量已按用户批准设计改为初始0、3树各5段，共15；真3D方向已批准，最终美术/动作节奏、A04阶段同步、A06持姿代理、A07示例指标、A08预设计划的产品接受仍待确认。心率/卡路里未测量，不伪造健康结果；没有后端、账号、数据库、联机、物理引擎或LLM服务。“壶铃摇摆5×3”仅是用户给出的处方格式示例，本轮未新增摇摆识别算法。

## 测试与证据

```powershell
npx playwright install chromium
npm run typecheck
npm run lint
npm run test:unit
npm run test:e2e
npm run build
```

`npm run verify` 串行执行类型/lint/unit/E2E/build，资源校验另用 `assets:verify`。Playwright 使用 4173/4174 端口。只有专用 `vite --mode e2e` 加 `?e2e=1` 才加速等待，普通开发/生产忽略该参数。

原键盘/摄像头E2E通过真实偏好显式选择手动入口；`default-demo.spec.ts`使用全新浏览器默认值，覆盖自动开局/刷新、持久化关与重新开、摄像头失败后的退出模拟、存储受限和图形失败不隐形运行。没有生产代码里的测试专用默认值绕过。

```powershell
npm run test:unit -- tests/unit/chopRecognizer.test.ts tests/unit/loadRecognizer.test.ts tests/unit/carryRecognizer.test.ts tests/unit/carryTiming.test.ts
npm run test:e2e -- tests/e2e/source-lifecycle.spec.ts
```

`tests/fixtures/poses.synthetic.json` 是人工编写的33点夹具，不是真人采集或模型输出。`source-lifecycle` 使用合成视频和测试 Worker 驱动真实标定、识别器及控制器；已有 MediaPipe 实际处理合成视频的测试另行保留。两者均不能证明真人精度。

正式时长自动整局验证：保持4175预览服务，在另一终端执行 `node scripts/verify-auto-demo.mjs`；默认输出 `artifacts/qa/demo-toggle/`，可用 `TIDAL_QA_DIR` 与 `TIDAL_PREVIEW_URL` 改路径。使用真实墙钟，仍为明确模拟输入。

本轮生产验证设置`$env:TIDAL_BLOCK_EXTERNAL='1'`、`$env:TIDAL_QA_DIR='artifacts/qa/3d'`后执行该脚本：浏览器阻断非本地来源，完成正式时长流程，预热10秒后记录至少60秒rAF帧间隔和实际WebGL GPU。该方法不等于物理断网，也不测真人动作端到端延迟。

最新实际命令、结果、截图及待办见 [PROGRESS](docs/PROGRESS.md)、[TEST_REPORT](docs/TEST_REPORT.md)。依赖与许可见 [DEPENDENCIES](docs/DEPENDENCIES.md)、[SOURCES](docs/SOURCES.md)、[原创素材](public/assets/README.md)。旧轮次证据保留在 `artifacts/qa/`，不能代替最新复测或真机验收。

## 主要模块

| 模块 | 职责 |
|---|---|
| `src/domain`、`src/config/demoConfig.ts` | 唯一业务权威；原库存与计时规则保留，增加摄像头准备门禁 |
| `src/input` | 键盘、显式自动模拟、摄像头适配，来源切换与旧回调隔离 |
| `src/pose` | 本地视频/Worker、特征、平滑、标定和三类识别器；不写业务结果 |
| `src/game/world`、`createGame.ts` | Three真实网格、人物/NPC、木材编排、Orbit相机与释放；只读快照/事件；旧Phaser源码保留 |
| `src/ui`、`src/browser.ts` | DOM、诊断、准备、输入装配、暂停及释放 |
| `tests/helpers`、`tests/fixtures` | 明确来源的测试专用合成数据，不进入生产摄像头入口 |

`node_modules/`、`dist/`、Worker构建产物和临时测试目录不入库；模型/WASM与已记录QA证据入库。原T01–T11软件交付后，本轮只增量完成已批准真3D范围；硬件与产品签字继续manual_pending，不自动合并或部署。
