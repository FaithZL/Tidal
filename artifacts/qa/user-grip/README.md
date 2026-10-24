# 第7版握斧与缓冲回收局部样片

2026-10-22。仅独立`?art=character-motion&rev=7`，没有扩全农场、改领域/输入/依赖/锁文件或原FBX。普通默认模拟和真实输入偏好保留，样片不请求摄像头、不计成果。

- `baseline-*`：接手typecheck与345单测基线。
- `motion-*-red.log`、`head-absorb-red.log`及GREEN：真实原斧穿桩、抽出顺序、体态延迟、握轴错误与头部速度跳变。
- `elbow-note.md/shoulder-grip-*`：真实肘/肩漏权与修复；中间失败不重标绿。隔离旧Motion与当前Motion的源码SHA分别记录，不当同一对照。
- `hand-audit.md`、`final-hand-surface-statistics.json`：实际原指面接触、raw压力四档、七姿态蒙皮面、局部面积/原朝向、原件/UV/手外法线/资源保留；不是逐指三节骨架或全自交证明。
- `motion-audit*`：旧回收实际几何穿木；`motion-contact-review*`为记录SHA版本的密集三角采样，不冒作最后又全跑的解析碰撞证明。
- `typecheck-final.log/lint-final.log/unit-final.log/build-final.log/assets-final.log`：最终369/369单测、49文件、类型/lint/构建/素材校验通过。首次prefer-const失败留在`lint-first.log`。
- `e2e-final.log`：指定新模型9＋旧动作8＋NPR10＋默认模拟5，32/32、1.6分钟；没有全跑所有E2E或完整verify。
- `final/`：最终生产Three.js实际截图、18.68秒实录、解码帧和metadata，0页面/控制台异常与外源。录制段为原速正常时钟；25fps只为编码率。窄屏只是桌面视口。
- `first-render/second-render/`：早期几何校正诊断，不能当交付版。`qa-before-regression/`为5张历史QA备份，重生成本轮图存`regression/`后旧图已按SHA恢复。

入口`index-D08wYbcD.js`，样片`userModelSample-6S0FYXKr.js`。复现：`npm run build`→`npm run preview -- --host 127.0.0.1 --port 4176 --strictPort`。截图/视频脚本为`capture-grip.mjs`，设置`TIDAL_GRIP_QA_DIR`选择新目录、`TIDAL_GRIP_RECORD=1`启用连续录屏。

原低模角面/棕色烘焙仍在，指面为局部corrective而非重新雕刻。最终自然度、完整碰撞、真实摄像头/手机/GPU、公开再分发许可仍待确认；无购买、提交、push或部署。
