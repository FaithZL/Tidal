# 新人物本地派生骨骼与动作样片

2026-10-22，分支`codex/npr-farm-sample`，基于原有未提交工作增量实现。源人物FBX原字节、UV与图像未改；源无骨骼，当前17骨骼/蒙皮/IK为运行时本地派生，并非原作者动画、Leo或动捕。只接入独立`?art=character-motion&rev=6`，无摄像头，不计运动成果；普通农场模拟与手动真实输入规则保留。

- `baseline-*.log`：接手typecheck和320单测基线。
- `rig-*.log`、`motion-*.log`、`viewer-red.log`：真实RED→最小修复→GREEN，包含原手膝混权重、下颌、鞋底、轴向、均匀缩放与握点超出骨长等问题。中间日志不作为最终交付画面。
- `typecheck-final.log/lint-final.log/unit-final.log/build-final.log/assets-final.log`：冻结应用源码的完整345单测/47文件、类型、lint、构建与素材校验均退出0。没有重复npm ci。
- `e2e-final.log`：指定新模型8、原动作8、NPR10、默认模拟5，共31/31，1.5分钟；没有宣称全套E2E或完整verify。
- `final/`：实际最终dist截图、18.32秒连续Playwright录屏、解码帧及metadata。正常预览时钟，不加速；25fps为录像编码，非游戏帧率。390×844只为桌面Chromium窄屏，非实机手机。
- `capture-rig.mjs/capture-close.mjs`：以真实可见控件选暂停帧/缩放的QA脚本。全景脚本默认另存`first-render/`；设置`TIDAL_RIG_QA_DIR`选择目录，`TIDAL_RIG_RECORD=1`才录视频。`first-render/`为修权重/抬高手位之前的诊断，不是交付版。
- `mesh-audit.md/joint-suggestions.json`：源几何与关节地标只读诊断；CPU投影不是浏览器画面。`independent-review.md`、前后review JSON记录实际边伸长及源码SHA；三个原错误探针已恢复约0.976–1.123倍，仍有同链肘部约3.28倍局部伸长。并未证明全部网格无碰撞或完整手指包裹。
- `qa-before-regression/manifest.json`：5张旧QA的备份SHA；本轮31项测试重生成的画面转存`regression/`后，旧路径全部按备份恢复，不冒作历史原版证据。

最终入口`index-6FIOMvve.js`、样片`userModelSample-BCkvePYz.js`。本地服务为4176；复现用`npm run build`、`npm run preview -- --host 127.0.0.1 --port 4176 --strictPort`。

手指没有独立绑定，肘内侧过渡/握姿/工具62%缩放与最终美术仍待用户近景审阅。物理摄像头、真实手机、硬件GPU、公开再分发许可继续manual_pending；无购买、提交、push或部署。
