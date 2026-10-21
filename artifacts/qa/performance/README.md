# 2026-10-21 演示流畅度证据

基线`5f5579f`，同一台机器、Chromium156.0.8078.4、1366×900 CSS像素、DPR1、实际ANGLE SwiftShader软件渲染。正式构建，正常5/15/60时长，默认自动模拟；没有真实摄像头。`scripts/profile-demo.mjs`预热10秒后采样至少60秒，不跳过业务、不改时钟。不要在采样时同时运行其他浏览器或测试。

| 构建/证据 | 平均rAF fps | p95帧间隔 | 说明 |
|---|---:|---:|---|
| baseline.json | 40.47 | 33.4ms | 原始index-DNN17GvQ，原始分辨率 |
| optimized-full-resolution.json | 39.12 | 33.4ms | DOM去重+全局合批；绘制调用减少但远端几何不再有效裁剪，未改善fps，保留失败实测 |
| optimized-adaptive.json | 54.64 | 33.3ms | 空间合批+第一版适配，1.2秒/19.5ms门限漏掉短动作 |
| final-profile.json | 57.24 | 16.8ms | 400ms/17.5ms，慢帧数量门禁过严，约55fps漏刷新模式被排除；这是中间候选，非最终数据 |
| final-confirmed-profile.json | **59.74** | **16.7ms** | 最终index-w4yGvhR9，3585样本/60.0143秒；慢帧数量门禁修复后，0次>50ms，0异常/外源 |

最终相对原始基线提高约47.6%；装车和第二段休息约60.00fps，第一段休息59.67fps、挥砍59.09fps。最终采样比例1→0.64→0.512，结束时3D实际699×460、CSS仍1366×900；这是有清晰度代价的自适应结果，**不能写成同分辨率达到60fps**。文字、PiP视频保持原分辨率；硬件GPU/真人推理与端到端性能未测。rAF不是显示器实际呈现每个像素的证明，静态帧可以复用。

CPU对照：原始60秒LayoutDuration0.781264秒/2436次，最终0.024931秒/164次；原始ScriptDuration2.802556秒，最终3.842999秒（更高帧数与诊断计数也有成本），TaskDuration46.825134→39.158413秒。没有把单项下降当作所有CPU开销都下降。

`diagnose.mjs/json/log`是原始构建的三种8秒首休息对照：原版32.43fps、仅去背景模糊32.49fps、诊断中把3D渲染比例减半60.00fps。后者明确是定位实验，不是产品设置、真实摄像头或最终验收；产品没有改写devicePixelRatio，使用真实帧耗时选择画布像素比。没有依据实验去掉背景模糊。

原始baseline计数器字段`renders/drawCallsPerRender/trianglesPerRender`历史命名不准确：它统计COLOR_BUFFER清除（包含阴影等pass），不是呈现帧。后续脚本改称`colorClears/*PerColorClear`；原JSON保留，没有回写原始数据。只有独立rAF间隔用于fps；CPU绘制API提交时间也不等于GPU执行时间。

RED→GREEN日志分别覆盖静态数量/变换保全、远端裁剪、HUD不变时零修改和动作提示即时更新、分辨率边界/暂停/静止/尖峰/短动作/漏刷新。`review.md`记录一次独立审查及处理。最终完整回归与正式整局以`verify-final.log`、`production-auto-flow.json/log`为准。

最终回归：183/183单测、49/49浏览器测试（6.1分钟）、类型/lint/构建通过，资源校验另通过。生产整局141.930秒，正常5/15/60，15/15/60、到家15、奖励100/100、重置通过，0页面异常/外源/姿态资源请求。整局预热后7701样本/131.3447秒，**58.63fps，p95 16.8ms，max33.5ms，>50ms 0**；与独立60秒窗口不同，均报告，不择优混用。`production-{setup,running,carry,results}.png`为实际截图，已查看训练/运送/结算；3D边缘软化可见，HUD与PiP可读，最终美术签字仍待用户。

复测：先`npm run build`，保持`npm run preview -- --port 4175 --strictPort`；再`node scripts/profile-demo.mjs`。如需新目录，设置`TIDAL_PROFILE_OUTPUT`。正式整局另设`TIDAL_QA_DIR`与`TIDAL_BLOCK_EXTERNAL=1`运行`node scripts/verify-auto-demo.mjs`；浏览器阻断外源不等于物理断网。
