# 来源、参考图与可核查技术资料

## 2026-10-25用户人物装车抛木局部动作

用户在NPR预览指出“抛木头没有动作”并要求补上。本轮复用已有本地用户FBX、内嵌贴图和派生17骨架，仅装车阶段新增关节/IK编排，不下载、购买或生成新人物/动作素材。源人物仍是无原生骨骼/动画的静态FBX；`UserLoadMotion`是本地表现编排，非原作者动画或真人动捕。其他砍树/行走/推拉保持原静态适配，独立第7版挥砍样片不变。

真实输入阶段仍由原ExerciseSignal驱动；实际双掌中点提供木头锚点，既有600ms抛物轨迹与库存守恒逻辑保留。正常速度生产录像只来自WebGL合成画布，不含真人视频、音频或姿态轨迹。新测试/原失败/逐帧和视频证据位于`artifacts/qa/user-load-motion-20261025/`；原件SHA/许可未改，本轮不commit/push/部署。

## 2026-10-25城堡新增柔和卡通贴图

用户在确认两份FBX均无贴图后，明确选择“柔和卡通石堡”：浅灰石墙、深色门窗和少量苔藓山岩。通过内置imagegen生成`public/assets/user-models/castle-materials-v1.png`四区颜色素材（石墙/山岩/木板/苔藓，1254²），没有上传用户FBX或下载第三方纹理；完整提示词见同目录`castle-texture-prompt-v1.txt`。

`scripts/bake-castle-texture.mjs`在本地将生成素材投射并烘焙到第一份城堡的原UV，输出2048²的`castle-soft-toon-v1.png`，运行时沿用现有Soft Toon。建筑/山岩和凹槽木色遮罩是依据几何的人工近似，不是原作者材质ID；颜色图不是法线、PBR或自动识别语义的证明。原FBX/UV/几何及无图来源记录保持，第二份仍未替换。本轮新图不称为恢复原图或CC0，源模型公开再分发许可仍待确认。来源/SHA/颜色空间和烘焙过程见`castle-soft-toon-v1.provenance.json`与本轮QA；不commit/push/部署。

## 2026-10-25用户提供城堡FBX与第二版本检查

用户提供`model2b63561bfbee01.fbx`并要求可打开则添加到场景。实际Three.js r186解析及浏览器正反面确认是带山体的灰色城堡；原文件2,538,316字节、60,000三角面、无骨骼/动画、无Texture/Video对象或外部贴图。`public/assets/user-models/castle.fbx`为逐字节副本，SHA256=`9e9eb6ca8ed8de21894a9063fcf0b8d9ba09917298e6c6308584205fba831ede`。运行时仅统一缩放、落地和远景放置，保留源灰色与几何/UV；没有生成贴图、假称贴图完整或新增动作。

用户随后提供`modelabd4643519d001.fbx`并要求有贴图才替换。实际解析也为Texture=0、Video=0、灰色Phong，2,645,452字节、60,000三角面，但几何与第一份不同。其SHA256=`a515a25354b81a2a55cd129217aa67456b9e9dbfaa503bcf8aec51576b4b0c06`；因此按条件未替换，第二份没有收入应用。两份源文件均未修改；记录在`artifacts/qa/added-model-20261025/inspection.json`和`second-file-inspection.json`。

只获本项目本地添加授权，原作者/公开再分发许可未提供，不标CC0；本轮不commit/push/购买/部署。灰色材质与静态结构是源文件限制，不是已完成最终美术或真实摄像头验收。

## 2026-10-22握斧与缓冲回收精修（最新）

继续使用用户原FBX，没有新购/下载/上传素材。`userHandGrip.ts`只对既有手网格的指垫/拇指做本地小幅几何校正与法线修整，握轴按实际卷指开口拟合；不是新增假手、Leo、完整逐指三节骨架或动捕。原FBX、UV/图像、三角总数、手外法线保留；源烘焙棕色和低模角面仍是限制。动态握距在该样片略增，斧62%固定显示尺寸不变。

`userCharacterRig.ts`调整肘/腕和肩袖支持范围，`userCharacterMotion.ts`重新编排真实斧轨迹及身体延迟吸收；`userChopContact.ts`只读实际工具几何对齐木面，未引入物理引擎、领域事件或新摄像头算法。真实失败、独立CPU三角面检查与最终Three浏览器录屏独立存放`artifacts/qa/user-grip/`；只作用于局部样片，不把合成动作/数值检查当真机识别、完整自碰撞或最终美术批准。

## 2026-10-22用户人物的本地派生骨架与动作（最新）

用户明确要求为新人物绑定并接上站立、挥砍、回收，先做局部样片、保留无摄像头模拟。本轮不新增下载/购买/上传素材，仍使用下节两份FBX原字节副本。原人物没有骨骼；新增`userCharacterRig.ts`按实际模型拓扑拆出230三角原斧、标记17个关节、生成蒙皮。原UV/材质与总4900三角保留，斧在动作样片固定缩为62%。隐藏原静态网格保留资源所有权，提供显式静态对照，不能把派生骨架说成源FBX本有。

`userCharacterMotion.ts`为本地原创编排：呼吸、蓄力、下挥、低位缓冲与回收，双手握点和足部使用两段IK。它不产生ExerciseSignal或修改领域状态，未使用摄像头/动捕序列，也未逐指绑定。真实FBX的CPU顶点/拓扑诊断、失败修正、Three浏览器截图与连续录屏在`artifacts/qa/user-rig/`；合成动画不能证明真人识别或最终自然度。原素材公开再分发许可和摄像头真机仍待确认。

## 2026-10-22用户提供的实际人物与房屋FBX（最新）

用户在本会话提供`modelf23d8a6f4b3801.fbx`（人物）及`model4e87ceb4739501.fbx`（房屋）并明确要求替换。两份逐字节本地副本为`public/assets/user-models/character.fbx/house.fbx`，源名、字节/SHA、FBX7400规格、内嵌图及许可边界记录于同目录provenance.json/README。用户提供用于本地项目不等于已核实公开再分发许可；没有标为CC0，没有上传、购买或公开部署。

只读二进制解析与Three FBXLoader实际确认：人物4900三角、房屋4430三角，都是单网格静态物体，0骨骼/skin/动画；人物自带斧头且固定砍姿。8张2048²嵌入图逐张实际解码，没有缺失。材质只接颜色/法线，Soft Toon有意忽略镜面；粗糙/金属源图仍在FBX但未宣称完整PBR生效。模型原像素与UV未改，没有将视频帧当新贴图。检查脚本/报告和实际本地渲染证据见`artifacts/qa/user-models/`。

## 2026-10-22按视频砍树青年改造局部（最新）

实际查看用户本地`f38d303d396bf728a3d9141460b9b2ac_raw.mp4`的11、12、14.5秒米白衣砍树角色，另核对0.5/1.97秒蓝衣少年。两者是不同角色；主参考前者的短栗棕发、红棕围巾、米白衣袖、灰绿裤、深靴和后侧皮包/V皮带。视频主要侧后视，无法可靠确定眼睛/鼻/正脸；新五官为同风格原创解释，不能声称完整还原。分析裁切仅在TEMP，未进入应用或仓库；只读审阅文字在`artifacts/qa/video-character/visual-audit.md`。

新头/围巾/背带/皮包为`sampleHead.ts/sampleCostume.ts`原创代码几何；服装仍是已留证的Quaternius CC0源文件，运行时材质克隆/局部着色保留原PNG像素与UV，源GLTF/bin/贴图/许可/SHA未改。没有从视频/Leo商品图提取纹理、复制模型、购买或联系作者。实际Three.js截图与录屏独立放在`artifacts/qa/video-character/final/`；它们是本地试作效果，不是参考视频原帧、Leo成品、动捕或摄像头证明。

## 2026-10-22人物局部第二轮精修

本轮没有新购、下载或收入第三方模型/贴图。`src/game/world/sampleHead.ts`为独立原创青年头部的网格代码，仅参考已选定的日式青年造型方向；未使用Leo付费网格、纹理或商品图片像素。原`nprModels.ts`中的农场人物头部保留。

衣物的运行时派生位于`sampleCharacter.ts`：调整袖口与前臂覆盖部位的几何/权重，配合握持和肘部连续过渡；这不同于直接渲染原始网格。磁盘CC0源资产及对应SHA没有变化，原始12,894三角只描述源模型。人物动作时钟重新安排源动作的下挥和卸力，不能称为新动捕或真实摄像头动作验收。新实际画面与失败/修正证据独立存放在`artifacts/qa/character-refinement/`。

## 2026-10-22 Leo方向局部动作样片（采购核查与实际CC0资源）

用户选择Leo方向，但要求购买前告知。本轮未购买、未联系作者，未向外站上传用户资料。实际展开[Leo官方商店](https://assetstore.unity.com/packages/3d/characters/humanoids/humans/leo-young-adult-313183)公开Package Content，确认`Leo_YoungAdult.fbx`及PNG，动画目录为Unity`.anim`；独立动画FBX/GLB未确认。[Unity官方跨引擎说明](https://support.unity.com/hc/en-us/articles/34387186019988-Can-I-use-assets-from-the-Asset-Store-with-other-engines)允许合规跨引擎使用，同时限制原始资源可被下载/提取，不能据此将公开GLB/GitHub原资产分发当作已获准。详见`artifacts/qa/character-motion/leo-terms.md`，并不宣称所有WebGL游戏被禁止。

实际样片不是Leo：原创临时头部、代码制作颈/斧与局部舞台，加Quaternius官方Standard的Male Peasant蒙皮衣服和两段动画。`public/assets/character-motion/provenance.json`记录源页、归档/条目SHA、9个本地文件SHA、提取/JSON修改过程，三份原始CC0许可保留；未把全站不同QAL统称CC0。两段精简GLB保留原关键帧字节，运行时代码做绑定重定向、分段重定时、过渡和握持校正；没有复制Leo模型、商品图片像素或用户视频素材进入游戏。

原作者服装两张basecolor保留原图，没用AI改图或下载第三方镜像；模型、纹理、骨架/动画均在本地，运行时无外源。实际录屏/暂停帧另存`artifacts/qa/character-motion/`，明确为Three.js技术试装，不是购买后Leo效果或真摄像头识别成功。资产只读检查与运行时接触/自然度是不同证据，最终美术仍待人工审阅。

## 2026-10-22 外部角色/骨骼动画调研（候选，未作为应用素材）

用户要求更自然动作和网上角色模型。原作者商品/预览仅用于选型，不代表Tidal已经加载/渲染该模型。未购买、上传用户素材或把第三方FBX/GLB加入`public/`；浏览器网页预览截图单独放在`artifacts/qa/character-research/`，不能与游戏实拍混用。

- [Neko Legends：Leo, Young Adult](https://assetstore.unity.com/packages/3d/characters/humanoids/humans/leo-young-adult-313183)：已查看青年男角色预览；现代服装不适合作为现成农夫装。Unity Humanoid、44面部blend shapes与3动作等为商品页声明，独立格式/运行时兼容性未验证。
- [Neko Legends：Kiyomi - Adventurer](https://assetstore.unity.com/packages/3d/characters/humanoids/humans/kiyomi-adventurer-278652)：已查看日式幻想女角色预览；69面部blend shapes、约40动作等为商品页声明。运行环境和着色器针对Unity URP，不等于Three.js开箱可用。两者均按[Unity Asset Store条款](https://unity.com/legal/as-terms)评估，不能把游戏使用许可当成原始素材公开分发许可；没有购买或归档检查。
- [Quaternius Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html)、[Modular Character Outfits Fantasy](https://quaternius.com/packs/modularcharacteroutfitsfantasy.html)：免费Standard包只读核对，许可文件明确CC0；免费Base只有Superhero男女与部分头发，不能将网页列出的Regular/Teen也称免费。Peasant衣服带骨架、需另配头部。原作者免费版示意图实际查看；偏西式比例/脸型，仍须美术改造。
- [Universal Animation Library](https://quaternius.com/packs/universalanimationlibrary.html)、[Universal Animation Library 2](https://quaternius.com/packs/universalanimationlibrary2.html)：Standard归档许可明确CC0。已核对实际片段名：待机、行走、推、桌面拾取、砍树、搬运走和上手投掷；名称不是接触质量/本项目适配证明。UAL1完整Standard归档SHA256=`cc73fc4e495b82958207316596317a3f40b9fa38065bde1027937452da537724`；UAL2=`4008ea208a604773a2b2177d965f0f5d3195498b5bf838c3f5785d68e95f2a68`（18,735,003字节）。为只读调研，不在仓库加入原ZIP。
- [Quaternius全局QAL](https://quaternius.com/license.html)于2026-08-28更新，限制独立素材分发；与上述产品页/Standard文件的CC0标记并存。后续按所用具体文件保留许可证据，不一概宣称网站全部CC0。
- [Adobe Mixamo FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html)允许游戏中使用模型/动作，但不明确许可公开原始资产；[Adobe通用条款](https://www.adobe.com/legal/terms.html)包含Content Files独立分发限制。因此Mixamo暂为需要进一步核对交付方式的备选，未当作公开仓库可直接收入的免费动作库。
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)、[AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html)、[AnimationAction](https://threejs.org/docs/pages/AnimationAction.html)：原生加载、动画混合/暂停能力已核对；本项目的分段动作、脚底固定、道具接触、资源释放及性能仍须实现和测试，文档不替代实测。

2026-10-22用户认为第一版局部样板与视频差距较大，明确要求继续打磨人物/树木/草地、暂不扩展全农场，随后追加“人物动画能不能细腻一些”。本轮以同一参考原帧作对照，新增开脸人物、工作服/连续弯曲肢体、只消费表现帧的NprMotion（姿态过渡/腰部重心/头腕跟随/脚尖脚跟），未改领域/识别或新增动作计数。树木用原创透明叶簇而非不透明球冠，草地细草/低叶/小花及坡面落地均为原创代码网格。

`public/assets/npr/leaf-bough-v2.png`为内置imagegen生成、未输入任何参考图像的1254×1254 RGBA叶枝素材，1,472,691字节，SHA256为`f42e6a8e54ce00d7b3147c3ac2cce69c1a00deb81aa7b09de20c7d578daea036`；完整最终提示词及生成路径在同目录`leaf-bough-v2.provenance.json`。它仅用于交叉叶枝卡片，真实三维根/枝干与卡片矩阵由代码生成；不是生成图片替代游戏截图。没有购买/下载专业GLB、录音或参考视频像素。

本轮`artifacts/qa/npr-refinement/motion-preview.webm`记录正式构建普通键盘流程，未申请摄像头/录制真人；8秒`chop-preview.webm`与5秒`load-preview.webm`从该实录按原速截取，未改播放速度。使用本机已有Playwright附带FFmpeg1013的VP9编码器；仅QA视频制作，不进入应用依赖/运行时，不把视频25fps编码规格当作游戏帧率。实际元数据、命令和独立性能记录见同目录及PROGRESS。

2026-10-22用户提供`f38d303d396bf728a3d9141460b9b2ac_raw.mp4`作为新美术参考，并批准“先局部，OK了之后再扩展”：本轮只做人物、树、手推车及砍树—装车一角的NPR样板。实际本地解析视频为1920×1080、30fps、98.4秒，抽取9个时点，查看接触表及约13.8/49.2秒画面；没有完整逐帧/音轨分析。视频混合农场场景与产品概念展示，参考重点为林间色光、树冠体块和前中远层次，不据此增加联机/UGC/AI教练业务或推断实时性能。仅临时抽帧用于分析，不在仓库打包原视频/截图，不将参考像素或角色直接作为生产素材。

本轮局部样板的几何由`nprModels.ts/nprEnvironment.ts`原创代码制作；没有下载GLB或宣称专业角色资产已经完成。`public/assets/npr/pastoral-atlas-v1.png`为内置OpenAI imagegen新生成的1536×1024不透明六格手绘材质图集，未输入参考视频/图片；上排树皮、木板、屋瓦，下排灰泥、草地、树叶。实际SHA256为`48b05a7297950f5aa25a3b8dd038871e70c5835642408e91860dfc5ac80ecd90`，完整提示词、生成路径和来源声明在同目录provenance.json/README。它是贴图资源，不是游戏截图或审美验收证据。运行时仅本地加载，`assets:verify`校验哈希和尺寸；参考风格、最终画质及是否扩展仍待用户审阅。真实摄像头与硬件GPU继续manual_pending。

2026-10-21用户要求美术资源更细致、精致，并回复“可以的，按照这个路线去搞”，批准沿用温暖卡通真3D方向精修人物、木材/手推车/树木、建筑/道路/农田与光照，同时保留原动作、默认模拟和真实摄像头切换，重新实测约60fps目标。所有新增表面纹理为本项目确定性代码生成的128×128 DataTexture，造型由原网格和锁定Three.js几何工具增量制作，没有外部模型、AI生成图片、购买素材、字体下载或外发服务；来源清单见`public/assets/README.md`。视觉方案批准不等于用户已验收最终成品；摄像头真机仍manual_pending。

2026-10-21用户继续要求优化演示流畅度，尽量达到60fps，保留默认模拟与真实摄像头切换，验证后提交/push。当前新增静态空间合批、DOM相同值去重和3D画布自适应像素比；最后一项会以清晰度换帧率，属于实现策略，不是把低分辨率数据冒作相同画质性能。没有新增素材、依赖或外部服务，原模型/许可/合成数据来源不变。测量方法和原始证据见`artifacts/qa/performance/README.md`，真机仍待验证。

2026-10-21用户进一步要求“模拟模式默认打开，刷新后也能直接看效果，保留开关，以后有摄像头再切换真实输入，验证后提交并push”。本轮沿用上一版合成骨架/自动语义输入，仅调整默认启动及偏好；不是把人工关键点伪装为摄像头或MediaPipe输出。仅同源存储一个开关布尔值，关闭或明确选择摄像头后跨刷新保持手动，视频/姿态数据仍不保存。其他真机验收限制不变。

> 下列“未验证事项”记录的是文档编制时状态；2026-10-15实际安装与测试结果以`PROGRESS.md`、`TEST_REPORT.md`为准。本轮资源来源、锁定版本与许可证另见`DEPENDENCIES.md`。

> T05 核实：本机 `sources/` 目录不存在，因此未直接查看下文列出的原始 DOCX/三张参考图，也未重新核验其 SHA。以下索引保留为历史资料记录。T05采用原创本地SVG与Phaser绘制；2026-10-21当前入口改用原创程序化真3D，见下方追加范围。历史美术清单见 [`public/assets/README.md`](../public/assets/README.md)。

## 用户追加并批准的真3D范围（2026-10-21）

用户要求全景农场首页、Mac通知大小的计划卡、游戏内摄像头画中画和运动状态/处方、每树5段、人物推车、手部抛木、绳索固定、连续向更远目的地运送、等宽运动/游戏结算，并明确选择可旋转的真正3D。随后批准`3D_FARM_DESIGN.md`与实施清单。此授权替代旧“禁止3D”和A03初始12/每树1的临时方案：当前为初始0、3树各5段、装车15段。40为批准设计中的示意世界单位，不是实测米数或真人移动距离。

当前渲染使用精确锁定Three.js0.186.1，人物、道具、田地、建筑和绳索均由原创代码生成。用户提供的“无限农场”参考图仅作氛围参考，没有复制其像素、模型、商标或字体，不据此推断素材授权。没有新增购买、外发服务或公开部署。用户另已授权阶段验证后提交/push开发分支；下面T06“不自动推送”属于当时历史约束。

技术核对：[Three.js官方OrbitControls](https://threejs.org/docs/pages/OrbitControls.html)，支持围绕目标旋转/缩放；本项目关闭平移、提供全景重置。版本以安装包及锁文件为准，许可见`DEPENDENCIES.md`。摄像头PiP只复用原video/track/Worker；自动模拟与人工关键点仍明确标识，不能替代真机验收。

编制日期：2026-10-14。

## 用户追加要求与测试数据：T06（2026-10-16）

用户要求在现有 Phaser 版本上实现关键点特征、标定和回放测试，保留模拟开关；当前无摄像头，真机继续 `manual_pending`，完成后停在 T06、不自动推送。没有授权提前完成三运动识别或以合成数据替代真机验收。

新增 `tests/fixtures/poses.synthetic.json` 为本项目人工编写的二维 33 点坐标（参考尺寸 640×480），包含自然站立、上肩、下方、下蹲、举手与持姿；metadata 明确 `synthetic`。无真人采集、录像、个人身份信息或第三方姿态样本，也不是 MediaPipe 实际输出。`tests/helpers/syntheticPose.ts` 将像素坐标转换为 PoseFrame；`replayPoseSource.ts` 只供测试按时间戳回放。浏览器标定用例将这些点经模拟 Worker 送入真实准备页，并在截图加合成来源标签；不能推导真实识别准确率。

生产中的自动演示骨架仍由原 `SyntheticPreview` 绘制，与这批 33 点测试夹具和标定链路分开。新增稳定性、位移、示例差异门限属于可配置实验默认值 [A]，不是已确认的产品标准或运动要求。

## 用户追加要求：无摄像头演示（2026-10-15）

本轮用户确认电脑没有摄像头，要求可开关的测试效果，并在澄清选项中选择“模拟骨架 + 自动演示完整农场流程”。这只确认模拟展示的范围，不确认真实动作识别已经完成。新增骨架由本项目代码原创绘制，非真实采集、非 MediaPipe 输出、无第三方素材。保留真实摄像头诊断入口；以后接入摄像头仍需 T06–T09 才能用真实运动控制完整流程。既有数量/持姿代理/健康指标等未确认假设不因此变为已确认。

## S0｜原始需求文件

- 用户上传名称：`demo 需求.docx`。
- 本包完整副本：`../sources/demo_requirements.docx`。
- 本次读取视图：共6页，含项目故事、需求背景、关键模块、交付时间、五步演示详情。
- 使用原则：原始需求是产品依据；开发指南中的[A]是本方案新增的工程建议，不能倒写成原文已经确认的内容。

### 分页索引

| 页码 | 内容 |
|---|---|
| 1 | 居家运动与农场模拟经营结合的故事与设计目标；农场全景参考图；路演背景 |
| 2 | 关键模块、AI/资源/动作映射、非真实PvP的机器人合作；一周/Web交付；首页计划开头 |
| 3 | 计划的运动映射和倒计时/休息；砍伐动作、每棵5次/共3棵；动作参考图 |
| 4 | 休息收集/推车靠近；装车15次复合动作；持续提壶铃拉车；装车参考图 |
| 5 | 放下时车停止；到家结算；奖励与部分示例运动指标 |
| 6 | 示例20min/表现+5；返回首页并重置游戏 |

第2页两处参考内容在上传件中显示“该类型的内容暂不支持下载”；本包没有这些缺失内容，未对其作推测。第4页“原来已有的工15棵树”存在疑似错字/导出问题；“已有12单位”不是原文数值，而是开发指南A03为暂时协调3棵新树和15单位装车总量提出的默认值。

## S1–S3｜原文中的三张参考图

| 编号 | 本包文件 | 原文位置 | 可见内容与用途 |
|---|---|---|---|
| S1 | `../sources/reference_farm.png` | 第1页 | 题为“无限农场”的高细节田园全景参考；可参考农场气氛和长期成长感，不代表已提供分层游戏素材 |
| S2 | `../sources/reference_chop.png` | 第3页 | 真人持壶铃、屏幕中是像素风人物砍树；用于理解真人运动与游戏动作的映射意图 |
| S3 | `../sources/reference_load.png` | 第4页 | 真人持壶铃、屏幕中是卡通人物与蓝色车辆；用于理解搬运动作的表现意图，不应覆盖文字要求的手推车 |

这三张图的屏幕内容呈现不同细节/风格。统一暖色2D卡通是本方案的建议，不是原文已确认的美术规范。它们不是动画序列、关节标注数据、动作精度证据或素材商业授权证明。

## TECH01–TECH07｜开发时核对的技术资料

下列为官方技术文档或项目维护的参考资料。核对日期为2026-10-14。API及工具版本后续可能变化；执行时以实际锁定依赖的类型定义与相应版本文档为准，不照抄不匹配的代码示例。

### TECH01｜Phaser 3.90.0 API

资料地址：

`https://docs.phaser.io/api-documentation/3.90.0/api-documentation`

支持的技术事实：Phaser提供3.90.0版本的独立API文档，可据此固定实现基线。本文不主张3.90.0是当前最新版本，也不主张所有新版教程与其API完全兼容。

### TECH02｜MediaPipe Pose Landmarker Web指南

资料地址：

`https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js`

支持的技术事实：Web包为`@mediapipe/tasks-vision`；支持VIDEO处理模式与模型本地加载；Web推理调用同步执行，文档建议通过Worker避免阻塞主线程。模型创建/推理的具体签名须对照安装版本类型定义。

Worker队列长度、降级策略、初始化超时、15Hz等是本方案设计，不是文档替本项目作出的性能保证。

### TECH03｜MediaPipe Pose任务说明与模型

资料地址：

`https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker`

支持的技术事实：模型输出33个人体关键点；提供图像与估计世界坐标；官方列出Lite/Full/Heavy等模型。肩、肘、腕、髋、膝、踝编号可在该页核对。

本方案根据输出类型判断：仅有这些人体关键点并不足以确认实际壶铃负载。这是系统能力边界分析，不是“已经对本场景做过实验”的结论。

### TECH04｜浏览器摄像头与安全上下文

资料地址：

`https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia`

支持的技术事实：摄像头访问受用户授权和安全上下文限制；HTTPS和localhost是本方案采用的运行方式；设备/权限失败需处理。不以`file://`作为本项目推荐部署路径。

### TECH05｜Vite运行环境

资料地址：

`https://vite.dev/guide/`

支持的技术事实：当前核对指南给出的Node最低要求是20.19+或22.12+，部分模板可能要求更高。执行时应使用实际版本支持的、仍受维护的Node版本并记录，不把最低要求当作长期版本推荐。

### TECH06｜Playwright浏览器配置与权限

资料地址：

`https://playwright.dev/docs/test-use-options`

`https://playwright.dev/docs/api/class-browsercontext`

支持的技术事实：测试可以配置浏览器上下文/权限；权限支持依浏览器及版本而异。用模拟权限或stub测试异常分支，不等同于已经完成真实摄像头测试。

### TECH07｜Codex的AGENTS.md与长任务指导

资料地址：

`https://developers.openai.com/codex/agent-configuration/agents-md`

`https://developers.openai.com/codex/learn/best-practices`

`https://developers.openai.com/cookbook/articles/codex_exec_plans`

支持的技术事实：Codex可读取项目级AGENTS.md；短而实用的项目约束配合详细任务文档适合保持跨任务一致性。本包的任务编号、默认值、测试用例和检查点由本方案设计，不是官方预置项目模板。

## 本包未声称已验证的事项

- 没有安装本项目的npm依赖或下载姿态模型。
- 没有运行此项目的单元、浏览器、真机、性能或离线测试。
- 没有确认甲方已接受阶段同步、持姿代理或任何原文冲突的处理方式。
- 没有核实原图的商业使用授权，也没有附带第三方最终游戏素材。
- 一周排期、动作阈值、性能/准确率门槛均为待执行方案和待实测目标。

## 附件完整性

### T10 新增原创声音（2026-10-16）

`src/ui/audioFeedback.ts` 使用原生 Web Audio 正弦振荡器和衰减包络合成短反馈音（挥砍、倒树、装车、阶段开始、结算）；本项目原创代码生成，无第三方录音、下载或外部音频服务。默认静音，经用户点击启用，可随时静音；节点结束/静音/页面释放时断开。许可沿用本项目源码许可状态，不额外声明第三方音乐授权。

上方“本包未声称已验证”是原始开发文档编写时的声明，当前实现与实际测试结果以最新 PROGRESS / TEST_REPORT 为准。

以下为随包文件的SHA-256；副本与本次对话中的对应上传文件逐字节一致。

| 文件 | SHA-256 |
|---|---|
| `demo_requirements.docx` | `7582826e4fe84d22502a89dfb8a32530b518f75739bffd1aeee09d3ef3bb0d12` |
| `reference_farm.png` | `2576ea08bcb34dde882dbbff8d05c3a89cb50b7f23e82f46b0258e8f89287eea` |
| `reference_chop.png` | `638eacc7b190847e1cf7fb589c8f48524398dd26355b5c9477087c425d8b8a7d` |
| `reference_load.png` | `f8f406368927a709e42d406a62515402c0cfed085e796976cb159f8bde2758bb` |
