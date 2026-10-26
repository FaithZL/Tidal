# Tidal 开发进度（2026-10-24，局部NPR与人物样片归档）

## 最新追加：动作教学与标准骨骼示范限定范围提交、推送main授权（2026-10-26）

用户明确要求“提交push”，授权将前两轮尚未提交的完整动作教学、场景常驻标准骨骼示范及对应源码/测试/文档/计划/验证记录普通提交并推送main，不部署。原动作教学制作阶段“不提交/push”的停点被本轮明确授权覆盖；不修改原素材、许可、识别/领域规则或依赖。

实查本地与实时远端main均为`1f69eebab150c6af9debb04258862bdce14c8f54`。提交前同一应用代码重新运行typecheck、lint、**449/449单测**、assets:verify和build，全部exit0；命令/退出码见`artifacts/qa/tutorial-publish-20261026/commands.json`。最终14份JS/CSS/HTML构建文件逐份SHA与前轮已实际打开的生产版本一致，167份源码/样式/测试及入口指纹不变，因此沿用刚完成的30项相关E2E和正常生产截图，不重复重生成QA。未重跑全量verify，旧prototype暂停PNG失败及真人/手机/性能待验保留。已有500KB提示不隐藏。

两轮任务QA共157文件、241,199,928字节，最大45,060,672字节，无超过50MiB文件；截图仅原创SVG/合成农场，无真人录像。保留真实失败日志/trace、正常生产截图和SHA恢复清单；旧trace中的localhost开发服务临时nonce不是外部可复用账户凭据，原始证据不改写。原有53行无关PROGRESS（旧安装/接续43行、城堡预览4行、装车启动预览6行）用单独暂存文本排除，继续原字节保留本地；旧74份handoff/trace均不纳入，SHA逐项核对。提交前1,975份历史QA均保持原SHA，没有再生或覆盖。

明确文件清单、可重复构建及独立只读范围审查见本轮scope/reproducibility/preservation记录。无reset/clean/强推、重克隆或重装；实际提交SHA、推送及远端一致性由本聊天交付回执确认。5173本机预览保留，未部署。

## 最新追加：场景常驻标准骨骼动作示范（2026-10-26）

用户以截图标出右下输入预览左侧，要求加入正确动作动画，只需右侧绿线/金节点骨架样式。在main、HEAD `1f69eeb`和上轮尚未提交的完整动作教学上增量实现；保留原有未提交源码、记录、QA，不stage/commit/push/部署，不新增素材或依赖。设计/计划见`docs/superpowers/specs/2026-10-26-movement-guide-design.md`及对应plans文件。

新增`movementGuideClock.ts`复用原教学坐标：挥砍只循环上肩→下挥→复位，装车循环站立→下蹲→站起→上举→复位，各段75%完成插值后短暂保持；拉车始终稳定持姿，不循环放下。新增`movementGuide.ts`绘制14金节点、绿色骨骼/头圈、深绿网格，明确“标准动作示范”，与右侧输入反馈区分；只消费快照并接现有browser rAF，无ExerciseSignal/成果写入、摄像头或第二渲染器。倒计时/活动/休息可见，休息示范下一项，暂停/后台冻结、context变化复位，reset隐藏；减少动态效果显示关键姿态。完整教学、模拟偏好和标定识别契约不改。

桌面卡片位于原输入预览左侧，680px以下移至上方；百分比保持可见。初始审查发现动态减少动效冻结中间姿态、桌面遮百分比及601px遮左侧按钮，均由真实RED闭环；继续审查发现390×600装车文案比挥砍更高，原仅挥砍布局测试漏检，补为真实15次挥砍进入装车后暂停，再复现/修正短屏排布。保留断言，不通过隐藏输入预览或百分比掩盖重叠。

本轮命令/退出码见`artifacts/qa/movement-guide-20261026/commands.json`，失败/中间trace保留：

| 验证 | 真实结果 | 证据 |
|---|---|---|
| 纯循环时钟RED→GREEN | 初次13/13语义失败；随后clock13+旧tutorial16，29/29通过 | clock-red.log、clock-green.log |
| 新示范E2E | 入口缺失RED；最终exit0，**5/5**；实际SVG节点变化/完整切任务、等待不计次、暂停/短后台/context复位、动态reduce、8尺寸装车布局均通过 | e2e-release.log、layout.json、PNG |
| 原教学/演示/键盘/摄像头来源E2E | exit0，**25/25，5.1分钟**；包含两项历史source-lifecycle及同一轨道/Worker/失效准备；合计30项范围E2E | e2e-regression.log |
| 全unit、lint、typecheck | 最终exit0，55文件**449/449单测**；lint通过；最终build内strict类型再次通过 | unit-release.log、lint-release.log、build-release.log |
| assets:verify、build | exit0；入口index-BBM0Vmey.js、browser-rQyfURKR.js；已有500KB提示保留 | assets.log、build-release.log |
| 正常4176生产构建捕获 | exit0，6张合成UI PNG；实际挥砍、下蹲、持姿和暂停；0摄像头申请/姿态请求/外源/页面错误，暂停400ms节点及成果不动 | production.log、production/production.json及PNG |

初次lint因无用循环变量exit1，局部改为索引循环；一次边界RED因并行回归占4173被拒，顺序复跑才命中真实失败；扩展布局首轮因自动演示在尺寸循环中自然结算，修正测试为暂停状态后继续，未改生产流程或断言。独立只读审查最终无阻塞，细节见review.json与execution-ledger.md。

测试前保留1,906份历史QA；6份旧输出重生成后另存本轮regression并恢复，全部原SHA一致。原未提交教学源码、旧74份handoff/trace与进度全文保留，见qa-restoration.json及preservation.json。只用已有依赖/浏览器；素材/许可、领域/输入/识别源码未改。

正常生产构建已查看桌面与390×844的骨骼示范；4176临时预览捕获后关闭，5173开发服务继续保留。入口仍为`http://127.0.0.1:5173/?art=npr-sample`，训练过程中可直接看到常驻示范。限制：摄像头回归采用假视频/合成关键点，不能当作本轮真人验收；真实手机、准确率/性能与最终美术仍待验。未重跑完整verify，旧prototype暂停PNG失败仍保留，不把范围通过当全量通过。下一步等待用户查看，不提交/push/部署。

## 最新追加：挥砍、装车与拉车持姿的分步教学（2026-10-26）

用户要求增加三类动作的分步示范、慢动作、要点，训练前可看、随时重看，并明确“先不要提交或push”；随后选择“人体动作图与关节提示”。本轮基线main、HEAD `1f69eeb`，实时远端main起始也一致。在既有目录增量实现，保留原53行未提交进度及旧74份handoff/trace；未重新安装、改素材/许可/锁文件、commit/push或部署。设计与计划见`docs/superpowers/specs/2026-10-26-exercise-tutorial-design.md`及对应plans文件。

### 内容与交互

新增`exerciseTutorialModel.ts`的挥砍4步、装车5步、拉车持姿3步，以及独立纯播放时钟；`tutorialFigure.ts`绘制原创SVG人体与14关节点，金色双圈强调本步关注部位。`exerciseTutorialPanel.ts`提供步骤定格、前后步、播放/暂停、重播与1×/0.5×/0.25×；原生DOM/CSS适配桌面与窄屏，不引入第二个3D渲染器、外源媒体、真人姿态数据或依赖。内容说明本应用手势和个人标定范围，不宣称专业负重教学/临床姿态纠正，不替代九步标定；来源和新增验收点已追加到SOURCES/DEVELOPMENT_GUIDE/ACCEPTANCE。

顶栏、计划、准备页和结算页可打开同一教学面板。运行中打开只走SessionController既有user暂停、停止按住输入；关闭保持暂停，由用户继续，不清除tracking/visibility/source-error。教学不提交ExerciseSignal或计次/库存/有效持姿时间；现有摄像头/Worker不重开，失效仍须准备。背景inert、Tab焦点循环、Escape仅关教学、Space/P不穿透；按当前准备/计划/结果状态恢复焦点。资源就绪前已主动打开过教学时，不在背后默认开局，不改保存的自动演示偏好。本局经过时间仍按原定义包含暂停，不把它误作有效时间冻结断言。

### 实际验证

完整命令/退出码见`artifacts/qa/exercise-tutorial-20261026/commands.json`，所有失败/中间日志保留。

| 命令/验证 | 退出码与实际结果 | 证据 |
|---|---|---|
| 新入口RED、纯模型RED | 入口exit1（无教学按钮）；模型语义16/16失败，随后16/16通过 | entry-red.log、model-semantic-red.log、model-green-final.log |
| 独立审查边界RED→GREEN | 复开高亮丢失、最后一步播放跳回0、短后台空档0→150ms均真实复现并修复；新11项E2E最终通过 | lifecycle-red*.log、background-red.log、e2e-green-first.log、review.json |
| typecheck、lint、全部unit | 最终exit0；54文件**436/436单测**；文案改为面向用户的简单说明后再次436/436、lint通过 | typecheck.log、lint-copy-final.log、unit-copy-final.log |
| 新教学`test:e2e -- tests/e2e/exercise-tutorial.spec.ts` | exit0，**11/11**，含真实SVG变化/慢放、准备/结算重看、焦点/快捷键、自动开局竞态、持姿冻结、同一摄像头轨道/Worker与失效准备 | e2e-green-first.log、clock-observation.json、synthetic-camera-boundary.json |
| 原流程`test:e2e -- tests/e2e/demo-toggle.spec.ts tests/e2e/source-lifecycle.spec.ts tests/e2e/keyboard-flow.spec.ts tests/e2e/world3d.spec.ts tests/e2e/user-farm-motion.spec.ts tests/e2e/user-load-motion.spec.ts` | exit0，**25/25，5.3分钟**；合计36项范围E2E通过；未修改原有断言或超时 | e2e-regression.log |
| assets:verify、build | exit0，最终入口index-CynxqEdq.js，strict类型检查再次通过；既有500KB提示保留 | assets.log、build-copy-final.log |
| 4176正常生产构建教学检查 | 最终exit0，10张合成UI PNG；0摄像头申请/外源/页面错误，0.5×在约700ms观察窗口推进约366.65ms，训练中查看500ms计数/持姿/库存不动，关闭仍暂停；桌面三类示范及390×844控件可达 | production-final.log、production/production.json及PNG |

初次新E2E配置在describe内使用worker级launchOptions被Playwright拒绝，移至新测试文件顶层；未更改全局配置。首版边界测试的轮询会等待整课再次到最后一步，墙钟后台用例也可能因GPU长帧被丢弃而漏检，已改为即时步骤断言与真实面板的受控合法rAF日程，确证失败后修复，没有放宽断言。模型严格端点测试发现浮点末值误差，保留断言并直接返回端点；首次typecheck提示项目未启用DOM.Iterable，改用Array.from，没有改tsconfig掩盖错误。三项UI修复分别为重置/补全渲染缓存键、先按所选步骤play再处理自然结束重播、visibilitychange即时清播放时间基准。

正常生产构建已查看挥砍、下蹲、持姿及窄屏控件；最终文案将“样本/提交计数”等实现措辞改为普通动作提示，原10图另存production/iterations后重新捕获成功。图片只含合成图形/农场，不录视频。已在5173可见浏览器从结算页打开教学，选装车下蹲定格及0.5×并保留标签页，入口仍为`http://127.0.0.1:5173/?art=npr-sample`；手机布局可向下滚动访问播放和速度。临时4176生产服务检查后关闭，既有5173服务保留。

测试前备份1,818份历史QA，14份重生成输出另存本轮regression，再恢复所有原路径SHA；全部一致，见qa-restoration.json。原未提交进度正文、74份旧文件及源素材均保留，见preservation.json。独立只读审查的三项P2已由失败用例闭环，复核未见新阻塞。

限制：新摄像头用例使用假视频/合成关键点，不是本轮真人验收；真实手机、识别稳定性、最终教学/美术批准及约60fps仍待验。未重跑全量verify，既有prototype暂停PNG失败仍保留待查；不把36项范围通过写成全量通过。下一步等待用户查看教学效果或给出后续任务，尚未commit/push/部署。

## 最新追加：挥砍与行走动作限定范围提交、推送main授权（2026-10-26）

用户明确要求“提交并push”。本轮只纳入现有挥砍与walk/push/pull动作、装车兼容/阶段接续负例、FarmWorld接入与准确标签、来源/设计/计划及`user-farm-motion-20261026/`和本轮交付QA，普通提交和推送main，不部署。实查本地与实时远端main均为`043a2ec525b5d0729cb456bdd079b30adc5f65d6`；没有待同步的远端后续提交，也没有重装依赖、改变原素材字节/许可或领域规则。

提交前对同一源码再次执行typecheck、lint、**420/420单测、19/19动作/模型/城堡相关E2E、build、assets:verify，均exit0**；入口仍为index-DMp403iC.js，既有500KB提示保留。命令/退出码见`artifacts/qa/user-farm-publish-20261026/commands.json`。未无故重录前轮已完成的正常速度生产QA，源码SHA与本轮开始一致；未重跑全量verify，旧prototype暂停PNG失败及真人/手机/最终美术/性能待验状态保留，不用范围通过代替全量通过。

独立只读范围审查通过：任务QA82文件、82,370,236字节，最大43,720,719字节，无超过50MiB文件；9份WebM均合成画布、非真人录像，未发现外部可复用账户凭据或原PROGRESS全文副本。原始失败trace保留测试服务的localhost Vite临时WebSocket nonce，未改写原始证据；4173/4174测试服务结束后已核查关闭。原有53行无关PROGRESS（43行旧安装/接续、4行城堡预览、6行本次开发前启动预览）用单独暂存版本排除，继续保留本地；旧74份handoff/trace文件均不纳入，SHA逐一核对。复核前备份1,799份历史QA，重生成文件另存本轮regression后按备份恢复，全部SHA一致，见qa-restoration.json；明确文件清单与保留核对见scope/preservation记录。未reset/clean/强推，实际提交SHA、推送及远端一致性由聊天交付回执确认。

## 最新追加：用户人物现有挥砍与行走动作接入（2026-10-26）

用户澄清“锄地”指现有挥砍，并选择补挥砍和行走。本轮在main、HEAD `043a2ec`上增量实现，不新增训练任务或识别动作。设计/计划见`docs/superpowers/specs/2026-10-26-user-farm-motion-design.md`与对应plans文件；保留原有未提交PROGRESS和旧handoff/trace，未安装、提交、推送或部署。

### 实现

`UserLoadCharacter`新增显式farm范围，旧默认load适配与原断言保留；NPR农场启用farm，同一原FBX/17派生骨架显示挥砍、装车与行走。新增`UserFarmChopMotion`按现有ready/chop-down/chop-return驱动有限准备/下挥/回收区间，阶段停留不会自动循环；由实际刀尖测量修正树干近侧落点，退出挥砍恢复局部握指几何。`UserWalkMotion`消费既有stride，交替抬脚/摆臂，测量原鞋底并以保长IK维持足底高度；push/pull双掌接既有车把。FarmWorld只更新表现接入、准确标签与真实手/脚/刀尖诊断，路径、控制器、识别门限、计次、库存及有效持姿时长不变。

独立审查发现提前回收会跨过样片未显示的下挥；真实FBX在16/50/67ms下挥后回收均复现触木。新增负例保留，改为从当前显示骨骼/工具姿态直接回收，并重新约束手脚IK。首次以刀尖插值产生左握点约5.98cm偏差，严格握持断言失败后改用实际上握点为插值支点；早回收中再次准备/下挥仍从显示姿势接续。旧第7版正常采样路径和装车动作不重做，原挥砍/装车/负例全部保留。

### 本轮验证与证据

证据根目录`artifacts/qa/user-farm-motion-20261026/`；完整实际命令/退出码见`commands.json`。

| 命令/检查 | 退出码与结果 | 记录 |
|---|---|---|
| farm真实FBX缺失动作复现 | exit1，3失败/1通过，命中挥砍/步行仍为静态；浏览器红测手高范围0（期望>.04m） | farm-red.log、farm-e2e-red.log及e2e-red-results/ |
| locomotion几何与接续红绿 | 首轮8/10失败，最终exit0、12/12；推车切入握点偏离11.1cm负例保留 | walk-*.log |
| 提前回收与握持红绿 | 提前回收3失败；首次插值握持1失败；最终34/34范围通过 | early-return-*.log、grip-transition*.log |
| `npm run typecheck`、`npm run lint` | exit0；最终build内再次strict类型检查，最终lint通过 | typecheck-first.log、lint-final.log、build-final.log |
| `npm run test:unit` | 最终exit0，53文件**420/420** | unit-final.log |
| `npm run test:e2e -- tests/e2e/user-farm-motion.spec.ts tests/e2e/user-load-motion.spec.ts tests/e2e/user-models.spec.ts tests/e2e/castle-model.spec.ts --output artifacts/qa/user-farm-motion-20261026/e2e-final-results` | 最终exit0，**19/19**，含真实刀尖/局部脚步变化、暂停/恢复/重置、15份木材守恒及模型/资源负例 | e2e-final.log、farm-motion.json、farm-pause-reset.json |
| `npm run assets:verify`、`npm run build` | exit0；入口index-DMp403iC.js，原500KB提示保留 | assets.log、build-final.log |
| 4176生产构建正常速度画布捕获 | 最终exit0；挥砍3.6秒、walk/push14秒、装车3.6秒、pull3.6秒，共4份合成WebM、8张解码帧及暂停截图；0页面错误/外源/摄像头申请，pull暂停350ms身体/进度冻结 | production-final.log、production/production.json、WebM/PNG |

正常速度实际查看了举斧、触木、回收、步行、推车、拉车与装车画面。捕获脚本前两次exit1：首次静止阶段rAF时间没有对应的新视频帧，严格解码拒绝；改为只选实际绘制revision。第二次用“推车”标题子串等待carry却匹配到装车标题，正确因缺少pull样本失败；改为等待实际pull模式后完整成功。原录像、成功局部导出和失败日志保留在production/iterations与相应log，未改业务时钟/速度、放宽断言或伪造截图。

测试前备份**1,717**份历史QA；4份旧装车输出重生成后另存本轮regression，再恢复原SHA，全部一致，见qa-restoration.json。原源码素材/许可不改，SOURCES及用户模型README只追加来源/派生说明。独立只读审查及执行记录见review.json、execution-ledger.md。

已在Codex可见浏览器重新打开`http://127.0.0.1:5173/?art=npr-sample`并确认自动模拟推进至15/15挥砍及休息推车，实际DOM为user-fbx-farm-motion、assets=ready；保留标签页和既有5173服务。初始异步资源未完成时界面短暂显示不可用文案，资源就绪后自动进入流程，无持续错误；未扩展处理这个既有加载文案。临时4176生产预览已停止。

限制：本轮仅范围验证，未重跑全量verify，旧prototype暂停PNG断言失败仍待处理；真实摄像头/手机、最终美术及约60fps仍未作本轮验收。步态是既有stride驱动的程序IK，不是动捕、完整世界接触锁定或全身碰撞；已有路径的瞬移/转向安排不被本轮重写。下一步由用户查看动作效果决定精修，未commit/push/部署。

## 最新追加：挥工具与行走动作需求核对（2026-10-26，待范围确认）

用户查看预览后提出“锄地的动作没有，步行的动作也没有，请加上”。只读核对确认`UserLoadCharacter`仅在`mode=work && !chopping`显示派生骨架，其余使用原静态人物；现有流程为砍树/装车/拉车，没有独立锄地任务。已询问“锄地”指现有挥砍还是新增任务，建议先补现有挥砍与各段行走，等待用户澄清；尚未修改生产源码、测试、素材或领域流程。

本轮已读相关指南/契约并委派只读接入调查：可利用现有17骨架、局部rev7挥砍与`WorldActor.mode/pose/stride`；rev7固定7.1秒样片不能自动循环代替输入阶段。其握指适配会修改派生几何，跨回装车/步行须恢复；局部木桩刀尖与现有树干摆位不同，需实际接触适配后再验证，不能原样挂上宣称对准。未运行测试、未新增依赖或外部素材，未commit/push/部署；原有未提交记录和QA保留。下一步范围确认后形成小设计、失败断言和最小实现，继续验证暂停/复位、手脚接触、阶段切换与装车回归。

## 最新追加：装车抛木动作及精修提交、推送main授权（2026-10-25）

用户明确要求“提交push”，本次纳入前两轮尚未提交的装车专用人物适配器、抛木/托举/腕部与胸肩精修、FarmWorld接入与真实手锚、对应测试/来源说明/两份计划，以及`user-load-motion-20261025/`、`user-load-polish-20261025/`和本轮交付验证记录。只操作main普通提交和推送，不部署。原素材/许可、领域/识别/输入参数不变。

实查本地与实时远端main同为`f789265c3bc045eb4080d33cea2865428a78850b`。提交前重新运行typecheck、lint、**398/398单测、17/17装车/模型/城堡相关E2E、assets:verify及build，均exit0**，入口仍为index-0PGUqW7Z.js；实际命令/退出码见`artifacts/qa/user-load-publish-20261025/commands.json`。原完整验证的prototype暂停截图失败仍未解决，本轮不重跑全量verify或扩展修复。两轮任务QA共113文件，最大44,520,606字节，无超限文件；录像仅为合成WebGL画布，摄像头申请为0，无真人视频。独立只读范围审查通过。

PROGRESS采用单独暂存版本：仅HEAD既有记录、本次装车新增记录和本节；旧安装/接续43行与本地城堡预览4行，共47行，继续原样保持未提交。旧`local-handoff-20261025/`、`source-lifecycle-20261025/progress-before.md`及旧110MB原trace均不纳入。新验证重生成的4份旧动作E2E输出先另存本轮regression，再按备份恢复；1,701份历史QA SHA均一致。原无关文件SHA与暂存范围核对见本轮preservation/scope记录。没有reset/clean/强推、重装依赖或更改旧证据；实际提交SHA、推送与远端一致性由本聊天交付回执确认。

## 最新追加：装车抛木自然度与发力节奏精修（2026-10-25）

用户确认摄像头模式已跑通，并明确选择“装车抛木：更自然、有力度”。本轮只精修装车表现，不改变摄像头标定/识别参数、计数、库存或输入契约；摄像头流程通过为用户报告，本轮没有额外采集真人视频或关键点轨迹，也不据合成录像宣称真人识别准确率提升。继续在main、HEAD `f789265`及前轮未提交工作上增量处理，无commit/push/部署。

`userLoadMotion.ts`保留同一phaseMs与单一手Y/Z通道：举木目标前移0.22世界单位，腕部随托举连续转向（最大约0.6rad）；站起时手部170ms、髋腿原140ms，先展开髋膝再带起木材；离手前80ms轻前上随动并增加小幅胸肩前倾，随后前送并在360ms内回位。腕角和胸肩偏移都从当前显示值接续，早切下一动作不突然归零。未增加蹲深、改变脚底、骨长、原rig、源FBX/UV/贴图，其他动作范围保持不变。

真实FBX新增4项断言：当前尺度下头部主要蒙皮顶点与实际0.86长/0.17最大半径木材包络的采样净空>2cm；离手前80ms掌心不下降超过2.5cm且继续前移；站起100ms髋的归一化展开进度领先掌心>0.12；胸肩前随被早切时头部不跳。原12项motion及6项adapter负例不改。初次3项新增失败，另捕获胸肩中断约6.94cm跳变；尝试从实际掌心重设目标会触发旧短回收连续性失败，已撤回并保留日志，最终沿用原连续目标通道并统一腕/胸肩衔接。净空只是局部顶点/包络代理，不是完整三角网格碰撞检测或逐指握持验证。

证据在`artifacts/qa/user-load-polish-20261025/`，实际命令/结果见`commands.json`：

| 命令/操作 | 实际结果 | 证据 |
|---|---|---|
| 精修真实FBX红绿验证 | 初次exit1，3失败/12通过；最终exit0，motion16+adapter6，**22/22** | unit-red.log、unit-green.log；中间试验及胸肩中断red日志保留 |
| `npm run typecheck`、`npm run lint` | 均exit0 | typecheck.log、lint.log |
| `npm run test:unit` | exit0，51文件**398/398** | unit-all.log |
| `npm run test:e2e -- tests/e2e/user-load-motion.spec.ts` | exit0，**2/2**；15木整局、真实手锚变化、暂停/恢复/重置、库存守恒均通过 | e2e-motion.log |
| `npm run assets:verify`、`npm run build` | 均exit0；入口index-0PGUqW7Z.js，旧FBX贴图支持警告和500KB提示保留 | assets.log、build.log |
| 正常速度4176生产捕获 | exit0，约3.60秒合成WebGL录像、5张解码帧及暂停图已查看；0页面错误/外源/摄像头申请，暂停350ms手/计数冻结 | production.log、production/normal-load.webm及production.json |

独立只读审查无阻塞，见`review.json`。记录1,664份既有QA SHA，4份旧装车E2E输出被重生成后先存本轮regression，再按备份恢复，全部历史SHA一致，见`qa-restoration.json`。原有PROGRESS全文、前轮装车代码/证据及旧handoff/trace均保留；原资产和领域/识别/输入/计时源码未改，见`preservation.json`。仅沿用既有依赖/浏览器，没有重新安装或升级。

本轮没重跑完整verify，旧prototype暂停截图字节失败仍未处理；真人识别准确率、真实手机、完整握指/碰撞、最终美术和约60fps等限制不因本轮精修而自动通过。临时4176捕获后关闭，5173预览保持可用；刷新`/?art=npr-sample`后看装车动作，等待用户审阅。

## 最新追加：NPR用户人物装车抛木动作（2026-10-25）

用户指出当前NPR页“抛木头没有动作”，要求补上。实际浏览器失败测试复现：装车各阶段真实手锚高度变化为**0**（期望>0.04m），整局仍可结算；代码确认FarmWorld使用的`UserStaticCharacter`只更新位置/yaw，木头轨迹已有而人物不随装车阶段变形。本轮在main、HEAD `f789265c3bc045eb4080d33cea2865428a78850b`上增量处理，保留原有47行未提交PROGRESS及旧QA/trace；没有新的commit/push/部署。

### 实现与范围

新增`userLoadCharacter.ts/userLoadMotion.ts`，复用既有用户FBX派生17骨架，仅装车工作阶段显示派生身体并隐藏斧头，补上下蹲抱木→站起→举木→向车内抛送→收手。其他砍树/行走/推拉继续显示原静态网格；原静态适配器和独立第7版挥砍样片保留。没有新素材、依赖、源FBX/UV/贴图或许可改动；原始FBX仍无原生骨架/动画，这些是本地派生表现。

手部使用一条显示位置通道，从当前Y/Z接续下一阶段；普通转换140ms，抛送140ms前随后至360ms回位。躯干继续复用NprMotion，双臂/腿IK保留肢长与脚底支撑。实际双掌世界中点接入已有木头持有/飞行锚点，既有600ms飞木和唯一库存提交规则不改。暂停/无效/长间隔不补动画；会话、任务实例或sourceEpoch变化显式复位半次表现，迟到加载/失败/销毁沿用单一资源所有者释放。未修改SessionController、输入或识别门限。

审查与真实FBX负例复现了完整回收→ready上跳、短回收→ready后退、下一下蹲接续不一致；局部补丁未覆盖所有边界，最终统一显示手通道解决，所有负例保留。原测试只更新2处被用户新动作替代的静态人物标识为`user-fbx-load-motion`，没有删除或放宽业务断言。NPR标签明确“装车局部动作，其余静态”。实施计划见`docs/superpowers/plans/2026-10-25-user-load-motion.md`。

### 本轮真实验证

证据：`artifacts/qa/user-load-motion-20261025/`；`commands.json`保留实际命令/退出码，失败和中间结果均不当作最终成功。

| 验证 | 实际结果 | 证据 |
|---|---|---|
| 原NPR装车浏览器复现 | exit1，手锚高度变化0，明确命中缺失人物动作 | e2e-red.log、e2e-red-results/ |
| 真实FBX动作/生命周期红绿测试 | 初次10失败/1通过；首次实现11/11；追加连续性负例后最终**18/18通过**，失败日志保留 | unit-red.log、unit-green.log、continuity-*.log、short-return-*.log、next-cycle-*.log、channel-green.log |
| 最终`npm run test:unit` | exit0，51文件**394/394** | unit-release.log |
| typecheck/lint及最终build | exit0，最终入口index-D64wH9nD.js；build包含strict类型检查，旧500KB提示保留 | typecheck-final.log、lint-release.log、build-release.log |
| 模型/城堡/NPR/新装车4文件E2E | exit0，**27/27**，1.9分钟；此后连续通道精修仅影响新装车表现 | e2e-related.log |
| 最终通道后装车E2E再次运行 | exit0，**2/2**；15木整局、实际手锚移动、暂停/恢复/重置及库存守恒均到达 | e2e-release.log、load-results.png及样本JSON |
| 最终`npm run assets:verify` | exit0，原件/贴图/许可校验通过 | assets-release.log |
| 4176生产构建正常速度自动演示 | exit0，等真实流程到装车后录合成WebGL画布约3.61秒，5张解码帧与暂停截图已实际查看；0页面错误/外源/摄像头请求，暂停350ms手锚/计数不变 | production-release.log、production-final/normal-load.webm、production-final/production.json |

首轮录像也真实完成，但导出姿态标签与画面落后一阶段。尝试等待requestVideoFrameCallback后PNG字节仍相同，原假设不成立，原录像/帧和有限诊断均保留。进一步检查发现时间原点用异步MediaRecorder.onstart，较start请求晚约127ms；改为start前同步记录并分别保存事件/停止时刻，最终重新录制并核对下蹲、举木、离手飞行画面。没有修改业务速度或按猜测给录像加固定偏移。录像只含合成3D画布，无真人视频/音频；不能当作真人输入验收。

独立只读审查最终无阻塞，见`review.json`。测试前记录**1,588份**历史QA SHA，4张NPR截图被重生成后先存本轮regression，再按备份原字节恢复，全部历史SHA一致，见`qa-restoration.json`。原有未提交PROGRESS全文、旧handoff和trace及所有原FBX/贴图均保留，见`preservation.json`。未重新安装依赖、升级版本、提交/推送或部署。

限制：没有完整逐指握木、衣物/全身自碰撞，其他农场阶段仍静态；最终美术、真人摄像头/手机与约60fps仍待验。本轮未重跑全量verify，先前prototype暂停截图字节断言失败仍未修复，不用27项范围通过代替全量。5173开发预览保持可用，刷新`/?art=npr-sample`后在装车阶段查看；临时4176检查后关闭。

## 最新追加：城堡模型与贴图限定范围提交、推送main授权（2026-10-25）

用户已确认“效果可以”，明确要求将本次城堡模型、贴图和对应验证记录提交并推送main，保留此前无关未提交工作、不部署。本次授权覆盖前述制作阶段“不提交/推送”的历史停点；未改变源模型公开许可状态，不购买、不部署、不修改旧素材许可。

实查本机main与实时远端main均为`94148c2caa14327625a7d5f7ae4f7eefd421f78d`，没有需要同步的后续提交。提交范围为城堡接入、近景/窄屏视角、启动/素材门禁、独立颜色图集与烘焙工具、来源记录、相关单测/E2E、两份设计计划，以及`added-model-20261025/`、`castle-texture-20261025/`和本轮交付QA。两轮城堡QA共183文件，最大文件34,704,772字节，无超限文件；真实失败/中断trace和历史QA恢复清单均保留，不把失败改写成成功。独立只读范围审查通过。

提交前对同一应用代码再次实际执行：typecheck、lint、**376/376单测、15/15模型相关E2E、assets:verify、build全部exit0**，入口仍为index-DCEqkxT-.js；日志/退出码见`artifacts/qa/castle-publish-20261025/commands.json`。未重跑完整verify；此前完整E2E81/82中的prototype暂停截图失败仍未解决，保留原失败证据，不扩展修复。已有FBX贴图支持警告与500KB构建提示不隐藏。

对PROGRESS单独构造暂存版本，只收录HEAD已有记录、本次城堡新增记录及本节；此前43行接续/安装记录继续原字节留在工作区。整个`local-handoff-20261025/`、旧`source-lifecycle-20261025/progress-before.md`和旧110,250,431字节trace均排除提交，保存SHA并核对。采用明确文件清单暂存，普通提交/推送main，不强推、不reset/clean/重克隆；实际提交SHA、远端核对与剩余未提交工作由本聊天交付回执确认。预览仍可在本机5173访问，未对外部署。

## 最新追加：城堡柔和卡通贴图已接入（2026-10-25）

用户已选择“柔和卡通石堡（推荐）”，授权按石墙、深色门窗与少量苔藓山岩补做贴图。使用本机main、HEAD仍为`94148c2caa14327625a7d5f7ae4f7eefd421f78d`，在既有未提交城堡成果上增量处理；本轮未commit/stage/push/部署。短设计与实施计划见`docs/superpowers/specs/2026-10-25-castle-texture-design.md`和对应plans文件，不重新安装或生成项目。

### 最终内容与边界

内置imagegen按记录提示词生成`castle-materials-v1.png`（1254²，石墙/山岩/木板/苔藓四区），没有上传FBX。`scripts/bake-castle-texture.mjs`只读第一份城堡，离线投射并烘焙到原UV，输出`castle-soft-toon-v1.png`：**2048² sRGB、7,761,436字节**，SHA256=`6dcce6629be39749c8f04b67e2ac94f7bb8f4310a65ee9f44e43b71cebd5c288`。四区采样内缩8px并镜像重复，原UV空白扩展8px；颜色显式sRGB解码、线性混合再编码，不烘焙场景光照。现场查看首图后排除低层非门窗凹面木色、将后方山岩连续着岩色，原首图/图集/脚本与报告在`iterations/`保留。最终为17块几何近似凹槽木色（326三角），没有新增门窗网格；山岩/建筑分区仍是人工近似，不能称原作者语义材质。

运行时仅城堡增加一张独立颜色图，仍使用原Soft Toon及原UV；有图时白色base保留图色，无图prepare仍保留源灰色。`loadUserModel`等待本地fetch、图片加载与decode后才放行ready，缺失/解码失败显式报错，不静默退灰模。新纹理在等待前交给源资源所有者，成功、失败与取消后的迟到结果均沿用释放路径，blob URL在finally撤销；取消仍为迟到后释放，未新增abort架构。人物/房屋加载分支、训练领域/输入/计数/计时、依赖与锁文件均未改。

两份用户源文件、既有三份FBX字节/几何/UV不变；第二份仍因无贴图未替换。新材质是补做美术，不能恢复缺失原图，不标CC0或PBR。来源、完整提示词、两PNG/脚本SHA见`public/assets/user-models/castle-soft-toon-v1.provenance.json`与`castle-texture-prompt-v1.txt`，`assets:verify`新增相应尺寸/字节/SHA检查，没有更改旧资产校验值或许可。

### 本轮真实验证

证据在`artifacts/qa/castle-texture-20261025/`，实际命令/退出码见`commands.json`。

| 命令/操作 | 实际结果 | 日志/证据 |
|---|---|---|
| 定向模型单测红绿验证 | RED exit1，4失败/9通过；GREEN exit0，13/13；保留源灰模断言 | runtime-red.log、runtime-green.log |
| `npm run typecheck`、`npm run lint` | 均exit0 | typecheck.log、lint.log |
| `npm run test:unit` | exit0，49文件**376/376** | unit-complete.log |
| `npm run test:e2e -- tests/e2e/castle-model.spec.ts tests/e2e/user-models.spec.ts` | exit0，**15/15**；包含新PNG404与延迟ready门禁，原人物/房屋/URL撤销及迟到释放断言保留 | e2e-models.log |
| 最终图集后`npm run test:e2e -- tests/e2e/castle-model.spec.ts` | exit0，**6/6**再次通过 | e2e-castle-final.log |
| `npm run assets:verify` | 最终exit0，旧素材与两份新颜色PNG/提示词/烘焙脚本通过 | assets-final.log |
| `npm run build` | 最后exit0，入口index-DCEqkxT-.js；旧500KB提示保留 | build-refined.log |
| 本地UV烘焙`node scripts/bake-castle-texture.mjs` | 最终exit0，原件SHA未变、UV覆盖约57.52%、0外源/页面错误；首次因Three未导出package.json而exit1，改为既有入口定位后成功 | bake-first.log、bake-render.log、bake-refined.log、bake-report.json |
| 4176实际生产构建运行`capture-texture.mjs` | 最终exit0，普通/NPR正反面与390×844窄屏共5PNG均已查看；2次颜色PNG响应200、0页面异常/外源/摄像头申请，本机Apple M4 Metal | production-final.log、production/capture.json及PNG |

生产捕获的前两次exit1保留：首轮严格收集console发现404，补充资源URL后确认只有浏览器自动请求的`/favicon.ico`404；新捕获脚本仅单列这个精确URL/错误文本，原consoleError仍完整保存，其他错误仍使捕获失败。没有修改产品、旧测试或泛化放宽断言；不能写成“控制台零错误”。本轮没重跑完整verify/全量E2E，上一轮prototype暂停截图字节断言失败仍未解决，不用本轮15项通过替代全量结果。

独立只读审查确认资源释放/颜色空间/来源和正反面未见阻塞，见`review.json`。对本轮前1,808个工作区文件记录SHA，其中**1,539份历史QA完全一致**，没有覆盖重生成、无需恢复；此前未提交的城堡代码/素材、PROGRESS全文和本机handoff等均保留。原FBX/其他素材SHA、旧断言及空暂存区核对见`preservation.json`。新增7.76MB静态PNG和6万面城堡没有性能达标结论；最终美术、真实手机/摄像头及约60fps仍待验。

预览仍为本机5173的`/?art=npr-sample`或普通首页，关闭计划弹窗后点“城堡近景”；`npm run dev`可重启，按实际端口访问。临时4176生产检查后停止，5173保持本地预览；后续等待用户审阅贴图，不自动扩展其他待办或外部交付。

## 最新追加：城堡补做贴图可行性核查（2026-10-25）

用户询问能否给当前城堡加贴图。本轮只读检查确认原UV可用：180,000项与展开顶点对应，坐标约[.001,.999]，无非有限/越界，60,000三角中无零面积UV；共享边粗判约504个UV岛。原UV适合按模板制作/烘焙图集，直接套通用石纹不能保证各部位正确；三平面映射可用于平铺石纹，但门窗/山岩仍需区域区分。报告见`artifacts/qa/castle-texture-20261025/uv-inspection.json`。这只能补做新美术，不能恢复无贴图源文件中的原作者贴图。

已询问卡通石堡/写实石堡外观偏好，推荐与现有田园场景协调的柔和卡通石墙、深色门窗与少量苔藓山岩；尚未生成贴图或修改产品代码。检查后FBX SHA未变，原有未提交工作保留；未跑与只读核查无关的测试、安装、commit/push或部署。下一步按用户确定的外观方向制作可审阅贴图效果。

## 最新追加：用户城堡FBX入场与第二份贴图核查（2026-10-25）

用户要求检查`model2b63561bfbee01.fbx`，能打开就加入场景；随后补充`modelabd4643519d001.fbx`，仅在有贴图时替换。继续使用本机main、HEAD `94148c2caa14327625a7d5f7ae4f7eefd421f78d`；该HEAD此前已推送，本轮未commit/push/部署，保留原有未提交工作。证据独立保存在`artifacts/qa/added-model-20261025/`。

### 素材结论与场景范围

两份都是可解析的FBX7400，各1网格/1灰色Phong材质、60,000三角面，无骨骼、Skin或动画；**两份均没有Texture/Video对象、内嵌图片或外部贴图引用**。第二份几何不同，但并非带贴图版本，所以按用户条件未替换、未收入应用素材。第一份原字节复制为`public/assets/user-models/castle.fbx`，SHA为`9e9eb6ca8ed8de21894a9063fcf0b8d9ba09917298e6c6308584205fba831ede`；第二份检查SHA为`a515a25354b81a2a55cd129217aa67456b9e9dbfaa503bcf8aec51576b4b0c06`。两份用户源文件及既有character/house原件未修改。保留灰色材质，没有生成或虚构贴图。公开再分发许可仍未确认。

第一份城堡及附带山岩接入普通农场与NPR局部场景，在西侧空地`[-24,.025,-9]`统一缩放至12世界单位高并落地；原树木、道路、围栏与房屋未移动。沿用已有异步素材挂载/释放机制，不投射高面数阴影；素材未完成时关闭开始门禁，失败显式报错。新增“城堡近景”，按实际包围盒与窗口比例取景；近景仅关闭城堡自身雾效，返回全景或开始训练即恢复，窄屏重算取景。NPR人物仍为原静态适配，独立第7版动作样片未扩展到农场。SessionController、输入/姿态识别、计数/持姿规则和依赖锁文件均未改。

对应文件：`userModel.ts`、`userHouseMount.ts`、`FarmWorld.ts`、`createGame.ts`、`browser.ts`、`index.html`及窄屏控制布局，素材清单/校验脚本、`.gitattributes`字节保护和来源记录。新增真实FBX规格与挂载单测，以及4项城堡E2E，覆盖真实模型、加载失败、训练切镜后缩放、启动门禁。审查发现并以失败测试复现两处问题后修复：训练切镜时清除城堡视角标记；初始HTML中的接受任务按钮保持disabled，等动态模块安装事件及素材就绪后由现有逻辑启用，避免inert启动期间丢失点击。原E2E断言、超时、重试、识别门限未改。独立只读审查见`review.json`。

### 本轮实际验证（完整verify未通过）

命令、退出码及中间失败/中断均保留在`commands.json`，不能用定向通过代替全量通过。

| 命令/操作 | 实际结果 | 证据 |
|---|---|---|
| 真实源文件结构检查及浏览器前/后预览 | 第一份可打开；两份均无贴图 | inspection.json、second-file-inspection.json、source-preview/ |
| 相关单测红绿验证 | 初次3失败，最小实现后14/14通过 | unit-red.log、unit-green.log |
| `npm run test:e2e -- tests/e2e/castle-model.spec.ts`，最终启动门禁修复后 | exit0，4/4通过；此前各失败测试保留 | startup-green.log及对应red日志/trace |
| `npm run verify`，最后完整轮 | **exit1**；typecheck/lint通过，49文件**372/372单测**；**81/82 E2E**，9.9分钟；链式尾部build未执行 | verify-complete.log、verify-complete-results/ |
| 原样定向`npm run test:e2e -- tests/e2e/character-motion.spec.ts -g 'pause freezes rendered bones'` | **exit1**，同一暂停截图断言再次失败 | character-pause-recheck.log、character-pause-recheck-results/ |
| `npm run build`，最后代码单独构建 | exit0，入口index-CjSGTE-J.js；原500KB提示保留 | build-complete.log |
| `npm run assets:verify` | exit0，现有资产与3份用户FBX校验通过 | assets-complete.log |
| 实际4176生产构建执行`capture-scene.mjs` | exit0；普通/NPR全景、城堡近景及390×844窄屏共5PNG，已实际查看；0页面错误、0外源、未申请摄像头；本机Apple M4 Metal | capture-complete.log、production/capture.json及PNG |

完整轮中，城堡4项、摄像头整局与休息停帧原用例均通过。唯一失败为旧`model=prototype`人物页`character-motion.spec.ts:17`第25行，两次暂停canvas截图PNG字节不相等；时间断言已通过。trace显示暂停后的time=0.6001、斧头锚点和paints=24始终冻结，网络没有请求FarmWorld/browser或城堡，相关prototype实现/素材/CSS无diff。尚未确认PNG差异原因，不能据此断言骨骼仍在运动、归因为性能或声称与本轮无关；未修改该页或放宽断言，保留待查。详见`prototype-pause-observation.json`。

另有两次早期完整verify被主动中断（exit130）：第一轮为处理审查发现的切镜标记问题，第二轮为处理启动丢点击问题。第二轮失败trace与确定性startup-red测试证明旧按钮在动态模块启动期间可接到无效点击，最小修复后本轮完整摄像头用例通过；这些中断均不记为完整通过。

测试前备份1,395份既有QA；34份被重生成文件先另存本轮`regression/`，再恢复原字节，全部历史SHA一致，见`qa-restoration.json`。既有未提交PROGRESS全文及本机handoff证据保留，未暂存。未重新安装依赖或浏览器。真实摄像头/手机、最终美术、约60fps仍待验；新增60,000面城堡没有性能达标结论。

预览：本轮实际执行`npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`，5173启动成功，`curl`检查NPR入口HTTP200/exit0；开发预览保留运行，临时4176生产服务已停止。打开`http://127.0.0.1:5173/?art=npr-sample`或普通首页，关闭计划弹窗后点击右上“城堡近景”；“全景视角”可返回。第二份没有贴图，当前继续展示第一份。后续等待用户提供带贴图版本或其他明确指令，不自动处理其他旧待办、提交、推送或部署。

## 最新追加：本轮E2E修复限定范围提交与main推送授权（2026-10-25）

用户在上述验证完成后，明确要求仅提交这次E2E修复和对应验证记录并推送main，保留原有未提交工作，不部署。本轮提交范围为`source-lifecycle.spec.ts`的Chromium模式修复、上一节排查与验证记录及`artifacts/qa/source-lifecycle-20261025/`本轮证据；原有PROGRESS的43行本机接续/安装记录、整个`local-handoff-20261025/`、`progress-before.md`旧记录副本均不纳入提交，原字节保留。

推送前实查本地与远端main仍为`20aceb2`，应用/测试代码与本轮已通过369单测、78E2E及build的版本一致，交付阶段不重复安装或无理由重跑全量验证。新增归档处理：一份110,250,431字节的失败试验trace超过单文件限制，原ZIP保留本地，提交三份不超过40MiB的无损分卷、SHA清单及`restore-trace.mjs`，可完整还原；其余诊断与成功/失败日志不删减。执行时单独构造PROGRESS暂存版本，并核对暂存diff、素材/历史QA SHA与旧工作保留情况；只执行普通main推送，不强推、不合并其他分支、不部署。实际提交与远端核对结果见本聊天交付回复。

## 最新追加：本机两项摄像头E2E排查与最小测试修复（2026-10-25）

用户授权仅排查前轮两项失败、确认原因后最小修复并验证，明确不commit/push。继续在本机main、HEAD `20aceb2ee6e3ae98d9fdce0032b30eacb85e15cf`上增量处理，保留既有未提交PROGRESS和`local-handoff-20261025/`。本轮证据独立保存于`artifacts/qa/source-lifecycle-20261025/`，实际测试命令/退出码见`commands.json`，诊断汇总见`diagnosis.json`。

### 原因与修复边界

原样复跑首次1/2通过，休息用例仍在砍树阶段提前失效。临时仅通过测试路由插桩，捕获两项分别因相邻样本间隔**207.5ms / 246.3ms**超过既有200ms门限而`invalidate('gap')`，再由`browser.ts`的onFrame要求重新准备；对应帧返回年龄仅0.5ms / 0.4ms，视频时间正常前进，没有捕获到>100ms的bitmap读取耗时。根因链路是浏览器运行中的采样回调迟到触发既有安全门禁，并非漏加次数或真实摄像头硬件故障。临时日志保存于`diagnostic-37.json`、`diagnostic-68.json`及对应trace；未把reset后的通用提示当作原始原因。

单变量对照：关闭trace连续截图仍0/2通过，不能单独归因截图；DPR降至0.5仍2/4通过，不能作为修复。这两项试改均已撤回。实查锁定Playwright：默认headless使用`chromium-headless-shell`，本机WebGL为SwiftShader；指定`channel:'chromium'`使用已安装的完整Chromium新headless模式，本机实际为**Apple M4 / ANGLE Metal**。两者同为现有revision1248、Chromium156.0.8078.4，没有新安装或升级。上述对照定位本机测试浏览器/软件图形运行路径造成的时序不稳定；没有进一步声称定位了驱动内部某个耗时函数，或已经修复产品性能。

最终代码差异只有`tests/e2e/source-lifecycle.spec.ts`的浏览器选择`channel:'chromium'`及一行解释。恢复默认DPR与原trace，保留真实Three.js、CameraService、PoseWorkerClient、识别器与领域；所有原断言、200ms/300ms门限、超时、重试和输入夹具均未修改。去掉浏览器选择与注释后，其余测试文件字节与HEAD完全一致，见`assertion-preservation.json`。应用源码、素材、许可、依赖、锁文件与.gitattributes无改动。独立只读审查无阻塞项，见`review.json`。

### 本轮实际验证

| 命令 / 操作 | 实际结果 | 证据 |
|---|---|---|
| 原样定向两项`npm run test:e2e -- tests/e2e/source-lifecycle.spec.ts -g 'synthetic camera pipeline\|a stalled camera'` | exit1，1通过/1失败；保留真实失败 | reproduce.log、reproduce-results/ |
| 临时插桩定向两项 | exit1，均明确捕获gap | diagnostic.log、diagnostic-results/及diagnostic-*.json |
| 仅关闭trace截图，休息用例重复2次 | exit1，0/2；试改撤回 | screenshotless-diagnostic.log、screenshotless-results/ |
| 仅DPR0.5，两项各重复2次 | exit1，2/4；试改撤回 | density-half.log、density-half-results/ |
| 最终模式`npm run test:e2e -- tests/e2e/source-lifecycle.spec.ts -g 'synthetic camera pipeline\|a stalled camera' --repeat-each=2` | **exit0，4/4通过，4.2分钟**；完整结算与休息停帧原断言均实际到达 | chromium-channel.log |
| `npm run verify` | **exit0**；typecheck/lint、49文件**369/369单测**、**78/78 E2E（9.1分钟）**、build全部通过；命令总554.6秒 | verify.log |
| `npm run assets:verify` | exit0，模型/运行文件、SVG、Three许可、NPR、CC0与两份原FBX校验通过 | assets-verify.log |
| 实际4176生产构建执行`node artifacts/qa/source-lifecycle-20261025/production-smoke.mjs` | exit0，实际Apple M4 Metal、DPR1、1366×768 Three画布，入口`index-D08wYbcD.js`，0页面错误/外源请求，无摄像头申请；已实际查看截图 | production-smoke.log/json、production-main.png |

原有500KB构建提示和FBX不支持部分贴图的警告保留；负例测试预期的故障日志没有删除。生产检查为普通首页，不是新真人整局、60fps或最终美术验收；临时4176预览检查后停止。没有重跑npm ci/assets:sync或下载浏览器。

测试前备份并记录**1,307份**既有QA的SHA；本轮**34份**被重生成文件先另存本轮`regression/`，再按原字节恢复，全部1,307份SHA一致，见`qa-baseline.json`与`qa-restoration.json`。前轮失败trace和本机记录保留不动，本轮成功证据另存，不改写历史失败。临时诊断spec已删除，诊断脚本快照只存于本轮QA。

### 保留限制与停点

本轮修复测试浏览器选择，不能据此声称默认headless-shell的软件GL负载已优化，也不能把合成视频/关键点通过当成真人识别、真实手机、端到端延迟、约60fps或最终美术验收。其他机器的完整Chromium也不保证硬件GPU；仅安装`--only-shell`的环境需按既有`npx playwright install chromium`安装完整浏览器。本机当前已具备，无需重装。

继续停在`/?art=character-motion&rev=7`人物局部审阅；未扩展全农场、处理其他Minor、购买或部署。无commit/push/合并，HEAD与分支不变。启动仍在本目录运行`npm run dev`并按实际端口访问；本轮不保持预览服务。下一步等待用户开发指令。

## 最新追加：审查、完整验证后合入并推送main（2026-10-24）

用户明确要求“酌情合入main”。本轮核对远端与历史分支：`feature/3d-farm-experience`、T06标定、T07–T11（包括本地额外设计文档提交）均已是最新开发分支的祖先，缺失提交数全部0，无需重复合并。`origin/main=a45116b`也是`codex/npr-farm-sample=8b96cb9`的祖先，因此选择快进合并，保留原提交和开发分支，不重写历史。源应用完整验证与两席独立只读审查通过后，将本地main快进到`8b96cb9`，实际核对Git树与受测开发分支完全相同；`git push origin main`成功，随后远端main与开发分支均实查为`8b96cb91fb0da5c8eea0d25c69edec08b96be791`。本节、README、授权记录与本轮证据随后归档为独立提交同步。

本轮只集成已有局部成果与交付说明，没有修改应用源码/输入/领域/配置/依赖、扩大农场或改变默认入口；旧3D、NPC和静态/原型对照保留，真实设备与最终美术仍按原状态待验。用户已指定以后以新电脑为主开发环境，新电脑可直接`git clone https://github.com/FaithZL/Tidal.git`取得main。

### 本轮实际验证与证据

全部新记录在`artifacts/qa/main-integration-20261024-143440/`：

| 命令或检查 | 实际结果 | 证据 |
|---|---|---|
| `npm run verify` | **exit0**；typecheck/lint、**369/369单测（49文件）**、**78/78 E2E（8.2分钟）**及build全部通过 | `verify.log` |
| `npm run assets:verify` | 合并前、快进检出后均exit0，含两FBX及CC0/NPR原素材 | `assets-verify.log`、`assets-after-merge.log` |
| 祖先关系及快进结果树核对 | 所有历史分支无遗漏；main快进结果与受测分支Git树完全相同 | `merge-context.json`、`merged-tree.json` |
| 校验当前dist/index.html与临时4176预览响应完全相同，设置`TIDAL_GRIP_QA_DIR=artifacts/qa/main-integration-20261024-143440/production`、`TIDAL_GRIP_RECORD=0`运行`node artifacts/qa/user-grip/capture-grip.mjs` | exit0，生产人物/房屋、六阶段逐帧、特写、旋转和窄屏抓图完成；0页面/控制台错误、0外源请求，没有录视频 | `production-capture.log`、`production/capture.json`及15张PNG |

生产检查前旧4176服务已停止，本轮使用工具管理的临时预览会话运行并在检查后正常结束。自动截图不等于用户最终美术批准；390×844仍是桌面Chromium窄屏，不是真手机。最终构建入口仍为`index-D08wYbcD.js`，人物样片仍为`userModelSample-6S0FYXKr.js`；原500KB/FBX贴图警告保留。本轮没有重新`npm ci`/`assets:sync`，没有新真人摄像头、硬件GPU或60fps采样；旧P01 fail与人工待验项不改写。上轮76/78加两项复验的记录保留为历史，本轮78/78是这次新执行的一整套结果。

测试前备份并逐项核对1,177份历史QA；33份被测试覆盖的文件先转存本轮`regression/`，再按原SHA恢复旧路径，见`qa-restoration.json`。本轮只新增独立证据，不用新截图替换旧轮次结论。README更新main接手方式，AGENTS记录本次明确合并/推送授权；后续常规工作仍不自动合并或推送。

### 独立审查与保留待办

两席只读审查均判定可合并，未发现Critical/Important。素材席直接读提交对象核对九份CC0、两FBX与两张NPR PNG哈希；以`core.autocrlf=false/true`只读过滤得到18/18字节及SHA一致，确认不是LFS指针且本地引用完整。运行席核对独立预览不初始化训练/摄像头或改模拟偏好、NPR素材门禁、取消/迟到释放及上下文丢失锁存；完整结果见`review.md`。

保留两项不阻塞合并的Minor，均为静态审查推导，未声称已经浏览器复现或测得GPU泄漏：旧`model=prototype`对照页`src/characterSample.ts:30–31`在pagehide释放后缺少持久化pageshow恢复，BFCache后退可能恢复失效画面；同文件局部`sun.shadow`未纳入显式统一释放。下一步在新电脑按具体任务先复现，再补相应测试并最小修复，暂不扩大本次集成范围。

启动仍为`npm ci`→`npm run assets:sync`→`npm run assets:verify`→`npm run dev`，访问实际端口的`/?art=character-motion&rev=7`；普通`/`维持默认无摄像头模拟规则。继续停在第7版人物局部审阅，等待用户反馈再决定后续开发，不把合入main等同于L2/L3或最终美术验收。

## 最新追加：已推送开发分支供新电脑接续（2026-10-24）

用户明确授权将`codex/npr-farm-sample`推送GitHub，并指定之后以新电脑作为本项目主开发环境。本轮`git push -u origin codex/npr-farm-sample`成功创建远端分支并设置upstream；随后`git ls-remote --heads origin codex/npr-farm-sample main`实查，开发分支为`068ea851f83feb16f40452a1ff4bba6a8f4ce8b3`，`main`仍为`a45116b8fea9d696f482c936a4aabaf79c597f0c`。本节作为后续文档提交同步，不改变已推送的应用基线；没有合并main或部署。

独立只读核对应用提交中的人物源码、两份完整FBX、NPR/CC0动作与许可、锁文件、素材行尾保护、MediaPipe模型/运行文件和1,177份QA均已入Git，不是依赖旧电脑目录的占位指针。未发现必须另从旧机取回的应用运行资产；历史两份独立QA脚本的旧机输入路径限制仍见下节。素材原来源与许可状态保留，本次上传不代表补齐原作者公开再分发许可。

新电脑直接执行`git clone --branch codex/npr-farm-sample https://github.com/FaithZL/Tidal.git`，进入`Tidal`后运行`npm ci`→`npm run assets:sync`→`npm run assets:verify`→`npm run dev`，访问实际开发端口的`/?art=character-motion&rev=7`。浏览器测试首次另需`npx playwright install chromium`。必须显式取得该开发分支，默认main尚不含这批人物/NPR成果；之后从新电脑的现有工作区增量接续，不依赖旧机预览服务或绝对路径。

本轮仅Git同步、文件在提交中的只读检查及进度记录，没有重跑应用测试/构建或新增真机证据；上一轮369单测、E2E分批通过及完整verify非零等限制原样保留。下一步为新电脑安装与本机验证，再停在第7版人物局部审阅；不自动扩展全农场或新增后续推送授权。

## 最新追加：按用户要求提交全部本地改动（2026-10-24）

用户为跨电脑接续工作明确要求“把所有改动都提交”。本轮在当前`codex/npr-farm-sample`分支，将基于`a45116b`积累的源码、测试、文档、NPR/人物动作素材、用户原始FBX和历史QA一并整理为本地提交；原有忽略规则继续排除依赖、构建产物、临时报告、备份与环境密钥。本轮授权为本地commit，没有push、合并或对外部署；本地提交用户FBX不代表其公开再分发许可已确认。下方各轮“未提交”描述保留为当时记录。

### 本轮实际验证、旧测试与迁移修正

日志、失败trace和本轮回归输出在`artifacts/qa/commit-20261024-102313/`：

| 命令 | 实际结果 | 证据 |
|---|---|---|
| `npm run verify` | **exit1**；typecheck/lint、49文件**369/369单测**通过；E2E **76/78通过（9.1分钟）**，因两项失败未执行尾部build | `verify.log` |
| `npm run test:e2e -- tests/e2e/keyboard-flow.spec.ts tests/e2e/deployment.spec.ts -g 'repeat keys\|the supplied character and house load locally'` | **2/2通过，8.6秒，exit0** | `e2e-recheck.log` |
| `npm run build` | exit0，含typecheck/Worker；入口及人物样片仍为`index-D08wYbcD.js`、`userModelSample-6S0FYXKr.js` | `build.log` |
| `npm run assets:verify` | exit0，原模型/运行文件/素材及许可记录校验通过 | `assets-verify.log` |

第一项失败是旧`keyboard-flow.spec.ts`的重复键/焦点/重置用例：`nprVegetation.ts`请求返回`net::ERR_NO_BUFFER_SPACE`，导致动态导入失败并显示启动错误，尚未进入业务断言。trace中该请求无响应体、约2ms失败，其余56个HTTP请求200；系统底层原因未证实。原测试与应用代码不变，单项复验通过；现场在`keyboard-startup-failure/`。

第二项是`deployment.spec.ts:117`仍期望默认人物预览为`static`，而第6/7版已明确默认为`derived-skeleton`，仅`&model=static`保留静态对照。本轮先取得上述真实RED，再只修正这一行期望值；原FBX路径、禁止旧素材、外源/页面错误、链接和不启动训练画布的断言均保留，独立只读审查确认与当前契约一致。原失败在`subpath-old-assertion-failure/`，修正后定向复验通过。**本轮没有修改应用源码、放宽计数负例或更改超时/重试配置。**

78项浏览器用例在首轮76项加两项定向复验中分批通过，**不能记为某次78/78或完整verify退出0**。本轮没有重新`npm ci`/`assets:sync`，没有重测真实摄像头、手机或性能。既有500KB/FBX贴图警告保留，P01 fail与最终美术/真实设备的`manual_pending`不变。

最终暂存检查另复现迁移问题：Git自动行尾转换使3份CC0原许可在`core.autocrlf=false`检出后与既有字节/SHA不符（`staged-assets-red.json`，9项中3项不符）。新增`.gitattributes`，仅对`public/assets/character-motion/**`禁用文本行尾转换，并将该目录原字节重新暂存；没有修改素材、许可原文或来源哈希。随后分别以`core.autocrlf=false/true`从暂存区检出全部9份受校验素材，**18/18字节数和SHA一致**（`staged-assets-green.json`），再跑`assets:verify`通过。

全量`git diff --cached --check`对原始QA输出和素材许可内的既有尾空格/末尾空行报非零，未为排版改写这些证据或许可。排除`artifacts/qa/**`与冻结原文素材目录后，应用/测试/脚本/项目文档的暂存diff检查exit0，见`source-diff-check.json`；不将局部检查冒称全量无空白告警。

### 历史证据保留与迁移边界

测试前备份并校验1,131份历史QA文件；本轮覆盖生成的33份文件先转存`regression/`，再按原SHA恢复旧路径，见`qa-restoration.json`。历史诊断脚本`artifacts/qa/user-grip/plot-hands.py`与`artifacts/qa/user-models/preview-source.mjs`仍含旧电脑绝对路径，不属于应用或npm验证链，迁机后单独重跑需调整输入路径。用户源FBX与内嵌纹理保持原字节。

仍停在第7版人物局部审阅，未扩展全农场。启动：`npm ci`→`npm run assets:sync`→`npm run assets:verify`→`npm run dev`，打开`http://127.0.0.1:5173/?art=character-motion&rev=7`。本地commit不会自动上传到GitHub；另一台电脑需取得包含该提交的仓库副本，或后续经用户授权推送后再克隆。下一步依据用户局部反馈继续，真实设备/硬件GPU与公开资产许可仍待确认。

## 最新追加：握斧、肘部与落斧缓冲回收精修（第7版）

继续用户已批准的新人物局部，仅修改独立`?art=character-motion`；原领域/input/config、依赖、锁文件、用户FBX字节与已有未提交工作保留，没有购买/提交/push/部署或扩展全农场。接手实际typecheck及**345/345单测**通过（`artifacts/qa/user-grip/baseline-*.log`）。以下是本轮真实结果，上一轮345/31项与第6版录屏保留在下一节。

### 实现与改动文件

- 新`src/game/world/userHandGrip.ts`、新`tests/unit/userHandGrip.test.ts`6项：用真实卷指开口替代掌面标记定位斧轴；原指垫/拇指做有界局部几何校正，握紧压力有轻微变化。保留17主骨架、原UV/三角/图像，不新增假手或GPU资源，手外法线逐字节保留。端点与手部法线只在初始化预计算，逐帧混合已有attribute；可确定性恢复原派生网格。**不是完整逐指三节绑定或动捕。** 原棕色烘焙、低模棱角仍可见。
- `userCharacterRig.ts`、对应单测11→16项：按真实臂链连续分配肘/腕权重，限制Hand在腕掌范围，限制ForeArm在上臂靠肘范围；保留肩胸份额。原左/右内肘边3.28/3.07倍伸长已修复；新握姿暴露的肩袖2.075倍回归也修复，未放宽旧2倍阈值。
- `userCharacterMotion.ts`、对应单测14→24项：手骨按各自真实握轴frame接IK，显示双手间距约.242，斧仍固定62%。7.1秒时间轴保留；下挥加速到接触，斧刃停住时躯干稍晚跟进；短暂受力、约2.8cm反弹、先抬高15cm拔出，再沿弧线收回。头颈吸收窗口两端速度平顺，脚锁、骨长、握点、暂停确定性与均匀缩放断言保留。不产生ExerciseSignal或业务成果。
- 新`userChopContact.ts`、新3项单测：只读当前真实斧网格，按接触圆内最低工具顶点＋1mm咬合量确定木面；修正旧viewer切面比实际接触高15mm。`src/userModelSample.ts`与`web/character-sample.css`补“手肘特写”，点击暂停当前动作并以真实双掌/双肘构图，可旋转；“人物近景”恢复全循环构图，镜头不逐帧追手。静态源/房屋/旧prototype模式保留。
- `tests/e2e/user-models.spec.ts`8→9项，补实际特写像素、暂停、旋转、返回及偏好断言。README、SOURCES及用户资产README同步本轮范围；QA脚本、源码SHA、失败/审查/画面独立保存在`artifacts/qa/user-grip/`。

### 失败测试、独立检查与限制

真实RED包括：整斧回收穿木、尚未拔出就收低、身体没有延迟吸收；旧掌面标记使握轴偏6.58cm；头颈缓冲起止约.036m/s速度跳变；肘窝Hand漏权及肩袖ForeArm漏权；no-op指面/压力与手肘特写缺失。第一版手指接触修正产生局部小指垫角面，再增加面积/原朝向保护修复。指面原固定三角集合、raw四压力及七个实际蒙皮姿态都检查，不以marker或合成替身代替几何；全部旧负例保留。

中间全量`hand-unit-all.log`为**365/366**，1项肩袖失败，不能写成绿；修复记录在`shoulder-grip-*`。首次统一lint另有prefer-const失败，已最小修复，保留`lint-first.log`并重新跑完整unit/lint/build。中间`first-render/second-render/`都不是最终画面。

独立源几何检查：431/439个原手三角，七姿态实际蒙皮后最小握轴间隙左32.99mm/右34.56mm，超过显示柄最大半径31.58mm；最终指面顶点最大位移约3.98/4.06cm，局部面积/朝向保护通过。旧Motion隔离肘指标与当前新握姿指标有不同源码SHA，见`elbow-note.md/hand-audit.md`，不混称纯权重对照。独立密集斧三角采样约201万次，只发现设计的1mm咬合，无超过2mm侵入；该审查基于文件内记录的中间SHA，最终源码另有完整顶点轨迹单测，**均不是解析碰撞或完整自交证明**。衣物少量上肩/颈口压折、护腕相近及原烘焙棕色仍需近景审阅。

### 最终实际验证

冻结应用源码后运行：

| 命令 | 实际结果 | 本轮日志 |
|---|---|---|
| `npm run typecheck` / `npm run lint` | exit0 | `typecheck-final.log` / `lint-final.log` |
| `npm run test:unit` | **369/369，49文件，3.23秒** | `unit-final.log` |
| `npm run test:e2e -- tests/e2e/user-models.spec.ts tests/e2e/character-motion.spec.ts tests/e2e/npr-sample.spec.ts tests/e2e/default-demo.spec.ts` | **32/32，1.6分钟** | `e2e-final.log` |
| `npm run build` | exit0，含typecheck/Worker | `build-final.log` |
| `npm run assets:verify` | exit0，原FBX/本地素材SHA保持 | `assets-final.log` |
| 设置`TIDAL_GRIP_QA_DIR=artifacts/qa/user-grip/final`、`TIDAL_GRIP_RECORD=1`，运行`node artifacts/qa/user-grip/capture-grip.mjs` | exit0，0页面/控制台错误，0外源 | `capture-final.log`、`final/capture.json` |
| 本地Python运行已有`inspect_video.py` | 18.68秒、467帧可解码、463不同帧 | `video-inspection.log`、`final/video-metadata.json` |

32项覆盖新样片9、原prototype8、NPR10、默认模拟5，含真实画面暂停/特写/逐帧、原完整合成业务流程/库存/结算/重置、默认刷新和真实摄像头失败不回模拟。没有全跑所有E2E/verify、没有重新npm ci或性能采样。5张测试重生成的历史QA图先备份，再把本轮输出转存`regression/`并按SHA恢复旧路径。

最终生产入口`index-D08wYbcD.js`3.30KB，样片`userModelSample-6S0FYXKr.js`31.03KB，共享`OrbitControls-BWIrCJhk.js`644.59KB；原500KB/FBX镜面贴图警告保留。实际查看`final/raised-grip.png/clear-grip.png/grip-side.png`及全身六阶段/背面/窄屏；没有可见的长尖刺或开缝，棱角/烘焙色仍在。`final/stand-chop-recover.webm`是最终dist正常时钟连续实录，录制等待16.004秒、时钟到16.066秒，总18.68秒含加载与重播，编码25fps不代表游戏FPS。390×844为桌面Chromium窄屏，不是真手机。

当前预览`http://127.0.0.1:4176/?art=character-motion&rev=7`。启动仍为`npm ci`→`npm run assets:sync`→`npm run assets:verify`→`npm run dev`（5173同查询）；生产`npm run build`→`npm run preview -- --host 127.0.0.1 --port 4176 --strictPort`。独立样片不启动训练/摄像头、不改模拟偏好；普通首页默认无摄像头自动模拟与显式真实输入选择保留。

本轮停在局部审阅。真实摄像头、真实手机、硬件GPU/新60fps、完整自碰撞、最终自然度与原素材公开许可继续`manual_pending`，旧P01 fail不变。下一步根据用户慢放/旋转反馈精修已有低模的指形、袖口和节奏；在获得局部认可前不接全农场。未提交或push。

## 上一轮：新人物绑定骨架与站立、挥砍、回收局部样片

按用户本轮要求，在现有目录/分支及全部未提交工作上增量实现；没有重新生成项目，没有修改领域/input/config、依赖或锁文件，没有购买/上传/部署/提交/push。接手实际typecheck和**320/320单测**通过，记录在`artifacts/qa/user-rig/baseline-*.log`。仅将派生动作接到`?art=character-motion`，**没有将它扩展到全农场**；原局部农场的新人物仍使用静态适配。

### 已实现的文件与范围

- 新`src/game/world/userCharacterRig.ts`：读取实际人物拓扑，完整拆出原斧230三角，保留原UV/贴图；主体生成17骨骼的SkinnedMesh、每顶点至多4个非负归一化权重。关节为对这份非对称弯腰原姿态人工标记，沿真实表面边计算蒙皮距离，避免靠近膝盖的手把裤面拖走；皮包/皮带/发尖跟随各自部位，靴底刚性接触。原FBX未重写、未导出新文件，源仍为无骨骼静态物体，派生适配标为`derived-skeleton`。
- 新`userCharacterMotion.ts`：7.1秒局部编排，站立呼吸→抬手蓄力与转体→0.5秒下挥→低位缓冲→平滑回收。双腿IK锁定支撑点，双臂IK跟随独立斧柄的两握点；保持骨长、支持当前场景放置/旋转及均匀缩放。斧恒定缩为原尺寸62%、小角度转柄露出刃面；这是表现适配，不是修改源资产或动捕。只驱动骨架，不产生ExerciseSignal、计次、库存或奖励。
- `src/userModelSample.ts`、`web/character-sample.css`：默认自动循环新人物局部动作，保留旋转/缩放和房屋审阅；增加暂停/继续、重播、0.5×、仅站立、逐帧时间轴。工作木桩对齐真实刃尖落点；全循环相机边界只采样实际蒙皮与斧，不把隐藏静态原件算进去。提供`&model=static`源姿态对照、`&model=prototype`旧人物动作对照。页内明确无摄像头合成动画，独立入口不启动训练/摄像头、不读写模拟偏好。
- 新`tests/unit/userCharacterRig.test.ts`11项、`userCharacterMotion.test.ts`14项；更新`tests/e2e/user-models.spec.ts`为8项并保留加载失败、迟到释放/上下文丢失和blob撤销负例。文档更新本文件、README、SOURCES与用户资产README；真实截图/录屏/审查记录在`artifacts/qa/user-rig/`。

### 真实失败、修复与复验

实际RED包括：缺少骨架/动作实现；衣饰误跟近处手臂；混合踝权重导致鞋底变形；neck骨轴没有指向真实子关节；原空间距离权重让真实手/膝表面边被拉长6–10倍；下颌受chest拖动；下挥握点超出手臂长度；根与祖先均匀缩放后手离柄6.25cm；浏览器默认仍为静态。全部先保留失败日志再修实现，未删除负例或放宽旧断言。主要日志为`rig-*-red.log`、`motion-red.log/motion-first.log/motion-scale-red.log`、`viewer-red.log`及对应GREEN。

独立CPU审查发现并协助修复手/膝跨链权重。三个原坏边在九个阶段恢复至原长约0.976–1.123倍；头颈没有大于2倍边残留。诊断仍存在同臂链肘内侧约3.28倍局部边伸长（2.07cm→约6.79cm）；实拍近景未见开缝或尖刺，**不等于完整碰撞/手指包裹或最终自然度通过**。完整前后源码SHA和局限见`independent-review.md`、`review-weights-after-fix.json`，其中前后动作握点也调整过，不冒称纯权重隔离实验。

冻结所有应用源码后实际运行：

| 命令 | 实际结果 | 本轮日志 |
|---|---|---|
| `npm run typecheck` / `npm run lint` | exit0 | `typecheck-final.log` / `lint-final.log` |
| `npm run test:unit` | **345/345，47文件，2.63秒** | `unit-final.log` |
| `npm run test:e2e -- tests/e2e/user-models.spec.ts tests/e2e/character-motion.spec.ts tests/e2e/npr-sample.spec.ts tests/e2e/default-demo.spec.ts` | **31/31，1.5分钟** | `e2e-final.log` |
| `npm run build` | exit0，含typecheck与Worker构建 | `build-final.log` |
| `npm run assets:verify` | exit0，原FBX字节/SHA不变 | `assets-final.log` |
| `node artifacts/qa/user-rig/capture-rig.mjs`，设置`TIDAL_RIG_QA_DIR=artifacts/qa/user-rig/final`、`TIDAL_RIG_RECORD=1` | exit0，实际生产画面，0页面/控制台错误、0外源请求 | `capture-final.log`、`final/capture.json` |
| `node artifacts/qa/user-rig/capture-close.mjs` | exit0，站立/下挥实际近景 | `capture-close.log`、`final/close-capture.json` |
| 本地Python运行已有`inspect_video.py` | 18.32秒、458帧可解码、455不同帧 | `video-inspection.log`、`final/video-metadata.json` |
| `git diff --check` | exit0，只有已有CRLF提示 | 实际终端记录 |

这轮没有重复`npm ci`、没有全跑所有E2E/`verify`、没有新性能采样。31项包含新样片实际像素变化/暂停/逐帧/偏好、原prototype动作、NPR完整合成流程/库存/重置，以及首次默认模拟、刷新偏好、真实摄像头失败不回模拟。真实摄像头未接入本轮实测，不能把这些用例当真机动作识别通过。E2E重生成的5张历史QA图已先备份，之后把本轮输出转存`user-rig/regression/`并按SHA逐字节恢复原图。

### 实际画面、运行与下一步

最终生产入口`index-6FIOMvve.js`3.30KB；用户样片`userModelSample-BCkvePYz.js`22.59KB，共享`OrbitControls-BWIrCJhk.js`644.59KB。原>500KB与FBX不支持镜面/反射贴图关系警告保留。实际查看`final/stand.png/raised.png/impact.png/recover.png/stand-back.png/raised-back.png`与肘部近景、390×844窄屏图。连续实录`final/stand-chop-recover.webm`含两轮以上正常时钟动作，录制段16.010秒、时钟到16.066秒；视频总18.32秒含加载/点重播过程，25fps只是编码率，不是游戏FPS、硬件GPU或手机验收。

当前预览：`http://127.0.0.1:4176/?art=character-motion&rev=6`。复现安装/启动：`npm ci`→`npm run assets:sync`→`npm run assets:verify`→`npm run dev`（5173加相同查询）。生产：`npm run build`→`npm run preview -- --host 127.0.0.1 --port 4176 --strictPort`。普通`/`保留默认无摄像头自动模拟和显式真实输入切换，关闭偏好继续跨刷新记住；样片不改变该偏好。

本轮停在这份新人物的局部审阅。手指尚未逐指绑定，肘内侧压折、双手握姿/斧头尺寸与整体节奏仍需用户旋转/慢放确认；未做完整网格自碰撞或自由移动脚步。真实摄像头、真实手机、硬件GPU、最终美术批准、原模型公开再分发许可继续`manual_pending`；旧P01 fail不变，没有购买Leo或推送资产。下一步依据局部反馈精修手腕/肘部和节奏，确认后再另行接入农场装车/拉车，当前未自动扩展。

## 上一轮：替换用户提供的人物与房屋FBX

交付前最后补查“返回农场”：真实导航RED发现链接仍进普通旧版`/`；仅将它指向已导入模型的`?art=npr-sample`后，**6/6用户模型E2E复验通过（10.5秒）**，build（含typecheck）/该文件lint再次通过。`return-farm-{red,green}.log`及`build-delivered.log/lint-delivered.log/capture-delivered.log`是这次仅链接修正后的记录；下方34项全套属于修正前，不冒称最后又全跑。`final/`截图与下述构建哈希为此后交付版。

用户提供`modelf23d8a6f4b3801.fbx`与`model4e87ceb4739501.fbx`并要求替换，随后明确继续工作。已在原目录/分支增量接入，全部既有未提交源码保留，没有改领域/input/config、依赖或锁文件，没有购买、上传、部署、提交/push或扩建全农场。接手实际typecheck及**307/307单测**通过（`artifacts/qa/user-models/baseline-*.log`）。

### 实际模型与替换范围

- 前者为蓝衣棕发人物，**4,900三角、3,149,804字节**；后者为红瓦房屋，**4,430三角、3,391,244字节**。均为FBX7400，每份1网格/材质、4张内嵌2048²纹理；8张图片实际解码成功，Three CPU与浏览器读取通过。原文件逐字节复制到`public/assets/user-models/{character,house}.fbx`，SHA/来源见provenance与本轮inspection记录。
- **人物是一整块带斧头的固定砍树姿态，没有骨骼、Skin或动画。** 本轮没有冒称它已具备站立—挥砍—回收连续动作，也没有用整体晃动伪装肢体动画。人物/房屋为用户提供用于本地替换，原作者与公开再分发许可未提供，未标为CC0或据此推送原资产。
- `?art=character-motion`现在默认展示这两份真实模型；新`src/userModelSample.ts`提供人物近景/房屋近景/同框、旋转与缩放，并明确静态限制。`&model=prototype`显式保留原骨骼动作对照；原`characterSample.ts`、头部、服装、动作与有效负例保留。`src/entry.ts`按该参数分流，两个独立预览都不初始化训练/摄像头或读写模拟偏好。
- `?art=npr-sample`在原局部场景替换玩家和房屋，NPC/树木/道路等保持。新人物只跟随编排根位置/yaw，肢体和自带斧头仍固定；手中木材使用明确的近似固定握点，不是骨骼握持通过。场景标签写明“无骨骼静态姿态”，提供原动作人物对照。普通`/`仍为原农场，默认模拟与真实摄像头切换规则保留。

### 文件、失败测试与实现

新`world/userModel.ts`用锁定Three自带FBXLoader读取模型，等待内嵌图片完成后才就绪，撤销本次blob URL，拒绝未内嵌的外部贴图路径。统一等比缩放、脚底落地与朝向；人物按实际鞋底区域居中，避免长斧偏移人物锚点。保留原UV/颜色/法线纹理，改为Soft Toon并有意去除镜面高光；FBXLoader不自动应用roughness/metallic链接，原图保留在源FBX中，不能称完整PBR生效。资源与世界共享缓存独立拥有并幂等释放。

新`userHouseMount.ts/userStaticCharacter.ts`分别处理门禁、挂载和取消/迟到释放。`FarmWorld.ts`将两模型与原图集共同纳入ready；加载失败显式报错，不显示旧模型作静默回退；上下文丢失或销毁后不能重新挂载。`nprEnvironment.ts`新增默认关闭的omitCottage选项，旧程序房屋和原环境测试保留。`web/character-sample.css/world.css`只补预览/对照及窄屏样式；`scripts/verify-assets.mjs`追加两原始FBX的字节/SHA/版本校验，旧动作录屏脚本默认URL加`model=prototype`。

新增`userModel.test.ts`7项、`userHouseMount.test.ts`4项、`userStaticCharacter.test.ts`2项和`user-models.spec.ts`6项，子路径部署另增1项。真实RED包括未实现模型准备、空/NaN几何不释放、缺失挂载/取消、静态适配未实现、人物网络/响应体错误误归房屋，以及新默认预览缺失/加载门禁。保留所有旧肩袖/动作/领域负例；旧动作相关浏览器用例显式选择prototype，不能把新静态角色算作动画通过。

首轮相关E2E为**33/34通过、1失败**（`e2e-green.log`）：原半挥砍重置用例没有等待新增资产就绪，接受计划点击后准备页未打开；trace保留。该轮运行期间还发生Vite因源修正重载，不能当最终稳定证据。对该用例补与相邻用例相同的实际assets-ready等待，原首帧手部位置/零成果断言不变；全部源码冻结后重新运行如下完整相关34项通过。上下文丢失负例现在要求assets=failed，仍保留禁止启动/零计数断言，不再将迟到贴图完成标为ready。

### 最终实际验证与画面

| 命令 | 实际结果 | 本轮日志 |
|---|---|---|
| `npm run typecheck` / `npm run lint` | exit0 | `typecheck-final.log` / `lint-final.log` |
| `npm run test:unit` | **320/320，45文件，2.30秒** | `unit-final.log` |
| `npm run test:e2e -- tests/e2e/user-models.spec.ts tests/e2e/npr-sample.spec.ts tests/e2e/character-motion.spec.ts tests/e2e/deployment.spec.ts` | **34/34，1.7分钟** | `e2e-final.log` |
| `npm run build` | exit0 | `build-final.log` |
| `npm run assets:verify` | exit0，含两用户原件与原9项CC0资产 | `assets-final.log` |
| `node artifacts/qa/user-models/capture-models.mjs` | exit0，0页面/控制台异常、0外源 | `capture-final.log`、`final/capture.json` |

所有新日志在`artifacts/qa/user-models/`。本轮为全单测和上述相关34项浏览器验证，**没有重新全跑所有E2E或完整verify、没有再次npm ci**。34项包含原骨骼动作暂停/逐帧、默认模拟与完整合成流程/库存/结算/重置、真实摄像头失败不回模拟、10次合成资源生命周期、本地子路径与MediaPipe处理合成视频；不能外推真人摄像头通过。新浏览器检查还实际计数8个内嵌图片URL均已revoke、上下文丢失后迟到模型不重开预览。

最终生产构建入口`index-C8z6hSw_.js`3.26KB，用户预览`userModelSample-CkaiOMLw.js`6.41KB，加载器`userModel-Cnyt4fJP.js`53.47KB，共享`OrbitControls-BT33Vl8F.js`642.99KB。既有>500KB警告及FBX不支持的镜面/反射贴图链接警告如实保留，没有隐藏。未做本轮性能采样，原P01 fail不变。

实际查看`final/together.png/character.png/character-back.png/house.png/farm-local.png/narrow-390x844.png`：为最终dist的Three真实画面；修正了首轮窄屏右侧房屋/风车裁切，按真实包围盒和界面遮挡取景，resize重新构图。390×844仅桌面Chromium窄屏视口，不是真手机。首次捕获因4176服务已停止而connection refused，重启本地preview后实拍成功，失败与重试日志保留。最终截图/元数据和独立审阅索引在本轮QA README。

部署测试重生成的5项已跟踪历史QA已备份到本轮目录并恢复HEAD；NPR原用例另重生成了旧未跟踪目录内4张PNG，这4张已转存本轮`regression/`并在原目录README注明当前来源，不能再当上一轮原图。其余历史证据未替换。

### 当前入口与下一步

运行中的预览：`http://127.0.0.1:4176/?art=character-motion&rev=5`；返回局部农场用`?art=npr-sample`，原动作对照用`?art=character-motion&model=prototype`。复现安装/启动：`npm ci`→`npm run assets:sync`→`npm run assets:verify`→`npm run dev`（5173同查询）；生产`npm run build`→`npm run preview -- --host 127.0.0.1 --port 4176 --strictPort`。

下一步若要让这份新人物自然站立、挥砍、回收、装车和拉车，需要对含斧头的合并网格做绑定/拆分与动画适配；本轮只完成模型外观替换，不声称绑定已完成。摄像头真机、硬件GPU、真实手机、素材公开再分发许可与最终美术接受仍`manual_pending`；默认模拟和显式真实输入保留。

## 上一轮：按参考视频角色继续改造人物局部

用户要求直接参考视频角色。本轮实际查看原视频11、12、14.5秒米白衣砍树青年，另核对0.5、1.97秒蓝衣少年；主参考为前者，不能混称同一角色。米白衣角色主要是侧后视，没有可辨认的清晰正脸，因此五官是同风格原创解释，不能称逐项还原。源视频与分析裁切仅留系统TEMP，不进入应用/素材仓库；只读比对在`artifacts/qa/video-character/visual-audit.md`。

沿现有`codex/npr-farm-sample`及全部未提交工作增量实现，没有扩展全农场、改领域/input/config或依赖/锁文件，也没有购买Leo、联系作者、提交/push或部署。原首页默认模拟和真实摄像头手动切换保留；独立样片不初始化训练/摄像头、不改变偏好。

### 实际文件与实现

- `src/game/world/sampleHead.ts`、`tests/unit/sampleHead.test.ts`：缩短下半脸与下颌、暖棕眼睛；栗棕碎刘海、不齐鬓角与短后颈发束，闭合发壳与较柔和高光。保留原眼睛可见、无发缝、法线、资源释放和三角预算断言，增加脸部比例与侧/后轮廓实际射线测试（8→11项）。这是原创代码头部，不是Leo或从视频抽取的模型。
- 新`sampleCostume.ts`与`tests/unit/sampleCostume.test.ts`（8项）：原创红棕围巾、短弯垂角、贴背V皮带及后侧小皮包，分别挂颈/胸/骨盆骨。背部几何仅在构造时贴合真实服装，保留动画骨随动；不是逐帧布料物理。实际姿态采样验证颈圈不穿下颌、开口存在、围巾/背带距衣面小于3.2cm，保留上移围巾会穿脸的负例。
- `sampleCharacter.ts`接入配饰、稍降头挂点与颈接点；对原材质独立克隆，局部重着米白衣袖、灰绿裤和深棕靴。上衣仅暖色高亮布料参与变色，保留暗色皮革/绑带与金属；磁盘PNG像素、GLTF/bin、UV与原许可/SHA不变。共享配饰由`WorldResources`释放，角色材质/派生几何由actor释放，重复释放测试保留；没有改IK、肩袖修复或动作时钟。
- `src/characterSample.ts`只调整样片光照/曝光、减轻阴影与来源说明；`scripts/capture-character-motion.mjs`独立输出本轮QA，新增实际背面站立/举斧截图，不覆写上轮证据。

### 真实RED、验证和证据

接手typecheck退出0。初次全量unit运行时新头部测试已经加入，**296项原测试通过、2项新测试失败（298总计）**，不是完整基线全绿；真实RED为下半脸比例1.609超界与轮廓仅1发束。随后配饰缺失/重着色、悬空披角、矩形尾端/缺V背带、后颈0独立发尖均先实际失败，再最小实现。失败及中间截图保留，不能与最终画面混用。

最终源代码实际运行：

| 命令 | 实际结果 | 本轮日志 |
|---|---|---|
| `npm run typecheck` | exit0 | `typecheck-final.log` |
| `npm run lint` | exit0 | `lint-final.log` |
| `npm run test:unit` | **307/307，42文件，3.08秒** | `unit-final.log` |
| `npm run test:e2e -- tests/e2e/character-motion.spec.ts tests/e2e/deployment.spec.ts` | **17/17，52.7秒** | `e2e-final.log` |
| `npm run build` | exit0 | `build-final.log` |
| `npm run assets:verify` | exit0，含9项CC0文件/原许可 | `assets-final.log` |
| `node scripts/capture-character-motion.mjs` | exit0，0异常/0外源 | `capture-final.log`、`final/capture.json` |

日志均在`artifacts/qa/video-character/`。本轮是全单测与相关17项浏览器复验，**没有重新运行完整68项E2E或完整verify**；下文296/68全套属于上一轮。本轮没有再次`npm ci`或修改依赖。浏览器涵盖暂停画面冻结、面部旋转/偏好不变、原首页门禁、三分辨率完整模拟流程、10次合成视频资源释放、子路径真实本地MediaPipe处理合成视频及模型/WASM失败；这些不是真人摄像头验收。测试重生成的旧QA恢复，新记录独立存放。

最终构建入口`index-BqtD090n.js`3.04KB、样片`characterSample-DqOobiPA.js`79.79KB、共享`nprMaterials-CiVz23UG.js`652.96KB；既有>500KB警告保留。生产4176实际录屏**16.72秒、1366×900、418解码帧且418帧不同**，25fps仅录像编码。已查看四阶段精确暂停帧0.80/3.40/3.95/4.95秒、脸部近景、背面站立/举斧及录像抽帧，0页面/控制台异常与0外源。录像、SHA、命令与独立审阅见该QA目录README；未做本轮60fps性能验收。原P01 fail不变。

### 局部审阅边界与启动

发顶/刘海仍偏大块、后颈略长，服装/手指/胸前接触及脚底约3–4cm漂移仍属试作，不能称视频同款成品或完整布料碰撞/物理脚锁。独立只读审阅未发现Critical/Important问题，美术接受继续由用户审阅。摄像头真机、硬件GPU、真实手机继续`manual_pending`。Leo仍未购买，购买前明确告知；不扩展全农场。

现有生产预览：`http://127.0.0.1:4176/?art=character-motion&rev=4`。可拖拽旋转、点击面部特写、暂停/慢放和拖动时间轴。复现：`npm ci`→`npm run assets:sync`→`npm run assets:verify`→`npm run dev`，打开5173同查询；生产`npm run build`→`npm run preview -- --port 4176 --strictPort`。下一步先审阅人物整体/正背面和动作，再按反馈细化发束/服装接触；原模拟/摄像头流程保持。

## 上一轮：人物局部第二轮——脸型、头发、肩袖与动作

用户要求继续现有`?art=character-motion`，脸/发向已选定的Leo日式青年方向调整、脸更俊朗、修肩缝并让下挥/回收自然；购买前告知，暂不扩展全农场。本轮在原`codex/npr-farm-sample`工作区增量实施，保留接手时全部未提交工作。实际基线`typecheck`与271/271单测通过（`artifacts/qa/character-refinement/baseline-*.log`）；没有新增依赖、改锁文件、改领域/input/config、购买Leo、联系作者、推送或部署。

### 实际改动

- 新`src/game/world/sampleHead.ts`为该样片单独制作原创青年头部：收窄脸型、明确下颌、杏眼/眼睑/眼眉、短鼻与嘴唇、贴头皮的侧分发束。替换原样片从`NprCharacter3D`抽取临时头的方式；原农场头部没有替换。头部略缩小并降低挂点，颈段终点跟随下颌。它不是Leo原模型，不含付费网格/贴图或商品图片像素。
- `sampleCharacter.ts`在运行时重新裁接棕色袖子：袖口接米色短袖的实际开口、匹配位置/权重并在滚边内留出空间；将原本藏在袖内的前臂根部衔接到真实袖口，手指和可见远端前臂保留。棕袖从源1408三角改为432三角；磁盘GLTF/bin/贴图/原许可与哈希未改。原始与派生几何均由角色拥有并幂等释放，共享头/斧资源由`WorldResources`释放。
- 握持仍为刚性斧柄、原0.3单位副手间距；肘部方向从原动作连续过渡到胸前/外侧方向。删除正数blend阈值的硬切，不保留失败的双臂中心、伸长袖口或斧柄锥约束实验。
- `characterSampleClock.ts`改为五次平滑：蓄力后实际下挥为3.65–4.15秒，峰值不加速原动作；4.15–4.40低位缓冲，4.40–5.60逐渐松副手/卸力回到待机，不再沿源循环再次举斧。保留暂停、后台与异常间隔不补时间。
- `characterSample.ts`增加“面部特写”，与全身镜头往返，不改暂停姿势或模拟偏好；窄屏向上构图以避开控制面板。已有旋转、慢放、重播、站立和逐帧滑杆保留。`capture-character-motion.mjs`支持独立QA输出目录，保留上轮证据，新增真实截图的脸部区域近景。

### 失败测试、检查与当前证据

先写并实际运行RED：新脸型/杏眼比例、头发三分之四轮廓空洞、短鼻检查；回收重复举斧和下挥边界速度检查；面部镜头浏览器用例；袖衣/皮肤相交检查；实际GLTF在blend=.001前后的肘部跳动（15.45/13.51cm）。实现后头部8项、时钟6项、实际角色11项、动作连续性10项和肩袖4项通过；最终完整单测实际**296/296（41文件）**，typecheck/lint通过，`assets:verify`通过9项CC0资产及原模型/运行时校验。

最终**`npm run verify`单次完整退出0**（`verify-final.log`）：296单测、**68/68 E2E（8.0分钟）**、typecheck/lint/build全部通过，包含新增面部镜头暂停/偏好测试与原农场、默认模拟、真实输入失败、资源释放、子路径部署等软件回归。`npm run assets:verify`另行退出0（`assets-final.log`）。最终构建入口`index-D7jOxtRS.js`3.04KB，样片`characterSample-LWW3LInk.js`72.77KB，共享`nprMaterials-BJJsp7KB.js`652.95KB；既有>500KB提示保留，不能据构建通过推断性能通过。没有运行本轮`npm ci`或改依赖；上文安装命令是复现方式。测试重生成的历史QA图恢复为接手版本，新证据独立留档。

肩袖测试契约为实际肩帽/袖口区域与全前臂皮肤覆盖：从原网格近端袖口及upperarm逆绑定位置推导区域，保留同一区域原始未裁接袖子的穿插负例；72个真实样片时钟采样点及额外阶段边界均无袖帽穿插、无前臂皮肤穿袖。最初“与整个上衣任意面都不能相交”的断言超出肩缝范围；原全身扫描未删除，中央胸前手臂/衣物接触仍作为下方限制保留。没有通过屏蔽原肩缝负例、改颜色或深度偏移来冒称修复。

实际生产构建四角度截图在`artifacts/qa/character-refinement/final/shoulder-*.png`：正/背三分之四和低角度均已查看，原前臂碎片条纹消失；皮肤到袖口、肩帽接合连续，棕带白色菱形件是原有五金。独立审查未发现肩缝范围内的重要问题。第一次近景仍有悬空发束，已收回到头皮包络；中间截图/失败日志保留，不混为最终证据。

最终构建再次运行`node scripts/capture-character-motion.mjs`退出0（`capture-final.log/final/capture.json`）：**16.64秒原速连续录屏、1366×900、416实际解码帧且416帧不同、0异常/外源**。25fps仅录像编码，非游戏帧率；元数据/SHA在`final/video-metadata.json`。通过可见时间轴核对0.80/3.40/3.95/4.95秒四阶段后截图；脸部全图/区域近景、390×844视口和四角度均为实际3D画面。已查看最终近景、下挥/回收和录像抽帧，索引见QA README。捕获脚本默认输出新目录，不覆写上轮录像。

### 尚未验收与下一步

中央胸前手臂/衣物仍有接触和小重叠，没有完整布料碰撞；手掌锚点贴柄不等于手指已完全包裹，水平脚底约3–4cm滑移也不是物理脚锁。脸/发/颈比例与完整动作自然度仍需用户审阅，不能称Leo成品或最终美术。摄像头真机、硬件GPU和真实手机继续`manual_pending`；390×844仅是桌面Chromium的窄屏视口。未重新做60fps性能验收，原P01 fail不变。

启动方式不变：`npm ci`→`npm run assets:sync`→`npm run assets:verify`→`npm run dev`，打开`http://127.0.0.1:5173/?art=character-motion`；生产`npm run build`→`npm run preview -- --port 4176 --strictPort`。原首页默认模拟与真实摄像头手动切换保留，独立样片不初始化它们。下一步先审阅这一人物局部，再决定下一轮脸/发、手指或布料修整；不自动扩展全农场，Leo购买与网页/仓库分发许可仍需购买前明确。

## 上一轮：人物骨骼局部样片与Leo采购核查

用户已选择Leo日式青年方向，要求先核实格式/授权、购买前告知，并只交付站立—挥砍—回收局部样片。本轮继续原目录/分支，接手实际typecheck和257单测通过，全部已有未提交修改保留。未购买/联系作者/上传用户资料，未改领域/config/input、依赖或锁文件，没有提交/push/合并或扩全农场。

### Leo核查与当前角色来源

原作者Unity商店公开Package Content实际展开，确认`Models/Leo_YoungAdult.fbx`、独立PNG；三段动画为Unity`.anim`，没有确认独立动画FBX/GLB或导出后的蒙皮/44表情兼容性。Unity官方允许按EULA跨引擎使用；公开可提取GLB、随GitHub公开原资产/派生模型尚无明确授权，不能将“商用允许”当作该交付方式获准。详细证据与购买前问题在`artifacts/qa/character-motion/leo-terms.md`。未进入结账，实际价税以购买时复核；未声称Leo已经接入。

样片明确显示“原创试装头部＋CC0农夫骨骼与动画，非Leo原模型”。本地`public/assets/character-motion/`只收Quaternius对应Standard归档明确CC0的Male Peasant蒙皮/两张原始basecolor、`Idle_Loop`与`TreeChopping_Loop`两段精简GLB、三份原许可证及provenance。动画源0.966667秒/2.5秒，提取保留的关键帧字节与原GLB逐字节相同；运行时为样片重新安排举斧蓄力/下挥/回收节奏，并非宣称原动作未经调整或来自动捕。服装12,894三角，原始贴图4096²/2048²，本地资源约7.46MB；尚未做移动端纹理压缩。ZIP留系统临时目录，未入仓。

### 实现范围

- `src/entry.ts`按`?art=character-motion`动态选择独立样片，其余入口仍加载原`browser.ts`；`index.html`只更换入口脚本。新`characterSample.ts/web/character-sample.css`使用相同锁定Three.js，单人物/固定木桩、暖光/地面、可旋转镜头，重播/暂停/慢速/站立/时间轴。样片不导入训练或摄像头入口、不读写模拟偏好、没有计数/库存/奖励；不是把片段挂回真实识别链路。
- 新`world/sampleCharacter.ts`加载实际蒙皮和骨架，按目标绑定参考姿态重定向旋转、保留骨长/缩放骨盆变化；AnimationMixer按绝对时间采样。斧头附右手、左臂解析接触校正；临时原创头部附Head骨，补颈段，按真实蒙皮鞋底顶点校正地面。当前脸/发/服装仍是技术试装，肩部服装在极端举臂处的外观仍待美术修整，不宣称Leo级成品或物理握持。
- 新`characterSampleClock.ts`只有表现时钟，暂停/后台/无效或>100ms间隔不补时间；没有领域回调。资源由样片与角色分别明确持有、幂等释放；伴随资源加载失败时释放迟到成功模型。相同可见姿态不重复运行IK，暂停时不反复绘制，仍可旋转或切姿态重绘。
- `verify-assets.mjs`新增9项素材字节/SHA与许可元数据校验；实际许可证、源归档/条目SHA与派生说明在`provenance.json`，没有仅凭网页“免费”推断。单测和浏览器测试均保留原负例。

### 失败与修正证据

QA集中在`artifacts/qa/character-motion/`。入口首个浏览器RED实际等待不到样片标题（`e2e-red.log`）；角色实际资产测试先RED，再完成最小实现。集成首次2失败/1通过：传给加载器的base重复拼接`assets/character-motion/`，trace中错误URL虽返回200但为SPA回退内容，不能证明加载成功；改为传Vite BASE_URL后3/3通过。首个lint报一项prefer-const，已修正，后续完整检查重新运行。

首次实拍发现头颈断开、鞋底/阴影接触与待机斧头隐藏，补真实蒙皮顶点/颈段/待机持斧负例并修正；缩小舞台阴影远平面/偏移，角色保留地面投影但关闭自阴影接收。审查另发现暂停切站立只更新标签、不触发重绘；用真实draw计数复现RED（6→6），加dirty标记后通过。截图脚本也实际暴露`strike.png`已经落在回收3.9665秒，已改用可见时间轴选3.7700秒并核对阶段后保存，未把错误阶段图继续当下挥证据。

完整回归还实际发现新动态入口让原首页在脚本处理器安装前接收点击。首轮verify中断，`verify-interrupted.log/entry-failures/`保留原首页/模拟流程失败；没有把中断当通过。新增入口门禁/导入失败两项浏览器RED后，HTML初始`inert`，原`browser.ts`只在处理器装好后解除；样片先替换界面再解除，模块下载失败显示明确重载入口。原首页、模拟开关与7项样片定向回归14/14通过（`entry-green.log`）。

最终完整`npm run verify`仍退出1：**270单测通过、66/67 E2E通过（7.7分钟）**，唯一失败是原首页稳态HUD测试在新模块初始化前开始观察，计到6项启动变更。只在该测试观察器前等待`body[data-boot=ready]`，原“20帧0变更、文本节点保留”断言未改；`final-recheck.log`实际**9/9通过**（7样片＋2渲染效率）。另对GLTF拥有的ImageBitmap补“共享图像只关闭一次”的RED/修正，正常/失败清理均关闭位图；最终源代码**typecheck/lint与271/271单测（38文件）通过**，`assets:verify`通过，日志为`*-final.log`。**全部67 E2E在完整轮66项＋该失败项定向复验中分批通过；没有一次67/67全套或verify退出0。**

随后实际`npm run build`退出0（`build-final.log`）：入口`index-D5IQaeJ6.js`3.04KB，样片`characterSample-OdF77zLb.js`60.13KB，共享`nprModels-CMU07vW-.js`674.66KB，500KB提示保留。没有改依赖/锁文件、重复安装或重新npm ci；不把历史安装算本轮。测试重生成的历史QA图片/JSON恢复原值，独立新证据目录保留。

生产4176使用最终dist运行`node scripts/capture-character-motion.mjs`退出0（`capture-final.log/capture.json`）：实际16.48秒、1366×900、412解码帧/25fps编码，0页面/控制台异常、0外源请求，无摄像头/训练计数。原速实录`motion-preview.webm`是该录像副本，未加速；四张实际暂停帧通过可见时间轴定位0.80/3.40/3.77/4.50秒，并断言idle/prepare/strike/recover阶段。已查看最终图像和视频抽帧，`video-metadata.json/video-frames/`留证。25fps编码不是游戏帧率，本轮没有单独性能采样，不宣称达到60fps；原农场P01 fail不变。仅请求在Codex打开预览，工具返回queued，未声称已经观察到用户标签页。

README、SOURCES、DEPENDENCIES、TEST_REPORT和素材说明同步。启动`npm ci`→`npm run assets:sync`→`npm run assets:verify`→`npm run dev`后访问`http://127.0.0.1:5173/?art=character-motion`；生产`npm run build`→`npm run preview -- --port 4176 --strictPort`，访问同查询。下一步停在局部审阅：按用户反馈调整动作/头发脸型、肩部衣物接缝及略长的临时颈部，购买Leo前先明确网页分发许可与可导出动画；不自动扩展全场。真实摄像头、硬件GPU、Leo实际导入和最终美术继续`manual_pending`。

## 最新追加：外部骨骼角色与动画选型（调研，尚未接入）

用户反馈动作仍不自然，要求从网上找更好看的角色模型。本轮读取最新进度、规则、实际Git修改和现有表现接口，保留全部未提交局部样板；只做原作者资源、预览、格式和许可核查，没有替换游戏角色、购买、修改领域/输入/依赖或提交/push。参考仍是日式田园动画、自然青年比例，暂不扩展全农场。

- 原作者候选：Neko Legends的`Leo, Young Adult`为日式青年男角色，但现成服装是现代连帽衫/长裤/运动鞋，农夫工作服需要另做；`Kiyomi - Adventurer`为日式女冒险角色、服装更接近幻想田园。实际查看商店预览，不把商店/Unity画面当Three.js效果。均为付费Unity资源；尚未购买/下载，独立FBX/GLB交付与蒙皮、贴图、动画质量未实测，Unity专用着色器不能直接移入本项目。现价因税区/索引有差异，以结账页为准；未作付款承诺。
- 免费候选：Quaternius的Universal Base Characters + Modular Character Outfits Fantasy之Peasant。已查看原作者免费版图片，属于偏西式风格化的成年比例，可作为骨骼/劳作服基础，不宣称已与参考视频同风格。只读核对Standard归档：Base免费版实际仅含Superhero男女完整身体和部分头发，**不含Regular/Teen完整身体**，免费男款头与身体同一网格，需要离线拆分；Male Peasant有蒙皮和全身骨架/四部分衣服，但没有可见头部，需要配头、头发并校正颈部/绑定，不能当作直接可用的完整免费主角。
- 动作资源：只读核对Quaternius Universal Animation Library 1/2的Standard包与明确CC0许可文件。实际有`Idle_Loop/Walk_Loop/Push_Loop/PickUp_Table`以及`TreeChopping_Loop/Walk_Carry_Loop/OverhandThrow`等候选。它们是可重定向动画，不是已验证的本项目动作，更不宣称动捕；没有据营销页把120+/130+全库算作免费。未发现已确认可直接覆盖本项目抓木、举木投掷和绑绳全过程的整套片段。
- 许可边界：Quaternius网站全局QAL页面与上述包页CC0表述不同，已进一步检查对应Standard归档中的`License.txt/License_Standard.txt`为明确CC0，而不是仅凭“免费商用”推断。若后续实际接入，必须把所用文件的许可/版本/哈希与派生过程一同留档。Mixamo只作为备选，Adobe FAQ的游戏使用许可不等于允许将原始动画公开进GitHub；本轮未下载/上传任何Mixamo角色或用户素材。
- 增量实现方向已核对可行：在现有`VisualActor`边界加入GLTFLoader、骨骼蒙皮和AnimationMixer；保留SessionController、编排根位置及真实两手世界锚。挥砍/装车要按现有阶段分段停住/衔接，不能收到一次事件就无限循环动画；补脚底接触、腰胯重心和双手握持，暂停/后台不补时间，动画完成不提交次数。此为后续实现建议，**本轮没有新增骨骼动画代码或自然度/性能通过结论**。

网页预览截图`quaternius-standard-source.png/kiyomi-source.png/leo-source.png`保存在`artifacts/qa/character-research/`，不是Tidal游戏内验收截图；付费候选的促销背景/部分服装贴图有作者AI使用声明，没有据此把单张预览当实际网格/动画证明。实际使用网页检索、原作者浏览器预览、Standard ZIP只读检查、源码/文档读取和`git diff --check`；没有为纯调研重复单测/构建，上一轮257单测及分批E2E、34.06fps的软件GL结果仍仅属于上一轮程序化角色。摄像头真机和新模型实际兼容性、硬件性能、美术接受度继续`manual_pending`。下一步先按选定角色制作局部骨骼动作小样，再决定是否更换主角；不自动扩展全场或购买素材。当前预览/启动方式不变。

## 最新追加：第二版局部人物/植被与动作精修（等待用户审阅）

用户反馈第一版与参考视频仍差较多，要求只继续打磨人物、树木、草地，随后追加人物动画更细腻。本轮沿`codex/npr-farm-sample`当前目录增量处理，接手时第一版代码/文档均未提交，全部保留；实际基线typecheck和228单测通过（`artifacts/qa/npr-refinement/baseline.log`）。没有改领域、config、input、依赖/锁文件，没有提交/push/合并或对外部署。入口仍为`?art=npr-sample`，标记“第二版”；普通`/`保留旧v2，远景山林/农田没有扩展或重新制作。

- `nprModels.ts`、新`nprCharacterRefinement.test.ts`：以正面/俯视射线实际复现头发遮住额头/双眼、嘴埋入脸；开脸棕发、可见五官、卷袖/围巾/腰包、连续弯曲手臂/裤腿和长靴。静态小细节合并，可变几何按角色独立持有，闲置不反复上传；8种手部世界锚、NPC身份、车把/轮轴/绳索及木材接口保留。仍是原创程序化角色，没有交付专业GLB、动作捕捉或完整骨骼蒙皮系统。
- 新`nprMotion.ts/nprMotion.test.ts`：只消费观察到的表现帧间隔，有限相位插值；挥砍蓄力、60ms快速下挥、回收缓冲，腰部俯仰/扭转、独立头部和手腕斧角；装车蹲起/举木/收手；行走单脚支撑、脚跟脚尖与重心小幅变化。0/负/无效/>100ms间隔不补算，暂停冻结；根位置/yaw继续来自原编排，实际两手中心喂回原木材锚。动画不提交ExerciseSignal、不推进任务或产生额外成果；NPC仍为旧预设姿态，不宣称同步升级了NPC骨骼动画。
- 新`nprVegetation.ts/nprVegetation.test.ts`：曲干、根系、分叉和128组较大交叉叶枝卡片，替换不透明团块树冠，保留倒树接口。实际每树3绘制对象/2804三角（含实例），只代表几何成本，不等于帧率。透明原创手绘`leaf-bough-v2.png`为内置imagegen生成1254×1254 RGBA/1,472,691字节，完整提示词/哈希/来源在同目录provenance.json，未输入/复制视频像素；`nprMaterials.ts`统一alphaTest/depth/shadow材质与释放，`FarmWorld.ts`同时等待图集和叶枝载入，缺失仍显式失败、不自动开局。
- `nprEnvironment.ts`、新`nprMeadowRefinement.test.ts`：380簇细弯草、32低叶、14小花、18石块和宽幅草地冷暖/磨损变化，保留道路/门前路径/3个站位。实拍后缩细草叶/花叶，草/低叶/花/石只在初始化时采样两处真实缓坡高度，修正24簇埋根（含2处完全埋藏）的负例；不加逐帧地形射线。局部环境33绘制对象/17,680三角，范围仍x[-12,10]/z[-20,4]。旧农舍形状保留，仅合并静态装饰。
- `FarmWorld.ts`在局部动画revision改变时渲染，包括最后一帧；暂停和长gap传0；换局在session-reset效果回调显式清姿态。审查实际发现reset效果先于订阅，原订阅sessionID比较无法触发，已用浏览器首帧手锚RED复现并修正。10项样板E2E覆盖双素材门禁/失败、暂停时真实截图像素冻结、恢复不重复计数、第一帧重置、显式摄像头失败、完整模拟/库存/奖励与返回首页。

### 验证与失败记录（本轮没有单次全套verify退出0）

所有日志在`artifacts/qa/npr-refinement/`。实际typecheck/lint与**257/257单测（36文件）通过**；新增29单测、4样板E2E，全部既有行为负例保留。定向样板10/10通过（`integration-final.log`）。首次定向8通过/1失败是新测试恢复后焦点仍在暂停按钮，Space被正确保护；测试显式聚焦动作按钮后通过，没有改生产键盘/识别门槛。

第一轮`npm run verify`退出1：**56/59 E2E通过**，3项子路径部署失败（`verify-first.log`、`port-failures/`）。原因已由源码/实际连接证据核实：旧测试也用4176，碰到用户预览页，r.ok误把SPA回退HTML当对应构建。只改`tests/e2e/deployment.spec.ts`为系统分配独立端口、检查子进程退出和精确构建HTML；不占/停止用户4176。原3项实际复验3/3通过（`subpath-green.log`）。

第二轮`npm run verify`仍退出1：**58/59通过（6.9分钟）**，唯一失败为旧视觉回放写`artifacts/qa/3d/replay/10-load-return.png`时Windows报UNKNOWN open错误，尚未到其后断言。`verify-second.log`（亦保留原`verify-final.log`）与`screenshot-failure/`保存失败；根因未能还原，不认定生产动作bug。原代码、原路径、原断言单独复验**1/1通过（1.2分钟）**，见`visual-replay-recheck.log`，无重试配置/超时放宽/删断言。**59项全部在第二轮58项＋该单项复验中分批通过，不能写成某一次59/59全套或verify退出0。**

随后实际`npm run build`和`npm run assets:verify`退出0（`build-final.log/assets-verify.log`）。最终`index-DrLIbJGD.js`735.58KB/gzip197.96KB，500KB提示保留；与录像/性能采样的bundle相同。未改依赖，未重复npm ci；历史安装证据不冒充本轮安装。旧测试重生成的历史截图/JSON在完成复验后恢复原值，本轮独立目录保留新证据。

### 实拍动作与性能

既有4176预览服务提供本轮`dist`，运行`node artifacts/qa/npr-refinement/record-motion.mjs`退出0。正式URL无e2e参数，普通5秒倒计时/15秒休息，真实键盘UI完成15次挥砍和3次装车后暂停；48.508秒记录，0页面异常/外源/姿态资源请求，无摄像头。`motion-capture.json/log`和`motion-preview.webm`保留原始记录；实际截图`showcase.png/chop.png/load.png`已取得并查看。录像末画布比例0.5（683×450铺满1366×900），编码开销使它不适合作性能基准，也不宣称截图时3D必为全分辨率。

使用已安装Playwright FFmpeg1013，从实录6.8秒起截8秒`chop-preview.webm`、43.5秒起截5秒`load-preview.webm`，VP9、25fps，保持原速，没有改动作时间。实际检查200帧/125帧和多个原帧，`video-metadata.json/video-frames/clip-encode.log`留证；视频是游戏渲染，不是imagegen角色图或真人识别。静态图和短片供用户审美/动作节奏审阅，不等于视频级品质或最终验收。

独立`TIDAL_PREVIEW_URL=http://127.0.0.1:4176/?art=npr-sample`、`TIDAL_PROFILE_OUTPUT=artifacts/qa/npr-refinement/production-profile.json`运行`node scripts/profile-demo.mjs`退出0。无录像、普通生产时钟、默认自动模拟，Chromium156/SwiftShader，预热10秒后**2044样本/60.0142秒，34.06fps，p50 33.3/p95 49.9/max66.7ms，>50ms22次**；比例始终0.5，结束683×450，0页面异常/外源。**60fps fail**，较第一版38.70fps没有改善；绘制对象减少不代表alpha/阴影开销下降。硬件GPU继续manual_pending，未把25fps编码或脚本退出0当作游戏性能通过。

README、SOURCES、DEPENDENCIES、TEST_REPORT、素材说明及QA索引同步。当前只停在第二版局部美术/动作检查点，等用户审阅，再决定继续局部修正或扩展。默认模拟、显式真实摄像头切换、零成果重置、库存守恒和奖励一次性仍保留；真人标定/准确率/PiP/完整真人流程、硬件GPU、最终美术继续manual_pending，P01仍fail。下一步优先按反馈细化姿态/接触与局部素材，并针对叶簇覆盖率、阴影和LOD做性能优化；不自动扩全场/推送/部署。

运行仍`npm ci`→`npm run assets:sync`→`npm run assets:verify`→`npm run dev`（`http://127.0.0.1:5173/?art=npr-sample`）；正式`npm run build`→`npm run preview -- --host 127.0.0.1 --port 4176 --strictPort`。257单测可`npm run test:unit`，10局部E2E可`npx playwright test tests/e2e/npr-sample.spec.ts`，完整检查仍`npm run verify`；本轮执行状态见上文，保留未获一次全套全绿的限制。

## 历史追加：第一版局部NPR样板（用户随后要求继续打磨）

用户明确批准“先局部，OK了之后再扩展”。本轮从`main=a45116b`在当前目录增量开发，分支`codex/npr-farm-sample`；保留接手时两份规划/来源文档修改，未覆盖无关工作。实际重新运行typecheck和原209单测通过，见`artifacts/qa/npr-sample/baseline.log`。没有新增依赖、安装或修改锁文件，未改SessionController、config、input及测试夹具；未提交/push/合并或对外部署。

样板入口为`?art=npr-sample`，普通`/`保留旧v2完整农场作对照。本轮只审阅人物、树、手推车与砍树—装车交界一角，不把设计批准写成视频级美术验收通过。

- 新增`world/nprModels.ts`：有机截面人物、较自然头身比例、头发/服装细节，不规则阔叶冠及边缘叶簇；车、木材、机器人身份/轮轴/车把/绳索和8种手部锚点保留。造型由原创代码生成，没有交付专业GLB或新的绑定动画资产。法线绕序与团块比例均实际RED→GREEN。
- 新增`world/nprEnvironment.ts`：局部瓦顶/挑檐/窗框凹进/门廊、共享手绘草地、低缓坡与灌丛/草簇。草地主面低于既有道路接触面，边缘透明顶点色渐隐，修正首版硬矩形接缝；样板把旧18草捆移至远端，默认场景数量和位置保持。远景松林、山体、农田仍为旧版，未全场扩展。
- 新增`world/nprMaterials.ts`与`public/assets/npr/`：内置imagegen生成1536×1024六格原创手绘图集（2,688,321字节），未复制参考视频/图像像素；精确提示词、生成源和SHA在provenance.json。共享Soft Toon以宽过渡代替硬色阶，图集UV内缩，使用未折返UV导数的textureGrad避免重复边界误选mip；不是实时GI或专业烘焙光照。`resources.ts`统一缓存/释放新旧资源，`verify-assets.mjs`补哈希/尺寸校验。
- `FarmWorld.ts`按显式入口选择样板模型、局部构图、天空渐变/雾/暖光/PCF阴影；`browser.ts`等待真实图集完成才允许手动/自动开始，失败显式报错。独立审查发现“加载中重置后延迟开局”和“丢上下文后加载完成重新启用”两项Important，均先浏览器RED，再用初始sessionId取消延迟启动、独立renderFailed锁存修正；6项样板E2E保留负例。默认模拟/显式真实摄像头偏好继续沿用，无自动申请设备或失败切模拟。

### 实际验证与证据

首轮完整运行被中断：当时228单测/typecheck/lint通过，demo-toggle准备页开关等待失败。保留`verify-interrupted.log`、失败上下文和trace。复核trace：22.903秒`autoDemoSource.ts`请求出现`net::ERR_NO_BUFFER_SPACE`，点击前应用仍是未初始化静态HTML；约82.22秒另有源码修改触发Vite全刷新，解释后期元素脱离。初始错误上游原因未知，不能将其直接归为HMR或生产逻辑bug。

停止应用代码修改后实际`npm run verify`退出0：**228/228单测（32文件）、55/55浏览器E2E（7.3分钟）、typecheck/lint/build通过**；`npm run assets:verify`退出0。日志为`verify-final.log`、`assets-verify.log`。最终构建`index-DYRjJfQE.js`716.20KB/gzip190.79KB；500KB提示保留，图集另外本地加载。新材质/场景/模型测试19项，样板浏览器6项；全部旧测试保留。旧测试重生成的历史截图/JSON恢复原值，本轮证据单独存放。

生产实际运行：`npm run preview -- --host 127.0.0.1 --port 4176 --strictPort`。用`TIDAL_PREVIEW_URL=http://127.0.0.1:4176/?art=npr-sample`、`TIDAL_ART_DIR=artifacts/qa/npr-sample`、`TIDAL_ART_LABEL=delivered`运行`node scripts/capture-art.mjs`退出0；普通5秒倒计时、键盘零计数，已获得并查看`delivered-home.png/delivered-hero.png`与capture.json，1366×900、DPR1、画布比例1，0页面异常/外源。这是静态正式构建截图，不是模拟骨架识别或动态帧率证明。样板完整自动流程/暂停/库存15段/100奖励/重置在上述E2E验证，使用明确加速测试时长，不冒称重新跑过普通142秒整局或真人流程。

`TIDAL_PREVIEW_URL`同上、`TIDAL_PROFILE_OUTPUT=artifacts/qa/npr-sample/production-profile.json`运行`node scripts/profile-demo.mjs`退出0。Chromium156、SwiftShader软件GL、正常生产时钟/默认自动模拟、预热10秒后**2323样本/60.0308秒，38.70fps，p50 33.3/p95 33.4/max66.6ms，>50ms 3次**；比例0.64→0.5，结束683×450铺满1366×900，0页面异常/外源。不是硬件GPU结果；60fps目标**fail**，没有把脚本退出0写成性能达标，截图全分辨率也不代表动态画质。本轮优先停在局部审美检查点，后续需对样板绘制/阴影成本优化并在指定设备复测；不复用旧版55.72fps作为新样板证据。

README、SOURCES、DEPENDENCIES、素材来源与本轮QA索引同步。真实摄像头、真人标定/准确率/PiP/真人整局、硬件GPU和最终美术接受度继续`manual_pending`；既有P01=fail不变。本轮停在局部样板，等用户审阅比例、色光、树冠笔触与建筑风格，再决定修正或扩展；没有自动扩展全农场。安装/启动仍`npm ci`→`npm run assets:sync`→`npm run assets:verify`→`npm run dev`，访问`http://127.0.0.1:5173/?art=npr-sample`；正式构建/预览见上文。

手机审阅用`showcase.png`同为实际4176生产构建：`node artifacts/qa/npr-sample/capture-showcase.mjs`退出0，沿真实按钮收起计划卡，手动首页零计数、无摄像头、1366×900/比例1，0异常/外源；`showcase.json/log`记录条件。没有修改页面内容来模拟效果。电脑端预览入口已通过open_in_codex请求显示，工具返回queued，未声称已在用户标签页完成观察。

## 历史规划：日式动画田园NPR美术路线（2026-10-22，随后批准局部样板）

用户提供参考MP4并要求先规划：自然可信比例、日式动画田园幻想、Soft Toon与低频水彩环境贴图、柔和光照/暖阳/蓝天、分层绿地及空气透视，避免塑料、过度卡通/饱和或照片写实。本轮只读核对现有源码与契约；参考视频实际为98.4秒、1920×1080、30fps，用本机已有OpenCV抽取9个时点并查看接触表及约13.8/49.2秒原帧，没有完整逐帧或音轨分析，不把视频中联机/UGC/AI教练展示扩入范围。抽帧仅存临时目录，没有把视频或参考截图打包为项目素材。

拟采用现有Three0.186.1工程内的“关键GLB/原创手绘贴图＋共享Soft Toon＋低频烘焙明暗”路线，先做砍树—装车交界的一块可旋转样板，确认比例、色光、笔触与动作接触，再扩展全农场。保留SessionController、输入/标定/识别、默认模拟/真实摄像头切换、五段切木与手部/车把/绳索锚点。具体资产、着色配置与质量档仍为规划建议，未确认或实现，不把现有程序噪声称为手绘水彩。

实际只运行文件/源码检查与本地视频抽帧，没有安装依赖、修改应用、执行新测试/构建/性能测试、提交或推送。209单测/49E2E属于下方主分支上一轮证据；历史55.72fps为SwiftShader且自适应低分辨率，稳定约60fps仍fail，真人与硬件GPU继续manual_pending。本轮改动仅为本规划记录与SOURCES参考索引；下一步先确认风格样板范围与目标设备/质量档，再形成可执行设计与资源清单。

## 最新追加：按用户授权合入main，合并结果验证通过

用户于2026-10-21进一步明确要求“合入到主分支吧”，授权本轮将`feature/3d-farm-experience`合入并推送`main`，覆盖此前仅提交/push开发分支、不合并main的限制。本轮只集成已有成果，不扩大开发范围或对外部署；开发分支与下方历史记录保留追溯。

已fetch核对`origin/main=753c841`（PR #1），本地切换`main`并快进到该提交；随后将开发分支`daf2af1`以`--no-ff --no-commit`无冲突合入，先验证再形成双亲合并提交，保留双方历史。本次两侧提交/合并父提交为`753c841`与`daf2af1`，开发分支保留。

`AGENTS.md`更新本轮主分支授权，README当前分支及安装示例改为`main`。初始合并索引树与`daf2af1`完全相同，`artifacts/qa/main-merge/merge-context.json`记录实际树哈希。

首轮`npm run verify`实际208单测/typecheck/lint通过，E2E为48通过/1失败（6.4分钟）：停帧用例第13次期望13/15而实际12/15，尚未到达停帧门禁断言。原代码单独重跑1项通过（39.2秒），不能把首轮失败直接认定为生产跟踪或计数bug；日志`verify-first.log`、`stalled-reproduce.log`和错误上下文保留。首轮trace在Playwright重跑时被清理，具体逐帧原因未能还原，见`diagnosis.md`。

先以实际单测复现采样边界：450ms姿态窗口经66ms采样、平滑和确认后，下挥2310ms至复位2706ms仅396ms，应被400ms最短周期保护拒绝且无跟踪丢失；延迟70ms再回位则恰好计数。`chop-sampling-boundary.log`12/12通过，证明夹具风险，不冒称还原首轮时序。仅在测试侧新增`completeSyntheticChop`，等待真实ready/down阶段、保足最短周期，再复位并核对次数；两个完整摄像头合成流程共享，停帧observer/不得短暂active/load0及全部负例保留。定向同步版1项通过（48.3秒）；未改生产阈值、计数、来源隔离、模拟或摄像头链路，未引入重试/假计数/时钟加速。

第二轮`npm run verify`退出0：**209/209单测、49/49 E2E（6.6分钟）、typecheck/lint/build通过**，停帧用例在全套中46.6秒通过；随后`npm run assets:verify`通过。最终仍为`index-CYPYbaQo.js`693.52KB/gzip183.83KB，保留500KB提示；`application-diff.log`核对与开发分支的应用/依赖/脚本零差异。最终日志`artifacts/qa/main-merge/{verify-final,assets-verify}.log`，失败与修正证据未覆盖。历史跟踪截图/JSON恢复原值，本轮没有新增拍照/性能采样或重复安装。

本轮按授权只形成上述双亲合并提交并推送`main`，不force push、不删除开发分支、不对外部署；最终提交SHA和远端一致性由交付回复报告，可用`git log -1 --format='%H %P' main`和`git ls-remote --heads origin main`核对。README安装入口改为main，TEST_REPORT与本轮QA索引同步。检查点停在主分支集成；后续按原待办复测指定硬件和真实摄像头，不自动扩展功能。

验收状态保持：最新正式整局预热后**55.72fps**，稳定约60fps目标未达到，**P01=fail；49ID为33 pass、1 fail、15 manual_pending**。物理摄像头、真人准确率/标定/PiP/完整流程、硬件GPU与最终审美批准继续`manual_pending`；合入主分支不改变这些判定，也不代表真机通过。默认模拟、显式摄像头切换、领域与输入边界均保留。

## 历史追加：温暖卡通3D美术精修

用户明确批准本轮短设计：人物圆润轮廓与衣物细节，树皮/木纹/年轮/车板/绳结，屋瓦/田垄/作物/道路及接触明暗；保留原玩法、默认模拟和真实摄像头切换，重新验证约60fps，并沿用验证后提交/push开发分支授权。基线`d60e59e`，开始工作区干净，实际typecheck与原183单测通过；未改依赖/锁文件，不重新生成项目。

- `world/resources.ts`、新增`surfaces.ts`：11种共享128×128原创DataTexture，区分表面/颜色/顶点色缓存，圆角几何仍共享，纹理随世界释放。没有外部模型/贴图/字体或图片生成服务。材质共享/释放/圆角尺寸、道路2世界单位纹理平铺、顶点色材质隔离均实际RED→GREEN；道路不再把一块纹理拉伸48单位。
- `world/models.ts`：圆角农夫/NPC、领口/背带裤/手套/鞋底、圆角木纹车架、树皮和端面年轮、四层共享松枝。玩家43网格/4556三角、NPC37/3528、车45/3912、木材3/176、松树5/424；木材由5绘制降3。保留8种手部世界锚点、车把/轮轴/10段绳索接口与全部领域逻辑。接触阴影先复现被抬高道路遮住，再抬至含0.88倍NPC也可见的高度；树冠保留投影，取消粗阴影贴图造成的自阴影三角锯齿。
- `world/environment.ts`：三种作物轮廓、确定性色彩/大小/朝向、分层森林、建筑百叶窗/花箱/屋瓦、土垄/岩石/水面、道路草缘。6×72作物、130林木、96栅栏横杆、12果树、18草垛、农舍/风车/池塘与既有路线保留；20三角岩石替代168三角球体，为植被细节腾预算。最终环境**138绘制对象/1169部件/40624三角形**，维持150绘制对象上限和42k三角形预算。
- `world/FarmWorld.ts`仅调整光照/色调/雾和美术版本v2；不改渲染比例策略/相机/计时/输入/库存。大面积草地使用375顶点/672三角形的确定性颜色变化，免纹理采样；近景木纹、树皮、年轮、屋瓦与布料保留。新增actorArt、environmentArt、artResources共25项单测；原staticBatch测试将v1外形快照换成实际场景保全/区域/预算，保留矩阵/材质/阴影/裁剪负例。

### 实际画面与性能

`scripts/capture-art.mjs`在真实4175生产构建获取前后首页/近景截图，无摄像头、正常5秒准备、手动键盘零计数，均为1366×900、DPR1/3D比例1；实际已查看，不能把静态全分辨率图拿作动态帧率。所有证据在`artifacts/qa/art-polish/`。首次预览连接被拒绝，重新启动4175后成功；`before-server-retry.log`如实保留，不沿用旧阻塞。

首版含纹理60秒实测55.00fps；首休息8秒定位52.39fps，对照取消纹理采样60.00fps（仅定位，不是交付或摄像头证据）。改采样方式后8秒57.39fps，再把草地主面改为顶点颜色。最终`index-DEI107uw.js`预热10秒后**3500样本/60.0142秒，58.32fps，p50 16.7/p95 16.8/max66.6ms，>50ms 1次**；实际SwiftShader、0页面异常/外源，比例0.8→0.5，结束683×450铺满1366×900。装车59.72fps、第二休息58.22fps，未承诺锁60/同分辨率/硬件GPU或真人性能。前轮59.74fps属于旧美术，不能冒用。方法/候选数据分别保留`profile`、`sampler-profile`与`final-profile`JSON。

### 本轮实际验证与交付

一次独立审查发现旧视觉E2E仍固定v1，定向实际RED后只更新为v2，动作/暂停/库存负例全部保留。首轮全套在已知过时断言处运行前主动中断，`verify-interrupted.log`保留，不声称通过；修正后`npm run verify`退出0：**208/208单测、49/49 E2E（6.3分钟）、typecheck/lint/build通过**，见`verify-final.log`，对应上述DEI构建。

最终截图复查发现草捆侧面误用年轮，仅改为已有纵向纹理并保留金黄色。此后typecheck/lint、208单测、1项完整七阶段视觉E2E、build、assets:verify全部通过，见`material-final.log`。最终`index-CYPYbaQo.js`693.52KB/gzip183.83KB，保留500KB体积提示；未把修正前49项写成修正后重跑。最终全分辨率静态图为`delivered-{home,hero}.png`；15张最终动作回放在`replay/`，浏览器受控时钟只验证表现/暂停/守恒，不测fps。

`$env:TIDAL_QA_DIR='artifacts/qa/art-polish'; $env:TIDAL_BLOCK_EXTERNAL='1'; node scripts/verify-auto-demo.mjs`在实际4175正式构建退出0：**142.227秒**完成正常5/15/60、15次挥砍/15次装车/60秒有效持姿、15段到家、100/100游戏奖励和返回首页重置，0页面异常/外源/姿态资源请求。预热后**131.6948秒/7338样本，55.72fps、p50 16.7/p95 33.3/max33.5ms、>50ms 0**；运送截图时比例0.512、699×460铺满1366×900。四张正式截图实际生成，已查看训练/运送/结算；文字/PiP/结果可读，3D边缘软化可见。正式整局与草捆修正前独立60秒58.32fps分别报告，不能挑较高值声称最终整局60fps。

针对整局帧率再做唯一远景树林去纹理对照：同正常首休息8秒采样，58.13fps/比例0.5→57.88fps/比例0.512，未显示明确收益且分辨率不同，不推断因果，已恢复纹理；`forest-{before,after}-profile.json/log`保留为短诊断。恢复后重新build，`restored-build.log`核对bundle仍精确为已验证的CYPYbaQo，不提交该候选。**本轮没有稳定达到约60fps，P01保守记fail；49验收ID为33 pass、1 fail、15 manual_pending**，功能测试通过不等于性能目标或真机通过。

README、TEST_REPORT、开发指南、来源和资产许可说明已更新；证据索引见本轮目录README。完整回归生成的DEI版布局/合成PiP/资源记录另存`full-suite/`，旧轮次被重生成的历史截图/JSON恢复原版。原依赖/锁文件未改，不重复安装；按授权只提交/push开发分支，不合并main、不公开部署。

原SessionController/编排/输入/识别器与模拟偏好均未改。无物理摄像头，真人精度/标定/PiP/真人整局/端到端、硬件GPU与产品最终美术继续manual_pending。运行方式仍见README；默认自动演示，关开关可回键盘或显式申请真实摄像头。本轮停在已批准的美术精修检查点；下一步在指定演示硬件复测画质/性能、继续定位稳定60fps差距，并在设备到位后按DEMO_RUNBOOK完成真机步骤。下文为历史记录。

## 历史追加：接近60fps的演示流畅度优化

用户要求继续优化流畅度、保留默认模拟和真实摄像头切换，验证后提交/push。工作分支仍`feature/3d-farm-experience`，基线`5f5579f`；本轮开始工作区干净，实际typecheck和原170单测通过。保留原SessionController、输入适配器、标定/识别器、配置、依赖及全部负例，没有新增引擎或改写业务。

- `src/game/world/{environment,staticBatch}.ts`：只对不可变环境按几何/材质/阴影和16单位空间格合批，476个可绘制网格降到138，保留36,176三角形/1,031部件、原实例与全部变换/阴影。先用数量预算实际RED；全局合批在生产对照中没有改善fps且裁剪变差，新增远端裁剪RED后改为空间合批，5项GREEN。没有用删除场景达预算。
- `src/ui/domUpdates.ts`、`src/browser.ts`：缓存稳定ID节点，相同文本/属性/类名/进度不重复写；合并同一帧内中间文案，保留动作阶段即时反馈、单路PiP与切源调用。新增`render-efficiency.spec.ts`先测到20帧140次无效DOM修改而RED，修复后零修改/节点保留及一次完整计数2项GREEN。没有节流Controller或整个界面订阅。
- `src/game/world/{adaptiveResolution,FarmWorld}.ts`：只对3D画布自适应像素比，初始min(DPR,1.25)、最低min(初始,0.5)。连续绘制400ms均值>17.5ms且有至少2帧/5%慢帧、当前仍慢时降0.8倍；暂停/静止/后台/无效或>250ms间隔清观测，刷新才重新评估，避免反复升降。短动作、55fps重复漏刷新、单尖峰、恢复、低DPR、下界均先实际失败再修复；8项策略测试通过。不改变运动输入频率、有效时间或库存。
- `scripts/profile-demo.mjs`、`scripts/verify-auto-demo.mjs`：新增可复测60秒rAF/实际GPU/CPU布局/WebGL调用诊断，正式整局补运送截图与实际画布比例。原始失败/候选结果全部保留在`artifacts/qa/performance/`，各JSON版本、方法与计数器口径见该目录README。一次独立只读审查无剩余C/I/Minor，单尖峰建议已用RED→GREEN处理；后续实测门禁参数修正另有负例，不重复派审查。

### 实际性能对照

同一Chromium156.0.8078.4、1366×900 CSS像素、DPR1、正常生产时长，预热10秒后观察60秒，默认自动模拟、ANGLE SwiftShader软件渲染：

- 原始`index-DNN17GvQ`：**40.47fps**，p95 33.4ms，2429样本/60.0143秒；原分辨率。仅去背景模糊的8秒诊断无收益，未据此修改CSS。
- 最终`index-w4yGvhR9`：**59.74fps**，p50/p95 **16.7ms**、最大33.4ms、>50ms **0次**，3585样本/60.0143秒；0页面异常/外源。装车及第二休息约60.00fps，首休息59.67fps，挥砍59.09fps。完整原始数据为`final-confirmed-profile.json/log`，`final-profile.json`是57.24fps中间候选，不混用。
- 代价必须明确：3D画布比例逐步1→0.64→0.512，结束实际**699×460**、CSS仍1366×900；不是同分辨率达到60fps。文字/摄像头视频清晰度不变。布局耗时0.781264→0.024931秒，次数2436→164；更高帧数下ScriptDuration增加，未谎称所有CPU时间都下降。
- 基线JSON旧`renders/*PerRender`命名实际指COLOR清除/pass，不是呈现帧；保留原数据，后续改用`colorClears/*PerColorClear`。fps只取独立rAF间隔，不拿draw次数、HTTP200或时钟模拟当fps。硬件GPU、真人推理与端到端性能仍`manual_pending`。

### 本轮验证与交付

- `npm run verify`退出0：**183/183单测、49/49 E2E（6.1分钟）、typecheck/lint/build通过**。`npm run assets:verify`通过本地模型、MediaPipe运行时、原创素材和Three许可校验。主包`index-w4yGvhR9.js`678.15KB/gzip178.65KB，原500KB提示保留；最终日志`verify-final.log`、`assets-verify.log`。
- `$env:TIDAL_QA_DIR='artifacts/qa/performance'; $env:TIDAL_BLOCK_EXTERNAL='1'; node scripts/verify-auto-demo.mjs`在实际4175生产预览退出0：**141.930秒**完成正常5/15/60、15次挥砍/15次装车/60秒有效持姿、15段到家、100/100游戏奖励与返回首页重置；来源始终标为自动模拟，0页面异常/外源/姿态资源请求。预热后**131.3447秒/7701样本，58.63fps、p50 16.7/p95 16.8/最大33.5ms、>50ms 0**；与独立60秒59.74fps不同范围，分别报告。日志/JSON和四张实际截图均保存在本轮证据目录，已查看训练、运送和结算图片，文字/PiP/结果可读；3D边缘软化可见，最终主观画质仍待用户确认。
- 当前49验收ID为**34 pass、0 fail、15 manual_pending**，P01只在本机软件GL/自适应条件下达到约60fps，不保证锁60或指定硬件/真人性能。README/TEST_REPORT/开发指南/来源说明已更新。旧轮次被测试重生成的历史截图/JSON均恢复原版，本轮证据独立保存。

未更改依赖/锁文件，本轮不重复安装；上一轮干净安装记录仍保留并明确版本。真实骨架/九步标定/准确率/真人PiP/真人整局、硬件GPU与现场物理断网继续`manual_pending`；最低比例主观清晰度和最终美术由用户确认。保留默认开/刷新新会话、显式关与真实摄像头选择的记忆；不自动申请设备、不静默回模拟。

安装与启动仍为`npm ci`→`npm run assets:sync`→`npm run assets:verify`→`npm run dev`；正式`npm run build`→`npm run preview -- --port 4175 --strictPort`。本轮停止在性能增量检查点；下一步在指定演示设备验证硬件GPU和真实摄像头，或处理用户明确指定的新反馈。按授权只提交/push当前开发分支，不合并main、不公开部署。下文为历史记录。

## 历史追加：模拟默认开启与刷新自动演示

用户明确要求默认开启、刷新可直接看效果、保留开关/以后切真实输入，验证后提交push。工作分支仍`feature/3d-farm-experience`，基线`f32f973`；开始工作区干净，实际typecheck与170单测通过。采用现有开关/启动流程的小改动，不新增假摄像头或人工关键点识别链路。

- 新增`src/ui/demoPreference.ts`，只保存同源`tidal.demo.enabled`布尔偏好；缺省开启，显式关闭或选择摄像头保存关闭。浏览器禁用存储时默认演示仍可用，本页关闭仍有效，跨刷新无法记住。
- `src/browser.ts`读取偏好并在一次页面启动时沿原Controller命令进入准备/正常倒计时；不直接修改次数/计时/库存。刷新新会话、不恢复旧进度；reset/结算返回首页保留选择，但不循环再开局。图形初始化失败早于自动启动门禁，不可隐形推进；初始后台沿用显式恢复规则。
- 新增`tests/e2e/default-demo.spec.ts`：默认开局/刷新与完整模拟结算、持久化关/重新开、真实摄像头失败后保持手动、存储受限、图形失败不自动运行。前4项先实际失败（`red.log`），实现后4项及旧模拟/3D相关共16E2E通过，追加图形门禁1项通过。
- `tests/helpers/manualModeTest.ts`和原9份E2E仅显式写入真实“关闭模拟”偏好，以保留旧首页/键盘/摄像头负例；模拟结算reset断言改为保留开启，同时仍验证零计数/首页/不自动开局。没有生产测试旁路、没有删除负例。
- 三个现用诊断脚本显式选择手动入口，正式整局脚本reset断言同步偏好；旧`verify-production.mjs`含历史Phaser断言，本轮未运行、不声称通过。依赖/领域/识别器/模型未修改，不重复安装。
- 一次独立只读审查0 Critical/0 Important/0 Minor，无二次审查；详情`artifacts/qa/default-demo/review.md`。最终`npm run verify`退出0：**170/170单测、47/47 E2E（6.2分钟）、typecheck/lint/build通过**，随后`npm run assets:verify`通过；主包`index-DNN17GvQ.js`675.90KB/gzip177.91KB，保留500KB提示。详见`verify.log`、`assets-verify.log`。
- 4175预览服务继续提供最新`dist`；`node artifacts/qa/default-demo/production-smoke.mjs`退出0（18.339秒），实际普通5秒准备、60秒目标，`?e2e=1`不加速。默认打开/刷新自动新会话、关闭冻结且跨刷新保持手动、明确摄像头失败后不回模拟/不自动再申请视频、重新开启后刷新恢复均通过，0页面异常/外源/姿态资源请求。截图与`production-smoke.json/log`实际生成。摄像头失败分支注入NotFoundError，不是真机；这是启动/刷新冒烟，不是重复生产整局或性能基准。

证据目录`artifacts/qa/default-demo/`，旧轮次自动生成的截图提交前恢复原版，不覆盖历史。README/路演手册/来源与开发指南同步新默认；真机识别/标定/PiP/硬件性能继续manual_pending，不将合成骨架或自动流程写成真实摄像头通过。下面真3D整局142.219秒/39.59fps均为上一轮`03e249a`证据，本轮未重新做性能基准。

本轮验证完毕后按用户授权提交/push当前开发分支；没有合并或推送main，没有公开部署。后续只补真机/硬件与产品验收，或用户另指定的工作。

## 历史检查点：真3D软件交付完成，性能目标与真机/产品验收保留待办

用户要求并批准可旋转真3D、全景首页/紧凑通知、单路摄像头PiP、每树5段、人物推车/手部抛木/NPC绑绳、连续远程运送和等宽运动/奖励结算；设计与实施清单已确认，按当前目录执行。用户既有验证后commit/push授权继续有效，只推开发分支，不合并main、不对外部署。

- 分支`feature/3d-farm-experience`，应用基线`30e36e3`，设计提交`0baf882`。开始时工作区干净，实际typecheck/155单测通过；保留领域、输入、识别器及有效负例，未重新生成项目。
- `0d24a9c`：`demoConfig.ts`默认初始0/每树5，三树15段，与15次装车对应；配置/领域回归先3失败后156通过。单木段夹具显式覆盖1，原SessionController实现未改。
- `5e8bc67`：新增`src/game/world/{types,choreography}.ts`及回归；只读快照与原ActionAnimator，按ID表示地面/手持/飞行/车上/到家。先6失败，边界再2失败，修复后165单测；人车同速/手部锚点/绳索/40世界单位路线不写业务进度。
- `815bb8b`：精确锁定Three0.186.1/类型0.186.0，新增`FarmWorld/models/environment/resources`及GameView入口；真实关节人物、建筑/田地/森林、投影、Orbit旋转缩放/全景重置。旧Phaser源码与3.90.0依赖保留，当前只运行Three，无第二个隐藏画布。原渲染器下相机测试先失败，真实相机/投影改变后通过。
- `f9d62e1`：`index.html`、`web/world.css`、`browser.ts`、`ui/gamePreview.ts`：约368px通知、全视口农场、游戏内PiP/阶段/处方、运动与奖励等宽结算。复用同一video/srcObject/track/Worker，切回准备不重开捕获。布局/PiP先2失败，镜头暂停/迟到play错误保护先失败后修复，168单测/新增5E2E通过。
- `ac2f28c`：旧七阶段动作/NPC/暂停像素冻结/放下停止/重置回归适配3D；真实8枚碎屑、初始化中途失败释放canvas/GL/监听/几何材质、实例资源；木头提交后不提前拿下一根、NPC面向货物，均先失败后修复。169单测通过；已实际查看首页、Orbit、推车、抛木、绑绳、PiP与结果截图。
- `03e249a`：一次独立全分支只读审查（0 Critical/2 Important/0 Minor），分别复现WebGL丢失后可恢复隐形计数、同epoch过快Load被拒绝后飞木残留；2浏览器/1单测先失败，统一门禁及新rep未提交木材清理后170单测/定向2E2E通过。未改识别器与领域规则；未做第二次审查。未裁决设备/观感范围见`artifacts/qa/3d/review.md`。

### 本轮实际验证命令与证据

- `npm ci`成功（145包/audit146、0漏洞），`npm run assets:sync`、`assets:verify`通过；Three许可随本地资源同步并校验。日志在`artifacts/qa/3d/`。
- 首轮`npm run verify`通过：169/169单测、41/41 E2E（6.0分钟）、typecheck/lint/build。审查修复后最终`npm run verify`退出0：**170/170单测、42/42 E2E（6.1分钟）、typecheck/lint/build**；`index-CgL4PAsP.js`675.50KB/gzip177.76KB，保留500KB警告；`assets:verify`再次通过。详见`verify-final.log`、`assets-verify-final.log`。
- 每项RED/GREEN日志与实际截图保存于`artifacts/qa/3d/`；合成PiP截图有QA说明，不是真人证据。旧测试生成的历史图片在最终提交前恢复原版；新回放/三尺寸证据保存于本轮目录。
- 正式dist已独立运行：`npm run preview -- --port 4175 --strictPort`（服务保持可用），另终端`$env:TIDAL_QA_DIR='artifacts/qa/3d'; $env:TIDAL_BLOCK_EXTERNAL='1'; node scripts/verify-auto-demo.mjs`退出0。正式5/15/60配置，**142.219秒**完成15/15/60、到家15、100/100奖励和重置；0页面异常/外源/姿态资源请求。生产截图真实生成并查看；`node artifacts/qa/3d/capture-home.mjs`另验证正式60秒首页并截图，不使用e2e加速。
- 本轮3D性能：预热10秒后131.5614秒/5209样本，平均**39.59fps**，p50 33.2ms/p95 33.4ms/max50ms/>50ms 0。实际ANGLE SwiftShader软件渲染，硬件GPU未测；**约60fps目标仍未达，P01=fail**，不拿候选30fps作通过。没有复用旧2D性能。当前49ID为33 pass/1 fail/15 manual_pending；旧报告原样移至`docs/history/T11_2D_TEST_REPORT.md`。

### 保留待办与使用

无物理摄像头，真实骨架/九步标定/动作精度/游戏PiP连续播放/真人整局/推理与端到端延迟均`manual_pending`；软件GL异常注入不证明所有驱动故障已覆盖。最终美术自然度/绳索贴合/音效听感/硬件GPU与物理断网彩排仍待用户设备验证。A03数量与真3D方向已批准；A04/A06/A07/A08及A09最终成品批准仍待确认。

安装`npm ci`→`npm run assets:sync`→`assets:verify`，开发`npm run dev`；正式`npm run build`→`npm run preview -- --port 4175 --strictPort`，访问localhost:4175。首页可拖拽/滚轮/全景重置；接受计划→无摄像头测试开→自动演示，重置默认关。摄像头到位后关闭模拟、先标定再显式开始，同一路视频移入PiP；壶铃摇摆示例只用于处方格式，不宣称新增摇摆识别。

交付提交`499d0f9`已成功push到`origin/feature/3d-farm-experience`，`git ls-remote`核对相同SHA；本段随后补记，不改应用。49ID及26份证据核对通过，旧报告归档Git blob与原版完全相同。没有合并/推送main、没有公网部署。预览服务保持4175可用。

本轮在批准范围交付检查点停止。下一步仅补指定设备硬件GPU性能与真实摄像头/产品签字，或针对明确性能目标另做优化，不自动扩大功能。安装/测试完整命令见README，人工步骤见`DEMO_RUNBOOK.md`。下文均为历史记录。

## 历史：2026-10-16 T07–T11

## 当前检查点：T11 证据交付收尾，真机与签字仍未完成

- T07砍树/复合装车识别、T08持姿代理、T09摄像头输入联调、T10本地交付打磨已逐阶段验证、commit/push；分支`feature/t07-t11-completion`，提交依次`98aaba9`、`85df391`、`872b34c`、`d4d086f`。未合并或推送main，未对外部署。
- T11更新`docs/TEST_REPORT.md`逐项验收、README与实施记录；路演手册含启动/备用切换/故障恢复/真机记录模板。49个ID：**33 pass、1 fail（P01）、15 manual_pending**；六个产品默认值保留未批准。范围内审查问题已通过RED→GREEN修复，保留原领域逻辑和全部负例。
- 最终应用验证来自T10同一代码：干净安装/资源校验、typecheck/lint、**155单测、35 E2E**与build通过，正常时长生产自动整局**142.983秒**结算重置通过。T11只改文档，不虚构重复运行；验收ID与证据文件核对结果见`artifacts/qa/t11/report-audit.json`。
- **保留未达标项**：P01软件渲染环境平均40.06fps，未达约60fps目标；短对照确认SwiftShader与农场渲染负载，硬件GPU表现未测。C01–C08、V01–V04、P02/P03/P04为人工待办：真人识别/性能/端到端延迟、产品视觉批准、物理断网彩排。不能称L2/L3或全部验收通过。
- 当前可看：`npm run preview -- --port 4175 --strictPort`，访问`http://127.0.0.1:4175/`；生产预览服务已启动。接受计划→打开无摄像头测试→自动演示，开关仍可关闭。
- 下一步仅补指定演示设备/摄像头测试、硬件加速性能复核或针对软件渲染优化，以及A03/A04/A06/A07/A08/A09产品签字；按`DEMO_RUNBOOK.md`记录失败逐例复测。没有自动扩展到新功能阶段。

## T10 软件交付验证记录

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
