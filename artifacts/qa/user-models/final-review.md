# 用户模型替换：最终只读实现审阅（2026-10-22）

本次审阅由独立代理执行，只读源码、测试及仓库状态，没有修改应用、启动GPU/浏览器、安装依赖或执行Git写入。父代理正在独立运行实际截图与E2E；这里不冒称已代其运行或完成视觉验收。

## 结论与发现

**未发现需要阻止当前本地模型样片交付的Critical / Important问题。** 静态限制写入界面与类型，原动作样片需显式选择；默认农场和训练领域未被替换为另一套业务实现。以下有一项不阻塞本地查看的错误归因问题，已直接通知父代理。

- **P2，人物非HTTP错误会被说成房屋错误**：审阅时`src/game/world/FarmWorld.ts:87`仅保留“美术样板贴图加载失败”和“用户人物模型加载失败”文本，其余一律换成“用户房屋模型加载失败”。`loadUserModel`在人物贴图解码、外部纹理或几何无效时会抛无kind的其他错误，所以人物损坏也会显示房屋失败。建议在loader抛出时带人物/房屋kind，或分别给loading promise加前缀，再让FarmWorld保留准确消息；错误仍需显式显示并保持开局门禁。这里是代码路径可直接确认的归因错误，**未声称已在GPU浏览器故障注入复现**。

## 逐项审阅

### 静态人物与旧动画

`userModel.ts`返回`motionSupport:'static'`，`UserStaticCharacter`只接世界位置和yaw，不伪造关节动画；它忽略chop姿态、只提供标明近似的静态握点。`userModelSample.ts`在页首、状态、说明、footer明确无骨骼/固定砍姿，不出现重播动作按钮，也没有用整体晃动冒充肢体动画。原动作通过`model=prototype`显式链接保留；`entry.ts`只有该参数才导入旧characterSample。

这符合源模型实际无骨骼/权重/动画的检查事实；**不代表人物已完成站立、挥砍、回收、推车、握持自然动画**。农场样板中固定人物随业务位置移动、木材握点为近似值，应继续保留这一限制。新增测试覆盖源mesh不是SkinnedMesh、0clips、输入pose变化不改变模型姿态。

### 异步失败、迟到完成与资源

- `userModelSample.ts`对人物/房屋分别注册完成处理；一个失败会释放已成功的模型，迟到成功在`failed/disposed`分支立即释放，避免Promise.all提前reject后漏掉另一份资产。
- `UserHouseMount`与`UserStaticCharacter`的dispose会同步关闭gate；迟到模型先检查closed并释放，不挂到场景。house成功后dispose移除父场景，重复dispose有门禁。相关unit覆盖pending、拒绝、late-success、重复dispose；静态人物也覆盖cancel后的late-success。
- 独立样片pagehide会撤销RAF和交互监听、释放两个模型、地面几何/材质、阴影、renderLists、WebGLRenderer和context；失败路径也调用同一幂等release。pageshow从BFCache恢复时重载，避免保留已销毁renderer。
- FarmWorld在context loss、样板ready失败和destroy上释放两个mount；原共享WorldResources继续独立拥有原素材。没有混用用户FBX资源与缓存程序素材的释放归属。

### 内嵌图像与blob URL

`loadUserModel`先fetch本地FBX，再同步parse；LoadingManager等待已启动图像全部完成，onError会记录解码错误。setURLModifier只允许blob/data引用，明确拒绝外部纹理路径。实际两份源文件每份4个Video与4个Texture一一连接，所以4张blob都会经过该manager。`finally`在图像完成后revoke收集到的blob URL，避免在HTMLImage解码之前过早撤销。

成功prepare保留原UV、basecolor/normal对象，替换原Phong材质并明确忽略镜面；重复dispose只释放一次几何、替换材质和被引用的maps。图像若为可close对象会去重close。源roughness/metallic仍随原文件保留，但未用于本轮Toon，不冒称完整PBR。

审阅依据包含锁定Three.js本地FBXLoader/TextureLoader流程。**新unit本身没有逐次计数实际浏览器blob revoke或损坏图片解码**，浏览器正常成功、HTTP失败和截图应与这些代码检查分开记录；不应仅凭HTTP200/CPU解析就称材质视觉通过。

### 默认入口、领域及来源

`FarmWorld.sample`仍仅在`art=npr-sample`启用；无art默认场景不创建NprPalette/UserHouseMount/UserStaticCharacter。独立`character-motion`不导入browser/controller/camera模块，不改demo偏好；链接返回农场保留已有路径。样板在两个模型/贴图ready前保持开局门禁，失败不静默换旧模型。

实际`git diff -- src/domain src/input src/config package.json package-lock.json`为空。默认模拟/真实摄像头切换没有在新模型模块内重写，业务次数/库存/奖励仍由既有controller管理。检查不替代父代理的默认流程回归结果。

`public/assets/user-models/`两份副本此前已实际逐字节比对和hash复核；provenance/README没有将用户提供素材标为CC0，明确原作者/公开再分发许可未提供，不包含元数据源绝对路径。本轮没有自动Git提交/push、采购或部署。

## 测试审阅范围

已读：`tests/unit/userModel.test.ts`（5项）、`userHouseMount.test.ts`（4项）、`userStaticCharacter.test.ts`（2项）、新`tests/e2e/user-models.spec.ts`（4项）、旧动作测试的显式prototype路由和deployment子路径新增检查。父代理报告上述11项新单测以及类型/lint/build通过；本审阅没有重跑或把父代理尚在进行的E2E记为通过。

新增E2E覆盖静态标注/镜头切换/不启动输入、FBX HTTP失败、开局等待人物、房屋失败门禁；子路径检查两个FBX地址与prototype链接。它们验证模型接线与诚实状态，不是新人物动态动作或真实摄像头验收。后续自然动画需要骨骼/权重/绑定单独工作；真实摄像头、真手机和硬件GPU继续按实际结果标`manual_pending`。

## 修正后追加复核

父代理按真实RED修正后，本审阅再次只读查看`userModel.ts`、新增第6/7项单测及`models-final-green.log`，没有运行GPU或修改产品。

- **NaN几何资源释放已修正**：现在先扫描有效数值，遇invalid先`release(source)`再抛出，而非在traverse回调直接抛导致未清理。第6项使用真实BufferGeometry的NaN顶点，并断言几何/原材质各dispose一次；RED保存在`invalid-model-red.log`，源代码与断言一致。
- **上述P2的网络、HTTP、parse/decode归因已修正**：loader统一构造人物/房屋前缀；网络fetch reject、HTTP非ok、解析/图像失败均携带kind。第7项保留网络拒绝与HTTP200但非FBX的负例，验证都显示“用户人物模型加载失败”；实际RED在`failure-kind-red.log`，不再借房屋错误兜底这些情况。
- `models-final-green.log`实际记录3文件**13/13通过，227ms**；这是父代理执行且本审阅读到的日志，没有冒领为审阅代理重跑。新增测试afterEach恢复mock并unstub globals，未污染全局fetch到后续测试。
- 仍发现一个同类非阻塞边界并通知父代理：此时`response.arrayBuffer()`在带kind的try/catch外，HTTP头成功但body流中断可能仍无kind。它不影响已经修正的常规fetch/HTTP/parse/decode路径；若后续一并包裹，则可关闭这项归因问题。

父代理正在统一补充实际浏览器blob计数和context-loss后的late-success验证；该结果由其最终测试日志记录，本次只读复核未提前写为通过。

### body-stream边界关闭

最终冻结前再次只读查看源码及`stream-kind-red.log` / `stream-kind-green.log`：`response.arrayBuffer()`已单独catch并携带同一人物/房屋前缀；第7项加入HTTP200但读取body拒绝的负例。RED实际为缺少“用户人物模型加载失败”的stream错误，GREEN实际记录该文件**7/7通过**。因此前文唯一P2及其body-stream残余均已关闭；没有发现新的Critical / Important问题。本次仅核对源码/日志，没有重跑CPU/GPU或修改产品，审阅在此冻结。
