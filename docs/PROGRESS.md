# Tidal 开发进度（2026-10-21，用户批准的真3D升级）

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
