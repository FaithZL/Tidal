# Tidal T05 美术来源

2026-10-22用户提供人物/房屋两FBX已作为本地原件收入[`user-models/`](user-models/README.md)，逐字节副本、SHA与来源边界齐全。人物4900/房屋4430三角，各4张内嵌图，均无骨骼/skin/动画；新人物保持固定带斧砍姿。现有Soft Toon只接颜色/法线、去镜面，源纹理/UV不改。用户授权本地替换，未提供原作者/公开再分发许可，不归入下文CC0或原创生成资源。

2026-10-22视频角色局部改造：`sampleHead.ts/sampleCostume.ts`原创短栗棕发/青年脸、红棕围巾、V皮带与皮包；`sampleCharacter.ts`在运行时克隆并局部重着CC0服装材质，不改磁盘PNG/GLTF/bin/UV。仅参考用户视频侧后视造型，正脸为原创解释；视频像素与分析裁切不进入应用/仓库。范围仍仅`?art=character-motion`，没有购买Leo或自动替换全农场。

2026-10-22独立人物动作样片使用[`character-motion/README.md`](character-motion/README.md)中列出的Quaternius官方Standard CC0蒙皮衣服、原始basecolor及两段精简骨骼动画；原许可证、SHA与派生记录齐全，角色头部/颈/斧为本项目原创代码。该试装不是Leo，没有购买或复制Leo素材/商品图片进应用；样片只在`?art=character-motion`加载，不自动替换既有农场。下面无外部骨骼资产的表述属于先前轮次。

第二版局部样板增加`npr/leaf-bough-v2.png`原创AI生成透明叶枝图及程序化曲干/根系，人物开脸/工作服/连续弯曲肢体、有限相位动画和局部细草/小花均由代码增量制作。完整提示词/来源见同目录provenance；没有复制参考视频、购买GLB或录制真人，仍未完成全农场美术或最终用户验收。

2026-10-22新增**局部**NPR样板：代码几何与共享Soft Toon材质，配合`npr/pastoral-atlas-v1.png`原创AI生成手绘图集。完整生成提示词、来源、哈希与边界见[`npr/README.md`](npr/README.md)及provenance.json。未使用参考视频像素，不代表全农场或视频级美术已经验收；默认旧入口保留，样板入口为`?art=npr-sample`。下文为旧v2与Phaser阶段历史。

2026-10-21用户批准“精致、温暖的卡通3D农场”增量精修。当前v2使用`src/game/world/{models,environment,resources,surfaces}.ts`：圆角人物/NPC和车架，树皮/年轮/木板/布料/屋瓦/土壤/砂土路/岩石/植被/水面/接触阴影共11种128×128本地程序纹理，按类型共享并在场景销毁时释放；草地主面用确定性的顶点颜色表现明暗，避免大面积纹理采样。没有下载第三方模型、贴图或字体，也未使用参考图像素。圆角几何与几何合并使用锁定Three.js包自带工具，遵循仓库中已保存的MIT许可。

当前相机、动作、五段木材编号、模拟开关及摄像头输入链路继续沿用。程序纹理在本机初始化时由原创代码生成并打包在应用中，没有独立图片请求或需要额外下载的美术包；`assets:sync/verify`仍校验原静态文件和依赖，本轮纹理共享/释放、造型预算与实际浏览器效果另见单测和`artifacts/qa/art-polish/`。方向批准不等于最终画质或真机验收。

2026-10-21当前入口已按用户批准设计改为原创真3D：`src/game/world/{models,environment,resources}.ts`生成关节人物/NPC、树木五段、手推车/绳索、农舍、田地、果树、森林和远山，未引入外部模型/贴图/字体。Three.js许可单独记录于`public/licenses/three-LICENSE.txt`及`docs/DEPENDENCIES.md`。下文SVG/Phaser清单属于保留的T05历史；当前只有奖励T恤SVG继续在结果UI使用。方向批准不等于最终美术验收。

2026-10-15：本项目任务中新绘制的原创代码/矢量资源；不含第三方游戏截图、字体、贴图、外链或付费素材。随项目源码提供使用和修改；没有额外第三方美术许可依赖，项目整体分发许可由项目所有者决定。

- `farm-landscape.svg`：天空、远景林带、草地、农舍、菜畦、果树、围栏、道路、工具棚和花草。
- `harvest-shirt.svg`：叶芽徽章 T 恤奖励图标。
- `src/game/actors/FarmerActor.ts`：分层农夫、草帽、背带裤、关节姿态、斧头。
- `src/game/actors/HelperActor.ts`：原创“禾禾”机器人伙伴与预设协作表现。
- `src/game/actors/props.ts`：杉树、树桩、木材、手推车。
- 颜色定义：`src/game/assets.ts`。字体沿用系统字体，没有下载或嵌入字体文件。

参考边界：SOURCES.md 的文字说明用于农场氛围、挥砍/搬运动作和手推车要求。本机缺少 sources/ 下三张参考图与原始 DOCX，未声称对图逐项比对。没有将参考截图拆成精灵。

历史T05待办中的音效/静音已于T10实现；本轮真3D方向已批准，最终美术与节奏仍manual_pending。UI任务小图标沿用系统符号。
