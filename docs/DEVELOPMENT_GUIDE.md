# 居家运动 × 农场经营 Web Demo：Codex 开发流程文档

> 2026-10-21用户批准温暖卡通真3D美术精修，当前美术v2：圆角人物/车架、共享原创纹理、分层植被与差异作物、建筑/道路/接触明暗。近景保留纹理，草地主面改用顶点颜色控制软件GL成本；几何/材质/纹理仍归WorldResources释放。原领域/编排/动作锚点/默认模拟/真实输入契约不变，性能与最终观感以本轮独立实测为准，不沿用v1帧率。详见PROGRESS、TEST_REPORT与public/assets/README。

> 2026-10-21演示流畅度增量：静态场景按材质/几何/阴影及16单位空间格合批；相同DOM内容不重复写入。3D渲染比例从min(DPR,1.25)开始，连续绘制400ms均值>17.5ms、至少2个且占比≥5%的慢帧、当前帧仍慢时降至原比例0.8倍，最低min(初始比例,0.5)。静止/暂停/后台/异常间隔清观测，不自动升档，刷新重新评估。只调整3D画布像素密度，不改视频、输入、计时、库存和奖励；这是性能策略，不是新增运动或产品规则。当前实测见PROGRESS与TEST_REPORT。

> 2026-10-21用户追加并明确授权：无摄像头模拟默认开启，首次打开/刷新自动演示；保留开关和真实摄像头入口。显式关闭/选择摄像头保存为同源布尔偏好，刷新保持手动，不自动请求摄像头、不静默切回模拟；reset只回首页并保留选择，不循环自动开局。该授权覆盖历史默认关闭/首次必须手动接受计划的演示入口；正式5/15/60、源隔离、计数与奖励规则不变。

> **当前范围覆盖（2026-10-21，用户已批准）：** 默认渲染改为`three@0.186.1`真3D，支持Orbit旋转/缩放/全景重置，视口铺满浏览器；旧Phaser3.90.0源码保留但不并行运行。A03改为初始0、每树5段、3树共15段；40为示意世界单位路线。紧凑计划通知、单路摄像头PiP、推车/手部抛木/绑绳及等宽结算见`3D_FARM_DESIGN.md`。下文原T01–T11引擎/2D路径属于历史方案；当前入口返回`GameView`，实现为`WorldChoreography`与`FarmWorld`，不再返回`Phaser.Game`。所有领域、输入与隐私契约继续有效；摄像头真机和最终美术仍待验收。

> 2026-10-15接手说明：本目录现已有应用源码，T01–T04本轮结果见`PROGRESS.md`。以下原始方案中的“未提供源码”描述是编制时背景，不是当前工程状态。

> 版本：v1.0｜编制日期：2026-10-14｜状态：可执行开发草案，未完成产品确认和真机验证。
>
> 本文是实现与验收说明，不是已经实现的源码。原需求见 `../sources/demo_requirements.docx`；来源与图片说明见 `SOURCES.md`。正文的 **[R]** 表示原文要求，**[A]** 表示本方案新增的工程建议或临时默认值，**[TECH]** 表示核对过的技术资料。未标为 [R] 的架构、阈值、性能目标和工期拆分均为设计建议，不是原需求中的既定事实。
>
> 执行者：Codex。逐任务开发、逐任务验证，先完成 T01–T04 的第一个检查点。使用现有仓库时先读取其 `AGENTS.md`、检查未提交修改和已有依赖，不要直接重建项目。项目没有提供现有代码仓库，因此下列路径是新项目的建议路径。

## 0. 交付目标和边界

**Goal：** 实现一套浏览器内的“训练计划 → 砍树 → 木头装车 → 拉车回家 → 奖励结算”交互闭环，支持摄像头输入和明确标识的键盘演示输入。

**Architecture：** 将人体姿态输入、动作识别、任务规则和表现层分离。当前Three.js只消费快照与效果，旧Phaser源码保留。任务进度由一个纯 TypeScript 控制器拥有；摄像头和键盘通过相同的动作事件协议驱动它；场景和界面只消费快照与表现事件。

**Tech Stack：** Three.js0.186.1（当前入口）、Phaser3.90.0（旧源码）、TypeScript、Vite、MediaPipe Tasks Vision、原生 HTML/CSS、Vitest、Playwright。

**Spec：** 本文第 1–9 节；任务计划为第 10 节；独立验收表见 `ACCEPTANCE.md`。

### 0.1 本次必须得到什么

- 可启动、可构建的 Web 项目和完整键盘演示闭环。
- 摄像头权限、模型初始化、人体姿态预览、标定、两类重复动作识别，以及持姿代理计时。
- 玩家动作与角色动作的阶段对应关系，不只是“识别一次后播放一整段无关动画”。
- 运动计数、资源变化、NPC 合作、休息倒计时、奖励结算与完整重置。
- 单元测试、浏览器测试、真机验证记录、部署与路演操作说明。

**不能提前承诺：** 摄像头方案在任意家庭环境可用、能证明用户拿着指定重量的壶铃、能测得心率/卡路里、或已经达到原文“动作完全同步”的全部含义。

### 0.2 不在一周范围内

真实 PvP/联机、账号系统、数据库、云存档、完整种植养殖经济系统、支付、真实 LLM 训练规划、医学运动评价、自训练姿态模型、器械重量识别、通用全身动捕重定向与物理模拟。真3D场景已由本轮用户追加批准；并未因此引入物理引擎或全身动捕。

原文的采集、种植、养殖、加工、交易、建设属于完整产品故事；本次实现其明确列出的五步演示，不把故事背景自动扩展成全部开发任务。[R：原文第 1–2 页]

### 0.3 Global Constraints

1. 当前入口锁定`three@0.186.1`及类型0.186.0；历史Phaser仍固定3.90.0，不能使用latest擅自升级。[A01][TECH01]
2. 新项目使用 TypeScript strict；包管理器统一 npm；提交 `package-lock.json`。已有仓库保留其合理约定，不平行维护第二套锁文件。
3. 面向桌面Chrome/Edge、单人、固定机位；记录验收机器与浏览器版本。当前3D画布自适应全视口，检查1280×720、1366×768、1920×1080，不沿用旧固定逻辑画布。[A02]
4. 正式流程：三项任务各有 5 秒开始倒计时；砍树和装车后各休息 15 秒；拉车有效计时 60 秒；回家后直接结算。[R：第 2–5 页]
5. 原文数量冲突按 A03 暂设为配置，所有界面从同一配置派生，禁止手写互相矛盾的数字。
6. 任务状态、计时、库存只由 `SessionController` 修改；Phaser Tween、音效回调、DOM 动画不能成为发奖依据。
7. 模拟输入、预录回放、示例指标和预设计划必须有可见标识。不得把它们包装成真实摄像头识别、真实健康数据或真实 AI 规划。
8. 摄像头画面默认仅在本机内存处理；不上传、不录像、不自动保存关键点轨迹；只请求视频权限。
9. 摄像头链路失败时明确报错；不得静默切成键盘、随机数或自动计时。
10. 超出原文或本方案默认值的变化先记录；可能改变产品承诺、增加付费依赖、外发数据、覆盖文件或扩大范围时先询问。

### 0.4 Review Focus

优先复核五类失败：

- **错误输入仍获奖励：** 截断动作、重复事件、无关键点、回调乱序。对应 T03、T07、T09。
- **时间被错误累计：** 放下器械、丢帧、切后台、恢复时补算大段时间。对应 T03、T08、T09。
- **新一局混入上一局状态：** 延迟 Worker 返回、Tween、键盘定时器、事件订阅未释放。对应 T04、T09、T10。
- **模型或设备不可用却假装成功：** 权限拒绝、摄像头被占用、WASM/模型缺失、GPU 路径失败。对应 T02、T09、T10。
- **视觉反馈与规则不同步：** 倒计时多走一遍、木头重复入库、未复位就记次、NPC 生成额外库存。对应 T03、T05、T07。

---

## 1. 原始需求映射

| ID | 原文要求及位置 | 本次实现入口 | 验收入口 |
|---|---|---|---|
| R01 | 一周，Web 路演 Demo；第 1–2 页 | 项目范围与构建部署 | T01、T10、T11 |
| R02 | 首页推送劳作/训练计划，确认或取消；第 2–3 页 | Home/PlanPanel | F01、F02 |
| R03 | 开始前倒计时 5 秒，任务间休息 15 秒后再倒计时 5 秒；第 3 页 | SessionController | F03、F06 |
| R04 | 壶铃上肩、挥砍、上肩复位对应角色动作，“动作完全同步”；第 3 页 | ChopRecognizer、ActionAnimator；同步定义见 A04 | F04、V02、C03 |
| R05 | 每砍 5 次倒一棵树，共砍 3 棵；第 3 页 | Chop 计数与树木表现 | F04 |
| R06 | 休息时角色收集木头，连同原有木头共 15 棵，推车靠近；第 4 页 | 脚本过场，数量冲突见 A03 | F06、F11 |
| R07 | 蹲下、站起、壶铃过顶映射抓木头、上肩、扔上车、复位；每次装一棵，共 15 棵；第 4 页 | LoadRecognizer、装车表现 | F05、C04 |
| R08 | 装车后休息 15 秒，角色自动收集树木；第 4 页 | 保留收拾场地的过场意图，不额外加库存；见 A05 | F06、F11 |
| R09 | 持续提壶铃 1 分钟拉车回家；允许放下，车也停止；第 4–5 页 | CarryRecognizer、有效计时 | F07、C05 |
| R10 | 机器人在旁边合作，不做真实 PvP；第 2 页 | NPC 脚本 | V03 |
| R11 | 结算奖励树木×15、体力100、金币100、盲盒T恤；第 5 页 | ResultsPanel、游戏奖励 | F08、F09 |
| R12 | 连续66天、500卡、平均心率130、20min、表现+5；第 5–6 页 | 保留字段，真实/示例分栏，见 A07 | D01、D02 |
| R13 | 返回首页重置游戏；第 6 页 | reset()与资源清理 | F10、E08 |
| R14 | 体现AI规划任务；第 2–3 页 | 预设训练计划并标识；真实AI不在本期，见 A08 | D03 |
| R15 | 体现农场美术与运动正反馈；第 1–4 页 | 统一视觉、角色/场景反馈、结算表现 | V01–V04 |

**源文档限制：** 第 2 页两处“游戏机制、美术参考”显示“该类型的内容暂不支持下载”；不能推测缺失链接的内容。三张可读取参考图已随包保留，只作视觉参考，不代表它们能直接拆成可商用游戏资产。见 `SOURCES.md`。

---

## 2. 待确认项与工程默认值

这些默认值让 Codex 可以先开发，但**不等于用户或甲方已经批准对原需求的修改**。在 `PROGRESS.md` 保留每项的“未确认/已确认/被替换”状态；最终验收时分别说明满足原文的部分和仅满足临时方案的部分。

| 编号 | 原文缺口或冲突 | 本文临时默认值 | 更改影响 |
|---|---|---|---|
| A01 | 原文未指定引擎 | 2026-10-21用户批准Three.js真3D，固定0.186.1；旧Phaser3.90.0保留 | 已批准本轮范围，非原文要求 |
| A02 | 未明确设备、机位、UI框架 | 桌面、单人、固定机位；原生DOM/CSS做面板，不额外引入React | 已有React项目可复用，不为此重写 |
| A03 | 首页“5棵/5×3次”，详细步骤“3棵/每棵5次”；装车15棵 | 本轮已确认3棵×5次，每树5段，初始0，共15段；替代旧12+3×1 | 2026-10-21设计批准；配置生成所有文案 |
| A04 | “动作完全同步”没有精度、延迟、停顿定义 | 本期采用动作阶段同步；关键阶段随真人停顿，不是全身关节动捕 | 属于范围澄清/可能降级，不得称已完整满足原文 |
| A05 | 装完车后又“收集树木”含义不清 | 做整理场地/固定货物的无新增库存过场，保留休息节奏 | 不凭空追加木材 |
| A06 | 未定义壶铃静态持握的检测方式 | 摄像头采用“持姿代理”；先标定持姿和放下姿态，无法区分则禁止启用自动Carry | 无法证明器械存在、握力或重量；真实持握确认另立范围 |
| A07 | 健康指标和连续训练天数没有数据来源 | 实际计数/有效时间真实显示；未知心率/卡路里显示“未接入”；原示例数值仅在独立示例区展示 | 不把演示值混入实测结果 |
| A08 | AI规划未给输入、接口、算法 | “预设训练计划（概念演示）”，不接LLM服务 | 需要真实AI时另拆接口与验收 |
| A09 | 美术方向未统一，未提供可用分层/序列素材 | 用户批准暖色真3D、旋转镜头与原创模型方向 | 方向已批准，最终视觉与动作节奏仍需人工验收 |
| A10 | 没有说明摄像头是否必须真识别 | 摄像头作为目标功能；键盘只作开发和路演备用，不替代真机验收 | 摄像头未验证必须如实标记 |

### 2.1 数值配置：单一事实来源

建议在 `src/config/demoConfig.ts` 定义：

| 参数 | 临时值 | 说明 |
|---|---:|---|
| `treeCount` | 3 | A03，详细砍伐步骤的解释 |
| `repsPerTree` | 5 | R05 |
| `logsPerTree` | 5 | 本轮A03已确认；演示资源单位，不是林业换算 |
| `initialLogs` | 0 | 本轮A03已确认，替代旧12默认值 |
| `startCountdownMs` | 5000 | R03 |
| `restMs` | 15000 | R03/R08 |
| `carryTargetMs` | 60000 | R09，累计有效时间 |
| `staminaReward` | 100 | R11，游戏数值 |
| `coinReward` | 100 | R11 |
| `blindBoxReward` | `tshirt` | R11，本期固定展示不做付费抽奖 |
| `trackingMaxAgeMs` | 300 | A，数据过期阈值，需真机调校 |
| `maxPoseGapMs` | 200 | A，允许用于有效计时的最大相邻样本间隔 |
| `poseTargetHz` | 15 | A，初始推理目标，性能不够先测再降 |
| `phaseConfirmMs` | 120 | A，阶段去抖起点，不是运动标准 |

派生值：

- `chopRepTarget = treeCount * repsPerTree`，默认15。
- `loadRepTarget = initialLogs + treeCount * logsPerTree`，默认15。
- 每完成一次装车，累计计数`loadReps += 1`、车上库存`cartLogs += 1`、地面库存`groundLogs -= 1`。
- 到家后将`cartLogs`转移到`deliveredLogs`并将`cartLogs`清零；累计动作计数`loadReps`保持不变。结算木材由实际到家量显示，**不能到家加一次、点结算又加一次**。
- `staminaReward`、`coinReward`及T恤每局只发一次。
- 首页文案、HUD、场景数量与奖励说明均从配置/状态生成。

必须区分“本轮新砍3棵”和“本次搬回15单位木材”，不能声称15棵全部由本轮15次挥砍获得。

### 2.2 产品确认闸口

开发可以按上述默认值制作可配置实现；公开路演前至少确认 A03、A04、A06、A07、A08、A09。未确认时，报告写“按开发草案完成”，不能写“原始需求全部验收通过”。尤其 A06 不可能仅靠修改阈值解决器械真假识别问题。

---

## 3. 完整交互流程

### 3.1 主流程

```text
加载核心场景资源（不等待摄像头模型）
  → 首页：农场与训练计划弹层
  → 取消：关闭弹层，留在首页；可重新打开
  → 确认：选择输入模式/完成设备准备
  → 开始倒计时5秒
  → 砍树：15个完整循环，5次/棵，共3棵（A03）
  → 休息15秒：角色与NPC整理木材，推车靠近
  → 倒计时5秒
  → 装车：15个完整“蹲下→站起→过顶→复位”循环
  → 休息15秒：整理场地/固定货物（A05）
  → 倒计时5秒
  → 拉车：累计60秒有效持姿，放下/失去有效输入则停止
  → 到家与结算：真实游戏结果 + 明确区分的示例指标
  → 返回首页：重置本局，关闭摄像头，取消全部旧异步任务
```

没有第二个控制器再叠加一套休息倒计时。拉车后不再添加15秒休息。首次摄像头准备是本方案的设备步骤，不计入训练成果。[A]

### 3.2 屏幕内容

| 画面 | 主内容 | 必须可见的状态 |
|---|---|---|
| 首页 | 农场、人物、劳作计划、确认/取消 | 计划来源：预设概念演示 |
| 设备准备 | 摄像头预览、人体骨架、站位边界、标定、输入方式 | 权限/模型/识别状态，不用模糊的统一“加载中” |
| 砍树 | 人物与当前树、NPC、击中反馈、树倒下 | 当前挥砍次数、总次数、已倒树数 |
| 装车 | 木材堆、人物、推车、木材转移 | 已装/总数，当前动作提示 |
| 拉车 | 路径、农场终点、人物拉车 | 有效持姿秒数/60、移动/暂停、持姿代理说明 |
| 休息 | 角色过场与农场反馈 | 剩余休息时间、下一任务、随后5秒开始提示 |
| 结算 | 木材/金币/体力/T恤、完成反馈 | 真实计数、有效时长、输入来源、未知/示例指标 |

常驻右上角标识摄像头/键盘/自动模拟来源。当前摄像头训练必须在游戏内显示同一路视频与骨架PiP，并显示动作阶段、配置处方；键盘或合成模式不得伪装实时摄像头。

### 3.3 交互规则

- `Space`：键盘模式下完成当前一次动作演示；Carry阶段为按住有效、松开停止。忽略键盘自动重复；动作演示未结束时不启动第二个重叠循环。
- `P`或页面按钮：用户暂停/继续；`Esc`：打开退出确认，不直接丢失进度。
- 鼠标按钮提供与键盘等价的“做一次动作”与“按住拉车”，防止焦点问题。
- 输入焦点在表单控件时，不拦截其空格；离开窗口/按钮`pointercancel`时必须释放“按住”。
- 摄像头权限由用户点选真实模式触发，不在页面打开时自动索取。
- 正在运动时不自动切输入源。只允许在首页、准备页或用户主动暂停后确认切换；保留已提交进度，清空未完成动作。
- 页面隐藏时暂停；返回前台后要求主动继续，不能自动补上隐藏期间的时间。

---

## 4. 技术架构和依赖策略

### 4.1 技术选型

| 职责 | 选择 | 限制 |
|---|---|---|
| 游戏渲染 | Three.js0.186.1 | 用户批准真3D；旧Phaser源码保留；不增加第二套运行引擎 |
| 构建 | Vite + TypeScript | 使用安装时验证兼容的版本，锁定依赖，不使用浮动CDN |
| 人体关键点 | `@mediapipe/tasks-vision`的Pose Landmarker | 本地模型、本地WASM；VIDEO模式 [TECH02] |
| 动作规则 | 纯TS状态机 | 不训练新模型，不引入通用规则平台 |
| 页面UI | 原生HTML/CSS | 对本项目规模不新增React/Redux/XState；已有React仓库可复用 [A02] |
| 单元测试 | Vitest | 纯逻辑不用浏览器和摄像头即可测试 |
| 浏览器回归 | Playwright，首期Chromium | 模拟输入测试不代表真机视觉识别验证 [TECH06] |
| 数据保存 | 当前会话内存 | 无账号/后端；真实姿态轨迹默认不落盘 |
| 交付 | 静态`dist/` + 本地预览方式 | 公网摄像头使用HTTPS；本机使用localhost [TECH04] |

Phaser 3.90.0有独立API文档；选择这一版本是减少前面3.x方案与实现间的歧义，不是比较后宣称它优于所有新版本。[TECH01]

### 4.2 版本冻结步骤

T01执行时检查`node --version`和`npm --version`，按实际Vite版本的`engines`要求选择受维护的Node版本。当前核对的Vite指南要求Node 20.19+或22.12+；**这只是最低兼容要求，不是建议使用已停止维护的Node版本**。记录实际采用的Node/npm/Vite/TypeScript/测试工具精确版本。[TECH05]

新项目安装使用`--save-exact`，提交锁文件；MediaPipe选取一个当时可获取、通过初始化冒烟测试的非预发布版本并固定。这里未凭空给出未验证的MediaPipe版本。`docs/DEPENDENCIES.md`由T01/T02生成，记录版本、模型来源、文件SHA-256和许可信息。未能获取依赖时报告阻塞，不伪造成功安装。

`tasks-vision`的JS和WASM必须来自同一锁定包；不要把某个`@latest/wasm`目录和另一个版本的JS混用。最终运行不依赖第三方CDN。

### 4.3 数据流

```text
CameraService → PoseWorkerClient → PoseFrame
                                    ↓
                        特征提取/标定/动作识别
                                    ↓
                           CameraActionSource
                                    ↓
KeyboardActionSource ───────→ ExerciseSignal
                                    ↓
                         SessionController
                           ↙             ↘
                     SessionSnapshot   GameEffect
                          ↓                ↓
                      DOM面板        Three.js场景/角色/音效

ReplayPoseSource（仅测试）→同一特征与识别链路；禁止混入真人结果
```

**边界：** 领域层不import Three.js、Phaser、DOM、MediaPipe；识别器不直接操作树、推车或奖励；场景不直接改次数。

### 4.4 建议目录

```text
AGENTS.md
START_HERE.md
src/
  main.ts
  config/
    demoConfig.ts
    recognitionConfig.ts
  domain/
    types.ts
    sessionController.ts
    sessionReducer.ts
    sessionClock.ts
    inventory.ts
  input/
    types.ts
    sourceManager.ts
    keyboardActionSource.ts
    cameraActionSource.ts
  pose/
    types.ts
    cameraService.ts
    poseWorkerClient.ts
    pose.worker.ts
    calibration.ts
    features.ts
    smoothing.ts
    recognizers/
      chopRecognizer.ts
      loadRecognizer.ts
      carryRecognizer.ts
  game/
    createGame.ts
    BootScene.ts
    FarmScene.ts
    actors/
      Farmer.ts
      Tree.ts
      Cart.ts
      HelperNpc.ts
    ActionAnimator.ts
    assets.ts
  ui/
    appUi.ts
    planPanel.ts
    setupPanel.ts
    hud.ts
    resultsPanel.ts
    styles.css
  diagnostics/
    metrics.ts
    debugPanel.ts
public/
  assets/
  models/pose_landmarker_lite.task
  mediapipe/wasm/
scripts/
  sync-vision-assets.mjs
  verify-assets.mjs
tests/
  unit/
  fixtures/
  helpers/
    fakeClock.ts
    replayPoseSource.ts
  e2e/
docs/
  DEVELOPMENT_GUIDE.md
  ACCEPTANCE.md
  PROGRESS.md
  SOURCES.md
  DEPENDENCIES.md       # T01/T02创建，记录真实安装结果
  TEST_REPORT.md        # 开发中创建，不提前填“通过”
  DEMO_RUNBOOK.md       # T10/T11创建
```

按任务创建需要的文件，不先生成整棵空目录。已有项目可调整具体路径，但要先更新路径映射，不能让文档和代码各说一套。

---

## 5. 接口契约和状态归属

以下是接口草案，Codex应在T01将其落实为可编译类型；改变契约时同步修改调用方和测试。示例不包含业务实现。

### 5.1 输入与事件

```ts
type TaskKind = 'chop' | 'load' | 'carry';
type InputMode = 'camera' | 'keyboard';
type Unsubscribe = () => void;

type ChopPhase = 'ready' | 'chop-down' | 'chop-return';
type LoadPhase =
  | 'ready' | 'squat-down' | 'stand-up' | 'press-up' | 'load-return';
type ActionPhase = ChopPhase | LoadPhase;

interface InputContext {
  sessionId: string;
  taskRunId: string;
  sourceEpoch: number;
  task: TaskKind;
}

interface SignalMeta {
  sessionId: string;
  taskRunId: string;
  sourceEpoch: number;
  seq: number;
  capturedAtMs: number;
}

type ExerciseSignal = SignalMeta & (
  | { kind: 'phase'; task: 'chop'; repId: number;
      phase: ChopPhase; progress: number }
  | { kind: 'phase'; task: 'load'; repId: number;
      phase: LoadPhase; progress: number }
  | { kind: 'impact'; task: 'chop' | 'load'; repId: number }
  | { kind: 'rep-completed'; task: 'chop' | 'load'; repId: number }
  | { kind: 'hold-sample'; task: 'carry'; holding: boolean; valid: boolean }
  | { kind: 'tracking'; status: 'ready' | 'lost' | 'error'; message?: string }
);

interface ActionSource {
  readonly mode: InputMode;
  start(context: InputContext,
        emit: (event: ExerciseSignal) => void): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
}
```

设备准备阶段单独使用CameraService、Worker与标定提供就绪状态，不生成可计数的动作事件；为每个即将开始的任务分配`taskRunId`，活动开始时启动对应ActionSource并重置识别器。摄像头源每个有效姿态样本发出`tracking: ready`心跳，动作语义事件另外发出；键盘源在激活且未失焦时保持明确的模拟就绪状态，不受“尚未按下动作键”影响。切任务时更新上下文并丢弃旧事件。

`phase`、`impact`、`rep-completed`的语义不同：前两者控制过程表现，只有完整复位后的`rep-completed`才能提交重复动作计数。一次下挥可以立即播放碎屑和声音，但不能在下挥与复位各计一次。

### 5.2 控制器接口

```ts
type PauseReason = 'user' | 'tracking' | 'visibility' | 'source-error';
type SessionPhase = 'home' | 'setup' | 'countdown' | 'active' | 'rest' | 'results';

interface SessionSnapshot {
  sessionId: string;
  taskRunId: string | null;
  phase: SessionPhase;
  task: TaskKind | null;
  inputMode: InputMode;
  sourceEpoch: number;
  pauseReasons: readonly PauseReason[];
  remainingMs: number;
  chopReps: number;
  choppedTrees: number;
  loadReps: number;
  cartLogs: number;
  groundLogs: number;
  deliveredLogs: number;
  carryActiveMs: number;
  exerciseActiveMs: number;
  sessionElapsedMs: number;
  rewardsGranted: boolean;
}

type SessionCommand =
  | { kind: 'open-setup'; mode: InputMode }
  | { kind: 'setup-ready' }
  | { kind: 'pause'; reason: PauseReason }
  | { kind: 'resume'; reason: PauseReason }
  | { kind: 'switch-source'; mode: InputMode }
  | { kind: 'reset' };

interface SessionController {
  getSnapshot(): Readonly<SessionSnapshot>;
  subscribe(listener: (s: Readonly<SessionSnapshot>) => void): Unsubscribe;
  onEffect(listener: (e: GameEffect) => void): Unsubscribe;
  command(command: SessionCommand): void;
  accept(signal: ExerciseSignal): void;
  tick(nowMs: number): void;
  dispose(): void;
}
```

`GameEffect`在`domain/types.ts`实现为可判别联合：至少有`action-phase`、`action-impact`、`tree-felled`、`log-loaded`、`task-changed`、`rewards-granted`、`session-reset`。所有效果携带`sessionId`；动作效果携带`taskRunId`、`sourceEpoch`、`repId`。树/木头变更效果只能在规则提交成功后产生。

`createSessionController(config: DemoConfig, clock: Clock): SessionController`是装配入口；`Clock.nowMs(): number`可注入，以便不真实等待60秒就测试计时。`tick()`的调用由一个应用时钟驱动，不让各场景各自推进任务。

### 5.3 有效性与幂等规则

1. 会话、任务实例或输入代次不匹配的事件直接丢弃。
2. `seq`在同一输入代次内严格递增；非有限时间戳、未来异常时间戳、乱序/重复事件不处理。同一采集帧产生多个语义事件时可共享时间戳，但必须有不同且递增的`seq`。
3. `capturedAtMs`使用主线程的单调时间基准；Worker原样带回，不与另一个时钟原点的`performance.now()`混减。
4. 到达时距采集时间超过`trackingMaxAgeMs=300`的事件不计次、不计时。该阈值是调校起点。
5. 仅`phase='active'`且无暂停原因时接收动作进度；`tracking`状态事件仍可更新设备状态。
6. 同一`(taskRunId, sourceEpoch, repId)`最多提交一次；达到目标后立即关闭当前任务的动作入口。
7. `impact`只做一次临时表现；中途取消时清除临时木头/预览，不产生永久库存。
8. 场景可以平滑追随权威进度，但不能把补间完成回调当成“多做了一次动作”。
9. 切换输入源或重新进入任务时更新`sourceEpoch`，停止旧输入并清空识别器；每次完整重置生成新的`sessionId`。
10. 丢失跟踪后丢弃未完成循环；恢复需要重新稳定到起始姿态，不允许半个旧动作加半个新动作算一次。

### 5.4 暂停、时间与库存

- 暂停原因采用集合：解除`tracking`不能顺带解除`user`或`visibility`。
- `countdown/rest`由控制器累计未暂停时间；到边界只触发一次转换。跨任务不把过量`dt`直接补算为下一项运动成果。
- 摄像头暂时无效：立即停止接收新成果；连续数据间隔超限时清空候选周期。超过300ms仍无有效输入，显示识别丢失并添加`tracking`暂停。
- 休息期间没有人体也不应让正常休息永远卡住；下一项开始倒计时前必须重新得到准备就绪状态。页面隐藏或用户暂停仍冻结休息。
- 有效任务时长`exerciseActiveMs`：Chop/Load只累计处于活动任务、有效输入且未暂停的时间；Carry按相邻有效持姿样本累计。它是按程序规则计算的任务指标，不是生理运动量测量。`sessionElapsedMs`从首次开始倒计时到结算按单调墙钟计算，包含休息/暂停，不包含设备准备；二者分别显示。
- 本局库存守恒：`groundLogs + cartLogs + deliveredLogs = initialLogs + choppedTrees * logsPerTree`。
- NPC只搬运/整理已经存在的视觉对象；不能自行发出增加木材的领域事件。
- 奖励原子提交一次；盲盒开启动画可重复播放，但不会重复获得T恤。

---

## 6. 摄像头、姿态与动作识别

### 6.1 摄像头最小链路

用户授权 → `getUserMedia({ video: ..., audio: false })` → 预览视频就绪 → 加载本地模型和WASM → Pose Landmarker VIDEO推理 → 骨架预览与指标 → 标定 → 接入任务。[TECH02][TECH04]

建议初始请求640×480、30fps视频；实际推理15Hz，渲染目标60fps。它们是三个不同频率，不应把每次渲染都变成一次模型推理。[A]

MediaPipe官方说明Web版推理调用同步执行，可能阻塞主线程，因此优先用Worker隔离。[TECH02] 实现约束：

- `poseWorkerClient.ts`每次最多一个在途推理；忙时丢弃新候选帧，不排长队。
- Worker能力、可传输图像类型、GPU/CPU路径须在实际锁定版本上验证，不假定所有浏览器行为一致。
- 优先验证Worker可用路径；GPU失败可以显式重试CPU；仍失败则给出错误。主线程降频仅作记录过的兼容降级，必须重新测性能。
- 帧消息至少包括`requestId`、`sourceEpoch`、`capturedAtMs`和尺寸；响应必须匹配请求。
- 不同时对同一个Landmarker实例并发推理。
- 转移/处理完的`ImageBitmap`等图像资源及时关闭；停止后释放摄像头track、推理实例和Worker。
- 初始化超过10秒展示“模型加载较慢”，提供取消/重试；到30秒仍未准备好视为本次初始化失败。这是本Demo的超时策略，不是浏览器保证。[A]
- 模型文件缺失不能只打印控制台错误，要在准备页说明缺少文件、允许返回选择键盘模式。

### 6.2 PoseFrame与特征

```ts
interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
}
interface PoseFrame {
  frameId: number;
  capturedAtMs: number;
  width: number;
  height: number;
  landmarks: readonly Landmark[];
  valid: boolean;
}
```

MediaPipe输出33个关键点；本Demo关注肩11/12、肘13/14、腕15/16、髋23/24、膝25/26、踝27/28。它提供图像关键点和估计世界坐标，但不提供器械重量或可靠的真实负载证明。[TECH03]

特征实现要求：

- 先用`x * width`、`y * height`恢复同单位图像坐标，再计算2D角度和距离，避免宽高归一化不一致造成几何失真。
- 用肩中心到髋中心距离作为躯干尺度，以相对位置和无量纲距离做判定，避免固定像素阈值。
- 视频预览可以镜像；算法坐标与左右关节语义必须保持一致，只在显示变换层镜像。
- 2D关节角只是固定视角下的识别特征，不是医学量角器。遮挡/透视导致不可用时应失效，而不是伪造角度。
- 关节向量接近零、NaN、关键点不足、需要的关节低置信度：返回无效，不能默认成0度或180度。
- 用时间相关的一阶低通平滑，如`alpha = 1 - exp(-dt/tau)`；`tau`初始60ms可配置。丢帧、人物重选、重置后重新初始化，不能用历史点填补完整动作。
- 初始关节置信度门限0.6；阶段确认120ms；均是待调校参数，不是实测保证。
- 单人演示是使用前提。`numPoses=1`不等于系统能够发现并拒绝镜头中的所有其他人；出现换人/明显位置跳变应重新准备，不能承诺通用多人隔离。

### 6.3 标定

准备页指导用户全身在画面中，头顶、手举起范围、脚部不被裁切。固定相机和站位；以能看清完整动作为准，不写死适用于所有家庭的距离。

1. 稳定站立2秒：记录躯干尺度、可用侧、自然站立膝角。
2. 选择挥砍主手；做一次缓慢空载/安全演示，观察上肩与下挥特征差异。
3. 记录一次用户可完成的蹲下、站起、举手、复位示例；不以程序默认角度要求用户强行加深动作。
4. Carry分别记录2秒“持姿”和2秒“放下后姿态”；计算两种特征的可分性。
5. 特征缺失或两种Carry姿态无法区分：不通过对应标定，明确说明限制。

标定只存在本次会话内存。程序不能通过让用户填写体重、病史等无关个人数据来扩大本期范围。

### 6.4 砍树：必须完成整个循环

状态：`READY → DOWN → RETURN → READY`。

- 起点：选定手腕接近肩部区域，稳定达到确认时间。
- 下挥：相对肩部的腕高有足够变化，进入下方区域。
- 到下方时发一次`impact`，角色斧头击中、树木摆动、碎屑/声音反馈。
- 返回上肩并稳定后发一次`rep-completed`。
- 手一直在下方、只上举不下挥、动作做一半、抖动穿越阈值：不多计。
- 任意完整周期超时或中途输入失效：清空候选周期，不累计半次动作。

**初始阈值示例，不是合格动作标准：** 以躯干长度L归一化，`(wristY - shoulderY)/L ≤ 0.2`作为上肩候选，`≥ 0.8`作为下方候选；往返至少覆盖0.6L；周期允许0.4–6秒。实际以现场标定记录修改`recognitionConfig.ts`。如动作录像显示本阈值不适合原定动作，不得修改演示者动作却不说明。

### 6.5 装车：复合动作而非单独深蹲

状态：`READY → SQUAT → STAND → OVERHEAD → RETURN → READY`。

- 起点为站立、手在胸前或标定的复位区域。
- 先观察膝髋相关变化和髋部下移，再确认站起。
- 站起后手腕到头顶方向区域，触发木头扔入推车的临时表现。
- 重新回到站立、手回起始区域后提交一次完整装车动作。
- 仅深蹲、仅举手、没有蹲下就举过头、在底部反复抖动：不算完整动作。
- 允许站起和上举自然连续发生，不要求两段之间人为停顿；同帧满足连续阶段条件时，按合法顺序推进，但不能跳过此前未观察到的蹲下证据。

**初始实验参数：** 站立膝角约155度以上、下蹲候选约125度以下，并有髋部相对下移；上举候选为双腕明显高于肩，阈值相对L配置；整个周期0.8–10秒。优先用标定差值和可见侧信息，不把这些角度显示为用户必须达到的运动标准。

计数在复位时提交；扔木头可以先做临时动画，失败/重置时移除临时物体。`log-loaded`只在提交成功后更新权威库存。

### 6.6 拉车：持姿代理与有效时间

**不可掩盖的限制：** 人手空着与握壶铃时，人体关键点可能几乎一样；Pose模型无法因此证明实际持握。尤其双臂自然垂在身体两侧的“拿着”和“没拿着”可能不可区分。本期只能验证可区分的姿态持续性；不能承诺负载识别。[A06]

方案：对标定得到的`hold`和`released`特征中心分类。建议特征为双腕相对肩的2D位置、双肘角/180、双膝角/180；所有位置除以躯干长度。距离使用RMS，配置初始`minPoseSeparation=0.15`。这只是工程起点。

- 两中心距离D小于分离门限：标定失败，Carry摄像头计时不可用。
- 候选持姿：与持姿中心距离≤0.35D且小于与放下中心距离，持续500ms后进入有效持姿。
- 退出持姿：接近放下中心，或偏离持姿中心超过0.55D，或所需关节无效。退出时不继续累计。
- 进入门限与退出门限分离，防止边界抖动。
- 只发`hold-sample`，不由识别器直接加推车距离。

**计时算法必须可独立测试：**

对相邻两个样本`t0`、`t1`，只有两者均有效且为持姿、任务活动且未暂停、代次相同、`0 < t1-t0 ≤ maxPoseGapMs`时，才累计`t1-t0`。否则累计0并重置相邻样本基线。超过最大间隔时不能简单`min(dt,200)`补算一小段；恢复时也不补算未观察到的时间。超过`carryTargetMs`后钳位到目标值。

刚确认进入持姿之前的500ms不追溯计入；界面提示“准备就绪，开始计时”。松开后推车只停留在已经确认的进度，不外推未来路程。进度为`carryActiveMs / carryTargetMs`，不是帧数。

测试中用无歧义的合成样本验证“10秒有效+5秒放下+50秒有效”等于60秒有效；真实相机存在采样量化和标定延迟，应单独测量，不宣称数学上的零误差。

### 6.7 识别器统一接口

```ts
interface Recognizer {
  update(frame: PoseFrame): readonly RecognitionEvent[];
  reset(): void;
}
```

`RecognitionEvent`是不含会话元数据的动作语义事件；`cameraActionSource.ts`负责补充`SignalMeta`、生命周期和输入代次。不要在三个识别器里重复实现任务/奖励逻辑。

初期测试夹具包括合成关键点序列；人工同意后可增加本地真实关键点序列。合成样本只能证明状态机逻辑，不能证明MediaPipe实拍识别准确率。

---

## 7. 游戏表现与素材约束

### 7.1 动作同步定义

本期阶段同步至少满足：

- 真人处于上肩准备时，角色斧头也处于准备区；真人下挥时角色开始下挥；真人复位时角色复位。
- 用户在允许的动作阶段停顿，角色停留/缓慢保持当前阶段，不继续自动完成整个循环。
- 角色在阶段之间可做短补间，优先避免明显穿帮；补间不能改变真实次数。
- 砍击/装车的即时冲击反馈与动作阶段关联；最终资源在完整动作提交后变更。
- Carry按已验证有效时间平滑显示，失效时停止，不能播放永不停歇的移动背景。

这不等于全身骨骼逐关节同步。A04仍需产品确认。

### 7.2 场景与角色

本节后续2D建议为历史T05方案。当前以`src/game/world`的原创真实网格/关节人物/阴影与Orbit相机实现；编排只读领域快照、从实际手部世界锚点发射木材，切源/拒绝半次复位/重置清理未提交飞木。训练中的同一摄像头video和骨架移到PiP，不重复申请设备或创建Worker。当前验收以`3D_FARM_DESIGN.md`及更新后的`ACCEPTANCE.md`为准。

采用一个`FarmScene`内的几个区域：农场首页、砍伐空地、装车点、回家道路。通过场景布局/镜头切换和脚本表现完成过渡，无需地图编辑器、寻路网格或开放世界。

建议采用一套简单2D分层人物或现成授权精灵素材；默认以少量部件/关键姿势完成动作，不自研通用骨骼系统。角色只需一个主要展示朝向。

P0可辨识资源：玩家、合作NPC、杉树/树桩、木材、手推车、农场房屋、道路、斧头、T恤奖励图标。**参考图里的蓝色卡车不应自动替代原文明确要求的手推车。**

动画/表现最低清单：待机、上肩、下挥、复位、下蹲、站起、上举/扔木头、拉车移动/停止、树木受击/倒下、木材入车、NPC整理、结算奖励。

### 7.3 分层完成标准

- T01–T04：允许几何占位，但人、树、车、路径必须能区分，核心闭环完整。
- T05：形成统一2D视觉，动作阶段可辨；不能只交一个控制台和几个进度条。
- T10/T11：人工评审画面、动作、音效和节奏。没有成套素材时明确“占位美术尚未替换”，不能把功能验收说成美术验收。

美术参考只能用作设计依据；不从参考图截取知名游戏人物当最终资产。第三方素材须记录来源、许可及是否允许公开演示。需要付费素材时先征得用户同意。

### 7.4 声音、可读性和操作

声音在用户交互后初始化；有静音按钮。砍击、装车、任务完成分别用少量反馈音。缺少音频资源可先用明确标注的占位效果，不阻断逻辑。

原生DOM承载计划、HUD和按钮；进度数字/提示不完全绘制在不可访问的Canvas内部，方便浏览器测试与可读性检查。布局在1280×720、1366×768、1920×1080检查无遮挡。不要用多页路由引入不必要的状态恢复问题。

2026-10-26用户追加动作教学：训练计划、准备页、常驻顶栏及结算页均可打开同一个分步教学对话框，覆盖挥砍/装车/拉车持姿、人体图关节提示、要点与慢放。教学是独立SVG表现，始终不计成果，不替代九步个人标定；不产生ExerciseSignal或另建摄像头/3D渲染器。运行中打开用现有user暂停，关闭仍由用户继续，不能解除跟踪/后台等其他暂停原因。教学占用焦点并拦截训练快捷键，关闭恢复当前页面；初次资源就绪前已主动查看教学时，不在背后自动开局，也不更改保存的模拟偏好。

同日用户指定在右下输入骨架左侧增加常驻标准示范，只采用绿线/金节点骨架样式。独立示范复用教学坐标并按当前任务循环，休息提前示范下一项，持姿稳定保持；与右侧输入反馈分开标识。暂停/后台冻结，任务或输入上下文变化复位，不产生训练成果；减少动态效果时切到关键姿态。桌面、断点附近及窄屏须同时保持输入预览、训练按钮与百分比可见。

---

## 8. 结算、来源标识与隐私

### 8.1 两类数据分开

**真实运行结果：** 本局次数、有效持姿时长、训练有效时间、到家木材、游戏奖励、所用输入来源。

**原文示例展示：** 连续66天、500卡、平均心率130、20min、表现+5。保留在开发配置和可选“结果页样式示例”区域；默认真实结果区不展示为实测。心率/卡路里未接入时显示`—（未接入测量）`；不能用当前日期或浏览器随机数制造健康指标。

游戏“表现+5”可以作为明确的示例游戏评价值，而非医学评价。若实际时长与示例20min不一致，真实时长优先，示例区仍必须有清晰边界。

### 8.2 模式来源

一局可以在确认暂停后切换输入方式，但结算需标记`含键盘演示输入`。切过模式后不能只根据结束时的模式将整局标成真实摄像头训练。维护本局使用过的输入源集合；这是显示元数据，不扩展为账号系统。

真实姿态数据不能因测试需要被默认上传。性能指标仅记录帧耗时、阶段、错误码、计数；导出关键点样本需要用户主动同意，且说明保存位置，不附原始视频。

### 8.3 安全边界

本Demo不提供医疗、动作安全或负重训练建议。开发调试采用空载动作/安全道具，不以追求识别阈值为由要求用户加深下蹲、加快挥动或举起更重器械。运动区与电脑、显示器、旁观者保持安全间隔；“未识别”提示不能自动等同于“动作错误/不健康”。

---

## 9. 测试、观测与发布策略

### 9.1 必须存在的脚本

T01建立以下npm脚本；后续任务逐步赋予真实测试内容。脚本未建立前不能在报告里写已通过。

```text
npm run dev           # Vite开发服务器
npm run typecheck     # TypeScript静态检查
npm run lint          # 静态规范检查
npm run test:unit     # Vitest run，一次性执行
npm run test:e2e      # Playwright test
npm run build         # 类型检查后构建dist
npm run preview       # 本地预览构建产物，不是公网生产服务器
npm run assets:sync   # 同步锁定版本的WASM/许可信息
npm run assets:verify # 校验模型、WASM与必要美术文件
```

最终验证顺序：`npm ci` → `assets:sync` → `assets:verify` → `typecheck` → `lint` → `test:unit` → `test:e2e` → `build` → 实际打开构建产物。

Playwright首次运行可能需要下载浏览器；缺网络/系统依赖时记录阻塞，不能用“没有测试用例”作为测试通过。摄像头自动化测试可用stub，但仍须单列真机测试。[TECH06]

### 9.2 观测面板

开发模式显示：视频尺寸、模型/推理路径、姿态帧率、推理耗时p50/p95、输入样本年龄、游戏帧间隔、识别器阶段、关节置信度、最近一次拒绝原因、任务实例和输入代次。

不能仅显示“模型每帧耗时”就声称测出了端到端动作延迟。端到端视觉延迟需用实际画面记录/逐帧核对或明确的采集—显示测量方法。

### 9.3 性能目标：须在指定电脑上实测

[A] 稳态目标：游戏约60fps、姿态推理约15Hz；最低可接受候选：游戏至少30fps、姿态至少10Hz，动作阶段可见反馈延迟p95不高于250ms。后者是项目目标，尚未证实；未达到时调整分辨率/模型/线程路径，或与产品确认降级。

记录预热后的样本窗口、机器/浏览器/摄像头、分辨率、模型版本和推理路径。合成输入测试不纳入真实姿态准确率与延迟统计。

### 9.4 资源与离线

模型、WASM、图片、声音均本地化并使用统一base路径。部署子目录时也要能加载；不得把所有资源路径硬写为站点根目录。

“一次下载后可在本机断开外网演示”定义为：依赖已安装、本地HTTP服务仍运行、浏览器访问localhost；不是直接双击`index.html`，也不是没有Service Worker却宣称公网URL能离线首次打开。

公网部署必须HTTPS；局域网HTTP IP地址不能当作localhost摄像头能力的等价替代。[TECH04] 用户没有授权之前，不自动部署到第三方服务。

### 9.5 错误与恢复

明确区分权限拒绝、没有摄像头、设备占用/读取失败、模型资源缺失、推理失败、跟踪丢失、浏览器不支持。每类至少有一个可操作按钮：重试、重新选择模式、返回首页。

用户点击取消初始化后，迟到的摄像头Promise或模型Promise不得重新打开已经关闭的页面/会话；用生命周期token或Abort信号校验，实际不支持中止的底层调用也要在返回时释放资源。

---

## 10. 分任务实施计划

> 有superpowers执行技能的环境可使用`executing-plans`或`subagent-driven-development`逐任务执行；没有该技能也按下述测试—实现—验证流程执行，不把插件当成项目运行依赖。
>
> 每个任务的固定收尾：检查变更diff → 更新`PROGRESS.md`和测试记录 → 若当前工作区是Git仓库且符合已有规则，提交仅与本任务相关的变更；不自动push。不得把用户原有未提交修改一起提交。

### T01｜可运行项目、类型契约与首页灰盒

**依赖：** 无。**产出：** 能打开的Phaser页面、基础DOM计划面板、明确的类型与配置。

**Files：** 创建/调整`package.json`、锁文件、Vite/TS/测试配置、`src/main.ts`、`src/config/demoConfig.ts`、`src/domain/types.ts`、`src/input/types.ts`、`src/pose/types.ts`、`src/game/createGame.ts`、`src/game/BootScene.ts`、`src/game/FarmScene.ts`、`src/ui/planPanel.ts`、`tests/unit/config.test.ts`、`tests/e2e/boot.spec.ts`、`docs/DEPENDENCIES.md`。

**Interfaces：** 定义第5节契约；配置入口`createDemoConfig(overrides?: Partial<DemoConfig>): DemoConfig`；引擎入口`createGame(parent: HTMLElement): Phaser.Game`。

- [ ] 检查仓库、Node/npm、原有指令、未提交修改；没有仓库就按新项目初始化，不覆盖已有文件。
- [ ] 建立最小工具链和依赖锁定；不先装模型/素材大礼包。
- [ ] 写配置测试：默认`chopRepTarget===15`、`loadRepTarget===15`；修改`treeCount`后派生文案和目标同步；负数/非整数计数配置拒绝。
- [ ] 运行`npm run test:unit -- tests/unit/config.test.ts`，确认针对未实现配置的断言失败，而不是语法/安装失败。
- [ ] 实现配置、契约和能看见农场占位的首页；计划确认/取消按钮都有行为。
- [ ] 运行`npm run typecheck`、上述单测、`npm run test:e2e -- tests/e2e/boot.spec.ts`、`npm run build`。首页测试检查计划文字、取消/重开行为、无未捕获异常。
- [ ] 按固定收尾保存证据，报告真实依赖版本。

**停止条件：** 依赖无法安装或构建环境不满足要求时报告，不把空页面称为可运行游戏。

### T02｜尽早验证真实摄像头与MediaPipe链路

**依赖：** T01。**产出：** 准备/诊断页面可展示真实摄像头骨架；不要求此时已驱动游戏。

**Files：** `src/pose/cameraService.ts`、`poseWorkerClient.ts`、`pose.worker.ts`、`src/ui/setupPanel.ts`、`src/diagnostics/metrics.ts`、`scripts/sync-vision-assets.mjs`、`scripts/verify-assets.mjs`、`public/models/`、`public/mediapipe/wasm/`、`tests/unit/poseWorkerClient.test.ts`、`tests/e2e/camera-errors.spec.ts`。

**Interfaces：** `CameraService.start(): Promise<HTMLVideoElement>`、`stop(): void`；`PoseWorkerClient.start(onFrame: (f: PoseFrame) => void): Promise<void>`、`submit(video: HTMLVideoElement, capturedAtMs: number): void`、`stop(): Promise<void>`。具体帧转移封装在Client内部。

- [ ] 固定一个可下载的MediaPipe版本和官方模型，记录来源/校验值；复制对应WASM到本地。
- [ ] 写Worker Client测试：忙时不堆积、乱序响应丢弃、stop后响应不回调、资源清理一次；写权限拒绝/模型404的页面测试。
- [ ] 运行相关测试，确认目标行为尚未实现而失败。
- [ ] 实现真实视频、Worker推理、骨架显示和错误状态。目标参数15Hz/640×480是初始值，不伪造帧率读数。
- [ ] 运行`npm run test:unit -- tests/unit/poseWorkerClient.test.ts`、`npm run test:e2e -- tests/e2e/camera-errors.spec.ts`、`npm run assets:verify`、`npm run build`。
- [ ] 在实际电脑打开并记录摄像头/模型/渲染情况；无摄像头访问时写`manual_pending`，给出本地验证步骤，不写已真机通过。
- [ ] 固定收尾。若存在真实识别风险立即记录，不能等美术全完成再暴露。

**并行边界：** T02的硬件人工确认可以等待期间继续T03/T04；摄像头未确认不能阻断键盘闭环，也不能据此宣布摄像头已实现并验收。

### T03｜纯领域状态机、时间和库存守恒

**依赖：** T01。**产出：** 无浏览器、无Phaser也可测试的全流程规则。

**Files：** `src/domain/sessionController.ts`、`sessionReducer.ts`、`sessionClock.ts`、`inventory.ts`、`tests/helpers/fakeClock.ts`、`tests/unit/session.test.ts`、`inventory.test.ts`、`timing.test.ts`。

**Interfaces：** `createSessionController(config, clock)`；实现第5节`SessionController`；`Clock.nowMs()`由fakeClock替换。

- [ ] 写单测：4999ms仍倒计时，5000ms进入Chop；Chop第5次倒第一棵，第15次进入休息；未完成循环不加次；重复`repId`不加次。
- [ ] 写库存/时间测试：15次装车、60秒有效Carry、两段15秒休息和后续5秒倒计时；最后任务直接结算；守恒式全程成立。
- [ ] 写错误测试：旧会话/旧任务/旧epoch/乱序事件不改变状态；暂停不计时；两个暂停原因只移除一个后仍暂停；奖励重复请求不重复发。
- [ ] 运行`npm run test:unit -- tests/unit/session.test.ts tests/unit/inventory.test.ts tests/unit/timing.test.ts`确认业务测试失败。
- [ ] 以最小纯TS状态机实现，不引入Phaser计时器或状态管理框架。
- [ ] 再运行上述测试和`npm run typecheck`；记录状态边界、默认值和库存测试证据。
- [ ] 固定收尾。

### T04｜键盘输入贯通整局，第一个可演示检查点

**依赖：** T03；T02至少完成接口和错误页，硬件验证可另记。

**Files：** `src/input/keyboardActionSource.ts`、`sourceManager.ts`、`src/ui/appUi.ts`、`hud.ts`、`resultsPanel.ts`、`src/game/FarmScene.ts`、`tests/e2e/keyboard-flow.spec.ts`、`reset.spec.ts`。

**Interfaces：** `KeyboardActionSource implements ActionSource`；SourceManager负责`switchTo(mode, context)`和`stop()`；UI只发`SessionCommand`。

- [ ] 写完整E2E：从首页确认，按演示输入完成15次挥砍、15次装车、60秒有效拉车，到结果页并重置。
- [ ] 写焦点/长按/重置测试：键盘repeat不多计，pointercancel停止Carry，返回首页后旧动作定时器不继续跑。
- [ ] 使用可控时钟或测试配置加速测试，不把正式默认值改为1次/1秒；测试配置只能在测试构建中启用。
- [ ] 运行相关E2E确认失败，再实现输入源。一次按键模拟一个有阶段/impact/复位的完整循环，不直接调用“加奖励”。
- [ ] 添加全局模式标识、错误提示、结算真实/示例分栏、关闭摄像头与重置逻辑。
- [ ] 运行`npm run test:e2e -- tests/e2e/keyboard-flow.spec.ts tests/e2e/reset.spec.ts`及`typecheck`、`test:unit`、`build`。
- [ ] 固定收尾，并停止在检查点：给出启动方式和可完整操作的灰盒版本。此时不能宣称最终美术或真实动作识别通过。

### T05｜统一农场视觉、动作表现与合作NPC

**依赖：** T04。**产出：** 游戏可辨识且能呈现原文动作映射，不只是一组UI计数器。

**Files：** `src/game/actors/*`、`src/game/ActionAnimator.ts`、`assets.ts`、`FarmScene.ts`、`public/assets/`、`tests/unit/actionAnimator.test.ts`、`tests/e2e/visual-states.spec.ts`。

**Interfaces：** `ActionAnimator.apply(effect: GameEffect): void`、`sync(snapshot: SessionSnapshot): void`、`dispose(): void`；所有actor由Scene拥有生命周期。

- [ ] 列出现有/缺失素材、来源与许可；对照`SOURCES.md`的参考图但不拿参考图当可直接运行的精灵表。
- [ ] 写表现状态测试：READY/下挥/复位可以独立进入并保持；重复impact只触发一次；reset清除临时木头和动作队列。
- [ ] 测试先失败后实现统一风格的角色、杉树、树桩、木材、手推车、农场、道路。
- [ ] 实现5次倒树、木材装车、Carry进度、休息过场；NPC做预设协作，不改变库存权威状态。
- [ ] 用相同输入重放截图覆盖各阶段；运行`npm run test:unit -- tests/unit/actionAnimator.test.ts`和`npm run test:e2e -- tests/e2e/visual-states.spec.ts`。
- [ ] 人工看动作和截图；只跑截图生成命令不等于视觉验收。资源仍占位时报告具体缺项。
- [ ] 固定收尾。

### T06｜标定、关键点特征和可回放测试输入

**依赖：** T02、T03。**产出：** 与摄像头硬件解耦、可测的特征流水线。

**Files：** `src/pose/features.ts`、`smoothing.ts`、`calibration.ts`、`src/config/recognitionConfig.ts`、`tests/helpers/replayPoseSource.ts`、`tests/fixtures/`、`tests/unit/features.test.ts`、`calibration.test.ts`。

**Interfaces：** `extractFeatures(frame: PoseFrame, calibration: Calibration): PoseFeatures | null`；`calibrate(samples: readonly PoseFrame[]): CalibrationResult`；`ReplayPoseSource`按时间戳输出夹具但不接入正式摄像头模式。

- [ ] 写几何测试：改变图像长宽比仍正确还原角度；人体平移/等比缩放后归一化特征一致；镜像显示不改变解剖左右语义。
- [ ] 写失效测试：零向量、NaN、关节缺失、低置信度、躯干尺度过小、时间乱序、标定样本不足。
- [ ] 运行`npm run test:unit -- tests/unit/features.test.ts tests/unit/calibration.test.ts`确认目标测试失败。
- [ ] 实现特征、时间相关平滑和准备页标定；记录默认值为实验参数。
- [ ] 添加少量明确标为synthetic的关键点夹具；如人工授权真实样本，单独记录采集条件与来源。
- [ ] 运行上述测试、`typecheck`，检查离开准备页会取消标定和停止旧采样。
- [ ] 固定收尾。

### T07｜砍树与装车识别器

**依赖：** T06。**产出：** 完整时序动作生成阶段、impact和rep-completed事件。

**Files：** `src/pose/recognizers/chopRecognizer.ts`、`loadRecognizer.ts`、`tests/unit/chopRecognizer.test.ts`、`loadRecognizer.test.ts`、相关夹具。

**Interfaces：** 两个识别器实现第6.7节`Recognizer`，通过配置接收阈值和标定，不接触SessionController。

- [ ] Chop正例：3个完整往返恰好3次；负例：停在下方、只上举、重复相同帧、未复位、阈值抖动、丢帧跨越关键阶段。
- [ ] Load正例：完整蹲起/上举/复位一次计一次；负例：只深蹲、只举手、缺蹲下、底部抖动、超时、无效关键点；连续站起上举不能因缺人为停顿而误拒绝。
- [ ] 对impact先发生、rep完成后发生、每个周期只发生一次写事件顺序断言。
- [ ] 运行`npm run test:unit -- tests/unit/chopRecognizer.test.ts tests/unit/loadRecognizer.test.ts`确认失败，再实现状态机。
- [ ] 用debug面板查看实际示例动作，必要时调整配置并新增对应夹具，禁止为单个正例删除负例检查。
- [ ] 再运行测试与typecheck；报告合成样本通过情况和真实样本验证情况，分开表述。
- [ ] 固定收尾。

### T08｜持姿代理、放下检测与有效计时

**依赖：** T06、T03。**产出：** 能识别可区分持姿、不可区分时拒绝启用的Carry输入。

**Files：** `src/pose/recognizers/carryRecognizer.ts`、`src/pose/calibration.ts`、`tests/unit/carryRecognizer.test.ts`、`carryTiming.test.ts`。

**Interfaces：** `CarryRecognizer.update()`产生`hold-sample`语义；权威累积仍在领域层。

- [ ] 写标定测试：两种姿态中心分离不足时返回失败，不设置`holding=true`来绕过。
- [ ] 写持姿/释放/门限抖动/关节缺失测试；500ms进入确认期间不追溯累计。
- [ ] 写时间测试：10秒有效+5秒释放+50秒有效完成；5/10/15/30Hz合成采样在有效间隔规则内不因帧数改变时长；超过200ms的空档不计入。
- [ ] 写暂停/恢复/后台/旧epoch/重复样本测试；60秒时钳位且完成一次。
- [ ] 运行`npm run test:unit -- tests/unit/carryRecognizer.test.ts tests/unit/carryTiming.test.ts`确认失败后实现。
- [ ] 真机比较持姿/放下动作；不能区分时报告A06限制，不偷偷改成“人在镜头里就拉车”。
- [ ] 运行上述测试和typecheck，固定收尾。

### T09｜摄像头与游戏联调、输入切换和生命周期

**依赖：** T05、T07、T08。**产出：** 真实输入通过同一协议驱动完整游戏。

**Files：** `src/input/cameraActionSource.ts`、`sourceManager.ts`、`src/ui/setupPanel.ts`、`src/main.ts`、`tests/unit/sourceManager.test.ts`、`tests/e2e/source-lifecycle.spec.ts`。

**Interfaces：** `CameraActionSource implements ActionSource`；装配摄像头→特征→当前任务识别器；任务切换重置识别器和输入上下文。

- [ ] 写协议集成测试：同一语义事件序列经键盘/摄像头适配后得到相同权威游戏结果。
- [ ] 写生命周期测试：切换源前停旧源；旧Worker/超时Promise回调不能污染新局；页面隐藏后停止成果累积；多个暂停原因独立解除。
- [ ] 写模式来源测试：混合输入的一局结果必须显示含模拟输入，不能伪标全程真实。
- [ ] 运行相关测试确认失败后接线；保留键盘模式，但不保留隐藏的真人模式自动完成按钮。
- [ ] 真机从头跑一局；刻意停顿、放下、离开镜头、遮挡、返回首页、切换源，记录错误与恢复行为。
- [ ] 运行`npm run test:unit -- tests/unit/sourceManager.test.ts`、`npm run test:e2e -- tests/e2e/source-lifecycle.spec.ts`、完整unit与build。
- [ ] 固定收尾；到第二检查点，报告真机证据/尚缺硬件步骤。

### T10｜打磨、静态交付、断外网演示与回归

**依赖：** T09。**产出：** 可打包路演版本和操作手册。

**Files：** `src/ui/styles.css`、表现资源、资源校验脚本、`tests/e2e/deployment.spec.ts`、`docs/DEMO_RUNBOOK.md`、`docs/TEST_REPORT.md`。

**Interfaces：** 不随意变更领域契约；只修复已定位问题，契约变更需同步回归。

- [ ] 补部署测试：子路径资源正确、模型/WASM缺失错误可读、没有不必要的外网资源请求。
- [ ] 实施许可记录、模式标识、声音解锁/静音、各分辨率布局；移除未使用的依赖和调试入口。
- [ ] 检查10次连续开始/完成或退出/重置后，没有摄像头track、Worker、定时器、事件监听持续叠加；内存观测报告趋势，不使用未经验证的精确内存承诺。
- [ ] 依第9.1节运行完整验证；打开`dist/`的本地HTTP预览，而不只看开发服务器。
- [ ] 切断外网但保留localhost服务，刷新并完整演示；检查所有必要资源本地可用。
- [ ] 写路演手册：启动、模式选择、标定、正常流程、退出重置、摄像头故障处理和明确切换到备用模式的说法。
- [ ] 固定收尾，保留未通过事项，不自动对外部署。

### T11｜真机验收与交付签字

**依赖：** T10。**产出：** 按证据填写的验收表，而不是另一轮无边界功能开发。

**Files：** `docs/TEST_REPORT.md`、`docs/PROGRESS.md`、`docs/DEMO_RUNBOOK.md`；必要的bug修复及回归测试。

- [ ] 按`ACCEPTANCE.md`逐项执行并填入机器、浏览器、版本、输入、预期、实际、证据路径。
- [ ] 在指定演示者/机位上做完整动作与负例验证；同时明确A04/A06的产品接受情况。
- [ ] 比较原文示例指标与实际数据来源，确认无混淆；检查任务计划没有伪装成已接入AI。
- [ ] 人工批准美术/动作节奏；自动化测试通过不能代替这一项。
- [ ] 未通过项按范围内bug修复并加测试；不能修复的硬件/产品承诺问题写入已知限制。
- [ ] 输出交付摘要：启动/构建命令、已通过项目、未验证/受限项目、依赖与资源来源、路演操作方式。
- [ ] 固定收尾。仅当证据满足相应级别时标记该级别通过，不能统一写“全部完成”。

---

## 11. 一周建议排期与降级顺序

这是在范围冻结、有人提供/批准素材、能接触演示电脑的前提下的目标安排，不是工期保证。Codex生成代码不等于省去了素材制作和硬件验证。

| 天数 | 目标任务 | 当天可检查成果 |
|---|---|---|
| 第1天 | T01、T02 | 可运行首页；真实摄像头链路的可行性与风险 |
| 第2天 | T03、T04 | 可从头到尾操作的键盘灰盒Demo |
| 第3天 | T05、T06 | 统一场景/动作方向；特征/标定/回放测试 |
| 第4天 | T07 | 砍树与复合装车识别的正反例 |
| 第5天 | T08、T09 | 持姿代理与真实游戏联调 |
| 第6天 | T10 | 视觉打磨、部署、异常与重置回归 |
| 第7天 | T11 | 真机路演彩排与证据化验收 |

进度不足时，先减少装饰背景、粒子数量、可选音效、NPC表演复杂度，再考虑减少素材精细度；**不能通过取消动作识别、删掉负例检查、隐藏示例标签、放下仍计时来假装满足工期**。

摄像头未通过时，可以交付明确标识的交互概念版，但必须与“摄像头可用版”分开命名并说明差距。是否接受该降级由用户决定。

---

## 12. Codex执行与汇报规则

每次任务结束只报告四类信息：

1. 本次完成的任务ID与关键文件。
2. 实际运行的命令和结果；没运行的明确写原因。
3. 证据位置：日志、截图、夹具、真机记录。
4. 剩余风险/阻塞与下一个任务。

不要凭“代码看起来正确”“编译通过”“用模拟输入跑通”就写“摄像头识别准确”“1周已交付完整健身产品”。不要反复询问已经写入默认值的普通工程细节；只有新增实质性产品决策、破坏性操作、付费/外发数据或无法绕开的阻塞才中断。

详细启动与续接提示词见`../START_HERE.md`。根目录`AGENTS.md`保留短约束，长规范放本文，避免每个上下文都注入整份实现说明。[TECH07]
