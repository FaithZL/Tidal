# 真3D分支一次独立审查

2026-10-21。全新上下文独立只读审查，范围`0baf882..ac2f28c`，没有启动第二套浏览器或改文件。结论：0 Critical、2 Important、0 Minor。主执行者在同一修复批次处理两项，不进行二次审查。

## Important 1：图形失效后隐形推进

`webglcontextlost`只增加可被“继续/P”解除的用户暂停，画面已永久停绘，但输入源可重启。先强化浏览器回归：分别键盘与自动模式，失效后按P/Space、直接派发继续按钮事件，必须冻结计数/时间，重置后仍禁止重新开始，需刷新恢复。

RED：`review-browser-red.log`两项失败；键盘回到训练中，自动模拟甚至进入结算。最初测试使用固定定位页面的零高body.click而超时，经trace确定为测试定位问题后改为失焦焦点操作，随后上述真实断言失败；未以超时当作业务复现。

GREEN：统一renderUnavailable门禁覆盖active、syncSource、信号接收、camera回调、tick、开始/恢复/切源入口；停源/释放摄像头，保留重置退出。`review-browser-green.log`2/2通过（7.6秒）。

## Important 2：被拒绝循环的飞木残留

原LoadRecognizer实际合成回放：standing400→squat250→press250→standing600，50ms采样，发出load-return但因不足800ms不提交，在同epoch发新rep ready。旧未提交flight本来不会消失，导致下次拾木/抛木仍停在旧车内落点。

RED：`review-unit-red.log`1失败/10通过，预期ground实际flight。GREEN：新rep清理未提交flight，已提交flight继续跨任务完成；下一正常循环测试实际从新hand anchor抛出，数量仍15。`review-unit-green.log`完整170/170通过。未改原识别器或领域规则。

修复提交：`03e249a`。typecheck/lint通过；最终完整回归与生产结果另见`verify-final.log`、`production-auto-flow.json`。

## 未裁决与处理

- 物理摄像头准确率、真实PiP连续播放、真实动作延迟：无设备，manual_pending。
- 完整回归/生产整局/性能：独立审查没有重复执行，采用主执行者实际日志，不能把静态审查当作性能通过。
- 最终美术、动画自然度、绳索贴合与交互阻尼：已查看自动截图，只记录技术观察；产品批准manual_pending。
- 驱动特有异常、运行中分配失败、后台缓存恢复及硬件GPU趋势：测试仅覆盖明确注入的初始化失败/上下文丢失与既有释放回归，其他设备场景manual_pending，不扩写为全部通过。
- 未变识别器的真人精度：保留原合成负例回归与限制，不从此次接口审查推断真机已验收。
