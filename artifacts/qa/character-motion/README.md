# 人物局部动作样片证据（2026-10-22）

用户批准Leo日式青年方向，要求先确认格式/授权，购买前告知，只审阅站立—挥砍—回收。本目录为本地技术试装，**不是Leo原模型/最终画质，不是摄像头识别或运动计数**。没有购买、联系作者、推送或扩展全农场。

- `leo-terms.md`：官方公开FBX/PNG/.anim目录与Unity跨引擎/分发许可边界；公开网页GLB/仓库许可仍待明确。
- `asset-inspection.json`：Quaternius对应Standard明确CC0，原始采样字节、local URI与9文件SHA检查；完整来源与许可在`public/assets/character-motion/`。
- `e2e-red.log`、`e2e-first.log/e2e-second.log`：最初缺样片入口；集成路径重复拼接导致SPA回退200不是GLB成功，修正后通过。
- `paused-redraw-red.log`：实际draw计数6→6复现暂停切姿态不绘制；修复后断言真实绘制增加。`review-red.log`还记录缺时间轴的RED。
- `entry-red.log/entry-green.log`：模块延迟/下载失败两项RED，inert加载门禁/可重载失败UI后通过；原首页、模拟开关与样片14项定向通过。
- `verify-interrupted.log/entry-failures/`：最初完整轮因首页早期点击失败被主动中断，不作通过。
- `verify-final.log/steady-state-failure/`：完整轮270单测、66/67 E2E，唯一稳态HUD测试覆盖了初始化，verify退出1。
- `final-recheck.log`：等待显式boot ready后测稳态，保留0变更/节点保留断言；7样片＋2渲染测试9/9通过，覆盖最终位图释放代码。67 E2E分批通过，没有一次完整verify退出0。
- `unit-final.log/typecheck-final.log/lint-final.log/assets-final.log`：最终271单测（38文件）、类型/lint与9素材校验通过。`build-final.log`为最终显式构建通过，共享674.66KB警告仍在。
- `capture-final.log/capture.json`：实际最终生产构建、正常样片时钟录制；0页面/控制台异常、0外源。
- `motion-preview.webm`：16.48秒、1366×900实际录屏副本，没有加速；25fps为编码规格，**不是游戏帧率**。`stand-chop-recover.webm`为同一原始录像；`raw-video/`留各次录制原件。
- `standing.png/windup.png/strike.png/recovery.png`：可见时间轴选0.80/3.40/3.77/4.50秒，暂停并断言实际阶段后保存。最初异步暂停曾把3.9665秒回收图误取为strike，最终图已重拍纠正，不以原错图作证。
- `video-metadata.json/video-frames/`：最终412帧实际解码和抽帧检查，不能据此推导动作自然度或60fps达标。

视觉限制：当前头发/脸型为原创临时模型，肩部衣袖接缝和偏长细颈仍待修整。脚底为真实蒙皮鞋底的垂直接地校正，不是完整脚部物理/IK锁定；握持为右手附斧＋左臂解析校正，不是碰撞/负重系统。没有真人、硬件GPU或本轮独立性能基准，原农场P01 fail不变。启动、下一步和真实结果以最新PROGRESS为准。
