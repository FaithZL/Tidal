# 本轮最终只读审阅（2026-10-22）

结论：在这次人物局部改造范围内，未发现 Critical / Important 问题，可以交付用户继续审阅。此结论不构成最终美术批准，不称视频同款角色、Leo成品、完整布料碰撞、真人识别或性能验收。

## 审阅范围与实际操作

读取 `src/game/world/sampleHead.ts`、`sampleCostume.ts`、`sampleCharacter.ts`、`src/characterSample.ts`，以及对应的6个CPU单元测试文件和 `tests/e2e/character-motion.spec.ts`。同时读取共享 `WorldResources`、`NprPalette` 的分配/释放实现。没有编辑源码、运行GPU浏览器或执行Git变更；只新增本审阅记录。

已实际查看生产截图 `artifacts/qa/video-character/final/` 下的：

- `portrait.png`
- `standing.png`
- `back-standing.png`
- `back-windup.png`
- `strike.png`

读取同目录 `capture.json`，记录为本地4176生产样片、Chromium 156.0.8078.4、入口 `index-BqtD090n.js`，四姿态时间为0.8/3.4/3.95/4.95秒，记录中页面错误与外源请求均为空。这是读取捕获结果，不是本审阅者重新运行浏览器。

本审阅者独立实际运行：

```text
npm run test:unit -- tests/unit/sampleHead.test.ts tests/unit/sampleCostume.test.ts tests/unit/sampleCharacter.test.ts tests/unit/sampleShoulder.test.ts tests/unit/sampleMotionContinuity.test.ts tests/unit/characterSampleClock.test.ts
```

2026-10-22 19:55:27开始，退出0；**6文件、50/50测试通过，2.31秒**。未在本次审阅重复全量E2E、类型、lint、构建或性能检查，未将此前结果冒作本审阅者执行结果。

## 契约与所有权

- `sampleHead.ts`的共享静态网格/材质由 `WorldResources` 缓存并释放，头部合并时会释放临时几何；相同资源主人的重复头部共享分配，单测覆盖唯一释放。
- 新围巾/背带/皮包使用 `WorldResources` 管理。围巾领口挂 `neck_01`、短后摆/背带挂 `spine_03`、皮包挂 `pelvis`，装配时在实际模型绑定姿态上拟合背部表面。CPU测试覆盖真实动作中的有限边界、贴背距离和固定局部挂点；这不等于物理布料碰撞。
- 导入GLTF的原几何、派生前臂/袖子几何、toon基材质与各衣物独立retint材质由 `SampleCharacter` 持有。retint保留贴图对象与UV，shader程序键区分衣物类别；原贴图/共享ImageBitmap仍由actor唯一关闭。正常销毁与共享资源分离有实际测试。
- reviewed入口只建立局部Three.js场景和表现时钟，没有导入或写入SessionController、库存、输入源、摄像头、MediaPipe或模拟偏好。面部镜头/暂停/旋转/时间轴仍局限于表现。浏览器测试中“不加载摄像头链路”和“不改已存输入偏好”断言保留。
- 不能据上述文件内的隔离结论声称本次审阅逐文件比对了整个工作区的全部既存未提交修改；本审阅没有修改其余文件。

## 原负例仍有效

- `sampleShoulder.test.ts`仍把未经裁接的真实原始袖子放回同一肩帽区域，要求交叉检测大于0；结构修正后72个时钟采样与附加边界保持袖帽/前臂皮肤交叉为0。未以改色、隐藏袖子或放宽为全身无穿插来代替原肩缝检查。
- `sampleMotionContinuity.test.ts`仍保留强制从impact直接切idle的负例，要求手腕/斧刃产生明显跳动；正常阶段边界与IK启用/释放边界均继续检查连续性。
- 时钟仍有暂停、负/无效/超长间隔不补算、回收不重举、下挥速度不超源动作的约束。
- 新围巾测试不仅检查正常不穿脸，还将领口上移15cm，要求相同真实三角检测捕获穿插。
- 新刘海将旧额头0.335处的可见断言移动到更低的0.310处，理由写在测试中；两眼在正面/三分之四/仰视的原可见检查保留。不能将所有额头始终可见当作这轮新刘海的目标。

## 视频参考与最终画面的边界

本审阅者之前实际查看用户视频及临时抽帧，详见同目录 `visual-audit.md`。米衣砍树青年约10.5–19秒主要是背面/右后方三分之四；11/12/14.5秒能确认碎发外轮廓、红棕围巾、浅色卷袖、背带与灰绿裤靴，但没有清楚正脸。0.5/1.97秒可见的正三分之四属于另一位更Q版蓝衣角色。当前五官应表述为按视频整体青年语言补足的原创设计，不是已确认米衣角色脸型的复刻。

最终截图确实呈现了深栗棕发、缩短的下半脸、红棕围巾、浅色袖子、灰绿裤子、后V皮带与皮包；背部/举斧图没有明显新增脱落配饰、悬空发束或围巾穿脸。前后视图对照比只看正面小图更有判断价值。

以下是美术限制，非阻止交付本轮局部审阅的程序问题：

- 发顶及前刘海仍有较完整的帽壳与纵向大束感，尚未达到视频中更低圆、蓬松、不规则的碎发轮廓。
- 围巾前部仍偏硬挺，颈后在背视图仍显长；当前衣物源模型的深色袖带/前襟和靴型也保留明显自身风格。
- 截图能证明所展示姿态的观感，不能证明整个连续动画没有任何细小重叠，也不能代替用户对脸/发/动作的审美选择。

参考视频像素仍只用于TEMP分析，没有作为本轮生产纹理/网格加入应用；本审阅未发现新增第三方下载、购买或摄像头采集行为。

## 本次审阅源码快照

| 文件 | SHA-256 |
|---|---|
| `src/game/world/sampleHead.ts` | `BA4F51BEB8CDC2E0ED4EF5A910D74B21F52B0CAEAB6BEEB198A2FAACB7F2531E` |
| `src/game/world/sampleCostume.ts` | `7B56DBD5B4CFB64C9849783701AB013F96FE95260DD9E1B26DDD3DE3EC6665EA` |
| `src/game/world/sampleCharacter.ts` | `3D0F9078E21BB03AB989D346656CEBCA14E5D998DA3324E95529A808167B8149` |
| `src/characterSample.ts` | `87EAFBD704BECA590F67F15EC4A4A97CC7AB405235510961061E85C54496E631` |
