# Tidal 验收报告（T10/T11）

本表依据 `ACCEPTANCE.md` 逐项记录。**L1软件概念流程已有自动证据；L2摄像头互动和L3路演签字尚未通过。** 用户没有物理摄像头，不能用合成视频、人工关键点、HTTP成功或键盘演示替代真人准确率与彩排。

## 统一环境与证据口径

- 日期：2026-10-16（Asia/Shanghai）。分支 `feature/t07-t11-completion`，基线T06 `e8f129a`；T07 `98aaba9`、T08 `85df391`、T09 `872b34c`、T10 **`d4d086f`**均已push。最终应用代码与实际验证构建对应T10；T11仅整理文档及验收索引，没有再次修改应用。
- Windows 11 Pro 10.0.26300；Ryzen 9 7950X；系统列出AMD Graphics / RTX3070Ti（不推断浏览器实际采用哪块GPU）。Node24.14.0 / npm11.9.0 / Chromium156.0.8078.4。原始环境记录：`artifacts/qa/t10/environment.json`。
- Phaser3.90.0、MediaPipe0.10.32、TypeScript5.8.3、Vite8.3.4、Vitest5.0.4、Playwright1.64.1；依赖锁文件未变化。Lite float16 v1模型SHA：`59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a`。JS/WASM同一版本，CPU classic Worker，15Hz提交上限、最多1帧在途。
- 正式配置：5秒倒计时/15秒休息/15次Chop/15次Load/60秒有效Carry，3棵×5次、初始12单位木材。测试模式仅把等待缩到180ms/230ms/1300ms，仍15+15完整动作；普通开发及生产忽略URL加速参数。
- 标定/识别参数见 `src/config/recognitionConfig.ts`：置信度0.6、低通60ms、最大样本间隔200ms、年龄300ms；站立2秒、示例0.6秒、Carry示例2秒；阶段确认120ms、Chop0.4–6秒、Load0.8–10秒、Carry进入确认500ms、进入/退出距离0.35D/0.55D。均为实验值，真人未调校。
- 输入缩写：**K**真实键盘语义源；**A**明确标记的自动模拟；**S**人工33点夹具/测试Worker（不是MediaPipe输出）；**V**Chromium合成视频+实际本地MediaPipe推理；**R**真人物理摄像头（本轮没有）。单测使用受控时间；浏览器来源和是否加速另列。
- 表中证据相对仓库根目录；`U:name` = `tests/unit/name`，`B:name` = `tests/e2e/name`，`Q10:file` = `artifacts/qa/t10/file`，`Q09:file` = `artifacts/qa/t09/file`。测试文件给出可重复操作/断言，日志给出实际执行结果。上述版本/环境/参数对每一行共同适用。

## 本轮实际验证

49个验收ID共 **33 pass、1 fail、15 manual_pending**。失败项P01：无头SwiftShader环境约40fps，未达约60fps目标；不把达到候选30fps底线改写为目标通过。人工待办为C01–C08、V01–V04、P02/P03/P04，另有六个产品假设未签字。T11完成的是证据化交付，真人验收和L2/L3签字仍未完成。

最终`npm run verify`退出0：**155/155单测、35/35 E2E（7.4分钟）、类型/lint/build通过**。干净npm ci成功（先因旧Vite占用原生模块失败，定位并停止本项目服务后成功）；assets:sync/verify通过，锁文件未变。新增部署8项首次7通过/1资源监听失败，修复后全套通过；旧Carry测试轮询竞态修复后定向重复3次及最终全套均通过。完整日志`Q10:verify.log`，失败过程保留，未删除负例。

一次全新上下文全分支只读审查发现1个P2：Load准备缺少髋部位移门禁。先补两项失败测试，再共享准备/识别校验，相关32项及上述155项全套通过；正常标定另断言可直接用于CameraActionSource。没有未处理的软件审查项。见`Q10:review.md`、`calibration-review-red.log`、`calibration-review-green.log`。真机与人工批准仍不在审查通过范围内。

实际生产包`index-CFBWu24Q.js`在localhost:4175打开，正式墙钟整局142.983秒、结算/重置通过；全部非本地来源由浏览器路由阻断，0页面异常/外部请求/姿态资源请求。保存了实际准备、训练、结果截图；结算图已查看。`Q10:production-auto-flow.log/json`给出详细计时与帧间隔，`Q10:performance-probe.json`给出软件渲染对照。物理网络断开另列人工待办，不能用路由阻断代替现场彩排。

T09：149/149单测、26/26 E2E通过，追加第27项停帧过渡回归先失败再通过；最终type/lint/unit/build再次通过。T09生产冒烟打开`index-BMaraPft.js`，仅检查准备/模拟启动/暂停。日志及来源见`artifacts/qa/t09/`。

## 功能与领域规则

| ID | 输入与预期 | 实际与证据 | 判定 |
|---|---|---|---|
| F01 | K/A；计划来自同一配置，15/15/60，标预设 | 计划与界面从配置生成；普通构建不接受加速参数。U:config.test.mjs；B:boot.spec.ts | pass |
| F02 | K；取消不开始，可重开 | 首页取消/重开及零计数通过。B:boot.spec.ts | pass |
| F03 | 受控时钟4999/5000ms；只进入一次Chop | 边界与不完整循环门禁通过。U:session.test.mjs | pass |
| F04 | K/S；15完整Chop，5/10/15倒树，无额外计数 | 复位才提交、impact不重复、旧rep/16次被忽略。U:chopRecognizer.test.ts、session.test.mjs；B:source-lifecycle.spec.ts；Q09:camera-flow.json | pass |
| F05 | K/S；15复合Load，单蹲/单举不算 | 连续站起上举可用，短暂一帧/未复位被拒绝，15单位上车。U:loadRecognizer.test.ts；B:source-lifecycle.spec.ts | pass |
| F06 | 受控时钟/K/A；两段15秒休息+5秒倒计时，Carry直结算 | 领域与浏览器过渡通过；正常生产墙钟另记。U:session.test.mjs；B:keyboard-flow.spec.ts、visual-states.spec.ts | pass |
| F07 | S；有效10秒+放下5秒+有效50秒=60秒 | 精确累计60秒，不倒填500ms进入确认，5/10/15/30Hz一致。U:carryTiming.test.ts | pass |
| F08 | K/A/S；15到家、车库存0、loadReps15、100/100/T恤 | 原权威结算和来源标注通过，合成整局库存0/0/15。B:keyboard-flow.spec.ts、source-lifecycle.spec.ts；Q09:synthetic-camera-results.png | pass |
| F09 | 重复完成/回调；奖励一次 | 奖励一次性与Carry上限钳位通过；固定T恤展示不发第二次资源。U:session.test.mjs、carryTiming.test.ts | pass |
| F10 | K双局、S结束/重置；旧局不污染新局 | 新session、清零、场景恢复、track/Worker结束。B:keyboard-flow.spec.ts、source-lifecycle.spec.ts；U:sourceManager.test.ts | pass |
| F11 | K/S；每次变更库存守恒 | 砍树/装车/到家与NPC视觉不直接改库存。U:session.test.mjs、actionAnimator.test.ts；B:keyboard-flow.spec.ts | pass |

## 摄像头与动作验证

| ID | 输入与预期 | 实际与证据 | 判定 |
|---|---|---|---|
| C01 | R；肩腕髋膝与真实骨架对应 | 仅V证明实际本地模型可推理，S证明UI连接。B:camera-errors.spec.ts、deployment.spec.ts。没有真人骨架证据 | manual_pending |
| C02 | R；标定有效才可训练，裁切/低置信度拒绝 | S完成9步、门禁与失效清除通过；真人站位/幅度可用性未测。B:calibration.spec.ts、source-lifecycle.spec.ts；U:features/calibrationSession测试 | manual_pending |
| C03 | R；20Chop+20负例，建议≥19正例、≤1误计 | S正反例通过；没有指定演示者逐次记录。U:chopRecognizer.test.ts。不能换算真人准确率 | manual_pending |
| C04 | R；20复合Load+20负例，同上 | S完整循环/单蹲/单举/短暂举手/半次负例通过；没有真人抽样。U:loadRecognizer.test.ts | manual_pending |
| C05 | R；持姿放下恢复≥5次，≤300ms非有效反馈 | S放下立即退出、间断不补算；真人可分性与UI延迟未测。U:carryRecognizer/carryTiming测试 | manual_pending |
| C06 | R；相同姿态拒绝Carry | S不可分示例拒绝，标定与识别器共用门限；真人/器械条件未测。U:calibrationSession/carryRecognizer测试 | manual_pending |
| C07 | R；完整一局，每项停顿可恢复 | S整局通过且结算释放，K/A完整流程通过；真人整局未运行。Q09:camera-flow.json | manual_pending |
| C08 | R；离镜/明显换位不拼接旧动作 | S突变、低置信度和断档失效通过。缓慢换位/同位置换人不能可靠识别，需手动重标，未承诺身份识别。U:smoothing/calibrationSession测试 | manual_pending |

## 异常、恢复与生命周期

| ID | 输入与预期 | 实际与证据 | 判定 |
|---|---|---|---|
| E01 | 注入权限拒绝；显式报错、可重试/键盘 | 不会自动切模拟或启动训练。B:camera-errors.spec.ts | pass |
| E02 | V资源404/隔离版本错配；报错、关闭捕获 | 子路径模型/WASM404明确失败；0.10.31清单对0.10.32包被assets:verify拒绝。B:deployment.spec.ts；Q10:version-mismatch.log | pass |
| E03 | 延迟初始化、迟到Promise、超时；清资源 | Worker30秒初始化/10秒帧超时、300ms终止兜底通过；取消后迟到视频与bitmap释放。U:cameraService/poseWorkerClient/poseWorkerLifecycle测试；B:demo-toggle.spec.ts | pass |
| E04 | 注入设备缺失/占用/不支持/推理失败 | 分别显示错误，键盘入口显式；固定CPU，无静默GPU降级。B:camera-errors.spec.ts | pass |
| E05 | S；低置信度/乱序/过期/断档不计成果 | 取消半次、停计持姿、要求重新准备；无帧也检查阶段门禁。U:features/smoothing/识别器测试；B:source-lifecycle.spec.ts | pass |
| E06 | K/A/S；用户/后台/跟踪暂停独立，不补算 | 领域与摄像头集成通过；旧A测试退避轮询竞态已用首样本同步修复，定向重复3次及完整回归通过，全部暂停/停源断言保留。Q10:carry-polling-race.json、carry-polling-green.log、verify.log | pass |
| E07 | 旧session/run/epoch、迟到回调；丢弃 | SourceManager代次隔离、Worker/bitmap迟到与新局旧事件通过。U:sourceManager/cameraActionSource/poseWorkerClient测试；B:keyboard-flow.spec.ts | pass |
| E08 | V/S十轮启停退出重置；无持续资源叠加 | 定位并修复ended轨道监听未移除；track全ended、Worker0/峰值1、interval稳定1、timeout0、轨道监听0、总监听90。Q10:ten-cycle-resources.json；物理指示灯待设备复核 | pass |
| E09 | S→K/A；停旧源、保成果、清半次、混合标识 | 按钮显式切换且暂停，不静默降级；结果保留混合模拟来源。B:source-lifecycle.spec.ts；U:sourceManager.test.ts | pass |
| E10 | 重复seq/rep、NaN/负值/旧时间/超长gap | 所有无效输入不多记、不破坏库存；诊断保留原因。U:session/features/recognizer/carryTiming测试 | pass |
| E11 | K；自动重复、失焦、pointercancel、表单焦点 | 不刷次数、不永久持姿，按钮/表单不误触发。B:keyboard-flow.spec.ts；U:input.test.mjs | pass |
| E12 | S；休息离镜/停帧，下一项须重新就绪 | 休息到0仍等待；就绪后完整倒计时；修复先进入active再暂停的瞬态。U:cameraReadiness.test.ts；Q09:stalled-rest-red.log、stalled-rest-green.log | pass |

## 视觉与声音

| ID | 输入与预期 | 实际与证据 | 判定 |
|---|---|---|---|
| V01 | K/A/R；统一且可辨认农场视觉 | 原创矢量场景/角色/NPC可见，已实际查看三尺寸截图；最终产品美术批准未取得。Q10:desktop-*.png；历史Q05视觉序列 | manual_pending |
| V02 | K/S/R；阶段对应、暂停保持 | 七阶段与暂停帧哈希通过；真人同步和A04接受未签字。B:visual-states.spec.ts；U:actionAnimator.test.ts | manual_pending |
| V03 | K/A；两段NPC协作可重复且不造资源 | 归拢/固定货物脚本与库存回归通过，明确预设NPC；人工节奏批准待补。B:visual-states.spec.ts | manual_pending |
| V04 | K/A；受击/倒树/入车/到家反馈一致 | 效果去重、只读领域与整局截图通过；产品人工观感仍待批准。B:visual-states.spec.ts；U:actionAnimator.test.ts | manual_pending |
| V05 | A；1280×720/1366×768/1920×1080控件可达、比例正确 | 首次1280按钮超屏失败，紧凑布局后3尺寸整局/暂停/结果返回通过，已查看截图。长准备页可在模态内滚动。B:deployment.spec.ts；Q10:desktop-*.png | pass |
| V06 | 用户点击；默认静音、可开关、失败不破坏流程 | 4单测和真实WebAudio浏览器控制通过；短节点结束/静音释放。实际扬声器听感待现场确认。U:audioFeedback.test.ts；B:deployment.spec.ts | pass |

## 数据、来源与隐私

| ID | 输入与预期 | 实际与证据 | 判定 |
|---|---|---|---|
| D01 | 页面检查；未测心率/卡路里不冒作实测 | 明确未接入，原500卡仅在说明中标示意；无随机健康数据。index.html；B:keyboard-flow.spec.ts | pass |
| D02 | K/A/S；有效时间与会话时间分开 | 控制器分开累计；66天仅原方案示意，不填本局连续记录。U:session.test.mjs；Q09:synthetic-camera-results.png | pass |
| D03 | 首页；不伪装AI规划 | 明确预设概念计划，无LLM请求或接口。index.html；B:boot.spec.ts | pass |
| D04 | V/A；仅视频、本机处理、不上传/默认保存 | CameraService固定audio:false；网络观察/子路径阻断外源无外发，真实关键点没有存储入口。B:camera-errors/deployment测试；Q10:subpath.json | pass |
| D05 | K/A/混合；常驻标签，来源不能洗白 | SourceManager历史集合+demoUsed在结算保留来源，重置才清；S→A完整混合测试通过。B:source-lifecycle.spec.ts | pass |
| D06 | 资源；来源/许可可查 | 本地锁定模型/JS/WASM与许可副本，原创SVG/代码角色/正弦反馈音，无第三方音乐或参考截图角色复用。DEPENDENCIES/SOURCES/public/assets/README；Q10:assets-verify.log | pass |

## 性能与交付

| ID | 输入与预期 | 实际与证据 | 判定 |
|---|---|---|---|
| P01 | A稳态预热后≥60秒；约60fps目标、候选底线30fps | 预热10秒后132.211秒/5296样本：40.06fps，p50 16.8ms/p95 33.4ms/max50.1ms，>50ms一次。达到候选底线，未达约60fps。额外10秒对照空白60.00/农场39.54fps，实际SwiftShader软件渲染；硬件GPU待复测，不据候选值改判。Q10:production-auto-flow.json、performance-probe.json | fail |
| P02 | R；≥10–15Hz、单帧在途、报告年龄 | 单帧在途协议单测/V推理通过，面板显示耗时/年龄；实际真人性能未测。U:poseWorkerClient.test.ts | manual_pending |
| P03 | R；阶段可见反馈p95≤250ms | 未采集真人端到端画面证据，推理耗时/游戏rAF不能替代 | manual_pending |
| P04 | 依赖已安装，外网断开后刷新整局 | 子路径V外源路由阻断通过；正式墙钟A整局142.983秒，生产5/15/60配置，外源全部阻断后结算/重置通过，0页面异常/外源/姿态请求。物理断网彩排尚无证据。Q10:subpath.json、production-auto-flow.json | manual_pending |
| P05 | V；实际构建部署到子路径，资源不404 | `/tidal/`实际构建、模型/JS/WASM/SVG均同源前缀，真实MediaPipe处理合成视频通过。Vite已正确重写HTML静态资源，无需猜测性改路径。Q10:subpath.json | pass |
| P06 | 干净安装→资源→类型/lint/unit/E2E/build→实际dist | npm ci、sync/verify、155单测、35 E2E、type/lint/build均通过；实际dist整局/重置通过。包index-CFBWu24Q.js，1,274.60KB/gzip345.59KB，保留500KB体积警告。Q10:npm-ci.log、assets-sync.log、assets-verify.log、verify.log、production-auto-flow.json | pass |

## 尚需用户设备与产品确认

当前没有把任何真人项标pass，也没有代签产品批准。设备到位后按 `DEMO_RUNBOOK.md`：记录浏览器/机位/光照/全身范围；检查真人骨架与9步标定；20次Chop+20负例、20次Load+20负例逐次记录；持姿放下恢复至少5次；完整一局和重置释放；真实推理性能/端到端延迟；现场断外网刷新与扬声器听感。默认不录视频、不导出真实轨迹。

| 假设 | 当前处理 | 产品确认 |
|---|---|---|
| A03 数量冲突 | 可配置3棵×5次，新增12单位已有木材保证15份装车 | manual_pending |
| A04 完全同步 | 采用有明确说明的动作阶段同步；非逐关节复制 | manual_pending |
| A06 持握 | 使用可区分持姿代理，不证明重量/持物；同姿态空手不可辨 | manual_pending |
| A07 示例指标 | 游戏结果与原方案健康示意分开，未测量不伪造 | manual_pending |
| A08 AI计划 | 明确标注预设计划，无LLM服务 | manual_pending |
| A09 美术 | 原创统一2D农场，最终美术与节奏由用户批准 | manual_pending |

L1仅覆盖已验证键盘/模拟与软件规则；L2/L3仍为manual_pending。完成T11文档与审查不等于真人验收签字。未推送主分支、未合并、未部署公网。

T11文档核对：49个ID与`ACCEPTANCE.md`一一对应，无遗漏/重复；判定集合合法、明确引用的日志/截图存在。记录见`artifacts/qa/t11/report-audit.json`。本轮没有新增应用代码，复用同一T10提交的完整软件回归证据；没有伪称另跑一轮测试。
