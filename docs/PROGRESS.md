# Tidal 开发进度（2026-10-16，T05 + 无摄像头自动演示）

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
