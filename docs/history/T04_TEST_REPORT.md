# T01–T04 测试报告

日期：2026-10-15（Asia/Shanghai）。无Git代码版本；最终构建主文件`dist/assets/index-W_CbjmMk.js`，本轮完整源码差异在`artifacts/qa/source.diff`。

环境：Windows、Node24.14.0、npm11.9.0、Chromium156.0.8078.4；模型Pose Landmarker Lite float16/1，MediaPipe0.10.32 CPU classic Worker。没有使用用户录像、真人姿态夹具或真实健康指标。

| 验收范围 | 结果 | 证据/限制 |
|---|---|---|
| F01/F02 首页、预设计划、取消重开 | pass | boot E2E；Phaser实际canvas可见 |
| F03/F04/F05 计数、复位、倒计时 | pass | 原断言保留；错误任务/epoch/seq/过期时间/NaN负例；原13项增至26项 |
| F06/F07 休息、有效Carry | pass | 10秒有效+5秒放下+50秒有效精确为60秒；长间隔不补算；生产整局实际5/15/60秒 |
| F08/F09/F10/F11 奖励、重置、守恒 | pass | 两局逐快照库存守恒、奖励各一次；浏览器两轮重置；正式构建返回首页 |
| E01/E02/E04 摄像头异常 | pass（故障注入） | 权限拒绝、模型404、无设备/占用/NotSupported分别可读报错；无隐式键盘开始 |
| E03/E07 生命周期 | pass（已测部分） | 即时取消、迟到stream/bitmap、停止后帧、start/stop竞争；30秒超时与强制terminate分支尚未完整自动验证 |
| E06/E10/E11 暂停/错误输入/焦点 | pass（键盘范围） | 独立暂停原因、恢复epoch、重复按键、文本焦点、pointercancel、blur主动恢复、P与Esc |
| D01/D02/D03/D05 来源/时间 | pass（键盘范围） | 键盘标签、预设计划、有效/会话时长分开；健康测量未接入；混合来源属T09 |
| D04 本地处理 | pass（合成测试观察范围） | 推理/释放全程未捕获外部请求；未保存视频/关键点。不是对所有真机环境的证明 |
| D06 资源来源 | pass（本轮资源） | 同版JS/WASM、固定模型SHA、Apache/MIT许可证；无外部美术 |
| C01 真机骨架 | manual_pending | 实际无fake-device尝试返回Not supported；没有真人关键点证据 |
| C02–C08 完整运动识别 | not_run | T06–T09未开始；不把关键点链路算识别验收 |
| P01/P02/P03 真机性能/延迟 | manual_pending | 最终构建合成图像测得的11.6Hz、推理18/19ms不是60秒真机性能或端到端延迟 |
| V01–V06最终美术、音效、节奏 | manual_pending | 本轮仅几何占位；实际查看1366宽截图，未做最终视觉验收 |
| P04/P05离线/子路径 | not_run | 资源相对base实现；未声称断外网或公开部署验收 |

最终命令：`npm ci`、`assets:sync`、`assets:verify`、`typecheck`、`lint`、`test:unit`（26/26）、`test:e2e`（14/14）、`build`全部通过。`npm audit`0漏洞。完整日志`artifacts/qa/final-verify.log`。Vite主bundle大于500KB的警告保留；Phaser占主要体积，本轮未做体积优化。

生产整局报告`artifacts/qa/production-flow.json`：143.136秒，15次挥砍、15次装车、60.0秒Carry、15木材/100金币/100体力、重置pass，pageerror与外部请求均为空。该完整流程后增加了末帧墙钟钳位/非法阶段与P焦点回归；最终构建另由`final-build-smoke.json`记录实际首页/模型推理与关闭，仍无pageerror/外部请求。

截图：`production-home.png`、`production-results.png`由真实浏览器获得并已查看；`keyboard-results.png`属于明确加速的E2E。未对真实摄像头截图、录像或存储关键点。

本轮失败记录没有被删除：初始缺tsc，旧Canvas boot/测试开关负例，领域与输入回归，摄像头取消及NotSupported，P/Esc；预览进程占用导致npm ci首次EPERM，停止后成功。一次同时启动两个Playwright运行造成端口/测试临时文件竞争，已串行重跑最终套件。没有删负例来换通过。

当前交付：L1键盘概念版的自动与构建证据已具备；T02真人验收仍pending，不能称L2摄像头互动版或L3路演版。
