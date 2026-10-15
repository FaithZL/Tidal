# Tidal 测试报告

## 当前：T09 软件联调（2026-10-16）

分支`feature/t07-t11-completion`；环境Windows / Node24.14.0 / npm11.9.0 / Chromium156.0.8078.4，MediaPipe0.10.32 / Phaser3.90.0。T07/T08已推送；T09验证后提交推送。当前没有摄像头，所有C类真人验收与L2/L3继续manual_pending。

- `npm run verify`：149/149单测、26/26 E2E、type/lint/build通过；后续新增停帧阶段过渡测试先失败再1/1通过，并重跑149单测/type/lint/build。最终27项E2E将在T10干净验证中一起执行。
- `npm run assets:verify`通过。生产`index-BMaraPft.js`经`verify-t06-production.mjs`实际打开，准备门禁/模拟首个动作/暂停通过；不是整局生产验收。
- 输入适配、重复/旧上下文、后台/多暂停原因、有效样本计时、资源超时/释放均有自动证据。完整摄像头业务路径使用**人工33点+合成视频+模拟Worker**，真实识别器与领域执行15次Chop/15次Load/加速Carry；不能证明物理摄像头识别精度。
- T09证据：`artifacts/qa/t09/verify.log`、`stalled-rest-{red,green}.log`、`settlement-red.log`、`worker-dispose-red.log`、`camera-flow.json`、`synthetic-camera-results.png`、`production-smoke.json`。最新进度与逐项文件见PROGRESS；逐ID最终表在T11填写。

## 以下为 T06 历史报告

## 最新验证：T06（2026-10-16，Asia/Shanghai）

基线 `9932e0a`，本地分支 `feature/t06-pose-calibration`；没有推送。环境 Windows / Node24.14.0 / npm11.9.0 / Chromium156.0.8078.4，依赖版本保持。用户无摄像头，以下自动测试全部不能替代真机验收。

| 检查 | 实际结果 |
|---|---|
| 进入本轮基线 | typecheck、44/44单测通过，工作区干净 |
| 几何/站立红→绿 | 空实现5失败/13通过 → 18/18；像素宽高比、平移/缩放、左右独立、无效关节、站立稳定性 |
| 低通红→绿 | 5失败/1通过 → 6/6；按dt计算alpha，置信度不插值，断档/换位/resize/reset清历史 |
| 会话/回放红→绿 | 空实现14失败 → 14/14；逐步标定、Carry不可分、异常帧失效、时间戳回放取消 |
| 追加边界红→绿 | 5失败/25通过 → 修复；非法置信度、示例快照导出、负到达时间、平滑后零向量；另覆盖Load不完整示例与配置拒绝 |
| 全部单测 | 13文件98/98通过；新增54项，原44项保留 |
| 新E2E | 缺元素失败 → 3/3通过；合成Worker9步标定、无效清空、离开/换来源/后台取消 |
| 完整 `npm run verify` | pass；98/98单测、23/23 E2E（3.9分钟）、typecheck、lint、build |
| `npm run assets:verify` | pass；模型、4个同版运行文件、2个原创SVG |
| 生产浏览器检查 | `node scripts/verify-t06-production.mjs`通过；新dist的无摄像头准备页禁用、模拟启动/暂停；无pageerror/外部来源/模型请求；不是正式整局重跑 |
| 独立只读审查 | 新增54/54单测通过；无Critical/Important；相邻帧突变检测范围列为Minor限制 |
| 真人骨架/标定/性能/准确率 | **manual_pending**，用户无设备，本轮没有物理摄像头尝试 |

最终构建 `index-DaYWpBoR.js`，JS1,257.53KB / gzip340.49KB，原500KB体积警告保留；本轮未重跑npm ci/assets:sync。完整命令输出与红测试见 `artifacts/qa/t06/`。首次E2E加载夹具时Node要求JSON import属性，修复后重新运行并获得页面缺失失败；未用无测试结果冒充通过。

### 验收映射与证据边界

| 验收ID | 本轮判定与限制 |
|---|---|
| C02 准备/标定 | 软件逻辑通过合成测试；真机manual_pending。无有效全身/主手点不能采样，各任务分别记录就绪，Carry不可分不能就绪；当前没有摄像头游戏入口 |
| C08 换位/重新准备 | 相邻帧明显位置/尺度突变、尺寸变化、换主手清空；缓慢换位和同位换人未可靠检测，须手动重标；真人manual_pending |
| E05 数据失效 | 无效/低置信度/重复/乱序/未来/过期/长间隔、滤波后退化都会失效；未观察时间不补算；这里只验证准备标定，识别器阶段重置留T07–T09 |
| D04/D05 | 新生产检查无外部来源请求；测试回放只在tests，模拟开关不产生标定，原来源标签回归保留；不保存真实轨迹 |
| 原F/E/V回归 | 原领域/输入/视觉测试保留：键盘双局、自动整局、库存、奖励一次性、暂停恢复、重置、取消迟到资源；不是新真人证据 |
| C01/C03–C07、P01–P05 | manual_pending / not_run；未声称运动识别、真人整局或完整性能矩阵通过 |

`calibrated-synthetic.png`是真实浏览器UI，输入来自手工33点JSON、合成视频和模拟Worker，图上明确标注来源；不能当成模型识别人成功。既有camera-errors测试仍运行实际本地MediaPipe处理合成视频，但同样不是物理摄像头证据。

`production-calibration-waiting.png`、`production-demo-paused.png`使用实际生产构建，不请求摄像头或替换Worker、不加速时钟。已查看这两张及合成标定截图。生产报告只证明准备页、开关、首次动作/暂停，没有重跑正式时长整局；历史142.927秒整局结果见下面记录。

### 手动验证

有摄像头后按README完成9步标定；分别检查左/右主手、自然膝角、舒适动作幅度、持姿/放下可分性，故意短暂遮挡/失焦、明显换位后应重采。缓慢换位/换人请手动点重做，不依赖身份检测。停止/返回后检查摄像头指示灯释放，记录设备/浏览器/分辨率/光照；不必保存真人视频或关键点。仍是L1键盘/模拟Demo加T06准备能力，未达到L2完整摄像头交互。

本轮停在T06，不推送。下一轮T07砍树与装车识别器，真机待有设备后补测。

## 此前 T05 测试与视觉检查报告（历史记录）

## 最新追加验证：无摄像头开关

2026-10-15，基线 `.demo-toggle-baseline/`，生产构建 `index-CJ3uZn6C.js`。此轮只新增模拟演示，不改变领域规则；保留全部旧测试。自动输入是合成脚本；骨架为原创示意绘制，不经过 MediaPipe、不算推理结果。

| 检查 | 结果 |
|---|---|
| 起始类型/单测 | pass，40/40 |
| 红→绿 | 自动输入空实现3/4失败→4/4通过；浏览器开关缺失失败→5项新增E2E通过 |
| 完整 `npm run verify` | pass；44/44单测、20/20 E2E（3.3分钟）、typecheck、lint、build |
| `npm run assets:verify` | pass；模型、4个MediaPipe运行文件、2个原创SVG |
| 新单测4项 | 完整动作协议；取消半次/新epoch；Carry有效采样及停止；stop与start竞态 |
| 新E2E5项 | 默认关/骨架变化/准备页零计数/自动整局及重置；关闭暂停并可改键盘；真实错误不回退；Carry失焦/恢复/关闭；取消迟到视频流并释放track |
| 摄像头隔离 | 纯模拟整局没有getUserMedia请求、模型/WASM/Worker请求或页面异常；真实错误与释放为故障注入/合成流验证 |
| 生产正式时长整局 | pass；真实墙钟142.927秒，15次挥砍/15次装车/60.0秒Carry、库存0/0/15、100金币/100体力；重置关闭开关；无页面异常/外部来源/模型请求 |
| 物理摄像头 | manual_pending；用户确认无设备，本轮未做真机尝试 |

`artifacts/qa/demo-toggle/final-verify.log`记录完整验证，`unit-red.log`、`e2e-red.log`记录失败，`preserved-files.txt`/`preserved-tests.txt`记录未改动旧逻辑/测试，`source.diff`记录无Git目录的源码差异。已实际查看 `setup.png`、`running.png`：合成标签、测试开关与农场同时可见，准备页开始按钮可见。独立只读审查无必须修复项，记录于 `review.txt`。

新增生产复核方式：先运行 `npm run preview -- --port 4175 --strictPort`，再运行 `node scripts/verify-auto-demo.mjs`。脚本使用生产资源和真实墙钟，检查正式5/15/60秒配置、15/15动作、库存0/0/15、100金币/100体力、重置关闭开关，保存实际截图和JSON；仍是自动模拟，不是真人运动测试。

生产脚本实际通过，证据为 `artifacts/qa/demo-toggle/production-auto-flow.json`、`production-auto.log`、`production-setup.png`、`production-running.png`、`production-results.png`，视口1366×900。构建仍使用5/15/60秒并忽略URL加速标志；截图已实际查看。当前保留4175本机预览供用户查看。

未重新运行npm ci/assets:sync，依赖锁文件未改。最终美术/节奏、多尺寸矩阵、真机性能和动作识别仍待后续验收。下一轮T06特征/标定/回放；有设备后补T02。T06–T11未开始。

## 前一轮 T05 视觉记录（历史结果）

日期：2026-10-15（Asia/Shanghai）。无Git代码版本；本轮基线保存在`.t04-baseline/`。最终构建`dist/assets/index-DMFeJS_M.js`。T04报告保留于[history/T04_TEST_REPORT.md](history/T04_TEST_REPORT.md)。

环境：Windows、Node24.14.0、npm11.9.0、Chromium156.0.8078.4、Phaser3.90.0；MediaPipe0.10.32、Pose Landmarker Lite float16/1、CPU classic Worker。输入为键盘和明确合成的摄像头测试流；无真人视频/姿态夹具、无健康数据。

## 自动验证

| 项目 | 判定 | 实际结果与证据 |
|---|---|---|
| 进入本轮基线 | pass | typecheck；26/26原单测 |
| ActionAnimator | pass | 14/14；七种阶段独立保持、去重、旧上下文拒绝、暂停/恢复/reset/dispose、已提交树/木材跨休息、Carry不漂移、NPC无库存写入、命中树固定 |
| 全部单测 | pass | 6文件、40/40；领域/输入/config原单测未改 |
| 完整E2E | pass | 15/15，约2.8分钟；保留原14项、新增视觉重放1项 |
| 类型/lint/build | pass | npm run verify 全部成功；JS1,237.26KB/gzip333.40KB，未隐藏500KB警告 |
| 资源完整性 | pass | 模型SHA、4个同版WASM运行文件、2个原创SVG；SVG损坏负例非零拒绝，恢复后pass |
| 正式时长dist整局 | pass | 实际143.097秒；正式5/15/60秒，15木材/100金币/100体力；重置成功，无pageerror/外部来源请求；production-flow.json |
| 物理摄像头 | manual_pending | 本轮未重测；T04无fake-device尝试返回Not supported，不作为本轮通过 |

完整日志：`artifacts/qa/t05/final-verify.log`。资源负例：`assets-negative.log`。关键文件哈希对照：`preserved-files.txt`。本轮未改变依赖/锁文件，未重跑npm ci或assets:sync；T04安装记录仍可查，不冒作新记录。

生产实测：`npm run preview -- --port 4175 --strictPort`，另一个终端设置`$env:TIDAL_QA_DIR = 'artifacts/qa/t05'`后运行`node scripts/verify-production.mjs`。`production-flow.json`确认加载`index-DMFeJS_M.js`，实际143.097秒；`production-home.png`与`production-results.png`均已查看。测试结束后已停止本轮预览服务。

## 验收映射与实际截图检查

| 验收ID | 判定 | 覆盖与限制 |
|---|---|---|
| F01–F10、E06/E07/E10/E11 | pass（键盘范围） | 原领域/键盘回归全部保留；两轮完成、暂停、多原因、重复、焦点、pointercancel、Esc、重置与奖励一次性 |
| F11 | pass | 权威库存守恒测试保留；表现中的飞行木材从车上可见数量扣除、手持木材从地面可见数量借用；NPC无控制器写入口 |
| V01 | pass（开发侧截图检查） | 原创农场、农夫、机器人、杉树/树桩、手推车/木材/道路/农舍可辨，统一暖色；产品最终美术批准manual_pending |
| V02 | pass（键盘） | READY、下挥、复位、下蹲、站起、上举、装车复位独立进入；暂停后的截图SHA256一致；不是动作自动播放到完成；真人同步未测 |
| V03 | pass（预设协作） | 归拢木材/推车靠近和固定货物两段休息；路线由remainingMs派生，不改库存；UI标为预设伙伴 |
| V04 | pass（T05范围） | 击中/倒树、已提交木材飞行、Carry松开停止、到家结果与奖励图标；135ms装车复位衔接问题保留Minor |
| V05 | manual_pending | 本轮主要1366×768视口；完整三尺寸矩阵留后续，不以一套截图代替 |
| V06 | not_run | 音频/静音控制尚未进入T10 |
| E01/E02/E04 | pass（故障注入） | 拒绝权限、模型404、无设备/占用/不支持错误，显式处理 |
| E03 | pass（既有已测部分） | 取消/迟到资源回归通过；完整超时/terminate矩阵留T09 |
| D04 | pass（本轮观察范围） | 合成模型测试与释放无外部来源请求；Phaser同源blob为本地SVG栅格化，不是上传 |
| D06 | pass（来源记录） | 原创SVG/代码美术及SHA清单，未使用参考截图角色；sources附件缺失已注明；最终分发许可由项目所有者决定 |
| C01、C02–C08 | manual_pending / not_run | 真人骨架、标定、三种运动识别、真人整局未验证；本轮未开始T06–T09 |
| P01–P05 | manual_pending / not_run | 未测完整真机性能、端到端延迟、物理断外网或子路径部署 |

`artifacts/qa/t05/01-home.png`至`15-results.png`由真实Chromium获得。已实际查看农场全景、上肩/下挥/复位、树倒、下蹲/站起/上举、木材飞行、两段休息、50%Carry、结果页面；看到休息遮挡后先添加失败测试再修复，并复看新图。`14-home-arrival.png`实际包含结果弹窗覆盖，不是无遮挡到家场景。开发侧查看不等同产品负责人批准。

视觉重放方式：普通构建、实际KeyboardActionSource、Playwright受控时钟。重复动作保持原135/335/460和140/300/445/580/715ms序列；休息跳转时钟后运行一段正常帧让已提交特效完成；Carry用100ms相邻样本、不跳过200ms有效间隔限制。`visual-replay.json`记录7种阶段、15张截图和空pageerror。不得把这份证据称为实时墙钟或摄像头真机通过。

## 失败到通过

1. 新表现模块空实现：10/13失败 → 最小实现13/13；命中粒子跟随下一棵树的回归先失败 → 14/14。
2. 新浏览器用例先因缺少新画面标识失败；实际截图发现旧休息面板遮住伙伴，边界断言失败后改顶部紧凑提示。
3. 暂停图片逐字节比较过慢，改SHA256并先等一帧；首次全程逐帧时钟超时，调整测试推进方式而非缩短正式配置。
4. 首次完整套件14/15：HTTP前缀判断误报同源blob。核对Phaser3.90.0 SVGFile创建/释放本地Blob后改严格URL.origin，原无外发断言仍保留，最终15/15。
5. lint发现表现索引冗余初值，去除后通过；SVG故意损坏时assets:verify拒绝，恢复后再次成功。

失败日志均在`artifacts/qa/t05/`，没有删除负例或用空测试集声称通过。独立只读审查未发现Critical/Important，保留装车135ms视觉衔接Minor。独立Game/Scene销毁重建与任意大量树数不是本轮已验收路径；现有pagehide控制器dispose、SHUTDOWN actor清理和默认计划保持。

## 人工待办与交付边界

用户可按README启动；接受计划→摄像头诊断→允许视频→单人全身可见，检查骨架对应、实际60秒诊断指标及停止后指示灯释放，记录设备/浏览器/分辨率/光照。无需上传、录像或保存真实关键点。

当前仍是L1键盘概念版加T05统一视觉；L2摄像头互动版与L3路演版条件未满足。下一轮T06特征/标定/回放，同时补T02真人证据；本轮停在T05。
