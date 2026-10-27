# 电脑前上半身正式训练与自动准备

用户先要求识别完成自动开始，说明远离电脑无法点击，随后要求能在电脑前做的上半身目标，并明确选择“替换农场正式训练动作”。因此本轮以电脑前上半身方案作为摄像头默认输入，不继续实现原九步全身自动采集方案。

正式流程仍为砍树→装车→持姿运送→结算，原3×5挥砍、15装车、60秒持姿、库存和奖励守恒不改；动作输入改为双手放下→举到舒适高度→放下的完整循环，持姿采用双臂前举。保留可显式选择的原全身方案与原断言/负例。键盘与自动模拟仍单独标识，默认无摄像头演示与明确视频权限行为不变。

上半身只要求11–16肩肘腕六点，按双肩距离归一化；不要求头/髋/膝/脚入镜，不伪造腿部数据，不改原全身特征/门槛。独立UpperBodyStream保留原0.6置信度、200ms间隔、300ms年龄、乱序/未来/移动/缩放/尺寸保护，输出raw与平滑的双侧手腕/肘。独立自动准备按放下、举起、前举持姿三个稳定样本收集，固定1200ms且至少12个真实新样本；旧姿态不能冒充下一步，低质量/断档清样本，不按墙钟补时。准备仅在内存，不计运动成果。

大字提示当前目标/采样进度；点击一次开启摄像头，准备完整后自动倒计时开始。初次setup自动开局或本次摄像头入口自己造成的user暂停可在准备完成后解除；已有手动/动画停止/教学/后台/跟踪错误暂停均保留，失效后的重新准备不自动恢复训练。重新开始或停止清自动许可，旧回调不得开局。原手动全身准备与开始保留。

上半身Recognizer输出原ExerciseSignal与阶段协议，不写领域状态。双臂均达标并回到低位才完成一次，确认/最短/最长周期及宽松度固定保护沿用。Carry仅相邻有效持姿样本计时，放下/任一臂失配/丢失立即停止。红绿反馈只标双肩肘腕，未知灰；当前任务教学和常驻示范切换为上半身版本，无下蹲要求。游戏人物表现仍使用既有农场阶段，不宣称连续动捕。

## 并行接口

- `src/pose/upperBody.ts`: `UpperBodyVector { left:{x,y,elbowDeg};right:{x,y,elbowDeg} }`，腕相对同侧肩、双肩像素距离归一化。
- `UpperBodyFeatures extends UpperBodyVector {frameId,capturedAtMs,width,height,center:{x,y},scalePx}`。
- `UpperBodyProfile { lowered:UpperBodyVector;raised:UpperBodyVector;hold:UpperBodyVector;reference:{width,height,center:{x,y},scalePx} }`。
- `UpperBodyStream(config=recognitionConfig, reference?:UpperBodyProfile['reference'])`: `read(frame,nowMs):{raw:UpperBodyFeatures;smooth:UpperBodyFeatures}|null`，`reason:string|null`, `reset()`。
- `UpperBodyPreparation`: `accept(frame,nowMs)`, `tick(nowMs)`, `reset()`, `getProfile():UpperBodyProfile|null`, `getSnapshot():{step:'lowered'|'raised'|'hold'|'complete';progress:number;available:boolean;reason:string|null}`；默认只推进真实连续稳定样本，自动三步。
- `UpperBodyRecognizer(profile,task,config)` 实现原Recognizer，含getFeedback。CameraActionSource新增setUpperBodyProfile，原setProfile和旧模式测试保持。
- `ExerciseTutorialPanel.setUpperBodyEnabled(boolean)` 与 `MovementGuide.setUpperBodyEnabled(boolean)` 切换对应教学/示范，并保持原暂停门禁。

## 验证

先RED后实现：六点有效但腿部不可用、单臂/半次/未复位不计次、所有档质量/时序负例、准备不能同姿态自动通过、Carry无补算；完整浏览器上半身流程不点采集/开始、自动权限禁止、旧暂停不误解除、旧全身回归。先备份QA，旧路径SHA恢复；保留此前未提交识别设置/颜色工作，不提交/push/部署。
