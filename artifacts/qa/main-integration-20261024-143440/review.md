# 两席独立只读合并审查

范围：`a45116b8fea9d696f482c936a4aabaf79c597f0c`至`8b96cb91fb0da5c8eea0d25c69edec08b96be791`。两席均未修改工作树/index/HEAD/分支，未运行安装、测试或浏览器；运行验证由主执行者串行完成。

## 运行链席：Ready to merge — Yes

未发现Critical/Important。核对到：

- entry将人物样片独立动态导入；默认用户样片不初始化SessionController、摄像头、ExerciseSignal或模拟偏好。
- FarmWorld同时等待图集和两份模型；加载失败、重置与上下文丢失后，迟到完成不能重新启动。
- UserHouseMount、UserStaticCharacter与样片对每个模型的迟到成功执行清理，避免Promise.all提前失败后遗留另一份资源。
- FBX加载等待内嵌图像、拒绝外部贴图、撤销blob URL，区分人物与房屋错误。相应负例和门禁测试实际存在。
- 场景仍只消费权威快照/效果，无业务进度旁路。

保留两个Minor：

1. `src/characterSample.ts:30–31`：prototype页pagehide永久dispose，缺少`pageshow.persisted`重建。若命中BFCache，后退可能显示已释放页面；建议先复现，再参考默认用户样片的persisted reload或完整重建。
2. `src/characterSample.ts:28–30,44`：局部sun.shadow没有纳入显式统一释放，也未forceContextLoss。建议将阴影目标纳入所有权与释放路径；未声称实测到GPU泄漏量。

未评判：最终美术/自然度、逐指三节绑定、自碰撞、真实摄像头/手机/硬件GPU/60fps；均属于已明确的试作边界、人工待验或既有fail。没有凭代码阅读推断历史ERR_NO_BUFFER_SPACE的系统根因。

## 素材、迁移与子路径席：Ready to merge — Yes

未发现Critical/Important或需阻止合并的Minor。直接从受测Git对象核对：

- 九份CC0、两份FBX与两张NPR图的字节及SHA均匹配provenance。
- FBX为完整Kaydara Binary 7400，3,149,804/3,391,244字节，不是LFS指针；GLTF的BIN/两PNG引用都已入Git。
- `.gitattributes`冻结character-motion原字节；使用只读`git cat-file --filters`分别设置core.autocrlf false/true，9项×2共18/18字节与SHA一致。
- 依赖、锁文件、MediaPipe JS/WASM、模型与同步脚本相对base无变化。
- 用户FBX保留未知公开许可标识；CC0原型有三份原许可，NPR来源单独记录，未混称CC0。
- 子路径覆盖prototype与默认派生骨架，禁止外源/旧素材混用/训练画布，静态对照另有测试。

未判为新缺陷：两个历史QA脚本的旧机输入路径已记录且不在应用/npm链；provenance旧机sourceFile仅为来源信息。README/PROGRESS需在集成记录中说明main接手方式，历史结果保留。公开再分发许可及真实设备/美术待验状态不因合并而改变。
