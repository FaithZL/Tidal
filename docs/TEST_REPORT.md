# Tidal 真3D升级验收报告（2026-10-21）

## 当前增量：温暖卡通3D美术精修

基线`d60e59e`，按用户批准范围增量精修圆润人物与衣物、树皮/木纹/年轮、车板/绳结、屋瓦/田垄/作物/道路及接触明暗。`world/resources.ts`与新增`surfaces.ts`共享本地原创128×128纹理和圆角几何，草地主面用确定性顶点颜色减少采样；环境保留原农场内容、实例化与空间合批，当前138绘制对象/1169部件/40,624三角形。原领域、编排、输入、识别器、依赖和渲染比例策略均未改，默认模拟、刷新偏好与显式摄像头切换保留。

`N:file`指仓库根`artifacts/qa/art-polish/file`。本轮完整`npm run verify`退出0：**208/208单测、49/49 E2E（6.3分钟）、typecheck/lint/build通过**，见`N:verify-final.log`。新增美术材质共享/释放、圆角尺寸、手部锚点、接触阴影、道路平铺、场景内容与预算断言；旧动作、暂停、库存和摄像头负例保留。该完整回归对应草捆贴图语义修正前的`index-DEI107uw.js`，693.53KB/gzip183.83KB，保留500KB体积提示；本轮未改锁文件或重复安装。

同一Chromium156、1366×900、DPR1、实际SwiftShader软件渲染、正常默认自动模拟，预热10秒后独立采样**3500样本/60.0142秒，58.32fps、p50 16.7ms/p95 16.8ms/max66.6ms、>50ms 1次**；0页面异常/外源，见`N:final-profile.json/log`。实际3D比例0.8→0.5，结束683×450绘制后铺满1366×900；有清晰度代价，不声称锁60或相同分辨率成绩。此数据同样在草捆修正前取得；前轮59.74fps属于旧美术。首页/近景静态截图`N:final-home.png`、`final-hero.png`与动态性能分别记录。

随后仅将金黄草捆由端面年轮改为已有纵向纹理，无新增纹理、几何或逻辑；最终`index-CYPYbaQo.js`为693.52KB/gzip183.83KB。修正后typecheck/lint、**208单测、1项完整视觉E2E**、build与assets:verify通过，见`N:material-final.log`；49项完整E2E属于修正前DEI版，没有声称修正后重新全跑。最终生产静态截图`N:delivered-home.png`、`delivered-hero.png`与`delivered-capture.json`为比例1、1366×900、无摄像头/0异常/0外源；`N:replay/visual-replay.json`及15张图覆盖七阶段，使用浏览器控制时钟，不作fps证据。

最终CYPYbaQo构建的正常生产整局实际**142.227秒**完成15次挥砍/15次装车/60秒有效持姿、到家15、奖励100/100与重置，0页面异常/外源/姿态资源请求，见`N:production-auto-flow.json/log`。预热后**131.6948秒/7338样本，55.72fps、p50 16.7ms/p95 33.3ms/max33.5ms、>50ms 0**；运送截图时比例0.512、699×460铺满1366×900。四张正式截图实际生成，训练/运送/结算均已查看，文字和PiP可读，3D边缘软化可见。它与草捆修正前独立60秒58.32fps的采样范围/比例不同，分别报告；不拿较高值代替最终整局。

再做唯一远景去纹理短诊断：首休息相同8秒观察58.13fps/比例0.5→57.88fps/比例0.512（`N:forest-{before,after}-profile.json/log`），未显示明确收益，分辨率不同也不推断因果；候选已恢复，`N:restored-build.log`重新构建并核对最终bundle仍精确为CYPYbaQo。候选、失败与中断日志保留，不回写为通过。

当前49ID：**33 pass、1 fail（P01）、15 manual_pending**。新版整局55.72fps尚未稳定达到约60fps目标，P01保守记fail，不降目标或拿前轮数据补齐。物理摄像头、硬件GPU、真人端到端性能、最终美术与动作节奏批准仍为`manual_pending`，L2/L3未通过。下方`P`与`Q`证据均为历史；本轮全套生成的DEI版三尺寸/合成PiP/资源证据另存`N:full-suite/`，最终材质版动作在`N:replay/`，不覆盖历史。

## 历史增量：流畅度与约60fps复测

基线`5f5579f`，保持既有领域/识别器/默认模拟/刷新记忆和显式摄像头切换。静态环境476→138可绘制网格（保留36,176三角形/1,031部件），同值DOM不重复写，3D像素比按持续绘制帧耗时自动降低，最低0.5；文字和摄像头视频不降分辨率。相关数量/变换/裁剪、HUD零无效修改、短动作/尖峰/暂停/漏刷新均有实际RED→GREEN证据。最终`npm run verify`退出0：**183/183单测、49/49 E2E（6.1分钟）、typecheck/lint/build通过**；`assets:verify`通过，主包`index-w4yGvhR9.js`678.15KB/gzip178.65KB，保留体积提示。未改依赖或锁文件，本轮未重新安装。一次独立只读审查无剩余问题，处理与范围见`artifacts/qa/performance/review.md`。

`P:file`指`artifacts/qa/performance/file`：同一Chromium156、1366×900、DPR1、实际SwiftShader，正常生产时长，预热10秒后独立60秒采样，原始**40.47fps/p95 33.4ms**→最终**59.74fps/p95 16.7ms**，3585样本/60.0143秒、max33.4ms、>50ms 0。实际3D比例1→0.64→0.512，结束699×460绘制后铺满1366×900视口；**有清晰度代价，不能宣称相同分辨率达到60fps**。全文方法、失败候选与计数器口径见`P:README.md`；原始JSON未回写。

正常`dist`整局另实测**141.930秒**，15次挥砍/15次装车/60秒持姿、到家15、奖励100/100、返回首页重置通过，0页面异常/外源/姿态资源请求。预热后131.3447秒/7701样本平均**58.63fps/p95 16.8ms/max33.5ms/>50ms 0**，与60秒对照分别报告；见`P:production-auto-flow.json/log`。四张生产截图真实生成，训练/运送/结果已查看，文字与PiP可读，3D边缘软化可见。浏览器阻断外源不是物理断网，合成骨架不是真人证据。

该轮49ID：**34 pass、0 fail、15 manual_pending**。P01在本机软件GL/自适应画质条件下接近60fps目标，不声称锁60；硬件GPU、现场窗口实际表现、摄像头准确率/端到端性能和最终画质批准仍待验。L2/L3没有通过；本段数字为旧美术历史，最新范围见顶部及P01/P06。

## 历史增量：默认模拟启动

用户已明确授权默认开启模拟，首次打开/刷新自动演示，保留开关和真实摄像头入口。本轮基线`f32f973`；新增五项默认/刷新/偏好/摄像头失败/存储受限/图形门禁用例，原键盘/摄像头负例通过真实偏好显式选择手动入口。前4项RED后实现转绿，相关16E2E及单独图形门禁1项通过；最终`npm run verify`退出0：**170/170单测、47/47 E2E（6.2分钟）、typecheck/lint/build通过**，资源校验通过。当前主包`index-DNN17GvQ.js`675.90KB/gzip177.91KB。证据`artifacts/qa/default-demo/{red,green,renderer-guard,verify,assets-verify}.log`；独立一次审查0发现，见同目录review.md。

`node artifacts/qa/default-demo/production-smoke.mjs`在实际4175生产预览通过，18.339秒完成普通时长默认启动/刷新重播、关闭记忆、注入摄像头缺失后保持手动且不再申请设备、重新开启刷新恢复；0页面异常/外源/姿态资源请求。普通构建忽略URL加速，目标仍60秒；未重复生产完整整局/性能基准。该错误分支为明确注入NotFoundError，不是真机。生产JSON/日志与三张截图均实际产生，本轮没有依赖变更或重新安装。

重置保留偏好、不循环开局；只存本地开关，不存视频/姿态/训练进度。摄像头仍需手动申请视频、标定并显式开始；其错误不会开启模拟。本历史段的整局与性能证据属于`03e249a`；下方功能ID保留原证据并经本轮全套回归复测，P01/P04/P06另更新为最新性能记录。历史数据不代替顶部最新增量或真人验收。

本轮为用户批准的T11之后体验升级，分支`feature/3d-farm-experience`，应用基线`30e36e3`，最终应用修复`03e249a`。继续原领域/输入/标定/识别器及负例测试，当前入口改用真实Three.js网格与Orbit相机。L1软件概念流程已有自动证据；**L2真实摄像头与L3产品签字没有通过**。旧2D报告原样存于`history/T11_2D_TEST_REPORT.md`，不沿用其40.06fps作为本轮性能。

## 环境与证据口径

- Windows11 Pro10.0.26300、Ryzen9 7950X、Node24.14.0/npm11.9.0、Chromium156.0.8078.4；系统列出显卡不代表浏览器实际采用。原始环境`Q:environment.json`；实际WebGL GPU随生产报告记录。没有物理摄像头。
- Three0.186.1/@types0.186.0精确锁定；Phaser3.90.0保留旧源码依赖，当前入口不运行。MediaPipe0.10.32、TypeScript5.8.3、Vite8.3.4、Vitest5.0.4、Playwright1.64.1。模型Lite float16 v1 SHA256 `59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a`，CPU classic Worker、15Hz提交上限/单帧在途。
- 正式配置：5秒准备/15秒休息/15次挥砍/15次复合装车/60秒有效持姿，3棵各5段，初始0，运送路线40世界单位（示意距离，非实测米数）。专用e2e模式只缩等待为180/230/1300ms，保留15+15完整循环；普通构建忽略加速URL。
- 原实验识别参数不变：置信度0.6、低通60ms、样本间隔200ms/年龄300ms，阶段确认120ms、Chop0.4–6秒、Load0.8–10秒，Carry确认500ms/进入0.35D/退出0.55D。真人参数可用性未测。
- **K**键盘语义源、**A**显式自动模拟、**S**人工33点/测试Worker、**V**合成视频+实际本地MediaPipe、**R**真人摄像头（无）。K/A/S/V不能证明真人识别准确率。
- `Q:file`指仓库根`artifacts/qa/3d/file`，`U:file`指`tests/unit/file`，`B:file`指`tests/e2e/file`。旧历史证据如引用会写完整路径。

## 实际执行

初始155单测/typecheck通过。逐任务RED→GREEN包括0/5数量、视觉归属、真实相机投影、紧凑通知/PiP、暂停镜头、迟到video.play、飞木交接、初始化失败释放；日志保留于Q目录。干净`npm ci`成功（145包/audit146，0漏洞），assets:sync/verify通过。

首轮全套`npm run verify`通过169单测、41E2E（6.0分钟）、type/lint/build。一次独立审查0 Critical/2 Important/0 Minor：图形丢失可恢复隐形计数、过快装车被拒绝后残留未提交飞木，先分别2浏览器/1单测失败后统一修复；170单测和定向2浏览器通过。详见`Q:review.md`及review-*-red/green.log，不做第二次审查。

最终`npm run verify`退出0：**170/170单测、42/42 E2E（6.1分钟）、typecheck/lint/build通过**；本地资源再次校验通过。正常构建`index-CgL4PAsP.js`675.50KB/gzip177.76KB，保留500KB包体积提示，不改阈值隐藏。完整日志`Q:verify-final.log`。

当时`dist/`在localhost:4175运行，`TIDAL_QA_DIR=artifacts/qa/3d TIDAL_BLOCK_EXTERNAL=1 node scripts/verify-auto-demo.mjs`通过：正式5/15/60配置、真实墙钟**142.219秒**完成15/15/60、到家15、100/100奖励与重置，0页面异常/外源/姿态资源请求。预热10秒后131.5614秒/5209样本，平均**39.59fps**，p50 **33.2ms**、p95 **33.4ms**、最大**50ms**、>50ms 0。实际GPU为**ANGLE SwiftShader软件渲染**，没有采用系统列出的RTX硬件；当时未达约60fps目标，P01判fail，不降低目标。最新复测见顶部及当前P01；候选30fps不等于指定硬件或真人性能通过。

生产首页/训练/结算截图均实际生成并查看，`Q:production-home.png`、`production-running.png`、`production-results.png`；首页无加速徽标，结算真实显示60秒与模拟来源。`Q:production-auto-flow.json/log`为实际计时/来源/性能证据。浏览器路由阻断不替代现场物理断网。

当时49ID判定：**33 pass、1 fail（P01）、15 manual_pending**。脚本仅核对当时证据完整性，不代替产品/真人验收；`Q:report-audit.json`为旧版本核查，最新性能见上方增量及当前P01。

## 功能与领域规则

| ID | 输入与预期 | 实际与证据 | 判定 |
|---|---|---|---|
| F01 | K/A同一配置15/15/60、标预设 | 配置与计划同源、普通URL不加速；U:config.test.mjs，B:boot.spec.ts | pass |
| F02 | K取消/重开，不开始 | 首页零进度、可重开；B:boot.spec.ts | pass |
| F03 | 受控4999/5000ms，只进一次Chop | 原边界/门禁保留；U:session.test.mjs | pass |
| F04 | K/S完整15次，第5/10/15次产5/10/15段 | 每树5段初始0，第16次/impact不加；U:session.test.mjs、worldChoreography.test.ts；B:source-lifecycle.spec.ts | pass |
| F05 | K/S完整复合Load15次 | 单蹲/单举/未复位/过快拒绝；U:loadRecognizer.test.ts、worldChoreography.test.ts；B:source-lifecycle.spec.ts | pass |
| F06 | 两段休息和倒计时，Carry直结算 | 原领域与七阶段浏览器回归；U:session.test.mjs；B:keyboard-flow.spec.ts、visual-states.spec.ts | pass |
| F07 | S有效10+放下5+有效50=60秒 | 不补算确认/放下/gap，5/10/15/30Hz一致；U:carryTiming.test.ts | pass |
| F08 | K/A/S到家15、车0、load15、奖励100/100/T恤 | 结果运动与游戏等宽，来源明确；B:keyboard-flow.spec.ts、source-lifecycle.spec.ts、world3d.spec.ts；Q:results.png | pass |
| F09 | 重复完成只发一次奖励 | 原一次性与上限负例保留；U:session.test.mjs、carryTiming.test.ts | pass |
| F10 | K双局/S重置，旧局不污染 | 新session/0库存/停track与Worker；B:keyboard-flow.spec.ts、source-lifecycle.spec.ts | pass |
| F11 | 所有权与库存守恒 | 地面/手持/飞行/车/到家按ID唯一；NPC/advance不写领域；U:session.test.mjs、worldChoreography.test.ts | pass |

## 摄像头与动作

| ID | 输入与预期 | 实际与证据 | 判定 |
|---|---|---|---|
| C01 | R视频/骨架/PiP对应 | V模型可推理；S同video/stream连续播放、track1/Worker峰值1；B:world3d.spec.ts。Q:camera-pip-synthetic.png明确合成，不是真人 | manual_pending |
| C02 | R九步标定/失效门禁 | S门禁与清除通过，真人幅度/机位未测；B:calibration.spec.ts、source-lifecycle.spec.ts | manual_pending |
| C03 | R20Chop+20负例 | 仅合成正反例，不能换算真人准确率；U:chopRecognizer.test.ts | manual_pending |
| C04 | R20Load+20负例 | 合成完整/半次/短举/过快均有负例，真人未测；U:loadRecognizer.test.ts | manual_pending |
| C05 | R放下恢复5次，≤300ms反馈 | S不补计、立即退出通过；真人可分性/反馈未测；U:carryRecognizer.test.ts、carryTiming.test.ts | manual_pending |
| C06 | R相同姿态拒绝 | S不可分原型拒绝；不证明握物/重量；U:calibrationSession.test.ts、carryRecognizer.test.ts | manual_pending |
| C07 | R完整一局含停顿 | K/A/S整局可恢复，真人整局未运行；B:source-lifecycle.spec.ts | manual_pending |
| C08 | R离镜/换位不拼接 | S突变/断档清除；缓慢换位/同位置换人仍须重标；U:smoothing.test.ts | manual_pending |

## 异常与生命周期

| ID | 输入与预期 | 实际与证据 | 判定 |
|---|---|---|---|
| E01 | 拒绝权限可重试、无静默模拟 | 原错误路径保留；B:camera-errors.spec.ts | pass |
| E02 | 模型/WASM404或版本错配报错 | 子路径实际404停捕获，当前资源校验通过；B:deployment.spec.ts；Q:assets-verify-final.log；版本错配历史fixture见artifacts/qa/t10/version-mismatch.log | pass |
| E03 | 迟到初始化/Promise不泄漏 | 原超时/bitmap释放，新增旧video.play拒绝不污染新stream；U:gamePreview.test.ts及camera/Worker测试 | pass |
| E04 | 缺失/占用/不支持/推理失败 | 分别显式报错；另注入3D初始化失败释放GL与canvas、上下文丢失后P/按钮/Space/自动输入均锁定；B:camera-errors.spec.ts、world3d.spec.ts | pass |
| E05 | 失效关键点不计成果 | 原识别/准备门禁保留；B:source-lifecycle.spec.ts及U:features/smoothing/识别器测试 | pass |
| E06 | 多暂停不覆盖、不补算 | 原暂停负例及新增自动镜头暂停/全景reset通过；B:keyboard-flow.spec.ts、demo-toggle.spec.ts、world3d.spec.ts | pass |
| E07 | 旧session/run/epoch丢弃 | 原SourceManager隔离；新半次木材随epoch/任务/新rep清除；U:sourceManager.test.ts、worldChoreography.test.ts | pass |
| E08 | 十轮启停/退出/重置无资源叠加 | track全ended、Worker0/峰值1、interval稳定1、timeout0、轨道监听0；单一3D世界复用，堆仅趋势守卫；Q:deployment/ten-cycle-resources.json。硬件GPU与指示灯另待测 | pass |
| E09 | 显式切源保成果、清半次、标混合 | 原S→K/A整局及停源隔离保留；B:source-lifecycle.spec.ts、demo-toggle.spec.ts | pass |
| E10 | 重复/NaN/负值/旧时间/gap拒绝 | 原全部负例保留；U:session/features/recognizer/carryTiming测试 | pass |
| E11 | repeat/焦点/pointercancel不误计 | 原键盘回归及Orbit不产运动成果；B:keyboard-flow.spec.ts、world3d.spec.ts | pass |
| E12 | 休息停帧不短暂进入active | 原瞬态回归保留，就绪后完整倒计时；B:source-lifecycle.spec.ts | pass |

## 视觉与声音

| ID | 输入与预期 | 实际与证据 | 判定 |
|---|---|---|---|
| V01 | 统一真3D、全景通知、实际旋转 | 实际相机及几何投影变化；本轮圆润模型/共享原创纹理与场景预算有单测，最终静态截图N:delivered-home.png、delivered-hero.png；历史Q:home.png、orbit.png保留。最终美术批准未取得 | manual_pending |
| V02 | 七阶段对应、暂停保持 | 七阶段/暂停像素冻结、手部锚点已验证；B:visual-states.spec.ts；真人同步与最终节奏未签 | manual_pending |
| V03 | 推车/归拢/绑绳不造木 | 人车把手相对位置、绕车朝向、绳索进度有测试；Q:replay/visual-replay.json；人工自然度待批准 | manual_pending |
| V04 | 五段/抛木/绳索/运送/结果 | 单根所有权、被拒循环复位、末根跨休息连续完成；U:worldChoreography.test.ts；已看回放截图，最终观感待批准 | manual_pending |
| V05 | 三桌面尺寸控件可达 | B:deployment.spec.ts完整流程/暂停/结果；Q:deployment/desktop-*.png；小通知≤390px、结果等宽有实际几何断言 | pass |
| V06 | 音效需点击、可静音 | 原WebAudio控制/失败/释放回归保留，扬声器听感待现场；U:audioFeedback.test.ts；B:deployment.spec.ts | pass |

## 数据、来源与隐私

| ID | 输入与预期 | 实际与证据 | 判定 |
|---|---|---|---|
| D01 | 未测健康数据不伪造 | 心率/卡路里未接入；运动数据来源明确；B:keyboard-flow.spec.ts | pass |
| D02 | 有效与经过时间分开 | 原领域累计分别显示，66天不填作本局成果；U:session.test.mjs；Q:results.png | pass |
| D03 | 预设计划不装AI | 紧凑通知仍标概念预设，无LLM；B:boot.spec.ts | pass |
| D04 | 仅视频、本机处理、不保存 | 原audio:false与本地Worker；子路径阻断外源；B:camera-errors.spec.ts、deployment.spec.ts；Q:deployment/subpath.json | pass |
| D05 | A/K/S混合来源不洗白 | 复用来源集合/模拟标识；PiP/结果均标来源；B:source-lifecycle.spec.ts、world3d.spec.ts | pass |
| D06 | 资源/许可可追溯 | 新Three MIT复制并校验，原创代码模型/材质；旧SVG保留；无外部素材/CDN；Q:assets-verify-final.log；SOURCES/DEPENDENCIES | pass |

## 性能与交付

| ID | 输入与预期 | 实际与证据 | 判定 |
|---|---|---|---|
| P01 | A预热后≥60秒，约60fps目标 | 最终CYPYbaQo/SwiftShader正常整局预热后131.6948秒55.72fps/p95 33.3ms/max33.5ms/>50ms 0；运送比例0.512、699×460。N:production-auto-flow.json；修正前DEI独立60.0142秒58.32fps只作对应版本证据。尚未稳定约60，硬件/真人未测 | fail |
| P02 | R推理≥10–15Hz/单帧在途 | 协议与V实际推理通过，真人性能未测；U:poseWorkerClient.test.ts | manual_pending |
| P03 | R端到端阶段p95≤250ms | 未采真人画面证据，rAF/推理耗时不能替代 | manual_pending |
| P04 | 物理断外网刷新整局 | 子路径回归保留，本轮最终整局阻断外源142.227秒结算重置，0外源；物理断网彩排未做；N:full-suite/deployment/subpath.json、production-auto-flow.json | manual_pending |
| P05 | 实际构建子路径本地资源 | /tidal/真实模型推理与404负例保留，资源均同源；B:deployment.spec.ts；N:full-suite/deployment/subpath.json（DEI全套） | pass |
| P06 | 干净安装→全套→实际dist | 锁文件未变；干净安装Q:npm-ci.log为历史，本轮未重复安装。草捆修正前208单测/49E2E/type/lint/build通过；修正后208单测/1完整视觉E2E/type/lint/build/assets通过；最终CYPYbaQo正常整局结算/重置通过。N:verify-final.log、material-final.log、restored-build.log、production-auto-flow.json；693.52KB，保留体积提示 | pass |

## 产品处理与下一步

| 假设 | 当前处理 | 确认状态 |
|---|---|---|
| A03 | 初始0、3树各5段，15挥砍/15装车 | 用户已于2026-10-21批准本轮设计 |
| A04 | 阶段同步，非逐关节复制 | manual_pending |
| A06 | 持姿代理，不证明持物/重量 | manual_pending |
| A07 | 只显示计数/时长与明确游戏奖励，健康数据未测 | manual_pending |
| A08 | 预设计划，未接LLM | manual_pending |
| A09 | 真3D/旋转镜头与本轮温暖卡通精修方向已批准，最终美术与节奏待验 | manual_pending |

无物理摄像头，下一步按`DEMO_RUNBOOK.md`记录真实骨架/PiP、九步标定、20+20正负例、5次持姿放下恢复、真人整局/资源关闭、推理和端到端性能；另在指定演示机做硬件GPU、物理断网和扬声器/视觉批准。默认不录制/上传视频，不保存真实姿态序列。当前没有合并main或部署公网。
