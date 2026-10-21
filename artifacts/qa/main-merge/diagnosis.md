# main 合入验证：合成挥砍输入时序诊断

日期：2026-10-21。范围仅为本轮合入验证发现的测试侧输入同步问题；不新增业务功能，不修改生产识别参数或领域逻辑。

## 首轮实际失败与证据局限

`verify-first.log` 记录 fresh `npm run verify`：208 项单测通过，浏览器 48 项通过、1 项失败。失败用例是 `source-lifecycle.spec.ts` 的 “a stalled camera during rest cannot start the next active task without preparation”。第 13 次挥砍准备阶段，`#chopValue` 期望 `13/15`，实际持续为 `12/15`，随后断言超时；该用例后面的停帧、下一阶段准备门禁断言尚未执行。不能将这次失败描述为门禁已经失效。

`stalled-error-context.md` 保存首轮错误上下文。首次失败的 `trace.zip` 在 Playwright 定向重跑时被清理，未保留逐帧捕获时间、识别阶段和间隔证据。原代码的定向复现 `stalled-reproduce.log` 随后通过：1 项，用例耗时 39.2 秒，总计 44.0 秒。因此，本轮不能确定首轮第 13 次遗漏的具体采样时序，也不能声称已经证明它由 396ms 循环或采样断档直接造成。

## 数据路径与可实测的边界

旧 `setPose` 只修改合成姿态，然后固定等待 450/500ms。生产 `SetupPanel` 约每 66.7ms 尝试采样，还要求视频时间已更新；`PoseWorkerClient` 同时只允许一个 bitmap/推理请求。测试 Worker 在收到帧请求时读取当前合成姿态，响应仍沿实际特征流、平滑器、识别器和领域控制器处理。固定等待时长不等于识别器实际观察并确认了每个动作阶段。

现有保护包括 EMA 时间常数 60ms、阶段持续确认 120ms、挥砍最短循环 400ms、最大有效样本间隔 200ms。最短循环从确认下挥到确认复位计算，不从测试发出姿态命令时计算。过短循环应被拒绝，且不必触发跟踪丢失。

新增单测 “a 450ms pose window can be a sub-400ms cycle after 15Hz sampling and must not count” 实际覆盖了这一边界：预热 raised 后以 66ms 间隔送入有效合成帧，2050ms 切换 down、2500ms 切回 raised。下挥在 2310ms 确认，2706ms 清除循环，两确认点仅隔 **396ms < 400ms**，断言没有计数、没有 tracking lost。对照将切回 raised 延后至 2570ms，断言恰好计数一次。`chop-sampling-boundary.log` 记录该文件 **12/12 通过**。

该测试证明固定 450ms 姿态窗口与采样相位可能冲突，并证明当前生产保护行为符合要求；它不补回已经丢失的首轮逐帧证据。

## 本轮最小修正

测试辅助函数 `completeSyntheticChop` 等待真实界面 `#inputDebug` 已报告 `ready`，再切换 down；等待真实识别阶段为 `chop-down` 后，再保持 `recognitionConfig.chopMinCycleMs`，最后切回 raised 并断言目标次数。两个需要完整 15 次挥砍的摄像头生命周期用例共享此辅助函数，避免按固定 sleep 假定动作已确认。

修正首先在停帧用例中定向验证：`stalled-synchronized.log` 记录 **1 项通过，用例 48.3 秒，总计 53.3 秒**。提取共享辅助函数后，最终`verify-final.log`实际 **209单测/49E2E（6.6分钟）、typecheck/lint/build通过**，停帧用例46.6秒通过；随后本地资源校验通过。没有把原代码定向通过当成问题已修复，也没有覆盖首轮失败记录。

未引入重试、假计数或时钟加速；未降低最短循环、有效样本间隔、跟踪失效门槛；原有停帧 observer、不得短暂进入下一 active、装车次数为 0 及其余负例断言均保留。生产源码与默认模拟/真实摄像头切换行为未因本修正改变。

## 验收边界不变

以上均为人工编写关键点、假视频和测试 Worker 的软件逻辑验证，不是真实摄像头或真实 MediaPipe 识别准确率验收。物理摄像头、真人标定/识别与端到端表现、硬件 GPU 以及最终美术和动作节奏批准继续标记 `manual_pending`。

当前已记录的最终美术版正常生产整局为 55.72fps，尚未稳定达到约 60fps 目标；验收 **P01 仍为 fail**。本轮合入及测试侧同步修正不改变该性能结论，也不把历史较高帧率或合成输入通过替代真机验收。
