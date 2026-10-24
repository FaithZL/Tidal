# Tidal · 映动农场

**2026-10-24：当前NPR局部与第7版人物成果已合入并推送`main`。** 新电脑直接按下方默认克隆步骤接手，开发时打开`http://127.0.0.1:5173/?art=character-motion&rev=7`。本轮完整`npm run verify`退出0：369单测、78浏览器用例、typecheck/lint/build通过，素材校验通过；记录见`docs/PROGRESS.md`和`artifacts/qa/main-integration-20261024-143440/`。仍停在人物局部审阅，真实设备、性能与最终美术待验项保留；下方各轮数字为各自历史结果。

**最新：继续精修了新人物握斧、肘部和落斧回收。** [打开第7版局部样片](http://127.0.0.1:4176/?art=character-motion&rev=7)。按真实握拳开口对齐斧柄，对原指垫/拇指做局部贴柄校正与轻微握紧；双手间距略增，保留17主骨架、原模型、UV与纹理。肘窝及肩袖权重更平顺；落斧后斧刃短停、身体稍晚缓冲、轻微回弹，再先拔出木面、沿弧线收回，修复旧回收穿桩。

新增“手肘特写”：暂停当前动作并对准真实掌/肘位置，可旋转；点击“人物近景”回到完整动作构图。保留重播、0.5×、仅站立及逐帧。指面属于原低模的局部几何校正，**没有完整逐指三节骨架**；原烘焙棕色和少量角面仍在，最终自然度继续由用户近景审阅。本轮369单测、32相关E2E、typecheck/lint/build/assets校验通过，实际记录见`artifacts/qa/user-grip/`及`docs/PROGRESS.md`；摄像头真机继续`manual_pending`。

仍只修改独立人物样片，不扩展全农场。普通首页默认无摄像头自动模拟、手动关闭偏好和真实输入切换保留；样片不请求摄像头、不计运动成果、不改变模拟偏好。安装/启动命令见下文；现有4176服务查看最终dist。

**上一轮：新人物局部样片接上派生骨架和站立→蓄力→挥砍→缓冲回收。** 可旋转、暂停、重播、0.5×慢放或拖时间轴检查。原FBX仍是无骨骼静态文件；应用在本地按实际网格生成17骨骼蒙皮，保留原脸、服装、UV与纹理，并拆出原斧作为刚体。双脚固定支撑，双手用IK跟随斧柄；斧头固定缩至原尺寸62%以适配动作，不是另购模型或动捕。以下为该轮交付状态，本轮精修见上文。

这轮只作用于独立`?art=character-motion`样片，局部农场中的新人物仍是原静态适配；没有扩展全农场。普通首页默认无摄像头模拟、手动关闭和真实输入切换保留，样片不启动训练、不请求摄像头、不读写模拟偏好。`&model=static`看原始姿态，`&model=prototype`看旧人物动作。实际验证、录屏和剩余限制见`docs/PROGRESS.md`、`artifacts/qa/user-rig/`；摄像头真机继续`manual_pending`，没有新增60fps结论。

启动：`npm ci` → `npm run assets:sync` → `npm run assets:verify` → `npm run dev`，开发地址加`?art=character-motion`。生产：`npm run build` → `npm run preview -- --host 127.0.0.1 --port 4176 --strictPort`。本轮未重新安装依赖，没有修改锁文件；现有4176预览已用于实际构建验证。

**上一轮：接入用户提供的人物与房屋FBX。** 模型预览可看人物/房屋近景、同框并旋转缩放；[局部农场](http://127.0.0.1:4176/?art=npr-sample)也已替换二者。人物原文件是带斧头的固定砍姿，没有源骨骼/蒙皮/动画；上一轮仅完成静态替换，本轮派生绑定见上文。原动作保留在`?art=character-motion&model=prototype`，局部农场也可点“原动作对照”。普通`/`、默认模拟及真实摄像头切换规则保留。

本轮**320单测、34项相关浏览器E2E（1.7分钟）、typecheck/lint/build/assets校验通过**；没有重新全跑所有E2E/verify或做新60fps验收。实际截图与记录在`artifacts/qa/user-models/`，最新范围/命令见`docs/PROGRESS.md`。模型原字节与内嵌贴图保留，来源记录在`public/assets/user-models/`；后续连续动作需对新人物另做绑定与动画适配。真实摄像头、硬件GPU、真实手机和最终美术仍待验。以下造型/动作轮次为历史记录，旧人物样片须加`model=prototype`查看。

2026-10-22最新局部：直接对照参考视频11–14.5秒的米白衣砍树青年，调整为栗棕碎发、较紧凑的脸型、红棕围巾、贴背V皮带、米白衣袖、灰绿裤和后侧皮包。视频主要侧后视，正脸为同风格原创解释；仍是人物试作，未购买Leo、未扩展全农场。刷新现有[人物预览](http://127.0.0.1:4176/?art=character-motion&rev=4)，可旋转、面部特写、暂停和逐帧查看；原首页默认模拟/真实摄像头切换保留。

本轮**307单测、17项相关浏览器E2E（52.7秒）、typecheck/lint/build/assets校验通过**，未重新全跑68项E2E或完整verify。实际16.72秒录屏和近景/背面截图见`artifacts/qa/video-character/final/`，命令和限制见最新`docs/PROGRESS.md`。发束仍偏大块、手指/胸前衣物接触与脚锁待继续精修；摄像头真机、硬件GPU与最终美术仍`manual_pending`，没有新60fps结论。以下为此前各轮独立历史。

2026-10-22继续精修`?art=character-motion`的人物局部：使用独立原创青年头部，收窄脸型、重做眼眉与短鼻、改为贴合头皮的侧分发型；新增“面部特写”，支持旋转审阅及手机窄屏构图。挥砍下挥延长到0.5秒，落斧后低位缓冲并逐渐放低，保留暂停、慢放、重播和逐帧检视。肩臂衣物在运行时派生修整，原素材文件与许可保留。**仍非Leo模型，未购买；只修改该人物样片。** 本轮实际验证与剩余限制见最新`docs/PROGRESS.md`及`artifacts/qa/character-refinement/`；下方271项等数字为上一轮记录。

本轮完整`npm run verify`实际退出0：**296单测、68浏览器用例（8.0分钟）、typecheck/lint/build通过**，素材校验通过。最终录屏/近景/四角度截图在`artifacts/qa/character-refinement/final/`；可点“面部特写”旋转审阅。肩口碎片和前臂穿袖已修正；中央胸前衣料接触、手指包裹和完整脚锁仍待继续精修，最终造型由用户审阅。真实摄像头、硬件GPU和真实手机仍`manual_pending`，没有新60fps验收结论。

2026-10-22新增**人物骨骼动作局部样片**：开发打开`http://127.0.0.1:5173/?art=character-motion`，现有生产预览打开`http://127.0.0.1:4176/?art=character-motion`。仅展示站立呼吸→举斧蓄力→下挥→回收，可重播、暂停、0.5×慢放、仅看站立和拖动时间轴逐帧检查；拖拽旋转镜头。该独立入口不初始化训练/摄像头，不改变模拟偏好或计数，原`/`和`?art=npr-sample`保持原流程，暂不扩全农场。

**当前试装不是Leo。** 用户选择Leo日式青年方向；官方公开目录现已确认`Leo_YoungAdult.fbx`和PNG，三段动画列为Unity`.anim`，未确认独立动画FBX/GLB。跨引擎使用的一般许可与公开GLB/公开仓库分发是不同问题，后者尚待明确，购买前需告知用户；本轮没有购买、联系作者或收入付费资源。小样采用明确附CC0许可的Quaternius农夫服装/两段骨骼动作，配原创临时头部；现有衣服与脸型仍属动作试装，不能当Leo造型或最终美术验收。核查见`artifacts/qa/character-motion/leo-terms.md`，原许可/哈希/派生说明见`public/assets/character-motion/`。

样片新增源文件为`entry.ts/characterSample.ts`、`world/sampleCharacter.ts/characterSampleClock.ts`和独立CSS；保留原领域与输入。最终271单测、typecheck/lint/build/assets校验通过，67浏览器用例分批通过：完整轮66/67，稳态HUD测试等待新入口ready后单独通过（含该用例的最终9项定向均通过），**完整verify没有退出0**。动态启动前保护静态按钮，模块失败提供重载；正常/失败释放GLTF位图。实际16.48秒录屏`artifacts/qa/character-motion/motion-preview.webm`、四张暂停帧及记录供局部审阅；25fps仅为录像编码，没有本轮60fps性能结论。

启动仍为`npm ci`→`npm run assets:sync`→`npm run assets:verify`→`npm run dev`；生产用`npm run build`和`npm run preview -- --port 4176 --strictPort`。测试记录与限制集中在`artifacts/qa/character-motion/`及最新`docs/PROGRESS.md`。摄像头真机、硬件性能及最终外观继续`manual_pending`，没有提交/push或扩展全场。下列第二版NPR数字属于上一轮，不代表新骨骼样片。

2026-10-22继续打磨**第二版局部NPR样板与人物动画**，仍在`codex/npr-farm-sample`本地工作区，暂不扩展全农场。入口保持`?art=npr-sample`，左侧标记“第二版”。人物改为开额头棕发、可见五官、卷袖/围巾/腰包和连续弯曲肢体；挥砍增加蓄力、快速下挥、腰部扭转与头/手腕跟随，装车连续蹲起/上举/收手，行走补单脚支撑及脚尖脚跟变化。暂停、长间隔和重置均约束表现时钟，手中木材持续使用实际双手中心；计数、库存、识别和训练时长保持原规则。

局部树木使用原创透明手绘叶枝图集，128组较大叶枝卡片组成透光树冠，配曲干、根系与分叉；草地增加380簇细弯草、低叶、少量小花/石块及坡面贴地，保留道路和动作站位。远景仍是旧版。本轮实际视频/截图、测试与性能见`artifacts/qa/npr-refinement/`及最新PROGRESS；下方“第一版”结果为独立历史记录。新叶枝图集的完整提示词和来源见`public/assets/npr/leaf-bough-v2.provenance.json`。

本轮实际257单测、typecheck/lint通过；59E2E分批通过：完整复验58/59，1项因截图文件UNKNOWN写入错误中断，原代码/路径单独复验通过。首轮另修正3项子路径测试与用户4176预览端口冲突，失败日志均保留，**没有声称一次完整verify退出0**。最终build/assets校验通过，bundle`index-DrLIbJGD.js`735.58KB。原速实录短片为`artifacts/qa/npr-refinement/chop-preview.webm`（8秒）、`load-preview.webm`（5秒）；未录摄像头。独立60秒SwiftShader采样**34.06fps/p95 49.9ms，画布比例0.5**，尚未达到60fps，硬件GPU和真机继续待验。详见PROGRESS及该目录原始记录。

2026-10-22新增**局部NPR美术样板**，当前工作分支`codex/npr-farm-sample`，尚未推送或合入main。用户批准先审阅“人物＋树＋手推车＋农场一角”，确认后再扩展；本轮只在`?art=npr-sample`入口启用，普通`/`保留主分支旧v2作对照。样板采用更自然的人物轮廓、不规则阔叶树、瓦顶/灰泥/木构农舍、局部手绘草地及柔和Toon光照。使用原创代码几何和内置imagegen生成的本地六格材质图集，完整提示词与来源见`public/assets/npr/`。尚未引入专业GLB、真实全局光照或完成视频级美术；远处森林/山体/农田仍为旧版，审美批准待用户确认。

现有工作区运行`npm run dev`后打开`http://127.0.0.1:5173/?art=npr-sample`；生产使用`npm run build`、`npm run preview -- --port 4176 --strictPort`后打开`http://127.0.0.1:4176/?art=npr-sample`。图集加载完成后沿现有偏好默认自动模拟，手动关闭/真实摄像头选择仍跨刷新记住；首次加载/失败期间不计数，加载中重置取消待启动，图形错误需刷新恢复。拖拽旋转、滚轮缩放，“全景视角”在样板中回到局部构图。完整验证命令仍为`npm run verify`和`npm run assets:verify`；本轮实际结果与截图见`docs/PROGRESS.md`、`artifacts/qa/npr-sample/`。

下面209单测/49E2E与55.72fps等数字属于此前main/v2历史证据，不代表本次样板的验证或帧率。真实摄像头、真人标定/准确率、硬件GPU与最终美术继续`manual_pending`。

本次样板实际验证：`npm run verify`退出0，**228单测、55E2E（7.3分钟）、typecheck/lint/build通过**，`assets:verify`通过。生产`index-DYRjJfQE.js`，实际截图`artifacts/qa/npr-sample/delivered-{home,hero}.png`（1366×900、画布比例1、手动零计数）；正常默认自动模拟、SwiftShader、预热10秒后60.0308秒/2323样本为**38.70fps，p95 33.4ms**，结束画布683×450铺满1366×900，0页面异常/外源。**未达60fps**，硬件效果待验；先停在局部美术审阅，后续需继续优化绘制/阴影成本，再扩展全场。完整数据、首轮失败与修正记录均保留在同目录。

在现有源码上增量实现的真3D农场运动Web Demo：Three.js0.186.1 + TypeScript + 本地MediaPipe。主分支v2按用户批准的温暖卡通方向精修：圆润人物、衣物细节、木纹与年轮、屋瓦、田垄、作物和接触明暗；使用共享的本地原创纹理与几何，不改玩法或输入。仓库：[FaithZL/Tidal](https://github.com/FaithZL/Tidal)，已交付主分支为`main`；本次局部样板分支见上文。旧Phaser3.90.0源码和依赖保留追溯，当前入口只运行Three.js。

用户于2026-10-21进一步明确授权合入并推送`main`。本轮以主分支`753c841`和开发分支`feature/3d-farm-experience`的`daf2af1`无冲突合并，保留双方历史。合并结果重新验证：**209/209单测、49/49 E2E（6.6分钟）、typecheck/lint/build/assets校验通过**，生产bundle仍为`index-CYPYbaQo.js`。合并期间仅补充采样边界负例并同步测试输入，生产逻辑/依赖未改；首轮失败与修正过程见`artifacts/qa/main-merge/`。开发分支历史保留，不对外部署；下方美术阶段208单测等数字为当时证据。

**首次打开或刷新即可看效果：无摄像头模拟默认开启，自动进入正常倒计时和完整农场流程。** 合成骨架和农场自动运行，正式时长约两分半。开关保留，关闭后暂停自动输入，并记住选择；再次刷新会留在手动首页。重新开启后刷新可恢复自动演示。重置/结算返回首页保留开关偏好，但不会自动再开一局。模拟不请求摄像头、不调用识别器、不参与标定，结算始终保留模拟来源。

偏好仅在当前浏览器同源localStorage保存一个布尔值（`tidal.demo.enabled`），不保存进度、视频或姿态；刷新建立新会话。浏览器禁用存储时仍可演示和关闭，但无法跨刷新记住关闭选择。音效仍默认静音，不自动请求摄像头权限。

流程：计划 → 5秒倒计时 → 15次挥砍 → 15秒休息 → 5秒倒计时 → 15次装车 → 15秒休息 → 5秒倒计时 → 60秒有效持姿 → 结算 → 重置。所有计数、库存和奖励均由 SessionController 管理。NPC“禾禾”为预设协作，不是真人联机。

T06 特征/标定、T07 砍树/装车识别、T08 持姿代理、T09 摄像头输入接线已实现。当前使用人工编写的关键点回放和浏览器合成视频验证软件路径；**没有物理摄像头，真人准确率、标定可用性和完整真人流程仍为 manual_pending。** 接上摄像头后须先标定，再手动选择摄像头训练；不会静默切换模拟。持姿代理不能证明器械重量或真实持握。

当前首页展示完整原创3D农场与紧凑计划通知；拖拽旋转、滚轮缩放、按钮恢复全景。训练时右下PiP展示同一摄像头视频/骨架或明确标注的合成骨架，以及动作阶段和训练处方。人物推车、每树5段、从手部抛木、NPC绑绳，Carry按有效时间连续前进40世界单位（示意距离，非实测米数）。结果等宽展示运动数据与游戏奖励。音效默认关闭，可点击启用/静音。

为接近60fps，持续运动中如果帧耗时偏高，3D画布会自动降低渲染分辨率，最低为CSS尺寸的0.5倍；文字、按钮和摄像头视频保持原尺寸与清晰度。场景内容、运动目标与计时不变。暂停、静止和单次卡顿不触发降档；本页保留选定档位以避免画质来回跳动，刷新重新评估。高性能设备保留初始分辨率（设备像素比上限1.25）。

操作步骤见[路演手册](docs/DEMO_RUNBOOK.md)，当前逐项证据和人工待办见[验收报告](docs/TEST_REPORT.md)。旧2D的155单测/35E2E及40.06fps记录已归档到[历史报告](docs/history/T11_2D_TEST_REPORT.md)，不作为当前3D性能或真机证据。

本轮美术完整回归：**208/208单测、49/49浏览器E2E（6.3分钟）、typecheck/lint/build通过**，见`artifacts/qa/art-polish/verify-final.log`。草捆贴图语义修正前的`index-DEI107uw.js`（693.53KB/gzip183.83KB）在1366×900、DPR1、SwiftShader软件渲染、正常自动模拟下，预热10秒后独立60秒实测**58.32fps、p95 16.8ms、最大66.6ms、>50ms 1次**，0页面异常/外源。3D比例0.8→0.5，最终683×450铺满视口，有清晰度代价；这属于约60fps条件结果，硬件GPU与真人性能仍待验证。原始数据见`artifacts/qa/art-polish/final-profile.json`，500KB体积提示保留。

随后仅将金黄草捆由年轮改为已有纵向纹理；最终`index-CYPYbaQo.js`（693.52KB/gzip183.83KB）已通过typecheck/lint、208单测、1项完整七阶段视觉E2E、build和assets校验，见`artifacts/qa/art-polish/material-final.log`。49项全套属于该材质修正前版本，未冒称重新全跑。最终首页/近景截图见同目录`delivered-home.png`、`delivered-hero.png`；领域、编排、输入、依赖及默认模拟/显式摄像头切换均保留。

最终正常生产整局实际**142.227秒**完成15/15/60、15段到家、100/100游戏奖励和重置，0页面异常/外源/姿态资源请求。预热后131.6948秒/7338样本，平均**55.72fps、p95 33.3ms、max33.5ms、>50ms 0**；运送截图时3D比例0.512、699×460铺满1366×900。证据和四张实际截图见`artifacts/qa/art-polish/production-auto-flow.json`及同目录；纹理候选与证据口径见该目录README。远景去纹理短对照无明确收益，已恢复原材质，重新构建哈希仍为上述版本。**稳定约60fps尚未达到，P01保守记fail：当前49ID为33 pass、1 fail、15 manual_pending**。物理摄像头、硬件GPU与最终审美批准继续待验；不拿旧版或短采样冒作最终整局成绩。

历史证据保留于`artifacts/qa/performance/`（183单测/49E2E，旧美术独立60秒59.74fps，141.930秒整局/预热后58.63fps）、`artifacts/qa/3d/`（170单测/42E2E、142.219秒整局、39.59fps）和`artifacts/qa/default-demo/`（170单测/47E2E、默认启动冒烟18.339秒），均不冒作本轮美术结果；本轮未改锁文件或重复安装。

本轮为T11之后用户追加的真3D体验升级，保留原领域逻辑、识别器与有效负例测试。L2/L3真机与最终美术签字仍未通过。获得摄像头后按手册复测，保留模拟开关并显式切换输入，无需重写领域逻辑。

## 安装与启动

实际环境：Windows、Node 24.14.0、npm 11.9.0。重新安装前停止本项目 Vite 服务，避免原生模块被占用。

```powershell
git clone https://github.com/FaithZL/Tidal.git
cd Tidal
git switch main
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

性能复测：`node scripts/profile-demo.mjs`，保持4175生产预览，且不要同时运行其他测试。默认全新浏览器、1366×900、预热10秒后采样60秒，记录rAF帧间隔、实际GPU、3D渲染比例与布局开销；输出`artifacts/qa/performance/profile.json`。可用`TIDAL_PROFILE_OUTPUT`改证据路径。软件渲染下的结果不代表真实摄像头或硬件GPU表现。

生产整局复测设置`$env:TIDAL_BLOCK_EXTERNAL='1'`、`$env:TIDAL_QA_DIR='artifacts/qa/art-polish'`后执行该脚本：浏览器阻断非本地来源，按正式时长流程记录成果，预热10秒后记录至少60秒rAF帧间隔、实际WebGL GPU和3D画布比例。本轮最终结果待记录；上一轮证据保留于`artifacts/qa/performance/`。该方法不等于物理断网，也不测真人动作端到端延迟。

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

`node_modules/`、`dist/`、Worker构建产物和临时测试目录不入库；模型/WASM与已记录QA证据入库。原T01–T11软件交付后，真3D开发历史保留于`feature/3d-farm-experience`；本轮按用户明确授权集成到`main`，硬件与产品签字继续manual_pending。后续常规工作默认不自动合并或部署。
