# Tidal 开发进度（2026-10-16，连续推进 T07–T11）

## 当前阶段：T10 软件交付验证完成，继续 T11 证据整理

T07 `98aaba9`、T08 `85df391`、T09 `872b34c` 均已按授权push到 `feature/t07-t11-completion`。本轮保持原领域逻辑与模拟开关；无物理摄像头，真机和产品签字继续 `manual_pending`。

- `src/ui/audioFeedback.ts`、`browser.ts`、`index.html`：默认静音、点击解锁的原创正弦反馈音，失败不阻断游戏，静音/页面释放清理节点；4项单测先失败后通过，浏览器验证真实Web Audio开关。
- `web/style.css`：1280×720、1366×768紧凑桌面布局，保留1920×1080比例；首次720高度动作按钮超屏测试失败，修复后三尺寸完整流程、暂停、结果返回通过；截图已实际查看。
- `tests/e2e/deployment.spec.ts`：三尺寸、音频、十轮退出重置、实际`/tidal/`生产构建、本地MediaPipe合成视频推理、模型/WASM404共8项。子路径Vite本已正确重写图片，不做猜测性路径修改。
- 十轮资源测试定位`SetupPanel`每轮遗留`ended`事件监听器；用AbortController在停源时移除。CDP观察track全ended、Worker归零/峰值1、interval稳定1、timeout0、轨道监听0、全局监听90；堆只报告预热后趋势，不承诺精确内存。
- 输入诊断补最近120游戏帧p95、识别阶段/拒绝原因、摄像头指标；明确不是端到端延迟。`scripts/verify-auto-demo.mjs`补外源请求阻断与预热后至少60秒rAF采样，正式生产验证待下方最终结果。
- 全分支一次独立只读审查发现1个P2：准备页与Load识别器髋高门限不一致。先复现2项失败，再用`src/pose/loadCalibrationValidation.ts`共享门禁，标定当场提示重采，正常就绪能构造摄像头输入；相关32项通过，审查无其他发现。记录`artifacts/qa/t10/review.md`。
- 第一轮全套回归153单测通过、E2E34/35通过；旧自动Carry测试因退避轮询到0.9秒才暂停，1.3秒测试目标过快结束遮挡开关。用首样本MutationObserver同步失焦，保留全部负例/暂停断言，定向重复3次通过。失败trace摘要与SHA保留在`carry-polling-race.json`，未提交62MB原始trace。
- 干净安装首次被旧Vite进程占用原生DLL阻止；核实进程属于本仓库后停止，重新`npm ci`成功（137包、0漏洞），`assets:sync`/`assets:verify`通过。隔离错版本fixture验证JS/WASM错配会失败，见`version-mismatch.log`。没有修改依赖或锁文件。
- 本轮最终`npm run verify`退出0：**155/155单测、35/35 E2E（7.4分钟）、typecheck/lint/build全部通过**。生产包`index-CFBWu24Q.js`，1,274.60KB/gzip345.59KB；保留500KB体积警告。完整证据在`artifacts/qa/t10/verify.log`。本次生成的旧轮次截图恢复原版本，保留历史证据。
- 新增`docs/DEMO_RUNBOOK.md`，更新README、依赖/来源说明。T11将按49个验收ID交付证据表；物理断网、真实识别/端到端延迟、扬声器与美术批准仍待人工设备条件。
- 真实生产验证：`npm run preview -- --port 4175 --strictPort`，另终端`$env:TIDAL_QA_DIR='artifacts/qa/t10'; $env:TIDAL_BLOCK_EXTERNAL='1'; node scripts/verify-auto-demo.mjs`退出0。正式5秒准备/15秒休息/60秒有效Carry，**142.983秒墙钟**完成结算重置，15单位到家、100/100游戏奖励，0页面异常/外源/姿态资源请求；结果明确含自动模拟。实际三张截图与JSON均已产生，结算截图已查看。
- 性能实测：预热10秒后132.211秒、5296个rAF样本，平均**40.06fps**、p50 **16.8ms**、p95 **33.4ms**、最大**50.1ms**、>50ms一次。达到建议候选30fps底线，但不把约60fps目标写成通过；这是无头Chromium自动模拟，不是摄像头推理/端到端测量。物理断网与真人性能仍`manual_pending`。
- 性能诊断对照（`node artifacts/qa/t10/performance-probe.mjs`）：同一无头浏览器、2秒预热+各10秒观察，空白页60.00fps/主线程任务0.057秒，农场静态页39.54fps/主线程任务10.089秒。实际WebGL报告**SwiftShader软件渲染**，没有采用系统列出的RTX GPU；定位到当前农场软件渲染路径负载，未证明真实硬件GPU表现。P01按60fps目标保留`fail`，候选30fps是否接受与有设备后的硬件加速复测另行确认，不降阈值伪装达标。

## T09 软件联调历史记录

T08提交 `85df391` 已push；本阶段在同一分支增量接入摄像头语义输入，领域计数/计时/库存/奖励仍只由原控制器维护。用户无摄像头，T09真人整局仍 **manual_pending**，下面证据均明确区分模拟来源。

- 新增 `src/input/cameraActionSource.ts`、`sourceManager.ts`：标定门禁、三类识别器装配、任务/epoch/seq隔离、串行停旧源、取消迟到start、输入来源集合与无帧看门狗。
- 修改 `src/ui/{setupPanel,calibrationPanel}.ts`、`src/browser.ts`、`index.html`：有效标定后显式开始/恢复摄像头、失败重新准备、显式切键盘、混合来源结算、输入阶段诊断；保留自动模拟开关。
- `src/domain/{types,sessionController}.ts`增加准备状态命令与门禁，不重写原领域规则。休息不因跟踪丢失无限冻结，下一项等待就绪；多个暂停原因独立。`poseWorkerClient.ts`处理dispose端口抛错，保证终止。
- 新增单测4文件12项、`tests/helpers/browserPoseFixture.ts`、`source-lifecycle.spec.ts`4项。合成33点+模拟Worker驱动真实标定/识别器/领域整局；另有真实MediaPipe处理合成视频的旧测试，均不是真机。
- RED/GREEN：适配器空实现失败；无摄像头启动门禁失败；结算时误弹准备页、dispose抛错、休息准备门禁各先复现再修复。无帧休息回归用MutationObserver记录完整状态迁移，确实抓到“休息→倒计时→训练中→暂停”，修复后不再短暂进入活动任务。初版只检查最终状态未抓到此瞬态，已加强断言，没有删除负例。
- `npm run verify`通过：**149/149单测、26/26 E2E（5.9分钟）、typecheck/lint/build**。随后新增停帧回归先失败再1/1通过，并重跑typecheck/lint/149单测/build。最终共有27项E2E；没有把分开执行写成一次27项全套运行。下一阶段干净安装后全量复测。
- `npm run assets:verify`通过；最终构建`index-BMaraPft.js`，1,271.57KB/gzip344.55KB，既有体积警告保留。日志、合成整局JSON与已查看的结算截图在`artifacts/qa/t09/`；截图带测试输入横幅，无虚构真机证据。
- README已清理过期“摄像头只能诊断/停T06”描述。未改锁文件/Phaser表现/键盘输入及原测试。无新后端/服务/上传。继续T10本地交付与T11证据化验收，不合并main、不对外部署。
- 实际dist检查：`$env:TIDAL_QA_DIR='artifacts/qa/t09'; node scripts/verify-t06-production.mjs`通过（既有4175预览服务），无摄像头不能标定、自动模拟启动与暂停，无pageerror/外部来源/姿态资源请求。见`production-smoke.json`和对应截图；范围是冒烟检查，正式墙钟整局留T10。

## T07 / T08 历史阶段记录

### T08 已追加完成（下一步 T09）

T07提交 `98aaba9` 已成功push到 `origin/feature/t07-t11-completion`（同时带上此前T06提交）。本次继续T08：

- 新增 `carryRecognizer.ts`：沿用T06主手可见侧5维原型（相对腕位置、肘/膝角、髋高），RMS距离分类；500ms连续进入确认，0.35D进入/0.55D退出。原始帧已放下时立即退出，不让低通延迟继续计入；只输出hold-sample，权威时间仍在原SessionController。
- `recognitionConfig.ts`集中新增实验配置；`calibrationSession.ts`与识别器共享RMS最小可分门限，避免准备页通过而Carry拒绝。这里只是姿态代理，单侧特征不证明双手持物/实际重量，真实动作可分性manual_pending。
- 新增 `carryRecognizer.test.ts`、`carryTiming.test.ts`、`sessionHarness.ts`，追加一项标定门限一致性测试。初始空实现14失败/1通过；准备门限回归先1失败/18通过，然后修复。
- 实际 `npm run typecheck`、`lint`、`test:unit` **137/137**、`test:e2e -- tests/e2e/calibration.spec.ts` **3/3**、`build`通过；日志 `artifacts/qa/t08/verify.log`，构建 `index-BU-pHBOW.js`，体积警告保留。
- 覆盖有效10秒+放下5秒+有效50秒=60秒、进入延迟不倒填、5/10/15/30Hz有效计时一致、长gap/旧epoch/重复帧/多暂停原因和奖励一次性。原domain未修改；没有真机尝试。

用户最新授权每阶段验证后commit/push，连续推进到T11；采用分支 `feature/t07-t11-completion`，不合并main、不部署。当前完成T07软件部分，接下来T08。真机继续manual_pending，不能据合成回放声称真实识别准确。

- 新增 `src/pose/recognizers/{types,featureStream,repRecognizer,chopRecognizer,loadRecognizer}.ts`：复用T06标定/几何/低通，按观察顺序产生阶段、impact、rep-completed；完整复位才提交。共享输入检查与确认窗口，异常帧取消半次，周期超时拒绝。
- 扩展 `recognitionConfig.ts` 实验值：120ms确认、Chop0.4–6秒/Load0.8–10秒、相对示例差值门限。Load确认膝角与髋部下移；站起和举手可连续，但短暂一帧举手不能绕过确认时间。
- 新增 `tests/helpers/recognizerReplay.ts`、`chopRecognizer.test.ts`、`loadRecognizer.test.ts`，共22项；全部是明确合成33点输入。`getDebug()`返回阶段/拒绝原因，准备页业务接线留T09；当前没有真实运动游戏入口。
- 实际红→绿：两个空识别器5失败/16通过；追加“站起确认时只有一帧举手”先失败，再用独立确认窗口修复。日志在 `artifacts/qa/t07/`。
- 实际验证：`npm run typecheck`、`npm run lint`、`npm run test:unit` **120/120**、`npm run build`通过。构建 `index-mYnvI7-W.js`，保留已有体积警告。本阶段没有改浏览器交互，未重跑E2E或npm ci/assets:sync；T09/T10运行浏览器联调与完整回归。
- 原domain、键盘/自动输入、Phaser与全部旧测试未改；没有保存/上传真人数据。安装启动仍 `npm ci` → `npm run assets:sync` → `npm run dev`。后续执行清单见 `IMPLEMENTATION_T07_T11.md`。

## 此前 T06 检查点（历史记录）

## 本轮 T06：特征、标定与测试回放

在已有 Phaser / MediaPipe 诊断版本上增量完成 T06 的软件实现与自动验证，停在 T06；T07–T11 未开始。保留无摄像头模拟开关，原领域、游戏配置、键盘/自动输入、Phaser 表现、依赖锁文件和全部旧测试未改。用户确认无摄像头，真机骨架、标定可用性、参数和准确率继续 **manual_pending**。

开始时 Git 干净，基线 `9932e0a`，本轮使用本地 `feature/t06-pose-calibration` 分支；不 push、不合并 main、不部署。以下 Git/T05 段落均为此前历史，不是当前任务状态。

### 实现与文件

- `src/pose/features.ts`：先恢复像素坐标再计算膝/肘角；腕相对髋、髋高用当前躯干尺度归一化；两侧独立，镜像仅在显示层。缺点、非有限数、越界置信度、零向量、裁切、微小躯干拒绝，不补默认角度。
- `src/pose/smoothing.ts`：按时间间隔的一阶低通；无效帧、乱序、断档、尺寸变化及相邻帧位置/尺度突变清历史，不把失效区间插值成有效观察。
- `src/pose/calibration.ts`、`calibrationSession.ts`：2秒站立基线、主手、上肩/下挥、蹲下/站起/举手/复位示例、Carry持姿/放下各2秒的分步采样与可分性检查。提供各任务就绪状态与按值复制的命名示例汇总；不发 ExerciseSignal，不改业务状态。
- `src/config/recognitionConfig.ts`：集中实验阈值和输入校验，复用原最大采样间隔/数据年龄；不改 `demoConfig.ts`。
- `src/ui/calibrationPanel.ts`、`setupPanel.ts`、`src/browser.ts`、`index.html`、`web/style.css`：准备页引导、特征/拒绝原因/进度、主手选择，停止/离开/换来源/失焦与后台清理。无有效关键点不能采集；原自动模拟不参与标定。标定完成仍不能用摄像头计运动次数。
- `tests/fixtures/poses.synthetic.json`、`tests/helpers/syntheticPose.ts`、`replayPoseSource.ts`：明确来源的人工33点夹具和按时间戳回放；只用于测试，不打包成真实摄像头源。
- 新增六份单测：`features`、`smoothing`、`calibration`、`calibrationSession`、`replayPoseSource`、`recognitionConfig`；新增 `tests/e2e/calibration.spec.ts`、`scripts/verify-t06-production.mjs`。
- 文档：README、本进度、TEST_REPORT、SOURCES、IMPLEMENTATION_T06；本轮日志与截图放在 `artifacts/qa/t06/`。完整回归生成的旧证据目录图片恢复原版本，避免覆盖历史证据。

### 实际命令、失败测试与结果

| 命令 / 操作 | 本轮实际结果 |
|---|---|
| 初始 `npm run typecheck` / `npm run test:unit` | pass，44/44 原单测 |
| `npm run test:unit -- tests/unit/features.test.ts tests/unit/calibration.test.ts` | 空实现先5失败/13通过 → 18/18通过；之后补置信度非法值负例 |
| `npm run test:unit -- tests/unit/smoothing.test.ts` | 空实现5失败/1通过 → 6/6通过 |
| `npm run test:unit -- tests/unit/calibrationSession.test.ts tests/unit/replayPoseSource.test.ts` | 空实现14失败 → 14/14通过；随后补配置/示例返回值/负时间/滤波退化/不完整Load等回归 |
| `npm run test:unit -- tests/unit/calibrationSession.test.ts tests/unit/features.test.ts` | 边界补测先5失败/25通过（非法置信度2、缺少示例导出、负时间、滤波几何退化）→ 修复后全套98/98 |
| `npm run test:e2e -- tests/e2e/calibration.spec.ts` | 先因缺少页面元素失败 → 3/3通过（33.8秒）；包括完整9步合成标定、失效清除和生命周期 |
| `npm run verify` | pass：typecheck、lint、13文件98/98单测、23/23 E2E（3.9分钟）、build |
| `npm run assets:verify` | pass：模型、4个MediaPipe运行文件、2个原创SVG |
| `node scripts/verify-t06-production.mjs`（既有4175预览服务） | pass：实际打开新dist，无摄像头标定禁用；模拟启动、首个完整动作与暂停保留；无页面异常/外部来源/模型请求 |

首次新E2E启动曾因Node JSON import缺少`with { type: 'json' }`而未收集到用例；修复测试加载后重新获得页面缺失的真实失败，未把“无测试”计为通过。失败日志、`calibration-e2e.log`、`final-verify.log`、`production-smoke.log/json`均在本轮证据目录。依赖未变，本轮没有重跑 `npm ci` / `assets:sync`，不将以前安装结果写成本轮结果。

最终生产包 `index-DaYWpBoR.js`，1,257.53KB / gzip340.49KB；保留原有500KB体积警告。生产检查仅覆盖新准备页和模拟启动/暂停，**本轮没有重跑正式墙钟整局**；键盘双局、自动整局、库存守恒、奖励一次性、暂停/重置由完整E2E与原单测回归覆盖。此前142.927秒生产自动整局记录仍在历史段落。

### 浏览器证据与审查

- `calibrated-synthetic.png`：实际Chromium页面走完9步，明确加注“合成33点夹具 / 模拟Worker，非真人或模型准确率验收”；不是实际MediaPipe推理输出。界面显示三任务已标定，领域挥砍仍0/15；后续低置信度帧清除就绪。
- `production-calibration-waiting.png`：实际生产构建，未请求摄像头，采样按钮禁用、三任务未标定。
- `production-demo-paused.png`：生产模拟开关开启，首个完整动作后暂停，次数保持。三张图均已实际查看。
- 独立只读审查：新增54/54单测独立通过，无Critical/Important；Minor为仅检测相邻帧突变。**缓慢换位、同位置换人不能可靠检测，须手动重做标定**，不承诺身份识别或通用多人隔离。审查记录见 `artifacts/qa/t06/review.txt`。

### 手动待办与下一步

当前没有摄像头，不要求用户立即完成真机步骤。有设备后：关闭模拟 → 接受计划 → 开启摄像头诊断 → 单人全身/举手范围可见 → 按本人左右选主手 → 逐步采集9步；检查舒适动作能否区分，遮挡/失焦后是否清除，停止/返回后指示灯是否关闭。记录设备、浏览器、分辨率、光照与拒绝原因，不必上传或保存真人视频/姿态轨迹。真实阈值可用性、准确率和性能均 `manual_pending`。

本轮只完成 T06 准备能力，不代表三运动识别完成。下一轮 T07：砍树/装车的完整时序识别器、正负回放测试与事件顺序；T08 Carry、T09 摄像头业务接入仍后续。A03–A09 等既有产品假设继续未确认。

运行：`npm ci` → `npm run assets:sync` → `npm run assets:verify` → `npm run dev`；完整验证 `npm run verify`。生产预览 `npm run build` → `npm run preview`。更详细的启动、模拟开关和标定步骤见 README。既有本机4175预览当前读取最新dist，不是对外部署。

## 此前 T05 与 Git 交付记录

## Git 交付（2026-10-16）

用户明确要求提交到 `https://github.com/FaithZL/Tidal.git`。本地起始无Git，远端 `git ls-remote` 未返回任何引用；现已初始化本地 `main` 并设置该地址为 `origin`。首次提交范围为现有源码、测试、文档、锁文件、本地模型/WASM、许可和已记录QA证据；不包含依赖安装目录、构建产物、历史备份、Playwright临时目录、生成Worker或环境密钥文件。本次没有新增业务功能，也不进行合并或站点部署。

提交前重新运行 `npm run verify`：typecheck、lint、44/44单测、20/20 E2E（3.4分钟）、build均通过；`npm run assets:verify`通过。日志在 `artifacts/qa/demo-toggle/pre-push-verify.log`。构建仍为 `index-CJ3uZn6C.js`，保留原有500KB体积警告；未重跑npm ci或正式时长生产整局，前一轮142.927秒实测记录继续保留。物理摄像头仍 `manual_pending`，开发仍停在T05附加模拟功能。

下方“无Git/未push”均为当时的开发记录，不能解释为当前目录仍无版本管理。后续可直接在此目录用正常Git流程增量开发；安装/启动与克隆步骤已补入README。

## 最新追加：可开关的合成骨架 + 自动完整农场流程

用户确认当前没有摄像头，并选择“模拟骨架 + 自动演示完整农场流程”。已在现有 T05 版本上增量完成；没有改动领域/配置/手动键盘源与旧测试。停止在 T05 加用户要求的演示附加功能，T06–T11 未进入。

- 准备页与顶栏共用“无摄像头测试”开关，默认关闭。准备页显示原创合成骨架，不计成果；开始后自动按完整动作协议驱动砍树、装车、拉车、结算。骨架随动作阶段变化，休息/暂停遵循会话状态。
- 训练中切换先暂停并隔离旧 epoch；关闭后点继续回到键盘。开启时手动动作不叠加输入；失焦、后台、暂停停止自动输入，不补算持姿时间。重置关闭开关，取消定时器与半次动作；页面释放时 dispose。
- 结算保留“含自动模拟”的来源，即使中途关闭也不会伪装成全手动。模拟骨架与真实视频/推理指标分开；模拟模式不请求摄像头/模型/Worker。真实摄像头失败显式报错，不回退到假画面。
- 真实摄像头入口保留；以后接上摄像头可用于关键点诊断。**完整运动识别仍需 T06–T09**；本次合成姿态不能证明真实识别完成，真机继续 `manual_pending`。

改动文件：新增 `src/input/autoDemoSource.ts`、`src/ui/syntheticPreview.ts`、`tests/unit/autoDemoSource.test.ts`、`tests/e2e/demo-toggle.spec.ts`、`scripts/verify-auto-demo.mjs`；修改 `src/browser.ts`、`index.html`、`web/style.css`、`.gitignore`、README、本进度、TEST_REPORT、SOURCES。`AutoDemoSource`只包装既有 `KeyboardActionSource`，沿用 `ExerciseSignal`/会话与任务/epoch/序号/完整复位契约，业务仍只由 `SessionController`写入。没有新增 npm 依赖。

实际命令与结果：

| 命令 | 本轮实际结果 |
|---|---|
| `git status --short` | 无 Git 仓库；无 commit/push/merge/deploy |
| `npm run typecheck`、`npm run test:unit`（起始基线） | pass；40/40 |
| `npm run test:unit -- tests/unit/autoDemoSource.test.ts` | 空实现先 3/4 失败，最小实现后 4/4 pass |
| `npm run test:e2e -- tests/e2e/demo-toggle.spec.ts -g 'no-camera demo'` | 先因不存在开关失败；未将取消的其他用例记为通过 |
| `npm run test:e2e -- tests/e2e/demo-toggle.spec.ts` | 新增 5/5 pass（37秒）：整局/关后手动/摄像头失败独立/Carry暂停/迟到视频释放 |
| `npm run verify` | pass：typecheck、lint、44/44 单测、20/20 E2E（3.3分钟）、build |
| `npm run assets:verify` | pass：模型、4个同版运行文件、2个原创SVG |
| `npm run preview -- --port 4175 --strictPort` + `node scripts/verify-auto-demo.mjs` | pass；生产真实墙钟142.927秒，15次砍树/15次装车/60.0秒Carry，库存0/0/15，100金币/100体力，重置关闭开关，无pageerror/外部来源/模型请求 |

证据目录：`artifacts/qa/demo-toggle/`，含 `unit-red.log`、`e2e-red.log`、`final-verify.log`、`source.diff`、`preserved-files.txt`、`preserved-tests.txt`、`review.txt`、实际浏览器 `setup.png` / `running.png`。已查看截图并收紧准备页，让1366×768下的开始按钮可见。最终构建 `index-CJ3uZn6C.js`，JS 1,242.34KB/gzip335.11KB，仍有既有500KB体积警告。只读独立审查无需修复的问题；未将其当作真机/完整尺寸/性能验收。

本次基线在 `.demo-toggle-baseline/`；领域、配置、原键盘源和所有既有测试逐文件哈希一致。没有重跑 `npm ci` 或 `assets:sync`，旧安装记录不冒作本轮结果。启动/安装命令见 README；本轮不增加后端、账号、联机或健康指标。手动待办：用户检查模拟视觉与节奏；有摄像头后关闭模拟、开启诊断、检查骨架与释放，记录浏览器/设备/分辨率/光照。当前没有物理设备，不要求用户现在完成该步骤。

生产证据：`production-auto-flow.json`、`production-auto.log`、`production-setup.png`、`production-running.png`、`production-results.png`，均在上述目录。生产截图1366×900；普通构建忽略 `?e2e=1`，全程没有时钟加速。当前为方便用户观看保留本机 `http://127.0.0.1:4175/` 预览服务；接受计划→打开“无摄像头测试”→开始自动模拟。服务退出后按 README 重启，不是外部部署。

## 前一轮 T05 视觉实现记录（以下40单测/15E2E为当时结果）

## 本轮范围与结论

在既有 Phaser 版本上增量实现 T05：统一暖色矢量农场、七种阶段姿态、树木受击/倒下、木材入车、有效拉车、两段预设 NPC 协作及奖励图标。只消费 SessionController 的快照/效果；没有重新生成项目，没有修改领域、配置、键盘输入源或其有效单测。

完整检查已通过：40/40 单测、15/15 浏览器 E2E、typecheck、lint、build；生产正式时长整局也通过，实际143.097秒，15木材到家、60.0秒Carry、重置成功，无页面异常或外部来源请求。本轮停止在 T05，T06–T11 未进入。摄像头真机骨架继续 **manual_pending**，合成摄像头测试不代表真实运动识别。

目录无 Git。`.t04-baseline/` 保留本轮开始前文件；`artifacts/qa/t05/source.diff` 为 `git diff --no-index` 的源码差异，没有虚构提交。未 push、未合并、未部署。T04 历史记录移至 [history/T04_PROGRESS.md](history/T04_PROGRESS.md) 和 [history/T04_TEST_REPORT.md](history/T04_TEST_REPORT.md)，旧证据保留。

## 任务状态

| 任务 | 状态与边界 |
|---|---|
| T01 / T03 / T04 | 原工程和领域规则保留，完整键盘回归通过 |
| T02 | implemented / manual_pending；本轮仅重跑合成视频/错误/释放回归，未重测物理摄像头 |
| T05 | implemented，自动验证 pass；已实际查看浏览器截图；最终产品视觉与节奏批准仍 manual_pending |
| T06–T11 | not_started；下一轮从 T06 特征、标定、回放开始 |

## 实现与文件

- `src/game/ActionAnimator.ts`：纯表现状态，`apply/sync/dispose` 契约；阶段独立保持，impact 去重，旧会话/任务/epoch 拒绝；暂停冻结、恢复清半次、reset/dispose 清理。粒子/倒树/木材飞行使用表现时间；Carry/NPC路线由权威快照计算。
- `src/game/FarmScene.ts`：先读取已提交快照再应用效果，保留末次倒树/装车跨入休息的反馈；持有并释放 actor 与订阅；未变化的画面复用绘制结果。
- `src/game/actors/FarmerActor.ts`、`HelperActor.ts`、`props.ts`、`src/game/assets.ts`：农夫/斧头、原创机器人“禾禾”、杉树/树桩、木材/手推车和统一调色。NPC 只有预设协作，无领域写接口。
- `public/assets/farm-landscape.svg`、`harvest-shirt.svg`、`manifest.json`、`README.md`：本任务原创场景/奖励图标、SHA256与来源说明。未用参考图角色截图或付费资源。
- `src/browser.ts`、`web/style.css`、`index.html`：休息/暂停提示缩到顶部，避免挡住 NPC；两段休息提示区分；奖励区使用本地图标。现有 DOM/CSS 结构保留。
- `tests/unit/actionAnimator.test.ts`：新增14项；`tests/e2e/visual-states.spec.ts`：新增完整视觉重放；`tests/e2e/camera-errors.spec.ts`：保留原断言，外发检测改用严格 URL.origin，识别 Phaser 同源 blob。
- `scripts/verify-assets.mjs`：检查两份原创SVG；`scripts/verify-production.mjs`：增加可选证据目录与构建文件记录、T05画面/库存断言。
- 文档：本文件、README、TEST_REPORT、IMPLEMENTATION_T05、DEPENDENCIES、SOURCES、T04历史记录；`.gitignore`增加本轮备份目录。

领域/输入/配置、package.json、锁文件和原三份领域/输入/配置单测的 SHA256 与基线逐项相同，证据：`artifacts/qa/t05/preserved-files.txt`。没有新增 npm 依赖；本轮未重新运行 npm ci 或 assets:sync，不把 T04 的安装记录冒作本轮命令。

## 实际命令与结果

环境沿用 Windows、Node24.14.0、npm11.9.0、Phaser3.90.0、Chromium156.0.8078.4、MediaPipe0.10.32 CPU Worker。

| 命令 / 操作 | 实际结果 |
|---|---|
| 初始 `npm run typecheck` / `npm run test:unit` | pass，原26/26基线 |
| `npm run test:unit -- tests/unit/actionAnimator.test.ts` | 首次空实现10/13失败 → 13/13；追加击中目标锚定负例先失败 → 最终14/14 |
| `npm run test:e2e -- tests/e2e/visual-states.spec.ts` | 先因缺少新场景失败；休息面板遮挡负例失败；实现后pass |
| `npm run assets:verify` | 模型+4个WASM运行文件+2个SVG pass；损坏SVG时非零失败，恢复后pass |
| `npm run verify` | 最终pass：typecheck、lint、40/40单测、15/15 E2E（约2.8分钟）、build |
| `npm run build`（由verify调用） | pass；`dist/assets/index-DMFeJS_M.js`，1,237.26KB / gzip333.40KB；保留大于500KB警告 |
| `npm run preview -- --port 4175 --strictPort` | 已启动并实际打开dist |
| `$env:TIDAL_QA_DIR = 'artifacts/qa/t05'` 后运行 `node scripts/verify-production.mjs` | pass，143.097秒；正式5/15/60秒，15木材/100金币/100体力，重置成功；加载index-DMFeJS_M.js；pageerror/外部来源请求为空 |

失败过程保留：`unit-red.log`、`impact-red.log`、`e2e-red.log`、`rest-overlay-red.log`、`visual-timeout.log`、`network-origin-red.log`、`assets-negative.log`。所有路径在 `artifacts/qa/t05/`。图片比较最初逐字节失败输出过慢，改为SHA256并在暂停后等待一帧；全程逐帧受控时钟首次120秒超时，改为跳转休息时钟，Carry仍保持每100ms有效样本，不跳过计时规则。首次完整E2E为14/15，唯一失败是同源blob误判外发；核实锁定Phaser SVGFile代码后修正来源比较，最终15/15。

## 浏览器与视觉证据

- `final-verify.log`：完整最终命令输出。
- `production-flow.json`、`production-test.log`：正式时长dist整局证据；`production-home.png`和`production-results.png`为实际生产构建截图，已查看。
- `visual-replay.json`：真实 KeyboardActionSource + Playwright 受控时钟，七种姿态、暂停截图哈希一致、松开Carry位置不变、重置清理、pageerror为空。
- `01-home.png`至`15-results.png`：实际浏览器15张截图，已查看姿态、倒树、装车飞行、两段协作、拉车和结果。`14-home-arrival.png`是到家后结果弹窗覆盖下的场景裁切，并非无遮挡农舍截图。
- `06-rest-gather.png`：归拢已有木材，地面15/车上0；`12-rest-secure.png`：固定货物，地面0/车上15；`13-carry.png`：50%有效进度；`15-results.png`：15木材/100金币/100体力。
- 这些是实际浏览器键盘画面，不是真人姿态证据，也不构成产品方最终美术批准。

## 审查、限制与待人工项

独立只读代码审查无Critical/Important。保留一个Minor：装车load-return到提交的135ms间隔，手持木材先回地面，再从空中飞入车，后续可打磨连续性；没有提前改库存或多计。

本轮维持既有SHUTDOWN清理路径；当前pagehide先dispose控制器。以后若加入独立Game/Scene销毁重建，需同时覆盖DESTROY，否则可能残留订阅。默认布局通过，未承诺任意大量树数或极短自定义流程。声音、完整多尺寸/性能矩阵与最终产品视觉批准在T10/T11。

A03数量、A04阶段同步、A05休息整理解释、A06持姿代理、A07示例指标、A08预设计划、A09美术方向仍未确认。本机缺少sources/中的原DOCX/三张参考图，仅对照SOURCES的文字说明；没有声称逐图比对或取得第三方游戏资产授权。

物理摄像头本轮未重测，沿用T04真实设备返回Not supported的manual_pending记录。待人工：准备页开启摄像头诊断，检查全身骨架随真人动作更新、实际60秒性能、停止/返回后指示灯关闭；记录机器/浏览器/摄像头/分辨率/光照。标定、三运动识别和真人整局均未实现；无需上传视频或姿态轨迹。

## 运行与下一步

安装/启动：`npm ci` → `npm run assets:sync` → `npm run assets:verify` → `npm run dev`，默认本机5173。首次测试安装：`npx playwright install chromium`。完整验证：`npm run verify`。生产预览：`npm run build` → `npm run preview`。详见README。

本轮停在T05。下一轮T06：关键点特征、平滑、准备标定、明确synthetic来源的回放夹具；并补T02真机骨架证据。不得把当前键盘阶段表现写成三种真实运动识别完成。
